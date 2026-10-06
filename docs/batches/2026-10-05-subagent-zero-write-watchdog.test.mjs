/**
 * 2026-10-05-subagent-zero-write-watchdog.test.mjs — 零落笔看门狗批（台账 #934）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 d:/teamcode/thincoder 下）：
 *   node --test docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs
 *
 * 覆盖 = 设计档 §6.32（判据单源）用例表 U-ZW1–U-ZW8 + 验收侧两条静态/送达腿：
 *   U-ZW1 正常·越阈推送（文案逐字 / 闩置位 / 队列恰 +1 / 两角色正向）
 *   U-ZW2 边界·阈下 / 已闩（零动作）
 *   U-ZW3 边界·写后重臂（真写工具 ⇒ 再连零 50 ⇒ 第二条）
 *   U-ZW4 边界·角色门 / 无上游 / 缺字段（静默零抛）
 *   U-ZW5 集成·回合环 50+ 轮直驱（第 50 零写轮起恰 1 条 · 51 轮不重发 · #417 读数与显示逐字）
 *   U-ZW6 集成·跨段存活（streak 49 ⇒ resume 新段 ⇒ 1 零写轮越阈）
 *   U-ZW7 正常·评审越阈（钩子恰一次携 50 · 文本后归零 · 触发时点 = 第 50 轮结账后）
 *   U-ZW8 边界·评审无钩子（零行为：零推、零抛）
 *   A-ZW4 送达面·同队列同消费点（drain 合并注入）∥ 静态机检·watch 档零引唤醒面
 * 夹具 = 核侧全真件（createAgent / runTurnLoop / runAgent / advisor 环路）+ fetch 桩（SSE 字节——零网络）
 * + 真写工具（临时 cwd）——直驱法形参照在盘批件 `docs/batches/2026-10-04-core-patch-batch.test.mjs`。
 * 先红后绿（实测红读——批档 §5）：红 8 ∥ 绿 1（U-ZW8 = 零行为锁定面，批前即绿）。红态形：
 *   U-ZW1 / U-ZW2 / U-ZW4 / A-ZW4 = 单源叶缺席红（ERR_MODULE_NOT_FOUND——叶档「拟新增」）；
 *   U-ZW3 = 队列 0 ≠ 2 ∥ U-ZW5 = 队列 0 ≠ 1（同夹具 #417 读数 51 与显示面断言批前即绿——零变面）
 *   ∥ U-ZW6 = streak 49 ≠ 50 ∥ U-ZW7 = 钩子零调用 ≠ 恰一次携 50。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const CORE = await mod("thincoder-core/agent.mjs")            // createAgent / runAgent
const LOOP = await mod("thincoder-core/agent/turn-loop.mjs")  // runTurnLoop（子代理族采集点宿主）
const TOOLS = await mod("thincoder-core/tools/index.mjs")     // readTool / writeTool（真件）
const ADV = await mod("thincoder-core/advisor/loop.mjs")      // _runAdvisorToolLoop（评审族宿主）
const CHECKPOINT = await mod("thincoder-core/agent-tools/checkpoint.mjs") // #417 显示面（零变锁）
const PARENT = await mod("thincoder-core/agent-tools/parent-channel.mjs") // drainChildUpstream（消费单点）
const LOG = await mod("thincoder-core/log.mjs")

/** 单源叶（拟新增）：红态缺席 ⇒ 单元腿按「模块缺席」红；实现落地后逐条转绿。 */
const WATCH_REL = "thincoder-core/agent-tools/zero-write-watch.mjs"
const loadWatch = () => mod(WATCH_REL)

const SANDBOX = mkdtempSync(join(tmpdir(), "zw-watchdog-"))
LOG._setLogsDirForTest(join(SANDBOX, "logs")) // 推送面 logEvent（child:upstream）落盘隔离——不污染真日志
after(() => {
  LOG._resetLogsDirForTest()
  rmSync(SANDBOX, { recursive: true, force: true })
})

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const tmp = (tag) => mkdtempSync(join(tmpdir(), `zw-${tag}-`))

/* ── fetch 桩（openai chat 协议 SSE——真 provider 解析面；零网络 / 零真实等待） ────────────── */

const enc = new TextEncoder()
const sseOf = (frames) => ({
  ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }),
  body: new ReadableStream({ start(c) { c.enqueue(enc.encode(frames)); c.close() } }),
  text: async () => "", json: async () => ({}),
})
const callRound = (id, name, args) => sseOf(
  `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }] } }] })}\n\n` +
  `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
  "data: [DONE]\n\n",
)
const textRound = (t) => sseOf(
  `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: t } }] })}\n\n` +
  `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 9, completion_tokens: 4, total_tokens: 13 } })}\n\n` +
  "data: [DONE]\n\n",
)
/** fetch 桩：按脚本逐次应答（耗尽 = 显式炸——不静默空转）；返回 `{ value, calls }`（calls = 已发请求数）。 */
async function withFetch(script, fn) {
  const real = globalThis.fetch
  let qi = 0
  globalThis.fetch = async () => {
    const next = script[qi++]
    if (!next) throw new Error(`fetch stub exhausted (call #${qi})`)
    return next
  }
  try {
    const value = await fn()
    return { value, calls: qi }
  } finally { globalThis.fetch = real }
}

/* ── 回合环夹具（eng-coder 子代理形态——真 createAgent / 真工具 / 临时 cwd） ────────────────── */

function mkChild(cwd, { parent = {}, label = "eng-coder#7" } = {}) {
  const agent = CORE.createAgent({
    provider: { name: "harness", model: "harness-model", apiKey: "k", baseURL: "http://127.0.0.1:1/v1" },
    tools: [TOOLS.readTool, TOOLS.writeTool],
    config: { agent: {}, traces: { enabled: false } },
    cwd, memory: null, history: [],
  })
  agent._role = "eng-coder"
  agent._upstream = { parent, label }
  agent._engTaskAuthorized = true // spawn 期授权（生产 eng-coder 子代字段——写工具不经人工问询）
  agent._zeroWriteStreak = 0       // run-start `!resume` 复位同形（直驱夹具手工等价）
  agent._zeroWriteAlerted = false
  agent._zeroWriteTurns = 0
  agent._turnSeq = 0
  agent._turnFilesMark = agent._touchedFiles.length
  return { agent, parent }
}

const loopOpts = (over = {}) => ({
  maxTurns: 200, threshold: 100_000, toolSchemas: [],
  toolByName: new Map([["read", TOOLS.readTool], ["write", TOOLS.writeTool]]),
  systemPrompt: "watchdog fixture", depth: 1, signal: undefined, autoTurn: false, streamOutput: false,
  consumeInjected: null, consumeQueuedInput: null, callbacks: {}, distillSignal: null,
  ...over,
})

const WATCHDOG_TEXT_50 = "[zero-write watchdog] eng-coder#7: 50 consecutive rounds with no file write — take a look (subagent action:'status' for the live view)."

/* ── U-ZW1 · 正常·越阈推送（F-ZW1 / F-ZW4） ─────────────────────────────────────────── */

test("U-ZW1 越阈推送：streak 50 ⇒ 恰 +1 note（文案逐字）∧ 闩置位 ∧ 两角色正向", async () => {
  const W = await loadWatch()
  assert.equal(W.ZERO_WRITE_ALERT_ROUNDS, 50, "阈值单源 = 50")

  const parent = {}
  const child = { _role: "eng-coder", _zeroWriteStreak: 50, _zeroWriteAlerted: false, _upstream: { parent, label: "eng-coder#7" } }
  assert.equal(W.maybeZeroWriteAlert(child), true, "命中 ⇒ 返回布尔真（测试面）")
  const q = parent._childUpstream
  assert.equal(q.length, 1, "队列恰 +1")
  assert.equal(q[0].from, "eng-coder#7", "from = `_upstream.label`")
  assert.equal(q[0].kind, "note", "kind = note（零唤醒类）")
  assert.deepEqual(Object.keys(q[0]).sort(), ["from", "kind", "message", "seq", "ts"].sort(), "条目形 = 既有队列形（零新字段）")
  assert.equal(q[0].message, WATCHDOG_TEXT_50, "文案逐字（§6.32.4 定稿）")
  assert.equal(q[0].message, W.zeroWriteAlertText("eng-coder#7", 50), "文案单源 = 叶档文本函数")
  assert.equal(child._zeroWriteAlerted, true, "闩置位")

  // 第二角色正向（eng-designer 同在触面）
  const parent2 = {}
  const designer = { _role: "eng-designer", _zeroWriteStreak: 51, _zeroWriteAlerted: false, _upstream: { parent: parent2, label: "eng-designer#2" } }
  assert.equal(W.maybeZeroWriteAlert(designer), true, "eng-designer 同在触面")
  assert.equal(parent2._childUpstream[0].message, W.zeroWriteAlertText("eng-designer#2", 51), "轮数随 streak")

  // 评审族文案（逐字——单源同叶档）
  assert.equal(
    W.advisorAlertText("advisor#3", 50),
    "[zero-write watchdog] advisor#3: 50 consecutive rounds with no review output — take a look (subagent action:'status' / 'cancel').",
    "评审族文案逐字（§6.32.4 定稿）",
  )
  out("U-ZW1", `队列恰 +1 · 文案逐字 ✓ · 两角色正向 ✓`)
})

/* ── U-ZW2 · 边界·阈下 / 已闩（F-ZW3） ────────────────────────────────────────────── */

test("U-ZW2 阈下 / 已闩：streak 49 ∥ 50+闩真 ⇒ false ∧ 队列零增", async () => {
  const W = await loadWatch()
  const parent = { _childUpstream: [] }
  const mk = (over) => ({ _role: "eng-coder", _zeroWriteStreak: 50, _zeroWriteAlerted: false, _upstream: { parent, label: "eng-coder#1" }, ...over })
  assert.equal(W.maybeZeroWriteAlert(mk({ _zeroWriteStreak: 49 })), false, "阈下（49）不推")
  assert.equal(W.maybeZeroWriteAlert(mk({ _zeroWriteStreak: 50, _zeroWriteAlerted: true })), false, "已闩不重发")
  assert.equal(parent._childUpstream.length, 0, "队列零增（零动作）")
  out("U-ZW2", `49 ⇒ false · 已闩 ⇒ false · 队列 0 ✓`)
})

/* ── U-ZW3 · 边界·写后重臂（F-ZW3——真回合环 + 真写工具） ──────────────────────────── */

test("U-ZW3 写后重臂：越阈报告 ⇒ 落笔（streak 归零 + 闩清）⇒ 再连零 50 ⇒ 第二条", async () => {
  const dir = tmp("zw3")
  try {
    const { agent, parent } = mkChild(dir)
    const script = []
    for (let i = 0; i < 50; i++) script.push(callRound(`r${i}`, "read", { path: "nowhere.txt" })) // rounds 0..49 零写
    script.push(callRound("w0", "write", { path: "note.txt", content: "watchdog rearm fixture" })) // round 50 落笔
    for (let i = 0; i < 50; i++) script.push(callRound(`s${i}`, "read", { path: "note.txt" }))    // rounds 51..100 零写
    script.push(textRound("fixture done"))                                                       // round 101 收尾

    const { calls } = await withFetch(script, () => LOOP.runTurnLoop(agent, loopOpts()))
    assert.equal(calls, 102, "回合数 = 102（50 + 1 写 + 50 + 收尾）——fetch 桩未被额外打点")
    const q = parent._childUpstream ?? []
    assert.equal(q.length, 2, "两条 note（每连续零写段恰一条）")
    assert.equal(q[0].message, WATCHDOG_TEXT_50, "第一条 = 首段越阈（rounds 50）")
    assert.equal(q[1].message, WATCHDOG_TEXT_50, "第二条 = 写后重臂再越阈（rounds 50）")
    assert.equal(existsSync(join(dir, "note.txt")), true, "落笔真发生（真写工具）")
    assert.equal(readFileSync(join(dir, "note.txt"), "utf8"), "watchdog rearm fixture", "写内容在盘")
    assert.equal(agent._touchedFiles.length, 1, "_touchedFiles 记账（#417 同源面）")
    assert.equal(agent._zeroWriteTurns, 100, "#417 累计口径零改（两段各 50 零写轮）")
    assert.equal(agent._zeroWriteStreak, 50, "落笔归零后重计（第二条越阈时 streak = 50）")
    out("U-ZW3", `两条 note（各 50）· 真写落盘 ✓ · _zeroWriteTurns=100 ✓`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* ── U-ZW4 · 边界·角色门 / 无上游 / 缺字段（F-ZW6——静默、零抛） ────────────────────── */

test("U-ZW4 角色门 / 无上游 / 缺字段：均 ⇒ false ∧ 零动作（静默、零抛）", async () => {
  const W = await loadWatch()
  const parent = { _childUpstream: [] }
  const base = { _zeroWriteStreak: 50, _zeroWriteAlerted: false, _upstream: { parent, label: "x#1" } }
  assert.equal(W.maybeZeroWriteAlert({ ...base, _role: "coder" }), false, "普通 coder 不在触面")
  assert.equal(W.maybeZeroWriteAlert({ ...base, _role: "explore" }), false, "explore 不在触面")
  assert.equal(W.maybeZeroWriteAlert({ ...base, _role: "eng-coder", _upstream: { label: "eng-coder#9" } }), false, "无 `_upstream.parent` ⇒ 静默跳过")
  assert.equal(W.maybeZeroWriteAlert(null), false, "空值零抛")
  assert.equal(W.maybeZeroWriteAlert({ ...base, _role: "eng-coder", _zeroWriteStreak: undefined }), false, "缺字段不判（不冒充 0）")
  assert.equal(W.maybeZeroWriteAlert({ ...base, _role: "eng-coder", _zeroWriteStreak: "50" }), false, "非整数不判")
  assert.equal(parent._childUpstream.length, 0, "零推（零动作）")
  out("U-ZW4", `角色门 / 无上游 / 缺字段 ⇒ false · 队列 0 · 零抛 ✓`)
})

/* ── U-ZW5 · 集成·回合环 50+ 轮（F-ZW1 / F-ZW3——直驱 runTurnLoop） ──────────────────── */

test("U-ZW5 回合环 50+ 轮：第 50 零写轮起恰 1 条 · 51 轮不重发 · #417 读数与显示逐字同", async () => {
  const dir = tmp("zw5")
  try {
    const { agent, parent } = mkChild(dir)
    const script = []
    for (let i = 0; i < 51; i++) script.push(callRound(`r${i}`, "read", { path: "nowhere.txt" })) // rounds 0..50 全零写
    script.push(textRound("fixture done"))
    const { calls } = await withFetch(script, () => LOOP.runTurnLoop(agent, loopOpts()))
    assert.equal(calls, 52, "回合数 = 52（51 零写 + 收尾）")
    assert.equal(agent._zeroWriteTurns, 51, "#417 读数（51 零写轮——改前同夹具逐字同）")
    assert.equal(CHECKPOINT.turnCapTrace({ childAgent: agent }), "segments 1 · accumulated 52 turns · zero-write rounds this segment: 51", "#417 显示面逐字不变（status 三元件）")
    const q = parent._childUpstream ?? []
    assert.equal(q.length, 1, "第 50 零写轮起恰 1 条（51 轮越阈不重发——闩）")
    assert.equal(q[0].kind, "note")
    assert.equal(q[0].message, WATCHDOG_TEXT_50, "文案逐字（携 from + 轮数）")
    assert.equal(agent._zeroWriteStreak, 51, "streak 连续口径（越阈后继续累计）")
    assert.equal(agent._zeroWriteAlerted, true, "闩置位（单条/段）")
    out("U-ZW5", `51 零写轮 ⇒ 恰 1 条 · _zeroWriteTurns=51 · 显示面逐字 ✓`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* ── U-ZW6 · 集成·跨段存活（F-ZW1——resume 新段不吞计数） ─────────────────────────── */

test("U-ZW6 跨段存活：streak 49 ⇒ resume 新段（_zeroWriteTurns 复位、streak 存活）再 1 零写轮 ⇒ 越阈推报", async () => {
  const dir = tmp("zw6")
  try {
    const { agent, parent } = mkChild(dir)
    agent._zeroWriteStreak = 49      // 上段累计（49 连零）
    agent._zeroWriteTurns = 49       // 上段计数（resume 新段应复位为 0）
    agent._turnSeq = 9               // 上段累计编号（resume 不回退）
    agent._continueSegments = 1
    const script = [callRound("r0", "read", { path: "nowhere.txt" }), textRound("segment done")]
    await withFetch(script, () => CORE.runAgent(agent, "", {}, { depth: 1, resume: true }))
    assert.equal(agent._zeroWriteTurns, 1, "新段计数复位后仅本段 1 零写轮（段界不吞 streak）")
    assert.equal(agent._zeroWriteStreak, 50, "streak 跨段存活（49 + 1 = 50）")
    const q = parent._childUpstream ?? []
    assert.equal(q.length, 1, "新段内越阈恰 1 条")
    assert.equal(q[0].message, WATCHDOG_TEXT_50, "轮数 = 跨段累计 50（不因段界归零）")
    out("U-ZW6", `streak 49 ⇒ resume ⇒ 50 越阈 · _zeroWriteTurns=1 ✓`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

/* ── U-ZW7 / U-ZW8 · 评审环路（F-ZW2——钩子恰一次 / 缺钩子零行为） ──────────────────── */

const ADVISOR_TOOLSET = { schemas: [], byName: new Map([["probe_read", { name: "probe_read", readonly: true, execute: async () => "ok" }]]) }
const silent = () => ({ tool: true })
const textTool = (t) => ({ tool: true, text: t })
const finalText = (t) => ({ text: t, tool: false })

/** 评审环路夹具：真 `_runAdvisorToolLoop` + chat 缝（零网络）+ 只读探针工具清单。 */
function mkAdvisorRun(script, extraSeams = {}) {
  const state = { calls: 0, fired: [] }
  const chat = async (provider, opts) => {
    const step = script[state.calls]
    state.calls += 1
    if (!step) throw new Error(`advisor chat stub exhausted (call #${state.calls})`)
    if (step.text) opts.onToken?.(step.text)
    if (step.tool) return { toolCalls: [{ id: `tc_${state.calls}`, name: "probe_read", arguments: "{}" }], content: step.text ?? "" }
    return { content: step.text ?? "", toolCalls: [] }
  }
  const seams = { chat, onStallRound: (rounds) => state.fired.push({ rounds, at: state.calls }), ...extraSeams }
  const run = () => ADV._runAdvisorToolLoop(
    { model: "harness-model" }, [{ role: "user", content: "review fixture" }], null, null, {}, SANDBOX,
    ADVISOR_TOOLSET, "code", null, null, seams,
  )
  return { state, run }
}

test("U-ZW7 评审越阈：50 轮无文本 ⇒ 钩子恰一次（携 50）；文本后归零不再提前触发", async () => {
  // 腿 ① 连 50 轮无文本 ⇒ 第 50 轮结账即通报（触发时点 = 50 次 chat 完成后、第 51 次之前）
  const a = mkAdvisorRun([...Array.from({ length: 50 }, silent), finalText("LGTM — review complete.")])
  const reviewA = await a.run()
  assert.deepEqual(a.state.fired, [{ rounds: 50, at: 50 }], "钩子恰一次（携 50；轮顶结账时点）")
  assert.ok(String(reviewA).includes("LGTM"), "正常收尾（通报不打断评审）")

  // 腿 ② 中途有文本 ⇒ 归零重计：第 31 轮文本 ⇒ 其后 50 轮（32..81）才越阈（触发时点 = 81 次 chat 后）
  const scriptB = [...Array.from({ length: 30 }, silent), textTool("round 31 review text"), ...Array.from({ length: 50 }, silent), finalText("LGTM — round 82.")]
  const b = mkAdvisorRun(scriptB)
  await b.run()
  assert.deepEqual(b.state.fired, [{ rounds: 50, at: 81 }], "文本后归零重计（不提前触发；恰一次）")
  out("U-ZW7", `腿① fired=[{rounds:50,at:50}] · 腿② fired=[{rounds:50,at:81}] ✓`)
})

test("U-ZW8 评审无钩子：同步径调用（不供 onStallRound）⇒ 零行为（零推、零抛）", async () => {
  const a = mkAdvisorRun([...Array.from({ length: 51 }, silent), finalText("LGTM — no hook.")], { onStallRound: undefined })
  const review = await a.run()
  assert.ok(String(review).includes("LGTM"), "缺钩子 ⇒ 评审照常收尾（不抛错、不成为 failed 面）")
  assert.equal(a.state.fired.length, 0, "零推（钩子缺省 ⇒ 零行为）")
  out("U-ZW8", `51 轮静默 + 缺钩子 ⇒ 正常收尾 · 零推 ✓`)
})

/* ── A-ZW4 · 送达面（同队列同消费点）+ 静态机检（零引唤醒面） ────────────────────────── */

test("A-ZW4 送达面：watch 推送走既有队列 / drain 合并注入；静态机检 watch 档零引唤醒面", async () => {
  const W = await loadWatch()
  // ① 行为：push ⇒ 父侧 drain 单点消费（与 notify_parent 同队列同消费点）
  const parent = { history: [] }
  const child = { _role: "eng-coder", _zeroWriteStreak: 50, _zeroWriteAlerted: false, _upstream: { parent, label: "eng-coder#7" } }
  assert.equal(W.maybeZeroWriteAlert(child), true)
  assert.equal(parent._childUpstream.length, 1, "推送落既有队列")
  assert.equal(PARENT.drainChildUpstream(parent), 1, "既有消费单点取走（恰一条）")
  assert.equal(parent._childUpstream.length, 0, "drain 即清")
  const injected = String(parent.history.at(-1)?.content ?? "")
  assert.ok(injected.includes("[上抛·知会] · eng-coder#7: [zero-write watchdog] eng-coder#7: 50 consecutive rounds"), "合并注入形态 = 标识形 drain 列示")
  // ② 静态：watch 档零引唤醒面 / 工具面（A-ZW4：闸 / 谓词 / 工具面零改）
  const src = readFileSync(join(ROOT, WATCH_REL), "utf8")
  for (const banned of ["wakeAsyncWaiters", "upstreamWaiting", "UPSTREAM_MSG_MAX", "UPSTREAM_QUEUE_MAX", "UPSTREAM_ASK_MAX_INFLIGHT", "parentChannelTool"]) {
    assert.ok(!src.includes(banned), `零引唤醒 / 工具面：${banned} 缺席`)
  }
  assert.ok(src.includes("pushChildUpstream"), "唯一推送入口 = 既有 pushChildUpstream")
  out("A-ZW4", `drain 恰一条 ✓ · 静态零引唤醒面 ✓`)
})
