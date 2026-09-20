/** session-gc-stale.test.mjs — STARTUP-LATENCY 批（SESSION.md §6.17）核面用例：
 *  T-SL1.1–1.4（全链异步化 / 行为代理+延迟缝 / 边界降级 / 触发形态结构）· T-SL2.1–2.11（三合取判据矩阵 / 端无关 /
 *  一次性清理 / 可回退 / TOCTOU / 有界 / 回收与清运错误面）。
 *  夹具纪律：全部走 temp `dir` 注入缝（显式传 `dir` / `_setSessionsDirForTest`）——**禁触真实
 *  `~/.thincoder`**；mtime 一律夹具回拨或注入 `now`（不依赖真实存量）。 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { fileURLToPath } from "node:url"
import { gcResidue, runSessionGc, deleteColdCwd, COLD_CWD_RETENTION_MS, GC_PASS_DELAY_MS, _setSessionGcDelayForTest } from "../session-gc.mjs"
import {
  STALE_SAFETY_WINDOW_MS, STALE_SWEEP_LIMIT, TRASH_RETENTION_MS, _staleHooks,
  groupSessionEntries, judgeStaleGroup, listStaleCwds, deleteStaleCwd, purgeTrash, sweepStale, trashRootFor,
} from "../session-stale.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, sessionPath, listSlots } from "../session-slots.mjs"
import { resumeSlot } from "../session.mjs"

const dirs = []
after(() => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })
const tmpRoot = (p = "tc-stale-") => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d }
const sessionsRoot = () => { const root = tmpRoot(); const dir = join(root, "sessions"); mkdirSync(dir); return { root, dir } }
const H = (i) => i.toString(16).padStart(40, "0")
const HASH_A = "a".repeat(40)
const HASH_B = "b".repeat(40)
const HASH_C = "c".repeat(40)
const deadProbe = () => ({ aliveSet: new Set(), cmds: null })
const OUT = { out: () => {}, err: () => {} }
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1") // 注释剥除（结构扫描用）

/** 组夹具（子集足够覆盖判据面）：manifest + N 个数据文件（cwd 指向不存在路径）+ 残留（+ 端标记）。 */
function seedGroup(dir, hash, { ageMs = STALE_SAFETY_WINDOW_MS + 86_400_000, dataCwd = null, dataFiles = 1, residue = true, marker = null, manifest = {}, slotSessions = {} } = {}) {
  const prefix = `${hash}.json`
  const write = (name, text) => {
    const p = join(dir, name)
    writeFileSync(p, text)
    const t = new Date(Date.now() - ageMs)
    utimesSync(p, t, t) // Windows：utimesSync 需 Date 对象（数字时间戳 EINVAL）
  }
  write(`${prefix}.manifest`, JSON.stringify({ slots: { 1: { ts: Date.now(), title: "t", messageCount: 2 } }, active: 1, slotSessions, ...manifest }))
  for (let i = 1; i <= dataFiles; i++) {
    write(`${prefix}.${i}`, JSON.stringify({ version: 2, cwd: dataCwd ?? join(tmpdir(), `gc-gone-${hash.slice(-6)}-${i}`), history: [] }))
  }
  if (residue) write(`${prefix}.1.corrupted`, "{}")
  if (marker) write(`${prefix}.manifest.${marker}`, JSON.stringify({ slot: 1 }))
  return { hash, prefix }
}

// ─── F-SL1：全链异步化 ───────────────────────────────────────────────────────

test("T-SL1.1 结构：清立面两档零同步扫描动词（`existsSync` 单条目面豁免——注释剥除后扫描）", () => {
  for (const rel of ["session-gc.mjs", "session-stale.mjs"]) {
    const src = strip(readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), "utf8"))
    for (const verb of ["readdirSync", "statSync", "readFileSync", "unlinkSync", "rmSync"]) {
      assert.equal(src.includes(verb), false, `${rel} 出现同步扫描动词 ${verb}`)
    }
  }
})

test("T-SL1.2 行为代理 + 延迟缝：10k 项下事件循环不被吞（注入 0 延迟）；延迟拍到点即点火", async () => {
  const dir = tmpRoot("tc-stale-10k-")
  for (let i = 0; i < 10000; i++) closeSync(openSync(join(dir, `${HASH_C}.json.${i + 1}`), "w")) // ≥10,000 项夹具
  seedGroup(dir, HASH_A) // 可清组（cwd 不可达 + 过窗）——延迟拍点火的观测点
  const cwd = tmpRoot("tc-stale-cwd-")
  _setSessionsDirForTest(dir)
  _setSessionGcDelayForTest(0) // 立即点火（勿真等 3s——缝默认 3s 见 T-SL1.4）
  try {
    const t0 = Date.now()
    const pending = resumeSlot(cwd) // 启动同拍（不 await——旧实现即在此同步 readdir 吞掉循环）
    const elapsed = await new Promise((res) => setTimeout(() => res(Date.now() - t0), 100))
    assert.ok(elapsed < 1000, `100ms 定时器 ${elapsed}ms 才触达（事件循环被同步扫描吞噬）`)
    await pending
    for (let i = 0; i < 400 && existsSync(join(dir, `${HASH_A}.json.manifest`)); i++) await new Promise((r) => setTimeout(r, 25)) // ≤10s 等延迟拍（机重时慢——正常即返）
    assert.equal(existsSync(join(dir, `${HASH_A}.json.manifest`)), false, "注入 0 延迟 ⇒ 延迟拍即点火（缝生效——可清组已回收）")
  } finally { _setSessionGcDelayForTest(GC_PASS_DELAY_MS); _resetSessionsDirForTest() }
})

test("T-SL1.3 边界：目录缺失 / 探测失败 ⇒ 静默降级，resumeSlot 正常返回", async () => {
  const missing = join(tmpRoot(), "absent")
  assert.deepEqual(await gcResidue({ dir: missing, prefix: `${HASH_A}.json` }), { candidates: [], deleted: [] })
  assert.equal((await sweepStale({ dir: missing })).candidates, 0)
  const { dir } = sessionsRoot()
  seedGroup(dir, HASH_A, { slotSessions: { 1: "999999-1-x" } })
  const { candidates } = await listStaleCwds({ dir, probeFn: () => ({ aliveSet: null, cmds: null }) })
  assert.deepEqual(candidates, [], "探测失败（束缺失）= 未知 ⇒ 不判可清")
  const cwd = tmpRoot("tc-stale-cwd-")
  _setSessionsDirForTest(join(missing, "sessions"))
  try {
    const { slot } = await resumeSlot(cwd) // 目录缺失 ⇒ 启动钩子静默 + 正常分配
    assert.ok(slot >= 1, "resumeSlot 正常返回")
    await new Promise((res) => setTimeout(res, 20)) // 延迟拍（3s 默认）另途点火（沙箱路径已在调度时捕获）——本用例只验返回路径零异常
  } finally { _resetSessionsDirForTest() }
})

test("T-SL1.4 触发形态（结构）：`GC_PASS_DELAY_MS` = 3000 + 延迟拍 `setTimeout`（无 `setImmediate`）", () => {
  assert.equal(GC_PASS_DELAY_MS, 3000, "默认延迟 = 3s（启动窗外——D-SE39）")
  const src = strip(readFileSync(fileURLToPath(new URL("../session-gc.mjs", import.meta.url)), "utf8"))
  assert.ok(src.includes("setTimeout("), "触发 = 核侧 setTimeout（启动窗外延迟拍）")
  assert.equal(src.includes("setImmediate"), false, "无 setImmediate（触发与启动链解耦——D-SE39）")
})

// ─── F-SL2：三合取判据 / 回收 / 清运 ─────────────────────────────────────────

test("T-SL2.1 判据矩阵（纯函数）：逐格 reason 与 keep 期望 + 数据文件族归属", () => {
  const now = Date.now()
  const F = { now, newestMtimeMs: now - STALE_SAFETY_WINDOW_MS - 1, ownerStates: [], dataFiles: [{ readable: true, cwdExists: false }] }
  const j = (patch) => judgeStaleGroup({ ...F, ...patch })
  assert.deepEqual(j({}), { cleanable: true, reason: "cwd-gone" }, "T1：cwd 全部不在盘")
  assert.deepEqual(j({ dataFiles: [] }), { cleanable: true, reason: "no-content" }, "T2：零内容")
  assert.equal(j({ newestMtimeMs: now }).reason, "window", "③ 窗内 ⇒ 保留")
  assert.equal(j({ ownerStates: ["alive"] }).reason, "live-owner", "① 活属主 ⇒ 保留")
  assert.equal(j({ ownerStates: ["unknown"] }).reason, "unknown-owner", "① 探测未知 ⇒ 保留")
  assert.equal(j({ dataFiles: [{ readable: true, cwdExists: true }] }).reason, "cwd-exists", "cwd 存活 ⇒ T1 不成立")
  assert.equal(j({ dataFiles: [{ readable: false, cwdExists: null }] }).reason, "unreadable", "不可读 / 无 cwd ⇒ fail-safe")
  assert.equal(j({ ownerStates: ["alive"], newestMtimeMs: now }).reason, "window", "求值序：③ 先于 ①（短路）")
  // 分组面：裸 {hash}.json 与 .N 是数据文件；manifest / 端标记 / 残留 / sidecar 不是
  const g = groupSessionEntries([`${HASH_A}.json`, `${HASH_A}.json.2`, `${HASH_A}.json.manifest`, `${HASH_A}.json.manifest.cli`, `${HASH_A}.json.2.d`, `${HASH_A}.json.2.tmp`, `${HASH_A}.json.1.corrupted`, "foreign.txt"]).get(HASH_A)
  assert.deepEqual(g.dataFiles, [`${HASH_A}.json`, `${HASH_A}.json.2`], "数据文件族 = 裸 v1 + .N（sidecar .d 随组处理）")
  assert.equal(g.files.length, 7, "组 = 同前缀全文件集合（foreign 不认）")
})

test("T-SL2.2 零误删：活属主组 / 未知属主组均不候选（探活注入）", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, HASH_A, { slotSessions: { 1: "111-1-x" } }) // 束内活 + 身份相符 ⇒ alive
  seedGroup(dir, HASH_B, { slotSessions: { 1: "222-1-x" } }) // 束内活但无 cmdline ⇒ unknown
  const probeFn = () => ({ aliveSet: new Set([111, 222]), cmds: new Map([[111, "node thincoder.mjs"]]) })
  const { candidates, evaluated } = await listStaleCwds({ dir, probeFn })
  assert.deepEqual(candidates, [], "活 / 未知 ⇒ 均保留")
  assert.equal(evaluated, 2, "过 ③ 进 ① 即耗 1（① 短路组亦已耗——D-SE40）")
})

test("T-SL2.3 一次性清理：dry-run 全列零删 → confirm --all 全回收 → 二次跑候选 0（幂等）", async () => {
  const { dir } = sessionsRoot()
  for (let i = 0; i < 300; i++) seedGroup(dir, H(i))
  const before = readdirSync(dir).length
  const now = Date.now() + 8 * 86_400_000 // ③ 面过窗（免逐文件回拨——夹具注入 now）
  const lines = []
  assert.equal(await runSessionGc(["gc", "--dry-run"], { dir, prefix: `${HASH_A}.json`, now, out: (s) => lines.push(s), err: () => {}, probeFn: deadProbe }), 0)
  assert.equal(readdirSync(dir).length, before, "dry-run 零删")
  assert.equal(lines.filter((l) => /^ {2}[0-9a-f]{40} {2}reason /.test(l)).length, 300, "dry-run 全列 300 组（带 reason）")
  assert.equal(await runSessionGc(["gc", "--confirm", "--all"], { dir, prefix: `${HASH_A}.json`, now, ...OUT, probeFn: deadProbe }), 0)
  assert.equal(readdirSync(dir).length, 0, "confirm 后原目录零残留")
  const batches = readdirSync(trashRootFor(dir))
  assert.equal(batches.length, 1, "单批次")
  assert.equal(readdirSync(join(trashRootFor(dir), batches[0])).length, before, "回收批全量在（可回退）")
  const lines2 = []
  assert.equal(await runSessionGc(["gc", "--dry-run"], { dir, prefix: `${HASH_A}.json`, now, out: (s) => lines2.push(s), err: () => {}, probeFn: deadProbe }), 0)
  assert.ok(lines2.some((l) => l.includes("candidates") && l.trim().endsWith(": 0")), "二次跑候选 0（幂等）")
})

test("T-SL2.4 可回退：回收批移回原目录 ⇒ listSlots 摘要读得回；purgeTrash 双窗", async () => {
  const { dir } = sessionsRoot()
  const cwd = tmpRoot("tc-stale-proj-")
  _setSessionsDirForTest(dir)
  try {
    const prefix = basename(sessionPath(cwd))
    const hash = prefix.slice(0, -".json".length)
    seedGroup(dir, hash)
    const now = Date.now() + 8 * 86_400_000
    const r = await deleteColdCwd(hash, { dir, now, probeFn: deadProbe })
    assert.equal(r.ok, true, "回收成功")
    assert.equal(existsSync(join(dir, `${prefix}.manifest`)), false, "原目录已移出")
    for (const name of readdirSync(r.batch)) renameSync(join(r.batch, name), join(dir, name)) // 恢复 = 移回原目录
    const slots = listSlots(cwd)
    assert.equal(slots.length, 1, "移回后摘要读得回")
    assert.equal(slots[0].title, "t")
    const trash = trashRootFor(dir)
    const expired = String(Date.now() - TRASH_RETENTION_MS - 86_400_000)
    const inWindow = String(Date.now())
    mkdirSync(join(trash, expired), { recursive: true })
    mkdirSync(join(trash, inWindow), { recursive: true })
    writeFileSync(join(trash, expired, "x"), "1")
    writeFileSync(join(trash, inWindow, "y"), "1")
    const out = await purgeTrash({ dir })
    assert.deepEqual(out.purged, [expired], "超期批清运")
    assert.deepEqual(out.failed, [])
    assert.ok(existsSync(join(trash, inWindow, "y")), "保留期内批不删")
  } finally { _resetSessionsDirForTest() }
})

test("T-SL2.5 边界（TOCTOU）：候选列举后变活 / 新 mtime ⇒ deleteColdCwd 拒绝（not-cold，零删除）", async () => {
  const { dir } = sessionsRoot()
  const g = seedGroup(dir, HASH_A, { slotSessions: { 1: "4242-1-x" } })
  const now = Date.now() + 8 * 86_400_000
  assert.equal((await listStaleCwds({ dir, now, probeFn: deadProbe })).candidates.length, 1, "先列举为候选")
  utimesSync(join(dir, `${g.prefix}.1`), new Date(now), new Date(now)) // 期间新写入（在注入窗内）⇒ 出窗
  const r1 = await deleteColdCwd(g.hash, { dir, now, probeFn: deadProbe })
  assert.equal(r1.ok, false)
  assert.equal(r1.reason, "not-cold")
  assert.deepEqual(r1.deleted, [], "零删除")
  const back = new Date(now - 9 * 86_400_000)
  utimesSync(join(dir, `${g.prefix}.1`), back, back) // 复归过窗
  const alive = () => ({ aliveSet: new Set([4242]), cmds: new Map([[4242, "node thincoder.mjs"]]) })
  const r2 = await deleteColdCwd(g.hash, { dir, now, probeFn: alive })
  assert.equal(r2.ok, false)
  assert.equal(r2.reason, "not-cold", "期间变活属主 ⇒ 同一拒绝")
  assert.ok(existsSync(join(dir, `${g.prefix}.manifest`)), "零删除")
})

test("T-SL2.6 有界：单次自动 pass 过 ③ 进 ① 恰 = STALE_SWEEP_LIMIT；③ 短路组零预算；余量下一 pass 收敛", async () => {
  const { dir } = sessionsRoot()
  for (let i = 0; i < 600; i++) seedGroup(dir, H(i), { dataFiles: 0 }) // T2 可清候选
  const fresh = seedGroup(dir, HASH_A, { ageMs: 0 }) // ③ 短路
  const live = seedGroup(dir, HASH_B, { slotSessions: { 1: "777-1-x" } }) // ① 短路
  const probeFn = () => ({ aliveSet: new Set([777]), cmds: new Map([[777, "node thincoder.mjs"]]) })
  const now = Date.now()
  const pass1 = await sweepStale({ dir, now, probeFn })
  assert.equal(pass1.groups, 602)
  assert.equal(pass1.evaluated, STALE_SWEEP_LIMIT, "过 ③ 进 ① ≤ 上限（= 500——含 ① manifest 读）")
  assert.equal(pass1.candidates, STALE_SWEEP_LIMIT)
  const pass2 = await sweepStale({ dir, now, probeFn })
  assert.equal(pass2.evaluated, 101, "余量下一 pass 继续（100 余量 + ① 短路组 1——③ 短路组零预算）")
  assert.ok(existsSync(join(dir, `${fresh.prefix}.manifest`)) && existsSync(join(dir, `${live.prefix}.manifest`)), "短路组未被误清")
  // ② 面滞留（§6.17 边界行）：500 个恒保留组占满预算（过 ③ 进 ① 即耗）⇒ 更新的可清组本 pass 不可达；兜底 = 显式全量面
  const { dir: dir2 } = sessionsRoot()
  const liveCwd = tmpRoot("tc-stale-live-") // cwd 存在 ⇒ T1 不成立 ⇒ ② 保留（占预算）
  for (let i = 0; i < 500; i++) seedGroup(dir2, H(i), { dataCwd: liveCwd })
  const newer = seedGroup(dir2, HASH_A, { dataFiles: 0, ageMs: STALE_SAFETY_WINDOW_MS + 3_600_000 })
  const stuck = await sweepStale({ dir: dir2, now: Date.now(), probeFn: deadProbe })
  assert.equal(stuck.evaluated, STALE_SWEEP_LIMIT, "② 面保留组计入预算（过 ③ 进 ① 即耗——非 ② 面闸）")
  assert.equal(stuck.candidates, 0, "升序窗口被保留组占用（更新的可清组本 pass 不可达）")
  assert.ok(existsSync(join(dir2, `${newer.prefix}.manifest`)), "可清组仍留（自动面滞留）")
  const full = await listStaleCwds({ dir: dir2, now: Date.now(), probeFn: deadProbe, limit: Infinity })
  assert.deepEqual(full.candidates.map((c) => c.hash), [HASH_A], "兜底 = 显式命令面（全量面）可达")
})

test("T-SL2.7 端无关：含 .vscode 端标记的组经 CLI 命令面可清（判据不引用端）", async () => {
  const { dir } = sessionsRoot()
  const g = seedGroup(dir, HASH_A, { marker: "vscode" })
  const now = Date.now() + 8 * 86_400_000
  assert.equal(await runSessionGc(["gc", "--confirm", "--all"], { dir, prefix: `${HASH_A}.json`, now, ...OUT, probeFn: deadProbe }), 0)
  assert.equal(readdirSync(dir).length, 0, "端标记随组回收（判据不引用端）")
  assert.equal(existsSync(join(dir, `${g.prefix}.manifest.vscode`)), false)
})

test("T-SL2.8 错误（回收根不可写）：逐文件跳过并计数，原组文件零删除、组保持可重判", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, HASH_A)
  writeFileSync(trashRootFor(dir), "block") // 回收根位置被文件占位 ⇒ mkdir 失败
  const now = Date.now() + 8 * 86_400_000
  const r = await deleteStaleCwd(HASH_A, { dir, now, probeFn: deadProbe })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "recycle-failed")
  assert.deepEqual(r.deleted, [], "原组文件零删除（不 unlink 兜底）")
  assert.equal((await listStaleCwds({ dir, now, probeFn: deadProbe })).candidates.length, 1, "组保持可重判")
})

test("T-SL2.9 错误（组内 rename 中途失败）：部分移动态安全 + 二次跑幂等（不重复移动）", async () => {
  const { dir } = sessionsRoot()
  seedGroup(dir, HASH_A, { dataFiles: 2 })
  const now = Date.now() + 8 * 86_400_000
  const prev = { ..._staleHooks }
  let n = 0
  _staleHooks.rename = async (from, to) => { if (++n === 2) throw new Error("injected rename failure"); return prev.rename(from, to) }
  let r
  try { r = await deleteStaleCwd(HASH_A, { dir, now, probeFn: deadProbe }) } finally { Object.assign(_staleHooks, prev) }
  assert.equal(r.ok, true, "部分移动 = 组已不可达（安全）")
  assert.equal(r.skipped.length, 1, "失败文件跳过并计数")
  const r2 = await deleteStaleCwd(HASH_A, { dir, now, probeFn: deadProbe })
  assert.equal(r2.ok, true, "二次跑续清余量")
  assert.equal(readdirSync(dir).length, 0, "余量收敛")
  assert.equal(readdirSync(join(trashRootFor(dir), String(now))).length, 4, "回收批恰 4 件（不重复移动）")
})

test("T-SL2.10 错误（清运失败）：静默跳过、不误删在期批，后续 pass 重试", async () => {
  const { dir } = sessionsRoot()
  const trash = trashRootFor(dir)
  const expired = String(Date.now() - TRASH_RETENTION_MS - 86_400_000)
  const inWindow = String(Date.now())
  mkdirSync(join(trash, expired), { recursive: true })
  mkdirSync(join(trash, inWindow), { recursive: true })
  writeFileSync(join(trash, expired, "x"), "1")
  writeFileSync(join(trash, inWindow, "y"), "1")
  const prev = { ..._staleHooks }
  _staleHooks.rm = async () => { throw new Error("injected rm failure") }
  let out
  try { out = await purgeTrash({ dir }) } finally { Object.assign(_staleHooks, prev) }
  assert.deepEqual(out.purged, [], "失败静默（不抛）")
  assert.deepEqual(out.failed, [expired])
  assert.ok(existsSync(join(trash, inWindow, "y")), "在期批零误删")
  assert.deepEqual((await purgeTrash({ dir })).purged, [expired], "后续 pass 重试成功")
})

test("T-SL2.11 冷面回归：90 天冷判据仍为显式面（cwd 存活组唯一出口）+ 回收替代直删", async () => {
  const { dir } = sessionsRoot()
  const cwd = tmpRoot("tc-stale-live-")
  const g = seedGroup(dir, HASH_B, { dataCwd: cwd, ageMs: 0 })
  const now = Date.now() + COLD_CWD_RETENTION_MS + 86_400_000
  const stale = await listStaleCwds({ dir, now, probeFn: deadProbe })
  assert.equal(stale.candidates.length, 0, "cwd 存活 ⇒ 不入三合取面（自动面零动作）")
  const r = await deleteColdCwd(g.hash, { dir, now, probeFn: deadProbe })
  assert.equal(r.ok, true, "90 天冷判据经显式面可回收")
  assert.equal(r.reason, "cold-90d")
  assert.equal(existsSync(join(dir, `${g.prefix}.manifest`)), false, "经回收目录（不再直删）")
  assert.equal(readdirSync(r.batch).length, 3, "回收批在（可回退）")
})
