/**
 * subagent-escalate.mjs — the §19 action:"escalate" engine (飞刀).
 * Split out of subagent-async.mjs (2026-09-03 advisor round — the 500-line hard cap:
 * subagent-async.mjs grew past it with the §19 escalate merge + §19.5 control
 * surface; the escalate engine is the self-contained unit moved out VERBATIM —
 * zero behavior change).
 *
 * §19 (AGENT-LOOP.md §19 D-M4/F7): the retired escalate.mjs execution verbatim —
 * consultModels 池选强模型 + WRITE 干活 + 术后报告. Constraints preserved in full:
 * depth-0 only / engineering-mode disabled / empty-pool error / model-pick
 * validation / the `sub:escalate <label> #N` relay prefix unchanged (block routing
 * zero-change). Called from subagent.mjs execute's action dispatch (action:"escalate").
 *
 * Module-graph hygiene: imports one-way from subagent-async.mjs
 * (mergeChildMutations + nextSubagentId — shared pool/id machinery); subagent-async
 * never imports this module (no cycle).
 */
import { isAbsolute, relative } from "node:path"
import { buildProvider } from "../extension/presets.mjs"
import { specForModel } from "../specs.mjs"
import { mergeChildMutations, nextSubagentId } from "./subagent-async.mjs"
import { logEvent, errText } from "../log.mjs"

// ─── §19 escalate 动作（AGENT-LOOP.md §19 D-M4/F7——escalate.mjs 退役，执行逻辑 verbatim 并入）───

const escalateLabel = (m) => `${m.provider}:${m.model}`

/**
 * §19 action:'escalate' handler — the retired escalate.mjs execution VERBATIM
 * (飞刀——consultModels 池选强模型 + WRITE 干活 + 术后报告；约束全保留：depth-0 only /
 * 工程模式禁用 / 池空 error / 模型选择校验 / relay 前缀 `sub:escalate <label> #N` 不变
 * ——TUI 区块路由零改动）。调用面：subagent.mjs execute 的 action 分流。
 */
export async function escalateAction({ task, model }, ctx) {
  const parent = ctx.agent
  if (!task || typeof task !== "string") {
    return "Error: escalate requires a task description with acceptance criteria"
  }
  // Depth guard: an escalate must not fly in another escalate (ESCALATE.md §1.3 US-F5)
  if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
  // Engineering-mode backdoor guard (three-way review 2026-08-16): an escalate IS a
  // coder sub-agent — subagent.mjs forbids role='coder' in engineering mode, and an
  // unconditional coder escalate would bypass the design-token discipline. Fail closed
  // and point at the engineering path, same as subagent does.
  if (parent?.config?.agent?.engineering) {
    return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
  }
  // All consult models are escalate candidates (decision 2026-08-16: the 飞刀 hook checkbox
  // was removed — every configured consultant can fly in; fewer knobs, less mental load).
  const pool = parent?.config?.agent?.consultModels ?? []
  if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

  // Model-pick tolerance: withPool lists candidates as "provider:model (effort)" —
  // a model that copies the listing verbatim must still match (strip the suffix).
  const wanted = typeof model === "string" ? model.replace(/\s+\([^)]*\)\s*$/, "").trim() : model
  const pick = wanted
    ? pool.find((m) => escalateLabel(m) === wanted)
    : pool[0]
  if (!pick) {
    return `Error: "${model}" is not a consult candidate. Available: ${pool.map(escalateLabel).join(", ")}`
  }

  const build = ctx.buildProvider ?? buildProvider // test-injectable (consult.mjs parity)
  const provider = await build(pick.provider)
  if (!provider) return `Error: provider "${pick.provider}" not configured`
  // Key precheck: fail BEFORE the child spawns, not at its first chat call — an
  // auth failure there would surface as an escalate crash, misdiagnosing the cause.
  if (!provider.apiKey?.trim()) {
    return `Error: provider "${pick.provider}" has no API key — set it in Settings before flying it in`
  }
  let effortNote = ""
  const withEffort = pick.effort
    ? (() => {
        // Clamp the pool's effort to the model's reasoningEffortEnum — an out-of-enum
        // value makes provider/core throw on EVERY chat call (candidate dies on takeoff).
        // Out-of-enum: DROP the effort entirely (the preset default may ALSO be out-of-enum
        // for this override model).
        const enumList = specForModel(pick.model).reasoningEffortEnum
        if (enumList && !enumList.includes(pick.effort)) {
          effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
          const { reasoningEffort: _drop, ...rest } = provider
          return rest
        }
        return { ...provider, reasoningEffort: pick.effort }
      })()
    : provider
  const agentMod = await import("../agent.mjs")
  const runner = ctx.runAgent ?? agentMod.runAgent

  // advisor fix #1：与 spawn 共用跨 run 单调的 id 分配器（子代理 id 空间一致——escalate
  // 的 onSubagent/panel 事件与 async 池不冲突）。
  const subId = nextSubagentId(parent)
  const tag = escalateLabel(pick)
  ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "started", startedAt: Date.now(), model: tag })
  // LOGGING（LOGGING.md——CLI parity）：child:*（escalate——spawn 于校验通过后；
  // 返回形态分流：ok / partial（turn-cap 拒绝）/ error-string——AbortError（用户停）
  // 不上抛错误事件）
  const escId = `escalate#${subId}`
  const escT0 = Date.now()
  logEvent("child:spawn", { role: "escalate", id: escId, kind: "escalate" })
  let escDone = false
  const escSettle = (kind, payload) => {
    if (escDone) return
    escDone = true
    const ms = Date.now() - escT0
    if (kind === "error") logEvent("child:error", { role: "escalate", id: escId, ms, err: errText(payload, 200) })
    else logEvent("child:done", { role: "escalate", id: escId, ms, kind: kind === "partial" ? "partial" : "ok" })
  }

  let output = ""
  const sink = {}
  const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:escalate ${tag} #${subId}`, chunk)

  // No wall-clock watchdog — turn cap only (CLI parity, 2026-08-16): a fixed wall-clock
  // aborts NORMAL-but-slow surgery (two max-effort consultants hit a 10min wall just
  // READING files). Hang protection = FETCH_TIMEOUT (per LLM call) + user Stop (signal
  // propagates directly). Turn-cap continue reuses the panel's onQuestion channel —
  // the SAME y/n card the main agent's question tool uses; continues are UNLIMITED
  // (each gives a fresh budget; Stop is always an option at the prompt).
  const runOpts = (resume) => ({
    depth: 1, role: "coder", // full write path: permission gate, recent-changes tracking
    streamOutput: true, // exempt from the agent.mjs onToken depth gate (consult role parity)
    maxTurns: parent.config?.agent?.subagentTurns ?? 100,
    stateSink: sink,
    resume,
    // Resume hands the child its own conversation back — subagent history is otherwise
    // throwaway per runAgent call (agent.mjs). sink.history is the LIVE array reference.
    ...(resume ? { history: sink.history } : {}),
  })
  for (let resumes = 0; ; resumes++) {
    try {
      const report = await runner({ ...withEffort, model: pick.model }, ctx.cwd, task, {
        // Full reasoning + output stream (consult-UI parity): a long surgery is silent
        // without it — the panel shows WHAT the expert is thinking, not just tool calls.
        onToken: (t) => { output += t; panel({ kind: "text", text: String(t ?? "") }) },
        onReasoning: (r) => panel({ kind: "think", text: String(r ?? "") }),
        onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
        onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
        onComplete: () => {},
        onQuestion: ctx.callbacks?.onQuestion ?? null,
      }, ctx.signal ?? null, true, runOpts(resumes > 0))
      // Escalate mutations are the parent's mutations: verify/advisor guards must see them
      mergeChildMutations(parent, sink)
      ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "done", model: tag })
      escSettle("ok")
      return `escalate (${tag})${effortNote} post-op report:\n${report || output.slice(0, 4000)}${touchedFilesNote(sink, ctx.cwd)}`
    } catch (e) {
      // Even a failed surgery may have written files — merge whatever the child touched.
      mergeChildMutations(parent, sink)
      const msg = e?.message ?? String(e)
      // User Stop must propagate (execute-tools.mjs rethrows AbortError — swallowing
      // it keeps the parent running after the user asked to stop).
      if (ctx.signal?.aborted || e?.name === "AbortError") {
        ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "error", error: msg, model: tag })
        throw e
      }
      // Turn-cap exhaustion is not a crash: offer to continue from the current context
      // (main-agent panel-chat parity — "reached N turns. Continue?"), resuming with
      // resume:true + the child's own history. No onQuestion (headless) or declined →
      // partial-work return. Unlimited continues — the user can Stop at any prompt.
      if (e instanceof agentMod.ContinueError) {
        if (ctx.callbacks?.onQuestion) {
          const go = await ctx.callbacks.onQuestion(
            `飞刀 ${tag} reached ${e.turns} turns (limit). Continue from here?`,
            ["Continue", "Stop"],
          )
          if (go === "Continue") continue
        }
        escSettle("partial")
        return `escalate (${tag}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}${touchedFilesNote(sink, ctx.cwd)}`
      }
      escSettle("error", msg)
      ctx.callbacks?.onSubagent?.({ id: subId, role: "escalate", status: "error", error: msg, model: tag })
      return `escalate (${tag}) error: ${msg}\nPartial output: ${output.slice(0, 2000)}${touchedFilesNote(sink, ctx.cwd)}`
    }
  }
}

/** Relative touched-file list appended to every escalate return (sink paths are absolute). */
function touchedFilesNote(sink, cwd) {
  const touched = sink?.touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}
