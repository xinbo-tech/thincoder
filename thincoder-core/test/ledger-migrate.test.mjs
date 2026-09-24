/**
 * ledger-migrate.test.mjs — 台账存量迁移与残档审计用例（`LEDGER.md` §2.2 · 批档 §2.4 T24–T32）。
 *
 * T24 dry-run 零写 + 报告面（含目标不可读输出定形）· T25 执行（12 数据列保全 + id 重发 + 回收 + 备份读回）· T26 幂等 ·
 * T27 fail-closed（wal 伴生 / 备份失败 / busy / 新建目标迁入失败——残留措辞）· T28 审计五态 + `--root` 归因 + 零删改
 * （含 stat 失败读取失败态）· T29 列集就绪判（旧 DDL 缺 executor ⇒ NULL 映射；缺余列 ⇒ 拒）· T30 目标缺档态 ·
 * T31 `--from` 补充源 / 键形守卫（路径形 / 非法键形 / 不存在键 ⇒ 拒）· T32 dry-run 写门风险旗（不拦截）。
 * 手法：临时夹具（`_setLedgerDirForTest` + `_setProjectRootForTest` 双缝）+ **夹具根外零写**断言
 * （备份 / 回收目录 = 台账库目录兄弟位 ⇒ 同派生于可覆盖基，§2.11#6）——零真实用户目录读写。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { DatabaseSync } from "node:sqlite"
import { dirname, join, sep } from "node:path"

import { _resetLedgerDirForTest, _setLedgerDirForTest, ledgerKey } from "../ledger-db.mjs"
import { _resetProjectRootForTest, _setProjectRootForTest } from "../manifest.mjs"
import {
  DATA_COLUMNS, auditLedgerDir, ledgerBackupRoot, ledgerTrashRoot, legacyKeyVariants,
  planLedgerMigration, runLedgerAudit, runLedgerMigrate,
} from "../ledger-migrate.mjs"

let tmp, proj, dir
const DDL = `CREATE TABLE items (
  id INTEGER PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, title TEXT NOT NULL,
  board TEXT, req_doc TEXT, task_book TEXT, evidence TEXT, trigger TEXT, executor TEXT,
  created_at TEXT, updated_at TEXT, closed_at TEXT)`
/** 旧 DDL 形态（缺 `executor`——老库迁移的正常态，KD-LN10）。 */
const LEGACY_DDL = DDL.replace(", executor TEXT", "")
/** 宽松 DDL（无 CHECK）：构造「源可读、迁入撞目标 CHECK」的失败形（T27 ④）。 */
const LAX_DDL = `CREATE TABLE items (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, title TEXT NOT NULL, board TEXT, req_doc TEXT, task_book TEXT, evidence TEXT, trigger TEXT, executor TEXT, created_at TEXT, updated_at TEXT, closed_at TEXT)`

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "ledger-migrate-"))
  proj = join(tmp, "proj")
  dir = join(tmp, "ledgerdir")
  mkdirSync(proj, { recursive: true })
  mkdirSync(dir, { recursive: true })
  // 项目根真判据的立档（`--root` 归因子用例需真解析面）；其余用例走 `_setProjectRootForTest` 缝。
  writeFileSync(join(proj, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }))
  _setLedgerDirForTest(dir)
  _setProjectRootForTest(proj)
})
afterEach(() => { _resetLedgerDirForTest(); _resetProjectRootForTest(); rmSync(tmp, { recursive: true, force: true }) })

const targetKey = () => ledgerKey(proj)
const targetFile = () => join(dir, `${targetKey()}.db`)
const sourceKey = () => legacyKeyVariants(proj)[0]
const sourceFile = () => join(dir, `${sourceKey()}.db`)
const row = (kind, status, title, extra = {}) => ({ kind, status, title, created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", ...extra })

/** 建库（列表由 DDL 实查得出——旧 DDL / 缺列形态均照实插）。 */
function mkdb(file, rows, { ddl = DDL } = {}) {
  const db = new DatabaseSync(file)
  db.exec(ddl)
  const present = new Set(db.prepare("SELECT name FROM pragma_table_info('items')").all().map((r) => r.name))
  const cols = DATA_COLUMNS.filter((c) => present.has(c))
  const ins = db.prepare(`INSERT INTO items (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`)
  for (const r of rows) ins.run(...cols.map((c) => r[c] ?? null))
  db.close()
}
const readAll = (file) => { const db = new DatabaseSync(file, { readOnly: true }); try { return db.prepare(`SELECT id, ${DATA_COLUMNS.join(", ")} FROM items ORDER BY id`).all() } finally { db.close() } }
const valuesOf = (r) => DATA_COLUMNS.map((c) => r[c] ?? null)
const snapshot = (d) => readdirSync(d).sort().map((n) => `${n}:${statSync(join(d, n)).size}:${statSync(join(d, n)).mtimeMs}`).join("|")
const runMigrate = (args, opts = {}) => { const outs = []; const errs = []; const code = runLedgerMigrate(args, { cwd: proj, out: (s) => outs.push(s), err: (s) => errs.push(s), ...opts }); return { code, text: outs.join("\n"), errText: errs.join("\n") } }

/** 夹具根外零写（§2.11#6）：备份 / 回收根 = `ledgerDirPath()` 的**兄弟位**（同派生于可覆盖基）。 */
function assertDerivedInsideFixture() {
  for (const root of [ledgerBackupRoot(), ledgerTrashRoot()]) {
    assert.equal(dirname(root), tmp, `派生根 = 台账库目录兄弟位：${root}`)
    assert.ok(root.startsWith(tmp + sep), `夹具根内：${root}`)
  }
}

// ── T24 dry-run ────────────────────────────────────────────────────────────
test("T24 dry-run：报告含目标 / 源 / 行数 / 计划 / 备份路径；零写 + 夹具根外零写", () => {
  mkdb(targetFile(), [row("requirement", "待讨论", "目标既有")])
  mkdb(sourceFile(), [row("requirement", "待讨论", "源一"), row("tech_todo", "已核销", "源二", { closed_at: "2026-09-10T00:00:00Z" })])
  const before = snapshot(dir)
  const { code, text } = runMigrate(["migrate", "--dry-run"])
  assert.equal(code, 0)
  assert.match(text, new RegExp(`Target: ${targetKey()}`), "目标键在册")
  assert.ok(text.includes("rows 1"), "目标行数")
  assert.ok(text.includes(sourceKey()), "变体源键在册")
  assert.ok(text.includes("rows 2"), "逐源行数")
  assert.match(text, /migrate 2 rows → target \(post-migration count = 3\)/, "计划迁入数 + 迁移后计数")
  assert.match(text, /Plan: backup → .*ledger-backup.*migrate-report|Plan: backup → .*ledger-backup/, "备份路径在册")
  assert.deepEqual(snapshot(dir), before, "零写（文件集合 / 大小 / mtime 三不变）")
  assert.ok(!existsSync(join(tmp, "ledger-backup")) && !existsSync(join(tmp, "ledger-trash")), "dry-run 不建备份 / 回收目录")
  assertDerivedInsideFixture()
  // ③ 目标不可读（非 sqlite 档）⇒ 输出定形：显式「不可读」、零 `undefined`（迁移后计数以 ? 占位）
  rmSync(targetFile()); writeFileSync(targetFile(), "not a sqlite db")
  const bad = runMigrate(["migrate", "--dry-run"])
  assert.equal(bad.code, 0)
  assert.match(bad.text, /目标不可读/, "显式不可读（无 rows undefined）")
  assert.ok(!bad.text.includes("undefined"), "输出定形：全输出零 undefined")
  assert.match(bad.text, /post-migration count = \?/, "不可读 ⇒ 迁移后计数不可知")
})

// ── T25 执行 ───────────────────────────────────────────────────────────────
test("T25 执行：12 数据列逐条保全 + id 重发（映射入报告）+ 目标既有行零动 + 源回收 + 备份读回同计数", () => {
  const src = [
    row("requirement", "待讨论", "源一", { board: "B1", req_doc: "docs/req.md", trigger: "归批", executor: "123-1", board_note: undefined }),
    row("tech_todo", "已核销", "源二", { closed_at: "2026-09-10T00:00:00Z", evidence: "src/a.mjs:1" }),
    row("tech_todo", "已废弃", "源三", { closed_at: "2026-09-11T00:00:00Z" }),
  ]
  mkdb(sourceFile(), src)
  mkdb(targetFile(), [row("requirement", "待设计", "目标既有")])
  const { code, text } = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(code, 0)
  assert.match(text, /migrated 3 row\(s\)/, "汇总结论")
  const after = readAll(targetFile())
  assert.deepEqual(after.map((r) => r.id), [1, 2, 3, 4], "id 重发（目标既有 1 + 源 2..4 连续）")
  assert.equal(after[0].title, "目标既有", "目标既有行零动")
  for (let i = 0; i < src.length; i++) assert.deepEqual(valuesOf(after[i + 1]), DATA_COLUMNS.map((c) => src[i][c] ?? null), `12 数据列逐字保全：源 #${i + 1}`)
  // 源回收（不删）→ ledger-trash/<批次>/
  assert.ok(!existsSync(sourceFile()), "源库移出原目录")
  const trash = join(ledgerTrashRoot(), "20260925-050000")
  assert.ok(existsSync(join(trash, `${sourceKey()}.db`)), "源库进回收目录（不 unlink）")
  // 备份面：两档同计数 + 报告（id 映射 / 计数）
  const backup = join(ledgerBackupRoot(), "20260925-050000")
  assert.equal(readAll(join(backup, `${targetKey()}.db`)).length, 1, "备份：目标副本同计数")
  assert.equal(readAll(join(backup, `${sourceKey()}.db`)).length, 3, "备份：源副本同计数")
  const report = JSON.parse(readFileSync(join(backup, "migrate-report.json"), "utf8"))
  assert.deepEqual(report.sources[0].idMap, { "1": 2, "2": 3, "3": 4 }, "id 映射入报告")
  assert.equal(report.rowsBefore, 1)
  assert.equal(report.rowsAfter, 4)
  assert.deepEqual(report.recycled, [sourceKey()], "回收记录")
  assertDerivedInsideFixture()
})

// ── T26 幂等 ───────────────────────────────────────────────────────────────
test("T26 幂等：同夹具连跑两次 ⇒ 第二次 0 新增（无待迁源）；总行数 = 首跑后计数", () => {
  mkdb(sourceFile(), [row("requirement", "待讨论", "源一"), row("requirement", "待讨论", "源二")])
  mkdb(targetFile(), [row("requirement", "待讨论", "目标既有")])
  assert.equal(runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 0, 0) }).code, 0)
  assert.equal(readAll(targetFile()).length, 3, "首跑 3 行")
  const second = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 1, 0) })
  assert.equal(second.code, 0)
  assert.match(second.text, /no sources to migrate（无待迁源/, "源已回收 ⇒ 报无待迁源（exit 0）")
  assert.equal(readAll(targetFile()).length, 3, "重跑零新增（无重复行）")
})

// ── T27 fail-closed ────────────────────────────────────────────────────────
test("T27 fail-closed：备份失败 / `-wal` 伴生档 / busy ⇒ 拒跑（目标零变、源零动）", () => {
  mkdb(sourceFile(), [row("requirement", "待讨论", "源一")])
  mkdb(targetFile(), [row("requirement", "待讨论", "目标既有")])
  // ① 备份失败（备份根位被同名**文件**占位 ⇒ mkdir 失败）——迁入零启动
  writeFileSync(join(tmp, "ledger-backup"), "占位")
  const backupFail = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(backupFail.code, 1)
  assert.match(backupFail.errText, /备份失败/, "备份失败 ⇒ 拒跑")
  assert.equal(readAll(targetFile()).length, 1, "目标零变")
  rmSync(join(tmp, "ledger-backup"))
  // ② `-wal` 伴生档（单档回收会丢未 checkpoint 数据）
  writeFileSync(`${sourceFile()}-wal`, "")
  const wal = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 1, 0) })
  assert.equal(wal.code, 1)
  assert.match(wal.errText, /-wal \/ -shm 伴生档/, "文案点名伴生档（fail-closed）")
  assert.equal(readAll(targetFile()).length, 1, "目标零变")
  assert.ok(existsSync(sourceFile()), "源零动（原位置）")
  rmSync(`${sourceFile()}-wal`)
  // ③ busy（第二连接持写锁）
  const lock = new DatabaseSync(targetFile())
  lock.exec("BEGIN IMMEDIATE")
  const busy = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 2, 0), busyMs: 60 })
  lock.exec("ROLLBACK")
  lock.close()
  assert.equal(busy.code, 1)
  assert.match(busy.errText, /另一实例占用/, "忙 ⇒ 明示拒跑")
  assert.match(busy.errText, /目标零变、源零动/, "既有目标 ⇒ 措辞零变（残留句只属新建场景）")
  assert.equal(readAll(targetFile()).length, 1, "目标零变（三例合计）")
  assert.ok(existsSync(sourceFile()), "源库仍在（零回收）")
  assert.ok(!existsSync(join(ledgerTrashRoot(), "20260925-050200")), "零回收批")
  // ④ 新建目标 + 迁入失败（宽松 DDL 源行撞目标 CHECK）⇒ ROLLBACK；本次新建 0 行空库档残留如实写明
  rmSync(targetFile()); mkdb(join(dir, "7777777788888888.db"), [row("requirement", "非法状态", "脏枚举行")], { ddl: LAX_DDL })
  const residue = runMigrate(["migrate", "--confirm", "--from", "7777777788888888"], { now: new Date(2026, 8, 25, 5, 3, 0) })
  assert.equal(residue.code, 1)
  assert.match(residue.errText, /已 ROLLBACK/, "失败 ⇒ ROLLBACK")
  assert.ok(residue.errText.includes("本次新建") && !residue.errText.includes("目标零变"), "措辞收正：新建档残留写明（不再称目标零变）")
  assert.ok(existsSync(targetFile()) && readAll(targetFile()).length === 0, "残留 = 新建 0 行目标档（无既有数据）")
})

// ── T28 审计 ───────────────────────────────────────────────────────────────
test("T28 审计：五态定性（目标 / 变体源 / 空库 / 不可归因有行 / 坏档）+ stat 失败读取失败态 + `--root` 归因 + 全目录零删改", (t) => {
  mkdb(targetFile(), [row("requirement", "待讨论", "目标行")])
  mkdb(sourceFile(), [row("tech_todo", "待设计", "变体源行")])
  mkdb(join(dir, "aaaaaaaabbbbbbbb.db"), [])
  mkdb(join(dir, "ccccccccdddddddd.db"), [row("requirement", "已核销", "他项目行")])
  writeFileSync(join(dir, "eeeeeeeeffffffff.db"), "not a sqlite db")
  const before = snapshot(dir)
  const audit = auditLedgerDir({ cwd: proj })
  const kindOf = (key) => audit.entries.find((e) => e.key === key)?.kind
  assert.equal(kindOf(targetKey()), "目标库")
  assert.equal(kindOf(sourceKey()), "变体源")
  assert.equal(kindOf("aaaaaaaabbbbbbbb"), "空库")
  assert.equal(kindOf("ccccccccdddddddd"), "不可归因（有行）")
  assert.equal(kindOf("eeeeeeeeffffffff"), "不可读（坏档）")
  assert.equal(audit.entries.find((e) => e.key === "ccccccccdddddddd").rows, 1, "行数在册")
  // --root 归因（候选根集合）：追加根 ⇒ 其变体键命中（真解析面——暂撤项目根覆盖缝）
  const proj2 = join(tmp, "proj2")
  mkdirSync(proj2, { recursive: true })
  writeFileSync(join(proj2, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }))
  const v2 = legacyKeyVariants(proj2)[0]
  mkdb(join(dir, `${v2}.db`), [row("requirement", "待讨论", "第二候选根行")])
  const beforeAudit = snapshot(dir)
  _resetProjectRootForTest()
  assert.equal(auditLedgerDir({ cwd: proj }).entries.find((e) => e.key === v2).kind, "不可归因（有行）", "反证：不带 --root 时不可归因")
  assert.equal(auditLedgerDir({ cwd: proj, roots: [proj2] }).entries.find((e) => e.key === v2).kind, "变体源", "--root 追加候选根 ⇒ 归因命中")
  const { code, text } = (() => { const outs = []; const c = runLedgerAudit(["audit", "--root", proj2], { cwd: proj, out: (s) => outs.push(s) }); return { code: c, text: outs.join("\n") } })()
  _setProjectRootForTest(proj)
  assert.equal(code, 0)
  assert.match(text, /Ledger audit — read-only/, "只读声明")
  assert.match(text, /Summary: 目标库 1 · 变体源 2/, "汇总计数（含 --root 归因面）")
  assert.deepEqual(snapshot(dir), beforeAudit, "全目录零删改（文件集合 / 大小 / mtime 三不变）")
  assert.ok(readdirSync(dir).includes("ccccccccdddddddd.db"), "不可归因库原位")
  assert.ok(readdirSync(dir).includes("eeeeeeeeffffffff.db"), "坏档原位（零动作）")
  // ② 并发删除形（悬空符号链接 ⇒ statSync ENOENT）：按档报「不可归因（读取失败）」，整命令不抛（收正）
  try { symlinkSync(join(tmp, "ghost-target"), join(dir, "ffffffff00000000.db"), "file") } catch { return t.skip("本机符号链接不可用（EPERM）——该形不可模拟") }
  const ghost = auditLedgerDir({ cwd: proj }).entries.find((e) => e.key === "ffffffff00000000")
  assert.equal(ghost?.kind, "不可归因（读取失败）", "读取失败态定性（收正前整命令必抛）")
  assert.equal(auditLedgerDir({ cwd: proj }).entries.find((e) => e.key === "eeeeeeeeffffffff")?.kind, "不可读（坏档）", "坏档态不受影响")
  const outs2 = []; runLedgerAudit(["audit"], { cwd: proj, out: (s) => outs2.push(s) })
  assert.match(outs2.join("\n"), /不可归因（读取失败） 1/, "Summary 收敛该态（计数与枚举同列）")
  assert.ok(!outs2.join("\n").includes("undefined"), "输出零 undefined（size / mtime 以 — 占位）")
})

// ── T29 列集就绪判 ─────────────────────────────────────────────────────────
test("T29 列集就绪判：旧 DDL（缺 executor）⇒ NULL 映射照迁（其余 11 列逐字）；缺其余数据列 ⇒ 拒（零写）", () => {
  mkdb(join(dir, "1111111122222222.db"), [row("requirement", "待讨论", "旧 DDL 源行", { board: "B9", evidence: "src/a.mjs:1", executor: "不应落列" })], { ddl: LEGACY_DDL })
  const legacyRow = (() => { const db = new DatabaseSync(join(dir, "1111111122222222.db"), { readOnly: true }); try { return db.prepare("SELECT * FROM items").get() } finally { db.close() } })()
  const { code } = runMigrate(["migrate", "--confirm", "--from", "1111111122222222"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(code, 0, "旧 DDL 源照迁（非拒——KD-LN10）")
  const migrated = readAll(targetFile())[0]
  assert.equal(migrated.executor, null, "缺列按 NULL 映射")
  assert.deepEqual(valuesOf(migrated), DATA_COLUMNS.map((c) => (c === "executor" ? null : legacyRow[c] ?? null)), "其余 11 列逐字保全")
  // 反例：缺 `evidence`（非 executor）⇒ 拒（列集不可归因）+ 目标零变
  mkdb(join(dir, "5555555566666666.db"), [row("requirement", "待讨论", "缺列源行")], { ddl: DDL.replace(", evidence TEXT", "") })
  const rowsBefore = readAll(targetFile()).length
  const refused = runMigrate(["migrate", "--confirm", "--from", "5555555566666666"], { now: new Date(2026, 8, 25, 5, 1, 0) })
  assert.equal(refused.code, 1)
  assert.match(refused.errText, /缺数据列（列集不可归因）：evidence/, "点名缺列")
  assert.equal(readAll(targetFile()).length, rowsBefore, "目标零变")
  assert.ok(existsSync(join(dir, "5555555566666666.db")), "源零动")
})

// ── T30 目标缺档态 ─────────────────────────────────────────────────────────
test("T30 目标缺档态：dry-run 标「拟建（0 行）」；confirm 建库建表 + 计数 = 源行数 + 备份无目标档", () => {
  mkdb(sourceFile(), [row("requirement", "待讨论", "源一"), row("requirement", "待讨论", "源二")])
  assert.ok(!existsSync(targetFile()), "前提：目标键库不存在")
  const dry = runMigrate(["migrate", "--dry-run"])
  assert.equal(dry.code, 0)
  assert.match(dry.text, /拟建（0 行）/, "dry-run 标拟建")
  const { code, text } = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(code, 0)
  assert.match(text, /库为本次新建/, "汇总标注新建")
  assert.equal(readAll(targetFile()).length, 2, "迁后计数 = 源行数")
  const backup = join(ledgerBackupRoot(), "20260925-050000")
  assert.ok(!existsSync(join(backup, `${targetKey()}.db`)), "目标无可备档（备份面标注）")
  const report = JSON.parse(readFileSync(join(backup, "migrate-report.json"), "utf8"))
  assert.equal(report.targetCreated, true)
})

// ── T31 `--from` 补充源 ────────────────────────────────────────────────────
test("T31 `--from <key>`：键形守卫（路径形 / 非法键形 / 不存在键 ⇒ 拒）· 指名键并入候选（去重）照六步迁入", () => {
  mkdb(sourceFile(), [row("requirement", "待讨论", "变体源行")])
  mkdb(join(dir, "3333333344444444.db"), [row("requirement", "待讨论", "指名源行")])
  const before = snapshot(dir)
  const shape1 = runMigrate(["migrate", "--dry-run", "--from", join("..", "..", "outside")])
  assert.equal(shape1.code, 1); assert.match(shape1.errText, /取值非键形/, "① 路径形（越目录形）⇒ 拒（不 join 出台账目录外档）")
  const shape2 = runMigrate(["migrate", "--dry-run", "--from", "zzzzzzzzzzzzzzzz"])
  assert.equal(shape2.code, 1); assert.match(shape2.errText, /取值非键形/, "② 非法键形（非十六进制）⇒ 拒")
  const missing = runMigrate(["migrate", "--dry-run", "--from", "9999999988888888"])
  assert.equal(missing.code, 1); assert.match(missing.errText, /指名的源键无对应库/, "③ 键形合法但无库 ⇒ 拒跑（不静默跳过）")
  assert.deepEqual(snapshot(dir), before, "三拒态皆零写")
  const plan = planLedgerMigration(proj, { fromKeys: ["3333333344444444", sourceKey()] })
  assert.deepEqual(plan.sources.map((s) => s.key).sort(), [sourceKey(), "3333333344444444"].sort(), "并集去重（重复指名不重复计）")
  const { code } = runMigrate(["migrate", "--confirm", "--from", "3333333344444444"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(code, 0)
  assert.equal(readAll(targetFile()).length, 2, "两源（枚举 1 + 指名 1）皆迁入")
})

// ── T32 dry-run 写门风险旗 ─────────────────────────────────────────────────
test("T32 dry-run 写门风险旗：在途 / 待核销 + task_book 不可解析 ⇒ 出旗（不拦截）· 零写照旧 · confirm 照迁", () => {
  mkdb(sourceFile(), [row("requirement", "待核销", "脏指针行", { task_book: "docs/batches/ghost.md§2" })])
  mkdb(targetFile(), [row("requirement", "待讨论", "目标既有")])
  const before = snapshot(dir)
  const dry = runMigrate(["migrate", "--dry-run"])
  assert.equal(dry.code, 0)
  assert.match(dry.text, /Write-gate risk flags: 1（不拦截/, "风险旗在场且声明不拦截")
  assert.match(dry.text, /task_book 指向的档不存在：docs\/batches\/ghost\.md§2/, "旗面点名不可解析指针")
  assert.deepEqual(snapshot(dir), before, "dry-run 零写")
  const { code } = runMigrate(["migrate", "--confirm"], { now: new Date(2026, 8, 25, 5, 0, 0) })
  assert.equal(code, 0, "风险旗不拦截——照迁")
  assert.equal(readAll(targetFile()).length, 2)
})
