/**
 * file-refs.mjs — @-context file reference injection（**薄壳** —— 缺面族批补 #632 上提 · 2026-09-29）。
 * 本体（扫描 ∕ 注入语法 ∕ 4000 截断 ∕ 摘要块 ∕ 剥离 fail-closed 判据）核单源
 * `@thincoder/core/file-refs.mjs`；本档只承**端侧探针注入**（盘面 `node:fs`
 * `{ readFileSync, existsSync, statSync }` —— 核缝 fail-loud：缺 ∕ 形违 ⇒ 抛）。
 * 消费面调用形零改：注入 `injectAtRefs(text, cwd)`（`panel-chat.mjs:187`）· 恢复 ∕ 标题剥离
 * `stripAtRefs(text)`（`panel-session.mjs:185` · `panel-session-write.mjs:139` —— 核件纯 re-export）。
 */
import { readFileSync, existsSync, statSync } from "node:fs"
import { injectAtRefs as injectAtRefsCore } from "@thincoder/core/file-refs.mjs"

/** 复原注入前的用户原文（核件单源 re-export —— 恢复面 ∕ 标题源两消费面同名）。 */
export { stripAtRefs } from "@thincoder/core/file-refs.mjs"

/** 用户文本 ⇒ @ 引用注入形（扫描；相对路径以 `cwd` 为解析基）。 */
export function injectAtRefs(text, cwd) {
  return injectAtRefsCore(text, cwd, { readFileSync, existsSync, statSync })
}
