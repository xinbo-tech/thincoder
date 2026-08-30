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
import { buildConvLines } from "../src/tui/render-conversation.mjs"
import { C } from "../src/tui/ansi.mjs"

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
    pushLine: (text, color, kind) => state.lines.push({ text, color, _kind: kind }),
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

test("runAgentTurn: 同名并行工具各自有 elapsed（_toolTicks FIFO 队列，2026-08-30 评审）", async () => {
  // 回归：单槽 _toolTicks 下，并行同名工具（如 read ×2）第二次 onToolCall 覆盖
  // 第一次的时间戳、onToolResult 提早清槽——第一个块耗时错误、第二个丢失。
  // 改 FIFO 队列后按调用序各取各的。单框化后 elapsed 在载体头部状态（无 done 行）。
  const ctx = trackedCtx({
    summarize: () => "",
    runAgent: async (_agent, _text, cbs) => {
      cbs.onToolCall("read", { path: "a.mjs" })
      cbs.onToolCall("read", { path: "b.mjs" })
      cbs.onToolResult("read", "ok a")
      cbs.onToolResult("read", "ok b")
    },
  })
  await runAgentTurn(ctx, "hello")
  const toolBlocks = ctx.state.lines.map((l) => l._toolBlock).filter(Boolean)
  assert.equal(toolBlocks.length, 2, "两个工具块")
  assert.ok(toolBlocks.every((b) => b.done && typeof b.elapsed === "number"), "各自完成且带 elapsed")
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

test("subagent relay (§7.2 D4): eng-coder#1/ 前缀剥离——连字符 role 路由区块，主流无前缀", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("eng-coder#1/hello")
  const sub = ctx.state.subTasks["eng-coder#1"]
  assert.ok(sub, `subTasks["eng-coder#1"] 创建（role 保留连字符）`)
  // T-B（F2 反转断言）：子agent LLM 文本进 blocks kind=text
  assert.ok(sub.blocks.some((b) => b.kind === "text" && b.text.includes("hello")), "payload 进区块 text block")
  assert.equal(sub.role, "eng-coder")
  assert.ok(!ctx.state.streaming.includes("eng-coder#1/"), "带前缀 token 不进主聊天流")
})

test("subagent relay 回归 (§7.2 D4): coder#2/ 仍路由区块", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#2/writing code...")
  const sub = ctx.state.subTasks["coder#2"]
  assert.ok(sub.blocks.some((b) => b.kind === "text" && b.text.includes("writing code...")))
  assert.ok(!ctx.state.streaming.includes("coder#2/"), "无连字符 role 不受正则变更影响")
})

test("subagent relay: 无前缀 token 照常进主 streaming", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("plain text")
  assert.equal(ctx.state.streaming, "plain text")
  assert.deepEqual(ctx.state.subTasks, {}, "无前缀不产生 subTask")
})

test("subagent relay (§7.2 D4): onToolCall eng-coder#3/read 开 tool block + currentTool", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToolCall("eng-coder#3/read", { path: "src/a.mjs" })
  const sub = ctx.state.subTasks["eng-coder#3"]
  assert.equal(sub.currentTool, "read")
  assert.equal(sub.toolArgs.path, "src/a.mjs")
  assert.ok(sub.blocks.some((b) => b.kind === "tool" && b.text.includes("❯ read")), "tool block 开块")
})

// ---- §7.2 T-A/T-B/T-C/T-D/T-K：区块数据层用例（渲染断言见 tui.test.mjs） ----

test("T-A (F1): 子agent bash 长输出 → tool block 增长、currentTool=bash", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/[model]glm-5.3")
  callbacks.onToolCall("coder#1/bash", { command: "npm test" })
  for (let i = 0; i < 20; i++) callbacks.onToolOutput("coder#1/bash", `output line ${i}\n`)
  const sub = ctx.state.subTasks["coder#1"]
  assert.equal(sub.currentTool, "bash")
  const toolBlock = sub.blocks.find((b) => b.kind === "tool")
  assert.ok(toolBlock, "tool block 存在")
  for (const i of [0, 10, 19]) assert.ok(toolBlock.text.includes(`output line ${i}`), `line ${i} 保留`)
})

test("T-E (F5): consult 顾问前缀路由进区块——main_history 调用可见", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("consult#1/[model]glm-5.2")
  callbacks.onToolCall("consult#1/main_history", { limit: 20 })
  callbacks.onToken("consult#1/diagnosis so far")
  const sub = ctx.state.subTasks["consult#1"]
  assert.ok(sub, "consult 子代理建独立区块（与会诊其他模型互不串扰）")
  assert.ok(sub.blocks.some((b) => b.kind === "tool" && b.text.includes("❯ main_history")), "main_history 调用在区块可见")
  assert.ok(sub.blocks.some((b) => b.kind === "text" && b.text.includes("diagnosis so far")))
})

test("T-G (F7): bash 裸串归一化 {kind:\"text\"} 进载体 output；advisor 对象 chunk 原样进 _advisorBlocks", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToolCall("bash", { command: "echo hi" })
  callbacks.onToolOutput("bash", "raw stdout line\n")
  const blk = [...ctx.state.lines].reverse().find((l) => l._toolBlock)
  assert.ok(blk && blk._toolBlock.output.includes("raw stdout line"), "裸串按 text kind 进载体 output（单框化后无 _live 行）")
  callbacks.onToolOutput("advisor", { kind: "think", text: "checking" })
  assert.ok(ctx.state._advisorBlocks.some((b) => b.kind === "think" && b.text === "checking"), "advisor {kind,text} 对象原样入有序块")
})

test("T-B (F2): 子agent reasoning token 追加进 blocks kind=think（原『只建条目』断言反转）", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onReasoning("coder#1/I will ")
  callbacks.onReasoning("coder#1/read the file")
  const sub = ctx.state.subTasks["coder#1"]
  const think = sub.blocks.filter((b) => b.kind === "think")
  assert.equal(think.length, 1, "连续 reasoning 合并单块")
  assert.equal(think[0].text, "I will read the file", "内容完整追加（不再是只建条目丢弃内容）")
})

test("T-C (F3): approval 事件 → 区块头部 approval 状态（等待审批可见）", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/⟦ev⟧approval\x1e3\x1e100\x1eapproval\x1ewrite")
  const sub = ctx.state.subTasks["coder#1"]
  assert.equal(sub.approval, "write", "头部进入等待审批态")
  assert.equal(sub.turn, 3)
  assert.equal(sub.maxTurns, 100)
  assert.equal(sub.blocks.length, 0, "事件 token 不进 blocks、不进主流")
  assert.equal(ctx.state.streaming, "")
})

test("T-D (F4): depth=1 孩子 3 个 turn 事件 → 头部 turn 3/100", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  for (let n = 1; n <= 3; n++) callbacks.onToken(`coder#1/⟦ev⟧turn\x1e${n}\x1e100\x1ellm\x1e`)
  const sub = ctx.state.subTasks["coder#1"]
  assert.equal(sub.turn, 3)
  assert.equal(sub.maxTurns, 100)
  assert.equal(sub.blocks.length, 0, "turn 事件不产生内容块")
})

test("T-D 事件安全: 事件 token 落主流为 0（控制字符不进主会话）", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#2/⟦ev⟧turn\x1e1\x1e100\x1ellm\x1e")
  callbacks.onToken("coder#2/⟦ev⟧bogus\x1e1\x1e\x1e\x1e") // 伪事件名不匹配 → 整段当文本？
  const sub = ctx.state.subTasks["coder#2"]
  assert.ok(!ctx.state.streaming.includes("⟦ev⟧"), "事件 token 不入主流")
  // 非良构事件名（bogus）按 content 处理，但事件 token 形态已在生成侧 strip（D7）；
  // 消费端兜底：sanitizeDisplay 会剥 RS（渲染层断言见 tui.test.mjs）
  assert.ok(sub.blocks.every((b) => !b.text.includes("⟦ev⟧turn")))
})

test("T-K (N2): 第 501 行起环形丢弃最旧行 + 累计『已省略』标记；done 后同受约束", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/[model]glm-5.3")
  for (let i = 1; i <= 600; i++) callbacks.onToolOutput("coder#1/bash", `line ${i}\n`)
  let sub = ctx.state.subTasks["coder#1"]
  const total = sub.blocks.reduce((n, b) => n + b.text.split("\n").length, 0)
  assert.ok(total <= 501, `总行数 ≤ 501（含 meta 标记行），实际 ${total}`)
  const meta = sub.blocks.find((b) => b.kind === "meta")
  assert.ok(meta && /已省略 \d+ 行/.test(meta.text), "有省略标记")
  assert.ok(!sub.blocks.some((b) => b.kind === "tool" && b.text.includes("line 1\n")), "最旧的 line 1 已被环形丢弃")
  assert.ok(sub.blocks.some((b) => b.kind === "tool" && b.text.includes("line 600")), "最新行保留")
  // done 后继续追加（区块保留可展开，同受上限约束）
  sub.done = true
  for (let i = 601; i <= 700; i++) callbacks.onToolOutput("coder#1/bash", `post ${i}\n`)
  const total2 = sub.blocks.reduce((n, b) => n + b.text.split("\n").length, 0)
  assert.ok(total2 <= 501, `done 后仍受 500 行上限，实际 ${total2}`)
})

test("T-K (N1): onToolOutput 数据即进区块（节流只作用于渲染调度）", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  let renders = 0
  ctx.scheduleRender = () => { renders++ }
  callbacks.onToolCall("coder#1/bash", { command: "npm test" })
  for (let i = 0; i < 50; i++) callbacks.onToolOutput("coder#1/bash", `row ${i}\n`)
  const toolBlock = ctx.state.subTasks["coder#1"].blocks.find((b) => b.kind === "tool")
  assert.ok(toolBlock.text.includes("row 49"), "50 个 chunk 全部入块（数据不丢）")
  assert.ok(renders < 50, `渲染调度被节流（${renders} < 50）`)
})

test("T-I: ContinueError 拒绝 → done + lastError partial", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/[model]glm-5.3")
  callbacks.onToolCall("coder#1/bash", { command: "npm test" })
  // onToolResult(subagent) 的拒绝文案（escalate 工具返回字符串）→ finishSubTask 标记
  const finishCaptured = []
  ctx.runAgent = async (_agent, _text, cbs) => {
    finishCaptured.push(cbs)
    cbs.onToolResult("subagent", "Subagent (coder) stopped: turn cap reached (100 turns) — work may be partial.\nPartial output: ...")
  }
  await runAgentTurn(ctx, "task")
  // 冻结化 + 可点击展开（残影修复 2026-08-30，用户裁定：冻结后保持完整设计交互）：
  // done 子代理区块冻结为 state.lines 上的 _frozenSubTask 载体行，subTasks 释放
  // 条目；渲染层以 sub-${key} 折叠头+tail3/▼ 全量渲染，与运行中区块交互一致。
  const sub = ctx.state.subTasks["coder#1"]
  assert.ok(!sub, "done 后 subTasks 条目释放（冻结载体行取代驻留）")
  const carrier = ctx.state.lines.find((l) => l._frozenSubTask?.key === "coder#1")
  assert.ok(carrier, "冻结载体行在 state.lines（随会话滚动，无残影）")
  assert.equal(carrier._frozenSubTask.lastError, "turn cap reached — work may be partial", "partial 语义保留在冻结区块")
  const frozen = buildConvLines(ctx.state, 100).map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, ""))
  assert.ok(frozen.some((t) => t.includes("✓ coder#1") && t.includes("done")), "折叠头 ✓ + 定格耗时")
  assert.ok(frozen.some((t) => t.includes("click to expand") && t.includes("coder#1")), "冻结区块可点击展开（_foldToggle 交互在）")
  assert.ok(ctx.state.lines.some((l) => l._frozenSubTask?.blocks?.length > 0), "活动 blocks 随载体保留（展开可见）")
})

test("T-I: 并行 3 子agent → 3 独立区块互不串扰", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/[model]a")
  callbacks.onToken("coder#2/[model]b")
  callbacks.onToken("explore#3/[model]c")
  callbacks.onToken("coder#1/alpha")
  callbacks.onToken("coder#2/beta")
  callbacks.onToken("explore#3/gamma")
  assert.equal(Object.keys(ctx.state.subTasks).length, 3)
  assert.ok(ctx.state.subTasks["coder#1"].blocks.some((b) => b.text.includes("alpha")))
  assert.ok(ctx.state.subTasks["coder#2"].blocks.some((b) => b.text.includes("beta")))
  assert.ok(ctx.state.subTasks["explore#3"].blocks.some((b) => b.text.includes("gamma")))
  assert.ok(!ctx.state.subTasks["coder#1"].blocks.some((b) => b.text.includes("beta")), "互不串扰")
})

test("T-I: resume 后 blocks 续接不重建", async () => {
  const { ctx, callbacks } = await captureCallbacks()
  callbacks.onToken("coder#1/[model]glm")
  callbacks.onToken("coder#1/first-run content")
  // resume（同一个 runAgentTurn 内的第二段 run）不复位 subTasks：
  callbacks.onToken("coder#1/⟦ev⟧turn\x1e5\x1e100\x1ellm\x1e")
  callbacks.onToken("coder#1/resumed content")
  const sub = ctx.state.subTasks["coder#1"]
  assert.ok(sub.blocks.some((b) => b.text.includes("first-run content")), "第一段内容仍在")
  assert.ok(sub.blocks.some((b) => b.text.includes("resumed content")), "resume 后续接（未重建）")
  assert.equal(sub.turn, 5, "turn 事件更新头部")
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
