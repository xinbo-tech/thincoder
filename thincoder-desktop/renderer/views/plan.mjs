/**
 * plan.mjs — 计划卡面（`docs/desktop/design/UI.md` §1 计划面行 · 批 A · 形态单源 = 该行「落形」条）：
 * **纯描述符 · 零出口**（`ev:task` 消费 —— 挂载面 = `thincoder-desktop/renderer/mount-cards.mjs`）。
 *   ① 卡根 = `data-card="task"`（驻点 = 对话流根 · **非块节点**）；**空列表 ⇒ 卡不在场**（返回 `null` —— 零节点）；
 *   ② 逐行 = 事项标题 + 状态词（`pending` ⇒ 排队中 / `in_progress` ⇒ 运行中 / `done` ⇒ 完成 —— 词出
 *      `docs/desktop/design/UI.md` §1 状态词闭枚举 6 词）；`data-status` = 原始码（**机器读面** —— 词面随语言变，
 *      码面不变 —— 判据面 = `docs/desktop/design/RENDERER.md` §1.1 判据面条）；表外码 ⇒ **零状态词节点**
 *      （沿 `views/chat-tool.mjs` `STATUS_WORD` 表外降级）；
 *   ③ **同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）—— 归挂载面帧内幂等（等值 ⇒ 零 DOM 写）；
 *   ④ 事项形单源 = `ev:task` 载荷 `{ title, status }`（核 `task` 工具三值）；标题串原样（**零构造**）。
 * 本档零 `store.mjs` import（零切片面）· 零 `node:` / 零裸包；文案一律经 `t()`。
 */
import { t } from "../i18n.mjs"

/** 核任务状态码 → 词键（码域 = 核 `task` 工具三值 ≠ `STATUS_WORD` 工具状态码域 ⇒ 本档自表；
 *  词键复用核域 `sub.*` 闭枚举 —— **零新词**）。表外码 ⇒ `null`（零状态词节点）。 */
const PLAN_WORD = Object.freeze({ pending: "sub.queued", in_progress: "sub.running", done: "sub.done" })

const hasText = (value) => typeof value === "string" && value.length > 0

/** 事项行：`data-status` = 原始码（非串 / 空串 ⇒ 不上属性 —— 零假造）；标题 / 状态词缺 ⇒ 相应零节点（`fill` 跳空位）。 */
function rowNode(item) {
  const code = item?.status
  const word = hasText(code) && Object.hasOwn(PLAN_WORD, code) ? t(PLAN_WORD[code]) : null
  return {
    tag: "div",
    props: { class: "plan-row", "data-status": hasText(code) ? code : undefined },
    children: [item?.title, word],
  }
}

/** 计划卡（纯构树 · 零 DOM · 零出口）：空列表 / 非数组 ⇒ `null`（**卡不在场**）。 */
export function planTree(items) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return null
  return {
    tag: "div",
    props: { class: "plan-card", "data-card": "task" },
    children: list.map((item) => rowNode(item)),
  }
}
