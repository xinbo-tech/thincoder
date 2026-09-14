/**
 * list-models.test.mjs — 清单拉取按 format 分派（PROVIDER.md §16 M1——T1–T6 + T26/T27，CLI 面）。
 * mock 注入 globalThis.fetch：完整 URL（preset baseURL 组合钉死）/ 请求头 / 响应解析 / 失败态 /
 * 翻页合并 + ≤10 页截停；会话缓存 TTL 假时钟（`_catalogHooks`——T6 不依赖壁钟）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { listModels } from "@thincoder/core/provider/list-models.mjs"
import { PROVIDER_PRESETS } from "../src/config.mjs"
import { getProviderModels, probeChannelModels, _catalogHooks, _clearModelCatalogCache } from "../src/tui/model-catalog.mjs"

/** fetch 注入：calls 记录 (url, opts)；handler 返回 {status, body} 或抛错（network）。 */
function mockFetch(handler) {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts })
    const r = await handler(String(url), opts, calls.length)
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
    }
  }
  return { calls, restore: () => { globalThis.fetch = orig } }
}

const OPENAI = { name: "openai", baseURL: "https://api.openai.com/v1", apiKey: "k-openai" }
const CLAUDE = { ...PROVIDER_PRESETS.claude, apiKey: "k-claude" }
const GEMINI = { ...PROVIDER_PRESETS.gemini, apiKey: "k-gemini" }

test("T1 openai 拉取：GET {baseURL}/models + Bearer → data[].id", async () => {
  const m = mockFetch(() => ({ status: 200, body: { data: [{ id: "a" }, { id: "b" }] } }))
  try {
    assert.deepEqual(await listModels(OPENAI), ["a", "b"])
    assert.equal(m.calls.length, 1)
    assert.equal(m.calls[0].url, "https://api.openai.com/v1/models")
    assert.equal(m.calls[0].opts.headers.Authorization, "Bearer k-openai")
  } finally { m.restore() }
})

test("T2 anthropic 拉取：完整 URL + x-api-key / anthropic-version → data[].id", async () => {
  const m = mockFetch(() => ({ status: 200, body: { data: [{ id: "claude-x" }], has_more: false } }))
  try {
    assert.deepEqual(await listModels(CLAUDE), ["claude-x"])
    assert.equal(m.calls.length, 1)
    assert.equal(m.calls[0].url, "https://api.anthropic.com/v1/models?limit=1000", "完整 URL 与 chat 同基（claude 预设组合）")
    assert.equal(m.calls[0].opts.headers["x-api-key"], "k-claude")
    assert.equal(m.calls[0].opts.headers["anthropic-version"], "2023-06-01")
  } finally { m.restore() }
})

test("T3 google 拉取：完整 URL（key/pageSize）+ models[].name 剥前缀", async () => {
  const m = mockFetch(() => ({ status: 200, body: { models: [{ name: "models/gemini-2.5-flash" }] } }))
  try {
    assert.deepEqual(await listModels(GEMINI), ["gemini-2.5-flash"])
    assert.equal(m.calls.length, 1)
    assert.equal(m.calls[0].url, "https://generativelanguage.googleapis.com/v1beta/models?key=k-gemini&pageSize=1000")
  } finally { m.restore() }
})

test("T4 边界：google 名称无前缀 / 缺字段项跳过；未知 format 走 openai 分派", async () => {
  const m = mockFetch(() => ({ status: 200, body: { models: [{ name: "gemini-x" }, {}, { name: 42 }] } }))
  try {
    assert.deepEqual(await listModels(GEMINI), ["gemini-x"], "无前缀名保留 + 缺项跳过")
    // 未知/缺省 format → openai（与 chat 分派缺省一致）
    assert.deepEqual(await listModels({ ...OPENAI, format: "responses" }), [])
    assert.equal(m.calls[1].url, "https://api.openai.com/v1/models")
  } finally { m.restore() }
})

test("T5 错误：HTTP 非 2xx / 网络失败 → 抛出（错误态不吞）", async () => {
  const m = mockFetch(() => ({ status: 404, body: "not found" }))
  try {
    await assert.rejects(() => listModels(OPENAI), /GET \/models failed 404: not found/)
  } finally { m.restore() }
  const m2 = mockFetch(() => { throw new Error("fetch failed") })
  try {
    await assert.rejects(() => listModels(CLAUDE), /fetch failed/)
  } finally { m2.restore() }
})

test("T26 anthropic 翻页：has_more → after_id 跟随（2 页合并）+ ≤10 页截停", async () => {
  const m = mockFetch((url) => url.includes("after_id=c1")
    ? { status: 200, body: { data: [{ id: "c2" }], has_more: false } }
    : { status: 200, body: { data: [{ id: "c1" }], has_more: true, last_id: "c1" } })
  try {
    assert.deepEqual(await listModels(CLAUDE), ["c1", "c2"])
    assert.equal(m.calls.length, 2, "请求次数 = 2")
    assert.ok(m.calls[1].url.includes("after_id=c1"), "第二页带游标")
  } finally { m.restore() }
  const cap = mockFetch((url) => ({ status: 200, body: { data: [{ id: "x" }], has_more: true, last_id: "x" } }))
  try {
    const out = await listModels(CLAUDE)
    assert.equal(cap.calls.length, 10, "≤10 页上限截停（防死循环）")
    assert.equal(out.length, 10)
  } finally { cap.restore() }
})

test("T27 google 翻页：nextPageToken 透传（2 页合并）+ ≤10 页截停", async () => {
  const m = mockFetch((url) => url.includes("pageToken=t1")
    ? { status: 200, body: { models: [{ name: "models/g2" }] } }
    : { status: 200, body: { models: [{ name: "models/g1" }], nextPageToken: "t1" } })
  try {
    assert.deepEqual(await listModels(GEMINI), ["g1", "g2"])
    assert.equal(m.calls.length, 2)
    assert.ok(m.calls[1].url.includes("pageToken=t1"))
  } finally { m.restore() }
  const cap = mockFetch(() => ({ status: 200, body: { models: [{ name: "models/g" }], nextPageToken: "t" } }))
  try {
    await listModels(GEMINI)
    assert.equal(cap.calls.length, 10, "≤10 页上限截停")
  } finally { cap.restore() }
})

test("T6 会话缓存 TTL 60s：TTL 内不重拉 / 过期重拉 / 失败不缓存（假时钟）", async () => {
  _clearModelCatalogCache()
  const origNow = _catalogHooks.now
  let now = 1_000_000
  _catalogHooks.now = () => now
  let fail = false
  const m = mockFetch(() => {
    if (fail) throw new Error("boom")
    return { status: 200, body: { data: [{ id: "m1" }] } }
  })
  try {
    const p = { name: "t6", baseURL: "https://t6.example/v1", apiKey: "k" }
    assert.deepEqual(await getProviderModels(p), ["m1"])
    assert.equal(m.calls.length, 1)
    now += 30_000
    assert.deepEqual(await getProviderModels(p), ["m1"])
    assert.equal(m.calls.length, 1, "TTL 内命中缓存——不发请求")
    now += 31_000
    await getProviderModels(p)
    assert.equal(m.calls.length, 2, "超过 60s 重拉")
    // 失败不缓存：同一渠道连续两次失败 → 两次都走网络（不落缓存条目）
    const pf = { name: "t6-fail", baseURL: "https://t6f.example/v1", apiKey: "k" }
    fail = true
    const before = m.calls.length
    await assert.rejects(() => getProviderModels(pf), /boom/)
    await assert.rejects(() => getProviderModels(pf), /boom/)
    assert.equal(m.calls.length - before, 2, "失败不缓存——下次配置动作重试")
    // M9 准入探 fresh：同渠道 TTL 内也真发一次请求（换 key 不得被旧 key 的缓存短路）
    fail = false
    const fresh0 = m.calls.length
    const ok1 = await probeChannelModels(p)
    assert.equal(ok1.ok, true)
    assert.equal(m.calls.length - fresh0, 1, "探针 fresh——直发请求")
    now += 10_000 // TTL 内（前一次探针刚写入缓存）
    const ok2 = await probeChannelModels(p)
    assert.equal(ok2.ok, true)
    assert.equal(m.calls.length - fresh0, 2, "TTL 内再探仍发请求（fresh 不被缓存短路）")
    // 缓存仍被写入（后续候选面读缓存——不再是网络往返）
    const cached = m.calls.length
    await getProviderModels(p)
    assert.equal(m.calls.length, cached, "探针结果入缓存——候选面直接可用")
  } finally {
    _catalogHooks.now = origNow
    m.restore()
    _clearModelCatalogCache()
  }
})
