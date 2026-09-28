/**
 * question.mjs — 提问卡构件面（核化 `webview/question.js` 的构树——判定表 §3 行 29「拆」；
 * §4 行 19 机制「提问卡」）。出站（`questionResponse`）经 `deps.emit(type, payload)` 注入；
 * 「作答后回焦输入框」（端 `ctx.inputEl.focus()`）经 `deps.onAnswered()` 注入。
 * 留端：append 到 `#messages` / `scrollIntoView` / 输入框初始聚焦。
 */
import { esc as escHtml } from "../md.mjs"
import { t as coreT } from "../i18n.mjs"

/** 提问卡（承 `question.js:10-89` 构树）。`model` = `{ question, options?, promptId? }`；
 *  返回卡元素。作答（选项 / 自由文本 / 取消）⇒ 卡自移除 + `emit("questionResponse", { answer, promptId? })`
 *  （取消 ⇒ `answer: null`）+ `deps.onAnswered(value)`。 */
export function renderQuestionCard(model = {}, deps = {}) {
  const t = deps.t ?? coreT
  const el = document.createElement("div")
  el.className = "question-card"
  el.setAttribute("role", "alert")
  el.setAttribute("aria-label", t("question.label"))
  // C1（SESSION-FLOW-C F-C1d——修 H-D）：卡片记住 promptId——answer 回传原样带 id（host 按
  // id 查队列条目——非无条件 shift——迟到/错序响应不 resolve 错队头）；questionCancelled
  // case（chat.js）按同 id 移除卡片。
  if (model.promptId != null) el.dataset.promptId = String(model.promptId)

  const textEl = document.createElement("div")
  textEl.className = "question-text"
  textEl.innerHTML = `<span class="question-mark">${escHtml(t("question.mark"))}</span> ${escHtml(model.question)}`
  el.appendChild(textEl)

  const answer = (value) => {
    el.remove()
    const payload = { answer: value ?? null }
    if (model.promptId != null) payload.promptId = model.promptId
    deps.emit?.("questionResponse", payload)
    deps.onAnswered?.(value)
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
      // IME 组字门（R1 小修——父侧裁 2026-09-28）：组合期回车 = 选字确认（归输入法）⇒ 零提交零防默认
      // （判据同族 = composer/panel.mjs:179 两臂：`isComposing` ∕ `keyCode 229` 兜底）。
      if (e.isComposing || e.keyCode === 229) return
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
  if (Array.isArray(model.options) && model.options.length > 0) {
    const optionsEl = document.createElement("div")
    optionsEl.className = "question-options"
    for (const opt of model.options) {
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

  return el
}
