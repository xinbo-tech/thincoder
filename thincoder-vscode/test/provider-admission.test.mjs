/**
 * provider-admission.test.mjs — MODEL-SELECTION VSC 面：清单拉取（T1–T4/T26/T27——双端本端）
 * + 渠道准入两态（T23/T24）+ 运行期零探测（T25——M9/N2）。
 *
 * 探针路径全部走**真实实现**（W10 已迁核——`thincoder-core/provider/list-models.mjs` 三 format 分派 → `thincoder-core/proxy.mjs` →
 * globalThis.fetch——测试经 fetch 替身拦截，不碰网络）。config 沙箱经 _setConfigPathForTest。
 */
import { test, before, after, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, resolveProviders } from "@thincoder/core/config-io.mjs"
import { providerFromConfig } from "../src/extension/presets.mjs"
import { listModels, channelUnavailableMessage, probeChannelModels, admissionOf, _resetAdmissionForTest } from "@thincoder/core/provider/list-models.mjs"
import { probeProviderAdmission } from "../src/extension/provider-flows.mjs"
import { providerStatus, fullStatus, saveProviderKey, endProbeWindow, _resetProbeWindowsForTest, _setProbeRetryDelayForTest } from "../src/extension/settings.mjs"
import { startSampler, stopSampler, hostBusy, _setLoopSamplerForTest } from "../src/extension/loop-sampler.mjs"
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

afterEach(() => {
  _resetAdmissionForTest()
  // F-W19：探针窗 / 重试链 / 忙态采样器跨用例隔离——挂起重试链必须在 fetch 替身撤下前终止
  // （否则 fire-and-forget 链会带着真网去打真接口）。
  _resetProbeWindowsForTest()
  _setProbeRetryDelayForTest(null)
  stopSampler()
  _setLoopSamplerForTest(null)
})

// 伪时钟（F-W19 忙态用例——判定面零真实等待）+ 轮询等待（重试链 fire-and-forget 收敛）
const clock = { t: 1_000_000_000 }
const setClock = () => _setLoopSamplerForTest({ nowFn: () => clock.t })
async function until(fn, ms = 1500) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (fn()) return true; await new Promise((r) => setTimeout(r, 20)) }
  return fn()
}

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** 捕获式桩面板（models / providerStatus 载荷断言面）。 */
function stubPanel() {
  const posted = []
  return { panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } }, posted }
}
const wsStub = () => ({ get: () => undefined, update: async () => {} })
const kimiCalls = (calls) => calls.filter((u) => u.includes("moonshot")).length
const dsCalls = (calls) => calls.filter((u) => u.includes("deepseek")).length
const modelsPayloads = (posted) => posted.filter((m) => m.type === "models")
/** 按真 payload 渲染面板卡（词档双向机检用——非手写 SS 载荷）。 */
function renderWith(statusPayload, name = "kimi") {
  const { providersCardHtml, SS } = webviewMods
  SS.providerStatus = {
    labels: { [name]: "Kimi (Moonshot)" },
    presets: [],
    providers: { [name]: statusPayload.providers[name] },
  }
  return providersCardHtml()
}

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

// ─── F-W19（`SETTINGS.md` §2.12）：失败分类落账 + 宿主忙分档 + 有界重试（≤ 2）──────────

test("T-W19a 失败分类落账（malformed/timeout/hostBusy + ts）+ 双向词档（词 ⇔ 落账单源）", async () => {
  // ① malformed：HTTP 非 2xx（非超时族）
  await withFetch(() => jsonResponse({ error: "down" }, 500), async () => {
    await probeProviderAdmission("kimi")
  })
  let rec = admissionOf("kimi")
  assert.equal(rec.ok, false)
  assert.equal(rec.failure, "malformed", "HTTP 500 ⇒ 核分类 malformed")
  assert.ok(Number.isFinite(rec.ts), "落账统一盖 ts")
  assert.equal(providerStatus().providers.kimi.failure, "malformed", "失败分类随行下发")
  assert.equal(providerStatus().providers.kimi.unavailableReason, unavailableText(500), "失败消息本体逐字零改")
  let html = renderWith(providerStatus())
  assert.ok(html.includes("不可用"), "渠道故障 ⇒ 词 `不可用`")
  assert.ok(!html.includes("宿主繁忙"), "渠道故障不得显 `宿主繁忙`（分档互斥）")
  assert.ok(html.includes(unavailableText(500)), "渠道故障 ⇒ hint 逐字长句在场")

  // ② timeout：超时族错误 ⇒ 同档词 + hint（分类不同、词档同档）
  await withFetch(() => { throw Object.assign(new Error("fetch failed"), { name: "TimeoutError" }) }, async () => {
    await probeProviderAdmission("kimi")
  })
  rec = admissionOf("kimi")
  assert.equal(rec.failure, "timeout", "TimeoutError ⇒ 核分类 timeout")
  html = renderWith(providerStatus())
  assert.ok(html.includes("不可用") && !html.includes("宿主繁忙"), "timeout ⇒ 词 `不可用`（非宿主忙档）")
  assert.ok(html.includes(unavailableText("fetch failed")), "hint 逐字（状态 = 网络错误摘要）")

  // ③ hostBusy：端侧忙证据覆盖核落账（reason 逐字不动·非渠道故障）
  setClock()
  startSampler()
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "进入忙态（伪时钟）")
  await withFetch(() => jsonResponse({ error: "down" }, 500), async () => {
    await probeProviderAdmission("kimi")
  })
  rec = admissionOf("kimi")
  assert.equal(rec.failure, "hostBusy", "忙证据覆盖核分类（非渠道故障）")
  assert.equal(rec.reason, unavailableText(500), "reason 逐字不动")
  assert.ok(Number.isFinite(rec.ts), "覆盖落账同样盖 ts")
  html = renderWith(providerStatus())
  assert.ok(html.includes("宿主繁忙"), "宿主忙 ⇒ 词 `宿主繁忙`")
  assert.ok(!html.includes("不可用"), "宿主忙档不显 `不可用`")
  assert.ok(!html.includes(unavailableText(500)), "宿主忙 ⇒ 抑制渠道故障 hint")
  // 零 i18n 键：词硬编码于 `settings-providers.js`（`:186` 同址），不得进 i18n 双源
  const providersSrc = readFileSync(new URL("../webview/settings-providers.js", import.meta.url), "utf8")
  assert.ok(providersSrc.includes("宿主繁忙"), "词硬编码于 webview/settings-providers.js")
  for (const f of ["../webview/i18n.js", "../webview/i18n-dom.js"]) {
    assert.ok(!readFileSync(new URL(f, import.meta.url), "utf8").includes("宿主繁忙"), `零 i18n 键：${f} 不得含本词`)
  }
})

test("T-W19b 有界重试成功拍三清除：落账复位 + 载荷 available:false→true + 展示回绿", async () => {
  _setProbeRetryDelayForTest(20)
  let n = 0
  const { panel, posted } = stubPanel()
  let sessions = 0
  await withFetch((url) => (url.includes("moonshot")
    ? (n++ < 2 ? jsonResponse({ error: "down" }, 500) : jsonResponse({ data: [{ id: "kimi-k3" }] }))
    : jsonResponse({ data: [{ id: "deepseek-v4-pro" }] })), async (calls) => {
    await fullStatus(panel, wsStub(), () => { sessions += 1 })
    const first = modelsPayloads(posted).at(-1)
    assert.equal(first.unavailable?.[0]?.provider, "kimi", "首拍失败 ⇒ 失败渠道随载荷明示原因")
    assert.equal(admissionOf("kimi").ok, false, "首拍落账 = 失败")
    assert.equal(await until(() => admissionOf("kimi")?.ok === true), true, "重试链收敛（成功拍）")
    assert.equal(kimiCalls(calls), 3, "首拍 1 + 重试 ≤ 2（成功即止）")
    assert.equal(dsCalls(calls), 1, "重试只打失败子集（健康渠道零重探）")
    assert.ok(sessions >= 2, "成功拍走同一 flush（会话推链重入——准入翻转随载荷生效）")
  })
  // ① 落账清除：`recordAdmission(name, { ok: true, ts })`——失败分类键退场
  const rec = admissionOf("kimi")
  assert.equal(rec.ok, true)
  assert.equal("failure" in rec, false, "成功落账不带 failure")
  assert.ok(Number.isFinite(rec.ts), "成功落账盖 ts")
  // ② 载荷翻转 + ③ 展示回绿
  const row = providerStatus().providers.kimi
  assert.equal(row.available, true, "载荷 available: false → true")
  assert.equal("failure" in row, false)
  const last = modelsPayloads(posted).at(-1)
  assert.ok(last.models.some((m) => m.provider === "kimi" && m.id === "kimi-k3"), "重试成功 ⇒ 候选面收敛")
  assert.equal(last.unavailable, undefined, "成功拍载荷无失败项")
  const html = renderWith(providerStatus())
  assert.ok(!html.includes("不可用") && !html.includes("宿主繁忙"), "展示回绿（无失败词）")
  assert.ok(!html.includes(unavailableText(500)), "hint 退场")
})

test("T-W19c 重试耗尽：恒失败 ⇒ 重试恰 2 次（共 3 次探测）后停（不无限重试）", async () => {
  _setProbeRetryDelayForTest(20)
  const { panel } = stubPanel()
  await withFetch((url) => (url.includes("moonshot")
    ? jsonResponse({ error: "down" }, 500)
    : jsonResponse({ data: [{ id: "deepseek-v4-pro" }] })), async (calls) => {
    await fullStatus(panel, wsStub(), () => {})
    assert.equal(await until(() => kimiCalls(calls) >= 3), true, "重试链推进到上限")
    await sleep(200)
    assert.equal(kimiCalls(calls), 3, "首拍 1 + 重试 2 = 3（≤ 2 上限——无第 4 次）")
    assert.equal(dsCalls(calls), 1, "失败子集外零重探")
    assert.equal(admissionOf("kimi").failure, "malformed", "窗口内不再重试 ⇒ 保持失败分类")
    assert.equal(admissionOf("deepseek").ok, true, "健康渠道不受重试链影响")
  })
})

test("T-W19d 宿主忙闸：忙证据下失败渠道不重试（零加压）+ 落账分类 = hostBusy", async () => {
  _setProbeRetryDelayForTest(20)
  setClock()
  startSampler()
  clock.t += 5000
  assert.equal(await until(() => hostBusy()), true, "进入忙态")
  const { panel } = stubPanel()
  await withFetch(() => jsonResponse({ error: "down" }, 500), async (calls) => {
    await fullStatus(panel, wsStub(), () => {})
    await sleep(200) // 两轮让位窗口（deferred 上限）远小于本等待
    assert.equal(kimiCalls(calls), 1, "忙 ⇒ 让位不探（不在忙循环上加压——零重试）")
    assert.equal(admissionOf("kimi").failure, "hostBusy", "探针失败分类 = hostBusy（宿主忙证据）")
  })
})

test("T-W19e 在飞去重：同窗并发打开拍共享同批探测（不叠发）", async () => {
  const { panel } = stubPanel()
  await withFetch(() => new Promise((r) => setTimeout(() => r(jsonResponse({ data: [{ id: "kimi-k3" }] })), 60)), async (calls) => {
    const pA = fullStatus(panel, wsStub(), () => {})
    const pB = fullStatus(panel, wsStub(), () => {})
    await Promise.all([pA, pB])
    assert.equal(calls.length, 2, "同窗并发 ⇒ 两渠道各一批（4 次 = 叠发）")
    assert.equal(kimiCalls(calls), 1, "同批不叠发探针")
  })
})

test("T-W19f 窗口终止（§2.12 ③）：面板关闭 ⇒ 重试链止（撤未发重试 + 在途结果不再回投）", async () => {
  _setProbeRetryDelayForTest(20)
  const { panel, posted } = stubPanel()
  await withFetch((url) => (url.includes("moonshot")
    ? jsonResponse({ error: "down" }, 500)
    : jsonResponse({ data: [{ id: "deepseek-v4-pro" }] })), async (calls) => {
    await fullStatus(panel, wsStub(), () => {})
    assert.equal(kimiCalls(calls), 1, "首拍探测已发（失败 ⇒ 重试链待发）")
    endProbeWindow(panel) // 面板关闭 / 重开 = 新窗口（③）
    await sleep(250) // 远长于重试延迟（20ms）——窗口终止后链不得再探
    assert.equal(kimiCalls(calls), 1, "窗口终止 ⇒ 撤未发重试（不再发探针）")
    assert.equal(modelsPayloads(posted).length, 1, "在途 / 后续结果不再回投（零新 models 载荷）")
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
