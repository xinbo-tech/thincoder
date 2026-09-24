/**
 * peer-claims.test.mjs — 多实例协作 L3 **意图认领面**行为组（intent-claims 批 · 台账 #23 ·
 * 设计档 `MULTI-INSTANCE-COLLAB.md` §4.4 / D-MI17–D-MI21）。
 *
 * 用例 → AC 对照（批档 §2.5）：T1=AC-IC1（写成功即落盘 · 时钟缝等值）/ T2=AC-IC2（续约 +
 * 节流 · 落盘计数）/ T3=AC-IC3（过期：读面零命中 + 落盘剪除）/ T4=AC-IC4（属主死 / 探测失败）/
 * T5=AC-IC5（分存：字段级合并写 · 旧记录兼容）/ T6=AC-IC6（命中 → 逐字文案 + 零阻断真执行）/
 * T7=AC-IC7（去重：同（目标 × 属主）每 run 一行、新属主新行）/ T8=AC-IC8（优先级：认领行抑制
 * 同目标足迹行 · 仅足迹零变）/ T9=AC-IC9（降级：目录缺失 / 探测失败 / 记录损坏 + 落盘门控）/
 * T10=AC-IC10（成本：零落盘 / ≤1 落盘 / 目录 stat ≤ 1 且缓存命中零扫描）。
 *
 * 沙箱 = `_setSessionsDirForTest` + `_setPeersDirForTest`（真目录零触）；时钟 = 假钟注入
 * （续约 / 过期两侧**零真实等待**）；判活 = `_setPeerDomainsTestImpl({ aliveFn })`。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../session-slots.mjs"
import { executeToolCalls } from "../agent/dispatch.mjs"
import {
  _resetPeerClaimsTestImpl, _resetPeersDirForTest, _setPeerClaimsTestImpl, _setPeersDirForTest,
  CLAIM_RENEW_FLUSH_MS, CLAIM_TTL_MS, claimNoteText, peerFilePath,
} from "../peer-claims.mjs"
import {
  _resetPeerDomainsTestImpl, _setPeerDomainsTestImpl, flushPeerDomains, markClaimNoted, peerCollabNote, recordPeerWrites,
} from "../peer-domains.mjs"

const FOREIGN = { sid: "9800-1-aaaa", pid: 9800 }
let dir, peersDirPath, seq = 0

before(() => {
  dir = mkdtempSync(join(tmpdir(), "core-peer-claims-"))
  peersDirPath = join(dir, "peers")
})
after(() => {
  _resetPeerClaimsTestImpl()
  _resetPeersDirForTest()
  _resetPeerDomainsTestImpl()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => {
  _setSessionsDirForTest(dir)
  _setPeersDirForTest(peersDirPath)
})
afterEach(() => {
  _resetPeerClaimsTestImpl()
  _setPeerDomainsTestImpl({}) // 判活 / stat 注入复位 + 聚合缓存失效（用例间不串）
})

/** 假钟（续约 / 过期两侧确定性断言——零真实等待）。 */
function fakeClock(start = 1_700_000_000_000) {
  let now = start
  return { nowFn: () => now, advance: (ms) => { now += ms }, get now() { return now } }
}

/** 本用例独立 cwd + 「会话 manifest 在场」（认领落盘门控）+ 判活注入（self 恒活）。 */
function newCwd() {
  const cwd = join(dir, `proj-${++seq}`)
  const mp = manifestPath(cwd)
  mkdirSync(dirname(mp), { recursive: true })
  writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions: {} }), "utf8")
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  const clock = fakeClock()
  _setPeerClaimsTestImpl({ nowFn: clock.nowFn })
  return { cwd, clock }
}

const writeTool = { name: "write", touchedPaths: (a) => [a.path] }
const selfRecord = () => JSON.parse(readFileSync(peerFilePath(getSessionId()), "utf8"))
const putPeer = (rec) => {
  mkdirSync(peersDirPath, { recursive: true })
  writeFileSync(join(peersDirPath, `${rec.sessionId}.json`), JSON.stringify(rec), "utf8")
}
const peerClaim = (cwd, { domains = [], claims = [], updatedAt = 0, ...over } = {}) => ({
  sessionId: FOREIGN.sid, pid: FOREIGN.pid, end: "cli", cwd, domains, updatedAt, claims, ...over,
})

test("T1 写入（AC-IC1）：写成功即落盘认领（不等 run 收尾）——时钟缝下 expiresAt − now === CLAIM_TTL_MS；无 manifest ⇒ 落盘门控跳过", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  recordPeerWrites(agent, writeTool, { path: target })
  const rec = selfRecord()
  assert.deepEqual(rec.claims.map((c) => c.target), [target], "认领落盘含本目标（即刻——未调 flushPeerDomains）")
  assert.equal(rec.claims[0].expiresAt - clock.now, CLAIM_TTL_MS, "expiresAt − now === CLAIM_TTL_MS（时钟缝等值）")
  assert.equal(rec.claims[0].claimedAt, clock.now, "claimedAt = 首次认领时刻")
  assert.equal(rec.claimsUpdatedAt, clock.now, "claimsUpdatedAt = 落盘时刻")
  assert.equal(rec.sessionId, getSessionId(), "身份字段补齐（认领面先落盘的记录可被扫描器解析）")
  // ② 落盘门控（§4.4.3 测试卫生）：无 manifest 的 cwd ⇒ 认领不落盘（内存登记照旧）
  const bare = { cwd: join(dir, `bare-${++seq}`) }
  recordPeerWrites(bare, writeTool, { path: join(bare.cwd, "b.mjs") })
  assert.equal(bare._peerClaims.size, 1, "无 manifest 仍登记（内存）")
  assert.deepEqual([...selfRecord().claims.map((c) => c.target)], [target], "无 manifest ⇒ peers 文件不新增该认领")
})

test("T2 续约 / 节流（AC-IC2）：同域再写刷新 expiresAt（claimedAt 保持）；节流窗内零额外落盘", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  recordPeerWrites(agent, writeTool, { path: target })
  const t0 = clock.now
  clock.advance(30 * 1000)
  recordPeerWrites(agent, writeTool, { path: target })
  assert.equal(selfRecord().claimsUpdatedAt, t0, "距上次落盘 30 s < 60 s ⇒ 零额外落盘（claimsUpdatedAt 未动）")
  clock.advance(31 * 1000)
  recordPeerWrites(agent, writeTool, { path: target })
  const rec = selfRecord()
  assert.equal(rec.claimsUpdatedAt, clock.now, "≥ CLAIM_RENEW_FLUSH_MS ⇒ 续约落盘（计数见证 = claimsUpdatedAt）")
  assert.equal(rec.claims[0].expiresAt - clock.now, CLAIM_TTL_MS, "expiresAt 刷新 = now + TTL")
  assert.equal(rec.claims[0].claimedAt, t0, "claimedAt 保持首次（续约不改首次时刻）")
})

test("T3 过期（AC-IC3）：读面零命中 + 本实例落盘剪除（不 unlink）", () => {
  const { cwd, clock } = newCwd()
  const stale = join(cwd, "src", "old.mjs")
  const fresh = join(cwd, "src", "new.mjs")
  const agent = { cwd }
  recordPeerWrites(agent, writeTool, { path: stale })
  clock.advance(CLAIM_TTL_MS + 60 * 1000)
  recordPeerWrites(agent, writeTool, { path: fresh })
  const rec = selfRecord()
  assert.deepEqual(rec.claims.map((c) => c.target), [fresh], "过期条目落盘剪除（该文件仍在——不 unlink）")
  // ② 他实例过期认领 ⇒ 读面零命中
  putPeer(peerClaim(cwd, { claims: [{ target: stale, claimedAt: clock.now - CLAIM_TTL_MS * 2, expiresAt: clock.now - 1000 }] }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  assert.equal(peerCollabNote(agent, writeTool, { path: stale }), null, "未过期判据（expiresAt > now）⇒ 零提示")
})

test("T4 属主死 / 探测失败（AC-IC4）：死属主零命中 + 既有惰性清理；探测失败保守不删不命中", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  const live = { target, claimedAt: clock.now, expiresAt: clock.now + CLAIM_TTL_MS }
  putPeer(peerClaim(cwd, { claims: [live] }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid]) }) // 属主 9800 死
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "死属主 ⇒ 整条不可见（零命中）")
  assert.equal(existsSync(join(peersDirPath, `${FOREIGN.sid}.json`)), false, "死文件随既有聚合清理删除")
  // ② 探测失败（aliveFn → null）：保守不删 + 零命中（未知 ≠ 死）
  putPeer(peerClaim(cwd, { claims: [live] }))
  _setPeerDomainsTestImpl({ aliveFn: () => null })
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "探测失败按零命中降级")
  assert.equal(existsSync(join(peersDirPath, `${FOREIGN.sid}.json`)), true, "探测失败 ⇒ 保守不删（D-MI10）")
})

test("T5 分存（AC-IC5）：认领落盘不改 domains / updatedAt；足迹落盘不改 claims；旧记录零命中零炸", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  // ① 预置足迹面记录（含未知字段）+ 认领落盘 ⇒ 足迹面逐字保留
  const footprint = peerClaim(cwd, { domains: [join(cwd, "src", "x.mjs")], updatedAt: 111, sessionId: getSessionId(), pid: process.pid })
  footprint.unknownField = "keep-me"
  putPeer(footprint)
  recordPeerWrites(agent, writeTool, { path: target })
  const afterClaim = selfRecord()
  assert.deepEqual(afterClaim.domains, footprint.domains, "认领落盘不改 domains")
  assert.equal(afterClaim.updatedAt, 111, "认领落盘不改 updatedAt")
  assert.equal(afterClaim.unknownField, "keep-me", "未知字段逐字保留")
  // ② 足迹落盘 ⇒ 认领字段逐字保留
  clock.advance(1000)
  const claimsBefore = JSON.stringify(afterClaim.claims)
  flushPeerDomains(agent)
  const afterFoot = selfRecord()
  assert.equal(JSON.stringify(afterFoot.claims), claimsBefore, "足迹落盘不改 claims")
  assert.equal(afterFoot.claimsUpdatedAt, afterClaim.claimsUpdatedAt, "足迹落盘不改 claimsUpdatedAt")
  assert.deepEqual(afterFoot.domains, [target], "足迹面照常（domains 整写）")
  // ③ 旧记录（无 claims 字段）⇒ 零命中零炸
  putPeer({ sessionId: FOREIGN.sid, pid: FOREIGN.pid, end: "cli", cwd, domains: [target], updatedAt: Date.now() })
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  assert.equal(peerCollabNote(agent, writeTool, { path: target })?.text.includes("intent claim"), false, "旧记录无 claims ⇒ 认领面零命中")
})

test("T6 命中 / 零阻断（AC-IC6）：未过期认领 ⇒ 逐字认领软提示；工具照常执行", async () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  putPeer(peerClaim(cwd, { claims: [{ target, claimedAt: clock.now - 5 * 60 * 1000, expiresAt: clock.now + 25 * 60 * 1000 }] }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  const note = peerCollabNote(agent, writeTool, { path: target })
  assert.equal(note.text, claimNoteText(target, "cli pid=9800", "5 min ago", 25), "认领行逐字锚（who / age / left）")
  assert.equal(note.keys.length, 1, "去重键随提示返回（调用方在附加时落标记）")
  // ② 行为面：真 dispatch（autoApprove）⇒ 工具执行照常 + 结果附提示（零阻断）
  const okAgent = { cwd, planMode: false, autoApprove: true, config: {}, _role: null, _mutLog: [], _mutationSeq: 0 }
  const call = { name: "write", arguments: JSON.stringify({ path: target }), id: "c1" }
  const tool = { name: "write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => "written" }
  const r = await executeToolCalls(okAgent, new Map([["write", tool]]), [call], {}, 0, undefined)
  assert.equal(r[0].ok, true, "写照发（零阻断——D-MI6 不动）")
  assert.match(String(r[0].result), /^written/, "工具结果原样在前")
  assert.ok(String(r[0].result).includes(note.text), "结果附认领软提示（模型可见）")
})

test("T7 去重（AC-IC7）：同（目标 × 属主）每 run 一行；新属主 ⇒ 新行", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  const live = [{ target, claimedAt: clock.now - 60 * 1000, expiresAt: clock.now + CLAIM_TTL_MS }]
  putPeer(peerClaim(cwd, { claims: live }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  const first = peerCollabNote(agent, writeTool, { path: target })
  assert.ok(first && first.text.includes("pid=9800"), "首写出行")
  markClaimNoted(agent, first.keys)
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "同（目标 × 属主）第二次 ⇒ 零行")
  // 新属主（另一实例同目标认领）⇒ 新行（且只列新属主）
  putPeer(peerClaim(cwd, { sessionId: "9700-2-bbbb", pid: 9700, claims: live }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9700]) }) // 目录新增 ⇒ 缓存失效（测试注入即清）
  const third = peerCollabNote(agent, writeTool, { path: target })
  assert.ok(third.text.includes("pid=9700"), "新属主 ⇒ 新行")
  assert.ok(!third.text.includes("pid=9800"), "已提示属主不重复出行")
})

test("T8 优先级（AC-IC8）：认领命中 ⇒ 抑制同目标足迹行；仅足迹命中 ⇒ 既有文案逐字零变", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  // ① 混合：同目标既有认领（9800）又有仅足迹（9700，hot 域）⇒ 恰一行认领行（足迹属主带 ` (recent write)`）
  putPeer(peerClaim(cwd, { claims: [{ target, claimedAt: clock.now, expiresAt: clock.now + CLAIM_TTL_MS }] }))
  putPeer(peerClaim(cwd, { sessionId: "9700-2-bbbb", pid: 9700, domains: [target], updatedAt: Date.now() }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9700]) })
  const mixed = peerCollabNote(agent, writeTool, { path: target })
  assert.equal(mixed.text.split("\n").length, 1, "同目标不双行（认领行抑制足迹行）")
  assert.equal(mixed.text, claimNoteText(target, "cli pid=9800, cli pid=9700 (recent write)", "just now", 30), "认领行 who = 认领属主 + 仅足迹属主（recent write）")
  // ② 仅足迹命中 ⇒ 既有足迹文案逐字零变（D-MI5 面不动）
  const footOnly = join(cwd, "src", "b.mjs")
  const only = peerCollabNote(agent, writeTool, { path: footOnly })
  assert.equal(only, null, "目标无命中 ⇒ 零提示")
  putPeer(peerClaim(cwd, { sessionId: "9600-3-cccc", pid: 9600, domains: [footOnly], updatedAt: Date.now() }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, 9700, 9600]) })
  const footNote = peerCollabNote(agent, writeTool, { path: footOnly })
  assert.equal(footNote.text, `[peer-collab] ${footOnly} — another live instance (cli pid=9600) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`, "既有足迹文案逐字（含 end 前缀形态）")
})

test("T9 降级（AC-IC9）：目录缺失 / 探测失败 / 记录损坏 ⇒ 零提示零抛错", () => {
  const { cwd } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  _setPeersDirForTest(join(dir, `missing-${++seq}`)) // 目录缺失（从未 flush）
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "目录缺失 ⇒ 零提示")
  assert.doesNotThrow(() => recordPeerWrites(agent, writeTool, { path: target }), "目录缺失 ⇒ 登记不抛")
  // 记录损坏（非法 JSON）+ 结构非法（缺必填）
  _setPeersDirForTest(peersDirPath)
  mkdirSync(peersDirPath, { recursive: true })
  writeFileSync(join(peersDirPath, "broken.json"), "{ not json", "utf8")
  putPeer({ sessionId: "9500-4-dddd", pid: 9500, cwd }) // 无 domains / claims —— 结构非法
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "损坏 / 结构非法 ⇒ 零提示零抛错")
})

test("T10 成本（AC-IC10）：无新目标且续约窗内零落盘；单次写 ≤ 1 次落盘；目录 stat ≤ 1 且缓存命中零扫描", () => {
  const { cwd, clock } = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  let stats = 0
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid]), statFn: () => { stats++; return { mtimeMs: 42 } } })
  // ① 缓存未命中（首扫）＝ probe stat + 落缓存 re-stat（既有形态）；命中态 ⇒ 单次调用恰一次 stat
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "无登记 ⇒ 零提示")
  assert.equal(stats, 2, "首扫（缓存未命中）后缓存已落")
  putPeer(peerClaim(cwd, { domains: [target], updatedAt: clock.now })) // 目录内容变但 statFn 固定 ⇒ 缓存命中
  assert.equal(peerCollabNote(agent, writeTool, { path: target }), null, "缓存命中 ⇒ 零重扫（新文件不可见 = 零扫描机证）")
  assert.equal(stats, 3, "缓存命中态：单次写前预检 = 目录 stat 恰一次（≤1）")
  // ② 落盘计数：新目标 ⇒ 恰一次落盘；续约窗内 ⇒ 零落盘
  recordPeerWrites(agent, writeTool, { path: target })
  assert.equal(selfRecord().claimsUpdatedAt, clock.now, "新目标 ⇒ 即刻落盘（恰一次：claimsUpdatedAt === now）")
  clock.advance(CLAIM_RENEW_FLUSH_MS - 1000)
  recordPeerWrites(agent, writeTool, { path: target })
  assert.equal(selfRecord().claimsUpdatedAt, clock.now - (CLAIM_RENEW_FLUSH_MS - 1000), "续约窗内 ⇒ 零落盘")
  clock.advance(2000)
  recordPeerWrites(agent, writeTool, { path: target })
  assert.equal(selfRecord().claimsUpdatedAt, clock.now, "出窗 ⇒ 续约落盘（单次写新增落盘 ≤ 1）")
})
