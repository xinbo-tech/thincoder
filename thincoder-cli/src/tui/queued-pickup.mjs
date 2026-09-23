/**
 * queued-pickup.mjs — 步边界 pickup（用户 → 主会话投送通道的主时机）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8「步边界 pickup」（核循环头投递回调
 * `consumeQueuedInput`——一步 = 一次 LLM 调用 + 其工具执行段完结）+ `docs/cli/design/TUI.md` §7.5
 * 「消费时机①」（queue-visible 批 fix 轮 2026-09-24 · 用户 03:06 收正）。
 * 语义 = 不中断（在飞工具 / signal 零触碰）· 下一步生效 · 普通 user 消息落历史（参照系 = 子代理
 * `send`——参照非改造）；与 Ctrl+I 严格区分（零 abort / 零 `[User interrupt:]`）。
 */
import { pushReal } from "@thincoder/core/context.mjs"
import { ansi, C } from "./ansi.mjs"
import { planQueuedInput } from "./queued-merge.mjs"

/**
 * 步边界取批（核循环头回调——空队列 no-op，headless / 直连面零开销）。
 * 取数 = 计划首动作（`planQueuedInput`——2 条短消息 ⇒ 合并批一次消费）；`/cmd` 首动作 =
 * 入队门禁不可达的防御面（斜杠 busy 禁发——`TUI-INPUT-BOX.md` §4.1 条件 3）⇒ 不消费，
 * 留给既有消费点（回合尾 queue / driver）。呈现 = 回执行 + `❯ You:` + 本批文本（与
 * `agent-turn.mjs` 回合起点同形——下一步 LLM 请求即含该消息）。
 * @param {object} ctx TUI 上下文（agent / state / pushLine / pushLabel / render）
 */
export function pickupQueuedAtStepBoundary(ctx) {
  const { agent, state, pushLine, pushLabel, render } = ctx
  const items = state.pendingInput
  if (!items || items.length === 0) return
  const action = planQueuedInput(items)[0]
  if (action.kind !== "turn") return
  items.splice(0, action.count)
  pushReal(agent, { role: "user", content: action.text }) // 下一步生效（非中断通道）
  pushLine("[sending queued message]", C.tool) // 消费回执（按批——TUI.md §7.5 消费时行）
  pushLabel(`❯ You:`, ansi.bold + C.user)
  pushLine(action.text, C.text)
  render()
}
