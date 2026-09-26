/**
 * app.mjs — 渲染面引导（启动面 · 批档 §2.4）：`DOMContentLoaded` → `config:read` 往返 → 形合契约 ⇒ 词表置位（`initDict`）
 * + 状态树随动（`store.set`）+ 左列 / 中区外壳首绘 + `dataset.boot = "ok"`，否则 `"error"`（窄桥缺位 / 形不符 / 拒绝皆判
 * error —— **不静默回退**，冒烟即红）；路径族详规 = 批档 §2.2 / §2.12 / §2.13，本档只落接线。
 * 会话族：三路开标签**同一路**（`session:switch`（左列点行 / 标签激活）· `session:create`（左列空态 / 标签条新建）·
 * `session:resume`（`project:open` 成功后自动一次「点开即续」））⇒ 共用尾 `openResult`（开标签 + 开页 + 左列刷新）；
 * 关闭三出口（请求 / 确认 / 取消）皆走 `store.set(纯动作(现态))`（无变化 ⇒ 原引用 ⇒ 零通知），判据单源 = store `needsCloseConfirm`。
 * 帧出口（唯一）= `paintChat`：帧前判据 `paintPlan`（重挂键 = `activeSession` / `locale`）⇒ 重挂面（`mountChat` + 同帧态刷）
 * 或增量面（`alignPlan` ⇒ `settleFrame` 六步）；窗限 `chatLimit` **只增**（`nextWindow` 收束沿 + 本页**实并入块数**）。
 * 出档面：池面一族 = `renderer/mount-pool.mjs` · 事件归约 + 页应用 = `renderer/events.mjs` · 订阅接线 = `renderer/events-subscribe.mjs`；本档接线两处 = `attachScroll`
 * （回填 / 跟滚 / 停跟三出口 + 只读口 `guards()`；药丸回底 / 工具卡 toggle 两出口）· `attachEvents({ on })`（九通道订阅 ·
 * 退订句柄本批无消费点 —— 页面生命周期 = 进程生命周期）。
 * 读面失败一律 `console.error` + 零切片写（不静默）；零直连 IPC（只经窄桥 `window.thincoder.invoke`）；
 * 静态闭包零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 */
import { setBoot } from "./dom.mjs"
import { applyPage, openSession } from "./events.mjs"
import { attachEvents } from "./events-subscribe.mjs"
import { initDict } from "./i18n.mjs"
import { attachPool, POOL_KEYS } from "./mount-pool.mjs"
import { attachSettings } from "./mount-settings.mjs"
import { beginBackfill, cancelCloseTab, confirmCloseTab, configuredFlag, endBackfill, openTab, patchSettings, requestCloseTab, returnToBottom, setFollowing, store } from "./store.mjs"
import { mountRail, mountTabbar } from "./views/sessions.mjs"
import { mountHead, mountStatus } from "./views/chrome.mjs"
import { MAX_RENDER_BLOCKS, attachScroll, nextWindow } from "./views/chat-scroll.mjs"
import { alignPlan, paintPlan } from "./views/chat-stream.mjs"
import { chatModel, mountChat, settleFrame, syncChrome } from "./views/chat.mjs"
import { toggleExpanded } from "./views/chat-tool.mjs"

const host = globalThis.thincoder // 窄桥（装配面 = `src/preload/preload.cjs`）
const RAIL_SLOT = '[data-slot="projects"]' // 左列容器锚（骨架 = `renderer/index.html`）
const TABS_SLOT = '[data-slot="tabs"]' // 标签条容器锚（`.session` 首子元素——命中在挂载树根之前）
const HEAD_SLOT = '[data-slot="session-head"]' // 会话头槽
const STATUS_SLOT = '[data-slot="status"]' // 状态栏槽（窗口级底行）
const FLOW_SLOT = '[data-slot="flow"]' // 对话流容器锚（= 滚动容器自身 —— 挂载根不清宿主）
const RAIL_KEYS = ["project", "sessions", "locale"] // 重挂触发切片（`locale` 在内：文案随词表 ⇒ 树须重绘）
const SHELL_KEYS = ["tabs", "activeTab", "sessions", "tabBadges", "sessionMeta", "locale", "pendingClose"] // 外壳重挂触发切片
const CHAT_KEYS = ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool"] // 对话流帧触发切片（`locale` 在内：文案随词表 · `pool`：审批卡宿对话流）
const { paintPool, handlers: poolHandlers } = attachPool(host) // 池面一族（右栏重挂 + 两出口 —— 出档 `renderer/mount-pool.mjs`）
attachSettings(host, { onProjectOpened: openDir }) // 设置面 / 向导 / 信息行一族（自持订阅 —— 出档 `renderer/mount-settings.mjs`；目录出口复用项目面链）

/** 载荷形判据（`config:read` 往返：`{ config, locale, dict }`——三字段齐备才算往返成立）。 */
function isValidPayload(payload) {
  return (
    typeof payload?.config === "object" && payload.config !== null &&
    typeof payload.locale === "string" &&
    typeof payload.dict === "object" && payload.dict !== null
  )
}

/** `{ cwd, recent }` 形判据（`project:recent` 面；`cwd` = 未打开项目时 `null`）。 */
function isProject(payload) {
  return payload !== null && typeof payload === "object" && Array.isArray(payload.recent)
}

/** 左列重挂（挂载面**纯读**现态 —— 不改切片；容器缺位 ⇒ `mountRail` 空转）。 */
function paintRail(state = store.get()) {
  mountRail(document.querySelector(RAIL_SLOT), state, {
    onOpenDir: () => openDir(),
    onOpenRecent: openDir,
    onSession: activateSession, // 点行 ⇒ 激活并成标签（与标签激活同一路）
    onNewSession: createSession, // 空态新建入口
  })
}

/** 外壳重挂（中区三槽：标签条 / 会话头 / 状态栏 —— 挂载面**纯读**现态；容器缺位 ⇒ 各挂载函数空转）。
 *  标签条接线 = 五 handlers（激活 / 关闭 / 确认 / 取消 / 新建 —— 接线形通则 `docs/desktop/design/RENDERER.md` §1.1）。 */
function paintShell(state = store.get()) {
  mountTabbar(document.querySelector(TABS_SLOT), state, {
    onActivate: activateSession, // 激活即切换会话（与左列点行同一路）
    onClose: requestClose, // 关闭出口 1（需确认 ⇒ 确认面）
    onConfirmClose: confirmClose, // 关闭出口 2
    onCancelClose: cancelClose, // 关闭出口 3
    onNew: createSession,
  })
  mountHead(document.querySelector(HEAD_SLOT), state)
  mountStatus(document.querySelector(STATUS_SLOT), state)
}

/** 左列刷新（启动 / 切项目后 —— **唯一写路径**）：两读面并发 ⇒ 写切片 ⇒ 订阅面重挂。 */
async function refreshRail() {
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

/** `project:open`（打开目录 / 点最近项）：`path` 给定时直用、缺省走主进程原生目录选择；成功后同链刷新 +
 *  「成功」判据命中 ⇒ **自动一次** `session:resume`（点开即续）。 */
async function openDir(path) {
  try {
    const before = store.get().project?.cwd ?? null
    const receipt = await host.invoke("project:open", path ? { path } : undefined)
    await refreshRail()
    if (opened(receipt, before, path)) await resumeOpened()
  } catch (error) {
    console.error("[renderer] project:open failed:", error)
  }
}

/** 「成功」判据（该通道 fail-soft、**无成功旗标** —— `docs/desktop/design/IPC.md` §2 项目面注项 3）：回执 `cwd`
 *  变更 ∨ `cwd` = 请求 `path`；取消 / 无效路径（`cwd` 仍 `null` 或未变）⇒ 假；同目录经选择框重选（无 `path`、
 *  `cwd` 未变）⇒ 假 ⇒ **不重复接续**。 */
function opened(receipt, before, path) {
  const cwd = receipt?.cwd ?? null
  if (cwd === null) return false
  return cwd !== before || (typeof path === "string" && cwd === path)
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
function backfill() {
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
async function resumeOpened() {
  try {
    await openResult("session:resume", await host.invoke("session:resume"))
  } catch (error) {
    console.error("[renderer] session:resume failed:", error)
  }
}

/** 切会话（左列点行 / 标签激活 —— **同一路**：激活即切换）：`session:switch` ⇒ 共用尾。 */
async function activateSession(key) {
  try {
    await openResult("session:switch", await host.invoke("session:switch", { slot: slotOf(key) }), key)
  } catch (error) {
    console.error("[renderer] session:switch failed:", error)
  }
}

/** 新建会话（左列空态入口 / 标签条新建控件 —— **同一路**）：`session:create` ⇒ 共用尾。 */
async function createSession() {
  try {
    await openResult("session:create", await host.invoke("session:create"))
  } catch (error) {
    console.error("[renderer] session:create failed:", error)
  }
}

/** 关闭出口 1（关闭控件）：判据单源 = store `needsCloseConfirm` —— 状态码集命中 ⇒ 置待确认键（确认面重挂）；
 *  否则**直接关**。码集缺省 = `tabBadges` 无本键（`S1`：位标源随对话流 / 审批批落地）。 */
function requestClose(key) {
  const state = store.get()
  store.set(requestCloseTab(state, key, state.tabBadges?.[key] ?? []))
}

/** 关闭出口 2（确认键）：关该键 + 清待确认（邻位接管律 = store `closeTab`）。 */
function confirmClose() {
  store.set(confirmCloseTab(store.get()))
}

/** 关闭出口 3（取消键）：清待确认键（`tabs` / `activeTab` 不动）。 */
function cancelClose() {
  store.set(cancelCloseTab(store.get()))
}

// ─── 对话流接线（批 6 · 批档 §2.12 / §2.13）────────────────────────────────────

/** 帧窗限（模块级累计 —— **禁由 `blocks.length` 派生**：`none` / 短会话会把限归零 ⇒ 下一帧窗塌到 1）；
 *  收束沿只增（`nextWindow` —— 增量 = 本帧**实并入块数**）⇒ 块数有界（头部超出即由对齐步摘除）。 */
let chatLimit = MAX_RENDER_BLOCKS
let chatScroll = null // `attachScroll` handle（装配一次；容器缺位 ⇒ `null` ⇒ 帧尾零写）
let chatFrame = null // 上一帧记账 `{ state, mounted }`：`state` = 上帧树现态（帧前判据的 `prev`）· `mounted` = 对齐步输入

/** 工具卡折叠（接线第 2 处）：键域 = `data-block-id` 同域；未命中 / 无变化 ⇒ `toggleExpanded` 原引用 ⇒ 零通知。 */
function toggleTool(id) {
  store.set({ blocks: toggleExpanded(store.get().blocks, id) })
}

/** 回底复跟（接线第 1 处 · 药丸点击）：状态树复跟 + 清未读 ⇒ handle 平滑回底（程序化滚动记窗 ⇒ 不派发回波）。 */
function returnToLatest() {
  store.set(returnToBottom(store.get()))
  chatScroll?.returnToBottom()
}

/** 对话流帧出口（**唯一帧面**，订阅分流调用）：窗限 ⇒ 模型 ⇒ 帧前判据 ⇒ 重挂面（`mountChat` + 同帧态刷 ——
 *  §2.13：树已按新模型构建，幂等双刷无害）/ 增量面（`alignPlan` ⇒ `settleFrame` 六步）；零重合（`ok` 假）⇒
 *  回落重挂（对齐面不成立）。记账末行 = 本帧 `{ state, mounted }`（下帧输入）。 */
function paintChat(state = store.get(), changedKeys = []) {
  const root = document.querySelector(FLOW_SLOT)
  const inFlight = state.history?.inFlight === true
  const prev = chatFrame?.state ?? null
  const added = (state.blocks?.length ?? 0) - (prev?.blocks?.length ?? 0) // 并入量 = 本帧净增块数（整置 ⇒ 非正 ⇒ 零增）
  chatLimit = nextWindow({ limit: chatLimit, inFlight: prev?.history?.inFlight === true }, inFlight, added)
  const model = chatModel(state, chatLimit)
  const plan = paintPlan({ prev, next: state, changedKeys })
  const handlers = { onReturn: returnToLatest, onToggleTool: toggleTool, onApprove: poolHandlers.onApprove }
  let mounted
  if (plan.remount) {
    mounted = mountChat(root, state, handlers, chatLimit).mounted
    syncChrome(root, model, handlers)
  } else {
    const align = alignPlan(chatFrame?.mounted ?? [], model.blocks, plan.tier === "patch")
    if (align.ok) mounted = settleFrame(root, model, chatScroll, align, plan.tier, handlers)
    else {
      mounted = mountChat(root, state, handlers, chatLimit).mounted
      syncChrome(root, model, handlers)
    }
  }
  chatFrame = { state, mounted }
}

/** 引导：窄桥 ⇒ `config:read` 往返 ⇒ 词表置位 + 数据面刷新 ⇒ `boot = "ok"`（任一不合 ⇒ `"error"`）。 */
async function boot() {
  if (!host || typeof host.invoke !== "function") {
    console.error("[renderer] preload bridge missing: window.thincoder.invoke unavailable")
    return setBoot("error")
  }
  try {
    const payload = await host.invoke("config:read")
    if (!isValidPayload(payload)) {
      console.error("[renderer] config:read payload shape unexpected:", payload)
      return setBoot("error")
    }
    // 词表置位（返回归一后的语言 ⇒ `locale` 切片同源）+ 首启闸随新档态（`configuredFlag` 三态归一：档缺 ⇒ false；畸形 / 缺 ⇒ null ⇒ 向导不进）+ 订阅面随即首绘左列。
    store.set({ ...patchSettings(store.get(), { configured: configuredFlag(payload.configured) }), locale: initDict(payload) })
    await refreshRail() // 左列数据面（读失败不改 boot 判据 —— 读面自持错误面，不抬高引导位）
    return setBoot("ok")
  } catch (error) {
    console.error("[renderer] config:read failed:", error)
    return setBoot("error")
  }
}

document.addEventListener("DOMContentLoaded", boot)

/** 滚动接线（装配一次 · 批 6 + 批 8 回填档）：容器 = 对话流宿主自身（骨架 `data-slot="flow"`）；三出口 + 只读口
 *  只经 store 纯动作读写切片（`onBackfill` 判据单源 = `beginBackfill`）；容器缺位 ⇒ `null`（帧尾零写）。 */
chatScroll = attachScroll(document.querySelector(FLOW_SLOT), {
  onBackfill: backfill,
  onFollow: () => store.set(setFollowing(store.get(), true)),
  onUnfollow: () => store.set(setFollowing(store.get(), false)),
  guards: () => ({ hasOlder: store.get().history?.hasOlder === true, inFlight: store.get().history?.inFlight === true }),
})

/** 事件面接线（装配一次 · 批 8 · 批档 §2.11）：九通道订阅 ⇒ 值面写者单源 = `renderer/events.mjs`（归约）+ `renderer/events-subscribe.mjs`
 *  （订阅）；本档无消费点（页面生命周期 = 进程生命周期）。`on` 缺位 ⇒ 该档记错 + 空操作（不静默死订阅）。 */
attachEvents({ on: host?.on })

/** 订阅随动：`locale` 变更 ⇒ 镜像 `dataset.locale`（机器读面 —— **非面向用户文案**）；左列 / 中区外壳 / 对话流 / 活动池触发切片 ⇒ 各自重挂 / 帧出口。 */
store.subscribe((state, changedKeys) => {
  if (changedKeys.includes("locale")) document.documentElement.dataset.locale = state.locale
  if (changedKeys.some((key) => RAIL_KEYS.includes(key))) paintRail(state)
  if (changedKeys.some((key) => SHELL_KEYS.includes(key))) paintShell(state)
  if (changedKeys.some((key) => CHAT_KEYS.includes(key))) paintChat(state, changedKeys)
  if (changedKeys.some((key) => POOL_KEYS.includes(key))) paintPool(state)
})
