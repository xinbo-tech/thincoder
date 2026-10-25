/**
 * 2026-10-25-closeout-marker-gate.test.mjs — 批内单测件（批档 = `docs/batches/2026-10-25-closeout-marker-gate.md` §2）：
 * 核销标记门——写入 `已核销` 的三径（close 单行 ∥ close 批量 ∥ update 迁移）判结果行标题携「收尾链待跑」⇒ 拒。
 * 权威 = `docs/core/design/LIGHT-CHANNEL.md` §2.5（机制 ∥ 拒文逐字 ∥ 用例表 M1–M6）。
 *
 * 复跑（cwd = `d:\teamcode\thincoder`）：`node --test docs/batches/2026-10-25-closeout-marker-gate.test.mjs`
 * 生命周期：随批档留存（不进 `test/` 收集面——收口即删）。
 *
 * 夹具：每例独立临时项目根（`PROJECT-MANIFEST.json` + 在盘批档充 `task_book` 所指）——键控库按根分档
 * 天然隔离；`_setLedgerDirForTest` 把库目录移出真实用户目录（既有注入面）。
 * M7 = 本批增量回归（设计用例表外补一例）：标记单源迁 `ledger-db.mjs` 后，闸谓词 `lightRoundOpen`
 * 照放——M1–M6 不触该消费面，缺本例则迁址破闸无哨兵。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const {
  ledgerAdd, ledgerUpdate, ledgerClose, ledgerCloseBatch, ledgerQuery,
  _setLedgerDirForTest, _resetLedgerDirForTest,
} = await import("../../thincoder-core/ledger.mjs")
const { lightRoundOpen } = await import("../../thincoder-core/agent/light-round.mjs")

const MARKER = "收尾链待跑"
const REFUSE_CLOSE = `ledgerClose：行标题仍携「${MARKER}」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`
const REFUSE_UPDATE = `ledgerUpdate：行标题仍携「${MARKER}」——收尾链未跑完，不许核销（先跑收尾全链，再由父侧清标记）`

const ledgerDir = mkdtempSync(join(tmpdir(), "lcg-ledgerdir-"))
_setLedgerDirForTest(ledgerDir)

const projects = []
/** 独立项目根（键控库按根分档 ⇒ 例间行集零互染）+ 在盘批档（写门臂② 与批量径的解析对象）。 */
function makeProject(tag) {
  const root = mkdtempSync(join(tmpdir(), `lcg-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), "{}\n")
  writeFileSync(join(root, "batch.md"), "# 夹具批档\n\n## §1 讨论\n**状态行**：🔄 进行中\n\n## §2 批次任务\n")
  return root
}

/** 加一行并推至 `待核销`（迁移链三步；`task_book` 在 add 时落——写门臂① 要求在途 / 待核销携指针）。 */
function addRowAtPendingClose(cwd, title) {
  const id = ledgerAdd({ cwd, row: { kind: "tech_todo", title, task_book: "batch.md" } })
  ledgerUpdate({ cwd, id, patch: { status: "待设计" } })
  ledgerUpdate({ cwd, id, patch: { status: "在途" } })
  ledgerUpdate({ cwd, id, patch: { status: "待核销" } })
  return id
}

const rowOf = (cwd, id) => ledgerQuery({ cwd }).find((r) => r.id === id)

/** 同步抛错捕获（`assert.throws` 不回传错误对象——Node 24 实测）。 */
const capture = (fn) => { try { fn(); return null } catch (e) { return e } }

after(() => {
  _resetLedgerDirForTest()
  for (const p of projects) rmSync(p, { recursive: true, force: true })
  rmSync(ledgerDir, { recursive: true, force: true })
})

test("M1 错误 · 携标记核销 ⇒ 拒，报错逐字，行状态不变", () => {
  const cwd = makeProject("m1")
  const id = addRowAtPendingClose(cwd, `轻通道轮 · ${MARKER} · M1`)
  const err = capture(() => ledgerClose({ cwd, id, status: "已核销" }))
  assert.ok(err instanceof Error, "携标记 ⇒ 必拒")
  assert.equal(err.message, REFUSE_CLOSE)
  assert.equal(rowOf(cwd, id).status, "待核销", "门拒不落任何写")
})

test("M2 正常 · 清标记后核销 ⇒ 通过", () => {
  const cwd = makeProject("m2")
  const id = addRowAtPendingClose(cwd, `轻通道轮 · ${MARKER} · M2`)
  ledgerUpdate({ cwd, id, patch: { title: "轻通道轮 · M2" } }) // 父侧清标记 = 纯字段补丁
  const out = ledgerClose({ cwd, id, status: "已核销" })
  assert.equal(out.status, "已核销")
  assert.equal(rowOf(cwd, id).status, "已核销")
})

test("M3 错误 · 迁移径：携标记 update→已核销 拒；同笔携清标记 title 放行", () => {
  const cwd = makeProject("m3")
  const id = addRowAtPendingClose(cwd, `轻通道轮 · ${MARKER} · M3`)
  const err = capture(() => ledgerUpdate({ cwd, id, patch: { status: "已核销" } }))
  assert.ok(err instanceof Error, "迁移径携标记 ⇒ 必拒")
  assert.equal(err.message, REFUSE_UPDATE)
  assert.equal(rowOf(cwd, id).status, "待核销", "迁移径门拒同样不落写")
  // 一笔 update 同携清标记 title + status=已核销 ⇒ 判**结果标题** ⇒ 放行
  ledgerUpdate({ cwd, id, patch: { title: "轻通道轮 · M3", status: "已核销" } })
  assert.equal(rowOf(cwd, id).status, "已核销")
})

test("M4 边界 · 携标记行撤回（→ 已废弃）⇒ 不拦", () => {
  const cwd = makeProject("m4")
  const id = addRowAtPendingClose(cwd, `轻通道轮 · ${MARKER} · M4`)
  const out = ledgerClose({ cwd, id, status: "已废弃" })
  assert.equal(out.status, "已废弃")
  assert.equal(rowOf(cwd, id).status, "已废弃")
})

test("M5 边界 · 批量径：携标记行落 skipped（why 携拒文原文），无标记行 applied", () => {
  const cwd = makeProject("m5")
  const marked = addRowAtPendingClose(cwd, `轻通道轮 · ${MARKER} · M5`)
  const plain = addRowAtPendingClose(cwd, "轻通道轮 · M5 无标记")
  const out = ledgerCloseBatch({ cwd, batch: "batch.md" })
  assert.deepEqual(out.applied, [plain])
  assert.equal(out.skipped.length, 1)
  assert.equal(out.skipped[0].id, marked)
  assert.equal(out.skipped[0].why, REFUSE_CLOSE, "批量径 why = 拒文原文逐行点名")
  assert.equal(rowOf(cwd, marked).status, "待核销")
  assert.equal(rowOf(cwd, plain).status, "已核销")
})

test("M6 正常 · 无标记行 close → 已核销 ⇒ 照常通过（回归）", () => {
  const cwd = makeProject("m6")
  const id = addRowAtPendingClose(cwd, "普通条目 · M6")
  const out = ledgerClose({ cwd, id, status: "已核销" })
  assert.equal(out.status, "已核销")
  assert.equal(rowOf(cwd, id).status, "已核销")
})

test("M7 回归 · 标记单源迁址后闸谓词 lightRoundOpen 照放", async () => {
  const cwd = makeProject("m7")
  const id = ledgerAdd({ cwd, row: { kind: "tech_todo", title: `轻通道轮 · ${MARKER} · M7`, task_book: "batch.md" } })
  ledgerUpdate({ cwd, id, patch: { status: "待设计" } })
  ledgerUpdate({ cwd, id, patch: { status: "在途" } }) // 闸读判据 = 在途 ∧ 标题携标记 ∧ 批档 §1 进行中
  assert.equal(await lightRoundOpen({ cwd }), true, "迁址后 ROUND_MARKER 经 ledger.mjs re-export 解构——断链则恒 false")
})
