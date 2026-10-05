/**
 * agent-tools/batch-paths.mjs — 批次档相对路径解析**单源**（`BATCH-RECORD.md` §4.15 · 台账 #287 · 2026-09-25 批）。
 *
 * 四处调用点全部经本档：create（`resolveBatchCreatePath`）· append / status / close 与评审门
 * （`resolveBatchDocPath`——读面抛错形）· spawn 门（`resolveBatchReadPath`——读面非抛形）。
 *
 * 契约（§4.15 逐字）：**候选序** = cwd → 项目根 → 逐基底（基底 = `batchDocBases` 声明面单源）；
 * **判据分野** = 读面取首个**可读**文件 / create 取首个**落基底根内**者；**锚定防嵌套** = 串以任一基底的
 * 「项目根相对前缀」打头且前缀后为**路径段边界** ⇒ 只解析项目根形（不二次拼接；不落基底内 ⇒ fail-closed）；
 * **歧义锚**（条 5 · 2026-10-02 · #828）= create 按目标所属项目落基底 ∥ 无所属显式拒；读面候选腿追加；
 * 在飞 ∥ 写门基底集 = 候选并集（`batchDocBases`）；**零变面** = 绝对路径照旧、三个错误文案逐字、
 * 「参数在 + 路径可读」判据句、`ok` / `none` 两态。
 * **基底自有项目根腿 + 基底相对单段收窄**（条 6 · 2026-10-05 · #942）= 逐基底 `owningProject` 恰一落点收 ∥ 多落点显式拒（`ambiguousLandingError`）；基底相对腿限单段（多段串不二次拼接）。
 *
 * 依赖（KD-4 单向）：本档为**叶档**——只 import `node:*` 与 `../manifest.mjs`；主档 re-export 保既有面。
 */
import { existsSync, statSync } from "node:fs"
import { isAbsolute, relative, resolve, sep } from "node:path"

import { docRootBase, docRootPaths, owningProject, projectRootView, readManifest, resolveProjectRoot } from "../manifest.mjs"

/** 可读文件判据（存在且为文件——目录 / 缺失同判不可读）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/** 歧义锚候选（判定单点 = `projectRootView`——`ambiguous` 态 ⇒ 候选全列**按名排序**；余者 null）。 */
function ambiguousCandidates(cwd) {
  const view = projectRootView(cwd ?? process.cwd())
  return view.state === "ambiguous" ? view.candidates : null
}

/** 路径同一性比较（win32 大小写不敏感——同越基底判据口径）。 */
function samePath(a, b) {
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b
}

/** 「项目根」取根单源（§4.15 条 1——归属 ∨ 发现，无 manifest ⇒ `resolve(cwd ?? ".")` 兜底且**单值**）：
 *  同式 = 台账库键 / 写门指针基准的同一子表达式（`design/LEDGER.md` §6.1 口径 2）。 */
export function batchProjectRoot(cwd) {
  return resolveProjectRoot(cwd) ?? resolve(cwd ?? ".")
}

/** manifest **声明基底**（声明面；manifest 缺失 / 非法 / 读错 ⇒ 空集——v1 单基底语义零变）。 */
function declaredBases(cwd) {
  const base = cwd ?? process.cwd()
  let man = { ok: false }
  try { man = readManifest(base) } catch { /* 读错 → 按无 manifest 处理（回退默认基底） */ }
  return man.ok ? docRootPaths(man.manifest?.docRoot?.batches, base) : []
}

/** 批次档基底根数组（**声明面单源**——create / 在飞扫描 / 锚定判据共用）：manifest `docRoot.batches`
 *  （串 | 多根数组）→ 声明基底；缺失 / 非法 ⇒ 回退默认基底 `"docs/batches"`（恒返回非空数组）。
 *  **歧义锚**（条 5）⇒ 候选项目基底**并集**（候选按名排序、并集保序）——在飞扫描 / 写门基底集同取此值。
 *  @param {string} cwd
 *  @returns {string[]} */
export function batchDocBases(cwd) {
  const amb = ambiguousCandidates(cwd)
  if (amb) {
    const union = []
    for (const c of amb) for (const b of batchDocBases(c)) if (!union.includes(b)) union.push(b)
    return union
  }
  const roots = declaredBases(cwd)
  return roots.length ? roots : [resolve(docRootBase(cwd), "docs/batches")]
}

/** 基底的项目根相对前缀（归一 `/`；基底不落项目根下 / 与前缀重合 ⇒ 不产前缀——前缀不匹配者不做启发式改写）。 */
function basePrefixes(cwd, bases) {
  const root = batchProjectRoot(cwd)
  const out = []
  for (const b of bases) {
    const rel = relative(root, resolve(b)).replace(/\\/g, "/")
    if (!rel || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) continue
    out.push(rel)
  }
  return out
}

/** 锚定判据（**按路径段**——前缀后须为 `/` 或串尾；`docs/batches-old/<x>.md` 不锚定，BR-35）。 */
function anchoredPrefix(p, prefixes) {
  for (const pre of prefixes) if (p === pre || p.startsWith(pre + "/")) return pre
  return null
}

/** 越基底判据（create 面）：解析后须落在某一基底根之内；win32 大小写不敏感比较。 */
function insideBases(abs, bases) {
  const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p)
  const target = norm(abs)
  return bases.some((b) => {
    const root = norm(b)
    return target === root || target.startsWith(root.endsWith(sep) ? root : root + sep)
  })
}

/** create 越基底（原文案逐字——零变面）。 */
const outsideBasesError = (raw) => new Error(`batch: create path resolves outside the batch-record base roots — a batch record must live under the declared docRoot.batches base (fail-closed). Path: ${raw}`)
/** create 锚定但落基底外（§4.15 新文案逐字——不二次拼接）。 */
const anchoredEscapeError = (raw) => new Error(`batch: create path is anchored at a batch base root but does not resolve under the declared docRoot.batches root(s) — refusing to nest it (fail-closed). Path: ${raw}`)
/** 歧义锚 create 拒面（**文案逐字** = `BATCH-RECORD.md` §4.15 条 5——机检锚 `ambiguous session anchor`）。 */
const ambiguousCreateError = (raw, candidates) => new Error(`batch: ambiguous session anchor — create target "${raw}" belongs to no candidate project; pass an explicit project path (e.g. "${candidates[0]}/docs/batches/<file>.md"). Candidates: ${candidates.join(", ")}`)
const ambiguousLandingError = (raw, landings) => new Error(`batch: create path resolves under more than one declared batch-record base — refusing to pick one (fail-closed); pass an explicit path (absolute preferred). Path: ${raw}. Candidates: ${landings.join(", ")}`)

/** 歧义锚读面候选腿（条 5）：逐候选项目——项目根形（`resolve(candidate, p)`）∥ 声明基底形
 *  （候选按名排序、并集保序——「首个可读」在此即为确定判读）。 */
function ambiguousReadLegs(cwd, p) {
  const amb = ambiguousCandidates(cwd)
  if (!amb) return []
  const out = []
  for (const c of amb) {
    out.push(resolve(c, p))
    for (const b of declaredBases(c)) out.push(resolve(b, p))
  }
  return out
}

/**
 * **读面**解析（append / status / close 与评审门 / spawn 门共用）：首个**可读**候选胜；无 ⇒ null
 * （调用方各自抛既有文案）。锚定串只解析项目根形（跳过 ①③——已含基底相对前缀者不再二次拼接）。
 * @param {string} cwd 会话锚（缺省 → 进程 cwd）
 * @param {string} given 参数原值（相对 / 绝对、`\` 与 `/` 混写均可）
 * @returns {string|null} 可读文件的绝对路径 / null
 */
export function resolveBatchReadPath(cwd, given) {
  const base = cwd ?? process.cwd()
  const raw = typeof given === "string" ? given.trim() : ""
  if (!raw) return null
  const p = raw.replace(/\\/g, "/")
  if (anchoredPrefix(p, basePrefixes(base, batchDocBases(base)))) {
    const abs = resolve(batchProjectRoot(base), p)
    return readableFile(abs) ? abs : null
  }
  const candidates = [resolve(base, p), resolve(batchProjectRoot(base), p), ...declaredBases(base).map((b) => resolve(b, p)), ...ambiguousReadLegs(base, p)]
  for (const abs of candidates) if (readableFile(abs)) return abs
  return null
}

/**
 * 批次档路径门禁（评审侧 `BATCH-RECORD.md` §4.2 口径 = **「若传则须可读」**）：空 / 非字符串 / 不可读 → throw。
 * 非空且可读 → 返回绝对路径（`\` 归一——照 `files` / `batchDoc` spawn 门先例）。错误文案逐字零变（零回归硬约束）。
 */
export function resolveBatchDocPath(cwd, given) {
  const base = cwd ?? process.cwd()
  const raw = typeof given === "string" ? given.trim() : ""
  if (!raw) {
    throw new Error("batchDoc must be a non-empty path to the batch record — pass the batch record currently in flight, or omit the parameter entirely when no batch record is in flight.")
  }
  const abs = resolveBatchReadPath(base, raw)
  if (abs) return abs
  throw new Error(`batchDoc is not a readable file: ${raw} — pass the path of the batch record currently in flight (a path that resolves to an existing file), or omit the parameter when no batch record is in flight.`)
}

/**
 * **create 面**解析（§4.15 条 2/3/6）：绝对路径照旧取用（仍过越基底判据）；相对路径 = 候选序中首个**落基底
 * 根内**者（新档不存在——可读性无判别力）；锚定串只解析项目根形，不落基底内 ⇒ fail-closed 新文案。
 *  **歧义锚**（条 5）：目标所属项目（`owningProject`）∈ 锚候选集 ⇒ 基底 = 该项目声明面（落其基底内；
 *  越出 ⇒ 既有 fail-closed）；无所属 ⇒ **显式拒**（列候选 + 显式路径指引——不静默落锚）。
 * @param {string} cwd 会话锚
 * @param {string} given create `path` 原值
 * @param {string[]} bases 已解析的基底根数组（`batchDocBases` 单源；调用方传入以免重复读档）
 * @returns {string} 落位绝对路径
 */
export function resolveBatchCreatePath(cwd, given, bases) {
  const base = cwd ?? process.cwd()
  const raw = String(given ?? "").trim()
  const p = raw.replace(/\\/g, "/")
  let roots = bases
  const amb = ambiguousCandidates(base)
  if (amb) {
    const owner = owningProject(isAbsolute(raw) ? resolve(raw) : resolve(base, p))
    if (!owner || !amb.some((c) => samePath(c, owner))) throw ambiguousCreateError(raw, amb)
    roots = batchDocBases(owner)
  }
  if (isAbsolute(raw)) {
    const abs = resolve(raw)
    if (!insideBases(abs, roots)) throw outsideBasesError(raw)
    return abs
  }
  if (anchoredPrefix(p, basePrefixes(base, roots))) {
    const abs = resolve(batchProjectRoot(base), p)
    if (!insideBases(abs, roots)) throw anchoredEscapeError(raw)
    return abs
  }
  for (const abs of [resolve(base, p), resolve(batchProjectRoot(base), p)]) {
    if (insideBases(abs, roots)) return abs
  }
  // ③ 基底自有项目根形（#942 条 6）：owningProject 可判者逐基底取值；distinct 落点 ≥2 ⇒ 拒
  const owned = []
  for (const b of roots) {
    const ownRoot = owningProject(b)
    if (!ownRoot) continue
    const abs = resolve(ownRoot, p)
    if (insideBases(abs, roots) && !owned.some((x) => samePath(x, abs))) owned.push(abs)
  }
  if (owned.length > 1) throw ambiguousLandingError(raw, owned)
  if (owned.length === 1) return owned[0]
  // ④ 基底相对形收窄单段（归一后无 `/` 才走原基底腿——多段串不二次拼接）
  const leafRel = roots.length ? relative(roots[0], resolve(roots[0], p)) : ""
  if (leafRel && !leafRel.startsWith("..") && !leafRel.includes(sep)) {
    for (const b of roots) {
      const abs = resolve(b, p)
      if (insideBases(abs, roots)) return abs
    }
  }
  throw outsideBasesError(raw)
}
