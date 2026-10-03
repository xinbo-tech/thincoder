/**
 * reasoning.mjs — 推理块构件面（核化 `webview/streaming.js` `onReasoning` 的 DOM 面——
 * 判定表 §3 行 47「拆」；`ctx` 指针 / 子回合边界判据 / rAF 调度留端 = `flow/stream.mjs`）。
 */
import { md } from "../md.mjs"
import { t as coreT } from "../i18n.mjs"

/** 推理块（`details.reasoning-block` + summary + `.reasoning-content`；**默认折叠**——#875（2026-10-04）：
 *  `details.open = false`——手动展开可看全；恢复径 `flow/block.mjs` `buildAssistantRestore` 同拍）。
 *  `model.text` 在场 ⇒ 经核 md 渲染进内容区；缺省 = 空块（live 流式面——
 *  内容由 `flow/stream.mjs` 的重渲器逐帧写入）。返回 `{ el, content }`。 */
export function renderReasoning(model = {}, deps = {}) {
  const t = deps.t ?? coreT
  const details = document.createElement("details")
  details.className = "reasoning-block"
  details.open = false
  const summary = document.createElement("summary")
  summary.textContent = t("status.thinking") + "..."
  details.appendChild(summary)
  const content = document.createElement("div")
  content.className = "reasoning-content"
  if (typeof model.text === "string" && model.text) content.innerHTML = md(model.text)
  details.appendChild(content)
  return { el: details, content }
}
