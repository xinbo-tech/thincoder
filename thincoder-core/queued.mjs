/**
 * queued.mjs — busy 排队消息的合并消费纯函数族（核件——「桌面处理流 · VSC 对齐」批 R3 上提产物）。
 *
 * 机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8（「合并消费」条 + 「步边界 pickup」块）。
 * 上提源 = VSC `thincoder-vscode/src/extension/queued-merge.mjs:15-36`（容量常量 ∕ 合并串 ∕ 批计划）
 * + `queued-pickup.mjs:49`（`takeQueuedBatchItem` 取项）——**纯搬 + 转口，零语义改**（常量名 / 值 /
 * 形态文案 / 批语义逐字）；对拍锚 = CLI 副本 `thincoder-cli/src/tui/queued-merge.mjs`（同名同值）。
 *
 * 消费面：计划面（常量 ∕ 合并串 ∕ 计划）由桌面排队面消费（`thincoder-desktop/src/main/queued-input.mjs`）；
 * `takeQueuedBatchItem` = 载具取项面（携图批退化逐条 ∕ slash 零动作），桌面按 KD-40 取项边缘**暂不消费**
 * （该档头注列据）——消解 = VSC ∕ CLI 迁移消费核件批（其后源端自持副本退场）。
 *
 * 留端（载体面不迁——各端 adapter 各持）：队容器（按会话键 `Map` ∥ 单容器）· 容量门与满队回执 ·
 * 快照投影 · 步边界守卫与送达面（附件判决 ∕ 回合链出站）· 显示面。
 */

// ── 合并常量（三端逐字一致）：单批 ≤ MAX_MERGE_ITEMS 条且合并注入 ≤ MAX_MERGE_CHARS 字符；
// 超限截批先行（余下留待下批——不丢不截断单条）；单条 > MAX_MERGE_CHARS 直发不进批；
// /cmd 不进合并（逐条保序即时）。──
export const MAX_MERGE_ITEMS = 8
export const MAX_MERGE_CHARS = 2000

/** 队容量（条）——**三端同名常量**（无会话载体与会话在飞载体合计口径；满队 = 第 9 条 ⇒
 *  拒收 + 提示 + 不回显——容量门与满队回执留端）。 */
export const QUEUED_MAX_ITEMS = 8

/** 合并注入形态（编号逐条——模型一次处理全部；zh 字面，三端逐字）。 */
export function formatMergedMessages(items) {
  return `你排队了 ${items.length} 条消息：\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n——一次处理`
}

/**
 * R15 攒批计划（纯函数——消费点共享同一事实源）：按队列顺序产出动作序列（输入 = 文本数组；
 * 调用侧以 `queue.map((q) => q.text)` 取数）。
 * - { kind:"slash", text, count:1 }——/cmd 逐条即时执行（保序——不进合并缓冲）；
 * - { kind:"turn", text, count, merged }——文本批次：连续非 / 条目攒批（单批 ≤ MAX_MERGE_ITEMS 条；
 *   合并注入（格式化后）≤ MAX_MERGE_CHARS 字符；count ≥2 → merged 编号注入；count === 1 → 原文
 *   直发（含单条 > MAX_MERGE_CHARS——不进批）；超限截批先行——余下条目留待下批（不丢）。
 * 消费者每次取动作 [0] 并按 count 从源队列移除——下轮重新计划余项（边界幂等）。
 */
export function planQueuedInput(items) {
  const actions = []
  const n = items.length
  let i = 0
  while (i < n) {
    const cur = String(items[i])
    if (cur.startsWith("/")) { actions.push({ kind: "slash", text: cur, count: 1 }); i++; continue }
    let j = i
    for (;;) {
      if (j - i >= MAX_MERGE_ITEMS || j >= n) break
      const it = String(items[j])
      if (it.startsWith("/")) break
      if (it.length > MAX_MERGE_CHARS) break // 单条超长——不进批（留作直发）
      const cand = items.slice(i, j + 1)
      if (cand.length > 1 && formatMergedMessages(cand).length > MAX_MERGE_CHARS) break // 批总长超限——截批
      j++
    }
    // 超长条目堵头（内环一步未进）→ 该条直发（不进批——也不与前后合并）
    if (j === i) { actions.push({ kind: "turn", text: String(items[i]), count: 1, merged: false }); i++; continue }
    const taken = items.slice(i, j)
    if (taken.length === 1) {
      actions.push({ kind: "turn", text: String(taken[0]), count: 1, merged: false })
    } else {
      actions.push({ kind: "turn", text: formatMergedMessages(taken), count: taken.length, merged: true })
    }
    i = j
  }
  return actions
}

/** 贴图判定（取项退化与步边界让位共用——图片随条目元数据走降级面，不静默丢）。 */
const hasImages = (q) => Array.isArray(q?.images) && q.images.length > 0

/**
 * 载体条目面取批（纯函数——就地消费）：首动作为 `turn` ⇒ 按计划取一批并返回待送达条目；
 * `slash` 首动作（入队门禁不可达的防御面）⇒ 零动作 `{ item: null, merged: null }`。
 * **贴图批退化逐条**（批内任一条目携 `images` ⇒ count = 1——图片随条目元数据走降级面）；
 * 无贴图 ⇒ 多条合并为一条（头条目元数据 + 合并文本）。
 * @param {Array} queue 载体条目数组（条目 `{ text, images?, ... }`——就地 `splice` 消费）
 * @returns {{item: object|null, merged: string|null}} 取出的载体条目 + 本批文本（快照 `merged` 源）
 */
export function takeQueuedBatchItem(queue) {
  if (!Array.isArray(queue) || queue.length === 0) return { item: null, merged: null }
  const action = planQueuedInput(queue.map((q) => String(q?.text ?? "")))[0]
  if (action.kind !== "turn") return { item: null, merged: null }
  const count = queue.slice(0, action.count).some(hasImages) ? 1 : action.count
  const taken = queue.splice(0, count)
  const text = count > 1 ? action.text : String(taken[0]?.text ?? "")
  return { item: { ...taken[0], text }, merged: text }
}
