/**
 * events-reduce.test.mjs — E-4 事件归约面用例（批档 §2.4 U87–U89 · 本批新档 · 300 行拆分层落形：
 * 页应用与审批面出档 `test/events-page.test.mjs`）：
 *   ① 块流写者（U87）· ② 回合态与位标码集（U88）· ③ 标题刷新 + 回合尾 flush 窄口与 `sessionMeta`（U89）·
 *   ④ 卡面两切片与提问出场（T-DSK24 —— 批 A 归约半：`ev:question` / `ev:task` 写切片 · `clearQuestion` · `stopped` 终局摘项）·
 *   ⑤ 占用读数归约（T-DSK29 —— 批 B：`ev:usage` 按会话 `key` 写切片 · 有效读数门〔数字且 > 0〕· 同值原引用 ·
 *      订阅面含 `ev:usage`）·
 *   ⑥ 挂起 / 消化两通道归约（U193 —— 「桌面空闲唤醒」批：`ev:susp` 计数切片 · `ev:digest` 消化行切片〔起跑 / 终态两态〕·
 *      订阅面 13 ⇒ 15）。
 * 平 node 直测：零 DOM · 零 electron · 零网 —— 假 `on`（订阅捕获）+ 假 `invoke`（调用记账 · 载荷逐字）。
 * 词面零字面：断言只钉结构锚（`data-*` / 键集 / 引用等值），不引文案副本。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { applyFlags, clearApproval, clearQuestion, openSession, reduce } from "../renderer/events.mjs"
import { applyPage } from "../renderer/page-read.mjs"
import { attachEvents } from "../renderer/events-subscribe.mjs"
import { createStore, initialState } from "../renderer/store.mjs"

const KEY = "1"
/** 块五型（闭集 —— 页块面与活块面同集）。 */
const KINDS = ["user", "assistant", "reasoning", "tool", "error"]
/** 位标码闭集（§2.2(e) 值面写者表）。 */
const BADGES = ["running", "approval", "done"]
/** `sessionMeta` 三行（名单与 `views/chrome.mjs` 同名 —— 会话头三值；两模式位随状态栏对齐批撤出）。 */
const META_FIELDS = ["provider", "model", "effort"]

/** 活动会话态（页数据随 `history:page` 回执整置 ⇒ 夹具按需补 `blocks` / `history`）。 */
const stateOf = (patch = {}) => ({ ...initialState(), activeSession: KEY, ...patch })
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

test("U87 块流写者：token 续写 / 新回合起块 / 工具三事件 / error 块", () => {
  const blank = stateOf()
  const opened = reduce(blank, { channel: "ev:token", key: KEY, text: "he" })
  assert.equal(opened.blocks.length, 1)
  assert.equal(opened.blocks[0].kind, "assistant")
  assert.equal(opened.blocks[0].streaming, true, "活块 = streaming 态在场")
  assert.match(opened.blocks[0].id, /^live-/, "活块 id（非页块）")

  const continued = reduce(opened, { channel: "ev:token", key: KEY, text: "llo" })
  assert.equal(continued.blocks.length, 1, "同 id 续写（不叠块）")
  assert.equal(continued.blocks[0].text, "hello")
  assert.equal(reduce(continued, { channel: "ev:token", key: KEY, text: "" }), continued, "空文本 ⇒ 零写")
  assert.equal(reduce(continued, { channel: "ev:token", key: "9", text: "x" }), continued, "非活动会话 ⇒ 零写")

  // R3c · D19：`ev:reasoning` —— 推理块增量（续写判据 = 尾块 `kind === "reasoning"`；IPC.md §1 该行）
  const thought = reduce(continued, { channel: "ev:reasoning", key: KEY, text: "想" })
  assert.deepEqual(thought.blocks.at(-1), { kind: "reasoning", id: `live-${continued.blocks.length}`, text: "想" }, "新推理块（助手块后起 —— 尾块非 reasoning）")
  const more = reduce(thought, { channel: "ev:reasoning", key: KEY, text: "更多" })
  assert.equal(more.blocks.length, thought.blocks.length, "同块续写（不叠块）")
  assert.equal(more.blocks.at(-1).text, "想更多", "推理文本累积")
  assert.equal(reduce(more, { channel: "ev:reasoning", key: KEY, text: "" }), more, "空文本 ⇒ 零写")
  assert.equal(reduce(more, { channel: "ev:reasoning", key: "9", text: "x" }), more, "非活动会话 ⇒ 零写")
  assert.equal(reduce(more, { channel: "ev:reasoning", key: KEY, text: null }), more, "非串文本 ⇒ 零写（不落槽）")

  const called = reduce(continued, { channel: "ev:tool-call", key: KEY, id: "t1", name: "read_file", argsSummary: "a.mjs" }, 1000)
  assert.deepEqual(called.blocks.at(-1), {
    kind: "tool", id: "t1", name: "read_file", argsSummary: "a.mjs", status: "running", startedAt: 1000,
  }, "活块形（含 startedAt）")
  assert.equal(called.pool.blocks, undefined, "**R3b 摘工具行**：工具块入流 ⇒ 池切片零写（工具调用面 = 对话流工具卡）")
  assert.equal(called.pool.running, 0, "折叠头 `running` 读数不再源于工具行（子 agent 块面源）")

  const regrown = reduce(called, { channel: "ev:token", key: KEY, text: "again" })
  assert.equal(regrown.blocks.length, 3, "尾块非 assistant·streaming ⇒ 新回合起块")
  assert.equal(regrown.blocks.at(-1).kind, "assistant")

  const streamed = reduce(called, { channel: "ev:tool-output", key: KEY, id: "t1", chunk: "line1\n" })
  assert.equal(streamed.blocks.at(-1).result, "line1\n", "输出累积入 result")
  assert.equal(reduce(streamed, { channel: "ev:tool-output", key: KEY, id: "zz", chunk: "x" }), streamed, "无匹配块 ⇒ 零写")

  const settled = reduce(streamed, { channel: "ev:tool-result", key: KEY, id: "t1", result: "line1\nok", ok: true }, 1400)
  assert.deepEqual(Object.keys(settled.blocks.at(-1)).sort(),
    ["argsSummary", "durationMs", "id", "kind", "name", "result", "status"], "结果块键集收束（丢 startedAt）")
  assert.equal(settled.blocks.at(-1).status, "done")
  assert.equal(settled.blocks.at(-1).durationMs, 400, "时长 = 现刻 − 起刻")
  assert.equal(settled.pool.blocks, undefined, "结果收尾 ⇒ 池零写（同摘工具行）")
  assert.equal(settled.pool.running, 0)

  const worded = reduce(settled, { channel: "ev:tool-result", key: KEY, id: "t1", result: "Error: boom", ok: true }, 1500)
  assert.equal(worded.blocks.at(-1).status, "done", "宿主 `ok` 为准：正文 `Error:` 前缀不改判（本端不解析正文）")
  const keyless = reduce(worded, { channel: "ev:tool-result", key: KEY, id: "t1", result: "ok" }, 1600)
  assert.equal(keyless.blocks.at(-1).status, "error", "载荷缺 `ok` 键 ⇒ 不判成功（不猜）")
  const failed = reduce(keyless, { channel: "ev:error", key: KEY, message: "boom" })
  assert.deepEqual(failed.blocks.at(-1), { kind: "error", text: "boom" })
  for (const block of failed.blocks) assert.ok(KINDS.includes(block.kind), `五型闭集：${block.kind}`)
})

test("U88 回合态 + 位标码集：三码置清四组 + 错误径结算 / 闭集 / 他键 / 回合槽两值", () => {
  const blank = stateOf()
  const turn = reduce(blank, { channel: "ev:activity", key: KEY, event: "turn", n: 1, max: 3 }, 700)
  assert.deepEqual(turn.tabBadges[KEY], ["running"], "回合起 ⇒ 置 running")
  assert.deepEqual(turn.turns[KEY], { n: 1, max: 3 }, "回合槽落 n / max（D17 段 7 —— 有意取代旧「不落」态）")
  assert.equal(turn.turnStarts[KEY], 700, "回合起刻 = turn 首帧现刻（D17 段 5 耗时源）")
  assert.deepEqual(turn.sessionMeta, {}, "sessionMeta 零 turn 键")
  assert.equal(reduce(turn, { channel: "ev:activity", key: KEY, event: "turn", n: 1, max: 3 }, 900), turn, "同帧重复（同 n/max ∧ 起刻不改）⇒ 原引用")

  const done = reduce(turn, { channel: "ev:activity", key: KEY, event: "done" })
  assert.deepEqual(done.tabBadges[KEY], ["done"], "回合尾 ⇒ 去 running + 置 done")
  const stopped = reduce(turn, { channel: "ev:activity", key: KEY, event: "stopped" })
  assert.deepEqual(stopped.tabBadges[KEY], ["done"], "stopped 同律")

  const opened = reduce(blank, { channel: "ev:approval", key: KEY, promptId: "p1", shape: "single" })
  assert.deepEqual(opened.tabBadges[KEY], ["approval"], "入项 ⇒ 置 approval")
  const cleared = clearApproval(opened, "p1")
  assert.deepEqual(cleared.tabBadges[KEY], [], "末项摘除 ⇒ 清 approval")
  assert.equal(clearApproval(cleared, "p1"), cleared, "未命中 ⇒ 原引用（幂等）")

  const read = openSession(done, KEY)
  assert.deepEqual(read.tabBadges[KEY], [], "键激活 ⇒ 清本键 done")
  assert.equal(openSession(read, KEY), read, "无变化 ⇒ 原引用")

  const other = reduce(blank, { channel: "ev:activity", key: "9", event: "turn" })
  assert.deepEqual(other.tabBadges["9"], ["running"], "他键可写")
  assert.equal(other.tabBadges[KEY], undefined, "他键零影响")

  const inline = reduce(turn, { channel: "ev:activity", key: KEY, event: "done", fields: "x\x1e1" })
  assert.equal(inline, turn, "内联形（fields 在场）⇒ 零写（零回合尾）")
  assert.deepEqual(turn.tabBadges[KEY], ["running"], "内联 done ⇒ 位标不清")
  assert.equal(reduce(blank, { channel: "ev:activity", key: KEY, event: "queued" }), blank, "表外事件名（无 fields）⇒ 零写")
  const asked = reduce(blank, { channel: "ev:question", key: KEY, promptId: "q1", question: "?", options: [] })
  assert.deepEqual(Object.keys(asked.questions), [KEY], "提问通道 ⇒ 写本键切片（他键零写）")
  const planned = reduce(blank, { channel: "ev:task", key: KEY, items: [{ title: "t" }] })
  assert.deepEqual(Object.keys(planned.tasks), [KEY], "计划通道 ⇒ 写本键切片（他键零写）")

  // 错误径（回合尾三径之三 —— `onError` 无条件结算本键位标；块面仍守键门）
  const errored = reduce(turn, { channel: "ev:error", key: KEY, message: "boom" })
  assert.deepEqual(errored.tabBadges[KEY], ["done"], "错误径 ⇒ 去 running + 置 done（与 done / stopped 同结算）")
  assert.deepEqual(errored.blocks.at(-1), { kind: "error", text: "boom" }, "错误块入流（活动会话）")
  const twice = reduce(errored, { channel: "ev:error", key: KEY, message: "again" })
  assert.deepEqual(twice.tabBadges[KEY], ["done"], "再入错误 ⇒ 位标不动（去重幂等）")
  assert.equal(twice.blocks.length, errored.blocks.length + 1, "位标幂等 ≠ 块面幂等（错误块照入）")

  const otherErr = reduce(turn, { channel: "ev:error", key: "9", message: "x" })
  assert.deepEqual(otherErr.tabBadges["9"], ["done"], "他键错误 ⇒ 该键自结算")
  assert.deepEqual(otherErr.tabBadges[KEY], ["running"], "他键错误 ⇒ 本键位标零影响（位标任意键可写 · 键域）")
  assert.equal(otherErr.blocks, turn.blocks, "非活动会话 ⇒ 块面零写（结算 ≠ 入流：键门仍在）")
  assert.equal(reduce(otherErr, { channel: "ev:error", key: "9", message: "y" }), otherErr, "位标已结算 ∧ 块面不落 ⇒ 原引用（幂等）")

  for (const code of [done, stopped, opened, errored].flatMap((state) => Object.values(state.tabBadges).flat())) {
    assert.ok(BADGES.includes(code), `码集 ⊆ 闭集：${code}`)
  }
})

test("U89 标题刷新 + 回合尾窄口 + sessionMeta：三径各恰一次 / 窄口同刻 / meta 三行矩阵", async () => {
  const handlers = new Map()
  const calls = []
  const on = (channel, handler) => {
    handlers.set(channel, handler)
    return () => handlers.delete(channel)
  }
  const store = createStore(initialState())
  const invoke = (...args) => {
    calls.push(args)
    return Promise.resolve({ rows: [{ key: "1", title: "T" }] })
  }
  let tails = []
  const off = attachEvents({ on, store, invoke, onTurnTail: (key) => { tails.push(key) } })
  assert.equal(handlers.size, 18, "十八通道全订阅（R3b 增 `ev:subagent` · R3c 增 `ev:reasoning` · 「对齐第二批」增 `ev:subchunk` · 「桌面空闲唤醒」增 `ev:susp` ∕ `ev:digest` · 「对齐第三批」增 `ev:ledger` · timer-wake 阶段 2 增 `ev:timer` · 「回合中插入」增 `ev:queue`）")

  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 1, max: 2 })
  await tick()
  assert.deepEqual(calls, [], "回合起 ⇒ 零重调")
  assert.deepEqual(tails, [], "回合起 ⇒ 窄口零动")

  handlers.get("ev:activity")({ key: KEY, event: "done" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"]], "回合尾 `done` ⇒ sessions:list 恰一次（单参逐字）")
  assert.deepEqual(tails, [KEY], "回合尾 `done` ⇒ 窄口恰一次 ∧ **携回合尾事件键**（窄口存续 —— 输入区 flush 携行随「回合中插入」批退场）")
  assert.deepEqual(store.get().sessions, [{ key: "1", title: "T" }], "行随动入态")

  handlers.get("ev:activity")({ key: KEY, event: "stopped" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"], ["sessions:list"]], "回合尾两形（`done` / `stopped`）皆刷新 · 各恰一次")
  assert.deepEqual(tails, [KEY, KEY], "回合尾两形皆触窄口（键逐次携入）")

  handlers.get("ev:activity")({ key: KEY, event: "done", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "stopped", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: null })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: undefined })
  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 2, max: 2 })
  handlers.get("ev:approval")({ key: KEY, promptId: "p1", shape: "single" })
  await tick()
  assert.equal(calls.length, 2, "内联形（值：串 / null / undefined —— 键在场即内联）/ 回合起 / 他通道 ⇒ 零重调")
  assert.deepEqual(tails, [KEY, KEY], "内联形（键在场）/ 回合起 / 他通道 ⇒ 窄口零动")

  handlers.get("ev:error")({ key: KEY, message: "boom" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"], ["sessions:list"], ["sessions:list"]], "错误径（三径之三）⇒ 刷新恰一次")
  assert.deepEqual(tails, [KEY, KEY, KEY], "错误径 ⇒ 窄口同刻恰一次（判据单源 = `isTurnTail`）")

  off()
  assert.equal(handlers.size, 0, "退订句柄十八路全退")

  // 窄口非函数（批档 §1.14：未接线调用面合法 ⇒ 零抛零动作 · 标题刷新不受累）
  const bareHandlers = new Map()
  const bareCalls = []
  const offBare = attachEvents({
    on: (channel, handler) => { bareHandlers.set(channel, handler); return () => bareHandlers.delete(channel) },
    store: createStore(initialState()),
    invoke: (...args) => { bareCalls.push(args); return Promise.resolve({ rows: [] }) },
    onTurnTail: 42,
  })
  bareHandlers.get("ev:activity")({ key: KEY, event: "done" })
  await tick()
  assert.deepEqual(bareCalls, [["sessions:list"]], "非函数窄口：零抛 + 标题刷新照常（两出口同触发点 · 各司其职）")
  offBare()
  assert.equal(bareHandlers.size, 0, "第二实例退订十三路全退（实例隔离）")

  const page = (meta) => applyPage(
    stateOf({ history: { hasOlder: true, inFlight: true, page: 200 } }),
    { ok: true, messages: [], hasOlder: false, next: null, meta },
    { key: KEY, before: 200 },
  )
  const full = Object.fromEntries(META_FIELDS.map((field) => [field, `v-${field}`]))
  assert.deepEqual(page(full).sessionMeta[KEY], full, "三键原样写入（会话头三值 —— 两模式位撤出本投影）")
  const mixed = { provider: "", model: 7, effort: "low", engineering: "ON", autoApprove: "OFF" }
  assert.deepEqual(page(mixed).sessionMeta[KEY], { effort: "low" }, "空串 / 非串 ⇒ 该键不落 · 表外两键（模式位）零写")
  assert.deepEqual(page({}).sessionMeta[KEY], {}, "全缺 ⇒ {}")
})

test("T-DSK24 卡面两切片：首写自种 / 同键就地替换 / clearQuestion / stopped 终局摘项", () => {
  const blank = stateOf()
  assert.equal(blank.questions, undefined, "原态零 `questions` 槽（首写自种）")

  const asked = reduce(blank, { channel: "ev:question", key: KEY, promptId: "q1", question: "选哪个？", options: ["a", "b"], text: "表外键" })
  assert.deepEqual(Object.keys(asked.questions), [KEY], "本键自种（他键零写）")
  assert.deepEqual(asked.questions[KEY], { promptId: "q1", question: "选哪个？", options: ["a", "b"] }, "载荷三键原样（表外键不落）")
  assert.deepEqual(asked.tabBadges[KEY], ["approval"], "待作答 ⇒ 本键位标含 `approval`（与 `onApproval` 同形）")
  assert.equal(blank.questions, undefined, "纯写：原态零改")

  const respoken = reduce(asked, { channel: "ev:question", key: KEY, promptId: "q2", question: "改主意？", options: [] })
  assert.deepEqual(Object.keys(respoken.questions), [KEY], "同键就地替换（零叠条）")
  assert.equal(respoken.questions[KEY].promptId, "q2", "新载荷覆旧值")

  const otherKey = reduce(asked, { channel: "ev:question", key: "9", promptId: "q9", question: "x" })
  assert.deepEqual(Object.keys(otherKey.questions).sort(), [KEY, "9"], "他键写他键槽")
  assert.deepEqual(otherKey.questions[KEY], asked.questions[KEY], "他键事件 ⇒ 本键切片零写")
  assert.deepEqual(otherKey.tabBadges[KEY], ["approval"], "本键位标零动")

  const cleared = clearQuestion(otherKey, "9")
  assert.equal("9" in cleared.questions, false, "摘本键项")
  assert.deepEqual(cleared.tabBadges["9"], [], "清本键 `approval` 位")
  assert.deepEqual(cleared.questions[KEY], asked.questions[KEY], "他键切片零动")
  assert.equal(clearQuestion(cleared, "9"), cleared, "无本键项 ⇒ 原引用（幂等）")
  assert.equal(clearQuestion(asked, "7"), asked, "非本键 ⇒ 原引用")
  const approvalOnly = reduce(blank, { channel: "ev:approval", key: KEY, promptId: "p1", shape: "single", tool: "write" })
  assert.deepEqual(approvalOnly.tabBadges[KEY], ["approval"], "审批项置本键位标")
  assert.equal(clearQuestion(approvalOnly, KEY), approvalOnly, "零提问项 ⇒ 原引用（码清随项摘 ⇒ 不误清审批码）")

  const busy = reduce(asked, { channel: "ev:activity", key: KEY, event: "turn" })
  assert.deepEqual(busy.tabBadges[KEY], ["approval", "running"], "回合起叠加本键位标")
  const halted = reduce(busy, { channel: "ev:activity", key: KEY, event: "stopped" })
  assert.equal(KEY in halted.questions, false, "`stopped` 终局 ⇒ 事件面摘本键提问项")
  assert.deepEqual(halted.tabBadges[KEY], ["done"], "清 `approval` + 去 `running` + 置 `done`")
  assert.equal(KEY in reduce(asked, { channel: "ev:activity", key: KEY, event: "done" }).questions, true, "`done` 径不摘项")

  const items = [{ title: "一", status: "queued" }]
  const planned = reduce(blank, { channel: "ev:task", key: KEY, items })
  assert.deepEqual(planned.tasks[KEY], items, "载荷逐字原样")
  assert.equal(planned.questions, undefined, "两切片互不牵动")
  assert.deepEqual(reduce(planned, { channel: "ev:task", key: KEY, items: [] }).tasks[KEY], [], "同键就地替换（空列表 = 消费面零节点，槽仍在）")
  assert.deepEqual(reduce(planned, { channel: "ev:task", key: KEY, items: "x" }).tasks[KEY], [], "非数组 ⇒ `[]`（防御读形）")
  assert.deepEqual(Object.keys(planned.tasks), [KEY], "他键零写")
})

test("T-DSK29 占用读数：按 key 写切片 / 有效读数门（未至 · 非正 · 非数 ⇒ 原引用）/ 同值原引用 / 十八通道接线", async () => {
  const blank = stateOf()
  const seeded = reduce(blank, { channel: "ev:usage", key: KEY, percent: 42 })
  assert.deepEqual(seeded.usage, { [KEY]: 42 }, "按会话 key 写切片（值 = `percent` 原样）")
  assert.deepEqual(blank.usage, {}, "纯写：原态零改")
  const bare = stateOf()
  delete bare.usage
  assert.deepEqual(reduce(bare, { channel: "ev:usage", key: KEY, percent: 7 }).usage, { [KEY]: 7 }, "槽缺 ⇒ 首写自种（`?? {}`）")

  assert.equal(reduce(seeded, { channel: "ev:usage", key: KEY, percent: 42 }), seeded, "同键同值 ⇒ 原引用（零重绘）")
  assert.deepEqual(reduce(seeded, { channel: "ev:usage", key: KEY, percent: 80 }).usage, { [KEY]: 80 }, "同键新值 ⇒ 就地替换")
  assert.deepEqual(reduce(seeded, { channel: "ev:usage", key: "9", percent: 5 }).usage, { [KEY]: 42, 9: 5 }, "他键写他键槽（本键零写）")
  for (const percent of [0, -1, NaN, "42", null, undefined, true]) {
    assert.equal(reduce(seeded, { channel: "ev:usage", key: KEY, percent }), seeded, `门外值 ⇒ 原引用（未至 / 非正 / 非数：${String(percent)}）`)
  }
  assert.deepEqual(seeded.usage, { [KEY]: 42 }, "门外反复 ⇒ 切片零写（零节点）")

  const handlers = new Map()
  const store = createStore(initialState())
  const off = attachEvents({
    on: (channel, handler) => { handlers.set(channel, handler); return () => handlers.delete(channel) },
    store,
    invoke: () => Promise.resolve({}),
  })
  assert.equal(handlers.size, 18, "十八通道全订阅（R3b 增 `ev:subagent` · R3c 增 `ev:reasoning` · 「对齐第二批」增 `ev:subchunk` · 「桌面空闲唤醒」增 `ev:susp` ∕ `ev:digest` · 「对齐第三批」增 `ev:ledger` · timer-wake 阶段 2 增 `ev:timer` · 「回合中插入」增 `ev:queue`）")
  assert.ok(handlers.has("ev:usage"), "订阅含 `ev:usage`")
  assert.ok(handlers.has("ev:subagent"), "订阅含 `ev:subagent`（D20 块面）")
  assert.ok(handlers.has("ev:reasoning"), "订阅含 `ev:reasoning`（D19 推理块）")
  assert.ok(handlers.has("ev:subchunk"), "订阅含 `ev:subchunk`（「对齐第二批」项 3 内容面）")
  assert.ok(handlers.has("ev:susp") && handlers.has("ev:digest"), "订阅含两新通道（挂起计数面 ∕ 消化轮边界面 —— 与 `thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` 同册）")
  assert.ok(handlers.has("ev:queue"), "订阅含 `ev:queue`（排队面两形 —— 与桥面白名单同册）")
  handlers.get("ev:usage")({ key: KEY, percent: 42 })
  assert.deepEqual(store.get().usage, { [KEY]: 42 }, "通道 → 归约 → store 落态")
  handlers.get("ev:usage")({ key: KEY, percent: null })
  assert.deepEqual(store.get().usage, { [KEY]: 42 }, "门外载荷 ⇒ 状态零动（原引用不落 store）")
  handlers.get("ev:susp")({ key: KEY, active: true, running: 1 })
  assert.deepEqual(store.get().susp[KEY], { active: true, running: 1, queued: 0, pending: 0, done: 0 }, "两新通道同径：`ev:susp` → 归约 → store 落态（计数切片）")
  off()
  assert.equal(handlers.size, 0, "十八路全退")
})

test("#459 游标清点两族（回合尾三径 / 段界 ev:tool-call ⇒ 零 `streaming` 真项 ∧ 新块对象；非活动键 / 无命中 ⇒ 块面零写）", () => {
  const live = reduce(stateOf(), { channel: "ev:token", key: KEY, text: "he" })
  assert.equal(live.blocks[0].streaming, true, "对照臂：活块带游标")
  const tails = [[{ event: "done" }, "done"], [{ event: "stopped" }, "stopped"], [{ channel: "ev:error", message: "boom" }, "ev:error"]]
  for (const [over, name] of tails) {
    const after = reduce(live, { channel: "ev:activity", key: KEY, ...over })
    assert.equal(after.blocks.some((block) => block.streaming === true), false, `回合尾 ${name} ⇒ 归约态零 streaming 真项`)
    assert.notEqual(after.blocks[0], live.blocks[0], `回合尾 ${name} ⇒ 清点落块面引用（新块对象 ⇒ 帧触发摘锚）`)
  }
  const seg = reduce(live, { channel: "ev:tool-call", key: KEY, id: "t1", name: "read_file" }, 1000)
  assert.deepEqual([seg.blocks[0].streaming, seg.blocks.at(-1).kind], [false, "tool"], "段界（`ev:tool-call` 入场）⇒ 前序助手段游标清 ∧ 工具块照落（两事不同块）")
  const idle = stateOf({ blocks: [{ kind: "user", text: "x" }] })
  assert.deepEqual([reduce(idle, { channel: "ev:activity", key: KEY, event: "done" }).blocks, reduce(live, { channel: "ev:activity", key: "9", event: "done" }).blocks], [idle.blocks, live.blocks], "无游标命中 ∥ 非活动键回合尾 ⇒ 块面引用不变（零写两臂）")
})

test("U193 挂起 / 消化两通道归约（桌面空闲唤醒 · T-DSK41）：`ev:susp` 计数切片（四值 + `active` 归一 · 同键就地替换 · 同值原引用）· `ev:digest` 消化行切片（起跑 / 终态两态 · `end` 原地更新保起跑 `n`）", () => {
  const blank = stateOf()
  // ① `ev:susp` —— 按会话 `key` 写切片（首写自种 · 同键就地替换 · 零键门，与 `usage` 同形）
  const one = reduce(blank, { channel: "ev:susp", key: KEY, active: true, running: 2, queued: 1, pending: 1, done: 0 })
  assert.deepEqual(one.susp, { [KEY]: { active: true, running: 2, queued: 1, pending: 1, done: 0 } }, "四计数 + `active` 原样入切片（核 `backgroundCounts` 直传形）")
  assert.deepEqual(blank.susp, undefined, "纯写：原态零改（首写自种）")
  assert.equal(reduce(one, { channel: "ev:susp", key: KEY, active: true, running: 2, queued: 1, pending: 1, done: 0 }), one, "同键同值 ⇒ 原引用（零重绘）")
  const exit = reduce(one, { channel: "ev:susp", key: KEY, active: false, running: 0, queued: 0, pending: 0, done: 0 })
  assert.deepEqual([exit.susp[KEY].active, exit.susp[KEY].running], [false, 0], "退出帧 ⇒ 同键就地替换（`active:false` + 清零 —— 段回落两态词）")
  assert.deepEqual(Object.keys(reduce(one, { channel: "ev:susp", key: "9", active: true }).susp).sort(), ["1", "9"], "他键写他键槽")
  assert.deepEqual(reduce(blank, { channel: "ev:susp", key: KEY, active: "yes", running: NaN, queued: 0, pending: "2", done: null }).susp[KEY],
    { active: false, running: 0, queued: 0, pending: 0, done: 0 }, "`active` 只收严格真 · 四计数非数 ⇒ 归一 0（不落 `NaN` ∥ 字面入词面）")
  // ② `ev:digest` —— 起跑 / 终态两态（`end` **原地更新本键游标**：保留起跑 `n` —— 终态句需 n）
  const start = reduce(blank, { channel: "ev:digest", key: KEY, status: "start", n: 3 })
  assert.deepEqual(start.digest[KEY], { status: "start", n: 3, tier: null, from: null, msg: null }, "起跑态落切片（`n` = 起跑 pending 数）")
  assert.equal(reduce(start, { channel: "ev:digest", key: KEY, status: "start", n: 3 }), start, "同键同值 ⇒ 原引用")
  const ask = reduce(blank, { channel: "ev:digest", key: KEY, status: "start", n: 0, tier: "ask", from: "coder#2", msg: "要不要改？" })
  assert.deepEqual([ask.digest[KEY].tier, ask.digest[KEY].from, ask.digest[KEY].msg], ["ask", "coder#2", "要不要改？"], "ask 档随行 `from` / `msg`（核 `upstreamAskLabelVars` 形；`n = 0` 轮照落 —— 零计数行归渲染面）")
  assert.equal(reduce(blank, { channel: "ev:digest", key: KEY, status: "start", n: 1, tier: "other" }).digest[KEY].tier, null, "`tier` 表外值 ⇒ `null`（档位两值闭集）")
  const end = reduce(start, { channel: "ev:digest", key: KEY, status: "end", ok: true, ms: 2500 })
  assert.deepEqual(end.digest[KEY], { status: "end", n: 3, tier: null, from: null, msg: null, ok: true, ms: 2500 }, "终态 ⇒ 原地更新本键游标（**保留起跑 `n`**；`ok` / `ms` 覆写）")
  assert.deepEqual(reduce(blank, { channel: "ev:digest", key: KEY, status: "end", ok: false, ms: 10 }).digest[KEY], { status: "end", ok: false, ms: 10 }, "无起跑帧的裸 `end` ⇒ 照落（渲染面零组 ⇒ 只摘不建；`ok:false` 原样）")
  assert.equal(reduce(end, { channel: "ev:digest", key: KEY, status: "end", ok: true, ms: 2500 }), end, "同值终态 ⇒ 原引用（幂等）")
  assert.equal(reduce(start, { channel: "ev:digest", key: KEY, status: "cap" }), start, "表外 `status` ⇒ 零写（起跑 / 终态两态闭集）")
  assert.equal(reduce(start, { channel: "ev:digest", key: "9", status: "end", ok: true, ms: 1 }).digest[KEY], start.digest[KEY], "他键零扰本键切片")
})

// ─── U204 「对齐第三批」归约面（清扫 / 停止痕 / turnBreak / chunk 清旗 / 载波两处 / 台账行 / 审批两键）───

test("U204: 「对齐第三批」归约 —— interrupted 清扫 · stopMark（页读清点）· turnBreak · chunk 清显式旗 · round/model · techInfo · ledger · approval 两键", () => {
  // ① 中止清扫（项 5）：`stopped` 终局 ⇒ running 工具块就地 `interrupted`（已结算块零扰）；体 / 折叠态不动
  const t1 = reduce(stateOf(), { channel: "ev:tool-call", key: KEY, id: "t1", name: "Bash", argsSummary: "sleep 10" }, 1000)
  const t2 = reduce(t1, { channel: "ev:tool-call", key: KEY, id: "t2", name: "Read", argsSummary: "a.mjs" }, 1100)
  const settled = reduce(t2, { channel: "ev:tool-result", key: KEY, id: "t2", ok: true, result: "ok" }, 1200)
  const stopped = reduce(settled, { channel: "ev:activity", key: KEY, event: "stopped" })
  assert.deepEqual(stopped.blocks.map((block) => block.status), ["interrupted", "done"], "running ⇒ interrupted ∥ 已结算块零扰")
  assert.deepEqual(Object.keys(stopped.blocks[0]).includes("result"), false, "未结算块零结果 / 零展开键改（体 / 折叠态不动）")
  assert.equal(stopped.stopMark[KEY], true, "停止痕切片落本键（项 6）")
  assert.deepEqual(stopped.tabBadges[KEY], ["done"], "回合尾位标照常（去 `running` 置 `done`）")
  assert.equal(reduce(stopped, { channel: "ev:activity", key: KEY, event: "stopped" }), stopped, "同键痕已在场 ⇒ 原引用（零重绘）")
  const other = reduce(stopped, { channel: "ev:activity", key: "9", event: "stopped" })
  assert.deepEqual(other.blocks.map((block) => block.status), ["interrupted", "done"], "非活动键：本键块面零写")
  assert.equal(other.stopMark["9"], true, "痕面非块面 ⇒ 任意键可写（不设键门）")
  // 停止痕清点（项 6 · 页读整置即失）：首屏页读 ⇒ 摘本键痕；非首屏（回填）⇒ 零动作
  const reread = applyPage(stopped, { ok: true, messages: [], hasOlder: false, next: null, meta: {} }, { key: KEY, before: null })
  assert.equal(reread.stopMark[KEY], undefined, "首屏页读 ⇒ 停止痕清点（**运行期痕 —— 非落盘件**）")
  const otherReread = applyPage(other, { ok: true, messages: [], hasOlder: false, next: null, meta: {} }, { key: KEY, before: null })
  assert.equal(otherReread.stopMark["9"], true, "他键痕零扰（清点只及本键）")
  const backfill = applyPage(stopped, { ok: true, messages: [{ kind: "user", text: "old" }], hasOlder: false, next: 1, meta: {} }, { key: KEY, before: 40 })
  assert.equal(backfill.stopMark[KEY], true, "回填径（`before` 在场）⇒ 痕不动（清点只在整置径）")

  // ② 子回合边界（项 7）：`turnBreak` ⇒ **清游标**（尾部流式块收束）；非回合尾（位标 / 痕面零动）
  const streaming = reduce(stateOf(), { channel: "ev:token", key: KEY, text: "片" })
  assert.equal(streaming.blocks.at(-1).streaming, true, "夹具：流式游标在场")
  const cut = reduce(streaming, { channel: "ev:activity", key: KEY, event: "turnBreak" })
  assert.deepEqual([cut.blocks.at(-1).streaming, cut.blocks.at(-1).text], [false, "片"], "清游标 ⇒ 同块去 `streaming`（文面不动 —— 下片起新块）")
  assert.equal(cut.tabBadges[KEY], undefined, "**非回合尾**：位标零动（三径判据不含本形）")
  assert.equal(cut.stopMark, undefined, "非回合尾：痕面零写")
  assert.equal(reduce(cut, { channel: "ev:activity", key: KEY, event: "turnBreak" }), cut, "已清 ⇒ 原引用（无命中）")
  assert.equal(reduce(streaming, { channel: "ev:activity", key: "9", event: "turnBreak" }), streaming, "非活动键 ⇒ 块面零写（键门）")

  // ③ chunk 清显式折叠旗（项 3）：`ev:tool-output` ⇒ `expanded` 键摘除（运行期展开由增量驱动）
  const folded = reduce(stateOf(), { channel: "ev:tool-call", key: KEY, id: "t9", name: "Bash", argsSummary: "x" }, 1)
  const manual = { ...folded, blocks: folded.blocks.map((block) => ({ ...block, expanded: false })) }
  const chunked = reduce(manual, { channel: "ev:tool-output", key: KEY, id: "t9", chunk: "line" })
  assert.equal("expanded" in chunked.blocks.at(-1), false, "chunk 到达 ⇒ 显式折叠旗清（`expanded` 键摘除）")
  assert.equal(chunked.blocks.at(-1).result, "line", "结果照累（累积语义不动）")

  // ④ 轮次载波（项 14）：`round` / `model` 在场才落块键（缺 ⇒ 键缺席 —— 禁假造）
  const advisor = reduce(stateOf(), { channel: "ev:tool-call", key: KEY, id: "a1", name: "advisor", argsSummary: "review", round: 2, model: "gpt-x" }, 5)
  assert.deepEqual([advisor.blocks.at(-1).round, advisor.blocks.at(-1).model], [2, "gpt-x"], "advisor 两键入块")
  const plain = reduce(stateOf(), { channel: "ev:tool-call", key: KEY, id: "b1", name: "Bash", argsSummary: "x" }, 5)
  assert.deepEqual(["round" in plain.blocks.at(-1), "model" in plain.blocks.at(-1)], [false, false], "无载荷 ⇒ 两键缺席")
  assert.deepEqual(["round" in reduce(stateOf(), { channel: "ev:tool-call", key: KEY, name: "advisor", round: 0 }).blocks.at(-1)], [false], "非正 `round` ⇒ 不落（不造事实）")
  const settledAdvisor = reduce(advisor, { channel: "ev:tool-result", key: KEY, id: "a1", ok: true, result: "R" }, 9)
  assert.deepEqual([settledAdvisor.blocks.at(-1).round, settledAdvisor.blocks.at(-1).model], [2, "gpt-x"], "收束 ⇒ 两键原样承接（同块换态 —— 轮次段结果到达后不消失）")
  const settledPlain = reduce(plain, { channel: "ev:tool-result", key: KEY, id: "b1", ok: true, result: "R" }, 9)
  assert.deepEqual(["round" in settledPlain.blocks.at(-1), "model" in settledPlain.blocks.at(-1)], [false, false], "无载波块收束 ⇒ 两键仍缺席（零 `undefined` 键）")

  // ⑤ `techInfo` 载波（项 9）：`ev:error` 在场才落块键；错误径仍判回合尾（位标 + 游标）
  const err = reduce(stateOf(), { channel: "ev:error", key: KEY, message: "崩", techInfo: "at x" })
  assert.deepEqual([err.blocks.at(-1).kind, err.blocks.at(-1).text, err.blocks.at(-1).techInfo], ["error", "崩", "at x"], "裁荷三键入块")
  assert.deepEqual(err.tabBadges[KEY], ["done"], "错误径 = 回合结算（三径同判据）")
  assert.equal(reduce(stateOf(), { channel: "ev:error", key: KEY, message: "崩" }).blocks.at(-1).techInfo, undefined, "缺 `techInfo` ⇒ 键缺席")

  // ⑥ 台账行切片（项 12）：行集过滤 + 原样（warn 归一严格真）+ 同值原引用 + 按键分槽；空集 / 缺 ⇒ 零写
  const ledger = reduce(stateOf(), { channel: "ev:ledger", key: KEY, lines: [{ text: "变化", warn: false }, { text: "明细", warn: true }] })
  assert.deepEqual(ledger.ledgerLines[KEY], [{ text: "变化", warn: false }, { text: "明细", warn: true }], "行集逐字入切片（`{text,warn}` 归一）")
  assert.equal(reduce(ledger, { channel: "ev:ledger", key: KEY, lines: [{ text: "变化", warn: false }, { text: "明细", warn: true }] }), ledger, "同值（文本 + warn 真值同）⇒ 原引用")
  assert.deepEqual(reduce(ledger, { channel: "ev:ledger", key: "9", lines: [{ text: "他键" }] }).ledgerLines["9"], [{ text: "他键", warn: false }], "他键写他键槽（按会话键分槽）")
  const blank = stateOf()
  assert.equal(reduce(blank, { channel: "ev:ledger", key: KEY, lines: [] }), blank, "空行集 ⇒ 零写（禁假造）")
  assert.equal(reduce(blank, { channel: "ev:ledger", key: KEY, lines: [{ warn: true }, { text: "" }] }), blank, "行文本非串 / 空 ⇒ 逐行弃（净空 ⇒ 零写）")

  // ⑦ 审批载荷两键（相抵① / 外围 1）：`owner` / `diff` 入条目（白名单两键 —— 卡面增量载波）
  const gate = reduce(stateOf(), { channel: "ev:approval", key: KEY, promptId: "p1", shape: "single", tool: "apply_patch", owner: "coder#2", diff: { patch: "@@ -1 +1 @@" }, extra: "drop" })
  assert.deepEqual(Object.keys(gate.pool.approvals[0]).sort(), ["diff", "owner", "promptId", "shape", "tool"], "白名单四键 + 两新键（表外键零落）")
  assert.deepEqual(gate.pool.approvals[0].diff, { patch: "@@ -1 +1 @@" }, "`diff` 原样透传（核 `diffInfo`）")
  assert.equal("owner" in reduce(stateOf(), { channel: "ev:approval", key: KEY, promptId: "p2", shape: "batch" }).pool.approvals[0], false, "缺键 ⇒ 条目不落（零 `undefined` 键）")
})

// ─── U220「回合中插入」排队面归约（镜面两形 · 消费回执交接 · 首屏重建 · 降级码切片）────

test("U220: `ev:queue` 归约（状态形镜面整置 ∕ 消费回执形 ⇒ 镜面 + 用户块 + 降级码切片）· `history:page` 首屏重建", () => {
  const blank = stateOf()
  // ① 状态形：本键镜面整置（幂等 —— 同值原引用；非数组 / 坏键 ⇒ 零写）
  const one = reduce(blank, { channel: "ev:queue", key: KEY, items: [{ text: "排队一", ts: 11 }] })
  assert.deepEqual(one.pending[KEY], [{ text: "排队一", ts: 11 }], "状态形 ⇒ 本键镜面整置（权威 = 宿主）")
  assert.equal(reduce(one, { channel: "ev:queue", key: KEY, items: [{ text: "排队一", ts: 11 }] }), one, "同值 ⇒ 原引用（幂等）")
  assert.equal(reduce(one, { channel: "ev:queue", key: KEY, items: "x" }), one, "非数组 ⇒ 零写（形不合）")
  assert.equal(reduce(one, { channel: "ev:queue", items: [{ text: "x" }] }), one, "坏键 ⇒ 零写")
  assert.deepEqual(reduce(one, { channel: "ev:queue", key: KEY, items: [{ text: "排队一", ts: NaN }] }).pending[KEY],
    [{ text: "排队一", ts: null }], "`ts` 非有限数 ⇒ `null`（禁假造）")
  assert.deepEqual(reduce(one, { channel: "ev:queue", key: "9", items: [{ text: "他键", ts: 1 }] }).pending["9"], [{ text: "他键", ts: 1 }], "按会话键分槽")

  // ② 消费回执形（键门 = 活动会话）：镜面整置 + 用户块入流 + 降级码切片
  const stopped = reduce(one, { channel: "ev:activity", key: KEY, event: "done" })
  const withFollowOff = { ...stopped, following: false, pendingNew: 3 }
  const receipt = reduce(withFollowOff, { channel: "ev:queue", key: KEY, items: [], delivered: { text: "排队一", ts: 11, degraded: "partial" } })
  assert.deepEqual(receipt.pending[KEY], [], "镜面整置（空快照）")
  assert.deepEqual(receipt.blocks.at(-1), { kind: "user", text: "排队一", ts: 11 }, "用户块入流（尾块 = user —— 回放同形）")
  assert.deepEqual([receipt.following, receipt.pendingNew], [true, 0], "并笔回底（直发 ∕ 回执两径同判）")
  assert.deepEqual(receipt.attachDegraded, { [KEY]: "partial" }, "降级码切片置位（提示面载波）")
  const cleaned = reduce(receipt, { channel: "ev:queue", key: KEY, items: [], delivered: { text: "下一条", ts: 12 } })
  assert.deepEqual(cleaned.attachDegraded, {}, "下次回执无 `degraded` ⇒ 清键（零残留）")

  // 非活动键：镜面 + 降级码照写（切回即见），块面零写（键门）
  const away = reduce({ ...stateOf(), activeSession: "9" }, { channel: "ev:queue", key: KEY, items: [], delivered: { text: "非活动条目", ts: 1, degraded: "non-vision" } })
  assert.equal(away.blocks.length, 0, "键门：非活动会话 ⇒ 零块写")
  assert.deepEqual(away.pending[KEY], [], "非活动键镜面照整置")
  assert.deepEqual(away.attachDegraded, { [KEY]: "non-vision" }, "非活动键降级码照写（切回即见）")

  // ③ 首屏重建（`history:page` 回执 `queue` 键）· 回填读不重建 · 键缺 ⇒ 零写
  const first = applyPage(stateOf({ pending: { [KEY]: [{ text: "旧镜面", ts: 1 }] } }),
    { ok: true, messages: [], hasOlder: false, next: null, meta: null, flags: null, queue: [{ text: "宿主队项", ts: 7 }] }, { key: KEY, before: null })
  assert.deepEqual(first.pending[KEY], [{ text: "宿主队项", ts: 7 }], "首屏读 ⇒ 镜面重建（冷启 ∕ 重载面）")
  const backfill = applyPage(stateOf({ pending: { [KEY]: [{ text: "活镜面", ts: 2 }] } }),
    { ok: true, messages: [], hasOlder: true, next: 0, meta: null, flags: null, queue: [{ text: "旧值", ts: 1 }] }, { key: KEY, before: 100 })
  assert.deepEqual(backfill.pending[KEY], [{ text: "活镜面", ts: 2 }], "回填读不重建（防在途快照覆盖活镜面）")
  const absent = applyPage(stateOf(), { ok: true, messages: [], hasOlder: false, next: null, meta: null, flags: null }, { key: KEY, before: null })
  assert.deepEqual(absent.pending, {}, "回执无 `queue` 键 ⇒ 零写（防御读形 —— 禁假造）")
})

