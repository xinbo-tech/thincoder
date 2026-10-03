/**
 * 2026-10-03-ledger-family-aggregate.test.mjs — 标记范围合计批（#882）批次本地件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-03-ledger-family-aggregate.test.mjs`
 *
 * 射程 = 状态行台账标记的**范围口径**（批档 §2 · 设计档 `docs/core/design/LEDGER.md` §7.1/§7.2 ∥
 * AC-M2-18 ∥ 用例 T47–T54）：
 *   - 容器根锚 ⇒ 族内**已读**项目两池分列求和（不可读跳过）；具体项目锚 ⇒ 仅该项目（兄弟零掺）；
 *   - 空范围（无台账 ∥ 全不可读 ∥ 命中但不可读）⇒ `marker = null`（不落 `0·0`）；
 *   - `warn` = 范围内任一项 `aged>0 ∨ deadExecutors>0`（范围聚合——端零重算）。
 * 驱动面 = 核 `runLedgerScan`（实拍链：族发现 → 逐项 `buildScan`（不可读跳过）→ 判活 → 写 `state.ledger`），
 * 夹具 = 临时台账目录注入（`_setLedgerDirForTest`）+ 项目临时树（各带 manifest、条目数可区分；容器无 manifest）。
 *
 * 红绿对照（先红 = 现盘 `state.ledger` 只取 `current`——本仓实跑读数）：T47 红（根锚 ⇒ null）·
 * T48 绿（负向锁）· T49 绿（同径——容器下唯一项目经发现解析已命中 `current`，改动前即绿）·
 * T50 红（求和腿）· T51 绿（负向锁）· T52 绿（现状零变）· T53 红（老化腿先失败；死执行者腿同判——
 * 改动前 `warn` 恒 false，红线未达）· T54 桌面两形绿 ∥ VSC 源面锁红（自算残余）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const LDB = await load("thincoder-core/ledger-db.mjs") // 库键 / 目录注入缝 / 开库
const LCMD = await load("thincoder-core/ledger-cmd.mjs") // ledgerAdd（行夹具）
const SURFACE = await load("thincoder-core/ledger-surface.mjs") // runLedgerScan（实拍链）
const EXEC = await load("thincoder-core/ledger-executors.mjs") // _setExecutorProbeTtlForTest
const PROBE = await load("thincoder-core/process-probe.mjs") // 判活注入缝

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `lfa-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }

/** 项目目录（带 manifest —— 归属解析确定（`owningProject` 首查自身），不受临时基底祖先影响）。 */
function mkProject(parent, name) {
  const dir = join(parent, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  return dir
}

/** 项目注册（建库 + 入行——直引核写函数；库键 = 该项目根）。 */
function register(cwd, rows) {
  for (const row of rows) LCMD.ledgerAdd({ cwd, row })
}

/** 不可读台账档（非 SQLite 字节——`buildScan` 打开即抛 ⇒ 扫描面「不可读跳过」）。 */
function mkUnreadable(cwd) {
  mkdirSync(LDB.ledgerDirPath(), { recursive: true })
  writeFileSync(LDB.ledgerDbPath(cwd), "not-a-sqlite-db", "utf8")
}

/** 直插行（写命令造不出的时点 / 态——夹具专用；CHECK 约束照守）。 */
function insertRaw(cwd, { kind, status = "待讨论", title, trigger = null, taskBook = null, executor = null, at }) {
  const db = LDB.openLedger(cwd, { create: true })
  try {
    const ts = at ?? new Date().toISOString()
    db.prepare("INSERT INTO items (kind, status, title, task_book, trigger, executor, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(kind, status, title, taskBook, trigger, executor, ts, ts)
  } finally { db.close() }
}

/** 实拍：直驱核 `runLedgerScan`（`state.ledger` = 被测出站面）。 */
async function scanAt(anchor, notifyFile) {
  const state = { ledger: null }
  await SURFACE.runLedgerScan({ state, anchor, notifyFile })
  return state.ledger
}

/* ── T47 正常：容器根锚（双项目）⇒ 两池分列求和 ─────────────────────────────── */

test("T47 正常：容器根锚（双项目）⇒ marker = 族内已读项目两池分列求和", async () => {
  const base = tmpBase("t47")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const container = join(base, "ws")
    const a = mkProject(container, "proj-a")
    const b = mkProject(container, "proj-b")
    register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }]) // 1·1
    register(b, [ // 2·3
      { kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" },
      { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" },
    ])
    const ledger = await scanAt(container, join(base, "notify.json"))
    out("T47", `marker=${JSON.stringify(ledger.marker)} warn=${ledger.warn}`)
    assert.equal(ledger.marker, "台账 3·4", "根锚 ⇒ 两池分列求和（A 1·1 + B 2·3）")
    assert.equal(ledger.warn, false, "无老化 ∥ 无死执行者 ⇒ warn=false")
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T48 负向锁：具体项目锚 ⇒ 只显该项目（兄弟零掺） ────────────────────────── */

test("T48 负向锁：具体项目锚（A 内）⇒ marker = A 自身数（B 的数零掺入）", async () => {
  const base = tmpBase("t48")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const container = join(base, "ws")
    const a = mkProject(container, "proj-a")
    const b = mkProject(container, "proj-b")
    register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }]) // 1·1
    register(b, [{ kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" }, { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" }]) // 2·3
    const ledger = await scanAt(a, join(base, "notify.json"))
    out("T48", `marker=${JSON.stringify(ledger.marker)}（B = 2·3 零掺入）`)
    assert.equal(ledger.marker, "台账 1·1", "具体项目锚 ⇒ 只显该项目自己（同径不含兄弟）")
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T49 边界：容器根锚下恰一个项目 ⇒ 该项目数（同径——零特判） ─────────────── */

test("T49 边界：容器根锚下恰一个项目 ⇒ marker = 该项目数", async () => {
  const base = tmpBase("t49")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const container = join(base, "ws")
    const c = mkProject(container, "only-proj")
    register(c, [{ kind: "requirement", title: "C 需求一" }, { kind: "requirement", title: "C 需求二" }, { kind: "tech_todo", title: "C 待办一" }]) // 2·1
    const ledger = await scanAt(container, join(base, "notify.json"))
    out("T49", `marker=${JSON.stringify(ledger.marker)}`)
    assert.equal(ledger.marker, "台账 2·1", "根下恰一项目 = 同径（零特判）")
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T50 降级：不可读跳过（余者照常求和）；全不可读 ⇒ null（不落 0·0） ──────── */

test("T50 降级：族内不可读项目跳过；全不可读 ⇒ marker = null（不落 0·0）", async () => {
  const base = tmpBase("t50")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const container = join(base, "ws")
    const a = mkProject(container, "proj-a")
    const b = mkProject(container, "proj-b")
    register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }, { kind: "tech_todo", title: "A 待办二" }]) // 1·2
    mkUnreadable(b) // B 注册在册（`ledgerChildren` 命中——库档存在）但不可读
    const ledger = await scanAt(container, join(base, "notify.json"))
    out("T50·求和腿", `marker=${JSON.stringify(ledger.marker)}（B 不可读——跳过）`)
    assert.equal(ledger.marker, "台账 1·2", "不可读项目跳过 ⇒ 余者照常求和")
    // 全不可读 ⇒ 空范围 ⇒ null（不落 `0·0`）
    const container2 = join(base, "ws2")
    const c = mkProject(container2, "proj-c")
    const d = mkProject(container2, "proj-d")
    mkUnreadable(c)
    mkUnreadable(d)
    const ledger2 = await scanAt(container2, join(base, "notify2.json"))
    out("T50·全不可读腿", `marker=${JSON.stringify(ledger2.marker)} warn=${ledger2.warn}`)
    assert.equal(ledger2.marker, null, "全不可读 ⇒ 空范围（null——不落 0·0）")
    assert.equal(ledger2.warn, false)
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T51 边界：具体项目锚命中但不可读 ⇒ null（兄弟零掺） ───────────────────── */

test("T51 边界：具体项目锚命中但不可读 ⇒ marker = null（兄弟零掺入）", async () => {
  const base = tmpBase("t51")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const container = join(base, "ws")
    const a = mkProject(container, "proj-a")
    const b = mkProject(container, "proj-b")
    register(b, [{ kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" }, { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" }]) // 2·3——若错掺将现「台账 2·3」
    mkUnreadable(a) // A 命中（findProject ⇒ A）但扫描不可读
    const ledger = await scanAt(a, join(base, "notify.json"))
    out("T51", `marker=${JSON.stringify(ledger.marker)}（B = 2·3 在场——不得顶替）`)
    assert.equal(ledger.marker, null, "命中但不可读 ⇒ 空范围（不掺兄弟）")
    assert.equal(ledger.warn, false)
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T52 现状零变：空族 ⇒ null + false ─────────────────────────────────────── */

test("T52 现状零变：空族（无台账目录）⇒ marker = null + warn = false", async () => {
  const base = tmpBase("t52")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  try {
    const empty = join(base, "empty")
    mkdirSync(empty, { recursive: true })
    const ledger = await scanAt(empty, join(base, "notify.json"))
    out("T52", `marker=${JSON.stringify(ledger.marker)} warn=${ledger.warn}`)
    assert.equal(ledger.marker, null)
    assert.equal(ledger.warn, false)
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T53 正常：warn 范围聚合（老化腿 ∥ 死执行者腿 ∥ 负向锁） ────────────────── */

test("T53 正常：族内任一项 aged>0 ∥ deadExecutors>0 ⇒ 根锚 warn=true；干净单锚 ⇒ false", async () => {
  const base = tmpBase("t53")
  LDB._setLedgerDirForTest(join(base, "ledger-db"))
  const prevTtl = EXEC._setExecutorProbeTtlForTest(0) // 判活桩注入期间禁 TTL 缓存
  try {
    // 腿 1：族内老化（31 天前 tech_todo——非候选 trigger 除外、fresh 行不动）
    const container = join(base, "ws")
    const a = mkProject(container, "proj-aged")
    const b = mkProject(container, "proj-clean")
    insertRaw(a, { kind: "tech_todo", title: "A 老待办", at: new Date(Date.now() - 31 * 86400000).toISOString() })
    register(b, [{ kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }]) // 0·2
    const agedLeg = await scanAt(container, join(base, "notify.json"))
    out("T53·老化腿", `marker=${JSON.stringify(agedLeg.marker)} warn=${agedLeg.warn}（A aged=1）`)
    assert.equal(agedLeg.warn, true, "族内任一项 aged>0 ⇒ 根锚 warn=true")
    assert.equal(agedLeg.marker, "台账 0·3", "老化行照计入两池（tech 1+2）")
    // 负向锁：无老化 ∥ 无死执行者的具体项目锚 ⇒ warn=false（且不含 A 的老化）
    const cleanLeg = await scanAt(b, join(base, "notify-b.json"))
    out("T53·负向锁", `marker=${JSON.stringify(cleanLeg.marker)} warn=${cleanLeg.warn}`)
    assert.equal(cleanLeg.warn, false, "干净具体项目锚 ⇒ warn=false")
    assert.equal(cleanLeg.marker, "台账 0·2", "具体项目锚 ⇒ 只显 B（A 的老化零掺）")
    // 腿 2：死执行者（在途行 + 判活桩「全死」⇒ deadExecutors>0）
    const container3 = join(base, "ws3")
    const e = mkProject(container3, "proj-dead")
    insertRaw(e, {
      kind: "tech_todo", status: "在途", title: "在途待办", executor: "424242-dead-probe",
      taskBook: "docs/batches/2026-10-03-ledger-family-aggregate.md §2",
    })
    PROBE._setProcessProbeTestImpl({ aliveFn: () => new Set() })
    try {
      const deadLeg = await scanAt(container3, join(base, "notify-dead.json"))
      out("T53·死执行者腿", `marker=${JSON.stringify(deadLeg.marker)} warn=${deadLeg.warn}（pid 424242 判死）`)
      assert.equal(deadLeg.warn, true, "族内项目 deadExecutors>0 ⇒ 根锚 warn=true")
    } finally { PROBE._resetProcessProbeTestImpl() }
  } finally { EXEC._setExecutorProbeTtlForTest(prevTtl); LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── T54 端面：桌面两形透传 ∥ VSC item 源面锁 ─────────────────────────────── */

test("T54 端面：桌面 ledgerMarkerOf 两形透传；VSC item 走核 scopeMarkerOf（自算零残余）", async () => {
  const INFO = await load("thincoder-desktop/src/main/project-info.mjs")
  assert.deepEqual(INFO.ledgerMarkerOf({ marker: "台账 3·4", warn: true }), { text: "台账 3·4", warn: true }, "形一：核状态位 ⇒ { text, warn }")
  assert.deepEqual(INFO.ledgerMarkerOf({ marker: "台账 3·4", warn: false }), { text: "台账 3·4", warn: false })
  assert.equal(INFO.ledgerMarkerOf(null), null, "形二：未扫 ⇒ null")
  assert.equal(INFO.ledgerMarkerOf({ marker: null, warn: false }), null, "形二：无标记 ⇒ null")
  const vsc = readFileSync(join(ROOT, "thincoder-vscode/src/extension/ledger-surface.mjs"), "utf8")
  out("T54", `桌面两形 ✓ · VSC scopeMarkerOf 消费 ${/ledger\.scopeMarkerOf\(scans, family\)/.test(vsc)} ∥ formatMarker(current) 残余 ${/formatMarker\(current\)/.test(vsc)}`)
  assert.match(vsc, /ledger\.scopeMarkerOf\(scans, family\)/, "VSC item 消费核单源（范围归约单点）")
  assert.ok(!/formatMarker\(current\)/.test(vsc), "端侧 formatMarker(current) 自算零残余")
  assert.ok(!/current\.aged/.test(vsc) && !/current\.deadExecutors/.test(vsc), "端侧 warn 自判零残余")
})
