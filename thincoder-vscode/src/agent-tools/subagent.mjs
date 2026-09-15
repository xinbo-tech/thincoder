/**
 * subagent.mjs — subagentTool (single tool, seven actions — AGENT-LOOP.md §19/§19.5:
 * spawn/status/observe/send/cancel/escalate/consume-design; no panel action in VS Code — §19.6 AC-P4; §19.8 2026-09-06: action:'check' 删除——结果仅自动通道；§2.6 2026-09-07: +action:'consume-design'
 * 链终消费制——父侧核销消费 designId 槽——执行器在本档（W12 自 subagent-spawn-gate.mjs 迁回）; SUBAGENT-OBSERVE-SEND.md 2026-09-08: +action:'observe'/'send' 父侧观察/注入运行中异步子代理——执行器在 subagent-actions.mjs)
 * Spawn a sub-agent for an independent subtask.
 * Engineering mode: role='eng-coder' requires a valid design token from advisor(type='design').
 * §17 (AGENT-LOOP.md D-S1..S9): suspension-aware settle (settled-while-suspended →
 * history._pendingAsyncResults), manual-tier auto-turn spawn gate, shared injector.
 * §18 (AGENT-LOOP.md D-E1..E3 + D-E1a R12 2026-09-06): depth-gated async default
 * (depth-0 → async, every role; depth>0 → sync — D-E1 role-level 缺省已 supersede),
 * internal delivery protocol; eng-coder children may only spawn synchronous explore
 * audit children (gateEngCoderSpawn — mechanical, incl. the 7th-spawn backstop).
 * §19/§19.5 (AGENT-LOOP.md, 2026-09-03): ONE tool, seven actions — spawn/status/observe/send/
 * cancel/escalate/consume-design（§19.8 2026-09-06：action:'check' 删除——结果仅自动通道）; action:"cancel" = control-class gate exemption (isControlAction),
 * status decision fields (D-M5), per-entry AbortController + cancelled settle +
 * model-visible reminder (D-M6), runChild(entry) binding, nested sub-attribution
 * forwarding (D-M8 webview 子标)。description/schema 载荷 verbatim 在本档（W12 自 subagent-spec.mjs 迁回）
 * （2026-09-05 round 2）；动作执行器/§20 调度器/async-audit 在 actions/scheduler/
 * async.mjs（public names re-exported below——500 行纪律拆分轮 2026-09-03/05）；本
 * 文件保留工具入口（dispatch/execute）+ 阻塞 spawn 路径 + 模式助手。2026-09-08 结构债
 * 批 6：runChild 巨型闭包（子代理执行闭环本体）→ ./subagent-run.mjs（CLI 同名对齐——
 * 自由变量收编参数对象——verbatim 迁移零行为变化——原私有非导出——消费面零影响）。
 */
import { logEvent, errText } from "@thincoder/core/log.mjs"
import { auditTaskBook, gateEngCoderSpawn, spawnAsyncSubagent, nextSubagentId } from "./subagent-async.mjs"
import { buildChildSignal } from "./async-settle.mjs"
import { subagentStatus, cancelSubagentAction, subagentObserve, subagentSend } from "./subagent-actions.mjs" // §19/§19.5 动作执行器（2026-09-05 拆分轮迁出；§19.8 删 check——subagentCheck 退役；2026-09-08 SUBAGENT-OBSERVE-SEND：+observe/send 执行器）
// W12（2026-09-15）：原 `subagent-spawn-gate.mjs` / `subagent-escalate.mjs` / `subagent-spec.mjs`
// 随 advisor 镜像批删旧——本档（唯一 src 消费面）按「增量迁入端壳」就地收留：token 门族
// （resolveDesignSlot / dropExpiredTokenSlot / authorizeEngCoderDesignToken / executeConsumeDesignAction
// ——见下方「eng-coder spawn token 门」节，逐字搬迁语义零变；resolveDesignSlot 同样导出保测试
// import 面）与 schema 载荷（subagentSpec——同节）；batchDoc 门族自 `./subagent-async.mjs` 复用；
// escalate 执行器改指核（动态 import——`@thincoder/core/agent-tools/subagent-actions.mjs`）。
import { resolveBatchDoc, NEEDS_BATCH_DOC } from "./subagent-async.mjs"
import { normalizeFileList, depInfo, describeBlockers, assertNoDepCycle } from "./subagent-scheduler.mjs" // §20 调度器（2026-09-05 拆分轮迁出）
import { validateDesignToken } from "@thincoder/core/agent-tools/design-token.mjs" // W12：token 工具核单源（端侧 advisor.mjs 删旧；叶子模块不入 node:sqlite 链）
import { tokenExpired } from "@thincoder/core/token-ttl.mjs"
import { setSlotEngDesignTokens, readSlotEngDesignTokens, clearSlotEngDesignToken } from "../extension/session-slot-write.mjs"
import { runChild } from "./subagent-run.mjs" // runChild 闭环（2026-09-08 结构债批 6——500 硬限拆——本体迁出——CLI 同名对齐）
// Re-export shim (2026-09-03 split/merge + 2026-09-05 模块拆分轮): the machinery + §19 action
// handlers live outside subagent.mjs — subagent-async.mjs (主体) / subagent-actions.mjs /
// subagent-scheduler.mjs — their public names stay importable from subagent.mjs so no
// consumer (agent.mjs / suspension.mjs / index.mjs / setup.mjs / panel-messages.mjs /
// tests) changed. subagentCheckTool is GONE (§19 T-M11); cancelSubagent joins the shim
// (§19.5 — the extension's UI ⏹ router reaches the pool-level cancel through it).
export { cancelSubagent } from "./subagent-actions.mjs"
export { ASYNC_SUBAGENT_LIMIT } from "./subagent-scheduler.mjs"
export { ENG_AUDIT_SPAWN_LIMIT, gateEngCoderSpawn, injectAsyncResult, collectSettledAsync, mergeChildMutations } from "./subagent-async.mjs"

// ─── W12（2026-09-15）：自删旧镜像就地收留的两块 ──────────────────────────────────────
// ① schema 载荷（原 `subagent-spec.mjs`——唯一消费方 = 本档工具对象；2026-09-05 module-split
//    round 2 拆出、W12 迁回）：description = 端侧七动作权威版（与 CLI 权威版逐段对齐，剔除
//    panel action 段——§19.6 AC-P4），字符串逐字、prompts 测试锁定的断言零变化。
// ② token 门族（原 `subagent-spawn-gate.mjs`——唯一 src 消费方 = 本档 authorize 调用点：
//    resolveDesignSlot / authorityTokens / reconcileFromAuthority / dropExpiredTokenSlot /
//    authorizeEngCoderDesignToken / executeConsumeDesignAction——逐字搬迁、语义零变；设计
//    authority = ENG-TOKEN-BINDING-TUNING.md §5.1（R16）+ DESIGN-TOKEN-SETTLEMENT.md（D4/D5）。
const subagentSpec = {
  description:
    "ONE tool, SEVEN actions (AGENT-LOOP.md §19/§19.5 + SUBAGENT-OBSERVE-SEND.md) — pick by what you need:\n" +
    "- action:'spawn' (DEFAULT): spawn a sub-agent to handle an independent subtask in an isolated context; the sub-agent returns only its final report. Spawn MULTIPLE subagents in the SAME response for parallel work—they run concurrently.\n" +
    "- action:'status': NON-BLOCKING progress query — returns immediately and consumes nothing. Give the spawn's id for one child ({id, role, status: running|queued|done, model, elapsedSec, turn, maxTurns, position?}), or omit it for an overview of the whole pool ({overview: {running: [{id, role, model, elapsedSec, turn, maxTurns}], queued: [{id, role, position}], done: [{id, role}]}}). §19.5.6 touched-files summary: running entries also carry touchedFiles (first 5, relative to your cwd), touchedMore (count beyond 5) and, when nothing was touched yet, the placeholder touched (\"—（尚无改动）\"); queued (not yet started) entries carry the placeholder touched (\"—（未启动）\") — see what a running child has changed BEFORE deciding to cancel it. Use THIS to check progress — action:'status' never blocks.\n" +
    "- action:'observe' (SUBAGENT-OBSERVE-SEND.md): progress snapshot of ONE running async child — pass the spawn's id to see what it is doing RIGHT NOW: its current tool (the tool it last called — name + args), its recent turn summaries (last 5, each = the first line of an assistant message OR the tool names it called — NEVER the full message bodies — truncation only), and turn/touchedFiles. Use THIS when status shows 'running' but you cannot tell whether the child is progressing or stuck — observe tells you which tool it is on and what it has been doing; if it has been on the same tool for a long time with no turn advance it may be spinning (send guidance or cancel). Like status it never blocks and consumes nothing (readonly); queued children show a placeholder, settled-but-unconsumed children show the terminal + a report preview.\n" +
    "- action:'escalate' (飞刀 — a flown-in expert): hand an implementation task to a STRONGER model from your consult models (agent.consultModels). It gets WRITE access and does the work itself — reads, edits, runs tests — then returns a post-op report (what changed, why, verification). Use it when YOU judge the task calls for stronger hands (complex multi-file refactoring, an intractable bug, intricate algorithm work — or work beyond your comfortable ability); escalate EARLY, not after burning attempts. Runs in the BACKGROUND by default (like an async spawn): the call returns an ack {id, role:'escalate', status} and the post-op report (with its file changes merged into your session) is delivered automatically when it finishes. model: pick a candidate as 'provider:model' (default = the first consult model). Not available in engineering mode (implementation goes through eng-coder spawns there).\n" +
    "- action:'cancel': STOP one background subagent — pass the id from the async spawn return (REQUIRED — omitting it errors; a blanket cancel is unsupported, Ctrl+C stops everything). Running target aborts immediately ({id, status:'cancelled'}); a queued target is removed from the queue ({id, status:'cancelled', was:'queued'} and later queue positions shift forward). Other children and the session keep running — cancellation is targeted. Use it when a background child is going the wrong way (e.g. burning turns) and you must stop it before its report arrives. Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first; prefer scoped recovery (restore a single affected file) over killing the child — a running child's in-flight work dies with it, partial changes stay unmerged and unaudited.\n" +
    "- action:'send' (SUBAGENT-OBSERVE-SEND.md): steer ONE running async child mid-flight — pass the spawn's id and a `message`. The message is QUEUED and delivered at the child's next turn boundary as an ORDINARY user instruction (NOT immediate — if the child is mid-tool/mid-generation, it takes effect when the current work returns, on the next turn). Use it to redirect a child that is going the wrong way or is stuck — cheaper than cancelling and losing its in-flight work. Returns {id, status:'injected', note}. Only a RUNNING async child accepts sends: a synchronous spawn returns no pool id; a finished (settled) / queued (not-yet-started) / unknown id errors clearly. If the child settles before the queued message is consumed, its report notes the message as NOT delivered (resend in a new spawn if the guidance still matters). send = control action (no file writes — no approval needed).\n" +
    "- action:'consume-design' (engineering mode, parent side — chain-terminal token consumption): after the delivery is verified and the chain closes out, consume this design's token slot — pass the designId (optional for a single-design session). The slot is consumed; a further spawn for the same designId is mechanically rejected, and any new work (including deviation fixes) requires a fresh design review and token. Idempotent: an unknown designId / already-consumed slot is a no-op notice, never an error. Do NOT call it while the chain is still open — fix rounds reuse the same slot (same designId + designToken).\n\n" +
    "Why delegate? A sub-agent runs in its own isolated context — its reads, searches, tool calls and edits never enter your history or pollute your window; only its final report comes back. Delegation keeps your working context lean (you see the whole session, not the child's noise) and the child single-mindedly focused on one task. Parallel children run concurrently, saving wall-clock time. Every coder/eng-coder child carries its own verify + advisor self-review discipline — handed-off work is already verified before you read a word of it.\n\n" +
    "Available roles (which roles are exposed depends on the active mode — see Mode filtering below):\n" +
    "- explore — read-only search & analysis. Toolset: the read/search family (grep, read, glob, code_search, doc_search, repo_outline, lsp, tree...). No git context injected—evidence from read/glob/grep and the task book. Its report must list what it searched and what it did NOT find. Fast — specify thoroughness in the task: quick / medium / thorough (default medium).\n" +
    "- plan — read-only implementation planning. Same read/search toolset; NEVER edits files. Returns a step-by-step plan for the parent to execute.\n" +
    "- coder — full implementation. The parent's complete read/write/execute toolset plus verify and advisor for self-review. Its final report must include a delivery transparency table with one row per task requirement (Done / Simplified / Not done — no deferred column).\n" +
    "- eng-coder — engineering-mode coder (available only in engineering mode, replacing coder). Same full toolset as coder plus the design-driven methodology overlay; REQUIRES a valid designToken arg obtained from a passed advisor(type='design') review. The advisor's Approved reply also echoes a designId — pass it as the designId arg: required to pick between designs when several approved reviews are active, optional for a single design. The delivery report echoes the designId back for the audit fix round. ALSO REQUIRES a batchDoc arg — the batch record path (docs/batches/<batch>-<topic>.md), the batch §2 task book this spawn implements: a spawn without it, or with a path that does not resolve to a readable file, is mechanically refused.\n" +
    "- eng-designer — engineering-mode design writer (available only in engineering mode): the SOLE author of the requirements + design documents and of the batch record §2 (the batch task book) — revisions included. Writes no implementation code, does not edit prompt files, does not fire reviews, and needs NO designToken (its authorization is the confirmed requirements). It surveys on its own, but may only spawn read-only 'explore' children (sync, ≤6 per batch). ALSO REQUIRES a batchDoc arg — the batch record path (docs/batches/<batch>-<topic>.md); the same mechanical gate as eng-coder: a spawn without it, or with a path that does not resolve to a readable file, is mechanically refused.\n" +
    "Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes explore/plan/eng-designer/eng-coder. The schema enum reflects the active mode.\n\n" +
    "Async spawn (AGENT-LOOP.md §15/§18/§25): pass async:true to spawn WITHOUT waiting — returns {id, role, status:\"running\"} immediately so you can keep working in your own turn (read/check files, run other tools) while the child runs in the background. The child's report reaches you automatically — multiple async children return in completion (arrival) order, first finished first, so fast results are handled immediately. Query progress with action:'status' (non-blocking). Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule). action:'escalate' follows the same rule — it runs async by default at the top level (§25 D-R17b) and its report digest arrives automatically. Eng-coder's delivery protocol runs fully inside the child (implementation → audit → self-fix → advisor re-review → converged delivery). Async spawns are capped at 4 concurrent (further spawns queue with a position), and top-level only. After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.\n\n" +
    "Task scheduling (AGENT-LOOP.md §20): declare the scheduling metadata to let the SCHEDULER order your spawns — files: the file paths this task will modify, dependsOn: ids from prior async spawn returns whose outcome this task needs. Overlapping-file tasks are serialized and dependent tasks are started in order automatically: a spawn that would conflict, or whose dependencies have not settled, queues instead of running ({id, status:\"queued\", position, reason} — the waiting task auto-starts when the conflict clears / its dependency settles; cancel a queued task to drop it). A spawn whose dependency was cancelled or failed stays queued and marked \"dependency cancelled\" until you decide (cancel it) — in an AUTO session it starts by itself. Referencing an unknown id errors; an id whose report was already delivered automatically counts as satisfied. Omit both parameters for the plain immediate spawn (no scheduler involvement).\n\n" +
    "Writing the prompt:\n" +
    "- The sub-agent starts with zero context — it has not seen this conversation. Brief it like a colleague who just walked into the room: state the goal, list what you already know, hand over the specifics.\n" +
    "- Put exact paths and commands in the prompt when you know them. The sub-agent should not search for things you already know.\n" +
    "- Do not delegate understanding: if the task hinges on a file path or line number, find it yourself first and write it into the prompt.\n" +
    "- Once a sub-agent is running, leave that scope to it: don't redo its searches in parallel, and don't abandon it midway to finish manually.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["spawn", "status", "observe", "send", "cancel", "escalate", "consume-design"], description: "Which action of the subagent tool family to run (default: spawn). spawn = run a new sub-agent; status = non-blocking progress query (id optional — running entries carry role/model/elapsedSec/turn/maxTurns + the §19.5.6 touched-files summary touchedFiles/touchedMore/touched; queued entries carry touched \"—（未启动）\"); observe = progress snapshot of ONE running async child (id required — current tool + last-5 turn summaries + turn/touched — see what it is doing right now to judge progress vs a stall); send = queue a message to ONE running async child, delivered at its next turn boundary as an ordinary user instruction (id + message required — a finished/queued/unknown id errors); cancel = STOP one background async subagent (id required — targeted abort; queued targets are dequeued); escalate = fly in a stronger model for hard implementation (task required, model optional); consume-design (engineering mode, parent side: chain-terminal token consumption — close out a design's token slot after the delivery is verified and the chain closes out — §2.6, 2026-09-07)." },
      task: { type: "string", description: "Task description (required for spawn and escalate). For spawn: self-contained — the sub-agent has no conversation context. For escalate: goal, constraints, entry files, acceptance criteria." },
      role: { type: "string", enum: ["explore", "plan", "coder", "eng-coder"], description: "The sub-agent role (action:'spawn' only) — see the tool description for the role capability matrix. Exact spelling required." },
      model: { type: "string", description: "(spawn) Provider/model override for this sub-agent: 'provider:model', a provider name from config, or a model name on the parent's provider. Defaults to the agent.subagentModels[role] (type-level), then the agent.subagentModel config, then the parent's provider — pass \"default\" to explicitly inherit the default model — equivalent to omitting the parameter. Useful for offloading heavy work to a cheaper model. (escalate) The consult candidate to fly in as 'provider:model' — default = the first consult model." },
      designToken: { type: "string", description: "Required when role='eng-coder' (spawn): the token returned by advisor(type='design') after the design review passed. Without a valid token, eng-coder cannot modify files." },
      designId: { type: "string", description: "Optional when role='eng-coder' (spawn): the designId echoed with the approved token by advisor(type='design'). Required to pick between designs when several approved reviews are active in the session — each eng-coder carries its own designId+token pair so parallel implementations never overwrite each other. Optional for a single design. action:'consume-design': the design whose slot to close out — optional for a single-design session; required to pick when several approved designs are active (the consume gate refuses to guess)." },
      async: { type: "boolean", description: "(spawn/escalate) true = run without waiting — returns {id, status} immediately; the report reaches you automatically (no polling — use action:'status' only for progress peeking; stop via action:'cancel'). Default: depth-0 → true (async — every role and the escalate action, AGENT-LOOP.md §18 D-E1a/§25 D-R17b); depth>0 → sync (forced). async:false forces the blocking run (mechanism parameter — the Async spawn section above governs top-level guidance)." },
      files: { type: "array", items: { type: "string" }, description: "(spawn) the file write-domain this task declares (cwd-relative or absolute paths — AGENT-LOOP.md §20). files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error. Tasks with overlapping files are serialized automatically — a conflicting spawn queues ({id, status:'queued', position, waiting, reason}) instead of running concurrently and starts when the conflict clears. Omit to skip conflict detection (plain immediate spawn)." },
      dependsOn: { type: "array", items: { type: "string" }, description: "(spawn) ids from prior async spawn returns whose outcome this task needs (AGENT-LOOP.md §20) — the task queues until every dependency settles, then starts automatically. Ids whose report was already delivered automatically (auto-injected at turn end / consumed by the suspension digest) count as satisfied; a dependency cancelled or failed leaves the task queued marked 'dependency cancelled' until you decide (cancel it — AUTO sessions auto-start). Unknown ids error." },
      id: { type: "number", description: "(status/cancel/observe/send) The subagent id to address, as returned by an async spawn. For status: returns that subagent's status without waiting or consuming; omit for the full overview. For cancel: REQUIRED — the target to stop (omitting it errors; a mistaken all-stop is impossible). For observe: REQUIRED — the child whose recent activity to snapshot (running shows current tool + last-5 summaries; done/queued are still queryable). For send: REQUIRED — the running child to deliver your message to." },
      message: { type: "string", description: "(send) REQUIRED for action:'send' — the guidance you want the running child to act on as an ordinary user instruction at its next turn boundary. Passed to the child as a plain user turn; a non-empty string is required." },
    },
  },
}

/** DESIGN-TOKEN-SETTLEMENT D4 (2026-09-08): 权威回读 —— 从 _engPersist 绑定的槽文件读权威
 *  台账 engDesignTokens，只把未过期项 reconcile 进内存 Map（expired 永不授权 —— fail-closed）；
 *  槽内过期项即从权威台账清理（D2 触发③ TTL 过期清 gate-time）。无 _engPersist（非会话绑定的
 *  子代理父）→ 内存即唯一真相。单值镜像 `_engDesignToken` 已随 D5 退役 —— 此处只读 engDesignTokens。 */
function authorityTokens(parent) {
  const p = parent?._engPersist
  if (!p?.cwd || !p?.slot) return null
  try { return readSlotEngDesignTokens(p.cwd, p.slot) } catch { return null }
}

function reconcileFromAuthority(parent) {
  const slots = parent._engDesignTokens
  const read = authorityTokens(parent)
  const obj = read?.engDesignTokens
  if (!obj || typeof obj !== "object") return slots ?? null
  const live = new Map()
  const expiredIds = []
  for (const [id, tok] of Object.entries(obj)) {
    if (typeof tok === "string" && !tokenExpired(tok)) live.set(id, tok)
    else if (tokenExpired(tok)) expiredIds.push(id)
  }
  if (expiredIds.length > 0) {
    const p = parent?._engPersist
    try { setSlotEngDesignTokens(p.cwd, p.slot, Object.fromEntries(live)) } catch { /* 槽清理非致命 */ }
  }
  if (live.size === 0) return slots ?? new Map()
  const merged = slots instanceof Map ? slots : new Map()
  for (const [id, tok] of live) merged.set(id, tok)
  parent._engDesignTokens = merged
  return merged
}

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3,
 * CLI parity): designId → exact slot; omitted → exactly ONE slot must exist (T16).
 * Format+TTL fail-closed check (uuid:expiresAt — 2026-09-06: HMAC anti-forgery gone)
 * stays in validateDesignToken. D4 (2026-09-08): 内存 Map miss 时回读权威槽文件 reconcile +
 * 判定（会话内回合/进程重启后也能从槽读到 settle 刚落盘的 token）——不再是"只读当前 run
 * 内存空快照 → 误拒"。
 */
export function resolveDesignSlot(parent, designIdArg) {
  let slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 内存 miss（指定 designId 不在 或 空 Map）→ 权威回读 reconcile（D4）
  if (designIdArg ? !(hasSlots && slots.has(designIdArg)) : !hasSlots) {
    const rec = reconcileFromAuthority(parent)
    if (rec && rec !== slots) slots = rec
  }
  const size = slots instanceof Map ? slots.size : 0
  const heldIds = size > 0 ? [...slots.keys()].join(", ") : "(none)"
  if (designIdArg) {
    if (!(slots instanceof Map) || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${size} approved design slot(s); held design ids: ${heldIds})`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (size > 1) {
    throw new Error(`Multiple approved designs in this session (${size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to. Held design ids: ${heldIds}`)
  }
  if (size === 1) return { token: [...slots.values()][0] }
  throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
}

/**
 * R16 ③ gate-time slot deletion (D-R16c ③ — ENG-TOKEN-BINDING-TUNING.md §5.1): remove the
 * EXPIRED token's designId slot so long-running sessions purge dead slots at the spawn
 * gate. Only expiry deletions land here — the caller invokes this solely when the presented
 * token EQUALS the slot token AND classifies as format-valid-expired (mismatch/malformed
 * reject without deletion). D5 (2026-09-08): 单值镜像已退役 —— 无镜像同步；同删权威槽
 * （D2 触发③）。
 */
function dropExpiredTokenSlot(parent, designId) {
  const slots = parent._engDesignTokens
  if (!(slots instanceof Map) || slots.size === 0) return
  const key = designId && slots.has(designId)
    ? designId
    : (!designId && slots.size === 1 ? [...slots.keys()][0] : null)
  if (key === null) return
  slots.delete(key)
  const p = parent?._engPersist
  if (p?.cwd && p?.slot) { try { clearSlotEngDesignToken(p.cwd, p.slot, key) } catch { /* 幂等清理 */ } }
}

/**
 * eng-coder token gate (moved verbatim from subagent.mjs execute — module split): the
 * design review must have passed and the caller must present the exact token advisor
 * issued — otherwise the child is not authorized to code.
 * 2026-09-01: multi-design slots — designId 定位槽（exact slot / 单槽 fallthrough）；
 * format+TTL fail-closed 校验不变（2026-09-06 设计 B: HMAC 防伪层已删——无签名 uuid:expiresAt）。
 * R16 ③ (2026-09-06): an EXPIRED token's rejection deletes its designId slot (mirror
 * synced) — long-running sessions purge dead slots at the gate; mismatch / malformed
 * reject WITHOUT deletion (never harm a slot that could still be valid — D-R16c ③).
 * Throws on any rejection; returns nothing on authorization.
 */
export function authorizeEngCoderDesignToken(parent, designId, designToken) {
  const issuedToken = resolveDesignSlot(parent, designId).token
  if (!issuedToken || designToken !== issuedToken || !validateDesignToken(designToken)) {
    if (designToken === issuedToken && tokenExpired(designToken)) {
      dropExpiredTokenSlot(parent, designId)
    }
    throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
  }
}

/**
 * consume-design 动作执行器（2026-09-07 token 链终消费制——ENGINEERING-MODE.md §2.6 F1
 * ——CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs，本端 slot 族居所 = 本文件）。
 * 父侧验收核销时显式调用——读槽值 → 移除该 designId 槽 + 清权威台账（D2 触发①：
 * consume-design 后显式 delete 该槽——不再依赖 agentState 空态回写，见 DESIGN-TOKEN-SETTLEMENT.md）。
 * 消费后同 designId 再 spawn = resolveDesignSlot not found 机械拒。调用形态定死（评审 #3）：
 * 参数 designId（单设计会话可省略——FR3 spawn 同款语义）；未知 designId 与重复消费同款
 * no-op 提示（幂等——不报错）。dispatch 分类（评审 #7d）：非只读控制动作——depth-0 + 工程
 * 模式限定（受限变体门在 subagent.mjs；本器自持工程模式门）——planMode 拒绝（execute-tools
 * 不豁免）——不入批审批分组（execute-tools 免审直行——无文件写）。
 */
export function executeConsumeDesignAction(args, ctx) {
  const parent = ctx.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — consume-design applies only to engineering-mode design tokens (spawn 同门).")
  }
  const designId = args?.designId ? String(args.designId) : undefined
  const slots = parent?._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 多槽缺 designId → 拒（spawn 同款语义——不误消费任一槽）
  if (!designId && hasSlots && slots.size > 1) {
    throw new Error(`consume-design: Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design to close out.`)
  }
  // 读槽值：内存 Map 精确/单槽；settle 刚落盘而本回合内存未持有 → 权威槽兜底（单槽）。
  let token = null
  if (designId && hasSlots && slots.has(designId)) token = slots.get(designId)
  else if (!designId && hasSlots) token = [...slots.values()][0]
  if (!token) {
    const obj = authorityTokens(parent)?.engDesignTokens
    if (obj && typeof obj === "object") {
      if (designId && obj[designId]) token = obj[designId]
      else if (!designId && Object.keys(obj).length === 1) token = obj[Object.keys(obj)[0]]
    }
  }
  // 未知 designId / 已消费 / 无任何槽 → 幂等 no-op 提示（不报错——评审 #3 定死）
  if (!token) {
    return `consume-design: no live slot${designId ? ` for designId ${designId}` : ""} (already consumed or never issued) — idempotent no-op, nothing changed.`
  }
  if (hasSlots) {
    if (designId) {
      if (slots.get(designId) === token) slots.delete(designId)
    } else {
      for (const [k, t] of slots) if (t === token) { slots.delete(k); break }
    }
  }
  // 清权威槽（D2 触发①）：designId → 该槽；单设计会话缺省 → 整账本
  const p = parent?._engPersist
  if (p?.cwd && p?.slot) { try { clearSlotEngDesignToken(p.cwd, p.slot, designId) } catch { /* 幂等 */ } }
  return `design slot consumed — designId ${designId ?? "(single-design session)"} is closed out; a further eng-coder spawn for this design is mechanically rejected, and any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
}


/**
 * Mode-dependent subagent role schema field (CLI setup.mjs parity). The role enum is
 * mutually exclusive per mode: normal mode advertises "coder", engineering mode
 * advertises "eng-coder". The schema filter is the FIRST line of defense — the model
 * never sees the disabled role as legal; the runtime throws in execute() stay as the
 * hard gate. Returns { role, suffix }: `role` replaces parameters.properties.role
 * wholesale; `suffix` appends to the tool-level description ("" in normal mode).
 */
export function modeRoleField(engineering) {
  return engineering
    ? {
        role: {
          type: "string",
          enum: ["explore", "plan", "eng-coder", "eng-designer"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for design writing.",
      }
    : {
        role: {
          type: "string",
          enum: ["explore", "plan", "coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "",
      }
}

/**
 * Effective subagent model override for a role (CLI parity):
 * priority — subagent tool `model` arg > config.agent.subagentModels[role] > config.agent.subagentModel > null (inherit parent).
 * `default` alias (2026-09-05 — ARCHITECTURE.md L241): a literal "default" at the
 * ARGUMENT level (matched after toLowerCase — "DEFAULT"/"Default" alike) means
 * "parameter-level not specified" — equivalent to omitting the parameter or
 * passing "" — so the default priority chain applies (type-level > global >
 * inherit parent). Other single-segment values pass through unchanged. Chain
 * values holding the literal are returned as-is from their chain position here;
 * resolveChildProvider maps a final literal to the parent provider (chain's end).
 */
export function effectiveSubagentModel(parent, role, modelArg) {
  if (modelArg && String(modelArg).toLowerCase() !== "default") return modelArg
  const cfg = parent.config?.agent ?? {}
  return cfg.subagentModels?.[role] ?? cfg.subagentModel ?? null
}

/**
 * Resolve the sub-agent's provider from a model override string (CLI parity).
 * "provider:model" → named provider + model; "provider" → named provider;
 * "model" → parent's provider with a different model; null → parent's provider.
 * Keys come from config.json only (env vars are not a key source).
 */
export function resolveChildProvider(parent, modelArg) {
  // `default` alias (2026-09-05 — ARCHITECTURE.md L241): a literal "default"
  // (case-insensitive) reaching the resolver — the tool arg, or a config chain
  // value (subagentModels[role] / subagentModel) holding the literal — resolves
  // to the parent provider (the chain's last level). A literal never becomes a
  // model name, so specForModel is never called with "default". Deliberate
  // layering asymmetry: the ARG-level literal falls through the priority chain
  // (effectiveSubagentModel — type-level > global > inherit parent), but a
  // CHAIN-LEVEL literal returned as the chain's result ends the chain here —
  // e.g. subagentModels[role]="default" with a real global model still yields
  // the parent provider (no fall-through to the global level).
  if (!modelArg || String(modelArg).toLowerCase() === "default") return { ...parent._provider }
  const providers = parent.config?.providersList ?? []
  const withKey = (p) => (p.apiKey?.trim() ? { ...p, apiKey: p.apiKey.trim() } : { ...p })
  if (modelArg.includes(":")) {
    const [pname, mname] = modelArg.split(":")
    const p = providers.find((x) => x.name === pname)
    if (!p) throw new Error(`subagent model: unknown provider "${pname}" (available: ${providers.map((x) => x.name).join(", ") || "none"})`)
    return { ...withKey(p), model: mname || p.model }
  }
  const byName = providers.find((x) => x.name === modelArg)
  // F-1 (QUICKFIX-BATCH-2——CLI F-2c 镜像)：裸渠道名克隆须重派生 model——MODEL-SELECTION
  // M3④：渠道默认单值 `byName.model` 优先；渠道无默认模型 → 父 provider 兜底保留（尾部兜底链
  // 不动——同渠道家族）；两者皆无 → model 缺失交 chat 前 guard fail-fast。
  if (byName) return { ...withKey(byName), model: byName.model ?? parent._provider?.model }
  return { ...parent._provider, model: modelArg }
}

export const subagentTool = {
  name: "subagent",
  sideEffectExempt: true, // subagent mutations are tracked by the child, not the parent
  // §19 (2026-09-03): action-level readonly classification — status is the readonly
  // query action (plan mode passes it, no approval, readonly-parallel batches — §15
  // D-A2 readonly:true heritage); spawn (the default) and escalate are side-effecting.
  // §19.8 (2026-09-06): action:'check' deleted — no polling/blocking action remains.
  // Used by execute-tools.mjs preGateBlocked / batch grouping / permission stage.
  isReadonlyAction(args) {
    const action = args?.action
    // observe（SUBAGENT-OBSERVE-SEND.md D1——2026-09-08）= readonly 查询动作——与 status
    // 同分类：plan mode 放行、零消耗、readonly 批不审批。
    return action === "status" || action === "observe"
  },
  // §19.5 (AGENT-LOOP.md §19.5 D-M6 round2 #4): cancel = 控制类豁免动作——只停不启
  // （无新副作用）——planMode 放行、免权限审批、批审批分组不入组、手动档 digest 放行。
  // Used by execute-tools.mjs preGateBlocked / collectBatchPermission / permission stage.
  // send（SUBAGENT-OBSERVE-SEND.md D2——2026-09-08）同 control 类（评审 #4 采纳）：只入
  // 注入队列不落盘/不改文件——planMode 放行、免权限审批（给运行中子代理引导不视为文件写）。
  isControlAction(args) {
    return args?.action === "cancel" || args?.action === "send"
  },
  // ⑤ 第 10 批（§18.3 #5——CLI 同源句）：status/cancel 面补评审池（同 id 命名空间——advisor id
   // 同面可查/可取消）。本仓描述载荷在 subagentSpec（本档——subagentSpec.description 本体不动）——
  // 本文件是**工具对象组装点**，句尾追加可达意。
  description: subagentSpec.description
    + " Background advisor reviews share this status/cancel surface (same id space): pass a review id to status it (role:'advisor' + reviewType/round/elapsedSec) or to cancel it — a cancelled review issues no token.",
  // §2.22.3 参数面：batchDoc（spawn schema 属性——否则参数无处传入；受限变体的 delete 清单
   // 需有该键可删）。本仓 schema 载荷在 subagentSpec（本档）——此处单键扩展，不动 spec 载荷。
  parameters: {
    ...subagentSpec.parameters,
    properties: {
      ...subagentSpec.parameters.properties,
      batchDoc: { type: "string", description: "REQUIRED for role='eng-coder' and role='eng-designer': the batch record path (docs/batches/<batch>-<topic>.md) — the batch §2 task book this spawn implements (or writes). The spawn is mechanically refused without it, and also when the path does not resolve (cwd-relative or absolute) to a readable file; the CONTENT is never validated (the batch record owns that). explore/plan/coder spawns ignore it (ENGINEERING-MODE.md §2.12/§2.22.3)." },
    },
  },
  async execute(args, ctx) {
    // §19 action dispatch（AGENT-LOOP.md §19 D-M1）：缺省 spawn——既有调用零迁移。
    const action = args?.action ?? "spawn"
    const parent = ctx.agent
    if (!["spawn", "status", "cancel", "escalate", "consume-design", "observe", "send"].includes(action)) {
      throw new Error(`Unknown subagent action: ${JSON.stringify(action)}. Valid actions: spawn (default), status, cancel, escalate, consume-design, observe, send.`)
    }
    // §19 round2 #3 restricted-variant action gate（机械层——schema 层提示在 setup.mjs
    // engAuditSubagentTool）：eng-coder 子代理的受限通道仅 spawn（sync explore 审计）——
    // escalate 会内部 spawn coder+WRITE（违 explore-only 意图）；status/observe/send 无意义
    // （子代理上下文无 async 池）。镜像 T-E4/E5 的 action 维度。
    if ((ctx.depth ?? 0) > 0 && (parent?._role === "eng-coder" || parent?._role === "eng-designer") && action !== "spawn") {
      throw new Error(`action:'${action}' is unavailable inside an ${parent._role} subagent — the restricted subagent channel is spawn-only (sync role='explore' children, AGENT-LOOP.md §18 D-E3 / ENGINEERING-MODE.md §2.15 D)`)
    }
    if (action === "status") return subagentStatus(args, ctx)
    if (action === "observe") return subagentObserve(args, ctx)
    if (action === "send") return subagentSend(args, ctx)
    if (action === "cancel") return cancelSubagentAction(args, ctx)
    // §2.6 token 链终消费制（2026-09-07——ENGINEERING-MODE.md F1）：父侧核销消费——
    // 非只读控制动作——depth-0 + 工程模式限定（本分流已过受限变体门；工程模式门在
    // 执行器内）——planMode 拒绝（execute-tools 不豁免）——不入批审批分组（免审直行）。
    if (action === "consume-design") return executeConsumeDesignAction(args, ctx)
    if (action === "escalate") {
      // W12（2026-09-15）：原端侧 `subagent-escalate.mjs`（及其 async 档）随镜像删旧退役——
      // 执行器改指核 `executeEscalateAction`（动态 import：核链可达 node:sqlite——W8 契约②；
      // 语义单源 = 核 escalate 族，含 async 缺省与 settle 三分类）。
      const { executeEscalateAction } = await import("@thincoder/core/agent-tools/subagent-actions.mjs")
      return await executeEscalateAction(args, ctx)
    }
    // ── spawn（缺省 action）——既有 execute 原样 ──
    const { task, role, designToken, designId, model, async: asyncArg } = args
    // §19 required 移出 schema → execute 内校验（T-M11/advisor round 2 #5）：spawn 的
    // task 缺失/空串 → 干净的工具错误——不带残缺输入进子代理（auditTaskBook 会生成
    // 残缺审计书、setup 会把 content: undefined 送 provider）。
    if (typeof task !== "string" || !task.trim()) {
      throw new Error("subagent spawn requires a task description (task) — brief the sub-agent like a colleague who just walked in")
    }
    const agentMod = await import("../agent.mjs")
    // 测试缝（escalate-async 同形 `ctx.runAgent ??` 先例）：缺省 = 生产 runAgent；仅测试注入。
    const runAgent = ctx.runAgent ?? agentMod.runAgent
    const cwd = ctx.cwd
    // §18 D-E1a depth-gated async default (2026-09-06 需求池 R12——CLI parity):
    // depth-0 spawns default to async for EVERY role (the old role-level default —
    // eng-coder only — is superseded); depth>0 spawns default to sync (子代理内部
    // 强制同步现状保留——下方深度门仍拒 async:true).
    const asyncFlag = asyncArg ?? ((ctx.depth ?? 0) === 0)

    // §17 N3/D-S6 spawn gate (manual tier): auto-turn digests may not spawn — async
    // OR blocking — the digest must stay organize-only. AUTO tier (ctx.getAuto) is
    // exempt (推进型 — the user authorized unattended continuation). Mechanical
    // refusal so the digest never pops a permission panel or chains background work.
    if (parent._inAutoTurn && !(ctx.getAuto?.() ?? false)) {
      return JSON.stringify({ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" })
    }

    // ── §20 spawn 调度参数准入（AGENT-LOOP.md §20 D-SD1/D-SD3 + 20.4 round2 #5/#7——
    // CLI 同规格镜像）── files/dependsOn 声明即契约（v1：不做任务书文本自动解析）。
    // 缺省（两者皆缺）= 既有语义零改动（不参与冲突检测/无校验——legacy spawn 零开销）。
    // 校验序：参数形态 → 依赖 unknown id（非 consumed 墓碑——T-SD10）→ 依赖环可达
    // （T-SD5——防御断言）→ 等待态判定（spawnAsyncSubagent 内复算落点）。等待态命中 →
    // async 入 queued 等位（返回带 waiting/reason）；**sync spawn（async:false）命中 →
    // 明确错误——不队列化 sync——sync 语义零变更（T-SD13）**。
    const filesArg = args.files
    const dependsRaw = args.dependsOn
    // §20.8 D-F1.1：目录声明 fail-closed——检测器 throw → catch → 错误即工具结果
    // （模型可见"文件级明细"提示——不加静默——目录绕过冲突检测的通道闭合）。
    let files = []
    if (filesArg !== undefined && filesArg !== null) {
      try {
        files = normalizeFileList(filesArg, cwd)
      } catch (e) {
        return JSON.stringify({ status: "error", error: e.message })
      }
    }
    if (filesArg !== undefined && filesArg !== null && !Array.isArray(filesArg)) {
      throw new Error("subagent files must be an array of file paths (the write domain this task declares)")
    }
    const dependsOn = []
    if (dependsRaw !== undefined && dependsRaw !== null) {
      if (!Array.isArray(dependsRaw)) throw new Error("subagent dependsOn must be an array of async subagent ids (from prior spawn returns)")
      for (const d of dependsRaw) {
        if (typeof d !== "string" && typeof d !== "number") {
          throw new Error(`subagent dependsOn entries must be async subagent ids — got ${JSON.stringify(d)}`)
        }
        dependsOn.push(String(d))
      }
    }
    if (files.length > 0 || dependsOn.length > 0) {
      const auto = ctx.getAuto?.() ?? false
      for (const d of dependsOn) {
        if (depInfo(parent, d).state === "unknown") {
          throw new Error(`subagent dependsOn: unknown async subagent id: ${d} — dependsOn references ids from prior async spawn returns; an id already delivered automatically (auto-injected at turn end or consumed by the suspension digest) counts as satisfied, anything else is a mistake (AGENT-LOOP.md §20 D-SD5)`)
        }
      }
      assertNoDepCycle(parent, dependsOn)
      const block = describeBlockers(parent, { _files: files, _dependsOn: dependsOn }, auto)
      if (!asyncFlag && block.kind !== "slot") {
        throw new Error(`sync spawn (async:false) cannot queue behind a scheduling conflict: ${block.detail} — pass async:true to queue the task (the scheduler starts it when the blockers clear), or wait for them to finish first (AGENT-LOOP.md §20 round2 #7)`)
      }
    }
    // §17 D-S9: during a suspension session children share the SESSION signal
    // (ctx.sessionSignal ?? agent._sessionSignal) — a digest's own Stop/interrupt must not
    // abort the pool; the session abort controller stops everything. Outside a session
    // children ride the spawning turn's controller (existing semantics).
    // D6 buildChildSignal 单点（ASYNC-RESULT-CONTAINER.md——4 处兜底抄统一）。
    const childSignal = buildChildSignal(ctx)

    // Role normalization + whitelist (2026-08-25, coder-leak fix): the runtime gates below
    // used exact string comparison — a variant role ("Coder", " coder") bypassed BOTH gates
    // and fell through to full-tool/no-overlay (a full-write coder without design review).
    // Schema enums are advisory; providers don't enforce them. Fail closed on anything that
    // isn't an exact known role.
    const ROLES = new Set(["explore", "plan", "coder", "eng-coder", "eng-designer"])
    if (!ROLES.has(role)) {
      throw new Error(`Unknown subagent role: ${JSON.stringify(role)}. Valid roles: explore, plan, coder, eng-coder, eng-designer (exact spelling).`)
    }
    // §18 D-E3 internal-spawn mechanical gate: an eng-coder sub-agent may only spawn
    // SYNC explore (audit) children — non-explore roles and async spawns are refused,
    // and the audit budget is enforced (the 7th audit spawn is refused — the stalled
    // signal of the 5-fix-round cap). Runs BEFORE the mode gates so the eng-coder-
    // specific error (not the generic engineering-mode one) surfaces. Returns the
    // audit attempt number — the mechanical audit-scope augmentation below uses it —
    // or null outside an eng-coder context.
    const engAuditAttempt = gateEngCoderSpawn(ctx.agent, ctx.depth, role, asyncArg)
    // Role is mutually exclusive per mode: normal mode → "coder", engineering mode → "eng-coder" (CLI parity)
    if (parent.config?.agent?.engineering && role === "coder") {
      throw new Error("Engineering mode: use role='eng-coder' for implementation tasks.")
    }
    if (!parent.config?.agent?.engineering && role === "eng-coder") {
      throw new Error("Engineering mode is not active — use role='coder' for implementation tasks.")
    }
    // 第三门（§2.22.4 ②）：eng-designer 工程模式限定（同族文案，不撞 generic engineering-mode 文案）。
    if (!parent.config?.agent?.engineering && role === "eng-designer") {
      throw new Error("Engineering mode is not active — role='eng-designer' is engineering-mode only (it writes the requirements/design documents inside the engineering workflow); use role='explore' or role='plan' for read-only work.")
    }
    // §15 D-A3: async spawn is a depth-0 main-session capability — a subagent trying to
    // async-spawn its own children would create an unbounded background tree. Reject loud.
    if (asyncFlag && (ctx.depth ?? 0) > 0) {
      throw new Error("async spawn only available at the top level")
    }

    // Provider/model override: tool `model` arg > subagentModels[role] > subagentModel > parent provider (CLI parity)
    const provider = resolveChildProvider(parent, effectiveSubagentModel(parent, role, model))

    // eng-coder token gate: the design review must have passed and the caller must
     // present the exact token advisor issued — lives in this file
     // (authorizeEngCoderDesignToken — W12 自 subagent-spawn-gate.mjs 迁回): resolves the slot,
    // format+TTL fail-closed validates, and on an EXPIRED presentation deletes the dead
    // slot (R16 ③ — mirror synced); mismatch / malformed reject without deletion.
    if (role === "eng-coder") {
      authorizeEngCoderDesignToken(parent, designId, designToken)
    }

    // Turn cap from shared config (CLI parity)
    const maxTurns = parent.config?.agent?.subagentTurns ?? 100
    // advisor fix #1：id 分配跨 runAgent 单调（池沿 history 存活——agent._subIdCounter
    // per-run 重建，重复 id 会覆盖池条目——nextSubagentId 以池内最大 id 续号）。
    const subId = nextSubagentId(parent)

    // §18 D-E2 ③: the audit spawn's task book is appended MECHANICALLY — the eng-coder's
    // OWN spawn task (mechanical SUMMARY of _engTaskInput — auditTaskBook keeps the
    // docs-involved / file-list / acceptance sections VERBATIM via summarizeEngTaskInput
    // (CLI-isomorphic, A2-SUMMARY-PARITY): header-first with an inline-marker fallback
    // for flat books without "## " headings — markers not found are reported
    // "(not found in the parent task book)", never fabricated — there is NO whole-book
    // verbatim fallback; never a self-written list) ∪ mechanically tracked _touchedFiles
    // (mechanism lives in subagent-async.mjs).
    const childInput = auditTaskBook(task, ctx.agent, engAuditAttempt)

    // Subagent runs without MAIN-CONVERSATION callbacks — results are captured.
    // onQuestion: the child's question tool must surface in the panel like the parent's.
    // onToolCall/onToolResult/onToken/onReasoning: forwarded to the toolPanel channel as a
    // live activity stream (subagent visibility — the user watches WHAT the child
    // reads/runs/thinks/says, not just a dot). The channel name carries #subId so each
    // invocation gets its OWN block (webview _subBlocks keys by name). subId is fixed
    // before the turn-cap continue loop below — a resume reuses it, so continuation
    // chunks keep streaming into the SAME block instead of opening a new one.
    // onToolPanel (2026-09-03): the child's OWN tool-panel emissions (advisor review
    // stream, nested-spawn activity) forward into the same channel — see the callback
    // entry below.
    // stateSink receives the child's live mutation state (runAgent fills it every turn).
    // The whole pipeline is one async function so the SYNC path can await it and the
    // ASYNC path (§15 D-A1) can fire it in the background with the same semantics.
    // runChild 闭环（2026-09-08 结构债批 6——subagent.mjs 508 > 500 硬限——本体迁
    // ./subagent-run.mjs——CLI 同名对齐（名对齐非内容镜像）：原闭包自由变量收编参数对象
    //（parent/ctx/cwd/runAgent/role/subId/maxTurns/childInput/provider/designId/task/
    // asyncFlag/childSignal）——verbatim 迁移零行为变化；runChild 原文件内私有（非导出）
    // ——消费面零影响。runChildFor 保持原调用形态（sync 路径 await 无 entry / async 池
    // 条目由 spawnAsyncSubagent 以 entry 调用同一包装）。
    const runChildOpts = { parent, ctx, cwd, runAgent, role, subId, maxTurns, childInput, provider, designId, task, asyncFlag, childSignal }
    // §2.22.3 绑定下发（两路共用出口）：abs → runChild → setup 的 `agent._batchDoc`（batch_segment 取用）+ 任务文本行。
    const runChildFor = (entry = null, batchDocAbs = null) => {
      const abs = batchDocAbs ?? entry?._batchDoc ?? null
      return runChild(entry, abs
        ? { ...runChildOpts, batchDoc: abs, childInput: `${childInput}\n\nBatch record (batchDoc): ${abs}` }
        : runChildOpts)
    }

    if (!asyncFlag) {
      // §2.22.3 门调用点①（阻塞路）：目标角色缺参/不可读 → throw（共享 resolveBatchDoc，与异步路同函数）；非目标角色 → null 零变更。
      const batchDocAbs = NEEDS_BATCH_DOC.has(role) ? resolveBatchDoc(parent, args.batchDoc) : null
      ctx.callbacks?.onSubagent?.({ id: subId, role, status: "started", startedAt: Date.now(), model: provider.model ?? null })
      // LOGGING（LOGGING.md——CLI parity）：child:* 阻塞 spawn——runChild 前后；
      // partial = turn-cap 拒绝（TURN_CAP_MARK 检出）；cancel 非阻塞路径不适用。
      const childLogId = `${role}#${subId}`
      const cT0 = Date.now()
      logEvent("child:spawn", { role, id: childLogId, kind: "blocking" })
      try {
        const report = await runChildFor(null, batchDocAbs)
        const r = String(report)
        const ms = Date.now() - cT0
        if (r.startsWith(`Subagent (${role}) error:`)) logEvent("child:error", { role, id: childLogId, ms, err: errText(r.split("\n")[0].replace(/^Subagent \([^)]*\) error: /, ""), 200) })
        else logEvent("child:done", { role, id: childLogId, ms, kind: r.includes("turn cap reached") ? "partial" : "ok" })
        return report
      } catch (e) {
        if (ctx.signal?.aborted || e?.name === "AbortError") throw e // 用户停——不落错误事件
        logEvent("child:error", { role, id: childLogId, ms: Date.now() - cT0, err: errText(e, 200) })
        throw e
      }
    }

    // Async branch (moved to subagent-async.mjs spawnAsyncSubagent — 2026-09-03 split):
    // slot queue — returns immediately, does not await the report.
    // §20：files/dependsOn 域元数据随 spawn 传入（entry _files/_dependsOn——D-SD2——
    // 等待态准入落点在 spawnAsyncSubagent 内复算：非 slot → 强制 queued 不占槽）。
    return spawnAsyncSubagent({ parent, ctx, subId, role, provider, childSignal, runChild: runChildFor, files, dependsOn, batchDoc: args.batchDoc })
  },
}
