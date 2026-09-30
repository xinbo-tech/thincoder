/**
 * continue-decision.mjs — 续跑判定（核单源 · #677 · I10）。
 * 同形重复族 #127 ④（续跑循环双写——CLI `thincoder-cli/src/tui/agent-turn.mjs` ∥ VSC
 * `thincoder-vscode/src/extension/panel-turn-loop.mjs`）收口：端壳循环只接线本函数，
 * 零第二分支；判定口径改一处 ⇒ 两端同轮生效（原双改纪律退役）。
 * 三格判定（口径 = TURN-CAP-CONTINUE.md D-TC15 ∕ F8）：
 *   ① ContinueError（撞帽）——无人值守档（autoTurn）⇒ "cap-stop"（不静默自续）；
 *      人工档 ⇒ "ask"（续期恒须人答——AUTO 亦不自动批准）。
 *   ② 中止（AbortError ∥ reason 在场）——带注入消息的 interrupt（Ctrl+I）⇒ "resume"；其余 ⇒ "stop"。
 *   ③ 其余错误 ⇒ "error"；无错误（正常完成）⇒ "done"。
 * `reason` = 调用方解析后的中止 reason（两端同式 = 回合 controller `signal.reason` 单源——#677 修正轮对齐；
 * 核不臆测宿主 signal 源）。
 * `autoApprove` = 接口承载（#127 形）；现语义下不改判定（F8 ∕ D-TC15）。
 */
import { ContinueError } from "./helpers.mjs"

/** @returns {"done"|"cap-stop"|"ask"|"resume"|"stop"|"error"} */
export function continueDecision(error, { autoTurn = false, autoApprove = false, reason = null } = {}) {
  if (error == null) return "done"
  if (error instanceof ContinueError) return autoTurn ? "cap-stop" : "ask"
  if (error.name === "AbortError" || reason != null) {
    return reason?.interrupt && reason?.message ? "resume" : "stop"
  }
  return "error"
}
