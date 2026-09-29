/**
 * 2026-09-28-tech-debt-closeout-r8.test.mjs — 批次本地单测件（轮 8 · 处置 ∕ 实证族 · 8 条 · eng-coder #33）。
 * 运行（仓根）：node --test docs/batches/2026-09-28-tech-debt-closeout-r8.test.mjs
 * （本刻暂存 `.thincoder/tmp/2026-09-28-tech-debt-closeout-r8.test.mjs` 同名件——两层深 ⇒ 相对 import
 *  与终位一致；父侧 copy 至终位即运行命令同一）
 * 覆盖四条行为面（#251 ∕ #255 ∕ #298 ∕ #356 ∕ #451 = 登记 ∕ 取证面，无行为臂——见 §5）：
 *   #429 取批面放行（slash 不滞留 ∕ 不堵队——两取批面；复现读 + 判据置换对照）；
 *   #448① 模态期不点火 + 关闭后补评估；#448② 异常径重武装（会话停 ∕ 显式撤销三腿负控）；
 *   #515① 切项目级联清装配（陈旧回合不洗白 ∕ 装配表清点）+ ② 跨中止不起跑（两臂）+
 *   ③ 空闲闩陈旧点火不投递（中止后交付闸）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"

// ─── 测试隔离（台账 #601 修复）：家目录重定向到临时目录。
// 依据：本档夹具会驱动真实会话写面；`config-io.mjs` 的 `configDir` 于模组装载期取值
// （`join(homedir(), ".thincoder")`），Windows 上 `os.homedir()` 读 `USERPROFILE`
// ⇒ 必须在一切（动态）import 之前覆盖，HOME 与 USERPROFILE 双写。
const _tmpHome = mkdtempSync(join(tmpdir(), "tc-r8-home-"))
process.env.HOME = _tmpHome
process.env.USERPROFILE = _tmpHome

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..") // 仓根（.thincoder/tmp 两层深）
const vsc = (rel) => pathToFileURL(join(root, "thincoder-vscode/src/extension", rel)).href
const cli = (rel) => pathToFileURL(join(root, "thincoder-cli/src/tui", rel)).href
const dsk = (rel) => pathToFileURL(join(root, "thincoder-desktop/src/main", rel)).href

/** `vscode` 桩（VSC 扩展面模块装载 —— queued-pickup → panel-messages 链；只供装载，行为面零触）。 */
const VSCODE_STUB = `
export const workspace = { workspaceFolders: [], workspaceFile: undefined, getConfiguration: () => ({ get: () => undefined, update: async () => {} }) }
export const window = { showWarningMessage: async () => undefined, showErrorMessage: async () => undefined, showInformationMessage: async () => undefined, createStatusBarItem: () => ({ show() {}, hide() {}, dispose() {}, tooltip: null, backgroundColor: null, command: null, text: "" }) }
export const commands = { executeCommand: async () => undefined, registerCommand: () => ({ dispose() {} }) }
export const Uri = { file: (p) => ({ fsPath: p, toString: () => String(p) }), parse: (p) => ({ fsPath: String(p), toString: () => String(p) }) }
export class MarkdownString { constructor(v) { this.value = v } }
export class ThemeColor { constructor(id) { this.id = id } }
export class ThemeIcon { constructor(id) { this.id = id } }
export class Disposable { dispose() {} }
export class EventEmitter { constructor() { this.event = () => ({ dispose() {} }); this.fire = () => {} } }
export const StatusBarAlignment = { Left: 1, Right: 2 }
export const ViewColumn = { One: 1 }
export const env = { openExternal: async () => undefined }
export const extensions = { getExtension: () => null }
export const languages = { createDiagnosticCollection: () => ({ set() {}, clear() {}, dispose() {} }) }
`
const VSCODE_STUB_URL = "data:text/javascript," + encodeURIComponent(VSCODE_STUB)
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "vscode") return { url: VSCODE_STUB_URL, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

const tick = () => new Promise((r) => setImmediate(r))

// ─── #429 · VSC 取批面放行（slash 不滞留）────────────────────────────────────

test("#429: 复现读 + 判据置换——分类面仍判 slash（对拍面零改）· 旧 `kind===\"turn\"` 判据本会零消费", async () => {
  const { planQueuedInput, consumableAction } = await import(vsc("queued-merge.mjs"))
  const plan = planQueuedInput(["/model", "hello"])
  // 复现读（前置条件已达）：slash 分支分类在盘——取批面旧判据（仅 turn）对之首动作零消费 ⇒ 堵队首。
  assert.equal(plan[0].kind, "slash")
  assert.equal(plan[0].count, 1)
  const legacyTakeable = (a) => a?.kind === "turn" // 旧判据逐字（对照——判据置换即修复面）
  assert.equal(legacyTakeable(plan[0]), false)
  // 修复读：本端无斜杠面 ⇒ slash 同判可消费（单条 · 保序 · 不合并）。
  assert.equal(consumableAction(plan[0]), true)
  assert.equal(consumableAction({ kind: "turn", count: 1 }), true)
  assert.equal(consumableAction(null), false)
})

test("#429: 载具取项面——slash 单条直达、后续条目随之可达（不滞留 ∕ 不堵队）", async () => {
  const { takeQueuedBatchItem } = await import(vsc("queued-pickup.mjs"))
  const queue = [{ text: "/model" }, { text: "hello" }]
  const first = takeQueuedBatchItem(queue)
  assert.equal(first.merged, "/model") // 原文直发（单条合并文本 = 原文）
  assert.equal(first.item?.text, "/model")
  assert.deepEqual(queue.map((q) => q.text), ["hello"]) // slash 消费后，后条目不再被堵
  const second = takeQueuedBatchItem(queue)
  assert.equal(second.merged, "hello")
  assert.equal(queue.length, 0)
})

test("#429: 步边界取批同判——slash 单条消费（pushReal 双线 + 快照推送 + 零残留）", async () => {
  const { pickupQueuedAtStepBoundary } = await import(vsc("queued-pickup.mjs"))
  const panel = { _busyQueued: [{ text: "/model" }, { text: "next" }] }
  const history = []
  const fullHistory = []
  pickupQueuedAtStepBoundary(panel, { history, fullHistory })
  assert.deepEqual(panel._busyQueued.map((q) => q.text), ["next"])
  assert.equal(history.at(-1)?.content, "/model") // 下一步生效（非中断通道）
  assert.equal(fullHistory.at(-1)?.content, "/model")
})

// ─── #448① · 模态期抑制 + 关闭后补评估 ──────────────────────────────────────

test("#448①: 模态期不点火（零开轮 ∕ 零送达 ∕ 在途零触碰）+ 关闭后补评估（重武装 ⇒ 即达）", async () => {
  const { fireTimerWake, createTimerWatch, modalOpen } = await import(cli("timer-watch.mjs"))
  const now = Date.now()
  const agent = {
    config: { agent: {} },
    history: [],
    _pendingTimers: [{ expiresAt: now - 5, message: "due" }],
  }
  const lines = []
  const state = { picker: { title: "Choose" }, processing: false }
  const ctx = { agent, state, pushLine: (t) => lines.push(t) }
  let turns = 0
  const runTurn = async () => { turns += 1 }

  // 抑制臂：模态在场 ⇒ 零开轮 ∕ 零送达（零落流）∕ 在途到期件保持（未出列）
  assert.equal(modalOpen(state), true)
  assert.equal(await fireTimerWake(ctx, { runTurn }), false)
  assert.equal(turns, 0)
  assert.equal(lines.length, 0)
  assert.equal(agent.history.length, 0)
  assert.equal(agent._pendingTimers.length, 1)

  // 补评估臂：模态退场 ⇒ 重武装（假时钟注入——到点回调即达：交付 + 开轮）
  const captured = []
  const watch = createTimerWatch({
    agent,
    onFire: () => { void fireTimerWake(ctx, { runTurn }) },
    timer: (fn, delay) => { captured.push({ fn, delay }); return { unref() {} } },
    clear: () => {},
  })
  state.picker = null
  assert.equal(watch.sync(), 0) // 到期时点已过 ⇒ 0ms 延迟（即达）
  assert.equal(captured.length, 1)
  captured[0].fn()
  await tick()
  assert.equal(turns, 1) // 补评估后开轮恰一次
  assert.equal(agent._pendingTimers.length, 0) // 到期件已出列（零重复投递）
  assert.equal(lines.length, 1) // 触发落流恰一行
  watch.disarm()
})

// ─── #448② · 异常径重武装（会话停 ∕ 显式撤销除外）────────────────────────────

/** 可跑通整条链的最小 ctx（假件只在注入缝：runAgent / 假 timerWatch / 空 render）。 */
function mkTurnCtx() {
  const syncs = []
  const state = { queue: [], tasks: [], lines: [] }
  const agent = { title: "T", history: [], config: { agent: {} } }
  const ctx = {
    agent, state, render: () => {}, scheduleRender: () => {}, pushLabel: () => {}, pushLine: () => {},
    ensureAssistantLabel: () => {}, askPermission: async () => true, askBatchPermission: async () => true,
    askQuestion: async () => null, handleSlash: async () => {},
    timerWatch: { sync: () => syncs.push("arm"), disarm: () => {} },
  }
  return { ctx, syncs }
}

test("#448②: 异常逃逸回合照常重武装（正控）· Ctrl+C 全停（stop）经真链不重武装 · 普通停回合照常重武装", async () => {
  const { runAgentTurn } = await import(cli("agent-turn.mjs"))
  const boom = () => { throw new Error("boom-448") }

  // 正控（异常逃逸径）：`pushLabel` 抛 ⇒ 回合链中断，仍应重武装（恰一次）
  const syncsA = []
  const ctxA = {
    agent: { history: [], config: { agent: {} } },
    state: {},
    pushLabel: boom,
    pushLine: () => {},
    timerWatch: { sync: () => syncsA.push("arm"), disarm: () => {} },
  }
  await assert.rejects(() => runAgentTurn(ctxA, "x"), /boom-448/)
  assert.equal(syncsA.length, 1)

  // 真链臂 1（显式撤销 = Ctrl+C 全停）：runAgent 抛 AbortError 前以 `{abortTrigger:"stop"}` 中止本链控制器
  const stop = mkTurnCtx()
  stop.ctx.runAgent = async () => {
    stop.ctx.state.controller.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
    const e = new Error("aborted"); e.name = "AbortError"; throw e
  }
  await runAgentTurn(stop.ctx, "x")
  assert.equal(stop.ctx.state._timerRearmRevoked, true) // 粘滞位已落（链尾闩不重武装）
  assert.equal(stop.syncs.length, 0)

  // 真链臂 2（普通停回合 = 首按 interrupt，无 message）：非「显式撤销」⇒ 照常重武装（本闸不误伤）
  const plain = mkTurnCtx()
  plain.ctx.runAgent = async () => {
    plain.ctx.state.controller.abort({ interrupt: true })
    const e = new Error("aborted"); e.name = "AbortError"; throw e
  }
  await runAgentTurn(plain.ctx, "x")
  assert.notEqual(plain.ctx.state._timerRearmRevoked, true)
  assert.equal(plain.syncs.length, 1)

  // 防御腿直驱（正文异常早退 ∕ 复位未及）：会话停 ∕ 控制器 stop ∕ 会话 abort 句柄三形 ⇒ 不重武装
  const legCase = async (statePatch, agentPatch) => {
    const c = mkTurnCtx()
    Object.assign(c.ctx.state, statePatch)
    Object.assign(c.ctx.agent, agentPatch)
    c.ctx.pushLabel = boom
    await assert.rejects(() => runAgentTurn(c.ctx, "x"), /boom-448/)
    return c.syncs.length
  }
  assert.equal(await legCase({ _suspAborted: true }, {}), 0)
  assert.equal(await legCase({ controller: { signal: { reason: { abortTrigger: "stop" } } } }, {}), 0)
  assert.equal(await legCase({}, { _sessionAbort: { signal: { aborted: true } } }), 0)
})

// ─── #515 · 桌面三则 ─────────────────────────────────────────────────────────

/** 假宿主（装配假面：假 `assemble` 逐次新建对象 + 假 `run` 可控在飞）——只走宿主真链。 */
async function makeHost({ run } = {}) {
  const { createAgentHost } = await import(dsk("agent-host.mjs"))
  const events = []
  const assembled = []
  let cwd = "/proj-A"
  const host = createAgentHost({
    emit: (ch, payload) => events.push({ ch, ...(payload ?? {}) }),
    projects: { currentCwd: () => cwd },
    assemble: async ({ cwd: c, slot, key }) => {
      const agent = {
        cwd: c, slot, key, title: "T", history: [], config: { agent: {} },
        provider: { model: "fake-model" }, _slot: slot,
      }
      assembled.push(agent)
      return agent
    },
    run: run ?? (async (agent, text) => { agent.history.push({ role: "user", content: text }) }),
  })
  return { host, events, assembled, setCwd: (v) => { cwd = v } }
}

test("#515①: 切项目级联清装配——陈旧回合不洗白（同键重发换新对象 ∕ 旧代号次不被覆写）+ 装配表清点", async () => {
  const resolvers = []
  const run = (agent, text) => new Promise((res) => { resolvers.push({ agent, text, res }) })
  const { host, assembled } = await makeHost({ run })

  await host.send("1", "turn-A") // 回合 A 起跑（在飞）
  assert.equal(assembled.length, 1)
  const agentA = assembled[0]

  host.abortSuspensions() // 切项目级联（cwd 变更径）
  assert.equal(host.agents.size, 0) // 装配表清点（#507：同槽号键不再命中旧项目 agent）

  await host.send("1", "turn-B") // 同键同槽号再发 ⇒ 重装配新对象
  assert.equal(assembled.length, 2)
  const agentB = assembled[1]
  assert.notEqual(agentB, agentA) // 级联清装配 ⇒ 陈旧尾的「代次就地覆写」面消除
  assert.equal(agentB._turnEpoch, 1) // 新回合落当代次（墓碑 +1 后）
  assert.equal(agentA._turnEpoch, 0) // 旧代号次未被新回合覆写（洗白面不存在）

  // 陈旧回合尾（A 结算 ∕ 接管）不得重注册 ∕ 不得夺杆 —— 解 A 后 B 仍在飞，事件面无复活窗
  resolvers[0].res()
  await tick()
  await tick()
  assert.equal(host.busyOf("1"), true) // 在飞仍是 B（旧尾零接管替换）

  resolvers[1].res()
  await tick()
  await tick()
  assert.equal(host.busyOf("1"), false)
})

test("#515②: 装配 await 期跨中止 ⇒ send 回 `aborted` 且零起跑（abortSuspensions ∕ dispose 两臂）", async () => {
  const { createAgentHost } = await import(dsk("agent-host.mjs"))
  const fakeAgent = () => ({ cwd: "/proj-A", title: "T", history: [], config: { agent: {} }, provider: { model: "m" } })

  // 臂 1：切项目级联（abortSuspensions）
  let release1 = null
  const runs1 = []
  const host1 = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => "/proj-A" },
    assemble: async () => new Promise((res) => { release1 = () => res(fakeAgent()) }),
    run: async (agent, text) => { runs1.push(text) },
  })
  const pending1 = host1.send("1", "x") // send 占位在飞 ⇒ 装配 await 挂起
  await tick()
  host1.abortSuspensions() // 跨中止（占位清 + 装配清）
  release1()
  assert.deepEqual(await pending1, { ok: false, reason: "aborted", started: false }) // 新 reason 码（零起跑；`started:false` = 发送忙态批 E2 四清位形）
  assert.equal(runs1.length, 0)

  // 臂 2：dispose（会话关闭径）
  let release2 = null
  const runs2 = []
  const host2 = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => "/proj-A" },
    assemble: async () => new Promise((res) => { release2 = () => res(fakeAgent()) }),
    run: async (agent, text) => { runs2.push(text) },
  })
  const pending2 = host2.send("1", "y")
  await tick()
  host2.dispose("1")
  release2()
  assert.deepEqual(await pending2, { ok: false, reason: "aborted", started: false })
  assert.equal(runs2.length, 0)

  // 正控：不中止 ⇒ 正常起跑（本闸不误伤）
  const runs3 = []
  const host3 = createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => "/proj-A" },
    assemble: async () => fakeAgent(),
    run: async (agent, text) => { runs3.push(text) },
  })
  assert.deepEqual(await host3.send("1", "z"), { ok: true })
  await tick()
  assert.deepEqual(runs3, ["z"])
})

test("#515③: 空闲闩已点火逢中止 ⇒ 陈旧点火零交付 ∕ 零开轮；未中止 ⇒ 正常交付 + 开轮", async () => {
  const { createSuspensionDrive } = await import(dsk("suspension-drive.mjs"))
  const now = Date.now()
  const mkAgent = () => ({
    config: { agent: {} },
    history: [],
    _pendingTimers: [{ expiresAt: now - 1, message: "due" }],
  })
  const mkDrive = () => {
    let fireFn = null
    const posts = []
    const runs = []
    const drive = createSuspensionDrive({
      post: (ch, payload) => posts.push({ ch, ...(payload ?? {}) }),
      runTurn: async (key, agent, text, opts) => { runs.push({ key, text, opts }) },
      timer: (fn, delay) => { fireFn = fn; return { unref() {} } },
      clear: () => {},
      now: () => now,
    })
    return { drive, posts, runs, fire: () => fireFn?.() }
  }

  // 中止臂：闩已武装（回调在队）恰逢中止 ⇒ 陈旧点火丢弃
  const aborted = mkDrive()
  const agent1 = mkAgent()
  aborted.drive.start("1", agent1, { cwd: "/x" }) // 池空 ⇒ 武装空闲闩（假时钟捕获）
  assert.equal(aborted.drive.timerLatches(), 1)
  aborted.drive.abort("1") // 恰逢中止（闩已点火——回调已在队）
  aborted.fire() // 陈旧点火到达
  await tick()
  assert.equal(aborted.runs.length, 0) // 零开轮（中止后交付闸）
  assert.equal(aborted.posts.filter((p) => p.ch === "ev:timer").length, 0) // 零交付（零落流）
  assert.equal(agent1._pendingTimers.length, 1) // 到期件在途零触碰（零静默丢）
  assert.equal(aborted.drive.timerLatches(), 0) // 闩已撤（清点）

  // 正控：未中止 ⇒ 同一点火交付 + 开轮（timer 轮三旗标）
  const live = mkDrive()
  const agent2 = mkAgent()
  live.drive.start("1", agent2, { cwd: "/x" })
  live.fire()
  await tick()
  assert.equal(live.runs.length, 1)
  assert.equal(live.runs[0].key, "1")
  assert.equal(live.runs[0].opts.autoTurn, true)
  assert.equal(live.runs[0].opts.timerTurn, true)
  assert.equal(live.posts.filter((p) => p.ch === "ev:timer").length, 1)
  assert.equal(agent2._pendingTimers.length, 0) // 出列（零重复投递）
})
