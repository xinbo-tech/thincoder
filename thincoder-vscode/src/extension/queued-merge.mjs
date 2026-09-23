/**
 * queued-merge.mjs — busy 排队消息的合并消费纯函数族（VSC 半——R15 攒批恢复 · queue-visible 批 2026-09-24）。
 *
 * 机制单源 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦（消费成形）+ `docs/vsc/design/
 * WEBVIEW-PROTOCOL.md` §3.2 行 17（快照字段）；跨端同源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`
 * §6.8「合并消费」。**双端各自实现、语义 / 常量 / 文案同源**（对拍锁 = `test/queue-visible-vsc.test.mjs`
 * T-V16-14：本档 `MAX_MERGE_ITEMS` / `MAX_MERGE_CHARS` / `QUEUED_MAX_ITEMS` / `formatMergedMessages` /
 * `planQueuedInput` 与 `thincoder-cli/src/tui/queued-merge.mjs` 同名同值）。
 * 恢复依据 = R15 旧形态逐字（常量名 / 值 / 形态文案 / 批语义——CLI 侧同源档头注）。
 */

// ── 合并常量（双端逐字一致）：单批 ≤ MAX_MERGE_ITEMS 条且合并注入 ≤ MAX_MERGE_CHARS 字符；
// 超限截批先行（余下留待下批——不丢不截断单条）；单条 > MAX_MERGE_CHARS 直发不进批；
// /cmd 不进合并（逐条保序即时）。──
export const MAX_MERGE_ITEMS = 8
export const MAX_MERGE_CHARS = 2000

/** 队容量（条）——**双端同名常量**（无会话 `panel._busyQueued` 与会话在飞 `susp.pendingInput`
 *  合计口径；满队 = 第 9 条 ⇒ 拒收 + 提示 + 不回显）。 */
export const QUEUED_MAX_ITEMS = 8

/** 合并注入形态（编号逐条——模型一次处理全部；`WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦ 逐字）。 */
export function formatMergedMessages(items) {
  return `你排队了 ${items.length} 条消息：\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n——一次处理`
}

/**
 * R15 攒批计划（纯函数——消费点共享同一事实源）：按队列顺序产出动作序列（输入 = 文本数组——
 * 与 CLI 同族对拍面；调用侧以 `queue.map((q) => q.text)` 取数）。
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
