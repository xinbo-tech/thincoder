/**
 * 2026-10-07-provider-config-parity-vsc.test.mjs — 批内件（VSC 舱 V1–V13；随批档存档；直接跑：node --test）。
 *
 * 三端对齐批（`docs/batches/2026-10-07-provider-config-parity.md`——台账 #1027–#1035）VSC 腿：
 * 设计面（逐条判据）= `docs/vsc/design/SETTINGS.md` §2.16；机检点名 = 批档 §2.6 测试面 V1–V11，
 * 收口轮 +V12（保存徽标门控）∥ +V13（拒存保在编输入）。测试台（mini 假 DOM + 装缝 + 真词面装载）=
 * `docs/batches/2026-10-07-provider-config-parity-vsc-harness.mjs`（本档 import 面）。
 * 拆档由来 = 共享件破 500 硬限 ⇒ 按舱拆档；VSC 档腿 + 测试台合计仍越限 ⇒ 测试台抽公档
 * （沿 `2026-10-07-browser-input.harness.mjs` 先例——「测试台抽公档（第三档，报备）」）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  VSC, readdirSync, vscSrc, EN, ZH, SS, api, openDialog, setType, setPresets,
  byId, surface, bodyFind, bodyEl, clearAll, drainTimers, _focused, postSink,
} from "./2026-10-07-provider-config-parity-vsc-harness.mjs"
// ─── V1 新档 + 锚源锁 ─────────────────────────────────────────────────────────────

test("V1 新档+锚源锁：弹窗档在案（卡 ∥ 框幕独立类 ∥ role/aria-modal）∥ 五路关在案 ∥ 卡档零表单字面", () => {
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  assert.ok(dlg.includes('"prov-add-dialog"'), "卡 id = prov-add-dialog")
  assert.ok(dlg.includes('"settings-dialog"'), "卡类 = .settings-dialog（新段）")
  assert.ok(dlg.includes('"settings-dialog-backdrop"'), "框幕 = 独立类 .settings-dialog-backdrop（D12）")
  assert.ok(dlg.includes('"role", "dialog"'), "role=dialog")
  assert.ok(dlg.includes('"aria-modal", "true"'), "aria-modal=true")
  assert.ok(dlg.includes('"aria-label", t("settings.addProviderTitle")'), "aria-label = 标题同词")
  assert.ok(dlg.includes('window._openAddProviderDialog = openAddProviderDialog'), "开面 = 单例导出（window._openAddProviderDialog）")
  // 五路关（源锁）：保存 ∥ 取消钮 ∥ 背板 ∥ 框内 Esc（stopPropagation）∥ closeSettings 同清
  assert.ok(dlg.includes("backdrop.addEventListener(\"click\", closeAddProviderDialog)"), "关·背板")
  assert.ok(dlg.includes("cancelBtn.addEventListener(\"click\", closeAddProviderDialog)"), "关·取消钮")
  assert.ok(dlg.includes("e.stopPropagation()"), "关·框内 Esc（停冒泡——不连带关面板）")
  assert.ok(dlg.includes("closeAddProviderDialog() // 关·保存 = 发消息后关"), "关·保存 = 发消息后关")
  assert.ok(vscSrc("webview/settings.js").includes("closeAddProviderDialog()"), "关·closeSettings 同清（settings.js 增调）")
  // 卡档零表单字面（表单 HTML 已迁出）
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(!prov.includes("prov-add-form"), "settings-providers.js 零 prov-add-form 字面")
  assert.ok(!prov.includes("pa-"), "settings-providers.js 零 pa-* 绑定残留")
  assert.ok(vscSrc("webview/settings.css").includes(".settings-dialog-backdrop") && vscSrc("webview/settings.css").includes(".settings-dialog {"), "样式新段在案（settings.css）")
})

// ─── V2 元素序（源锁 indexOf 序 + 建面 DOM 序双证）─────────────────────────────────

test("V2 元素序：源锁 indexOf 序 + 建面 DOM 序 = type→[name→url→format]→key→proxy→[拉取→model]→save/cancel", () => {
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  const chain = ["pa-type", "pa-custom-fields", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-model", "pa-save-btn", "pa-cancel-btn"]
  let at = -1
  for (const tok of chain) {
    const i = dlg.indexOf(`"${tok}"`)
    assert.ok(i > at, `${tok} 源序位（indexOf 递增）`)
    at = i
  }
  // 建面 DOM 序（行为面：真件挂树后的先序遍历 = 设计字段序）
  clearAll(); setPresets(); openDialog()
  const ids = []
  byId("prov-add-dialog").walk((n) => { if (n.id) ids.push(n.id) })
  const pos = (id) => ids.indexOf(id)
  for (const id of ["pa-type", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model", "pa-save-btn", "pa-cancel-btn"]) {
    assert.ok(pos(id) >= 0, `${id} 建面在场`)
  }
  const order = ["pa-type", "pa-name", "pa-url", "pa-format", "pa-key", "pa-proxy", "pa-custom-tail", "pa-fetch-btn", "pa-conn-status", "pa-model", "pa-save-btn", "pa-cancel-btn"].map(pos)
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "DOM 序 = 用户填写序（name→url→format→key→proxy→拉取→model）")
  assert.ok(pos("pa-preset-info") > pos("pa-type") && pos("pa-preset-info") < pos("pa-custom-fields"), "预设信息行居中（type 后、条件块前）")
  clearAll()
})

// ─── V3 开框单例 ∥ 重置 ∥ 五路关 ───────────────────────────────────────────────────

test("V3 开框（单例 ∥ 重置 ∥ 初始焦点）与五路关（取消 ∥ 背板 ∥ Esc ∥ 保存 ∥ 关面板）", () => {
  clearAll(); setPresets()
  // 开=两件挂 body
  openDialog()
  let s = surface()
  assert.ok(s.backdrop, "框幕在场（.settings-dialog-backdrop）")
  assert.ok(s.card, "卡在场（#prov-add-dialog）")
  assert.equal(s.card.parent, bodyEl, "卡挂 document.body（卡外于 providers 卡）")
  assert.equal(s.card.getAttribute("role"), "dialog")
  assert.equal(s.card.getAttribute("aria-modal"), "true")
  assert.equal(s.card.getAttribute("aria-label"), EN["settings.addProviderTitle"], "aria-label = 词面")
  assert.ok(s.card.querySelector(".settings-subtitle")?.textContent === EN["settings.addProviderTitle"], "体首件 = 标题同词")
  // 单例：再开 ⇒ 零动作（同件 ∥ 幕仍一）
  const cardRef = s.card
  openDialog()
  assert.equal(byId("prov-add-dialog"), cardRef, "单例：二次开 ⇒ 零动作")
  assert.equal(bodyEl.children.filter((c) => c.classList?.contains("settings-dialog-backdrop")).length, 1, "幕仅一")
  // 开框重置 + 初始焦点（+50ms）
  assert.equal(byId("pa-type").value, "deepseek", "类型回首项")
  byId("pa-key").value = "sk-typed"; byId("pa-proxy").checked = true; byId("pa-model").value = "typed"; byId("pa-conn-status").textContent = "stale"
  drainTimers()
  assert.equal(_focused.at(-1)?.id, "pa-type", "初始焦点 = #pa-type（+50ms）")
  // 关①：取消钮
  byId("pa-cancel-btn").fire("click")
  assert.equal(surface().card, null, "取消 ⇒ 卡净"); assert.equal(surface().backdrop, null, "取消 ⇒ 幕净")
  // 关②：背板
  openDialog(); s = surface()
  s.backdrop.fire("click")
  assert.equal(surface().card, null, "背板 ⇒ 卡净"); assert.equal(surface().backdrop, null, "背板 ⇒ 幕净")
  // 关③：框内 Esc（stopPropagation——不连带关面板）
  openDialog(); s = surface()
  const ev = s.card.fire("keydown", { key: "Escape" })
  assert.equal(ev.stopped, true, "Esc 停冒泡（chat.js 关面板分支零触）")
  assert.equal(surface().card, null, "Esc ⇒ 卡净")
  // 关④：保存（发消息后关）——预设形
  openDialog(); setType("deepseek")
  const before = postSink.length
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.slice(before).filter((m) => m.type === "addProvider").length, 1, "保存 ⇒ addProvider 发出")
  assert.equal(surface().card, null, "保存 ⇒ 发消息后关")
  // 关⑤：closeSettings() 同清
  openDialog()
  api.closeSettings()
  assert.equal(surface().card, null, "closeSettings ⇒ 框净")
  assert.equal(surface().backdrop, null, "closeSettings ⇒ 幕净")
  // 重置语义的判别腿：开-填-关-复开 ⇒ 全新空件
  openDialog(); setType("custom"); byId("pa-key").value = "sk-x"; byId("pa-model").value = "m"
  byId("pa-cancel-btn").fire("click")
  openDialog()
  assert.equal(byId("pa-type").value, "deepseek", "复开 ⇒ 类型回首项")
  assert.equal(byId("pa-key").value, "", "复开 ⇒ key 清空")
  assert.equal(byId("pa-proxy").checked, false, "复开 ⇒ proxy 未勾")
  assert.equal(byId("pa-model").value, "", "复开 ⇒ 模型值清空")
  assert.equal(byId("pa-model-candidates").children.length, 0, "复开 ⇒ 候选清空")
  assert.equal(byId("pa-conn-status").textContent, "", "复开 ⇒ 状态行空")
  clearAll()
})

// ─── V4 不拉取可存（#1031）+ 开关写面（#1027 表单半）───────────────────────────────

test("V4 行为腿（#1031 ∥ #1027）：无拉取 + 填 model ⇒ addProvider posted（携 model ∥ 勾选携 proxy）；model 空 ⇒ modelRequired ∥ 零发", () => {
  clearAll(); setPresets()
  // ① 不拉取直存（候选空）
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov"; byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-model").value = "hand-typed-model"
  byId("pa-key").value = "sk-1"
  let before = postSink.length
  byId("pa-save-btn").fire("click")
  let sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent.length, 1, "不拉取 ⇒ 可存（原死路已撤）")
  assert.equal(sent[0].custom.model, "hand-typed-model", "custom 携 model")
  assert.equal(sent[0].key, "sk-1", "key 随载荷")
  assert.equal("proxy" in sent[0], false, "未勾 ⇒ 载荷缺 proxy（缺省 = 零键）")
  // ② 勾选 ⇒ 载荷 +proxy（可选布尔——勾选 ⇒ true）
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov2"; byId("pa-url").value = "https://my2.example.com/v1"
  byId("pa-model").value = "m2"; byId("pa-proxy").checked = true
  before = postSink.length
  byId("pa-save-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent[0].proxy, true, "勾选 ⇒ 载荷 +proxy:true")
  // ③ model 空 ⇒ 词 settings.modelRequired ∥ 零发
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov3"; byId("pa-url").value = "https://my3.example.com/v1"
  before = postSink.length
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.slice(before).filter((m) => m.type === "addProvider").length, 0, "model 空 ⇒ 零发")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.modelRequired"], "词 = settings.modelRequired")
  assert.ok(surface().card, "拒存 ⇒ 框仍在（修正后可再存）")
  // ④ 预设形：勾选 ⇒ proxy 随载荷
  openDialog(); setType("glm"); byId("pa-proxy").checked = true
  before = postSink.length
  byId("pa-save-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "addProvider")
  assert.equal(sent[0].preset, "glm")
  assert.equal(sent[0].proxy, true, "预设形同径携 proxy")
  clearAll()
})

// ─── V5 空表提示（#1032）────────────────────────────────────────────────────────────

test("V5 行为腿（#1032）：getModels 空 ⇒ #defaultmodel-hint 显 ∥ 零菜单；有候选 ⇒ 清提示 + 开菜单", () => {
  clearAll()
  SS.providerStatus = { providers: {}, labels: {} }
  const hint = byId("defaultmodel-hint")
  hint.style.display = "none"
  SS.getModels = () => []
  let bodyBefore = bodyEl.children.length
  window._defaultModelMenu()
  assert.equal(hint.style.display, "block", "空表 ⇒ 行内提示显（修「点击静默」）")
  assert.equal(bodyEl.children.length, bodyBefore, "空表 ⇒ 零菜单（无 overlay 落体）")
  // 有候选 ⇒ 清提示 + 开菜单（真菜单 overlay 落体）
  SS.getModels = () => [{ id: "m1", provider: "deepseek", label: "M1", reasoning: [] }]
  SS.providerStatus = { providers: { deepseek: {} }, labels: {} }
  SS.agentSettings = {}
  bodyBefore = bodyEl.children.length
  window._defaultModelMenu()
  assert.equal(hint.style.display, "none", "有候选 ⇒ 清提示")
  assert.ok(bodyEl.children.length > bodyBefore, "有候选 ⇒ 菜单开（overlay 落体）")
  clearAll()
  SS.getModels = () => []
})

// ─── V6 拉取路由载荷 + 探果落框 + 代际（③′ / #1031）───────────────────────────────

test("V6 载荷腿（③′）：testProvider 携 proxy = 勾选态；探果 ok ⇒ 候选填充 ∥ 键入值零清；探败 ⇒ 候选清空；代际不符 ⇒ 弃", () => {
  clearAll(); setPresets()
  openDialog(); setType("custom")
  byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-key").value = " sk-1 "
  byId("pa-format").value = "anthropic"
  byId("pa-proxy").checked = true
  let before = postSink.length
  byId("pa-fetch-btn").fire("click")
  let sent = postSink.slice(before).filter((m) => m.type === "testProvider")
  assert.equal(sent.length, 1, "拉取 ⇒ testProvider 发出")
  assert.equal(sent[0].proxy, true, "勾选 ⇒ 载荷 +proxy（宿主按 probeTargetOf 双门槛判定）")
  assert.equal(sent[0].format, "anthropic", "M1 格式随载荷")
  assert.equal(sent[0].apiKey, "sk-1", "apiKey 归一")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.connecting"], "拉取中态")
  // 未勾 ⇒ 载荷缺 proxy（缺省 = 直连——#1026 契约逐字不变）
  byId("pa-proxy").checked = false
  before = postSink.length
  byId("pa-fetch-btn").fire("click")
  sent = postSink.slice(before).filter((m) => m.type === "testProvider")
  assert.equal("proxy" in sent[0], false, "未勾 ⇒ 缺 proxy 键")
  // 探果 ok ⇒ 候选填充（不自动选中）∥ 键入值零清
  byId("pa-model").value = "typed-model"
  api.updateTestProviderResult({ ok: true, models: ["m-a", "m-b", "m-c"] })
  assert.equal(byId("pa-model-candidates").children.length, 3, "候选数 = models 数")
  assert.equal(byId("pa-model").value, "typed-model", "键入值零清（不自动选中）")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.connOk"].replace("${count}", "3"), "连通态词面")
  // 探败 ⇒ 候选清空 ∥ ✗ + 错误串 ∥ 键入值零清
  api.updateTestProviderResult({ ok: false, error: "boom-403" })
  assert.equal(byId("pa-model-candidates").children.length, 0, "探败 ⇒ 候选清空")
  assert.equal(byId("pa-model").value, "typed-model", "探败 ⇒ 键入值零清（不吞手输）")
  assert.equal(byId("pa-conn-status").textContent, "✗ boom-403", "✗ + 原样错误串")
  // 代际：关框 + 复开 ⇒ 老框在飞探果弃（新框零污染）
  byId("pa-cancel-btn").fire("click")
  openDialog()
  const status = byId("pa-conn-status")
  api.updateTestProviderResult({ ok: true, models: ["zombie"] })
  assert.equal(status.textContent, "", "代际不符 ⇒ 弃（状态行零动）")
  assert.equal(byId("pa-model-candidates").children.length, 0, "代际不符 ⇒ 零候选落框")
  // 框不在场 ⇒ 零动（无落点）
  byId("pa-cancel-btn").fire("click")
  api.updateTestProviderResult({ ok: true, models: ["ghost"] })
  assert.equal(surface().card, null, "框不在场 ⇒ 探果零动")
  clearAll()
})

// ─── V7 词面锁（#1033 / #1035）────────────────────────────────────────────────────

test("V7 词面锁：三处字面零残留 ∥ 两语键集相等 ∥ fetchModelsFirst 缺席 ∥ 六值改毕（zh 零「密钥」）", () => {
  // webview 全档扫：三处硬编码显示串零残留（带引号的字面形——散文注释不属显示面）
  for (const f of readdirSync(new URL("webview/", VSC))) {
    if (!f.endsWith(".js")) continue
    const s = vscSrc(`webview/${f}`)
    assert.ok(!s.includes('"(no default model)"'), `${f}：` + '"(no default model)" 零残留')
    assert.ok(!s.includes('"宿主繁忙"'), `${f}："宿主繁忙" 零残留`)
    assert.ok(!s.includes('"不可用"'), `${f}："不可用" 零残留`)
  }
  // 词面（显示面）改经词键
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(prov.includes('t("settings.noDefaultModel")') && prov.includes('t("settings.providerHostBusy")') && prov.includes('t("settings.providerUnavailable")'), "卡面三词经词键")
  assert.ok(prov.includes('t("settings.defaultModelTitle")') && prov.includes('t("settings.pickModelEmpty")'), "title ∥ 空表提示经词键")
  assert.ok(vscSrc("webview/settings-provider-dialog.js").includes('t("settings.noDefaultModel")'), "弹窗预设行同词")
  // 两语键集相等 ∥ fetchModelsFirst 缺席 ∥ 新键在位
  assert.deepEqual(Object.keys(EN).sort(), Object.keys(ZH).sort(), "两语键集相等")
  assert.ok(!("settings.fetchModelsFirst" in EN) && !("settings.fetchModelsFirst" in ZH), "fetchModelsFirst 缺席（随实现净删）")
  for (const k of ["settings.modelRequired", "settings.pickModelEmpty", "settings.noDefaultModel", "settings.defaultModelTitle", "settings.providerHostBusy", "settings.providerUnavailable"]) {
    assert.ok(k in EN && k in ZH, `${k} 两语在位`)
  }
  // #1035：六值改毕（zh 裸「密钥」清零）
  assert.equal(EN["settings.setKey"], "API Key"); assert.equal(ZH["settings.setKey"], "API Key")
  assert.equal(EN["settings.addKey"], "Add API Key"); assert.equal(ZH["settings.addKey"], "添加 API Key")
  assert.equal(EN["model.setKey"], "API Key…"); assert.equal(ZH["model.setKey"], "设置 API Key…")
  assert.ok(!Object.values(ZH).some((v) => String(v).includes("密钥")), "zh 裸「密钥」清零")
  assert.equal(ZH["error.provider"], "未配置 API Key — 点击 ⚙ 设置")
  assert.equal(ZH["error.failedProvider"], "无法初始化 ${name} — 请检查 API Key")
  assert.equal(ZH["banner.notConfigured"], "⚠ 未配置 — 点击 ⚙ 设置 API Key")
})

// ─── V8 扩展侧文本锁（写面透传 + 探针目标单源）────────────────────────────────────

test("V8 扩展侧文本锁：探针体含 probeTargetOf ∥ 零 proxyUri:null 硬编码 ∥ 两 handler 透传 proxy", () => {
  const s = vscSrc("src/extension/settings.mjs")
  const start = s.indexOf("export async function testProviderConnection")
  assert.ok(start > 0, "testProviderConnection 在案")
  const body = s.slice(start, s.indexOf("\n}", start))
  assert.ok(body.includes("probeTargetOf("), "目标构造 = 核 probeTargetOf（单源）")
  assert.ok(!body.includes("proxyUri: null"), "零 proxyUri:null 硬编码残留")
  assert.ok(body.includes("proxy: proxy === true"), "双门槛判据形（仅真值入构造）")
  assert.ok(s.includes("import { probeTargetOf } from \"@thincoder/core/provider-flows.mjs\""), "核单源 import")
  const pm = vscSrc("src/extension/panel-messages-settings.mjs")
  assert.ok(pm.includes("format: msg.format, proxy: msg.proxy"), "handleTestProvider 透传 proxy")
  assert.ok(pm.includes("key: msg.key, proxy: msg.proxy"), "handleAddProvider 链携 proxy")
  // 旧「websearch/fetch」相抵句零残留（§1.6⑤ 携带项）
  assert.ok(!s.includes("`config.proxy.web` 只管 websearch/fetch"), "相抵句已改述")
})

// ─── V9 首启交棒（源锁 + 行为腿）────────────────────────────────────────────────────

test("V9 首启交棒：源锁（新调用名 ∥ _toggleAddForm 零残留）；行为腿 ⇒ 面板开 + 框两件 ∥ 同拍序末位焦点 #pa-type", async () => {
  clearAll(); setPresets()
  // 源锁
  assert.ok(vscSrc("webview/onboarding.js").includes("window._openAddProviderDialog?.("), "交棒调用 = window._openAddProviderDialog?.()")
  for (const f of readdirSync(new URL("webview/", VSC))) {
    if (!f.endsWith(".js")) continue
    assert.ok(!vscSrc(`webview/${f}`).includes("_toggleAddForm"), `${f}：_toggleAddForm 零残留`)
  }
  // 行为腿：装真档链（新档 + onboarding.js）
  const { ctx } = await import(new URL("webview/state.js", VSC).href)
  const { initOnboarding } = await import(new URL("webview/onboarding.js", VSC).href)
  let opened = 0
  initOnboarding({
    openSettings: () => { // 真 openSettings 的 +50ms 焦点定时器（同拍序判别面）
      opened += 1
      setTimeout(() => { const firstBtn = byId("settings-panel").querySelector("button, input"); if (firstBtn) firstBtn.focus() }, 50)
    },
  })
  ctx.welcomeProvider.value = "custom"
  ctx.welcomeKey.value = "sk-welcome"
  ctx.welcomeSaveBtn.fire("click")
  assert.equal(opened, 1, "_openSettings 调 1")
  assert.ok(surface().backdrop, "首启交棒 ⇒ 框幕在场（可开框）")
  assert.ok(surface().card, "首启交棒 ⇒ 卡在场")
  drainTimers()
  assert.equal(_focused.at(-1)?.id, "pa-type", "两定时器同拍序 ⇒ 末位焦点 = #pa-type（框后调度）")
  clearAll()
})

// ─── V10 行删除符（#1034）──────────────────────────────────────────────────────────

test("V10 行删除符腿（#1034）：两处删除钮字面 = ✕ ∥ 档内 `−` 零残留（注释随述）", () => {
  const prov = vscSrc("webview/settings-providers.js")
  assert.ok(prov.includes('delBtn.textContent = "✕"'), "编辑行取消重建位 = ✕")
  assert.match(prov, />✕<\/button>/, "卡 HTML 行删除钮 = ✕")
  assert.equal((prov.match(/\u2212/g) ?? []).length, 0, "settings-providers.js `−` 零残留（含注释）")
  const dlg = vscSrc("webview/settings-provider-dialog.js")
  assert.equal((dlg.match(/\u2212/g) ?? []).length, 0, "弹窗档 `−` 零残留")
  // 桌面族不动（不在本舱域）＋ 模型菜单 footer 的 − 属另一面（locale 件——零触）
  assert.equal(EN["model.removeProvider"], "\u2212 Remove provider…", "model.removeProvider 保留原符（非行删除符面）")
})

// ─── V11 遮罩隔离（#12 · D12）─────────────────────────────────────────────────────

test("V11 遮罩隔离腿（D12）：框在场 ⇒ 确认族开 ∥ 关两向均不触框组（独立类不入帚扫域）∧ 确认件可叠于框上", async () => {
  clearAll(); setPresets()
  const { showConfirmPopover, closeConfirmPopover } = await import(new URL("webview/settings-widgets.js", VSC).href)
  openDialog()
  const card = surface().card
  // ① 确认族关向（帚扫直呼）⇒ 框 ∥ 幕零动
  closeConfirmPopover()
  assert.equal(surface().card, card, "closeConfirmPopover ⇒ 卡零动")
  assert.ok(surface().backdrop, "closeConfirmPopover ⇒ 幕零动")
  // ② 确认族开向 ⇒ 框 ∥ 幕零动 ∧ 确认两件到场（可叠于框上）
  showConfirmPopover({ text: "x", yesLabel: "Y", noLabel: "N", onConfirm: () => {} })
  assert.equal(surface().card, card, "确认开 ⇒ 卡零动")
  assert.ok(surface().backdrop, "确认开 ⇒ 幕零动")
  assert.ok(bodyFind("auto-confirm"), "确认件在场（叠于框上）")
  assert.ok(bodyFind("auto-backdrop"), "确认遮罩在场")
  // ③ 确认关 ⇒ 框仍在（两族独立生命周期）
  closeConfirmPopover()
  assert.equal(bodyFind("auto-confirm"), null, "确认件清")
  assert.ok(surface().card, "框仍在（独立类）")
  assert.ok(surface().backdrop)
  clearAll()
})

// ─── V12 ∥ V13（收口轮 · 父侧裁 2026-10-07）：② 保存徽标门控 ∥ ③ 拒存保在编输入 ───────────

test("V12 保存徽标门控腿（收口轮②）：本地拒（model 空 ∥ baseURL 空）⇒ 零闪「✓ 已保存」∥ 受理径 ⇒ 闪（既有词/样式）", () => {
  clearAll(); setPresets()
  const badge = byId("agent-saved-badge")
  badge.classList.remove("visible")
  // ① 拒径（model 空）：零发 + 徽标零闪（修前红：click 未门控 ⇒ 早退径仍闪）
  openDialog(); setType("custom")
  byId("pa-name").value = "my-prov"; byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.filter((m) => m.type === "addProvider").length, 0, "model 空 ⇒ 零发")
  assert.equal(badge.classList.contains("visible"), false, "拒径 ⇒ 徽标零闪")
  // ② 拒径（baseURL 空）：零发 + 徽标零闪
  byId("pa-url").value = ""; byId("pa-model").value = "m"
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.filter((m) => m.type === "addProvider").length, 0, "baseURL 空 ⇒ 零发")
  assert.equal(badge.classList.contains("visible"), false, "拒径 ⇒ 徽标零闪（baseURL 空）")
  // ③ 受理径：补全 ⇒ 发 + 闪（词 ∥ 样式复用——零新词）
  byId("pa-url").value = "https://my.example.com/v1"
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.filter((m) => m.type === "addProvider").length, 1, "受理径 ⇒ 发")
  assert.equal(badge.classList.contains("visible"), true, "受理径 ⇒ 徽标闪")
  assert.equal(badge.textContent, EN["settings.autoSaved"], "徽标词 = settings.autoSaved（既有词）")
  badge.classList.remove("visible")
  clearAll()
})

test("V13 拒存保在编输入腿（收口轮③）：缺 baseURL ⇒ 零发 ∥ 不关框 ∥ 在编值保留 ∥ 补填 ⇒ 原值携发可重存", () => {
  clearAll(); setPresets()
  openDialog(); setType("custom")
  byId("pa-name").value = "keep-prov"; byId("pa-model").value = "keep-model"
  byId("pa-key").value = "sk-keep"; byId("pa-proxy").checked = true
  byId("pa-url").value = ""
  byId("pa-save-btn").fire("click")
  assert.equal(postSink.filter((m) => m.type === "addProvider").length, 0, "缺 baseURL ⇒ 零发（不落地）")
  assert.ok(surface().card, "拒存 ⇒ 框仍在（不关框）")
  assert.equal(byId("pa-conn-status").textContent, EN["settings.providerUrlRequired"], "拒因词 = settings.providerUrlRequired（既有词）")
  assert.equal(byId("pa-name").value, "keep-prov", "在编值保留：名")
  assert.equal(byId("pa-model").value, "keep-model", "在编值保留：模型")
  assert.equal(byId("pa-key").value, "sk-keep", "在编值保留：key")
  assert.equal(byId("pa-proxy").checked, true, "在编值保留：proxy 勾选")
  // 即改即重存：补 baseURL ⇒ 原在编值随载荷发出（受理 ⇒ 关框——既有径）
  byId("pa-url").value = "https://keep.example.com/v1"
  byId("pa-save-btn").fire("click")
  const sent = postSink.filter((m) => m.type === "addProvider")
  assert.equal(sent.length, 1, "补填 ⇒ 可重存")
  assert.equal(sent[0].custom.name, "keep-prov", "原值携发：名")
  assert.equal(sent[0].custom.model, "keep-model", "原值携发：模型")
  assert.equal(sent[0].custom.baseURL, "https://keep.example.com/v1", "补填件入载荷")
  assert.equal(sent[0].key, "sk-keep", "原值携发：key")
  assert.equal(sent[0].proxy, true, "原值携发：proxy 勾选")
  assert.equal(surface().card, null, "受理 ⇒ 关框（发消息后关——既有径）")
  clearAll()
})
