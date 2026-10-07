/**
 * design-slots.mjs — design-token 槽位清点 + 消费核（2026-10-07 批 ledger-tool · 台账 #927 并入）。
 * 设计单源 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（F-SL1 清点面 / F-SL2 批量消费）。
 *
 * 面一 `executeDesignSlotsAction`（`subagent` action `design-slots`——只读）：
 *   数据源 = 槽文件权威表（`readEngTokensFromSlot`——无 TTL 过滤原样）∪ 内存 Map（并集去重，
 *   冲突以槽为准——D-S3 同源）；**零写**（不 reconcile 回写、不落盘）。列表面 = 逐槽一行
 *   （designId ∥ live/expired ∥ ageDays ∥ expiresAt ∥ 批；龄序 = 最老在前）+ 计数尾行；
 *   「批」= `_advisorRuns` 按 designId 命中 run 的 `docSetKey` 中 `batches/` 段档取 basename
 *   （KD-SL2——零新存储；不可得 ⇒ `—`）。
 * 面二 `executeConsumeDesignAction`（`subagent` action `consume-design` 消费核——自
 *   `subagent-spawn.mjs` 迁入）：选择器恰一（`designId` ∥ `designIds` ∥ `expired` ∥
 *   `olderThanDays`——KD-SL3 fail-closed 不猜）；目标集 = 并集视图按选择器解析 → 逐枚移出
 *   （`removeDesignTokenSlot` 同款 token 值守护）→ **单次** `persistEngTokens` 落盘（D-S6 单点）；
 *   落盘失败 ⇒ 内存快照整体回滚 + 抛（KD-SL4——不留半消费态）。单枚形态（designId / 无选择器
 *   单槽）：语义 / 拒文 / 回执**现行逐字不变**。
 *
 * 签发链行为零改（mint / settle / TTL / persist 存储形——#868 面另论）；工程模式父侧（depth-0）限定
 * （门 = 本档两执行器；depth 面由装配与受限变体门承载）。
 */
import { persistEngTokens, readEngTokensFromSlot, reconcileEngTokensFromSlot, removeDesignTokenSlot, tokenExpired, tokenExpiryMs } from "../token-ttl.mjs"
import { effectiveTokenTtlMs } from "./design-token.mjs"
import { advisorRuns } from "./advisor-async.mjs"

const DAY_MS = 86400000

/** 槽并集视图（F-SL1 数据源 / F-SL2 目标集解析）：内存 Map 先行、槽文件权威表覆盖（同 id 冲突以槽
 *  为准——D-S3 同源）；纯读——零回写、零落盘。 */
function unionSlots(agent) {
  const merged = new Map()
  const mem = agent?._engDesignTokens
  if (mem instanceof Map) for (const [id, t] of mem) merged.set(id, t)
  const file = readEngTokensFromSlot(agent)
  if (file) for (const [id, t] of Object.entries(file)) merged.set(id, t)
  return merged
}

/** 「批」列派生（KD-SL2——零新存储）：会话内评审实例注册表 `_advisorRuns` 按 designId 命中的**最新**
 *  run ⇒ `docSetKey`（被审文档绝对路径集 JSON）中 `batches/` 段档取 basename；不可得（跨重启 /
 *  模式重进 / 注册表回收）⇒ `—`（如实降级）。 */
function batchOf(agent, designId) {
  const runs = advisorRuns(agent)
  if (!(runs instanceof Map)) return "—"
  for (const run of [...runs.values()].reverse()) {
    if (run?.designId !== designId || typeof run.docSetKey !== "string") continue
    const name = batchBasename(run.docSetKey)
    if (name) return name
  }
  return "—"
}

/** docSetKey（JSON 串）→ `batches/` 段档 basename（首命中）；不可解析 / 无命中 ⇒ null。 */
function batchBasename(docSetKey) {
  let list = null
  try { list = JSON.parse(docSetKey) } catch { return null }
  if (!Array.isArray(list)) return null
  for (const p of list) {
    if (typeof p !== "string") continue
    const parts = p.split(/[\\/]/)
    const i = parts.lastIndexOf("batches")
    if (i >= 0 && i < parts.length - 1 && parts[i + 1]) return parts[i + 1]
  }
  return null
}

/** 槽事实（清点列与选择器共用）：状态 = `tokenExpired` 单源；`ageDays` = now − (expiresAt −
 *  `effectiveTokenTtlMs`) 派生（TTL 配置曾改时为近似——如实注）；`expiresAt` 精确；畸形 / 格式外
 *  token ⇒ 两项 `—`（不可判龄）。 */
function slotFacts(agent, designId, token, now, ttlMs) {
  const expiry = typeof token === "string" ? tokenExpiryMs(token) : null
  return {
    designId, token,
    expired: typeof token === "string" && tokenExpired(token, now),
    ageDays: expiry === null ? null : (now - (expiry - ttlMs)) / DAY_MS,
    expiresAt: expiry,
    batch: batchOf(agent, designId),
  }
}

/** 龄序比较（最老在前——剩余有效期升序；不可判龄（畸形串）排尾——不冒充最老）。 */
const byOldest = (a, b) => (b.ageDays ?? -Infinity) - (a.ageDays ?? -Infinity)

/**
 * `subagent` action `design-slots`（F-SL1——只读清点面）：工程模式父侧限定（与 consume-design
 * 同门）。输出 = 行文本（逐槽行 + 计数尾行）；字段 / 序 / 降级标记 = 契约，行内措辞 = 实现面。
 * 分类 = 只读（planMode 放行 / 免审批 / digest 放行——谓词在 `agent/dispatch-gates.mjs`）。
 */
export function executeDesignSlotsAction(args, ctx) {
  const parent = ctx?.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — design-slots applies only to engineering-mode design tokens (spawn 同门).")
  }
  const now = Date.now()
  const ttlMs = effectiveTokenTtlMs(parent)
  const entries = [...unionSlots(parent)].map(([id, t]) => slotFacts(parent, id, t, now, ttlMs))
  entries.sort(byOldest)
  const lines = entries.map((e) =>
    `- designId=${e.designId} status=${e.expired ? "expired" : "live"} ageDays=${e.ageDays === null ? "—" : e.ageDays.toFixed(1)} expiresAt=${e.expiresAt === null ? "—" : new Date(e.expiresAt).toISOString()} batch=${e.batch}`)
  const live = entries.filter((e) => !e.expired).length
  lines.push(`design-slots: ${entries.length} slot(s) — ${live} live / ${entries.length - live} expired`)
  return lines.join("\n")
}

/**
 * `subagent` action `consume-design` 消费核（F-SL2；自 `subagent-spawn.mjs` 迁入——2026-10-07）：
 * 选择器恰一——`designId`（现行 · 单枚）∥ `designIds`（显式非空清单）∥ `expired:true`（全部过期项）
 * ∥ `olderThanDays:N`（ageDays > N）；多选择器同给 / 选择器缺失且多槽 ⇒ 拒（fail-closed——不猜）。
 * 单枚形态走 `consumeSingle`（拒文 / 回执逐字不变）；批量走 `consumeBatch`（逐枚行 + `consumed N` 计数行）。
 */
export function executeConsumeDesignAction(args, ctx) {
  const parent = ctx?.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — consume-design applies only to engineering-mode design tokens (spawn 同门).")
  }
  const slots = parent?._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  const designId = args?.designId ? String(args.designId) : undefined
  const selectors = []
  if (designId !== undefined) selectors.push("designId")
  if (args?.designIds !== undefined && args?.designIds !== null) selectors.push("designIds")
  if (args?.expired !== undefined && args?.expired !== null) selectors.push("expired")
  if (args?.olderThanDays !== undefined && args?.olderThanDays !== null) selectors.push("olderThanDays")
  if (selectors.length > 1) {
    throw new Error(`consume-design: pass exactly ONE selector — designId / designIds / expired / olderThanDays (got: ${selectors.join(" + ")}); a batch consume never guesses its target set.`)
  }
  if (selectors.length === 0) {
    // 无选择器 = 单枚兼容形态（现行语义零变）：缺 designId 且多槽 ⇒ 拒（不误消费任一槽）
    if (hasSlots && slots.size > 1) {
      throw new Error(`consume-design: Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design to close out.`)
    }
    return consumeSingle(parent, undefined)
  }
  if (selectors[0] === "designId") return consumeSingle(parent, designId)
  return consumeBatch(parent, selectors[0], args)
}

/** 单枚消费（现行形态逐字保留——读内存槽；未知 / 已消费 ⇒ 幂等 no-op；落盘失败 ⇒ 槽回滚 + 抛）。 */
function consumeSingle(parent, designId) {
  const slots = parent?._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 读槽值：给定 designId → 精确槽（未知/已消费 → undefined）；缺省 → 唯一槽
  let token = null
  if (designId && hasSlots) token = slots.get(designId) ?? null
  else if (!designId && hasSlots) token = [...slots.values()][0]
  // 未知 designId / 已消费 / 无任何槽 → 幂等 no-op 提示（不报错——评审 #3 定死）
  if (!token) {
    return `consume-design: no live slot${designId ? ` for designId ${designId}` : ""} (already consumed or never issued) — idempotent no-op, nothing changed.`
  }
  const slotId = designId ?? [...slots.keys()][0]
  removeDesignTokenSlot(parent, designId, token)
  try {
    persistEngTokens(parent)
  } catch (e) {
    if (slotId) parent._engDesignTokens.set(slotId, token)
    throw new Error(`consume-design: the slot was removed in memory but could NOT be durably deleted from the slot file (${e.message}) — the slot is restored in memory; retry consume-design.`)
  }
  return `design slot consumed — designId ${designId ?? "(single-design session)"} is closed out; a further eng-coder spawn for this design is mechanically rejected, and any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
}

/** 批量消费（F-SL2 / KD-SL3 / KD-SL4）：目标集 = 并集视图按选择器解析；逐枚移出（token 值守护）→
 *  单次 persist；落盘失败 ⇒ 内存快照整体回滚 + 抛。回执 = 逐枚行 + 计数行（`consumed N`）。
 *  落盘前先经 D2 权威表 reconcile（槽 = 权威；未选中的**活**槽因此并入内存、随 persist 保住——
 *  过期项则随本次落盘一并出清，即「落盘携带（如实）」注）。 */
function consumeBatch(parent, selector, args) {
  const now = Date.now()
  const ttlMs = effectiveTokenTtlMs(parent)
  const snapshot = parent._engDesignTokens instanceof Map ? new Map(parent._engDesignTokens) : null
  reconcileEngTokensFromSlot(parent)
  const union = unionSlots(parent)
  const targets = []
  const seen = new Set()
  if (selector === "designIds") {
    if (!Array.isArray(args.designIds) || args.designIds.length === 0) {
      throw new Error("consume-design: designIds must be a non-empty array of design ids — pass an explicit list, or use expired / olderThanDays.")
    }
    for (const raw of args.designIds) {
      const id = typeof raw === "string" ? raw.trim() : ""
      if (!id) throw new Error(`consume-design: designIds entries must be non-empty strings (got ${JSON.stringify(raw)}).`)
      if (seen.has(id)) continue // 重复条目去重（同一 id 只计一次——回执计数不虚增）
      seen.add(id)
      const token = union.get(id) ?? null
      targets.push({ designId: id, token, consumed: token !== null }) // 未知 / 已消费 ⇒ 逐枚 no-op（幂等）
    }
  } else if (selector === "expired") {
    if (args.expired !== true) {
      throw new Error("consume-design: expired must be true — it selects every expired slot; pass designIds / olderThanDays for other shapes.")
    }
    for (const [id, t] of union) {
      if (typeof t === "string" && tokenExpired(t, now)) {
        const expiry = tokenExpiryMs(t)
        targets.push({ designId: id, token: t, consumed: true, ageDays: expiry === null ? null : (now - (expiry - ttlMs)) / DAY_MS })
      }
    }
    targets.sort(byOldest)
  } else {
    const n = args.olderThanDays
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
      throw new Error("consume-design: olderThanDays must be a non-negative number — pass the day threshold (e.g. olderThanDays: 30).")
    }
    for (const [id, t] of union) {
      const expiry = typeof t === "string" ? tokenExpiryMs(t) : null
      if (expiry === null) continue // 畸形串不可判龄——不被龄选择器选中（清点面照列）
      const ageDays = (now - (expiry - ttlMs)) / DAY_MS
      if (ageDays > n) targets.push({ designId: id, token: t, consumed: true, ageDays })
    }
    targets.sort(byOldest)
  }
  const removals = targets.filter((t) => t.consumed)
  for (const t of removals) removeDesignTokenSlot(parent, t.designId, t.token)
  if (removals.length > 0) {
    try {
      persistEngTokens(parent)
    } catch (e) {
      // KD-SL4：内存快照整体回滚 + 抛（不留半消费态——可重试）
      if (snapshot) {
        const map = parent._engDesignTokens instanceof Map ? parent._engDesignTokens : (parent._engDesignTokens = new Map())
        map.clear()
        for (const [id, v] of snapshot) map.set(id, v)
      } else {
        delete parent._engDesignTokens
      }
      throw new Error(`consume-design: ${removals.length} slot(s) were removed in memory but could NOT be durably deleted from the slot file (${e.message}) — the slots are restored in memory; retry consume-design.`)
    }
  }
  const lines = targets.map((t) => (t.consumed
    ? `- designId ${t.designId} — consumed`
    : `- designId ${t.designId} — no live slot (already consumed or never issued) — idempotent no-op, nothing changed.`))
  lines.push(removals.length > 0
    ? `consumed ${removals.length} design slot(s) — a further eng-coder spawn for these designs is mechanically rejected; any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
    : "consumed 0 design slot(s) — nothing changed (idempotent no-op).")
  return lines.join("\n")
}
