/**
 * text-budget.test.mjs — 核内单一文本额度面用例（§2.5 #164 / #76 并入的 UTF-16 安全切片）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  capText, appendCappedText, fillMarker, safeSliceUTF16, safeSliceUTF16Tail,
} from "../text-budget.mjs"

test("capText / appendCappedText：头保 + 中段标记 + 尾保（既有口径保持）", () => {
  assert.equal(capText("abcdef", { max: 10 }), "abcdef", "≤max 零拷贝")
  assert.equal(capText("abcdefghij", { max: 6, keepHead: 2, keepTail: 2, marker: "…N…" }), "ab…6…ij")
  assert.equal(fillMarker("… N omitted …", 7), "… 7 omitted …")
  const merged = appendCappedText("aaaa", "bbbbbbbb", { hard: 6, head: 2, tail: 1, marker: "[N]" })
  assert.equal(merged, "aa[9]b")
})

test("safeSliceUTF16：高代理切开时回退一码元（不成对代理不落单）", () => {
  const emoji = "a😀b" // ['a', high, low, 'b']
  assert.equal(safeSliceUTF16(emoji, 4), emoji, "≤max 原样")
  assert.equal(safeSliceUTF16(emoji, 3), "a😀", "切点落低代理前 → 代理对完整保留")
  assert.equal(safeSliceUTF16(emoji, 2), "a", "切点落高代理 → 回退一码元（整对丢弃）")
  assert.equal(safeSliceUTF16(emoji, 1), "a")
})

test("safeSliceUTF16Tail：起点低代理前移 + 末尾孤立高代理去除", () => {
  const emoji = "ab😀" // ['a','b', high, low]
  assert.equal(safeSliceUTF16Tail(emoji, 4), emoji)
  assert.equal(safeSliceUTF16Tail(emoji, 2), "😀", "起点落高代理 → 代理对完整保留")
  // 起点落低代理（原文自身带残代理）→ 前移一码元
  const lowOrphan = "ab\uDC00\uDC01"
  assert.equal(safeSliceUTF16Tail(lowOrphan, 2), "\uDC01", "起点落低代理 → 前移一码元")
  // 末尾孤立高代理（原文自身带残代理）→ 去掉，尾切片不新增孤立代理
  const orphan = "abc\uD83D"
  assert.equal(safeSliceUTF16Tail(orphan, 3), "bc", "末尾孤立高代理被去除")
})
