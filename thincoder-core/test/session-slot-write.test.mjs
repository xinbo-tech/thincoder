/**
 * session-slot-write.test.mjs — 槽开关写面（cwd, slot 形态）行为组。
 *
 * 手法：真实临时会话目录（`_setSessionsDirForTest` 隔离缝）+ 真实槽文件——断言落在
 * **磁盘可观察结果**上（开关值 / 未涉字段保留 / manifest 摘要 / 轮转产物）。
 * 覆盖：开关写四种 + 全新槽（认领先行）默认记录 + 非属主槽拒写 + 轮转四判据
 *（异会话 / version>2 / 异 cwd / 同会话并发追加）+ 损坏现场保全。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, loadManifest, manifestPath, slotPath } from "../session-slots.mjs"
import {
  _resetSlotMtimeCacheForTest, mergeEngTokensForSave, newSlotData, saveSlotData,
  setSlotAdvisorGuard, setSlotAutoApprove, setSlotEngineering, setSlotPlanMode,
} from "../session-slot-write.mjs"

const CWD = process.platform === "win32" ? "C:\\proj\\slot-write-test" : "/proj/slot-write-test"

let dir = null
before(() => { dir = mkdtempSync(join(tmpdir(), "core-slot-write-")) })
after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
beforeEach(() => { _setSessionsDirForTest(dir); _resetSlotMtimeCacheForTest() })

/** 槽文件落盘辅助（写入已知形态的槽记录）。 */
function putSlot(mutate = () => {}, slot = 1) {
  const data = { ...newSlotData(CWD), sessionStart: "s-1", history: [{ role: "user", content: "hi" }] }
  mutate(data)
  writeFileSync(slotPath(CWD, slot), JSON.stringify(data))
  return slotPath(CWD, slot)
}

test("开关写四种：值落盘 + 其余字段保留 + manifest 摘要回写", () => {
  const p = putSlot()
  assert.equal(setSlotAutoApprove(CWD, 1, true), true)
  assert.equal(setSlotPlanMode(CWD, 1, true), true)
  assert.equal(setSlotEngineering(CWD, 1, true), true)
  assert.equal(setSlotAdvisorGuard(CWD, 1, true), true)

  const onDisk = JSON.parse(readFileSync(p, "utf8"))
  assert.equal(onDisk.autoApprove, true)
  assert.equal(onDisk.planMode, true)
  assert.equal(onDisk.engineering, true)
  assert.deepEqual(onDisk.advisor, { guard: true })
  assert.equal(onDisk.sessionStart, "s-1", "未涉字段原样保留")
  assert.deepEqual(onDisk.history, [{ role: "user", content: "hi" }], "历史面原样保留")

  const m = loadManifest(CWD)
  assert.ok(m.slots[1], "manifest 摘要已回写")
  assert.equal(m.slots[1].turnCount, 1, "摘要取自磁盘数据面（真实用户消息计 1）")

  // 关闭路径同面（advisor guard 落对象、值可翻转）
  assert.equal(setSlotAdvisorGuard(CWD, 1, false), true)
  assert.deepEqual(JSON.parse(readFileSync(p, "utf8")).advisor, { guard: false })
})

test("全新槽（认领先行、首保存未落盘）：本进程属主 ⇒ 写默认记录成功；非属主 ⇒ 拒写", () => {
  // 认领先行：manifest 记本进程属主、数据文件尚未创建
  const m = loadManifest(CWD)
  m.slotSessions = { ...(m.slotSessions ?? {}), 2: getSessionId() }
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
  assert.equal(existsSync(slotPath(CWD, 2)), false, "前置：槽数据文件不存在")

  assert.equal(setSlotAutoApprove(CWD, 2, true), true, "属主的无文件槽 ⇒ 写默认记录")
  const created = JSON.parse(readFileSync(slotPath(CWD, 2), "utf8"))
  assert.equal(created.version, 2)
  assert.equal(created.autoApprove, true)
  assert.deepEqual(created.history, [])

  // 非属主（本进程未认领）+ 无文件 ⇒ 拒写（不凭空造记录）
  const m2 = loadManifest(CWD)
  m2.slotSessions = { ...(m2.slotSessions ?? {}), 3: "999999-0-other" }
  writeFileSync(manifestPath(CWD), JSON.stringify(m2))
  assert.equal(setSlotAutoApprove(CWD, 3, true), false, "非属主的无文件槽 ⇒ 拒写")
  assert.equal(existsSync(slotPath(CWD, 3)), false, "拒写不落盘")
})

test("轮转判据①异会话：磁盘 sessionStart 不符 ⇒ 先轮转 .bak 保全再写", () => {
  const p = putSlot((d) => { d.sessionStart = "other-session" })
  const rotated = saveSlotData(CWD, 1, { ...newSlotData(CWD), sessionStart: "mine", engineering: true })
  assert.ok(rotated && rotated.endsWith(".corrupted") === false, "返回轮转路径")
  assert.ok(existsSync(rotated), ".bak 现场保留")
  assert.equal(JSON.parse(readFileSync(rotated, "utf8")).sessionStart, "other-session", "被保全的是对方现场")
  assert.equal(JSON.parse(readFileSync(p, "utf8")).sessionStart, "mine", "目标档为新现场")
})

test("轮转判据②version>2：新版文件一律轮转（不覆盖）", () => {
  const p = putSlot((d) => { d.version = 3 })
  const rotated = saveSlotData(CWD, 1, { ...newSlotData(CWD), sessionStart: "mine" })
  assert.ok(rotated, "v3 文件 ⇒ 轮转")
  assert.equal(JSON.parse(readFileSync(rotated, "utf8")).version, 3)
  assert.equal(JSON.parse(readFileSync(p, "utf8")).version, 2)
})

test("轮转判据③异 cwd：别的项目文件误落本路径 ⇒ 轮转", () => {
  putSlot((d) => { d.cwd = process.platform === "win32" ? "C:\\proj\\other" : "/proj/other" })
  const rotated = saveSlotData(CWD, 1, { ...newSlotData(CWD), sessionStart: "mine" })
  assert.ok(rotated, "异 cwd 文件 ⇒ 轮转")
})

test("轮转判据④同会话并发追加：磁盘 history 更长 ⇒ 对方现场轮转 .bak 保下（档位以本快照为准）", () => {
  putSlot((d) => {
    d.sessionStart = "s-1"
    d.history = [{ role: "user", content: "a" }, { role: "user", content: "b" }]
  })
  const stale = { ...newSlotData(CWD), sessionStart: "s-1", history: [{ role: "user", content: "a" }] }
  const rotated = saveSlotData(CWD, 1, stale)
  assert.ok(rotated, "磁盘更长 ⇒ 轮转保全对方追加")
  assert.equal(JSON.parse(readFileSync(rotated, "utf8")).history.length, 2)
})

test("保存面台账合并规则：未携带 ⇒ 保留槽；空态 ⇒ 保留槽；并集 + 新铸者胜（平手/非法 ⇒ 保留槽値）", () => {
  const older = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:100"
  const newer = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb:900"
  const slot = { d1: older, keep: "cccccccc-cccc-cccc-cccc-cccccccccccc:500" }

  assert.deepEqual(mergeEngTokensForSave(undefined, slot), slot, "未携带（undefined）⇒ 保留槽値")
  assert.deepEqual(mergeEngTokensForSave({}, slot), slot, "空态 ⇒ 不触发清理（保留槽）")
  assert.equal(mergeEngTokensForSave({}, null), null, "两端皆空 ⇒ null（清字段语义）")
  assert.deepEqual(mergeEngTokensForSave({ d1: newer }, slot), { d1: newer, keep: slot.keep }, "并集 + 新铸者胜")
  assert.deepEqual(mergeEngTokensForSave({ d1: older }, slot), { d1: older, keep: slot.keep }, "同 key 以到期时刻大者胜（入者为旧 ⇒ 不改槽値）")
  assert.deepEqual(mergeEngTokensForSave({ z: "not-a-token" }, { z: older }), { z: older }, "两侧无法解析 ⇒ 保留槽値（fail-safe）")
  assert.deepEqual(mergeEngTokensForSave([1, 2], slot), slot, "非对象形态 ⇒ 当空态处理")
})

test("损坏现场：解析失败 ⇒ 改名 .corrupted 保全，目标档照写", () => {
  const p = slotPath(CWD, 4)
  writeFileSync(p, "{ this is not json")
  const rotated = saveSlotData(CWD, 4, { ...newSlotData(CWD), sessionStart: "mine" })
  assert.equal(rotated, null, "损坏面不产 .bak（走 .corrupted）")
  assert.ok(readdirSync(dir).some((n) => n.endsWith(".json.4.corrupted")), "损坏现场保全")
  assert.equal(JSON.parse(readFileSync(p, "utf8")).sessionStart, "mine")
})
