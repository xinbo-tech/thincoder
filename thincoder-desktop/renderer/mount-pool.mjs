/**
 * mount-pool.mjs — 右列（子 agent 面板）接线一族（自 `renderer/app.mjs` 出档 · 批档 §2.2(g) 在册预案）：
 * 右栏重挂（`paintPool` · 挂载面**纯读**现态）+ 审批出口（出站回执 ⇒ 成功摘项）+ 折叠出口（状态树随动）
 * + **停止出口**（`subagent:stop` —— R3b · D20；零乐观写：块折叠随事件面）+ 订阅切片键面（`POOL_KEYS`）。
 * 接线与卡面**同一路**（三出口描述符单源 = `renderer/views/approval.mjs`）。
 * `host` = 窄桥注入（本档零全局读）；零 `node:` / 零裸包（静态闭包判据 = `test/guard-closure.test.mjs`）；
 * `submitVerdict` / `stopSubagent` 零 DOM ⇒ 可注入假 store / 假 host 平 node 直测（U92 · U169）。
 */
import { applyFlags, clearApproval } from "./events.mjs"
import { store as defaultStore, togglePool } from "./store.mjs"
import { respondApproval } from "./views/approval.mjs"
import { mountPool } from "./views/activity.mjs"

export const POOL_SLOT = '[data-slot="pool"]' // 右列容器锚（= 滚动容器自身 —— 根描述符 props 复制到宿主）
/** 重挂触发切片（`activeTab`：折叠态按会话记忆 · `activeSession`：块表键〔子 agent 面板随已载入页〕·
 *  `subBlocks`：块表本身 · `locale`：文案随词表）。 */
export const POOL_KEYS = ["pool", "poolCollapsed", "activeTab", "activeSession", "subBlocks", "locale"]

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

/** 池面一族装配（装配期一次 · `host` = 窄桥）：收三出口（审批 / 折叠 / 停止）⇒ 返回挂载面 `paintPool` + 接线面
 *  `handlers`（挂载签名形 = `views/activity.mjs` `mountPool(root, state, handlers)` 的 handlers 面）。 */
export function attachPool(host) {
  /** 审批出口（卡面三出口 + 卡面键位同一路 · 薄壳）：出站与清除判据全归 `submitVerdict`。 */
  const onApprove = (promptId, verdict) => void submitVerdict({ store: defaultStore, host }, promptId, verdict)
  /** 折叠出口（`data-action="pool:toggle"` · 回执 = 本会话键）：纯动作 ⇒ 翻态；非串 / 无变化 ⇒ 原引用 ⇒ 零通知。 */
  const onTogglePool = (key) => defaultStore.set(togglePool(defaultStore.get(), key))
  /** 停止出口（`data-action="subagent:stop"` · 回执 = `{ key, id, role }` —— 薄壳）：出站与判据全归 `stopSubagent`。 */
  const onStopSubagent = (key, id, role) => void stopSubagent({ host }, key, id, role)
  /** 右栏重挂（挂载面**纯读**现态；容器缺位 ⇒ `mountPool` 空转）。 */
  const paintPool = (state = defaultStore.get()) => mountPool(document.querySelector(POOL_SLOT), state, { onApprove, onTogglePool, onStopSubagent })
  return { paintPool, handlers: { onApprove, onTogglePool, onStopSubagent } }
}
