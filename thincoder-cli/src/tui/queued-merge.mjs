/**
 * queued-merge.mjs — busy 排队消息的合并消费纯函数族（R15 攒批恢复——queue-visible 批 2026-09-24）。
 *
 * 机制单源 = `docs/cli/design/TUI.md` §7.5「合并消费」+ `docs/cli/design/TUI-INPUT-BOX.md` §4.1
 * 「送达链路」（常量 / 形态文案 / 计划语义）。恢复依据 = 旧形态逐字（R15 攒批，2026-09-06 实现 →
 * 2026-09-09 随 INPUT-LOCK-ASYNC 废弃；废弃记录 = `thincoder-cli/docs/_archive/design/AGENT-LOOP.md`
 * §11.3；原实现 = git `3e1234b7` 树内 `src/tui/suspension-drive.mjs:21-68`）——常量名 / 值 /
 * 形态文案 / 批语义逐字一致。
 *
 * 取批四支共用同一事实源（`planQueuedInput`；队列容器仍归会话层 `state.pendingInput`——核只给缝）：
 *   ① 步边界 pickup（`queued-pickup.mjs`）· ② 回合尾兜底（`agent-turn.mjs`）
 *   · ③ driver 输入优先（`suspension-drive.mjs`）· ④ 中止残余转 queue（`suspension-drive.mjs`）。
 */

// ── 合并常量（R15 逐字）：单批 ≤ MAX_MERGE_ITEMS 条且合并注入 ≤ MAX_MERGE_CHARS 字符
// （双端逐字一致——VSC 对位 `thincoder-vscode/src/extension/queued-merge.mjs` 同值同名）；
// 超限截批先行（余下留待下批——不丢不截断单条）；单条 > MAX_MERGE_CHARS 直发不进批；
// /cmd 不进合并（逐条保序即时）。──
export const MAX_MERGE_ITEMS = 8
export const MAX_MERGE_CHARS = 2000

/** 队容量（条）——**常量单源**（显示面 / 输入门禁同源 import；与合并批上限 `MAX_MERGE_ITEMS`（8）
 *  **同值不同名**：常规满队 ⇒ 恰一批一次消费）。判据面 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1
 *  条件 5（第 9 条 = 拒 + 提示 + 文本保留）。 */
export const QUEUED_MAX_ITEMS = 8

/** 合并注入形态（编号逐条——模型一次处理全部——设计措辞锚；`docs/cli/design/TUI.md` §7.5 逐字）。 */
export function formatMergedMessages(items) {
  return `你排队了 ${items.length} 条消息：\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n——一次处理`
}

/**
 * R15 攒批计划（纯函数——消费点共享同一事实源）：按队列顺序产出动作序列。
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
