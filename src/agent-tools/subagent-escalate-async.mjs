/**
 * subagent-escalate-async.mjs — §25 R17 飞刀 async（AGENT-LOOP.md §25 D-R17b——VS Code
 * 镜像——2026-09-06）。sync 路径（async:false）在 subagent-escalate.mjs verbatim 保留；
 * 本模块 = async 面：入 **other 池**（§5 D-24a——与 explore/plan 共享槽位——自然容量；
 * 池满经 spawnAsyncSubagent 排队——escalate 与 explore 同池公平排队）+ 回合自然收尾 +
 * settle 三分类（onAccounting hook——ASYNC-RESULT-CONTAINER.md D3 共享 helper）+ pending
 * 单容器流（history._pendingAsyncResults +role——D2）+ 飞刀专属 digest 注入文案。
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
 * done/error 报告 park-ALWAYS 进 history._pendingAsyncResults（pending 单容器 +role——
 * ASYNC-RESULT-CONTAINER.md D2——settle 即出池——状态/取消/补位共享池机制在 settle 前
 * 照常）——消费点 = 下回合 run-start 注入（digest/用户回合统一单点）+ 挂起退出残留
 * 兜底。手动档 digest 动作域零例外（禁写禁 spawn——
 * T-R17p——消化轮域由 §17 D-S6 既有机制机械强制）。
 *
 * 模块图：单向 import subagent-escalate.mjs（helpers）+ subagent-async.mjs
 * （spawnAsyncSubagent/mergeChildMutations）+ subagent-scheduler.mjs（nextSubagentId）
 * + async-settle.mjs（settleAsyncEntry/buildChildSignal——D3/D6 共享 helper）；
 * subagent-escalate.mjs 动态 import 本模块（防环）。
 */
import { applyTurnFrame, escapeXml, offloadToolResult, pushReal } from "../agent/run-helpers.mjs"
import { digestBudgetOver, persistOverflowReport } from "./digest-budget.mjs" // B5（群 B 批 §16 D-DG2）：digest 注入预算单源
import { spawnAsyncSubagent, mergeChildMutations } from "./subagent-async.mjs"
import { nextSubagentId } from "./subagent-scheduler.mjs"
import { settleAsyncEntry, buildChildSignal } from "./async-settle.mjs"
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
  // D6 buildChildSignal 单点（sessionSignal ?? agent._sessionSignal ?? ctx.signal）
  const childSignal = buildChildSignal(ctx)
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
  // 段间累计（§19.3 消费侧义务——与 runChild 同构）：段前累计循环外声明、跨迭代存活；
  // 续跑支以 opts 种子回传。本端续跑支当前休眠（ContinueError 全走 error-class return，
  // 全档无 continue）——种子写入 = 同构契约驻留（未来开放续跑即在位），零行为变化。
  let turnBase = 0
  const runOpts = (resume) => ({
    depth: 1, role: "coder", // full write path: permission gate, recent-changes tracking
    streamOutput: true, // exempt from the agent.mjs onToken depth gate (consult role parity)
    maxTurns: parent.config?.agent?.subagentTurns ?? 100,
    stateSink: sink,
    resume,
    // SUBAGENT-OBSERVE-SEND.md D2（2026-09-08，out-of-list——飞刀 async 与 spawn 同池公平排队，
    // 父 send 无差别 targeting 池条目）：飞刀条目同样提供 turnInput 消费回调（读 entry._injected）
    // ——否则 send 落飞刀静默入队永不到达（settle 才注"未投递"）。语义与 spawn runChild 一致。
    turnInput: entry ? () => ((entry._injected?.length ?? 0) > 0 ? entry._injected.splice(0) : []) : null,
    ...(resume ? { history: sink.history, _turnSeqBase: turnBase } : {}),
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
        onToolCall: (name, args) => {
          // SUBAGENT-OBSERVE-SEND.md 评审 #2（2026-09-08，out-of-list）：飞刀条目同步记当前
          // 工具（observe 读它——与 spawn runChild 一致）。args 截断（N2）。
          if (entry) entry._currentTool = { name, args: (JSON.stringify(args) || "").slice(0, 200) }
          panel({ kind: "tool", text: name + " " + (JSON.stringify(args) || "").slice(0, 120) })
        },
        onToolResult: (name, text) => panel({ kind: "tool", text: "→ " + String(text ?? "").slice(0, 80).replace(/\n/g, " ") }),
        onComplete: () => {},
        // §19.5 D-M5 同型：turn 钩子同步条目决策字段（status 可见性——与 spawn 子代理一致）
        onAgentTurn: (t, mt) => { turnBase = t; applyTurnFrame(entry, t, mt); entry.childAgent = sink.agent ?? entry.childAgent },
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
 *  ASYNC-RESULT-CONTAINER.md D3：公共收尾（落 done/status、日志三连、cancelled/
 *  parentAborted 出池、pending 单容器移交、_resolve 唤醒、腾槽补位、notifySettle）
 *  统一走 settleAsyncEntry 共享 helper（四族同守卫 !parentAborted 严格版）；本函数 =
 *  族包装——outcome 翻译（kind → report/error/cancelled/强制 aborted）+ onAccounting
 *  hook（三分类 merge 决策 + injectBody 装配）。park-ALWAYS：done/error 报告全量入
 *  pending 单容器（history._pendingAsyncResults +role——D2——settle 即出池）→ digest 注入。 */
function settleEscalateEntry(parent, entry, outcome, error, notifySettle) {
  const res = outcome ?? { kind: error != null ? "error" : "done", text: error ?? "", sink: null, tag: entry.tag ?? null, launchEvents: 0 }
  if (res.kind === "cancelled") entry.cancelled = true // D-M6 取消终态（cancelSubagent/UI ⏹）
  settleAsyncEntry(parent, entry, {
    pool: "escalate",
    report: res.kind === "done" ? res.text : null,
    error: res.kind === "error" ? res.text : null,
    notifySettle,
    aborted: res.kind === "aborted" || undefined, // 引擎 AbortError 分类 → 强制中止分流
    park: "always", // D-R17c：报告 park-ALWAYS（settle 即出池——digest 单点消费）
    tombstonePark: true, // 终态墓碑（dependsOn 语义——settled escalate 视为完成/失败）
    tombstoneCancel: true, // 终态墓碑（dependsOn 语义——cancelled）
    onAccounting: (p, e, { phase }) => {
      if (phase !== "settled") return
      escalateSettleAccounting(p, e, res)
    },
  })
}

/** 飞刀 settle 三分类 merge 决策 + 报告装配（round2 #4 钉死——onAccounting hook，
 *  仅非 cancelled/非中止的 settled 相位执行；ASYNC-RESULT-CONTAINER.md D3 族 hook）。 */
function escalateSettleAccounting(parent, entry, res) {
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
    // SUBAGENT-OBSERVE-SEND.md D2 send→settle 竞态（2026-09-08，out-of-list）：飞刀 settle
    // 未消费 _injected（子在下回合头前终了）→ 报告附"未投递"注记（与 spawn settleAsyncEntry 一致）。
    if ((entry._injected?.length ?? 0) > 0) {
      entry.injectBody += `\n[Note: ${entry._injected.length} message(s) sent to subagent #${entry.id} before it settled were NOT delivered (the child finished before its next turn boundary) — resend the guidance in a new escalate/spawn if it still matters]`
    }
    // park-ALWAYS（pending 单容器 +role——D2）+ 出池 + 终态墓碑（consumed/failed）+
    // _resolve/腾槽补位/notifySettle——helper 公共段（park:"always" + tombstoneCancel）
}

/** 飞刀 digest 注入（独立流文案——与 subagent/advisor 族区分——D-R17c）：done = 已
 *  merge 的完成报告（处置 = 消费回合档位内正常继续——手动档 auto-turn 禁写由 D-S6 域
 *  模板机械强制——T-R17p）；error = 错误报告 + partial merge 决策注记。注入即消费。
 *  §16 D-DG2（群 B 批 B5）：raw（报告正文——标签行不计）计入轮预算（四族共享单源）——
 *  超限改清单行（全文落盘）；首条豁免保留。 */
export async function injectEscalateResult(entry, { history, fullHistory, cwd }) {
  const tag = entry.tag ?? "escalate"
  const head = entry.outcome === "error"
    ? `[System reminder: async escalate #${entry.id} (${tag}) FAILED — error report below; partial changes were ${entry.mergeSkipped?.length ? `NOT merged (overlap: ${entry.mergeSkipped.join(", ")})` : "merged (no overlap with your own edits)"}]:`
    : `[System reminder: async escalate #${entry.id} (${tag}) finished — its changes were merged into your session${entry.overlapWarning?.length ? " (⚠ overlap — see report)" : ""}; post-op report:`
  const raw = String(entry.injectBody ?? "")
  const saved = digestBudgetOver(history, raw.length) ? persistOverflowReport(raw, { cwd: cwd ?? process.cwd(), tag: `escalate#${entry.id}` }) : null
  const body = `${head}\n\n${saved ?? raw}]`
  pushReal(history, fullHistory, {
    role: "user",
    content: escapeXml(offloadToolResult(cwd ?? process.cwd(), body)),
  })
}
