/**
 * 2026-09-28-desktop-session-title.test.mjs — 批次本地单元件（#517 桌面会话标题接线 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = `node --test docs/batches/2026-09-28-desktop-session-title.test.mjs`。
 *
 * 被验面 = `thincoder-desktop/src/main/turn-face.mjs` `settleTurn`（KD-41）：标题生成 → 落盘，**标题先于落盘**；
 * 两查位同源 = 回合代次面。真件组合：真核 `ensureSessionTitle`（自守卫 ∕ 非致命）· 真端 `saveAgentSlot` ∕
 * `createTurnFace`；E5 ∕ E6 另经真 `createTurnDriver`（忙态受理回执 ∕ `dispose` 两真面）。
 * 换桩自持（零真实网络）：`globalThis.fetch` 换桩；假 provider 携 `apiKey` ∕ `baseURL` 指不可达端口
 * `http://127.0.0.1:1/v1`（仅形态占位 —— 桩先行拦下）。沙箱 = 核会话根隔离缝 `_setSessionsDirForTest`
 * （临时目录 —— 零用户目录触碰）。
 * 六例：E1 链路 · E2 时序 · E3 短路 · E4 失败（前置缺 ∕ 网络抛两形）· E5 窗内忙态受理 · E6 窗内中止零写。
 */
import test, { afterEach } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { pushReal } from "../../thincoder-core/context.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, slotPath } from "../../thincoder-core/session-slots.mjs"
import { newSession, renameSlot } from "../../thincoder-core/session.mjs"
import { loadAgentSlot } from "../../thincoder-desktop/src/main/session-io.mjs"
import { listSessions } from "../../thincoder-desktop/src/main/sessions.mjs"
import { createTurnDriver } from "../../thincoder-desktop/src/main/turn-driver.mjs"
import { createTurnFace } from "../../thincoder-desktop/src/main/turn-face.mjs"

const REAL_FETCH = globalThis.fetch
const TEMPS = []
const KEY = "1"
const FIRST_MSG = "第一条用户消息：请把这次会话的标题生成出来。"
const SECOND_MSG = "第二条消息：标题生成窗期内送入，结算后应照常续发。"

/** 临时沙箱：`sessions` 根（核隔离缝）+ 项目 `cwd`（均住随机临时目录 —— 用例尾随 TEMPS 清理）。 */
function sandbox() {
  const root = mkdtempSync(join(tmpdir(), "tc-517-title-"))
  const sessions = join(root, "sessions")
  const cwd = join(root, "project")
  mkdirSync(cwd, { recursive: true })
  _setSessionsDirForTest(sessions)
  TEMPS.push(root)
  return { root, sessions, cwd }
}

/** fetch 换桩（零真实网络）：`impl` 即桩体 —— 计数 ∕ 门控由用例自持。 */
function stubFetch(impl) {
  globalThis.fetch = impl
}

/** 假 provider 响应（OpenAI 兼容提取支 = `data.choices[0].message.content`）。 */
const titleResponse = (title) => ({ ok: true, json: async () => ({ choices: [{ message: { content: title } }] }) })

/** 装配出的代理最小形（`ensureSessionTitle` ∕ `saveSession` 消费面齐备；无 record store ⇒ 内存回退支）。 */
function makeAgent(cwd, provider) {
  return {
    cwd,
    provider: provider ?? { name: "fake", apiKey: "test-key", baseURL: "http://127.0.0.1:1/v1", model: "gpt-4o" },
    history: [],
    _fullHistory: [],
    title: "",
    tasks: [],
    planMode: false,
    autoApprove: false,
    goal: null,
    _pendingReminders: [],
    _sessionStart: null,
    _engDesignTokens: new Map(),
    config: {},
  }
}

/** 假回合运行器（经核 `pushReal` 落两线 —— 与核 `runAgent` 回合首段同效：首条 user 消息可得）。 */
const fakeRun = async (agent, text) => {
  pushReal(agent, { role: "user", content: text })
  return { content: "" }
}

/** 出站记录面（`onEvent` = 发射当场同步钩子 —— E2 时序证法用）。 */
function makePost(onEvent = null) {
  const events = []
  const post = (channel, payload) => {
    if (onEvent) onEvent(channel, payload)
    events.push({ channel, payload })
  }
  return { post, events }
}

const doneEvents = (events) => events.filter((e) => e.channel === "ev:activity" && e.payload?.event === "done")

function deferred() {
  let resolve
  const promise = new Promise((r) => { resolve = r })
  return { promise, resolve }
}

async function waitUntil(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (predicate()) return true
    if (Date.now() > deadline) return false
    await new Promise((r) => setTimeout(r, 5))
  }
}

/** 槽文件读（沙箱内 —— 断言口径 = 落盘面）。 */
const readSlot = (cwd, slot) => JSON.parse(readFileSync(slotPath(cwd, slot), "utf8"))

/** 单回合执行面夹具（真 `createTurnFace`；`turnGate` 缺省 = 恒不判失 —— E1–E4 不触中止面）。 */
const makeFace = (post) => createTurnFace({ post, run: fakeRun, bridge: () => ({}), postUsage: () => {}, flights: new Map() })

/** 回合驱动夹具（真 `createTurnDriver`；`ensure` 直供本用例代理 —— 忙态 ∕ 中止两真面所依）。 */
function makeDriver(sb, agent, post) {
  return createTurnDriver({
    post, run: fakeRun, bridge: () => ({}), postUsage: () => {},
    ensure: async () => agent, forgetKey: () => {}, dropScope: () => {}, denyGates: () => {},
    projects: { currentCwd: () => sb.cwd },
  })
}

afterEach(() => {
  _resetSessionsDirForTest()
  globalThis.fetch = REAL_FETCH
  for (const dir of TEMPS.splice(0)) {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* 清理尽力面 */ }
  }
})

test("E1 链路：首回合 ⇒ agent.title 非空 ∧ 槽文件 title 非空 ∧ sessions:list 行 title 非空", async () => {
  const sb = sandbox()
  let calls = 0
  stubFetch(async () => { calls += 1; return titleResponse("  会话标题甲  ") }) // 空白由核件 trim
  const agent = makeAgent(sb.cwd)
  const { post, events } = makePost()

  await makeFace(post).executeTurn(KEY, agent, FIRST_MSG)

  assert.equal(calls, 1, "标题生成 = 一次换桩网络")
  assert.equal(agent.title, "会话标题甲", "生成标题落内存（核件 trim ∕ 40 字截）")
  assert.ok(Number.isInteger(agent._slot), "回合尾落盘认领槽号")
  assert.equal(readSlot(sb.cwd, agent._slot).title, "会话标题甲", "槽文件 title 非空（落盘面）")
  const rows = listSessions(sb.cwd).rows
  assert.equal(rows.length, 1, "sessions:list 单行（新槽）")
  assert.equal(rows[0].title, "会话标题甲", "列表读面见新标题")
  assert.equal(doneEvents(events).length, 1, "回合照常出终局事件")
})

test("E2 时序：标题先于落盘 —— 标题窗内零写盘；终局事件发射当场槽已携标题", async () => {
  const sb = sandbox()
  const fetched = deferred()
  const gate = deferred()
  stubFetch(async () => { fetched.resolve(); await gate.promise; return titleResponse("时序标题") })
  const agent = makeAgent(sb.cwd)
  let slotAtEvent = null
  const { post, events } = makePost((channel, payload) => {
    // 终局事件发射当场读盘（U97 式样）：落盘先于终局事件 ⇒ 读到即新值（渲染面回合尾刷新同读）
    if (channel === "ev:activity" && payload?.event === "done" && Number.isInteger(agent._slot)) {
      slotAtEvent = readSlot(sb.cwd, agent._slot)
    }
  })

  const turn = makeFace(post).executeTurn(KEY, agent, FIRST_MSG)
  await fetched.promise
  // 标题窗期（`ensureSessionTitle` 在飞）：本回合唯一写点尚未到达 ⇒ 盘面零写（标题先于落盘正证）
  assert.deepEqual(existsSync(sb.sessions) ? readdirSync(sb.sessions) : [], [], "save 前零写盘")

  gate.resolve()
  await turn

  assert.ok(slotAtEvent !== null, "终局事件在册（发射当场已能读盘）")
  assert.equal(slotAtEvent.title, "时序标题", "终局事件发射当场槽已携标题")
  assert.equal(readSlot(sb.cwd, agent._slot).title, "时序标题", "结算后槽面同值")
  assert.equal(doneEvents(events).length, 1)
})

test("E3 短路：槽 title 在场（装载即短路）⇒ 零 provider 调用 ∧ 标题不被改写", async () => {
  const sb = sandbox()
  let calls = 0
  stubFetch(async () => { calls += 1; return titleResponse("不应出现") })
  const slot = await newSession(sb.cwd)
  assert.equal(renameSlot(sb.cwd, slot, "既有标题").ok, true, "夹具：槽 title 落盘")
  const agent = makeAgent(sb.cwd)
  assert.equal(loadAgentSlot(agent, sb.cwd, slot), true, "装载（title 进内存 = 自守卫判据位）")
  assert.equal(agent.title, "既有标题")
  const { post, events } = makePost()

  await makeFace(post).executeTurn(String(slot), agent, FIRST_MSG)

  assert.equal(calls, 0, "零网络（核件自守卫短路）")
  assert.equal(agent.title, "既有标题", "标题不被改写")
  assert.equal(readSlot(sb.cwd, slot).title, "既有标题", "槽面原值保留")
  assert.equal(doneEvents(events).length, 1, "回合照常结算")
})

test("E4 失败非致命：前置缺 ⇒ 零调用零标题；provider 抛 ⇒ 零标题零阻断（均正常结算）", async () => {
  // 形 A（设计主形）：provider 缺 `apiKey` ⇒ `generateTitle` 前置判据早退（零网络）
  {
    const sb = sandbox()
    let calls = 0
    stubFetch(async () => { calls += 1; return titleResponse("不应出现") })
    const agent = makeAgent(sb.cwd, { name: "fake", baseURL: "http://127.0.0.1:1/v1", model: "gpt-4o" })
    const { post, events } = makePost()

    await makeFace(post).executeTurn(KEY, agent, FIRST_MSG)

    assert.equal(calls, 0, "前置缺 ⇒ 零网络")
    assert.ok(!agent.title, "零标题")
    assert.equal(readSlot(sb.cwd, agent._slot).title, "", "槽照常落盘（title 空）")
    assert.equal(doneEvents(events).length, 1, "回合正常结算")
    assert.ok(!events.some((e) => e.channel === "ev:error"), "零错误浮面")
  }
  // 形 B（非致命正证）：provider 前置齐备但网络抛 ⇒ 核件自吞 ⇒ 回合链零承担
  {
    const sb = sandbox()
    let calls = 0
    stubFetch(async () => { calls += 1; throw new Error("network down") })
    const agent = makeAgent(sb.cwd)
    const { post, events } = makePost()

    await makeFace(post).executeTurn(KEY, agent, FIRST_MSG)

    assert.equal(calls, 1, "调用已发（换桩抛）")
    assert.ok(!agent.title, "生成失败 ⇒ 零标题")
    assert.equal(readSlot(sb.cwd, agent._slot).title, "", "槽照常落盘（title 空）")
    assert.equal(doneEvents(events).length, 1, "回合正常结算（非致命）")
    assert.ok(!events.some((e) => e.channel === "ev:error"), "零错误浮面")
  }
})

test("E5 窗内忙态：标题窗期二次 send ⇒ {ok,queued} ∧ 结算后续发不丢（照常注入 ∧ 用户块入流）", async () => {
  const sb = sandbox()
  const fetched = deferred()
  const gate = deferred()
  let calls = 0
  stubFetch(async () => { calls += 1; fetched.resolve(); await gate.promise; return titleResponse("窗内标题") })
  const agent = makeAgent(sb.cwd)
  const { post, events } = makePost()
  const driver = makeDriver(sb, agent, post)

  const first = await driver.send(KEY, FIRST_MSG)
  assert.equal(first.ok, true)
  await fetched.promise // 标题窗期起点（`flights` 持有 —— KD-41 ②）
  assert.equal(driver.busyOf(KEY), true, "标题窗期 = 忙态（在飞表未释）")
  const second = await driver.send(KEY, SECOND_MSG)
  assert.deepEqual(second, { ok: true, queued: true }, "忙态受理 ⇒ 按会话键入队（KD-40 ②）")
  assert.ok(
    events.some((e) => e.channel === "ev:queue" && e.payload.items?.some((i) => i === SECOND_MSG)),
    "队镜面已出帧（ev:queue 快照）"
  )

  gate.resolve()
  assert.ok(await waitUntil(() => doneEvents(events).length >= 2), "两回合各出终局事件（第二回合结算完成）")
  assert.ok(agent._fullHistory.some((m) => m.role === "user" && m.content === SECOND_MSG), "结算后续发不丢（用户块入流）")
  assert.ok(events.some((e) => e.channel === "ev:queue" && e.payload.delivered?.text === SECOND_MSG), "消费回执帧（delivered）")
  assert.equal(calls, 1, "第二回合标题短路（零二次生成）")
  assert.equal(readSlot(sb.cwd, agent._slot).title, "窗内标题")
})

test("E6 窗内中止：标题窗期 dispose ⇒ 槽零写 ∧ 标题零落", async () => {
  const sb = sandbox()
  const slot = await newSession(sb.cwd)
  const before = readFileSync(slotPath(sb.cwd, slot))
  assert.equal(JSON.parse(before.toString("utf8")).title, "", "夹具：新槽 title 空")
  const fetched = deferred()
  const gate = deferred()
  let calls = 0
  stubFetch(async () => { calls += 1; fetched.resolve(); await gate.promise; return titleResponse("不应落盘") })
  const agent = makeAgent(sb.cwd)
  const { post, events } = makePost()
  const driver = makeDriver(sb, agent, post)

  const first = await driver.send(String(slot), FIRST_MSG)
  assert.equal(first.ok, true)
  await fetched.promise
  assert.equal(driver.busyOf(String(slot)), true, "标题窗期（在飞表持有）")

  driver.dispose(String(slot)) // 窗内会话中止 = 落盘前查位②的触发源
  assert.equal(driver.busyOf(String(slot)), false, "会话中止 ⇒ 在飞表清")

  gate.resolve() // 标题照常生成（换桩返回）—— 但落盘前查位命中 ⇒ 零写
  assert.ok(await waitUntil(() => doneEvents(events).length >= 1), "回合尾流程收束（终局事件已出）")
  assert.equal(calls, 1, "标题生成确曾发起（窗内中止非「未生成」）")

  assert.deepEqual(readFileSync(slotPath(sb.cwd, slot)), before, "槽零写（文件内容零变）")
  assert.equal(readSlot(sb.cwd, slot).title, "", "标题零落（盘面仍空）")
})
