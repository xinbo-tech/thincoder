import { newSession, resetSessionState } from "../session.mjs"
import { C } from "./ansi.mjs"

/** /new command: start a new session in a fresh slot.
 *  ctx: { agent, state, pushLine, showPicker, render } */
export async function handleNewCommand(ctx) {
  const { agent, state, pushLine, showPicker, render } = ctx

  const doNewSession = () => {
    const slot = newSession(agent.cwd)
    // 2026-08-31 会诊 F3：resetSessionState 清全量会话态（_fullHistory/title/_sessionStart/
    // _engDesignToken/压缩与验证计数等）——原实现只清 agent.history，新会话首次落盘把旧
    // 会话完整人类线 + 旧标题写进新 slot（实锤 .19/.3 双副本）。_slot 更新为粘性新槽位。
    resetSessionState(agent)
    agent._slot = slot
    state.tasks = []
    state.lines = []
    state.streaming = ""
    render()
    pushLine(`New session started (slot ${slot}; /session to switch back)`, C.dim)
  }

  if (agent.history.length > 0) {
    const e = await showPicker("Start new session?", [
      { type: "item", text: "Yes, start new session in a new slot", action: "yes" },
      { type: "item", text: "Cancel", action: "no" },
    ], { defaultIndex: 1 })
    if (e?.action === "yes") doNewSession()
    return
  }
  doNewSession()
}
