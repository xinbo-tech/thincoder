/**
 * agent/dispatch.mjs — two-phase tool call execution
 */
import { offloadToolResult, FILE_MUTATORS } from "./helpers.mjs"
import { runHooks } from "../hooks.mjs"
import { snapshotForUndo } from "../tui/cmd-undo.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const ERRORS_DIR = join(homedir(), ".thincoder", "tool-errors")

/**
 * Persist a tool error to ~/.thincoder/tool-errors/YYYY-MM-DD/HHmmss-toolName.log
 * Only called for actual execution failures and malformed invocations.
 * Skipped for intentional denials (plan mode, user reject).
 */
function logToolError(toolName, args, error) {
  try {
    const now = new Date()
    const ymd = now.toISOString().slice(0, 10)
    const ts = now.toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "-")
    const dir = join(ERRORS_DIR, ymd)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const file = join(dir, `${ts}-${toolName.replace(/[/\\]/g, "_")}.log`)
    const entry = [
      `time: ${now.toISOString()}`,
      `tool: ${toolName}`,
      `args: ${JSON.stringify(args, null, 2)}`,
      `error: ${error?.message ?? String(error)}`,
      error?.stack ? `stack:\n${error.stack}` : "",
    ].filter(Boolean).join("\n") + "\n"
    writeFileSync(file, entry, "utf8")
  } catch {
    // Log failure itself must not crash the agent
  }
}

/**
 * Two-phase execution:
 * Phase 1 (serial): parse args one by one + planMode check + permission confirmation (side-effecting tools)
 * Phase 2 (order-preserving): strictly preserve model call order — consecutive readonly/parallel tools run as concurrent batches,
 * side-effecting tools run serially in their original position (if a batch writes-then-reads the same file, the read must see the post-write content).
 * Returns a results array in call order (each entry has an ok flag indicating success/failure).
 */
export async function executeToolCalls(agent, toolByName, toolCalls, callbacks, depth = 0, signal) {
  // ---- Phase 1: serial preparation ----
  const prepared = []
  for (const toolCall of toolCalls) {
    const tool = toolByName.get(toolCall.name)
    let args
    try {
      args = JSON.parse(toolCall.arguments || "{}")
    } catch {
      logToolError(toolCall.name, { arguments: toolCall.arguments }, new Error("Invalid JSON arguments"))
      prepared.push({ toolCall, tool: null, error: `Invalid tool arguments JSON: ${toolCall.arguments}` })
      continue
    }

    if (!tool) {
      logToolError(toolCall.name, {}, new Error(`Unknown tool: ${toolCall.name}`))
      prepared.push({ toolCall, tool: null, error: `Unknown tool: ${toolCall.name}` })
      continue
    }

    if (agent.planMode && !tool.readonly) {
      prepared.push({ toolCall, tool, denied: true, reason: "plan mode" })
      continue
    }

    // Engineering coder hard gate: no file modification before the design review passed.
    // The design review is the eng-coder's mandatory pre-coding gate — advisor(type="design")
    // must run (and be accepted) before the first write/edit/apply_patch/hashline_edit/insert_after/delete.
    if (agent._role === "eng-coder" && agent.config?.agent?.engineering
        && !agent._engDesignReviewed && FILE_MUTATORS.has(toolCall.name)) {
      prepared.push({
        toolCall, tool, denied: true,
        reason: "engineering design gate",
        hint: "Call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent.",
      })
      continue
    }

    // Engineering mode PARENT gate: the parent agent must not touch code files
    // before the design review passed. Signaled by _engDesignToken — set on
    // design-review approval, survives across turns (_engDesignReviewed is
    // eng-coder-only and reset per run). Exemptions cover ONLY design artifacts
    // (docs/** and root-level docs like METHODOLOGY.md/README.md/AGENTS.md/
    // LICENSE) — writing them IS the design/methodology step. Everything under
    // src/ (incl. src/prompts/*.md) is product code, not documentation, and
    // needs a design token. Mechanically blocks "talk then code".
    if (agent.config?.agent?.engineering && depth === 0 && !agent._engDesignToken
        && FILE_MUTATORS.has(toolCall.name)) {
      const paths = tool.touchedPaths ? tool.touchedPaths(args) : [args.path]
      // Unknown/missing paths (non-string, e.g. no path argument) are treated
      // as code — cannot tell what they touch, so block conservatively.
      const touchesCode = paths.some((p) => typeof p !== "string" || /^src[\\/]/.test(p) || !isDocFile(p))
      if (touchesCode) {
        prepared.push({
          toolCall, tool, denied: true,
          reason: "engineering design gate",
          hint: "Engineering mode: write the design document in docs/ first, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.",
        })
        continue
      }
    }

    if (!tool.readonly) {
      // autoApprove short-circuit: skip prompt when agent is already marked for auto-approval
      const allowed = agent.autoApprove
        ? true
        : callbacks.onPermissionRequest
          ? await (async () => {
              // D2 (AGENT-LOOP.md §7.2): announce the wait BEFORE prompting — the TUI
              // subagent block header flips to "等待审批" so a waiting child is visibly
              // different from a stalled one. Depth>0 only (the parent TUI shows its own
              // permission panel). turn n/max = the child's live turn counters.
              if (depth > 0) {
                callbacks.onToken?.(`⟦ev⟧approval\x1e${agent._currentTurn ?? 0}\x1e${agent._maxTurns ?? 0}\x1eapproval\x1e${String(toolCall.name).slice(0, 40)}`)
              }
              return await callbacks.onPermissionRequest(toolCall.name, args)
            })()
          : false
      if (!allowed) {
        prepared.push({ toolCall, tool, denied: true, reason: callbacks.onPermissionRequest ? "denied by user" : "no permission handler" })
        continue
      }
    }

    // PreToolUse hooks: allow user scripts to gate tool execution
    if (!(await runHooks("PreToolUse", { agent, toolName: toolCall.name, toolArgs: args }))) {
      prepared.push({ toolCall, tool, denied: true, reason: "blocked by PreToolUse hook" })
      continue
    }

    // Panel area abolished — all tools now stream inline via onToolOutput.

    callbacks.onToolCall?.(toolCall.name, args, toolCall.id)

    prepared.push({ toolCall, tool, args })
  }

  // ---- Phase 2: order-preserving execution ----
  const runOne = async (item) => {
    if (item.error) return { ...item, result: `Error: ${item.error}`, ok: false }
    if (item.denied) {
      const reason = item.reason === "plan mode"
        ? "Error: plan mode is active — only read-only tools are allowed. Exit plan mode first."
        : item.reason === "engineering design gate"
          ? `Error: design review required before any file modification. ${item.hint}`
          : item.reason === "denied by user"
          ? "Error: permission denied by user"
          : item.reason === "blocked by PreToolUse hook"
            ? "Error: blocked by PreToolUse hook"
            : "Error: no permission handler configured — this tool requires user approval but the current context doesn't support interaction (e.g. subagent or non-TUI mode)"
      return { ...item, result: reason, ok: false }
    }
    try {
      // Snapshot for undo before side-effect tools (setupOutputPanel already fired in Phase 1)
      if (!item.tool?.readonly && item.args) {
        snapshotForUndo(agent, item.toolCall.name, item.args, agent.cwd)
      }
      // M2 ACP: route fs tools through the client (IDE buffer / diff review).
      // toolRouter returns { handled: true, result } to short-circuit execution.
      if (callbacks.toolRouter) {
        const routed = await callbacks.toolRouter(item.toolCall.name, item.args)
        if (routed?.handled) {
          callbacks.onToolResult?.(item.toolCall.name, routed.result, item.toolCall.id)
          return { ...item, result: routed.result, ok: true }
        }
      }
      const rawResult = await item.tool.execute(item.args, {
        cwd: agent.cwd,
        agent,
        depth,
        signal,
        callbacks,
        onOutput: (chunk) => callbacks.onToolOutput?.(item.toolCall.name, chunk, item.toolCall.id),
        onQuestion: callbacks.onQuestion,
        onPermissionRequest: callbacks.onPermissionRequest,
      })
      if (rawResult === undefined) throw new Error(`Tool "${item.toolCall.name}" returned undefined — all tools must return a string value`)
      const raw = String(rawResult)
      const result = item.toolCall.name === "read_image" ? raw : await offloadToolResult(raw, item.toolCall.id)
      callbacks.onToolResult?.(item.toolCall.name, result, item.toolCall.id)
      // PostToolUse hooks: fire-and-forget (result not awaited on hook failure)
      runHooks("PostToolUse", { agent, toolName: item.toolCall.name, toolArgs: item.args, result: raw }).catch(() => {})
      return { ...item, result, ok: true }
    } catch (error) {
      // Persist to ~/.thincoder/tool-errors/ for post-mortem; only pass message to the model (stack traces confuse LLMs and may leak paths)
      logToolError(item.toolCall.name, item.args, error)
      // User interrupt (Ctrl+C / Ctrl+I) must propagate, not become a tool error:
      // swallowing it here would make the parent keep looping while the user
      // asked to stop — worst case with subagents, where the child runs its
      // whole turn budget and the interrupt appears to do nothing.
      if (signal?.aborted) throw error
      runHooks("PostToolUseFailure", { agent, toolName: item.toolCall.name, toolArgs: item.args, error }).catch(() => {})
      // Build contextual error: tool name + key args so the model can reason about what went wrong
      const ctxParts = []
      if (item.args.path) ctxParts.push(`path=${item.args.path}`)
      if (item.args.pattern) ctxParts.push(`pattern=${item.args.pattern}`)
      if (item.args.command) ctxParts.push(`cmd=${item.args.command.slice(0, 80)}`)
      const ctx = ctxParts.length > 0 ? ` [${ctxParts.join(", ")}]` : ""
      return { ...item, result: `Error: ${error.message}${ctx}`, ok: false }
    }
  }

  const results = []
  let batch = []
  const flush = async () => {
    if (batch.length === 0) return
    results.push(...await Promise.all(batch.map(runOne)))
    batch = []
  }
  for (const item of prepared) {
    if (item.tool && !item.tool.readonly && !item.tool.parallel) {
      await flush()
      results.push(await runOne(item))
    } else {
      batch.push(item)
    }
  }
  await flush()
  return results
}
