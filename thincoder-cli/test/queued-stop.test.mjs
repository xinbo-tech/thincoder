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
// af 批（2026-09-17）：T-AF5 工具路径 / T-AF6 终态守卫（两族）/ T-AF13 评审族直调 / T-AF15 mouse 对位
import { executeCancelAction } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { maybeRefillAsync } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"
import {
  launchAsyncAdvisor, cancelAsyncAdvisor, refillAdvisorQueue,
} from "@thincoder/core/agent-tools/advisor-async.mjs"

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
    history: [], // 机读线提醒写入面（pushReal —— af 批 queued 取消收尾面）
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
  // c2 键级墓碑（af 批——断言收正：原「_frozenSubKeys 零增」作废）：移除同址写键 ——
  // 后续 ⟦ev⟧stopped 不再建幻影冻结块（零行增）
  assert.equal(state._frozenSubKeys.has("coder#9"), true, "键级墓碑落位（c2）")
  assert.equal(state.lines.length, 0, "state.lines 零增（无冻结载体行）")
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

// ─── 4–7. af 批（2026-09-17）：T-AF5 / T-AF6 / T-AF13 / T-AF15 ────────────────

/** 评审池 running 条目最小形（scope 守卫 / 计数 / 补位读取面——核夹具同款）。 */
function mkAdvisorRunning(id, docSetKey) {
  return {
    id, role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey, round: 0 },
    reviewId: `r${id}`, designId: null, designToken: null, documents: null, paths: null, object: null,
    relayPrefix: `advisor#${id}/`, status: "running", position: undefined,
    report: null, error: null, done: false, cancelled: false, promise: null, _settle: null,
    startedAt: Date.now(), controller: { signal: { aborted: false } },
  }
}

/** design launch 参数（docSetKey = scope——同 scope 拒 / 异 scope 排队判据源）。 */
const designLaunch = (docSetKey) => ({
  reviewType: "design", documents: null, paths: null, object: null,
  designToken: null, designId: null, run: { reviewType: "design", docSetKey },
})

/** 本层通道（mouse 直调 / 测试直驱同形）：routeSubToken 就地路由 + pushLine 兜底 + token 记录。 */
function mkEmit(state, pushed, tokens) {
  return (t) => { tokens.push(t); if (!routeSubToken(state, t, () => {})) pushed.push(t) }
}

test("T-AF5 CLI 全链回归锁（工具路径）：⟦ev⟧queued 建块 → executeCancelAction → token 流仅 ⟦ev⟧cancelled + 块移除 + lines 零增 + 键级墓碑", () => {
  const state = mkState()
  const pushed = []
  const tokens = []
  const e9 = mkQueueEntry(9, "coder")
  const agent = mkAgent({ _asyncSubagents: new Map([["9", e9]]), _asyncQueue: [e9] })
  const emit = mkEmit(state, pushed, tokens)
  routeSubToken(state, "coder#9/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", () => {})
  assert.ok(state.subTasks["coder#9"]?.queued, "排队块建起（真 token 经路由）")
  const r = JSON.parse(executeCancelAction({ id: 9 }, { agent, depth: 0, callbacks: { onToken: emit } }))
  assert.equal(r.status, "cancelled")
  assert.equal(r.was, "queued")
  assert.equal(tokens.filter((t) => t.includes("⟦ev⟧cancelled")).length, 1, "⟦ev⟧cancelled 恰 1")
  assert.equal(tokens.filter((t) => t.includes("⟦ev⟧stopped")).length, 0, "零 ⟦ev⟧stopped（queued 不经 settle）")
  assert.equal(state.subTasks["coder#9"], undefined, "块移除")
  assert.equal(state.lines.length, 0, "state.lines 零增（不冻结）")
  assert.equal(state._frozenSubKeys.has("coder#9"), true, "键级墓碑（c2——先红）")
})

test("T-AF6 终态条目滞留队列：补位零启动（c1——两族同判）+ ⟦ev⟧stopped 零块零行（c2 键级墓碑）", () => {
  const state = mkState()
  // ① c2：queued 取消 → 块移除 + 键级墓碑 → 补发 stopped 不建块（原幻影路径 state.lines 0 → 1）
  routeSubToken(state, "coder#9/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", () => {})
  routeSubToken(state, "coder#9/⟦ev⟧cancelled\x1e", () => {})
  assert.equal(state.subTasks["coder#9"], undefined, "块已移除")
  assert.equal(state._frozenSubKeys.has("coder#9"), true, "键级墓碑在位（c2）")
  routeSubToken(state, "coder#9/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e", () => {})
  assert.equal(state.subTasks["coder#9"], undefined, "stopped 不建块（墓碑丢弃）")
  assert.equal(state.lines.length, 0, "state.lines 零增（幻影冻结块封死）")
  // ② c1 子代理族：终态条目留队列 ⇒ 补位零启动
  const starts = []
  const dead = mkQueueEntry(31, "coder", { done: true, cancelled: true, start: () => { starts.push(31) } })
  const a1 = mkAgent({ _asyncSubagents: new Map([["31", dead]]), _asyncQueue: [dead] })
  maybeRefillAsync(a1)
  assert.deepEqual(starts, [], "子代理族：终态条目不启动（c1）")
  // ③ c1 评审族：同谓词同判（refillAdvisorQueue 消费点）
  const deadA = {
    id: 32, role: "advisor", reviewType: "design", run: { reviewType: "design", docSetKey: "K9" },
    relayPrefix: "advisor#32/", status: "done", position: 1, done: true, cancelled: true,
    start: () => { starts.push(32) },
  }
  const a2 = mkAgent({ _asyncAdvisors: new Map([["32", deadA]]), _asyncAdvisorQueue: [deadA] })
  refillAdvisorQueue(a2, () => {})
  assert.deepEqual(starts, [], "评审族：终态条目不启动（c1 同判）")
})

test("T-AF13 评审族直调路由（AC-AF2 TUI 半）：cancelAsyncAdvisor(agent, id, emit) ⇒ ⟦ev⟧cancelled 恰 1 + 排队块移除 + 键级墓碑", () => {
  const state = mkState()
  const pushed = []
  const tokens = []
  const agent = mkAgent({ config: { agent: { poolLimits: { advisor: 1 } } } })
  agent._asyncAdvisors.set("1", mkAdvisorRunning("1", "K1"))
  const emit = mkEmit(state, pushed, tokens)
  const ack = launchAsyncAdvisor(agent, { callbacks: { onToken: emit } }, designLaunch("K2")) // 池满 + 异 scope ⇒ queued
  assert.equal(ack.queued, true, "异 scope 池满 ⇒ 排队")
  assert.ok(state.subTasks[`advisor#${ack.id}`]?.queued, "评审排队块建起（真 launch token 经路由）")
  tokens.length = 0
  const r = cancelAsyncAdvisor(agent, ack.id, emit)
  assert.equal(r.status, "cancelled")
  assert.equal(r.was, "queued")
  assert.deepEqual(tokens.filter((t) => t.includes("⟦ev⟧cancelled")), [`advisor#${ack.id}/⟦ev⟧cancelled\x1e`], "⟦ev⟧cancelled 恰 1（先红：核原零发射 ⇒ 块孤悬）")
  assert.equal(tokens.filter((t) => t.includes("⟦ev⟧stopped")).length, 0, "零 ⟦ev⟧stopped")
  assert.equal(state.subTasks[`advisor#${ack.id}`], undefined, "排队块移除（subTasks 无该 key）")
  assert.equal(state._frozenSubKeys.has(`advisor#${ack.id}`), true, "键级墓碑（c2——先红）")
  assert.equal(state.lines.length, 0, "state.lines 零增")
  assert.equal(agent._asyncAdvisorQueue.length, 0, "队列零残留")
  assert.equal(agent.history.filter((m) => m.role === "user" && m.content.includes("token not issued")).length, 1, "机读线提醒恰 1")
})

test("T-AF15 mouse 路由对位（AC-AF2 mouse 端态）：真实坐标 ⏹ 命中评审排队块 ⇒ 块移除 + 队列零残留 + 键级墓碑", () => {
  const state = mkState()
  const pushed = []
  const e5 = mkQueueEntry(5, "advisor", { status: "queued", position: 1 })
  const agent = mkAgent({ _asyncAdvisors: new Map([["5", e5]]), _asyncAdvisorQueue: [e5] })
  routeSubToken(state, "advisor#5/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", () => {})
  assert.ok(state.subTasks["advisor#5"]?.queued, "评审排队块建起（routeSubToken ⟦ev⟧queued）")
  const layout = computeLayout(state, state.dims.get())
  const sub = layout.panels.subagent
  const lineEl = layout.subagentLines[1]
  assert.equal(lineEl._stopSub, "advisor#5", "评审排队块头 ⏹ 钉（门控含 advisor 族）")
  const dispatch = makeDispatch(agent, state, pushed)
  dispatch.onMouseClick(lineEl._stopCol, sub.y + 2) // 真实坐标几何契约
  assert.equal(state.subTasks["advisor#5"], undefined, "块移除（核单点经 emit 通道发射 ⟦ev⟧cancelled——去重若漏传通道则本例红）")
  assert.equal(agent._asyncAdvisorQueue.length, 0, "队列零残留")
  assert.equal(agent._asyncTombstones.get("5")?.status, "cancelled", "cancelled 墓碑")
  assert.equal(state._frozenSubKeys.has("advisor#5"), true, "键级墓碑（c2——先红）")
  assert.ok(pushed.some((t) => t.includes("[subagent advisor#5 stop requested]")), "停止提示行在位")
})
