/**
 * advisor-chain-guards.test.mjs — 第 12 批（VSC 评审链边缘守卫镜像）用例表 1:1 落地：
 * T-VG1–T-VG15（设计档 `docs/design/ADVISOR-CONVERGENCE.md` §13.8）+ AC-VG1–AC-VG8 的
 * 机判面（§13.9）。断言判据全文 = §13.4 契约一–六。
 * 单测零网络（同步结算面走本地 SSE fake server——127.0.0.1）、零真实 LLM（循环 seams
 * `{now, chat}` 覆写——`??` 默认回退，生产路径不可达）、零长等待（T-VG14 时钟注入零真实
 * 等待；T-VG13 形态② 真实墙定时器 ~0.1s 级）。
 * 本端自持编号（T-VG / AC-VG）——映射列回指需求条目（CLI 对位经 §13.1 对位列）。
 * 归册（2026-09-12 收尾轮 9）：T-VG3（本地 SSE 假服务器真 IO 等待）观测 579–1855ms——
 * slow() 门控（快层 skip、test:full 照跑）。
 */
import { test, after } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import http from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { _runAdvisorToolLoop, _setAdvisorToolSetForTest } from "../src/advisor/run.mjs"
import {
  advisorIncompleteMarker, compactMessages, shouldBudgetNudge, budgetNudgeText, timeoutTail, incompleteNotice,
} from "../src/advisor/compaction.mjs"
import { prepareAdvisorMessages } from "../src/advisor/main.mjs"
import { buildReviewObjectDeclaration, buildDesignApprovalBlock } from "../src/advisor/messages.mjs"
import { appendCitationReport, verifyCitations } from "../src/advisor/citations.mjs"
import { advisorTool } from "../src/agent-tools/advisor.mjs"
import { settleAdvisorReview } from "../src/agent-tools/advisor-async.mjs"

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

const tmpDirs = []
after(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
  _setAdvisorToolSetForTest(null)
})

/** 隔离临时工作区（引用解析 / 同步结算面用；不动真实仓）。 */
function mkws() {
  const dir = mkdtempSync(join(tmpdir(), "vg-"))
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
/** 脚本时钟（T-VG12/T-VG14）：第 n 次调用取 seq[n]（末值兜底）——零真实等待。 */
const clockFrom = (seq) => { let i = 0; return () => seq[Math.min(i++, seq.length - 1)] }
const mkLoopAgent = (timeoutMs) => ({ cwd: "C:/proj/vg", config: { advisor: { timeoutMs } } })
const mockTools = (executed) => [{ name: "mock", parameters: { type: "object", properties: {} }, execute: async () => { executed.push(1); return "tool ok" } }]

/** 宿主尾族形态（各 kind 一例——块首行形态；`empty` = 本端括号字面）。 */
const TAILS = {
  context_limit: "Advisor: context window limit reached (123456 tokens). Review incomplete — too many tool calls. Try a narrower scope.",
  turn_cap: "Advisor: stopped after 100 tool rounds — the review appears to be looping. You may retry with a narrower scope.",
  empty: "Advisor: (empty response — review was inconclusive)",
  interrupted: "Advisor: interrupted.",
  review_failed: "Advisor: review failed (timeout) — The model took too long. Try with a narrower scope.",
}

/**
 * 本地 SSE fake server（同步结算面直驱 `advisorTool.execute` → 真 `chat()`；零外网）：
 * 从请求体回读本次注入的 token（评审员回显形态）并按 `tail` 拼最终评审文本。
 */
function reviewServer({ before = "Findings text.", tail = "" } = {}) {
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      // 取**签发 token 形态**（uuid:expiresAt）：系统提示词里有占位符 `[DESIGN-TOKEN:<token>]`
      // ——裸模式会先命中占位符（non-greedy）。
      const m = body.match(/\[DESIGN-TOKEN:([0-9a-fA-F-]{36}:\d+)\]/)
      const token = m ? m[1] : "no-token"
      const text = [before, `[DESIGN-TOKEN:${token}]`, tail].filter(Boolean).join("\n\n")
      res.writeHead(200, { "content-type": "text/event-stream" })
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text }, finish_reason: null }] })}\n\n`)
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) })
    })
  })
}

/** 同步结算面夹具（design 评审 round 1——documents 走显式范围分支，无 git 收集）。 */
function syncAgent(ws, baseURL) {
  return {
    cwd: ws, history: [], config: {},
    _provider: { name: "vg-wire", baseURL, apiKey: "test-key", model: "vg-model", format: "openai" },
    _engDesignTokens: new Map(), _advisorRound: 0, _role: null,
  }
}

/** 异步结算面夹具（design entry——settleAdvisorReview 直驱，无池/无网络）。 */
function asyncFixture(report, over = {}) {
  const parent = {
    cwd: "C:/proj/vg", history: {}, config: {},
    _engDesignTokens: new Map(), _calledAdvisorThisRun: false, _advisorRuns: new Map(),
  }
  const entry = {
    id: 4, role: "advisor", status: "running", reviewType: "design",
    reviewId: "did-vg", round: 1, designToken: "tok-vg", designId: "did-vg",
    cancelled: false, done: false, controller: new AbortController(),
    report, ...over,
  }
  return { parent, entry }
}

// ─── A：未完成判定族（谓词 / 双结算面 / code 守卫）─────────────────────────────

test("T-VG1 六 kind 全覆盖（块首行锚：尾不在首行也命中）+ 干净文本/空串 null", () => {
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
    "旧字面超时尾（族前缀同一——零回归）",
  )
  hitKinds.add("timeout")
  assert.deepEqual([...hitKinds].sort(), ["context_limit", "empty", "interrupted", "review_failed", "timeout", "turn_cap"], "六 kind 逐一命中（全覆盖）")
  assert.equal(advisorIncompleteMarker("Round 1 — review complete. No issues found."), null, "干净评审文本 → null")
  assert.equal(advisorIncompleteMarker(""), null, "空串 → null")
  assert.equal(advisorIncompleteMarker(null), null, "null → null")
})

test("T-VG2 负向精度：非块首引用行（围栏 / 表格 / 引用）不判 incomplete", () => {
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
    `> Advisor: review timeout after 600s.`,
  ].join("\n")
  assert.equal(advisorIncompleteMarker(text), null, "非块首引用行不得判 incomplete（残余方向 fail-closed）")
})

slow("T-VG3 sync 结算：时间线（含 token 回显）+ 截断尾 → 不签发（零 token 字面 + 提示 + 槽零写）", async () => {
  const ws = mkws()
  write(ws, "docs/design/X.md", "# X\n\nreview target\n")
  const srv = await reviewServer({ tail: TAILS.context_limit })
  try {
    const agent = syncAgent(ws, srv.url)
    const result = await advisorTool.execute({ type: "design", documents: ["docs/design/X.md"], async: false }, { agent, depth: 0, callbacks: {} })
    assert.ok(result.includes("评审未完成——token 未签发"), "未签发提示在位（N12 可见产出）")
    assert.ok(result.includes("reason: context_limit"), "原因 = kind")
    // 零未注册 token 字面：报告只留提示文本，不含真实 token 回显
    assert.ok(!/\[DESIGN-TOKEN:/.test(result), "报告零 token 回显字面")
    assert.ok(result.includes("以更小范围重跑设计评审") && result.includes("agent.advisor.timeoutMs"), "恢复指引（N13）")
    assert.equal(agent._engDesignTokens.size, 0, "槽零写")
    assert.ok(!String(agent._lastAdvisorOutput ?? "").includes("[DESIGN-TOKEN:"), "prior 覆写为清洗后输出（N14）")
  } finally {
    await srv.close()
  }
})

test("T-VG4 async 结算同结果：design entry 未完成 → 提示 + 台账零写 + prior 同源", () => {
  const token = liveTok()
  const { parent, entry } = asyncFixture(`Findings.\n\n[DESIGN-TOKEN:${token}]\n\n${TAILS.turn_cap}`)
  entry.designToken = token
  settleAdvisorReview(parent, entry, entry.report, null, null)
  assert.ok(entry.report.includes("评审未完成——token 未签发"), "entry.report 含提示（digest/prior 同源传导）")
  assert.ok(!entry.report.includes("[DESIGN-TOKEN:"), "报告零 token 回显字面")
  assert.equal(parent._engDesignTokens.size, 0, "D1 台账零写（槽零写）")
  assert.equal(entry.report.includes("[DESIGN-TOKEN:"), false, "零未注册 token 回显（N14）")
  assert.ok(incompleteNotice("turn_cap").length > 0, "提示文本单源（compaction.mjs）")
})

slow("T-VG5 正常批准零回归：干净通过 + token 回显 → 槽写入 + Approved 后缀（sync + async 两面）", async () => {
  const ws = mkws()
  write(ws, "docs/design/X.md", "# X\n\nreview target\n")
  const srv = await reviewServer({ before: "All good — no findings." })
  try {
    const agent = syncAgent(ws, srv.url)
    const result = await advisorTool.execute({ type: "design", documents: ["docs/design/X.md"], async: false }, { agent, depth: 0, callbacks: {} })
    assert.equal(agent._engDesignTokens.size, 1, "槽写入（单设计）")
    const issued = [...agent._engDesignTokens.values()][0]
    assert.ok(result.includes(issued), "Approved 回显 token")
    assert.ok(result.includes("Approved."), "Approved 后缀在位")
    assert.ok(!result.includes("评审未完成——token 未签发"), "正常批准不触发未签发分支")
  } finally {
    await srv.close()
  }
  // async 面零回归锁（同一通过判定）
  const token = liveTok()
  const { parent, entry } = asyncFixture(`Looks good.\n\n[DESIGN-TOKEN:${token}]`)
  entry.designToken = token
  settleAdvisorReview(parent, entry, entry.report, null, null)
  assert.equal(parent._engDesignTokens.get(entry.designId), token, "async 通过 → 槽写入")
  assert.ok(entry.report.includes("Approved."), "async Approved 后缀在位")
  assert.equal(parent._calledAdvisorThisRun, true, "design 完成照常计入（既有 parity 零改）")
})

test("T-VG6 code 守卫：时间线 + 尾（两形态）→ 不置 _calledAdvisorThisRun；旧 `^` 锚正则零残留", () => {
  for (const [name, tail] of [["context_limit", TAILS.context_limit], ["review_failed（字符串 resolve 形态）", TAILS.review_failed]]) {
    const { parent, entry } = asyncFixture(`Round 1 review text.\n\n${tail}`, { reviewType: "code", designToken: null, reviewId: "rid-vg", designId: null })
    settleAdvisorReview(parent, entry, entry.report, null, null)
    assert.equal(parent._calledAdvisorThisRun, false, `${name}: 截断评审不得计为已覆盖（F23）`)
  }
  // 对照：干净 code 完成 → 照常置位（既有语义零改）
  const clean = asyncFixture("Round 1 review text — no issues.", { reviewType: "code", designToken: null, reviewId: "rid-clean", designId: null })
  settleAdvisorReview(clean.parent, clean.entry, clean.entry.report, null, null)
  assert.equal(clean.parent._calledAdvisorThisRun, true, "干净 code 评审照常置位")
})

// ─── B：凭证链（构建面自愈 / 压缩定锚）────────────────────────────────────────

test("T-VG7 构建面自愈：design 降级形态（round ≥1 + 无 prior）补齐信号；幂等复测", () => {
  const token = liveTok()
  // 降级形态：rv.round ≥ 2 且无 prior → 落 code 形态构建（改前零信号）
  const agent = { cwd: "C:/proj/vg", history: [], config: {} }
  const msgs = prepareAdvisorMessages(agent, "design", token, ["docs/design/X.md"], null, null, { round: 2, priorOutput: null }, "did-1")
  const user = msgs.find((m) => m.role === "user")
  assert.ok(user.content.includes("## Approval Signal"), "降级路径信号补齐（F19）")
  assert.ok(user.content.includes(`[DESIGN-TOKEN:${token}`), "精确 token 字面")
  assert.ok(user.content.includes("did-1"), "designId 回显指令在位")
  // 幂等：round 1 分支内已注入 → 不重复
  const msgs0 = prepareAdvisorMessages({ cwd: "C:/proj/vg", history: [], config: {} }, "design", token, ["docs/design/X.md"], null, null, null, "did-1")
  const u0 = msgs0.find((m) => m.role === "user")
  assert.equal(u0.content.split("## Approval Signal").length - 1, 1, "仅一次（无重复注入）")
  assert.equal(u0.content.split(`[DESIGN-TOKEN:${token}`).length - 1, 1, "token 字面仅一次")
  // 非 design / 无 token → 零改
  const codeMsgs = prepareAdvisorMessages({ cwd: "C:/proj/vg", history: [], config: {} }, "code", token, null, ["src/x.mjs"], null, null, null)
  assert.ok(!codeMsgs.find((m) => m.role === "user").content.includes("## Approval Signal"), "code 评审零信号（非 design）")
})

test("T-VG8 压缩定锚：（>20 条）重挂 pinned 三锚 + 幂等重挂；（≤20 条）原样返回", () => {
  const declared = "## Review-object declaration (mechanical — do not infer)"
  const pinned = [
    "[review brief — re-attached after context compaction; the original review request is no longer in the context]",
    buildReviewObjectDeclaration({ type: "design", target: "docs/design/X.md", status: "待评审", reason: "user-initiated", exclude: "" }).trimEnd(),
    "## Documents to Review",
    "- docs/design/X.md — Read this file in full",
    buildDesignApprovalBlock("tok-1", "did-1"),
  ].join("\n\n")
  // ≤20 条 → 原样返回（无 pin）
  const small = [{ role: "system", content: "s" }, { role: "user", content: "u" }]
  compactMessages(small, pinned)
  assert.deepEqual(small.map((m) => m.content), ["s", "u"], "不足 20 条不压缩、不挂 pin")
  // >20 条 → pinned 作为一条 user 消息重挂
  const messages = [
    { role: "system", content: "sys" },
    { role: "user", content: "original brief (with token)" },
    ...Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? "assistant" : "tool", content: `row ${i}` })),
  ]
  compactMessages(messages, pinned)
  assert.equal(messages.filter((m) => m.content === pinned).length, 1, "pinned 作为一条 user 消息重挂")
  assert.ok(pinned.includes(declared) && pinned.includes("## Documents to Review") && pinned.includes("## Approval Signal"), "三锚同条")
  assert.ok(!messages.some((m) => m.content === "original brief (with token)"), "首条 user 已被压缩（pin 的意义）")
  compactMessages(messages, pinned)
  assert.equal(messages.filter((m) => m.content === pinned).length, 1, "再次压缩：旧 pin 随旧段丢弃、新 pin 重挂——净额仍恰一条（本动作内重挂，不做存在性判定）")
})

// ─── C：引文解析候选链 ────────────────────────────────────────────────────────

test("T-VG9 声明文件目录候选：裸文件名经声明范围解析 → 命中 1/1 + 报告注明解析路径", () => {
  const ws = mkws()
  write(ws, "thincoder-vscode/docs/design/X.md", "# X\n\nVSC line three content here\n")
  write(ws, "thincoder/docs/design/X.md", "# X\n\nMain repo line three content\n")
  const text = `Finding: X.md:3: VSC line three content here`
  const res = verifyCitations(text, ws, { scope: ["thincoder-vscode/docs/design/X.md"] })
  assert.equal(res.total, 1)
  assert.equal(res.matched.length, 1, "经声明文件目录解析命中")
  assert.equal(res.matched[0].resolved, "thincoder-vscode/docs/design/X.md", "命中根 = 声明文件目录")
  const report = appendCitationReport(text, ws, { scope: ["thincoder-vscode/docs/design/X.md"] })
  assert.ok(report.includes("[host-verified] 1/1 citations match current file state."), "报告头行不变")
  assert.ok(report.includes("Citations resolved via the declared review scope (bare path — resolved root noted):"), "命中根报告段在位")
  assert.ok(report.includes("→ thincoder-vscode/docs/design/X.md"), "报告注明解析路径")
})

test("T-VG10 声明仓根候选：仓根相对路径命中；同名另一仓不被误命中（内容判据）", () => {
  const ws = mkws()
  write(ws, "thincoder/docs/design/Y.md", "# Y\n\nmain-repo-marker line\n")
  write(ws, "thincoder-vscode/docs/design/Y.md", "# Y\n\nvsc-repo-marker line\n")
  const scope = ["thincoder/docs/design/X.md"]
  const hit = verifyCitations(`See docs/design/Y.md:3: main-repo-marker line`, ws, { scope })
  assert.equal(hit.matched.length, 1, "经声明仓根命中")
  assert.equal(hit.failed.length, 0)
  const sameName = verifyCitations(`See docs/design/Y.md:3: vsc-repo-marker line`, ws, { scope })
  assert.equal(sameName.matched.length, 0, "同名另一仓不被误命中")
  assert.equal(sameName.failed.length, 1)
  assert.equal(sameName.failed[0].reason, "content mismatch @ thincoder/docs/design/Y.md", "失败原因含解析到的相对路径")
})

test("T-VG11 失败原因三分：file unreadable / content mismatch @ path / path traversal", () => {
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
  assert.deepEqual(res.failed.map((f) => f.reason), [
    "file unreadable",
    "content mismatch @ docs/a.md",
    "path traversal",
  ], "三分支各一断言（围栏不变）")
})

// ─── D：预算硬墙 / 提示 / 结构化尾 ─────────────────────────────────────────────

test("T-VG12 预算用尽 → 结构化超时尾（族前缀 + 统计行三要素 + budget 行）", async () => {
  const executed = []
  _setAdvisorToolSetForTest(mockTools(executed))
  try {
    const out = await _runAdvisorToolLoop(
      STUB_PROVIDER, [{ role: "user", content: "review this" }], null, undefined,
      mkLoopAgent(1000), "C:/proj/vg", "code", null, null,
      { now: clockFrom([1000, 1000, 2000]), chat: async () => ({ content: "", toolCalls: [{ id: "t1", name: "mock", arguments: "{}" }] }) },
    )
    assert.ok(out.split("\n").some((l) => l.startsWith("Advisor: review timeout after 1s.")), "族前缀逐字（尾以块首行形态落地）")
    assert.ok(out.includes("- rounds: 1 · tool calls: 1 · review text produced: no"), "统计行三要素")
    assert.ok(out.includes("- budget: 1s (agent.advisor.timeoutMs)"), "budget 预算指引行")
    assert.ok(out.includes("narrower scope") && out.includes("raise the budget"), "恢复指引（N13 关键词）")
    assert.equal(executed.length, 1, "首调的工具已执行（墙在轮间触发）")
    assert.equal(advisorIncompleteMarker(out), "timeout", "判定族命中（生成 ⟷ 判定同源）")
  } finally {
    _setAdvisorToolSetForTest(null)
  }
})

test("T-VG13 墙在调用中触发：抛错形态（AbortError / TimeoutError 名）+ interrupted 返回形态 → 同判结构化尾", async () => {
  const thrower = (name) => async () => { const e = new Error("The operation was aborted due to timeout"); e.name = name; throw e }
  const out1 = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review" }], null, undefined, mkLoopAgent(600_000), "C:/proj/vg", "code", null, null,
    { chat: thrower("TimeoutError") },
  )
  assert.ok(out1.split("\n").some((l) => l.startsWith("Advisor: review timeout after 600s.")), "TimeoutError 名：族前缀")
  assert.ok(out1.includes("- rounds: 1 · tool calls: 0 · review text produced: no"), "TimeoutError 名：统计行")
  assert.ok(out1.includes("- budget: 600s (agent.advisor.timeoutMs)"), "TimeoutError 名：budget 行")
  const out2 = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review" }], null, undefined, mkLoopAgent(600_000), "C:/proj/vg", "code", null, null,
    { chat: thrower("AbortError") },
  )
  assert.ok(out2.split("\n").some((l) => l.startsWith("Advisor: review timeout after 600s.")), "AbortError 名：同判")
  // 形态②（本端中止返回形态 = `interrupted` 字段）：真实墙定时器驱动（~0.1s）——等信号 abort
  // 后返回 interrupted；用户信号缺席 ⇒ ①（中断尾）不先命中，②（结构化尾）判定
  const interruptedChat = async (p, opts) => {
    await new Promise((res) => { if (opts.signal.aborted) res(); else opts.signal.addEventListener("abort", res, { once: true }) })
    return { content: "", toolCalls: [], interrupted: true }
  }
  const out3 = await _runAdvisorToolLoop(
    STUB_PROVIDER, [{ role: "user", content: "review" }], null, undefined, mkLoopAgent(100), "C:/proj/vg", "code", null, null,
    { chat: interruptedChat },
  )
  assert.ok(out3.split("\n").some((l) => l.startsWith("Advisor: review timeout after 0s.")), "interrupted 形态：族前缀")
  assert.ok(out3.includes("- rounds: 1 · tool calls: 0 · review text produced: no"), "interrupted 形态：统计行")
})

test("T-VG14 0.75 一次性预算提示：时钟注入（零真实等待）→ 第 2 轮注入恰一次", async () => {
  const executed = []
  _setAdvisorToolSetForTest(mockTools(executed))
  const messages = [{ role: "user", content: "review this" }]
  try {
    const out = await _runAdvisorToolLoop(
      STUB_PROVIDER, messages, null, undefined, mkLoopAgent(1000), "C:/proj/vg", "code", null, null,
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
  } finally {
    _setAdvisorToolSetForTest(null)
  }
})

test("T-VG15 纯函数 shouldBudgetNudge：阈值两侧 + 已提示不重复", () => {
  assert.equal(shouldBudgetNudge(749, 1000, false), false, "阈值下不提示")
  assert.equal(shouldBudgetNudge(750, 1000, false), true, "达阈值提示（含等号）")
  assert.equal(shouldBudgetNudge(900, 1000, false), true, "阈值上提示")
  assert.equal(shouldBudgetNudge(900, 1000, true), false, "已提示不重复")
  assert.equal(shouldBudgetNudge(500, 0, false), false, "非法预算不提示")
  assert.equal(budgetNudgeText(800, 1000).includes("~80% consumed"), true, "提示文案时钟口径")
})
