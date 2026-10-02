/**
 * app.mjs — 渲染面引导（启动面 · 批档 §2.4）：`DOMContentLoaded` → `config:read` 往返 → 形合契约 ⇒ 词表置位（`initDict`）
 * + 状态树随动（`store.set`）+ 会话控制条 / 中区外壳首绘 + `dataset.boot = "ok"`，否则 `"error"`（窄桥缺位 / 形不符 / 拒绝皆判
 * error —— **不静默回退**，冒烟即红）；路径族详规 = 批档 §2.2 / §2.12 / §2.13，本档只落接线。
 * 会话族（出档 `renderer/mount-sessions.mjs` —— 会话模型轮 R13：VSC 形会话控制面（下拉开合 ∕ 条目构树 ∕ 三出口）
 * 与接线同档）：三路开会话**同一路**（`session:switch` / `session:create` / `session:resume`）—— 本档五 handlers
 * 转接（切会话 / 新建 / 改名确认 / 删除确认 / 开项目）；面内开合 ∕ 换形态住面内记账（原 store 两切片随裁撤退场）。
 * 本档只留接线串与目录出口链。
 * 帧出口（唯一）= 帧合并件（核 `createFrameMerge` —— 触发源 = store 变更 ⇒ `mark`；单飞 rAF + `FRAME_MIN_MS`(50) · `flush` = 同步尾帧）
 * ⇒ 五面分派（`renderer/frame-dispatch.mjs`）；对话流面 `paintChat`：**两径** —— 构造径（首帧 ∥ 作业含整置 ∥ 词面变 ⇒
 * `mountChat` + 同帧态刷）∥ 结算径（`settleFrame` 六步：账 + 作业单整数结算）；窗限 `chatLimit` **只增**（`nextWindow` 收束沿 + 本页**实并入块数**）。
 * 出档面：池面一族 = `renderer/mount-pool.mjs` · 会话族 = `renderer/mount-sessions.mjs` · 输入区 = `renderer/mount-composer.mjs`
 * （面板主体 = 核件工厂 —— 输入面板上提批；发送面三件随 `renderer/composer-send.mjs` 退役入核件 ∕ 本档 deps 边）
 * · 状态行 = `renderer/mount-status.mjs`（D17 / D22 承载 17 段单点重建 + 面内差分门 + 切片键面 `STATUS_KEYS`）
 * · 卡族两族 = `renderer/mount-cards.mjs`（提问 / 计划 —— 挂载 + 作答 / 取消出口）
 * · 事件归约 + 页应用 = `renderer/events.mjs` · 订阅接线 = `renderer/events-subscribe.mjs`；本档接线两处 = `attachScroll`
 * （回填 / 跟滚 / 停跟三出口 + 只读口 `guards()`；药丸回底 / 工具卡 toggle 两出口）· `attachEvents({ on })`
 * （多通道订阅 —— 回合尾窄口存续（标题刷新面）；输入区 flush 携行随「回合中插入」批退场）；退订句柄本档无消费点 —— 页面生命周期 = 进程生命周期。
 * 读面失败一律 `console.error` + 零切片写（不静默）；零直连 IPC（只经窄桥 `window.thincoder.invoke`）；
 * 核件取词注册 = 本档模块级一次 `setStringsSink(setStrings)`（注册单点；合并式仍居 `renderer/i18n.mjs` `initDict`）——注册面后到 ⇒ `boot` 内 `initDict` 之后补一次 `composer.refresh()`（词面重派生）。
 * **D36（菜单体系批）接线**：`ev:menu` 窄口 ⇒ `renderer/menu-actions.mjs` 六动作分派（本档注入六出口 —— #817 增 `openSettings` 双口转接）；`theme:state` 勾选态回读 = 装配初值报告（写作点二 = 设置面出口）。
 * 静态闭包零 `node:` / 零裸包（守卫 = `test/guard-closure.test.mjs`）。
 * **「对齐第三批」三接线（本档）**：错误横幅重试（项 9 —— `onRetry` ⇒ 输入区直发径单副本）· 文件链接 `file:open` 委托注册（相抵②）· 1s 拍单点（P7 + `unload` 清点——停滞轻显形批 2s ⇒ 1s）。
 */
import { setBoot } from "./dom.mjs"
import { attachEvents } from "./events-subscribe.mjs"
import { dispatchFrame } from "./frame-dispatch.mjs"
import { createHeartbeat, refreshLiveBlocks } from "./heartbeat.mjs"
import { initDict, setStringsSink } from "./i18n.mjs"
import { createFrameMerge } from "/rc/flow/frame.mjs"
import { setStrings } from "/rc/i18n.mjs"
import { attachCards } from "./mount-cards.mjs"
import { attachComposer } from "./mount-composer.mjs"
import { POOL_SLOT, attachPool } from "./mount-pool.mjs"
import { attachStatus } from "./mount-status.mjs"
import {
  SESSION_SLOT, activateSession, backfill, confirmRename, createSession, deleteSession, mountSessionBar,
  refreshRail, resumeOpened,
} from "./mount-sessions.mjs"
import { attachSettings } from "./mount-settings.mjs"
import { createMenuActions } from "./menu-actions.mjs" // 菜单动作分派（D36 · #811 —— `ev:menu` 窄口消费；零第二实现）
import { initPoolWidth, refreshResizerLabel } from "./pool-width.mjs" // 右栏宽度拖动（D30 · #742 —— chrome 级直写面）
import { attachSearch } from "./search.mjs"
import { configuredFlag, patchSettings, returnToBottom, setFollowing, store } from "./store.mjs"
import { initTheme } from "./theme.mjs" // 主题三态（D33 · #743 —— chrome 级状态直写面；装配期一次 + 切片播种）
import { MAX_RENDER_BLOCKS, attachScroll, nextWindow } from "./views/chat-scroll.mjs"
import { chatModel, retrySourceOf } from "./views/chat-model.mjs"
import { mountChat, settleFrame } from "./views/chat.mjs"
import { focusAutofocus, syncChrome } from "./views/chat-chrome.mjs"
import { bindFileLinks, toggleExpanded } from "./views/chat-tool.mjs"

// 核件取词注册（「对齐第二批」修复轮 · 注册单点）：模块求值先于 `DOMContentLoaded` ⇒ 先注册、后 `initDict`
// （合并式）经此端出；核件供体 `/rc/i18n.mjs` 居本浏览器专属档（平 node 装载面 = `renderer/i18n.mjs`）。
setStringsSink(setStrings)

const host = globalThis.thincoder // 窄桥（装配面 = `src/preload/preload.cjs`）
const FLOW_SLOT = '[data-slot="flow"]' // 对话流容器锚（= 滚动容器自身 —— 挂载根不清宿主）
// 重挂触发切片（`SESSION_KEYS` / `CHAT_KEYS` …… 各面自持处为单源）随分派体出档 `renderer/frame-dispatch.mjs`（更新纪律收核批 —— 键面 = 分派语义；装配面只留帧接线与面回调表）。
const { paintPool, handlers: poolHandlers } = attachPool(host) // 池面一族（右栏重挂 + 两出口 —— 出档 `renderer/mount-pool.mjs`）
const { paintCards } = attachCards(host) // 卡面一族（提问 / 计划 —— 挂载 + 作答 / 取消出口；出档 `renderer/mount-cards.mjs`）
// 设置面 / 向导一族（自持订阅 —— 出档 `renderer/mount-settings.mjs`；目录出口复用项目面链）；
// `onProvidersChanged`（全渠扇出批 · #3）= 设置面 provider 写成功 ⇒ 输入区候选面强制刷新（迟绑定：`composer` 于下行装配）。
const settingsFace = attachSettings(host, { onProjectOpened: openDir, onProvidersChanged: () => composer.refreshCandidates() })
// 输入区一族（挂载 + deps 构造 → 核件工厂；出档 `renderer/mount-composer.mjs`）：`openSettings` = 控件行第 7 钮出口 ∕ `submit` = 直发径单副本（错误横幅重试消费）。
const composer = attachComposer(host, { openSettings: () => settingsFace.openSettings() })
const { paintStatus } = attachStatus() // 状态行一族（D17 / D22 承载 17 段单点重建 —— 出档 `renderer/mount-status.mjs`）

/** 菜单动作分派（D36 · #811 ∥ 设置菜单升级批 · #817 —— `ev:menu` 窄口消费）：六动作 ⇒ 既有单一实现（零第二份）；`searchFace` 迟绑定（装配序在下行）。 */
const menuActions = createMenuActions({
  createSession, openDir, openSearch: () => searchFace?.openSearch(),
  setTheme: settingsFace.setTheme, printHelp: composer.printHelp,
  // 设置面临时双口（D38 ∥ D39 · #817 转接）：缺组 ⇒ 现有设置页（零动）；携组名 ⇒ 组弹窗（KD-68）。
  openSettings: (group) => (typeof group === "string" && group !== "" ? settingsFace.openSettingsModal(group) : settingsFace.openSettings()),
})

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

/** `project:open`（打开目录 / 点最近项）：`path` 给定时直用、缺省走主进程原生目录选择；成功后同链刷新 +
 *  「成功」判据命中 ⇒ **自动一次** `session:resume`（点开即续）。 */
async function openDir(path) {
  try {
    const before = store.get().project?.cwd ?? null
    const receipt = await host.invoke("project:open", path ? { fsPath: path } : undefined)
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

// ─── 对话流接线（批 6 · 批档 §2.12 / §2.13）────────────────────────────────────

/** 帧窗限（模块级累计 —— **禁由 `blocks.length` 派生**：`none` / 短会话会把限归零 ⇒ 下一帧窗塌到 1）；
 *  收束沿只增（`nextWindow` —— 增量 = 本帧**实并入块数**）⇒ 块数有界（头部超出即由结算步按数摘除）。 */
let chatLimit = MAX_RENDER_BLOCKS
let chatScroll = null // `attachScroll` handle（装配一次；容器缺位 ⇒ `null` ⇒ 帧尾零写）
let chatFrame = null // 上一帧账 `{ state, mounted, hidden }`：`state` = 上帧态（两径判据的 `prev`）· `mounted` ∕ `hidden` = 结算账（DOM 块节点序 + 隐藏数）
/** 卡面帧门（M12 · KD-48②「每面每帧至多一次」）：帧作用域单值 —— `applyFrame` 起帧复位；帧外直呼径（`onCardRefresh`）调用前显式复位。 */
let cardsDrawn = false
/** 卡面帧径（一次性门包装）：真 ⇒ 早退（本帧已绘）；假 ⇒ 置真 + `paintCards(state)`（两内联点 ∕ `faces.cards` 同引）。 */
function paintCardsOnce(state) {
  if (cardsDrawn) return
  cardsDrawn = true
  paintCards(state)
}

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

/** 回底复跟（接线第 1 处 · 药丸点击）：状态树复跟 + 清未读 ⇒ **帧同步尾帧**（`flush` —— 顺序保真）⇒ handle 平滑回底（程序化滚动记窗 ⇒ 不派发回波）。 */
function returnToLatest() {
  store.set(returnToBottom(store.get()))
  frame.flush()
  chatScroll?.returnToBottom()
}

/** 对话流帧出口（**唯一帧面**，订阅分流调用）：窗限 ⇒ 模型 ⇒ **两径** ——
 *  构造径（无账 ∥ 作业含 `build` ∥ 词面变）⇒ `mountChat`（整树构造）+ 同帧态刷；结算径 ⇒ 卡族先补挂（卡高不入
 *  头侧增量），账 + 作业单交 `settleFrame` 整数结算（单源 = `docs/desktop/design/RENDERER.md` §1.1「流面结算步」条）。
 *  **清账 = 两径同清**（root 缺位不清 —— 未消费不退账）。记账末行 = 本帧 `{ state, mounted, hidden }`（下帧账）。 */
function paintChat(state = store.get()) {
  const root = document.querySelector(FLOW_SLOT)
  const inFlight = state.history?.inFlight === true
  const prev = chatFrame?.state ?? null
  const added = (state.blocks?.length ?? 0) - (prev?.blocks?.length ?? 0) // 并入量 = 本帧净增块数（整置 ⇒ 非正 ⇒ 零增）
  chatLimit = nextWindow({ limit: chatLimit, inFlight: prev?.history?.inFlight === true }, inFlight, added)
  const model = chatModel(state, chatLimit)
  const ops = Array.isArray(state.flowOps) ? state.flowOps : []
  const handlers = {
    onReturn: returnToLatest, onToggleTool: toggleTool, onApprove: poolHandlers.onApprove,
    onOpenDir: () => openDir(), // 引导面（批 B 追加轮）：与会话控制条项目钮同出口（`project:open` 单一实现）
    onNewSession: createSession, // 引导面：与会话控制条新建钮同出口（`session:create` 单一实现 —— 零第二路）
    onRetry: retryLastUser, // 错误横幅重试（「对齐第三批」项 9：重发末 `user` 块 —— 经输入区既有直发径）
    onOpenFile: openFile, // R1：核卡「大 diff」钮单径在场径（端壳适配 f —— 与文件链接委托同出口 `file:open`）
    onCardRefresh: () => { cardsDrawn = false; paintChat() }, // R1：审批卡回执失败径的**一次卡面重挂**（端壳适配 d —— 卡复现在场可重试；帧外直呼 ⇒ 门前置复位）
  }
  const construct = chatFrame === null || ops.some((op) => op?.kind === "build") || (prev !== null && state.locale !== prev.locale)
  let mounted
  if (construct) {
    mounted = mountChat(root, state, handlers, chatLimit).mounted
    syncChrome(root, model, handlers)
    paintCardsOnce(state)
  } else {
    paintCardsOnce(state) // 先于结算：卡高不入头侧增量
    mounted = settleFrame(root, model, chatScroll, handlers, { mounted: chatFrame.mounted, hidden: chatFrame.hidden, ops })
  }
  // 帧尾真置焦（F-置焦 —— 两径同点，卡族由 `paintCards` 后到 ⇒ 补一拍；幂等记账不夺已移焦）
  focusAutofocus(root)
  if (root !== null && ops.length > 0) store.set({ flowOps: [] }) // 清账（两径同清；root 缺位不清）
  chatFrame = { state, mounted, hidden: model.hidden }
}

/** 首屏引导层随动（R1 —— 静态件住 `renderer/index.html`）：`ok` ⇒ 撤层（零残留）；`error` ⇒ 错误面
 *  （`.boot-reason` 显原因——引导面拿不到词表 ⇒ 文案 = 诊断串）；其余（`none` 骨架态）⇒ 层在场（静态默认可见）。
 *  引导位（`dataset.boot`）经 `setBoot` 恒置——主进程冒烟读面零改。 */
function settleBoot(value, reason) {
  const layer = document.getElementById("boot-gate")
  if (layer) {
    if (value === "ok") layer.remove()
    else if (value === "error") {
      layer.dataset.state = "error"
      const body = document.getElementById("boot-reason")
      if (body) {
        body.textContent = String(reason ?? "")
        body.hidden = false
      }
    }
  }
  return setBoot(value)
}

/** 引导：窄桥 ⇒ `config:read` 往返 ⇒ 词表置位 + 数据面刷新 ⇒ **重载补启**（D9 —— 项目在场 ⇒ 恰一次
 *  `session:resume`）⇒ `boot = "ok"`（任一不合 ⇒ `"error"`）+ 首屏引导层随动（R1 —— 见 `settleBoot`）。 */
async function boot() {
  if (!host || typeof host.invoke !== "function") {
    const reason = "preload bridge missing: window.thincoder.invoke unavailable"
    console.error(`[renderer] ${reason}`)
    return settleBoot("error", reason)
  }
  try {
    const payload = await host.invoke("config:read")
    if (!isValidPayload(payload)) {
      const reason = "config:read payload shape unexpected"
      console.error(`[renderer] ${reason}:`, payload)
      return settleBoot("error", reason)
    }
    // 词表置位（返回归一后的语言 ⇒ `locale` 切片同源）+ 首启闸随新档态（`configuredFlag` 三态归一：档缺 ⇒ false；畸形 / 缺 ⇒ null ⇒ 向导不进）+ 订阅面随即首绘会话控制条。
    store.set({ ...patchSettings(store.get(), { configured: configuredFlag(payload.configured) }), locale: initDict(payload) })
    composer.refresh() // 词面到位 ⇒ 输入面板重派生（面板挂载先于词表下发 —— 注册面后到，缺 ⇒ 占位符停留为键名）
    refreshResizerLabel() // 同因（词面到位 ⇒ 拖柄可及名注入 —— en 首启等值零通知窗不达 locale 支，父侧 2026-09-30 裁决 B）
    await refreshRail() // 会话列表数据面（读失败不改 boot 判据 —— 读面自持错误面，不抬高引导位）
    // 重载补启（D9 · 批档 §2.14a）：主进程仍持项目（`cwd` 非空串）⇒ 活跃会话自动接续 —— 复用「点开即续」同路
    // （`session:resume` ⇒ 端记录判据 ⇒ `openPage` + `refreshRail`）；冷启（`cwd` 空 ∥ 读面失败）零触发；失败沿既有
    // R9 toast 面 —— `resumeOpened` 自持 catch（不抛 ∥ 不抬高 boot 判据）。
    if (typeof store.get().project?.cwd === "string" && store.get().project.cwd !== "") await resumeOpened()
    return settleBoot("ok")
  } catch (error) {
    console.error("[renderer] config:read failed:", error)
    return settleBoot("error", error?.message ?? String(error))
  }
}

document.addEventListener("DOMContentLoaded", boot)

/** 滚动接线（装配一次 · 批 6 + 批 8 回填档）：容器 = 对话流宿主自身（骨架 `data-slot="flow"`）；三出口 + 只读口
 *  只经 store 纯动作读写切片（`onBackfill` 判据单源 = `beginBackfill`）；容器缺位 ⇒ `null`（帧尾零写）。
 *  **`onScrollTick`**（E4-JS 支）：平滑窗门后每 scroll 事件 ⇒ `frame.mark(["segView"])`（**哨兵键 —— 非切片**；
 *  巨块段窗滚动作 —— 帧合并节流 ≥50ms ⇒ ≤20 拍 ∕ 秒）。 */
chatScroll = attachScroll(document.querySelector(FLOW_SLOT), {
  onBackfill: backfill,
  onFollow: () => store.set(setFollowing(store.get(), true)),
  onUnfollow: () => store.set(setFollowing(store.get(), false)),
  guards: () => ({ hasOlder: store.get().history?.hasOlder === true, inFlight: store.get().history?.inFlight === true }),
  onScrollTick: () => frame.mark(["segView"]),
})

/** 事件面接线（装配一次 · 批 8 · 批档 §2.11）：多通道订阅 ⇒ 值面写者单源 = `renderer/events.mjs`（归约）+ `renderer/events-subscribe.mjs`
 *  （订阅）；回合尾窄口存续（标题刷新面）—— 输入区 flush 携行随「回合中插入」批退场（队列消费改宿主驱动）；退订句柄本档无消费点；`on` 缺位 ⇒ 该档记错 + 空操作。
 *  **R8 增 `ev:config` 窄口**（config 写盘感知 —— 纯信号 ⇒ 设置面复读：`refreshSettings` 自判在场，关态零动作）；
 *  **全渠扇出批同窄口增候选面随动**（#2：外部写盘 ⇒ 输入区候选面强制刷新 —— `model:catalog` 重取）。
 *  **D36 增 `ev:menu` 窄口**（菜单动作 —— 纯信号（**六动作闭集** —— #817 收正：五 ⇒ 六，+`openSettings`）⇒ `renderer/menu-actions.mjs` 分派；六出口注入面见上）。 */
attachEvents({ on: host?.on, onConfig: () => { settingsFace.refreshSettings(); composer.refreshCandidates() }, onMenu: menuActions })

/** 文件链接着装与委托（相抵②）：着装面（核 `linkifyPaths` + `data-path` 锚）归 `views/chat-tool.mjs` / `views/chat.mjs`；**委托注册单点 = 本档**（装配期一次 —— 挂载根 = 对话流宿主；幂等 `_fileLinksBound`）。 */
bindFileLinks(document.querySelector(FLOW_SLOT), openFile)

/** 会话内搜索（R6 —— 核件 `/rc/search.mjs`；端壳 = `renderer/search.mjs`）：Ctrl+F 键位随工厂一次注册，
 *  扫描 ∕ 高亮容器 = 对话流宿主；条插入锚 `#toolbar` ∕ 关闭置焦 `#input` 皆文档级 id（核件内直取）。
 *  **D36**：句柄捕获（= 菜单「查找…」出口消费面 —— `menu-actions.mjs` `openSearch`；幂等开径，与键径双触发零害）。 */
const searchFace = attachSearch()

/** 右栏宽度拖动（D30 · 台账 #742 —— 出档 `renderer/pool-width.mjs`）：装配期一次（读存储 ⇒ 内联 `--pool-w` ⇒ 拖柄接线；先于首绘可及面 —— 引导层在场期完成 ⇒ 零可见跳变）；词面注入两处 = boot 词表置位点 + 帧分派 `locale` 支。 */
initPoolWidth()

/** 主题三态（D33 · 台账 #743 —— 出档 `renderer/theme.mjs`）：装配期一次（读存储 ⇒ 归一 ⇒ 写 `data-theme` ⇒ 切片播种
 *  —— 先于首绘可及面，同 `initPoolWidth` 位）；`dataset.theme` 写仍同步不经帧（设置面重绘键 = `SETTINGS_KEYS` 含 `theme`）。 */
store.set({ theme: initTheme() })
// 勾选态回读（D36 · 两写作点①装配初值）：报告落地主题 ⇒ 主进程菜单主题▸带勾（拒绝 ∥ ok 假 ⇒ 记错，零静默；菜单侧 fail-open 全零勾）。
void host?.invoke("theme:state", { theme: store.get().theme })?.then(
  (receipt) => { if (receipt?.ok !== true) console.error(`[renderer] theme:state failed: ${receipt?.reason ?? "unknown"}`) },
  (error) => console.error("[renderer] theme:state failed:", error))

/** 1s 拍（P7 —— 渲染面**首个定时器** · 单点 `setInterval` + 卸载清点；停滞轻显形批 2s ⇒ 1s）：① 池面在飞块逐块核件 `refreshBlock`（走时词面）
 *  ② 本键位标含 `running` ⇒ 状态行重挂（耗时段 ∕ 静默段走时）；拍体 = `renderer/heartbeat.mjs`。 */
function heartbeatTick() {
  const state = store.get()
  refreshLiveBlocks(document.querySelector(POOL_SLOT))
  const codes = state?.tabBadges?.[state.activeSession ?? ""]
  if (Array.isArray(codes) && codes.includes("running")) paintStatus(state)
}
const heartbeat = createHeartbeat({ tick: heartbeatTick })
globalThis.addEventListener?.("unload", () => heartbeat.stop())

/** 帧分派面表（五面回调注入 —— 每面每帧至多一次；面序 = 会话控制条 → 状态行 → 对话流 → 池区 → 卡面）。 */
const faces = {
  sessionBar: paintSessionBar, status: paintStatus, chat: paintChat, pool: paintPool, cards: paintCardsOnce,
}

/** 帧出口（apply · 每帧至多一次）：帧时刻**现读** `store.get()`（禁 mark 时刻取态快照）—— 起帧复位卡面帧门（`cardsDrawn`）+ `locale` 镜像 `dataset.locale` + 拖柄可及名随动（`refreshResizerLabel` —— 两处之二，另一处 = boot 词表置位点）+ 五面按键集分派。 */
function applyFrame(dirtyKeys) {
  cardsDrawn = false // 起帧复位（帧内一次性门 —— 卡面本帧可再绘一次）
  const state = store.get()
  if (dirtyKeys.includes("locale")) {
    document.documentElement.dataset.locale = state.locale
    refreshResizerLabel()
  }
  return dispatchFrame({ dirtyKeys, state, faces })
}

/** 帧合并件（单源 = 核档 §2 KD-RC-9）：触发源 = store 变更 ⇒ `mark`；`flush` 消费点 = `returnToLatest` + 测试 ∕ 探针确定性。 */
const frame = createFrameMerge({ apply: applyFrame })

/** 订阅随动（**O(1) 脏键集** —— 订阅回调零渲染）：store 变更 ⇒ `frame.mark(changedKeys)`（帧触发后分派五面）。 */
store.subscribe((_state, changedKeys) => { frame.mark(changedKeys) })
