/**
 * question.js — inline question prompt (question tool) rendered INSIDE the chat
 * panel — not VS Code's native popup at the window top. Options → button list;
 * free text → input + submit. Cancel always available (answer null = cancelled).
 */
import { vscode } from "./state.js"
import { t } from "./i18n.js"
import { escHtml } from "./ui.js"

export function showQuestion(ctx, question, options, promptId) {
  const el = document.createElement("div")
  el.className = "question-card"
  el.setAttribute("role", "alert")
  el.setAttribute("aria-label", t("question.label"))
  // C1（SESSION-FLOW-C F-C1d——修 H-D）：卡片记住 promptId——answer 回传原样带 id（host 按
  // id 查队列条目——非无条件 shift——迟到/错序响应不 resolve 错队头）；questionCancelled
  // case（chat.js）按同 id 移除卡片。
  if (promptId != null) el.dataset.promptId = String(promptId)

  const textEl = document.createElement("div")
  textEl.className = "question-text"
  textEl.innerHTML = `<span class="question-mark">${escHtml(t("question.mark"))}</span> ${escHtml(question)}`
  el.appendChild(textEl)

  const answer = (value) => {
    el.remove()
    const payload = { type: "questionResponse", answer: value ?? null }
    if (promptId != null) payload.promptId = promptId
    vscode.postMessage(payload)
    ctx.inputEl.focus()
  }

  // Free-text channel — ALWAYS present (options or not). Users must be able to
  // supplement or correct the AI's preset choices with their own answer.
  const actions = document.createElement("div")
  actions.className = "question-actions"
  const addFreeInput = (placeholder) => {
    const input = document.createElement("input")
    input.className = "question-input"
    input.type = "text"
    input.placeholder = placeholder
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) answer(input.value.trim())
    })
    actions.appendChild(input)
    const submit = document.createElement("button")
    submit.className = "perm-btn approve"
    submit.textContent = t("question.submit")
    submit.addEventListener("click", () => { if (input.value.trim()) answer(input.value.trim()) })
    actions.appendChild(submit)
  }

  // Preset option buttons stack as their own column — .question-options sits
  // between the text and the .question-actions row (which keeps only
  // input + submit + cancel). 修复注: option widths used to wrap unevenly inside
  // .question-actions' flex-wrap — separating the layers makes each option a
  // full-width left-aligned row (CLI picker 形态趋同). Pure free-text questions
  // (no options) create NO container.
  if (Array.isArray(options) && options.length > 0) {
    const optionsEl = document.createElement("div")
    optionsEl.className = "question-options"
    for (const opt of options) {
      const b = document.createElement("button")
      b.className = "perm-btn approve question-option"
      // 防御：schema 声明 options 是 string[]，但 LLM 可能误传 {label,description} 对象。
      // 取 label/text/title 字段兜底，绝不显示 "[object Object]"。
      const label = typeof opt === "string" ? opt : (opt?.label ?? opt?.text ?? opt?.title ?? String(opt))
      b.textContent = label
      b.addEventListener("click", () => answer(label))
      optionsEl.appendChild(b)
    }
    el.appendChild(optionsEl)
    addFreeInput(t("question.customPlaceholder"))
  } else {
    addFreeInput(t("question.placeholder"))
  }
  el.appendChild(actions)

  const cancel = document.createElement("button")
  cancel.className = "perm-btn deny"
  cancel.textContent = t("question.cancel")
  cancel.addEventListener("click", () => answer(null))
  actions.appendChild(cancel)

  ctx.messagesEl.appendChild(el)
  el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  const input = el.querySelector(".question-input")
  if (input) setTimeout(() => input.focus(), 50)
}
