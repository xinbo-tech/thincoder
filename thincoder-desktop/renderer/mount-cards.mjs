/**
 * mount-cards.mjs — 卡族挂载与出站（批 A · 形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行 ∥ 计划面行；
 * 插入点纪律单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）：
 *   ① 挂载面 = 对话流根 `[data-slot="flow"]` 内**提问 / 计划两族**（审批族归 `renderer/views/chat.mjs`
 *      —— 本档零重叠：不读不写 `[data-card="approval"]`）；
 *   ② 插点 = 首个**更高序**卡之前（卡序 = 待审批 → 提问 → 计划 —— 缺者跳过）；无 ⇒ `[data-pill]` 之前；
 *      两锚皆缺 ⇒ 末位；多 ⇒ 摘（族内单槽 —— 切片按会话键一槽，本不该多）；
 *   ③ 刷新幂等：`prompt-id` ∧ 逐行状态码序 ∧ 文本 —— 三面全等 ⇒ **零 DOM 写**（在形文本控件的草稿 / 焦点保全）；
 *      出口锚集 = 三面的单值函数（等值 ⇒ 同锚）⇒ 不另比；
 *   ④ 出站 `submitAnswer`：窄桥 `question:respond`（作答 / 取消两向 —— 取消 `answer: null`）；**零乐观摘除** ——
 *      回执 `ok` 真 ⇒ 纯动作 `clearQuestion`（`questions` 切片 + `approval` 位标同清，单源 =
 *      `renderer/events.mjs`）；失败 / 拒绝 / 抛 ⇒ 卡留可重试 + `console.error`（抛 / 拒 ⇒ `respondQuestion`
 *      自记错；**回执拒收**〔`ok` 假〕⇒ 本档记 `receipt.reason` —— 两半合「失败」全形，各自单记零双记）；
 *   ⑤ 会话键 = **入口现刻读**（本卡所属会话 —— 回执在途可能已切会话，按现刻 `activeSession` 摘会误摘别会话
 *      待答项）；摘项前验 `promptId` 仍是本项（已被事件面摘 ∥ 已被新项替换 ⇒ 零写，仅回执判定）；
 *   ⑥ 词面读数 = 接线面（视图档零 DOM —— `docs/desktop/design/RENDERER.md` §1.1 判据面条）：本卡
 *      `[data-input="answer"]` 取值；控件缺位 ⇒ 零动作 + 记错（**不得**当取消 —— 取消是显式出口）；空白串 ⇒
 *      零动作零 IPC（沿输入区空白闸；值原样送出 —— 零改写）。
 * 纪律：零 `node:` / 零裸包；本档零面向用户文案（词面归视图档）。
 */
import { build } from "./dom.mjs"
import { clearQuestion } from "./events.mjs"
import { store as defaultStore } from "./store.mjs"
import { planTree } from "./views/plan.mjs"
import { questionTree, respondQuestion } from "./views/question.mjs"

/** 卡族挂载根（与块序列同宿对话流根 —— 骨架属性住 `renderer/index.html`）。 */
export const CARDS_SLOT = '[data-slot="flow"]'

/** 重挂触发切片：活动会话（两族皆按会话键取槽）· 提问切片 · 计划切片 · 语言（词面）。 */
export const CARDS_KEYS = Object.freeze(["activeSession", "questions", "tasks", "locale"])

/** 卡序闭枚举（**单源** = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）：待审批 → 提问 → 计划；
 *  数组序 = DOM 序 —— 插点判据「首个更高序卡」由本表切片导出（审批族不归本档，仅参与序判）。 */
export const CARD_ORDER = Object.freeze(["approval", "question", "task"])

/** 本档两族 = 卡序尾二（审批族归 `renderer/views/chat.mjs`）。 */
const OWN_CODES = CARD_ORDER.slice(1)

// ─── 出站（作答 / 取消同一路）────────────────────────────────────────────

/** 提问出口核心（零 DOM · 两面可注入）：窄桥 `question:respond` ⇒ 回执 `ok` 真 ⇒ 摘本键提问项（切片 + 位标
 *  同清）。返回 = 出站是否被受理（`ok` 真）；**卡退场非乐观**（失败 ⇒ 卡留 —— 零切片写）。 */
export async function submitAnswer({ store = defaultStore, host } = {}, promptId, answer) {
  const key = store.get()?.activeSession ?? null
  if (key === null) {
    console.error("[renderer] question:respond: no active session")
    return false
  }
  const receipt = await respondQuestion(host, promptId, answer)
  if (receipt?.ok !== true) {
    // 抛 / 拒 ⇒ 回执 `null`（`respondQuestion` 已自记错）—— 本档只补「回执拒收」半（零双记）
    if (receipt !== null) console.error(`[renderer] question:respond failed: ${receipt?.reason ?? "unknown"}`)
    return false
  }
  const state = store.get()
  if (state?.questions?.[key]?.promptId !== promptId) return true // 已被事件面摘 ∥ 已被新项替换 ⇒ 零写
  store.set(clearQuestion(state, key))
  return true
}

// ─── 挂载面（帧尾态刷 · 纯读现态）────────────────────────────────────────

/** 卡内容签名（刷新幂等判据）：`prompt-id` ∧ 逐行 `data-status` 码序 ∧ 文本 —— 三面全等 ⇒ 零 DOM 写；
 *  **在形文本控件的值不入签名**（草稿保全即所图 —— 键入不动文本面）。 */
function signature(node) {
  const codes = typeof node?.querySelectorAll === "function"
    ? [...node.querySelectorAll("[data-status]")].map((row) => row.getAttribute?.("data-status") ?? "").join("\u0000")
    : ""
  return `${node?.getAttribute?.("data-prompt-id") ?? ""}\u0000${codes}\u0000${node?.textContent ?? ""}`
}

/** 一族插点锚：首个更高序卡之前；无 ⇒ `[data-pill]` 之前；两锚皆缺 ⇒ `null`（末位 —— `insertBefore(node, null)` = 末插）。 */
function cardAnchor(root, code) {
  if (typeof root?.querySelector !== "function") return null
  for (const higher of CARD_ORDER.slice(CARD_ORDER.indexOf(code) + 1)) {
    const hit = root.querySelector(`[data-card="${higher}"]`)
    if (hit != null) return hit
  }
  return root.querySelector("[data-pill]") ?? null
}

/** 在场本档卡（两查一合 —— 族序 = 卡序；不并选择器字面：机检假面选择器闭集只收单属性形）。 */
function liveCards(root) {
  if (typeof root?.querySelectorAll !== "function") return []
  return OWN_CODES.flatMap((code) => [...root.querySelectorAll(`[data-card="${code}"]`)])
}

/** 本档期望卡（纯读切片 —— 族内单槽：`questions` / `tasks` 按会话键各一槽；缺 / 空 ⇒ 该族缺席）。 */
function wantedCards(state, handlers) {
  const key = state?.activeSession ?? null
  if (key === null) return []
  const wanted = []
  const question = state?.questions?.[key]
  if (question !== undefined) wanted.push({ code: "question", descriptor: questionTree(question, handlers) })
  const plan = planTree(state?.tasks?.[key])
  if (plan !== null) wanted.push({ code: "task", descriptor: plan })
  return wanted
}

/** 卡族挂载（幂等）：等值 ⇒ 零写 ∥ 就地换；多 ⇒ 摘；缺 ⇒ 插位。返回 = 在场族数。 */
export function mountCards(root, state, handlers = {}) {
  if (typeof root?.insertBefore !== "function") return 0 // 容器缺位 / 宿主异常 ⇒ 空转
  const wanted = wantedCards(state, handlers)
  const live = liveCards(root)
  const missing = []
  for (const entry of wanted) {
    const step = live.findIndex((node) => node.getAttribute?.("data-card") === entry.code)
    if (step < 0) {
      missing.push(entry)
      continue
    }
    const node = live.splice(step, 1)[0]
    const next = build(entry.descriptor)
    if (signature(node) !== signature(next)) node.replaceWith(next) // 等值 ⇒ 零 DOM 写（草稿 / 焦点保全）
  }
  for (const node of live) node.remove() // 多 ⇒ 摘（切片已摘 / 换会话无槽 ⇒ 同此径）
  for (const entry of missing) root.insertBefore(build(entry.descriptor), cardAnchor(root, entry.code))
  return wanted.length
}

// ─── 装配（接线形通则 = `docs/desktop/design/RENDERER.md` §1.1）────────────

/** 卡族装配：`paintCards`（挂载面**纯读**现态 —— 容器缺位 ⇒ `mountCards` 空转）+ 两 handlers（薄壳 ——
 *  出站与清除判据全归 `submitAnswer`）。 */
export function attachCards(host, deps = {}) {
  const store = deps.store ?? defaultStore
  const onAnswer = (promptId, answer) => void submitAnswer({ store, host }, promptId, answer)
  const onAnswerDraft = (promptId, event) => {
    const input = draftInput(event)
    if (input === null) {
      console.error("[renderer] question:answer: draft input missing for prompt:", promptId)
      return
    }
    const draft = typeof input.value === "string" ? input.value : ""
    if (draft.trim() === "") return // 空白串 ⇒ 零动作零 IPC（取消走显式出口 —— 不吞别的键）
    void submitAnswer({ store, host }, promptId, draft)
  }
  const paintCards = (state = store.get()) => mountCards(document.querySelector(CARDS_SLOT), state, { onAnswer, onAnswerDraft })
  return { paintCards, handlers: { onAnswer, onAnswerDraft } }
}

/** 本卡文本控件（**词面读数 = 接线面**）：由事件宿主定位（`currentTarget` ⇒ 最近提问卡 → `[data-input="answer"]`）；
 *  控件缺位 ⇒ `null`（调用面零动作 + 记错）。 */
function draftInput(event) {
  const origin = event?.currentTarget ?? event?.target ?? null
  const card = typeof origin?.closest === "function" ? origin.closest('[data-card="question"]') : null
  return typeof card?.querySelector === "function" ? card.querySelector('[data-input="answer"]') : null
}
