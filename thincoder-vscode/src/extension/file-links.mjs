/**
 * file-links.mjs — 验存文件链接抽取（**薄壳** —— parity-b4 W1）：本体（token 抽取 ∕ 去重 ∕ 封顶 ∕
 * 盘上存在闸）核单源 `@thincoder/core/file-links.mjs`；本档只承**端侧探针注入**（盘面 `node:fs`
 * `{ existsSync, statSync }` —— 核缝 fail-loud：缺 ∕ 形违 ⇒ 抛）。
 * 消费面（`panel-callbacks.mjs` onToolResult）调用形零改：`extractFileLinks(cwd, text)` ∕ `MAX_LINKS`。
 */
import { existsSync, statSync } from "node:fs"
import { extractFileLinks as coreExtractFileLinks } from "@thincoder/core/file-links.mjs"

/** 逐结果封顶（核单源 re-export —— 值同旧端侧字面）。 */
export { MAX_LINKS } from "@thincoder/core/file-links.mjs"

/** 工具结果文本 ⇒ 验存文件链接（去重 + 封顶；相对 token 以 `cwd` 为解析基）。 */
export function extractFileLinks(cwd, text) {
  return coreExtractFileLinks(cwd, text, { existsSync, statSync })
}
