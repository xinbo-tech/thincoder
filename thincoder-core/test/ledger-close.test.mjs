/**
 * ledger-close.test.mjs — 台账收口两源用例（批 ledger-governance · 台账 #332——设计档
 * docs/core/design/LEDGER.md §3 收口两源 + §8 AC-M2-14 / 用例表 T33–T36）。
 *
 * 面：T33 追认核销直通（待讨论 / 待设计——先行回写 `evidence`）⇒ 已核销 + `closed_at` + 行保留 ·
 * T34 追认缺 `evidence`（缺字段 / 空串 / 全空白）⇒ 拒（文案逐字 + 行不变）· T35 在途 → 已核销 ⇒ 拒
 * （不可跳；反证 = 在途 → 待核销 → 已核销 两步照旧）· T36 边界（已核销 / 已废弃 现态 ⇒ 拒 · 未知 id ⇒
 * 拒（既有文案）· 追认 `executor` 零触碰（哨兵）· 撤回回归（待讨论 → 已废弃 + `executor=NULL`））。
 * 手法：临时 cwd + 自造在档（`docs/batches/here.md`）+ tmp 台账库（`_setLedgerDirForTest`——
 * 不读写真实用户库）；行经写命令构造（ledgerAdd → 迁待设计 / 在途——在途带在档指针过写门）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  ledgerAdd, ledgerClose, ledgerQuery, ledgerUpdate, _resetLedgerDirForTest, _setLedgerDirForTest,
} from "../ledger.mjs"

let tmp, seq = 0
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-close-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => { _resetLedgerDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

/** 夹具：临时项目（cwd）+ 自造在档 + 新行（入待讨论）→ {proj, id}。 */
function fixture() {
  const proj = join(tmp, `proj${seq++}`)
  mkdirSync(join(proj, "docs", "batches"), { recursive: true })
  writeFileSync(join(proj, "docs", "batches", "here.md"), "# 在档\n")
  const id = ledgerAdd({ cwd: proj, row: { kind: "requirement", title: `收口两源用例 ${seq}` } })
  return { proj, id }
}
/** 迁待设计（迁移表 待讨论 → 待设计）。 */
const toDesign = (proj, id) => ledgerUpdate({ cwd: proj, id, patch: { status: "待设计" } })
/** 迁在途（唯一入边 待设计 → 在途——相机带在档指针过写门）。 */
const toInflight = (proj, id) => { toDesign(proj, id); ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: "docs/batches/here.md" } }) }
const rowOf = (proj, id) => ledgerQuery({ cwd: proj }).find((r) => r.id === id)

// ── T33 正常：追认核销直通（两源）────────────────────────────────────────────
test("T33 正常：追认核销直通——待讨论 / 待设计（先行回写 evidence）⇒ 已核销 + closed_at + 行保留", () => {
  // 待讨论源（D2 两跳：先 ledger_update 回写证据，再收口）
  const a = fixture()
  ledgerUpdate({ cwd: a.proj, id: a.id, patch: { evidence: "落点 file:line · 批档 §2" } })
  ledgerClose({ cwd: a.proj, id: a.id, status: "已核销" })
  const ra = rowOf(a.proj, a.id)
  assert.equal(ra.status, "已核销", "待讨论 → 已核销 直通落盘")
  assert.ok(ra.closed_at, "closed_at 写入")
  assert.equal(ra.evidence, "落点 file:line · 批档 §2", "evidence 原样（非清空）")
  assert.equal(ledgerQuery({ cwd: a.proj }).filter((r) => r.id === a.id).length, 1, "行保留（软删除——实体不删）")

  // 待设计源
  const b = fixture()
  toDesign(b.proj, b.id)
  ledgerUpdate({ cwd: b.proj, id: b.id, patch: { evidence: "落点 file:line · 批档 §2" } })
  ledgerClose({ cwd: b.proj, id: b.id, status: "已核销" })
  const rb = rowOf(b.proj, b.id)
  assert.equal(rb.status, "已核销", "待设计 → 已核销 直通落盘")
  assert.ok(rb.closed_at, "closed_at 写入")
})

// ── T34 错误：追认缺 evidence（缺字段 / 空串 / 全空白）────────────────────────
test("T34 错误：追认核销缺 evidence（缺字段 / 空串 / 全空白）⇒ 拒（文案逐字 + 行不变）", () => {
  const cases = [
    { to: null, ev: null, msg: "ledgerClose：追认核销须带 evidence（现态 待讨论）" },
    { to: "待设计", ev: "", msg: "ledgerClose：追认核销须带 evidence（现态 待设计）" },
    { to: null, ev: "   ", msg: "ledgerClose：追认核销须带 evidence（现态 待讨论）" },
  ]
  for (const c of cases) {
    const { proj, id } = fixture()
    if (c.to) toDesign(proj, id)
    if (c.ev !== null) ledgerUpdate({ cwd: proj, id, patch: { evidence: c.ev } })
    assert.throws(
      () => ledgerClose({ cwd: proj, id, status: "已核销" }),
      { message: c.msg },
      `文案逐字（${JSON.stringify(c.ev)}）`,
    )
    const row = rowOf(proj, id)
    assert.equal(row.status, c.to ?? "待讨论", "拒后 status 不变")
    assert.equal(row.closed_at, null, "拒后 closed_at 不写")
  }
})

// ── T35 错误：在途 → 已核销 不可跳（反证 = 两步勾销链零破）────────────────────
test("T35 错误：在途 → 已核销 ⇒ 拒（文案逐字 + 行不变）；反证 = 在途 → 待核销 → 已核销 两步照旧", () => {
  const a = fixture()
  toInflight(a.proj, a.id)
  assert.throws(
    () => ledgerClose({ cwd: a.proj, id: a.id, status: "已核销" }),
    { message: "ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 在途）" },
    "文案逐字（在途不可跳 待核销）",
  )
  const row = rowOf(a.proj, a.id)
  assert.equal(row.status, "在途", "拒后 status 不变")
  assert.equal(row.closed_at, null, "拒后 closed_at 不写")

  const b = fixture()
  toInflight(b.proj, b.id)
  ledgerUpdate({ cwd: b.proj, id: b.id, patch: { status: "待核销" } })
  ledgerClose({ cwd: b.proj, id: b.id, status: "已核销" })
  const rb = rowOf(b.proj, b.id)
  assert.equal(rb.status, "已核销", "两步勾销链照旧成功（零破）")
  assert.ok(rb.closed_at, "closed_at 写入")
})

// ── T36 边界：终态现态 / 未知 id / executor 零触碰 / 撤回回归 ───────────────
test("T36 边界：已核销 / 已废弃 现态 ⇒ 拒 · 未知 id ⇒ 拒 · 追认 executor 零触碰（哨兵）· 撤回回归（含 executor=NULL）", () => {
  // 已核销现态 ⇒ 拒（明确报错——非静默幂等）
  const a = fixture()
  ledgerUpdate({ cwd: a.proj, id: a.id, patch: { evidence: "落点 file:line" } })
  ledgerClose({ cwd: a.proj, id: a.id, status: "已核销" })
  assert.throws(
    () => ledgerClose({ cwd: a.proj, id: a.id, status: "已核销" }),
    { message: "ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 已核销）" },
    "已核销现态 ⇒ 拒",
  )

  // 已废弃现态 ⇒ 拒
  const b = fixture()
  ledgerClose({ cwd: b.proj, id: b.id, status: "已废弃" })
  assert.throws(
    () => ledgerClose({ cwd: b.proj, id: b.id, status: "已核销" }),
    { message: "ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 已废弃）" },
    "已废弃现态 ⇒ 拒",
  )

  // 未知 id ⇒ 拒（既有文案零改）
  assert.throws(
    () => ledgerClose({ cwd: b.proj, id: 999999, status: "已核销" }),
    { message: "ledgerClose：行 999999 不存在" },
    "未知 id 既有文案",
  )

  // 追认核销 executor 零触碰（哨兵——待设计行经纯字段更新可带 executor，§3.1 ③）
  const c = fixture()
  toDesign(c.proj, c.id)
  ledgerUpdate({ cwd: c.proj, id: c.id, patch: { executor: "keep-me" } })
  ledgerUpdate({ cwd: c.proj, id: c.id, patch: { evidence: "落点 file:line" } })
  assert.equal(rowOf(c.proj, c.id).executor, "keep-me", "前提：待设计行带哨兵")
  ledgerClose({ cwd: c.proj, id: c.id, status: "已核销" })
  assert.equal(rowOf(c.proj, c.id).executor, "keep-me", "追认零触碰（哨兵原样保留——非清零动作）")

  // 撤回回归：待讨论 → 已废弃 照常 + executor 同步 NULL（§3.1 ④ 零改）
  const d = fixture()
  ledgerUpdate({ cwd: d.proj, id: d.id, patch: { executor: "keep-me" } })
  ledgerClose({ cwd: d.proj, id: d.id, status: "已废弃" })
  const rd = rowOf(d.proj, d.id)
  assert.equal(rd.status, "已废弃", "待讨论 → 已废弃 照常（撤回零改）")
  assert.equal(rd.executor, null, "撤回路径 executor 同步置 NULL（零改）")
  assert.ok(rd.closed_at, "closed_at 写入")
})
