/**
 * session-wire.mjs — 会话族**接线面**出档（越线档结构轮 · 台账 #536）：自 `renderer/mount-sessions.mjs` 全量迁出
 * 〔原 `:244-406`〕——接线面 + 通道出口 + 归一助手，**结构拆分零语义**（面不变 ∕ 判据不变，只换宿主档；
 * 切点 ∕ 缝单源 = 批档 `docs/batches/2026-09-29-structure-split-round.md` §2.2-B）。
 *
 * 接线：会话路三出口**同一路**（`session:switch` / `session:create` / `session:resume`）⇒ 共用尾 `openResult`
 * （开页 `openPage` + 列表刷新 `refreshRail`）；`backfill` = 触顶回填出口；删会话 `ok` ⇒ 列表刷新 + **删活动会话 ⇒
 * 邻位接管**（会话列表形：同位置行，越界取末行；列表空 ⇒ 关页）—— `ok:false`（核拒：末项门 ∕ 槽缺）
 * ⇒ **零动作** + 记错。
 *
 * 导出面（七名同名再出口 —— `renderer/mount-sessions.mjs` 转口 ∕ `app.mjs` 导入面零改）：`refreshRail`（启动 /
 * 切项目 / 会话路三出口后 —— **唯一写路径**）· `backfill` · `resumeOpened` · `activateSession` · `createSession` ·
 * `confirmRename` / `deleteSession`（两出口 ∥ popover 确认）；私有面 = `isProject` ∕ `slotOf` ∕ `loadPage` /
 * `openPage` / `openResult`。
 * 零环：本档不引主档（handlers 注入制）；主档只经同名再出口转口本档七名（方向单行）。
 * 窄桥 = 本档模块级 `globalThis.thincoder`（装配面 = `src/preload/preload.cjs` —— 与主档同刻约定）。
 * 纪律：读面失败一律 `console.error` + **核件 toast 可见提示**（R9 · #486：会话开回执拒 ∕ 调用抛 ∕ 页读抛三失败面；
 * **#556 增改名失败两径**（回执拒 ∕ 抛）· **#578③ 增删除失败两径**（回执拒 ∕ 抛）· **#637 增受占切换警告半幅**
 * （成立径 `occupied: true` ⇒ `session.occupied` toast —— CLI 形「警告 + 继续」）——载体 = 核 `toast.mjs`，词面 = 端词表）
 * + 零切片写（失败径不写切片）；零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 */
import { openSession } from "./events.mjs"
// 页读径拆分产出（「对齐第二批」）——硬限拆档，结构拆分零语义
import { applyPage } from "./page-read.mjs"
import { t } from "./i18n.mjs"
import { beginBackfill, endBackfill, store } from "./store.mjs"
// 失败面可见提示载体（R9 · #486 —— 核件 toast；词面 = 端词表 `session.*`）
import { showToast } from "/rc/toast.mjs"

// 窄桥（装配面 = `src/preload/preload.cjs`）
const host = globalThis.thincoder

// ─── 会话族接线（批 5 · 批档 §2.2（f）· 批 8 补页读两径）────────────────────────

/** `{ cwd, recent }` 形判据（`project:recent` 面；`cwd` = 未打开项目时 `null`）。 */
function isProject(payload) {
  return payload !== null && typeof payload === "object" && Array.isArray(payload.recent)
}

/** 列表刷新（启动 / 切项目 / 会话路三出口后 —— **唯一写路径**）：两读面并发 ⇒ 写切片 ⇒ 订阅面重挂（下拉列表供给）。 */
export async function refreshRail() {
  try {
    const [project, list] = await Promise.all([host.invoke("project:recent"), host.invoke("sessions:list")])
    if (!isProject(project) || !Array.isArray(list?.sessions)) {
      console.error("[renderer] session list payload shape unexpected:", project, list)
      return
    }
    store.set({ project: { cwd: project.cwd ?? null, recent: project.recent }, sessions: list.sessions, ledger: list.ledger ?? null })
  } catch (error) {
    console.error("[renderer] session list refresh failed:", error)
  }
}

/** 槽号回代：视图面行键 / 条目键是**串**（键域），通道载荷 `{ slot }` 是槽号域 —— 核写本端记录时**原值落盘**
 *  （`thincoder-core/session-slots.mjs:133`）且读面要求整数槽（同档 `:126` `Number.isInteger`）⇒ 串入会使本端记录
 *  退化为「缺失」。纯类型回代（非整数 ⇒ 原值直传，交核判 —— 端层**零预校验**：判据单源 = 核）。 */
function slotOf(key) {
  const slot = Number(key)
  return Number.isInteger(slot) ? slot : key
}

/** 失败因归一（端既有口径 = `composer-wire.mjs` `reasonOf`：非空串直取，余回落 `unknown`）—— toast 插值面。 */
function reasonOf(receipt) {
  return typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "unknown"
}

/** 页读（首屏 `before = null` / 回填 = 页游标）：`history:page` ⇒ `applyPage` 落态；抛 / 拒绝 ⇒ 记错 + 清在途（成败皆清）。 */
async function loadPage(key, before) {
  try {
    const receipt = await host.invoke("history:page", { key, before })
    store.set(applyPage(store.get(), receipt, { key, before }))
  } catch (error) {
    console.error("[renderer] history:page failed:", error)
    showToast(t("session.loadFailed")) // R9 · #486：页读失败 ⇒ 可见提示（载入失败不静默）
    store.set(endBackfill(store.get()))
  }
}

/** 开页（三路开会话**同一路**）：键面动作（`openSession` ⇒ `activeSession` + 清本键 `done` 位标）+ 首屏页读。 */
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

/** 会话路三出口**共用尾**（三路 = 同一路）：`ok` ⇒ 开页 + 列表刷新（**#637：受占切换 ⇒ 先可见警告**）；
 *  否则记错 + **可见提示**（R9 · #486 —— VSC 会话族三档 `showWarningMessage` 对位；零切片写、界面照旧）。 */
async function openResult(channel, receipt, context) {
  if (receipt?.ok !== true) {
    if (context !== undefined) console.error(`[renderer] ${channel} failed:`, receipt?.reason, "slot:", context)
    else console.error(`[renderer] ${channel} failed:`, receipt?.reason)
    showToast(t("session.openFailed", { reason: reasonOf(receipt) }))
    return false
  }
  // #637（受占切换半幅）：核受占 = 切换成立（不认领 + 次存 fork —— 核 `session-lifecycle.mjs` D-SE33）
  // ⇒ `session:switch` 回执携 `occupied: true`（非受占 ⇒ 键缺席）；本处 = CLI 形「警告 + 继续」的警告半幅
  // （词面 = 端词表 `session.occupied`；VSC 拒径不对位 —— 桌面走核直转非面板）。
  if (receipt.occupied === true) showToast(t("session.occupied"))
  openPage(String(receipt.slot))
  await refreshRail()
  return true
}

/** 点开即续（`project:open` 成功后自动一次 —— 该通道恒 `ok`：核判据兜底分配新槽）。 */
export async function resumeOpened() {
  try {
    await openResult("session:resume", await host.invoke("session:resume"))
  } catch (error) {
    console.error("[renderer] session:resume failed:", error)
    showToast(t("session.openFailed", { reason: String(error?.message ?? error) })) // R9 · #486：调用抛同理可见
  }
}

/** 切会话（下拉点条目 —— **同一路**：切换即开页）：`session:switch` ⇒ 共用尾。 */
export async function activateSession(key) {
  try {
    return await openResult("session:switch", await host.invoke("session:switch", { slot: slotOf(key) }), key)
  } catch (error) {
    console.error("[renderer] session:switch failed:", error)
    showToast(t("session.openFailed", { reason: String(error?.message ?? error) })) // R9 · #486：调用抛同理可见
    return false
  }
}

/** 新建会话（新建钮出口）：`session:create` ⇒ 共用尾。 */
export async function createSession() {
  try {
    return await openResult("session:create", await host.invoke("session:create"))
  } catch (error) {
    console.error("[renderer] session:create failed:", error)
    showToast(t("session.openFailed", { reason: String(error?.message ?? error) })) // R9 · #486：调用抛同理可见
    return false
  }
}

/** 改名出口（下拉条目 ✎ 换形后的确认键 —— 通道既有）：`ok` 真 ⇒ 列表刷新（新标题可见）+ 回 `true`（面收形）；
 *  `ok:false`（核拒：`invalid-slot` ∕ `mtime-conflict` 等四值闭集直传）∕ 抛 ⇒ **零写零收形**（草稿不丢）+ 记错
 *  + **可见提示**（toast —— #556：对位 VSC `panel-messages-session.mjs:96` 改名失败提示；词面同 `session.openFailed` 族）。 */
export async function confirmRename(key, text) {
  try {
    const receipt = await host.invoke("session:rename", { slot: slotOf(key), title: text })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:rename failed:", receipt?.reason, "slot:", key)
      showToast(t("session.renameFailed", { reason: reasonOf(receipt) })) // #556：失败面可见（回执拒径）
      return false
    }
    await refreshRail()
    return true
  } catch (error) {
    console.error("[renderer] session:rename failed:", error)
    showToast(t("session.renameFailed", { reason: String(error?.message ?? error) })) // #556：调用抛同理可见
    return false
  }
}

/** 删除出口（确认 popover 的「删除」键 —— 通道既有）：`ok` 真 ⇒ 列表刷新 + **删活动会话 ⇒ 邻位接管**
 *  （`closeTab` 同律的会话列表形：同位置行〔越界取末行〕⇒ `session:switch` 同一路；列表空 ⇒ 关页）；
 *  `ok:false`（核拒：末项门 `last-session` ∕ `slot-missing`）∕ 抛 ⇒ **零动作**（不造死页）+ 记错
 *  + **可见提示**（toast —— #578③：删除失败径同 toast 面；词面同 `session.openFailed` 族）。 */
export async function deleteSession(key) {
  try {
    const before = store.get()
    const rows = Array.isArray(before.sessions) ? before.sessions : []
    const index = rows.findIndex((row) => String(row?.slot) === String(key))
    const wasActive = String(before.activeSession ?? "") === String(key)
    const receipt = await host.invoke("session:delete", { slot: slotOf(key) })
    if (receipt?.ok !== true) {
      console.error("[renderer] session:delete failed:", receipt?.reason, "slot:", key)
      showToast(t("session.deleteFailed", { reason: reasonOf(receipt) })) // #578③：失败面可见（回执拒径）
      return false
    }
    await refreshRail()
    if (wasActive) await takeover(index)
    return true
  } catch (error) {
    console.error("[renderer] session:delete failed:", error)
    showToast(t("session.deleteFailed", { reason: String(error?.message ?? error) })) // #578③：调用抛同理可见
    return false
  }
}

/** 删活动会话后的接管（**邻位接管律**会话列表形）：同位置行（越界取末行）⇒ 切会话同一路；列表空 ⇒ 关页。 */
async function takeover(index) {
  const rows = store.get().sessions ?? []
  if (rows.length === 0) {
    store.set(openSession(store.get(), null))
    return
  }
  const at = Math.min(Math.max(index, 0), rows.length - 1)
  await activateSession(String(rows[at]?.slot))
}
