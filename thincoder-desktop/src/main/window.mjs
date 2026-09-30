/**
 * window.mjs — 窗口装配（单窗 · 隔离三件套）+ 原生菜单 + 系统主题 + 冒烟读回（判据②③读数面）
 * + 窗口自身导航钩点（#389③：`will-navigate` ⇒ 外部 URL 拒——判据单源 `protocol.mjs` `isAppNavigation`）
 * + 会话维护动作宿主面（R1 · 桌面功能对位批：菜单「Maintenance」两项 + 确认 ∕ 结果两枚原生对话框——
 * 处理体（核数据面）住 `session-maintenance.mjs`，本档只做 electron 落子；**词面出档 `menu-words.mjs`**
 * ——#533：`menuLabels(locale)` 消费——zh = 语义直译值（#533 裁定）；en 表 = 回归面现值）
 * + 右键编辑菜单落子（复制面对齐批 · D27 ∕ KD-43：`webContents.on("context-menu")` ⇒ 按 `params` 构模板 ⇒
 * `Menu.popup`；条目集 ∕ 空选零菜单 ∕ 文案四键 = `context-menu.mjs` 两纯函数 + `loadConfig().locale` 现读）。
 * 主题 = 渲染面 `data-theme` 状态消费（D33 · 台账 #743——用户值覆写系统缺省，单写者 `renderer/theme.mjs`）；`resolveTheme()` 只作画布色 ∥ 原生面系统事实对照（批档 §2.6 D-8）。
 * 探针用 `net.fetch`（官方档 `net`：「differs from Node's fetch(), which uses Node.js's HTTP stack」+
 * 「requests made with net.fetch can be made to custom protocols」）——Node 全局 `fetch` 对自定义 scheme 无保证。
 */
import { resolve } from "node:path"
import { BrowserWindow, Menu, dialog, nativeTheme, net, shell } from "electron"
import { loadConfig } from "@thincoder/core/config.mjs"
import { HOST, SCHEME, isAppNavigation, protocolStats } from "./protocol.mjs"
// 右键编辑菜单（复制面对齐批 · D27 ∕ KD-43）：模板两纯函数出档 `context-menu.mjs` —— 本档只做宿主面落子。
import { contextMenuLabels, contextMenuTemplate } from "./context-menu.mjs"
// 会话维护线（R1 · 桌面功能对位批）：两枚处理体出档（本档只做宿主面 —— 确认 ∕ 结果两枚原生对话框）；
// 维护面词表出档 `menu-words.mjs`（#533 —— 词表单源；本档只做词面消费落子）。
import { gcSummaryText, indexSummaryText, runSessionGcMaintenance, runSessionIndexMaintenance } from "./session-maintenance.mjs"
import { menuLabels } from "./menu-words.mjs"

/** 预载绝对路径（隔离面唯一入口；`ipc.mjs` 亦引本常量读取白名单）。 */
export const PRELOAD_PATH = resolve(import.meta.dirname, "../preload/preload.cjs")

/** 窗口尺寸（实施选择——设计档未定形：五档与批档 §2.4 窗口面均未定尺寸，随修正轮落锚）：1200×800 · 下限 800×600。 */
const WINDOW = Object.freeze({ WIDTH: 1200, HEIGHT: 800, MIN_WIDTH: 800, MIN_HEIGHT: 600 })

/** 画布色镜像（非通道面）：与 `theme.css` 主题变量（`--bg` 两态）同值，防首帧白闪；单源在 `theme.css` ⇒ 改色须两处同步（待修正轮定形）。 */
const THEME_COLORS = Object.freeze({ dark: "#15171c", light: "#f7f8fa" })

/** 探针（批档 §2.11 收正⑧ 5 枚 + R1 双根 3 枚 + R9 门①正读数 1 枚）：正 3 + 负 6；各负探针命中的门见 stderr 归属行。 */
const PROBES = Object.freeze([
  { id: "html", path: "index.html", expect: 200, mime: "text/html" },
  // R9 改锚：单源 `styles.css` 随会话模型轮 R13 四拆退场 ⇒ 正探针落现盘主题档（`.css` MIME 路径读数不变）
  { id: "css", path: "theme.css", expect: 200, mime: "text/css" },
  { id: "rcMd", path: "rc/md.mjs", expect: 200, mime: "text/javascript" }, // R1 双根：`/rc/` 实供给（核包 md.mjs）
  { id: "escape", path: "../package.json", expect: 404 },
  { id: "escapePct", path: "%2e%2e/package.json", expect: 404 },
  { id: "ext", path: "probe.json", expect: 404 },
  // R1 双根：逃逸负探针（`%2F` 解码 ⇒ `..` 真逃出 `/rc/` 根；判据 = 404 + `blocked++`，门①归属见 stderr）。判别力注（两态）：
  // dev-link 态（smoke 态）落点 = 源树 `thincoder-core/i18n.mjs` 在盘 ⇒ 破门即 200；物化态落点退化为缺失 ⇒ 该态由 `blocked` 计数双证兜底。
  { id: "rcEscape", path: "rc/..%2Fthincoder-core%2Fi18n.mjs", expect: 404 },
  // R1 双根：逃逸门“两向”补齐——渲染面根同理（逃向主进程源码；门①的运行期覆盖）
  { id: "escapeSrc", path: "..%2Fsrc%2Fmain%2Fprotocol.mjs", expect: 404 },
  // R9 · #389①：门①**正读数**探针（「白名单扩展名 + 逃逸路径」形态——设计记 `../styles.css` 形态，按届盘重勘：
  // 落点 = 现盘渲染面样式档）。`%2F` 编码逃出 `/rc/` 根；`.css` ⇒ 门②不拦 ⇒ 归属行 = 门①（stderr 读数差分）；
  // 两门（门① ∕ ①′）皆破 ⇒ 直落 200 `text/css`（判别力在盘）。
  { id: "escapeCss", path: "rc/..%2Fthincoder-desktop%2Frenderer%2Fcore.css", expect: 404 },
])

/** 负探针枚数（**派生自探针表**——#471⑥：`main.mjs` 的 `blocked` 阈值不再手抄）；`blocked` 计数与逐探针读数双证。 */
export const NEGATIVE_PROBE_COUNT = PROBES.filter((probe) => probe.expect === 404).length

/** 引导位读回表达式（主进程侧读法 = `executeJavaScript`；值域 `ok | error | none`）。 */
const BOOT_READBACK = "document.documentElement.dataset.boot ?? \"none\""
const BOOT_WAIT_MS = 5000
const BOOT_POLL_MS = 50

/** 系统主题（系统事实唯一持有者 = `nativeTheme`；渲染面主题三态自持其面（D33——用户值覆写系统缺省），本函数只供画布色 ∥ 原生面系统事实——零通道）。 */
export function resolveTheme() {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light"
}

/** 原生菜单：只挂主进程动作面（窗口 / 缩放 / 退出 / 开发者工具 + Chromium 原生编辑 role + 维护两项）
 *  ——零 IPC 依赖项；维护两项出口 = 本档 `runMaintenance`（与 `session:gc` ∕ `session:index` 两通道同处理体）。
 *  维护面词面 = `menu-words.mjs` `menuLabels`（#533 —— 词表单源；`locale` 现读取 `loadConfig()`；读失败
 *  ⇒ 回落 en + 记错（零静默 —— 沿右键菜单 locale 现读同形））。 */
function buildMenu() {
  const group = (label, roles) => ({
    label,
    submenu: roles.map((role) => (typeof role === "string" ? { role } : role)),
  })
  let words
  try {
    words = menuLabels(loadConfig()?.locale)
  } catch (error) {
    console.error("[window] menu locale readback failed:", error)
    words = menuLabels("en")
  }
  return Menu.buildFromTemplate([
    group("File", ["close", { type: "separator" }, "quit"]),
    group("Edit", ["undo", "redo", { type: "separator" }, "cut", "copy", "paste", "selectAll"]),
    group("View", ["reload", "forceReload", "toggleDevTools", { type: "separator" }, "resetZoom", "zoomIn", "zoomOut", { type: "separator" }, "toggleFullscreen"]),
    group("Window", ["minimize", "zoom"]),
    group(words.maintenance, [
      { label: words.cleanUp, click: () => void runMaintenance("gc") },
      { label: words.rebuildIndex, click: () => void runMaintenance("index") },
    ]),
  ])
}

/** 回收确认（**原生模态** —— 菜单与 `session:gc` 通道同源）：默认 ∕ 取消键 = 「Cancel」⇒ 驳回 ∕ Esc ⇒
 *  `false`（**零删除** —— 核删除面一步不进；先例 VSC `showWarningMessage(..., { modal: true }, "Delete")`）。 */
export async function confirmRecycle({ count } = {}) {
  const { response } = await dialog.showMessageBox({
    type: "warning", buttons: ["Recycle", "Cancel"], defaultId: 1, cancelId: 1,
    message: `ThinCoder: recycle session data for ${count} cold project(s)?`,
    detail: "The files are moved to the sessions-trash recycle bin (recoverable for 7 days).",
  })
  return response === 0
}

/** 菜单维护出口（R1 · 会话维护线）：处理体（核数据面）住 `session-maintenance.mjs`（零 electron）——
 *  本档只做宿主面两枚对话框（确认 + 结果）；结果句单源 = 同档两枚 formatter。
 *  **结果面三径同 VSC 先例**（`session-gc-command.mjs:36-46/:66-68`）：无候选 ⇒ 一句「nothing to clean」；
 *  真回收 ⇒ 汇总句；**用户驳回 ⇒ 零弹框**（沿先例驳回径静默返回同形——回执面（`session:gc` 通道）不受影响）。
 *  异常 ⇒ stderr 一行（不吞、不假成功 —— 菜单回调无 invoke 拒绝面兜底）。 */
async function runMaintenance(action) {
  try {
    const summary = action === "gc"
      ? await runSessionGcMaintenance({ confirm: confirmRecycle })
      : await runSessionIndexMaintenance()
    if (action === "gc" && summary.confirmed === false && summary.candidates > 0) return // 驳回径：静默（VSC 同形）
    await dialog.showMessageBox({
      type: summary.ok === false ? "error" : "info", buttons: ["OK"],
      message: action === "gc" ? gcSummaryText(summary) : indexSummaryText(summary),
    })
  } catch (error) {
    console.error(`[window] session maintenance (${action}) failed:`, error)
  }
}

/** 单窗装配：隔离三件套 + 预载绝对路径；加载 `app://` 首页（供给与防护 = protocol.mjs）。 */
export function createWindow(onError) {
  const win = new BrowserWindow({
    width: WINDOW.WIDTH, height: WINDOW.HEIGHT, minWidth: WINDOW.MIN_WIDTH, minHeight: WINDOW.MIN_HEIGHT,
    backgroundColor: THEME_COLORS[resolveTheme()],
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: PRELOAD_PATH },
  })
  // D31 窗口重启最大化（#745·台账）：隐建（show:false）⇒ 先 maximize 后 show——maximize 官方语义「顺带 show 不聚焦」
  // ⇒ 首帧即最大化态（防默认尺寸可见闪帧）；show 补聚焦。「永远」语义 = 每次启动恒最大化：零窗口态读写（无记忆）。
  win.maximize()
  win.show()
  win.setMenu(buildMenu())
  /** 右键编辑菜单（复制面对齐批 · D27 ∕ KD-43）：Electron 无默认右键菜单 ⇒ 本档按 `context-menu` 事件落子；
   *  条目集（可编辑四件 ∕ 选中两件 ∕ 空选零菜单）与文案四键 = `context-menu.mjs` 两纯函数；`locale` 右键时刻
   *  现读（语言切换即时随动）；读失败 ⇒ 回落 en + 记错（零静默）；空模板 ⇒ 不 popup（非编辑空选 = 零菜单）。 */
  win.webContents.on("context-menu", (_event, params) => {
    let labels
    try {
      labels = contextMenuLabels(loadConfig()?.locale)
    } catch (error) {
      console.error("[window] context menu locale readback failed:", error)
      labels = contextMenuLabels("en")
    }
    const template = contextMenuTemplate(params, labels)
    if (template.length === 0) return
    Menu.buildFromTemplate(template).popup({ window: win })
  })
  /** 加固（设计档未定形）：窗口内不开新窗，外链交系统浏览器；**窗口自身导航**（#389③）只许应用源 ——
   *  外部 URL ⇒ 拒（判据单源 = `protocol.mjs` `isAppNavigation`；refused 记 stderr——零静默）。 */
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
  win.webContents.on("will-navigate", (event, url) => {
    if (isAppNavigation(url)) return
    event.preventDefault()
    console.error(`[window] navigation refused: ${url}`)
  })
  win.loadURL(`${SCHEME}://${HOST}/index.html`)
  return win
}

/** 冒烟读回：等首载（`loaded`）→ 探针表逐项 → 引导位读回；返回 `{ loaded, protocol, boot }`。 */
export async function runSmoke(win, onError) {
  const loaded = await firstLoad(win, onError)
  const probes = []
  for (const probe of PROBES) probes.push(await runProbe(probe, onError))
  const protocol = { served: protocolStats.served, blocked: protocolStats.blocked, probes }
  return { loaded, protocol, boot: await readBoot(win, onError) }
}

/** 首载结束判定（`did-finish-load` ∨ `did-fail-load`）；失败记错不抛——总超时由 main.mjs 兜底。 */
function firstLoad(win, onError) {
  return new Promise((done) => {
    win.webContents.once("did-finish-load", () => done(true))
    win.webContents.once("did-fail-load", (_event, code, description) => {
      onError(`window load failed: ${code} ${description}`)
      done(false)
    })
  })
}

/** 单探针读数（`net.fetch` 直取 `app://`）：正探针 `{ id, status, mime }` / 负探针 `{ id, status }`（契约 `:325` —— 负探针无 `mime` 键）；取不到 ⇒ status 0 + 记错。 */
async function runProbe(probe, onError) {
  try {
    const response = await net.fetch(`${SCHEME}://${HOST}/${probe.path}`)
    const got = { id: probe.id, status: response.status }
    if (probe.mime !== undefined) {
      const contentType = response.headers.get("content-type")
      if (contentType) got.mime = contentType.split(";")[0].trim()
    }
    return got
  } catch (error) {
    onError(`probe ${probe.id} failed: ${error?.message ?? error}`)
    return { id: probe.id, status: 0 }
  }
}

/** 探针期望表判定（`ok` 条件之一；与 `blocked >= NEGATIVE_PROBE_COUNT` 双证——负探针真命中门才算数）。 */
export function probesSatisfied(probes) {
  if (!Array.isArray(probes) || probes.length !== PROBES.length) return false
  return PROBES.every((probe, index) => {
    const got = probes[index]
    return got?.id === probe.id && got.status === probe.expect && (probe.mime === undefined || got.mime === probe.mime)
  })
}

/** 引导位读回：轮询至置位或 `BOOT_WAIT_MS`（装配是异步往返，`did-finish-load` 时未必已置位）。 */
async function readBoot(win, onError) {
  const deadline = Date.now() + BOOT_WAIT_MS
  while (Date.now() < deadline) {
    try {
      const value = await win.webContents.executeJavaScript(BOOT_READBACK)
      if (value === "ok" || value === "error") return value
    } catch (error) {
      onError(`boot readback failed: ${error?.message ?? error}`)
      return "none"
    }
    await new Promise((done) => setTimeout(done, BOOT_POLL_MS))
  }
  return "none"
}
