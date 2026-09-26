/**
 * protocol.mjs — `app://desktop/…` 供给（PROJECT.md §2 KD-2）：特权 scheme 注册（ready 前 · 仅一次）+ `protocol.handle`（ready 后）。
 * 防护判定序**写死**（批档 §2.11 收正⑧）：① 逃逸门（resolve 越界）⇒ 404 + `blocked++` ② 扩展名白名单门 ⇒ 404 + `blocked++`
 * ③ 存在性 ⇒ 404（不计数）。读数 `served` / `blocked` = `protocolStats` 单点持有；5 探针的发起点在窗口冒烟读回面（window.mjs）。
 */
import { protocol } from "electron"
import { readFile } from "node:fs/promises"
import { extname, isAbsolute, relative, resolve } from "node:path"

/** scheme / host / 供给根：本档单源（窗口加载 URL 与探针 URL 皆引此）。 */
export const SCHEME = "app"
export const HOST = "desktop"
export const RENDERER_ROOT = resolve(import.meta.dirname, "../../renderer")

/** 扩展名白名单 + MIME 表（同一表两用；探针读数的 mime 取媒体类型段）。 */
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
})

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
    const pathname = decodePath(request.url) ?? ""
    const target = resolve(RENDERER_ROOT, `.${pathname}`)
    const relativePath = relative(RENDERER_ROOT, target)
    if (relativePath.startsWith("..") || isAbsolute(relativePath)) return refuse(request, "escape") // 门①
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

/** 畸形百分号编码 ⇒ null（不抛——交由门② fail-closed）。 */
function decodePath(url) {
  try {
    return decodeURIComponent(new URL(url).pathname)
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
