/**
 * run-helpers.mjs — agent loop helpers (split out of agent.mjs for the 500-line limit).
 * Constants + pure helpers shared by runAgent and executeToolBatches.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs"
import { join, resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { loadAgentSettings } from "../config-io.mjs"
import { isDocFile } from "../advisor/repos.mjs"

/** File-modifying tools — the engineering design gate blocks these before review passes (CLI parity). */
export const FILE_MUTATORS = new Set(["write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit"])
export const MAX_ADVISOR_PUSHBACKS = 3

const DEFAULT_MAX_TURNS = 200

/** Top-level turn limit from the shared config.json (CLI agent.maxTurns), with local default fallback. */
export function configuredMaxTurns() {
  try {
    return loadAgentSettings().maxTurns
  } catch { return DEFAULT_MAX_TURNS }
}
export const STALL_WINDOW = 5
export const STALL_THRESHOLD = 3
export const MAX_VERIFY_PUSHBACKS = 2
export const MAX_VERIFY_RETRIES = 3
export const MAX_EMPTY_RETRIES = 2 // empty-response retry budget (CLI parity, IK60QP)

/** Task re-injection reminder prefix — stale copies are filtered before re-injecting (CLI parity D7). */
export const TASK_REINJECT_PREFIX = "[System reminder: your current task list after compaction:"

// Engineering-mode prompt templates (loaded once; methodology is read per-run from the project).
let _ENG_MAIN = ""
let _ENG_SUB = ""
try { _ENG_MAIN = readFileSync(new URL("../prompts/engineering.md", import.meta.url), "utf8") } catch { /* */ }
try { _ENG_SUB = readFileSync(new URL("../prompts/engineering-sub.md", import.meta.url), "utf8") } catch { /* */ }

/**
 * Build the engineering-mode prompt fragment: engineering template + project METHODOLOGY.md
 * (CLI setup.mjs buildEngineeringPrompt parity). Returns { prompt, templateMissing,
 * methodologyMissing, methodologyTemplatePath, methodologyTemplateBody }.
 */
export function loadEngineeringPrompt(cwd, role) {
  const engTemplate = role === "eng-coder" ? _ENG_SUB : _ENG_MAIN
  let methodology = ""
  try { methodology = readFileSync(join(cwd, "METHODOLOGY.md"), "utf8") } catch { /* no methodology */ }
  const templateMissing = !engTemplate
  const methodologyMissing = !methodology
  // Methodology template for the missing-warning (2026-09-02 D-M1/D-M2): absolute path so
  // the model can read the template directly, plus the full body for zero-access reference
  // (CLI setup.mjs parity — same-source join). Loaded only in the missing branch; a read
  // failure leaves the body null → the caller warns honestly without injecting it.
  let methodologyTemplatePath = null
  let methodologyTemplateBody = null
  if (methodologyMissing) {
    methodologyTemplatePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "prompts", "methodology-template.md")
    try { methodologyTemplateBody = readFileSync(methodologyTemplatePath, "utf8") } catch { /* template unreadable — degraded warning */ }
  }
  const prompt = engTemplate
    ? (methodology ? `${engTemplate}\n\n---\n\n## Project METHODOLOGY.md\n\n${methodology}` : engTemplate)
    : (methodology ? `[ENGINEERING MODE]\n\nFollow this methodology strictly:\n\n${methodology}` : null)
  return { prompt, templateMissing, methodologyMissing, methodologyTemplatePath, methodologyTemplateBody }
}

/** XML 转义（reminder 纪律：子代理报告/错误可能含来自文件/网页的注入面内容——注入会话前转义）。 */
export function escapeXml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * True when this run mutated at least one CODE file (CLI hasCodeMutations parity).
 * Doc-only changes (docs/, *.md, LICENSE…) must NOT trigger the advisor guard.
 * _touchedFiles stores absolute paths; the src/ check matches a path component.
 */
export function hasCodeMutations(agent) {
  const files = agent._touchedFiles ?? []
  if (files.length === 0) return agent._mutatedThisRun
  return files.some((p) => /(?:^|[\\/])src[\\/]/.test(p) || !isDocFile(p))
}
export const MAX_TOOL_RESULT = 64 * 1024 // chars — large results saved to disk instead of truncated (aligns with CLI)
export const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // §5 D-4.1 head slice preserved (preview 保头保尾)
export const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // §5 D-4.1 nominal tail — actual budget = MAX_TOOL_RESULT − head − noteLen (tail 优先)
// §5 省略注格式（设计逐字定稿——CLI 同文案）；noteLen 含 omitted 位数（1~8 位十进制，初值 6）——预算按初始最大位数
// 预留后按真实位数释放给 tail（round1 评审 #2：head + note + tail ≤ 65536——tail 优先）。
const PREVIEW_NOTE_PREFIX = "\n\n… [middle omitted: "
const PREVIEW_NOTE_SUFFIX = " chars] …\n\n"
const PREVIEW_NOTE_MAX_DIGITS = 6 // 初始预留位数（>64K 文本 omitted 常见 1~8 位——迭代按真实位数收敛，此值只是起点）
/** Offload-dir write-time self-cleanup retention window (CLI parity 2026-08-21): files older than 3 days are deleted on the next offload. */
export const TMP_RETENTION_MS = 3 * 24 * 3600 * 1000
export const MAX_PARALLEL_SUBAGENTS = 4

/**
 * UTF-16-safe truncation (CLI parity, PROVIDER.md §14.6/§14.7): plain `slice(0, N)` cuts
 * BY UTF-16 CODE UNIT — an emoji (surrogate pair) straddling the boundary becomes a LONE
 * high surrogate (U+D800-DBFF) that deepseek's strict UTF-16 decoder 400s with
 * "unexpected end of hex escape". When the cut point lands on a high surrogate, step back
 * one code unit instead (the pair is dropped whole). Same semantics as thincoder
 * src/agent/helpers.mjs safeSliceUTF16 (two ends, independent implementations).
 */
export function safeSliceUTF16(text, max) {
  if (text.length <= max) return text
  const cp = text.charCodeAt(max - 1)
  if (cp >= 0xd800 && cp <= 0xdbff) return text.slice(0, max - 1)
  return text.slice(0, max)
}

/**
 * UTF-16-safe TAIL slice (§5 D-4.1 — safeSliceUTF16 的对称面): from the end, keep the last
 * `max` code units. Two cut points must both land safely:
 *  - START: a lone LOW surrogate (U+DC00-DFFF) means the pair was cut — advance one code
 *    unit (drop the whole pair from the tail's viewpoint);
 *  - END (= the text's end): a lone HIGH surrogate (U+D800-DBFF) at the very end is dropped
 *    so the tail never ADDS a lone surrogate the head-slice rule would also avoid.
 * Boundary rule mirrors thincoder CLI helpers.mjs safeSliceUTF16End (two ends, independent
 * implementations); the trailing-lone-high-surrogate drop is a VS Code-side strengthening —
 * the CLI end-slice leaves a pre-existing orphan at the text end to the escape layer.
 */
export function safeSliceUTF16Tail(text, max) {
  if (text.length <= max) return text
  let start = text.length - max
  const first = text.charCodeAt(start)
  if (first >= 0xdc00 && first <= 0xdfff) start += 1 // 起点落低代理 → 丢弃代理对整体（向前一码元）
  let tail = text.slice(start)
  const last = tail.charCodeAt(tail.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) tail = tail.slice(0, -1) // 终点孤立高代理 → 去掉（截断边界安全）
  return tail
}

/**
 * §5 D-4.1 双端预览（保头保尾）：head(16K) + 省略注 + tail——总长 ≤ MAX_TOOL_RESULT（AC3/AC4 保持）。
 * 预算（round1 评审 #2 定死）：tail 优先——tail 预算 = MAX_TOOL_RESULT − head − noteLen；noteLen 含
 * omitted 位数（先按 PREVIEW_NOTE_MAX_DIGITS 预留，再按真实位数把差额释放给 tail——位数只减不增，
 * 迭代收敛）。两端均经 UTF-16 安全切片（评审 #5：防代理对切开）。
 */
export function buildHeadTailPreview(text) {
  if (text.length <= MAX_TOOL_RESULT) return text // 短文本无需切片（T-4.3 快路径守卫——防御性：offload 调用点已在阈值后）
  const head = safeSliceUTF16(text, TOOL_RESULT_PREVIEW_HEAD)
  let digits = PREVIEW_NOTE_MAX_DIGITS
  let tail = ""
  let omitted = 0
  for (let pass = 0; pass < 3; pass++) {
    const noteLen = PREVIEW_NOTE_PREFIX.length + digits + PREVIEW_NOTE_SUFFIX.length
    const tailBudget = Math.max(0, MAX_TOOL_RESULT - head.length - noteLen)
    tail = safeSliceUTF16Tail(text, tailBudget)
    omitted = Math.max(0, text.length - head.length - tail.length)
    if (String(omitted).length === digits) break // 位数稳定——预算分配收敛
    digits = String(omitted).length
  }
  const note = `${PREVIEW_NOTE_PREFIX}${omitted}${PREVIEW_NOTE_SUFFIX}`
  return head + note + tail
}

/** Run async tasks with a concurrency limit */
export async function runWithLimit(items, fn, limit) {
  const results = new Array(items.length)
  let idx = 0
  async function worker() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

/** Save large tool results to disk so the agent can read them with the read tool.
 *  Writes trigger write-time self-cleanup of <cwd>/.thincoder/tmp/ first (CLI parity, 2026-08-21):
 *  delete files older than TMP_RETENTION_MS (incl. paste-* images in the same dir); subdirs untouched; silent failures. */
export function offloadToolResult(cwd, text) {
  if (text.length <= MAX_TOOL_RESULT) return text
  const dir = join(cwd, ".thincoder", "tmp")
  const now = Date.now()
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    entries = [] // dir missing or unreadable → nothing to clean
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue // subdirectories untouched
    try {
      const st = statSync(join(dir, entry.name))
      if (now - st.mtimeMs > TMP_RETENTION_MS) unlinkSync(join(dir, entry.name))
    } catch {
      /* entry vanished concurrently or I/O error — best effort, keep going */
    }
  }
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const path = join(dir, `tool-${id}.txt`)
    writeFileSync(path, text, "utf8")
    return `[Large output saved. Read the full result with the read tool: ${path}]\n\n${buildHeadTailPreview(text)}`
  } catch {
    // If saving fails (disk full, permissions), fall back to truncation — T-4.4: 与主路径同口径
    //（双端切片 head+省略注+tail——不再纯头截断）——无路径提示；标注报原文总长 + 落盘失败原因
    //（评审 #1：原"truncated text.length−MAX"数字在双端切片下已非实际弃置数——与省略注矛盾——改报总量）。
    return buildHeadTailPreview(text) + `\n... (truncated ${text.length} chars total — offload to disk failed)`
  }
}

/**
 * pushReal — the single entry point for REAL conversation messages.
 * A real message (user input, assistant reply, tool result, multimodal image) is appended to BOTH the
 * machine line (history) and the human line (fullHistory). Machine-only injections ([System reminder:...],
 * compaction notes, task/plan reminders) are pushed to history directly and never enter fullHistory.
 * Mirrors thincoder/src/context.mjs:pushReal — the two lines are written independently at the source.
 */
export function pushReal(history, fullHistory, msg) {
  // SESSION.md §9 D-S1 (CLI parity): real messages carry an epoch-ms ts stamped HERE at push
  // time — one point covers every real message. Pre-existing ts is preserved; restored old
  // messages keep no ts rather than getting a misleading backdate (D-S3). ts is LOCAL-ONLY:
  // the send layer strips it before any provider request (T-S3).
  if (msg && msg.ts === undefined) msg.ts = Date.now()
  fullHistory.push(msg)
  history.push(msg)
}

/** Extract the persisted engineering/advisor/session state for the session file (CLI
 *  session.mjs fields — saveSession parity). The design tokens AND the mode flags are
 *  session-scoped (2026-08-29): engineering and advisor.guard persist into the slot (slot
 *  authority, config.json is the CLI mirror); the advisor convergence budget still resets
 *  per run (CLI parity).
 *  DESIGN-TOKEN-SETTLEMENT D2/D5 (2026-09-08): 单值镜像 _engDesignToken 已退役——不再写入
 *  slot（镜像字段运行时零写）；只带多槽表 engDesignTokens（内存 Map 真持有态）。空态保存是否
 *  清权威槽由 saveLines 的 D2 合并语义决定（内存空但槽有值 → 保留槽值，不钉 null）——此处只
 *  如实反映内存。
 *  §11.7 交付缺口补强 (2026-09-08): tasks/goal/pendingReminders 会话级字段（C 类——
 *  buildTopLevelAgent 内存真持有态）随回合完成回写槽（agent.mjs onComplete → saveLines
 *  spread 携入）——CLI saveSession 同款三字段（session.mjs:131/137），destroy/重载后重建
 *  hydrate restore 从槽回填（§11.2.1 映射表——F4 闭环）。字段名以内存源 _tasks/_goal/
 *  _pendingReminders 为准（槽键 tasks/goal/pendingReminders 不变——applySlotSessionState
 *  读侧同键）。空态 []/null 如实反映内存——干净完成回合内存即权威；abort/finally 保存不带
 *  agentState（键缺席 undefined）→ saveLines 保留槽值。快照拷贝（非引用）：onComplete 与
 *  onDistilled 异步保存间后续回合的内存变更不得泄漏进旧快照（engDesignTokens 同语义）。 */
export function agentState(agent) {
  return {
    engineering: agent.config?.agent?.engineering ?? false,
    advisorGuard: agent.config?.advisor?.guard === true,
    // Multi-design slots ride the round-trip (2026-09-01 audit #1): Map → {designId: token}
    // (JSON-safe). null = memory holds no live slots — whether the slot is cleared follows
    // saveLines' D2 merge (slot-with-value is preserved against an empty save).
    engDesignTokens: agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0
      ? Object.fromEntries(agent._engDesignTokens)
      : null,
    // §11.7: 会话级三字段回写槽（slot keys: tasks/goal/pendingReminders）。JSON-safe
    // snapshot copies of the agent's memory — live arrays/objects are never handed out.
    tasks: Array.isArray(agent._tasks) ? [...agent._tasks] : [],
    goal: agent._goal ? { ...agent._goal } : null,
    pendingReminders: Array.isArray(agent._pendingReminders) ? [...agent._pendingReminders] : [],
  }
}

/**
 * Re-inject state reminders after the machine line was rewritten by compaction or truncation.
 * Task list is the single source of truth: stale re-injections are filtered FIRST, then the
 * latest version is appended (CLI parity D7 — otherwise old copies accumulate and grow stale).
 */
export function reinjectAfterCompaction(history, agent, getAuto) {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]
    if (m.role === "user" && typeof m.content === "string" && m.content.startsWith(TASK_REINJECT_PREFIX)) {
      history.splice(i, 1)
    }
  }

  // Re-inject task list after compaction (single source of truth)
  if (agent._tasks?.length > 0) {
    const pending = agent._tasks.filter((t) => t.status !== "done")
    const done = agent._tasks.filter((t) => t.status === "done")
    const taskSummary = [
      ...pending.map((t) => `- [${t.status}] ${t.title}`),
      ...done.slice(0, 3).map((t) => `- [done] ${t.title}`),
    ].join("\n")
    history.push({
      role: "user",
      content: `[System reminder: your current task list after compaction:\n${taskSummary}\nContinue from where you left off.]`,
    })
  }

  // Re-inject plan mode if active
  if (agent._planMode) {
    history.push({
      role: "user",
      content: "[System reminder: plan mode is active. Explore the codebase read-only, design your solution, then call plan with action='exit' to present it for user approval.]",
    })
  }

  // Re-inject permission mode reminder — getAuto() is the live flag (CLI parity), so a
  // mid-turn approve-all that survives compaction re-injects the correct reminder.
  if (getAuto()) {
    history.push({
      role: "user",
      content: "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]",
    })
  } else {
    history.push({
      role: "user",
      content: "[System reminder: Permission mode — confirm with the user before making changes. Describe what you plan to modify and wait for approval before executing file-changing tools.]",
    })
  }
}
