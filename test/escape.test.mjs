// escape.test.mjs — escape.mjs 净化链测试（含 IKBGX4 transient 剥离、hex-escape 中和回归）。
import { test } from "node:test"
import assert from "node:assert/strict"
import { escapeMessages, escapeLiteralEscapes, stripLocalMessageFields } from "../src/escape.mjs"

test("escapeMessages strips the local-only transient flag (IKBGX4 — strict OpenAI endpoints 400 on it)", () => {
  const out = escapeMessages([
    { role: "user", content: "hi", transient: true },
    { role: "assistant", content: "yo" },
  ])
  assert.deepEqual(out, [
    { role: "user", content: "hi" },
    { role: "assistant", content: "yo" },
  ])
})

test("stripLocalMessageFields keeps every other field; leaves non-objects untouched", () => {
  const out = stripLocalMessageFields([
    { role: "user", content: "x", transient: true, extra: 1 },
    { role: "user", content: "plain" },
    "raw-string",
  ])
  assert.deepEqual(out, [
    { role: "user", content: "x", extra: 1 },
    { role: "user", content: "plain" },
    "raw-string",
  ])
})

test("escapeLiteralEscapes still neutralizes illegal hex sequences (regression)", () => {
  assert.equal(escapeLiteralEscapes("\\xzz"), "\\\\xzz")
  assert.equal(escapeLiteralEscapes("\\x41"), "\\x41") // valid hex passes untouched
})

test("escapeMessages still escapes message content after stripping (combined path)", () => {
  const out = escapeMessages([{ role: "user", content: "write \\x not hex", transient: true }])
  assert.deepEqual(out, [{ role: "user", content: "write \\\\x not hex" }])
})