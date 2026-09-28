/**
 * subagent-face.mjs — 宿主**子 agent 面**（R3b · D20）：`subagent:stop` 出口 + 存活投影**起 / 停 / 清点**。
 * 自 `agent-host.mjs` 拆出（**档名实施批定**——设计 `docs/render-core/design/RENDER-CORE.md` §8 R3b 行
 * 「桌面右列 = 子 agent 面（D20）… 宿主存活投影 + 2s 拍体（档名实施批定 ∥ 附 `agent-host.mjs`——起 / 停 / 清点）」；
 * 行数触发线 = 300——`agent-host.mjs` R3a 末态 288，两职责同档必越线 ⇒ 出档）。单源面：
 *  ① `subagent:stop`（`docs/desktop/design/IPC.md` §2 该行）= 转核既有取消出口（异步族 = 核
 *     `executeCancelAction`／同步族 = 核 `cancelSyncChild`——先例 = 扩展端 `panel-messages-turn.mjs`
 *     `handleCancelSubagent`；**零算法副本**）；
 *  ② 存活投影（出生自愈）= 拍体逐键调桥面挂点 `reassertLive`（只发在飞实例；语义单源 =
 *     `docs/render-core/design/RENDER-CORE.md` §5「存活投影变体」）。
 * **R6 上提随动（处理流批 · 2026-09-28）**：拍机制（拍间隔 ∕ 起 ∕ 停 ∕ 幂等 ∕ 清点）单源 = 核件
 * `@thincoder/core/agent/live-beat.mjs`（上提源 = VSC `panel-messages.mjs:45` `:50` `:62-75`；
 * `setInterval` ∕ `unref` 注入缝在核）——端档零本地拍间隔 ∕ 零本地定时器；只留端面 = 拍体
 * （`reassertLive` 桥接键集）+ `subagent:stop`。
 * 清点语义（设计 = 「会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清」）：拍体只枚举**装配表在场键**（`agents`）——
 *  `dispose(key)` 摘表即出拍（旧会话块不随拍重投——沿 `thincoder-vscode/src/extension/panel-session.mjs:123-126`
 * 「心跳源新鲜度」清点口径）；停拍 = 宿主退出面（`stopHeartbeat`）。
 * 依赖面 = 注入 + 核件（零宿主依赖 ⇒ 平 node 直测）：`agents`（装配表）· `bridge(key)`（回调桥——投影投递
 * 与 queued 取消的 `⟦ev⟧cancelled` 转口两用）。
 */
import { LIVE_HEARTBEAT_MS, createLiveBeat } from "@thincoder/core/agent/live-beat.mjs"
import { getAsyncPool } from "@thincoder/core/agent-tools/async-settle.mjs"
import { cancelSyncChild, executeCancelAction } from "@thincoder/core/agent-tools/subagent-async.mjs"
import { slotOfKey } from "./session-slots.mjs"

/** 出生自愈拍体周期（re-export 核件单源 —— 值同源 = VSC `panel-messages.mjs:45` `LIVE_HEARTBEAT_MS`）。 */
export { LIVE_HEARTBEAT_MS }

/** 子 agent 面（装配期一次）：`agents` = 宿主装配表（键 → agent）· `bridge(key)` = 回调桥取值面。
 *  返回 `{ stopSubagent, heartbeatBeat, startHeartbeat, stopHeartbeat }`（宿主面展开）。 */
export function createSubagentFace({ agents, bridge }) {
  /** 拍体：逐键（装配表）存活再断言——桥面挂点 `reassertLive`（只发在飞实例）；返回本拍投递总条数
   *  （测试直驱面 · 清点读数）。**清点** = `dispose(key)` 摘装配表 ⇒ 该键不再入拍。 */
  function heartbeatBeat() {
    let count = 0
    for (const [key, agent] of agents) count += bridge(key).reassertLive(agent)
    return count
  }

  /** 拍机制（间隔 ∕ 起 ∕ 停 ∕ 幂等 —— 核件单源）：起拍幂等（同句柄单拍）；`unref` 不阻进程退出在核落。 */
  const liveBeat = createLiveBeat({ beat: heartbeatBeat })

  /** 起拍（幂等 · 装配期即起——无在飞实例时拍体零投）。 */
  function startHeartbeat() { return liveBeat.start() }

  /** 停拍（宿主退出面；未起拍 ⇒ 零动作）。 */
  function stopHeartbeat() { liveBeat.stop() }

  /** `subagent:stop`（`docs/desktop/design/IPC.md` §2 该行 · D20 停止出口）：载荷 `{ key, id, role? }` —— 转核
   *  既有取消出口（同步族 = 核 `_syncChildAborts` registry 命中〔键 = `role#id`〕⇒ `cancelSyncChild`；异步族 =
   *  池条目在飞 ⇒ `executeCancelAction`——与工具 `action:'cancel'` 同实现路径 · 含 advisor 池 fallback；
   *  queued 取消的 `⟦ev⟧cancelled` 经本键桥面 ⇒ `ev:subagent`）。
   *  回执 `{ ok, reason }`：reason 闭集 = `unknown-sub`（表外 id ∥ 该实例不在飞）· `bad-key`（键不合规）。
   *  **零乐观写**：块折叠随事件面（`⟦ev⟧stopped` / `⟦ev⟧cancelled` —— 本面只发起取消）。 */
  function stopSubagent(key, id, role) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const agent = agents.get(key)
    if (!agent) return { ok: false, reason: "unknown-sub" }
    const subId = id === undefined || id === null || String(id) === "" ? null : String(id)
    if (subId === null) return { ok: false, reason: "unknown-sub" }
    // 同步族：registry 命中（键 = relay 前缀去尾 `role#id` —— 核 `agent-tools/subagent.mjs:78` 写点）
    if (typeof role === "string" && role !== "" && agent._syncChildAborts?.has(`${role}#${subId}`)) {
      const result = cancelSyncChild(agent, `${role}#${subId}`)
      return result.status === "cancelled" ? { ok: true, reason: null } : { ok: false, reason: "unknown-sub" }
    }
    // 异步族：池条目在飞（advisor 池 fallback 在核执行器内；已终态条目 ⇒ 不在飞）
    const entry = getAsyncPool(agent, "subagent")?.get(subId) ?? getAsyncPool(agent, "advisor")?.get(subId)
    if (!entry || entry.done === true) return { ok: false, reason: "unknown-sub" }
    let result = null
    try {
      result = JSON.parse(executeCancelAction({ id: subId }, {
        agent, depth: 0, callbacks: { onToken: (token) => bridge(key).onToken(token) },
      }))
    } catch (error) {
      console.error("[subagent-face] stop: cancel result unparsable:", error)
    }
    return result?.status === "cancelled" ? { ok: true, reason: null } : { ok: false, reason: "unknown-sub" }
  }

  return { stopSubagent, heartbeatBeat, startHeartbeat, stopHeartbeat }
}
