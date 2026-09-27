/**
 * queued-mark.test.mjs — 核纯函数层：待发送标记快照计划（`flow/queued-mark.mjs`——`applyBusyQueued`
 * 的逻辑面逐条对拍；契约 = `WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { QUEUED_MAX_ITEMS, planBusyQueued } from "../flow/queued-mark.mjs"

test("镜像读数：count 优先 / pending 折算 / 队容量常量", () => {
  assert.equal(QUEUED_MAX_ITEMS, 8)
  assert.deepEqual(planBusyQueued([], { count: 3 }), { count: 3, pending: true, clear: [], remove: [], mark: [], append: [] })
  assert.deepEqual(planBusyQueued([], { pending: true }).count, 1)
  assert.equal(planBusyQueued([], {}).pending, false)
})

test("逐条标记：已标记同文保持 / 另有同文气泡就地标记（末条优先）/ 无同文 ⇒ 追加并标记", () => {
  // 已存在 ⇒ 保持（零动作）
  assert.deepEqual(planBusyQueued([{ raw: "hi", marked: true }], { count: 1, items: ["hi"] }), { count: 1, pending: true, clear: [], remove: [], mark: [], append: [] })
  // 末条优先：两条同文未标记 ⇒ 标记末条
  const r = planBusyQueued([{ raw: "x", marked: false }, { raw: "x", marked: false }], { count: 1, items: ["x"] })
  assert.deepEqual(r.mark, [1])
  assert.deepEqual(r.append, [])
  // 无同文 ⇒ 追加（Reload 冷启 / retry 无回显入口）
  const r2 = planBusyQueued([], { count: 2, items: ["a", "b"] })
  assert.deepEqual(r2.append, [{ raw: "a", mark: true }, { raw: "b", mark: true }])
  // items 数字 / null 归一为字符串
  assert.deepEqual(planBusyQueued([], { items: [1, null] }).append, [{ raw: "1", mark: true }, { raw: "null", mark: true }])
})

test("防悬空：已标记原文 ∉ items 且非本批 merged ⇒ 移除", () => {
  const r = planBusyQueued([{ raw: "old", marked: true }], { count: 1, items: ["new"] })
  assert.deepEqual(r.remove, [0])
  assert.deepEqual(r.append, [{ raw: "new", mark: true }])
  // 已标记且仍在 items ⇒ 不动
  const r2 = planBusyQueued([{ raw: "old", marked: true }], { count: 1, items: ["old"] })
  assert.deepEqual(r2.remove, [])
})

test("合并批：单条（文本 = 已标记气泡原文）⇒ 清标保留；多条 ⇒ 移除已标记 + 追加合并气泡（不标记）", () => {
  const single = planBusyQueued([{ raw: "x", marked: true }], { count: 0, items: [], merged: "x" })
  assert.deepEqual(single.clear, [0])
  assert.deepEqual(single.remove, [])
  assert.deepEqual(single.append, [])

  const multi = planBusyQueued([{ raw: "a", marked: true }, { raw: "b", marked: true }, { raw: "keep", marked: false }], { count: 1, items: [], merged: "a\nb" })
  assert.deepEqual(multi.remove.sort(), [0, 1])
  assert.deepEqual(multi.append, [{ raw: "a\nb", mark: false }])
  assert.deepEqual(multi.clear, [])

  // 无已标记气泡 ⇒ 零动作（回声面已在位）
  const none = planBusyQueued([{ raw: "z", marked: false }], { count: 1, items: [], merged: "z" })
  assert.deepEqual(none, { count: 1, pending: true, clear: [], remove: [], mark: [], append: [] })
})

test("合并批 + 残项（消费端 T-V16-13 同形 · 生产可达）：已删集对 items 认领不可见 ⇒ 残项重建泡", () => {
  // 宿主按批取（多批 = 多回合）⇒ 推 `{items: 残项, merged: 本批}`（`panel-turn-stages.mjs`
  // `deliverBusyQueued` / `suspension.mjs` 消费点）。源档 DOM 实读：先移除已标记泡、后逐条认领
  // （`lastBubbleWithRaw` 只扫在连 DOM）⇒ 残项认领不到已删泡 ⇒ 追加新泡（标记）。
  const r = planBusyQueued(
    [{ raw: "a", marked: true }, { raw: "b", marked: true }, { raw: "c", marked: true }],
    { count: 1, items: ["c"], merged: "a\nb" },
  )
  assert.deepEqual(r.remove, [0, 1, 2], "合并批移除全部已标记泡（含残项原泡）")
  assert.deepEqual(r.mark, [], "已删集不入认领（同索引 remove ∧ mark = 双重动作 ⇒ 残项挂空）")
  assert.deepEqual(r.append, [{ raw: "a\nb", mark: false }, { raw: "c", mark: true }], "残项重建泡（标记）——序 = 合并泡在前")
  assert.deepEqual([r.count, r.pending], [1, true], "镜像 = 残项快照实况")
})

test("合并单条 + 同文仍在 items：清标后按 items 重认领（源档同序——两动作并存）", () => {
  const r = planBusyQueued([{ raw: "x", marked: true }], { count: 1, items: ["x"], merged: "x" })
  assert.deepEqual(r.clear, [0])
  assert.deepEqual(r.mark, [0], "清标后 items 重标记（源档 clearPending → lastBubbleWithRaw 同序）")
})
