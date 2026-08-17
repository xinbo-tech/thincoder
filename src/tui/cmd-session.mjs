import { listSlots, switchToSlot, applySession, renameSlot, activeSlot } from "../session.mjs"
import { ansi, C } from "./ansi.mjs"
import { restoreLines } from "./startup.mjs"

/** /rename <title> — rename the ACTIVE session (slot file + manifest, shared with VS Code). */
export async function handleRenameCommand(ctx, args) {
  const { agent, pushLine, pushLabel, render } = ctx
  const slot = activeSlot(agent.cwd)
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
  const truncate = (s, n) => s.length <= n ? s : s.slice(0, n - 1) + "…"
  const entries = [
    { type: "header", text: `Sessions (● = active, ↑↓ select, Enter switch, Esc cancel; /rename <title> renames the active one)` },
    ...slots.map((s) => {
      const label = s.title || (s.firstMessage ? `"${truncate(s.firstMessage, 40)}"` : "(empty)")
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
  const data = switchToSlot(agent.cwd, e.slot)
  if (!data) {
    pushLine(`Slot ${e.slot} not found`, C.dim)
    return
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
