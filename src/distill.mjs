/**
 * distill.mjs — extract knowledge candidates from sessions (the "automatic track" of the dual-track system)
 * Principle (settled): manually triggered, LLM produces candidates, human confirms each one before writing.
 * Absolutely no automatic storage at session end.
 */

import { chat } from "./provider/index.mjs"
import { loadConfig } from "./config.mjs"
import { put, putMarkdown } from "./memory.mjs"
import { commitAndPush } from "./git/gitmem.mjs"

const DISTILL_PROMPT = `You are a knowledge extractor. Read the following agent work session log and extract knowledge worth remembering across sessions.

Output a JSON array (nothing else):
[
  {
    "type": "rule | knowledge | decision | pattern",
    "title": "Short title",
    "content": "Full content, self-contained — understandable without session context",
    "tags": ["tag1", "tag2"],
    "scope": "personal | project"
  }
]

Extraction criteria:
- knowledge: factual project knowledge (architecture, deployment, conventions)
- decision: technical decisions made in the session and their rationale
- pattern: debugging experiences, solutions, reusable workflows
- rule: coding standards (caution! rules are usually best written manually; only extract rules explicitly established in the session)
- scope: use "project" for project-specific knowledge; use "personal" for general or personal preferences

Do NOT extract:
- one-off task details ("changed line X in file Y today")
- transient state mentioned in the session (current bugs, work-in-progress)
- pleasantries and obvious facts

If nothing is worth extracting, output []
If the session is long, prioritize conclusions that appeared last and are still in effect.

Session log:
`

/** §18.6 D-TR6（2026-09-04 fix round1）：distill 调用点无 agent 作用域——traces 开关
 *  缺省回退磁盘配置（loadConfig——与 agent.config 同源：traces.enabled 缺省 on）；
 *  配置不可读时按缺省 on（注：CLI 启动早已 loadConfig——此处仅是兜底防御）。 */
function tracesEnabledFromConfig() {
  try {
    return loadConfig().traces?.enabled !== false
  } catch {
    return true
  }
}

/**
 * Extract candidates from a session transcript. transcript: plain-text session record.
 * Returns [{ type, title, content, tags, scope }], or [] on parse failure.
 * opts.traces（可选）：§18.6 D-TR6 开关显式透传（测试隔离/未来调用方）——缺省回退
 * 磁盘配置（tracesEnabledFromConfig）——关 = chat() 出口不落盘。
 */
export async function extractCandidates(provider, transcript, opts = {}) {
  const traces = opts.traces ?? tracesEnabledFromConfig()
  const res = await chat(provider, {
    messages: [{ role: "user", content: DISTILL_PROMPT + transcript }],
    // §18.6 D-TR4/D-TR6（fix round1）：distill 调用经 chat() 唯一采集点——补轨迹
    // 元数据 + traces 开关透传（关=不落盘必须全覆盖——不再静默越过开关）
    logCtx: { stage: "distill", kind: "distill", traces },
  })
  // Balanced-bracket extraction: find the first '[' and track depth through nested
  // brackets (tags arrays, nested objects, etc.) until the matching ']'.
  // Non-greedy regex (/\[[\s\S]*?\]/) stops at the FIRST ']', which is wrong when
  // LLM output contains nested arrays like `"tags": ["a", "b"]`.
  const start = res.content.indexOf("[")
  if (start === -1) return []
  let depth = 0
  let end = -1
  for (let i = start; i < res.content.length; i++) {
    const ch = res.content[i]
    if (ch === "[" && (i === start || res.content[i - 1] !== "\\")) depth++
    else if (ch === "]" && res.content[i - 1] !== "\\") {
      depth--
      if (depth === 0) { end = i + 1; break }
    }
  }
  if (end === -1) return []
  const jsonText = res.content.slice(start, end)
  try {
    const parsed = JSON.parse(jsonText)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) => c?.type && c?.title && c?.content)
  } catch {
    return []
  }
}

/**
 * Convert agent's OpenAI-format history to readable session transcript text.
 */
export function historyToTranscript(history, { maxChars = 30_000 } = {}) {
  const lines = []
  for (const m of history) {
    if (m.role === "tool") {
      lines.push(`[tool result] ${(m.content ?? "").slice(0, 500)}`)
    } else if (m.tool_calls?.length) {
      const calls = m.tool_calls.map((tc) => `${tc.function?.name ?? "?"}(${tc.function?.arguments?.slice(0, 200) ?? ""})`).join(", ")
      lines.push(`[assistant] ${m.content ?? ""}\n[called tools] ${calls}`)
    } else {
      lines.push(`[${m.role}] ${m.content ?? ""}`)
    }
  }
  const text = lines.join("\n\n")
  // Overlong: keep head and tail (earliest requirements + latest conclusions are most important)
  if (text.length <= maxChars) return text
  const half = Math.floor(maxChars / 2)
  return text.slice(0, half) + "\n\n...[... middle portion omitted ...]...\n\n" + text.slice(-half)
}

/**
 * Write confirmed candidates to the specified layer.
 * opts: { projectDir, team: { dir } | null, author }
 * scope=team requires opts.team; project requires opts.projectDir.
 * Returns write result description.
 */
export async function saveCandidate(memory, candidate, opts = {}) {
  const scope = candidate.scope ?? "personal"
  // tags come from LLM output (untrusted): if not an array, stringify then split by comma/whitespace —
  // calling .split on a non-string would crash, and models often produce "a, b" comma strings
  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.map((t) => String(t)).filter(Boolean)
    : String(candidate.tags ?? "").split(/[\s,]+/).filter(Boolean)

  if (scope === "personal") {
    const id = await put(memory, { type: candidate.type, title: candidate.title, content: candidate.content, tags: tags.join(" ") })
    return `personal#${id}`
  }
  if (scope === "project") {
    if (!opts.projectDir) throw new Error("project scope unavailable — no project directory configured (set memory.projectDir in ~/.thincoder/config.json)")
    const filename = await putMarkdown(memory, {
      layer: "project", dir: opts.projectDir,
      type: candidate.type, title: candidate.title, content: candidate.content,
      tags, author: opts.author ?? "unknown",
    })
    return `project:${filename}`
  }
  if (scope === "team") {
    if (!opts.team?.dir) throw new Error("team scope not configured — configure memory.team in ~/.thincoder/config.json")
    const filename = await putMarkdown(memory, {
      layer: "team", dir: opts.team.dir,
      type: candidate.type, title: candidate.title, content: candidate.content,
      tags, author: opts.author ?? "unknown",
    })
    await commitAndPush(opts.team.dir, filename, `memory: [${candidate.type}] ${candidate.title} (distilled)`)
    return `team:${filename}`
  }
  throw new Error(`unknown scope: ${scope}`)
}
