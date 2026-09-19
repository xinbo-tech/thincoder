/**
 * handlers-session.mjs — in-memory ACP session family (ACP-CLIENT.md §3.5):
 * `session/{new,prompt,cancel,close,set_mode,set_config_option}` + `findSession` /
 * `applyConfigOption` + the shared credential gate consumed by every gated handler
 * across the four handler modules (§11.5).
 *
 * 认证门 = **凭据状态即时判据**（§11.2 改法① / D15——撤 `authenticated` 闩锁）：
 * 受门 handler 首行求值，真 ⇒ 放行、假 ⇒ `-32000`。客户端可以不调 `authenticate`
 * （契约逐字「**May** return an `auth_required` error … **if** the agent requires
 * authentication」）。
 */
import { resolve } from "node:path"
import { normalizeCwd, bindRecordStore, newSession, slotPath } from "@thincoder/core/session.mjs"
import { ACP_ERRORS } from "./transport.mjs"

/** Session-level config options exposed to clients — schema `SessionConfigOption.required = ["id","name"]`
 *  (响应侧用 `id`；请求侧 `SetSessionConfigOptionRequest` 用 `configId`——不对称属契约本身 · §11.3 G2-8). */
export const CONFIG_OPTIONS = [
  { id: "model", name: "Model" },
  { id: "thinking", name: "Thinking" },
  { id: "mode", name: "Mode" },
]

/**
 * Credential gate (§11.5 判据拆分 · 评审 #1). Evaluated per call — **no cross-call latch**.
 * `isConfigured()` (boolean, same injection point as before) decides pass/deny; the sister
 * probe `providerStatus()` → `{ ok, keyPresent, reason }` only picks the actionable message
 * for a deny (it distinguishes "no key" from "key present but defaultModel unresolvable"):
 *   ① `keyPresent === false`  ⇒ point at providers[].apiKey + `thincoder acp --login` (no reason glued in);
 *   ② `keyPresent && !ok`     ⇒ name the reason verbatim — `defaultModelReason` 逐字含 "defaultModel"
 *                               (§11.5: ② 必点名 `defaultModel`) + the same recovery paths.
 * @param {{ isConfigured: () => boolean, providerStatus: () => { ok?: boolean, keyPresent?: boolean, reason?: string } }} deps
 * @returns {() => { error?: object }} `{}` ⇒ the call may proceed.
 */
export function createRequireConfigured({ isConfigured, providerStatus }) {
  return () => {
    if (isConfigured()) return {}
    let st = {}
    try { st = providerStatus() ?? {} } catch { st = {} }
    if (st.keyPresent !== true) {
      return {
        error: {
          ...ACP_ERRORS.AUTH_REQUIRED,
          message: `no provider API key configured — set providers[].apiKey in ~/.thincoder/config.json, or run "thincoder acp --login"`,
        },
      }
    }
    return {
      error: {
        ...ACP_ERRORS.AUTH_REQUIRED,
        message: `credentials present but the session cannot be assembled: ${st.reason ?? "unknown provider reason"} (fix via /config → 默认模型, or run "thincoder acp --login")`,
      },
    }
  }
}

/**
 * Apply a session-level config option to the agent instance (memory only —
 * the session's own runtime state, last-write-wins; not persisted to config.json).
 * Returns true when the configId is known.
 */
export function applyConfigOption(agent, configId, value) {
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

/**
 * Build the in-memory session family. Shared state arrives via the single `ctx`
 * (§3.5 — `{ getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession,
 * requireConfigured, log }`), so the id allocator and the slot family stay on one
 * namespace.
 */
export function createSessionHandlers(ctx) {
  const { getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession, requireConfigured, log } = ctx

  const findSession = (params) => {
    const s = sessions.get(String(params?.sessionId))
    if (!s) return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `unknown session ${params?.sessionId}` } }
    return { session: s }
  }

  return {
    "session/new": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      if (params.cwd !== undefined && typeof params.cwd !== "string") {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "cwd must be a string" } }
      }
      // Normalized comparison: resolve() collapses trailing slashes, and
      // normalizeCwd().toLowerCase() makes the check case-insensitive on
      // Windows (drive letter + path — a client sending "c:\\users\\…" vs
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
        const id = allocSessionId()
        const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
        // §11.5 装配后检查（兜底，与门互补）：门拦「key 缺失 / defaultModel 不可解析」；
        // 本行拦「门放行但 provider 仍不可用」的残余（如 defaultModel 可解析而 provider 缺
        // baseURL）——显式报错而**不建半死会话**（槽未认领、sessions 未登记——无半态）。
        if (session?.agent?._providerInvalid) {
          return {
            error: {
              ...ACP_ERRORS.AUTH_REQUIRED,
              message: `session cannot be assembled: ${session.agent._providerInvalidReason ?? "provider unavailable"} (fix via /config → 默认模型, or run "thincoder acp --login")`,
            },
          }
        }
        // `id` is immutable after construction (baked into the callbacks) — never reassign.
        // 2026-09-01 会诊 kimi/glm 🔴：立即认领独立槽（对齐 cmd-new）——否则首回合保存
        // 走 _slot ??= activeSlot() → ensureActive 早退分支（slotSessions[active]===
        // mySessionId 同进程恒真）→ 第二个会话拿到与第一个相同的槽号 → 双写同槽
        // F2 互旋。getSessionId() 是进程级，_slot 是 agent 级——粒度错配必须在此切断。
        session.agent._slot = await newSession(getCwd())
        // TUI-OOM-ROOTCAUSE（SESSION.md §14.3.4）：新建槽绑定记录存储（baseHistory 空——
        // identity 待固化）——与 /new 同语义
        bindRecordStore(session.agent, { slotFile: slotPath(getCwd(), session.agent._slot), identity: session.agent._sessionStart ?? null, baseHistory: [] })
        sessions.set(id, session)
        // §11.3 G2-5：NewSessionResponse.required = ["sessionId"]（`id` / `configId` 键已收正）
        return { sessionId: id, configOptions: [...CONFIG_OPTIONS] }
      } catch (e) {
        return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to create session: ${e.message}` } }
      }
    },

    "session/prompt": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const found = findSession(params)
      if (found.error) return found
      // §11.3 G2-6：PromptRequest.required = ["sessionId","prompt"]（`prompt` = ContentBlock[]）——
      // 读取位置由 `params.content` 收正为 `params.prompt`；取块策略不变（首个 text 块——G6 登记项）。
      const blocks = Array.isArray(params?.prompt) ? params.prompt : []
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
      const gate = requireConfigured()
      if (gate.error) return gate
      const found = findSession(params)
      if (found.error) return found
      found.session.cancel()
      return {}
    },

    "session/close": (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      // 未知会话静默返回 `{}`（既有语义，本批零改——会话族其余方法返 `unknown session`）。
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

    "session/set_config_option": (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
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
      const gate = requireConfigured()
      if (gate.error) return gate
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
  }
}
