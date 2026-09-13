/**
 * queued-stop.test.mjs — QUEUED-VISIBILITY F-2 测试（CLI 端——2026-09-09——设计档
 * thincoder-vscode/QUEUED-VISIBILITY.md——CLI 参照读绝对路径）。
 * 用例表 F-2 行（queued ⏹ 点击 = 出队 + 墓碑 + 位置前移 + 块移除——running ⏹ 不回归）：
 * 1. renderSubagentPanel ⏹ 门控扩 queued（等待块头挂 ⏹——slot/wait/depc 三态同一对象面；
 *    async running 不回归——headless sync 不钉——非 SUBAGENT_ROLES 角色（escalate）无 ⏹）
 * 2. queued ⏹ 点击全链（createMouseDispatch onMouseClick 真实坐标命中 → 引擎
 *    cancelAsyncSubagent 出队 → mouse 补 executeCancelAction 同款 TUI 维护：⟦ev⟧cancelled
 *    路由移除等待块 + 依赖者 depc 标注/位置前移刷新（⟦ev⟧queued）——块移除真实发生）
 * 3. running ⏹ 点击不回归（engine abort——无 was:queued 分支——块留驻等 settle 冻结链）
 * 确定性单元（无 io/无 LLM/无真实子代理——async-settle.test.mjs 同款桩面）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { renderSubagentPanel } from "../src/tui/subagent-panel.mjs"
import { routeSubToken } from "../src/tui/subagent-blocks.mjs"
import { createMouseDispatch } from "../src/tui/mouse.mjs"
import { computeLayout } from "../src/tui/layout.mjs" // 鼠标行坐标几何契约（layout → subagent-panel 单向——测试静态导入无环）

/** 最小 TUI state（渲染/路由/鼠标命中面——layout 读取字段全覆盖）。 */
function mkState(over = {}) {
  return {
    input: "", cursor: 0, tasks: [], lines: [], scroll: 0,
    subTasks: {}, search: null, interruptPrompt: null,
    question: null, picker: null, permission: null, wizard: null,
    expandedBlocks: new Set(), _frozenSubKeys: new Set(),
    dims: { get: () => ({ cols: 100, rows: 40 }) },
    ...over,
  }
}

/** 子代理块最小形（面板读取面 + 建块后状态）。 */
function mkSub(key, role, over = {}) {
  return {
    key, role, started: Date.now() - 5000, done: false, doneAt: null,
    blocks: [], currentTool: null, toolArgs: null, turn: 0, maxTurns: 0,
    approval: null, lastError: null, dropped: 0, stopped: false, children: [],
    ...over,
  }
}

/** 排队池条目最小形（引擎 cancel/refill/refresh 读取面——async-settle 同款）。 */
function mkQueueEntry(id, role, over = {}) {
  return {
    id, role, relayPrefix: `${role}#${id}/`, status: "queued", done: false, cancelled: false,
    position: 0, startedAt: null, _pool: "other", _files: [], _dependsOn: [],
    controller: { signal: { aborted: false }, abort() {} },
    _settle() {}, start() { throw new Error("queued entry must not start in this scenario") },
    maxTurns: 0, turn: 0,
    ...over,
  }
}

/** 最小 agent（池/队列/墓碑/registry——mouse cancel 读写面）。 */
function mkAgent(over = {}) {
  return {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncQueue: [],
    _asyncTombstones: new Map(),
    _pendingAsyncResults: [],
    _asyncWaiters: [],
    _syncChildAborts: new Map(),
    autoApprove: false,
    config: undefined,
    ...over,
  }
}

/** 面板首块头行（分隔线后第一行）——⏹ 元数据断言面。 */
function headLine(state, cols = 100) {
  return renderSubagentPanel(state, cols)[1]
}

/** mouse 装配（createMouseDispatch 同参形——pushed/render 记录）。 */
function makeDispatch(agent, state, pushed) {
  return createMouseDispatch({
    agent, state,
    pushLine: (t) => pushed.push(t),
    render() {}, popPicker() {},
  })
}

// ─── 1. ⏹ 门控扩 queued（renderSubagentPanel 纯函数）────────────────────────

test("F-2 CLI ⏹ 门控：queued 等待块头（slot/wait/depc）挂取消 ⏹——async running 不回归——headless sync 不钉——escalate 无 ⏹", () => {
  // queued（slot 等位）→ 挂 ⏹（门控扩——覆盖 SESSION-ACTIVITY-REVISED F-6 旧"不挂"定论）
  const s1 = mkState({ subTasks: { "coder#9": mkSub("coder#9", "coder", { queued: { kind: "slot", position: 2, detail: "" } }) } })
  const l1 = headLine(s1)
  assert.equal(l1._stopSub, "coder#9", "queued 块头 ⏹ 钉（_stopSub——鼠标取消路由锚）")
  assert.ok(l1._stopCol >= 1, "⏹ 列元数据在位")
  assert.ok(l1.text.includes("⏹"), "⏹ glyph 上屏")
  assert.ok(l1.text.includes("queued · position 2"), "排队状态词位不变（queued · position 2）")

  // wait/depc 三态同一对象面（sub.queued 非空即钉——kind 无涉）
  for (const kind of ["wait", "depc"]) {
    const s = mkState({ subTasks: { [`explore#1-${kind}`]: mkSub(`explore#1-${kind}`, "explore", { queued: { kind, position: 1, detail: "waiting for: …" } }) } })
    const l = headLine(s)
    assert.equal(l._stopSub, `explore#1-${kind}`, `${kind} 等待头挂 ⏹（三态一致）`)
  }

  // running 不回归：async 块照钉（async 置位——门控原面）
  const s2 = mkState({ subTasks: { "eng-coder#2": mkSub("eng-coder#2", "eng-coder", { async: true }) } })
  assert.equal(headLine(s2)._stopSub, "eng-coder#2", "async running 块照钉 ⏹（零回归）")

  // headless sync 不钉（无 async 无 queued 无 registry live——AC6 语义保留）
  const s3 = mkState({ subTasks: { "explore#3": mkSub("explore#3", "explore") } })
  assert.equal(headLine(s3)._stopSub, undefined, "headless sync 块不钉 ⏹（零回归）")

  // 非 SUBAGENT_ROLES（escalate）排队头无 ⏹（角色门控面不变——escalate 无 registry 无 ⏹）
  const s4 = mkState({ subTasks: { "escalate#4": mkSub("escalate#4", "escalate", { queued: { kind: "slot", position: 1, detail: "" } }) } })
  const l4 = headLine(s4)
  assert.ok(l4.text.includes("queued · position 1"), "escalate 排队头可见（等待词在）")
  assert.equal(l4._stopSub, undefined, "escalate 排队头无 ⏹（角色门控面）")
})

// ─── 2. queued ⏹ 点击全链（坐标命中 → 出队 → 块移除 + 依赖者刷新）────────────

test("F-2 queued ⏹ 点击 = 出队 + 墓碑 + 块移除 + 依赖者 depc/位置前移（鼠标直连路径 UI 维护）", () => {
  const state = mkState()
  const e9 = mkQueueEntry(9, "coder")
  const e10 = mkQueueEntry(10, "explore", { _dependsOn: ["9"] }) // 依赖 #9——取消后转 depc
  const agent = mkAgent({
    _asyncSubagents: new Map([["9", e9], ["10", e10]]),
    _asyncQueue: [e9, e10],
  })
  // 真实 TUI 建块路径：引擎 ⟦ev⟧queued token → routeSubToken（sub.queued 置位——等待块头）
  routeSubToken(state, "coder#9/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", () => {})
  routeSubToken(state, "explore#10/⟦ev⟧queued\x1eslot\x1e2\x1equeued\x1e", () => {})
  assert.ok(state.subTasks["coder#9"]?.queued, "排队块头建起（#9）")
  assert.ok(state.subTasks["explore#10"]?.queued, "排队块头建起（#10）")

  // 面板布局 → 首块头行（分隔线后 = coder#9）→ 点击 ⏹ 列（真实坐标几何契约）
  const layout = computeLayout(state, state.dims.get())
  const sub = layout.panels.subagent
  const lineEl = layout.subagentLines[1]
  assert.equal(lineEl._stopSub, "coder#9", "命中行 = #9 排队头（⏹ 钉）")
  const pushed = []
  const dispatch = makeDispatch(agent, state, pushed)
  const row = sub.y + 2 // 0-based 面板行 1 → 1-based row（sub.y + localRow + 1）
  const consumed = dispatch.onMouseClick(lineEl._stopCol, row)
  assert.equal(consumed, true, "⏹ 列点击被消费（不落折叠）")

  // 引擎出队（cancelAsyncSubagent core——无 settle 事件链）
  assert.equal(agent._asyncQueue.includes(e9), false, "出队（队列移除）")
  assert.equal(agent._asyncSubagents.has("9"), false, "出队（池移除）")
  assert.deepEqual(agent._asyncTombstones.get("9"), { status: "cancelled", role: "coder" }, "出队即终态 → cancelled 墓碑（依赖者查得）")
  // UI 维护（mouse 补 executeCancelAction 同款——块移除真实发生）
  assert.equal(state.subTasks["coder#9"], undefined, "等待块移除（⟦ev⟧cancelled 就地路由）")
  // 依赖者 #10：留 queued——depc 标注 + 位置前移 1（⟦ev⟧queued 刷新 token）
  assert.deepEqual(agent._asyncQueue, [e10], "依赖者留队列（非 AUTO 不启动）")
  const q10 = state.subTasks["explore#10"].queued
  assert.equal(q10.kind, "depc", "依赖者转 depc 标注（dependency cancelled——外部决策可解）")
  assert.equal(q10.position, 1, "位置前移（position 2 → 1）")
  assert.ok(pushed.some((t) => t.includes("[subagent coder#9 stop requested]")), "停止请求可见提示（鼠标直连路径既有面）")
})

// ─── 3. running ⏹ 点击不回归（engine abort——块留驻等 settle 冻结链）─────────

test("F-2 running ⏹ 点击不回归：engine abort（controller）——无 was:queued 分支——块留驻", () => {
  const state = mkState()
  let aborted = 0
  const e20 = mkQueueEntry(20, "eng-coder", {
    status: "running", startedAt: Date.now() - 30000,
    controller: { signal: { aborted: false }, abort() { aborted++; this.signal.aborted = true } },
  })
  delete e20.start
  const agent = mkAgent({ _asyncSubagents: new Map([["20", e20]]), _asyncQueue: [] })
  // TUI 块：async 置位 = running（真实运行块形态——⟦ev⟧async 事件后同款状态）
  state.subTasks["eng-coder#20"] = mkSub("eng-coder#20", "eng-coder", { async: true })
  const pushed = []
  const dispatch = makeDispatch(agent, state, pushed)
  const layout = computeLayout(state, state.dims.get())
  const sub = layout.panels.subagent
  const lineEl = layout.subagentLines[1]
  assert.equal(lineEl._stopSub, "eng-coder#20", "running 块头 ⏹ 在位")
  dispatch.onMouseClick(lineEl._stopCol, sub.y + 2)
  assert.equal(aborted, 1, "running 目标 → 条目 controller abort（原取消路径不变）")
  assert.equal(e20.cancelled, true, "cancelled 标记置位（settle 链冻结语义）")
  assert.ok(state.subTasks["eng-coder#20"], "running 块留驻（冻结由 settle ⟦ev⟧stopped 链驱动——不立即移除）")
  assert.ok(pushed.some((t) => t.includes("[subagent eng-coder#20 stop requested]")), "停止请求提示在位")
})
