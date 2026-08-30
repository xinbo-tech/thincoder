/**
 * render-loop.mjs tests — row-diff rendering of the output panel.
 * Frames are captured via the injected write function (no process.stdout mock).
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { createRenderLoop } from "../src/tui/render-loop.mjs"

function makeHarness() {
  const writes = []
  const origCols = process.stdout.columns
  const origRows = process.stdout.rows
  process.stdout.columns = 80
  process.stdout.rows = 24
  const state = {
    lines: [], input: [], cursor: 0, history: [], historyIndex: -1, scroll: 0,
    processing: true, controller: null, interruptPrompt: null,
    permission: null, permissionPreview: [], question: null,
    picker: null, wizard: null, tasks: [],
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
    ctxCache: { len: -1, tokens: 0 }, reasoning: "", streaming: "",
    toolStreams: {}, subTasks: {}, outputPanels: {},
    currentTool: null, processingStarted: Date.now(), status: "Processing...", queue: [],
  }
  const agent = { provider: { model: "m" }, cwd: "/t", planMode: false, autoApprove: true, config: {}, history: [], tasks: [] }
  const ctx = { startupDims: { cols: 80, rows: 24 }, SLASH_COMMANDS: [], pendingNoticeReady: () => false, showUpdateNotice: async () => {} }
  const { render } = createRenderLoop(state, agent, ctx, () => {}, (s) => writes.push(String(s)))
  return {
    state, render,
    output: () => writes.join(""),
    restore: () => {
      process.stdout.columns = origCols
      process.stdout.rows = origRows
    },
  }
}

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

/** D6 (§7.2): output panels are abolished — these tests now lock the RETIRED
 *  behavior: leftover outputPanels state must not crash the render loop, must
 *  NOT be pruned anymore (no writer exists), and the row-diff path keeps working. */
test("output panels abolished (D6): residual state ignored — render loop unaffected", async () => {
  const h = makeHarness()
  try {
    h.state.outputPanels.bash = { parts: [{ kind: "text", text: "stale" }], len: 5, done: false }
    h.render()
    await tick(60)
    assert.ok(h.state.outputPanels.bash, "no prune writer anymore (dead state left untouched)")
    const out = h.output()
    assert.ok(!out.includes("stale"), "residual panel content is NOT rendered (no panel slot)")
    assert.ok(out.includes("ThinCoder"), "frame still renders normally")
  } finally {
    h.restore()
  }
})

test("output panels abolished (D6): no prune writer exists in render-loop source (T-H)", async () => {
  const { readFileSync } = await import("node:fs")
  const src = readFileSync(new URL("../src/tui/render-loop.mjs", import.meta.url), "utf8")
  assert.ok(!/delete state\.outputPanels/.test(src), "render-loop no longer prunes outputPanels")
  const frameSrc = readFileSync(new URL("../src/tui/render-frame.mjs", import.meta.url), "utf8")
  assert.ok(!/renderOutput|renderSubagent|PANEL_KIND_COLORS/.test(frameSrc), "render-frame has no panel renderers")
  const layoutSrc = readFileSync(new URL("../src/tui/layout.mjs", import.meta.url), "utf8")
  assert.ok(!/subPanelH|outputPanelsH|panels\.subagent|panels\.output/.test(layoutSrc), "layout has no subagent/output slots")
  // 全仓无 outputPanels 写入方残留（D6 验收：仅测试与已删机制的历史状态兜底）
  const agentTurnSrc = readFileSync(new URL("../src/tui/agent-turn.mjs", import.meta.url), "utf8")
  assert.ok(!/outputPanels/.test(agentTurnSrc), "agent-turn has no outputPanels writer")
})
