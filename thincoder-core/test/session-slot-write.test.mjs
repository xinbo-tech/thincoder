/**
 * session-slot-write.test.mjs — 槽开关写面（cwd, slot 形态）行为组。
 *
 * 手法：真实临时会话目录（`_setSessionsDirForTest` 隔离缝）+ 真实槽文件——断言落在
 * **磁盘可观察结果**上（开关值 / 未涉字段保留 / manifest 摘要 / 轮转产物）。
 * 覆盖：开关写四种 + 全新槽（认领先行）默认记录 + 非属主槽拒写 + 轮转四判据
 *（异会话 / version>2 / 异 cwd / 同会话并发追加）+ 损坏现场保全 + 死主清理身份复核
 *（批 1 CORE-DEFECT-FIXES · V2：pid 复用 ⇒ 删 / 身份符 · 探测失败 · 缺行 ⇒ 保守保留）。
 */
import { test, before, after, beforeEach } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, activeSlot, claimSlot, getSessionId, loadManifest, manifestPath, readEndMarker, slotPath, writeEndMarker } from "../session-slots.mjs"
import { releaseClaimsAll } from "../session-slots-manifest.mjs"
import { newSession, resumeSlot, switchToSlot } from "../session.mjs"
import { _resetProcessProbeTestImpl, _setProcessProbeTestImpl } from "../process-probe.mjs"
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

const FOREIGN = process.platform === "win32" ? "C:\\Windows\\System32\\SearchHost.exe" : "/usr/lib/search-host"
const CLI_PROC = process.platform === "win32" ? "node C:\\app\\thincoder.cjs" : "node /app/thincoder.cjs"

/** 死主清理装配：槽 7 = 陈旧属主（**本进程 pid 活**——进程实例真活，非注入；会话 id 不同
 *  ⇒ 非 self）+ 槽文件在盘 ⇒ 回收路径不会占用该槽，清理结果可直接读盘断言。 */
function putStaleOwner(sessionId) {
  const m = loadManifest(CWD)
  m.slots = { ...(m.slots ?? {}), 7: { updatedAt: 1 } }
  m.slotSessions = { ...(m.slotSessions ?? {}), 7: sessionId }
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
  writeFileSync(slotPath(CWD, 7), JSON.stringify({ version: 2, history: [] }))
}

/** 驱一次死主清理（公开入口 activeSlot → ensureActive → cleanDeadOwners，结果落盘）。
 *  init-block 批（F-MI7）：缝面随探测束扩容——`aliveFn` 缺省 = 注入 pid 全活（与真实 tasklist
 *  同形：本进程 pid 存在）；`cmdlineFn` = 命令行批量结果。两缝均批语义（F-MI7 禁逐 pid）。 */
function driveCleanup(cmdlineFn, aliveFn = (pids) => new Set(pids)) {
  _setProcessProbeTestImpl({ aliveFn, cmdlineFn })
  try { activeSlot(CWD) } finally { _resetProcessProbeTestImpl() }
}

/** 缝面计数（F-MI7 束上界 / 粘性早退零探测断言用）：返回计数对象 + 驱动函数。 */
function countingProbe(cmdlineFn = () => new Map()) {
  const calls = { alive: 0, cmdline: 0 }
  _setProcessProbeTestImpl({
    aliveFn: (pids) => { calls.alive++; return new Set(pids) },
    cmdlineFn: (pids) => { calls.cmdline++; return cmdlineFn(pids) },
  })
  return calls
}

slow("死主清理身份复核：pid 活 + 命令行非本产品（pid 复用）⇒ 陈旧属主条目被删", () => {
  putStaleOwner(`${process.pid}-0-stale`)
  driveCleanup(() => new Map([[process.pid, FOREIGN]]))
  assert.equal(loadManifest(CWD).slotSessions?.[7], undefined, "身份不符的陈旧属主未清理")
})

slow("死主清理身份复核：命令行命中本产品 ⇒ 保留（不误删活实例槽）", () => {
  const stale = `${process.pid}-0-live`
  putStaleOwner(stale)
  driveCleanup(() => new Map([[process.pid, CLI_PROC]]))
  assert.equal(loadManifest(CWD).slotSessions?.[7], stale, "活实例属主被误删")
})

slow("死主清理身份复核：探测失败 / 缺行 ⇒ 不删（保守——D-MI10）", () => {
  const stale = `${process.pid}-0-unknown`
  for (const probe of [() => null, () => new Map()]) {
    putStaleOwner(stale)
    driveCleanup(probe)
    assert.equal(loadManifest(CWD).slotSessions?.[7], stale, "探测不确定 ⇒ 保守保留")
  }
})

slow("束上界（F-MI7）：冷路径一次 = ≤1 判活 + ≤1 命令行——不得逐 pid exec", () => {
  // 三个属主（本进程 pid + 两个不可达 pid）：判活 / 命令行仍各只 1 次 exec
  const m = loadManifest(CWD)
  m.slots = { ...(m.slots ?? {}), 7: { updatedAt: 1 }, 8: { updatedAt: 1 } }
  m.slotSessions = { ...(m.slotSessions ?? {}), 7: `${process.pid}-0-stale`, 8: "999999-0-dead" }
  delete m.active // 确保走冷路径（粘性早退不探测）
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
  const calls = countingProbe(() => new Map())
  try { activeSlot(CWD) } finally { _resetProcessProbeTestImpl() }
  assert.equal(calls.alive, 1, `判活 exec = ${calls.alive} 次（应 1）`)
  assert.equal(calls.cmdline, 1, `命令行 exec = ${calls.cmdline} 次（应 1）`)
})

slow("粘性早退（F-MI7）：已拥有 active ⇒ 零探测（0 判活 + 0 命令行）", () => {
  const m = loadManifest(CWD)
  m.slots = { ...(m.slots ?? {}), 5: { updatedAt: 1 } }
  m.slotSessions = { ...(m.slotSessions ?? {}), 5: getSessionId() }
  m.active = 5
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
  const calls = countingProbe()
  let got = null
  try { got = activeSlot(CWD) } finally { _resetProcessProbeTestImpl() }
  assert.equal(got, 5, "已拥有 active 未被复用")
  assert.deepEqual(calls, { alive: 0, cmdline: 0 }, "粘性早退面发生探测（应为零）")
})

// ─── F-CR1 认领释放（SESSION-CLAIM 批 · SESSION.md §6.2 / §6.16——释放集判据单源）──────────

/** 释放面夹具：槽文件 + manifest 条目（`switchToSlot` 需 m.slots 条目 + 可读槽文件）；
 *  清单先归零（隔离他测遗留的属主条目——防冷路径真探测）。 */
function seedReleaseState(...slots) {
  writeFileSync(manifestPath(CWD), JSON.stringify({ version: 2, slots: {}, slotSessions: {}, sessionId: null }))
  const m = loadManifest(CWD)
  for (const s of slots) { putSlot(() => {}, s); m.slots[s] = { updatedAt: 1 } }
  writeFileSync(manifestPath(CWD), JSON.stringify(m))
}

test("F-CR1 切槽释放（验收①）：绑定 41 → 切 40 ⇒ 41 释放 ∧ 40 = 本进程；再切回 41 ⇒ 重新认领", () => {
  seedReleaseState(40, 41)
  claimSlot(CWD, 41) // 启动 / 恢复认领 = 当前绑定
  const other = `${process.pid}-0-other-end`
  const m0 = loadManifest(CWD)
  m0.slotSessions = { ...(m0.slotSessions ?? {}), 99: other } // 他端认领（零动面）
  writeFileSync(manifestPath(CWD), JSON.stringify(m0))

  assert.ok(switchToSlot(CWD, 40), "切换成功（读得到目标槽数据）")
  const m1 = loadManifest(CWD)
  assert.equal(m1.slotSessions[41], undefined, "旧绑定 41 已释放（认领随绑定走）")
  assert.equal(m1.slotSessions[40], getSessionId(), "新绑定 40 = 本进程")
  assert.equal(m1.slotSessions[99], other, "他端认领零动")
  assert.equal(m1.active, 40, "共享指针按 D-6 翻至目标")
  assert.equal(m1.slots[41].updatedAt, 1, "m.slots 条目零动（释放只碰认领集）")
  assert.ok(existsSync(slotPath(CWD, 41)), "槽文件零动")
  assert.equal(readEndMarker(CWD)?.slot, 40, "端标记按 D-4 写目标槽")

  assert.ok(switchToSlot(CWD, 41), "再切回成功（旧槽已空闲）")
  const m2 = loadManifest(CWD)
  assert.equal(m2.slotSessions[41], getSessionId(), "验收①后半：旧槽重新认领")
  assert.equal(m2.slotSessions[40], undefined, "40 释放")
})

test("F-CR1 落盘判据：值条件删除（fresh 属主 ≠ 本进程 ⇒ 不删）+ 内存条目移除（不复活回写）", () => {
  seedReleaseState(40, 41)
  const other = `${process.pid}-0-other-end`
  const stale = loadManifest(CWD) // 本进程内存面：认为 41 是自己的（陈旧）
  stale.slotSessions = { ...(stale.slotSessions ?? {}), 41: getSessionId() }
  const disk = loadManifest(CWD) // 盘面：窗口内 41 已被他端重新认领
  disk.slotSessions = { ...(disk.slotSessions ?? {}), 41: other }
  writeFileSync(manifestPath(CWD), JSON.stringify(disk))

  claimSlot(CWD, 40, stale) // 落点认领（释放集按写盘同一次 fresh 快照取值）

  const m = loadManifest(CWD)
  assert.equal(m.slotSessions[41], other, "fresh 属主非本进程 ⇒ 值条件不删（他人新认领保住）")
  assert.equal(m.slotSessions[40], getSessionId(), "落点槽照常认领")
})

test("F-CR1 释放面 opt-in：newSession 默认零释放（ACP 四点面）；传 releaseStale 才释放", async () => {
  seedReleaseState(40, 41)
  claimSlot(CWD, 41) // 本进程残留认领（模拟既有多认领）
  const s1 = await newSession(CWD) // 默认：不释放
  assert.notEqual(s1, 41, "新槽另取号")
  assert.equal(loadManifest(CWD).slotSessions[41], getSessionId(), "默认不释放（ACP 调用面纪律）")

  const s2 = await newSession(CWD, { releaseStale: true }) // opt-in：释放（保留集 = {新槽}）
  const m = loadManifest(CWD)
  assert.equal(m.slotSessions[41], undefined, "opt-in ⇒ 残留认领释放")
  assert.equal(m.slotSessions[s1], undefined, "前一落点认领亦释放（保留集 = {新槽}）")
  assert.equal(m.slotSessions[s2], getSessionId(), "新槽认领 = 本进程（保留集）")
})

// ─── F-XR1 退出全释放（EXIT-CLAIM-RELEASE 批 · SESSION.md §6.18——T1/T2/T3）──────────

/** 退出释放夹具：seedReleaseState 同型 + 本进程认领 slot + 本端 marker 指向该槽（D-1 形态
 *  ——marker 走真 `writeEndMarker`，与运行时同落点）。 */
function seedExitRelease(slot) {
  seedReleaseState(slot)
  claimSlot(CWD, slot)
  writeEndMarker(CWD, slot)
}

test("F-XR1 T1 退出全释放：manifest 无本进程条目 ∧ marker 仍指原槽（路标保留）∧ 槽文件完好 ∧ 返回 true", () => {
  seedExitRelease(41)
  const my = getSessionId()
  const m0 = loadManifest(CWD)
  m0.slotSessions = { ...(m0.slotSessions ?? {}), 99: `${process.pid}-0-other-end` } // 他端认领（零动面）
  writeFileSync(manifestPath(CWD), JSON.stringify(m0))

  assert.equal(releaseClaimsAll(CWD), true, "有释放且落盘成功")

  const m = loadManifest(CWD)
  for (const [slot, owner] of Object.entries(m.slotSessions ?? {})) {
    assert.notEqual(owner, my, `slot ${slot} 属主非本进程（全释放——保留集空）`)
  }
  assert.equal(m.slotSessions[99], `${process.pid}-0-other-end`, "他端认领零动（值条件天然）")
  assert.equal(m.slots[41].updatedAt, 1, "m.slots 摘要条目零动（释放只碰认领集）")
  assert.equal(readEndMarker(CWD)?.slot, 41, "marker 仍指原槽——路标保留（F-XR2 零触碰 marker 面）")
  assert.ok(existsSync(slotPath(CWD, 41)), "槽文件完好")
  assert.equal(readFileSync(slotPath(CWD, 41), "utf8").includes('"sessionStart":"s-1"'), true, "槽内容完好")
})

test("F-XR1 早退面两态：磁盘无 manifest ⇒ 零写不造盘面；无本进程认领 ⇒ 零写（他端条目零动）", () => {
  // ① 无 manifest（全新 cwd 从未有过会话）——释放不落盘面文件（rmSync 清同目录前组遗留）
  rmSync(manifestPath(CWD), { force: true })
  assert.equal(releaseClaimsAll(CWD), false)
  assert.equal(existsSync(manifestPath(CWD)), false, "无 manifest ⇒ 零写（不造盘面）")

  // ② 有 manifest 但本进程无认领（仅他端属主）
  writeFileSync(manifestPath(CWD), JSON.stringify({ version: 2, slots: {}, slotSessions: { 9: "999999-0-ghost" }, sessionId: null }))
  assert.equal(releaseClaimsAll(CWD), false, "无本进程认领 ⇒ false")
  assert.equal(loadManifest(CWD).slotSessions[9], "999999-0-ghost", "他端条目零动")
})

test("F-XR1 T2 释放后恢复直达：resumeSlot 返回原槽非空数据 ∧ 探测束零 exec（ownerPids 空 ⇒ 早退）", async () => {
  seedExitRelease(41)
  assert.equal(releaseClaimsAll(CWD), true)

  const calls = countingProbe()
  let r = null
  try { r = await resumeSlot(CWD) } finally { _resetProcessProbeTestImpl() }
  assert.equal(r.slot, 41, "释放后恢复直达原槽（D-2 ① 支——usableSlot 无属主短路）")
  assert.ok(r.data, "data 非空")
  assert.equal(r.data.sessionStart, "s-1", "恢复的是退出前的会话数据")
  assert.deepEqual(calls, { alive: 0, cmdline: 0 }, "单进程盘面 ownerPids 空 ⇒ 探测零 exec")
  assert.equal(readEndMarker(CWD)?.slot, 41, "marker 保持 41（resumeSlot D-4 同值重写）")
})

test("F-XR1 T3 崩溃路径负向回归（现状锁）：他进程未释放认领 + 探测 unknown ⇒ 全新分配（不直达原槽）", async () => {
  seedExitRelease(41)
  // 崩溃面 = 旧进程认领保留（owner = 旧会话 id ≠ 本进程 id——沙箱用幽灵属主模拟旧进程）；
  // 探测面 = aliveSet 缺失 ⇒ 属主 unknown ⇒ 槽不可用（保守——D-MI10）。
  const ghost = `${process.pid + 55555}-0-ghost`
  const m0 = loadManifest(CWD)
  m0.slotSessions[41] = ghost
  writeFileSync(manifestPath(CWD), JSON.stringify(m0))

  _setProcessProbeTestImpl({ aliveFn: () => null }) // 束形态：aliveSet null = 未探测 ⇒ unknown
  let r = null
  try { r = await resumeSlot(CWD) } finally { _resetProcessProbeTestImpl() }
  assert.notEqual(r.slot, 41, "unknown ⇒ 原槽不可用（D-MI10 保守——现状锁）")
  assert.ok(r.slot >= 42, "全新分配取号 > 41")
  assert.equal(loadManifest(CWD).slotSessions[41], ghost, "崩溃面认领条目保留（零释放——F-XR3 语义）")
})
