/**
 * window.mjs — 窗口装配（单窗 · 隔离三件套）+ 原生菜单 + 系统主题 + 冒烟读回（判据②③读数面）。
 * 主题 = CSS `prefers-color-scheme` 消费（本批零主题通道）；`resolveTheme()` 只作同事实对照（批档 §2.6 D-8）。
 * 探针用 `net.fetch`（官方档 `net`：「differs from Node's fetch(), which uses Node.js's HTTP stack」+
 * 「requests made with net.fetch can be made to custom protocols」）——Node 全局 `fetch` 对自定义 scheme 无保证。
 */
import { resolve } from "node:path"
import { BrowserWindow, Menu, nativeTheme, net, shell } from "electron"
import { HOST, SCHEME, protocolStats } from "./protocol.mjs"

/** 预载绝对路径（隔离面唯一入口；`ipc.mjs` 亦引本常量读取白名单）。 */
export const PRELOAD_PATH = resolve(import.meta.dirname, "../preload/preload.cjs")

/** 窗口尺寸（实施选择——设计档未定形：五档与批档 §2.4 窗口面均未定尺寸，随修正轮落锚）：1200×800 · 下限 800×600。 */
const WINDOW = Object.freeze({ WIDTH: 1200, HEIGHT: 800, MIN_WIDTH: 800, MIN_HEIGHT: 600 })

/** 画布色镜像（非通道面）：与 `styles.css` 主题变量同值，防首帧白闪；单源在 `styles.css` ⇒ 改色须两处同步（待修正轮定形）。 */
const THEME_COLORS = Object.freeze({ dark: "#15171c", light: "#f7f8fa" })

/** 探针（批档 §2.11 收正⑧ 5 枚 + R1 双根 3 枚）：正 3 + 负 5；各负探针命中的门见 stderr 归属行。 */
const PROBES = Object.freeze([
  { id: "html", path: "index.html", expect: 200, mime: "text/html" },
  { id: "css", path: "styles.css", expect: 200, mime: "text/css" },
  { id: "rcMd", path: "rc/md.mjs", expect: 200, mime: "text/javascript" }, // R1 双根：`/rc/` 实供给（核包 md.mjs）
  { id: "escape", path: "../package.json", expect: 404 },
  { id: "escapePct", path: "%2e%2e/package.json", expect: 404 },
  { id: "ext", path: "probe.json", expect: 404 },
  // R1 双根：逃逸负探针（`%2F` 解码 ⇒ `..` 真逃出 `/rc/` 根；判据 = 404 + `blocked++`，门①归属见 stderr）。判别力注（两态）：
  // dev-link 态（smoke 态）落点 = 源树 `thincoder-core/i18n.mjs` 在盘 ⇒ 破门即 200；物化态落点退化为缺失 ⇒ 该态由 `blocked` 计数双证兜底。
  { id: "rcEscape", path: "rc/..%2Fthincoder-core%2Fi18n.mjs", expect: 404 },
  // R1 双根：逃逸门“两向”补齐——渲染面根同理（逃向主进程源码；门①的运行期覆盖）
  { id: "escapeSrc", path: "..%2Fsrc%2Fmain%2Fprotocol.mjs", expect: 404 },
])

/** 引导位读回表达式（主进程侧读法 = `executeJavaScript`；值域 `ok | error | none`）。 */
const BOOT_READBACK = "document.documentElement.dataset.boot ?? \"none\""
const BOOT_WAIT_MS = 5000
const BOOT_POLL_MS = 50

/** 系统主题（系统事实唯一持有者 = `nativeTheme`；渲染面经 CSS 直接得，零通道）。 */
export function resolveTheme() {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light"
}

/** 原生菜单：只挂主进程动作面（窗口 / 缩放 / 退出 / 开发者工具 + Chromium 原生编辑 role）——零 IPC 项。 */
function buildMenu() {
  const group = (label, roles) => ({
    label,
    submenu: roles.map((role) => (typeof role === "string" ? { role } : role)),
  })
  return Menu.buildFromTemplate([
    group("File", ["close", { type: "separator" }, "quit"]),
    group("Edit", ["undo", "redo", { type: "separator" }, "cut", "copy", "paste", "selectAll"]),
    group("View", ["reload", "forceReload", "toggleDevTools", { type: "separator" }, "resetZoom", "zoomIn", "zoomOut", { type: "separator" }, "toggleFullscreen"]),
    group("Window", ["minimize", "zoom"]),
  ])
}

/** 单窗装配：隔离三件套 + 预载绝对路径；加载 `app://` 首页（供给与防护 = protocol.mjs）。 */
export function createWindow(onError) {
  const win = new BrowserWindow({
    width: WINDOW.WIDTH, height: WINDOW.HEIGHT, minWidth: WINDOW.MIN_WIDTH, minHeight: WINDOW.MIN_HEIGHT,
    backgroundColor: THEME_COLORS[resolveTheme()],
    show: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: PRELOAD_PATH },
  })
  win.setMenu(buildMenu())
  /** 加固（设计档未定形）：窗口内不开新窗，外链交系统浏览器。 */
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
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

/** 探针期望表判定（`ok` 条件之一；与 `blocked >= 3` 双证——负探针真命中门才算数）。 */
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
