/**
 * loading.js — send/abort button + input-box loading state.
 * Split out of ui.js (§17, 2026-09-02): ui.js is a leaf DOM-builder module
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
 * INPUT-LOCK-ASYNC（C'——2026-09-09，thincoder/docs/design/INPUT-LOCK-ASYNC.md）：
 * - 输入锁派生 `_turnState === "running"`（评审 #3：VSC digest 属 running 已含——
 *   chat-panel.mjs:50 实证）——busy 锁输入（readOnly——保留键盘事件：Ctrl+C 全停 +
 *   Ctrl+I 注入在门禁前不误伤——红线）+ busy 占位符文案；susp/idle 解锁。
 * - 锁派生 = applyBusyLock() 单点——setLoading（loading 消息）与 panels.js 的
 *   turnState/suspension reducer 重派生共用；Ctrl+I 中断模态（input.js）经
 *   ctx._interruptMode 豁免（注入框可输入——注入通道保留）。
 */
import { S, ctx } from "./state.js"
import { renderStatusBar } from "./status-bar.js"
import { t } from "./i18n.js"

/**
 * INPUT-LOCK 锁派生单点：busy（S._turnState==="running"——回合/digest/标题窗口）锁输入
 * （readOnly + busy 占位符）；susp/idle 解锁 + 默认占位符。Ctrl+I interrupt 模态激活
 * （ctx._interruptMode）时豁免——注入框需要键盘（readOnly 保留键盘事件——Ctrl+C/I 不误
 * 伤）；占位符在该模态下归 input.js 管理（applyBusyLock 不动）。
 */
export function applyBusyLock() {
  const busy = S._turnState === "running" && !ctx._interruptMode
  ctx.inputEl.readOnly = busy
  if (ctx._interruptMode) return
  ctx.inputEl.placeholder = busy ? t("input.busyPlaceholder") : t("input.placeholder")
}

/**
 * Loading state: send/abort button swap + input lock + thinking phase marker.
 * INPUT-LOCK-ASYNC：busy（running）锁输入——send 按钮常显（F-6 语义保留——发送由
 * send.js 出口守卫兜 busy 拒——readOnly 框内文本保留不吞）；Stop 只在
 * S._turnState==="running" 显（digest/回合执行中可停主会话——susp 纯池等待不显——
 * 子代理 ⏹ 逐块停——无全停——池空自然完）。
 * Explicit assignment (not conditional): entering suspension must RE-ENABLE an input
 * disabled by the previous loading state — no dependence on caller ordering (F7).
 */
export function setLoading(ctx, on) {
  S._phase = on ? "thinking" : null
  ctx.sendBtn.style.display = "flex"
  ctx.abortBtn.style.display = S._turnState === "running" ? "flex" : "none"
  applyBusyLock()
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
  // C2 (F-C2c): thinking 段经 renderStatusBar（唯一 writer）绘制——徽标/挂起计数同线保留。
  renderStatusBar()
}
