/**
 * ext.mjs — ACP extension pull face (ACP-CLIENT.md §3.5): `checkpoint/*` + `memory/*`.
 * **纯搬迁** from the former monolithic `acp.mjs` (cited block = 68 lines) + factory shape;
 * zero semantics changed — only the credential gate is now the shared immediate predicate
 * (§11.2 改法①) and `getCwd` / `log` come through `ctx`.
 *
 * Checkpoints are cwd-scoped (same store the TUI git tool uses); non-git cwds
 * snapshot by full-directory copy instead of returning null.
 * Memory reuses the same `~/.thincoder/memory.db` store the TUI does.
 */
import { join } from "node:path"
import { configDir } from "@thincoder/core/config.mjs"
import { createCheckpoint, listCheckpoints, rewind, isGitRepo } from "@thincoder/core/git/checkpoint.mjs"
import { createMemory, list as memList, remove as memRemove } from "@thincoder/core/memory.mjs"
import { ACP_ERRORS } from "./transport.mjs"

/** Build the extension handlers. Shared state arrives via the single `ctx` (§3.5). */
export function createExtHandlers(ctx) {
  const { getCwd, requireConfigured } = ctx

  return {
    "checkpoint/create": async () => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const cp = await createCheckpoint(getCwd())
      if (!cp) return { error: { ...ACP_ERRORS.INTERNAL, message: "checkpoint creation failed" } }
      return { checkpoint: { id: cp.id, time: cp.time, files: cp.files, git: isGitRepo(getCwd()) } }
    },

    "checkpoint/list": async () => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const cps = await listCheckpoints(getCwd())
      return { checkpoints: cps.map((c) => ({ id: c.id, time: c.time, files: (c.tracked?.length ?? 0) + (c.untracked?.length ?? 0), trackedCount: c.tracked?.length ?? 0, untrackedCount: c.untracked?.length ?? 0 })) }
    },

    "checkpoint/restore": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      if (!params.checkpointId || !params.path) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "checkpoint/restore requires checkpointId and path (single-file restore; full rewind is disabled)" } }
      }
      try {
        await rewind(getCwd(), String(params.checkpointId), { path: String(params.path) })
        return { restored: String(params.path) }
      } catch (e) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: e?.message ?? String(e) } }
      }
    },

    "memory/list": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const mem = ensureAcpMemory()
      if (!mem) return { error: { ...ACP_ERRORS.INTERNAL, message: "memory unavailable" } }
      const entries = await memList(mem, { type: params.type })
      return { entries: entries.map((e) => ({ id: e.id, type: e.type, title: e.title, tags: e.tags ?? "", updatedAt: e.updatedAt ?? null })) }
    },

    "memory/remove": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const id = Number(params.id)
      if (!Number.isInteger(id) || id < 1) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `memory/remove requires a numeric id (got ${params.id})` } }
      }
      const mem = ensureAcpMemory()
      if (!mem) return { error: { ...ACP_ERRORS.INTERNAL, message: "memory unavailable" } }
      const ok = await memRemove(mem, id)
      return ok ? { removed: id } : { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `no memory entry #${id}` } }
    },
  }
}

/** Shared memory handle for ACP handlers (same ~/.thincoder store the TUI uses).
 *  dbPath mirrors the TUI default (see cli/make-agent.mjs). */
let _acpMemory = null
function ensureAcpMemory() {
  if (_acpMemory) return _acpMemory
  try {
    _acpMemory = createMemory({ dbPath: join(configDir, "memory.db") })
    return _acpMemory
  } catch {
    return null // memory subsystem unavailable — handlers report it
  }
}
