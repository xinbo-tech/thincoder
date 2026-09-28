/**
 * mount-pool.mjs — 右列（子 agent 面板）接线一族（自 `renderer/app.mjs` 出档 · 批档 §2.2(g) 在册预案）：
 * 右栏重挂（`paintPool` · 挂载面**纯读**现态）+ 审批出口（出站回执 ⇒ 成功摘项）+ 折叠出口（状态树随动）
 * + **停止出口**（`subagent:stop` —— R3b · D20；零乐观写：块折叠随事件面）+ **⏹ 点击委托**（「对齐第二批」项 3：
 * 核件停止钮无 `data-action` —— 载荷锚 `data-sub-id` / `data-sub-role`）+ **出生计数贴接线**（R10 E6 ——
 * `renderer/views/activity-new.mjs` `attachActivityNew` 幂等注册：钮点击回底 ∕ 近底清账 ∕ pin 旗标维护）
 * + 订阅切片键面（`POOL_KEYS`）。
 * 接线与卡面**同一路**（三出口描述符单源 = `renderer/views/approval.mjs`）。
 * `host` = 窄桥注入（本档零全局读）；零 `node:` / 零裸包（静态闭包判据 = `test/guard-closure.test.mjs`）；
 * `submitVerdict` / `stopSubagent` / `bindSubagentStop` 零 DOM 或一次性宿主注册 ⇒ 可注入假 store / 假 host 平 node 直测（U92 · U169）。
 */
import { applyFlags, clearApproval } from "./events.mjs"
import { store as defaultStore, togglePool } from "./store.mjs"
import { attachActivityNew } from "./views/activity-new.mjs"
import { respondApproval } from "./views/approval.mjs"
import { mountPool } from "./views/activity.mjs"

export const POOL_SLOT = '[data-slot="pool"]' // 右列容器锚（= 滚动容器自身 —— 根描述符 props 复制到宿主）
/** 重挂触发切片（`activeSession`：折叠态按会话记忆 + 块表键〔子 agent 面板随已载入页〕——　会话模型轮 R13：
 *  原 `activeTab` 键随标签裁撤退场，两读面同键 = `activeSession` · `subBlocks`：块表本身 · `locale`：文案随词表）。 */
export const POOL_KEYS = ["pool", "poolCollapsed", "activeSession", "subBlocks", "locale"]

/** 审批出口核心（零 DOM · 两面可注入）：窄桥 `approval:respond` ⇒ 回执 `ok === true` ⇒ **摘项**（`clearApproval`
 *  —— §2.11⑦：出站成功后才清，两侧同清）+ **模式位切片写**（状态栏对齐批 · `docs/desktop/design/IPC.md`
 *  §2「模式位投影注」项 5：成功径回执携 `{ key, flags }`〔宿主活值投影——桌内 AUTO 翻转后即刷新〕⇒
 *  `applyFlags` 与页读同点写 `sessionFlags[key]`；回执无 `flags`〔提问门径 / 失败径〔非 `ok`〕〕⇒ 零写）；
 *  失败 / 拒绝 / 抛 ⇒ **零乐观摘除**（原态、回 `false`；`respondApproval` 自记 `console.error`）。回执落地读
 *  **现刻**态 ⇒ 与并发事件零丢失更新（禁拿调用时刻的旧态回写）。 */
export async function submitVerdict({ store = defaultStore, host } = {}, promptId, verdict) {
  const receipt = await respondApproval(host, promptId, verdict)
  if (receipt?.ok !== true) return false
  store.set(applyFlags(clearApproval(store.get(), promptId), receipt.key, receipt.flags))
  return true
}

/** 停止出口核心（零 DOM · 零乐观写 —— 可注入假 host 平 node 直测）：窄桥 `subagent:stop` ⇒ 回执 `ok` 真 ⇒
 *  `true`（**零切片写** —— 块折叠随事件面 `⟦ev⟧stopped` / `⟦ev⟧cancelled` ⇒ `ev:subagent`）；失败 / 拒绝 / 抛
 *  ⇒ `console.error` + `false`（块原地不动 —— 可重试；零静默）。载荷 = `{ key, id, role? }`（identity 与
 *  `ev:subagent` 同源同值 —— `docs/desktop/design/IPC.md` §2 该行）。 */
export async function stopSubagent({ host } = {}, key, id, role) {
  try {
    const receipt = await host.invoke("subagent:stop", { key, id, ...(role ? { role } : {}) })
    if (receipt?.ok === true) return true
    console.error("[pool] subagent:stop rejected:", receipt?.reason ?? receipt)
    return false
  } catch (error) {
    console.error("[pool] subagent:stop failed:", error)
    return false
  }
}

/** 点击目标 → 停止钮（自底向上最近祖先 —— 核件钮子树（字形 / `title`）点按同径；无钮 ⇒ `null`）。 */
function stopButtonOf(target) {
  for (let node = target; node !== null && node !== undefined; node = node.parentNode) {
    if (node.classList?.contains?.("sub-stop-btn") === true) return node
  }
  return null
}

/** **⏹ 点击委托**（「对齐第二批」项 3 · 落点单源）：核件停止钮（`sub-stop-btn`）无 `data-action` ⇒ 在池宿主上
 *  一次注册（`_stopBound` 记账 —— 幂等）；载荷读 `data-sub-id` / `data-sub-role`，会话键 = 现刻活动会话
 *  （池面恒为活动会话块表）；非钮 / 无活动键 ⇒ 零动作（零误发）。回值 = 本次是否完成注册。 */
export function bindSubagentStop(root, host, store = defaultStore) {
  if (!root || typeof root.addEventListener !== "function" || root._stopBound === true) return false
  root._stopBound = true
  root.addEventListener("click", (event) => {
    const button = stopButtonOf(event?.target)
    if (button === null) return
    const key = store.get()?.activeSession ?? null
    if (typeof key !== "string" || key === "") return
    const id = typeof button.getAttribute === "function" ? button.getAttribute("data-sub-id") : null
    const role = typeof button.getAttribute === "function" ? button.getAttribute("data-sub-role") : null
    void stopSubagent({ host }, key, id, role)
  })
  return true
}

/** 池面一族装配（装配期一次 · `host` = 窄桥）：收两出口（审批 / 折叠）+ **⏹ 点击委托**（项 3）⇒ 返回挂载面 `paintPool`
 *  + 接线面 `handlers`（挂载签名形 = `views/activity.mjs` `mountPool(root, state, handlers)` 的 handlers 面）。 */
export function attachPool(host) {
  /** 审批出口（卡面三出口 + 卡面键位同一路 · 薄壳）：出站与清除判据全归 `submitVerdict`；**回值 = 回执 Promise**
   *  （R1：流内审批卡的失败径重挂判据读回执 `ok`；池面条目消费面零改 —— 同步返值语义不变，只多回一个 Promise）。 */
  const onApprove = (promptId, verdict) => submitVerdict({ store: defaultStore, host }, promptId, verdict)
  /** 折叠出口（`data-action="pool:toggle"` · 回执 = 本会话键）：纯动作 ⇒ 翻态；非串 / 无变化 ⇒ 原引用 ⇒ 零通知。 */
  const onTogglePool = (key) => defaultStore.set(togglePool(defaultStore.get(), key))
  /** 右栏重挂（挂载面**纯读**现态；容器缺位 ⇒ `mountPool` 空转）+ ⏹ 委托注册（幂等 —— 一次）+ 计数贴接线
   *  （R10 E6 —— 幂等；挂载面帧面重挂与事件接线两事分立）。 */
  const paintPool = (state = defaultStore.get()) => {
    const root = document.querySelector(POOL_SLOT)
    bindSubagentStop(root, host)
    attachActivityNew(root)
    return mountPool(root, state, { onApprove, onTogglePool })
  }
  return { paintPool, handlers: { onApprove, onTogglePool } }
}
