/**
 * 2026-10-05-ledger-variant-db-notice.test.mjs — 变体键库首跑检测提示批（F-LX3 · 台账 #935）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-05-ledger-variant-db-notice.test.mjs`
 *
 * 射程 = 设计档 `docs/core/design/LEDGER.md` §12（用例 U-VN1–U-VN6）：
 *   ① 检测判据（沿 `legacyKeyVariants` + `k !== 主键` 过滤 + 文件存在——零开库，非库文件亦计）；
 *   ② 单行 i18n 文案（zh ∥ en 逐字；含 `thincoder ledger audit` ∥ `thincoder ledger migrate`）；
 *   ③ 零输出两拍（仅主库 / 目录空 ∥ 无目录）；④ 抛错注入 ⇒ `null` 零抛（静默降级）；
 *   ⑤ 每进程至多一次 + 重置缝；⑥ 启动面渲染腿（`showStartup` 直驱 + 接线静态锁）。
 * 沙箱纪律：HOME ∥ USERPROFILE → 临时目录（一切（动态）import 之前——先例 = 2026-10-03-read-data-interface 批内件同法）。
 * 零网络 ∥ 零真实 LLM ∥ 不触真实 `~/.thincoder`。宿主假设 = 盘符路径（F-LX3 盘符作用域——无盘符宿主（Linux/macOS）下 U-VN1/3/4/5 显式 skip）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const SANDBOX_HOME = mkdtempSync(join(tmpdir(), "vn-home-"))
process.env.HOME = SANDBOX_HOME
process.env.USERPROFILE = SANDBOX_HOME
const created = []
const tmpBase = (tag) => { const d = mkdtempSync(join(tmpdir(), `vn-${tag}-`)); created.push(d); return d }
const cleanup = () => { for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true }) }
after(() => { cleanup(); rmSync(SANDBOX_HOME, { recursive: true, force: true }) })

const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

// 既有核面（可载）；待测新档惰性装载（先红相位档未存在 ⇒ 各腿独立红，不连坐整档）。
const MIG = await load("thincoder-core/ledger-migrate.mjs")
const LDB = await load("thincoder-core/ledger-db.mjs")
const notice = () => load("thincoder-core/ledger-variant-notice.mjs")

/** 文案逐字（设计 §12.2 冻结字面——生产单源 = i18n 容器；本档只作断言期望）。 */
const ZH_TEXT = "检测到本项目的存量变体键台账库（升级遗留，数据可能未并入当前库）：thincoder ledger audit 查看；thincoder ledger migrate 收正"
const EN_TEXT = "Legacy variant-key ledger DB found for this project (pre-upgrade; rows may be outside the current ledger): thincoder ledger audit to inspect; thincoder ledger migrate to reconcile"

/** 项目根夹具（带 manifest——归属解析确定；同 read-data-interface 批内件）。 */
function mkProject(parent, name) {
  const dir = join(parent, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  return dir
}
/** 台账目录夹具（临时——`dir` 注入 = 默认 `ledgerDirPath()` 的测试缝；不触真实用户目录）。 */
const mkLedgerDir = (parent) => { const d = join(parent, "ledger"); mkdirSync(d, { recursive: true }); return d }
/** 盘符项目根夹具：拼写钉死 = 盘符大写（宿主 TEMP 大小写不可控——「变体键 ≠ 主键」前提由夹具自证）。无盘符宿主（Linux/macOS）⇒ `null`（调用腿显式 skip）。 */
function mkDriveProject(parent, name) {
  const dir = mkProject(parent, name)
  return /^[A-Za-z]:/.test(dir) ? dir.replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":") : null
}
/** 变体键 ∥ 主键（单源 = 核函数——键只在核一处生成，本档零第二份哈希式）。 */
const variantKeyOf = (root) => MIG.legacyKeyVariants(root)[0]
const mainKeyOf = (root) => LDB.ledgerKey(root)
/** 单行文案断言（逐字 ∧ 单行 ∧ 双指引词）。 */
function assertNoticeText(text, expected, tag) {
  assert.equal(text, expected, `${tag}：逐字`)
  assert.equal(text.split("\n").length, 1, `${tag}：单行`)
  assert.ok(text.includes("thincoder ledger audit") && text.includes("thincoder ledger migrate"), `${tag}：含 audit ∥ migrate 指引`)
}

// ── U-VN1 正常·变体对夹具两拍：变体键档在盘 ⇒ 单行文案逐字（zh ∥ en）──────

test("U-VN1 正常·变体对两拍：变体键档在盘（非库文件亦计）⇒ zh ∥ en 逐字单行（主键档不在 / 在场同判）", async (t) => {
  const base = tmpBase("u1")
  try {
    const N = await notice()
    const p = mkDriveProject(base, "proj")
    if (!p) { t.skip("宿主无盘符（Linux/macOS）——F-LX3 为盘符作用域，夹具不可构造"); return }
    const dir = mkLedgerDir(base)
    const vk = variantKeyOf(p)
    assert.ok(vk, "夹具 = 盘符打头路径（变体键非空）")
    writeFileSync(join(dir, `${vk}.db`), "not-a-sqlite-db", "utf8") // 判据 = 文件存在（非库文件亦计——零开库）
    N._resetLedgerVariantNoticeForTest()
    const zh = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    N._resetLedgerVariantNoticeForTest()
    const en = N.ledgerVariantNotice({ cwd: p, dir, locale: "en" })
    out("U-VN1·①", `主键档不在 ⇒ zh=${JSON.stringify(zh)}`)
    assertNoticeText(zh, ZH_TEXT, "① zh")
    assertNoticeText(en, EN_TEXT, "① en")
    // ② 主键档在场（内容任意——主库在否均提示）
    writeFileSync(join(dir, `${mainKeyOf(p)}.db`), "still-not-a-sqlite-db", "utf8")
    N._resetLedgerVariantNoticeForTest()
    const zh2 = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    out("U-VN1·②", `主键档在场 ⇒ ${JSON.stringify(zh2)}`)
    assertNoticeText(zh2, ZH_TEXT, "② zh")
  } finally { cleanup() }
})

// ── U-VN2 边界·零输出两拍：仅主库 ∥ 目录空 / 无目录 ⇒ null ─────────────────

test("U-VN2 边界·零输出两拍：① 仅主键档在场 ② 台账目录空 ∥ 无目录 ⇒ null（零动作零输出）", async () => {
  const base = tmpBase("u2")
  try {
    const N = await notice()
    const p = mkProject(base, "proj")
    const dir = mkLedgerDir(base)
    writeFileSync(join(dir, `${mainKeyOf(p)}.db`), "main-only", "utf8")
    const emptyDir = join(base, "ledger-empty")
    mkdirSync(emptyDir, { recursive: true })
    N._resetLedgerVariantNoticeForTest()
    const r1 = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    N._resetLedgerVariantNoticeForTest()
    const r2 = N.ledgerVariantNotice({ cwd: p, dir: emptyDir, locale: "zh" })
    N._resetLedgerVariantNoticeForTest()
    const r3 = N.ledgerVariantNotice({ cwd: p, dir: join(base, "no-such-ledger-dir"), locale: "zh" })
    out("U-VN2", `① only-main=${JSON.stringify(r1)} ② empty=${JSON.stringify(r2)} ②′ missing=${JSON.stringify(r3)}`)
    assert.equal(r1, null, "仅主库 ⇒ 零输出")
    assert.equal(r2, null, "目录空 ⇒ 零输出")
    assert.equal(r3, null, "无目录 ⇒ 零输出（探针吞错）")
  } finally { cleanup() }
})

// ── U-VN3 错误·抛错注入：exists 抛错 ⇒ null 零抛（静默降级）────────────────

test("U-VN3 错误·抛错注入：exists 抛错 ⇒ null ∧ 零抛（静默降级——启动照常）", async (t) => {
  const base = tmpBase("u3")
  try {
    const N = await notice()
    const p = mkDriveProject(base, "proj")
    if (!p) { t.skip("宿主无盘符（Linux/macOS）——F-LX3 为盘符作用域，夹具不可构造"); return }
    const dir = mkLedgerDir(base)
    writeFileSync(join(dir, `${variantKeyOf(p)}.db`), "x", "utf8")
    N._resetLedgerVariantNoticeForTest()
    let r; let threw = null
    try { r = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh", exists: () => { throw new Error("vn-probe-boom") } }) }
    catch (e) { threw = e }
    out("U-VN3", `r=${JSON.stringify(r)} threw=${threw ? threw.message : "none"}`)
    assert.equal(threw, null, "零抛")
    assert.equal(r, null, "静默 null")
  } finally { cleanup() }
})

// ── U-VN4 边界·每进程至多一次（连唤两次 + 重置缝）──────────────────────────

test("U-VN4 边界·每进程至多一次：第 1 次文案 ∥ 第 2 次 null ∥ 重置缝后再出", async (t) => {
  const base = tmpBase("u4")
  try {
    const N = await notice()
    const p = mkDriveProject(base, "proj")
    if (!p) { t.skip("宿主无盘符（Linux/macOS）——F-LX3 为盘符作用域，夹具不可构造"); return }
    const dir = mkLedgerDir(base)
    writeFileSync(join(dir, `${variantKeyOf(p)}.db`), "x", "utf8")
    N._resetLedgerVariantNoticeForTest()
    const first = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    const second = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    N._resetLedgerVariantNoticeForTest()
    const third = N.ledgerVariantNotice({ cwd: p, dir, locale: "zh" })
    out("U-VN4", `1st=${JSON.stringify(first)} 2nd=${JSON.stringify(second)} 3rd=${JSON.stringify(third)}`)
    assert.equal(first, ZH_TEXT, "第 1 次文案")
    assert.equal(second, null, "第 2 次零动作（核内闩）")
    assert.equal(third, ZH_TEXT, "重置缝后再出")
  } finally { cleanup() }
})

// ── U-VN5 边界·负向锁：翻转拼写 ≡ 主键 ⇒ null（主库不自报「变体」）─────────

test("U-VN5 边界·负向锁：小写盘符拼写项目根（翻转拼写 ≡ 主键）⇒ null——k !== ledgerKey(root) 过滤", async (t) => {
  const base = tmpBase("u5")
  try {
    const N = await notice()
    const p = mkDriveProject(base, "proj")
    if (!p) { t.skip("宿主无盘符（Linux/macOS）——F-LX3 为盘符作用域，夹具不可构造"); return }
    const dir = mkLedgerDir(base)
    const lower = p[0].toLowerCase() + p.slice(1)
    assert.notEqual(lower, p, "夹具 = 盘符拼写已钉死大写（小写拼写为独立串）")
    const flipKey = variantKeyOf(lower)
    assert.equal(flipKey, mainKeyOf(lower), "前置：翻转拼写键 ≡ 归一后主键（同哈希）")
    writeFileSync(join(dir, `${flipKey}.db`), "x", "utf8")
    N._resetLedgerVariantNoticeForTest()
    const r = N.ledgerVariantNotice({ cwd: lower, dir, locale: "zh" })
    out("U-VN5", `键 ${flipKey} 在盘（小写拼写根）⇒ ${JSON.stringify(r)}`)
    assert.equal(r, null, "主库不自报「变体」（k !== 主键 过滤）")
  } finally { cleanup() }
})

// ── U-VN6 集成·启动面渲染腿（showStartup 直驱 + 接线静态锁）────────────────

test("U-VN6 集成·启动面渲染腿：① 在场 ⇒ 恰一行 ② 缺省 ⇒ 零行；附接线静态锁（计算段 ∥ 渲染句在盘）", async () => {
  const base = tmpBase("u6")
  try {
    const { showStartup } = await load("thincoder-cli/src/tui/startup.mjs")
    const p = mkProject(base, "proj")
    const lines = []
    const mkCtx = (opts) => ({
      agent: { provider: { apiKey: "k", model: "m" }, activeProvider: "p", tools: [], cwd: p },
      state: {},
      opts,
      pushLine: (text) => lines.push(text),
      pushLabel: (text) => lines.push(`[label] ${text}`),
      render: () => {},
      startWizard: () => {},
    })
    showStartup(mkCtx({ ledgerVariantNotice: "…变体键库提示行…" }))
    const hit = lines.filter((l) => l === "…变体键库提示行…")
    out("U-VN6·①", `lines=${JSON.stringify(lines)}`)
    assert.equal(hit.length, 1, "① 恰一行")
    lines.length = 0
    showStartup(mkCtx({}))
    out("U-VN6·②", `lines=${JSON.stringify(lines)}`)
    assert.equal(lines.filter((l) => l === "…变体键库提示行…").length, 0, "② 缺省 ⇒ 零行")
    // 接线静态锁（计算段 ∥ 渲染句在盘）
    const cliText = readFileSync(join(ROOT, "thincoder-cli/src/command-interactive.mjs"), "utf8")
    const startupText = readFileSync(join(ROOT, "thincoder-cli/src/tui/startup.mjs"), "utf8")
    assert.ok(cliText.includes("@thincoder/core/ledger-variant-notice.mjs"), "计算段：动态 import 在盘")
    assert.ok(cliText.includes("ledgerVariantNotice,"), "计算段：opts 键在盘")
    assert.ok(cliText.includes("locale: agent.config?.locale"), "计算段：locale 取值 = agent.config?.locale")
    assert.ok(startupText.includes("if (opts.ledgerVariantNotice) pushLine(opts.ledgerVariantNotice, C.warn)"), "渲染句在盘")
  } finally { cleanup() }
})
