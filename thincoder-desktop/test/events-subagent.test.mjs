/**
 * events-subagent.test.mjs — R3b `ev:subagent` 归约面直测（`docs/desktop/design/UI.md` §1 本批注项 2 块态机 ·
 * `docs/render-core/design/RENDER-CORE.md` §5 状态机族；`docs/desktop/design/PROJECT.md` §7 T-DSK36 ①/②/④/⑤；
 * 批档 §2 ㈢/㈤）：
 *   U166 归约写入：按会话键分槽（`subBlocks[key]`）· 五类射程同径 · 闭集过滤（表外 status / 身份缺 / 坏键 ⇒
 *        零写）· 键白名单（内容字段不入块 —— 内容面单源 = `ev:subchunk`）· 折叠头 `running` 随动（仅活动会话）；
 *   U167 块态机三迁 + 归档入流 + 摘工具行：出生（queued / started）→ 逐轮帧 → 终态折叠（done / settled /
 *        cancelled ⇒ frozen + 用时源）→ **归档入流**（「对齐第二批」项 5：终态 ⇒ 表项墓碑 `region:"flow"` ∧
 *        流内尾追块 `kind:"subagent"`；settled 驻留不归档；旧代接管归档；**下回合起不清出**——原口径退场）；
 *        工具行不入池（`pool` / `subBlocks` 引用零动）；
 *   U168 `ev:subchunk` 归约（「对齐第二批」项 3）：内容行入块模型 `rows`（重挂重放单源）· 行白名单 ·
 *        冻结 / 缺块 / 形不合 ⇒ 零写；键白名单（`ev:subagent` 载荷不载内容）。
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

test("U167: 块态机三迁（出生 / 逐轮 / 终态折叠）+ 归档入流（墓碑 + 流内尾追 · 下回合不清出）+ 摘工具行（池引用零动）", () => {
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

  // 归档入流（「对齐第二批」项 5 · KD-33）：终态 ⇒ ① 表项墓碑（`region: "flow"` —— 池内退场）② 流内尾追块
  assert.equal(folded.region, "flow", "终态 ⇒ 表项墓碑（`region: \"flow\"` —— 读面按 region 过滤 = 池内退场）")
  assert.equal("rows" in folded, false, "内容随快照单留存（墓碑不再持 `rows`）")
  const flow = state.blocks.at(-1)
  assert.deepEqual([flow.kind, flow.meta.key, flow.meta.frozen, flow.rows], ["subagent", "sub:coder#1", true, []], "流内尾追块（`kind: \"subagent\"` · `meta` = 冻结块快照 · `rows` = 内容行）")

  // 三迁之二：settled（**已出生块**折叠）驻留池内不归档；后到 done ⇒ 归档
  const settledLive = sub(state, { status: "started", role: "coder", id: 2, pool: true, model: "m2" }, 4500)
  const settled = sub(settledLive, { status: "settled", role: "coder", id: 2 }, 4800)
  const resident = listOf(settled).at(-1)
  assert.deepEqual([resident.status, resident.frozen, resident.awaitingDigest, resident.region], ["done", true, true, undefined], "settled ⇒ 折叠 + 驻留（不归档：`region` 缺省）")
  assert.equal(settled.blocks.length, state.blocks.length, "settled ⇒ 零流内块（驻留待消化）")
  const digested = sub(settled, { status: "done", role: "coder", id: 2 }, 4900)
  assert.equal(listOf(digested).at(-1).region, "flow", "后到 done ⇒ 归档（驻留块入流）")
  assert.equal(digested.blocks.at(-1).meta.key, "sub:coder#2", "归档序入流（尾追）")
  const cancelled = sub(state, { status: "cancelled", role: "coder", id: 3 })
  assert.deepEqual([listOf(cancelled).at(-1).status, listOf(cancelled).at(-1).frozen, listOf(cancelled).at(-1).region], ["cancelled", true, "flow"], "cancelled ⇒ 折叠 + 归档（终态词 = 已停止）")

  // 三迁之三：旧代接管即归档（settled 驻留块被新代替出 ⇒ 归档 + 新代出生）
  const settledGen = sub(sub(state, { status: "started", role: "coder", id: 5, pool: true, model: "m5" }, 5000), { status: "settled", role: "coder", id: 5 }, 5100)
  const reborn = sub(settledGen, { status: "started", role: "coder", id: 5, pool: true, model: "m5" }, 6000)
  const nextGen = listOf(reborn).find((block) => block.id === 5)
  assert.deepEqual([nextGen.status, nextGen.frozen, nextGen.model], ["running", false, "m5"], "接管 ⇒ 新代在飞（同键）")
  assert.equal(reborn.blocks.at(-1).meta.key, "sub:coder#5", "旧代驻留块归档入流（接管即归档 —— 前后对照捕获）")
  assert.equal(reborn.blocks.filter((block) => block.meta.key === "sub:coder#5").length, 1, "恰一块（不重复补桩）")

  // 下回合起**不再清出**（原「回合起清终态」口径退场 —— 对拍）：墓碑留场 ∧ 块表引用零动
  const turned = reduce(reborn, { channel: "ev:activity", key: KEY, event: "turn", n: 3, max: 20 }, 7000)
  assert.deepEqual(listOf(turned).map((block) => block.id), listOf(reborn).map((block) => block.id), "回合起 ⇒ 块表零清（墓碑留存）")
  assert.equal(turned.subBlocks[KEY], reborn.subBlocks[KEY], "无可清 ⇒ 块表原引用（零帧）")
  assert.deepEqual(turned.turns[KEY], { n: 3, max: 20 }, "同笔回合槽照写（D17 段 7 零回归 · 归约双面同帧）")

  // 非活动键终态 ⇒ 只落墓碑（流面按会话键 —— 非活动键零入流；端差登记 = 内容随运行期面即失）
  const otherStart = reduce(reborn, { channel: "ev:subagent", key: "2", status: "started", role: "coder", id: 7, pool: true }, 7100)
  const otherDone = reduce(otherStart, { channel: "ev:subagent", key: "2", status: "done", role: "coder", id: 7 }, 7200)
  assert.equal(otherDone.subBlocks["2"][0].region, "flow", "他键终态 ⇒ 墓碑落他键表")
  assert.equal(otherDone.blocks.length, otherStart.blocks.length, "非活动键 ⇒ 不入本会话流（零写）")

  // 摘工具行：工具三事件不再触池（`pool` / `subBlocks` 引用零动 —— 工具面 = 对话流工具卡）
  const call = reduce(reborn, { channel: "ev:tool-call", key: KEY, id: "t1", name: "read", argsSummary: "a.mjs" }, 8000)
  assert.equal(call.pool, reborn.pool, "工具调用 ⇒ 池切片引用零动（摘工具行后零池写）")
  assert.equal(call.subBlocks, reborn.subBlocks, "工具调用 ⇒ 块表引用零动")
  assert.equal(call.blocks.length, reborn.blocks.length + 1, "工具块照入对话流（零回归）")
  const result = reduce(call, { channel: "ev:tool-result", key: KEY, id: "t1", ok: true, result: "ok" }, 9000)
  assert.equal(result.pool, reborn.pool, "工具收尾 ⇒ 池切片引用零动")
  assert.equal(result.subBlocks, reborn.subBlocks, "工具收尾 ⇒ 块表引用零动")
})

// ─── U168 `ev:subchunk` 归约（「对齐第二批」项 3：rows 入模型 · 重挂重放单源）──────

test("U168: `ev:subchunk` 归约（rows 逐条入模型 · 行白名单 · 冻结 / 缺块 / 形不合 ⇒ 零写）", () => {
  const chunk = (state, payload) => reduce(state, { channel: "ev:subchunk", key: KEY, ...payload }, 1000)
  let state = sub(stateOf(), { status: "started", role: "coder", id: 1, pool: true, model: "m1" }, 1500)
  const live = state
  state = chunk(state, { role: "coder", id: 1, kind: "text", text: "正文行", face: "text" })
  assert.deepEqual(listOf(state)[0].rows, [{ kind: "text", text: "正文行", face: "text" }], "内容行入块模型 `rows`（重挂重放单源）")
  state = chunk(state, { role: "coder", id: 1, kind: "tool", text: "bash npm test", tool: "bash", face: "toolCall", cmd: "npm test" })
  assert.deepEqual(listOf(state)[0].rows.at(-1), { kind: "tool", text: "bash npm test", tool: "bash", face: "toolCall", cmd: "npm test" }, "工具面行携结构化 `tool` / `cmd` / `face`（逐字段）")
  state = chunk(state, { role: "coder", id: 1, kind: "think", text: "思考行", face: "think", sub: "explore#2", model: "m9", status: "started" })
  assert.deepEqual(listOf(state)[0].rows.at(-1), { kind: "think", text: "思考行", face: "think", sub: "explore#2" }, "行 = 内容面六键白名单（表外键 / 身份二不入行）")
  assert.deepEqual(listOf(state)[0].rows.map((row) => row.kind), ["text", "tool", "think"], "rows 序 = 到达序（内容行单留存处）")
  assert.equal(state.pool.running, live.pool.running, "rows 追加 ⇒ 读数零动（在飞计数零扰）")

  // 零写三臂：形不合（kind / text 缺）· 缺块（未出生键）· 已冻结（终态块迟来 chunk 不复活）
  assert.equal(chunk(state, { role: "coder", id: 1, kind: "", text: "x" }), state, "kind 空 ⇒ 零写")
  assert.equal(chunk(state, { role: "coder", id: 1, kind: "text" }), state, "text 缺 ⇒ 零写")
  assert.equal(chunk(state, { role: "coder", id: 99, kind: "text", text: "x" }), state, "块未出生 ⇒ 零写（出生面 = `ev:subagent`）")
  assert.equal(reduce(state, { channel: "ev:subchunk", key: "9", kind: "text", text: "x", role: "coder", id: 1 }), state, "非本键会话 ⇒ 零写（分槽隔离）")
  assert.equal(reduce(state, { channel: "ev:subchunk", key: KEY, kind: "text", text: "x", role: "coder" }), state, "缺 id ⇒ 零写")
  assert.equal(reduce(state, { channel: "ev:subchunk", status: "x", kind: "text", text: "x", role: "coder", id: 1 }), state, "缺 key ⇒ 零写")
  const frozen = sub(state, { status: "done", role: "coder", id: 1 }, 2000)
  assert.equal(chunk(frozen, { role: "coder", id: 1, kind: "text", text: "迟来" }), frozen, "已冻结块 ⇒ 迟来 chunk 零写（不复活）")
  assert.equal(chunk(frozen, { role: "coder", id: 1, kind: "text", text: "迟来" }).subBlocks, frozen.subBlocks, "零写 ⇒ 块表引用不变（零帧）")
})
