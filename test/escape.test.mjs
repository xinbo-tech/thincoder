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
  // v4 替换策略（2026-09-02）：\x 不足 2hex → \x5Cx（不是 v1-v3 的 double——网关不看前置反斜杠）
  assert.equal(escapeLiteralEscapes("\\xzz"), "\\x5Cxzz")
  assert.equal(escapeLiteralEscapes("\\x41"), "\\x41") // valid hex passes untouched
})

test("escapeMessages still escapes message content after stripping (combined path)", () => {
  const out = escapeMessages([{ role: "user", content: "write \\x not hex", transient: true }])
  assert.deepEqual(out, [{ role: "user", content: "write \\x5Cx not hex" }])
})

test("escapeMessageContent neutralizes tool_calls[].function.arguments (F5 — deepseek v4-flash 400 vector)", () => {
  const out = escapeMessages([
    { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "grep", arguments: '{"p":"\\u12"}' } }] },
  ])
  // v4 替换策略（2026-09-02）：arguments 里字面 \\u 不足 4 hex → 替换为 \\x5Cu（网关展开为 \\+u 字面，不炸）
  assert.equal(out[0].tool_calls[0].function.arguments, '{"p":"\\x5Cu12"}')
})

test("escapeMessageContent neutralizes reasoning_content (F5 — same server-side re-escape)", () => {
  const out = escapeMessages([{ role: "assistant", content: "ok", reasoning_content: "used \\x escape" }])
  assert.equal(out[0].reasoning_content, "used \\x5Cx escape")
})

test("escapeMessageContent leaves well-formed escapes and already-doubled arguments untouched", () => {
  const out = escapeMessages([
    { role: "assistant", tool_calls: [{ function: { arguments: '{"a":"\\u4e2d"}' } }], reasoning_content: "fine \\u4e2d" },
  ])
  assert.equal(out[0].tool_calls[0].function.arguments, '{"a":"\\u4e2d"}')
  assert.equal(out[0].reasoning_content, "fine \\u4e2d")
})

// ── 2026-09-01 v3：真实 400 形态锁定（escapemessage 窗口越界/孤立代理/多层 run） ──

test("v4: x/u 相邻形态同时替换（替换策略——无 double）", () => {
  // 真实会话 400 原文："invalid literal \\x/\\u sequences"——v4 替换为 \x5Cx/\x5Cu
  assert.equal(escapeLiteralEscapes("invalid literal \\x/\\u sequences"), "invalid literal \\x5Cx/\\x5Cu sequences")
})

test("v4: 2 反斜杠后的 \\u 不足位仍替换（v1-v3 的配对放行模型已废弃——网关不看前置反斜杠）", () => {
  // "\\u"（2 反斜杠 + u + 123 不足 4hex）→ 仍替换（网关扫最后一个 \\+u 相邻对）
  assert.equal(escapeLiteralEscapes("\\\\u123"), "\\\\x5Cu123")
  // Windows 路径 C:\\users\\temp：\\u（1 反斜杠+u+不足4hex）→ 替换为 \\x5Cu
  assert.equal(escapeLiteralEscapes("C:\\users\\temp"), "C:\\x5Cusers\\temp")
})

test("v4: 孤立代理对放行（\\uXXXX 合法 hex 不炸——网关展开为码点，严格 JSON 解析是否炸待真机验）", () => {
  // v4 简化：\\u + 4hex 完整 → 放行（网关能展开）。孤立代理对的 strict 语义不做额外处理（真机再验证）。
  assert.equal(escapeLiteralEscapes("\\uD83D"), "\\uD83D")
  assert.equal(escapeLiteralEscapes("\\uDFFF"), "\\uDFFF")
  assert.equal(escapeLiteralEscapes("\\uD83D\\uDE00"), "\\uD83D\\uDE00")
})

test("v4: 多反斜杠 run 一律按末尾 \\x/\\u 判断（v1-v3 奇偶模型废弃）", () => {
  // 3 反斜杠+非法 x（x 后不足 2hex）→ 末尾 \\x 替换为 \\x5Cx
  assert.equal(escapeLiteralEscapes("\\\\\\xzz"), "\\\\\\x5Cxzz")
  // 3 反斜杠+合法 x41 → 放行（\\x41 合法）
  assert.equal(escapeLiteralEscapes("\\\\\\x41"), "\\\\\\x41")
  // 4 反斜杠+合法 u0041 → 放行（\\u0041 合法）
  assert.equal(escapeLiteralEscapes("\\\\\\\\u0041"), "\\\\\\\\u0041")
})