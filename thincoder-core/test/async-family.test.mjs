/**
 * async-family.test.mjs — 异步机械族 VSC 侧并入（#94 载体吸收 · #98 interrupt 豁免面）。
 *
 * 双夹具（AGENT-LOOP.md §2.3 载体五字段口径）：CLI 形 = `_asyncSubagents` / `_asyncAdvisors` /
 * `_consultSessions` / `_pendingAsyncResults` / `_asyncTombstones` 直接挂 carrier（agent）；
 * VSC 形 = 同一批字段挂 `carrier.history`（depth-0 数组——agent per-run 重建）。两形必须
 * 同读同写（单点吸收：`carrierField` / `getAsyncPool` / `parkAsyncPending` / 墓碑三函数 /
 * `depInfo` / `nextSubagentId`）。
 *
 * 行为面（#98）：interrupt（Ctrl+I——`reason.interrupt`）不是全停——settle 守卫不判父中止、
 * 条目 controller 链结不逐链中止；普通 abort（Stop / 会话中止）照旧全停语义。
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  getAsyncPool, parkAsyncPending, carrierField, writeTombstone, writeTombstoneTo, tombstoneOf,
  parentAborted, bindChildController, settleAsyncEntry,
} from "../agent-tools/async-settle.mjs"
import { depInfo, describeBlockers, nextSubagentId } from "../agent-tools/subagent-scheduler.mjs"
import { discardAbortedPool } from "../agent-tools/async-discard.mjs"

/** 载体两形：同一字段 × 同一值形（每形各一份全新值——防跨形共享同一数组 / Map）。 */
function carriers(field, makeValue) {
  const own = { history: [], [field]: makeValue() }
  const hist = { history: [] }
  hist.history[field] = makeValue()
  return [own, hist]
}

test("#94 载体吸收：getAsyncPool 两形同读（subagent / advisor / consult 键）", () => {
  for (const [field, role] of [["_asyncSubagents", "subagent"], ["_asyncAdvisors", "advisor"], ["_consultSessions", "consult"]]) {
    const m = new Map([["1", { id: "1" }]])
    const [own, hist] = carriers(field, () => m)
    for (const carrier of [own, hist]) {
      assert.equal(getAsyncPool(carrier, role), m, `${role} @ ${field}`)
    }
    assert.equal(getAsyncPool({ history: [] }, role), null, "无池 ⇒ null")
  }
  // 未知角色归 subagent 池（缺省口径不变）。
  const sub = new Map()
  assert.equal(getAsyncPool({ _asyncSubagents: sub }, "coder"), sub)
})

test("#94 载体吸收：parkAsyncPending 两形同写（同数组 · 幂等 · _inPending）", () => {
  for (const carrier of carriers("_pendingAsyncResults", () => [])) {
    const e = { id: "e1" }
    parkAsyncPending(carrier, e)
    parkAsyncPending(carrier, e) // 幂等（includes 去重）
    const arr = carrierField(carrier, "_pendingAsyncResults")
    assert.equal(arr.length, 1)
    assert.equal(arr[0], e)
    assert.equal(e._inPending, true)
  }
})

test("#94 载体吸收：墓碑两形同写同读 + writeTombstoneTo holder 向", () => {
  for (const carrier of carriers("_asyncTombstones", () => new Map())) {
    writeTombstone(carrier, 5, "cancelled", "eng-coder")
    assert.deepEqual(tombstoneOf(carrier, 5), { status: "cancelled", role: "eng-coder" })
    assert.deepEqual(tombstoneOf(carrier, "5"), { status: "cancelled", role: "eng-coder" }, "字符串 id 同键")
    assert.equal(tombstoneOf(carrier, 99), null)
  }
  const holder = { history: [] }
  writeTombstoneTo(holder, "x", "consumed", "coder")
  assert.deepEqual(tombstoneOf(holder, "x"), { status: "consumed", role: "coder" })
})

test("#43-② U5/U6/U6b（③ 借用规则扩张）：合成 parent 跨调用存活 · CLI 形同容器 · 首写主容器=父字段+载体别名", () => {
  // U5（边界）：合成 parent = { history }（无自有 Map）写 → 另一携同 history 的合成 parent 读
  const H = []
  const writer = { history: H }
  writeTombstone(writer, 7, "cancelled", "explore")
  const reader = { history: H }
  assert.deepEqual(tombstoneOf(reader, 7), { status: "cancelled", role: "explore" }, "跨调用命中（今日 miss——容器落 per-call 对象）")
  assert.deepEqual(tombstoneOf(writer, 7), { status: "cancelled", role: "explore" }, "写侧同读")
  // U6（正常·CLI 形回归）：agent 自有 Map ⇒ 两条读取路径同一容器（A6）
  const cli = { history: [], _asyncTombstones: new Map() }
  writeTombstone(cli, 8, "consumed", "coder")
  assert.equal(cli._asyncTombstones instanceof Map, true)
  assert.equal(carrierField(cli, "_asyncTombstones"), cli._asyncTombstones, "carrierField ≡ 父字段（同一容器）")
  assert.deepEqual(tombstoneOf(cli, 8), { status: "consumed", role: "coder" })
  // U6b（边界·首写腿）：无自有 Map + history 在场 ⇒ 主容器落父字段、载体侧写同一容器（A6b）
  const first = { history: [] }
  writeTombstone(first, 9, "discarded", "plan")
  assert.equal(first._asyncTombstones instanceof Map, true, "主容器建在父字段（今日落点——CLI 零回归）")
  assert.equal(first.history._asyncTombstones, first._asyncTombstones, "history 侧同一容器（合成 parent 跨调用存活）")
  assert.deepEqual(tombstoneOf(first, 9), { status: "discarded", role: "plan" })
  // 既有行为零变：父无 Map 而载体有 ⇒ 借用同一 Map（不另建分叉）
  const carrier = []
  carrier._asyncTombstones = new Map()
  const borrower = { history: carrier }
  writeTombstone(borrower, 10, "cancelled", "coder")
  assert.equal(borrower._asyncTombstones, carrier._asyncTombstones, "借用（不另建）")
  assert.deepEqual(tombstoneOf(carrier, 10), { status: "cancelled", role: "coder" })
})

test("#94 载体吸收：depInfo 两形同读（池 running→pending · 墓碑→cancelled · pending→ok · unknown）", () => {
  for (const carrier of carriers("_asyncSubagents", () => new Map())) {
    getAsyncPool(carrier, "subagent").set("1", { id: "1", status: "running", role: "coder" })
    assert.deepEqual(depInfo(carrier, 1), { state: "pending", role: "coder" })
    writeTombstone(carrier, 2, "cancelled", "plan")
    assert.deepEqual(depInfo(carrier, 2), { state: "cancelled", role: "plan" })
    writeTombstone(carrier, 3, "failed", "explore")
    assert.deepEqual(depInfo(carrier, 3), { state: "failed", role: "explore" })
    parkAsyncPending(carrier, { id: "4", role: "explore", error: null })
    assert.deepEqual(depInfo(carrier, 4), { state: "ok", role: "explore" })
    assert.deepEqual(depInfo(carrier, 9), { state: "unknown", role: null })
  }
})

test("#94 载体吸收：nextSubagentId 两形同读（池活续号兜底）", () => {
  const mk = (own) => {
    const sub = new Map([["7", { id: "7" }]])
    const adv = new Map([["9", { id: "9" }]])
    if (own) return { _asyncSubagents: sub, _asyncAdvisors: adv, history: [] }
    const h = []
    h._asyncSubagents = sub
    h._asyncAdvisors = adv
    return { history: h }
  }
  assert.equal(nextSubagentId(mk(true)), 10)
  assert.equal(nextSubagentId(mk(false)), 10)
})

test("#98 parentAborted：interrupt 豁免（Ctrl+I 非全停）· 普通 abort / controller abort 照判", () => {
  const abortedSignal = (reason) => {
    const c = new AbortController()
    c.abort(reason)
    return c.signal
  }
  assert.equal(parentAborted({ signal: abortedSignal(undefined) }, {}), true, "普通 abort（Stop / 会话）")
  assert.equal(parentAborted({ signal: abortedSignal({ interrupt: true, message: "x" }) }, {}), false, "interrupt 豁免")
  assert.equal(parentAborted({}, { controller: { signal: abortedSignal(undefined) } }), true, "条目 controller 中止")
  assert.equal(parentAborted({}, {}), false)
  assert.equal(parentAborted(null, null), false)
})

test("批 4 U9（F4）：discarded 墓碑归 cancelled 口径（依赖者 depc / AUTO 可启动）；failed/cancelled 不变", () => {
  // 夹具次序前提（评审轮 1 #1）：先落一条**父形态既有墓碑**（真实先例 = 报告注入写 consumed）
  // ——复现「载体自有墓碑 Map 已存在」；否则丢弃墓碑「先写」次序下写 / 读同落一容器 ⇒ 用例假绿。
  for (const carrier of carriers("_asyncTombstones", () => new Map())) {
    writeTombstone(carrier, 90, "consumed", "coder")
    // 丢弃写点 = 生产同单点（`async-discard.mjs` 走 `writeTombstone`——载体吸收）
    writeTombstone(carrier, 91, "discarded", "explore")
    assert.deepEqual(tombstoneOf(carrier, 91), { status: "discarded", role: "explore" }, "写入 / 读取同容器（未分叉）")
    assert.deepEqual(depInfo(carrier, 91), { state: "cancelled", role: "explore" }, "丢弃 ⇒ 非 ok（= cancelled）")
    assert.deepEqual(depInfo(carrier, 90), { state: "ok", role: "coder" }, "consumed 口径不变")
    writeTombstone(carrier, 92, "failed", "plan")
    writeTombstone(carrier, 93, "cancelled", "coder")
    assert.deepEqual(depInfo(carrier, 92), { state: "failed", role: "plan" }, "failed 不变")
    assert.deepEqual(depInfo(carrier, 93), { state: "cancelled", role: "coder" }, "cancelled 不变")
    // 依赖者处置（D-SD5）：非 AUTO ⇒ depc（锁住等父）；AUTO ⇒ 可启动
    const dependent = { id: "100", _dependsOn: [91], _files: [] }
    carrier.autoApprove = false
    const blocked = describeBlockers(carrier, dependent)
    assert.equal(blocked.kind, "depc", "非 AUTO ⇒ 依赖取消口径")
    assert.match(blocked.detail, /explore#91/)
    carrier.autoApprove = true
    assert.equal(describeBlockers(carrier, dependent).kind, "slot", "AUTO ⇒ 可启动")
  }
})

test("批 4 U9b（F1↔F4 生产者绑定——评审轮 3 #2）：父形态墓碑已在 + history 在场 ⇒ 丢弃墓碑由生产入口产出且同容器可读", () => {
  // 夹具 = 「载体自有墓碑 Map 已存在」（先落一条 consumed = 真实先例报告注入）**且** history 在场
  // ——唯有此夹具能判别写入者：若退回旧形 `writeTombstoneTo(parent.history ?? parent, …)`，
  // own 形（CLI 载体形）下墓碑落 history、读面 `carrierField` 父对象优先 ⇒ 下方两断红。
  const own = { history: [], _asyncTombstones: new Map(), _asyncSubagents: new Map() }
  const hist = { history: [] }
  hist.history._asyncTombstones = new Map()
  hist.history._asyncSubagents = new Map()
  for (const carrier of [own, hist]) {
    writeTombstone(carrier, 90, "consumed", "coder") // 父形态既有墓碑先落（次序前提）
    const ctrl = new AbortController()
    ctrl.abort()
    const pool = getAsyncPool(carrier, "subagent")
    pool.set("91", { id: 91, role: "explore", status: "running", controller: ctrl })
    const res = discardAbortedPool(carrier) // **生产入口**（接线口径不传 ctx）
    assert.equal(res.discarded.length, 1, "已死条目经生产入口被丢弃")
    assert.equal(pool.size, 0, "丢弃条目出池")
    assert.deepEqual(tombstoneOf(carrier, 91), { status: "discarded", role: "explore" }, "写入 / 读取同容器（旧形会分叉）")
    assert.deepEqual(depInfo(carrier, 91), { state: "cancelled", role: "explore" }, "下游依赖终态面同可见")
  }
})

test("#98 bindChildController：interrupt 不逐链中止；普通 abort 逐链传播（reason 保真）", () => {
  // 已 aborted：普通 ⇒ 立即中止（reason 同源）
  const plain = new AbortController()
  plain.abort("why")
  const c1 = new AbortController()
  bindChildController(c1, plain.signal)
  assert.equal(c1.signal.aborted, true)
  assert.equal(c1.signal.reason, "why")
  // 已 aborted：interrupt ⇒ 不中止（池 / 评审保留）
  const intr = new AbortController()
  intr.abort({ interrupt: true, message: "stop" })
  const c2 = new AbortController()
  bindChildController(c2, intr.signal)
  assert.equal(c2.signal.aborted, false)
  // 未来 abort：普通 ⇒ 传播
  const live = new AbortController()
  const c3 = new AbortController()
  bindChildController(c3, live.signal)
  live.abort("later")
  assert.equal(c3.signal.aborted, true)
  assert.equal(c3.signal.reason, "later")
  // 未来 abort：interrupt ⇒ 不传播
  const liveI = new AbortController()
  const c4 = new AbortController()
  bindChildController(c4, liveI.signal)
  liveI.abort({ interrupt: true })
  assert.equal(c4.signal.aborted, false)
  // 无基信号 ⇒ no-op
  const c5 = new AbortController()
  bindChildController(c5, null)
  assert.equal(c5.signal.aborted, false)
})

test("#98 settleAsyncEntry：interrupt aborted ⇒ 正常结算（记账 / done 事件照常）；普通 aborted ⇒ 守卫抑制（零记账零事件）", () => {
  const makeEntry = () => ({ id: "1", role: "coder", relayPrefix: "coder#1/", done: false, report: "r", error: null, controller: new AbortController() })
  const run = (mode) => {
    // 两形各跑一遍（载体吸收 × 守卫合并面）。
    return carriers("_asyncSubagents", () => new Map()).map((carrier) => {
      carrier.autoApprove = false
      const entry = makeEntry()
      getAsyncPool(carrier, "subagent").set("1", entry)
      const events = []
      const ctrl = new AbortController()
      if (mode === "plain") ctrl.abort(undefined)
      if (mode === "interrupt") ctrl.abort({ interrupt: true, message: "x" })
      let accounted = 0
      settleAsyncEntry(carrier, entry, {
        pool: getAsyncPool(carrier, "subagent"),
        ctx: { signal: ctrl.signal, callbacks: { onToken: (t) => events.push(t) } },
        onAccounting: () => { accounted++ },
      })
      return { entry, accounted, events }
    })
  }
  for (const r of run("interrupt")) {
    assert.equal(r.accounted, 1, "interrupt ⇒ 正常结算（记账照常）")
    assert.ok(r.events.some((t) => t.includes("⟦ev⟧done")), "interrupt ⇒ done 事件照发")
    assert.equal(r.entry.done, true)
  }
  for (const r of run("plain")) {
    assert.equal(r.accounted, 0, "普通 abort ⇒ 守卫抑制（不记账——中止清池在回合尾做）")
    assert.equal(r.events.length, 0, "普通 abort ⇒ 零事件")
    assert.equal(r.entry.done, true, "条目仍翻 done（守卫只抑制记账 / 分流）")
  }
  for (const r of run("none")) {
    assert.equal(r.accounted, 1, "无中止 ⇒ 正常结算")
    assert.ok(r.events.some((t) => t.includes("⟦ev⟧done")))
  }
})
