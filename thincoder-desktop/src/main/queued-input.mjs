/**
 * queued-input.mjs — 宿主排队面（「回合中插入」批 · 机制单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ①**）：
 *   ① 队列表 = **按会话键**的运行期内存表（`Map<会话键, 条目[]>`）——条目形 `{ text, ts, images? }`
 *      （`text` 逐字原样 · `ts` = 入队现刻 ms · `images` = `{name,mime,dataURL}` 原样，缺 ⇒ 无附件径）；
 *      容量 = `QUEUED_MAX_ITEMS`（**按键判** —— 满 ⇒ `add` 拒（零入队）；回执码 `queue-full` 归宿主 `send`）。
 *   ② 计划取批 = **核件单源**（`@thincoder/core/queued.mjs` ——「桌面处理流 · VSC 对齐」批 R3 上提产物；
 *      常量 ∕ 合并形态 ∕ 批计划三面在本档**零本地副本**）：连续非 `/` 条目攒批（单批 ≤ `MAX_MERGE_ITEMS` 条 ∧
 *      合并注入 ≤ `MAX_MERGE_CHARS` 字符；超限截批先行 —— 余下留待下批）；`slash` 首动作 = 单条跨 1
 *      （步边界面按设计**不消费**〔防御面〕，回合尾由调用面按「逐条直发」处置 —— `thincoder-desktop/src/main/turn-chain.mjs`）。
 *   ③ 取批计划（`plan(key)`）**纯读** —— 落取由调用面 `queue.take` 执行（步边界面另加「携图整批让位」判据 —— KD-40 ⑤）。
 *      **取项边缘保 KD-40（父侧 2026-09-28 裁）**：桌面「slash 回合尾逐条直发 ∕ 携图批不拆批」为在册裁定 ⇒
 *      不随核 `takeQueuedBatchItem` 的「携图批退化逐条 ∕ slash 零动作」语义；本档计划取批 = 桌面取项单源。
 * 快照投影（`snapshot`）= `{ text, ts }` —— 图不入快照（`dataURL` 不回传渲染面；形 ∕ 推送点单源 =
 * `docs/desktop/design/IPC.md` §1 `ev:queue` 行）。
 * 边界：队列 = 运行期内存（重启即失）；会话中止（`dispose` ∕ 切项目）⇒ `clear` ∕ `clearAll`（零续发）。
 * 纯数据面（零宿主依赖 ∕ 零 IO / 零模块态）⇒ 平 node 直测。
 */
import { QUEUED_MAX_ITEMS, planQueuedInput } from "@thincoder/core/queued.mjs"

/** 条目文本投影（非串 ⇒ `""` —— 计划面零抛）。 */
export const textOf = (entry) => (typeof entry?.text === "string" ? entry.text : "")

/** 条目时间投影（非有限数 ⇒ `null` —— 显示面「无 ts 不显示」判据同源；回执 `ts` 亦取此投影）。 */
export const entryTimeOf = (entry) => (typeof entry?.ts === "number" && Number.isFinite(entry.ts) ? entry.ts : null)

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
     *  `entries` = 本批跨度条目（`slash` ⇒ 恰一条）；`text` = 注入文本（单条原样 ∕ 多条合并格式——
     *  核 `planQueuedInput` 单源）；`images` = 本批条目图并集（步边界面据此判「整批让位」—— KD-40 ⑤）。 */
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
