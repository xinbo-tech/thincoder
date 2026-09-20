/**
 * handlers-slots.mjs — persisted-slot family (ACP-CLIENT.md §3.5 · §11.3):
 * `session/{list,load,resume,delete}` + the #41 engineering-manifest predicate
 * helpers (`slotEngineering` / `reattach`).
 *
 * id 命名空间边界（§11.3 · 评审 #7——本批只改字段名、不改语义）：本族按**持久化槽位号**
 * 解析 `params.sessionId`（`Number(params.sessionId)`）；而 `session/prompt` / `cancel` /
 * `close` / `set_*` 认的是 **ACP 会话 id**（入口分配器——与槽位号不同物，§6.1）⇒
 * 把 `session/list` 的输出直喂 `session/prompt` 仍会 `unknown session`（原 G5，本批不做）。
 */
import { ACP_ERRORS } from "./transport.mjs"
import { CONFIG_OPTIONS } from "./handlers-session.mjs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { resolveEngineeringManifest } from "@thincoder/core/manifest.mjs"
import { replayHistory } from "./bridge.mjs"
import { listSlots, applySession, deleteSlot, loadSlotFile, slotOccupancy, loadManifest, saveManifest, getSessionId, newSession } from "@thincoder/core/session.mjs"

/** Build the persisted-slot family. Shared state arrives via the single `ctx` (§3.5). */
export function createSlotsHandlers(ctx) {
  const { getCwd, sessions, allocSessionId, notifyRef, requestRef, createSession, requireConfigured, log } = ctx

  /** #41 翻转族合值判据（MANIFEST.md §2.8 F3 触发条件口径 = §2.2 会话权威值）：「槽带
   *  `engineering` 字段 ? 槽值 : config 回退」。本路装配期（`applySession` 之前）无会话
   *  agent ⇒ 回退源 = 盘上 config（与装配产物同源：`defaultCreateSession` → `assembleAgent`
   *  → `loadConfig`）。 */
  const slotEngineering = (data) => data?.engineering !== undefined
    ? data.engineering === true
    : (() => { try { return loadConfig().agent?.engineering === true } catch { return false } })()

  /** #41 装载后一行重估（F3 准翻列 / F4）：`applySession` 已按槽订正 config ⇒ 工程模式会话
   *  就地判据（单源）+ 附着——缺档格 `writer:'main'` 建档；非工程模式零动作（零 manifest I/O）。
   *  判据不通过 ⇒ 保持不附着（装载已发生——本行是「装载后订正」位，与入口门槛两分）+ 留痕。 */
  const reattach = (ag) => {
    if (ag?.config?.agent?.engineering !== true) return
    const r = resolveEngineeringManifest(getCwd(), { writer: "main" })
    if (r.ok) ag.manifest = r.manifest
    else log(`[acp] engineering manifest not attached (${r.code}): ${r.message}`)
  }

  return {
    "session/list": () => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const slots = listSlots(getCwd())
      return {
        // §11.3 G2-7：SessionInfo.required = ["sessionId","cwd"]（条目键 `id` 已收正）
        sessions: slots.map((s) => ({
          sessionId: String(s.slot),
          cwd: getCwd(), // single-cwd model (design §4.5)
          updatedAt: s.updatedAt ?? 0,
          title: s.title ?? "",
          messageCount: s.messageCount ?? 0,
        })),
      }
    },

    "session/load": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const slot = Number(params.sessionId)
      if (!Number.isInteger(slot) || slot < 1) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `invalid session id: ${params.sessionId}` } }
      }
      const data = loadSlotFile(getCwd(), slot)
      if (!data) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `session ${slot} not found (corrupt or deleted)` } }
      }
      // 2026-08-31 会诊 deepseek 🟡（搬迁保留）：读槽走 session.mjs 共享 `loadSlotFile`（校验/
      // 保现场/.tmp 回退与主路径一致）——本地实现此前无 .unreadable/.corrupted 保留。
      // #41 先判（F3 合值 / F4 装配期判据）：目标槽合值 === true ⇒ 判据前置于 `createSession`
      // （拒 ⇒ 走既有 ACP 错误通道、**不建会话**——无半态）；准 ⇒ 既有装载 + 下方重估。
      if (slotEngineering(data)) {
        const r = resolveEngineeringManifest(getCwd(), { writer: "main" })
        if (!r.ok) {
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to load session ${slot}: ${r.message}` } }
        }
      }
      try {
        const id = allocSessionId()
        const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
        // 2026-08-31 advisor round2 🟡：钉 _slot 前查活主——目标槽被另一活进程（CLI/另一
        // IDE）占用时不得钉回（双方 sessionStart 一致 → F2 永不轮转 → 同槽 last-write-wins
        // 静默互覆盖）。空闲则认领后钉回；占用则不钉 → 下次保存经 activeSlot 自然 fork
        // 到新槽（与 switchToSlot 的"占用则 fork"语义对齐）。
        const occ = slotOccupancy(getCwd(), slot)
        // 2026-09-01 会诊 kimi/glm 🔴：同进程双会话同槽——slotOccupancy 排除本进程属主后，
        // 同进程防护完全由 sameProcessPinned 承担：本进程另一 session 已钉该槽即视为占用
        // （进程级属主无法区分 agent，双方 sessionStart 相同 → F2 永不触发 → 静默互覆盖）。
        const sameProcessPinned = [...sessions.values()].some((s) => s.agent?._slot === slot)
        const pinned = !occ.occupied && !sameProcessPinned
        // TUI-OOM-ROOTCAUSE（SESSION.md §6.14）：钉槽（非占用）才绑定记录存储——
        // 占用/fork 分支模式 F（首保存 fork 新槽后补绑）
        applySession(session.agent, data, pinned ? { slot } : {})
        reattach(session.agent)
        if (pinned) {
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
          session.agent._slot = await newSession(getCwd())
        }
        sessions.set(id, session)
        // Replay the human line (role → chunk mapping, design §4.5) so the
        // client renders the restored conversation.
        replayHistory({ sessionId: id, notify: notifyRef.current, history: data.history, log })
        log(`session ${slot} loaded as session ${id} (${data.history?.length ?? 0} messages replayed)${occ.occupied || sameProcessPinned ? ` — slot busy, forked to ${session.agent._slot}` : ""}`)
        // §11.3：load/resume 响应 required = []（`id` / `cwd` 属多余键——同批收敛）
        return { configOptions: [...CONFIG_OPTIONS] }
      } catch (e) {
        return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to load session ${slot}: ${e.message}` } }
      }
    },

    "session/resume": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
      const slot = Number(params.sessionId)
      if (!Number.isInteger(slot) || slot < 1) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `invalid session id: ${params.sessionId}` } }
      }
      const data = loadSlotFile(getCwd(), slot)
      if (!data) {
        return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: `session ${slot} not found (corrupt or deleted)` } }
      }
      // #41 先判（同 session/load——合值判据前置于 `createSession`；拒 ⇒ 不建会话）。
      if (slotEngineering(data)) {
        const r = resolveEngineeringManifest(getCwd(), { writer: "main" })
        if (!r.ok) {
          return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to resume session ${slot}: ${r.message}` } }
        }
      }
      try {
        const id = allocSessionId()
        const session = await createSession({ id, notify: notifyRef.current, request: requestRef.current, log })
        // 2026-08-31 advisor round2 🟡：同 session/load——活主占用的槽不钉回（防同槽双写，
        // 下次保存 fork 新槽）；空闲则认领后钉回。
        const occ = slotOccupancy(getCwd(), slot)
        // 2026-09-01 会诊 kimi/glm 🔴：同 session/load——同进程其他 session 已钉同槽视为占用 → fork
        const sameProcessPinned = [...sessions.values()].some((s) => s.agent?._slot === slot)
        const pinned = !occ.occupied && !sameProcessPinned
        // TUI-OOM-ROOTCAUSE（SESSION.md §6.14）：同 load——钉槽才绑定（占用/fork 模式 F）
        applySession(session.agent, data, pinned ? { slot } : {})
        reattach(session.agent)
        if (pinned) {
          const m = loadManifest(getCwd())
          m.slotSessions ??= {}
          m.slotSessions[slot] = getSessionId()
          saveManifest(getCwd(), m)
          session.agent._slot = slot
        } else {
          // 2026-09-01 advisor 🔴：同 load——显式 newSession fork（_slot=null 的 fork 会
          // 落回同进程 active 槽 → 两会话写同一槽静默互覆盖）
          session.agent._slot = await newSession(getCwd())
        }
        sessions.set(id, session)
        // resume: no history replay — the client keeps its own rendering.
        log(`session ${slot} resumed as session ${id} (no replay)${occ.occupied || sameProcessPinned ? ` — slot busy, forked to ${session.agent._slot}` : ""}`)
        return { configOptions: [...CONFIG_OPTIONS] }
      } catch (e) {
        return { error: { code: ACP_ERRORS.INTERNAL.code, message: `failed to resume session ${slot}: ${e.message}` } }
      }
    },

    "session/delete": async (params) => {
      const gate = requireConfigured()
      if (gate.error) return gate
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
        if (s.agent?._slot === slot) s.agent._slot = await newSession(getCwd())
      }
      log(`session ${slot} archive deleted`)
      return {}
    },
  }
}
