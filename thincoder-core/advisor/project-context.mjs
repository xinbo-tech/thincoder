/**
 * advisor/project-context.mjs — project-context discovery and injection for review
 * messages (Project Guide, document map, project standards, change-set context).
 *
 * Split out of messages.mjs (the split registered as D-1 in ENGINEERING-MODE.md
 * §2.26.3, trigger "thicken again" — met by this batch). messages.mjs keeps its
 * pre-split surface via re-export; this module is consumed by it only.
 *
 * Portability contract (PORTABILITY FR10/FR11 · PO-1/PO-2 · P8): every discovery
 * step here is either satisfied or DEGRADED VISIBLY. The old code probed a fixed
 * `docs/README.md` and a fixed `METHODOLOGY.md` and skipped injection silently when
 * absent — in a project with a different layout the reviewer still scored the
 * dimension it could no longer check (silent failure, the worst class: invisible
 * and unfixable by the user). Missing pieces now say so, and the reviewer is told
 * to state the limitation in its findings. The document map is derived from the
 * manifest's `docRoot` (the one place that says where the docs live); the standards
 * face has no derivable convention name and is therefore an explicit degradation.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve, join, relative, dirname, sep } from "node:path"
import { providerSpec } from "../config.mjs"
import { DEFAULT_MANIFEST, docRootPaths, readManifest } from "../manifest.mjs"

/** Project guide (AGENTS.md) injection budget — decision 2026-08-08:
 *  NO fixed truncation; long-context models (1M+) get up to 5% of their context
 *  window for the doc map, small windows still get a floor so the map is always
 *  visible. The map is what tells the reviewer WHERE the requirements docs live
 *  (requirement-fit is judged against those docs, not the conversation only). */
const PROJECT_GUIDE_MIN = 8192 // chars — floor for small-window models
const PROJECT_GUIDE_FRACTION = 0.05 // 5% of the reviewer model's context window

/** Absent-AGENTS.md notice (guide is optional: the conversation carries intent). */
export const NO_GUIDE_NOTICE = "(No AGENTS.md found — neither at the working directory root nor in any review-scope subdirectory. Judge the user's requirements from the conversation background, and say so explicitly if the requirements are unclear.)"

/** Explicit degradation sentences (PORTABILITY design §4.4 — verbatim). */
export const NO_DOC_MAP_NOTICE = "(No document map found — no README.md under the declared document roots and none at their common ancestor — the Document ownership criterion is degraded: check placement against the Project Guide where present, and state the limitation in your findings.)"
export const NO_STANDARDS_NOTICE = "(No project standards document — nothing in the project declares one — judge methodology compliance from the Project Guide (when present) and the review criteria above; state the limitation in your findings.)"
export const NO_GIT_NOTICE = "(No git repository detected — change-set context is unavailable; read the review-scope files directly.)"

/**
 * Discover the project root for the review — user decision 2026-08-08:
 * the project root is a SUBDIRECTORY of the working directory, never an
 * ancestor above it. Priority:
 *   1. Walk UP from each review-scope file's directory, bounded by cwd —
 *      the NEAREST AGENTS.md inside the workspace wins. In a monorepo this is
 *      the subproject's own doc map even when cwd itself has an AGENTS.md
 *      (a workspace-level meta map must not shadow the subproject guide).
 *   2. No scope files / nothing found → cwd (single project; the walk's
 *      last step naturally lands on cwd's own AGENTS.md when it exists).
 * @param {string} cwd — the agent's working directory (workspace root)
 * @param {string[]} scopeFiles — cwd-relative review-scope paths (may be empty)
 * @returns {string|null} absolute project root with an AGENTS.md, or null
 */
export function findGuideRoot(cwd, scopeFiles) {
  // Normalize separators before comparing: input paths may use either
  // convention (join() → "\\" on Windows; tool args / tests → "/"). Mixed
  // styles made isInside(cwd + sep) miss legitimately nested paths.
  const norm = (p) => p.replaceAll("\\", "/")
  const isInside = (dir) => {
    const d = norm(dir)
    const c = norm(cwd)
    return d === c || d.startsWith(c + "/")
  }
  for (const f of scopeFiles) {
    let dir = dirname(resolve(cwd, f))
    while (isInside(dir) && dir !== dirname(dir)) {
      if (existsSync(join(dir, "AGENTS.md"))) return dir
      dir = dirname(dir)
    }
  }
  // No scope files, or none found in the walk — cwd itself (its AGENTS.md is
  // checked as the walk's final step for scope files; for empty scopes, check
  // it explicitly so a bare cwd project still gets its guide).
  if (existsSync(join(cwd, "AGENTS.md"))) return cwd
  return null
}

/**
 * Inject the project guide (AGENTS.md) into the review message. AGENTS.md is the
 * project's doc map — it defines the structure and where requirements/design
 * documents live. The reviewer must see it FIRST: requirement-fit is judged
 * against the documents it points to, with the conversation background as a
 * supplement. Absent AGENTS.md degrades honestly (no pretending there is a map).
 * @param {Object} agent — the parent agent
 * @param {string[]} parts — message parts (mutated)
 * @param {string[]} [scopeFiles] — cwd-relative review-scope paths for project-root discovery
 * @returns {string|null} the discovered project root (abs), or null when no guide
 */
export function injectProjectGuide(agent, parts, scopeFiles = []) {
  parts.push("## Project Guide (AGENTS.md)")
  const root = findGuideRoot(agent.cwd, scopeFiles)
  const path = root ? join(root, "AGENTS.md") : null
  let text
  if (!path) {
    parts.push(NO_GUIDE_NOTICE)
    parts.push("")
    return null // no guide — requirement-fit falls back to the conversation
  }
  try {
    text = readFileSync(path, "utf8")
  } catch (e) {
    if (e.code !== "ENOENT") {
      // File exists but is unreadable (EACCES etc.) — log, don't masquerade as "not found".
      console.warn(`[advisor] AGENTS.md unreadable at ${path}: ${e.message}`)
    }
    parts.push(NO_GUIDE_NOTICE)
    parts.push("")
    return null // no guide — requirement-fit falls back to the conversation
  }
  // readFileSync succeeded — compute the budget OUTSIDE the try so a spec
  // lookup failure can never masquerade as "no AGENTS.md".
  // providerSpec: the project-guide budget follows the provider-level context
  // override (`ADVISOR-GUARDS.md §8` — advisor messages budget is context-based).
  // 字段名归一：解析后的 provider 挂点两端其一（`provider` 本体字段 / `_provider` 运载字段）
  // ——取在场者，两形态同语义（都指本回合生效的 provider 对象）。
  const resolvedProvider = agent.provider ?? agent._provider
  const ctx = providerSpec(resolvedProvider).context
  const cap = Math.max(PROJECT_GUIDE_MIN, Math.floor(ctx * PROJECT_GUIDE_FRACTION))
  const shown = text.length <= cap
    ? text
    : [...text].slice(0, cap).join("") + `\n\n…(truncated at ${cap} chars — read the full file if you need more)` // codepoint-safe slice: no broken surrogate pairs at the boundary
  parts.push(`<!-- Project root: ${relative(agent.cwd, path).split(sep).join("/")} (inferred from the review scope under ${agent.cwd}) -->`)
  parts.push("This file defines the project's structure and where its requirements/design documents live. Read the documents it points to — the user's requirements live THERE, not only in the conversation background.")
  parts.push("")
  parts.push(shown)
  parts.push("")
  return root // guide injected — requirement-fit criteria apply (truthy root)
}

/** `docRoot` probe order: the face a reviewer needs first (design) → down to the batch records. */
const DOC_ROOT_ORDER = ["design", "requirements", "specs", "modules", "batches"]

/** Declared document roots as ABSOLUTE paths, in declaration order (`null` / missing face ⇒ no root). */
function declaredDocRoots(base) {
  const read = readManifest(base)
  const docRoot = (read.ok && read.manifest ? read.manifest : DEFAULT_MANIFEST).docRoot ?? {}
  const out = []
  for (const key of DOC_ROOT_ORDER) {
    for (const p of docRootPaths(docRoot[key], base)) if (!out.includes(p)) out.push(p)
  }
  return out
}

/** Common ancestor of every root (segment-wise — `docs/design` and `docs/designX` are not siblings).
 *  A lone drive root is no map home ⇒ null. */
function commonAncestor(paths) {
  if (paths.length === 0) return null
  const split = (p) => p.split(/[\\/]+/)
  let acc = split(paths[0])
  for (const p of paths.slice(1)) {
    const segs = split(p)
    let i = 0
    while (i < acc.length && i < segs.length && acc[i] === segs[i]) i++
    acc = acc.slice(0, i)
  }
  if (acc.length === 0) return null
  const joined = acc.join(sep)
  return /^[A-Za-z]:$/.test(joined) ? null : joined
}

/**
 * Discover the document map from the manifest's `docRoot` — a pure fs probe, no index generation
 * (the map is a hand-maintained register; a generated one would be a second index, and a second
 * index is exactly the duplicate pointer the retired declaration face used to create).
 * Ladder: ① `README.md` under each declared doc root (declaration order) ② `README.md` at the common
 * ancestor of every declared root. Neither ⇒ null (caller injects `NO_DOC_MAP_NOTICE` — no silent skip).
 * @param {string} base project root (or any dir inside it — `docRoot` resolves against the project root)
 * @returns {string|null} absolute path of the map file, or null when degraded
 */
export function findDocumentMap(base) {
  const roots = declaredDocRoots(base)
  for (const r of roots) {
    const p = join(r, "README.md")
    if (existsSync(p)) return p
  }
  const ancestor = commonAncestor(roots)
  if (!ancestor) return null
  const p = join(ancestor, "README.md")
  return existsSync(p) ? p : null
}

/**
 * Inject the project document map (PO-1), derived from `docRoot`. Degrades visibly: the reviewer
 * must know the Document-ownership criterion is unchecked — never a silent skip.
 * @returns {string|null} the injected map path, or null when degraded
 */
export function injectDocumentMap(agent, parts, root) {
  const base = root ?? agent.cwd
  const mapPath = findDocumentMap(base)
  parts.push("## Document Map")
  let text = null
  if (mapPath) {
    try {
      text = readFileSync(mapPath, "utf8")
    } catch (e) {
      console.warn(`[advisor] document map unreadable at ${mapPath}: ${e.message}`)
    }
  }
  if (text === null) {
    parts.push(NO_DOC_MAP_NOTICE) // degraded — visible by contract
    parts.push("")
    return null
  }
  parts.push("The document map below registers which document files exist per section. Use it for the Document ownership criterion: a change for an existing section must amend that section's document, not create a new file.")
  parts.push(text)
  parts.push("")
  return mapPath
}

/**
 * Inject the project standards section (PO-2). The declaration face is gone with the manifest
 * `advisor` key, and no standards file name is derivable from what the project does declare (the old
 * `METHODOLOGY.md` probe was deleted exactly because most projects have none). The section stays so the
 * reviewer is TOLD the dimension is unchecked — visible degradation, not a silent skip.
 * @returns {null} always degraded
 */
export function injectProjectStandards(_agent, parts, _root) {
  parts.push("## Project Standards")
  parts.push(NO_STANDARDS_NOTICE) // degraded — visible by contract
  parts.push("")
  return null
}
