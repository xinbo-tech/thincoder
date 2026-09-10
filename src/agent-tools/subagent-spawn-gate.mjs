/**
 * subagent-spawn-gate.mjs — eng-coder spawn design-token gate (module split out of
 * subagent.mjs on 2026-09-06 fix round: that file crossed the >500-line hard cap — the
 * gate family resolveDesignSlot / dropExpiredTokenSlot / authorizeEngCoderDesignToken
 * moved here, bodies verbatim; subagent.mjs re-exports resolveDesignSlot and calls the
 * gate). Design authority: ENG-TOKEN-BINDING-TUNING.md §5.1 (R16) + DESIGN-TOKEN-SETTLEMENT.md
 * (D4/D5 — 2026-09-08) — the CLI counterpart lives in agent-tools/subagent-spawn.mjs;
 * mirror discipline = design doc only, no cross-alignment.
 */
import { existsSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { validateDesignToken, isExpiredDesignToken } from "./advisor.mjs"
import { setSlotEngDesignTokens, readSlotEngDesignTokens, clearSlotEngDesignToken } from "../extension/session-slot-write.mjs"

/** batchDoc gate（§2.22.3）：工程角色必传可读批次档路径（空/非文件 → throw）——校验单份、同步/异步两路各一调用点；其余角色 explore/plan/coder 零变更（调用点按 NEEDS_BATCH_DOC 判定）。 */
export const NEEDS_BATCH_DOC = new Set(["eng-coder", "eng-designer"])
export function resolveBatchDoc(parent, batchDoc) {
  const given = typeof batchDoc === "string" ? batchDoc.trim() : ""
  const bad = (s = "") => new Error("batchDoc is required for an engineering-role spawn (eng-coder / eng-designer) — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it." + s)
  if (!given) throw bad()
  const abs = resolve(parent?.cwd ?? process.cwd(), given.replace(/\\/g, "/"))
  let ok = false
  try { ok = existsSync(abs) && statSync(abs).isFile() } catch { ok = false }
  if (!ok) throw bad(` (given path is not a readable file: ${given})`)
  return abs
}

/**
 * DESIGN-TOKEN-SETTLEMENT D4 (2026-09-08): 权威回读 —— 从 _engPersist 绑定的槽文件读权威
 * 台账 engDesignTokens，只把未过期项 reconcile 进内存 Map（expired 永不授权 —— fail-closed）；
 * 槽内过期项即从权威台账清理（D2 触发③ TTL 过期清 gate-time）。无 _engPersist（非会话绑定的
 * 子代理父）→ 内存即唯一真相。单值镜像 `_engDesignToken` 已随 D5 退役 —— 此处只读 engDesignTokens。
 */
function authorityTokens(parent) {
  const p = parent?._engPersist
  if (!p?.cwd || !p?.slot) return null
  try { return readSlotEngDesignTokens(p.cwd, p.slot) } catch { return null }
}

function reconcileFromAuthority(parent) {
  const slots = parent._engDesignTokens
  const read = authorityTokens(parent)
  const obj = read?.engDesignTokens
  if (!obj || typeof obj !== "object") return slots ?? null
  const live = new Map()
  const expiredIds = []
  for (const [id, tok] of Object.entries(obj)) {
    if (typeof tok === "string" && !isExpiredDesignToken(tok)) live.set(id, tok)
    else if (isExpiredDesignToken(tok)) expiredIds.push(id)
  }
  if (expiredIds.length > 0) {
    const p = parent?._engPersist
    try { setSlotEngDesignTokens(p.cwd, p.slot, Object.fromEntries(live)) } catch { /* 槽清理非致命 */ }
  }
  if (live.size === 0) return slots ?? new Map()
  const merged = slots instanceof Map ? slots : new Map()
  for (const [id, tok] of live) merged.set(id, tok)
  parent._engDesignTokens = merged
  return merged
}

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3,
 * CLI parity): designId → exact slot; omitted → exactly ONE slot must exist (T16).
 * Format+TTL fail-closed check (uuid:expiresAt — 2026-09-06: HMAC anti-forgery gone)
 * stays in validateDesignToken. D4 (2026-09-08): 内存 Map miss 时回读权威槽文件 reconcile +
 * 判定（会话内回合/进程重启后也能从槽读到 settle 刚落盘的 token）——不再是"只读当前 run
 * 内存空快照 → 误拒"。
 */
export function resolveDesignSlot(parent, designIdArg) {
  let slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 内存 miss（指定 designId 不在 或 空 Map）→ 权威回读 reconcile（D4）
  if (designIdArg ? !(hasSlots && slots.has(designIdArg)) : !hasSlots) {
    const rec = reconcileFromAuthority(parent)
    if (rec && rec !== slots) slots = rec
  }
  const size = slots instanceof Map ? slots.size : 0
  const heldIds = size > 0 ? [...slots.keys()].join(", ") : "(none)"
  if (designIdArg) {
    if (!(slots instanceof Map) || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${size} approved design slot(s); held design ids: ${heldIds})`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (size > 1) {
    throw new Error(`Multiple approved designs in this session (${size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to. Held design ids: ${heldIds}`)
  }
  if (size === 1) return { token: [...slots.values()][0] }
  throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
}

/**
 * R16 ③ gate-time slot deletion (D-R16c ③ — ENG-TOKEN-BINDING-TUNING.md §5.1): remove the
 * EXPIRED token's designId slot so long-running sessions purge dead slots at the spawn
 * gate. Only expiry deletions land here — the caller invokes this solely when the presented
 * token EQUALS the slot token AND classifies as format-valid-expired (mismatch/malformed
 * reject without deletion). D5 (2026-09-08): 单值镜像已退役 —— 无镜像同步；同删权威槽
 * （D2 触发③）。
 */
function dropExpiredTokenSlot(parent, designId) {
  const slots = parent._engDesignTokens
  if (!(slots instanceof Map) || slots.size === 0) return
  const key = designId && slots.has(designId)
    ? designId
    : (!designId && slots.size === 1 ? [...slots.keys()][0] : null)
  if (key === null) return
  slots.delete(key)
  const p = parent?._engPersist
  if (p?.cwd && p?.slot) { try { clearSlotEngDesignToken(p.cwd, p.slot, key) } catch { /* 幂等清理 */ } }
}

/**
 * eng-coder token gate (moved verbatim from subagent.mjs execute — module split): the
 * design review must have passed and the caller must present the exact token advisor
 * issued — otherwise the child is not authorized to code.
 * 2026-09-01: multi-design slots — designId 定位槽（exact slot / 单槽 fallthrough）；
 * format+TTL fail-closed 校验不变（2026-09-06 设计 B: HMAC 防伪层已删——无签名 uuid:expiresAt）。
 * R16 ③ (2026-09-06): an EXPIRED token's rejection deletes its designId slot (mirror
 * synced) — long-running sessions purge dead slots at the gate; mismatch / malformed
 * reject WITHOUT deletion (never harm a slot that could still be valid — D-R16c ③).
 * Throws on any rejection; returns nothing on authorization.
 */
export function authorizeEngCoderDesignToken(parent, designId, designToken) {
  const issuedToken = resolveDesignSlot(parent, designId).token
  if (!issuedToken || designToken !== issuedToken || !validateDesignToken(designToken)) {
    if (designToken === issuedToken && isExpiredDesignToken(designToken)) {
      dropExpiredTokenSlot(parent, designId)
    }
    throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
  }
}

/**
 * consume-design 动作执行器（2026-09-07 token 链终消费制——ENGINEERING-MODE.md §2.6 F1
 * ——CLI 同构面；CLI 执行器在 agent-tools/subagent-spawn.mjs，本端 slot 族居所 =
 * 本文件）。父侧验收核销时显式调用——读槽值 → 移除该 designId 槽 + 清权威台账（D2 触发①：
 * consume-design 后显式 delete 该槽——不再依赖 agentState 空态回写，见 DESIGN-TOKEN-SETTLEMENT.md）。
 * 消费后同 designId 再 spawn = resolveDesignSlot not found 机械拒。调用形态定死（评审 #3）：
 * 参数 designId（单设计会话可省略——FR3 spawn 同款语义）；未知 designId 与重复消费同款
 * no-op 提示（幂等——不报错）。dispatch 分类（评审 #7d）：非只读控制动作——depth-0 + 工程
 * 模式限定（受限变体门在 subagent.mjs；本器自持工程模式门）——planMode 拒绝（execute-tools
 * 不豁免）——不入批审批分组（execute-tools 免审直行——无文件写）。
 */
export function executeConsumeDesignAction(args, ctx) {
  const parent = ctx.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — consume-design applies only to engineering-mode design tokens (spawn 同门).")
  }
  const designId = args?.designId ? String(args.designId) : undefined
  const slots = parent?._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 多槽缺 designId → 拒（spawn 同款语义——不误消费任一槽）
  if (!designId && hasSlots && slots.size > 1) {
    throw new Error(`consume-design: Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design to close out.`)
  }
  // 读槽值：内存 Map 精确/单槽；settle 刚落盘而本回合内存未持有 → 权威槽兜底（单槽）。
  let token = null
  if (designId && hasSlots && slots.has(designId)) token = slots.get(designId)
  else if (!designId && hasSlots) token = [...slots.values()][0]
  if (!token) {
    const obj = authorityTokens(parent)?.engDesignTokens
    if (obj && typeof obj === "object") {
      if (designId && obj[designId]) token = obj[designId]
      else if (!designId && Object.keys(obj).length === 1) token = obj[Object.keys(obj)[0]]
    }
  }
  // 未知 designId / 已消费 / 无任何槽 → 幂等 no-op 提示（不报错——评审 #3 定死）
  if (!token) {
    return `consume-design: no live slot${designId ? ` for designId ${designId}` : ""} (already consumed or never issued) — idempotent no-op, nothing changed.`
  }
  if (hasSlots) {
    if (designId) {
      if (slots.get(designId) === token) slots.delete(designId)
    } else {
      for (const [k, t] of slots) if (t === token) { slots.delete(k); break }
    }
  }
  // 清权威槽（D2 触发①）：designId → 该槽；单设计会话缺省 → 整账本
  const p = parent?._engPersist
  if (p?.cwd && p?.slot) { try { clearSlotEngDesignToken(p.cwd, p.slot, designId) } catch { /* 幂等 */ } }
  return `design slot consumed — designId ${designId ?? "(single-design session)"} is closed out; a further eng-coder spawn for this design is mechanically rejected, and any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
}
