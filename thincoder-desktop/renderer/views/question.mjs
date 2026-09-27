/**
 * question.mjs — 提问卡面（`docs/desktop/design/UI.md` §1 提问呈现行 · 批 A · 形态单源 = 该行「落形」条）：
 * 纯描述符 + 薄挂载（挂载面 = `thincoder-desktop/renderer/mount-cards.mjs`）。**本档零 `store.mjs` import**
 * （KD-14 —— 「出口失败 ⇒ 零切片写」是**结构性保证**：本档无切片可写，非运行期判）。
 *   ① 卡根 = `data-card="question"` + `data-prompt-id`（待决项身份 / 路由键 —— 与 `ev:question` 同源同值）；
 *      驻点 = 对话流根（**非块节点** —— 块序列 / 药丸序不变式不受影响）；子序 = 题干行 → [给答项操作区?] → 作答区；
 *   ② 题干行 = 提问串原样（零构造）；给答项（`options` 非空）逐项 = `data-action="question:<i>"`（i = 1 起）
 *      + 词 = 选项串原样（零构造）；`options` 空 ∥ 缺 ⇒ 零操作区节点（自由作答路恒在）；
 *   ③ 作答区（恒在场）= 文本控件（`data-input="answer"` —— 锚惯例沿输入区）+ 提交键
 *      `data-action="question:answer"` + 取消键 `data-action="question:cancel"`；
 *   ④ 三出口值映射（**单一 owner**）：给答项 ⇒ 选项串原样 ∥ 提交 ⇒ 输入串 ∥ 取消 ⇒ `null`（挂起表按取消串
 *      `(user cancelled)` 结算，串单源 = `thincoder-desktop/src/main/suspensions.mjs`）；接线两态沿通则
 *      （handler 缺 ⇒ `disabled: true`，锚恒在 —— 诚实非死控）；
 *   ⑤ 出口动作 `respondQuestion(host, promptId, answer)`：窄桥 `question:respond`；invoke 抛 / 拒绝 ⇒
 *      `console.error`（**不静默**）+ 回执 `null`（调用面零分支；**卡退场判据 = 回执 `ok` 真**，非乐观 ——
 *      归 `thincoder-desktop/renderer/mount-cards.mjs`）。
 * 文案一律经 `t()`（零硬编码）；零字形字面；零 `node:` / 零裸包。
 * 词键（本档自拟三键 · 登记面 = `thincoder-desktop/renderer/i18n.mjs`）：`question.input`（文本控件 aria-label）·
 *  `question.answer`（提交键）· `question.cancel`（取消键）。
 */
import { t } from "../i18n.mjs"
import { wire, withKey } from "./chat-tool.mjs"

const hasText = (value) => typeof value === "string" && value.length > 0

/** 给答项清单：非数组 ⇒ 零项；逐项滤除非串 / 空串（零假造 —— 沿 `chat-tool.mjs` 批形工具清单判）。 */
function optionList(item) {
  const options = item?.options
  return Array.isArray(options) ? options.filter(hasText) : []
}

/** 题干行：提问串原样（零构造 —— 缺 ⇒ 空行，不假造）。 */
function headNode(item) {
  return { tag: "div", props: { class: "question-head", "data-question-head": "" }, children: [item?.question] }
}

/** 给答项操作区（`options` 非空时在场）：逐项 = `data-action="question:<i>"`（i = 1 起）+ 词 = 选项串原样；
 *  handler 缺 ⇒ 逐项 `disabled: true`（锚恒在）。零项 ⇒ `null`（零节点 —— 自由作答路不受影响）。 */
function optionsNode(item, promptId, handlers) {
  const options = optionList(item)
  if (options.length === 0) return null
  const onAnswer = typeof handlers?.onAnswer === "function" ? (answer) => handlers.onAnswer(promptId, answer) : undefined
  return {
    tag: "div",
    props: { class: "question-options", "data-question-options": "" },
    children: options.map((option, step) => ({
      tag: "button",
      props: wire({ class: "question-option", "data-action": `question:${step + 1}` }, withKey(onAnswer, option)),
      children: [option],
    })),
  }
}

/** 作答区（恒在场 · 与给答项并立）：文本控件（草稿住 DOM —— 帧内等值 ⇒ 零重写，归挂载面）+ 提交键
 *  （事件转发 —— **词面读数 = 接线面**，视图档零 DOM）+ 取消键（值 `null`）。 */
function answerNode(promptId, handlers) {
  const onAnswer = typeof handlers?.onAnswer === "function" ? (answer) => handlers.onAnswer(promptId, answer) : undefined
  const onDraft = typeof handlers?.onAnswerDraft === "function" ? (event) => handlers.onAnswerDraft(promptId, event) : undefined
  return {
    tag: "div",
    props: { class: "question-answer", "data-question-answer": "" },
    children: [
      {
        tag: "textarea",
        props: {
          class: "question-input",
          "data-input": "answer",
          rows: "1",
          "aria-label": t("question.input"),
          disabled: onDraft === undefined ? true : undefined,
        },
        children: [],
      },
      { tag: "button", props: wire({ class: "question-submit", "data-action": "question:answer" }, onDraft), children: [t("question.answer")] },
      { tag: "button", props: wire({ class: "question-cancel", "data-action": "question:cancel" }, withKey(onAnswer, null)), children: [t("question.cancel")] },
    ],
  }
}

/** 提问卡（纯构树 · 零 DOM）：子序 = 题干行 → [给答项操作区?] → 作答区；在场 / 退场归挂载面（回执判据）。 */
export function questionTree(item, handlers = {}) {
  const promptId = item?.promptId
  return {
    tag: "div",
    props: {
      class: "question-card",
      "data-card": "question",
      "data-prompt-id": promptId == null ? undefined : String(promptId),
    },
    children: [headNode(item), optionsNode(item, promptId, handlers), answerNode(promptId, handlers)],
  }
}

/** 出口动作（作答 / 取消同一路）：窄桥 `question:respond`；抛 / 拒绝 ⇒ `console.error`（不静默）+ 回执 `null`
 *  （零切片写 = 结构性 —— 本档无 `store.mjs` import）。 */
export function respondQuestion(host, promptId, answer) {
  try {
    return Promise.resolve(host.invoke("question:respond", { promptId, answer })).catch((error) => {
      console.error("[renderer] question:respond failed:", error)
      return null
    })
  } catch (error) {
    console.error("[renderer] question:respond failed:", error)
    return null
  }
}
