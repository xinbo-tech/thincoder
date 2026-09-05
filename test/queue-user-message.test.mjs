// queue-user-message.test.mjs — 2026-09-05 人机并行对齐（CLI state.queue 语义）：
// 父回合运行中（panel._turnActive）的 userMessage 一律排队（panel._suspQueue）——不
// abort 父回合、不并发新回合、不丢消息；回合尾 while 消费（panel-chat.mjs impl 尾——
// CLI agent-turn 尾 state.queue 消费对位）。挂起活跃/释放窗口路径由 panel._chat 上游
// 分流（D-S5——本测试只管 userMessage 入队分支）。
import { test, describe } from "node:test"
import assert from "node:assert/strict"

describe("panel-messages userMessage — queue while parent turn active", () => {
  test("turnActive: message queued, _chat NOT called, webview notified", async () => {
    delete globalThis.__dirtyPanelMessages
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    const posted = []
    const panel = {
      _turnActive: true,
      _suspQueue: [],
      _panel: { webview: { postMessage: (m) => posted.push(m) } },
      _chat: () => { throw new Error("_chat must NOT run while the parent turn is active") },
      _liveLines: { history: {} },
    }
    await handlePanelMessage(panel, { type: "userMessage", text: "queued message" })
    assert.equal(panel._suspQueue.length, 1, "queued")
    assert.equal(panel._suspQueue[0].text, "queued message")
    assert.ok(posted.some((m) => m.type === "messageQueued"), "webview sees messageQueued")
  })

  test("idle (turn not active): falls through to _chat", async () => {
    const { handlePanelMessage } = await import("../src/extension/panel-messages.mjs")
    let called = 0
    const panel = {
      _turnActive: false,
      _suspQueue: [],
      _panel: { webview: { postMessage: () => {} } },
      _chat: () => { called++ },
    }
    await handlePanelMessage(panel, { type: "userMessage", text: "normal" })
    assert.equal(called, 1, "idle → _chat directly")
    assert.equal(panel._suspQueue.length, 0, "no queue for idle sends")
  })
})
