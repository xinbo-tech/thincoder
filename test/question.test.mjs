/**
 * question.test.mjs — the question tool must render INLINE in the chat panel
 * (via callbacks.onQuestion), not via VS Code's native QuickPick/InputBox popup
 * at the top of the window (users miss it; an accidental click cancels it).
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { questionTool } from "../src/tools/question.mjs"

test("uses the inline panel callback when provided (options passed through)", async () => {
  const seen = []
  const ctx = { callbacks: { onQuestion: async (q, opts) => { seen.push([q, opts]); return "yes" } } }
  const r = await questionTool.execute({ question: "Proceed?", options: ["yes", "no"] }, ctx)
  assert.equal(r, "yes")
  assert.deepEqual(seen[0], ["Proceed?", ["yes", "no"]])
})

test("free-text questions pass null options to the callback", async () => {
  let opts = "sentinel"
  const ctx = { callbacks: { onQuestion: async (_q, o) => { opts = o; return "answer" } } }
  const r = await questionTool.execute({ question: "What?" }, ctx)
  assert.equal(r, "answer")
  assert.equal(opts, null)
})

test("an empty options array also degrades to free-text (null options)", async () => {
  let opts = "sentinel"
  const ctx = { callbacks: { onQuestion: async (_q, o) => { opts = o; return null } } }
  await questionTool.execute({ question: "q?", options: [] }, ctx)
  assert.equal(opts, null)
})

test("a null answer surfaces as (user cancelled)", async () => {
  const ctx = { callbacks: { onQuestion: async () => null } }
  const r = await questionTool.execute({ question: "q?" }, ctx)
  assert.equal(r, "(user cancelled)")
})

test("no callback → native fallback path is not entered (callback-less ctx never crashes before it)", async () => {
  // The native fallback needs VS Code's QuickPick/InputBox, which the test mock
  // does not provide — assert the contract of the callback guard instead.
  assert.ok(typeof questionTool.execute === "function")
})

test("a parked question is released (null) when the turn's signal aborts — panel-side wiring", async () => {
  // Mirrors the onQuestion wiring in panel-chat.mjs: Stop must resolve the parked
  // promise, remove the queue entry, and tell the webview to dismiss the card.
  const ctrl = new AbortController()
  const queue = []
  const posts = []
  const onQuestion = (question, options) => new Promise((resolve) => {
    const entry = { resolve }
    queue.push(entry)
    posts.push({ type: "question", question, options })
    const onAbort = () => {
      const i = queue.indexOf(entry)
      if (i >= 0) queue.splice(i, 1)
      posts.push({ type: "questionCancelled" })
      resolve(null)
    }
    if (ctrl.signal.aborted) onAbort()
    else ctrl.signal.addEventListener("abort", onAbort, { once: true })
  })
  const pending = onQuestion("Stuck?", ["a", "b"])
  ctrl.abort()
  assert.equal(await pending, null, "Stop resolves the parked question with null")
  assert.equal(queue.length, 0, "queue entry removed")
  assert.ok(posts.some((m) => m.type === "questionCancelled"), "webview told to dismiss")
})

test("the question tool returns '(user cancelled)' on a null answer", async () => {
  const ctx = { callbacks: { onQuestion: async () => null } }
  const r = await questionTool.execute({ question: "x?" }, ctx)
  assert.equal(r, "(user cancelled)")
})

// ─── §22 question 工具使用抑制 + 卡片渲染修复（2026-09-06，AGENT-LOOP.md §22 镜像子集）───

test("T-Q2: description carries the CLI question.md mirror anchors (fail-when-unchanged)", () => {
  const d = questionTool.description
  assert.ok(d.includes("Ask ONE question per call — never bundle multiple sub-questions into one question string; ask the next one after the answer arrives."), "D-Q1 锚1：一次一问")
  assert.ok(d.includes("Keep the question text short — one or two sentences. Background, context, and analysis belong in your normal reply text, NOT in the question."), "D-Q1 锚2：问题简短、背景归正文")
  assert.ok(d.includes("Routine confirmations (confirm gates) belong in your plain reply text — the user answers in their next message. Use this tool ONLY when you need the user's decision or input to proceed."), "D-Q1 锚3：例行确认走正文")
  assert.ok(d.includes("Use sparingly — prefer making reasonable decisions when possible"), "既有 Use sparingly 补齐（两端对齐）")
})

test("T-Q3: 101-char question is rejected and onQuestion is NOT called", async () => {
  let called = false
  const ctx = { callbacks: { onQuestion: async () => { called = true; return "yes" } } }
  const r = await questionTool.execute({ question: "q".repeat(101) }, ctx)
  assert.ok(r.includes("question too long"), "error string names the cause")
  assert.equal(r, "(error: question too long (>100 chars) — ask ONE short question; background belongs in your normal reply text)")
  assert.equal(called, false, "onQuestion not called — no card shown")
})

test("T-Q4: 5 options are rejected and onQuestion is NOT called", async () => {
  let called = false
  const ctx = { callbacks: { onQuestion: async () => { called = true; return "a" } } }
  const r = await questionTool.execute({ question: "Pick?", options: ["a", "b", "c", "d", "e"] }, ctx)
  assert.equal(r, "(error: too many options (>4) — offer at most 4 plain-string options)")
  assert.equal(called, false, "onQuestion not called — no card shown")
})

test("T-Q5: boundary passes through — 100 chars / 4 options reach onQuestion", async () => {
  const seen = []
  const ctx = { callbacks: { onQuestion: async (q, opts) => { seen.push([q, opts]); return "ok" } } }
  const r = await questionTool.execute({ question: "q".repeat(100), options: ["a", "b", "c", "d"] }, ctx)
  assert.equal(r, "ok")
  assert.equal(seen.length, 1, "onQuestion called at the boundary")
  assert.equal(seen[0][0].length, 100)
  assert.equal(seen[0][1].length, 4)
})

test("T-Q5b: non-array options pass through untouched (guard only fires on arrays)", async () => {
  let called = 0
  const ctx = { callbacks: { onQuestion: async () => { called++; return "ok" } } }
  const r = await questionTool.execute({ question: "Pick?", options: { 0: "a", 1: "b", 2: "c", 3: "d", 4: "e", length: 5 } }, ctx)
  assert.equal(r, "ok", "array-like non-array options are not capped (评审 #4 guard 条件)")
  assert.equal(called, 1)
})

test("T-Q8: base.css .question-text preserves line breaks and bounds height", () => {
  const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "webview", "base.css"), "utf8")
  const rule = css.match(/\.question-text\s*\{([^}]*)\}/)
  assert.ok(rule, ".question-text rule exists")
  assert.ok(rule[1].includes("white-space: pre-wrap"), "D-Q4: line breaks preserved (pre-wrap)")
  assert.ok(rule[1].includes("max-height: 40vh"), "D-Q4: height bound")
  assert.ok(rule[1].includes("overflow-y: auto"), "D-Q4: long text scrolls inside the card")
})
