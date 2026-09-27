/**
 * events-reduce.test.mjs — E-4 事件归约面用例（批档 §2.4 U87–U89 · 本批新档 · 300 行拆分层落形：
 * 页应用与审批面出档 `test/events-page.test.mjs`）：
 *   ① 块流写者（U87）· ② 回合态与位标码集（U88）· ③ 标题刷新 + 回合尾 flush 窄口与 `sessionMeta`（U89）·
 *   ④ 卡面两切片与提问出场（T-DSK24 —— 批 A 归约半：`ev:question` / `ev:task` 写切片 · `clearQuestion` · `stopped` 终局摘项）·
 *   ⑤ 占用读数归约（T-DSK29 —— 批 B：`ev:usage` 按会话 `key` 写切片 · 有效读数门〔数字且 > 0〕· 同值原引用 ·
 *      订阅面含 `ev:usage`）。
 * 平 node 直测：零 DOM · 零 electron · 零网 —— 假 `on`（订阅捕获）+ 假 `invoke`（调用记账 · 载荷逐字）。
 * 词面零字面：断言只钉结构锚（`data-*` / 键集 / 引用等值），不引文案副本。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { applyPage, clearApproval, clearQuestion, openSession, reduce } from "../renderer/events.mjs"
import { attachEvents } from "../renderer/events-subscribe.mjs"
import { createStore, initialState } from "../renderer/store.mjs"

const KEY = "1"
/** 块五型（闭集 —— 页块面与活块面同集）。 */
const KINDS = ["user", "assistant", "reasoning", "tool", "error"]
/** 位标码闭集（§2.2(e) 值面写者表）。 */
const BADGES = ["running", "approval", "done"]
/** `sessionMeta` 五行（名单与 `views/chrome.mjs` 同名）。 */
const META_FIELDS = ["provider", "model", "effort", "engineering", "autoApprove"]

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

  const called = reduce(continued, { channel: "ev:tool-call", key: KEY, id: "t1", name: "read_file", argsSummary: "a.mjs" }, 1000)
  assert.deepEqual(called.blocks.at(-1), {
    kind: "tool", id: "t1", name: "read_file", argsSummary: "a.mjs", status: "running", startedAt: 1000,
  }, "活块形（含 startedAt）")
  assert.deepEqual(called.pool.blocks, [{ id: "t1", tool: "read_file", status: "running" }], "池条目形 = {id,tool,status}")
  assert.equal(called.pool.running, 1, "读数随动")

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
  assert.deepEqual(settled.pool.blocks, [{ id: "t1", tool: "read_file", status: "done" }], "池条目随动")
  assert.equal(settled.pool.running, 0)

  const worded = reduce(settled, { channel: "ev:tool-result", key: KEY, id: "t1", result: "Error: boom", ok: true }, 1500)
  assert.equal(worded.blocks.at(-1).status, "done", "宿主 `ok` 为准：正文 `Error:` 前缀不改判（本端不解析正文）")
  const keyless = reduce(worded, { channel: "ev:tool-result", key: KEY, id: "t1", result: "ok" }, 1600)
  assert.equal(keyless.blocks.at(-1).status, "error", "载荷缺 `ok` 键 ⇒ 不判成功（不猜）")
  const failed = reduce(keyless, { channel: "ev:error", key: KEY, message: "boom" })
  assert.deepEqual(failed.blocks.at(-1), { kind: "error", text: "boom" })
  for (const block of failed.blocks) assert.ok(KINDS.includes(block.kind), `五型闭集：${block.kind}`)
})

test("U88 回合态 + 位标码集：三码置清四组 + 错误径结算 / 闭集 / 他键 / 零 turn 键", () => {
  const blank = stateOf()
  const turn = reduce(blank, { channel: "ev:activity", key: KEY, event: "turn", n: 1, max: 3 })
  assert.deepEqual(turn.tabBadges[KEY], ["running"], "回合起 ⇒ 置 running")
  assert.equal("n" in turn, false, "n 无槽 ⇒ 不落（禁造键）")
  assert.equal("max" in turn, false, "max 无槽 ⇒ 不落")
  assert.deepEqual(turn.sessionMeta, {}, "sessionMeta 零 turn 键")
  assert.equal(reduce(turn, { channel: "ev:activity", key: KEY, event: "turn", n: 2, max: 3 }), turn, "位标已在 ⇒ 原引用")

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

test("U89 标题刷新 + 回合尾窄口 + sessionMeta：三径各恰一次 / 窄口同刻 / meta 五行矩阵", async () => {
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
  let tails = 0
  const off = attachEvents({ on, store, invoke, onTurnTail: () => { tails += 1 } })
  assert.equal(handlers.size, 10, "十通道全订阅")

  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 1, max: 2 })
  await tick()
  assert.deepEqual(calls, [], "回合起 ⇒ 零重调")
  assert.equal(tails, 0, "回合起 ⇒ 窄口零动")

  handlers.get("ev:activity")({ key: KEY, event: "done" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"]], "回合尾 `done` ⇒ sessions:list 恰一次（单参逐字）")
  assert.equal(tails, 1, "回合尾 `done` ⇒ 窄口恰一次（与标题刷新同触发点）")
  assert.deepEqual(store.get().sessions, [{ key: "1", title: "T" }], "行随动入态")

  handlers.get("ev:activity")({ key: KEY, event: "stopped" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"], ["sessions:list"]], "回合尾两形（`done` / `stopped`）皆刷新 · 各恰一次")
  assert.equal(tails, 2, "回合尾两形皆触窄口")

  handlers.get("ev:activity")({ key: KEY, event: "done", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "stopped", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: null })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: undefined })
  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 2, max: 2 })
  handlers.get("ev:approval")({ key: KEY, promptId: "p1", shape: "single" })
  await tick()
  assert.equal(calls.length, 2, "内联形（值：串 / null / undefined —— 键在场即内联）/ 回合起 / 他通道 ⇒ 零重调")
  assert.equal(tails, 2, "内联形（键在场）/ 回合起 / 他通道 ⇒ 窄口零动")

  handlers.get("ev:error")({ key: KEY, message: "boom" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"], ["sessions:list"], ["sessions:list"]], "错误径（三径之三）⇒ 刷新恰一次")
  assert.equal(tails, 3, "错误径 ⇒ 窄口同刻恰一次（判据单源 = `isTurnTail`）")

  off()
  assert.equal(handlers.size, 0, "退订句柄十路全退")

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
  assert.equal(bareHandlers.size, 0, "第二实例退订十路全退（实例隔离）")

  const page = (meta) => applyPage(
    stateOf({ history: { hasOlder: true, inFlight: true, page: 200 } }),
    { ok: true, messages: [], hasOlder: false, next: null, meta },
    { key: KEY, before: 200 },
  )
  const full = Object.fromEntries(META_FIELDS.map((field) => [field, `v-${field}`]))
  assert.deepEqual(page(full).sessionMeta[KEY], full, "五键原样写入")
  const mixed = { provider: "", model: 7, effort: "low", engineering: null, autoApprove: {} }
  assert.deepEqual(page(mixed).sessionMeta[KEY], { effort: "low" }, "空串 / 非串 ⇒ 该键不落")
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

test("T-DSK29 占用读数：按 key 写切片 / 有效读数门（未至 · 非正 · 非数 ⇒ 原引用）/ 同值原引用 / 十通道接线", async () => {
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
  assert.equal(handlers.size, 10, "十通道全订阅")
  assert.ok(handlers.has("ev:usage"), "订阅含 `ev:usage`")
  handlers.get("ev:usage")({ key: KEY, percent: 42 })
  assert.deepEqual(store.get().usage, { [KEY]: 42 }, "通道 → 归约 → store 落态")
  handlers.get("ev:usage")({ key: KEY, percent: null })
  assert.deepEqual(store.get().usage, { [KEY]: 42 }, "门外载荷 ⇒ 状态零动（原引用不落 store）")
  off()
  assert.equal(handlers.size, 0, "十路全退")
})
