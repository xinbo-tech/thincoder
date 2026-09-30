/**
 * 批内件 · M-581（重建保真 ∕ 留端清算族批 · 波 5 —— #581 段 14 窗内提示态）· 2026-09-29
 * 终位候选 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.test.mjs`（父侧收口转正 ∕ 并入）；
 * 本波暂住 `.thincoder/tmp/`（沿在册「勿直接写 docs/batches/」暂存惯例 · 见 susp-queue 批先例）。
 *
 * 覆盖（判据单源 = 批档 §2.6 #581 ∕ `docs/desktop/design/UI.md` 表行 14「判据四路」）：
 *  - T1 四态直测：队 ≥ 1 ⇒ 计数句 · 忙 ⇒ 排队句 · **窗 ∧ 非忙 ⇒ 排队句**（本批收正）· 静 ⇒ send 句；
 *  - T2 窗态负向锁：`active` 非严格真（`false` ∕ 真值非布尔 ∕ 缺参 ∕ 非载体）⇒ 不落窗态（回落 send 句——禁假造）；
 *  - T3 优先序：队 ≥ 1 恒压窗 ∕ 忙两态（计数句）；忙 ∧ 窗 同值 ⇒ 排队句（同一形态复用——三态数不变）；
 *  - T4 接线结构核（段装配传 `suspend` + 判据形——防「直测绿 · 接线漏传」盲区）。
 * 复跑：仓根 `node --test .thincoder/tmp/2026-09-29-desktop-rebuild-fidelity-m581.test.mjs`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { initDict, t } from "../../thincoder-desktop/renderer/i18n.mjs"
import { enterSegment } from "../../thincoder-desktop/renderer/views/statusline-segments.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")

initDict({ locale: "zh" })

const KEY = "1"
const NONE = []
const BUSY = ["running"]
const suspOf = (active) => ({ active })

test("M-581 T1 四态直测（窗 ∧ 非忙 ⇒ 排队句 = 本批收正）", () => {
  // 词表非空锁：三键皆出真值（防「键名回落」使断言退化为同义反复）
  assert.notEqual(t("status.queue.n", { n: 1 }), "status.queue.n")
  assert.notEqual(t("status.queue.enter"), "status.queue.enter")
  assert.notEqual(t("status.enter.send"), "status.enter.send")

  const q1 = enterSegment({ [KEY]: ["甲"] }, KEY, NONE, undefined) // ① 队 ≥ 1
  assert.equal(q1.code, "enter")
  assert.deepEqual(q1.parts, [{ text: t("status.queue.n", { n: 1 }) }], "① 队 ≥ 1 ⇒ 计数句")

  const busy = enterSegment({}, KEY, BUSY, undefined) // ② 忙
  assert.deepEqual(busy.parts, [{ text: t("status.queue.enter") }], "② 忙 ⇒ 排队句")

  const windowed = enterSegment({}, KEY, NONE, suspOf(true)) // ③ 窗 ∧ 非忙（本批收正）
  assert.deepEqual(windowed.parts, [{ text: t("status.queue.enter") }], "③ 窗在场 ∧ 队空 ∧ 非忙 ⇒ 排队句（原出 send 句 = 显示说谎残留）")
  assert.deepEqual(windowed.parts, busy.parts, "窗态复用忙态句（三态数不变 · 零新词）")

  const idle = enterSegment({}, KEY, NONE, undefined) // ④ 静
  assert.deepEqual(idle.parts, [{ text: t("status.enter.send") }], "④ 静 ⇒ send 句（静息态恒在场）")
  assert.notDeepEqual(idle.parts, windowed.parts, "③ 与 ④ 互异（收正判别力）")
})

test("M-581 T2 窗态负向锁（active 非严格真 ⇒ 不落窗态；禁假造）", () => {
  const send = [{ text: t("status.enter.send") }]
  assert.deepEqual(enterSegment({}, KEY, NONE, suspOf(false)).parts, send, "active=false ⇒ send 句")
  assert.deepEqual(enterSegment({}, KEY, NONE, suspOf(1)).parts, send, "active=1（真值非布尔）⇒ send 句（严格真判据）")
  assert.deepEqual(enterSegment({}, KEY, NONE, suspOf("true")).parts, send, "active='true'（串真值）⇒ send 句")
  assert.deepEqual(enterSegment({}, KEY, NONE, undefined).parts, send, "缺参（旧三参调用面）⇒ send 句（缺省面零回归）")
  assert.deepEqual(enterSegment({}, KEY, NONE, null).parts, send, "null ⇒ send 句")
  assert.deepEqual(enterSegment({}, KEY, NONE, { running: 1 }).parts, send, "无 active 键的挂起计数载荷 ⇒ send 句")
})

test("M-581 T3 优先序（队 ≥ 1 恒压；忙 ∧ 窗 同值）", () => {
  const two = enterSegment({ [KEY]: ["甲", "乙"] }, KEY, BUSY, suspOf(true))
  assert.deepEqual(two.parts, [{ text: t("status.queue.n", { n: 2 }) }], "队 ≥ 1 恒压窗 ∕ 忙两态（计数句）")
  const both = enterSegment({}, KEY, BUSY, suspOf(true))
  assert.deepEqual(both.parts, [{ text: t("status.queue.enter") }], "忙 ∧ 窗 同值 ⇒ 排队句（同一形态）")
  const noKey = enterSegment({ [KEY]: ["甲"] }, null, NONE, undefined)
  assert.deepEqual(noKey.parts, [{ text: t("status.enter.send") }], "键空 + 无窗：队读零（既有守卫）⇒ send 句")
})

test("M-581 T4 接线结构核（装配传 suspend + 判据形）", () => {
  const segments = text("thincoder-desktop/renderer/views/statusline-segments.mjs")
  const main = text("thincoder-desktop/renderer/views/statusline.mjs")
  assert.match(segments, /export function enterSegment\(pending, key, codes, suspend\)/, "第四参 = suspend")
  assert.match(segments, /codes\.includes\("running"\) \|\| suspend\?\.active === true/, "第二支判据 = 忙 ∨ 窗严格真")
  assert.match(main, /enterSegment\(pending, active, codes, suspend\)/, "段装配传 suspend（防漏传）")
  assert.match(main, /const suspend = susp !== null && typeof susp === "object" \? susp\[active\] : undefined/, "取值面 = `:68` 已取值（零新切片）")
})
