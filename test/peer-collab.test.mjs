/**
 * peer-collab.test.mjs — R10 多实例协作 CLI 感知面（MULTI-INSTANCE-COLLAB §2a.4/§2a.5）
 * 测试（L1 注入 + L2 查询 + L3 写域登记/冲突 + N3/N4 只读与白名单）。
 *
 * 用例映射：T-L1a（注入含"N 个同伴"——transient + env-state 后 time 前）/ T-L1b（无同伴
 * 零开销——无 push 无判活调用）/ T-L1c（惰性缓存——manifest mtime 未变二次调用不重查）/
 * T-L2a（peer_instances 字段白名单 {pid,end,sessionId,slots} 精确 + 端分类 + 去 self）/
 * T-L2b（死主不出现）/ T-L2c（批量判活一次调用 + batchAlive 真单次 exec）/
 * T-N3/N4（查询+注入路径只读——peers/manifest/sessions 零写）+ T-L3a（冲突提示出现且写
 * 成功）/ T-L3b（死登记惰性清理）/ T-L3c（零冲突零提示）/ T-L3d（损坏按缺失降级）。
 *
 * 双端模拟约定（session-endmarker/session-safety 同型——伪属主范式）：种子直接写盘
 * （seedFile 模拟他实例/对端）；活 pid = 本进程 pid（真活）；死 pid = 不存在的大 pid
 * （99999999——isProcessAlive/batchAlive 判死）。真实 sessions/peers 目录读写均按
 * 已知路径（绝不枚举目录——session-safety 注记），测试 finally 清理本测试产物。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync,
  readdirSync, unlinkSync, statSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { sessionPath, getSessionId, manifestPath, normalizeCwd } from "../src/session.mjs"
import { writeTool } from "../src/tools/file.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import {
  peerInstances, peerInstancesTool, batchAlive,
  _setPeerInstancesTestImpl, _resetPeerInstancesTestImpl,
} from "../src/peer-instances.mjs"
import {
  flushPeerDomains, recordPeerWrites, peerDomains, conflicts, peerCollabNote,
  peersDir, peerFilePath, pathsOverlap, PEER_WRITE_TOOLS,
  _setPeerDomainsTestImpl, _resetPeerDomainsTestImpl,
} from "../src/peer-domains.mjs"
import { pushPeerReminder } from "../src/agent/setup-reminders.mjs"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const DEAD = 99999999 // 不存在的大 pid（真死——任何平台 tasklist/ps 查无）
const sidFor = (pid, tag) => `${pid}-1700000000000-${tag}` // 形如真实 sessionId（pid-ts-rand）

const ensureDir = (p) => mkdirSync(dirname(p), { recursive: true })
const seedFile = (p, content) => { ensureDir(p); writeFileSync(p, content) }
const manifestOf = (cwd) => sessionPath(cwd) + ".manifest"

/** 清理本测试在该 cwd 的会话文件（已知路径——不枚举 sessions 目录） */
function cleanupSession(cwd) {
  const base = sessionPath(cwd)
  for (const s of ["", ".manifest", ".manifest.cli", ".manifest.cli.tmp", ".tmp", ".1", ".2", ".3"]) {
    try { rmSync(base + s, { recursive: true, force: true }) } catch {}
  }
}

/** 清理本测试在 peers 目录创建的登记文件（已知文件名） */
function cleanupPeerFiles(...sessionIds) {
  for (const id of sessionIds) {
    try { unlinkSync(peerFilePath(id)) } catch {}
  }
}

/** 种 manifest（含 slotSessions——本端 + 他实例条目；slots 空对象即可——感知只读 slotSessions） */
function seedManifest(cwd, slotSessions) {
  seedFile(manifestOf(cwd), JSON.stringify({ slots: {}, slotSessions, active: 1, sessionId: null }))
}

/** 种他实例 peers 登记（伪属主——B 实例的登记文件；cwd 须与测试 cwd 同构） */
function seedPeerFile(sessionId, { pid, cwd, domains, updatedAt = Date.now(), end = "cli" }) {
  seedFile(peerFilePath(sessionId), JSON.stringify({
    sessionId, pid, end, cwd: normalizeCwd(cwd), domains, updatedAt,
  }))
}

test("T-L1a + 注入时序: prepareRun 有同伴注入「N 个同伴」——transient + env-state 后 time 前", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l1a-"))
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => new Set(pids),
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, `node thincoder pid=${p}`])),
  })
  try {
    const myId = getSessionId()
    seedManifest(cwd, { 1: myId, 2: sidFor(4242, "aa"), 3: sidFor(4243, "bb") })
    const { createAgent } = await import("../src/agent.mjs")
    const { prepareRun } = await import("../src/agent/setup.mjs")
    const agent = createAgent({
      provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    await prepareRun(agent, "hi", {})
    const peers = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("活跃 thincoder"))
    assert.equal(peers.length, 1, "有同伴 → 恰好一条 peer reminder")
    assert.equal(peers[0].transient, true, "transient: true（人读线落盘过滤）")
    assert.ok(
      peers[0].content.includes("本目录另有 2 个活跃 thincoder（cli pid=4242、cli pid=4243）——文件操作注意避让"),
      `文案逐字形态——实际: ${peers[0].content}`,
    )
    // 注入时序：env-state 后、time reminder 前（time 尾位契约不动）
    const envIdx = agent.history.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: env:"))
    const timeIdx = agent.history.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[System reminder: current time is "))
    const peerIdx = agent.history.indexOf(peers[0])
    assert.ok(envIdx !== -1 && timeIdx !== -1, "env-state 与 time reminder 均存在")
    assert.ok(envIdx < peerIdx && peerIdx < timeIdx, `时序: env-state(${envIdx}) < peer(${peerIdx}) < time(${timeIdx})`)
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L1b: 无同伴（仅 self / 无 manifest）→ 不注入（零开销——无判活调用、无 cmdline 探测）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l1b-"))
  let aliveCalls = 0
  let cmdCalls = 0
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => { aliveCalls++; return new Set(pids) },
    cmdlineFn: (pids) => { cmdCalls++; return new Map() },
  })
  try {
    // 仅 self：无同伴
    seedManifest(cwd, { 1: getSessionId() })
    const agent = { cwd, history: [] }
    pushPeerReminder(agent)
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("活跃 thincoder")), "仅 self → 不注入")
    assert.equal(aliveCalls, 0, "无其他实例 → 零判活调用（零开销）")
    assert.equal(cmdCalls, 0, "无其他实例 → 零 cmdline 探测")
    // 无 manifest：同样零开销不注入
    const agent2 = { cwd: mkdtempSync(join(tmpdir(), "peer-l1b2-")), history: [] }
    try {
      pushPeerReminder(agent2)
      assert.ok(!agent2.history.some((m) => typeof m.content === "string" && m.content.includes("活跃 thincoder")), "无 manifest → 不注入")
      assert.equal(aliveCalls, 0, "无 manifest → 零判活调用")
    } finally {
      rmSync(agent2.cwd, { recursive: true, force: true })
    }
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L1c: 惰性缓存——manifest mtime 未变 → 二次 prepareRun 不重查（判活/探测计数不变）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l1c-"))
  let aliveCalls = 0
  let cmdCalls = 0
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => { aliveCalls++; return new Set(pids) },
    cmdlineFn: (pids) => { cmdCalls++; return new Map(pids.map((p) => [p, "node x"])) },
  })
  try {
    const myId = getSessionId()
    seedManifest(cwd, { 1: myId, 2: sidFor(4242, "cc") })
    const { createAgent } = await import("../src/agent.mjs")
    const { prepareRun } = await import("../src/agent/setup.mjs")
    const agent = createAgent({
      provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
      tools: [], config: { agent: {} }, cwd,
    })
    await prepareRun(agent, "hi", {})
    assert.equal(aliveCalls, 1, "首回合一次批量判活")
    assert.equal(cmdCalls, 1, "首回合一次 cmdline 探测")
    await prepareRun(agent, "again", {})
    assert.equal(aliveCalls, 1, "manifest mtime 未变 → 二次回合零重查（缓存命中）")
    assert.equal(cmdCalls, 1, "manifest mtime 未变 → 二次回合零重查")
    const peers = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("活跃 thincoder"))
    assert.equal(peers.length, 2, "每回合一条（累计两条——有同伴每回合注入）")
    // mtime 变化 → 重查（缓存失效）
    seedManifest(cwd, { 1: myId, 2: sidFor(4244, "cd") }) // 重种——mtime 变（内容变同伴 pid）
    await sleep(10) // 文件系统 mtime 粒度保护
    const fresh = peerInstances(cwd)
    assert.equal(fresh.filter((p) => !p.self).length, 1, "重种后新同伴可见")
    assert.ok(aliveCalls >= 2, "mtime 变了 → 重查（新一次判活）")
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L2a + T-N4: peer_instances 查询——字段白名单精确 {pid,end,sessionId,slots} + 端分类 + 去 self", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l2a-"))
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => new Set(pids),
    cmdlineFn: (pids) => new Map([
      [4242, "C:\\node\\node.exe D:\\x\\bin\\thincoder.cjs"],
      [4243, '"C:\\Program Files\\Microsoft VS Code\\Code.exe" --type=extensionHost --extensionDevelopmentPath=D:\\x'],
    ]),
  })
  try {
    const myId = getSessionId()
    const sidA = sidFor(4242, "ea") // 同 sessionId 占两槽——去重分组目标
    seedManifest(cwd, { 1: myId, 2: sidA, 3: sidA, 4: sidFor(4243, "ec") })
    const out = await peerInstancesTool.execute({}, { cwd })
    const parsed = JSON.parse(out)
    assert.equal(parsed.length, 2, "self 排除——剩 2 同伴")
    for (const e of parsed) {
      assert.deepEqual(Object.keys(e).sort(), ["end", "pid", "sessionId", "slots"], `字段白名单精确——实际键: ${Object.keys(e)}`)
    }
    const cli = parsed.find((e) => e.pid === 4242)
    const vsc = parsed.find((e) => e.pid === 4243)
    assert.equal(cli.end, "cli", "node cmdline → cli 端")
    assert.equal(vsc.end, "vscode", "Code.exe 扩展宿主 cmdline → vscode 端")
    assert.deepEqual(cli.slots, [2, 3], "同 sessionId 多槽去重分组")
    assert.deepEqual(vsc.slots, [4], "槽位归属")
    assert.ok(parsed.every((e) => e.sessionId !== myId), "任何条目都不带 self sessionId")
    assert.ok(parsed.every((e) => !("self" in e)), "工具输出无 self 键（白名单外键即红）")
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L2b: 死主条目（DEAD pid）不出现", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l2b-"))
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => new Set(pids.filter((p) => p !== DEAD)),
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, "node x"])),
  })
  try {
    const myId = getSessionId()
    seedManifest(cwd, { 1: myId, 2: sidFor(4242, "fa"), 3: sidFor(DEAD, "fb") })
    const out = await peerInstancesTool.execute({}, { cwd })
    const parsed = JSON.parse(out)
    assert.equal(parsed.length, 1, "死主不出现")
    assert.equal(parsed[0].pid, 4242, "仅活同伴列出")
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L2c: 批量判活 = 一次调用全量 pid（peerInstances 单次批量）+ batchAlive 真单 exec 判活本进程/判死大 pid", () => {
  // 注入缝层：一次 peerInstances 扫描 → aliveFn 恰好一次、携带全部 pid
  const cwd = mkdtempSync(join(tmpdir(), "peer-l2c-"))
  const calls = []
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => { calls.push([...pids].sort((a, b) => a - b)); return new Set(pids) },
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, "node x"])),
  })
  try {
    const myId = getSessionId()
    const sidA = sidFor(4242, "ga") // 同 sessionId 两槽（键 2/5）
    seedManifest(cwd, { 1: myId, 2: sidA, 3: sidFor(4243, "gb"), 4: sidFor(4244, "gc"), 5: sidA })
    const peers = peerInstances(cwd)
    assert.equal(calls.length, 1, "一次批量判活（非每实例一次）")
    assert.deepEqual(calls[0], [4242, 4243, 4244], "去重后全量 pid 一次携带")
    assert.equal(peers.filter((p) => !p.self).length, 3, "同 sessionId 仍单条")
    // batchAlive 真路径（真实单次 exec）：本进程 pid 判活；大 pid 判死
    const alive = batchAlive([process.pid, DEAD])
    assert.ok(alive.has(process.pid), "batchAlive 真 exec——本进程 pid 判活")
    assert.ok(!alive.has(DEAD), "batchAlive 真 exec——大 pid 判死")
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-N3: peer_instances 查询 + L1 注入路径纯只读——manifest/peers/sessions 零写（fs 写点零）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-n3-"))
  _setPeerInstancesTestImpl({
    aliveFn: (pids) => new Set(pids),
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, "node x"])),
  })
  try {
    const myId = getSessionId()
    const slotA = sidFor(4242, "ha")
    seedManifest(cwd, { 1: myId, 2: slotA })
    const manifestBefore = readFileSync(manifestOf(cwd), "utf8")
    const manifestMtime = statSync(manifestOf(cwd)).mtimeMs
    const peersBefore = existsSync(peersDir()) ? readdirSync(peersDir()).sort() : []
    // 查询 + 注入两条路径各跑一遍（含 peer_instances 工具 execute）
    const out = await peerInstancesTool.execute({}, { cwd })
    assert.equal(JSON.parse(out).length, 1, "查询正常")
    const agent = { cwd, history: [] }
    pushPeerReminder(agent)
    assert.ok(agent.history.length === 1, "注入正常")
    // 只读断言：manifest 内容与 mtime 不变；peers 目录无新增；无会话槽文件产生
    assert.equal(readFileSync(manifestOf(cwd), "utf8"), manifestBefore, "manifest 内容未被改（零写）")
    assert.equal(statSync(manifestOf(cwd)).mtimeMs, manifestMtime, "manifest mtime 未变（零写）")
    const peersAfter = readdirSync(peersDir()).sort()
    assert.deepEqual(peersAfter, peersBefore, "peers 目录零新增（感知路径不写登记）")
    for (const s of [".1", ".2", ".3"]) {
      assert.ok(!existsSync(sessionPath(cwd) + s), `无会话槽文件产生（${s}——感知路径不认领）`)
    }
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

// ─── L3 域面 ─────────────────────────────────────────────────────────────

const L3_CLEANUP = [] // 测试创建的 peers 文件（finally 清理——真实 peers 目录不残留）

test("T-L3a: A 写 x → flush 后 peers 文件含 x；B（他实例登记含 x）写 x → 软提示出现且写成功（不阻止）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3a-"))
  const OTHER = "peer-l3a-other"
  const x = resolve(cwd, "x.txt")
  try {
    // A 回合写 x → 钩子记录 → 回合末 flush → 本实例登记含 x
    const agentA = { cwd, _peerWritten: new Set() }
    recordPeerWrites(agentA, writeTool, { path: "x.txt" })
    flushPeerDomains(agentA)
    const selfFile = peerFilePath(getSessionId())
    L3_CLEANUP.push(selfFile)
    const reg = JSON.parse(readFileSync(selfFile, "utf8"))
    assert.deepEqual(reg.domains, [x], "A 的 peers 登记含 x（绝对路径）")
    assert.equal(reg.cwd, normalizeCwd(cwd), "登记 cwd 同构")
    assert.equal(reg.pid, process.pid, "登记 pid = 本进程")
    assert.equal(reg.end, "cli", "登记端 = cli")
    assert.equal(agentA._peerWritten.size, 0, "flush 后回合集合清空")
    // B 实例登记（含 x——hot：updatedAt=now）+ 活 pid（本进程）
    seedPeerFile(OTHER, { pid: process.pid, cwd, domains: [x] })
    L3_CLEANUP.push(peerFilePath(OTHER))
    await sleep(10) // peers 目录 mtime 粒度保护（缓存失效）
    // B 经 dispatch 写同一 x → 提示出现（不阻止——写成功）
    const tool = writeTool
    const agent = { tools: [tool], cwd, config: { agent: {} }, planMode: false, autoApprove: true, _role: null }
    const results = await executeToolCalls(agent, toolByNameOf(tool), [
      { id: "w1", name: "write", arguments: JSON.stringify({ path: "x.txt", content: "v2" }) },
    ], {}, 0, undefined)
    assert.equal(results[0].ok, true, "写未被阻止")
    assert.equal(readFileSync(x, "utf8"), "v2", "文件真实写入（不阻止语义）")
    assert.ok(results[0].result.includes("[peer-collab]"), `软提示附在工具结果——实际: ${results[0].result}`)
    assert.ok(results[0].result.includes("cli pid="), "提示含他实例端/pid")
    assert.ok(results[0].result.includes("x.txt") || results[0].result.includes(x), "提示含冲突目标路径")
    // 同路径零冲突时零提示（对照——T-L3c 前置面）
    const results2 = await executeToolCalls(agent, toolByNameOf(tool), [
      { id: "w2", name: "write", arguments: JSON.stringify({ path: "y.txt", content: "v1" }) },
    ], {}, 0, undefined)
    assert.equal(results2[0].ok, true, "无冲突写照常")
    assert.ok(!results2[0].result.includes("[peer-collab]"), "零冲突 → 零提示（T-L3c）")
  } finally {
    for (const f of L3_CLEANUP.splice(0)) { try { unlinkSync(f) } catch {} }
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

function toolByNameOf(...tools) {
  return new Map(tools.map((t) => [t.name, t]))
}

test("T-L3a 单元面: flush 无写入跳过（文件保留/不新建）；损坏容忍不抛", () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3a2-"))
  const selfFile = peerFilePath(getSessionId())
  try {
    // 空回合 flush：不新建、不抛
    flushPeerDomains({ cwd, _peerWritten: new Set() })
    assert.ok(!existsSync(selfFile), "空回合不写登记（零 IO）")
    flushPeerDomains({}) // 连字段都没有也安全
    assert.ok(!existsSync(selfFile), "字段缺失也安全（不抛不写）")
  } finally {
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-L3b: 死登记惰性清理——聚合时死 pid 文件删除、活登记保留", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3b-"))
  const DEAD_FILE = "peer-l3b-dead"
  const LIVE_FILE = "peer-l3b-live"
  const x = resolve(cwd, "x.txt")
  try {
    seedPeerFile(DEAD_FILE, { pid: DEAD, cwd, domains: [x] })
    seedPeerFile(LIVE_FILE, { pid: process.pid, cwd, domains: [x] })
    await sleep(10)
    const peers = peerDomains(cwd)
    assert.equal(peers.length, 1, "死登记不聚合")
    assert.equal(peers[0].sessionId, LIVE_FILE, "活登记保留")
    assert.ok(!existsSync(peerFilePath(DEAD_FILE)), "死 pid 登记文件被惰性删除")
    assert.ok(existsSync(peerFilePath(LIVE_FILE)), "活登记文件保留")
  } finally {
    cleanupPeerFiles(DEAD_FILE, LIVE_FILE)
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-L3c: 零冲突 → 零提示（单元面——conflicts 空 + peerCollabNote null）；hot 窗口过期不提示", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3c-"))
  const OTHER = "peer-l3c-other"
  const x = resolve(cwd, "x.txt")
  try {
    // 无任何登记 → 零冲突
    assert.deepEqual(conflicts(cwd, [x]), [], "无登记 → 零冲突")
    assert.equal(peerCollabNote(cwd, writeTool, { path: "x.txt" }), null, "无登记 → 零提示")
    // 他实例登记含其他文件 → 目标不冲突
    seedPeerFile(OTHER, { pid: process.pid, cwd, domains: [resolve(cwd, "other.txt")], updatedAt: Date.now() })
    await sleep(10)
    assert.deepEqual(conflicts(cwd, [x]), [], "域不含目标 → 零冲突")
    assert.equal(peerCollabNote(cwd, writeTool, { path: "x.txt" }), null, "域不含目标 → 零提示")
    // hot 窗口过期（updatedAt 超 5 分钟）→ 不提示
    seedPeerFile(OTHER + "2", { pid: process.pid, cwd, domains: [x], updatedAt: Date.now() - 6 * 60 * 1000 })
    await sleep(10)
    assert.deepEqual(conflicts(cwd, [x]), [], "hot 过期 → 零冲突")
    // 热登记含 x → 冲突（对照成立）
    seedPeerFile(OTHER + "3", { pid: process.pid, cwd, domains: [x], updatedAt: Date.now() })
    await sleep(10)
    const hits = conflicts(cwd, [x])
    assert.equal(hits.length, 1, "热登记命中")
    assert.equal(hits[0].target, x, "冲突目标正确")
  } finally {
    cleanupPeerFiles(OTHER, OTHER + "2", OTHER + "3")
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-L3d: peers 文件损坏 → 按缺失降级（不崩、不删、零冲突）；非本 cwd 登记不聚合", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3d-"))
  const BROKEN = "peer-l3d-broken"
  const WRONG_CWD = "peer-l3d-othercwd"
  const x = resolve(cwd, "x.txt")
  try {
    // 损坏（解析失败）与结构非法（缺字段）都按缺失降级——不删不炸
    seedFile(peerFilePath(BROKEN), "{broken json!!")
    seedFile(peerFilePath(BROKEN + "2"), JSON.stringify({ sessionId: BROKEN + "2", pid: process.pid, domains: [x], updatedAt: Date.now() })) // 缺 cwd → 结构非法
    await sleep(10)
    assert.deepEqual(conflicts(cwd, [x]), [], "损坏文件按缺失降级——零冲突不崩")
    assert.deepEqual(peerDomains(cwd), [], "损坏不聚合")
    assert.ok(existsSync(peerFilePath(BROKEN)), "损坏文件不删（NF2 同型——属主下次 flush 覆盖）")
    // 他 cwd 实例的登记不聚合（同 cwd 才可见——F3 作用域）
    const otherCwd = mkdtempSync(join(tmpdir(), "peer-l3d-other-"))
    try {
      seedPeerFile(WRONG_CWD, { pid: process.pid, cwd: otherCwd, domains: [x], updatedAt: Date.now() })
      await sleep(10)
      assert.deepEqual(peerDomains(cwd), [], "他 cwd 登记不聚合")
      assert.deepEqual(conflicts(cwd, [x]), [], "他 cwd 登记不冲突")
    } finally {
      cleanupPeerFiles(WRONG_CWD)
      rmSync(otherCwd, { recursive: true, force: true })
    }
  } finally {
    cleanupPeerFiles(BROKEN, BROKEN + "2")
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("路径重叠 + 目标解析单元: pathsOverlap 包含语义 + peerWriteTargets 多形态", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-unit-"))
  try {
    // 相等 / 目录包含（双向）/ 混分隔符 / 大小写（Windows）
    assert.ok(pathsOverlap(resolve(cwd, "a/b.txt"), resolve(cwd, "a/b.txt")), "相等重叠")
    assert.ok(pathsOverlap(resolve(cwd, "a/b.txt"), resolve(cwd, "a")), "文件在目录域内")
    assert.ok(pathsOverlap(resolve(cwd, "a"), resolve(cwd, "a/b.txt")), "目录域包含文件（file_ops 目录级）")
    assert.ok(pathsOverlap(join(cwd, "a/b.txt"), resolve(cwd, "a")), "混分隔符")
    if (process.platform === "win32") {
      assert.ok(pathsOverlap("D:\\A\\B\\x.txt", "d:/a/b"), "Windows 大小写 + 分隔符归一")
    }
    assert.ok(!pathsOverlap(resolve(cwd, "a/c.txt"), resolve(cwd, "a/b")), "兄弟路径不重叠（b 前缀陷阱——bc.txt vs b）")
    // PEER_WRITE_TOOLS 覆盖设计清单（write/edit/apply_patch/delete/file_ops——含 insert/hashline 同面工具）
    for (const n of ["write", "edit", "apply_patch", "delete", "file_ops", "insert_after", "hashline_edit"]) {
      assert.ok(PEER_WRITE_TOOLS.has(n), `PEER_WRITE_TOOLS 含 ${n}`)
    }
    assert.ok(!PEER_WRITE_TOOLS.has("read"), "只读工具不在写集合")
  } finally {
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-L2d: 判活探测失败（aliveFn → null）→ 只读面按无活伴降级（不显示幽灵同伴、不崩）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l2d-"))
  _setPeerInstancesTestImpl({
    aliveFn: () => null, // 模拟 batchAlive exec 失败（修正轮 #2——null ≠ 全死）
    cmdlineFn: (pids) => new Map(pids.map((p) => [p, "node x"])),
  })
  try {
    const myId = getSessionId()
    seedManifest(cwd, { 1: myId, 2: sidFor(4242, "la") })
    const peers = peerInstances(cwd)
    assert.equal(peers.length, 1, "探测失败 → 只列 self（无幽灵同伴）")
    assert.equal(peers[0].self, true, "self 恒在")
    const out = await peerInstancesTool.execute({}, { cwd })
    assert.equal(JSON.parse(out).length, 0, "工具输出空清单（不报错）")
  } finally {
    _resetPeerInstancesTestImpl()
    cleanupSession(cwd)
  }
})

test("T-L3e: 判活探测失败（null）→ 域面不执行死清理（活实例登记文件保留、零冲突）", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "peer-l3e-"))
  const OTHER = "peer-l3e-other"
  const x = resolve(cwd, "x.txt")
  _setPeerDomainsTestImpl({ aliveFn: () => null }) // 模拟 batchAlive exec 失败（修正轮 #2）
  try {
    seedPeerFile(OTHER, { pid: process.pid, cwd, domains: [x], updatedAt: Date.now() })
    await sleep(10)
    assert.deepEqual(peerDomains(cwd), [], "探测失败 → 聚合降级空（不误报活登记）")
    assert.deepEqual(conflicts(cwd, [x]), [], "探测失败 → 零冲突（保守方向）")
    assert.ok(existsSync(peerFilePath(OTHER)), "探测失败 ≠ 死——登记文件不被 unlink（破坏性清理仅在判死时）")
    // 恢复真实判活后正常聚合（死清理只在真死时发生）
    _resetPeerDomainsTestImpl()
    await sleep(10)
    const peers = peerDomains(cwd)
    assert.equal(peers.length, 1, "探测恢复 → 活登记正常聚合")
    assert.equal(peers[0].sessionId, OTHER, "活登记内容正确")
  } finally {
    _resetPeerDomainsTestImpl()
    cleanupPeerFiles(OTHER)
    cleanupSession(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-L2e: peer_instances 工具注册端到端——assembleAgent 装配不炸且含 peer_instances（隔离 HOME 子进程——修正轮 #1 回归）", async () => {
  // 修正轮 #1：make-agent.mjs 曾把工具对象当工厂调用（peerInstancesTool()）→ assembleAgent
  // 每次执行即 TypeError（chat/TUI/ACP 启动即崩）。全库唯一端到端 CLI 用例 slow-gated 未
  // 覆盖——此处以隔离 HOME（os.homedir 读 USERPROFILE/HOME）子进程跑真实 assembleAgent，
  // 零外部配置副作用（无 provider/MCP/embedding/team——configDir 指向临时 HOME）。
  const script = `
    const { assembleAgent } = await import("${new URL("../src/cli/make-agent.mjs", import.meta.url).href}")
    const agent = await assembleAgent()
    const names = agent.tools.map((t) => t.name)
    console.log("TOOLS:" + names.join(","))
    if (!names.includes("peer_instances")) { console.error("MISSING peer_instances"); process.exit(3) }
  `
  const { execFile } = await import("node:child_process")
  const { promisify } = await import("node:util")
  const execFileP = promisify(execFile)
  const fakeHome = mkdtempSync(join(tmpdir(), "peer-home-"))
  try {
    const env = {
      ...process.env,
      USERPROFILE: fakeHome, // Windows os.homedir()
      HOME: fakeHome, // POSIX os.homedir()
    }
    const { stdout } = await execFileP(process.execPath, ["--input-type=module", "-e", script], {
      env, cwd: fakeHome, timeout: 60000, encoding: "utf8",
    })
    assert.ok(stdout.includes("TOOLS:"), `assembleAgent 装配成功——stdout: ${stdout.slice(0, 200)}`)
    assert.ok(stdout.includes("peer_instances"), "工具清单含 peer_instances（注册端到端）")
  } finally {
    rmSync(fakeHome, { recursive: true, force: true })
  }
})

