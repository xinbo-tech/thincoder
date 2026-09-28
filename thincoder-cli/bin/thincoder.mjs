#!/usr/bin/env node

/**
 * thincoder — CLI entry point
 *   thincoder                 Launch the interactive TUI
 *   thincoder chat "..."      One-shot agent run (tools enabled, streamed)
 *   thincoder memory <sub>    Memory management: list / search / put / remove / sweep（sweep：origin 级库治理）
 *   thincoder upgrade         Update to the latest version from npm
 *   thincoder completion <sh> Shell completion: bash / zsh / fish
 *   thincoder session gc    Session dir GC: --dry-run report / --confirm delete cold projects (SESSION.md §6.12)
 *   thincoder session index  Derived session index: --status report / --rebuild (SESSION.md §6.19)
 *   thincoder acp             Agent Client Protocol server (stdio, for Zed/JetBrains/Paseo)
 *   thincoder -v              Print version
 *   thincoder --help          Print help
 */

import { readFileSync } from "node:fs"
import { loadConfig, configPath } from "@thincoder/core/config.mjs"
import { tracesRoot } from "@thincoder/core/traces/trace-store.mjs"
import { scheduleTraceCleanup } from "@thincoder/core/traces/trace-cleanup.mjs"
import { prepareCrashReporting, writeCrashRecord } from "../src/crash-reports.mjs"
import { setTuiActive, restoreTerminalAfterCrash, _setCleanupOutPathForTest } from "../src/tui/tui-lifecycle.mjs"
import { spawnTuiWrapped } from "../src/tui/wrapped-spawn.mjs"
import { configurePromptInjections } from "@thincoder/core/prompt-files.mjs"
import { CLI_PROMPT_INJECTIONS } from "../src/prompt-injections.mjs"
// 拆档批 R4（2026-09-28）：命令分发表外提——分发骨架 + 八薄命令族 + help ∕ version =
// `src/command-table.mjs`；交互长驻三命令（chat ∕ tui ∕ acp）= `src/command-interactive.mjs`。
import { runCommandTable } from "../src/command-table.mjs"

// U2（CORE-UNIFICATION §2.6.3 专项补⑦ / §2.13.8（六））：CLI 端锚取值表——**进程入口、任何装配之前**注册一次（调用期应用 ⇒ 无导入序要求）。
// 漏配 = 锚字面静默进模型 ⇒ 入口面用例（test/integration/cli-prompt-entry.test.mjs）显式覆盖本调用路径。
configurePromptInjections(CLI_PROMPT_INJECTIONS)

// CONFIG.md §6.2 ④：内部 argv 标志（生产零路径）。`--tui-wrapped`（包装门——注入点 =
// src/tui/wrapped-spawn.mjs）在 bin 顶部自剥离（不进命令解析）；测试钩逐旗标
// （`--test-crash` / `--test-tui-active` / `--test-cleanup-out=<路径>`）在下方崩溃钩处按原始 argv
// （位置无关）判定后抛错接管——先于命令分派，永不作为命令被解释。
const _argvRaw = process.argv.slice(2)
const _tuiWrapped = _argvRaw.includes("--tui-wrapped")
const [command, ...args] = _argvRaw.filter((a) => a !== "--tui-wrapped")
// TUI-STDERR-CAPTURE（F-1）：TUI 启动（tui/无命令）默认包装——父 spawn 子 tee stderr 落盘（外部
// 终止/native abort——第 4 类崩溃面——诊断默认捕获）。须在 prepareCrashReporting 前（父不预建/不设
// report——子进程做——R25 保留）。argv 门已设（包装内子进程）或包装失败 → 直行现逻辑（尽力面）。
if ((command === undefined || command === "tui") && !_tuiWrapped) {
  if (spawnTuiWrapped()) await new Promise(() => {}) // 包装成功 → 挂起（tee/收尾退出全在 wrapped-spawn——不达下方命令分发）
}
const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version

// CONFIG.md §6.2 ①（用户面两开关——默认开）：判定单点 = 本入口——读配置键
// `diagnostics.{heapSnapshot,heapWatch}` 一次，经显式参数传入下方两消费者（读抛 ⇒ 视为默认开）。
let _diagnostics = {}
try {
  _diagnostics = loadConfig().diagnostics ?? {}
} catch { /* 配置缺失/损坏 → 默认开（零风险） */ }

// R25（F-R25b）：crash-reports 预建 + process.report 启用——入口最前（一切重活前——缩编程
// 期窗口）——V8 OOM/原生 fatal 自动写 report.*.json（实现批实测：目录缺失时 Node 静默不写
// ——预建为必要动作）。失败不阻断启动（尽力面）。
prepareCrashReporting({ heapSnapshot: _diagnostics.heapSnapshot !== false })
// TUI-OOM-ROOTCAUSE（CRASH-REPORTS.md §8.3 武装点——全命令同源单点）：堆遥测/看门狗——
// 60s 采样 + 双档（70/85%）比例边缘预警（stderr + TUI 行 + 事件日志）；定时器 unref
// （一次性命令自然退出零阻塞）；默认开（配置键 `diagnostics.heapWatch` 取 `false` 可不启）。
// 失败面全吞。
try {
  const { startHeapWatch } = await import("../src/heap-watch.mjs")
  startHeapWatch({ enabled: _diagnostics.heapWatch !== false })
} catch { /* 看门狗启动失败不阻断启动（尽力面） */ }

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

// R25 测试门（T-R25a.1/a.2——子进程 argv 注入——生产零路径）：`--test-crash` 抛未捕获异常
// 走完整崩溃序列；`--test-tui-active` 模拟 TUI 活动态（同一 setter——测试缝同源）；
// `--test-cleanup-out=<路径>` 指到文件时恢复序列写入该文件（tui-lifecycle 缝——启动时读点）。
// 判定面 = 原始 argv（位置无关——与旧 env 门同语义：旗标可居首/居尾，不依赖命令位）。
const _cleanupOutArg = _argvRaw.find((a) => a.startsWith("--test-cleanup-out="))
if (_cleanupOutArg) _setCleanupOutPathForTest(_cleanupOutArg.slice("--test-cleanup-out=".length))
if (_argvRaw.includes("--test-crash")) {
  if (_argvRaw.includes("--test-tui-active")) setTuiActive(true)
  throw new Error("R25 test crash (--test-crash)")
}

const USAGE = `thincoder - thin coding agent

Usage:
  thincoder                 Launch the interactive TUI
  thincoder tui             Launch the interactive TUI (explicit form of the default)
  thincoder chat [--auto] <prompt>   One-shot agent run (tools enabled), streams reply to stdout; --auto approves all tool calls
  thincoder acp             Agent Client Protocol server (stdio — Zed/JetBrains/Paseo drive sessions)
  thincoder acp --login     Authenticate this machine for ACP clients (terminal auth flow), then exit
  thincoder memory list [--type=<t>]           List memory entries
  thincoder memory search <query>              Search memory
  thincoder memory put --type=<t> --title=<t> --content=<c> [--tags=<t>]
  thincoder memory remove <id>                 Remove an entry
  thincoder memory sweep [--origin <o>] [--dry-run|--confirm]
  thincoder sync              Sync team memory repo (pull --rebase + reindex)
  thincoder reindex           Rebuild the local index from markdown sources
  thincoder distill <file> [--yes] [--layer=<s>]
                            Extract knowledge candidates from a session
                            transcript file; confirm each before saving
  thincoder session gc --dry-run | --confirm <hash|--all>
                            Session dir GC: report/recycle cold & stale project data into a 7-day recycle bin
                            (cold = manifest idle >90d; stale = no live owner + unreachable/empty cwd + 7-day window)
  thincoder session index [--status | --rebuild]
                            Derived session index (disposable, rebuilt on demand): --status reports sessions /
                            messages / tool calls + coverage + size; --rebuild reindexes every session file
  thincoder ledger migrate --dry-run | --confirm   Ledger variant-key merge (dry-run report / backup then import; source recycled)
  thincoder ledger audit                           Read-only ledger dir audit (classify every db + suggestions)
  thincoder upgrade         Update to the latest version from npm
  thincoder completion <sh>  Generate shell completion script (bash / zsh / fish)
  thincoder -v, --version   Print version

Config: ~/.thincoder/config.json — providers[] (one default model per channel) + defaultModel (new-session starting point); the available-model list is fetched from the provider at runtime (GET /models); manage via /config → 默认模型 and /model (session-level) in TUI
`

/** Unified message when no API key is configured */
function noKeyMessage() {
  return `No API key configured yet. Run "thincoder" to enter TUI, use /model to add a provider and set its key; or edit ${configPath} directly`
}

/** Delay exit: process.exit right after fetch triggers libuv assertion on Windows/Node 24; let handles drain first */
function exitSoon(code) {
  setTimeout(() => process.exit(code), 100)
}

// D-TR9（2026-09-05）：启动轨迹清理——删除超过 traces.retentionHours（默认 24h）的轨迹文件
// （fire-and-forget——不阻塞启动——失败静默——与轨迹写盘同纪律）。
// D-TR13（2026-09-21 · STARTUP-LATENCY 批 · TRACES.md §6.4）：触发面 = **会话型命令白名单**
// （`tui` 含无参默认路径 `command === undefined` / `chat` / `acp`）；白名单外命令（`--version` /
// `--help` / `completion` / `memory` / `sync` / `reindex` / `distill` / `upgrade` / `session`）
// 零启动清理。**启动清理 = 启动窗外延迟拍**——核侧 `scheduleTraceCleanup`（`TRACE_CLEANUP_DELAY_MS` = 3s，自调度点起；失败静默 / 不 unref 保后台排空）。
if (command === undefined || command === "tui" || command === "chat" || command === "acp") {
  try {
    const startupCfg = loadConfig()
    scheduleTraceCleanup({ dir: tracesRoot(), retentionHours: startupCfg.traces?.retentionHours ?? 24 })
  } catch { /* 配置缺失/损坏 → 跳过清理（零风险） */ }
  // SESSION.md §6.19 D-SE45 触发点②（2026-09-22 会话索引批）：派生索引启动窗外延迟拍
  // （核侧 `scheduleSessionIndexPass`——3s 起 / 单趟 ≤2s 且 ≤40 会话 / 每进程一次；与轨迹清理
  // 同址簇、同纪律：失败静默、不 unref）。索引 = 派生品（零权威）——主存零险。
  try {
    const { scheduleSessionIndexPass } = await import("@thincoder/core/session-index-pass.mjs")
    scheduleSessionIndexPass()
  } catch { /* 拍挂点失败静默——不阻断启动 */ }
}

// 命令分发（2026-09-28 拆档批 R4：分发表外提 `src/command-table.mjs`）——依赖经 ctx 注入：
// USAGE ∕ VERSION ∕ 两 helper = 本进程入口装配面（消费方：分发骨架与交互长驻三命令）。
await runCommandTable(command, args, { usage: USAGE, version: VERSION, exitSoon, noKeyMessage })
