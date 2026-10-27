/**
 * declaration.mjs — 声明装载面（PROJECT-MANIFEST.json 两族 `codePaths` / `index.*`）
 * · 自 `conventions.mjs` 迁出 · 2026-10-01 core 拆分批 #755 ∥ #786。
 * 投影单源 = `manifest.mjs`（ONE reader / ONE root resolution——`readManifest` + `manifestFilePath`；
 * name / shape / defaults = schema 面 `docs/core/design/MANIFEST.md` §2.2）。迁出块逐字；
 * 原档 `conventions.mjs` 经 `export { … } from` 转口保名（消费面 / 单元测试档 import 面零改）。
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, isAbsolute, join, parse, relative, resolve } from "node:path"
import { DEFAULT_MANIFEST, MANIFEST_REL, docRootPaths, manifestFilePath, onManifestInit, owningProject, readManifest } from "./manifest.mjs"
import { isSkippedRelPath } from "./memory/file-walk.mjs" // 面⑦ 子目录扫描的跳过段谓词单源（零环：file-walk 不引本档）
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

/** Project the manifest two families into the frozen declaration object.
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
  const batchRecords = batchSegments(m?.docRoot?.batches) // §6.14 面⑥ 声明值投影（`declared` 旗不涉——docRoot 族现状零改）
  const defaults = normalizeCodePaths(DEFAULT_MANIFEST.codePaths) ?? []
  const pathsDiffer = codePaths.length !== defaults.length || codePaths.some((p, i) => p !== defaults[i])
  const declared = pathsDiffer || codeExtensions.length > 0 || docExtensions.length > 0 || excludePaths.length > 0 || publicRepos.length > 0
  return Object.freeze({
    declared,
    codePaths: Object.freeze(codePaths),
    batchRecords: Object.freeze(batchRecords.map((s) => Object.freeze(s))),
    index: Object.freeze({
      codeExtensions: Object.freeze(codeExtensions),
      docExtensions: Object.freeze(docExtensions),
      excludePaths: Object.freeze(excludePaths),
      publicRepos: Object.freeze(publicRepos),
    }),
    root,
  })
}

/** Full-default declaration (no manifest / unusable manifest) — the fallback every
 *  consumer gets; built from `DEFAULT_MANIFEST` so the default values stay single-source. */
export const DEFAULT_DECLARATION = buildDeclaration(null)

/** 段序列归一（面⑥ 目标集）：值（串 ∥ 串数组——元素层归一同 `normalizePathList`）⇒ 实义段序列
 *  （空 ∥ `.` ∥ `..` 段剔除——空序列另剔，防恒真；去重保序）。 */
function batchSegments(v) {
  const out = []
  for (const e of normalizePathList(Array.isArray(v) ? v : v == null ? [] : [v])) {
    const segs = e.split("/").filter((s) => s && s !== "." && s !== "..")
    if (segs.length && !out.some((q) => q.length === segs.length && q.every((s, i) => s === segs[i]))) out.push(segs)
  }
  return out
}

/** 约定段（面⑥——`DEFAULT_MANIFEST.docRoot.batches` 单源派生；默认值改名/迁移两处同动）。 */
const DEFAULT_BATCH_SEGMENTS = batchSegments(DEFAULT_MANIFEST.docRoot.batches)

/** 排除谓词（单源——§6.14 面① 前缀 ∥ 面⑥ 批次档段序列；两族同一谓词全判，非第二判定面）：
 *  面⑥（2026-10-13 · 台账 #1366 · **无条件**——不看 `index.excludePaths` 是否配置）：`rel` 命中
 *  约定段 ∪ 声明值段序列（`decl.batchRecords`——`docRoot.batches` 投影）于**路径任意深度**
 *  （段边界 = 整段一致——`docs/batchesx` ∥ `doc/batches` 判假）⇒ true；`docRoot.batches: null`
 *  ⇒ 约定段恒在（无逃生口）；`decl` 缺 ⇒ 约定段照判。
 *  面①（前缀语义）：`rel`（**`base` 相对**——缺省视为根相对）命中声明前缀（恰等 ∨ 后随 `/`——
 *  `openclaw` 不吞 `openclaw-fork`）⇒ true；缺省 `[]` ⇒ 恒 false（零行为变化）。
 *  `base`（调用面 cwd/origin·#700）= `rel` 的相对基：`resolve` + `relative` 换算至 `decl.root` 根面
 *  再判（cwd = 项目根时与既有行为逐字等义）；换算越出根面（`..` 头 ∥ 根外绝对形）⇒ 面① **不命中**
 *  （保守不排除——沉默洞方向收窄，与 D17 aux 面「indeterminate ⇒ 不匹配」同向）∥ 面⑥ 按入参
 *  **原样 `rel`** 判（段序列面不回退——面① 不命中口径逐字零改）；`decl.root` 缺 ⇒ `rel` 原样
 *  （根起步调用面等义）。 */
export function isExcludedRelPath(rel, decl, base = null) {
  let s = String(rel ?? "").replace(/\\/g, "/")
  const root = decl?.root
  let inRoot = true
  if (base != null && root) {
    const converted = relative(root, resolve(base, s)).replace(/\\/g, "/")
    if (converted === ".." || converted.startsWith("../") || isAbsolute(converted)) inRoot = false
    else s = converted
  }
  // 面⑥ 段序列（约定段 ∪ 声明值——任意深度连续命中）；越根（`inRoot=false`）⇒ `s` 即原样 rel
  const segs = s.split("/").filter(Boolean)
  if ([...DEFAULT_BATCH_SEGMENTS, ...(decl?.batchRecords ?? [])].some((seq) => segs.some((_, i) => seq.every((q, j) => segs[i + j] === q)))) return true
  // 面① 前缀（既有口径逐字零改：缺省 `[]` ∥ 越根 ⇒ 不命中）
  const list = decl?.index?.excludePaths
  if (!Array.isArray(list) || list.length === 0 || !inRoot) return false
  return list.some((p) => p && (s === p || s.startsWith(`${p}/`)))
}

// ─────────────────────────────────────────────────────────────────────────────
// §6.14 面⑦ 索引范围声明化（结构门——2026-10-13 · 台账 #1367）：范围 = 锚的**管辖 manifest**
// 声明目录 ∪ **一级子目录**（带档者）声明目录——「未声明 ⇒ 不进」；条目集空 ⇒ 零索引
// （不回落全树）。键面 = `docRoot.*`（五子键合并）∪ `codePaths`——两键各按自身既有语义
// （本规 = 新增消费点，键值语义零改）。写面（收录）∥ 读面（存量行准入）共用本谓词族。
// ─────────────────────────────────────────────────────────────────────────────

/** 文档面前缀集合（条目根相对——`docRoot.*` 五子键合并展开；解析单源 = `docRootPaths`，F7）：
 *  值 = 根相对字面前缀（恰等 ∨ 后随 `/`——路径及子树；文件值如 `docs/RELEASE.md` ⇒ 恰该文件）；
 *  `"."` = 该条目根自身（整根面）；越根值（`../` 形）剔除——条目子树内的文件永不可命中它。
 *  去重保序。 */
function entryDocPaths(docRoot, root) {
  const out = []
  if (docRoot === null || typeof docRoot !== "object" || Array.isArray(docRoot)) return out
  for (const key of Object.keys(DEFAULT_MANIFEST.docRoot)) {
    for (const abs of docRootPaths(docRoot[key], root)) {
      const rel = relative(root, abs).replace(/\\/g, "/")
      if (rel === "" || rel === ".") { if (!out.includes(".")) out.push("."); continue }
      if (rel === ".." || rel.startsWith("../") || isAbsolute(rel)) continue
      if (!out.includes(rel)) out.push(rel)
    }
  }
  return out
}

/** 段序列任意深度连续命中（面⑦ 代码面——大小写不敏感 = 既有键语义口径，同 `conventions.mjs`
 *  `hasSequenceIn`）；`face` = 已小写化的根相对段表。 */
function hasSegmentRun(face, seq) {
  const want = String(seq).replace(/\\/g, "/").split("/").filter(Boolean).map((s) => s.toLowerCase())
  if (want.length === 0) return false
  for (let i = 0; i + want.length <= face.length; i++) {
    if (want.every((w, j) => face[i + j] === w)) return true
  }
  return false
}

/** 面⑦ 一条目（`root` = 仓根绝对路径；档在场 = 调用面已判）：`docPaths` = 根相对字面前缀 ∥
 *  `codePaths` = 段名数组（既有归一单源 = `loadProjectDeclaration`——`[]` = 无段面）。档**非法**
 *  （坏 JSON ∥ 形态错）⇒ 两族按默认值参与 + 既有可见告警（声明链 KD-M1-32——`loadProjectDeclaration`
 *  的降级告警单源，本档零第二实现）——不静默成零。 */
function scopeEntryOf(root) {
  const decl = loadProjectDeclaration(root)
  const r = readManifest(root)
  const docRoot = r.ok ? r.manifest.docRoot : DEFAULT_MANIFEST.docRoot // 档在场才补默认（无档 = 无条目，不走本函数）
  return Object.freeze({
    root,
    docPaths: Object.freeze(entryDocPaths(docRoot, root)),
    codePaths: Object.freeze([...decl.codePaths]),
  })
}

/**
 * §6.14 面⑦ 范围求并（结构门——单源）：① `dir` 的**管辖 manifest**（`manifestFilePath(dir)` 同一根
 * 解析——最近祖先带档 ∥ 发现兜底；**可高于 `dir`** ⇒ 深 cwd 等义）在场 ⇒ 锚条目（`root` = 档所在
 * 目录）；② `dir` 的**直接子目录**（非跳过段——点段 ∥ 内建名单，防 `.thincoder/tmp` 类伪档）根下带档
 *  者 ⇒ 各一条目（`root` = 该子目录）。**一层、纯向下、绝不向上**（发现纪律在案）。
 *  冻结条目数组（按根去重保序）；条目集空 ⇒ 范围空 ⇒ **零索引**（不回落全树）。
 *  缓存按 `dir` 归一绝对路径（`clearDeclarationCache()` 同清——测试缝单点）。
 * @param {string} [dir] 会话锚 ∕ 同步根（项目内子目录 ⇒ 管辖 manifest 生效）
 * @returns {ReadonlyArray<{root: string, docPaths: readonly string[], codePaths: readonly string[]}>}
 */
export function declaredIndexScope(dir) {
  const key = resolve(dir ?? ".")
  const hit = _scopeCache.get(key)
  if (hit) return hit
  const roots = []
  const anchorFile = manifestFilePath(key) // 数据档路径单源（KD-M1-18）
  if (existsSync(anchorFile)) roots.push(dirname(anchorFile))
  let names = []
  try { names = readdirSync(key, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() } catch { /* 不可读 ⇒ 零子条目（不抛——同发现梯内核） */ }
  for (const name of names) {
    if (isSkippedRelPath(name)) continue
    const child = join(key, name)
    if (!existsSync(join(child, MANIFEST_REL)) || roots.includes(child)) continue // 发现兜底命中的子目录 = 锚条目同根 ⇒ 去重
    roots.push(child)
  }
  const scope = Object.freeze(roots.map(scopeEntryOf))
  _scopeCache.set(key, scope)
  return scope
}

/**
 * §6.14 面⑦ 范围谓词（纯谓词——单一实现，写面 ∥ 读面共用）：`rel`（`base` 相对；缺省按进程 cwd
 * 解析）经 `resolve` 绝对化 ⇒ 逐条目判归属（`abs` ∈ `root` 子树；无归属条目 = **未声明**）⇒ 两面试
 * 任一命中即入范围（两层锚条目间 = 并集）：
 *   · **文档面** = 条目根相对面**字面前缀**（恰等 ∨ 后随 `/`；`"."` = 整根）；
 *   · **代码面** = 段序列**任意深度**命中（大小写不敏感）。
 * 不在任何条目子树内（越根）⇒ 不命中。`scope` 空 ∥ 缺 ⇒ false（零索引面——未声明 ⇒ 不进）。
 * @param {string} rel 路径（`base` 相对）
 * @param {ReadonlyArray<object>} scope `declaredIndexScope()` 回执
 * @param {string|null} [base] `rel` 的相对基（目录绝对路径；缺省 = 进程 cwd）
 * @returns {boolean}
 */
export function isInDeclaredScope(rel, scope, base = null) {
  if (!Array.isArray(scope) || scope.length === 0) return false
  const abs = resolve(base ?? ".", String(rel ?? "").replace(/\\/g, "/"))
  for (const entry of scope) {
    const relFromRoot = relative(entry.root, abs).replace(/\\/g, "/")
    if (relFromRoot === "" || relFromRoot === ".." || relFromRoot.startsWith("../") || isAbsolute(relFromRoot)) continue
    if (entry.docPaths.some((p) => p === "." || relFromRoot === p || relFromRoot.startsWith(`${p}/`))) return true
    if (entry.codePaths.length > 0) {
      const face = relFromRoot.split("/").filter(Boolean).map((s) => s.toLowerCase())
      if (entry.codePaths.some((seq) => hasSegmentRun(face, seq))) return true
    }
  }
  return false
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

/** 引用解析单点（§6.1 口径 4/5——写门 ∥ 迁移旗同消费，不得二写）：① 仓根解析 `resolve(base, part)`
 *  为存在的档 ⇒ 命中；② 声明源前缀解析序：首段命中声明公共仓目录名（消费既有 `declaredPublicRoots`
 *  ——同名多仓 ⇒ 声明序首者）⇒ 于该声明根解析余段；未声明 ∥ 声明根缺位 ∥ 目标档缺 ⇒ `{ ok: false, abs }`。
 *  @param {string} base 仓根基准（写门口径 2 同一子表达式）
 *  @param {string} part task_book 文件部分（首个 `§` 前子串，trim——调用面已判缺位）
 *  @returns {{ok: boolean, abs: string}}
 */
export function resolveDeclaredRef(base, part) {
  const abs = resolve(base, part)
  if (isFile(abs)) return { ok: true, abs }
  const segs = String(part).replace(/\\/g, "/").split("/").filter(Boolean)
  for (const root of declaredPublicRoots(base)) {
    if (segs[0] !== basename(root)) continue
    if (segs.length > 1) {
      const hit = resolve(root, segs.slice(1).join("/"))
      if (isFile(hit)) return { ok: true, abs: hit }
    }
    break
  }
  return { ok: false, abs }
}

const isFile = (p) => { try { return statSync(p).isFile() } catch { return false } }

const _cache = new Map()
/** 面⑦ 范围缓存（按 `dir` 归一绝对路径——子目录档 ∥ 声明变更后经本缝同清）。 */
const _scopeCache = new Map()

/** Drop the per-data-file-path cache (test seam — declarations are read once per path).
 *  #1367：面⑦ 范围缓存同清（「声明 ∥ 一级子目录档」变更后同一条测试缝）。 */
export function clearDeclarationCache() {
  _cache.clear()
  _scopeCache.clear()
}

// #1376：eng 建档路（`manifest.mjs` `resolveEngineeringManifest` init 支）成功 ⇒ 同清两缓存——
// 反向注册（本档已向依赖 manifest.mjs，其侧零出边保持——KD-M1-33）；失败路径不广播、文件面零变。
onManifestInit(clearDeclarationCache)

/** Retired-carrier warning (existence check only — zero content parsing, zero fallback). */
function warnRetiredCarrier(root) {
  console.warn(`[declaration] ${RETIRED_REL_PATH} is retired and no longer read — move codePaths / index.*Extensions into PROJECT-MANIFEST.json`)
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
 * @returns {Readonly<{declared: boolean, codePaths: readonly string[], batchRecords: readonly (readonly string[])[],
 *   index: {codeExtensions: string[], docExtensions: string[], excludePaths: string[], publicRepos: string[]},
 *   root: string|null}>}
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

/**
 * 辖域单点（F11 · 2026-10-08 · #1104 · PORTABILITY §3.2 行 8 / §3.9 / D20）：目标**绝对路径**
 * ⇒ 沿祖先链取**最近**带档目录（`owningProject` 归属形——nearest wins ∕ 纯 fs）⇒ 该项目的声明
 * 对象（`loadProjectDeclaration` 本体零改——按档路径缓存）；祖先链无档 ⇒ `null` = **出辖**
 * （不在任何 manifest 树内——父侧门不判不拦）。
 * **发现梯（`discoverProjects`）不参与**——无候选 ∥ 歧义均出辖（不在无档面凭空落脚）。
 * 相对形由消费面按会话 cwd 先解析（判据 = 目标所属项目，非会话 cwd）。
 * @param {string} targetAbs 目标绝对路径（目录 / 文件）
 * @returns {Readonly<object>|null} 所属项目的声明对象 / null = 出辖
 */
export function declarationForTarget(targetAbs) {
  const root = owningProject(targetAbs, parse(targetAbs).root) // 取根面的界 = 目标所在盘根（与 `projectRootView` 同一口径）
  if (!root) return null
  return loadProjectDeclaration(root)
}
