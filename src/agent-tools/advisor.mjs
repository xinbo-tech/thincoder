/**
 * agent-tools/advisor.mjs — advisor tool wrapper (VS Code port, kept in sync with CLI).
 * The agent calls this explicitly to get an independent review.
 * type="design" for design doc review, type="code" for code review (default).
 */
import { randomUUID } from "node:crypto"
import { resolve } from "node:path"
import { runAdvisorReview, resolveAdvisorProvider } from "../advisor/run.mjs"
import { isDocFile } from "../advisor/repos.mjs"
import { resolveBatchDocPath } from "./batch-segment.mjs"

const TOKEN_TTL_DEFAULT_MS = 7 * 24 * 3600 * 1000 // 7-day ceiling (v2 2026-08-25): multi-batch delivery must not re-review an unchanged design within a week; agent.engTokenTtlMs overrides. 2026-09-06 设计 B: HMAC 防伪层删除——token = 无签名流程凭证 uuid:expiresAt（public-default-secret 警告一并移除——安全剧场——见 ENGINEERING-MODE.md 2026-09-06 段）

/** Effective token TTL: config override with runtime validation (advisor timeoutMs precedent —
 *  invalid values fall back to the default, never silently disable the ceiling). */
function effectiveTokenTtlMs(agent) {
  const cfg = agent?.config?.agent?.engTokenTtlMs
  return (Number.isFinite(cfg) && cfg > 0) ? cfg : TOKEN_TTL_DEFAULT_MS
}

/** Generate an unsigned design token with expiration (2026-09-06 设计 B — the HMAC
 *  signature layer is gone: token = uuid:expiresAt process credential — format + TTL
 *  fail-closed; slot matching _engDesignTokens.get(designId) === token unchanged).
 *  Export——advisor-async（§24 D-24b）续跑轮现铸同用。 */
export function generateDesignToken(agent) {
  const uuid = randomUUID()
  const expiresAt = Date.now() + effectiveTokenTtlMs(agent)
  return `${uuid}:${expiresAt}`
}

/**
 * F2c/F2e（§29.1 2026-09-07）：引擎生成的 Approved 后缀——单一 builder（sync settle +
 * async settle 共用——advisor-async.mjs import 本文件）；prior 存储面用 stripApprovedSuffix
 * 精确后缀截断（不用正则猜——零误伤）。槽数为 settle 时点快照——spawn 时槽况可能已变
 * （F2d 兑底）。
 */
export function buildApprovedSuffix(designToken, designId, slotCount) {
  return `Approved. Pass this exact token to eng-coder (designToken parameter): ${designToken}
designId: ${designId} (pass as the designId parameter when spawning eng-coder — optional while this session holds a single design; ${slotCount} approved design slot(s) held as of this approval, and the count may have changed since — with several designs the spawn gate refuses a missing designId and lists the held ids)`
}

/** F2e（§29.1）：从将入 prior 的报告剥掉引擎 Approved 后缀——后缀由 builder 确定性生成，
 *  截断精确；不以该后缀结尾的文本原样通过。 */
export function stripApprovedSuffix(text, suffix) {
  if (typeof text !== "string" || !suffix) return text
  return text.endsWith(suffix) ? text.slice(0, text.length - suffix.length).trim() : text
}

/** Parse a design token's numeric expiry — null unless the token is format-valid
 *  (uuid:expiresAt — exactly 2 parts with a numeric expiry). ALL other shapes return
 *  null (v2 2026-08-25: the two legacy fail-open branches (parts!=3, NaN expiry) were
 *  pass-through backdoors — any malformed string bypassed validation; 2026-09-06 设计 B:
 *  legacy 3-part signed tokens (uuid:expiresAt:HMAC) are FORMAT errors now — the HMAC
 *  layer is deleted, the format check rejects them (存量 3 段 token 一次性失效——需重新评审)).
 *  Single parse source shared by validateDesignToken and isExpiredDesignToken. */
function tokenExpiry(token) {
  if (!token || typeof token !== "string") return null
  const parts = token.split(":")
  if (parts.length !== 2) return null // 1-part / 3-part (legacy signed) / 4+ all reject — fail-closed
  const [uuid, expiresAt] = parts
  if (!uuid) return null
  const expTime = parseInt(expiresAt, 10)
  if (isNaN(expTime)) return null // fail-closed (was: return true, v2 2026-08-25)
  return expTime
}

/** Expired classification — TRUE only for a FORMAT-VALID token whose TTL has passed.
 *  Malformed strings are NOT "expired" (they classify as invalid at the gates). R16
 *  cleanup timings (restore filter / eng(enter) sweep / spawn-gate slot deletion —
 *  ENG-TOKEN-BINDING-TUNING.md §5.1 D-R16c) drop ONLY expired tokens; malformed ones
 *  read back and the gates reject them — never proactively deleted. */
export function isExpiredDesignToken(token) {
  const exp = tokenExpiry(token)
  return exp !== null && Date.now() > exp
}

/** Validate design token: check format (uuid:expiresAt) AND expiration — all fail-closed. */
export function validateDesignToken(token) {
  return tokenExpiry(token) !== null && !isExpiredDesignToken(token)
}

/** Extract UUID from token for regex matching */
export function extractTokenUUID(token) {
  const parts = token.split(":")
  return parts.length >= 1 ? parts[0] : token
}

/** Build a [DESIGN-TOKEN:...] regex (CLI parity — flexible surrounding context).
 *  Escape the ENTIRE token (uuid:expiresAt — 2026-09-06 设计 B: the HMAC segment is gone;
 *  the advisor echoes the full token, so matching only the UUID segment can never match and
 *  the approval never registers (eng-coder gate then rejects a valid token).
 *  Export——advisor-async（§24 D-24b）通过判定同用。 */
export const makeDesignTokenRegex = (token, flags = "") => {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:^|\\s|\`|\\*)\\[DESIGN-TOKEN:\\s*${escaped}\\s*\\](?:\\s|$|\`|\\*)`,
    flags + "ms"
  )
}

/** F2h（§29.1 2026-09-07）：sync design scope 键（与 async scopeKeyOf 同构同源——documents
 *  排序 + resolve(cwd) 归一——换写法不误建新实例——评审发现 #3）。 */
function designScopeKey(documents, cwd) {
  const norm = (p) => {
    const s = String(p)
    return cwd && !/^[a-zA-Z]:[\\/]/.test(s) && !s.startsWith("/") ? resolve(cwd, s) : s
  }
  return JSON.stringify([...new Set((documents ?? []).filter((d) => typeof d === "string" && d.trim()).map(norm))].sort())
}

/** F2h（§29.1）：会话内该 doc-scope 的 designId——最新的同 scope settled 记录（async
 *  launch 落记录；sync settle 亦落（下方）——sync→sync 链同样复用）。无 → null。 */
function designIdForScope(parent, documents, cwd) {
  const runs = (parent.history ?? parent)._advisorRuns
  if (!(runs instanceof Map) || runs.size === 0) return null
  const key = designScopeKey(documents, cwd)
  for (const rec of [...runs.values()].reverse()) {
    if (rec.reviewType === "design" && rec.scopeKey === key && rec.designId) return rec.designId
  }
  return null
}

/** F2h（§29.1）：sync settle 登记 scope→designId 映射（与 async 记录同图——下个同 scope
 *  评审 sync/async 均复用该 id；既有记录不覆盖——async 实例的 round/prior 归其所有）。 */
function recordSyncDesignScope(parent, documents, designId, cwd) {
  if (!designId) return
  const holder = parent.history ?? parent
  const runs = holder._advisorRuns instanceof Map ? holder._advisorRuns : (holder._advisorRuns = new Map())
  if (runs.has(designId)) return
  runs.set(designId, {
    reviewId: designId, reviewType: "design", scopeKey: designScopeKey(documents, cwd),
    round: 0, priorOutput: null, stale: false, state: "settled", designId,
  })
}

export const advisorTool = {
  name: "advisor",
  description:
    "Run an independent review on your work. " +
    "Use type='design' to review design documents before implementation — pass documents=[...] with the explicit list of doc paths to review; use documents in code review too (the task's Docs involved list). " +
    "Use type='code' (default) to review code changes after implementation — pass paths=[...] to specify which files or directories to review, or documents=[...] for acceptance criteria context. " +
    "The advisor is an independent read-only sub-agent that explores the codebase, " +
    "reads files, and traces callers via grep/lsp. " +
    "For code review: round 1 does a full review, round 2 verifies the prior table, " +
    "round 3+ strictly checks only the prior table — convergence, not divergence. " +
    "For design review: single-pass review against methodology and requirements. " +
    "Review criteria come from .thincoder/advisor.md (if present) or sensible defaults. " +
    "After the review, you MUST produce a response table (see discipline rules for format). " +
    "If advisor says all clear, call verify.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["code", "design"], description: "Review type: 'design' for design doc review, 'code' for code review (default)" },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Code files or directories to review (for code review). Required unless documents is provided. The advisor reads the files/directories listed here — it has no git tool and never inspects diffs.",
      },
      documents: {
        type: "array",
        items: { type: "string" },
        description: "Explicit list of doc paths to review (design docs, requirements docs, referenced docs). The advisor reviews ONLY these — it does NOT scan git diff. Use for both design review and code review to pass the task's Docs involved list.",
      },
      batchDoc: {
        type: "string",
        description: "Design review only: path to the batch record currently in flight. Validated WHENEVER passed (any review type) — a value that is not a readable file is refused with an error rather than ignored; for design reviews the reviewer then ALSO gets the batch_segment write channel to record its findings table + VERDICT + counts into §3 (ENGINEERING-MODE.md §2.20/§2.22.5). Omit when no batch record is in flight — the review then runs unchanged with no write channel (zero regression).",
      },
      object: {
        type: "object",
        description:
          "Review-object declaration (mechanical — do not infer; AGENT-LOOP.md §18.8). Pass {type, target, status, reason, exclude}: review type, review target (docs + section, or files), object state (pending review / approved / implemented), why it is reviewed (user-initiated / delivery verification), and the exclude list (approved/implemented items — explicitly NOT in this review). Injected verbatim at the head of the review user message every round. Optional — legacy calls without it behave unchanged.",
        properties: {
          type: { type: "string", enum: ["code", "design"], description: "Review type (mirrors the top-level type)" },
          target: { type: "string", description: "Review target: docs + section, or files/directories" },
          status: { type: "string", description: "Object state: pending review / approved / implemented" },
          reason: { type: "string", description: "Why this review: user-initiated / delivery verification" },
          exclude: { type: "array", items: { type: "string" }, description: "Excluded items — approved/implemented, NOT in this review" },
        },
      },
      async: {
        type: "boolean",
        description: "Launch the review in the BACKGROUND (AGENT-LOOP.md §24 D-24b): the tool returns an ack immediately, the turn ends naturally, and the report arrives automatically (settle → digest) — the review never blocks the turn. Default: true at the top level (depth-0 — §24 R12 depth-0 async default precedent), always sync inside subagents (passing async:true there is refused). async:false forces the blocking review (mechanism parameter — top-level launches are async by default).",
      },
    },
  },
  readonly: true,
  sideEffectExempt: true,
  async execute(args, ctx) {
    const agent = ctx.agent
    const reviewType = args.type || "code"
    const documents = args.documents || null
    // §24 D-24b（R13——2026-09-06）：async 缺省 = depth-0（R12 先例——②-3 A + 修正 #3：
    // depth>0 显式 async 拒 / 缺省恒同步——eng-coder 内部自审不翻转）。
    const asyncFlag = args.async ?? ((ctx.depth ?? 0) === 0)
    if (asyncFlag && (ctx.depth ?? 0) > 0) {
      return "Advisor: async reviews are only available at the top level (depth 0 — AGENT-LOOP.md §24 D-24b ②-3) — inside a subagent the advisor runs synchronously; drop the async flag or pass async:false"
    }
    // Review-object declaration (AGENT-LOOP.md §18.8 N-OA1): the parameter is a
    // JSON object; a string form (LLM serialization) is normalized defensively.
    // Non-object / unparseable → null → legacy degradation (AC-OA2).
    let object = args.object ?? null
    if (typeof object === "string") {
      try { object = JSON.parse(object) } catch { object = null }
    }
    if (object !== null && (typeof object !== "object" || Array.isArray(object))) object = null
    // Scope fallback: the runtime mutation record (zero git) covers guard-triggered
    // reviews where the model did not pass explicit paths (CLI parity).
    const paths = args.paths || (agent._touchedFiles?.length ? [...agent._touchedFiles] : null)

    // Code review must have a scope — no implicit fallback.
    if (reviewType !== "design" && !paths && !documents) {
      return "Advisor: no review scope specified. Provide paths (files/directories to review) or documents (acceptance criteria for code review)."
    }

    // Design review: validate that documents are in docs/ or are recognized doc files
    if (reviewType === "design" && documents) {
      const invalidDocs = documents.filter((doc) => {
        if (doc.startsWith("docs/") || doc.startsWith("docs\\")) return false
        return !isDocFile(doc)
      })
      if (invalidDocs.length > 0) {
        return `Advisor: design review documents must be in docs/ directory or be recognized doc files. Invalid: ${invalidDocs.join(", ")}`
      }
    }

    // §2.20.2 评审侧批次档门禁（第 5 批 VSC 镜像；口径 = **「若传则须可读」**）：空/不可读 →
    // throw（不静默忽略）；未传 → 不挂载写通道、评审照常（N5 零回归）。绑定随后续通道
    // 到达工具集（同步 callbacks.batchDoc / 异步 rv.batchDoc——实例键，非单值会话态）。
    const boundBatchDoc = args.batchDoc !== undefined && args.batchDoc !== null
      ? resolveBatchDocPath(agent.cwd, args.batchDoc)
      : null

    // §24 D-24b async 分支：后台启动（ack 即回——回合自然收尾）——容量/实例 cap 在
    // runner（launchAsyncAdvisor——{ error } 转返回文案——不排队）。settle 记账/消化
    // 全部走 advisor-async 机制（token 槽/guard 标记/cap/陈旧判定——见该模块头注）。
    if (asyncFlag) {
      const { launchAsyncAdvisor } = await import("./advisor-async.mjs")
      const r = launchAsyncAdvisor({ parent: agent, ctx, reviewType, documents, paths, object, batchDoc: boundBatchDoc })
      if (r.error) return r.error
      const e = r.entry
      return `Advisor ${reviewType} review started in the background (review #${e.id}, round ${e.round}) — the report arrives automatically when it finishes (settle → digest). Continue your turn; the review does not block.`
    }

    // Design review: NO round reset — design rounds 2+ continue the convergence
    // prompts like code reviews, but the 5-round cap is CODE-ONLY (2026-09-07
    // §8: design reviews are exempt — cap enforced in run.mjs / the async
    // runner for code instances only). Session reset also removed (CLI parity).

    // Generate the design token BEFORE the review and inject it into the advisor's prompt.
    // F2h（§29.1 2026-09-07）：sync 同 scope 复审沿用会话内该 doc-set 的 designId（取既有
    // 同 scope 记录——与 async 同构）；通过复审覆写同 id 槽（旧 token 门禁拒——T14）；旧
    // 槽 TTL 自然淘汰保留为兑底。无记录 → 新随机 id。
    const designToken = reviewType === "design" ? generateDesignToken(agent) : null
    const designId = reviewType === "design"
      ? (designIdForScope(agent, documents, agent.cwd) ?? randomUUID())
      : null
    // Progress chunks ({kind, text}) stream into the webview — same emission
    // contract as the CLI TUI (think / tool / text kinds). A "start" chunk first
    // opens the in-conversation advisor block tagged with the round number.
    const round = (agent._advisorRound || 0) + 1
    // Show the advisor's effective model in the block title (it may differ from the main agent's).
    const advModel = (() => { try { return resolveAdvisorProvider(agent).model } catch { return null } })()
    ctx.callbacks?.onToolPanel?.("advisor", { kind: "start", text: "", round, model: advModel })
    const result = await runAdvisorReview(agent, reviewType, {
      onOutput: (chunk) => ctx.callbacks?.onToolPanel?.("advisor", chunk),
      signal: ctx.signal,
      // 同步路的实例绑定传递（异步路走 rv.batchDoc——run.mjs 自行解析）：per-call 通道，非会话态。
      batchDoc: boundBatchDoc,
    }, designToken, documents, paths, object, null, designId)

    if (reviewType === "design") {
      // F2h record（§29.1）：无论通过与否都登记 scope→designId（async 同构——launch 时即
      // 有记录）——下个同 scope 评审复用同 id。
      recordSyncDesignScope(agent, documents, designId, agent.cwd)
      const tokenPattern = makeDesignTokenRegex(designToken)
      if (designToken && result && tokenPattern.test(result)) {
        // Advisor echoed the token → review passed. Issue it to the parent for eng-coder.
        // Multi-design slots (2026-09-01, CLI parity): store under this review's designId.
        // D5 (2026-09-08): 单值镜像 _engDesignToken 已退役——只写多槽 Map（agentState 随
        // onComplete 落盘权威槽 engDesignTokens；async 经 D1 settle 同步落盘）。
        agent._engDesignTokens ??= new Map()
        agent._engDesignTokens.set(designId, designToken)
        if (agent._role === "eng-coder") agent._engDesignReviewed = true
        const cleanResult = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        // designId rides the Approved block (review #1): the parent needs it to aim the
        // FIRST eng-coder spawn when several designs live in the same session. F2c (§29.1):
        // id 回显 + 单槽省略指引 + 槽数时点注记（同一 builder——async settle 同源）。
        const suffix = buildApprovedSuffix(designToken, designId, agent._engDesignTokens.size)
        const output = `${cleanResult}\n\n${suffix}`
        // F2e（§29.1）：sync prior 面——run.mjs 存的是带方括号回显的原输出；通过时覆写为
        // 清洗后形态（精确后缀截断——prior 永不带原生 token/designId）。
        agent._lastAdvisorOutput = stripApprovedSuffix(output, suffix)
        return output
      }
      // Review failed (or advisor chose not to pass) → do NOT touch ANY slot (方案 ②, review #2:
      // a failed RE-review leaves the previously approved token alive until TTL; the failed
      // call issued no token, so there is nothing to clear——its designId record（F2h）只登记
      // 映射不占槽). Isolation
      // (2026-08-30, extended to the multi-slot Map 2026-09-01, CLI parity): a network
      // glitch must not clear / other designs' slots must not be affected — only a COMPLETED
      // non-passing review lands here, and it revokes nothing.
      if (result) {
        const stripped = result.replace(makeDesignTokenRegex(designToken, "g"), "").trim()
        return stripped || "Advisor: design review did not pass."
      }
    }
    return result
  },
}
