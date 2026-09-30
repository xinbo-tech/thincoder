/**
 * 2026-09-30-cross-end-digest-recovery.test.mjs — 批内件（跨端消化面恢复批 · 台账 #726 · **核缝面先行舱**）。
 * 判据表 = 批档 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2 §五（核腿）+ §2 三.1（写缝）。
 * 腿族（本舱 = 核面腿；CLI ∥ VSC 腿随另舱同件续加——三面舱互不跨面）：
 *   腿 K1 写缝：`pushRecord` —— digest 三型 ∥ subagent 快照 ⇒ 人读线逐条落录（形 ∥ 序 ∥ `ts`）
 *        + 存储同点追加 + 尾窗驱逐（既有 `ts` 不覆写；先追加后驱逐——磁盘为准）；
 *   腿 K2 机器线零触负控：`agent.history` 零新增（同形 `pushReal` 正控对照——判据可判别）；
 *   腿 K3 尽力面：未绑（模式 F）∥ 存储追加失败 ⇒ 零抛（人读线照常）；载体缺位 ⇒ 零动作（零抛）；
 *   腿 K4 读缝默认关 ⇒ 逐字等价（负控——承 #719 既有腿）；`{ records: true }` opt-in 已备（零改直通）。
 * 机制单源 = `docs/core/design/SESSION.md` §6.26；跑法（仓根 `thincoder/`）：
 *   node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const [core, win] = await Promise.all([
  mod("thincoder-core/context.mjs"), // 核写缝（`pushRecord` ∥ `pushReal`）
  mod("thincoder-core/history-window.mjs"), // 核读缝（`{ records: true }` opt-in——已备零改）
])
const { pushRecord, pushReal } = core
const { historyWindow } = win

// ─── 记录夹具（两族形——单源 = SESSION.md §6.26）──

const startRec = () => ({ kind: "digest", status: "start", n: 2, tier: "ask", from: "upstream", msg: "问句" })
const capRec = () => ({ kind: "digest", status: "cap", mode: "stop", turns: 3 })
const endRec = () => ({ kind: "digest", status: "end", ok: true, ms: 1500 })
const subRec = () => ({
  kind: "subagent",
  meta: { key: "k1", role: "advisor", status: "done" },
  rows: [{ kind: "text", text: "行一" }, { kind: "text", text: "行二" }],
})

test("腿 K1·写缝 pushRecord：两族记录 ⇒ 人读线逐条落录（形 ∥ 序 ∥ ts）∥ 存储同点追加 ∥ 尾窗驱逐", () => {
  const appended = []
  const agent = { cwd: null, history: [], _fullHistory: [], _recordStore: { append: (r) => appended.push(r) }, _historyWindow: 0 }
  for (const r of [startRec(), capRec(), endRec(), subRec()]) pushRecord(agent, r)
  assert.equal(agent._fullHistory.length, 4, "逐条落录（序 = 追加序）")
  assert.deepEqual(
    agent._fullHistory.map((r) => (r.kind === "digest" ? r.status : r.kind)),
    ["start", "cap", "end", "subagent"],
    "形 ∥ 序",
  )
  for (const r of agent._fullHistory) assert.equal(typeof r.ts, "number", "`ts` 打点（与 pushReal 同点语义）")
  assert.equal(agent._fullHistory[0].n, 2, "起跑事实原样（`tier` ∥ `from` ∥ `msg` 随行）")
  assert.equal(agent._fullHistory[3].meta.key, "k1", "subagent 形原样（meta 零改名）")
  assert.equal(agent._fullHistory[3].rows.length, 2, "subagent rows 原样")
  assert.equal(appended.length, 4, "存储追加（`_recordStore.append` 同点）")
  assert.equal(appended[0], agent._fullHistory[0], "存储收到同一记录对象（三面同一形）")

  // 既有 `ts` 保留（打点只在缺省时——pushReal 同语义）
  const frozen = { kind: "digest", status: "end", ok: true, ms: 1, ts: 12345 }
  pushRecord(agent, frozen)
  assert.equal(frozen.ts, 12345, "既有 `ts` 不覆写")

  // 尾窗驱逐（双胞三面之三）：绑定窗口 3 ⇒ 只保最近 3 条；存储已收全量（先追加后驱逐——磁盘为准）
  const wAppended = []
  const winAgent = { history: [], _fullHistory: [], _historyWindow: 3, _recordStore: { append: (r) => wAppended.push(r) } }
  for (let i = 0; i < 5; i++) pushRecord(winAgent, { kind: "digest", status: "end", ok: true, ms: i })
  assert.equal(winAgent._fullHistory.length, 3, "绑定窗口 ⇒ 尾窗驱逐（只保最近窗口条）")
  assert.deepEqual(winAgent._fullHistory.map((r) => r.ms), [2, 3, 4], "弃最旧 ∥ 保尾")
  assert.equal(wAppended.length, 5, "被驱逐记录仍在存储（先追加后驱逐）")
})

test("腿 K2·机器线零触负控：pushRecord ⇒ `agent.history` 零新增 ∥ pushReal 正控触碰（判据可判别）", () => {
  const msg = { role: "user", content: "既有消息", ts: 1 }
  const agent = { history: [msg], _fullHistory: [msg] }
  const historyRef = agent.history
  pushRecord(agent, startRec())
  pushRecord(agent, subRec())
  assert.equal(agent.history, historyRef, "机器线数组引用零换")
  assert.equal(agent.history.length, 1, "记录不入机器线（零新增——不喂模型）")
  assert.deepEqual(agent.history, [msg], "机器线内容逐字不变")
  assert.equal(agent._fullHistory.length, 3, "人读线照常追加（对照臂）")
  // 正控（判别性）：同形直调 pushReal ⇒ 机器线 +1 —— 证明上述断言非空转
  const peer = { history: [{ ...msg }], _fullHistory: [{ ...msg }] }
  pushReal(peer, { role: "assistant", content: "新消息", ts: 2 })
  assert.equal(peer.history.length, 2, "对照：pushReal 触碰机器线（本件判据可判别）")
})

test("腿 K3·尽力面：未绑（模式 F）∥ 存储失败 ⇒ 零抛（人读线照常）；载体缺位 ⇒ 零动作（零抛）", () => {
  // 未绑：`_recordStore` 缺 ⇒ 存储腿空转，人读线照常（模式 F 零回归）
  const unbound = { history: [], _fullHistory: [] }
  assert.doesNotThrow(() => pushRecord(unbound, startRec()))
  assert.equal(unbound._fullHistory.length, 1, "未绑 ⇒ 人读线追加照常")
  assert.equal(unbound.history.length, 0, "未绑 ⇒ 机器线仍零触")
  // 存储追加失败（degraded）⇒ 不阻断（尽力面 N-S6）
  const failing = { history: [], _fullHistory: [], _recordStore: { append() { throw new Error("disk down") } } }
  assert.doesNotThrow(() => pushRecord(failing, endRec()))
  assert.equal(failing._fullHistory.length, 1, "存储失败 ⇒ 人读线照常（尽力面）")
  // 载体缺位（无活跃会话）⇒ 零动作（零抛——日志归端侧）
  assert.doesNotThrow(() => pushRecord(null, startRec()))
  assert.doesNotThrow(() => pushRecord(undefined, capRec()))
  // 载体最小形（无 `_recordStore` ∥ 无 `_historyWindow`——VSC 不绑记录存储）：零窗口驱逐 ∥ 存储腿空转
  const carrier = { _fullHistory: [], history: [] }
  for (let i = 0; i < 5; i++) pushRecord(carrier, { kind: "digest", status: "end", ok: true, ms: i })
  assert.equal(carrier._fullHistory.length, 5, "未绑窗口 ⇒ 零驱逐（全量人读线保持）")
})

test("腿 K4·读缝默认关 ⇒ 逐字等价（负控 · 承 #719）；`{ records:true }` opt-in 已备（零改直通）", () => {
  const msgA = { role: "user", content: "问题", ts: 1 }
  const msgB = { role: "assistant", content: "回答", ts: 2 }
  const msgC = { role: "user", content: "再问", ts: 3 }
  const msgD = { role: "assistant", content: "再答", ts: 4 }
  const mixed = [msgA, startRec(), msgB, subRec(), msgC, endRec(), msgD]
  // 缺 opts ∥ `{}` ∥ `{records:false}` 三径同值（默认关）
  const off = historyWindow(mixed, null, 200)
  assert.deepEqual(historyWindow(mixed, null, 200, {}), off, "空 opts 同默认径")
  assert.deepEqual(historyWindow(mixed, null, 200, { records: false }), off, "`{records:false}` 同默认径")
  // 逐字等价（负控）：默认径输出 = 同形「未知 kind 占位」输出（记录零特殊处理——改前语义）
  const spacers = [msgA, { type: "unknown-1", ts: 1 }, msgB, { type: "unknown-3", ts: 3 }, msgC, { type: "unknown-5", ts: 5 }, msgD]
  for (const [before, pageSize] of [[null, 200], [null, 3], [5, 4], [1, 2]]) {
    assert.equal(
      JSON.stringify(historyWindow(mixed, before, pageSize)),
      JSON.stringify(historyWindow(spacers, before, pageSize)),
      `默认径逐字等价（before=${before} ∥ pageSize=${pageSize}）`,
    )
  }
  // 记录零达 + 邻位计算不受记录影响
  assert.ok(off.messages.every((m) => m.kind !== "digest" && m.kind !== "subagent"), "记录零达（默认关）")
  assert.deepEqual(off.messages.map((m) => m.idx), [0, 2, 4, 6], "idx = 全局位次（记录占位不改）")
  assert.equal(off.messages[1].turnStart, true, "turnStart 跨记录回扫（记录不参与谓词）")
  // 冻结字面（小夹具——逐字面手写基线）
  assert.deepEqual(historyWindow([msgA, startRec(), msgB], null, 200).messages, [
    { kind: "user", text: "问题", timestamp: 1, idx: 0 },
    { kind: "assistant", text: "回答", reasoning: null, timestamp: 2, idx: 2, turnStart: true, tools: [] },
  ], "默认径输出字面（手写基线——逐字）")
  // opt-in 已备（读缝零改——本舱核验在位）
  const on = historyWindow(mixed, null, 200, { records: true })
  const recs = on.messages.filter((m) => m.kind === "digest" || m.kind === "subagent")
  assert.equal(recs.length, 3, "`{records:true}` ⇒ 两型记录原样入窗（占条目位）")
  assert.deepEqual(recs.map((m) => m.idx), [1, 3, 5], "记录携全局 idx（位次面）")
  assert.equal(recs[0].tier, "ask", "digest 形零改名（字段原样）")
  assert.equal(recs[1].meta.key, "k1", "subagent 形零改名（meta ∥ rows 原样）")
})
