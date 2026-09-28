/**
 * queued-input.test.mjs — 宿主排队面用例（「回合中插入」批 · 任务书 = 批档 §2.4 测试面 · 机制单源 =
 * `docs/desktop/design/PROJECT.md` §2 **KD-40 ①**）：
 *   U214 计划面（常量 / 合并形态 / 取批计划 —— **与 CLI 副本值对拍**：逐样本 `deepEqual`）；
 *   U215 队列表（容量按键判 · 快照投影 `{ text, ts }`（图不入）· 取批计划（slash 单条 / 携图并集）· 落取 /
 *        清键 / 清全表）。
 * 用例号自铸（U214–U215 —— 设计用例号归属表无本舱段，沿 A-3b `U120/U121` 先例）—— 披露 = 批次档 §5。
 * 平 node 直测：零 electron / 零 IO / 零网（值对拍源 = CLI 副本 `thincoder-cli/src/tui/queued-merge.mjs` 与本档 `queued-input.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  MAX_MERGE_CHARS as CLI_MAX_CHARS, MAX_MERGE_ITEMS as CLI_MAX_ITEMS, QUEUED_MAX_ITEMS as CLI_QUEUED_MAX,
  formatMergedMessages as cliFormat, planQueuedInput as cliPlan,
} from "../../thincoder-cli/src/tui/queued-merge.mjs"
import {
  MAX_MERGE_CHARS, MAX_MERGE_ITEMS, QUEUED_MAX_ITEMS, formatMergedMessages, planQueuedInput,
} from "../src/main/queued-input.mjs"
import { createQueuedInput } from "../src/main/queued-input.mjs"

// ─── U214 计划面（常量 / 合并形态 / 值对拍锁）────────────────────────

test("U214: 计划面常量与合并形态（与 CLI 副本同值 · 逐样本 deepEqual 对拍）", () => {
  assert.equal(QUEUED_MAX_ITEMS, 8, "队容量 = 8（按键判）")
  assert.equal(CLI_QUEUED_MAX, QUEUED_MAX_ITEMS, "值与 CLI 副本同（三端同值锁定）")
  assert.deepEqual([MAX_MERGE_ITEMS, MAX_MERGE_CHARS], [CLI_MAX_ITEMS, CLI_MAX_CHARS], "合并两常量与 CLI 同值")
  assert.deepEqual([MAX_MERGE_ITEMS, MAX_MERGE_CHARS], [8, 2000], "R15 逐字值")

  assert.equal(formatMergedMessages(["a", "b"]), cliFormat(["a", "b"]), "合并形态逐字同源（zh 字面 —— 端差说明在案）")
  assert.equal(formatMergedMessages(["甲", "乙", "丙"]), "你排队了 3 条消息：\n1. 甲\n2. 乙\n3. 丙\n——一次处理", "合并形态定形")

  const long = "x".repeat(MAX_MERGE_CHARS + 1)
  const samples = [
    [], ["one"], ["一", "二"], ["/cmd"], ["/cmd", "a"], ["a", "/cmd"], ["a", "b", "/cmd", "c", "d"],
    [long], ["a", long, "b"], Array.from({ length: 9 }, (_, i) => `第${i + 1}条`),
    Array.from({ length: 20 }, () => "短"),
  ]
  for (const items of samples) {
    assert.deepEqual(planQueuedInput(items), cliPlan(items), `计划面值对拍（样本 = ${JSON.stringify(items.map((s) => s.slice(0, 12)))}）`)
  }
  assert.equal(planQueuedInput(["one"])[0].kind, "turn", "文本条目 ⇒ turn 动作")
  assert.equal(planQueuedInput(["/x"])[0].kind, "slash", "slash 首动作 ⇒ slash（逐条）")
  assert.equal(planQueuedInput(["a", long, "b"])[1].text, long, "单条超长 ⇒ 该条直发（不进批）")
})

// ─── U215 队列表（容量 / 快照 / 计划 / 取批 / 清）────────────────────

test("U215: 队列表（容量按键判 · 快照投影 · 取批计划 · 落取 / 清键 / 清全表）", () => {
  const q = createQueuedInput()
  assert.equal(q.plan("1"), null, "空队 ⇒ 计划 null（零消费面）")
  assert.deepEqual(q.snapshot("1"), [], "空队快照 = []（整置语义）")
  assert.equal(q.clear("1"), false, "空键清 ⇒ false（零帧）")

  for (let i = 0; i < QUEUED_MAX_ITEMS; i += 1) assert.deepEqual(q.add("1", { text: `第${i + 1}条`, ts: i + 1 }), { ok: true }, `第 ${i + 1} 条受理`)
  assert.deepEqual(q.add("1", { text: "第9条", ts: 99 }), { ok: false }, "满队 ⇒ 拒（零入队 —— 调用面据此回 queue-full）")
  assert.equal(q.size("1"), QUEUED_MAX_ITEMS, "队长不增")
  assert.deepEqual(q.add("2", { text: "他键", ts: 1 }), { ok: true }, "**按键判**：他键未满 ⇒ 照收")

  const image = { name: "a.png", mime: "image/png", dataURL: "data:image/png;base64,AAAA" }
  q.take("2", 1)
  assert.deepEqual(q.add("2", { text: "带图", ts: 7, images: [image] }), { ok: true }, "携图条目受理（原样）")
  assert.deepEqual(q.snapshot("2"), [{ text: "带图", ts: 7 }], "快照 = `{ text, ts }` 恰形（**图不入快照**）")
  const withImage = q.plan("2")
  assert.deepEqual([withImage.slash, withImage.text, withImage.entries.length], [false, "带图", 1], "计划面恰形")
  assert.deepEqual(withImage.images, [image], "计划面 `images` = 本批并集（步边界「整批让位」判据源）")

  const first = q.plan("1")
  assert.equal(first.text, cliPlan(Array.from({ length: 8 }, (_, i) => `第${i + 1}条`))[0].text, "计划文本 = CLI 同值（合并格式）")
  assert.equal(first.entries.length, 8, "满队 ⇒ 恰一批一次消费")
  const taken = q.take("1", first.entries.length)
  assert.deepEqual(taken.map((entry) => entry.text), first.entries.map((entry) => entry.text), "落取 = 计划跨度（序不变）")
  assert.equal(q.size("1"), 0, "取出尽 ⇒ 队长归零")
  assert.equal(q.plan("1"), null, "取出尽 ⇒ 计划 null（键随清）")

  q.add("1", { text: "/cmd (slash)", ts: 1 })
  q.add("1", { text: "后续", ts: 2 })
  const slash = q.plan("1")
  assert.deepEqual([slash.slash, slash.text, slash.entries.length], [true, "/cmd (slash)", 1], "slash 首动作 ⇒ 单条跨 1（保序）")
  assert.equal(q.take("1", slash.entries.length).length, 1, "slash 落取恰一条（不合并）")
  assert.equal(q.plan("1").text, "后续", "余项留待下批（超限 / slash 截批先行）")

  q.add("3", { text: "x", ts: 1 })
  q.add("4", { text: "y", ts: 2 })
  assert.deepEqual(q.clearAll().sort(), ["1", "2", "3", "4"], "清全表 ⇒ 返被判清单（调用面逐键出空快照）")
  assert.deepEqual(q.snapshot("3"), [], "清全表后零残留")
  assert.equal(q.take("1", 1).length, 0, "空键落取 ⇒ 零条")
})
