/**
 * agent-bridge-subagent.test.mjs — R3b 桥面 relay 分流 ∧ 存活投影直测（`docs/desktop/design/IPC.md` §1 `ev:subagent`
 * 行 · `docs/render-core/design/RENDER-CORE.md` §5 token → patch 全表 / §4 行 21「出生自愈」；批档 §2 ㈠/㈤）。
 *   U162 relay 分流：映射单源（核 `relayEventToSubPatch`）· 前缀剥除（渲染面零析 `role#id/`）· 先例兼容
 *        （`⟦ev⟧stopped` ⇒ `cancelled` · `error` 不载）· 内容 chunk 四面 ⇒ **`ev:subchunk`**（text / think /
 *        工具调用 / 工具输出 —— 「对齐第二批」项 3 KD-RC-6 收正：内容回显 = 核件 tail-3 / 展开）·
 *        非 relay 面零回归（`⟦ev⟧` ⇒ `ev:activity` · 平文本 ⇒ `ev:token`）· per-键 scope 互不串味；
 *   U163 存活投影（出生自愈拍体面）：在飞实例 ⇒ `[model]` 形 / queued 形（`syncLive` 恒 false）· 终态出表
 *        ⇒ 零再断言 · 载体口径（agent ∥ agent.history）· 拍数回执；
 *   U196 「对齐第三批」三接缝：`onSubagentApproval` 两态（`tool: null` = 清态 · 缺 id / role ⇒ 零投）·
 *        `onTurnEnd` ⇒ `turnBreak`（无 `fields`）· `links` 载波（注入面命中 / 空 / 缺三臂）· `ok` 判据核单源（全角 / 状态位）。
 * 纪律：平 node 直测（零 electron / 零网 / 零真实 agent）—— 假 `post` 收序 + 假 agent 载体。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createBridge } from "../src/main/agent-bridge.mjs"

const KEY = "1"
/** 桥夹具：假 `post`（收序）+ 三门空转 + sync registry 采样面（`eng-coder#1` 命中）+ 链接采样面（可选）。 */
function makeBridge({ syncLiveOf, extractLinks, advisorOf } = {}) {
  const out = []
  const bridge = createBridge({
    post: (channel, payload) => out.push([channel, payload]),
    askSingle: () => {}, askBatch: () => {}, askQuestion: () => {},
    syncLiveOf, extractLinks, advisorOf,
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
  // ⑧ 内容 chunk 四面分流（「对齐第二批」项 3 · KD-RC-6 收正）：relay 前缀 ⇒ `ev:subchunk`（**不入对话流** ——
  //    前缀剥除在宿主 ⇒ 载荷 `text` 为剥后原文；嵌套链折 `sub`），四面逐字段
  assert.deepEqual(emit("coder#1/正文行"), [
    ["ev:subchunk", { key: KEY, role: "coder", id: 1, kind: "text", text: "正文行", face: "text" }],
  ], "text 面：前缀剥除 + 逐字段（形状 = `IPC.md` §1 `ev:subchunk` 行）")
  assert.deepEqual(emit("eng-coder#1/explore#2/嵌套内容")[0][1], {
    key: KEY, role: "eng-coder", id: 1, kind: "text", text: "嵌套内容", sub: "explore#2", face: "text",
  }, "嵌套链 ⇒ `sub` = inner 链（`/` 连接；前缀仍剥除）")
  out.length = 0
  at.onReasoning("coder#1/前缀思考行")
  assert.deepEqual(out, [
    ["ev:subchunk", { key: KEY, role: "coder", id: 1, kind: "think", text: "前缀思考行", face: "think" }],
  ], "think 面（R3c：`onReasoning` 与 `onToken` 同律 —— 前缀字面不泄漏入主流）")
  at.onReasoning("先读文件")
  assert.deepEqual(out.at(-1), ["ev:reasoning", { key: KEY, text: "先读文件" }], "无前缀 think chunk ⇒ `ev:reasoning`（零回归 —— 载荷与正文同形）")
  out.length = 0
  at.onToolCall("coder#1/read_file", { path: "a.mjs" }, "t9")
  assert.deepEqual(out, [
    ["ev:subchunk", { key: KEY, role: "coder", id: 1, kind: "tool", text: 'read_file {"path":"a.mjs"}', tool: "read_file", face: "toolCall" }],
  ], "工具调用面：kind=tool · `tool` = relay 前缀 rest · 参数 JSON 随 `text`（零 `cmd` —— 无 `command`）")
  out.length = 0
  at.onToolCall("coder#1/bash", { command: "npm test" }, "t9")
  assert.equal(out[0][1].cmd, "npm test", "工具调用面：`command` 在场 ⇒ 携 `cmd`（结构化参数摘要）")
  out.length = 0
  at.onToolOutput("coder#1/bash", "输出行\n", "t9")
  assert.deepEqual(out, [
    ["ev:subchunk", { key: KEY, role: "coder", id: 1, kind: "tool", text: "输出行\n", tool: "bash", face: "toolOutput" }],
  ], "工具输出面：kind=tool · `text` = 输出原文 · 零 `cmd`（输出面不进状态区）")
  // 零泄漏负向锁：带前缀内容在主流两通道（`ev:token` / `ev:reasoning`）零投
  for (const [channel] of out) assert.equal(channel, "ev:subchunk", "前缀内容 ⇒ 恰 `ev:subchunk`（主流水面零投）")

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

// ─── U196 「对齐第三批」桥面三接缝（审批态 / 子回合边界 / 链接载波）─────────────

test("U196: 「对齐第三批」三接缝 —— `onSubagentApproval` 两态 · `onTurnEnd` 无 `fields` · `links` 载波三臂 · `ok` 判据核单源", () => {
  const { out, bridge } = makeBridge()
  const at = bridge(KEY)

  // ① 子代理审批态（B5 · 核 `child-permission.mjs:40-44`）：`tool` = 待审批工具名；`null` = 清态（键在场）
  out.length = 0
  at.onSubagentApproval({ id: 2, role: "eng-coder", model: "m1", tool: "apply_patch" })
  assert.deepEqual(out, [["ev:subagent", { key: KEY, status: "approval", role: "eng-coder", id: 2, model: "m1", tool: "apply_patch" }]],
    "approval patch 逐字段（status / role / id / model / tool —— 与核回调四字段一一对应）")
  out.length = 0
  at.onSubagentApproval({ id: 2, role: "eng-coder", model: "m1", tool: null })
  assert.deepEqual(out[0][1].tool, null, "清态 = `tool: null`（键在场 —— 归约面按 `null` 清 ⏸）")
  out.length = 0
  assert.equal(at.onSubagentApproval({ tool: "x" }), false, "缺 id / role ⇒ 零投（防半形块）")
  assert.deepEqual(out, [], "缺键 ⇒ 零投（零抛）")

  // ② 子回合边界（A7）：`ev:activity` 清游标形 —— **无 `fields`**（内联形判别键不得在场 —— 判别写死单源）
  out.length = 0
  at.onTurnEnd({}, 4)
  assert.deepEqual(out, [["ev:activity", { key: KEY, event: "turnBreak" }]], "`onTurnEnd` ⇒ `{ event: \"turnBreak\" }`（恰一帧 · 零 `fields`）")

  // ③ 链接载波（相抵② · KD-39）：注入面命中 ⇒ 携键；空数组 / 未注入 ⇒ 零键（禁假链接）
  const link = { raw: "src/a.mjs:12", path: "/p/src/a.mjs", line: 12 }
  const hit = makeBridge({ extractLinks: () => [link] })
  hit.bridge(KEY).onToolResult("read", "src/a.mjs:12", "t1")
  assert.deepEqual(hit.out[0], ["ev:tool-result", { key: KEY, id: "t1", ok: true, result: "src/a.mjs:12", links: [link] }], "命中 ⇒ `links` 携键（值 = 注入面产物原样）")
  const miss = makeBridge({ extractLinks: () => [] })
  miss.bridge(KEY).onToolResult("read", "x", "t2")
  assert.equal("links" in miss.out[0][1], false, "空数组 ⇒ 零 `links` 键")
  const bare = makeBridge()
  bare.bridge(KEY).onToolResult("read", "x", "t3")
  assert.deepEqual(Object.keys(bare.out[0][1]).sort(), ["id", "key", "ok", "result"], "未注入 ⇒ 零 `links` 键（零连带）")

  // ④ `ok` 判据核单源（项 2）：全角 `Error：` 头 ∧ 独立成行状态位 ⇒ 假；正文提及 ⇒ 不误报
  const j = makeBridge()
  const okOf = (text) => { j.out.length = 0; j.bridge(KEY).onToolResult("bash", text, "t4"); return j.out[0][1].ok }
  assert.deepEqual([okOf("Error：全角头"), okOf("$ x\n(exit code 1)"), okOf("plain"), okOf("文中提到 (exit code 1) 不误报")], [false, false, true, true],
    "半 / 全角头与状态位 ⇒ 假；正文提及 ⇒ 真（核 `isToolFailure` 判据直取，零第二口径）")
})
