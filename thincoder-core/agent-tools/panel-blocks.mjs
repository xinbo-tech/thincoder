/**
 * panel-blocks.mjs — AGENT-LOOP-SUBAGENT.md §6.7.2 D-P1 面板块列表（读时现算，纯函数）。
 *
 * 来源 = `thincoder-cli/src/tui/subagent-freeze.mjs` 的 `computePanelBlocks`——**逐字随迁**
 * （CORE-UNIFICATION §2.5 #159：`panel` 动作以 CLI 为准；#99：VSC 无 panel ＝ **有意端差**
 * ⇒ 其载荷面在 VSC 不存在，未挂载（`state` 缺省）即返 `null` = 无面板，消费面降级——
 * 这正是「④ 段以注入剔除」在核内的形态：核只读注入进来的 state，不判端名）。
 *
 * 现算面板块列表（state.subTasks 活值纯推导——无时点快照语义）。
 * status 三态映射：done+awaitingDigest → "awaitingDigest"；done → "done"；
 * queued（waiting/等位未启动）→ "queued"；其余 → "running"（§20 D-SD3b queued 态入镜口径保留）。
 */
export function computePanelBlocks(state) {
  const subs = state?.subTasks
  if (!subs) return null // 未挂载（headless/mock 无 TUI state）——无面板
  const blocks = []
  for (const sub of Object.values(subs)) {
    // §20 D-SD3b：waiting/等位块（sub.queued——未启动）以 queued 态入镜（视图与面板
    // 所见一致——action:'panel' 视图 + freeze 门控读此态）。
    const status = sub.done ? (sub.awaitingDigest ? "awaitingDigest" : "done") : (sub.queued ? "queued" : "running")
    blocks.push({ key: sub.key, role: sub.role ?? null, status, startedAt: sub.started ?? Date.now() })
  }
  return blocks
}
