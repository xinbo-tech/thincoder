/**
 * advisor/repos.mjs — git repository discovery and change collection for advisor reviews.
 * Shared by message building (advisor.mjs) and the review runner (advisor/run.mjs).
 */
import { execFileSync } from "node:child_process"
import { dirname, basename, resolve } from "node:path"

export const GIT_TIMEOUT = 5_000
export const MAX_EMBEDDED_DIFF = 50_000

/**
 * Find the git repository roots that contain the agent's touched files.
 * Falls back to cwd if no repos found.
 */
export function findReviewRepos(agent, paths = null) {
  const touched = agent._touchedFiles ?? []
  const sources = paths ? [...touched, ...paths.map((p) => resolve(agent.cwd, p))] : touched
  const repos = []

  for (const abs of sources) {
    try {
      const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: dirname(abs), encoding: "utf8", timeout: GIT_TIMEOUT,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim()
      if (root && !repos.includes(root)) repos.push(root)
    } catch { /* not a git repo */ }
  }

  if (repos.length > 0) return repos

  // Fallback: cwd itself
  try {
    const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: agent.cwd, encoding: "utf8", timeout: GIT_TIMEOUT,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
    if (root) return [root]
  } catch { /* not a git repo */ }

  return []
}

/**
 * Collect git status + diff for each repo, embedded into the review context so
 * the advisor doesn't need to spend its first tool calls discovering changes.
 */
export function collectRepoSnapshots(repos, cwd) {
  const targets = repos.length > 0 ? repos : [cwd]
  const parts = []
  for (const repo of targets) {
    let status, diff
    try {
      status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repo, encoding: "utf8", timeout: GIT_TIMEOUT, stdio: ["ignore", "pipe", "pipe"],
      }).trim()
      diff = execFileSync("git", ["diff", "HEAD"], {
        cwd: repo, encoding: "utf8", timeout: GIT_TIMEOUT, stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 8 * 1024 * 1024,
      })
    } catch { continue /* not a git repo or git failed */ }
    if (!status && !diff.trim()) continue
    parts.push(`### ${repo}`)
    if (status) parts.push("```", status, "```")
    if (diff.trim()) {
      const truncated = diff.length > MAX_EMBEDDED_DIFF
      // Prepend a blockquote explaining diff notation to the LLM so it doesn't
      // treat deleted lines (-) as still-present content (phantom-issue fix).
      parts.push("**⚠️ IMPORTANT:** In the diff below, `-` lines are **REMOVED** (no longer in the file); `+` lines are **ADDED**. Always `read` the actual file for its current state — never treat a `-` line as still-present content.")
      parts.push("```diff", truncated ? diff.slice(0, MAX_EMBEDDED_DIFF) : diff.trimEnd(), "```")
      if (truncated) parts.push(`(diff truncated at ${MAX_EMBEDDED_DIFF} chars — use the git tool to see the rest)`)
    }
  }
  return parts
}

/** List changed file paths (including untracked) across repos — used by design review
 *  so the advisor knows which files to read even when git diff HEAD can't show them.
 *  Multi-repo: each path is annotated with its repo basename so the advisor can resolve it. */
export function collectChangedFiles(repos, cwd) {
  const targets = repos.length > 0 ? repos : [cwd]
  const files = []
  for (const repo of targets) {
    try {
      const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repo, encoding: "utf8", timeout: GIT_TIMEOUT, stdio: ["ignore", "pipe", "pipe"],
      }).trim()
      const repoLabel = targets.length > 1 ? `[${basename(repo)}] ` : ""
      for (const line of status.split("\n")) {
        // "XY path" or "XY old -> new" (rename) — take the final path, strip quotes
        const pathParts = line.slice(3).split(" -> ")
        const p = pathParts[pathParts.length - 1].trim().replace(/^"|"$/g, "")
        if (p) files.push(repoLabel + p)
      }
    } catch { /* not a git repo — skip */ }
  }
  return files
}

const DOC_FILE = /(?:^|[/\\])(?:LICENSE|NOTICE|CHANGELOG|AUTHORS)(?:\.\w+)?$|\.(?:md|markdown|mdx|txt|rst|adoc)$/i

/** True when a path matches the doc/license pattern by extension or name.
 *  NOTE: this is extension-based only — it does NOT exclude src/ paths.
 *  Callers must separately check the src/ prefix for product-code semantics
 *  (e.g. src/prompts/*.md IS product code despite matching DOC_FILE).
 *  See isDocOnlyChange for the combined check. */
export function isDocFile(p) {
  return DOC_FILE.test(p ?? "")
}

/** Temporary/scratch files that must NOT count as code mutations: tmp-* named
 *  scratch scripts (tmp-c1.mjs, tmp-check.mjs…) and .tmp/.temp extensions.
 *  The advisor/verify guards skip these — a throwaway diagnostic script is not
 *  a code change, and writing one must not push the agent into a review loop
 *  (CLI repos.mjs TEMP_FILE parity). Basename match at ANY depth — _touchedFiles
 *  stores absolute paths, so the pattern must work for "D:/proj/tmp-check.mjs". */
const TEMP_FILE = /(?:^|[/\\])tmp-[^/\\]+$|\.(?:tmp|temp)$/i

/** True when a path is a throwaway temp file (tmp-* name or .tmp/.temp ext).
 *  Excluded from code-mutation detection so scratch scripts don't trigger
 *  advisor/verify guards. */
export function isTempFile(p) {
  return TEMP_FILE.test(p ?? "")
}

/** True when a path counts as a CODE mutation: src/ is unconditional (incl.
 *  src/prompts/*.md — product code); temp/doc exclusions apply only outside
 *  src/ (CLI hasCodeMutations isCodePath parity — L58). */
export function isCodePath(p) {
  return /(?:^|[\\/])src[\\/]/.test(p ?? "") || (!isTempFile(p) && !isDocFile(p))
}

/** True when all changed files across repos are documentation (md/txt/LICENSE etc.).
 *  Anything under src/ (incl. src/prompts/*.md) counts as product code —
 *  isProductCode semantics, consistent with the design gate. */
export function isDocOnlyChange(repos, cwd) {
  const targets = repos.length > 0 ? repos : [cwd]
  let sawChanges = false
  for (const repo of targets) {
    let status
    try {
      status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repo, encoding: "utf8", timeout: GIT_TIMEOUT, stdio: ["ignore", "pipe", "pipe"],
      }).trim()
    } catch { continue /* repo inaccessible — check the rest */ }
    if (!status) continue
    sawChanges = true
    for (const line of status.split("\n")) {
      // porcelain: "XY path" or "XY old -> new" (rename)
      const filePath = line.slice(3).split(" -> ").pop().replace(/^"|"$/g, "")
      if (/^src[\\/]/.test(filePath) || !DOC_FILE.test(filePath)) return false
    }
  }
  return sawChanges
}
