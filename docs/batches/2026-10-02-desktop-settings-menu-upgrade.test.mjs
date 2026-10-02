/**
 * 2026-10-02-desktop-settings-menu-upgrade.test.mjs — 批内件（设置体系升级批 · #817 · 实施轮 · 两波同轮）。
 * 判据表 = 批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §2.4（机检六腿：波 1 三 + 波 2 三）+ §2.1；
 * 决策单源 = `docs/desktop/design/MENU.md` §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68**；
 * 通道契约 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行。
 * **#820 邻接注（2026-10-02）**：波 1 腿①/② 断言 = 七组项快照——#820 收窄（设置菜单六组项）实施落盘后**恰 2 红 = 预期**（复跑 `tests 8 ∥ pass 6 ∥ fail 2`；红例 = 腿① `:171` ∥ 腿② `:254`）；本档随批留存、不追改；随下次触碰改钉六项形（沿 #811→#817 先例；#820 批档 §6 互指）。
 *
 * 面（只测本批改动面 —— 平 node；纯函数腿直测，装配面以桩 `document` 直测决策 ∥ 调度面）：
 *   波 1 腿 ① 树形：五组序 ∥ 设置组条目序（设置… ∥ sep ∥ 七组项 ∥ sep ∥ 维护▸ ∥ 关于与快捷键▸）∥ 七组项 emit 闭集
 *          ∥ 跨面闭集一致性（`SETTINGS_GROUPS` ≡ `SECTIONS` 名序 ≡ 读取面键序）∥ `maintenance` 键值保持 ∥ 帮助组零动；
 *   波 1 腿 ② 词面 ∥ 回落：键集 29 ⇒ 32 ∥ `settingsSectionLabels` = HOST_DICT `settings.section.*` 投影 ∥ 未知 ⇒ en 回落
 *          ∥ 缺键 ⇒ 键名终态 ∥ 与 HOST_DICT 零重叠键；
 *   波 1 腿 ③ 通道双表 + 动作闭集六：双表含 `ev:menu` 且等值（24）∥ 白名单 47 不动 ∥ HANDLERS 闭包 ∥ `menu-actions`
 *          六动作（`openSettings` 两形：缺 `value` ⇒ undefined ∥ 携组名 ⇒ 组名）∥ 表外 ⇒ 记错零动作 ∥ app.mjs 双口转接源扫；
 *   波 2 腿 ④ 弹窗树：`settingsModalTree` 平 node（背板 ∥ 卡 `role`/`aria-modal`/`aria-label` ∥ 头（组名 + ✕ 锚）∥
 *          体恰一组（七组逐组跨面互斥）∥ notice 过滤两向（本组 ∨ panel 显 ∥ 他组隐）∥ 三关 handler 在场 ∥ 表外组 ⇒ null
 *          ∥ 宿主 re-export 同源）；
 *   波 2 腿 ⑤ 复用链 ∥ 状态：store 初值 `modal: null` ∥ 七组 → 读取链（逐组通道直测）∥ 闭集验证（表外 ⇒ 拒 + 记错 + 零动）
 *          ∥ 占槽拒 ∥ 开 ∥ 关 = 本组面态复位（限本组）∥ 出口映射（`exits.handlers` 全表注入 —— 源扫 + 树面活件）；
 *   波 2 腿 ⑥ 样式 ∥ 链序：z-20/21 ∥ 零 `--` 定义 ∥ 零 `@media` ∥ `settings.css` 零触（304 在盘 ∥ 无 modal 规则）
 *          ∥ `index.html` 链序（settings.css 后）∥ 确认族 z 40/41 保留。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd —— 路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于渲染档取件注册）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const at = (rel) => pathToFileURL(join(ROOT, rel)).href
const require = createRequire(import.meta.url)
const contentLines = (text) => (text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length)

const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
i18n.initDict({ locale: "zh" })
const { HOST_DICT, FALLBACK_LOCALE } = i18n
const { SETTINGS_GROUPS, menuTemplate } = await import(at("thincoder-desktop/src/main/app-menu.mjs"))
const { menuLabels, settingsSectionLabels } = await import(at("thincoder-desktop/src/main/menu-words.mjs"))
const { contextMenuLabels } = await import(at("thincoder-desktop/src/main/context-menu.mjs"))
const { createMenuActions } = await import(at("thincoder-desktop/renderer/menu-actions.mjs"))
const { SECTIONS, settingsModalTree } = await import(at("thincoder-desktop/renderer/views/settings.mjs"))
const modalHost = await import(at("thincoder-desktop/renderer/settings-modal.mjs"))
const { initialState, createStore, patchSettings } = await import(at("thincoder-desktop/renderer/store.mjs"))
const { attachSettings } = await import(at("thincoder-desktop/renderer/mount-settings.mjs"))
const preload = require(join(ROOT, "thincoder-desktop/src/preload/preload.cjs"))

/** 全菜单键集（预期 —— 词表纪律腿判据；29 ⇒ 32）。 */
const WORD_KEYS = [
  "file", "edit", "view", "settings", "maintenance", "help",
  "newSession", "openProject", "recent", "recentEmpty", "close", "quit",
  "undo", "redo", "find",
  "reload", "forceReload", "toggleDevTools", "resetZoom", "zoomIn", "zoomOut", "toggleFullscreen",
  "theme", "themeSystem", "themeLight", "themeDark",
  "settingsOpen", "cleanUp", "rebuildIndex", "aboutShortcuts",
  "helpCommands", "about",
]

/** 建模板（真词表 + 真段名读数 + 两缝捕获）。 */
function buildMenu({ locale = "zh", recent = [], theme = null } = {}) {
  const actions = []
  const natives = []
  const template = menuTemplate({
    words: menuLabels(locale), edit: contextMenuLabels(locale), recent, theme,
    sections: settingsSectionLabels(locale),
    onAction: (...args) => actions.push(args),
    onNative: (...args) => natives.push(args),
  })
  return { template, actions, natives }
}

/** 树面小工具（null 容错）：深搜 / 全收 / 类名 / 块。 */
const findDeep = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) {
    for (const item of node) { const hit = findDeep(item, pred); if (hit !== null) return hit }
    return null
  }
  if (pred(node)) return node
  return findDeep(node.children ?? null, pred)
}
const collectDeep = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) collectDeep(item, pred, out); return out }
  if (pred(node)) out.push(node)
  collectDeep(node.children ?? null, pred, out)
  return out
}
const byClass = (node, cls) => findDeep(node, (n) => typeof n?.props?.class === "string" && n.props.class.split(" ").includes(cls))
const byAction = (node, action) => findDeep(node, (n) => n?.props?.["data-action"] === action)
const blockOf = (css, selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const hit = new RegExp(esc + "\\s*\\{([^}]*)\\}").exec(css)
  return hit === null ? null : hit[1]
}
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "")

// ─── 波 2 夹具（段态 ready + 各组特征锚；其余切片刻意保 none —— 跨组互斥判据面）────────────────────

const baseState = (settings = {}) => ({
  locale: "zh",
  theme: "system",
  activeSession: null,
  sessionFlags: {},
  settings: {
    open: false, notice: null, modal: null, configured: true, defaultModel: null,
    wizard: { step: 1, dismissed: false, notice: null },
    providers: { state: "none", presets: [], providers: [], edit: null, probe: null, draft: null, keyDraft: null },
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

/** 七组特征夹具：`settings` 覆盖 + `marker`（本组特征锚）+ `probe`（须为活件的动作 —— 出口映射腿）。 */
const GROUP_FIXTURES = {
  providers: {
    settings: { providers: { state: "ready", presets: [], providers: [{ name: "p1", hasKey: true }], edit: null, probe: null, draft: null, keyDraft: null } },
    marker: (n) => n?.props?.["data-provider"] === "p1" && n?.props?.class === "settings-row",
    probe: "settings:verify",
  },
  model: {
    settings: { model: { state: "ready", provider: "p1", current: "p1:m1", models: ["m2", "m1"] } },
    marker: (n) => n?.props?.["data-read"] === "current",
    probe: "settings:useModel",
  },
  agent: {
    settings: { agent: { state: "ready", fields: [{ path: "custom.key", kind: "string" }] } },
    marker: (n) => n?.props?.["data-field-name"] === "agent.maxTurns",
    probe: "settings:saveAgent",
  },
  mcp: {
    settings: { mcp: { state: "ready", servers: [{ name: "s1", kind: "command" }], details: {}, form: null } },
    marker: (n) => n?.props?.["data-mcp"] === "s1",
    probe: "settings:addMcp",
  },
  env: {
    settings: { env: { state: "ready", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null } },
    marker: (n) => n?.props?.["data-field"] === "proxy.uri",
    probe: "settings:testProxy",
  },
  tools: {
    settings: { tools: { state: "ready", status: null, building: false, keys: { embedding: { hasKey: true }, websearch: { hasKey: false } }, edit: null } },
    marker: (n) => n?.props?.["data-key-row"] === "embedding",
    probe: "settings:keyEdit",
  },
  models: {
    settings: { models: { state: "ready", consult: [{ provider: "p1", model: "m1" }], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } } },
    marker: (n) => n?.props?.["data-consult"] === "p1:m1",
    probe: "settings:consultRemove",
  },
}

// ─── 波 1 腿 ① · 树形（五组序 ∥ 设置组条目序 ∥ 七组项 emit 闭集 ∥ 跨面闭集一致性）──────────────

test("波1腿① 树形：五组序 ∥ 设置组条目序 ∥ 七组项 emit 闭集 ∥ 跨面闭集一致性", () => {
  const { template, actions, natives } = buildMenu()
  assert.equal(template.length, 5, "恰五组")
  assert.deepEqual(template.map((g) => g.label), ["文件", "编辑", "视图", "设置", "帮助"])

  const group = template[3].submenu
  assert.deepEqual(group.map((i) => i.label ?? i.type),
    ["设置…", "separator", "渠道…", "模型与档位…", "agent 参数…", "MCP…", "运行环境…", "工具与服务…", "会诊与审查…", "separator", "维护", "关于与快捷键"],
    "条目序 = 设置… ∥ sep ∥ 七组项 ∥ sep ∥ 维护▸ ∥ 关于与快捷键▸")

  // 七组项 emit = ("openSettings", undefined, 组名) —— 序 = SETTINGS_GROUPS
  const items = group.slice(2, 9)
  for (const item of items) item.click()
  assert.deepEqual(actions, SETTINGS_GROUPS.map((name) => ["openSettings", undefined, name]), "七组项 emit 闭集 + path 恰位")
  group[0].click()
  assert.deepEqual(actions.at(-1), ["openSettings"], "设置…（缺 value ⇒ 页径）")

  // 两子组 = 行为零改（gc ∥ index / help / about）
  const maintenance = group[10]
  assert.deepEqual(maintenance.submenu.map((i) => i.label), ["清理会话数据…", "重建会话索引"])
  maintenance.submenu[0].click()
  maintenance.submenu[1].click()
  const aboutShortcuts = group[11]
  assert.deepEqual(aboutShortcuts.submenu.map((i) => i.label), ["命令与快捷键…", "关于 ThinCoder…"])
  aboutShortcuts.submenu[0].click()
  aboutShortcuts.submenu[1].click()
  assert.deepEqual(natives, [["gc"], ["index"], ["about"]], "宿主自办三缝零改")
  assert.deepEqual(actions.at(-1), ["help"], "命令与快捷键 ⇒ emit(help) 零改")

  // 帮助组零动（「关于与快捷键」= 同二项之第二入口）
  assert.deepEqual(template[4].submenu.map((i) => i.label), ["命令与快捷键…", "关于 ThinCoder…"])

  // 跨面闭集一致性：主侧镜像 ≡ 视图单源 ≡ 读取面键序（源 ∕ 镜像三面同值）
  assert.deepEqual([...SETTINGS_GROUPS], SECTIONS.map((s) => s.name), "SETTINGS_GROUPS ≡ SECTIONS 名序")
  assert.deepEqual(Object.keys(settingsSectionLabels("zh")), [...SETTINGS_GROUPS], "读取面键序同值")
  assert.equal(SETTINGS_GROUPS.length, 7)

  // maintenance 键值保持（现役 = 子组标签）∥ 三新键在位（en 轮）
  assert.equal(menuLabels("zh").maintenance, "维护")
  const en = buildMenu({ locale: "en" })
  assert.deepEqual(en.template.map((g) => g.label), ["File", "Edit", "View", "Settings", "Help"])
  assert.equal(en.template[3].submenu[0].label, "Settings…")
  assert.equal(en.template[3].submenu[10].label, "Maintenance")
  assert.equal(en.template[3].submenu[11].label, "About & Shortcuts")
})

// ─── 波 1 腿 ② · 词面 ∥ 回落（键集 32 ∥ 段名投影 ∥ en 回落 ∥ 零重叠键）──────────────────────────

test("波1腿② 词面 ∥ 回落：键集 32 ∥ 段名 = HOST_DICT 投影 ∥ 未知 ⇒ en ∥ 零重叠键", () => {
  for (const locale of ["zh", "en"]) {
    const words = menuLabels(locale)
    assert.deepEqual(Object.keys(words).sort(), [...WORD_KEYS].sort(), `${locale} 键集 = 预期 32`)
    for (const key of WORD_KEYS) {
      assert.equal(typeof words[key], "string", `${locale}.${key} 在场`)
      assert.notEqual(words[key], "", `${locale}.${key} 值非空`)
    }
  }
  assert.equal(WORD_KEYS.length, 32)
  assert.equal(Object.keys(menuLabels("zh")).length, 29 + 3, "键集 29 ⇒ 32")

  // 三新键值（双语）
  assert.equal(menuLabels("zh").settings, "设置")
  assert.equal(menuLabels("en").settings, "Settings")
  assert.equal(menuLabels("zh").settingsOpen, "设置…")
  assert.equal(menuLabels("en").settingsOpen, "Settings…")
  assert.equal(menuLabels("zh").aboutShortcuts, "关于与快捷键")
  assert.equal(menuLabels("en").aboutShortcuts, "About & Shortcuts")

  // 段名读数 = HOST_DICT `settings.section.*` 投影（两语逐名同源；非空）
  for (const locale of ["zh", "en"]) {
    const labels = settingsSectionLabels(locale)
    const dict = HOST_DICT[locale] ?? HOST_DICT[FALLBACK_LOCALE]
    assert.deepEqual(Object.keys(labels), [...SETTINGS_GROUPS])
    for (const name of SETTINGS_GROUPS) {
      assert.equal(labels[name], dict[`settings.section.${name}`], `${locale} ${name} 投影同源`)
      assert.notEqual(labels[name], "")
    }
  }
  // en 回落（未知 / 缺 / 空 / 归一）
  assert.deepEqual(settingsSectionLabels("fr"), settingsSectionLabels("en"))
  assert.deepEqual(settingsSectionLabels(undefined), settingsSectionLabels("en"))
  assert.deepEqual(settingsSectionLabels(""), settingsSectionLabels("en"))
  assert.deepEqual(settingsSectionLabels("zh-CN"), settingsSectionLabels("zh"))
  // 缺键 ⇒ 键名终态（源判据 —— 真实双表 7 键全在，缺键径 = 未来增组防漂）
  assert.match(read("thincoder-desktop/src/main/menu-words.mjs"), /typeof value === "string" \? value : key/)

  // 模板消费真读数：label = 段名 + 「…」后缀（菜单形）
  const { template } = buildMenu()
  assert.equal(template[3].submenu[2].label, "渠道…")
  assert.equal(template[3].submenu[3].label, "模型与档位…")
  assert.equal(template[3].submenu[8].label, "会诊与审查…")

  // 零重叠键（菜单自持键面 ∩ HOST_DICT = ∅ —— 两语同判）
  for (const dict of [HOST_DICT.zh ?? {}, HOST_DICT.en ?? {}]) {
    for (const key of WORD_KEYS) assert.equal(Object.hasOwn(dict, key), false, `键重叠：${key}`)
  }
})

// ─── 波 1 腿 ③ · 通道双表 + 动作闭集六 ──────────────────────────────────────────────────────

test("波1腿③ 通道双表 + 动作闭集六（零新通道 ∥ 表外记错 ∥ app.mjs 双口转接）", () => {
  // 零新通道：事件双表含 ev:menu 且等值（24）；白名单 47 与注册表闭包不动
  const subscribe = read("thincoder-desktop/renderer/events-subscribe.mjs")
  const subChannels = ((subscribe.match(/const CHANNELS = \[[\s\S]*?\]/) ?? [""])[0].match(/"[^"]+"/g) ?? []).map((name) => name.slice(1, -1))
  assert.ok(subChannels.includes("ev:menu"), "订阅面表含 ev:menu")
  assert.deepEqual([...preload.EVENT_CHANNELS], subChannels, "双表等值（逐名逐序）")
  assert.equal(preload.EVENT_CHANNELS.length, 24)
  assert.equal(preload.CHANNELS.length, 47)
  assert.equal(new Set(preload.CHANNELS).size, 47)
  const registry = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const table = (registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0]
  const rows = [...table.matchAll(/"([^"]+)":/g)].map((match) => match[1])
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "注册表闭包（表行集 = 白名单集）")

  // 分派器：六动作（openSettings 两形）⇒ 注入面；表外 ⇒ 零动作 + 记错
  const log = []
  const spy = (name) => (...args) => { log.push([name, ...args]) }
  const onMenu = createMenuActions({
    createSession: spy("createSession"), openDir: spy("openDir"), openSearch: spy("openSearch"),
    setTheme: spy("setTheme"), printHelp: spy("printHelp"), openSettings: spy("openSettings"),
  })
  const cases = [
    [{ action: "newSession" }, ["createSession"]],
    [{ action: "openProject" }, ["openDir", undefined]],
    [{ action: "openProject", path: "D:/w/x" }, ["openDir", "D:/w/x"]],
    [{ action: "find" }, ["openSearch"]],
    [{ action: "theme", value: "dark" }, ["setTheme", "dark"]],
    [{ action: "help" }, ["printHelp"]],
    [{ action: "openSettings" }, ["openSettings", undefined]],
    [{ action: "openSettings", value: "providers" }, ["openSettings", "providers"]],
    [{ action: "openSettings", value: "" }, ["openSettings", undefined]],
  ]
  for (const [ev] of cases) assert.equal(onMenu(ev), true, `受理：${JSON.stringify(ev)}`)
  assert.deepEqual(log, cases.map(([, expected]) => expected), "派发恰位（缺 value ⇒ undefined；携组名 ⇒ 组名）")

  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    assert.equal(createMenuActions({ openSettings: () => false })({ action: "openSettings" }), true) // 出口返 false（拒径）⇒ 记错
    assert.equal(onMenu({ action: "bogus" }), false)
    assert.equal(onMenu({}), false)
    assert.equal(onMenu(null), false)
  } finally { console.error = original }
  assert.equal(errors.length, 4)
  assert.equal(log.length, cases.length, "表外零派发")

  // app.mjs 双口转接（源扫）：缺组 ⇒ 页 ∥ 携组名 ⇒ 弹窗（转接点 = 注入面）
  const app = read("thincoder-desktop/renderer/app.mjs")
  assert.match(app, /typeof group === "string"/, "组名判据在场")
  assert.match(app, /settingsFace\.openSettingsModal\(group\)/, "携组名 ⇒ 组弹窗")
  assert.match(app, /settingsFace\.openSettings\(\)/, "缺组 ⇒ 现有设置页")
})

// ─── 波 2 腿 ④ · 弹窗树（结构 ∥ 三关 ∥ notice 过滤 ∥ 体恰一组 ∥ 表外组 ∥ re-export 同源）─────────

test("波2腿④ 弹窗树：背板 ∥ 卡 ∥ 头 ∥ 体恰一组 ∥ notice 过滤两向 ∥ 三关 handler 在场", () => {
  // re-export 同源（宿主 ∥ 视图 —— 单源单份，零第二实现）
  assert.equal(modalHost.settingsModalTree, settingsModalTree, "宿主 re-export = 同一函数")

  const closes = []
  const stops = []
  const state = baseState(GROUP_FIXTURES.providers.settings)
  const tree = settingsModalTree(state, "providers", { onCloseModal: () => closes.push("close") })
  assert.ok(tree !== null && tree !== undefined)

  // 背板 ∥ 卡
  assert.equal(tree.backdrop.props.class, "settings-modal-backdrop")
  assert.equal(typeof tree.backdrop.props.onClick, "function", "背板 handler 在场")
  assert.equal(tree.card.props.class, "settings-modal")
  assert.equal(tree.card.props.role, "dialog")
  assert.equal(tree.card.props["aria-modal"], "true")
  assert.equal(tree.card.props["aria-label"], i18n.t("settings.section.providers"))
  assert.equal(typeof tree.card.props.onKeydown, "function", "Esc handler 在场")

  // 头：组名标题 + ✕（锚 settings:modalClose）
  const head = byClass(tree.card, "settings-head")
  assert.equal(byClass(head, "settings-title").children[0], i18n.t("settings.section.providers"))
  const close = byAction(tree.card, "settings:modalClose")
  assert.equal(close.props.class, "settings-close", "✕ 形复用 `.settings-close`")
  assert.equal(close.props["aria-label"], i18n.t("settings.close"))
  assert.equal(typeof close.props.onClick, "function", "✕ handler 在场")

  // 体：本组特征锚在场
  const body = byClass(tree.card, "settings-modal-body")
  assert.ok(findDeep(body, GROUP_FIXTURES.providers.marker), "体 = providers 段面")
  assert.equal(body.props["data-state"], "ready", "体段态锚（第二闸在途判据面）")

  // 三关行为：背板 ∥ 卡内 Esc（stopPropagation）∥ ✕
  tree.backdrop.props.onClick()
  tree.card.props.onKeydown({ key: "Escape", stopPropagation: () => stops.push("stop") })
  close.props.onClick()
  assert.deepEqual(closes, ["close", "close", "close"], "三关同引 onCloseModal")
  assert.deepEqual(stops, ["stop"], "卡内 Esc stopPropagation（不连带触 F-Esc）")
  tree.card.props.onKeydown({ key: "a" })
  assert.equal(closes.length, 3, "非 Esc 零动作")

  // 表外组 ⇒ null（防御档 —— 调用面已验 SCOPES）
  assert.equal(settingsModalTree(state, "bogus", {}), null)
})

test("波2腿④b 体恰一组：七组逐组 —— 本组特征锚在场 ∥ 他组锚全隐", () => {
  const names = Object.keys(GROUP_FIXTURES)
  const markers = Object.fromEntries(names.map((name) => [name, GROUP_FIXTURES[name].marker]))
  // 单组态：任一时点恰一组 ready（他组 none）⇒ 跨组互斥可判
  for (const name of names) {
    const tree = settingsModalTree(baseState(GROUP_FIXTURES[name].settings), name, {})
    const body = byClass(tree.card, "settings-modal-body")
    for (const other of names) {
      const hit = findDeep(body, markers[other]) !== null
      assert.equal(hit, other === name, `${name} 弹窗：${other} 特征锚 ${other === name ? "在场" : "应隐"}`)
    }
  }
})

test("波2腿④c notice 过滤两向：本组 ∨ panel 显 ∥ 他组隐", () => {
  const withNotice = (scope) => settingsModalTree(baseState({ notice: { scope, reason: "probe-failed" } }), "providers", {})
  const mine = byClass(withNotice("providers").card, "settings-notice")
  assert.ok(mine !== null, "本组失败串在场")
  assert.equal(mine.props["data-scope"], "providers")
  const panel = byClass(withNotice("panel").card, "settings-notice")
  assert.ok(panel !== null, "panel 级失败串在场")
  assert.equal(panel.props["data-scope"], "panel")
  assert.equal(byClass(withNotice("mcp").card, "settings-notice"), null, "他组失败串隐（零节点）")
})

// ─── 波 2 腿 ⑤ · 复用链 ∥ 状态 ─────────────────────────────────────────────────────────────

test("波2腿⑤ 复用链 ∥ 状态：初值 ∥ 读取链逐组 ∥ 闭集验证 ∥ 占槽拒 ∥ 限本组复位 ∥ 出口全表", async () => {
  // store 初值
  assert.equal(initialState().settings.modal, null, "`settings.modal` 初值 = null")

  // 出口映射（源判据）：弹窗出口链 = 同一 exits.handlers 全表注入（零第二份）
  const mount = read("thincoder-desktop/renderer/mount-settings.mjs")
  assert.match(mount, /const modalHandlers = \{ \.\.\.exits\.handlers, onCloseModal: closeSettingsModal \}/, "出口链 = exits.handlers 全表")
  assert.match(mount, /const group = state\?\.settings\?\.modal \?\? null/, "弹窗渲染 = 切片驱动")

  // 装配面决策直测（桩 document：本腿只测决策 ∥ 调度面；DOM 建面别腿源扫）
  const prevDoc = globalThis.document
  globalThis.document = { querySelector: () => null, addEventListener: () => {} }
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    const store = createStore(initialState())
    const calls = []
    const receipts = {
      "provider:list": { ok: true, active: null, presets: [], providers: [] },
      "settings:agent": { ok: true, fields: [], models: null },
      "mcp:list": { ok: true, servers: [] },
      "settings:env": { ok: true, proxy: {}, shell: {} },
      "settings:tools": { ok: true },
      "index:status": { ok: true, status: null },
    }
    const host = { invoke: async (channel) => { calls.push(channel); return receipts[channel] ?? { ok: false, reason: "stub" } } }
    const face = attachSettings(host, { store })
    face.detach() // 防重绘（平 node 零 DOM 建面）
    const settle = () => new Promise((done) => setTimeout(done, 0))

    // 七组 → 读取链（逐组通道直测 —— 单源 = MODAL_READS 表）
    const READ_CHANNEL = {
      providers: ["provider:list"], model: ["provider:list"], agent: ["settings:agent"], mcp: ["mcp:list"],
      env: ["settings:env"], tools: ["settings:tools", "index:status"], models: ["settings:agent"],
    }
    for (const name of SETTINGS_GROUPS) {
      calls.length = 0
      assert.equal(face.openSettingsModal(name), true, `开：${name}`)
      assert.equal(store.get().settings.modal, name, `切片写：${name}`)
      await settle()
      assert.deepEqual(calls, READ_CHANNEL[name], `读取链：${name}`)
    }

    // 闭集验证（表外组 ⇒ 拒 + 记错 + 零动作）
    const before = errors.length
    assert.equal(face.openSettingsModal("bogus"), false)
    assert.equal(store.get().settings.modal, "models", "拒 ⇒ 切片零动")
    assert.equal(errors.length, before + 1)
    assert.match(String(errors.at(-1)[0]), /unknown group/)

    // 占槽拒（向导期开 ⇒ 拒 + 记错 + 零动作）
    store.set(patchSettings(store.get(), { configured: false, wizard: { step: 1, dismissed: false, notice: null } }))
    assert.equal(face.openSettingsModal("providers"), false)
    assert.equal(store.get().settings.modal, "models", "拒 ⇒ 切片零动")
    assert.match(String(errors.at(-1)[0]), /wizard occupies/)
    store.set(patchSettings(store.get(), { configured: true, wizard: { step: 1, dismissed: false, notice: null } }))

    // 复位限本组（开 ∥ 关）：providers 四切片只随 providers 组动；mcp.form 只随 mcp 组动
    const facets = { state: "ready", presets: [], providers: [{ name: "p1" }], edit: "p1", probe: { state: "ok" }, draft: { a: 1 }, keyDraft: { name: "p1", value: "sk" } }
    const mcpFacet = { state: "ready", servers: [], details: {}, form: { editing: "s1", type: "stdio" } }
    store.set(patchSettings(store.get(), { providers: facets, mcp: mcpFacet }))
    assert.equal(face.openSettingsModal("providers"), true)
    let settings = store.get().settings
    assert.equal(settings.providers.edit, null, "开 providers ⇒ 本组复位（edit）")
    assert.equal(settings.providers.probe, null, "开 providers ⇒ 本组复位（probe）")
    assert.equal(settings.providers.draft, null, "开 providers ⇒ 本组复位（draft）")
    assert.equal(settings.providers.keyDraft, null, "开 providers ⇒ 本组复位（keyDraft）")
    assert.deepEqual(settings.providers.providers, [{ name: "p1" }], "名单照持（只复面态，不动值面）")
    assert.deepEqual(settings.mcp.form, { editing: "s1", type: "stdio" }, "他组（mcp.form）零动")
    face.closeSettingsModal()
    settings = store.get().settings
    assert.equal(settings.modal, null, "关 ⇒ 切片清")
    assert.deepEqual(settings.mcp.form, { editing: "s1", type: "stdio" }, "关 providers ⇒ mcp.form 仍零动")
    store.set(patchSettings(store.get(), { providers: { ...settings.providers, edit: "p2" } }))
    assert.equal(face.openSettingsModal("mcp"), true)
    settings = store.get().settings
    assert.equal(settings.mcp.form, null, "开 mcp ⇒ mcp.form 复位")
    assert.equal(settings.providers.edit, "p2", "他组（providers.edit）零动")
    face.closeSettingsModal()
    assert.equal(store.get().settings.modal, null)
  } finally {
    console.error = original
    globalThis.document = prevDoc
  }

  // 出口映射（树面）：七组逐组 —— 注入全表后每个 data-action 节点皆活件（零第二映射）
  const allSpy = new Proxy({}, { get: () => () => {} })
  for (const name of SETTINGS_GROUPS) {
    const tree = settingsModalTree(baseState(GROUP_FIXTURES[name].settings), name, allSpy)
    const nodes = collectDeep(tree.card, (n) => typeof n?.props?.["data-action"] === "string")
    assert.ok(nodes.length > 0, `${name} 面动作节点在场`)
    for (const node of nodes) {
      const live = typeof node.props.onClick === "function"
      assert.ok(live || node.props.disabled === true, `${name} ${node.props["data-action"]}：活件或显式禁用（零静默死控）`)
    }
    const probe = byAction(tree.card, GROUP_FIXTURES[name].probe)
    assert.ok(probe !== null, `${name} 代表动作 ${GROUP_FIXTURES[name].probe} 在场`)
    assert.equal(typeof probe.props.onClick, "function", `${name} 代表动作活件（出口全表注入）`)
  }
})

// ─── 波 2 腿 ⑥ · 样式 ∥ 链序 ────────────────────────────────────────────────────────────────

test("波2腿⑥ 样式 ∥ 链序：z-20/21 ∥ 零新变量 ∥ 零新断点 ∥ settings.css 零触 ∥ index.html 链序", () => {
  const css = read("thincoder-desktop/renderer/settings-modal.css")
  const bare = stripComments(css)
  const backdrop = blockOf(bare, ".settings-modal-backdrop")
  assert.ok(backdrop !== null, "背板规则在盘")
  assert.ok(backdrop.includes("position: fixed") && backdrop.includes("inset: 0"), "背板全覆盖")
  assert.ok(backdrop.includes("z-index: 20"), "背板 z-20")
  assert.ok(backdrop.includes("background: var(--overlay)"), "背板底 = `--overlay`")
  const card = blockOf(bare, ".settings-modal")
  assert.ok(card !== null, "卡规则在盘")
  assert.ok(card.includes("z-index: 21"), "卡 z-21")
  assert.ok(card.includes("min(48rem, calc(100vw - 2 * var(--gap)))"), "卡宽 ≤ 48rem ∥ 视口−2gap")
  assert.ok(card.includes("max-height: calc(100vh - 2 * var(--gap))"), "卡高 ≤ 视口−2gap")
  assert.ok(card.includes("overflow: auto"), "卡内滚")
  assert.ok(card.includes("background: var(--bg-raised)"), "卡底 `--bg-raised`")
  assert.ok(card.includes("border: 1px solid var(--line)"), "1px `--line` 描边")
  assert.ok(card.includes("box-shadow: var(--shadow)"), "`--shadow` 在位")
  // 样式纪律：零新变量 ∥ 零新断点
  assert.equal(css.split("\n").filter((line) => /^\s*--[\w-]+\s*:/.test(line)).length, 0, "零 `--` 定义")
  assert.equal(stripComments(css).includes("@media"), false, "零 `@media`（源面；注释内字面不计）")
  // settings.css 零触（304 在盘 ∥ 无 modal 规则）
  const settings = read("thincoder-desktop/renderer/settings.css")
  assert.equal(contentLines(settings), 304, "settings.css 行数不动（304 在盘）")
  assert.equal(/settings-modal/.test(settings), false, "settings.css 无 modal 规则")
  // z 族在位（设置面 10 < 弹窗 20/21 < 确认 40/41）
  assert.ok(blockOf(stripComments(settings), "[data-slot=\"settings\"]").includes("z-index: 10"), "设置面 z-10 在位")
  const chrome = stripComments(read("thincoder-desktop/renderer/chrome.css"))
  assert.ok(blockOf(chrome, ".auto-backdrop").includes("z-index: 40"), "确认背板 z-40 保留")
  assert.ok(blockOf(chrome, ".auto-confirm").includes("z-index: 41"), "确认卡 z-41 保留（盖弹窗）")
  // index.html 链序（settings-modal.css 在 settings.css 后）
  const html = read("thincoder-desktop/renderer/index.html")
  const pos = (name) => html.indexOf(`href="./${name}"`)
  assert.ok(pos("settings.css") !== -1 && pos("settings-modal.css") !== -1, "两链行在场")
  assert.ok(pos("settings.css") < pos("settings-modal.css"), "链序 = settings.css 后")
})
