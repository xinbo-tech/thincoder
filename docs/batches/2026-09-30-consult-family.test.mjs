/**
 * 2026-09-30-consult-family.test.mjs — 批次本地单元件（台账 #748 · consult 同族对齐批 · 实施轮）。
 * 任务书 = `docs/batches/2026-09-30-consult-family.md` §2 最新块（修复轮 1 全号 + 修复轮 2 #1–#4；
 * 「凡与本块抵触者以本块为准」）。
 * 腿族（断言粒度 = 行为面：事件序列 ∥ 归约态 ∥ 序位 ∥ 落位——不做源码散文锚）：
 *   腿 A（核发射器）：per-child settle ⇒ `⟦ev⟧settled`（非 `done`）；会话 stopped ⇒ `⟦ev⟧stopped`；
 *     会话条目随 settle 携 `childIds`（无块子块不入表）；
 *   腿 B（桌面渲染）：子块 `settled` ⇒ 驻留 awaitingDigest（不冻结、零入流）；回收 `done` ⇒ 归档入流
 *     （随到达入流 = 当刻流末——#765 尾追形）∥ 重复 `done` 幂等零增；
 *   腿 C（桌面驱动展开）：`reemitDone` 三路径（起跑支 ∥ `reclaim` ∥ `freezeAll`）按 `childIds` 逐子块
 *     补发 `ev:subagent done`；会话本体 id 零补发；
 *   腿 D（CLI）：reclaim consumed 展开（会话在跑 ⇒ 不冻——settle 锚位 splice）+ 起跑窗起跑刻冻结
 *     （主面——`digestTurn` 真驱）+ panel 判读同判据（门控 ∥ `digested` 注记）；
 *   腿 E（VSC）：起跑窗 ∥ `reclaimDigestedBlocks` 两径 `childIds` 逐子块补发；会话本体零发；
 *   负控：「settle 即 `done`」旧形先红（同判据必红 + 旧形 token 经真 TUI 路由复现冻结/夹流症状）
 *     ⇒ 新形复绿（驻留零冻结）。
 * 随批留存 · 不进仓套件（全清令：仓套件不写 ∕ 不改 ∕ 不跑）。
 * 复跑（cwd = 仓库根，即含 `thincoder-core/` 的目录）：node --test docs/batches/2026-09-30-consult-family.test.mjs
 * 纪律：行为断言优先（真发射器 ∥ 真归约体 ∥ 真驱动装配 ∥ 真起跑窗 digestTurn）；真机一条（任一可用端
 * 真跑一轮 consult——子卡驻留至消化、回收点归档入流、运行中回合零夹流）= 父侧闭合义务——本档只落机检面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/agent-tools/consult.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
await import(pathToFileURL(resolve(ROOT, "thincoder-desktop/test/rc-resolve.mjs")).href) // `/rc/` 解析钩子（先于渲染面取件）

const [consult, tuiFreeze, tuiBlocks, cliDrive, panel, desktopDrive, desktopReduce, vscSusp, i18n, conversation, lifecycle] = await Promise.all([
  mod("thincoder-core/agent-tools/consult.mjs"), // 腿 A：核发射器（settleChild 最小导出接桩）
  mod("thincoder-cli/src/tui/subagent-freeze.mjs"), // 腿 D：freezeReclaimDigestedBlocks（consumed 形参）
  mod("thincoder-cli/src/tui/subagent-blocks.mjs"), // 腿 D/负控：真 TUI token 路由（routeSubToken）
  mod("thincoder-cli/src/tui/suspension-drive.mjs"), // 腿 D：digestTurn 真驱（起跑窗主面）
  mod("thincoder-core/agent-tools/subagent-panel.mjs"), // 腿 D：panelFreezeGate ∥ digested 注记
  mod("thincoder-desktop/src/main/suspension-drive.mjs"), // 腿 C：reemitDone 三路径（真驱动装配）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 腿 B：子 agent 归约径（真归约体）
  mod("thincoder-vscode/src/extension/suspension.mjs"), // 腿 E：起跑窗 ∥ reclaimDigestedBlocks
  mod("thincoder-core/i18n.mjs"), // 腿 D：痕行文案单源（起跑两行断言）
  mod("thincoder-cli/src/tui/conversation-writer.mjs"), // 腿 D：真写入面（pushLine）
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // 腿 D：记录形单源（recordCarrier）
])

const KEY = "1"
const until = async (fn, ms = 4000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > ms) throw new Error("until timeout")
    await new Promise((r) => setTimeout(r, 5))
  }
  return true
}
/** 腿 A 判据单源（负控复用）：token ⇒ 期望事件字面；旧形 `⟦ev⟧done` 命中 ⇒ 断言失败（先红）。 */
const assertSettleToken = (token, prefix, kind) => {
  assert.equal(token, `${prefix}⟦ev⟧${kind}\x1e0\x1e0\x1e${kind}\x1e`)
  assert.equal(String(token).includes("⟦ev⟧done"), false, "非旧形（settle 即 done）")
}

// ─── 腿 A：核发射器（settleChild 直调桩——会话桩 + 捕获 onToken；零真实模型 ∥ 零网络）──────────

test("腿 A·核发射器：per-child settle ⇒ ⟦ev⟧settled（非 done）；stopped ⇒ ⟦ev⟧stopped；条目携 childIds", () => {
  // A1 会话进行中：两子块各自 settle ⇒ 两发 settled；条目不落（pending > 0）
  const toks = []
  const agent = { _consultSessions: new Map() }
  const session = { id: "7", replies: [], childIds: ["3", "4"], pending: 2, failed: 0, terminated: 0, stopped: false, received: 0, total: 2 }
  agent._consultSessions.set("7", session)
  consult.settleChild(agent, session, "7", "prov:m1", true, "应答一", "consult#3/", (t) => toks.push(t))
  assert.equal(toks.length, 1, "settle 面恰一发（无块子块零发射）")
  assertSettleToken(toks[0], "consult#3/", "settled")
  assert.equal(agent._pendingAsyncResults, undefined, "会话未结（pending 1）——条目零落")
  consult.settleChild(agent, session, "7", "prov:m2", false, "超时", "consult#4/", (t) => toks.push(t))
  assertSettleToken(toks[1], "consult#4/", "settled")
  assert.equal(agent._consultSessions.has("7"), false, "会话结——出会话池")
  const entry = agent._pendingAsyncResults?.[0]
  assert.equal(entry?.role, "consult")
  assert.deepEqual(entry.childIds, ["3", "4"], "会话条目随 settle 携 childIds 表（= 子块 relay 号）")
  assert.notEqual(entry.childIds, session.childIds, "表 = 拷贝（会话对象后续零触）")
  // A2 取消径：会话 stopped ⇒ ⟦ev⟧stopped 即折；会话条目零落（消费永不来）
  const toks2 = []
  const agent2 = { _consultSessions: new Map() }
  const s2 = { id: "8", replies: [], childIds: ["5"], pending: 1, failed: 0, terminated: 0, stopped: true, received: 0, total: 1 }
  agent2._consultSessions.set("8", s2)
  consult.settleChild(agent2, s2, "8", "prov:m1", false, "会话已取消", "consult#5/", (t) => toks2.push(t))
  assertSettleToken(toks2[0], "consult#5/", "stopped")
  assert.equal(agent2._pendingAsyncResults ?? null, null, "取消会话零条目（无 digest）")
  assert.equal(agent2._consultSessions.has("8"), false, "取消会话随 settle 出池")
  // A3 无块子块（relayPrefix 缺省——spawn 前失败）：零发射 + 不入表
  const toks3 = []
  const agent3 = { _consultSessions: new Map() }
  const s3 = { id: "9", replies: [], childIds: [], pending: 1, failed: 0, terminated: 0, stopped: false, received: 0, total: 1 }
  agent3._consultSessions.set("9", s3)
  consult.settleChild(agent3, s3, "9", "prov:m1", false, "无 key", null, (t) => toks3.push(t))
  assert.equal(toks3.length, 0, "无块子块零发射（从未开块）")
  assert.deepEqual(agent3._pendingAsyncResults?.[0]?.childIds, [], "无块子块不入表（表空）")
})

// ─── 腿 B：桌面渲染（真归约体——settled 驻留 ∥ done 归档入流）───────────────────────────

test("腿 B·桌面渲染：子块 settled ⇒ 驻留 awaitingDigest（零入流）；回收 done ⇒ 归档入流（到达序尾追）", () => {
  const base = (over = {}) => ({ activeSession: KEY, blocks: [{ kind: "assistant", text: "前" }], digest: {}, subBlocks: {}, pool: { running: 0, approval: 0, queue: [], approvals: [] }, following: true, pendingNew: 0, history: {}, project: { cwd: "/p" }, ...over })
  let st = base()
  st = desktopReduce.onSubagent(st, { key: KEY, role: "consult", id: "3", status: "started", pool: true }, 0)
  assert.equal(st.subBlocks[KEY][0].key, "sub:consult#3", "consult 子块出生（键形 sub:consult#<N>）")
  const before = st.blocks.length
  st = desktopReduce.onSubagent(st, { key: KEY, role: "consult", id: "3", status: "settled" }, 0)
  assert.equal(st.subBlocks[KEY][0].frozen, true, "settled ⇒ 折叠定格")
  assert.equal(st.subBlocks[KEY][0].awaitingDigest, true, "驻留「done · awaiting digestion」（等待消化）")
  assert.equal(st.blocks.length, before, "settle 面零入流（不冻结——零夹流）")
  st = { ...st, blocks: [...st.blocks, { kind: "assistant", text: "回合中" }] } // 到达序后产块
  st = desktopReduce.onSubagent(st, { key: KEY, role: "consult", id: "3", status: "done" }, 0)
  assert.equal(st.blocks.length, 3, "回收 done ⇒ 归档恰一枚入流")
  assert.equal(st.blocks[2].kind, "subagent", "归档块 = 到达序尾追（当刻流末）")
  assert.equal(st.blocks[2].meta.key, "sub:consult#3", "归档块身份 = consult 子块（#748 展开载荷）")
  assert.equal(st.subBlocks[KEY][0].region, "flow", "池内退场（墓碑 region:flow）")
  const again = desktopReduce.onSubagent(st, { key: KEY, role: "consult", id: "3", status: "done" }, 0)
  assert.equal(again.blocks.length, 3, "重复 done（兜底幂等面）⇒ 零新块")
})

// ─── 腿 C：桌面驱动展开（reemitDone 三路径同件）─────────────────────────────────────

test("腿 C·桌面驱动展开：起跑 ∥ reclaim ∥ freezeAll 三路径按 childIds 逐子块补发；本体零发", async () => {
  const childDone = (log) => log.filter((r) => r.type === "post" && r.ch === "ev:subagent" && r.payload?.status === "done")
  const mkAgent = (pending) => ({
    title: "t", cwd: null,
    _asyncSubagents: new Map([["s1", { status: "running" }]]),
    _asyncAdvisors: new Map(), _consultSessions: new Map(),
    _pendingAsyncResults: pending,
    provider: { name: "vis", model: "m" }, config: { locale: "zh" }, memory: { db: null },
    history: [], _fullHistory: [],
  })
  const consultEntry = { role: "consult", id: "7", childIds: ["3", "4"] }
  const otherEntry = { role: "explore", id: 1 }
  const log = []
  const agent = mkAgent([consultEntry, otherEntry])
  const drive = desktopDrive.createSuspensionDrive({
    post: (ch, payload) => log.push({ type: "post", ch, payload }),
    runTurn: (key, agent1) => { log.push({ type: "run" }); agent1._pendingAsyncResults.splice(0); return Promise.resolve() },
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive.start(KEY, agent, { cwd: "/p" }), true, "池活 ⇒ 入窗")
  await until(() => childDone(log).length >= 6) // 起跑窗三发 + reclaim 三发
  const runAt = log.findIndex((r) => r.type === "run")
  const startAt = log.findIndex((r) => r.type === "post" && r.ch === "ev:digest" && r.payload.status === "start")
  const posts = childDone(log)
  const shape = (rows) => rows.map((r) => [r.payload.role, r.payload.id])
  assert.deepEqual(shape(posts.slice(0, 3)), [["consult", "3"], ["consult", "4"], ["explore", 1]], "起跑窗逐子块展开（childIds 顺序——本体 id 零发）+ 非 consult 照发")
  assert.ok(startAt >= 0 && log.indexOf(posts[0]) > startAt, "起跑帧先于补发（主面：起跑窗）")
  assert.ok(log.indexOf(posts[2]) < runAt, "起跑窗补发先于回合执行")
  assert.deepEqual(shape(posts.slice(3, 6)), [["consult", "3"], ["consult", "4"], ["explore", 1]], "reclaim 同形逐条（兜底幂等）")
  assert.ok(log.indexOf(posts[3]) > runAt, "reclaim 后于回合执行（消费完成点）")
  assert.ok(posts.every((r) => !(r.payload.role === "consult" && r.payload.id === "7")), "会话本体 id 零补发（无渲染行）")
  drive.abort(KEY) // 收窗（防悬挂 waiter）
  // freezeAll 径（abort——中止前快照）：条目仍在 pending ⇒ consult 展开随冻结面补发
  const log2 = []
  const agent2 = mkAgent([{ role: "consult", id: "9", childIds: ["5"] }])
  let release = null
  const gate = new Promise((res) => { release = res })
  const drive2 = desktopDrive.createSuspensionDrive({
    post: (ch, payload) => log2.push({ type: "post", ch, payload }),
    runTurn: () => gate.then(() => {}),
    timer: () => ({ unref() {} }), clear: () => {},
  })
  assert.equal(drive2.start(KEY, agent2, { cwd: "/p" }), true, "入窗")
  await until(() => log2.some((r) => r.ch === "ev:subagent")) // 起跑窗已发（门控前）
  log2.length = 0 // 清场——只观 freezeAll 径
  assert.equal(drive2.abort(KEY), true, "中止（冻结快照 = 中止前留档）")
  release() // 回合执行收束 ⇒ 中止清场 ⇒ freezeAll
  await until(() => log2.some((r) => r.ch === "ev:subagent" && r.payload?.status === "done"))
  assert.deepEqual(shape(childDone(log2)), [["consult", "5"]], "freezeAll 径逐子块补发（childIds 展开）")
  assert.ok(childDone(log2).every((r) => !(r.payload.role === "consult" && r.payload.id === "9")), "本体零发（同一判据）")
})

// ─── 腿 D：CLI（reclaim consumed 展开 ∥ 起跑窗起跑刻冻结 ∥ panel 判读同判据）────────────────

const subOf = (key, over = {}) => ({
  key, role: key.split("#")[0], model: "m", started: 1, done: true, doneAt: 2, turn: 0, maxTurns: 0,
  stopped: false, lastError: null, dropped: 0, blocks: [{ kind: "text", text: key }], children: [],
  awaitingDigest: true, _freezeAt: 0, ...over,
})
/** 伪存储（沿 #726/#768 批内件先例——记录写缝承载）。 */
function fakeStore(entries = []) {
  const appended = []
  return {
    appended, entries,
    append(r) { appended.push(r); return true },
    firstUserMessage: () => null, total: () => entries.length,
    *iterate(direction = "newest") { for (const m of (direction === "oldest" ? entries : [...entries].reverse())) yield m },
    page(start, end, { margin = 1 } = {}) { const lo = Math.max(0, start - margin); const hi = Math.min(entries.length, end + margin); return { messages: entries.slice(lo, hi), base: lo } },
  }
}
/** TUI state 最小形（写入 ∥ 恢复面所需字段——真装配面字段子集）。 */
function tuiState() {
  return {
    lines: [], _linesChars: 0, _lineIdCounter: 0, _historyLoaded: 0, _historyTotal: 0, _hasOlder: false, scroll: 0,
    processing: false, status: "Ready", exitArmed: false, streaming: "", reasoning: "",
    _advisorBlocks: [], currentTool: null, processingStarted: 0, lastOutputAt: 0,
    _turnControllers: [], controller: null, interruptPrompt: null, attentionAwaiting: false,
    subTasks: {}, tasks: [], queue: [], pendingInput: [],
    suspended: false, _suspPending: false, _suspAborted: false,
    foldEnabled: true, expandedBlocks: new Set(), _foldScroll: new Map(),
    dims: { get: () => ({ cols: 80, rows: 24 }) },
    _agent: null,
  }
}
function fakeAgent(over = {}) {
  const store = over._recordStore === undefined ? fakeStore() : over._recordStore
  return {
    cwd: "C:/fake", title: "t", autoApprove: true,
    history: [], _fullHistory: [], _historyWindow: 0,
    _recordStore: store,
    _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    _pendingDistill: null, _sessionAbort: null, _sessionAbortAll: null,
    ...over,
  }
}
/** 回合 ctx 最小形（`digestTurn` 直驱——真 conversation-writer 写入面）。 */
function turnFixture({ agent = fakeAgent(), state = tuiState(), runAgent = async () => {} } = {}) {
  const render = () => {}
  const writer = conversation.createConversationWriter({ state, render })
  const ctx = {
    agent, state, render, scheduleRender: render,
    pushLine: writer.pushLine, pushLabel: writer.pushLabel, ensureAssistantLabel: writer.ensureAssistantLabel,
    handleSlash: async () => {}, saveSession: () => {}, runAgent, distillFlushTimeoutMs: 1,
    askPermission: null, askBatchPermission: null, askQuestion: null,
  }
  return { ctx, agent, state }
}

test("腿 D1·CLI 回收点：freezeReclaimDigestedBlocks 收 consumed 实参 + childIds 展开（会话在跑 ⇒ 不冻）", () => {
  const lines0 = Array.from({ length: 8 }, (_, i) => ({ text: `L${i}`, color: "", _budgetChars: 0 }))
  const state = { lines: [...lines0], _linesChars: 0, subTasks: {
    "consult#3": subOf("consult#3", { _freezeAt: 1 }),
    "consult#4": subOf("consult#4", { _freezeAt: 2 }),
    "consult#9": subOf("consult#9", { _freezeAt: 3 }), // 会话 9 在跑（未入 consumed）⇒ 不冻
    "eng-coder#2": subOf("eng-coder#2", { _freezeAt: 4 }),
    "eng-coder#5": subOf("eng-coder#5", { awaitingDigest: false }), // 运行中 ⇒ 不冻
  } }
  const n = tuiFreeze.freezeReclaimDigestedBlocks(state, [
    { role: "consult", id: "7", childIds: ["3", "4"] },
    { role: "eng-coder", id: 2 },
  ])
  assert.equal(n, 3, "恰三枚冻结（consult#3 ∥ consult#4 ∥ eng-coder#2——consumed 驱动）")
  assert.equal(state.subTasks["consult#9"] !== undefined, true, "会话在跑（未消费）⇒ 不冻（留驻待其消费窗）")
  assert.equal(state.subTasks["eng-coder#5"] !== undefined, true, "非 awaitingDigest ⇒ 不冻")
  const frozen = state.lines.filter((l) => l._frozenSubTask)
  assert.deepEqual(frozen.map((l) => l._frozenSubTask.key), ["consult#3", "consult#4", "eng-coder#2"], "冻结块按 settle 锚位落流（_freezeAt 1 ∥ 2 ∥ 4——降序 splice 绝对位互不位移）")
  assert.deepEqual(state.lines.map((l) => l._frozenSubTask?.key ?? l.text), ["L0", "consult#3", "L1", "consult#4", "L2", "L3", "eng-coder#2", "L4", "L5", "L6", "L7"], "落位 = 各 settle 锚点（splice 绝对位）")
  assert.equal(state.lines.length, 11, "载体行入流恰 3（8 + 3）")
})

test("腿 D2·CLI 起跑窗（主面）：起跑快照按 childIds 展开 ⇒ 起跑刻逐子块冻结入流（族后落位）", async () => {
  const { ctx, agent, state } = turnFixture()
  agent._pendingAsyncResults = [{ role: "consult", id: "7", childIds: ["3", "4"] }, { role: "explore", id: 1 }]
  state.subTasks = {
    "consult#3": subOf("consult#3"), "consult#4": subOf("consult#4"), "explore#1": subOf("explore#1"),
    "consult#8": subOf("consult#8"), // 未消费会话之子块 ⇒ 留驻（不误冻）
  }
  let during = null
  ctx.runAgent = async () => { during = state.lines.map((l) => l?._frozenSubTask?.key ?? null) }
  await cliDrive.digestTurn(ctx, false)
  const frozenKeys = state.lines.filter((l) => l._frozenSubTask).map((l) => l._frozenSubTask.key)
  assert.deepEqual(frozenKeys, ["consult#3", "consult#4", "explore#1"], "起跑刻逐子块冻结（childIds 顺序；会话本体零行）")
  assert.deepEqual(during, [null, null, "consult#3", "consult#4", "explore#1"], "冻结先于回合执行（起跑刻）——落位 = 起跑行族之后（显式锚）")
  assert.equal(state.subTasks["consult#8"] !== undefined, true, "未消费会话之子块留驻（不误冻）")
  assert.equal(state.lines.some((l) => l._frozenSubTask?.key === "consult#7"), false, "会话本体零冻结行")
})

test("腿 D3·CLI panel 判读同判据：会话在跑 ∥ 会话条目在 pending ⇒ 门控拒 ∥ digested:false；已消化 ⇒ 放行", () => {
  const emitted = []
  const mkCtx = ({ sessions = [], pending = [] } = {}) => ({
    agent: {
      _consultSessions: new Map(sessions.map((s) => [String(s.id), s])),
      _pendingAsyncResults: pending, _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    },
    state: { subTasks: {
      "consult#3": { key: "consult#3", role: "consult", done: true, awaitingDigest: true, started: 1 },
      "eng-coder#2": { key: "eng-coder#2", role: "eng-coder", done: true, awaitingDigest: true, started: 1 },
    } },
    callbacks: { onToken: (t) => emitted.push(t) },
    depth: 0,
  })
  // 会话在跑 ⇒ 拒（同判据：会话在跑 ∥ 会话条目在 pending ⇒ 未消化）
  let gate = JSON.parse(panel.executePanelAction({ freeze: "consult#3" }, mkCtx({ sessions: [{ id: "7", stopped: false, childIds: ["3"], pending: 1 }] })))
  assert.equal(gate.status, "error", "会话在跑 ⇒ 门控拒")
  assert.match(gate.error, /consultation/, "拒文含家族语义（模型可解释）")
  assert.equal(emitted.length, 0, "拒 ⇒ 零 token（未冻）")
  // 会话条目在 pending ⇒ 拒
  gate = JSON.parse(panel.executePanelAction({ freeze: "consult#3" }, mkCtx({ pending: [{ role: "consult", id: "7", childIds: ["3"], done: true }] })))
  assert.equal(gate.status, "error", "会话条目在 pending ⇒ 门控拒")
  // 已消化（会话已结 ∧ 条目已消费）⇒ 放行 + 冻结 token
  gate = JSON.parse(panel.executePanelAction({ freeze: "consult#3" }, mkCtx({})))
  assert.equal(gate.status, "frozen", "已消化 ⇒ 放行（digested-stuck 块可手冻）")
  assert.equal(emitted[0], "consult#3/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", "门控过 ⇒ done 冻结事件（settle 同机制字面）")
  // 非 consult 块判据不变（回归面）
  gate = JSON.parse(panel.executePanelAction({ freeze: "eng-coder#2" }, mkCtx({})))
  assert.equal(gate.status, "frozen", "非 consult 块零回归（裸键比对照旧）")
  // digested 注记三态（读时交叉）
  const view = JSON.parse(panel.executePanelAction({}, mkCtx({ sessions: [{ id: "7", stopped: false, childIds: ["3"], pending: 1 }] })))
  assert.equal(view.panel.find((b) => b.key === "consult#3").digested, false, "会话在跑 ⇒ digested:false（未消化）")
  const view2 = JSON.parse(panel.executePanelAction({}, mkCtx({})))
  assert.equal(view2.panel.find((b) => b.key === "consult#3").digested, true, "已消化 ⇒ digested:true（freeze 候选——模型可定位异常块）")
})

// ─── 腿 E：VSC（起跑窗 ∥ reclaimDigestedBlocks 两径——真 suspensionSession 装配）────────────

test("腿 E·VSC：两径 childIds 逐子块补发（起跑窗 + reclaim 兜底）；会话本体零发", async () => {
  const posts = []
  const history = {
    _asyncSubagents: new Map([["s1", { status: "running" }]]),
    _consultSessions: new Map(),
    _pendingAsyncResults: [{ role: "consult", id: "7", childIds: ["3", "4"] }, { role: "subagent", id: 9 }],
  }
  const panel = {
    _panel: { webview: { postMessage: (m) => posts.push(m) } },
    _publishTurnState: () => {},
    _refreshStatus: () => {},
    _abortController: new AbortController(),
    _turnControllers: [],
    _agent: { config: {}, _pendingTimers: [] },
    _saveLines: () => {},
  }
  const entry = {
    turnSlot: {}, distillSlot: {},
    lines: { history, fullHistory: [] },
    runTurn: async () => { atRun = posts.length; history._pendingAsyncResults.splice(0) }, // 注入器消费（记录回合起跑刻面）
  }
  let atRun = null
  const session = vscSusp.suspensionSession(panel, entry)
  await until(() => posts.filter((m) => m.type === "subagent" && m.status === "done").length >= 6) // 起跑三发 + reclaim 三发
  const donePosts = posts.filter((m) => m.type === "subagent" && m.status === "done")
  const shape = (rows) => rows.map((m) => [m.role, m.id])
  const startAt = posts.findIndex((m) => m.type === "digest" && m.status === "start")
  const endAt = posts.findIndex((m) => m.type === "digest" && m.status === "end")
  assert.ok(startAt >= 0 && endAt > startAt, "digest 起止帧在场（真 driveTurn 边界）")
  assert.deepEqual(shape(donePosts.slice(0, 3)), [["consult", "3"], ["consult", "4"], ["subagent", 9]], "起跑窗（主面）逐子块补发 + 本体条目照发")
  assert.ok(atRun !== null && posts.slice(0, atRun).filter((m) => m.type === "subagent" && m.status === "done").length === 3, "起跑窗三发先于回合执行（起跑刻展开——主面）")
  assert.ok(posts.indexOf(donePosts[0]) > startAt && posts.indexOf(donePosts[2]) < endAt, "起跑窗补发居起止帧之间")
  assert.deepEqual(shape(donePosts.slice(3, 6)), [["consult", "3"], ["consult", "4"], ["subagent", 9]], "reclaimDigestedBlocks（兜底）同形逐条")
  assert.ok(posts.indexOf(donePosts[3]) > endAt, "reclaim 补发后于回合收尾（消费完成点）")
  assert.ok(donePosts.every((m) => !(m.role === "consult" && m.id === "7")), "会话本体 id 零补发（无 webview 行）")
  panel._abortController.abort() // 收窗（防悬挂 waiter）
  await session
})

// ─── 负控：settle 面零冻结 ∥ 零夹流（旧形先红 ⇒ 新形复绿）─────────────────────────────

test("负控·settle 面零冻结 ∥ 零夹流：新形复绿（真发射经真 TUI 路由 ⇒ 驻留零冻结）；旧形先红（同判据）", () => {
  // 新形：真核发射 token 直入真 TUI 路由 ⇒ 块驻留、零入流（settle 面零冻结——零夹流）
  const toks = []
  const session = { id: "7", replies: [], childIds: ["3"], pending: 1, failed: 0, terminated: 0, stopped: false, received: 0, total: 1 }
  consult.settleChild({}, session, "7", "prov:m", true, "应答", "consult#3/", (t) => toks.push(t))
  assertSettleToken(toks[0], "consult#3/", "settled")
  const state = { subTasks: {}, lines: [], _linesChars: 0 }
  assert.equal(tuiBlocks.routeSubToken(state, toks[0], () => {}), true, "真 TUI 路由消费")
  assert.equal(state.subTasks["consult#3"]?.awaitingDigest, true, "驻留「done · awaiting digestion」")
  assert.equal(state.subTasks["consult#3"]?.done, true, "块头已结算（done）")
  assert.equal(state.lines.length, 0, "settle 面零冻结（块不入流——运行中回合零夹流）")
  // 旧形（settle 即 done——本批要消的旧形）：同一路由 ⇒ 即冻入流（先红实景）
  const oldState = { subTasks: {}, lines: [], _linesChars: 0 }
  tuiBlocks.routeSubToken(oldState, "consult#3/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", () => {})
  assert.equal(oldState.lines.length, 1, "旧形先红：settle 刻即冻结入流（夹流症状复现）")
  assert.equal(oldState.subTasks["consult#3"], undefined, "旧形：块即时出 subTasks（无驻留面）")
  // 先红可复现（同一判据）：旧形 token 过腿 A 判据 ⇒ 必拒
  let red = false
  try { assertSettleToken("consult#3/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", "consult#3/", "settled") } catch { red = true }
  assert.equal(red, true, "旧形过同一判据被拒（先红可复现——产品形翻转即红）")
})
