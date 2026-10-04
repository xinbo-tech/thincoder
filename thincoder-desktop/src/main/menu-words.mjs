/**
 * menu-words.mjs — 应用菜单**与更新面词表单源**（#533 立档 ∥ 菜单体系批扩至全菜单 —— D36 · 台账 #811；决策单源 =
 * `docs/desktop/design/PROJECT.md` §2 **KD-65 ③** ∥ 设置菜单升级批 · #817 **KD-67 ③** ∥ 桌面发布·阶段二批 **KD-71**
 * 〔`docs/desktop/design/PACKAGING.md` §1 ∥ §2.8.1——更新面十一键〕）：组名五（文件 ∥ 编辑 ∥ 视图 ∥
 * **设置** ∥ 帮助）+ 条目 + role 标签 + 主题三值 + 最近/关于/占位词 + 设置组三键（`settings` ∥ `settingsOpen` ∥
 * `aboutShortcuts`）+ 更新面十一键（菜单四 = `checkUpdate` ∥ `checkingUpdate` ∥ `downloadingUpdate` ∥ `restartUpdate`；
 * 对话框/通知七 = `updateDialogTitle` ∥ `updateNotice` ∥ `updateUpToDate` ∥ `updateFailed` ∥ `updateRestartConfirm` ∥
 * `updateRestartOk` ∥ `updateRestartCancel`）—— 应用菜单与更新面词值只住本档（逐键 zh/en 双值；en 回落）。
 *   与右键编辑菜单词表（`src/main/context-menu.mjs` —— 经渲染面宿主表 `menu.edit.*` 键取值）**分档**：菜单面不同
 *   （应用菜单 ∕ 右键菜单）· 值源形不同（主进程自持常量对 ∕ 宿主表词键投影）—— 两词表两事不混，**键面零重叠**
 *   （`menu.edit.*` 四值经 `contextMenuLabels(locale)` 读取复用 —— 编辑四值零第二份，键不入本表）。
 *   **设置组（#817）**：顶级组名 = 新键 `settings`（「设置」/「Settings」——原「维护」改名）；`maintenance` 键
 *   **保留**（值「维护」/「Maintenance」不变 —— 现役 = 设置组内子组标签）；六组段名经 `settingsSectionLabels(locale)`
 *   读器投影（值单源 = 渲染面 `HOST_DICT` `settings.section.*` —— 零第二份；枚举 = 菜单六组名——收窄批 #820）。
 *   **更新面（KD-71 · 桌面发布·阶段二批）**：菜单四项注入 `app-menu.mjs`（状态机 label）；对话框/通知七项注入
 *   `update.mjs`（消费 = 装配面 `main.mjs` 以 `words()` 现读注入）——`updateNotice` ∥ `updateUpToDate` ∥
 *   `updateRestartConfirm` 三句携 `{version}` 占位（消费面替换；括注形 = 各语言自持）。
 *   `menuLabels(locale)` = 纯函数（零 `electron` ∕ 零 `node:` ⇒ 平 node 直测）：语言经核归一（`zh-CN` ⇒ `zh`；
 *   缺 ∕ 空 ∕ 未知 ⇒ en —— 沿 `context-menu.mjs` 同款归一）；返回键集 = 全菜单与更新面键集（43 键，见 WORDS）。
 *   **zh 词值**（#533 裁定形：按 en 项语义直译；组名随译 = 是）；en 现值 = 回归面字面（组名 ∥ role 默认文案 ∥
 *   条目旧字面逐字；role 默认文案 = Electron 英文硬编码，直采即 en-only 债 ⇒ 显式覆写，单源 = D27 批实读）。
 *   窗口组（minimize/zoom）随 D36 退场，零键。
 */
import { normalizeLocale } from "@thincoder/core/i18n.mjs"
// 词面单源：渲染面宿主表（主进程直取 —— 零第二词表，先例 = `src/main/context-menu.mjs`）。
import { FALLBACK_LOCALE, HOST_DICT } from "../../renderer/i18n.mjs"

/** 全菜单词（en 现值 = 回归面字面；zh = 语义直译值（#533 裁定形））。 */
const WORDS = Object.freeze({
  en: Object.freeze({
    file: "File",
    edit: "Edit",
    view: "View",
    settings: "Settings",
    maintenance: "Maintenance",
    help: "Help",
    newSession: "New Session",
    openProject: "Open Working Directory…",
    recent: "Recent Working Directories",
    recentEmpty: "No Recent Working Directories",
    close: "Close Window",
    quit: "Quit ThinCoder",
    undo: "Undo",
    redo: "Redo",
    find: "Find…",
    reload: "Reload",
    forceReload: "Force Reload",
    toggleDevTools: "Toggle Developer Tools",
    resetZoom: "Actual Size",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    toggleFullscreen: "Toggle Full Screen",
    theme: "Theme",
    themeSystem: "Follow System",
    themeLight: "Light",
    themeDark: "Dark",
    settingsOpen: "Settings…",
    cleanUp: "Clean up session data…",
    rebuildIndex: "Rebuild session index",
    aboutShortcuts: "About & Shortcuts",
    helpCommands: "Commands & Shortcuts…",
    about: "About ThinCoder…",
    // 更新面（KD-71 · 桌面发布·阶段二批）：菜单四 + 对话框/通知七；`{version}` 占位 = 消费面替换
    checkUpdate: "Check for Updates…",
    checkingUpdate: "Checking for updates…",
    downloadingUpdate: "Downloading update…",
    restartUpdate: "Restart to install update",
    updateDialogTitle: "ThinCoder Update",
    updateNotice: "Update ready — restart to install automatically (v{version})",
    updateUpToDate: "You're up to date (v{version})",
    updateFailed: "Update check failed",
    updateRestartConfirm: "Restart and install the update (v{version})? In-progress tasks will be interrupted.",
    updateRestartOk: "Restart & Install",
    updateRestartCancel: "Cancel",
  }),
  zh: Object.freeze({
    file: "文件",
    edit: "编辑",
    view: "视图",
    settings: "设置",
    maintenance: "维护",
    help: "帮助",
    newSession: "新建会话",
    openProject: "打开工作目录…",
    recent: "最近工作目录",
    recentEmpty: "无最近工作目录",
    close: "关闭窗口",
    quit: "退出 ThinCoder",
    undo: "撤销",
    redo: "重做",
    find: "查找…",
    reload: "重新加载",
    forceReload: "强制重新加载",
    toggleDevTools: "切换开发者工具",
    resetZoom: "实际大小",
    zoomIn: "放大",
    zoomOut: "缩小",
    toggleFullscreen: "切换全屏",
    theme: "主题",
    themeSystem: "跟随系统",
    themeLight: "亮色",
    themeDark: "暗色",
    settingsOpen: "设置…",
    cleanUp: "清理会话数据…",
    rebuildIndex: "重建会话索引",
    aboutShortcuts: "关于与快捷键",
    helpCommands: "命令与快捷键…",
    about: "关于 ThinCoder…",
    // 更新面（KD-71 · 桌面发布·阶段二批）：菜单四 + 对话框/通知七；`{version}` 占位 = 消费面替换
    checkUpdate: "检查更新…",
    checkingUpdate: "正在检查更新…",
    downloadingUpdate: "正在下载更新…",
    restartUpdate: "重启以安装更新",
    updateDialogTitle: "ThinCoder 更新",
    updateNotice: "更新已就绪——重启后自动安装（v{version}）",
    updateUpToDate: "已是最新版本（v{version}）",
    updateFailed: "检查更新失败",
    updateRestartConfirm: "重启并安装更新（v{version}）？进行中的任务将被中断。",
    updateRestartOk: "重启安装",
    updateRestartCancel: "取消",
  }),
})

/** 设置六组名（序 = 渲染面 `views/settings.mjs` `SECTIONS` 名序**去「模型」**——收窄批 #820；投影面；跨面漂移检测 = 批内件源扫）。 */
const SETTINGS_SECTION_KEYS = Object.freeze(["providers", "agent", "mcp", "env", "tools", "models"])

/** 全菜单词读数（消费面 = `src/main/window.mjs` `buildMenu` ∥ 模板 `app-menu.mjs`）：解析序 = 当前语言 → en 回落
 *  （缺槽 ∕ 未来新语种）。 */
export function menuLabels(locale) {
  return WORDS[normalizeLocale(locale)] ?? WORDS.en
}

/** 设置六组段名读数（消费面 = `src/main/window.mjs` ⇒ 模板 `app-menu.mjs` `sections` 注入）：值单源 = 渲染面
 *  `HOST_DICT` `settings.section.*`（沿 `contextMenuLabels` 先例 —— 零第二份）；解析序 = 当前语言 → en 回落 →
 *  **键名自身**（缺键 ⇒ 键名终态 —— 不静默变空串，与渲染面 `t()` 同终态）；返回 = 组名 ⇒ 段名词。 */
export function settingsSectionLabels(locale) {
  const table = HOST_DICT[normalizeLocale(locale)] ?? HOST_DICT[FALLBACK_LOCALE] ?? {}
  const labels = {}
  for (const name of SETTINGS_SECTION_KEYS) {
    const key = `settings.section.${name}`
    const value = table[key] ?? HOST_DICT[FALLBACK_LOCALE]?.[key]
    labels[name] = typeof value === "string" ? value : key
  }
  return labels
}
