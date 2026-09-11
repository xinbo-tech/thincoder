/**
 * advisor-async.mjs — §11.2 async advisor 后台评审池（AGENT-LOOP.md §11.2——R13——
 * 2026-09-06——VS Code 镜像）。独立 _asyncAdvisors（复用同一套 pending/digest/注入/冻结
 * 消费机制——机制角色无关——不碰 subagent 管线）：
 * - 容量默认 ADVISOR_POOL_LIMIT = 4（三池统一默认 4——POOL-CONFIG-UNIFIED F-1 2026-09-09）
 *   ——可配 agent.poolLimits.advisor（读取器每 launch 判定——非法/缺省回退 4）——
 *   超限新评审发起即返回错误文案（不排队——文案报当前生效上限）；
 * - 取消（②-6b）：⏹/cancel 定向中止 running 评审（entry.controller abort——run.mjs signal
 *   链）→ cancelled settle：不入 pending、不入 token 槽、模型可见取消提醒（"评审已取消——
 *   token 未签发"语义——注入机读线——与 subagent injectCancelReminder 同型）；
 * - settle 记账（探索结论③ + 修正 #2/#4——settle 时执行）：① 陈旧判定（launch 后 FILE
 *   MUTATORS——code 评审按 code-path 面（doc/temp 编辑不触发——L58）/ design 评审按对象
 *   文档面）→ 不置 _calledAdvisorThisRun、
 *   设计评审不签发 token（guard 仍推回——防静默漏审）；② 通过 → token 入槽
 *   _engDesignTokens.set(designId, token) + 当场同步落盘 slot 权威台账（D1——无镜像，D5）；
 *   ③ 轮次按 review 实例记（history._advisorRuns——cap 随实例——每评审 ≤5 轮——修正 #4，
 *   第 6 次启动拒）；④ guard 推回判定 = 无未决 + 无陈旧标记才算未评审（run-stages 消费
 *   advisorReviewInFlight）。
 * - 收敛状态 per-review（②-5）：_advisorRuns Map<reviewId, {round, priorOutput, stale,
 *   state, reviewType, scopeKey, designId}>——reviewId = designId（设计评审）/随机 id
 *   （code 复核）；续跑经同 type+scope 的 settled 记录解析（round = 记录 round + 1——
 *   prior = 记录 priorOutput——多评审并行隔离）。
 * - 载体：池/pending/_advisorRuns 挂共享 depth-0 history 数组（agent per-run 重建——
 *   _asyncSubagents 同款先例）；agent._asyncAdvisors per-run 从 history 恢复。
 * - UI 通道（②-4）：role="advisor" 伪角色——onSubagent 行/块/⏹/冻结全复用；live 流经
 *   onToolPanel(`sub:advisor#${id}`, chunk)（subagent 块同型——cancel 走 ②-6b 路由）。
 */
import { randomUUID } from "node:crypto"
import { resolve } from "node:path"
import { runAdvisorReview, resolveAdvisorProvider, ADVISOR_LAUNCH_REFUSAL_PREFIX } from "../advisor/run.mjs"
import { advisorIncompleteMarker, incompleteNotice } from "../advisor/compaction.mjs"
import { isCodePath, loadConventions } from "../conventions.mjs"
import { generateDesignToken, makeDesignTokenRegex, buildApprovedSuffix, stripApprovedSuffix } from "./advisor.mjs"
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { logEvent } from "../log.mjs"
import { nextSubagentId, getAsyncPool } from "./subagent-scheduler.mjs"
import { settleAsyncEntry, buildChildSignal } from "./async-settle.mjs"
import { setSlotEngDesignTokens } from "../extension/session-slot-write.mjs"
import { digestBudgetOver, persistOverflowReport } from "./digest-budget.mjs" // B5（群 B 批 §16 D-DG2）：digest 注入预算单源

/** §11.2（②-6a）：并行评审上限默认 4（2 → 4——POOL-CONFIG-UNIFIED F-1——三池统一
 *  默认——运行时回退权威——config-io AGENT_DEFAULTS.poolLimits.advisor 为 config 层
 *  镜像——耦合锁 test/config-pool.test.mjs 逐键断言）——可配 agent.poolLimits.advisor——
 *  超限拒（不排队——评审间有依赖语义——修正轮依赖前轮处置——排队无意义）。 */
export const ADVISOR_POOL_LIMIT = 4

/** §11.2 advisor 池生效上限（纯——POOL-CONFIG-UNIFIED F-2）：读 agent.poolLimits.advisor
 *  ——合法（≥1 整数）→ 生效值；非法/缺省 → 回退 ADVISOR_POOL_LIMIT（4）。与 subagent
 *  域 effectivePoolLimits 独立不共享——键表语义不同（subagent 两键表不含本键）。 */
export function resolveAdvisorPoolLimit(raw) {
  const v = raw?.advisor
  return Number.isInteger(v) && v >= 1 ? v : ADVISOR_POOL_LIMIT
}

/** launch 判定点每次读 parent.config（变更即生效下个 launch——文案如实报生效值）。 */
export function advisorPoolLimitFor(parent) {
  return resolveAdvisorPoolLimit(parent?.config?.agent?.poolLimits)
}

/** 实例轮次上限（run.mjs MAX_ADVISOR_ROUNDS 同值 5——每评审 ≤5 轮——修正 #4：code
 *  第 6 次启动拒；design 豁免 cap（2026-09-07 §8——轮次继续递增、不拒）。 */
export const MAX_REVIEW_ROUNDS = 5

/** 实例轮次载体（history 优先——跨 runAgent 存活——agent per-run 重建）。 */
export function advisorRunsMap(parent, create = false) {
  const holder = parent.history ?? parent
  if (!(holder._advisorRuns instanceof Map)) {
    if (!create) return new Map()
    holder._advisorRuns = new Map()
  }
  return holder._advisorRuns
}

/** 评审池 Map（D1 accessor——history 载体优先双查询吸收——settle 回调/驱动同读）。 */
export function advisorPoolMap(parent) {
  return getAsyncPool(parent, "advisor")
}

/** 记录一次文件变更事件（abs 路径）。execute-tools FILE_MUTATORS 分支与
 *  mergeChildMutations（子代理磁盘写入合入）调用。 */
export function recordFileMutation(parent, absPath) {
  if (typeof absPath !== "string" || !absPath) return
  const holder = parent.history ?? parent
  if (!Array.isArray(holder._fileMutEvents)) holder._fileMutEvents = []
  holder._fileMutEvents.push(absPath)
}

/** 未决评审判定（guard ④——_asyncAdvisors 无 running/queued 才算无未决——未决不算未评审）。 */
export function advisorReviewInFlight(parent) {
  const maps = []
  if (parent._asyncAdvisors instanceof Map) maps.push(parent._asyncAdvisors)
  if (parent.history?._asyncAdvisors instanceof Map) maps.push(parent.history._asyncAdvisors)
  for (const map of maps) {
    for (const e of map.values()) {
      if (e.status === "running" || e.status === "queued") return true
    }
  }
  return false
}

/** 评审 scope 键（type+scope 续跑匹配——paths/documents 排序归一）。§29.1 F2h（评审发现
 *  #3）：路径归一（resolve(cwd) 绝对化）——同一文档集换写法（"./" 前缀/反斜杠/相对绝对）
 *  不误建新实例（CLI docSetKey 同款理由）——sync designScopeKey 与 async 本函数同构同源。 */
function scopeKeyOf(paths, documents, cwd) {
  const src = Array.isArray(paths) ? paths : (Array.isArray(documents) ? documents : [])
  const norm = (p) => {
    const s = String(p)
    return cwd && !/^[a-zA-Z]:[\\/]/.test(s) && !s.startsWith("/") ? resolve(cwd, s) : s
  }
  return JSON.stringify([...new Set(src.filter((x) => typeof x === "string" && x.trim()).map(norm))].sort())
}

/** 陈旧判定（修正 #2 + L58——settle 时）：launch 后发生 FILE_MUTATORS——code 评审按
 *  code-path 面（src/ 无条件；temp/doc 排除——doc/temp 编辑不判陈旧——对齐 CLI
 *  reviewIsStale code 分支）；design 评审按对象文档面（documents 命中；无 documents
 *  → 文档形态面 docs/*.md）。 */
export function advisorStale(parent, entry) {
  const events = (parent.history ?? parent)._fileMutEvents
  if (!Array.isArray(events)) return false
  const after = events.slice(entry.eventsAtLaunch ?? 0)
  if (after.length === 0) return false
  if (entry.reviewType !== "design") {
    // code 面：仅 code-path 变更判陈旧（doc/temp 编辑不触发）。events 为绝对路径——
    // isCodePath（src/conventions.mjs 单一权威）按实例 cwd 取声明（与设计门禁同源判据——
    // 声明 codePaths 后 lib/*.md 的变更同样入陈旧判定）。
    const conv = loadConventions(entry.cwd ?? process.cwd())
    return after.some((p) => isCodePath(p, conv))
  }
  // design 面：变更命中评审文档（相对 cwd 或绝对形态——win32 分隔符归一）→ 陈旧
  const docs = Array.isArray(entry.documents) ? entry.documents.filter(Boolean) : []
  const cwd = entry.cwd ?? process.cwd()
  const norm = (p) => String(p).replace(/\\/g, "/")
  const hitDoc = (ev) => {
    const e = norm(ev)
    const rel = e.startsWith(norm(cwd)) ? e.slice(norm(cwd).length).replace(/^\//, "") : e
    for (const d of docs) {
      if (e === norm(d) || rel === norm(d)) return true
    }
    if (docs.length === 0) {
      // legacy design 面（无 documents——git diff 发现）：文档形态（.md/.markdown）
      return /\.mdx?$|\.markdown$/i.test(e) || /(^|\/)docs(\/|$)/i.test(e)
    }
    return false
  }
  return after.some(hitDoc)
}

/**
 * E 族（F25/§14.4(c)）——D5 冻结窗口写前拦截的冲突检测：设计评审在途（点火 → 结算）期间
 * 父侧对**被审文件集**的写入会被预闸拒绝（在途写使本轮结算 stale——pass 轮 token 白丢）；
 * 判据与 `advisorStale` 设计面**同源**（含 legacy 面）；仅扫 design × running × 未取消 ×
 * 未结算（结算后写不再致 stale）→ {id, path} | null（命中评审 id + 冲突路径 ABS）。
 */
export function inflightDesignReviewConflict(parent, absPaths) {
  const pool = advisorPoolMap(parent) // D1 accessor——history 载体优先双查询吸收
  const wanted = (absPaths ?? []).filter((p) => typeof p === "string" && p.length > 0)
  if (!(pool instanceof Map) || pool.size === 0 || wanted.length === 0) return null
  const norm = (p) => String(p).replace(/\\/g, "/")
  for (const entry of pool.values()) {
    if (!entry || entry.reviewType !== "design" || entry.status !== "running" || entry.cancelled || entry.done) continue
    const docs = Array.isArray(entry.documents) ? entry.documents.filter(Boolean) : []
    const cwd = norm(entry.cwd ?? process.cwd())
    for (const p of wanted) {
      const e = norm(p)
      const rel = e.startsWith(cwd) ? e.slice(cwd.length).replace(/^\//, "") : e
      const hit = docs.length > 0
        ? docs.some((d) => e === norm(d) || rel === norm(d))
        : (/\.mdx?$|\.markdown$/i.test(e) || /(^|\/)docs(\/|$)/i.test(e))
      if (hit) return { id: String(entry.id), path: p }
    }
  }
  return null
}

/**
 * §11.2 实例解析：同 type+scope 的 settled 记录（已完轮数最高者）→ 续跑（round+1，
 *  prior 注入、designId 沿用——同一设计的修正轮）；无 → 新实例（round 1）。
 *  record state: running（飞行中）/settled（可续跑）/cancelled（取消——不匹配——
 *  取消轮不计轮次）。cap：记录 round ≥ MAX_REVIEW_ROUNDS → 第 6 次启动拒（修正 #4）。
 *  同 scope 守卫（POOL-CONFIG-UNIFIED F-5——用户裁① 2026-09-09）：同 type+scope 有
 *  running 记录 → 拒（running 并行多实例歧义放大——现只收 settled——settled 续跑
 *  语义不变——与池容量守卫独立两关都过才启动）。
 */
function resolveReviewInstance(parent, reviewType, paths, documents, scopeKey) {
  const runs = advisorRunsMap(parent)
  let best = null
  for (const rec of runs.values()) {
    if (rec.reviewType !== reviewType || rec.scopeKey !== scopeKey) continue
    if (rec.state === "running") {
      return { error: `Advisor: 此 scope 已有 ${reviewType} 评审在跑——settle 后逐个发起 — a ${reviewType} review of this scope (same documents/paths) is still running; round/prior continuation would be ambiguous — wait for it to settle, then launch the next review (AGENT-LOOP.md §11.2).` }
    }
    if (rec.state !== "settled") continue
    if (!best || rec.round > best.round) best = rec
  }
  if (best) {
    // 2026-09-07 §8 ruling: design reviews are EXEMPT from the cap — a design
    // instance may continue past 5 rounds (rounds still advance for the
    // convergence prompts / round display); the cap refuses CODE instances only.
    if (reviewType !== "design" && best.round >= MAX_REVIEW_ROUNDS) {
      return { error: `Advisor: the ${reviewType} review of this scope has reached its convergence cap (${MAX_REVIEW_ROUNDS} rounds per review instance — §11.2 修正 #4) — accept the current state and proceed, review manually, or start a new session` }
    }
    return { record: best, reviewId: best.reviewId, designId: best.designId ?? null, round: best.round + 1, priorOutput: best.priorOutput ?? null }
  }
  const reviewId = randomUUID()
  return { record: null, reviewId, designId: null, round: 1, priorOutput: null }
}

/**
 * §11.2 async 评审 launch（advisor 工具 async 分支调用——不 await 评审）。
 * reviewType: "design" | "code"。design 实例：reviewId = designId（②-5——token 槽键）；
 *  designToken 每轮现铸（uuid:expiresAt 流程凭证——续跑同 id 新 token）。
 * 返回 { entry }（已启动入池）或 { error }（容量满/实例 cap/scope 守卫/深度门——工具层转返回文案）。
 */
export function launchAsyncAdvisor({ parent, ctx, reviewType, documents, paths, object, batchDoc = null }) {
  // 写侧经 agent 字段建池——安全前提 = run 起始绑定不变式（agent.mjs 在 run 起始把
  // agent._asyncAdvisors 绑定到 history 同一 Map 或新 Map，回合尾回写 history——读侧
  // D1 accessor（advisorPoolMap/getAsyncPool）history 优先与之一致；direct-execute ctx
  // 回落 agent 字段同一载体）。
  const pool = (parent._asyncAdvisors ??= new Map())
  const limit = advisorPoolLimitFor(parent)
  const running = [...pool.values()].filter((e) => e.status === "running").length
  if (running >= limit) {
    return { error: `Advisor: another review is already running (pool limit ${limit} — agent.poolLimits.advisor, default ${ADVISOR_POOL_LIMIT} — §11.2 ②-6a) — start reviews one at a time and wait for each to finish (另有一评审在跑——逐个发起)` }
  }
  const scopeKey = scopeKeyOf(paths, documents, ctx.cwd)
  const inst = resolveReviewInstance(parent, reviewType, paths, documents, scopeKey)
  if (inst.error) return { error: inst.error }
  const runs = advisorRunsMap(parent, true)
  const id = nextSubagentId(parent) // 池 id 与 subagent 池同命名空间（webview 行 map 共用——全局唯一）
  const isDesign = reviewType === "design"
  const designId = isDesign ? (inst.designId ?? inst.reviewId) : null // design: reviewId === designId
  const designToken = isDesign ? generateDesignToken(parent) : null
  const record = inst.record ?? {
    reviewId: inst.reviewId, reviewType, scopeKey, round: 0,
    priorOutput: null, stale: false, state: "running", designId,
  }
  if (inst.record) {
    record.state = "running"
    record.stale = false
    record.designId = record.designId ?? designId
    // 陈旧续跑注（review note）：stale settle 后 guard 仍推回 → 同实例续跑（round+1，
    // prior = 陈旧前轮输出）。收敛协议已内置该处理：ROUND2+ 提示词声明 earlier diffs
    // STALE + 要求 read 验证证据（advisor/main.mjs 头注）——评审者按当前盘面复审，
    // prior 仅作修复清单上下文——无行为洞。
  }
  runs.set(inst.reviewId, record)
  const entry = {
    id, role: "advisor", status: "running",
    reviewType, reviewId: inst.reviewId, round: inst.round,
    documents: documents ?? null, paths: paths ?? null, object: object ?? null,
    batchDoc, // §2.20.2/§2.22.5 实例键绑定（entry.batchDoc → runAdvisorReview 的 rv.batchDoc）
    designId, designToken,
    model: null, startedAt: Date.now(),
    done: false, report: null, error: null, cancelled: false,
    controller: new AbortController(),
    settled: null, _resolve: null, _onCancelled: null,
    eventsAtLaunch: ((parent.history ?? parent)._fileMutEvents?.length) ?? 0,
    cwd: ctx.cwd,
  }
  entry.settled = new Promise((res) => { entry._resolve = res })
  try { entry.model = resolveAdvisorProvider(parent).model } catch { /* model tag optional */ }
  // 条目级 controller 链到共享 child signal（会话中止/全停逐链传播——cancel 只 abort 本条目）
  // D6 buildChildSignal 单点（sessionSignal ?? agent._sessionSignal ?? ctx.signal）
  const childSignal = buildChildSignal(ctx)
  if (childSignal) {
    if (childSignal.aborted && !childSignal.reason?.interrupt) entry.controller.abort()
    else childSignal.addEventListener?.("abort", () => {
      if (childSignal.reason?.interrupt) return
      entry.controller.abort()
    }, { once: true })
  }
  entry._onCancelled = () => ctx.callbacks?.onSubagent?.({ id: entry.id, role: "advisor", status: "cancelled" })
  // §17 D-S8 同型：挂起期 settle → "settled"（行驻留 awaiting digestion——digest 消化后
  // reclaim 补发 done 折叠）；非挂起 settle → "done"（行即时回收）
  entry._onTerminal = (suspended) => ctx.callbacks?.onSubagent?.({ id: entry.id, role: "advisor", status: suspended ? "settled" : "done" })
  // UI 流通道（②-4——role=advisor 伪角色块——subagent 块同型）
  const stream = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:advisor#${entry.id}`, chunk)
  entry.start = () => {
    entry.startedAt = Date.now()
    ctx.callbacks?.onSubagent?.({ id: entry.id, role: "advisor", status: "started", startedAt: entry.startedAt, model: entry.model, pool: true })
    logEvent("advisor:spawn", { id: `${entry.reviewType}#${entry.id}`, round: entry.round, kind: "async", status: "running" })
    // 测试缝（escalate-async `ctx.runAgent ??` 同形先例）：缺省 = 生产 runAdvisorReview；仅测试注入。
    const reviewRunner = ctx?.runAdvisorReview ?? runAdvisorReview
    // runAdvisorReview promise = entry.start 等值（runner 包装——rv 携带实例轮次/prior——
    // 并发隔离——不读全局 round/prior）
    reviewRunner(parent, reviewType, {
      onOutput: (chunk) => stream(chunk),
      signal: entry.controller.signal,
    }, designToken, documents ?? null, paths ?? null, object ?? null, { round: entry.round, priorOutput: inst.priorOutput ?? null, batchDoc: entry.batchDoc ?? null }, entry.designId)
      .then(
        (result) => settleAdvisorReview(parent, entry, result, null, ctx.callbacks?.onAsyncSettled),
        (err) => settleAdvisorReview(parent, entry, null, err?.message ?? String(err), ctx.callbacks?.onAsyncSettled),
      )
  }
  pool.set(id, entry)
  entry.start()
  return { entry }
}

/** 设计评审通过判定：结果回显 token（makeDesignTokenRegex 匹配——与 sync 路径同判定）。 */
function designReviewPassed(entry, result) {
  if (entry.reviewType !== "design" || !entry.designToken || !result) return false
  return makeDesignTokenRegex(entry.designToken).test(result)
}

/**
 * §11.2 settle（记账点——修正 #2/#4——在 pending 移交/消化注入之前执行）：
 * ① 陈旧判定（advisorStale）→ 不置 _calledAdvisorThisRun、设计不签发 token（guard 仍推回）；
 * ② 非陈旧 + 设计通过 → token 入槽（designId 键 + D1 同步落盘权威 slot——镜像已退役 D5）；
 *   非陈旧任意完成 → _calledAdvisorThisRun = true（sync 路径 execute 后记账的镜像）；
 * ③ 实例轮次/prior/stale 落 _advisorRuns 记录（cap 已由 launch 侧按实例拒）；
 * ④ §29 fix B——分支输出形态写回 entry.report（digest 注入点原样进 digest）：通过 =
 *   剥方括号 [DESIGN-TOKEN:…] 原文 + Approved/designId 后缀（sync 参照形态同构）；
 *   stale 设计 = 同剥 + 前置 "评审目标已变更——token 未签发" 提示——不变式：digest 永不
 *   展示未注册 token（两分支都清洗）；
 * ⑤ cancelled settle：不入 pending/不入 token 槽（取消提醒已在 cancel 时注入机读线——
 *   "评审已取消——token 未签发"语义）；会话中止（controller aborted 非 cancel）→ 出池清理；
 *   挂起期 settle → 移交 history._pendingAsyncResults（pending 单容器 +role——
 *   ASYNC-RESULT-CONTAINER.md D2——digest 轮注入——D-S3 ② 同机制）。
 *
 * ASYNC-RESULT-CONTAINER.md D3（2026-09-08）：公共收尾（落 report/error/done/status、
 * 日志三连、cancelled/parentAborted/挂起分流、_resolve 唤醒、notifySettle）统一走
 * settleAsyncEntry 共享 helper（async-settle.mjs——四族同守卫 !parentAborted 严格版
 * 同日志同分流）；本函数 = 族包装——①-④ 记账段作 onAccounting hook 注入（D1 落盘
 * 保留——settle 当场同步写槽权威台账，写失败即 settle 失败）。
 */
export function settleAdvisorReview(parent, entry, result, error, notifySettle) {
  const runs = advisorRunsMap(parent)
  const record = runs.get(entry.reviewId)
  settleAsyncEntry(parent, entry, {
    pool: "advisor",
    report: result, error, notifySettle,
    logId: `${entry.reviewType}#${entry.id}`, // 日志契约：design#N/code#N（LOGGING.md）
    refill: false, // 独立池（ADVISOR_POOL_LIMIT——不占 subagent 槽位，无补位）
    onAccounting: (p, e, { phase }) => {
      if (phase === "cancelled" || phase === "aborted") {
        // 定向 cancel / 会话中止——取消轮不计轮次（record 不匹配续跑）
        if (record) record.state = "cancelled"
        return
      }
      advisorSettleAccounting(p, e, record)
    },
  })
}

/** §11.2 settle 记账（①-④——onAccounting hook，仅非 cancelled/非中止的 settled
 *  相位执行；ASYNC-RESULT-CONTAINER.md D3 族 hook——D1 落盘保留）。 */
function advisorSettleAccounting(parent, entry, record) {
  const result = entry.report
  const childLogId = `${entry.reviewType}#${entry.id}`
  {
    const stale = advisorStale(parent, entry)
    let passed = false
    let issued = false // 持久化成功才算"签发"（D1：写失败即 settle 失败）
    // F18/F23（第 12 批 §13.4 契约四——消费点 2/3 同谓词）：宿主截断尾判定——块首行扫描
    // 单谓词（六 kind）；error settle（result=null）→ null（无文本可判）。
    const incomplete = advisorIncompleteMarker(result)
    // B2 契约 1／2（§17.1——F30）：launchRefused 判定上移 `if (!stale)` 块外（无条件求值——语义零变）——记录段守卫与 failureVerdict 共用同一判定。
    const launchRefused = result != null && String(result).startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)
    if (!stale) {
      passed = entry.reviewType === "design" && !incomplete && designReviewPassed(entry, result)
      if (passed) {
        // D1（DESIGN-TOKEN-SETTLEMENT.md，2026-09-08）：settle 当场同步写槽文件权威台账——
        // designId 键控持久，token 随会话 slot 跨进程/重启存活。_engPersist = 顶层面板会话
        // （eng tool 先例）。改同步 setSlotEngDesignTokens（去 F2g fire-and-forget）——**写失败
        // 即 settle 失败**（可重评，不静默吞错）：不注册 token/Approved 后缀，digest 报未持久化
        // 并引导重评。用含新 token 的快照先落盘，成功才登记内存槽——失败不产生部分状态。单值
        // 镜像已随 D5 退役——只写多槽表，不写镜像字段。
        const persist = parent._engPersist
        let durable = !persist?.cwd || !persist?.slot // 无会话槽绑定 → 仅内存登记（非面板场景）
        if (!durable) {
          const snapshot = new Map(parent._engDesignTokens ?? [])
          snapshot.set(entry.designId, entry.designToken)
          try {
            durable = setSlotEngDesignTokens(persist.cwd, persist.slot, Object.fromEntries(snapshot)) === true
          } catch (e) {
            durable = false
            console.error(`[eng-settle] slot persist threw: ${e?.message ?? e}`)
            logEvent("advisor:error", { id: childLogId, err: `engDesignTokens slot persist threw: ${e?.message ?? String(e)}` })
          }
          if (!durable) {
            console.error(`[eng-settle] slot ${persist.slot} persist failed — design token NOT durably issued; settle failed (re-review)`)
            logEvent("advisor:error", { id: childLogId, err: "engDesignTokens slot persist failed — settle failed (re-review)" })
          }
        }
        issued = durable
        if (issued) {
          parent._engDesignTokens ??= new Map()
          parent._engDesignTokens.set(entry.designId, entry.designToken)
          // F2c（§29.1）：Approved 后缀单一 builder（id 回显 + 省略指引 + 槽数时点注记——
          // 与 sync 同源）；F2e 的 prior 存储用同一串精确截断。
          entry.approvedSuffix = buildApprovedSuffix(entry.designToken, entry.designId, parent._engDesignTokens.size)
        }
      }
      // 机械失败 settle（run.mjs resolve 失败文本——评审未产出判定）不置 called。
      // F23（第 12 批）：失败判定改用**同一谓词**——旧 `^` 锚正则退役（定义与消费零残留）；
      // 六 kind 全覆盖 ⊇ 旧六形态（含 review_failed 字符串 resolve；`empty` 本端括号字面
      // 旧正则本就不命中——改进非丢失）；error settle（result=null + error）判定保留。
      // A（F24/§14.3——异步结算消费面）：启动拒绝报告 = 未发起请求（无评审产出）——不得
      // 计为评审覆盖（与同步工具面同源前缀；正常链不可达＝防御纵深）。
      const failureVerdict = (entry.reviewType !== "design" && (
        incomplete !== null ||
        (result == null && entry.error != null)
      )) || launchRefused
      if (!failureVerdict) parent._calledAdvisorThisRun = true
      if (record) record.stale = false
    } else if (record) {
      record.stale = true
    }
    // §29 fix B：分支输出形态（有 result 时才清洗——error settle 无 result——digest 走 error）
    if (result != null && entry.reviewType === "design" && entry.designToken) {
      const strip = (t) => String(t ?? "").replace(makeDesignTokenRegex(entry.designToken, "g"), "").trim()
      if (stale) {
        const stripped = strip(result)
        entry.report = `评审目标已变更——token 未签发 (review target changed after launch — this review judged a stale state; no design token was issued — re-run the review on the current state)\n\n${stripped}`.trim()
      } else if (incomplete) {
        // F18（第 12 批——消费点 2）：未完成即不签发——剥后文本 + 未签发提示（stale 分支
        // 在外层优先保留）；D1 台账零写（issued 未置位）。
        entry.report = `${strip(result)}\n\n${incompleteNotice(incomplete)}`.trim()
      } else if (issued) {
        entry.report = `${strip(result)}\n\n${entry.approvedSuffix}`
      } else if (passed) {
        // D1: 评审通过但权威台账写失败 = settle 失败（可重评）——不附 Approved 后缀，digest
        // 明确告知未持久化签发，无 eng-coder spawn 授权。
        entry.report = `${strip(result)}\n\nD1: the design review passed but the token could NOT be durably written to the session ledger (slot persist failed) — re-run advisor(type='design') to re-issue; no eng-coder spawn is authorized for this review (评审通过但 token 未能持久化——需重评).`
      } else {
        entry.report = strip(result) || "Advisor: design review did not pass."
      }
    }
    if (record && !launchRefused) {
      record.round = Math.max(record.round ?? 0, entry.round ?? 1)
      // prior = 清洗后报告（§29 fix B——prior 永不带可回显的方括号 token）；F2e（§29.1）：
      // 再剥引擎 Approved 后缀（精确截断——prior 不带原生 token/designId）。
      const trimmed = String(entry.report ?? "").trim()
      const looksLikeReview = /\|.*\|.*\|/.test(trimmed) || trimmed.length >= 200
      if (looksLikeReview && entry.report != null) {
        record.priorOutput = stripApprovedSuffix(entry.report, entry.approvedSuffix ?? null)
      }
    }
    // B2 契约 2（§17.1——F30）：拒绝结算 = 未发起 = 无 attempt——round/prior 整段跳过；state 照归 settled（同 scope 续跑通道保住）。
    if (record) record.state = "settled"
    // 挂起分流/pending 移交/出池/_onTerminal/_resolve/notifySettle——helper 公共段
    // （pending 单容器 history._pendingAsyncResults +role——D2；正常回合留池 done:true——
    // done-in-pool 统一表示——回合尾 collectSettledAdvisors / 挂起会话 sweep）
  }
}

/** §11.2 取消（②-6b——UI ⏹ 路由 + 共用核心——镜像 cancelSubagent）：
 *  running 评审 → entry.cancelled + controller.abort（run.mjs signal 链——定向中止）+
 *  机读线提醒（cancelled settle 不入 pending/不入 token 槽——"评审已取消——token 未签发"
 *  由提醒表达——digest 提示语义）。 */
export function cancelAdvisorReview(parent, id) {
  const map = advisorPoolMap(parent) // D1 accessor——history 载体优先双查询吸收
  const idNum = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : id
  if (idNum == null || !map || !map.has(idNum)) {
    return JSON.stringify({ id, status: "error", error: `unknown async advisor review id: ${id}` })
  }
  const entry = map.get(idNum)
  if (entry.done) {
    return JSON.stringify({ id, status: "error", error: `advisor review #${id} has already finished — nothing to cancel` })
  }
  if (!entry.cancelled) {
    entry.cancelled = true
    entry.controller?.abort()
    const body = `[System reminder: async advisor review #${entry.id} (${entry.reviewType}) cancelled by user — no design token was issued (评审已取消——token 未签发); its findings are discarded. Launch the review again to re-review the current state.]`
    parent.history?.push?.({ role: "user", content: escapeXml(body) })
  }
  return JSON.stringify({ id, status: "cancelled" })
}

/** §11.2 digest 注入（同 injectAsyncResult 形态——报告 XML 转义 + >64K offload）。
 *  注入即消费（调用方从容器移除）。§29 fix B：报告本体由 settle 按分支清洗（通过 =
 *  Approved/designId 后缀——sync 参照形态同构；stale = 剥回显 + 未签发提示）——此处
 *  原样注入、不再附 designId 注记（未通过/未签发的 digest 附 spawn 指引会误导模型——指引已由通过分支的 Approved 后缀自含）；§16 D-DG2（群 B 批 B5）：raw 计入轮预算（四族共享单源）——超限改清单行（全文落盘）+ 首条豁免。 */
export async function injectAdvisorResult(entry, { history, fullHistory, cwd }) {
  const raw = String(entry.error ?? entry.report ?? "")
  const saved = digestBudgetOver(history, raw.length) ? persistOverflowReport(raw, { cwd: cwd ?? process.cwd(), tag: `advisor#${entry.id}` }) : null
  const body = saved != null ? escapeXml(saved) : (entry.error != null ? `error: ${escapeXml(entry.error)}` : escapeXml(offloadToolResult(cwd, entry.report ?? "")))
  const kind = entry.reviewType === "design" ? "design" : "code"
  pushReal(history, fullHistory, {
    role: "user",
    content: `[System reminder: async advisor ${kind} review #${entry.id} finished]\n\n${body}`,
  })
}

/** 回合尾收集（非 suspDriven 兜底——mirror collectSettledAsync）：settled 直注入 + 出池。 */
export async function collectSettledAdvisors(agent, { history, fullHistory, cwd, suspDriven = false }) {
  const map = agent._asyncAdvisors
  if (!map || map.size === 0) return
  if (suspDriven) return
  for (const e of [...map.values()]) {
    if (!e.done) continue
    await injectAdvisorResult(e, { history, fullHistory, cwd })
    map.delete(e.id)
  }
}
