/**
 * queued-input.mjs — 宿主排队面（「回合中插入」批 · 机制单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ①**）：
 *   ① 队列表 = **按会话键**的运行期内存表（`Map<会话键, 条目[]>`）——条目形 `{ text, ts, images? }`
 *      （`text` 逐字原样 · `ts` = 入队现刻 ms · `images` = `{name,mime,dataURL}` 原样，缺 ⇒ 无附件径）；
 *      容量 = `QUEUED_MAX_ITEMS`（**按键判** —— 满 ⇒ `add` 拒（零入队）；回执码 `queue-full` 归宿主 `send`）。
 *   ② 计划取批 = CLI ∕ VSC 同值（`thincoder-cli/src/tui/queued-merge.mjs` ∥
 *      `thincoder-vscode/src/extension/queued-merge.mjs`）：连续非 `/` 条目攒批（单批 ≤ `MAX_MERGE_ITEMS` 条 ∧
 *      合并注入 ≤ `MAX_MERGE_CHARS` 字符；超限截批先行 —— 余下留待下批）；`slash` 首动作 = 单条跨 1
 *      （步边界面按设计**不消费**〔防御面〕，回合尾由调用面按「逐条直发」处置 —— `thincoder-desktop/src/main/turn-chain.mjs`）。
 *   ③ 取批计划（`plan(key)`）**纯读** —— 落取由调用面 `queue.take` 执行（步边界面另加「携图整批让位」判据 —— KD-40 ⑤）。
 * 快照投影（`snapshot`）= `{ text, ts }` —— 图不入快照（`dataURL` 不回传渲染面；形 ∕ 推送点单源 =
 * `docs/desktop/design/IPC.md` §1 `ev:queue` 行）。
 * 边界：队列 = 运行期内存（重启即失）；会话中止（`dispose` ∕ 切项目）⇒ `clear` ∕ `clearAll`（零续发）。
 * 纯数据面（零宿主依赖 ∕ 零 IO / 零模块态）⇒ 平 node 直测。
 */

/** 队容量（**按键判** —— 值同核 `thincoder-render-core/flow/queued-mark.mjs` `QUEUED_MAX_ITEMS` 与
 *  CLI ∕ VSC `queued-merge.mjs`：常规满队 ⇒ 恰一批一次消费）。 */
export const QUEUED_MAX_ITEMS = 8

/** 合并批上限（条）—— CLI `queued-merge.mjs` 逐字同值。 */
export const MAX_MERGE_ITEMS = 8

/** 合并注入上限（字符）—— CLI `queued-merge.mjs` 逐字同值。 */
export const MAX_MERGE_CHARS = 2000

/** 条目文本投影（非串 ⇒ `""` —— 计划面零抛）。 */
export const textOf = (entry) => (typeof entry?.text === "string" ? entry.text : "")

/** 条目时间投影（非有限数 ⇒ `null` —— 显示面「无 ts 不显示」判据同源；回执 `ts` 亦取此投影）。 */
export const entryTimeOf = (entry) => (typeof entry?.ts === "number" && Number.isFinite(entry.ts) ? entry.ts : null)

/** 合并注入形态（zh 字面 —— CLI `queued-merge.mjs` `formatMergedMessages` **逐字**；设计端差说明：本形为
 *  zh 字面（CLI ∕ VSC 同值），渲染面仅透传显示 ⇒ 零 CJK 字面入渲染面码）。 */
export function formatMergedMessages(items) {
  return `你排队了 ${items.length} 条消息：\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n——一次处理`
}

/** 计划（CLI ∕ VSC **同算法** —— `planQueuedInput`；入参 = 文本串列）：按队序产出动作序列。
 *  `{ kind:"slash", text, count:1 }` 逐条（保序 —— 不进合并缓冲）∥ `{ kind:"turn", text, count, merged }`
 *  文本批次（单批 ≤ `MAX_MERGE_ITEMS` 条；合并注入 ≤ `MAX_MERGE_CHARS` 字符；`count === 1` ⇒ 原文直发
 *  （含单条 > `MAX_MERGE_CHARS` —— 不进批）；超限截批先行 —— 余下条目留待下批，不丢）。 */
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
    if (taken.length === 1) actions.push({ kind: "turn", text: String(taken[0]), count: 1, merged: false })
    else actions.push({ kind: "turn", text: formatMergedMessages(taken), count: taken.length, merged: true })
    i = j
  }
  return actions
}

/** 队列表工厂（宿主单例 —— 键 = 会话键 `String(slot)`）。 */
export function createQueuedInput() {
  const table = new Map()
  const listOf = (key) => table.get(key) ?? []
  return {
    /** 入队（**容量按键判** —— 满 ⇒ `{ ok: false }` 且零入队；调用面据此回 `queue-full`）。 */
    add(key, entry) {
      const list = listOf(key)
      if (list.length >= QUEUED_MAX_ITEMS) return { ok: false }
      table.set(key, [...list, entry])
      return { ok: true }
    },
    /** 本键队列快照（显示面投影 `{ text, ts }` —— 整置语义 · 幂等；空队 ⇒ `[]`）。 */
    snapshot(key) { return listOf(key).map((entry) => ({ text: textOf(entry), ts: entryTimeOf(entry) })) },
    /** 队条目数（诊断 ∕ 清点面）。 */
    size(key) { return listOf(key).length },
    /** 取批计划（**纯读** —— 零消费）：`{ slash, text, entries, images } | null`（空队 ⇒ `null`）。
     *  `entries` = 本批跨度条目（`slash` ⇒ 恰一条）；`text` = 注入文本（单条原样 ∕ 多条合并格式）；
     *  `images` = 本批条目图并集（步边界面据此判「整批让位」—— KD-40 ⑤）。 */
    plan(key) {
      const list = listOf(key)
      if (list.length === 0) return null
      const action = planQueuedInput(list.map(textOf))[0]
      const slash = action.kind !== "turn"
      const entries = slash ? list.slice(0, 1) : list.slice(0, action.count)
      return {
        slash,
        entries,
        text: slash ? textOf(entries[0]) : action.text,
        images: entries.flatMap((entry) => (Array.isArray(entry?.images) ? entry.images : [])),
      }
    },
    /** 落取（前 `count` 条 —— 调用面按计划定数后调；`count` 非整数 / 非正 ⇒ 零动作返 `[]`）。 */
    take(key, count) {
      const list = listOf(key)
      const n = Number.isInteger(count) && count > 0 ? Math.min(count, list.length) : 0
      if (n === 0) return []
      const taken = list.slice(0, n)
      if (n === list.length) table.delete(key)
      else table.set(key, list.slice(n))
      return taken
    },
    /** 清本键（会话中止 —— `dispose`）：返回本键是否有条目被清（`false` ⇒ 零动作 / 空快照零帧）。 */
    clear(key) { return table.delete(key) },
    /** 清全表（切项目级联 —— `abortSuspensions`）：返回被判清的键列表（调用面逐键出空快照）。 */
    clearAll() { const keys = [...table.keys()]; table.clear(); return keys },
  }
}
