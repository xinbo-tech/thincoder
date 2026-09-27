/**
 * chat-text.mjs — 对话流**文本面**（R3c · D19 · `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 1·3·4；
 * `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 3）：
 *   ① `textFace(block, className)` —— 文本块面（`div.block-text[data-raw]`；`html` = 核 `md` 产出 —— 全量转义闸在核）；
 *   ② `reasoningNode(block, key, handlers)` —— 推理块（核件结构同形 = 核 `flow/reasoning.mjs` `renderReasoning`：
 *      `details.reasoning-block[open] > summary + div.reasoning-content`；类名契约 = KD-RC-7，桌面映射样式住
 *      `renderer/core.css`）；
 *   ③ `patchTextBlock(node, block, key, handlers)` —— 帧尾就地更新（面值变才写 + 复制控件缺席则补）。
 * `data-raw` = **原文逐字**（复制取文源 —— KD-22「块文本逐字（不经渲染面解析）」：渲染面 markdown 后 DOM 文本已非
 * 原文 ⇒ 原文另存锚上；两复制控件同读 = `renderer/views/chat-copy.mjs`）。
 * 边界（KD-RC 各端在册机制不夺）：滚动 / 回填 / 窗口裁剪留端；**文件链接不承载**（KD-RC-5 —— 核 `linkifyPaths`
 * 桌面不消费：落链接即假控件）。零 `node:` / 零裸包；文案一律经 `t()`（零硬编码 —— 本档唯一词面 = 核键
 * `status.thinking`，词形单源 = 核 i18n，本端不另立同义键）。
 */
import { build } from "../dom.mjs"
import { t } from "../i18n.mjs"
import { md } from "/rc/md.mjs"
import { paintStreamTarget } from "/rc/flow/stream.mjs"
import { blockTextOf, copyBlockNode } from "./chat-copy.mjs"

/** 文本块面（核 Markdown 单源）：`data-raw` = 原文逐字（复制取文源 · 空串 ⇒ 照落，判据归复制控件面）；
 *  `html` = 核 `md` 产出 —— **渲染面唯一 `innerHTML` 字面** = `renderer/dom.mjs` `el()` 的 `html` prop
 *  （帧尾重渲径经核 `paintStreamTarget` —— 核内同闸同写；两径值皆过全量转义闸）。 */
export function textFace(block, className = "block-text") {
  const raw = blockTextOf(block)
  return { tag: "div", props: { class: className, "data-raw": raw, html: md(raw) }, children: [] }
}

/** 推理块（核件结构同形 —— 核 `flow/reasoning.mjs` `renderReasoning`）：块壳 = 桌面五型锚（`data-block-id` /
 *  `data-block-kind` —— 窗限 / 对齐 / 游标三机制零改），内容 = 核类名面（`details.reasoning-block[open]` +
 *  `summary` + `.reasoning-content`）；默认展开（核件同形）；内容经核 `md`（转义闸同文本面）。 */
export function reasoningNode(block, key, handlers = {}) {
  return {
    tag: "div",
    props: { class: "block block-reasoning", "data-block-id": key, "data-block-kind": "reasoning" },
    children: [
      {
        tag: "details",
        props: { class: "reasoning-block", open: true },
        children: [
          { tag: "summary", props: { class: "reasoning-summary" }, children: [t("status.thinking")] },
          textFace(block, "reasoning-content"),
        ],
      },
      copyBlockNode(block, key, handlers),
    ],
  }
}

/** 就地更新文本块（帧尾 `patch` 档 —— `renderer/views/chat.mjs` `patchTail` 调用；RENDERER.md §3 帧尾滚动作
 *  零改）：文本面（`[data-raw]`）**值变才写**（`data-raw` + md 重渲同刷 —— 幂等帧零写）；重渲经核缝合件
 *  `paintStreamTarget`（核 `flow/stream.mjs` —— md 全量重渲 + 失败回退原文）。复制控件缺席则补（文本空 ⇒
 *  零控件 —— 构树同判据）；`key` = 块键（`renderer/views/chat-stream.mjs` `blockKey` 同域）；`handlers` 透传
 *  ⇒ 补入控件的接线态与构树同源（两态通则）。 */
export function patchTextBlock(node, block, key, handlers = {}) {
  if (!node || typeof node.querySelector !== "function") return node
  const face = node.querySelector("[data-raw]")
  if (face !== null) {
    const raw = blockTextOf(block)
    if (face.getAttribute("data-raw") !== raw) {
      face.setAttribute("data-raw", raw)
      paintStreamTarget(face, raw)
    }
  }
  if (node.querySelector('[data-action="chat:copy-block"]') === null) {
    const control = copyBlockNode(block, key, handlers)
    if (control !== null) node.append(build(control))
  }
  return node
}
