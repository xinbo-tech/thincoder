// T-XL14 夹具（跨线清零批 · #677 · I14——父侧直执行 · 工程工具面）
// 判据腿：v1 整形抽取复原——`源 = ` ∕ `删除记录 = ` 后 token 整体区间（覆盖指针本体）；
// 负向锁 = 无指针形 ⇒ 零区间（无注记行照红不变）。
import { test } from "node:test"
import assert from "node:assert/strict"
import { pointerRanges } from "../../scripts/doc-check-anchors.mjs"

test("T-XL14a · 源 = 指针：区间非零长且覆盖指针本体", () => {
  const line = "- 旧档已删（机检豁免）：源 = `docs/gone/vanished.md:12`"
  const spans = pointerRanges(line)
  assert.ok(spans.length >= 1, "至少一区间")
  assert.ok(spans.every(([a, b]) => b > a), "区间须非零长（修前：:NN 零长）")
  const idx = line.indexOf("docs/gone/vanished.md")
  assert.ok(spans.some(([a, b]) => idx >= a && idx < b), "区间须覆盖指针本体（修前：不覆盖）")
})

test("T-XL14b · 删除记录 = 指针：同形", () => {
  const line = "（迁移期引文——删除记录 = `docs/gone/other.md:3-5`）"
  const spans = pointerRanges(line)
  const idx = line.indexOf("docs/gone/other.md")
  assert.ok(spans.some(([a, b]) => b > a && idx >= a && idx < b), "覆盖指针本体")
})

test("T-XL14c · 负向锁：无指针形 ⇒ 零区间", () => {
  assert.deepEqual(pointerRanges("（机检豁免）本行无指针形"), [])
})
