/**
 * queued-input.mjs — 宿主排队面（「回合中插入」批 · 机制单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ①**）：
 *   ① 队列表 = **按会话键**的运行期内存表（`Map<会话键, 条目[]>`）——条目形 `{ text, ts, images? }`
 *      （`text` 逐字原样 · `ts` = 入队现刻 ms · `images` = dataURL 串原样（A1），缺 ⇒ 无附件径）；
 *      容量 = `QUEUED_MAX_ITEMS`（**按键判** —— 满 ⇒ `add` 拒（零入队）；回执码 `queue-full` 归宿主 `send`）。
 *   ② 计划取批 = **核件单源**（`@thincoder/core/queued.mjs` ——「桌面处理流 · VSC 对齐」批 R3 上提产物；
 *      常量 ∕ 合并形态 ∕ 批计划三面在本档**零本地副本**）：连续非 `/` 条目攒批（单批 ≤ `MAX_MERGE_ITEMS` 条 ∧
 *      合并注入 ≤ `MAX_MERGE_CHARS` 字符；超限截批先行 —— 余下留待下批）；`slash` 首动作 = 单条
 *      （统一语义 = 计划首动作即消费——步边界面按同一判据消费；回合尾取项见 `thincoder-desktop/src/main/turn-chain.mjs`）。
 *   ③ 取项 = **核件单源**（`takeQueuedBatchItem` —— 携图批退化逐条 ∕ 合并批；本档零第二取项判据）：
 *      `peek(key)` = 副本试算（纯读）∥ `take(key)` = 就地消费 —— 试算与落取同界（`turn-chain.mjs` 尾径
 *      「试算 ⇒ 送达面 ⇒ 降级 await 窗 ⇒ 落取」序：`prepare` 抛 ⇒ 未取 ⇒ 留队）；`plan(key)` = 步边界面
 *      纯读投影（零消费）。
 * 快照投影（`snapshot`）= `{ text, ts }` —— 图不入快照（`dataURL` 不回传渲染面；形 ∕ 推送点单源 =
 * `docs/desktop/design/IPC.md` §1 `ev:queue` 行）。
 * 边界：队列 = 运行期内存（重启即失）；会话中止（`dispose` ∕ 切项目）⇒ `clear` ∕ `clearAll`（零续发）。
 * **#656（KD-52 ④）**：增 `remove(key, entry)` —— 按引用摘回（非 cap 结算径撤回臂 · 幂等；防御面）。
 * 纯数据面（零宿主依赖 ∕ 零 IO / 零模块态）⇒ 平 node 直测。
 */
import { QUEUED_MAX_ITEMS, planQueuedInput, takeQueuedBatchItem } from "@thincoder/core/queued.mjs"

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
    /** 步边界取批计划（**纯读** —— 零消费）：`{ count, text, images, ts } | null`（空队 ⇒ `null`）。
     *  `count` = 本批跨度条数（`slash` ⇒ 恰 1）；`text` = 注入文本（单条原样 ∕ 多条合并格式——核
     *  `planQueuedInput` 单源）；`images` = 本批跨度条目图并集（步边界面据此判「整批让位」—— KD-40 ⑤）；
     *  `ts` = 首条目入队刻（缺 ⇒ `null`——禁假造）。 */
    plan(key) {
      const list = listOf(key)
      if (list.length === 0) return null
      const action = planQueuedInput(list.map(textOf))[0]
      const count = action.kind === "turn" ? action.count : 1
      const entries = list.slice(0, count)
      return {
        count,
        text: action.kind === "turn" ? action.text : textOf(entries[0]),
        images: entries.flatMap((entry) => (Array.isArray(entry?.images) ? entry.images : [])),
        ts: entryTimeOf(entries[0]),
      }
    },
    /** 取项试算（**纯读** —— 核件取项副本试算，零第二份规则）：`{ item, merged } | null`（空队 ⇒ `null`）。 */
    peek(key) {
      const list = listOf(key)
      return list.length === 0 ? null : takeQueuedBatchItem([...list])
    },
    /** 取项就地消费（核件取项 —— 与 `peek` 同界）：`{ item, merged } | null`（空队 ⇒ `null`）。 */
    take(key) {
      const list = listOf(key)
      if (list.length === 0) return null
      const picked = takeQueuedBatchItem(list)
      if (list.length === 0) table.delete(key)
      return picked
    },
    /** 清本键（会话中止 —— `dispose`）：返回本键是否有条目被清（`false` ⇒ 零动作 / 空快照零帧）。 */
    clear(key) { return table.delete(key) },
    /** 按引用摘回（#656 · KD-52 ④ 撤回臂 —— 防御面 · 幂等）：命中 ⇒ 摘除且返 `true`；未命中 ⇒ 零动作。
     *  匹配面 = **引用同一**（调用方持条目引用 —— 同文两条互不误伤；先例 = 渲染面 `retractEcho` 按引用定位）。 */
    remove(key, entry) {
      const list = listOf(key)
      const index = list.indexOf(entry)
      if (index < 0) return false
      const next = list.filter((item) => item !== entry)
      if (next.length === 0) table.delete(key)
      else table.set(key, next)
      return true
    },
    /** 清全表（切项目级联 —— `abortSuspensions`）：返回被判清的键列表（调用面逐键出空快照）。 */
    clearAll() { const keys = [...table.keys()]; table.clear(); return keys },
  }
}
