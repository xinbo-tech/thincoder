/**
 * panel-turn-stages.mjs — 回合阶段函数面（自 `panel-chat.mjs` 拆出——VSC 四档结构拆分批
 * 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.1）。
 *
 * 迁出段（逐字搬迁 · 既有注释一并随迁 · 控制流翻译按 §12.2.1 契约）：
 *   · 段 A `resolveTurnStage`（原 `panel-chat.mjs:178-235`）——provider / 模型解析；
 *   · 收尾 `finalizeTurn`（原 `:311-350` finally 体）——落盘 / 标题 / 忙态归位；
 *   · 段 B `enterSuspensionTurn`（原 `:352-382`）——挂起会话接管。
 * 留主档（`panel-chat.mjs`）= 入口守卫段（`ensurePanelAgent` / `ensureMemoryHandle` 同址——
 * `test/engine-floor-guard.test.mjs:152-154` 结构机检）+ 行加载 / 回调装配段 + 循环调用。
 *
 * 搬运契约（§12.2.1 A-1–A-5 / B-1–B-3）：
 *   · 段 A 三处提前 `return`（impl 内 = 退出并触发 finally）⇒ 判别式回传 `{ done: true }`，
 *     调用侧 `if (stage.done) return` **留在 try 内**（落 try 外 ⇒ finally 不执行 ⇒ 语义变更）；
 *     回传面 = `providerName` / `p` / `slotStamp` / `slotData`（`slotRef` 段内消费尽，不入面）。
 *   · 段 B `runTurn` 闭包原直调 `runPanelChat`⇒ 本档改**注入项** `deps.runChat`（B-2/B-3：
 *     本档零 import 主档——`panel-chat` 之名不出现在本档 import 说明符中——不新增环）。
 *
 * 环安全：`panel-chat → panel-turn-stages` 单向（本档零 import 主档）；`_cwd` 取自主档同源的
 * `panel-messages.mjs`（延迟解引用）。
 */
import { resolveProviders } from "@thincoder/core/config-io.mjs"
import { providerNames, getKey, buildProvider } from "./presets.mjs"
import { specForModel } from "../specs.mjs"
import { t } from "../i18n.mjs"
import { _cwd } from "./panel-messages.mjs"
import { suspensionSession, poolLive, backgroundStatus } from "./suspension.mjs"
import { traceStop } from "./stop-trace.mjs"
// MODEL-MERGE-SESSION 模型/stamp 决策纯函数（500 行硬限拆分——turn-model.mjs）
import { resolveTurnModelAndStamp } from "./turn-model.mjs"
import { resolveReasoningMode } from "./reasoning-mode.mjs"

/** 迁出自 `panel-chat.mjs`（本批逐字搬迁——`a.mjs` 段 A）：provider / 模型解析阶段。
 *  契约 A-1：三处早退（无 provider / buildProvider 抛错 / `!p`）回传 `{ done: true }`——
 *  调用侧翻译位必须留在 impl 的 try 内（否则收尾 finally 不执行）。 */
export async function resolveTurnStage({ panel, turnSlot, providerName, modelOverride, reasoning }) {
  // ── MODEL-MERGE-SESSION：会话槽复合恒读（F-4 恢复读槽——非仅 providerName 缺席路径）。
  // webview userMessage 恒带 dropdown 复合（send.js echo——dropdown = 会话级选择——selectModel
  // 消息已写槽）——echo == 槽复合 ≠ per-message override（裁定④只约束真·与槽不符的单回合试运行）。
  let slotRef = null // { provider, model|null } | null —— 仅当槽渠道当前可运行（有 key）——
  // keyless 槽不参与复合（运行/播种都自愈到实际渠道——不把无 key 复合钉进会话记录）
  let slotData = null
  try {
    slotData = panel._activeData?.(turnSlot)
    if (slotData?.activeProvider && await getKey(slotData.activeProvider)) {
      slotRef = {
        provider: slotData.activeProvider,
        model: typeof slotData.activeModel === "string" && slotData.activeModel ? slotData.activeModel : null,
      }
    }
  } catch {}
  if (!providerName) {
    // provider 未显式给（digest/挂起/首回合竞态）→ 槽渠道优先（有 key），其次 config defaultModel
    if (slotRef?.provider) {
      try { if (await getKey(slotRef.provider)) providerName = slotRef.provider } catch {}
    }
    if (!providerName) {
      // 回退：config defaultModel 渠道（resolveProviders activeProvider = default 渠道/首渠道）
      try {
        const { activeProvider } = resolveProviders()
        if (activeProvider && await getKey(activeProvider)) providerName = activeProvider
      } catch {}
      if (!providerName) {
        for (const n of providerNames()) {
          try { if (await getKey(n)) { providerName = n; break } } catch {}
        }
      }
    }
  }
  // needsSetup tells the webview to re-open the welcome panel (even if the user
  // previously skipped it) — a send with no configured provider should land the
  // user on the configuration form, not just an error banner.
  if (!providerName) { panel._panel?.webview.postMessage({ type: "error", text: t("error.provider"), needsSetup: true }); return { done: true } }
  let p
  try {
    p = await buildProvider(providerName)
  } catch (e) {
    console.error("[chat-panel] buildProvider failed:", e.message)
    panel._panel?.webview.postMessage({ type: "error", text: t("error.failedProvider", { name: providerName }), needsSetup: true })
    return { done: true }
  }
  if (!p) { panel._panel?.webview.postMessage({ type: "error", text: t("error.failedProvider", { name: providerName }), needsSetup: true }); return { done: true } }
  // MODEL-MERGE-SESSION：模型/stamp 决策收敛纯函数（resolveTurnModelAndStamp——导出供单测
  // 锚——语义见函数头注释：真 override 单回合不落槽——无 override 落实际运行模型）
  const baseModel = p.model ?? null // 渠道默认解析值（defaultModel 属该渠道 → 用之；否则渠道默认单值）
  const { runModel, stampProvider, sessionStampModel } = resolveTurnModelAndStamp({ providerName, modelOverride, slotRef, baseModel })
  if (runModel && runModel !== p.model) p = { ...p, model: runModel }
  const slotStamp = { activeProvider: stampProvider, activeModel: sessionStampModel }
  // Reasoning selector → provider fields. "off" AND "none" (the effort enum's lowest
  // level, labeled "off" in the UI) are a true thinking toggle — previously "none"
  // fell into the effort branch and left thinking:enabled untouched, so the button
  // never actually disabled thinking. (Endpoints that force thinking server-side —
  // e.g. the Zhipu coding plan — will still emit reasoning regardless.)
  if (reasoning) p = { ...p, ...resolveReasoningMode(reasoning, p.model, specForModel) }
  // 回传面（契约 A-2）：providerName（可能被上方槽/config 回退改写）/ p / slotStamp / slotData。
  return { done: false, providerName, p, slotStamp, slotData }
}

/** 迁出自 `panel-chat.mjs`（本批逐字搬迁——`b.mjs` 收尾段）：回合收尾——落盘 + 标题 +
 *  忙态归位 + `loading:false`。参数化捕获变量（原 finally 体同函数作用域引用）。 */
export async function finalizeTurn(panel, { history, fullHistory, slotStamp, turnSlot, isFirstMessage, susp, skipSession }) {
  traceStop("finally: turn complete — UI released", panel._stopClickTs)
  panel._stopClickTs = null
  // §17 D-S2 释放窗口守卫（2026-09-02 偏差修复 #2——A2 + INPUT-LOCK-ASYNC 修订）：挂起
  // 决策先于任何释放点登记——归位与回合尾会话接管之间的异步段内消息不得开并发新回合
  // （从磁盘重载 lines 孤儿化池 + abort 池 controller——AC-S2）。窗口 = _turnState==="susp"
  // 且 _susp 空——A2 标题移入下方归位前（running——routeUserTurn 拒收——禁排队）——标题
  // 不再构成此窗口；会话建立与 susp 广播同同步续段（下方块）——入队容器已废弃。
  // C2（F-C2a/b——忙态归位 + 单一广播）：会话内回合（digest/会话用户回合）尾 → susp
  // （先于 loading:false 广播——webview Stop 派生在 digest 间不闪烁）；普通回合尾池仍
  // live → susp（释放窗口——同上）；无池无会话 → idle。计数随广播：会话内回合尾带
  // backgroundStatus（F-C2e——轮尾计数刷新到 host 实际；释放窗口期 webview 未入会话
  // 不显示计数段——计数由会话入口 postSuspension 随带）。
  // Persist BEFORE the title（A2 方案 Y——权威正文 SESSION.md §6.7）：标题从槽读首条
  // user 消息——ContinueError→Stop 路径（runTurnLoop break 跳过 catch 落盘）的唯一
  // 落盘就是本 save——先落盘后标题该路径才出得了标题。CLI agent-turn.mjs finally
  // parity——"Save session after every turn (survives crashes)"。
  try {
    if (fullHistory?.length) panel._saveLines(fullHistory, history, slotStamp, turnSlot)
  } catch (saveErr) {
    console.error("[chat-panel] save in finally failed:", saveErr.message)
  }
  // A2（SESSION-FLOW-A F-A2——权威正文 SESSION.md §6.7）：标题上移至此（归位前——
  // _turnState 仍 running——窗口 = busy：Stop 显 + 路由守卫拒收）；错误不外抛——
  // 归位恒执行（评审 #2）。
  try {
    if (isFirstMessage) await panel._generateTitle(turnSlot)
  } catch (e) {
    console.error("[chat-panel] title generation threw:", e?.message ?? e)
  }
  if (!skipSession && !susp && !panel._susp && panel._panel && poolLive(history)) {
    panel._publishTurnState("susp")
  } else if (susp || panel._susp) {
    panel._publishTurnState("susp", backgroundStatus(history))
  } else {
    panel._publishTurnState("idle")
  }
  panel._refreshStatus()
  panel._panel?.webview.postMessage({ type: "loading", loading: false })
}

/** 迁出自 `panel-chat.mjs`（本批逐字搬迁——段 B）：挂起会话接管（释放窗口判定 + 会话入口）。
 *  契约 B-1：入参面含 `distillSlot`（finally 段清单无此项——本段读）；B-2：`runTurn` 闭包原
 *  直调 `runPanelChat` ⇒ 改注入项 `deps.runChat`（本档零 import 主档）。 */
export async function enterSuspensionTurn(panel, { turnSlot, distillSlot, history, fullHistory, skipSession, susp, runChat }) {
  // §17 D-S2 释放窗口接管（偏差修复 #2——A2 修订 + INPUT-LOCK-ASYNC 2026-09-09）：标题
  // 已移 finally 归位前（running——routeUserTurn 拒收）——入队容器已随排队机制废弃——释放
  // 窗口 = 会话建立的同一同步续段（susp 广播与 suspensionSession 间零 await——无事件窗
  // 口）；本块只做会话入口判定：池 live + controller 未中止 → 进挂起会话（用户输入优先于
  // digest——D-S5）；否则忙态归位 idle（防 susp 悬空——Stop 派生/路由守卫以 idle 收敛）。
  if (!skipSession && !susp && !panel._susp && panel._turnState === "susp") {
    const enter = !skipSession && !susp && !panel._susp && panel._panel
      && poolLive(history) && !panel._abortController?.signal.aborted
    if (enter) {
      const cwd = _cwd() || process.cwd()
      const runTurn = async ({ text: tText, modelOverride: tModel, reasoning: tReasoning, providerName: tProvider, images: tImages, autoTurn: tAuto, upstreamTurn: tUp }) => {
        await runChat(panel, { text: tText, modelOverride: tModel, reasoning: tReasoning, providerName: tProvider, images: tImages, autoTurn: tAuto === true, upstreamTurn: tUp === true, susp: panel._susp, skipSession: true })
      }
      await suspensionSession(panel, {
        turnSlot, distillSlot,
        // lines 双键形：driver 用 lines.history/lines.fullHistory；会话内回合（runPanelChat
        // susp 路径）按 activeLines 契约读 loadedLines.contextHistory——缺键会让 in-session
        // 回合的 history=undefined（onComplete 落盘崩 + run-start pending 注入不消费 →
        // digest 死循环；T-S18 全路径回归实证，2026-09-02 偏差修复轮补正）。
        lines: { history, fullHistory, contextHistory: history },
        // D3 (2026-09-08): 不再把入场 engState 快照传入挂起会话——会话内回合每轮从槽新读
        //（settle 落盘后 digest 可见）。suspension.mjs 不再存 susp.engState。
        cwd,
        runTurn,
      })
      // 会话自然退出（驱动 finally）已把忙态置 idle——无额外处理。
    } else {
      // 无会话（池已死 / 已中止）——释放窗口关闭：忙态回 idle（防 susp 悬空）。
      panel._publishTurnState("idle")
    }
  }
}
