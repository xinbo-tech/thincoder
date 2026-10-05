/** 本档前身 = 第 33 批失败计数护栏档（载体随 2026-09-18 计数器整体退场；结算分类 = `advisor/notice.mjs`）。
 *
 * 本档 = 中立模块（**不 import 任何 src/ 模块**——打断潜在环；2026-10-04 边界收窄）：
 *  - `normAbs` 自 advisor-settle.mjs 迁入（原处 re-export——既有 import 面零变）；
 *  - `docSetKey` 自 advisor-async.mjs 迁入（原为私有——零 import 面）；
 *  - 2026-10-04（工具路径基面根治批 · #921）：import 面扩为「node:* + manifest 发现/声明族
 *    （叶向——manifest 族零依赖 advisor 面，零新模块边；KD-2）」——`REVIEW_ROOT_KEYS` +
 *    `resolveReviewRootsFor` 判定本体自 `agent/write-gate.mjs` 迁入（write-gate 同名再出口保
 *    既有 import 面），新增 `resolveReviewDocPaths` 文档解析四腿单源。
 */
import { existsSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { DEFAULT_MANIFEST, docRootPaths, readManifest } from "../manifest.mjs"
import { owningProject, projectRootView } from "../manifest-discovery.mjs"

/** ABS 归一（cwd 相对 → cwd 拼接）——陈旧判定 / 冻结拦截 / 评审范围键同源（ADVISOR-GUARDS.md §5 E-4）。 */
export function normAbs(p, cwd) {
  const s = String(p)
  return /^[a-zA-Z]:[\\/]/.test(s) || s.startsWith("/") || s.startsWith("\\\\") ? s : join(cwd, s)
}

/** Canonical scope key for design reviews（写法差异不误建新实例；第 33 批自 advisor-async.mjs 迁入）。 */
export function docSetKey(documents, cwd) {
  const list = [...new Set((documents ?? [])
    .filter((d) => typeof d === "string" && d.trim())
    .map((d) => normAbs(d, cwd)))]
  return JSON.stringify(list.sort())
}

/** 评审目标解析读的 docRoot 键集（评审对象/被审文件可住的所有文档层——M6 分类据此判定）。
 *  2026-10-04 自 `agent/write-gate.mjs` 迁入（键集本体零变；write-gate 同名再出口）。 */
export const REVIEW_ROOT_KEYS = ["requirements", "specs", "design", "modules", "batches"]

/**
 * 评审目标解析单点（按用点形——2026-09-21 收口 · 台账 #828；2026-10-04 自 `agent/write-gate.mjs`
 * 迁入，逐字零变；write-gate 同名再出口保既有 import 面）。
 */
export function resolveReviewRootsFor(dir) {
  const man = readManifest(dir)
  const root = man.ok && man.manifest?.docRoot && typeof man.manifest.docRoot === "object"
    ? man.manifest.docRoot
    : DEFAULT_MANIFEST.docRoot
  const out = []
  for (const key of REVIEW_ROOT_KEYS) out.push(...docRootPaths(root?.[key], dir))
  return [...new Set(out)]
}

/** 可读文件判据（存在且为文件——目录 / 缺失同判不可读；同 batch-paths.mjs 读面先例）。 */
function readableFile(abs) {
  try { return existsSync(abs) && statSync(abs).isFile() } catch { return false }
}

/** 会话根集（腿①判据集——既有 advisor 面 `resolveReviewTargetPaths(agent)` 目录形态的函数式封装；档内私有——零外部消费面）。 */
function sessionReviewRoots(cwd) {
  return resolveReviewRootsFor(cwd ?? process.cwd())
}

/**
 * **文档解析四腿单源**（2026-10-04 · 批档 §2.2 A 本体）：逐文档
 *   腿① 零变：normAbs(doc, cwd) 落会话根集 ⇒ 受理；腿② 零变：所属项目根集命中 ⇒ 受理；
 *   腿③ 根治面：相对形 ∧ 前两腿未中 ⇒ 候选项目根逐个试探（候选 = projectRootView(cwd)：
 *        ok → [root]；ambiguous → candidates 按名序；none → 空集）——resolve(c, doc) 所属
 *        项目根集命中 = 结构命中；绝对形不进本腿（未中 = 真越界，无候选可试）；
 *   腿④ 歧义归一（KD-3）：结构命中 ≥2 ⇒ 可读文件存在性唯一化（batch-paths 读面「首个可读」
 *        同款判据）：恰一可读 ⇒ 胜；≥2 可读 ⇒ fail-closed 拒（scope-doc-ambiguous 列全部
 *        可读命中）；0 可读 ⇒ not-doc 拒（诊断列全部结构命中）。
 * @returns {{ resolved: Map<string,string>, invalid: Array<{doc, attempted:string[]}>,
 *   ambiguous: {doc, hits:string[]}|null, candidates: string[] }} ambiguous = 首个歧义文档
 *   （fail-closed 首拒——消费面拒发即止）；candidates = 腿③候选集（B 文案候选提示同源）。
 *   非字符串 / 空白串项**静默跳过**（同 docSetKey 既有过滤语义——不进 resolved/invalid）。
 */
export function resolveReviewDocPaths(documents, cwd) {
  const fwd = (p) => p.replace(/[\\/]/g, "/")
  const sessionRoots = sessionReviewRoots(cwd).map(fwd)
  const view = projectRootView(cwd ?? process.cwd())
  const candidates = view.state === "ok" ? [view.root] : view.state === "ambiguous" ? view.candidates : []
  const ownRootsCache = new Map()
  const ownRoots = (owner) => {
    let r = ownRootsCache.get(owner)
    if (!r) {
      r = resolveReviewRootsFor(owner).map(fwd)
      ownRootsCache.set(owner, r)
    }
    return r
  }
  // under = 段边界判（比较面用 `/` 归一形；**产出面保原生形态**——docAbs / resolved 与 normAbs
  // 既有形态同族，冻结窗/陈旧谓词零改照比对——win32 反斜杠面不破）。
  const under = (pNative, rootsFwd) => {
    const p = fwd(pNative)
    return rootsFwd.some((r) => p === r || p.startsWith(r + "/"))
  }

  const resolved = new Map()
  const invalid = []
  let ambiguous = null
  for (const doc of (documents ?? [])) {
    if (typeof doc !== "string" || !doc.trim()) continue
    const isAbs = /^[a-zA-Z]:[\\/]/.test(doc) || doc.startsWith("/") || doc.startsWith("\\\\")
    const n = normAbs(doc, cwd)
    // 腿① 会话根集 / 腿② 所属项目根集（既有行为零变——判定序同 advisor.mjs 旧面）。
    if (under(n, sessionRoots)) { resolved.set(doc, n); continue }
    const owner = owningProject(n)
    if (owner && under(n, ownRoots(owner))) { resolved.set(doc, n); continue }
    // 腿③ 候选项目根试探（相对形 only——绝对形未中 = 真越界，无候选可试）。
    let hits = []
    if (!isAbs && candidates.length > 0) {
      for (const c of candidates) {
        const t = resolve(c, doc)
        const cOwner = owningProject(t)
        if (cOwner && under(t, ownRoots(cOwner))) hits.push(t)
      }
    }
    // 腿④ 歧义归一：结构命中 ≥2 ⇒ 可读文件存在性唯一化；恰 1 命中 ⇒ 受理（存在性仅作
    // 歧义唯一化判据——单命中无判别力，同腿①声明根集受理面一致不查存在）。
    if (hits.length >= 2) {
      const readable = hits.filter((h) => readableFile(h))
      if (readable.length === 1) { resolved.set(doc, readable[0]); continue }
      if (readable.length >= 2) { ambiguous = { doc, hits: readable }; break }
    } else if (hits.length === 1) {
      resolved.set(doc, hits[0]); continue
    }
    invalid.push({ doc, attempted: hits })
  }
  return { resolved, invalid, ambiguous, candidates }
}

/** #949（评审 history 串台面 ① 镜像键控）：评审实例镜像三值单点定域（round ∥ prior ∥
 *  响应表取件下界 `_advisorResponseAnchor`）——`resolveAdvisorLaunch` 发起定域 +
 *  `entry.start` 排队 / 延迟窗口消费点复核（构建前幂等重落）；非排队 / 同步语义零变。 */
export function scopeAdvisorMirror(agent, run) {
  agent._advisorRound = run.priorOutput ? run.round : 0
  agent._lastAdvisorOutput = run.priorOutput
  agent._advisorResponseAnchor = run.historyAnchorIdx ?? null
}

/** #949（② 投递水印）：响应表取件下界 = 投递刻 history 下标（消费面前向取首表）。
 *  调用点：async `injectAsyncResult`（pushReal 后）∥ sync record-results 记账块；
 *  run 缺省 / 非对象（legacy 直调）⇒ 零写（回落全文倒扫）。 */
export function noteReviewDelivered(agent, run) {
  if (!run || typeof run !== "object") return
  run.historyAnchorIdx = Array.isArray(agent?.history) ? agent.history.length : 0
}
