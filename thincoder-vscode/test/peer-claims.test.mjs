/**
 * peer-claims.test.mjs — VSC 端 L3 **意图认领面**行为组（intent-claims 批 · 台账 #23 ·
 * 设计档 `MULTI-INSTANCE-COLLAB.md` §4.4 / D-MI17–D-MI21；端半）。
 *
 * 用例 → AC 对照（批档 §2.5）：TV1=AC-IC11（双端对位：两常量等值 + 认领文案 / who / age /
 * left 逐字同串）/ TV2=AC-IC12 写入（新目标即刻落盘 + 时钟缝等值 + 落盘门控）/ TV3=AC-IC12
 * 续约与节流 / TV4=AC-IC12 过期（读面零命中 + 落盘剪除）/ TV5=AC-IC12 命中 · 去重 · 降级 /
 * TV6=AC-IC12 属主死 / 探测失败 / TV7=AC-IC13 混合命中合成（认领行逐 target + 足迹行逐 target
 * 过滤已覆盖 target · 零双报 · 过滤后无余项 ⇒ 无足迹行）。
 *
 * 沙箱 = `_setSessionsDirForTest` + `_setPeersDirForTest`（真目录零触）；时钟 = `_setPeerClaimsTestImpl`
 * （续约 / 过期两侧零真实等待）；判活 = 核探针缝 `_setProcessProbeTestImpl`（端侧 batchAlive 引核）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { _resetProcessProbeTestImpl, _setProcessProbeTestImpl } from "@thincoder/core/process-probe.mjs"
import * as CORE from "@thincoder/core/peer-claims.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../src/extension/session-slots.mjs"
import {
  CLAIM_RENEW_FLUSH_MS, CLAIM_TTL_MS, _resetPeerClaimsForTest, _resetPeerClaimsTestImpl, _resetPeersDirForTest,
  _setPeerClaimsTestImpl, _setPeersDirForTest, claimAge, claimLeft, claimNoteText, claimWho, peerFilePath,
} from "../src/extension/peer-claims.mjs"
import {
  _resetPeerDomainsForTest, markPeerNoted, peerDomains, peerNotes, registerClaims,
} from "../src/extension/peer-domains.mjs"
import { executeToolBatches } from "../src/agent/execute-tools.mjs"

const FOREIGN = { sid: "9800-1-aaaa", pid: 9800 }
let dir, peersDirPath, seq = 0

before(() => {
  dir = mkdtempSync(join(tmpdir(), "vsc-peer-claims-"))
  peersDirPath = join(dir, "peers")
})
after(() => {
  _resetPeerClaimsTestImpl()
  _resetPeersDirForTest()
  _resetPeerDomainsForTest()
  _resetProcessProbeTestImpl()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => {
  _setSessionsDirForTest(join(dir, "sessions"))
  _setPeersDirForTest(peersDirPath)
})
afterEach(() => {
  _resetPeerClaimsTestImpl()
  _resetProcessProbeTestImpl()
  _resetPeerDomainsForTest() // 聚合缓存 + 认领状态复位（用例间不串）
})

/** 假钟（续约 / 过期两侧确定性断言——零真实等待）。 */
function fakeClock(start = 1_700_000_000_000) {
  let now = start
  return { nowFn: () => now, advance: (ms) => { now += ms }, get now() { return now } }
}

/** 本用例独立 cwd + 会话 manifest（认领落盘门控）+ 判活注入（self 恒活）。 */
function newCwd() {
  const cwd = join(dir, `proj-${++seq}`)
  const mp = manifestPath(cwd)
  mkdirSync(dirname(mp), { recursive: true })
  writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions: {} }), "utf8")
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  const clock = fakeClock()
  _setPeerClaimsTestImpl({ nowFn: clock.nowFn })
  return { cwd, clock }
}

const selfRecord = () => JSON.parse(readFileSync(peerFilePath(getSessionId()), "utf8"))
const putPeer = (rec) => {
  mkdirSync(peersDirPath, { recursive: true })
  writeFileSync(join(peersDirPath, `${rec.sessionId}.json`), JSON.stringify(rec), "utf8")
}
const peerRec = (cwd, { domains = [], claims = [], updatedAt = 0, ...over } = {}) => ({
  sessionId: FOREIGN.sid, pid: FOREIGN.pid, end: "vscode", cwd, domains, updatedAt, claims, ...over,
})
const liveClaim = (target, clock) => ({ target, claimedAt: clock.now, expiresAt: clock.now + CLAIM_TTL_MS })

test("TV1 双端对位（AC-IC11）：CLAIM_TTL_MS / CLAIM_RENEW_FLUSH_MS 等值 + 认领文案逐字同串", () => {
  assert.equal(CLAIM_TTL_MS, CORE.CLAIM_TTL_MS, "CLAIM_TTL_MS 双端等值")
  assert.equal(CLAIM_RENEW_FLUSH_MS, CORE.CLAIM_RENEW_FLUSH_MS, "CLAIM_RENEW_FLUSH_MS 双端等值")
  const sample = ["/proj/src/a.mjs", "vscode pid=42, pid=43 (recent write)", "5 min ago", 12]
  assert.equal(claimNoteText(...sample), CORE.claimNoteText(...sample), "认领软提示文案逐字同串")
  const owners = [{ end: "vscode", pid: 1 }, { pid: 2, recentWrite: true }, { end: "cli", pid: 3 }]
  assert.equal(claimWho(owners), CORE.claimWho(owners), "who 规则同串（end 前缀 / 无 end / recent write 后缀）")
  assert.equal(claimAge(1_700_000_000_000, 1_700_000_000_000 + 3 * 60_000), CORE.claimAge(1_700_000_000_000, 1_700_000_000_000 + 3 * 60_000), "age 同串")
  assert.equal(claimAge(0, 30_000), CORE.claimAge(0, 30_000), "age「just now」同串")
  assert.equal(claimLeft(0, 61_000), CORE.claimLeft(0, 61_000), "left 公式同值（含 max(1,…) 界）")
})

test("TV2 写入（AC-IC12）：写成功即落盘认领（expiresAt − now === CLAIM_TTL_MS）；无 manifest ⇒ 门控跳过", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  registerClaims([target], cwd)
  const rec = selfRecord()
  assert.deepEqual(rec.claims.map((c) => c.target), [target], "认领落盘含本目标（即刻——未等回合收尾）")
  assert.equal(rec.claims[0].expiresAt - clock.now, CLAIM_TTL_MS, "expiresAt − now === CLAIM_TTL_MS")
  assert.equal(rec.claimsUpdatedAt, clock.now, "claimsUpdatedAt = 落盘时刻")
  // ② 落盘门控：无 manifest 的 cwd ⇒ 不落盘（模块状态照旧）
  const bare = join(dir, `bare-${++seq}`)
  registerClaims([join(bare, "b.mjs")], bare)
  assert.ok(!JSON.stringify(selfRecord()).includes(join(bare, "b.mjs")), "无 manifest ⇒ 认领不落盘")
})

test("TV3 续约 / 节流（AC-IC12）：同域再写刷新 expiresAt（claimedAt 保持）；节流窗内零额外落盘", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  registerClaims([target], cwd)
  const t0 = clock.now
  clock.advance(30 * 1000)
  registerClaims([target], cwd)
  assert.equal(selfRecord().claimsUpdatedAt, t0, "30 s < 60 s ⇒ 零额外落盘")
  clock.advance(31 * 1000)
  registerClaims([target], cwd)
  const rec = selfRecord()
  assert.equal(rec.claimsUpdatedAt, clock.now, "≥ CLAIM_RENEW_FLUSH_MS ⇒ 续约落盘")
  assert.equal(rec.claims[0].expiresAt - clock.now, CLAIM_TTL_MS, "expiresAt 刷新 = now + TTL")
  assert.equal(rec.claims[0].claimedAt, t0, "claimedAt 保持首次")
})

test("TV4 过期（AC-IC12）：他实例过期认领零命中 + 本实例落盘剪除", () => {
  const { cwd, clock } = newCwd()
  const stale = join(cwd, "src", "old.mjs")
  const fresh = join(cwd, "src", "new.mjs")
  registerClaims([stale], cwd)
  clock.advance(CLAIM_TTL_MS + 60 * 1000)
  registerClaims([fresh], cwd)
  assert.deepEqual(selfRecord().claims.map((c) => c.target), [fresh], "过期条目落盘剪除")
  putPeer(peerRec(cwd, { claims: [{ target: stale, claimedAt: clock.now - CLAIM_TTL_MS * 2, expiresAt: clock.now - 1000 }] }))
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) }); _resetPeerDomainsForTest()
  assert.deepEqual(peerDomains(cwd).claimConflicts([stale]), [], "未过期判据 ⇒ 零命中")
})

test("TV5 命中 / 去重 / 降级（AC-IC12）：未过期认领 ⇒ 认领行逐字；同（目标 × 属主）每 run 一行；损坏零提示", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  putPeer(peerRec(cwd, { claims: [{ target, claimedAt: clock.now - 5 * 60 * 1000, expiresAt: clock.now + 25 * 60 * 1000 }] }))
  const claimHits = peerDomains(cwd).claimConflicts([target])
  assert.equal(claimHits.length, 1, "命中他实例未过期认领")
  const note = peerNotes(agent, { claimHits, footHits: [] })
  assert.equal(note.text, claimNoteText(target, "vscode pid=9800", "5 min ago", 25), "认领行逐字锚（who / age / left）")
  markPeerNoted(agent, note.keys)
  assert.equal(peerNotes(agent, { claimHits, footHits: [] }), null, "同（目标 × 属主）第二次 ⇒ 零行")
  // ② 同 cwd 判据（§4.4.4）：他 cwd 实例同绝对路径认领 ⇒ 不命中（同 cwd 者照常命中）
  putPeer(peerRec(join(dir, "other-cwd"), { sessionId: "9500-9-xxxx", pid: 9500, claims: [liveClaim(target, clock)] }))
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9500]) })
  _resetPeerDomainsForTest()
  assert.deepEqual(peerDomains(cwd).claimConflicts([target]).map((h) => h.pid), [FOREIGN.pid], "同 cwd 判据：他 cwd 认领不命中（同 cwd 的 9800 仍命中）")
  // ③ 降级：损坏记录 / 目录缺失 ⇒ 零命中零抛错
  writeFileSync(join(peersDirPath, "broken.json"), "{ not json", "utf8")
  _resetPeerDomainsForTest()
  assert.deepEqual(peerDomains(cwd).claimConflicts([target]), claimHits, "损坏件按缺失降级（既有命中不受影响）")
  _setPeersDirForTest(join(dir, `missing-${++seq}`))
  assert.deepEqual(peerDomains(cwd).claimConflicts([target]), [], "目录缺失 ⇒ 零命中")
  assert.equal(peerNotes(agent, { claimHits: [], footHits: [] }), null, "无命中 ⇒ 零提示")
})

test("TV6 属主死 / 探测失败（AC-IC12）：死属主零命中 + 惰性清理；探测失败保守不删不命中", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  putPeer(peerRec(cwd, { claims: [liveClaim(target, clock)] }))
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid]) }) // 属主 9800 死
  assert.deepEqual(peerDomains(cwd).claimConflicts([target]), [], "死属主 ⇒ 零命中")
  assert.equal(existsSync(join(peersDirPath, `${FOREIGN.sid}.json`)), false, "死文件随既有聚合清理删除")
  putPeer(peerRec(cwd, { claims: [liveClaim(target, clock)] }))
  _setProcessProbeTestImpl({ aliveFn: () => null }) // 探测失败（未知 ≠ 死）
  assert.deepEqual(peerDomains(cwd).claimConflicts([target]), [], "探测失败按零命中降级")
  assert.equal(existsSync(join(peersDirPath, `${FOREIGN.sid}.json`)), true, "探测失败 ⇒ 保守不删（D-MI10）")
})

test("TV7 混合命中合成（AC-IC13）：认领行逐 target + 足迹行逐 target（过滤已覆盖 target——零双报）", () => {
  const { cwd, clock } = newCwd()
  const t1 = join(cwd, "src", "a.mjs")
  const t2 = join(cwd, "src", "b.mjs")
  const agent = { cwd }
  // 混合：t1 既有认领（9800）又有仅足迹（9700）；t2 仅足迹（9700）
  putPeer(peerRec(cwd, { claims: [liveClaim(t1, clock)] }))
  putPeer(peerRec(cwd, { sessionId: "9700-2-bbbb", pid: 9700, domains: [t1, t2], updatedAt: Date.now() }))
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9700]) })
  const pd = peerDomains(cwd)
  const mixed = peerNotes(agent, { claimHits: pd.claimConflicts([t1, t2]), footHits: pd.conflicts([t1, t2]) })
  const lines = mixed.text.split("\n\n")
  assert.equal(lines.length, 2, "混合 ⇒ 认领行 + 逐 target 足迹行")
  assert.equal(lines[0], claimNoteText(t1, "vscode pid=9800, vscode pid=9700 (recent write)", "just now", 30), "认领行 = 逐字锚 + 仅足迹属主 recent write")
  assert.ok(lines[1].includes(t2) && !lines[1].includes(t1), "足迹行仅含未覆盖 target（已覆盖 target 不出行——零双报）")
  assert.ok(lines[1].startsWith(`[peer-collab] ${t2} — another live instance (vscode pid=9700) registered writing it within the last 5 minutes;`), "足迹行 = §4.3 字面规范面逐字（逐 target 行）")
  // ② 过滤后余项零（足迹命中全被认领覆盖 ⇒ 无足迹行——本条直接构造该分支）
  const coveredOnly = peerNotes(agent, { claimHits: pd.claimConflicts([t1]), footHits: pd.conflicts([t1]) })
  assert.equal(coveredOnly.text.split("\n\n").length, 1, "足迹命中全被认领覆盖 ⇒ 恰一行（无足迹行）")
  assert.ok(!coveredOnly.text.includes("registered writing it within the last 5 minutes"), "无足迹行残句（余项零）")
  assert.equal(coveredOnly.text, claimNoteText(t1, "vscode pid=9800, vscode pid=9700 (recent write)", "just now", 30), "仅认领行（含仅足迹属主注记）")
  // ③ 纯认领（该目标零足迹命中 ⇒ 仅认领行）
  const t3 = join(cwd, "src", "c.mjs")
  putPeer(peerRec(cwd, { sessionId: "9600-3-cccc", pid: 9600, claims: [liveClaim(t3, clock)] }))
  _setProcessProbeTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9700, 9600]) })
  _resetPeerDomainsForTest() // 目录新增 ⇒ 聚合缓存失效
  const pd2 = peerDomains(cwd)
  const pure = peerNotes(agent, { claimHits: pd2.claimConflicts([t3]), footHits: pd2.conflicts([t3]) })
  assert.equal(pure.text, claimNoteText(t3, "vscode pid=9600", "just now", 30), "纯认领 ⇒ 仅认领行（无足迹行）")
  // ④ 纯足迹（逐 target 行——§4.3 字面规范面逐字，D-MI5 面文案单源）
  const footOnly = peerNotes(agent, { claimHits: [], footHits: pd.conflicts([t2]) })
  assert.equal(
    footOnly.text,
    `[peer-collab] ${t2} — another live instance (vscode pid=9700) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`,
    "纯足迹 ⇒ §4.3 字面规范面逐字",
  )
})

test("TV8 钩点端到端（AC-IC12 接线面）：写成功 ⇒ 结果末附认领行 + 落去重键 + 认领落盘；Error 结果 ⇒ 零附加零落键", async () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd, config: {}, _touchedFiles: [], history: [], _mutLog: [], _mutationSeq: 0 }
  putPeer(peerRec(cwd, { claims: [liveClaim(target, clock)] }))
  const history = []
  const tool = { name: "write", touchedPaths: (a) => [a.path], execute: null }
  const runBatch = (exec) => {
    tool.execute = exec
    return executeToolBatches(agent, {
      response: { toolCalls: [{ id: "c1", name: "write", arguments: JSON.stringify({ path: target }) }] },
      history, fullHistory: [], toolByName: new Map([["write", tool]]),
      getAuto: () => true, callbacks: {}, signal: null, cwd, recentSigs: [], depth: 0,
    })
  }
  await runBatch(async () => "Wrote src/a.mjs")
  const content = history.filter((m) => m.role === "tool").map((m) => m.content).join("\n")
  assert.ok(content.includes(claimNoteText(target, "vscode pid=9800", "just now", 30)), "写成功 ⇒ 结果末附认领行（钩点接线）")
  assert.equal(agent._peerNoted.size, 1, "提示附加 ⇒ 去重键落地")
  assert.deepEqual(selfRecord().claims.map((c) => c.target), [target], "写成功 ⇒ 认领落盘（registerClaims 经钩点）")
  // ② Error 结果 ⇒ 零附加零落键（写失败不消耗额度）
  const before = agent._peerNoted.size
  await runBatch(async () => "Error: nope")
  const last = history.filter((m) => m.role === "tool").pop()
  assert.equal(String(last.content), "Error: nope", "Error 结果原样（零附加）")
  assert.equal(agent._peerNoted.size, before, "Error ⇒ 不落去重键（写失败不消耗额度）")
})
