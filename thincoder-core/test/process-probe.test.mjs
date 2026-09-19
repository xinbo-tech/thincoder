/**
 * process-probe.test.mjs — 探测族 / 判据单源 / 束 API（F-MI6 / F-MI7 · init-block 批 2026-09-18）。
 *
 * 行为组（MULTI-INSTANCE-COLLAB.md §3.1 判据条「四路锚」中的 ② / ③）：
 *  - 三态判据五序（`ownerState`——探测失败 ≠ 全死 · pid 复用 · 缺行保守）；
 *  - 清理面适配（`filterDeadOwners` 三态：死 ⇒ 删 / 未知 ⇒ 保守保留）；
 *  - 族面（`isProductProc` / `classifyEnd`——CLI 入口族 + VSC 宿主族 + 未知缺省）；
 *  - 束 API 的 **exec 上界**（`_setProcessProbeTestImpl` 注入缝计数：≤1 判活 + ≤1 cmdline，
 *    零逐 pid exec · 空清单零 exec 早退 · 死者不发 cmdline · **不得按本进程 pid 排除**）；
 *  - 束消费面 = **有界同步例外** `slotOccupancy`（真实临时 sessions 域 + 注入束：零探测早退 /
 *    `{ occupied: true, unknown: true }` 保守占位 / pid 复用不误报）。
 *
 * 机检组（同条锚 ①）：核侧零同步 exec 域 = 清理 / 认领 / 恢复三档（`session-slots.mjs` ·
 * `session-lifecycle.mjs` · `session.mjs`）——`process-probe.mjs` = 探针族单点落点（豁免，
 * 正证断言载荷即在——防「扫描写空」假绿）；同步紧界单源 = `SYNC_PROBE_MS` = 2 s。
 */
import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  _resetProcessProbeTestImpl, _setProcessProbeTestImpl, classifyEnd, filterDeadOwners,
  isProcessAlive, isProductProc, ownerState, probeOwnersAsync, probeOwnersSync, SYNC_PROBE_MS,
} from "../process-probe.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../session-slots.mjs"
import { slotOccupancy } from "../session-lifecycle.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const CWD = process.platform === "win32" ? "C:\\proj\\probe-test" : "/proj/probe-test"
const CLI_PROC = process.platform === "win32" ? "node C:\\app\\thincoder.cjs" : "node /app/thincoder.cjs"
const FOREIGN = process.platform === "win32" ? "C:\\Windows\\System32\\SearchHost.exe" : "/usr/lib/search-host"
const VSC_PROC = process.platform === "win32"
  ? "C:\\Code\\Code.exe --type=extensionHost"
  : "/usr/share/code/code --type=extensionHost"

/** 注释剥离（机检扫描用——注释里的关键词不算违规；形态同 `core-hygiene.test.mjs`）。 */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

/** 注入缝计数驱动：aliveFn 缺省 = 入参全活；返回计数对象。 */
function counted({ alive = null, cmdline = null } = {}) {
  const calls = { alive: 0, cmdline: 0, aliveArgs: null, cmdlineArgs: null }
  _setProcessProbeTestImpl({
    aliveFn: (pids) => { calls.alive++; calls.aliveArgs = pids; return alive ? alive(pids) : new Set(pids) },
    cmdlineFn: (pids) => { calls.cmdline++; calls.cmdlineArgs = pids; return cmdline ? cmdline(pids) : new Map() },
  })
  return calls
}

// ── 三态判据（ownerState——顺序即语义，调用面不得复刻） ──────────────────────────
test("ownerState 五序：探测失败 / 明确死 / 缺行保守 / pid 复用 / 本产品活", () => {
  const pid = 4242
  assert.equal(ownerState(pid, { aliveSet: null }), "unknown", "探测失败 ≠ 全死（D-MI10）")
  assert.equal(ownerState(pid, { aliveSet: new Set() }), "dead", "不在存活集 ⇒ 明确死")
  assert.equal(ownerState(pid, { aliveSet: new Set([pid]) }), "unknown", "存活但未发 cmdline ⇒ 未知")
  assert.equal(ownerState(pid, { aliveSet: new Set([pid]), cmds: new Map() }), "unknown", "cmdline 缺行 ⇒ 未知")
  assert.equal(
    ownerState(pid, { aliveSet: new Set([pid]), cmds: new Map([[pid, FOREIGN]]) }), "dead",
    "存活 + 命令明确可得且非本产品 ⇒ pid 复用（D-MI11）",
  )
  assert.equal(
    ownerState(pid, { aliveSet: new Set([pid]), cmds: new Map([[pid, CLI_PROC]]) }), "alive",
    "命令行命中 CLI 入口族 ⇒ 活",
  )
  assert.equal(
    ownerState(pid, { aliveSet: new Set([pid]), cmds: new Map([[pid, VSC_PROC]]) }), "alive",
    "命令行命中 VSC 宿主族 ⇒ 活",
  )
  assert.equal(ownerState(0, { aliveSet: new Set([pid]) }), "dead", "非法 pid ⇒ 不在存活集 ⇒ 死")
})

test("filterDeadOwners 三态适配：死 ⇒ 可删；未知（默认 / 探测失败 / 缺行）⇒ 保守保留", () => {
  assert.equal(filterDeadOwners(7, { alive: false }), true, "pid 死 ⇒ 可删（既有语义）")
  assert.equal(filterDeadOwners(7, { alive: true, cmdline: FOREIGN }), true, "活 + 身份明确不符 ⇒ 可删")
  assert.equal(filterDeadOwners(7, { alive: true, cmdline: CLI_PROC }), false, "活实例 ⇒ 不删")
  assert.equal(filterDeadOwners(7, { alive: true }), false, "缺行 ⇒ 保守保留")
  assert.equal(filterDeadOwners(7, { alive: undefined }), false, "未知（缺省）⇒ 保守保留")
  assert.equal(filterDeadOwners(7), false, "无参 ⇒ 保守保留")
  assert.equal(filterDeadOwners(7, { alive: true, cmdline: "" }), false, "空命令 = 未知 ⇒ 保守保留")
})

test("族面：isProductProc 命中 CLI / VSC 两族，未知命令不误报；classifyEnd 未知缺省", () => {
  assert.equal(isProductProc(CLI_PROC), true)
  assert.equal(isProductProc(VSC_PROC), true, "扩展宿主标记族")
  assert.equal(isProductProc(FOREIGN), false)
  assert.equal(isProductProc(""), false, "空串 = 未知 ⇒ 调用方自行区分（不误判命中）")
  assert.equal(isProductProc(undefined), false)
  assert.equal(classifyEnd(CLI_PROC), "cli")
  assert.equal(classifyEnd(VSC_PROC), "vscode")
  assert.equal(classifyEnd(undefined), undefined, "探测失败 / 缺行 ⇒ 端字段缺省")
})

test("兼容面：isProcessAlive 非法入参三态短路（不探测）", () => {
  assert.equal(isProcessAlive(0), false)
  assert.equal(isProcessAlive(NaN), false)
  assert.equal(isProcessAlive("not-a-pid"), false)
})

// ── 束 API：exec 上界（注入缝计数——零逐 pid exec） ─────────────────────────────
test("probeOwnersSync：空清单零 exec 早退；全活 ⇒ ≤1 判活 + ≤1 cmdline（存活子集）", () => {
  const empty = counted()
  try {
    assert.deepEqual(probeOwnersSync([]), { aliveSet: null, cmds: null }, "空清单 = 未探测（未知态）")
    assert.deepEqual({ alive: empty.alive, cmdline: empty.cmdline }, { alive: 0, cmdline: 0 }, "空清单必须零 exec")
  } finally { _resetProcessProbeTestImpl() }

  const calls = counted()
  try {
    const b = probeOwnersSync([101, 102, 103])
    assert.equal(calls.alive, 1, "判活 exec ≠ 1 次")
    assert.equal(calls.cmdline, 1, "cmdline exec ≠ 1 次")
    assert.deepEqual([...b.aliveSet].sort((a, z) => a - z), [101, 102, 103])
    assert.deepEqual([...calls.cmdlineArgs].sort((a, z) => a - z), [101, 102, 103], "cmdline 入参 = 存活子集")
  } finally { _resetProcessProbeTestImpl() }
})

test("probeOwnersSync：判活失败 ⇒ cmdline 零发；全死 ⇒ cmdline 零发（死者只需存在性）", () => {
  const failed = counted({ alive: () => null })
  try {
    assert.deepEqual(probeOwnersSync([101, 102]), { aliveSet: null, cmds: null })
    assert.equal(failed.cmdline, 0, "判活失败不得再发 cmdline")
  } finally { _resetProcessProbeTestImpl() }

  const dead = counted({ alive: () => new Set() })
  try {
    const b = probeOwnersSync([101, 102])
    assert.deepEqual([...b.aliveSet], [])
    assert.equal(dead.cmdline, 0, "全死 ⇒ 省发 cmdline")
    assert.equal(b.cmds, null)
  } finally { _resetProcessProbeTestImpl() }
})

test("probeOwnersSync：属主 pid == 本进程 pid（pid 复用）仍发 cmdline——不得按自身 pid 排除", () => {
  const calls = counted({ cmdline: (pids) => new Map(pids.map((p) => [p, FOREIGN])) })
  try {
    const b = probeOwnersSync([process.pid])
    assert.equal(calls.cmdline, 1, "本进程 pid 存活 ⇒ 身份复核必需（排除即退化为「未知 ⇒ 不删」）")
    assert.deepEqual([...b.cmds.keys()], [process.pid])
    assert.equal(ownerState(process.pid, b), "dead", "身份不符 ⇒ 判死（pid 复用）")
  } finally { _resetProcessProbeTestImpl() }
})

test("probeOwnersAsync：与同步版同语义 / 同上界（注入值可为同步函数——经 await 消费）", async () => {
  const empty = counted()
  try {
    assert.deepEqual(await probeOwnersAsync([]), { aliveSet: null, cmds: null })
    assert.deepEqual({ alive: empty.alive, cmdline: empty.cmdline }, { alive: 0, cmdline: 0 })
  } finally { _resetProcessProbeTestImpl() }

  const calls = counted({ cmdline: (pids) => new Map(pids.map((p) => [p, CLI_PROC])) })
  try {
    const b = await probeOwnersAsync([101, 102])
    assert.equal(calls.alive, 1)
    assert.equal(calls.cmdline, 1)
    assert.equal(ownerState(101, b), "alive")
  } finally { _resetProcessProbeTestImpl() }

  const failed = counted({ alive: () => null })
  try {
    assert.deepEqual(await probeOwnersAsync([101]), { aliveSet: null, cmds: null })
    assert.equal(failed.cmdline, 0)
  } finally { _resetProcessProbeTestImpl() }
})

// ── 束消费面：有界同步例外 slotOccupancy（D-MI14 两处例外之②） ──────────────────
let dir = null
before(() => { dir = mkdtempSync(join(tmpdir(), "core-probe-")) })
after(() => { _resetSessionsDirForTest(); rmSync(dir, { recursive: true, force: true }) })
beforeEach(() => _setSessionsDirForTest(dir))

/** 写一条属主记录到 manifest（owner = `{pid}-{ts}-{rand}` 会话 id 形态）。 */
function putOwner(slot, owner) {
  writeFileSync(manifestPath(CWD), JSON.stringify({ slots: { [slot]: { updatedAt: 1 } }, slotSessions: { [slot]: owner } }))
}

test("slotOccupancy：无属主 / 本进程属主 ⇒ 零探测早退（零 exec）", () => {
  writeFileSync(manifestPath(CWD), JSON.stringify({ slots: {}, slotSessions: {} }))
  const none = counted()
  try { assert.deepEqual(slotOccupancy(CWD, 1), { occupied: false }, "无属主 ⇒ 空闲") } finally { _resetProcessProbeTestImpl() }
  assert.deepEqual({ alive: none.alive, cmdline: none.cmdline }, { alive: 0, cmdline: 0 }, "无属主不得探测")

  putOwner(2, getSessionId())
  const mine = counted()
  try { assert.deepEqual(slotOccupancy(CWD, 2), { occupied: false }, "本进程属主 ⇒ 空闲") } finally { _resetProcessProbeTestImpl() }
  assert.deepEqual({ alive: mine.alive, cmdline: mine.cmdline }, { alive: 0, cmdline: 0 }, "本进程属主不得探测")
})

test("slotOccupancy：探测失败 ⇒ { occupied: true, unknown: true }（保守占位——未知不认领）", () => {
  putOwner(3, "999999-0-other")
  const calls = counted({ alive: () => null })
  try {
    const occ = slotOccupancy(CWD, 3)
    assert.equal(occ.occupied, true, "未知 ⇒ 占位")
    assert.equal(occ.unknown, true, "未知标记（呈报面分档）")
    assert.equal(occ.owner, "999999-0-other")
  } finally { _resetProcessProbeTestImpl() }
  assert.deepEqual({ alive: calls.alive, cmdline: calls.cmdline }, { alive: 1, cmdline: 0 }, "单次有界同步束")
})

test("slotOccupancy：属主死 / pid 复用 ⇒ 空闲；本产品活属主 ⇒ 占用", () => {
  putOwner(4, "999999-0-dead")
  const dead = counted({ alive: () => new Set() })
  try { assert.deepEqual(slotOccupancy(CWD, 4), { occupied: false }, "属主死 ⇒ 空闲") } finally { _resetProcessProbeTestImpl() }
  assert.equal(dead.alive, 1, "判活一次")
  assert.equal(dead.cmdline, 0, "死者省发 cmdline")

  putOwner(5, "999999-0-reused")
  const reused = counted({ cmdline: (pids) => new Map(pids.map((p) => [p, FOREIGN])) })
  try { assert.deepEqual(slotOccupancy(CWD, 5), { occupied: false }, "pid 复用 ⇒ 不误占") } finally { _resetProcessProbeTestImpl() }
  assert.equal(reused.cmdline, 1)

  putOwner(6, "999999-0-live")
  const live = counted({ cmdline: (pids) => new Map(pids.map((p) => [p, CLI_PROC])) })
  try {
    assert.deepEqual(slotOccupancy(CWD, 6), { occupied: true, owner: "999999-0-live" }, "活属主 ⇒ 占用")
  } finally { _resetProcessProbeTestImpl() }
  assert.equal(live.cmdline, 1)
})

test("有界同步例外锚：slotOccupancy 单次调用 ≤1 判活 + ≤1 cmdline（每 exec ≤ SYNC_PROBE_MS）", () => {
  putOwner(7, "999999-0-live")
  const calls = counted({ cmdline: (pids) => new Map(pids.map((p) => [p, CLI_PROC])) })
  try { slotOccupancy(CWD, 7) } finally { _resetProcessProbeTestImpl() }
  assert.equal(calls.alive, 1, `判活 exec = ${calls.alive}（应 1）`)
  assert.equal(calls.cmdline, 1, `cmdline exec = ${calls.cmdline}（应 1）`)
  assert.equal(SYNC_PROBE_MS, 2000, "同步紧界单源 = 2 s（例外到期条件的判据常量）")
})

// ── 机检①：域内零同步 exec（探针族单点落点 = process-probe.mjs，豁免） ──────────
test("零同步 exec 扫描（F-MI7 判据①）：清理 / 认领 / 恢复三档零 child_process 直调", () => {
  const DOMAIN = ["session-slots.mjs", "session-lifecycle.mjs", "session.mjs"]
  const DIRECT = /\b(?:exec|execFile|execSync|execFileSync|spawn|spawnSync)\s*\(|["']node:child_process["']/
  const hits = []
  for (const rel of DOMAIN) {
    if (DIRECT.test(stripComments(readFileSync(join(ROOT, rel), "utf8")))) hits.push(rel)
  }
  assert.deepEqual(hits, [], `域内档直调 child_process（应经探测束 API）：${hits.join(", ")}`)
  // 正证：豁免档确实承载 exec（证明扫描模式有效——防模式写空导致的假绿）
  const exempt = stripComments(readFileSync(join(ROOT, "process-probe.mjs"), "utf8"))
  assert.ok(DIRECT.test(exempt), "process-probe.mjs 应承载 exec（探针族单点落点）")
})
