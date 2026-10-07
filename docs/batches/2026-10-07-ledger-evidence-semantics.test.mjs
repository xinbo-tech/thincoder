/**
 * 2026-10-07-ledger-evidence-semantics.test.mjs — 台账 evidence 语义修正批 · 批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根（thincoder/）：
 *   node --test docs/batches/2026-10-07-ledger-evidence-semantics.test.mjs
 *
 * 腿（设计档 LEDGER.md §13.9 用例表）：
 *   U-LT11 追加逐字 ∥ U-LT12 旧空直写 ∥ U-LT13 覆盖旗（false ≡ 缺省）∥ U-LT14 旗独传拒（负例）
 *   U-LT15 新值空白拒（负例）∥ U-LT16 close 同法（勾销 / 追认 / 撤回）∥ U-LT17 close 负例（判序）
 *   U-LT18 兼容零变 + 上批件 U-LT1–U-LT4 抽跑
 * 验收 A-LT7 ⟸ U-LT11–U-LT18（全腿合取——追加缺省 ∥ 覆盖 ∥ 两拒面 ∥ 追认门零变 ∥ 兼容）。
 * 夹具：台账 = `_setLedgerDirForTest` 临时目录 + PROJECT-MANIFEST.json 项目（同前批先例）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const toolsMod = await mod("thincoder-core/ledger-tools.mjs")
const cmdMod = await mod("thincoder-core/ledger-cmd.mjs")
const dbMod = await mod("thincoder-core/ledger-db.mjs")

const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `le-${tag}-`)); created.push(d); return d }
test.after(() => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) })

dbMod._setLedgerDirForTest(join(tmpBase("ledger-root"), "ledger"))
test.after(() => dbMod._resetLedgerDirForTest())

/** 项目夹具（PROJECT-MANIFEST.json 在场 ⇒ 归属解析确定；docs/batches/task.md = 写门指针靶）。 */
function mkProject(base, name) {
  const dir = join(base, name)
  mkdirSync(join(dir, "docs", "batches"), { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  writeFileSync(join(dir, "docs", "batches", "task.md"), "# 任务书夹具\n\n## §1 占位\n")
  return dir
}

const call = (args, cwd) => toolsMod.ledgerTool.execute(args, { cwd })
const rowOf = (cwd, id) => cmdMod.ledgerQuery({ cwd }).find((r) => r.id === id)

// ── U-LT11–U-LT15 · update 语义（追加 / 直写 / 覆盖 / 两拒面） ─────────────────
const legUp = (() => {
  const P = mkProject(tmpBase("up"), "proj-up")
  return { P, add: (row) => cmdMod.ledgerAdd({ cwd: P, row }) }
})()

test("U-LT11 · update 追加：旧值非空 ⇒ 逐字 `旧｜新`（零空格）", async () => {
  const id = legUp.add({ kind: "requirement", title: "追加腿", evidence: "【旧】甲。" })
  const out = await call({ action: "update", id, evidence: "【新】乙" }, legUp.P)
  assert.deepEqual(JSON.parse(out), { id })
  assert.equal(rowOf(legUp.P, id).evidence, "【旧】甲。｜【新】乙", "「｜」零空格直接相接（逐字）")
  await call({ action: "update", id, evidence: "【新】丙" }, legUp.P)
  assert.equal(rowOf(legUp.P, id).evidence, "【旧】甲。｜【新】乙｜【新】丙", "连追续拼（拼接 = 纯字面）")
})

test("U-LT12 · update 旧空直写：旧 = null ∥ 空串 ∥ 全空白 ⇒ 直写新值（零分隔符残留）", async () => {
  const ids = [
    ["N1", legUp.add({ kind: "requirement", title: "旧 null" })],
    ["N2", legUp.add({ kind: "requirement", title: "旧空串", evidence: "" })],
    ["N3", legUp.add({ kind: "requirement", title: "旧全空白", evidence: "   " })],
  ]
  for (const [note, id] of ids) {
    await call({ action: "update", id, evidence: note }, legUp.P)
    assert.equal(rowOf(legUp.P, id).evidence, note, `旧空 ⇒ 直写（${note}）`)
  }
  assert.ok(ids.every(([, id]) => !rowOf(legUp.P, id).evidence.includes("｜")), "零分隔符残留")
})

test("U-LT13 · update 覆盖：旗同传 = 整段替换；false ≡ 缺省；核内只认 `=== true`", async () => {
  const a = legUp.add({ kind: "requirement", title: "覆盖腿", evidence: "旧文甲段｜旧文乙段" })
  await call({ action: "update", id: a, evidence: "完整新文", evidenceReplace: true }, legUp.P)
  assert.equal(rowOf(legUp.P, a).evidence, "完整新文", "覆盖 ⇒ 旧文零保留")
  const b = legUp.add({ kind: "requirement", title: "false 腿", evidence: "旧B" })
  await call({ action: "update", id: b, evidence: "追加B", evidenceReplace: false }, legUp.P)
  assert.equal(rowOf(legUp.P, b).evidence, "旧B｜追加B", "false ≡ 缺省（追加）")
  const c = legUp.add({ kind: "requirement", title: "核心旗严判", evidence: "旧C" })
  cmdMod.ledgerUpdate({ cwd: legUp.P, id: c, patch: { evidence: "追加C", evidenceReplace: "true" }, executorSessionId: null })
  assert.equal(rowOf(legUp.P, c).evidence, "旧C｜追加C", "核内旗判只认 === true（字符串不触发覆盖）")
  // 守卫布尔分支（§13.9 声明面随正⑤——P4 第三型）：类型不符 ⇒ 拒逐字（不判则 "true" 串静默落追加模式）
  await assert.rejects(call({ action: "update", id: c, evidence: "X", evidenceReplace: "true" }, legUp.P),
    { message: 'ledger(update)：evidenceReplace 非法："true"（应为布尔）' })
  await assert.rejects(call({ action: "close", id: c, status: "已核销", evidence: "X", evidenceReplace: 1 }, legUp.P),
    { message: "ledger(close)：evidenceReplace 非法：1（应为布尔）" })
})

test("U-LT14 · 旗独传拒（负例）：evidence 缺 / null ⇒ 拒逐字、行不变", async () => {
  const id = legUp.add({ kind: "requirement", title: "旗独传", evidence: "原值不丢" })
  for (const args of [
    { action: "update", id, evidenceReplace: true },
    { action: "update", id, evidenceReplace: true, evidence: null },
  ]) {
    await assert.rejects(call(args, legUp.P),
      { message: "ledgerUpdate：evidenceReplace 须与 evidence 同传（缺新文）" })
  }
  assert.equal(rowOf(legUp.P, id).evidence, "原值不丢", "行不变")
})

test("U-LT15 · 新值空白拒（负例）：空串 / 全空白（追加 ∥ 覆盖两径）⇒ 拒逐字、行不变；判序对拍（先于写门）", async () => {
  const id = legUp.add({ kind: "requirement", title: "空白拒", evidence: "原值" })
  for (const args of [
    { action: "update", id, evidence: "" },
    { action: "update", id, evidence: "   " },
    { action: "update", id, evidence: "", evidenceReplace: true },
    { action: "update", id, evidence: "  \t ", evidenceReplace: true },
  ]) {
    await assert.rejects(call(args, legUp.P),
      { message: "ledgerUpdate：evidence 为空（非空字符串）" })
  }
  assert.equal(rowOf(legUp.P, id).evidence, "原值", "行不变")
  // 判序对拍（update 侧）：两拒面先于写门——在途行 + task_book 空串同传 ⇒ 得空白拒文案（非写门文案）
  const g = legUp.add({ kind: "tech_todo", title: "判序对拍", evidence: "途旧" })
  cmdMod.ledgerUpdate({ cwd: legUp.P, id: g, patch: { status: "待设计" }, executorSessionId: null })
  cmdMod.ledgerUpdate({ cwd: legUp.P, id: g, patch: { status: "在途", task_book: "docs/batches/task.md§1" }, executorSessionId: null })
  await assert.rejects(call({ action: "update", id: g, task_book: "", evidence: "   " }, legUp.P),
    { message: "ledgerUpdate：evidence 为空（非空字符串）" })
  const rg = rowOf(legUp.P, g)
  assert.deepEqual([rg.status, rg.evidence, rg.task_book], ["在途", "途旧", "docs/batches/task.md§1"], "行不变（拒于写门之前）")
})

// ── U-LT16–U-LT17 · close 语义（三径同携 / 两拒面判序） ────────────────────────
const legClose = (() => {
  const P = mkProject(tmpBase("close"), "proj-close")
  const add = (row) => cmdMod.ledgerAdd({ cwd: P, row })
  const to = (id, status, extra = {}) => cmdMod.ledgerUpdate({ cwd: P, id, patch: { status, ...extra }, executorSessionId: null })
  const c1 = add({ kind: "requirement", title: "勾销追加", evidence: "勾旧" })
  to(c1, "待设计"); to(c1, "在途", { task_book: "docs/batches/task.md§1" }); to(c1, "待核销")
  const c2 = add({ kind: "requirement", title: "追认直写" }); to(c2, "待设计")
  const c3 = add({ kind: "requirement", title: "追认覆盖", evidence: "追旧" }); to(c3, "待设计")
  const c4 = add({ kind: "requirement", title: "撤回追加", evidence: "撤旧" })
  const n1 = add({ kind: "requirement", title: "追认态负例" }); to(n1, "待设计")
  const n2 = add({ kind: "requirement", title: "勾销态负例" })
  to(n2, "待设计"); to(n2, "在途", { task_book: "docs/batches/task.md§1" }); to(n2, "待核销")
  return { P, c1, c2, c3, c4, n1, n2 }
})()

test("U-LT16 · close 同法：勾销 / 追认 / 撤回三径携 evidence（追加 / 直写 / 覆盖）", async () => {
  const iso = /^\d{4}-\d{2}-\d{2}T/
  const out1 = await call({ action: "close", id: legClose.c1, status: "已核销", evidence: "勾新" }, legClose.P)
  assert.deepEqual(JSON.parse(out1), { id: legClose.c1, status: "已核销" })
  const r1 = rowOf(legClose.P, legClose.c1)
  assert.equal(r1.evidence, "勾旧｜勾新", "勾销 + 追加逐字")
  assert.equal(r1.status, "已核销")
  assert.match(String(r1.closed_at), iso, "closed_at 落值（ISO）")
  await call({ action: "close", id: legClose.c2, status: "已核销", evidence: "追新" }, legClose.P)
  const r2 = rowOf(legClose.P, legClose.c2)
  assert.equal(r2.evidence, "追新", "追认 + 旧空直写（追认门过）")
  assert.equal(r2.status, "已核销")
  assert.match(String(r2.closed_at), iso, "closed_at 落值（ISO）")
  await call({ action: "close", id: legClose.c3, status: "已核销", evidence: "全文新", evidenceReplace: true }, legClose.P)
  const r3 = rowOf(legClose.P, legClose.c3)
  assert.equal(r3.evidence, "全文新", "覆盖旗 = 整段替换（旧文零保留）")
  assert.equal(r3.status, "已核销")
  assert.match(String(r3.closed_at), iso, "closed_at 落值（ISO）")
  cmdMod.ledgerClose({ cwd: legClose.P, id: legClose.c4, status: "已废弃", evidence: "撤注" })
  const r4 = rowOf(legClose.P, legClose.c4)
  assert.equal(r4.evidence, "撤旧｜撤注", "撤回径同携（追加）")
  assert.equal(r4.status, "已废弃")
  assert.match(String(r4.closed_at), iso, "closed_at 落值（ISO）")
})

test("U-LT17 · close 负例（追认 ∥ 勾销同判）：旗独传先于追认门；勾销空白新文案；追认空白（旧空）原文案", async () => {
  // ① 旗独传——判于值计算阶段（追认门之前）：追认态 ∥ 勾销态同判
  await assert.rejects(call({ action: "close", id: legClose.n1, status: "已核销", evidenceReplace: true }, legClose.P),
    { message: "ledgerClose：evidenceReplace 须与 evidence 同传（缺新文）" })
  await assert.rejects(call({ action: "close", id: legClose.n2, status: "已核销", evidenceReplace: true }, legClose.P),
    { message: "ledgerClose：evidenceReplace 须与 evidence 同传（缺新文）" })
  // ② 勾销 + 空白 ⇒ 新文案（拒面②）
  await assert.rejects(call({ action: "close", id: legClose.n2, status: "已核销", evidence: "   " }, legClose.P),
    { message: "ledgerClose：evidence 为空（非空字符串）" })
  // ③ 追认 + 空白（旧空）⇒ 原文案逐字（追认门先于拒面②——U-LT2 面零变）
  await assert.rejects(call({ action: "close", id: legClose.n1, status: "已核销", evidence: "   " }, legClose.P),
    { message: "ledgerClose：追认核销须带 evidence（现态 待设计）" })
  const r1 = rowOf(legClose.P, legClose.n1), r2 = rowOf(legClose.P, legClose.n2)
  assert.deepEqual([r1.status, r1.evidence, r2.status, r2.evidence],
    ["待设计", null, "待核销", null], "四拒面行不变")
})

// ── U-LT18 · 兼容零变 + 上批件抽跑 ───────────────────────────────────────────
test("U-LT18 · 兼容零变：不带 evidence ∥ 不带旗；add 零变；上批件 U-LT1–U-LT4 抽跑", async () => {
  const P = mkProject(tmpBase("compat"), "proj-compat")
  // update 不带 evidence：行值不变，其余字段照常
  const a = cmdMod.ledgerAdd({ cwd: P, row: { kind: "requirement", title: "兼容A", evidence: "行值A" } })
  cmdMod.ledgerUpdate({ cwd: P, id: a, patch: { title: "兼容A改" }, executorSessionId: null })
  assert.equal(rowOf(P, a).title, "兼容A改")
  assert.equal(rowOf(P, a).evidence, "行值A", "不带 evidence ⇒ 行值不变")
  // 旗 false 独传（无 evidence）≡ 缺省（非拒面）；不带 evidence 的工具路同零变
  await call({ action: "update", id: a, evidenceReplace: false }, P)
  assert.equal(rowOf(P, a).evidence, "行值A", "旗 false 独传 ≡ 缺省")
  // close 不带 evidence ⇒ 判行值（U-LT1 / U-LT4 面零变）
  const b = cmdMod.ledgerAdd({ cwd: P, row: { kind: "requirement", title: "兼容B", evidence: "既有行值" } })
  cmdMod.ledgerUpdate({ cwd: P, id: b, patch: { status: "待设计" }, executorSessionId: null })
  await call({ action: "close", id: b, status: "已核销" }, P)
  assert.equal(rowOf(P, b).evidence, "既有行值", "行值已备 ⇒ 放行且行值不变")
  const c = cmdMod.ledgerAdd({ cwd: P, row: { kind: "requirement", title: "兼容C" } })
  await assert.rejects(call({ action: "close", id: c, status: "已核销" }, P),
    { message: "ledgerClose：追认核销须带 evidence（现态 待讨论）" })
  // add 零变：核心 / 工具两路 × 无 / 有 evidence（新行直写无旧值）；旗不入 add 声明（P2 拒）
  assert.equal(rowOf(P, cmdMod.ledgerAdd({ cwd: P, row: { kind: "tech_todo", title: "核心无证" } })).evidence, null)
  assert.equal(rowOf(P, cmdMod.ledgerAdd({ cwd: P, row: { kind: "tech_todo", title: "核心直写", evidence: "直写" } })).evidence, "直写")
  const t1 = JSON.parse(await call({ action: "add", kind: "tech_todo", title: "工具无证" }, P))
  assert.equal(rowOf(P, t1.id).evidence, null)
  const t2 = JSON.parse(await call({ action: "add", kind: "tech_todo", title: "工具直写", evidence: "工具直写" }, P))
  assert.equal(rowOf(P, t2.id).evidence, "工具直写")
  await assert.rejects(call({ action: "add", kind: "tech_todo", title: "带旗", evidenceReplace: true }, P),
    { message: "ledger(add)：未知参数：evidenceReplace（可用参数 = cwd / kind / title / board / req_doc / task_book / evidence / trigger）" })
  // 上批件抽跑（独立进程整档跑——U-LT1–U-LT4 零破在案；stdout 捕获防缓冲，红则随断言面呈现；timeout 防挂死）
  try {
    execFileSync(process.execPath, ["--test", "docs/batches/2026-10-07-ledger-tool.test.mjs"], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], timeout: 120000 })
  } catch (e) {
    assert.fail(`上批件抽跑红：\n${String(e.stdout ?? "")}\n${String(e.stderr ?? "")}`)
  }
})
