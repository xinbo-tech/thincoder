/**
 * app.mjs — 渲染面引导（启动面 · 批档 §2.4）：`DOMContentLoaded` → `config:read` 往返 → 形合契约 ⇒ 词表置位（`initDict`）
 * + 状态树随动（`store.set`）+ 会话控制条 / 中区外壳首绘 + `dataset.boot = "ok"`，否则 `"error"`（窄桥缺位 / 形不符 / 拒绝皆判
 * error —— **不静默回退**，冒烟即红）；路径族详规 = 批档 §2.2 / §2.12 / §2.13，本档只落接线。
 * 会话族（出档 `renderer/mount-sessions.mjs` —— 会话模型轮 R13：VSC 形会话控制面（下拉开合 ∕ 条目构树 ∕ 三出口）
 * 与接线同档）：三路开会话**同一路**（`session:switch` / `session:create` / `session:resume`）—— 本档五 handlers
 * 转接（切会话 / 新建 / 改名确认 / 删除确认 / 开项目）；面内开合 ∕ 换形态住面内记账（原 store 两切片随裁撤退场）。
 * 本档只留接线串与目录出口链。
 * 帧出口（唯一）= `paintChat`：帧前判据 `paintPlan`（重挂键 = `activeSession` / `locale`）⇒ 重挂面（`mountChat` + 同帧态刷）
 * 或增量面（`alignPlan` ⇒ `settleFrame` 六步）；窗限 `chatLimit` **只增**（`nextWindow` 收束沿 + 本页**实并入块数**）。
 * 出档面：池面一族 = `renderer/mount-pool.mjs` · 会话族 = `renderer/mount-sessions.mjs` · 输入区 = `renderer/mount-composer.mjs`
 * （面板主体 = 核件工厂 —— 输入面板上提批；发送面三件随 `renderer/composer-send.mjs` 退役入核件 ∕ 本档 deps 边）
 * · 会话头接线 = `renderer/mount-head.mjs`（候选面 / 写路 `session:prefs` / 回执刷行 —— 头面刷行调用点仍住本档）
 * · 状态行 = `renderer/mount-status.mjs`（D17 / D22 承载 16 段单点重建 + 订阅切片键面 `STATUS_KEYS`）
 * · 卡族两族 = `renderer/mount-cards.mjs`（提问 / 计划 —— 挂载 + 作答 / 取消出口）
 * · 事件归约 + 页应用 = `renderer/events.mjs` · 订阅接线 = `renderer/events-subscribe.mjs`；本档接线两处 = `attachScroll`
 * （回填 / 跟滚 / 停跟三出口 + 只读口 `guards()`；药丸回底 / 工具卡 toggle 两出口）· `attachEvents({ on })`
 * （多通道订阅 —— 回合尾窄口存续（标题刷新面）；输入区 flush 携行随「回合中插入」批退场）；退订句柄本档无消费点 —— 页面生命周期 = 进程生命周期。
 * 读面失败一律 `console.error` + 零切片写（不静默）；零直连 IPC（只经窄桥 `window.thincoder.invoke`）；
 * 剪贴板写效应（`writeText`）**单点供给** = 本档（同给对话流 handlers 与输入区 `attachComposer` —— 复制面唯一实现处）；
 * 核件取词注册 = 本档模块级一次 `setStringsSink(setStrings)`（注册单点；合并式仍居 `renderer/i18n.mjs` `initDict`）——注册面后到 ⇒ `boot` 内 `initDict` 之后补一次 `composer.refresh()`（词面重派生）。
 * 静态闭包零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 * **「对齐第三批」三接线（本档）**：错误横幅重试（项 9 —— `onRetry` ⇒ 输入区直发径单副本）· 文件链接 `file:open` 委托注册（相抵②）· 2s 拍单点（P7 + `unload` 清点）。
 */
import { setBoot } from "./dom.mjs"
import { attachEvents } from "./events-subscribe.mjs"
import { createHeartbeat, refreshLiveBlocks } from "./heartbeat.mjs"
import { initDict, setStringsSink } from "./i18n.mjs"
import { setStrings } from "/rc/i18n.mjs"
import { attachCards, CARDS_KEYS } from "./mount-cards.mjs"
import { attachComposer } from "./mount-composer.mjs"
import { attachHead } from "./mount-head.mjs"
import { POOL_SLOT, attachPool, POOL_KEYS } from "./mount-pool.mjs"
import { attachStatus, STATUS_KEYS } from "./mount-status.mjs"
import {
  SESSION_SLOT, activateSession, backfill, confirmRename, createSession, deleteSession, mountSessionBar,
  refreshRail, resumeOpened,
} from "./mount-sessions.mjs"
import { attachSettings } from "./mount-settings.mjs"
import { attachSearch } from "./search.mjs"
import { configuredFlag, patchSettings, returnToBottom, setFollowing, store } from "./store.mjs"
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
const HEAD_SLOT = '[data-slot="session-head"]' // 会话头槽（状态行槽锚随状态行族出档 —— `renderer/mount-status.mjs`）
const FLOW_SLOT = '[data-slot="flow"]' // 对话流容器锚（= 滚动容器自身 —— 挂载根不清宿主）
// 会话控制条重挂触发切片（`locale` 在内：文案随词表 ⇒ 树须重绘；`ledger` = 账本警示切片 —— 下拉首行注记；
// `project` = 项目钮读数；`sessions` ∕ `activeSession` ∕ `tabBadges` = 下拉列表 ∕ 活动态 ∕ 位标）
const SESSION_KEYS = ["project", "sessions", "activeSession", "tabBadges", "locale", "ledger"]
const HEAD_KEYS = ["activeSession", "sessionMeta", "tabBadges", "locale"] // 会话头重挂触发切片（活动键 ∕ 供给 ∕ 忙态 ∕ 词表）
const CHAT_KEYS = ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool", "project", "pending", "digest", "timerNotice", "stopMark", "ledgerLines"] // 对话流帧触发切片（`locale` 在内：文案随词表 · `pool`：审批卡宿对话流 · `project`：引导码随 cwd——批 B 追加轮 · `pending`：流内待发送气泡组——「对齐第二批」项 2 · `digest`：流内消化行组——桌面空闲唤醒批 · `timerNotice`：流内到期触发行组——timer-wake 阶段 2 · `stopMark` / `ledgerLines`：两尾组的单变触发 —— 「对齐第三批」项 6 / 12；`settings` 不入表 —— 欢迎条文案二值随重挂径，且帧尾态刷判据 = 码面（见 `renderer/views/chat-guide.mjs`））
const { paintPool, handlers: poolHandlers } = attachPool(host) // 池面一族（右栏重挂 + 两出口 —— 出档 `renderer/mount-pool.mjs`）
const { paintCards } = attachCards(host) // 卡面一族（提问 / 计划 —— 挂载 + 作答 / 取消出口；出档 `renderer/mount-cards.mjs`）
// 设置面 / 向导 / 信息行一族（自持订阅 —— 出档 `renderer/mount-settings.mjs`；目录出口复用项目面链）；
// 句柄捕获 = 项目级读数复读口（#461 —— `openDir` 成功链消费 `refreshInfo`，零第二订阅点）。
const settingsFace = attachSettings(host, { onProjectOpened: openDir })
// 输入区一族（挂载 + deps 构造 → 核件工厂；出档 `renderer/mount-composer.mjs`）：`openSettings` = 控件行第 7 钮出口 ∕ `submit` = 直发径单副本（错误横幅重试消费）。
const composer = attachComposer(host, { writeText, openSettings: () => settingsFace.openSettings() })
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

/** 会话控制条重挂（挂载面**纯读**现态 —— 不改切片；容器缺位 ⇒ `mountSessionBar` 空转）。接线 = **五 handlers**
 *  （切会话 / 新建 / 改名确认 / 删除确认 / 开项目 —— 面内开合 ∕ 换形两态住面内记账，不经本档；接线形通则 `docs/desktop/design/RENDERER.md` §1.1）。 */
function paintSessionBar(state = store.get()) {
  mountSessionBar(document.querySelector(SESSION_SLOT), state, {
    onSwitch: activateSession, // 点条目 ⇒ 切换会话（三路开会话同一路）
    onNew: createSession, // 新建钮出口
    onRename: confirmRename, // 改名确认（词面读数 = 挂载面 —— `onRename(key, text)` 回转）
    onDelete: deleteSession, // 确认 popover「删除」键出口
    onOpenProject: () => openDir(), // 项目钮 = 引导面同出口（`project:open` 单一实现）
  })
}

/** 会话头刷行（单行调用点 —— 供写路回退 / 候选面后到 / 活动会话切换三径；handlers 两出口 = 候选面纯读 + 写路）。 */
function paintHead(state = store.get()) {
  mountHead(document.querySelector(HEAD_SLOT), state, { candidates: head.candidates, onField: head.onField })
}

/** `project:open`（打开目录 / 点最近项）：`path` 给定时直用、缺省走主进程原生目录选择；成功后同链刷新 +
 *  「成功」判据命中 ⇒ **自动一次** `session:resume`（点开即续）；`refreshRail()` 之后补一步**项目级读数复读**
 *  （#461 —— 项目级读数随项目变；句柄 = 设置面挂载档出 `refreshInfo`，幂等 —— 读面消费 = 状态行台账超阈段）。 */
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

/** 错误横幅重试出口（「对齐第三批」项 9 · KD-37）：重发可重发源文本 —— 经输入区直发径单副本（`composer.submit`；源判据与钮在场判据同谓词 `views/chat.mjs` `retrySourceOf`，无源 / 出口缺 ⇒ 零动作 + 记错）。 */
function retryLastUser() {
  const text = retrySourceOf(store.get().blocks)
  if (text === null) return
  if (composer.submit(text) !== true) console.error("[renderer] retry skipped: composer send face unavailable")
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
    onOpenDir: () => openDir(), // 引导面（批 B 追加轮）：与会话控制条项目钮同出口（`project:open` 单一实现）
    onNewSession: createSession, // 引导面：与会话控制条新建钮同出口（`session:create` 单一实现 —— 零第二路）
    onRetry: retryLastUser, // 错误横幅重试（「对齐第三批」项 9：重发末 `user` 块 —— 经输入区既有直发径）
    onOpenFile: openFile, // R1：核卡「大 diff」钮单径在场径（端壳适配 f —— 与文件链接委托同出口 `file:open`）
    onCardRefresh: () => paintChat(), // R1：核卡回执失败径的**一次卡面重挂**（端壳适配 d —— 卡复现可重试）
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
    // 词表置位（返回归一后的语言 ⇒ `locale` 切片同源）+ 首启闸随新档态（`configuredFlag` 三态归一：档缺 ⇒ false；畸形 / 缺 ⇒ null ⇒ 向导不进）+ 订阅面随即首绘会话控制条。
    store.set({ ...patchSettings(store.get(), { configured: configuredFlag(payload.configured) }), locale: initDict(payload) })
    composer.refresh() // 词面到位 ⇒ 输入面板重派生（面板挂载先于词表下发 —— 注册面后到，缺 ⇒ 占位符停留为键名）
    await refreshRail() // 会话列表数据面（读失败不改 boot 判据 —— 读面自持错误面，不抬高引导位）
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
 *  （订阅）；回合尾窄口存续（标题刷新面）—— 输入区 flush 携行随「回合中插入」批退场（队列消费改宿主驱动）；退订句柄本档无消费点；`on` 缺位 ⇒ 该档记错 + 空操作。 */
attachEvents({ on: host?.on })

/** 文件链接着装与委托（相抵②）：着装面（核 `linkifyPaths` + `data-path` 锚）归 `views/chat-tool.mjs` / `views/chat.mjs`；**委托注册单点 = 本档**（装配期一次 —— 挂载根 = 对话流宿主；幂等 `_fileLinksBound`）。 */
bindFileLinks(document.querySelector(FLOW_SLOT), openFile)

/** 会话内搜索（R6 —— 核件 `/rc/search.mjs`；端壳 = `renderer/search.mjs`）：Ctrl+F 键位随工厂一次注册，
 *  扫描 ∕ 高亮容器 = 对话流宿主；条插入锚 `#toolbar` ∕ 关闭置焦 `#input` 皆文档级 id（核件内直取）。 */
attachSearch()

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

/** 订阅随动：`locale` 变更 ⇒ 镜像 `dataset.locale`（机器读面 —— **非面向用户文案**）；会话控制条 / 会话头 / 对话流 / 活动池 / 卡面触发切片 ⇒ 各自重挂 / 帧出口 / 卡面态刷。 */
store.subscribe((state, changedKeys) => {
  if (changedKeys.includes("locale")) document.documentElement.dataset.locale = state.locale
  if (changedKeys.some((key) => SESSION_KEYS.includes(key))) paintSessionBar(state)
  if (changedKeys.some((key) => HEAD_KEYS.includes(key))) {
    paintHead(state)
    void head.sync(state) // 头面候选面随动（活动会话 / provider 变 ⇒ 重取后就地刷行 —— 单点调用）
  }
  if (changedKeys.some((key) => STATUS_KEYS.includes(key))) paintStatus(state)
  if (changedKeys.some((key) => CHAT_KEYS.includes(key))) paintChat(state, changedKeys)
  if (changedKeys.some((key) => POOL_KEYS.includes(key))) paintPool(state)
  if (changedKeys.some((key) => CARDS_KEYS.includes(key))) paintCards(state)
})
