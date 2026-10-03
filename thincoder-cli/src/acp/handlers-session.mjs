/**
 * handlers-session.mjs — in-memory ACP session family (ACP-CLIENT.md §3.5):
 * `session/{new,prompt,cancel,close,set_mode,set_config_option}` + `findSession` /
 * `applyConfigOption` / `sessionConfigOptions`（configOptions 全形投影单源——四响应 + 两通知）/
 * `createSlotReleaser`（认领释放单点——close ∥ load/resume 替换同源）+ the shared credential
 * gate consumed by every gated handler across the four handler modules (§11.5).
 *
 * 认证门 = **凭据状态即时判据**（§11.2 改法① / D15——撤 `authenticated` 闩锁）：
 * 受门 handler 首行求值，真 ⇒ 放行、假 ⇒ `-32000`。客户端可以不调 `authenticate`
 * （契约逐字「**May** return an `auth_required` error … **if** the agent requires
 * authentication」）。
 *
 * #168①（2026-09-22 · SESSION.md §6.15 / §6.16）：`session/close` 入释放面——关闭会话 ⇒
 * 释放该会话认领（保留集 = 本进程其余在存会话的活绑定槽，同 cwd；落盘判据三条沿用）。
 */
import { resolve } from "node:path"
import { loadManifest, normalizeCwd, bindRecordStore, deleteSlot, newSession, saveManifest, slotPath } from "@thincoder/core/session.mjs"
// 认领释放谓词单源（SESSION.md §6.2 / §6.16——与 VSC 端壳 `releaseClaimsAll` 同源档；
// core `session.mjs` 未 re-export 该名——直引 manifest 档，先例 = `thincoder-vscode/src/extension/session-io.mjs`）。
import { staleClaims } from "@thincoder/core/session-slots-manifest.mjs"
import { PLAN_ENGINEERING_REFUSED } from "@thincoder/core/agent-tools/plan.mjs"
// #363①（off 形族单源——MODEL-SPECS.md §16.2）：thinking 开关的取形引核（本档零副本）。
import { thinkOffShape } from "@thincoder/core/think-off.mjs"
import { providerSpec } from "@thincoder/core/config.mjs"
import { ACP_ERRORS } from "./transport.mjs"
// §2.5（ACP-PROTOCOL-COMPLIANCE）：prompt 内容块聚合（resource_link 内联 ∥ 降级标记——基线 MUST）。
import { buildPromptText } from "./resource-link.mjs"

/** ENG-PLAN-EXCLUSION（FR31 ② · E7「命令面逐面钉定」）：工程真值 = 核单源同键
 *  `agent.config.agent.engineering`。 */
const isEngineering = (agent) => agent?.config?.agent?.engineering === true

/** configOptions 全形单源投影（§2.3——四处响应 + 两处通知同源）：`SessionConfigOption` =
 *  `required [id,name]` + oneOf select/boolean 判别键 `type`（select 另需 `currentValue` + `options[]`；
 *  boolean 需 `currentValue`）；带**现值**投影（静态常量不可——`currentValue` 就地失真）。
 *  `model` 项在模型不可解析时**缺席**（`currentValue` 必填——无值不可虚构）；`thinking` 现值 =
 *  「非 off 形」（off 两形 = `null`（effort 族）∥ `{type:"disabled"}`；含自定义开值族——
 *  §11 语义登记：`undefined`（未显式设置）⇒ `false`，不发服务端生效态探测）；数组序 =
 *  model（在位时）→ thinking → mode。 */
export function sessionConfigOptions(agent) {
  const opts = []
  const model = agent?.provider?.model
  if (typeof model === "string" && model) {
    const provider = agent?.provider?.name
    const value = provider ? `${provider}:${model}` : model
    opts.push({ id: "model", name: "Model", type: "select", currentValue: value, options: [{ value, name: value }] })
  }
  const th = agent?.provider?.thinking
  opts.push({ id: "thinking", name: "Thinking", type: "boolean", currentValue: th != null && th.type !== "disabled" })
  opts.push({ id: "mode", name: "Mode", type: "select", currentValue: agent?.planMode ? "plan" : "normal",
    options: [{ value: "normal", name: "Normal" }, { value: "plan", name: "Plan" }] })
  return opts
}

/** 认领释放单点（§2.4 提取；#168① 公式——SESSION.md §6.15 / §6.16 · 2026-09-22 定裁）：
 *  释放 A ⟺ `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`；**保留集 = 本进程其余在存会话的活
 *  绑定槽**（同 cwd——ACP 单 cwd 模型）。取值点：会话记录容器 = `ctx.sessions`
 *  （`Map<id, session>`——`thincoder-cli/src/acp.mjs` 单容器）；槽值 = `session.agent._slot`
 *  （认领写入同源 = `handlers-slots.mjs` load/resume 钉槽 / 本档 `session/new` 认领点）。
 *  调用点三处同源消费 = close ∥ load 替换 ∥ resume 替换（`acp.mjs` 建一次入
 *  `ctx.releaseClosedSlot`——同 `requireConfigured` 先例）。落盘判据三条由核 `saveManifest`
 *  `opts.release` 自动继承（fresh 同次快照 / 值条件删除 / 内存认领表移除）——**零新增写盘
 *  路径**；本进程无残留认领 ⇒ 零写早退（判据单源 `staleClaims`——同核 `releaseClaimsAll` 早退形）。 */
export function createSlotReleaser({ getCwd, sessions }) {
  return () => {
    const cwd = getCwd()
    const m = loadManifest(cwd)
    const keep = [...sessions.values()].map((s) => s.agent?._slot).filter((slot) => slot != null)
    if (staleClaims(m, keep).length === 0) return
    saveManifest(cwd, m, null, { release: keep })
  }
}

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
      // off 取形 = 核单源（MODEL-SPECS.md §16.2——#363①）：effort 族 ⇒ `null`（载荷门据其补发
      // `reasoning_effort:"none"` = 唯一有效 off 路径）；其余族 ⇒ `{ type:"disabled" }`。旧形
      // 全族一形 `{type:"disabled"}` 在 effort 族被载荷层 falsy 跳过 ⇒ 关思考静默失效。
      // on 侧同引核（thinkEnabledValue——自定义开值族 MiniMax = "adaptive"）。
      const spec = providerSpec(agent.provider)
      agent.provider.thinking = value ? { type: spec.thinkEnabledValue ?? "enabled" } : thinkOffShape(spec)
      // effort 族：`null` 标记在载荷层由「无显式档」门控（provider/core.mjs:193 显式档优先会
      // 跳过标记）⇒ off 清档位（与 CLI `/think off` 同法——cmd-think.mjs `applyThink` off 支）。
      if (!value) delete agent.provider.reasoningEffort
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
 * (§3.5 — `{ getCwd, sessions, notifyRef, requestRef, createSession, requireConfigured,
 * releaseClosedSlot, log }`)；会话 id = 持久槽位号串（load/new 同命名空间——G5 收正）。
 */
export function createSessionHandlers(ctx) {
  const { getCwd, sessions, notifyRef, requestRef, createSession, requireConfigured, releaseClosedSlot, log } = ctx

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
      // §2.4（G5 收正）：**先认领持久槽**——`createSession` 的 id 在构造期烧入 callbacks，
      // 而 id = 槽号串（`String(slot)`——全族单一命名空间），故认领必须先于装配。
      // 失败回滚（新序引入的孤儿面——必处置）：装配抛错 ∥ `_providerInvalid` ⇒ `deleteSlot`
      // （文件 + manifest 条目 + 认领由核单点清理）；`committed` 旗标守卫——`sessions.set`
      // 之后不回滚（在存会话的槽不因尾段异常被误删）。
      let slot = null
      let committed = false
      try {
        slot = await newSession(getCwd())
        const id = String(slot)
        const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
        // §11.5 装配后检查（兜底，与门互补）：门拦「key 缺失 / defaultModel 不可解析」；
        // 本行拦「门放行但 provider 仍不可用」的残余（如 defaultModel 可解析而 provider 缺
        // baseURL）——显式报错而**不建半死会话**（槽已认领 ⇒ 由 finally 回滚撤除——无半态）。
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
        session.agent._slot = slot
        // TUI-OOM-ROOTCAUSE（SESSION.md §6.14）：新建槽绑定记录存储（baseHistory 空——
        // identity 待固化）——与 /new 同语义
        bindRecordStore(session.agent, { slotFile: slotPath(getCwd(), session.agent._slot), identity: session.agent._sessionStart ?? null, baseHistory: [] })
        sessions.set(id, session)
        committed = true
        // §11.3 G2-5：NewSessionResponse.required = ["sessionId"]（`id` / `configId` 键已收正）；
        // configOptions = 全形（§2.3 单源投影）。
        return { sessionId: id, configOptions: sessionConfigOptions(session.agent) }
      } catch (e) {
        return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to create session: ${e.message}` } }
      } finally {
        if (slot != null && !committed) {
          try { deleteSlot(getCwd(), slot) }
          catch (e) { log(`[acp] failed to roll back slot ${slot} after a failed session/new: ${e.message}`) }
        }
      }
    },

    "session/prompt": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const found = findSession(params)
      if (found.error) return found
      // §11.3 G2-6：PromptRequest.required = ["sessionId","prompt"]（`prompt` = ContentBlock[]）
      // ——读取位置由 `params.content` 收正为 `params.prompt`；§2.5：首个**合法** text 块 +
      // resource_link 内联（基线 MUST——逐块失败降级不中断，标记内联）。
      const blocks = Array.isArray(params?.prompt) ? params.prompt : []
      const text = await buildPromptText(blocks, { cwd: getCwd() })
      if (!text) return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "prompt requires a text or resource_link content block" } }
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
        // 先出容器再释放（保留集 = 其余在存会话——被关闭者不留在保留集内）。
        sessions.delete(String(params.sessionId))
        releaseClosedSlot() // #168①：释放该会话认领（保留集 = 同 cwd 其余在存会话槽）
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
      // ENG-PLAN-EXCLUSION（FR31 ② / 评审轮 1 发现 #4 出口钉定）：工程模式 ⇒ plan 面**前置判**
      // ⇒ 携共用文案的 INVALID_PARAMS。`applyConfigOption` 布尔契约零改（`false` 仍 = unknown
      // configId——工程拒绝不经该路径，下方 `:unknown configId` 误导文案对 mode=plan 不再可达）；
      // `mode:"normal"` 照常接受（唯一合法态，幂等）。
      if (configId === "mode" && value === "plan" && isEngineering(found.session.agent)) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: PLAN_ENGINEERING_REFUSED } }
      }
      const applied = applyConfigOption(found.session.agent, configId, value)
      if (!applied) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `unknown configId: ${configId}` } }
      }
      // Last-write-wins on the internal state；§2.4：通知 = `ConfigOptionUpdate.required =
      // ["configOptions"]`——**全量数组**（非增量 `{configId,value}`）；响应同源全形（§2.3）。
      notifyRef.current("session/update", {
        sessionId: String(params.sessionId),
        update: { sessionUpdate: "config_option_update", configOptions: sessionConfigOptions(found.session.agent) },
      })
      return { configOptions: sessionConfigOptions(found.session.agent) }
    },

    "session/set_mode": (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const found = findSession(params)
      if (found.error) return found
      if (params.mode !== "plan" && params.mode !== "normal") {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "mode must be plan or normal" } }
      }
      // ENG-PLAN-EXCLUSION（FR31 ② / 同 #4）：工程模式 + `mode:"plan"` ⇒ 前置判 ⇒ 携共用文案
      // 的 INVALID_PARAMS（状态零变、零通知）；`normal` 照常（幂等）。
      if (params.mode === "plan" && isEngineering(found.session.agent)) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: PLAN_ENGINEERING_REFUSED } }
      }
      found.session.agent.planMode = params.mode === "plan"
      // §2.4：`CurrentModeUpdate.required = ["currentModeId"]`（`mode` 键与 schema 相抵——字段收正）。
      notifyRef.current("session/update", {
        sessionId: String(params.sessionId),
        update: { sessionUpdate: "current_mode_update", currentModeId: params.mode },
      })
      return {}
    },
  }
}
