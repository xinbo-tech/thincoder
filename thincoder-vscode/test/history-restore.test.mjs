/**
 * history-restore.test.mjs — SESSION-RESTORE-PARITY ③ webview 恢复呈现组（DOM）。
 * docs/design/SESSION-RESTORE-PARITY.md §2/§3/§4（AC-B/E/F/G——工具卡/容器序/时间/welcome）。
 * 手法（activity-flow.test.mjs 模式）：setupWebview + 自备 DOM fixture（installChatFixture
 * ids + scroll.js 需要的 #chat-container/#toolbar）后动态 import 真模块（state.js/
 * ui.js/history.js——单一运行时对象 S/ctx），直驱 applyHistoryPage/buildHistoryMessage
 * （消息 = historyWindow 输出形状直构——webview 直构测试）。快层直跑（无真实定时器）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview } from "./helpers/webview-env.mjs"
import { fmtTime } from "../webview/lib.js"

// ─── happy-dom 环境（必须先于 webview 模块 import——state.js 顶层读 DOM + acquireVsCodeApi）───

let cleanupEnv

before(() => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  // state.js 读 ~25 ids；scroll.js（history.js 静态依赖）还要 #chat-container/#toolbar
  const ids = [
    "messages", "input", "send-btn", "abort-btn", "model-btn", "reasoning-btn",
    "model-dropdown", "reasoning-dropdown", "session-selector", "session-title",
    "session-dropdown", "welcome-panel", "welcome-heading", "welcome-text",
    "welcome-provider-label", "welcome-provider", "welcome-key-label", "welcome-key",
    "welcome-save-btn", "welcome-skip-btn", "welcome-settings-btn", "project-btn",
    "status-line", "task-panel", "subagent-panel", "goal-panel", "chat-container", "toolbar",
  ]
  document.body.innerHTML = ids.map((id) => `<div id="${id}"></div>`).join("")
})

after(() => {
  cleanupEnv()
})

/** 动态 import 真模块（模块缓存——每文件一次；必须在 setupWebview 之后）。 */
async function loadWebview() {
  const state = await import("../webview/state.js")
  const ui = await import("../webview/ui.js")
  const history = await import("../webview/history.js")
  return { S: state.S, ctx: state.ctx, buildHistoryMessage: ui.buildHistoryMessage, showWelcome: ui.showWelcome, applyHistoryPage: history.applyHistoryPage }
}

/** 逐测冷启复位（node --test 同文件串行——模块缓存共享同一 S/ctx——每测独立起点）。 */
function fresh({ ctx }) {
  ctx.messagesEl.replaceChildren()
  ctx._hasOlder = false
  ctx._nextIdx = 0
}

const assistantMsg = (over = {}) => ({
  kind: "assistant", text: "hello **bold**", reasoning: null, timestamp: null, idx: 5, turnStart: true, tools: [],
  ...over,
})

// ─── G welcome（空会话语义）────────────────────

test("G：非空首屏插入前移除 .welcome——空历史保留（applyHistoryPage——AC-G）", async () => {
  const { ctx, showWelcome, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  showWelcome(ctx)
  assert.ok(ctx.messagesEl.querySelector(".welcome"), "welcome 在场")
  applyHistoryPage(ctx, { messages: [assistantMsg()], hasOlder: false, older: false })
  assert.equal(ctx.messagesEl.querySelector(".welcome"), null, "非空首屏——welcome 移除")
  assert.equal(ctx.messagesEl.querySelectorAll(".message").length, 1, "历史消息在位")

  fresh({ ctx })
  showWelcome(ctx)
  applyHistoryPage(ctx, { messages: [], hasOlder: false, older: false })
  assert.ok(ctx.messagesEl.querySelector(".welcome"), "空历史——welcome 保留（真空会话语义）")
})

// ─── assistant 帧容器 DOM 序（AC-A/B/E）────────

test("assistant 帧容器序：label(turnStart) → details.reasoning-block[open] → bubble → 嵌套工具卡 ×n——无顶层独立卡——data-idx 仅外层", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  const msg = assistantMsg({
    reasoning: "deep think",
    tools: [
      { id: "c1", name: "bash", args: '{"cmd":"ls"}', result: "out-ls" },
      { id: "c2", name: "grep", args: '{"q":"x"}', result: "Error: nothing found" },
    ],
  })
  applyHistoryPage(ctx, { messages: [msg], hasOlder: false, older: false })

  const frame = ctx.messagesEl.querySelector(".message.assistant")
  assert.ok(frame, "帧容器存在")
  assert.equal(frame.dataset.idx, "5", "data-idx = 帧原始 idx")
  const kids = [...frame.children]
  assert.deepEqual(kids.map((k) => k.className), ["msg-label", "reasoning-block", "bubble content", "tool-call", "tool-call"],
    "内部序：label → thinking → bubble → 工具卡 ×2")
  assert.equal(kids[0].textContent, "❯ ThinCoder:", "turnStart 画标签")
  assert.equal(frame.querySelectorAll("[data-idx]").length, 0, "嵌套卡/块零 data-idx（分页锚只外层）")

  const details = kids[1]
  assert.equal(details.tagName, "DETAILS")
  assert.equal(details.open, true, "reasoning-block 展开（live 同构）")
  assert.ok(details.querySelector("summary").textContent.includes("Thinking"), "summary = Thinking…")
  assert.ok(details.querySelector(".reasoning-content").textContent.includes("deep think"), "thinking 内容 = md(reasoning)（AC-E）")
  assert.ok(kids[2].textContent.includes("hello bold"), "bubble = md(text)")

  // 卡嵌容器内——无顶层独立卡（B——live 终态卡同构）
  assert.equal(frame.querySelectorAll(".tool-call").length, 2)
  assert.equal(ctx.messagesEl.querySelectorAll(":scope > .tool-call").length, 0, "无顶层独立工具卡")
  // 拷贝按钮按容器挂（code-block 空集——不炸）
  assert.equal(ctx.messagesEl.querySelectorAll(".code-copy-btn").length, 0)
})

test("assistant 帧：turnStart:false 无标签；无 content/reasoning-only 帧无 bubble——卡照嵌", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  // mid-turn 帧（前段多 LLM 调用延续）——纯 thinking + 卡
  applyHistoryPage(ctx, {
    messages: [assistantMsg({ idx: 8, turnStart: false, text: null, reasoning: "think-only", tools: [{ id: "c9", name: "bash", args: "{}", result: "r" }] })],
    hasOlder: false, older: false,
  })
  const frame = ctx.messagesEl.querySelector(".message.assistant")
  assert.ok(frame.querySelector(".msg-label") === null, "turnStart:false 不画标签")
  assert.equal(frame.querySelector(".bubble"), null, "content null → 无 bubble")
  assert.ok(frame.querySelector(".reasoning-block"), "thinking 块在")
  assert.equal(frame.querySelectorAll(".tool-call").length, 1, "工具卡照嵌")
})

// ─── 工具卡 header/status/body（AC-B）─────────

test("工具卡：header raw args slice 80 + title 全 + done 绿折叠；JSON.parse 成功 → pretty JSON 入 body（result 上方独立块）", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  const longArgs = JSON.stringify({ cmd: "run", payload: "x".repeat(100) })
  const msg = assistantMsg({ text: null, tools: [{ id: "c1", name: "bash", args: longArgs, result: "out-ok" }] })
  applyHistoryPage(ctx, { messages: [msg], hasOlder: false, older: false })
  const card = ctx.messagesEl.querySelector(".message.assistant .tool-call")
  const h = card.querySelector(".tool-call-header")
  assert.equal(h.querySelector(".tool-call-name").textContent, "bash")
  const argsEl = h.querySelector(".tool-call-args")
  assert.equal(argsEl.textContent.length, 80, "header args span = raw slice 80（live :209 对齐）")
  assert.equal(argsEl.title, longArgs, "title = args 全（live 对齐）")
  const status = h.querySelector(".tool-call-status")
  assert.equal(status.textContent, "done")
  assert.equal(status.style.color, "#4ec9b0", "成功绿")
  assert.equal(card.querySelector(".tool-call-body").classList.contains("open"), false, "成功折叠")
})

test("工具卡 body：pretty JSON 于 result 上方独立块；无 result 无 body 文本——卡 done", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  applyHistoryPage(ctx, {
    messages: [assistantMsg({
      text: null,
      tools: [
        { id: "c1", name: "bash", args: '{"cmd":"ls"}', result: "out-ls" },
        { id: "c2", name: "grep", args: "slimmed…", result: null }, // 截断串 parse 失败 → header raw 原样
      ],
    })],
    hasOlder: false, older: false,
  })
  const cards = ctx.messagesEl.querySelectorAll(".message.assistant .tool-call")
  const b1 = cards[0].querySelector(".tool-call-body")
  assert.equal(b1.textContent, JSON.stringify({ cmd: "ls" }, null, 2) + "\nout-ls", "body = pretty JSON 块（result 上方）+ result")
  const h2 = cards[1].querySelector(".tool-call-header")
  assert.equal(h2.querySelector(".tool-call-args").textContent, "slimmed…", "parse 失败（slim 截断串）→ header raw 原样")
  assert.equal(h2.querySelector(".tool-call-args").title, "slimmed…")
  assert.equal(cards[1].querySelector(".tool-call-body").textContent, "", "无 result → body 空")
  assert.equal(h2.querySelector(".tool-call-status").textContent, "done")
})

test("工具卡 Error：/^Error[:：]/ → 红 error + body 展开（finishToolCard 判据复用）", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  applyHistoryPage(ctx, {
    messages: [assistantMsg({ text: "after", tools: [{ id: "e1", name: "bash", args: "{}", result: "Error: boom" }] })],
    hasOlder: false, older: false,
  })
  const card = ctx.messagesEl.querySelector(".message.assistant .tool-call")
  const h = card.querySelector(".tool-call-header")
  assert.equal(h.querySelector(".tool-call-status").textContent, "error")
  assert.equal(h.querySelector(".tool-call-status").style.color, "#f14c4c", "错误红")
  assert.equal(card.querySelector(".tool-call-body").classList.contains("open"), true, "错误保持展开")
  assert.equal(h.getAttribute("aria-expanded"), "true")
  assert.ok(card.querySelector(".tool-call-body").textContent.includes("Error: boom"), "结果文本在 body")
})

// ─── user 气泡时间（F）─────────────────────────

test("F：user 真实 ts 显示；缺失不显示（无 fmtTime(new Date()) 误导回退）", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  const TS = new Date(2026, 0, 2, 9, 5).getTime()
  applyHistoryPage(ctx, {
    messages: [
      { kind: "user", text: "with-ts", timestamp: TS, idx: 1 },
      { kind: "user", text: "no-ts", timestamp: null, idx: 2 },
    ],
    hasOlder: false, older: false,
  })
  const msgs = ctx.messagesEl.querySelectorAll(".message.user")
  const label0 = msgs[0].querySelector(".msg-label")
  assert.ok(label0.textContent.includes("❯ You:"), "user 标签")
  assert.equal(msgs[0].querySelector(".msg-time")?.textContent, fmtTime(new Date(TS)), "真实 ts 格式化为 HH:MM")
  assert.equal(msgs[1].querySelector(".msg-time"), null, "无 ts → 不显示时间（无回退'现在'）")
  assert.equal(msgs[1].querySelector(".msg-label").textContent, "❯ You:", "标签无时间尾巴")
})

// ─── 孤儿 tool 顶层卡保底（含 data-idx）────────

test("孤儿 tool：顶层 .tool-call 保底渲染 + data-idx（分页锚——与 live 顶层卡同层）", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  applyHistoryPage(ctx, {
    messages: [
      { kind: "user", text: "q", timestamp: null, idx: 3 },
      { kind: "tool", name: "weird", text: "orphan-body", timestamp: 42, idx: 4 },
    ],
    hasOlder: false, older: false,
  })
  const top = ctx.messagesEl.querySelectorAll(":scope > .tool-call")
  assert.equal(top.length, 1, "孤儿 tool 顶层卡")
  assert.equal(top[0].dataset.idx, "4", "data-idx 在（分页锚）")
  assert.equal(top[0].querySelector(".tool-call-name").textContent, "weird")
  assert.equal(top[0].querySelector(".tool-call-body").textContent, "orphan-body")
})

// ─── older 页前置（既有分页语义零回退）──────────

test("older 页前置插入（既有懒历史语义——C1/C2 零回退面）", async () => {
  const { ctx, applyHistoryPage } = await loadWebview()
  fresh({ ctx })
  applyHistoryPage(ctx, { messages: [{ kind: "user", text: "newer", timestamp: null, idx: 9 }], hasOlder: true, older: false })
  applyHistoryPage(ctx, { messages: [{ kind: "assistant", text: "older", timestamp: null, idx: 2, turnStart: true }], hasOlder: false, older: true })
  const els = ctx.messagesEl.querySelectorAll(":scope > .message")
  assert.equal(els.length, 2)
  assert.equal(els[0].dataset.idx, "2", "older 页前置在既有内容之上")
  assert.equal(ctx._hasOlder, false, "hasOlder 寄存器跟随载荷")
})
