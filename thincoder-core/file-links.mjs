/**
 * file-links.mjs — 工具结果文本的**验存**文件链接抽取（上提核件 —— 处理流批 R2 · 2026-09-28）。
 * 上提源 = VSC `thincoder-vscode/src/extension/file-links.mjs`（token 抽取 ∕ 去重 ∕ 封顶）× 桌面同档
 * （相对径需项目根——无根 ⇒ 相对 token 零判据，不落 `process.cwd()` 第二解析基）；本档 = 单源
 * （消费面 = 桌面 `thincoder-desktop/src/main/file-links.mjs` · VSC `thincoder-vscode/src/extension/file-links.mjs`——已随
 * parity-b4 迁移轮改指本档（2026-09-29，双写窗口收口））。
 * 判据 = **盘上存在闸**（存在 ∧ 是文件）：路径 token 只在真实存在时才成链接 —— URL ∕ 日志噪音 ∕
 * 版本号恒不成链接（存在检查 = 最后一道闸）。**验存（`existsSync` ∕ `statSync`）转注入缝**：本档零
 * `node:fs`——盘面探针由调用方注入（`probe = { existsSync, statSync }`）；缺 ∕ 形违 ⇒ 抛（fail-loud——
 * 存在闸未接线不得静默扮成「零链接」）。返回 `[{ raw, path, line }]`：`raw` = 含行后缀原文 · `path` =
 * 盘上绝对路径 · `line` = 数 ∕ 缺 ⇒ `null`；零抛面 = fs 判据（探针逐条 try/catch：不可达 = 不成链接）。
 */

import { isAbsolute, resolve } from "node:path"

/** 路径 token：可选 Windows 盘符 + 路径字符 + 点扩展名 + 可选 `:line` / `:line:col` 后缀；m[1] = 路径本体（供探针）、m[2] = 行号、m[0] = 渲染面包裹面 `raw`。 */
const PATH_TOKEN_RE = /((?:[A-Za-z]:)?[~./\\\w][\w./\\~-]*\.\w{1,10})(?::(\d+)(?::\d+)?)?/g

/** 逐结果封顶（值同源 = VSC 同档 `MAX_LINKS`）。 */
export const MAX_LINKS = 50

/**
 * 工具结果文本 ⇒ 验存文件链接（去重 + 封顶）。`cwd` = 项目根（相对 token 的解析基）；缺 ∕ 空 ⇒ 相对 token
 * 一律不检（禁假链接）；绝对 token 与 cwd 无关，照检。`probe` = 盘面探针注入缝（`{ existsSync(p), statSync(p) }`——
 * `node:fs` 同名面；桌面端侧注入）。零文本（`""` ∕ 非串）先于探针校验早退（零判据面 —— 探针不检）。
 */
export function extractFileLinks(cwd, text, probe) {
  if (typeof text !== "string" || text === "") return []
  if (typeof probe?.existsSync !== "function" || typeof probe?.statSync !== "function") {
    throw new TypeError("extractFileLinks: probe seam missing — inject { existsSync, statSync } (the existence guard must not silently degrade)")
  }
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
      if (!probe.existsSync(abs) || !probe.statSync(abs).isFile()) continue
    } catch { continue }
    seen.add(key)
    links.push({ raw: m[0], path: abs, line })
    if (links.length >= MAX_LINKS) break
  }
  return links
}
