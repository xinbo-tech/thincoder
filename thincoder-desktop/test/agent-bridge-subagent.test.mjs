/**
 * agent-bridge-subagent.test.mjs — R3b 桥面 relay 分流 ∧ 存活投影直测（`docs/desktop/design/IPC.md` §1 `ev:subagent`
 * 行 · `docs/render-core/design/RENDER-CORE.md` §5 token → patch 全表 / §4 行 21「出生自愈」；批档 §2 ㈠/㈤）。
 *   U162 relay 分流：映射单源（核 `relayEventToSubPatch`）· 前缀剥除（渲染面零析 `role#id/`）· 先例兼容
 *        （`⟦ev⟧stopped` ⇒ `cancelled` · `error` 不载）· 内容 chunk 与嵌套剥除**不入对话流**（KD-RC-6）·
 *        非 relay 面零回归（`⟦ev⟧` ⇒ `ev:activity` · 平文本 ⇒ `ev:token`）· per-键 scope 互不串味；
 *   U163 存活投影（出生自愈拍体面）：在飞实例 ⇒ `[model]` 形 / queued 形（`syncLive` 恒 false）· 终态出表
 *        ⇒ 零再断言 · 载体口径（agent ∥ agent.history）· 拍数回执。
 * 纪律：平 node 直测（零 electron / 零网 / 零真实 agent）—— 假 `post` 收序 + 假 agent 载体。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createBridge } from "../src/main/agent-bridge.mjs"

const KEY = "1"
/** 桥夹具：假 `post`（收序）+ 三门空转 + sync registry 采样面（`eng-coder#1` 命中）。 */
function makeBridge({ syncLiveOf } = {}) {
  const out = []
  const bridge = createBridge({
    post: (channel, payload) => out.push([channel, payload]),
    askSingle: () => {}, askBatch: () => {}, askQuestion: () => {},
    syncLiveOf,
  })
  return { out, bridge }
}
const subs = (out) => out.filter(([channel]) => channel === "ev:subagent").map(([, payload]) => payload)

// ─── U162 relay 分流（token → patch 全表 · 零泄漏）──────────────────

test("U162: relay 分流（映射单源 · 前缀剥除 · 先例兼容 · 零泄漏 · 非 relay 面零回归 · per-键 scope）", () => {
  const { out, bridge } = makeBridge({ syncLiveOf: (key, head) => key === KEY && head === "eng-coder#1" })
  const at = bridge(KEY)
  const emit = (text) => { out.length = 0; at.onToken(text); return out }

  // ① sync 出生（`[model]` 直发 —— 无 `⟦ev⟧async`）：pool 假 · syncLive = 端 registry 采样
  const sync = emit("eng-coder#1/[model]glm-5.3")
  assert.deepEqual(sync.map(([channel]) => channel), ["ev:subagent"], "relay 出生 ⇒ `ev:subagent`（不进主流）")
  assert.deepEqual({ ...sync[0][1], startedAt: "--" }, {
    key: KEY, status: "started", role: "eng-coder", id: 1, pool: false, model: "glm-5.3", startedAt: "--", syncLive: true,
  }, "载荷 = `{key} + `[model]` 形 patch（前缀已剥 —— 渲染面零析 role#id/）")
  assert.ok(Number.isFinite(sync[0][1].startedAt), "`startedAt` = 现刻数")

  // ② async 池出生：先 `⟦ev⟧async`（只入 pending ⇒ 零投）后 `[model]` ⇒ pool 真 · syncLive 假
  assert.deepEqual(emit("coder#2/⟦ev⟧async\x1e"), [], "`⟦ev⟧async` ⇒ 零投（只入 pending 集）")
  const pooled = emit("coder#2/[model]m-pool")
  assert.deepEqual([pooled[0][1].pool, pooled[0][1].syncLive, pooled[0][1].status], [true, false, "started"], "async 块：pool 真 · syncLive 假")
  assert.equal(subs(emit("coder#2/[model]m-pool"))[0].pool, false, "同键二次 `[model]`（pending 已消费）⇒ pool 回假（`⟦ev⟧async` 一次性标记 —— 核先例同形）")

  // ③ queued（四字段）/ ④ cancelled（was:"queued"）/ ⑤ turn
  const queued = emit("coder#3/⟦ev⟧queued\x1eslot\x1e2\x1equ\x1edetail-text")
  assert.deepEqual(queued[0][1], {
    key: KEY, status: "queued", role: "coder", id: 3, kind: "slot", position: 2, waiting: null, reason: null,
  }, "queued 形（kind / position / waiting / reason 逐字段）")
  assert.deepEqual(emit("coder#3/⟦ev⟧cancelled\x1e")[0][1], { key: KEY, status: "cancelled", was: "queued", role: "coder", id: 3 }, "出队取消 ⇒ cancelled(was:queued)")
  const turn = emit("coder#4/⟦ev⟧turn\x1e2\x1e8\x1ephase\x1edetail")
  assert.deepEqual(turn[0][1], { key: KEY, status: "turn", role: "coder", id: 4, turn: 2, maxTurns: 8 }, "逐轮帧 ⇒ turn patch（n / max 逐字）")

  // ⑥ 终态三 token：`stopped` ⇒ **cancelled**（先例兼容 · 闭集零 `stopped` 产值）· settled / done 逐字
  const stopped = emit("coder#5/⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e")
  assert.deepEqual(stopped[0][1], { key: KEY, status: "cancelled", role: "coder", id: 5 }, "`⟦ev⟧stopped` ⇒ `cancelled`（不产 `stopped` 值）")
  assert.deepEqual(emit("coder#6/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e")[0][1].status, "settled", "settled 逐字")
  assert.deepEqual(emit("coder#7/⟦ev⟧done\x1e0\x1e0\x1edone\x1e")[0][1].status, "done", "done 逐字")
  for (const payload of [stopped[0][1], queued[0][1], turn[0][1]]) {
    assert.ok(["started", "queued", "turn", "done", "settled", "cancelled"].includes(payload.status), `状态值 ∈ 闭集：${payload.status}`)
  }

  // ⑦ 消费不泄漏：表外 ⟦ev⟧（approval 等）· 嵌套剥除 ⇒ 零投（既非 ev:subagent 亦非 ev:token）
  assert.deepEqual(emit("coder#8/⟦ev⟧approval\x1e1\x1e2\x1eapproval\x1ebash"), [], "表外核事件 ⇒ 消费无载荷")
  assert.deepEqual(emit("eng-coder#1/explore#2/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"), [], "嵌套 relay（剥除不路由）⇒ 零投")
  // ⑧ 内容 chunk（KD-RC-6）：前缀文本 / 工具调用行 / 工具输出行 / **think chunk** **不入对话流**
  assert.deepEqual(emit("coder#1/正文不该进流"), [], "前缀内容 chunk ⇒ 零投（前缀字面不泄漏入主流）")
  assert.deepEqual(emit("eng-coder#1/explore#2/嵌套内容"), [], "嵌套内容 chunk ⇒ 零投")
  assert.deepEqual(emit("coder#1/read_file"), [], "前缀工具名 chunk ⇒ 零投")
  out.length = 0
  at.onReasoning("coder#1/前缀思考不该进流")
  assert.deepEqual(out, [], "带前缀的 think chunk ⇒ 零投（R3c：`onReasoning` 与 `onToken` 同律 —— 前缀字面不泄漏入主流）")
  at.onReasoning("先读文件")
  assert.deepEqual(out, [["ev:reasoning", { key: KEY, text: "先读文件" }]], "无前缀 think chunk ⇒ `ev:reasoning`（零回归 —— 载荷与正文同形）")
  out.length = 0
  at.onToolCall("coder#1/read_file", { path: "a.mjs" })
  assert.deepEqual(out, [], "带前缀的工具调用行 ⇒ 零投（工具名不作第二展示面 —— D20 块形无工具位）")
  at.onToolOutput("coder#1/bash", "chunk", "t9")
  assert.deepEqual(out, [], "带前缀的工具输出行 ⇒ 零投")

  // ⑨ 非 relay 面零回归：无前缀 ⟦ev⟧ ⇒ ev:activity（内联形）；平文本 ⇒ ev:token；无前缀工具行 ⇒ 原两通道
  const inline = emit("⟦ev⟧approval\x1e1\x1e2\x1eapproval\x1ebash")
  assert.deepEqual(inline, [["ev:activity", { key: KEY, event: "approval", fields: "1\x1e2\x1eapproval\x1ebash" }]], "无前缀 ⟦ev⟧ ⇒ `ev:activity`（零回归）")
  assert.deepEqual(emit("plain text"), [["ev:token", { key: KEY, text: "plain text" }]], "平文本 ⇒ `ev:token`（零回归）")
  assert.deepEqual(emit("text with ⟦ev⟧ inside"), [["ev:token", { key: KEY, text: "text with ⟦ev⟧ inside" }]], "非协议 ⟦ev⟧ 字面（中缀）⇒ `ev:token`（零回归）")
  out.length = 0
  at.onToolCall("read", { path: "x" }, "t1")
  at.onToolOutput("bash", "out", "t1")
  assert.deepEqual(out.map(([channel]) => channel), ["ev:tool-call", "ev:tool-output"], "无前缀工具行 ⇒ 原两通道（零回归）")

  // ⑩ per-键 scope 互不串味：A 键的 `⟦ev⟧async` 不被 B 键的 `[model]` 消费
  out.length = 0
  bridge("A").onToken("coder#1/⟦ev⟧async\x1e")
  bridge("B").onToken("coder#1/[model]m-b")
  assert.deepEqual(out.map(([, p]) => [p.key, p.pool]), [["B", false]], "跨键 pending 不共享（B 键 `[model]` ⇒ pool 假）")
  out.length = 0
  bridge("A").onToken("coder#1/[model]m-a")
  assert.deepEqual(out.map(([, p]) => [p.key, p.pool]), [["A", true]], "A 键 pending 仍归 A（⇒ pool 真）")

  // ⑪ scope 回收（宿主 `dispose` 面）：丢弃本键 scope ⇒ pending / queued 缓存归零（同键重开不继承陈旧态）
  bridge("A").onToken("coder#9/⟦ev⟧async\x1e")
  bridge.dropScope("A")
  out.length = 0
  bridge("A").onToken("coder#9/[model]m9")
  assert.deepEqual(out.map(([, p]) => [p.status, p.pool]), [["started", false]], "scope 丢弃 ⇒ pending 缓存不残留（`[model]` 落 pool 假）")
  assert.equal(bridge.dropScope("zz"), undefined, "无该键 ⇒ 零抛（幂等）")
})

// ─── U163 存活投影（出生自愈拍体面）─────────────────────────────

test("U163: 存活投影（在飞两态 ⇒ `[model]` / queued 形 · 终态零再断言 · 载体双面 · 拍数回执）", () => {
  const { out, bridge } = makeBridge()
  const at = bridge(KEY)
  const agent = {
    _asyncSubagents: new Map([
      ["1", { id: 1, role: "coder", status: "running", model: "m-1", startedAt: 111, position: undefined }],
      ["2", { id: 2, role: "coder", status: "queued", position: 3 }],
      ["3", { id: 3, role: "coder", status: "done", done: true }],
    ]),
    _asyncAdvisors: new Map([
      ["4", { id: 4, role: "advisor", status: "running", model: "m-4", startedAt: 444 }],
    ]),
  }
  out.length = 0
  assert.equal(at.reassertLive(agent), 3, "拍数回执 = 仅两池在飞条目（running / queued —— 终态出表）")
  assert.deepEqual(subs(out).map((p) => [p.key, p.status, p.role, p.id, p.pool, p.syncLive]), [
    [KEY, "started", "coder", 1, true, false],
    [KEY, "queued", "coder", 2, undefined, undefined],
    [KEY, "started", "advisor", 4, true, false],
  ], "逐条 `ev:subagent`（running ⇒ `[model]` 形 · queued ⇒ queued 形）")
  assert.deepEqual(subs(out)[0].model, "m-1", "投影携 model（块头来源）")
  assert.deepEqual(subs(out)[0].startedAt, 111, "投影携 startedAt（用时来源）")
  assert.deepEqual(subs(out)[1].position, 3, "queued 缓存缺省 ⇒ 降级态：只携池条目 position")
  assert.equal("model" in subs(out)[2] ? subs(out)[2].model : null, "m-4", "advisor 池同列（射程含 advisor-async）")

  // queued 四字段同形：先消费本键 queued token（入 scope 缓存）⇒ 投影与 live 面同形
  bridge(KEY).onToken("coder#2/⟦ev⟧queued\x1eslot\x1e3\x1equ\x1edetail-x")
  out.length = 0
  at.reassertLive(agent)
  assert.deepEqual(subs(out)[1], {
    key: KEY, status: "queued", role: "coder", id: 2, position: 3, waiting: null, reason: null, kind: "slot",
  }, "queued 投影 = 本键 relay 缓存四字段（与 live 中继面同形）")

  // 载体双面（核 `carrierField` 口径：agent 字段 ∥ agent.history 字段）
  out.length = 0
  assert.equal(at.reassertLive({ history: { _asyncSubagents: new Map([["9", { id: 9, role: "explore", status: "running", model: null, startedAt: 9 }]]) } }), 1, "载体落 `history`（VSC 形）⇒ 照样枚举")
  // 终态出表 ⇒ 零再断言不复活；池缺 / 非 Map ⇒ 零投
  assert.equal(at.reassertLive({ _asyncSubagents: new Map([["5", { id: 5, role: "coder", status: "done", done: true }]]) }), 0, "终态条目 ⇒ 零投（不复活）")
  assert.equal(at.reassertLive({}), 0, "池缺位 ⇒ 零投")
  assert.equal(at.reassertLive(null), 0, "载体非对象 ⇒ 零投（零抛）")
})
