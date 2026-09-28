/**
 * chat-guide.mjs — 首启空白态引导面（**非块节点** · `docs/desktop/design/UI.md` §1「批 B 追加注」项 1 / 2 ·
 * `docs/desktop/design/RENDERER.md` §1.1「引导节点」）：判据四值纯函数 `guideOf` + 构树 `guideNode` + 帧尾态刷
 * `syncGuide`。落点 = 对话流挂载根 `[data-slot="flow"]` 自身：`none` 帧 = 根唯一子 · `empty` 帧 = 首子 ·
 * `flow` 帧 = 不在场；零 `data-block-id` ⇒ 不入块序（块序插入点判据与 `data-blocks` 不变式不受其影响）。
 * 沿 `renderer/views/chat-copy.mjs` 先例（流内非块节点构树 · 零 `store.mjs` import）：本档触 DOM 面 = `syncGuide`
 * （帧尾只摘 / 原位换 —— `views/chat.mjs` 侧唯一调用点）；其余两件 = 纯函数 / 描述符 ⇒ 平 node 直测。
 * 动作控件在场 ⟺ **句柄在场**（`onOpenDir` / `onNewSession` 缺 ⇒ 整控件缺席 —— 零假按钮，比接线两态通则更严）；
 * 出口 = 左列同两枚（`project:open` / `session:create` 各单一实现 —— 本档零第二路）。控件类沿流内小控件同款
 * （追加注裁定「引导面不另立样式档」⇒ 零新 CSS，视觉沿用现盘 `.chat-empty`）。
 * 文案一律经 `t()`（零硬编码 · 代码零 CJK 字面）；零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { build } from "../dom.mjs"
import { t } from "../i18n.mjs"

/** 判据（四值纯函数 · 单源 = 模型 `guide` 字段 —— `chatModel` 转调本函数）：无活动会话 ⇒ `cwd` 在场（串 ∧ 非空）
 *  ? `no-session` : `no-project`（「缺」= 缺／空串／非串）；有活动会话 ∧ 可见块 0 ⇒ `no-message`；余 ⇒ `null`。 */
export function guideOf({ live, cwd, visible }) {
  if (live) return visible > 0 ? null : "no-message"
  return typeof cwd === "string" && cwd !== "" ? "no-session" : "no-project"
}

/** 三码词键（闭集 · `no-message` = 欢迎条三行构树 —— 项 15）· 两码动作控件（句柄名 / 动作锚 / 词键 = 左列既有键）。 */
const WORDS = { "no-project": "chat.guide.noProject", "no-session": "chat.guide.noSession" }
/** 欢迎条四键（两语各四 —— 词面住 `renderer/i18n.mjs`；文案二值取定归 `welcomeNode`）。 */
const WELCOME = { heading: "welcome.heading", text: "welcome.text", textConfigured: "welcome.textConfigured", shortcuts: "welcome.shortcuts" }
const ACTIONS = {
  "no-project": { handle: "onOpenDir", action: "project:open", word: "rail.action.openDir" },
  "no-session": { handle: "onNewSession", action: "session:create", word: "rail.action.newSession" },
}

/** 引导节点（纯构树 · 表外码 ⇒ `null` —— 禁假造）：`div.chat-empty[data-guide]`，子序 = 文案 → [控件?]；
 *  控件 = `button[data-action]`（词面住文本子）；句柄缺 ⇒ 退纯文案（零假按钮）。
 *  `no-message` 帧（「对齐第三批」项 15）= **欢迎条三行**（抬头 / 文案二值 / 快捷键行 —— 对位 VSC `.welcome` 三行）；
 *  端差登记：VSC 快捷键行含 `@` 文件引用段（桌面 @-补全 = 缺整面族 ⇒ 该段随缺面族批补 —— 词条 `welcome.shortcuts`）。 */
export function guideNode(model, handlers = {}) {
  const code = model?.guide
  if (code === "no-message") return welcomeNode(model)
  if (typeof code !== "string" || !Object.hasOwn(WORDS, code)) return null
  const children = [t(WORDS[code])]
  const slot = ACTIONS[code]
  const onClick = slot ? handlers?.[slot.handle] : undefined
  if (typeof onClick === "function") {
    children.push({ tag: "button", props: { class: "chat-backfill", "data-action": slot.action, onClick }, children: [t(slot.word)] })
  }
  return { tag: "div", props: { class: "chat-empty", "data-guide": code }, children }
}

/** 欢迎条三行（项 15 —— 抬头 / 文案 / 快捷键行；**文案二值** = `configured` 真 ⇒ `welcome.textConfigured`
 *  ∥ 余（未配 / 未知）⇒ `welcome.text` —— 值逐字同 VSC）；非块节点容器（`data-guide="no-message"` 留根 ——
 *  `syncGuide` 换代判据同域），行子序 = [抬头, 文案, 快捷键]。 */
function welcomeNode(model) {
  const textKey = model?.configured === true ? WELCOME.textConfigured : WELCOME.text
  return {
    tag: "div",
    props: { class: "chat-empty", "data-guide": "no-message" },
    children: [{
      tag: "div",
      props: { class: "chat-welcome", "data-welcome": "" },
      children: [
        { tag: "h2", props: { class: "welcome-heading" }, children: [t(WELCOME.heading)] },
        { tag: "p", props: { class: "welcome-text" }, children: [t(textKey)] },
        { tag: "p", props: { class: "welcome-shortcuts" }, children: [t(WELCOME.shortcuts)] },
      ],
    }],
  }
}

/** 帧尾态刷（`syncChrome` 内唯一调用点 · 幂等 · **只摘不插** —— `none` / `empty` 帧由重挂面建、`flow` 帧由本面摘：
 *  `docs/desktop/design/RENDERER.md` §1.1「帧尾态刷」）：缺席 ⇒ 零动作（不插第二个）；码同 ⇒ 零 DOM 写；
 *  码异 ⇒ 原位换；判据空 ⇒ 摘。 */
export function syncGuide(root, model, handlers = {}) {
  const node = typeof root?.querySelector === "function" ? root.querySelector("[data-guide]") : null
  if (!node) return
  const next = guideNode(model, handlers)
  if (next === null) return void node.remove()
  if (node.getAttribute("data-guide") === next.props["data-guide"]) return
  node.replaceWith(build(next))
}
