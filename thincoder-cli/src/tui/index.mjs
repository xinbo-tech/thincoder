/**
 * tui.mjs — bare ANSI terminal UI
 * Zero dependencies: raw mode keyboard input, ANSI escape rendering, custom wide-char wrapping.
 * Layout: header / conversation (scrollable) / todo panel (when tasks exist) / input box / status bar.
 *
 * Large logic blocks extracted to independent modules:
 *   agent-turn.mjs    — agent loop + callback construction
 *   render-loop.mjs  — frame scheduler + incremental panel rendering
 *   startup.mjs       — startup screen + session restore + background indexing
 *   interaction.mjs   — permission approval + Q&A
 *   pickers.mjs       — generic list picker + model picker
 *   wizard.mjs        — first-launch config wizard
 *   slash-commands.mjs — slash command dispatch
 *   config-helpers.mjs — persistRaw / syncProviderField / maskKey
 *   clipboard.mjs     — clipboard image paste
 *   distill-cmd.mjs   — /distill command
 *   mouse.mjs         — SGR mouse parsing + dispatch assembly (createMouseDispatch)
 *   update-notice.mjs — background update notice + startup check
 *   tui-state.mjs     — TUI state literal factory（structure-debt #159）
 *   input-face.mjs    — 输入面：stdin 流 + data 处理器 + 键盘/鼠标后置挂载入口（二段接口）
 *   conversation-writer.mjs — 对话写入面：pushLine / pushLabel / assistant 标签位
 *   turn-face.mjs     — 回合面：submit / interaction / 粘贴 / turnCtx / turn
 */

import { saveSession } from "@thincoder/core/session.mjs"
import { closeAllMcp } from "@thincoder/core/mcp.mjs"
import { createRenderLoop } from "./render-loop.mjs"
import { ansi, C } from "./ansi.mjs"
import { SLASH_COMMANDS, createSlashCommands } from "./slash-commands.mjs"
import { createWizard } from "./wizard.mjs"
import { createExitCleanup } from "./tui-lifecycle.mjs"
import { createPickers } from "./pickers.mjs"
import { runDistill as runDistillImpl } from "./distill-cmd.mjs"
// F-XR1 退出释放（EXIT-CLAIM-RELEASE · SESSION.md §6.18）：核薄函数——/exit 与 Ctrl+C×2
// 同一退出语义双入口；退出恒达（永不抛出）；零触碰 marker 面（F-XR2 路标保留）。
import { releaseClaimsAll } from "@thincoder/core/session-slots-manifest.mjs"
import { showStartup, backgroundIndex, createLoadOlder } from "./startup.mjs"
import { createConfigHelpers } from "./config-helpers.mjs"
import { createUpdateNotice, pendingNoticeReady } from "./update-notice.mjs"
import { startLedgerSurface } from "./ledger-surface.mjs"
import { createTuiState } from "./tui-state.mjs"
import { createInputFace } from "./input-face.mjs"
import { createConversationWriter } from "./conversation-writer.mjs"
import { createTurnFace } from "./turn-face.mjs"

export { upgradeFailureText, pendingNoticeReady } from "./update-notice.mjs"

/**
 * SESSION.md §6.8 D-S2 — TUI 启动首帧前的 provider 重选流程：
 * provider 无效（`_providerInvalid` 标记或 provider 为 null）→ 先弹模型选择 picker
 * （复用 openModelPicker，展示当前可用 providers）；用户选定后继续正常启动。
 * 选择取消（Esc）→ 仍进入 TUI，推送提示行（"未配置有效 provider，可用 /model 配置
 * 渠道与模型"）——绝不因无 provider 拒绝进入。返回 true 表示弹过选择流程。
 */
export async function promptProviderIfInvalid(agent, openModelPicker, pushLine) {
  if (!(agent._providerInvalid || !agent.provider)) return false
  await openModelPicker()
  if (!agent.provider) {
    // MODEL-MERGE-SESSION 引导 A（F-6）：空槽 + defaultModel 未设 → 提示 /config 默认模型入口
    // （index.mjs 本行为 D-S2 取消提示扩展——设计文件清单外——随批上报）
    const hasProviders = (agent.providers?.length ?? 0) > 0
    pushLine(hasProviders && !agent.config?.defaultModel
      ? "尚未设置默认模型（config.defaultModel——新会话起点）：/config → 默认模型 设置一次；/model 仅改本会话"
      : "未配置有效 provider，可用 /model 配置渠道与模型", C.warn)
  }
  return true
}

/**
 * Start the TUI, taking over the terminal until exit.
 * agent: return value of createAgent
 * opts: { projectDir?, team?, author? } — used by /distill when writing to project/team layers
 */
export async function startTUI(agent, opts = {}) {
  if (!process.stdin.isTTY) {
    throw new Error("TUI requires a TTY; use 'thincoder chat' for non-interactive use")
  }

  const distillOpts = opts

  // Capture terminal dimensions BEFORE raw mode & alt buffer switch as the
  // state.dims seed (ConPTY reads are unstable: falsy at startup, stale-small
  // during output activity). Refresh happens ONLY in event hooks — startup
  // convergence retry, the 300ms delayed resample, resize events, the idle
  // watchdog, agent-turn finally — never in the render path (2026-08-30).
  const startupCols = process.stdout.columns || 80
  const startupRows = process.stdout.rows || 24
  const state = createTuiState({ cols: startupCols, rows: startupRows, agent })
  state._agent = agent
  agent._tuiState = state // F-3：面板视图现算通道（替代退役的手工面板镜像）

  // On session restore, if all tasks are completed, auto-collapse the todo panel (match runtime behavior)
  if (state.tasks.length > 0 && state.tasks.every((t) => t.status === "done")) {
    state.tasks = []
  }

  // 输入面（input-face.mjs，原址 :153 早挂载）：stdin 流过滤 / raw mode / 启动序列 / 解码器 +
  // data 处理器整块；render / pushLine / loadOlder 以惰性取值器承接（晚定义名——TDZ 语义保持），
  // 键盘 ③ 与鼠标 ④ 后置挂载入口在命令层之后按原址调用（构造期读值面——见 invariant §2.2）。
  const inputFace = createInputFace({
    state,
    get render() { return render },
    get pushLine() { return pushLine },
    get loadOlder() { return loadOlder },
  })

  const cleanup = createExitCleanup({ agent, saveSession, closeAllMcp })
  process.on("exit", cleanup)

  // 对话写入面（conversation-writer.mjs，原址 :293）：行额度单点 + 消息标签 + assistant 标签位
  // （render 以惰性转发承接——renderLoop 于下方装配）
  const conversation = createConversationWriter({ state, render: () => render() })
  const { pushLine, pushLabel, ensureAssistantLabel } = conversation

  // ---------------------------------------------------------- Render

  const renderLoop = createRenderLoop(state, agent,
    { startupDims: { cols: startupCols, rows: startupRows }, SLASH_COMMANDS,
      pendingNoticeReady, get showUpdateNotice() { return showUpdateNotice } },
    pushLine)
  const { render, scheduleRender } = renderLoop

  // 懒加载更早历史（startup.mjs createLoadOlder——D-S1b）：滚轮/PgUp 到顶自动加载；
  // 声明在此（render 已可用）——data 回调（滚轮分支）与 createKeyHandler ctx（PgUp）共用。
  const loadOlder = createLoadOlder({ agent, state, render })

  // TUI-OOM-ROOTCAUSE（CRASH-REPORTS.md §8.3 订阅接线）：堆预警行入对话流（pushLine 已 render）——
  // 不新增 TUI 定时器（采样定时器住 heap-watch 模块，bin 入口武装）；订阅失败不影响启动。
  try {
    const { onHeapWarn } = await import("../heap-watch.mjs")
    onHeapWarn((line) => pushLine(line, C.warn))
  } catch { /* 尽力面 */ }

  // Resize events are genuine dimension changes on every terminal (2026-08-31
  // simplification: the earlier settle-timer/double-confirm machinery was built
  // on the misdiagnosed ConPTY-stale hypothesis and even stalled drag-shrink).
  // Any sane sample — larger or smaller — is accepted immediately; the cache
  // self-corrects on the next real resize.
  process.stdout.on("resize", () => {
    try { state.dims.refresh(); render() } catch { /* resize error — ignore */ }
  })

  // 回合面（turn-face.mjs，原址 :366）：submit / interaction（权限 + 提问）/ 图片粘贴 / turnCtx / turn
  const { submit, turnCtx, askPermission, askQuestion, pasteClipboardImage } = createTurnFace({
    agent, state, pushLine, pushLabel, render, ensureAssistantLabel, summarize, conversation,
    handleSlash: (t) => handleSlash(t),
  })

  // ---------------------------------------------------------- Slash Commands

  // Config helpers: implemented in config-helpers.mjs
  const { persistRaw, syncProviderField, maskKey } = createConfigHelpers(agent)

  // Model picker + generic picker: implemented in pickers.mjs
  const { closePicker, showPicker, popPicker, renderPickerLines, openModelPicker, selectModel, setProviderKey, pickModelForSlot, confirmDelete } = createPickers({
    agent, state, render, ansi, C, pushLine, pushLabel, persistRaw, askQuestion, maskKey,
  })

  // First-launch config wizard: implemented in wizard.mjs, closure deps passed via ctx
  const { startWizard, renderWizard, wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems } = createWizard({
    agent, state, pushLine, pushLabel, render, persistRaw,
    openModelPicker: () => openModelPicker(),
  })

  // /distill: impl in distill-cmd.mjs, ctx-passed
  const runDistill = () => runDistillImpl({ agent, state, pushLine, render, askPermission, distillOpts })

  // Slash command dispatch + Tab completion: implemented in slash-commands.mjs, closure deps passed via ctx
  const { handleSlash, completions, handleTab } = createSlashCommands({
    agent, state, distillOpts,
    pushLine, pushLabel, render,
    showPicker, closePicker, askQuestion, askPermission, confirmDelete,
    persistRaw, syncProviderField, maskKey,
    openModelPicker: () => openModelPicker(),
    selectModel,
    setProviderKey,
    pickModelForSlot,
    runDistill,
    exit: () => {
      cleanup()
      // F-XR1 退出释放（EXIT-CLAIM-RELEASE · SESSION.md §6.18）：同 key-handler 退出分支——
      // 先释放（同步完成）后定时器注册（D-SE42——100ms 窗零竞态）。
      releaseClaimsAll(process.cwd())
      setTimeout(() => process.exit(0), 100)
    },
  })
  // handleSlash is referenced by turnCtx (circular dep: submit → turn → handleSlash), backfilled here
  turnCtx.handleSlash = handleSlash

  // ---------------------------------------------------------- Keyboard / Mouse

  inputFace.mountKeys({
    agent, state, render, popPicker, renderPickerLines,
    handleSlash, handleTab, submit, pasteClipboardImage,
    wizardChooseProvider, wizardSubmitText, cancelWizard, wizardProviderItems,
    renderWizard, pushLine, cleanup, showPicker, loadOlder,
  })

  // 鼠标点击/滚轮 ctx 装配（mouse.mjs createMouseDispatch——D-S1a：cancelSubagent/onMouseClick/mouseCtx）
  inputFace.mountMouse({ agent, state, pushLine, render, popPicker })

  // ---------------------------------------------------------- Startup screen + background indexing

  // SESSION.md §6.8 D-S2：startTUI 首帧前 —— provider 无效（_providerInvalid / provider 为 null）
  // → 先弹模型选择 picker（keyStream 已挂 keypress，Esc/Enter 可用）；Esc → 提示行，仍进 TUI
  await promptProviderIfInvalid(agent, () => openModelPicker(), pushLine)

  showStartup({ agent, state, opts, pushLine, pushLabel, render, startWizard })
  // LEDGER-SURFACE（§2.30.3.4）：台账可见面——首扫（setImmediate）+ 周期；dispose 挂进程退出（:278 cleanup 先例）
  const ledgerSurface = startLedgerSurface({ state, agent, pushLine, render })
  // 前置缺陷最小修（2026-09-22 structure-debt · 父侧授权 · 只修调用点）：K-LX3 归核后
  // `startLedgerSurface` 返回 **Promise**（resolve 出 `{ dispose }`）——原同步 `.dispose()`
  // 令每次退钩抛 TypeError（`node test-startup.mjs` 前置红，HEAD 逐字同款）；按 Promise 承接。
  process.on("exit", () => { void Promise.resolve(ledgerSurface).then((s) => s?.dispose?.()) })
  backgroundIndex({ agent, state, render })

  // Check for updates (non-blocking, after startup screen)——实现 update-notice.mjs
  // （D-S1c）：有 picker 打开时不硬抢——挂到 state.pendingNotice，picker 全部关闭后由
  // doRender 弹出（showUpdateNotice 经 renderLoop ctx getter 懒引用）。
  const { showUpdateNotice, checkUpdates } = createUpdateNotice({ state, showPicker, pushLine, pushLabel, render })
  checkUpdates()
}

function summarize(obj) {
  const s = JSON.stringify(obj)
  if (s === "{}") return "" // no-arg tools (advisor/verify/…) — don't render empty braces
  return s.length > 80 ? s.slice(0, 80) + "…" : s
}
