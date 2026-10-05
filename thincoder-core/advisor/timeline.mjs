/**
 * advisor/timeline.mjs — 评审环路的有序时间线记录器（自 advisor/loop.mjs 迁出——advisor-loop-split 批）：
 *  记录序 / 同类合流 / 三 kind 包装一体；下游消费 = renderTimeline（compaction.mjs）。
 *  零 import 叶（对照 agent/relay-prefix.mjs 先例家族）。
 *
 *  @param {Function} [onOutput] — 实时 chunk 出口；缺省 ⇒ 只记录不出口。
 *  @returns {{ timeline: Array, onThink: Function, onText: Function, onTool: Function }}
 */
export function createTimelineRecorder(onOutput) {
  // Kind-tagged wrappers: the TUI panel colors reasoning / answer / tool progress differently.
  // Every chunk is ALSO recorded into an ordered timeline — the persisted record
  // must show the review process (thinking ↔ tool progress ↔ final text) at its
  // real positions, not a summary appended at the end. Same-kind consecutive
  // chunks merge (token streams); kind flips start a new entry.
  const timeline = []
  const record = (kind, text) => {
    const last = timeline.at(-1)
    if (last && last.kind === kind) last.text += text
    else timeline.push({ kind, text })
  }
  const emit = (kind) => (text) => { record(kind, text); onOutput?.({ kind, text }) }
  const onThink = emit("think")
  const onText = emit("text")
  const onTool = emit("tool")
  return { timeline, onThink, onText, onTool }
}
