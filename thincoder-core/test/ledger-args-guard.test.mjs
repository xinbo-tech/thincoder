/**
 * ledger-args-guard.test.mjs — 台账工具层参数守卫用例（批 ledger-add-guard · 台账 #472——设计档
 * docs/core/design/LEDGER.md §3.2 守卫 + §6.1 写门 + §8 AC-M2-15 / AC-M2-16 / 用例表 T37–T44）。
 * 读面守卫与 executor 空值口径（2026-09-28 守卫族微修批 · 台账 #473 / #474）：T43 读命令
 * 非法形 ⇒ 拒（文案逐字 · 零库动作）+ 合法形零回归 · T44 显式 `executor: null` ≡ 略去。
 *
 * 面：T37 三工具合法形全链（复杂文本逐字落盘 · 可空 `null` 通过 · `cwd` 缺省 / 显式两径）· T38
 * `ledger_add` 非法形逐条（P1–P6 全模板 + 未知键判序 + 显式 `null` 按缺失判）· T39 `ledger_update`
 * 非法形逐条 · T40 `ledger_close` 非法形逐条 · T41 边界（拒 ⇒ 零库动作；空串 / 全空白 `task_book`
 * 迁「在途」⇒ 写门拒）· T42 缺指针（`null`）形 ⇒ 写门「必填」拒 + 零 SQLite 原文（改前该形落 DDL
 * 咬合 CHECK 原文）。
 * 手法：临时 cwd + tmp 台账库（`_setLedgerDirForTest`——不读写真实用户库）；被测面 = 工具 `execute`
 * 真路径（`ctx` 供 cwd）；行经写命令构造（`ledgerAdd` → 迁待设计——写门射程外）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  ledgerAdd, ledgerAddTool, ledgerCloseTool, ledgerCount, ledgerCountTool, ledgerDbPath, ledgerQuery,
  ledgerQueryTool, ledgerUpdate, ledgerUpdateTool,
  _resetLedgerDirForTest, _setLedgerDirForTest,
} from "../ledger.mjs"

let tmp, seq = 0
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-args-"))
  _setLedgerDirForTest(join(tmp, "ledgerdir"))
})
afterEach(() => { _resetLedgerDirForTest(); rmSync(tmp, { recursive: true, force: true }) })

const ctxOf = (proj) => ({ agent: { cwd: proj } })
/** 临时项目（cwd）+ 自造在档（`docs/batches/here.md`——写门通过形）。 */
function newProj() {
  const proj = join(tmp, `proj${seq++}`)
  mkdirSync(join(proj, "docs", "batches"), { recursive: true })
  writeFileSync(join(proj, "docs", "batches", "here.md"), "# 在档\n")
  return proj
}
/** 夹具：临时项目 + 新行（入待讨论 → 迁待设计，写门射程外）→ {proj, id, ctx}。 */
function fixture() {
  const proj = newProj()
  const id = ledgerAdd({ cwd: proj, row: { kind: "requirement", title: `参数守卫用例 ${seq}` } })
  ledgerUpdate({ cwd: proj, id, patch: { status: "待设计" } })
  return { proj, id, ctx: ctxOf(proj) }
}
const rowsOf = (proj) => ledgerQuery({ cwd: proj })
const rowOf = (proj, id) => rowsOf(proj).find((r) => r.id === id)

/** 拒面断言：文案逐字 + 零 SQLite 原文（绑定 / 咬合类原文均不可达）。 */
async function expectReject(tool, args, ctx, message, label) {
  const err = await tool.execute(args, ctx).then(() => null, (e) => e)
  const shown = JSON.stringify(args) ?? String(args)
  assert.ok(err instanceof Error, `${label}：应拒（${shown}）`)
  assert.equal(err.message, message, `${label}：文案逐字（实得：${err.message}）`)
  assert.equal(/SQLite|CHECK|constraint|bound/i.test(err.message), false, `${label}：零 SQLite 原文（实得：${err.message}）`)
}

// ── T37 正常：三工具合法形全链（复杂文本 / 可空 null / cwd 两径）────────────────
test("T37 正常：ledger_add（复杂文本逐字 + 可空 null）→ update 迁在途过写门 → close 勾销", async () => {
  const proj = newProj()
  const ctx = ctxOf(proj)
  const complex = '修复 `ledger_add`（引号 "x" · 单引号 \'y\' · docs/core/design/LEDGER.md:143）'
  // cwd 缺省径（ctx 供值）+ 可空字段显式 null（≡ 略去）
  const added = JSON.parse(await ledgerAddTool.execute(
    { kind: "requirement", title: complex, board: null, req_doc: null, task_book: null, evidence: null, trigger: null },
    ctx,
  ))
  let row = rowOf(proj, added.id)
  assert.equal(row.title, complex, "复杂文本逐字落盘")
  assert.equal(row.board, null, "可空字段 null ⇒ 放行（≡ 略去）")
  assert.equal(row.trigger, null)
  assert.equal(row.status, "待讨论")

  // 显式 cwd 径（异 ctx 下仍落同一库）
  const viaCwd = JSON.parse(await ledgerAddTool.execute({ cwd: proj, kind: "tech_todo", title: `显式 cwd 径 ${seq}` }, ctxOf(tmp)))
  assert.equal(rowOf(proj, viaCwd.id).kind, "tech_todo", "显式 cwd 与 ctx 同库")

  // update 合法形：迁在途（带在档指针过写门）→ 待核销；close 勾销
  await ledgerUpdateTool.execute({ id: added.id, status: "待设计" }, ctx)
  await ledgerUpdateTool.execute({ id: added.id, status: "在途", task_book: "docs/batches/here.md§2" }, ctx)
  row = rowOf(proj, added.id)
  assert.equal(row.status, "在途", "迁在途通过写门")
  await ledgerUpdateTool.execute({ id: added.id, status: "待核销" }, ctx)
  assert.deepEqual(
    JSON.parse(await ledgerCloseTool.execute({ id: added.id, status: "已核销" }, ctx)),
    { id: added.id, status: "已核销" },
  )
  row = rowOf(proj, added.id)
  assert.equal(row.status, "已核销", "勾销落盘")
  assert.ok(row.closed_at, "closed_at 写入")
})

// ── T38 错误：ledger_add 非法形逐条（P1–P6 全模板 + 判序）────────────────────────
test("T38 错误：ledger_add 非法形逐条 ⇒ 文案逐字（P1–P6）+ 行集不变", async () => {
  const { proj, ctx } = fixture()
  const before = JSON.stringify(rowsOf(proj))
  const kindMissing = "ledger_add：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）"
  const kindEnum = "（取值 ∈ {requirement, tech_todo}）"
  const avail = "可用参数 = cwd / kind / title / board / req_doc / task_book / evidence / trigger"
  const longBoard = ["x".repeat(100)]
  const cases = [
    [undefined, kindMissing, "入参缺省 ⇒ 视作 {} ⇒ 缺参（P3）"],
    [null, kindMissing, "入参 null ⇒ 视作 {}（P3）"],
    [{}, kindMissing, "空对象 ⇒ 缺 kind（P3）"],
    [{ title: "t" }, kindMissing, "缺 kind（P3）"],
    [{ kind: null, title: "t" }, kindMissing, "kind 显式 null ⇒ 按缺失判（P3）"],
    [{ kind: "requirement" }, "ledger_add：title 缺失（必填；非空字符串）", "缺 title（P3）"],
    [{ kind: "requirement", title: "" }, "ledger_add：title 为空（必填；非空字符串）", "title 空串（P6）"],
    [{ kind: "requirement", title: " \t " }, "ledger_add：title 为空（必填；非空字符串）", "title 全空白（P6）"],
    [{ kind: "bogus", title: "t" }, `ledger_add：kind 非法："bogus"${kindEnum}`, "kind 枚举外值（P5——预览 = JSON.stringify ⇒ 串带引号）"],
    [{ kind: ["requirement"], title: "t" }, `ledger_add：kind 非法：["requirement"]${kindEnum}`, "kind 数组形（P5 错型值）"],
    [{ kind: "requirement", title: 7 }, "ledger_add：title 非法：7（应为字符串）", "title 非串（P4）"],
    [{ kind: "requirement", title: "t", board: 9 }, "ledger_add：board 非法：9（应为字符串）", "可空字段非串（P4）"],
    [{ kind: "requirement", title: "t", board: longBoard }, `ledger_add：board 非法：["${"x".repeat(78)}…（应为字符串）`, "预览超 80 字符 ⇒ 截断加 …"],
    [{ kind: "requirement", title: "t", trigger: "bogus" }, 'ledger_add：trigger 非法："bogus"（取值 ∈ {归批, 条件, 认账不排期}）', "trigger 非枚举（P5）"],
    [{ knd: "requirement", title: "t" }, `ledger_add：未知参数：knd（${avail}）`, "typo knd ⇒ 未知键先于缺参（判序）"],
    [[], "ledger_add：参数须为对象（收到 []）", "数组入参（P1）"],
    ["x", 'ledger_add：参数须为对象（收到 "x"）', "标量入参（P1）"],
    [{ kind: "requirement", title: "t", cwd: 3 }, "ledger_add：cwd 非法：3（应为字符串）", "cwd 非串（P4）"],
  ]
  for (const [args, msg, label] of cases) await expectReject(ledgerAddTool, args, ctx, msg, label)
  assert.equal(JSON.stringify(rowsOf(proj)), before, "拒 ⇒ 行集不变")
})

// ── T39 错误：ledger_update 非法形逐条 ──────────────────────────────────────────
test("T39 错误：ledger_update 非法形逐条 ⇒ 文案逐字 + 行不变", async () => {
  const { proj, id, ctx } = fixture()
  const before = JSON.stringify(rowsOf(proj))
  const six = "（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）"
  const avail = "可用参数 = cwd / id / status / title / board / req_doc / task_book / evidence / trigger / executor"
  const cases = [
    [{}, "ledger_update：id 缺失（必填）", "缺 id（P3）"],
    [{ id: null }, "ledger_update：id 缺失（必填）", "id 显式 null ⇒ 按缺失判（P3）"],
    [{ id: "1" }, 'ledger_update：id 非法："1"（应为数字）', "id 非数字（P4——不静默按数值命中）"],
    [{ id: 1, status: "bogus" }, `ledger_update：status 非法："bogus"${six}`, "status 非六态（P5）"],
    [{ id: 1, status: 3 }, `ledger_update：status 非法：3${six}`, "枚举字段错型值（P5）"],
    [{ id: 1, board: 5 }, "ledger_update：board 非法：5（应为字符串）", "patch 字段非串（P4）"],
    [{ id: 1, title: "" }, "ledger_update：title 为空（非空字符串）", "title 空串（P6 字段级）"],
    [{ id: 1, title: "   " }, "ledger_update：title 为空（非空字符串）", "title 全空白（P6 字段级）"],
    [{ id: 1, trigger: "x" }, 'ledger_update：trigger 非法："x"（取值 ∈ {归批, 条件, 认账不排期}）', "trigger 非枚举（P5）"],
    [{ id: 1, nope: 1 }, `ledger_update：未知参数：nope（${avail}）`, "未知键（P2）"],
  ]
  for (const [args, msg, label] of cases) await expectReject(ledgerUpdateTool, args, ctx, msg, label)
  assert.equal(rowOf(proj, id).status, "待设计", "行不变（status）")
  assert.equal(JSON.stringify(rowsOf(proj)), before, "行集不变")
})

// ── T40 错误：ledger_close 非法形逐条 ──────────────────────────────────────────
test("T40 错误：ledger_close 非法形逐条 ⇒ 文案逐字 + 行不变", async () => {
  const { proj, id, ctx } = fixture()
  const before = JSON.stringify(rowsOf(proj))
  const cases = [
    [{}, "ledger_close：id 缺失（必填）", "缺 id（P3）"],
    [{ id: "1", status: "已核销" }, 'ledger_close：id 非法："1"（应为数字）', "id 非数字（P4）"],
    [{ id: 1 }, "ledger_close：status 缺失（必填；取值 ∈ {已核销, 已废弃}）", "缺 status（P3）"],
    [{ id: 1, status: "在途" }, 'ledger_close：status 非法："在途"（取值 ∈ {已核销, 已废弃}）', "status 非目标集（P5——预览 = JSON.stringify）"],
    [{ id: 1, status: "已核销", who: "x" }, "ledger_close：未知参数：who（可用参数 = cwd / id / status）", "未知键（P2）"],
  ]
  for (const [args, msg, label] of cases) await expectReject(ledgerCloseTool, args, ctx, msg, label)
  assert.equal(rowOf(proj, id).status, "待设计", "行不变（未收口）")
  assert.equal(JSON.stringify(rowsOf(proj)), before, "行集不变")
})

// ── T41 边界：拒 ⇒ 零库动作 + 空串 / 全空白 task_book 迁在途 ⇒ 写门拒 ────────────
test("T41 边界：拒 ⇒ 零库动作（台账目录 / 库档不建）+ 空串 / 全空白 task_book 迁在途 ⇒ 写门拒", async () => {
  const bare = newProj()
  const ctx = ctxOf(bare)
  await expectReject(ledgerAddTool, {}, ctx, "ledger_add：kind 缺失（必填；取值 ∈ {requirement, tech_todo}）", "P3 拒")
  await expectReject(ledgerUpdateTool, { id: 1, title: "" }, ctx, "ledger_update：title 为空（非空字符串）", "P6 拒")
  await expectReject(ledgerCloseTool, [], ctx, "ledger_close：参数须为对象（收到 []）", "P1 拒")
  assert.equal(existsSync(ledgerDbPath(bare)), false, "库档不建")
  assert.equal(existsSync(join(tmp, "ledgerdir")), false, "台账目录不建")

  const { proj, id, ctx: ctx2 } = fixture()
  const before = JSON.stringify(rowsOf(proj))
  for (const tb of ["", "   "]) {
    await expectReject(
      ledgerUpdateTool, { id, status: "在途", task_book: tb }, ctx2,
      `ledgerUpdate：task_book 不可解析（缺文件部分）：${tb}`, `缺文件部分（${JSON.stringify(tb)}）`,
    )
    assert.equal(rowOf(proj, id).status, "待设计", "拒后行不变")
  }
  assert.equal(JSON.stringify(rowsOf(proj)), before, "行集不变")
})

// ── T42 错误：缺指针形（待设计行 task_book = null 迁在途）⇒ 写门「必填」拒 ────────
test("T42 错误：缺指针（task_book = null）迁「在途」⇒ 写门「必填」拒 + 行不变 + 零 SQLite 原文", async () => {
  const { proj, id, ctx } = fixture()
  const before = JSON.stringify(rowsOf(proj))
  assert.equal(rowOf(proj, id).task_book, null, "前提：待设计行 task_book = null（常态）")
  await expectReject(
    ledgerUpdateTool, { id, status: "在途" }, ctx,
    "ledgerUpdate：task_book 必填（在途 / 待核销 须携任务书指针）", "缺指针（改前落 DDL 咬合 CHECK 原文）",
  )
  const row = rowOf(proj, id)
  assert.equal(row.status, "待设计", "行不变（仍 待设计）")
  assert.equal(row.task_book, null, "task_book 不变")
  assert.equal(JSON.stringify(rowsOf(proj)), before, "行集不变")
})

// ── T43 错误：读命令守卫（ledger_query / ledger_count）⇒ 拒（文案逐字 · 零库动作）──────
test("T43 错误：读命令守卫——ledger_query 非法形逐条 + ledger_count 同判 ⇒ 拒；合法形零回归", async () => {
  const proj = newProj()
  const ctx = ctxOf(proj)
  const six = "（取值 ∈ {待讨论, 待设计, 在途, 待核销, 已核销, 已废弃}）"
  const qAvail = "可用参数 = cwd / status / kind / board"
  const cases = [
    [[], "ledger_query：参数须为对象（收到 []）", "入参数组（P1）"],
    ["x", 'ledger_query：参数须为对象（收到 "x"）', "入参标量（P1）"],
    [{ status: 123 }, `ledger_query：status 非法：123${six}`, "status 错型（P5——改前 = 静默空集）"],
    [{ status: [] }, `ledger_query：status 非法：[]${six}`, "status 数组形（P5——改前 = 绑定原文）"],
    [{ kind: "bogus" }, 'ledger_query：kind 非法："bogus"（取值 ∈ {requirement, tech_todo}）', "kind 枚举外值（改前 = 静默空集）"],
    [{ board: 9 }, "ledger_query：board 非法：9（应为字符串）", "board 非串（P4）"],
    [{ cwd: 3 }, "ledger_query：cwd 非法：3（应为字符串）", "cwd 非串（P4）"],
    [{ stat: "x" }, `ledger_query：未知参数：stat（${qAvail}）`, "未知键（P2）"],
  ]
  for (const [args, msg, label] of cases) await expectReject(ledgerQueryTool, args, ctx, msg, label)
  // ledger_count 同判（无必填字段 ⇒ 拒面 = P1 / P2 / P4）
  await expectReject(ledgerCountTool, [], ctx, "ledger_count：参数须为对象（收到 []）", "数组入参（P1）")
  await expectReject(ledgerCountTool, { cwd: 3 }, ctx, "ledger_count：cwd 非法：3（应为字符串）", "cwd 非串（P4）")
  await expectReject(ledgerCountTool, { status: "在途" }, ctx, "ledger_count：未知参数：status（可用参数 = cwd）", "未知键（P2）")
  assert.equal(existsSync(ledgerDbPath(proj)), false, "拒 ⇒ 零库动作（库档不建）")
  assert.equal(existsSync(join(tmp, "ledgerdir")), false, "拒 ⇒ 台账目录不建")
  // 合法形零回归：缺省 / 显式 `null` / 合法过滤命中（= 直调核函数等值）
  const { proj: p2, ctx: ctx2 } = fixture()
  const direct = (extra) => JSON.parse(JSON.stringify(ledgerQuery({ cwd: p2, ...extra })))
  assert.deepEqual(JSON.parse(await ledgerQueryTool.execute(undefined, ctx2)), direct({}), "缺省 ⇒ 全行（= 直调核函数等值）")
  assert.deepEqual(JSON.parse(await ledgerQueryTool.execute({ status: null, kind: null, board: null }, ctx2)), direct({}), "显式 `null` ≡ 略去")
  assert.deepEqual(JSON.parse(await ledgerQueryTool.execute({ status: "待设计" }, ctx2)), direct({ status: "待设计" }), "合法过滤命中（等值）")
  assert.deepEqual(JSON.parse(await ledgerQueryTool.execute({ cwd: p2, kind: "requirement" }, ctxOf(tmp))), direct({ kind: "requirement" }), "显式 cwd 径同库")
  assert.ok(ledgerCount({ cwd: p2 }) >= 1, "前提：夹具行在（未决计数 ≥ 1）")
  assert.equal(JSON.parse(await ledgerCountTool.execute({ cwd: p2 }, ctx2)).count, ledgerCount({ cwd: p2 }), "计数单源同值")
})

// ── T44 边界：executor 显式 `null` ≡ 略去（进「在途」取本会话 sessionId）─────────────
test("T44 边界：ledger_update 显式 executor: null ≡ 略去（进「在途」⇒ 本会话 sessionId）；显式串优先；非迁移零变", async () => {
  const { getSessionId } = await import("../session-slots.mjs")
  const a = fixture()
  await ledgerUpdateTool.execute({ id: a.id, status: "在途", task_book: "docs/batches/here.md§2", executor: null }, a.ctx)
  assert.equal(rowOf(a.proj, a.id).status, "在途", "迁在途通过写门")
  assert.equal(rowOf(a.proj, a.id).executor, getSessionId(), "显式 null ≡ 略去 ⇒ 行 executor = 本会话 sessionId")
  // 显式串仍优先（另一行同一入边）
  const b = fixture()
  await ledgerUpdateTool.execute({ id: b.id, status: "在途", task_book: "docs/batches/here.md§2", executor: "other-session" }, b.ctx)
  assert.equal(rowOf(b.proj, b.id).executor, "other-session", "显式串优先（≠ 本会话 sessionId）")
  // 非迁移纯字段更新：executor 读数零变（非迁移分支取行现值——sessionId 不入该支）
  const title = `非迁移纯字段更新 ${seq}`
  await ledgerUpdateTool.execute({ id: a.id, title }, a.ctx)
  const row = rowOf(a.proj, a.id)
  assert.equal(row.title, title, "纯字段更新落盘")
  assert.equal(row.executor, getSessionId(), "非迁移纯字段更新 executor 零变")
  assert.equal(rowOf(b.proj, b.id).executor, "other-session", "异行零扰")
})
