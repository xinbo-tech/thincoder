/**
 * app-menu.mjs — 应用菜单模板（菜单体系批 · D36 · 台账 #811；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-65**
 * ∥ 设置菜单升级批 · #817 **KD-67**）：`menuTemplate(...)` = 五组（文件 ∥ 编辑 ∥ 视图 ∥ **设置** ∥ 帮助）纯函数 ——
 * 零 `electron` ∕ 零 `node:` ⇒ 平 node 直测（先例 = `context-menu.mjs` 两纯函数；宿主面落子（`Menu.buildFromTemplate`
 * ∥ `setMenu` ∥ 关于面 ∥ `refreshMenu` ∥ `setMenuTheme`）= `window.mjs`）。
 * 词面单源 = `menu-words.mjs`（`words` 注入 —— 本档零词值）；设置六组段名经 `sections` 注入（值单源 = 渲染面
 * `HOST_DICT` `settings.section.*`——宿主以 `settingsSectionLabels(locale)` 取 —— 零第二份，沿 `edit` 注入先例）；
 * 编辑四值（cut/copy/paste/selectAll）经 `edit` 注入（值单源 = 渲染面 `HOST_DICT` `menu.edit.*` —— 两菜单同词面）。
 * 动作面两缝（皆注入 —— 本档零宿主依赖）：
 *   ① `onAction(action, path?, value?)` = **六动作通道闭集**（`newSession` ∥ `openProject` ∥ `find` ∥ `theme`
 *      ∥ `help` ∥ **`openSettings`**）—— `ev:menu` 载荷恰形（`path` 仅 `openProject` 携；`value` 携主二：
 *      `theme` 三值 ∥ `openSettings` 组名六值（= `SECTIONS` 名序去「模型与档位」——收窄批 #820）—— 缺 ⇒ 开设置面；不携 `key`）；
 *   ② `onNative(action)` = **宿主自办三项**（`gc` ∥ `index` ∥ `about` —— 不经通道：维护两项落原生对话框、
 *      关于落原生面板）。
 * `THEME_VALUES` 三值闭集同导出（序 = `renderer/theme.mjs` `THEMES`；主题▸勾选态 + 主进程 `theme:state` 报告
 * 校验面共用 —— 零第二份）；**`SETTINGS_GROUPS` 六组名闭集同导出**（镜像 = 渲染面 `views/settings.mjs` `SECTIONS`
 * 名序**去「模型与档位」**（收窄批 #820）—— 主 ∕ 渲染分层无直 import，先例 = `THEME_VALUES`；漂移检测 = 批内件跨面源扫）。
 * 设置组（#817；#820 收窄）：`设置…`（`settingsOpen` → `openSettings` 缺 `value`）∥ 六组项（段名 + 「…」后缀（菜单形）⇒
 * `openSettings` + `value` 组名 ⇒ 组弹窗）∥ 两子组（维护▸：`gc` ∥ `index`——行为零改；关于与快捷键▸：`help` ∥
 * `about`——帮助组同二项之**第二入口**，行为零改）。
 * 勾选态 = `type: "checkbox"` + `checked` 逐项判等（单源 = 主进程回读缓存；报告未达窗 ⇒ 全零勾 —— fail-open 零误勾）。
 * 键位：新增三件 `CmdOrCtrl+N` ∥ `O` ∥ `F`；其余 role 默认加速键保留（reload ∥ forceReload ∥ devTools ∥ 缩放三
 * ∥ 全屏）。窗口组（minimize/zoom）按五组枚举退场（KD-65 ①）。
 */

/** 主题三值闭集（序 = 跟随系统 ∥ 亮色 ∥ 暗色 —— 与 `renderer/theme.mjs` `THEMES` 同序同值）。 */
export const THEME_VALUES = Object.freeze(["system", "light", "dark"])

/** 设置六组名闭集（序 = 渲染面 `views/settings.mjs` `SECTIONS` 名序**去「模型与档位」**——收窄批 #820；菜单侧镜像单份；
 *  与 `SCOPES`（装配面派生 · 七名——设置页对齐）关系 = 菜单发出六名 ∥ 校验七名宽容（零改；漂移 = 批内件跨面源扫）。 */
export const SETTINGS_GROUPS = Object.freeze(["providers", "agent", "mcp", "env", "tools", "models"])

/** 主题值 → 词键（值面住 `menu-words.mjs`）。 */
const THEME_WORD_KEYS = Object.freeze({ system: "themeSystem", light: "themeLight", dark: "themeDark" })

/**
 * 菜单模板（`Menu.buildFromTemplate` 直接消费形）。
 * @param {{ words?: object, edit?: object, recent?: Array, theme?: string|null, sections?: object,
 *           onAction?: Function, onNative?: Function }} deps
 *   `words` = `menu-words.mjs` `menuLabels(locale)` 读数；`edit` = `contextMenuLabels(locale)` 读数（四值）；
 *   `recent` = `projects.mjs` `recentDirs()` 投影（`{ cwd }[]`，数据面已封顶 10；空表 ⇒ 单枚禁用占位）；
 *   `theme` = 勾选态回读缓存（`null` = 报告未达 ⇒ 全零勾）；`sections` = `settingsSectionLabels(locale)` 读数
 *   （组名 ⇒ 段名；缺 ⇒ 回落组名 —— 不静默变空串）；两缝缺 ⇒ 对应点击零动作（宿主装配期恒注入）。
 */
export function menuTemplate(deps = {}) {
  const words = deps.words ?? {}
  const edit = deps.edit ?? {}
  const recent = Array.isArray(deps.recent) ? deps.recent : []
  const theme = deps.theme ?? null
  const sections = deps.sections ?? {}
  const emit = typeof deps.onAction === "function" ? deps.onAction : () => {}
  const host = typeof deps.onNative === "function" ? deps.onNative : () => {}
  const roleItem = (role, key) => ({ role, label: words[key] })
  const sectionItem = (name) => ({
    label: `${typeof sections[name] === "string" && sections[name] !== "" ? sections[name] : name}…`,
    click: () => emit("openSettings", undefined, name),
  })
  const recentSubmenu = recent.length === 0
    ? [{ label: words.recentEmpty, enabled: false }]
    : recent.map((entry) => ({ label: entry?.cwd, click: () => emit("openProject", entry?.cwd) }))

  return [
    {
      label: words.file,
      submenu: [
        { label: words.newSession, accelerator: "CmdOrCtrl+N", click: () => emit("newSession") },
        { label: words.openProject, accelerator: "CmdOrCtrl+O", click: () => emit("openProject") },
        { label: words.recent, submenu: recentSubmenu },
        { type: "separator" },
        roleItem("close", "close"),
        roleItem("quit", "quit"),
      ],
    },
    {
      label: words.edit,
      submenu: [
        roleItem("undo", "undo"),
        roleItem("redo", "redo"),
        { type: "separator" },
        { role: "cut", label: edit.cut },
        { role: "copy", label: edit.copy },
        { role: "paste", label: edit.paste },
        { role: "selectAll", label: edit.selectAll },
        { type: "separator" },
        { label: words.find, accelerator: "CmdOrCtrl+F", click: () => emit("find") },
      ],
    },
    {
      label: words.view,
      submenu: [
        roleItem("reload", "reload"),
        roleItem("forceReload", "forceReload"),
        roleItem("toggleDevTools", "toggleDevTools"),
        { type: "separator" },
        roleItem("resetZoom", "resetZoom"),
        roleItem("zoomIn", "zoomIn"),
        roleItem("zoomOut", "zoomOut"),
        { type: "separator" },
        roleItem("toggleFullscreen", "toggleFullscreen"),
        { type: "separator" },
        {
          label: words.theme,
          submenu: THEME_VALUES.map((value) => ({
            label: words[THEME_WORD_KEYS[value]],
            type: "checkbox",
            checked: theme === value,
            click: () => emit("theme", undefined, value),
          })),
        },
      ],
    },
    {
      label: words.settings,
      submenu: [
        { label: words.settingsOpen, click: () => emit("openSettings") },
        { type: "separator" },
        ...SETTINGS_GROUPS.map((name) => sectionItem(name)),
        { type: "separator" },
        {
          label: words.maintenance,
          submenu: [
            { label: words.cleanUp, click: () => host("gc") },
            { label: words.rebuildIndex, click: () => host("index") },
          ],
        },
        {
          label: words.aboutShortcuts,
          submenu: [
            { label: words.helpCommands, click: () => emit("help") },
            { label: words.about, click: () => host("about") },
          ],
        },
      ],
    },
    {
      label: words.help,
      submenu: [
        { label: words.helpCommands, click: () => emit("help") },
        { label: words.about, click: () => host("about") },
      ],
    },
  ]
}
