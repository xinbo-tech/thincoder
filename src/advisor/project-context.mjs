/**
 * advisor/project-context.mjs — project-context discovery and injection for review
 * messages (Project Guide, document map, project standards, change-set context).
 *
 * Split out of messages.mjs (PORTABILITY VSC mirror · VP-1/VP-2/VP-8/VP-12): the
 * injection surface grew a Project Guide block and three visible-degradation
 * branches; messages.mjs keeps message ASSEMBLY, this module owns DISCOVERY.
 *
 * Portability contract (FR10/FR11/FR15): every discovery step here is either
 * satisfied or DEGRADED VISIBLY. The old code probed a fixed `docs/design/README.md`
 * map and a fixed `METHODOLOGY.md` standards file and skipped injection silently when
 * absent — in a project with a different layout the reviewer still scored the
 * dimension it could no longer check (silent failure, the worst class: invisible and
 * unfixable by the user). Missing pieces now say so, and the reviewer is told to
 * state the limitation in its findings. Projects can point at their own files through
 * `.thincoder/conventions.json` (advisor.docMap / advisor.standardsDoc).
 *
 * Semantics are shared with the CLI twin (thincoder/src/advisor/project-context.mjs)
 * — two independent implementations, one contract.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve, join, relative, dirname, sep } from "node:path"
import { providerSpec } from "../config.mjs"
import { loadConventions } from "../conventions.mjs"

/** Project guide (AGENTS.md) injection budget — decision 2026-08-08:
 *  NO fixed truncation; long-context models (1M+) get up to 5% of their context
 *  window, small windows still get a floor so the map is always visible. The guide
 *  is what tells the reviewer WHERE the requirements docs live (requirement-fit is
 *  judged against those docs, not the conversation only). */
const PROJECT_GUIDE_MIN = 8192 // chars — floor for small-window models
const PROJECT_GUIDE_FRACTION = 0.05 // 5% of the reviewer model's context window

/** Absent-AGENTS.md notice (guide is optional: the conversation carries intent). */
export const NO_GUIDE_NOTICE = "(No AGENTS.md found — neither at the working directory root nor in any review-scope subdirectory. Judge the user's requirements from the conversation background, and say so explicitly if the requirements are unclear.)"

/** Explicit degradation sentences (verbatim — messages are end-agnostic and shared
 *  with the CLI delivery; NEVER silently skip a discovery step). */
export const NO_DOC_MAP_NOTICE = "(No document map found under the project root, and none is declared — the Document ownership criterion is degraded: check placement against the Project Guide where present, and state the limitation in your findings.)"
export const NO_STANDARDS_NOTICE = "(No project standards document was declared — judge methodology compliance from the Project Guide (when present) and the review criteria above; state the limitation in your findings.)"
export const NO_GIT_NOTICE = "(No git repository detected — change-set context is unavailable; read the review-scope files directly.)"

/**
 * Discover the project root for the review — the project root is a SUBDIRECTORY of
 * the working directory, never an ancestor above it. Priority:
 *   1. Walk UP from each review-scope file's directory, bounded by cwd —
 *      the NEAREST AGENTS.md inside the workspace wins. In a monorepo this is
 *      the subproject's own guide even when cwd itself has an AGENTS.md (a
 *      workspace-level meta map must not shadow the subproject guide).
 *   2. No scope files / nothing found → cwd (single project; the walk's
 *      last step naturally lands on cwd's own AGENTS.md when it exists).
 * @param {string} cwd — the agent's working directory (workspace root)
 * @param {string[]} scopeFiles — cwd-relative review-scope paths (may be empty)
 * @returns {string|null} absolute project root with an AGENTS.md, or null
 */
export function findProjectRoot(cwd, scopeFiles) {
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
 * Inject the project guide (AGENTS.md) into the review message. The guide maps the
 * project — it defines the structure and where requirements/design documents live.
 * The reviewer must see it FIRST: requirement-fit is judged against the documents
 * it points to, with the conversation background as a supplement. Absent AGENTS.md
 * degrades honestly (no pretending there is a map).
 * @param {Object} agent — the parent agent
 * @param {string[]} parts — message parts (mutated)
 * @param {string[]} [scopeFiles] — cwd-relative review-scope paths for project-root discovery
 * @returns {string|null} the discovered project root (abs), or null when no guide
 */
export function injectProjectGuide(agent, parts, scopeFiles = []) {
  parts.push("## Project Guide (AGENTS.md)")
  const root = findProjectRoot(agent.cwd, scopeFiles)
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
  // providerSpec: the guide budget follows the provider-level context override
  // (PROVIDER.md §15 — advisor messages budget is context-based). VSC agents hold
  // the resolved provider on `_provider` (setup.mjs run binding).
  const ctx = providerSpec(agent._provider).context
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

/**
 * Inject the project document map. Resolution: the DECLARED path
 * (`advisor.docMap`, project-root-relative) wins; the built-in probe
 * (`docs/README.md` → `docs/design/README.md`) stays as a fallback for projects
 * laid out that way. Neither usable → an explicit degradation sentence — never a
 * silent skip: the reviewer must know the Document-ownership criterion is unchecked.
 * @returns {string|null} the injected map path, or null when degraded
 */
export function injectDocumentMap(agent, parts, root) {
  const base = root ?? agent.cwd
  const conv = loadConventions(agent.cwd)
  let mapPath = null
  if (conv.advisor.docMap) {
    const declared = resolve(base, conv.advisor.docMap)
    if (existsSync(declared)) mapPath = declared
  } else {
    mapPath = [resolve(base, "docs", "README.md"), resolve(base, "docs", "design", "README.md")]
      .find((p) => existsSync(p)) ?? null
  }
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
 * Inject the project standards document. DECLARATION ONLY
 * (`advisor.standardsDoc`, project-root-relative): the old hardcoded
 * `METHODOLOGY.md` probe injected a file most projects do not have — and its
 * absence was silent. Undeclared (or unreadable) → explicit degradation sentence.
 * @returns {string|null} the injected standards path, or null when degraded
 */
export function injectProjectStandards(agent, parts, root) {
  const base = root ?? agent.cwd
  const conv = loadConventions(agent.cwd)
  const declared = conv.advisor.standardsDoc ? resolve(base, conv.advisor.standardsDoc) : null
  parts.push("## Project Standards")
  let text = null
  if (declared && existsSync(declared)) {
    try {
      text = readFileSync(declared, "utf8")
    } catch (e) {
      console.warn(`[advisor] project standards unreadable at ${declared}: ${e.message}`)
    }
  }
  if (text === null) {
    parts.push(NO_STANDARDS_NOTICE) // degraded — visible by contract
    parts.push("")
    return null
  }
  parts.push("The project declares these standards for this review. Judge the design/changes against them:")
  parts.push(text)
  parts.push("")
  return declared
}
