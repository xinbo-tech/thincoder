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

test("escapeMessageContent neutralizes tool_calls[].function.arguments (F5 — deepseek v4-flash 400 vector)", () => {
  const out = escapeMessages([
    { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "grep", arguments: '{"p":"\\u12"}' } }] },
  ])
  // arguments 里字面 \u 不足 4 hex → 双写为 \\u（JSON 字符串值内合法；网关二次解码还原为字面）
  assert.equal(out[0].tool_calls[0].function.arguments, '{"p":"\\\\u12"}')
})

test("escapeMessageContent neutralizes reasoning_content (F5 — same server-side re-escape)", () => {
  const out = escapeMessages([{ role: "assistant", content: "ok", reasoning_content: "used \\x escape" }])
  assert.equal(out[0].reasoning_content, "used \\\\x escape")
})

test("escapeMessageContent leaves well-formed escapes and already-doubled arguments untouched", () => {
  const out = escapeMessages([
    { role: "assistant", tool_calls: [{ function: { arguments: '{"a":"\\u4e2d"}' } }], reasoning_content: "fine \\u4e2d" },
  ])
  assert.equal(out[0].tool_calls[0].function.arguments, '{"a":"\\u4e2d"}')
  assert.equal(out[0].reasoning_content, "fine \\u4e2d")
})
