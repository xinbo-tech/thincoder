/**
 * loading.js — send/abort button + input-box loading state.
 * Split out of ui.js (AGENT-LOOP-ASYNC-POOL.md §6.8 face, 2026-09-02): ui.js is a leaf DOM-builder module
 * (imported by diff.js / settings-* / autocomplete.js and their tests) — the
 * suspension-aware loading state needs S (state.js → acquireVsCodeApi at module
 * top), so it lives HERE with the other state.js consumers instead of dragging
 * the bridge dependency into every ui.js importer.
 *
 * C2 (SESSION-FLOW-C F-C2c/F-C2d) + A3 (SESSION-FLOW-A——2026-09-09) → F-6
 * (SESSION-ACTIVITY-REVISED——2026-09-09 评审 #1 定论——susp 不显):
 * - #status-line 唯一 writer = renderStatusBar（status-bar.js）——本模块只
 *   setLoading + 置 S._phase（thinking 态标记）；loading 消息不再 innerHTML 覆写
 *   状态行（修 H-E——徽标/计数不被 thinking 重画清掉）。
 * - Stop（abort）可见性 = `S._turnState === "running"` 派生（A3 state≠idle → F-6
 *   收窄 running）：running（回合/digest/标题窗口/Reload 冷启重推 running）常显——
 *   susp（纯后台池跑——主空闲）不显（无全停——池空自然消化完——子代理停止靠活动区
 *   逐块 ⏹）；loading:false 不再隐 abort（修 digest 间按钮闪烁 + 标题窗口/digest
 *   起跑窗口隐藏）。
 * - **Send 可见性 = running 期隐藏**（WEBVIEW.md §14 C-14——M4 选定案）：与忙态单一判据同源
 *   （`_turnState === "running"`）——消除「可点但必被入队」噪声面；Stop 承担停止；
 *   `send.js` 门禁零改（busy 提交入队受理——容量 8；满队才拒发 toast + 文本保留）。
 * INPUT-LOCK-ASYNC（C'——2026-09-09，thincoder-cli/docs/design/INPUT-LOCK-ASYNC.md）→
 * INPUT-LOCK-BEHAVIOR-REVISED（2026-09-09 修订——不禁录入只禁 send——评审通过）：busy
 * 派生 `_turnState === "running"`（评审 #3：digest 属 running——chat-panel.mjs:50 实证）
 * ——输入不禁（readOnly 锁移除——打字回显——send 禁由 send.js 出口守卫兜——Ctrl+C/I 门禁
 * 前不误伤——红线）+ busy 占位符；susp/idle 默认。状态派生单点见 applyBusyLock（input.js
 * 中断模态经 ctx._interruptMode 管占位符归属）。
 */
import { S, ctx } from "./state.js"
import { renderStatusBar } from "./status-bar.js"
import { closeModelMenu } from "./model-menu.js"
import { t } from "./i18n.js"

/**
 * 模型 / 推理按钮忙态门判据（F-W14 · D-W16）：非 `idle`（`running` / `susp`）⇒ 挡。
 * **同经 `S._turnState` 派生的独立谓词**——与 Send / Stop 的 `=== "running"` 非同一条
 * （本门多含 `susp`：在飞蒸馏落盘窗携旧回合快照——忙态写槽会被旧快照覆写）。
 * 两处写槽入口同读本谓词（`webview/model-picker.js`：按钮点击 / `models` 推送自动回写）。
 */
export function modelSwitchBlocked() {
  return S._turnState !== "idle"
}

/**
 * 忙态门应用（派生单点）：两信息钮**显式禁用**（`disabled` + `aria-disabled`）——不隐藏
 * （屏上须可读当前会话模型 / 推理级；隐藏即失去信息——与 Send 隐藏的分工见 §4.2）；
 * 进忙态时关已弹出的两个浮层（不留「点了没用」的假 affordance）。
 */
function applyModelSwitchGate() {
  const blocked = modelSwitchBlocked()
  for (const btn of [ctx.modelBtn, ctx.reasoningBtn]) {
    btn.disabled = blocked
    btn.setAttribute("aria-disabled", String(blocked))
  }
  if (blocked) {
    closeModelMenu()
    ctx.reasoningDropdown.style.display = "none"
  }
}

/**
 * INPUT-LOCK 状态派生单点：busy（S._turnState==="running"——回合/digest/标题窗口）不禁
 * 录入（readOnly 锁移除——打字回显——Enter 拒发由 send.js 出口守卫兜——文本保留）——只
 * 换 busy 占位符；susp/idle 默认占位符。Ctrl+I interrupt 模态（ctx._interruptMode）下
 * 占位符归 input.js 管理（applyBusyLock 不动）。
 */
export function applyBusyLock() {
  const busy = S._turnState === "running" && !ctx._interruptMode
  ctx.inputEl.readOnly = false // 锁移除——始终可编辑（INPUT-LOCK-BEHAVIOR-REVISED）
  applyModelSwitchGate() // F-W14：忙态门（与中断模态无关——同点派生，两入口同谓词）
  if (ctx._interruptMode) return
  // 无工作区守卫第三态（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：优先级 **守卫 > busy > 常态**
  ctx.inputEl.placeholder = S._workspaceRequired
    ? t("workspace.requiredPlaceholder")
    : (busy ? t("input.busyPlaceholder") : t("input.placeholder"))
}

/**
 * Loading state: send/abort button swap + input state + thinking phase marker.
 * INPUT-LOCK：busy（running）不禁录入（readOnly 锁移除——打字回显）——占位符 busy 文案；
 * **Send 按钮 running 期隐藏**（§14 C-14——与忙态单一判据同源，消除「可点但必被入队」噪声面；susp/idle
 * 恢复 flex）；Stop 只在 S._turnState==="running" 显（digest/回合执行中可停主会话——susp
 * 纯池等待不显——子代理 ⏹ 逐块停——无全停——池空自然完）。每次调用重派生状态
 * （applyBusyLock——进出 susp/running 都刷新——不依赖调用方顺序——F7）。
 */
export function setLoading(ctx, on) {
  S._phase = on ? "thinking" : null
  ctx.sendBtn.style.display = S._turnState === "running" ? "none" : "flex" // C-14：running 期隐藏（Stop 同派生点）
  ctx.abortBtn.style.display = S._turnState === "running" ? "flex" : "none"
  applyBusyLock()
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
  // C2 (F-C2c): thinking 段经 renderStatusBar（唯一 writer）绘制——徽标/挂起计数同线保留。
  renderStatusBar()
}
