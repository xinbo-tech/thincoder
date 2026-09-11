/**
 * citations.mjs — host-verified citation checking (decision d698434).
 * Extracted from advisor/run.mjs (file-size split). The evidence rule becomes
 * a host fact: every `file:line: content` reference in a review is mechanically
 * checked against the CURRENT disk state; mismatches mark the finding
 * unverified and cannot support a push-back.
 *
 * 第 11 批（C / F14 / §14.5）：解析候选 = cwd + **评审对象声明范围派生根**（声明仓根 /
 * 声明文件目录 / 声明目录——纯路径派生，零扫描、零 git）；命中判据三条件全中（围栏内 ∧
 * 可读 ∧ 目标行含引文内容）⇒ 零新增假命中。失败原因三分（file unreadable /
 * content mismatch @ path / path traversal）——父侧不再人肉复核。
 */
import { readFileSync, realpathSync } from "node:fs"
import { resolve, relative, dirname, extname, sep, isAbsolute, join } from "node:path"

// `file:line: content` citations — the file group is narrowed to source/config
// extensions so URLs (`example.com:8080: …`) don't become false-positive
// citations that fail as "file unreadable" in the verification report.
// Single-letter extensions (c/h) are kept — false positives (e.g. "a.c:1: x")
// are rare and only add a failed-citation line to the report; the report is
// advisory for the parent agent, never a crash path.
const CITATION_RE = /([\w./\\-]+\.(?:mjs|cjs|js|ts|jsx|tsx|mts|cts|py|rs|go|c|h|cpp|hpp|java|rb|php|sh|bash|json|md|markdown|mdx|yaml|yml|toml|css|html)):(\d+):\s*([^`\n]{4,})/g

/** Extract `file:line: content` citations from a review text. */
export function extractCitations(text) {
  const out = []
  for (const m of text.matchAll(CITATION_RE)) {
    out.push({ file: m[1], line: Number(m[2]), content: m[3].trim() })
  }
  return out
}

/** 候选解析根（§14.5——纯路径派生，候选顺序 = cwd → 各声明路径的派生根）：
 *  声明仓根（`cwd/<segs[0]>`）与 声明文件目录 / 声明目录本身。声明在 cwd 之外 → 不派生
 *  （relative 越出 cwd 或跨盘符——候选与声明脱节即假命中面）。 */
function citationRoots(cwd, scope) {
  const base = resolve(cwd)
  const roots = [base]
  for (const s of Array.isArray(scope) ? scope : []) {
    if (typeof s !== "string" || !s.trim()) continue
    const abs = resolve(base, s)
    const rel = relative(base, abs)
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) continue
    const segs = rel.split(/[\\/]/).filter(Boolean)
    if (segs.length === 0) continue
    const repoRoot = join(base, segs[0])
    const declaredDir = extname(abs) ? dirname(abs) : abs
    for (const r of [repoRoot, declaredDir]) if (!roots.includes(r)) roots.push(r)
  }
  return roots
}

/** 单引文解析（§14.5）：按候选顺序试 `resolve(root, file)`；三条件全中才算命中。
 *  @returns {{matched: true, root: string, resolved: string}|{matched: false, reason: string}} */
function resolveCitation(citation, roots, base) {
  const fence = base + sep
  let mismatch = null
  let traversal = false
  for (const root of roots) {
    let real
    try {
      // Path confinement: citation paths are LLM-generated — never trust them.
      // A hallucinated "../config.json" would otherwise read (and leak via the
      // report) files outside the project, including API-key configs.
      // realpathSync resolves symlinks too — a link inside the project that
      // points outside must not pass the prefix check.
      real = realpathSync(resolve(root, citation.file))
    } catch {
      continue // 该候选无此文件（或不可解析）——试下一候选
    }
    if (!real.startsWith(fence)) { traversal = true; continue }
    let line = ""
    try {
      line = readFileSync(real, "utf8").split("\n")[citation.line - 1] ?? ""
    } catch {
      continue // 存在但读不了（目录等）——按未命中处理，试下一候选
    }
    if (line.includes(citation.content)) {
      return { matched: true, root, resolved: relative(base, real).split(sep).join("/") }
    }
    mismatch ??= real
  }
  if (mismatch) return { matched: false, reason: `content mismatch @ ${relative(base, mismatch).split(sep).join("/")}` }
  if (traversal) return { matched: false, reason: "path traversal" }
  return { matched: false, reason: "file unreadable" }
}

/**
 * Mechanically verify citations against the CURRENT file state: read the file,
 * take the exact line, check it CONTAINS the quoted content. Reports
 * N/M matched + the mismatches. Unverified citations cannot support a
 * push-back — the evidence rule becomes a host fact, not a prompt wish.
 * @param {string} text — the review text
 * @param {string} cwd — the agent's working directory (workspace root)
 * @param {{scope?: string[]}} [opts] — scope = 评审对象声明路径（documents + paths）；
 *   省略 ⇒ 旧行为（仅 cwd 候选——签名向后兼容）。
 */
export function verifyCitations(text, cwd, opts = {}) {
  const citations = extractCitations(text)
  const matched = []
  const failed = []
  const base = resolve(cwd)
  const roots = citationRoots(cwd, opts?.scope)
  for (const c of citations) {
    const r = resolveCitation(c, roots, base)
    if (r.matched) {
      // 命中根记录（§14.5）：经派生根解析（非 cwd 直解）的命中在报告中注明解析路径。
      matched.push(r.root === base ? c : { ...c, root: r.root, resolved: r.resolved })
    } else {
      failed.push({ ...c, reason: r.reason })
    }
  }
  return { total: citations.length, matched, failed }
}

/** Append the verification report to the review text (visible to the parent agent). */
export function appendCitationReport(text, cwd, opts = {}) {
  const { total, matched, failed } = verifyCitations(text, cwd, opts)
  if (total === 0) return text // no citations — nothing to verify
  const lines = [
    "",
    "---",
    `[host-verified] ${matched.length}/${total} citations match current file state.`,
  ]
  // 命中根透明（F14/§14.5）：经声明范围派生根解析的命中逐条注明解析路径（cwd 直解的不列
  // ——零噪音；列的正是修复前会被误报为 unreadable 的裸路径引用）。
  const derived = matched.filter((c) => c.resolved)
  if (derived.length > 0) {
    lines.push("Citations resolved via the declared review scope (bare path — resolved root noted):")
    for (const c of derived.slice(0, 10)) lines.push(`- ${c.file}:${c.line} → ${c.resolved}`)
  }
  if (failed.length > 0) {
    lines.push("Citations that do NOT match the current file state (treat their claims as unverified):")
    for (const f of failed.slice(0, 10)) {
      lines.push(`- ${f.file}:${f.line}: ${f.content.slice(0, 80)}${f.reason ? ` (${f.reason})` : ""}`)
    }
  }
  return text + lines.join("\n")
}
