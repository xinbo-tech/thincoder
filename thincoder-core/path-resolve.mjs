/**
 * path-resolve.mjs — 相对路径 → 绝对路径的**统一解析层**（一个函数、四态结果）。
 *
 * 机制单源 = `docs/core/design/PATH-RESOLUTION.md` §2（本档只实现，不重述口径）。
 * 各吃路径的面只留自己的**受理判据**（存不存在 / 是不是文档 / 能不能读 / 落不落基底内）；
 * 「一条路径指向哪里」只由本层回答。
 *
 * 叶档（KD-1）：只 import `node:*` + `manifest.mjs`（`projectRootView`：取根单源）+
 * `declaration.mjs`（`declaredPublicRoots`：声明仓根集单源——`manifest.mjs` 的转口不含它，取它须直引）。
 *
 * 四态（§2.1）：`resolved{abs}` · `ambiguous{candidates}` · `dangling{missing, sameName, level, tried}` ·
 * `crossRepo{repo, declared, relPath, candidates}`。`tried` = 基根序下试过的绝对候选（面报「解析 = …」用；
 * 只作读数，不作判据）。
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, isAbsolute, join, resolve } from "node:path"

import { declaredPublicRoots } from "./declaration.mjs"
import { projectRootView } from "./manifest.mjs"

/** 同名候选扫描界（KD-7）：每根各自起算深 ≤3、命中上限 20（只在 `dangling` 路径上跑）。 */
const SAME_NAME_MAX_DEPTH = 3
const SAME_NAME_MAX_HITS = 20
/** 跨仓未声明形的同级目录枚举上限（§2.7：一次 `readdir`、不递归、按名排序）。 */
const SIBLING_MAX = 20
/** 同名候选扫描跳过的目录名（归档区不是「你是不是指这个」的候选面）。 */
const SAME_NAME_SKIP = new Set(["_archive"])

/** 路径同一性（win32 大小写不敏感——同 `batch-paths.mjs` 越基底判据口径）。 */
const pathKey = (p) => (process.platform === "win32" ? p.toLowerCase() : p)

/** 现存判据（`kind` = 存在判口径；`"none"` 恒真——只做调度、不校验存在性）。 */
function existsAs(abs, kind) {
  if (kind === "none") return true
  let st = null
  try { st = statSync(abs, { throwIfNoEntry: false }) } catch { return false }
  if (!st) return false
  if (kind === "dir") return st.isDirectory()
  if (kind === "file") return st.isFile()
  return true // "any"
}

/** 去重保序（按路径同一性；基根重合时不产伪 `ambiguous`）。 */
function uniquePaths(list) {
  const seen = new Set()
  const out = []
  for (const p of list) {
    const k = pathKey(p)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(p)
  }
  return out
}

/** 目录 → 直接子目录名（按名排序、上限 `SIBLING_MAX`；不可读 ⇒ 空集）。 */
function siblingDirs(dir) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return [] }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort().slice(0, SIBLING_MAX)
}

/** 同名档扫描（**每根各自起算**：递归深 ≤ `SAME_NAME_MAX_DEPTH`、命中上限 `SAME_NAME_MAX_HITS`、
 *  跳过隐藏目录与 `_archive`；宽度优先——浅处的同名档先入列）。 */
function collectSameName(root, name, out) {
  const queue = [{ dir: root, depth: 0 }]
  while (queue.length > 0 && out.length < SAME_NAME_MAX_HITS) {
    const { dir, depth } = queue.shift()
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { continue }
    for (const e of entries) {
      if (out.length >= SAME_NAME_MAX_HITS) break
      if (e.name.startsWith(".") || SAME_NAME_SKIP.has(e.name)) continue
      const abs = join(dir, e.name)
      if (e.isDirectory()) {
        if (depth + 1 <= SAME_NAME_MAX_DEPTH) queue.push({ dir: abs, depth: depth + 1 })
        continue
      }
      if (e.isFile() && e.name === name) out.push(abs)
    }
  }
}

/** 第一个不存在的路径段（`dangling.missing` 的取值单源——AC-4）。 */
function firstMissing(base, segs) {
  let cur = base
  for (const s of segs) {
    cur = join(cur, s)
    if (!existsSync(cur)) return s
  }
  return segs[segs.length - 1] ?? ""
}

/** 跨仓识别（§2.7，只在 `crossRepo === "visible"` ∧ 输入多段 ∧ 第 4–5 步零命中时调）：
 *  已声明形 = 首段 ∈ 声明仓名集（声明根**不 stat**——位置因人而异）；未声明形 = 首段是项目根的同级目录名；
 *  形态不合法（含 `..` / `.` 段 / 余段空）⇒ 不是跨仓形 ⇒ `null`（落 `dangling`，KD-11）。 */
function crossRepoOf(start, pathText, view) {
  const segs = pathText.split("/").filter(Boolean)
  if (segs.length < 2) return null
  if (segs.some((s) => s === ".." || s === ".")) return null
  const repo = segs[0]
  const relPath = segs.slice(1).join("/")
  if (!relPath) return null
  const declaredNames = new Set(declaredPublicRoots(start).map((r) => basename(r)))
  if (declaredNames.has(repo)) return { state: "crossRepo", repo, declared: true, relPath, candidates: [] }
  const parent = view.state === "ok" ? dirname(view.root) : dirname(start)
  const siblings = siblingDirs(parent)
  if (siblings.includes(repo)) return { state: "crossRepo", repo, declared: false, relPath, candidates: siblings }
  return null
}

/** 前两级基根（§2.2 第 4 步——缺哪级就跳过）：`root-first` = 项目根 → 所指目录；
 *  `near-first` = 所指目录 → 项目根。「所指目录」= `referrer` 的目录，无 `referrer` ⇒ 会话锚
 *  （§1.2 偏离 ③——不兜则第二级在「手上没有引用方档」的面整段消失）。
 *  解析不出项目根时：`workspace` = 这一级不成立（§2.3 判 `ambiguous`）；`none` = 会话锚即该级
 *  （`batchProjectRoot` / `docRootBase` 的既有兜底同式——锚自己就是手上唯一的基根）。 */
function coreLegs(start, view, referrer, order) {
  const refDir = referrer ? dirname(referrer) : start
  const rootLeg = view.state === "ok" ? view.root : view.state === "none" ? start : null
  const legs = order === "near-first" ? [refDir, rootLeg] : [rootLeg, refDir]
  return uniquePaths(legs.filter((p) => typeof p === "string" && p !== ""))
}

/**
 * 一条路径 → 四态之一（判据正文 = `docs/core/design/PATH-RESOLUTION.md` §2.2）。
 * @param {string} anchor 会话锚（相对路径的最终兜底基根；`projectRootView` 的查询起点）
 * @param {string|undefined|null} given 参数原值（`undefined` = 参数缺省——与空串分野，§2.2 第 1 步）
 * @param {{referrer?:string, bases?:string[], scanBases?:string[],
 *   kind?:"file"|"dir"|"any"|"none", order?:"root-first"|"near-first",
 *   crossRepo?:"dangling"|"visible"}} [opts]
 * @returns {{state:"resolved", abs:string}
 *   | {state:"ambiguous", candidates:string[]}
 *   | {state:"dangling", missing:string, sameName:string[], level:"base"|"path", tried:string[]}
 *   | {state:"crossRepo", repo:string, declared:boolean, relPath:string, candidates:string[]}}
 */
export function resolvePathTarget(anchor, given, opts = {}) {
  const o = opts ?? {}
  const start = resolve(anchor ?? ".")
  const kind = o.kind === "dir" || o.kind === "any" || o.kind === "none" ? o.kind : "file"
  const order = o.order === "near-first" ? "near-first" : "root-first"
  const wantCrossRepo = o.crossRepo === "visible"
  const referrer = typeof o.referrer === "string" && o.referrer.trim() !== "" ? resolve(o.referrer) : null
  const bases = (Array.isArray(o.bases) ? o.bases : []).filter((b) => typeof b === "string" && b.trim() !== "")
  const scanBases = (Array.isArray(o.scanBases) ? o.scanBases : []).filter((b) => typeof b === "string" && b.trim() !== "")
  const view = projectRootView(start)

  // ── 第 1 步：参数缺省（undefined）≠ 空串 —— 没有路径可判，只查锚根
  if (given === undefined || given === null) {
    if (view.state === "ok") return { state: "resolved", abs: view.root }
    if (view.state === "workspace") return { state: "ambiguous", candidates: [...view.candidates] }
    return { state: "dangling", missing: "", sameName: [], level: "base", tried: [] }
  }
  const raw = typeof given === "string" ? given.trim() : ""
  if (raw === "") return { state: "dangling", missing: typeof given === "string" ? given : String(given), sameName: [], level: "path", tried: [] }
  const pathText = raw.replace(/\\/g, "/")

  // ── 第 2 步：绝对路径 —— 照用，零基根走查（各面受理判据照旧）
  if (isAbsolute(pathText)) return { state: "resolved", abs: resolve(pathText) }

  const segs = pathText.split("/").filter(Boolean)
  const legs = coreLegs(start, view, referrer, order)
  // 第三级基底：与前两级重合者不重复（重合即同一基根，不是第二个落点）
  const baseRoots3 = uniquePaths(bases).filter((b) => !legs.some((l) => pathKey(l) === pathKey(b)))
  const roots = [...legs, ...baseRoots3]

  // ── 第 3 步：kind:"none" —— 只做调度、不校验存在性：候选序首个即 resolved，恒不产其余三态
  if (kind === "none") return { state: "resolved", abs: resolve(roots[0] ?? start, pathText) }

  // ── 第 4 步（续）：工作区锚 —— 项目根这一级不成立 ⇒ 不猜（§2.3：列下辖项目、停下要人挑）
  if (view.state === "workspace") return { state: "ambiguous", candidates: [...view.candidates] }

  // ── 第 5 步：判态 —— 前两级按 `order` **首命中即 resolved**；第三级 `bases` 内多份现存 ⇒ `ambiguous` 全列。
  //    依据：KD-2 / KD-3 的「翻转次序会改变判定结果」+ AC-11 两条断言（两个基根各有一份同名现存档 ⇒
  //    锚面取项目根那份、批档面取近基根那份）——只有首命中择一才成立（§2.2 第 5 步「≥二 ⇒ ambiguous」
  //    在两级基根上与 AC-11 不能同时成立，取验收判据这一面）。
  const tried = uniquePaths(roots.map((b) => resolve(b, pathText)))
  for (const leg of legs) {
    const abs = resolve(leg, pathText)
    if (existsAs(abs, kind)) return { state: "resolved", abs }
  }
  const baseHits = uniquePaths(baseRoots3.map((b) => resolve(b, pathText)).filter((abs) => existsAs(abs, kind)))
  if (baseHits.length === 1) return { state: "resolved", abs: baseHits[0] }
  if (baseHits.length > 1) return { state: "ambiguous", candidates: baseHits }

  // ── 第 6 步：跨仓识别（仅文档锚面开；仓内缺档仍阻断）
  if (wantCrossRepo) {
    const cross = crossRepoOf(start, pathText, view)
    if (cross) return cross
  }

  // ── 第 7 步：dangling —— 报缺的那一段 + 列同名候选（两层基根 + bases + scanBases 各根，每根各自起算）
  const name = segs[segs.length - 1] ?? pathText
  const hits = []
  for (const root of uniquePaths([...roots, ...scanBases])) collectSameName(root, name, hits)
  const sameName = uniquePaths(hits)
  return {
    state: "dangling",
    missing: firstMissing(roots[0] ?? start, segs),
    sameName,
    level: "path",
    tried,
  }
}

/** `dangling` 的「盘上同名」提示尾（空数组 ⇒ 空串）。面拼在既有文案之后（§2.6：既有文案逐字保留在前）。 */
export function danglingSameNameHint(result) {
  const list = result?.state === "dangling" && Array.isArray(result.sameName) ? result.sameName : []
  return list.length > 0 ? `盘上同名：${list.join(" ∥ ")}` : ""
}

/** 跨仓一行的读数文案（§2.6 两条形——已声明 ∥ 未声明；未声明形不阻断，只作读数）。 */
export function crossRepoNote(ident, result) {
  if (result?.state !== "crossRepo") return ""
  if (result.declared) return `${ident} → 仓「${result.repo}」的 ${result.relPath}（声明源引用，未校验存在性）`
  const cands = Array.isArray(result.candidates) && result.candidates.length > 0 ? result.candidates.join(" ∥ ") : "（无）"
  return `${ident} 引用外部仓「${result.repo}」——引用外部仓须先在 index.publicRepos 声明；本机仓名候选：${cands}`
}
