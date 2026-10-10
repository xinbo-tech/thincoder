/**
 * b10-w2.test.mjs — parity-b10-ui 批 · W2 设置面功能补（S1–S7 ∕ S12）批内件。
 * 覆盖 = §2.6 逐行「判据」列 + §2.12 用例表（T2 ∕ T3 ∕ T4 ∕ T5 ∕ T6）+ S4 ∕ S7 ∕ S12 三行判据。
 * 跑法：`node --test .thincoder/tmp/b10-w2.test.mjs`（cwd 任意；本件自锚仓根）——W6 汇总并入
 * `docs/batches/2026-09-29-parity-b10-ui.test.mjs`（本件 = 暂存件，勿直接写批内目录）。
 * 判据面 = 批档 `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 S1–S7 ∕ S12 各行 + §2.7 通道面（白名单 ∕ 注册表两向相等）。
 * 零第三方依赖（仅 node: 内建）；盘面用临时 config（`_setConfigPathForTest`）；探针经核测试缝注入（零真网络，
 * 仅 S2 死端口一支走真探 —— 本机回环拒绝即返）。
 * **2026-10-09 清除批随正（fix 轮）**：① 本批面——`draft` ∥ 行面 ∥ 表单树 ∥ S7 去 `model`（渠道单值模型退场：
 *   行 model 段 ∥ 候选 `datalist` ∥ model 输入件 ∥ 预设 `(model)` 后缀全退场）；② 跨批点修——通道计数锁 45⇒48⇒51
 *   （后续三增 `record:append` ∥ `theme:state` ∥ `panel:state`）· 拉取钮断言改查表单件所在树面（`settingsModalTree`
 *   添加弹窗体——两形常显表单退场批）· 钥输入假 DOM 面随「宿主无关读」补 `querySelectorAll` 面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于渲染档取件）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..") // 仓根
const at = (p) => pathToFileURL(join(ROOT, p)).href
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const deskReq = createRequire(join(ROOT, "thincoder-desktop/package.json"))
const coreAt = (p) => pathToFileURL(deskReq.resolve("@thincoder/core/" + p)).href
/** 确定性等待（轮询到落定 —— 零单跳宏任务假设）：fire-and-forget 链（动态 import + 探针）落定。 */
const settle = async (cond, tries = 200) => { for (let i = 0; i < tries && !cond(); i += 1) await new Promise((r) => setTimeout(r, 0)) }

const coreIo = await import(coreAt("config-io.mjs"))
const coreProbe = await import(coreAt("provider/list-models.mjs"))
const coreSettings = await import(coreAt("agent-tools/settings.mjs"))
const providers = await import(at("thincoder-desktop/src/main/providers.mjs"))
const settingsMain = await import(at("thincoder-desktop/src/main/settings.mjs"))
const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
const sections = await import(at("thincoder-desktop/renderer/views/settings-sections.mjs"))
const controls = await import(at("thincoder-desktop/renderer/views/settings-controls.mjs"))
const toolsView = await import(at("thincoder-desktop/renderer/views/settings-sections-tools.mjs"))
const confirm = await import(at("thincoder-desktop/renderer/settings-confirm.mjs"))

/** 临时 config 夹具（调用面自管 `_setConfigPathForTest` 复位）。 */
function withConfig(seed) {
  const dir = mkdtempSync(join(tmpdir(), "b10-w2-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed))
  coreIo._setConfigPathForTest(cfg)
  return cfg
}
const diskOf = (cfg) => JSON.parse(readFileSync(cfg, "utf8"))
/** 探针桩（核测试缝 —— 同一模块实例：本件与 `providers.mjs` 走同一 deskReq 解析路径）。 */
const stubProbe = (impl) => coreProbe._setProbeImplForTest(impl)
const restoreProbe = () => { coreProbe._setProbeImplForTest(null); coreProbe._resetAdmissionForTest() }

// ─── T2 · S1：渠道密钥设 ∕ 改 ∕ 删（盘值对 + 行面遮罩回读）────────────────────

test("S1 ∕ T2：改钥 ⇒ 盘新值 ∧ 行回新遮罩；删钥 ⇒ 盘键删 ∧ hasKey:false ∧ maskedKey:null", async () => {
  const cfg = withConfig({ providers: [{ name: "p1", baseURL: "https://p.example/v1", apiKey: "old-key" }] })
  stubProbe(async () => ({ ok: true, models: [] }))
  try {
    assert.equal(providers.providerList().providers[0].hasKey, true)
    assert.deepEqual(providers.providerSetKey({ name: "p1", key: "new-key-123" }), { ok: true, reason: null })
    assert.equal(diskOf(cfg).providers[0].apiKey, "new-key-123", "盘 apiKey = 新值（经核唯一写盘执行体）")
    const set = providers.providerList().providers[0]
    assert.equal(set.maskedKey, coreSettings.MASKED, "行回新遮罩（核字面单源）")
    assert.equal(set.hasKey, true)
    assert.deepEqual(providers.providerDelKey({ name: "p1" }), { ok: true, reason: null })
    assert.equal("apiKey" in diskOf(cfg).providers[0], false, "盘键删（条目保留）")
    const del = providers.providerList().providers[0]
    assert.equal(del.hasKey, false)
    assert.equal(del.maskedKey, null)
    // 形判 ∕ 不可用两拒（零写）
    assert.equal(providers.providerSetKey({ name: "p1", key: "  " }).reason, "invalid-shape")
    assert.equal(providers.providerSetKey({ name: "nope", key: "k" }).reason, "unavailable")
    assert.equal(providers.providerDelKey({ name: "nope" }).reason, "unavailable")
    assert.equal(diskOf(cfg).providers.length, 1, "拒径零写")
  } finally { coreIo._resetConfigPathForTest(); restoreProbe() }
})

// ─── T3 · S2：拉取模型（探通 ∕ 探不通 ∕ 保存零阻断 ∕ 探针零写盘）──────────────

test("S2 ∕ T3：provider:models —— 探通回模型集 ∕ 探不通回失败句；保存径零阻断；探针不写盘 ∕ 不落账", async () => {
  const cfg = withConfig({ providers: [{ name: "p1", baseURL: "https://p.example/v1", apiKey: "k" }] })
  const before = readFileSync(cfg, "utf8")
  try {
    // ① 探通（暂存值直探）
    stubProbe(async (name, target) => {
      assert.equal(name, "", "名传空串 ⇒ 不落账（暂存渠未入配置）")
      assert.equal(target.baseURL, "https://x.example/v1")
      return { ok: true, models: ["m1", "m2"] }
    })
    assert.deepEqual(await providers.providerModels({ baseURL: "https://x.example/v1/", apiKey: " k ", format: "openai" }), { ok: true, models: ["m1", "m2"] })
    // ② 探不通（注入失败句）
    stubProbe(async () => ({ ok: false, error: "probe down" }))
    assert.deepEqual(await providers.providerModels({ baseURL: "https://x.example/v1" }), { ok: false, models: [], reason: "probe down" })
    // ③ 空 baseURL ⇒ invalid-shape（零发送面另有渲染侧前置词）
    assert.equal((await providers.providerModels({ baseURL: "   " })).reason, "invalid-shape")
    // ④ 探针零写盘 ∧ 零落账
    assert.equal(readFileSync(cfg, "utf8"), before, "探针不落盘（表字节不变）")
    assert.equal(coreProbe.admissionOf("x"), null, "暂存探不落账（行面读数不受污染）")
    // ⑤ 探不通**不阻断保存**（保存径照走）
    stubProbe(async () => ({ ok: false, error: "probe down" }))
    assert.equal(providers.providerSave({ name: "p2", shape: "custom", baseURL: "https://y.example/v1", model: "m" }).ok, true)
    // ⑥ 死端口真探（本机回环拒绝即返）：核失败句直传 + 零写盘
    stubProbe(null)
    const dead = await providers.providerModels({ baseURL: "http://127.0.0.1:1/v1" })
    assert.equal(dead.ok, false)
    assert.equal(typeof dead.reason, "string")
    assert.ok(dead.reason.length > 0)
    assert.equal(coreProbe.admissionOf("x"), null, "真探亦不落账（空名早退）")
  } finally { coreIo._resetConfigPathForTest(); restoreProbe() }
})

// ─── T4 · S3：三写径各触发探针恰一次 + 行面两态（读账优先）────────────────────

test("S3 ∕ T4：加渠道 ∕ 改钥 ∕ defaultModel 写各触发探针恰一次（写回执零阻断）；行面读账两态", async () => {
  const cfg = withConfig({ providers: [] })
  const seen = []
  stubProbe(async (name) => { seen.push(name); return { ok: true, models: [] } })
  try {
    // ① 加渠道（`provider:save`）
    assert.equal(providers.providerSave({ name: "openai", shape: "preset", key: "k1" }).ok, true)
    await settle(() => seen.length >= 1)
    assert.deepEqual(seen, ["openai"], "加渠道 ⇒ 恰一次")
    // ② 改钥（`provider:setKey`）
    assert.equal(providers.providerSetKey({ name: "openai", key: "k2" }).ok, true)
    await settle(() => seen.length >= 2)
    assert.deepEqual(seen, ["openai", "openai"], "改钥 ⇒ 恰一次")
    // ③ defaultModel 写（`settings:agent` 写径 —— 动态解引用链）
    assert.equal(settingsMain.settingsAgent({ patch: { defaultModel: "openai:gpt-4o" } }).ok, true)
    await settle(() => seen.length >= 3)
    assert.equal(seen.length, 3, "defaultModel 写 ⇒ 恰一次（写回执不被阻断）")
    // ④ 行面两态（读核落账 —— 读账优先）
    coreProbe.recordAdmission("openai", { ok: false, reason: "该渠道不提供模型列表（GET /models 500）——无法选择模型，请改用其他渠道", failure: "timeout" })
    const bad = providers.providerList().providers.find((p) => p.name === "openai")
    assert.equal(bad.available, false)
    assert.equal(bad.unavailableReason, "该渠道不提供模型列表（GET /models 500）——无法选择模型，请改用其他渠道")
    coreProbe.recordAdmission("openai", { ok: true })
    const good = providers.providerList().providers.find((p) => p.name === "openai")
    assert.equal(good.available, true)
    assert.equal("unavailableReason" in good, false, "通径零失败句（禁假造）")
    // ⑤ 未落账（新渠）⇒ 两键缺席
    assert.equal(providers.providerSave({ name: "kimi", shape: "preset" }).ok, true)
    const fresh = providers.providerList().providers.find((p) => p.name === "kimi")
    assert.ok(fresh !== undefined)
    assert.equal("available" in fresh || "unavailableReason" in fresh, false, "未落账 ⇒ 两键缺席（禁用键给假读数）")
    assert.equal(diskOf(cfg).providers.length, 2)
  } finally { coreIo._resetConfigPathForTest(); restoreProbe() }
})

// ─── T5 · S5：渠级代理开关（true 写 ∕ false 删键；行回读随动）─────────────────

test("S5 ∕ T5：provider:setProxy 两径 —— true ⇒ 写 proxy:true；false ⇒ 删键；行 `proxy` 随动", async () => {
  const cfg = withConfig({ providers: [{ name: "p1", baseURL: "https://p.example/v1", apiKey: "k" }] })
  try {
    assert.equal(providers.providerList().providers[0].proxy, false)
    assert.deepEqual(providers.providerSetProxy({ name: "p1", proxy: true }), { ok: true, reason: null })
    assert.equal(diskOf(cfg).providers[0].proxy, true, "true ⇒ 写 proxy:true")
    assert.equal(providers.providerList().providers[0].proxy, true, "行回读随动")
    assert.deepEqual(providers.providerSetProxy({ name: "p1", proxy: false }), { ok: true, reason: null })
    assert.equal("proxy" in diskOf(cfg).providers[0], false, "false ⇒ 删键（沿 VSC 语义）")
    assert.equal(providers.providerList().providers[0].proxy, false)
    assert.equal(providers.providerSetProxy({ name: "p1", proxy: "yes" }).reason, "invalid-shape")
    assert.equal(providers.providerSetProxy({ name: "nope", proxy: true }).reason, "unavailable")
  } finally { coreIo._resetConfigPathForTest() }
})

// ─── T6 · S6：删除确认门（驳回 ⇒ 零写；确认 ⇒ 既有删除径）────────────────────

test("S6 ∕ T6：确认件两键语义（是 ⇒ 闭包径；否 ∕ 背板 ∕ 框内 Escape ⇒ 零动作 + 拦截冒泡）", async () => {
  let calls = 0
  const tree = confirm.settingsConfirmTree(() => { calls += 1 })
  assert.equal(tree.backdrop.props.class, "auto-backdrop")
  assert.equal(tree.popover.props.class, "auto-confirm")
  assert.equal(tree.popover.props.role, "alertdialog")
  const actions = tree.popover.children[1]
  assert.equal(actions.props.class, "auto-confirm-actions")
  const [yes, no] = actions.children
  assert.equal(yes.props.class, "auto-confirm-yes")
  assert.equal(no.props.class, "auto-confirm-no")
  no.props.onClick()
  tree.backdrop.props.onClick()
  assert.equal(calls, 0, "驳回两径 ⇒ 零动作（零写）")
  let stopped = 0
  tree.popover.props.onKeydown({ key: "Escape", stopPropagation: () => { stopped += 1 } })
  assert.equal(stopped, 1, "框内 Escape：拦截冒泡（不连带关设置面）")
  assert.equal(calls, 0)
  yes.props.onClick()
  assert.equal(calls, 1, "确认 ⇒ 既有删除径（闭包径）")
})

test("S6 出口：渠移除 ∕ 删钥 ∕ 密钥行删除 ∕ MCP 移除四门 —— 确认前零 ask，确认后走既有通道", async () => {
  // 假 DOM（确认弹层挂载面）：createElement / body.append 记账；Node 影子供 `dom.mjs` `fill` 判据。
  const created = []
  const makeEl = (tag) => {
    const node = {
      tag, attrs: {}, listeners: {}, children: [], removed: false,
      setAttribute(k, v) { node.attrs[k] = v },
      getAttribute(k) { return node.attrs[k] ?? null },
      getAttributeNames() { return Object.keys(node.attrs) },
      removeAttribute(k) { delete node.attrs[k] },
      append(...items) { node.children.push(...items) },
      appendChild(item) { node.children.push(item); return item },
      remove() { node.removed = true },
      addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
      removeEventListener() {},
      querySelector() { return null },
      querySelectorAll() { return [] },
      focus() {}, blur() {}, classList: { add() {}, remove() {}, contains: () => false },
      textContent: "", childNodes: [], firstChild: null, parentNode: null,
    }
    created.push(node)
    return node
  }
  const body = makeEl("body")
  globalThis.Node = Object
  globalThis.document = {
    body, documentElement: body,
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    createElement: (tag) => makeEl(tag), createTextNode: (text) => ({ textContent: String(text) }),
  }
  try {
    const exitsMod = await import(at("thincoder-desktop/renderer/mount-settings-exits.mjs"))
    const calls = []
    const state = { settings: { open: true, providers: { rows: [] }, tools: {}, mcp: {}, env: {}, notice: null, wizard: {} } }
    const exits = exitsMod.createExits({
      ask: async (channel, payload) => { calls.push([channel, payload ?? null]); return { ok: true, reason: null, tools: [] } },
      store: { get: () => state },
      setSettings: () => {}, report: () => {}, clearReport: () => {}, occupies: () => false,
      reads: { loadProviders: async () => {}, loadAgent: async () => {}, loadMcp: async () => {}, loadEnv: async () => {}, loadTools: async () => {} },
      slot: '[data-slot="settings"]', paintSettings: () => {},
    })
    for (const name of ["onRemoveProvider", "onKeyDelete"]) assert.equal(typeof exits.handlers[name], "function", `${name} 出口在场`)
    // ① 渠移除门：确认前零写
    exits.handlers.onRemoveProvider("p1")
    exits.handlers.onKeyDelete("embedding")
    exits.handlers.onRemoveMcp("srv")
    await settle(() => false, 5)
    assert.equal(calls.length, 0, "三门确认前零 ask（零写）")
    // ② 点「是」⇒ 既有删除径（单例：末次开框在场）
    const yes = created.filter((n) => n.attrs.class === "auto-confirm-yes").pop()
    assert.ok(yes !== undefined, "确认框已挂载（yes 键在场）")
    yes.listeners.click[0]()
    await settle(() => calls.length >= 1)
    assert.deepEqual(calls[0], ["mcp:remove", { name: "srv" }], "确认 ⇒ 走既有通道（末框 = MCP 移除）")
    // ③ 删钥门：确认后走 provider:delKey
    exits.handlers.onProviderKeyDelete("p1")
    const yes2 = created.filter((n) => n.attrs.class === "auto-confirm-yes").pop()
    yes2.listeners.click[0]()
    await settle(() => calls.length >= 2)
    assert.deepEqual(calls[1], ["provider:delKey", { name: "p1" }])
    // ④ 密钥行删除门：确认后走 settings:tools 空串 patch
    exits.handlers.onKeyDelete("embedding")
    const yes3 = created.filter((n) => n.attrs.class === "auto-confirm-yes").pop()
    yes3.listeners.click[0]()
    await settle(() => calls.length >= 3)
    assert.deepEqual(calls[2], ["settings:tools", { patch: { embedding: { apiKey: "" } } }])
    // ⑤ 驳回径：背板点按 ⇒ 零新增 ask
    exits.handlers.onRemoveProvider("p1")
    const backdrop = created.filter((n) => n.attrs.class === "auto-backdrop").pop()
    backdrop.listeners.click[0]()
    await settle(() => false, 5)
    assert.equal(calls.length, 3, "驳回 ⇒ 零写（盘零变）")
  } finally {
    delete globalThis.document
    delete globalThis.Node
  }
})

test("S2 出口：拉取模型写切片（probe 三态 + draft 快照）—— 探通候选回填 ∕ 探不通失败面 ∕ 空 baseURL 本地前置拒", async () => {
  // 假 DOM（钥输入读取面）+ 假 FormData（表单暂存值直读面）。
  const keyInput = { value: " sk-typed " }
  globalThis.document = {
    addEventListener() {}, removeEventListener() {},
    querySelector(sel) { return String(sel).includes("data-provider-key-input") ? keyInput : null },
    querySelectorAll(sel) { return String(sel).includes("data-provider-key-input") ? [keyInput] : [] },
    createElement: () => ({ setAttribute() {}, append() {}, addEventListener() {}, remove() {}, querySelector: () => null }),
    body: { append() {} },
  }
  const fields = { name: "n1", baseURL: "https://x.example/v1", format: "openai", key: "sk-1" }
  const realFormData = globalThis.FormData
  globalThis.FormData = class { constructor() {} get(k) { return fields[k] ?? null } }
  try {
    const exitsMod = await import(at("thincoder-desktop/renderer/mount-settings-exits.mjs"))
    const calls = []
    const patches = []
    const state = { settings: { open: true, providers: { rows: [] }, tools: {}, mcp: {}, env: {}, notice: null, wizard: {} } }
    const exits = exitsMod.createExits({
      ask: async (channel, payload) => { calls.push([channel, payload ?? null]); return { ok: true, reason: null, models: ["m1", "m2"] } },
      store: { get: () => state },
      setSettings: (patch) => patches.push(patch),
      report: () => {}, clearReport: () => {}, occupies: () => false,
      reads: { loadProviders: async () => {}, loadAgent: async () => {}, loadMcp: async () => {}, loadEnv: async () => {}, loadTools: async () => {} },
      slot: '[data-slot="settings"]', paintSettings: () => {},
    })
    const form = { closest: () => form }
    await exits.handlers.onFetchModels({ currentTarget: form })
    assert.deepEqual(calls[0], ["provider:models", { baseURL: "https://x.example/v1", apiKey: "sk-1", format: "openai" }], "载荷 = 表单暂存值（不落盘）")
    const probeWrite = patches.filter((p) => p.providers?.probe !== undefined).pop()
    assert.deepEqual(probeWrite.providers.probe, { state: "ok", models: ["m1", "m2"], reason: null }, "探通 ⇒ 候选入切片")
    assert.deepEqual(probeWrite.providers.draft, { name: "n1", baseURL: "https://x.example/v1", format: "openai", key: "sk-1" }, "暂存值快照同批落（重挂回填）——零 model 键（清除批）")
    // 空 baseURL ⇒ 本地前置拒（零发送 + 失败词驻状态行）
    fields.baseURL = "   "
    const before = calls.length
    await exits.handlers.onFetchModels({ currentTarget: form })
    assert.equal(calls.length, before, "空 baseURL ⇒ 零发送（本地前置拒）")
    const lastProbe = patches.filter((p) => p.providers?.probe !== undefined).pop()
    assert.equal(lastProbe.providers.probe.state, "fail")
    assert.equal(lastProbe.providers.probe.reason, "base-url-required", "失败词键（渲染面出词）")
    // 设 ∕ 改钥出口：读行内输入现值（trim）⇒ provider:setKey
    exits.handlers.onProviderKeySave("p1")
    await settle(() => calls.length > before)
    assert.deepEqual(calls[calls.length - 1], ["provider:setKey", { name: "p1", key: "sk-typed" }], "空值判据前的 trim 直取值")
  } finally {
    globalThis.FormData = realFormData
    delete globalThis.document
  }
})

// ─── S1 ∕ S3 ∕ S4 ∕ S5 行面树（S4 sub 段两态 · S3 行标 · S5 复选 · S1 钥控件两态）────────

test("S4 ∕ S3 ∕ S5 ∕ S1 行面：sub 段非空才显 ∕ 可用性两态 ∕ 代理复选 ∕ 钥控件静止与编辑两态", () => {
  i18n.initDict({ locale: "zh" })
  const deps = {
    reasonWord: (code) => (code === "timeout" ? "超时" : null),
    verifyControl: (name) => ({ tag: "button", props: { "data-action": "settings:verify", "data-name": name }, children: [] }),
    channelForm: (form) => ({ tag: "form", props: { "data-form-shape": form.shape }, children: [] }),
    formats: ["openai"],
    edit: null,
  }
  const handlers = { onSetProxy: () => {}, onProviderKeyEdit: () => {}, onProviderKeyDelete: () => {} }
  const full = {
    name: "openai", hasKey: true, maskedKey: coreSettings.MASKED, baseURL: "https://api.openai.com/v1",
    active: true, proxy: true, effort: "auto", available: false, unavailableReason: "探不通句",
  }
  const body = sections.providersBody({ state: "ready", presets: [], rows: [full], verify: null, probe: null, draft: null }, handlers, deps)
  const row = body[0]
  const childOf = (node, attr, value = undefined) => node.children.find((c) => c && c.props && (value === undefined ? c.props[attr] !== undefined : c.props[attr] === value))
  // 行结构（D37 两行卡）：主行 ∥ 副行（2026-10-09 清除批：sub = baseURL 单段）
  const main = childOf(row, "class", "settings-row-main")
  const sub = childOf(row, "class", "settings-row-sub")
  // S4：sub 段（非空才显；model 段随 2026-10-09 清除批退场 —— 单段 = baseURL）
  assert.equal(sub.children.filter((c) => c && c.props && c.props.class === "settings-row-value").length, 1, "sub 段恰一（零 model 段）")
  assert.equal(childOf(sub, "class", "settings-row-value").children[0], "https://api.openai.com/v1", "sub = baseURL")
  // S3：不可用标 + 失败句
  assert.equal(childOf(sub, "data-available", "false").children[0], "不可用")
  assert.equal(childOf(row, "data-unavailable-reason").children[0], "探不通句")
  // S5：代理复选（值 = 行投影；复选住 label 内 —— label 包裹形）
  const proxyLabel = sub.children.find((c) => c && c.tag === "label" && Array.isArray(c.children) && c.children.some((x) => x && x.props && x.props["data-provider-proxy"] !== undefined))
  const proxyInput = proxyLabel.children.find((x) => x && x.props && x.props["data-provider-proxy"] !== undefined)
  assert.equal(proxyInput.props.checked, true)
  // S1：静止态两控件（已配 ⇒ 改钥 + 删钥）
  assert.equal(childOf(main, "data-action", "settings:providerKeyEdit").children[0], "修改")
  assert.ok(childOf(main, "data-action", "settings:providerKeyDelete") !== undefined)
  // 空值 / 未配渠：零节点（禁假造）
  const bare = { name: "p2", hasKey: false, maskedKey: null, baseURL: "", proxy: false }
  const bareRow = sections.providersBody({ state: "ready", presets: [], rows: [bare], verify: null }, handlers, deps)[0]
  const bareMain = childOf(bareRow, "class", "settings-row-main")
  const bareSub = childOf(bareRow, "class", "settings-row-sub")
  assert.equal(childOf(bareRow, "data-unavailable-reason"), undefined)
  assert.equal(bareSub.children.some((c) => c && c.props && c.props.class === "settings-row-value"), false, "空 baseURL ⇒ 零段节点（禁假造）")
  assert.equal(childOf(bareMain, "data-action", "settings:providerKeyDelete"), undefined, "未配 ⇒ 零删钥控件")
  assert.equal(childOf(bareMain, "data-action", "settings:providerKeyEdit").children[0], "添加 API Key")
  // S1：编辑态换形（钥输入 + 存 ∕ 消；移除 ∕ 代理暂撤）
  const editRow = sections.providersBody({ state: "ready", presets: [], rows: [full], verify: null }, handlers, { ...deps, edit: "openai" })[0]
  const editMain = childOf(editRow, "class", "settings-row-main")
  assert.ok(editRow.props["data-edit"] !== undefined)
  assert.equal(childOf(editMain, "data-provider-key-input").props.type, "password")
  assert.equal(childOf(editMain, "data-action", "settings:providerKeySave").children[0], "保存")
  assert.equal(childOf(editMain, "data-action", "settings:providerKeyCancel").children[0], "取消")
  assert.equal(childOf(editMain, "data-action", "settings:removeProvider"), undefined, "编辑态：移除暂撤（取消即回）")
})

// ─── S2 表单树（探通 ∕ 探不通两态 ∕ 零候选零 model 件 ∕ 暂存值回填 ∕ 向导零回归）────

test("S2 表单树：状态行两态（探通 ∕ 探不通）+ 零候选 ∥ 零 model 件（2026-10-09 清除批）∕ draft 回填 ∕ 缺 handler 零钮", () => {
  i18n.initDict({ locale: "zh" })
  const okForm = controls.channelFormTree({
    shape: "custom", presets: [], formats: ["openai", "anthropic"], probe: { state: "ok", word: "✓ 连接成功 — 2 个模型" },
    draft: { name: "n1", baseURL: "https://x.example/v1", format: "anthropic", key: "sk-1" },
  }, { onFetchModels: () => {} })
  const fetchRow = okForm.children.find((c) => c.props && c.props["data-fetch-models"] !== undefined)
  assert.equal(fetchRow.children[0].props["data-action"], "settings:fetchModels")
  assert.equal(fetchRow.children[0].props.disabled, undefined, "有 handler ⇒ 非禁用")
  assert.equal(fetchRow.children[1].props["data-probe"], "ok")
  assert.equal(fetchRow.children[1].children[0], "✓ 连接成功 — 2 个模型")
  // 2026-10-09 清除批：候选 `datalist` ∥ model 输入件退场（保存径控件集不含 model）
  assert.equal(okForm.children.some((c) => c.tag === "datalist"), false, "零候选面")
  assert.equal(okForm.children.some((c) => c.props && c.props.name === "model"), false, "零 model 件")
  assert.equal(okForm.children.find((c) => c.props && c.props.name === "baseURL").props.value, "https://x.example/v1")
  assert.equal(okForm.children.find((c) => c.props && c.props.name === "key").props.value, "sk-1")
  const formatSel = okForm.children.find((c) => c.props && c.props.name === "format")
  assert.equal(formatSel.children.find((o) => o.props.selected === true).props.value, "anthropic", "格式暂存回填")
  // 探不通：失败词在场 + 零候选 + 零阻断（模型仍文本输入）
  const failForm = controls.channelFormTree({ shape: "custom", presets: [], formats: ["openai"], probe: { state: "fail", word: "需要 baseURL" } }, { onFetchModels: () => {} })
  assert.equal(failForm.children.some((c) => c.tag === "datalist"), false, "探不通 ⇒ 零候选面")
  assert.equal(failForm.children.find((c) => c.props && c.props["data-fetch-models"] !== undefined).children[1].children[0], "需要 baseURL")
  assert.equal(failForm.children.some((c) => c.props && c.props.name === "model"), false, "保存径控件集零变（零阻断 —— 零 model 件）")
  // 缺 handler（向导径）⇒ 拉取控件零节点（零回归）
  const wizardForm = controls.channelFormTree({ shape: "custom", presets: [], formats: ["openai"] }, {})
  assert.equal(wizardForm.children.some((c) => c.props && c.props["data-fetch-models"] !== undefined), false)
  assert.equal(wizardForm.children.find((c) => c.props && c.props.name === "name").props.value, undefined, "无 draft ⇒ 零回填（零行为改）")
  assert.equal(wizardForm.children.some((c) => c.props && c.props.name === "model"), false, "零 model 件（向导全径同）")
})

// ─── S7：预设项携 desc（数据仍取核表；model 段随 2026-10-09 清除批退场）────────────────

test("S7：presetChoices 转发 desc（值取核表）；预设项标签 = VSC 串形", () => {
  const presets = providers.providerList().presets
  const deepseek = presets.find((p) => p.name === "deepseek")
  assert.equal(deepseek.desc, "DeepSeek", "desc 直取核 PROVIDER_PRESETS")
  assert.equal("model" in deepseek, false, "零 model 键（渠道单值模型退场）")
  assert.ok(presets.every((p) => typeof p.desc === "string" && p.desc !== ""), "逐条携 desc")
  i18n.initDict({ locale: "en" })
  assert.equal(controls.presetLabel({ name: "deepseek", desc: "DeepSeek", model: "deepseek-flash" }), "deepseek — DeepSeek", "标签 = name — desc（入参遗留 model 段零参与）")
  assert.equal(controls.presetLabel({ name: "x" }), "x", "缺段不落空括号（禁假造）")
  const form = controls.channelFormTree({ shape: "preset", presets: [deepseek], formats: ["openai"] }, {})
  const option = form.children.find((c) => c.tag === "select").children[0]
  assert.equal(option.props.value, "deepseek")
  assert.match(option.children[0], /deepseek — DeepSeek/, "项文本携 desc（model 后缀退场）")
})

// ─── S12：index 空态（无 key ⇒ 提示 + 钮禁用；有 key ⇒ 既有两态零变）──────────────

test("S12：无 embedding key ⇒ 提示词 + 构建钮禁用；有 key ⇒ 既有两态零变；键面缺位 ⇒ 沿旧判", () => {
  i18n.initDict({ locale: "zh" })
  const handlers = { onBuildIndex: () => {} }
  const rowOf = (section) => toolsView.toolsBody(section, handlers).find((n) => n && n.props && n.props["data-index"] === "row")
  const noKey = rowOf({ keys: { embedding: { hasKey: false }, websearch: { hasKey: false } }, status: { built: false }, building: false })
  assert.equal(noKey.props["data-index-state"], "no-key")
  assert.equal(noKey.children[1].children[0], "未配置 embedding API key。", "提示行在场（值逐字同 VSC zh）")
  assert.equal(noKey.children[2].props.disabled, true, "构建钮禁用")
  const notBuilt = rowOf({ keys: { embedding: { hasKey: true } }, status: { built: false }, building: false })
  assert.equal(notBuilt.props["data-index-state"], "not-built")
  assert.equal(notBuilt.children[2].props.disabled, undefined, "有 key ⇒ 钮可用（零变）")
  const built = rowOf({ keys: { embedding: { hasKey: true } }, status: { built: true, files: 3, chunks: 9 }, building: false })
  assert.equal(built.props["data-index-state"], "built")
  assert.match(built.children[1].children[0], /3 个文件/)
  assert.equal(rowOf({ keys: null, status: { built: false }, building: false }).props["data-index-state"], "not-built", "键面读数缺位 ⇒ 不可证假（沿旧判）")
  assert.equal(rowOf({ keys: { embedding: { hasKey: false } }, status: { built: false }, building: false }).props["data-index-state"], "no-key", "无 key 判据先于状态词")
})

// ─── 集成冒烟：全树（settingsModel 归一 + 段分派 + S1 ∕ S2 切片键）──────────────────

test("集成冒烟：settingsTree 全树（S1 ∕ S2 切片键经归一入段）零抛，渠道段含钥输入；拉取钮在添加弹窗体（表单件树面）", async () => {
  i18n.initDict({ locale: "zh" })
  const settingsView = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
  const state = {
    locale: "zh",
    settings: {
      open: true, notice: null, configured: true, defaultModel: "openai:gpt-4o",
      wizard: { step: 1, dismissed: true, notice: null },
      providers: {
        state: "ready",
        presets: [{ name: "deepseek", desc: "DeepSeek", model: "deepseek-flash", baseURL: "https://api.deepseek.com" }],
        providers: [{ name: "openai", shape: "preset", baseURL: "https://api.openai.com/v1", model: "gpt-4o", hasKey: true, maskedKey: coreSettings.MASKED, active: true, proxy: false, effort: "auto", available: true }],
        edit: "openai",
        probe: { state: "ok", models: ["m1"], reason: null },
        draft: { name: "n", baseURL: "https://x.example/v1", model: "m", format: "openai", key: "k" },
      },
      verify: null,
      model: { state: "ready", provider: "openai", current: "openai:gpt-4o", models: [] },
      agent: { state: "none", fields: [] },
      mcp: { state: "none", servers: [], details: {} },
      env: { state: "none" },
      tools: { state: "none", status: null, building: false, keys: null, edit: null },
      models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: {}, advisorPicker: {} },
    },
  }
  const model = settingsView.settingsModel(state)
  assert.equal(model.providers.edit, "openai", "归一放行 edit（S1）")
  assert.equal(model.providers.probe.state, "ok", "归一放行 probe（S2）")
  assert.equal(model.providers.draft.key, "k", "归一放行 draft（S2）")
  const handlers = {
    onProviderKeyEdit: () => {}, onProviderKeyDelete: () => {}, onProviderKeySave: () => {}, onProviderKeyCancel: () => {},
    onSetProxy: () => {}, onFetchModels: () => {}, onRemoveProvider: () => {}, onVerify: () => {}, onSubmit: () => {},
    onUseModel: () => {}, onTier: () => {}, onBuildIndex: () => {}, onKeyEdit: () => {}, onKeySave: () => {}, onKeyDelete: () => {},
    onAddMcp: () => {}, onRemoveMcp: () => {}, onMcpTools: () => {}, onMcpTest: () => {},
  }
  const tree = settingsView.settingsTree(model, handlers)
  const text = JSON.stringify(tree)
  assert.match(text, /"data-provider-key-input"/, "S1 编辑态：行内钥输入在场")
  // S2 拉取钮住表单件树面（添加弹窗体 —— 两形常显表单退场批：页树零表单；自定形 ∧ handler 给 ⇒ 在场）
  const modalWith = (base) => JSON.stringify(settingsView.settingsModalTree(
    { ...base, settings: { ...base.settings, providers: { ...base.settings.providers, addShape: "custom" } } },
    settingsView.ADD_MODAL_GROUP, handlers))
  const modalText = modalWith(state)
  assert.match(modalText, /settings:fetchModels/, "S2：拉取模型钮在场（表单件树面 · 有 handler）")
  assert.match(modalText, /"data-fetch-models"/)
  assert.equal(text.includes("settings:providerKeyDelete"), false, "编辑态下删钥控件暂撤（取消即回）")
  // 无 edit ∕ probe ∕ draft ⇒ 静止态（零回归）
  const stillState = { ...state, settings: { ...state.settings, providers: { ...state.settings.providers, edit: null, probe: null, draft: null } } }
  const still = settingsView.settingsModel(stillState)
  const stillText = JSON.stringify(settingsView.settingsTree(still, handlers))
  assert.match(stillText, /settings:providerKeyDelete/, "静止态：删钥控件在位")
  assert.equal(modalWith(stillState).includes("data-fetch-models"), true, "拉取钮恒在（表单件树面 · handler 给）")
})


// ─── 通道面（结构）：51 项两向相等 ∕ W2/W3 六新连块定序 ∕ 档头计数 ∕ 渲染面闭包纪律 ──────

test("通道面：白名单 51 项 ≡ 注册表 HANDLERS（两向相等）；W2/W3 六新连块定序；三档头计数五十一（跨批随动——含后续三增 + B1 团队三增）", () => {
  const preload = deskReq(join(ROOT, "thincoder-desktop/src/preload/preload.cjs"))
  assert.equal(preload.CHANNELS.length, 51, "51 项（W2/W3 六增 + 后续三增 + B1 团队三增：`team:status` ∥ `team:login` ∥ `team:logout`）")
  const w23 = preload.CHANNELS.indexOf("provider:setKey")
  assert.deepEqual(preload.CHANNELS.slice(w23, w23 + 6), ["provider:setKey", "provider:delKey", "provider:models", "provider:setProxy", "mcp:update", "mcp:reconnect"], "W2 四新 + W3 两新 = 连块定序（后续三增随其后）")
  assert.deepEqual(preload.CHANNELS.slice(-3), ["team:status", "team:login", "team:logout"], "B1 团队三增定序末位（他批增量——随动）")
  const registrySrc = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const rows = [...registrySrc.matchAll(/^\s{2}"([^"]+)":/gm)].map((m) => m[1])
  assert.equal(rows.length, 51)
  assert.deepEqual([...new Set(rows)].sort(), [...preload.CHANNELS].sort(), "白名单 ↔ 注册表两向相等")
  for (const file of ["thincoder-desktop/src/main/ipc.mjs", "thincoder-desktop/src/main/ipc-registry.mjs", "thincoder-desktop/src/preload/preload.cjs"]) {
    assert.match(read(file), /五十一项/, `${file} 档头计数随动`)
  }
  // 渲染面静态闭包纪律（零 `node:` ∕ 零裸包 —— 本批新改渲染档）
  for (const file of [
    "thincoder-desktop/renderer/settings-confirm.mjs",
    "thincoder-desktop/renderer/mount-settings-segments-providers.mjs",
    "thincoder-desktop/renderer/mount-settings-exits.mjs",
    "thincoder-desktop/renderer/mount-settings-segments.mjs",
    "thincoder-desktop/renderer/views/settings-sections.mjs",
    "thincoder-desktop/renderer/views/settings-controls.mjs",
    "thincoder-desktop/renderer/views/settings-sections-tools.mjs",
  ]) {
    const src = read(file)
    assert.equal(/from\s+"node:/.test(src) || /require\(/.test(src), false, `${file}: 零 node: ∕ 零 require`)
  }
})
