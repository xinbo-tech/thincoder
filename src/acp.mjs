/**
 * acp.mjs — `thincoder acp` entry: expose the thincoder agent over the
 * Agent Client Protocol (schema v1) on stdio, so ACP clients (Zed, JetBrains
 * AI Chat, Paseo) can drive sessions directly.
 *
 * M1 scope (see docs/design/ACP-CLIENT.md §9):
 *   initialize / authenticate / session/new / session/prompt / session/cancel / session/close
 * M2: tools + request_permission + fs reverse-RPC. M3: session load/resume/list/delete + config options.
 *
 * Auth: reuse the terminal config (~/.thincoder/config.json) — a resolvable
 * provider API key means "configured". No account system; `logout` is absent.
 *
 * `isConfigured` / `createSession` are injectable for tests.
 */
import { readFileSync } from "node:fs"
import { resolve, join } from "node:path"
import { loadConfig, configDir } from "./config.mjs"
import { assembleAgent } from "./cli/make-agent.mjs"
import { createAcpServer, ACP_ERRORS } from "./acp/transport.mjs"
import { createAcpSession } from "./acp/session.mjs"
import { replayHistory } from "./acp/bridge.mjs"
import { listSlots, applySession, deleteSlot, normalizeCwd, loadSlotFile, slotOccupancy, loadManifest, saveManifest, getSessionId, newSession } from "./session.mjs"
import { createCheckpoint, listCheckpoints, rewind, isGitRepo } from "./git/checkpoint.mjs"
import { createMemory, list as memList, remove as memRemove } from "./memory.mjs"

const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version

/** Load a specific slot file (not the active one) — session/load by id.
 *  2026-08-31 会诊 deepseek 🟡：改用 session.mjs 共享 loadSlotFile（校验/保现场/.tmp
 *  回退与主路径一致）——本地实现此前无 .unreadable/.corrupted 保留。 */

/**
 * Apply a session-level config option to the agent instance (memory only —
 * the session's own runtime state, last-write-wins; not persisted to config.json).
 * Returns true when the configId is known.
 */
function applyConfigOption(agent, configId, value) {
  switch (configId) {
    case "model": {
      if (typeof value !== "string" || !value.trim()) return false
      if (!agent.provider) return false // nothing to configure
      // Split on the FIRST colon only — model names may contain colons.
      const ci = value.indexOf(":")
      const provider = ci >= 0 ? value.slice(0, ci) : null
      const model = (ci >= 0 ? value.slice(ci + 1) : value).trim()
      if (provider && provider !== agent.provider.name) agent.provider.name = provider
      agent.provider.model = model
      return true
    }
    case "thinking": {
      if (typeof value !== "boolean" || !agent.provider) return false
      agent.provider.thinking = value ? { type: "enabled" } : { type: "disabled" }
      return true
    }
    case "mode": {
      if (value !== "plan" && value !== "normal") return false
      agent.planMode = value === "plan"
      return true
    }
    default:
      return false
  }
}

/** Config is "configured" when the active provider has a resolvable API key (env fallback included). */
export function defaultIsConfigured() {
  try {
    return !!loadConfig().provider?.apiKey?.trim()
  } catch {
    return false
  }
}

/** M1/M2 session factory: one agent per session, built from the process cwd (single-cwd model).
 *  `id` is the ACP session id — it is baked into the callbacks at construction time
 *  (buildAcpCallbacks closure), so it must be known BEFORE createAcpSession runs.
 *  `request` is the transport's reverse-RPC channel (permissions + fs routing). */
export async function defaultCreateSession({ id, notify, request, log }) {
  const agent = await assembleAgent()
  return createAcpSession({ id, agent, notify, request, log })
}

/**
 * Build the ACP method handlers. Returns { handlers, sessions, notifyRef } —
 * notifyRef.current is set by runAcpServer once the transport exists; sessions
 * are created lazily (session/new), by which time the reference is live.
 * @param {{ version?: string, notify?: (method, params) => void, log?: (s: string) => void,
 *           isConfigured?: () => boolean, createSession?: (ctx) => Promise<object> }} deps
 */
export function buildAcpHandlers({
  version = VERSION,
  notify = () => {},
  log = () => {},
  isConfigured = defaultIsConfigured,
  createSession = defaultCreateSession,
  cwd = () => process.cwd(),
}) {
  const getCwd = cwd
  const notifyRef = { current: notify }
  const requestRef = { current: async () => { throw new Error("no request channel") } }
  const sessions = new Map()
  let nextId = 1
  let authenticated = false
  const findSession = (params) => {
    const s = sessions.get(String(params?.sessionId))
    if (!s) return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `unknown session ${params?.sessionId}` } }
    return { session: s }
  }

  return {
    handlers: {
      initialize: () => ({
        protocolVersion: 1,
        agentInfo: { name: "thincoder", version },
        authMethods: ["terminal"],
        capabilities: { fs: { read: true, write: true }, terminal: false },
      }),

      authenticate: () => {
        if (!isConfigured()) return { error: ACP_ERRORS.AUTH_REQUIRED }
        authenticated = true
        return { authenticated: true }
      },

      "session/new": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        if (params.cwd !== undefined && typeof params.cwd !== "string") {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "cwd must be a string" } }
        }
        // Normalized comparison: resolve() collapses trailing slashes, and
        // normalizeCwd().toLowerCase() makes the check case-insensitive on
        // Windows (drive letter + path — a client sending "c:\users\…" vs
        // process.cwd() "C:\Users\…" must match). The ternary guards against
        // resolve(undefined) — it would coerce undefined to the literal
        // "undefined" and resolve a nonsense path. Note: `requested` never
        // feeds any path operation — the agent always runs in getCwd() — so
        // a case-insensitive match on case-sensitive platforms is harmless.
        const norm = (p) => normalizeCwd(p).toLowerCase()
        const requested = params.cwd ? resolve(params.cwd) : getCwd()
        if (norm(requested) !== norm(getCwd())) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `v1: cwd must equal the process working directory (${getCwd()})` } }
        }
        if (params.mcpServers?.length) {
          log(`[acp] MCP forwarding is M2 scope — ignoring ${params.mcpServers.length} server(s)`)
        }
        try {
          const id = String(nextId++)
          const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
          // `id` is immutable after construction (baked into the callbacks) — never reassign.
          // 2026-09-01 会诊 kimi/glm 🔴：立即认领独立槽（对齐 cmd-new）——否则首回合保存
          // 走 _slot ??= activeSlot() → ensureActive 早退分支（slotSessions[active]===
          // mySessionId 同进程恒真）→ 第二个会话拿到与第一个相同的槽号 → 双写同槽
          // F2 互旋。getSessionId() 是进程级，_slot 是 agent 级——粒度错配必须在此切断。
          session.agent._slot = newSession(getCwd())
          sessions.set(id, session)
          return { id, configOptions: [{ configId: "model" }, { configId: "thinking" }, { configId: "mode" }] }
        } catch (e) {
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to create session: ${e.message}` } }
        }
      },

      "session/prompt": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const found = findSession(params)
        if (found.error) return found
        const blocks = Array.isArray(params?.content) ? params.content : []
        const text = blocks.find((b) => b?.type === "text")?.text ?? ""
        if (!text) return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "prompt requires a text content block" } }
        try {
          await found.session.run(text)
          return { stopReason: "end_turn" }
        } catch (e) {
          // Cancelled/interrupted turns are not errors on the wire.
          if (e?.name === "AbortError" || e?.code === "ABORT_ERR") return { stopReason: "cancelled" }
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: e?.message ?? String(e) } }
        }
      },

      "session/cancel": (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED } // 2026-08-31 advisor round2 🔵：与其他 handler 一致
        const found = findSession(params)
        if (found.error) return found
        found.session.cancel()
        return {}
      },

      "session/close": (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED } // 2026-08-31 advisor round2 🔵：与其他 handler 一致
        const found = findSession(params)
        if (!found.error) {
          // Abort any in-flight turn first — the client is gone, the agent must
          // stop consuming LLM tokens and emitting notifications.
          found.session.cancel()
          sessions.delete(String(params.sessionId))
          log(`session ${params.sessionId} closed by client`)
        }
        return {}
      },

      // ─── M3: persisted slots (thincoder session archive) + config options ───

      "session/list": () => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const slots = listSlots(getCwd())
        return {
          sessions: slots.map((s) => ({
            id: String(s.slot),
            cwd: getCwd(), // single-cwd model (design §4.5)
            updatedAt: s.updatedAt ?? 0,
            title: s.title ?? "",
            messageCount: s.messageCount ?? 0,
          })),
        }
      },

      "session/load": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const slot = Number(params.sessionId)
        if (!Number.isInteger(slot) || slot < 1) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `invalid session id: ${params.sessionId}` } }
        }
        const data = loadSlotFile(getCwd(), slot)
        if (!data) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `session ${slot} not found (corrupt or deleted)` } }
        }
        try {
          const id = String(nextId++)
          const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
          applySession(session.agent, data)
          // 2026-08-31 advisor round2 🟡：钉 _slot 前查活主——目标槽被另一活进程（CLI/另一
          // IDE）占用时不得钉回（双方 sessionStart 一致 → F2 永不轮转 → 同槽 last-write-wins
          // 静默互覆盖）。空闲则认领后钉回；占用则不钉 → 下次保存经 activeSlot 自然 fork
          // 到新槽（与 switchToSlot 的"占用则 fork"语义对齐）。
          const occ = slotOccupancy(getCwd(), slot)
          // 2026-09-01 会诊 kimi/glm 🔴：同进程双会话同槽——slotOccupancy 排除本进程属主后，
          // 同进程防护完全由 sameProcessPinned 承担：本进程另一 session 已钉该槽即视为占用
          // （进程级属主无法区分 agent，双方 sessionStart 相同 → F2 永不触发 → 静默互覆盖）。
          const sameProcessPinned = [...sessions.values()].some((s) => s.agent?._slot === slot)
          if (!occ.occupied && !sameProcessPinned) {
            const m = loadManifest(getCwd())
            m.slotSessions ??= {}
            m.slotSessions[slot] = getSessionId()
            saveManifest(getCwd(), m)
            session.agent._slot = slot
          } else {
            // 2026-09-01 advisor 🔴：占用时显式分配全新槽（fork）——原 `_slot = null` 的
            // fork 会经 saveSession → activeSlot → ensureActive 分支1 早退（slotSessions
            // [active] === mySessionId 同进程恒真）落回同进程 active 槽 → 两会话写同一槽
            // 静默互覆盖。newSession 跳过活认领号/现存文件号，必定落到新槽。
            session.agent._slot = newSession(getCwd())
          }
          sessions.set(id, session)
          // Replay the human line (role → chunk mapping, design §4.5) so the
          // client renders the restored conversation.
          replayHistory({ sessionId: id, notify: notifyRef.current, history: data.history, log })
          log(`session ${slot} loaded as session ${id} (${data.history?.length ?? 0} messages replayed)${occ.occupied || sameProcessPinned ? ` — slot busy, forked to ${session.agent._slot}` : ""}`)
          return { id, cwd: getCwd(), configOptions: [{ configId: "model" }, { configId: "thinking" }, { configId: "mode" }] }
        } catch (e) {
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to load session ${slot}: ${e.message}` } }
        }
      },

      "session/resume": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const slot = Number(params.sessionId)
        if (!Number.isInteger(slot) || slot < 1) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `invalid session id: ${params.sessionId}` } }
        }
        const data = loadSlotFile(getCwd(), slot)
        if (!data) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `session ${slot} not found (corrupt or deleted)` } }
        }
        try {
          const id = String(nextId++)
          const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
          applySession(session.agent, data)
          // 2026-08-31 advisor round2 🟡：同 session/load——活主占用的槽不钉回（防同槽双写，
          // 下次保存 fork 新槽）；空闲则认领后钉回。
          const occ = slotOccupancy(getCwd(), slot)
          // 2026-09-01 会诊 kimi/glm 🔴：同 session/load——同进程其他 session 已钉同槽视为占用 → fork
          const sameProcessPinned = [...sessions.values()].some((s) => s.agent?._slot === slot)
          if (!occ.occupied && !sameProcessPinned) {
            const m = loadManifest(getCwd())
            m.slotSessions ??= {}
            m.slotSessions[slot] = getSessionId()
            saveManifest(getCwd(), m)
            session.agent._slot = slot
          } else {
            // 2026-09-01 advisor 🔴：同 load——显式 newSession fork（_slot=null 的 fork 会
            // 落回同进程 active 槽 → 两会话写同一槽静默互覆盖）
            session.agent._slot = newSession(getCwd())
          }
          sessions.set(id, session)
          // resume: no history replay — the client keeps its own rendering.
          log(`session ${slot} resumed as session ${id} (no replay)${occ.occupied || sameProcessPinned ? ` — slot busy, forked to ${session.agent._slot}` : ""}`)
          return { id, cwd: getCwd(), configOptions: [{ configId: "model" }, { configId: "thinking" }, { configId: "mode" }] }
        } catch (e) {
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to resume session ${slot}: ${e.message}` } }
        }
      },

      "session/delete": (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const slot = Number(params.sessionId)
        if (!Number.isInteger(slot) || slot < 1) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `invalid session id: ${params.sessionId}` } }
        }
        // Only the persisted archive is removed; an active in-memory session
        // with the same id keeps running (design §4.5).
        if (!deleteSlot(getCwd(), slot)) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `session ${slot} not found` } }
        }
        // 2026-08-31 会诊 deepseek 🟡：被删槽的在存会话 _slot 仍钉着 → 下次保存会重建
        // 文件并重注册（删后复活）。清空其 _slot，下次保存重新认领新槽。
        // 2026-09-01 advisor round2 🔴：不能清 _slot 等下次保存——saveSession 走
        // activeSlot → ensureActive 分支1 早退（slotSessions[active] === mySessionId 同
        // 进程恒真）→ 落回同进程 active 槽（另一在存会话的槽）→ 两会话写同一槽静默
        // 互覆盖（sessionStart 均 null → F2 永不轮转）。与 load/resume 同型修复：
        // 立即 newSession 钉全新槽（跳过活认领号/现存文件号）。
        for (const s of sessions.values()) {
          if (s.agent?._slot === slot) s.agent._slot = newSession(getCwd())
        }
        log(`session ${slot} archive deleted`)
        return {}
      },

      "session/set_config_option": (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const found = findSession(params)
        if (found.error) return found
        const { configId, value } = params
        if (!configId || value === undefined) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "set_config_option requires configId and value" } }
        }
        const applied = applyConfigOption(found.session.agent, configId, value)
        if (!applied) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `unknown configId: ${configId}` } }
        }
        // Last-write-wins on the internal state; notify the client of the change.
        notifyRef.current("session/update", {
          sessionId: String(params.sessionId),
          update: { sessionUpdate: "config_option_update", configId, value },
        })
        return {}
      },

      "session/set_mode": (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const found = findSession(params)
        if (found.error) return found
        if (params.mode !== "plan" && params.mode !== "normal") {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "mode must be plan or normal" } }
        }
        found.session.agent.planMode = params.mode === "plan"
        notifyRef.current("session/update", {
          sessionId: String(params.sessionId),
          update: { sessionUpdate: "current_mode_update", mode: params.mode },
        })
        return {}
      },

      // ─── M5-pull-forward: checkpoints (desktop proposal ②) + memory (③) ───
      // Checkpoints are cwd-scoped (same store the TUI git tool uses); non-git cwds
      // now snapshot by full-directory copy instead of returning null.

      "checkpoint/create": async () => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const cp = await createCheckpoint(getCwd())
        if (!cp) return { error: { ...ACP_ERRORS.INTERNAL, message: "checkpoint creation failed" } }
        return { checkpoint: { id: cp.id, time: cp.time, files: cp.files, git: isGitRepo(getCwd()) } }
      },

      "checkpoint/list": async () => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const cps = await listCheckpoints(getCwd())
        return { checkpoints: cps.map((c) => ({ id: c.id, time: c.time, files: (c.tracked?.length ?? 0) + (c.untracked?.length ?? 0), trackedCount: c.tracked?.length ?? 0, untrackedCount: c.untracked?.length ?? 0 })) }
      },

      "checkpoint/restore": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
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
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const mem = ensureAcpMemory()
        if (!mem) return { error: { ...ACP_ERRORS.INTERNAL, message: "memory unavailable" } }
        const entries = await memList(mem, { type: params.type })
        return { entries: entries.map((e) => ({ id: e.id, type: e.type, title: e.title, tags: e.tags ?? "", updatedAt: e.updatedAt ?? null })) }
      },

      "memory/remove": async (params) => {
        if (!authenticated) return { error: ACP_ERRORS.AUTH_REQUIRED }
        const id = Number(params.id)
        if (!Number.isInteger(id) || id < 1) {
          return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `memory/remove requires a numeric id (got ${params.id})` } }
        }
        const mem = ensureAcpMemory()
        if (!mem) return { error: { ...ACP_ERRORS.INTERNAL, message: "memory unavailable" } }
        const ok = await memRemove(mem, id)
        return ok ? { removed: id } : { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `no memory entry #${id}` } }
      },
    },
    sessions,
    notifyRef,
    requestRef,
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

/** `thincoder acp` — start the server and block until the client closes the pipe. */
export async function runAcpServer() {
  const log = (...a) => process.stderr.write(a.join(" ") + "\n")
  // Build handlers first, then wire the transport — no window where requests
  // hit an empty handler map. notifyRef/requestRef become live with the server.
  const built = buildAcpHandlers({ log })
  const server = createAcpServer(built.handlers, { log })
  built.notifyRef.current = server.notify
  built.requestRef.current = server.request
  log(`[acp] thincoder ${VERSION} — ACP v1 over stdio, waiting for initialize`)
  server.start()
}
