/**
 * agent-host.mjs — 宿主装配桥（`docs/desktop/design/SHELL.md` §4 装配第三份 · `docs/desktop/design/IPC.md` §1 桥面）。
 * 六职责（**R3 拆后**：回合驱动族出档 `turn-driver.mjs` —— `docs/desktop/design/PROJECT.md` §10 **BL** 行）：
 * ① 装配（懒 · 按需 · 同键复用）② 回调桥（协议行解析 ⇒ `ev:*` 出站 · R3a 增 `onUsage` 入会话累计令牌表 ·
 * R3 增 `onDistilled` 蒸馏落位〔非通道〕）③ 待决表（三门形：审批逐项 / 审批批次 / 提问 —— 兼撞帽续跑询问载体）
 * ④ **回合驱动族装配**（出档 `turn-driver.mjs`：单回合执行面 · 在飞表 · 中止墓碑 · `send` ∕ `interrupt` ∕ `dispose`
 *    ∕ `abortSuspensions` —— 本档只供注入面并暴露其返回面）
 * ⑤ 会话级偏好写面（`setPrefs`：写盘 → 重施；在飞受理 ∥ 施加顺延 —— 批次档 KD-19 单点）。**#880 增 选定写回**：
 *    槽面实变 ∧ `provider`+`model` 同在 ⇒ `defaultModel` 同拍写回（槽先配置后；失败不反扑 · 主侧记错）；
 * ⑥ 模式位投影（`flagsOf` **活值**四布尔 —— 状态栏对齐批：`approval:respond` 成功径回执叠加 `{ key, flags }`；
 * 页读供面同函数 —— 槽投影兜底面住 `session-slots.mjs` `slotFlags`）。
 * ＋R1 会话维护面一枚 `syncTitle`（改名内存标题同步，#525）。
 * ＋留档记录面一枚 `recordAppend`（消化面留档批 · #719 —— `record:append` 处理体转口 + 装配表命中门）。
 * **R3 拆点（本批落形）**：`send` ∕ `interrupt` ∕ `drive` ∕ `takeOver` ∕ `dispose` ∕ `abortSuspensions` +
 * 在飞表 + 中止墓碑 ⇒ `turn-driver.mjs`（连同其私有装配：排队面 ∕ 续发链 ∕ 挂起驱动 ∕ 提示面）；本档经
 * 同名返回面转口 ⇒ `ipc.mjs` 调用面零改（拆后本档 ≤300 顾问线）。
 * **R3b（D20）**：子 agent 面（停止出口 + 存活投影起 / 停 / 清点）出档 `subagent-face.mjs`（行数触发线 —— 档名实施批定）。
 * **对齐第三批**：两**只读采样面**注入回调桥（`advisorMeta` ⇒ `ev:tool-call` `round` / `model` · `extractFileLinks`
 * ⇒ `ev:tool-result` `links`；皆纯读、零副作用 —— 不入职责计数）；**R5** 增第三只读采样面 `goalOf`（⇒ `ev:goal`，同律）。
 * 装配端差（SHELL.md §4 显式登记两项 + 取值面一项）随装配面搬运 ⇒ 单源 = `agent-assemble.mjs` 档头（本档不重述）。
 * 零宿主依赖：出站 `emit` 由主进程注入 ⇒ 平 node 直测。
 *
 * 出档（批 8 §1.14 ③：本档触行数拉线，按在册预案拆分 —— 档名实施舱定）：回调桥 ⇒ `agent-bridge.mjs`
 * （`createBridge` + 名面 `ACTIVITY_EVENTS` / `parseEvToken` / `summarizeArgs`）；待决门 ⇒ `suspensions.mjs`
 * （`createGates` + `ITEM_VERDICTS` / `BATCH_VERDICTS` / `QUESTION_CANCELLED`）；槽 I/O ⇒ `session-io.mjs`（`loadAgentSlot` /
 * `saveDistilledSlot`〔R3 蒸馏落位〕）；**装配面（状态栏对齐批）⇒ `agent-assemble.mjs`**（`assembleFor` + `DEFAULT_DEPS` /
 * `teamConfig` / `gitAuthor` / `validateProvider` —— 装配段逐字搬运）。上述门 ∕ 桥 ∕ 装配三名面在原路径**同名 re-export**
 * ⇒ 调用方 import 路径与名面零改。
 * 会话取槽落盘（批 8 §1.14 ①②）：`ensure` 装配后装载本键槽（槽缺 ⇒ 新建形，代理不动）；回合三路结算（`send` 径 ——
 * 族出档 `turn-driver.mjs`）**先落盘再出终局事件** —— 渲染侧收尾重读即见本回合增量。
 * **桌面空闲唤醒批（KD-34 / KD-35）**：挂起驱动胶水（消费核件 `startSuspension`）出档 `thincoder-desktop/src/main/suspension-drive.mjs`；
 * 提示面策略（失焦门 + 两档）出档 `thincoder-desktop/src/main/notify.mjs`（驱动族注入面三件 —— `notify` ∕ `focused` ∕ `reveal`，
 * 皆可缺省：缺 ⇒ 零动作，零连带）。
 * **R1 输入面板移植（桌面宿主面）**：两处理面出档 —— `setFlags` ⇒ `session-flags.mjs`（核 `setSlot*` 四写 +
 * 活代理重施（`loadAgentSlot`）+ `flagsOf` 回执 + ENG×PLAN 互斥）· `atComplete` ⇒ `at-complete.mjs`（@ 补全
 * 文件枚举过滤 + `seq` 原样回携）；本档只留 import + 装配 ∕ 暴露两行（拆分评审结论 = 批档 §2.7 本档行）。
 */
import { runAgent } from "@thincoder/core/agent.mjs"
import { estimateTokens, historyPercent } from "@thincoder/core/token-window.mjs"
// 会话键语义（`String(slot)` 单源）与端壳同档 —— 键面归一不造第二口径；偏好写面（`writeSlotPrefs`）同档。
import { slotOfKey, writeSlotPrefs } from "./session-slots.mjs"
// 选定写回单点（#880 —— `defaultModel` 同拍写回；判据句 6 ∕ `IPC.md` §2 项 8；零环：settings.mjs 不依本档）。
import { carryoverDefaultModel } from "./settings.mjs"
// 五族出档（见档头）：回调桥 / 待决门 / 槽 I/O / 子 agent 面 / 装配面 —— 本档只装配与注入，算法面各归其档。
import { createBridge } from "./agent-bridge.mjs" // 含「对齐第三批」两采样面注入（见下）
import { extractFileLinks } from "./file-links.mjs" // 验存文件链接（相抵② · KD-39 —— 盘上存在闸）
import { createGates } from "./suspensions.mjs"
import { appendRecord, loadAgentSlot, saveDistilledSlot } from "./session-io.mjs"
import { createSubagentFace } from "./subagent-face.mjs"
// 装配面（状态栏对齐批出档 —— 原档装配段逐字搬运）：本档取其默认装配函数与名面转口 + 词面构造（KD-70）；
// `validateProvider` 除 re-export 外另**体内消费**（KD-8 槽复验 —— `assembleAndLoad` 内直调）。
import { assembleFor, mcpWarningReminder, validateProvider } from "./agent-assemble.mjs"
import { createTurnDriver } from "./turn-driver.mjs"
// 渲染面实况回读缓存（子代理面板批 —— `panel:state` 接收半；与 `ipc.mjs` 处理体同单例——单源）。
import { panelLive } from "./panel-live.mjs"
// R1 输入面板移植（桌面宿主面）：模式位四写面 ∕ @ 补全面两处理体出档（新增两面零入档 —— 拆分评审结论见档头）。
import { createSessionFlags } from "./session-flags.mjs"
import { createAtComplete } from "./at-complete.mjs"
// 同名 re-export（调用面零改 —— 既有 import 路径与名面保持）。
export { ACTIVITY_EVENTS, parseEvToken, summarizeArgs } from "./agent-bridge.mjs"
export { ITEM_VERDICTS, BATCH_VERDICTS } from "./suspensions.mjs"
export { DEFAULT_DEPS, assembleFor, gitAuthor, teamConfig, validateProvider } from "./agent-assemble.mjs"

/** 会话级偏好键闭集（单源 = `docs/core/design/SESSION.md` §6.21 —— 与核 `SLOT_PREF_KEYS` 同集〔该符号
 *  核内私有、非引用面：值域两处各持〕；本档只判载荷形，值归一在核）。 */
const PREF_KEYS = Object.freeze(["provider", "model", "effort"])

/** 偏好载荷形判据（纯函数、不抛）：非对象 / 数组 / 零键 / 表外键 / 值形违例 ⇒ `invalid-patch`；
 *  `provider` 在场而 `model` 缺 ⇒ `model-required`（T-DSK28 ⑦「只送 provider」——档位表外字面串不在本层判，
 *  交核 `resolveEffortPatch` 归一 `null`）。通过 ⇒ `null`。值串判据 = trim 后非空、**原串透传**
 *  （不裁空白 —— 值面规整不在本层）。 */
function prefsPatchFailure(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return "invalid-patch"
  const keys = Object.keys(patch)
  if (keys.length === 0 || keys.some((k) => !PREF_KEYS.includes(k))) return "invalid-patch"
  const text = (v) => typeof v === "string" && v.trim() !== ""
  if ("provider" in patch && !text(patch.provider)) return "invalid-patch"
  if ("model" in patch && !text(patch.model)) return "invalid-patch"
  if ("effort" in patch && patch.effort !== null && typeof patch.effort !== "string") return "invalid-patch"
  if ("provider" in patch && !("model" in patch)) return "model-required"
  return null
}

/** advisor 轮次 / 模型**只读采样**（「对齐第三批」项 14 —— `docs/desktop/design/UI.md` §1 本批注项 14）：值 = 核
 *  `agent._advisorRound` 活读 **+1**（CLI `tool-events.mjs:145` / VSC `panel-callbacks.mjs:113` 同式）· `provider.model`；
 *  **agent 不在场 ⇒ `null`**（零载波 —— 不携两键，禁假造）。纯函数、零抛。 */
export function advisorMeta(agent) {
  if (!agent) return null
  return { round: (agent._advisorRound ?? 0) + 1, model: agent.provider?.model ?? null }
}

/** `ev:usage` 帧门判据（R3 端差① 修 · 2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）：
 *  `pct > 0` ∨ 本帧携新读数（tokens ∕ timers —— 非正 ∕ 缺 ⇒ 不携）⇒ 发；否则不发（零读数帧不复发）。
 *  取整 0 回合（`historyPercent` = `Math.round` ⇒ 小历史回 0）——有 tokens ∕ timers 读数即照达
 *  （判据句「取整 0 回合三读数照达」）。纯函数、零副作用。 */
export function usageFrameWanted(ctxPct, ctxTokens, timers) {
  if (typeof ctxPct === "number" && ctxPct > 0) return true
  if (typeof ctxTokens === "number" && ctxTokens > 0) return true
  return typeof timers?.count === "number" && timers.count > 0
}

/** 宿主装配桥：`emit(channel, payload)` = 出站面（主进程注入）· `run` = 回合运行器 · `assemble` = 装配函数（皆可注入）。
 *  `projects` = 项目面（`currentCwd()` 供装配取值）；返回正文面 + 子 agent 面（`subagent-face.mjs` 展开：
 *  `stopSubagent` / `heartbeatBeat` / `startHeartbeat` / `stopHeartbeat`）+ `flagsOf` + `table` / `agents`。
 *  **提示面注入三件（桌面空闲唤醒批 —— 皆可缺省：缺 ⇒ 零动作）**：`notify` = 平台落子 · `focused` = 焦态判据 · `reveal` = 点击聚焦；
 *  **timer 面（timer-wake 阶段 2）**：闩 ∕ 三武装点 ∕ 窗内 `timerFace` 装配住挂起驱动档（`suspension-drive.mjs` ⋈ `timer-watch.mjs`），
 *  驱动族只供两枚注入面 —— `busyOf`（在飞判据）+ `takeOver`（timer 轮后同判），二者随族装配住 `turn-driver.mjs`。 */
export function createAgentHost({ emit, run = runAgent, assemble = assembleFor, deps = {}, projects, notify = null, focused = null, reveal = null } = {}) {
  if (typeof emit !== "function") throw new Error("[agent-host] emit required (out-bound channel)")
  const post = (channel, payload) => emit(channel, payload)
  /** 装配表：key → agent（同键复用；`dispose` 清）。 */
  const agents = new Map()
  /** 在途装配（并发同键去重 —— 两次 `ensure` 只装配一次）。 */
  const ensuring = new Map()
  /** 会话累计令牌表（key → 五键记录 —— R3a：写者 = 桥面 `onUsage`，读面 = 回合尾 `ev:usage` 载荷；`dispose` 随清）。 */
  const usageTally = new Map()
  const tokensOf = (key) => {
    if (!usageTally.has(key)) usageTally.set(key, { prompt_tokens: 0, completion_tokens: 0, reasoning_tokens: 0, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 0 })
    return usageTally.get(key)
  }
  /** 装配表清（`dispose` 消费 —— `turn-driver.mjs` 注入面 `forgetKey`）：agents ∕ 在途装配 / 令牌表三面
   *  同键重开零继承（清点语义 = 原档 `dispose` 三删行，逐字等价）。 */
  const forgetKey = (key) => {
    agents.delete(key)
    ensuring.delete(key)
    usageTally.delete(key)
  }
  /** 装配表**全清**（切项目级联 —— `turn-driver.mjs` 注入面；#515① ∕ #507 装配表清点）：语义 = `forgetKey`
   *  的全表形（三面全清）。切项目后同槽号键不再命中旧项目 agent；陈旧回合尾的「代次就地覆写」面随装配
   *  对象更换一并消除（旧对象持旧代次 ⇒ 墓碑恒判失效——与 `dispose` 臂同型）。 */
  const forgetAll = () => {
    agents.clear()
    ensuring.clear()
    usageTally.clear()
  }
  /** 待决门（表 + 五操作 —— 出档 `suspensions.mjs`；`table` 随宿主面继续暴露）。 */
  const { table, askSingle, askBatch, askQuestion, denyGates, respond } = createGates({ post, agents })
  /** 回调桥（出档 `agent-bridge.mjs`）⊕「对齐第三批」两采样面（`advisorOf` / `extractLinks` —— 见档头）
   *  ⊕ R3 蒸馏落位注入面（`persistDistilled` —— `onDistilled` 时点按本键取装配实例重落盘，见 `session-io.mjs`）
   *  ⊕ R5 目标面采样面（`goalOf` —— goal 工具结果时点读核载体 `agent.goal` 单源；agent 缺席 ⇒ `undefined` 不可判）。 */
  const bridge = createBridge({
    post, askSingle, askBatch, askQuestion, tokensOf,
    syncLiveOf: (key, head) => agents.get(key)?._syncChildAborts?.has(head) === true,
    advisorOf: (key) => advisorMeta(agents.get(key)),
    extractLinks: (text) => extractFileLinks(projects?.currentCwd(), text),
    persistDistilled: (key) => { const agent = agents.get(key); if (agent) saveDistilledSlot(agent) },
    goalOf: (key) => { const agent = agents.get(key); return agent === undefined ? undefined : (agent.goal ?? null) },
  })

  /** 计时读数（R3a 载荷扩 `timers` —— 核 `_pendingTimers` 活读投影 `{count, expired}`；新鲜度 = 本回合尾时点
   *  （RENDER-CORE §10 F 行：空闲期到期不即时刷新）；`expiresAt` 非数项不计到期）。 */
  function pendingTimers(agent, now = Date.now()) {
    const list = Array.isArray(agent?._pendingTimers) ? agent._pendingTimers : []
    return { count: list.length, expired: list.filter((timer) => typeof timer?.expiresAt === "number" && timer.expiresAt <= now).length }
  }

  /** 回合尾用量读数（`docs/desktop/design/IPC.md` §1 `ev:usage` 行 —— 产出方 = 宿主回合尾结算）：
   *  载荷 = `{ key, ctxPct, ctxTokens, usage, timers }` —— `ctxPct` = 核 `historyPercent` 投影（**端侧零重算**，不假造）；
   *  `ctxTokens` = 核 `estimateTokens(agent.history)` 投影（状态行 ⇒ CLI 补漏批增——与 `ctxPct` 同点产出）；
   *  **发门 = `usageFrameWanted`**（`pct > 0` ∨ 本帧携新读数（tokens ∕ timers）⇒ 发 · 否则不发——R3 端差① 修，
   *  2026-09-29 · 批 #673：取整 0 回合三读数照达（判据句）；单源 = `docs/render-core/design/RENDER-CORE.md`
   *  §9 R3 端差①；`ctxTokens` 0 ∕ 缺不抑事件，渲染面自持「非正 ⇒ 尾串缺席」）；
   *  `usage` = 本键会话累计（桥面 `onUsage` 累加 ·
   *  五键 = VSC 键面 · CLI 同源映射）· `timers` = 核 `_pendingTimers` 活读（空在途 ⇒ 零值——显示面自持「非正 ⇒ 零节点」）。
   *  **三径同点调用**：落盘之后、终局事件之前 · **不抛前提** = `agent.history` 恒数组
   *  （核装配缺省 `thincoder-core/agent.mjs:54` · 接续恒置 `thincoder-core/session-lifecycle.mjs:113`）⇒ 本读数不改结算链。 */
  function postUsage(key, agent) {
    const ctxPct = historyPercent(agent?.history ?? [], agent?.provider)
    const ctxTokens = estimateTokens(agent?.history ?? [])
    const timers = pendingTimers(agent)
    if (!usageFrameWanted(ctxPct, ctxTokens, timers)) return
    post("ev:usage", { key, ctxPct, ctxTokens, usage: { ...tokensOf(key) }, timers })
  }

  /** 装配 + 装载本键槽：`loadAgentSlot` 在**宿主内**（假 `assemble` 注入同走装载 —— §1.14 ① 的语义面
   *  是「装配出的代理必须持槽值」，不在装配函数里）；槽缺 ⇒ 新建形（代理原样）。
   *  **KD-8 槽复验**（批 §2 补录 3 ∥ CLI 同型 `thincoder-cli/src/command-interactive.mjs:149`）：装载后
   *  `_providerInvalid` 仍在 ⇒ `validateProvider(agent, agent.config)` 幂等复验——槽值有效（凡
   *  `loadAgentSlot` 命中本键渠条目）⇒ 清两标 ⇒ 本次发送放行；槽无效 ⇒ 标照旧（下一径拦）。
   *  **MCP 警告消费（KD-70）**：装配尾入队 —— 装载后（`applySession` 重设 `_pendingReminders`）∥ 装配一次
   *  推送一次（同 key 复用不重推）；词面 = `agent-assemble.mjs` `mcpWarningReminder`（首两段逐字同 CLI）。 */
  async function assembleAndLoad(key, slot) {
    const cwd = projects.currentCwd()
    const agent = await assemble({ cwd, slot, key, deps })
    loadAgentSlot(agent, cwd, slot)
    // 实况回读读面（子代理面板批 · 2026-10-04 —— `PANEL-READBACK.md` §2.1 per-key）：核 `panel` 工具经
    // `ctx.readout` 取值（`subagent.mjs` 接线）——桌面渲染面快照 ⇒ `source:"renderer"` / freeze 数据源。
    agent._panelReadout = () => panelLive.get(key)
    if (agent._providerInvalid) validateProvider(agent, agent.config)
    const reminder = mcpWarningReminder(agent._mcpWarnings)
    if (reminder !== null) {
      agent._pendingReminders = agent._pendingReminders ?? []
      agent._pendingReminders.push(reminder)
    }
    return agent
  }

  async function ensure(key, slot) {
    if (agents.has(key)) return agents.get(key)
    if (!ensuring.has(key)) ensuring.set(key, assembleAndLoad(key, slot))
    const pending = ensuring.get(key)
    try {
      const agent = await pending
      // 级联清装配（`forgetKey` ∕ `forgetAll`）后不回流：本条装配若已被清（会话关闭 ∕ 切项目），结果只回
      // 调用方、不回表——同槽号键不得命中旧项目 agent（#515① ∕ #507；并发同键去重面不变）。
      // **C · 无效装配不入表**（批 §2；KD-7）：`_providerInvalid` 仍真 ⇒ 不回表——下次发送按盘上新态
      // 重装配（同键复用不缓存无效态 ⇒ 「失败发送 → 修正（补写 ∕ 槽选 ∕ 改钥）→ 再发」会话内自愈；
      // usageTally ∥ 在途面零动）。复验清标（KD-8）后有效 ⇒ 入表照旧。
      if (ensuring.get(key) === pending && agent._providerInvalid !== true) agents.set(key, agent)
      return agent
    } finally {
      if (ensuring.get(key) === pending) ensuring.delete(key)
    }
  }

  /** 回合驱动族装配（出档 `turn-driver.mjs` —— §10 BL 拆点）：本档供注入面 —— 出站 ∕ 运行器 ∕ 桥 ∕ 读数 ∕
   *  装配取值 ∕ 装配表清 ∕ 桥 scope 回收 ∕ 待决门按拒 ∕ 项目面 ∕ 提问门（撞帽续跑询问载体，R3 · #505）∘
   *  提示面三件；返回面六件随宿主返回面展开（`ipc.mjs` 调用面零改）。 */
  const turnDriver = createTurnDriver({
    post, run, bridge, postUsage, askQuestion, projects,
    ensure, forgetKey, forgetAll, dropScope: (key) => bridge.dropScope(key), denyGates,
    notify, focused, reveal,
  })

  /** `session:prefs` 写面（`docs/desktop/design/IPC.md` §2「会话级偏好注」项 2/4/7 · KD-19 单点）：判序 = `bad-key`
   *  → 载荷两档（`invalid-patch` / `model-required`）→ 写盘 → 施加（**在飞受理 ∥ 施加顺延**——2026-10-04 解锁批：
   *  忙态拒档退役）。写盘 = 端壳 `writeSlotPrefs`（核写口 + 回读投影）；写未发生（槽不可读 / `cwd` 无源）⇒ `slot-missing`。
   *  **施加** = 本键已装配者重施 `loadAgentSlot`（活动会话内存即生效）；**在飞（`busyOf`）⇒ 只记 `_pendingPrefsApply` 位不重施**
   *  （回合一致性：在飞不换模型——回合尾 `settleTurn` 落盘后 `applyPendingPrefs` 施加 ⇒ 下一回合起跑取新值）；
   *  未装配者只写盘（不隐式装配）。成功 ⇒ 族信封 + `meta`（与 `history:page` 同源投影）；失败 ⇒ 信封**无 `meta` 键** + 零写。
   *  **选定写回（#880 · 判据句 6 ∥ 项 8）**：**槽面实变**（`written.changed`）∧ `provider` + `model` 同在
   *  ⇒ `defaultModel` 同拍写回（定序 = 槽先配置后；等值零写住写回单点）；配置面失败**不反扑**（回执仍
   *  `ok:true`——本会话已生效）+ `console.error` 记错（零静默）⇒ 回执零叠加（`providerState` 键缺席）；
   *  写回成功 ⇒ 回执另携 `providerState`（写后核读——第四刷新点；键缺席 ⇒ 渲染面零写）。 */
  function setPrefs(key, patch) {
    const cwd = projects?.currentCwd()
    const slot = slotOfKey(key)
    const fail = (reason) => ({ ok: false, reason, cwd: typeof cwd === "string" ? cwd : null, slot: null })
    if (slot === null) return fail("bad-key")
    const bad = prefsPatchFailure(patch)
    if (bad) return fail(bad)
    if (typeof cwd !== "string" || !cwd) return fail("slot-missing")
    const written = writeSlotPrefs(cwd, slot, patch)
    if (!written.ok) return fail("slot-missing")
    const receipt = { ok: true, reason: null, cwd, slot, meta: written.meta }
    // 选定写回（#880）：只认「槽面实变」——回声（会话切换 ∥ 同值回写）与档位径天然落空；`provider`+`model`
    // 同在（值串判据已由 `prefsPatchFailure` 把守）⇒ 写回单点（定序 = 槽先配置后；与下行重施互不依赖）。
    // 失败不反扑：回执不改、记错零静默。
    if (written.changed === true && typeof patch.provider === "string" && typeof patch.model === "string") {
      const carried = carryoverDefaultModel(patch.provider, patch.model)
      if (carried.ok !== true) console.error(`[agent-host] default model carryover failed: ${carried.reason}`)
      else if (carried.providerState !== undefined) receipt.providerState = carried.providerState
    }
    if (agents.has(key)) {
      const agent = agents.get(key)
      // 在飞（`running` ∕ 窗内回合 ∕ 蒸馏在飞）⇒ **写盘受理 ∥ 施加顺延**（2026-10-04 解锁批 · R3）——记位
      // `_pendingPrefsApply`（住 agent 对象：中止径随弃，零清理面）；回合尾 `settleTurn` 落盘后施加。
      if (turnDriver.busyOf(key)) agent._pendingPrefsApply = true
      else loadAgentSlot(agent, cwd, slot)
    }
    return receipt
  }

  /** 模式位**活值**投影（`docs/desktop/design/IPC.md` §2「模式位投影注」项 2 · 状态栏对齐批）：四布尔逐项 ——
   *  与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:233-236`（`planMode` / `autoApprove` /
   *  `advisor.guard === true` / `agent.engineering === true`，零算法副本）。
   *  **agent 不在场 ⇒ `null`**（禁假造）：页读供面以槽投影兜底（`session-slots.mjs` `slotFlags` —— 合并口径），
   *  调用面按「键缺席 / 零写」处置。 */
  function flagsOf(key) {
    if (key === undefined || key === null) return null
    const agent = agents.get(String(key))
    if (!agent) return null
    return {
      planMode: agent.planMode === true,
      autoApprove: agent.autoApprove === true,
      advisorGuard: agent.config?.advisor?.guard === true,
      engineering: agent.config?.agent?.engineering === true,
    }
  }

  /** 改名**内存标题**同步（R1 · #525 —— `session:rename` 成功径调用，见 `ipc.mjs`）：装配表命中 ⇒ 写
   *  `agent.title`（盘面已由核 `renameSlot` 写就 —— 本面只同步内存，零第二写径）；不在场 ⇒ 零动作
   *  （不隐式装配：下次装配自读盘上新标题）。依据 = 回合尾 `saveSession` 全量覆盖 ⇒ 内存旧标题会把盘面
   *  新标题写回；CLI 先例 `thincoder-cli/src/tui/cmd-session.mjs:35`（改名成功后置 `agent.title`）。 */
  function syncTitle(slot, title) {
    const agent = agents.get(String(slot))
    if (agent) agent.title = title
  }

  /** `record:append(payload)` 处理体（消化面留档批 · #719 —— `docs/desktop/design/IPC.md` §2 该行）：载荷
   *  `{ key, record }` ⇒ `{ ok, reason }`（reason 闭集 = `bad-key`（`slotOfKey` 坏键 —— 与 `subagent:stop` 同判）∥
   *  `unknown-key`（装配表无该键 —— 事件面只在装代理上流，实际不可达 —— 防御档））+ 转口 `appendRecord`
   *  （`pushReal` 同面 + fail-soft —— `session-io.mjs`）；**到达族 = `subagent`**（`digest` 族产生面 = 宿主发帧点
   *  同点双动作，经本通道不可达 —— 防双份）。 */
  function recordAppend(key, record) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const agent = agents.get(String(key))
    if (!agent) return { ok: false, reason: "unknown-key" }
    appendRecord(agent, record)
    return { ok: true, reason: null }
  }

  /** 作答 / 审批出口（待决门 `respond` 转口 + **成功径叠加** —— `docs/desktop/design/IPC.md` §2 该行 +
   *  「模式位投影注」项 5 · 状态栏对齐批）：**成功径 ∧ 审批门** ⇒ 回执叠加 `{ key, flags }`（`flagsOf` 活值 ——
   *  桌内 AUTO 翻转〔`always` 放行置位 = `suspensions.mjs`〕后渲染面即刷新）；**提问门径 / 失败径零叠加**
   *  （零乐观写）；agent 已不在场 ⇒ 不叠 `flags`（键缺席 —— 禁假造）。 */
  function respondTo(payload) {
    const pending = table.get(payload?.promptId)
    const receipt = respond(payload)
    if (receipt?.ok !== true || pending?.kind !== "approval") return receipt
    const flags = flagsOf(pending.key)
    return flags === null ? receipt : { ...receipt, key: pending.key, flags }
  }

  /** 模式位写面（R1 输入面板移植 —— `session:flags`；处理体出档 `session-flags.mjs`）：`flagsOf` 为函数声明（提升）
   *  ⇒ 此处引用先于定义安全。 */
  const { setFlags } = createSessionFlags({ agents, projects, post, flagsOf })
  /** @ 补全面（R1 输入面板移植 —— `at:complete`；文件枚举过滤出档 `at-complete.mjs`）。 */
  const { atComplete } = createAtComplete({ projects })

  /** 子 agent 面（R3b · D20 —— 出档 `subagent-face.mjs`）：停止出口 + 存活投影起 / 停 / 清点。 */
  const subagentFace = createSubagentFace({ agents, bridge })

  // `respond` = 本档 `respondTo` 转口（契约：表外 id ⇒ `unknown-prompt` · 跨 kind 载荷 ⇒ `bad-kind` · 跨形 / 表外
  // verdict ⇒ `bad-verdict` · 非串且非 `null` 作答 ⇒ `bad-answer`；四档皆不 resolve —— 挂起保留；成功径叠加见上）。
  subagentFace.startHeartbeat() // 出生自愈起拍（起在装配期；停 `stopHeartbeat()` / 逐键清 `dispose(key)`）
  return {
    ensure, setPrefs, recordAppend, respond: respondTo, flagsOf, syncTitle,
    setFlags, atComplete, // R1 输入面板移植两通道宿主入口（`ipc.mjs` 两 handler 转口 —— 处理体各住其档）
    ...turnDriver, // 回合驱动族六件 + 两只读面（`send` ∕ `interrupt` ∕ `dispose` ∕ `abortSuspensions` ∕ `queueSnapshot` 等 —— `turn-driver.mjs`）
    ...subagentFace, table, agents,
  }
}
