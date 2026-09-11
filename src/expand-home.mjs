/**
 * expand-home.mjs — 配置路径字段的 `~` 家目录展开器（群 A 批 A2，2026-09-11）。
 * 设计权威：`docs/design/SETTINGS.md` §2.7（契约 1——读取点单一归一点、只读归一）。
 * 纯函数、零依赖、home 可注入（测试缝）。本端独立实现，语义与 CLI 同源（不抄文本）。
 */

import { homedir } from "node:os"
import { join } from "node:path"

/** 展开路径前缀 `~`（`~` / `~/` / `~\`）为主目录绝对路径；其余形态一律原样返回。
 *  - 非字符串 / 不以 `~` 开头 → 原样（类型护栏——`shell: null` 零值形态不变）；
 *  - `~user` / `~foo/x` 等非分隔符第二字符 → 原样（不猜用户主目录）；
 *  - 余段分隔符归一为 `/`（跨端配置统一——`~\bin\bash` 与 `~/bin/bash` 同解）；
 *  - `home` 第二参 = 测试注入缝（生产缺省 `homedir()`）。
 */
export function expandHome(p, home = homedir()) {
  if (typeof p !== "string" || !p.startsWith("~")) return p
  if (p === "~") return home
  if (p[1] !== "/" && p[1] !== "\\") return p
  return join(home, p.slice(2).replaceAll("\\", "/"))
}
