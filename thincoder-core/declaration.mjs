/**
 * declaration.mjs — 声明装载面（PROJECT-MANIFEST.json 三族 `codePaths` / `index.*` / `advisor.*`）
 * · 自 `conventions.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786。
 * 投影单源 = `manifest.mjs`（ONE reader / ONE root resolution——`readManifest` + `manifestFilePath`；
 * name / shape / defaults = schema 面 `docs/core/design/MANIFEST.md` §2.2）。迁出块逐字；
 * 原档 `conventions.mjs` 经 `export { … } from` 转口保名（消费面 / 批内件 import 面零改）。
 */
import { existsSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { DEFAULT_MANIFEST, manifestFilePath, readManifest } from "./manifest.mjs"
import { logEvent } from "./log.mjs"

/** Retired declaration carrier (project-root relative). Its EXISTENCE is checked, its
 *  content is never read — the declaration surface = the manifest three families (KD-M1-34). */
const RETIRED_REL_PATH = ".thincoder/conventions.json"

// ─────────────────────────────────────────────────────────────────────────────
// Declaration loading — the three families of PROJECT-MANIFEST.json, projected
// through manifest.mjs (ONE reader / ONE root resolution) and cached per DATA-FILE
// PATH (`clearDeclarationCache()` is the test seam; declarations change rarely).
// ─────────────────────────────────────────────────────────────────────────────

function normalizeExtensions(v) {
  if (!Array.isArray(v)) return []
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const t = e.trim().toLowerCase()
    if (!t) continue
    const ext = t.startsWith(".") ? t : `.${t}`
    if (!out.includes(ext)) out.push(ext)
  }
  return out
}

/** Declared code paths replace the default (replacement, not union — §3.1). An EMPTY
 *  array is a legal declaration ("no segment-based code face") — only a non-array value
 *  falls back to `null` (⇒ caller keeps the default). */
function normalizeCodePaths(v) {
  if (!Array.isArray(v)) return null
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const s = e.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "")
    if (!s || out.includes(s)) continue
    out.push(s)
  }
  return out
}

/** 路径列表归一（单源——`index.excludePaths` §6.14 ∥ `index.publicRepos` §6.15 同款）：首部 `./` 剥离 · `\`→`/` · 去尾斜杠 · 空 ∕ 非串剔除 · 去重保序。 */
function normalizePathList(v) {
  if (!Array.isArray(v)) return []
  const out = []
  for (const e of v) {
    if (typeof e !== "string") continue
    const s = e.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "")
    if (!s || out.includes(s)) continue
    out.push(s)
  }
  return out
}

function normalizeString(v) {
  return typeof v === "string" && v.trim() ? v.trim() : ""
}

/** Project the manifest three families into the frozen declaration object.
 *  `declared` = VALUE comparison against the defaults — at least one family deviates
 *  (a key written with its default value still counts as NOT declared; the design-gate
 *  hint reads it to decide whether to point at the manifest, PORTABILITY §3.1).
 *  `root` = the project root this declaration belongs to (`dirname(manifestFilePath(cwd))` —
 *  the segment-matching face's anchor, D18); NOT a declared value (excluded from `declared`);
 *  `null` = unknown root (`DEFAULT_DECLARATION`). */
function buildDeclaration(m, root = null) {
  const codePaths = normalizeCodePaths(m?.codePaths) ?? [...DEFAULT_MANIFEST.codePaths]
  const codeExtensions = normalizeExtensions(m?.index?.codeExtensions)
  const docExtensions = normalizeExtensions(m?.index?.docExtensions)
  const excludePaths = normalizePathList(m?.index?.excludePaths)
  const publicRepos = normalizePathList(m?.index?.publicRepos)
  const docMap = normalizeString(m?.advisor?.docMap)
  const standardsDoc = normalizeString(m?.advisor?.standardsDoc)
  const defaults = normalizeCodePaths(DEFAULT_MANIFEST.codePaths) ?? []
  const pathsDiffer = codePaths.length !== defaults.length || codePaths.some((p, i) => p !== defaults[i])
  const declared = pathsDiffer || codeExtensions.length > 0 || docExtensions.length > 0 || excludePaths.length > 0 || publicRepos.length > 0 || Boolean(docMap) || Boolean(standardsDoc)
  return Object.freeze({
    declared,
    codePaths: Object.freeze(codePaths),
    index: Object.freeze({
      codeExtensions: Object.freeze(codeExtensions),
      docExtensions: Object.freeze(docExtensions),
      excludePaths: Object.freeze(excludePaths),
      publicRepos: Object.freeze(publicRepos),
    }),
    advisor: Object.freeze({ docMap, standardsDoc }),
    root,
  })
}

/** Full-default declaration (no manifest / unusable manifest) — the fallback every
 *  consumer gets; built from `DEFAULT_MANIFEST` so the default values stay single-source. */
export const DEFAULT_DECLARATION = buildDeclaration(null)

/** 排除前缀谓词（单源——§6.14 面①）：`rel`（**`base` 相对**——缺省视为根相对）命中声明前缀（恰等
 *  ∨ 后随 `/`——`openclaw` 不吞 `openclaw-fork`）⇒ true；缺省 `[]` ⇒ 恒 false（零行为变化）。
 *  `base`（调用面 cwd/origin·#700）= `rel` 的相对基：`resolve` + `relative` 换算至 `decl.root` 根面
 *  再比前缀（cwd = 项目根时与既有行为逐字等义）；换算越出根面（`..` 头 ∥ 根外绝对形）⇒ **不命中**
 *  （保守不排除——沉默洞方向收窄，与 D17 aux 面「indeterminate ⇒ 不匹配」同向）；`decl.root` 缺
 *  ⇒ `rel` 原样（根起步调用面等义）。 */
export function isExcludedRelPath(rel, decl, base = null) {
  const list = decl?.index?.excludePaths
  if (!Array.isArray(list) || list.length === 0) return false
  let s = String(rel ?? "").replace(/\\/g, "/")
  const root = decl?.root
  if (base != null && root) {
    const converted = relative(root, resolve(base, s)).replace(/\\/g, "/")
    if (converted === ".." || converted.startsWith("../") || isAbsolute(converted)) return false
    s = converted
  }
  return list.some((p) => p && (s === p || s.startsWith(`${p}/`)))
}

/**
 * 声明公共仓**绝对根集**（§6.15 解析层——检索同步 ∥ 读面 origin 集 ∥ 引用解析三消费面共用的单一定义，
 * 不得二写）：值形层逐项 `resolve(decl.root, p)` ⇒ 绝对根集（去重保序）；存在性判归消费面（本层不判）。
 * 缺省 `[]` ⇒ `[]`（零行为）。
 * @param {string} [cwd] 会话锚（项目根经 manifest.mjs 解析）
 * @returns {string[]} 绝对路径（去重保序）
 */
export function declaredPublicRoots(cwd) {
  const decl = loadProjectDeclaration(cwd)
  const list = decl?.index?.publicRepos
  if (!Array.isArray(list) || list.length === 0) return []
  const base = typeof decl.root === "string" && decl.root !== "" ? decl.root : resolve(cwd ?? ".")
  const out = []
  for (const p of list) {
    const abs = resolve(base, p)
    if (!out.includes(abs)) out.push(abs)
  }
  return out
}

const _cache = new Map()

/** Drop the per-data-file-path cache (test seam — declarations are read once per path). */
export function clearDeclarationCache() {
  _cache.clear()
}

/** Retired-carrier warning (existence check only — zero content parsing, zero fallback). */
function warnRetiredCarrier(root) {
  console.warn(`[declaration] ${RETIRED_REL_PATH} is retired and no longer read — move codePaths / index.*Extensions / advisor.{docMap,standardsDoc} into PROJECT-MANIFEST.json`)
  logEvent("declaration:retired-file", { cwd: root })
}

/**
 * Load (and cache) the normalized project declaration for a project.
 * The data file is located through `manifestFilePath(cwd)` (ONE root resolution — a cwd
 * deeper than the project root still reads the project's manifest) and read through
 * `readManifest` (ONE reader — this module carries no second parse of the manifest).
 * Missing manifest → defaults, silently (the returned `root` is still the project root —
 * `dirname(manifestFilePath(cwd))`, the face's anchor). Unusable manifest (invalid shape /
 * read error) → defaults + `console.warn` + a log event (visible degradation, never a throw).
 * A retired `.thincoder/conventions.json` at the manifest's project root → one warning
 * per cache miss (content zero-parsed, zero effect on the readings — KD-M1-34).
 * @param {string} cwd — project dir / anchor (root resolved by manifest.mjs)
 * @returns {Readonly<{declared: boolean, codePaths: readonly string[],
 *   index: {codeExtensions: string[], docExtensions: string[], excludePaths: string[], publicRepos: string[]},
 *   advisor: {docMap: string, standardsDoc: string}, root: string|null}>}
 */
export function loadProjectDeclaration(cwd) {
  const file = manifestFilePath(cwd) // data-file path (single source — manifest.mjs KD-M1-18)
  const hit = _cache.get(file)
  if (hit) return hit
  const root = dirname(file) // project root the manifest belongs to (cwd may be deeper) — the face's anchor
  if (existsSync(join(root, RETIRED_REL_PATH))) warnRetiredCarrier(root)
  let decl = buildDeclaration(null, root) // missing / unusable manifest → the defaults, root still known
  try {
    const r = readManifest(cwd)
    if (r.ok) {
      decl = buildDeclaration(r.manifest, root)
    } else if (r.reason !== "missing") {
      // Usable-file expectation broken (invalid JSON / wrong shape) → defaults, visible.
      console.warn(`[declaration] ${file} is not a usable declaration (${(r.errors ?? []).join("; ") || r.reason}) — falling back to defaults`)
      logEvent("declaration:error", { path: file, err: `invalid: ${(r.errors ?? []).join("; ")}`.slice(0, 200) })
    }
  } catch (e) {
    // Read error (EACCES …) — same visible degradation, never a throw.
    console.warn(`[declaration] ${file} not readable (${e?.message ?? e}) — falling back to defaults`)
    logEvent("declaration:error", { path: file, err: String(e?.message ?? e).slice(0, 200) })
  }
  _cache.set(file, decl)
  return decl
}
