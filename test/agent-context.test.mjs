/**
 * agent-context.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { execSync } from "node:child_process"
import { slow } from "./slow.mjs"
import { createMemory, put, list } from "../src/memory.mjs"
import { freshMemory } from "./helpers/memory.mjs"
import { createServer } from "node:http"
import { mockLLM } from "./helpers/mock-llm.mjs"


function initGitRepo(dir) {
  execSync("git init -q", { cwd: dir, stdio: "ignore" })
  execSync('git config user.name test', { cwd: dir, stdio: "ignore" })
  execSync('git config user.email test@test.dev', { cwd: dir, stdio: "ignore" })
}
async function removeDir(dir) {
  for (let i = 0; i < 5; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return }
    catch { if (i < 4) await new Promise(r => setTimeout(r, 1000)) }
  }
}


// ---------------------------------------------------------------- task 提醒与压缩快照（mock LLM server）

/** 本地 mock LLM server：按脚本依次返回 SSE 响应（{ toolCall: {name, arguments}, reasoning?, content? }）；requests 捕获请求体 */



test("context: 压缩后回注 task 列表（不重复嵌入摘要）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port, requests } = await mockLLM([{ content: "这是摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = {
      provider,
      history: Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(50) })),
      tasks: [
        { title: "读代码", status: "done" },
        { title: "写实现", status: "in_progress" },
      ],
      planMode: false,
    }
    const compacted = await compressIfNeeded(agent, 10)
    assert.equal(compacted, true)
    // KEEP_HEAD = 0：head 为空，压缩注记就是第一条消息——不保留最早消息原文
    // （多任务会话里最早的可能是已完成的旧任务，保留会锚定旧事）
    const summaryMsg = agent.history[0]
    assert.match(summaryMsg.content, /这是摘要/)
    assert.ok(!summaryMsg.content.includes("## Task List")) // 单一信息源，不重复嵌入
    // 最早消息进序列化 → 摘要请求的 messages[0] 含最早的 user 内容
    assert.ok(requests.length >= 1, "summary request must be sent")
    const serialized = requests[0].messages?.[0]?.content ?? ""
    assert.match(serialized, /消息 0 /, "earliest message must enter the summary serialization")
    // 压缩后以独立提醒回注（历史末尾、内容最新）
    assert.match(agent.history.at(-1).content, /current task list after compaction/)
    assert.match(agent.history.at(-1).content, /- \[in_progress\] 写实现/)
  } finally {
    server.close()
  }
})



test("context: 带 tool_calls 的早期消息进序列化（无孤儿 tool 消息残留）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port, requests } = await mockLLM([{ content: "这是摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    // KEEP_HEAD=0：head 为空，带 tool_calls 的消息（和它的 tool 响应）都在中段——
    // 序列化成文本（"[assistant] [called tools: ls]"），不保留原始配对结构 → 无协议 400 风险。
    const agent = {
      provider,
      history: [
        { role: "user", content: "最初需求 " + "x".repeat(50) },
        { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "ls", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "call_1", content: "结果 " + "x".repeat(50) },
        ...Array.from({ length: 12 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(50) })),
      ],
      tasks: [],
      planMode: false,
    }
    const compacted = await compressIfNeeded(agent, 10)
    assert.equal(compacted, true)
    // 摘要请求的序列化必须包含最早的 tool_calls 消息（带工具名标记）
    const serialized = requests[0].messages?.[0]?.content ?? ""
    assert.match(serialized, /\[assistant\] \[called tools: ls\]/, "early tool_calls message must be serialized into the summary")
    // 压缩后 history 中不允许存在"孤立"tool 消息：每条 tool 消息必须能在 history 里找到其 assistant 调用者
    const byId = new Map()
    for (const m of agent.history) {
      if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) byId.set(tc.id, true)
    }
    for (const m of agent.history) {
      if (m.role === "tool") assert.ok(byId.has(m.tool_call_id), `orphan tool message: ${m.tool_call_id}`)
    }
  } finally {
    server.close()
  }
})



test("context: 压缩判定用实测 prompt_tokens 基准（估算远低于阈值也触发），压缩后基准失效", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port } = await mockLLM([{ content: "这是摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = {
      provider,
      // 估算只有约 28 token，远低于阈值 100——但实测基准 10000 已超，必须压缩
      history: Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `m${i} ` + "x".repeat(4) })),
      tasks: [],
      planMode: false,
      _lastPromptTokens: 10_000,
      _usageAtLen: 0,
    }
    const compacted = await compressIfNeeded(agent, 100)
    assert.equal(compacted, true)
    assert.match(agent.history[0].content, /这是摘要/) // KEEP_HEAD=0：注记是第一条
    assert.equal(agent._lastPromptTokens, null) // 旧基准随历史一起失效，退回估算
    assert.equal(agent._usageAtLen, null)
  } finally {
    server.close()
  }
})



test("context: 截断兜底不碰网络，结构合法且 task 回注去重", async () => {
  const { compressFallback } = await import("../src/context.mjs")
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, // 不应被调用
    history: [
      ...Array.from({ length: 12 }, (_, i) => ({ role: "user", content: `消息 ${i}` })),
      { role: "user", content: "[System reminder: your current task list after compaction:\n- [done] 旧任务\nContinue from where you left off.]" },
      { role: "user", content: "最近一条" },
    ],
    tasks: [{ title: "新任务", status: "in_progress" }],
    planMode: false,
    _lastPromptTokens: 999,
    _usageAtLen: 3,
  }
  assert.equal(compressFallback(agent), true)
  // 14 条历史 → 默认模型窗口自适应 keepTail = min(38, floor(14*0.4)=5) = 5 → KEEP_HEAD=0：
  // 注记 + ack + tail(5，其中旧回注被清) + 新回注 = 7
  assert.equal(agent.history.length, 7)
  assert.match(agent.history[0].content, /truncated after repeated summarization failures/)
  // tail 里残留的旧回注被清掉，只留末尾最新的一份
  const reinjects = agent.history.filter((m) => typeof m.content === "string" && m.content.includes("current task list after compaction"))
  assert.equal(reinjects.length, 1)
  assert.match(reinjects[0].content, /- \[in_progress\] 新任务/)
  assert.equal(agent._lastPromptTokens, null)
})



test("context: estimateTokens 计入 reasoning_content", async () => {
  const { estimateTokens } = await import("../src/context.mjs")
  const without = estimateTokens([{ role: "assistant", content: "abcd" }])
  const withReasoning = estimateTokens([{ role: "assistant", content: "abcd", reasoning_content: "x".repeat(400) }])
  assert.equal(withReasoning - without, 100)
})



test("context: estimateTokens 对 CJK 按约 1 字 1 token 估算（chars/4 会低估 3-4 倍）", async () => {
  const { estimateTokens } = await import("../src/context.mjs")
  assert.equal(estimateTokens([{ role: "user", content: "中".repeat(100) }]), 100)
  assert.equal(estimateTokens([{ role: "user", content: "a".repeat(100) }]), 25) // ASCII 仍按 4 字符 1 token
})



test("context: 压缩序列化时 user 消息放宽到 8000（长需求不丢）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port, requests } = await mockLLM([{ content: "摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const longRequirement = "用户的长需求全文" + "需".repeat(5000)
    const history = Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(50) }))
    history[2] = { role: "user", content: longRequirement } // 落在被摘要的 middle 段
    const agent = { provider, history, tasks: [], planMode: false }
    await compressIfNeeded(agent, 10)
    const summaryRequest = requests[0].messages[0].content
    assert.ok(summaryRequest.includes(longRequirement)) // 5000 字符全量进入摘要器视野
  } finally {
    server.close()
  }
})



test("context: 历史太短切不出中间段时，巨型消息被确定性瘦身（压缩逃逸口）", async () => {
  const { compressIfNeeded, estimateTokens } = await import("../src/context.mjs")
  const huge = "开".repeat(60_000) // 一条 ≈6 万 token 的巨型消息（大段粘贴/超大注入）
  // KEEP_HEAD=0 后任何 ≥2 条的历史都能切出中间段（keepTail ≥ 0），瘦身兜底只剩
  // "单条巨型消息"场景：history 1 条 → splitHistory 返回 null → shrinkOversized。
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" }, // 不会真正调用（无中间段可摘要）
    history: [{ role: "user", content: huge }],
    tasks: [], planMode: false,
  }
  const before = estimateTokens(agent.history)
  const done = await compressIfNeeded(agent, 1_000)
  assert.equal(done, true)
  // 巨消息截断换桩、首尾保留
  assert.ok(agent.history[0].content.length < 7_000)
  assert.ok(agent.history[0].content.includes("truncated"))
  assert.ok(agent.history[0].content.startsWith("开"))
  assert.ok(estimateTokens(agent.history) < before, "token 必须显著下降")
})



test("context: 巨型消息瘦身不污染人读线 _fullHistory（数据丢失回归防护）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const huge = "开".repeat(60_000)
  // pushReal 把同一消息对象推进 history + _fullHistory（两条线共享引用）；瘦身必须复制后替换、
  // 不能原地改共享对象，否则截断会泄漏进永不压缩的人读线并在持久化时丢原始内容。
  const shared = { role: "user", content: huge }
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
    history: [shared],
    _fullHistory: [shared], // 与 history 共享同一对象（pushReal 的真实行为）
    tasks: [], planMode: false,
  }
  const done = await compressIfNeeded(agent, 1_000)
  assert.equal(done, true)
  assert.ok(agent.history[0].content.includes("truncated"), "机器线被瘦身")
  assert.equal(agent._fullHistory[0].content.length, 60_000, "人读线内容长度不变")
  assert.ok(!agent._fullHistory[0].content.includes("truncated"), "人读线无截断桩")
})



test("context: tail 保留量随模型窗口自适应（1M 窗口 40 条，小窗口模型 38 条，短历史受 40% 上限）", async () => {
  const { compressFallback } = await import("../src/context.mjs")
  const makeAgent = (model) => ({
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model },
    history: Array.from({ length: 100 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(20) })),
    tasks: [], planMode: false,
  })
  // 1M 窗口：keepTail = min(300, 40) = 40 → KEEP_HEAD=0：note+ack+tail(40) = 42
  const big = makeAgent("deepseek-v4-pro")
  assert.equal(compressFallback(big), true)
  assert.equal(big.history.length, 42, "1M 窗口保留 40 条 tail")
  // 128K 窗口（默认 spec）：keepTail = min(38, 40) = 38 → 1+1+38 = 40
  const small = makeAgent("gpt-4o")
  assert.equal(compressFallback(small), true)
  assert.equal(small.history.length, 40, "128K 窗口保留 38 条 tail")
  // 短历史受 40% 上限：20 条 → min(max(10,38), 8) = 8 → 1+1+8 = 10
  const short = {
    provider: { baseURL: "http://127.0.0.1:1", apiKey: "x", model: "m" },
    history: Array.from({ length: 20 }, (_, i) => ({ role: "user", content: `m${i} ` + "x".repeat(20) })),
    tasks: [], planMode: false,
  }
  assert.equal(compressFallback(short), true)
  assert.equal(short.history.length, 10, "20 条历史按 40% 上限保留 8 条 tail")
})



test("context: 纯估算路径计入 system/tools 开销（无实测基线时触发压缩）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port } = await mockLLM([{ content: "这是摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const history = Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(4) }))
    const agent = { provider, history: [...history], tasks: [], planMode: false }
    // 不传 extras：纯历史估算 ~140 < 500 → 不触发
    assert.equal(await compressIfNeeded(agent, 500), false)
    // 传 extras（system 4000 字符 ≈ 1000 token + tools）：估算 ~1150 > 500 → 触发
    const agent2 = { provider, history: [...history], tasks: [], planMode: false }
    const done = await compressIfNeeded(agent2, 500, {}, { systemPrompt: "x".repeat(4000), tools: [] })
    assert.equal(done, true)
    assert.match(agent2.history[0].content, /这是摘要/) // KEEP_HEAD=0：注记是第一条
  } finally {
    server.close()
  }
})



test("context: 摘要生成对前端静默（不转发 onToken/onReasoning）", async () => {
  const { compressIfNeeded } = await import("../src/context.mjs")
  const { server, port } = await mockLLM([{ content: "摘要" }])
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = {
      provider,
      history: Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `消息 ${i} ` + "x".repeat(50) })),
      tasks: [], planMode: false,
    }
    let tokenCalls = 0
    let reasoningCalls = 0
    const done = await compressIfNeeded(agent, 10, {
      onToken: () => tokenCalls++,
      onReasoning: () => reasoningCalls++,
    })
    assert.equal(done, true)
    assert.equal(tokenCalls, 0, "压缩摘要 token 不得流向前端")
    assert.equal(reasoningCalls, 0, "压缩摘要 reasoning 不得流向前端")
  } finally {
    server.close()
  }
})



slow("runAgent: 依赖摘要注入（紧凑版 + 每会话只注一次）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const { codeSync } = await import("../src/memory.mjs")
  const { writeFile } = await import("node:fs/promises")
  const m = freshMemory()
  const dir = mkdtempSync(join(tmpdir(), "thincoder-outline-inject-"))
  initGitRepo(dir)
  try {
    // 120 个互相 import 的文件：新版摘要天然有界，无需硬截断
    for (let i = 0; i < 120; i++) {
      const prev = i > 0 ? `import { v${i - 1} } from "./f${i - 1}.mjs"\n` : ""
      await writeFile(join(dir, `f${i}.mjs`), `${prev}export const v${i} = ${i}\nexport function fn${i}() { return v${i} }\n`)
    }
    await codeSync(m, dir)

    const { server, port } = await mockLLM([{ content: "回答1" }, { content: "回答2" }])
    try {
      const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
      const agent = createAgent({ provider, tools: [], config: {}, cwd: dir, memory: m })
      const OUTLINE_PREFIX = "[System reminder: project dependency outline:"
      await runAgent(agent, "第一个问题")
      const outlines = () => agent.history.filter((m) => typeof m.content === "string" && m.content.startsWith(OUTLINE_PREFIX))
      assert.equal(outlines().length, 1)
      assert.ok(outlines()[0].content.includes("Hub files"), "摘要应含枢纽文件列表")
      assert.ok(outlines()[0].content.includes("repo_outline"), "摘要应指引 repo_outline 查详情")
      assert.ok(outlines()[0].content.length < 3_000, `摘要应自然有界，实际 ${outlines()[0].content.length} 字符`)
      await runAgent(agent, "第二个问题")
      assert.equal(outlines().length, 1, "每会话只注一次，不按轮数累积")
    } finally {
      server.close()
    }
  } finally {
    await removeDir(dir)
  }
})
