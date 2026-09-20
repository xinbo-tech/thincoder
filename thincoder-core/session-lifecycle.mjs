/**
 * session-lifecycle.mjs — 会话生命周期面（init-block 批 · F-MI7 拆分——`session.mjs` 500 行
 * 硬限；各函数语义原样外提，SESSION.md §6.10 D-2 / §6.12 / §6.11 注记随迁）：
 * 本端恢复入口包装（resumeSlot——残留 GC 钩子）/ 槽数据应用（applySession）/ 新建槽
 * （newSession）/ 运行态清空（resetSessionState）/ 槽切换（switchToSlot）/ 占用查询
 * （slotOccupancy）/ v1 老文件清扫（stripTruncatedToolArgs）。
 *
 * 静态环（与 session-slots.mjs ↔ session.mjs 同形）：本档引 `session.mjs` 的
 * `loadSlotFile`（data 层读留 session.mjs——2026-09-05 §6.10 D-2 拆分点），session.mjs re-export
 * 本档函数保持既有 import 面 —— 函数声明在实例化期已初始化、仅函数体内运行时使用（环安全；
 * 同 session-slots.mjs 头注）。
 *
 * 探测纪律（F-MI7 · SESSION.md §6.2）：本档**零同步 exec 扫描**——`newSession` 走入口一次
 * **异步束**（`probeOwnersAsync` + `ownerState` 三态查表）；`slotOccupancy` = **有界同步例外**
 * （`probeOwnersSync`，每 exec ≤ SYNC_PROBE_MS；探测失败 ⇒ `{ occupied: true, unknown: true }`
 * 保守占位——未知不认领，D-MI10）。
 */

import { existsSync } from "node:fs"
import { resolveCompactThreshold } from "./config.mjs"
import {
  slotPath, loadManifest, saveManifest, slotDigest, writeSessionFile, getSessionId,
  writeEndMarker, ownerPid, ownerPids,
  resumeSlot as slotsResumeSlot,
} from "./session-slots.mjs"
import { probeOwnersSync, probeOwnersAsync, ownerState } from "./process-probe.mjs"
// 环 import：见头注（loadSlotFile 属 session.mjs 的 data 层读面）。
import { loadSlotFile } from "./session.mjs"
import { mergeAdjacentAssistantEchoes } from "./context.mjs"
import { scheduleSessionGC } from "./session-gc.mjs"
import { restoreEngTokens } from "./token-ttl.mjs"
import { clearPlanMode } from "./agent-tools/plan.mjs"
import { bindRecordStore, unbindRecordStore, RECORD_WINDOW_MESSAGES } from "./session-store.mjs"

/** 恢复决策包装（SESSION.md §6.12 启动钩子，2026-09-06）：本端恢复入口触发一次残留 GC——
 *  scheduleSessionGC 内部 setImmediate 空闲执行 + 每进程每前缀去重，不阻塞启动路径（N4）。
 *  **async**（F-MI7——整链异步：探测不阻塞事件循环；调用面必须 await）。 */
export async function resumeSlot(cwd) {
  scheduleSessionGC(cwd)
  return slotsResumeSlot(cwd)
}

/** slimForDisplay 截断的 arguments 以 U+2026（…）结尾——不是合法 JSON 的完整值。
 *  v1 老文件回退播种机器线时置为 {}（合法空参数），防止半截 \\uXXXX 毒化发送载荷（会诊 F6）。 */
function stripTruncatedToolArgs(m) {
  if (m?.role !== "assistant" || !Array.isArray(m.tool_calls)) return m
  let changed = false
  const tool_calls = m.tool_calls.map((tc) => {
    const args = tc?.function?.arguments
    if (typeof args === "string" && args.endsWith("…")) {
      changed = true
      return { ...tc, function: { ...tc.function, arguments: "{}" } }
    }
    return tc
  })
  return changed ? { ...m, tool_calls } : m
}

/** Apply loaded session data onto an agent object; returns true if the runtime composite
 *  was switched. 2026-08-31 会诊 F1：清空 _slot/_slotMtime 缓存——切换后下次保存重新认领。
 *
 *  MODEL-MERGE-SESSION（F-4）applySession 重写为两支 + 删旧支（评审 #7/#9 措辞——防
 *  "三支"误读）：
 *  ① 槽 provider 存在 → provider/model 按槽值设（双字段恒非空——模型取 data.activeModel，
 *     legacy 槽 null/空串回该渠道默认模型 `providers[].model`（单值——2026-09-10 MODEL-SELECTION
 *     v2；老 models[] 首候选形态已退场））+ 重算
 *     compactThreshold（auto 时——按恢复后模型）——不看 config（defaultModel 只是新会话起点）；
 *  ② 槽 provider 没了 → D-S3 保留——静默保持现状（config 有效则有效——两方都无效由调用侧
 *     复验 validateProvider 弹重选）。
 *  删旧支："activeModel==null 清 stale override 回渠道默认"——前提 = 渠道默认字段——已随
 *  三旧层删除消失——双字段恒非空故不可能触发（评审 #7）。 */
export function applySession(agent, data, opts = {}) {
  // 机读线语义（历史注释保留）：data.history = FULL 未压缩记录（人读线）；data.contextHistory =
  // 压缩后机器线——恢复各从其源（保留压缩收益——从完整 history 重建会塞回中间过程——实测
  // prompt 膨胀 283%）。v1 老文件（无 contextHistory）回退播种，剥离被 slimForDisplay 截断的
  // tool_calls.arguments（… 结尾 → 置 {}——截断可劈断 \\uXXXX 产生 400 毒载荷）。length > 0 才
  // 当机读线（contextHistory: [] 是"无机读线"而非空机器线——空机器线静默丢全部上下文）。
  agent.config ??= {} // ACP test mocks may omit config; be defensive like the ??= below
  const full = Array.isArray(data.history) ? data.history : []
  // SESSION.md §6.11（2026-09-08——F2/F3）：恢复事件按当前 data 重定——载入历史非空 = 会话
  // 恢复 → 下个 depth-0 回合 env-state resumed:yes 一次（pushEnvStateReminder 读即清——每次恢复
  // 一次）。/new 与空历史槽切换不武装（显式清 false）——无恢复事件恒 no（F3 伪触发消除——不再靠
  // _sessionStart != null 推断；已武装 agent 切到空历史槽也不残留上次恢复事件——评审 round2 🟡）。
  // _processRestartPending 不在此清——由启动路径（bin/thincoder.mjs）设、prepareRun 发句清
  // （N6——双信号独立：切槽不报进程重启）。
  // 跨端异名互指（结构债批 5 N7——双端同语义各自独立实现、命名不统一是刻意——SESSION.md
  // §6.11）：VSC 端同机制载体异名 = agent._resumedPending（src/agent/setup.mjs hydrateRun——
  // restore:true 工厂 + fullHistory 非空时武装——每槽恢复一次）+ 模块级 restartDetectionDone
  // 一次性闸（src/agent/setup-reminders.mjs——process restarted 句的进程级信号）。
  agent._envResumed = full.length > 0
  const ch = data.contextHistory
  const machine = (Array.isArray(ch) && ch.length > 0) ? ch : full.map(stripTruncatedToolArgs)
  // D-CC19 恢复面回声归并（CONTEXT-COMPACTION §6.10 #8）：已落盘机读线原样装回会复活
  // D-CC18 病态形态（无 reasoning_content 的 assistant 紧邻 assistant ⇒ 首请求 400）——
  // machine 定线后、装线前扫描归并（干净输入返回同一引用——零拷贝零回归）。
  const machineMerged = mergeAdjacentAssistantEchoes(machine)
  // 绑定态（opts.slot 在场）：人读线 = 记录存储尾窗（下方绑定块填充）——不复制全量 JSON 数组
  agent._fullHistory = opts.slot != null ? [] : [...full]
  agent.history = [...machineMerged]
  agent.title = data.title ?? ""
  agent.tasks = data.tasks ?? []
  agent.planMode = data.planMode ?? false
  agent.autoApprove = data.autoApprove ?? false
  agent.goal = data.goal ?? null
  agent._pendingReminders = data.pendingReminders ?? []
  agent._sessionStart = data.sessionStart ?? null
  // R16 token 字段恢复（过期过滤——见 token-ttl.mjs restoreEngTokens）
  restoreEngTokens(agent, data)
  // engineering is session-level (2026-08-29): the slot value is the CLI session's authority
  // — config.json is only the initial default / cross-end mirror. A legacy slot without the
  // field keeps whatever config.json seeded (unchanged behavior).
  if (data.engineering !== undefined) {
    agent.config.agent ??= {}
    agent.config.agent.engineering = data.engineering === true
  }
  // ENG-PLAN-EXCLUSION（FR31 ③ / KD10——恢复点①·CLI `applySession`）：工程模式 ⇒ planMode 恒
  // false（内存位 + 未注入的 plan 提示语）——防「工程纪律 × plan 只读」半状态随槽恢复复活。
  // **槽不就地回写**：内存值在下一次 `saveSession` 随 `planMode` 字段自然收正（`session.mjs:128`）。
  if (agent.config?.agent?.engineering === true) clearPlanMode(agent)
  if (data.advisor) {
    agent.config.advisor = { ...data.advisor }
  }
  // Reset stall/compaction state on session switch
  agent._compressFailures = 0
  agent._verifyRetries = 0
  agent._verifyPassed = false
  agent._slot = null // 粘性缓存清空——切换后重新认领（F1b）
  agent._slotMtime = null
  // ── 记录存储绑定（TUI-OOM-ROOTCAUSE · SESSION.md §6.14 绑定与对账 / 追加时点）──
  // opts.slot 在场（启动恢复 / 非占用的 /session 切换 / ACP 钉槽）→ 绑定（身份核验 + 对账 +
  // 窗口）——人读线 = store.tail(200)；未传（模式 F：被他人活进程占用的槽 / 测试 / ACP fork）
  // → 解绑——人读线维持全量数组（D-SE26 模式 F 零回归）。
  if (opts.slot != null) {
    const store = bindRecordStore(agent, {
      slotFile: slotPath(agent.cwd, opts.slot),
      identity: data.sessionStart ?? null,
      baseHistory: full,
    })
    agent._fullHistory = store.tail(RECORD_WINDOW_MESSAGES)
  } else {
    unbindRecordStore(agent)
  }
  // ── MODEL-MERGE-SESSION 恢复（F-4——两支）──
  const slotProvider = data.activeProvider ? agent.providers?.find((pr) => pr.name === data.activeProvider) : null
  if (slotProvider) {
    // ① 槽 provider 存在 → 按槽值设（不看 config）：双字段恒非空——legacy 槽 activeModel
    //    null/空串 = 无 override——回该渠道默认模型（`providers[].model` 单值——M3）。
    //    F-2d（MODEL-400-FIX）：`||` 非 `??`——空串也兜（activeModel="" 的槽会让 `??` 不落链 →
    //    空槽 model 恒有值，provider.model 键不缺失）
    const prevName = agent.activeProvider
    const prevModel = agent.activeModel ?? null
    const slotModel = data.activeModel || slotProvider.model
    const switched = prevName !== slotProvider.name || prevModel !== slotModel
    agent.activeProvider = slotProvider.name
    agent.activeModel = slotModel
    agent.provider = { ...slotProvider }
    if (slotModel) agent.provider.model = slotModel
    // 重算 compactThreshold（auto 时——阈值跟模型走；原在 bin 的 switched 分支——收拢本处）
    if (switched && agent.config?.agent?.compactThresholdAuto && agent.provider.model) {
      agent.config.agent.compactThreshold = resolveCompactThreshold(null, agent.provider).value
    }
    return switched
  }
  // ② 槽 provider 没了 → D-S3 保留——静默保持现状（不报错不纠正——config 有效则静默用
  //    config/defaultModel 运行时；两方都无效由调用侧复验 validateProvider 弹重选）
  return false
}

/**
 * Create a new session slot: allocate a free slot number,
 * write an empty session, and mark it as the active slot.
 * No limit on the number of sessions.
 * **async**（F-MI7：入口一次异步束——探测不阻塞事件循环；调用面必须 await）。
 */
export async function newSession(cwd) {
  const m = loadManifest(cwd)

  // 2026-09-01 advisor 🔵：先清理死主条目（与 ensureActive 分支2 语义一致）——否则
  // "死主 + 文件缺失"的空槽（m.slots 有条目、无文件、属主已死）永不复用，槽号持续
  // 增长。死主且无文件 = 该会话从未落盘（进程死了没保存），条目可安全删除回收。
  // 2026-09-01 会诊 deepseek/glm 🟡：清理必须经 deletions 显式落盘——saveManifest 条目级
  // 合并会把磁盘死条目从 fresh 复活回写，仅传 m 等于没删（VS Code newSlot 已修，CLI 对称）。
  // F-MI7：判活来自**入口一次异步束**（零自有 exec / 零逐 pid exec）；判据查表——
  // unknown（探测失败 / 缺行）⇒ 保守保留条目（D-MI10）。
  const mySessionId = getSessionId()
  const bundle = await probeOwnersAsync(ownerPids(m, mySessionId))
  const deadSlots = []
  for (const [s, owner] of Object.entries(m.slotSessions ?? {})) {
    if (!owner || owner === mySessionId) continue
    if (ownerState(ownerPid(owner), bundle) !== "dead") continue
    delete m.slotSessions[s]
    if (!existsSync(slotPath(cwd, Number(s)))) delete m.slots[s]
    deadSlots.push(s)
  }

  // Find next available slot number — 2026-08-31 会诊 deepseek 🟡：不能只看 manifest
  // 条目（丢失更新可能让条目消失而文件仍在）——复用该号会直接覆写真实会话
  // （F2 防护不覆盖 newSession 的空数据直写）。
  // 2026-08-31 advisor round2 🟡：同时跳过"已被另一活进程认领但尚未落盘"的号
  // （slotSessions 有条目、slots 无条目、文件不存在）——否则双进程会认领同一号。
  // F-MI7：活 / 未知属主 ⇒ 视为已占（跳号——保守），判据同查束。
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    if (!owner || owner === mySessionId) return false
    return ownerState(ownerPid(owner), bundle) !== "dead"
  }
  let slot = 1
  while (m.slots[slot] || existsSync(slotPath(cwd, slot)) || liveClaimed(slot)) slot++

  // Write empty session — 2026-09-01 advisor 🔵：补 contextHistory/planMode 字段与
  // VS Code newSlot 对齐（SESSION.md §6.3 v2 格式双端一致；两端读侧均有兜底，功能等价）
  const data = { version: 2, cwd, title: "", updatedAt: Date.now(), history: [], contextHistory: [], tasks: [], planMode: false, goal: null, autoApprove: false, advisor: null, pendingReminders: [], sessionStart: null }
  writeSessionFile(slotPath(cwd, slot), data)
  m.slots[slot] = slotDigest(data)
  m.active = slot
  // 2026-08-31 advisor round1 🟡：与 ensureActive 认领模型一致——立即记录新 slot 所有权，
  // 否则 /new 后到首次保存之间并发方（VS Code/另一 CLI）会把新 active 槽当"空闲可恢复"
  // 认领 → 双进程写同一槽（F2 轮转互旋）。
  m.slotSessions ??= {}
  m.slotSessions[slot] = mySessionId
  // 2026-09-01 会诊三家 🟡：显式翻 active 的调用点传 setActive（saveManifest 默认保留
  // 磁盘 fresh.active，避免把并发方刚翻的指针回滚）
  // 2026-09-01 会诊 deepseek/glm 🟡：deletions 过滤掉本调用刚重新认领的槽（防删掉自己的
  // 新属主）——与 ensureActive deadParam / VS Code newSlot 同型。
  const deletions = deadSlots.length
    ? {
        slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId),
        slots: deadSlots.filter((s) => !m.slots[s]),
      }
    : null
  saveManifest(cwd, m, deletions, { setActive: true })
  // 2026-09-05 §6.10 D-4：/new 落点写本端记录（显式切换跟随——T-M8）
  writeEndMarker(cwd, slot)
  return slot
}

/** 清空会话运行态（/new 用，2026-08-31 会诊 F3）：_fullHistory/title/_sessionStart 等
 *  全部会话级状态 + 一次性注入标志必须全清——否则新会话首次落盘把旧会话完整人类线 +
 *  旧标题写进新槽（实锤 .19/.3 双副本）；注入标志不清则 /new 后新会话永不注入
 *  OS/cwd reminder（2026-09-01 会诊 glm 🟡）。autoApprove 是用户偏好，跨会话保留（有意）。 */
export function resetSessionState(agent) {
  agent._fullHistory = []
  agent.history = []
  agent.title = ""
  agent.tasks = []
  agent._sessionStart = null
  // DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像 `_engDesignToken` 退役——不再维护
  agent._engDesignTokens = new Map() // multi-design slots die with the session (2026-09-01 fix #2)
  agent._compressFailures = 0
  agent._verifyRetries = 0
  agent._verifyPassed = undefined
  agent._runStartHistoryLen = 0
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  agent.planMode = false
  agent.goal = null
  agent._pendingReminders = []
  agent._slot = null
  agent._slotMtime = null
  agent._osReminderInjected = false
  // §6.11（2026-09-08）：一次性注入标志换名——_restartReminderInjected 推断退役（F3——
  // _sessionStart != null 伪触发）；/new 清零新标记——恢复武装/启动句标志不跨会话复活
  agent._envResumed = false
  agent._processRestartPending = false
  agent._lastEngState = false
  // /new 或切换：记录存储解绑（新槽由 cmd-new / 首保存补绑重新挂载——§6.14 绑定与对账）
  unbindRecordStore(agent)
}

/** Switch the manifest active pointer to a slot. Returns the slot's session data
 *  (null if the slot doesn't exist / can't be read). 2026-08-31 会诊 deepseek 🔴：
 *  原实现经 loadSession → activeSlot 有认领副作用——目标槽被活进程占用时 ensureActive
 *  分支 3 会把 active 拨到新空槽并读回 null + 劫持对方指针。现改为 loadSlotFile 直接读
 *  （无认领副作用）；目标槽空闲则一并认领、被另一活进程占用则不认领（slotOccupancy——
 *  下次保存经 activeSlot 自然 fork 到新槽）；只改 manifest 指针（setActive 意图）。
 *  2026-09-01 会诊三家 🟡：saveManifest 条目级合并 + setActive（不把并发方刚翻的指针回滚）。 */
export function switchToSlot(cwd, slot) {
  const m = loadManifest(cwd)
  if (!m.slots[slot]) return null
  const data = loadSlotFile(cwd, slot)
  if (!data) return null
  m.active = slot
  const occ = slotOccupancy(cwd, slot)
  if (!occ.occupied) {
    m.slotSessions ??= {}
    m.slotSessions[slot] = getSessionId()
  }
  saveManifest(cwd, m, null, { setActive: true })
  // 2026-09-05 §6.10 D-4：/session N 跟随"最后查看的槽"（成功切换才写）
  writeEndMarker(cwd, slot)
  return data
}

/** 目标槽是否被另一活进程占用（2026-09-01 会诊/advisor 🟡）：排除本进程属主——
 *  /session 重选当前槽不误报；同进程双会话防护由 ACP sameProcessPinned 承担。
 *  F-MI7（**有界同步例外**——D-MI14 登记）：零探测早退（无属主 / 本进程属主）；冷路径单 pid
 *  **同步束**（每 exec ≤ SYNC_PROBE_MS）；探测失败 ⇒ 未知 ⇒ `{ occupied: true, unknown: true }`
 *  （保守占位——未知不认领，D-MI10）。 */
export function slotOccupancy(cwd, slot) {
  const m = loadManifest(cwd)
  const owner = m.slotSessions?.[slot]
  if (!owner) return { occupied: false }
  if (owner === getSessionId()) return { occupied: false }
  const pid = ownerPid(owner)
  if (!pid) return { occupied: false }
  const st = ownerState(pid, probeOwnersSync([pid]))
  if (st === "alive") return { occupied: true, owner }
  if (st === "unknown") return { occupied: true, unknown: true, owner }
  return { occupied: false }
}
