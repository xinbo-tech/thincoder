/** 本档前身 = 第 33 批失败计数护栏档（载体随 2026-09-18 计数器整体退场；结算分类 = `advisor/notice.mjs`）。
 *
 * 本档 = 中立模块（**不 import 任何 src/ 模块**——打断潜在环；2026-10-04 边界收窄）：
 *  - `normAbs` 自 advisor-settle.mjs 迁入（原处 re-export——既有 import 面零变）；
 *  - `docSetKey` 自 advisor-async.mjs 迁入（原为私有——零 import 面）；
 *  - 2026-10-04（工具路径基面根治批 · #921）：import 面扩为「node:* + manifest 发现/声明族
 *    （叶向——manifest 族零依赖 advisor 面，零新模块边；KD-2）」——`REVIEW_ROOT_KEYS` +
 *    `resolveReviewRootsFor` 判定本体自 `agent/write-gate.mjs` 迁入（write-gate 同名再出口保
 *    既有 import 面）；`resolveReviewDocPaths` = 评审文档路径解析单源；
 *  - 2026-10-25（评审文档路径收正批）：该解析器收为**单规则**——相对形按会话项目根 / 绝对形
 *    照用 / 受理 = 项目内现存 `.md`；候选试探与歧义归一退场（判据正文 = `ADVISOR-GUARDS.md` §12）。
 *  - 2026-11-02（path-resolution-unify 批）：路径判定改调统一解析层（`../path-resolve.mjs`）——
 *    本面只留受理判据；拒因词 `no-project-root` 退役，拆成 `ambiguous-path`（判不出唯一基根）
 *    ∥ `dangling-path`（无项目根）。
 */
import { existsSync, statSync } from "node:fs"
import { isAbsolute, join, relative, sep } from "node:path"
import { DEFAULT_MANIFEST, docRootPaths, readManifest } from "../manifest.mjs"
import { owningProject, projectRootView } from "../manifest-discovery.mjs"
import { resolvePathTarget } from "../path-resolve.mjs"

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

/** **写门面**评审根的 docRoot 键集（`agent/write-gate.mjs` 的 `resolveReviewTargetPaths` 消费）——
 *  设计评审**受理面不再消费**本键集（受理 = 项目内现存 `.md`，判据单源 = `ADVISOR-GUARDS.md` §12）。
 *  2026-10-04 自 `agent/write-gate.mjs` 迁入（键集本体零变；write-gate 同名再出口）。 */
export const REVIEW_ROOT_KEYS = ["requirements", "specs", "design", "modules", "batches"]

/**
 * 写门评审根解析单点（按用点形——2026-09-21 收口 · 台账 #828；2026-10-04 自 `agent/write-gate.mjs`
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

/** 受理判据 = 现存普通文件 ∧ 扩展名 `.md`（大小写不敏感）——`scope-not-doc` 的指义 = 评审对象必须是文档。 */
function isDocFile(abs) {
  return /\.md$/i.test(abs) && readableFile(abs)
}

/** `p` 是否等于 `root` 或在其子树内（段边界判——`..` 逃逸 / 跨盘 ⇒ 否）。 */
function isInside(p, root) {
  const rel = relative(root, p)
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

/**
 * **评审文档路径解析单规则**（判据正文 = `docs/core/design/ADVISOR-GUARDS.md` §12）——逐文档：
 *   ① 路径判定全部经统一解析层（`kind:"file"` / `order:"root-first"` / `bases` = 无 /
 *      `scanBases` = `docRoot` 各键——只喂同名候选，不作受理基底；本面受理面零放宽）；
 *   ② 判不出唯一基根（层判 `ambiguous`——工作区锚）⇒ `ambiguous-path` + 候选全列；
 *      无项目根（层判 `dangling.level:"base"`）⇒ `dangling-path`；
 *   ③ 相对形 ∧ 锚无项目根 ⇒ `dangling-path`（受理判据「必须在项目内」——档层无根时相对形无基可挂）；
 *      相对形越根 ⇒ `outside-project`；
 *   ④ 绝对形照用（零根试探、零拼接）；不住在任何项目里（`owningProject` 空）⇒ `outside-project`；
 *   ⑤ 受理 = 现存普通文件 ∧ `.md`（大小写不敏感）；否则 `not-doc-file`。
 *   **零试探**：层判不出唯一即停（用户 2026-10-25 11:41「为啥要试探？不能要求写对吗？」）。
 *   非字符串 / 空白串项**静默跳过**（同 docSetKey 既有过滤语义——不进 resolved / invalid）。
 * @returns {{ resolved: Map<string,string>, invalid: Array<{doc: string, resolved: string|null, reason: string,
 *   candidates?: string[], sameName?: string[]}> }}
 *   `reason` ∈ `ambiguous-path` / `dangling-path` / `outside-project` / `not-doc-file`（标识行恒
 *   `criterion=scope-not-doc`，四值只作 `reason=`）；`resolved` 项 = 解析后绝对路径（无基面 ⇒ `null`）。
 */
export function resolveReviewDocPaths(documents, cwd) {
  const view = projectRootView(cwd)
  const scanBases = resolveReviewRootsFor(cwd)
  const resolved = new Map()
  const invalid = []
  for (const doc of (documents ?? [])) {
    if (typeof doc !== "string" || !doc.trim()) continue
    const abs = /^[a-zA-Z]:[\\/]/.test(doc) || doc.startsWith("/") || doc.startsWith("\\\\")
    const r = resolvePathTarget(cwd, doc, { kind: "file", order: "root-first", crossRepo: "dangling", scanBases })
    if (r.state === "ambiguous") { invalid.push({ doc, resolved: null, reason: "ambiguous-path", candidates: r.candidates }); continue }
    // 相对形 ∧ 锚无项目根 ⇒ 无基可挂（受理判据「必须在项目内」）——**与盘上有没有那档无关**：
    // 同一锚态同一个词（KD-8），否则拒因词成了磁盘状态的函数。
    if (!abs && view.state !== "ok") { invalid.push({ doc, resolved: null, reason: "dangling-path" }); continue }
    if (r.state === "dangling") {
      if (r.level === "base") { invalid.push({ doc, resolved: null, reason: "dangling-path" }); continue }
      invalid.push({ doc, resolved: r.tried?.[0] ?? null, reason: "not-doc-file", sameName: r.sameName })
      continue
    }
    const p = r.abs
    if (!abs && !isInside(p, view.root)) { invalid.push({ doc, resolved: p, reason: "outside-project" }); continue }
    if (abs && !owningProject(p, cwd)) { invalid.push({ doc, resolved: p, reason: "outside-project" }); continue }
    if (!isDocFile(p)) { invalid.push({ doc, resolved: p, reason: "not-doc-file" }); continue }
    resolved.set(doc, p)
  }
  return { resolved, invalid }
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
