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
  // Torn-state guard (R16 — 2026-09-06): mode toggles no longer clear the mirror, so
  // this fires only on abnormal slot shapes (mirror missing while slots remain — e.g. a
  // slot carrying engDesignTokens without its mirror). Refuse rather than resurrect via
  // the map alone — re-review is the safe recovery.
  if (!legacy && hasSlots) {
    throw new Error("Design tokens were reset (the single-token mirror is missing while approved-design slots are present — torn session state) — run advisor with type='design' again and spawn with the fresh designId+token pair.")
  }
  if (designIdArg) {
    if (!hasSlots || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${hasSlots ? slots.size : 0} approved design slot(s))`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (hasSlots && slots.size > 1) {
    throw new Error(`Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to.`)
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
