/**
 * input.js — 输入面板接线：deps 构造 + 核件工厂装配（副作用体已核化）。
 *
 * 上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P1-P3：本档原 160 行的键位 ∕ 历史 ∕
 * 自增高 ∕ 中断模态整体搬核（`render-core/composer/panel.mjs` `createComposerPanel`——逻辑零副本），
 * 本档只留四件接线：
 *  ① 静态骨架退场（结构单源 = 核件 ids；核工厂全自建 ⇒ 同 id 双存会让静态档成死面）；
 *  ② 注入面五项之端侧四项（① `root` ∕ ② `post` ∕ ③ `state` ∕ ⑤ `hooks`；④ 取词 = 核 i18n 注册面）；
 *  ③ `state.ctx` 引用重指（其余模块经 ctx 读面零改）；④ 注册序不变量（本档 import 位置不变）。
 * 行为零变（键位 ∕ 文本 ∕ 时序逐字——核件逐字搬移；真机锁 + VSC 测试面）。
 */
import { ctx, S, vscode } from "./state.js"
import { t } from "./i18n.js"
import { createComposerPanel } from "../node_modules/@thincoder/render-core/composer/panel.mjs"
import { addUser } from "./ui.js"
import { renderStatusBar } from "./status-bar.js"

/** ⑤ hooks（跨面副作用 ∕ 跨面状态同步）。`openSettings` ∕ `onAgentSettings` 两枚由装配点回填
 *  （`chat.js` `initSettings` 之后——设置面板初始化晚于本档）。 */
export const composerHooks = {}

/** ② 出站表：判别式逐字面登记（协议提取器形态①——载荷透传 `...payload`，端侧零形状副本）；
 *  未登记判别式 fail-loud（禁静默丢——核件新增出站须同拍入表）。
 *  `addProvider` = **本地面动作**（添加入口弹窗统一批 · #1054——核 footer「+ Add provider…」由本表接为
 *  直开添加弹窗，零出站；`SETTINGS.md` §2.17 ③——裸调用 ∥ 不取防御式回退：门由 `initSettings` 安装、
 *  同文档 ⇒ 点击前必已安装，缺门响亮失败，沿 §2.10 纪律）。 */
const OUT = {
  abort: (p) => vscode.postMessage({ type: "abort", ...p }),
  interrupt: (p) => vscode.postMessage({ type: "interrupt", ...p }),
  atComplete: (p) => vscode.postMessage({ type: "atComplete", ...p }),
  userMessage: (p) => vscode.postMessage({ type: "userMessage", ...p }),
  queuedUserMessage: (p) => vscode.postMessage({ type: "queuedUserMessage", ...p }),
  selectModel: (p) => vscode.postMessage({ type: "selectModel", ...p }),
  selectReasoning: (p) => vscode.postMessage({ type: "selectReasoning", ...p }),
  addProvider: () => window._openAddProviderDialog(),
  removeProvider: (p) => vscode.postMessage({ type: "removeProvider", ...p }),
  setKey: (p) => vscode.postMessage({ type: "setKey", ...p }),
  setAutoApprove: (p) => vscode.postMessage({ type: "setAutoApprove", ...p }),
  setAdvisorGuard: (p) => vscode.postMessage({ type: "setAdvisorGuard", ...p }),
  setEngineeringEnabled: (p) => vscode.postMessage({ type: "setEngineeringEnabled", ...p }),
  setPlanMode: (p) => vscode.postMessage({ type: "setPlanMode", ...p }),
}

/** ② 出站归一：`post(type, payload)` ⇒ webview 桥（上表逐字面登记）。 */
const post = (type, payload) => {
  const emit = OUT[type]
  if (!emit) throw new Error(`composer 出站：判别式未登记（${type}）`)
  return emit(payload)
}

/** 宿主 → 核推送入口（③ `state.subscribe` 收栈；端侧调用点 = `autocomplete.js` ∕ 四类推送 handler 接线）。 */
let _push = null
export const pushComposer = (m) => _push?.(m)

// ① 静态骨架退场：`index.html` 输入段全件（四容器 + 子元素——核件按同 id 全自建，同 id 双存会让
//    静态档成死面）；`#status-line` 属状态行面（A12）⇒ 不入 R1 实施面，留守原位。
const SKELETON_IDS = [
  "at-dropdown", "input-row", "file-input", "input", "attach-btn", "send-btn", "abort-btn", "paste-bar", "paste-badge",
  "controls-row", "model-btn", "reasoning-btn", "auto-btn", "advisor-btn", "eng-btn", "plan-btn", "settings-btn",
  "model-dropdown", "reasoning-dropdown",
]
for (const id of SKELETON_IDS) document.getElementById(id)?.remove()

const root = document.getElementById("toolbar")
if (!root) throw new Error("composer 接线：index.html 输入段宿主 `#toolbar` 缺失")

/** ③ 读面 + 推送入口（核 `state` 注入面——快照取用：宿主推送到达后由端侧触发重派生）。 */
const composerState = {
  turnState: () => S._turnState,
  queue: () => ({ count: S._busyQueuedCount }),
  models: () => ctx._models,
  flags: () => ({ autoApprove: S._autoApprove, advisorGuard: S._advisorOn, engineering: S._engOn, planMode: S._planActive }),
  workspaceRequired: () => S._workspaceRequired,
  subscribe: (fn) => { _push = fn },
}

export const composer = createComposerPanel({ root, post, state: composerState, hooks: composerHooks })

// ③ `state.ctx` 引用重指：核件子树 = 唯一实例（其余模块经 ctx 读面零改——`streaming.js` ∕
//    `panels.js` ∕ `chat.js` 同源）。查询域 = 面板子树 / `#toolbar` 内（防夹具同 id 干扰）。
ctx.inputEl = composer.inputEl
ctx.sendBtn = composer.inputEl.parentElement.querySelector("#send-btn")
ctx.abortBtn = composer.inputEl.parentElement.querySelector("#abort-btn")
ctx.modelBtn = root.querySelector("#model-btn")
ctx.reasoningBtn = root.querySelector("#reasoning-btn")
ctx.dropdown = root.querySelector("#model-dropdown")
ctx.reasoningDropdown = root.querySelector("#reasoning-dropdown")
// `ctx.isRunning` = 核 loading 标记的活代理（读 ⇒ `composer.isRunning()`；写 ⇒ `composer.setLoading()`）——
// `panels.js:95,114` 的 `setLoading(ctx, ctx.isRunning)` 重派生惯用式须读活值（否则重派生会清标记）。
Object.defineProperty(ctx, "isRunning", {
  get: () => composer.isRunning(),
  set: (on) => composer.setLoading(on),
  configurable: true,
})

// ⑤ hooks 端侧绑定（逐条 = §2.3 四条跨面依赖 + 源档逐字搬移）
composerHooks.onTurnStart = () => {
  // 回合起点动作（`send.js:62-63,69,72` 同点并钩）：簿记归零 + 工具结果位清
  // （#642：面板清已退场——重置点归位会话边界；#643：死计数行清）
  S._turnStart = Date.now()
  S._lastOutputAt = S._turnStart // 停滞轻显形：回合起刻 = 静默初始锚（WEBVIEW.md §4.7——`_turnStart` 邻位同置）
  ctx.hadToolResult = false
}
composerHooks.onUserEcho = (text, ts) => addUser(ctx, text, ts) // `send.js:54,73`——本地气泡（返回元素供待发送标记）
composerHooks.onWelcomeDismiss = () => { // `send.js:46-47,64-65`
  const w = ctx.messagesEl.querySelector(".welcome")
  if (w) w.remove()
}
composerHooks.onTitleHint = () => { // `send.js:85-87`（会话标题生成提示）
  if (/^Session \d+$/.test(ctx.sessionTitle.textContent)) {
    ctx.sessionTitle.textContent = ctx.sessionTitle.textContent + " — " + t("session.generatingTitle")
  }
}
composerHooks.onStatusRefresh = (status) => { // `loading.js:94` ∕ `mode-buttons.js:129`（状态行唯一 writer）
  if (status) S._phase = status.phase // 相位快照随行（`setLoading` 径给；`planMode` 径无相位变化）
  renderStatusBar()
}
composerHooks.syncModeState = (flags) => { // 跨面状态同步（`status-bar.js:23` 同面读 `S._planActive`）
  S._autoApprove = flags.autoApprove
  S._advisorOn = flags.advisorGuard
  S._engOn = flags.engineering
  S._planActive = flags.planMode
}
composerHooks.closeSiblingDropdowns = () => { // `model-picker.js:96-98`（会话下拉让位）
  ctx.sessionDropdown.style.display = "none"
  ctx.sessionSelector?.setAttribute("aria-expanded", "false")
}
composerHooks.confirmRemoveProvider = (onConfirm) => window._confirmSecretDelete(null, onConfirm) // 核 `model-menu.mjs:304`（footer 出口——F-W17 确认门）
