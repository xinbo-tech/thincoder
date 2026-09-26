/**
 * chat-stream.mjs — 对话流增量面（`docs/desktop/design/RENDERER.md` §2）：块键单源 + 增量判据 + 对齐步 + 帧前判据。
 *   ① `blockKey(block, index)` —— 块键单源（`block.id ?? String(index)`）：落锚 / 增量缝合键 / toggle 键三处同源；
 *   ② `streamDelta(prev, next)` ⇒ `{kind, index}`（none / append / patch / reset）—— append / patch 皆不触碰非尾块；
 *   ③ `alignPlan(mounted, visible, tailExempt)` ⇒ `{evict, prepend, tail, ok}`（重合 = 逐位引用等 · 取最大重合 ⇒ evict 最小）；
 *   ④ `paintPlan({prev, next, changedKeys})` ⇒ `{tier, index, remount, refresh}`（`refresh` 恒真 —— 无帧豁免）。
 * 本档纯函数（零 DOM / 零 `node:`）：`mounted` 项 = `{node, block}`（帧层记账），`visible` = 帧内可见块序列。
 */

/** 块键单源：有 `id` 用 `id`（字符串化 —— 落锚与缝合键同域），否则用位置。 */
export function blockKey(block, index) {
  return block?.id ?? String(index)
}

/** 帧间块面增量判据（纯引用比较 —— 不深比内容）：
 *  前 n 位引用全等 ∧ 长度 +1 ⇒ `append`（`index` = 尾块位）；等长 ∧ 非尾位引用全等 ∧ 尾位引用变 ∧ 尾位键等 ⇒ `patch`
 *  （`index` = 尾块位）；逐位引用全等 ⇒ `none`；其余（含切会话 / 词表置位 / 回填并入前部）⇒ `reset`。 */
export function streamDelta(prev, next) {
  const before = Array.isArray(prev) ? prev : []
  const after = Array.isArray(next) ? next : []
  const length = before.length
  const heads = (count) => before.every((block, index) => index >= count || block === after[index])
  if (after.length === length + 1) return heads(length) ? { kind: "append", index: length } : { kind: "reset", index: -1 }
  if (after.length !== length) return { kind: "reset", index: -1 }
  if (length === 0) return { kind: "none", index: -1 }
  const tail = length - 1
  if (!heads(tail)) return { kind: "reset", index: -1 }
  if (before[tail] === after[tail]) return { kind: "none", index: -1 }
  return blockKey(before[tail], tail) === blockKey(after[tail], tail) ? { kind: "patch", index: tail } : { kind: "reset", index: -1 }
}

/** 逐位引用等判定：`kept[offset..offset+length-1].block` ≡ `goals[start..start+length-1]`。 */
function matches(kept, goals, offset, start, length) {
  for (let step = 0; step < length; step += 1) {
    if (kept[offset + step]?.block !== goals[start + step]) return false
  }
  return true
}

/**
 * 窗口对齐步：从 `mounted`（DOM 块节点序）与 `visible`（目标块序）求 `evict`（摘头部枚数）/
 * `prepend`（头部前插枚数 = 插点块序首）/ `tail`（重合段后余段 ⇒ 追加）/ `ok`。
 * 重合 = 逐位引用等 · 取最大重合（⇒ `evict` 最小）；`tailExempt`（patch 档）⇒ 尾位不入重合判、不入余段
 * （由就地更新承接）；零重合 ⇒ `ok: false` ⇒ 调用方回落全量重挂。
 */
export function alignPlan(mounted, visible, tailExempt = false) {
  const entries = Array.isArray(mounted) ? mounted : []
  const targets = Array.isArray(visible) ? visible : []
  const kept = tailExempt ? entries.slice(0, -1) : entries
  const goals = tailExempt ? targets.slice(0, -1) : targets
  const total = kept.length
  const reach = goals.length
  let overlap = 0
  let prepend = 0
  for (let start = 0; start <= reach && overlap < total; start += 1) {
    let length = Math.min(total, reach - start)
    while (length > overlap && !matches(kept, goals, total - length, start, length)) length -= 1
    if (length > overlap) {
      overlap = length
      prepend = start
    }
  }
  return { evict: total - overlap, prepend, tail: goals.slice(prepend + overlap), ok: overlap > 0 }
}

/** 重挂键（两全量键）：任一值变 ⇒ 整面重挂（全量键集外的键变一律增量 —— 窗口对齐步不随档位）。 */
const REMOUNT_KEYS = Object.freeze(["activeSession", "locale"])

/** 帧前判据：`prev` = 上一帧 state（首帧 ⇒ 缺）· `changedKeys` = 本次已变键集。
 *  `tier` / `index` = `streamDelta(prev.blocks, next.blocks)` 出口；`remount` = 首帧 ∨ 两全量重挂键变；
 *  `refresh` 恒真（无帧豁免 —— 帧尾态刷单点）。 */
export function paintPlan({ prev = null, next = null, changedKeys = [] } = {}) {
  const keys = Array.isArray(changedKeys) ? changedKeys : []
  const delta = streamDelta(prev?.blocks, next?.blocks)
  const first = prev === null || prev === undefined
  return { tier: delta.kind, index: delta.index, remount: first || REMOUNT_KEYS.some((key) => keys.includes(key)), refresh: true }
}
