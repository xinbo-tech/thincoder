#!/usr/bin/env node

/**
 * thincoder — CLI entry point
 *   thincoder                 Launch the interactive TUI
 *   thincoder chat "..."      One-shot agent run (tools enabled, streamed)
 *   thincoder memory <sub>    Memory management: list / search / put / remove
 *   thincoder upgrade         Update to the latest version from npm
 *   thincoder completion <sh> Shell completion: bash / zsh / fish
 *   thincoder session gc    Session dir GC: --dry-run report / --confirm delete cold projects (SESSION.md §12)
 *   thincoder acp             Agent Client Protocol server (stdio, for Zed/JetBrains/Paseo)
 *   thincoder -v              Print version
 *   thincoder --help          Print help
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { runAgent } from "../src/agent.mjs"
import { loadConfig, configPath } from "../src/config.mjs"
import { cleanupTraces } from "../src/traces/trace-store.mjs"
import { createMemory, syncDir } from "../src/memory.mjs"
import { assembleAgent, teamConfig, gitAuthor, validateProvider } from "../src/cli/make-agent.mjs"
import { memoryCommand } from "../src/cli/memory-command.mjs"
import { setupWizard } from "../src/cli/setup-wizard.mjs"
import { summarize, askPermission } from "../src/cli/permission.mjs"
import { distillCommand } from "../src/cli/distill-command.mjs"
import { prepareCrashReporting, recentCrashHint, writeCrashRecord } from "../src/crash-reports.mjs"
import { setTuiActive, restoreTerminalAfterCrash } from "../src/tui/tui-lifecycle.mjs"

const [command, ...args] = process.argv.slice(2)
const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version

// R25（F-R25b）：crash-reports 预建 + process.report 启用——入口最前（一切重活前——缩编程
// 期窗口）——V8 OOM/原生 fatal 自动写 report.*.json（实现批实测：目录缺失时 Node 静默不写
// ——预建为必要动作）。失败不阻断启动（尽力面）。
prepareCrashReporting()

// R25（F-R25a）异常钩子升级：原"只 console.error 一行（TUI 全屏下不可见）"→ ① 落盘
// crash-{ts}-{pid}.json ② TUI 活动态终端恢复 ③ console.error（恢复后打印才可见）
// ④ exit 非 0。执行序列定死（评审 #5 + 复审 #2）：一次性 guard（防再入递归）→ 同步写 →
// 终端恢复 → console.error → exit 非 0——各步独立 try/catch（写失败/恢复失败不阻断后续步）。
let crashHandled = false
function handleFatal(type, error) {
  if (crashHandled) {
    // 再入（本序列内又抛异常）→ 直接退出，不再递归
    process.exit(1)
  }
  crashHandled = true
  try {
    // ① 同步写诊断记录（设计字段集：时间/类型/消息+堆栈/uptime/argv/cwd/内存/node+版本）
    writeCrashRecord({ type, error })
  } catch { /* 写失败不阻断后续步 */ }
  try {
    // ② TUI 终端恢复：仅 TUI 活动态执行（writeCleanupSequence 同源——chat 模式 stdout
    // 管道不得收 ANSI——误判即污染输出）
    restoreTerminalAfterCrash()
  } catch { /* 恢复失败不阻断后续步 */ }
  try {
    // ③ 原 console.error 行保留（非 TUI 模式可见——恢复后打印才可见）
    console.error(`[error] ${error?.message ?? error}`)
  } catch { /* 打印失败不阻断 exit */ }
  // ④ exit 非 0 恒达（exitSoon——Windows/Node 24 上 fetch 后立即 exit 触发 libuv 断言先例）
  exitSoon(1)
}

// Top-level safety net: print one-line error and exit cleanly, no stack traces to the user
process.on("uncaughtException", (error) => handleFatal("uncaughtException", error))
process.on("unhandledRejection", (error) => handleFatal("unhandledRejection", error))

// R25 测试门（T-R25a.1/a.2——子进程 env 注入——生产零路径）：THINCODER_TEST_CRASH=1 抛
// 未捕获异常走完整崩溃序列；THINCODER_TEST_TUI_ACTIVE=1 模拟 TUI 活动态（同一 setter——
// 测试缝同源）；THINCODER_TEST_CLEANUP_OUT 指向文件时恢复序列写入该文件（tui-lifecycle 读）。
if (process.env.THINCODER_TEST_CRASH === "1") {
  if (process.env.THINCODER_TEST_TUI_ACTIVE === "1") setTuiActive(true)
  throw new Error("R25 test crash (THINCODER_TEST_CRASH)")
}

const USAGE = `thincoder - thin coding agent

Usage:
  thincoder                 Launch the interactive TUI
  thincoder chat [--auto] <prompt>   One-shot agent run (tools enabled), streams reply to stdout; --auto approves all tool calls
  thincoder acp             Agent Client Protocol server (stdio — Zed/JetBrains/Paseo drive sessions)
  thincoder memory list [--type=<t>]           List memory entries
  thincoder memory search <query>              Search memory
  thincoder memory put --type=<t> --title=<t> --content=<c> [--tags=<t>]
  thincoder memory remove <id>                 Remove an entry
  thincoder sync              Sync team memory repo (pull --rebase + reindex)
  thincoder reindex           Rebuild the local index from markdown sources
  thincoder distill <file> [--yes] [--layer=<s>]
                            Extract knowledge candidates from a session
                            transcript file; confirm each before saving
  thincoder session gc --dry-run | --confirm <hash|--all>
                            Session dir GC: report/delete cold project data (cold = manifest idle >90d, no live slots)
  thincoder upgrade         Update to the latest version from npm
  thincoder completion <sh>  Generate shell completion script (bash / zsh / fish)
  thincoder -v, --version   Print version

Config: ~/.thincoder/config.json (providers[] + activeProvider; manage via /provider, /model in TUI)
`

/** Unified message when no API key is configured */
function noKeyMessage() {
  return `No API key configured yet. Run "thincoder" to enter TUI, use /provider add and /provider key; or edit ${configPath} directly`
}

/** Delay exit: process.exit right after fetch triggers libuv assertion on Windows/Node 24; let handles drain first */
function exitSoon(code) {
  setTimeout(() => process.exit(code), 100)
}

// D-TR9（2026-09-05）：启动轨迹清理——删除超过 traces.retentionHours（默认 24h）的
// 轨迹文件（fire-and-forget——不阻塞启动——失败静默——与轨迹写盘同纪律）。
try {
  const startupCfg = loadConfig()
  cleanupTraces({ retentionHours: startupCfg.traces?.retentionHours ?? 24 }).catch(() => {})
} catch { /* 配置缺失/损坏 → 跳过清理（零风险） */ }

switch (command) {
  case "chat": {
    const auto = args.includes("--auto")
    const prompt = args.filter((a) => a !== "--auto").join(" ").trim()
    if (!prompt) {
      console.error('Usage: thincoder chat [--auto] "<prompt>"')
      exitSoon(1)
      break
    }

    // R25（F-R25c）：非交互/chat 模式——上次异常终止提示写 stderr 一行（无匹配不提示）
    const crashNotice = recentCrashHint()
    if (crashNotice) console.error(crashNotice)

    const agent = await assembleAgent()
    // SESSION.md §8 D-S4（F4）：headless 无 TUI —— 可读错误 + 退出码 1，不弹 UI、不崩溃
    if (agent._providerInvalid) {
      const prov = agent.activeProvider || "(未设置)"
      console.error(`[error] 未配置有效 provider（activeProvider "${prov}"：${agent._providerInvalidReason}）。请运行 thincoder 进入 TUI 重新选择，或编辑 ${configPath}`)
      exitSoon(1)
      break
    }
    if (!agent.provider.apiKey) {
      if (!process.stdin.isTTY) {
        console.error(noKeyMessage())
        exitSoon(1)
        break
      }
      const p = await setupWizard()
      if (!p) {
        exitSoon(1)
        break
      }
      agent.provider = p
      agent.activeProvider = p.name
      // Wizard may have configured an embedding key: attach vector search
      const fresh = loadConfig()
      if (fresh.embedding?.apiKey && agent.memory && !agent.memory.embedder) {
        const { createEmbedder } = await import("../src/embedding.mjs")
        agent.memory.embedder = createEmbedder(fresh.embedding)
      }
    }
    if (auto) agent.autoApprove = true
    // Accumulate token usage, output to stderr at the end (don't pollute stdout pipe)
    const usageTotal = { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0 }
    try {
      await runAgent(agent, prompt, {
        onToken: (text) => process.stdout.write(text),
        onWait: ({ phase, seconds }) => {
          console.error(phase === "gate" ? `[rate-limit] TPM throttle waiting ~${seconds}s` : `[rate-limit] 429 response, retrying in ${seconds}s`)
        },
        onToolCall: (name, toolArgs) => {
          console.error(`\n[tool] ${name} ${summarize(toolArgs)}`)
        },
        onToolResult: (name, result) => {
          const preview = result.length > 200 ? result.slice(0, 200) + "..." : result
          console.error(`[done] ${name} -> ${preview.split("\n")[0]}`)
        },
        onToolOutput: (name, chunk) => process.stderr.write(chunk),
        onCompress: () => console.error(`\n[context] Context too long, auto-compacted (early conversation summarized by LLM)`),
        onTaskUpdate: (items) => {
          const done = items.filter((i) => i.status === "done").length
          const current = items.find((i) => i.status === "in_progress")
          console.error(`[task] ${done}/${items.length}${current ? ` ▶ ${current.title}` : ""}`)
        },
        onUsage: (usage) => {
          usageTotal.prompt += usage.prompt_tokens ?? 0
          usageTotal.completion += usage.completion_tokens ?? 0
          usageTotal.cacheHit += usage.prompt_cache_hit_tokens ?? 0
          usageTotal.cacheMiss += usage.prompt_cache_miss_tokens ?? 0
        },
        onPermissionRequest: (name, toolArgs) => (agent.autoApprove ? true : askPermission(name, toolArgs)),
      })
      process.stdout.write("\n")
      if (usageTotal.prompt > 0) {
        const cacheTotal = usageTotal.cacheHit + usageTotal.cacheMiss
        const hitPart = cacheTotal > 0 ? ` cache-hit ${Math.round((usageTotal.cacheHit / cacheTotal) * 100)}%` : ""
        console.error(`[usage] prompt ${usageTotal.prompt} + completion ${usageTotal.completion}${hitPart}`)
      }
    } catch (error) {
      // 用 name 判断而非 instanceof：不依赖"与 runAgent 同一个模块实例"这一隐式约定
      if (error.name === "ContinueError") {
        console.error(`\n[paused] Agent stopped after ${error.turn} turns. Run in TUI to continue.`)
        exitSoon(0)
      } else {
        console.error(`\n[error] ${error.message}`)
        exitSoon(1)
      }
    }
    break
  }

  case "memory": {
    const config = loadConfig()
    const memory = createMemory({ dbPath: config.memory.dbPath })
    if (config.embedding?.apiKey) {
      const { createEmbedder } = await import("../src/embedding.mjs")
      memory.embedder = createEmbedder(config.embedding)
    }
    if (config.memory.projectDir) {
      memory.projectOrigin = join(process.cwd(), config.memory.projectDir)
    }
    const code = await memoryCommand(memory, args)
    if (code) exitSoon(code)
    break
  }

  case "sync": {
    const config = loadConfig()
    const team = teamConfig(config)
    if (!team) {
      console.error("Team memory not configured. Set memory.team in ~/.thincoder/config.json:")
      console.error('  "team": { "name": "myteam", "repo": "git@github.com:org/team-memory.git" }')
      exitSoon(1)
      break
    }
    const memory = createMemory({ dbPath: config.memory.dbPath })
    const { ensureClone, pullTeam } = await import("../src/git/gitmem.mjs")
    try {
      const cloned = await ensureClone(team)
      if (cloned) console.log(`Cloned team repo to ${team.dir}`)
      await pullTeam(team.dir)
      const stats = await syncDir(memory, { layer: "team", dir: team.dir })
      console.log(`Synced. Index: +${stats.added} ~${stats.updated} -${stats.removed}`)
    } catch (error) {
      console.error(`[error] ${error.message}`)
      exitSoon(1)
    }
    break
  }

  case "distill": {
    const code = await distillCommand(args, exitSoon)
    if (code) exitSoon(code)
    break
  }

  case "reindex": {
    const config = loadConfig()
    const memory = createMemory({ dbPath: config.memory.dbPath })
    // files 层（project/team 的 markdown 索引）全量重建；索引是易失品，真相在 markdown
    memory.db.prepare(`DELETE FROM files`).run()
    const cwd = process.cwd()
    let total = { added: 0, removed: 0 }
    if (config.memory.projectDir) {
      const s = await syncDir(memory, { layer: "project", dir: join(cwd, config.memory.projectDir) })
      total.added += s.added
    }
    const team = teamConfig(config)
    if (team) {
      const { ensureClone } = await import("../src/git/gitmem.mjs")
      await ensureClone(team)
      const s = await syncDir(memory, { layer: "team", dir: team.dir })
      total.added += s.added
    }
    console.log(`Reindexed ${total.added} markdown entries (project${team ? " + team" : ""}). Vectors will be lazily regenerated on next search.`)
    break
  }

  case "tui":
  case undefined: {
    const agent = await assembleAgent()
    // SESSION.md §8 D-S1：TUI 路径在 startTUI 前清空无效 provider——空 provider 不流入 runAgent
    // （崩溃源：chat() 缺 model → 网关 400 或 fetch("undefined/...") TypeError）
    if (agent._providerInvalid) agent.provider = null
    const config = loadConfig()
    // 恢复上次的会话（同一项目目录）；provider 按保存的名字切回（用户上次可能换过模型）
    // 2026-09-05 §10（R4）：恢复决策按本端记录 resumeSlot（D-2 ①②③）——manifest active
    // 只作"无记录端"的一次性继承源，不再作本端恢复第一依据（D-6）。
    const { resumeSlot, applySession } = await import("../src/session.mjs")
    const { slot, data } = resumeSlot(process.cwd())
    if (data) {
      const switched = applySession(agent, data)
      if (switched && agent.config?.agent?.compactThresholdAuto) {
        // 压缩阈值跟模型走（与 TUI 切换 provider 时的处理一致）；传 provider 对象——
        // providers[].context 覆盖生效（PROVIDER.md §15 T-C2）
        const { resolveCompactThreshold } = await import("../src/config.mjs")
        agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
      }
    }
    // D-3 钉槽：applySession 清 _slot 后立即钉回恢复槽——首保存必落恢复槽（消除
    // "load → 首回合保存"窗口内并发方翻 active 导致的静默迁移）；/new 经 resetSessionState
    // 清 _slot（newSession 已认领 + 写记录，语义保留）
    agent._slot = slot
    // D-S3 优先级补全：applySession 可能已用会话中的有效 provider 修复（config 无效 + 会话有效）——
    // 修复后复验清除标记，仅当两者都无效才弹重选（validateProvider 幂等）
    if (agent._providerInvalid) validateProvider(agent)
    // MCP 连接失败在 TUI alt-buffer 下 stderr 不可见，注入为下一条 user 消息后的提醒
    if (agent._mcpWarnings?.length) {
      agent._pendingReminders = agent._pendingReminders ?? []
      agent._pendingReminders.push(
        `[System reminder: ${agent._mcpWarnings.length} MCP server(s) failed to connect at startup:\n` +
        agent._mcpWarnings.map((w) => `  - ${w}`).join("\n") +
        `\nYou can try reconnecting with /mcp connect <name>.]`
      )
    }
    const { startTUI } = await import("../src/tui.mjs")
    try {
      await startTUI(agent, {
        projectDir: config.memory.projectDir ? join(process.cwd(), config.memory.projectDir) : null,
        team: teamConfig(config),
        author: gitAuthor(),
        restored: data,
        // R25（F-R25c）：TUI 启动显示一行"上次运行异常终止"提示（showStartup 渲染——无匹配不传）
        crashNotice: recentCrashHint() ?? undefined,
      })
    } catch (error) {
      console.error(`[error] ${error.message}`)
      exitSoon(1)
    }
    break
  }

  case "completion": {
    const shell = args[0]
    if (!["bash", "zsh", "fish"].includes(shell)) {
      console.error(`Usage: thincoder completion <bash|zsh|fish>`)
      exitSoon(1)
      break
    }
    if (shell === "bash") {
      process.stdout.write(`_thincoder() {
  local cur prev words cword
  _init_completion 2>/dev/null || { COMPREPLY=(); return; }
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  case "\${COMP_WORDS[1]}" in
    chat)    COMPREPLY=( \\$(compgen -W "--auto" -- "\\$cur") ) ;;
    memory)
      case "\\$prev" in
        memory) COMPREPLY=( \\$(compgen -W "list search put remove" -- "\\$cur") ) ;;
        list)   COMPREPLY=( \\$(compgen -W "--type=rule --type=knowledge --type=decision --type=pattern" -- "\\$cur") ) ;;
        put)    COMPREPLY=( \\$(compgen -W "--type= --title= --content= --tags=" -- "\\$cur") ) ;;
      esac ;;
    distill) COMPREPLY=( \\$(compgen -W "--yes --layer=" -- "\\$cur") ) ;;
    completion) COMPREPLY=( \\$(compgen -W "bash zsh fish" -- "\\$cur") ) ;;
    *)
      COMPREPLY=( \\$(compgen -W "chat acp memory sync reindex distill upgrade completion session -v --version -h --help" -- "\\$cur") ) ;;
  esac
}
complete -F _thincoder thincoder
`)
    } else if (shell === "zsh") {
      process.stdout.write(`#compdef thincoder

_thincoder() {
  local context state state_descr line
  typeset -A opt_args
  _arguments -C \\
    '1: :->cmd' \\
    '*:: :->args'

  case "\\$state" in
    cmd)
      _values 'command' \\
        'chat[One-shot agent run with tools]' \\
        'acp[Agent Client Protocol server for IDEs]' \\
        'memory[Manage long-term memory]' \\
        'sync[Sync team memory repo]' \\
        'reindex[Rebuild local index from markdown]' \\
        'distill[Extract knowledge from session transcript]' \\
        'upgrade[Update to latest version from npm]' \\
        'completion[Generate shell completion script]' \\
        'session[Session dir GC: session gc --dry-run|--confirm]'
      ;;
    args)
      case "\\$words[1]" in
        chat)    _arguments '--auto[Auto-approve all tool calls]' ;;
        memory)
          case "\\$words[2]" in
            list) _arguments '--type=[Filter by type]' ;;
            put)  _arguments '--type=[Entry type]' '--title=[Title]' '--content=[Content]' '--tags=[Space-separated tags]' ;;
          esac ;;
        distill) _arguments '--yes[Skip confirmation]' '--layer=[Layer filter]' ;;
        completion) _values 'shell' 'bash' 'zsh' 'fish' ;;
      esac ;;
  esac
}
_thincoder
`)
    } else if (shell === "fish") {
      process.stdout.write(`# thincoder completions for fish shell
complete -c thincoder -f

# Subcommands
complete -c thincoder -a chat     -d 'One-shot agent run with tools'
complete -c thincoder -a memory   -d 'Manage long-term memory'
complete -c thincoder -a sync     -d 'Sync team memory repo'
complete -c thincoder -a reindex  -d 'Rebuild local index from markdown'
complete -c thincoder -a distill  -d 'Extract knowledge from session'
complete -c thincoder -a upgrade  -d 'Update to latest version'
complete -c thincoder -a completion -d 'Shell completion'
complete -c thincoder -a session -d 'Session dir GC (session gc --dry-run|--confirm)'
complete -c thincoder -a acp -d 'Agent Client Protocol server for IDEs'

# Flags
complete -c thincoder -s v -l version -d 'Print version'
complete -c thincoder -s h -l help    -d 'Print help'

# chat flags
complete -c thincoder -n '__fish_seen_subcommand_from chat' -l auto -d 'Auto-approve tool calls'

# memory subcommands
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a list   -d 'List entries'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a search -d 'Search memory'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a put    -d 'Add entry'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a remove -d 'Remove entry'

# memory list flags
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from list' -l type -d 'Filter by type' -xa 'rule knowledge decision pattern'

# memory put flags
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l type    -d 'Entry type'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l title   -d 'Title'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l content -d 'Content'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l tags    -d 'Space-separated tags'

# distill flags
complete -c thincoder -n '__fish_seen_subcommand_from distill' -l yes   -d 'Skip confirmation'
complete -c thincoder -n '__fish_seen_subcommand_from distill' -l layer -d 'Layer filter'

# completion shells
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a bash -d 'Bash completions'
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a zsh  -d 'Zsh completions'
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a fish -d 'Fish completions'
`)
    }
    break
  }

  case "upgrade": {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
    const local = pkg.version
    const { checkForUpdate } = await import("../src/upgrade.mjs")
    const result = await checkForUpdate(local)
    if (!result) {
      console.error("[upgrade] Unable to query npm registry — check your network connection and that npm is installed")
      exitSoon(1)
      break
    }
    if (!result.newer) {
      console.log(`ThinCoder ${local} is already the latest.`)
    } else {
      console.log(`Upgrading: ${local} → ${result.latest}`)
      const { execSync } = await import("node:child_process")
      execSync("npm install -g thincoder@latest", { stdio: "inherit" })
      console.log(`Upgraded to ${result.latest}`)
    }
    break
  }

  case "acp": {
    const { runAcpServer } = await import("../src/acp.mjs")
    await runAcpServer()
    break
  }

  case "session": {
    // SESSION.md §12：会话目录 GC 手动面（F2 冷 cwd 报告/删除——VS Code 端无 shell 通道，仅 CLI）
    const { runSessionGc } = await import("../src/session-gc.mjs")
    process.exitCode = runSessionGc(args)
    break
  }

  case "--help":
  case "-h": {
    process.stdout.write(USAGE)
    break
  }

  case "--version":
  case "-v": {
    console.log(VERSION)
    break
  }

  default: {
    console.error(`Unknown command: ${command}\n`)
    process.stdout.write(USAGE)
    exitSoon(1)
  }
}
