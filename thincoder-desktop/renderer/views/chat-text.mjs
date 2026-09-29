/**
 * chat-text.mjs — 对话流**文本面**（R3c · D19 · `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 1·3·4；
 * `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 3 · §1「本批注（对齐第二批 · 六件）」项 1 / 4）：
 *   ① `textFace(block, className)` —— 文本块面（`div.block-text[data-raw]`；`html` = 核 `md` 产出 —— 全量转义闸在核）；
 *   ② `reasoningNode(block, key, handlers, withLabel)` —— 推理块（核件结构同形 = 核 `flow/reasoning.mjs` `renderReasoning`：
 *      `details.reasoning-block[open] > summary + div.reasoning-content`；类名契约 = KD-RC-7，桌面映射样式住
 *      `renderer/core.css`）；
 *   ③ `patchTextBlock(node, block, key, handlers)` —— 帧尾就地更新（面值变才写；**推理分流** = 重渲走核专用
 *      画笔 `paintReasoningTarget`〔含钉底〕——「对齐第二批」项 1）；
 *   ④ `labelNode(role)` / `paintSpeakerLabels(root)` —— 说话人标签容器与帧尾落笔（项 4：用户块 = 核 `paintLabel`
 *      原语；助手回合首块 = 端侧同字面〔核无原语 —— 端差登记〕）；
 *   ⑤ `pinReasoning(node)` —— 推理块新建即落底（首帧钉底；增量钉底归核画笔）。
 * `data-raw` = **原文逐字**（**就地更新判据面** —— KD-22「块文本逐字（不经渲染面解析）」：渲染面 markdown 后 DOM
 * 文本已非原文 ⇒ 原文另存锚上；`patchTextBlock` 值变比较消费 —— 复制面 = 核件代码块 Copy 钮唯一）。
 * 边界（KD-RC 各端在册机制不夺）：滚动 / 回填 / 窗口裁剪留端；**文件链接着装不在本档**（相抵② 承面 = 结果区
 * `views/chat-tool.mjs` `linkifyResult` —— 核件 `linkifyPaths` 消费单点，历史卡零链接）。零 `node:` / 零裸包；
 * 文案一律经 `t()`（零硬编码 —— 本档词面 = 核键
 * `status.thinking` + 说话人三键，词形单源 = 核 i18n / 宿主表）。
 */
import { text } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { md, mdInline } from "/rc/md.mjs"
import { paintLabel } from "/rc/flow/queued-mark.mjs"
import { paintReasoningTarget, paintStreamTarget } from "/rc/flow/stream.mjs"

/** 块文本（`data-raw` 值源单源；复制面对齐批迁入 —— 自建复制面档整删，本函数随文本面留存）：`block.text` 非串
 *  ⇒ `""`（工具卡等无文本块 —— 空串照落锚，判据归就地更新面）。 */
export function blockTextOf(block) {
  return typeof block?.text === "string" ? block.text : ""
}

/** 文本块面（核 Markdown 单源 · **深度分流** = D19）：`data-raw` = 原文逐字（空串 ⇒ 照落）；
 *  深度按 `block.kind` 分流（口径标尺 = 核件 `thincoder-render-core/flow/block.mjs`：user 气泡 = `mdInline` ∥ 助手内容面 = `md`）：
 *  `user` ⇒ `mdInline`（行内深度 —— 块级构件零节点）；`assistant` / `reasoning` / `error` ⇒ 全量 `md`（零回归）；
 *  `html` = 核产出 —— **渲染面唯一 `innerHTML` 字面** = `renderer/dom.mjs` `el()` 的 `html` prop
 *  （帧尾重渲径经核 `paintStreamTarget` —— 核内同闸同写；两径值皆过全量转义闸）。 */
export function textFace(block, className = "block-text") {
  const raw = blockTextOf(block)
  const html = block?.kind === "user" ? mdInline(raw) : md(raw)
  return { tag: "div", props: { class: className, "data-raw": raw, html }, children: [] }
}

/** 推理块（核件结构同形 —— 核 `flow/reasoning.mjs` `renderReasoning`）：块壳 = 桌面五型锚（`data-block-id` /
 *  `data-block-kind` —— 窗限 / 对齐 / 游标三机制零改），内容 = 核类名面（`details.reasoning-block[open]` +
 *  `summary` + `.reasoning-content`）；默认展开（核件同形）；内容经核 `md`（转义闸同文本面）。
 *  `withLabel` 真 ⇒ 首子挂说话人标签容器（回合首块判据归 `renderer/views/chat.mjs` —— 本档只落形）。 */
export function reasoningNode(block, key, handlers = {}, withLabel = false) {
  return {
    tag: "div",
    props: { class: "block block-reasoning", "data-block-id": key, "data-block-kind": "reasoning" },
    children: [
      ...(withLabel ? [labelNode("assistant")] : []),
      {
        tag: "details",
        props: { class: "reasoning-block", open: true },
        children: [
          { tag: "summary", props: { class: "reasoning-summary" }, children: [t("status.thinking")] },
          textFace(block, "reasoning-content"),
        ],
      },
    ],
  }
}

/** 说话人标签容器（空容器 —— 文本落笔归帧尾后处理：用户 = 核 `paintLabel`〔含 `❯` / `:` / 时间 span〕；
 *  助手 = `t("msg.assistant")` 同字面 —— `❯` 与 `:` 住 `renderer/chat.css` `content`（视图档零字形字面）。
 *  `data-label` = 两值机读锚（`user` / `assistant` —— 样式面分色与字形判据）。 */
export function labelNode(role) {
  return { tag: "div", props: { class: "msg-label", "data-label": role }, children: [] }
}

/** 就地更新文本块（帧尾 `patch` 档 —— `renderer/views/chat.mjs` `patchTail` 调用；RENDERER.md §3 帧尾滚动作
 *  零改）：文本面（`[data-raw]`）**值变才写**（`data-raw` + md 重渲同刷 —— 幂等帧零写）；**推理块分流** =
 *  重渲走核专用画笔 `paintReasoningTarget`（核 `flow/stream.mjs` —— 通用画笔 + `scrollTop = scrollHeight` 钉底；
 *  「对齐第二批」项 1 改接），其余走 `paintStreamTarget`（无钉底 —— 对拍有牙）；`key` = 块键
 *  （`renderer/views/chat-stream.mjs` `blockKey` 同域）—— 复制面对齐批后本档不再建控件（签名沿帧尾调用形保留；
 *  `key` ∕ `handlers` 本档无内部消费）。 */
export function patchTextBlock(node, block, key, handlers = {}) {
  if (!node || typeof node.querySelector !== "function") return node
  const face = node.querySelector("[data-raw]")
  if (face !== null) {
    const raw = blockTextOf(block)
    if (face.getAttribute("data-raw") !== raw) {
      face.setAttribute("data-raw", raw)
      if (block?.kind === "reasoning") paintReasoningTarget(face, raw)
      else paintStreamTarget(face, raw)
    }
  }
  return node
}

/** 推理块新建即落底（帧尾尾段挂载后补一次 —— 与 VSC 首帧同形）：内容区 `scrollTop = scrollHeight`
 *  （无条件钉底；后续增量钉底归核画笔 `paintReasoningTarget`）。 */
export function pinReasoning(node) {
  const face = typeof node?.querySelector === "function" ? node.querySelector(".reasoning-content") : null
  if (face) face.scrollTop = face.scrollHeight
}

/** 全根推理块首帧钉底（**重挂径逐块同径** —— 切会话 / 词表置位 / 零重合回落三径新建的推理块同「新建即落底」；
 *  尾段挂载 / 重建 / 前插三径归 `renderer/views/chat.mjs` `dressNode` 逐块钉底）。 */
export function pinReasoningBlocks(root) {
  if (!root || typeof root.querySelectorAll !== "function") return
  for (const node of root.querySelectorAll('[data-block-kind="reasoning"]')) pinReasoning(node)
}

/** 说话人标签落笔（帧尾后处理 · 幂等）：**用户块** = 核原语 `paintLabel`（读块面 `data-ts` —— 「无 ts 不显示」同判据）；
 *  **助手回合首块** = 端侧同字面 `t("msg.assistant")`（核无原语 —— 端差登记）；无标签容器（非回合首块）⇒ 零动作。
 *  逐块 `_labelPainted` 记账（幂等帧零写 —— 核 `paintLabel` 每次全量重写 innerHTML）。
 *  入参可为全根或单块节点（子树查询同径 —— 帧尾尾段挂载与全量挂载两径共用）。 */
export function paintSpeakerLabels(root) {
  if (!root || typeof root.querySelectorAll !== "function") return
  const nodes = [...root.querySelectorAll("[data-block-kind]")]
  if (typeof root.getAttribute === "function" && root.getAttribute("data-block-kind") !== null) nodes.unshift(root)
  for (const node of nodes) {
    if (node._labelPainted === true) continue
    if (node.getAttribute("data-block-kind") === "user") {
      paintLabel(node)
      node._labelPainted = true
      continue
    }
    const label = node.querySelector(".msg-label")
    if (label === null || label === undefined) continue
    text(label, t("msg.assistant"))
    node._labelPainted = true
  }
}
