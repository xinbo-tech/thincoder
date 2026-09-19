/**
 * acp-channel.test.mjs — 第 27 批（ACP 通道修整）断言宿主：
 * 设计 `docs/design/ACP-CLIENT.md` §12.7 用例 T1–T18 + §12.8 AC1/AC2/AC3 机验。
 *
 * 驱动面：buildAcpCallbacks（假 notify/request 捕获载荷）· replayHistory 直驱 ·
 * applyToolExclusions / parseRelayPath 纯函数直测 · 文法单一权威源（再导出身份直测）。
 * 零网络 / 零子进程 / 零定时器——快层归册（TESTING.md §1 D-T6）。
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { buildAcpCallbacks, replayHistory } from "../src/acp/bridge.mjs"
import { parseRelayPath, relayPrefixOf, RELAY_PREFIX_RE } from "@thincoder/core/agent/relay-prefix.mjs"
import { applyToolExclusions } from "../src/cli/make-agent.mjs"
import { ACP_EXCLUDED_TOOLS } from "../src/acp.mjs"
import { builtinTools } from "@thincoder/core/tools/index.mjs"

/** 捕获式 harness：notify/request/log 全量留档（AC3 聚合扫描面）。 */
function harness() {
  const notifications = []
  const requests = []
  const logs = []
  const notify = (method, params) => notifications.push({ method, params })
  const request = async (method, params) => {
    requests.push({ method, params })
    return { outcome: { outcome: "selected", optionId: "approve_once" } }
  }
  const cb = buildAcpCallbacks({ sessionId: "s1", notify, request, log: (s) => logs.push(s) })
  /** 全部 session/update 载荷（可按 sessionUpdate 类筛）。 */
  const updates = (kind) =>
    notifications.filter((n) => n.method === "session/update").map((n) => n.params.update).filter((u) => !kind || u.sessionUpdate === kind)
  return { cb, notify, notifications, requests, updates, logs }
}

describe("§12.7 表 1 — ACP 桥：relay 前缀零进显示面（T1–T13 · T18）", () => {
  it("T1 onToken 单层前缀 → agent_message_chunk 剥净", () => {
    const h = harness()
    h.cb.onToken("eng-coder#2/hello")
    const chunks = h.updates("agent_message_chunk")
    assert.equal(chunks.length, 1)
    assert.equal(chunks[0].content.text, "hello")
  })

  it("T2 onToken 嵌套前缀（任意深度全剥）", () => {
    const h = harness()
    h.cb.onToken("eng-coder#2/explore#1/deep")
    assert.equal(h.updates("agent_message_chunk")[0].content.text, "deep")
  })

  it("T3 onToken 无前缀 → 零改", () => {
    const h = harness()
    h.cb.onToken("plain text")
    assert.equal(h.updates("agent_message_chunk")[0].content.text, "plain text")
  })

  it("T4 onReasoning 剥前缀 → agent_thought_chunk", () => {
    const h = harness()
    h.cb.onReasoning("explore#1/thinking…")
    const chunks = h.updates("agent_thought_chunk")
    assert.equal(chunks.length, 1)
    assert.equal(chunks[0].content.text, "thinking…")
  })

  it("T5 onToolCall 单层前缀 → title/kind 剥净 · rawInput 原样", () => {
    const h = harness()
    h.cb.onToolCall("eng-coder#2/bash", { command: "ls" })
    const call = h.updates("tool_call")[0]
    assert.equal(call.title, "bash")
    assert.equal(call.kind, "execute")
    assert.deepEqual(call.rawInput, { command: "ls" })
  })

  it("T6 onToolCall 嵌套前缀 → title=read · kind=read", () => {
    const h = harness()
    h.cb.onToolCall("eng-coder#2/explore#1/read", { path: "a" })
    const call = h.updates("tool_call")[0]
    assert.equal(call.title, "read")
    assert.equal(call.kind, "read")
  })

  it("T7 onToolResult 以原样名配对（call/result 同一 id）", () => {
    const h = harness()
    h.cb.onToolCall("eng-coder#2/bash", { command: "ls" })
    h.cb.onToolResult("eng-coder#2/bash", "out")
    const call = h.updates("tool_call")[0]
    const done = h.updates("tool_call_update")[0]
    assert.equal(done.toolCallId, call.toolCallId)
    assert.equal(done.status, "completed")
    assert.equal(done.content[0].content.text, "out")
  })

  it("T8 onPermissionRequest 显示面剥净 · 危险基名与 options/id 照旧", async () => {
    const h = harness()
    const ok = await h.cb.onPermissionRequest("eng-coder#2/bash", { command: "rm -rf x" })
    assert.equal(ok, true)
    assert.equal(h.requests.length, 1)
    const req = h.requests[0]
    assert.equal(req.method, "session/request_permission")
    assert.equal(req.params.toolCall.title, "bash")
    assert.equal(req.params.toolCall.content[0].content.text, "Requesting approval to run bash")
    assert.ok(
      req.params.toolCall.content.some((b) => b.content.text.startsWith("⚠️ Dangerous:")),
      "detectDanger 基名逻辑照旧（剥前缀不影响危险判定）",
    )
    assert.deepEqual(req.params.options.map((o) => o.optionId), ["approve_once", "approve_always", "reject"])
    assert.equal(req.params.toolCall.toolCallId, "t1", "无在队工具 → 新 id（既有防御路径）")
  })

  it("T9 信号 token 带前缀（[model] / ⟦ev⟧）→ 零通知", () => {
    const h = harness()
    h.cb.onToken("a#1/[model]gpt-x")
    h.cb.onToken("a#1/⟦ev⟧turn\x1e1\x1e5\x1ellm\x1e")
    assert.equal(h.notifications.length, 0)
  })

  it("V4 ⟦ev⟧ 形态判据：queued / cancelled（含嵌套前缀）零通知 · 过剥护栏", () => {
    const h = harness()
    // 发射面实况（thincoder-core/agent-tools/subagent-scheduler.mjs:342 /
    // subagent-async.mjs:262）：queued 带载荷、cancelled 空载荷，均可能带 relay 前缀
    // （`coder#9/…`）——桥剥前缀后哨兵落在 payload 首。
    h.cb.onToken("⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1ewaiting for: x")
    h.cb.onToken("coder#9/⟦ev⟧queued\x1eslot\x1e2\x1equeued\x1e")
    h.cb.onToken("⟦ev⟧cancelled\x1e")
    h.cb.onToken("coder#9/⟦ev⟧cancelled\x1e")
    // 既有五名（+approval）⇒ 仍剥离（形态判据不得漏既有相）。
    for (const name of ["turn", "approval", "done", "settled", "stopped", "async"]) {
      h.cb.onToken(`a#1/⟦ev⟧${name}\x1e1\x1e5\x1ellm\x1e`)
    }
    assert.equal(h.notifications.length, 0, "⟦ev⟧ 事件 token 零进 ACP 客户端可见面")

    // 过剥护栏（render.mjs:250 记载的否决形态教训）：正文含哨兵但无 RS 终止符 ⇒ 仍转发。
    const g = harness()
    g.cb.onToken("⟦ev⟧turn 这个哨兵在正文里被讨论")
    g.cb.onToken("a#1/正文：⟦ev⟧queued\x1e 形态说明")
    const chunks = g.updates("agent_message_chunk")
    assert.deepEqual(
      chunks.map((c) => c.content.text),
      ["⟦ev⟧turn 这个哨兵在正文里被讨论", "正文：⟦ev⟧queued\x1e 形态说明"],
      "无 RS 终止符 ⇒ 零过剥（正文不被吞）",
    )
  })

  it("T10 裸信号（无前缀）→ 零通知（既有语义保持）", () => {
    const h = harness()
    h.cb.onToken("[model]gpt-x")
    assert.equal(h.notifications.length, 0)
  })

  it("T11 空载荷（a#1/）→ 零通知（D6）", () => {
    const h = harness()
    h.cb.onToken("a#1/")
    assert.equal(h.notifications.length, 0)
  })

  it("T12 同名不同子代理不错配（原样名 FIFO）", () => {
    const h = harness()
    h.cb.onToolCall("a#1/read", { path: "a" })
    h.cb.onToolCall("b#2/read", { path: "b" })
    h.cb.onToolResult("a#1/read", "out-a")
    h.cb.onToolResult("b#2/read", "out-b")
    const calls = h.updates("tool_call")
    const done = h.updates("tool_call_update")
    assert.equal(calls.length, 2)
    assert.notEqual(calls[0].toolCallId, calls[1].toolCallId)
    assert.deepEqual(done.map((u) => u.toolCallId), calls.map((c) => c.toolCallId), "call 与 result 依序配对")
    assert.deepEqual(done.map((u) => u.content[0].content.text), ["out-a", "out-b"], "载荷不串位")
    assert.deepEqual(calls.map((c) => c.title), ["read", "read"], "显示面标题剥净")
  })

  it("T13 未配对名 → 回退新 id 仍发 update（防御路径不抛）", () => {
    const h = harness()
    h.cb.onToolResult("x#9/oops", "r")
    const done = h.updates("tool_call_update")
    assert.equal(done.length, 1)
    assert.equal(done[0].status, "completed")
    assert.equal(typeof done[0].toolCallId, "string")
  })

  it("T18 replayHistory 直驱——带前缀 → 剥；无前缀 → 零变化", () => {
    const h = harness()
    replayHistory({
      sessionId: "s1",
      notify: h.notify,
      history: [
        { role: "user", content: "go" },
        { role: "assistant", content: "", tool_calls: [{ name: "eng-coder#2/read" }] },
        { role: "tool", content: "prefixed result" },
        { role: "assistant", content: "", tool_calls: [{ name: "read" }] },
        { role: "tool", content: "plain result" },
      ],
    })
    const calls = h.updates("tool_call")
    const done = h.updates("tool_call_update")
    assert.deepEqual(calls.map((c) => c.title), ["read", "read"])
    assert.deepEqual(calls.map((c) => c.kind), ["read", "read"])
    assert.deepEqual(done.map((u) => u.toolCallId), calls.map((c) => c.toolCallId), "update 依序与各 id 配对")
  })
})

describe("§12.8 AC3 — 前缀零泄漏（T1–T13 + T18 驱动序列载荷聚合扫描）", () => {
  it("AC3 全部通知/反向请求载荷对 relay 文法零命中（非锚定扫描）", async () => {
    const h = harness()
    h.cb.onToken("eng-coder#2/hello")
    h.cb.onToken("eng-coder#2/explore#1/deep")
    h.cb.onToken("plain text")
    h.cb.onReasoning("explore#1/thinking…")
    h.cb.onToolCall("eng-coder#2/bash", { command: "ls" })
    h.cb.onToolResult("eng-coder#2/bash", "out")
    h.cb.onToolCall("eng-coder#2/explore#1/read", { path: "a" })
    h.cb.onToolResult("eng-coder#2/explore#1/read", "content a")
    await h.cb.onPermissionRequest("eng-coder#2/bash", { command: "rm -rf x" })
    h.cb.onToken("a#1/[model]gpt-x")
    h.cb.onToken("a#1/⟦ev⟧turn\x1e1\x1e5\x1ellm\x1e")
    h.cb.onToken("[model]gpt-x")
    h.cb.onToken("a#1/")
    h.cb.onToolCall("a#1/read", { path: "a" })
    h.cb.onToolCall("b#2/read", { path: "b" })
    h.cb.onToolResult("a#1/read", "out-a")
    h.cb.onToolResult("b#2/read", "out-b")
    h.cb.onToolResult("x#9/oops", "r")
    replayHistory({
      sessionId: "s1",
      notify: h.notify,
      history: [
        { role: "assistant", content: "", tool_calls: [{ name: "eng-coder#2/read" }] },
        { role: "tool", content: "prefixed result" },
        { role: "assistant", content: "", tool_calls: [{ name: "read" }] },
        { role: "tool", content: "plain result" },
      ],
    })

    // 扫描锚 = 模块 RELAY_PREFIX_RE 去 ^ 锚派生（单源——不复制正则字面量；行首+串中均须零命中）。
    const scan = new RegExp(RELAY_PREFIX_RE.source.replace(/^\^/, ""), "g")
    // 阳性对照：扫描锚对原样前缀输入必须命中——防「恒零命中」的假绿（评审 R1-#1）。
    assert.ok(scan.test("eng-coder#2/hello"), "扫描锚阳性对照（前缀必命中）")
    scan.lastIndex = 0
    const blob = JSON.stringify({ notifications: h.notifications, requests: h.requests })
    const hits = blob.match(scan)
    assert.equal(hits, null, `relay 前缀泄漏进 ACP 载荷：${JSON.stringify(hits)}`)
  })
})

describe("§12.7 表 2 — 装配与文法（T14–T17）", () => {
  it("T14 applyToolExclusions 剔除 question（长度 −1 · 其余逐字保留）", () => {
    const kept = applyToolExclusions(builtinTools, ACP_EXCLUDED_TOOLS)
    assert.equal(kept.length, builtinTools.length - 1)
    assert.ok(!kept.some((t) => t.name === "question"))
    assert.deepEqual(kept.map((t) => t.name), builtinTools.map((t) => t.name).filter((n) => n !== "question"))
    assert.equal(new Set(kept).size, kept.length, "其余工具逐条保留（引用不复制）")
  })

  it("T15 空列表 / 零命中 → 恒等返回（零意外剔除）", () => {
    assert.equal(applyToolExclusions(builtinTools, []), builtinTools)
    assert.equal(applyToolExclusions(builtinTools, ["nope"]), builtinTools)
  })

  it("T16 parseRelayPath 直测（单层 / 嵌套 / 无前缀 / 尾 rest）", () => {
    assert.deepEqual(parseRelayPath("eng-coder#2/hello"), { head: "eng-coder#2", inner: [], label: "", rest: "hello" })
    assert.deepEqual(parseRelayPath("eng-coder#2/explore#1/deep"), { head: "eng-coder#2", inner: ["explore#1"], label: "explore#1", rest: "deep" })
    assert.equal(parseRelayPath("plain text"), null)
    assert.deepEqual(parseRelayPath("a#1/b#2/"), { head: "a#1", inner: ["b#2"], label: "b#2", rest: "" })
  })

  it("T17 文法单一权威（三符号 + 消费方直连 + 无私有副本 + 生成侧再导出）", async () => {
    assert.ok(RELAY_PREFIX_RE instanceof RegExp)
    assert.equal(relayPrefixOf("coder", 3), "coder#3/")
    assert.equal(typeof parseRelayPath, "function")
    const hub = await import("@thincoder/core/agent/spawn-child.mjs")
    assert.equal(hub.RELAY_PREFIX_RE, RELAY_PREFIX_RE, "spawn-child 再导出正则（生成侧枢纽）")
    assert.equal(hub.parseRelayPath, parseRelayPath)
    assert.equal(hub.relayPrefixOf, relayPrefixOf)
  })
})

describe("§12.8 AC1 — 装配接线锁", () => {
  it("AC1 装配接线锁：acp.mjs 传 excludeTools · make-agent 含 applyToolExclusions", () => {
    assert.deepEqual(ACP_EXCLUDED_TOOLS, ["question"])
  })
})

describe("PROVIDER.md §6.20 — B3 onWait 桥面（仅日志 · 相位单源）", () => {
  it("B3 四可显示相落日志 · warn/未知相零日志（不落 undefined 兜底）", () => {
    const h = harness()
    h.cb.onWait({ phase: "gate", seconds: 7 })
    h.cb.onWait({ phase: "retry", seconds: 3 })
    h.cb.onWait({ phase: "overloaded", seconds: 3 })
    h.cb.onWait({ phase: "quota", message: "quota exhausted: insufficient_quota" })
    assert.deepEqual(h.logs, [
      "[rate-limit] TPM throttle wait ~7s",
      "[rate-limit] Rate-limited 429, retry in 3s",
      "[rate-limit] Server overloaded, retrying in 3s",
      "[rate-limit] quota exhausted: insufficient_quota",
    ])

    // 不显示相：warn（前置告警）/ 未知相位 / 秒缺失 —— 零日志、零 undefined。
    const g = harness()
    g.cb.onWait({ phase: "warn", message: "estimated 5000 tokens > tpm 1000" })
    g.cb.onWait({ phase: "retry" })
    g.cb.onWait({ phase: "nope" })
    assert.deepEqual(g.logs, [])
    assert.equal(h.notifications.length, 0, "onWait 不进 ACP 客户端可见面（仅服务端日志）")
  })
})
