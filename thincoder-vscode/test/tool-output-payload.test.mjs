/**
 * tool-output-payload.test.mjs — M3 现场确认探针 A（端差·显示面消差批 · 批档 §2.1 M3 + §2.10.8 #12）。
 *
 * 缺陷：核 sync 评审产出**对象 chunk**（`advisor/loop.mjs:82` `emit = (kind) => (text) =>
 * onOutput?.({ kind, text })`），`advisor.mjs:241` 不带 relay 前缀 ⇒ 端壳 `onToolOutput` 直通
 * 分支把对象塞进载荷 ⇒ webview 卡体拼串 `[object Object]`（运行期可见）。
 * 判据权威：`docs/batches/2026-09-20-display-parity-batch.md` §2.1 M3 —— 现场确认路径三段之①
 * （探针 A · 零 GUI 可机跑）；探针 B（真跑 sync 评审看卡体）在实施记录 §5 记读数。
 *
 * 三段断言链（修前红 / 修后绿）：
 *   ① `parseRelayPath("advisor") === null` ⇒ relay 分流不成立（键形单源）；
 *   ② `relaySubagentContentChunk(p, "toolOutput", "advisor", {kind,text}) === false`（未认领）；
 *   ③ 直通分支载荷 `typeof payload.text === "string"`（修前 = `object` ⇒ 卡体 `[object Object]`）。
 * 对照组（async 面）：`role#id/` 前缀 chunk 走 relay 分流，relay 内已归一 ⇒ 对象不入载荷（设计反面对照）。
 * 归一先例 = CLI `thincoder-cli/src/tui/tool-events.mjs:322-324`（`typeof chunk === "string" ? chunk : String(chunk?.text ?? "")`）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"
import { buildPanelCallbacks, relaySubagentContentChunk } from "../src/extension/panel-callbacks.mjs"

/** 桩面板（族 = `subagent-content-relay.test.mjs`：`_wvReady` 门 + postMessage 捕记）。 */
function stubPanel() {
  const posted = []
  const panel = {
    _wvReady: true,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
  }
  return { panel, posted }
}

const CHUNK = { kind: "text", text: "先读批档 §2，再逐子项落点。" } // 真产形（核 emit 对象）

test("M3-1 探针 A①：`parseRelayPath(\"advisor\") === null` ⇒ 无 relay 键形（分流不成立）", () => {
  assert.equal(parseRelayPath("advisor"), null, "裸工具名不是 relay 键（`role#id/` 文法）")
})

test("M3-2 探针 A②：relay 内容面未认领对象 chunk（返回 false ⇒ 直通分支）", () => {
  const { panel, posted } = stubPanel()
  assert.equal(relaySubagentContentChunk(panel, "toolOutput", "advisor", CHUNK), false, "未认领 ⇒ 走主流")
  assert.deepEqual(posted.filter((m) => m.type === "toolPanel"), [], "零 toolPanel 载荷（未误分流）")
})

test("M3-3 探针 A③（正常 · 先红）：直通分支载荷 text = 字符串（修前 = 对象 ⇒ 卡体 `[object Object]`）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToolOutput("advisor", CHUNK, "c1")
  const payload = posted.find((m) => m.type === "toolOutput")
  assert.ok(payload != null, "toolOutput 载荷已发（前置）")
  assert.equal(typeof payload.text, "string", "载荷 text = string（修前 object ⇒ webview 拼出 [object Object]）")
  assert.equal(payload.text, CHUNK.text, "归一取 `.text` 逐字")
  assert.equal(payload.kind, "text", "kind 随行保留为可选字段（不新增消费面）")
  assert.equal(payload.name, "advisor")
  assert.equal(payload.id, "c1")
})

test("M3-4 静态链终点取证：对象直通 ⇒ 卡体拼串字面 = `[object Object]`（webview `textContent +=` 语义）", () => {
  // webview `chat-messages.js` 流式追加 = `ref.b.textContent += m.text` ⇒ 非串走 JS 默认串化
  assert.equal(String(CHUNK), "[object Object]", "对象直通时卡体正文字面（修前实况）")
})

test("M3-5 串 chunk 零回归 + 缺 text 键不抛（边界）", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToolOutput("bash", "raw line", "t9")
  cbs.onToolOutput("advisor", { kind: "tool" }, "t10")
  const [plain, bare] = posted.filter((m) => m.type === "toolOutput")
  assert.equal(plain.text, "raw line", "原样串路径逐字（零改）")
  assert.equal(plain.kind, null, "串 chunk 无 kind ⇒ null（可选字段缺省）")
  assert.equal(bare.text, "", "无 `.text` 键 ⇒ 空串（不产 `undefined` / 不抛）")
  assert.equal(bare.kind, "tool", "kind 仍在（消费面未变）")
})

test("M3-6 对照组（async 面零改）：`role#id/` 前缀对象 chunk 走 relay 分流且载荷已归一", () => {
  const { panel, posted } = stubPanel()
  const cbs = buildPanelCallbacks(panel, {})
  cbs.onToolOutput("eng-coder#2/read", CHUNK, "t11")
  assert.deepEqual(posted.filter((m) => m.type === "toolOutput"), [], "前缀 chunk 不入主流（relay 面零改）")
  const [routed] = posted.filter((m) => m.type === "toolPanel")
  assert.ok(routed != null, "已入 `sub:` 频道（反面对照：async 池路安全）")
  assert.equal(typeof routed.text, "string", "relay 内归一 ⇒ 对象不入载荷")
  assert.equal(routed.text, CHUNK.text)
})
