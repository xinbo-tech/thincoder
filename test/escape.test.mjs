// escape.test.mjs — escape.mjs 净化链测试（含 IKBGX4 transient 剥离、hex-escape 中和回归、孤立代理净化）。
import { test } from "node:test"
import assert from "node:assert/strict"
import { escapeMessages, escapeLiteralEscapes, sanitizeLoneSurrogates, sanitizeText, stripLocalMessageFields } from "../src/escape.mjs"

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

// ── 毒源①：字面 hex 转义中和（v1 语义 + 奇数 run 修复）──

test("escapeLiteralEscapes neutralizes illegal hex sequences（真毒形态：反斜杠+x/u+不足位）", () => {
  // ⚠️ 形态校准（2026-09-02）："\\x5Cxzz" 是 \\x5C（合法 hex 转义=反斜杠）+xzz——**合法放行**。
  // 真毒形态 = 反斜杠+x+非hex（如 "\\xzz"）或 反斜杠+u+不足4hex（如 "\\u12中"）
  assert.equal(escapeLiteralEscapes("\\xzz"), "\\\\xzz") // \x+zz 非hex → double
  assert.equal(escapeLiteralEscapes("\\u12中文"), "\\\\u12中文") // \u+12中文 不足4hex → double
  assert.equal(escapeLiteralEscapes("\\x41"), "\\x41") // 合法 2hex → 放行
  assert.equal(escapeLiteralEscapes("\\u0041"), "\\u0041") // 合法 4hex → 放行
  assert.equal(escapeLiteralEscapes("\\x5Cxzz"), "\\x5Cxzz") // \\x5C+xzz：\\x5Cx 合法 → 放行（文档写法形态）
  assert.equal(escapeLiteralEscapes("\\x5Cu12中文"), "\\x5Cu12中文") // \\x5C+u12中文：\\x5Cx 合法 → 放行
})

test("escapeLiteralEscapes: run 奇偶（v1 Known limitation 修复）", () => {
  assert.equal(escapeLiteralEscapes("\\\\u12中文"), "\\\\u12中文") // 2 反斜杠（偶数）已配对+u12中文 → 放行
  assert.equal(escapeLiteralEscapes("\\\\\\xzz"), "\\\\\\\\xzz") // 3 反斜杠（奇数）尾部 \\x+zz 裸露 → double 为 4
  assert.equal(escapeLiteralEscapes("\\\\\\\\x41"), "\\\\\\\\x41") // 4 反斜杠（偶数）→ 放行
})

test("escapeLiteralEscapes: x/u 相邻形态（窗口不吞后续序列）", () => {
  assert.equal(escapeLiteralEscapes("invalid literal \\xz/\\uv sequences"), "invalid literal \\\\xz/\\\\uv sequences")
})

// ── 毒源②：孤立代理净化（2026-09-02 deepseek 真机实锤）──

test("sanitizeLoneSurrogates: 孤立高/低代理替换为 ，成对放行", () => {
  assert.equal(sanitizeLoneSurrogates("test \uD83D world"), "test  world") // 孤立高代理
  assert.equal(sanitizeLoneSurrogates("test \uDFFF world"), "test  world") // 孤立低代理
  assert.equal(sanitizeLoneSurrogates("test 🔴 world"), "test 🔴 world") // 完整 emoji 放行
  assert.equal(sanitizeLoneSurrogates("🔴🔴🔴"), "🔴🔴🔴") // 连续成对
  assert.equal(sanitizeLoneSurrogates("a\uD83Db\uDFFFc"), "abc") // 两孤立（高代理后非低代理、低代理前非高代理）
  assert.equal(sanitizeLoneSurrogates("hello"), "hello") // 无代理
  assert.equal(sanitizeLoneSurrogates(""), "")
})

test("sanitizeText: doc_search 截断毒形态（emoji 代理对被 slice 切断）", () => {
  // 真实毒源场景：setup.mjs:117 slice(0, N) 切断 🔴（D83D DD34）→ 剩孤立 D83D
  const poisoned = "矛盾 🔴、该并入" .slice(0, 5) + "\uD83D" // 模拟截断残留
  const clean = sanitizeText(poisoned)
  assert.ok(!/[\uD800-\uDFFF]/.test(clean.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")), "无孤立代理残留")
})

test("escapeMessageContent neutralizes tool_calls[].function.arguments + reasoning_content", () => {
  const out = escapeMessages([
    { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "grep", arguments: '{"p":"\\u12"}' } }] },
  ])
  assert.equal(out[0].tool_calls[0].function.arguments, '{"p":"\\\\u12"}')
  const out2 = escapeMessages([{ role: "assistant", content: "ok", reasoning_content: "used \\xz escape" }])
  assert.equal(out2[0].reasoning_content, "used \\\\xz escape")
})

test("escapeMessageContent: 孤立代理在 content/arguments/reasoning 全字段净化", () => {
  const out = escapeMessages([{ role: "user", content: "a\uD83D" }])
  assert.equal(out[0].content, "a")
  const out2 = escapeMessages([{ role: "assistant", content: "", reasoning_content: "think\uD83D", tool_calls: [{ function: { arguments: '{"x":"b\uDFFF"}' } }] }])
  assert.equal(out2[0].reasoning_content, "think")
  assert.equal(out2[0].tool_calls[0].function.arguments, '{"x":"b"}')
})

test("escapeMessageContent leaves well-formed escapes untouched", () => {
  const out = escapeMessages([
    { role: "assistant", tool_calls: [{ function: { arguments: '{"a":"\\u4e2d"}' } }], reasoning_content: "fine \\u4e2d" },
  ])
  assert.equal(out[0].tool_calls[0].function.arguments, '{"a":"\\u4e2d"}')
  assert.equal(out[0].reasoning_content, "fine \\u4e2d")
})





test("escapeLiteralEscapes: v5 double 策略 + 奇数 run + 真毒形态（程序化构造避免转义层混乱）", async () => {
  const { escapeLiteralEscapes } = await import("../src/advisor.mjs")
  const BS = String.fromCharCode(0x5c) // 单反斜杠
  const cases = [
    // [输入, 期望]
    [BS + "xzz", BS + BS + "xzz"], // 真毒：\x5Cx+非hex → double
    [BS + "x41", BS + "x41"], // 合法 \x5Cx41 → 放行
    [BS + "u12中文", BS + BS + "u12中文"], // 真毒：\x5Cu+不足4hex → double
    [BS + "u0041", BS + "u0041"], // 合法 \x5Cu0041 → 放行
    [BS + BS + "u12中文", BS + BS + "u12中文"], // 2 反斜杠偶数已配对 → 放行
    [BS + BS + BS + "xzz", BS + BS + BS + BS + "xzz"], // 3 反斜杠奇数尾部裸露 → double 为 4
    ["C:" + BS + "users" + BS + "temp", "C:" + BS + BS + "users" + BS + "temp"], // Windows 路径：\\x5Cu+sers 不足4hex 是真毒 → double；\\t 合法转义放行
    ["hello", "hello"],
    [null, ""],
    [undefined, ""],
  ]
  for (const [input, expected] of cases) {
    assert.equal(escapeLiteralEscapes(input), expected, JSON.stringify(input))
  }
})

