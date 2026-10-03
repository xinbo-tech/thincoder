/**
 * mount-composer.mjs — 输入区**换装出档**（输入面板上提批 `2026-09-28-desktop-input-vsc-align.md` §2.4 Q1 ∕ §2.3
 * 桌面侧）：面板主体 = **核件工厂** `createComposerPanel(deps)`（`thincoder-render-core/composer/panel.mjs` ——
 * VSC ∕ 桌面同一文件）；本档只留三面 = **deps 构造** + **写面 deps 接线**（写面本体出档 `renderer/composer-wire.mjs`
 * —— 收正轮拆分，见下）+ **装配与提示锚面**（宿主锚；随动派生面出档 `renderer/composer-sync.mjs` —— #510 续拆，见下）。
 *
 * 槽形（`[data-slot="composer"]` 两件）：① `[data-composer-notices]`（B21 发送失败 ∕
 * B22 附件降级**两保留行**，行形不动；面板子树之前）② 核件面板子树（ids 照 VSC —— 结构单源；工厂自持）。
 * （复制面对齐批：原 ③ 末条复制控件 ∕ 尾锚退场 —— 自建复制面摘除，槽形三件 ⇒ 两件。）
 * 槽 = 核件 `#toolbar` 样式规则命中物（VSC 静态容器 id）⇒ 装配期赋 `id="toolbar"` —— 核件样式值零复写
 * （样式单源 = 核件 `composer/composer.css`，装配期注 `<link>` 引入；变量别名块住 `renderer/chat.css`，C2）。
 *
 * deps（注入面六项 —— §2.3；④ 取词 = **注册面**，非本档项：注册单点 = `renderer/app.mjs` `setStringsSink`）：
 * ① `root` = 槽自身；② `post` = 通道映射表（下）；③ `state` = store 切片读面；⑤ `hooks` 绑三件 =
 * `openSettings`（控件行第 7 钮）· `onUserEcho`（B12 出泡）· `confirmRemoveProvider`（footer ⇒ 设置面）；
 * **不绑**（列明给由）＝ `onTurnStart` ∕ `onStatusRefresh` ∕ `onTitleHint` ∕ `onWelcomeDismiss` ∕ `syncModeState`
 * ∕ `onAgentSettings` ∕ `closeSiblingDropdowns` —— 桌面同面各有既有单源（回合起点动作归宿主事件面；状态行刷新 =
 * store 订阅；标题 = 回合尾刷新；欢迎条 = 帧面随块；模式位 = `sessionFlags` 切片；设置面自持读面；邻面下拉端无）。
 * ⑥（2026-10-01 批 · 斜径面 · §2 KD-RC-12 ∥ §5 条 6）：`slash = { commands }` —— 命令表 =
 * 端侧构造（本档 `./slash-commands.mjs` **一处装配**；**`/help` 增量 = 打印口闭包注入**（表构造时绑定——条目 `run`
 * 仍只返布尔 ⇒ 面板 ∥ `ctx` 零触）；行文 = 端表本体经核 `formatHelp`）；`actions` 由核件面板装配（钮 handler
 * 提取出的同一函数——同钮同门）；核件收 `deps.slash` 为**可选**（不传 ⇒ 现行为零变 —— VSC 零接缝）。
 *
 * 写面（映射表 §2.5 D1–D5 —— **出档 `renderer/composer-wire.mjs`**，收正轮拆分；本档只注入 deps）：`userMessage` ∕
 * `queuedUserMessage` ⇒ `msg:send { key, text, images? }`（images 经 `toImages` 投影为 dataURL 串列 —— A1 收正 ∕ VSC 同形）· `abort` ∕
 * `interrupt` ⇒ `msg:interrupt { key, message? }`（收正轮：`interrupt` 单投并携文本 —— 宿主下传核 abort 面
 * `{ interrupt: true, message }` ⇒ 同上下文注入续跑；「abort + 另投 `msg:send`」双投形退场）· `atComplete` ⇒
 * `at:complete { query, seq }`（回执 seq ≠ 现存 seq ⇒ **迟到丢弃**）· `selectModel` ∕ `selectReasoning` ⇒
 * `session:prefs { key, patch }` · 四模式位写 ⇒ `session:flags { key, patch }`（回执 `flags` 活值 ⇒ `applyFlags`
 * 切片写）· footer 三出口（`addProvider` ∕ `removeProvider` ∕ `setKey`）⇒ 设置面（A8 唯一映射点）。
 * **#656（cap 待答径队满可见形 · KD-52 ③ —— 回注缝供面）**：`createComposerWire` 注入缝 `slotFullNotice(text)`
 * 落本档 —— 核件 toast（词键复用 `input.slotFull` —— i18n 零增）+ 文本回注输入框（零丢失；回注缝 = 挂载面注入小口）。
 *
 * B12（本地先行出泡 · 裁定①准）：**直发径** = 受理时刻本地出泡（`onUserEcho` 写用户块 + 并笔回底，与回放块同形）；
 * **忙态径** = 零本地块 —— 该径「待发送」气泡 = 队镜面面（`ev:queue` ⇒ `pending` 切片 ⇒ 输入区上方待发送带 + 帧尾核
 * `markPending` 落笔）；两径同屏 = 同条两现（双泡）⇒ 忙态径交镜面。**出泡不变式** = 每受理消息恰一枚**真块**：
 * 直发径 = 本地先行；忙态径 = 流尾派生块（交付时刻才入流）；**回执兜底** = 忙态径收直发回执（忙位读数滞后反径）⇒
 * 回执处补写。**零真块**（收正轮 B12 新口径 · 参照 CLI）：本地块被回执言为队形（忙位读数滞后**正径**）⇒ **退流**
 * （`retractEcho` —— 消费前流内零真块）；待发送件 = 随动派生面档 `renderer/composer-sync.mjs` 的 `paintNotices`
 * **输入行上方带**（+ `views/chat-pending.mjs` 构树 —— 派生：判据 = 队镜面非空，渲染期现算；贴输入框上沿 ⇒ 恒定邻接；非真块 ⇒ `data-blocks` 不变式零破）——
 * 四径机检锁 = 集成域 `test/integration/input-echo-converge.test.mjs`（随 2026-09-28 测试树全清重置不在盘 —— 集成面重建时恢复）。
 * 忙态门（收正轮 · ③）：`turnState` 三值域 = `running` ∕ `susp` ∕ `idle` —— `ev:susp` 置位标 ⇒ `susp` 期
 * 模型 ∕ 推理钮禁用（核件派生点，防旧快照覆写 —— VSC `chat-panel.mjs:55-59` 同域）。
 * B21 行源 = 回执写（`ok` 假 ⇒ `reason` 入态，**受理径清** —— 直发 ∕ 队径两点；队径两点见收正轮 · 行 1）；文本保全随 VSC 径（提交时刻清条）。通道形单源 = `docs/desktop/design/IPC.md` §2。
 * 面板样式 = 核件 `composer/composer.css` + `composer/model-menu.css`（菜单样式**静态承载** —— 收正轮：原 JS 注入形
 * 在 CSP `style-src 'self'` 下被拒；两端口径同源）。
 * **拆分注记（收正轮执行）**：本档换装后实读 466（越 300 顾问线）⇒ 在册预案「写面出档」本批执行：写面（通道往返 ∕
 * 逐类型 handler ∕ 本地先行块标记三态 ∕ B21 失败态）落 `renderer/composer-wire.mjs`（实读 177，≤300 臂内）。
 * **续拆（#510 留守拆档 · 2026-09-29）**：随动派生面（④ `state` 读面 ∕ 忙态与守卫派生 ∕ 模式位推送 ∕ 候选面 ∕
 * 提示锚窄刷 ∕ 随动总入口）再出档 `renderer/composer-sync.mjs` ⇒ 拆后本档 ≤300（实读见同批报告）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；控制台诊断串非面向用户文案（不经 `t()`）。
 */
import { createComposerPanel } from "/rc/composer/panel.mjs"
import { showToast } from "/rc/toast.mjs"
import { formatHelp } from "/rc/composer/slash.mjs"
import { createComposerWire } from "./composer-wire.mjs"
import { createComposerSync, effortOf } from "./composer-sync.mjs"
import { t } from "./i18n.mjs"
import { degradedCode, toImages } from "./attach.mjs"
import { applyFlags } from "./events-flags.mjs"
import { appendBlock, returnToBottom, setAttachDegraded, setHelpLines, store as defaultStore } from "./store.mjs"
import { busyOf, suspActiveOf } from "./views/chrome.mjs"
import { createSlashCommands } from "./slash-commands.mjs"

/** 输入区容器锚（骨架属性住 `renderer/index.html`）。 */
export const COMPOSER_SLOT = '[data-slot="composer"]'

/** 重绘触发切片：活动会话（守卫 ∕ 读面换键）· 会话级供给（模型 ∕ 档位 ∕ 模式位）· **位标（忙态派生）** ·
 *  排队（队计数）· 附件降级码（B22 行源）· 语言（词面）· 挂起窗（`susp` —— 收正轮 ③）· **provider 态**（#841 ——
 *  三回执族落切片 ⇒ 提示带明示行即时重派生）。
 *  （复制面对齐批：`blocks` 随末条复制控件退场除名 —— 其唯一消费者已摘。） */
export const COMPOSER_KEYS = Object.freeze([
  "activeSession", "sessionMeta", "sessionFlags", "tabBadges", "pending", "attachDegraded", "locale",
  "susp", // 挂起窗切片（收正轮 · ③）—— `ev:susp` 置位标 ⇒ 忙态门（`susp` 域）随动重派生
  "providerState", // provider 态投影切片（#841）—— 页读 ∥ 发送 ∥ 设置写三径落切片 ⇒ 明示行即时重派生
])

/** 挂起空闲判据（= 窗活跃 ∧ ¬忙 —— 挂起窗径批 ∥ 窗队列批）：窗内直发径（未起跑）⇒ 回执面据本判据复位 loading
 *  （防窗内残余 Ctrl+C ∕ I 假 affordance）；窗内在飞回合（`running` 位标在）⇒ 零复位（防误关真回合的 Stop 门）。
 *  判据单源 = `views/chrome.mjs` 两件合成（`suspActiveOf ∧ ¬busyOf`）；消费面 = 写面 `sendDirect` 队形回执支。 */
const suspIdleOf = (state, key) => suspActiveOf(state, key) && !busyOf(state, key)

/** 挂件锚属性名（槽内宿主容器 —— 属桌面胶水，不入核件结构锁）。 */
const NOTICES_ANCHOR = "data-composer-notices"

/** IME 组字判据（**单源一处** —— 本档导出）：组字期回车 = 选字确认（归输入法）⇒ 发送面与 `preventDefault` 面
 *  **双零**、键不吞。`keyCode 229` = 兜底臂（老 WebView 不置 `isComposing`；同族先例 = VSC 输入面）。
 *  消费者注（2026-09-29 实读收正）：卡族 Enter 径（P2）已随核卡内建（含 IME 门 —— `renderer/mount-cards.mjs:16`）
 *  ⇒ 本导出现无产品面消费者（导出面保留 —— 判据单源备用）。 */
export function isComposing(event) {
  return event?.isComposing === true || event?.keyCode === 229
}

/** 用户块写入（#458 · KD-23 单源 —— 原 `renderer/composer-send.mjs` `withUserBlock` 迁入本档「deps 边」）：键门 =
 *  现刻活动会话；块由调用方给定（形与回放块同形 · 文本逐字 —— 调用方持引用以备收敛落标记）；并笔回底（同一次 `set`）。 */
function withUserBlock(state, key, block) {
  if (state?.activeSession !== key) return state
  return returnToBottom(appendBlock(state, block))
}

/** 挂载（接线面句柄式）：返回 `{ submit, refresh, keys, detach, refreshCandidates, printHelp }` —— `submit(text)` = **直发径单副本**
 *  （错误横幅重试 · 项 9：写值 ⇒ 触发发送键，零第二实现）；`refresh()` = 词面到位重派生（`boot` `initDict` 之后一次 ——
 *  注册面后到，见其函数注）；`keys` = 重绘触发切片面；`detach` = 退订句柄；`refreshCandidates()` = 候选面**强制刷新口**
 *  （全渠扇出批 · #2 ∕ #3 接线消费 —— `renderer/app.mjs`；在飞期调用 = 位标，见 `composer-sync.mjs`）；
 *  `printHelp()` = `/help` 流内打印口（D36 —— 菜单「命令与快捷键…」出口消费面；返 `true` = 已打印）。 */
export function attachComposer(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const openSettings = typeof deps.openSettings === "function" ? deps.openSettings : undefined
  const pushSubs = []
  let panel = null
  let noticesAnchor = null

  const slotEl = () => (typeof document === "undefined" ? null : document.querySelector(COMPOSER_SLOT))
  const activeKey = () => store.get()?.activeSession ?? null
  const push = (message) => { for (const fn of pushSubs) fn(message) }

  /** 通道往返（归一：桥缺 / 抛 / 畸形回执 ⇒ `{ ok:false, reason }` —— 失败必响亮，零假成功）。 */
  async function call(channel, payload) {
    const invoke = host !== null && typeof host === "object" ? host.invoke : undefined
    if (typeof invoke !== "function") {
      console.error(`[composer] preload bridge missing: ${channel}`)
      return { ok: false, reason: "no-bridge" }
    }
    try {
      const receipt = await invoke(channel, payload)
      if (receipt === null || typeof receipt !== "object") {
        console.error(`[composer] ${channel}: malformed receipt`)
        return { ok: false, reason: "invalid-shape" }
      }
      return receipt
    } catch (error) {
      console.error(`[composer] ${channel} rejected:`, error)
      return { ok: false, reason: String(error?.message ?? error) }
    }
  }

  // ─── 写面（出档 `renderer/composer-wire.mjs` —— 收正轮 · 越 500 硬限前的在册拆分预案落形）────────
  // 通道往返 ∕ 逐类型 handler ∕ 本地先行块标记三态 ∕ B21 失败态皆住该档；本档只注入 deps 并取回 `post`。

  /** cap 待答径队满可见形（#656 · KD-52 ③ —— 回注缝 = 挂载面注入小口）：核件 toast（词键复用 `input.slotFull`
   *  —— i18n 零增；先例 = 忙态径 `thincoder-render-core/composer/panel.mjs:304-306`）+ 文本回注输入框（零丢失）。
   *  回注形 = 空框直置 ∕ 非空框尾并换行（零覆盖 —— 用户已续键入的稿不吞）；`panel` 装配后置位 ⇒ 惰性取用。 */
  function slotFullNotice(text) {
    showToast(t("input.slotFull"))
    const el = panel === null ? null : panel.inputEl
    if (el === null || el === undefined || typeof text !== "string" || text === "") return
    el.value = el.value === "" ? text : `${el.value}\n${text}`
    el.dispatchEvent(new Event("input")) // 核件自适应重算（高度写面单源 = 核 `adjustInputHeight` —— 缓存 `_lastInputHeight` 与实高同源；直写 `style.height` 会越缓存）
    el.focus()
  }

  const wire = createComposerWire({
    store, activeKey, call, push,
    panelOf: () => panel, // 直发失败径复位 loading
    repaint: (state1) => sync.paintNotices(state1), // 提示行重挂（派生面档 `paintNotices` 单源）
    onLoadingReset: () => { sync.resetBusy() }, // 忙态派生缓存复位（收正轮 · 行 8）
    suspIdleOf, // 挂起空闲复位判据（挂起窗径批：窗内直发径未起跑 ⇒ loading 门禁归位）
    slotFullNotice, // #656：cap 待答径队满可见形缝（toast + 文本回注单点）
    toImages, degradedCode, effortOf, withUserBlock, setAttachDegraded, applyFlags,
    openSettings: () => openSettings?.(), // footer 三出口（A8 唯一映射点）
  })
  const post = wire.post

  // ─── 随动派生面（出档 `renderer/composer-sync.mjs` —— #510 留守拆档 · 2026-09-29）──────────────
  // ④ `state` 读面 ∕ 忙态与守卫派生 ∕ 模式位推送 ∕ 候选面 ∕ 提示锚窄刷 ∕ 随动总入口皆住该档；本档只注入 deps
  // （`panel` 与宿主锚 = 装配期后置位 ⇒ 访问器注入；`wire` = 上一步已建）。
  const sync = createComposerSync({
    store, activeKey, call, push, pushSubs, wire,
    panelOf: () => panel,
    noticesOf: () => noticesAnchor,
  })

  // 本地先行块登记（`noteEcho`）与**退流**（`retractEcho`）随写面出档 `renderer/composer-wire.mjs`（收正轮拆分）；
  // 本档 `onUserEcho` 只作登记 —— 消费前流内零**真块**（正径滞后时由回执退流）；待发送块 = 本档提示带（派生）。

  /** B12 出泡钩：**直发径** = 本地先行（写用户块 + 并笔回底）；**忙态 ∕ 挂起窗径** = 零本地块（返 `null` —— 防双泡，
   *  待发送气泡归队镜面 + 帧尾 `markPending`）；**抑制径恒登记**（`noteEcho(key, null)` —— 退流锚恒指本提交，
   *  防误摘既往真块）。返值 = 核件 `markPending` 落笔宿主（各径均无须落笔面）。 */
  function onUserEcho(text, ts) {
    const held = store.get()
    const key = held?.activeSession ?? null
    if (key === null) return null
    // 抑制面（挂起窗径批扩 susp）：忙态 ∨ 挂起窗活跃 ⇒ 零本地块（消费前流内零真块 —— 消费时刻由 `ev:queue.delivered` 补写）
    if (busyOf(held, key) || suspActiveOf(held, key)) {
      wire.noteEcho(key, null)
      return null
    }
    const block = { kind: "user", text }
    if (typeof ts === "number" && Number.isFinite(ts)) block.ts = ts
    wire.noteEcho(key, block) // 认领锚（正径滞后时回执落标 —— 单点在写面档）
    store.set(withUserBlock(held, key, block))
    return null
  }

  const hooks = {
    openSettings: () => openSettings?.(),
    onUserEcho,
    confirmRemoveProvider: () => openSettings?.(), // 删除渠道 = 设置面事（确认门 ∕ 执行面皆住该面）
  }

  // ─── 斜径面（2026-10-01 批 · `/help` 增量）：打印口经**端侧构造点闭包注入**（表构造时绑定 ⇒ 面板 ∥ `ctx` 零触；
  // 行文 = 端表本体经核 `formatHelp`）；条目 `run` 仍只返布尔。

  /** `/help` 打印口（端装配面：返 `true` = 已打印 ⇒ 面板清框 + 入历史）：键空 ⇒ `false`（防御——守卫先于斜径，不可达）；否则行集落切片 + 回底（打印 = 出内容 ⇒ 复跟回底）。 */
  function printHelp() {
    const key = activeKey()
    if (key === null) return false
    store.set(returnToBottom(setHelpLines(store.get(), key, formatHelp(slashCommands, t))))
    return true
  }
  const slashCommands = createSlashCommands(printHelp) // 命令表一处构造（`/help` 条闭包持打印口）

  // ─── 装配 ────────────────────────────────────────────────────────────────

  /** 核件面板样式引入（P10 桌面落位 = 引 `/rc/composer/` **两静态档** —— 面板 `composer.css` + 菜单 `model-menu.css`
   *  〔收正轮：原 JS 注入形在 CSP `style-src 'self'` 下被拒 ⇒ 静态承载，两端口径同源；VSC 同机制 = 其
   *  `webview/controls.css` 两条 `@import`〕）：装配期注 `<link>` —— 端骨架（`renderer/index.html`）本批零改 ⇒
   *  运行期注（幂等：已注 ⇒ 零重注）。`/rc/` = `app://` 第二根（同源）⇒ CSP `style-src 'self'` 放行。 */
  const RC_SHEETS = Object.freeze([
    ["composer", "/rc/composer/composer.css"],
    ["composer-menu", "/rc/composer/model-menu.css"],
  ])
  function injectPanelCss() {
    const head = document.head
    if (head === null || head === undefined || typeof head.querySelector !== "function") return
    for (const [tag, href] of RC_SHEETS) {
      if (head.querySelector(`link[data-rc-css="${tag}"]`) !== null) continue
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = href
      link.setAttribute("data-rc-css", tag)
      head.append(link)
    }
  }

  /** 扁平化 v4（用户 2026-09-30 走查）：`#attach-btn` ∥ `#send-btn` ∥ `#abort-btn` 自 `#input-row` 迁入
   *  `#controls-row`（与模式钮同排 · 右端 `margin-left:auto` 靠齐）——装配期一次性**节点搬移**：
   *  监听 ∥ 工厂持有的引用随节点同行（零行为改）；核件工厂 ∥ 结构零触（VSC 零影响）。 */
  function relocateActionButtons(root) {
    const controlsRow = root.querySelector("#controls-row")
    const inputRow = root.querySelector("#input-row")
    if (controlsRow === null || inputRow === null) return
    for (const id of ["#attach-btn", "#send-btn", "#abort-btn"]) {
      const btn = inputRow.querySelector(id)
      if (btn !== null) controlsRow.append(btn)
    }
  }

  /** 槽装配（一次）：核件样式引入 ⇒ 槽赋 `id="toolbar"`（核件样式规则命中物）⇒ 提示锚 ⇒ 核件面板（工厂按 VSC
   *  序 append 四子树）。槽缺 ∕ 平 node ⇒ `null`（记错一次 —— 零静默）。 */
  function mount() {
    const container = slotEl()
    if (container === null || typeof container.append !== "function") {
      console.error(`[renderer] composer slot missing: ${COMPOSER_SLOT}`)
      return null
    }
    injectPanelCss()
    container.id = "toolbar"
    noticesAnchor = document.createElement("div")
    noticesAnchor.setAttribute(NOTICES_ANCHOR, "")
    container.append(noticesAnchor)
    // 斜径面（2026-10-01 批 · §2 KD-RC-12 ∥ §5 条 6）：命令表 = 端侧构造（一处装配；`/help` 条已闭包持打印口）
    // ⇒ 核件面板收 `deps.slash.commands`，`actions` 由面板装配（钮 handler 提取出的同一函数）；不传 ⇒ 现行为零变（VSC 零接缝）。
    const built = createComposerPanel({ root: container, post, state: sync.state, hooks, slash: { commands: slashCommands } })
    relocateActionButtons(container) // 扁平化 v4：三钮迁入控件行（用户 2026-09-30 走查）
    return built
  }

  panel = mount()
  if (panel !== null) {
    sync.primeBusy(store.get())
    panel.applyBusyLock() // 守卫第三态 + 忙态门首发（构造期面 = VSC 静态起始面 ⇒ 本档补派生）
    sync.syncPanel(store.get())
  }

  const detach = store.subscribe((state1, changedKeys) => {
    const keys = Array.isArray(changedKeys) ? changedKeys : COMPOSER_KEYS
    if (!keys.some((key) => COMPOSER_KEYS.includes(key))) return
    sync.syncPanel(state1)
  })

  /** 直发径单副本（错误横幅重试 —— 项 9）：写值 ⇒ 触发发送键（核件两钮绑定 = 同一提交面）。 */
  function submit(text) {
    if (panel === null || typeof text !== "string" || text.trim() === "") return false
    panel.inputEl.value = text
    const button = typeof document === "undefined" ? null : document.querySelector(`${COMPOSER_SLOT} #send-btn`)
    if (button === null || button === undefined || typeof button.click !== "function") return false
    button.click()
    return true
  }

  /** 词面到位重派生（调用面 = `renderer/app.mjs` `boot`：`initDict` 之后一次 —— **注册面后到**：面板挂载先于
   *  词表下发，缺本次重派生 ⇒ 占位符 ∕ 忙态门题注停留为**键名**（危而未错）；幂等（全派生面重走一遍））。 */
  function refresh() {
    sync.syncPanel()
  }

  return { submit, refresh, keys: COMPOSER_KEYS, detach, refreshCandidates: sync.refreshCandidates, printHelp }
}
