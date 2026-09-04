/**
 * agent/setup.mjs — pre-loop setup for runAgent: tool table, config, system prompt,
 * dual-line history, and startup context injection.
 * Extracted from agent.mjs (file-size split).
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import * as os from "node:os"
import { builtinTools, toOpenAISchema, readImageTool } from "../tools.mjs"
import {
  taskTool, recentChangesTool, subagentTool,
  planTool, goalTool, skillTool, verifyTool, timerTool,
  advisorTool, engTool, readHistoryTool, consultStartTool, consultCheckTool, consultStopTool,
} from "../agent-tools.mjs"
import { specForModel } from "../specs.mjs"
import { modeRoleField } from "../agent-tools/subagent.mjs"
import { injectContext } from "../context.mjs"
import { loadRaw, normalizeProxy, resolveProviders } from "../config-io.mjs"
import { loadEngineeringPrompt, pushReal } from "./run-helpers.mjs"
import { pushModeReminders, pushTimeReminder, pushInjections, appendImagePointer } from "./setup-reminders.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SYSTEM_PROMPT = readFileSync(join(__dirname, "..", "prompts", "system.md"), "utf8")
const DISCIPLINE_RULES = readFileSync(join(__dirname, "..", "prompts", "discipline.md"), "utf8")
const MAIN_OVERLAY = readFileSync(join(__dirname, "..", "prompts", "main.md"), "utf8")
let _EXPLORE, _CODER, _PLAN, _ENG_CODER, _ENG_MAIN, _ENG_SUB, _CONSULT_BASE
try { _EXPLORE = readFileSync(join(__dirname, "..", "prompts", "explore.md"), "utf8") } catch { _EXPLORE = "" }
try { _CODER = readFileSync(join(__dirname, "..", "prompts", "coder.md"), "utf8") } catch { _CODER = "" }
try { _PLAN = readFileSync(join(__dirname, "..", "prompts", "plan.md"), "utf8") } catch { _PLAN = "" }
try { _ENG_CODER = readFileSync(join(__dirname, "..", "prompts", "eng-coder.md"), "utf8") } catch { _ENG_CODER = "" }
try { _ENG_MAIN = readFileSync(join(__dirname, "..", "prompts", "engineering.md"), "utf8") } catch { _ENG_MAIN = "" }
try { _CONSULT_BASE = readFileSync(join(__dirname, "..", "prompts", "consult-base.md"), "utf8") } catch { _CONSULT_BASE = "" }
try { _ENG_SUB = readFileSync(join(__dirname, "..", "prompts", "engineering-sub.md"), "utf8") } catch { _ENG_SUB = "" }

/** AUTO mode reminder lives in setup-reminders.mjs (single source of truth — its
 *  pushModeReminders pushes it; agent.mjs imports it from there for the dedupe check). */

/**
 * Decorate a consult-related tool's description with the CURRENT configured candidate
 * pool (provider:model list). Without this the model cannot know which models a consult
 * start / subagent action:'escalate' call can pick from — it would hallucinate
 * provider:model names or never pass `model`. The tool table is assembled per-run from
 * loadRaw(), so the list stays fresh. Description-only: the tool object is cloned
 * shallowly, execute untouched. §19 (2026-09-03): applied to the depth-0 subagentTool
 * too — its escalate action picks from the same pool (the standalone escalate tool was
 * merged in as action:"escalate").
 */
function withPool(tool) {
  const models = loadRaw().agent?.consultModels ?? []
  const list = models.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")
  if (!list) return tool
  return {
    ...tool,
    description: tool.description + `\nCurrently configured consultants (pool for consult_start / subagent action:'escalate'): ${list}`,
  }
}

/**
 * §18 D-E3 (AGENT-LOOP.md): the eng-coder child's restricted subagent channel —
 * built when an eng-coder child (depth>0) toolset is assembled. Schema level:
 * role enum is explore-only, the async parameter is REMOVED (sync only), and the
 * action parameter is REMOVED (spawn-only — §19 round2 #3: escalate/check/status
 * are refused in-child) — the model-facing filters; the mechanical enforcement
 * lives in subagent.mjs execute → gateEngCoderSpawn (role/async) + the §19
 * restricted-variant action gate (schema enums are advisory, providers don't
 * enforce them).
 */
function engAuditSubagentTool() {
  const props = { ...subagentTool.parameters.properties }
  delete props.async // sync only — the eng-coder blocks on the audit report
  delete props.action // spawn-only — the audit channel has no check/status/escalate
  props.role = {
    type: "string",
    enum: ["explore"],
    description: "explore only — the eng-coder's internal spawn channel is reserved for read-only divergence audits (AGENT-LOOP.md §18 D-E3).",
  }
  return {
    ...subagentTool,
    name: "subagent",
    description:
      "Spawn a read-only `explore` sub-agent to AUDIT your delivery against the design (AGENT-LOOP.md §18 D-E2 ③): it compares the delivered code with the design for divergence — partially implemented acceptance criteria, silent simplifications, doc drift, changes outside the approved file list. BLOCKING ONLY — spawn-only (no action:'check'/'status'/'escalate', no async): the audit report decides your next protocol step. The audit task book is appended MECHANICALLY — your own spawn task (docs involved / acceptance criteria / file list) plus the files you actually touched; never hand the audit a self-written file list (a self-report could omit exactly the out-of-scope file it must catch).",
    parameters: { ...subagentTool.parameters, properties: props },
  }
}

export async function setupAgentRun({ provider, cwd, input, opts, depth, role, getAuto }) {
  const { mcpServers, skills, engState, engDesignReviewed, resume = false, planMode = false, autoTurn = false } = opts

  const agentTools = depth === 0
    ? [taskTool, recentChangesTool, readHistoryTool, // SESSION.md §9 D-S2: read_history is depth-0 ONLY — a subagent querying "the session" would mix its throwaway lines with the parent record (semantic confusion); readonly → planMode pass / no permission ask (T-S9)
      // §19 (2026-09-03): the subagent family is ONE resident tool — subagent_check and
      // the standalone escalate tool retired (check/status/escalate are action params).
      // The escalate action errors when the pool is empty (existing error semantics);
      // with a pool configured the tool description lists the current candidates
      // (withPool — escalate picks 'provider:model' from it), same as consult_start.
      ...(loadRaw().agent?.consultModels?.length ? [withPool(subagentTool)] : [subagentTool]),
      planTool, goalTool, skillTool, verifyTool, timerTool, advisorTool, engTool,
      // consult tools registered only when configured — an unconfigured model would otherwise
      // see the tool, call it, and eat an error turn (prompt-system review 2026-08-15).
      ...(loadRaw().agent?.consultModels?.length
        ? [withPool(consultStartTool), consultCheckTool, consultStopTool]
        : [])]
    : role === "eng-coder"
      ? [taskTool, recentChangesTool, planTool, timerTool, advisorTool, verifyTool,
         engAuditSubagentTool()] // §18 D-E3: the audit-only restricted subagent channel (explore + sync + spawn-only — schema level; the mechanical gates are subagent.mjs gateEngCoderSpawn + the §19 restricted-variant action gate)
    // Write-permission coder sub-agents: their system prompt names verify (system.md)
    // and advisor (discipline.md) — without them the escalate/coder hit "unknown tool"
    // and fell back to bash node --check / npm test to self-verify (2026-08-16 deepseek
    // escalate diagnosis). eng-coder already had both; plain coder was the missed branch.
    : role === "coder"
      ? [taskTool, recentChangesTool, verifyTool, advisorTool]
      : [taskTool, recentChangesTool] // read-only subagents get fewer meta-tools

  // MCP tools: idempotent connect + expand into NATIVE tools (CLI parity, MCP.md D1/D2).
  // Top level only; failures never block — each warning is injected as a reminder.
  let mcpTools = []
  const mcpWarnings = []
  if (depth === 0 && Array.isArray(mcpServers) && mcpServers.length > 0) {
    try {
      const { connectMcpServersExpanded } = await import("../mcp.mjs")
      const r = await connectMcpServersExpanded(mcpServers)
      mcpTools = r.tools
      mcpWarnings.push(...r.warnings)
    } catch { /* expansion failure is non-fatal — the model just lacks MCP tools this turn */ }
  }

  // Subagent role-based tool filtering: explore/plan/consult get read-only tools only.
  // `question` is excluded from ALL subagents (depth > 0) — it's an interactive main-agent
  // tool; a background subagent (parallel consultants especially) must never prompt the user.
  const isReadOnlyRole = depth > 0 && (role === "explore" || role === "plan" || role === "consult")
  const baseTools = (isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools)
    .filter((t) => depth === 0 || t.name !== "question")
  const tools = [
    ...baseTools,
    ...(specForModel(provider.model).multimodal ? [readImageTool] : []),
    ...agentTools,
    ...mcpTools,
    ...(opts.extraTools ?? []), // caller-injected tools (e.g. consult's main_history)
  ]
  // toolSchemas is built further down, after `engineering` is computed — the subagent
  // role enum is mode-dependent (see modeRoleField).
  const toolByName = new Map(tools.map((t) => [t.name, t]))

  // Runtime config: advisor settings live in the shared config.json (CLI agent.advisor),
  // engineering state is per-session (persisted by chat-panel alongside the history lines).
  let advisorCfg = { guard: false }
  let cfgEngineering = false
  let cfgVerifyGuard = false
  let cfgCompactThreshold = null
  let cfgProxy = undefined
  let cfgShell = null
  let cfgSubagentModel = null
  let cfgSubagentModels = null
  let cfgSubagentTurns = 100
  let cfgMaxTurns = 200
  let cfgConsultModels = []
  let cfgConsultTurns = 40
  let cfgConsultTimeoutMs = 600_000
  let cfgProviders = []
  let cfgWebsearch = { provider: "tavily", apiKey: "" } // structured search; empty key → Bing fallback
  try {
    const raw = loadRaw()
    advisorCfg = raw.agent?.advisor ?? { guard: false }
    cfgEngineering = raw.agent?.engineering ?? false
    cfgVerifyGuard = raw.agent?.verifyGuard === true // opt-in, CLI parity
    cfgCompactThreshold = raw.agent?.compactThreshold ?? null // null = auto from model context
    cfgProxy = normalizeProxy(raw.proxy) // web tools consult agent.config.proxy (resolveWebProxy)
    cfgShell = typeof raw.shell === "string" && raw.shell ? raw.shell : null // bash tool shell override (CLI parity)
    cfgSubagentModel = raw.agent?.subagentModel ?? null // default subagent model override (CLI parity)
    cfgSubagentModels = raw.agent?.subagentModels ?? {} // per-type subagent model overrides (CLI parity)
    cfgSubagentTurns = raw.agent?.subagentTurns ?? 100 // subagent turn cap (CLI parity)
    cfgMaxTurns = raw.agent?.maxTurns ?? 200
    cfgConsultModels = raw.agent?.consultModels ?? [] // consultation model list (CONSULTATION.md)
    cfgConsultTurns = raw.agent?.consultTurns ?? 40 // consultation turn budget (panel-exposed)
    cfgConsultTimeoutMs = raw.agent?.consultTimeoutMs ?? 600_000 // consultation wall-clock watchdog (panel-exposed)
    cfgProviders = resolveProviders().providers // for subagent model overrides
    cfgWebsearch = raw.websearch ?? { provider: "tavily", apiKey: "" }
  } catch { /* config unreadable — defaults */ }
  // Session-level engineering (2026-08-29): `engState.enabled` comes from the panel's bound
  // session slot (panel-chat.mjs). `null` = the session NEVER set the flag (legacy slot or
  // fresh session) → fall back to the config.json CLI-compat mirror; an explicit true/false
  // always wins over config (this is what keeps an external config flip from hijacking the
  // session's mode — the reported cross-end pollution bug).
  const engineering = engState?.enabled ?? cfgEngineering
  // Advisor guard is ALSO session-level (2026-08-29): the slot value wins when the session
  // has ever set the guard (panel toggle / eng tool); `null` = never set → config fallback
  // (legacy slots keep their old behavior). Other advisor keys (provider/model/thinking…)
  // stay config-scoped — only guard flipped to session authority.
  advisorCfg = { ...advisorCfg, guard: engState?.advisorGuard ?? advisorCfg.guard ?? false }

  // Tool schemas are built AFTER `engineering` is known: the subagent role enum is
  // mode-dependent (CLI setup.mjs parity) — normal mode must not advertise 'eng-coder'
  // as a legal role. Schema filtering is the first line of defense; the runtime
  // mutual-exclusion throws in subagentTool.execute stay as the hard gate.
  const toolSchemas = tools.map((t) => {
    if (depth === 0 && t.name === "subagent") {
      const { role: roleField, suffix } = modeRoleField(engineering)
      const schema = toOpenAISchema(t)
      schema.function.description = t.description + (suffix ? "\n" + suffix : "")
      schema.function.parameters = {
        ...t.parameters,
        properties: { ...t.parameters.properties, role: roleField },
      }
      return schema
    }
    return toOpenAISchema(t)
  })

  const agent = {
    _tasks: [], _touchedFiles: [], _planMode: planMode,
    _goal: null, _provider: provider,
    _verifiedThisRun: false, _pendingTimers: [],
    // Compaction bookkeeping (CLI parity): measured baseline + failure counter + empty-response budget.
    // All per-run — the agent object is rebuilt on every runAgent call, so they reset per user message.
    _lastPromptTokens: null, _usageAtLen: null,
    _compressFailures: 0, _emptyRetries: 0,
    // Advisor / engineering bookkeeping (CLI parity). _advisorRound always starts at 0 — the
    // convergence budget is per-run (runAgent resets it in the CLI), never persisted.
    _role: role,
    _advisorRound: 0,
    _advisorSession: null,
    // §18 D-E2 ③: the eng-coder's own spawn task — verbatim source of the audit
    // task book its internal explore-audit spawns get (subagent.mjs augmentation).
    _engTaskInput: opts.engTaskInput ?? null,
    _lastAdvisorOutput: null, // full review output from the most recent advisor call (convergence rounds inject it verbatim)
    _engDesignToken: engState?.engDesignToken ?? null,
    // Multi-design slots restored from the slot's {designId: token} object (2026-09-01 audit #1);
    // null/absent → no Map (fresh state — never resurrect slots the writer did not have).
    _engDesignTokens: (engState?.engDesignTokens && typeof engState.engDesignTokens === "object")
      ? new Map(Object.entries(engState.engDesignTokens))
      : null,
    _engDesignReviewed: engDesignReviewed === true, // eng-coder children arrive pre-authorized
    _calledAdvisorThisRun: false, _mutatedThisRun: false,
    _lastEngState: false, // seeded false: a resumed engineering session re-notifies on turn 1 (CLI parity)
    _pendingReminders: [],
    config: {
      advisor: advisorCfg,
      agent: { engineering, subagentModel: cfgSubagentModel, subagentModels: cfgSubagentModels, subagentTurns: cfgSubagentTurns, maxTurns: cfgMaxTurns, verifyGuard: cfgVerifyGuard, compactThreshold: cfgCompactThreshold, consultModels: cfgConsultModels, consultTurns: cfgConsultTurns, consultTimeoutMs: cfgConsultTimeoutMs },
      proxy: cfgProxy, shell: cfgShell, providersList: cfgProviders,
      websearch: cfgWebsearch,
    },
  }

  // Live state channel for the parent (eng-coder mutation merge) — the caller gets a
  // reference to the same array, so it stays current as the child touches files.
  if (opts.stateSink) {
    opts.stateSink.touchedFiles = agent._touchedFiles
    // §19.5.6 D-SF1 (AGENT-LOOP.md): the agent OBJECT reference (not the array) — the
    // pool entry's status summary re-reads childAgent._touchedFiles live; a bare array
    // reference goes stale when a resume re-runs setup (new per-run agent). Each
    // runAgent re-assigns it, so entry.childAgent always points at the CURRENT run.
    opts.stateSink.agent = agent
  }
  // Session persistence channel for the eng tool (2026-08-29): `engPersist: { cwd, slot }`
  // rides opts → agent; eng(enter/exit) persists the flipped flag into the session slot
  // (slot authority) in addition to the config.json mirror. Top level only — subagents
  // must never write the parent's slot (they get no engPersist).
  if (opts.engPersist) agent._engPersist = opts.engPersist
  const platform = { win32: "Windows", darwin: "macOS", linux: "Linux" }[os.platform()] ?? os.platform()

  // System prompt — engineering mode replaces the standard discipline block with
  // engineering.md (or engineering-sub.md for eng-coder) + project METHODOLOGY.md (CLI parity).
  const engPromptActive = engineering && (depth === 0 || role === "eng-coder")
  const engResult = engPromptActive ? loadEngineeringPrompt(cwd, role) : null
  // consult children: a lean, purpose-built base prompt (consult-base.md) — NOT the full
  // main-agent system.md (whose coding-agent persona, checklist/task/verify workflows, and
  // tool references conflict with a read-only diagnosis and cost tokens every turn).
  let base = role === "consult"
    ? _CONSULT_BASE
    : engPromptActive
      ? (engResult.prompt ? `${SYSTEM_PROMPT}\n\n${engResult.prompt}` : SYSTEM_PROMPT)
      : `${SYSTEM_PROMPT}\n\n${DISCIPLINE_RULES}`
  if (depth > 0 && role) {
    const overlay = { explore: _EXPLORE, coder: _CODER, plan: _PLAN, "eng-coder": _ENG_CODER }[role] || ""
    base = overlay ? `${overlay}\n\n${base}` : base
  }
  // Time injection deliberately does NOT live here: system prompts must be byte-identical
  // across runs (provider prefix caches). The time rides a transient user reminder pushed
  // at each turn start (below) — variable content belongs in the history, not the cached prefix.
  const systemPrompt = `${base}${depth === 0 && !engPromptActive ? `\n\n${MAIN_OVERLAY}` : ""}\n\nOS: ${platform}. Working directory: ${cwd}.`

  // Dual-line history. Top-level runs use PERSISTENT lines passed in via opts (survive across calls,
  // written to the session file by chat-panel): history = machine context (compaction shrinks it),
  // fullHistory = never-compacted human-readable record. Subagents always use throwaway local lines.
  // Old sessions / first turn: seed the machine line from the human line (correctness over tokens).
  const fullHistory = depth === 0 ? (opts.fullHistory ?? (opts.fullHistory = [])) : []
  const history = depth === 0
    ? (opts.history ?? (opts.history = [...fullHistory]))
    // Subagents default to throwaway local history, but a caller that wants to
    // CONTINUE a turn-cap-limited child (escalate resume) passes the previous run's
    // history back in — the conversation survives across runAgent calls.
    : (opts.history ?? [])

  // The advisor helpers (ported from the CLI) reach for agent.cwd and agent.history —
  // keep those aliases live so the ported modules work unchanged.
  agent.cwd = cwd
  agent.history = history
  // read_history (SESSION.md §9 D-S2): the tool reads the HUMAN line via agent._fullHistory —
  // attach at depth 0 only (subagent throwaway lines are never reachable, the tool is not
  // registered for them anyway).
  if (depth === 0) agent._fullHistory = fullHistory

  // Live history reference for the parent: same array the loop appends to — a caller
  // that catches ContinueError can hand it back via opts.history to resume the child
  // conversation (escalate turn-cap continue).
  if (opts.stateSink) opts.stateSink.history = history

  // ─── Context injection (top-level only, fresh machine line only) ────
  // These machine-only injections are transient context; a persistent machine line already carries
  // them from prior turns, so only inject when starting a brand-new (empty) machine line.
  const freshMachineLine = history.length === 0
  pushModeReminders(history, { depth, freshMachineLine, getAuto, role, engPromptActive, engResult })

  // resume (interrupt continuation): the input is already in history — pushing it
  // again would duplicate the user message (CLI setup.mjs resume parity).
  // §17 D-S6 autoTurn (digest): system-driven turn with NO user input — same
  // no-push semantic, but as a fresh run (per-run state resets like a normal turn;
  // resume additionally preserves guard state for ContinueError continuations).
  // The pushed object is captured BY REFERENCE: the paste-image pointer below
  // appends to THIS message (never history.at(-1) — the transient time reminder
  // pushed afterwards is last, and mutating it re-sent the image pointer every run).
  let userMsg = null
  if (!resume && !autoTurn) {
    userMsg = { role: "user", content: input }
    pushReal(history, fullHistory, userMsg)
  }

  pushTimeReminder(history)

  pushInjections(history, opts.injections)

  // Pasted images (GitHub thincoder#3, Plan B): pointer appended to the REAL user
  // message by reference — see setup-reminders.mjs for the full contract.
  appendImagePointer(userMsg, opts.images, provider.model, { depth })

  return { agent, history, fullHistory, toolByName, toolSchemas, cfgVerifyGuard, cfgCompactThreshold, systemPrompt }
}
