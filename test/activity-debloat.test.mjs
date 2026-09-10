/**
 * activity-debloat.test.mjs — CLI-ACTIVITY-DEBLOAT（TUI.md §6.4——
 * 2026-09-10 施工册并档版）测试用例表 1:1：
 * - F-1 preview 删：onToolResult 不再往会话流塞报告预览（正常路径——用例表行 1）
 * - F-2 finishSubTask 收窄：精确 key 命中（正常路径）/ 精确 key 无块（边界）/
 *   finishSubTask 启发式支路归零（恒 no-op 返 null——不冻任何块）
 * - F-3 镜像→现算：panel 现算正常（活值推导——含 queued/awaitingDigest 态）/ panel
 *   现算空态（零 subTasks → 空列表，形状与改前镜像一致——非 null）/ 降级路径（无
 *   TUI 装配 → 现算返 null → 池视图降级 / freeze 报不可用——T-P5 语义不变）/
 *   panelFreezeGate 行为等价（pending 未消化拒 / digested-stuck 放行——门控语义零动）
 * - F-4 零动回归：awaitingDigest 驻留（settled 事件 → 现算含 awaitingDigest 块 →
 *   freezeReclaimDigestedBlocks 回收——驻留/回收照旧）+ 锚点（shiftFreezeAnchors
 *   补偿 + 冻结 splice 落锚位——头裁不回归）
 * 确定性单元（无 io/无 LLM——冻结事件经 callbacks.onToken 收集器直驱 routeSubToken）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  finishSubTask, finishSubTaskKey, computePanelBlocks, freezeDoneSubTasks,
  shiftFreezeAnchors, freezeReclaimDigestedBlocks,
} from "../src/tui/subagent-freeze.mjs"
import { routeSubToken } from "../src/tui/subagent-blocks.mjs"
import { executePanelAction } from "../src/agent-tools/subagent-panel.mjs"
import { buildToolCallbacks } from "../src/tui/tool-events.mjs"

/** 最小 TUI state（块机制读写的面——无渲染）。 */
function mkState() {
  return {
    lines: [], subTasks: {}, status: "Ready",
    streaming: "", reasoning: "", _advisorBlocks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
}

/** 最小 agent（池/pending 面——executePanelAction 门控读）。 */
function mkAgent(over = {}) {
  return {
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _asyncQueue: [],
    _pendingAsyncResults: [],
    ...over,
  }
}

// ─── F-2：finishSubTask 收窄（精确匹配唯一路径）───

test("F-2 精确 key 命中（正常路径）：finishSubTaskKey 标 done 并正常冻结——对照旧行为回归绿", () => {
  const state = mkState()
  state.subTasks["explore#1"] = { key: "explore#1", role: "explore", started: Date.now(), done: false, blocks: [], children: [] }
  const sub = finishSubTaskKey(state, "explore#1")
  assert.equal(sub.done, true, "块标 done")
  assert.equal(sub.blockEpoch, 1, "blockEpoch 递增")
  freezeDoneSubTasks(state)
  assert.equal(state.lines.length, 1, "冻结载体行落流")
  assert.equal(state.lines[0]._frozenSubTask.key, "explore#1")
  assert.equal(state.subTasks["explore#1"], undefined, "冻结+释放（freezeDoneSubTasks 承接删条目——与 finishSubTaskKey 同一契约）")
})

test("F-2 精确 key 无块（边界）：finishSubTaskKey(不存在 key) 返 null 不猜不误冻", () => {
  const state = mkState()
  state.subTasks["eng-coder#2"] = { key: "eng-coder#2", role: "eng-coder", started: Date.now(), done: false, blocks: [], children: [] }
  assert.equal(finishSubTaskKey(state, "explore#1"), null, "无匹配返 null")
  assert.equal(state.subTasks["eng-coder#2"].done, false, "现存块不被误冻（7.2.3.1 误冻源归零）")
})

test("F-2 收窄：finishSubTask 无启发式支路——恒 no-op 返 null，任何角色态都不冻块", () => {
  const state = mkState()
  state.subTasks["explore#1"] = { key: "explore#1", role: "explore", started: 1000, done: false, blocks: [], children: [] }
  state.subTasks["eng-coder#2"] = { key: "eng-coder#2", role: "eng-coder", started: 2000, done: false, blocks: [], children: [] }
  // 旧启发式会冻"最早 started"的 explore#1——收窄后 no-op：两侧均不冻
  assert.equal(finishSubTask(state, ["explore", "eng-coder"], "err"), null)
  assert.equal(state.subTasks["explore#1"].done, false, "最早块不误冻")
  assert.equal(state.subTasks["eng-coder#2"].done, false, "最晚块不误冻")
  assert.equal(state.lines.length, 0, "无冻结载体落流")
})

// ─── F-3：镜像→现算（computePanelBlocks 同输出形状）───

test("F-3 panel 现算-正常：四字段活值纯推导——running/queued/awaitingDigest 三态映射同改前镜像", () => {
  const state = mkState()
  state.subTasks["explore#1"] = { key: "explore#1", role: "explore", started: 111, done: false, blocks: [] }
  state.subTasks["eng-coder#2"] = { key: "eng-coder#2", role: "eng-coder", started: 222, done: false, queued: { kind: "slot" }, blocks: [] }
  state.subTasks["compress#1"] = { key: "compress#1", role: "compress", started: 333, done: false, blocks: [] }
  state.subTasks["advisor#1"] = { key: "advisor#1", role: "advisor", started: 444, done: true, awaitingDigest: true, blocks: [] }
  const snap = computePanelBlocks(state)
  assert.ok(Array.isArray(snap), "数组形态（与改前镜像一致）")
  assert.deepEqual(snap.map((b) => [b.key, b.status]), [
    ["explore#1", "running"],
    ["eng-coder#2", "queued"], // §20 D-SD3b：waiting/等位块以 queued 态入镜
    ["compress#1", "running"],
    ["advisor#1", "awaitingDigest"], // settled 三态映射：done+awaitingDigest → awaitingDigest
  ], "key/status 推导同改前镜像（单账本活值）")
  assert.deepEqual(Object.keys(snap[0]).sort(), ["key", "role", "startedAt", "status"], "四字段形状不变")
  // 读时现算等价：状态活值变更后重读即新态（无需手动刷）
  state.subTasks["explore#1"].done = true
  assert.equal(computePanelBlocks(state).find((b) => b.key === "explore#1").status, "done")
})

test("F-3 panel 现算-空态（边界）：零 subTasks → 空列表（非 null——形状与改前镜像一致）", () => {
  const snap = computePanelBlocks(mkState())
  assert.deepEqual(snap, [], "空数组 = 空面板（[] 与 undefined 区分——降级判定不受影响）")
  // 已全 settled（subTasks 空——块已移出面板）同型
  const settled = mkState()
  settled.subTasks["x#1"] = { key: "x#1", role: "x", done: true, blocks: [] }
  delete settled.subTasks["x#1"]
  assert.deepEqual(computePanelBlocks(settled), [])
})

test("F-3 降级路径：无 TUI 装配 → 现算返 null → view 降级池视图 + freeze 报不可用（T-P5 零动）", () => {
  // 无 _tuiState 挂载（headless/VSC/子代理）
  const agent = mkAgent({ _tuiState: undefined })
  agent._asyncSubagents.set("5", { id: "5", role: "eng-coder", status: "running", startedAt: Date.now() - 2000 })
  agent._pendingAsyncResults.push({ id: "7", role: "explore" })
  const view = JSON.parse(executePanelAction({}, { agent, state: agent._tuiState, depth: 0 }))
  assert.equal(view.degraded, true, "降级注记")
  assert.deepEqual(view.panel.map((b) => [b.key, b.status]), [
    ["eng-coder#5", "running"],
    ["explore#7", "awaitingDigest"],
  ], "池视图形态照旧")
  const frozen = JSON.parse(executePanelAction({ freeze: "explore#7" }, { agent, state: agent._tuiState, depth: 0 }))
  assert.equal(frozen.status, "error")
  assert.match(frozen.error, /panel unavailable/, "freeze 报不可用照旧")
})

test("F-3 门控行为等价：pending 未消化拒（消化序不破坏）/ digested-stuck 放行（发 done 事件）——语义零动", () => {
  const state = mkState()
  state.subTasks["explore#7"] = { key: "explore#7", role: "explore", started: 1, done: true, awaitingDigest: true, blocks: [] }
  const tokens = []
  // ① 报告仍 pending（未达模型）→ 拒绝——提前回收破坏消化顺序（T-P3）
  const pendingAgent = mkAgent({ _tuiState: state })
  pendingAgent._pendingAsyncResults.push({ id: "7", role: "explore" })
  const refused = JSON.parse(executePanelAction({ freeze: "explore#7" }, { agent: pendingAgent, state, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } }))
  assert.equal(refused.status, "error")
  assert.match(refused.error, /still genuinely awaiting digestion/, "pending 查拒绝文案照旧")
  assert.equal(tokens.length, 0, "拒绝路径不发事件")
  // ② digested-stuck（pending 已消费/池无条目）→ 门控放行——发 done 冻结事件（T-P3 反面）
  const stuckAgent = mkAgent({ _tuiState: state })
  const allowed = JSON.parse(executePanelAction({ freeze: "explore#7" }, { agent: stuckAgent, state, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } }))
  assert.equal(allowed.status, "frozen")
  assert.equal(tokens.length, 1)
  assert.match(tokens[0], /^explore#7\/⟦ev⟧done\x1e0\x1e0\x1edone\x1e$/, "done 冻结事件字面照旧")
  // ③ 事件入 TUI 路由 → 块冻结进流（回收——F-4 驻留→冻结链路零回归）
  const ok = routeSubToken(state, tokens[0], () => {})
  assert.equal(ok, true)
  assert.equal(state.lines.filter((l) => l._frozenSubTask?.key === "explore#7").length, 1, "冻结载体落流（门控→回收全链）")
})

// ─── F-1：preview 删───

test("F-1 preview 删（正常路径）：sync 完成后不再往会话流塞 dim 摘要——冻结块内报告完整", () => {
  const state = mkState()
  const lines = []
  const { callbacks } = buildToolCallbacks({
    agent: { history: [] },
    state,
    pushLine: (text, color) => lines.push({ text, color }),
    render: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    saveSessionImpl: () => {},
  })
  state.subTasks["explore#1"] = { key: "explore#1", role: "explore", started: 1, done: false, blocks: [], children: [] }
  const report = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10"
  callbacks.onToolCall("subagent", { action: "spawn" }, "t1")
  callbacks.onToolResult("subagent", report, "t1", "explore#1")
  assert.ok(state.lines.some((l) => l._frozenSubTask?.key === "explore#1"), "冻结块是报告唯一载体")
  assert.ok(!lines.some((l) => l.text.includes("line1")), "无 preview 行入流")
  assert.ok(!lines.some((l) => l.text.includes("more lines")), "无 ... (N more lines) 行")
  assert.ok(state.lines.find((l) => l._frozenSubTask?.key === "explore#1")._frozenSubTask.blocks !== undefined, "块内活动完整保留")
})

// ─── F-4：④ 零动回归（驻留/回收/锚点）───

test("F-4 驻留保留：挂起期 settled → awaitingDigest 驻留现算面板 + freezeReclaimDigestedBlocks 回收照旧", () => {
  const state = mkState()
  const tokens = []
  routeSubToken(state, "explore#3/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", (t) => tokens.push(t))
  const sub = state.subTasks["explore#3"]
  assert.equal(sub.done, true)
  assert.equal(sub.awaitingDigest, true, "驻留中间态（§17.5.5——有意保留）")
  assert.equal(sub._freezeAt, 0, "settle 锚点记录（流位置）")
  assert.equal(computePanelBlocks(state).find((b) => b.key === "explore#3").status, "awaitingDigest", "驻留面板可见（现算）")
  // 消化完成 → 逐条回收（锚点 splice 落位——digest 总览文本之前口径不变）
  state.lines.push({ text: "[digest overview]" })
  const reclaimed = freezeReclaimDigestedBlocks(state, [])
  assert.equal(reclaimed, 1)
  assert.equal(state.lines.length, 2)
  assert.equal(state.lines[0]._frozenSubTask?.key, "explore#3", "冻结落锚位（总览文本之前）")
  assert.equal(state.lines[1].text, "[digest overview]")
  assert.equal(state.subTasks["explore#3"], undefined, "池空（块回收与池空解耦语义照旧）")
})

test("F-4 锚点不回归：头裁 1000 → shiftFreezeAnchors 净位移补偿（999）+ min 0 兜底", () => {
  const state = mkState()
  state.subTasks["a#1"] = { key: "a#1", role: "a", done: false, blocks: [], _freezeAt: 1500 }
  state.subTasks["b#2"] = { key: "b#2", role: "b", done: false, blocks: [], _freezeAt: 500 }
  shiftFreezeAnchors(state, 1000)
  assert.equal(state.subTasks["a#1"]._freezeAt, 501, "net = 1000-1 = 999 前移")
  assert.equal(state.subTasks["b#2"]._freezeAt, 0, "min 0 兜底")
})
