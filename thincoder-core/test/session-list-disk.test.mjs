/**
 * session-list-disk.test.mjs — 会话清单盘面实读 + 可达性扩展行为组
 * （SESSION.md §6.22 · SESSION-LIST-DISK 批 · T-SD1–T-SD18）。
 *
 * 手法：真实临时会话目录（`_setSessionsDirForTest` 隔离缝）+ 真实槽文件 / manifest——断言落在
 * **盘面可观察结果**上（条目集 / 行字段 / 槽文件读计数桩 / manifest 零写）。本档与存量用例档
 * 分离（新档独立夹具——存量档零编辑）。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  _resetSessionsDirForTest, _setSessionsDirForTest, deleteSlot, listSlots, loadManifest,
  manifestPath, readEndMarker, saveManifest, sessionPath, slotPath, writeEndMarker,
} from "../session-slots.mjs"
import { resumeSlot, switchToSlot } from "../session-lifecycle.mjs"
import { _resetScanStats, _scanStats, SCAN_BUDGET_BYTES, SCAN_FULL_MAX, SCAN_HEAD_BYTES } from "../session-slot-scan.mjs"
import { _resetVerifyStateForTest } from "../session-slot-verify.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\list-disk-test" : "/proj/list-disk-test"
const MSG = (content) => ({ role: "user", content })
let dir = null

before(() => {
  dir = mkdtempSync(join(tmpdir(), "core-list-disk-"))
  _setSessionsDirForTest(dir)
  // 隔离自检（机制门）：本档一切路径必须落在临时目录内。
  assert.ok(manifestPath(CWD).startsWith(dir), `隔离缝失效：${manifestPath(CWD)} 不在 ${dir} 内`)
})
after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
beforeEach(() => {
  for (const e of readdirSync(dir)) rmSync(join(dir, e), { recursive: true, force: true })
  _resetScanStats()
  _resetVerifyStateForTest() // 核实面隔离（§6.25）：清 pending 拍 / 负缓存——免跨例残留轮改判
})

/** 槽数据夹具（写者键序同形：`version` / `cwd` 靠前、`history` 在标题族之后）。 */
function slotData(mutate = () => {}) {
  const d = {
    version: 2, cwd: CWD, title: "", activeProvider: "prov", activeModel: null, updatedAt: 7,
    tasks: [], planMode: false, autoApprove: false, goal: null, pendingReminders: [],
    sessionStart: "s-1", history: [], contextHistory: [],
  }
  mutate(d)
  return d
}
function putSlot(slot, mutate) { writeFileSync(slotPath(CWD, slot), JSON.stringify(slotData(mutate))) }
function putRaw(slot, text) { writeFileSync(slotPath(CWD, slot), text) }
/** 大档（> `SCAN_FULL_MAX`）夹具——③ 早键截读路径；填充物在用户消息**之后**（首条真实消息在头窗内）。 */
function putBigSlot(slot, mutate) {
  writeFileSync(slotPath(CWD, slot), JSON.stringify(slotData((d) => {
    mutate(d)
    d.history.push({ role: "tool", name: "pad", content: "x".repeat(SCAN_FULL_MAX + 1024) })
  })))
}

test("T-SD1 盘在无条目 ⇒ 条目入列 ∧ manifest 零写", () => {
  putSlot(3, (d) => { d.title = "disk-only"; d.updatedAt = 111; d.history = [MSG("hello")] })
  const rows = listSlots(CWD)
  assert.deepEqual(rows.map((r) => r.slot), [3], "盘上槽入列（manifest 无该条目）")
  assert.equal(rows[0].title, "disk-only", "title 由盘面供给")
  assert.equal(rows[0].firstMessage, "hello", "firstMessage 由盘面供给")
  assert.equal(existsSync(manifestPath(CWD)), false, "清单链零写：manifest 文件都不建")
})

test("T-SD2 槽文件删除 ⇒ 列表即消失", () => {
  putSlot(4, (d) => { d.title = "gone"; d.updatedAt = 1; d.history = [MSG("x")] })
  assert.equal(listSlots(CWD).some((r) => r.slot === 4), true, "删除前可见")
  rmSync(slotPath(CWD, 4), { force: true })
  assert.equal(listSlots(CWD).some((r) => r.slot === 4), false, "文件删除 ⇒ 条目消失")
})

test("T-SD3 回退链照旧：无 title ∧ 头窗内首条真实消息（reminder 跳过）", () => {
  putBigSlot(5, (d) => { d.title = ""; d.history = [MSG("[System reminder: x]"), MSG("第一条真实用户消息")] })
  const rows = listSlots(CWD)
  assert.deepEqual(_scanStats.reads.map((r) => r.window), ["head"], ">256 KiB ⇒ ③ 早键截读（非全读）")
  assert.equal(rows[0].title, "", "无 title ⇒ 回退链下一环")
  assert.equal(rows[0].firstMessage, "第一条真实用户消息", "首条真实 user 消息前 80 字（reminder 不计）")
})

test("T-SD4 摘要快路 ⇒ 槽文件零字节读（整条由摘要供给）", () => {
  putSlot(6, (d) => { d.title = "disk-title"; d.history = [MSG("disk-msg")]; d.updatedAt = 3 })
  const mtime = statSync(slotPath(CWD, 6)).mtimeMs
  const m = loadManifest(CWD)
  m.slots[6] = {
    ts: mtime + 1, messageCount: 7, turnCount: 3, firstMessage: "digest-msg",
    activeProvider: "prov", activeModel: "mod", updatedAt: mtime - 5000, title: "digest-title",
  }
  saveManifest(CWD, m)
  _resetScanStats()
  const r = listSlots(CWD).find((x) => x.slot === 6)
  assert.equal(_scanStats.bytes, 0, "槽文件读字节 = 0")
  assert.equal(_scanStats.fastPath, 1, "① 命中一次")
  assert.deepEqual(
    [r.title, r.firstMessage, r.messageCount, r.turnCount, r.activeProvider, r.updatedAt],
    ["digest-title", "digest-msg", 7, 3, "prov:mod", mtime - 5000],
    "整条来自摘要",
  )
})

test("T-SD5 读放大上界：Σ ≤ 预算 ∧ 单档 ≤ 256 KiB ∧ 超档 ≤ 64 KiB ∧ 越预算退 ④", () => {
  for (let i = 1; i <= 18; i++) putSlot(i, (d) => { d.title = `s${i}`; d.history = [MSG("m"), { role: "tool", name: "t", content: "p".repeat(240 * 1024) }] })
  putBigSlot(19, (d) => { d.title = "b1"; d.history = [MSG("m")] })
  putBigSlot(20, (d) => { d.title = "b2"; d.history = [MSG("m")] })
  _resetScanStats()
  const rows = listSlots(CWD)
  assert.equal(rows.length, 20, "条目集 = 盘面全数")
  assert.ok(_scanStats.bytes <= SCAN_BUDGET_BYTES, `Σ 槽文件读 ${_scanStats.bytes} ≤ ${SCAN_BUDGET_BYTES}`)
  for (const read of _scanStats.reads) {
    assert.ok(read.bytes <= SCAN_FULL_MAX, `单档读 ${read.bytes} ≤ ${SCAN_FULL_MAX}`)
    if (read.window === "head") assert.ok(read.bytes <= SCAN_HEAD_BYTES, `超档仅读头窗 ${read.bytes} ≤ ${SCAN_HEAD_BYTES}`)
  }
  const starved = rows.filter((r) => r.title === "")
  assert.ok(starved.length >= 1, "越预算条目退 ④（读计数桩之外仍有条目）")
  for (const r of starved) assert.equal(r.updatedAt, statSync(slotPath(CWD, r.slot)).mtimeMs, "④ stat 兜底：日期 = mtime")
})

test("T-SD6 计数降级：大档 + 无摘要 ⇒ 计数不可得 = null（非 0）", () => {
  putBigSlot(7, (d) => { d.title = "big-no-digest"; d.history = [MSG("m1"), MSG("m2")] })
  const r = listSlots(CWD).find((x) => x.slot === 7)
  assert.equal(r.title, "big-no-digest", "头窗仍供 title（③ 命中）")
  assert.notEqual(r.messageCount, 0, "非 0（防与真 0 二义——§6.25 判据句 4）")
  assert.notEqual(r.turnCount, 0)
  assert.equal(r.messageCount, null, "计数不在 ③ 供给面 ⇒ 不可得 = null（D-SE62）")
  assert.equal(r.turnCount, null)
})

test("T-SD7 坏档入列：不抛 ∧ title \"\" ∧ 日期 = mtime", () => {
  putRaw(9, "{ 这不是 JSON")
  const rows = listSlots(CWD)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].slot, 9)
  assert.equal(rows[0].title, "")
  assert.equal(rows[0].firstMessage, "")
  assert.equal(rows[0].turnCount, null, "坏档 ⇒ 计数不可得 = null（非 0）")
  assert.equal(rows[0].updatedAt, statSync(slotPath(CWD, 9)).mtimeMs, "日期 = mtime")
  // 半写 / 结构不符（大档面）：`history` 非数组 ⇒ 内容面不可用（判据句 3 降级）
  writeFileSync(slotPath(CWD, 10), JSON.stringify({ ...slotData((d) => { d.title = "half-written" }), history: "not-an-array", pad: "x".repeat(SCAN_FULL_MAX + 1024) }))
  const r10 = listSlots(CWD).find((r) => r.slot === 10)
  assert.equal(r10.title, "", "内容面不可用 ⇒ 退缺省（非「头窗 title 照供」）")
  assert.equal(r10.updatedAt, statSync(slotPath(CWD, 10)).mtimeMs, "日期 = mtime")
})

test("T-SD8 后缀排除：条目集仅 {.json.N 普通文件}", () => {
  putSlot(4, (d) => { d.title = "keep"; d.history = [MSG("x")] })
  writeFileSync(`${slotPath(CWD, 4)}.bak-1`, "x")
  writeFileSync(`${slotPath(CWD, 4)}.corrupted`, "x")
  mkdirSync(`${slotPath(CWD, 4)}.d`)
  mkdirSync(slotPath(CWD, 20)) // 纯数字后缀**目录** ⇒ 唯一触到普通文件判（isFile）的形态
  writeFileSync(join(dir, `${'0'.repeat(40)}.json.7`), "x") // 他 cwd 槽文件（同根共享）⇒ 前缀判排除
  writeFileSync(manifestPath(CWD), "{}")
  writeFileSync(`${manifestPath(CWD)}.cli`, "{}")
  writeFileSync(sessionPath(CWD), "{}") // 遗留单档（D-SE57 不入列）
  assert.deepEqual(listSlots(CWD).map((r) => r.slot), [4], "零伪槽号、零目录误收、零异 cwd 误收")
})

test("T-SD9 空 / 缺 sessions 根 ⇒ []（不抛）", () => {
  assert.deepEqual(listSlots(CWD), [], "空根")
  _setSessionsDirForTest(join(dir, "does-not-exist"))
  try { assert.deepEqual(listSlots(CWD), [], "根不存在（ENOENT 吞）") } finally { _setSessionsDirForTest(dir) }
})

test("T-SD10 遗留单档不入列（D-SE57）", () => {
  writeFileSync(sessionPath(CWD), JSON.stringify({ version: 2, cwd: CWD, history: [MSG("legacy")] }))
  assert.deepEqual(listSlots(CWD), [])
})

test("T-SD11 可达性 · 可开：盘在 + 无条目 ⇒ switchToSlot 成立", () => {
  putSlot(6, (d) => { d.title = "open-me"; d.history = [MSG("hi")] })
  const data = switchToSlot(CWD, 6)
  assert.ok(data, "盘上存在 ⇒ 放行")
  assert.equal(data.history[0].content, "hi")
  assert.equal(loadManifest(CWD).active, 6, "active 翻 N")
  assert.equal(readEndMarker(CWD)?.slot, 6, "本端 marker 写 N")
})

test("T-SD12 可达性 · 可删：盘在 + 无条目 ⇒ deleteSlot 成立", () => {
  putSlot(7, (d) => { d.history = [MSG("bye")] })
  assert.equal(deleteSlot(CWD, 7), true)
  assert.equal(existsSync(slotPath(CWD, 7)), false, "文件已删")
  assert.equal(listSlots(CWD).some((r) => r.slot === 7), false, "列表不含")
})

test("T-SD13 可达性 · 可恢复：盘在 + 无条目 + marker 指 N ⇒ 判据①命中", async () => {
  putSlot(8, (d) => { d.title = "resume-me"; d.history = [MSG("resume me")] })
  writeEndMarker(CWD, 8)
  const r = await resumeSlot(CWD)
  assert.equal(r.slot, 8, "判据①命中——不落全新分配")
  assert.equal(r.data.history[0].content, "resume me")
})

test("T-SD14 可达性 · 负断言：无文件 ∧ 无条目 ⇒ 三面均不放行", async () => {
  putSlot(11, (d) => { d.history = [MSG("temp")] })
  deleteSlot(CWD, 11) // 已删槽：文件不在盘 ∧ 条目已清
  writeEndMarker(CWD, 11) // marker 仍指该槽
  assert.equal(switchToSlot(CWD, 11), null, "切换不放行")
  assert.equal(deleteSlot(CWD, 11), false, "删除不放行")
  const r = await resumeSlot(CWD)
  assert.notEqual(r.slot, 11, "恢复不选该号（已删槽不复活）")
})

test("T-SD15 零回归 · 旧分支：有条目 + 文件缺 ⇒ deleteSlot 仍成立", () => {
  const m = loadManifest(CWD)
  m.slots[11] = { ts: 1, messageCount: 0, turnCount: 0, firstMessage: "", activeProvider: "", updatedAt: 1, title: "ghost" }
  saveManifest(CWD, m)
  assert.deepEqual(listSlots(CWD), [], "无文件 ⇒ 不入列（幽灵行不复活）")
  assert.equal(deleteSlot(CWD, 11), true, "旧分支逐字保留（条目清理）")
  assert.equal(loadManifest(CWD).slots[11], undefined, "条目已清")
})

test("T-SD16 零回归 · 高亮：m.active = N（N 盘在无条目）⇒ isActive === true", () => {
  putSlot(12, (d) => { d.title = "active-one"; d.history = [MSG("a")] })
  putSlot(13, (d) => { d.title = "other"; d.history = [MSG("b")] })
  const m = loadManifest(CWD)
  m.active = 12
  saveManifest(CWD, m, null, { setActive: true })
  const rows = listSlots(CWD)
  assert.equal(rows.find((r) => r.slot === 12).isActive, true)
  assert.equal(rows.find((r) => r.slot === 13).isActive, false)
})

test("T-SD17 消费面契约：行字段名 / 次序 / 类型逐字段零变", () => {
  putSlot(14, (d) => { d.title = "row-shape"; d.history = [MSG("x")] })
  putRaw(15, "{ bad") // 降级行——计数 = null（不可得；消费面显示分流 = 段缺席 / —，另座落）
  const rows = listSlots(CWD)
  const normal = rows.find((r) => r.slot === 14)
  const degraded = rows.find((r) => r.slot === 15)
  assert.deepEqual(
    Object.keys(normal),
    ["slot", "isActive", "timestamp", "date", "messageCount", "turnCount", "firstMessage", "activeProvider", "updatedAt", "updatedDate", "title", "createdBy"],
    "字段名 / 次序 = 既有行形态（消费面六面零改的前提）",
  )
  for (const r of [normal, degraded]) {
    assert.equal(typeof r.slot, "number")
    assert.equal(typeof r.isActive, "boolean")
    assert.equal(typeof r.timestamp, "number")
    assert.equal(typeof r.date, "string")
    assert.equal(typeof r.messageCount === "number" || r.messageCount === null, true, "计数 ∈ {number, null}（不可得 = null——消费面分流门）")
    assert.equal(typeof r.turnCount === "number" || r.turnCount === null, true)
    assert.equal(typeof r.firstMessage, "string")
    assert.equal(typeof r.activeProvider, "string")
    assert.equal(typeof r.updatedAt, "number")
    assert.equal(typeof r.updatedDate, "string")
    assert.equal(typeof r.title, "string")
    assert.equal(typeof r.createdBy, "string")
  }
})

test("T-SD18 性能 · 启动路径：50 档 ⇒ listSlots ≤ 50 ms（F-SL1 硬线）", () => {
  for (let i = 1; i <= 50; i++) putBigSlot(i, (d) => { d.title = `p${i}`; d.history = [MSG(`m${i}`)] })
  const t0 = performance.now()
  const rows = listSlots(CWD)
  const ms = performance.now() - t0
  assert.equal(rows.length, 50, "条目全数入列")
  assert.ok(_scanStats.bytes <= SCAN_BUDGET_BYTES, `Σ 读 ${_scanStats.bytes} ≤ ${SCAN_BUDGET_BYTES}`)
  assert.ok(ms <= 50, `listSlots 50 档同步阻塞 ${ms.toFixed(1)}ms > 50ms`)
})
