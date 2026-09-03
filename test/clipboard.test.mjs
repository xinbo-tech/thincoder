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

test("insertPastedText: free-text question active → splices into answer at cursor（codepoint 数组）", () => {
  const state = { question: { options: [], answer: [..."a"], cursor: 1 }, input: [], cursor: 0 }
  insertPastedText(state, "b\nc")
  assert.equal(state.question.answer.join(""), "ab c", "\n → 空格（单行不变式——文本保留）")
  assert.equal(state.question.cursor, 4)
  assert.equal(state.input.length, 0)
})

test("T-Q6 insertPastedText: 粘贴落 cursor 位置（中段——非仅尾部追加）", () => {
  const state = { question: { options: [], answer: [..."ab"], cursor: 1 }, input: [], cursor: 0 }
  insertPastedText(state, "XY")
  assert.equal(state.question.answer.join(""), "aXYb")
  assert.equal(state.question.cursor, 3)
  assert.equal(state.input.length, 0)
})

test("T-Q8 insertPastedText: 粘贴含 \n 折叠为空格（连续空行折叠不吞文本——单行硬守卫）", () => {
  const state = { question: { options: [], answer: [..."a"], cursor: 1 }, input: [], cursor: 0 }
  insertPastedText(state, "line1\r\nline2\n\nline3")
  assert.equal(state.question.answer.join(""), "aline1 line2 line3", "\r\n 与连续空行折叠为单空格——文本不丢")
  assert.equal(state.question.cursor, 18)
  assert.equal(state.input.length, 0)
})

test("insertPastedText: options question active → ignored (must not leak into input)", () => {
  const state = { question: { options: ["y", "n"], answer: null }, input: [], cursor: 0 }
  insertPastedText(state, "sneak")
  assert.equal(state.question.answer, null)
  assert.equal(state.input.length, 0)
})

test("insertPastedText: stale async paste after Esc abort → dropped（不落主输入框——审计 F1）", () => {
  const state = { question: null, input: [], cursor: 0 }
  const oldQ = { options: [], answer: [..."ab"], cursor: 1 }
  insertPastedText(state, "leak", oldQ)
  assert.equal(state.input.length, 0, "Esc 后到达的异步粘贴不得进主输入框")
  // 新 question 已开（不同对象）——旧粘贴同样丢弃
  const state2 = { question: { options: [], answer: [], cursor: 0 }, input: [], cursor: 0 }
  insertPastedText(state2, "leak", oldQ)
  assert.deepEqual(state2.question.answer, [], "stale 粘贴不落新 question")
  assert.equal(state2.input.length, 0)
  // 目标仍激活 → 正常落 cursor
  const state3 = { question: oldQ, input: [], cursor: 0 }
  insertPastedText(state3, "XY", oldQ)
  assert.equal(oldQ.answer.join(""), "aXYb", "目标仍激活照常粘贴")
})

test("insertPastedText: otherwise → splices into the input box at cursor (tabs → 2 spaces)", () => {
  const state = { input: ["a", "c"], cursor: 1 }
  insertPastedText(state, "b\tx")
  assert.deepEqual(state.input, ["a", "b", " ", " ", "x", "c"])
  assert.equal(state.cursor, 5)
})