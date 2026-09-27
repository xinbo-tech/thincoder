/**
 * mount-sessions.mjs — 会话族接线（批 A 拆档：自 `renderer/app.mjs` 整族机械提取 · **零行为改** —— 越层预案 =
 * `docs/desktop/design/PROJECT.md` §4.1「现值 ⇒ 预期值」；原档 300 行硬闸在前 ⇒ 预案即生效）：
 * 三路开标签**同一路**（`session:switch`（左列点行 / 标签激活）· `session:create`（左列空态 / 标签条新建）·
 * `session:resume`（`project:open` 成功后自动一次「点开即续」））⇒ 共用尾 `openResult`（开标签 + 开页 + 左列刷新）；
 * 关闭三出口（请求 / 确认 / 取消）皆走 `store.set(纯动作(现态))`（无变化 ⇒ 原引用 ⇒ 零通知），判据单源 = store `needsCloseConfirm`；
 * 关标签 ⇒ **页随动**（三出口共用尾 `closeTail`：关活动 ⇒ `activateSession(邻位键)` 同一路 · 关唯一 ⇒ 关页 ·
 * 余 ⇒ 零动作 —— 批 A ⑥）· 删除会话回执 `ok` ⇒ 同源出口（`closeTab` + 同尾）。
 * 导出面 = `renderer/app.mjs` 消费集（接线串仍住该档 —— 挂载面 `renderer/views/sessions.mjs` 纯读现态）：
 * `refreshRail`（启动 / 切项目 / 会话路三出口后 —— **唯一写路径**）· `backfill`（对话流回填出口）· `resumeOpened` ·
 * `activateSession` · `createSession` · `requestClose` / `confirmClose` / `cancelClose`（关闭三出口 · 尾随页随动 · 批 A ⑥）·
 * 左列行动作 `renameSession` / `deleteSession` / `cancelRailForm` / `confirmRename` / `confirmDelete`（批 A ④）；
 * `isProject` / `slotOf` / `loadPage` / `openPage` / `openResult` / `closeTail` = 本档私有。
 * 窄桥 = 本档模块级 `globalThis.thincoder`（装配面 = `src/preload/preload.cjs` —— 与 `renderer/app.mjs` 同源同刻读取）。
 * 纪律：本档零 DOM / 零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）；读面失败一律 `console.error` + 零切片写。
 */
import { applyPage, openSession } from "./events.mjs"
import { beginBackfill, cancelCloseTab, closeRailForm, closeTab, confirmCloseTab, endBackfill, openRailForm, openTab, requestCloseTab, store } from "./store.mjs"

const host = globalThis.thincoder // 窄桥（装配面 = `src/preload/preload.cjs`）

/** `{ cwd, recent }` 形判据（`project:recent` 面；`cwd` = 未打开项目时 `null`）。 */
function isProject(payload) {
  return payload !== null && typeof payload === "object" && Array.isArray(payload.recent)
}

/** 左列刷新（启动 / 切项目后 —— **唯一写路径**）：两读面并发 ⇒ 写切片 ⇒ 订阅面重挂。 */
export async function refreshRail() {
  try {
    const [project, list] = await Promise.all([host.invoke("project:recent"), host.invoke("sessions:list")])
    if (!isProject(project) || !Array.isArray(list?.rows)) {
      console.error("[renderer] rail payload shape unexpected:", project, list)
      return
    }
    store.set({ project: { cwd: project.cwd ?? null, recent: project.recent }, sessions: list.rows })
  } catch (error) {
    console.error("[renderer] rail refresh failed:", error)
  }
}

// ─── 会话族接线（批 5 · 批档 §2.2（f）· 批 8 补页读两径）────────────────────────

/** 槽号回代：视图面行键 / 标签键是**串**（键域），通道载荷 `{ slot }` 是槽号域 —— 核写本端记录时**原值落盘**
 *  （`thincoder-core/session-slots.mjs:133`）且读面要求整数槽（同档 `:126` `Number.isInteger`）⇒ 串入会使本端记录
 *  退化为「缺失」。纯类型回代（非整数 ⇒ 原值直传，交核判 —— 端层**零预校验**：判据单源 = 核）。 */
function slotOf(key) {
  const slot = Number(key)
  return Number.isInteger(slot) ? slot : key
}

/** 页读（首屏 `before = null` / 回填 = 页游标）：`history:page` ⇒ `applyPage` 落态；抛 / 拒绝 ⇒ 记错 + 清在途（成败皆清）。 */
async function loadPage(key, before) {
  try {
    const receipt = await host.invoke("history:page", { key, before })
    store.set(applyPage(store.get(), receipt, { key, before }))
  } catch (error) {
    console.error("[renderer] history:page failed:", error)
    store.set(endBackfill(store.get()))
  }
}

/** 开页（三路开标签**同一路**）：键面动作（`openSession` ⇒ `activeSession` + 清本键 `done` 位标）+ 首屏页读。 */
function openPage(key) {
  store.set(openSession(store.get(), key))
  void loadPage(key, null)
}

/** 触顶回填（接线态）：判据单源 = store `beginBackfill`（无更早页 / 重入 ⇒ 原引用 ⇒ 零动作、零页读）；受理 ⇒ 页读。 */
export function backfill() {
  const state = store.get()
  const next = beginBackfill(state, { page: state.history?.page ?? null })
  if (next === state) return
  store.set(next)
  void loadPage(next.activeSession, next.history.page)
}

/** 会话路三出口**共用尾**（三路 = 同一路）：`ok` ⇒ 开标签 + 开页 + 左列刷新；否则只记错（零切片写、界面照旧）。 */
async function openResult(channel, receipt, context) {
  if (receipt?.ok !== true) {
    if (context !== undefined) console.error(`[renderer] ${channel} failed:`, receipt?.reason, "slot:", context)
    else console.error(`[renderer] ${channel} failed:`, receipt?.reason)
    return
  }
  const key = String(receipt.slot)
  store.set(openTab(store.get(), key))
  openPage(key)
  await refreshRail()
}

/** 点开即续（`project:open` 成功后自动一次 —— 该通道恒 `ok`：核判据兜底分配新槽）。 */
export async function resumeOpened() {
  try {
    await openResult("session:resume", await host.invoke("session:resume"))
  } catch (error) {
    console.error("[renderer] session:resume failed:", error)
  }
}

/** 切会话（左列点行 / 标签激活 —— **同一路**：激活即切换）：`session:switch` ⇒ 共用尾。 */
export async function activateSession(key) {
  try {
    await openResult("session:switch", await host.invoke("session:switch", { slot: slotOf(key) }), key)
  } catch (error) {
    console.error("[renderer] session:switch failed:", error)
  }
}

/** 新建会话（左列空态入口 / 标签条新建控件 —— **同一路**）：`session:create` ⇒ 共用尾。 */
export async function createSession() {
  try {
    await openResult("session:create", await host.invoke("session:create"))
  } catch (error) {
    console.error("[renderer] session:create failed:", error)
  }
}

/** 关标签三出口**共用尾**（**页随动** —— `docs/desktop/design/RENDERER.md` §1 页生命周期第三 / 第四口径 · T-DSK26）：
 *  判据 = `activeTab` 前后差 —— 关**活动**（邻位接管）⇒ `activateSession(邻位键)`（`session:switch` ⇒ 邻位页读，
 *  与左列点行 / 标签激活**同一路**）；关**唯一**（`activeTab = null`）⇒ `openSession(state, null)` 关页
 *  （**不发** `session:switch`；中区 `none` 态 = 零节点）；关非活动 / 拒收 / 待确认 ⇒ **零动作**（键未变 ⇒ 页不动）。 */
function closeTail(before) {
  const after = store.get()
  if (after.activeTab === before.activeTab) return
  if (after.activeTab === null) store.set(openSession(after, null))
  else void activateSession(after.activeTab)
}

/** 关闭出口 1（关闭控件）：判据单源 = store `needsCloseConfirm` —— 状态码集命中 ⇒ 置待确认键（确认面重挂）；
 *  否则**直接关**。码集缺省 = `tabBadges` 无本键（`S1`：位标源随对话流 / 审批批落地）；尾随页随动。 */
export function requestClose(key) {
  const before = store.get()
  store.set(requestCloseTab(before, key, before.tabBadges?.[key] ?? []))
  closeTail(before)
}

/** 关闭出口 2（确认键）：关该键 + 清待确认（邻位接管律 = store `closeTab`）⇒ 尾随页随动。 */
export function confirmClose() {
  const before = store.get()
  store.set(confirmCloseTab(before))
  closeTail(before)
}

/** 关闭出口 3（取消键）：清待确认键（`tabs` / `activeTab` 不动 ⇒ 页零动 —— 不走尾）。 */
export function cancelClose() {
  store.set(cancelCloseTab(store.get()))
}

// ─── 左列行动作（批 A ④ · `docs/desktop/design/UI.md` §1 左列会话行）────────────────

/** 改名出口（行内改名控件）：开换形态（态单源 = store `railForm`）；词面读数 = 接线面读在形文本控件
 *  （`renderer/app.mjs` 确认时读值 —— 本档零 DOM）。 */
export function renameSession(key) {
  store.set(openRailForm(store.get(), key, "rename"))
}

/** 删除出口（行内删除控件）：开换形态（**零 `window.confirm`** —— 确认面 = 行原位换两键）。 */
export function deleteSession(key) {
  store.set(openRailForm(store.get(), key, "delete"))
}

/** 换形取消（两形共用出口）：清形态（`tabs` / `activeTab` 不动 ⇒ 页零动）。 */
export function cancelRailForm() {
  store.set(closeRailForm(store.get()))
}

/** 改名确认（应用两态之二）：`ok` 真 ⇒ 清形态 + 左列刷新（新标题可见）；`ok:false` / 抛 ⇒ **留场**（草稿不丢）+ 记错。 */
export async function confirmRename(key, text) {
  try {
    const receipt = await host.invoke("session:rename", { slot: slotOf(key), title: text })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:rename failed:", receipt?.reason, "slot:", key)
      return
    }
    store.set(closeRailForm(store.get()))
    await refreshRail()
  } catch (error) {
    console.error("[renderer] session:rename failed:", error)
  }
}

/** 删除确认（应用两态之二 —— 同源出口）：`ok` 真 ⇒ 清形态 + 键面 `closeTab(本键)` + 关闭尾（活动 ⇒ 邻位接管 ·
 *  唯一 ⇒ 关页）+ 左列刷新；`ok:false`（核拒）⇒ **零动作**（不造死标签 —— 已删键的 `session:switch` 必拒）+ 记错。 */
export async function confirmDelete(key) {
  try {
    const receipt = await host.invoke("session:delete", { slot: slotOf(key) })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:delete failed:", receipt?.reason, "slot:", key)
      return
    }
    const before = store.get()
    store.set(closeRailForm(closeTab(before, key)))
    closeTail(before)
    await refreshRail()
  } catch (error) {
    console.error("[renderer] session:delete failed:", error)
  }
}
