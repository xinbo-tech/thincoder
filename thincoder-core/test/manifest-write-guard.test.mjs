/**
 * manifest-write-guard.test.mjs — manifest 降级写护栏（MANIFEST-WRITE-GUARD 批 · 2026-09-28 ·
 * SESSION.md §6.23 判据句 1–3 / D-SE59；用例表 = 批档 2026-09-28-manifest-write-guard.md §2.4 G1–G11）。
 *
 * 手法：真实临时会话目录（`_setSessionsDirForTest` 隔离缝）+ **真实文件系统故障注入**（目录占位 ⇒
 * EISDIR / 坏字节 / 异形 JSON——不加 fs 桩）；断言落在磁盘可观察结果上（盘面零变更 / 改名逐字节
 * 一致 / stderr 一行 / 返回值）。G9–G11 = 零回归锚（认领链 / 退出释放 / 槽文件面——护栏只管 manifest）。
 */
import { test, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, activeSlot, claimSlot, getSessionId, loadManifest, manifestPath, slotPath } from "../session-slots.mjs"
import { releaseClaimsAll, saveManifest } from "../session-slots-manifest.mjs"
import { switchToSlot } from "../session.mjs"
import { _resetSlotMtimeCacheForTest, newSlotData, saveSlotData } from "../session-slot-write.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\manifest-guard-test" : "/proj/manifest-guard-test"

let sessionsDir = null
const dirs = []
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "core-manifest-guard-")) // 每用例独立目录（盘面零变更断言不受他例干扰）
  dirs.push(sessionsDir)
  _setSessionsDirForTest(sessionsDir)
  _resetSlotMtimeCacheForTest()
})
after(() => {
  _resetSessionsDirForTest()
  for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

/** stderr 捕获（loud 行断言面——只截 console，不改 fs）。 */
function captureStderr(fn) {
  const lines = []
  const orig = console.error
  console.error = (...args) => { lines.push(args.join(" ")) }
  try { fn() } finally { console.error = orig }
  return lines
}

/** 会话目录条目名集（零变更断言面）。 */
const listing = () => readdirSync(sessionsDir).slice().sort()

/** manifest 夹具（对象 ⇒ JSON；字符串 ⇒ 原字节）。 */
function putManifest(obj) {
  writeFileSync(manifestPath(CWD), typeof obj === "string" ? obj : JSON.stringify(obj))
  return obj
}

/** 槽文件夹具（认领链用例）：真实槽数据（version 2 + history 数组 + cwd 匹配）。 */
function putSlot(slot) {
  writeFileSync(slotPath(CWD, slot), JSON.stringify({ ...newSlotData(CWD), sessionStart: `s-${slot}`, history: [] }))
  return slotPath(CWD, slot)
}

test("G1 正常 · 首建：无 manifest ⇒ 建新档（内容 = m）∧ true", () => {
  assert.equal(existsSync(manifestPath(CWD)), false, "前置：路径不存在")
  const m = { slots: { 1: { updatedAt: 1 } }, slotSessions: {} }
  assert.equal(saveManifest(CWD, m), true, "首建 ⇒ true")
  assert.equal(m.sessionId, getSessionId(), "写入前落本进程 sessionId（既有语义）")
  assert.deepEqual(JSON.parse(readFileSync(manifestPath(CWD), "utf8")), { ...m }, "内容 = 调用方对象")
})

test("G2 正常 · 合并零改：盘 50 条 + m 1 条 ⇒ 51 条（deletions / setActive 回归面）", () => {
  const slots = {}
  for (let i = 1; i <= 50; i++) slots[i] = { updatedAt: i, title: `t${i}` }
  putManifest({ slots, slotSessions: {}, sessionId: null, active: 1 })

  const m = loadManifest(CWD)
  m.slots[51] = { updatedAt: 51, title: "t51" }
  assert.equal(saveManifest(CWD, m), true)
  const a1 = loadManifest(CWD)
  assert.equal(Object.keys(a1.slots).length, 51, "50 + 1 = 51 条")
  assert.equal(a1.slots[2].title, "t2", "盘上原有条目原样保留（读-合并-写零改）")
  assert.equal(a1.slots[51].title, "t51", "调用方新条目落地")
  assert.equal(a1.active, 1, "默认保留 fresh.active（D-6——非显式翻指针调用点）")

  const m2 = loadManifest(CWD)
  m2.slots[52] = { updatedAt: 52 }
  assert.equal(saveManifest(CWD, m2, { slots: ["52"] }), true)
  assert.equal(loadManifest(CWD).slots[52], undefined, "deletions 显式删除生效（条目级合并不复活）")

  const m3 = loadManifest(CWD)
  m3.active = 7
  assert.equal(saveManifest(CWD, m3, null, { setActive: true }), true)
  assert.equal(loadManifest(CWD).active, 7, "setActive ⇒ 翻指针")
})

test("G3 错误 · 读失败注入（目录占位 ⇒ EISDIR）：零写 ∧ 不改名 ∧ stderr read-failed ∧ false", () => {
  const p = manifestPath(CWD)
  mkdirSync(p)
  writeFileSync(join(p, "keep.txt"), "x")
  const before = listing()
  const lines = captureStderr(() => {
    assert.equal(saveManifest(CWD, { slots: { 1: { updatedAt: 1 } }, slotSessions: {} }), false, "拒写 ⇒ false")
  })
  assert.equal(statSync(p).isDirectory(), true, "原路径仍为目录（未改名 / 未重建）")
  assert.equal(readFileSync(join(p, "keep.txt"), "utf8"), "x", "目录内现场原样")
  assert.deepEqual(listing(), before, "盘面零变更（零写 · 零改名 · 零 .tmp）")
  assert.equal(lines[0], `[session] saveManifest: write refused (reason=read-failed) path=${p}`, "stderr 行字面（读不到 ≠ 损坏——无 preserved）")
  assert.equal(lines.length, 1, "loud 恰一行")
})

test("G4 错误 · 解析失败注入：原字节改名 .corrupted ∧ 原路径未重建 ∧ stderr parse-failed ∧ false", () => {
  const p = manifestPath(CWD)
  const bytes = '{"slots":{"1":{"updatedAt":1}}'
  writeFileSync(p, bytes)
  const lines = captureStderr(() => {
    assert.equal(saveManifest(CWD, { slots: {}, slotSessions: {} }), false, "拒写 ⇒ false")
  })
  assert.equal(existsSync(p), false, "原路径不存在（拒写——不重建）")
  assert.equal(readFileSync(`${p}.corrupted`, "utf8"), bytes, "现场逐字节一致")
  assert.equal(lines[0], `[session] saveManifest: write refused (reason=parse-failed) path=${p} preserved=${p}.corrupted`, "stderr 行字面")
  assert.equal(lines.length, 1, "loud 恰一行")
})

test("G5 错误 · 形态非法注入（顶层数组 ∥ slots 非对象 ∥ 顶层 null）：同 G4（shape-invalid）", () => {
  for (const [label, bad] of [["顶层数组", "[1,2,3]"], ["slots 非对象", '{"slots":42}'], ["顶层 null", "null"]]) {
    const p = manifestPath(CWD)
    writeFileSync(p, bad)
    const lines = captureStderr(() => {
      assert.equal(saveManifest(CWD, { slots: {}, slotSessions: {} }), false, `${label} ⇒ false`)
    })
    assert.equal(existsSync(p), false, `${label}：原路径未重建`)
    assert.equal(readFileSync(`${p}.corrupted`, "utf8"), bad, `${label}：现场逐字节一致（单槽位 last-wins）`)
    assert.equal(lines[0], `[session] saveManifest: write refused (reason=shape-invalid) path=${p} preserved=${p}.corrupted`, `${label}：stderr 行字面`)
    assert.equal(lines.length, 1, `${label}：loud 恰一行`)
  }
})

test("G6 边界 · 空基座 {}：正常合并写（2 条落地）∧ 零告警", () => {
  const p = manifestPath(CWD)
  writeFileSync(p, "{}")
  const lines = captureStderr(() => {
    assert.equal(saveManifest(CWD, { slots: { 1: { updatedAt: 1 }, 2: { updatedAt: 2 } }, slotSessions: {} }), true, "{} = 合法空基座 ⇒ 可合并、不拒写")
  })
  assert.deepEqual(lines, [], "零告警")
  assert.equal(existsSync(`${p}.corrupted`), false, "零改名")
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(p, "utf8")).slots).sort(), ["1", "2"], "2 条落地")
})

test("G7 边界 · 解封后首建：G4 拒写改名后再 saveManifest（原路径已空）⇒ 建新档 ∧ true", () => {
  const p = manifestPath(CWD)
  writeFileSync(p, "{oops")
  captureStderr(() => assert.equal(saveManifest(CWD, { slots: {}, slotSessions: {} }), false))
  assert.equal(existsSync(p), false, "前置：原路径已空（现场挪至 .corrupted）")

  const m = { slots: { 7: { updatedAt: 7 } }, slotSessions: {}, active: 7 }
  const lines = captureStderr(() => assert.equal(saveManifest(CWD, m, null, { setActive: true }), true, "解封后首建 ⇒ true"))
  assert.deepEqual(lines, [], "首建无告警")
  assert.deepEqual(JSON.parse(readFileSync(p, "utf8")), { ...m }, "新档内容 = 本次调用对象")
  assert.equal(readFileSync(`${p}.corrupted`, "utf8"), "{oops", "上一轮现场保留（未被清除）")
})

test("G8 边界 · 信号 / 透传：releaseClaimsAll 落盘 ⇒ true；拒写面 ⇒ false", () => {
  const p = manifestPath(CWD)
  // ① 可读档 + 本进程认领 ⇒ 释放落盘 true（G2 面）
  putManifest({ slots: { 1: { updatedAt: 1 } }, slotSessions: { 1: getSessionId() }, sessionId: null, active: 1 })
  assert.equal(releaseClaimsAll(CWD), true, "正常面 ⇒ true")
  assert.equal(loadManifest(CWD).slotSessions[1], undefined, "认领清零")

  // ② G3 面（目录占位）：loadManifest 降级读 ⇒ 无认领早退——零写零告警 ⇒ false
  rmSync(p, { force: true })
  mkdirSync(p)
  const quiet = captureStderr(() => assert.equal(releaseClaimsAll(CWD), false, "不可信读面 ⇒ false"))
  assert.deepEqual(quiet, [], "早退面零写（不产生 saveManifest loud 行）")
  rmSync(p, { recursive: true, force: true })

  // ③ 透传直证（判据句 3）：读面可读（认领在场）而写面判「形态非法」⇒ 拒写经 releaseClaimsAll 透传 false
  const bytes = JSON.stringify({ slots: 42, slotSessions: { 1: getSessionId() }, sessionId: null })
  writeFileSync(p, bytes)
  const lines = captureStderr(() => assert.equal(releaseClaimsAll(CWD), false, "拒写 ⇒ 透传 false"))
  assert.equal(lines.length, 1, "透传路径经 saveManifest 拒写 loud 行")
  assert.equal(lines[0], `[session] saveManifest: write refused (reason=shape-invalid) path=${p} preserved=${p}.corrupted`, "stderr 行字面（透传路经拒写面）")
  assert.equal(readFileSync(`${p}.corrupted`, "utf8"), bytes, "现场保全（拒写面改名）")
})

test("G9 零回归 · 认领链：claimSlot / switchToSlot / activeSlot 粘性——合并 / setActive / release 三判据", () => {
  const seed = { version: 2, slots: { 40: { updatedAt: 40 }, 41: { updatedAt: 41 } }, slotSessions: {}, sessionId: null, active: null }
  putManifest(seed)
  putSlot(40)
  putSlot(41)

  const my = getSessionId()
  claimSlot(CWD, 41)
  assert.deepEqual(loadManifest(CWD), { ...seed, slotSessions: { 41: my }, sessionId: my, active: 41 }, "claimSlot 档面语义等价（合并保留 + setActive + 认领落盘）")
  assert.equal(
    readFileSync(manifestPath(CWD), "utf8"),
    JSON.stringify({ ...seed, slotSessions: { 41: my }, sessionId: my, active: 41 }),
    "claimSlot 档面逐字节等价（键序 = fresh 继承序 + 整数键升序）",
  )

  assert.ok(switchToSlot(CWD, 40), "切槽成立（读目标槽数据）")
  const m2 = loadManifest(CWD)
  assert.equal(m2.slotSessions[40], my, "目标槽认领 = 本进程")
  assert.equal(m2.slotSessions[41], undefined, "旧绑定释放（release 判据）")
  assert.equal(m2.active, 40, "共享指针翻至目标（setActive）")
  assert.deepEqual(m2.slots, seed.slots, "m.slots 摘要条目零动")

  const bytes = readFileSync(manifestPath(CWD), "utf8")
  assert.equal(activeSlot(CWD), 40, "已拥有 active ⇒ 粘性复用")
  assert.equal(readFileSync(manifestPath(CWD), "utf8"), bytes, "粘性早退：零写（档面逐字节不变）")
})

test("G10 零回归 · 退出释放：releaseClaimsAll 正常（可读档）⇒ true ∧ 认领清零", () => {
  const other = `${process.pid}-0-other-end`
  putManifest({ slots: { 40: { updatedAt: 40 }, 41: { updatedAt: 41 } }, slotSessions: { 40: other, 41: getSessionId() }, sessionId: null, active: 41 })

  assert.equal(releaseClaimsAll(CWD), true, "有释放且落盘成功 ⇒ true")
  const m = loadManifest(CWD)
  assert.equal(m.slotSessions[41], undefined, "本进程认领清零（保留集空）")
  assert.equal(m.slotSessions[40], other, "他端认领零动（值条件删除）")
  assert.deepEqual(m.slots, { 40: { updatedAt: 40 }, 41: { updatedAt: 41 } }, "摘要条目零动")
  assert.equal(m.active, 41, "active 共享指针不动（释放不 setActive）")
})

test("G11 零回归 · 槽文件面：槽解析失败 ⇒ .json.N.corrupted 保全 + 目标档照写（护栏只管 manifest）", () => {
  const p = slotPath(CWD, 4)
  const bytes = "{ this is not json"
  writeFileSync(p, bytes)

  assert.equal(saveSlotData(CWD, 4, { ...newSlotData(CWD), sessionStart: "mine" }), null, "损坏面不产 .bak（走 .corrupted）")
  assert.equal(readFileSync(`${p}.corrupted`, "utf8"), bytes, "槽损坏现场保全（逐字节一致）")
  assert.equal(JSON.parse(readFileSync(p, "utf8")).sessionStart, "mine", "目标档照写（槽面不受 manifest 护栏波及）")
})
