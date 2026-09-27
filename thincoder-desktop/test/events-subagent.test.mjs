/**
 * events-subagent.test.mjs — R3b `ev:subagent` 归约面直测（`docs/desktop/design/UI.md` §1 本批注项 2 块态机 ·
 * `docs/render-core/design/RENDER-CORE.md` §5 状态机族；`docs/desktop/design/PROJECT.md` §7 T-DSK36 ①/②/④/⑤；
 * 批档 §2 ㈢/㈤）：
 *   U166 归约写入：按会话键分槽（`subBlocks[key]`）· 五类射程同径 · 闭集过滤（表外 status / 身份缺 / 坏键 ⇒
 *        零写）· 键白名单（内容字段不入块 —— 零内容回显）· 折叠头 `running` 随动（仅活动会话）；
 *   U167 块态机三迁 + 归档 + 摘工具行：出生（queued / started）→ 逐轮帧 → 终态折叠（done / settled /
 *        cancelled ⇒ frozen + 用时源）→ **归档** = 该会话下一次「回合起」清终态（非活动键零清）；工具行不入池
 *        （`pool` / `subBlocks` 引用零动）。
 * 平 node 直测：零 DOM / 零 IPC（态机单源 = 核 `/rc/subblocks/state.mjs`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { reduce, openSession } from "../renderer/events.mjs"
import { initialState } from "../renderer/store.mjs"

const KEY = "1"
const stateOf = (patch = {}) => ({ ...initialState(), activeSession: KEY, activeTab: KEY, ...patch })
/** 归约一笔（`ev:subagent` 载荷形 —— 与桥面出站同形）。 */
const sub = (state, payload, now = 1000) => reduce(state, { channel: "ev:subagent", key: KEY, ...payload }, now)
const listOf = (state, key = KEY) => state.subBlocks[key] ?? []
/** 内容回显哨兵（载荷携内容字段亦不得入块面）。 */
const ECHO = ["秘密正文", "秘密推理", "秘密输出"]

// ─── U166 归约写入（分槽 · 闭集 · 白名单 · 读数）──────────────────

test("U166: 归约写入（按会话键分槽 · 五类同径 · 闭集过滤 · 键白名单零内容 · 读数随动）", () => {
  const blank = stateOf()
  const five = [
    { status: "started", role: "eng-coder", id: 1, pool: false, model: "m1", startedAt: 10, syncLive: true }, // sync spawn
    { status: "started", role: "coder", id: 2, pool: true, model: "m2", startedAt: 20 }, // async 池
    { status: "started", role: "consult", id: 3, pool: false, model: "m3", startedAt: 30 }, // consult
    { status: "started", role: "escalate", id: 4, pool: true, model: "m4", startedAt: 40 }, // escalate
    { status: "started", role: "advisor", id: 5, pool: true, model: "m5", startedAt: 50 }, // advisor-async
  ]
  let state = blank
  for (const payload of five) state = sub(state, payload)
  assert.deepEqual(listOf(state).map((block) => [block.role, block.id, block.status, block.pool]), [
    ["eng-coder", 1, "running", false], ["coder", 2, "running", true], ["consult", 3, "running", false],
    ["escalate", 4, "running", true], ["advisor", 5, "running", true],
  ], "五类射程同径出生（块面零角色过滤 —— 凭 relay 前缀出场）")
  assert.equal(state.pool.running, 5, "折叠头 `running` = 活动会话在飞块数（供给面写者）")
  assert.equal(listOf(state)[0].syncLive, true, "sync 可中止事实随载荷（停止钮闸门源）")

  // 键白名单：内容字段不入块（零内容回显 —— 载荷多携字段被丢弃）
  const echoed = sub(blank, { status: "started", role: "coder", id: 9, pool: true, text: ECHO[0], reasoning: ECHO[1], result: ECHO[2] })
  const dump = JSON.stringify(echoed.subBlocks)
  for (const marker of ECHO) assert.equal(dump.includes(marker), false, `键白名单：${marker} 不入块面`)

  // 闭集过滤（禁假造）：表外 status / 身份缺 / 坏键 ⇒ 原引用（零写）
  assert.equal(sub(blank, { status: "error", role: "coder", id: 1 }), blank, "表外 status（`error` 有意不载）⇒ 零写")
  assert.equal(sub(blank, { status: "approval", role: "coder", id: 1, tool: "bash" }), blank, "表外 status（approval）⇒ 零写")
  assert.equal(sub(blank, { status: "started", id: 1 }), blank, "缺 role ⇒ 零写")
  assert.equal(sub(blank, { status: "started", role: "coder" }), blank, "缺 id ⇒ 零写")
  assert.equal(sub(blank, {}), blank, "缺 status ⇒ 零写")
  assert.equal(reduce(blank, { channel: "ev:subagent", status: "started", role: "coder", id: 1 }), blank, "缺 key ⇒ 零写")
  assert.equal(reduce(blank, { channel: "ev:subagent", key: "", status: "started", role: "coder", id: 1 }), blank, "空 key ⇒ 零写")

  // 分槽与读数键域：非活动会话事件 ⇒ 他键块表写入 · 本键读数不动
  const other = sub(state, { status: "started", role: "coder", id: 7, pool: true }, 2000)
  const otherKeyed = reduce(other, { channel: "ev:subagent", key: "2", status: "started", role: "coder", id: 8, pool: true }, 2000)
  assert.equal(listOf(otherKeyed, "2").length, 1, "他键块表独立写入（按会话键分槽）")
  assert.equal(otherKeyed.pool.running, other.pool.running, "非活动键事件 ⇒ 活动会话读数零动")
  assert.equal(otherKeyed.subBlocks[KEY], other.subBlocks[KEY], "本键块表引用不变（分槽隔离）")

  // 折叠头读数随块面（终态折叠 ⇒ 读数回落）
  const folded = sub(other, { status: "done", role: "coder", id: 2 }, 3000)
  assert.equal(folded.pool.running, other.pool.running - 1, "一例折叠 ⇒ 读数 −1（活动会话在飞计数）")

  // 折叠头读数随活动键重算（openSession 面 —— 头（读数）与体（族）单源；防跨会话残留）
  const twoKeys = { ...folded, subBlocks: { ...folded.subBlocks, "2": [{ key: "sub:coder#8", role: "coder", id: 8, status: "running", frozen: false, startedAt: 5, queued: false, pool: true, syncLive: false }] } }
  assert.equal(openSession(twoKeys, "2").pool.running, 1, "切到键 2 ⇒ 读数 = 该键在飞块数（1）")
  assert.equal(openSession(twoKeys, KEY).pool.running, twoKeys.pool.running, "切回本键 ⇒ 读数 = 本键在飞块数（同值 ⇒ 池引用不动）")
  assert.equal(openSession(twoKeys, null).pool.running, 0, "关页 ⇒ 读数归 0（none 态两读数本不显 —— 切片定形）")
})

// ─── U167 块态机三迁 + 归档 + 摘工具行 ────────────────────────────

test("U167: 块态机三迁（出生 / 逐轮 / 终态折叠）+ 归档（回合起清终态）+ 摘工具行（池引用零动）", () => {
  // ① queued 出生 ⇒ ② started ⇒ ③ turn ⇒ ④ done 折叠（同一实例全链）
  let state = sub(stateOf(), { status: "queued", role: "coder", id: 1, kind: "slot", position: 2 }, 1000)
  const born = listOf(state)[0]
  assert.deepEqual([born.status, born.queued, born.queueInfo.kind, born.queueInfo.position], ["queued", true, "slot", 2], "出生 = queued（排队信息入块级活态）")
  assert.equal(born.startedAt, 1000, "出生即落起刻（排队期不计用时 —— 视图面按 `queued` 判）")
  state = sub(state, { status: "started", role: "coder", id: 1, pool: true, model: "m1", startedAt: 1500 }, 2000)
  assert.deepEqual([listOf(state)[0].status, listOf(state)[0].queued, listOf(state)[0].queueInfo, listOf(state)[0].model], ["running", false, null, "m1"], "started ⇒ 转运行（排队信息清 · 型号入块头）")
  state = sub(state, { status: "turn", role: "coder", id: 1, turn: 2, maxTurns: 8 }, 3000)
  assert.deepEqual([listOf(state)[0].turn, listOf(state)[0].maxTurns], [2, 8], "逐轮帧 ⇒ 回合两值入块（块头 N/M 源）")
  state = sub(state, { status: "done", role: "coder", id: 1 }, 4000)
  const folded = listOf(state)[0]
  assert.deepEqual([folded.status, folded.frozen, folded.doneAt], ["done", true, 4000], "终态折叠（就地收敛：终态词 + 用时源 = `doneAt`）")
  assert.equal(state.pool.running, 0, "折叠 ⇒ 读数回落")

  // settled / cancelled 两终态同径折叠（`⟦ev⟧stopped` ⇒ cancelled 的映射在桥面 —— 本面收闭集码）
  const settled = sub(state, { status: "settled", role: "coder", id: 2 })
  assert.deepEqual([listOf(settled).at(-1).status, listOf(settled).at(-1).frozen], ["done", true], "settled ⇒ 折叠（kind = done）")
  const cancelled = sub(state, { status: "cancelled", role: "coder", id: 3 })
  assert.deepEqual([listOf(cancelled).at(-1).status, listOf(cancelled).at(-1).frozen], ["cancelled", true], "cancelled ⇒ 折叠（终态词 = 已停止）")

  // 归档 = 该会话下一次「回合起」清出已终态块（修既有池切片单调增长）；在飞块与新键存活
  const mixed = sub(sub(state, { status: "started", role: "explore", id: 9, pool: true }), { status: "done", role: "explore", id: 8 })
  assert.equal(listOf(mixed).length, 3, "夹具：一在飞 + 两终态共存")
  const turned = reduce(mixed, { channel: "ev:activity", key: KEY, event: "turn", n: 3, max: 20 }, 5000)
  assert.deepEqual(listOf(turned).map((block) => block.id), [9], "回合起 ⇒ 已终态块清出（在飞块存活）")
  assert.equal(turned.pool.running, 1, "归档后读数 = 剩余在飞块数")
  assert.deepEqual(turned.turns[KEY], { n: 3, max: 20 }, "同笔回合槽照写（D17 段 7 零回归 · 归约双面同帧）")

  // 非活动键回合起 ⇒ 本键块表零清；无终态可清 ⇒ `subBlocks` 原引用（零帧）
  const foreign = reduce(mixed, { channel: "ev:activity", key: "2", event: "turn", n: 1, max: 5 }, 5000)
  assert.equal(foreign.subBlocks, mixed.subBlocks, "他键回合起 ⇒ 本键块表零动（归档按会话键）")
  assert.equal(reduce(turned, { channel: "ev:activity", key: KEY, event: "turn", n: 4, max: 20 }, 6000).subBlocks, turned.subBlocks, "无可清 ⇒ 块表原引用（零帧）")

  // 摘工具行：工具三事件不再触池（`pool` / `subBlocks` 引用零动 —— 工具面 = 对话流工具卡）
  const call = reduce(mixed, { channel: "ev:tool-call", key: KEY, id: "t1", name: "read", argsSummary: "a.mjs" }, 6000)
  assert.equal(call.pool, mixed.pool, "工具调用 ⇒ 池切片引用零动（摘工具行后零池写）")
  assert.equal(call.subBlocks, mixed.subBlocks, "工具调用 ⇒ 块表引用零动")
  assert.equal(call.blocks.length, mixed.blocks.length + 1, "工具块照入对话流（零回归）")
  const result = reduce(call, { channel: "ev:tool-result", key: KEY, id: "t1", ok: true, result: "ok" }, 7000)
  assert.equal(result.pool, mixed.pool, "工具收尾 ⇒ 池切片引用零动")
  assert.equal(result.subBlocks, mixed.subBlocks, "工具收尾 ⇒ 块表引用零动")
})
