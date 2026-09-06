/**
 * setup-reminders.mjs — runtime user-reminder assembly, extracted from setup.mjs
 * (300-line advisory; 2026-08-29 thincoder#3 review #2).
 *
 * All builders here push "user"-role context messages onto the machine history line:
 *   - AUTO/permission reminder + engineering degraded-constraint warnings (top-level turns)
 *   - transient per-run time grounding (must stay LAST, after the user input, so its
 *     second-precision content never shifts a provider prefix cache)
 *   - machine-only injections (editor context), transient, never into fullHistory
 *   - pasted-image pointer appended to the REAL user message (by reference — never
 *     history.at(-1), which is the transient time reminder pushed after the input)
 *
 * Pure functions over (history, opts, …) — no I/O, trivially unit-testable.
 */

import { specForModel } from "../specs.mjs"
import { execSync } from "node:child_process"
import { escapeXml } from "./run-helpers.mjs"
import { END } from "../extension/session-slots.mjs"
import { peerInstances } from "../extension/peer-instances.mjs"

// ─── SESSION.md §11.1：统一 env-state transient reminder（2026-09-06 需求池
//     R5/R8/R9/R11 合并——CLI setup-reminders.mjs 同构镜像）───────────────────
// 每回合一行覆盖家族四项：env 身份（R8——§10 D-1 END 静态常量，不做 cmdline 判别）、
// 工程模式（R9）、活跃模型（R11）、重启感知（R5 resumed）。变更不专门注入——每回合
// 注入当前状态，下回合自然反映。git 不入 env-state 行（§11.1：不重复 clean|dirty
// 摘要）——由下方 collectGitContext 的富注入（branch/commits/uncommitted）承载。

/** env-state line builder — pure, unit-testable (CLI parity, END="vscode"). */
export function envStateLine({ mode, model, resumed }) {
  return `[System reminder: env: ${END}, mode: ${mode}, model: ${model}, resumed: ${resumed ? "yes" : "no"}.]`
}

/** Per-turn env-state push (depth-0 runs — the line describes the MAIN agent's
 *  host/mode/model identity). Degrades safely: provider.model missing → "unknown". */
export function pushEnvStateReminder(history, { engineering, provider, resumed }) {
  const mode = engineering ? "eng" : "normal"
  const model = provider?.model ?? "unknown"
  history.push({ role: "user", content: envStateLine({ mode, model, resumed }), transient: true })
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

// R5 重启检测：进程内首个顶层用户回合若背着磁盘恢复的会话（fullHistory 进场即非空）
// → resumed: yes + `process restarted` 注入，一次性（CLI setup.mjs
// _restartReminderInjected 语义镜像——每进程一次；新会话首回合 fullHistory 为空 → no，
// 且检测随即关闸，后续回合（history 已非空）不误判）。
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

/** Rich git context — CLI helpers.mjs collectGitContext parity (SESSION.md §11.1
 *  T-E6：branch/commits/uncommitted 富注入，非 clean|dirty 摘要）。 */
export function collectGitContext(cwd) {
  try {
    const opts = { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: GIT_TIMEOUT_MS }
    const branch = execSync("git branch --show-current", opts).trim()
    const log = execSync("git --no-pager log --oneline -5", opts).trim()
    const status = execSync("git status --short", opts).trim()
    const dirty = status ? status.split("\n").length : 0
    return [
      `Git context: on branch \`${branch || "(detached)"}\`${dirty ? `, ${dirty} uncommitted change(s)` : ", working tree clean"}.`,
      log ? `Recent commits:\n${log}` : "",
      status ? `Uncommitted:\n${status.split("\n").slice(0, MAX_GIT_CHANGES_DISPLAY).join("\n")}${dirty > MAX_GIT_CHANGES_DISPLAY ? `\n… (${dirty - MAX_GIT_CHANGES_DISPLAY} more)` : ""}` : "",
    ].filter(Boolean).join("\n")
  } catch {
    return ""
  }
}

/** Git context push (CLI setup.mjs parity) — transient, depth-0 user turns only. */
export function pushGitContext(history, cwd) {
  const gitCtx = collectGitContext(cwd)
  if (gitCtx) {
    history.push({ role: "user", content: `[System reminder: git context:\n${escapeXml(gitCtx)}]`, transient: true })
  }
}

/** AUTO mode reminder — single source of truth (CLI parity, byte-identical wording).
 *  pushModeReminders pushes it; agent.mjs imports it from HERE for the dedupe check
 *  (importing via setup.mjs would create a setup ↔ setup-reminders import cycle). */
export const AUTO_REMINDER = "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]"

/**
 * AUTO/permission reminder + engineering degraded-constraint warnings.
 * Only for top-level turns with a fresh (uncompressed) machine line.
 */
export function pushModeReminders(history, { depth, freshMachineLine, getAuto, role, engPromptActive, engResult }) {
  if (depth !== 0 || !freshMachineLine) return
  if (getAuto()) {
    history.push({ role: "user", content: AUTO_REMINDER })
  } else {
    history.push({
      role: "user",
      content: "[System reminder: Permission mode — confirm with the user before making changes. Describe what you intend to do first.]",
    })
  }
  // Engineering mode degraded-constraint warnings (CLI setup.mjs parity)
  if (engPromptActive && (engResult.templateMissing || engResult.methodologyMissing)) {
    const warnings = []
    if (engResult.templateMissing) warnings.push(`Engineering template (${role === "eng-coder" ? "engineering-sub.md" : "engineering.md"}) not found — the full engineering constraints may be incomplete.`)
    if (engResult.methodologyMissing) {
      const { methodologyTemplatePath, methodologyTemplateBody } = engResult
      let warning = "METHODOLOGY.md not found in the project root — no project methodology is loaded, so every 'per METHODOLOGY' reference in the engineering prompt is dangling and the three-document hard flow (requirements / design / test doc) is NOT enforced. Ask the user whether to create METHODOLOGY.md; if the user confirms, write cwd/METHODOLOGY.md before designing."
      // 2026-09-02 D-M1/D-M2 (template accessibility): absolute path + full body — the model
      // can read the template directly instead of hand-writing one from an unreachable source
      // path. Body read failure → degraded warning above (no path/body injected), same as CLI.
      if (methodologyTemplateBody) {
        // 2026-09-02 D-M1/D-M2 parity: mirror CLI setup.mjs verbatim (design literal
        // "built-in template（可 read <path> 或直接参考以下内容）:"); body read failure
        // → degraded warning above (no path/body injected), same as CLI.
        warning += `\n\nbuilt-in template（可 read ${methodologyTemplatePath} 或直接参考以下内容）:\n\n${methodologyTemplateBody}`
      }
      warnings.push(warning)
    }
    history.push({
      role: "user",
      content: `[System reminder: ENGINEERING MODE is active but ${warnings.join(" ")}]`,
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

