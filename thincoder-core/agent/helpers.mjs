/**
 * agent/helpers.mjs — Agent utility functions and constants
 */
import { configDir } from "../config.mjs"
import { readFileSync, readdirSync } from "node:fs"
import { homedir } from "node:os"
import { writeFile, mkdir, readdir, stat, unlink } from "node:fs/promises"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

/** Single source for the AUTO-mode reminder (was duplicated in agent.mjs +
 *  setup.mjs — consult P2, 2026-08-30). */
export const AUTO_REMINDER = "[System reminder: AUTO mode is active — all tool calls are automatically approved without asking.]"

/** Inject the AUTO reminder once per history (both call sites used the same
 *  literal + guard — consolidated here). */
export function ensureAutoReminder(agent) {
  if (agent.autoApprove && !agent.history.some((m) => m.content === AUTO_REMINDER)) {
    agent.history.push({ role: "user", content: AUTO_REMINDER })
  }
}

export const DEFAULT_MAX_TURNS = 200
export const DEFAULT_SUBAGENT_TURNS = 100
export const DEFAULT_GOAL_TURNS = 200
export const MIN_REPORT_CHARS = 200
export const REPORT_CONTINUATION =
  "Your report was sent back: too brief to be a complete handoff — the parent agent sees nothing else from your run. " +
  "Rewrite your final message as a checklist:\n" +
  "1. What you changed and why\n" +
  "2. The path of every file you touched\n" +
  "3. How you verified (tests run, commands executed, with results)\n" +
  "4. Anything left undone or worth follow-up"

const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024 // 65536 chars — offload only above 64K (2026-08-24)
const TOOL_RESULT_PREVIEW = 64 * 1024 // total preview budget: head + middle note + tail ≤ 65536 (aligns with CLI/VS Code webview)
const TOOL_RESULT_PREVIEW_HEAD = 16 * 1024 // head slice preserved (2026-09-04 §5 — dual-end preview)
const TOOL_RESULT_PREVIEW_TAIL = 48 * 1024 // nominal tail slice (results/errors/stats live here — actual tail = budget remainder, see buildDualEndPreview)

/** UTF-16 安全截断（2026-09-02 deepseek 400 根因）：slice(0, N) 按码元切会把 emoji 代理对切成孤立
 *  高代理（如 🔴=U+D83D+DD34 只剩 D83D）——deepseek 解析器严格 UTF-16 报 400
 *  "unexpected end of hex escape"。截断点落在高代理上时向前收一个码元。
 *  与 setup.mjs 的 safeSliceUTF16 同语义（两处独立实现——escape.mjs 的 sanitizeLoneSurrogates 是发送兜底，此处是源头）。 */
function safeSliceUTF16(text, max) {
  if (text.length <= max) return text
  const cp = text.charCodeAt(max - 1)
  if (cp >= 0xd800 && cp <= 0xdbff) return text.slice(0, max - 1)
  return text.slice(0, max)
}

/** UTF-16 safe END slice (2026-09-04 §5 dual-end preview — review #5: both boundaries must not split
 *  a surrogate pair). Same rule as safeSliceUTF16, mirrored: if the slice START lands on a LOW
 *  surrogate (DC00-DFFF — the second half of a pair whose high half sits just before the boundary),
 *  advance one code unit so the slice never begins with an orphan low surrogate. */
function safeSliceUTF16End(text, max) {
  if (text.length <= max) return text
  const start = text.length - max
  const cp = text.charCodeAt(start)
  if (cp >= 0xdc00 && cp <= 0xdfff) return text.slice(start + 1)
  return text.slice(start)
}

/** Dual-end preview (design §5 D-4.1): head + middle-omitted note + tail — the tail carries
 *  results/errors/stats that a pure-head truncation would cut off.
 *  Budget (round1 review #2, fixed): head + note + tail ≤ TOOL_RESULT_PREVIEW (65536) — tail is
 *  computed from constants (tail = TOOL_RESULT_PREVIEW − head − noteLen), never hardcoded.
 *  The note length depends on the omitted digit count; text.length's digit count is an upper bound
 *  for omitted (< text.length), so budgeting with it keeps the total ≤ 65536 while the printed
 *  note reports the actual omitted count. Both boundaries run surrogate-safe slices (review #5). */
function buildDualEndPreview(text) {
  const head = safeSliceUTF16(text, TOOL_RESULT_PREVIEW_HEAD)
  const noteFn = (omitted) => `\n\n… [middle omitted: ${omitted} chars] …\n\n`
  const tailLen = Math.min(TOOL_RESULT_PREVIEW_TAIL, TOOL_RESULT_PREVIEW - TOOL_RESULT_PREVIEW_HEAD - noteFn(text.length).length)
  const tail = safeSliceUTF16End(text, tailLen)
  return head + noteFn(Math.max(0, text.length - head.length - tail.length)) + tail
}

/** Offload-dir write-time self-cleanup retention window (2026-08-21): files older than 3 days are deleted on the next offload. */
export const TMP_RETENTION_MS = 3 * 24 * 3600 * 1000

const GIT_TIMEOUT_MS = 5000
const MAX_GIT_CHANGES_DISPLAY = 20

export const OUTLINE_INJECT_PREFIX = "[System reminder: project dependency outline:"
export const FILE_MUTATORS = new Set(["write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit"])

/**
 * 工具自报触达面提取**单源谓词**（`docs/core/design/TOOLS.md` §6.17 / D-TO12——批 GUARD-SCHEDULER ·
 * 台账 #327）：与 `FILE_MUTATORS` 同址（门禁 / 变更记账 / L3 足迹 / 作用域规则四条面的公共输入）。
 * 契约（恒数组 · 恒零抛）：
 * - `args` 为 null **或非对象** ⇒ 一律规范化为 `{}` 再交钩子；
 * - 有钩子 ⇒ **钩子裁决**；无钩子 ⇒ `file_ops` **动作感知**（D-TO13 · 台账 #333）——`action === "copy"`
 *   ⇒ `[args.dest]`（源仅读取，不属写域）；`move` / `rename` / 未知或缺失 `action` ⇒ `[args.source,
 *   args.dest]`（保守双算）；其余工具单参兜底（形态零变——缺 path 同样返含 `undefined` 的单元素
 *   数组，由消费方按「未知路径 ⇒ 保守」自行判定）；
 * - 钩子 throw / 返回非数组 ⇒ `[]`；
 * - **不过滤非字符串项**（未知路径的保守判据归门禁自身——`thincoder-cli/test/portability-classification.test.mjs`
 *   T-22 语义零变）。
 * @param {Object|undefined} tool — 工具对象（可选钩子 `touchedPaths(args)`）
 * @param {unknown} args — 工具入参（畸形入参不抛）
 * @returns {unknown[]} 触达路径候选（可能含非字符串项——消费方过滤）
 */
export function toolTouchPaths(tool, args) {
  const a = args && typeof args === "object" ? args : {}
  const hook = tool?.touchedPaths
  if (typeof hook !== "function") {
    if (tool?.name === "file_ops") return a.action === "copy" ? [a.dest] : [a.source, a.dest]
    return [a.path]
  }
  try {
    const out = hook(a)
    return Array.isArray(out) ? out : []
  } catch {
    return []
  }
}


/** Escape XML special characters in a string for safe embedding in XML/HTML */
export function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

/** Canonicalize a tool call signature for stall detection: name + stable JSON args */
export function tryCanonicalize(name, args) {
  try { return name + ":" + JSON.stringify(JSON.parse(args)) } catch { return name + ":" + args }
}

/**
 * Best-effort write-time self-cleanup: delete files in dir whose mtime exceeds TMP_RETENTION_MS.
 * Subdirectories are never touched; every failure is silent — cleanup must not affect offload.
 */
export async function cleanupOldToolResults(dir) {
  const now = Date.now()
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return // dir missing or unreadable → nothing to clean
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue // subdirectories untouched
    try {
      const st = await stat(join(dir, entry.name))
      if (now - st.mtimeMs > TMP_RETENTION_MS) await unlink(join(dir, entry.name))
    } catch {
      /* entry vanished concurrently or I/O error — best effort, keep going */
    }
  }
}

/** Offload oversized tool results (>64K chars) to disk, returning a head+tail preview + file path
 *  (2026-09-04 §5 — dual-end preview; the failed-offload fallback uses the same dual-end slice).
 *  Writes trigger write-time self-cleanup of the offload dir first (dir param overridable for tests). */
export async function offloadToolResult(text, callId, dir = join(configDir, "tool-results")) {
  if (text.length <= TOOL_RESULT_OFFLOAD_LIMIT) return text
  try {
    await cleanupOldToolResults(dir)
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${Date.now()}-${String(callId).replace(/[^a-zA-Z0-9_-]/g, "_")}.log`)
    await writeFile(file, text, "utf8")
    return (
      buildDualEndPreview(text) +
      `\n\n[... output too large (${text.length} chars total), full content saved to: ${file}\n` +
      `Page through it with the read tool (offset/limit) or sed -n 'START,ENDp' — do NOT re-run the tool blindly.]`
    )
  } catch {
    // review #3: fallback uses the same dual-end slice (head + omitted note + tail, no path hint)
    return buildDualEndPreview(text) + `\n\n[... truncated: ${text.length} chars total, offload to disk failed]`
  }
}

// 失败冷却 v1（用户裁——GIT-ASYNC L21）：真失败/超时后 30s 内跳过该 cwd 的收集——
// 病态 repo 周期拖慢变一次性。VSC setup-reminders.mjs 同构镜像。
const GIT_FAILURE_COOLDOWN_MS = 30_000
/** cwd → 最近一次 git 收集失败的 ts。评审 #2：访问时惰性清 >30s 旧条目（防无界累积）。 */
const gitFailureCooldowns = new Map()
// maxBuffer 沿用 execSync 默认现值 1 MiB（评审 #1——防大输出仓 ENOBUFS 翻转 → "" 破字节 parity）
const GIT_MAX_BUFFER = 1024 * 1024

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

/** Git context 纯格式化（branch/log/status = trim 后原串）——独立导出供单测锁字节
 *  parity（现拼装逐字节保留——detached/dirty>20 截断/clean 三形态——VSC 镜像）。 */
export function composeGitContext({ branch, log, status }) {
  const dirty = status ? status.split("\n").length : 0
  return [
    `Git context: on branch \`${branch || "(detached)"}\`${dirty ? `, ${dirty} uncommitted change(s)` : ", working tree clean"}.`,
    log ? `Recent commits:\n${log}` : "",
    status ? `Uncommitted:\n${status.split("\n").slice(0, MAX_GIT_CHANGES_DISPLAY).join("\n")}${dirty > MAX_GIT_CHANGES_DISPLAY ? `\n… (${dirty - MAX_GIT_CHANGES_DISPLAY} more)` : ""}` : "",
  ].filter(Boolean).join("\n")
}

/** Collect git branch, recent commits, and working tree status as context text.
 *  GIT-ASYNC L21：3×execSync 串行（最坏 15s 阻塞）→ 3×execFile 并行（Promise.all——
 *  最坏 = 单次 5s 超时——事件循环不冻结）。单 catch → "" 保持 all-or-nothing（任一
 *  失败/超时 → 整段不注入——非 git 快失败同路径）；catch 记冷却 ts——30s 内跳过。 */
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

export class ContinueError extends Error {
  constructor(turn) {
    super(`Agent paused after ${turn} turns. Continue?`)
    this.name = "ContinueError"
    this.turn = turn
  }
}

/** AGENT-LOOP-ASYNC-POOL.md §6.8 D-S6 auto-turn guard 标记集（核内单源）：快照/回填两 helper 共用本清单——
 *  端侧宿主载体（`panel._guardCarry`）与核载体（`agent._inheritedGuard`）同清单。 */
export const INHERITED_GUARD_KEYS = [
  "_mutatedThisRun", "_verifiedThisRun", "_verifyPassed", "_calledAdvisorThisRun",
  "_touchedFiles", "_verifyRetries", "_advisorRound",
]

/** 写侧单点：快照 7 键 → 纯对象（载体形态由调用方决定——核 = agent 字段 / 端 = 宿主容器）。 */
export function snapshotGuard(agent) {
  const snap = {}
  for (const k of INHERITED_GUARD_KEYS) snap[k] = agent[k]
  return snap
}

/** 读侧单点：回填快照中**存在**的键（`in` 守卫——等价核现行读侧；端侧快照恒含全键 ⇒
 *  等价现行无条件拷贝）。载体留端（target 由调用方给）。 */
export function restoreGuard(target, snap) {
  if (!snap) return
  for (const k of INHERITED_GUARD_KEYS) if (k in snap) target[k] = snap[k]
}

/** 跨段累计编号帧（TURN-CAP-CONTINUE.md §4——第 19 批 TURN-ACROSS-SEGMENTS）：
 *  唯一计算点（纯函数）——把链内累计序数换算成面向消费面的编号载荷。
 *  - seq      = 该轮链内累计序数（1 起——`agent._turnSeq` 每轮 +1，续跑不重置）
 *  - turn     = 段内轮号（0 起——段内帽判定的循环变量）
 *  - maxTurns = 本段预算（段内帽判定值——原样传入）
 *  返回 { turn, maxTurns }：turn = seq（累计已跑轮数）；maxTurns = 段前累计 + 本段预算
 *  = seq - turn - 1 + maxTurns（差额项 = 本段开始前的链内累计）。
 *  段内帽判定不读本帧（只读段内 turn / maxTurns——N6 零机制改动）。 */
export function turnFrame(seq, turn, maxTurns) {
  return { turn: seq, maxTurns: seq - turn - 1 + maxTurns }
}

/** Repair malformed conversation history: remove orphan tool messages and fill missing tool results */
export function repairHistory(history) {
  const out = []
  let dirty = false
  const knownIds = new Set() // tool_call ids declared by assistant so far
  for (let i = 0; i < history.length; i++) {
    const m = history[i]
    // empty assistant message: no content and no tool_calls, discard
    if (m.role === "assistant" && !m.tool_calls?.length && !m.content) {
      dirty = true
      continue
    }
    // orphan tool message: no matching assistant tool_calls declaration, discard
    if (m.role === "tool" && !knownIds.has(m.tool_call_id)) {
      dirty = true
      continue
    }
    out.push(m)
    if (m.role !== "assistant" || !m.tool_calls?.length) continue

    for (const tc of m.tool_calls) knownIds.add(tc.id)
    // collect tool result ids that immediately follow (before the next non-tool message)
    const answered = new Set()
    let j = i + 1
    while (j < history.length && history[j].role === "tool") {
      if (knownIds.has(history[j].tool_call_id)) {
        answered.add(history[j].tool_call_id)
        out.push(history[j])
      } else {
        dirty = true // orphan tool result, discard
      }
      j++
    }
    i = j - 1 // outer for will increment again

    for (const tc of m.tool_calls) {
      if (!answered.has(tc.id)) {
        dirty = true
        out.push({
          role: "tool",
          tool_call_id: tc.id,
          content: "[Tool execution was interrupted: session ended before the result was recorded]",
        })
      }
    }
  }
  return dirty ? out : history
}

/** List working directory contents as a tree (directories expanded up to subMax entries each) */
export function listWorkDir(cwd, { rootMax = 30, subMax = 10 } = {}) {
  const SKIP = new Set([".git", "node_modules"])
  let entries
  try {
    entries = readdirSync(cwd, { withFileTypes: true })
  } catch {
    return ""
  }
  const visible = entries.filter((e) => !e.name.startsWith("."))
  const hiddenCount = entries.length - visible.length
  const byName = (a, b) => a.name.localeCompare(b.name)
  const dirs = visible.filter((e) => e.isDirectory() && !SKIP.has(e.name)).sort(byName)
  const files = visible.filter((e) => !e.isDirectory()).sort(byName)
  const ordered = [...dirs, ...files]
  const lines = []
  for (const e of ordered.slice(0, rootMax)) {
    if (!e.isDirectory()) {
      lines.push(e.name)
      continue
    }
    lines.push(`${e.name}/`)
    let children
    try {
      children = readdirSync(join(cwd, e.name)).filter((n) => !n.startsWith(".")).sort()
    } catch {
      continue
    }
    if (children.length <= subMax) {
      for (const c of children) lines.push(`  ${c}`)
    } else {
      for (const c of children.slice(0, subMax)) lines.push(`  ${c}`)
      lines.push(`  (${children.length - subMax} more entries omitted)`)
    }
  }
  if (ordered.length > rootMax) lines.push(`(${ordered.length - rootMax} more entries omitted)`)
  if (hiddenCount > 0) lines.push(`(${hiddenCount} hidden entries omitted)`)
  return lines.join("\n")
}

/** Return the set of tool names that are marked as read-only */
export function readonlyToolNames(tools) {
  return new Set(tools.filter((t) => t.readonly).map((t) => t.name))
}

/** Depth>0 tool exclusions — subagents never get the interactive main-session tools (`question`:
 *  no user to ask; the routing guidance already lives in every persona file). Single source for
 *  the repo: the shell-side depth>0 filter consumes this set (design = TOOLS.md §6.16 / D-TO11). */
export const SUBAGENT_TOOL_EXCLUSIONS = new Set(["question"])

/** Apply the depth>0 exclusion set — always returns a NEW array (parent table untouched). */
export function excludeSubagentTools(tools) {
  return tools.filter((t) => !SUBAGENT_TOOL_EXCLUSIONS.has(t.name))
}

const MAX_INSTRUCTION_CHARS = 32_000

/** Load AGENTS.md / project_rules.md from user home and project root.
 *  User-level (~/.thincoder/AGENTS.md) loaded first (lower priority).
 *  Project-level overrides take precedence. */
export async function loadProjectInstructions(cwd) {
  const parts = []
  // 1. User-level: global preferences across all projects
  try {
    const userPath = join(homedir(), ".thincoder", "AGENTS.md")
    const content = readFileSync(userPath, "utf8").trim()
    if (content) parts.push(`<!-- From: ${userPath} -->\n${content}`)
  } catch { /* file does not exist */ }
  // 2. Project-level: project-specific conventions
  for (const name of ["AGENTS.md", "project_rules.md"]) {
    try {
      const content = readFileSync(join(cwd, name), "utf8").trim()
      if (!content) continue
      parts.push(`<!-- From: ${join(cwd, name)} -->\n${content}`)
    } catch { /* file does not exist */ }
  }
  const merged = parts.join("\n\n")
  if (!merged) return ""
  if (merged.length <= MAX_INSTRUCTION_CHARS) return merged
  return (
    `<!-- WARNING: project instructions total ${merged.length} chars, exceeding the ${MAX_INSTRUCTION_CHARS} soft limit. ` +
    `They are included in full, but consider shortening them — long instructions dilute attention. -->\n\n` +
    merged
  )
}

// Engineering mode reminders + auto-turn digest domain + mode injector
// （2026-09-05 module-split：自 agent.mjs 迁入——agent.mjs 530 > 500 硬限——agent.mjs
// re-export 保 import 面：eng.mjs / cmd-eng.mjs / 测试从 agent.mjs import）

/** Engineering mode reminder — shared with eng.mjs tool. */
export const ENG_ON_REMINDER =
  "[System reminder: engineering mode is ON (session-scoped) — design-before-code enforced. " +
  "Workflow: Requirements doc → Design doc → advisor(type='design') → " +
  "user approval → eng-coder implementation. Code changes go through eng-coder " +
  "subagents only. Advisor calls are NOT per-turn-mandatory — call only at " +
  "flow nodes or when the user asks.]"

/** Engineering mode OFF reminder — shared with the eng tool and the injector. */
export const ENG_OFF_REMINDER =
  "[System reminder: engineering mode is now OFF — standard discipline applies. " +
  "Changes go through the normal workflow: you may edit files directly, advisor/verify " +
  "guards apply per config.]"

/** Manual-tier auto-turn digest domain (normal-mode base — engineering variant =
 *  AUTO_TURN_DIGEST_DOMAIN_ENG below): organize-only. Mechanism = AGENT-LOOP-ASYNC-POOL.md §6.8;
 *  mode variant text = TOOLS.md §6.15.3.
 *  Injected per manual auto-turn run — writes/execute/spawns/questions are also
 *  mechanically denied (no permission handler + spawn gate); this steers first. */
export const AUTO_TURN_DIGEST_DOMAIN =
  "[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later; 2) update the task list with the task tool (allowed) to mark finished work done; 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

/** Engineering-mode auto-turn digest domain variant (mode = `agent.config.agent.engineering`;
 *  clause 2 drops the task-tool pointer — F10: the task tool is disabled in engineering mode,
 *  the batch record + ledger are the tracking authority). Single line, verbatim from the
 *  design doc (TOOLS.md §6.15.3); mechanism = AGENT-LOOP-ASYNC-POOL.md §6.8. Content authority = parent side. */
export const AUTO_TURN_DIGEST_DOMAIN_ENG =
  "[System reminder: auto-turn — background async subagents finished while there was no user message, and this turn runs automatically to digest their reports (the finished-report reminders above). No one is waiting for this reply, so organize only: 1) summarize each finished report's key points into this conversation for the user to read later; 2) (engineering mode: the task tool is disabled — no task-list update is expected this turn; the batch record + ledger are the tracking authority and are updated in real user turns); 3) write decision points with a suggested next step as text — do not execute it. FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the summaries are written.]"

/** Up-stream wake-turn domain (AGENT-LOOP-UPSTREAM.md §6.27.12.8): a running subagent sent
 *  an in-flight message and is waiting for the reply — the digest domain's "No one is waiting
 *  for this reply" is the opposite of the truth, so the wake turn gets its own text.
 *  Verbatim from the design doc (single line — no newlines). Content authority = parent side. */
export const UPSTREAM_TURN_DOMAIN =
  "[System reminder: auto-turn — a running subagent sent you an in-flight message (shown below). No user message is waiting. Decide it now and reply with subagent action:'send' (id + message) — the child consumes the reply at its next turn boundary and keeps working on the unaffected parts; if the message needs no answer, say so in one line and move on. If finished subagent reports are also present above, summarize them as usual in the same turn. Do not start new work: FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify, spawning subagents, asking questions — those need a real user message. End the turn once the reply is sent.]"

/** Engineering-mode status injection — one reminder on EVERY transition (2026-08-25:
 *  OFF is announced too — the model must know the gates lifted; silence after /eng-off
 *  left it guessing. Covers TUI /eng, resume, and any path bypassing the eng tool.) */
export function injectEngineeringReminder(agent) {
  const eng = agent.config?.agent?.engineering ?? false
  if (eng !== agent._lastEngState) {
    agent.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
  }
  agent._lastEngState = eng
}

