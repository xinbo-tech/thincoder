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

// ── 2026-09-01 v3：真实 400 形态锁定（escapemessage 窗口越界/孤立代理/多层 run） ──

test("v3: x/u 相邻形态必须同时 double（窗口越界回归——\\x 的 hex 窗口不得吞 \\u 的反斜杠）", () => {
  // 真实会话 400 原文："invalid literal \\x/\\u sequences"
  // v2 的 bug：处理 \\x 时 need=2 的窗口把 "/\\" 当 hex 吞掉 → \\u 的反斜杠丢失 → 毒保留
  assert.equal(escapeLiteralEscapes("invalid literal \\x/\\u sequences"), "invalid literal \\\\x/\\\\u sequences")
})

test("v3: 2 个反斜杠后的 \\u 必须放行（已配对形态——Windows 路径 \\u 前无配对才 double）", () => {
  // "\\u"（2 反斜杠）在二次解析中 \\ 配对消费 → u 普通字符 → 安全；不得再 double
  assert.equal(escapeLiteralEscapes("\\\\u123"), "\\\\u123")
  assert.equal(escapeLiteralEscapes("C:\\users\\temp"), "C:\\\\users\\temp") // 只有 \\u 的 \ 被补
})

test("v3: 孤立代理对不得留（strict JSON 解析会炸——D800-DFFF 无配对）", () => {
  assert.equal(escapeLiteralEscapes("\\uD83D"), "\\\\uD83D") // 孤立高代理 → double
  assert.equal(escapeLiteralEscapes("\\uDFFF"), "\\\\uDFFF") // 孤立低代理 → double
  assert.equal(escapeLiteralEscapes("\\uD83D\\uDE00"), "\\uD83D\\uDE00") // 成对 emoji → 放行
  assert.equal(escapeLiteralEscapes("\\uD83D\\uDE00 \\uD83D"), "\\uD83D\\uDE00 \\\\uD83D") // 混合
})

test("v3: 3+ 反斜杠 run 的奇偶正确（v1 Known limitation 修复）", () => {
  assert.equal(escapeLiteralEscapes("\\\\\\xzz"), "\\\\\\\\xzz") // 3 反斜杠+非法 x → double（v1 Known limitation 修复）
  assert.equal(escapeLiteralEscapes("\\\\\\x41"), "\\\\\\x41") // 3 反斜杠+合法 \x41 → 放行（二次解析成功）
  assert.equal(escapeLiteralEscapes("\\\\\\\\u0041"), "\\\\\\\\u0041") // 4 反斜杠+合法 → 放行
})
