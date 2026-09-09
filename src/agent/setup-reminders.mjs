/**
 * setup-reminders.mjs — runtime user-reminder assembly, extracted from setup.mjs
 * (300-line advisory; 2026-08-29 thincoder#3 review #2).
 *
 * All builders here push "user"-role context messages onto the machine history line:
 *   - AUTO/permission reminder (top-level turns)
 *   - transient per-run time grounding (must stay LAST, after the user input, so its
 *     second-precision content never shifts a provider prefix cache)
 *   - machine-only injections (editor context), transient, never into fullHistory
 *   - pasted-image pointer appended to the REAL user message (by reference — never
 *     history.at(-1), which is the transient time reminder pushed after the input)
 *
 * Builders are pure over (history, opts, …); the git-context collector
 * (collectGitContext/pushGitContext) is the module's one slow/blocking I/O spot
 * — async git subprocesses (execFile ×3 并行 + 失败冷却——GIT-ASYNC L21);
 * everything else stays I/O-free（peer 提醒的 stat 经 peerInstances 惰性委
 * 托——见下）and trivially unit-testable（:13 "no I/O" 过期注修复）。
 */

import { specForModel } from "../specs.mjs"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { escapeXml } from "./run-helpers.mjs"
import { END } from "../extension/session-slots.mjs"
import { peerInstances } from "../extension/peer-instances.mjs"

// ─── SESSION.md §11.1：统一 env-state transient reminder（2026-09-06 需求池
//     R5/R8/R9/R11 合并——CLI setup-reminders.mjs 同构镜像）───────────────────
// 每回合一行覆盖家族四项：env 身份（R8——§10 D-1 END 静态常量，不做 cmdline 判别）、
// 工程模式（R9）、活跃模型（R11）、重启感知（R5 resumed）。变更不专门注入——每回合
// 注入当前状态，下回合自然反映。git 不入 env-state 行（§11.1：不重复 clean|dirty
// 摘要）——由下方 collectGitContext 的富注入（branch/commits/uncommitted）承载。

/** env-state line builder — pure, unit-testable (CLI parity, END="vscode").
 *  §11.2（F1）：slot 字段入行——位置在 model 后 resumed 前（N3：无绑定 → 显式 null）。 */
export function envStateLine({ mode, model, slot, resumed }) {
  return `[System reminder: env: ${END}, mode: ${mode}, model: ${model}, slot: ${slot}, resumed: ${resumed ? "yes" : "no"}.]`
}

/** Per-turn env-state push (depth-0 runs — the line describes the MAIN agent's
 *  host/mode/model/slot identity). slot = 粘性当前会话槽（opts.engPersist.slot——
 *  §11.2 N2/N3——无绑定显式 null，不读 manifest active 共享指针）。resumed 由调用方
 *  传入 agent 级 _resumedPending 消费结果（§11.2 评审 #7——按会话跟踪；模块级
 *  restartDetectionDone 闸保留为 process restarted 句专用——见 setup.mjs）。
 *  Degrades safely: provider.model missing → "unknown". */
export function pushEnvStateReminder(history, { engineering, provider, slot, resumed }) {
  const mode = engineering ? "eng" : "normal"
  const model = provider?.model ?? "unknown"
  history.push({ role: "user", content: envStateLine({ mode, model, slot, resumed }), transient: true })
}

// R10 L1（MULTI-INSTANCE-COLLAB.md D-L1a——VS Code 镜像）：同伴实例感知注入。
// peerInstances 惰性 mtime 缓存保证"无同伴零开销"（回合一次 stat）；peerInstances 的
// 判活/端探测在 manifest 未变时不重跑。探测失败/无 manifest 按无同伴降级（不注入）。
// 文案按设计 §2a.4 逐字： "本目录另有 N 个活跃 thincoder（{end} pid={pid}…）——文件操作注意避让"

/** 注入当前 cwd 的同伴实例提醒（env-state 之后、time reminder 之前调用——setup.mjs
 *  装配；有同伴才注入；transient）。返回是否注入（测试断言用）。 */
export function pushPeerReminder(history, cwd) {
  try {
    const peers = peerInstances(cwd).filter((p) => !p.self)
    if (peers.length === 0) return false
    const list = peers.map((p) => `(${p.end ?? "unknown"} pid=${p.pid})`).join(", ")
    history.push({
      role: "user",
      content: `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${list}）——文件操作注意避让]`,
      transient: true,
    })
    return true
  } catch {
    return false // 感知失败按无同伴降级——不阻塞回合
  }
}

// R5 重启检测：process restarted 句的进程级一次性闸（SESSION.md §11.2 评审 #7——N6 双信号
// 分离：本闸保留为"真进程重启"句专用——extension host 重启后模块级重置；进程内切槽/换槽
// 不重置 → 切槽不误报进程重启）。resumed:yes 已改 agent 级 _resumedPending（setup.mjs
// hydrateRun——restore:true 工厂路径 + fullHistory 非空时武装——每次会话恢复一次）。
// 新会话首回合 fullHistory 为空 → 句不发，且检测随即关闸，后续回合（history 已非空）
// 不误判。
let restartDetectionDone = false

/** Test seam — restores first-turn restart detection (production never calls this). */
export function _resetRestartDetectionForTests() { restartDetectionDone = false }

/** Returns true exactly once: the first top-level user turn whose session was
 *  restored from disk (fullHistory arrives non-empty). All other turns return false. */
export function detectRestoredSession({ depth, resume, autoTurn, fullHistory }) {
  if (restartDetectionDone || depth !== 0 || resume || autoTurn) return false
  restartDetectionDone = true
  return (fullHistory?.length ?? 0) > 0
}

const GIT_TIMEOUT_MS = 5000
const MAX_GIT_CHANGES_DISPLAY = 20
// maxBuffer 沿用 execSync 默认现值 1 MiB（评审 #1——防大输出仓 ENOBUFS 翻转 → "" 破 AC-4 字节 parity）
const GIT_MAX_BUFFER = 1024 * 1024
// 失败冷却 v1（用户裁——F-3）：真失败/超时后 30s 内跳过该 cwd 的收集——病态 repo 周期拖慢变一次性
const GIT_FAILURE_COOLDOWN_MS = 30_000
/** cwd → 最近一次 git 收集失败的 ts。评审 #2：访问时惰性清 >30s 旧条目（防长活
 *  extension host 无界累积——v1 接受）。 */
const gitFailureCooldowns = new Map()

const execFileAsync = promisify(execFile)

/** 冷却检查 + 惰性清扫：冷却期内的 cwd 返回 true（调用方直接 "" 跳过）。 */
function gitCooldownActive(cwd) {
  const now = Date.now()
  const lastFailure = gitFailureCooldowns.get(cwd)
  if (lastFailure === undefined) return false
  if (now - lastFailure >= GIT_FAILURE_COOLDOWN_MS) {
    gitFailureCooldowns.delete(cwd) // 惰性清过期条目
    return false
  }
  return true
}

/** Test seams — cooldown Map 状态控制（生产从不调用）：
 *  `_gitFailureCooldownForTests(cwd, ts)` 读（ts 省略）或写 ts；`_clear…` 删条目。 */
export function _gitFailureCooldownForTests(cwd, ts) {
  if (ts !== undefined) gitFailureCooldowns.set(cwd, ts)
  return gitFailureCooldowns.get(cwd)
}
export function _clearGitFailureCooldownForTests(cwd) {
  gitFailureCooldowns.delete(cwd)
}

/** Git context 纯格式化（branch/log/status = trim 后原串）——独立导出供单测锁
 *  AC-4 字节 parity（现拼装逐字节保留——detached/dirty>20 截断/clean 三形态）。 */
export function composeGitContext({ branch, log, status }) {
  const dirty = status ? status.split("\n").length : 0
  return [
    `Git context: on branch \`${branch || "(detached)"}\`${dirty ? `, ${dirty} uncommitted change(s)` : ", working tree clean"}.`,
    log ? `Recent commits:\n${log}` : "",
    status ? `Uncommitted:\n${status.split("\n").slice(0, MAX_GIT_CHANGES_DISPLAY).join("\n")}${dirty > MAX_GIT_CHANGES_DISPLAY ? `\n… (${dirty - MAX_GIT_CHANGES_DISPLAY} more)` : ""}` : "",
  ].filter(Boolean).join("\n")
}

/** Rich git context — CLI helpers.mjs collectGitContext parity (SESSION.md §11.1
 *  T-E6：branch/commits/uncommitted 富注入，非 clean|dirty 摘要）。GIT-ASYNC L21：
 *  3×execSync 串行 → 3×execFile 并行（Promise.all——最坏 = 单次 5s 超时——事件循环
 *  不冻结）。单 catch → "" 保持 all-or-nothing（任一失败/超时 → 整段不注入——非 git
 *  快失败同路径）；catch 记冷却 ts——30s 内该 cwd 直接跳过。 */
export async function collectGitContext(cwd) {
  if (gitCooldownActive(cwd)) return ""
  try {
    const opts = { cwd, encoding: "utf8", timeout: GIT_TIMEOUT_MS, windowsHide: true, maxBuffer: GIT_MAX_BUFFER }
    const [branch, log, status] = await Promise.all([
      execFileAsync("git", ["branch", "--show-current"], opts).then((r) => r.stdout.trim()),
      execFileAsync("git", ["--no-pager", "log", "--oneline", "-5"], opts).then((r) => r.stdout.trim()),
      execFileAsync("git", ["status", "--short"], opts).then((r) => r.stdout.trim()),
    ])
    return composeGitContext({ branch, log, status })
  } catch {
    gitFailureCooldowns.set(cwd, Date.now()) // 真失败/超时——冷却 30s
    return ""
  }
}

/** Git context push (CLI setup.mjs parity) — transient, depth-0 user turns only.
 *  async（collectGitContext 异步化——调用方 await——注入相对序不变——F-4）。 */
export async function pushGitContext(history, cwd) {
  const gitCtx = await collectGitContext(cwd)
  if (gitCtx) {
    history.push({ role: "user", content: `[System reminder: git context:\n${escapeXml(gitCtx)}]`, transient: true })
  }
}

/** AUTO mode reminder — single source of truth (CLI parity, byte-identical wording).
 *  pushModeReminders pushes it; agent.mjs imports it from HERE for the dedupe check
 *  (importing via setup.mjs would create a setup ↔ setup-reminders import cycle). */
export const AUTO_REMINDER = "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]"

/**
 * AUTO/permission reminder — top-level turns with a fresh (uncompressed) machine line.
 * 施工② G4（2026-09-10）：engineering degraded-constraint 警告块随 D-M1/D-M2 机制退役
 * （METHODOLOGY 概念退役——槽位缺失警告由 assemblePrompt 的 D2 通道承担）。
 */
export function pushModeReminders(history, { depth, freshMachineLine, getAuto }) {
  if (depth !== 0 || !freshMachineLine) return
  if (getAuto()) {
    history.push({ role: "user", content: AUTO_REMINDER })
  } else {
    history.push({
      role: "user",
      content: "[System reminder: Permission mode — confirm with the user before making changes. Describe what you intend to do first.]",
    })
  }
}

/** Per-run time grounding — transient, pushed LAST (after the user input) so its
 *  second-precision content never shifts a provider prefix cache. */
export function pushTimeReminder(history) {
  history.push({
    role: "user",
    content: `[System reminder: current time is ${new Date().toLocaleString("sv-SE")} (local; timezone ${Intl.DateTimeFormat().resolvedOptions().timeZone}).]`,
    transient: true,
  })
}

/**
 * Machine-only injections (editor context, etc.) — MACHINE line ONLY, never into
 * fullHistory (CLI parity: automatic context must not pollute the human-readable
 * record). Marked transient so persistence layers can drop them. Accepts an array
 * OR a single message — collectEditorInjection returns one object, and a bare
 * for...of over it threw "object is not iterable" on every send with an active
 * editor (2211d46 bug).
 */
export function pushInjections(history, injections) {
  const list = Array.isArray(injections) ? injections : (injections ? [injections] : [])
  for (const inj of list) {
    if (inj && typeof inj.content === "string") {
      history.push({ role: "user", content: inj.content, transient: true })
    }
  }
}

/**
 * Pasted images (GitHub thincoder#3, Plan B): `images` carries absolute FILE PATHS
 * (<cwd>/.thincoder/tmp/paste-*.*, saved by the extension in panel-messages.mjs).
 * Appends a pointer to the REAL user message captured in setupAgentRun — content
 * stays a string (never the old image_url parts array), and the transient time
 * reminder / editor injections stay untouched, so nothing image-related is re-sent
 * on later runs. The model views the files with the read_image tool, whose
 * multimodal path injects the actual image parts.
 *
 * Throws on a non-multimodal model (visible error, never a silent drop).
 */
export function appendImagePointer(userMsg, images, providerModel, { depth }) {
  if (depth !== 0 || !userMsg || !Array.isArray(images) || images.length === 0) return
  const spec = specForModel(providerModel)
  if (!spec.multimodal) {
    throw new Error("This model does not support pasted images. Switch to a vision-capable model (Kimi K3, Qwen, GLM, etc.) or attach the image as a file and let the model read it.")
  }
  userMsg.content += `\n\n[Attached images: ${images.join(" | ")}] — use the read_image tool to view them before answering.`
}

/** Engineering mode OFF reminder (CLI parity — cmd-eng / injector transitions).
 *  2026-09-05 module-split：agent.mjs 519 > 500 硬限——ENG 提醒族迁入本文件（agent.mjs
 *  re-export 保 import 面——eng.mjs 与测试从 agent.mjs import）。 */
export const ENG_OFF_REMINDER =
  "[System reminder: engineering mode is now OFF — standard discipline applies. " +
  "Changes go through the normal workflow: you may edit files directly, advisor/verify " +
  "guards apply per config.]"

/** Engineering mode reminders — shared with the eng tool (CLI parity). */
export const ENG_ON_REMINDER =
  "[System reminder: engineering mode is ON — design-before-code enforced. " +
  "Workflow: Requirements doc → Design doc → advisor(type='design') → " +
  "user approval → eng-coder implementation. Code changes go through eng-coder " +
  "subagents only. Advisor calls are NOT per-turn-mandatory — call only at " +
  "flow nodes or when the user asks.]"

/** Engineering-mode status injection (CLI parity, agent.mjs injectEngineeringReminder):
 *  one reminder on EVERY transition (ON and OFF) — the model must always know the mode
 *  flipped, including after a session resume (vscode setup.mjs seeds _lastEngState=false
 *  so a resumed engineering session re-notifies on the first turn). */
export function injectEngineeringReminder(agent) {
  const eng = agent.config?.agent?.engineering ?? false
  if (eng !== agent._lastEngState) {
    agent.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
  }
  agent._lastEngState = eng
}

