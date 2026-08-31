import { listSlots, switchToSlot, applySession, renameSlot, activeSlot, slotOccupancy } from "../session.mjs"
import { ansi, C } from "./ansi.mjs"
import { restoreLines } from "./startup.mjs"
import { stringWidth, sliceByWidth } from "./render.mjs"

/** /rename <title> — rename the ACTIVE session (slot file + manifest, shared with VS Code). */
export async function handleRenameCommand(ctx, args) {
  const { agent, pushLine, pushLabel, render } = ctx
  // 2026-09-01 会诊 glm 🟡：用粘性槽而非 activeSlot（后者有认领副作用）——与 saveSession
  // 的 _slot ??= activeSlot 语义一致：已钉槽直接重命名，未钉才认领。
  const slot = agent._slot ?? activeSlot(agent.cwd)
  const current = agent.title || "(untitled)"
  const title = args.join(" ").trim()
  if (!title) {
    pushLine(`Usage: /rename <new title>  (current: ${current})`, C.warn)
    return
  }
  if (title.length > 80) {
    pushLine(`Title too long (max 80 chars)`, C.error)
    return
  }
  if (!renameSlot(agent.cwd, slot, title)) {
    pushLine(`Rename failed — active session (slot ${slot}) not found`, C.error)
    return
  }
  agent.title = title
  pushLabel(`── Session renamed: "${title}" ──`, C.warn)
  render()
}

/** /session command: list/switch session slots.
 *  ctx: { agent, state, showPicker, pushLine, pushLabel, render } */
export async function handleSessionCommand(ctx) {
  const { agent, state, showPicker, pushLine, pushLabel, render } = ctx
  const slots = listSlots(agent.cwd)
  if (slots.length === 0) {
    pushLine("No sessions (use /new to start a new session)", C.dim)
    return
  }
  const shortDate = (d) => {
    const dt = new Date(d)
    return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
  }
  const truncate = (s, n) => (stringWidth(s) <= n ? s : sliceByWidth(s, Math.max(1, n - 1)) + "…")
  const entries = [
    { type: "header", text: `Sessions (● = active, ↑↓ select, Enter switch, Esc cancel; /rename <title> renames the active one)` },
    ...slots.map((s) => {
      // 2026-08-31 会诊：行宽必须按显示宽度截断（原按 UTF-16 length 截 40 = 中文 80 格，
      // 顶到右边距后叠加二义字符宽度低估（│/—/● 渲染 2 格算 1 格）→ 行实际超宽 → 物理
      // wrap → 残影）；title 此前完全不截断（可任意长）也是超宽源，一并宽度截断。
      const rawLabel = s.title || (s.firstMessage ? `"${s.firstMessage}"` : "(empty)")
      const label = truncate(rawLabel, 36)
      const turns = s.turnCount > 0 ? `${s.turnCount} turns` : "0 turns"
      const when = shortDate(s.updatedAt)
      const model = s.activeProvider ? ` — ${s.activeProvider}` : ""
      const marker = s.isActive ? " ●" : ""
      return {
        type: "item",
        text: `Slot ${s.slot} │ ${turns} │ ${when} │ ${label}${model}${marker}`,
        slot: s.slot,
      }
    }),
  ]
  const e = await showPicker("Sessions", entries)
  if (!e) return
  // 2026-08-31 会诊 deepseek 🔴：目标槽被另一活进程占用时 switchToSlot 不认领（避免
  // 劫持对方 active），本次会话仍读到数据，但下次保存会 fork 到新槽——提前提示。
  const occ = slotOccupancy(agent.cwd, e.slot)
  const data = switchToSlot(agent.cwd, e.slot)
  if (!data) {
    pushLine(`Slot ${e.slot} not found`, C.dim)
    return
  }
  if (occ.occupied) {
    pushLine(`⚠ Slot ${e.slot} is being used by another live process (${occ.owner}) — continuing here will create a new copy on the next save`, C.warn)
  }
  applySession(agent, data)
  // Rebuild from history (lazy) — the display snapshot is deprecated.
  state.lines = []
  restoreLines(state, data.history)
  state.tasks = agent.tasks ?? []
  if (state.tasks.length > 0 && state.tasks.every((t) => t.status === "done")) {
    state.tasks = []
  }
  pushLabel(`── Switched to slot ${e.slot} (${data.history.length} messages) ──`, C.warn)
  render()
}
