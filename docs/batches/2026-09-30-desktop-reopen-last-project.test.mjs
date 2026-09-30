/**
 * 2026-09-30-desktop-reopen-last-project.test.mjs — 批内件（桌面重启自动重开批 · 台账 #734 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-09-30-desktop-reopen-last-project.md` §2（KD-56 机制 ∥ 评审修复轮五号）∥ §五。
 * 五腿（全绿 = 批内验收）：
 *   腿 1 命中（「上次打开」≠「最近活跃」）：P 本端记录最新 ∥ Q 数据 mtime 更新且无本端记录 ⇒
 *        `restoreLastProject()` ⇒ `currentCwd() === P`；负控 = 活跃序首位 = Q（「最近目录」面确以 Q 居首）∥
 *        他端记录（`.cli` / `.vscode`）更新 ⇒ 仍 P；并列定序 = 同级按族哈希升序（两次调用等值）；
 *   腿 2 端分离：仅他端记录（`.cli` / `.vscode` —— 数据面完好）⇒ null（冷态）；
 *   腿 3 降级·目录已删：记录指向目录不在盘 ⇒ null + 零抛 + 盘面零改动 + `console.error` 恰一行；
 *   腿 4 降级·族无可读 `cwd`：标记在盘而族数据文件缺（次新族有效 ⇒ 不误落）∥ 坏（裸 json 坏 + 有效槽档
 *        ⇒ 候选级终止不降级到更大槽号）⇒ null + 零抛 + 恰一行；
 *   腿 5 零记录：空 sessions 根 ⇒ null + 零写 + 零日志。
 * 夹具口径：全部以**显式 mtime** 落盘（`utimesSync` —— 免粒度依赖——修复轮 ④）；沙箱 = 核会话根隔离缝
 * `_setSessionsDirForTest`；`projects.mjs` 按腿取**新实例**（查询串 —— 模块级 `current` 舱内隔离）。
 * 本件不入仓套件（批内件 · 随批留存）；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-desktop-reopen-last-project.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/session-slots.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const shell = await mod("thincoder-desktop/src/main/session-slots.mjs") // 端壳（END ∥ 沙箱缝 ∥ sessionPath）
const projectsUrl = pathToFileURL(resolve(ROOT, "thincoder-desktop/src/main/projects.mjs")).href
const freshProjects = (leg) => import(`${projectsUrl}?leg=${leg}`) // 每腿新实例（模块级 `current` 零跨腿残留）

const T0 = Date.UTC(2026, 0, 1) // 显式 mtime 基线
const at = (ms) => new Date(ms)

// ─── 夹具 ────────────────────────────────────────────────────────────────────

/** 临时家 = 沙箱 sessions 根；退出即复位缝 + 清目录。 */
async function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), "reopen-leg-"))
  const sessions = join(root, "sessions")
  mkdirSync(sessions, { recursive: true })
  shell._setSessionsDirForTest(sessions)
  try { return await fn({ root, sessions }) } finally {
    shell._resetSessionsDirForTest()
    rmSync(root, { recursive: true, force: true })
  }
}

const prefixOf = (cwd) => basename(shell.sessionPath(cwd)) // `{hash}.json`（哈希单源 = 核）

function put(sessions, name, data, mtimeMs) {
  const p = join(sessions, name)
  writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data))
  utimesSync(p, at(mtimeMs), at(mtimeMs))
}

/** 族档三件套：数据文件（`cwd`）必有；本端记录 / 他端记录按需。返回族前缀。 */
function family(sessions, cwd, { dataMtime, desktopMtime = null, cliMtime = null, vscodeMtime = null } = {}) {
  const prefix = prefixOf(cwd)
  put(sessions, prefix, { cwd }, dataMtime)
  if (desktopMtime !== null) put(sessions, `${prefix}.manifest.desktop`, { slot: 1, updatedAt: desktopMtime }, desktopMtime)
  if (cliMtime !== null) put(sessions, `${prefix}.manifest.cli`, { slot: 1, updatedAt: cliMtime }, cliMtime)
  if (vscodeMtime !== null) put(sessions, `${prefix}.manifest.vscode`, { slot: 1, updatedAt: vscodeMtime }, vscodeMtime)
  return prefix
}

/** 盘面快照（名 → { size, mtimeMs, text } —— 「盘面零改动」断言面）。 */
function snapshotDir(dir) {
  const out = new Map()
  for (const name of readdirSync(dir)) {
    const s = statSync(join(dir, name))
    out.set(name, { size: s.size, mtimeMs: s.mtimeMs, text: readFileSync(join(dir, name), "utf8") })
  }
  return out
}

/** `console.error` 捕获（同步面）—— 日志分档判据（无记录 ∥ 命中 ⇒ 零行；两档真降级 ⇒ 恰一行）。 */
function capture(fn) {
  const lines = []
  const original = console.error
  console.error = (...args) => { lines.push(args.map(String).join(" ")) }
  try { return { value: fn(), lines } } finally { console.error = original }
}

// ─── 腿 1 · 命中（「上次打开」≠「最近活跃」）────────────────────────────────────

test("腿 1 · 命中：本端记录最新者（≠ 最近活跃；两端负控 ∥ 并列定序）", async () => {
  await withRoot(async ({ root, sessions }) => {
    const pDir = join(root, "projP")
    const qDir = join(root, "projQ")
    mkdirSync(pDir)
    mkdirSync(qDir)
    // P：本端记录最新；Q：数据 mtime 更新 + 他端两记录更新（活跃面全在 Q、本端记录面无）
    family(sessions, pDir, { dataMtime: T0, desktopMtime: T0 + 6000 })
    family(sessions, qDir, { dataMtime: T0 + 9000, cliMtime: T0 + 12000, vscodeMtime: T0 + 15000 })
    const before = snapshotDir(sessions)
    const projects = await freshProjects("hit")
    const r = capture(() => projects.restoreLastProject())
    assert.equal(r.value, pDir, "命中 = 本端记录最新者的族 cwd")
    assert.equal(projects.currentCwd(), pDir)
    assert.equal(projects.lastOpenedCwd(), pDir, "记录面读面同值")
    assert.deepEqual(r.lines, [], "命中 ⇒ 零日志")
    // 负控①：「最近目录」（活跃序）首位 = Q —— 同盘面、判据分面（活数据面更新不选中）
    assert.equal(projects.recentDirs()[0].cwd, qDir)
    // 负控②：他端记录更新（`.cli` / `.vscode`，更新于 P 的本端记录之后）⇒ 仍选 P ∥ 两次调用等值
    assert.equal(projects.restoreLastProject(), pDir)
    assert.deepEqual(snapshotDir(sessions), before, "恢复面纯读 ⇒ 盘面零改动")
  })
  await withRoot(async ({ root, sessions }) => {
    // 并列定序：同级 mtime ⇒ 按族哈希升序取首（两次调用等值 —— 修复轮 ④）
    const eDir = join(root, "projE")
    const fDir = join(root, "projF")
    mkdirSync(eDir)
    mkdirSync(fDir)
    const ePrefix = family(sessions, eDir, { dataMtime: T0, desktopMtime: T0 + 7000 })
    const fPrefix = family(sessions, fDir, { dataMtime: T0, desktopMtime: T0 + 7000 })
    // 族哈希升序 = 族前缀串升序（同 `.json` 尾缀 —— 逐字比较等价）
    const expected = ePrefix < fPrefix ? eDir : fDir
    const projects = await freshProjects("hit-tie")
    assert.equal(projects.lastOpenedCwd(), expected, "并列 ⇒ 族哈希升序取首")
    const first = capture(() => projects.restoreLastProject())
    assert.equal(first.value, expected)
    assert.deepEqual(first.lines, [])
    assert.equal(projects.restoreLastProject(), expected, "两次调用等值")
  })
})

// ─── 腿 2 · 端分离（不许劫持另两端）─────────────────────────────────────────────

test("腿 2 · 端分离：仅他端记录 ⇒ 冷态", async () => {
  await withRoot(async ({ root, sessions }) => {
    const xDir = join(root, "projX")
    mkdirSync(xDir)
    // 数据面完好 + 两他端记录（本端记录面零条）——「族在而本端无记录」不得触发恢复
    family(sessions, xDir, { dataMtime: T0 + 1000, cliMtime: T0 + 3000, vscodeMtime: T0 + 5000 })
    const before = snapshotDir(sessions)
    const projects = await freshProjects("endsep")
    const r = capture(() => projects.restoreLastProject())
    assert.equal(r.value, null, "仅他端记录 ⇒ 不恢复")
    assert.equal(projects.currentCwd(), null)
    assert.deepEqual(r.lines, [], "无本端记录 = 无记录档 ⇒ 零日志")
    assert.deepEqual(snapshotDir(sessions), before, "盘面零改动")
  })
})

// ─── 腿 3 · 降级·目录已删（冷态 + 零抛 + 零改动 + 一行日志）─────────────────────

test("腿 3 · 降级·目录已删：冷态 + 零抛 + 盘面零改动 + 一行日志", async () => {
  await withRoot(async ({ root, sessions }) => {
    const gone = join(root, "projGone") // 从不创建 —— 记录指向目录不在盘
    family(sessions, gone, { dataMtime: T0 + 1000, desktopMtime: T0 + 5000 })
    const before = snapshotDir(sessions)
    const projects = await freshProjects("gone")
    const r = capture(() => projects.restoreLastProject()) // 抛 ⇒ 本条红（零抛判据）
    assert.equal(r.value, null)
    assert.equal(projects.currentCwd(), null, "冷态照旧")
    assert.equal(r.lines.length, 1, "真降级 ⇒ 恰一行（零静默）")
    assert.match(r.lines[0], /missing on disk/)
    assert.deepEqual(snapshotDir(sessions), before, "记录零触碰（自愈 = 下次成功打开改写最新）")
  })
})

// ─── 腿 4 · 降级·族无可读 cwd（缺 ∕ 坏 + 不误落次新族 + 一行日志）───────────────

test("腿 4 · 降级·族无可读 cwd：缺 ∥ 坏均冷态、不误落次新族 + 一行日志", async () => {
  // (a) 标记在盘而族数据文件缺；次新族（更旧本端记录 + 有效数据）有效 ⇒ 不得误落
  await withRoot(async ({ root, sessions }) => {
    const bDir = join(root, "projB")
    const cDir = join(root, "projC")
    mkdirSync(bDir)
    mkdirSync(cDir)
    const bPrefix = prefixOf(bDir)
    put(sessions, `${bPrefix}.manifest.desktop`, { slot: 1, updatedAt: T0 + 9000 }, T0 + 9000) // B：仅标记（数据文件缺）——最新
    family(sessions, cDir, { dataMtime: T0 + 1000, desktopMtime: T0 + 3000 }) // C：有效但更旧
    const before = snapshotDir(sessions)
    const projects = await freshProjects("nocwd-a")
    const r = capture(() => projects.restoreLastProject())
    assert.equal(r.value, null, "族无可读 cwd ⇒ 冷态")
    assert.equal(projects.currentCwd(), null, "不误落次新族（C 不得被选中）")
    assert.equal(r.lines.length, 1, "真降级 ⇒ 恰一行")
    assert.match(r.lines[0], /no readable cwd/)
    assert.deepEqual(snapshotDir(sessions), before, "盘面零改动")
  })
  // (b) 族数据文件坏：裸 json 坏 + 有效槽档 ⇒ 候选级终止（不降级到更大槽号、不换候选）
  await withRoot(async ({ root, sessions }) => {
    const dDir = join(root, "projD")
    mkdirSync(dDir)
    const dPrefix = prefixOf(dDir)
    put(sessions, dPrefix, "{ broken json", T0 + 1000) // 裸数据文件坏
    put(sessions, `${dPrefix}.1`, { cwd: dDir }, T0 + 2000) // 槽档有效（不得被采用）
    put(sessions, `${dPrefix}.manifest.desktop`, { slot: 1, updatedAt: T0 + 5000 }, T0 + 5000)
    const before = snapshotDir(sessions)
    const projects = await freshProjects("nocwd-b")
    const r = capture(() => projects.restoreLastProject())
    assert.equal(r.value, null, "候选级终止 ⇒ 冷态")
    assert.equal(projects.currentCwd(), null)
    assert.equal(r.lines.length, 1)
    assert.match(r.lines[0], /no readable cwd/)
    assert.deepEqual(snapshotDir(sessions), before, "盘面零改动")
  })
})

// ─── 腿 5 · 零记录（首启 ∕ 无记录 ⇒ 冷态）──────────────────────────────────────

test("腿 5 · 零记录：空 sessions 根 ⇒ 冷态 + 零写 + 零日志", async () => {
  await withRoot(async ({ sessions }) => {
    const projects = await freshProjects("empty")
    const r = capture(() => projects.restoreLastProject())
    assert.equal(r.value, null)
    assert.equal(projects.currentCwd(), null)
    assert.deepEqual(r.lines, [], "首启常态 ⇒ 零日志")
    assert.deepEqual(readdirSync(sessions), [], "零记录 ⇒ 零写（目录仍空）")
  })
})
