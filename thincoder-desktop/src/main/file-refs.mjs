/**
 * file-refs.mjs — @ 文件引用注入 ∕ 剥离（**薄壳** —— 缺面族批补 #632 · 2026-09-29；沿 `file-links.mjs` 形）。
 * 本体（扫描 ∕ 注入语法 ∕ 4000 截断 ∕ 摘要块 ∕ 剥离 fail-closed 判据）核单源
 * `@thincoder/core/file-refs.mjs`；本档只承**端侧探针注入**（盘面 `node:fs`
 * `{ readFileSync, existsSync, statSync }` —— 核缝 fail-loud：缺 ∕ 形违 ⇒ 抛）。
 * 消费面：注入缝 = `turn-driver.mjs` `injectUserText`（解析基 = `projects.currentCwd()`；无根 ⇒ 原样）；
 * 恢复面剥离 = `session-slots.mjs` `pageHistory`（显示边界——不回写盘面）。
 * 纪律：零第三方依赖（`node:fs`）；只读盘面事实（KD-10 端侧零自写盘）。
 */
import { readFileSync, existsSync, statSync } from "node:fs"
import { injectAtRefs as injectAtRefsCore } from "@thincoder/core/file-refs.mjs"

/** 复原注入前的用户原文（核件单源 re-export —— 恢复面显示边界消费；零第二实现）。 */
export { stripAtRefs } from "@thincoder/core/file-refs.mjs"

/** 用户文本 ⇒ @ 引用注入形（扫描；相对路径以 `cwd` = 项目根为解析基）。 */
export function injectAtRefs(text, cwd) {
  return injectAtRefsCore(text, cwd, { readFileSync, existsSync, statSync })
}
