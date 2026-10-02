/**
 * mount-cards.mjs — 卡族挂载与出站（「桌面处理流 · VSC 对齐」批 R1 #4 —— 卡树改**核卡工厂直取**
 * 〔`/rc/cards/{question,panel}.mjs`〕；插入点纪律单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）：
 *   ① 挂载面 = 对话流根 `[data-slot="flow"]` 内**提问 / 计划 / 目标三族（R5 增目标族）**（审批族归 `renderer/views/chat.mjs` + `views/chat-cards.mjs`
 *      —— 本档零重叠：不读不写 `[data-card="approval"]`）；
 *   ② 插点 = 首个**更高序**卡之前（卡序 = 待审批 → 提问 → 计划 → **目标**〔R5 增尾位〕 —— 缺者跳过）；无 ⇒ `[data-pill]` 之前；
 *      两锚皆缺 ⇒ 末位；多 ⇒ 摘（族内单槽 —— 切片按会话键一槽，本不该多）；
 *   ③ 刷新幂等：`prompt-id` ∧ 逐行状态码序 ∧ 文本 —— 三面全等 ⇒ **零 DOM 写**（在形文本控件的草稿 / 焦点保全）；
 *      出口锚集 = 两核卡的**同值函数**（同载荷 ⇒ 同锚）⇒ 不另比；
 *   ④ 出站 `submitAnswer`：窄桥 `question:respond`（作答 / 取消两向 —— 取消 `answer: null`）；**零乐观摘除** ——
 *      回执 `ok` 真 ⇒ 纯动作 `clearQuestion`（`questions` 切片 + `approval` 位标同清，单源 =
 *      `renderer/events.mjs`）⇒ 帧挂载摘卡恰一次；失败 / 拒绝 / 抛 ⇒ **零 DOM 写**（核零摘除 ⇒ 卡恒在场可重试；
 *      抛 / 拒 ⇒ `respondQuestion` 自记错；**回执拒收**〔`ok` 假〕⇒ 本档记 `receipt.reason` —— 两半合「失败」全形，各自单记零双记）；
 *   ⑤ 会话键 = **入口现刻读**（本卡所属会话 —— 回执在途可能已切会话，按现刻 `activeSession` 摘会误摘别会话
 *      待答项）；摘项前验 `promptId` 仍是本项（已被事件面摘 ∥ 已被新项替换 ⇒ 零写，仅回执判定）；
 *   ⑥ 「对齐第三批」P3① 保留（新卡插入 ⇒ 核卡作答控件 `focus()`）；**P2（Enter 提交）随核卡内建**（含 IME 组字门）；
 *      P3②（作答后回焦输入区）经核卡 `deps.onAnswered` 注入点落 `focusComposer`。
 * 纪律：零 `node:` / 零裸包；本档零面向用户文案（词面归核卡 ∥ 视图档）。
 */
import { clearQuestion } from "./events.mjs"
import { store as defaultStore } from "./store.mjs"
import { goalCardNode, goalPanelOpen } from "./views/goal.mjs"
import { planCardNode } from "./views/plan.mjs"
import { questionCardNode, respondQuestion } from "./views/question.mjs"
// 快照族（波 1 产物 —— #606④ 包络：卡面域内焦点复填）
import { captureView, restoreView } from "./view-state.mjs"

/** 卡族挂载根（与块序列同宿对话流根 —— 骨架属性住 `renderer/index.html`）。 */
export const CARDS_SLOT = '[data-slot="flow"]'

/** 重挂触发切片：活动会话（三族皆按会话键取槽）· 提问切片 · 计划切片 · **目标切片（R5 增）** · 语言（词面）。 */
export const CARDS_KEYS = Object.freeze(["activeSession", "questions", "tasks", "goal", "locale"])

/** 卡序闭枚举（**单源** = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条 —— R5 增尾位 `goal`）：
 *  待审批 → 提问 → 计划 → **目标**；数组序 = DOM 序 —— 插点判据「首个更高序卡」由本表切片导出
 *  （审批族不归本档，仅参与序判）。 */
export const CARD_ORDER = Object.freeze(["approval", "question", "task", "goal"])

/** 本档三族 = 卡序尾三（审批族归 `renderer/views/chat.mjs`）。 */
const OWN_CODES = CARD_ORDER.slice(1)

// ─── 出站（作答 / 取消同一路）────────────────────────────

/** 聚焦（P3① —— 无 `focus` 面（假 DOM / 平 node）⇒ 零动作零抛）。 */
function focusNode(node) {
  if (node !== null && node !== undefined && typeof node.focus === "function") node.focus()
}

/** 回焦输入区（P3② —— 核卡 `deps.onAnswered` 注入点），落点 = 核件输入框 `#input`（结构单源 = VSC ids ——
 *  输入面板上提批换装后锚面；面缺 ⇒ 零动作）。 */
function focusComposer() {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") return
  focusNode(document.querySelector("#input"))
}

/** 提问出口核心（零 DOM · 两面可注入）：窄桥 `question:respond` ⇒ 回执 `ok` 真 ⇒ 摘本键提问项（切片 + 位标
 *  同清）；**卡退场非乐观** —— 核零摘除（卡留场）∥ 回执 `ok` 真 ⇒ 切片清 ⇒ 帧挂载摘卡；失败 ⇒ 零 DOM 写
 *  （卡恒在场可重试）。返回 = 出站是否被受理（`ok` 真）。 */
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
  if (state?.questions?.[key]?.promptId !== promptId) return true // 已被事件面摘 ∥ 已被新项替换 ⇒ 零写（受理已成立）
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

/** 本档期望卡（纯读切片 —— 族内单槽：`questions` / `tasks` / `goal` 按会话键各一槽；缺 / 空 ⇒ 该族缺席）：
 *  三族皆**核卡工厂直取**（`views/question.mjs` / `views/plan.mjs` / **`views/goal.mjs`（R5）**）；计划族显隐判据随核
 *  （`shown` = 本卡当前是否显示 —— 挂载面现读，判据输入面）；目标族显隐判据随核（`goalPanelVisible` —— 非空即可显示）
 *  ∧ **开合态**（#554②：`{ open }` 传入 —— 默认合 ⇒ 新卡挂载即隐藏；🎯 开合就地施用）。 */
function wantedCards(state, handlers, shown) {
  const key = state?.activeSession ?? null
  if (key === null) return []
  const wanted = []
  const question = state?.questions?.[key]
  if (question !== undefined) wanted.push({ code: "question", node: questionCardNode(question, handlers) })
  const plan = planCardNode(state?.tasks?.[key], { shown })
  if (plan !== null) wanted.push({ code: "task", node: plan })
  const goal = goalCardNode(state?.goal?.[key], { open: goalPanelOpen() })
  if (goal !== null) wanted.push({ code: "goal", node: goal })
  return wanted
}

/** 卡族挂载（幂等）：等值 ⇒ 零写 ∥ 就地换；多 ⇒ 摘；缺 ⇒ 插位（**提问族新插 ⇒ 核卡作答控件聚焦** —— P3①）。
 *  返回 = 在场族数。 */
export function mountCards(root, state, handlers = {}) {
  if (typeof root?.insertBefore !== "function") return 0 // 容器缺位 / 宿主异常 ⇒ 空转
  const live = liveCards(root)
  const wanted = wantedCards(state, handlers, live.some((node) => node.getAttribute?.("data-card") === "task"))
  const missing = []
  for (const entry of wanted) {
    const step = live.findIndex((node) => node.getAttribute?.("data-card") === entry.code)
    if (step < 0) {
      missing.push(entry)
      continue
    }
    const node = live.splice(step, 1)[0]
    if (signature(node) !== signature(entry.node)) node.replaceWith(entry.node) // 等值 ⇒ 零 DOM 写（草稿 / 焦点保全）
  }
  for (const node of live) node.remove() // 多 ⇒ 摘（切片已摘 / 换会话无槽 ⇒ 同此径）
  for (const entry of missing) {
    root.insertBefore(entry.node, cardAnchor(root, entry.code))
    if (entry.code === "question") focusNode(entry.node.querySelector?.(".question-input") ?? null)
  }
  return wanted.length
}

// ─── 装配（接线形通则 = `docs/desktop/design/RENDERER.md` §1.1）────────────

/** 卡族装配：`paintCards`（挂载面**纯读**现态 —— 容器缺位 ⇒ `mountCards` 空转）+ 两 handlers（薄壳 ——
 *  出站与清除判据全归 `submitAnswer`；失败径 ⇒ 零 DOM 写）。 */
export function attachCards(host, deps = {}) {
  const store = deps.store ?? defaultStore
  // 失败 / 拒绝 / 抛 ⇒ 零 DOM 写（核零摘除 ⇒ 卡恒在场可重试——本档零重挂）
  const onAnswer = (promptId, answer) => { void submitAnswer({ store, host }, promptId, answer) }
  const onAnswered = () => focusComposer() // P3②（核卡 `deps.onAnswered` 注入点）
  const paintCards = (state = store.get()) => {
    const root = document.querySelector(CARDS_SLOT)
    const snap = captureView(root)
    const model = mountCards(root, state, { onAnswer, onAnswered })
    // #606④ 包络：域内焦点复填；**滚位不复填**（挂载根 = 对话流共享滚动容器 —— 滚位归 chat 面帧尾律，
    // 且复填会夺新卡置焦的滚入；报告父侧文档层）
    if (snap !== null) restoreView(root, { scrolls: [], drafts: snap.drafts, focus: snap.focus })
    return model
  }
  return { paintCards, handlers: { onAnswer, onAnswered } }
}
