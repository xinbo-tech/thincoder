/**
 * views-settings.test.mjs — T-DSK7 / T-DSK8 / T-DSK10 / T-DSK31 视图面用例（`docs/desktop/design/PROJECT.md:244` 指派面 =
 * 「表单构树与通道接线」；T-DSK8「切换语言」机检 = `settings` 档（键往返）+ 本档**词表重刷**）：① 四段面（`SECTIONS` 序 ·
 * 三态 · 表外段态 ⇒ `none` · 缺供给零假造 · 退场 = 容器清空 · 失败码出词）；② 面头语言控件（锚序 · 两向词面）；③ 两形表单
 * （字段名 = 载荷键 ⇒ 提交端 `FormData` 直取）；④ 校验 / 移除 / 采用 / MCP 出口（携名 · 零乐观写 · 零静默）；⑤ 词表重刷
 * （一次点按 = 一次写 ⇒ 同回带 ⇒ `initDict` 重刷）；⑥ 信息行两读（D10 视图面 —— 用例号 T-DSK11 · `PROJECT.md:191`：零 `key` 载荷 · 并行 · 一读失败不遮另一）；⑦ 档位控件（T-DSK31 · `docs/desktop/design/UI.md` §1 批 B 注 5 · `docs/desktop/design/IPC.md` §2 注 9：现值 = 行 `effort` 离线投影 · 选项集与表外现值 · 陈旧面两拒 · 零节点 · 不可 `off` · `mtime-conflict` 直传）。
 * 纪律：假 DOM 房屋样式（`selfCheck` 先行 —— 载体不自证即假绿源）+ 词面哨兵缝（树内文本判键面）；零 CJK 源面与词表键齐两面归
 * `test/views-chrome.test.mjs` U51（扫描集随本批随动）⇒ 本档不重复实现同规则（单源）；夹具 = `test/views-harness.mjs`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { locale, t } from "../renderer/i18n.mjs"
import { FORMATS, REASON_WORD, SECTIONS, STATE_WORD, channelFormTree, mountSettings, reasonWord, settingsModel, settingsTree } from "../renderer/views/settings.mjs"
import { SETTINGS_SLOT } from "../renderer/mount-settings.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import { clickOn, mountFace, nodes, sentinel, slotOf, stateOf, supplyFace, texts, useSentinels } from "./views-harness.mjs"

// ─── ① 四段面三态（T-DSK7）────────────────────────────────────

test("T-DSK7: 四段三态 ∧ 零假数据 ∧ 缺 handlers ⇒ disabled ∧ 失败码出词", (ctx) => {
  useSentinels(ctx)
  const anyHandlers = new Proxy({}, { get: () => () => {} }) // 全出口在场（disabled 面另例）
  const open = (over, root) => settingsTree(settingsModel(stateOf({ open: true, ...over }, root)), anyHandlers)
  const loading = open({ providers: { state: "loading", presets: [], providers: [] } })
  const ready = open({
    providers: {
      state: "ready", presets: [{ name: "openai" }],
      providers: [{ name: "p1", model: "m1", hasKey: true, maskedKey: "sk-x", active: true }, { name: "p2", model: null, hasKey: false, active: false }],
    },
    verify: { kind: "ok", count: 2 },
    model: { state: "ready", provider: "p1", current: "p1:m1", models: ["m1", "m2"] },
    agent: { state: "ready", fields: [{ path: "agent.maxTurns", kind: "number", value: 12 }, { path: "agent.key", kind: "string", value: "••", sensitive: true }] },
    mcp: { state: "ready", servers: [{ name: "fs", kind: "command", summary: "npx fs" }, { name: "web", kind: "url", summary: "https://x" }] },
    notice: { scope: "providers", reason: "mtime-conflict" },
  })
  const blank = open({
    providers: { state: "ready", presets: [], providers: [] },
    verify: { kind: "fail", reason: "boom" },
    model: { state: "ready", provider: null, current: null, models: [] },
    agent: { state: "ready", fields: [] },
    mcp: { state: "weird", servers: [] },
  }, { locale: "zh" })
  const sections = (tree) => nodes(tree).filter((node) => node.props?.class === "settings-section")
  const actions = (tree) => nodes(tree).filter((node) => node.props?.["data-action"] !== undefined)
  const disabled = (tree) => actions(tree).filter((node) => node.props.disabled === true)
  const formsIn = (tree) => nodes(tree).filter((node) => node.props?.["data-form"] !== undefined)

  assert.deepEqual(sections(ready).map((node) => node.props["data-section"]), SECTIONS.map((s) => s.name), "四段序 = SECTIONS（闭集单源）")
  assert.deepEqual(sections(loading).map((node) => node.props["data-state"]), ["loading", "none", "none", "none"], "段态直读（缺供给 ⇒ none）")
  assert.deepEqual(sections(blank).map((node) => node.props["data-state"]), ["ready", "ready", "ready", "none"], "表外段态 ⇒ none（不猜）")
  const stateWords = (tree) => nodes(tree).filter((node) => node.props?.["data-state-word"] !== undefined).map((node) => node.children[0])
  assert.deepEqual(stateWords(loading), [sentinel(STATE_WORD.loading), sentinel(STATE_WORD.none), sentinel(STATE_WORD.none), sentinel(STATE_WORD.none)], "两态出词 = 词表键")
  assert.deepEqual(stateWords(ready), [], "ready ⇒ 零状态词（行内容取而代之）")
  assert.deepEqual(formsIn(sections(loading)[0]), [], "loading 段零表单（不落半形）")
  assert.deepEqual(formsIn(sections(loading)[3]).map((node) => node.props["data-form"]), ["mcp"], "非 loading 段表单照出（形面 ≠ 段态）")
  assert.deepEqual(formsIn(ready).map((node) => node.props["data-form"]), ["preset", "custom", "mcp"], "ready ⇒ 两形表单 + MCP 表单")
  assert.equal(settingsTree(settingsModel(stateOf({ open: false }))).children.length, 0, "open 假 ⇒ 零子节点（退场 = 容器清空 —— 非 hidden）")
  assert.equal(nodes(blank).filter((node) => node.props?.["data-provider"] !== undefined).length, 0, "零渠道行 ⇒ 零节点（禁假造）")
  assert.equal(nodes(blank).filter((node) => node.props?.["data-model"] !== undefined).length, 0, "零候选 ⇒ 零行")
  assert.equal(nodes(blank).filter((node) => node.props?.["data-empty"] !== undefined).length, 1, "ready 而零候选 ⇒ 空态词恰一")
  assert.deepEqual(disabled(blank).map((node) => node.props["data-action"]), ["settings:saveAgent"], "零可编辑字段 ⇒ 保存控件 disabled（非死控）")
  const row = nodes(ready).find((node) => node.props?.["data-provider"] === "p1")
  assert.equal(row.props["data-active"], "", "激活行带 data-active（形 = 空串）")
  assert.equal(nodes(row).find((node) => node.props?.["data-key"] !== undefined).props["data-key"], "masked", "键面 = 遮罩值（明文零下发）")
  assert.equal(nodes(row).find((node) => node.props?.["data-action"] === "settings:verify").props["data-name"], "p1", "校验控件携名（值 = 行名）")
  assert.deepEqual(disabled(ready).map((node) => node.props["data-action"]), ["settings:useModel", "settings:saveAgent"], "disabled 面 = 当前模型行采用控件（m1）+ agent 保存键（具名十键全在场 ⇒ 泛化面零可编辑行 ⇒ 保存键非死控 disabled）")
  assert.deepEqual(disabled(settingsTree(settingsModel(stateOf({ open: true })), {})).map((node) => node.props["data-action"]), ["settings:lang", "settings:close", "settings:addPreset", "settings:addCustom", "settings:saveAgent", "settings:addMcp"], "缺 handlers ⇒ 全控件 disabled（含两形提交）")

  const data = new Set([...FORMATS, "openai", "p1", "p2", "m1", "m2", "p1:m1", "sk-x", "agent.maxTurns", "12", "agent.key", "••", "fs", "npx fs", "web", "https://x"])
  for (const tree of [loading, ready, blank]) {
    for (const node of nodes(tree)) assert.ok(node.props?.["aria-label"] === undefined || /^⟦.*⟧$/.test(node.props["aria-label"]), `aria-label 须为词表键值（实 = ${node.props?.["aria-label"]}）`)
    for (const text of texts(tree)) assert.ok(/^⟦.*⟧$/.test(text) || data.has(text), `树内文本须为词表键值或数据串（实 = ${text}）`)
  }
  for (const [code, key] of Object.entries(REASON_WORD)) assert.equal(reasonWord(code), sentinel(key), `失败码出词：${code}`)
  assert.equal(reasonWord("boom"), "boom", "表外（核错误串）原样直传 —— 不吞、不自造码")
  assert.equal(reasonWord(null), null, "缺 ⇒ 零节点")
})

// ─── ② 面头语言控件（T-DSK8）──────────────────────────────────

test("T-DSK8: 面头语言控件（锚 settings:lang 在关闭控件左侧 · 两向 · 目标语自名）", (ctx) => {
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  ctx.after(() => fake.restore())
  useSentinels(ctx)
  const seen = []
  const handlers = { onToggleLang: (target) => seen.push(target), onCloseSettings: () => seen.push("close") }
  const view = (root, given = handlers) => {
    const node = fake.element("section")
    mountSettings(node, stateOf({ open: true }, root), given)
    return node
  }
  const langOf = (node) => node.querySelector('[data-action="settings:lang"]')
  const en = view({ locale: "en" })
  const zh = view({ locale: "zh" })
  assert.equal(langOf(en).getAttribute("data-lang"), "zh", "当前语 en ⇒ 目标语 zh（两键闭集）")
  assert.equal(langOf(zh).getAttribute("data-lang"), "en", "当前语 zh ⇒ 目标语 en（两向）")
  assert.equal(langOf(view({ locale: "xx" })).getAttribute("data-lang"), "zh", "表外语 ⇒ 默语对（不猜）")
  assert.deepEqual(langOf(en).parent.children.map((child) => child.getAttribute("data-action")).filter((value) => value !== null), ["settings:lang", "settings:close"], "语言控件在关闭控件**左侧**（头内锚序 = 机检面）")
  assert.equal(langOf(en).textContent, t("settings.lang.zh"), "标签 = 词表键（随当前语言出串 —— 目标语自名）")
  assert.equal(langOf(zh).textContent, t("settings.lang.en"), "另一语同判（两向词面）")
  const close = en.querySelector('[data-action="settings:close"]')
  assert.deepEqual(close.children, [], "关闭控件零子节点（字形住 settings.css content）")
  assert.equal(close.getAttribute("aria-label"), t("settings.close"), "关闭控件词面走 aria-label（锚名逐字 settings:close）")
  clickOn(fake, langOf(en))
  clickOn(fake, close)
  assert.deepEqual(seen, ["zh", "close"], "点按回代：语言 ⇒ 目标语（写 locale）· 关闭 ⇒ 退场出口")
  const bare = langOf(view({ locale: "en" }, {}))
  assert.equal(bare.getAttribute("disabled"), "", "缺 handlers ⇒ 语言控件 disabled（非死控）")
  assert.equal(fake.fire(bare, "click"), 0, "disabled 面零监听（不吞键）")
  const closed = fake.element("section")
  const hostSlot = slotOf(SETTINGS_SLOT)
  closed.setAttribute("data-slot", hostSlot)
  mountSettings(closed, stateOf({ open: false }), handlers)
  assert.equal(closed.getAttribute("data-slot"), hostSlot, "薄挂载：宿主已有属性保留（不动宿主锚）")
  assert.equal(closed.getAttribute("data-state"), "closed", "根锚复制到宿主：data-settings 在场 ∧ data-state = closed")
  assert.equal(closed.childNodes.length, 0, "open 假 ⇒ 宿主零子节点（退场 = 清空，非 hidden）")
})

// ─── ③ 两形表单（构树 ∧ 提交载荷键往返 · T-DSK7）──────────────────

test("T-DSK7: 两形表单（字段名 = 载荷键 ⇒ 提交端 FormData 直取 · 空名零发送）", async (ctx) => {
  const names = (form) => nodes(form).map((node) => node.props?.name).filter((value) => typeof value === "string")
  const preset = channelFormTree({ shape: "preset", presets: [{ name: "openai" }], formats: FORMATS })
  const custom = channelFormTree({ shape: "custom", formats: FORMATS, submitKey: "wizard.save" })
  const anchor = (tree, action) => nodes(tree).find((node) => node.props?.["data-action"] === action)
  assert.deepEqual(names(preset), ["shape", "name", "key", "active"], "预设形字段集 = 通道载荷键（零额外面）")
  assert.deepEqual(names(custom), ["shape", "name", "baseURL", "model", "format", "key", "active"], "自定形字段集 = 通道载荷键")
  assert.deepEqual(nodes(preset).filter((node) => node.tag === "option").map((node) => node.props.value), ["openai"], "预设选择器 = 预置表（值 = 名）")
  assert.deepEqual(nodes(custom).filter((node) => node.tag === "option").map((node) => node.props.value), [...FORMATS], "协议域 = FORMATS（闭集单源）")
  assert.deepEqual(anchor(preset, "settings:addPreset").children, [t("settings.providers.addPreset")], "预设形提交锚 = settings:addPreset")
  assert.deepEqual(anchor(custom, "settings:addCustom").children, [t("wizard.save")], "提交键可覆盖（向导复用同一构造 —— 单一 owner）")
  assert.equal(nodes(channelFormTree({ shape: "preset" })).find((node) => node.props?.["data-action"]).props.disabled, true, "缺 onSubmit ⇒ 提交控件 disabled")

  const { fake, host, root } = await mountFace(ctx, supplyFace().answer)
  const el = (selector) => {
    const node = root.querySelector(selector)
    assert.notEqual(node, null, `出口控件在场（零命中即红）：${selector}`)
    return node
  }
  const click = (action, values = {}) => {
    const node = el(`[data-action="${action}"]`)
    for (const [name, value] of Object.entries(values)) node.closest("form").querySelector(`[name="${name}"]`).value = value
    clickOn(fake, node)
  }
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  const lastSave = () => host.call("provider:save").at(-1) // 调用录随写随增 ⇒ 每次现查（零陈旧快照）
  click("settings:addPreset")
  await drain()
  assert.deepEqual(lastSave()[1], { name: "openai", shape: "preset", preset: "openai", active: false }, "预设形载荷 = 表单字段值（空密钥 ⇒ 零 key 键）")
  click("settings:addPreset", { key: "sk-1" })
  await drain()
  assert.equal(lastSave()[1].key, "sk-1", "表单键 = 载荷键（密钥入载荷 —— 零值搬运）")
  click("settings:addCustom", { name: "mine", baseURL: "https://api", model: "m1" })
  await drain()
  assert.deepEqual(lastSave()[1], { name: "mine", shape: "custom", baseURL: "https://api", model: "m1", format: "openai", active: false }, "自定形载荷 = 表单字段值（协议取现选）")
  const logged = []
  const previous = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  ctx.after(() => { console.error = previous })
  click("settings:addCustom", { name: "" })
  await drain()
  assert.equal(host.call("provider:save").length, 3, "空名 ⇒ 零发送（端侧形判）")
  assert.equal(el("[data-notice]").getAttribute("data-scope"), "providers", "失败面落位 = 段级（段标可读）")
  assert.equal(el("[data-notice]").textContent, t("settings.section.providers") + t("settings.reason.invalidShape"), "失败面 = 段标 + 出词串（不吞）")
  assert.equal(logged.some((line) => line.includes("provider:save")), true, "零静默：失败面同时记错")
})

// ─── ④ 校验 / 移除 / 采用 / MCP 出口（T-DSK7 / T-DSK10）────────────

test("T-DSK10: 校验 / 移除 / 采用 / MCP 出口（携名 · 零乐观写 · 畸形 JSON ⇒ 零发送）", async (ctx) => {
  const face = supplyFace()
  const { fake, host, store, root } = await mountFace(ctx, face.answer)
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  const el = (selector) => {
    const node = root.querySelector(selector)
    assert.notEqual(node, null, `出口控件在场（零命中即红）：${selector}`)
    return node
  }
  el('[data-action="settings:verify"]')
  clickOn(fake, el('[data-action="settings:verify"]'))
  await drain()
  assert.deepEqual(host.call("provider:verify").at(-1), ["provider:verify", { name: "p1" }], "校验携行名（值 = 行名 —— 与行锚同源）")
  assert.deepEqual(store.get().settings.verify, { kind: "ok", count: 2, reason: null }, "校验通过 ⇒ 读数落段（reason 归零 —— 零残留失败串）")
  assert.equal(el('[data-verify="ok"]').textContent, t("settings.providers.verify.ok", { count: 2 }), "通过面 = 词表键（${count} 插值面）")
  face.held.verify = { ok: false, reason: "boom" }
  clickOn(fake, el('[data-action="settings:verify"]'))
  await drain()
  assert.notEqual(el('[data-verify="fail"]'), null, "失败面两态之一在场（失败可见）")
  assert.equal(el('[data-model="m1"]').querySelector('[data-action="settings:useModel"]').getAttribute("disabled"), "", "当前项 = 非死控 disabled（零动作）")
  clickOn(fake, el('[data-model="m2"]').querySelector('[data-action="settings:useModel"]'))
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { patch: { defaultModel: "p1:m2" } }], "采用出口写 defaultModel 复合串（键面判归核）")
  const readsBefore = host.call("provider:list").length
  face.held.remove = { ok: false, reason: "unavailable" }
  clickOn(fake, el('[data-action="settings:removeProvider"]'))
  await drain()
  assert.deepEqual(host.call("provider:remove").at(-1), ["provider:remove", { name: "p1" }], "移除携行名")
  assert.equal(host.call("provider:list").length, readsBefore, "失败 ⇒ 零重读（零乐观写 —— 不落半态）")
  assert.notEqual(root.querySelector('[data-provider="p1"]'), null, "失败 ⇒ 零乐观摘项（行不动）")
  assert.equal(el("[data-notice]").textContent, t("settings.section.providers") + t("settings.reason.unavailable"), "失败面可见（核文案直传 ⇒ 表内出词）")
  face.held.remove = { ok: true }
  face.held.rows = []
  clickOn(fake, el('[data-action="settings:removeProvider"]'))
  await drain()
  assert.equal(root.querySelector('[data-provider="p1"]'), null, "成功 ⇒ 重读本段（行随供给面撤除）")
  assert.equal(root.querySelector("[data-notice]"), null, "成功 ⇒ 失败面清位（两向：失败可见 / 成功零残留）")
  const fill = (values) => {
    const form = el('[data-form="mcp"]')
    for (const [name, value] of Object.entries(values)) form.querySelector(`[name="${name}"]`).value = value
  }
  const before = host.call("mcp:save").length
  clickOn(fake, el('[data-action="settings:addMcp"]'))
  await drain()
  assert.equal(host.call("mcp:save").length, before, "空名 ⇒ 零发送")
  fill({ name: "fs", config: "not json" })
  clickOn(fake, el('[data-action="settings:addMcp"]'))
  await drain()
  assert.equal(host.call("mcp:save").length, before, "畸形 JSON ⇒ 零发送（解析归提交端）")
  fill({ name: "fs", config: '{"command":"npx"}' }) // 重渲即重置（零草稿切片）⇒ 每次现填
  clickOn(fake, el('[data-action="settings:addMcp"]'))
  await drain()
  assert.deepEqual(host.call("mcp:save").at(-1), ["mcp:save", { name: "fs", config: { command: "npx" } }], "MCP 载荷 = 名 + 解析后配置对象")
  const mcpReads = host.call("mcp:list").length
  face.held.removeMcp = { ok: false, reason: "unavailable" }
  clickOn(fake, el('[data-mcp="fs"]').querySelector('[data-action="settings:removeMcp"]'))
  await drain()
  assert.deepEqual(host.call("mcp:remove").at(-1), ["mcp:remove", { name: "fs" }], "MCP 移除携行名")
  assert.equal(host.call("mcp:list").length, mcpReads, "失败 ⇒ 零重读（零乐观写 —— 不落半态）")
  assert.notEqual(root.querySelector('[data-mcp="fs"]'), null, "失败 ⇒ 零乐观摘项（行不动）")
  assert.equal(el("[data-notice]").getAttribute("data-scope"), "mcp", "失败面落位 = mcp 段")
  assert.equal(el("[data-notice]").textContent, t("settings.section.mcp") + t("settings.reason.unavailable"), "失败面可见（段标 + 出词串）")
  face.held.removeMcp = { ok: true }
  face.held.servers = []
  clickOn(fake, el('[data-mcp="fs"]').querySelector('[data-action="settings:removeMcp"]'))
  await drain()
  assert.equal(root.querySelector('[data-mcp="fs"]'), null, "成功 ⇒ 重读本段（行随供给面撤除）")
  assert.equal(root.querySelector("[data-notice]"), null, "成功 ⇒ 失败面清位（两向：失败可见 / 成功零残留）")
})

// ─── ⑤ 词表重刷（T-DSK8）─────────────────────────────────────

test("T-DSK8: 词表重刷（切换一次 = 一次写 ⇒ 同回带 ⇒ initDict 重刷 · 两向往返 · 写失败零乐观写）", async (ctx) => {
  let reply = { ok: true, dict: {}, configured: true }
  const { fake, host, store, root } = await mountFace(ctx, (channel, payload) => (channel === "config:write"
    ? { ...reply, locale: payload.patch.locale }
    : { ok: true, presets: [], providers: [], active: null, fields: [], servers: [] }))
  const label = () => root.querySelector('[data-action="settings:lang"]')
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  assert.equal(locale(), "en", "初始语言（词表置位面）")
  clickOn(fake, label())
  await drain()
  assert.deepEqual(host.call("config:write"), [["config:write", { patch: { locale: "zh" } }]], "切换一次 = 一次写（免二跳）")
  assert.equal(locale(), "zh", "同回带 ⇒ 词表重刷（current 落新语）")
  assert.equal(store.get().locale, "zh", "语言切片随动（挂载面订阅 locale 切片）")
  assert.equal(store.get().settings.configured, true, "同回带 configured 落闸（免二次读）")
  assert.equal(label().getAttribute("data-lang"), "en", "重挂：目标语翻转（词面随动）")
  assert.equal(label().textContent, t("settings.lang.en"), "标签 = 新语词面（两语各一键）")
  clickOn(fake, label())
  await drain()
  assert.deepEqual(host.call("config:write").at(-1), ["config:write", { patch: { locale: "en" } }], "回切 = 又是一次写")
  assert.equal(locale(), "en", "两向往返闭环")
  assert.equal(label().textContent, t("settings.lang.zh"), "标签回原语词面")
  reply = { ok: false, reason: "unavailable" }
  clickOn(fake, label())
  await drain()
  assert.equal(locale(), "en", "写失败 ⇒ 零乐观写（词面不动）")
  assert.equal(store.get().settings.notice.reason, "unavailable", "失败面可见（面板级 —— 零静默）")
})

// ─── ⑥ 两读（T-DSK11 · D10 视图面）────────────────────────────

test("T-DSK11: 两读（零 key 载荷 · 并行 · 一读失败不遮另一 —— 两向）", async (ctx) => {
  const cases = [
    [{ ok: true, counts: { pool: 3, tech: 1, aged: 0 }, thresholdReached: true }, { ok: true, phase: "initial-dev" }, { reads: ["3", "1", "0"], threshold: true, phase: sentinel("info.phase.initialDev"), notice: null }],
    [{ ok: false, reason: "unavailable" }, { ok: true, phase: "production" }, { reads: [null, null, null], threshold: false, phase: sentinel("info.phase.production"), notice: sentinel("settings.reason.unavailable") }],
    [{ ok: true, counts: { pool: 2, tech: 0, aged: 0 } }, { ok: false, reason: "boom" }, { reads: ["2", "0", "0"], threshold: false, phase: null, notice: "boom" }],
  ]
  for (const [ledger, batch, expect] of cases) {
    let replied = false // 台账读回执已归（回执闸 = 一次 setImmediate）
    let earlyBatch = false // 相位读在台账读回执**前**已发起 ⇒ 同 tick 齐发（串行 await 实现下该窗恒零发起）
    const { host, store, info } = await mountFace(ctx, (channel) => {
      if (channel === "ledger:read") return new Promise((resolve) => setImmediate(() => { replied = true; resolve(ledger) }))
      if (channel === "batch:status") { if (!replied) earlyBatch = true; return batch }
      return { ok: true, presets: [], providers: [], active: null, fields: [], servers: [] }
    })
    assert.deepEqual(host.call("ledger:read"), [["ledger:read"]], "台账读零载荷（不随会话走 —— 无 key）")
    assert.deepEqual(host.call("batch:status"), [["batch:status"]], "相位读零载荷（一参调用 = 零载荷）")
    assert.equal(earlyBatch, true, "并行（同 tick 齐发）：相位读在台账读回执前已发起（串行 await 实现 ⇒ 该窗零发起即红）")
    await new Promise((resolve) => setImmediate(resolve))
    const read = (name) => info.querySelector(`[data-read="${name}"]`)
    const value = (name) => read(name)?.children.at(-1).textContent ?? null
    assert.deepEqual(["pool", "tech", "aged"].map((name) => value(name)), expect.reads, "三读数族闭集（序固定 · 缺 ⇒ 零节点 —— 禁假造）")
    assert.equal(read("threshold") !== null, expect.threshold, "超阈标判据 = 显式真")
    assert.equal(value("phase"), expect.phase, "相位读数两向（成功 ⇒ 词面 · 失败 ⇒ 零节点）")
    assert.equal(info.querySelector("[data-notice]")?.textContent ?? null, expect.notice, "失败串直传（表内出词 / 表外原样）—— 读数不被遮蔽")
    assert.equal(store.get().projectInfo.notice === null, expect.notice === null, "失败面落 projectInfo（非设置面失败面）")
  }
})

// ─── ⑦ 档位控件（T-DSK31 · UI.md §1 批 B 注 5 · IPC.md §2 设置族注 9）─────────
//   本档落 ② 现值投影与选项集 / ③ 陈旧面两拒 / ④ 零节点 / ⑤ 不可 `off` / ⑥ `mtime-conflict` 直传；
//   ① 写三径 + 写后投影恒等归 `test/settings.test.mjs`（上游档 —— 单源，本档零重复实现）。

test("T-DSK31: 档位现值与选项集（行 `effort` 离线投影 · Auto → off → 枚举 · `none` 滤除 + 去重 · 表外现值自成一选项）", (ctx) => {
  useSentinels(ctx)
  const anyHandlers = new Proxy({}, { get: () => () => {} })
  const face = (effort) => ({
    defaultModel: "p1:m1",
    providers: { state: "ready", presets: [], providers: [{ name: "p1", model: "m1", effort, hasKey: true, active: true }] },
    model: { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1", effortEnum: ["low", "high", "none", "high"], thinkOff: true }] },
  })
  const rowOf = (settings) => nodes(settingsTree(settingsModel(stateOf({ open: true, ...settings })), anyHandlers)).find((node) => node.props?.["data-tier"] !== undefined) ?? null
  const options = (settings) => nodes(rowOf(settings)).filter((node) => node.tag === "option")
  const values = (settings) => options(settings).map((node) => node.props.value)
  const picked = (settings) => options(settings).filter((node) => node.props.selected === true).map((node) => node.props.value)

  assert.deepEqual(settingsModel(stateOf({ open: true, ...face("high") })).model.tier, {
    provider: "p1", model: "m1", current: "high", effortEnum: ["low", "high", "none", "high"], thinkOff: true,
  }, "档位读数 = `defaultModel` 段解 + 行 `effort` 投影 + 模型段元素面（离线零探针）")
  assert.equal(nodes(settingsTree(settingsModel(stateOf({ open: true, ...face("high") })), anyHandlers)).filter((node) => node.props?.["data-tier"] !== undefined).length, 1, "四段内恰一档位控件（零副本）")
  assert.deepEqual(values(face("high")), ["auto", "off", "low", "high"], "选项集 = Auto → off → 枚举（`none` 滤除 · 重复成员去重 · 现值已在集内 ⇒ 不追加）")
  assert.deepEqual(options(face("high")).map((node) => node.children[0]), [sentinel("effort.auto"), sentinel("effort.off"), "low", "high"], "词面：两意图档出词 · 枚举档 = 字面值（不吞不改写）")
  assert.deepEqual(picked(face("high")), ["high"], "现选 = 行 `effort` 投影（控件值 ⇒ 盘上真值）")
  assert.equal(rowOf(face("high")).props["data-tier"], "high", "行锚携现值（设置面读数单源 = 行面）")

  assert.deepEqual(values(face("turbo")), ["auto", "off", "low", "high", "turbo"], "表外现值 ⇒ 自成一选项（不吞）")
  assert.deepEqual(picked(face("turbo")), ["turbo"], "表外现值 = 现选（零改写 —— 核侧拒面可见）")
  assert.equal(rowOf(face("turbo")).props["data-tier"], "turbo", "行锚 = 表外现值原样（形面零改写）")
  assert.deepEqual(values(face(undefined)), ["auto", "off", "low", "high", ""], "行无 `effort` ⇒ 空串项在场（禁吞 —— 非静默取候选首项）")
  assert.deepEqual(picked(face(undefined)), [""], "空串项 = 现选（条目在场即现选在场）")
  assert.deepEqual(picked(face(7)), [""], "行 `effort` 非串 ⇒ 归 `\"\"`（表外现值不吞）")
})

test("T-DSK31: 陈旧面两拒 —— `bad-level` ∥ `unknown-provider`（载荷照发 · 零乐观写 · 控件回退回执前值）", async (ctx) => {
  const face = supplyFace()
  const write = { reply: { ok: false, reason: "bad-level" } }
  const { fake, host, root } = await mountFace(ctx, (channel, payload) => (channel === "settings:agent" && payload?.tier !== undefined ? write.reply : face.answer(channel, payload)))
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  const row = () => {
    const node = root.querySelector("[data-tier]")
    assert.notEqual(node, null, "档位行在场（零命中即红）")
    return node
  }
  const control = () => {
    const node = row().querySelector(`[aria-label="${t("settings.model.tier")}"]`)
    assert.notEqual(node, null, "档位控件在场（零命中即红）")
    return node
  }
  assert.equal(row().getAttribute("data-tier"), "high", "回执前值 = 行 `effort` 投影（挂载面现值）")
  assert.equal(control().value, "high", "控件现选 = 选中项值")
  assert.deepEqual(control().children.map((node) => node.getAttribute("value")), ["auto", "off", "low", "high"], "选项集在场（m1：枚举 low / high + off）")
  assert.equal(root.querySelector("[data-notice]"), null, "初始零失败面")
  const reads = host.call("provider:list").length
  for (const [reason, level] of [["bad-level", "low"], ["unknown-provider", "off"]]) {
    write.reply = { ok: false, reason }
    assert.equal(fake.fire(control(), "change", { target: { value: level } }), 1, "档位控件真注册（`change` 面）")
    await drain()
    assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { tier: { provider: "p1", model: "m1", level } }], `写形 = 意图级 \`{ tier }\` 三键（${reason} 径照发 —— 判据在核侧写时）`)
    assert.equal(host.call("provider:list").length, reads, `失败 ⇒ 零重读（零乐观写 —— ${reason} 不落半态）`)
    assert.equal(row().getAttribute("data-tier"), "high", `控件回退回执前值（${reason}）`)
    assert.equal(control().value, "high", `现选值回退（重绘自读档面 —— ${reason} 零乐观改值）`)
    const notice = root.querySelector("[data-notice]")
    assert.equal(notice.getAttribute("data-scope"), "model", `失败面落位 = 模型段（${reason}）`)
    assert.equal(notice.textContent, t("settings.section.model") + reason, `表外码原样直传（${reason} ∉ REASON_WORD —— 端侧不造码）`)
  }
})

test("T-DSK31: 档位控件零节点（`defaultModel` 缺 / 段空 / 该模型无候选 ⇒ 零节点 —— 禁造假候选）", async (ctx) => {
  useSentinels(ctx)
  const anyHandlers = new Proxy({}, { get: () => () => {} })
  const providers = { state: "ready", presets: [], providers: [{ name: "p1", model: "m1", effort: "high", active: true }] }
  const model = { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1", effortEnum: ["low"], thinkOff: true }] }
  const at = (defaultModel) => stateOf({ open: true, defaultModel, providers, model })
  const rows = (defaultModel) => nodes(settingsTree(settingsModel(at(defaultModel)), anyHandlers)).filter((node) => node.props?.["data-tier"] !== undefined).length
  for (const [defaultModel, why] of [
    [null, "`defaultModel` 缺（未配）"],
    ["", "空串"],
    ["p1", "无冒号 ⇒ 段不可解"],
    ["p1:", "模型段空"],
    [":m1", "渠道段空"],
    ["p1:m2", "该模型无候选元素（枚举面缺 —— 不造假候选）"],
    [7, "现值非串"],
  ]) {
    assert.equal(rows(defaultModel), 0, `控件零节点：${why}`)
    assert.equal(settingsModel(at(defaultModel)).model.tier, null, `读数 null：${why}`)
  }
  assert.equal(rows("p1:m1"), 1, "对照：三段可解 ⇒ 恰一控件（非恒零）")

  const face = supplyFace()
  const { host, root } = await mountFace(ctx, (channel, payload) => (channel === "model:list" ? { ok: false, models: [], reason: "unavailable" } : face.answer(channel, payload)))
  assert.equal(root.querySelector("[data-tier]"), null, "探针不可用 ⇒ 模型段零候选 ⇒ 控件零节点（挂载面同判）")
  assert.deepEqual([host.call("provider:list").length, host.call("model:list").length], [1, 1], "两段照读（零节点 ≠ 零供给 —— 缺席只因不可解）")
})

test("T-DSK31: 不可 `off` 模型 ⇒ off 选项缺席（`thinkOff` 判据 = 严格真 —— 禁假造档）", async (ctx) => {
  useSentinels(ctx)
  const anyHandlers = new Proxy({}, { get: () => () => {} })
  const values = (thinkOff, effortEnum) => {
    const settings = {
      defaultModel: "p1:m1",
      providers: { state: "ready", presets: [], providers: [{ name: "p1", model: "m1", effort: "low", active: true }] },
      model: { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1", effortEnum, thinkOff }] },
    }
    const tree = settingsTree(settingsModel(stateOf({ open: true, ...settings })), anyHandlers)
    const row = nodes(tree).find((node) => node.props?.["data-tier"] !== undefined)
    return nodes(row).filter((node) => node.tag === "option").map((node) => node.props.value)
  }
  assert.deepEqual(values(true, ["low", "none"]), ["auto", "off", "low"], "对照：`thinkOff` 真 ⇒ off 在场（序 = Auto → off → 枚举；`none` 恒不入集）")
  assert.deepEqual(values(false, ["low", "high"]), ["auto", "low", "high"], "`thinkOff` 假 ⇒ off 缺席（该模型 off 不可达 —— 禁假造）")
  assert.deepEqual(values("true", ["low"]), ["auto", "low"], "非布尔真字面 ⇒ 缺席（判据 = `=== true`）")
  assert.deepEqual(values(undefined, ["low"]), ["auto", "low"], "缺 `thinkOff` ⇒ 缺席（不猜）")

  const face = supplyFace()
  face.held.rows = [{ name: "p1", model: "m2", effort: "low", hasKey: true, active: true }]
  const { root } = await mountFace(ctx, face.answer)
  const row = root.querySelector("[data-tier]")
  assert.equal(row.getAttribute("data-tier"), "low", "挂载面现值随行（m2 · `effort` = low）")
  const control = row.querySelector(`[aria-label="${t("settings.model.tier")}"]`)
  assert.deepEqual(control.children.map((node) => node.getAttribute("value")), ["auto", "low"], "挂载面同判：不可 off ⇒ off 缺席（现值已在集内 ⇒ 不追加）")
})

test("T-DSK31: 写盘 `mtime-conflict`（核 reason 直传 · 表内出词 · 零写 + 回退 · 零静默）", async (ctx) => {
  const face = supplyFace()
  const write = { reply: { ok: false, reason: "mtime-conflict" } }
  const { fake, host, root } = await mountFace(ctx, (channel, payload) => (channel === "settings:agent" && payload?.tier !== undefined ? write.reply : face.answer(channel, payload)))
  const drain = () => new Promise((resolve) => setImmediate(resolve))
  const logged = []
  const previous = console.error
  console.error = (...args) => { logged.push(args.map(String).join(" ")) }
  ctx.after(() => { console.error = previous })
  const control = () => root.querySelector("[data-tier]").querySelector(`[aria-label="${t("settings.model.tier")}"]`)
  assert.equal(control().value, "high", "回执前值（行 `effort` 投影）")
  const reads = host.call("provider:list").length
  assert.equal(fake.fire(control(), "change", { target: { value: "low" } }), 1, "档位控件真注册（`change` 面）")
  await drain()
  assert.deepEqual(host.call("settings:agent").at(-1), ["settings:agent", { tier: { provider: "p1", model: "m1", level: "low" } }], "载荷 = 意图级三键（写形与 `{ patch }` 二择一）")
  assert.equal(host.call("provider:list").length, reads, "失败 ⇒ 零重读（零乐观写 —— 盘面未变，读数不刷新）")
  assert.equal(root.querySelector("[data-tier]").getAttribute("data-tier"), "high", "控件回退回执前值（盘上真值）")
  assert.equal(control().value, "high", "现选值回退（零乐观改值）")
  const notice = root.querySelector("[data-notice]")
  assert.equal(notice.getAttribute("data-scope"), "model", "失败面落位 = 模型段（段标可读）")
  assert.equal(notice.textContent, t("settings.section.model") + t("settings.reason.mtimeConflict"), "核 reason 直传 + 表内出词（`mtime-conflict` ∈ REASON_WORD）")
  assert.equal(reasonWord("mtime-conflict"), t("settings.reason.mtimeConflict"), "出词面单源（`reasonWord` —— 零端侧造码）")
  assert.equal(logged.some((line) => line.includes("settings:agent")), true, "零静默：失败面同时记码")
})
