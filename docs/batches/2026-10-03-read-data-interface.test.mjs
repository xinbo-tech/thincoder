/**
 * 2026-10-03-read-data-interface.test.mjs — 只读数据接口批（台账 #886 ∥ #887）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-03-read-data-interface.test.mjs`
 *
 * 射程 = 设计档 `docs/cli/design/READ-DATA-INTERFACE.md` §3（冻结契约）∥ §7（用例 RDI-1–RDI-12）：
 *   ① CLI `thincoder ledger list --json [--full] [--family] [--cwd <dir>]`（严格解析 · fail-closed）；
 *   ② ACP `ledger/list` · `ledger/count` · `batch/list` + `ledger/changed` · `batch/changed` 通知；
 *   ③ 只读闸（readOnly 句柄 + 零 DDL——旧库读前读后哈希等 ∥ 无库不建库 ∥ 零伴生档 ∥ 非台账库空集零改）。
 * 沙箱纪律：HOME ∥ USERPROFILE → 临时目录（**一切（动态）import 之前**——进程内核链与 CLI 子进程
 *   同源派生 `~/.thincoder/ledger`；先例 = #704 批内件同法）。零网络 ∥ 零真实 LLM。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, isAbsolute, join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const SANDBOX_HOME = mkdtempSync(join(tmpdir(), "rdi-home-"))
process.env.HOME = SANDBOX_HOME
process.env.USERPROFILE = SANDBOX_HOME
const LEDGER_DIR = join(SANDBOX_HOME, ".thincoder", "ledger")
const ENV = { ...process.env, HOME: SANDBOX_HOME, USERPROFILE: SANDBOX_HOME }
const CLI_ENTRY = join(ROOT, "thincoder-cli", "bin", "thincoder.mjs")

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `rdi-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }
after(() => { cleanup(); rmSync(SANDBOX_HOME, { recursive: true, force: true }) })

// 既有核面（可静态载）；新面（ledger-read ∥ batch-read ∥ acp read-data）一律**惰性**装载——
// 先红相位面未存在 ⇒ 各腿独立红，不连坐整档。
const LDB = await load("thincoder-core/ledger-db.mjs")
const LCMD = await load("thincoder-core/ledger-cmd.mjs")
const MIG = await load("thincoder-core/ledger-migrate.mjs")
const LEDGER = await load("thincoder-core/ledger.mjs")
const BSK = await load("thincoder-core/agent-tools/batch-skeleton.mjs")
LDB._setLedgerDirForTest(LEDGER_DIR) // 进程内面钉沙箱（子进程面经 ENV——两路同靶）

/** 行键集 = id + 11 数据列（`--full` = id + 12——列集单源 = 核 DATA_COLUMNS，D-10 直引）。 */
const ROW_KEYS = ["id", ...MIG.DATA_COLUMNS.filter((c) => c !== "evidence")]
const FULL_KEYS = ["id", ...MIG.DATA_COLUMNS]

// ── 夹具工具 ────────────────────────────────────────────────────────────────

/** 项目目录（带 manifest——归属解析确定（`owningProject` 首查自身），不受临时基底祖先影响）。 */
function mkProject(parent, name) {
  const dir = join(parent, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  return dir
}
/** 库档路径（键式 = 核 `ledgerKey` 单源——键只在核一处生成）。 */
const dbFileOf = (root) => join(LEDGER_DIR, `${LDB.ledgerKey(root)}.db`)
/** 文件内容哈希（只读闸：读前读后等）。 */
const sha = (file) => createHash("sha1").update(readFileSync(file)).digest("hex")

/** 写面开库（create=true）+ 直插行（夹具用——CHECK 约束照守）。 */
function insertRow(cwd, { kind, status = "待讨论", title, board = null, taskBook = null, evidence = null }) {
  const db = LDB.openLedger(cwd, { create: true })
  try {
    const ts = new Date().toISOString()
    db.prepare("INSERT INTO items (kind, status, title, board, task_book, evidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(kind, status, title, board, taskBook, evidence, ts, ts)
  } finally { db.close() }
}

/** 旧 DDL（缺 executor 列——旧库夹具；无 user_version 标记）。 */
const OLD_DDL = `CREATE TABLE items (
  id INTEGER PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, title TEXT NOT NULL,
  board TEXT, req_doc TEXT, task_book TEXT, evidence TEXT, trigger TEXT,
  created_at TEXT, updated_at TEXT, closed_at TEXT)`

/** CLI 子进程（沙箱 env；cwd 缺省 = 仓根）。 */
const cli = (args, { cwd = ROOT } = {}) => spawnSync(process.execPath, [CLI_ENTRY, ...args], { cwd, env: ENV, encoding: "utf8" })
const cliList = (extra = [], opts) => cli(["ledger", "list", "--json", ...extra], opts)
/** 单段 JSON（非 JSON ⇒ 红）。 */
const parse = (r) => JSON.parse(r.stdout)
/** ACP 装配面（直驱 `buildAcpHandlers`——唯一外部契约；凭据门以注入 isConfigured 过）。 */
async function buildAcp(opts = {}) {
  const acp = await load("thincoder-cli/src/acp.mjs")
  return acp.buildAcpHandlers({ isConfigured: () => true, ...opts })
}

// ── RDI-1 正常：CLI --json 全列 + schemaVersion + 与核逐 id 等 ──────────────

test("RDI-1 正常：ledger list --json —— exit 0 · 单段 JSON · schemaVersion=1 · 行键集/行值与核 ledgerQuery 逐 id 等", () => {
  const base = tmpBase("r1")
  try {
    const p = mkProject(base, "proj")
    insertRow(p, { kind: "requirement", title: "需求一", board: "只读数据接口" })
    insertRow(p, { kind: "tech_todo", title: "待办一", status: "在途", taskBook: "docs/batches/2026-10-03-read-data-interface.md §2" })
    insertRow(p, { kind: "requirement", title: "需求二（已核销）", status: "已核销" })
    const r = cliList(["--cwd", p])
    out("RDI-1", `exit=${r.status} stderr=${JSON.stringify((r.stderr ?? "").trim())}`)
    assert.equal(r.status, 0, `exit 0（stderr：${r.stderr || "—"}）`)
    assert.equal(r.stdout.trimEnd().split("\n").length, 1, "单段 JSON（零杂行）")
    const payload = parse(r)
    assert.deepEqual(Object.keys(payload), ["projects"])
    assert.equal(payload.projects.length, 1)
    const proj = payload.projects[0]
    assert.equal(proj.root, p, "root = 与库键同源解析的项目根")
    assert.equal(proj.name, basename(p))
    assert.equal(proj.schemaVersion, 1, "写面建库 ⇒ user_version = 1")
    assert.equal(proj.rows.length, 3)
    for (const row of proj.rows) assert.deepEqual(Object.keys(row), ROW_KEYS, "行键集 = id + 11 数据列")
    const core = LCMD.ledgerQuery({ cwd: p })
    assert.equal(proj.rows.length, core.length)
    const byId = new Map(core.map((x) => [Number(x.id), x]))
    for (const row of proj.rows) {
      const src = byId.get(row.id)
      assert.ok(src, `核行 id=${row.id} 在场`)
      for (const c of Object.keys(row)) {
        if (c === "id") continue
        assert.equal(row[c], src[c] ?? null, `id=${row.id} 列 ${c} 等值`)
      }
    }
    assert.equal(LCMD.ledgerCount({ cwd: p }), 2, "未决四态计数（已核销不计）")
  } finally { cleanup() }
})

// ── RDI-2 正常：evidence 默认省 ∥ --full 给 ────────────────────────────────

test("RDI-2 正常：evidence 默认零键 ∥ --full 等值含（键集对拍）", () => {
  const base = tmpBase("r2")
  try {
    const p = mkProject(base, "proj")
    insertRow(p, { kind: "requirement", title: "带说明", evidence: "证据文本 A" })
    insertRow(p, { kind: "tech_todo", title: "无说明" })
    const plain = parse(cliList(["--cwd", p]))
    const full = parse(cliList(["--cwd", p, "--full"]))
    for (const row of plain.projects[0].rows) {
      assert.equal("evidence" in row, false, "默认零 `evidence` 键")
      assert.deepEqual(Object.keys(row), ROW_KEYS)
    }
    for (const row of full.projects[0].rows) assert.deepEqual(Object.keys(row), FULL_KEYS, "--full 含 evidence（键序 = 数据列序）")
    assert.equal(full.projects[0].rows.find((x) => x.title === "带说明").evidence, "证据文本 A")
    assert.equal(full.projects[0].rows.find((x) => x.title === "无说明").evidence, null)
    const stripped = full.projects[0].rows.map(({ evidence, ...rest }) => rest)
    out("RDI-2", `默认键集 ${ROW_KEYS.length} · full 键集 ${FULL_KEYS.length} · 剥 evidence 深等 ${JSON.stringify(stripped) === JSON.stringify(plain.projects[0].rows)}`)
    assert.deepEqual(stripped, plain.projects[0].rows, "剥 evidence 与默认可行深等")
  } finally { cleanup() }
})

// ── RDI-3 边界：空项目（无库）⇒ 空集 + exit 0 ─────────────────────────────

test("RDI-3 边界：空项目（无库）—— exit 0 · {\"projects\":[]} · stderr 空 · 不建库", () => {
  const base = tmpBase("r3")
  try {
    const p = mkProject(base, "empty")
    const r = cliList(["--cwd", p])
    out("RDI-3", `exit=${r.status} stdout=${r.stdout.trim()} stderr=${JSON.stringify(r.stderr.trim())}`)
    assert.equal(r.status, 0)
    assert.equal(r.stderr, "", "stderr 空")
    assert.deepEqual(parse(r), { projects: [] })
    assert.equal(existsSync(dbFileOf(p)), false, "读不建库")
  } finally { cleanup() }
})

// ── RDI-4 边界：只读闸（五腿——旧库 / 无库 / 版本读 / 版本写 / 非台账库） ──

test("RDI-4 边界·只读闸：(a) 旧库哈希等 (b) 无库不建 (c) 旧库版本 0 (d) 写后 1 (e) 非台账库空集零改", () => {
  const base = tmpBase("r4")
  try {
    // (a)(c) 旧库：旧 DDL（缺 executor、无 user_version）
    const p = mkProject(base, "old")
    mkdirSync(LEDGER_DIR, { recursive: true })
    const file = dbFileOf(p)
    const mk = new DatabaseSync(file)
    mk.exec(OLD_DDL)
    const ts = new Date().toISOString()
    mk.prepare("INSERT INTO items (kind, status, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run("requirement", "待讨论", "旧库行", ts, ts)
    mk.close()
    const h0 = sha(file)
    const rows0 = LCMD.ledgerQuery({ cwd: p }) // 核读（现行红：DDL + ALTER 改库）
    assert.equal(LCMD.ledgerCount({ cwd: p }), 1)
    assert.equal(rows0.length, 1)
    assert.equal(rows0[0].executor ?? null, null, "缺列按 null")
    const h1 = sha(file)
    out("RDI-4·a", `核读前后哈希 ${h1 === h0 ? "等" : "不等"}（先红 = ALTER 补列）`)
    assert.equal(h1, h0, "核读零改（readOnly + 零 DDL/ALTER）")
    const r = cliList(["--cwd", p])
    assert.equal(r.status, 0)
    const payload = parse(r)
    assert.equal(sha(file), h0, "CLI 读零改")
    assert.equal(payload.projects[0].schemaVersion, 0, "(c) 旧库未标 ⇒ 如实回读 0")
    assert.equal(payload.projects[0].rows[0].executor, null, "缺列归一 null")
    for (const side of ["-wal", "-shm"]) assert.equal(existsSync(file + side), false, `零伴生档 ${side}`)
    // (d) 写面开库 ⇒ 落标 1
    insertRow(p, { kind: "tech_todo", title: "新行" })
    const rw = cliList(["--cwd", p])
    assert.equal(rw.status, 0)
    assert.equal(parse(rw).projects[0].schemaVersion, 1, "(d) 写面开库后 = 1")
    const probe = new DatabaseSync(file, { readOnly: true })
    try { assert.equal(probe.prepare("PRAGMA user_version").get().user_version, 1, "库内标记直读 = 1") } finally { probe.close() }
    // (b) 无库项目 ⇒ 读后仍无库
    const q = mkProject(base, "nodb")
    const rq = cliList(["--cwd", q])
    assert.equal(rq.status, 0)
    assert.deepEqual(parse(rq), { projects: [] })
    assert.equal(existsSync(dbFileOf(q)), false, "(b) 无库不建库")
    // (e) 文件在盘但非台账库（SQLite 可开、无 items 表）⇒ 空集 ∧ 文件零改
    const e = mkProject(base, "notledger")
    const efile = dbFileOf(e)
    const edb = new DatabaseSync(efile)
    edb.exec("CREATE TABLE other (x TEXT)")
    edb.close()
    const eh0 = sha(efile)
    const re = cliList(["--cwd", e])
    assert.equal(re.status, 0)
    out("RDI-4·e", `非台账库 ⇒ ${re.stdout.trim()}（文件零改 ${sha(efile) === eh0}）`)
    assert.deepEqual(parse(re), { projects: [] }, "(e) 非台账库 ⇒ 空集")
    assert.equal(sha(efile), eh0, "(e) 文件零改")
  } finally { cleanup() }
})

// ── RDI-5 正常：三口径（当前 ∥ --cwd ∥ --family）─────────────────────────

test("RDI-5 正常·三口径：读 A ∥ --cwd B ∥ --family —— 各出自身 ∥ 发现序对拍 ∥ 无库兄弟不出项", () => {
  const base = tmpBase("r5")
  try {
    const container = join(base, "ws")
    mkdirSync(container, { recursive: true })
    const a = mkProject(container, "proj-a")
    const b = mkProject(container, "proj-b")
    const c = mkProject(container, "proj-c") // 无库兄弟
    insertRow(a, { kind: "requirement", title: "A 需求一" })
    insertRow(a, { kind: "tech_todo", title: "A 待办一" })
    insertRow(b, { kind: "requirement", title: "B 需求一" })
    insertRow(b, { kind: "requirement", title: "B 需求二" })
    insertRow(b, { kind: "tech_todo", title: "B 待办一" })
    // 腿 1：当前项目（子进程 cwd = A）
    const ra = parse(cliList([], { cwd: a }))
    assert.deepEqual(ra.projects.map((x) => x.root), [a], "当前项目 = A")
    assert.equal(ra.projects[0].rows.length, 2)
    // 腿 2：--cwd B
    const rb = parse(cliList(["--cwd", b]))
    assert.deepEqual(rb.projects.map((x) => x.root), [b], "--cwd = B")
    assert.equal(rb.projects[0].rows.length, 3)
    // 腿 3：--family（容器锚）——发现序对拍 discoverFamily
    const rf = parse(cliList(["--family", "--cwd", container]))
    const expected = LEDGER.discoverFamily(container).projects.map((x) => x.root)
    out("RDI-5", `family=${JSON.stringify(rf.projects.map((x) => x.root))} 对拍=${JSON.stringify(expected)}`)
    assert.deepEqual(rf.projects.map((x) => x.root), expected, "族 = 发现序逐项（current 在前 / 余按名升序）")
    assert.deepEqual(expected, [a, b])
    assert.ok(!rf.projects.some((x) => x.root === c), "无库兄弟不出项")
    assert.equal(rf.projects.find((x) => x.root === a).rows.length, 2)
    assert.equal(rf.projects.find((x) => x.root === b).rows.length, 3)
  } finally { cleanup() }
})

// ── RDI-6 边界：空容器 --family 空集 ∥ 族内混不可读库跳过 ─────────────────

test("RDI-6 边界：空容器 --family ⇒ 空集 ∥ 族内混不可读库 ⇒ 跳过（余者照常）", () => {
  const base = tmpBase("r6")
  try {
    const empty = join(base, "empty-ws")
    mkdirSync(empty, { recursive: true })
    const r0 = cliList(["--family", "--cwd", empty])
    out("RDI-6·空族", `exit=${r0.status} stdout=${r0.stdout.trim()}`)
    assert.equal(r0.status, 0)
    assert.deepEqual(parse(r0), { projects: [] })
    const ws = join(base, "ws2")
    mkdirSync(ws, { recursive: true })
    const a = mkProject(ws, "proj-a")
    const b = mkProject(ws, "proj-b")
    insertRow(a, { kind: "requirement", title: "A 需求一" })
    mkdirSync(LEDGER_DIR, { recursive: true })
    writeFileSync(dbFileOf(b), "not-a-sqlite-db", "utf8") // 在册（库档在盘）但不可读
    const r1 = cliList(["--family", "--cwd", ws])
    assert.equal(r1.status, 0)
    const roots = parse(r1).projects.map((x) => x.root)
    out("RDI-6·混不可读", `projects=${JSON.stringify(roots)}（B 跳过）`)
    assert.deepEqual(roots, [a], "不可读跳过——余者照常")
  } finally { cleanup() }
})

// ── RDI-7 正常：双出口同源（CLI 载荷 vs ACP 三方法）──────────────────────

test("RDI-7 正常·双出口：CLI 载荷 vs ACP ledger/list 深等 ∥ ledger/count = 核 ∥ batch/list 形", async () => {
  const base = tmpBase("r7")
  try {
    const p = mkProject(base, "proj")
    insertRow(p, { kind: "requirement", title: "需求一", board: "接口" })
    insertRow(p, { kind: "tech_todo", title: "待办一", status: "在途", taskBook: "docs/batches/2026-10-03-read-data-interface.md §2" })
    const bd = join(p, "docs", "batches")
    mkdirSync(bd, { recursive: true })
    writeFileSync(join(bd, "alpha.md"), "# alpha\n## §1 讨论（主 agent）\n**状态行**：进行中\n")
    const cliPayload = parse(cliList(["--cwd", p]))
    const built = await buildAcp({ cwd: () => p })
    const list = await built.handlers["ledger/list"]({ cwd: p })
    out("RDI-7·深等", `CLI 与 ACP 载荷深等 ${JSON.stringify(list) === JSON.stringify(cliPayload)}`)
    assert.ok(!list.error, JSON.stringify(list))
    assert.deepEqual(list, cliPayload, "两出口载荷深等（N1 同源）")
    const cnt = await built.handlers["ledger/count"]({ cwd: p })
    assert.equal(typeof cnt.count, "number")
    assert.equal(cnt.count, LCMD.ledgerCount({ cwd: p }), "count 单源 = 核 ledgerCount（未决四态）")
    const batches = await built.handlers["batch/list"]({ cwd: p })
    assert.ok(!batches.error, JSON.stringify(batches))
    const coreBatches = await (await load("thincoder-core/agent-tools/batch-read.mjs")).listBatchRecords({ cwd: p })
    assert.deepEqual(batches, coreBatches, "batch/list = 核单源")
    for (const b of batches.batches) {
      assert.deepEqual(Object.keys(b).sort(), ["file", "path", "sections"])
      assert.equal(b.file, basename(b.path))
      assert.ok(isAbsolute(b.path), "path = 绝对路径")
    }
  } finally { cleanup() }
})

// ── RDI-8 正常：batch/list 与档面逐段对拍 ────────────────────────────────

test("RDI-8 正常·批次读面：sections 逐段对拍（关键词 ∥ null ∥ 无状态词）∥ 嵌套档在列 ∥ 路径升序", async () => {
  const base = tmpBase("r8")
  try {
    const p = mkProject(base, "proj")
    const bd = join(p, "docs", "batches")
    mkdirSync(join(bd, "sub"), { recursive: true })
    // 全骨架档（batchSkeleton 单源产出 + §2 状态行 = 设计完成）
    const full = BSK.batchSkeleton({ date: "2026-10-03", topic: "fixture-full", source: "batch-local test", prev: "无（独立批）" })
      .replace(/(## §2[^\n]*\n\*\*状态行\*\*：)[^\n]*/, "$1设计完成（fixture）")
    writeFileSync(join(bd, "full.md"), full)
    writeFileSync(join(bd, "plain.md"), "# plain\n## §1 讨论（主 agent）\n无状态行档。\n## §2 批次任务与设计（eng-designer）\n正文。\n")
    writeFileSync(join(bd, "sub", "nested.md"), "# nested\n## §6 验证与收口（父代理）\n正文。\n")
    const built = await buildAcp({ cwd: () => p })
    const res = await built.handlers["batch/list"]({ cwd: p })
    assert.ok(!res.error, JSON.stringify(res))
    const byFile = Object.fromEntries(res.batches.map((b) => [b.file, b]))
    out("RDI-8", `files=${res.batches.map((b) => b.file).join(",")}`)
    assert.deepEqual(Object.keys(byFile).sort(), ["full.md", "nested.md", "plain.md"], "嵌套档在列")
    assert.deepEqual(byFile["full.md"].sections, {
      "§1": "进行中", "§2": "设计完成", "§3": null, "§4": "无状态词", "§5": null, "§6": "无状态词",
    })
    assert.deepEqual(byFile["plain.md"].sections, {
      "§1": null, "§2": null, "§3": null, "§4": "无状态词", "§5": null, "§6": "无状态词",
    })
    assert.equal(byFile["nested.md"].sections["§6"], "无状态词")
    const paths = res.batches.map((b) => b.path)
    assert.deepEqual(paths, [...paths].sort(), "batches 按路径升序")
    assert.ok(paths.every((x) => !x.includes("\\")), "path 全部 `/` 归一")
  } finally { cleanup() }
})

// ── RDI-9 正常：变更通知（基线静默 ∥ 两方法 ∥ 静默轮零新增）────────────────

test("RDI-9 正常·通知：基线静默 ∥ 改台账 ⇒ ledger/changed ∥ 改批档 ⇒ batch/changed ∥ 静默轮零新增", async () => {
  const base = tmpBase("r9")
  try {
    const p = mkProject(base, "proj")
    insertRow(p, { kind: "requirement", title: "基线行" })
    const bd = join(p, "docs", "batches")
    mkdirSync(bd, { recursive: true })
    const doc = join(bd, "doc.md")
    writeFileSync(doc, "# doc\n## §1 讨论（主 agent）\n**状态行**：进行中\n")
    const captured = []
    const built = await buildAcp({ cwd: () => p, notify: (method, params) => captured.push({ method, params }) })
    assert.ok(built.watcher, "watcher 出参在场")
    await built.watcher.check()
    out("RDI-9·基线", `captured=${captured.length}`)
    assert.deepEqual(captured, [], "首查立基线（静默）")
    await sleep(30)
    insertRow(p, { kind: "tech_todo", title: "新行", evidence: "×".repeat(4000) }) // 体积必变 ⇒ 指纹变
    await built.watcher.check()
    out("RDI-9·台账腿", JSON.stringify(captured))
    assert.deepEqual(captured, [{ method: "ledger/changed", params: { cwd: p } }], "台账变更 ⇒ ledger/changed（params 只 {cwd}）")
    await sleep(30)
    writeFileSync(doc, "# doc\n## §1 讨论（主 agent）\n**状态行**：进行中\n补充行。\n")
    await built.watcher.check()
    out("RDI-9·批次腿", JSON.stringify(captured.map((c) => c.method)))
    assert.deepEqual(captured, [
      { method: "ledger/changed", params: { cwd: p } },
      { method: "batch/changed", params: { cwd: p } },
    ], "批档变更 ⇒ batch/changed")
    await built.watcher.check()
    assert.equal(captured.length, 2, "静默轮零新增")
  } finally { cleanup() }
})

// ── RDI-10 错误：CLI 严格解析（缺 --json ∥ 未知参）────────────────────────

test("RDI-10 错误：ledger list（缺 --json）∥ --bogus ⇒ exit 1 + usage（stderr）", () => {
  const r1 = cli(["ledger", "list"])
  out("RDI-10·缺 --json", `exit=${r1.status} stderr=${JSON.stringify((r1.stderr ?? "").trim())}`)
  assert.equal(r1.status, 1)
  assert.equal(r1.stdout, "")
  assert.ok(r1.stderr.includes("ledger list --json"), "usage 含冻结命令形")
  const r2 = cli(["ledger", "list", "--json", "--bogus"])
  out("RDI-10·未知参", `exit=${r2.status} stderr=${JSON.stringify((r2.stderr ?? "").trim())}`)
  assert.equal(r2.status, 1)
  assert.equal(r2.stdout, "")
  assert.ok(r2.stderr.includes("ledger list --json"), "usage 含冻结命令形")
})

// ── RDI-11 错误：--cwd 不存在路径 ⇒ 一行消息（零栈泄）────────────────────

test("RDI-11 错误：--cwd 不存在路径 ⇒ exit 1 + 一行消息（零栈泄）", () => {
  const base = tmpBase("r11")
  try {
    const missing = join(base, "no-such-dir")
    const r = cli(["ledger", "list", "--json", "--cwd", missing])
    const lines = (r.stderr ?? "").trim().split(/\r?\n/).filter(Boolean)
    out("RDI-11", `exit=${r.status} lines=${lines.length} stderr=${JSON.stringify((r.stderr ?? "").trim())}`)
    assert.equal(r.status, 1)
    assert.equal(r.stdout, "")
    assert.equal(lines.length, 1, "一行消息")
    assert.ok(r.stderr.includes(missing), "消息含所指路径")
    assert.ok(!/\n\s+at\s/.test(r.stderr), "零栈泄")
  } finally { cleanup() }
})

// ── RDI-12 错误：ACP 参数类型 ⇒ INVALID_PARAMS（-32602）──────────────────

test("RDI-12 错误：ACP ledger/list 参数类型错 ⇒ INVALID_PARAMS（-32602）", async () => {
  const built = await buildAcp({ cwd: () => ROOT })
  assert.equal(typeof built.handlers["ledger/list"], "function", "ledger/list handler 在场")
  for (const params of [{ cwd: 123 }, { family: "yes" }, { full: 1 }]) {
    const res = await built.handlers["ledger/list"](params)
    out("RDI-12", `${JSON.stringify(params)} ⇒ ${JSON.stringify(res?.error ?? null)}`)
    assert.ok(res?.error, `params ${JSON.stringify(params)} ⇒ error`)
    assert.equal(res.error.code, -32602, "INVALID_PARAMS")
  }
})
