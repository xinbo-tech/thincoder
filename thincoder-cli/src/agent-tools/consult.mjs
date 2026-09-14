/**
 * consult.mjs — multi-model consultation ("会诊", docs/design/CONSULTATION.md). CLI port.
 *
 * Two tools (AGENT-LOOP.md §25 D-R17a — R17, 2026-09-06): consult_start
 * (non-blocking spawn) / consult_stop (cancel a running session). consult_check
 * was RETIRED with the digest auto-injection: the mechanism does ZERO judging —
 * when every model of a session settles (pending 0), the session moves to the
 * pending single container (`_pendingAsyncResults` +role "consult"——
 * ASYNC-RESULT-CONTAINER.md D2——升格完整 entry) and the NEXT run start (user turn
 * or digest auto-turn) injects the full verdict text ("[System reminder:
 * consultation #id finished — N replies …]" — per-model status annotations on
 * partial/full failures) for the main agent to judge and act on in the digestion
 * round. A cancelled session (consult_stop) never reaches the stream.
 *
 * CLI adaptation (vs the VS Code plugin): the child runner is CLI's runAgent
 * (runAgent(child, input, callbacks, opts) — an agent object, not provider+cwd);
 * children are built with createAgent({ role: "consult", readonly tools,
 * CONSULT_BASE overlay }); activity streams to the parent TUI via the relay
 * prefix `consult#<childRelayN>/` (one per consultant child — the shared subagent
 * relay channel; the child relay number is NOT the session id — sessions key
 * their own `_consultIdCounter`), not onSubagent/onToolPanel.
 * Each child settles its own TUI block with a ⟦ev⟧done event at settle (R17 —
 * the old in-turn check consumption is gone).
 */
import { createAgent, runAgent, readonlyToolNames } from "../agent.mjs"
import { resolveChildProvider } from "./subagent.mjs"
import { pushReal } from "@thincoder/core/context.mjs"
import { offloadToolResult, escapeXml } from "../agent/helpers.mjs"
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { deathLine } from "../abort-provenance.mjs"
import { makeRelay, wrapChildCallbacks, runWithContinue, ensureChildApiKey, clampEffort } from "../agent/spawn-child.mjs"
// TUI-OOM-ROOTCAUSE §23.3.1：子代理人读线窗口常量（单源——store 零依赖）。
import { RECORD_WINDOW_MESSAGES } from "../session-store.mjs"
// ASYNC-RESULT-CONTAINER.md D2/D3/D6：pending 单容器停靠 + settle 公共收尾 + child signal 单点
import { buildChildSignal, settleAsyncEntry } from "./async-settle.mjs"
import { digestBudgetOver, persistOverflowReport } from "./digest-budget.mjs" // B5（群 B 批 §22 D-DG2）：digest 注入预算单源

// Named consult defaults (consult P2, 2026-08-30).
const CONSULT_TIMEOUT_MS = 600_000 // default consult lifecycle timeout
const CONSULT_TURNS = 40           // default per-child turn cap


function consultLabel(m) {
  return `${m.provider}:${m.model}`
}

/** Narrow the configured consultModels pool to a requested subset.
 *  Each selector is "provider:model", a bare provider name, or a bare model name
 *  (case-insensitive). A trailing " (effort)" suffix is tolerated (round2 复核
 *  对齐 escalate 动作（subagent action:"escalate"）：withPool 列表会带 " (high)" 后缀，模型照抄应可匹配).
 *  Returns { models, error } — error set when a selector matches
 *  nothing (surface the typo rather than silently dropping it). Absent/empty selectors
 *  → the full pool. */
function selectConsultModels(pool, selectors) {
  if (selectors == null || (Array.isArray(selectors) && selectors.length === 0)) return { models: pool, error: null }
  const list = Array.isArray(selectors) ? selectors : [selectors] // coerce a bare string → [string]
  const selected = []
  const seen = new Set()
  const unknowns = []
  for (const raw of list) {
    const s = String(raw).replace(/\s+\([^)]*\)\s*$/, "").trim().toLowerCase()
    const matches = pool.filter((m) =>
      consultLabel(m).toLowerCase() === s ||
      String(m.provider ?? "").toLowerCase() === s ||
      String(m.model ?? "").toLowerCase() === s,
    )
    if (matches.length === 0) unknowns.push(String(raw))
    else for (const m of matches) {
      const key = consultLabel(m)
      if (!seen.has(key)) { seen.add(key); selected.push(m) }
    }
  }
  if (unknowns.length > 0) {
    return { models: null, error: `unknown consult model selector(s): ${unknowns.join(", ")} — choose from: ${pool.map(consultLabel).join(", ")}` }
  }
  return { models: selected, error: null }
}

/** Read-only tool injected into consultation children (via createAgent's tools).
 *  Lets the consultant pull the main agent's conversation history on demand —
 *  the failure trail is first-class evidence, not a retelling. */
export function makeMainHistoryTool(parentAgent) {
  return {
    name: "main_history",
    readonly: true,
    description:
      "Read the main agent's conversation history — what has been tried, the exact errors, recent context. " +
      "Use it to ground your analysis in the actual failure trail instead of guessing.\n" +
      "Parameters:\n" +
      "- limit: Number of recent messages to return (default 20, max 100)",
    parameters: {
      type: "object",
      properties: { limit: { type: "number", description: "Recent messages (default 20, max 100)" } },
    },
    async execute({ limit }) {
      const n = Math.min(Math.max(limit ?? 20, 1), 100)
      const h = parentAgent?.history ?? []
      const slice = h.slice(-n)
      if (slice.length === 0) return "(empty history)"
      const render = (m) => {
        let content
        if (typeof m.content === "string") content = m.content
        else if (Array.isArray(m.content)) {
          content = m.content.map((part) => {
            if (part?.type === "image_url" || part?.type === "image") return "[image omitted]"
            if (part?.type === "text") return part.text ?? ""
            return JSON.stringify(part)
          }).join("\n")
        } else content = m.content == null ? "" : JSON.stringify(m.content)
        const calls = Array.isArray(m.tool_calls)
          ? m.tool_calls.map((c) => `[tool: ${c.function?.name ?? c.name}(${String(c.function?.arguments ?? c.args ?? "").slice(0, 200)})]`).join("\n")
          : ""
        return `--- [${m.role}] ---\n${content}${calls ? "\n" + calls : ""}`
      }
      const BUDGET = 60_000            // per-consult token budget (tokens)
      let out = ""
      for (let i = slice.length - 1; i >= 0; i--) {
        const line = render(slice[i])
        if (out.length + line.length > BUDGET) {
          // A single message over the whole budget: truncate IT (it is the newest
          // and most relevant) instead of dropping everything with a misleading
          // "earlier messages trimmed" note. Older accumulation still trims.
          if (out === "") { out = line.slice(0, BUDGET) + "\n(… truncated — single message exceeded budget " + BUDGET + " chars)"; break }
          out = `(earlier messages trimmed — budget ${BUDGET} chars)\n\n` + out
          break
        }
        out = out ? line + "\n\n" + out : line
      }
      return out
    },
  }
}

/**
 * Full-session settle routing (R17 — AGENT-LOOP.md §25 D-R17a): a session whose
 * pending count reached 0 has no more replies coming — the session leaves
 * `_consultSessions` and, unless it was cancelled (consult_stop / turn-end
 * abort), moves into the pending single container (`_pendingAsyncResults` +role
 * "consult"——ASYNC-RESULT-CONTAINER.md D2——升格完整 entry：同 subagent/advisor/
 * escalate 的 `{id, role, report, done, ...}` 形态）whose report carries the full
 * per-model verdict text (composed here — all settle states are known,
 * partial/full failures annotated per model). The entry is injected at the next
 * run start (user turn or digest auto-turn — agent.mjs); the suspension driver
 * is woken (settle-event parity with the async pools) so an idle settle still
 * triggers the digestion round (T-R17j).
 * D3：公共收尾统一走 settleAsyncEntry 共享 helper（四族同机制）——consult 族参数：
 * 无池（会话池无条目——settle 即出池）、无 ctx（无 TUI 冻结事件——子块各自 settle 时
 * 已冻结）、无 onAccounting；helper 按 role "consult" 恒停靠 pending（非挂起期也停靠）。
 * Cancelled sessions produce no digest (T-R17c).
 */
function sessionSettled(agent, session) {
  agent?._consultSessions?.delete(String(session.id))
  if (session.stopped) return // cancelled — no digest (T-R17c)
  const entry = {
    id: String(session.id),
    role: "consult",
    report: composeConsultDigest(session),
    error: null, done: true, status: "done", cancelled: false,
    relayPrefix: null, startedAt: null, _settle: null, _settleSeq: 0,
  }
  settleAsyncEntry(agent, entry, { pool: null, ctx: null })
}

/** Digest body for a fully-settled session — title + one annotated line per
 *  reply (failed replies marked per-model — round2 #7; full text is injected
 *  verbatim and may be >64K → offloaded with a preview at injection). */
export function composeConsultDigest(session) {
  const replies = session.replies ?? []
  const parts = replies.map((r) =>
    r.failed
      ? `- [${r.model}] (failed): ${r.reply}`
      : `- [${r.model}]: ${r.reply}`)
  const counts = `${replies.length} of ${session.total} models replied (${session.failed} failed)`
  return `[System reminder: consultation #${session.id} finished — ${counts}]\n${parts.join("\n")}`
}

/**
 * Inject one settled consult family entry into the parent history as a
 * user-role reminder (run-start injection — agent.mjs; same shape rules as
 * injectAsyncResult: XML-escaped, >64K offloaded with preview + path). Consumed
 * = the caller splices the entry out of the pending single container
 * (_pendingAsyncResults——ASYNC-RESULT-CONTAINER.md D2——role 分发注入）。
 */
export async function injectConsultResult(agent, entry) {
  const full = String(entry?.report ?? "(no consultation result)")
  // §22 D-DG3（群 B 批 B5）：计入预算的 raw = 报告正文（标签行不计）——首行标签拆出；超限
  // 路径保留族标签行（与 VSC 镜像同形）；落盘内容 = raw（与其余三族同口径）。
  const at = full.indexOf("\n")
  const label = at === -1 ? "" : full.slice(0, at + 1)
  const raw = at === -1 ? full : full.slice(at + 1)
  const over = digestBudgetOver(agent, raw.length)
  const saved = over ? await persistOverflowReport(raw, { tag: `consult-${entry?.id ?? "session"}` }) : null
  const preview = saved ? `${label}${saved}` : await offloadToolResult(full, `consult-${entry?.id ?? "session"}`)
  pushReal(agent, {
    role: "user",
    content: escapeXml(preview),
  })
}

function settleChild(agent, session, id, label, ok, payload, emitDone) {
  if (ok) {
    session.received++
    session.replies.push({ model: label, reply: payload })
  } else if (session.stopped) {
    session.terminated = (session.terminated ?? 0) + 1
  } else {
    session.failed++
    session.replies.push({ model: label, reply: `(consultation failed: ${payload})`, failed: true })
  }
  session.pending--
  emitDone?.() // per-child TUI block freeze at settle (R17 — child's activity card is done)
  if (session.pending === 0) sessionSettled(agent, session)
}

async function runConsultChild(ctx, session, id, m, problem, ctrl) {
  const agent = ctx.agent
  const timeoutMs = agent?.config?.agent?.consultTimeoutMs ?? CONSULT_TIMEOUT_MS
  let timedOut = false
  const armWatchdog = () => {
    const t = setTimeout(() => {
      timedOut = true
      // §20.3 站点 #12 信号面（第 24 批）：watchdog 中止带 timeout reason
      try { ctrl.abort({ abortTrigger: "timeout", abortDetail: "consult-watchdog" }) } catch { /* already settled */ }
    }, timeoutMs)
    t.unref?.()
    return t
  }
  let watchdog = armWatchdog()
  const label = consultLabel(m)
  // LOGGING（LOGGING.md）：child:*（consult）——logSettle 在函数作用域声明（外层 catch
  // 覆盖 spawn 前失败路径）；spawn 事件在 relay 建立后发射（logArmed 翻转——provider/
  // 创建失败 = 从未启动，不落子事件、错误仅经 settleChild 进会话）。
  let childLogId = null
  let logT0 = 0
  let logArmed = false
  let logDone = false
  const logSettle = (kind, payload) => {
    if (!logArmed || logDone || !childLogId) return
    logDone = true
    const ms = Date.now() - logT0
    const base = { role: "consult", id: childLogId, ms }
    if (kind === "ok" || kind === "partial") logEvent("child:done", { ...base, kind })
    else logEvent("child:error", { ...base, err: errText(payload, 200) })
  }
  // R17: relay prefix assigned before the child runner arms — the per-child TUI
  // block freeze emits only when a block actually exists (relay established).
  let relayPrefix = null
  const settle = (ok, payload) => settleChild(agent, session, id, label, ok, payload, relayPrefix
    ? () => ctx.callbacks?.onToken?.(`${relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    : null)
  try {
    // Provider resolution: consultModels entries are { provider, model, effort? } — resolve
    // via the subagent's provider resolver ("provider:model" handles cross-provider picks).
    const provider = resolveChildProvider(agent, `${m.provider}:${m.model}`)
    if (!ensureChildApiKey(provider)) {
      // resolveChildProvider may still lack a key; fail loudly like the plugin precheck
      // (settleChild turns this message into a clear failed reply instead of a raw 401)
      throw new Error(`consult model ${label} has no API key — check providers[${m.provider}].apiKey in config.json`)
    }
    // Clamp the pool's effort to the model's reasoningEffortEnum — an out-of-enum
    // value makes provider/core throw on EVERY chat call (candidate dies on takeoff).
    // Symmetric with the escalate action (subagent action:"escalate"); 2026-08-16
    // a real consult died on qwen3.8-max effort "high" (enum is xhigh/medium/low).
    // Out-of-enum: DROP the effort entirely (the provider preset default may ALSO be
    // out-of-enum for this override model).
    clampEffort(provider, m.model, m.effort)

    // Read-only consultant: filter the parent tool set down to readonly tools + main_history.
    const allowed = readonlyToolNames(agent.tools ?? [])
    const tools = [
      ...(agent.tools ?? []).filter((t) => allowed.has(t.name)),
      makeMainHistoryTool(agent),
    ]

    const child = createAgent({
      provider,
      tools,
      config: agent.config,
      cwd: agent.cwd,
      memory: agent.memory,
      // No overlay: setup.mjs already selects CONSULT_BASE as the base prompt for
      // role "consult" (overlay + base would concatenate it twice).
      role: "consult",
    })
    // TUI-OOM-ROOTCAUSE §23.3.1：子代理人读线窗口（四处创建点同置）——consult 会话跨回合驻留，
    // 不置窗则 _fullHistory 仍无界（F-O1 覆盖 depth>0 全部创建点）
    child._historyWindow = RECORD_WINDOW_MESSAGES

    // Activity relay via the unified spawn-child pipeline (§7.2 D3): `consult#<subId>/`
    // prefix (same channel subagent uses — parallel consultants stay independent) +
    // onToolOutput passthrough so the consultant's tool output lands in its TUI block.
    relayPrefix = makeRelay(agent, "consult", ctx.callbacks?.onToken, provider.model ?? "")
    // LOGGING：arm（spawn 事件——relay 建立后；子内事件归属 _logId）
    childLogId = relayPrefix.slice(0, -1)
    child._logId = childLogId
    logT0 = Date.now()
    logArmed = true
    logEvent("child:spawn", { role: "consult", id: childLogId, kind: "consult" })
    const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})
    let declined = false // review #1: guard against double-settle when onDeclined fired

    // Turn-cap continue loop (TURN-CAP-CONTINUE.md) via runWithContinue (§7.2 D3): hitting
    // the cap asks the user via the SAME y/n panel the main agent uses — unlimited
    // continues, each with a fresh turn budget AND a re-armed wall-clock watchdog (a
    // continue is a fresh budget, the clock restarts too). Parallel consultants serialize
    // their prompts through a session-level queue. Declined / headless → failed reply
    // (partial diagnosis).
    const runner = ctx.runAgent ?? runAgent
    try {
      const result = await runWithContinue(
        (childAgent, input, cbs, opts) => runner(childAgent, input, cbs, opts),
        child, "# Problem\n" + problem,
        childCallbacks,
        { depth: 1, maxTurns: agent?.config?.agent?.consultTurns ?? CONSULT_TURNS, signal: ctrl.signal },
        {
          askContinue: (e) => {
            if (!ctx.onPermissionRequest) return Promise.resolve(false)
            const ask = () => ctx.onPermissionRequest("continue", { turns: e.turn, agent: label })
            session.continueQueue = (session.continueQueue ?? Promise.resolve()).then(ask, ask)
            return session.continueQueue.then((go) => {
              if (go) {
                clearTimeout(watchdog)
                timedOut = false // fresh budget → fresh clock
                watchdog = armWatchdog()
              }
              return go
            })
          },
          onDeclined: (e) => {
            declined = true
            settle(false, `turn cap reached (${e.turn} turns) — stopped, diagnosis may be partial`)
            logSettle("partial", null)
            return undefined
          },
        },
      )
      // Review #1 fix: onDeclined already settled this child as a failed reply —
      // settling again here would push a phantom empty success reply and decrement
      // `pending` twice (negative pending would re-enter the settle routing).
      if (!declined) {
        settle(true, String(result ?? ""))
        logSettle("ok", null)
      }
    } catch (e) {
      // Runner errors (incl. the watchdog's abort) settle as a failed reply — the
      // continue/declined paths are already handled inside runWithContinue.
      const note = timedOut ? `consultation timed out after ${Math.round(timeoutMs / 60000)}min (agent.consultTimeoutMs)` : deathLine(e, ctrl?.signal)
      settle(false, note)
      logSettle("error", note)
    }
  } catch (e) {
    // Errors BEFORE the runner (provider resolution, createAgent) or a throwing
    // continue-prompt settle as failed replies — the runner's own errors are already
    // handled inside the loop above. relayPrefix is null on these paths — no TUI
    // block was ever opened, so no freeze event is emitted.
    const line = deathLine(e, ctrl?.signal)
    settle(false, line)
    logSettle("error", line)
  } finally {
    clearTimeout(watchdog)
  }
}

/** Turn-end / session-end abort cleanup (R17 — call sites: the Ctrl+C abort
 *  branches of finalizeAgentTurn and the suspension driver). Consultation
 *  sessions are now cross-turn background work (like async subagents): a NORMAL
 *  turn end keeps them alive — this runs only when the user stops everything:
 *  every leftover session is marked stopped (its settles never reach the digest
 *  stream — T-R17c) and its controllers aborted. */
export function cleanupConsultSessions(agent) {
  for (const s of agent._consultSessions?.values() ?? []) {
    s.stopped = true
    for (const c of s.controllers ?? []) { try { c.abort({ abortTrigger: "stop", abortDetail: "consult-cleanup" }) } catch { /* already settled */ } }
  }
  agent._consultSessions?.clear()
}

export const consultStartTool = {
  name: "consult_start",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Start a parallel multi-model consultation (会诊) for a hard problem you are stuck on (repeated failures, no headway). " +
    "Call it directly when the user asks for 会诊 / consult — an explicit user request applies even if you are not 'stuck'. " +
    "Several configured models (agent.consultModels) analyze the same problem INDEPENDENTLY and in parallel. " +
    "Non-blocking: returns immediately with a consult id; the consultants keep running in the background across turns. " +
    "When EVERY model has replied (or failed), the full verdict text is delivered to you automatically — as a system " +
    "reminder at the next run start, or digested on its own while the session is idle — judge and adopt each opinion " +
    "yourself with your own tools (opinions are suggestions, not gates). To stop a session early (user changed their " +
    "mind / wants the tokens back), call consult_stop(id) — a stopped session delivers no digest.\n" +
    "Parameters:\n" +
    "- problem (required): a brief — the symptom, what you already tried (failure trail), and entry-point files. " +
    "Do NOT paste raw error logs; consultants pull the main session history themselves via their main_history tool.\n" +
    "- models (optional): subset of agent.consultModels to run — an array of \"provider:model\", bare provider, or bare model names (case-insensitive). Omit to run all.",
  parameters: {
    type: "object",
    properties: {
      problem: { type: "string", description: "Problem brief (symptom + failure trail + entry files)" },
      models: { type: "array", items: { type: "string" }, description: 'Optional subset of agent.consultModels to run (default: all). Each entry is "provider:model", a bare provider name, or a bare model name (case-insensitive).' },
    },
    required: ["problem"],
  },
  async execute({ problem, models }, ctx) {
    if (typeof problem !== "string" || !problem.trim()) return "Error: problem is required and must be a non-empty string"
    const agent = ctx.agent
    if (!agent) return "Error: consult requires an agent context"
    const pool = agent.config?.agent?.consultModels ?? []
    if (!Array.isArray(pool) || pool.length === 0)
      return "Consultation is not configured — add agent.consultModels ([{ provider, model }], up to 5) to ~/.thincoder/config.json"
    if (pool.length > 5) return `Error: consultModels supports at most 5 models (got ${pool.length})`

    // `models` (optional) narrows the pool to a subset; absent/empty → run the whole pool.
    const picked = selectConsultModels(pool, models)
    if (picked.error) return picked.error
    const run = picked.models

    agent._consultSessions ??= new Map()
    const id = String((agent._consultIdCounter = (agent._consultIdCounter ?? 0) + 1))
    const session = {
      id, controllers: [], replies: [], pending: 0,
      failed: 0, terminated: 0, stopped: false, received: 0, total: run.length,
      models: run.map(consultLabel),
    }
    agent._consultSessions.set(id, session)

    for (const m of run) {
      session.pending++
      const ctrl = new AbortController()
      session.controllers.push(ctrl)
      // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md D5——consult 补 _sessionSignal
      // 兜底：挂起会话内的 consult children 持会话 signal，digest 自身 Ctrl+C 不误伤）。
      const baseSignal = buildChildSignal(agent, ctx)
      if (baseSignal) {
        // §20.3 站点 #10（第 24 批）：hop 逐跳保 reason
        if (baseSignal.aborted) ctrl.abort(baseSignal.reason)
        else baseSignal.addEventListener("abort", () => ctrl.abort(baseSignal.reason), { once: true })
      }
      // Fire and forget — each child settles itself into the session; the session
      // routes to the pending single container when every child has settled (R17).
      runConsultChild(ctx, session, id, m, problem, ctrl)
    }
    return JSON.stringify({ id, models: session.models })
  },
}

export const consultStopTool = {
  name: "consult_stop",
  readonly: false,
  sideEffectExempt: true,
  description:
    "Cancel a still-running consultation session (会诊) — the user changed their mind, the problem resolved, or you want the tokens back. " +
    "Aborts every consultant that is still running; a stopped session delivers NO digest (R17 — its already-collected partial replies are dropped). " +
    "Sessions that finished on their own are no longer cancellable — their verdict text is delivered automatically.\n" +
    "Returns JSON {abandoned: <pending count>, cancelled: true} — or {error: \"unknown consult id\"} (already finished/cancelled).\n" +
    "Parameters:\n" +
    "- id (required): the consult id from consult_start",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "Consult id" },
    },
    required: ["id"],
  },
  async execute({ id }, ctx) {
    const s = ctx.agent?._consultSessions?.get(String(id))
    if (!s) return JSON.stringify({ error: "unknown consult id" })
    const abandoned = s.pending
    s.stopped = true
    // §20.3 站点 #11（第 24 批）：会话级停 = stop
    for (const c of s.controllers) { try { c.abort({ abortTrigger: "stop", abortDetail: "consult-stop" }) } catch { /* already settled */ } }
    return JSON.stringify({ abandoned, cancelled: true })
  },
}
