/**
 * chat-copy.mjs — 对话流复制面（`docs/desktop/design/UI.md` §1「批 B 注」项 4 · `docs/desktop/design/RENDERER.md` §1.1）：
 * 逐块复制控件 `copyBlockNode(block, key, handlers)`（块尾 —— 块文本空 ⇒ 零控件）+ 末条复制控件
 * `lastCopyNode(blocks, handlers)`（输入区尾 —— 无 `assistant` 块 ⇒ 零控件）。文本面 = **纯文本取块文本逐字**
 * （对话流本就 `pre-wrap` 零 Markdown ⇒ 复制面不加解析）；出口 = **注入效应** `handlers.writeText`（单点供给 =
 * `renderer/app.mjs` —— 唯一实现处 = 宿主 `navigator.clipboard.writeText`，`app://` 注册为 secure ⇒ 安全上下文
 * 成立：`docs/desktop/design/PROJECT.md` §2 KD-2；本档零 `globalThis` 触面 ⇒ 直测面以替身入位）。成功 /
 * 失败**零布局变化**（不引提示条机制）；失败 ⇒ `console.error`（零静默 —— 面级写径无障碍 ⇒ 本档零回执面）。
 * 本档触 DOM 面 = `patchTextBlock`（就地 patch 档 —— `views/chat.mjs` 侧唯一调用点）；其余四件（`blockTextOf` /
 * `lastAssistantText` / `copyBlockNode` / `lastCopyNode`）= 纯函数 / 描述符 ⇒ 平 node 直测。
 * 两控件**不自接线**：`data-action` 恒在 = 机读锚、事件面只随 handlers 变（`views/sessions.mjs` 标签条通则
 * —— 复制为**本地效应**：零通道 / 无宿主依赖，效应本体由挂载面注入）；**没有注入 ⇒ 不落 `onClick`，落 `disabled`**
 * （通则 = `docs/desktop/design/RENDERER.md` §1.1「handler 给 ⇒ `onClick` 且不落 `disabled`；缺 ⇒ `disabled:true`」）。
 * **无 event 调用 ⇒ 静默 return（不写不报）**，供机检面裸调（`test/views-chat.test.mjs` U62 消费面）。
 * 文案一律经 `t()`（零硬编码 —— 控形零文本子，词面住 `aria-label`）；零 `node:` / 零裸包；代码零 CJK 字面
 * （同列视图档 —— 面向用户文案全住 `renderer/i18n.mjs`）。
 */
import { build, text } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 块文本（复制源单源）：`block.text` 非串 ⇒ `""`（工具卡等无文本块 ⇒ 不入复制面 —— 与「文本空 ⇒ 零控件」同判据）。 */
export function blockTextOf(block) {
  return typeof block?.text === "string" ? block.text : ""
}

/** 末条 `assistant` 块文本（末条控件取文源 = **倒序首枚** `kind === "assistant"`）；无 `assistant` 块 ∥ 该块文本空 ⇒ `null`。 */
export function lastAssistantText(blocks) {
  const list = Array.isArray(blocks) ? blocks : []
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (list[index]?.kind !== "assistant") continue
    const value = blockTextOf(list[index])
    return value === "" ? null : value
  }
  return null
}

/** 复制出口（效应**注入面** —— 写者由挂载面给）：非串 / 空串 ⇒ 假（零日志 —— 空文本非失败）；写者缺 ∥
 *  调用抛 ⇒ `console.error` + 假；写排队失败经 promise 面 `console.error`（零静默）。返回是否已发起写。 */
export function copyText(value, write) {
  if (typeof value !== "string" || value === "") return false
  if (typeof write !== "function") {
    console.error("[renderer] chat:copy: clipboard writer missing")
    return false
  }
  try {
    const written = write(value)
    if (written !== null && typeof written?.catch === "function") written.catch((error) => console.error("[renderer] chat:copy failed:", error))
    return true
  } catch (error) {
    console.error("[renderer] chat:copy failed:", error)
    return false
  }
}

/** 写者供给（两态判据单源）：`handlers.writeText` 非函数 ⇒ `undefined`（⇒ 控件落 `disabled`）。 */
function writerOf(handlers) {
  return typeof handlers?.writeText === "function" ? handlers.writeText : undefined
}

/** 点击源（逐块控件）：**现读**宿主父节点文本（帧间 patch 就地改文本 ⇒ 闭包持块会 stale —— 故读 DOM）；
 *  无宿主 / 裸调 ⇒ 空串。 */
function domTextOf(event) {
  const node = event?.currentTarget ?? event?.target
  const holder = node?.parentNode
  return typeof holder?.textContent === "string" ? holder.textContent : ""
}

/** 点击出口（零通道）：`source(event)` 现算文本 ⇒ 非串 / 空串 ⇒ 静默 return（不写不报）；否则走复制出口。
 *  event 空（机检面裸调）⇒ 静默 return —— 不落诊断、不起写。 */
function acceptCopy(event, source, write) {
  if (event === null || event === undefined) return false
  const value = source(event)
  if (typeof value !== "string" || value === "") return false
  return copyText(value, write)
}

/** 逐块复制控件（UI.md §1「批 B 注」项 4）：块文本空 ⇒ `null`（零控件 —— 禁假造）；否则 `button` 零文本子 +
 *  `aria-label` 词面 + 机读锚（`data-action` 恒在 · `data-block-id` = 块键）。 */
export function copyBlockNode(block, key, handlers = {}) {
  if (blockTextOf(block) === "") return null
  const write = writerOf(handlers)
  return {
    tag: "button",
    props: {
      class: "chat-copy-block",
      "data-action": "chat:copy-block",
      "data-block-id": key,
      "aria-label": t("chat.action.copy"),
      ...(write === undefined ? { disabled: true } : { onClick: (event) => acceptCopy(event, domTextOf, write) }),
    },
    children: [],
  }
}

/** 末条复制控件（UI.md §1「批 B 注」项 4 · 输入区尾 —— 挂载归输入区面）：无 `assistant` 块 ∥ 文本空 ⇒ `null`；
 *  `blocks` 由闭包持 ⇒ 点击时现算（帧间不 stale）。 */
export function lastCopyNode(blocks, handlers = {}) {
  if (lastAssistantText(blocks) === null) return null
  const write = writerOf(handlers)
  return {
    tag: "button",
    props: {
      class: "chat-copy-last",
      "data-action": "chat:last",
      "aria-label": t("chat.action.copyLast"),
      ...(write === undefined ? { disabled: true } : { onClick: (event) => acceptCopy(event, () => lastAssistantText(blocks), write) }),
    },
    children: [],
  }
}

/** 就地更新文本块（帧尾 `patch` 档）：文本非空 ∧ 首子为文本节点 ⇒ 就地写 `data`（**零结构写** —— 流式帧常态）+
 *  控件缺席则补；否则 `text()` 重建后按文本非空补控件（首子非文本 / 文本空 ⇒ 旧控件随之摘 ⇒「块文本空 ⟺ 零控件」
 *  恒等）。`key` = 块键（单源 = `views/chat-stream.mjs` `blockKey` —— 由调用面传来）；`handlers` 透传 ⇒
 *  补入控件的接线态与构树同源（两态通则）。 */
export function patchTextBlock(node, block, key, handlers = {}) {
  if (!node || typeof node.querySelector !== "function") return node
  const value = blockTextOf(block)
  const first = node.childNodes == null ? null : node.childNodes[0]
  if (value !== "" && typeof first?.data === "string") {
    first.data = value
    if (node.querySelector('[data-action="chat:copy-block"]') === null) {
      const control = copyBlockNode(block, key, handlers)
      if (control !== null) node.append(build(control))
    }
    return node
  }
  text(node, value)
  if (value === "") return node
  const control = copyBlockNode(block, key, handlers)
  if (control !== null) node.append(build(control))
  return node
}
