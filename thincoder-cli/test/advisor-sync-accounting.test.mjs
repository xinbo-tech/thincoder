/**
 * advisor-sync-accounting.test.mjs — 第 13 批（F16 同步面扩展）用例表 1:1 落地：T-SG1–T-SG6
 * （设计档 `docs/design/ADVISOR-CONVERGENCE.md` §15.4/§15.5——AC-SG1–AC-SG4）。
 *
 * 断言对象 = `thincoder-core/agent/record-results.mjs` advisor 记账分支的 **sync else 分支**
 * （depth>0 自审 / 显式 `async:false` / 无 depth 直调——同步路径 `src/agent-tools/advisor.mjs:198`）：
 * 未完成尾（单谓词 `advisorIncompleteMarker`——六 kind）+ 非设计面（含类型不可判）⇒ **不置**
 * `_calledAdvisorThisRun`（guard 可重推）；round 进位 / prior 规则 / refused / asyncAck 语义零改
 * （置位规则表 = §15.2——与 `settleAdvisorRun.failureVerdict` 逐条 parity）。
 *
 * 单测零网络 / 零真实 LLM / 零长等待——直接调用 `recordToolResults` + stub agent
 * （`test/advisor-chain-guards.test.mjs` 同族先例；该档近 500 行硬帽——本档独立新建，不复用）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { recordToolResults } from "@thincoder/core/agent/record-results.mjs"

/** 宿主尾族六 kind 的块首行前缀（§14.3——`src/advisor/compaction.mjs` 同族逐字）。 */
const TAILS = {
  context_limit: "Advisor: context window limit reached (123456 tokens). Review incomplete — too many tool calls. Try a narrower scope.",
  turn_cap: "Advisor: stopped after 100 tool rounds — the review appears to be looping. You may retry with a narrower scope.",
  timeout: "Advisor: review timeout after 600s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.",
  empty: "Advisor: empty response — review was inconclusive",
  interrupted: "Advisor: interrupted.",
  review_failed: "Advisor: review failed (timeout) — The model took too long. Try with a narrower scope.",
}
/** 干净评审结果（含审查表 → `looksLikeReviewOutput` 命中——prior 规则面）。 */
const CLEAN = "## Review — all clear\n\n| # | Category | Severity |\n|---|---|---|\n| 1 | none | 🔵 |\n\nNo findings — nothing to fix."
const TOOLS = new Map([["advisor", { name: "advisor", readonly: true, sideEffectExempt: true }]])

/** stub agent（`recordToolResults` 消费面最小集：history（pushReal）+ sync 记账状态 + 实例注册表）。 */
function mkAgent(reviewType = "code") {
  const reviewId = `rid-${reviewType}`
  const run = { reviewId, reviewType, designId: null, round: 0, priorOutput: null, stale: false, open: true, docSetKey: null }
  const agent = {
    cwd: "C:/proj/sg", history: [],
    _calledAdvisorThisRun: false, _advisorRound: 0,
    _advisorRuns: new Map([[reviewId, run]]),
    _advisorSyncCalls: new Map([["tc1", reviewId]]),
    _advisorRefusals: new Set(), _advisorAsyncAcks: new Set(),
  }
  return { agent, run }
}
/** 驱动一次 sync advisor 工具结果提交（toolCallId 默认 tc1——legacy 直调用别的 id）。 */
const commit = (agent, result, id = "tc1") =>
  recordToolResults(agent, TOOLS, [{ toolCall: { id, name: "advisor", arguments: "{}" }, result, ok: true }])

test("T-SG1 正常：sync code run + 干净评审结果——置「已覆盖」+ round 进位 + prior 照旧（零回归）", async () => {
  const { agent, run } = mkAgent("code")
  await commit(agent, CLEAN)
  assert.equal(agent._calledAdvisorThisRun, true, "干净结果照常计入（既有语义零改）")
  assert.equal(run.round, 1, "per-review round 进位")
  assert.equal(agent._advisorRound, 1, "镜像 round 同步")
  assert.equal(run.priorOutput, CLEAN, "prior 规则照旧（review-looking 输出入 prior）")
  assert.equal(agent._advisorSyncCalls.size, 0, "sync 标记消费（删除）照旧")
})

test("T-SG2 错误：sync code run + 时间线 + timeout 尾（尾不在首行）——不置标记；round 照常进位", async () => {
  const { agent, run } = mkAgent("code")
  await commit(agent, `Round 1 timeline text.\n\n${TAILS.timeout}`)
  assert.equal(agent._calledAdvisorThisRun, false, "截断评审不得计为已覆盖（F16 本体——guard 可重推）")
  assert.equal(run.round, 1, "attempts 计数照旧（未完成尝试仍使轮次进位——轮次仅作提示词衰减与显示，无机械上限）")
  assert.equal(agent._advisorRound, 1)
})

test("T-SG3 边界：sync design run + 同款截断尾——置标记（parity：设计评审无代码面）", async () => {
  const { agent, run } = mkAgent("design")
  await commit(agent, `Findings text.\n\n${TAILS.timeout}`)
  assert.equal(agent._calledAdvisorThisRun, true, "设计评审保持计入（settle 面 parity 零改）")
  assert.equal(run.round, 1, "round 亦照常进位")
})

test("T-SG4 错误/正常：legacy 直调（无 resolution marker）——截断尾不置 / 干净结果置（fail-closed）", async () => {
  // ① 截断尾 + 无 marker ⇒ run 类型不可判 ⇒ 不置（fail-closed——保守方向）
  const a1 = mkAgent("code").agent
  await commit(a1, `Timeline body.\n\n${TAILS.turn_cap}`, "tc-legacy")
  assert.equal(a1._calledAdvisorThisRun, false, "截断尾不得计「已覆盖」（fail-closed）")
  assert.equal(a1._advisorRound, 1, "legacy 镜像 round 照常进位")
  // ② 干净结果 + 无 marker ⇒ 置（零回归）
  const a2 = mkAgent("code").agent
  await commit(a2, CLEAN, "tc-legacy")
  assert.equal(a2._calledAdvisorThisRun, true, "干净 legacy 直调照常计入")
  assert.equal(a2._advisorRound, 1)
})

test("T-SG5 边界：六 kind 全族（sync code run）——逐一不置标记（F16 全覆盖）", async () => {
  assert.deepEqual(Object.keys(TAILS).sort(), ["context_limit", "empty", "interrupted", "review_failed", "timeout", "turn_cap"], "六 kind 全覆盖（§14.3 前缀族）")
  for (const [kind, tail] of Object.entries(TAILS)) {
    const { agent, run } = mkAgent("code")
    await commit(agent, `Review timeline body.\n\n${tail}`)
    assert.equal(agent._calledAdvisorThisRun, false, `${kind}: 不得计为已覆盖`)
    assert.equal(run.round, 1, `${kind}: round 照常进位`)
  }
})

test("T-SG6 边界：refused / asyncAck 两分支先行排除——语义零改（不置标记、round 不进位）", async () => {
  // ① refused（pool full / per-review cap——§14.4 既有语义）
  const a1 = mkAgent("code").agent
  a1._advisorRefusals.add("tc1")
  await commit(a1, "Advisor: launch refused — another review is already running in the background pool.")
  assert.equal(a1._calledAdvisorThisRun, false, "拒绝不计调用（guard 继续推）")
  assert.equal(a1._advisorRound, 0, "拒绝不进位")
  assert.equal(a1._advisorRefusals.size, 0, "拒绝标记消费（删除）照旧")
  // ② asyncAck（深度 0 异步启动回执——结算面另行记账）
  const a2 = mkAgent("code").agent
  a2._advisorAsyncAcks.add("tc1")
  await commit(a2, '{"status":"running","note":"review launched"}')
  assert.equal(a2._calledAdvisorThisRun, false, "ack 面不在此记账（settle 拥有）")
  assert.equal(a2._advisorRound, 0, "ack 不进位")
  assert.equal(a2._advisorAsyncAcks.size, 0, "ack 标记消费照旧")
})
