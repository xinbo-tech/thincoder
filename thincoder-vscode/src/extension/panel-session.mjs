/**
 * panel-session.mjs — ChatPanel session persistence + history paging (split out of
 * chat-panel.mjs). Every function takes the ChatPanel instance as `panel` and
 * mutates panel._slot / panel._autoApprove exactly like the former methods did.
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：会话机制面**单源 = 核会话面**——本档的
 * 槽读写 / 列表 / 标题 / 恢复 / 双线瘦身调用全部经端壳（`session-io.mjs` → 核
 * `@thincoder/core/session.mjs` 族）转口，本档只承载**面板装配面**（槽绑定 / 消息族 /
 * 双线组装 / webview 分页），不持有会话存储算法。存储契约 version 1/2 不变。
 * 四档结构拆分批（2026-09-18 · VSC-DEBT §12.2.4）：**写面两件**（`saveLines` / `generateTitle`）
 * 迁出至 `panel-session-write.mjs`——本档按既有导出名转口（消费档 import 面零改）。本档留档 =
 * 读面 + 会话操作面（14 名）。
 */
import { loadSlot, cachedSlot, newSlot, deleteSlotAndUpdate, loadModelPrefs as loadStoredModelPrefs, historyWindow, listSlots, stripTruncatedToolArgs, resumeSlot, readEndMarker } from "./session-io.mjs"
import { ensureMemoryHandle } from "../embed-config.mjs"
import { fullStatus, lastModelsPayload } from "./settings.mjs"
import { migrateLegacySettings } from "./migrate-settings.mjs"
import { stripEditorInjection } from "./editor-context.mjs"
import { stripAtRefs } from "./file-refs.mjs" // F-W15：@ 引用还原（与产者同档）——恢复面显示消费面（标题源剥离面随写面迁至 panel-session-write.mjs）
import { mergeAdjacentAssistantEchoes } from "@thincoder/core/context.mjs"
import { _cwd } from "./panel-messages.mjs"
// 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：⑤⑥ + 派生面（leaf——无环）
import { hasWorkspaceFolder, pushWorkspaceGuard } from "./workspace-guard.mjs"
// 2026-09-11 第 10 批（§5.1.4 第 4 条——清屏后再断言）：存活投影（读 lines.history 双池）
import { reassertLiveChildren } from "./suspension.mjs"
// F-MI7：同伴快照预热（SWR 写面——慢段预热，读面零 exec）
import { prewarmPeerInstances } from "./peer-instances.mjs"
import * as vscode from "vscode"

// ─── 写面转口（四档拆分批 2026-09-18 · VSC-DEBT §12.2.4）：既有导出名零改 ──────────────
// `saveLines`（槽写装配面）/ `generateTitle`（标题写面）已迁出至 `panel-session-write.mjs`
// ——消费档 import 行逐字不变（KD-12）；环 import（本档 ⇄ 新档）判据见新档头注。
export { saveLines, generateTitle } from "./panel-session-write.mjs"

// ─── 槽绑定（F-MI7 · MULTI-INSTANCE-COLLAB §3.1 · SESSION.md §6.15）─────────────

/** cwd → 在飞认领束（单飞：同 cwd 并发认领不双探；成功/失败即清）。 */
const bindInflight = new Map()

/** 认领一次（async 真路径）：`resumeSlot` 决策（本端记录 / 一次性继承 / 全新分配——
 *  SESSION.md §6.10 D-2）+ 单飞 + 绑定 `panel._slot`。绑定入口三处同源（快段
 *  `openSessionContent` / `onProjectChanged` / 冷路径 `ensureSlot`）；已绑定 ⇒ 直返
 *  （slot 粘性——不再重读共享 manifest 的 active 指针）。失败 ⇒ 抛出（`void` 冷路径自吞）。 */
export async function ensureSlotAsync(panel) {
    // ⑥ 无工作区守卫（认领原语——冷路径 / `ensureSlot` 后台认领同址）：不认领不写 ⇒ 不落
    // session 槽（派生态：`panel._slot` 恒 null ⇒ 槽写面 `setSlot*` 天然返 false）。
    if (!hasWorkspaceFolder()) return null
    if (panel._slot != null) return panel._slot
    const cwd = _cwd()
    let p = bindInflight.get(cwd)
    if (!p) {
      p = resumeSlot(cwd)
      bindInflight.set(cwd, p)
      p.catch(() => {}).finally(() => { if (bindInflight.get(cwd) === p) bindInflight.delete(cwd) })
    }
    const r = await p
    if (panel._slot == null && r?.slot != null) panel._slot = r.slot
    return panel._slot
  }

/**
 * The slot number this panel is bound to. **零探测冷路径**（SESSION.md §6.15 · F-MI7）：
 * 已绑定 ⇒ 直返；未绑定 ⇒ 读本进程解析缓存（`session-io.cachedSlot`——纯内存零 IO）；
 * 仍旧未命中 ⇒ 返 **null** + 后台收敛（同步读面绝不等 exec——N-MI2）。写面遇 null 的
 * 处置见各调用点（`panel-chat` 回合入口 `?? await ensureSlotAsync` / `saveLines` 短路 /
 * `panel-messages` 空槽短路 / `setSlot*` 天然返回 false——不写 `.null` 槽）。
 */
export function ensureSlot(panel) {
    // ⑥-b 无工作区守卫（冷路径同源）：守卫态恒返 null——不读解析缓存重绑旧槽。转空后缓存
    // 可能仍持「刚关闭的根」条目（同进程内该 cwd 曾被认领过）⇒ 不挡会破坏派生面不变量
    // 「守卫态 `_slot` 恒 null」（槽写面随之重新可达）。
    if (!hasWorkspaceFolder()) return null
    if (panel._slot == null) {
      const s = cachedSlot(_cwd())
      if (s != null) panel._slot = s
      else void ensureSlotAsync(panel).catch((e) => console.error("[chat-panel] background slot bind failed:", e.message))
    }
    return panel._slot
  }

  /** Current session's slot data (full session object) or null. Uses the bound slot. */
export function activeData(panel, slotOverride) {
    return loadSlot(_cwd(), slotOverride ?? ensureSlot(panel))
  }

  /** Human line (history) of the active session. */
export function activeHistory(panel) {
    return activeData(panel)?.history ?? []
  }

  /** Load both persisted lines for the active session: human (history) + machine (contextHistory). */
export function activeLines(panel, slotOverride) {
    const data = activeData(panel, slotOverride)
    const history = data?.history ?? []
    // 2026-09-01 会诊 deepseek/kimi/qwen 🟡：机读线判定与 CLI 对齐——`length > 0` 才当
    // 机读线（`contextHistory: []` 是"无机读线"而非空机器线——空机器线会静默丢全部
    // 上下文）；回退播种剥离截断 tool args（CLI F6 镜像）——旧文件恢复后把 `…` 半截
    // arguments 原样发向网关会 400（unexpected end of hex escape）。
    const ch = data?.contextHistory
    // D-CC19 恢复面回声归并（CONTEXT-COMPACTION §6.10 #8）：已落盘机读线原样装回会复活
    // D-CC18 病态形态（无 reasoning_content 的 assistant 紧邻 assistant ⇒ 首请求 400）——
    // contextHistory 定线后、返回前扫描归并（干净输入返回同一引用——零拷贝零回归）。
    const contextHistory = (Array.isArray(ch) && ch.length > 0) ? mergeAdjacentAssistantEchoes(ch) : history.map(stripTruncatedToolArgs)
    return { fullHistory: history, contextHistory, sessionStart: data?.sessionStart ?? null }
  }

export function loadModelPrefs(panel) {
    return loadStoredModelPrefs(panel._context.workspaceState)
  }

export function loadSession(panel) {
    // 销毁点（2026-09-08）：会话切换/新建/删除/项目切换/面板打开的
    // 会话级 agent 销毁置 null（AC4——内存态不跨 session 复用；槽文件仍权威——下回合经
    // ensurePanelAgent → runAgent factory 重建 + 槽字段回填）。六销毁点在此汇合
    // （newSession/deleteSession/switchSession/onProjectChanged/openSessionContent 全走
    // loadSession——B2 2026-09-09：status 快慢段拆后快段 openSessionContent 接替其 loadSession
    // 调用；status 慢段不再经此）。
    // 会话操作类上游（newSession/deleteSession/switchSession/onProjectChanged）带
    // turnBusy()/susp 守卫（C2：谓词合一）；openSessionContent 由 webviewReady 冷启握手
    // 引导（槽绑定顺延 resolve→webviewReady——正常 UI 流 view 打开时无活回合；忙态冷启
    // 仅 dev reload/webview 崩溃重载可达——销毁安全面不变）。
    panel._agent = null
    // 心跳源新鲜度（D-W24——2026-09-19）：会话切换 / 新建点置空 `_liveLines`（newSession /
    // switchSession / deleteSession / onProjectChanged / openSessionContent 五路汇合于本函数）
    // ⇒ 心跳 / 再断言回落 `panel._susp?.lines`，不把旧会话池块每 2 s 投进新面板。
    panel._liveLines = null
    // Session switch (webview newSession/loadSession/deleteSession, project switch, panel open):
    // abort any in-flight async distillation from the previous turn — its history arrays belong
    // to the OLD session (SEND-STALL-DISTILL review #1; onDistilled's slot check is defense in
    // depth). The next turn lazily creates a fresh controller.
    panel._distillController?.abort()
    const history = activeHistory(panel)
    // AUTO state is session-level (CLI parity) — sync the panel flag and the webview
    // toolbar button to the slot's autoApprove field on every session load/switch.
    panel._autoApprove = activeData(panel)?.autoApprove ?? false
    panel._panel?.webview.postMessage({ type: "autoApprove", value: panel._autoApprove })
    // Plan mode is also session-level — sync the toolbar button + status badge on load/switch.
    // ENG-PLAN-EXCLUSION（FR31 ③ / T13）：装载推送读**生效值**——工程真值（槽权威面，同
    // `_setPlanMode` 的 `_engineeringOn()`）下计划位恒 false：槽内残留 planMode:true 不再
    // 推回面板（半状态复活面收口）。
    panel._panel?.webview.postMessage({ type: "planMode", active: panel._engineeringOn?.() !== true && (activeData(panel)?.planMode ?? false) })
    panel._panel?.webview.postMessage({ type: "clearMessages" })
    // Lazy history: only the LAST page is sent on load; older pages arrive via
    // loadOlder (webview scroll-back). idx values are global history indexes.
    const { messages, hasOlder } = historyWindow(history, null)
    sendHistoryPage(panel, messages, hasOlder, false)
    // 2026-09-11 第 10 批（§5.1.4 第 4 条）：clearMessages（:155）与 historyPage
    // （sendHistoryPage 内部投递）**之后同 tick** 再断言存活任务——期望位置 = 流尾
    // （与 §5「出生即流尾」同规——显式定序，不依赖 history 锚插的隐含行为）。
    reassertLiveChildren(panel)
    pushSessions(panel)
    // MODEL-MERGE-SESSION：切/开会话 → 下拉同步本会话复合（F-4 恢复 UI 面——复用既有
    // "models" 消息——prefs 载具带槽复合；webview 按 prefs 选行 + selectModel 回写同值——
    // 无缓存列表不发（防空表清下拉））；新会话（无复合）不发——沿用当前（F-7）
    try {
      const data = activeData(panel)
      const payload = lastModelsPayload()
      if (data?.activeProvider && data.activeModel && payload.length) {
        panel._panel?.webview.postMessage({
          type: "models",
          models: payload,
          prefs: { ...loadStoredModelPrefs(panel._context.workspaceState), model: data.activeModel, provider: data.activeProvider },
        })
      }
    } catch { /* 槽不可读 → 下拉保持现状 */ }
  }

  /** Older-history page for the webview's scroll-back lazy loading. */
export function loadOlder(panel, before) {
    const history = activeHistory(panel)
    const { messages, hasOlder } = historyWindow(history, typeof before === "number" ? before : null)
    sendHistoryPage(panel, messages, hasOlder, true)
  }

export function sendHistoryPage(panel, messages, hasOlder, older) {
    // Machine-only editor-context injections must never surface in the UI (parity
    // with the per-message strip in the old eager loader).
    // F-W15（D-W17）：再还原 `@` 引用——恢复面 ≡ 活面（先剔机器注入、再还原 @ 引用——同点同序）。
    const clean = messages.map((m) => {
      if (m.kind === "user") return { ...m, text: stripAtRefs(stripEditorInjection(m.text)) }
      if (m.kind === "tool") return typeof m.text === "string" ? { ...m, text: m.text.slice(0, 64 * 1024) } : m
      // SESSION-RESTORE-PARITY（B）：tool 结果随 assistant 帧 tools[] 嵌套下发——
      // 清洗适配嵌套字段（transport 64K 截断——防未 slim 老文件超大结果进 webview）；
      // X5（显示面消差批）：切片点**同置事实旗标**（恢复卡据此出截断提示——旗标驱动与活卡同形）。
      if (m.kind === "assistant" && Array.isArray(m.tools) && m.tools.some((t) => typeof t.result === "string" && t.result.length > 64 * 1024)) {
        return { ...m, tools: m.tools.map((t) => typeof t.result === "string" && t.result.length > 64 * 1024 ? { ...t, result: t.result.slice(0, 64 * 1024), resultTruncated: true } : t) }
      }
      return m
    })
    panel._panel?.webview.postMessage({ type: "historyPage", messages: clean, hasOlder, older })
  }

export async function newSession(panel) {
    // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止新建——与 applyProjectSwitch
    // 同模式（turnBusy() → warning → return）。运行中放行会让旧 turn 的 stream/complete
    // 灌进新会话视图、内容落错槽。
    if (panel.turnBusy()) {
      vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before creating a new session.")
      return
    }
    // Allocate a fresh slot, bind this panel to it, then load its (empty) content.
    // F-MI7：`newSlot` = async（核同名件同形）——认领束 awaited 再绑（本函数已 async）。
    panel._slot = await newSlot(_cwd())
    loadSession(panel)
  }

export async function deleteSession(panel, slot) {
    // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止删除——运行 turn 可能正写
    // 该槽（saveLines turnSlot 绑定），删除会产生半写/误删。
    if (panel.turnBusy()) {
      vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before deleting a session.")
      return
    }
    if (typeof slot !== "number" || slot < 1) return
    const slots = listSlots(_cwd())
    if (slots.length <= 1) return  // Keep at least one session
    deleteSlotAndUpdate(_cwd(), slot)
    // 删本端绑定槽 ⇒ 面板解绑；重解析走 ensureSlot 冷路径（记录/缓存已由
    // deleteSlotAndUpdate 收敛——记录显式置空 + 解析缓存清空），下一次认领由 resumeSlot 另择**新号**。
    // 不收养幸存 active（2026-09-01 旧行为）：那可能是**另一活进程的槽**——重绑 = 面板
    // `_slot` 钉到别人槽上 + 写其本端记录（P3/P4 违约；SESSION.md §6.15）。
    if (slot === panel._slot) panel._slot = null
    loadSession(panel)
  }

export function pushSessions(panel) {
    // 派生面（同判据）：守卫态不把安装目录家族的会话列表推给面板——否则会话行可点 ⇒ 绕过 ⑦
    if (!hasWorkspaceFolder()) return
    const cwd = _cwd()
    const listed = listSlots(cwd)
    // 2026-09-05 §6.10 D-5：会话列表本端高亮按端记录（● = 记录槽 ∈ 列表 ? 记录槽 :
    // manifest active 回退——含"记录槽已被对端删除"的守卫）；listSlots 的 manifest
    // active 语义不变（跨端回退高亮 + 旧版/ACP）
    const rec = readEndMarker(cwd)
    const highlight = (rec?.slot != null && listed.some((s) => s.slot === rec.slot))
      ? rec.slot
      : (listed.find((s) => s.isActive)?.slot ?? null)
    // Same label fallback chain as CLI /session: title → firstMessage quote → "(empty)"
    const truncate = (s, n) => s.length <= n ? s : s.slice(0, n - 1) + "…"
    const sessions = listed.map((s) => ({
      slot: s.slot,
      title: s.title || (s.firstMessage ? `"${truncate(s.firstMessage, 40)}"` : "(empty)"),
      count: s.messageCount,
      updated: s.updatedAt,
      provider: s.activeProvider ?? null,
      active: s.slot === highlight,
    }))
    // active = 绑定槽号；零探测冷路径可返 null（F-MI7）= 无高亮行（webview 容 null ✓）
    panel._panel?.webview.postMessage({ type: "sessions", sessions, active: ensureSlot(panel) })
  }

/**
 * B2（SESSION-FLOW-B F-B2a/F-B2b——2026-09-09）：会话打开**单向 boot 快段**——只在
 * webviewReady 握手后运行（panel-messages.mjs webviewReady case 调用）。原 status()
 * 头部快段（评审 #3 计数校正：resumeSlot 绑槽 + _pushProject + pushSessions 单发 +
 * loadSession——四调用）提为导出；resolve 期 webview 尚未加载——此刻发内容即丢（Reload
 * 后对话区空缺陷的静态根因——F-B2b 修）。
 * F-B2c sessions 合并：独立 pushSessions 不再单发（同 tick 双发消除）——loadSession 尾
 * 内部发送保留（既有调用方依赖）——sessions 恰一次（N2）；异步第三发（fullStatus cb——
 * status() 慢段内）保留不同 tick。
 * 槽绑定时机随之上移（resolve → webviewReady）——webviewReady 前无 slot 读者（安全）。
 */
export async function openSessionContent(panel) {
    // ⑤ 无工作区守卫：跳过认领 + 会话装载（零写），推守卫态——主动提示归 ① / 转空向（本点不重复提示）。
    if (!hasWorkspaceFolder()) { pushWorkspaceGuard(panel, true); return }
    pushWorkspaceGuard(panel, false)
    // 2026-09-05 §6.10 D-2：恢复决策 resumeSlot（本端记录/一次性继承/全新分配——与
    // ensureSlot/onProjectChanged 同点）；全新目录下 claim 先行——文件在首保存时落盘。
    // F-MI7：认领 = async 束（`ensureSlotAsync` 单飞 + 粘性直返）——本函数 = 三个绑定入口
    // 的快段，awaited（loadSession 内容随认领完成落定——B2 单向 boot 序不变）。
    await ensureSlotAsync(panel)
    panel._pushProject()
    loadSession(panel)
}

export async function status(panel) {
    // B2（SESSION-FLOW-B F-B2a——快慢段拆）：本函数 = 慢段（探测/设置/索引——原
    // status() 的 :266-273 尾段）——resolveWebviewView 期只起本段（探测与 webview 加载
    // 重叠并行）；快段 openSessionContent 移入 webviewReady——resolve 期不得双跑快段
    // （内容双发/槽重绑）。慢段头部 pushStatus（fullStatus 内）可能丢——webviewReady
    // _pushStatus 兜底已有（幂等）。
    // One-time migration of legacy key stores (SecretStorage + thincoder.providers settings)
    // into the shared ~/.thincoder/config.json. Flag-guarded, safe to call on every open.
    await migrateLegacySettings(panel._context)
    // MODEL-MERGE-SESSION：models push prefs = 会话槽复合优先（有槽复合即本会话模型——
    // F-4 下拉随会话；无复合 = 新会话 → workspaceState 兜底——F-7 沿用当前）。慢段绝不绑槽
    // （AC-B2c——resumeSlot 只在快段 openSessionContent）——只读已绑槽
    let prefsOverride = null
    try {
      if (panel._slot != null) {
        const data = loadSlot(_cwd(), panel._slot)
        if (data?.activeProvider && data.activeModel) {
          prefsOverride = { ...loadStoredModelPrefs(panel._context.workspaceState), model: data.activeModel, provider: data.activeProvider }
        }
      }
    } catch { /* 槽不可读 → workspaceState 兜底 */ }
    await fullStatus(panel._panel, panel._context.workspaceState, () => pushSessions(panel), prefsOverride)
    panel._pushMcpStatus()
    const prefs = loadModelPrefs(panel)
    if (prefs.model && panel._statusBar) panel._statusBar.text = `$(hubot) ${prefs.model}`

    // W8：核记忆面就绪（句柄创建——面板打开即建；设置/索引读数与构建入口不落空）
    await ensureMemoryHandle()
    // W8 旧目录清退：告示一次（用户动作 = 唯一删除路径——零自动删除）
    void panel._maybePromptLegacyIndexRemoval()
    // Auto-check: prompt to build vector index if available but missing
    panel._maybePromptIndex()
    // F-MI7：同伴快照预热（SWR 写面）——本段 = 面板打开慢段（resolve 期只起本段）；**不绑槽**
    // （AC-B2c 零回退——只热 `peerInstances` 快照，面板 `_slot` 保持 null ⇒ ⑪b/⑫ 断言不变）；
    // 首个回合 `pushPeerReminder` 同步读命中快照、零 exec（N-MI3）。探测失败内部吞（降级 []）。
    prewarmPeerInstances(_cwd())
  }
