/**
 * file-links.mjs — 验存文件链接（「对齐第三批」相抵② · KD-39 —— `docs/desktop/design/PROJECT.md` §2）。
 *
 * 语义同源 = `thincoder-vscode/src/extension/file-links.mjs`（**多实现面各自落地** —— 端侧自有实现，非逐字拷贝）；
 * 判据 = **盘上存在闸**（`existsSync` ∧ 是文件）：路径 token 只在真实存在时才成链接 —— URL / 日志噪音 /
 * 版本号恒不成链接（存在检查 = 最后一道闸）。
 * 两出口：① `extractFileLinks(cwd, text)` = 工具结果文本 ⇒ `[{ raw, path, line }]`（宿主计算面 ——
 * `ev:tool-result` 载荷 `links`；单源 = `docs/desktop/design/IPC.md` §1 该行）；② `fileOpenTarget(payload)` =
 * `file:open` 载荷的纯判据（路径串合格性 —— `ipc.mjs` 出口消费）。
 * 纪律：零第三方依赖（`node:fs` / `node:path`）；渲染面零 fs（KD-10 端侧零自写盘）——本档只读盘面事实。
 */
import { existsSync, statSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"

/** 路径 token：可选 Windows 盘符 + 路径字符 + 点扩展名 + 可选 `:line` / `:line:col` 后缀；
 *  m[1] = 路径本体（供 fs）、m[2] = 行号；整匹配 m[0]（含行后缀原文）= 渲染面包裹面用的 `raw`。
 *  形同源 = VSC 同判据档（值源单处，行语义零改）。 */
const PATH_TOKEN_RE = /((?:[A-Za-z]:)?[~./\\\w][\w./\\~-]*\.\w{1,10})(?::(\d+)(?::\d+)?)?/g

/** 逐结果封顶（值同源 = VSC 同档 `MAX_LINKS`）。 */
export const MAX_LINKS = 50

/**
 * 工具结果文本 ⇒ 验存文件链接（去重 + 封顶）。
 * `cwd` = 项目根（相对 token 的解析基）；**缺 / 空 ⇒ 相对 token 一律不检**（不落 `process.cwd()`
 * 第二解析基 —— 零假链接）；绝对 token 与 cwd 无关，照检。
 * 返回 `[{ raw, path, line }]`——`line` 缺 ⇒ `null`（形同源 = VSC 同档；缺 ⇒ 零链接面见调用方）。
 * 零抛：fs 判据逐条 try/catch（不可达路径 = 不成链接，非错误）。
 */
export function extractFileLinks(cwd, text) {
  if (typeof text !== "string" || text === "") return []
  const base = typeof cwd === "string" && cwd !== "" ? cwd : null
  const links = []
  const seen = new Set()
  for (const m of text.matchAll(PATH_TOKEN_RE)) {
    const pathPart = m[1]
    // 协议相对 URL 残体（`//example.com/a.png`）—— 恒非工作区路径。
    if (pathPart.startsWith("//") || pathPart.startsWith("\\\\")) continue
    const absolute = isAbsolute(pathPart)
    if (!absolute && base === null) continue // 无项目根 ⇒ 相对 token 零判据（禁假链接）
    const line = m[2] ? Number(m[2]) : null
    const abs = absolute ? pathPart : resolve(base, pathPart)
    const key = `${abs}:${line ?? ""}`
    if (seen.has(key)) continue
    try {
      if (!existsSync(abs) || !statSync(abs).isFile()) continue
    } catch { continue }
    seen.add(key)
    links.push({ raw: m[0], path: abs, line })
    if (links.length >= MAX_LINKS) break
  }
  return links
}

/** `file:open` 载荷判据（纯函数 · 零抛）：`path` = 非空**绝对**串 ⇒ 原样；否则 `null`（调用面出 `bad-path`）。
 *  绝对性判据（`isAbsolute`）= 契约「盘上绝对路径（验存件）」（`docs/desktop/design/IPC.md` §2 `file:open` 行）——
 *  相对串零静默拒（`shell.openPath` 会按主进程 cwd 解析 ⇒ 假目标）；
 *  `line` 本批不施加（`shell.openPath` 无行参 —— 载荷备用；端差登记 = `docs/desktop/design/UI.md` §1
 *  「本批注（对齐第三批 · 小修族）」相抵②）。 */
export function fileOpenTarget(payload) {
  const path = payload?.path
  return typeof path === "string" && path !== "" && isAbsolute(path) ? path : null
}
