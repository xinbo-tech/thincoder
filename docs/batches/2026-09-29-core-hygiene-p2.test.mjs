/**
 * 2026-09-29-core-hygiene-p2.test.mjs — P2（#579 核 agent.mjs 三拆）批本地判据件：D1–D5。
 * 暂存形态（写门 #545）：先落 `.thincoder/tmp/`（与终位 `docs/batches/` 同为两层深——相对 import 同形）；
 * 复跑 = `node --test docs/batches/2026-09-29-core-hygiene-p2.test.mjs`（cwd = 仓根）。
 *
 * 判据面：
 * - D1 逐字搬移核（主判据）+ 留守面守恒：基线快照 = `2026-09-29-agent-p2-baseline.mjs`
 *   （P2 起点刻工作树实读副本；查找序 = P2_BASELINE 环境变量 → 本件同目录 → `.thincoder/tmp/`）。
 *   7 段对拍，容许三类声明改写：① 缩进 ∕ 包裹行（比较按 trimStart 归一）② 相对说明符
 *   ③ 接口收窄（`tools` 去绑定）；另核 7 段 + 留守区并集 = 基线全档 + 留守样本行逐字在位。
 *   **拆分后缺快照 = 硬失败**（skip 只留给拆分前「三新档缺位」一支）。
 * - D2 面锁：导入面 23 名集合相等 + `node --check` 4/4 + `import()` 零抛。
 * - D3 结构哨兵 3/3（agent.mjs 不含已迁哨兵 ∕ 三新档各含对应）。
 * - D4 投影核：逐段自由变量在签名 ∕ ctx 装配 ∕ import 面各有落点（含 §2.10-D 逐键消费点 + 说明符改写落位）。
 * - D5 端到端等价轮：环回 SSE + 调用方注入 `provider`，真跑 `runAgent`（tool-call 轮 + 收尾）；
 *   观测面 = 终态 content ∕ 工具执行 ∕ 关键历史形态。拆分前跑记基线 → 拆分后复跑，观测逐项相等。
 *
 * 拆分前（三新档缺位）⇒ D1–D4 skip；D5 照跑记基线。拆分后全绿。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createServer } from "node:http"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const HERE = fileURLToPath(new URL(".", import.meta.url))
const CORE = join(ROOT, "thincoder-core")
const AGENT_MJS = join(CORE, "agent.mjs")
const RUN_START = join(CORE, "agent", "run-start.mjs")
const TURN_LOOP = join(CORE, "agent", "turn-loop.mjs")
const CHAT_CALL = join(CORE, "agent", "chat-call.mjs")
const BASELINE_NAME = "2026-09-29-agent-p2-baseline.mjs"
const BASELINE = process.env.P2_BASELINE
  ?? [join(HERE, BASELINE_NAME), join(ROOT, ".thincoder", "tmp", BASELINE_NAME)].find((p) => existsSync(p))
  ?? join(ROOT, ".thincoder", "tmp", BASELINE_NAME)

const EXPORT_NAMES = [
  "runAgent", "createAgent", "streamOutputAllowed", "ContinueError", "listWorkDir",
  "loadProjectInstructions", "readonlyToolNames", "collectGitContext", "escapeXml",
  "MIN_REPORT_CHARS", "REPORT_CONTINUATION", "DEFAULT_SUBAGENT_TURNS",
  "SUBAGENT_TOOL_EXCLUSIONS", "excludeSubagentTools", "hasCodeMutations",
  "PERSONA_ENGINEERING", "PERSONA_NORMAL", "COMMON",
  "DISCIPLINE_ENGINEERING", "DISCIPLINE_NORMAL", "CONSULT_BASE",
  "ENG_ON_REMINDER", "ENG_OFF_REMINDER",
]
const splitPresent = () => [RUN_START, TURN_LOOP, CHAT_CALL].every((f) => existsSync(f))

// ── D1：段表（届盘坐标 = 基线内容行，1-based 含端点）——§2.10-B ──
const SEGMENTS = {
  [RUN_START]: [[103, 193]],
  [TURN_LOOP]: [[194, 223], [227, 272], [321, 451], [453, 456]],
  [CHAT_CALL]: [[273, 320], [95, 99]],
}
const SPECIFIER_REWRITES = [
  ['"./agent-tools/', '"../agent-tools/'],
  ['"./auto-think.mjs"', '"../auto-think.mjs"'],
]
const NARROW_BEFORE = "const { maxTurns, threshold, tools, toolSchemas, toolByName, systemPrompt } = await prepareRun("
const NARROW_AFTER = "const { maxTurns, threshold, toolSchemas, toolByName, systemPrompt } = await prepareRun("
function candidateForms(line) {
  // 方向性核：声明改写必须**实际落位**——specifier 行只接受改写后形，收窄行只接受收窄后形。
  const t = line.trimStart()
  for (const [from, to] of SPECIFIER_REWRITES) if (t.includes(from)) return new Set([t.split(from).join(to)])
  if (t === NARROW_BEFORE) return new Set([NARROW_AFTER])
  return new Set([t])
}

test("D1 逐字搬移核：7/7 段吻合（三类声明改写之外零差异）+ 留守面守恒", (t) => {
  if (!splitPresent()) return t.skip("拆分前：三新档缺位")
  assert.ok(existsSync(BASELINE), `基线快照缺位——D1 不可判（拆分后缺快照 = 硬失败）：${BASELINE}`)
  const baseLines = readFileSync(BASELINE, "utf8").split("\n")
  let matched = 0
  const rewrites = []
  const dedents = []
  for (const [file, segs] of Object.entries(SEGMENTS)) {
    const fileLines = readFileSync(file, "utf8").split("\n")
    for (const [a, b] of segs) {
      const seg = baseLines.slice(a - 1, b)
      const cands = seg.map(candidateForms)
      let found = -1
      for (let p = 0; p + seg.length <= fileLines.length && found < 0; p++) {
        let all = true
        for (let i = 0; i < seg.length; i++) {
          if (!cands[i].has(fileLines[p + i].trimStart())) { all = false; break }
        }
        if (all) found = p
      }
      assert.ok(found >= 0, `段 ${a}-${b} 未在 ${file} 按序逐行吻合`)
      matched += 1
      for (let i = 0; i < seg.length; i++) {
        if (seg[i].trimStart() !== fileLines[found + i].trimStart()) {
          rewrites.push(`${file} 段 ${a}-${b} 行 ${a + i}：${seg[i].trimStart().slice(0, 70)}`)
        }
      }
      let indentChanged = 0
      for (let i = 0; i < seg.length; i++) {
        const w0 = seg[i].length - seg[i].trimStart().length
        const w1 = fileLines[found + i].length - fileLines[found + i].trimStart().length
        if (w0 !== w1) indentChanged += 1
      }
      if (indentChanged > 0) dedents.push(`${file} 段 ${a}-${b}：缩进行 ${indentChanged}/${seg.length}`)
    }
  }
  // 留守面守恒（加固）：7 段 + 留守区并集 = 基线全档（零漏零叠）+ 留守样本行逐字在位。
  const RETAINED = [[1, 94], [100, 102], [224, 226], [452, 452], [457, 466]]
  const ranges = [...Object.values(SEGMENTS).flat(), ...RETAINED].sort((x, y) => x[0] - y[0])
  let cursor = 1
  for (const [a, b] of ranges) {
    assert.equal(a, cursor, `基线区间并集不连续：起 ${a} ≠ 期望 ${cursor}`)
    cursor = b + 1
  }
  assert.equal(cursor, baseLines.length, `并集未覆盖基线全档（至 ${cursor - 1} ∕ 共 ${baseLines.length - 1} 内容行）`)
  const agentSrc = readFileSync(AGENT_MJS, "utf8")
  for (const n of [63, 74, 91, 102, 458, 464]) {
    assert.ok(agentSrc.includes(baseLines[n - 1].trimStart()), `留守面样本行缺失（基线 :${n}）`)
  }
  console.log(`D1: ${matched}/7 段吻合 · 内容改写 ${rewrites.length} 处 · 缩进改写 ${dedents.length} 段 · 留守面守恒（并集 = 全档 ${baseLines.length - 1} 行 · 样本 6/6）`)
  for (const r of rewrites) console.log("  rewrite:", r)
  for (const d of dedents) console.log("  dedent:", d)
  assert.equal(matched, 7)
})

test("D2 面锁：导出 23 名集合相等 + node --check 4/4 + import() 零抛", async (t) => {
  if (!splitPresent()) return t.skip("拆分前：三新档缺位（新档装载面未生效）")
  const ns = await import(pathToFileURL(AGENT_MJS).href)
  assert.deepEqual(Object.keys(ns).sort(), [...EXPORT_NAMES].sort(), "导出名集合 = 23 名（集合相等）")
  for (const f of [AGENT_MJS, RUN_START, TURN_LOOP, CHAT_CALL]) {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" })
  }
  await import(pathToFileURL(RUN_START).href)
  await import(pathToFileURL(TURN_LOOP).href)
  await import(pathToFileURL(CHAT_CALL).href)
})

test("D3 结构哨兵：agent.mjs 不含已迁哨兵 ∕ 三新档各含对应（3/3）", (t) => {
  if (!splitPresent()) return t.skip("拆分前：三新档缺位")
  const agentSrc = readFileSync(AGENT_MJS, "utf8")
  const sentinels = [
    ["for (let turn", TURN_LOOP],
    ["agent._continueSegments = resume", RUN_START],
    ["await chat(agent.provider", CHAT_CALL],
  ]
  for (const [s, f] of sentinels) {
    assert.ok(!agentSrc.includes(s), `agent.mjs 不应再含哨兵：${s}`)
    assert.ok(readFileSync(f, "utf8").includes(s), `${f} 应含哨兵：${s}`)
  }
})

test("D4 投影核：自由变量逐面有落点 + 逐键消费点 + 说明符改写落位", (t) => {
  if (!splitPresent()) return t.skip("拆分前：三新档缺位")
  const runStart = readFileSync(RUN_START, "utf8")
  const turnLoop = readFileSync(TURN_LOOP, "utf8")
  const chatCall = readFileSync(CHAT_CALL, "utf8")
  const agentSrc = readFileSync(AGENT_MJS, "utf8")

  const between = (src, a, b) => {
    const i = src.indexOf(a)
    assert.ok(i >= 0, `缺标记（起）：${a}`)
    const j = src.indexOf(b, i)
    assert.ok(j >= 0, `缺标记（止）：${b}`)
    return src.slice(i, j)
  }
  const importRegion = (src) => {
    const lines = src.split("\n")
    const end = lines.findIndex((l) => l.startsWith("export"))
    return lines.slice(0, end < 0 ? lines.length : end)
      .filter((l) => { const t = l.trim(); return t && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*") })
      .join("\n")
  }
  const has = (src, name) => new RegExp(`\\b${name}\\b`).test(src)

  const beginSig = between(runStart, "export async function beginRun(", ") {")
  const beginCall = between(agentSrc, "await beginRun(", "await runTurnLoop(")
  const loopSig = between(turnLoop, "export async function runTurnLoop(agent, {", ") {")
  const loopCall = between(agentSrc, "await runTurnLoop(", "} catch (e) {")
  const callSig = between(chatCall, "export async function callModelTurn(agent, {", ") {")
  const callSite = between(turnLoop, "await callModelTurn(", "})")

  const faces = [
    {
      name: "run-start", sig: beginSig, sigNames: ["agent", "input", "callbacks"],
      keys: ["depth", "signal", "overrideTurns", "resume", "autoTurn", "upstreamTurn", "timerTurn", "extraTools", "injections", "promptTail", "toolDecorate", "turnDomainText"],
      imports: ["prepareRun", "restoreGuard", "AUTO_TURN_DIGEST_DOMAIN", "AUTO_TURN_DIGEST_DOMAIN_ENG", "UPSTREAM_TURN_DOMAIN", "TIMER_TURN_DOMAIN"],
      call: beginCall, callKeys: null, src: runStart,
    },
    {
      name: "turn-loop", sig: loopSig, sigNames: ["agent"],
      keys: ["maxTurns", "threshold", "toolSchemas", "toolByName", "systemPrompt", "depth", "signal", "autoTurn", "streamOutput", "consumeInjected", "consumeQueuedInput", "callbacks", "distillSignal"],
      imports: ["turnFrame", "ContinueError", "FILE_MUTATORS", "toolTouchPaths", "runCompactionCheck", "injectTurnReminders", "injectResponseReminders", "injectPostTurn", "handleCompletion", "executeToolCalls", "recordToolResults", "pushReal", "summarizeRunExplorations", "abortError", "annotateAbort", "specForModel", "assistantToolCallMessage", "resolve", "callModelTurn"],
      call: loopCall, callKeys: "all", src: turnLoop,
    },
    {
      name: "chat-call", sig: callSig, sigNames: ["agent"],
      keys: ["systemPrompt", "toolSchemas", "streamOutput", "callbacks", "signal", "streamRuleFired", "autoTurn", "depth", "turn"],
      imports: ["chat"],
      call: callSite, callKeys: "all", src: chatCall,
    },
  ]
  let bound = 0
  let total = 0
  for (const f of faces) {
    for (const n of [...f.sigNames, ...f.keys]) { has(f.sig, n) || assert.fail(`${f.name} 签名缺落点：${n}`); bound += 1; total += 1 }
    for (const n of f.imports) { has(importRegion(f.src), n) || assert.fail(`${f.name} import 面缺落点：${n}`); bound += 1; total += 1 }
    if (f.callKeys === "all") {
      for (const n of f.keys) { has(f.call, n) || assert.fail(`${f.name} 调用点缺键：${n}`); bound += 1; total += 1 }
    } else {
      for (const n of f.keys) { has(f.call, n) || assert.fail(`agent.mjs beginRun 调用缺键：${n}`); bound += 1; total += 1 }
    }
  }
  // 相对说明符改写落位（run-start 3 ∕ turn-loop 1 ∕ chat-call 1）
  const specifiers = [
    [runStart, "../agent-tools/subagent.mjs"], [runStart, "../agent-tools/consult.mjs"],
    [runStart, "../agent-tools/async-settle.mjs"], [turnLoop, "../agent-tools/parent-channel.mjs"],
    [chatCall, "../auto-think.mjs"],
  ]
  for (const [src, s] of specifiers) { assert.ok(src.includes(s), `说明符改写未落位：${s}`); bound += 1; total += 1 }
  // §2.10-D 逐键消费点（缺一即该点静默失效）
  const consumption = [
    [runStart, "turnDomainText ?? domainBase"],
    [runStart, "extraTools, injections, promptTail, toolDecorate"],
    [runStart, "const { maxTurns, threshold, toolSchemas, toolByName, systemPrompt } = await prepareRun("],
    [turnLoop, "consumeInjected?.(agent)"],
    [turnLoop, "consumeQueuedInput?.(agent)"],
    [turnLoop, "distillSignal ?? signal"],
    [chatCall, "streamOutputAllowed(depth, agent._role, streamOutput)"],
    [chatCall, "auto: autoTurn"],
    [chatCall, "firedPatterns: streamRuleFired"],
  ]
  for (const [src, s] of consumption) { assert.ok(src.includes(s), `逐键消费点缺落位：${s}`); bound += 1; total += 1 }
  console.log(`D4: ${bound}/${total} 落点（签名 ∕ import ∕ 调用链 ∕ 消费点）`)
})

// ── D5：端到端等价轮 ──
function startSseServer(script) {
  let reqNo = 0
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const step = script[Math.min(reqNo++, script.length - 1)]
      const frames = step.toolCall
        ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: step.id, function: { name: step.toolCall.name, arguments: step.toolCall.arguments } }] } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] })}\n\n` +
          `data: [DONE]\n\n`
        : `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })))
}

const EXPECTED_SNAPSHOT = {
  out: "收尾完成",
  executed: ["p2"],
  history: [
    { role: "user", content: "P2 等价轮：干活" },
    { role: "assistant", content: null, tool_calls: [{ id: "call_p2_1", name: "probe", arguments: '{"mark":"p2"}' }] },
    { role: "tool", tool_call_id: "call_p2_1", name: "probe", content: "probe ok p2" },
    { role: "assistant", content: "收尾完成" },
  ],
}

test("D5 端到端等价轮：tool-call 轮 + 收尾（环回 SSE ∕ 注入 provider）", async () => {
  const { server, port } = await startSseServer([
    { toolCall: { name: "probe", arguments: '{"mark":"p2"}' }, id: "call_p2_1" },
    { content: "收尾完成" },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "p2-equiv-"))
  try {
    const { createAgent, runAgent } = await import(pathToFileURL(AGENT_MJS).href)
    const executed = []
    const probe = {
      name: "probe", readonly: true, description: "p2 probe",
      parameters: { type: "object", properties: { mark: { type: "string" } } },
      execute: async ({ mark }) => { executed.push(mark); return `probe ok ${mark}` },
    }
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [probe], config: { agent: {} }, cwd,
    })
    const out = await runAgent(agent, "P2 等价轮：干活", {}, {})
    const snapshot = {
      out,
      executed,
      history: agent.history.filter((m) => !m.transient).map((m) => ({
        role: m.role,
        content: m.content ?? null,
        ...(m.tool_calls ? { tool_calls: m.tool_calls.map((tc) => ({ id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments })) } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id, name: m.name } : {}),
      })),
    }
    console.log("P2-OBSERVATIONS " + JSON.stringify(snapshot))
    assert.deepEqual(snapshot, EXPECTED_SNAPSHOT)
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
