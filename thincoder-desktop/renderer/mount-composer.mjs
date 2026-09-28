/**
 * mount-composer.mjs — 输入区挂载出档（自 `renderer/app.mjs` 拆出 —— 批 A · 形态单源 = `docs/desktop/design/UI.md` §1 输入区行）：
 *   ① 挂载根 = `renderer/index.html` 单容器 `[data-slot="composer"]`（`.session` 内 · 对话流之后）——
 *      两态 = 有活动会话 ⇒ 可用 ∥ 无 ⇒ 两控件 `disabled`（锚恒在 · 树根 `data-state` = `ready` / `none`）；
 *   ② 键位 = Enter 发送 / Shift+Enter 换行（只拦无 `shiftKey` 的 Enter —— 其余键零动作、不吞键）；
 *      **IME 组字门**（`isComposing` ∥ `keyCode 229` ⇒ 零发送 / 零 `preventDefault` / 零吞键 —— 组字期回车 = 选字确认，
 *      键归输入法；规则单源 = `docs/desktop/design/UI.md` §1 交互行，裁定源 = 批档 §1.16㈢ 第 1 项）；
 *   ③ **忙态提交 = 一律交宿主任判**（「回合中插入」批收正 —— 受理判据 = 宿主在飞表；渲染面**不再本地判忙入队**，
 *      本档零队列写面）：受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **入队即出泡**（流尾待发送气泡 —— 由
 *      `ev:queue` 镜面出）+ 输入区清空；满队 ⇒ 回执 `{ ok: false, reason: "queue-full" }` ⇒ 提示行（词键
 *      `composer.queue.full` —— 由**派生读数** `full` 驱动：本键队长 ≥ `QUEUE_MAX` ⇒ 在场，队退回上限下 ⇒ 自动退场）；
 *   ④ **回合尾 flush 携行随本批退场（非并存 —— 防双写者同条重复投递）**：队列消费改宿主驱动（步边界注入 ∕
 *      回合尾续发，单源 = `docs/desktop/design/PROJECT.md` §2 KD-40）；窄口 `onTurnTail` 存续（标题刷新消费面
 *      不动 —— `renderer/events-subscribe.mjs`）；
 *   ⑤ 出泡（#458 · KD-23 · `docs/desktop/design/UI.md` §1 本批注项 2）：直发 `msg:send` 回执 `ok` **真** ∧ 回执键 =
 *      现刻 `activeSession` ⇒ 用户块入流（`{ kind: "user", text }` —— 与回放块同形 · 文本逐字）；**队列消费径** ⇒
 *      用户块由归约面入流（`renderer/events.mjs` `ev:queue` 消费回执 —— 气泡退场 ∧ 同位置交接）；失败 ∥ 非活动键
 *      ⇒ **零写**（零乐观态 ⇒ 无回滚语义）。失败径零静默：直发失败 ⇒ 文本保留 + `console.error`；
 *      中断出口 = **零乐观写**（不置任何位标）。
 *   ⑥ 草稿 = 本档闭包局部量（**非 store 切片** —— 用户键入零重绘）；重绘按草稿复填（不丢字）、
 *      键入焦点与光标原位还原（回合内池面频变，重绘与键入并发）；
 *   ⑦ 附件面（批 B ⑧）：采集 / 条构树 / 移除 / 载荷投影住 `renderer/attach.mjs`，本档只持**暂存与接线**
 *      （附件数组同为闭包局部量）；**清条判据 = 直发 `ok` 真 ∥ 入队受理**（`sent` / `queued` —— 队条目**携图**
 *      〔KD-40 ⑤〕⇒ 图形随条目走，保留 = 下回合重发）；降级提示行源 = `attachDegraded` 切片（写者两处：直发回执 ∥
 *      `ev:queue` 消费回执 —— 提示行由树面出，本档零本地降级态）。
 *   ⑧ 末条复制控件面（批 B ④）：控形 / 文本面 / 出口效应住 `renderer/views/chat-copy.mjs`（`lastCopyNode`），本档只持
 *      **接线与窄刷**：`deps.writeText` 注入 ⇒ handlers（缺 ⇒ 控件 `disabled` —— 挂载面单点供给 = `renderer/app.mjs`）；
 *      `syncLastCopy` 只换 / 摘那一枚 `[data-action="chat:last"]`（textarea / 草稿 / 附件条零触碰 ⇒ 组字期零风险）。
 *   ⑨ **「对齐第三批」面（本档）**：发送后回底并笔（项 13 —— 直发径 `appendBlock` + `returnToBottom`，入队径不回底）·
 *      非栅格粘贴拒提示行（项 22 —— `data-notice="attach-unsupported"`）· 发送失败可见性（项 26 ——
 *      `data-notice="send-failed"` + 文本保留，下次成功发送清）· 中断键两态（P28 —— `busy` 判据 = 本会话位标含 `running`）。
 * 发送面三件（`ask` / `withUserBlock` / `submitDraft`）出档 `renderer/composer-send.mjs`（「回合中插入」批拆分产出 ——
 * 本档只留挂载 ∕ 构树 ∕ 接线；调用面 import 路径 = 该档）。
 * 通道形单源 = `docs/desktop/design/IPC.md` §2（`msg:send` 载荷 `{ key, text, images? }` · `msg:interrupt` 载荷 `{ key }`）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据）；面向用户文案全经 `t()`（含 `aria-label` —— 零 UI 字面串）、
 * 控制台诊断串非面向用户文案（不经 `t()` —— 同 `renderer/events-subscribe.mjs`）。
 */
import { ask, submitDraft } from "./composer-send.mjs"
import { attachmentBar, collectImages, degradedCode, degradedNotice, pasteRejects, toImages, unsupportedNotice } from "./attach.mjs"
import { build, clear } from "./dom.mjs"
import { t } from "./i18n.mjs"
import { QUEUE_MAX } from "./queue.mjs"
import { setAttachDegraded, store as defaultStore } from "./store.mjs"
import { lastAssistantText, lastCopyNode } from "./views/chat-copy.mjs"
import { wire } from "./views/chat-tool.mjs"

/** 输入区容器锚（骨架属性住 `renderer/index.html`）。 */
export const COMPOSER_SLOT = '[data-slot="composer"]'

/** 重绘触发切片：活动会话（两态）· **位标（中断键两态 / 忙态）**· 排队（满队提示 + 队面 —— 本会话队镜面）·
 *  **附件降级码切片**（提示行源 —— 两写者同键）· 语言（词面）· 块（末条复制控件两态 / 取文源 ——
 *  窄口只换那一枚控件，输入框 / 草稿 / 附件条零触碰）—— 本档树只读此数切片。 */
export const COMPOSER_KEYS = Object.freeze(["activeSession", "tabBadges", "pending", "attachDegraded", "locale", "blocks"])

/** 忙态判据（**单源** —— `docs/desktop/design/UI.md` §1 输入区行「本会话位标含 `running`」，读**现刻**态；
 *  用途 = 中断键两态（P28）—— 提交径不再本地判忙，一律交宿主任判）。 */
function isBusy(state, key) {
  const codes = state?.tabBadges?.[key]
  return Array.isArray(codes) && codes.includes("running")
}

/** IME 组字判据（**单源一处** —— 「对齐第三批」P2 起为导出面：卡族 Enter 径 `renderer/mount-cards.mjs` 同取，零副本）：
 *  组字期回车 = 选字确认（归输入法，非发送态动作）⇒ 发送面与 `preventDefault` 面**双零**、键不吞；
 *  `isComposing` = 标准形（设计行点名）。`keyCode 229` = **实施追加的兜底臂**（老 WebView 不置 `isComposing`
 *  —— 同族先例 = `thincoder-vscode` 输入面）；两臂同径 —— 一条谓词两处命中。 */
export function isComposing(event) {
  return event?.isComposing === true || event?.keyCode === 229
}

/** 帧态 → 输入区模型（纯函数 · 零 DOM）：`active` = 两态闸 · **`busy` = 中断键两态闸**（本会话位标含 `running`）·
 *  `full` = 满队闸（**本会话队** —— `pending[活动会话键]` 镜面；满队提示行判据）· `degraded` = 本键降级码
 *  （`attachDegraded` 切片 —— 经 `degradedCode` 过闸：表外码 ⇒ `null` ⇒ 零节点）·
 *  `blocks` = 末条复制控件取文源（缺 / 非数组 ⇒ 空表 ⇒ 零控件）· `text` / `attachments` / `unsupported` / `failed`
 *  = 外部持有的输入区局部态（缺省容忍 —— 既有部分 framestate 不携附件 / 提示面 ⇒ 零条零提示）。 */
export function composerModel(state, extras = {}) {
  const key = state?.activeSession ?? null
  const queue = key === null ? null : state?.pending?.[key]
  return {
    active: (state?.activeSession ?? null) !== null,
    busy: isBusy(state, key),
    full: Array.isArray(queue) && queue.length >= QUEUE_MAX,
    degraded: degradedCode(state?.attachDegraded?.[key] ?? null),
    blocks: Array.isArray(state?.blocks) ? state.blocks : [],
    text: typeof extras?.text === "string" ? extras.text : "",
    attachments: Array.isArray(extras?.attachments) ? extras.attachments : [],
    // 「对齐第三批」项 22 / 26 两提示面（mime 串 / reason 串 —— 缺 ⇒ `null` ⇒ 零节点）
    unsupported: typeof extras?.unsupported === "string" && extras.unsupported !== "" ? extras.unsupported : null,
    failed: typeof extras?.failed === "string" && extras.failed !== "" ? extras.failed : null,
  }
}

/** 直发失败提示行（项 26 —— `composer-notice` 单形；`${reason}` 入词）：reason 缺 / 非串 / 空 ⇒ `null`（零节点 —— 禁假造）。 */
function failedNotice(reason) {
  if (typeof reason !== "string" || reason === "") return null
  return { tag: "div", props: { class: "composer-notice", "data-notice": "send-failed" }, children: [t("composer.send.failed", { reason })] }
}

/** 输入区构树（描述符 · 零 DOM）：子序 = [满队提示?] → [降级提示?] → [**非栅格拒提示?**] → [**直发失败提示?**] → [附件条?] → 输入框 → 中断键 → [末条复制控件?]。
 *  两态通则：无活动会话 ∥ 接线面句柄缺 ⇒ 输入框 `disabled`；中断键两态（P28）= 在飞（`busy`）∧ 句柄在场 ⇒ 可点，
 *  余者 `disabled`（**锚恒在** —— 零隐藏）；末条复制控件在场 ⟺ 有 `assistant` 块（`views/chat-copy.mjs` `lastCopyNode`）。 */
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
  const unsupported = unsupportedNotice(model?.unsupported)
  if (unsupported !== null) children.push(unsupported)
  const failed = failedNotice(model?.failed)
  if (failed !== null) children.push(failed)
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
      active && model?.busy === true ? handlers?.onInterrupt : undefined,
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

/** 挂载（接线面句柄式 —— 消费面一行 `attachComposer(host)`）：返回 `{ paintComposer, handlers, keys, detach }`。
 *  **回合尾触发接线不在本档**（队列消费改宿主驱动 —— 步边界注入 ∕ 回合尾续发；`renderer/events-subscribe.mjs`
 *  窄口 `onTurnTail` 存续 = 标题刷新消费面，本档零挂接）。 */
export function attachComposer(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const writeText = typeof deps.writeText === "function" ? deps.writeText : undefined
  let draft = ""
  let attachments = []
  let unsupported = null
  let failed = null
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
   *  零项 ⇒ 零重绘；异步读毕才入列 ⇒ 并发粘贴不互相覆盖。**非栅格拒（项 22 · 粘贴即拒）**：拒表非空 ⇒ 不入条 +
   *  提示行（首枚 mime 入词 —— 逐串出词；表空 = 采集成功 ⇒ 前提示替换清）。 */
  function onPaste(event) {
    const rejected = pasteRejects(event)
    const next = rejected.length > 0 ? rejected[0] : null
    const noticeChanged = next !== unsupported // 提示态实际变 ⇒ 即使零图像项亦重绘（状态与 DOM 不滞留）
    unsupported = next
    void collectImages(event).then((items) => {
      if (items.length > 0) attachments = [...attachments, ...items.map((item) => ({ id: nextAttachmentId(), ...item }))]
      if (items.length > 0 || noticeChanged) paintComposer()
    })
  }

  /** 移除出口（锚键 ⇒ 过滤 —— 树锚 `data-attachment-id` 与条目 `id` 同源）。 */
  function onRemoveAttachment(id) {
    attachments = attachments.filter((entry) => entry.id !== id)
    paintComposer()
  }

  /** 回执面（**只记态不重绘** —— 重绘由 `onKeyDown` 的 outcome 径统一驱动）：**降级码切片写**（`attachDegraded` ——
   *  提示行树面源；闭集两值，表外码 ⇒ 一行诊断 + 零节点）；**满队径**（`queue-full`）⇒ 零失败提示（提示行归派生
   *  `full` —— 理由码不入用户面）；**失败径（项 26）** = 余 `ok` 假 ⇒ 记 reason（归一 —— 缺 / 非串 ⇒ `unknown`）
   *  ⇒ 提示行；成功径 ⇒ **清失败提示**（下次成功发送清）。 */
  function onReceipt(receipt, key) {
    if (receipt?.ok !== true) {
      if (receipt?.reason === "queue-full") { failed = null; return }
      failed = typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "unknown"
      return
    }
    failed = null
    const code = degradedCode(receipt?.degraded)
    if (code === null && receipt?.degraded !== undefined && receipt?.degraded !== null) {
      console.error(`[composer] msg:send: unknown degraded code: ${String(receipt.degraded)}`)
    }
    store.set(setAttachDegraded(store.get(), key, code))
  }

  /** Enter 发送 / Shift+Enter 换行（其余键零动作 —— 不吞键）；`sent` / `queued` 才清输入，余者文本保留。
   *  清条判据 = **直发 `ok` 真 ∥ 入队受理**（`queued` —— 队条目携图 ⇒ 图形随条目走，保留 = 下回合重发）。
   *  组字门**先于一切分支**（组字期 Enter / Shift+Enter 同径零动作 —— 零发送 · 零 `preventDefault` · 零吞键）。
   *  失败径（`kept` / `full`）⇒ 同重绘（提示行在场 —— 项 26 零静默）。 */
  function onKeyDown(event) {
    if (isComposing(event)) return
    if (event?.key !== "Enter" || event?.shiftKey === true) return
    if (typeof event.preventDefault === "function") event.preventDefault()
    const value = event?.target?.value
    void submit(typeof value === "string" ? value : draft, toImages(attachments)).then((outcome) => {
      if (outcome === "sent") { attachments = []; unsupported = null; draft = "" }
      else if (outcome === "queued") { attachments = []; draft = "" }
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
    return mountComposer(root(), composerModel(state, { text: draft, attachments, unsupported, failed }), handlers)
  }

  /** 重绘闸（签名 = 派生读数）：池面频变但两态 / 位标 / 满队 / 降级 / 语言 / 两提示面未变 ⇒ 零重绘（不夺键入焦点）。 */
  const paintIfChanged = (state) => {
    const model = composerModel(state, { unsupported, failed })
    const next = `${model.active}|${model.busy}|${model.full}|${model.degraded ?? ""}|${model.failed ?? ""}|${model.unsupported ?? ""}|${state?.locale ?? ""}`
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
  return { paintComposer, handlers, keys: COMPOSER_KEYS, detach }
}
