/**
 * protocol.mjs — `app://desktop/…` 供给（PROJECT.md §2 KD-2）：特权 scheme 注册（ready 前 · 仅一次）+ `protocol.handle`（ready 后）。
 * 防护判定序**写死**：⓪ host 校验（仅本 scheme 的 `HOST` 面——#471⑤）⇒ 404 + `blocked++`；① 逃逸门（resolve 越界 ·
 * 判据 = **段界**——#471④）⇒ 404 + `blocked++`；①′ URL 形收紧（pathname 含 `.` / `..` 段 ⇒ 拒——#471③）⇒ 404 + `blocked++`；
 * ② 扩展名白名单门 ⇒ 404 + `blocked++`；③ 存在性 ⇒ 404（不计数）。读数 `served` / `blocked` = `protocolStats` 单点持有；探针的发起点在窗口冒烟读回面（window.mjs）。
 * 另：**导航门**（#389③ —— 非供给判定序）：窗口自身导航只许本应用源 —— `isAppNavigation` 判据单源（宿主钩点 = window.mjs `will-navigate`）。
 * 供给面**双根**（RENDER-CORE.md §1.3「桌面端加载形」· R1）：`/` → `renderer/`（现状）· `/rc/` → 核包目录
 * （`@thincoder/render-core` 包根——主进程按包名解析；渲染面以同源绝对路径 import `/rc/xxx.mjs`）。
 * 各根各留逃逸门——供给语义（判定序 / 计数）与单根时代不变。
 */
import { protocol } from "electron"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path"

/** scheme / host / 供给根：本档单源（窗口加载 URL 与探针 URL 皆引此）。 */
export const SCHEME = "app"
export const HOST = "desktop"
export const RENDERER_ROOT = resolve(import.meta.dirname, "../../renderer")
/** 第二根 · 核包根：按包名解析（`node_modules` 链接 / 实拷两态同址——打包物化 = `npm install --install-links`）；缺包 ⇒ 装载期 fail-loud。 */
export const CORE_ROOT = dirname(createRequire(import.meta.url).resolve("@thincoder/render-core/package.json"))

/** 扩展名白名单 + MIME 表（同一表两用；探针读数的 mime 取媒体类型段）。 */
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
})

/** 供给根表（显式登记 · 前缀序：`/rc/` 先于 `/` 兜底根；各根同走区间判据逃逸门）。 */
const ROOTS = Object.freeze([
  { prefix: "/rc/", root: CORE_ROOT },
  { prefix: "/", root: RENDERER_ROOT },
])

/** 供给读数（单点持有）：`served` = 真供给次数；`blocked` = 门拒绝次数。 */
export const protocolStats = { served: 0, blocked: 0 }

/** ready 前 · 仅一次（`registerSchemesAsPrivileged` 只能调一次）：standard + secure + supportFetchAPI ⇒ 渲染面获真 origin。 */
export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ])
}

/** ready 后：注册供给 handler（判定序见档头；畸形 pathname 落门②——fail-closed）。 */
export function serveAppProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const parsed = parseRequestUrl(request.url) // 畸形 ⇒ null（沿既有口径：交门② fail-closed）
    if (parsed !== null && parsed.host !== HOST) return refuse(request, "host") // 门⓪（#471⑤）
    const pathname = parsed === null ? "" : (decodePath(parsed) ?? "")
    const { root, subPath } = routeRoot(pathname)
    const target = resolve(root, `.${subPath}`)
    const relativePath = relative(root, target)
    if (isEscape(relativePath)) return refuse(request, "escape") // 门①（段界判据——#471④）
    if (hasDotSegment(pathname)) return refuse(request, "dot-segment") // 门①′（URL 形收紧——#471③）
    const mime = MIME[extname(target).toLowerCase()]
    if (mime === undefined) return refuse(request, "extension") // 门②
    try {
      const body = await readFile(target) // 门③：缺失 ⇒ 404，不计数
      protocolStats.served += 1
      return new Response(body, { headers: { "content-type": mime } })
    } catch {
      return new Response("not found", { status: 404 })
    }
  })
}

/** 导航门（#389③）：窗口自身导航只许本应用源（`SCHEME` ∕ `HOST` 两面同判 —— 标准 scheme ⇒ 真 origin 面）；
 *  外部 URL ∕ 畸形 URL 一律拒（fail-closed —— 窗口不离 `app://` 源）。宿主钩点 = window.mjs `will-navigate`。 */
export function isAppNavigation(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return url.protocol === `${SCHEME}:` && url.host.toLowerCase() === HOST
  } catch {
    return false
  }
}

/** 请求 URL 解析（畸形 ⇒ null——交门② fail-closed，沿既有口径）；host / pathname 两读共用本单点。 */
function parseRequestUrl(raw) {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

/** 逃逸判定（**段界**——非裸前缀）：`..` 整段 ∥ `..${sep}` 开头 ⇒ 出根；`..foo` 类同名档不误拒（#471④）。 */
function isEscape(relativePath) {
  return isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)
}

/** URL 形收紧（#471③）：pathname 任一段为 `.` / `..` ⇒ 拒——防归一化旁路（假阴面收紧）。 */
function hasDotSegment(pathname) {
  return pathname.split("/").some((segment) => segment === "." || segment === "..")
}

/** 根路由（双根单源）：前缀命中 ⇒ 该根 + 去前缀子路径（保前导 `/`）；未命中（畸形 pathname）⇒ 兜底根 `/` 原路径。 */
function routeRoot(pathname) {
  const hit = ROOTS.find(({ prefix }) => pathname.startsWith(prefix))
  const { prefix, root } = hit ?? ROOTS[ROOTS.length - 1]
  return { root, subPath: pathname.slice(prefix.length - 1) }
}

/** 畸形百分号编码 ⇒ null（不抛——交由门② fail-closed）。 */
function decodePath(url) {
  try {
    return decodeURIComponent(url.pathname)
  } catch {
    return null
  }
}

/** 门拒绝：404 + `blocked++` + stderr 记归属门（使负探针读数可归属）。 */
function refuse(request, gate) {
  protocolStats.blocked += 1
  console.error(`[protocol] ${gate} refused: ${request.url}`)
  return new Response("not found", { status: 404 })
}
