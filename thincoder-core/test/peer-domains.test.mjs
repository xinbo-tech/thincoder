/**
 * peer-domains.test.mjs — 多实例协作 L3 **足迹面**行为组（peer 收口批 · 台账 #290 ·
 * 设计档 `MULTI-INSTANCE-COLLAB.md` §4.2 / §4.3 / §4.4.4；核半）。
 *
 * 对象 = D-L3a（登记与目标解析）/ D-L3b（冲突检测与 hot 窗口）：`peerWriteTargets` ·
 * `PEER_WRITE_TOOLS` · `conflicts` · `recordPeerWrites` / `flushPeerDomains` · dispatch 钩点 ·
 * 回合收尾接线——本文之前该面零专面断言（既有命中皆在认领面档的脚手架路径）。
 *
 * 用例 → 批档 §2.3 对照：T-L3a 目标解析（touchedPaths 优先）/ T-L3b 目标解析（`file_ops` 动作感知（#333）：
 * copy 只 dest / move·rename·缺 action 双算 · 兜底 · 相对 / 绝对）/ T-L3c 写工具集 / T-L3d hot 窗口双侧界 /
 * T-L3e 目录包含与 self · cwd
 * 过滤 / T-L3f 保守不删与死清理 / T-L3g 回合累积与整写一次 / T-L3h 无写回合零写 ∧ 去重集先清 /
 * T-L3i 失败容忍保账 / T-L3j dispatch 钩点端到端 / T-L3k 收尾接线。
 *
 * 沙箱 = `_setSessionsDirForTest` + `_setPeersDirForTest`（真目录零触）+ `_setPeerDomainsTestImpl`
 * （判活 / stat 注入）；`conflicts` 时钟经 `{ now }` 参数化（零 wall-clock 界值）。
 */
import { test, before, after, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { _resetSessionsDirForTest, _setSessionsDirForTest, getSessionId, manifestPath } from "../session-slots.mjs"
import { _resetPeersDirForTest, _setPeersDirForTest, peerFilePath } from "../peer-claims.mjs"
import {
  HOT_WINDOW_MS, PEER_WRITE_TOOLS, _resetPeerDomainsTestImpl, _setPeerDomainsTestImpl, conflicts,
  flushPeerDomains, markClaimNoted, peerCollabNote, peerWriteTargets, recordPeerWrites,
} from "../peer-domains.mjs"
import { executeToolCalls } from "../agent/dispatch.mjs"
import { finalizeAgentTurn } from "../agent/run-stages.mjs"
import { FILE_MUTATORS } from "../agent/helpers.mjs"

const FOREIGN = { sid: "9800-1-aaaa", pid: 9800 }
const NOW = 1_700_000_000_000 // 固定钟（`conflicts(..., { now })` 参数化——零 wall-clock）
let dir, peersDirPath, seq = 0

before(() => {
  dir = mkdtempSync(join(tmpdir(), "core-peer-domains-"))
  peersDirPath = join(dir, "peers")
})
after(() => {
  _resetPeerDomainsTestImpl()
  _resetPeersDirForTest()
  _resetSessionsDirForTest()
  rmSync(dir, { recursive: true, force: true })
})
beforeEach(() => {
  _setSessionsDirForTest(dir)
  _setPeersDirForTest(peersDirPath)
})
afterEach(() => {
  _setPeerDomainsTestImpl({}) // 判活 / stat 复位 + 聚合缓存失效（用例间不串）
})

/** 本用例独立 cwd + 会话 manifest（认领落盘门控）+ 判活注入（self + 他实例恒活）。 */
function newCwd() {
  const cwd = join(dir, `proj-${++seq}`)
  const mp = manifestPath(cwd)
  mkdirSync(dirname(mp), { recursive: true })
  writeFileSync(mp, JSON.stringify({ slots: {}, sessionId: null, slotSessions: {} }), "utf8")
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  return cwd
}

const writeTool = { name: "write", touchedPaths: (a) => [a.path] }
const selfRecord = () => JSON.parse(readFileSync(peerFilePath(getSessionId()), "utf8"))
const putPeer = (rec) => {
  mkdirSync(peersDirPath, { recursive: true })
  writeFileSync(join(peersDirPath, `${rec.sessionId}.json`), JSON.stringify(rec), "utf8")
}
const peerRec = (cwd, { domains = [], updatedAt = NOW, ...over } = {}) => ({
  sessionId: FOREIGN.sid, pid: FOREIGN.pid, end: "cli", cwd, domains, updatedAt, ...over,
})

// ── D-L3a：目标解析 / 写工具集 ─────────────────────────────

test("T-L3a 目标解析：touchedPaths 优先（多文件产物为准——args 另携 path 不参与）", () => {
  const cwd = newCwd()
  const tool = { name: "apply_patch", touchedPaths: (a) => a.paths }
  assert.deepEqual(
    peerWriteTargets(tool, { paths: ["a.mjs", "b.mjs"], path: "ignored.mjs" }, cwd),
    [join(cwd, "a.mjs"), join(cwd, "b.mjs")],
    "多变体 touchedPaths 产物 = 目标集（path 不入集）",
  )
})

test("T-L3b 目标解析：file_ops 动作感知（copy 只 dest / move 双算 / 缺 action 保守）· 单参兜底 · 畸形跳过 · 相对按 cwd resolve · 绝对原样", () => {
  const cwd = newCwd()
  assert.deepEqual(peerWriteTargets({ name: "file_ops" }, { action: "copy", source: "s.mjs", dest: "d.mjs" }, cwd), [join(cwd, "d.mjs")], "copy ⇒ 只 dest（源仅读取，不属写域——#333）")
  assert.deepEqual(peerWriteTargets({ name: "file_ops" }, { action: "move", source: "s.mjs", dest: "d.mjs" }, cwd), [join(cwd, "s.mjs"), join(cwd, "d.mjs")], "move ⇒ 源 + 目标双算（两端皆动）")
  assert.deepEqual(peerWriteTargets({ name: "file_ops" }, { source: "s.mjs", dest: "d.mjs" }, cwd), [join(cwd, "s.mjs"), join(cwd, "d.mjs")], "缺 action ⇒ 保守双算（未知 ⇒ 同 move）")
  assert.deepEqual(peerWriteTargets(writeTool, { path: "a.mjs" }, cwd), [join(cwd, "a.mjs")], "其余工具 path 单参兜底")
  assert.deepEqual(peerWriteTargets(writeTool, {}, cwd), [], "零路径入参 ⇒ 零目标")
  assert.deepEqual(peerWriteTargets(writeTool, { path: 42 }, cwd), [], "畸形入参跳过（不抛）")
  const abs = join(cwd, "abs.mjs")
  assert.deepEqual(peerWriteTargets(writeTool, { path: abs }, cwd), [abs], "绝对路径原样（resolve 不再拼接）")
})

test("T-L3c 写工具集：PEER_WRITE_TOOLS ⊇ FILE_MUTATORS ∪ {file_ops}；非结构化工具不在集", () => {
  for (const name of FILE_MUTATORS) assert.ok(PEER_WRITE_TOOLS.has(name), `${name} ∈ PEER_WRITE_TOOLS`)
  assert.ok(PEER_WRITE_TOOLS.has("file_ops"), "file_ops 显式并入（FILE_MUTATORS 之外）")
  assert.ok(!PEER_WRITE_TOOLS.has("bash") && !PEER_WRITE_TOOLS.has("read"), "bash / read 不在集（大通道不覆盖——诚实边界）")
})

// ── D-L3b：冲突检测 ───────────────────────────────────────

test("T-L3d hot 窗口双侧界（now 参数化）：界值内命中 · 越界零命中（零 wall-clock）", () => {
  const cwd = newCwd()
  const target = join(cwd, "src", "a.mjs")
  putPeer(peerRec(cwd, { domains: [target], updatedAt: NOW - HOT_WINDOW_MS }))
  assert.equal(conflicts(cwd, [target], { now: NOW }).length, 1, "now − updatedAt === HOT_WINDOW_MS ⇒ 命中（界值含）")
  putPeer(peerRec(cwd, { domains: [target], updatedAt: NOW - HOT_WINDOW_MS - 1 }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) }) // 目录内容变 ⇒ 聚合缓存失效
  assert.deepEqual(conflicts(cwd, [target], { now: NOW }), [], "越界 1 ms ⇒ 零命中（冷登记不提示）")
})

test("T-L3e 路径重叠与过滤：目录包含 ⇒ 命中；self 记录 · 他 cwd 记录 ⇒ 零命中", () => {
  const cwd = newCwd()
  const dirD = join(cwd, "src")
  const target = join(dirD, "a.mjs")
  putPeer(peerRec(cwd, { domains: [dirD] }))
  assert.equal(conflicts(cwd, [target], { now: NOW }).length, 1, "域为目录 D、target 为 D 下文件 ⇒ 互为包含 ⇒ 命中")
  // self 记录（本进程 sessionId）⇒ 排除
  putPeer(peerRec(cwd, { sessionId: getSessionId(), pid: process.pid, domains: [target] }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]) })
  assert.deepEqual(conflicts(cwd, [target], { now: NOW }).map((h) => h.by.map((b) => b.pid)), [[FOREIGN.pid]], "self 记录不参与（sessionId 排除）")
  // 他 cwd 记录（另一 sessionId——同文件不互履）⇒ 排除（cwd 过滤）
  const OTHER = { sid: "9600-9-zzzz", pid: 9600 }
  putPeer(peerRec(join(dir, "other-cwd"), { sessionId: OTHER.sid, pid: OTHER.pid, domains: [target] }))
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid, OTHER.pid]) })
  assert.deepEqual(conflicts(cwd, [target], { now: NOW }).map((h) => h.by.map((b) => b.pid)), [[FOREIGN.pid]], "他 cwd 记录不参与（同 cwd 过滤）")
})

test("T-L3f 属主判活：探测失败 ⇒ 零命中 ∧ 保守不删；pid 死 ⇒ 零命中 ∧ 文件随聚合惰性清理", () => {
  const cwd = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const file = join(peersDirPath, `${FOREIGN.sid}.json`)
  putPeer(peerRec(cwd, { domains: [target], updatedAt: Date.now() }))
  _setPeerDomainsTestImpl({ aliveFn: () => null })
  assert.deepEqual(conflicts(cwd, [target]), [], "探测失败（null）⇒ 零命中（未知 ≠ 死）")
  assert.equal(existsSync(file), true, "探测失败 ⇒ 保守不删（D-MI10）")
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid]) }) // 9800 死
  assert.deepEqual(conflicts(cwd, [target]), [], "死属主 ⇒ 零命中")
  assert.equal(existsSync(file), false, "死文件随聚合惰性清理删除（崩溃残留）")
})

// ── D-L3a：回合累积 / 整写 / 收尾 ─────────────────────────

test("T-L3g 回合累积与整写一次：两目标入文件；二次 flush 零写（内容 / mtime 不变）", () => {
  const cwd = newCwd()
  const t1 = join(cwd, "src", "a.mjs")
  const t2 = join(cwd, "src", "b.mjs")
  const agent = { cwd }
  recordPeerWrites(agent, writeTool, { path: t1 })
  recordPeerWrites(agent, writeTool, { path: t2 })
  assert.equal(agent._peerWritten?.size, 2, "同回合两目标累积入集")
  flushPeerDomains(agent)
  const rec = selfRecord()
  assert.deepEqual([...rec.domains].sort(), [t1, t2].sort(), "整写一次 ⇒ 两目标同落盘")
  assert.equal(agent._peerWritten.size, 0, "成功 flush ⇒ 回合集合清空")
  const content = readFileSync(peerFilePath(getSessionId()), "utf8")
  const mtime = statSync(peerFilePath(getSessionId())).mtimeMs
  flushPeerDomains(agent)
  assert.equal(readFileSync(peerFilePath(getSessionId()), "utf8"), content, "二次 flush ⇒ 零写（内容不变）")
  assert.equal(statSync(peerFilePath(getSessionId())).mtimeMs, mtime, "二次 flush ⇒ 零写（mtime 不变）")
})

test("T-L3h 无写回合零写 ∧ 去重集先清（§4.4.4）：markClaimNoted 后 flush ⇒ 零写但集已清空", () => {
  const cwd = newCwd()
  const agent = { cwd, _peerNoted: new Set(["k1", "k2"]) }
  const file = peerFilePath(getSessionId())
  const before = existsSync(file) ? { content: readFileSync(file, "utf8"), mtime: statSync(file).mtimeMs } : null
  flushPeerDomains(agent)
  assert.equal(agent._peerNoted.size, 0, "清空先于「无写入即返回」早退（去重集不随无写回合泄漏）")
  if (before === null) assert.equal(existsSync(file), false, "无写入 ⇒ 零落盘（文件仍不在）")
  else {
    assert.equal(readFileSync(file, "utf8"), before.content, "无写入 ⇒ 整写不发生（内容不变——hot 窗口不被空回合提前清掉）")
    assert.equal(statSync(file).mtimeMs, before.mtime, "无写入 ⇒ 整写不发生（mtime 不变）")
  }
})

test("T-L3i 失败容忍（NF2）：peers 目录不可建 ⇒ 不抛 ∧ 内存账保留（可重试）", () => {
  const cwd = newCwd()
  const blocker = join(dir, `blocker-${++seq}`) // 常规文件挡在父路径
  writeFileSync(blocker, "x", "utf8")
  _setPeersDirForTest(join(blocker, "peers"))
  const agent = { cwd }
  assert.doesNotThrow(() => recordPeerWrites(agent, writeTool, { path: join(cwd, "a.mjs") }), "登记失败不抛（工具主流程零影响）")
  assert.doesNotThrow(() => flushPeerDomains(agent), "flush 失败不抛（NF2）")
  assert.equal(agent._peerWritten.size, 1, "落盘失败 ⇒ 内存账保留（下次 flush 重试）")
  _setPeersDirForTest(peersDirPath) // 还原沙箱
})

// ── 钩点 / 收尾接线 ───────────────────────────────────────

test("T-L3j dispatch 钩点端到端：仅足迹命中 ⇒ 逐字足迹行 + 写照发 + 成功记账；Error / 非写工具 ⇒ 零附零账", async () => {
  const cwd = newCwd()
  const target = join(cwd, "src", "a.mjs")
  putPeer(peerRec(cwd, { domains: [target], updatedAt: Date.now() }))
  const agent = { cwd, planMode: false, autoApprove: true, config: {}, _role: null, _mutLog: [], _mutationSeq: 0 }
  const note = peerCollabNote(agent, writeTool, { path: target })
  assert.equal(
    note.text,
    `[peer-collab] ${target} — another live instance (cli pid=9800) registered writing it within the last 5 minutes; concurrent edits may overwrite each other. Write not blocked — coordinate before proceeding.`,
    "足迹行 = §4.3 字面规范面逐字",
  )
  const tool = { name: "write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => "written" }
  const call = (path) => ({ name: "write", arguments: JSON.stringify({ path }), id: "c1" })
  const r = await executeToolCalls(agent, new Map([["write", tool]]), [call(target)], {}, 0, undefined)
  assert.equal(r[0].ok, true, "写照发（零阻断——D-MI6）")
  assert.ok(String(r[0].result).includes(note.text), "结果附逐字足迹行（模型可见）")
  assert.equal(agent._peerWritten?.has(target), true, "写成功 ⇒ 足迹记账（D-L3a 累积）")
  // ② 工具返 "Error:" ⇒ 零附零记账
  const bad = { ...tool, execute: async () => "Error: nope" }
  const a2 = { ...agent, _peerWritten: undefined }
  const r2 = await executeToolCalls(a2, new Map([["write", bad]]), [call(target)], {}, 0, undefined)
  assert.equal(String(r2[0].result), "Error: nope", "Error 结果原样（零附加）")
  assert.equal(a2._peerWritten, undefined, "Error ⇒ 零记账")
  // ③ 非写工具 ⇒ 零预检（聚合面零调用——stat 计数机证）零记账
  let stats = 0
  _setPeerDomainsTestImpl({ aliveFn: () => new Set([process.pid, FOREIGN.pid]), statFn: () => { stats++; return { mtimeMs: 42 } } })
  const a3 = { ...agent, _peerWritten: undefined }
  const readTool = { name: "read", readonly: true, execute: async () => "content" }
  const r3 = await executeToolCalls(a3, new Map([["read", readTool]]), [{ name: "read", arguments: JSON.stringify({ path: target }), id: "c2" }], {}, 0, undefined)
  assert.equal(String(r3[0].result), "content", "非写工具结果零附加")
  assert.equal(stats, 0, "非写工具 ⇒ 零预检（L3 聚合面未被调用）")
  assert.equal(a3._peerWritten, undefined, "非写工具 ⇒ 零记账")
})

test("T-L3k 收尾接线：finalizeAgentTurn 调 flush —— 本回合 domains 落盘", async () => {
  const cwd = newCwd()
  const target = join(cwd, "src", "a.mjs")
  const agent = { cwd }
  const file = peerFilePath(getSessionId())
  const before = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")).domains ?? []) : []
  recordPeerWrites(agent, writeTool, { path: target })
  assert.ok(!before.includes(target), "收尾前未落盘（回合级写点——既有盘面不含本目标）")
  await finalizeAgentTurn(agent, {}) // 轻夹具：depth 缺省 ⇒ Stop 钩子 / 池分流面零触
  assert.deepEqual(selfRecord().domains, [target], "回合收尾 ⇒ flush 被调用（本回合足迹整写）")
})
