/**
 * history-lazy.test.mjs — lazy history restore (CLI parity with VS Code lazy loading).
 * Locks historyToLines (the source-line materializer) and the page-slice math so
 * a huge restored session no longer rebuilds eagerly.
 */
import test from "node:test"
import assert from "node:assert/strict"
import { historyToLines, INITIAL_HISTORY_MESSAGES, HISTORY_PAGE_MESSAGES } from "../src/tui/startup.mjs"
import { C } from "../src/tui/ansi.mjs"

test("historyToLines materializes user/assistant/tool lines with summaries", () => {
  const history = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello", tool_calls: [{ id: "t1", function: { name: "bash" } }] },
    { role: "tool", tool_call_id: "t1", content: "ls\napp.js" },
  ]
  const lines = historyToLines(history, 0, 3)
    const texts = lines.map((l) => l.text)
    assert.ok(texts.includes("❯ You:"), "user label present")
  assert.ok(texts.includes("hi"), "user content present")
  assert.ok(texts.includes("❯ ThinCoder:"), "assistant label present")
  assert.ok(texts.includes("hello"), "assistant content present")
  assert.ok(lines.some((l) => l._toolBlock?.name === "bash"), "tool call carrier present (single-block)")
  const carrier = lines.find((l) => l._toolBlock)
  assert.ok(carrier._toolBlock.result?.includes("ls"), "tool result in carrier (lookahead across page edge)")
})

test("historyToLines skips system-reminder user messages", () => {
  const history = [
    { role: "user", content: "[System reminder: working directory snapshot: …]" },
    { role: "user", content: "real question" },
  ]
  const lines = historyToLines(history, 0, 2)
  assert.ok(!lines.some((l) => l.text.includes("System reminder")), "reminder omitted")
  assert.ok(lines.some((l) => l.text === "real question"), "real user message kept")
})

test("historyToLines slices a page and lookahead works across the page edge", () => {
  const history = [
    { role: "user", content: "first" },
    { role: "assistant", content: "A", tool_calls: [{ id: "t1", function: { name: "read" } }] },
    { role: "tool", tool_call_id: "t1", content: "file content line" },
    { role: "user", content: "second" },
  ]
  // Load only [0,2) — the assistant's tool result lives at index 2 (next page).
  const lines = historyToLines(history, 0, 2)
  const toolLine = lines.find((l) => l._toolBlock?.name === "read")
  assert.ok(toolLine, "tool call carrier present")
  assert.deepEqual(
    toolLine._toolBlock.result,
    ["file content line"],
    "FULL tool result in carrier from the NEXT page (full-array lookahead)",
  )
})

test("historyToLines restores reasoning and full tool results (fidelity vs the live run)", () => {
  const history = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "done", reasoning_content: "thinking line 1\nthinking line 2", tool_calls: [{ id: "t1", function: { name: "bash" } }] },
    { role: "tool", tool_call_id: "t1", content: "line1\nline2\nline3" },
  ]
  const lines = historyToLines(history, 0, 3)
  // Reasoning restores as ONE C.reason entry — the exact shape flushStream
  // produces live, so buildConvLines folds it under the named "▶ thinking"
  // header with the SAME thresholds as the live path (2026-08-30: the old
  // dim-fragment form never hit the consecutive-dim threshold on short
  // agentic thinking bursts and mislabeled long ones "tool output").
  const reasoningLine = lines.find((l) => l.text.includes("thinking line 1") && l.text.includes("thinking line 2"))
  assert.ok(reasoningLine, "reasoning restored as ONE line entry (full string, not fragments)")
  assert.equal(reasoningLine?.color, C.reason, "reasoning is C.reason — buildConvLines folds it like live thinking")
  const blk = lines.find((l) => l._toolBlock)
  assert.ok(blk, "tool call carrier present")
  assert.deepEqual(blk._toolBlock.result, ["line1", "line2", "line3"], "FULL tool result in carrier (not a one-line summary)")
})

test("historyToLines emits ONE assistant label per turn (multi-segment turns)", () => {
  const history = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "working…", tool_calls: [{ id: "t1", function: { name: "bash" } }] },
    { role: "tool", tool_call_id: "t1", content: "out1" },
    { role: "assistant", content: "", tool_calls: [{ id: "t2", function: { name: "read" } }] }, // empty-content segment
    { role: "tool", tool_call_id: "t2", content: "out2" },
    { role: "assistant", content: "final answer" },
  ]
  const lines = historyToLines(history, 0, 6)
  const labels = lines.filter((l) => l.text === "❯ ThinCoder:")
  assert.equal(labels.length, 1, "one label per turn, not per LLM-call segment")
  assert.ok(lines.some((l) => l.text === "final answer"), "all segments still restored")
})

test("historyToLines starts mid-turn without re-emitting the label (page edge)", () => {
  const history = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "first", tool_calls: [{ id: "t1", function: { name: "bash" } }] },
    { role: "tool", tool_call_id: "t1", content: "out" },
    { role: "assistant", content: "second" },
  ]
  // Page starts at index 2 (mid-turn) — the previous message is an assistant segment.
  const lines = historyToLines(history, 2, 4)
  assert.ok(!lines.some((l) => l.text === "❯ ThinCoder:"), "mid-turn page does not re-emit the label")
  assert.ok(lines.some((l) => l.text === "second"), "segment content still restored")
})

test("page constants align with VS Code parity (initial window > page size)", () => {
  assert.ok(INITIAL_HISTORY_MESSAGES > HISTORY_PAGE_MESSAGES)
  assert.equal(HISTORY_PAGE_MESSAGES, 50) // VS Code HISTORY_PAGE_SIZE parity
})
