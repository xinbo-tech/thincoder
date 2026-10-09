/**
 * 2026-10-09-light-channel-code-path.test.mjs — 轻通道代码笔通路批 · 批次本地单元件（随批档存 · 不进仓套件）。
 * 名随批次档 · 住批次目录；复跑（仓根 thincoder/ 下）：
 *   node --test docs/batches/2026-10-09-light-channel-code-path.test.mjs
 *
 * 腿（设计档 `LIGHT-CHANNEL.md` §2.8 实证判据 ∥ 批档 §2.5）：
 *   J1 在盘放行：两件双在盘（轮次台账行 `在途` 携「收尾链待跑」+ 指针 → 轮档 §1「进行中」）⇒ 代码目标写
 *      无「engineering design gate」拒（到达执行段 · 恰执行一次）。
 *   J2 无盘仍拒：① 无两件 ∥ ② 轮档独在（未上账）∥ ③ 行独在·指针失据（上账后轮档被撤）⇒ 同形仍拒。
 *   J3 无标记 ⇒ 拒（全链批行形——标记 = 闸凭据）。
 *   J4 行非在途 ⇒ 拒（行停「待设计」——信号不成）。
 *   J5 档已收口 ⇒ 拒（§1 状态行「已收口」——信号随收口熄灭）。
 * 夹具：工程模式父侧门直驱 `executeToolCalls`（depth 0 · 零活槽 · auto-approve——沿 2026-10-08-gate-jurisdiction
 * 同形）；台账库 = `_setLedgerDirForTest` 临时目录 + 临时项目（PROJECT-MANIFEST.json）——不碰真实用户目录。
 * 红绿对照（随批档 §5）：先红 = 闸未开轻通道通路时 J1 被拒（`engineering design gate`）；后绿 = J1 放行
 * 且 J2–J5 仍逐形拒（零执行）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const DISPATCH = await mod("thincoder-core/agent/dispatch.mjs")
const CMD = await mod("thincoder-core/ledger-cmd.mjs")
const DB = await mod("thincoder-core/ledger-db.mjs")

const created = []
const tmp = (tag) => { const d = mkdtempSync(join(tmpdir(), `lcpen-${tag}-`)); created.push(d); return d }
test.after(() => { for (const d of created.splice(0)) { try { rmSync(d, { recursive: true, force: true }) } catch { /* 尽力清理 */ } } })

DB._setLedgerDirForTest(join(tmp("ledger-root"), "ledger")) // 台账库落临时目录（不碰真实用户目录）
test.after(() => DB._resetLedgerDirForTest())

const ROUND_DOC = "docs/batches/2026-10-09-round-fixture.md"
const MARKER = "收尾链待跑"

/** 项目夹具：PROJECT-MANIFEST.json（src = 默认 code 段）＋ 轮档（§1 状态行可参数化——J5 用；record:false = 无档）。 */
function mkProject(base, name, { statusLine = "🔄 进行中（轮次夹具）", record = true } = {}) {
  const dir = join(base, name)
  mkdirSync(join(dir, "src"), { recursive: true })
  writeFileSync(join(dir, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, phase: "initial-dev" }, null, 2))
  if (record) {
    mkdirSync(join(dir, "docs", "batches"), { recursive: true })
    writeFileSync(join(dir, ROUND_DOC), `# 轮次夹具\n\n## §1 讨论（父侧）\n**状态行**：${statusLine}\n`)
  }
  return dir
}

/** 开轮两件（启动即挂账形——轮档已在盘）：台账行连步至在途；`to` = 停点（J4 用「待设计」）；`title` 可换形（J3）。 */
function bookRound(project, { title = `轻通道轮次夹具 · ${MARKER}`, to = "在途" } = {}) {
  const id = CMD.ledgerAdd({ cwd: project, row: {
    kind: "requirement", title, board: "core", task_book: ROUND_DOC,
    evidence: "轮次夹具 · 收尾未落 ⇒ 不许核销",
  }})
  CMD.ledgerUpdate({ cwd: project, id, patch: { status: "待设计" }, executorSessionId: null })
  if (to === "在途") CMD.ledgerUpdate({ cwd: project, id, patch: { status: "在途" }, executorSessionId: null })
  return id
}

/* ── 门面夹具（工程模式父侧门 · 零活槽 · depth 0 · auto-approve——沿 2026-10-08-gate-jurisdiction） ── */

let runs = 0 // 执行计数（「恰执行一次」/「拒 ⇒ 零执行」判据）
const toolFor = (name) => ({ name, readonly: false, parallel: false, execute: async () => { runs += 1; return `exec#${runs}` } })
const agentAt = (cwd) => ({
  cwd, planMode: false, autoApprove: true, _role: null, _engTaskAuthorized: false,
  _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
  config: { agent: { engineering: true } },
})
/** 单条写调用 ⇒ 结果行（默认目标 = 项目内 code 段 `src/x.mjs`）。 */
const invoke = (cwd, path = "src/x.mjs") =>
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

/* ── J1：在盘放行（判定句 ①——一笔实证） ─────────────────────────────────────── */

test("J1 双件在盘 ⇒ 代码目标写放行（到达执行段 · 恰执行一次）", async () => {
  const P = mkProject(tmp("j1"), "proj")
  bookRound(P)
  const r = await expectPass("J1 两件在盘", P)
  assert.equal(String(r.result).startsWith("exec#"), true, "到达执行段（工具真执行）")
})

/* ── J2：无盘仍拒（判定句 ②——一笔实证 + 单件反例） ───────────────────────────── */

test("J2 无盘仍拒：无两件 ∥ 轮档独在 ∥ 行独在·指针失据", async () => {
  const A = mkProject(tmp("j2a"), "proj", { record: false })
  await expectDeny("J2① 无两件（无行无档）", A)
  const B = mkProject(tmp("j2b"), "proj")
  await expectDeny("J2② 轮档独在（未上账——全链批 ∥ 随手档形）", B)
  const C = mkProject(tmp("j2c"), "proj")
  bookRound(C)
  unlinkSync(join(C, ROUND_DOC)) // 上账后撤档 ⇒ 行独在（指针失据）
  await expectDeny("J2③ 行独在·指针失据", C)
})

/* ── J3：无标记 ⇒ 拒（全链批行形——标记 = 闸凭据） ──────────────────────────── */

test("J3 行在途携指针但无「收尾链待跑」标记 ⇒ 拒（全链批行不构成信号）", async () => {
  const P = mkProject(tmp("j3"), "proj")
  bookRound(P, { title: "全链批行形（无标记）" })
  await expectDeny("J3 无标记", P)
})

/* ── J4：行非在途 ⇒ 拒 ─────────────────────────────────────────────────────── */

test("J4 行停「待设计」（标记 ∥ 指针 ∥ 开轮档齐备）⇒ 拒（信号不成）", async () => {
  const P = mkProject(tmp("j4"), "proj")
  bookRound(P, { to: "待设计" })
  await expectDeny("J4 行非在途", P)
})

/* ── J5：档已收口 ⇒ 拒 ─────────────────────────────────────────────────────── */

test("J5 轮档 §1 已收口 ⇒ 拒（信号随收口熄灭——收口自闭）", async () => {
  const P = mkProject(tmp("j5"), "proj", { statusLine: "✅ 已收口 2026-10-09" })
  bookRound(P)
  await expectDeny("J5 档已收口", P)
})
