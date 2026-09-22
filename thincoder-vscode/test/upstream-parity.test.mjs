/**
 * upstream-parity.test.mjs — VSC 对位面机验收（批 2026-09-19-upstream-channel-availability · F-UC7）。
 *
 * 设计权威：`docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.27.12.12（VSC 对位面）·
 * §6.27.12.5 G–L（接口契约）· §6.27.12.9（用例 T-VS-U1–U7）· §6.27.12.10 U9 / U12；
 * 批次档 `docs/batches/2026-09-19-upstream-channel-availability.md` §2.11 行 18 · §2.12 V2。
 *
 * 手法（三条缝 · 全部零网络）：
 * ① 挂起驱动缝——桩面板 + 桩 `entry.runTurn`（async-parity `suspFixture` 同形扩展）：
 *    T-VS-U1 开轮三元组 / T-VS-U2 注入内容非空（核 `drainChildUpstream` 真单源）/
 *    T-VS-U3 唤醒端到端（合成 parent 别名路 + 隔离日志目录读档）/ T-VS-U4 note 不唤醒不开轮；
 * ② 回复可达缝——核 `executeSendAction` 直驱（端侧载体形 `{ history }`）：T-VS-U6；
 * ③ 纯函数 + 源文本——T-VS-U7（组合同规 · 差异项 = 0）+ T-VS-U5（结构机检：生产载体表 /
 *    消费点 / 谓词 / 组合单点 + 动态 import 形态 + 核单源否定检查）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import files from "./files.mjs"
import { pushChildUpstream, drainChildUpstream } from "@thincoder/core/agent-tools/parent-channel.mjs"
import { executeSendAction } from "@thincoder/core/agent-tools/subagent-actions.mjs"
import { AUTO_TURN_DIGEST_DOMAIN, AUTO_TURN_DIGEST_DOMAIN_ENG, UPSTREAM_TURN_DOMAIN } from "@thincoder/core/agent/helpers.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import { CARRIER_FIELDS as PROD_CARRIER_FIELDS } from "../src/agent.mjs"
import { composeTurnDomain, VSC_TURN_OVERLAY } from "../src/agent/turn-domains.mjs"

let _tmp
let _logDir

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-upstream-parity-"))
  _logDir = join(_tmp, "logs")
  // logEvent 写门（NODE_TEST_CONTEXT 下默认跳过）——digest:start 载荷断言用；隔离目录防污染真实日志。
  process.env.THINCODER_LOG_DIR = _logDir
})
after(() => {
  delete process.env.THINCODER_LOG_DIR
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 事件行检索（隔离目录跨所有日文件；调用方按 delta 断言——防同进程跨用例串扰）。 */
function logEvents(ev) {
  let names = []
  try { names = readdirSync(_logDir) } catch { return [] }
  const out = []
  for (const n of names) {
    for (const line of readFileSync(join(_logDir, n), "utf8").split("\n")) {
      if (!line.trim()) continue
      try {
        const e = JSON.parse(line)
        if (e.ev === ev) out.push(e)
      } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return out
}

/** 条件轮询（条件成立即返回——防高负载下 flake）。 */
async function until(pred, ms = 5000) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return true
    if (Date.now() - t0 > ms) return pred()
    await new Promise((r) => setTimeout(r, 10))
  }
}

// ─── 夹具 ─────────────────────────────────────────────────────────────────────

/** 池条目夹具（真形状子集：send / drain 注脚读的四字段全在）。 */
function mkRunningEntry(over = {}) {
  return {
    id: 7, role: "explore", status: "running", done: false, cancelled: false,
    report: null, error: null, signal: null, controller: new AbortController(),
    ...over,
  }
}

/** 在飞条目夹具（形状 = 核 `pushChildUpstream` 载荷 `{ seq, from, kind, message, ts }`）。 */
function upstreamEntry(over = {}) {
  return { seq: 1, from: "explore#7", kind: "ask", message: "A 还是 B？", ts: Date.now(), ...over }
}

/** 挂起会话桩（async-parity `suspFixture` 同形扩展：+ 池 / 在飞队列 / runTurn 调用记录）。
 *  默认桩 `runTurn` = 「该轮把在飞队列与池消费干净」——令会话在下一拍自然退出。 */
function suspFixture({ pool = [], queue = null } = {}) {
  const posted = []
  const history = []
  const fullHistory = []
  history._suspended = false
  history._pendingAsyncResults = []
  history._asyncSubagents = new Map(pool.map((e) => [String(e.id), e]))
  if (queue) history._childUpstream = queue
  const panel = {
    posted,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _abortController: null,
    _turnControllers: [],
    _refreshStatus() {},
    _publishTurnState() {},
    _saveLines() {},
  }
  const calls = []
  const entry = {
    lines: { history, fullHistory }, cwd: process.cwd(), slot: 1,
    runTurn: async (opts) => {
      calls.push(opts)
      history._pendingAsyncResults = []
      history._childUpstream = []
      history._asyncSubagents.clear()
    },
  }
  return { panel, history, fullHistory, entry, calls }
}

/** 会话跑完（自然退出）或超时抛——防驱动不退出时挂死整个套件。 */
async function settleSession(session) {
  await Promise.race([
    session,
    new Promise((_, rej) => setTimeout(() => rej(new Error("suspensionSession 未自然退出（超时）")), 5000)),
  ])
}

// ═══ T-VS-U1（§6.27.12.9）：端壳驱动开轮三元组 ═══════════════════════════════

test("T-VS-U1 正常：在飞 ask + 池 live ⇒ 端壳恰开一轮（`{ autoTurn, text:'', upstreamTurn:true }`）", async () => {
  const f = suspFixture({ pool: [mkRunningEntry()], queue: [upstreamEntry()] })
  await settleSession(suspensionSession(f.panel, f.entry))
  assert.deepEqual(f.calls, [{ autoTurn: true, text: "", upstreamTurn: true }], "恰 1 次调用 + opts 逐键（旗标供域文本选择）")
  assert.equal(f.history._suspended, false, "池清后会话自然退出（不悬空）")
})

// ═══ T-VS-U2（§6.27.12.12 ①）：注入内容非空（F8 病征已消）═══════════════════

test("T-VS-U2 正常：开轮内消费在飞 ask——内容非空到达父侧 + 消费即清", async () => {
  const f = suspFixture({ pool: [mkRunningEntry()], queue: [upstreamEntry({ message: "选 A 还是 B？" })] })
  // 桩 runTurn = 端壳回合头语义（核 `drainChildUpstream` 单源；载体 = 生产形 `{ history, _fullHistory }`
  // ——`pushReal` 两线落盘，端壳 agent 对象同形）。
  const carrier = { history: f.history, _fullHistory: f.fullHistory }
  f.entry.runTurn = async () => {
    drainChildUpstream(carrier)
    f.history._asyncSubagents.clear()
  }
  await settleSession(suspensionSession(f.panel, f.entry))
  const users = f.history.filter((m) => m?.role === "user")
  assert.equal(users.length, 1, "恰一条合并注入消息")
  assert.match(users[0].content, /ask · explore#7: 选 A 还是 B？/, "内容非空且可读（kind · role#id: message）")
  assert.equal(f.history._childUpstream.length, 0, "消费即清（未 drain 窗口随该轮关闭）")
  assert.equal(f.fullHistory.filter((m) => m?.role === "user").length, 1, "同消息落人读线（事务性事件落盘）")
})

// ═══ T-VS-U3（§6.27.12.12 ③）：ask 唤醒驱动开轮（端到端）════════════════════

test("T-VS-U3 正常：等待期 ask 入队即唤醒 → 驱动重入开轮（合成 parent 别名路）+ 日志 `upstream: true`", async () => {
  const f = suspFixture({ pool: [mkRunningEntry()] }) // 队列留空：ask 在等待期由写侧注入
  const beforeStart = logEvents("digest:start").length
  const session = suspensionSession(f.panel, f.entry)
  await until(() => f.history._suspended === true && (f.history._asyncWaiters?.length ?? 0) > 0)
  assert.equal(f.history._suspended, true, "会话进入等待（第 4 步）")
  assert.equal(f.calls.length, 0, "等待期未开轮")
  // 写侧别名路（合成 parent 形——生产子代理侧同形：`pushChildUpstream({ parent })`）
  pushChildUpstream({ parent: { history: f.history }, from: "explore#7", kind: "ask", message: "在线提问" })
  await settleSession(session)
  assert.equal(f.calls.length, 1, "唤醒 ⇒ 第 2 步谓词真 ⇒ 恰开一轮（唤醒 + 谓词两件一组）")
  assert.equal(f.calls[0].upstreamTurn, true, "旗标随驱动到达 runTurn")
  const started = logEvents("digest:start")
  assert.equal(started.length - beforeStart, 1, "digest:start 恰一条")
  assert.equal(started.at(-1).upstream, true, "日志载荷条件携带 upstream: true（唤醒轮与 digest 轮可区分）")
  assert.equal(f.history._suspended, false, "会话自然退出")
})

// ═══ T-VS-U4（边界 7）：note 不唤醒不开轮 ════════════════════════════════════

test("T-VS-U4 边界：note 不入开轮判据、不唤醒——留队等下拐点", async () => {
  // ① 会话面：队列仅 note（池空）⇒ 零开轮；会话退出；队列原样保留
  const f = suspFixture({ queue: [upstreamEntry({ kind: "note", message: "FYI：前提失效" })] })
  await settleSession(suspensionSession(f.panel, f.entry))
  assert.equal(f.calls.length, 0, "note 不开轮")
  assert.equal(f.history._suspended, false, "池空即刻退出（不留悬空会话）")
  assert.equal(f.history._childUpstream.length, 1, "留队等下拐点（不消费、不丢弃）")

  // ② 唤醒面：note 入队不兑现等待栓；ask 兑现恰一次（核写侧单点语义）
  const h = []
  h._asyncWaiters = []
  let woke = 0
  h._asyncWaiters.push(() => { woke++ })
  const parent = { history: h }
  pushChildUpstream({ parent, from: "explore#9", kind: "note", message: "FYI" })
  assert.equal(woke, 0, "note 不唤醒（避「每条 note 一次父侧轮」）")
  pushChildUpstream({ parent, from: "explore#9", kind: "ask", message: "Q" })
  assert.equal(woke, 1, "ask 兑现恰一次（唤醒单点）")
  assert.equal(h._childUpstream.length, 2, "两条均入队（note 留队语义零变）")
})

// ═══ T-VS-U5（§6.27.12.10 U12）：结构机检 ═══════════════════════════════════

test("T-VS-U5 结构机检：生产载体表两款 / 消费点 / 谓词 / 组合单点 / 动态 import / 核单源否定", () => {
  assert.ok(files.includes("test/upstream-parity.test.mjs"), "本档已登记 test/files.mjs（不登记 = 不跑）")
  assert.ok(PROD_CARRIER_FIELDS.includes("_childUpstream") && PROD_CARRIER_FIELDS.includes("_childUpstreamSeq"),
    "生产 CARRIER_FIELDS 含两款（12 → 14；夹具副本对位锁 = scenario-03 T-AF16）")
  const root = fileURLToPath(new URL("..", import.meta.url))
  const read = (rel) => readFileSync(join(root, rel), "utf8")
  const count = (s, sub) => s.split(sub).length - 1
  const agentSrc = read("src/agent.mjs")
  assert.equal(count(agentSrc, "drainChildUpstream(agent)"), 1, "端壳消费点恰 1 处（循环头单点）")
  assert.equal(count(agentSrc, "composeTurnDomain("), 1, "域文本组合调用恰 1 处（调用方无从绕过端 overlay）")
  assert.equal(count(agentSrc, "composeTurnDomain(upstreamTurn, agent.config?.agent?.engineering === true)"), 1,
    "DOM-V3：组合调用传模式（第二实参 = 模式旗标，与核侧同键）")
  assert.ok(/await import\("@thincoder\/core\/agent-tools\/parent-channel\.mjs"\)/.test(agentSrc),
    "核单源经动态 import 载入（W8 契约②）")
  assert.ok(!/^\s*import\b[^\n]*agent-tools\/parent-channel\.mjs/m.test(agentSrc),
    "无静态引形态（静态引 ⇒ 端壳静态链可达 node:sqlite ⇒ W8 契约②红）")
  const suspSrc = read("src/extension/suspension.mjs")
  assert.ok(suspSrc.includes("upstreamWaiting("), "第 2 步判据含谓词调用（先于池空退出判）")
  const tdSrc = read("src/agent/turn-domains.mjs")
  assert.equal(count(tdSrc, "composeTurnDomain("), 1, "端侧组合单点定义恰 1 处")
  assert.ok(tdSrc.includes("VSC_TURN_OVERLAY"), "端 overlay 常量在场")
  assert.ok(!tdSrc.includes("[System reminder: auto-turn"), "核基座文本字面零在场（核单源守护——U12 同款否定检查）")
  assert.ok(read("src/agent/setup-reminders.mjs").includes("AUTO_TURN_DIGEST_DOMAIN_ENG"),
    "DOM-V3：W15 转口表 +1 名（端侧零自持基座副本——模式变体同经核单源）")
  // 旗标三跳（§6.27.12.5 I——每档一处透传；缺任一跳 = 旗标丢失 = CLI 发现 1 同型缺陷）
  const stagesSrc = read("src/extension/panel-turn-stages.mjs")
  assert.ok(stagesSrc.includes("upstreamTurn: tUp === true"), "跳 1：runTurn 闭包转发（panel-turn-stages）")
  const chatSrc = read("src/extension/panel-chat.mjs")
  assert.ok(chatSrc.includes("upstreamTurn = false") && chatSrc.includes("autoTurn, upstreamTurn, susp"), "跳 2：opts 解构 + runTurnLoop deps（panel-chat）")
  const loopSrc = read("src/extension/panel-turn-loop.mjs")
  assert.ok(loopSrc.includes("autoTurn, upstreamTurn, susp") && /^\s*upstreamTurn,$/m.test(loopSrc),
    "跳 3：deps 解构 + ro 字面量（panel-turn-loop → 核 runAgent opts 读点）")
})

// ═══ T-VS-U6（§6.27.12.4 ① 回复可达性）：send → running 子代理 ═══════════════

test("T-VS-U6 正常：回复可达——`send` 对 running 条目交付（端侧载体形 · 零新下行管子）", async () => {
  const history = []
  const entry = mkRunningEntry()
  history._asyncSubagents = new Map([["7", entry]])
  history._childUpstream = [upstreamEntry()] // 该子代理的未 drain ask 仍在父队列（在飞事实）
  const ctx = { agent: { history }, cwd: process.cwd(), depth: 0 }
  const out = JSON.parse(await executeSendAction({ id: 7, message: "用 A 方案继续" }, ctx))
  assert.equal(out.status, "delivered", "答复交付（回复路径零改）")
  assert.deepEqual(entry._injected, ["用 A 方案继续"], "条目 `_injected` 追加（子代理回合头消费）")
  assert.equal(out.queued, 1, "队列深度回显")
})

// ═══ T-VS-U7（§6.27.12.12 ④ · DOM-V1/V2）：组合同规（差异项 = 0 + 模式变体）════

test("T-VS-U7 正常：两轮域文本构成差异项 = 0（按轮型换基座 · 端 overlay 恒在场）", () => {
  const digest = composeTurnDomain(false)
  const ask = composeTurnDomain(true)
  // DOM-V2：默认参数零回归 + 唤醒轮不受模式影响（变体只挂 digest 基座）
  assert.equal(composeTurnDomain(false), composeTurnDomain(false, false),
    "第二实参缺省 ⇒ 与显式 false 逐字同（默认参数零回归——DOM-V1 输入格显式两参形）")
  const askEng = composeTurnDomain(true, true)
  assert.equal(askEng, ask, "唤醒轮两模式逐字同（`UPSTREAM_TURN_DOMAIN` 无 task 指针——模式不改唤醒轮）")
  // DOM-V1：digest 轮两模式（工程模式换变体基座）
  const digestEng = composeTurnDomain(false, true)
  assert.ok(digestEng.startsWith(AUTO_TURN_DIGEST_DOMAIN_ENG.slice(0, -1)), "DOM-V1 工程轮起头 = 变体基座逐字")
  assert.notEqual(digestEng, digest, "两模式 digest 轮不同串（换基座真发生）")
  // ① 各以对应核基座逐字起头（组合形态 = 收尾括号内插入 ⇒ 起头 = 基座去尾 `]` 逐字）
  assert.ok(digest.startsWith(AUTO_TURN_DIGEST_DOMAIN.slice(0, -1)), "digest 轮起头 = AUTO_TURN_DIGEST_DOMAIN 逐字")
  assert.ok(ask.startsWith(UPSTREAM_TURN_DOMAIN.slice(0, -1)), "ask 轮起头 = UPSTREAM_TURN_DOMAIN 逐字")
  // ② + ③ 端 overlay 全串逐字在场；收尾 `]` 且端 overlay 在收尾括号内（四格 = 两轮 × 两模式）
  for (const c of [digest, ask, digestEng, askEng]) {
    assert.ok(c.includes(VSC_TURN_OVERLAY), "端 overlay 逐字在场（四格同规）")
    assert.ok(c.endsWith(VSC_TURN_OVERLAY + "]"), "收尾 = 端 overlay + `]`（括号形态不破）")
  }
  // ④ overlay 段逐字相同（构成差异项 = 0——轮型与模式皆非构成差异）
  const tail = (c) => c.slice(c.indexOf(VSC_TURN_OVERLAY))
  assert.equal(tail(digest), tail(ask), "overlay 段逐字相同（两轮构成差异项 = 0）")
  assert.equal(tail(digestEng), tail(digest), "overlay 段逐字相同（两模式构成差异项 = 0）")
  assert.equal(tail(digest), `${VSC_TURN_OVERLAY}]`)
})
