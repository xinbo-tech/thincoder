/**
 * timer-wake.test.mjs — timer-wake 阶段 2 **桌面面**用例族（T-TW17–T-TW21 + 渲染面随动组）。
 * 单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11 桌面块 / §6.30.12 用例表；覆盖：
 * 闩武装（键面 · 撤旧立新 · 开关关 · 到点自撤）· 空闲自唤醒（交付 + `ev:timer` 恰一条 + timer 轮 + 链尾重同步）·
 * 非空闲零动作（在飞 ∕ 窗内 —— 在途表零触碰）· 出窗重武装 ∕ 撤闩清点（dispose ∕ 切项目级联）· 透传（turn-face opts）·
 * 渲染面（`ev:timer` 归约 ⇒ `[data-timer]` 行组 ⇒ 帧尾同刷 ⇒ 页读整置即失）。
 * 纪律：零真实等待（闩时钟三扇注入缝）· 零 electron / 零用户目录（会话沙箱）· 零 provider。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { wakeAsyncWaiters } from "@thincoder/core/agent-tools/async-settle.mjs"
import { createSuspensionDrive } from "../src/main/suspension-drive.mjs"
import { createTimerWatch, fireTimerWake, timerWakeEnabled } from "../src/main/timer-watch.mjs"
import { createTurnFace } from "../src/main/turn-face.mjs"
import { reduce } from "../renderer/events.mjs"
import { applyPage } from "../renderer/page-read.mjs"
import { initialState } from "../renderer/store.mjs"
import { chatModel, chatTree, mountChat } from "../renderer/views/chat.mjs"
import { syncChrome } from "../renderer/views/chat-chrome.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import { useSlotSandbox } from "./slot-sandbox.mjs"

const sandbox = useSlotSandbox() // 模块级：`executeTurn` 回合尾落盘走 tmp sessions 根
after(sandbox.cleanup)

/** 假闩时钟（三扇注入缝同源）：注册 / 撤除 / unref 逐笔可读 ⇒ 零真实等待。 */
function fakeClock() {
  let seq = 0
  const live = new Map()
  const cleared = []
  return {
    timer: (fn, delay) => {
      const id = `h${(seq += 1)}`
      const handle = { id, unrefCalled: false, unref() { this.unrefCalled = true } }
      live.set(id, { fn, delay, handle })
      return handle
    },
    clear: (handle) => { cleared.push(handle.id); live.delete(handle.id) },
    fire: (id) => { const entry = live.get(id); live.delete(id); entry.fn() },
    ids: () => [...live.keys()],
    delayOf: (id) => live.get(id)?.delay,
    unrefOf: (id) => live.get(id)?.handle.unrefCalled,
    live,
    cleared,
  }
}

/** 假载体（核 `carrierField` 直读面最小形）。 */
const makeCarrier = () => ({ _asyncSubagents: new Map(), _pendingAsyncAdvisors: null, _asyncAdvisors: new Map(), _pendingAsyncResults: [], history: [] })

/** 等到谓词成立（驱动循环异步 —— 最多 50 拍）。 */
async function until(fn, label = "condition") {
  for (let i = 0; i < 50; i += 1) {
    if (fn()) return
    await new Promise((done) => setTimeout(done, 0))
  }
  throw new Error(`timeout waiting: ${label}`)
}

/** 假驱动装配（闩时钟注入缝 + 收集面）。 */
function makeDrive(over = {}) {
  const clock = over.clock ?? fakeClock()
  const post = []
  const turns = []
  const drive = createSuspensionDrive({
    post: (channel, payload) => post.push([channel, payload]),
    runTurn: async (key, agent, text, opts) => { turns.push({ key, text, opts }) },
    timer: clock.timer, clear: clock.clear, now: () => 1000,
    ...over.drive,
  })
  return { drive, clock, post, turns }
}

// ─── T-TW17 正常·桌面闩武装（键面 · 撤旧立新 · 开关关 · 跨键独立）──────────

test("T-TW17: 闩武装 —— 注册恰一次 · 延迟 = 最早到期差 · unref 被调；无在途 ∕ 开关关 ⇒ 零注册并撤旧；跨键独立", () => {
  const clock = fakeClock()
  const fired = []
  const watch = createTimerWatch({ onFire: (key) => fired.push(key), timer: clock.timer, clear: clock.clear, now: () => 1000 })
  const agent = { _pendingTimers: [{ id: "a", expiresAt: 9000, message: "后" }, { id: "b", expiresAt: 4000, message: "先" }] }

  assert.equal(watch.sync("3", agent), 3000, "延迟 = 最早到期差（4000 − 1000）")
  assert.deepEqual(clock.ids().length, 1, "注册恰一次")
  assert.equal(clock.delayOf(clock.ids()[0]), 3000, "延迟按最近到期算")
  assert.equal(clock.unrefOf(clock.ids()[0]), true, "`unref()` 被调（不阻断宿主退出）")

  assert.equal(watch.sync("3", agent), 3000, "重武装 = 撤旧立新")
  assert.equal(clock.ids().length, 1, "同键至多一闩（旧句柄已撤）")
  assert.deepEqual(clock.cleared.length, 1, "撤旧恰一次")

  assert.equal(watch.sync("3", { _pendingTimers: [] }), null, "无在途 ⇒ 零注册")
  assert.equal(watch.size(), 0, "旧闩同撤（清点归零）")
  assert.equal(watch.sync("4", { config: { agent: { timerWake: false } }, _pendingTimers: [{ id: "c", expiresAt: 9000, message: "关" }] }), null, "开关关 ⇒ 零注册")
  assert.equal(timerWakeEnabled({ config: { agent: { timerWake: false } } }), false, "开关判据 = 显式 false 才关")
  assert.equal(timerWakeEnabled({}), true, "缺省开")

  watch.sync("5", agent)
  watch.sync("6", agent)
  assert.equal(watch.size(), 2, "跨键独立（键 ⇒ 闩）")
  clock.fire(clock.ids()[0])
  assert.deepEqual(fired, ["5"], "到点回调携键")
  assert.equal(watch.size(), 1, "到点自撤（一次性闩）")
  watch.disarmAll()
  assert.equal(watch.size(), 0, "全键撤闩（清点）")
})

// ─── T-TW18 正常·桌面空闲自唤醒（交付 + `ev:timer` + timer 轮）─────────────

test("T-TW18: 空闲自唤醒 —— 交付（核三件）+ `ev:timer` 恰一条 + timer 轮（`{autoTurn,timerTurn}`）恰一次", async () => {
  const post = []
  const turns = []
  const agent = makeCarrier()
  agent._pendingTimers = [{ id: "t1", expiresAt: 900, message: "取数" }, { id: "t2", expiresAt: 5000, message: "后件" }]
  const fired = await fireTimerWake("3", {
    agent, post: (channel, payload) => post.push([channel, payload]),
    runTurn: async (key, carrier, text, opts) => turns.push({ key, text, opts }),
    now: () => 1000,
  })
  assert.equal(fired, true, "空闲 ⇒ 开轮")
  assert.deepEqual(post, [["ev:timer", { key: "3", text: "[System reminder: ⏰ timer — 取数]" }]], "触发落流恰一条（原文逐字）")
  assert.deepEqual(agent.history, [{ role: "user", content: "[System reminder: ⏰ timer — 取数]" }], "注入单点 = 核三件第三件")
  assert.deepEqual(agent._pendingTimers.map((t) => t.id), ["t2"], "到期即出列（幂等）· 未到期原序保留")
  assert.deepEqual(turns, [{ key: "3", text: "", opts: { autoTurn: true, timerTurn: true } }], "timer 轮 = 空文本 + 双旗标")
})

// ─── T-TW19 边界·桌面 busy ∕ 窗内触发（零动作 —— 在途表零触碰）─────────────

test("T-TW19: 非空闲触发 —— 在飞 ∕ 窗内 ⇒ 零交付零开轮 · 在途表零触碰", async () => {
  const calls = []
  const runTurn = async () => { calls.push("turn") }
  const post = () => { calls.push("post") }
  for (const flag of ["busy", "inWindow"]) {
    const agent = makeCarrier()
    agent._pendingTimers = [{ id: "t1", expiresAt: 900, message: "取数" }]
    const fired = await fireTimerWake("3", { agent, post, runTurn, [flag]: true, now: () => 1000 })
    assert.equal(fired, false, `${flag} ⇒ 零动作`)
    assert.deepEqual(agent._pendingTimers.length, 1, "在途表零触碰（交既有路径）")
    assert.deepEqual(agent.history, [], "零注入")
  }
  assert.deepEqual(calls, [], "零 post / 零开轮")
})

// ─── T-TW20 边界·桌面出窗重武装 ∕ 清点（驱动面）──────────────────────────

test("T-TW20: 出窗重武装 ⟺ 仍有在途 · 撤闩清点（dispose ∕ 切项目级联）", async () => {
  const { drive, clock } = makeDrive()
  const agent = makeCarrier()
  agent._pendingTimers = [{ id: "t1", expiresAt: 5000, message: "取数" }]
  agent._asyncSubagents.set("7", { id: "7", role: "subagent", status: "running", done: false })
  assert.equal(drive.start("3", agent), true, "池 live ⇒ 入窗")
  assert.equal(drive.timerLatches(), 0, "入窗 ⇒ 撤空闲闩（窗内 deadline 由 `timerFace` 单持）")

  agent._asyncSubagents.delete("7") // 池空（未注入）⇒ 窗自然退出
  wakeAsyncWaiters(agent)
  await until(() => drive.size() === 0, "窗退出")
  assert.equal(drive.timerLatches(), 1, "出窗结算后 ⇒ 重武装（仍有在途）")
  assert.equal(clock.delayOf(clock.ids()[0]), 4000, "重武装按最近到期重算")

  assert.equal(drive.abort("3"), false, "无窗 ∕ 无续发链 ⇒ 返回语义不变")
  assert.equal(drive.timerLatches(), 0, "会话清除面（dispose）⇒ 撤闩清点")
  assert.deepEqual(clock.ids(), [], "句柄真撤（零残留）")

  drive.start("3", agent) // 池空 ⇒ 武装（未入窗 = 装配点①）
  drive.start("4", agent)
  assert.equal(drive.timerLatches(), 2, "跨键独立 —— 未入窗键各持一闩")
  assert.equal(drive.abortAll(), 0, "中止数 = 窗 ∥ 续发链（空闲态键不在计）")
  assert.equal(drive.timerLatches(), 0, "切项目级联 ⇒ 全键撤闩清点")
})

test("T-TW18（驱动面）: 空闲闩到点 ⇒ 交付 + timer 轮 + 轮后链尾接管；在飞 ⇒ 零动作 ∕ 零重武装 ∕ 零接管", async () => {
  let busy = false
  const tails = []
  const { drive, clock, post, turns } = makeDrive({
    drive: {
      busyOf: () => busy,
      takeOver: (key, agent) => { tails.push({ key, agent }); drive.start(key, agent, { cwd: null }) }, // 宿主接管面同形（池空 ⇒ 闩重武装）
    },
  })
  const agent = makeCarrier()
  agent._pendingTimers = [{ id: "t1", expiresAt: 1000, message: "取数" }, { id: "t2", expiresAt: 4000, message: "后件" }]

  drive.start("3", agent) // 池空 ⇒ 武装（delay = 0）
  assert.equal(clock.ids().length, 1, "闩注册恰一次")
  clock.fire(clock.ids()[0])
  await until(() => turns.length === 1, "timer 轮")
  assert.deepEqual(post.filter(([c]) => c === "ev:timer"), [["ev:timer", { key: "3", text: "[System reminder: ⏰ timer — 取数]" }]], "触发落流恰一条")
  assert.deepEqual([turns[0].key, turns[0].text, turns[0].opts.autoTurn, turns[0].opts.timerTurn], ["3", "", true, true], "timer 轮 = 空文本 + 双旗标")
  await until(() => tails.length === 1, "轮后链尾接管") // 接管在轮后（`finally`）—— 与 `turns` 同帧可见但序在后
  assert.equal(tails.length, 1, "轮后链尾接管恰一次（池活 ⇒ 入窗消化 ∥ 池空 ⇒ 闩重武装 —— 与 `send` 径同判）")
  assert.deepEqual([tails[0].key, tails[0].agent === agent], ["3", true], "接管携本键 + 本 agent")
  await until(() => drive.timerLatches() === 1, "链尾重同步")
  assert.equal(clock.delayOf(clock.ids()[0]), 3000, "重同步按剩余在途重算（4000 − 1000）")

  busy = true // 在飞 ⇒ 触发时零动作
  await drive.start("3", agent) // 重武装（本警：在飞由宿主表判 —— 闩仍武装）
  assert.equal(clock.ids().length, 1, "闩已武装")
  clock.fire(clock.ids()[0])
  await until(() => post.filter(([c]) => c === "ev:timer").length === 1, "零新交付")
  assert.equal(turns.length, 1, "在飞 ⇒ 零开轮")
  assert.equal(tails.length, 1, "零开轮 ⇒ 零接管")
  assert.equal(drive.timerLatches(), 0, "未交付 ⇒ 零重武装（避「已到期未出列」0ms 重注册）")
  assert.deepEqual(agent._pendingTimers.map((t) => t.id), ["t2"], "在途表零触碰")
})

test("T-TW18（错误径）: timer 轮内抛错 ⇒ 链尾接管照走（轮后同判）", async () => {
  const clock = fakeClock()
  const tails = []
  const post = []
  const drive = createSuspensionDrive({
    post: (channel, payload) => post.push([channel, payload]),
    runTurn: async () => { throw new Error("provider down") },
    timer: clock.timer, clear: clock.clear, now: () => 1000,
    takeOver: (key) => tails.push(key),
  })
  const agent = makeCarrier()
  agent._pendingTimers = [{ id: "t1", expiresAt: 1000, message: "取数" }]
  drive.start("3", agent)
  clock.fire(clock.ids()[0])
  await until(() => tails.length === 1, "轮后接管（错误径）")
  assert.deepEqual(tails, ["3"], "轮内抛错 ⇒ 接管照走（与 `send` 径两径同接管同判）；不静默")
  assert.deepEqual(agent._pendingTimers, [], "交付已出列（出列幂等 —— 未重复投递）")
})

// ─── T-TW21 错误·桌面透传（turn-face opts 四件 ⇒ 五件）──────────────────

test("T-TW21: 透传 —— `executeTurn(..., { timerTurn: true })` ⇒ 桩 `run` 收 opts（与 autoTurn ∕ upstreamTurn 并列）；缺省 ⇒ false", async () => {
  const seen = []
  const { executeTurn } = createTurnFace({
    post: () => {},
    run: async (agent, text, callbacks, opts) => { seen.push({ text, opts }) },
    bridge: () => ({}),
    postUsage: () => {},
    flights: new Map(),
  })
  const agent = { history: [], cwd: sandbox.cwd, _slot: 3 } // 槽三件最小形：回合尾落盘走 tmp sessions 根（零噪音 / 零真实用户目录）
  await executeTurn("3", agent, "", { autoTurn: true, timerTurn: true, sessionSignal: null })
  assert.deepEqual([seen[0].opts.autoTurn, seen[0].opts.upstreamTurn, seen[0].opts.timerTurn, seen[0].opts.suspDriven], [true, false, true, true], "五件同在（timerTurn 严格真）")
  await executeTurn("3", agent, "hi", {})
  assert.deepEqual([seen[1].opts.autoTurn, seen[1].opts.upstreamTurn, seen[1].opts.timerTurn], [false, false, false], "缺省 ⇒ 三旗标皆假")
})

// ─── 渲染面：`ev:timer` ⇒ `timerNotice` 切片 ⇒ `[data-timer]` 行组 ────────

test("渲染面: `ev:timer` 归约（切片）⇒ 行组在场（显示裁 ≤3 行 + `…`）⇒ 帧尾同刷 ⇒ 页读整置即失", () => {
  selfCheck()
  const text = "[System reminder: ⏰ timer — 取数]"
  const base = { ...initialState(), activeSession: "s1", project: { cwd: sandbox.cwd, recent: [] }, blocks: [{ kind: "user", id: "u1", text: "问题" }] }
  const receipt = { ok: true, messages: [], hasOlder: false, flags: null, meta: null }

  const once = reduce(base, { channel: "ev:timer", key: "s1", text })
  assert.deepEqual(once.timerNotice, { s1: { text } }, "归约 ⇒ 本键切片（首写自种）")
  assert.equal(reduce(once, { channel: "ev:timer", key: "s1", text }), once, "同键同值 ⇒ 原引用（零重绘）")
  assert.equal(reduce(base, { channel: "ev:timer", key: "s1", text: "" }), base, "空串 ⇒ 零写（禁假造空行）")
  assert.equal(reduce(base, { channel: "ev:timer", key: "s1" }), base, "非串 ⇒ 零写")

  const model = chatModel(once)
  assert.deepEqual(model.timer, { text }, "模型切片 = 本键（活动会话）")
  assert.equal(chatModel({ ...once, activeSession: null }).timer, null, "`none` 帧 ⇒ 零组（禁假造）")
  const group = chatTree(model).children.find((child) => child?.props?.["data-timer"] !== undefined)
  assert.ok(group, "构树 ⇒ 行组在场")
  assert.deepEqual([group.props.class, group.props["data-block-id"]], ["chat-timer", undefined], "非块节点（不占块序 / 不动 `data-blocks`）")
  const capped = chatModel(reduce(base, { channel: "ev:timer", key: "s1", text: "1\n2\n3\n4\n5" }))
  const rows = chatTree(capped).children.find((child) => child?.props?.["data-timer"] !== undefined).children
  assert.deepEqual(rows.map((row) => row.children[0]), ["1", "2", "3", "…"], "显示裁 = ≤3 行 + `…`（CLI 同规）")

  const fake = installFakeDom()
  try {
    const root = fake.element()
    const mounted = mountChat(root, once)
    assert.ok(root.querySelector("[data-timer]"), "薄挂载 ⇒ 行组在场")
    const order = [...root.childNodes]
    assert.ok(order.indexOf(root.querySelector("[data-block-kind]")) < order.indexOf(root.querySelector("[data-timer]")), "族内序 = 块序列 → 触发行")
    const mark = fake.mark()
    syncChrome(root, mounted.model)
    const delta = fake.delta(mark)
    assert.deepEqual({ structural: delta.structural, text: delta.text }, { structural: 0, text: 0 }, "帧尾同刷幂等（结构 / 文本零写）")
    syncChrome(root, { ...mounted.model, timer: { text: "换件" } })
    assert.equal(root.querySelector("[data-timer-line]").textContent, "换件", "切片换代 ⇒ 原位换（零序跳）")

    const page = applyPage(once, receipt, { key: "s1", before: null })
    assert.equal("s1" in page.timerNotice, false, "首屏页读 ⇒ 触发痕清点（运行期痕：整置即失）")
    syncChrome(root, { ...mounted.model, timer: null })
    assert.equal(root.querySelector("[data-timer]"), null, "判据假 ⇒ 摘除")
    assert.equal(applyPage(base, receipt, { key: "s1", before: null }).timerNotice, base.timerNotice, "无痕 ⇒ 原引用（零写）")
  } finally { fake.restore() }
})
