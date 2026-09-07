/**
 * subagent-spawn-gate.mjs — eng-coder spawn design-token gate (module split out of
 * subagent.mjs on 2026-09-06 fix round: that file crossed the >500-line hard cap — the
 * gate family resolveDesignSlot / dropExpiredTokenSlot / authorizeEngCoderDesignToken
 * moved here, bodies verbatim; subagent.mjs re-exports resolveDesignSlot and calls the
 * gate). Design authority: ENG-TOKEN-BINDING-TUNING.md §5.1 (R16) — the CLI counterpart
 * of this code lives in agent-tools/subagent-spawn.mjs; mirror discipline = design doc
 * only, no cross-alignment.
 */
import { validateDesignToken, isExpiredDesignToken } from "./advisor.mjs"

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3,
 * CLI parity): designId → exact slot; omitted → exactly ONE slot must exist (T16).
 * Format+TTL fail-closed check (uuid:expiresAt — 2026-09-06: HMAC anti-forgery gone)
 * stays in validateDesignToken. Torn state (mirror missing while slots present) must not
 * resurrect via the map alone.
 */
export function resolveDesignSlot(parent, designIdArg) {
  const slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  const legacy = parent._engDesignToken
  // F2d（§29.1）：not-found 与多槽歧义两分支错误均附持有 id 列表——持久化恢复后父代理
  // 无 digest 可查 id——错误列表是唯一发现途径（designId 非凭证——token 才是）。
  const heldIds = hasSlots ? [...slots.keys()].join(", ") : "(none)"
  // Torn-state guard (R16 — 2026-09-06): mode toggles no longer clear the mirror, so
  // this fires only on abnormal slot shapes (mirror missing while slots remain — e.g. a
  // slot carrying engDesignTokens without its mirror). Refuse rather than resurrect via
  // the map alone — re-review is the safe recovery.
  if (!legacy && hasSlots) {
    throw new Error("Design tokens were reset (the single-token mirror is missing while approved-design slots are present — torn session state) — run advisor with type='design' again and spawn with the fresh designId+token pair.")
  }
  if (designIdArg) {
    if (!hasSlots || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${hasSlots ? slots.size : 0} approved design slot(s); held design ids: ${heldIds})`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (hasSlots && slots.size > 1) {
    throw new Error(`Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to. Held design ids: ${heldIds}`)
  }
  if (hasSlots && slots.size === 1) return { token: [...slots.values()][0] }
  if (legacy) return { token: legacy } // single-slot mirror fallback (pre-multi-slot sessions)
  throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
}

/**
 * R16 ③ gate-time slot deletion (D-R16c ③ — ENG-TOKEN-BINDING-TUNING.md §5.1): remove the
 * EXPIRED token's designId slot so long-running sessions purge dead slots at the spawn
 * gate. Only expiry deletions land here — the caller invokes this solely when the presented
 * token EQUALS the slot token AND classifies as format-valid-expired (mismatch/malformed
 * reject without deletion). The single mirror is synced when it pointed at the removed
 * token (keeps the mirror ⊆ slots invariant the resolver relies on).
 */
function dropExpiredTokenSlot(parent, designId) {
  const slots = parent._engDesignTokens
  if (!(slots instanceof Map) || slots.size === 0) return
  const key = designId && slots.has(designId)
    ? designId
    : (!designId && slots.size === 1 ? [...slots.keys()][0] : null)
  if (key === null) return
  const removed = slots.get(key)
  slots.delete(key)
  if (parent._engDesignToken === removed) {
    // 单槽镜像同步（D-R16c ③）: keep the mirror ∈ live-slots invariant. Repoint to a
    // surviving slot when siblings remain — nulling it here would leave mirror-null +
    // slots-present, which resolveDesignSlot's torn-state guard treats as reset state and
    // refuses (killing the sibling spawns). Null only when nothing remains.
    parent._engDesignToken = slots.size > 0 ? [...slots.values()][0] : null
  }
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
 * 本文件）。父侧验收核销时显式调用——读槽值 → 移除该 designId 槽 + 镜像同步（VS 不变
 * 量：mirror ∈ live slots——指向被消费 token 时剩槽重指、无槽置 null——torn-state
 * guard 依赖）；消费后同 designId 再 spawn = resolveDesignSlot not found 机械拒。调用
 * 形态定死（评审 #3）：参数 designId（单设计会话可省略——FR3 spawn 同款语义）；未知
 * designId 与重复消费同款 no-op 提示（幂等——不报错）。dispatch 分类（评审 #7d）：
 * 非只读控制动作——depth-0 + 工程模式限定（受限变体门在 subagent.mjs；本器自持工程
 * 模式门）——planMode 拒绝（execute-tools 不豁免）——不入批审批分组（execute-tools
 * 免审直行——无文件写）。
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
  // 读槽值：给定 designId → 精确槽（未知/已消费 → no-op）；缺省 → 唯一槽；无 Map → 单值镜像兜底
  let token = null
  if (designId && hasSlots && slots.has(designId)) token = slots.get(designId)
  else if (!designId && hasSlots) token = [...slots.values()][0]
  else if (!designId && !hasSlots && typeof parent?._engDesignToken === "string" && parent._engDesignToken) token = parent._engDesignToken
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
  // 镜像同步（dropExpiredTokenSlot 同款不变量）：指向被消费 token → 剩槽重指（null 镜像
  // + 残槽会触发 resolveDesignSlot 的 torn-state guard——T7 隔离依赖）/ 无槽置 null
  if (parent._engDesignToken === token) {
    parent._engDesignToken = hasSlots && slots.size > 0 ? [...slots.values()][0] : null
  }
  return `design slot consumed — designId ${designId ?? "(single-design session)"} is closed out; a further eng-coder spawn for this design is mechanically rejected, and any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
}
