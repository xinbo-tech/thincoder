/**
 * session-ledger-reliability.test.mjs — 会话账本摘要可靠化行为组（SESSION.md §6.25 · LEDGER-RELIABILITY 批）：L1 零权威 / L2 可重建 / L3 懒核实 /
 * L4 数据面 / L5 写安全 / N-L1 启动路径机检（端侧 L4-3/4/5/8/9 = 另座）。夹具 = 真实临时会话目录 + 真实槽文件 / manifest；核实面缝驱动
 * （`_setVerifyDelayForTest(0)` + `await _verifyIdle()`——禁时间等待）；写面计数桩 / 临时名观察 = `_setManifestWriteHookForTest`。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, ledgerHealth,
  listSlots, loadManifest, manifestPath, readEndMarker, saveManifest, slotDigest, slotPath, writeEndMarker,
} from "../session-slots.mjs"
import { _setManifestWriteHookForTest } from "../session-slots-manifest.mjs"
import { resumeSlot, switchToSlot } from "../session-lifecycle.mjs"
import { _resetScanStats, _scanStats, SCAN_BUDGET_BYTES } from "../session-slot-scan.mjs"
import {
  _resetVerifyStateForTest, _setVerifyDelayForTest, _verifyIdle, _verifyState, needsVerify, VERIFY_TICK_DELAY_MS,
} from "../session-slot-verify.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\ledger-rel" : "/proj/ledger-rel"
const MSG = (content) => ({ role: "user", content })
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")
const read = (...rel) => readFileSync(fileURLToPath(new URL(["..", ...rel].join("/"), import.meta.url)), "utf8")
const writeHook = (fn) => { _setManifestWriteHookForTest(fn) }
let dir = null

before(() => {
  dir = mkdtempSync(join(tmpdir(), "core-ledger-rel-"))
  _setSessionsDirForTest(dir)
  assert.ok(manifestPath(CWD).startsWith(dir), `隔离缝失效：${manifestPath(CWD)} 不在 ${dir} 内`)
})
after(() => { _resetVerifyStateForTest(); _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
beforeEach(() => {
  for (const e of readdirSync(dir)) rmSync(join(dir, e), { recursive: true, force: true })
  _resetScanStats(); _resetVerifyStateForTest(); _setVerifyDelayForTest(0) // 零延迟点火（勿真等 3s）
})

// 夹具：槽数据（老槽形——无 activeModel / createdBy 键）；大档 = ③ 早键截读面（计数不可得）。
function slotData(mut = () => {}) { const d = { version: 2, cwd: CWD, title: "", activeProvider: "prov", updatedAt: 7, history: [], contextHistory: [] }; mut(d); return d }
function putSlot(n, mut) { writeFileSync(slotPath(CWD, n), JSON.stringify(slotData(mut))) }
function putBig(n, mut, pad = 300 * 1024) {
  writeFileSync(slotPath(CWD, n), JSON.stringify(slotData((d) => { mut(d); d.history.push({ role: "tool", name: "p", content: "x".repeat(pad) }) })))
}
function putManifest(m = {}) { writeFileSync(manifestPath(CWD), JSON.stringify({ slots: {}, sessionId: "test", ...m })) }
function quiet(fn) { const orig = console.error; const errs = []; console.error = (...a) => errs.push(a.join(" ")); try { fn() } finally { console.error = orig } return errs }

// ─── L1 零权威（判据句 1）· L2 可重建（判据句 2）──────────────────────────────
test("L1-1 / L1-2 删 manifest 整档 ∥ slots = {} ⇒ 条目集 = 盘面 ∧ 不可得字段 = null（不假造 0）", () => {
  putSlot(1, (d) => { d.title = "s1"; d.history = [MSG("a"), MSG("b")] })
  putBig(2, (d) => { d.title = "s2"; d.history = [MSG("c")] })
  putSlot(3, (d) => { d.title = "s3"; d.history = [MSG("d")] })
  rmSync(manifestPath(CWD), { force: true })
  const rows = listSlots(CWD) // L1-1：删档整档 ⇒ 不抛 + 字段退盘面
  assert.deepEqual(rows.map((r) => r.slot), [3, 2, 1], "条目集 = 盘面 3 条")
  assert.deepEqual(rows.map((r) => r.title), ["s3", "s2", "s1"], "字段退盘面供给")
  assert.deepEqual([rows[0].messageCount, rows[0].turnCount, rows[0].firstMessage], [1, 1, "d"])
  putManifest() // L1-2：slots 清空 + 槽文件在盘 ⇒ 条目集不变
  const rows2 = listSlots(CWD)
  assert.deepEqual(rows2.map((r) => r.slot), [3, 2, 1], "条目集不变（slots 空不影响）")
  assert.deepEqual([rows2.find((r) => r.slot === 1).messageCount, rows2.find((r) => r.slot === 1).turnCount], [2, 2], "小档盘面供给")
  assert.deepEqual([rows2.find((r) => r.slot === 2).messageCount, rows2.find((r) => r.slot === 2).turnCount], [null, null], "大档不可得 = null")
})
test("L1-3 / L1-4 slots = {}：marker 指 N ⇒ 落原槽；无记录 ⇒ 槽号分配不撞现存号", async () => {
  putSlot(5, (d) => { d.title = "keep"; d.history = [MSG("resume me")] })
  putManifest()
  writeEndMarker(CWD, 5)
  const r = await resumeSlot(CWD) // L1-3：盘面单判
  assert.equal(r.slot, 5, "落原槽（不落全新分配）")
  assert.equal(r.data.history[0].content, "resume me", "data 完整")
  putSlot(1, (d) => { d.history = [MSG("one")] })
  putSlot(2, (d) => { d.history = [MSG("two")] })
  putManifest() // L1-4：slots = {} 重起
  writeEndMarker(CWD, 99) // 记录槽无文件 ⇒ 判据①不过 ⇒ allocateFresh
  const r2 = await resumeSlot(CWD)
  assert.equal(r2.slot, 3, "全新号跳过现存文件（existsSync 护住——不撞 1 / 2）")
})
test("L2-1 / L2-2 清空 slots ⇒ 逐槽 switchToSlot：条目 = slotDigest 重建值（ts 除外）∧ 缺键不发明", () => {
  for (const n of [1, 2]) putSlot(n, (d) => { d.title = `t${n}`; d.history = [MSG(`m${n}`), { role: "assistant", content: "a" }, MSG(`m${n}b`)] })
  putManifest()
  for (const n of [1, 2]) {
    const data = switchToSlot(CWD, n)
    const want = slotDigest(data); delete want.ts
    const got = { ...loadManifest(CWD).slots[n] }; delete got.ts
    assert.deepEqual(got, want, `槽 ${n} 条目逐字段 = slotDigest 重建值`)
  }
  const e = loadManifest(CWD).slots[1] // L2-2：老槽缺 activeModel / createdBy ⇒ 重建亦缺席
  assert.deepEqual(["activeModel", "createdBy"].filter((k) => k in e), [], "缺键 ⇒ 键缺席（禁发明）")
})
test("L2-3 全无用户操作（仅列表 + 打开）⇒ 摘要最终全补 ∧ 核侧零显式入口（负断言）", async () => {
  for (const n of [1, 2, 3]) putBig(n, (d) => { d.title = `s${n}`; d.history = [MSG(`m${n}`)] })
  putManifest()
  listSlots(CWD) // 仅列表调用
  await _verifyIdle()
  switchToSlot(CWD, 1) // 仅打开
  const m = loadManifest(CWD)
  for (const n of [1, 2, 3]) assert.equal(typeof m.slots[n]?.messageCount, "number", `槽 ${n} 摘要已补`)
  const src = ["session-slots.mjs", "session-slot-verify.mjs", "session-slots-manifest.mjs", "session-lifecycle.mjs"].map((f) => read(f)).join("\n")
  assert.equal(/session repair|--repair|repairSession/.test(src), false, "核侧零显式修复入口（无用户操作面）")
})
// ─── L3 懒核实（判据句 3）─────────────────────────────────────────────────────
test("L3-1 / L3-2 落点 A 两路：缺条目 ⇒ 同一次 manifest 写内补（写计数 = 1——零额外写）", async () => {
  putSlot(1, (d) => { d.history = [MSG("x")] })
  putSlot(4, (d) => { d.history = [MSG("r")] })
  putManifest()
  let writes = 0
  writeHook(() => { writes += 1 })
  try { switchToSlot(CWD, 1) } finally { writeHook(null) }
  assert.equal(writes, 1, "switchToSlot：恰一次写（条目随其落）")
  assert.equal(typeof loadManifest(CWD).slots[1].messageCount, "number", "切槽路条目已补")
  writeEndMarker(CWD, 4)
  writes = 0
  writeHook(() => { writes += 1 })
  let r
  try { r = await resumeSlot(CWD) } finally { writeHook(null) }
  assert.equal(r.slot, 4, "resumeSlot：认领决策零变（记录槽命中）")
  assert.equal(writes, 1, "认领恰一次写（零额外写）")
  const m = loadManifest(CWD)
  assert.equal(m.slotSessions[4], getSessionId(), "保留集 = {4}（认领在场）")
  assert.equal(typeof m.slots[4].messageCount, "number", "条目随认领那次写落")
  assert.equal(readEndMarker(CWD)?.slot, 4, "端标记零变")
})
test("L3-3 / L3-4 新鲜 ⇒ 零额外写（幂等）∧ 列表本体零写 ∧ 返回时核实未起跑", async () => {
  putSlot(1, (d) => { d.history = [MSG("n")] })
  putBig(2, (d) => { d.title = "u"; d.history = [MSG("m")] })
  const past = new Date(Date.now() - 5000)
  utimesSync(slotPath(CWD, 1), past, past) // 新鲜度夹具（免同毫秒边缘：ts 整数 ms ∧ mtimeMs 浮点）
  putManifest()
  switchToSlot(CWD, 1) // 首轮补写（陈旧 ⇒ 置入）
  const ts1 = loadManifest(CWD).slots[1].ts
  let writes = 0
  writeHook(() => { writes += 1 })
  try { switchToSlot(CWD, 1); await resumeSlot(CWD) } finally { writeHook(null) }
  assert.equal(writes, 2, "两次载体写（切换 + 认领）——核实面零额外写")
  assert.equal(loadManifest(CWD).slots[1].ts, ts1, "摘要条目逐字不变（新鲜零写）")
  assert.equal(needsVerify(loadManifest(CWD).slots[1], statSync(slotPath(CWD, 1)).mtimeMs), false, "列表侧判据 = false（负断言）")
  const t0 = statSync(manifestPath(CWD)).mtimeMs
  const rows = listSlots(CWD) // L3-4：不可信档（槽 2）在场
  assert.equal(rows.find((r) => r.slot === 2).messageCount, null, "不可信档在场")
  assert.equal(statSync(manifestPath(CWD)).mtimeMs, t0, "列表调用本体零写（manifest mtime 前后相等）")
  assert.deepEqual({ ..._verifyState }, { ticks: 0, verified: 0, failed: 0, skipped: 0, chunks: 0, bytes: 0 }, "返回时零核实 / 零 I/O（纯内存登记）")
  await _verifyIdle() // 排空本轮（免残留轮跨例自增 `_verifyState`——用例确定性）
})
test("L3-5 / L3-7 / L3-9 小档补齐（≤ 4 MiB）+ 流式 = 全解析逐字段 + 连发两次恰核一次", async () => {
  const mut = (d) => { d.title = "parity"; d.activeModel = "mod"; d.createdBy = "vsc"; d.history = [MSG("first"), { role: "assistant", content: "a" }, "bare", { role: "user", content: "[System reminder: skip]" }, MSG("last")] }
  putSlot(1, mut)
  putBig(2, (d) => { d.title = "s2"; d.history = [MSG("m2")] })
  putBig(3, (d) => { d.title = "s3"; d.history = [MSG("m3")] })
  const raw = readFileSync(slotPath(CWD, 1), "utf8")
  putManifest()
  listSlots(CWD)
  listSlots(CWD) // L3-9：同档不重复入队
  await _verifyIdle()
  assert.equal(_verifyState.ticks, 1, "同一轮（拍未重复点火）")
  assert.equal(_verifyState.verified, 3, "一轮补齐 3 档；同档核实次数恰 1（在飞 / 待核集去重）")
  assert.ok(_verifyState.bytes <= SCAN_BUDGET_BYTES, `累计读 ${_verifyState.bytes} ≤ ${SCAN_BUDGET_BYTES}`)
  const want = slotDigest(JSON.parse(raw)); delete want.ts // L3-7：流式 = 全解析（单源判据）
  const got = { ...loadManifest(CWD).slots[1] }; delete got.ts
  assert.deepEqual(got, want, "逐字段相等")
  _resetScanStats()
  listSlots(CWD)
  assert.deepEqual([_scanStats.fastPath, _scanStats.bytes], [3, 0], "回快路（不重复 ①——零槽文件读）")
})
test("L3-6 大档（> 4 MiB）×2 ⇒ 该轮至多一档 ∧ 分块 ∧ 无 ≥50 ms 连续同步段；余档下次续核", async () => {
  putBig(1, (d) => { d.history = [MSG("m")] }, 5 * 1024 * 1024)
  putBig(2, (d) => { d.history = [MSG("m")] }, 5 * 1024 * 1024)
  putManifest()
  let maxGap = 0; let last = performance.now(); let running = true
  const mon = (async () => { while (running) { await new Promise((r) => setImmediate(r)); const now = performance.now(); maxGap = Math.max(maxGap, now - last); last = now } })()
  listSlots(CWD)
  await _verifyIdle()
  running = false; await mon
  assert.equal(Object.keys(loadManifest(CWD).slots).length, 1, "该轮至多一档（超预算大档）")
  assert.ok(_verifyState.chunks >= 5, `分块读（chunks=${_verifyState.chunks}）`)
  assert.ok(maxGap < 50, `无 ≥50 ms 连续同步段（实测最大 ${maxGap.toFixed(1)}ms）`)
  listSlots(CWD)
  await _verifyIdle()
  assert.equal(Object.keys(loadManifest(CWD).slots).length, 2, "余档下次列表调用续核")
})
test("L3-8 坏 JSON / 异 cwd / version > 2 ⇒ 不写回；第二次零读（负缓存）", async () => {
  putBig(2, (d) => { d.history = [MSG("ok")] })
  writeFileSync(slotPath(CWD, 3), "{ bad")
  writeFileSync(slotPath(CWD, 4), JSON.stringify(slotData((d) => { d.cwd = "C:\\other"; d.history = [MSG("x")] })))
  writeFileSync(slotPath(CWD, 5), JSON.stringify({ ...slotData((d) => { d.history = [MSG("x")] }), version: 3 }))
  putManifest()
  listSlots(CWD)
  await _verifyIdle()
  assert.deepEqual(Object.keys(loadManifest(CWD).slots), ["2"], "门不过 ⇒ 不写回（不发明摘要）")
  assert.ok(loadManifest(CWD).slots["2"].ts >= statSync(slotPath(CWD, 2)).mtimeMs, "回写 ts ≥ 该档 mtime（地板——防墙钟/时间戳偏差重核；#46 修回归锁）")
  const bytes = _verifyState.bytes
  listSlots(CWD)
  await _verifyIdle()
  assert.equal(_verifyState.bytes, bytes, "第二次零读（负缓存：同 mtime 不重试）")
})
// ─── N-L1 启动路径机检（§2.9-6）∨ 零跨根写（判据句 3）────────────────────────
test("N-L1 结构：延迟常量 = 3000 ∧ 点火 = setTimeout（setImmediate 仅逐块让出）", () => {
  assert.equal(VERIFY_TICK_DELAY_MS, 3000, "默认延迟 = 3s（启动窗外——D-SE64）")
  const src = strip(read("session-slot-verify.mjs"))
  assert.ok(src.includes("setTimeout("), "触发 = 延迟拍（setTimeout）")
  assert.equal((src.match(/setImmediate/g) ?? []).length, 1, "setImmediate 仅 1 处（逐块让出——非点火）")
  const i = src.indexOf("yieldToLoop")
  assert.ok(src.slice(i, src.indexOf("\n", i + 1)).includes("setImmediate"), "该处 = 让出助手（点火与让出分离）")
})
test("N-L1 行为（启动路径）：listSlots 返回后核实未起跑 ∧ 同步阻塞 ≤ 50 ms", () => {
  for (const n of [1, 2, 3]) putBig(n, (d) => { d.history = [MSG("m")] })
  putManifest()
  const t0 = performance.now()
  const rows = listSlots(CWD)
  const ms = performance.now() - t0
  assert.equal(rows.length, 3, "条目全数入列")
  assert.equal(_verifyState.ticks, 0, "返回时零核实（调度 = 纯内存登记）")
  assert.equal(_verifyState.bytes, 0, "零核实 I/O")
  assert.ok(ms <= 50, `同步阻塞 ${ms.toFixed(1)}ms ≤ 50ms（F-SL1）`)
})
test("零跨根写：目录切换 ⇒ 弃轮（新旧根双向零写）", async () => {
  putBig(1, (d) => { d.history = [MSG("m")] })
  putManifest()
  const oldPath = manifestPath(CWD)
  const bytes = readFileSync(oldPath, "utf8")
  listSlots(CWD) // 排轮（捕获当前前缀）
  const dirB = mkdtempSync(join(tmpdir(), "core-ledger-rel-b-"))
  _setSessionsDirForTest(dirB)
  try {
    await _verifyIdle()
    assert.equal(readdirSync(dirB).length, 0, "新根零写（弃轮）")
    assert.equal(readFileSync(oldPath, "utf8"), bytes, "旧根 manifest 零改（零跨根写）")
  } finally {
    _setSessionsDirForTest(dir)
    rmSync(dirB, { recursive: true, force: true })
  }
})
// ─── L4 数据面（判据句 4——警示接线 L4-3/4/5/8/9 = 另座）∨ L5 写安全（判据句 5）──
test("L4-1 / L4-2 不可得 = null（非 0）∧ 真 0（有摘要）= 0（与未知可分）", () => {
  putBig(1, (d) => { d.history = [MSG("m")] })
  putSlot(2, (d) => { d.history = [] })
  putManifest({ slots: { 2: { ts: Date.now() + 1000, messageCount: 0, turnCount: 0, firstMessage: "", activeProvider: "", updatedAt: 1, title: "empty" } } })
  const rows = listSlots(CWD)
  const big = rows.find((r) => r.slot === 1)
  assert.deepEqual([big.messageCount, big.turnCount], [null, null], "大档无摘要 ⇒ 不可得 = null（非 0）")
  assert.deepEqual([rows.find((r) => r.slot === 2).messageCount, _scanStats.fastPath], [0, 1], "真 0 = 可信（快路命中 ∧ 不触发核实）")
})
test("L4-6 / L4-7 ledgerHealth：拒写累计 + loud ∧ 现场（.corrupted）在盘 ⇒ scene", () => {
  writeFileSync(manifestPath(CWD), "{ 这不是 JSON")
  const errs = quiet(() => assert.equal(saveManifest(CWD, loadManifest(CWD)), false, "拒写基座 ⇒ false"))
  const h = ledgerHealth(CWD)
  assert.ok(h.refused >= 1, "本进程累计 ≥ 1")
  assert.ok(["read-failed", "parse-failed", "shape-invalid", "readback-failed"].includes(h.lastReason), `lastReason=${h.lastReason}`)
  assert.ok(errs.length >= 1, "stderr loud 行在场")
  assert.equal(h.scene, true, "现场在盘 ⇒ 警示条件成立")
  rmSync(`${manifestPath(CWD)}.corrupted`, { force: true })
  assert.equal(ledgerHealth(CWD).scene, false, "现场清 ⇒ 止")
  putManifest()
  assert.equal(ledgerHealth(CWD).scene, false, "正常面 ⇒ 不报")
})
test("L5-1 连发两次 saveManifest ⇒ 临时名互异 ∧ 零 ${p}.tmp 残留", () => {
  putManifest()
  const tmps = []
  writeHook(({ tmp }) => tmps.push(tmp))
  try { saveManifest(CWD, loadManifest(CWD)); saveManifest(CWD, loadManifest(CWD)) } finally { writeHook(null) }
  assert.equal(tmps.length, 2)
  assert.notEqual(tmps[0], tmps[1], "临时名互异（进程内自增）")
  for (const t of tmps) assert.match(t, /\.\d+-\d+\.tmp$/, `独占名形：${t}`)
  assert.equal(existsSync(`${manifestPath(CWD)}.tmp`), false, "无同名 ${p}.tmp")
  assert.deepEqual(readdirSync(dir).filter((e) => e.endsWith(".tmp")), [], "零 .tmp 残留")
})
test("L5-2 / L5-3 写后钩子注入垃圾 ⇒ false + readback-failed + 现场 .corrupted；正常写 ⇒ true", () => {
  putManifest()
  let ok
  writeHook(({ path }) => writeFileSync(path, "garbage"))
  let errs
  try { errs = quiet(() => { ok = saveManifest(CWD, loadManifest(CWD)) }) } finally { writeHook(null) }
  assert.equal(ok, false, "读回不过 ⇒ false")
  assert.ok(errs.some((l) => l.includes("readback-failed")), errs.join(" | "))
  assert.equal(readFileSync(`${manifestPath(CWD)}.corrupted`, "utf8"), "garbage", "现场改名（字节保全）")
  rmSync(`${manifestPath(CWD)}.corrupted`, { force: true }) // 解封下一写
  assert.equal(saveManifest(CWD, loadManifest(CWD)), true, "正常写 ⇒ 返回值 true 零变")
  const back = JSON.parse(readFileSync(manifestPath(CWD), "utf8"))
  assert.ok(back && typeof back === "object" && !Array.isArray(back) && typeof back.slots === "object", "读回结构通过（isTrustedBase 同判据）")
})
test("L5-4 并发两写者（条目级合并回归）：新条目存活 ∧ setActive / deletions 判据零改", () => {
  putManifest({ slots: { 1: { updatedAt: 1 }, 2: { updatedAt: 2 }, 3: { updatedAt: 3 } } })
  const a = loadManifest(CWD)
  const b = loadManifest(CWD) // B 先读（同窗快照——不含 A 的新条目）
  a.slots[4] = { updatedAt: 44 }
  a.active = 4
  assert.equal(saveManifest(CWD, a, null, { setActive: true }), true, "写者 A 落盘")
  b.slots[2] = { updatedAt: 22 }
  assert.equal(saveManifest(CWD, b, { slots: [3], slotSessions: [3] }), true, "写者 B 落盘（deletions 显式删除）")
  const m = loadManifest(CWD)
  assert.equal(m.slots[4].updatedAt, 44, "A 的新条目不被 B 的陈旧快照抹除（条目级合并）")
  assert.equal(m.slots[2].updatedAt, 22, "B 的写入在场")
  assert.equal(m.slots[3], undefined, "deletions 删除生效（判据零改）")
  assert.equal(m.active, 4, "setActive 意图保留（B 不传 ⇒ 不回滚）")
})
