/**
 * session-end-param.test.mjs — 端名参数化 + 槽创建端（`createdBy`）行为组
 * （SESSION.md §6.20 · SLOT-END-PARAM 批 T1–T12）。
 *
 * 手法：真实临时会话目录（`_setSessionsDirForTest` 隔离缝）+ 真实槽文件——断言落在
 * **磁盘可观察结果**上（marker 文件名 / 槽文件字段 / manifest 摘要 / 轮转产物）。
 * 本档与存量用例档（`session-slot-write.test.mjs`）分离：本批 12 例追加会使核档越 500
 * 行硬限，按设计档 §2.9 发现 5 的拆分预案外提为独立用例档（两档夹具各自独立）。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  END, _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, listSlots, loadManifest,
  manifestPath, readEndMarker, sessionEnd, sessionPath, setSessionEnd, slotDigest, slotPath,
  writeEndMarker,
} from "../session-slots.mjs"
import {
  _resetSlotMtimeCacheForTest, newSlotData, saveSlotData, setSlotAutoApprove,
} from "../session-slot-write.mjs"
import { resumeSlot, saveSession } from "../session.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\end-param-test" : "/proj/end-param-test"
const MSG = { role: "user", content: "hi" }

/** 端记录文件路径——**用例内惰性求值**：`manifestPath` 随会话目录隔离缝变化，
 *  顶层求值会落到真实用户目录（用例绝不许碰临时目录之外）。 */
function markerPath(end) { return `${manifestPath(CWD)}.${end}` }

let dir = null
before(() => {
  dir = mkdtempSync(join(tmpdir(), "core-end-param-"))
  _setSessionsDirForTest(dir)
  // 隔离自检（机制门）：本档一切路径必须落在临时目录内。
  assert.ok(manifestPath(CWD).startsWith(dir), `隔离缝失效：${manifestPath(CWD)} 不在 ${dir} 内`)
})
after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
beforeEach(() => { _setSessionsDirForTest(dir); _resetSlotMtimeCacheForTest() })

/** 端名声明夹具（§6.20 判据句 1）：端名 = 进程内单值 ⇒ 用例内声明、退出复原 END，
 *  防跨用例泄漏（核零声明缺省即「cli」）。 */
function withEnd(end, fn) {
  setSessionEnd(end)
  try { return fn() } finally { setSessionEnd(END) }
}

/** 本端记录清场（marker 家族缺省落到进程端名 ⇒ 前置态须显式清）。 */
function clearMarkers() {
  for (const e of ["cli", "vscode", "vsc"]) rmSync(markerPath(e), { force: true })
}

/** 槽文件落盘辅助（写入已知形态的槽记录；`createdBy` 由 mutate 决定）。 */
function putSlot(mutate = () => {}, slot = 1) {
  const data = { ...newSlotData(CWD), sessionStart: "s-1", history: [MSG] }
  mutate(data)
  writeFileSync(slotPath(CWD, slot), JSON.stringify(data))
}

/** 核保存面盘上夹具：`history` 与 agent `_fullHistory` 同源（免触发同会话并发追加轮转）。 */
function putCoreSlot(slot, extra = {}) {
  writeFileSync(slotPath(CWD, slot), JSON.stringify({ version: 2, cwd: CWD, sessionStart: "s-1", history: [MSG], ...extra }))
}

/** 核保存面最小 agent：`_slot` 显式给定（免认领副作用），`_fullHistory` 对齐盘面。 */
function coreAgent(slot) {
  return { cwd: CWD, _slot: slot, history: [], _fullHistory: [MSG], _sessionStart: "s-1", config: {} }
}

/** 核保存面最小 agent（全新槽：盘上无文件、无历史）。 */
function freshAgent(slot) {
  return { cwd: CWD, _slot: slot, history: [], _fullHistory: [], _sessionStart: "s-1", config: {} }
}

function readSlot(slot) { return JSON.parse(readFileSync(slotPath(CWD, slot), "utf8")) }

/** 盘面复位：槽文件 + `m.slots` 条目（无属主 / 无 active 指针——T10 逐态自设）。 */
function seedSlots(...slots) {
  writeFileSync(manifestPath(CWD), JSON.stringify({ version: 2, slots: {}, slotSessions: {}, sessionId: null }))
  const m = loadManifest(CWD)
  for (const s of slots) { putSlot(() => {}, s); m.slots[s] = { updatedAt: 1 } }
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
}

function setActive(slot) {
  const m = loadManifest(CWD)
  m.active = slot
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
}

test("T1 端名声明（§6.20 判据句 1/2）：setSessionEnd 后 marker 缺省随进程端名", () => {
  clearMarkers()
  withEnd("vscode", () => {
    writeEndMarker(CWD, 3)
    assert.equal(existsSync(markerPath("vscode")), true, "落本端后缀（{hash}.json.manifest.vscode）")
    assert.equal(existsSync(markerPath("cli")), false, "他端后缀零创建")
    assert.equal(readEndMarker(CWD).slot, 3, "缺省读 = 进程端名")
    assert.equal(readEndMarker(CWD, "cli"), null, "显式异端读 ⇒ 缺失")
    assert.equal(sessionEnd(), "vscode", "端名 = 进程内单值声明")
  })
})

test("T2 显式端参优先（判据句 2）：writeEndMarker(cwd, slot, \"cli\") 落 .cli", () => {
  clearMarkers()
  withEnd("vscode", () => {
    writeEndMarker(CWD, 4, "cli")
    assert.equal(existsSync(markerPath("cli")), true, "显式端参胜进程端名")
    assert.equal(existsSync(markerPath("vscode")), false, "进程端名不落")
    assert.equal(readEndMarker(CWD, "cli").slot, 4, "显式端读同址")
    assert.equal(readEndMarker(CWD), null, "进程端读该文件 ⇒ 缺失")
    // NF1（§6.20 判据句 5）：marker 形态恒两键——`createdBy` 这类跨端事实绝不进 marker
    assert.deepEqual(
      Object.keys(JSON.parse(readFileSync(markerPath("cli"), "utf8"))), ["slot", "updatedAt"],
      "marker 恒 {slot, updatedAt}（无第三键）",
    )
  })
})

test("T3 零回归（CLI 态缺省）：resumeSlot(cwd) 读写 .cli，端名缝不改既有语义", async () => {
  seedSlots(41)
  setActive(41)
  clearMarkers()
  assert.equal(sessionEnd(), "cli", "前置：进程端名零声明缺省 = cli")
  const r = await resumeSlot(CWD)
  assert.equal(r.slot, 41, "本端记录缺失 ⇒ 一次性继承 active（既有路径不变）")
  assert.equal(readEndMarker(CWD).slot, 41, "本端记录经 .cli 读写")
  assert.equal(existsSync(markerPath("cli")), true)
  assert.equal(existsSync(markerPath("vscode")), false, "他端后缀零创建")
})

test("T4 全新槽首物化记创建端（判据句 4 写面）：核 saveSession ∥ 槽写面 saveSlotData", () => {
  seedSlots()
  saveSession(freshAgent(50))
  assert.equal(readSlot(50).createdBy, "cli", "核面：缺省端名即创建端")
  withEnd("vscode", () => {
    saveSession(freshAgent(51))
    assert.equal(readSlot(51).createdBy, "vscode", "核面：声明端名即创建端")
    saveSlotData(CWD, 52, { version: 2, cwd: CWD, sessionStart: "s-1", history: [] })
    assert.equal(readSlot(52).createdBy, "vscode", "槽写面（VSC saveSessionToSlot 同体）：首物化记本端名")
  })
  saveSlotData(CWD, 53, { version: 2, cwd: CWD, sessionStart: "s-1", history: [] })
  assert.equal(readSlot(53).createdBy, "cli", "槽写面：缺省端名即创建端")
})

test("T5 老槽无键 ⇒ 禁回填（判据句 4 ∥ 边界行 1）：写后仍无键 + 列表条目标「未知」", () => {
  putSlot((d) => { delete d.createdBy }, 54)
  saveSlotData(CWD, 54, { ...readSlot(54), engineering: true })
  assert.equal("createdBy" in readSlot(54), false, "文件在盘 ⇒ 键不落（禁回填）")
  assert.equal(listSlots(CWD).find((s) => s.slot === 54).createdBy, "", "摘要缺键 ⇒ 「未知」")
  putCoreSlot(55)
  saveSession(coreAgent(55))
  assert.equal("createdBy" in readSlot(55), false, "核面同判据（守卫透传 null ⇒ 不补写）")
  assert.equal("createdBy" in loadManifest(CWD).slots[55], false, "摘要同判据（有值才带）")
})

test("T6 盘上有键 ⇒ 透传不自改（判据句 4 边界行 2）：本端 vscode 保存仍留 desktop", () => {
  putCoreSlot(56, { createdBy: "desktop" })
  withEnd("vscode", () => saveSession(coreAgent(56)))
  assert.equal(readSlot(56).createdBy, "desktop", "核面：不贴本端名")
  assert.equal(loadManifest(CWD).slots[56].createdBy, "desktop", "摘要带同一来源")
  withEnd("vscode", () => saveSlotData(CWD, 56, { ...readSlot(56), planMode: true }))
  assert.equal(readSlot(56).createdBy, "desktop", "槽写面：数据面透传同判据")
})

test("T7 轮转 ⇒ 本端重物化（判据句 4 分支）：异会话现场让位后 createdBy = 本端名", () => {
  putCoreSlot(57, { sessionStart: "s-other", createdBy: "desktop" })
  withEnd("vscode", () => saveSession(coreAgent(57)))
  assert.equal(readSlot(57).createdBy, "vscode", "轮转 ⇒ 本端首物化该文件（不继承异会话现场端名）")
  const baks = readdirSync(dir).filter((n) => n.includes(".bak-"))
  assert.equal(baks.length, 1, "现场以 .bak 保留")
  assert.equal(JSON.parse(readFileSync(join(dir, baks[0]), "utf8")).createdBy, "desktop", ".bak 保下原现场")
})

test("T8 认领后槽文件被删 ⇒ 首保存记本端名（判据句 4 边界行 3）", () => {
  putSlot(() => {}, 58)
  rmSync(slotPath(CWD, 58), { force: true })
  const m = loadManifest(CWD)
  m.slotSessions = { ...(m.slotSessions ?? {}), 58: getSessionId() }
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
  withEnd("vscode", () => assert.equal(setSlotAutoApprove(CWD, 58, true), true, "认领面在 ⇒ 槽可写"))
  const onDisk = readSlot(58)
  assert.equal(onDisk.createdBy, "vscode", "重新物化 ⇒ 记本端名")
  assert.equal(onDisk.autoApprove, true, "开关值照写")
  assert.deepEqual(onDisk.history, [], "全新记录历史留空（其余字段形态不变）")
  assert.equal(onDisk.version, 2)
})

test("T9 核不校验端名（§6.20 边界行 4）：拼错端名 ⇒ 字面落后缀，异端读退化缺失", () => {
  clearMarkers()
  withEnd("vsc", () => {
    writeEndMarker(CWD, 5)
    assert.equal(existsSync(markerPath("vsc")), true, "字面端名直落后缀（核零校验）")
    assert.equal(readEndMarker(CWD).slot, 5, "同端自读自洽")
    assert.equal(readEndMarker(CWD, "vscode"), null, "异端读 ⇒ 缺失（退化为从未记录）")
  })
})

test("T10 三态语义零回归（D-1）：有值 ⇒ 用记录槽；slot:null ⇒ 绝不继承；缺失 ⇒ 一次性继承", async () => {
  // ③ 有值：本端记录槽 = 42（active 指向 41 亦不夺）
  seedSlots(41, 42); setActive(41); clearMarkers(); writeEndMarker(CWD, 42)
  // NF1：槽数据面带 `createdBy` 而 marker 仍两键（跨端事实不越层）
  assert.deepEqual(
    Object.keys(JSON.parse(readFileSync(markerPath("cli"), "utf8"))), ["slot", "updatedAt"],
    "槽数据带 createdBy ⇒ marker 仍 {slot, updatedAt}",
  )
  let r = await resumeSlot(CWD)
  assert.equal(r.slot, 42, "有值 ⇒ 用本端记录槽")

  // ② slot:null：显式置空 ⇒ 全新分配（绝不继承 active）
  seedSlots(41, 42); setActive(41); clearMarkers(); writeEndMarker(CWD, null)
  r = await resumeSlot(CWD)
  assert.equal(r.slot, 43, "slot:null ⇒ 绝不继承（全新号）")

  // ① 缺失：从未记录 ⇒ 一次性继承 active
  seedSlots(41, 42); setActive(41); clearMarkers()
  r = await resumeSlot(CWD)
  assert.equal(r.slot, 41, "缺失 ⇒ 一次性继承 active（升级窗口既有语义）")
  assert.equal(existsSync(markerPath("vscode")), false, "三态读取不越端")
})

test("T11 端差注销（§6.15 端壳款①）：槽文件不在盘 ⇒ 核 legacy 单文件兜底（原端壳副本无此项）", async () => {
  seedSlots()
  clearMarkers()
  writeFileSync(sessionPath(CWD), JSON.stringify({ version: 2, cwd: CWD, history: [MSG], sessionStart: "s-legacy" }))
  const r = await resumeSlot(CWD)
  assert.ok(r.data, "槽文件不在盘 ⇒ legacy 兜底给出数据（核兜底路径存活）")
  assert.deepEqual(r.data.history, [MSG])
})

test("T12 读面直断言（判据句 4 读面）：摘要「有值才带」+ 绑定存储摘要同判据", () => {
  assert.equal(slotDigest({ history: [MSG], createdBy: "desktop" }).createdBy, "desktop", "slotDigest：有值带上")
  assert.equal("createdBy" in slotDigest({ history: [MSG] }), false, "slotDigest：无键不带（老槽 = 未知）")

  seedSlots()
  withEnd("vscode", () => saveSession(freshAgent(59)))
  assert.equal(loadManifest(CWD).slots[59].createdBy, "vscode", "digestFromStore（真绑定存储面）：有值带上")

  putCoreSlot(60)
  saveSession(coreAgent(60))
  assert.equal("createdBy" in loadManifest(CWD).slots[60], false, "老槽无键 ⇒ 摘要不带（禁回填同判据）")
  assert.equal(listSlots(CWD).find((s) => s.slot === 60).createdBy, "", "列表消费面：缺键 ⇒ 渲染值 \"\"（未知）")
})
