/**
 * subagent-content-relay.test.mjs — 端壳内容中继面（W15 内容面）测试：子代内容 chunk
 * （核 relay 前缀 `role#id/`）四路分流 → `toolPanel` `sub:<role>#<id>` 频道（事件面之后、
 * 主流之前）；反向 = 前缀 chunk 主流零命中；无前缀零误改（正控）；事件面零回归。
 *
 * 手法：`buildPanelCallbacks(桩 panel, {})` 真函数直驱 + 桩 panel 捕 postMessage（host 面——
 * 先例 = chat-panel-messages.test.mjs ⑬ 直取 relaySubagentEventToken 同款）；零 provider /
 * 零 DOM 依赖。块接收侧（webview `sub:` 频道 → 活动区块）已有活动族用例覆盖，本档只锁
 * 端壳发射面（频道名 + 载荷字段）。
 *
 * 修前必红（2026-09-16 实施轮——原样记录见批次档 §5）：修前 T1/T2/T3/T6/T7 失败（今态 =
 * 前缀 chunk 原走主流、块频道零命中）；T4/T5 = 零回归面，修前即绿。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { buildPanelCallbacks, relaySubagentEventToken, relaySubagentContentChunk } from "../src/extension/panel-callbacks.mjs"

/** 桩面板：`_wvReady: true`（事件面直投门——postSubagentEvent）+ postMessage 捕记数组。 */
function stubPanel() {
  const posted = []
  const panel = {
    _wvReady: true,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
  }
  return { panel, posted }
}

const panelMessages = (posted) => posted.filter((m) => m.type === "toolPanel")

// ─── T1 四路内容分流（正常——块内命中）──────────────────────────

test("T1 四路分流：onToken/onReasoning/onToolCall/onToolOutput 前缀 chunk → 恰 4 条 sub: 面板载荷（逐字段）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("eng-coder#2/hello")
  cbs.onReasoning("eng-coder#2/think")
  cbs.onToolCall("eng-coder#2/read", { path: "x.mjs" })
  cbs.onToolOutput("eng-coder#2/read", "out")

  const panels = panelMessages(posted)
  assert.equal(panels.length, 4, "恰 4 条 toolPanel（修前 = 0——四条全落主流）")
  assert.deepEqual([...new Set(panels.map((m) => m.name))], ["sub:eng-coder#2"], "块频道名 = sub:<role>#<id>")
  const [text, think, call, out] = panels
  assert.equal(text.kind, "text")
  assert.equal(text.text, "hello", "文本 = 前缀 rest 逐字")
  assert.equal(think.kind, "think")
  assert.equal(think.text, "think")
  assert.equal(call.kind, "tool")
  assert.equal(call.tool, "read", "结构化工具名（块头 `${tool} — ${cmd}` 面）")
  assert.equal(call.text, 'read {"path":"x.mjs"}', "调用行 = 工具名 + args JSON（≤120）")
  assert.equal(out.kind, "tool")
  assert.equal(out.text, "out", "输出行 = chunk 文本")
  // R1（渲染粒度对齐批 · 2026-09-20）：面随载荷（四面）+ 输出面携工具名（合并判据源 = relay 前缀 rest）
  assert.deepEqual(panels.map((m) => m.face), ["text", "think", "toolCall", "toolOutput"], "面随载荷（四面）")
  assert.equal(out.tool, "read", "输出面工具名与调用面同源")
})

// ─── T2 反向（硬项）：前缀 chunk 主流零命中 ────────────────────

test("T2 反向：前缀 chunk 主流零命中——先按名扫（实码四型）再按载荷内容全量扫（防按名空过）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("eng-coder#2/hello")
  cbs.onReasoning("eng-coder#2/think")
  cbs.onToolCall("eng-coder#2/read", { path: "x.mjs" })
  cbs.onToolOutput("eng-coder#2/read", "out")

  // 实码发射类型名（panel-callbacks onToken/onReasoning/onToolCall/onToolOutput）逐名钉死：
  const byName = posted.filter((m) => ["token", "reasoning", "toolCall", "toolOutput"].includes(m.type))
  assert.equal(byName.length, 0, "四型主流消息零在场（修前 = 4 条）")
  // 再按载荷内容全量扫（不限类型名——类型名漂移不空过）：
  const marked = posted.filter((m) => JSON.stringify(m).includes("eng-coder#2"))
  assert.deepEqual(marked.map((m) => m.type), ["toolPanel", "toolPanel", "toolPanel", "toolPanel"], "带前缀标记的消息仅面板载荷")
})

// ─── T3 嵌套子标（D-M8 边界）────────────────────────────────

test("T3 嵌套子标：eng-coder#2/explore#1/act → name=sub:eng-coder#2 + sub=explore#1（D-M8 形态）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("eng-coder#2/explore#1/act")
  const m = panelMessages(posted)[0]
  assert.equal(m.name, "sub:eng-coder#2", "块路由 = head（外层块）")
  assert.equal(m.kind, "text")
  assert.equal(m.text, "act", "内容 = 外层前缀剥净后的 rest")
  assert.equal(m.sub, "explore#1", "子标 = 嵌套链（数据面 `sub`：面板行合并判据消费）")
})

// ─── T4 无前缀零误改（正控）──────────────────────────────────

test("T4 边界·无前缀零误改（正控）：普通 token/reasoning/toolCall/toolOutput 原样主流", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("plain")
  cbs.onReasoning("r")
  cbs.onToolCall("read", { path: "x.mjs" })
  cbs.onToolOutput("bash", "out")
  assert.deepEqual(posted.map((m) => m.type), ["token", "reasoning", "toolCall", "toolOutput"], "四路原形（分流不越界）")
  assert.equal(posted[0].text, "plain")
  assert.equal(posted[1].text, "r")
  assert.equal(posted[2].name, "read")
  assert.equal(posted[3].name, "bash")
  assert.equal(panelMessages(posted).length, 0, "零面板载荷——无前缀不越界")
})

// ─── T5 事件面零回归（次序 + 生命周期）──────────────────────

test("T5 事件面零回归：relaySubagentEventToken 语义不变；前缀 ⟦ev⟧ 经 onToken 仍出 subagent、不入块内容", () => {
  const { panel, posted } = stubPanel()
  const RS = "\x1e"
  // 直接面（⑬ 先例同款）：内容前缀 token 不在事件面消费域；事件真值识别不变
  assert.equal(relaySubagentEventToken(panel, "eng-coder#5/hello chunk"), false)
  assert.equal(relaySubagentEventToken(panel, `eng-coder#5/⟦ev⟧queued${RS}slot${RS}3${RS}queued${RS}`), true)
  assert.equal(posted[0].type, "subagent")
  assert.equal(posted[0].status, "queued")
  // 真回调链（事件面先吃、内容面后判——🔵#8①：前缀 ⟦ev⟧ 不入块内容）
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken(`eng-coder#5/⟦ev⟧settled${RS}0${RS}0${RS}settled${RS}`)
  assert.equal(posted.at(-1).type, "subagent")
  assert.equal(posted.at(-1).status, "settled")
  assert.equal(panelMessages(posted).length, 0, "事件 token 零面板载荷（内容面不越界吃事件）")
})

// ─── T6 同族分流（escalate / consult——🟡#1 加锁）──────────────

test("T6 同族分流：escalate#2 / consult#1 前缀 chunk → 出对应 sub: 面板载荷（分流发生）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("escalate#2/out")
  cbs.onToken("consult#1/reply")
  const panels = panelMessages(posted)
  assert.deepEqual(panels.map((m) => m.name), ["sub:escalate#2", "sub:consult#1"], "内容面随本修恢复（头标角色/终态补桩残余另登记）")
  assert.equal(panels[0].text, "out")
  assert.equal(panels[1].text, "reply")
})

// ─── T7 误伤形态锁定（🔵#8②·已知接受）─────────────────────────

test("T7 误伤形态锁定（已知接受——与 CLI 同文法同暴露）：父级正文 issue#123/… 起始被分流", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToken("issue#123/details")
  const m = panelMessages(posted)[0]
  assert.equal(m.name, "sub:issue#123", "已知暴露（判据句 = 与 CLI 同规；收严文法 = 显式改动）")
  assert.equal(m.kind, "text")
  assert.equal(m.text, "details")
})

// ─── T-G8 面集 = 四面结构锁（R6——第五路 `toolResult` 死支路删净）────

test("T-G8 face-set lock: four faces claim; toolResult returns false (zero payload)", () => {
  const { panel, posted } = stubPanel()
  const claimed = ["text", "think", "toolCall", "toolOutput"].map((f) => relaySubagentContentChunk(panel, f, "eng-coder#2/read", "out"))
  assert.deepEqual(claimed, [true, true, true, true], "四面认领")
  assert.equal(relaySubagentContentChunk(panel, "toolResult", "eng-coder#2/read", "out"), false, "非四面 face ⇒ false（不入 subcontent / 不发载荷——修前 = 认领）")
  assert.equal(panelMessages(posted).length, 4, "恰 4 条载荷（toolResult 零载荷）")
})
