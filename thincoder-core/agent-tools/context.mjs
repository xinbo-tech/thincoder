/**
 * agent-tools/context.mjs — `context` 工具（CONTEXT-COMPACTION.md §6.16 · context-tool 批 2026-09-21）。
 * 单一工具三操作（用户定形 F-CC5）：`stats`（感知 F-CC1）· `prune`（噪声清理 F-CC3）· `compact`（主动压缩 F-CC2，携 focus + 自动附任务/目标 + 可回查锚——裁令 A/D）。
 * 内联 description（**不新增 tool-docs 档**——24 档族计数零动）；装配面 = 登记册 `agent-tools.mjs`（#83）+ `agent/family-tools.mjs` 的 depth-0 段（`depthOnly`）——两端自动同表；**depth>0 不给**（§6.16.6）。
 * 本档同时是**注记文案 / 轻推行 / 回执文案的单源**（核与 VSC 的 run-stages 消费点经动态 import 取用——零新增静态边）。
 * 机械面：`stats` 不新增第三口径（阈值取本回合判定值；百分比走 `historyPercent` 与状态行同式）；`prune` = 合格集（`token-window.mjs` 单源）+「原位换内容」应用面（`context.mjs`）；`compact` **当次零执行**（只登记 `agent._pendingCompact`，由下一安全点消费——§6.16.2）。
 */
import { contextUsage, estimateTokens, collectStaleToolOutputs, historyPercent, PRUNE_MIN_TOKENS } from "../token-window.mjs"
import { pruneStaleToolOutputs, COMPRESS_FAILURE_LIMIT } from "../context.mjs"
import { slotPath } from "../session-slots.mjs"

/** 轻推行前缀（单活体去重判据——§6.16.5「同前缀旧行先滤」）。 */
export const CONTEXT_NUDGE_PREFIX = "[System reminder: task/goal changed —"

/** 压缩结果注记前缀（机器行族——同 `[System reminder:` 门：既有 `isRealUserMsg` / plan 节律等消费方按该族识别机器行）——成功**不落**注记。 */
export const CONTEXT_NOTE_PREFIX = "[System reminder: context compact"

/** 压缩 no-op 注记（§6.16.2 回执面②——强制面无可压：短历史无中段）。 */
export function compactNoopNote() {
  return `${CONTEXT_NOTE_PREFIX} did nothing right now (no middle section — the history is too short to summarize). The context is unchanged.]`
}

/** 压缩失败注记（§6.16.2 回执面②——模型面告知缺口；失败链本体复用既有：连续 3 次降级确定性截断）。 */
export function compactFailureNote(message, attempt) {
  return `${CONTEXT_NOTE_PREFIX} failed (attempt ${attempt} of ${COMPRESS_FAILURE_LIMIT}): ${message}]`
}

/** 轻推锚（§6.16.5）：active goal 目标 ⇒ in_progress 任务标题 ⇒ 首个 pending 标题 ⇒ `(none set)`。 */
function nudgeAnchor(agent) {
  if (agent?.goal?.status === "active" && agent.goal.objective) return agent.goal.objective
  const tasks = agent?.tasks ?? []
  const inProgress = tasks.find((t) => t.status === "in_progress")
  if (inProgress) return inProgress.title
  const pending = tasks.find((t) => t.status === "pending")
  if (pending) return pending.title
  return "(none set)"
}

/**
 * 方向转换轻推（F-CC4 · §6.16.5）：task/goal 变更后直推**一行**机器行（`transient: true`，非命令）。
 * 去重 = **单活体行**：同前缀旧行先滤再推一行 ⇒ 任意次数变更后恒**恰一行**（in-place splice 保
 * 数组引用——VSC 面板持同一数组：`agent.history = <新数组>` 会让端侧局部引用失效，先例 = D-CC24
 * 同一顾虑）。压缩重建时该行无特殊处理（一次建议——落入中段即随摘要退场、落入 tail 则保留，良性）。
 * 深度门由调用方落（`ctx.depth === 0`——子代理拿不到 `context`，提示它拿不到的工具即噪音）。
 */
export function pushContextNudge(agent) {
  const history = agent.history
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i]
    if (m?.role === "user" && typeof m.content === "string" && m.content.startsWith(CONTEXT_NUDGE_PREFIX)) {
      history.splice(i, 1)
    }
  }
  history.push({
    role: "user",
    content: `${CONTEXT_NUDGE_PREFIX} current objective: ${nudgeAnchor(agent)}. ` +
      `If the earlier context no longer serves this direction, you may compact it (context tool, action="compact" with a focus) — the decision is yours.]`,
    transient: true,
  })
}

/** stats 报面（§6.16.4 逐行定稿——机判可解析；三段 / 工具输出小计 / 状态行百分比 / 压缩履历）。 */
function statsReport(agent) {
  const usage = contextUsage(agent, agent?._ctxBasis?.overhead ?? {})
  const stale = collectStaleToolOutputs(agent?.history ?? [], agent?.provider)
  let toolOut = 0
  let toolCount = 0
  for (const m of agent?.history ?? []) {
    if (m?.role !== "tool") continue
    toolCount++
    toolOut += estimateTokens([m])
  }
  const pct = Math.round((usage.total / usage.threshold) * 100)
  const toGo = Math.max(0, usage.threshold - usage.total) // 已越阈值 ⇒ 0（自动压缩将在下一安全点接手）
  const info = agent?._lastCompressInfo
  const compaction = !info ? "none"
    : info.mode === "summary" ? `last summary freed ${info.tokensFreed} tokens`
      : "last fallback truncation"
  return [
    `Context ≈${usage.total} tokens vs compaction threshold ${usage.threshold} (${pct}% — ${toGo} to go); window ${usage.window}`,
    `Segments ≈: system ${usage.system} · tools ${usage.tools} · history ${usage.history} (basis: ${usage.basis})`,
    `History: tool outputs ${toolOut} tokens in ${toolCount} msgs · prunable stale ${stale.tokens} tokens in ${stale.indexes.length} msgs · protected tail ${stale.tailCount} msgs`,
    `Status line: context ${historyPercent(agent?.history ?? [], agent?.provider)}% (${usage.history} history estimate / ${usage.window} window)`,
    `Compaction so far: ${compaction} · failures ${agent?._compressFailures ?? 0}/${COMPRESS_FAILURE_LIMIT}`,
  ].join("\n")
}

/** prune 回执（§6.16.3：计数 + 扫过候选 / 保护尾内保留 / 门槛下跳过 + 记录面零改）。 */
function pruneReceipt(agent) {
  const r = pruneStaleToolOutputs(agent)
  const scan = `(scanned ${r.candidates} tool result(s): ${r.tailKept} inside the protected tail, ${r.belowMin} below the ${PRUNE_MIN_TOKENS}-token floor)`
  if (r.pruned === 0) {
    return `Nothing to prune — no stale tool output matched ${scan}. The context and the session record are unchanged.`
  }
  return `Pruned ${r.pruned} stale tool output(s) ≈${r.freed} tokens freed ${scan}. ` +
    `Tool pairing is intact and the session record is unchanged — the full text is still on disk; re-run a tool if you need its output again.`
}

/**
 * 可回查锚（父侧裁令 A · §6.16.7 两分支逐字）：回执尾段给出「压掉的可一步取回」的坐标与调用形。
 * 取回面 = `read_history` 既有 `path=`（**不新建通道**）；未绑定槽（会话首次保存前 / VSC 端面板槽
 * 不在 agent 上）⇒ `cwd:` 发现面（等效取回，已登记的端差）。
 */
function retrievabilityAnchor(agent) {
  const slot = agent?._slot
  // 已绑定槽分支需 cwd 才能给槽文件坐标（cwd 缺省 ⇒ 退 cwd 发现面——工具内不抛）
  if (slot != null && agent?.cwd) {
    const file = slotPath(agent.cwd, slot)
    return `Full record (never compacted): ${file} — read it back with: read_history path="${file}" (add keyword / since / role filters to target it).`
  }
  return `Full record: this session's file is created on first save — list this project's sessions with: read_history path="cwd:${agent.cwd}", then copy the listed path into path= to query it.`
}

/** compact 回执（§6.16.2 回执面①：排队事实 + 替换明示 + focus 回显 + 落点说明 + 可回查锚）。 */
function compactReceipt(agent, focus, replaced) {
  return [
    `Compaction queued${replaced ? " (replaces the request queued earlier — only the latest focus is used)" : ""} — ` +
      `it runs at the next safe point, before the next request; the current exchange is never cut mid-flight.`,
    `Focus: ${focus}`,
    `The summary is weighted toward that focus; the current task list and goal are attached automatically. ` +
      `Same summary chain, same panel, same failure handling as the automatic compaction.`,
    retrievabilityAnchor(agent),
  ].join("\n")
}

export const contextTool = {
  name: "context",
  description:
    "Manage your own context window — see how full it is, drop stale tool output, or compact the earlier " +
    "conversation into a summary at a moment of your own choosing.\n" +
    "- action='stats': current usage — total vs the compaction threshold, per-segment shares, and how much " +
    "is prunable / reclaimable.\n" +
    "- action='prune': drop the CONTENT of stale tool results (older than the protected tail) and replace it " +
    "with a short stub — tool pairing stays intact, the session record keeps the full text, and the tool can " +
    "simply be re-run.\n" +
    "- action='compact': compact the earlier conversation now, with 'focus' — write what the UPCOMING work " +
    "needs (1–3 sentences: the goal, the files, the constraints that must survive). The summary is written to " +
    "serve that focus; the current task list and goal are attached automatically. It runs at the next safe " +
    "point (before the next request — never mid-exchange) through the same machine as the automatic " +
    "compaction: same summary chain, same panel, same failure chain (3 consecutive failures degrade to a " +
    "deterministic truncation). The receipt carries this session's record path, so nothing is lost for good.\n" +
    "Nothing here runs on its own — the automatic threshold compaction stays in place as a fallback; whether " +
    "to compact is your call. Errors come back as 'Error: ...' and change nothing.\n" +
    "Parameters:\n" +
    "- action (required): stats | prune | compact\n" +
    "- focus (required for compact): what the upcoming work needs — the summary is weighted toward it",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["stats", "prune", "compact"], description: "stats — usage report; prune — drop stale tool-output content; compact — summarize the earlier conversation now." },
      focus: { type: "string", description: "compact only (required): what the upcoming work needs — 1–3 sentences. The summary is weighted toward it." },
    },
    required: ["action"],
  },
  readonly: true, // 只动机内状态（同 task / goal 先例）——planMode 放行、只读角色过滤放行、无权限问询
  async execute(args, ctx) {
    const agent = ctx.agent
    const action = args?.action
    if (action === "stats") return statsReport(agent)
    if (action === "prune") return pruneReceipt(agent)
    if (action === "compact") {
      const focus = typeof args?.focus === "string" ? args.focus.trim() : ""
      // fail-closed（§6.16.1 参数面）：schema 层 `focus` 非 required ⇒ 运行期判——不排队、零副作用
      if (!focus) {
        return "Error: 'focus' is required for action='compact' — write 1–3 sentences on what the upcoming work needs " +
          "(the goal, the files, the constraints that must survive). Nothing was queued."
      }
      const replaced = agent._pendingCompact != null
      agent._pendingCompact = { focus, at: Date.now() } // 单槽：重复调用后者覆盖前者（回执明示）
      return compactReceipt(agent, focus, replaced)
    }
    return `Error: unknown action '${action}' — valid actions: stats | prune | compact`
  },
}
