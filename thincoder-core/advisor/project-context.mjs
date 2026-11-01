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
 * manifest's `docRoot` (the one place that says where the docs live); the standards face
 * is the project's OWN declaration too (`docRoot.standards`) — the probe was retired, the
 * declaration replaced guessing — and it degrades in three machine-distinguishable states:
 * undeclared (no path), declared but unreadable (the declared path is named), and injected.
 */
import { readFileSync, existsSync } from "node:fs"
import { resolve, join, relative, dirname, sep } from "node:path"
import { providerSpec } from "../config.mjs"
import { DEFAULT_MANIFEST, docRootPaths, manifestFilePath, readManifest } from "../manifest.mjs"

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
 * 态 2 —— 声明了标准档，但一份都读不到（文案单源 = `docs/core/design/MANIFEST.md` §2.12）。
 * 与 `NO_STANDARDS_NOTICE` **不得同形**：那句说的是「没有任何东西声明」，而这里恰好是「声明了但
 * 读不到」。同形会让作者以为自己没声明过，回头去补一个其实已经有的声明——所以本句必带声明路径；
 * `reason` 两因分列（`no such file` 修路径 ∥ `read failed: <code>` 修权限）。
 * @param {{path: string, reason: string}} p — 声明路径（绝对形）+ 读不到的原因
 * @returns {string}
 */
export const STANDARDS_UNREADABLE_NOTICE = ({ path, reason }) =>
  `(Project standards declared at ${path} in the manifest, but unreadable — ${reason};\n` +
  "the methodology-compliance criterion is unchecked.\n" +
  "Fix the path or the file — do NOT declare it again. State the limitation in your findings.)"

/**
 * 半读句 —— 多份声明里有几份读不到（态 3 的下半；KD-M1-61 拒掉「只注入首份」：其余既不注入也不报
 * = 静默丢声明，与需求档 §5.1 验收 ③「任何一面都不得静默跳过」相抵）。
 * @param {{unreadable: string[]}} p — 逐份 `"<路径>: <原因>"`（路径绝对形）
 * @returns {string}
 */
export const STANDARDS_PARTIAL_NOTICE = ({ unreadable }) =>
  `(Of the standards declared in the manifest, these could not be read — ${unreadable.join("; ")};\n` +
  "the standard set above is INCOMPLETE. Fix them — do NOT declare them again. State the limitation in your findings.)"

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

/** 消息里的路径书写（\ → /）：与 `injectProjectGuide` 的根注记同款（`relative(...).split(sep).join("/")`），
 *  且让「声明路径字面」在消息里可 grep（`docs/nope` 而非 `docs\nope`）。读盘仍用原样路径。 */
const displayPath = (p) => String(p).replaceAll("\\", "/")

/**
 * Inject the project standards section (PO-2 · 判据 ∥ 文案单源 = `docs/core/design/MANIFEST.md` §2.12).
 *
 * 三态（**可机判互异**，本面立身之本 = 用声明、不猜固定名）：
 *   态 1 未声明 —— `docRoot.standards` 缺键 / `null` / 一个路径都没得来 ⇒ `NO_STANDARDS_NOTICE`
 *        （零路径字面、零 `declared`）。
 *   态 2 声明了但读不到 —— 声明了路径、逐份都不可读 ⇒ `STANDARDS_UNREADABLE_NOTICE`（点名**声明了
 *        的绝对路径** + 原因）。绝不与态 1 同形。
 *   态 3 读到 —— 正文注入（多份 = 按声明序拼接）；部分读不到时正文在前、半读句点名不可读的逐份。
 *
 * 取值源 = `read.ok && read.manifest ? read.manifest : DEFAULT_MANIFEST`（同 `declaredDocRoots` 先例，
 * 不另立第二套判定）⇒ 整档缺失 / 非法一律 `std === null` ⇒ 态 1；`paths.length === 0 ⇒ 态 1` 是硬不
 * 变量——态 2 句永不含 `undefined` 路径。数据档本身读抛（非 ENOENT）收为态 2 族，不中断消息组装。
 *
 * @param {Object} agent — the parent agent（`cwd` / provider 取上下文窗口）
 * @param {string[]} parts — message parts (mutated)
 * @param {string|null} [root] — project root from the guide walk（`null` ⇒ `agent.cwd`；与
 *   `injectDocumentMap` 同一 base）
 * @returns {string|string[]|null} 注入的标准档绝对路径（单份 = 串，多份 = 数组）；降级 ⇒ null
 */
export function injectProjectStandards(agent, parts, root) {
  parts.push("## Project Standards")
  const base = root ?? agent.cwd

  // 数据档本身读抛（权限 / 目录等——`readManifest` fail-closed 上抛）：收为态 2 族，不冒 `undefined`。
  let read
  try {
    read = readManifest(base)
  } catch (e) {
    parts.push(STANDARDS_UNREADABLE_NOTICE({ path: displayPath(manifestFilePath(base)), reason: `manifest read failed: ${e?.code ?? "unknown"}` }))
    parts.push("")
    return null
  }

  const std = (read.ok && read.manifest ? read.manifest : DEFAULT_MANIFEST).docRoot.standards
  // 态 1（两入口）：未声明（缺键 / null / undefined）∥ 声明了但一个合法路径都没得来。
  // 后者是硬不变量：宁可判「未声明」，也绝不发一句带 `undefined` 的「declared at …」。
  const paths = std == null ? [] : docRootPaths(std, base)
  if (paths.length === 0) {
    parts.push(NO_STANDARDS_NOTICE) // degraded — visible by contract
    parts.push("")
    return null
  }

  const readable = []
  const unreadable = []
  for (const p of paths) {
    if (!existsSync(p)) { unreadable.push({ path: p, reason: "no such file" }); continue }
    try {
      readable.push({ path: p, text: readFileSync(p, "utf8") })
    } catch (e) {
      unreadable.push({ path: p, reason: `read failed: ${e?.code ?? "unknown"}` })
    }
  }
  // 态 2：声明了，一份都读不到。
  if (readable.length === 0) {
    parts.push(STANDARDS_UNREADABLE_NOTICE({ path: displayPath(unreadable[0].path), reason: unreadable[0].reason }))
    parts.push("")
    return null
  }

  // 态 3：正文（多份 = 按声明序拼接，共用一次注入的同一预算——一次评审注入就是一个预算单位）。
  parts.push("The file below is the project's standards document. Judge methodology compliance against it.")
  parts.push("")
  const body = readable.map((r) => r.text).join("\n\n")
  // 预算算式复用同两条常量、**逐注入独立计算**（不与指南共享池——两面语义不同，不该互相记账）。
  // providerSpec 取值在 body 之外算：上下文规格查不到也不得伪装成「没有标准档」。
  const resolvedProvider = agent.provider ?? agent._provider
  const ctx = providerSpec(resolvedProvider).context
  const cap = Math.max(PROJECT_GUIDE_MIN, Math.floor(ctx * PROJECT_GUIDE_FRACTION))
  let shown = body
  // 计量与切片**同一单位**（码点）：两条口径混用会让含星平面字符（emoji / 生僻字）的标准档在
  // 「其实全给了」时也报 PARTIAL、并给出 truncated at N of M 的假读数（M 是 UTF-16 长度）。
  const chars = [...body]
  if (chars.length > cap) {
    // 被截断的那一份（拼接期已有逐份偏移；偏移同以码点计）——恢复指针必须指向它，否则评审拿着残缺规矩判。
    let offset = 0
    let cut = readable[readable.length - 1].path
    for (const r of readable) {
      const len = [...r.text].length
      if (cap < offset + len) { cut = r.path; break }
      offset += len + 2 // +2 = 拼接分隔符 "\n\n"
    }
    // 截断的风险不在大小，在**静默**：指南截断丢的是指针，标准档截断丢的是判据本身。
    shown = chars.slice(0, cap).join("") + `\n\n…(truncated at ${cap} of ${chars.length} chars — the standard set is PARTIAL;\nread the full file — ${displayPath(cut)} — for the rest)`
  }
  parts.push(shown)
  // 半读句：正文在前，缺口逐份点名（零静默——KD-M1-61）。
  if (unreadable.length > 0) {
    parts.push(STANDARDS_PARTIAL_NOTICE({ unreadable: unreadable.map((u) => `${displayPath(u.path)}: ${u.reason}`) }))
  }
  parts.push("")
  return readable.length === 1 ? readable[0].path : readable.map((r) => r.path)
}
