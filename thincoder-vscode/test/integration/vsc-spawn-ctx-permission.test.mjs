/**
 * vsc-spawn-ctx-permission.test.mjs — VSC spawn tool-ctx 权限通道接线回归
 * （批次 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2.13 扩一 F1 + §2.17 T5–T9）。
 *
 * 缺陷本体：VSC `execute-tools.mjs` toolCtx 不提供 `ctx.onPermissionRequest`（核同范式
 * `thincoder-core/agent/dispatch.mjs:395`）⇒ 手动档 coder/eng-designer 子代理写路径的核分支
 * `subagent-spawn.mjs:308-309` 恒 `return false`——**静默拒绝、不出卡**（症状②「permission
 * denied by user」的核内源）。修复 = 两点式：① `panel-callbacks.mjs` 供给
 * `callbacks.onPermissionRequest`（按次解析归属键 + 复用 `makeChildPermission`——
 * announce → ask → 清态语义单源）② `execute-tools.mjs` toolCtx 透传（同档 `onQuestion` 先例）。
 *
 * 夹具 = 生产宿主形状父对象（`hydrateRun(buildTopLevelAgent(), …)`——零手写字段）+ mock provider
 * + panel 假体（`test/child-permission.test.mjs` 模式 + `_wvReady` 直投）+ 真 spawn 链。
 * 修前必红（§5 原样存证）：T5–T9；T7b 于 A′ 落地后单独转绿（分阶段存证）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync,  existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { buildTopLevelAgent, hydrateRun } from "../../src/agent/setup.mjs"
import { buildPanelCallbacks } from "../../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../../src/extension/panel-messages.mjs"
import { executeToolBatches } from "../../src/agent/execute-tools.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

/** 子代理报告（mock 末步——≥ MIN_REPORT_CHARS(200) 免扩写轮）。 */
const CHILD_REPORT =
  "Subagent report (mock): spawn ctx permission channel verified — the child write reached the panel card and returned through the real spawn chain.".repeat(3)

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-spawn-ctx-"))
  mkdirSync(join(work, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
  cfgDir = mkdtempSync(join(tmpdir(), "tc-spawn-ctx-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  // Windows 临时区句柄滞后（刚写的子代产物可能仍被占用）——重试 + 兜底：teardown 抖动
  // 不得把测试变红；残留仅落在 OS 临时区。
  for (const d of [work, cfgDir]) {
    try { rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }) } catch { /* OS temp — best effort */ }
  }
})

const sleep = (ms = 5) => new Promise((r) => setTimeout(r, ms))
async function until(cond, ms = 8000) {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("until: timeout")
    await sleep(5)
  }
}

/** panel 假体（`test/child-permission.test.mjs:62-77` 模式 + `_wvReady` 直投——卡/事件同捕数组）。 */
function stubPanel(overrides = {}) {
  const posted = []
  const p = {
    _autoApprove: false,
    _permissionQueue: [],
    _permissionSeq: 0,
    _abortController: null,
    _wvReady: true,
    _setStatus() {},
    _refreshStatus() {},
    _panel: { webview: { postMessage: (m) => { posted.push(m) } } },
    posted,
    ...overrides,
  }
  return p
}

/** 生产宿主 run + 面板假体 + 回调装配（真工厂 `buildPanelCallbacks`——供给面本体的消费入口）。 */
async function hostRunWithCards({ provider, getAuto, cwd }) {
  const run = await hydrateRun(buildTopLevelAgent(), {
    provider, cwd, input: "parent turn (production host shape)", depth: 0, role: null, getAuto, opts: {},
  })
  run.agent.provider = provider
  run.agent._asyncSubagents = new Map()
  run.agent._asyncQueue = []
  const panel = stubPanel()
  const callbacks = buildPanelCallbacks(panel, { cwd, autoTurn: false, history: run.history, fullHistory: run.fullHistory })
  return { run, panel, callbacks }
}

/** 卡片应答驱动：轮询权限队列逐卡按策略应答（`entry.owner?.label` 供策略读），直到 driven run 落定。
 *  run 拒绝时原样重抛（测试基建错误不掩盖）。 */
async function driveCards(panel, runPromise, verdictFor, { timeoutMs = 20000 } = {}) {
  let done = false
  const settle = runPromise.then((v) => { done = true; return v }, (e) => { done = true; throw e })
  settle.catch(() => {}) // 超时路径防 unhandled rejection（正常路径下方 await 原样重抛）
  const answered = new Set()
  const t0 = Date.now()
  while (!done) {
    if (Date.now() - t0 > timeoutMs) throw new Error("driveCards: timeout — the driven run did not settle")
    const next = panel._permissionQueue.find((e) => !answered.has(e.id))
    if (next) {
      answered.add(next.id)
      await handlePanelMessage(panel, { type: "permissionResponse", approved: verdictFor(next), promptId: next.id })
    } else {
      await sleep(5)
    }
  }
  return settle
}

/** 执行面驱一次 spawn（生产形状父对象 + 真 executeToolBatches——权限门/透传面全经真码）。 */
function driveParentSpawn({ run, callbacks, cwd, getAuto, task = "实现小功能", role = "coder" }) {
  return executeToolBatches(run.agent, {
    response: { toolCalls: [{ id: "call_1", name: "subagent", arguments: JSON.stringify({ task, role, async: false }) }] },
    history: run.history, fullHistory: run.fullHistory, toolByName: run.toolByName,
    getAuto, callbacks, signal: null, sessionSignal: null, cwd, recentSigs: [], depth: 0,
  })
}

/** 子代理回传（父 history 里 subagent 工具结果——模型可见面）。 */
const subagentResult = (run) => run.history.filter((m) => m.role === "tool").map((m) => String(m.content)).find((c) => c.includes("spawn ctx permission channel verified"))

// ─── T5：供给面（正常 · owner 归属 + ⏸ announce 序）──────────────────────

test("T5 供给（正常 · owner + ⏸）：coder#7/write → announce(write) → 卡(owner=coder#7, tool=write) → 批复 → 清态", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })
  assert.equal(typeof cbs.onPermissionRequest, "function", "供给在场（修复前 undefined——核 spawn 分支静默拒绝不出卡源）")

  const p = cbs.onPermissionRequest("coder#7/write", { path: "a.txt" })
  await until(() => panel._permissionQueue.length === 1)
  const req = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(req.tool, "write", "卡工具名 = 归属键之后的工具名（非复合名）")
  assert.equal(req.owner, "coder#7", "卡归属 = owner label（KD-8——与活动块同源）")
  assert.equal(typeof req.promptId, "number", "promptId 随卡")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req.promptId })
  assert.equal(await p, true, "批复 → resolve(true)")
  assert.equal(panel._permissionQueue.length, 0, "出队（release 单点）")

  const approvals = panel.posted.filter((m) => m.type === "subagentApproval")
  assert.deepEqual(approvals.map((m) => m.tool), ["write", null], "announce → ask → 清态（`makeChildPermission` 顺序单源）")
  assert.deepEqual(approvals.map((m) => m.id), [7, 7], "announce 归属 id = 键内 id")
  const seq = panel.posted.map((m) => m.type)
  assert.ok(
    seq.indexOf("subagentApproval") < seq.indexOf("permissionRequest") && seq.indexOf("permissionRequest") < seq.lastIndexOf("subagentApproval"),
    `posts 序 = announce → 卡 → 清态——实到：${JSON.stringify(seq)}`,
  )
})

// ─── T6：供给面（边界 · 键形归属 / 回退 + AUTO）─────────────────────────────

test("T6 供给（边界 · 键形归属 / 回退 + AUTO）：continue 键形 ⇒ 归属卡；非键 / 嵌套 ⇒ 原样名回退（owner=null、零 announce）；AUTO 直返 true 零卡", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })

  // ① 撞帽续跑（`continue`——两态：键形 args.agent ⇒ 归属 / 非键 ⇒ 回退；残环批收正）
  const p1 = cbs.onPermissionRequest("continue", { turns: 3, agent: "coder#7" })
  await until(() => panel._permissionQueue.length === 1)
  const c1 = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(c1.tool, "continue", "键形卡工具名 = continue（原样）")
  assert.equal(c1.owner, "coder#7", "键形 ⇒ 归属标签（文法单源——端侧解析）")
  const a1 = panel.posted.filter((m) => m.type === "subagentApproval")
  assert.deepEqual(a1.map((m) => m.tool), ["continue"], "键形 ⇒ announce 先于卡（块头 ⏸ 对位）")
  assert.deepEqual(a1.map((m) => m.id), [7], "announce 归属 id = 键内 id")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: c1.promptId })
  assert.equal(await p1, true, "① 键形批复 → true")
  assert.deepEqual(panel.posted.filter((m) => m.type === "subagentApproval").map((m) => m.tool), ["continue", null], "announce → 清态随行（顺序单源）")

  const p1b = cbs.onPermissionRequest("continue", { turns: 3, agent: "zhipu:glm-5.2" })
  await until(() => panel._permissionQueue.length === 1)
  const c1b = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(c1b.tool, "continue", "非键 ⇒ 原样名（卡可达）")
  assert.equal(c1b.owner, null, "非键 ⇒ 无归属（回退语义）")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: false, promptId: c1b.promptId })
  assert.equal(await p1b, false, "① 非键拒绝 → false")

  // ② 嵌套 relay 形态（inner 非空——本批后仍可达的回退面）⇒ 原样名回退
  const annBefore = panel.posted.filter((m) => m.type === "subagentApproval").length
  const p2 = cbs.onPermissionRequest("coder#7/explore#1/read", { path: "z" })
  await until(() => panel._permissionQueue.length === 1)
  const c2 = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(c2.tool, "coder#7/explore#1/read", "嵌套形态 = 原样名（不归属）")
  assert.equal(c2.owner, null, "无归属标签")
  assert.equal(panel.posted.filter((m) => m.type === "subagentApproval").length, annBefore, "回退分支零 announce")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: c2.promptId })
  assert.equal(await p2, true, "② 批复 → true")

  // ③ AUTO（live）⇒ 直返 true 零卡
  const before = panel.posted.length
  panel._autoApprove = true
  assert.equal(await cbs.onPermissionRequest("coder#9/write", { path: "b.txt" }), true, "AUTO live → 直返 true")
  assert.equal(panel.posted.length, before, "零新卡（AUTO 短路先于解析）")
})

// ─── T7/T7b/T8：全链（真 spawn 链 —— 手动出卡 / AUTO 直通 / deny 语义）────

test("T7 全链（正常 · 手动）：驱真 spawn（coder）→ 出卡（owner=coder#N, tool=write）→ 批准 → 文件落地 + 子报告返回", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "child-out.txt", content: "written by child\n" } } },
    { content: CHILD_REPORT },
  ])
  try {
    const box = mkdtempSync(join(work, "t7-"))
    mkdirSync(join(box, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
    const getAuto = () => false
    const { run, panel, callbacks } = await hostRunWithCards({ provider: providerFor(llm), getAuto, cwd: box })
    const calls0 = llm.calls
    await driveCards(panel, driveParentSpawn({ run, callbacks, cwd: box, getAuto }), () => true)
    const cards = panel.posted.filter((m) => m.type === "permissionRequest")
    const childCard = cards.find((m) => /^coder#\d+$/.test(m.owner ?? ""))
    assert.ok(childCard, `子代写卡在场（修复前零卡——核分支静默 false）——实到卡片：${JSON.stringify(cards.map((m) => ({ tool: m.tool, owner: m.owner })))}`)
    assert.equal(childCard.tool, "write", "卡工具名 = write")
    assert.ok(llm.calls > calls0, "真子运行触达 mock provider")
    assert.equal(readFileSync(join(box, "child-out.txt"), "utf8"), "written by child\n", "批准后子代理写**文件真落地**（修复前恒拒、零落地）")
    assert.ok(subagentResult(run), "子报告经工具结果返回父（真链闭环）")
  } finally { await llm.close() }
})

test("T7b 全链（正常 · AUTO）：AUTO 档零卡直通 → 文件落地 + 子报告返回（A′ 面——修复前必红）", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "child-out.txt", content: "written by child\n" } } },
    { content: CHILD_REPORT },
  ])
  try {
    const box = mkdtempSync(join(work, "t7b-"))
    mkdirSync(join(box, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
    const getAuto = () => true
    const { run, panel, callbacks } = await hostRunWithCards({ provider: providerFor(llm), getAuto, cwd: box })
    await driveCards(panel, driveParentSpawn({ run, callbacks, cwd: box, getAuto }), () => true)
    const cards = panel.posted.filter((m) => m.type === "permissionRequest")
    assert.deepEqual(cards, [], `AUTO 档零卡（实到：${JSON.stringify(cards.map((m) => ({ tool: m.tool, owner: m.owner })))}）`)
    assert.equal(readFileSync(join(box, "child-out.txt"), "utf8"), "written by child\n", "AUTO 直通 → 文件落地（修复前卡在字段缺席：子代恒拒）")
    assert.ok(subagentResult(run), "子报告返回父")
  } finally { await llm.close() }
})

test("T8 全链（错误 · deny）：卡出 → deny → 子下一请求体含逐字 `permission denied by user` + 零落地", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "child-out.txt", content: "written by child\n" } } },
    { content: CHILD_REPORT },
  ])
  try {
    const box = mkdtempSync(join(work, "t8-"))
    mkdirSync(join(box, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
    const getAuto = () => false
    const { run, panel, callbacks } = await hostRunWithCards({ provider: providerFor(llm), getAuto, cwd: box })
    const calls0 = llm.calls
    // 策略：子代归属卡（owner=coder#N）deny；其余（顶层 spawn 等）批准——deny 只落在子写面上
    await driveCards(panel, driveParentSpawn({ run, callbacks, cwd: box, getAuto }), (e) => !/^coder#\d+$/.test(e.owner?.label ?? ""))
    const childCard = panel.posted.filter((m) => m.type === "permissionRequest").find((m) => /^coder#\d+$/.test(m.owner ?? ""))
    assert.ok(childCard, "子代写卡在场（修复前零卡——deny 面同样不可达）")
    const deniedBody = llm.requests.slice(calls0).find((r) => JSON.stringify(r.body).includes("permission denied by user"))
    assert.ok(deniedBody, "子下一请求体含逐字 `permission denied by user`（`agent/dispatch.mjs:331-332`）")
    assert.ok(!existsSync(join(box, "child-out.txt")), "零落地（deny = 未执行写——业务可观察结果）")
  } finally { await llm.close() }
})

// ─── T9：结构（透传 pin——修复行移除即红）───────────────────────────────

test("T9 结构（透传 pin）：toolCtx.onPermissionRequest === callbacks.onPermissionRequest（同引用）", async () => {
  const llm = await mockLLM([{ content: "noop" }])
  try {
    const box = mkdtempSync(join(work, "t9-"))
    mkdirSync(join(box, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
    const getAuto = () => false
    const { run, callbacks } = await hostRunWithCards({ provider: providerFor(llm), getAuto, cwd: box })
    let captured = null
    const probe = {
      name: "probe_ctx", readonly: true,
      execute: async (args, ctx) => { captured = ctx; return "probe ok" },
    }
    await executeToolBatches(run.agent, {
      response: { toolCalls: [{ id: "call_1", name: "probe_ctx", arguments: "{}" }] },
      history: run.history, fullHistory: run.fullHistory, toolByName: new Map([["probe_ctx", probe]]),
      getAuto, callbacks, signal: null, sessionSignal: null, cwd: box, recentSigs: [], depth: 0,
    })
    assert.ok(captured, "探针被真执行（结构探针有效）")
    assert.equal(typeof captured.onPermissionRequest, "function", "透传字段在场（修复前 undefined——透传行缺失）")
    assert.equal(captured.onPermissionRequest, callbacks.onPermissionRequest, "toolCtx 透传**同引用**（修复行移除即红）")
  } finally { await llm.close() }
})
