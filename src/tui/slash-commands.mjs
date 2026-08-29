/**
 * slash-commands.mjs — slash command definitions, dispatch, Tab completion.
 * Each subcommand's implementation lives in its own cmd-*.mjs file; this file only does dispatch.
 *
 * ctx object is injected by index.mjs and forwarded to each handler:
 *   { agent, state, distillOpts, pushLine, pushLabel, render,
 *     showPicker, closePicker, openModelPicker, setProviderKey, runDistill,
 *     persistRaw, syncProviderField, maskKey, exit, SLASH_COMMANDS }
 */

import { C } from "./ansi.mjs"
import { specForModel } from "../config.mjs"
import { handleClearCommand } from "./cmd-clear.mjs"
import { handleNewCommand } from "./cmd-new.mjs"
import { handleExitCommand } from "./cmd-exit.mjs"
import { handleSessionCommand, handleRenameCommand } from "./cmd-session.mjs"
import { handleReindexCommand } from "./cmd-reindex.mjs"
import { handleInitCommand } from "./cmd-init.mjs"
import { handleRestoreCommand } from "./cmd-restore.mjs"
import { handlePlanCommand } from "./cmd-plan.mjs"
import { handleGoalCommand } from "./cmd-goal.mjs"
import { handleSkillsCommand } from "./cmd-skills.mjs"
import { handleMcpCommand } from "./cmd-mcp.mjs"
import { handleAutoCommand } from "./cmd-auto.mjs"
import { handleAdvisorCommand } from "./cmd-advisor.mjs"
import { handleThinkCommand } from "./cmd-think.mjs"
import { handleModelCommand } from "./cmd-model.mjs"
import { handleSubmodelCommand } from "./cmd-submodel.mjs"
import { handleShellCommand } from "./cmd-shell.mjs"
import { handleConfigCommand } from "./cmd-config.mjs"
import { handleCopyCommand } from "./cmd-copy.mjs"
import { handleExtractCommand } from "./cmd-extract.mjs"
import { handleHelpCommand } from "./cmd-help.mjs"
import { handleUpgradeCommand } from "./cmd-upgrade.mjs"
import { handleFoldCommand } from "./cmd-fold.mjs"
import { handleUndoCommand } from "./cmd-undo.mjs"
import { handleEngCommand } from "./cmd-eng.mjs"

export const SLASH_COMMANDS = [
  { name: "/plan", group: "Agent", desc: "toggle plan mode (design first, then implement)" },
  { name: "/auto", group: "Agent", desc: "toggle auto-approve" },
  { name: "/eng", group: "Agent", desc: "toggle engineering mode — strict methodology enforcement" },
  { name: "/advisor", group: "Agent", desc: "advisor settings (model, thinking, review gate)" },
  { name: "/model", group: "Agent", desc: "select model & manage providers" },
  { name: "/submodel", group: "Agent", desc: "subagent model per type (explore/plan/coder/eng-coder)" },
  { name: "/shell", group: "System", desc: "bash tool shell (git-bash/pwsh path; win11 cmd encoding fix)" },
  { name: "/goal", group: "Agent", desc: "set/view/cancel long-term goal" },
  { name: "/think", group: "Agent", desc: "thinking mode & reasoning effort" },
  { name: "/upgrade", group: "System", desc: "check for updates & upgrade" },
  { name: "/config", group: "System", desc: "agent config (embedding, proxy, turns, threshold, consult pool)" },
  { name: "/new", group: "Session", desc: "new session (old one archived to slot)" },
  { name: "/session", group: "Session", desc: "list/switch archived sessions" },
  { name: "/rename", group: "Session", desc: "rename the active session" },
  { name: "/clear", group: "Session", desc: "clear screen" },
  { name: "/copy", group: "Session", desc: "copy last assistant response to clipboard" },
  { name: "/fold", group: "Session", desc: "toggle result folding on/off" },
  { name: "/undo", group: "Session", desc: "undo recent file modifications" },
  { name: "/init", group: "Project", desc: "generate project AGENTS.md skeleton" },
  { name: "/skills", group: "Project", desc: "list project skills" },
  { name: "/mcp", group: "Project", desc: "MCP servers (add, remove, connect, list)" },
  { name: "/reindex", group: "Project", desc: "rebuild memory index" },
  { name: "/extract", group: "Project", desc: "extract knowledge from session" },
  { name: "/restore", group: "System", desc: "restore checkpoint" },
  { name: "/exit", group: "System", desc: "exit" },
  { name: "/help", group: "System", desc: "this list" },
]

/** High-frequency command aliases (single source of truth — also used by index.mjs and cmd-help.mjs) */
export const SLASH_ALIASES = { "/h": "/help", "/x": "/exit", "/m": "/model", "/p": "/plan", "/t": "/think", "/c": "/clear", "/n": "/new" }

/** Command → handler mapping table (exported for tests) */
export const HANDLERS = {
  "/clear": handleClearCommand,
  "/new": handleNewCommand,
  "/rename": handleRenameCommand,
  "/exit": handleExitCommand,
  "/session": handleSessionCommand,
  "/reindex": handleReindexCommand,
  "/init": handleInitCommand,
  "/restore": handleRestoreCommand,
  "/plan": handlePlanCommand,
  "/goal": handleGoalCommand,
  "/skills": handleSkillsCommand,
  "/mcp": handleMcpCommand,
  "/auto": handleAutoCommand,
  "/advisor": handleAdvisorCommand,
  "/think": handleThinkCommand,
  "/model": handleModelCommand,
  "/submodel": handleSubmodelCommand,
  "/shell": handleShellCommand,
  "/config": handleConfigCommand,
  "/copy": handleCopyCommand,
  "/upgrade": handleUpgradeCommand,
  "/fold": handleFoldCommand,
  "/undo": handleUndoCommand,
  "/eng": handleEngCommand,
  "/extract": handleExtractCommand,
  "/help": handleHelpCommand,
}

/**
 * Creates the slash command processor.
 * Returns { handleSlash, completions, handleTab }.
 */
export function createSlashCommands(ctx) {
  const { agent, state, render } = ctx
  // forward SLASH_COMMANDS to /help
  const handlerCtx = { ...ctx, SLASH_COMMANDS }

  async function handleSlash(text) {
    const [rawCmd, ...args] = text.split(/\s+/)
    // case-insensitive matching + alias resolution
    const cmd = rawCmd.toLowerCase()
    const resolved = SLASH_ALIASES[cmd] ?? cmd
    const handler = HANDLERS[resolved]
    if (handler) {
      // IKBNUI (2026-08-28)：命令 handler 抛出的异常必须被拦截成错误行，不得击穿 TUI 主循环——
      // 此前 /think 交互循环里 config 写盘失败会一路冒泡（submit 无 catch）导致面板卡死、回不了输入框。
      // 调用点（index.mjs submit 路径）统一在 handleSlash 返回后 render，UI 保持存活。
      try {
        await handler(handlerCtx, args)
      } catch (e) {
        ctx.pushLine(`[error] ${e?.message ?? String(e)}`, C.error)
      }
      return
    }
    ctx.pushLine(`Unknown command: ${rawCmd} (/help for available commands)`, C.error)
  }

  /** Tab completion candidates: command names / subcommands / provider names / preset names / think params */
  function completions(input) {
    if (!input.startsWith("/")) return []
    const parts = input.split(/\s+/)
    // still typing the first token: complete command names (case-insensitive)
    if (parts.length === 1) {
      const prefix = parts[0].toLowerCase()
      return SLASH_COMMANDS.filter((c) => c.name.startsWith(prefix)).map((c) => c.name)
    }
    // aliases resolve to their target command, so `/m <Tab>` completes /model args
    const cmd = SLASH_ALIASES[parts[0].toLowerCase()] ?? parts[0].toLowerCase()
    const last = parts.at(-1) // when trailing space, list all candidates
    const head = parts.slice(0, -1).join(" ")
    const argIndex = parts.length - 2 // which parameter is being typed (0-based)
    const match = (cands) => cands.filter((c) => c.startsWith(last)).map((c) => `${head} ${c}`)
    if (cmd === "/model" && argIndex === 0) return match(agent.providers.map((p) => p.name))
    if (cmd === "/submodel") {
      if (argIndex === 0) return match(["explore", "plan", "coder", "eng-coder", "reset"])
      if (parts[1] && !["reset"].includes(parts[1]) && argIndex === 1) return match(agent.providers.map((p) => p.name))
    }
    if (cmd === "/think") {
      if (argIndex === 0) return match(["on", "off", "effort"])
      if (argIndex === 1 && parts[1].toLowerCase() === "effort") {
        // effort enum is model-specific — take it from the current model's spec
        const levels = specForModel(agent.provider?.model).reasoningEffortEnum ?? ["high", "max"]
        return match(levels)
      }
    }
    if (cmd === "/config" && argIndex === 0) return match(["embedkey"])
    if (cmd === "/goal" && argIndex === 0) return match(["set", "cancel"])
    if (cmd === "/fold" && argIndex === 0) return match(["on", "off"])
    if (cmd === "/mcp") {
      if (argIndex === 0) return match(["add", "http", "ws", "stdio", "ai", "remove", "connect", "list"])
      if (argIndex === 1 && (parts[1]?.toLowerCase() === "remove" || parts[1]?.toLowerCase() === "connect")) return match((agent.config?.mcp?.servers ?? []).map((s) => s.name))
    }
    return []
  }

  /** Tab: compute candidates and cycle through replacement */
  function handleTab() {
    const input = state.input.join("")
    if (state.completion && input === state.completion.candidates[state.completion.index]) {
      // previous candidate still in input box: cycle to next
      state.completion.index = (state.completion.index + 1) % state.completion.candidates.length
    } else {
      const candidates = completions(input)
      if (candidates.length === 0) return
      state.completion = { candidates, index: 0 }
    }
    const text = state.completion.candidates[state.completion.index]
    state.input = [...text]
    state.cursor = state.input.length
    render()
  }

  return { handleSlash, completions, handleTab }
}
