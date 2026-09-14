/**
 * advisor-chain-guards.test.mjs — 第 11 批（评审/凭证链边缘守卫）用例表 1:1 落地：T-CG1–T-CG14（A–D——设计 §14.11）+
 * T-CG19–T-CG21（修正轮）+ T-CG15–T-CG18（E：冻结窗口——§14.14 E-7）。单测零网络、零真实 LLM（chat / 时钟覆写 =
 * 循环 seams——生产路径默认回退，不可达）、零长等待（T-CG13 零真实等待；T-CG20 ① ~0.1s = 真实墙定时器驱动）。
 * 断言判据全文 = docs/design/ADVISOR-CONVERGENCE.md §14.11 / §14.12 / §14.14 E-7/E-8。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { _runAdvisorToolLoop, advisorIncompleteMarker, runAdvisorReview, MAX_RESULT_CHARS } from "@thincoder/core/advisor/run.mjs"
import { compactMessages, shouldBudgetNudge, timeoutTail } from "@thincoder/core/advisor/compaction.mjs"
import { prepareAdvisorMessages } from "@thincoder/core/advisor.mjs"
import { buildObjectDeclarationBlock, buildDesignApprovalBlock } from "@thincoder/core/advisor/messages.mjs"
import { appendCitationReport, verifyCitations } from "@thincoder/core/advisor/citations.mjs"
import { settleDesignReview, settleAdvisorRun, inflightDesignReviewConflict } from "@thincoder/core/agent-tools/advisor-async.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "@thincoder/core/session-slots.mjs"
import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"

const tmpDirs = []
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })
/** 隔离临时工作区（引用解析 / dispatch 用例用；不动真实仓）。 */
function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "cg-"))
  tmpDirs.push(dir)
  return dir
}
const write = (root, rel, content) => {
  const p = join(root, ...rel.split("/"))
  mkdirSync(join(p, ".."), { recursive: true })
  writeFileSync(p, content, "utf8")
  return p
}
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
const STUB_PROVIDER = { name: "stub", baseURL: "http://stub.invalid", apiKey: "k", model: "stub-model" }
const mockTools = (executed) => ({
  schemas: [],
  byName: new Map([["mock", { name: "mock", execute: async () => { executed.push(1); return "tool ok" } }]]),
})
/** 脚本时钟（T-CG12/T-CG13）：第 n 次调用取 seq[n]（末值兜底）——零真实等待。 */
const clockFrom = (seq) => { let i = 0; return () => seq[Math.min(i++, seq.length - 1)] }

// ─── A：未完成判定族（谓词 / 结算）─────────────────────────────────────────────

const TAILS = {
  context_limit: "Advisor: context window limit reached (123456 tokens). Review incomplete — too many tool calls. Try a narrower scope.",
  turn_cap: "Advisor: stopped after 100 tool rounds — the review appears to be looping. You may retry with a narrower scope.",
  empty: "Advisor: empty response — review was inconclusive",
  interrupted: "Advisor: interrupted.",
  review_failed: "Advisor: review failed (timeout) — The model took too long. Try with a narrower scope.",
}

test("T-CG1 六 kind 全覆盖（块首行锚：尾不在首行也命中）+ 干净文本/空串 null", () => {
  const hitKinds = new Set()
  for (const [kind, tail] of Object.entries(TAILS)) {
    assert.equal(advisorIncompleteMarker(`Timeline body text.\n\n${tail}`), kind, `${kind}: 时间线 + 尾（尾不在首行）`)
    assert.equal(advisorIncompleteMarker(tail), kind, `${kind}: 裸尾`)
    hitKinds.add(kind)
  }
  // timeout：结构化尾（本批生成形态）+ 旧字面形态（族前缀同一）
  assert.equal(advisorIncompleteMarker(timeoutTail(600_000, 3, 12, true)), "timeout", "结构化超时尾")
  assert.equal(
    advisorIncompleteMarker("body\n\nAdvisor: review timeout after 600s. Partial results may be available. Try again with a narrower scope."),
    "timeout",
    "旧字面超时尾（前缀同一——零回归）",
  )
  hitKinds.add("timeout")
  assert.deepEqual([...hitKinds].sort(), ["context_limit", "empty", "interrupted", "review_failed", "timeout", "turn_cap"], "六 kind 逐一命中（全覆盖）")
  assert.equal(advisorIncompleteMarker("Round 1 — review complete. No issues found."), null, "干净评审文本 → null")
  assert.equal(advisorIncompleteMarker(""), null, "空串 → null")
  assert.equal(advisorIncompleteMarker(null), null, "null → null")
})

test("T-CG2 未完成不签发：settleDesignReview 剥 token + 提示 + 槽零写 + 实例不关", () => {
  const token = liveTok()
  const run = { reviewType: "design", designId: "did-1", round: 0, priorOutput: null, open: true }
  const agent = { _engDesignTokens: new Map(), _role: null }
  const report = `Findings text.\n\n[DESIGN-TOKEN:${token}]\n\n${TAILS.context_limit}`
  const settled = settleDesignReview(agent, run, token, report, { incomplete: "context_limit" })
  assert.equal(settled.passed, false, "未完成一律 passed=false（无论是否回显 token）")
  assert.ok(!settled.output.includes(token), "报告零 token 字面")
  assert.ok(!settled.output.includes("Approved."), "无 Approved 回显")
  assert.ok(settled.output.includes("评审未完成——token 未签发"), "未签发提示在位")
  assert.ok(settled.output.includes("reason: context_limit"), "原因 = kind")
  assert.ok(settled.output.includes("以更小范围重跑设计评审"), "恢复指引（缩范围）")
  assert.ok(settled.output.includes("agent.advisor.timeoutMs"), "恢复指引（调预算——N8 关键词）")
  assert.ok(settled.output.includes("不得按已核处理"), "补充检查口径句")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true, "实例不关（可重评）")
})

test("T-CG3 异步结算同结果：design entry 未完成 → 提示 + 槽零写", () => {
  const token = liveTok()
  const agent = { cwd: "C:/proj/cg", _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false }
  const entry = {
    id: 9, cancelled: false,
    run: { reviewType: "design", designId: "did-9", round: 0, priorOutput: null, open: true },
    designToken: token, report: `Findings.\n\n[DESIGN-TOKEN:${token}]\n\n${TAILS.turn_cap}`,
  }
  const settled = settleAdvisorRun(agent, entry)
  assert.equal(settled.stale, false)
  assert.equal(settled.passed, false, "未完成不签发")
  assert.ok(settled.report.includes("评审未完成——token 未签发"), "entry.report 含提示（digest 原样进）")
  assert.ok(!settled.report.includes(token), "报告零 token 字面")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(entry.run.open, true, "实例不关")
})

test("T-CG4 正常批准零回归：干净通过 + token 回显 → passed/槽写入/Approved 后缀 + 异步通过面 entry 计入", () => {
  const sessionsDir = mkdtempSync(join(tmpdir(), "cg-sess-"))
  tmpDirs.push(sessionsDir)
  _setSessionsDirForTest(sessionsDir)
  try {
    // ① 同步结算（纯）：无截断尾 + token 回显 → passed / 槽 / Approved / 实例关
    const token = liveTok()
    const run = { reviewType: "design", designId: "did-ok", round: 0, priorOutput: null, open: true }
    const agent = { _engDesignTokens: new Map(), _role: null }
    const settled = settleDesignReview(agent, run, token, `All good.\n\n[DESIGN-TOKEN:${token}]`)
    assert.equal(settled.passed, true, "干净通过（无截断尾）")
    assert.equal(agent._engDesignTokens.get("did-ok"), token, "槽写入")
    assert.ok(settled.output.includes(token), "Approved 回显 token")
    assert.ok(settled.output.includes("Approved."), "Approved 后缀在位")
    assert.equal(run.open, false, "通过关实例")
    // ② 异步通过面（零回归锁）：settleAdvisorRun 同结果 + D1 槽当场落盘 + entry 计入
    const token2 = liveTok()
    const agent2 = {
      cwd: "C:/proj/cg", config: { agent: { engineering: true } }, _sessionStart: "test-session", _slot: null,
      _slotMtime: null, _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false,
    }
    const entry = {
      id: 11, cancelled: false,
      run: { reviewType: "design", designId: "did-async", round: 0, priorOutput: null, open: true },
      designToken: token2, report: `Looks good.\n\n[DESIGN-TOKEN:${token2}]`,
    }
    const s2 = settleAdvisorRun(agent2, entry)
    assert.equal(s2.passed, true, "异步 settle 同一通过判定")
    assert.equal(agent2._calledAdvisorThisRun, true, "entry 计入（评审覆盖）")
    assert.ok(s2.report.includes("Approved."), "Approved 后缀在位")
    assert.equal(JSON.parse(readFileSync(slotPath("C:/proj/cg", agent2._slot), "utf8")).engDesignTokens["did-async"], token2, "D1 槽当场落盘")
    assert.equal(MAX_RESULT_CHARS, 64 * 1024, "拆分后既有导出常量在位（import 断言）")
  } finally {
    _resetSessionsDirForTest()
  }
})

test("T-CG5 code 守卫：时间线 + context 尾（尾不在首行）→ 不置 _calledAdvisorThisRun；旧锚零残留", () => {
  const agent = { cwd: "C:/proj/cg", _mutLog: [], _calledAdvisorThisRun: false, _advisorRound: 0 }
  const entry = {
    id: 3, cancelled: false,
    run: { reviewType: "code", designId: null, round: 0, priorOutput: null, open: true },
    designToken: null, report: `Round 1 review text.\n\n${TAILS.context_limit}`,
  }
  const settled = settleAdvisorRun(agent, entry)
  assert.equal(settled.stale, false)
  assert.equal(agent._calledAdvisorThisRun, false, "截断评审不得计为已覆盖（A3/F16）")
})

test("T-CG19 code 守卫：review_failed 字符串 resolve 形态 → 不置 _calledAdvisorThisRun（旧锚语义零丢）", () => {
  const agent = { cwd: "C:/proj/cg", _mutLog: [], _calledAdvisorThisRun: false, _advisorRound: 0 }
  const entry = {
    id: 4, cancelled: false,
    run: { reviewType: "code", designId: null, round: 0, priorOutput: null, open: true },
    designToken: null, report: `Timeline.\n\n${TAILS.review_failed}`,
  }
  settleAdvisorRun(agent, entry)
  assert.equal(agent._calledAdvisorThisRun, false, "review failed 形态不得满足 guard（可重推）")
})

test("T-CG21 负向精度：非块首引用行（围栏/表格/引用）不判 incomplete", () => {
  const text = [
    "Round 1 — review complete. No issues.",
    "",
    "```",
    TAILS.context_limit,
    "```",
    "",
    "| # | Note |",
    "|---|---|",
    "| 1 | the tail `Advisor: review failed` is quoted here |",
    "",
    "> Advisor: review timeout after 600s.",
  ].join("\n")
  assert.equal(advisorIncompleteMarker(text), null, "非块首引用行不得判 incomplete")
})

// ─── B：凭证链（自愈 / 启动断言 / 定锚）───────────────────────────────────────

test("T-CG6 构建自愈：design + _advisorRound=1 + 无 prior + 有修改 → 信号补齐（回归锁）", () => {
  const token = `${randomUUID()}:${Date.now() + 3600e3}`
  const agent = {
    cwd: "C:/proj/cg", history: [], config: {}, _advisorRound: 1, _lastAdvisorOutput: null, _mutatedThisRun: true,
  }
  const msgs = prepareAdvisorMessages(agent, "design", token, ["docs/design/X.md"], null, null, null, "did-1")
  const user = msgs.find((m) => m.role === "user")
  assert.ok(user, "user 消息在位")
  assert.ok(user.content.includes("## Approval Signal"), "改前缺失——自愈补齐")
  assert.ok(user.content.includes(`[DESIGN-TOKEN:${token}`), "精确 token 字面")
  assert.ok(user.content.includes("did-1"), "designId 回显指令在位")
  // 幂等：round 0 正常路径（分支内已注入）不得重复追加
  const agent0 = { cwd: "C:/proj/cg", history: [], config: {}, _advisorRound: 0 }
  const msgs0 = prepareAdvisorMessages(agent0, "design", token, ["docs/design/X.md"], null, null, null, "did-1")
  const u0 = msgs0.find((m) => m.role === "user")
  assert.equal(u0.content.split("## Approval Signal").length - 1, 1, "仅一次（无重复注入）")
})

test("T-CG7 启动断言：无 token 直调 design 评审 → 拒绝前缀 + 未发起请求（零 chat）+ 异步面不计覆盖", async () => {
  const chunks = []
  const agent = {
    cwd: "C:/proj/cg", history: [], config: {}, provider: { name: "stub", baseURL: "http://127.0.0.1:1", apiKey: "k", model: "m" },
  }
  const result = await runAdvisorReview(agent, "design", { onOutput: (c) => chunks.push(c) }, null, ["docs/design/X.md"])
  assert.ok(result.startsWith("Advisor: design review launch refused"), "拒绝前缀逐字")
  assert.ok(result.includes("no design token was minted"), "原因 = 未签发 token")
  assert.ok(result.includes("Nothing was sent"), "可见性：未发送")
  assert.ok(result.includes("Re-run advisor(type='design')"), "恢复指引")
  assert.equal(chunks.length, 0, "未进入循环（零 chat —— 进循环必先 emit think 占位）")
  // 异步结算面（§14.4）：拒绝报告 = 无评审产出 → 不置 _calledAdvisorThisRun（与同步工具面同前缀）
  const agent2 = { cwd: "C:/proj/cg", _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false }
  const refused = settleAdvisorRun(agent2, {
    id: 12, cancelled: false,
    run: { reviewType: "design", designId: "did-ref", round: 0, priorOutput: null, open: true },
    designToken: liveTok(), report: result,
  })
  assert.equal(agent2._calledAdvisorThisRun, false, "拒绝报告不得计为评审覆盖")
  assert.equal(refused.passed, false)
  // 对照：同形态但带正常产出的 design 结算照常计入（既有 parity 语义零改）
  const agent3 = { cwd: "C:/proj/cg", _mutLog: [], _engDesignTokens: new Map(), _advisorRound: 0, _calledAdvisorThisRun: false }
  settleAdvisorRun(agent3, {
    id: 13, cancelled: false, run: { reviewType: "design", designId: "did-r2", round: 0, priorOutput: null, open: true },
    designToken: liveTok(), report: "Design review found issues — changes required.",
  })
  assert.equal(agent3._calledAdvisorThisRun, true, "普通 design 结算保持计入（parity 零改）")
})

test("T-CG8 压缩定锚：（>20 条消息）重挂 pinned 三锚；（≤20 条）原样返回", () => {
  const declared = "## Review-object declaration (mechanical — do not infer)"
  const pinned = [
    "[review brief — re-attached after context compaction; the original review request is no longer in the context]",
    buildObjectDeclarationBlock({ type: "design", target: "docs/design/X.md", status: "待评审", reason: "user-initiated", exclude: "" }).trimEnd(),
    "## Documents to Review",
    "- docs/design/X.md — Read this file in full",
    buildDesignApprovalBlock("tok-1", "did-1"),
  ].join("\n\n")
  // 单元：≤20 条 → 原样（无 pin）
  const small = [{ role: "system", content: "s" }, { role: "user", content: "u" }]
  compactMessages(small, pinned)
  assert.deepEqual(small.map((m) => m.content), ["s", "u"], "不足 20 条不压缩、不挂 pin")
  // 集成：真循环触发压缩（消息总量 > 阈值）→ pinned 作为 user 消息重挂
  const big = "x".repeat(400_000)
  const messages = [
    { role: "system", content: "sys" },
    { role: "user", content: "original brief (with token)" },
    ...Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? "assistant" : "tool", content: big })),
    ...Array.from({ length: 20 }, (_, i) => ({ role: "user", content: `recent ${i}` })),
  ]
  const executed = []
  const loopDone = _runAdvisorToolLoop(
    STUB_PROVIDER, messages, null, undefined, { cwd: "C:/proj/cg", config: {} }, "C:/proj/cg", mockTools(executed), "design", null, pinned,
    { chat: async (p, opts) => { opts.onToken("final review text"); return { content: "final review text", toolCalls: [] } } },
  )
  return loopDone.then((out) => {
    const attached = messages.filter((m) => typeof m.content === "string" && m.content === pinned)
    assert.equal(attached.length, 1, "pinned 作为一条 user 消息重挂")
    assert.ok(pinned.includes(declared) && pinned.includes("## Documents to Review") && pinned.includes("## Approval Signal"), "三锚同条")
    assert.ok(out.includes("final review text"), "压缩后循环继续（评审正常收尾）")
  })
})

// ─── C：引文解析候选链 ────────────────────────────────────────────────────────

test("T-CG9 声明文件目录候选：裸文件名经声明范围解析 → 命中 1/1 + 报告注明解析路径", () => {
  const ws = mkws()
  write(ws, "thincoder-vscode/docs/design/X.md", "# X\n\nVSC line three content here\n")
  write(ws, "thincoder-cli/docs/design/X.md", "# X\n\nMain repo line three content\n")
  const text = `Finding: X.md:3: VSC line three content here`
  const res = verifyCitations(text, ws, { scope: ["thincoder-vscode/docs/design/X.md"] })
  assert.equal(res.total, 1)
  assert.equal(res.matched.length, 1, "经声明文件目录解析命中")
  assert.equal(res.matched[0].resolved, "thincoder-vscode/docs/design/X.md", "命中根 = 声明文件目录")
  const report = appendCitationReport(text, ws, { scope: ["thincoder-vscode/docs/design/X.md"] })
  assert.ok(report.includes("[host-verified] 1/1 citations match current file state."), "报告头行不变")
  assert.ok(report.includes("→ thincoder-vscode/docs/design/X.md"), "报告注明解析路径")
})

test("T-CG10 声明仓根候选：仓根相对路径命中；同名另一仓不被误命中（内容判据）", () => {
  const ws = mkws()
  write(ws, "thincoder-cli/docs/design/Y.md", "# Y\n\nmain-repo-marker line\n")
  write(ws, "thincoder-vscode/docs/design/Y.md", "# Y\n\nvsc-repo-marker line\n")
  const scope = ["thincoder-cli/docs/design/X.md"]
  const hit = verifyCitations(`See docs/design/Y.md:3: main-repo-marker line`, ws, { scope })
  assert.equal(hit.matched.length, 1, "经声明仓根命中")
  assert.equal(hit.failed.length, 0)
  const sameName = verifyCitations(`See docs/design/Y.md:3: vsc-repo-marker line`, ws, { scope })
  assert.equal(sameName.matched.length, 0, "同名另一仓不被误命中")
  assert.equal(sameName.failed.length, 1)
  assert.equal(sameName.failed[0].reason, "content mismatch @ thincoder-cli/docs/design/Y.md", "失败原因含解析到的相对路径")
})

test("T-CG11 失败原因三分：file unreadable / content mismatch @ path / path traversal", () => {
  const ws = mkws()
  write(ws, "work/docs/a.md", "# A\n\nsecond line here\n")
  writeFileSync(join(ws, "outside.md"), "# Outside\n\nsecret line here\n", "utf8")
  const cwd = join(ws, "work")
  const body = [
    "Finding one: nope.md:1: no such file content",
    "Finding two: docs/a.md:2: WRONG expected content",
    "Finding three: ../outside.md:2: secret line here",
  ].join("\n")
  const res = verifyCitations(body, cwd)
  assert.equal(res.total, 3)
  assert.equal(res.matched.length, 0)
  const reasons = res.failed.map((f) => f.reason)
  assert.deepEqual(reasons, [
    "file unreadable",
    "content mismatch @ docs/a.md",
    "path traversal",
  ], "三分支各一断言（围栏不变）")
})

// ─── D：预算硬墙 / 提示 / 结构化尾 ─────────────────────────────────────────────

const mkLoopAgent = (timeoutMs) => ({ cwd: "C:/proj/cg", config: { advisor: { timeoutMs } } })

test("T-CG12 预算用尽 → 结构化超时尾（族前缀 + rounds / tool calls / budget 三要素）", async () => {
  const executed = []
  const out = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review this" }], null, undefined,
    mkLoopAgent(1000), "C:/proj/cg", mockTools(executed), "code", null, null,
    { now: clockFrom([1000, 1000, 2000]), chat: async () => ({ content: "", toolCalls: [{ id: "t1", name: "mock", arguments: "{}" }] }) },
  )
  const lines = out.split("\n")
  assert.ok(lines.some((l) => l.startsWith("Advisor: review timeout after 1s.")), "族前缀逐字（尾以块首行形态落地）")
  assert.ok(out.includes("- rounds: 1 · tool calls: 1 · review text produced: no"), "三要素统计")
  assert.ok(out.includes("- budget: 1s (agent.advisor.timeoutMs)"), "预算行")
  assert.ok(out.includes("narrower scope") && out.includes("raise the budget"), "恢复指引（N8 关键词）")
  assert.equal(executed.length, 1, "首调的工具已执行（墙在轮间触发）")
})

test("T-CG13 0.75 一次性预算提示：时钟注入（零真实等待）→ 第 2 轮注入恰一次", async () => {
  const messages = [{ role: "user", content: "review this" }]
  const out = await _runAdvisorToolLoop(
    STUB_PROVIDER, messages, null, undefined,
    mkLoopAgent(1000), "C:/proj/cg", mockTools([]), "code", null, null,
    {
      now: clockFrom([0, 0, 800]),
      chat: async (p, opts) => {
        if (!messages.some((m) => String(m.content).includes("review budget"))) return { content: "", toolCalls: [{ id: "t1", name: "mock", arguments: "{}" }] }
        opts.onToken("converged findings")
        return { content: "converged findings", toolCalls: [] }
      },
    },
  )
  const nudges = messages.filter((m) => String(m.content).includes("⏳ review budget"))
  assert.equal(nudges.length, 1, "恰一次（一次性）")
  assert.ok(nudges[0].content.includes("~80% consumed"), "百分比 = 注入时钟口径")
  assert.ok(nudges[0].content.includes("unverified") && nudges[0].content.includes("verdict line"), "收敛指令逐字")
  assert.ok(out.includes("converged findings"), "提示后评审继续并收尾")
})

test("T-CG14 纯函数 shouldBudgetNudge：阈值两侧 + 已提示不重复", () => {
  assert.equal(shouldBudgetNudge(749, 1000, false), false, "阈值下不提示")
  assert.equal(shouldBudgetNudge(750, 1000, false), true, "达阈值提示（含等号）")
  assert.equal(shouldBudgetNudge(900, 1000, false), true, "阈值上提示")
  assert.equal(shouldBudgetNudge(900, 1000, true), false, "已提示不重复")
  assert.equal(shouldBudgetNudge(500, 0, false), false, "非法预算不提示")
})

test("T-CG20 墙在调用中触发：partial 不抛错返回形态 + TimeoutError 异常形态 → 同判超时尾", async () => {
  // 形态①：首调阻塞至墙触发后返回 partial（不抛错）——真实墙定时器驱动（~0.1s）
  const partialChat = async (p, opts) => {
    await new Promise((res) => {
      if (opts.signal.aborted) res()
      else opts.signal.addEventListener("abort", res, { once: true })
    })
    opts.onToken("partial findings")
    return { content: "partial findings", toolCalls: [], partial: true }
  }
  const out1 = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review" }], null, undefined, mkLoopAgent(100), "C:/proj/cg", mockTools([]), "code", null, null,
    { chat: partialChat },
  )
  assert.ok(out1.split("\n").some((l) => l.startsWith("Advisor: review timeout after ")), "partial 形态：族前缀")
  assert.ok(out1.includes("- rounds: 1 · tool calls: 0 · review text produced: yes"), "partial 形态：三要素（已有文本）")
  assert.ok(out1.includes("- budget: 0s (agent.advisor.timeoutMs)"), "partial 形态：budget 行")
  // 形态②：抛 TimeoutError 名异常（AbortSignal.timeout 的 reason 形态）——立即判墙
  const out2 = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review" }], null, undefined, mkLoopAgent(600_000), "C:/proj/cg", mockTools([]), "code", null, null,
    { chat: async () => { const e = new Error("The operation was aborted due to timeout"); e.name = "TimeoutError"; throw e } },
  )
  assert.ok(out2.split("\n").some((l) => l.startsWith("Advisor: review timeout after 600s.")), "TimeoutError 形态：族前缀")
  assert.ok(out2.includes("- rounds: 1 · tool calls: 0 · review text produced: no"), "TimeoutError 形态：三要素")
})

// ─── E：冻结窗口（写前拦截 + 回执冻结句）──────────────────────────────────────

const designEntry = (id, docAbs, over = {}) => ({
  id, role: "advisor", reviewType: "design", docAbs,
  status: "running", done: false, cancelled: false,
  run: { reviewType: "design", docSetKey: "k" },
  ...over,
})
const CWD = "C:/proj/cg"
const X_ABS = join(CWD, "docs", "design", "X.md")

test("T-CG15 冲突检测：running 设计条目 × scope 路径 → 冲突；非 scope → null", () => {
  const agent = { cwd: CWD, _asyncAdvisors: new Map([["7", designEntry(7, [X_ABS])]]) }
  const hit = inflightDesignReviewConflict(agent, [X_ABS])
  assert.ok(hit, "scope 命中")
  assert.equal(hit.id, "7")
  assert.equal(hit.path, X_ABS)
  assert.equal(inflightDesignReviewConflict(agent, [join(CWD, "docs", "design", "OTHER.md")]), null, "非 scope → null")
  // cwd 相对入参：两侧同经 normAbs（reviewIsStale 同源语义——声明侧同样归一）
  assert.ok(inflightDesignReviewConflict(agent, ["docs/design/X.md"]), "相对路径经 normAbs 归一命中")
})

test("T-CG16 负向族：done / cancelled / 代码评审 / docAbs 空 / 池空 → 全 null（下界语义）", () => {
  const base = { cwd: CWD }
  const X = [X_ABS]
  assert.equal(inflightDesignReviewConflict({ ...base, _asyncAdvisors: new Map([["1", designEntry(1, X, { status: "done", done: true })]]) }, X), null, "已结算不拦（报告送达后可写）")
  assert.equal(inflightDesignReviewConflict({ ...base, _asyncAdvisors: new Map([["2", designEntry(2, X, { cancelled: true })]]) }, X), null, "已取消不拦")
  assert.equal(inflightDesignReviewConflict({ ...base, _asyncAdvisors: new Map([["3", designEntry(3, X, { reviewType: "code" })]]) }, X), null, "代码评审不在射程")
  assert.equal(inflightDesignReviewConflict({ ...base, _asyncAdvisors: new Map([["4", designEntry(4, [])]]) }, X), null, "docAbs 空不拦")
  assert.equal(inflightDesignReviewConflict({ ...base, _asyncAdvisors: new Map() }, X), null, "池空不拦")
  assert.equal(inflightDesignReviewConflict({ ...base }, X), null, "无池不崩")
})

test("T-CG17 dispatch 集成：在途设计评审 × write 指向 docAbs → 逐字拒绝 + 文件零改动；同批非 scope 写过闸", async () => {
  const ws = mkws()
  const scopeAbs = write(ws, "docs/design/X.md", "original doc content\n")
  const otherAbs = join(ws, "docs", "notes.md")
  const touched = []
  const writeTool = {
    name: "write", readonly: false, touchedPaths: (a) => [a.path],
    execute: async (args) => { touched.push(args.path); writeFileSync(join(ws, ...args.path.split("/")), "written\n", "utf8"); return `Wrote ${args.path}` },
  }
  const toolByName = new Map([["write", writeTool]])
  const agent = {
    cwd: ws, config: {}, planMode: false, autoApprove: false, _mutLog: [], _mutationSeq: 0,
    _asyncAdvisors: new Map([["7", designEntry(7, [scopeAbs])]]),
  }
  const calls = [
    { name: "write", arguments: JSON.stringify({ path: "docs/design/X.md" }), id: "c1" },
    { name: "write", arguments: JSON.stringify({ path: "docs/notes.md" }), id: "c2" },
  ]
  const results = await executeToolCalls(agent, toolByName, calls, {}, 0, undefined)
  assert.equal(results[0].ok, false, "在途写被拒")
  const msg = String(results[0].result)
  assert.ok(msg.includes("write refused — design review #7"), "拒绝文案锚逐字")
  assert.ok(msg.includes("D5 freeze window"), "窗口名在位")
  assert.ok(msg.includes("action:'cancel' id:'7'"), "逃生门指引（含评审 id）")
  assert.ok(msg.includes("re-launch after the change"), "重发指引")
  assert.equal(readFileSync(scopeAbs, "utf8"), "original doc content\n", "被拒写入零落地（读回断言）")
  // 对照（先例同形：design-token-settlement AC4「工程门放行——拒因变权限层」）：同批非 scope 写
  // **过冻结闸**（拒因下移至权限层——非 D5 文案）——证明拦截按 docAbs 生效、不误杀。
  const ctrl = String(results[1].result)
  assert.equal(results[1].ok, false)
  assert.ok(!ctrl.includes("write refused — design review"), "非 scope 写不得命中冻结闸")
  assert.ok(ctrl.includes("no permission handler"), "拒因 = 权限层（过闸证明）")
  assert.equal(touched.length, 0, "两项均未执行（冻结项被拦 + 对照项停在权限层）")
  assert.ok(!existsSync(otherAbs), "对照文件未落地（进权限层后未执行）")
  // autoApprove 不得绕过冻结（design §14.14 E-3d：闸位在只读/审批短路之前）
  const auto = await executeToolCalls(
    { ...agent, autoApprove: true }, toolByName,
    [{ name: "write", arguments: JSON.stringify({ path: "docs/design/X.md" }), id: "c3" }], {}, 0, undefined,
  )
  assert.equal(auto[0].ok, false, "autoApprove 不绕过")
  assert.ok(String(auto[0].result).includes("write refused — design review #7"), "同上拒绝文案")
  assert.equal(readFileSync(scopeAbs, "utf8"), "original doc content\n", "仍零落地")
  assert.equal(touched.length, 0, "被拒项从未执行")
})

test("T-CG18 点火回执冻结句：设计评审 ack 含（逐字）；代码评审 ack 不含（不对称锁定）", async () => {
  const agent = {
    cwd: mkws(), history: [], config: {}, provider: {},
    _advisorRuns: new Map(), _asyncAdvisors: new Map(), _asyncSubagents: new Map(),
  }
  const designAck = JSON.parse(await advisorTool.execute({ type: "design", documents: ["docs/design/X.md"] }, { agent, depth: 0 }))
  assert.equal(designAck.status, "running")
  assert.ok(designAck.note.includes("D5 冻结窗口"), "冻结句在位（逐字）")
  assert.ok(designAck.note.includes("被审文档（含批次档）在报告送达前零写入"), "冻结句全文")
  const codeAck = JSON.parse(await advisorTool.execute({ type: "code", paths: ["src/x.mjs"] }, { agent, depth: 0 }))
  assert.equal(codeAck.status, "running")
  assert.ok(!codeAck.note.includes("D5 冻结窗口"), "代码评审 ack 零改（不对称）")
})
