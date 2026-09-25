/**
 * peer-domains.test.mjs — VSC 端 L3 **足迹面**行为组（peer 收口批 · 台账 #290 ·
 * 设计档 `MULTI-INSTANCE-COLLAB.md` §4.2 / §4.3 / §4.4.4；端半）。
 *
 * 对象 = 端侧 D-L3a（`registerDomains` / `flushDomains` 登记与整写）/ D-L3b（`peerDomains(cwd)
 * .conflicts` 聚合与缓存）/ §4.4.4（`peerNotes` 逐 target 足迹行与混合合成）——本文之前该面
 * 零专面断言（既有命中皆在认领面档的钩点路径）。
 *
 * 用例 → 批档 §2.3 对照：T-L3v1 登记累积与整写 / T-L3v2 冲突查询（hot 窗口 + 路径重叠 + 同 cwd 过滤——
 * 台账 #344 与核同判据）/ T-L3v3 聚合缓存与目录 stat 上界 / T-L3v4 判活与惰性清理 / T-L3v5 预检门控 /
 * T-L3v6 逐 target 足迹行与混合合成（AC-291：与核 `peerCollabNote` 跨端逐行对拍——双端同串）。
 *
 * 沙箱 = `_setSessionsDirForTest` + `_setPeersDirForTest`（真目录零触）+ 端探针缝
 * `_setAliveProbeForTest`（转核 `_setProcessProbeTestImpl`）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { createRequire, syncBuiltinESMExports } from "node:module"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { _resetProcessProbeTestImpl, _setProcessProbeTestImpl } from "@thincoder/core/process-probe.mjs"
import * as CORE from "@thincoder/core/peer-domains.mjs"
import * as CORE_CLAIMS from "@thincoder/core/peer-claims.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../src/extension/session-slots.mjs"
import {
  _resetPeerClaimsTestImpl, _resetPeersDirForTest, _setPeersDirForTest, peerFilePath,
} from "../src/extension/peer-claims.mjs"
import {
  _resetPeerDomainsForTest, flushDomains, peerDomains, peerNotes, registerClaims, registerDomains,
} from "../src/extension/peer-domains.mjs"
import { _resetPeerInstancesForTest, _setAliveProbeForTest } from "../src/extension/peer-instances.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

const FOREIGN = { sid: "9800-1-aaaa", pid: 9800 }
const OTHER = { sid: "9600-2-bbbb", pid: 9600 }
const fsCjs = createRequire(import.meta.url)("node:fs")
let dir, peersDirPath, seq = 0

before(() => {
  dir = mkdtempSync(join(tmpdir(), "vsc-peer-domains-"))
  peersDirPath = join(dir, "peers")
  mkdirSync(peersDirPath, { recursive: true })
})
after(() => {
  _resetPeerDomainsForTest()
  _resetPeerInstancesForTest()
  _resetPeerClaimsTestImpl()
  _resetPeersDirForTest()
  CORE._resetPeerDomainsTestImpl()
  CORE_CLAIMS._resetPeersDirForTest()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => {
  _setSessionsDirForTest(join(dir, "sessions"))
  _setPeersDirForTest(peersDirPath)
  CORE_CLAIMS._setPeersDirForTest(peersDirPath)
})
afterEach(() => {
  _resetPeerDomainsForTest() // 聚合缓存 + 回合集合 + 认领状态（用例间不串）
  _resetPeerInstancesForTest() // 端 + 核探针缝（含 SWR 快照）
  _resetPeerClaimsTestImpl()
  CORE._resetPeerDomainsTestImpl()
})

/** 本用例独立 cwd。 */
const newCwd = () => join(dir, `proj-${++seq}`)
/** 本用例 cwd + 会话 manifest（认领落盘门控面用）。 */
const newCwdWithManifest = () => {
  const cwd = newCwd()
  const mp = manifestPath(cwd)
  mkdirSync(dirname(mp), { recursive: true })
  writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions: {} }), "utf8")
  return cwd
}
/** 写他实例登记（同 sessionId 文件覆盖——就地改写不动目录 mtime / size）。 */
const putPeer = (rec) => {
  mkdirSync(peersDirPath, { recursive: true })
  writeFileSync(join(peersDirPath, `${rec.sessionId}.json`), JSON.stringify(rec), "utf8")
  _resetPeerDomainsForTest() // 目录内容变 ⇒ 聚合缓存失效（同名单覆盖无 dir 变更信号）
}
const peerRec = (cwd, { domains = [], updatedAt = Date.now(), ...over } = {}) => ({
  sessionId: FOREIGN.sid, pid: FOREIGN.pid, end: "cli", cwd, domains, updatedAt, ...over,
})
/** 就地改写他实例登记（同名单覆盖——不动目录 mtime / size，也不复位聚合缓存：缓存面用例专用）。 */
const rewritePeer = (rec) => writeFileSync(join(peersDirPath, `${rec.sessionId}.json`), JSON.stringify(rec), "utf8")

/** peers 目录 stat 计数（N-MI7 成本面）：端档无 stat 注入缝 ⇒ 经 Node 文档化面
 *  `module.syncBuiltinESMExports()` 把 CJS 侧 `fs.statSync` 桥到 ESM 活绑定（本档一进程，
 *  finally 还原——零源改）。只计 peers 目录本身的 stat（其余路径不入账）。 */
async function withPeerDirStatCounter(fn) {
  const orig = fsCjs.statSync
  const counts = { n: 0 }
  fsCjs.statSync = (p, ...rest) => {
    if (typeof p === "string" && p.toLowerCase() === peersDirPath.toLowerCase()) counts.n++
    return orig(p, ...rest)
  }
  syncBuiltinESMExports()
  try {
    return await fn(counts)
  } finally {
    fsCjs.statSync = orig
    syncBuiltinESMExports()
  }
}

// ── D-L3a：登记累积与整写 ─────────────────────────────────

test("T-L3v1 登记累积与整写：两目标入文件；认领 / 未知字段逐字保留（字段级合并写）", () => {
  const cwd = newCwd()
  const t1 = join(cwd, "src", "a.mjs")
  const t2 = join(cwd, "src", "b.mjs")
  const pre = {
    sessionId: getSessionId(), pid: process.pid, end: "vscode", cwd,
    claims: [{ target: join(cwd, "src"), claimedAt: 1, expiresAt: 2 }], claimsUpdatedAt: 111, unknownField: "keep-me",
  }
  writeFileSync(peerFilePath(getSessionId()), JSON.stringify(pre), "utf8")
  registerDomains([t1, t2])
  flushDomains(cwd)
  const rec = JSON.parse(readFileSync(peerFilePath(getSessionId()), "utf8"))
  assert.deepEqual(rec.domains, [t1, t2].sort(), "两目标整写（端侧排序）")
  assert.deepEqual(rec.claims, pre.claims, "认领字段逐字保留（认领面零改写）")
  assert.equal(rec.claimsUpdatedAt, 111, "认领时间戳逐字保留")
  assert.equal(rec.unknownField, "keep-me", "未知字段逐字保留")
  // ② 无写入回合 ⇒ 整写不发生（pendingDomains 空）
  const before = readFileSync(peerFilePath(getSessionId()), "utf8")
  flushDomains(cwd)
  assert.equal(readFileSync(peerFilePath(getSessionId()), "utf8"), before, "无写入回合零写（hot 窗口自然老化）")
})

// ── D-L3b：冲突查询与缓存 ─────────────────────────────────

test("T-L3v2 冲突查询（与核同判据——台账 #344）：目录包含 ⇒ 命中 · 同路径 ⇒ 命中 · 他 cwd / hot 界外 ⇒ 零命中", () => {
  const cwd = newCwd()
  const dirD = join(cwd, "src")
  const target = join(dirD, "a.mjs")
  _setAliveProbeForTest(() => new Set([process.pid, FOREIGN.pid]))
  // ① 路径重叠（核 T-L3e 同判：端 `claimsOverlap` = 相等或互为目录包含——§4.3 端差已消）
  putPeer(peerRec(cwd, { domains: [dirD], updatedAt: Date.now() }))
  assert.equal(peerDomains(cwd).conflicts([target]).length, 1, "域为目录 D、target 为 D 下文件 ⇒ 互为包含 ⇒ 命中（与核同判据）")
  assert.equal(peerDomains(cwd).conflicts([dirD]).length, 1, "同路径 ⇒ 命中（正控）")
  // ② 同 cwd 过滤（§4.3——与核 `peerDomains` 同）：他 cwd 登记不参与
  putPeer(peerRec(join(dir, "other-cwd"), { domains: [target], updatedAt: Date.now() }))
  assert.deepEqual(peerDomains(cwd).conflicts([target]), [], "他 cwd 登记 ⇒ 零命中（同 cwd 过滤）")
  // ③ hot 窗口（两侧界）：界内命中 · 界外零命中
  putPeer(peerRec(cwd, { domains: [target], updatedAt: Date.now() }))
  assert.equal(peerDomains(cwd).conflicts([target]).length, 1, "hot 界内（updatedAt 在 5 分钟内）⇒ 命中")
  putPeer(peerRec(cwd, { domains: [target], updatedAt: Date.now() - 6 * 60 * 1000 }))
  assert.deepEqual(peerDomains(cwd).conflicts([target]), [], "超界（> 5 分钟）⇒ 零命中（冷登记不提示）")
})

test("T-L3v3 聚合缓存（N-MI7）：目录 mtime+size 未变 ⇒ 零重扫；单次查询目录 stat ≤ 1", async () => {
  const cwd = newCwd()
  const t1 = join(cwd, "src", "a.mjs")
  const t2 = join(cwd, "src", "b.mjs")
  _setAliveProbeForTest(() => new Set([process.pid, FOREIGN.pid]))
  putPeer(peerRec(cwd, { domains: [t1], updatedAt: Date.now() }))
  await withPeerDirStatCounter((counts) => {
    assert.equal(peerDomains(cwd).conflicts([t1]).length, 1, "首查（缓存未命中）⇒ 命中")
    assert.equal(counts.n, 1, "首查 = 目录 stat 恰一次（≤ 1）")
    rewritePeer(peerRec(cwd, { domains: [t2], updatedAt: Date.now() })) // 同名单就地改写 ⇒ 目录元组不变
    assert.equal(peerDomains(cwd).conflicts([t2]).length, 0, "目录元组未变 ⇒ 零重扫（新域不可见 = 机证）")
    assert.equal(peerDomains(cwd).conflicts([t1]).length, 1, "缓存快照粘滞（旧域仍在）")
    assert.equal(counts.n, 3, "三次查询 ≡ 三次目录 stat（每次至多一次）")
  })
})

test("T-L3v4 属主判活：死 pid ⇒ 零命中 ∧ 惰性清理；探测失败 ⇒ 零命中 ∧ 保守不删（D-MI10）", () => {
  const cwd = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const file = join(peersDirPath, `${FOREIGN.sid}.json`)
  putPeer(peerRec(cwd, { domains: [target] }))
  _setAliveProbeForTest(() => new Set([process.pid])) // 9800 死
  assert.deepEqual(peerDomains(cwd).conflicts([target]), [], "死属主 ⇒ 零命中")
  assert.equal(existsSync(file), false, "死文件随既有聚合清理删除（崩溃残留）")
  putPeer(peerRec(cwd, { domains: [target] }))
  _setAliveProbeForTest(() => null) // 探测失败（未知 ≠ 死）
  assert.deepEqual(peerDomains(cwd).conflicts([target]), [], "探测失败 ⇒ 零命中（降级）")
  assert.equal(existsSync(file), true, "探测失败 ⇒ 保守不删")
})

test("T-L3v5 预检门控（§4.4.3 测试卫生）：本 cwd 无 manifest ⇒ 零预检零 peers 写", async () => {
  const cwd = newCwd() // 无 manifest（门控判据）
  const target = join(cwd, "src", "a.mjs")
  _setAliveProbeForTest(() => new Set([process.pid, FOREIGN.pid]))
  putPeer(peerRec(cwd, { domains: [target] })) // 若预检跑了必然命中
  const agent = { cwd, config: {}, _touchedFiles: [], history: [], _mutLog: [], _mutationSeq: 0 }
  const history = []
  const tool = { name: "write", touchedPaths: (a) => [a.path], execute: async () => "Wrote src/a.mjs" }
  await withPeerDirStatCounter(async (counts) => {
    await executeToolBatches(agent, {
      response: { toolCalls: [{ id: "c1", name: "write", arguments: JSON.stringify({ path: target }) }] },
      history, fullHistory: [], toolByName: new Map([["write", tool]]),
      getAuto: () => true, callbacks: {}, signal: null, cwd, recentSigs: [], depth: 0,
    })
    assert.equal(counts.n, 0, "无 manifest ⇒ 零预检（L3 聚合面零调用）")
  })
  const content = history.filter((m) => m.role === "tool").map((m) => m.content).join("\n")
  assert.equal(content, "Wrote src/a.mjs", "工具结果零附注（零预检 ⇒ 零命中）")
  const file = peerFilePath(getSessionId())
  const rec = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null
  assert.ok(!rec || !(rec.claims ?? []).some((c) => c.target === target), "无 manifest ⇒ 认领不落盘（零 peers 写）")
})

// ── D-L3a：失败容忍（NF2）────────────────────────────

test("T-L3v7 失败容忍（AC-296-2）：peers 目录不可建 ⇒ 认领 / 足迹落盘链路不抛 ∧ 既有记录零损 ∧ 内存账保留（可重试）", () => {
  const cwd = newCwdWithManifest()
  const target = join(cwd, "src", "a.mjs")
  // 既有记录（认领面 + 未知字段）先落盘
  writeFileSync(peerFilePath(getSessionId()), JSON.stringify({
    sessionId: getSessionId(), pid: process.pid, end: "vscode", cwd,
    claims: [{ target: join(cwd, "src"), claimedAt: 1, expiresAt: 2 }], claimsUpdatedAt: 111, unknownField: "keep-me",
  }), "utf8")
  const file = peerFilePath(getSessionId())
  const before = readFileSync(file, "utf8")
  // peers 目录不可建：父路径为常规文件（写入在 mkdir 阶段失败）
  const blocker = join(dir, `blocker-${++seq}`)
  writeFileSync(blocker, "x", "utf8")
  _setPeersDirForTest(join(blocker, "peers"))
  assert.doesNotThrow(() => registerClaims([target], cwd), "认领落盘失败 ⇒ 不抛（NF2）")
  registerDomains([target])
  assert.doesNotThrow(() => flushDomains(cwd), "足迹整写失败 ⇒ 不抛（NF2）")
  assert.equal(readFileSync(file, "utf8"), before, "既有记录零损（失败写入不落地）")
  // 内存账保留 ⇒ 可重试：还原目录 ⇒ 本回合目标落盘
  _setPeersDirForTest(peersDirPath)
  flushDomains(cwd)
  const rec = JSON.parse(readFileSync(file, "utf8"))
  assert.deepEqual(rec.domains, [target], "还原目录 ⇒ 重试成功（回合集合未因失败清空）")
  assert.equal(rec.unknownField, "keep-me", "重试仍为字段级合并写（未知字段逐字保留）")
})

// ── §4.3 / §4.4.4：逐 target 足迹行与混合合成 ─────────────

test("T-L3v6 逐 target 足迹行与混合合成（AC-291）：单 / 多 target 逐行 · 与核逐行对拍 · 认领行 + 未覆盖足迹行", () => {
  // ① 多 target 纯足迹（两实例各覆盖）：逐 target 各一行——零聚合单行
  const cwdA = newCwd()
  const a1 = join(cwdA, "src", "a.mjs")
  const a2 = join(cwdA, "src", "b.mjs")
  _setAliveProbeForTest(() => new Set([process.pid, FOREIGN.pid, OTHER.pid]))
  CORE._setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, OTHER.pid]) })
  putPeer(peerRec(cwdA, { domains: [a1, a2] }))
  putPeer(peerRec(cwdA, { sessionId: OTHER.sid, pid: OTHER.pid, domains: [a2] }))
  const pd = peerDomains(cwdA)
  const multi = peerNotes({ cwd: cwdA }, { claimHits: [], footHits: pd.conflicts([a1, a2]) })
  const lines = multi.text.split("\n\n")
  assert.equal(lines.length, 2, "多 target ⇒ 恰 N 行（逐 target——零聚合单行）")
  const lineA1 = lines.find((l) => l.startsWith(`[peer-collab] ${a1} `))
  const lineA2 = lines.find((l) => l.startsWith(`[peer-collab] ${a2} `))
  assert.equal(
    lineA1,
    `[peer-collab] ${a1} — another live instance (cli pid=9800) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`,
    "行字面 = §4.3 字面规范面逐字",
  )
  assert.ok(lineA2.includes("pid=9800") && lineA2.includes("pid=9600"), "同 target 多属主 ⇒ 同一行聚合属主集")
  // ② 跨端对拍（AC-291-2）：同（target × 属主集）⇒ 端足迹行与核 `peerCollabNote` 逐行字面相等（按行拆分）
  const coreNote = CORE.peerCollabNote({ cwd: cwdA }, { name: "write", touchedPaths: () => [a1, a2] }, {})
  assert.deepEqual([...lines].sort(), coreNote.text.split("\n").sort(), "端 / 核足迹行逐行字面相等（分隔符端差不入锚）")
  // ③ 混合命中（另起 cwd）：b1 认领 + 仅足迹 ⇒ 认领行（b1）+ 未覆盖足迹行（b2）——零双报
  const cwdB = newCwd()
  const b1 = join(cwdB, "src", "a.mjs")
  const b2 = join(cwdB, "src", "b.mjs")
  const now = Date.now()
  putPeer({
    sessionId: OTHER.sid, pid: OTHER.pid, end: "vscode", cwd: cwdB, domains: [b1],
    claims: [{ target: b1, claimedAt: now, expiresAt: now + 30 * 60 * 1000 }], updatedAt: now,
  })
  putPeer(peerRec(cwdB, { domains: [b1, b2] }))
  const pdB = peerDomains(cwdB)
  const mixed = peerNotes({ cwd: cwdB }, { claimHits: pdB.claimConflicts([b1, b2]), footHits: pdB.conflicts([b1, b2]) })
  const mLines = mixed.text.split("\n\n")
  assert.equal(mLines.length, 2, "混合 ⇒ 认领行 + 未覆盖 target 的足迹行")
  assert.ok(mLines[0].includes(b1) && mLines[0].includes("holds a live intent claim on it"), "认领行 = 逐 target（b1）")
  assert.ok(mLines[0].includes("cli pid=9800 (recent write)"), "仅足迹属主带 (recent write) 注记")
  assert.ok(mLines[1].startsWith(`[peer-collab] ${b2} —`) && !mLines[1].includes(b1), "足迹行仅 b2（已覆盖 target 不出行——零双报）")
  assert.equal(peerNotes({ cwd: cwdB, _peerNoted: new Set() }, { claimHits: [], footHits: [] }), null, "零命中 ⇒ 零提示（正控）")
})
