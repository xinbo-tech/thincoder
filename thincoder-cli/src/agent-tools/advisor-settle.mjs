/**
 * advisor-settle.mjs — advisor settle accounting + mutation log + stale / freeze
 * determination（2026-09-11 第 11 批自 advisor-async.mjs 拆出——500 行 = 硬帽在册，
 * 任何新增必越；既有 import 面经 advisor-async.mjs **re-export 保持不变**
 * （noteMutations / mutationSeqOf / reviewIsStale / settleAdvisorRun）。
 *
 * 内容 = 迁入（逐字搬移含注释）+ 本批两处接线：
 *  - `settleAdvisorRun` —— 记账本体零改（轮次 / 陈旧 / token D1 落盘 / prior）；A 族
 *    未完成判定改用单谓词 `advisorIncompleteMarker`（§14.3 消费点 1/2）：design 结算经
 *    `settleDesignReview(…, { incomplete })` 未完成即不签发；code 完成守卫同谓词
 *    （旧 `^` 锚首行失败正则退役——六形态语义零丢，含 review_failed 字符串
 *    resolve 形态）；
 *  - `inflightDesignReviewConflict` —— E 族（F17/§14.14）D5 冻结窗口冲突检测：与
 *    `reviewIsStale` 同族（同 docAbs / 同 normAbs）、仅扫 running 且未取消的设计条目
 *    （dispatch Phase-1 预闸消费）。
 *
 * 第 33 批（2026-09-11——评审失败护栏 §17.5）：`normAbs` 本体迁 `review-streak.mjs`
 * （原处 re-export 保面）+ design 结算计数接线（分类单源 `designReviewOutcome` →
 * `noteDesignReviewOutcome`，三出口）——记账本体 / 陈旧判定 / 轮次 / token 落盘零改。
 */
import { persistEngTokens } from "../token-ttl.mjs"
import { settleDesignReview, makeDesignTokenRegex, stripApprovedSuffix } from "./design-token.mjs"
import { looksLikeReviewOutput, advisorIncompleteMarker, ADVISOR_LAUNCH_REFUSAL_PREFIX } from "../advisor/run.mjs"
import { isCodePath, loadConventions } from "@thincoder/core/conventions.mjs"
import { logEvent } from "@thincoder/core/log.mjs"
// 第 33 批（§17.5）：`normAbs` 迁 `review-streak.mjs`（中立模块——护栏与陈旧判定共用同一归一）
// + 结算分类 / 计数落账（异步结算计数点）。
import { normAbs, designReviewOutcome, noteDesignReviewOutcome } from "./review-streak.mjs"

// ─────────────────────────────────────────────────────────────────────────────
// Mutation log (stale-review determination — fix #2: FILE_MUTATORS after the
// review launch make the settle stale: no called-mark, no token, guard re-pushes)
// ─────────────────────────────────────────────────────────────────────────────

export function mutationSeqOf(agent) {
  return agent._mutationSeq ?? 0
}

/** Record a file-mutation commit — bounded ring feeding the stale scan. paths = ABSOLUTE.
 *  唯一记账点（§29 fix A）：dispatch runOne 写执行成功即刻调用（取代批后段 + 中断分支——
 *  不双计）；mergeChildMutations（子代理合入）是独立事件面。 */
export function noteMutations(agent, paths) {
  const list = (paths ?? []).filter((p) => typeof p === "string" && p.length > 0)
  if (list.length === 0) return
  agent._mutationSeq = (agent._mutationSeq ?? 0) + 1
  const log = agent._mutLog ??= []
  log.push({ seq: agent._mutationSeq, paths: [...new Set(list)] })
  if (log.length > 200) log.splice(0, log.length - 200)
}

// 第 33 批（§17.5）：`normAbs` 本体迁 `review-streak.mjs`；原处 re-export 保既有 import 面
// （advisor-async / 测试）零变。
export { normAbs } from "./review-streak.mjs"

/** Stale = a mutation committed after the launch touched the review's face:
 *  code reviews judge the CODE face; design reviews judge their OWN documents. */
export function reviewIsStale(agent, entry) {
  const log = agent?._mutLog
  if (!Array.isArray(log) || log.length === 0) return false
  const since = log.filter((m) => m.seq > (entry.launchSeq ?? -1))
  if (since.length === 0) return false
  if (entry.reviewType === "design") {
    const scope = (entry.docAbs ?? []).map((p) => normAbs(p, agent?.cwd))
    if (scope.length === 0) return false // no explicit doc scope — nothing to judge stale
    const set = new Set(scope)
    return since.some((m) => (m.paths ?? []).some((p) => set.has(normAbs(p, agent?.cwd))))
  }
  // Code face = the shared classifier (src/conventions.mjs) — one authority with
  // the design gate and the mutation guard (PORTABILITY FR12 / PO-10).
  const conv = loadConventions(agent?.cwd)
  return since.some((m) => (m.paths ?? []).some((p) => isCodePath(normAbs(p, agent?.cwd), conv)))
}

/**
 * E 族（F17/§14.14 E-3d）——D5 冻结窗口写前拦截的冲突检测：设计评审**在途**（点火 → 结算）
 * 期间，父侧对被审文件集（`docAbs` = 声明文档集，含批次档）的写入会被 dispatch 预闸拒绝。
 * 判据与 `reviewIsStale` **同源**（同一 docAbs / 同一 normAbs）；仅扫 **running 且未取消**
 * 的设计条目（已结算 / 已取消条目不拦——结算后写不再致 stale、取消的结算早退不判）。
 * 保守残余（如实注）：回合中止后池清前的窗口可能拒一笔不致 stale 的写（保守方向）。
 * @param {Object} agent
 * @param {string[]} absPaths — 本次写将触碰的路径（ABS——调用方 resolve(agent.cwd, p)）
 * @returns {{id: string, path: string}|null} 命中评审 id + 冲突路径（ABS），无冲突 null
 */
export function inflightDesignReviewConflict(agent, absPaths) {
  const pool = agent?._asyncAdvisors
  if (!(pool instanceof Map) || pool.size === 0) return null
  const wanted = (absPaths ?? [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .map((p) => normAbs(p, agent?.cwd))
  if (wanted.length === 0) return null
  for (const entry of pool.values()) {
    if (!entry || entry.reviewType !== "design") continue
    if (entry.status !== "running" || entry.cancelled || entry.done) continue
    const scope = (entry.docAbs ?? []).map((p) => normAbs(p, agent?.cwd))
    if (scope.length === 0) continue
    const set = new Set(scope)
    for (const p of wanted) if (set.has(p)) return { id: String(entry.id), path: p }
  }
  return null
}

/**
 * Settle accounting (fix #2/#4 — runs when a non-cancelled review settles,
 * BEFORE the pending transfer / digest injection):
 *  1. round++ (attempts count — parity with the legacy _advisorRound++ budget);
 *  2. stale determination — mutated targets since launch → no called-mark, no token;
 *  3. non-stale: code review → _calledAdvisorThisRun = true; design review →
 *     token echo check (settleDesignReview: slot + instance close; single-value
 *     mirror retired per DESIGN-TOKEN-SETTLEMENT D3) + D1 settle-time slot persist
 *     (persistEngTokens — write failure = settle failure: no registration, no
 *     Approved echo, re-review — 评审 #1);
 *  4. §29 fix B — branch-shaped report output (the caller writes it back to
 *     entry.report; digest injects the CLEANED form): pass → stripped +
 *     Approved/designId suffix (sync 参照形态); persist-failed → stripped +
 *     "D1: …token could NOT be durably written…" re-review notice (no Approved
 *     suffix — never an unregistered token); stale → echo stripped +
 *     "评审目标已变更——token 未签发" prefix — never an unregistered token.
 * 第 11 批增补（A/F11）：`incomplete` = 宿主尾族判定（单谓词）——design 结算未完成即不
 * 签发（`settleDesignReview` 的 `opts.incomplete`）；code 完成守卫的失败判定改用同谓词
 * （六形态语义零丢——旧 `^` 锚正则退役）。
 * 第 33 批增补（§17.5 计数点 1）：design 结算按分类单源（`designReviewOutcome`）落账到
 * 会话级护栏 `agent._designReviewStreaks`（三出口：非陈旧 / 陈旧 / 无报告）——cancel 早退
 * 与无实例路径不计（neutral 语义 = 无尝试发生）。
 * Cancelled / parent-aborted reviews consume nothing (the user dropped the
 * attempt — the retry must not lose budget).
 * @returns {{cancelled: boolean, stale: boolean, passed: boolean, report: string|null}}
 */
export function settleAdvisorRun(agent, entry) {
  if (entry.cancelled) return { cancelled: true, stale: false, passed: false, report: null }
  const run = entry.run
  if (!run) return { cancelled: false, stale: false, passed: false, report: entry.report ?? null }
  const result = entry.report ?? null
  run.round++
  agent._advisorRound = run.round
  const stale = reviewIsStale(agent, entry)
  run.stale = stale
  let report = result
  let passed = false
  let persistFailed = false
  // 宿主尾族判定（单谓词——design 结算与 code 守卫共用；§14.3 消费点 1/2）。
  const incomplete = result != null ? advisorIncompleteMarker(String(result)) : null
  // 启动拒绝报告（未发起请求——无评审产出）：第 33 批上移为本结算段**单点**——消费 = ① design
  // 失败分类（neutral——无尝试发生，§17.3 #1）② code 守卫 failureVerdict（既有语义零变）。
  const launchRefused = result != null && String(result).startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)
  if (!stale) {
    if (run.reviewType === "design" && entry.designToken && result) {
      // settle 前 Map 快照——落盘失败时回滚用（settle 失败 = 结算未发生，不留半结算态：
      // 重评覆盖旧槽的边角（F2h 复用 designId）也原样恢复旧 token——内存与盘一致）。
      const preMap = agent._engDesignTokens instanceof Map
        ? new Map(agent._engDesignTokens)
        : null
      const settled = settleDesignReview(agent, run, entry.designToken, result, { incomplete })
      if (settled.passed) {
        // DESIGN-TOKEN-SETTLEMENT D1（2026-09-08）：settle 是唯一结算点——settle 当场
        // 同步落盘 token 字段到槽文件（persistEngTokens = engTokenSlotFields 序列化 +
        // session 安全写/轮转——勿裸写文件），不等下个回合尾 saveSession（消除"settle→
        // 下个 saveSession"间的重启丢 token 窗口）。
        // 写失败即 settle 失败（评审 #1）：token 不注册（Map 回滚到 settle 前快照）、无
        // Approved 回显、可重评——不静默吞错、不产生"内存有盘上无"态（宁可结算失败
        // 可重评，不留半结算态）。
        let durable = false
        try {
          durable = persistEngTokens(agent)
        } catch (e) {
          logEvent("advisor:error", { id: `advisor#${entry.id}`, err: `engDesignTokens slot persist threw: ${e?.message ?? String(e)}` })
        }
        if (durable) {
          passed = true
          report = settled.output
        } else {
          if (preMap) agent._engDesignTokens = preMap
          else delete agent._engDesignTokens
          run.approvedSuffix = null
          persistFailed = true
          logEvent("advisor:error", { id: `advisor#${entry.id}`, err: "engDesignTokens slot persist failed — settle failed (re-review)" })
          const stripped = String(result)
            .replace(makeDesignTokenRegex(entry.designToken, "g"), "")
            .trim()
          report = `${stripped}\n\nD1: the design review passed but the token could NOT be durably written to the session ledger (slot persist failed) — re-run advisor(type='design') to re-issue; no eng-coder spawn is authorized for this review (评审通过但 token 未能持久化——需重评).`.trim()
        }
      } else {
        report = settled.output
      }
    }
    // A completed review covers the code face ONLY when it actually produced a
    // verdict: a mechanical-failure settle ("Advisor: review failed/timeout/…" —
    // run.mjs resolves with the failure text, it never throws) must not satisfy
    // the guard silently — the digest shows the failure and the guard pushes
    // back for a retry (fix #2 anti-silent-skip intent; attempts still consume
    // the per-review round budget, so repeated failures stay bounded by the
    // cap). An error settle (rejection path — report null with an error) has no
    // verdict either — same exclusion (advisor 复评补边). Design reviews keep
    // the mark on any completed verdict (parity with the sync recordToolResults
    // mark — they have no code face to cover) — EXCEPT a launch-refusal report
    // (nothing was sent, no verdict at all: see launchRefused below).
    // 第 11 批（F16/A3）：失败判定 = 单谓词六 kind（含 review_failed 字符串 resolve 形态）
    // ——旧 `^` 锚正则只认首行形态，漏「时间线 + 尾」；语义零丢（六形态全覆盖）。
    // 另：设计评审的**启动拒绝报告**（未发起请求——无评审产出）同样不得计为评审覆盖
    // （§14.4 异步结算面判据；与同步工具面 _advisorRefusals 同源前缀；正常链不可达＝防御纵深）
    // ——判定已上移为本结算段单点（launchRefused，上方）。
    const failureVerdict = (run.reviewType !== "design" && (
      incomplete !== null ||
      (result == null && entry.error != null)
    )) || launchRefused
    if (!failureVerdict) {
      agent._calledAdvisorThisRun = true
    }
  } else if (run.reviewType === "design" && entry.designToken && result != null) {
    // §29 fix B（stale 分支）：陈旧评审不签发——digest 不得展示未注册 token——先剥
    // 方括号回显 + 前置 "评审目标已变更——token 未签发"（不变式——两分支都清洗）。
    const stripped = String(result)
      .replace(makeDesignTokenRegex(entry.designToken, "g"), "")
      .trim()
    report = `评审目标已变更——token 未签发 (review target changed after launch — this review judged a stale state; no design token was issued — re-run the review on the current state)\n\n${stripped}`.trim()
  }
  // 第 33 批（§17.5 计数点 1——异步结算）：design 三出口（非陈旧 / 陈旧 / design 无报告）统一
  // 按分类单源落账——count/stale/no_credential/no_report 增计数，可用判决复位，取消 / 中断 /
  // 拒发 neutral（分类表见 §17.3）。cancel 早退 / 无实例在函数头已返回（不计）。
  if (run.reviewType === "design") {
    noteDesignReviewOutcome(agent, run.docSetKey, designReviewOutcome({
      launchRefused, stale, hasResult: result != null, incomplete, persistFailed,
    }))
  }
  // Prior of round 2+ = the last REVIEW-LOOKING output (mirror of run.mjs's guard).
  // F2e (§29.1): strip the engine-approved suffix FIRST — the prior must never
  // carry the raw token / designId (exact truncation — zero collateral).
  if (report && looksLikeReviewOutput(report)) {
    run.priorOutput = stripApprovedSuffix(report, run.approvedSuffix)
  }
  return { cancelled: false, stale, passed, report }
}
