/**
 * expand-home.mjs — 配置路径字段家目录展开器（第 29 批 HOME-EXPANSION，2026-09-11）。
 * `loadConfig()` 单一规范化点（设计 MEMORY.md §9.3a）：纯函数、零依赖、home 可注入。
 */

import { homedir } from "node:os"
import { join } from "node:path"

/** 展开配置路径字段的前缀 `~`（`~` / `~/` / `~\`）为主目录绝对路径；不识别形态原样返回。
 *  home 第二参 = 测试注入缝（生产缺省 homedir()）。 */
export function expandHome(p, home = homedir()) {
  if (typeof p !== "string" || !p.startsWith("~")) return p   // 非字符串 / 非 ~ 前缀 → 原样
  if (p === "~") return home                                  // 裸 ~ = 主目录
  if (p[1] !== "/" && p[1] !== "\\") return p                 // ~user 等非分隔符 → 原样（不猜用户）
  return join(home, p.slice(2).replaceAll("\\", "/"))         // 余段分隔符归一（跨端统一）
}
