/**
 * panel.mjs — composer 输入行工厂（核化 VSC `webview/input.js`(160) + `webview/send.js`(89) + `webview/loading.js`(96)
 * 三档合流去重——上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P1-P3 ∕ P9；工厂化 = 模块级副作用
 * （DOM 查询 ∕ 事件注册 ∕ `vscode.*` 直调）搬进工厂体 + 注入面，语义零变）。
 *
 * 面：① 结构（`#at-dropdown` ∕ `#input-row`（`#file-input` ∕ `#input` ∕ `#attach-btn` ∕ `#send-btn` ∕
 * `#abort-btn`）∕ `#paste-bar>#paste-badge` ∕ `#controls-row`——ids ∕ 类名照 VSC `index.html:42-63` 输入段，
 * 结构单源 = 该骨架；`#status-line` 属状态行面（A12 本批外）不建）② 键位 B1–B7（Enter ∕ IME 门 ∕ Ctrl+C ∕
 * Ctrl+I 中断模态 ∕ Ctrl+U ∕ ↑↓ 历史 ∕ 自增高）③ 提交面（直发 ∕ 忙态排队出泡（B12 本地先行）∕ 满队 toast）④ 忙态派生
 * （占位符三态 守卫>busy>常态 ∕ 两钮显隐 ∕ 模型推理忙态门）⑤ 推送接线（五类经 ③ `state.subscribe`）
 * ⑥ **斜径面**（2026-10-01 批 · §2 KD-RC-12 ∥ §5 条 6）：提交面拦截段（段序 =「空文本 → 无会话守卫」之后、「忙态入队」
 * 之前）——命中 ∥ 未知回落一律**不进消息径**（零 `msg:send` ∥ `queuedUserMessage` ∥ 用户块 ∥ loading）；反馈键三键发射点 = §5 条 6。
 *
 * 注入面（六项）：
 *  ① `root`——挂载根 DOM 锚（本档按 VSC 序 append 四个子树，不造 `#toolbar` 容器）；
 *  ② `post(type, payload)`——出站归一（端绑 `postMessage({ type, ...payload })`；`"abort"` 无载荷；
 *     `"interrupt" { message }` ∕ `"userMessage"` ∕ `"queuedUserMessage"` ∕ `"atComplete"` ∕
 *     `"selectModel"` ∕ `"selectReasoning"` ∕ `"addProvider"` ∕ `"removeProvider"` ∕ `"setKey"` ∕
 *     四模式位写）；
 *  ③ `state`——读面 + 推送入口：`turnState()`（busy）· `queue()`（`{ count }` 快照）· `models()`（候选初值）·
 *     `flags()`（模式位初值）· `workspaceRequired()`（守卫位）· `subscribe(handler)`（推送入口，五类：
 *     `models` ∕ `autoApprove` ∕ `agentSettings` ∕ `planMode` ∕ `atResults`——载荷 = VSC host 消息形）；
 *  ④ 取词 = **注册面**（非 deps 项）：核内取词走核 `../i18n.mjs` `t`，端侧 `setStrings` 单点注册；
 *  ⑤ `hooks`——跨面副作用 ∕ 状态同步（`openSettings`（控件行第 7 钮）· `onTitleHint`（会话标题提示）·
 *     `onStatusRefresh(status?)`（状态行刷新——`status` = 可选 `{ phase }` 面板态快照，`setLoading` 径给）·
 *     `onTurnStart`（回合起点动作：`_turnStart` 归零 + `clearPanels`（含 `_suspended` 条件）+
 *     工具结果位清）· `onUserEcho(text, ts) → 用户气泡`（`addUser`）· `onWelcomeDismiss`（欢迎条移除）·
 *     `onAgentSettings(settings)`（设置面板刷新）· `syncModeState(flags)`（模式位跨面镜像）·
 *     `confirmRemoveProvider(onConfirm)`（删条确认门）· `closeSiblingDropdowns`（邻面下拉让位））；
 *  ⑥ `slash`（**可选——不传 ⇒ 现行为零变**（VSC 零接缝）；2026-10-01 批 · §5 条 6）：`{ commands }` = 端侧命令表
 *     （条目形 = `{ name, aliases?, rejectKey?, run(ctx) → boolean }`；落点 = `desktop/renderer/slash-commands.mjs`）——
 *     `actions` 由本档装配（「斜径面装配」段 = 钮 handler 提取出的同一函数，同钮同门）。
 *
 * 忙态 ∕ 队列面触发点（端接线）：`loading` 推送 ⇒ `setLoading(on)`；`turnState` ∕ `suspension` 推送 ⇒
 * `setLoading()`（缺省 = 现刻 `isRunning`——VSC `panels.js:95,114` `setLoading(ctx, ctx.isRunning)` 同式）；
 * `workspaceGuard` 推送 ⇒ `applyBusyLock()`（VSC `chat-messages.js:99` 同式）。
 *
 * **拆分债注记**：本档 **489 行**（口径 = 内容行数（文末换行不计），同设计 §2.6 表头注）——越 300 顾问线（设计本批
 * 预估 ≈474；实读偏离 = 斜径面（⑥）新增注释面实量），距 500 硬限余 **11**；触发 = 越 500 前 ∕ 下次实质触碰；
 * 候选拆分面 = 忙态派生段（`applyModelSwitchGate` ∕ `applyBusyLock` ∕ `setLoading`——`loading.js` 面）出档。
 *
 * 回合起点钩的相对序（对 VSC 逐行的唯一近似，见 `send.js:62-72`）：`onTurnStart` 置于 `setLoading` **之前**——
 * 取「`_turnStart` 先于状态行刷新落位」（VSC `:62` 早于 `:68` 的同点，elapsed 段首帧即新回合）；其 `clearPanels`
 * 支随之提前（`send.js:72` 原序在 `setLoading` 后——面板清面与状态行刷新无相互依赖，逐帧不可辨）。
 */
import { t } from "../i18n.mjs"
import { showToast } from "../toast.mjs"
import { markPending, QUEUED_MAX_ITEMS } from "../flow/queued-mark.mjs"
import { createAtMenu } from "./atmenu.mjs"
import { createAttachBar } from "./attach.mjs"
import { createControlsRow } from "./controls.mjs"
import { createModelMenu } from "./model-menu.mjs"
import { routeSlash } from "./slash.mjs"

/**
 * composer 面板工厂。返回端侧接线**最小面**：
 * `{ inputEl, setLoading(on?), applyBusyLock, isRunning(), models() }`——
 * `setLoading(on)` 缺省 = 现刻 loading 标记（宿主忙态推送后的重派生惯用式）；`models()` = 候选缓存读面
 * （VSC `getModels` 接线面）。提交面（`send`）随两钮绑定内生，不出面。
 */
export function createComposerPanel(deps = {}) {
  const { root, post, state = {}, hooks = {}, slash: slashDeps } = deps
  if (!root) throw new Error("createComposerPanel: deps.root（挂载根 DOM 锚）必给")
  if (typeof post !== "function") throw new Error("createComposerPanel: deps.post(type, payload) 必给")

  // ── 斜径面注入读面（§5 条 6——**可选**：不传 ⇒ 现行为零变）：`commands` = 端侧命令表（落点 =
  // `desktop/renderer/slash-commands.mjs`）；`actions` = 本档装配（完整对键形——下「斜径面装配」段）。
  const slashCommands = Array.isArray(slashDeps?.commands) ? slashDeps.commands : null

  // ── 面板态（VSC `ctx` 的 composer 面：input.js ∕ send.js ∕ loading.js 三档共享——核件内生）──
  const ctx = {
    isRunning: false,          // loading 标记（Ctrl+C/I 门禁读）
    _interruptMode: false,     // 中断模态（占位符归属让位给本模态）
    _inputHistory: [],
    _historyIdx: -1,
    _inputDraft: "",
    _pastedImages: [],
  }

  /** 读面（③ state——快照调用点即取即用：宿主推送到达后由端侧触发重派生，见件头注）。 */
  const busyState = () => state.turnState?.() ?? "idle"
  const workspaceRequired = () => state.workspaceRequired?.() === true

  // ── 结构（照 VSC `index.html:43-49`；`#at-dropdown`（:42）由 atmenu 造）──
  const inputRow = document.createElement("div")
  inputRow.id = "input-row"

  const inputEl = document.createElement("textarea")
  inputEl.id = "input"
  inputEl.rows = 1
  inputEl.placeholder = "Ask ThinCoder... (Shift+Enter for new line)"
  inputEl.setAttribute("aria-label", "Message input")

  const sendBtn = document.createElement("button")
  sendBtn.id = "send-btn"
  sendBtn.title = "Send (Enter)"
  sendBtn.setAttribute("aria-label", "Send message")

  const abortBtn = document.createElement("button")
  abortBtn.id = "abort-btn"
  abortBtn.title = "Stop"
  abortBtn.setAttribute("aria-label", "Stop generation")
  abortBtn.style.display = "none"
  abortBtn.textContent = "Stop"

  // 元素入 ctx（VSC `ctx.inputEl` ∕ `sendBtn` ∕ `abortBtn` 三字段同形——档内引用面）
  ctx.inputEl = inputEl
  ctx.sendBtn = sendBtn
  ctx.abortBtn = abortBtn

  // ── ① 输入键位面（`input.js` 逐字；注册序不变量：本档监听先于 atmenu 注册）──

  // Interrupt mode: the input box switches to "inject a message" — Enter aborts
  // the turn and injects it, Esc cancels.
  // INPUT-LOCK-ASYNC（C'）+ INPUT-LOCK-BEHAVIOR-REVISED（2026-09-09）：中断模态 = 注入通道
  // （红线——Ctrl+I 门禁前不误伤）——readOnly 锁已移除（busy 不禁录入）——ctx._interruptMode
  // 让 applyBusyLock 让出占位符（归本模态管理）；退出（Enter/Esc）applyBusyLock 重派生回
  // busy/默认占位符。
  function enterInterruptMode() {
    ctx._interruptMode = true
    ctx.inputEl.placeholder = t("input.interruptPlaceholder")
    ctx.inputEl.classList.add("interrupt-mode")
    ctx.inputEl.focus()
  }
  function exitInterruptMode() {
    ctx._interruptMode = false
    ctx.inputEl.classList.remove("interrupt-mode")
    ctx.inputEl.value = ""
    ctx.inputEl.style.height = "auto"
    applyBusyLock() // 重派生占位符：busy → busy 文案；空闲 → 默认
  }

  ctx.inputEl.addEventListener("keydown", (e) => {
    // Interrupt mode swallows keys: Enter injects the message, Esc cancels.
    if (ctx._interruptMode) {
      if (e.key === "Enter" && !e.shiftKey) {
        // C-B2-1：组合期 Enter 归输入法——不 preventDefault、不注入
        if (e.isComposing) return
        e.preventDefault()
        const msg = ctx.inputEl.value.trim()
        exitInterruptMode()
        if (msg) post("interrupt", { message: msg })
      } else if (e.key === "Escape") {
        exitInterruptMode()
      }
      return
    }
    // Ctrl+C with NO selection while running → Stop (CLI parity). A selection
    // still copies (default browser behavior).
    if (e.key === "c" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
      const hasSelection = ctx.inputEl.selectionStart !== ctx.inputEl.selectionEnd
      if (!hasSelection && ctx.isRunning) {
        e.preventDefault()
        post("abort")
      }
      return
    }
    // Ctrl+I while running → interrupt + inject (CLI parity)
    if (e.key === "i" && e.ctrlKey && !e.altKey && !e.metaKey && ctx.isRunning) {
      e.preventDefault()
      enterInterruptMode()
      return
    }
    // Ctrl+U clears the input line (CLI parity)
    if (e.key === "u" && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      ctx.inputEl.value = ""
      ctx.inputEl.style.height = "auto"
      return
    }
    if (e.key === "Enter" && !e.shiftKey) {
      // C-B2-1：组合期 Enter 归输入法——不 preventDefault、不发送
      if (e.isComposing) return
      e.preventDefault()
      // C-B2-2：@ 下拉打开时让位——Enter 只由 autocomplete 接受建议。让位 = 提前 return 且
      // 保留 preventDefault（防 Enter 默认换行落入输入框；autocomplete 侧仅 active 项存在
      // 时防默认，让位侧自带防默认兜住间隙）。**次序前提**：本监听先于 autocomplete 注册
      // （chat.js `import "./input.js"` 早于 `initAutocomplete()` 调用）——次序反转 = 协调失效。
      if (atMenu.isOpen()) return
      send()
    }
    // Input history / 多行竖移（A10 群 A 批——判定顺序 C-MA10-1）：
    // ① IME 组合期（isComposing / keyCode 229）→ 不处理不防默认（键归输入法）；
    // ② @ 下拉打开 → 不处理（下拉导航让位）；
    // ③ 历史态（_historyIdx !== -1）→ 恒历史（连续上溯与回落恒可用——与光标/单复数行无关）；
    // ④ 非历史态·单行 → 任意位置触发（↑ 载入最新条目 + 草稿 stash；↓ 吞键 + no-op）；
    // ⑤ 非历史态·多行 → 边界门（首行行首 ↑ / 末行行末 ↓ 触发），其余位置不劫持（原生竖移保留）。
    else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      if (e.isComposing || e.keyCode === 229) return // ①
      if (atMenu.isOpen()) return // ②
      const dir = e.key === "ArrowUp" ? -1 : 1
      const el = ctx.inputEl
      if (ctx._historyIdx !== -1) { // ③ 历史态恒历史
        e.preventDefault()
        navigateInputHistory(dir)
      } else if (!el.value.includes("\n")) { // ④ 单行任意位置
        e.preventDefault()
        if (dir < 0) navigateInputHistory(-1) // ↓ = 吞键 + no-op（非历史态无可回落）
      } else { // ⑤ 多行边界门
        const atBoundary = dir < 0 ? el.selectionStart === 0 : el.selectionStart === el.value.length
        if (atBoundary) {
          e.preventDefault()
          navigateInputHistory(dir)
        }
      }
    }
  })

  // 高度自适应：rAF 节流 + IME 组合期间跳过 + 缓存高度（不变则跳过），避免每次击键 write→read 强制全文档 reflow
  let _composing = false
  let _heightRaf = 0
  let _lastInputHeight = 0
  function adjustInputHeight() {
    if (_heightRaf) return
    _heightRaf = requestAnimationFrame(() => {
      _heightRaf = 0
      const target = Math.min(ctx.inputEl.scrollHeight, 150)
      if (target === _lastInputHeight) return // 高度未变，跳过本次，避免每键都写 height
      _lastInputHeight = target
      ctx.inputEl.style.height = "auto"
      ctx.inputEl.style.height = target + "px"
    })
  }
  ctx.inputEl.addEventListener("compositionstart", () => { _composing = true })
  ctx.inputEl.addEventListener("compositionend", () => { _composing = false; adjustInputHeight() })
  ctx.inputEl.addEventListener("input", () => {
    if (_composing) return
    adjustInputHeight()
  })

  /** ↑/↓ input history with draft protection (CLI parity). */
  function navigateInputHistory(dir) {
    const h = ctx._inputHistory
    if (h.length === 0) return
    if (dir < 0) {
      // ↑ — draft → newest entry, then walk older (CLI key-handler parity).
      if (ctx._historyIdx === -1) ctx._inputDraft = ctx.inputEl.value
      ctx._historyIdx = ctx._historyIdx === -1 ? h.length - 1 : Math.max(0, ctx._historyIdx - 1)
    } else {
      // ↓ — walk newer; past the newest returns to the stashed draft.
      if (ctx._historyIdx === -1) return
      ctx._historyIdx++
      if (ctx._historyIdx >= h.length) ctx._historyIdx = -1
    }
    ctx.inputEl.value = ctx._historyIdx === -1 ? ctx._inputDraft : h[ctx._historyIdx]
    const len = ctx.inputEl.value.length
    ctx.inputEl.setSelectionRange(len, len)
    ctx.inputEl.style.height = "auto"
    ctx.inputEl.style.height = Math.min(ctx.inputEl.scrollHeight, 150) + "px"
  }

  // ── ② @ 面（注册序前提：本档键位监听先于本调用——见 `input.js:79-83` 序注）──
  const atMenu = createAtMenu({ post, inputEl: ctx.inputEl })

  // ── ③ 附件面（共享图列 = ctx._pastedImages——send 径 length=0 保身份）──
  const attach = createAttachBar({ images: ctx._pastedImages })

  // ── ④ 控件行（七钮 + 模式钮两态 + AUTO 确认；模型 ∕ 推理钮的两浮层归 model-menu）──
  const controls = createControlsRow({ post, state, hooks, inputRow, inputEl: ctx.inputEl })
  ctx.modelBtn = controls.modelBtn
  ctx.reasoningBtn = controls.reasoningBtn

  // ── ⑤ 模型 ∕ 推理面（两级菜单 + 推理下拉；忙态门判据从本档注入）──
  const modelMenu = createModelMenu({
    post, state, hooks,
    modelBtn: controls.modelBtn,
    reasoningBtn: controls.reasoningBtn,
    controlsRow: controls.el,
    blocked: () => modelSwitchBlocked(),
  })
  ctx.reasoningDropdown = modelMenu.reasoningDropdown

  // ── 装配（序 = VSC `index.html:42-63`：at-dropdown → input-row → paste-bar → controls-row）──
  inputRow.append(attach.fileInput, ctx.inputEl, attach.attachBtn, sendBtn, abortBtn)
  root.append(atMenu.el, inputRow, attach.pasteBar, controls.el)

  // ── 斜径面装配（§5 条 6 动作句柄表——**同钮同门 ∥ 单一实现**）：各 = 钮 handler 提取出的同一函数（落点 = 两工厂
  // 实例导出面 `model-menu.mjs` `open` ∥ `controls.mjs` 三 toggle；门随函数）；消费面 = `cmd.run` 的 `ctx.actions`。
  const actions = {
    openModelMenu: modelMenu.open,
    toggleAuto: controls.toggleAuto,
    togglePlan: controls.togglePlan,
    toggleEng: controls.toggleEng,
  }

  // ── 提交面（`send.js` 逐字；DOM 查询 → 元素引用；跨面副作用 → ⑤ hooks）──

  // 队列镜像（读面 = ③ `state.queue()`——"共享镜面"；本地先行增量 = 同 tick 二连 Enter 守卫，
  // host 推送到达（权威值变化）即收敛——VSC `send.js:40` "本地先行自增 …… host 推送权威收敛" 同义）。
  // `_busyQueuedPending` 镜像位（VSC `send.js:41`）= 保留派生位（`state.js:130` 自注「保留字段」——
  // VSC 全树零读者）：端侧 queued-mark 面（`S` 镜像写者）照旧维护；核侧无消费点 ⇒ 不自持（禁假造）。
  let _qHostSeen = null
  let _qLocal = 0
  function queueCount() {
    const n = state.queue?.()?.count ?? 0
    if (n !== _qHostSeen) { _qHostSeen = n; _qLocal = 0 }
    return n + _qLocal
  }

  function send() {
    const text = ctx.inputEl.value.trim()
    // INPUT-LOCK-ASYNC（C'——2026-09-09）→ C-B2-6（busy-extend 批 2026-09-22）：busy
    // （`turnState === "running"`——回合/digest/标题窗口——与 loading.js 同判据）send 出口守卫 =
    // **排队受理**（本地气泡 + queuedUserMessage；槽满 = 不出泡 + toast）；busy 期输入框不禁
    // （readOnly 锁已移除）——Enter（input.js keydown）与发送按钮同经此门。模态不受影响（AC-6）。
    if (!text) return
    // 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：出口守卫先于 busy 与
    // echo/addUser —— 拒发（文本保留不吞——开文件夹后可重按）+ toast 逐字；无假气泡、无悬挂
    // loading。占位符不在此直写（单点派生 = `applyBusyLock` 第三态）。
    if (workspaceRequired()) {
      showToast(t("workspace.required"))
      return
    }
    // ── 斜径拦截（§2 KD-RC-12 ∥ §5 条 6：段序 =「空文本 → 无会话守卫」之后、「忙态入队」之前）——
    // 命中 ∥ 未知回落一律**不进消息径**；非斜径（`routeSlash` 返 `null`）⇒ 照下方既有径（忙态分流不动）。
    if (slashCommands !== null && handleSlash(text)) return
    // C-B2-6（busy-injection 批 2026-09-21 · busy-extend 批 2026-09-22 扩面 · queue-visible 批 2026-09-24
    // 多槽 + 待发送标记 · `WEBVIEW-INPUT.md` §1）：busy 提交**一律排队**——判据 = `running`（`_suspended`
    // 不再分流：挂起会话内与普通回合同判据）⇒ 本地气泡先行（送达时即该消息 user 回声面）+ 出泡即标记
    // （「待发送」态）+ `queuedUserMessage` 上行（host 队列两载体，容量 8；不 setLoading 不清面板
    // ——回合仍跑在既有流上）；回合态簿记（`_turnStart`）归下一回合起点——零触碰。
    if (busyState() === "running") {
      // C-B2-6 细则① 二次提交守卫（fix 轮 2026-09-22 · queue-visible 批阈值收正 = 容量 8）：队列满
      // （第 9 条——host 权威镜像）⇒ 提交不出泡 / 不清框 + toast
      // （对位 CLI 满队面 = `thincoder-cli/src/tui/key-handler-busy.mjs`）。
      if (queueCount() >= QUEUED_MAX_ITEMS) {
        showToast(t("input.slotFull"))
        return
      }
      _qLocal += 1 // 本地先行自增（受理即置——防同 tick 二连 Enter 竞态；host 推送权威收敛）
      const h = ctx._inputHistory
      if (h[h.length - 1] !== text) h.push(text) // dedupe consecutive repeats
      ctx._historyIdx = -1
      ctx._inputDraft = ""
      hooks.onWelcomeDismiss?.()
      ctx.inputEl.value = ""
      ctx.inputEl.style.height = "auto"
      const images = [...attach.images]
      attach.images.length = 0
      attach.clear()
      markPending(hooks.onUserEcho?.(text, Date.now())) // 出泡即标记（受理即反馈——细则⑦ 本地提交路径）
      const sel = modelMenu.selection()
      post("queuedUserMessage", { text, model: sel.model, reasoning: sel.reasoning, provider: sel.provider, images })
      return
    }
    const h = ctx._inputHistory
    if (h[h.length - 1] !== text) h.push(text) // dedupe consecutive repeats
    ctx._historyIdx = -1
    ctx._inputDraft = ""
    hooks.onTurnStart?.() // 回合起点动作（`_turnStart` 归零 + 面板清 + 工具位清——端侧绑定）
    hooks.onWelcomeDismiss?.()
    ctx.inputEl.value = ""
    ctx.inputEl.style.height = "auto"
    setLoading(true)
    hooks.onUserEcho?.(text, Date.now()) // F（SESSION-RESTORE-PARITY）：本地气泡补真实时间戳——无 ts 不显示的配套
    // Snapshot + clear IN PLACE (GitHub thincoder#3): the shared array is held BY REFERENCE
    // (autocomplete.js holds this array) — reassigning orphanized the shared array. length=0
    // preserves the identity; chips and ✕-delete keep working.
    const images = [...attach.images]
    attach.images.length = 0
    attach.clear()
    const sel = modelMenu.selection()
    post("userMessage", { text, model: sel.model, reasoning: sel.reasoning, provider: sel.provider, images })
    // If session title is auto-generated (Session N), show a hint that a better title is coming
    hooks.onTitleHint?.()
  }

  /** 斜径提交面拦截（解析 ∥ 路由 = `composer/slash.mjs`；拦截段 ∥ 返值语义 = §5 条 6）。返 `true` = 已拦（不再走
   *  消息径——本段不触 `post` ∥ `setLoading` ∥ `hooks.onTurnStart` ∥ `hooks.onUserEcho`）；`false` = 非斜径。
   *  反馈键发射点（§5 条 6 一行表）：`slash.unknown` ∥ `slash.args` = 本档 · 条目 `rejectKey`（`run` 返假径）。 */
  function handleSlash(text) {
    const hit = routeSlash(text, slashCommands)
    if (hit === null) return false
    if (hit.kind === "unknown") {
      showToast(t("slash.unknown", { name: hit.name })) // 未知回落（CLI 同判：不发送）+ 文本保留
      return true
    }
    if (hit.args !== "") {
      showToast(t("slash.args")) // run 前门（本批在册命令均不收参 ⇒ 通用拒）+ 文本保留
      return true
    }
    // `run` 返真 = **已受理**（已执行 ∨ 二段交互在场——`/auto` popover 径同判）⇒ 清框 + 入历史；返假 = 门拒 ⇒ 文本保留 +（`rejectKey` toast）。
    if (hit.cmd.run({ args: hit.args, raw: text, post, actions }) !== true) {
      if (typeof hit.cmd.rejectKey === "string") showToast(t(hit.cmd.rejectKey))
      return true
    }
    const h = ctx._inputHistory
    if (h[h.length - 1] !== text) h.push(text) // dedupe consecutive repeats（同提交面）
    ctx._historyIdx = -1
    ctx._inputDraft = ""
    ctx.inputEl.value = ""
    ctx.inputEl.style.height = "auto"
    return true
  }

  // ── 忙态面（`loading.js` 逐字；DOM 查询 → 元素引用；renderStatusBar → ⑤ `onStatusRefresh`）──

  /**
   * 模型 / 推理按钮忙态门判据（F-W14 · D-W16）：非 `idle`（`running` / `susp`）⇒ 挡。
   * **同经 `turnState` 派生的独立谓词**——与 Send / Stop 的 `=== "running"` 非同一条
   * （本门多含 `susp`：在飞蒸馏落盘窗携旧回合快照——忙态写槽会被旧快照覆写）。
   * 两处写槽入口同读本谓词（model-menu：按钮点击 / `models` 推送自动回写）。
   */
  function modelSwitchBlocked() {
    return busyState() !== "idle"
  }

  /**
   * 忙态门应用（派生单点）：两信息钮**显式禁用**（`disabled` + `aria-disabled`）——不隐藏
   * （屏上须可读当前会话模型 / 推理级；隐藏即失去信息——与 Send 隐藏的分工见 §4.2）；
   * 进忙态时关已弹出的两个浮层（不留「点了没用」的假 affordance）。
   */
  function applyModelSwitchGate() {
    const blocked = modelSwitchBlocked()
    for (const btn of [ctx.modelBtn, ctx.reasoningBtn]) {
      btn.disabled = blocked
      btn.setAttribute("aria-disabled", String(blocked))
    }
    if (blocked) {
      modelMenu.close()
      modelMenu.closeReasoning()
    }
  }

  /** 界面相位（`S._phase` 对应位——`setLoading` 写，`onStatusRefresh` 快照随行）。 */
  let _phase = null

  /**
   * INPUT-LOCK 状态派生单点：busy（`turnState==="running"`——回合/digest/标题窗口）不禁
   * 录入（readOnly 锁移除——打字回显——Enter 拒发由 send 出口守卫兜——文本保留）——只
   * 换 busy 占位符；susp/idle 默认占位符。Ctrl+I interrupt 模态（`ctx._interruptMode`）下
   * 占位符归中断模态管理（本函数不动）。
   */
  function applyBusyLock() {
    const busy = busyState() === "running" && !ctx._interruptMode
    ctx.inputEl.readOnly = false // 锁移除——始终可编辑（INPUT-LOCK-BEHAVIOR-REVISED）
    applyModelSwitchGate() // F-W14：忙态门（与中断模态无关——同点派生，两入口同谓词）
    if (ctx._interruptMode) return
    // 无工作区守卫第三态（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：优先级 **守卫 > busy > 常态**
    ctx.inputEl.placeholder = workspaceRequired()
      ? t("workspace.requiredPlaceholder")
      : (busy ? t("input.busyPlaceholder") : t("input.placeholder"))
  }

  /**
   * Loading state: send/abort button swap + input state + thinking phase marker.
   * INPUT-LOCK：busy（running）不禁录入……**Send 按钮 running 期隐藏**（§14 C-14）——Stop 只在
   * `turnState==="running"` 显（digest/回合执行中可停主会话——susp 纯池跑不显）。每次调用重派生状态
   * （applyBusyLock——不依赖调用方顺序——F7）。`on` 缺省 = 现刻 loading 标记（端侧重派生惯用式）。
   */
  function setLoading(on = ctx.isRunning) {
    _phase = on ? "thinking" : null
    ctx.sendBtn.style.display = busyState() === "running" ? "none" : "flex" // C-14：running 期隐藏（Stop 同派生点）
    ctx.abortBtn.style.display = busyState() === "running" ? "flex" : "none"
    applyBusyLock()
    if (!on) ctx.inputEl.focus()
    ctx.isRunning = on
    // C2 (F-C2c): thinking 段经状态行（唯一 writer）绘制——徽标/挂起计数同线保留 ⇒ 刷新归端。
    hooks.onStatusRefresh?.({ phase: _phase })
  }

  // ── 推送接线（五类——VSC `chat-messages.js` 五 case 同形；经 ③ `state.subscribe` 唯一入口）──
  function applyPush(m) {
    switch (m?.type) {
      case "models": return modelMenu.applyModels(m)
      case "autoApprove": return controls.applyAutoApprove(m)
      case "agentSettings": return controls.applyAgentSettings(m)
      case "planMode": return controls.applyPlanMode(m)
      case "atResults": return atMenu.showAtDropdown(m.matches || [])
    }
  }
  state.subscribe?.(applyPush)

  // ── 两钮点击（VSC `chat.js:47-48` 的输入区绑定面——随工厂化内生）──
  sendBtn.addEventListener("click", send)
  abortBtn.addEventListener("click", () => post("abort"))

  // 返回面（端侧接线**最小面**——逐项各有设计消费点）：`inputEl`（回焦锚——VSC `chat.js:61,105` ∕
  // 桌面 `#input` 查询面）· `setLoading` ∕ `applyBusyLock`（宿主忙态 ∕ 守卫推送后的重派生点——VSC
  // `panels.js:95,114` ∕ `chat-messages.js:99` 同址保位）· `isRunning()`（重派生惯用式的读数）·
  // `models()`（候选缓存读面——VSC `getModels` 接线面 `chat.js:61`）。`send` 出入两钮已内生，不出面。
  return {
    inputEl: ctx.inputEl,
    setLoading,
    applyBusyLock,
    isRunning: () => ctx.isRunning,
    models: () => modelMenu.models(),
  }
}
