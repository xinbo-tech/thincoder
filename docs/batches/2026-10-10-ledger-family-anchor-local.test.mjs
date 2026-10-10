/**
 * 2026-10-10-ledger-family-anchor-local.test.mjs — 台账族发现锚本地 ∥ 轻通道闸候选面批 · 批次本地件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-ledger-family-anchor-local.test.mjs`
 *
 * 腿（批档 §2.6 + §2.10 #5）：
 *   N1 本案回归：无库锚 ∥ 祖先兄弟有库（`d:/test` 形夹具）⇒ 祖先兄弟不认领（marker = null）；
 *   N2 容器根锚（其下含项目）⇒ 族内已读项目两池分列求和（F2 句正形）；
 *   N3 自身锚负向锁：锚 = 项目根（自身带库）⇒ marker = 自身两池（兄弟不掺）；
 *   N4 深锚归属回归：锚 = 项目内子目录 ⇒ marker = 归属项目数（`findProject` 照用）；
 *   N5 超限降级：锚下目录项数 > `MAX_SIBLING_SCAN` ⇒ 该层判空 ⇒ marker = null（空即终态——不向父层认领）；
 *   W1 工作区锚放行：会话锚 = 工作区（两子项目），轮账挂子项目 a ⇒ 子项目 a 内代码目标写放行（恰执行一次）；
 *   W2 两件缺席仍拒（负向锁）∥ W3 行在 · 轮档被撤（指针失据）⇒ 仍拒（负向锁）；
 *   W4 坏档候选与命中候选并存 ⇒ 命中候选照放行（坏档候选停本候选——总判不因他候选读错而失）。
 * 夹具：N 腿 = 核 `runLedgerScan` 实拍链 + `_setLedgerDirForTest` 临时库目录 + 临时项目树（循
 * `2026-10-03-ledger-family-aggregate.test.mjs`）；W 腿 = 工程模式父侧门直驱 `executeToolCalls`（depth 0 ·
 * 零活槽 · auto-approve——循 `2026-10-09-light-channel-code-path.test.mjs`）。
 * 夹具注（祖先链）：无库锚的每一级祖先置 ≥2 个带档子目录——否则 `resolveProjectRoot` 会把该级解析到
 * 唯一带档子目录、`ledgerDbPath` 键随之别名到该子项目的库（夹具自伤，非被测语义）。
 * 红绿对照（随批档 §5）：修复前 N1 红（祖先兄弟顶替——现场 `d:/test` 形）∥ N5 红（回退向上认领父层）
 * ∥ W1 ∥ W4 红（工作区锚谓词恒 false ⇒ 两件在盘仍拒）；修复后全绿，W2 ∥ W3 双向皆拒。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const LDB = await load("thincoder-core/ledger-db.mjs") // 库键 / 目录注入缝
const LCMD = await load("thincoder-core/ledger-cmd.mjs") // ledgerAdd（行夹具）
const SURFACE = await load("thincoder-core/ledger-surface.mjs") // runLedgerScan（实拍链）
const DISPATCH = await load("thincoder-core/agent/dispatch.mjs") // 工程模式父侧门

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `lfa-${tag}-`)); created.push(d); return d }
test.after(() => { for (const d of created.splice(0)) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 尽力清理 */ } } })

LDB._setLedgerDirForTest(join(tmp("ledger-root"), "ledger")) // 台账库落临时目录（不碰真实用户目录）
test.after(() => LDB._resetLedgerDirForTest())

/* ── 共用夹具（N 腿——循 2026-10-03-ledger-family-aggregate.test.mjs） ──────── */

/** 项目目录（带 manifest——归属解析确定，不受临时基底祖先影响）。 */
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

/** 实拍：直驱核 `runLedgerScan`（`state.ledger` = 被测出站面）。 */
async function scanAt(anchor) {
  const state = { ledger: null }
  await SURFACE.runLedgerScan({ state, anchor })
  return state.ledger
}

/** `d:/test` 形基底：锚目录无库 ∥ 父层有含库兄弟；另置第二带档子目录（断开父层唯一解析——
 *  防键别名自伤，见头注）。返回 { anchorDir, sibling }。 */
function mkFieldShape(tag, siblingRows) {
  const base = tmp(tag)
  const anchorDir = join(base, "test")
  mkdirSync(anchorDir, { recursive: true })
  const sibling = mkProject(base, "repos1")
  mkProject(base, "repos2")
  register(sibling, siblingRows)
  return { anchorDir, sibling }
}

const rows23 = [
  { kind: "requirement", title: "S 需求一" }, { kind: "requirement", title: "S 需求二" },
  { kind: "tech_todo", title: "S 待办一" }, { kind: "tech_todo", title: "S 待办二" }, { kind: "tech_todo", title: "S 待办三" },
] // 2·3

/* ── N1 本案回归：无库锚 ∥ 祖先兄弟有库 ⇒ 祖先兄弟不认领 ───────────────────── */

test("N1 本案回归：无库锚 ∥ 祖先兄弟有库（d:/test 形）⇒ 祖先兄弟不认领（marker = null）", async () => {
  const { anchorDir, sibling } = mkFieldShape("n1", rows23)
  const own = await scanAt(sibling)
  out("N1·夹具自证", `兄弟自身 marker=${JSON.stringify(own.marker)}`)
  assert.equal(own.marker, "台账 2·3", "夹具自证：含库兄弟可扫（空范围断言不空转）")
  const ledger = await scanAt(anchorDir)
  out("N1", `marker=${JSON.stringify(ledger.marker)} warn=${ledger.warn}（祖先兄弟 2·3 在盘——顶替即红）`)
  assert.equal(ledger.marker, null, "无库锚 ⇒ 其下无含库子目录 ⇒ 空范围（祖先兄弟不认领）")
  assert.equal(ledger.warn, false)
})

/* ── N2 容器根锚 ⇒ 族内已读项目两池分列求和 ────────────────────────────────── */

test("N2 容器根锚（其下含项目）⇒ 族内已读项目两池分列求和", async () => {
  const base = tmp("n2")
  const container = join(base, "ws")
  const a = mkProject(container, "proj-a")
  const b = mkProject(container, "proj-b")
  register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }]) // 1·1
  register(b, [ // 2·3
    { kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" },
    { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" },
  ])
  const ledger = await scanAt(container)
  out("N2", `marker=${JSON.stringify(ledger.marker)} warn=${ledger.warn}`)
  assert.equal(ledger.marker, "台账 3·4", "容器根锚 ⇒ 两池分列求和（A 1·1 + B 2·3）")
  assert.equal(ledger.warn, false, "无老化 ∥ 无死执行者 ⇒ warn=false")
})

/* ── N3 自身锚负向锁：锚 = 项目根（自身带库）⇒ 兄弟不掺 ────────────────────── */

test("N3 自身锚负向锁：锚 = 项目根（自身带库）⇒ marker = 自身两池（兄弟不掺）", async () => {
  const base = tmp("n3")
  const container = join(base, "ws")
  const a = mkProject(container, "proj-a")
  const b = mkProject(container, "proj-b")
  register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }]) // 1·1
  register(b, [ // 2·3
    { kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" },
    { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" },
  ])
  const ledger = await scanAt(a)
  out("N3", `marker=${JSON.stringify(ledger.marker)}（B = 2·3 在盘——掺入即红）`)
  assert.equal(ledger.marker, "台账 1·1", "具体项目锚 ⇒ 只显自身（兄弟不掺）")
})

/* ── N4 深锚归属回归：锚 = 项目内子目录 ⇒ 归属项目数 ───────────────────────── */

test("N4 深锚归属回归：锚 = 项目内子目录 ⇒ marker = 归属项目数（findProject 照用）", async () => {
  const base = tmp("n4")
  const container = join(base, "ws")
  const a = mkProject(container, "proj-a")
  const b = mkProject(container, "proj-b")
  register(a, [{ kind: "requirement", title: "A 需求一" }, { kind: "tech_todo", title: "A 待办一" }]) // 1·1
  register(b, [ // 2·3
    { kind: "requirement", title: "B 需求一" }, { kind: "requirement", title: "B 需求二" },
    { kind: "tech_todo", title: "B 待办一" }, { kind: "tech_todo", title: "B 待办二" }, { kind: "tech_todo", title: "B 待办三" },
  ])
  const deep = join(a, "sub", "deep")
  mkdirSync(deep, { recursive: true })
  const ledger = await scanAt(deep)
  out("N4", `marker=${JSON.stringify(ledger.marker)}（锚 = proj-a/sub/deep——归属 proj-a）`)
  assert.equal(ledger.marker, "台账 1·1", "项目内深锚 ⇒ 归属项目数（findProject 照用）")
})

/* ── N5 超限降级：锚下目录项数 > MAX_SIBLING_SCAN ⇒ 该层判空 ⇒ null ────────── */

test("N5 超限降级：锚下目录项数 > MAX_SIBLING_SCAN ⇒ 该层判空 ⇒ marker = null（空即终态）", async () => {
  const base = tmp("n5")
  const over = join(base, "over")
  mkdirSync(over, { recursive: true })
  for (let i = 1; i <= 100; i += 1) mkdirSync(join(over, `pad-${String(i).padStart(3, "0")}`)) // 100 枚占位目录
  const x = mkProject(over, "proj-x") // 第 101 ∕ 102 枚目录项（真项目——超限层不因它翻面）
  const y = mkProject(over, "proj-y")
  register(x, [{ kind: "requirement", title: "X 需求一" }]) // 1·0
  register(y, [{ kind: "tech_todo", title: "Y 待办一" }]) // 0·1
  const sibling = mkProject(base, "repos1") // 父层含库兄弟（旧径回退认领点）
  mkProject(base, "repos2") // 第二带档子目录（断开父层唯一解析——防键别名自伤）
  register(sibling, rows23)
  const ledger = await scanAt(over)
  out("N5", `marker=${JSON.stringify(ledger.marker)}（over 下 102 枚目录项——超限层判空；父层兄弟 2·3 在盘）`)
  assert.equal(ledger.marker, null, "超限 ⇒ 该层判空 ⇒ 空即终态（不向父层认领）")
  assert.equal(ledger.warn, false)
})

/* ── W 腿夹具（工程模式父侧门直驱——循 2026-10-09-light-channel-code-path） ── */

const ROUND_DOC = "docs/batches/2026-10-10-round-fixture.md"
const MARKER = "收尾链待跑"

/** 工作区夹具：两子项目（各带 manifest + src 段）——会话锚 = 工作区（歧义锚形）。 */
function mkWs(tag) {
  const ws = tmp(tag)
  const mk = (name) => {
    const dir = mkProject(ws, name)
    mkdirSync(join(dir, "src"), { recursive: true })
    return dir
  }
  return { ws, a: mk("proj-a"), b: mk("proj-b") }
}

/** 轮次批档（§1 状态行可参数化——W3 撤档用其路径）。 */
function writeRoundDoc(project, statusLine = "🔄 进行中（轮次夹具）") {
  mkdirSync(join(project, "docs", "batches"), { recursive: true })
  writeFileSync(join(project, ROUND_DOC), `# 轮次夹具\n\n## §1 讨论（父侧）\n**状态行**：${statusLine}\n`)
}

/** 开轮两件（轮档已在盘）：台账行连步至在途。 */
function bookRound(project) {
  const id = LCMD.ledgerAdd({ cwd: project, row: {
    kind: "requirement", title: `轻通道轮次夹具 · ${MARKER}`, board: "core", task_book: ROUND_DOC,
    evidence: "轮次夹具 · 收尾未落 ⇒ 核销待收口",
  }})
  LCMD.ledgerUpdate({ cwd: project, id, patch: { status: "待设计" }, executorSessionId: null })
  LCMD.ledgerUpdate({ cwd: project, id, patch: { status: "在途" }, executorSessionId: null })
  return id
}

let runs = 0 // 执行计数（「恰执行一次」/「拒 ⇒ 零执行」判据）
const toolFor = (name) => ({ name, readonly: false, parallel: false, execute: async () => { runs += 1; return `exec#${runs}` } })
const agentAt = (cwd) => ({
  cwd, planMode: false, autoApprove: true, _role: null, _engTaskAuthorized: false,
  _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
  config: { agent: { engineering: true } },
})
const invoke = (cwd, path) =>
  DISPATCH.executeToolCalls(
    agentAt(cwd), new Map([["write", toolFor("write")]]),
    [{ id: "id-1", name: "write", arguments: JSON.stringify({ path }) }], {}, 0,
  )

/** 期望拒绝（reason 逐字）+ 零执行。 */
async function expectDeny(label, cwd, path) {
  const before = runs
  const res = await invoke(cwd, path)
  assert.equal(res[0]?.denied, true, `拒：${label}（实读 denied=${res[0]?.denied ?? false}）`)
  assert.equal(res[0]?.reason, "engineering design gate", `拒因逐字：${label}（实读 ${res[0]?.reason}）`)
  assert.equal(runs, before, `拒 ⇒ 零执行：${label}`)
  return res[0]
}

/** 期望放行 + 恰执行一次。 */
async function expectPass(label, cwd, path) {
  const before = runs
  const res = await invoke(cwd, path)
  assert.equal(res[0]?.denied ?? false, false, `放行：${label}（拒因 ${res[0]?.reason ?? "—"}）`)
  assert.equal(res[0]?.ok, true, `执行 ok：${label}`)
  assert.equal(runs - before, 1, `恰执行一次：${label}`)
  return res[0]
}

/* ── W1 工作区锚放行（候选面 = 锚 + 直接子目录一层） ───────────────────────── */

test("W1 工作区锚放行：轮账挂子项目 a ⇒ a 内代码目标写放行（恰执行一次）", async () => {
  const { ws, a } = mkWs("w1")
  writeRoundDoc(a)
  bookRound(a)
  const r = await expectPass("W1 工作区锚 · 两件在盘", ws, "proj-a/src/x.mjs")
  out("W1", `result=${String(r.result)}（工作区锚 = ${ws}）`)
  assert.equal(String(r.result).startsWith("exec#"), true, "到达执行段（工具真执行）")
})

/* ── W2 两件缺席仍拒（负向锁） ─────────────────────────────────────────────── */

test("W2 两件缺席仍拒：同形工作区无账 ⇒ 同写仍拒（零执行）", async () => {
  const { ws } = mkWs("w2")
  const r = await expectDeny("W2 无两件（无行无档）", ws, "proj-a/src/x.mjs")
  out("W2", `denied=${r.denied} reason=${r.reason}`)
})

/* ── W3 缺一件仍拒：行在 · 轮档被撤（指针失据） ────────────────────────────── */

test("W3 缺一件仍拒：行在 · 轮档被撤（指针失据）⇒ 同写仍拒（零执行）", async () => {
  const { ws, a } = mkWs("w3")
  writeRoundDoc(a)
  bookRound(a)
  unlinkSync(join(a, ROUND_DOC)) // 上账后撤档 ⇒ 行独在（指针失据）
  const r = await expectDeny("W3 行在 · 指针失据", ws, "proj-a/src/x.mjs")
  out("W3", `denied=${r.denied} reason=${r.reason}`)
})

/* ── W4 坏档候选与命中候选并存 ⇒ 命中候选照放行 ───────────────────────────── */

test("W4 坏档候选与命中候选并存 ⇒ 命中候选照放行（坏档候选停本候选）", async () => {
  const { ws, a, b } = mkWs("w4")
  mkdirSync(LDB.ledgerDirPath(), { recursive: true })
  writeFileSync(LDB.ledgerDbPath(a), "not-a-sqlite-db", "utf8") // 坏档候选（读错 ⇒ 停本候选）
  writeRoundDoc(b)
  bookRound(b)
  const r = await expectPass("W4 坏档候选 + 命中候选", ws, "proj-b/src/x.mjs")
  out("W4", `result=${String(r.result)}（proj-a 坏档 ∥ proj-b 两件在盘）`)
  assert.equal(String(r.result).startsWith("exec#"), true, "到达执行段（总判不因他候选读错而失）")
})
