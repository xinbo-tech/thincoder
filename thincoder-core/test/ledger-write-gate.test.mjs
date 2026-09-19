/**
 * ledger-write-gate.test.mjs — 台账写门·指针存在性用例（M2 · 台账 #38——设计档
 * docs/core/design/LEDGER.md §6.1 写门 + §8 AC-M2-8 / 用例表 T11–T14）。
 *
 * 面：T11 三形态（无后缀 / `§N` / `§N（括注）`）指向在档 ⇒ 通过 · T12 指向不在册档 / 非文件 ⇒ 拒
 * （文案逐字 + 行不变）· T13 缺文件部分（`§2`）⇒ 拒 · T14 射程 = 结果行状态（待讨论 / 待设计不判）
 * + O1 基准同源（2026-09-18 fix 轮）：容器根 / 子仓两 cwd 键**同库** ⇒ 指针基准**同取子仓**（三形态均通过）。
 * + §6.1 连带效果段（脏指针行任何更新同拒——出路 = ledgerClose 迁出射程）。
 * 手法：临时 cwd + 自造在档（`docs/batches/here.md`）+ tmp 台账库（`_setLedgerDirForTest`——
 * 不读写真实用户库）；行经写命令构造（ledgerAdd → 迁待设计——迁「在途」由各用例带 task_book 执行）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import {
  ledgerAdd, ledgerClose, ledgerDbPath, ledgerQuery, ledgerUpdate, openLedger, _resetLedgerDirForTest, _setLedgerDirForTest,
} from "../ledger.mjs"

let tmp, seq = 0
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-gate-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => { _resetLedgerDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

/** 夹具：临时项目（cwd）+ 自造在档 + 新行（入待讨论 → 迁待设计，门射程外）→ {proj, id}。 */
function fixture() {
  const proj = join(tmp, `proj${seq++}`)
  mkdirSync(join(proj, "docs", "batches"), { recursive: true })
  writeFileSync(join(proj, "docs", "batches", "here.md"), "# 在档\n")
  const id = ledgerAdd({ cwd: proj, row: { kind: "requirement", title: `写门用例 ${seq}` } })
  ledgerUpdate({ cwd: proj, id, patch: { status: "待设计" } })
  return { proj, id }
}
const rowOf = (proj, id) => ledgerQuery({ cwd: proj }).find((r) => r.id === id)

// ── T11 正控：三形态指向在档 ⇒ 通过 ─────────────────────────────────────────
test("T11 正常：task_book 三形态（无后缀 / §N / §N（括注））指向在档 → 通过（不误拒）", () => {
  for (const tb of ["docs/batches/here.md", "docs/batches/here.md§2", "docs/batches/here.md§1.5（括注）"]) {
    const { proj, id } = fixture()
    ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: tb } })
    const row = rowOf(proj, id)
    assert.equal(row.status, "在途", `通过并落盘：${tb}`)
    assert.equal(row.task_book, tb, "指针逐字落盘")
  }
})

// ── T12 拒：指向不在册档 / 非文件（文案逐字 + 行不变） ──────────────────────
test("T12 错误：task_book 指向不在册档（含非文件形态）→ 拒（文案逐字 + 行不变）", () => {
  const { proj, id } = fixture()
  const tb = "docs/batches/ghost.md§2"
  assert.throws(
    () => ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: tb } }),
    { message: `ledgerUpdate：task_book 指向的档不存在：${tb}（解析 = ${resolve(proj, "docs/batches/ghost.md")}）` },
    "文案逐字（含函数名前缀 + 解析绝对路径）",
  )
  let row = rowOf(proj, id)
  assert.equal(row.status, "待设计", "拒后 status 不变")
  assert.equal(row.task_book, null, "拒后 task_book 不变")
  // 非文件形态（指向目录——存在但非档）⇒ 同拒
  assert.throws(
    () => ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: "docs/batches" } }),
    { message: `ledgerUpdate：task_book 指向的档不存在：docs/batches（解析 = ${resolve(proj, "docs/batches")}）` },
  )
  row = rowOf(proj, id)
  assert.equal(row.status, "待设计", "非文件形态同拒（行不变）")
  assert.equal(row.task_book, null)
})

// ── T13 拒：缺文件部分（`§2` / 全空白） ─────────────────────────────────────
test("T13 错误：task_book 缺文件部分（`§2` / 全空白）→ 拒（文案逐字 + 行不变）", () => {
  for (const tb of ["§2", "   "]) {
    const { proj, id } = fixture()
    assert.throws(
      () => ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: tb } }),
      { message: `ledgerUpdate：task_book 不可解析（缺文件部分）：${tb}` },
      `文案逐字（${JSON.stringify(tb)}）`,
    )
    const row = rowOf(proj, id)
    assert.equal(row.status, "待设计", "拒后 status 不变")
    assert.equal(row.task_book, null, "拒后 task_book 不变")
  }
})

// ── T14 射程 = 结果行状态 + 连带效果出路 ────────────────────────────────────
test("T14 边界：射程 = 结果行状态（待讨论 / 待设计带任意 task_book 不判）+ 脏指针在途行同拒、ledgerClose 迁出可达", () => {
  const a = fixture() // 夹具行已迁待设计（见 fixture 定义）；待讨论样本 = 下方 `newId` 新建行
  const b = fixture()
  const ghostTb = "docs/batches/ghost.md§9"
  const newId = ledgerAdd({ cwd: a.proj, row: { kind: "tech_todo", title: `射程用例 ${seq}` } })
  ledgerUpdate({ cwd: a.proj, id: newId, patch: { task_book: ghostTb } })
  assert.equal(rowOf(a.proj, newId).task_book, ghostTb, "待讨论行不判（射程外）")
  ledgerUpdate({ cwd: b.proj, id: b.id, patch: { task_book: ghostTb } })
  const brow = rowOf(b.proj, b.id)
  assert.equal(brow.status, "待设计")
  assert.equal(brow.task_book, ghostTb, "待设计行不判（射程外）")

  // 连带效果（§6.1 :105）：脏指针在途行的**任何**更新同拒（无按字段豁免）……
  const { proj, id } = fixture()
  ledgerUpdate({ cwd: proj, id, patch: { status: "在途", task_book: "docs/batches/here.md" } })
  // 原生 SQL 直写 = 刻意构造「写门前存量脏指针行」（该态经写命令已不可达——供连带效果断言）
  const db = openLedger(proj, { create: true })
  db.prepare("UPDATE items SET status = '待核销', task_book = ? WHERE id = ?").run(ghostTb, id)
  db.close()
  assert.throws(
    () => ledgerUpdate({ cwd: proj, id, patch: { title: "与指针无关的字段" } }),
    { message: `ledgerUpdate：task_book 指向的档不存在：${ghostTb}（解析 = ${resolve(proj, "docs/batches/ghost.md")}）` },
    "与指针无关的更新同拒",
  )
  assert.notEqual(rowOf(proj, id).title, "与指针无关的字段", "拒后行不变")
  // ……出路 = 迁出射程（ledgerClose 不设门）
  ledgerClose({ cwd: proj, id, status: "已废弃" })
  assert.equal(rowOf(proj, id).status, "已废弃", "出路可达（收口命令射程外）")
})

// ── O1 基准同源（2026-09-18 fix 轮）：容器根 / 子仓两 cwd 键同库 ⇒ 基准亦同 ──────────────────
test("O1 基准同源：容器根 / 子仓两 cwd 下，依子仓相对写的指针三形态均通过", () => {
  // 夹具：容器根（非仓）+ 唯一注册子仓（`.git` ∧ `PROJECT-MANIFEST.json`——`resolveProjectRoot` 判据）
  const container = join(tmp, `container${seq++}`)
  const sub = join(container, "sub")
  mkdirSync(join(sub, "docs", "batches"), { recursive: true })
  mkdirSync(join(sub, ".git"))
  writeFileSync(join(sub, "PROJECT-MANIFEST.json"), "{}\n")
  writeFileSync(join(sub, "docs", "batches", "here.md"), "# 在档\n")
  assert.equal(ledgerDbPath(container), ledgerDbPath(sub), "前提：两 cwd 键到同库（关联键同源）")

  const forms = ["docs/batches/here.md", "docs/batches/here.md§2", "docs/batches/here.md§1.5（括注）"]
  for (const [label, cwd] of [["容器根", container], ["子仓", sub]]) {
    for (const tb of forms) {
      const id = ledgerAdd({ cwd, row: { kind: "requirement", title: `O1 基准用例 ${seq}` } })
      ledgerUpdate({ cwd, id, patch: { status: "待设计" } }) // 门射程外（同 fixture 口径：在途须自待设计迁入）
      ledgerUpdate({ cwd, id, patch: { status: "在途", task_book: tb } }) // 改前：容器根 cwd 此行被误拒（先红）
      const row = rowOf(cwd, id)
      assert.equal(row.status, "在途", `${label} cwd 通过并落盘：${tb}`)
      assert.equal(row.task_book, tb, "指针逐字落盘")
    }
  }
})
