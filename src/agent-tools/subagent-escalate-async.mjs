/**
 * subagent-escalate-async.mjs — §25 R17 飞刀 async（AGENT-LOOP.md §25 D-R17b——VS Code
 * 镜像——2026-09-06）。sync 路径（async:false）在 subagent-escalate.mjs verbatim 保留；
 * 本模块 = async 面：入 **other 池**（§24 D-24a——与 explore/plan 共享槽位——自然容量；
 * 池满经 spawnAsyncSubagent 排队——escalate 与 explore 同池公平排队）+ 回合自然收尾 +
 * settle 三分类 + 独立 pending 流（D-R17c——_pendingEscalateResults——与 subagent/advisor
 * 互不干扰）+ 飞刀专属 digest 注入文案。
 *
 * Settle 三分类（D-R17b——评审 #4/round2 #4 钉死）：
 * - done → merge-all（mergeChildMutations——同 async 子代理 merge 机制）+ 与父侧并发写
 *   重叠 → **报告级警告**（不 gate——决策句）；
 * - error（child 失败/撞 turn cap）→ 已产出 partial mutations：父侧已改重叠文件 →
 *   不 merge + 报告列差异；无重叠 → merge——错误报告注入；
 * - cancelled（cancelSubagent/UI ⏹——定向中止）→ 不入 pending（D-M6——取消提醒已在
 *   cancel 时注入机读线）——出池 + 停止冻结通知；
 * - aborted（会话/全停——controller 链中止）→ 出池丢弃（中止清池不注入——陈旧错误零注入）。
 *
 * done/error 报告 park-ALWAYS 进 history._pendingEscalateResults（settle 即出池——
 * 状态/取消/补位共享池机制在 settle 前照常）——消费点 = 下回合 run-start 注入（digest/
 * 用户回合统一单点）+ 挂起退出残留兜底。手动档 digest 动作域零例外（禁写禁 spawn——
 * T-R17p——消化轮域由 §17 D-S6 既有机制机械强制）。
 *
 * 模块图：单向 import subagent-escalate.mjs（helpers）+ subagent-async.mjs
 * （spawnAsyncSubagent/mergeChildMutations）+ subagent-scheduler.mjs（nextSubagentId/
 * refill/refresh/writeTombstone）；subagent-escalate.mjs 动态 import 本模块（防环）。
 */
import { logEvent, errText } from "../log.mjs"
import { escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { spawnAsyncSubagent, mergeChildMutations } from "./subagent-async.mjs"
import { nextSubagentId, refillPool, refreshQueuedRows, writeTombstone } from "./subagent-scheduler.mjs"
import { escalateLabel, prepareEscalateProvider, touchedFilesNote } from "./subagent-escalate.mjs"

/** 飞刀 async 发起（§25 D-R17b——escalateAction async 分支调用）：入 other 池——
 *  spawnAsyncSubagent 全权处理槽位/排队/条目级 controller/停止冻结通知——自定义 settle
 *  （settleEscalateEntry——三分类 + merge 决策 + 飞刀族 pending 流）。返回 ack
 *  （{id, role:"escalate", status}）——同步路径（async:false）不经过本模块。 */
export async function launchEscalateAsync({ parent, ctx, task, pick }) {
  const prep = await prepareEscalateProvider(pick, ctx)
  if (prep.error) return prep.error
  const { withEffort, effortNote } = prep
  const tag = escalateLabel(pick)
  const subId = nextSubagentId(parent)
  const childSignal = ctx.sessionSignal ?? ctx.signal ?? null
  // launchEvents 快照：settle 重叠判定 = 发起后父侧文件变更事件（_fileMutEvents——child
  // 自身的写不入父事件流——settle merge 时才记账）——同 advisor eventsAtLaunch 判据。
  const launchEvents = ((parent.history ?? parent)._fileMutEvents?.length) ?? 0
  // 条目 provider 仅服务 entry.model/started 事件——model tag 与 sync escalate 事件同形
  // （UI 路由零改动）；引擎本体用真实 withEffort（model = pick.model——chat 需要）。
  const displayProvider = { ...withEffort, model: tag }
  const runChild = async (entry) =>
    runEscalateAsyncEngine({ parent, ctx, entry, task, pick, provider: withEffort, tag, effortNote, launchEvents })
  return spawnAsyncSubagent({
    parent, ctx, subId, role: "escalate", provider: displayProvider, childSignal,
    runChild, files: [], dependsOn: [], settle: settleEscalateEntry,
  })
}

/**
 * 飞刀 async 引擎（与 sync 引擎同构的差异面：条目级 controller signal——cancel 定向
 * abort；ContinueError 永不弹面板（§15 D-A3——后台 child 不询问）→ error-class partial；
 * 不 merge（merge 决策在 settle——overlap 判定需要 settle 时刻的父事件流）；onQuestion
 * null。返回 outcome { kind: done|error|cancelled|aborted, text, sink, tag, launchEvents }。
 */
async function runEscalateAsyncEngine({ parent, ctx, entry, task, pick, provider, tag, effortNote, launchEvents }) {
  const agentMod = await import("../agent.mjs")
  const runner = ctx.runAgent ?? agentMod.runAgent
  let output = ""
  const sink = {}
  const panel = (chunk) => ctx.callbacks?.onToolPanel?.(`sub:escalate ${tag} #${entry.id}`, chunk)
  const runOpts = (resume) => ({
    depth: 1, role: "coder", // full write path: permission gate, recent-changes tracking
    streamOutput: true, // exempt from the agent.mjs onToken depth gate (consult role parity)
    maxTurns: parent.config?.agent?.subagentTurns ?? 100,
    stateSink: sink,
    resume,
    ...(resume ? { history: sink.history } : {}),
  })
  const outcome = (kind, text) => ({ kind, text, sink, tag, launchEvents })
  // No wall-clock watchdog — turn cap only (CLI parity, 2026-08-16): a fixed wall-clock
  // aborts NORMAL-but-slow surgery. Hang protection = FETCH_TIMEOUT + session Stop.
  for (let resumes = 0; ; resumes++) {
    try {
      const report = await runner({ ...provider, model: pick.model }, ctx.cwd, task, {
        // Full reasoning + output stream (consult-UI parity): a long surgery is silent
        // without it — the panel shows WHAT the expert is thinking, not just tool calls.
        onToken: (t) => { output += t; panel({ kind: "text", text: String(t ?? "") }) },
        onReasoning: (r) => panel({ kind: "think", text: String(r ?? "") }),
        onToolCall: (name, args) => panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) }),
        onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
        onComplete: () => {},
        // §19.5 D-M5 同型：turn 钩子同步条目决策字段（status 可见性——与 spawn 子代理一致）
        onAgentTurn: (t) => { entry.turn = t; entry.childAgent = sink.agent ?? entry.childAgent },
        onQuestion: null, // async：永不弹继续面板——cap → error-class partial（D-R17b）
      }, entry.controller?.signal ?? null, true, runOpts(resumes > 0))
      // 完成瞬间被 cancel 的竞态（同 subagent runChild——先于任何事件/merge 判定）
      if (entry?.cancelled) return outcome("cancelled", "")
      ctx.callbacks?.onSubagent?.({
        id: entry.id, role: "escalate", status: parent.history?._suspended === true ? "settled" : "done", model: tag,
      })
      return outcome("done", `escalate (${tag})${effortNote} post-op report:\n${report || output.slice(0, 4000)}`)
    } catch (e) {
      // cancel 定向中止先于一切（取消路径不 merge——D-M6——settle cancelled 分支收尾）
      if (entry?.cancelled) return outcome("cancelled", "")
      // 会话/全停链中止（AbortError）→ aborted——settle 丢弃不注入（中止清池语义）
      if (e?.name === "AbortError" || entry?.controller?.signal?.aborted) return outcome("aborted", "")
      const msg = e?.message ?? String(e)
      if (e instanceof agentMod.ContinueError) {
        // async cap：error-class（无面板——partial merge 决策在 settle——D-R17b 撞 turn cap 归 error）
        const text = `escalate (${tag}) stopped: turn cap reached (${e.turns} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`
        ctx.callbacks?.onSubagent?.({ id: entry.id, role: "escalate", status: "error", error: text, model: tag })
        return outcome("error", text)
      }
      const text = `escalate (${tag}) error: ${msg}\nPartial output: ${output.slice(0, 2000)}`
      ctx.callbacks?.onSubagent?.({ id: entry.id, role: "escalate", status: "error", error: msg, model: tag })
      return outcome("error", text)
    }
  }
}

/** 飞刀 async settle（§25 D-R17b settle 三分类 + round2 #4 merge 决策钉死）。
 *  池簿记镜像 settleAsyncEntry（取消/中止出池/腾槽补位/resolve/notify）——差异 = 飞刀
 *  族 merge 决策 + 独立 pending 流（_pendingEscalateResults——D-R17c）。 */
function settleEscalateEntry(parent, entry, outcome, error, notifySettle) {
  entry.done = true
  entry.status = "done"
  const res = outcome ?? { kind: error != null ? "error" : "done", text: error ?? "", sink: null, tag: entry.tag ?? null, launchEvents: 0 }
  // LOGGING（LOGGING.md——CLI parity）：settle 分流——child:done/child:error + ev:cancelled
  const childLogId = `escalate#${entry.id}`
  const childMs = entry.startedAt ? Date.now() - entry.startedAt : 0
  if (res.kind === "cancelled") {
    logEvent("ev:cancelled", { id: childLogId })
  } else if (!entry.signal?.aborted && !entry.controller?.signal?.aborted) {
    if (res.kind === "error") logEvent("child:error", { role: "escalate", id: childLogId, ms: childMs, err: errText(res.text, 200) })
    else logEvent("child:done", { role: "escalate", id: childLogId, ms: childMs, kind: "ok" })
    if (parent.history?._suspended === true) logEvent("ev:settled", { id: childLogId, kind: "suspended" })
  }
  const drop = () => {
    parent.history?._asyncSubagents?.delete(entry.id)
    parent._asyncSubagents?.delete(entry.id)
  }
  if (res.kind === "cancelled") {
    // D-M6：不入 pending/不 merge——出池 + 墓碑 + 停止冻结通知（_onCancelled——webview）
    drop()
    writeTombstone(parent, entry.id, "cancelled", "escalate")
    entry._onCancelled?.()
  } else if (res.kind === "aborted" || (entry.signal?.aborted && !entry.signal?.reason?.interrupt)
      || (entry.controller?.signal?.aborted && !entry.cancelled)) {
    // 会话/全停链中止——出池丢弃（无注入——中止不注入陈旧错误）
    drop()
  } else {
    // ── done/error 三分类 merge 决策（round2 #4 钉死）──
    const sink = res.sink ?? {}
    const touched = Array.isArray(sink.touchedFiles) ? sink.touchedFiles : []
    const events = Array.isArray((parent.history ?? parent)._fileMutEvents)
      ? (parent.history ?? parent)._fileMutEvents.slice(res.launchEvents ?? 0)
      : []
    const key = (p) => String(p ?? "").replace(/\\/g, "/").toLowerCase()
    const eventKeys = new Set(events.map(key))
    const overlap = touched.filter((f) => eventKeys.has(key(f)))
    const isDone = res.kind === "done"
    const merged = touched.length > 0
    if (isDone) {
      // done → merge-all（merge 前重叠检测——重叠警告入报告——报告级提示不 gate）
      mergeChildMutations(parent, sink)
      entry.overlapWarning = overlap.length > 0 ? overlap : null
    } else if (overlap.length === 0) {
      // error + 无重叠 → merge partial
      mergeChildMutations(parent, sink)
      entry.mergeSkipped = null
    } else {
      // error + 有重叠 → 不 merge + 报告列差异（半成品不入父 guard 记账）
      entry.mergeSkipped = overlap
    }
    const cwd = parent.cwd ?? process.cwd()
    const touchedNote = touchedFilesNote(sink, cwd)
    const warning = entry.overlapWarning?.length
      ? `\n⚠ overlap: ${entry.overlapWarning.join(", ")} was also modified by the main session while the escalate ran — the escalated write may conflict; verify the file before building on it.`
      : ""
    const skipNote = entry.mergeSkipped?.length
      ? `\n⚠ partial changes NOT merged — overlapping files also changed by the main session while the escalate ran: ${entry.mergeSkipped.join(", ")} (the escalated write was left on disk but out of your session bookkeeping — review and reconcile).`
      : ""
    entry.tag = res.tag ?? entry.tag ?? "escalate"
    entry.outcome = isDone ? "done" : "error"
    entry.injectBody = `${res.text}${touchedNote}${warning}${skipNote}`
    // park-ALWAYS：报告全文入 _pendingEscalateResults（独立流——D-R17c）→ digest 注入
    const holder = parent.history ?? parent
    const pend = (holder._pendingEscalateResults ??= [])
    if (!pend.includes(entry)) pend.push(entry)
    drop()
    // 终态墓碑（dependsOn 语义——settled escalate 视为完成/失败）
    writeTombstone(parent, entry.id, isDone ? "consumed" : "failed", "escalate")
  }
  entry._resolve?.(entry)
  // §20 D-SD4 释放点：腾槽补位（飞刀与 explore/plan 同池公平排队——T-R17g）+ 行刷新
  refillPool(parent, (e) => e._auto?.() ?? false)
  refreshQueuedRows(parent)
  notifySettle?.()
}

/** 飞刀 digest 注入（独立流文案——与 subagent/advisor 族区分——D-R17c）：done = 已
 *  merge 的完成报告（处置 = 消费回合档位内正常继续——手动档 auto-turn 禁写由 D-S6 域
 *  模板机械强制——T-R17p）；error = 错误报告 + partial merge 决策注记。注入即消费。 */
export async function injectEscalateResult(entry, { history, fullHistory, cwd }) {
  const tag = entry.tag ?? "escalate"
  const head = entry.outcome === "error"
    ? `[System reminder: async escalate #${entry.id} (${tag}) FAILED — error report below; partial changes were ${entry.mergeSkipped?.length ? `NOT merged (overlap: ${entry.mergeSkipped.join(", ")})` : "merged (no overlap with your own edits)"}]:`
    : `[System reminder: async escalate #${entry.id} (${tag}) finished — its changes were merged into your session${entry.overlapWarning?.length ? " (⚠ overlap — see report)" : ""}; post-op report:`
  const body = `${head}\n\n${entry.injectBody ?? ""}]`
  pushReal(history, fullHistory, {
    role: "user",
    content: escapeXml(offloadToolResult(cwd ?? process.cwd(), body)),
  })
}
