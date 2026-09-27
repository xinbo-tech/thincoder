/**
 * mount-composer.mjs — 输入区挂载出档（自 `renderer/app.mjs` 拆出 —— 批 A · 形态单源 = `docs/desktop/design/UI.md` §1 输入区行）：
 *   ① 挂载根 = `renderer/index.html` 单容器 `[data-slot="composer"]`（`.session` 内 · 对话流之后）——
 *      两态 = 有活动会话 ⇒ 可用 ∥ 无 ⇒ 两控件 `disabled`（锚恒在 · 树根 `data-state` = `ready` / `none`）；
 *   ② 键位 = Enter 发送 / Shift+Enter 换行（只拦无 `shiftKey` 的 Enter —— 其余键零动作、不吞键）；
 *      **IME 组字门**（`isComposing` ∥ `keyCode 229` ⇒ 零发送 / 零 `preventDefault` / 零吞键 —— 组字期回车 = 选字确认，
 *      键归输入法；规则单源 = `docs/desktop/design/UI.md` §1 交互行，裁定源 = 批档 §1.16㈢ 第 1 项）；
 *   ③ 忙态（本会话位标含 `running`）⇒ 不发、转**入队**（`pool.queue` 唯一写面 = `renderer/store.mjs` 三纯动作）；
 *      满队（队长 ≥ `QUEUE_MAX`）⇒ 提示行落地（词键 `composer.queue.full`）∧ 该条不入队 ∧ 输入文本保留 ——
 *      提示行由**派生读数** `full` 驱动（队退回上限下 ⇒ 自动退场，零本地提示态）；
 *   ④ 回合尾 flush = **逻辑在此档 · 触发在订阅接线面**（批档 §1.14 裁定「句柄 + 接线面」形）：
 *      `renderer/events-subscribe.mjs` 的回合尾窄口经 `renderer/app.mjs` 递本档 `flushTurnTail` 句柄
 *      ⇒ 本档零第二订阅点；出队序 = **先发后出队**（回执 `ok` 真才出队 —— `ok` 假 ∥ 抛 ⇒ 留队 + `console.error`）；
 *   ⑤ 出泡（#458 · KD-23 · `docs/desktop/design/UI.md` §1 本批注项 2）：`msg:send` 回执 `ok` **真** ∧ 回执键 = 现刻
 *      `activeSession` ⇒ 用户块入流（`{ kind: "user", text }`—— 与回放块同形 · 文本逐字 · 两径同源 = 直发 / 回合尾 flush）；
 *      失败 ∥ 非活动键 ⇒ **零写**（零乐观态 ⇒ 无回滚语义）。失败径零静默：直发失败 ⇒ 文本保留 + `console.error`；
 *      中断出口 = **零乐观写**（不置任何位标）。
 *   ⑥ 草稿 = 本档闭包局部量（**非 store 切片** —— 用户键入零重绘）；重绘按草稿复填（不丢字）、
 *      键入焦点与光标原位还原（回合内池面频变，重绘与键入并发）；
 *   ⑦ 附件面（批 B ⑧）：采集 / 条构树 / 移除 / 载荷投影住 `renderer/attach.mjs`，本档只持**暂存与接线**
 *      （附件数组同为闭包局部量）；清条判据 = **直发 `ok` 真**（`sent` 才清 —— 失败 / 入队 / 满队皆保留：
 *      队条目形 `{ title, status }` 载不了图 ⇒ 宁留不丢）；降级提示行由回执 `degraded` 驱动，下次真发送替换 / 清除。
 *   ⑧ 末条复制控件面（批 B ④）：控形 / 文本面 / 出口效应住 `renderer/views/chat-copy.mjs`（`lastCopyNode`），本档只持
 *      **接线与窄刷**：`deps.writeText` 注入 ⇒ handlers（缺 ⇒ 控件 `disabled` —— 挂载面单点供给 = `renderer/app.mjs`）；
 *      `syncLastCopy` 只换 / 摘那一枚 `[data-action="chat:last"]`（textarea / 草稿 / 附件条零触碰 ⇒ 组字期零风险）。
 * 通道形单源 = `docs/desktop/design/IPC.md` §2（`msg:send` 载荷 `{ key, text, images? }` · `msg:interrupt` 载荷 `{ key }`）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；面向用户文案全经 `t()`（含 `aria-label` —— 零 UI 字面串）、
 * 控制台诊断串非面向用户文案（不经 `t()` —— 同 `renderer/events-subscribe.mjs`）。
 */
import { attachmentBar, collectImages, degradedCode, degradedNotice, toImages } from "./attach.mjs"
import { build, clear } from "./dom.mjs"
import { t } from "./i18n.mjs"
import { appendBlock, dequeue, enqueue, QUEUE_MAX, store as defaultStore } from "./store.mjs"
import { lastAssistantText, lastCopyNode } from "./views/chat-copy.mjs"
import { wire } from "./views/chat-tool.mjs"

/** 输入区容器锚（骨架属性住 `renderer/index.html`）。 */
export const COMPOSER_SLOT = '[data-slot="composer"]'

/** 重绘触发切片：活动会话（两态）· 池（满队提示）· 语言（词面）· 块（末条复制控件两态 / 取文源 —— 窄口只换
 *  那一枚控件，输入框 / 草稿 / 附件条零触碰）—— 本档树只读此四切片。 */
export const COMPOSER_KEYS = Object.freeze(["activeSession", "pool", "locale", "blocks"])

/** 忙态判据（**单源** —— `docs/desktop/design/UI.md` §1 输入区行「本会话位标含 `running`」，读**现刻**态）。 */
function isBusy(state, key) {
  const codes = state?.tabBadges?.[key]
  return Array.isArray(codes) && codes.includes("running")
}

/** IME 组字判据（**单源一处**）：组字期回车 = 选字确认（归输入法，非发送态动作）⇒ 发送面与 `preventDefault`
 *  面**双零**、键不吞；`isComposing` = 标准形（设计行点名）。`keyCode 229` = **实施追加的兜底臂**（老 WebView
 *  不置 `isComposing` —— 同族先例 = `thincoder-vscode` 输入面）；两臂同径 —— 一条谓词两处命中。 */
function isComposing(event) {
  return event?.isComposing === true || event?.keyCode === 229
}

/** 帧态 → 输入区模型（纯函数 · 零 DOM）：`active` = 两态闸 · `full` = 满队闸 · `blocks` = 末条复制控件取文源
 *  （缺 / 非数组 ⇒ 空表 ⇒ 零控件）· `text` / `attachments` / `degraded`
 *  = 外部持有的输入区局部态（缺省容忍 —— 既有部分 framestate 不携附件面 ⇒ 零条零提示）。 */
export function composerModel(state, extras = {}) {
  const queue = state?.pool?.queue
  return {
    active: (state?.activeSession ?? null) !== null,
    full: Array.isArray(queue) && queue.length >= QUEUE_MAX,
    blocks: Array.isArray(state?.blocks) ? state.blocks : [],
    text: typeof extras?.text === "string" ? extras.text : "",
    attachments: Array.isArray(extras?.attachments) ? extras.attachments : [],
    degraded: extras?.degraded ?? null,
  }
}

/** 输入区构树（描述符 · 零 DOM）：子序 = [满队提示?] → [降级提示?] → [附件条?] → 输入框 → 中断键 → [末条复制控件?]。
 *  两态通则：无活动会话 ∥ 接线面句柄缺 ⇒ 输入框 `disabled`（中断键两态走 `wire` —— 零隐藏，锚恒在）；末条复制控件
 *  在场 ⟺ 有 `assistant` 块（`views/chat-copy.mjs` `lastCopyNode` —— 取文源 = 末 `assistant` 块）。 */
export function composerTree(model, handlers = {}) {
  const active = model?.active === true
  const usable = active && typeof handlers?.onKeyDown === "function"
  const children = []
  if (model?.full === true) {
    children.push({
      tag: "div",
      props: { class: "composer-notice", "data-notice": "queue-full" },
      children: [t("composer.queue.full")],
    })
  }
  const notice = degradedNotice(model?.degraded)
  if (notice !== null) children.push(notice)
  const bar = attachmentBar(model?.attachments, handlers)
  if (bar !== null) children.push(bar)
  const input = {
    tag: "textarea",
    props: {
      class: "composer-input", "data-input": "text", rows: "1",
      "aria-label": t("composer.input"), value: model?.text ?? "",
    },
    children: [],
  }
  if (usable) {
    input.props.onKeyDown = handlers.onKeyDown
    if (typeof handlers?.onInput === "function") input.props.onInput = handlers.onInput
    if (typeof handlers?.onPaste === "function") input.props.onPaste = handlers.onPaste
  } else {
    input.props.disabled = true
  }
  children.push(input)
  children.push({
    tag: "button",
    props: wire(
      { class: "composer-interrupt", "data-action": "msg:interrupt" },
      active ? handlers?.onInterrupt : undefined,
    ),
    children: [t("composer.interrupt")],
  })
  const lastCopy = lastCopyNode(model?.blocks, handlers)
  if (lastCopy !== null) children.push(lastCopy)
  return { tag: "div", props: { class: "composer", "data-state": active ? "ready" : "none" }, children }
}

/** 键入焦点是否已在本档输入框（重绘前判定 —— 判据 = `data-input="text"` 标记）。 */
function activeInput() {
  if (typeof document === "undefined") return null
  const active = document.activeElement
  if (active === null || active === undefined) return null
  if (typeof active.getAttribute !== "function" || active.getAttribute("data-input") !== "text") return null
  return active
}

/** 重绘后原位还原焦点与光标（保字、不跳光标 —— 池面在回合内频变，重绘与键入并发）。 */
function restoreFocus(root, caret) {
  if (caret === null || typeof root.querySelector !== "function") return
  const next = root.querySelector('[data-input="text"]')
  if (next === null || next === undefined || typeof next.focus !== "function") return
  next.focus()
  if (typeof next.setSelectionRange === "function" && typeof caret[0] === "number") next.setSelectionRange(caret[0], caret[1])
}

/** 薄挂载（池面同形）：树根属性落宿主（骨架属性 `data-slot` 不动）→ 清容器 → 子树入宿主。
 *  宿主缺 ⇒ 返模型（零动作 · 零抛 —— 挂载面走查随人工）。 */
export function mountComposer(root, model, handlers = {}) {
  if (!root || typeof root.setAttribute !== "function") return model
  const focused = activeInput()
  const caret = focused === null ? null : [focused.selectionStart, focused.selectionEnd]
  const tree = build(composerTree(model, handlers))
  for (const name of tree.getAttributeNames()) root.setAttribute(name, tree.getAttribute(name))
  clear(root)
  for (const child of [...tree.childNodes]) root.append(child)
  /** 草稿复填（挂载后按 **属性赋值** —— `<textarea>` 的 `value` 内容属性是否承载显示值存疑（走查项 T-DSK21）：
   *  赋值路径与平台无关 ⇒ 描述符 `value` 属性 + 此处赋值两条路径同覆盖，「重绘按草稿复填」恒成立）。 */
  if (typeof root.querySelector === "function" && typeof model?.text === "string") {
    const box = root.querySelector('[data-input="text"]')
    if (box !== null && box !== undefined) box.value = model.text
  }
  restoreFocus(root, caret)
  return model
}

/** 通道出口（归一化：桥缺 / 抛 / 畸形回执 ⇒ `{ ok:false, reason }` —— 失败必响亮，零假成功）。 */
async function ask(host, channel, payload) {
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
    if (receipt.ok !== true) console.error(`[composer] ${channel} failed: ${receipt.reason ?? "unknown"}`)
    return receipt
  } catch (error) {
    console.error(`[composer] ${channel} rejected:`, error)
    return { ok: false, reason: String(error?.message ?? error) }
  }
}

/** 用户块写入（#458 · KD-23 单源）：回执 `ok` 真 ∧ 本键 = **现刻**活动会话 ⇒ 尾追 `{ kind: "user", text }`
 *  （与 `blockOfMessage` 回放块**同形** —— 无 `id` / 无 `status`）；非活动键 ⇒ **零写**（`blocks` 引用不变）；
 *  写入走**既有**纯动作 `appendBlock`（`renderer/store.mjs:73`）。回值 = 下一态（供调用面续接同一次 `store.set`）。 */
function withUserBlock(state, key, text) {
  if (state?.activeSession !== key) return state
  return appendBlock(state, { kind: "user", text })
}

/** 提交判据（纯逻辑薄壳 · 注入面 = `{ store, host, onReceipt }` —— 平 node 可测；回值 = 出口语汇）：
 *  空白串 ⇒ `empty`（零动作 · 零 IPC）· 无活动会话 ⇒ `no-session`（零动作 —— 锚已 `disabled`，防御档）；
 *  忙态 ⇒ **入队**（满队 ⇒ `full` —— 不入队、文本保留 ∥ 受理 ⇒ `queued`；队条目形载不了附件 ⇒ 图形零动作）；
 *  闲态 ⇒ 直发（载荷 `{ key, text, images? }` —— 零附件 ⇒ **不落 `images` 键**（批 A 形不变）；回执 `ok` 真 ⇒ `sent`
 *  ∧ **用户块入流**（`withUserBlock`）∥ 假 ⇒ `kept` —— 文本保留；失败已由 `ask` 响亮）；`onReceipt` = 回执钩（降级面记录，随 `ask` 回递）。 */
export async function submitDraft({ store = defaultStore, host, onReceipt } = {}, text, images) {
  const value = typeof text === "string" ? text : ""
  if (value.trim() === "") return "empty"
  const state = store.get()
  const key = state?.activeSession ?? null
  if (key === null) return "no-session"
  if (isBusy(state, key)) {
    const next = enqueue(state, value)
    if (next === state) return "full"
    store.set(next)
    return "queued"
  }
  const payload = { key, text: value }
  if (Array.isArray(images) && images.length > 0) payload.images = images
  const receipt = await ask(host, "msg:send", payload)
  if (typeof onReceipt === "function") onReceipt(receipt)
  if (receipt.ok === true) store.set(withUserBlock(store.get(), key, value))
  return receipt.ok === true ? "sent" : "kept"
}

/** 回合尾 flush：队首一条经 `msg:send` 发出，**回执 `ok` 真才出队**（先发后出队 —— 失败 ⇒ 留队 + `console.error`，
 *  零静默丢条）；空队 ⇒ 零动作（零 IPC）。目标会话 = 现刻 `activeSession`（队列**不按会话分键** —— 条目形单源
 *  `{ title, status }` 无会话位）；无活动会话 ⇒ 留队 + `console.error`；**受理 ⇒ 用户块入流**（#458 键门内判 ——
 *  非活动键零写）并出队（同一次 `set` —— 同帧零二次重绘）。回值 = 是否发出。
 *  **在飞卫兵**：同刻只许一次（交叠 ⇒ 本刻零动作 + 一行诊断 —— 余者待下一回合尾；防同条双发 / 连摘两条 ⇒ 保「一次一条」）。 */
let flushInFlight = false
export async function flushTurnTail({ store = defaultStore, host } = {}) {
  if (flushInFlight) {
    console.error("[composer] msg:send: queue flush overlapped an in-flight flush — deferred to next turn tail")
    return false
  }
  flushInFlight = true
  try {
    const head = (store.get()?.pool?.queue ?? [])[0]
    if (head === undefined) return false
    const key = store.get()?.activeSession ?? null
    if (key === null) {
      console.error("[composer] msg:send: queue flush without active session — kept")
      return false
    }
    const receipt = await ask(host, "msg:send", { key, text: head.title })
    if (receipt.ok !== true) return false
    // 受理 ⇒ 用户块入流（#458 键门内判 —— 非活动会话零写）+ 出队：同一次 `set`（同帧 —— 零二次重绘）
    store.set(dequeue(withUserBlock(store.get(), key, head.title)))
    return true
  } finally {
    flushInFlight = false
  }
}

/** 挂载（接线面句柄式 —— 消费面一行 `attachComposer(host)`）：返回
 *  `{ paintComposer, flushTurnTail, handlers, keys, detach }`；**回合尾触发接线不在此档**
 *  （`renderer/app.mjs` 把 `flushTurnTail` 句柄交 `renderer/events-subscribe.mjs` 的回合尾窄口 —— 批档 §1.14）。 */
export function attachComposer(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const writeText = typeof deps.writeText === "function" ? deps.writeText : undefined
  let draft = ""
  let attachments = []
  let degraded = null
  let attachmentSeq = 0
  let signature = null
  const root = () => (typeof document === "undefined" ? null : document.querySelector(COMPOSER_SLOT))

  const nextAttachmentId = () => {
    attachmentSeq += 1
    return `a${attachmentSeq}`
  }
  const submit = (text, images) => submitDraft({ store, host, onReceipt }, text, images)

  /** 草稿镜（键入零重绘：DOM 自持字符，本处只跟一份 —— 重绘复填用）。 */
  function onInput(event) {
    const value = event?.target?.value
    if (typeof value === "string") draft = value
  }

  /** 粘贴采集（`paste` 事件 ⇒ 剪贴板图像项入条）：非图内容**零动作**（不 `preventDefault` —— 文本照粘贴）、
   *  零项 ⇒ 零重绘；异步读毕才入列 ⇒ 并发粘贴不互相覆盖。 */
  function onPaste(event) {
    void collectImages(event).then((items) => {
      if (items.length === 0) return
      attachments = [...attachments, ...items.map((item) => ({ id: nextAttachmentId(), ...item }))]
      paintComposer()
    })
  }

  /** 移除出口（锚键 ⇒ 过滤 —— 树锚 `data-attachment-id` 与条目 `id` 同源）。 */
  function onRemoveAttachment(id) {
    attachments = attachments.filter((entry) => entry.id !== id)
    paintComposer()
  }

  /** 回执降级面（**只记态不重绘** —— 重绘由 `onKeyDown` 的 outcome 径统一驱动；表外码 ⇒ 一行诊断 + 零节点）。 */
  function onReceipt(receipt) {
    if (receipt?.ok !== true) return
    const code = degradedCode(receipt?.degraded)
    if (code === null && receipt?.degraded !== undefined && receipt?.degraded !== null) {
      console.error(`[composer] msg:send: unknown degraded code: ${String(receipt.degraded)}`)
    }
    degraded = code
  }

  /** Enter 发送 / Shift+Enter 换行（其余键零动作 —— 不吞键）；`sent` / `queued` 才清输入，余者文本保留。
   *  清条判据 = **直发 `ok` 真**（`sent` —— 入队条目载不了附件 ⇒ 图形保留，宁留不丢）。
   *  组字门**先于一切分支**（组字期 Enter / Shift+Enter 同径零动作 —— 零发送 · 零 `preventDefault` · 零吞键）。 */
  function onKeyDown(event) {
    if (isComposing(event)) return
    if (event?.key !== "Enter" || event?.shiftKey === true) return
    if (typeof event.preventDefault === "function") event.preventDefault()
    const value = event?.target?.value
    void submit(typeof value === "string" ? value : draft, toImages(attachments)).then((outcome) => {
      if (outcome !== "sent" && outcome !== "queued") return
      if (outcome === "sent") attachments = []
      draft = ""
      paintComposer()
    })
  }

  /** 中断出口（**零乐观写** —— 不置任何位标；无活动会话 ⇒ 零动作，回执 `idle` 径由 `ask` 响亮）。 */
  function onInterrupt() {
    const key = store.get()?.activeSession ?? null
    if (key === null) return
    void ask(host, "msg:interrupt", { key })
  }

  /** 接线面句柄表（馈 `composerTree` / `mountComposer` 两处，并随返回值外露 —— 判据②「handlers 接线」的机检面）。
   *  `writeText` = 末条复制控件效应（缺 ⇒ 控件 `disabled` —— 两态通则，`views/chat-copy.mjs`）。 */
  const handlers = { onInput, onKeyDown, onInterrupt, onPaste, onRemoveAttachment, writeText }

  /** 末条复制控件窄刷（取文源 = 末 `assistant` 块）：文本读数变 ⇒ 只换 / 摘那一枚锚（`null` ⇔ 零控件）；
   *  读数同 ⇒ 零 DOM 写（流式帧只重建无控件的子面 —— 输入框 / 草稿 / 附件条零触碰）。 */
  let lastCopyText = null
  function syncLastCopy(state) {
    const blocks = Array.isArray(state?.blocks) ? state.blocks : []
    const text = lastAssistantText(blocks)
    if (text === lastCopyText) return
    lastCopyText = text
    const container = root()
    if (container === null || typeof container.querySelector !== "function") return
    const current = container.querySelector('[data-action="chat:last"]')
    const next = lastCopyNode(blocks, handlers)
    if (next === null) {
      if (current !== null && current !== undefined) current.remove()
      return
    }
    if (current === null || current === undefined) container.append(build(next))
    else current.replaceWith(build(next))
  }

  /** 重绘（回值 = 挂载面回值：宿主缺 ⇒ 模型 —— 平 node 可读态面）；窄刷读数同步置位（全量树里那枚控件同源）。 */
  function paintComposer(state = store.get()) {
    lastCopyText = lastAssistantText(Array.isArray(state?.blocks) ? state.blocks : [])
    return mountComposer(root(), composerModel(state, { text: draft, attachments, degraded }), handlers)
  }

  /** 重绘闸（签名 = 三切片派生读数）：池面频变但两态 / 满队 / 语言未变 ⇒ 零重绘（不夺键入焦点）。 */
  const paintIfChanged = (state) => {
    const next = `${state?.activeSession ?? ""}|${composerModel(state).full}|${state?.locale ?? ""}`
    if (next === signature) return
    signature = next
    paintComposer(state)
  }

  const detach = store.subscribe((state, changedKeys) => {
    const keys = Array.isArray(changedKeys) ? changedKeys : COMPOSER_KEYS
    if (!keys.some((key) => COMPOSER_KEYS.includes(key))) return
    syncLastCopy(state)
    paintIfChanged(state)
  })

  paintIfChanged(store.get())
  return { paintComposer, flushTurnTail: () => flushTurnTail({ store, host }), handlers, keys: COMPOSER_KEYS, detach }
}
