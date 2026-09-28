/**
 * app.mjs — 渲染面引导（启动面 · 批档 §2.4）：`DOMContentLoaded` → `config:read` 往返 → 形合契约 ⇒ 词表置位（`initDict`）
 * + 状态树随动（`store.set`）+ 左列 / 中区外壳首绘 + `dataset.boot = "ok"`，否则 `"error"`（窄桥缺位 / 形不符 / 拒绝皆判
 * error —— **不静默回退**，冒烟即红）；路径族详规 = 批档 §2.2 / §2.12 / §2.13，本档只落接线。
 * 会话族（出档 `renderer/mount-sessions.mjs`）：三路开标签**同一路**（`session:switch` / `session:create` /
 * `session:resume`）+ 关闭三出口（请求 / 确认 / 取消）—— 判据单源 = store `needsCloseConfirm`；行内改名 / 删除两控件
 * （批 A ④）+ 换形四键 ⇒ 左列十 handlers；改名确认的**文面读数**亦住本档（视图档零 DOM）。
 * 本档只留接线串与目录出口链。
 * 帧出口（唯一）= `paintChat`：帧前判据 `paintPlan`（重挂键 = `activeSession` / `locale`）⇒ 重挂面（`mountChat` + 同帧态刷）
 * 或增量面（`alignPlan` ⇒ `settleFrame` 六步）；窗限 `chatLimit` **只增**（`nextWindow` 收束沿 + 本页**实并入块数**）。
 * 出档面：池面一族 = `renderer/mount-pool.mjs` · 会话族 = `renderer/mount-sessions.mjs` · 输入区 = `renderer/mount-composer.mjs`
 * · 会话头接线 = `renderer/mount-head.mjs`（候选面 / 写路 `session:prefs` / 回执刷行 —— 头面刷行调用点仍住本档）
 * · 状态行 = `renderer/mount-status.mjs`（D17 / D22 承载 16 段单点重建 + 订阅切片键面 `STATUS_KEYS`）
 * · 卡族两族 = `renderer/mount-cards.mjs`（提问 / 计划 —— 挂载 + 作答 / 取消出口）
 * · 事件归约 + 页应用 = `renderer/events.mjs` · 订阅接线 = `renderer/events-subscribe.mjs`；本档接线两处 = `attachScroll`
 * （回填 / 跟滚 / 停跟三出口 + 只读口 `guards()`；药丸回底 / 工具卡 toggle 两出口）· `attachEvents({ on, onTurnTail })`
 * （多通道订阅 + 回合尾 flush 窄口 —— 批档 §1.14）；退订句柄本档无消费点 —— 页面生命周期 = 进程生命周期。
 * 读面失败一律 `console.error` + 零切片写（不静默）；零直连 IPC（只经窄桥 `window.thincoder.invoke`）；
 * 剪贴板写效应（`writeText`）**单点供给** = 本档（同给对话流 handlers 与输入区 `attachComposer` —— 复制面唯一实现处）；
 * 核件取词注册（「对齐第二批」修复轮）= 本档模块级一次 `setStringsSink(setStrings)`（注册单点；词表合并式仍单点居 `renderer/i18n.mjs` `initDict`）。
 * 静态闭包零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 * **「对齐第三批」三接线（本档）**：错误横幅重试（项 9 —— `onRetry` ⇒ 输入区直发径单副本）· 文件链接 `file:open` 委托注册（相抵②）· 2s 拍单点（P7 + `unload` 清点）。
 */
import { setBoot } from "./dom.mjs"
import { attachEvents } from "./events-subscribe.mjs"
import { createHeartbeat, refreshLiveBlocks } from "./heartbeat.mjs"
import { initDict, setStringsSink } from "./i18n.mjs"
import { setStrings } from "/rc/i18n.mjs"
import { attachCards, CARDS_KEYS } from "./mount-cards.mjs"
import { attachComposer, submitDraft } from "./mount-composer.mjs"
import { attachHead } from "./mount-head.mjs"
import { POOL_SLOT, attachPool, POOL_KEYS } from "./mount-pool.mjs"
import { attachStatus, STATUS_KEYS } from "./mount-status.mjs"
import {
  activateSession, backfill, cancelClose, cancelRailForm, confirmClose, confirmDelete, confirmRename,
  createSession, deleteSession, refreshRail, renameSession, requestClose, resumeOpened,
} from "./mount-sessions.mjs"
import { attachSettings } from "./mount-settings.mjs"
import { configuredFlag, patchSettings, returnToBottom, setFollowing, store } from "./store.mjs"
import { mountRail, mountTabbar } from "./views/sessions.mjs"
import { mountHead } from "./views/chrome.mjs"
import { MAX_RENDER_BLOCKS, attachScroll, nextWindow } from "./views/chat-scroll.mjs"
import { alignPlan, paintPlan } from "./views/chat-stream.mjs"
import { chatModel, mountChat, retrySourceOf, settleFrame } from "./views/chat.mjs"
import { focusAutofocus, syncChrome } from "./views/chat-chrome.mjs"
import { bindFileLinks, toggleExpanded } from "./views/chat-tool.mjs"

// 核件取词注册（「对齐第二批」修复轮 · 注册单点）：模块求值先于 `DOMContentLoaded` ⇒ 先注册、后 `initDict`
// （合并式）经此端出；核件供体 `/rc/i18n.mjs` 居本浏览器专属档（平 node 装载面 = `renderer/i18n.mjs`）。
setStringsSink(setStrings)

const host = globalThis.thincoder // 窄桥（装配面 = `src/preload/preload.cjs`）
/** 剪贴板写效应（复制面**唯一实现处** —— `docs/desktop/design/UI.md` §1「批 B 注」项 4）：宿主无面 ⇒ `undefined`
 *  （控件落 `disabled` —— 诚实非死控，`views/chat-copy.mjs` 两态通则）。 */
const writeText =
  typeof globalThis.navigator?.clipboard?.writeText === "function"
    ? (value) => globalThis.navigator.clipboard.writeText(value)
    : undefined
const RAIL_SLOT = '[data-slot="projects"]' // 左列容器锚（骨架 = `renderer/index.html`）
const TABS_SLOT = '[data-slot="tabs"]' // 标签条容器锚（`.session` 首子元素——命中在挂载树根之前）
const HEAD_SLOT = '[data-slot="session-head"]' // 会话头槽（状态行槽锚随状态行族出档 —— `renderer/mount-status.mjs`）
const FLOW_SLOT = '[data-slot="flow"]' // 对话流容器锚（= 滚动容器自身 —— 挂载根不清宿主）
// 重挂触发切片（`locale` 在内：文案随词表 ⇒ 树须重绘；`railForm` = 换形态切片——行原位换形；`ledger` = 账本警示切片）
const RAIL_KEYS = ["project", "sessions", "locale", "railForm", "ledger"]
const SHELL_KEYS = ["tabs", "activeTab", "sessions", "tabBadges", "sessionMeta", "locale", "pendingClose"] // 外壳重挂触发切片
const CHAT_KEYS = ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool", "project", "pending", "digest", "stopMark", "ledgerLines"] // 对话流帧触发切片（`locale` 在内：文案随词表 · `pool`：审批卡宿对话流 · `project`：引导码随 cwd——批 B 追加轮 · `pending`：流内待发送气泡组——「对齐第二批」项 2 · `digest`：流内消化行组——桌面空闲唤醒批 · `stopMark` / `ledgerLines`：两尾组的单变触发 —— 「对齐第三批」项 6 / 12；`settings` 不入表 —— 欢迎条文案二值随重挂径，且帧尾态刷判据 = 码面（见 `renderer/views/chat-guide.mjs`））
const { paintPool, handlers: poolHandlers } = attachPool(host) // 池面一族（右栏重挂 + 两出口 —— 出档 `renderer/mount-pool.mjs`）
const { paintCards } = attachCards(host) // 卡面一族（提问 / 计划 —— 挂载 + 作答 / 取消出口；出档 `renderer/mount-cards.mjs`）
// 设置面 / 向导 / 信息行一族（自持订阅 —— 出档 `renderer/mount-settings.mjs`；目录出口复用项目面链）；
// 句柄捕获 = 信息行复读口（#461 —— `openDir` 成功链消费 `refreshInfo`，零第二订阅点）。
const settingsFace = attachSettings(host, { onProjectOpened: openDir })
const { flushTurnTail } = attachComposer(host, { writeText }) // 输入区一族（挂载 + handlers + 回合尾 flush 句柄 —— 出档 `renderer/mount-composer.mjs`）
const head = attachHead({ host, onRepaint: () => paintHead() }) // 会话头接线一族（候选面 + 写路 `session:prefs` —— 出档 `renderer/mount-head.mjs`）
const { paintStatus } = attachStatus() // 状态行一族（D17 / D22 承载 16 段单点重建 —— 出档 `renderer/mount-status.mjs`）

/** 载荷形判据（`config:read` 往返：`{ config, locale, dict }`——三字段齐备才算往返成立）。 */
function isValidPayload(payload) {
  return (
    typeof payload?.config === "object" && payload.config !== null &&
    typeof payload.locale === "string" &&
    typeof payload.dict === "object" && payload.dict !== null
  )
}

/** 左列重挂（挂载面**纯读**现态 —— 不改切片；容器缺位 ⇒ `mountRail` 空转）。接线 = **十 handlers**（点行 / 新建 /
 *  行内改名 · 删除 / 换形四键 —— 批 A ④；接线形通则 `docs/desktop/design/RENDERER.md` §1.1）。 */
function paintRail(state = store.get()) {
  mountRail(document.querySelector(RAIL_SLOT), state, {
    onOpenDir: () => openDir(),
    onOpenRecent: openDir,
    onSession: activateSession, // 点行 ⇒ 激活并成标签（与标签激活同一路）
    onNewSession: createSession, // 空态新建入口
    onRename: renameSession, // 行内改名控件 ⇒ 开换形态（该行原位换文本控件 + 两键）
    onDelete: deleteSession, // 行内删除控件 ⇒ 开换形态（原位换两键确认面 —— 零 `window.confirm`）
    onRenameCancel: cancelRailForm, // 取消 = 两形共用出口（清形态 · 页零动）
    onDeleteCancel: cancelRailForm,
    onRenameConfirm: confirmRenameText, // 应用两态之一：读在形控件值 ⇒ 通道往返
    onDeleteConfirm: confirmDelete, // 应用两态之二：通道往返 ⇒ `closeTab` + 关闭尾
  })
}

/** 改名确认（**词面读数 = 接线面** —— 视图档零 DOM）：读在形文本控件值 ⇒ `confirmRename`；
 *  控件缺位（形态刚清 / 宿主异常）⇒ **零动作 + 记错**（不静默）。 */
function confirmRenameText(key) {
  const input = document.querySelector(`${RAIL_SLOT} [data-action="session:rename-input"]`)
  if (input === null) {
    console.error("[renderer] rename input missing for slot:", key)
    return
  }
  void confirmRename(key, String(input.value ?? ""))
}

/** 会话头刷行（单行调用点 —— 供写路回退 / 候选面后到 / 外壳重挂三径；handlers 两出口 = 候选面纯读 + 写路）。 */
function paintHead(state = store.get()) {
  mountHead(document.querySelector(HEAD_SLOT), state, { candidates: head.candidates, onField: head.onField })
}

/** 外壳重挂（中区两槽：标签条 / 会话头 —— 挂载面**纯读**现态；容器缺位 ⇒ 各挂载函数空转；状态行另档单点重建）。
 *  标签条接线 = 五 handlers（激活 / 关闭 / 确认 / 取消 / 新建 —— 接线形通则 `docs/desktop/design/RENDERER.md` §1.1）。 */
function paintShell(state = store.get()) {
  mountTabbar(document.querySelector(TABS_SLOT), state, {
    onActivate: activateSession, // 激活即切换会话（与左列点行同一路）
    onClose: requestClose, // 关闭出口 1（需确认 ⇒ 确认面）
    onConfirmClose: confirmClose, // 关闭出口 2
    onCancelClose: cancelClose, // 关闭出口 3
    onNew: createSession,
  })
  paintHead(state)
}

/** `project:open`（打开目录 / 点最近项）：`path` 给定时直用、缺省走主进程原生目录选择；成功后同链刷新 +
 *  「成功」判据命中 ⇒ **自动一次** `session:resume`（点开即续）；`refreshRail()` 之后补一步**信息行复读**
 *  （#461 —— 项目级信息随项目变；句柄 = 设置面挂载档出 `refreshInfo`，幂等）。 */
async function openDir(path) {
  try {
    const before = store.get().project?.cwd ?? null
    const receipt = await host.invoke("project:open", path ? { path } : undefined)
    await refreshRail()
    await settingsFace.refreshInfo()
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

/** 错误横幅重试出口（「对齐第三批」项 9 · KD-37）：**重发可重发源文本** —— 经输入区既有直发径 `submitDraft`（单实现零副本 · 零新通道）；
 *  源判据与钮在场判据**同一谓词**（`views/chat.mjs` `retrySourceOf` —— 防可点静默）；无源 ⇒ 零动作（防御档）。 */
function retryLastUser() {
  const text = retrySourceOf(store.get().blocks)
  if (text === null) return
  void submitDraft({ store, host }, text)
}

/** 文件链接出口（相抵② —— 委托单点 = 本档；通道 `file:open` `{ path, line? }`）：`ok` 假 ∥ 抛 ⇒ `console.error`（渲染面零静默）；行定位不在本批（`line` 携行备用 —— 端差登记）。 */
function openFile(path, line) {
  const payload = line === undefined ? { path } : { path, line }
  void Promise.resolve(host?.invoke("file:open", payload))
    .then((receipt) => {
      if (receipt?.ok !== true) console.error(`[renderer] file:open failed: ${receipt?.reason ?? "unknown"}`)
    })
    .catch((error) => console.error("[renderer] file:open rejected:", error))
}

/** 回底复跟（接线第 1 处 · 药丸点击）：状态树复跟 + 清未读 ⇒ handle 平滑回底（程序化滚动记窗 ⇒ 不派发回波）。 */
function returnToLatest() {
  store.set(returnToBottom(store.get()))
  chatScroll?.returnToBottom()
}

/** 对话流帧出口（**唯一帧面**，订阅分流调用）：窗限 ⇒ 模型 ⇒ 帧前判据 ⇒ 重挂面（`mountChat` + 同帧态刷 ——
 *  §2.13：树已按新模型构建，幂等双刷无害）/ 增量面（`alignPlan` ⇒ `settleFrame` 六步）；零重合（`ok` 假）⇒
 *  回落重挂（对齐面不成立）。卡族两族（提问 / 计划）逐帧补挂（`paintCards` 幂等 —— 重挂面清树后**必补**；
 *  增量面先于读数 `t0`：卡高不入头侧增量，贴底 / 补偿算式不被污染）。记账末行 = 本帧 `{ state, mounted }`（下帧输入）。 */
function paintChat(state = store.get(), changedKeys = []) {
  const root = document.querySelector(FLOW_SLOT)
  const inFlight = state.history?.inFlight === true
  const prev = chatFrame?.state ?? null
  const added = (state.blocks?.length ?? 0) - (prev?.blocks?.length ?? 0) // 并入量 = 本帧净增块数（整置 ⇒ 非正 ⇒ 零增）
  chatLimit = nextWindow({ limit: chatLimit, inFlight: prev?.history?.inFlight === true }, inFlight, added)
  const model = chatModel(state, chatLimit)
  const plan = paintPlan({ prev, next: state, changedKeys })
  const handlers = {
    onReturn: returnToLatest, onToggleTool: toggleTool, onApprove: poolHandlers.onApprove, writeText,
    onOpenDir: () => openDir(), // 引导面（批 B 追加轮）：与左列同出口（`project:open` 单一实现）
    onNewSession: createSession, // 引导面：与左列同出口（`session:create` 单一实现 —— 零第二路）
    onRetry: retryLastUser, // 错误横幅重试（「对齐第三批」项 9：重发末 `user` 块 —— 经输入区既有直发径）
  }
  let mounted
  if (plan.remount) {
    mounted = mountChat(root, state, handlers, chatLimit).mounted
    syncChrome(root, model, handlers)
    paintCards(state)
  } else {
    const align = alignPlan(chatFrame?.mounted ?? [], model.blocks, plan.tier === "patch")
    if (align.ok) {
      paintCards(state) // 先于读数 t0：卡高不入头侧增量
      mounted = settleFrame(root, model, chatScroll, align, plan.tier, handlers)
    } else {
      mounted = mountChat(root, state, handlers, chatLimit).mounted
      syncChrome(root, model, handlers)
      paintCards(state)
    }
  }
  // 帧尾真置焦（F-置焦 —— 三径同点，卡族由 `paintCards` 后到 ⇒ 补一拍；幂等记账不夺已移焦）
  focusAutofocus(root)
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

/** 事件面接线（装配一次 · 批 8 · 批档 §2.11）：多通道订阅 ⇒ 值面写者单源 = `renderer/events.mjs`（归约）+ `renderer/events-subscribe.mjs`
 *  （订阅）；回合尾 ⇒ `flushTurnTail` 窄口（批档 §1.14 —— flush 触发只此一处）；退订句柄本档无消费点；`on` 缺位 ⇒ 该档记错 + 空操作。 */
attachEvents({ on: host?.on, onTurnTail: flushTurnTail })

/** 文件链接着装与委托（相抵②）：着装面（核 `linkifyPaths` + `data-path` 锚）归 `views/chat-tool.mjs` / `views/chat.mjs`；**委托注册单点 = 本档**（装配期一次 —— 挂载根 = 对话流宿主；幂等 `_fileLinksBound`）。 */
bindFileLinks(document.querySelector(FLOW_SLOT), openFile)

/** 2s 拍（P7 —— 渲染面**首个定时器** · 单点 `setInterval` + 卸载清点）：① 池面在飞块逐块核件 `refreshBlock`（走时词面）
 *  ② 本键位标含 `running` ⇒ 状态行重挂（耗时段走时）；拍体 = `renderer/heartbeat.mjs`。 */
function heartbeatTick() {
  const state = store.get()
  refreshLiveBlocks(document.querySelector(POOL_SLOT))
  const codes = state?.tabBadges?.[state.activeSession ?? ""]
  if (Array.isArray(codes) && codes.includes("running")) paintStatus(state)
}
const heartbeat = createHeartbeat({ tick: heartbeatTick })
globalThis.addEventListener?.("unload", () => heartbeat.stop())

// 会话头候选面首取（渠道候选一次入缓存 ⇒ 头面选项集就位；活动 provider 的模型候选待会话激活后随 `sync` 取）。
void head.sync(store.get())

/** 订阅随动：`locale` 变更 ⇒ 镜像 `dataset.locale`（机器读面 —— **非面向用户文案**）；左列 / 中区外壳 / 对话流 / 活动池 / 卡面触发切片 ⇒ 各自重挂 / 帧出口 / 卡面态刷。 */
store.subscribe((state, changedKeys) => {
  if (changedKeys.includes("locale")) document.documentElement.dataset.locale = state.locale
  if (changedKeys.some((key) => RAIL_KEYS.includes(key))) paintRail(state)
  if (changedKeys.some((key) => SHELL_KEYS.includes(key))) {
    paintShell(state)
    void head.sync(state) // 头面候选面随动（活动会话 / provider 变 ⇒ 重取后就地刷行 —— 单点调用）
  }
  if (changedKeys.some((key) => STATUS_KEYS.includes(key))) paintStatus(state)
  if (changedKeys.some((key) => CHAT_KEYS.includes(key))) paintChat(state, changedKeys)
  if (changedKeys.some((key) => POOL_KEYS.includes(key))) paintPool(state)
  if (changedKeys.some((key) => CARDS_KEYS.includes(key))) paintCards(state)
})
