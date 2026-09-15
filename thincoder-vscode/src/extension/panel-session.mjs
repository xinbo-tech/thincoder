/**
 * panel-session.mjs — ChatPanel session persistence + history paging (split out of
 * chat-panel.mjs). Every function takes the ChatPanel instance as `panel` and
 * mutates panel._slot / panel._autoApprove exactly like the former methods did.
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：会话机制面**单源 = 核会话面**——本档的
 * 槽读写 / 列表 / 标题 / 恢复 / 双线瘦身调用全部经端壳（`session-io.mjs` → 核
 * `@thincoder/core/session.mjs` 族）转口，本档只承载**面板装配面**（槽绑定 / 消息族 /
 * 双线组装 / webview 分页），不持有会话存储算法。存储契约 version 1/2 不变。
 */
import { loadSlot, saveSessionToSlot, newSlot, deleteSlotAndUpdate, setSlotTitle, loadModelPrefs as loadStoredModelPrefs, historyWindow, listSlots, slimForDisplay, isLegacyTransient, stripTruncatedToolArgs, resumeSlot, readEndMarker, writeEndMarker } from "./session-io.mjs"
import { ensureMemoryHandle } from "../embed-config.mjs"
import { engTokensMergeForSave } from "./session-slot-write.mjs"
import { fullStatus, lastModelsPayload } from "./settings.mjs"
import { migrateLegacySettings } from "./migrate-settings.mjs"
import { stripEditorInjection } from "./editor-context.mjs"
import { generateTitle as generateSessionTitle } from "./generate-title.mjs"
import { _cwd } from "./panel-messages.mjs"
// 2026-09-11 第 10 批（§5.1.4 第 4 条——清屏后再断言）：存活投影（读 lines.history 双池）
import { reassertLiveChildren } from "./suspension.mjs"
import * as vscode from "vscode"

  /**
   * The slot number this panel is bound to. On first use, resolve it once via the
   * end-marker resume decision (SESSION.md §10 D-2 — 本端记录/一次性继承/全新分配，
   * 与 CLI TUI 启动同构), then keep it fixed for the panel's life.
   */
export function ensureSlot(panel) {
    if (panel._slot == null) {
      const cwd = _cwd()
      panel._slot = resumeSlot(cwd).slot
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
    const contextHistory = (Array.isArray(ch) && ch.length > 0) ? ch : history.map(stripTruncatedToolArgs)
    return { fullHistory: history, contextHistory, sessionStart: data?.sessionStart ?? null }
  }

  /** Persist both lines to the active slot + update manifest metadata.
 *  `slotOverride`（会话切换竞态修复，2026-08-28）: 保存目标显式绑定 turn 启动时的 slot——
 *  缺省回退 ensureSlot(panel)（当前活跃）。此前每次取当前 slot，运行中切换会话后
 *  onComplete/abort 的保存会把 A 会话整轮内容写进 B 槽（GitHub #2 "输出写错会话文件"）。 */
export function saveLines(panel, fullHistory, contextHistory, extra = {}, slotOverride) {
    const cwd = _cwd()
    const slot = slotOverride ?? ensureSlot(panel)
    const existing = loadSlot(cwd, slot) ?? {}
    // Field-roundtrip contract (CLI docs/design/ARCHITECTURE.md): slot files are full-overwrite
    // writes, so any field we drop here is lost permanently. Spread ...existing so fields the
    // extension doesn't know about (activeModel, engineering, engDesignToken, ...) round-trip
    // intact, then override only what the extension actually owns.
    // Human line drops transient machine-only injections (editor context, time reminder);
    // the MACHINE line keeps them — reloading the slot must rebuild a byte-identical
    // machine line or provider prefix caches miss (CLI parity, 2026-08-16 cache-hit fix).
    const keepReal = (m) => !m.transient && !isLegacyTransient(m)
    const keepMachine = (m) => !isLegacyTransient(m)
    // advisor.guard is session-level (2026-08-29): agentState carries the LIVE guard off the
    // run's agent config, merged over the existing advisor object (provider/model/thinking are
    // config-scoped but round-trip through the slot untouched; a legacy null upgrades to an
    // object). When the run didn't speak (abort/finally saves carry no agentState), the field
    // is preserved verbatim — a session that never expressed a guard preference keeps `null`
    // and reads keep falling back to config.json.
    const existingAdvisor = typeof existing.advisor === "object" && existing.advisor !== null ? existing.advisor : {}
    const advisorOut = extra.advisorGuard !== undefined ? { ...existingAdvisor, guard: extra.advisorGuard } : (existing.advisor ?? null)
    saveSessionToSlot(cwd, slot, {
      ...existing,
      version: 2, cwd, updatedAt: Date.now(),
      title: existing.title ?? "",
      activeProvider: extra.activeProvider ?? existing.activeProvider ?? "",
      // Human line is slimmed for storage (CLI parity — session-io.slimForDisplay):
      // the never-compacted human line carried the bulk of session-file size
      // (tool args JSON / full tool results / base64 images); the machine line
      // below keeps everything byte-identical for the provider.
      history: fullHistory.filter(keepReal).map(slimForDisplay), contextHistory: contextHistory.filter(keepMachine),
      // display (the CLI's old WYSIWYG render snapshot) is DEPRECATED — the CLI no
      // longer reads or writes it (restore always rebuilds from history, lazily).
      // Clear it defensively so OLD CLI builds still fall back to history instead
      // of resuming from a stale snapshot missing every VS Code-added message.
      display: [], tasks: extra.tasks ?? existing.tasks ?? [],
      planMode: existing.planMode ?? false,
      // §11.7（2026-09-08）：tasks/goal/pendingReminders 会话级三字段随 agentState 回写槽
      // （onComplete {...agentState} spread 携入——CLI saveSession session.mjs:131/137 同款）。
      // 键缺席（undefined——abort/finally 保存只带 activeProvider）→ 保留槽值；键在场（干净
      // 完成回合）→ 内存即权威（空态 []/null 如实写——含 goal 工具完成/取消的显式清空）。
      goal: extra.goal !== undefined ? extra.goal : (existing.goal ?? null),
      autoApprove: existing.autoApprove ?? false,
      advisor: advisorOut,
      // Engineering state persisted by runAgent (agentState): design token survives turns;
      // the engineering flag is slot-authoritative (2026-08-29) — config.json is the mirror.
      // `!== undefined` (not ??): a legacy slot with NO engineering field must stay field-less
      // when the run didn't speak (abort/finally saves) — hard-writing `false` here would pin
      // the session off and kill the config.json fallback (compat contract, see tests).
      engineering: extra.engineering !== undefined ? extra.engineering : existing.engineering,
      // DESIGN-TOKEN-SETTLEMENT D2/D5 (2026-09-08): 单值镜像字段 engDesignToken 已退役——
      // agentState 不再携带（agentState 去镜像），此处不再写该字段（旧槽残留经 ...existing
      // spread 原样往返保留，仅供 setup 一次性迁移读——AC3 运行时零镜像写）。
      // 多槽表 engDesignTokens 合并语义 = D2（engTokensMergeForSave 纯函数）：空态 agentState
      // 保存**不触发清理**。内存空但槽有值（settle 已同步落盘而本回合内存未持有）→ 保留槽值，
      // 不钉 null（AC2）。槽清理只经三触发（consume-design 显式清 /new 空槽 /TTL 过期清）。
      engDesignTokens: engTokensMergeForSave("engDesignTokens" in extra ? extra.engDesignTokens : undefined, existing.engDesignTokens),
      pendingReminders: extra.pendingReminders !== undefined ? extra.pendingReminders : (existing.pendingReminders ?? []), sessionStart: existing.sessionStart ?? new Date().toISOString(),
      // 2026-09-01 会诊 kimi/qwen 🔴：sessionStart 是 F2 覆盖防护的会话身份——VS Code
      // 此前从不赋值（恒 null）→ diskStart 恒 null → F2 轮转条件永不触发（纯 VS Code
      // 会话无覆盖防护）；更糟：CLI 加载 VS Code 槽时 setup 的 `??=` 打上 CLI 自己的
      // start → 跨端保存必轮转对方现场（F2 自伤，"先占者赢"）。现在 null 时赋一次
      // （与 CLI agent/setup.mjs `_sessionStart ??=` 同语义——同会话两端打点一致，F2 放行）。
      // F-2d (MODEL-400-FIX mirror——CLI applySession `||` 语义)：`??` 不兜空串——extra 带
      // activeModel="" 会把空串钉进槽（双字段恒非空语义下空串 = 无 override）→ 下游克隆缺
      // model 键 → 无 model 请求 → serde 400。`||` 视空串为缺失——回退 existing（槽 model
      // 恒有值/恒缺失——与 CLI F-2d 同防御方向；null/undefined 保留槽值语义不变）；legacy
      // "" 残留槽值在下次保存时归一 null（读侧 slotRef 组装本就 truthy-guard 空串）。
      activeModel: extra.activeModel || existing.activeModel || null,
    })
  }

export function loadModelPrefs(panel) {
    return loadStoredModelPrefs(panel._context.workspaceState)
  }

export function loadSession(panel) {
    // §11 销毁点（AGENT-LOOP.md §11——2026-09-08）：会话切换/新建/删除/项目切换/面板打开的
    // 会话级 agent 销毁置 null（AC4——内存态不跨 session 复用；槽文件仍权威——下回合经
    // ensurePanelAgent → runAgent factory 重建 + §11.2.1 槽字段回填）。六销毁点在此汇合
    // （newSession/deleteSession/switchSession/onProjectChanged/openSessionContent 全走
    // loadSession——B2 2026-09-09：status 快慢段拆后快段 openSessionContent 接替其 loadSession
    // 调用；status 慢段不再经此）。
    // 会话操作类上游（newSession/deleteSession/switchSession/onProjectChanged）带
    // turnBusy()/susp 守卫（C2：谓词合一）；openSessionContent 由 webviewReady 冷启握手
    // 引导（槽绑定顺延 resolve→webviewReady——正常 UI 流 view 打开时无活回合；忙态冷启
    // 仅 dev reload/webview 崩溃重载可达——销毁安全面不变）。
    panel._agent = null
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
    panel._panel?.webview.postMessage({ type: "planMode", active: activeData(panel)?.planMode ?? false })
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
    const clean = messages.map((m) => {
      if (m.kind === "user") return { ...m, text: stripEditorInjection(m.text) }
      if (m.kind === "tool") return typeof m.text === "string" ? { ...m, text: m.text.slice(0, 64 * 1024) } : m
      // SESSION-RESTORE-PARITY（B）：tool 结果随 assistant 帧 tools[] 嵌套下发——
      // 清洗适配嵌套字段（transport 64K 截断——防未 slim 老文件超大结果进 webview）
      if (m.kind === "assistant" && Array.isArray(m.tools) && m.tools.some((t) => typeof t.result === "string" && t.result.length > 64 * 1024)) {
        return { ...m, tools: m.tools.map((t) => typeof t.result === "string" && t.result.length > 64 * 1024 ? { ...t, result: t.result.slice(0, 64 * 1024) } : t) }
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
    panel._slot = newSlot(_cwd())
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
    const newActive = deleteSlotAndUpdate(_cwd(), slot)
    // If we deleted the slot this panel was bound to, rebind to the survivor.
    // 2026-09-01 CLI 同步：deleteSlotAndUpdate 置空 active（不替面板选"最小剩余号"——
    // 可能指向另一活进程的槽）；_slot = null → 下次保存经 ensureSlot 重新认领。
    if (slot === panel._slot) {
      panel._slot = newActive
      // 2026-09-05 §10（review 🟡#1）：删本端记录槽后若面板立即重绑幸存槽继续使用——
      // 重绑 = 一个"落点"：写本端记录 = 幸存槽（与 ACP"删后 newSession 重钉"、switchToSlot
      // "打开历史会话写 marker"同语义——marker = 端内最后使用槽位 D-1/D-8）；newActive 为
      // null 时保持置空（F4），下次 ensureSlot 经 resumeSlot 认领新槽并写记录。
      if (newActive != null) writeEndMarker(_cwd(), newActive)
    }
    loadSession(panel)
  }

export async function generateTitle(panel, slotOverride) {
    try {
      const cwd = _cwd()
      // slotOverride（会话切换竞态修复，2026-08-28）：turn 启动时捕获的槽——标题属于产生
      // 首条消息的那个会话，切走后不得给新会话改名。
      const slot = slotOverride ?? ensureSlot(panel)
      const data = loadSlot(cwd, slot)
      if (!data || data.title) return  // Already titled
      const firstUser = (data.history ?? []).find((m) => (m.type ?? m.role) === "user")
      if (!firstUser) return
      // Provider comes from persisted session data (written by _saveLines on each turn),
      // not the message (runAgent never stamps provider/model onto history entries).
      const title = await generateSessionTitle(firstUser.content, data.activeProvider || undefined)
      if (title) {
        const r = setSlotTitle(cwd, slot, title)
        if (r.ok) pushSessions(panel)
        else console.error(`[chat-panel] setSlotTitle failed (${r.reason})`) // §12 F3：自动标题写失败不再静默
      }
    } catch (e) {
      console.error("[chat-panel] generateTitle failed:", e.message)
    }
  }

export function pushSessions(panel) {
    const cwd = _cwd()
    const listed = listSlots(cwd)
    // 2026-09-05 §10 D-5：会话列表本端高亮按端记录（● = 记录槽 ∈ 列表 ? 记录槽 :
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
export function openSessionContent(panel) {
    const cwd = _cwd()
    // 2026-09-05 §10 D-2：恢复决策 resumeSlot（本端记录/一次性继承/全新分配——与
    // ensureSlot/onProjectChanged 同点）；全新目录下 claim 先行——文件在首保存时落盘
    panel._slot = resumeSlot(cwd).slot
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
  }
