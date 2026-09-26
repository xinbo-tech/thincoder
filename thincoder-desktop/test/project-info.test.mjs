/**
 * project-info.test.mjs — 项目级信息两通道用例（用例号 U111–U113 · `docs/desktop/design/PROJECT.md` §7
 * T-DSK11 + `IPC.md` §1 键面）：`ledger:read` 未开项目拒面 + 三计数/阈值读数（**行集不下发**）+
 * 无台账 = 零读数（合法，非错误）· `batch:status` 相位读数 + `missing`/`invalid` 两分不合并 +
 * 项目一份（载荷无 cwd ⇒ 回落主进程内存态；载荷 `key` 零效果）+ 消费面动态 import 机检（W8 契约②）。
 * 纪律：沙箱逐用例 `mkdtemp`；台账库目录缝 `_setLedgerDirForTest`、会话目录缝 `_setSessionsDirForTest`
 * （测试不碰真实用户目录）；台账夹具经核 `openLedger` 真建表 + 真行（零 DDL 副本）。**首例依赖进程内存态
 * 未打开**（`currentCwd() === null` 是模块状态，node --test 单档内顶层用例按声明序串行——首例先跑）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { _resetSessionsDirForTest, _setSessionsDirForTest } from "@thincoder/core/session-slots.mjs"
import { currentCwd, openProject } from "../src/main/projects.mjs"
import { batchStatus, ledgerRead } from "../src/main/project-info.mjs"

/** 档内相对路径 ⇒ 绝对路径（源面机检用；同 settings 档式）。 */
const here = (p) => fileURLToPath(new URL(p, import.meta.url))

/** 沙箱：sessions 根 / 台账库根指向 tmp；返回 { dir, root }（root = 真项目目录）。 */
function sandbox(t, tag = "proj") {
  const dir = mkdtempSync(join(tmpdir(), "desktop-info-"))
  const root = join(dir, tag)
  mkdirSync(root, { recursive: true })
  _setSessionsDirForTest(dir)
  t.after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
  return { dir, root }
}

/** 台账夹具：核真建表 + 行集（iso = 距今 N 天的 ISO 时间戳——行龄源单源）。 */
async function ledger(t, dir, root, rows) {
  const { _resetLedgerDirForTest, _setLedgerDirForTest, openLedger } = await import("@thincoder/core/ledger-db.mjs")
  _setLedgerDirForTest(join(dir, "ledger"))
  t.after(() => _resetLedgerDirForTest())
  const iso = (days) => new Date(Date.now() - days * 86400000).toISOString()
  const db = openLedger(root, { create: true })
  const ins = db.prepare("INSERT INTO items (kind,status,title,board,task_book,trigger,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)")
  for (const r of rows) ins.run(r.kind, r.status, r.title, r.board ?? null, r.taskBook ?? null, r.trigger ?? null, iso(r.days ?? 1), iso(r.days ?? 1))
  db.close()
}

// ─── U111 未开项目两式（cwd 缺省无源）───────────────────────────────

test("U111: 未开项目 —— ledger:read = no-project / batch:status = missing", async () => {
  assert.equal(currentCwd(), null, "首例前提：主进程内存态未打开任何项目")
  assert.deepEqual(await ledgerRead(), { ok: false, reason: "no-project" }, "无 cwd ⇒ 未开项目拒面（载荷 / 内存态皆无源）")
  assert.deepEqual(await ledgerRead({}), { ok: false, reason: "no-project" }, "空载荷同判")
  assert.deepEqual(batchStatus({}), { ok: false, reason: "missing" }, "无 cwd ⇒ 整档缺读数（非抛）")
})

// ─── U112 ledger:read（三计数 / 阈值 / 行集不下发 / 无台账合法零读数）────

test("U112: ledger:read —— 三计数 + 阈值两臂 + 行集不下发 + 无台账零读数 + key 零效果 + 源面动态 import", async (t) => {
  const { dir, root } = sandbox(t)
  await ledger(t, dir, root, [
    { kind: "requirement", status: "待设计", title: "**A** 需求一", board: "BOARD-X" },
    { kind: "requirement", status: "在途", title: "**B** 需求二", board: "BOARD-X", taskBook: "docs/batches/b.md" },
    { kind: "tech_todo", status: "待讨论", title: "**C** 老技术债", days: 40 },
    { kind: "tech_todo", status: "待设计", title: "**E** 带触发", days: 40, trigger: "归批" },
    { kind: "tech_todo", status: "已核销", title: "**D** 已结", days: 40 },
  ])
  const r = await ledgerRead({ cwd: root })
  assert.deepEqual(Object.keys(r).sort(), ["counts", "ok", "thresholdReached"], "回执键闭集（**无 rows**——行集不下发）")
  assert.deepEqual(Object.keys(r.counts).sort(), ["aged", "pool", "tech"], "计数三键")
  assert.deepEqual(r.counts, { pool: 2, tech: 2, aged: 1 }, "池 2（未决需求）· 技 2（未决技术债）· 老化 1（无 trigger ∧ >30 天）")
  assert.equal(r.thresholdReached, true, "阈值：池 2 < 3 但同板块未决 ≥ 2 ⇒ 达标（板块臂）")

  const { dir: dir2, root: root2 } = sandbox(t, "pool3")
  await ledger(t, dir2, root2, [
    { kind: "requirement", status: "待讨论", title: "**F** 一" },
    { kind: "requirement", status: "待讨论", title: "**G** 二" },
    { kind: "requirement", status: "待设计", title: "**H** 三" },
  ])
  const r2 = await ledgerRead({ cwd: root2 })
  assert.deepEqual(r2.counts, { pool: 3, tech: 0, aged: 0 }, "零板板块臂：三需求无 board")
  assert.equal(r2.thresholdReached, true, "阈值：池 ≥ 3 ⇒ 达标（池臂）")

  const { dir: dir3, root: root3 } = sandbox(t, "quiet")
  await ledger(t, dir3, root3, [{ kind: "requirement", status: "待讨论", title: "**I** 一" }])
  const r3 = await ledgerRead({ cwd: root3 })
  assert.deepEqual(r3.counts, { pool: 1, tech: 0, aged: 0 })
  assert.equal(r3.thresholdReached, false, "阈值：池 1 < 3 且无板 ≥ 2 ⇒ 未达标（负臂）")

  const { root: empty } = sandbox(t, "nodb")
  assert.deepEqual(
    await ledgerRead({ cwd: empty }),
    { ok: true, counts: { pool: 0, tech: 0, aged: 0 }, thresholdReached: false },
    "有 cwd 而无台账库 ⇒ 零读数为合法读数（核 openLedger 回 null，非错误面）",
  )

  assert.equal((await openProject({ path: root })).cwd, root, "打开项目 ⇒ 内存态落定")
  assert.deepEqual(await ledgerRead(), await ledgerRead({ cwd: root }), "载荷无 cwd ⇒ 回落主进程内存态（项目一份，不随会话）")
  assert.deepEqual(await ledgerRead({ key: "3", cwd: root }), await ledgerRead({ cwd: root }), "载荷 `key` 零效果（项目一份，不随会话走）")

  const src = readFileSync(here("../src/main/project-info.mjs"), "utf8")
  assert.match(src, /await import\("@thincoder\/core\/ledger\.mjs"\)/, "台账消费 = 动态 import（W8 契约②：静态链带 `node:sqlite`）")
  assert.equal(/from "@thincoder\/core\/ledger/.test(src), false, "零 `from` 形静态 import 核台账模块（W8 契约②）")
})

// ─── U113 batch:status（相位 / 两分 / 内存态回落）────────────────────

test("U113: batch:status —— 相位读数 + missing/invalid 两分不合并 + 缺键补默认 + 非 ENOENT 上抛", async (t) => {
  const { root } = sandbox(t, "phase")
  const manifest = join(root, "PROJECT-MANIFEST.json")
  assert.deepEqual(batchStatus({ cwd: root }), { ok: false, reason: "missing" }, "整档缺 ⇒ missing")
  writeFileSync(manifest, JSON.stringify({ version: 1, phase: "production" }), "utf8")
  assert.deepEqual(batchStatus({ cwd: root }), { ok: true, phase: "production" }, "相位读自档内 `phase`（非顶层其它键）")
  assert.equal((await openProject({ path: root })).cwd, root, "打开项目 ⇒ 内存态落定")
  assert.deepEqual(batchStatus({}), { ok: true, phase: "production" }, "载荷无 cwd ⇒ 回落主进程内存态（项目一份）")

  writeFileSync(manifest, JSON.stringify({ version: 1 }), "utf8")
  assert.deepEqual(batchStatus({ cwd: root }), { ok: true, phase: "initial-dev" }, "缺键 ⇒ 核补默认相位（初始开发期）")
  writeFileSync(manifest, "{ not json", "utf8")
  assert.deepEqual(batchStatus({ cwd: root }), { ok: false, reason: "invalid" }, "非法 JSON ⇒ invalid（与 missing 两分不合并）")
  writeFileSync(manifest, JSON.stringify({ version: 1, phase: "bogus" }), "utf8")
  assert.deepEqual(batchStatus({ cwd: root }), { ok: false, reason: "invalid" }, "相位值出域 ⇒ 同 invalid（核校验拒面）")

  rmSync(manifest, { force: true })
  mkdirSync(manifest)
  assert.throws(() => batchStatus({ cwd: root }), /EISDIR/, "非 ENOENT 读错上抛（本档零 catch ⇒ invoke 拒绝直传，不吞——批档 §2.10 项 2）")
})
