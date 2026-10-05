/**
 * 2026-10-05-advisor-loop-split.test.mjs — `advisor/loop.mjs` 拆分批（台账 #951）批次本地件。
 * 名随批次档 · 住批次目录 · **不进仓套件**；复跑（仓根 thincoder 下）：
 *   node --test docs/batches/2026-10-05-advisor-loop-split.test.mjs
 *
 * 两腿族（双相位对拍协议——批档 §2.6）：
 *   B 腿（行为对拍 · B1–B6）：`_runAdvisorToolLoop` 外部可观测读数（return 串 / onOutput 序列 /
 *     messages 形态）——期望值 = Phase A（拆分前）实跑捕获后冻结入件，拆分后须逐字相等。
 *     B1 多轮工具回路（并行两工具 + 未知工具 + 坏参 JSON）· B2 空响应回落 · B3 中断（预中止 signal）·
 *     B4 墙钟（`seams.now` 推过 deadline）· B5 压缩两分支（通知行 ∥ 超限尾）· B6 0.75 预算提示恰一次。
 *   S 腿（结构族 · S1–S4）：S1 新档 / 导出 / 行数 · S2 逐字迁移（切点 A/B + loop 替换行 + import 面）·
 *     S3 接口面零改锁（批前即绿——零改面锁）· S4 零环面（timeline 零 import · 无反向依赖）。
 *
 * 红绿对（批档 §5）：Phase A（拆分前）= B 绿 ∥ S1/S2/S4 红（新档不在盘 / 主档 310 / 导出缺位）；
 * Phase B（拆分后）= 全绿 ∧ B 腿读数与 Phase A 逐字相等。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")

const LOOP_REL = "thincoder-core/advisor/loop.mjs"
const TIMELINE_REL = "thincoder-core/advisor/timeline.mjs"
const COMPACTION_REL = "thincoder-core/advisor/compaction.mjs"

const ADV = await mod(LOOP_REL)        // _runAdvisorToolLoop（评审族宿主）
const CMP = await mod(COMPACTION_REL)
const RUN = await mod("thincoder-core/advisor/run.mjs") // 转口面（零改对照）

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)

/* ── B 腿夹具：真 `_runAdvisorToolLoop` + chat 缝（零网络）+ 只读探针工具清单 ──────────── */

const TOOLSET = { schemas: [], byName: new Map([
  ["probe_a", { name: "probe_a", readonly: true, execute: async () => "A-OK" }],
  ["probe_b", { name: "probe_b", readonly: true, execute: async () => "B-OK" }],
]) }

function mkRun({ script, seams = {}, agent = {}, provider = { model: "harness-model" },
  messages = [{ role: "user", content: "review fixture" }], toolsOverride = TOOLSET, signal = null, pinned = null }) {
  const state = { calls: 0, chunks: [] }
  const chat = async (_p, opts) => {
    const step = script[state.calls]
    state.calls += 1
    if (!step) throw new Error(`advisor chat stub exhausted (call #${state.calls})`)
    step.tick?.()
    if (step.stream && step.content) opts.onToken?.(step.content)
    return { content: step.content ?? "", toolCalls: step.toolCalls ?? [] }
  }
  const onOutput = (c) => state.chunks.push(`${c.kind}:${c.text}`)
  const run = () => ADV._runAdvisorToolLoop(provider, messages, onOutput, signal, agent, ROOT,
    toolsOverride, "code", null, pinned, { chat, ...seams })
  return { state, run, messages }
}

/* ── B1 多轮工具回路（并行两工具 + 未知工具 + 坏参 JSON ⇒ 收尾文本） ─────────────────── */

test("B1 多轮工具回路：进度行 / 工具回填序 / 收尾串与 Phase A 逐字相等", async () => {
  const r = mkRun({ script: [
    { content: "", toolCalls: [
      { id: "t1", name: "probe_a", arguments: '{"path":"a.txt"}' },
      { id: "t2", name: "probe_b", arguments: "{bad json" },
      { id: "t3", name: "nope", arguments: "{}" },
    ] },
    { content: "DONE — review complete.", toolCalls: [], stream: true },
  ] })
  const ret = await r.run()
  out("B1.return", JSON.stringify(ret))
  assert.equal(ret, "→ probe_a\n\n→ nope\n\nDONE — review complete.", "收尾串 = Phase A 基线（含工具进度行合流）")
  assert.deepEqual(r.state.chunks, [
    "think:\n[thinking…]\n",
    "tool:\n→ probe_a\n",
    "tool:\n→ nope\n",
    "think:\n[thinking…]\n",
    "text:DONE — review complete.",
  ], "onOutput 序列 = Phase A 基线（坏参 JSON 无进度行）")
  const tools = r.messages.filter((m) => m.role === "tool")
  assert.equal(tools.length, 3, "三结果按 toolCalls 序回填")
  assert.equal(tools[0].content, "A-OK", "并行工具结果")
  assert.ok(tools[1].content.startsWith("Error: invalid JSON in tool arguments:"), "坏参 JSON ⇒ 解析错误回填")
  assert.equal(tools[2].content, 'Error: unknown tool "nope". Available: probe_a, probe_b', "未知工具 ⇒ 可用清单")
  assert.equal(tools[0].tool_call_id, "t1")
  out("B1.messages", `tool×3 = [A-OK ∥ invalid JSON ∥ unknown tool]`)
})

/* ── B2 空响应回落 / B3 中断 / B4 墙钟 ──────────────────────────────────────────── */

test("B2 空响应回落：无文本无工具 ⇒ 空响应尾（Phase A 基线）", async () => {
  const r = mkRun({ script: [{ content: "", toolCalls: [] }] })
  assert.equal(await r.run(), "Advisor: empty response — review was inconclusive")
  out("B2.return", "Advisor: empty response — review was inconclusive")
})

test("B3 中断：预中止 signal ⇒ interrupted 尾，chat 零调用", async () => {
  const ac = new AbortController()
  ac.abort()
  const r = mkRun({ script: [], signal: ac.signal })
  assert.equal(await r.run(), "Advisor: interrupted.")
  assert.equal(r.state.calls, 0, "chat 未被调用（首检查点即返）")
  out("B3.return", "Advisor: interrupted. · chatCalls 0")
})

test("B4 墙钟：seams.now 推过 deadline ⇒ 结构化超时尾（Phase A 基线）", async () => {
  let n = 0
  const r = mkRun({ script: [], agent: { config: { advisor: { timeoutMs: 1000 } } },
    seams: { now: () => (n++ === 0 ? 0 : 5000) } })
  const ret = await r.run()
  out("B4.return", JSON.stringify(ret))
  assert.equal(ret, "Advisor: review timeout after 1s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.\n- rounds: 0 · tool calls: 0 · review text produced: no\n- budget: 1s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.")
})

/* ── B5 压缩两分支（小窗 provider：context 1K ⇒ limit 819 · compactAt 655） ──────────── */

test("B5a 压缩通知行：超 compactAt 未超 limit ⇒ 通知 + 正常收尾（无超限尾）", async () => {
  const messages = [{ role: "user", content: "x".repeat(3000) }] // 750 tokens
  const r = mkRun({ provider: { model: "harness-model", context: 1 }, messages,
    script: [{ content: "B5A done.", toolCalls: [], stream: true }] })
  const ret = await r.run()
  out("B5a.return", JSON.stringify(ret))
  assert.equal(ret, "[Context compacted: 750 tokens → reducing to fit window]\nB5A done.")
  assert.ok(!ret.includes("context window limit"), "未越 limit ⇒ 无超限尾")
})

test("B5b 超限尾：重写后仍超 limit ⇒ context_limit 尾（pinned 随挂 · 原位重写）", async () => {
  const messages = [
    { role: "system", content: "S" },
    ...Array.from({ length: 24 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}:` + "x".repeat(260) })),
  ]
  const r = mkRun({ provider: { model: "harness-model", context: 1 }, messages, pinned: "PINNED BRIEF", script: [] })
  const ret = await r.run()
  out("B5b.return", JSON.stringify(ret))
  assert.equal(ret, "[Context compacted: 1585 tokens → reducing to fit window]\n\nAdvisor: context window limit reached (1340 tokens). Review incomplete — too many tool calls. Try a narrower scope.")
  assert.equal(messages.length, 23, "重写形态 = system + 压缩注 + pinned + 末 20（原位 splice）")
  assert.equal(messages[0].content, "S", "system 保位")
  assert.ok(String(messages[1].content).startsWith("[Context compacted] Earlier exploration:"), "压缩注 = 首条被摘要段")
  assert.equal(messages[2].content, "PINNED BRIEF", "F13 pinned 重挂（压缩不丢）")
})

test("B6 0.75 预算提示恰一次：推过阈值只提示一次，文本逐字", async () => {
  let clock = 0
  const r = mkRun({ agent: { config: { advisor: { timeoutMs: 1000 } } }, seams: { now: () => clock },
    script: [
      { tick: () => { clock = 900 }, content: "", toolCalls: [{ id: "t1", name: "probe_a", arguments: "{}" }] },
      { content: "", toolCalls: [{ id: "t2", name: "probe_a", arguments: "{}" }] },
      { content: "B6 done.", toolCalls: [], stream: true },
    ] })
  const ret = await r.run()
  const nudges = r.messages.filter((m) => m.role === "user" && String(m.content).startsWith("⏳ review budget:"))
  assert.equal(nudges.length, 1, "恰一次（第 2 轮触发，第 3 轮不重发）")
  assert.equal(nudges[0].content, "⏳ review budget: ~90% consumed (0.9s of 1s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as `unverified` (unverified evidence must not support a pass), and emit your verdict line.")
  assert.equal(ret, "→ probe_a\n\n→ probe_a\n\nB6 done.")
  out("B6.nudges", `${nudges.length} · return 基线逐字相等`)
})

/* ── S1 结构：新档在盘 / 行数守限 / 新导出在位 ─────────────────────────────────────── */

test("S1 结构：timeline.mjs 在盘 · 三档 ≤300 · 两新导出在位", async () => {
  const counts = {}
  for (const rel of [LOOP_REL, TIMELINE_REL, COMPACTION_REL]) {
    try { counts[rel] = read(rel).split("\n").length - 1 } catch { counts[rel] = null }
  }
  out("S1.行数", JSON.stringify(counts))
  assert.notEqual(counts[TIMELINE_REL], null, "timeline.mjs 在盘（拆分产物）")
  for (const rel of [LOOP_REL, TIMELINE_REL, COMPACTION_REL]) {
    assert.ok(counts[rel] !== null && counts[rel] <= 300, `${rel} ≤300（实读 ${counts[rel]}）`)
  }
  assert.ok(counts[LOOP_REL] < 310, "主档已回落（拆分前 310）")
  let timelineMod = null
  try { timelineMod = await mod(TIMELINE_REL) } catch { /* 批前缺席 */ }
  assert.equal(typeof timelineMod?.createTimelineRecorder, "function", "timeline.mjs 唯一导出 = createTimelineRecorder")
  assert.equal(typeof CMP.compactContextIfNeeded, "function", "compaction.mjs 新导出 = compactContextIfNeeded")
})

/* ── S2 逐字迁移：切点 A/B 逐字 ⊆ 乘积档 · loop 替换行 / import 面逐字 ───────────────── */

test("S2 逐字：切点 A（15 行）⊆ timeline.mjs · 切点 B（11 行，去缩进）⊆ compaction.mjs · loop 替换行", () => {
  const loopSrc = read(LOOP_REL)
  const timelineSrc = read(TIMELINE_REL)
  const compSrc = read(COMPACTION_REL)

  const CUT_A = `  // Kind-tagged wrappers: the TUI panel colors reasoning / answer / tool progress differently.
  // Every chunk is ALSO recorded into an ordered timeline — the persisted record
  // must show the review process (thinking ↔ tool progress ↔ final text) at its
  // real positions, not a summary appended at the end. Same-kind consecutive
  // chunks merge (token streams); kind flips start a new entry.
  const timeline = []
  const record = (kind, text) => {
    const last = timeline.at(-1)
    if (last && last.kind === kind) last.text += text
    else timeline.push({ kind, text })
  }
  const emit = (kind) => (text) => { record(kind, text); onOutput?.({ kind, text }) }
  const onThink = emit("think")
  const onText = emit("text")
  const onTool = emit("tool")
`
  assert.ok(timelineSrc.includes(CUT_A), "切点 A `:71-85` 逐字（缩进不变）")
  assert.ok(timelineSrc.includes("export function createTimelineRecorder(onOutput) {"), "工厂壳")
  assert.ok(timelineSrc.includes("  return { timeline, onThink, onText, onTool }"), "三 kind 返回对象（名序逐字）")

  const CUT_B = `  // Check context window and compact if needed
  const currentTokens = estimateTokens(messages)
  if (currentTokens > budget.compactAt) {
    onText(\`\\n[Context compacted: \${currentTokens} tokens → reducing to fit window]\\n\`)
    compactMessages(messages, pinned)
    if (estimateTokens(messages) > budget.limit) {
      // Report the POST-compaction count — the pre-compaction currentTokens
      // is stale by the time compaction has run.
      return \`Advisor: context window limit reached (\${estimateTokens(messages)} tokens). Review incomplete — too many tool calls. Try a narrower scope.\`
    }
  }
`
  assert.ok(compSrc.includes("export function compactContextIfNeeded(messages, budget, pinned, onText) {"), "新导出签名逐字")
  assert.ok(compSrc.includes(CUT_B), "切点 B `:146-156` 逐字（去缩进两级 · 尾串去 renderTimeline 包装）")

  assert.ok(loopSrc.includes("  const { timeline, onThink, onText, onTool } = createTimelineRecorder(onOutput)"), "loop 替换行①（切点 A）逐字")
  assert.ok(loopSrc.includes("    // 压缩协作（迁出 compaction.mjs `compactContextIfNeeded`）：超限尾 ⇒ 收尾"), "loop 替换行②（切点 B 注）逐字")
  assert.ok(loopSrc.includes("    const contextTail = compactContextIfNeeded(messages, budget, pinned, onText)"), "loop 替换行③ 逐字")
  assert.ok(loopSrc.includes("    if (contextTail) return renderTimeline(timeline, contextTail)"), "loop 替换行④ 逐字")
  assert.ok(loopSrc.includes('import { createTimelineRecorder } from "./timeline.mjs"'), "loop import 面 +1 行逐字")
  assert.ok(loopSrc.includes("compactContextIfNeeded,"), "loop import 面（compaction.mjs 同名语句追加）")
  for (const gone of ["const timeline = []", "compactMessages(messages, pinned)", "estimateTokens(messages)"]) {
    assert.ok(!loopSrc.includes(gone), `主档不再含迁出面：${gone}`)
  }
  out("S2.逐字", "切点 A/B ⊆ 新家 · loop 替换 4 行 + import 面逐字 ✓")
})

/* ── S3 接口面零改锁（批前即绿——零改面锁） ────────────────────────────────────────── */

test("S3 接口面零改：loop 导出键集 4 名 · 别名 identity · run.mjs 转口可解析", () => {
  const keys = Object.keys(ADV).sort()
  assert.deepEqual(keys, ["_advisorToolsFor", "_runAdvisorToolLoop", "advisorToolsFor", "runAdvisorToolLoop"], "导出键集逐字 4 名")
  assert.equal(ADV._advisorToolsFor, ADV.advisorToolsFor, "别名 identity 相等")
  assert.equal(ADV._runAdvisorToolLoop, ADV.runAdvisorToolLoop, "别名 identity 相等")
  assert.equal(RUN.advisorToolsFor, ADV.advisorToolsFor, "run.mjs 转口可解析（逐字零改）")
  assert.equal(RUN._advisorToolsFor, ADV.advisorToolsFor, "run.mjs 别名转口")
  assert.equal(RUN._runAdvisorToolLoop, ADV.runAdvisorToolLoop, "run.mjs 转口（环路）")
  out("S3.接口面", "导出 4 名 + 别名 identity + run.mjs 转口 ✓（批前即绿锁）")
})

/* ── S4 零环面：timeline.mjs 零 import · 无反向依赖 ───────────────────────────────── */

test("S4 零环面：timeline.mjs 零 import · 不 import 宿主（单向 loop → {compaction, timeline}）", () => {
  const timelineSrc = read(TIMELINE_REL)
  assert.ok(!/^\s*import\s/m.test(timelineSrc), "timeline.mjs 零 import（零依赖叶）")
  assert.ok(!timelineSrc.includes("./loop.mjs"), "timeline.mjs 不 import 宿主（无反向依赖）")
  const compSrc = read(COMPACTION_REL)
  assert.ok(!compSrc.includes('require(') && !compSrc.includes('import('), "compaction.mjs 新增面无动态依赖")
  out("S4.零环面", "timeline 零 import · 无反向依赖 ✓")
})
