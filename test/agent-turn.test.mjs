/**
 * agent-turn.mjs tests — 队列逐条处理（runAgentTurn 尾部 while 循环）。
 * runAgent / saveSession 经 ctx 注入 mock，不触网、不写盘。
 * createCheckpoint 对非 git 的临时 cwd 直接返回 null（只读检查）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { runAgentTurn } from "../src/tui/agent-turn.mjs"

/** Minimal ctx mock：记录 runAgent / handleSlash / saveSession 调用。 */
function turnCtx(overrides = {}) {
  const agent = {
    cwd: mkdtempSync(join(tmpdir(), "thincoder-turn-")),
    provider: { model: "test-model" },
    history: [],
    config: {},
    tasks: [],
    tools: [],
  }
  const state = {
    lines: [], streaming: "", reasoning: "",
    subTasks: {}, toolStreams: {}, outputPanels: {},
    tasks: [], queue: [],
    processing: false, controller: null, interruptPrompt: null,
    permission: null, currentTool: null, processingStarted: 0,
    status: "Ready",
    tokens: { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0, reasoningTokens: 0 },
  }
  const ctx = {
    agent, state,
    calls: { runAgent: [], slash: [], saved: 0 },
    lines: [],
    pushLine: (text) => ctx.lines.push({ kind: "line", text }),
    pushLabel: (text) => ctx.lines.push({ kind: "label", text }),
    render: () => {},
    scheduleRender: () => {},
    ensureAssistantLabel: () => {},
    askPermission: async () => true,
    askQuestion: async () => "",
    handleSlash: async (text) => { ctx.calls.slash.push(text) },
    summarize: () => "",
    runAgent: async (_agent, text) => { ctx.calls.runAgent.push(text) },
    saveSession: () => { ctx.calls.saved++ },
    ...overrides,
  }
  return ctx
}

const cleanups = []
test.after(() => { for (const dir of cleanups) rmSync(dir, { recursive: true, force: true }) })
function trackedCtx(overrides) {
  const ctx = turnCtx(overrides)
  cleanups.push(ctx.agent.cwd)
  return ctx
}

test("runAgentTurn: 纯斜杠队列逐条走 handleSlash，不再发给 LLM", async () => {
  const ctx = trackedCtx()
  ctx.state.queue.push({ text: "/fold on" }, { text: "/clear" })
  await runAgentTurn(ctx, "hello")
  assert.deepEqual(ctx.calls.runAgent, ["hello"], "只有首条用户输入发给 LLM")
  assert.deepEqual(ctx.calls.slash, ["/fold on", "/clear"], "队列逐条检查，全部走 handleSlash")
  assert.equal(ctx.state.queue.length, 0)
  assert.equal(ctx.state.processing, false)
})

test("runAgentTurn: 混合队列按序执行——斜杠命令不发 LLM，普通消息递归新一轮", async () => {
  const ctx = trackedCtx()
  ctx.state.queue.push({ text: "/fold on" }, { text: "second task" }, { text: "/clear" })
  await runAgentTurn(ctx, "first task")
  assert.deepEqual(ctx.calls.runAgent, ["first task", "second task"], "普通消息才发给 LLM")
  assert.deepEqual(ctx.calls.slash, ["/fold on", "/clear"], "斜杠命令走 handleSlash")
  const queueLabels = ctx.lines.filter((l) => l.kind === "label" && /from queue/.test(l.text))
  assert.equal(queueLabels.length, 1, "队列消息带 (from queue) 标签")
  assert.equal(ctx.state.queue.length, 0)
})

test("runAgentTurn: handleSlash 期间新入队项继续被消费且不重复", async () => {
  const ctx = trackedCtx({
    handleSlash: async (text) => {
      ctx.calls.slash.push(text)
      // 模拟 handleSlash 执行期间用户又排队了新消息
      if (text === "/a") ctx.state.queue.push({ text: "/b" }, { text: "follow up" })
    },
  })
  ctx.state.queue.push({ text: "/a" })
  await runAgentTurn(ctx, "start")
  assert.deepEqual(ctx.calls.slash, ["/a", "/b"], "新入队的斜杠命令各执行一次")
  assert.deepEqual(ctx.calls.runAgent, ["start", "follow up"], "新入队的普通消息各执行一次")
  assert.equal(ctx.state.queue.length, 0, "队列被完全消费，无重复无遗漏")
})

test("runAgentTurn: catch 块内抛异常也能清理 ticker 与状态（try/finally）", async () => {
  const { ContinueError } = await import("../src/agent.mjs")
  const ctx = trackedCtx({
    runAgent: async () => { throw new ContinueError(5) },
    // ContinueError 分支的 pushLabel(`❯ Continue`) 才抛出，模拟 UI 层异常逃出 catch 块
    //（开头的 pushLabel(`❯ You:`) 必须正常，否则进不了 try/finally 区域）
    pushLabel: (text) => {
      if (String(text).includes("Continue")) throw new Error("ui boom")
      ctx.lines.push({ kind: "label", text })
    },
  })
  await assert.rejects(() => runAgentTurn(ctx, "task"), /ui boom/)
  // finally 必须已执行：状态复位 + session 保存（ticker 若泄漏，1s interval 会拖住测试进程不退出）
  assert.equal(ctx.state.processing, false)
  assert.equal(ctx.state.controller, null)
  assert.equal(ctx.state.status, "Ready")
  assert.equal(ctx.calls.saved, 1)
})

// ---- Subagent streaming relay：role#id/ 前缀剥离（连字符 role，如 eng-coder） ----

/** 捕获 runAgentTurn 内部构造的 callbacks（ctx.runAgent mock 第三参）；turn 结束后再调用，避开 finally 的状态复位。 */
async function captureCallbacks() {
  const ctx = trackedCtx()
  let captured = null
  ctx.runAgent = async (_agent, _text, callbacks) => { captured = callbacks }
  await runAgentTurn(ctx, "relay")
  return { ctx, callbacks: captured }
}

test("subagent relay: eng-coder#1/ 前缀剥离——连字符 role 路由 subTasks，主流无前缀", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("eng-coder#1/hello")
  const sub = ctx.state.subTasks["eng-coder#1"]
  assert.ok(sub, `subTasks["eng-coder#1"] 创建（role 保留连字符）`)
  assert.equal(sub.text, "hello", "payload 进 subTask 文本")
  assert.equal(sub.role, "eng-coder")
  assert.ok(!ctx.state.streaming.includes("eng-coder#1/"), "带前缀 token 不进主聊天流")
})

test("subagent relay 回归: coder#2/ 仍路由 subTasks", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#2/writing code...")
  assert.equal(ctx.state.subTasks["coder#2"].text, "writing code...")
  assert.ok(!ctx.state.streaming.includes("coder#2/"), "无连字符 role 不受正则变更影响")
})

test("subagent relay: 无前缀 token 照常进主 streaming", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("plain text")
  assert.equal(ctx.state.streaming, "plain text")
  assert.deepEqual(ctx.state.subTasks, {}, "无前缀不产生 subTask")
})

test("subagent relay: onToolCall eng-coder#3/read 路由 tool 名", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToolCall("eng-coder#3/read", { path: "src/a.mjs" })
  assert.equal(ctx.state.subTasks["eng-coder#3"].tool, "read")
  assert.equal(ctx.state.subTasks["eng-coder#3"].toolArgs.path, "src/a.mjs")
})
// ---------------------------------------------------------------- 异步蒸馏：保存回调 + 退出 flush（SEND-STALL-DISTILL 2026-08-25）
// AC5: onDistilled → 磁盘会话为压缩版；AC8: 退出路径先等（≤5s）蒸馏落定再最终保存。

test("onDistilled: 压缩落位后触发保存——磁盘会话含摘要 note（AC5）", async () => {
  const ctx = trackedCtx()
  let callbacks = null
  ctx.runAgent = async (_agent, _text, cb) => { callbacks = cb }
  const snapshots = []
  ctx.saveSession = (agent) => {
    ctx.calls.saved++
    snapshots.push(JSON.parse(JSON.stringify(agent.history)))
  }
  await runAgentTurn(ctx, "探索")
  assert.ok(callbacks && typeof callbacks.onDistilled === "function", "callbacks 带 onDistilled 钩子")
  // 模拟蒸馏完成：压缩历史替换 + 触发回调（真实路径：summarizeRunExplorations 内部调用）
  ctx.agent.history.push({ role: "user", content: "[Exploration summary]\n压缩摘要" })
  callbacks.onDistilled()
  assert.ok(
    snapshots.some((h) => h.some((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))),
    "保存快照含摘要 note（磁盘会话为压缩版，AC5）",
  )
  assert.ok(ctx.calls.saved >= 1, "保存发生过")
})

test("退出 flush: 蒸馏在途时退出——先等蒸馏落定再最终保存（AC8 正常分支）", async () => {
  const ctx = trackedCtx()
  const order = []
  ctx.runAgent = async (agent) => {
    agent._pendingDistill = new Promise((resolve) => {
      setTimeout(() => {
        agent.history.push({ role: "user", content: "[Exploration summary]\n退出前落定" })
        order.push("distill-done")
        resolve()
      }, 150)
    })
  }
  ctx.saveSession = () => { ctx.calls.saved++; order.push("saved") }
  await runAgentTurn(ctx, "任务")
  assert.deepEqual(order, ["distill-done", "saved"], "退出路径先等蒸馏落定、再执行最终保存")
  assert.ok(ctx.calls.saved >= 1)
})

test("退出 flush: 蒸馏超时上限内返回，不拖慢退出，仍保存（AC8 超时分支）", async () => {
  const ctx = trackedCtx()
  const slow = new Promise(() => {}) // 永不落定
  ctx.runAgent = async (agent) => {
    agent._pendingDistill = slow
  }
  ctx.distillFlushTimeoutMs = 50 // 测试用短超时（生产默认 5000）
  const t0 = Date.now()
  await runAgentTurn(ctx, "任务")
  assert.ok(Date.now() - t0 < 1000, "超时上限内返回，退出不被蒸馏拖住")
  assert.ok(ctx.calls.saved >= 1, "最终保存仍执行")
  assert.equal(ctx.agent._pendingDistill, slow, "flush 不摘除 pendingDistill——下一轮 N1 await 仍有效（评审 #1 回归）")
})

test("退出 flush: 在途蒸馏跨轮存活——下一轮 runAgent 开头仍拿到同一 promise（N1）", async () => {
  const ctx = trackedCtx()
  const slow = new Promise(() => {}) // 蒸馏仍在途（flush 超时后）
  ctx.runAgent = async (agent) => { agent._pendingDistill = slow }
  ctx.distillFlushTimeoutMs = 50
  await runAgentTurn(ctx, "第一轮")
  // 第二轮（flush 窗口内提交的并发 turn）：runAgent 开头必须还能看到在途蒸馏
  let seen = "not-called"
  ctx.runAgent = async (agent) => { seen = agent._pendingDistill }
  await runAgentTurn(ctx, "第二轮")
  assert.equal(seen, slow, "第二轮 runAgent 开头仍拿到在途蒸馏 promise（N1 await 不被 TUI flush 破坏）")
})
