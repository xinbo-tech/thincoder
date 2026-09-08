/**
 * loading.js — send/abort button + input-box loading state.
 * Split out of ui.js (§17, 2026-09-02): ui.js is a leaf DOM-builder module
 * (imported by diff.js / settings-* / autocomplete.js and their tests) — the
 * suspension-aware loading state needs S (state.js → acquireVsCodeApi at module
 * top), so it lives HERE with the other state.js consumers instead of dragging
 * the bridge dependency into every ui.js importer.
 *
 * C2 (SESSION-FLOW-C F-C2c/F-C2d) + A3 (SESSION-FLOW-A——2026-09-09):
 * - #status-line 唯一 writer = renderStatusBar（status-bar.js）——本模块只
 *   setLoading + 置 S._phase（thinking 态标记）；loading 消息不再 innerHTML 覆写
 *   状态行（修 H-E——徽标/计数不被 thinking 重画清掉）。
 * - Stop（abort）可见性 = `S._turnState !== "idle"` 派生或 loading 驱动（A3——原
 *   susp 期派生扩展为 state≠idle 派生）：running（回合/digest/标题窗口——含 Reload
 *   冷启 webviewReady 重推 running）与 susp（digest 间等待/释放窗口）全程常显——
 *   loading:false 不再隐 abort（修 digest 间按钮闪烁 + 标题窗口/digest 起跑窗口隐藏）。
 */
import { S } from "./state.js"
import { renderStatusBar } from "./status-bar.js"

/**
 * Loading state: send/abort button swap + input lock + thinking phase marker.
 * §17 suspension: while the suspension session is active the input box NEVER locks
 * (digest turns run in the background — Enter queues the message, F7) and both the
 * send and the Stop button stay available (Stop aborts the whole background session).
 * Explicit assignment (not conditional): entering suspension must RE-ENABLE an input
 * disabled by the previous loading state — no dependence on caller ordering (F7).
 */
export function setLoading(ctx, on) {
  S._phase = on ? "thinking" : null
  // 2026-09-05 人机并行对齐（CLI state.queue 语义——实践验证模式）：processing 期间
  // 输入框始终可用（发送=排队不打断）；send 常显、abort 仅运行中显。回滚 poolActive
  // 特例（只池活跃解锁是窄化——CLI 任何处理中都可输入排队）。
  // A3（SESSION-FLOW-A F-A3——reducer 派生——一行）：`S._turnState !== "idle" || on`——
  // running（标题窗口/digest 起跑/Reload 冷启恢复）与 susp（digest 间）都常显 Stop。
  ctx.sendBtn.style.display = "flex"
  ctx.abortBtn.style.display = (S._turnState !== "idle" || on) ? "flex" : "none"
  ctx.inputEl.disabled = false
  if (!on) ctx.inputEl.focus()
  ctx.isRunning = on
  // C2 (F-C2c): thinking 段经 renderStatusBar（唯一 writer）绘制——徽标/挂起计数同线保留。
  renderStatusBar()
}
