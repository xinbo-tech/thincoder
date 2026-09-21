/**
 * context-tool.test.mjs — `context` 工具（感知 / 清理 / 压缩）用例：CONTEXT-COMPACTION.md §6.16.10 用例表 **S1–R4**
 * （批次档 `2026-09-21-context-tool.md` §2.3 AC1–AC9 · 需求档 §2.1 F-CC1–F-CC5 判定句 ①–⑤ · 裁令 A/D）。真机聚焦词差额 = 取证类，非 CI 门禁。
 * 夹具注：`pairedHistory()` = 60 条（12 组大 tool 结果 + 36 条小消息）；默认 provider 窗口 131072 ⇒ keepTail 24、tailStart 36。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { contextTool, pushContextNudge, CONTEXT_NUDGE_PREFIX, CONTEXT_NOTE_PREFIX } from "../agent-tools/context.mjs"
import { contextUsage, estimateTokens, historyPercent } from "../token-window.mjs"
import { SUMMARIZE_PROMPT } from "../context.mjs"
import { runCompactionCheck } from "../agent/run-stages.mjs"
import { taskTool } from "../agent-tools/task.mjs"
import { goalTool } from "../agent-tools/goal.mjs"
import { readHistoryTool } from "../agent-tools/read-history.mjs"
import { assembleFamilyTools } from "../agent/family-tools.mjs"
import { _resetSessionsDirForTest, _setSessionsDirForTest, slotPath } from "../session-slots.mjs"
import { providerSpec, resolveCompactThreshold } from "../config.mjs"
import { TOOL_DOCS_DIR } from "../prompt-files.mjs"
import { _rateHooks } from "../provider/rate.mjs"

const PROVIDER = { name: "test", baseURL: "https://context-tool.test/v1", apiKey: "k", model: "glm-5.2", context: 128 }
const SYS = "SYSTEM-PROMPT-BYTES"
const TOOLS = [{ type: "function", function: { name: "read", description: "Read a file", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } }]
const PLACEHOLDER = "Understood. I'll continue from these notes, re-verifying anything transient."
const WINDOW = providerSpec(PROVIDER).context // 128 × 1024 = 131072（providers[].context 覆盖形）
const OVERHEAD = { systemPrompt: SYS, tools: TOOLS, traceDepth: 0 }
const agentOf = { current: null }
const agentFor = (history, extra = {}) => ({ provider: PROVIDER, history, tasks: [], planMode: false, ...extra })
const call = (action, args = {}) => contextTool.execute({ action, ...args }, { agent: agentOf.current, depth: 0 })
const ctxFor = (agent, depth = 0) => ({ agent, depth })
const safePoint = (agent, threshold = 78643, overhead = OVERHEAD, callbacks = {}) =>
  runCompactionCheck(agent, { threshold, callbacks, compactionOverhead: overhead, signal: undefined, recentCallSigs: [] })
const picked = (a, prefix) => a.history.filter((m) => typeof m.content === "string" && m.content.startsWith(prefix))
const nudgeLines = (a) => picked(a, CONTEXT_NUDGE_PREFIX)
const noteLines = (a) => picked(a, CONTEXT_NOTE_PREFIX)
const num = (text, re) => { const m = text.match(re); assert.ok(m, `报面缺字段 ${re}：${JSON.stringify(text)}`); return Number(m[1]) }
/** 配对组：assistant(tool_calls) + tool 结果（`size` 字符 ≈ size/4 tok）；`pad` = 小消息填充。 */
const toolPair = (id, size) => [
  { role: "assistant", content: null, reasoning_content: `r-${id}`, tool_calls: [{ id, type: "function", function: { name: "read", arguments: "{}" } }] },
  { role: "tool", tool_call_id: id, name: "read", content: "x".repeat(size) },
]
const pad = (n, tag) => Array.from({ length: n }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `${tag}${i}` }))
/** 60 条夹具：12 组大 tool 结果（≈300 tok ≥ 门槛）+ 36 条小消息。keepTail = min(39, ⌊60×0.4⌋) = 24 ⇒ tailStart = 36 ⇒ 12 条 tool 结果全在保护尾外。 */
const pairedHistory = () => [...Array.from({ length: 12 }, (_, i) => toolPair(`call_${i}`, 1200)).flat(), ...pad(36, "m")]

/** fetch 桩（先例 = compress-form.test.mjs）：捕获出站请求体；`abort` / `status ≥ 400` = 失败形态。 */
function stubFetch({ content = "SUMMARY-BODY", status = 200, abort = false } = {}) {
  const calls = [], saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    if (abort) throw new DOMException("The operation was aborted.", "AbortError")
    if (status >= 400) return { ok: false, status, text: async () => "boom" }
    const sse = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}
const withStub = async (opts, fn) => { const stub = stubFetch(opts); try { return await fn(stub) } finally { stub.restore() } }
/** 强制面一轮（compact 排队 → 安全点）：返回出站请求体数组。 */
const forcedRun = (agent, focus, opts = {}, threshold = 78643, overhead = OVERHEAD) => withStub(opts, async (stub) => {
  agentOf.current = agent; await call("compact", { focus }); await safePoint(agent, threshold, overhead); return stub.calls
})

// S1–S4 stats 面（F-CC1）

test("S1/S2/S3/S4 stats：两口径复算单源 · 阈值单源 · 三段 / 工具输出小计 · 状态行 = CLI 公式复算值", async () => {
  const history = pairedHistory()
  const measured = agentFor(history, { _lastPromptTokens: 5000, _usageAtLen: 40, _ctxBasis: { threshold: 4096, overhead: OVERHEAD } })
  agentOf.current = measured
  const out = await call("stats"), usage = contextUsage(measured, OVERHEAD)
  assert.equal(usage.basis, "measured")
  assert.equal(num(out, /Context ≈(\d+) tokens/), 5000 + estimateTokens(history.slice(40)), "total = 基线 + 增量（实测口径）")
  assert.equal(num(out, /compaction threshold (\d+)/), 4096, "阈值 = _ctxBasis（本回合判定值——单源）")
  assert.ok(out.includes("(basis: measured)") && out.includes("Compaction so far: none · failures 0/3"), "口径可分辨 + 压缩履历行")
  assert.deepEqual([num(out, /Segments ≈: system (\d+)/), num(out, /· tools (\d+)/), num(out, /· history (\d+)/)],
    [usage.system, usage.tools, usage.history], "三段各 = contextUsage 同源值")
  assert.match(out, /History: tool outputs 3600 tokens in 12 msgs · prunable stale 3600 tokens in 12 msgs · protected tail 24 msgs/)
  const pct = num(out, /Status line: context (\d+)%/)
  assert.ok(pct === historyPercent(history, PROVIDER) && pct === Math.round((estimateTokens(history) / WINDOW) * 100), "S3 状态行百分比 = historyPercent 单源 = CLI 公式逐字复算值")

  const estimated = agentFor(history, { _lastPromptTokens: null, _ctxBasis: { threshold: 4096, overhead: OVERHEAD } })
  agentOf.current = estimated
  const out2 = await call("stats")
  assert.ok(out2.includes("(basis: estimated)"), "口径可分辨")
  assert.equal(num(out2, /Context ≈(\d+) tokens/), estimateTokens(history) + contextUsage(estimated, OVERHEAD).overhead, "S2 估算口径复算等值")
  agentOf.current = agentFor([], {})
  const out3 = await call("stats")
  assert.equal(num(out3, /Context ≈(\d+) tokens/), 0, "S4 空历史 / 无 `_ctxBasis` ⇒ 不抛（总数为 overhead）")
  assert.equal(num(out3, /compaction threshold (\d+)/), resolveCompactThreshold(undefined, PROVIDER).value, "退化面①：阈值兜底")
})

// P1–P5 prune 面（F-CC3 · 判定句③）
test("P1/P2/P3/P5 prune：12 条变 stub ∧ 配对守恒 ∧ 记录面不变 ∧ 基线失效；P4 边界（尾内 / 门槛下 / 短历史）", async () => {
  const history = pairedHistory()
  const full = [...history] // pushReal 共享对象：人读线持同一批引用
  const agent = agentFor(history, { _fullHistory: full, _lastPromptTokens: 999, _usageAtLen: 0 })
  agentOf.current = agent; const before = estimateTokens(history), out = await call("prune")
  assert.ok(/Pruned 12 stale tool output\(s\) ≈3600 tokens freed/.test(out) && /scanned 12 tool result\(s\): 0 inside the protected tail, 0 below the 200-token floor/.test(out), "回执计数 = 合格集")
  assert.ok(estimateTokens(history) < before, "活上下文占用下降（判定句③）")
  assert.ok(history === agent.history && history.length === 60 && /session record is unchanged/.test(out), "数组引用 / 长度不变 ∧ 记录面声明")
  assert.deepEqual(history.map((m) => m.tool_call_id), full.map((m) => m.tool_call_id), "索引 / tool_call_id 逐位不变")
  const tools = history.filter((x) => x.role === "tool")
  assert.ok(tools.every((m) => /^\[pruned: stale tool output dropped \(1200 chars\)/.test(m.content)), "内容 = stub 逐字")
  assert.ok(tools.every((m) => history.some((x) => x.role === "assistant" && x.tool_calls?.some((tc) => tc.id === m.tool_call_id))), "每 tool 仍有 owner（P2）")
  assert.ok(full.filter((m) => m.role === "tool").every((m) => m.content.length === 1200), "记录面内容零改（P3）")
  assert.ok(agent._lastPromptTokens === null && agent._usageAtLen === null, "基线失效（P5）")
  // P4：20 条夹具 keepTail = 8 ⇒ tailStart = 12 —— 门槛下 3 条在尾外 / 大输出 1 条在尾内 ⇒ 合格集空
  const h = [...toolPair("c0", 40), ...toolPair("c1", 40), ...toolPair("c2", 40), ...pad(6, "n"), ...toolPair("c3", 1200), ...pad(6, "p")]
  agentOf.current = agentFor(h, { _lastPromptTokens: 777, _usageAtLen: 0 })
  const out4 = await call("prune")
  assert.ok(/Nothing to prune/.test(out4) && /scanned 4 tool result\(s\): 1 inside the protected tail, 3 below the 200-token floor/.test(out4), "零改动、回执 0")
  assert.equal(agentOf.current._lastPromptTokens, 777, "未发生 prune ⇒ 基线不失效")
  const short = agentFor([{ role: "tool", tool_call_id: "z", name: "read", content: "q".repeat(1200) }], { _lastPromptTokens: 5 })
  agentOf.current = short
  assert.match(await call("prune"), /Nothing to prune/, "短历史（无中段）⇒ no-op")
  assert.ok(short.history[0].content.length === 1200 && short._lastPromptTokens === 5, "零改动 ∧ 基线不动")
})

// C1–C13 compact 面（F-CC2 · 判定句①② · 裁令 A）
test("C1/C2/C13 compact：排队零执行 ⇒ 安全点落地（焦点块 + anchor）· 记录面全量不变", async () => {
  const history = pairedHistory()
  const agent = agentFor(history, {
    _fullHistory: [...history],
    _slot: 3, // 会话档字段（C13：压缩零改）
    tasks: [{ status: "in_progress", title: "TASK-INPROG" }, { status: "pending", title: "TASK-PENDING" }],
    goal: { status: "active", objective: "GOAL-OBJ", criteria: "GOAL-CRIT" },
  })
  let recordWrites = 0
  agent._recordStore = { append: () => { recordWrites++ } } // 落盘面哨兵（压缩不得写会话档）
  agentOf.current = agent
  await withStub({}, async (stub) => {
    const recordBefore = JSON.stringify(agent._fullHistory)
    const before = JSON.stringify(agent.history)
    const receipt = await call("compact", { focus: "FOCUS-TEXT: the upcoming refactor" })
    assert.equal(agent._pendingCompact.focus, "FOCUS-TEXT: the upcoming refactor", "C1 单槽置位")
    assert.ok(stub.calls.length === 0 && JSON.stringify(agent.history) === before, "C1 当次零执行（零 fetch ∧ 历史逐字节不变）")
    assert.match(receipt, /Compaction queued — it runs at the next safe point/)
    agent.history.push({ role: "tool", tool_call_id: "call_x", name: "read", content: "ok" })
    const fired = [], callbacks = { onCompressStart: (i) => fired.push(["start", i.messages]), onCompress: (i) => fired.push(["done", i.mode]) }
    await safePoint(agent, 78643, OVERHEAD, callbacks)
    assert.deepEqual(fired, [["start", 37], ["done", "summary"]], "C2 压缩面板两侧回调触发（onCompressStart / onCompress）")
    assert.equal(stub.calls.length, 1, "C2 安全点一次摘要调用")
    const last = stub.calls[0].messages.at(-1)
    assert.ok(last.content.startsWith(SUMMARIZE_PROMPT) && last.content.includes("FOCUS-TEXT: the upcoming refactor"), "指令 = SUMMARIZE_PROMPT 原样 + focus 正文在尾段")
    assert.ok(last.content.includes("- [in_progress] TASK-INPROG") && last.content.includes("- goal [active] GOAL-OBJ — done when: GOAL-CRIT"), "C4 anchor 段含任务行 + goal 行")
    assert.ok(agent.history[0].content.startsWith("[Context was automatically compacted") && agent.history.length === 26, "注记 + 摘要落首位 ⇒ 注记 + tail（tail = 24，占位并入首条）+ 任务重注入一行")
    assert.equal(agent.history[1].content, `${PLACEHOLDER}\n\nm13`, "占位（D-CC18 并入 tail 首条——零文本丢失）")
    assert.match(agent.history.at(-1).content, /^\[System reminder: your current task list after compaction:/)
    assert.ok(agent._pendingCompact === null && agent._lastCompressInfo.mode === "summary", "取用即清槽")
    assert.ok(recordWrites === 0 && agent._slot === 3, "C13 会话档零改（落盘面零写 ∧ 槽字段不动）")
    const read = JSON.parse(await readHistoryTool.execute({ limit: 200 }, { agent }))
    assert.ok(JSON.stringify(agent._fullHistory) === recordBefore && read.length === agent._fullHistory.length, "记录面全量不变（判定句② / C13）∧ read_history 默认查询仍取全量")
  })
})

test("C3/C4 焦点相斥可断言 · anchor 段省略边界（focus 正文恒保留）· C6 单槽覆盖", async () => {
  const bodies = []
  for (const focus of ["keep the parser work: files a.mjs, decisions X", "keep the UI work: files b.css, decisions Y"]) {
    const calls = await forcedRun(agentFor(pairedHistory(), { tasks: [{ status: "in_progress", title: "T" }] }), focus)
    assert.equal(calls.length, 1)
    bodies.push(calls[0].messages.at(-1).content)
  }
  assert.notEqual(bodies[0], bodies[1], "C3 两请求体互不相同")
  assert.ok(bodies[0].includes("keep the parser work") && !bodies[0].includes("keep the UI work"), "C3 各含其 focus（不串味）")
  const bare = await forcedRun(agentFor(pairedHistory(), {}), "FOCUS-ONLY")
  assert.ok(bare[0].messages.at(-1).content.includes("FOCUS-ONLY") && !bare[0].messages.at(-1).content.includes("Current task/goal state"), "C4 focus 正文恒保留 ∧ 无 task 且无 goal ⇒ anchor 段整体省略")
  const a3 = agentFor(pairedHistory(), {})
  agentOf.current = a3
  assert.match(await call("compact", { focus: "first" }), /Compaction queued/, "C6 首次回执（无替换句）")
  assert.match(await call("compact", { focus: "second" }), /replaces the request queued earlier/, "C6 第二次明示替换")
  assert.equal(a3._pendingCompact.focus, "second", "C6 单槽 = 后者")
  const c3 = await withStub({}, async (stub) => { await safePoint(a3); return stub.calls })
  assert.ok(c3.length === 1 && c3[0].messages.at(-1).content.includes("second") && a3._pendingCompact === null, "C6 一次安全点 = 一次压缩")
})

test("C5 阈值面承接（不因模型请求让位）· 同点至多一次成功压缩", async () => {
  // ① 强制成功：小窗口夹具 + 大开销（重建后仍越阈值）⇒ 阈值面若同点再跑必现第二次请求
  const tiny = { ...PROVIDER, context: 1 }
  const big = { systemPrompt: "S".repeat(4000), tools: TOOLS, traceDepth: 0 }
  const c1 = await forcedRun(agentFor(pairedHistory(), { provider: tiny }), "f1", {}, resolveCompactThreshold(undefined, tiny).value, big)
  assert.equal(c1.length, 1, "① 同点至多一次成功压缩（阈值面不发生）")
  // ② 强制无可压（短历史无中段）+ tokens > 阈值 ⇒ 阈值面承接（请求 = 自动面：无焦点块）
  const a2 = agentFor([{ role: "user", content: "seed" }], {})
  const c2 = await withStub({}, async (stub) => {
    agentOf.current = a2
    await call("compact", { focus: "f2" })
    const tokens = estimateTokens(a2.history) + estimateTokens([{ role: "system", content: SYS }]) + estimateTokens([{ role: "user", content: JSON.stringify(TOOLS) }])
    await safePoint(a2, tokens - 1)
    return stub.calls
  })
  assert.ok(c2.length === 1 && !c2[0].messages.at(-1).content.includes("This compaction happens at my own request"), "② 阈值面承接（本安全点一次自动压缩；承接面 = 自动面——无焦点块）")
})

test("C7–C10 注记与失败面：no-op 注记 · 失败链 + 失败注记 · Abort 透传 · focus fail-closed", async () => {
  const a7 = agentFor([{ role: "user", content: "hi" }], {})
  const c7 = await withStub({}, async (stub) => {
    agentOf.current = a7
    await call("compact", { focus: "f" })
    await safePoint(a7)
    return stub.calls
  })
  assert.ok(c7.length === 0 && a7.history.length === 2 && a7.history[0].content === "hi" && a7.history[1].transient === true && noteLines(a7).length === 1,
    "C7 无可压 ⇒ 零 LLM 调用 ∧ 恰一行 transient no-op 注记（历史其余零改）")

  const savedSleep = _rateHooks.sleep
  _rateHooks.sleep = async () => {}
  try {
    const a8 = agentFor(pairedHistory(), {})
    agentOf.current = a8
    await withStub({ status: 500 }, async () => {
      for (let i = 1; i <= 3; i++) {
        await call("compact", { focus: "f" })
        await safePoint(a8)
        if (i < 3) assert.equal(a8._compressFailures, i, `C8 第 ${i} 次失败计数`)
        if (i < 3) assert.equal(noteLines(a8).filter((m) => m.content.includes(`context compact failed (attempt ${i} of 3)`)).length, 1, "C8 失败注记")
        if (i === 1) assert.ok(JSON.stringify(a8.history.slice(0, 60)) === JSON.stringify(pairedHistory()) && a8.history.length === 61, "C8 失败不改历史（仅追加注记一行）")
      }
    })
    assert.ok(a8._lastCompressInfo.mode === "fallback" && a8.history[0].content.startsWith("[Context was truncated after repeated"), "C8 第 3 次 ⇒ 既有三连败降级")
  } finally { _rateHooks.sleep = savedSleep }

  const a9 = agentFor(pairedHistory(), {})
  agentOf.current = a9
  await withStub({ abort: true }, async () => {
    await call("compact", { focus: "f" })
    await assert.rejects(safePoint(a9), (e) => e.name === "AbortError", "C9 AbortError 透传")
  })
  assert.ok(a9._pendingCompact === null && noteLines(a9).length === 0, "C9 取用即清槽（失败不重放）∧ 不落注记")

  const a10 = agentFor([], {})
  agentOf.current = a10
  for (const args of [{}, { focus: "   " }]) {
    assert.match(await call("compact", args), /^Error: 'focus' is required/)
    assert.equal(a10._pendingCompact ?? null, null, "C10 不排队（fail-closed）")
  }
})

test("C11/C12 可回查锚：已绑定槽逐字路径（可深查）· 未绑定走 cwd 发现面", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-ctx-anchor-"))
  _setSessionsDirForTest(dir)
  try {
    const cwd = join(dir, "proj")
    const agent = agentFor([{ role: "user", content: "hi" }], { cwd, _slot: 7 })
    agentOf.current = agent; const file = slotPath(cwd, 7)
    writeFileSync(file, JSON.stringify({ history: [{ role: "user", content: "recorded" }] }), "utf8")
    const out = await call("compact", { focus: "f" })
    assert.ok(out.includes(file) && out.includes(`read_history path="${file}"`), "C11 回执含槽文件路径 + 取回调用形（逐字）")
    const deep = await readHistoryTool.execute({ path: file }, { agent })
    assert.ok(existsSync(file) && !String(deep).startsWith("Error:") && String(deep).includes("recorded"), `C11 该路径可被 read_history 深查：${deep}`)
  } finally { _resetSessionsDirForTest(); try { rmSync(dir, { recursive: true, force: true, maxRetries: 5 }) } catch { /* OS temp */ } }
  agentOf.current = agentFor([{ role: "user", content: "hi" }], { cwd: "/tmp/ctx-free", _slot: null })
  const out2 = await call("compact", { focus: "f" })
  assert.ok(out2.includes('read_history path="cwd:/tmp/ctx-free"') && !out2.includes("never compacted"), "C12 未绑定 ⇒ cwd 发现面（不含槽路径形）")
})

// N1–N4 轻推面（F-CC4 · 判定句④）· R1–R4 装配与零回归
test("N1–N4 轻推：恒恰一行（替换）· 四状态分支 · 零调用零副作用 · 深度门", async () => {
  const a = agentFor([{ role: "user", content: "seed" }], {})
  for (const title of ["T1", "T2"]) await taskTool.execute({ items: [{ title, status: "in_progress" }] }, ctxFor(a))
  assert.ok(nudgeLines(a).length === 1 && nudgeLines(a)[0].content.includes("T2") && nudgeLines(a)[0].transient === true,
    "N1 任意次数变更后恒恰一行（内容 = 当前 anchor，旧行被替换）")
  const g = agentFor([{ role: "user", content: "seed" }], {})
  for (const args of [{ action: "set", objective: "OBJ", criteria: "CRIT" }, { action: "complete" }, { action: "cancel" }]) {
    await goalTool.execute(args, ctxFor(g))
    assert.equal(nudgeLines(g).length, 1, `N2 goal ${args.action} 分支恒恰一行`)
  }
  await goalTool.execute({ action: "set", objective: "OBJ2", criteria: "C2" }, ctxFor(g))
  for (let i = 1; i <= 3; i++) { // blocked 需同一 condition 连续 3 次才改状态
    await goalTool.execute({ action: "blocked", reason: "R" }, ctxFor(g))
    assert.equal(nudgeLines(g).length, 1, `N2 blocked 第 ${i} 次亦恒恰一行`)
  }
  const n3 = agentFor([{ role: "user", content: "seed" }], {})
  agentOf.current = n3; await call("stats")
  await taskTool.execute({ items: [{ title: "T1", status: "pending" }] }, ctxFor(n3, 1))
  assert.equal(nudgeLines(n3).length, 0, "N3 零 task/goal 调用 ⇒ 零副作用 ∧ N4 depth>0 ⇒ 零轻推行")
  pushContextNudge(n3)
  assert.equal(nudgeLines(n3).length, 1, "单源助手直调面（去重语义自足）")
})

test("R1/R3/R4 装配与零回归：家族段单源 · 子代理零含 · 三操作可达 · 核名集与 tool-docs 不变", async () => {
  const names = async (args) => (await assembleFamilyTools(args)).map((t) => t.name)
  assert.equal((await names({ depth: 0 })).filter((n) => n === "context").length, 1, "R1 depth-0 含 `context` 恰一次")
  for (const role of [null, "explore", "plan", "coder", "consult", "eng-coder", "eng-designer"]) {
    assert.ok(!(await names({ depth: 1, role })).includes("context"), `R1 depth>0（${role}）零含（裁令 D）`)
  }
  assert.ok(contextTool.readonly === true && contextTool.parameters.properties.action.enum.join() === "stats,prune,compact", "R3 schema enum = 三操作 ∧ 只动机内状态（同 task / goal 先例）")
  agentOf.current = agentFor([{ role: "user", content: "x" }], {})
  for (const action of ["stats", "prune", "compact"]) {
    assert.ok(!(await call(action, action === "compact" ? { focus: "f" } : {})).includes("unknown action"), `R3 ${action} 可达`)
  }
  assert.ok(/^Context ≈/.test(await call("stats")) && /^Error: unknown action/.test(await call("nope")), "R3 回执行首 / 未知 action 报错")
  const { builtinTools, assembleBuiltinTools } = await import("../tools/index.mjs")
  const assembled = (await assembleBuiltinTools({ memory: {}, cwd: process.cwd(), model: "qwen3.8-max" })).map((t) => t.name)
  assert.ok(assembled.length === 32 && builtinTools.length === 23, "R4 核名集 24+8（静态表 23 + 能力门 `read_image`）")
  assert.ok(!assembled.includes("context") && !assembled.includes("ide"), "R4 核注册表零宿主工具（host-only）")
  assert.equal(readdirSync(TOOL_DOCS_DIR).filter((f) => f.endsWith(".md")).length, 24, "R4 tool-docs 24 档不变")
})
