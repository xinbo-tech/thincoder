/**
 * agent/write-gate.mjs — M4 写权门禁（评审目标解析 + D5 冻结窗口判据组装）。
 *
 * v2 唯一增量（模块设计 §2.1）：评审对象 / 被审文件路径来源改读 manifest `docRoot`
 * （去硬编码 `docs/`），token 门（`anyLiveDesignSlot`）与冻结窗口谓词本体继承 v1 零改
 * （KD-M4-3）——本档承载三个单点：
 *
 * 1. `resolveReviewTargetPaths(agent)` —— 评审目标解析单点：读 manifest `docRoot`
 *    产出评审对象 / 被审文件的绝对路径集合（目录级；子键值形态 = 串 | 多根数组，
 *    展开走 `docRootPaths`）。缺 `docRoot` 键 → `readManifest`
 *    的 fillDefaults 已补默认（架构 §2.3 E2 便利 fallback 落点）；整档缺失 / 非法 JSON →
 *    `{ok:false}` → 回退 DEFAULT_MANIFEST.docRoot（本函数是壳门之下的便利层——E2 的
 *    「整档缺失」由壳面 requireManifest 按用点处置（判 + 报明 / 建档，**不抛**——
 *    启动侧恒不拒，KD-M1-25；**工程模式会话**口径——普通会话装配钩子零 manifest I/O，
 *    KD-M1-12）：CLI make-agent.mjs / VSC setup.mjs 同判）；读错（权限等）→ 上抛不伪装成缺失（manifest.mjs 契约）。
 *    M6 的 `advisor.mjs` design-review 分类分支消费本导出
 *    （KD-M6-1——同源不重复实现；落 dispatch.mjs 会让 advisor 反向 import 门禁簇成环）。
 * 2. `freezeWindowConflict(agent, absPaths)` —— D5 冻结窗口判据组装：被审文件集 =
 *    声明文档集（`inflightDesignReviewConflict` 同源 docAbs 腿）+ 批次档（`run.batchDoc`
 *    腿——评审绑定批档在途时，写批档同样致 stale）。dispatch.mjs / VSC tool-gates.mjs
 *    只 import 消费，不再各自直连 `advisor-settle.mjs`。
 * 3. `batchRecordWriteConflict(agent, depth, absPaths)` —— 批次档写门判据组装（#309 ·
 *    `AGENT-LOOP-SUBAGENT.md` §6.29.1）：判据与拒绝文案同址（文案字面只出本档）。
 *    两端取用 = 核 `agent/dispatch.mjs` Phase 1 / VSC `agent/tool-gates.mjs` `preGateBlocked`。
 *
 * 继承零改面（本档不碰）：token 门资格判据（anyLiveDesignSlot / validateDesignToken）、
 * 代码路径判定（conventions.mjs 单一权威分类——KD-M4-1 保留为代码路径判定用）。
 */
import { basename, resolve } from "node:path"
import { DEFAULT_MANIFEST, docRootPaths, readManifest } from "../manifest.mjs"
// advisor-settle 无上游依赖本簇（dispatch → write-gate → advisor-settle 单向）。normAbs
// 权威本体 = review-facts.mjs（第 33 批迁入），advisor-settle re-export；本档再 re-export
// （指针链非副本），M6 经本档一行 import 取齐。
import { inflightDesignReviewConflict, normAbs } from "../agent-tools/advisor-settle.mjs"
// 批次档路径单源（叶档——`BATCH-RECORD.md` §4.15）：批次档写门基底集取 `batchDocBases`。
import { batchDocBases } from "../agent-tools/batch-paths.mjs"
export { normAbs }

/** 评审目标解析读的 docRoot 键集（评审对象/被审文件可住的所有文档层——M6 分类据此判定）。 */
const REVIEW_ROOT_KEYS = ["requirements", "specs", "design", "modules", "batches"]

/**
 * 评审目标解析单点（M4 §2.1#1）：读 manifest `docRoot` → 评审对象 / 被审文件的绝对路径
 * 集合（目录级，反斜杠归一；子键值形态 = 串 | 多根数组，逐键经 `docRootPaths` 展开）。
 * 缺 `docRoot` 键 → readManifest 已补默认；整档缺失 / 非法 →
 * `{ok:false}` → 回退 DEFAULT_MANIFEST.docRoot（便利层——E2 的「整档缺失」由壳面
 * requireManifest 按用点处置（判 + 报明 / 建档，**不抛**——启动侧恒不拒，KD-M1-25；**工程模式会话**口径——KD-M1-12），本函数不重复拦）；
 * 读错（权限等）→ 上抛 fail-closed。
 * @param {Object} agent
 * @returns {string[]} 评审目标目录的绝对路径（去重）
 */
export function resolveReviewTargetPaths(agent) {
  const cwd = agent?.cwd ?? process.cwd()
  // 读错上抛（manifest.mjs:readManifest 契约——不伪装成缺失）；整档缺失/非法 → {ok:false}。
  const man = readManifest(cwd)
  const root = man.ok && man.manifest?.docRoot && typeof man.manifest.docRoot === "object"
    ? man.manifest.docRoot
    : DEFAULT_MANIFEST.docRoot
  const out = []
  for (const key of REVIEW_ROOT_KEYS) out.push(...docRootPaths(root?.[key], cwd))
  return [...new Set(out)]
}

/**
 * D5 冻结窗口判据组装（M4 §2.1#2）：评审在途（点火 → 结算）期间父侧对被审文件集
 * （声明文档集 + 批次档）的写入 → 返回冲突 { id, path }；无冲突 → null。
 * 声明文档集腿 = `inflightDesignReviewConflict`（同 docAbs / 同 normAbs，仅 running
 * 未取消的设计条目）；批次档腿 = 同池条目 `run.batchDoc`（评审绑定批档在途时写批档
 * 同样致 stale——被审文件集合流点）。两腿同形返回，消费端拒绝文案零改。
 * @param {Object} agent
 * @param {string[]} absPaths — 本次写将触碰的路径（ABS——调用方 resolve(agent.cwd, p)）
 * @returns {{id: string, path: string}|null} 命中评审 id + 冲突路径（ABS），无冲突 null
 */
export function freezeWindowConflict(agent, absPaths) {
  const declared = inflightDesignReviewConflict(agent, absPaths)
  if (declared) return declared
  const pool = agent?._asyncAdvisors
  if (!(pool instanceof Map) || pool.size === 0) return null
  const wanted = (absPaths ?? [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .map((p) => normAbs(p, agent?.cwd))
  if (wanted.length === 0) return null
  const wantedSet = new Set(wanted)
  for (const entry of pool.values()) {
    if (!entry || entry.reviewType !== "design") continue
    if (entry.status !== "running" || entry.cancelled || entry.done) continue
    const batchDoc = entry.run?.batchDoc
    if (typeof batchDoc !== "string" || batchDoc.length === 0) continue
    const batchAbs = normAbs(batchDoc, agent?.cwd)
    if (wantedSet.has(batchAbs)) return { id: String(entry.id), path: batchAbs }
  }
  return null
}

/** 批次档写门基底集**按 run 记忆化**（每 run 一次 manifest 读——§6.29.1；键 = agent 对象）。
 *  载体 = WeakMap（agent 回收即随 GC——无跨 run 残留）；cwd 变更即失效重读。 */
const batchGateBasesMemo = new WeakMap()

/** 比较键（绝对形态归一：`.` 段归位 + 分隔符归一 `/` + win32 大小写归一——§6.29.1 判据）。 */
const gateKey = (p) => {
  const s = resolve(String(p)).replace(/\\/g, "/")
  return process.platform === "win32" ? s.toLowerCase() : s
}

function memoizedBatchBases(agent, cwd) {
  const memo = agent && typeof agent === "object" ? batchGateBasesMemo.get(agent) : null
  if (memo && memo.cwd === cwd) return memo.bases
  const bases = batchDocBases(cwd)
  if (agent && typeof agent === "object") batchGateBasesMemo.set(agent, { cwd, bases })
  return bases
}

/** 目标是否落基底根内（按路径段——win32 大小写归一；同 `batch-paths.mjs` 越基底判据口径）。 */
function underBase(targetKey, baseAbs, cwd) {
  const root = gateKey(normAbs(baseAbs, cwd))
  return targetKey === root || targetKey.startsWith(root.endsWith("/") ? root : root + "/")
}

/**
 * 批次档写门判据（#309 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.1——containment）：
 * 工程角色子代理（`depth > 0` ∧ `agent._batchDoc` 在场）对**批次档文件**的写 ⇒ 目标 ≠ 绑定档
 * ⇒ 冲突（fail-closed；写自己绑定的档 = 正常面放行）。比较键 = 绝对路径 + win32 大小写归一。
 * 界面：depth 0（主 agent——跨档处置是父侧职责）· 无 `_batchDoc`（非工程绑定族）· 主基底外的
 * 普通文件写 —— 三种形态均不进本门（返回 null，行为零变）。判据集由调用方限定 = `FILE_MUTATORS`
 * （`file_ops` / 读类不在门内——§6.29.1 边界）。
 * 拒绝文案**单源 = 本档**（两端直取 `message`——零字面副本）。
 * 恒零抛（形照 `freezeWindowConflict` 先例——全判据带形态守卫）。
 * @param {Object} agent — 子代理 agent（读 `_batchDoc` / `cwd`）
 * @param {number} depth — 执行深度（> 0 = 子代理）
 * @param {string[]} absPaths — 本次写将触碰的绝对路径集（调用方已 resolve）
 * @returns {{bound: string, target: string, message: string}|null} 命中 = 冲突信息 / 否则 null
 */
export function batchRecordWriteConflict(agent, depth, absPaths) {
  if (!(depth > 0)) return null
  const bound = agent?._batchDoc
  if (typeof bound !== "string" || bound.length === 0) return null
  const wanted = (absPaths ?? []).filter((p) => typeof p === "string" && p.length > 0)
  if (wanted.length === 0) return null
  const cwd = typeof agent?.cwd === "string" && agent.cwd.length > 0 ? agent.cwd : process.cwd()
  const bases = memoizedBatchBases(agent, cwd)
  const boundAbs = normAbs(bound, cwd)
  const boundKey = gateKey(boundAbs)
  for (const p of wanted) {
    const target = normAbs(p, cwd)
    const targetKey = gateKey(target)
    if (targetKey === boundKey) continue // 写自己绑定的档 = 正常面
    if (!bases.some((b) => underBase(targetKey, b, cwd))) continue // 非批次档文件（含缺 manifest 的基底外盘面）
    return {
      bound: boundAbs,
      target,
      message: `write refused — cross-batch batch-record write: this child is bound to ${basename(boundAbs)}; ${basename(target)} is a different batch record. Write only your own bound record (the batch tool targets your bound record); the parent agent handles other batch records.`,
    }
  }
  return null
}

