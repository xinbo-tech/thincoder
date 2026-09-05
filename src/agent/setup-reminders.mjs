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

