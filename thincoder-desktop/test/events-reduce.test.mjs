/**
 * events-reduce.test.mjs — E-4 事件归约面用例（批档 §2.4 U87–U89 · 本批新档 · 300 行拆分层落形：
 * 页应用与审批面出档 `test/events-page.test.mjs`）：
 *   ① 块流写者（U87）· ② 回合态与位标码集（U88）· ③ 标题刷新与 `sessionMeta`（U89）。
 * 平 node 直测：零 DOM · 零 electron · 零网 —— 假 `on`（订阅捕获）+ 假 `invoke`（调用记账 · 载荷逐字）。
 * 词面零字面：断言只钉结构锚（`data-*` / 键集 / 引用等值），不引文案副本。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { applyPage, clearApproval, openSession, reduce } from "../renderer/events.mjs"
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

test("U88 回合态 + 位标码集：三码置清四组 / 闭集 / 他键 / 零 turn 键", () => {
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
  assert.equal(reduce(blank, { channel: "ev:question", key: KEY, text: "?" }), blank, "订阅在场 ≠ 写切片")
  assert.equal(reduce(blank, { channel: "ev:task", key: KEY, text: "t" }), blank)

  for (const code of [done, stopped, opened].flatMap((state) => Object.values(state.tabBadges).flat())) {
    assert.ok(BADGES.includes(code), `码集 ⊆ 闭集：${code}`)
  }
})

test("U89 标题刷新 + sessionMeta：收尾恰一次 / meta 五行矩阵", async () => {
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
  const off = attachEvents({ on, store, invoke })
  assert.equal(handlers.size, 9, "九通道全订阅")

  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 1, max: 2 })
  await tick()
  assert.deepEqual(calls, [], "回合起 ⇒ 零重调")

  handlers.get("ev:activity")({ key: KEY, event: "done" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"]], "回合尾 `done` ⇒ sessions:list 恰一次（单参逐字）")
  assert.deepEqual(store.get().sessions, [{ key: "1", title: "T" }], "行随动入态")

  handlers.get("ev:activity")({ key: KEY, event: "stopped" })
  await tick()
  assert.deepEqual(calls, [["sessions:list"], ["sessions:list"]], "回合尾两形（`done` / `stopped`）皆刷新 · 各恰一次")

  handlers.get("ev:activity")({ key: KEY, event: "done", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "stopped", fields: "x" })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: null })
  handlers.get("ev:activity")({ key: KEY, event: "done", fields: undefined })
  handlers.get("ev:activity")({ key: KEY, event: "turn", n: 2, max: 2 })
  handlers.get("ev:approval")({ key: KEY, promptId: "p1", shape: "single" })
  await tick()
  assert.equal(calls.length, 2, "内联形（值：串 / null / undefined —— 键在场即内联）/ 回合起 / 他通道 ⇒ 零重调")

  off()
  assert.equal(handlers.size, 0, "退订句柄九路全退")

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
