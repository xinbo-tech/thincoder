/**
 * exploration-summary.test.mjs — A(委托策略)+C(历史卫生) 的提示词与行为回归
 *
 * Covers CONTEXT-COMPACTION.md §5 (exploration distillation + compaction-fidelity lists)
 * and AGENT-LOOP.md §13 (Delegate well 委托规则). The VS Code end has a mirrored file.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import {
  summarizeRunExplorations,
  compressFallback,
  SUMMARIZE_PROMPT,
  EXPLORE_TOOLS,
} from "../src/context.mjs"

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = join(TEST_DIR, "..", "src", "prompts")
const mainmd = readFileSync(join(PROMPTS_DIR, "main.md"), "utf8")

// ─── Local mock LLM server (CLI chat() streams SSE) ─────────────

function mockServer(respond) {
  return import("node:http").then(({ createServer }) => {
    const requests = []
    const server = createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        requests.push(body)
        respond(res, body)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}

const okSummary = (text) => (res) => {
  res.writeHead(200, { "Content-Type": "text/event-stream" })
  res.end(
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\n\n` +
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
    `data: [DONE]\n\n`,
  )
}

const fail401 = () => (res) => {
  res.writeHead(401, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ error: { message: "invalid api key" } }))
}

/** One assistant(tool_calls)→tool-result pair for an exploration tool. */
function explorePair(name, id, content) {
  return [
    { role: "assistant", content: null, tool_calls: [{ id, type: "function", function: { name, arguments: "{}" } }] },
    { role: "tool", tool_call_id: id, name, content },
  ]
}

/** Build a run segment of `n` alternating read/grep exploration pairs + a final assistant. */
function makeExplorationRun(n, final = "investigation done") {
  const run = []
  for (let i = 0; i < n; i++) {
    run.push(...explorePair(i % 2 === 0 ? "read" : "grep", `call_${i}`, `exploration result ${i}`))
  }
  run.push({ role: "assistant", content: final })
  return run
}

function makeAgent(port, pre, run) {
  const history = [...pre, ...run]
  return {
    provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
    history,
    _fullHistory: JSON.parse(JSON.stringify(history)), // separate human line (never distilled)
    _runStartHistoryLen: pre.length,
    _lastPromptTokens: 1234,
    _usageAtLen: history.length,
    tasks: [],
    planMode: false,
  }
}

/** Every tool message must still have its owning assistant tool_calls in the machine line. */
function assertNoOrphans(history, label) {
  const byId = new Set()
  for (const m of history) {
    if (m.role === "assistant" && m.tool_calls) for (const tc of m.tool_calls) byId.add(tc.id)
  }
  for (const m of history) {
    if (m.role === "tool") assert.ok(byId.has(m.tool_call_id), `${label}: orphan tool message ${m.tool_call_id}`)
  }
}

function countSummaryNotes(history) {
  return history.filter((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]")).length
}

// ─── A: main.md 委托策略 ────────────────────────────────────────

test("main.md: Delegate well 收益句 + 委托规则句 + 精度例外 + 验证句", () => {
  // ① 委托收益句：隔离上下文 / 只回最终报告 / 内联会淹没窗口
  assert.match(mainmd, /isolated context/, "收益句点破子 agent 隔离上下文")
  assert.match(mainmd, /only their final report comes back/, "收益句：只有最终报告回到主历史")
  assert.match(mainmd, /floods? your own window/, "收益句：内联探索会淹没自己的窗口")
  // ② 规则句：广度探索 → explore
  assert.match(mainmd, /Breadth-first exploration[\s\S]*?`explore` subagent/, "广度探索下沉 explore 的规则句")
  // ③ 精度例外：即将立刻编辑时才自己 read（不是省 token）
  assert.match(mainmd, /Read a file yourself only when you are about to edit it immediately/, "即时编辑例外触发句")
  assert.match(mainmd, /precision exception, not a token-saving trick/, "精度例外不是省 token 技巧")
  // ④ 验证句：读 claim 改动的文件 + 跑测试，不重做已委托探索
  assert.match(mainmd, /When a coder subagent finishes, verify its work/, "coder 完成后的验证句")
  assert.match(mainmd, /read the files it claims to have changed and run the tests/, "验证=读声称改动的文件+跑测试")
  assert.match(mainmd, /do NOT redo the whole exploration/, "不重做已委托的整段探索")
  // 其余条保持不变
  assert.match(mainmd, /Never give parallel subagents tasks that edit the same files/, "并行不编辑同一文件条款保留")
  assert.match(mainmd, /When multiple subagent reports conflict, read the relevant code yourself/, "冲突仲裁条款保留")
})

test("SUMMARIZE_PROMPT 追加两清单：已改动文件 + 未决点/待办", () => {
  assert.match(SUMMARIZE_PROMPT, /Explicitly list FILES CHANGED/, "已改动文件清单在")
  assert.match(SUMMARIZE_PROMPT, /Explicitly list UNRESOLVED ISSUES \/ TODOs/, "未决点/待办清单在")
  // D12 的「已完成 vs 进行中」已在、不重复
  assert.match(SUMMARIZE_PROMPT, /Distinguish COMPLETED vs IN-PROGRESS/, "D12 已完成 vs 进行中仍在")
})

test("EXPLORE_TOOLS 只含只读知识型（execute 不计入）", () => {
  for (const name of ["read", "grep", "glob", "ls", "code_search", "doc_search", "repo_outline"]) {
    assert.ok(EXPLORE_TOOLS.has(name), `${name} 属于探索类`)
  }
  assert.ok(!EXPLORE_TOOLS.has("execute"), "execute 写文件，不属于探索类")
})

// ─── C: 回合结束探索摘要 ────────────────────────────────────────

test("≥3 探索结果 → 机器线收缩为一条 [Exploration summary]、无孤儿、_fullHistory 不变", async () => {
  const { server, port, requests } = await mockServer(okSummary("found the config and call sites"))
  try {
    const pre = [
      { role: "user", content: "earlier task" },
      { role: "assistant", content: "earlier done" },
      { role: "user", content: "investigate the wiring" },
    ]
    const run = makeExplorationRun(3)
    const agent = makeAgent(port, pre, run)
    const fullSnapshot = JSON.parse(JSON.stringify(agent.history))

    await summarizeRunExplorations(agent, {}, undefined)

    assert.equal(countSummaryNotes(agent.history), 1, "整体替换为一条 [Exploration summary] note")
    const idx = agent.history.findIndex((m) => typeof m.content === "string" && m.content.startsWith("[Exploration summary]"))
    assert.equal(idx, pre.length, "note 落在第一批探索配对的原位")
    assert.match(agent.history[idx].content, /found the config and call sites/, "note 承载 LLM 摘要内容")

    // 探索原始结果从机器线消失，但人读线保留
    for (const m of run) {
      if (m.role === "tool") {
        assert.ok(!agent.history.some((h) => h.content === m.content), "探索工具结果不应留在机器线")
        assert.ok(agent._fullHistory.some((h) => h.content === m.content), "人读线保留探索原始结果")
      }
    }
    assert.ok(agent.history.some((m) => m.role === "assistant" && m.content === "investigation done"), "最终回复保留")

    assertNoOrphans(agent.history, "机器线")
    assert.deepEqual(agent._fullHistory, fullSnapshot, "_fullHistory 全程不动")
    assert.equal(agent.history.length, pre.length + 2, "3 探索配对 + 最终回复 → note + 最终回复")

    assert.equal(agent._lastPromptTokens, null, "收缩后实测 token 基线失效")
    assert.equal(agent._usageAtLen, null)
    assert.equal(requests.length, 1, "恰好一次静默摘要调用")
    assert.match(JSON.parse(requests[0]).messages[0].content, /exploration result 0/, "探索原始内容进入蒸馏请求")
  } finally {
    server.close()
  }
})

test("<3 探索结果 → 不触发（不发 LLM 调用、历史不变）", async () => {
  const { server, port, requests } = await mockServer(okSummary("should not be called"))
  try {
    const pre = [{ role: "user", content: "investigate" }]
    const agent = makeAgent(port, pre, makeExplorationRun(2))
    const before = JSON.parse(JSON.stringify(agent.history))
    await summarizeRunExplorations(agent, {}, undefined)
    assert.equal(requests.length, 0, "<3 条不应发起摘要请求")
    assert.deepEqual(agent.history, before, "历史保持不变")
  } finally {
    server.close()
  }
})

test("LLM 摘要失败 → 静默跳过（不阻塞、不丢历史）", async () => {
  const { server, port } = await mockServer(fail401())
  try {
    const pre = [{ role: "user", content: "investigate" }]
    const agent = makeAgent(port, pre, makeExplorationRun(3))
    const before = JSON.parse(JSON.stringify(agent.history))
    await summarizeRunExplorations(agent, {}, undefined)
    assert.deepEqual(agent.history, before, "失败时原始历史原样保留（N3）")
    assert.equal(countSummaryNotes(agent.history), 0, "失败时不产生 note")
  } finally {
    server.close()
  }
})

test("混合配对（read+edit 同一回合）不被拆分、无孤儿", async () => {
  const { server, port } = await mockServer(okSummary("mixed summary"))
  try {
    const history = [
      { role: "user", content: "go" },
      // 纯探索块 1
      ...explorePair("read", "r1", "pure read"),
      // 混合块：read + write 同一回合 —— 整块不是纯探索，不得拆分（否则孤儿 write 的 tool 结果）
      { role: "assistant", content: null, tool_calls: [
        { id: "c1", type: "function", function: { name: "read", arguments: "{}" } },
        { id: "c2", type: "function", function: { name: "write", arguments: "{}" } },
      ] },
      { role: "tool", tool_call_id: "c1", name: "read", content: "file content" },
      { role: "tool", tool_call_id: "c2", name: "write", content: "ok" },
      // 纯探索块 2、3（凑够 ≥3 条纯探索结果触发蒸馏）
      ...explorePair("grep", "r2", "pure grep"),
      ...explorePair("glob", "r3", "pure glob"),
      { role: "assistant", content: "done" },
    ]
    const agent = {
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      history,
      _fullHistory: JSON.parse(JSON.stringify(history)),
      _runStartHistoryLen: 1,
    }
    await summarizeRunExplorations(agent, {}, undefined)

    // 混合块完整保留
    const mixed = agent.history.find((m) => m.role === "assistant" && m.tool_calls?.some((tc) => tc.id === "c1"))
    assert.ok(mixed, "混合 assistant 保留")
    assert.ok(agent.history.some((m) => m.role === "tool" && m.tool_call_id === "c2"), "write 工具结果保留")
    assertNoOrphans(agent.history, "机器线")
    assert.equal(countSummaryNotes(agent.history), 1, "纯探索块仍被收缩为一条 note")
  } finally {
    server.close()
  }
})

test("中途压缩重建机器线 → _runStartHistoryLen 重置到 verbatim tail 起点、后续探索仍可蒸馏", async () => {
  const { server, port, requests } = await mockServer(okSummary("post-compaction exploration summary"))
  try {
    // 40 条前序消息充当 run 之前的已有上下文（run 起点 = 40）；run 内 3 个探索配对
    const pre = Array.from({ length: 40 }, (_, i) =>
      i % 2 === 0 ? { role: "user", content: `prompt ${i}` } : { role: "assistant", content: `reply ${i}` }
    )
    const run = makeExplorationRun(3)
    const agent = makeAgent(port, pre, run)
    const staleStart = agent._runStartHistoryLen // pre.length = 40

    // 中途确定性压缩（fallback，无 LLM）→ 机器线重建为 [note, "Understood", ...tail]，旧下标 stale
    assert.ok(compressFallback(agent), "fallback 压缩应发生")
    assert.ok(agent.history.length < staleStart, "重建后数组比 run 起点还短（旧边界已失效）")
    assert.equal(agent._runStartHistoryLen, 2, "边界重置到 verbatim tail 起点（head.length + 2，head 恒空）")

    // 压缩后继续探索：追加新一轮纯探索配对
    for (const m of makeExplorationRun(3, "second investigation done")) agent.history.push(m)

    await summarizeRunExplorations(agent, {}, undefined)

    assert.equal(countSummaryNotes(agent.history), 1, "tail 内 raw 探索 + 新增探索收缩为一条 [Exploration summary]")
    assert.ok(agent.history.some((m) => m.role === "assistant" && m.content === "second investigation done"), "压缩后最终回复保留")
    assertNoOrphans(agent.history, "机器线")
    assert.equal(requests.length, 1, "恰好一次静默蒸馏调用（fallback 压缩不发 LLM）")
  } finally {
    server.close()
  }
})