/**
 * 2026-10-02-manifest-resolution-fix.test.mjs — 会话锚解析修复批（多档并存支持 · #828）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（任意 cwd 可跑——仓根经 import.meta.url 定位）：
 *   node --test docs/batches/2026-10-02-manifest-resolution-fix.test.mjs
 *
 * 覆盖 = 批档 §2.6 验收腿（AC-1–AC-5）+ 基座（AC-35 ∥ T59；AC-36 ∥ T60 ∥ AC-M2-17 由前五腿承载）：
 *   基座：projectRootView 三态（ok ∥ ambiguous 候选按名排序 ∥ none 双空）+ 覆盖位短路 + 薄委托等价。
 *   AC-1（AC-M2-17 ∥ T45）：歧义锚 ⇒ 五工具面显式拒（读 / 写同门 · **零写** · 列候选）；none ⇒ 兜底键零改。
 *   AC-2（T60②③）：create 按目标所属项目落基底 ∥ 无所属显式拒（逐字文案锚）；ok ∥ none 两态零改。
 *   AC-3（BR-41）：读面候选腿补齐（候选根相对串可读）；不可读 ⇒ 既有 null / 文案（零改）。
 *   AC-4：写门覆盖增强腿（歧义锚 + 他批 `.md` 同候选基底 ⇒ 拒——旧码放行）。
 *   AC-5（BR-27–BR-35 抽样 ∥ 缺省基底 ∥ 导出面）：`ok` / `none` 两态回归零变。
 *   实景腿：本机工作区（`D:/teamcode` 双带档候选在场）——缺省锚拒 ∥ 显式项目根照常。
 *
 * 红绿对照（先红 = 旧码，见批档 §5 实施记录）：AC-1 静默 0 读；AC-2 裸串静默落锚 / 所属串静默嵌套；
 * AC-3 候选腿 null；AC-4 漏检放行；基座 = 新导出缺席——修复后全绿。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const MAN = await load("thincoder-core/manifest.mjs")
const DISC = await load("thincoder-core/manifest-discovery.mjs")
const PATHS = await load("thincoder-core/agent-tools/batch-paths.mjs")
const BATCH = await load("thincoder-core/agent-tools/batch.mjs")
const GATE = await load("thincoder-core/agent/write-gate.mjs")
const LDB = await load("thincoder-core/ledger-db.mjs")
const LCMD = await load("thincoder-core/ledger-cmd.mjs")

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const tmpRoot = (tag) => mkdtempSync(join(tmpdir(), `mrf-${tag}-`))

/** 在 dir 内落一份最小合法 manifest（`docRoot.batches` 可声明；余键走缺键 fallback）。 */
function mkManifest(dir, batches = "docs/batches") {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev", docRoot: { batches } }, null, 2))
  return dir
}

/** 歧义锚夹具：容器（无 manifest / 无 `.git`）+ 两带档子项目（按名排序 = alpha ∥ beta）。 */
function mkAmbiguous(tag) {
  const anchor = tmp(tag)
  return { anchor, alpha: mkManifest(join(anchor, "alpha")), beta: mkManifest(join(anchor, "beta")) }
}

/** 六段骨架形在档记录（读面腿夹具——只需可读）。 */
const RECORD = "# 2026-10-02 · 夹具记录\n## §1 讨论（主 agent）\n**状态行**：🔄 进行中\n## §6 验证与收口（父代理）\n收口内容（夹具）。\n"

const created = []
const tmp = (tag) => { const d = tmpRoot(tag); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }

/* ── 基座（AC-35 ∥ T59）：projectRootView 三态 + 覆盖位 + 薄委托等价 ─────────────── */

test("基座（AC-35 ∥ T59）：projectRootView 三态 + 覆盖位短路 + 薄委托等价", () => {
  try {
    assert.equal(typeof MAN.projectRootView, "function", "新导出经 manifest.mjs 转口")
    assert.equal(MAN.projectRootView, DISC.projectRootView, "转口 = 同引用（单点非第二实现）")
    // ok：锚带档 ⇒ root = 解析值、candidates = []
    const okDir = mkManifest(tmp("base-ok"))
    assert.deepEqual(MAN.projectRootView(okDir), { state: "ok", root: resolve(okDir), candidates: [] })
    // ambiguous：双带档子目录 ⇒ root = null、候选全列按名排序（同 discoverProjects 契约）
    const { anchor, alpha, beta } = mkAmbiguous("base-amb")
    const view = MAN.projectRootView(anchor)
    assert.equal(view.state, "ambiguous")
    assert.equal(view.root, null)
    assert.deepEqual(view.candidates, [resolve(alpha), resolve(beta)], "候选全列按名排序")
    // none：空容器 ⇒ 双空
    const none = tmp("base-none")
    assert.deepEqual(MAN.projectRootView(none), { state: "none", root: null, candidates: [] })
    // 薄委托等价（逐格对——含 ambiguous / none）
    for (const d of [okDir, anchor, none]) assert.equal(MAN.resolveProjectRoot(d), MAN.projectRootView(d).root, `等价：${d}`)
    // 覆盖位 ⇒ 头部短路（ok + 覆盖值）
    MAN._setProjectRootForTest(okDir)
    try {
      assert.deepEqual(MAN.projectRootView(anchor), { state: "ok", root: resolve(okDir), candidates: [] }, "覆盖位短路（先于真判据）")
      assert.equal(MAN.resolveProjectRoot("ignored"), resolve(okDir), "覆盖即覆盖值（既有回归守卫同判）")
      assert.equal(MAN.resolveProjectRoot(anchor), MAN.projectRootView(anchor).root, "覆盖位下同参逐格等价")
    } finally { MAN._resetProjectRootForTest() }
    out("基座", `ok ∥ ambiguous(${view.candidates.length} 候选) ∥ none ∥ 覆盖位 —— 逐态归位 ✓`)
  } finally { cleanup() }
})

/* ── AC-1（AC-M2-17 ∥ T45）：台账歧义拒（零写 + 列候选）；none 兜底零改 ───────── */

test("AC-1：歧义锚 ⇒ 五工具面显式拒（零写 + 列候选）；none ⇒ 兜底键零改", () => {
  const { anchor, alpha, beta } = mkAmbiguous("ledger")
  const ledgerDir = join(tmp("ledgerdir"), "ledger")
  LDB._setLedgerDirForTest(ledgerDir)
  try {
    const calls = {
      query: () => LCMD.ledgerQuery({ cwd: anchor }),
      count: () => LCMD.ledgerCount({ cwd: anchor }),
      add: () => LCMD.ledgerAdd({ cwd: anchor, row: { kind: "tech_todo", title: "夹具" } }),
      update: () => LCMD.ledgerUpdate({ cwd: anchor, id: 1, patch: {} }),
      close: () => LCMD.ledgerClose({ cwd: anchor, id: 1, status: "已废弃" }),
      openRead: () => LDB.openLedger(anchor),
      openWrite: () => LDB.openLedger(anchor, { create: true }),
    }
    for (const [name, call] of Object.entries(calls)) {
      assert.throws(call, (e) => {
        assert.ok(e.message.includes("项目不可解析"), `${name}：族锚「项目不可解析」在场`)
        assert.ok(e.message.includes(resolve(alpha)) && e.message.includes(resolve(beta)), `${name}：候选全列（绝对路径）`)
        assert.ok(e.message.includes("显式"), `${name}：显式项目根指引在场`)
        return true
      }, `${name}：歧义锚 ⇒ 显式拒（非静默）`)
    }
    assert.equal(existsSync(ledgerDir), false, "零写：台账目录 / 库档未建（拒先于一切落盘）")
    // none 态：兜底 `resolve(cwd)` 键零改（读面空账 / 写面落该键）
    const none = tmp("ledger-none")
    assert.equal(LDB.ledgerDbPath(none), join(ledgerDir, `${LDB.ledgerKey(none)}.db`), "none ⇒ 兜底键零改")
    assert.equal(LDB.openLedger(none), null, "none ⇒ 读面空账（零副作用）")
    const db = LDB.openLedger(none, { create: true })
    db.close()
    assert.ok(existsSync(join(ledgerDir, `${LDB.ledgerKey(none)}.db`)), "none ⇒ 写面落兜底键（零改）")
    out("AC-1", `七入口同拒 ✓ · 零写 ✓ · none 兜底键零改 ✓`)
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})

/* ── AC-2（T60②③）：批档 create——所属落基底 ∥ 无所属显式拒；ok ∥ none 零改 ──── */

test("AC-2：create 按目标所属项目落基底 ∥ 裸串显式拒（逐字文案锚）；ok ∥ none 零改", async () => {
  const { anchor, alpha, beta } = mkAmbiguous("create")
  const tool = BATCH.batchTool(null)
  const ctx = { agent: { cwd: anchor }, depth: 0 }
  try {
    // ① 所属串（候选根相对）⇒ 落 alpha 基底
    const own = "alpha/docs/batches/2026-10-02-own.md"
    const landed = join(alpha, "docs", "batches", "2026-10-02-own.md")
    const msg = await tool.execute({ action: "create", path: own, topic: "own", source: "夹具" }, ctx)
    assert.ok(existsSync(landed), `① 落所属项目基底：${landed}`)
    assert.ok(msg.includes(landed), "① 回执含落位绝对路径")
    // ①b 绝对形（所属 = beta）同判
    const absTarget = join(beta, "docs", "batches", "2026-10-02-abs.md")
    await tool.execute({ action: "create", path: absTarget, topic: "abs", source: "夹具" }, ctx)
    assert.ok(existsSync(absTarget), "①b 绝对形按所属项目通过")
    // ② 裸串（无所属）⇒ 显式拒（零写 + 列候选 + 逐字文案锚）
    const bare = "docs/batches/2026-10-02-bare.md"
    await assert.rejects(() => tool.execute({ action: "create", path: bare, topic: "bare", source: "夹具" }, ctx), (e) => {
      assert.ok(e.message.includes("ambiguous session anchor"), "② 机检锚在场")
      assert.ok(e.message.includes(`create target "${bare}" belongs to no candidate project`), "② 逐字文案形")
      assert.ok(e.message.includes(resolve(alpha)) && e.message.includes(resolve(beta)), "② 候选全列")
      return true
    })
    assert.equal(existsSync(join(anchor, "docs")), false, "② 拒 ⇒ 零写（锚下未造 docs/）")
    // ③ ok 态（锚有项目）：他项目绝对目标 ⇒ 原文案照拒（#827 ⑤ 锚有项目面零改）
    await assert.rejects(
      () => tool.execute({ action: "create", path: join(beta, "docs", "batches", "2026-10-02-x.md"), topic: "x", source: "夹具" }, { agent: { cwd: alpha }, depth: 0 }),
      /resolves outside the batch-record base roots/,
      "③ 跨仓 create 照拒（既有文案逐字）")
    // ④ none 态：缺省基底回退（BR-34）
    const none = tmp("create-none")
    await tool.execute({ action: "create", path: "docs/batches/2026-10-02-none.md", topic: "none", source: "夹具" }, { agent: { cwd: none }, depth: 0 })
    assert.ok(existsSync(join(none, "docs", "batches", "2026-10-02-none.md")), "④ none ⇒ 缺省基底 <cwd>/docs/batches")
    out("AC-2", `所属落基底 ✓ · 裸串拒（零写）✓ · ok/none 零改 ✓`)
  } finally { cleanup() }
})

/* ── AC-3（BR-41）：读面候选腿补齐 ─────────────────────────────────────────── */

test("AC-3：读面候选腿——歧义锚 + 候选基底内相对串 ⇒ 解析成功", () => {
  const { anchor, alpha } = mkAmbiguous("read")
  try {
    const record = join(alpha, "docs", "batches", "2026-10-02-r.md")
    mkdirSync(dirname(record), { recursive: true })
    writeFileSync(record, RECORD)
    // ① 候选根相对串（候选腿 `resolve(candidate, p)`——修复前 null）
    assert.equal(PATHS.resolveBatchReadPath(anchor, "docs/batches/2026-10-02-r.md"), record)
    // ② 锚相对（含候选名）形
    assert.equal(PATHS.resolveBatchReadPath(anchor, "alpha/docs/batches/2026-10-02-r.md"), record)
    // ③ 读面抛错形（评审门 / append 面共用同一函数）
    assert.equal(PATHS.resolveBatchDocPath(anchor, "docs/batches/2026-10-02-r.md"), record)
    // ④ 不可读 ⇒ 既有 null / 文案（零改）
    assert.equal(PATHS.resolveBatchReadPath(anchor, "docs/batches/nope.md"), null)
    assert.throws(() => PATHS.resolveBatchDocPath(anchor, "docs/batches/nope.md"), /not a readable file/)
    out("AC-3", `候选腿命中 ✓ · 抛错形同判 ✓ · 不可读零改 ✓`)
  } finally { cleanup() }
})

/* ── AC-4：写门覆盖增强腿 ─────────────────────────────────────────────────── */

test("AC-4：写门——歧义锚 + 绑定档在候选内 + 他批 .md（同候选基底）⇒ 拒", () => {
  const { anchor, alpha, beta } = mkAmbiguous("gate")
  try {
    const bound = join(alpha, "docs", "batches", "2026-10-02-a.md")
    const other = join(alpha, "docs", "batches", "2026-10-02-b.md")
    const agent = { cwd: anchor, _batchDoc: bound }
    const conflict = GATE.batchRecordWriteConflict(agent, 1, [other])
    assert.ok(conflict, "同候选基底内他批 .md ⇒ 冲突（旧码 = 基底外漏检 ⇒ 放行）")
    assert.equal(conflict.bound, bound)
    assert.equal(conflict.target, other)
    assert.ok(GATE.batchRecordWriteConflict({ cwd: anchor, _batchDoc: bound }, 1, [join(beta, "docs", "batches", "2026-10-02-c.md")]), "另一候选基底同覆盖（并集）")
    // 零变面：绑定档自身 ∥ 基底外普通文件 ∥ depth 0 ⇒ 放行
    assert.equal(GATE.batchRecordWriteConflict(agent, 1, [bound]), null)
    assert.equal(GATE.batchRecordWriteConflict(agent, 1, [join(anchor, "notes.md")]), null)
    assert.equal(GATE.batchRecordWriteConflict(agent, 0, [other]), null)
    out("AC-4", `候选并集覆盖 ✓ ∥ 自身档 / 基外 / depth 0 放行 ✓`)
  } finally { cleanup() }
})

/* ── AC-5：ok ∥ none 两态回归（BR-27–BR-35 抽样 ∥ 缺省基底 ∥ 导出面） ────────── */

test("AC-5：ok ∥ none 两态回归零变（BR-27–BR-35 抽样 ∥ batchDocBases 缺省 ∥ 导出面）", async () => {
  const container = tmp("reg-c")
  const root = mkManifest(join(container, "proj"))
  const batches = join(root, "docs", "batches")
  const tool = BATCH.batchTool(null)
  try {
    assert.deepEqual(PATHS.batchDocBases(root), [batches], "ok ⇒ 声明面 / 缺省回退零改")
    assert.deepEqual(PATHS.batchDocBases(container), [join(root, "docs", "batches")], "容器锚（向下恰一）⇒ 该子项目基底")
    // BR-27：项目根 + 根相对串 ⇒ 落 docs/batches（不嵌套）
    await tool.execute({ action: "create", path: "docs/batches/2026-10-02-reg.md", topic: "reg", source: "夹具" }, { agent: { cwd: root }, depth: 0 })
    assert.ok(existsSync(join(batches, "2026-10-02-reg.md")), "BR-27 不嵌套")
    // BR-28：项目内子目录 cwd + 根相对串
    await tool.execute({ action: "create", path: "docs/batches/2026-10-02-reg2.md", topic: "reg2", source: "夹具" }, { agent: { cwd: join(root, "docs") }, depth: 0 })
    assert.ok(existsSync(join(batches, "2026-10-02-reg2.md")), "BR-28 子目录 cwd 同判")
    // BR-29 / BR-33：项目根的上级目录 cwd + 根相对串（读面 / spawn 门同源）
    assert.equal(PATHS.resolveBatchReadPath(container, "docs/batches/2026-10-02-reg.md"), join(batches, "2026-10-02-reg.md"), "BR-29 上级 cwd 读面命中")
    // BR-30：基底父目录 cwd + cwd 相对串
    const p30 = PATHS.resolveBatchCreatePath(join(root, "docs"), "batches/2026-10-02-reg3.md", PATHS.batchDocBases(join(root, "docs")))
    assert.equal(p30, join(batches, "2026-10-02-reg3.md"), "BR-30 基底父目录 cwd")
    // BR-31：绝对路径（基底内通过 / 越基底拒——既有文案）
    assert.equal(PATHS.resolveBatchCreatePath(root, join(batches, "2026-10-02-reg4.md"), PATHS.batchDocBases(root)), join(batches, "2026-10-02-reg4.md"))
    assert.throws(() => PATHS.resolveBatchCreatePath(root, join(container, "outside.md"), PATHS.batchDocBases(root)), /resolves outside the batch-record base roots/)
    // BR-32：锚定串越基底 ⇒ fail-closed（不二次拼接）
    assert.throws(() => PATHS.resolveBatchCreatePath(root, "docs/batches/../../2026-10-02-esc.md", PATHS.batchDocBases(root)), /refusing to nest it/)
    // BR-34：非项目 cwd ⇒ 缺省基底回退
    const none = tmp("reg-none")
    assert.deepEqual(PATHS.batchDocBases(none), [join(none, "docs", "batches")], "BR-34 缺省基底")
    // BR-35：同形前缀（`-` 非段边界）⇒ 不锚定、零 fail-closed（照候选序）
    const p35 = () => PATHS.resolveBatchCreatePath(root, "docs/batches-old/2026-10-02-x.md", PATHS.batchDocBases(root))
    assert.throws(p35, /resolves outside the batch-record base roots/)
    // 断代重锚（2026-10-05 · 批 2026-10-05-engine-tools-gaps · 台账 #942）：原断言「照候选序静默落基底内」⇒ 收正——④ 单段收窄不收多段 ∥ ③ 自有项目根腿落点不在基底内 ⇒ 各腿无落点（BR-45 同旨；先例 #894 / #897）。
    // 导出面：projectRootView 转口同引用（结构面随动 = 同批件）
    assert.equal(typeof DISC.projectRootView, "function", "discovery 直导出")
    assert.equal(MAN.projectRootView, DISC.projectRootView, "manifest 转口 = 同引用")
    // 旧档可读性（夹具档在场）
    assert.ok(readFileSync(join(batches, "2026-10-02-reg.md"), "utf8").includes("六段 append-only"), "create 落骨架（既有行为）")
    out("AC-5", `BR-27/28/29/30/31/32/34/35 抽样零变 ✓ · 导出面 ✓`)
  } finally { cleanup() }
})

/* ── 实景腿：本机工作区（multi-manifest 实锚） ─────────────────────────────── */

test("实景腿：本机工作区（双带档候选在场）——歧义锚拒 ∥ 显式项目根照常", () => {
  const live = resolve("D:/teamcode")
  if (!existsSync(join(live, "thincoder", "PROJECT-MANIFEST.json")) || !existsSync(join(live, "thincoder.com", "PROJECT-MANIFEST.json"))) {
    out("实景腿", `本机工作区不在场（${live}）——跳过`)
    return
  }
  const view = MAN.projectRootView(live)
  if (view.state !== "ambiguous" || !view.candidates.includes(join(live, "thincoder")) || !view.candidates.includes(join(live, "thincoder.com"))) {
    out("实景腿", `本机工作区形态非本轮实景（state=${view.state} · 候选 ${view.candidates.length}）——跳过`)
    return
  }
  assert.deepEqual([...view.candidates].sort(), view.candidates, "候选按名排序（契约——与候选数无关）")
  const ledgerDir = join(tmp("live-ledger"), "ledger")
  LDB._setLedgerDirForTest(ledgerDir)
  try {
    assert.throws(() => LDB.openLedger(live), /项目不可解析/, "缺省（锚）⇒ 拒")
    assert.throws(() => LCMD.ledgerCount({ cwd: live }), /项目不可解析/, "缺省工具面同拒")
    const projRoot = join(live, "thincoder")
    assert.equal(LDB.openLedger(projRoot), null, "显式项目根 ⇒ 照常（夹具台账目录空 ⇒ 空账）")
    assert.equal(LDB.ledgerDbPath(projRoot), join(ledgerDir, `${LDB.ledgerKey(projRoot)}.db`), "显式根 ⇒ 键照旧")
    out("实景腿", `锚拒 ✓ · 显式 ${projRoot} ⇒ ${LDB.ledgerKey(projRoot)} ✓`)
  } finally { LDB._resetLedgerDirForTest(); cleanup() }
})
