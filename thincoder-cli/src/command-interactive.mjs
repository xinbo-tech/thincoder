/**
 * command-interactive.mjs — 交互长驻三命令（chat ∕ tui ∕ acp）——`bin/thincoder.mjs` 命令分发表
 *   外提（2026-09-28 拆档批 R4 · 纯移动——命令行为零改）：case 块体逐字搬移为函数（唯二机械改 =
 *   `break` → `return` · 相对 import 路径随住档改指）；依赖经 ctx 注入（`exitSoon` ∕ `noKeyMessage`
 *   ——bin 装配面注入；先例 = `src/tui/turn-face.mjs` 出档）；分发落点 = `src/command-table.mjs`。
 */
import { isAbsolute, join } from "node:path"
import { runAgent } from "@thincoder/core/agent.mjs"
import { loadConfig, configPath } from "@thincoder/core/config.mjs"
// 批 1 CORE-DEFECT-FIXES B3：onWait 相位值域 + 文案单源（消费面禁各自枚举——PROVIDER.md §6.20）
import { waitStatusText } from "@thincoder/core/provider/wait-status.mjs"
import { assembleAgent, attachManifest, teamConfig, gitAuthor, validateProvider } from "./cli/make-agent.mjs"
import { setupWizard } from "./cli/setup-wizard.mjs"
import { summarize, askPermission } from "./cli/permission.mjs"
import { recentCrashHint } from "./crash-reports.mjs"

/** chat —— 一次性 agent 运行（原 `bin/thincoder.mjs` `case "chat"` 块体逐字搬移）。 */
export async function chatCommand(args, ctx) {
  const { exitSoon, noKeyMessage } = ctx
  const auto = args.includes("--auto")
  const prompt = args.filter((a) => a !== "--auto").join(" ").trim()
  if (!prompt) {
    console.error('Usage: thincoder chat [--auto] "<prompt>"')
    exitSoon(1)
    return
  }

  // R25（F-R25c）：非交互/chat 模式——上次异常终止提示写 stderr 一行（无匹配不提示）
  const crashNotice = recentCrashHint()
  if (crashNotice) console.error(crashNotice)

  const agent = await assembleAgent()
  // SESSION.md §6.8 D-S4（#841 收正）：headless 无 TUI——按**核统一态分流**（判据单源 = PROVIDER.md §6.22，
  // 与 TUI 面同式）：**invalid 类**（`state === "invalid"` ∨ `providerInvalidReason` 非空——无渠/key
  // ⇒ 不可运行）⇒ 可读错误 + 退出码 1（不弹 UI、不崩溃）；**fallback**（无有效 defaultModel 但可运行）
  // ⇒ stderr 一行明示 + 继续运行（不退出——D-S2 同态同解）。条目结构不全不在本门（负向锁 =
  // PROVIDER.md:437）——归运行期失败径（stderr + 非 0 退出）。
  const headlessCfg = agent.config ?? {}
  const invalidClass = headlessCfg.providerState === "invalid"
    || (typeof headlessCfg.providerInvalidReason === "string" && headlessCfg.providerInvalidReason !== "")
  if (invalidClass) {
    console.error(`[error] 未配置有效渠道（${agent._providerInvalidReason ?? headlessCfg.providerStateReason ?? "provider unavailable"}）。请运行 thincoder 进入 TUI 设置（/config 设置渠道与密钥；或 /model 选择后以会话槽生效），或编辑 ${configPath}`)
    exitSoon(1)
    return
  }
  if (headlessCfg.providerState === "fallback" && agent.provider?.name) {
    const m = typeof agent.provider.model === "string" && agent.provider.model ? `:${agent.provider.model}` : ""
    console.error(`尚未设置默认模型：本次使用 \`${agent.provider.name}${m}\`——/config → 默认模型 设置一次（或 /model 选定即成为默认模型）`)
  }
  if (!agent.provider.apiKey) {
    if (!process.stdin.isTTY) {
      console.error(noKeyMessage())
      exitSoon(1)
      return
    }
    const p = await setupWizard()
    if (!p) {
      exitSoon(1)
      return
    }
    agent.provider = p
    agent.activeProvider = p.name
    // Wizard may have configured an embedding key: attach vector search
    const fresh = loadConfig()
    if (fresh.embedding?.apiKey && agent.memory && !agent.memory.embedder) {
      const { createEmbedder } = await import("@thincoder/core/embedding.mjs")
      agent.memory.embedder = createEmbedder(fresh.embedding)
    }
  }
  if (auto) agent.autoApprove = true
  // Accumulate token usage, output to stderr at the end (don't pollute stdout pipe)
  const usageTotal = { prompt: 0, completion: 0, cacheHit: 0, cacheMiss: 0 }
  try {
    await runAgent(agent, prompt, {
      onToken: (text) => process.stdout.write(text),
      onWait: (ev) => {
        const s = waitStatusText(ev)
        if (s) console.error(`[rate-limit] ${s}`)
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
}

/** tui ∕ 无参默认 —— 交互 TUI 启动（原 `case "tui": case undefined:` 块体逐字搬移）。 */
export async function tuiCommand(ctx) {
  const { exitSoon } = ctx
  // 恢复上次的会话（同一项目目录）；provider 按保存的名字切回（用户上次可能换过模型）
  // 2026-09-05 §6.10（R4）：恢复决策按本端记录 resumeSlot（D-2 ①②③）——manifest active
  // 只作"无记录端"的一次性继承源，不再作本端恢复第一依据（D-6）。
  // 2026-09-18（装配门禁批 #30 · KD-M1-13 / KD-M1-15）：resumeSlot **前移至装配之前**——
  // 装配期模式门判据 = 会话权威值（槽优先 + config 回退）；恢复记录经 slotData 形参进
  // 装配钩子（同进程同一调用前移 ⇒ 零新增写动作；钩子内不调 resumeSlot——非纯读）。
  const { resumeSlot, applySession, sessionDescriptor } = await import("@thincoder/core/session.mjs")
  // F-MI7：resumeSlot = async（探测束不阻塞事件循环）——此处必须 await
  const { slot, data } = await resumeSlot(process.cwd())
  const agent = await assembleAgent({ slotData: data })
  // SESSION.md §6.8 D-S1（#841 收正）：TUI 路径**仅在 `state === "invalid"`**（无渠/key）于 startTUI
  // 前置 `agent.provider = null`——空 provider 不流入 runAgent（崩溃源：chat() 缺 model → 网关 400
  // 或 fetch("undefined/...") TypeError）；`fallback` 态 provider 有效——不清（可运行 + 明示）。
  if (agent.config?.providerState === "invalid") agent.provider = null
  const config = loadConfig()
  if (data) {
    // applySession 内部已按槽复合重算 compactThreshold（auto 时）——不再需要 switched 分支
    // TUI-OOM-ROOTCAUSE（SESSION.md §6.14）：传 slot → 绑定记录存储（身份核验 + 对账）
    // ——人读线 = 尾窗（磁盘为准）；未传 = 模式 F（全量数组）
    applySession(agent, data, { slot })
    // SESSION.md §6.11（2026-09-08——N6 评审 🔴 修复）：process restarted 句 = 进程级
    // 信号——仅本启动 resume 路径设一次（真进程重启恢复盘上会话）；/session 切换与 ACP
    // 加载走同一 applySession 收敛但不设（不误报进程重启）。prepareRun 发句即清——进程
    // 内一次。resumed:yes 独立由 applySession 的恢复事件武装（data.history 非空）。
    agent._processRestartPending = true
  }
  // D-3 钉槽：applySession 清 _slot 后立即钉回恢复槽——首保存必落恢复槽（消除
  // "load → 首回合保存"窗口内并发方翻 active 导致的静默迁移）；/new 经 resetSessionState
  // 清 _slot（newSession 已认领 + 写记录，语义保留）
  agent._slot = slot
  // M1 重估点（会话起点②——applySession 之后 · KD-M1-13 取值点②）：CLI 的工程模式权威值 =
  // 会话槽（/eng 只写槽不写 config.json）；此时 agent.config.agent.engineering 已由
  // applySession 按槽订正 ⇒ 与装配期判据同值 ⇒ 幂等重估（值同 ⇒ 无副作用）。
  attachManifest(agent)
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
  const { startTUI } = await import("./tui.mjs")
  try {
    await startTUI(agent, {
      projectDir: config.memory.projectDir ? (isAbsolute(config.memory.projectDir) ? config.memory.projectDir : join(process.cwd(), config.memory.projectDir)) : null,
      team: teamConfig(config),
      author: gitAuthor(),
      restored: data ? sessionDescriptor(agent, data) : data,
      // R25（F-R25c）：TUI 启动显示一行"上次运行异常终止"提示（showStartup 渲染——无匹配不传）
      crashNotice: recentCrashHint() ?? undefined,
    })
  } catch (error) {
    console.error(`[error] ${error.message}`)
    exitSoon(1)
  }
}

/** acp —— Agent Client Protocol 服务（原 `case "acp"` 块体逐字搬移）。 */
export async function acpCommand(args, ctx) {
  const { exitSoon } = ctx
  const { runAcpServer, runAcpLogin } = await import("./acp.mjs")
  // §11.2 改法 4：`args` 语义 = 追加到已配置的 agent 调用——`--login` = 终端认证流程，
  // 不进 stdio 服务模式（不带该旗标时行为零变）；退出码语义 = 0 成功 / 非 0 失败。
  if (args.includes("--login")) {
    exitSoon(await runAcpLogin())
    return
  }
  await runAcpServer()
}
