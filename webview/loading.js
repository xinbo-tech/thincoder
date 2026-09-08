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
 */
import { S } from "./state.js"
import { renderStatusBar } from "./status-bar.js"

/**
 * Loading state: send/abort button swap + input lock + thinking phase marker.
 * §17 suspension → SESSION-ACTIVITY-REVISED F-6：挂起会话期输入框永不锁（digest 回合
 * 在后台跑——Enter 排队）——send 常显；Stop 只在 S._turnState==="running" 显（digest/
 * 回合执行中可停主会话——susp 纯池等待不显——子代理 ⏹ 逐块停——无全停——池空自然完）。
 * Explicit assignment (not conditional): entering suspension must RE-ENABLE an input
 * disabled by the previous loading state — no dependence on caller ordering (F7).
 */
export function setLoading(ctx, on) {
  S._phase = on ? "thinking" : null
  // 2026-09-05 人机并行对齐（CLI state.queue 语义——实践验证模式）：processing 期间
  // 输入框始终可用（发送=排队不打断）；send 常显、abort 仅运行中显。回滚 poolActive
  // 特例（只池活跃解锁是窄化——CLI 任何处理中都可输入排队）。
  // SESSION-ACTIVITY-REVISED（F-6——评审 #1 定论）：Stop 可见性 = S._turnState ===
  // "running" 派生（回合/digest/标题窗口/Reload 冷启重推 running）——susp（纯后台池跑
  // ——主空闲——digest 间等待/释放窗口）不显——无全停按钮——子代理停止靠活动区每块 ⏹
  // （running+pool）——池空自然消化完（CLI 对拍）。loading 参数不再驱动 abort（running
  // 恒先于 loading 广播——host 序 panel-chat impl 入口）。
  ctx.sendBtn.style.display = "flex"
  ctx.abortBtn.style.display = S._turnState === "running" ? "flex" : "none"
  ctx.inputEl.disabled = false
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
  // C2 (F-C2c): thinking 段经 renderStatusBar（唯一 writer）绘制——徽标/挂起计数同线保留。
  renderStatusBar()
}
