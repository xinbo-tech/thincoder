/**
 * provider-headers.test.mjs — `provider.headers` 全通路铺开（第 32 批 · PROVIDER.md §6.17）
 *
 * 用例表 = 设计 PROVIDER.md §6.17（T39–T47）；判据 = 同节 AC-18。
 * T39 core 参照面 / T40 responses / T41 anthropic / T42 google / T43 generate-title（直连+proxy）
 * ——定制头到达；T44 同名冲突 → 内置头胜出（5 通路）；T45 零配置回归（头集合逐字不变）；
 * T46 config → 请求全链（装载面净化 + 装配展开）；T47 非 2xx 路径定制头携行 + 错误语义不变。
 *
 * mock 形态（PROVIDER.md §6.17 注）：`globalThis.fetch` 注入记录 (url, opts)；native 三格式最小 SSE 帧
 * （responses / anthropic / google）；OpenAI 面非 SSE 单 chunk JSON 兜底；generate-title proxy
 * 分支经 `_deps.proxyFetchImpl` 注入；config 面经 `_setConfigPathForTest` + tmp config.json
 * （夹具形态同 config-merge.test.mjs）。无定时器等待——快层直跑（D-T6 阈值内）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { chat } from "@thincoder/core/provider/core.mjs"
import { generateTitle, _deps } from "@thincoder/core/generate-title.mjs"
import { loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"

// ─── 夹具 ───

const enc = new TextEncoder()
const MSGS = [{ role: "user", content: "hi" }]
const TITLE_TEXT = "this is a long enough user message for a title"
const DEV = { "X-Device-Id": "dev-1" }

/** fetch 注入：calls 记录 (url, opts)；handler 返回 Response 形（抛错 = 网络失败）。 */
function mockFetch(handler) {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts })
    return handler(String(url), opts, calls.length)
  }
  return { calls, restore: () => { globalThis.fetch = orig } }
}

/** Response 形（SSE）：body = 单 chunk 异步迭代（与真实流同形——解析侧按 chunk 解码）。 */
function sseResponse(text, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "text/event-stream" },
    text: async () => text,
    body: { async *[Symbol.asyncIterator]() { yield enc.encode(text) } },
  }
}

/** Response 形（JSON 单 chunk）：OpenAI 面兜底 / generate-title 面 / 错误体。 */
function jsonResponse(body, status = 200) {
  const text = typeof body === "string" ? body : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    text: async () => text,
    json: async () => JSON.parse(text),
    body: null,
  }
}

/** OpenAI 面兜底 chunk（readSSE 的非 SSE 单 chunk JSON 路径）。 */
const openaiChunk = () => ({ choices: [{ message: { content: "hi" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1 } })

// native 三格式最小 SSE 帧（PROVIDER.md §6.17 注）
const RESPONSES_FRAMES =
  `event: response.output_text.delta\ndata: ${JSON.stringify({ type: "response.output_text.delta", delta: "hi" })}\n\n` +
  `event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: { id: "resp_1", usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } } })}\n\n`
const ANTHROPIC_FRAMES =
  `event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 1, output_tokens: 1 } } })}\n\n` +
  `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "hi" } })}\n\n` +
  `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`
const GOOGLE_FRAMES = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "hi" }] } }] })}\n\n`

// 5 通路基线 provider（无定制头）
const OPENAI = { name: "deepseek", baseURL: "https://api.deepseek.com/v1", model: "deepseek-v4-flash", apiKey: "k-test" }
const OPENAI_RESPONSES = { name: "openai", baseURL: "https://api.openai.com/v1", model: "gpt-5.6", apiKey: "k-test", format: "responses" }
const ANTHROPIC = { name: "claude", baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4", apiKey: "k-test", format: "anthropic" }
const GOOGLE = { name: "gemini", baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash", apiKey: "k-test", format: "google" }

/** 5 通路表（T44/T45 逐通路遍历）——title:true = generate-title 面。 */
const CHANNELS = [
  { label: "core", provider: OPENAI, reply: () => jsonResponse(openaiChunk()) },
  { label: "responses", provider: OPENAI_RESPONSES, reply: () => sseResponse(RESPONSES_FRAMES) },
  { label: "anthropic", provider: ANTHROPIC, reply: () => sseResponse(ANTHROPIC_FRAMES) },
  { label: "google", provider: GOOGLE, reply: () => sseResponse(GOOGLE_FRAMES) },
  { label: "generate-title", provider: OPENAI, reply: () => jsonResponse({ choices: [{ message: { content: "T" } }] }), title: true },
]

/** 无定制头时的内置头基线（T44/T45 判据——PROVIDER.md §6.17）。 */
const BUILTIN = {
  core: { "Content-Type": "application/json", Authorization: "Bearer k-test" },
  responses: { "Content-Type": "application/json", Authorization: "Bearer k-test" },
  anthropic: { "Content-Type": "application/json", "x-api-key": "k-test", "anthropic-version": "2023-06-01" },
  google: { "Content-Type": "application/json" },
  "generate-title": { "Content-Type": "application/json", Authorization: "Bearer k-test" },
}

/** 逐通路发一次请求并捕获装配后的请求头（headers 缺省 = 零配置面）。 */
async function captureHeaders(entry, headers) {
  const provider = { ...entry.provider, ...(headers ? { headers } : {}) }
  const m = mockFetch(entry.reply)
  try {
    if (entry.title) await generateTitle(TITLE_TEXT, provider)
    else await chat(provider, { messages: MSGS })
    assert.equal(m.calls.length, 1, `${entry.label}: 请求已发出（单次）`)
    return m.calls[0].opts.headers
  } finally { m.restore() }
}

// ─── T39–T43 定制头到达（逐通路）───

test("T39 主聊天（OpenAI 兼容）定制头到达——参照面", async () => {
  const m = mockFetch(() => jsonResponse(openaiChunk()))
  try {
    const r = await chat({ ...OPENAI, headers: { ...DEV } }, { messages: MSGS })
    assert.equal(r.content, "hi", "通路语义零改（响应仍解析）")
    assert.equal(m.calls.length, 1, "单次请求（头断言锚定首请求）")
    assert.deepEqual(m.calls[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN.core })
  } finally { m.restore() }
})

test("T40 responses 定制头到达", async () => {
  const m = mockFetch(() => sseResponse(RESPONSES_FRAMES))
  try {
    const r = await chat({ ...OPENAI_RESPONSES, headers: { ...DEV } }, { messages: MSGS })
    assert.equal(r.content, "hi")
    assert.equal(m.calls.length, 1, "单次请求（头断言锚定首请求）")
    assert.deepEqual(m.calls[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN.responses }, "头集合同 T39")
  } finally { m.restore() }
})

test("T41 anthropic 定制头到达（内置头在位）", async () => {
  const m = mockFetch(() => sseResponse(ANTHROPIC_FRAMES))
  try {
    const r = await chat({ ...ANTHROPIC, headers: { ...DEV } }, { messages: MSGS })
    assert.equal(r.content, "hi")
    assert.equal(m.calls.length, 1, "单次请求（头断言锚定首请求）")
    assert.deepEqual(m.calls[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN.anthropic })
    assert.equal("Authorization" in m.calls[0].opts.headers, false, "该通路无 Authorization 内置头")
  } finally { m.restore() }
})

test("T42 google 定制头到达", async () => {
  const m = mockFetch(() => sseResponse(GOOGLE_FRAMES))
  try {
    const r = await chat({ ...GOOGLE, headers: { ...DEV } }, { messages: MSGS })
    assert.equal(r.content, "hi")
    assert.equal(m.calls.length, 1, "单次请求（头断言锚定首请求）")
    assert.deepEqual(m.calls[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN.google })
  } finally { m.restore() }
})

test("T43 会话标题定制头到达（直连 + proxy 两分支）", async () => {
  const m = mockFetch(() => jsonResponse({ choices: [{ message: { content: "Title" } }] }))
  try {
    const title = await generateTitle(TITLE_TEXT, { ...OPENAI, headers: { ...DEV } })
    assert.equal(title, "Title", "直连分支：头展开不改返回语义")
    assert.equal(m.calls.length, 1, "单次请求（头断言锚定首请求）")
    assert.deepEqual(m.calls[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN["generate-title"] })
  } finally { m.restore() }

  const captured = []
  const origImpl = _deps.proxyFetchImpl
  _deps.proxyFetchImpl = async (url, opts, uri) => {
    captured.push({ url, opts, uri })
    return jsonResponse({ choices: [{ message: { content: "ProxyTitle" } }] })
  }
  try {
    const title = await generateTitle(TITLE_TEXT, { ...OPENAI, headers: { ...DEV }, proxyUri: "http://127.0.0.1:9/proxy" })
    assert.equal(title, "ProxyTitle", "proxy 分支：注入缝生效")
    assert.equal(captured.length, 1)
    assert.equal(captured[0].uri, "http://127.0.0.1:9/proxy", "走 proxy 分支（非直连）")
    assert.deepEqual(captured[0].opts.headers, { "X-Device-Id": "dev-1", ...BUILTIN["generate-title"] }, "两分支共用同一 opts（PROVIDER.md §6.17）")
  } finally { _deps.proxyFetchImpl = origImpl }
})

// ─── T44 / T45 覆盖语义与零配置回归 ───

test("T44 边界：同名冲突 → 内置头胜出（5 通路）", async () => {
  const CONFLICT = { "Content-Type": "text/evil", Authorization: "Bearer evil", "x-api-key": "evil", "anthropic-version": "1999-01-01", "X-Device-Id": "dev-1" }
  for (const entry of CHANNELS) {
    const h = await captureHeaders(entry, { ...CONFLICT })
    for (const [k, v] of Object.entries(BUILTIN[entry.label])) {
      assert.equal(h[k], v, `${entry.label}: 同名定制头不覆盖内置头 ${k}`)
    }
    assert.equal(h["X-Device-Id"], "dev-1", `${entry.label}: 非同名定制键仍到达`)
  }
})

test("T45 边界：零配置回归——头集合逐字不变（5 通路）", async () => {
  for (const entry of CHANNELS) {
    const h = await captureHeaders(entry)
    assert.deepEqual(h, BUILTIN[entry.label], `${entry.label}: provider.headers 缺省时头集合逐字不变`)
  }
})

// ─── T46 config 全链（净化 + 展开）───

test("T46 边界：config → 请求全链（装载面净化 + 装配展开）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-headers-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify({
    defaultModel: "gateway:deepseek-v4-flash",
    providers: [{
      name: "gateway",
      baseURL: "https://gw.example.com/v1",
      model: "deepseek-v4-flash",
      apiKey: "k-gw",
      headers: { "X-Device-Id": "dev-1", authorization: "Bearer evil", Authorization: "Bearer evil2", "X-Num": 42, "X-Obj": { a: 1 } },
    }],
  }, null, 2) + "\n", "utf8")
  const m = mockFetch(() => jsonResponse(openaiChunk()))
  try {
    _setConfigPathForTest(p)
    const cfg = loadConfig()
    assert.deepEqual(cfg.provider.headers, { "X-Device-Id": "dev-1" }, "装载面净化：Authorization（大小写不敏感）+ 非字符串值剥离")
    const r = await chat(cfg.provider, { messages: MSGS })
    assert.equal(r.content, "hi")
    const h = m.calls[0].opts.headers
    assert.equal(h["X-Device-Id"], "dev-1", "正常定制键到达请求面")
    assert.equal(h.Authorization, "Bearer k-gw", "Authorization = 内置 Bearer（配置值不达）")
    assert.equal("authorization" in h, false, "大小写变体不残留")
    assert.equal("X-Num" in h, false, "非字符串值不达请求面")
  } finally {
    m.restore()
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── T47 错误路径（非 2xx）───

test("T47 错误：非 2xx 路径定制头携行 + 错误语义不变（anthropic 通路）", async () => {
  const m = mockFetch(() => jsonResponse("invalid api key", 401))
  try {
    await assert.rejects(
      () => chat({ ...ANTHROPIC, headers: { ...DEV } }, { messages: MSGS }),
      (err) => {
        assert.match(err.message, /^Anthropic API error 401/, "错误文案族不变（既有语义——零改）")
        return true
      },
    )
    assert.equal(m.calls.length, 1, "401 非可重试——单次请求（无重试等待）")
    const h = m.calls[0].opts.headers
    assert.equal(h["X-Device-Id"], "dev-1", "错误路径定制头携行")
    assert.equal(h["x-api-key"], "k-test", "内置头在位")
  } finally { m.restore() }
})
