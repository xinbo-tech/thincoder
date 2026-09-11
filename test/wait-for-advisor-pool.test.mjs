/**
 * wait-for-advisor-pool.test.mjs — 第 10 批条目 B ②（CLI 端）：`wait_for "advisor settled"`
 * 判据 = **评审池真实态**（双载体）。
 * 设计权威：`docs/design/AGENT-LOOP.md` §18.3 #2 / §18.6（T-B4/T-B5）/ §18.7（AC-B2）；
 * 需求：`docs/requirements/AGENT-LOOP.md` §4（F-B2）。VSC 镜像同构（各端独立实现·同输入同
 * 判定——NFR-B1）。
 *
 * 红→绿（修前病灶复现）：判据读**子代理池**的 role==="advisor" 条目（`src/tools/ops.mjs`
 * 原 `hasRunningAsync(agent, e => e.role === "advisor")`——评审条目只在 `_asyncAdvisors`
 * → 恒无命中 → 恒真 0ms 秒过（用户实证）。本档首断言即 running=false。
 * 手法：直驱真 evaluateWaitForCondition（真池形状 fixture——零网络/无定时器）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { evaluateWaitForCondition, parseWaitForCondition } from "../src/tools/ops.mjs"

const PKG = fileURLToPath(new URL("../package.json", import.meta.url))

/** 评审池条目真形状（advisor-async launchAsyncAdvisor——role/reviewType/run.round/status/done）。 */
const advisorEntry = (over = {}) => ({
  id: 7, role: "advisor", reviewType: "design", run: { round: 2 }, status: "running",
  done: false, cancelled: false, startedAt: Date.now() - 5000, ...over,
})

test("T-B4（AC-B2 红→绿）：池内评审 running → 条件为假；池空 → 真", async () => {
  const agent = { _asyncAdvisors: new Map([["7", advisorEntry()]]) }
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), false,
    "有 running 评审 → 未 settle（修前此处恒真 0ms 秒过——用户实证缺陷）")
  agent._asyncAdvisors.clear()
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), true, "池空 → settle（真）")
})

test("T-B4b：判据只读评审池——子代理池的同名 role=advisor 条目不入判据", async () => {
  const agent = { _asyncSubagents: new Map([["7", { id: 7, role: "advisor", status: "running", done: false }]]) }
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), true,
    "子代理池里的 role=advisor 条目不影响判据（评审池才是事实源）")
})

test("T-B5（AC-B2）：池内 done:true 未消化 → 判为 settled（不阻塞）；queued 算在飞", async () => {
  const agent = { _asyncAdvisors: new Map([["7", advisorEntry({ status: "done", done: true })]]) }
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), true, "仅 done（未消化）→ settled（不阻塞）")
  agent._asyncAdvisors.set("8", advisorEntry({ id: 8, status: "queued" }))
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), false, "queued 算在飞（未 settle）")
})

test("T-B4c 双载体：history._asyncAdvisors 载体同判（∪ agent 载体）", async () => {
  const agent = { history: { _asyncAdvisors: new Map([["9", advisorEntry({ id: 9 })]]) } }
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), false, "history 载体 running → 假")
  agent.history._asyncAdvisors.clear()
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), true, "history 载体空 → 真")
})

test("T-B4d 零回归：条件字面/其余条件零变化 + 未初始化 agent 不崩", async () => {
  assert.deepEqual(parseWaitForCondition("advisor settled"), { kind: "advisor", arg: null }, "条件字面零变（D-B2：不加新字面）")
  assert.equal(await evaluateWaitForCondition("file exists:" + PKG, { cwd: process.cwd() }), true, "file 条件零变化")
  assert.equal(await evaluateWaitForCondition("consult done", { agent: {} }), true, "consult 条件零变化（无会话 → 真）")
  assert.equal(await evaluateWaitForCondition("subagent id:42 done", { agent: {} }), true, "subagent 条件零变化（缺席 id = done by vacuity）")
  assert.equal(await evaluateWaitForCondition("advisor settled", { agent: {} }), true, "无池 → 真（空判据不崩）")
  assert.equal(await evaluateWaitForCondition("advisor settled", {}), true, "无 ctx.agent → 真（空判据不崩）")
})
