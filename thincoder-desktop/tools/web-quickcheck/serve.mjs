/**
 * serve.mjs — web 快筛静态服务（设计单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §3.1）：
 * 三根映射（`/__quickcheck/` 工具资产 ∥ `/rc/` 核包根 ∥ `/` renderer/）——供给语义镜像
 * `thincoder-desktop/src/main/protocol.mjs`（双根 `:34-37` ∥ MIME 表 `:24-31` ∥ 逃逸 ∥ 点段门 `:53-61`），
 * 但**不同源**（本机开发工具——`127.0.0.1` 唯一入口；安全门语义本职在 Electron 侧）；
 * 登记外特例（父侧裁 2026-10-01 · 裁=A）：真浏览器自动取 `/favicon.ico`（页面零参与）⇒ 回 204（无图标）
 * ——收口 `console.error = 0` 判据**保持不弱化**；供给语义其余面仍纯镜像 `protocol.mjs`（差异登记 = 批档 §5）。
 * `/` 与 `/index.html` 响应注入 host shim 行（锚缺 ⇒ 500 fail-loud——不静默出未注入页）。
 * 用法：直跑（`node tools/web-quickcheck/serve.mjs` ⇒ 端口 0 + 打印实 URL 待命——手动浏览面）
 * ∥ 被 `run.mjs` 与批内件导入（`startServer()` ⇒ `{ url, close }`）；夹具缝 = `rendererRoot` 注入（WQ-3 锚缺腿）。
 */
import { realpathSync } from "node:fs"
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

/** 工具资产根（本档目录）∥ renderer 根；核包根 = `createRequire` 解析（沿 `protocol.mjs:21` 同法——缺包 ⇒ 装载期 fail-loud）。 */
export const TOOLS_ROOT = import.meta.dirname
export const RENDERER_ROOT = resolve(import.meta.dirname, "../../renderer")
export const CORE_ROOT = dirname(createRequire(import.meta.url).resolve("@thincoder/render-core/package.json"))

/** 扩展名白名单 + MIME 表（同 `protocol.mjs:24-31`；表外 ⇒ 404）。 */
const MIME = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
})

/** 注入锚 = `renderer/index.html` 脚本行 + shim 脚本行（模块脚本按文档序执行 ⇒ shim 先于 `app.mjs` 求值）。 */
const ANCHOR = '<script type="module" src="./app.mjs"></script>'
const SHIM_LINE = '<script type="module" src="/__quickcheck/host-shim.mjs"></script>'

/** 起服务（`127.0.0.1` · 端口 0 = 系统分配）⇒ `{ url, close }`（close = 断连 + 关服——不吊 keep-alive 连接）。 */
export async function startServer({ port = 0, rendererRoot = RENDERER_ROOT } = {}) {
  const site = {
    rendererRoot,
    roots: Object.freeze([
      { prefix: "/__quickcheck/", root: TOOLS_ROOT },
      { prefix: "/rc/", root: CORE_ROOT },
      { prefix: "/", root: rendererRoot },
    ]),
  }
  const server = createServer((request, response) => {
    handle(request, response, site).catch((error) => { // 意外错 ⇒ 500 + stderr 记因（不落 unhandled rejection——进程不崩）
      console.error("[quickcheck] request handler error:", error)
      if (!response.headersSent) response.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
      response.end("internal error")
    })
  })
  await new Promise((ok, fail) => {
    server.once("error", fail)
    server.listen(port, "127.0.0.1", ok)
  })
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((ok, fail) => {
      server.closeAllConnections?.()
      server.close((error) => (error ? fail(error) : ok()))
    }),
  }
}

/** 请求处理（判定序沿 `protocol.mjs:50-69`：逃逸门 ⇒ 点段门 ⇒ 扩展名门 ⇒ 存在性；fail-closed ⇒ 404）。 */
async function handle(request, response, site) {
  const pathname = decodePath(request) ?? ""
  if (pathname === "/favicon.ico") { // 浏览器面产物特例（父侧裁 · 见档头）：无图标 ⇒ 204
    response.writeHead(204, { "cache-control": "no-store" })
    response.end()
    return
  }
  const { root, subPath } = routeRoot(pathname, site.roots)
  const target = resolve(root, `.${subPath}`)
  if (isEscape(relative(root, target)) || hasDotSegment(pathname)) return notFound(response)
  const mime = MIME[extname(target).toLowerCase()]
  if (mime === undefined) return notFound(response)
  let body
  try {
    body = await readFile(target)
  } catch {
    return notFound(response) // 门③：缺失 ⇒ 404（沿 `protocol.mjs:63-68`）
  }
  if (target === resolve(site.rendererRoot, "index.html")) return inject(response, body)
  response.writeHead(200, { "content-type": mime, "cache-control": "no-store" })
  response.end(body)
}

/** 根路由（前缀序）：`/` 入口 ⇒ renderer `index.html`（目录不供——入口单源）；其余按前缀去头（保前导 `/`）。 */
function routeRoot(pathname, roots) {
  if (pathname === "/") return { root: roots[roots.length - 1].root, subPath: "/index.html" }
  const hit = roots.find(({ prefix }) => pathname.startsWith(prefix))
  const { prefix, root } = hit ?? roots[roots.length - 1]
  return { root, subPath: pathname.slice(prefix.length - 1) }
}

/** 请求 pathname（畸形百分号编码 ⇒ null——落扩展名门 fail-closed，沿 `protocol.mjs:109-116`）。 */
function decodePath(request) {
  try {
    return decodeURIComponent(new URL(request.url ?? "", "http://127.0.0.1").pathname)
  } catch {
    return null
  }
}

/** 逃逸判定（**段界**——非裸前缀）：`..` 整段 ∥ `..${sep}` 开头 ⇒ 出根（沿 `protocol.mjs:92-95`）。 */
function isEscape(relativePath) {
  return isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)
}

/** URL 形收紧：pathname 任一段为 `.` / `..` ⇒ 拒（沿 `protocol.mjs:97-100`）。 */
function hasDotSegment(pathname) {
  return pathname.split("/").some((segment) => segment === "." || segment === "..")
}

/** 门拒绝：404（fail-closed——不泄漏存在性差异）。 */
function notFound(response) {
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
  response.end("not found")
}

/** HTML 注入（锚缺 ⇒ 500 + stderr 明示——fail-loud）：shim 行插于原脚本行之前。 */
function inject(response, body) {
  const html = body.toString("utf8")
  if (!html.includes(ANCHOR)) {
    console.error("[quickcheck] injection anchor missing in index.html — refusing to serve un-injected page")
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
    response.end("injection anchor missing")
    return
  }
  response.writeHead(200, { "content-type": MIME[".html"], "cache-control": "no-store" })
  response.end(html.replace(ANCHOR, `${SHIM_LINE}\n    ${ANCHOR}`))
}

/** 直跑入口（被导入不触发）：打印实 URL 待命（手动浏览——Ctrl+C 退出）；两侧按**真实路径**比较（符号链接 ∥ 大小写差异不误判）。 */
const isDirectRun = process.argv[1] !== undefined
  && realpathSync.native(resolve(process.argv[1])) === realpathSync.native(fileURLToPath(import.meta.url))
if (isDirectRun) {
  const server = await startServer()
  console.log(`[quickcheck] serving ${server.url}/ (ready — Ctrl+C to stop)`)
}
