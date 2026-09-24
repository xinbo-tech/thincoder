/**
 * probe/driver.mjs — 探针驱动面（§10.3 · KD-41/42/43）：探针父面构造（provider 抛错桩）+ `buildSpawnChild`
 * + `runChildPipeline` + 观测（含相位切换）+ 停止条件（含 `skipped`）+ 超时。
 *
 * 驱动 = **进程内核心 spawn API 直调**（与真实 `subagent` 工具 spawn 同管道）；**父面零 LLM**（抛错桩——
 * 任何 LLM 路径调用即硬失败）。`skipped` 不由本档产生（成本闸截断在编排面——§10.8）。
 * 停止条件判据时点 = `onToolResult` 收口（**不入队不记 ask**——§10.3-6）。
 */

import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { createAgent, ContinueError } from "../../thincoder-core/agent.mjs"
import { prepareRun } from "../../thincoder-core/agent/setup.mjs"
import { builtinTools, readImageTool } from "../../thincoder-core/tools/index.mjs"
import { buildSpawnChild } from "../../thincoder-core/agent-tools/subagent-spawn.mjs"
import { runChildPipeline } from "../../thincoder-core/agent-tools/subagent-async.mjs"
import { specForModel } from "../../thincoder-core/model-specs.mjs"
import { PROMPTS_DIR, loadSlot } from "../../thincoder-core/prompt-files.mjs"
import { SCENARIO_SLOT_FILES } from "../../thincoder-core/prompt-overlays.mjs"
import { FILE_MUTATORS } from "../../thincoder-core/agent/helpers.mjs"
import { buildProviderEntry, effortFace } from "../lib/params.mjs"
import { sumPresent, usageTokens } from "../lib/metrics.mjs"

export const PROBE_ROLE = "eng-designer"

/** 提示词槽（`promptsDigest` 面——KD-45）：取核装配矩阵单源（`SCENARIO_SLOT_FILES["eng-designer"]`——
 *  与 child 实际装配同源，防矩阵改造后摘要静默漏槽）。 */
export const PROMPT_SLOTS = SCENARIO_SLOT_FILES[PROBE_ROLE]

/** 装配腿人格断言锚（从槽文件取首行非注释正文——不锁人读注释字面；提示词内容变更不破该断言）。 */
function personaMarker() {
  const raw = loadSlot(PROMPT_SLOTS[0])
  const line = raw.split("\n").map((s) => s.trim()).find((s) => s && !s.startsWith("<!--") && !s.startsWith("#"))
  return line ? line.slice(0, 40) : null
}

/** 提示词摘要（KD-45）：三槽文件内容摘要哈希（核 prompts 根 = `import.meta.url`——无环境覆盖缝 ⇒ A/B 对照 = 时点法）。 */
export function promptsDigest() {
  const h = createHash("sha256")
  for (const name of PROMPT_SLOTS) {
    h.update(name)
    h.update("\0")
    h.update(readFileSync(join(PROMPTS_DIR, name), "utf8"))
    h.update("\0")
  }
  return `sha256:${h.digest("hex").slice(0, 16)}`
}

/**
 * 父面 provider = **抛错桩**（§10.3-1）：`name` / `model` 两键返回桩值，其余任何键访问即抛错
 * （`chat` 必经的 `baseURL` / `apiKey` 在列 ⇒ 任何 LLM 路径调用即硬失败：「父面零 LLM」可机检）。
 * 符号键（`then` / `Symbol.toStringTag` 等通用协议探测）不属 LLM 路径 ⇒ 返回 undefined（不误伤）。
 */
export function stubParentProvider({ name = "probe-parent", model = "probe-parent" } = {}) {
  const values = { name, model }
  return new Proxy(values, {
    get(target, prop, recv) {
      if (typeof prop === "symbol" || prop in target) return Reflect.get(target, prop, recv)
      throw new Error(`probe parent provider is a hard-error stub — property "${String(prop)}" was requested; the parent face must never reach an LLM path (§10.3-1)`)
    },
  })
}

/** 父面工具表（§10.3-1）：`builtinTools` 静态表 + 按模型多模态位补 `read_image`（判据同 `tools/index.mjs:64`）。
 *  memory 绑定工具族 / 家族工具均不装（§10.9-①；家族段由 child 侧装配）。 */
export function probeParentTools(model) {
  return specForModel(model)?.multimodal ? [...builtinTools, readImageTool] : [...builtinTools]
}

/** 探针父面（合成 parent · depth 0 · `autoApprove` · `_subAgentCounter = 0`）。 */
export function buildProbeParent({ cwd, config, model }) {
  const parent = createAgent({ provider: stubParentProvider(), tools: probeParentTools(model), config, cwd, memory: null, role: null, autoApprove: true })
  parent._subAgentCounter = 0
  return parent
}

/** provider 条目构造（`lib/params.mjs` 单源 —— KD-45 沿 bench 口径）+ 实发 effort 面（KD-35 两态）。 */
export function probeProviderEntry({ entry, user, maxTokens }) {
  const base = user ?? { name: entry.provider, model: entry.model, baseURL: "", apiKey: "" }
  const providerEntry = buildProviderEntry(base, {
    model: entry.model,
    maxTokens,
    temperature: entry.temperature ?? 0,
    reasoningEffort: entry.reasoningEffort ?? null, // 档位覆写优先；缺省 ⇒ 沿 base 原值（KD-32）
  })
  return { providerEntry, effort: effortFace(entry, user) }
}

/** 写入父面 `providersList` 供 `resolveChildProvider` 取用（同名覆盖——其余条目保留）。 */
export function installProbeProvider(parent, providerEntry) {
  const rest = (parent.config?.providersList ?? []).filter((p) => p.name !== providerEntry.name)
  parent.config = { ...parent.config, providersList: [providerEntry, ...rest] }
}

/** child 装配（`buildSpawnChild`——`wantAsync = true` ⇒ 异步形返回注；spawn 门照走——§10.3-2）。 */
export function assembleProbeChild({ parent, ctx, model, batchDoc, taskBook }) {
  const args = { task: taskBook, round: "initial", batchDoc, model }
  return buildSpawnChild(parent, ctx, args, PROBE_ROLE, true, [], [], null)
}

/** 装配腿（§10.10 结构级 / `--dry-run`）：真 `buildSpawnChild` + `prepareRun`（人格与家族段装配）——**不驱动**。 */
export async function assemblyLeg({ parent, model, batchDoc, taskBook }) {
  const ctx = { depth: 0, agent: parent, callbacks: {}, signal: null, onPermissionRequest: undefined }
  const built = assembleProbeChild({ parent, ctx, model, batchDoc, taskBook })
  const { tools, systemPrompt } = await prepareRun(built.child, built.input, built.childOpts, { depth: 1 })
  const names = tools.map((t) => t.name)
  const marker = personaMarker()
  return {
    built,
    facts: {
      relayPrefix: built.relayPrefix,
      asyncForm: built.child._upstream?.sync === false,
      notifyParent: names.includes("notify_parent"),
      parentChannelWired: built.child._upstream?.parent === parent,
      personaEngDesigner: marker != null && systemPrompt.includes(marker),
      batchDocBound: typeof built.child._batchDoc === "string" && built.child._batchDoc.replaceAll("\\", "/").endsWith(batchDoc),
    },
  }
}

// ── 停止条件与观测（纯函数面——可直驱测试） ───────────────────────────────────────

/** ask 判据（§10.3-6）：父队列内 `kind="ask"` ∧ `from = 本 child` ∧ `seq > 本 run 起点` 的首条。
 *  **不入队不记 ask**（仅 `notify_parent` 调用本身 ⇒ null）。 */
export function askFromQueue(queue, label, sinceSeq) {
  if (!Array.isArray(queue)) return null
  return queue.find((e) => e?.kind === "ask" && e.from === label && Number(e.seq ?? 0) > (sinceSeq ?? 0)) ?? null
}

/** 终态判定（§10.3-6 冻结）：ask 优先（判据时点 = `onToolResult` 收口）→ timeout → cap → error → completed。 */
export function terminalOf({ asked, timedOut, cappedMain, errored }) {
  if (asked) return "asked"
  if (timedOut) return "timeout"
  if (cappedMain) return "cap"
  if (errored) return "error"
  return "completed"
}

/** 相位跟踪（§10.5 `continuation`）：帧**非增** ⇒ 扩写轮（新 run、帧从其自身重数——`_turnSeq` 链起点复位）。 */
export function createPhaseTracker() {
  let lastFrame = 0
  let phase = "main"
  return {
    note(frame) {
      if (typeof frame !== "number") return phase
      if (frame <= lastFrame) phase = "continuation"
      lastFrame = frame
      return phase
    },
    get phase() { return phase },
  }
}

/** 写工具调用（§10.5：面 = `FILE_MUTATORS`；`path` 沙箱内相对形态）。 */
export function mutatorCallOf({ name, args, turn }) {
  if (!FILE_MUTATORS.has(name)) return null
  const path = typeof args?.path === "string" ? args.path.replaceAll("\\", "/") : null
  return { turn, tool: name, path }
}

/** 回合帧解析（`⟦ev⟧turn` 事件——relay 包装后形如 `<prefix>⟦ev⟧turn\x1e<n>\x1e<max>\x1ellm\x1e`）。 */
export function parseTurnFrame(text, relayPrefix) {
  const s = String(text ?? "")
  const rest = relayPrefix && s.startsWith(relayPrefix) ? s.slice(relayPrefix.length) : s
  if (!rest.startsWith("⟦ev⟧turn\x1e")) return null
  const n = Number(rest.split("\x1e")[1])
  return Number.isFinite(n) ? n : null
}

/**
 * 单 run 驱动（含观测与停止条件）：`assembleProbeChild` → `runChildPipeline`（`askContinue` 恒 false ⇒
 * 撞帽拒绝降级 partial）。返回 `{ observed, built }`——`observed.landed` 由编排面填（沙箱 diff）。
 * 超时 = `--timeout` 墙钟（定向 abort 该 run）；`baseSignal` = 进程级信号（SIGINT）合并面。
 */
export async function runProbeRun({ parent, model, batchDoc, taskBook, fixtureId, timeoutSec, baseSignal = null }) {
  const obs = {
    fixtureId, terminal: null, errorText: null, asked: null, maxTurn: null,
    toolCalls: [], mutatorCalls: [], report: null,
    metrics: { wallMs: null, calls: 0, tokens: { prompt: null, cached: null, completion: null }, callTokens: [] },
    continuation: null, landed: [], warnings: [],
  }
  const seen = { cappedMain: false, timedOut: false }
  const tracker = createPhaseTracker()
  const state = { relayPrefix: "", label: "", child: null, asked: null }
  const seqAtStart = Number(parent._childUpstreamSeq ?? 0)
  const ctrl = new AbortController()
  const noteAsk = () => {
    if (state.asked) return false
    const hit = askFromQueue(parent._childUpstream, state.label, seqAtStart)
    if (!hit) return false // 未入队 ⇒ 不记 ask（反例腿）
    const turn = state.child?._currentTurn ?? null
    if (tracker.phase === "continuation") {
      obs.continuation = { turnsUsed: obs.continuation?.turnsUsed ?? turn, asked: true }
    } else {
      obs.asked = { turn, message: hit.message, seq: hit.seq }
    }
    state.asked = hit
    ctrl.abort() // 首次 ask 已入队 ⇒ 终止该 run（§10.3-6）
    return true
  }
  const ctx = {
    depth: 0, agent: parent, signal: null, onPermissionRequest: undefined,
    callbacks: {
      onToken: (t) => {
        const frame = parseTurnFrame(t, state.relayPrefix)
        if (frame == null) return
        obs.metrics.calls++ // 一帧 = 一次 LLM 调用（段内 1:1；核内重试不入 ⇒ calls = 回合帧数，总调用数看本计数）
        const phase = tracker.note(frame)
        if (phase === "main") obs.maxTurn = Math.max(obs.maxTurn ?? 0, frame)
        else obs.continuation = { turnsUsed: Math.max(obs.continuation?.turnsUsed ?? 0, frame), asked: obs.continuation?.asked === true }
      },
      onToolCall: (name, args) => {
        const tool = state.relayPrefix && String(name).startsWith(state.relayPrefix) ? String(name).slice(state.relayPrefix.length) : String(name)
        const turn = state.child?._currentTurn ?? null
        obs.toolCalls.push({ turn, tool })
        const m = mutatorCallOf({ name: tool, args, turn })
        if (m) obs.mutatorCalls.push(m)
      },
    },
  }
  const built = assembleProbeChild({ parent, ctx, model, batchDoc, taskBook })
  state.relayPrefix = built.relayPrefix
  state.label = built.relayPrefix.slice(0, -1)
  state.child = built.child
  const runCallbacks = {
    ...built.childOpts,
    // 记账（§10.3-5）：onUsage per-call usage（token 只认 usage 精确值——缺即 null，不估）
    onUsage: (usage) => obs.metrics.callTokens.push(usageTokens(usage)),
    // 停止条件判据时点 = onToolResult 收口（原始工具名——不经 relay 包装）
    onToolResult: (name) => { if (name === "notify_parent") noteAsk() },
  }
  const runOpts = { ...built.childRunOpts, signal: baseSignal ? AbortSignal.any([baseSignal, ctrl.signal]) : ctrl.signal }
  const timer = setTimeout(() => { seen.timedOut = true; ctrl.abort() }, Math.max(1, timeoutSec) * 1000)
  const t0 = Date.now()
  let caught = null
  try {
    const report = await runChildPipeline(built.child, built.input, runCallbacks, runOpts, {
      parent, role: PROBE_ROLE, args: { batchDoc }, askContinue: () => { seen.cappedMain = true; return Promise.resolve(false) },
    })
    obs.report = String(report ?? "")
    if (tracker.phase === "continuation" && obs.continuation == null) obs.continuation = { turnsUsed: obs.maxTurn, asked: false }
  } catch (e) {
    caught = e
    if (e instanceof ContinueError) {
      obs.warnings.push("扩写轮撞帽（ContinueError 逸出管道——主体 run 终态保持，§10.5 相位单列）")
    }
  } finally {
    clearTimeout(timer)
    obs.metrics.wallMs = Date.now() - t0
    obs.metrics.tokens = {
      prompt: sumPresent(obs.metrics.callTokens.map((t) => t?.prompt)),
      cached: sumPresent(obs.metrics.callTokens.map((t) => t?.cached)),
      completion: sumPresent(obs.metrics.callTokens.map((t) => t?.completion)),
    }
  }
  const asked = obs.asked != null || obs.continuation?.asked === true
  const errored = caught != null && !(caught instanceof ContinueError)
  obs.terminal = terminalOf({ asked, timedOut: seen.timedOut, cappedMain: seen.cappedMain, errored })
  if (obs.terminal === "timeout") obs.warnings.push(`单 run 墙钟超时（${timeoutSec}s）——定向 abort（§10.3-6）`)
  if (obs.terminal === "error") {
    obs.errorText = `${caught?.name ?? "Error"}: ${caught?.message ?? String(caught)}`
    obs.warnings.push(`run 运行异常：${obs.errorText.slice(0, 160)}`)
  }
  return { observed: obs, built }
}
