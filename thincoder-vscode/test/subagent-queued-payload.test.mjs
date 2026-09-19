/**
 * subagent-queued-payload.test.mjs — §2.22 同族事件载荷双改纪律**机检锚**
 * （端差·机制层端差批 · 批档 `docs/batches/2026-09-20-mechanism-parity-batch.md`
 * §2.22 T-QP1–6 + §2.29 #7(c) 补 `⟦ev⟧stopped` 一档）机器验收。
 *
 * 面 = `⟦ev⟧queued` 载荷链：核单点发射（`thincoder-core/agent-tools/subagent-scheduler.mjs:356`
 * `…⟦ev⟧queued\x1e<kind>\x1e<position>\x1equeued\x1e<detail>`，`kind ∈ {depc, wait, slot}`）
 * → 端壳 `relaySubagentEventToken`（`src/extension/panel-subagent-relay.mjs:105-119`）逐 kind
 * 对表 + 每面板缓存单源（`queuedInfoOf`）→ **五路作废点**（`[model]` started · cancelled ·
 * stopped · settled · done）→ 重生投影（`reassertLiveChildren`）四项同形。纪律行 =
 * `docs/core/design/AGENT-LOOP.md` §6.18「同族事件载荷双改纪律」（改核 kind/字段 ⇒ 同轮改两端
 * 消费面 + 两端用例）。本档 = 端侧那一半的机检锚（发射面只读对拍，零改动）。
 *
 * 手法：真模块直驱（`panel-callbacks.mjs` 转口面 + `suspension.mjs` 投影面）+ 桩面板捕
 * postMessage——零 provider / 零 DOM（`test/subagent-content-relay.test.mjs` 同骨架）。
 *
 * 先红后绿（收口轮 · 2026-09-20）：五路作废点实现已由 #118 R1 落盘 ⇒ 现盘直跑即绿；红痕 =
 * 变异探针（`module.register` 内存 loader 注入 · 零盘面改动；`node --test` 的用例子进程不继承
 * 父侧 `--import` ⇒ 探针走进程内直跑）：① 仅停用 `⟦ev⟧stopped` 路 `forgetQueued` ⇒ T-QP5 恰该路
 * 红（§2.29 #7(c) 的四源表漏 stopped 即此面）；② 五路作废全停用 ⇒ T-QP5 五路
 * 全红；③ 零变异 ⇒ 六例全绿。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { relaySubagentEventToken, queuedInfoOf } from "../src/extension/panel-callbacks.mjs"
import { reassertLiveChildren } from "../src/extension/suspension.mjs"

const RS = "\x1e" // 核载荷分隔符（subagent-scheduler 发射面）

/** 桩面板：`_wvReady: true`（事件面直投门——postSubagentEvent）+ postMessage 捕记数组。 */
function stubPanel(extra = {}) {
  const posted = []
  const p = {
    _wvReady: true,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    ...extra,
  }
  p.posted = posted
  return p
}

const subagentMsgs = (p) => p.posted.filter((m) => m.type === "subagent")
const queuedOf = (p, key) => queuedInfoOf(p, key)
/** 核发射面字面（`subagent-scheduler.mjs:356`——只读对拍；detail 缺省 = slot 空位）。 */
const queuedTok = (head, kind, position, detail = "") => `${head}/⟦ev⟧queued${RS}${kind}${RS}${position}${RS}queued${RS}${detail}`

// ─── T-QP1–3 载荷逐 kind 对表（slot / wait / depc）──────────────────────────────

test("T-QP1 slot：载荷 {status:'queued', kind:'slot', position:2, waiting:null, reason:null}", () => {
  const p = stubPanel()
  assert.equal(relaySubagentEventToken(p, queuedTok("eng-coder#7", "slot", 2)), true,
    "queued token 被识别并消费（不再以裸 token 泄漏）")
  assert.deepEqual(subagentMsgs(p), [
    { type: "subagent", role: "eng-coder", id: 7, status: "queued", kind: "slot", position: 2, waiting: null, reason: null },
  ], "T-QP1 全载荷字段集——slot = 槽满等位：waiting/reason 显式 null（不伪造）")
})

test("T-QP2 wait：{kind:'wait', waiting:'waiting-deps', reason:<detail 原文>}——detail 逐字透传", () => {
  const p = stubPanel()
  const detail = "waiting for: coder#7（域冲突 src/a.mjs）"
  assert.equal(relaySubagentEventToken(p, queuedTok("explore#8", "wait", 1, detail)), true)
  assert.deepEqual(subagentMsgs(p), [
    { type: "subagent", role: "explore", id: 8, status: "queued", kind: "wait", position: 1, waiting: "waiting-deps", reason: detail },
  ], "reason = detail 原文（含中文/全角——零改写；`describeBlockers` 形态）")
})

test("T-QP3 depc：{kind:'depc', waiting:'dependency-cancelled', reason:<detail>}", () => {
  const p = stubPanel()
  const detail = "dependency cancelled: plan#4 — waiting for your decision (cancel this task to release, or AUTO starts it)"
  assert.equal(relaySubagentEventToken(p, queuedTok("coder#9", "depc", 3, detail)), true)
  assert.deepEqual(subagentMsgs(p), [
    { type: "subagent", role: "coder", id: 9, status: "queued", kind: "depc", position: 3, waiting: "dependency-cancelled", reason: detail },
  ], "depc 与 wait 分列（三档状态词各自的 waiting 值）")
})

// ─── T-QP4 缓存单源（queued 消费点同点入缓存——四项与载荷同形）─────────────────

test("T-QP4 缓存单源：queuedInfoOf 四项与载荷逐字段等值（多 key 独立 / 跨面板隔离 / 未消费 ⇒ null）", () => {
  const p = stubPanel()
  const detail = "waiting for: coder#7（域冲突 src/a.mjs）"
  relaySubagentEventToken(p, queuedTok("eng-coder#7", "slot", 2))
  relaySubagentEventToken(p, queuedTok("explore#8", "wait", 1, detail))
  const [slotMsg, waitMsg] = subagentMsgs(p)
  const slotInfo = queuedOf(p, "eng-coder#7")
  const waitInfo = queuedOf(p, "explore#8")
  assert.deepEqual(slotInfo, { kind: "slot", position: 2, waiting: null, reason: null }, "缓存项 = 恰四项（kind / position / waiting / reason）")
  assert.deepEqual(waitInfo, { kind: "wait", position: 1, waiting: "waiting-deps", reason: detail })
  // 单源判据：同点载荷 ⇔ 缓存项逐字段等值（重生投影读同一张表——禁第二套载荷来源）
  for (const [msg, info] of [[slotMsg, slotInfo], [waitMsg, waitInfo]]) {
    for (const f of ["kind", "position", "waiting", "reason"]) {
      assert.deepEqual(info[f], msg[f], `载荷 ${f} ⇔ 缓存 ${f} 同值（单源）`)
    }
  }
  assert.equal(queuedOf(p, "eng-coder#99"), null, "未消费过 queued token 的键 ⇒ null（降级态信号）")
  // 缓存挂面板（WeakMap<panel, Map<role#id, info>>——多面板互不串味）
  const q = stubPanel()
  assert.equal(queuedOf(q, "eng-coder#7"), null, "同一键在另一面板 ⇒ null（跨面板零串味）")
})

// ─── T-QP5 作废点五路逐路（started / cancelled / stopped / settled / done）──────

test("T-QP5 作废点五路逐路：started([model]) / cancelled / stopped / settled / done 各一发 ⇒ 缓存键删除", () => {
  const legs = [
    { name: "started（`[model]`——出生即作废；真实序 = ⟦ev⟧async 标记先行）", pre: [`eng-coder#7/⟦ev⟧async${RS}`], trigger: `eng-coder#7/[model]glm-5.3` },
    { name: "cancelled（queued 取消——出队即终态）", pre: [], trigger: `eng-coder#7/⟦ev⟧cancelled${RS}` },
    { name: "stopped（运行中取消——§2.29 #7(c) 补入路）", pre: [], trigger: `eng-coder#7/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}` },
    { name: "settled", pre: [], trigger: `eng-coder#7/⟦ev⟧settled${RS}0${RS}0${RS}settled${RS}` },
    { name: "done", pre: [], trigger: `eng-coder#7/⟦ev⟧done${RS}0${RS}0${RS}done${RS}` },
  ]
  for (const leg of legs) {
    const p = stubPanel()
    const seeded = { kind: "slot", position: 2, waiting: null, reason: null }
    assert.equal(relaySubagentEventToken(p, queuedTok("eng-coder#7", "slot", 2)), true, `${leg.name}：queued 先到（缓存入位）`)
    assert.deepEqual(queuedOf(p, "eng-coder#7"), seeded, `${leg.name}：前置——缓存已在位`)
    for (const t of leg.pre) {
      assert.equal(relaySubagentEventToken(p, t), true, `${leg.name}：前置 token 消费`)
      // 空转封口：前置（`⟦ev⟧async` 标记）后缓存仍在位 ⇒ 末判的 null 可归因于**触发行**（作废锚）
      assert.deepEqual(queuedOf(p, "eng-coder#7"), seeded, `${leg.name}：前置后缓存仍在位——作废归触发行`)
    }
    assert.equal(relaySubagentEventToken(p, leg.trigger), true, `${leg.name}：作废 token 被识别并消费`)
    assert.equal(queuedOf(p, "eng-coder#7"), null, `${leg.name}：缓存键删除（陈旧项不滞留——queuedInfoOf ⇒ null）`)
  }
  // 邻键零误伤（作废 = 单键删除，非整表清空——同面板他键缓存不受影响）
  const p = stubPanel()
  const detail = "waiting for: coder#7（域冲突 src/a.mjs）"
  relaySubagentEventToken(p, queuedTok("eng-coder#7", "slot", 2))
  relaySubagentEventToken(p, queuedTok("explore#8", "wait", 1, detail))
  relaySubagentEventToken(p, `eng-coder#7/⟦ev⟧stopped${RS}0${RS}0${RS}stopped${RS}`)
  assert.equal(queuedOf(p, "eng-coder#7"), null, "被作废键删除")
  assert.deepEqual(queuedOf(p, "explore#8"), { kind: "wait", position: 1, waiting: "waiting-deps", reason: detail }, "邻键缓存不受影响")
})

// ─── T-QP6 重生投影同形（webview 重载/清屏后再断言——四项取自缓存）───────────────

test("T-QP6 重生投影同形：reassertLiveChildren 四项取自缓存（与中继面载荷全等）+ 缓存缺省降级仅 position", () => {
  const detail = "waiting for: coder#7（域冲突 src/a.mjs）"
  const history = {
    _asyncSubagents: new Map([
      ["7", { id: 7, role: "eng-coder", status: "queued", position: 2 }],
      ["8", { id: 8, role: "explore", status: "queued", position: 1 }],
      ["9", { id: 9, role: "coder", status: "queued", position: 3 }],
      ["10", { id: 10, role: "plan", status: "queued", position: 4 }], // 未消费过 queued token（降级行）
    ]),
    _asyncAdvisors: new Map(),
  }
  const p = stubPanel({ _liveLines: { history, fullHistory: [], cwd: "/proj" } })
  relaySubagentEventToken(p, queuedTok("eng-coder#7", "slot", 2))
  relaySubagentEventToken(p, queuedTok("explore#8", "wait", 1, detail))
  relaySubagentEventToken(p, queuedTok("coder#9", "depc", 3, "dependency cancelled: plan#4"))
  const live = subagentMsgs(p)
  assert.equal(live.length, 3, "三条 queued 中继落 webview")
  assert.equal(reassertLiveChildren(p), 4, "投影 = 池内四条 queued（含无缓存者——降级行在册）")
  const re = subagentMsgs(p).slice(live.length)
  const byId = (list, id) => list.find((m) => m.id === id)
  for (const id of [7, 8, 9]) {
    assert.deepEqual(byId(re, id), byId(live, id), `#${id} 重发载荷与中继面全等（四项 = 同一缓存单源）`)
  }
  assert.deepEqual(byId(re, 10), { type: "subagent", role: "plan", id: 10, status: "queued", position: 4 },
    "降级形：缓存缺省 ⇒ 仅 position（无 waiting / reason / kind——WEBVIEW.md §5.2 降级态）")
})
