/**
 * provider-admission.test.mjs — MODEL-SELECTION VSC 面：清单拉取（T1–T4/T26/T27——双端本端）
 * + 渠道准入两态（T23/T24）+ 运行期零探测（T25——M9/N2）。
 *
 * 探针路径全部走**真实实现**（provider/list-models.mjs 三 format 分派 → proxy.mjs →
 * globalThis.fetch——测试经 fetch 替身拦截，不碰网络）。config 沙箱经 _setConfigPathForTest。
 */
import { test, before, after, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, providerFromConfig, resolveProviders } from "../src/config-io.mjs"
import { listModels, channelUnavailableMessage, probeChannelModels, admissionOf, _resetAdmissionForTest } from "../src/provider/list-models.mjs"
import { probeProviderAdmission } from "../src/extension/provider-flows.mjs"
import { providerStatus, fullStatus, saveProviderKey } from "../src/extension/settings.mjs"
import { saveAgentSettingsFromPanel } from "../src/extension/settings-panel-write.mjs"

const UNAVAILABLE_TEXT = "该渠道不提供模型列表（GET /models {S}）——无法选择模型，请改用其他渠道"
const unavailableText = (status) => UNAVAILABLE_TEXT.replace("{S}", status)

let dir
let cfgPath
let wv
let webviewMods

const fixture = () => ({
  defaultModel: "kimi:kimi-k3",
  providers: [
    { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "k2" },
    { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
  ],
})

before(async () => {
  dir = mkdtempSync(join(tmpdir(), "tc-admit-"))
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify(fixture(), null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  // happy-dom 环境 + webview 模块预载（模块加载耗时不计入用例——slow 门阈值 800ms）
  const { setupWebview } = await import("./helpers/webview-env.mjs")
  wv = setupWebview()
  webviewMods = {
    providersCardHtml: (await import("../webview/settings-providers.js")).providersCardHtml,
    SS: (await import("../webview/settings-state.js")).SS,
  }
  // 面板消息路由预载（T23b 用——import 链重，预载避免计入用例耗时）
  await import("../src/extension/panel-messages.mjs")
})

after(() => {
  wv?.cleanup()
  _setConfigPathForTest(null)
  _resetAdmissionForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

afterEach(() => { _resetAdmissionForTest() })

// ─── fetch 替身（proxyFetch 无代理 → globalThis.fetch——单测唯一网络面）────────────

function jsonResponse(obj, status = 200) {
  // 响应替身用**纯对象**（happy-dom 注册后 Response 全局为其实现——避免断言面随环境漂移）
  const text = JSON.stringify(obj)
  return { ok: status >= 200 && status < 400, status, text: async () => text }
}

/** 安装 fetch 替身：handler(url, opts) 返回 Response / 抛错。calls/reqs 供断言。 */
async function withFetch(handler, fn) {
  const orig = globalThis.fetch
  const calls = []
  const reqs = []
  globalThis.fetch = async (url, opts) => {
    calls.push(String(url))
    reqs.push({ url: String(url), ...opts })
    return handler(String(url), opts)
  }
  try {
    return await fn(calls, reqs)
  } finally {
    globalThis.fetch = orig
  }
}

const settle = () => new Promise((r) => setTimeout(r, 25))

// ─── T1–T4 + T26/T27：三 format 分派 / 解析 / 翻页（AC-1）──────────────────────

test("T1 openai（缺省 format）：GET {baseURL}/models + Bearer → data[].id（排序）", async () => {
  await withFetch(() => jsonResponse({ data: [{ id: "b" }, { id: "a" }] }), async (calls, reqs) => {
    const ids = await listModels({ baseURL: "https://api.openai.com/v1", apiKey: "sk-1" })
    assert.deepEqual(ids, ["a", "b"])
    assert.equal(calls[0], "https://api.openai.com/v1/models")
    assert.equal(reqs[0].headers.Authorization, "Bearer sk-1")
  })
})

test("T2 anthropic：完整 URL …/v1/models?limit=1000 + x-api-key/anthropic-version 头", async () => {
  await withFetch(() => jsonResponse({ data: [{ id: "claude-x" }], has_more: false }), async (calls, reqs) => {
    const ids = await listModels({ baseURL: "https://api.anthropic.com/v1", apiKey: "sk-ant", format: "anthropic" })
    assert.deepEqual(ids, ["claude-x"])
    assert.equal(calls[0], "https://api.anthropic.com/v1/models?limit=1000")
    assert.equal(reqs[0].headers["x-api-key"], "sk-ant")
    assert.equal(reqs[0].headers["anthropic-version"], "2023-06-01")
  })
})

test("T3 google：完整 URL …/v1beta/models?key=…&pageSize=1000 + models[].name 剥前缀", async () => {
  await withFetch(() => jsonResponse({ models: [{ name: "models/gemini-2.5-flash" }] }), async (calls) => {
    const ids = await listModels({ baseURL: "https://generativelanguage.googleapis.com/v1beta", apiKey: "g-key", format: "google" })
    assert.deepEqual(ids, ["gemini-2.5-flash"])
    assert.equal(calls[0], "https://generativelanguage.googleapis.com/v1beta/models?key=g-key&pageSize=1000")
  })
})

test("T4 google 边界：无前缀名保留 / 缺字段项跳过", async () => {
  await withFetch(() => jsonResponse({ models: [{ name: "gemini-x" }, {}] }), async () => {
    const ids = await listModels({ baseURL: "https://g.example/v1beta", apiKey: "k", format: "google" })
    assert.deepEqual(ids, ["gemini-x"])
  })
})

test("T26 anthropic 翻页：has_more → after_id 跟随（两页合并）；上限 10 页截停防死循环", async () => {
  let page = 0
  await withFetch((url) => {
    if (page++ === 0) return jsonResponse({ data: [{ id: "m1" }], has_more: true, last_id: "m1" })
    return jsonResponse({ data: [{ id: "m2" }], has_more: false })
  }, async (calls) => {
    const ids = await listModels({ baseURL: "https://api.anthropic.com/v1", apiKey: "k", format: "anthropic" })
    assert.deepEqual(ids, ["m1", "m2"])
    assert.equal(calls.length, 2, "请求次数 = 2")
    assert.ok(calls[1].includes("after_id=m1"), "第二页带 after_id 游标")
  })
  // 恒 has_more：10 页上限截停（防死循环）
  let n = 0
  await withFetch(() => jsonResponse({ data: [{ id: `m${n++}` }], has_more: true, last_id: `m${n}` }), async (calls) => {
    const ids = await listModels({ baseURL: "https://api.anthropic.com/v1", apiKey: "k", format: "anthropic" })
    assert.equal(calls.length, 10, "上限 10 页")
    assert.ok(ids.length >= 10)
  })
})

test("T27 google 翻页：nextPageToken → pageToken 透传（两页合并）；上限 10 页截停", async () => {
  let page = 0
  await withFetch((url) => {
    if (page++ === 0) return jsonResponse({ models: [{ name: "models/g1" }], nextPageToken: "tok-1" })
    return jsonResponse({ models: [{ name: "models/g2" }] })
  }, async (calls) => {
    const ids = await listModels({ baseURL: "https://g.example/v1beta", apiKey: "k", format: "google" })
    assert.deepEqual(ids, ["g1", "g2"])
    assert.equal(calls.length, 2)
    assert.ok(calls[1].includes("pageToken=tok-1"), "pageToken 透传")
  })
  let n = 0
  await withFetch(() => jsonResponse({ models: [{ name: `models/g${n++}` }], nextPageToken: `t${n}` }), async (calls) => {
    await listModels({ baseURL: "https://g.example/v1beta", apiKey: "k", format: "google" })
    assert.equal(calls.length, 10, "上限 10 页")
  })
})

test("拉取失败：HTTP 非 2xx 抛出（带 status——M8 消息本体可回显状态）", async () => {
  await withFetch(() => jsonResponse({ error: "unauthorized" }, 401), async () => {
    await assert.rejects(
      () => listModels({ baseURL: "https://api.moonshot.cn/v1", apiKey: "bad" }),
      (e) => {
        assert.equal(e.status, 401, "错误带 HTTP status")
        assert.equal(channelUnavailableMessage(e), unavailableText(401), "M8 逐字长句（状态回显）")
        return true
      })
  })
})

// ─── T23/T24：配置阶段准入两态（M9）────────────────────────────────────────

test("T23 探通：加渠道/设 key 路径探一次 /models → 渠道可用 + 候选直接可用", async () => {
  await withFetch(() => jsonResponse({ data: [{ id: "kimi-k3" }, { id: "kimi-k2" }] }), async (calls) => {
    const r = await probeProviderAdmission("kimi")
    assert.equal(r.ok, true, "探通")
    assert.deepEqual(r.models, ["kimi-k2", "kimi-k3"], "探得候选直接可用")
    assert.equal(calls.length, 1, "配置阶段恰一次探测")
    const row = providerStatus().providers.kimi
    assert.notEqual(row.available, false, "探通 → 不标不可用")
    assert.equal("unavailableReason" in row, false)
    assert.equal(row.model, "kimi-k3", "status payload 单值默认模型")
  })
})

test("T23b 自定义渠道探针：testProvider 消息透传 format（anthropic 端点/头——M1 分派接线）", async () => {
  const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
  const posted = []
  const panel = { _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } } }
  await withFetch(() => jsonResponse({ data: [{ id: "claude-x" }], has_more: false }), async (calls, reqs) => {
    await handlePanelMessage(panel, { type: "testProvider", baseURL: "https://api.anthropic.com/v1", apiKey: "sk-1", format: "anthropic" })
    assert.equal(calls[0], "https://api.anthropic.com/v1/models?limit=1000", "anthropic 端点（非 openai 形状）")
    assert.equal(reqs[0].headers["x-api-key"], "sk-1")
  })
  const result = posted.find((m) => m.type === "testProviderResult")
  assert.equal(result.ok, true)
  assert.deepEqual(result.models, ["claude-x"], "表单下拉得到候选")
})

test("T24 探不通：失败消息逐字长句 + 标不可用 + 条目仍保存（不阻断写）+ 不入候选来源", async () => {
  // 设 key 的配置写入面（面板真实路径）：探测失败不阻断保存
  await withFetch(() => jsonResponse({ error: "nope" }, 403), async (calls) => {
    await saveProviderKey("kimi", "k2-new")
    assert.equal(calls.length, 1, "设 key → 探一次 /models")
  })
  const row = providerStatus().providers.kimi
  assert.equal(row.available, false, "探不通 → 行标不可用（webview 行内标 `不可用`）")
  assert.equal(row.unavailableReason, unavailableText(403), "失败消息本体逐字长句")
  assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).providers[0].apiKey, "k2-new", "渠道条目仍可保存（不阻断写）")
  // 不入默认模型可选来源 + 无 fallback 候选（fullStatus 拉取失败 = 该渠道不可选）
  const posted = []
  const panel = { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } }
  await withFetch((url) => url.includes("moonshot")
    ? jsonResponse({ error: "nope" }, 403)
    : jsonResponse({ data: [{ id: "deepseek-v4-pro" }] }), async () => {
    await fullStatus(panel, { get: () => undefined, update: async () => {} }, () => {})
  })
  const modelsMsg = posted.find((m) => m.type === "models")
  assert.ok(modelsMsg, "models 载荷已推")
  assert.equal(modelsMsg.models.some((m) => m.provider === "kimi"), false, "失败渠道无任何候选行（无 fallback）")
  assert.equal(modelsMsg.unavailable[0].provider, "kimi")
  assert.equal(modelsMsg.unavailable[0].reason, unavailableText(403), "明示原因随载荷下发")
  assert.deepEqual(modelsMsg.models.map((m) => m.id), ["deepseek-v4-pro"], "可用渠道候选 = 拉取结果")
})

test("T24b 设默认模型的配置写入面：写后探一次 /models（探不通标不可用——不阻断写）", async () => {
  await withFetch(() => jsonResponse({ error: "down" }, 500), async (calls) => {
    saveAgentSettingsFromPanel({ defaultModel: "kimi:kimi-k3" })
    await settle()
    assert.equal(calls.length, 1, "defaultModel 写 → 后置探针恰一次")
  })
  assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).defaultModel, "kimi:kimi-k3", "写已发生（不阻断）")
  assert.equal(admissionOf("kimi").ok, false)
  assert.equal(providerStatus().providers.kimi.unavailableReason, unavailableText(500))
})

test("T24c 探针幂等/失败不缓存：探通后清除不可用展示态（下次配置动作重探）", async () => {
  await withFetch(() => jsonResponse({ error: "down" }, 500), async () => {
    await probeChannelModels("kimi", { baseURL: "https://api.moonshot.cn/v1", apiKey: "k2" })
  })
  assert.equal(admissionOf("kimi").ok, false)
  await withFetch(() => jsonResponse({ data: [{ id: "kimi-k3" }] }), async () => {
    const r = await probeChannelModels("kimi", { baseURL: "https://api.moonshot.cn/v1", apiKey: "k2" })
    assert.equal(r.ok, true)
  })
  assert.equal(admissionOf("kimi").ok, true, "重探成功 → 展示态复位")
  assert.notEqual(providerStatus().providers.kimi.available, false)
})

// ─── T25：运行期零探测（M9 边界 / N2）──────────────────────────────────────

test("T25 运行期零探测：非配置流（解析/快照/构建 provider）不发任何 /models 请求", async () => {
  await withFetch(() => jsonResponse({ data: [] }), async (calls) => {
    const { providers, activeProvider } = resolveProviders()
    assert.ok(providers.length >= 1 && activeProvider)
    providerFromConfig("kimi")
    providerStatus()
    assert.deepEqual(calls, [], "零启动期网络依赖——探测只发生在配置写入面")
  })
})

// ─── 面板渲染（M9 UI 标注——happy-dom 面）────────────────────────────────────

test("面板行渲染：不可用渠道标 `不可用` + 失败消息明示；无默认模型显 `(no default model)`", () => {
  const { providersCardHtml, SS } = webviewMods
  SS.providerStatus = {
    labels: { kimi: "Kimi (Moonshot)" },
    presets: [{ name: "openai", desc: "OpenAI", model: "gpt-4o", baseURL: "https://api.openai.com/v1" }],
    providers: {
      kimi: { configured: true, masked: "****", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", available: false, unavailableReason: unavailableText(403) },
      custom: { configured: true, masked: "****", baseURL: "https://x", model: "" },
    },
  }
  const html = providersCardHtml()
  assert.ok(html.includes("不可用"), "行内标 `不可用`")
  assert.ok(html.includes(unavailableText(403)), "失败消息本体明示")
  assert.ok(html.includes("kimi-k3"), "渠道行显单值默认模型")
  assert.ok(html.includes("(no default model)"), "无默认模型显示（替代原 (no candidates)）")
  assert.ok(html.includes("(gpt-4o)"), "预设行显单值 model")
})
