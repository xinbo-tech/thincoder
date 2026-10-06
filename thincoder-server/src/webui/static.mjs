/**
 * static.mjs — 前端静态面直发（webui/WEBUI.md §1）：`public/` 直发 ∥ mime 表（`.mjs` ⇒ text/javascript） ∥
 * 防路径穿越 ∥ `Cache-Control: no-cache`（内部工具——改版即见）。
 *
 * 分派优先级归服务层（gateway/server.mjs）：注册路由（`/v1/*` ∥ `/api/*`）先命中；本档只收
 * 「路由未命中且方法为 GET/HEAD」的请求——命中 ⇒ 200 直发并返回 true；未命中 ∥ 路径非法 ⇒ false（调用方按 404 收口）。
 */
import { createReadStream, statSync } from "node:fs"
import { extname, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

/** 静态根缺省 = 本包 `public/`（本档住 `src/webui/` ⇒ `../../public/`）。 */
export const DEFAULT_PUBLIC_DIR = fileURLToPath(new URL("../../public/", import.meta.url))

/** 扩展名 → Content-Type（未列 ⇒ `application/octet-stream`）。 */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
}

export function contentTypeFor(file) {
  return MIME[extname(file).toLowerCase()] ?? "application/octet-stream"
}

/** 请求路径 → 静态档相对路径（`/` ⇒ `index.html`）；穿越段（`..` ∥ `.` ∥ 空段） ∥ 反斜杠 ∥ NUL ⇒ null。 */
export function resolveStaticPath(pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(String(pathname))
  } catch {
    return null // 非法百分号编码
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null
  const clean = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "")
  const segments = clean.split("/")
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) return null
  return segments.join(sep)
}

/** 静态面句柄：`serve(req, res, pathname)` 命中 ⇒ 200 直发（true）；未命中 ⇒ false（不写响应）。 */
export function createStaticSite({ root = DEFAULT_PUBLIC_DIR } = {}) {
  const rootDir = resolve(root)
  return {
    root: rootDir,
    serve(req, res, pathname) {
      const relative = resolveStaticPath(pathname)
      if (relative === null) return false
      const file = resolve(rootDir, relative)
      if (!file.startsWith(rootDir + sep)) return false // 防穿越双保险（resolveStaticPath 之外）
      let stat
      try {
        stat = statSync(file)
      } catch {
        return false // 不存在 ∥ 不可读 ⇒ 404（调用方）
      }
      if (!stat.isFile()) return false
      res.writeHead(200, {
        "Content-Type": contentTypeFor(file),
        "Content-Length": stat.size,
        "Cache-Control": "no-cache",
      })
      if (req.method === "HEAD") {
        res.end() // HEAD：头齐体免（Content-Length 已声明）
        return true
      }
      const stream = createReadStream(file)
      stream.on("error", () => res.destroy())
      stream.pipe(res)
      return true
    },
  }
}
