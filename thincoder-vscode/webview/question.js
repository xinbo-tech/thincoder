/**
 * question.js — 提问卡端壳（端协议壳）：卡面构树单源 = 核包 `cards/question.mjs`（R2 换接
 * ——§3 行 29；选项按钮列 / 自由文本输入 + 提交 / 取消三路）；本档留端 = 出站绑
 * `vscode.postMessage` + 作答后回焦输入框 + append 到 `#messages` + `scrollIntoView` +
 * 输入框初始聚焦。
 */
import { vscode } from "./state.js"
import { renderQuestionCard } from "../node_modules/@thincoder/render-core/cards/question.mjs"

/** 提问卡（inline question —— 非 VS Code 原生弹窗）：作答 ⇒ 卡自移除 + `questionResponse`
 *  （取消 ⇒ `answer: null`）+ 回焦输入框。 */
export function showQuestion(ctx, question, options, promptId) {
  const el = renderQuestionCard({ question, options, promptId }, {
    // 核 `deps.emit` ⇒ 端协议：局部对象绑定（发面机检 §13 形态③——判别式字面量须在发射位可提取）
    emit: (type, payload) => {
      const msg = { type: "questionResponse", ...payload }
      vscode.postMessage(msg)
    },
    onAnswered: () => ctx.inputEl.focus(),
  })
  ctx.messagesEl.appendChild(el)
  el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  const input = el.querySelector(".question-input")
  if (input) setTimeout(() => input.focus(), 50)
}
