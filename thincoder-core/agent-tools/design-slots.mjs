/**
 * design-slots.mjs — design-token 槽位清点 + 消费核（2026-10-07 批 ledger-tool · 台账 #927 并入）。
 * 设计单源 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §9（F-SL1 清点面 / F-SL2 批量消费）∥
 * §10（批归属派生 · 收口反查并集——`batchAbsPath` / `batchPathKey` / `unionBatches` 三面）。
 *
 * 面一 `executeDesignSlotsAction`（`subagent` action `design-slots`——只读）：
 *   数据源 = 槽文件权威表（`readEngTokensFromSlot`——无 TTL 过滤原样）∪ 内存 Map（并集去重，
 *   冲突以槽为准——D-S3 同源）；**零写**（不 reconcile 回写、不落盘）。列表面 = 逐槽一行
 *   （designId ∥ live/expired ∥ ageDays ∥ expiresAt ∥ 批 ∥ designToken（末位，恒携）；龄序 = 最老在前）
 *   + 计数尾行；「批」= 批次归属旁列（§10——settle 时按 `docSetKey` 的 `batches/` 段档落盘的绝对路径）
 *   取 basename，旁列缺失 ⇒ `_advisorRuns` 按 designId 命中 run 的 `docSetKey` 中 `batches/` 段档兜底
 *   （KD-SL2）；两者皆不可得 ⇒ `—`。
 *   `designId` 过滤单槽（trim 精确匹配；空串视同缺省；未知 ⇒ 拒 + 列在场 id）；缺省 = 现行清点面逐字零变；零写同前。
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
import { resolve } from "node:path"

import { persistEngTokens, readEngTokensFromSlot, readEngTokenBatchesFromSlot, reconcileEngTokensFromSlot, removeDesignTokenSlot, tokenExpired, tokenExpiryMs } from "../token-ttl.mjs"
// 本档 ⇄ `design-token.mjs` 为**静态环**（批归属派生 ⇄ TTL 读取）：两侧绑定只在函数体内运行时使用，
// 任一侧**顶层**不得调用对方绑定（函数声明已提升，但 const 会落 TDZ）——与 token-ttl ⇄ session 同构。
import { effectiveTokenTtlMs } from "./design-token.mjs"
import { advisorRuns } from "./advisor-async.mjs"

const DAY_MS = 86400000

/** 槽并集视图（F-SL1 数据源 / F-SL2 目标集解析）：内存 Map 先行、槽文件权威表覆盖（同 id 冲突以槽
 *  为准——D-S3 同源）；纯读——零回写、零落盘。收口自动消费（§10）同源取用（消费计数的前态集）。 */
export function unionSlots(agent) {
  const merged = new Map()
  const mem = agent?._engDesignTokens
  if (mem instanceof Map) for (const [id, t] of mem) merged.set(id, t)
  const file = readEngTokensFromSlot(agent)
  if (file) for (const [id, t] of Object.entries(file)) merged.set(id, t)
  return merged
}

/** 批次归属并集视图（§10 收口反查单源）：内存 Map 先行、槽文件旁列覆盖（同 `unionSlots` 形——
 *  槽 = 权威，D-S3 同源）；纯读。返回 designId → 批档绝对路径；`strict` 透传读形（§10「读形」）——清点面缺省宽容（读不到 ⇒ 空集），收口面 `{strict:true}` ⇒ 读不到即抛（close 被拒）。 */
export function unionBatches(agent, { strict = false } = {}) {
  const merged = new Map()
  const mem = agent?._engDesignTokenBatches
  if (mem instanceof Map) for (const [id, b] of mem) merged.set(id, b)
  const file = readEngTokenBatchesFromSlot(agent, { strict })
  if (file) for (const [id, b] of Object.entries(file)) merged.set(id, b)
  return merged
}

/** 「批」列派生（KD-SL2）：批次归属旁列（§10）优先——取该绝对路径文件的 basename；旁列缺失
 *  （旁列启用前签发的旧槽）⇒ 会话内评审实例注册表 `_advisorRuns` 按 designId 命中的**最新** run
 *  ⇒ `docSetKey`（被审文档绝对路径集 JSON）中 `batches/` 段档取 basename；皆不可得（跨重启 /
 *  模式重进 / 注册表回收）⇒ `—`（如实降级）。 */
function batchOf(agent, designId, batches) {
  const fromSide = batches instanceof Map ? batches.get(designId) : undefined
  const sideName = typeof fromSide === "string" ? basenameOfPath(fromSide) : null
  if (sideName) return sideName
  const runs = advisorRuns(agent)
  if (!(runs instanceof Map)) return "—"
  for (const run of [...runs.values()].reverse()) {
    if (run?.designId !== designId || typeof run.docSetKey !== "string") continue
    const name = batchBasename(run.docSetKey)
    if (name) return name
  }
  return "—"
}

/** 绝对路径 → 末段名（分隔符无关：`/` 与 `\` 都切——旁列值可来自任一端写法）；空串 ⇒ null。 */
function basenameOfPath(p) {
  const parts = String(p).split(/[\\/]/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : null
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

/** docSetKey（JSON 串）→ `batches/` 段档的**绝对路径**（与 `batchBasename` 同一 `lastIndexOf("batches")`
 *  判据）；不可解析 / 无命中 ⇒ null。settle 时刻的批归属派生单源（§10「批次标识的来源」——
 *  零新输入：判据与清点面同源）。`resolve` = 归一（分隔符 ∥ `.`/`..`）；落盘值即此形。
 *  **归属不唯一 ⇒ 不猜**：文档集里出现**多份不同的**批档（收口消费以批为键，猜错 = 消费别批的
 *  授权）⇒ 返回 null（归属 = 无，与「不含批档」同一降级层——§10 同段「比留下一个可解释的
 *  滞留槽更坏」的排序）。同一档的两种写法（分隔符 / 大小写）去重，不算两份。 */
export function batchAbsPath(docSetKey) {
  if (typeof docSetKey !== "string") return null
  let list = null
  try { list = JSON.parse(docSetKey) } catch { return null }
  if (!Array.isArray(list)) return null
  const hits = []
  for (const p of list) {
    if (typeof p !== "string") continue
    const parts = p.split(/[\\/]/)
    const i = parts.lastIndexOf("batches")
    if (i < 0 || i >= parts.length - 1 || !parts[i + 1]) continue
    const abs = resolve(p)
    if (!hits.some((h) => batchPathKey(h) === batchPathKey(abs))) hits.push(abs)
  }
  return hits.length === 1 ? hits[0] : null
}

/** 批档身份键（§10「匹配」）：两侧（旁列值 ∥ 收口目标 `abs`）都是 `node:path` 解析后的绝对路径；
 *  比较前分隔符归一、`win32` 下不区分大小写（宿主事实）。出处：`docSetKey` 的 `normAbs` 对绝对
 *  输入原样保留、不归一分隔符，而 `documents` 同时受理项目根相对形与绝对形 ⇒ 同一批档在
 *  `docSetKey` 里可带正斜杠或反斜杠。 */
export function batchPathKey(p) {
  const s = resolve(String(p)).replace(/[\\/]+/g, "/")
  return process.platform === "win32" ? s.toLowerCase() : s
}

/** 槽事实（清点列与选择器共用）：状态 = `tokenExpired` 单源；`ageDays` = now − (expiresAt −
 *  `effectiveTokenTtlMs`) 派生（TTL 配置曾改时为近似——如实注）；`expiresAt` 精确；畸形 / 格式外
 *  token ⇒ 两项 `—`（不可判龄）。 */
function slotFacts(agent, designId, token, now, ttlMs, batches) {
  const expiry = typeof token === "string" ? tokenExpiryMs(token) : null
  return {
    designId, token,
    expired: typeof token === "string" && tokenExpired(token, now),
    ageDays: expiry === null ? null : (now - (expiry - ttlMs)) / DAY_MS,
    expiresAt: expiry,
    batch: batchOf(agent, designId, batches),
  }
}

/** 龄序比较（最老在前——剩余有效期升序；不可判龄（畸形串）排尾——不冒充最老）。 */
const byOldest = (a, b) => (b.ageDays ?? -Infinity) - (a.ageDays ?? -Infinity)

/**
 * `subagent` action `design-slots`（F-SL1——只读清点面）：工程模式父侧限定（与 consume-design
 * 同门）。输出 = 行文本（逐槽行 + 计数尾行）；字段 / 序 / 降级标记 = 契约，行内措辞 = 实现面。
 * 分类 = 只读（planMode 放行 / 免审批 / digest 放行——谓词在 `agent/dispatch-gates.mjs`）。
 * `designId` 过滤单槽（trim 精确匹配；空串视同缺省；未知 ⇒ 拒 + 列在场 id）；
 * 缺省 = 全量清点（不改变行契约——令牌列恒携）；零写（不 reconcile / 不落盘）。
 */
export function executeDesignSlotsAction(args, ctx) {
  const parent = ctx?.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — design-slots applies only to engineering-mode design tokens (spawn 同门).")
  }
  const now = Date.now()
  const ttlMs = effectiveTokenTtlMs(parent)
  const batches = unionBatches(parent) // 一次读入（逐行各读一次 = N 次文件解析）
  const entries = [...unionSlots(parent)].map(([id, t]) => slotFacts(parent, id, t, now, ttlMs, batches))
  entries.sort(byOldest)
  // 参数面（fail-closed——不猜）：`designId` trim 后精确匹配、空串视同缺省；未知 ⇒ 拒 + 列在场 id。
  const rawId = args?.designId
  const designId = rawId === undefined || rawId === null ? "" : String(rawId).trim()
  let selected = entries
  if (designId) {
    selected = entries.filter((e) => e.designId === designId)
    if (selected.length === 0) {
      const held = entries.length > 0 ? entries.map((e) => e.designId).join(", ") : "(none)"
      throw new Error(`design-slots: unknown designId ${JSON.stringify(designId)} — no slot holds this id (held design ids: ${held}).`)
    }
  }
  const lines = selected.map((e) => `- designId=${e.designId} status=${e.expired ? "expired" : "live"} ageDays=${e.ageDays === null ? "—" : e.ageDays.toFixed(1)} expiresAt=${e.expiresAt === null ? "—" : new Date(e.expiresAt).toISOString()} batch=${e.batch} designToken=${e.expiresAt === null ? "—" : e.token}`)
  const live = selected.filter((e) => !e.expired).length
  lines.push(`design-slots: ${selected.length} slot(s) — ${live} live / ${selected.length - live} expired${designId ? " (filtered by designId)" : ""}`)
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
