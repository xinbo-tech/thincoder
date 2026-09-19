/**
 * vsc-autoapprove-field.test.mjs — VSC 顶层 `agent.autoApprove` 字段接线回归
 * （批次 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2.7 用例 T1–T4 + §3 🔵#7）。
 *
 * 缺陷本体：VSC 顶层 agent 从不提供 `autoApprove` 字段（live AUTO 值只走 `getAuto` 闭包）
 * ⇒ 核侧字段读点（spawn 门 `thincoder-core/agent-tools/subagent.mjs:258` · escalate 门 `:184`
 * · 子代权限继承 `subagent-spawn.mjs:305` · 读点族 `subagent-async.mjs:272` …）恒按「非 AUTO」判
 * ——面板 AUTO 开着，自动轮 spawn 仍恒被拒 / 子代理写仍恒被拒。
 * 修复 = `hydrateRun`「B 类 run 绑定」以**访问器**把 `agent.autoApprove` 接 `getAuto` live 闭包
 * （`thincoder-vscode/src/agent/setup.mjs`；无 setter ⇒ 写入 fail-loud）。
 *
 * 夹具 = 生产宿主形状（`hydrateRun(buildTopLevelAgent(), …)` 产物作父对象——**零手写字段**；
 * `host-shape-spawn.test.mjs` 同款）+ mock provider（零外网）。断言直接打在门判据上——
 * mock provider 不覆盖权限面（同链前序批次两次因此漏检）。
 *
 * 修前必红（§5 原样存证）：T1（字段缺席 + 赋值不抛）/ T2 / T3 / T4 positive 分支。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync,  mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"
import { buildTopLevelAgent, hydrateRun } from "../../src/agent/setup.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

/** 手动档自动轮的 spawn/escalate 门拒绝串（逐字——`subagent.mjs:258`/`:184` 同串）。 */
const GATE_REFUSAL = '{"status":"error","error":"cannot spawn subagents from a manual auto-turn — wait for user input"}'

/** 无网络 provider（不经 LLM 的用例：hydrate 仍需要一个 provider 形状）。 */
const DUMMY_PROVIDER = { name: "mock-provider", model: "mock-model", apiKey: "test-key", baseURL: "http://127.0.0.1:1", format: "openai" }

/** 子代理报告（mock 末步——≥ MIN_REPORT_CHARS(200) 免扩写轮；`host-shape-spawn` 同款形态）。 */
const CHILD_REPORT =
  "Subagent report (mock): autoApprove field wiring verified — the child assembled against the production parent and returned through the real spawn chain.".repeat(3)

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-autoapprove-"))
  mkdirSync(join(work, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
  cfgDir = mkdtempSync(join(tmpdir(), "tc-autoapprove-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  // Windows 临时区句柄滞后——重试 + 兜底（同 `vsc-spawn-ctx-permission` 档）：
  // teardown 抖动不得把测试变红；残留仅落在 OS 临时区。
  for (const d of [work, cfgDir]) {
    try { rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }) } catch { /* OS temp — best effort */ }
  }
})

/** 生产宿主形状父对象：`hydrateRun(buildTopLevelAgent(), …)` 产物 + 调用期载体照搬
 *  （`agent.provider` / async 池两字段——`host-shape-spawn.test.mjs:66-77` 同款；零手写字段）。 */
async function hostParent({ provider, getAuto }) {
  const run = await hydrateRun(buildTopLevelAgent(), {
    provider, cwd: work, input: "parent turn (production host shape)", depth: 0, role: null, getAuto, opts: {},
  })
  const agent = run.agent
  agent.provider = provider
  agent._asyncSubagents = new Map()
  agent._asyncQueue = []
  return agent
}

/** spawn 缝（`host-shape-spawn.test.mjs:79-84` 同款 ctx 形态——真核 spawn 链；无 ctx.onPermissionRequest）。 */
const spawnCtx = (agent) => ({
  agent, cwd: work, depth: 0,
  callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
  getAuto: () => false,
})

/** 装配探针：真门序（`gateEngCoderSpawn`）+ 真装配（`buildSpawnChild`——`host-shape-spawn` 同款）。 */
function buildProbe(parent, args, role) {
  const attempt = gateEngCoderSpawn(parent, parent._depth, role, args.async === true)
  return buildSpawnChild(parent, spawnCtx(parent), args, role, args.async === true, [], [], attempt)
}

// ─── T1：字段在场 + live 语义 + 无 setter（fail-loud）──────────────────────

test("T1 结构 + live：hydrate 后 agent.autoApprove 取 getAuto() 值；翻转不重 hydrate 即读新值；赋值即抛", async () => {
  let auto = true
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => auto })
  assert.equal(agent.autoApprove, true, "字段在场且 = getAuto()（修复前 undefined——核字段读点恒判非 AUTO）")
  auto = false
  assert.equal(agent.autoApprove, false, "live 锚：不重 hydrate、仅翻转闭包即读新值（快照赋值形态在此红）")
  auto = true
  assert.equal(agent.autoApprove, true, "翻回同读（双向 live）")
  assert.throws(() => { agent.autoApprove = false }, TypeError, "无 setter ⇒ 写入即 TypeError（fail-loud；修复前静默成功）")
  assert.equal(agent.autoApprove, true, "抛后值未被写坏（面板 flag 仍是唯一来源）")
})

// ─── T1b：复用单例的二次 hydrate（生产路径 = 每轮复跑 hydrateRun 换 getAuto 闭包）────

test("T1b 结构 + live（复用单例）：二次 hydrate 换 getAuto 闭包 → 访问器重定义取新闭包（不残留上轮）", async () => {
  let a1 = false
  let a2 = true
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => a1 })
  assert.equal(agent.autoApprove, false, "第一轮闭包 g1 获值")
  // 生产形态 = 面板每轮对同一单例复跑 hydrateRun（agent.mjs:108）并传新 getAuto（panel-chat.mjs:427）
  await hydrateRun(agent, {
    provider: DUMMY_PROVIDER, cwd: work, input: "parent turn 2 (reuse singleton)", depth: 0, role: null, getAuto: () => a2, opts: {},
  })
  assert.equal(agent.autoApprove, true, "二次 hydrate 重定义访问器——取新闭包 g2 值")
  a1 = true // 旧闭包翻转——不得影响（访问器已换绑）
  assert.equal(agent.autoApprove, true, "旧闭包已解绑（不残留上轮——复用单例换轮换闭包）")
  a2 = false
  assert.equal(agent.autoApprove, false, "新闭包 live 同读")
})

// ─── T2/T2n：spawn 门（行为——真核 spawn 链）─────────────────────────────

test("T2 行为·spawn 门：AUTO 档 + 自动轮（_inAutoTurn）→ 真 spawn 不被门拒、子报告返回", async () => {
  const llm = await mockLLM([{ content: CHILD_REPORT }])
  try {
    const agent = await hostParent({ provider: providerFor(llm), getAuto: () => true })
    agent._inAutoTurn = true
    const calls0 = llm.calls
    const report = await subagentTool.execute({ task: "勘察现状", role: "explore", async: false }, spawnCtx(agent))
    assert.ok(
      !String(report).includes("cannot spawn subagents from a manual auto-turn"),
      `非门拒绝（修复前逐字门拒绝串）——实到：${String(report).slice(0, 160)}`,
    )
    assert.ok(llm.calls > calls0, `真子运行触达 mock provider（修复前 0 请求——门拒即返回）——实到 ${llm.calls - calls0} 次`)
    assert.match(String(report), /autoApprove field wiring verified/, "子报告返回（真 spawn 链走通）")
  } finally { await llm.close() }
})

test("T2n 反证：手动档 + 自动轮 → 逐字门拒绝串（零回归——规则本身不动）", async () => {
  const llm = await mockLLM([{ content: CHILD_REPORT }])
  try {
    const agent = await hostParent({ provider: providerFor(llm), getAuto: () => false })
    agent._inAutoTurn = true
    const calls0 = llm.calls
    const report = await subagentTool.execute({ task: "勘察现状", role: "explore", async: false }, spawnCtx(agent))
    assert.equal(String(report), GATE_REFUSAL, "逐字门拒绝串（修复前/后同串——零回归）")
    assert.equal(llm.calls, calls0, "门拒即返回——零 provider 请求")
  } finally { await llm.close() }
})

// ─── T3/T3n：子代权限继承（行为——真装配 childOpts）─────────────────────

test("T3 行为·子代权限继承：AUTO 档父 → childOpts.onPermissionRequest 直通 true", async () => {
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => true })
  const built = buildProbe(agent, { task: "实现小功能", role: "coder", async: false }, "coder")
  assert.equal(
    await built.childOpts.onPermissionRequest("write", { path: "x" }, null), true,
    "AUTO 档子代写直通（`subagent-spawn.mjs:305` 父字段读点获值；修复前 false——症状②核内源）",
  )
})

test("T3n 反证：手动档同构 → false（无通道 fixture 语义——核分支零改）", async () => {
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => false })
  const built = buildProbe(agent, { task: "实现小功能", role: "coder", async: false }, "coder")
  assert.equal(
    await built.childOpts.onPermissionRequest("write", { path: "x" }, null), false,
    "手动档 + fixture 无 ctx.onPermissionRequest ⇒ 核分支 return false（现状语义）",
  )
})

// ─── T4/T4n：escalate 门（行为——只锚门判据，下游链结果不设前提）─────────

test("T4 行为·escalate 门：AUTO 档 + 自动轮 → 越过门（结果或抛错不含门拒绝串）", async () => {
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => true })
  agent._inAutoTurn = true
  let out
  try {
    out = await subagentTool.execute({ action: "escalate", task: "飞刀任务", async: false }, spawnCtx(agent))
  } catch (e) {
    out = `threw: ${e?.message ?? String(e)}`
  }
  assert.ok(
    !String(out).includes("cannot spawn subagents from a manual auto-turn"),
    `非门拒绝（修复前逐字门拒绝串）——实到：${String(out).slice(0, 160)}`,
  )
})

test("T4n 反证：手动档 + 自动轮 → 逐字门拒绝串（escalate 分支）", async () => {
  const agent = await hostParent({ provider: DUMMY_PROVIDER, getAuto: () => false })
  agent._inAutoTurn = true
  const out = await subagentTool.execute({ action: "escalate", task: "飞刀任务", async: false }, spawnCtx(agent))
  assert.equal(String(out), GATE_REFUSAL, "逐字门拒绝串（`subagent.mjs:184` escalate 分支）")
})
