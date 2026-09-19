import { newSession, resetSessionState, bindRecordStore, slotPath } from "@thincoder/core/session.mjs"
import { C } from "./ansi.mjs"

/** /new command: start a new session in a fresh slot.
 *  ctx: { agent, state, pushLine, showPicker, render } */
export async function handleNewCommand(ctx) {
  const { agent, state, pushLine, showPicker, render } = ctx

  // F-MI7：newSession = async（探测束）——doNewSession 随之为 async，调用点 await
  const doNewSession = async () => {
    const slot = await newSession(agent.cwd)
    // 2026-08-31 会诊 F3：resetSessionState 清全量会话态（_fullHistory/title/_sessionStart/
    // 多槽设计凭证（_engDesignTokens——单值镜像 _engDesignToken 已退役 D3）/压缩与验证计数
    // 等）——原实现只清 agent.history，新会话首次落盘把旧会话完整人类线 + 旧标题写进新
    // slot（实锤 .19/.3 双副本）。_slot 更新为粘性新槽位。
    resetSessionState(agent)
    agent._slot = slot
    // §14.3.4：/new 绑定新槽记录存储（baseHistory 空——identity 此时为 null = 待固化；
    // 首次保存/首条追加时补写现场身份）
    bindRecordStore(agent, { slotFile: slotPath(agent.cwd, slot), identity: agent._sessionStart ?? null, baseHistory: [] })
    state.tasks = []
    state.lines = []
    state._linesChars = 0 // TUI-OOM-ROOTCAUSE（§15.3.2）：行集清空 → 字符账同步归零
    state.streaming = ""
    render()
    pushLine(`New session started (slot ${slot}; /session to switch back)`, C.dim)
  }

  if (agent.history.length > 0) {
    const e = await showPicker("Start new session?", [
      { type: "item", text: "Yes, start new session in a new slot", action: "yes" },
      { type: "item", text: "Cancel", action: "no" },
    ], { defaultIndex: 1 })
    if (e?.action === "yes") await doNewSession()
    return
  }
  await doNewSession()
}
