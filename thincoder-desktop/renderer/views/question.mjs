/**
 * question.mjs — 提问卡面（`docs/desktop/design/UI.md` §1 提问呈现行）：**核件直消费 + 端壳**
 * （「桌面处理流 · VSC 对齐」批 R1 #2 · KD-F1）——卡面构树单源 = 核包 `cards/question.mjs`
 * （`renderQuestionCard` —— VSC ∕ 桌面同一文件），本档只留端胶水：
 *   ① 卡根 `data-card="question"` 锚装饰（核卡自带 `data-prompt-id` / 类 `question-card`；端补端挂载 ∕ 同步面不变式锚）；
 *   ② 出站桥（端壳适配 g）：核 `deps.emit("questionResponse", { answer, promptId? })` ⇒ 端出口 `handlers.onAnswer`
 *      （⇒ `renderer/mount-cards.mjs` `submitAnswer` —— `question:respond` 回执径保留：**卡退场非乐观**，回执 `ok` 真
 *      才清切片；核卡点按即摘 + 失败径挂载面重挂 ⇒ 卡复现可重试）；
 *   ③ 作答后回焦输入区（P3② 归核面注入点 `deps.onAnswered` —— 核卡作答 ∕ 取消同一路回调；落点 = `handlers.onAnswered`）。
 *   **P2（Enter 提交）随核卡内建**（`cards/question.mjs:46-51` —— 组字门 = 核件小修，组合期回车归输入法）；
 *   **P3①（新卡聚焦）** = 端壳挂载面插入时聚焦核卡作答控件（`renderer/mount-cards.mjs`）。
 * 出口动作 `respondQuestion(host, promptId, answer)`：窄桥 `question:respond`；invoke 抛 / 拒绝 ⇒ `console.error`
 * （**不静默**）+ 回执 `null`（调用面零分支）。
 * **本档零 `store.mjs` import**（KD-14 —— 「出口失败 ⇒ 零切片写」是结构性保证）；零 `node:` / 零裸包；
 * 文案一律经核 i18n（核卡内取词 —— 值 = VSC locales 逐字）。
 */
import { renderQuestionCard } from "/rc/cards/question.mjs"

/** 提问卡（核卡工厂直取 + 端锚）：返回卡元素（`handlers.onAnswer(promptId, answer)` ∕ `handlers.onAnswered()`）。 */
export function questionCardNode(item, handlers = {}) {
  const onAnswer = typeof handlers?.onAnswer === "function" ? handlers.onAnswer : undefined
  const el = renderQuestionCard(
    {
      question: typeof item?.question === "string" ? item.question : "",
      options: item?.options,
      promptId: item?.promptId,
    },
    {
      // 核 `deps.emit` ⇒ 端出口（表外 type ⇒ 零动作 + 记错 —— 不静默吞）
      emit: (type, payload) => {
        if (type !== "questionResponse") {
          console.error(`[renderer] question card emitted unbound exit: ${String(type)}`)
          return
        }
        if (onAnswer === undefined) return
        onAnswer(payload?.promptId ?? item?.promptId ?? null, payload?.answer ?? null)
      },
      // P3② 作答后回焦输入区（核卡两出口同一路回调 —— 值面直通，端不出词）
      onAnswered: () => handlers?.onAnswered?.(),
    },
  )
  el.setAttribute("data-card", "question")
  return el
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
