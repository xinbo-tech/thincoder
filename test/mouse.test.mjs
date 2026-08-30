/**
 * mouse.test.mjs — SGR mouse click parsing + hit-testing + line actions
 */
import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { parseMouseClicks, convGlobalIndex, handleMouseClick } from "../src/tui/mouse.mjs"

/** Minimal TUI state satisfying computeLayout + buildConvLines accessors. */
function mockState(extra = {}) {
  return {
    search: null, interruptPrompt: null, input: [], cursor: 0, question: null,
    picker: null, wizard: null, tasks: [], processing: false, subTasks: {},
    outputPanels: {}, permission: null, permissionPreview: [], queue: [],
    lines: [], reasoning: "", _advisorBlocks: [],
    streaming: "", foldEnabled: true, expandedBlocks: null, scroll: 0,
    ...extra,
  }
}

describe("parseMouseClicks — SGR \x1b[<0;col;rowM extraction", () => {
  it("extracts a left-click press", () => {
    assert.deepEqual(parseMouseClicks("\x1b[<0;10;5M"), [{ col: 10, row: 5 }])
  })

  it("ignores releases (lowercase m) and wheel (button 64/65)", () => {
    assert.deepEqual(parseMouseClicks("\x1b[<0;3;3m\x1b[<64;3;3M\x1b[<65;3;3M"), [])
  })

  it("extracts multiple clicks mixed with other input", () => {
    const text = "abc\x1b[<0;1;2M\x1b[<0;20;30Mxyz"
    assert.deepEqual(parseMouseClicks(text), [{ col: 1, row: 2 }, { col: 20, row: 30 }])
  })

  it("handles incomplete tail (no false match on partial)", () => {
    assert.deepEqual(parseMouseClicks("\x1b[<0;1;"), [])
  })
})

describe("convGlobalIndex — screen row → conversation line mapping", () => {
  it("maps the first visible row at scroll 0", () => {
    const map = convGlobalIndex(10, 5, 0)
    assert.equal(map(0), 5) // end=10, visible=slice(5,10) → local 0 = global 5
    assert.equal(map(4), 9)
    assert.equal(map(5), null) // padding rows
  })

  it("content shorter than panel starts at row 0", () => {
    const map = convGlobalIndex(3, 19, 0)
    assert.equal(map(0), 0)
    assert.equal(map(2), 2)
    assert.equal(map(3), null) // padding
  })

  it("follows scroll offset", () => {
    const map = convGlobalIndex(10, 5, 3)
    assert.equal(map(0), 2)
    assert.equal(map(4), 6)
  })

  it("clamps scroll beyond max", () => {
    const map = convGlobalIndex(10, 5, 99)
    assert.equal(map(0), 0)
  })
})

describe("handleMouseClick — picker selection", () => {
  it("clicking an option row resolves the picker with that item", () => {
    const state = mockState()
    let popped = null
    state.picker = {
      title: "Test", entries: [{ type: "item", text: "A" }, { type: "item", text: "B" }, { type: "item", text: "C" }],
      lines: [
        { text: " ❯ Test ", _row: undefined },                       // title (index 0)
        { text: "   A", _row: 0 },
        { text: "   B", _row: 1 },
        { text: "   C", _row: 2 },
      ],
      filteredItems: [{ type: "item", text: "A" }, { type: "item", text: "B" }, { type: "item", text: "C" }],
      index: 0, scroll: 0, selectedLine: 1, filter: "", resolve: () => {},
    }
    const ctx = { state, render: () => {}, showPicker: async () => null, popPicker: (v) => { popped = v } }
    // picker panel: computeLayout puts it below conversation; force a tiny layout by stubbing process.stdout
    // → use a small terminal so conversation=1 row and picker sits right after it.
    const orig = { cols: process.stdout.columns, rows: process.stdout.rows }
    Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true })
    Object.defineProperty(process.stdout, "rows", { value: 24, configurable: true })
    try {
      // Layout (80x24): header=1, conversation=14, picker.y=15(0-based) → title row=16,
      // first option "A" = 1-based row 18 (title at y+0, option at y+1)
      const consumed = handleMouseClick(ctx, 10, 18)
      assert.equal(consumed, true)
      assert.equal(popped?.text, "A")
    } finally {
      Object.defineProperty(process.stdout, "columns", { value: orig.cols, configurable: true })
      Object.defineProperty(process.stdout, "rows", { value: orig.rows, configurable: true })
    }
  })
})

describe("handleMouseClick — conversation line actions", () => {
  it("clicking a folded-block hint expands it", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const state = mockState({
      lines: [
        { text: "x", color: "" },
        { text: "y", color: "" },
      ],
    })
    const ctx = { state, render: () => { rendered = true }, showPicker: async () => null, popPicker: () => {} }
    let rendered = false
    // Directly exercise the fold branch by pre-building convLines with a fold toggle:
    // buildConvLines folds ≥8 consecutive dim lines; feed 9 dim lines.
    state.lines = Array.from({ length: 9 }, (_, i) => ({ text: `dim${i}`, color: C.dim }))
    const orig = { cols: process.stdout.columns, rows: process.stdout.rows }
    Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true })
    Object.defineProperty(process.stdout, "rows", { value: 24, configurable: true })
    try {
      // Layout (80x24, no overlays): conversation starts at row 2 (1-based).
      // 9 dim lines fold to [named header, last 3] = 4 conv lines (unified form);
      // the header is the 1st conv line = 1-based row 2.
      const consumed = handleMouseClick(ctx, 10, 2)
      assert.equal(consumed, true)
      assert.ok(state.expandedBlocks?.size > 0, "expandedBlocks populated")
      assert.equal(rendered, true)
    } finally {
      Object.defineProperty(process.stdout, "columns", { value: orig.cols, configurable: true })
      Object.defineProperty(process.stdout, "rows", { value: orig.rows, configurable: true })
    }
  })

  it("clicking a message line is inert (line-action menu removed — drag-select copies natively)", async () => {
    const state = mockState({
      lines: [{ text: "hello world", color: "" }],
    })
    let menu = null
    const ctx = {
      state,
      render: () => {},
      showPicker: async (title, entries) => { menu = { title, entries }; return null },
      popPicker: () => {},
    }
    const orig = { cols: process.stdout.columns, rows: process.stdout.rows }
    Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true })
    Object.defineProperty(process.stdout, "rows", { value: 24, configurable: true })
    try {
      const consumed = handleMouseClick(ctx, 10, 2)
      assert.equal(consumed, false, "plain message line click is not consumed")
      await new Promise((r) => setTimeout(r, 10))
      assert.equal(menu, null, "no menu opens")
    } finally {
      Object.defineProperty(process.stdout, "columns", { value: orig.cols, configurable: true })
      Object.defineProperty(process.stdout, "rows", { value: orig.rows, configurable: true })
    }
  })

describe("long-message folding (render-conversation)", () => {
  it("a single long DIM line folds to [named header, tail 3] and expands via click key", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "")
    const { buildConvLines, convCacheKey } = await import("../src/tui/render-conversation.mjs")
    const state = {
      lines: [{ text: "L1\n" + "line2\n".repeat(15) + "last", color: C.dim }],
      streaming: "", reasoning: "", _advisorBlocks: [],
      foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
    }
    const cols = 80
    const folded = buildConvLines(state, cols)
    // Unified folded form (2026-08-30): [▶ header, last 3 lines] = 4 — NOT the
    // legacy [first 4, anonymous ▶, last]. First lines are no longer kept.
    assert.equal(folded.length, 4, "long dim message folded to [header, tail 3]")
    assert.ok(folded[0].text.startsWith("▶ tool output · 17 lines — "), "named identity header")
    assert.ok(!folded[0].text.startsWith(" "), "control line is flush with content (no indent)")
    assert.ok(folded[0].text.includes("\x1b[4mclick to expand\x1b[24m"), "click phrase underlined")
    assert.equal(strip(folded[3].text), "│ last", "tail = last 3 content lines (rule line)")
    assert.ok(!folded.some((l) => l.text === "L1"), "first lines no longer shown in folded state")
    const toggleKey = folded[0]._foldToggle
    assert.ok(toggleKey?.startsWith("long-"), "fold key is long-<srcIndex>")

    // Expand: add the key → [blank, ▼, full content]; cache key must change
    const keyBefore = convCacheKey(state)
    state.expandedBlocks.add(toggleKey)
    const keyAfter = convCacheKey(state)
    assert.notEqual(keyBefore, keyAfter, "expandedBlocks participates in the cache key")
    const expanded = buildConvLines(state, cols)
    assert.equal(expanded.length, 19, "expanded to [blank, ▼ marker, 17 content]")
    assert.equal(expanded[0].text, "", "blank separator before the ▼ control line")
    assert.ok(expanded[1].text.startsWith("▼ … 17 lines — "), "▼ marker at the HEAD, before the content")
    assert.ok(!expanded[1].text.startsWith(" "), "no indent on the ▼ control line")
    assert.equal(expanded[1]._foldToggle, toggleKey, "collapse marker shares the fold key")
    assert.equal(strip(expanded[2].text), "│ L1", "content follows the marker (rule line)")
    assert.ok(expanded[1].text.includes("\x1b[4mclick to collapse\x1b[24m"), "click phrase underlined")

    // Collapse again: delete the key → back to [named header, tail 3] (bidirectional)
    state.expandedBlocks.delete(toggleKey)
    const reFolded = buildConvLines(state, cols)
    assert.equal(reFolded.length, 4, "collapsed back to [header, tail 3]")
  })

  it("MAIN OUTPUT (C.text) NEVER folds — primary content reads by scrolling (2026-08-30 ruling)", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
    const longText = "line0\n" + "content\n".repeat(20) + "end" // 22 wrapped lines > 12

    const state = {
      lines: [{ text: longText, color: C.text }],
      streaming: "", reasoning: "", _advisorBlocks: [],
      foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
    }
    // No fold markers at all — the whole answer is always fully rendered.
    // 22 content rows + leading/trailing blank (main-output breathing room,
    // user request 2026-08-30).
    const out = buildConvLines(state, 80)
    assert.equal(out.length, 24, "main output renders in full, never folded")
    assert.ok(!out.some((l) => l._foldToggle), "no fold controls on main output")
    assert.equal(out[0].text, "")
    assert.equal(out[1].text, "line0")
    assert.equal(out[22].text, "end")
    assert.equal(out[23].text, "")

    // THINKING (C.reason) still folds — unified form [named header, tail 3]
    const rState = { ...state, lines: [{ text: longText, color: C.reason }] }
    const rFolded = buildConvLines(rState, 80)
    assert.equal(rFolded.length, 4, "thinking folds to [header, tail 3]")
    assert.ok(rFolded[0].text.startsWith("▶ thinking · 22 lines — "), "named header")
    const key = rFolded[0]._foldToggle
    rState.expandedBlocks.add(key)
    const rExpanded = buildConvLines(rState, 80)
    assert.equal(rExpanded.length, 24, "thinking expands to [blank, ▼, 22 lines]")
    rState.expandedBlocks.delete(key)
    assert.equal(buildConvLines(rState, 80).length, 4, "thinking collapses back")
  })

  it("completed reasoning folds IMMEDIATELY on flush — no auto-expand exception (2026-08-30 ruling)", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
    const state = {
      lines: [],
      streaming: "", reasoning: "", _advisorBlocks: [],
      foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
    }
    const longText = "line0\n" + "content\n".repeat(20) + "end" // 22 wrapped lines > 3

    // Completion moment: flushStream pushes the reasoning line — it must render
    // FOLDED right away. The old "stay expanded until next turn" bookkeeping is
    // gone (rejected pre-fold plan leftover, user-ruled out with zero exceptions).
    state.lines.push({ text: longText, color: C.reason })
    const justCompleted = buildConvLines(state, 80)
    assert.equal(justCompleted.length, 4, "completed reasoning rendered FOLDED at once (named header + tail 3)")
    assert.ok(justCompleted[0].text.startsWith("▶ thinking · 22 lines — "), "unified named header, no ▼/expanded state")
  })

  it("long DIM lines fold bidirectionally", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
    const longText = "line0\n" + "content\n".repeat(20) + "end" // 22 wrapped lines > 12
    for (const color of [C.dim]) {
      const state = {
        lines: [{ text: longText, color }],
        streaming: "", reasoning: "", _advisorBlocks: [],
        foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
      }
      // Folded: unified [named header, tail 3]
      const folded = buildConvLines(state, 80)
      assert.equal(folded.length, 4, `${JSON.stringify(color)} folds to [header, tail 3]`)
      assert.ok(folded[0].text.startsWith("▶ tool output · 22 lines — "), "named header")
      assert.ok(folded[0].text.includes("\x1b[4mclick to expand\x1b[24m"), "click phrase underlined")
      assert.equal(strip(folded[3].text), "│ end", "tail = last 3 content lines (rule line)")
      const key = folded[0]._foldToggle

      // Expanded: [blank, ▼ at the HEAD, then full content]
      state.expandedBlocks.add(key)
      const expanded = buildConvLines(state, 80)
      assert.equal(expanded.length, 24, `${JSON.stringify(color)} expands to [blank, ▼, 22 lines]`)
      assert.ok(expanded[1].text.startsWith("▼ … 22 lines — "), "▼ at the head, before the content")

      // Collapsed back
      state.expandedBlocks.delete(key)
      assert.equal(buildConvLines(state, 80).length, 4, `${JSON.stringify(color)} collapses back`)
    }
  })

  it("expanded consecutive-dim block gets a collapse marker; clicking toggles both ways", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const strip = (s) => (s || "").replace(/\x1b\[[0-9;]*m/g, "")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
    const state = {
      lines: Array.from({ length: 9 }, (_, i) => ({ text: `dim${i}`, color: C.dim })),
      streaming: "", reasoning: "", _advisorBlocks: [],
      foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
    }
    // Folded: unified [named header, tail 3]
    const folded = buildConvLines(state, 80)
    assert.equal(folded.length, 4)
    assert.ok(folded[0].text.startsWith("▶ tool output · 9 lines — "))
    assert.equal(strip(folded[3].text), "│ dim8", "tail = last 3 content lines (rule line)")
    const foldKey = folded[0]._foldToggle
    assert.ok(foldKey?.startsWith("fold-"))

    // Expanded: [blank, ▼ marker, then all 9 lines]
    state.expandedBlocks.add(foldKey)
    const expanded = buildConvLines(state, 80)
    assert.equal(expanded.length, 11, "blank + collapse marker + 9 lines")
    assert.equal(expanded[0].text, "")
    assert.ok(expanded[1].text.startsWith("▼ … 9 lines — "))
    assert.equal(expanded[1]._foldToggle, foldKey)
    assert.equal(strip(expanded[2].text), "│ dim0", "content follows the marker (rule line)")
  })

  it("short lines are not folded", async () => {
    const { C } = await import("../src/tui/ansi.mjs")
    const { buildConvLines } = await import("../src/tui/render-conversation.mjs")
    const state = {
      lines: [{ text: "short", color: C.dim }, { text: "another", color: C.dim }],
      streaming: "", reasoning: "", _advisorBlocks: [],
      foldEnabled: true, expandedBlocks: new Set(), scroll: 0, search: null,
    }
    assert.equal(buildConvLines(state, 80).length, 2)
  })
})

  it("clicks outside panels are ignored", () => {
    const state = mockState()
    const ctx = { state, render: () => {}, showPicker: async () => null, popPicker: () => {} }
    const orig = { cols: process.stdout.columns, rows: process.stdout.rows }
    Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true })
    Object.defineProperty(process.stdout, "rows", { value: 24, configurable: true })
    try {
      assert.equal(handleMouseClick(ctx, 5, 24), false) // status row → not consumed
    } finally {
      Object.defineProperty(process.stdout, "columns", { value: orig.cols, configurable: true })
      Object.defineProperty(process.stdout, "rows", { value: orig.rows, configurable: true })
    }
  })
})


describe("historyToLines — 恢复会话渲染工具参数（2026-08-30 用户报告）", () => {
  it("标题行 = 可读关键参数摘要；全量 pretty JSON 落 dim 行；畸形 args 不崩", async () => {
    const { historyToLines } = await import("../src/tui/startup.mjs")
    const history = [
      { role: "user", content: "hi" },
      { role: "assistant", content: "", tool_calls: [
        { id: "t1", function: { name: "read", arguments: JSON.stringify({ path: "src/x.mjs", offset: 5 }) } },
        { id: "t2", function: { name: "bash", arguments: JSON.stringify({ command: "npm test" }) } },
        { id: "t3", function: { name: "mcp__srv__tool", arguments: JSON.stringify({ q: 1, w: 2 }) } },
      ]},
      { role: "tool", tool_call_id: "t1", content: "content" },
    ]
    const lines = historyToLines(history, 0, history.length)
    assert.ok(lines.some((l) => l._toolBlock?.name === "read" && l._toolBlock.argsSummary.includes("src/x.mjs") && l._toolBlock.argsSummary.includes("offset 5")), "read 载体含路径+选项")
    assert.ok(lines.some((l) => l._toolBlock?.name === "bash" && l._toolBlock.argsSummary.includes("npm test")), "bash 载体含命令")
    assert.ok(lines.some((l) => l._toolBlock?.name === "mcp__srv__tool"), "未知工具载体存在")
    const texts = lines.map((l) => l.text)
    assert.ok(lines.some((l) => l._toolBlock?.argsJson.join("\n").includes("\"path\": \"src/x.mjs\"")), "全量 JSON 在载体 argsJson")
    assert.ok(lines.some((l) => l._toolBlock?.name === "bash" && l._toolBlock.argsJson.join("\n").includes("\"command\": \"npm test\"")), "bash 全量 JSON 在载体 argsJson")
    const bad = [{ role: "user", content: "x" }, { role: "assistant", content: "", tool_calls: [{ id: "t", function: { name: "read", arguments: "{broken" } }] }]
    const badLines = historyToLines(bad, 0, bad.length)
    const badBlk = badLines.find((l) => l._toolBlock)
    assert.ok(badBlk, "畸形 args 不崩，载体仍在")
    assert.ok(badBlk._toolBlock.argsJson[0].includes("{broken"), "原始参数串降级可见")
  })
})
