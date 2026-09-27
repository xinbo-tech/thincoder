/**
 * relay.test.mjs — 核态机层：relay 映射（`subblocks/relay.mjs`——设计 §5「状态机族」token → patch
 * 全表逐行对拍 + 闭集负向锁）。
 *
 * 来源先例 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`（逐字搬迁）；
 * 判据锚 = 设计 §5 全表 + 闭集裁定（`stopped` 先例兼容 ⇒ `cancelled`；`error` 有意收窄不载）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  RELAY_PREFIX_RE, relayPathOf, createRelayScope, queuedInfoOf, isRelayToken, relayEventToSubPatch,
} from "../subblocks/relay.mjs"

test("relayPathOf：单层 / 嵌套链 / 无前缀（文法承 relay-prefix.mjs 逐字）", () => {
  assert.equal(RELAY_PREFIX_RE.source, "^([\\w-]+)#(\\d+)\\/")
  assert.deepEqual(relayPathOf("eng-coder#2/read foo"), { head: "eng-coder#2", inner: [], label: "", rest: "read foo" })
  assert.deepEqual(relayPathOf("eng-coder#2/explore#1/read foo"), { head: "eng-coder#2", inner: ["explore#1"], label: "explore#1", rest: "read foo" })
  assert.equal(relayPathOf("no prefix here"), null)
  assert.equal(relayPathOf(""), null)
})

test("isRelayToken：两判据（⟦ev⟧/[model] 字面 ∧ relay 前缀）——内容面不消费", () => {
  assert.equal(isRelayToken("eng-coder#3/⟦ev⟧async\x1e"), true)
  assert.equal(isRelayToken("eng-coder#3/[model]glm-5.3"), true)
  assert.equal(isRelayToken("eng-coder#3/普通内容 chunk"), false, "有前缀无事件字面 ⇒ 内容面")
  assert.equal(isRelayToken("⟦ev⟧done\x1e0\x1e0\x1edone\x1e"), false, "无前缀 ⇒ 非本面")
  assert.equal(isRelayToken("plain text"), false)
  assert.equal(isRelayToken(null), false)
})

test("scope 必给（fail-closed）：缺 scope ⇒ 报错不静默降级", () => {
  assert.throws(() => relayEventToSubPatch("eng-coder#3/[model]m"), /scope required/)
})

test("⟦ev⟧async → null（只入 pending 集）；[model] → started（pool 真 + startedAt 注入）", () => {
  const scope = createRelayScope()
  assert.equal(relayEventToSubPatch("eng-coder#3/⟦ev⟧async\x1e", scope), null)
  assert.ok(scope.pendingAsync.has("eng-coder#3"))
  const p = relayEventToSubPatch("eng-coder#3/[model]glm-5.3", scope, { now: () => 111 })
  assert.deepEqual(p, { status: "started", role: "eng-coder", id: 3, pool: true, model: "glm-5.3", startedAt: 111, syncLive: false })
  assert.equal(scope.pendingAsync.size, 0, "pending 随 [model] 消费")
})

test("[model]：无 async 前导 ⇒ pool:false；syncLive 仅端 registry 命中（不伪造）；模型缺省 ⇒ null", () => {
  const scope = createRelayScope()
  const p = relayEventToSubPatch("coder#7/[model]", scope, { now: () => 222, syncLiveOf: () => true })
  assert.deepEqual(p, { status: "started", role: "coder", id: 7, pool: false, model: null, startedAt: 222, syncLive: true })
  relayEventToSubPatch("coder#8/⟦ev⟧async\x1e", scope)
  const q = relayEventToSubPatch("coder#8/[model]m", scope, { now: () => 333, syncLiveOf: () => true })
  assert.equal(q.syncLive, false, "pool 真（async）⇒ 恒 false——端 registry 不参与")
})

test("⟦ev⟧queued：slot 面 / depc 面（reason 原文 + waiting 派词）+ 四项缓存 + queuedInfoOf", () => {
  const scope = createRelayScope()
  assert.deepEqual(relayEventToSubPatch("eng-coder#4/⟦ev⟧queued\x1eslot\x1e2\x1equeued\x1e", scope), {
    status: "queued", role: "eng-coder", id: 4, kind: "slot", position: 2, waiting: null, reason: null,
  })
  assert.deepEqual(queuedInfoOf(scope, "eng-coder#4"), { kind: "slot", position: 2, waiting: null, reason: null })
  assert.deepEqual(relayEventToSubPatch("eng-coder#5/⟦ev⟧queued\x1edepc\x1e\x1equeued\x1e依赖未完成", scope), {
    status: "queued", role: "eng-coder", id: 5, kind: "depc", position: null, waiting: "dependency-cancelled", reason: "依赖未完成",
  })
  assert.equal(queuedInfoOf(scope, "eng-coder#9"), null, "未消费过该键 ⇒ 降级态 null")
})

test("queue 缓存清点：started / cancelled / 终态分支删键（#118 R1）", () => {
  const scope = createRelayScope()
  relayEventToSubPatch("eng-coder#4/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", scope)
  relayEventToSubPatch("eng-coder#4/⟦ev⟧cancelled\x1e", scope)
  assert.equal(queuedInfoOf(scope, "eng-coder#4"), null, "出队即终态 ⇒ 缓存删")
  relayEventToSubPatch("coder#2/⟦ev⟧queued\x1e\x1e\x1equeued\x1e原因", scope)
  relayEventToSubPatch("coder#2/[model]m", scope, { now: () => 1 })
  assert.equal(queuedInfoOf(scope, "coder#2"), null, "已启动 ⇒ 排队信息作废")
  relayEventToSubPatch("coder#3/⟦ev⟧queued\x1e\x1eslot\x1equeued\x1e", scope)
  relayEventToSubPatch("coder#3/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", scope)
  assert.equal(queuedInfoOf(scope, "coder#3"), null, "终态分支删键")
})

test("⟦ev⟧cancelled ⇒ cancelled(was:\"queued\")（等待头移除路径）；turn 帧读数", () => {
  const scope = createRelayScope()
  assert.deepEqual(relayEventToSubPatch("eng-coder#4/⟦ev⟧cancelled\x1e", scope), { status: "cancelled", was: "queued", role: "eng-coder", id: 4 })
  assert.deepEqual(relayEventToSubPatch("eng-coder#3/⟦ev⟧turn\x1e3\x1e100\x1ellm\x1e", scope), { status: "turn", role: "eng-coder", id: 3, turn: 3, maxTurns: 100 })
})

test("嵌套剥除不路由（⟦ev⟧/[model] 起于 rest）——留痕经 onStripped", () => {
  const scope = createRelayScope()
  const seen = []
  assert.equal(relayEventToSubPatch("eng-coder#2/explore#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", scope, { onStripped: (i) => seen.push(i) }), null)
  assert.deepEqual(seen, [{ ch: "sub:explore#1", outer: "eng-coder#2", kind: "done" }])
  seen.length = 0
  assert.equal(relayEventToSubPatch("eng-coder#2/explore#1/[model]glm", scope, { onStripped: (i) => seen.push(i) }), null)
  assert.deepEqual(seen, [{ ch: "sub:explore#1", outer: "eng-coder#2", kind: "model" }])
  // 嵌套 + 内容 rest ⇒ 非本面（走内容面）
  assert.equal(isRelayToken("eng-coder#2/explore#1/tool output ⟦ev⟧mention"), true)
  assert.equal(relayEventToSubPatch("eng-coder#2/explore#1/read", scope), null)
})

test("表外 ⟦ev⟧ ⇒ null（消费不泄漏）；非协议行 ⇒ null", () => {
  const scope = createRelayScope()
  assert.equal(relayEventToSubPatch("coder#1/⟦ev⟧approval\x1e", scope), null)
  assert.equal(relayEventToSubPatch("coder#1/just text", scope), null)
  assert.equal(relayEventToSubPatch("no prefix ⟦ev⟧done", scope), null)
})

test("映射闭集负向锁：全表产值 ∈ {started,queued,turn,done,settled,cancelled}——零 stopped / error（C2）", () => {
  const scope = createRelayScope()
  const tokens = [
    "eng-coder#3/⟦ev⟧async\x1e",
    "eng-coder#3/[model]glm-5.3",
    "eng-coder#4/⟦ev⟧queued\x1eslot\x1e2\x1equeued\x1e",
    "eng-coder#4/⟦ev⟧cancelled\x1e",
    "eng-coder#3/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e",
    "eng-coder#3/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e",
    "eng-coder#3/⟦ev⟧done\x1e0\x1e0\x1edone\x1e",
    "eng-coder#3/⟦ev⟧turn\x1e1\x1e9\x1ellm\x1e",
  ]
  const seen = new Set()
  for (const tok of tokens) {
    const p = relayEventToSubPatch(tok, scope)
    if (p) seen.add(p.status)
  }
  assert.deepEqual([...seen].sort(), ["cancelled", "done", "queued", "settled", "started", "turn"])
  assert.ok(!seen.has("stopped"), "闭集不载 stopped（先例兼容 ⇒ cancelled）")
  assert.ok(!seen.has("error"), "error 有意收窄不载")
})
