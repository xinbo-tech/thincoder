/**
 * run-helpers.mjs — agent loop helpers (split out of agent.mjs for the 500-line limit).
 * Constants + pure helpers shared by runAgent and executeToolBatches.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { loadRaw } from "@thincoder/core/config-io.mjs"
import { isCodePath, loadConventions } from "@thincoder/core/conventions.mjs"

/** File-modifying tools — the engineering design gate blocks these before review passes (CLI parity). */
export const FILE_MUTATORS = new Set(["write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit"])
export const MAX_ADVISOR_PUSHBACKS = 3

const DEFAULT_MAX_TURNS = 200

/** Top-level turn limit from the shared config.json (CLI agent.maxTurns), with local default fallback. */
export function configuredMaxTurns() {
  try {
    return loadRaw().agent?.maxTurns ?? DEFAULT_MAX_TURNS
  } catch { return DEFAULT_MAX_TURNS }
}

/**
 * 跨段累计编号帧（TURN-CAP-CONTINUE §19.3——第 19 批）：seq = 链内累计序数（agent._turnSeq），
 * turn = 段内轮次（0 起），maxTurns = 本段预算。差额项 seq − turn − 1 = 本段开始前的链内累计
 * → maxTurns = 段前累计 + 段预算（跨段预算同步累计）。段内帽判定不读本函数（帽 = turn < maxTurns）。
 */
export function turnFrame(seq, turn, maxTurns) {
  return { turn: seq, maxTurns: seq - turn - 1 + maxTurns }
}

/**
 * 消费点统一入口（§19.3——runChild / escalate-async 两续跑循环）：把帧写进池条目。
 * entry 空（sync 路径）→ no-op 不抛；maxTurns ≤ 0（帧缺第二参的兼容形态）→ 不覆盖既有值。
 */
export function applyTurnFrame(entry, turn, maxTurns) {
  if (!entry) return
  entry.turn = turn
  if (maxTurns > 0) entry.maxTurns = maxTurns
}

export const STALL_WINDOW = 5
export const STALL_THRESHOLD = 3
export const MAX_VERIFY_PUSHBACKS = 2
export const MAX_VERIFY_RETRIES = 3
export const MAX_EMPTY_RETRIES = 2 // empty-response retry budget (CLI parity, IK60QP)

// W6（压缩面取核单源）：task 回注前缀常量退休——去重 + 回注单点 = 核
// `@thincoder/core/context.mjs`（TASK_REINJECT_PREFIX / applyCompression）。

// Engineering-mode prompt templates retired (PROMPT-SYSTEM 施工② G4, 2026-09-10):
// the per-run engineering prompt builder and its methodology warning machinery
// removed — the slot-based assemblePrompt (prompt-overlays.mjs) owns assembly now.

/** XML 转义（reminder 纪律：子代理报告/错误可能含来自文件/网页的注入面内容——注入会话前转义）。 */
export function escapeXml(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * True when this run mutated at least one CODE file (CLI hasCodeMutations parity).
 * Code = inside a declared code segment (default: `src` — incl. src/prompts/*.md,
 * at ANY depth) OR anything that is neither a doc file nor a temp file (tmp-*,
 * .tmp/.temp — L58 附带差：scratch 脚本不触发 guard——CLI isTempFile 同规则).
 * _touchedFiles stores absolute paths; classification comes from the single
 * authority (@thincoder/core/conventions.mjs) and honors the project declaration
 * (.thincoder/conventions.json) — the same judge as the design gate, never a
 * second copy of the default list.
 */
export function hasCodeMutations(agent) {
  const files = agent._touchedFiles ?? []
  if (files.length === 0) return agent._mutatedThisRun
  const conv = loadConventions(agent.cwd)
  return files.some((p) => isCodePath(p, conv))
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
 * Mirrors thincoder-cli/src/context.mjs:pushReal — the two lines are written independently at the source.
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
 * Re-inject the end-side state reminders after the machine line was rewritten by compaction.
 * W6：任务列表 + plan mode 回注（含旧注入去重）已归核 `@thincoder/core/context.mjs` 的
 * applyCompression（本单元同笔改指——单一回注点）；本函数只留端侧 AUTO 面：AUTO 提醒在
 * 压缩后重注一遍（getAuto() 是端侧 live 标志——核内无此面）。
 */
export function reinjectAfterCompaction(history, agent, getAuto) {
  // Re-inject AUTO mode reminder — getAuto() is the live flag (CLI parity), so a
  // mid-turn approve-all that survives compression re-injects the reminder. D-CI6
  // (VSC-CONTEXT-PARITY §17.3): the permission sentence retired — the CLI has no
  // permission reminder, AUTO is the only mode line (agent.mjs loop head re-pushes it).
  if (getAuto()) {
    history.push({
      role: "user",
      content: "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]",
    })
  }
}
