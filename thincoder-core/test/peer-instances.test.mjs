/**
 * peer-instances.test.mjs — 多实例感知面**读面**行为组（CORE-DEFECT-FIXES 批 1 ·
 * F-MI6 / N-MI6 · 批档 §五 V1；TUI 假死批 2026-09-18：async 化 + TTL 两侧）。
 *
 * 行为面（断言对象 = `peerInstances()` / `peer_instances` 工具的可观察输出）：
 * - 身份不符（pid 被复用为他进程——如 `SearchHost.exe`）⇒ **不**列为同伴（缺陷根因）；
 * - 身份符（CLI 入口族 / VSC 扩展宿主族）⇒ 保留，`end` 分类照旧（cli / vscode）；
 * - 探测失败（cmdline 批量 → null）/ 该 pid 缺行 ⇒ **保守保留**（D-MI10：误删活实例
 *   = 破坏存储隔离，误保留只是噪音——方向不对称，探测失败 ≠ 身份不符）；
 * - pid 已死 ⇒ 不列为同伴（既有存在性语义零变）；
 * - **TTL 惰性（TUI 假死批）**：manifest mtime 变（每回合 `saveSession` 重写）+ 快照年龄
 *   < `PEER_PROBE_TTL_MS` ⇒ 命中快照（探测 0 次）；年龄 ≥ TTL ⇒ 重探恰 1 次。假钟注入
 *   ⇒ 两侧确定性断言，零真实 ≥ 5 s 等待。
 *
 * 缝：`_setPeerInstancesTestImpl({ aliveFn, cmdlineFn, nowFn })`（批量语义 + 时钟），
 * 目录隔离 `_setSessionsDirForTest`（temp 目录——不碰真实 sessions）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../session-slots.mjs"
import { _resetPeerInstancesTestImpl, _setPeerInstancesTestImpl, peerInstances, peerInstancesTool, PEER_PROBE_TTL_MS } from "../peer-instances.mjs"
import { isProductProc } from "../process-probe.mjs"
import { pushPeerReminder } from "../agent/setup-reminders.mjs"

let dir = null
before(() => { dir = mkdtempSync(join(tmpdir(), "core-peer-instances-")) })
after(() => {
  _resetPeerInstancesTestImpl()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => { _setSessionsDirForTest(dir) })
afterEach(() => { _resetPeerInstancesTestImpl() })

/** 每用例独立 cwd ⇒ manifest 路径与缓存键互不串（缓存另在注入时清空）。 */
let seq = 0
const cwdOf = () => (process.platform === "win32" ? `C:\\proj\\pi-test-${++seq}` : `/proj/pi-test-${++seq}`)

/** 写 manifest（slot 属主表形态；slotSessions: slot → "pid-ts-rand"）。 */
function putManifest(cwd, slotSessions) {
  const p = manifestPath(cwd)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify({ slots: {}, sessionId: null, slotSessions }), "utf8")
  return p
}

/** 假钟（TTL 两侧确定性断言——零真实等待）：`nowFn()` 读数 + `advance(ms)` 推进。 */
function fakeClock(start = 1_000_000) {
  let now = start
  return { nowFn: () => now, advance: (ms) => { now += ms } }
}

/** 探测调用计数（批量语义——一次调用拿全量）。 */
function countingProbes({ alive = [9800], cmdlines = null } = {}) {
  const calls = { alive: 0, cmdline: 0 }
  return {
    calls,
    aliveFn: (pids) => { calls.alive++; return new Set(alive) },
    cmdlineFn: () => { calls.cmdline++; return cmdlines instanceof Map ? cmdlines : (cmdlines ?? new Map()) },
  }
}

/** 单同伴场景装配：9800 的属主记录 + 注入缝（alive / cmdline 两态）。 */
function withOnePeer({ alive = [9800], cmdlines = null } = {}) {
  const cwd = cwdOf()
  putManifest(cwd, { 3: "9800-1-aaaa" })
  _setPeerInstancesTestImpl({
    aliveFn: () => new Set(alive),
    cmdlineFn: () => (cmdlines instanceof Map ? cmdlines : (cmdlines ?? new Map())),
  })
  return cwd
}

const FOREIGN = process.platform === "win32"
  ? "C:\\Windows\\System32\\SearchHost.exe"
  : "/usr/lib/search-host"
const CLI_PROC = process.platform === "win32"
  ? "node C:\\app\\thincoder\\bin\\thincoder.cjs"
  : "node /app/thincoder/bin/thincoder.cjs"
const VSC_PROC = process.platform === "win32"
  ? "C:\\Program Files\\Microsoft VS Code\\Code.exe --type=extensionHost --extensionDevelopmentPath=D:\\x"
  : "/usr/share/code/code --type=extensionHost"

test("pid 活但命令行非本产品（pid 复用）⇒ 不列为同伴", async () => {
  const cwd = withOnePeer({ cmdlines: new Map([[9800, FOREIGN]]) })
  assert.deepEqual(await peerInstances(cwd), [], "身份不符的 pid 复用记录仍被列为活同伴")
})

test("命令行命中 CLI 入口族 ⇒ 保留，end = cli", async () => {
  const cwd = withOnePeer({ cmdlines: new Map([[9800, CLI_PROC]]) })
  const peers = await peerInstances(cwd)
  assert.equal(peers.length, 1)
  assert.equal(peers[0].pid, 9800)
  assert.equal(peers[0].end, "cli")
  assert.deepEqual(peers[0].slots, [3])
})

test("命令行命中 VSC 扩展宿主族 ⇒ 保留，end = vscode", async () => {
  const cwd = withOnePeer({ cmdlines: new Map([[9800, VSC_PROC]]) })
  const peers = await peerInstances(cwd)
  assert.equal(peers.length, 1)
  assert.equal(peers[0].end, "vscode")
})

test("批量命令行探测失败（null）⇒ 保守保留（end 缺省）", async () => {
  const cwd = withOnePeer({ cmdlines: null })
  const peers = await peerInstances(cwd)
  assert.equal(peers.length, 1, "探测失败被误判为身份不符 ⇒ 活同伴被隐藏")
  assert.equal(peers[0].end, undefined)
})

test("批量结果缺该 pid 行 ⇒ 保守保留", async () => {
  const cwd = withOnePeer({ cmdlines: new Map([[4242, CLI_PROC]]) })
  const peers = await peerInstances(cwd)
  assert.equal(peers.length, 1, "缺行被误判为身份不符 ⇒ 活同伴被隐藏")
})

test("pid 已死 ⇒ 不列为同伴（存在性语义零变）", async () => {
  const cwd = withOnePeer({ alive: [], cmdlines: new Map([[9800, CLI_PROC]]) })
  assert.deepEqual(await peerInstances(cwd), [])
})

test("判据单源：读面保留/剔除与 isProductProc 同判（两消费面共用同一实现）", async () => {
  for (const cmdline of [FOREIGN, CLI_PROC, VSC_PROC, "cmd.exe", "node index.js"]) {
    const cwd = withOnePeer({ cmdlines: new Map([[9800, cmdline]]) })
    const listed = (await peerInstances(cwd)).length === 1
    assert.equal(listed, isProductProc(cmdline), `读面判据与核判据不一致：${cmdline}`)
  }
})

// ── TTL 惰性（TUI 假死批——§3.1 命中判据 = mtime 未变 ∨ 快照年龄 < TTL） ──────────

test("T-P1 正常：mtime 变 + 假钟 < TTL ⇒ 探测次数 = 0（快照返回）", async () => {
  const cwd = cwdOf()
  const mp = putManifest(cwd, { 3: "9800-1-aaaa" })
  const clock = fakeClock()
  const probe = countingProbes({ cmdlines: new Map([[9800, CLI_PROC]]) })
  _setPeerInstancesTestImpl({ ...probe, nowFn: clock.nowFn })

  const first = await peerInstances(cwd)
  assert.equal(probe.calls.alive, 1, "首探一次")
  assert.equal(first.length, 1)

  // 每回合 saveSession 重写 manifest（mtime 变——纯 mtime 判据的自击穿源）
  utimesSync(mp, new Date(2_000_000), new Date(2_000_000))
  clock.advance(PEER_PROBE_TTL_MS - 1)
  const second = await peerInstances(cwd)
  assert.equal(probe.calls.alive, 1, "TTL 内不得重探（TTL = 每回合重写的代价闸）")
  assert.deepEqual(second, first, "TTL 内返回同一快照")
})

test("T-P2 边界：mtime 变 + 假钟 ≥ TTL ⇒ 探测恰 1 次；返回集与探测结果一致", async () => {
  const cwd = cwdOf()
  const mp = putManifest(cwd, { 3: "9800-1-aaaa" })
  const clock = fakeClock()
  const probe = countingProbes({ cmdlines: new Map([[9800, CLI_PROC]]) })
  _setPeerInstancesTestImpl({ ...probe, nowFn: clock.nowFn })

  await peerInstances(cwd)
  assert.equal(probe.calls.alive, 1)

  utimesSync(mp, new Date(2_000_000), new Date(2_000_000))
  clock.advance(PEER_PROBE_TTL_MS)
  const again = await peerInstances(cwd)
  assert.equal(probe.calls.alive, 2, "TTL 到期 ⇒ 重探恰一次")
  assert.deepEqual(again.map((p) => p.pid), [9800], "返回集与探测结果一致")
  assert.equal(again[0].end, "cli")
})

test("T-P3 错误：探测失败（null）⇒ 无活伴降级 ∧ 提醒零注入；降级读数 TTL 内粘滞、manifest 缺失不缓存", async () => {
  // ① 探测失败（mtime 在场）⇒ 无活伴降级 + 提醒零注入（既有语义零变）
  const cwdA = cwdOf()
  const mp = putManifest(cwdA, { 3: "9800-1-aaaa" })
  const clock = fakeClock()
  const calls = { n: 0 }
  _setPeerInstancesTestImpl({
    aliveFn: () => { calls.n++; return null }, cmdlineFn: () => null, nowFn: clock.nowFn,
  })
  assert.deepEqual(await peerInstances(cwdA), [], "探测失败 ⇒ 按「无活伴」降级（不显示幽灵同伴）")
  assert.equal(calls.n, 1, "首探一次")
  const agent = { cwd: cwdA, history: [] }
  await pushPeerReminder(agent)
  assert.equal(agent.history.length, 0, "无同伴 ⇒ 提醒零注入")

  // 降级读数的**新鲜度**语义：mtime 变（每回合重写）+ TTL 未到期 ⇒ 不重探；到期 ⇒ 重探
  utimesSync(mp, new Date(2_000_000), new Date(2_000_000))
  clock.advance(PEER_PROBE_TTL_MS - 1)
  assert.deepEqual(await peerInstances(cwdA), [], "TTL 内：降级读数粘滞（新鲜度语义——与 T-L1c「零 exec」同向）")
  assert.equal(calls.n, 1, "TTL 内零重探")
  clock.advance(1)
  await peerInstances(cwdA)
  assert.equal(calls.n, 2, "TTL 到期 ⇒ 重探（降级读数不是永久缓存）")

  // ② manifest 缺失 ⇒ 空清单且**不缓存**（档一出现即按新档作答——老实现若缓存空结果则返回空）
  const cwdB = cwdOf()
  const probe = countingProbes({ cmdlines: new Map([[9800, CLI_PROC]]) })
  _setPeerInstancesTestImpl({ ...probe })
  assert.deepEqual(await peerInstances(cwdB), [], "无 manifest ⇒ 空清单")
  assert.equal(probe.calls.alive, 0, "无 manifest ⇒ 零 exec")
  putManifest(cwdB, { 3: "9800-1-aaaa" })
  assert.equal((await peerInstances(cwdB)).length, 1, "空结果不粘滞（manifest 出现即按新档作答）")
  assert.equal(probe.calls.alive, 1)
})

test("peer_instances 工具：只回他人 + 字段白名单四键", async () => {
  const cwd = cwdOf()
  putManifest(cwd, { 1: getSessionId(), 4: "9800-1-aaaa" })
  _setPeerInstancesTestImpl({ aliveFn: () => new Set([9800]), cmdlineFn: () => new Map([[9800, CLI_PROC]]) })
  const list = JSON.parse(await peerInstancesTool.execute({}, { cwd }))
  assert.deepEqual(list, [{ pid: 9800, end: "cli", sessionId: "9800-1-aaaa", slots: [4] }])
  assert.equal(peerInstancesTool.readonly, true)
})
