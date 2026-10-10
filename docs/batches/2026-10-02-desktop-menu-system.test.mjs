/**
 * 2026-10-02-desktop-menu-system.test.mjs — 批内件（菜单体系批 · 台账 #811 · 实施轮）。
 * **重锚（2026-10-04 · 台账 #889）——断言 = 现盘形**：菜单树形 ∕ 动作集 ∕ 键集（43）∥ 通道计数（51）随后续批演进（#817 设置体系 ∥ #888 更名 ∥ 桌面发布批 `panel:state` 等）——本档逐腿改钉至现读（复跑 8/8）；平行判据 = `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs` ∥ `docs/batches/2026-10-02-settings-menu-trim.test.mjs`。
 * 判据表 = 批档 `docs/batches/2026-10-02-desktop-menu-system.md` §2.4（机检五腿）+ §2.1（条目覆盖）；
 * 决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-65**；通道契约 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行
 * ∥ §2 `theme:state` 行。
 *
 * 面（只测本批改动面 —— 平 node；菜单面为纯函数腿，零 DOM）：
 *   腿 ① 菜单树：五组序 ∥ 逐组条目 ∥ 三加速键（N/O/F）∥ 窗口组退场 ∥ 主题▸三值序（`THEMES` 同序）；
 *   腿 ①b 带勾态：`checkbox` + `checked` 逐项判等（恰一真 ∥ 报告未达 = 全零勾）；
 *   腿 ①c 最近▸：≤10 链（数据面封顶 + 模板直通）∥ 空表 ⇒ 单枚禁用占位 ∥ 项 label = cwd 全路径；
 *   腿 ② 双语 ∥ 回落：zh/en 双值 ∥ 未知 ∥ 缺 ∥ `zh-CN` 归一 ⇒ en 回落 ∥ role 标签显式双语覆写；
 *   腿 ③ 动作闭集：模板两缝（`onAction` 五值直通 ∥ `onNative` 三值直通）；腿 ③b 分派器（五动作 ⇒ 既有单一实现
 *        ∥ 表外 ⇒ 零动作 + 记错）；
 *   腿 ④ 词表纪律：`menuLabels` 键集 = 预期集（两语同集）∥ Edit 四值 = `contextMenuLabels` 同源（sentinel 证）
 *        ∥ 与 `HOST_DICT` 零重叠键；
 *   腿 ⑤ 通道面 + 回读面：`preload.cjs` `EVENT_CHANNELS` ∥ `events-subscribe.mjs` `CHANNELS` 双表含 `ev:menu`
 *        且等值（24）∥ `CHANNELS` 末位 48 = `panel:state` ∥ `ipc-registry.mjs` `HANDLERS` 含同项且表行 = 白名单闭合。
 *
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd——路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-02-desktop-menu-system.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const ROOT = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => fileURLToPath(new URL(p, ROOT))
const src = (p) => readFileSync(rel(p), "utf8")
const require = createRequire(import.meta.url)

const { THEME_VALUES, menuTemplate } = await import(new URL("thincoder-desktop/src/main/app-menu.mjs", ROOT).href)
const { menuLabels } = await import(new URL("thincoder-desktop/src/main/menu-words.mjs", ROOT).href)
const { contextMenuLabels } = await import(new URL("thincoder-desktop/src/main/context-menu.mjs", ROOT).href)
const { THEMES } = await import(new URL("thincoder-desktop/renderer/theme.mjs", ROOT).href)
const { HOST_DICT, FALLBACK_LOCALE } = await import(new URL("thincoder-desktop/renderer/i18n.mjs", ROOT).href)
const { createMenuActions } = await import(new URL("thincoder-desktop/renderer/menu-actions.mjs", ROOT).href)
const preload = require(rel("thincoder-desktop/src/preload/preload.cjs"))

/** 全菜单键集（预期 —— 词表纪律腿判据；增键须两语同增）。 */
const WORD_KEYS = [
  "file", "edit", "view", "settings", "maintenance", "help",
  "newSession", "openProject", "recent", "recentEmpty", "close", "quit",
  "undo", "redo", "find",
  "reload", "forceReload", "toggleDevTools", "resetZoom", "zoomIn", "zoomOut", "toggleFullscreen",
  "theme", "themeSystem", "themeLight", "themeDark",
  "cleanUp", "rebuildIndex",
  "settingsOpen",
  "helpCommands", "about", "aboutShortcuts", "checkUpdate", "checkingUpdate", "downloadingUpdate",
  "restartUpdate", "updateDialogTitle", "updateFailed", "updateNotice", "updateRestartCancel", "updateRestartConfirm", "updateRestartOk", "updateUpToDate",
]

/** 建模板（真词表 + 真四值注入；两缝捕获）——腿 ①–④ 共用读数面。 */
function build({ locale = "zh", recent = [], theme = null } = {}) {
  const actions = []
  const natives = []
  const template = menuTemplate({
    words: menuLabels(locale), edit: contextMenuLabels(locale), recent, theme,
    onAction: (...args) => actions.push(args),
    onNative: (...args) => natives.push(args),
  })
  return { template, actions, natives }
}

const flat = (template) => template.flatMap((group) => group.submenu)
const deepItems = (items) => items.flatMap((item) => [item, ...(Array.isArray(item.submenu) ? deepItems(item.submenu) : [])])
const findItem = (template, label) => deepItems(flat(template)).find((item) => item.label === label)
const THEME_SUB = (template) => template[2].submenu.at(-1).submenu
const RECENT_SUB = (template) => template[0].submenu[2].submenu

// ─── 腿 ① · 菜单树（五组序 ∥ 逐组条目 ∥ 三加速键 ∥ 窗口组退场）──────────────────────────────

test("腿 ① 菜单树：五组序 ∥ 逐组条目 ∥ 三加速键 ∥ 窗口组退场", () => {
  const { template } = build()
  assert.equal(template.length, 5, "恰五组")
  assert.deepEqual(template.map((group) => group.label), ["文件", "编辑", "视图", "设置", "帮助"])

  assert.deepEqual(template[0].submenu.map((item) => item.label ?? item.type), ["新建会话", "打开工作目录…", "最近工作目录", "separator", "关闭窗口", "退出 ThinCoder"])
  assert.equal(template[0].submenu[0].accelerator, "CmdOrCtrl+N")
  assert.equal(template[0].submenu[1].accelerator, "CmdOrCtrl+O")
  assert.deepEqual([template[0].submenu[4].role, template[0].submenu[5].role], ["close", "quit"])

  assert.deepEqual(template[1].submenu.map((item) => item.role ?? item.type), ["undo", "redo", "separator", "cut", "copy", "paste", "selectAll", "separator", undefined])
  assert.equal(template[1].submenu[8].label, "查找…")
  assert.equal(template[1].submenu[8].accelerator, "CmdOrCtrl+F")

  assert.deepEqual(template[2].submenu.map((item) => item.role ?? item.label ?? item.type),
    ["reload", "forceReload", "toggleDevTools", "separator", "resetZoom", "zoomIn", "zoomOut", "separator", "toggleFullscreen", "separator", "主题"])

  assert.deepEqual(template[3].submenu.map((item) => item.label ?? item.type), ["设置…", "separator", "providers…", "agent…", "mcp…", "env…", "tools…", "models…", "separator", "维护", "关于与快捷键"])
  assert.deepEqual(template[4].submenu.map((item) => item.label ?? item.type), ["检查更新…", "separator", "命令与快捷键…", "关于 ThinCoder…"])

  // 三加速键恰三件（新增件 = N/O/F；role 默认加速键不落显式键）
  assert.deepEqual(flat(template).filter((item) => typeof item.accelerator === "string").map((item) => item.accelerator),
    ["CmdOrCtrl+N", "CmdOrCtrl+O", "CmdOrCtrl+F"])
  // 窗口组退场（minimize ∥ zoom 全树零残）
  assert.equal(JSON.stringify(template).includes("minimize"), false)
  assert.equal(JSON.stringify(template).includes("\"zoom\""), false)
})

// ─── 腿 ①b · 主题▸带勾态（序 = THEMES ∥ 恰一真 ∥ 报告未达全零勾）────────────────────────────

test("腿 ①b 主题▸：三值序 = THEMES 闭集序 ∥ checkbox + 恰一真（报告未达 ⇒ 全零勾）", () => {
  assert.deepEqual([...THEME_VALUES], [...THEMES], "主 ∥ 渲染单源同序同值")
  const wants = [
    [null, [false, false, false]],
    ["system", [true, false, false]],
    ["light", [false, true, false]],
    ["dark", [false, false, true]],
  ]
  for (const [theme, checked] of wants) {
    const items = THEME_SUB(build({ theme }).template)
    assert.deepEqual(items.map((item) => item.label), ["跟随系统", "亮色", "暗色"], `序（theme=${theme}）`)
    assert.ok(items.every((item) => item.type === "checkbox"), "逐项 checkbox")
    assert.deepEqual(items.map((item) => item.checked), checked, `判等（theme=${theme}）`)
    assert.ok(items.filter((item) => item.checked).length <= 1, "恰一真 ∥ 全零勾（零误勾）")
  }
})

// ─── 腿 ①c · 最近▸（空表占位 ∥ cwd 全路径 ∥ ≤10 链）──────────────────────────────────────

test("腿 ①c 最近▸：空表 ⇒ 单枚禁用占位 ∥ 非空 ⇒ cwd 全路径逐项 ∥ ≤10 链（数据面封顶 + 模板直通）", () => {
  const empty = RECENT_SUB(build({ recent: [] }).template)
  assert.equal(empty.length, 1)
  assert.equal(empty[0].label, "无最近工作目录")
  assert.equal(empty[0].enabled, false)
  assert.equal(empty[0].click, undefined)

  const recent = [{ cwd: "D:/work/a" }, { cwd: "D:/work/b" }, { cwd: "D:/work/c" }]
  const { template, actions } = build({ recent })
  const items = RECENT_SUB(template)
  assert.deepEqual(items.map((item) => item.label), ["D:/work/a", "D:/work/b", "D:/work/c"])
  items[1].click()
  assert.deepEqual(actions, [["openProject", "D:/work/b"]], "path 恰位（最近项）")

  // ≤10 链：数据面 `RECENT_LIMIT = 10`（封顶既有）∧ 宿主经 `recentDirs()` 供面 ∧ 模板 1:1 直通（零增殖零过滤）
  const limit = Number(/RECENT_LIMIT = (\d+)/.exec(src("thincoder-desktop/src/main/projects.mjs"))[1])
  assert.equal(limit, 10, "数据面封顶 = 10")
  assert.match(src("thincoder-desktop/src/main/window.mjs"), /recent: recentDirs\(\)/)
  assert.equal(RECENT_SUB(build({ recent: Array.from({ length: 12 }, (_, i) => ({ cwd: `D:/p/${i}` })) }).template).length, 12)
})

// ─── 腿 ② · 双语 ∥ 回落（真词表消费 ∥ role 显式覆写）──────────────────────────────────────

test("腿 ② 双语 ∥ 回落：zh/en 双值 ∥ 未知 ∥ 缺 ∥ 归一 ⇒ en ∥ role 标签显式覆写", () => {
  const zh = menuLabels("zh")
  const en = menuLabels("en")
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort())
  assert.equal(zh.file, "文件")
  assert.equal(en.file, "File")
  assert.equal(zh.help, "帮助")
  assert.equal(en.help, "Help")
  assert.equal(zh.themeSystem, "跟随系统")
  assert.equal(en.themeSystem, "Follow System")

  // 回落（沿 #533 腿形）：缺 ∥ 空 ∥ 未知 ⇒ en；`zh-CN` 归一 ⇒ zh
  assert.equal(menuLabels("fr"), menuLabels("en"))
  assert.equal(menuLabels(undefined), menuLabels("en"))
  assert.equal(menuLabels(""), menuLabels("en"))
  assert.equal(menuLabels("zh-CN"), menuLabels("zh"))

  // 模板消费真词表：组名 + 全树条目双语（两语逐项 label 非空——缺键回落键名会立刻破形）
  const zhT = build({ locale: "zh" }).template
  const enT = build({ locale: "en" }).template
  assert.deepEqual(zhT.map((group) => group.label), ["文件", "编辑", "视图", "设置", "帮助"])
  assert.deepEqual(enT.map((group) => group.label), ["File", "Edit", "View", "Settings", "Help"])
  for (const template of [zhT, enT]) {
    for (const item of flat(template)) {
      if (item.type === "separator") continue
      assert.equal(typeof item.label, "string")
      assert.notEqual(item.label, "")
    }
  }

  // role 标签 = 显式双语覆写（15 件：close/quit ∥ undo/redo ∥ cut/copy/paste/selectAll ∥ view 七）
  for (const [template, words] of [[zhT, zh], [enT, en]]) {
    const roles = flat(template).filter((item) => typeof item.role === "string")
    assert.equal(roles.length, 15, "role 件数（零漏覆写）")
    for (const item of roles) {
      if (["cut", "copy", "paste", "selectAll"].includes(item.role)) continue // 四值另源（腿 ④）
      assert.equal(item.label, words[item.role], `role ${item.role}`)
    }
  }
})

// ─── 腿 ③ · 动作闭集（两缝直通）∥ 腿 ③b 分派器 ──────────────────────────────────────────

test("腿 ③ 动作闭集：模板两缝（onAction 五值直通 ∥ onNative 三值直通）", () => {
  const { template, actions, natives } = build({ recent: [{ cwd: "D:/w/r1" }] })
  for (const label of ["新建会话", "打开工作目录…", "查找…", "命令与快捷键…"]) findItem(template, label).click()
  assert.deepEqual(actions, [["newSession"], ["openProject"], ["find"], ["help"]])
  THEME_SUB(template)[1].click()
  assert.deepEqual(actions.at(-1), ["theme", undefined, "light"], "value 恰位（theme）")
  RECENT_SUB(template)[0].click()
  assert.deepEqual(actions.at(-1), ["openProject", "D:/w/r1"], "path 恰位（openProject）")
  assert.deepEqual([...new Set(actions.map((call) => call[0]))].sort(), ["find", "help", "newSession", "openProject", "theme"], "恰五动作（零表外 emit）")

  // onNative 三值直通（宿主自办 —— 维护两项 + 关于；不经通道）
  findItem(template, "清理会话数据…").click()
  findItem(template, "重建会话索引").click()
  findItem(template, "关于 ThinCoder…").click()
  assert.deepEqual(natives, [["gc"], ["index"], ["about"]])
})

test("腿 ③b 分派器（menu-actions）：五动作 ⇒ 各既有单一实现 ∥ 表外 ⇒ 零动作 + 记错", () => {
  const log = []
  const spy = (name) => (...args) => { log.push([name, ...args]) }
  const onMenu = createMenuActions({
    createSession: spy("createSession"), openDir: spy("openDir"), openSearch: spy("openSearch"),
    setTheme: spy("setTheme"), printHelp: spy("printHelp"),
  })
  const cases = [
    { action: "newSession" }, { action: "openProject" }, { action: "openProject", path: "D:/w/x" },
    { action: "find" }, { action: "theme", value: "dark" }, { action: "help" },
  ]
  for (const ev of cases) assert.equal(onMenu(ev), true, `受理：${ev.action}`)
  assert.deepEqual(log, [
    ["createSession"], ["openDir", undefined], ["openDir", "D:/w/x"], ["openSearch"], ["setTheme", "dark"], ["printHelp"],
  ])
  // path 非串 ⇒ 按无 path 走（原生选择框径 —— 与 `openDir` 缺省同判）
  onMenu({ action: "openProject", path: 42 })
  assert.deepEqual(log.at(-1), ["openDir", undefined])

  // 表外 action ⇒ 零动作 + 记错（零静默 —— 防御档；载荷来自主进程）
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args)
  try {
    assert.equal(createMenuActions({ printHelp: () => false })({ action: "help" }), true) // 出口返 false（无动作可产）⇒ 记错 + 零动作
    assert.equal(onMenu({ action: "bogus" }), false)
    assert.equal(onMenu({}), false)
    assert.equal(onMenu(null), false)
  } finally { console.error = original }
  assert.equal(errors.length, 4)
  assert.equal(log.length, 7, "零新动作（表外零派发）")
})

// ─── 腿 ④ · 词表纪律（键集 = 预期集 ∥ 四值同源 ∥ 零重叠键）────────────────────────────────

test("腿 ④ 词表纪律：键集 = 预期集（两语同集）∥ Edit 四值 = contextMenuLabels 同源（sentinel 证）∥ 零重叠键", () => {
  for (const locale of ["zh", "en"]) {
    const words = menuLabels(locale)
    assert.deepEqual(Object.keys(words).sort(), [...WORD_KEYS].sort(), `${locale} 键集`)
    for (const key of WORD_KEYS) {
      assert.equal(typeof words[key], "string", `${locale}.${key} 在场`)
      assert.notEqual(words[key], "", `${locale}.${key} 值非空`)
    }
  }
  assert.equal(WORD_KEYS.length, 43)

  // Edit 四值读取 = contextMenuLabels 同源（→ HOST_DICT `menu.edit.*`）；模板四值 = 注入读取（非自立）
  for (const locale of ["zh", "en"]) {
    const labels = contextMenuLabels(locale)
    const dict = HOST_DICT[locale] ?? HOST_DICT[FALLBACK_LOCALE]
    for (const name of ["cut", "copy", "paste", "selectAll"]) {
      assert.equal(labels[name], dict[`menu.edit.${name}`], `${locale} menu.edit.${name} 同源`)
      const item = flat(build({ locale }).template).find((row) => row.role === name)
      assert.equal(item.label, labels[name], `模板 ${name} 应为注入读取值`)
    }
  }
  // sentinel：edit 注入为准（防两词表打架 —— 模板不得自立四值）
  const sentinel = { cut: "CUT!", copy: "COPY!", paste: "PASTE!", selectAll: "SEL!" }
  const sentinelTpl = menuTemplate({ words: menuLabels("en"), edit: sentinel, recent: [], theme: null })
  for (const name of ["cut", "copy", "paste", "selectAll"]) {
    assert.equal(flat(sentinelTpl).find((row) => row.role === name).label, sentinel[name])
  }
  // 零重叠键：menu-words 键面 ∩ HOST_DICT 键面 = ∅（两语同判）
  for (const dict of [HOST_DICT.zh ?? {}, HOST_DICT.en ?? {}]) {
    for (const key of WORD_KEYS) assert.equal(Object.hasOwn(dict, key), false, `键重叠：${key}`)
  }
})

// ─── 腿 ⑤ · 通道面 + 回读面（双表 ∥ 白名单末位 ∥ 注册闭合）──────────────────────────────────

test("腿 ⑤ 通道面 + 回读面：双表含 ev:menu 且等值（24）∥ CHANNELS 末位 51 = team:logout ∥ HANDLERS 闭合", () => {
  // 双表等值（preload `EVENT_CHANNELS` ∥ `events-subscribe.mjs` `CHANNELS` —— 后者不导出，取源提取）
  const subscribe = src("thincoder-desktop/renderer/events-subscribe.mjs")
  const subChannels = ((subscribe.match(/const CHANNELS = \[[\s\S]*?\]/) ?? [""])[0].match(/"[^"]+"/g) ?? []).map((name) => name.slice(1, -1))
  assert.ok(subChannels.includes("ev:menu"), "订阅面表含 ev:menu")
  assert.deepEqual([...preload.EVENT_CHANNELS], subChannels, "双表等值（逐名逐序）")
  assert.equal(preload.EVENT_CHANNELS.length, 24)

  // 请求白名单 48 ⇒ 51：末三 = team:status ∥ team:login ∥ team:logout（B1 团队三增；零改名零位移——panel:state 仍在册）
  assert.equal(preload.CHANNELS.length, 51)
  assert.equal(preload.CHANNELS.at(-1), "team:logout")
  assert.equal(new Set(preload.CHANNELS).size, 51)

  // 回读面注册闭合：HANDLERS 表行集 = 白名单集（含 theme:state —— 一白名单项 = 一处理体行）
  const registry = src("thincoder-desktop/src/main/ipc-registry.mjs")
  const table = (registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0]
  const rows = [...table.matchAll(/"([^"]+)":/g)].map((match) => match[1])
  assert.ok(rows.includes("theme:state"), "HANDLERS 含 theme:state")
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "注册表闭包（表行集 = 白名单集）")

  // 接线在场（源读取）：`ev:menu` 发送带 `isDestroyed` 守卫；`theme:state` 转口 `setMenuTheme`（宽松形——不耦单行字面）
  const win = src("thincoder-desktop/src/main/window.mjs")
  assert.match(win, /webContents\.send\("ev:menu"/)
  assert.match(win, /isDestroyed\(\)/)
  const ipc = src("thincoder-desktop/src/main/ipc.mjs")
  assert.match(ipc, /function themeState\b/, "处理体在场（ipc.mjs）")
  assert.match(ipc, /setMenuTheme\(payload\?\.theme\)/, "处理体转口 setMenuTheme")
})
