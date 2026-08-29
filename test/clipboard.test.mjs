/**
 * clipboard.mjs tests — buildWindowsClipboardCommand (TUI.md §9.2D, IK9UWM)
 * 与 insertPastedText 目标选择（IKBU3J：Ctrl+I 注入框粘贴）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { buildWindowsClipboardCommand, insertPastedText } from "../src/tui/clipboard.mjs"

test("buildWindowsClipboardCommand forces UTF-8 output for Get-Clipboard", () => {
  assert.deepEqual(buildWindowsClipboardCommand(), [
    "-NoProfile",
    "-Command",
    "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard",
  ])
})

test("insertPastedText: Ctrl+I interrupt prompt active → pastes into the inject box, never the input (IKBU3J)", () => {
  const state = { interruptPrompt: { text: "fix bug" }, input: [], cursor: 0 }
  insertPastedText(state, "paste me\nnow")
  assert.equal(state.interruptPrompt.text, "fix bugpaste menow", "newlines stripped, appended to inject text")
  assert.equal(state.input.length, 0, "must NOT land in the main input box")
})

test("insertPastedText: free-text question active → appends to its answer (newlines stripped)", () => {
  const state = { question: { options: [], answer: "a" }, input: [], cursor: 0 }
  insertPastedText(state, "b\nc")
  assert.equal(state.question.answer, "abc")
  assert.equal(state.input.length, 0)
})

test("insertPastedText: options question active → ignored (must not leak into input)", () => {
  const state = { question: { options: ["y", "n"], answer: null }, input: [], cursor: 0 }
  insertPastedText(state, "sneak")
  assert.equal(state.question.answer, null)
  assert.equal(state.input.length, 0)
})

test("insertPastedText: otherwise → splices into the input box at cursor (tabs → 2 spaces)", () => {
  const state = { input: ["a", "c"], cursor: 1 }
  insertPastedText(state, "b\tx")
  assert.deepEqual(state.input, ["a", "b", " ", " ", "x", "c"])
  assert.equal(state.cursor, 5)
})