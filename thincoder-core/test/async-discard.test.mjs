/**
 * async-discard.test.mjs — CLI 侧中止丢弃对称单点用例（设计权威 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`
 * §6.20.6 用例表 U1–U8；需求 = `docs/core/requirements/AGENT-LOOP.md` §4.10 F1–F4 / N1–N3）。
 *
 * 断言面 = **行为面**（§6.20.6：池内容 / 墓碑状态 / 注入 / 事件计数），不做散文锚。
 * 事件断言 = `THINCODER_LOG_DIR` 隔离目录读档（`log.test.mjs` 同款——NODE_TEST_CONTEXT 写门）。
 * 夹具 = **CLI 载体形**（字段挂 agent——`thincoder-core` 侧口径；VSC 载体形由
 * `async-family.test.mjs` 的载体吸收面覆盖）。
 * 直调口径（U7 前提）：两接线点**不传 ctx**（§6.20.3 D-AD6——判据 = controller 支）；
 * `ctx` 只在本档直调用例（U5）显式传入。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { discardAbortedPool, discardAbortedAdvisors } from "../agent-tools/async-discard.mjs"
import { tombstoneOf } from "../agent-tools/async-settle.mjs"
import { depInfo } from "../agent-tools/subagent-scheduler.mjs"

let _tmp
let _logDir

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-async-discard-"))
  _logDir = join(_tmp, "logs")
  process.env.THINCODER_LOG_DIR = _logDir // 写门 override（NODE_TEST_CONTEXT 默认跳过）
})

after(() => {
  delete process.env.THINCODER_LOG_DIR
  rmSync(_tmp, { recursive: true, force: true })
})

/** `ev:discarded` 事件行（隔离目录——按目录内全部文件读，不假定单日文件名）。 */
function discardedEvents() {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) {
    for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        if (e.ev === "ev:discarded") out.push(e)
      } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

/** 已写 `ev:discarded` 条数（用例内取基线，断言**增量**——不依赖用例执行次序）。 */
function evCount() {
  return discardedEvents().length
}

/** 已中止控制器（真 AbortController——`parentAborted` controller 支实判面）。 */
function abortedController() {
  const c = new AbortController()
  c.abort()
  return c
}

function runningEntry(id, role, extra = {}) {
  return { id: String(id), role, status: "running", controller: new AbortController(), ...extra }
}

function abortedRunning(id, role, extra = {}) {
  return { id: String(id), role, status: "running", controller: abortedController(), ...extra }
}

function abortedQueued(id, role, position = 1) {
  return { id: String(id), role, status: "queued", position, controller: abortedController() }
}

/** CLI 载体形夹具（字段挂 agent——`carrierField` 父对象优先面）。 */
function stubAgent() {
  return { history: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _asyncQueue: [] }
}

// ═══ U1–U8（§6.20.6）═══════════════════════════════════════════════════

test("U1 正常·子代理族只清已死：中止条目出池 + discarded 墓碑；done/cancelled/存活留池", () => {
  const agent = stubAgent()
  const runAborted = abortedRunning(11, "eng-coder")
  const queuedAborted = abortedQueued(12, "explore", 1)
  const doneInPool = { id: "13", role: "explore", status: "running", done: true }
  const cancelled = { id: "14", role: "coder", status: "running", cancelled: true }
  const liveQueued = runningEntry(15, "coder", { status: "queued", position: 2 }) // 存活排队条目
  for (const e of [runAborted, queuedAborted, doneInPool, cancelled, liveQueued]) {
    agent._asyncSubagents.set(String(e.id), e)
  }
  agent._asyncQueue = [queuedAborted, liveQueued]
  const ev0 = evCount()

  const out = discardAbortedPool(agent)

  assert.deepEqual(out.discarded, [
    { id: "11", role: "eng-coder", wasStatus: "running" },
    { id: "12", role: "explore", wasStatus: "queued" },
  ])
  assert.equal(out.kept, 3)
  assert.deepEqual([...agent._asyncSubagents.keys()], ["13", "14", "15"], "存活 / done-in-pool / cancelled 留池")
  assert.deepEqual(tombstoneOf(agent, 11), { status: "discarded", role: "eng-coder" })
  assert.deepEqual(tombstoneOf(agent, 12), { status: "discarded", role: "explore" })
  assert.equal(tombstoneOf(agent, 13), null, "done-in-pool 不写墓碑")
  assert.equal(tombstoneOf(agent, 14), null, "cancelled 不写墓碑")
  // 生产者 → 消费者 seam（F1 × F4）：真丢弃写入的墓碑，依赖终态判据读得到（同容器）
  assert.deepEqual(depInfo(agent, 11), { state: "cancelled", role: "eng-coder" })
  assert.equal(depInfo(agent, 13).state, "ok", "done-in-pool 仍判 ok")
  assert.equal(agent._asyncQueue.length, 1, "存活排队条目仍在队列")
  assert.equal(agent._asyncQueue[0], liveQueued)
  assert.equal(agent._asyncQueue[0].position, 1, "存活条目 position 重编号 1..n")
  assert.equal(agent.history.length, 1, "整批一次注入")
  assert.equal(agent.history[0].role, "user")
  assert.match(agent.history[0].content, /^\[System reminder: 2 background subagent\(s\) were discarded by the user's Stop/)
  const events = discardedEvents().slice(ev0)
  assert.equal(events.length, 1, "恰好一条 ev:discarded")
  assert.equal(events[0].n, 2)
})

test("U2 正常·评审族：中止评审出池 + discarded 墓碑（role advisor）；done 留池", () => {
  const agent = stubAgent()
  agent._asyncAdvisors.set("21", abortedRunning(21, "advisor", { reviewType: "design" }))
  agent._asyncAdvisors.set("22", { id: "22", role: "advisor", status: "running", done: true, reviewType: "code" })
  const ev0 = evCount()

  const out = discardAbortedAdvisors(agent)

  assert.deepEqual(out.discarded, [{ id: "21", role: "advisor", reviewType: "design", wasStatus: "running" }])
  assert.equal(out.kept, 1)
  assert.deepEqual([...agent._asyncAdvisors.keys()], ["22"])
  assert.deepEqual(tombstoneOf(agent, 21), { status: "discarded", role: "advisor" })
  assert.equal(agent.history.length, 1)
  assert.match(agent.history[0].content, /^\[System reminder: 1 background advisor review\(s\) were discarded by the user's Stop/)
  assert.match(agent.history[0].content, /No design token was issued for a discarded design review/)
  assert.match(agent.history[0].content, /advisor#21 \(design\) \(was running\)/)
  assert.equal(evCount() - ev0, 1)
})

test("U3 边界·零丢弃 = 零噪音（全 done 池 / 空池 ⇒ 零注入、零事件）", () => {
  const agent = stubAgent()
  agent._asyncSubagents.set("31", { id: "31", role: "explore", status: "running", done: true })
  agent._asyncSubagents.set("32", { id: "32", role: "coder", status: "running", cancelled: true })

  const before = evCount()
  const out = discardAbortedPool(agent)
  const outAdv = discardAbortedAdvisors(agent) // 空池
  const outMissing = discardAbortedPool({ history: [] }) // 空载体

  assert.deepEqual(out, { discarded: [], kept: 2 })
  assert.deepEqual(outAdv, { discarded: [], kept: 0 })
  assert.deepEqual(outMissing, { discarded: [], kept: 0 })
  assert.equal(agent.history.length, 0, "零丢弃 ⇒ 零注入")
  assert.equal(evCount(), before, "零丢弃 ⇒ 零事件")
  assert.equal(agent._asyncSubagents.size, 2, "池不变")
})

test("U4 边界·载体缺失（池字段不存在）：空结果、不抛", () => {
  assert.deepEqual(discardAbortedPool({ history: [] }), { discarded: [], kept: 0 })
  assert.deepEqual(discardAbortedAdvisors({}), { discarded: [], kept: 0 })
  assert.deepEqual(discardAbortedPool({}), { discarded: [], kept: 0 })
})

test("U5 边界·interrupt 豁免（ctx.signal.reason.interrupt）：controller 未中止 ⇒ 零丢弃", () => {
  const agent = stubAgent()
  const live = runningEntry(41, "explore")
  const liveQ = runningEntry(42, "coder", { status: "queued", position: 1 })
  agent._asyncSubagents.set("41", live)
  agent._asyncSubagents.set("42", liveQ)
  agent._asyncQueue = [liveQ]
  const c = new AbortController()
  c.abort({ interrupt: true }) // Ctrl+I（§6.20.3：不是全停——池保留）

  const out = discardAbortedPool(agent, { signal: c.signal })

  assert.deepEqual(out, { discarded: [], kept: 2 })
  assert.equal(agent.history.length, 0)
  assert.equal(agent._asyncQueue.length, 1)
})

test("U6 边界·队列剔除精确：仅丢弃 id 剔除，存活条目 position 重编号 1..n", () => {
  const agent = stubAgent()
  const dead = abortedQueued(51, "explore", 1)
  const live1 = runningEntry(52, "coder", { status: "queued", position: 2 })
  const live2 = runningEntry(53, "plan", { status: "queued", position: 3 })
  for (const e of [dead, live1, live2]) agent._asyncSubagents.set(String(e.id), e)
  agent._asyncQueue = [dead, live1, live2]

  const out = discardAbortedPool(agent)

  assert.deepEqual(out.discarded, [{ id: "51", role: "explore", wasStatus: "queued" }])
  assert.deepEqual(agent._asyncQueue, [live1, live2], "仅丢弃 id 剔除（存活条目保序）")
  assert.deepEqual(agent._asyncQueue.map((e) => e.position), [1, 2], "position 重编号 1..n")
  assert.deepEqual([...agent._asyncSubagents.keys()], ["52", "53"])
})

test("U7 错误·条目形态残缺（`{}`；前提 ctx 未中止）：保守判不丢弃、不抛", () => {
  const agent = stubAgent()
  agent._asyncSubagents.set("x", {}) // 缺 controller / id

  const ev0 = evCount()
  const out = discardAbortedPool(agent) // 直调不传 ctx = 接线口径

  assert.deepEqual(out, { discarded: [], kept: 1 })
  assert.equal(agent._asyncSubagents.size, 1, "残缺条目留池")
  assert.equal(agent.history.length, 0)
  assert.equal(evCount() - ev0, 0, "零丢弃 ⇒ 零事件（连带零墓碑写入）")
})

test("U8 提醒形态：一条 user 消息 + 两词齐全 + 插值转义（D-AD8b）", () => {
  const agent = stubAgent()
  agent._asyncSubagents.set("61", abortedRunning(61, "eng-coder"))
  agent._asyncSubagents.set("62", abortedQueued(62, "explore", 1))
  agent._asyncSubagents.set("63", abortedRunning(63, "in<j>ect")) // 转义面（角色名含 XML 特殊字符）
  agent._asyncQueue = [agent._asyncSubagents.get("62")]
  const ev0 = evCount()

  const out = discardAbortedPool(agent)

  assert.equal(out.discarded.length, 3)
  assert.equal(agent.history.length, 1, "整批恰好一条消息")
  const msg = agent.history[0]
  assert.equal(msg.role, "user")
  assert.match(msg.content, /^\[System reminder: 3 background subagent\(s\) were discarded by the user's Stop — their reports will NOT arrive: /)
  assert.match(msg.content, /\(was running\)/, "running 词在位")
  assert.match(msg.content, /\(was queued — never started\)/, "queued 词在位")
  assert.match(msg.content, /Partial changes from discarded children stay unmerged\/unaudited; re-spawn if the work is still needed\.\]$/)
  assert.match(msg.content, /in&lt;j&gt;ect#63 \(was running\)/, "插值经 escapeXml")
  assert.equal(msg.content.includes("in<j>ect"), false, "裸特殊字符不入注入文本")
  assert.equal(evCount() - ev0, 1, "整批一条事件（n = 3）")
  assert.equal(discardedEvents().slice(ev0)[0].n, 3)
})

test("U3（#43-①）边界·部分 parent 形（队列挂 `history` 载体）：剔除 + 存活 position 重编号（今日 no-op）", () => {
  const history = []
  history._asyncQueue = [
    abortedQueued(71, "explore", 1),
    runningEntry(72, "coder", { status: "queued", position: 2 }),
    runningEntry(73, "plan", { status: "queued", position: 3 }),
  ]
  // 部分 parent：池挂父对象、队列挂载体（history）——第四读面须经 carrierField 吸收
  const parent = { _asyncSubagents: new Map(), history }
  for (const e of history._asyncQueue) parent._asyncSubagents.set(String(e.id), e)

  const out = discardAbortedPool(parent)

  assert.deepEqual(out.discarded, [{ id: "71", role: "explore", wasStatus: "queued" }])
  assert.deepEqual(parent.history._asyncQueue.map((e) => String(e.id)), ["72", "73"], "队列经载体读取——丢弃 id 剔除（今日 no-op）")
  assert.deepEqual(parent.history._asyncQueue.map((e) => e.position), [1, 2], "存活 position 重编号 1..n")
  assert.equal(parent._asyncQueue, undefined, "不在父对象另建队列分叉")
})
