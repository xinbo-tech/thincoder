/**
 * parent-channel-upstream.test.mjs — 上行通道**唤醒面**用例表 1:1（设计权威 =
 * `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.9 T18–T22；批 2026-09-19-upstream-channel-availability）。
 * 正常 = T18（ask 入队即唤醒）；边界 = T19（note 不唤醒——F13 面）/ T20（无等待栓——F11 / F12）；
 * 谓词真值 = T21；结构单点 = T22（机检）。
 *
 * 本档 = 设计评审修正轮 1 拆分产物（T18–T22 原计划并入 `parent-channel.test.mjs` ⇒ 291 + 45 越
 * 核档 300 软线；`thincoder-core/test/run.mjs:37` 单层 `test/*.test.mjs` glob 自动收集）。
 * 离线：最小 parent 对象直调纯函数——零网络 / 零池真跑 / 零端模块（与 `parent-channel.test.mjs` 同款）。
 * T22 的「三驱动」在核档只可判核驱动面（CLI / VSC 两驱动面归各自包用例——T-CL-U1 / T-VS-U5）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { pushChildUpstream, upstreamWaiting } from "../agent-tools/parent-channel.mjs"

/** 父（接收方）agent 最小形态：载体字段在场（CLI 形）。 */
const parentAgent = (over = {}) => ({
  cwd: "C:/proj/x",
  history: [], _fullHistory: [],
  _asyncSubagents: new Map(), _asyncQueue: [], _asyncAdvisors: new Map(),
  ...over,
})

const src = (rel) => readFileSync(new URL(rel, import.meta.url), "utf8")
/** 注释剥除（行 / 块注释——机检只在代码面上计数，散文提及不算调用；同 core-hygiene 口径）。 */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

test("T18 正常：ask 入队即唤醒——等待栓兑现恰 1 次并清空；入队同步返回（零 await）", () => {
  const parent = parentAgent()
  let woke = 0
  parent._asyncWaiters = [() => { woke++ }] // 挂起驱动注册形（agent/suspension.mjs waitForSettleOrWake）
  const out = pushChildUpstream({ parent, from: "eng-coder#57", kind: "ask", message: "is premise X still live?" })
  assert.deepEqual(out, { seq: 1, position: 1 })
  assert.equal(woke, 1, "唤醒回调恰 1 次（splice(0) 一次性兑现）")
  assert.equal(parent._asyncWaiters.length, 0, "兑现即清空（等待栓为一次性）")
  assert.equal(parent._childUpstream.length, 1, "唤醒不消费消息（消费单点 = 回合边界 drain）")
  assert.notEqual(pushChildUpstream.constructor.name, "AsyncFunction", "同步形（零父侧 await——非阻塞结构保证）")
})

test("T19 边界：note 不唤醒——回调 0 次、等待栓原样在场；队列长度 1", () => {
  const parent = parentAgent()
  let woke = 0
  parent._asyncWaiters = [() => { woke++ }]
  const out = pushChildUpstream({ parent, from: "explore#61", kind: "note", message: "premise X broke — resolved it myself" })
  assert.deepEqual(out, { seq: 1, position: 1 })
  assert.equal(woke, 0, "note 零唤醒（无时效义务——避「每条消息一次父侧轮」的轮风暴面）")
  assert.equal(parent._asyncWaiters.length, 1, "等待栓未被消费（settle / 用户输入两路照常）")
  assert.equal(parent._childUpstream.length, 1, "消息仍入队（下一拐点注入——F13 语义零变）")
})

test("T20 边界：无等待栓（父侧忙 / 挂起已退出）——ask 入队成功、唤醒 no-op（零抛错）", () => {
  const absent = parentAgent() // `_asyncWaiters` 缺省（F12 父侧忙——回合内）
  assert.deepEqual(pushChildUpstream({ parent: absent, from: "eng-coder#57", kind: "ask", message: "q" }), { seq: 1, position: 1 })
  assert.equal(absent._childUpstream.length, 1, "缺省 ⇒ no-op；消息照常入队")
  const empty = parentAgent({ _asyncWaiters: [] }) // 空数组（F11 挂起已退出——清场后）
  pushChildUpstream({ parent: empty, from: "eng-coder#57", kind: "ask", message: "q" })
  assert.equal(empty._childUpstream.length, 1, "空数组 ⇒ no-op")
  // 唤醒单点读径 = `carrierField`（父字段优先、缺则回退 history）——载体形等待栓照常兑现
  const carried = parentAgent()
  delete carried._asyncWaiters
  let woke = 0
  carried.history._asyncWaiters = [() => { woke++ }]
  pushChildUpstream({ parent: carried, from: "eng-coder#57", kind: "ask", message: "q" })
  assert.equal(woke, 1, "父字段缺 + 载体在场 ⇒ 兑现（读径吸收——严格超集）")
})

test("T21 谓词真值：upstreamWaiting 四形 + 载体吸收 + 缺容器 fail-closed", () => {
  const q = (list) => ({ _childUpstream: list })
  assert.equal(upstreamWaiting(q([])), false, "空队列 ⇒ false")
  assert.equal(upstreamWaiting(q([{ kind: "note" }])), false, "仅 note ⇒ false")
  assert.equal(upstreamWaiting(q([{ kind: "ask" }])), true, "含 ask ⇒ true")
  assert.equal(upstreamWaiting(q([{ kind: "note" }, { kind: "ask" }])), true, "note + ask ⇒ true（位次无关）")
  assert.equal(upstreamWaiting({ history: { _childUpstream: [{ kind: "ask" }] } }), true, "载体经 carrierField 吸收")
  assert.equal(upstreamWaiting({}), false, "两形皆缺 ⇒ false（fail-closed——缺容器不抛）")
  assert.equal(upstreamWaiting(null), false, "null 载荷 ⇒ false")
  assert.equal(upstreamWaiting({ _childUpstream: "x" }), false, "非数组 ⇒ false（Array.isArray 守卫）")
})

test("T22 结构单点（机检）：唤醒定义恰 1 + splice(0) 收口 + 两调用点 + 消费单点不破", () => {
  const settle = code(src("../agent-tools/async-settle.mjs"))
  assert.equal((settle.match(/export function wakeAsyncWaiters\b/g) ?? []).length, 1, "唤醒单点定义恰 1 处")
  assert.equal((settle.match(/\.splice\(0\)/g) ?? []).length, 1, "splice(0) 全档仅 1 处")
  const wakeBody = settle.slice(settle.indexOf("export function wakeAsyncWaiters"))
  assert.ok(wakeBody.includes(".splice(0)"), "splice(0) 收口于 wakeAsyncWaiters 内（唯一处 ∈ 函数体）")
  const channel = code(src("../agent-tools/parent-channel.mjs"))
  assert.equal((channel.match(/wakeAsyncWaiters\(/g) ?? []).length, 1, "push 尾唤醒调用恰 1 处（唯一激活点）")
  const driver = code(src("../agent/suspension.mjs"))
  assert.match(driver, /upstreamWaiting\(carrier\)/, "核驱动第 2 步含谓词调用")
  assert.match(driver, /runTurn\("", \{ autoTurn: true, upstreamTurn: upstream \}\)/, "旗标随 auto 轮贯通（域文本选择面）")
  const core = code(src("../agent.mjs"))
  const drains = core.split("\n").filter((l) => l.trim() === "drainChildUpstream(agent)")
  assert.equal(drains.length, 1, "子→父消费单点仍恰 1 处（既有断言 parent-channel.test.mjs 同源）")
})
