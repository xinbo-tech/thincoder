/**
 * advisor-round-uncapped.test.mjs — 顾问面治理批：撤除全部会话级轮次计数器（#84 / F28③ / N20）。
 * 判据全文 = `docs/core/design/ADVISOR-CONVERGENCE.md` §3 / §3.4 + `ADVISOR-GUARDS.md` §7。
 * 用例表 T-AF1 / T-AF2 / T-AF2b / T-AF6 / T-AF7 / T-AF11（批档 §2.3 / §2.7）。
 * 零网络（桩 provider——只断言发起受理面，不等评审完成）、零真实 LLM、零长等待。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { advisorTool } from "@thincoder/core/agent-tools/advisor.mjs"
import { cancelAsyncAdvisor, effectiveAdvisorRound } from "@thincoder/core/agent-tools/advisor-async.mjs"
import { settleAdvisorRun } from "@thincoder/core/agent-tools/advisor-settle.mjs"
import { handleCompletion } from "@thincoder/core/agent/completion.mjs"
import * as runMod from "@thincoder/core/advisor/run.mjs"
import { timeoutTail } from "@thincoder/core/advisor/compaction.mjs"
import * as factsMod from "@thincoder/core/agent-tools/review-facts.mjs"

const TAIL = timeoutTail(600_000, 3, 12, true) // 生产逐字（结构化超时尾——compaction.mjs 单源）
const CODE_SCOPE = ["thincoder-core/agent-tools/advisor.mjs"]
const mktmp = () => mkdtempSync(join(tmpdir(), "af-uncapped-"))
/** 开放 code 实例（round 为参——第 6 次及以后 = 撤计数主判据的输入面）。 */
const codeRun = (round) => ({
  reviewId: "rv-code", reviewType: "code", designId: null, round,
  priorOutput: "prior review text ".repeat(20), stale: false, open: true, docSetKey: null,
})
const mkAgent = (cwd, runs = new Map()) => ({
  cwd, history: [], config: {}, provider: {}, _touchedFiles: [], _engDesignTokens: new Map(),
  _mutLog: [], _advisorRuns: runs, _asyncAdvisors: new Map(), _asyncSubagents: new Map(),
})
/** 发起面断言只看受理——清理后台池（防同 scope 守卫挡下一次发起）。 */
const cleanup = (agent, out) => {
  try { cancelAsyncAdvisor(agent, JSON.parse(out).id) } catch { /* 非 ack */ }
  for (const id of [...(agent._asyncAdvisors?.keys() ?? [])]) agent._asyncAdvisors.delete(String(id))
}

// ─── AC-1 / AC-5：撤计数主判据 + 零封禁 ──────────────────────────────────────

test("T-AF1 撤计数主判据：code 实例 round=5 的第 6 次发起照常受理（无 cap 串 / 无拒发登记 / 池条目建立）", async () => {
  const agent = mkAgent(mktmp(), new Map([["rv-code", codeRun(5)]]))
  const out = String(await advisorTool.execute({ type: "code", paths: CODE_SCOPE }, { agent, depth: 0, _toolCallId: "af1" }))
  const ack = JSON.parse(out)
  assert.equal(ack.kind, "advisor", "返回 async ack（非拒发串）")
  assert.equal(ack.status, "running", "照常受理（后台启动）")
  assert.equal(out.includes("convergence cap"), false, "无 cap 串")
  assert.equal(out.includes("launch refused"), false, "无拒发串")
  assert.equal(agent._advisorRefusals?.has("af1") ?? false, false, "_advisorRefusals 零登记")
  assert.equal(agent._asyncAdvisors.size, 1, "池条目建立")
  cleanup(agent, out)
})

test("T-AF2 逐次重发：第 6 / 7 / 8 次同样受理（无任何按轮次拒发）", async () => {
  const cwd = mktmp()
  for (const [i, round] of [5, 6, 7].entries()) {
    const agent = mkAgent(cwd, new Map([["rv-code", codeRun(round)]]))
    const out = String(await advisorTool.execute({ type: "code", paths: CODE_SCOPE }, { agent, depth: 0, _toolCallId: `af2-${i}` }))
    assert.equal(JSON.parse(out).kind, "advisor", `第 ${round + 1} 次发起受理`)
    assert.equal(agent._advisorRefusals?.has(`af2-${i}`) ?? false, false, `第 ${round + 1} 次零拒发登记`)
    cleanup(agent, out)
  }
})

test("T-AF2b 零封禁（AC-5）：同 doc-set 逐次失败结算后第 4 / 5 次发起照常受理，结论块逐次产出", async () => {
  const cwd = mktmp()
  const docs = ["docs/design/X.md", "docs/requirements/X.md"]
  const agent = mkAgent(cwd)
  const reports = []
  for (let i = 0; i < 5; i++) {
    const out = String(await advisorTool.execute({ type: "design", documents: docs }, { agent, depth: 0, _toolCallId: `af2b-${i}` }))
    assert.equal(out.startsWith("Advisor: launch refused"), false, `第 ${i + 1} 次发起照常受理`)
    assert.equal(out.includes("design review stopped"), false, `第 ${i + 1} 次无停止串（护栏已撤）`)
    const ack = JSON.parse(out)
    const entry = agent._asyncAdvisors.get(String(ack.id))
    assert.ok(entry, `第 ${i + 1} 次池条目在位`)
    entry.report = `Findings text.\n\n${TAIL}`
    const settled = settleAdvisorRun(agent, entry)
    assert.ok(settled.report.includes("criterion=timeout"), `第 ${i + 1} 次失败结论块在位（不是拒发串）`)
    reports.push(settled.report)
    agent._asyncAdvisors.delete(String(ack.id))
  }
  assert.equal(reports.length, 5, "五次逐次结论（计数不封禁）")
  assert.ok(reports.at(-1).includes("round=5/uncapped"), "第 5 次结算轮次 = 5（轮次照常递增——非终止判据）")
})

// ─── T-AF6 / T-AF7：轮次字段保留 + guard 不以轮次停推 ─────────────────────────

test("T-AF6 轮次字段保留：实例 round 照常递增（提示词衰减 / 显示的数据源），不作终止判据", () => {
  const code = codeRun(5)
  const agent = mkAgent(mktmp(), new Map([["rv-code", code]]))
  assert.equal(effectiveAdvisorRound(agent), 5, "开放 code 实例轮次可读")
  const settled = settleAdvisorRun(agent, {
    id: 2, cancelled: false, reviewType: "code", docAbs: [], launchSeq: -1, designToken: null,
    report: "Round 1 review text — all clear.", run: code,
  })
  assert.equal(code.round, 6, "逐次结算照常递增")
  assert.equal(agent._advisorRound, 6, "镜像字段同拍（显示面）")
  assert.equal(settled.report.includes("no usable settlement"), false, "可用判决不产结论块")
})

test("T-AF7 guard 不因轮次停推：code 实例 round=6 仍推回（提醒载 round 7）；MAX_ADVISOR_PUSHBACKS 仍限 3", () => {
  const mkGuardAgent = () => ({
    cwd: mktmp(), history: [], config: { advisor: { guard: true }, agent: {} },
    _mutatedThisRun: true, _calledAdvisorThisRun: false, _touchedFiles: [], tasks: [],
    _advisorRuns: new Map([["rv", codeRun(6)]]),
  })
  const agent = mkGuardAgent()
  const res = handleCompletion(agent, { content: "done" }, 0, 1, 0, false, 0, {})
  assert.equal(res.action, "continue", "照常推回（轮次不参与停推判定——撤 cap）")
  assert.match(String(agent.history.at(-1).content), /\(round 7\)/, "提醒载本次将使用的轮次号")
  const capped = mkGuardAgent()
  const res2 = handleCompletion(capped, { content: "done" }, 0, 1, 0, false, 3, {})
  assert.equal(res2.action, "done", "达 MAX_ADVISOR_PUSHBACKS（3）后不推回——guard 自身节流仍在")
  assert.ok(!String(capped.history.at(-1).content).includes("MUST get an advisor review"), "无推回提醒注入")
})

// ─── T-AF11 / AC-4：零载体与导出面结构断言 ───────────────────────────────────

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const TREES = ["thincoder-core", "thincoder-cli", "thincoder-vscode"]
// 针为拼接构造——本档自身（三树内 *.mjs）不得成为命中源。
const NEEDLES = [
  ["_designReview", "Streaks"].join(""),
  ["designReview", "Streak"].join(""),
  ["review-", "streak"].join(""),
  ["MAX_ADVISOR", "_ROUNDS"].join(""),
  ["build", "CapMessage"].join(""),
  ["buildDesignReview", "GuardMessage"].join(""),
  ["ADVISOR_DESIGN_STREAK", "_STOP_PREFIX"].join(""),
  ["convergence ", "cap reached"].join(""),
]
function walkMjs(root, out = []) {
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (["node_modules", ".git", "_archive", ".thincoder"].includes(e.name)) continue
    const p = join(root, e.name)
    if (e.isDirectory()) walkMjs(p, out)
    else if (e.name.endsWith(".mjs")) out.push(p)
  }
  return out
}
/** 源面扫（`test/` 除外——测试档对字段名 / 旧档名的引用属行为与沿革面，非残留判据）。 */
const SRC_FILES = TREES.flatMap((t) => walkMjs(join(REPO, t))).filter((f) => !f.split(/[\\/]/).includes("test"))

test("T-AF11 零载体与导出面：失败结算不创建计数载体；停止谓词 / 计数函数 / cap 常量与构建器零导出、三树零命中", () => {
  const agent = mkAgent(mktmp())
  const settled = settleAdvisorRun(agent, {
    id: 1, cancelled: false, reviewType: "design", docAbs: [], launchSeq: -1, designToken: null,
    report: `Findings.\n\n${TAIL}`,
    run: { reviewType: "design", designId: "d", round: 0, priorOutput: null, open: true, docSetKey: "k" },
  })
  assert.ok(settled.report.includes("criterion=timeout"), "失败结论块在位")
  assert.equal(agent._designReviewStreaks, undefined, "失败结算不创建会话级计数载体（F28③）")
  const runExports = Object.keys(runMod)
  for (const name of [["MAX_ADVISOR", "_ROUNDS"].join(""), ["build", "CapMessage"].join(""), ["ADVISOR_DESIGN_STREAK", "_STOP_PREFIX"].join(""), ["buildDesignReview", "GuardMessage"].join("")]) {
    assert.equal(runExports.includes(name), false, `run.mjs 零导出：${name}`)
  }
  assert.equal(typeof runMod.ADVISOR_LAUNCH_REFUSAL_PREFIX, "string", "启动拒绝前缀契约保留（稳定消费面零改）")
  assert.deepEqual(Object.keys(factsMod).sort(), ["docSetKey", "normAbs"], "事实面档 = 纯事实（零停止谓词 / 零计数函数）")
  const hits = []
  for (const f of SRC_FILES) {
    const lines = readFileSync(f, "utf8").split("\n")
    lines.forEach((l, i) => {
      for (const needle of NEEDLES) if (l.includes(needle)) hits.push(`${f.replace(/\\/g, "/").split("/thincoder/")[1]}:${i + 1} => ${needle}`)
    })
  }
  assert.deepEqual(hits, [], "三树源面扫：计数载体 / 停止谓词 / cap 常量与构建器字面零命中（含注释面；test/ 与 _archive 除外域）")
})
