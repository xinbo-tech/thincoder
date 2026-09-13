import { ansi, C } from "./ansi.mjs"

/** /restore command: pick a snapshot, then pick ONE file from it to restore.
 *  Full restore is disabled (v2) — this is the user-side per-file recovery entry
 *  (CHECKPOINT.md D8). ctx: { agent, showPicker, pushLine, pushLabel } */
export async function handleRestoreCommand(ctx) {
  const { agent, showPicker, pushLine, pushLabel } = ctx
  const { listCheckpoints, rewind, isGitRepo } = await import("../git/checkpoint.mjs")
  if (!isGitRepo(agent.cwd)) {
    pushLine("[rewind] not a git repository, checkpoints unavailable", C.error)
    return
  }
  // F6 lazy fallback——与 git 工具 checkpoint list/create 入口一致（git-checkpoint.mjs）：外部
  // git commit 后（HEAD 时间 > 最新快照）先清空过期快照，/restore 不列出 commit 前状态。
  const { lazyClearIfCommitted } = await import("../tools/git-checkpoint.mjs")
  await lazyClearIfCommitted(agent.cwd)
  const cps = await listCheckpoints(agent.cwd)
  if (cps.length === 0) {
    pushLine("(no checkpoints — created automatically before each task)", C.dim)
    return
  }
  // Level 1: pick a snapshot (untracked shown as array length — CHECKPOINT.md D8).
  const entries = [
    { type: "header", text: "Checkpoints — 全量恢复已禁用，逐文件恢复 (↑↓ select, Enter next, Esc cancel)" },
    ...cps.slice(0, 12).map((cp) => ({
      type: "item",
      text: `${cp.id}  ${new Date(cp.time).toLocaleString()}  (+${(cp.untracked ?? []).length} untracked files)`,
      id: cp.id,
    })),
  ]
  const e = await showPicker("Restore Checkpoint", entries)
  if (!e) return
  const cp = cps.find((c) => c.id === e.id)
  if (!cp) return
  // Level 2: pick a file from the snapshot's tracked/untracked merged list.
  const files = [...(cp.tracked ?? []), ...(cp.untracked ?? [])]
  if (files.length === 0) {
    pushLine("该快照无文件，无法逐文件恢复", C.dim)
    return
  }
  const fileEntries = [
    { type: "header", text: `Files in ${cp.id} (↑↓ select, Enter restore, Esc cancel)` },
    ...files.map((f) => ({ type: "item", text: f, id: f })),
  ]
  const fe = await showPicker("Restore File", fileEntries)
  if (!fe) return
  try {
    // v2 return: { path, type, restored } — rewind snapshots current state first (reversible).
    const summary = await rewind(agent.cwd, cp.id, { path: fe.id })
    pushLabel(`❯ Rewind`, ansi.bold + C.warn)
    pushLine(`Restored ${summary.type}: ${summary.path}${summary.restored ? "" : " — nothing restored (snapshot copy missing)"}`, C.tool)
    pushLine("(current state saved as new checkpoint; /restore again to go back)", C.dim)
  } catch (error) {
    pushLine(`[rewind] ${error.message}`, C.error)
  }
}
