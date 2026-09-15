/**
 * vsc-panel-rings.test.mjs — 面板覆盖面残环（⏹ 释放 · 归属标签）端侧机检。
 *
 * 批次 = `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2.7（T-R1–T-R5n）。
 * 缺陷面（前批覆盖面 10 环表残环 9/10 + 评审 B5）：
 *   ① ⏹ 定向取消不释放已开权限卡——供给 `makeChildPermission` 构造 `signal: null`
 *      ⇒ gate 路径①（child abort——`permission-gate.mjs`）从未接源；
 *   ② escalate / continue 询问卡归属标签不闭——核名不携 id/model；
 *   ③ model 分支不可达（供给未传 `model`——`childOwnerLabel` 的 `<model>` 支恒不可达）。
 * 修复 = 端侧供给三补（条目级 signal / model / continue 键形解析——核侧名形态改见 T-A 档）。
 *
 * 夹具 = panel 假体 + `buildPanelCallbacks` 真工厂（供给本体消费入口）+ 池假体（挂
 * `panel._liveLines.history`——与 ⏹ 路由同源读取面）+ 生产形宿主 run（`hydrateRun`——
 * depth-0 池经访问器别名挂共享 history，`src/agent.mjs:137-150`——零手写字段）+ mock-llm
 * （T-R4 真 async spawn 链）。断言面 = 业务可观察（卡开 / 关 · 卡面归属文案 · 释放时机）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { buildTopLevelAgent, hydrateRun } from "../../src/agent/setup.mjs"
import { buildPanelCallbacks } from "../../src/extension/panel-callbacks.mjs"
import { handlePanelMessage } from "../../src/extension/panel-messages.mjs"
import { executeToolBatches } from "../../src/agent/execute-tools.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

let work
let cfgDir

before(() => {
  work = mkdtempSync(join(tmpdir(), "tc-panel-rings-"))
  cfgDir = mkdtempSync(join(tmpdir(), "tc-panel-rings-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
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

/** panel 假体（`test/child-permission.test.mjs` 模式 + `_wvReady` 直投——卡/事件同捕数组）。 */
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

/** 池假体绑定：`panel._liveLines`（生产形 = `panel-chat.mjs` 登记的 `{ history, fullHistory, cwd }`）——
 *  entries = [[id, entry], …]；与 `panel-messages` ⏹ 路由同源读取面。 */
function bindFakePool(panel, entries) {
  panel._liveLines = { history: { _asyncSubagents: new Map(entries) } }
}

/** 生产形宿主 run：hydrateRun + depth-0 池载体绑定（访问器别名——`src/agent.mjs:137-150`
 *  同款）+ panel 假体与 `_liveLines` 登记 + 真工厂 `buildPanelCallbacks`。 */
async function hostRunWithCards({ provider, getAuto, cwd }) {
  const run = await hydrateRun(buildTopLevelAgent(), {
    provider, cwd, input: "parent turn (production host shape)", depth: 0, role: null, getAuto, opts: {},
  })
  run.agent.provider = provider
  run.history._asyncSubagents = new Map()
  run.history._asyncQueue = []
  for (const f of ["_asyncSubagents", "_asyncQueue"]) {
    Object.defineProperty(run.agent, f, {
      configurable: true,
      get() { return run.history[f] },
      set(v) { run.history[f] = v },
    })
  }
  const panel = stubPanel()
  panel._liveLines = { history: run.history, fullHistory: run.fullHistory, cwd }
  const callbacks = buildPanelCallbacks(panel, { cwd, autoTurn: false, history: run.history, fullHistory: run.fullHistory })
  return { run, panel, callbacks }
}

/** 卡应答驱动（depth-0 工具卡 = owner null）：轮询逐卡批准，直到 driven promise 落定。
 *  子代归属卡（owner ≠ null）保持在场——T-R4 的 ⏹ 前置态。 */
async function driveParentCards(panel, runPromise, { timeoutMs = 20000 } = {}) {
  let done = false
  const settle = runPromise.then((v) => { done = true; return v }, (e) => { done = true; throw e })
  settle.catch(() => {}) // 超时路径防 unhandled rejection
  const answered = new Set()
  const t0 = Date.now()
  while (!done) {
    if (Date.now() - t0 > timeoutMs) throw new Error("driveParentCards: timeout — the driven call did not settle")
    const next = panel._permissionQueue.find((e) => !answered.has(e.id) && e.owner === null)
    if (next) {
      answered.add(next.id)
      await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: next.id })
    } else {
      await sleep(5)
    }
  }
  return settle
}

// ─── T-R1：释放（正常 · 单元 —— 修复前必红：卡悬挂）─────────────────────────

test("T-R1 释放（正常）：池条目 controller ⇒ ask 出卡 ⇒ abort ⇒ resolve(false) + 队列空 + withdrawn 恰一", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })
  const ctrl = new AbortController()
  bindFakePool(panel, [["7", { id: "7", role: "coder", controller: ctrl, model: null }]])

  const p = cbs.onPermissionRequest("coder#7/write", { path: "a.txt" })
  await until(() => panel._permissionQueue.length === 1)
  const req = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(req.tool, "write", "卡工具名 = 键后工具名")
  assert.equal(req.owner, "coder#7", "卡归属 = 键内 role#id")
  ctrl.abort() // ⏹ 链路等价（条目级 controller abort——cancelSubagent 同点）
  await until(() => panel._permissionQueue.length === 0, 2000) // 修复前：卡悬挂（until timeout）
  assert.equal(await p, false, "signal abort ⇒ deny 释放（resolve false）")
  const wd = panel.posted.filter((m) => m.type === "permissionWithdrawn")
  assert.equal(wd.length, 1, "permissionWithdrawn 恰一")
  assert.equal(wd[0].promptId, req.promptId, "promptId 命中（webview 据此移卡）")
})

// ─── T-R2：归属（正常 · 飞刀 + model）────────────────────────────────────────

test("T-R2 归属（飞刀 + model）：池条目在 ⇒ owner `escalate <glm-5.3> #3` + announce；无条目 ⇒ 族形 `escalate#3`", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })
  bindFakePool(panel, [["3", { id: "3", role: "escalate", model: "glm-5.3" }]])

  const p = cbs.onPermissionRequest("escalate#3/read", { path: "z" })
  await until(() => panel._permissionQueue.length === 1)
  const req = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(req.tool, "read", "卡工具名 = 键后工具名")
  assert.equal(req.owner, "escalate <glm-5.3> #3", "owner 逐字（`<model>` 为字面尖括号——`child-permission.mjs`）")
  const ann0 = panel.posted.filter((m) => m.type === "subagentApproval")
  assert.deepEqual(ann0.map((m) => m.tool), ["read"], "announce 先于卡（块头 ⏸ 等待审批态）")
  assert.equal(ann0[0].id, 3, "announce 归属 id = 键内 id")
  assert.equal(ann0[0].role, "escalate")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req.promptId })
  assert.equal(await p, true, "批复 → resolve(true)")
  const ann = panel.posted.filter((m) => m.type === "subagentApproval")
  assert.deepEqual(ann.map((m) => m.tool), ["read", null], "announce → 清态随行（顺序单源）")

  // 边界：无池条目 ⇒ model null ⇒ 族形（卡可达）
  const p2 = cbs.onPermissionRequest("escalate#9/read", { path: "y" })
  await until(() => panel._permissionQueue.length === 1)
  const req2 = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(req2.owner, "escalate#9", "无条目 ⇒ 族形（model 缺省零歧义）")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req2.promptId })
  assert.equal(await p2, true, "批复 → resolve(true)")
})

// ─── T-R3：归属（正常 + 边界 · continue）────────────────────────────────────

test("T-R3 归属（continue）：键形 args.agent ⇒ owner `coder#7` + announce；非键 ⇒ 回退 owner null 零 announce", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })
  bindFakePool(panel, [["7", { id: "7", role: "coder", model: null }]])

  const p1 = cbs.onPermissionRequest("continue", { turns: 3, agent: "coder#7" })
  await until(() => panel._permissionQueue.length === 1)
  const c1 = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(c1.tool, "continue", "卡工具名 = continue")
  assert.equal(c1.owner, "coder#7", "键形 ⇒ 归属（文法单源 parseRelayPath）")
  const a1 = panel.posted.filter((m) => m.type === "subagentApproval")
  assert.deepEqual(a1.map((m) => m.tool), ["continue"], "announce 先于卡（块头 ⏸ 对位）")
  assert.equal(a1[0].id, 7, "announce 归属 id = 键内 id")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: c1.promptId })
  assert.equal(await p1, true, "键形批复 → true")
  assert.deepEqual(panel.posted.filter((m) => m.type === "subagentApproval").map((m) => m.tool), ["continue", null], "announce → 清态随行（顺序单源）")

  const annBefore = panel.posted.filter((m) => m.type === "subagentApproval").length
  const p2 = cbs.onPermissionRequest("continue", { turns: 3, agent: "zhipu:glm-5.2" })
  await until(() => panel._permissionQueue.length === 1)
  const c2 = panel.posted.findLast((m) => m.type === "permissionRequest")
  assert.equal(c2.tool, "continue", "回退 = 原样名（卡可达）")
  assert.equal(c2.owner, null, "非键 ⇒ 无归属")
  assert.equal(panel.posted.filter((m) => m.type === "subagentApproval").length, annBefore, "回退分支零 announce")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: c2.promptId })
  assert.equal(await p2, true, "回退批复 → true")
})

// ─── T-R4：释放（正常 · 全链 —— 修复前必红：卡不释放）───────────────────────

test("T-R4 释放（全链）：真 async spawn → 子写卡 → cancelSubagent ⇒ 卡移除 + 队列空", async () => {
  const llm = await mockLLM([
    { toolCall: { name: "write", arguments: { path: "child-out.txt", content: "written by child\n" } } },
    { content: "Subagent report (mock): panel rings full-chain cancel release verified through the real async spawn path.".repeat(2) },
  ])
  try {
    const box = mkdtempSync(join(work, "tr4-"))
    const getAuto = () => false
    const { run, panel, callbacks } = await hostRunWithCards({ provider: providerFor(llm), getAuto, cwd: box })
    const spawn = executeToolBatches(run.agent, {
      response: { toolCalls: [{ id: "call_1", name: "subagent", arguments: JSON.stringify({ task: "实现小功能", role: "coder", async: true }) }] },
      history: run.history, fullHistory: run.fullHistory, toolByName: run.toolByName,
      getAuto, callbacks, signal: null, sessionSignal: null, cwd: box, recentSigs: [], depth: 0,
    })
    await driveParentCards(panel, spawn) // 父级工具卡（owner null）批准 → 异步 spawn ack 即返

    await until(() => panel.posted.some((m) => m.type === "permissionRequest" && /^coder#\d+$/.test(m.owner ?? "")), 15000)
    const card = panel.posted.findLast((m) => m.type === "permissionRequest" && /^coder#\d+$/.test(m.owner ?? ""))
    const id = Number(card.owner.split("#")[1])
    assert.equal(panel._permissionQueue.length, 1, "子写卡在队（⏹ 前既有态）")

    // ⏹ 等同路径：webview cancelSubagent 消息 → 池条目定向 abort
    await handlePanelMessage(panel, { type: "cancelSubagent", id, role: "coder" })
    await until(() => panel.posted.some((m) => m.type === "permissionWithdrawn" && m.promptId === card.promptId), 5000)
    assert.equal(panel._permissionQueue.length, 0, "队列清空（定向取消释放——修复前必红）")
    await until(() => run.history._asyncSubagents.size === 0, 8000) // 取消结算（出池）落地
  } finally { await llm.close() }
})

// ─── T-R5n：反证（不误释放）─────────────────────────────────────────────────

test("T-R5n 反证（不误释放）：不 abort ⇒ 卡保持；应答后正常出队（零回归锚）", async () => {
  const panel = stubPanel()
  const cbs = buildPanelCallbacks(panel, { cwd: work, autoTurn: false })
  const ctrl = new AbortController()
  bindFakePool(panel, [["8", { id: "8", role: "coder", controller: ctrl, model: null }]])

  const p = cbs.onPermissionRequest("coder#8/write", { path: "b.txt" })
  await until(() => panel._permissionQueue.length === 1)
  const req = panel.posted.findLast((m) => m.type === "permissionRequest")
  await sleep(30) // 观察窗：不 abort ⇒ 零释放
  assert.equal(panel._permissionQueue.length, 1, "卡保持（零误释放）")
  assert.equal(panel.posted.filter((m) => m.type === "permissionWithdrawn").length, 0, "零 permissionWithdrawn")
  await handlePanelMessage(panel, { type: "permissionResponse", approved: true, promptId: req.promptId })
  assert.equal(await p, true, "应答 → resolve(true)")
  assert.equal(panel._permissionQueue.length, 0, "正常出队（零回归）")
})
