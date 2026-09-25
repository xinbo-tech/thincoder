/**
 * response-stages.mjs — agent.mjs 响应后处理段外提（2026-09-25 file-tier-sweep 批 S2；
 * 登记候选逐字 = `docs/vsc/design/VSC-DEBT.md` §12.1「响应后处理段（builtin / interrupt / reminders）」）。
 * 段内容 = traceStop 收尾 → 内置工具结果本地化 → interrupt 提交 → usage 记账 → 流规则 abort
 * 消费 → 响应提醒注入（原 `agent.mjs:300-344` 逐字搬迁——语义零变；字段写点
 * `agent._lastPromptTokens` / `_usageAtLen` 随迁）。
 *
 * 控制流保真（搬运契约）：interrupt 提交的 `throw` 在 helper 内抛 ⇒ 随调用栈传播——调用点
 * 必须在主 `try` 内（agent.mjs）；流规则 abort 的 `continue` ⇒ 本函数回传判别式
 * `{action:"continue"}`、调用侧翻译为 `continue`（先例 = VSC-DEBT §12.2.1 段 A `{done:true}` 式）。
 *
 * 环面（§12.5 判据）：import 面 = `../extension/stop-trace.mjs`（traceStop）· `./run-helpers.mjs`
 * （pushReal）· `./rules-face.mjs`（applyRuleTriggered）· `./run-stages.mjs`（injectResponseReminders）；
 * `run-stages.mjs:42` 自 `../agent.mjs` import ContinueError ⇒ 环 = agent.mjs ⇄ run-stages.mjs ⇄
 * response-stages.mjs 三节点（既有两节点环的扩展）。环安全 = **本档顶层零解引用**（顶层语句集 =
 * import 声明 ∪ 函数声明——静态可扫；全部跨环引用在函数体内）。
 */
import { traceStop } from "../extension/stop-trace.mjs"
import { pushReal } from "./run-helpers.mjs"
// #130 A-3：stream 规则 abort 消费（部分输出入线 + 规则提醒 + `continue` 重入）
import { applyRuleTriggered } from "./rules-face.mjs"
import { injectResponseReminders } from "./run-stages.mjs"

/** 响应后处理段（`chat()` 返回后、提交分支之前调用）。
 *  @param {{agent: object, history: object[], fullHistory: object[], response: object, turn: number, depth: number, callbacks: object}} deps
 *  @returns {{action: "continue"} | undefined} 流规则 abort 命中 ⇒ `{action:"continue"}`（调用侧 `continue`） */
export function applyResponseStages({ agent, history, fullHistory, response, turn, depth, callbacks }) {
  traceStop(`turn ${turn}: LLM stream ended`)

  // 内置工具（Responses web_search）结果本地化：服务端已执行——入历史为 tool 消息，
  // 模型下一轮可见；全量回传时 transport 依 tool_call_id 前缀还原 web_search_call item。
  // 服务端 item id 是 msg_xxx 非 web_search_call_ 前缀——必须合成前缀（toItems 识别锚点），
  // 原始 id 存入 content（真机冒烟 2026-08-31，与 CLI 同修）。
  for (const btr of response.builtinToolResults ?? []) {
    if (!btr?.id) continue
    pushReal(history, fullHistory, {
      role: "tool",
      tool_call_id: `web_search_call_${btr.id}`,
      content: JSON.stringify({ id: btr.id, query: btr.query ?? "", sources: btr.sources ?? [], status: btr.status ?? "completed" }),
    })
  }

  // Interrupt (Ctrl+I, CLI agent.mjs parity): the SSE stream returned the
  // partial result — commit the partial assistant output, inject the user's
  // message, and throw so the outer loop rebuilds the controller and resumes.
  if (response.interrupted) {
    if (response.content) pushReal(history, fullHistory, { role: "assistant", content: response.content })
    history.push({ role: "user", content: `[User interrupt: ${response.interruptMessage}]` })
    const err = new DOMException("Aborted", "AbortError")
    err.reason = { interrupt: true, message: response.interruptMessage }
    throw err
  }

  if (response.usage && depth === 0) {
    callbacks.onUsage?.(response.usage)
    // Measured compaction baseline (CLI parity D3): the full-context prompt_tokens from
    // this response anchors the next compaction check; appended messages count as increments.
    if (response.usage.prompt_tokens != null) {
      agent._lastPromptTokens = response.usage.prompt_tokens
      agent._usageAtLen = history.length
    }
  }

  // Stream rule triggered (action: "abort"): halt, inject the rule message, retry from the
  // same context (CLI `agent.mjs:305-315` parity — response 后处理段、injectResponseReminders 之前)。
  // 注：核中 ruleTriggered 先于 interrupted，本端反之——两标志互斥（核 provider/sse.mjs：
  // abort 规则命中即 return，interrupted 仅在 catch 置位）⇒ 次序无观测差。
  if (applyRuleTriggered(agent, history, fullHistory, response)) return { action: "continue" }

  // Warnings from this response + abnormal finish-reason reminder (D-CI9——cli
  // agent.mjs:293 同位：interrupt/builtin 处理之后、toolCalls 分支之前)。
  injectResponseReminders(agent, response)
}
