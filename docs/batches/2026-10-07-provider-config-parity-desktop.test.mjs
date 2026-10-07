/**
 * 2026-10-07-provider-config-parity-desktop.test.mjs — 批内件（桌面舱 D1–D6；随批档存档；直接跑：node --test）。
 *
 * 三端对齐批（`docs/batches/2026-10-07-provider-config-parity.md`——台账 #1027–#1035）桌面腿：
 * 决策单源 = `docs/desktop/design/SETTINGS.md` §2.16（KD-75 ①–⑨）；判据表 = 批档 §2.6 桌面行。
 * 拆档由来 = 共享件破 500 硬限 ⇒ 按舱拆档（cli ∥ vsc ∥ desktop——收口轮 2026-10-07）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** temp config 路径（每用例各自目录——隔离真配置）。 */
function tmpConfigPath() {
  return join(mkdtempSync(join(tmpdir(), "tc-provider-parity-")), "config.json")
}
// ══════════════════════════════════════════════════════════════════════════════════════════
// D 腿（桌面 · 舱三 · 三端对齐批）：弹窗 ∥ 单表 ∥ 开径 ∥ 写面 —— 渲染面/主面（平 node 直测）
//   决策单源 = `docs/desktop/design/SETTINGS.md` §2.16（KD-75 ①–⑨）；判据表 = 批档 §2.6 桌面行。
//   本段自持工具与夹具（与 V ∥ C ∥ L 腿零共享 —— 追加式共享件：勿动他人腿）。
// ══════════════════════════════════════════════════════════════════════════════════════════

// tmp 直跑适配（`add-dialog-verify/` 深度 3）：两候选取命中——原位（depth 2）∥ tmp 两处皆兼容
const DESKTOP = [new URL("../../thincoder-desktop/", import.meta.url), new URL("../../../thincoder-desktop/", import.meta.url)].find((url) => existsSync(url)).href
const deskSrc = (rel) => readFileSync(new URL(rel, DESKTOP), "utf8")
const deskAt = (rel) => new URL(rel, DESKTOP).href
await import(deskAt("test/rc-resolve.mjs")) // `/rc/` 解析钩子（须先于渲染档取件注册 —— 平 node 无 `app://desktop` origin）
const deskI18n = await import(deskAt("renderer/i18n.mjs"))
deskI18n.initDict({ locale: "en" }) // 桌面渲染面词表（树面出词面；值锁 = D5 直读字表）
const { channelFormTree: dsFormTree } = await import(deskAt("renderer/views/settings-controls.mjs"))
const { providersBody: dsProvidersBody } = await import(deskAt("renderer/views/settings-sections-providers.mjs"))
const { ADD_MODAL_GROUP, SECTIONS: DS_SECTIONS, settingsModalTree: dsModalTree } = await import(deskAt("renderer/views/settings.mjs"))

/** 树面小工具（null 容错）：深搜 / 全收 / 锚取（本段自持，零跨舱借用）。 */
const dFind = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) { const hit = dFind(item, pred); if (hit !== null) return hit }
    return null
  }
  if (pred(node)) return node
  return dFind(node.children ?? null, pred)
}
const dCollect = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) dCollect(item, pred, out); return out }
  if (pred(node)) out.push(node)
  dCollect(node.children ?? null, pred, out)
  return out
}
const dByAction = (node, action) => dFind(node, (n) => n?.props?.["data-action"] === action)

/** 节序签名（文档序；`option` ∥ 无锚件不计 —— 字段 / 动作面「节序」判据单点）。 */
const dSigs = (node, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) dSigs(item, out); return out }
  if (node.tag === "option") return out
  const props = node.props ?? {}
  const sig = props.name ?? props["data-action"] ?? (props["data-preset-info"] !== undefined ? "preset-info" : null)
  if (sig !== null) out.push(sig)
  dSigs(node.children ?? null, out)
  return out
}

/** 夹具：预设两件 / 协议三值 / 弹窗出口表 / 段体注入面 / 面态（八组弹窗夹具 = 批档 §2.6 D3）。 */
const DS_PRESETS = [
  { name: "deepseek", desc: "DeepSeek", model: "deepseek-chat", baseURL: "https://api.deepseek.com" },
  { name: "glm", desc: "GLM", model: "glm-4", baseURL: "https://open.bigmodel.cn/api/paas/v4" },
]
const DS_FORMATS = ["openai", "anthropic", "google"]
const dsModalHandlers = { onSubmit: () => {}, onFetchModels: () => {}, onAddShape: () => {}, onCloseModal: () => {} }
const dsDeps = { channelForm: dsFormTree, verifyControl: () => ({}), reasonWord: (code) => code, formats: DS_FORMATS, edit: null, keyDraft: null }
const dsSection = (over = {}) => ({
  state: "ready", presets: DS_PRESETS, probe: null, draft: null, verify: null, addShape: "preset",
  rows: [
    { name: "p1", hasKey: true, maskedKey: "sk-***", model: "m1", baseURL: "https://p1.example.com" },
    { name: "p2", hasKey: false },
  ],
  ...over,
})
const dsState = (providers = {}, settings = {}) => ({
  locale: "en", theme: "system", activeSession: null, sessionFlags: {},
  settings: {
    open: false, notice: null, modal: null, configured: true, defaultModel: null,
    wizard: { step: 1, dismissed: false, notice: null },
    providers: { state: "none", presets: [], providers: [], edit: null, probe: null, draft: null, keyDraft: null, addShape: "preset", ...providers },
    verify: null,
    model: { state: "none", provider: null, current: null, models: [] },
    agent: { state: "none", fields: [] },
    mcp: { state: "none", servers: [], details: {}, form: null },
    env: { state: "none", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
    tools: { state: "none", status: null, building: false, keys: null, edit: null },
    models: { state: "none", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
    ...settings,
  },
})

// ─── D1 段体树：行族 + 校验回退 + 添加钮（零表单节点）──────────────────────────────

test("D1 providersBody 树：行族 + 校验回退 + 添加钮（零表单节点 ∥ 钮 ⇒ onAddProvider ∥ 缺 handler ⇒ disabled）", () => {
  let adds = 0
  const body = dsProvidersBody(dsSection(), { onRemoveProvider: () => {}, onAddProvider: () => { adds += 1 } }, dsDeps)
  // 零表单节点（原双表单常显内联退场 —— KD-75 ②）
  assert.equal(dCollect(body, (n) => n?.tag === "form").length, 0, "段体零表单节点（双表单退场）")
  assert.equal(dFind(body, (n) => n?.props?.["data-form"] !== undefined), null, "零 form 锚残留")
  // 行族（两行 = 夹具）
  assert.equal(dCollect(body, (n) => n?.props?.["data-provider"] !== undefined).length, 2, "行族两行在场")
  // 添加钮：锚 ∥ 词 ∥ 活件 ∥ 段尾
  const add = dByAction(body, "settings:addProvider")
  assert.ok(add !== null, "添加钮在场（锚 settings:addProvider）")
  assert.equal(add.props.class, "settings-submit", "钮形 = 既有 .settings-submit（零新 CSS）")
  assert.equal(add.children[0], deskI18n.t("settings.addProvider"), "钮词 = settings.addProvider")
  assert.equal(body.at(-1), add, "钮 = 段尾（行族 + 校验回退之后）")
  add.props.onClick()
  assert.equal(adds, 1, "钮 click ⇒ onAddProvider 出口")
  // 校验回退：无行渲出结果 ⇒ 段末（既有判据零改）
  const fallback = dsProvidersBody(dsSection({ verify: { kind: "ok", count: 2, name: "ghost" } }), {}, dsDeps)
  assert.ok(dFind(fallback, (n) => n?.props?.["data-verify"] === "ok") !== null, "无行渲出结果 ⇒ 段末回退在场")
  assert.equal(fallback.at(-1).props["data-action"], "settings:addProvider", "回退后仍为段尾钮")
  // 缺 handler ⇒ 明确禁用（诚实非死控）
  const bare = dByAction(dsProvidersBody(dsSection(), {}, dsDeps), "settings:addProvider")
  assert.equal(bare.props.disabled, true, "缺 onAddProvider ⇒ disabled")
  assert.equal(bare.props.onClick, undefined, "缺 handler ⇒ 零接线")
  // 行内校验结果（有行渲出 ⇒ 就地，零段末回退）—— 既有判据随段体改线后仍达
  const inRow = dsProvidersBody(dsSection({ verify: { kind: "fail", reason: "probe-failed", name: "p1" } }), {}, dsDeps)
  assert.equal(dCollect(inRow, (n) => n?.props?.["data-verify"] === "fail").length, 1, "有行渲出 ⇒ 就地一次")
})

// ─── D2 单表树：两形节序 ∥ activeDefault 条件化 ∥ proxy 两形皆在场 ─────────────────

test("D2 channelFormTree 节序：custom/preset 两形 ∥ activeDefault 条件化 ∥ proxy 两形皆在场（向导步 1 同径）", () => {
  const preset = dsFormTree({ shape: "preset", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  const custom = dsFormTree({ shape: "custom", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  // 两形节序（KD-75 ③ 字段序 = 用户填写序）
  assert.deepEqual(dSigs(preset), ["shape", "preset", "preset-info", "key", "proxy", "settings:addPreset", "settings:modalClose"], "预设形节序")
  assert.deepEqual(dSigs(custom), ["shape", "preset", "name", "baseURL", "format", "key", "proxy", "settings:fetchModels", "model", "settings:addCustom", "settings:modalClose"], "自定形节序")
  // proxy 节点两形皆在场（KD-75 ⑤ 明写）
  assert.equal(dFind(preset, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "预设形 proxy 拨杆在场")
  assert.equal(dFind(custom, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "自定形 proxy 拨杆在场")
  assert.equal(dFind(custom, (n) => n?.props?.name === "proxy")?.props?.["data-draft"], "proxy", "proxy 携草稿申报（第二闸域）")
  // 类型选择：name=preset ∥ 末项 customChoice ∥ 选中回环（切片值 = 预设名）
  const select = dFind(preset, (n) => n?.tag === "select" && n?.props?.name === "preset")
  assert.ok(select !== null, "类型 select name=preset 在场")
  assert.deepEqual(select.children.map((o) => o.props.value), ["deepseek", "glm", "custom"], "预设项 + 自定末项")
  assert.equal(select.children.at(-1).children[0], deskI18n.t("settings.providers.customChoice"), "末项词 = settings.providers.customChoice")
  assert.equal(dFind(dsFormTree({ shape: "glm", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers), (n) => n?.tag === "option" && n?.props?.selected === true)?.props?.value, "glm", "切片值 ⇒ 命中项选中")
  assert.deepEqual(dSigs(dsFormTree({ shape: "custom", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)).slice(0, 2), ["shape", "preset"], "自定形：选择器居首（无 info 行）")
  assert.equal(dCollect(custom, (n) => n?.props?.selected === true).filter((o) => o.tag === "option").length, 1, "自定形：恰一项 selected（免双选中竞位）")
  // 预设信息行：model · baseURL（缺段不落空分隔符）—— 随切片选中
  const glmForm = dsFormTree({ shape: "glm", presets: DS_PRESETS, formats: DS_FORMATS }, dsModalHandlers)
  assert.deepEqual(dFind(glmForm, (n) => n?.props?.["data-preset-info"] !== undefined).children, ["glm-4 · https://open.bigmodel.cn/api/paas/v4"], "切片值 = glm ⇒ 信息行随选中")
  assert.deepEqual(dFind(preset, (n) => n?.props?.["data-preset-info"] !== undefined).children, ["deepseek-chat · https://api.deepseek.com"], "缺省哨位 ⇒ 首项信息行")
  assert.equal(dFind(custom, (n) => n?.props?.["data-preset-info"] !== undefined), null, "自定形零信息行")
  assert.equal(dFind(dsFormTree({ shape: "preset", presets: [{ name: "bare" }], formats: DS_FORMATS }, dsModalHandlers), (n) => n?.props?.["data-preset-info"] !== undefined), null, "两段皆空 ⇒ 零信息行（禁假造）")
  // activeDefault 条件化（KD-75 ⑤：设置弹窗不传 ⇒ 零节点 ∥ 向导 true ⇒ 在场且勾选）
  assert.equal(dFind(preset, (n) => n?.props?.name === "active"), null, "弹窗体（不传 activeDefault）⇒ 零 active 节点")
  const wizard = dsFormTree({ shape: "preset", presets: DS_PRESETS, activeDefault: true, submitKey: "wizard.save" }, { onSubmit: () => {} })
  const active = dFind(wizard, (n) => n?.props?.name === "active")
  assert.equal(active?.props?.checked, true, "向导步 1：active 在场且缺省勾选")
  assert.equal(dFind(wizard, (n) => n?.props?.name === "proxy")?.props?.type, "checkbox", "向导步 1：proxy 同在场（KD-75 ⑤ 明写）")
  assert.deepEqual(dSigs(wizard), ["shape", "preset", "key", "proxy", "active", "settings:addPreset"], "向导步 1 节序（单表同径 —— 无弹窗体三件）")
  assert.equal(dFind(wizard, (n) => n?.tag === "button").children[0], deskI18n.t("wizard.save"), "提交词 = 调用面 submitKey（向导词零改）")
  assert.equal(dFind(preset, (n) => n?.tag === "button").children[0], deskI18n.t("settings.save"), "设置弹窗提交词 = settings.save")
  // 提交锚按形（锚名不碎）
  assert.ok(dByAction(preset, "settings:addPreset") !== null, "预设锚 settings:addPreset")
  assert.ok(dByAction(custom, "settings:addCustom") !== null, "自定锚 settings:addCustom")
  // 草稿作用域单骨（跨形切换键不换骨 ⇒ 第二闸复填达）
  assert.equal(preset.props["data-draft-scope"], "add:provider", "预设形草稿作用域")
  assert.equal(custom.props["data-draft-scope"], "add:provider", "自定形同骨（跨形复填前提）")
  // 弹窗体三件随出口在场（向导不携 ⇒ 预设单选语义保持；零死控）
  assert.equal(dFind(wizard, (n) => n?.props?.["data-action"] === "settings:modalClose"), null, "向导无取消钮（不携 onCloseModal）")
  assert.deepEqual(dFind(wizard, (n) => n?.tag === "select" && n?.props?.name === "preset").children.map((o) => o.props.value), ["deepseek", "glm"], "向导选择器不含自定末项（无切换出口）")
  assert.equal(dFind(wizard, (n) => n?.props?.onChange !== undefined), null, "向导选择器零 change 接线（零死控）")
})

// ─── D3 弹窗树 providerAdd：标题 + 单表 ∥ SCOPES ∥ MODAL_READS ─────────────────────

test("D3 settingsModalTree(\"providerAdd\")：标题 + 单表（零行族）∥ 失败串 scope 过滤 ∥ SCOPES ∥ MODAL_READS", () => {
  const opens = []
  const tree = dsModalTree(dsState({ state: "ready", presets: DS_PRESETS, providers: [{ name: "p1" }] }, { modal: "providerAdd" }), "providerAdd", { ...dsModalHandlers, onCloseModal: () => opens.push("close") })
  assert.ok(tree !== null, "providerAdd 支在案（非表外组 null）")
  // 标题（词键新 —— 非段名）
  assert.equal(tree.card.props["aria-label"], deskI18n.t("settings.addProviderTitle"), "卡可及名 = settings.addProviderTitle")
  const title = dFind(tree.card, (n) => n?.props?.class === "settings-title")
  assert.equal(title.children[0], deskI18n.t("settings.addProviderTitle"), "头标题同词")
  assert.equal(DS_SECTIONS.some((s) => s.name === ADD_MODAL_GROUP), false, "providerAdd 非段名（段面零改）")
  // 体：段态锚（providers 面态）+ 单表唯一 + 零行族
  const body = dFind(tree.card, (n) => n?.props?.class === "settings-modal-body")
  assert.equal(body.props["data-state"], "ready", "体段态 = providers 面态（第二闸在途判据面）")
  assert.equal(dCollect(body, (n) => n?.tag === "form").length, 1, "体 = 单表唯一")
  assert.equal(dFind(body, (n) => n?.props?.["data-form"] !== undefined)?.props?.["data-form"], "preset", "单表随切片 addShape（预设形缺省）")
  assert.equal(dCollect(body, (n) => n?.props?.["data-provider"] !== undefined).length, 0, "体零行族（弹窗体 = 单表唯内容）")
  assert.equal(dFind(body, (n) => n?.props?.["data-action"] === "settings:addProvider"), null, "体零添加钮（入口不在体）")
  // 段态词恰一（§2.16 条 1 体式 = 失败串 + 段态词 + 单表 —— `loading` 态显形：免双同词节点）
  const loadingBody = dFind(dsModalTree(dsState({ state: "loading" }, { modal: "providerAdd" }), "providerAdd", {}).card, (n) => n?.props?.class === "settings-modal-body")
  assert.equal(dCollect(loadingBody, (n) => n?.props?.["data-state-word"] !== undefined).length, 1, "段态词恰一（添加支免叠渲）")
  assert.equal(loadingBody.props["data-state"], "loading", "体段态锚随 providers 面态（在途判据面）")
  // 关锚（✕ —— 三关之三；背板 ∥ 卡内 Esc 归树面同件）
  assert.ok(dByAction(tree.card, "settings:modalClose") !== null, "✕ 锚在案")
  assert.equal(typeof tree.backdrop.props.onClick, "function", "背板 handler 在场")
  // 失败串：scope = providers ∥ panel 显；他组隐（体面过滤）
  const noticeOf = (scope) => dFind(dFind(dsModalTree(dsState({}, { modal: "providerAdd", notice: { scope, reason: "invalid-shape" } }), "providerAdd", {}).card, (n) => n?.props?.class === "settings-modal-body"), (n) => n?.props?.["data-notice"] !== undefined)
  assert.equal(noticeOf("providers")?.props?.["data-scope"], "providers", "scope=providers ⇒ 显（同段域）")
  assert.equal(noticeOf("panel")?.props?.["data-scope"], "panel", "scope=panel ⇒ 显")
  assert.equal(noticeOf("mcp"), null, "他组失败串隐（零节点）")
  // 表外组 ⇒ null（防御档零改）
  assert.equal(dsModalTree(dsState({}, { modal: "providerAdd" }), "bogus", {}), null, "表外组 ⇒ null")
  // 源锁：SCOPES 十值（七段名 + 三弹窗组名 —— 单源 = 视图档导出；添加入口弹窗统一批 #1054：八 ⇒ 十）∥ MODAL_READS 指名
  const mount = deskSrc("renderer/mount-settings.mjs")
  assert.equal(ADD_MODAL_GROUP, "providerAdd", "组名单源 = 视图档导出字面")
  assert.match(mount, /const SCOPES = Object\.freeze\(\[\.\.\.SECTIONS\.map\(\(section\) => section\.name\), ADD_MODAL_GROUP, MCP_FORM_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP\]\)/, "SCOPES = 段名序 + 三组名（十值）")
  assert.match(mount, /\[ADD_MODAL_GROUP\]: "loadProviders"/, "MODAL_READS 指名 loadProviders")
  assert.match(mount, /openModal: \(group\) => openSettingsModal\(group\)/, "开径注入（迟绑定）")
  assert.match(deskSrc("renderer/mount-settings-exits.mjs"), /onAddProvider: \(\) => \{ openModal\(ADD_MODAL_GROUP\) \}/, "onAddProvider 出口注册在案")
})

// ─── D4 主面：providerSave 携 proxy 落条 ∥ providerModels 目标携 proxyUri ──────────

test("D4 主面写/探面：providerSave 携 proxy 落条 ∥ providerModels 目标携 proxyUri（双门槛 ∥ 直连两径）", async () => {
  // 核件取件须与**桌面主面**同实例（否则 `_setConfigPathForTest` 缝不生效 —— 会写进真配置）：
  // 桌面 `@thincoder/core` 经 `thincoder-desktop/node_modules/@thincoder/core` 链接解析 ⇒ 本段同径取件，
  // 并以**只读探针**（写前）自证 —— 实例不同 ⇒ 即拒，零误写。
  const cfg = await import(new URL("node_modules/@thincoder/core/config-io.mjs", DESKTOP).href)
  const listModels = await import(new URL("node_modules/@thincoder/core/provider/list-models.mjs", DESKTOP).href)
  const main = await import(deskAt("src/main/providers.mjs"))
  const cfgPath = tmpConfigPath()
  cfg._setConfigPathForTest(cfgPath)
  const seen = []
  listModels._setProbeImplForTest((name, target) => { seen.push({ name, target }); return { ok: true, models: ["m-1"] } }) // 探针缝：真目标实读（零网络）
  try {
    // ① 缝射程自证（**先于任何写** —— 只读）：tmp 哨兵 + 桌面主面读面 ⇒ 必见哨兵；不见 ⇒ 即拒（零误写真配置）
    writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "tc-seam-probe", baseURL: "https://p.example.com/v1", model: "m-p" }] }))
    const probeNames = main.providerList().providers.map((p) => p.name)
    assert.deepEqual(probeNames, ["tc-seam-probe"], "测试缝射程自证：桌面主面读面 = tmp 配置（先于任何写）")
    // ② providerSave：勾选 ⇒ 条目落旗；缺 ∥ 非真 ⇒ 零键（判据单源 = 核 addProviderEntry）
    writeFileSync(cfgPath, JSON.stringify({}))
    assert.equal(main.providerSave({ name: "tc-ds-a", shape: "custom", baseURL: "https://a.example.com/v1", model: "m-a", proxy: true }).ok, true, "自定形 + proxy 保存成功")
    assert.equal(main.providerSave({ name: "tc-ds-b", shape: "custom", baseURL: "https://b.example.com/v1", model: "m-b" }).ok, true, "缺 proxy 保存成功")
    assert.equal(main.providerSave({ name: "tc-ds-c", shape: "custom", baseURL: "https://c.example.com/v1", model: "m-c", proxy: "true" }).ok, true, "非真 proxy 保存成功")
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    const get = (n) => raw.providers.find((p) => p?.name === n)
    assert.equal(get("tc-ds-a").proxy, true, "勾选 ⇒ 落旗")
    assert.equal("proxy" in get("tc-ds-b"), false, "缺 ⇒ 零键")
    assert.equal("proxy" in get("tc-ds-c"), false, "非真 ⇒ 零键")
    // ② providerModels：目标构造 = 核 probeTargetOf 同判定（双门槛 ∥ 直连两径）
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: true } }))
    assert.equal((await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: " sk ", format: "anthropic", proxy: true })).ok, true)
    assert.equal(seen.at(-1).target.proxyUri, "http://127.0.0.1:9", "双门槛齐 ⇒ 目标携 proxyUri")
    assert.equal(seen.at(-1).target.apiKey, "sk", "apiKey 归一（同判定）")
    assert.equal(seen.at(-1).name, "", "名传空串（落账面零改）")
    await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: "sk", format: "anthropic" })
    assert.equal("proxyUri" in seen.at(-1).target && seen.at(-1).target.proxyUri !== undefined, false, "未勾 ⇒ 直连（零 proxyUri）")
    writeFileSync(cfgPath, JSON.stringify({ proxy: { uri: "http://127.0.0.1:9", model: false } }))
    await main.providerModels({ baseURL: "https://x.example.com/v1", apiKey: "sk", format: "anthropic", proxy: true })
    assert.equal(seen.at(-1).target.proxyUri, undefined, "勾但全局 proxy.model 关 ⇒ 直连（双门槛）")
    // ③ 源锁（残件零留）：目标构造单源 ∥ 零 web 旗 ∥ 零 normalizeProxy
    const src = deskSrc("src/main/providers.mjs")
    const modelsBody = src.slice(src.indexOf("export async function providerModels"), src.indexOf("const PROXY_TEST_URL"))
    assert.ok(modelsBody.includes("probeTargetOf("), "目标构造 = 核 probeTargetOf（单源）")
    assert.ok(modelsBody.includes("proxy: payload?.proxy === true"), "双门槛判据形（仅真值入构造）")
    assert.ok(!modelsBody.includes("proxy.web"), "零 web 旗取用（旧相抵径退场）")
    assert.ok(!modelsBody.includes("normalizeProxy"), "零 normalizeProxy 残用")
    assert.equal((src.match(/normalizeProxy/g) ?? []).length, 0, "全档零 normalizeProxy 残引")
    assert.equal((src.match(/loadRaw\(/g) ?? []).length, 0, "零 loadRaw 调用（注释提及不计）")
    const ioImport = (src.match(/import \{[\s\S]*?\} from "@thincoder\/core\/config-io\.mjs"/) ?? [""])[0]
    assert.ok(!ioImport.includes("loadRaw"), "config-io 取件面零 loadRaw（旧 web 旗取用件随退）")
    // ④ 渲染面载荷随勾选（源锁：ask 载荷 + proxy）
    const seg = deskSrc("renderer/mount-settings-segments-providers.mjs")
    assert.match(seg, /data\.get\("proxy"\) !== null \? \{ proxy: true \} : \{\}/, "拉取载荷 + proxy（勾选 ⇒ true）")
    assert.match(deskSrc("renderer/mount-settings-exits.mjs"), /data\.get\("proxy"\) !== null \? \{ proxy: true \} : \{\}/, "提交载荷 + proxy（勾选 ⇒ true）")
  } finally {
    listModels._resetAdmissionForTest()
    cfg._resetConfigPathForTest()
  }
})

// ─── D5 词面锁（#1035 六值 ∥ 键面 +3 −2）─────────────────────────────────────────

test("D5 词面锁：#1035 六值改毕 ∥ 键面 +3 −2 ∥ zh 裸「密钥」清零", async () => {
  const { SETTINGS_DICT } = await import(deskAt("renderer/i18n-settings.mjs"))
  const { VIEWS_DICT } = await import(deskAt("renderer/i18n-views.mjs"))
  const { COMPOSER_DICT } = await import(deskAt("renderer/i18n-composer.mjs"))
  const S = SETTINGS_DICT, V = VIEWS_DICT, C = COMPOSER_DICT
  // 两语键集相等（三档）
  for (const dict of [S, V, C]) assert.deepEqual(Object.keys(dict.en).sort(), Object.keys(dict.zh).sort(), "两语键集相等")
  // 六值（两语）
  for (const locale of ["en", "zh"]) {
    assert.equal(S[locale]["settings.providers.keyLabel"], "API Key", `${locale} keyLabel`)
    assert.equal(S[locale]["settings.providers.noKey"], locale === "en" ? "No API Key" : "未配置 API Key", `${locale} noKey`)
    assert.equal(V[locale]["settings.addKey"], locale === "en" ? "Add API Key" : "添加 API Key", `${locale} addKey`)
    assert.equal(V[locale]["settings.deleteKey"], locale === "en" ? "Delete API Key" : "删除 API Key", `${locale} deleteKey`)
    assert.equal(C[locale]["model.setKey"], locale === "en" ? "API Key…" : "设置 API Key…", `${locale} model.setKey`)
  }
  assert.equal(V.zh["composer.send.noProvider"], "未配置 API Key — 点击 ⚙ 设置", "zh noProvider（en 零动）")
  assert.equal(V.en["composer.send.noProvider"], "No provider configured — click ⚙ to set API keys", "en noProvider 零改")
  // 键面 +3 −2（KD-75 ②③ 新键 ∥ 旧双表单提交词随表单退场）
  for (const locale of ["en", "zh"]) {
    for (const key of ["settings.addProvider", "settings.addProviderTitle", "settings.providers.customChoice"]) assert.ok(key in S[locale], `${locale} 新键 ${key}`)
    for (const key of ["settings.providers.addCustom", "settings.providers.addPreset"]) assert.equal(key in S[locale], false, `${locale} 旧键净删 ${key}`)
  }
  assert.equal(S.en["settings.addProvider"], "+ Add", "en 添加钮词（逐字同 VSC）")
  assert.equal(S.zh["settings.addProvider"], "+ 添加", "zh 添加钮词")
  assert.equal(S.en["settings.addProviderTitle"], "Add Provider", "en 弹窗标题词")
  assert.equal(S.zh["settings.addProviderTitle"], "添加 Provider", "zh 弹窗标题词")
  assert.equal(S.en["settings.providers.customChoice"], "Custom (manual config)", "en 自定末项词")
  assert.equal(S.zh["settings.providers.customChoice"], "自定义（手动配置）", "zh 自定末项词")
  assert.ok(Object.keys(S.en).length >= 60, "键面 ≥ 60（本批 59 ⇒ 60；并行批增键不属本腿判据）")
  // zh 裸「密钥」清零（四表值面 —— HOST_DICT 合并档同扫）
  const { HOST_DICT } = deskI18n
  const zhValues = [S.zh, V.zh, C.zh, HOST_DICT.zh ?? {}].flatMap((dict) => Object.values(dict))
  assert.equal(zhValues.filter((value) => String(value).includes("密钥")).length, 0, "zh 裸「密钥」清零")
  // 旧键零消费者（消费面源锁）
  for (const file of ["renderer/views/settings-controls.mjs", "renderer/views/settings-sections-providers.mjs", "renderer/views/settings.mjs"]) {
    assert.equal(deskSrc(file).includes("providers.addCustom"), false, `${file}：addCustom 零残引`)
    assert.equal(deskSrc(file).includes("providers.addPreset"), false, `${file}：addPreset 零残引`)
  }
})

// ─── D6 添加钮开径腿：settings:addProvider ⇒ onAddProvider ⇒ openSettingsModal ────

test("D6 添加钮开径腿：锚 ⇒ onAddProvider ⇒ openSettingsModal(\"providerAdd\")（SCOPES 闭集内 ∥ 向导占槽 ⇒ 拒，零静默）", async () => {
  const { initialState, createStore, patchSettings } = await import(deskAt("renderer/store.mjs"))
  const { attachSettings } = await import(deskAt("renderer/mount-settings.mjs"))
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => null, addEventListener: () => {} } // 桩 document：只测决策 ∥ 调度面（DOM 建面 = D1–D3 树面腿）
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    const store = createStore(initialState())
    const calls = []
    const host = { invoke: async (channel) => { calls.push(channel); return channel === "provider:list" ? { ok: true, active: null, presets: [], providers: [] } : { ok: false, reason: "stub" } } }
    const face = attachSettings(host, { store })
    face.detach() // 防重绘（平 node 零 DOM 建面）
    // 异步链泵：微任务冲扫（不依 `setTimeout` —— 本件 V 腿已把 `globalThis.setTimeout` 换为捕获桩）
    const flush = async () => { for (let i = 0; i < 50; i += 1) await Promise.resolve() }
    await flush()
    // ① 出口在案（全表注入）
    assert.equal(typeof face.handlers.onAddProvider, "function", "onAddProvider 出口在案（mount-settings-exits.mjs handlers 表）")
    // ② 开径：出口 ⇒ openSettingsModal（SCOPES 十值闭集内 —— 添加入口弹窗统一批 #1054 起）⇒ 切片写 + 读取链
    calls.length = 0
    face.handlers.onAddProvider()
    assert.equal(store.get().settings.modal, "providerAdd", "开径 ⇒ `settings.modal = providerAdd`")
    await flush()
    assert.deepEqual(calls, ["provider:list", "model:catalog"], "读取链 = MODAL_READS[providerAdd] = loadProviders（携模型面随动）")
    // ③ 关（KD-68 关径）：切片清 + 本组面态复位（addShape 回 preset）
    store.set(patchSettings(store.get(), { providers: { ...store.get().settings.providers, addShape: "custom", probe: { state: "ok" } } }))
    face.closeSettingsModal()
    const closed = store.get().settings
    assert.equal(closed.modal, null, "关 ⇒ 切片清")
    assert.equal(closed.providers.addShape, "preset", "关 ⇒ addShape 复位（本组面态）")
    assert.equal(closed.providers.probe, null, "关 ⇒ probe 清")
    // ④ 向导占槽 ⇒ 拒 + 记错 + 零动作（零静默）
    store.set(patchSettings(store.get(), { configured: false, wizard: { step: 1, dismissed: false, notice: null } }))
    const before = errors.length
    face.handlers.onAddProvider()
    assert.equal(store.get().settings.modal, null, "占槽 ⇒ 零动作")
    assert.equal(errors.length, before + 1, "占槽拒 ⇒ 记错一次")
    assert.match(String(errors.at(-1)?.[0]), /wizard occupies/, "占槽拒记错词")
    // ⑤ 闭集守卫零改（表外 ⇒ 拒；providerAdd ⇒ 受）
    store.set(patchSettings(store.get(), { configured: true, wizard: { step: 1, dismissed: false, notice: null } }))
    assert.equal(face.openSettingsModal("providerAdd"), true, "providerAdd = 闭集内（十值之一）")
    face.closeSettingsModal()
    const before2 = errors.length
    assert.equal(face.openSettingsModal("bogus"), false, "表外 ⇒ 拒")
    assert.equal(errors.length, before2 + 1, "表外拒 ⇒ 记错一次")
    // ⑥ 写成功径宿主关（源锁：submitChannel 成功径 closeModal —— §2.4 行 6「提交 ⇒ 宿主关」）
    const exits = deskSrc("renderer/mount-settings-exits.mjs")
    assert.match(exits, /settings\?\.modal === ADD_MODAL_GROUP/, "提交成功径判本弹窗在场")
    assert.match(exits, /closeModal\(\)/, "成功径经 closeModal（KD-68 关径注入）")
    assert.match(deskSrc("renderer/mount-settings.mjs"), /closeModal: \(\) => closeSettingsModal\(\)/, "关径注入在案（迟绑定）")
  } finally {
    console.error = original
    globalThis.document = prevDoc
  }
})
