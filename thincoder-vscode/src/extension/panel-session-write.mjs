/**
 * panel-session-write.mjs — 会话写面（自 `panel-session.mjs` 拆出——VSC 四档结构拆分批
 * 2026-09-18 · 设计 `docs/vsc/design/VSC-DEBT.md` §12.2.4）。
 *
 * 迁出段（逐字搬迁 · 既有注释一并随迁）：槽写装配面 `saveLines`（双线落盘装配 + 字段往返
 * 契约）· 标题写面 `generateTitle`。
 * 留主档（`panel-session.mjs`）= 读面 + 会话操作面：`ensureSlot` / `ensureSlotAsync` / `activeData` /
 * `activeHistory` / `activeLines` / `loadModelPrefs` / `loadSession` / `loadOlder` /
 * `sendHistoryPage` / `newSession` / `deleteSession` / `pushSessions` / `openSessionContent` /
 * `status`。
 *
 * 缝保持（KD-12）：`panel-session.mjs` 按**既有导出名** re-export 本档两件 ⇒ 消费档 import
 * 面零改（`chat-panel.mjs:20` 静态 · `agent-lifecycle-singleton.test.mjs:36` ·
 * `config-io-panel.test.mjs:84` / `provider-model-guard.test.mjs:175,184,194`（动态）·
 * `at-refs-restore.test.mjs:19`）。
 *
 * 环 import（同 `panel-messages ↔ panel-session` 先例）：本档反向 import 主档的 `ensureSlot`
 * / `ensureSlotAsync`——两件均**只在本档函数体内**解引用（延迟解引用）⇒ 两模块顶层零跨环读取
 * ——环安全。
 */
import { loadSlot, saveSessionToSlot, slimForDisplay, isLegacyTransient } from "./session-io.mjs"
import { engTokensMergeForSave } from "./session-slot-write.mjs"
// F-W15：@ 引用还原（与产者同档）——标题源文本剥离消费面（恢复面显示剥离留主档）。
import { stripAtRefs } from "./file-refs.mjs"
import { generateTitle as generateSessionTitle } from "./generate-title.mjs"
// D7（2026-09-21）：标题源谓词单源——核 `isRealUserMsg`（角色 user ∧ content 为串 ∧ 非
// `[System reminder:` 前缀）——端壳不再自持 `m.type ?? m.role` 变体。
import { isRealUserMsg } from "@thincoder/core/history-window.mjs"
import { _cwd } from "./panel-messages.mjs"
import { ensureSlot, ensureSlotAsync } from "./panel-session.mjs"

// 迁出自 `panel-session.mjs`（同批逐字搬迁——仅随迁件来源变更）。
/** Persist both lines to the active slot + update manifest metadata.
 *  `slotOverride`（会话切换竞态修复，2026-08-28）: 保存目标显式绑定 turn 启动时的 slot——
 *  缺省回退 ensureSlot(panel)（当前活跃）。此前每次取当前 slot，运行中切换会话后
 *  onComplete/abort 的保存会把 A 会话整轮内容写进 B 槽（GitHub #2 "输出写错会话文件"）。 */
export function saveLines(panel, fullHistory, contextHistory, extra = {}, slotOverride) {
  const cwd = _cwd()
  const slot = slotOverride ?? ensureSlot(panel)
  // F-MI7（坑位 §5 第 1 条）：零探测冷路径可返 null（未解析窗口）——短路：**禁 deferred 写**
  // （本函数为同步契约，吞成 Promise 会让调用方丢失写完时序）；`saveSlotData(cwd, null, …)`
  // 会写 `.null` 槽文件——绝不落盘。后台收敛已由 ensureSlot 冷路径触发，内容随后续落点保存。
  if (slot == null) {
    console.warn("[chat-panel] saveLines: slot unresolved — write skipped (background bind kicked)")
    return
  }
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
    // D7（2026-09-21 块标题行对齐批——标题链单源）：标题值随本整档 save **单写**（回合尾
    // `finalizeTurn` 把新标题并入 extra——`extra.title` 支；无第二写）；键缺席 ⇒ 槽既有值
    // 保留（abort/finally 等不携标题的保存不得抹掉已生成标题）。
    title: extra.title ?? existing.title ?? "",
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

// 迁出自 `panel-session.mjs`（同批逐字搬迁）。
/** D7（2026-09-21 块标题行对齐批——标题链单源 · `docs/core/design/SESSION.md` §6.7）：本函数
 *  **只生成不落盘**（返 title / null——写形 = 随回合尾整档 save 单写，见 `saveLines`）。
 *  源 = 调用方传入的内存人读线消息数组（不再读槽 history）；谓词单源 = 核 `isRealUserMsg`。
 *  触发 = **无标题即尝试**（槽 `title` 在场 ⇒ 短路零触网——与 CLI `ensureSessionTitle` 同判据）；
 *  失败静默（返 null ⇒ 调用方不写 title、save 照常）。 */
export async function generateTitle(panel, slotOverride, messages) {
  try {
    const cwd = _cwd()
    // slotOverride（会话切换竞态修复，2026-08-28）：turn 启动时捕获的槽——标题属于产生
    // 首条消息的那个会话，切走后不得给新会话改名。
    // F-MI7：冷路径 null ⇒ awaited 认领束兜底（本函数 async——标题属产生首条消息的会话）。
    const slot = slotOverride ?? ensureSlot(panel) ?? await ensureSlotAsync(panel)
    const data = loadSlot(cwd, slot)
    if (!data || data.title) return null  // Already titled（等价注：`!data` 腿 = 无槽 ⇒ 亦无 `activeProvider`——两腿今日同判，台账 #187①）
    const firstUser = (messages ?? []).find(isRealUserMsg)
    if (!firstUser) return null
    // Provider comes from persisted session data (written by _saveLines on each turn),
    // not the message (runAgent never stamps provider/model onto history entries).
    // F-W15：标题源文本同接同档剥离（零第二实现）——标题不得由 `[File: …]` 文件正文生成。
    return await generateSessionTitle(stripAtRefs(firstUser.content), data.activeProvider || undefined) || null
  } catch (e) {
    console.error("[chat-panel] generateTitle failed:", e.message)
    return null
  }
}
