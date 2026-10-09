/**
 * 2026-10-09-provider-default-model-purge-vsc.test.mjs — 批内件（provider-default-model-purge · 舱4 = VSC 面）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-09-provider-default-model-purge-vsc.test.mjs
 *
 * 腿（批档 §2.1 A5 + 本舱收货口径 + 父侧域扩展）：
 *   T1 键选矩阵：三态（invalid 类 ∥ fallback ∥ ok）× 载荷 `model` 在场/缺——桩驱 `showBanner`
 *      （data-banner-key 同步 = 机检点；fallback 动作钮在场性 + 出口）
 *   T2 两字面逐字（zh/en 两表值 == 设计字面 · `docs/vsc/design/WEBVIEW.md` §4.8 :202-203——2026-10-09 清除批）：
 *      en 零 CJK ∥ zh/en 占位符一致
 *   T3 负控：`model` 在场 ⇒ 旧字面（非未定变体）；缺 ⇒ 未定变体（不得只改一味）
 *   T4 两表键集相等 ↔ 引用闭合：zh/en 键集全等；`webview/ui.js` 引用的 `banner.*` 键集 == 两表该族键集
 *   T5 i18n 晚到兜底：t() 未注入 ⇒ 键名态 + data-banner-key 在场；注入后 `applyI18nToDOM` 刷成字面
 *   T6 VSC 自定形添加链（C4「不携模型」）：弹窗零 model 件 ∥ 载荷零 model ∥ 守卫只剩 baseURL
 *      ∥ 预设 detail = baseURL ∥「拉取」钮 = 渠道校验（探通状态行，不喂候选）
 *   T7 显示面：渠道行副行 = baseURL（零「无默认模型」词族）∥ 预设下拉无模型尾缀（负控：载荷带旧字段也不渲）
 *   T8 源面闭合：provider-flows 薄壳零 `.model` ∥ 死键（noDefaultModel ∥ modelRequired）两表净删
 *      ∥ 拉取钮词留存
 * 桩 ∕ 假 DOM 先例 = `2026-09-29-vsc-carryover-settings.test.mjs`（射程 = showBanner/弹窗/显示面树面）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const src = (rel) => readFileSync(join(ROOT, rel), "utf8")

// ─── 设计字面（逐字 = `WEBVIEW.md` §4.8 :202-203——产品拷贝本体，非文档引用） ──────────────
const OLD_ZH = "⚠ 默认模型未设置或无效 — 正在使用可用渠道"
const OLD_EN = "⚠ Default model missing or invalid — using an available channel"
const NEW_ZH = "⚠ 默认模型未设置 — 渠道已就绪、模型未定"
const NEW_EN = "⚠ Default model missing — channel ready, model not chosen"

const zh = JSON.parse(src("thincoder-vscode/locales/zh.json"))
const en = JSON.parse(src("thincoder-vscode/locales/en.json"))

// ─── mini 假 DOM（射程 = showBanner 树面 + i18n-dom 兜底查询面 + 添加弹窗/显示面树面） ──────
class FNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase()
    this.id = ""; this.parent = null; this.children = []
    this.dataset = {}; this.textContent = ""; this.className = ""; this.type = ""
    this.value = ""; this.checked = false; this.disabled = false; this.placeholder = ""
    this.style = {}; this.attrs = {}
    this.listeners = []; this._html = ""
  }
  get firstChild() { return this.children[0] ?? null }
  get options() { return this.children.filter((c) => c.tagName === "OPTION") }
  set innerHTML(v) { this._html = String(v); for (const c of this.children) c.parent = null; this.children = [] }
  get innerHTML() { return this._html }
  appendChild(n) {
    if (typeof n === "string") n = { tagName: "#text", textContent: n, id: "", dataset: {}, children: [], parent: null }
    n.parent = this; this.children.push(n)
    // 真 DOM 事实对齐：批首 option 落 select ⇒ select.value 随首项（弹窗 format/type 初值面）
    if (this.tagName === "SELECT" && n.tagName === "OPTION" && !this.value) this.value = n.value
    return n
  }
  append(...ns) { for (const n of ns) this.appendChild(n) }
  insertBefore(n, ref) { n.parent = this; const i = this.children.indexOf(ref); if (i >= 0) this.children.splice(i, 0, n); else this.children.push(n); return n }
  remove() { const p = this.parent; if (!p) return; const i = p.children.indexOf(this); if (i >= 0) p.children.splice(i, 1); this.parent = null }
  replaceChildren(...ns) { for (const c of this.children) c.parent = null; this.children = []; for (const n of ns) this.appendChild(n) }
  addEventListener(type, fn) { this.listeners.push({ type, fn }) }
  fire(type) { for (const l of this.listeners) if (l.type === type) l.fn({ type, target: this, preventDefault() {}, stopPropagation() {} }) }
  setAttribute(k, v) { this.attrs[k] = String(v) }
  getAttribute(k) { return this.attrs[k] ?? null }
  focus() {}
  querySelector() { return null }
  querySelectorAll() { return [] }
  closest() { return null }
}

const docBody = new FNode("body")
const messagesEl = new FNode("div")
docBody.appendChild(messagesEl)
const allNodes = (root = docBody, out = []) => { for (const c of root.children) { out.push(c); allNodes(c, out) } return out }

const posted = []
const postSink = { postMessage: (m) => { posted.push(m) }, getState: () => ({}), setState: () => {} }

// state.js（onboarding 链）在建模块期直取 ctx 元素（`document.getElementById` 逐 id）⇒ 先备件
for (const id of ["messages", "subagent-activity", "input", "send-btn", "abort-btn", "model-btn",
  "reasoning-btn", "model-dropdown", "reasoning-dropdown", "session-selector", "session-title",
  "session-dropdown", "welcome-panel", "welcome-heading", "welcome-text", "welcome-provider-label",
  "welcome-provider", "welcome-key-label", "welcome-key", "welcome-save-btn", "welcome-skip-btn",
  "welcome-settings-btn", "project-btn"]) {
  const n = new FNode("div"); n.id = id; docBody.appendChild(n)
}

globalThis.document = {
  body: docBody,
  getElementById: (id) => allNodes().find((n) => n.id === id) ?? null,
  createElement: (tag) => new FNode(tag),
  createTextNode: (v) => ({ textContent: String(v) }),
  querySelector: () => null,
  querySelectorAll: (sel) => (sel === "[data-banner-key]"
    ? allNodes().filter((n) => typeof n.dataset?.bannerKey === "string" && n.dataset.bannerKey !== "")
    : []),
  addEventListener: () => {}, removeEventListener: () => {},
}
globalThis.window = { _vscode: postSink, addEventListener: () => {}, removeEventListener: () => {} }
globalThis.acquireVsCodeApi = () => postSink

// ─── 取件（同路同实例：ui.js 经 `./i18n.js` 取词——本单经同一文件注入字面） ──────────────
const wi18n = await import(vsc("webview/i18n.js"))
const { showBanner } = await import(vsc("webview/ui.js"))
const { applyI18nToDOM } = await import(vsc("webview/i18n-dom.js"))
const { SS } = await import(vsc("webview/settings-state.js"))
const { providersCardHtml } = await import(vsc("webview/settings-providers.js"))
const onboarding = await import(vsc("webview/onboarding.js"))
const pdialog = await import(vsc("webview/settings-provider-dialog.js"))
pdialog.installProviderDialogHandlers()

const ctx = { messagesEl }
let chosen = 0

/** 驱动一次 showBanner 并读回树面（复用路径 = getElementById 命中现 banner）。 */
function drive(ps) {
  showBanner(ctx, ps, () => { chosen += 1 })
  const banner = document.getElementById("provider-banner")
  assert.ok(banner, "banner 在树")
  return { banner, label: banner.children[0], btn: banner.children[1] ?? null }
}

/** 矩阵：三态 × 载荷 `model` 在场/缺（`model` 在场 = 非空串；null ∥ 空串 = 缺）。 */
const ROWS = [
  { id: "invalid·model 在场", ps: { state: "invalid", model: "deepseek-chat", invalidReason: null }, key: "banner.notConfigured", btn: false },
  { id: "invalid·model 缺", ps: { state: "invalid", model: null, invalidReason: null }, key: "banner.notConfigured", btn: false },
  { id: "invalid 类（invalidReason 非空）·model 在场", ps: { state: "ok", model: "deepseek-chat", invalidReason: "未配置任何 provider" }, key: "banner.notConfigured", btn: false },
  { id: "invalid 类（载荷 null）", ps: null, key: "banner.notConfigured", btn: false },
  { id: "fallback·model 在场", ps: { state: "fallback", model: "deepseek-chat" }, key: "banner.defaultModelFallback", btn: true },
  { id: "fallback·model 缺（null）", ps: { state: "fallback", model: null }, key: "banner.defaultModelFallbackNoModel", btn: true },
  { id: "fallback·model 缺（空串）", ps: { state: "fallback", model: "" }, key: "banner.defaultModelFallbackNoModel", btn: true },
  { id: "ok·model 在场", ps: { state: "ok", model: "deepseek-chat" }, key: "banner.configured", btn: false },
  { id: "ok·model 缺", ps: { state: "ok", model: null }, key: "banner.configured", btn: false },
]

const DESIGN_LITERAL = {
  zh: { "banner.defaultModelFallback": OLD_ZH, "banner.defaultModelFallbackNoModel": NEW_ZH },
  en: { "banner.defaultModelFallback": OLD_EN, "banner.defaultModelFallbackNoModel": NEW_EN },
}

for (const lang of ["zh", "en"]) {
  test(`T1 键选矩阵（${lang}）：三态 × \`model\` 在场/缺——键 ∥ data-banner-key ∥ 呈现字面 ∥ 动作钮`, () => {
    wi18n.setStrings(lang === "zh" ? zh : en)
    const dict = lang === "zh" ? zh : en
    for (const row of ROWS) {
      const r = drive(row.ps)
      const expectText = DESIGN_LITERAL[lang][row.key] ?? dict[row.key]
      assert.equal(r.label.dataset.bannerKey, row.key, `${row.id}：data-banner-key == 键选`)
      assert.equal(r.label.textContent, expectText, `${row.id}：呈现字面（${lang}）`)
      assert.equal(dict[row.key], expectText, `${row.id}：表内值 == 呈现字面`)
      if (row.btn) {
        assert.ok(r.btn, `${row.id}：动作钮在场`)
        assert.equal(r.btn.dataset.bannerKey, "banner.chooseDefaultModel", `${row.id}：钮 data-banner-key`)
        assert.equal(r.btn.textContent, dict["banner.chooseDefaultModel"], `${row.id}：钮字面`)
        const before = chosen
        r.btn.fire("click")
        assert.equal(chosen, before + 1, `${row.id}：钮出口 = onChoose`)
      } else {
        assert.equal(r.btn, null, `${row.id}：零动作钮`)
      }
    }
  })
}

test("T2 两字面逐字（zh/en 两表）∥ en 零 CJK ∥ 占位符一致", () => {
  assert.equal(zh["banner.defaultModelFallback"], OLD_ZH, "zh 现字面（model 在场档）")
  assert.equal(zh["banner.defaultModelFallbackNoModel"], NEW_ZH, "zh 未定变体（model 缺档）")
  assert.equal(en["banner.defaultModelFallback"], OLD_EN, "en 现字面（model 在场档）")
  assert.equal(en["banner.defaultModelFallbackNoModel"], NEW_EN, "en 未定变体（model 缺档）")
  for (const [k, v] of Object.entries(en).filter(([k]) => k.startsWith("banner."))) {
    assert.ok(!/[\u3400-\u9fff]/.test(v), `en ${k} 零 CJK`)
  }
  const vars = (s) => [...String(s).matchAll(/\$\{([^}]+)\}/g)].map((m) => m[1]).sort()
  for (const k of Object.keys(zh).filter((k) => k.startsWith("banner."))) {
    assert.deepEqual(vars(zh[k]), vars(en[k]), `${k}：占位符集 zh == en`)
  }
})

test("T3 负控：`model` 在场 ⇒ 旧字面（非未定变体）；缺 ⇒ 未定变体——两向", () => {
  for (const [lang, dict, oldLit, newLit] of [["zh", zh, OLD_ZH, NEW_ZH], ["en", en, OLD_EN, NEW_EN]]) {
    wi18n.setStrings(dict)
    const present = drive({ state: "fallback", model: "deepseek-chat" })
    assert.equal(present.label.textContent, oldLit, `${lang}：在场 ⇒ 旧字面`)
    assert.notEqual(present.label.textContent, newLit, `${lang}：在场 ⇒ 非未定变体`)
    assert.equal(present.label.dataset.bannerKey, "banner.defaultModelFallback", `${lang}：在场 ⇒ 现键`)
    const missing = drive({ state: "fallback", model: null })
    assert.equal(missing.label.textContent, newLit, `${lang}：缺 ⇒ 未定变体`)
    assert.notEqual(missing.label.textContent, oldLit, `${lang}：缺 ⇒ 非旧字面`)
    assert.equal(missing.label.dataset.bannerKey, "banner.defaultModelFallbackNoModel", `${lang}：缺 ⇒ 未定键`)
  }
})

test("T4 两表键集相等 ↔ 引用闭合（banner 族）", () => {
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort(), "zh/en 键集全等")
  // 引用面 = 代码内**带引号的键字面**（局部变量 `banner.*` 属性访问不入域——同名前缀排除）
  const refs = new Set([...src("thincoder-vscode/webview/ui.js").matchAll(/"banner\.[A-Za-z]+"/g)].map((m) => m[0].slice(1, -1)))
  for (const k of ["banner.defaultModelFallback", "banner.defaultModelFallbackNoModel", "banner.chooseDefaultModel"]) {
    assert.ok(refs.has(k), `ui.js 引用 ${k}`)
  }
  const tableKeys = new Set(Object.keys(zh).filter((k) => k.startsWith("banner.")))
  assert.deepEqual([...refs].sort(), [...tableKeys].sort(), "ui.js 引用集 == 两表 banner 族键集（闭集）")
  for (const k of refs) {
    assert.ok(k in zh && zh[k], `zh 有 ${k}`)
    assert.ok(k in en && en[k], `en 有 ${k}`)
  }
})

test("T5 i18n 晚到兜底：键名态 + data-banner-key 在场；注入后 applyI18nToDOM 刷成字面", () => {
  wi18n.setStrings({}) // i18n 消息未到的现形（t() 返回键名）
  const r = drive({ state: "fallback", model: null })
  assert.equal(r.label.dataset.bannerKey, "banner.defaultModelFallbackNoModel", "键名态 data-banner-key 即正确")
  assert.equal(r.label.textContent, "banner.defaultModelFallbackNoModel", "未注入 ⇒ 键名（兜底刷新面）")
  wi18n.setStrings(zh)
  applyI18nToDOM()
  assert.equal(r.label.textContent, NEW_ZH, "i18n 注入 ⇒ 字面刷新（zh）")
  assert.equal(r.btn.textContent, zh["banner.chooseDefaultModel"], "动作钮同拍刷新")
  wi18n.setStrings(en)
  applyI18nToDOM()
  assert.equal(r.label.textContent, NEW_EN, "en 同径刷新")
})

test("T6 VSC 自定形添加链（C4「不携模型」）：零 model 件 ∥ 载荷零 model ∥ 守卫只剩 baseURL ∥ 探针 = 渠道校验", () => {
  wi18n.setStrings(zh)
  SS.providerStatus = {
    presets: [{ name: "deepseek", desc: "DeepSeek", baseURL: "https://api.deepseek.com/v1", model: "stale-m" }],
    labels: {}, providers: {},
  }
  posted.length = 0
  window._openAddProviderDialog()
  assert.ok(document.getElementById("prov-add-dialog"), "弹窗在场")
  assert.equal(document.getElementById("pa-model"), null, "零 model 输入件")
  assert.equal(document.getElementById("pa-model-candidates"), null, "零候选 datalist")
  assert.ok(document.getElementById("pa-fetch-btn"), "「拉取」钮留存（渠道校验）")
  const presetInfo = document.getElementById("pa-preset-info")
  assert.equal(presetInfo.textContent, "https://api.deepseek.com/v1", "预设 detail = baseURL")
  assert.ok(!presetInfo.textContent.includes("stale-m"), "预设行不渲模型（负控：载荷带旧字段也不显）")
  // 自定形保存：零 model 也可存
  const type = document.getElementById("pa-type")
  type.value = "custom"
  type.fire("change")
  assert.equal(presetInfo.style.display, "none", "自定形 ⇒ 预设信息行隐")
  document.getElementById("pa-name").value = "myprov"
  document.getElementById("pa-url").value = "https://api.example.com/v1"
  document.getElementById("pa-format").value = "openai"
  document.getElementById("pa-key").value = "sk-test"
  assert.equal(window._paSave(), true, "保存受理（零 model 必填门）")
  assert.deepEqual(posted.filter((m) => m.type === "addProvider").at(-1), {
    type: "addProvider",
    custom: { name: "myprov", baseURL: "https://api.example.com/v1", format: "openai" },
    key: "sk-test",
  }, "addProvider 载荷逐字段（custom 零 model 键）")
  assert.equal(document.getElementById("prov-add-dialog"), null, "受理 ⇒ 关框")
  // 守卫只剩 baseURL（负控：url 空 ⇒ 拒 ∥ 零发）
  window._openAddProviderDialog()
  document.getElementById("pa-type").value = "custom"
  const before = posted.length
  assert.equal(window._paSave(), false, "baseURL 空 ⇒ 拒")
  assert.equal(posted.length, before, "拒径零发")
  assert.equal(document.getElementById("pa-conn-status").textContent, zh["settings.providerUrlRequired"], "拒因 = baseURL 必填（model 拒因词已退场）")
  // 探针 = 渠道校验：探通 ⇒ 状态行 ✓ ∥ 零候选面
  document.getElementById("pa-url").value = "https://api.example.com/v1"
  document.getElementById("pa-fetch-btn").fire("click")
  assert.deepEqual(posted.filter((m) => m.type === "testProvider").at(-1),
    { type: "testProvider", baseURL: "https://api.example.com/v1", apiKey: "", format: "openai" },
    "探针载荷（format 随表单）")
  pdialog.updateTestProviderResult({ ok: true, models: ["a", "b"] })
  assert.equal(document.getElementById("pa-conn-status").textContent, zh["settings.connOk"].replace("${count}", "2"), "探通 ⇒ 状态行 ✓（计数）")
  assert.equal(document.getElementById("pa-model-candidates"), null, "零候选面（不喂模型件）")
  pdialog.closeAddProviderDialog()
  assert.equal(document.getElementById("prov-add-dialog"), null, "关框幂等")
  assert.ok(posted.every((m) => m.type === "addProvider" || m.type === "testProvider"), "消息面只两型（无候选面消息）")
})

test("T7 显示面（渠道行 ∥ 预设下拉）：显示回退 = baseURL——零模型词族", () => {
  wi18n.setStrings(zh)
  SS.providerStatus = {
    providers: {
      p1: { configured: true, masked: "sk-x", baseURL: "https://api.example.com/v1", isActive: false, proxy: false, model: "stale-model" },
      p2: { configured: false, masked: "", baseURL: "", isActive: false, available: false, failure: "timeout", unavailableReason: "该渠道不提供模型列表（GET /models 500）——无法选择模型，请改用其他渠道" },
    },
    labels: { p1: "P1", p2: "P2" },
    presets: [],
  }
  SS.agentSettings = { defaultModel: null }
  const html = providersCardHtml()
  assert.ok(html.includes("https://api.example.com/v1"), "渠道行副行 = baseURL")
  assert.ok(!html.includes("stale-model"), "副行不显旧模型字段（负控）")
  assert.ok(!html.includes("（无默认模型）") && !html.includes("(no default model)"), "零「无默认模型」词族")
  assert.ok(html.includes(zh["settings.providerUnavailable"]), "不可用渠道标随行（显示面不变）")
  assert.ok(html.includes("该渠道不提供模型列表"), "失败消息本体逐字随行（hint 面不变）")
  assert.ok(!html.includes(`class="prov-model"> · `), "baseURL 缺 ⇒ 副行零前导分隔符")
  // 预设下拉（onboarding）：model 字段在场也不渲（负控）
  onboarding.showWelcomePanel({ presets: [{ name: "p1", desc: "DEEPSEEK", model: "stale-model" }] })
  const welcome = document.getElementById("welcome-provider").innerHTML
  assert.ok(welcome.includes(">DEEPSEEK</option>"), "选项 label = 描述（无模型尾缀）")
  assert.ok(!welcome.includes("stale-model"), "下拉不渲模型（负控）")
  assert.ok(!welcome.includes("undefined"), "零 undefined")
})

test("T8 源面闭合：薄壳零渠级模型面 ∥ 死键两表净删 ∥ 拉取钮词留存", () => {
  const flows = src("thincoder-vscode/src/extension/provider-flows.mjs")
  assert.ok(!/\.model\b/.test(flows), "provider-flows 薄壳零 `.model` 读（渠级模型面不在本档）")
  assert.ok(!/addProviderFlow\s*=|function addProviderFlow/.test(flows), "加流程包装净删（#1054——自定径问 model 无载体）")
  const dlg = src("thincoder-vscode/webview/settings-provider-dialog.js")
  assert.ok(!/pa-model|noDefaultModel|modelRequired/.test(dlg), "弹窗档零模型件 ∥ 零死键引用")
  assert.ok(!/s0\.model|noDefaultModel/.test(src("thincoder-vscode/webview/settings-providers.js")), "渠道行档零旧字段读")
  assert.ok(!/p\.model/.test(src("thincoder-vscode/webview/onboarding.js")), "预设下拉档零模型读")
  assert.ok(!("settings.noDefaultModel" in zh) && !("settings.noDefaultModel" in en), "「无默认模型」死键两表净删")
  assert.ok(!("settings.modelRequired" in zh) && !("settings.modelRequired" in en), "modelRequired 死键两表净删")
  assert.ok(zh["settings.fetchModels"] && en["settings.fetchModels"], "「拉取」钮词留存（渠道校验）")
})
