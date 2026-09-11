/**
 * scenario-05-panel-basics.test.mjs — 集成场景 ⑤「TUI / 面板基本盘」VSC 实例 + 种子 S2。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = webview DOM 直驱（happy-dom——
 * 面板 / 活动面；种子 S2 落此））；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.5 + §5.8。
 *
 * 三态（VSC 映射——CLI 端 TUI 键位面在本端 = webview 输入 / 卡片 / 终止面）：
 *   正常 —— 输入 → Enter 提交：文本经面板消息送达宿主回合（交接文本与输入一致），渲染面
 *           随宿主回帧更新；
 *   边界 —— 提问面：宿主发问 → 卡片渲染 → 用户点选项 → 回传送达宿主并 resolve 该问；
 *   错误 —— 终止（Stop）面清理闭合：中止直达回合控制器、未答卡片取消（host + DOM 双清）、
 *           零悬挂（CLI「退出键 → cleanup」的本端语义映射——VSC 无 TUI 退出键）。
 *   种子 S2（GitHub #7——生产反馈收编）——webview 行内代码字面量：渲染文本逐字（DOM 断言）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installFullIndexFixture } from "../helpers/webview-env.mjs"
import { handlePanelMessage } from "../../src/extension/panel-messages.mjs"
import { makeAskInPanel } from "../../src/extension/panel-callbacks.mjs"

let cleanupEnv
let capturedPosts

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture() // index.html 全量 id + 默认内联样式（真 chat.js 模块图引导所需）
  await import("../../webview/chat.js") // 顶层装配（消息循环 + input Enter 注册）
})
after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

/** 宿主 → webview 帧。 */
const hostFrame = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const postsSince = (mark) => capturedPosts.slice(mark)
const inputEl = () => document.getElementById("input")
const messagesEl = () => document.getElementById("messages")

/** 桩面板（宿主侧 handlePanelMessage 最小形状——chat-panel.test.mjs 先例）。 */
function stubPanel(over = {}) {
  const posted = []
  const p = {
    _turnState: "idle",
    _abortController: null,
    _abortRequested: false,
    _questionQueue: [],
    _questionSeq: 0,
    _permissionQueue: [],
    _statusBar: null,
    _chatCalls: [],
    _setStatus() {},
    _refreshStatus() {},
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _chat(...args) { p._chatCalls.push(args); return Promise.resolve() },
    posted,
    ...over,
  }
  return p
}

test("⑤ 正常：输入 → Enter 提交 → 文本送达宿主回合；宿主回帧 → 渲染面更新", async () => {
  inputEl().value = "帮我改一下 README"
  const mark = capturedPosts.length
  inputEl().dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
  const sent = postsSince(mark).filter((m) => m.type === "userMessage")
  assert.equal(sent.length, 1, "Enter 发出一条 userMessage（webview 提交面）")
  assert.equal(sent[0].text, "帮我改一下 README", "提交文本 = 输入文本")
  assert.equal(inputEl().value, "", "提交后输入框清空")

  // 宿主回合交接（消息面 → 回合驱动）
  const panel = stubPanel()
  await handlePanelMessage(panel, sent[0])
  assert.equal(panel._chatCalls.length, 1, "宿主收到并开一轮")
  assert.equal(panel._chatCalls[0][0], "帮我改一下 README", "交接文本逐字一致")

  // 渲染面：宿主回帧 → 对话流更新
  const before2 = messagesEl().children.length
  hostFrame({ type: "assistantMessage", text: "已改好 **README** 的标题。" })
  assert.ok(messagesEl().children.length > before2, "渲染面新增一帧")
  const bubble = messagesEl().querySelector(".bubble.content")
  assert.ok(bubble, "助手气泡已渲染")
  assert.equal(bubble.textContent, "已改好 README 的标题。", "气泡文本 = 帧文本（Markdown 渲染后文本不变）")
  assert.match(bubble.innerHTML, /<strong>README<\/strong>/, "Markdown 强强调已渲染")
})

test("⑤ 边界：提问面——宿主发问 → 卡片渲染 → 点选项 → 回传送达并 resolve", async () => {
  const panel = stubPanel({ _abortController: new AbortController() })
  const ask = makeAskInPanel(panel)
  const pending = ask("选哪个方案？", ["方案 A", "方案 B"])
  const questionFrame = panel.posted.find((m) => m.type === "question")
  assert.ok(questionFrame, "宿主发出 question 帧")
  assert.ok(questionFrame.promptId, "问题带 promptId（回传按 id 归属）")

  hostFrame(questionFrame)
  const card = messagesEl().querySelector(".question-card")
  assert.ok(card, "卡片渲染在对话流内")
  const options = [...card.querySelectorAll(".question-option")]
  assert.deepEqual(options.map((b) => b.textContent), ["方案 A", "方案 B"], "选项按钮逐字呈现")

  const mark = capturedPosts.length
  options[0].click()
  const resp = postsSince(mark).find((m) => m.type === "questionResponse")
  assert.ok(resp, "点选项回传 questionResponse")
  assert.equal(resp.answer, "方案 A", "回传答案 = 所点选项")
  assert.equal(resp.promptId, questionFrame.promptId, "回传携带 promptId（不错配队头）")

  await handlePanelMessage(panel, resp)
  assert.equal(await pending, "方案 A", "该问以用户答案为结果 resolve（审批/提问回调结果正确）")
  assert.equal(panel._questionQueue.length, 0, "队列出清")
  assert.equal(messagesEl().querySelectorAll(".question-card").length, 0, "作答后卡片自行移除（不残留）")
})

test("⑤ 错误：终止（Stop）清理闭合——中止直达控制器 + 未答卡取消 + 零悬挂（CLI 退出面语义映射）", async () => {
  const controller = new AbortController()
  const panel = stubPanel({ _turnState: "running", _abortController: controller })
  const ask = makeAskInPanel(panel)
  const pending = ask("继续吗？", ["继续", "停"])

  hostFrame(panel.posted.find((m) => m.type === "question"))
  assert.equal(messagesEl().querySelectorAll(".question-card").length, 1, "有一个待答卡")

  // webview 终止面（Stop 按钮）→ 宿主
  const mark = capturedPosts.length
  document.getElementById("abort-btn").click()
  const abortMsg = postsSince(mark).find((m) => m.type === "abort")
  assert.ok(abortMsg, "Stop 发出 abort（控制直通——不排队）")
  await handlePanelMessage(panel, abortMsg)
  assert.equal(controller.signal.aborted, true, "中止直达回合控制器")
  assert.equal(await pending, null, "未答卡以 null 释放（回合不悬挂）")

  const cancelled = panel.posted.find((m) => m.type === "questionCancelled")
  assert.ok(cancelled, "宿主广播 questionCancelled")
  hostFrame(cancelled)
  assert.equal(messagesEl().querySelectorAll(".question-card").length, 0, "DOM 卡片随取消移除（清理闭合）")
  assert.equal(panel._questionQueue.length, 0, "宿主队列零残留")
})

test("⑤ 种子 S2（GitHub #7）：网页源码片段原样显示——渲染文本逐字、后段不消失、零真实脚本", () => {
  const source = '检测源码里的 `<script type="application/ld+json">` 是否存在 FAQPage。\n后续段落文本'
  const before = messagesEl().children.length
  hostFrame({ type: "assistantMessage", text: source })
  const bubbles = messagesEl().querySelectorAll(".bubble.content")
  const bubble = bubbles[bubbles.length - 1]
  assert.equal(messagesEl().children.length, before + 1, "新帧渲染")
  assert.match(bubble.textContent, /<script type="application\/ld\+json">/, "行内代码中的源码片段逐字可见（不被吞）")
  assert.ok(bubble.textContent.includes("后续段落文本"), "后段文本可见（issue 症状不复现）")
  assert.equal(bubble.querySelector("script"), null, "零真实 <script> 元素（源码只作文本）")
  assert.equal(messagesEl().querySelectorAll("script").length, 0, "全对话流零脚本元素")
})
