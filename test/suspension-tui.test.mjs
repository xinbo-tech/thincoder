/**
 * suspension-tui.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): suspension.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"



function poolSize(agent) {
  return (agent._asyncSubagents?.size ?? 0) + (agent._pendingAsyncResults?.length ?? 0)
}

// ═══════════════════════════════════════════════════════════════════════════
// TUI 级：T-S14 中间态渲染 / T-S15 双模式输入
// ═══════════════════════════════════════════════════════════════════════════


test("T-S14 中间态渲染 + §17.5.5 逐条回收：settled 块驻留面板 'done · awaiting digestion'；digest 消化完成即冻结（settle 锚点 splice——digest 总览文本之前）；未消化残项池空兜底", async () => {
  const { routeSubToken, freezeAllSubTasks, freezeReclaimDigestedBlocks } = await import("../src/tui/subagent-blocks.mjs")
  const { renderSubagentPanel } = await import("../src/tui/subagent-panel.mjs")
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), expandedBlocks: new Set() }
  let rendered = 0
  const schedule = () => { rendered++ }
  // 块创建（子代理启动 [model] 由实际 start 发——此处直接路由一条文本 token 建块）
  routeSubToken(state, "coder#1/hello", schedule)
  assert.ok(state.subTasks["coder#1"], "块已建")
  // 挂起期 settle：⟦ev⟧settled（冻结延迟）
  const consumed = routeSubToken(state, "coder#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", schedule)
  assert.equal(consumed, true)
  const sub = state.subTasks["coder#1"]
  assert.equal(sub.done, true)
  assert.equal(sub.awaitingDigest, true)
  assert.ok(!state._frozenSubKeys.has("coder#1"), "settled 不冻结（驻留面板）")
  // 面板渲染中间态
  const panelLines = renderSubagentPanel(state, 100)
  assert.ok(panelLines.some((l) => String(l.text).includes("done · awaiting digestion")), "面板显示 awaiting digestion")
  assert.ok(panelLines.some((l) => String(l.text).includes("[✓ coder#1")), "✓ 中间态图标")
  assert.equal(sub._freezeAt, 0, "锚点 = settle 时刻流位置（digest 文本入流前——回收与兜底共用）")
  // digest 总览文本在 settle 之后进流（真实时序：settle → auto-turn digest 输出）
  state.lines.push({ text: "[auto-turn: digesting finished subagent reports…]", color: undefined })
  state.lines.push({ text: "digest 总览: 要点A、要点B", color: undefined })
  // §17.5.5：digest 消化完成（pending 条目已注入——不在 pending）→ 逐条补发 done 冻结
  // 回收——块从面板移除进流，位置 = settle 锚点 splice（digest 总览文本之前——round1 #1
  // 裁定；不等池空——T-H7/AC-H5）
  const entry1 = { id: "1", role: "coder", report: "r1" }
  assert.equal(freezeReclaimDigestedBlocks(state, [entry1]), 0, "条目仍在 pending（本 digest 未消化）→ 不回收")
  assert.ok(state.subTasks["coder#1"], "未消化残项驻留面板")
  assert.equal(freezeReclaimDigestedBlocks(state, []), 1, "已消化（pending 空）→ 逐条回收")
  const carrierIdx = state.lines.findIndex((l) => l._frozenSubTask?.key === "coder#1")
  const digestIdx = state.lines.findIndex((l) => String(l.text).includes("digest 总览"))
  assert.ok(carrierIdx === 0 && digestIdx > carrierIdx,
    `冻结块（idx=${carrierIdx}）位于 digest 总览文本（idx=${digestIdx}）之前（settle 锚点——round1 #1）`)
  assert.equal(state._frozenSubKeys.has("coder#1"), true, "补发 done 冻结进流")
  assert.equal(state.subTasks["coder#1"], undefined, "冻结后从驻留面板释放")
  // 池空退出兜底（17.5.5：freeze-out 仅兜底未消化残项——按 settle 锚点落位，
  // 既有 2026-09-03 修复轮锚点语义保留）
  routeSubToken(state, "coder#2/hello", schedule)
  routeSubToken(state, "coder#2/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", schedule)
  const sub2 = state.subTasks["coder#2"]
  assert.equal(sub2._freezeAt, state.lines.length, "残项锚点 = settle 时刻流位置")
  state.lines.push({ text: "后续用户回合文本", color: undefined })
  const entry2 = { id: "2", role: "coder", report: "r2" }
  assert.equal(freezeReclaimDigestedBlocks(state, [entry2]), 0, "残项仍 pending → 滞留（等退出兜底）")
  freezeAllSubTasks(state)
  const carrier2Idx = state.lines.findIndex((l) => l._frozenSubTask?.key === "coder#2")
  const laterIdx = state.lines.findIndex((l) => String(l.text).includes("后续用户回合文本"))
  assert.ok(carrier2Idx >= 0 && carrier2Idx < laterIdx,
    `残项兜底冻结 splice 落 settle 锚点（idx=${carrier2Idx}，后续文本 idx=${laterIdx} 之前——既有锚点语义）`)
  assert.equal(state.subTasks["coder#2"], undefined, "兜底冻结释放")
})
