/**
 * slow.mjs — `slow ≡ test`（M10 测试纪律：慢测层归册语义已废——2026-09-17）。
 * 保留 `slow` 导出名以不悬空既有 `import { slow } from "./slow.mjs"`（历史 import 兼容面）。
 * 慢就慢，全量跑——不再 skip。
 */
export { test as slow } from "node:test"
