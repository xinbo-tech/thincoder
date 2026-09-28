/**
 * search.js — 会话内搜索端壳（Ctrl+F，CLI 对位）。侧效应导入面（`chat.js` `import "./search.js"`）——注册
 * Ctrl+F 键位 + 扫描 ∕ 高亮面装配。
 *
 * 实现在核：`@thincoder/render-core/search.mjs` `createSearch`（批 `docs/batches/2026-09-28-desktop-feature-parity.md`
 * §2.2 R6 ∕ §2.7 KD-T2「上提面四处」之四——**整件上提 = 纯搬 + 转口零语义改**；源档 165 行 ⇒ 核件 + 本壳）。
 *
 * 端壳三面（**零行为变**）：
 *  ① `root` 绑定 = `ctx.messagesEl`（`#messages` —— 扫描 ∕ 高亮容器，与源档同一指针）；
 *  ② 既有宿主键位 = Ctrl+F 文档级监听（住核件工厂——随 `createSearch` 一次注册；键名 ∕ 三修饰键守卫 ∕
 *     `preventDefault` 逐字承源 `:159-165`，本档零副本）；
 *  ③ 防抖（150ms）∕ mark 上限（500）∕ 计数 ∕ 上下跳 ∕ Esc 关 ∕ 关闭置焦诸面皆在核件（源逻辑零副本）。
 * 条插入锚 `#toolbar` 与关闭置焦 `#input` = 两端同字形文档级 id（核件内直取，不经本档）。
 */
import { createSearch } from "../node_modules/@thincoder/render-core/search.mjs"
import { ctx } from "./state.js"

createSearch({ root: ctx.messagesEl })
