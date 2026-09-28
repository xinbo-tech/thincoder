/**
 * agent-host.mjs — 宿主装配桥（`docs/desktop/design/SHELL.md` §4 装配第三份 · `docs/desktop/design/IPC.md` §1 桥面）。
 * 六职责：① 装配（懒 · 按需 · 同键复用）② 十回调桥（协议行解析 ⇒ `ev:*` 出站 · R3a 增 `onUsage` 入会话累计令牌表）
 * ③ 待决表（三门形：审批逐项 / 审批批次 / 提问）
 * ④ 回合驱动（`send` / `interrupt` + 结算三映射：done · stopped · error + 回合尾 `ev:usage` 读数〔`postUsage` · 三径同点〕）
 *    ——**桌面空闲唤醒批**：单回合执行面提取（`send` ∕ 驱动**同源** ＝ `executeTurn` · `suspDriven: true` 撤回合尾直注入兜底）
 *    + 回合尾挂起接管（`poolLive` ⇒ `suspension-drive.mjs` 核件入口）+ `send` ∕ `interrupt` ∕ `dispose` 三路由（窗内输入 ∕ 回合级中断 ∕ 会话中止）
 * ⑤ 会话级偏好写面（`setPrefs`：写盘 → 重施；在飞拒 —— 批次档 KD-19 单点）
 * ⑥ 模式位投影（`flagsOf` **活值**四布尔 —— 状态栏对齐批：`approval:respond` 成功径回执叠加 `{ key, flags }`；
 * 页读供面同函数 —— 槽投影兜底面住 `session-slots.mjs` `slotFlags`）。
 * **R3b（D20）**：子 agent 面（停止出口 + 存活投影起 / 停 / 清点）出档 `subagent-face.mjs`（行数触发线 —— 档名实施批定）。
 * **对齐第三批**：两**只读采样面**注入回调桥（`advisorMeta` ⇒ `ev:tool-call` `round` / `model` · `extractFileLinks`
 * ⇒ `ev:tool-result` `links`；皆纯读、零副作用 —— 不入「六职责」计数）。
 * 装配端差（SHELL.md §4 显式登记两项 + 取值面一项）随装配面搬运 ⇒ 单源 = `agent-assemble.mjs` 档头（本档不重述）。
 * 零宿主依赖：出站 `emit` 由主进程注入 ⇒ 平 node 直测。
 *
 * 出档（批 8 §1.14 ③：本档触行数拉线，按在册预案拆分 —— 档名实施舱定）：回调桥 ⇒ `agent-bridge.mjs`
 * （`createBridge` + 名面 `ACTIVITY_EVENTS` / `parseEvToken` / `summarizeArgs`）；待决门 ⇒ `suspensions.mjs`
 * （`createGates` + `ITEM_VERDICTS` / `BATCH_VERDICTS` / `QUESTION_CANCELLED`）；槽 I/O ⇒ `session-io.mjs`（`loadAgentSlot` /
 * `saveAgentSlot`）；**装配面（状态栏对齐批）⇒ `agent-assemble.mjs`**（`assembleFor` + `DEFAULT_DEPS` /
 * `teamConfig` / `gitAuthor` / `validateProvider` —— 装配段逐字搬运）。上述名面在原路径**同名 re-export**
 * ⇒ 调用方 import 路径与名面零改。
 * 会话取槽落盘（批 8 §1.14 ①②）：`ensure` 装配后装载本键槽（槽缺 ⇒ 新建形，代理不动）；`send` 三路结算
 * **先落盘再出终局事件** —— 渲染侧收尾重读即见本回合增量。
 * **桌面空闲唤醒批（KD-34 / KD-35）**：挂起驱动胶水（消费核件 `startSuspension`）出档 `thincoder-desktop/src/main/suspension-drive.mjs`；
 * 提示面策略（失焦门 + 两档）出档 `thincoder-desktop/src/main/notify.mjs`（本档注入面扩三件 —— `notify` ∕ `focused` ∕ `reveal`，
 * 皆可缺省：缺 ⇒ 零动作，零连带）。
 */
import { runAgent } from "@thincoder/core/agent.mjs"
import { historyPercent } from "@thincoder/core/token-window.mjs"
// 会话键语义（`String(slot)` 单源）与端壳同档 —— 键面归一不造第二口径；偏好写面（`writeSlotPrefs`）同档。
import { slotOfKey, writeSlotPrefs } from "./session-slots.mjs"
// 五族出档（见档头）：回调桥 / 待决门 / 槽 I/O / 子 agent 面 / 装配面 —— 本档只装配与驱动，算法面各归其档。
import { createBridge } from "./agent-bridge.mjs" // 含「对齐第三批」两采样面注入（见下）
import { extractFileLinks } from "./file-links.mjs" // 验存文件链接（相抵② · KD-39 —— 盘上存在闸）
import { createGates } from "./suspensions.mjs"
import { loadAgentSlot, saveAgentSlot } from "./session-io.mjs"
import { createSubagentFace } from "./subagent-face.mjs"
// 装配面（状态栏对齐批出档 —— 原档装配段逐字搬运）：本档取其默认装配函数与名面转口。
import { assembleFor } from "./agent-assemble.mjs"
// 附件面（`docs/desktop/design/IPC.md` §2「附件注」）：起跑前装配（非视觉门 / 落盘 / 交核指引）+ 回合尾清理。
import { cleanupTurn, prepareTurnAttachments } from "./attachments.mjs"
// 挂起驱动胶水（KD-34 —— 消费核件 `startSuspension`：会话寄存器 + 端侧钩子 + 输入 ∕ 关闭路由）+ 提示面策略（KD-35 两档）。
import { createSuspensionDrive } from "./suspension-drive.mjs"
import { createNotifier } from "./notify.mjs"
// 单回合执行面（桌面空闲唤醒批出档 —— 触 300 行顾问线，在册预案「回合执行面再出档」落形）。
import { createTurnFace } from "./turn-face.mjs"
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

/** 宿主装配桥：`emit(channel, payload)` = 出站面（主进程注入）· `run` = 回合运行器 · `assemble` = 装配函数（皆可注入）。
 *  `projects` = 项目面（`currentCwd()` 供装配取值）；返回正文面 + 子 agent 面（`subagent-face.mjs` 展开：
 *  `stopSubagent` / `heartbeatBeat` / `startHeartbeat` / `stopHeartbeat`）+ `flagsOf` + `table` / `agents`。
 *  **提示面注入三件（桌面空闲唤醒批 —— 皆可缺省：缺 ⇒ 零动作）**：`notify` = 平台落子 · `focused` = 焦态判据 · `reveal` = 点击聚焦。 */
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
    if (!usageTally.has(key)) usageTally.set(key, { prompt: 0, completion: 0, reasoningTokens: 0, cacheHit: 0, cacheMiss: 0 })
    return usageTally.get(key)
  }
  /** 待决门（表 + 五操作 —— 出档 `suspensions.mjs`；`table` 随宿主面继续暴露）。 */
  const { table, askSingle, askBatch, askQuestion, denyGates, respond } = createGates({ post, agents })
  /** 十回调桥（出档 `agent-bridge.mjs`）⊕「对齐第三批」两采样面（`advisorOf` / `extractLinks` —— 见档头）。 */
  const bridge = createBridge({
    post, askSingle, askBatch, askQuestion, tokensOf,
    syncLiveOf: (key, head) => agents.get(key)?._syncChildAborts?.has(head) === true,
    advisorOf: (key) => advisorMeta(agents.get(key)),
    extractLinks: (text) => extractFileLinks(projects?.currentCwd(), text),
  })
  /** 在飞回合：key → AbortController（单驱动器 ⇒ 禁双 run 竞态）。 */
  const flights = new Map()
  /** 单回合执行面（`send` ∕ 驱动同源 —— 出档 `turn-face.mjs`；本档只供 `post` ∕ `run` ∕ 桥 ∕ 读数 ∕ 在飞表五件）。 */
  const { executeTurn } = createTurnFace({ post, run, bridge, postUsage, flights })
  /** 提示面（KD-35：失焦门 + 两档合句 + 点击聚焦 —— 策略面 ∕ 平台面分家，见 `notify.mjs`）。 */
  const notifier = createNotifier({ notify, focused, reveal })
  /** 挂起驱动（KD-34：消费核件 —— 会话寄存器 + 端侧钩子（计数 ∕ 回收 ∕ 冻结）+ 边界两发（窗内单回合包装 `autoTurn` 支）
   *  + 输入 ∕ 关闭路由 + 提示面两档；`runTurn` = 本档单回合执行面 —— `send` ∕ 驱动同源）。 */
  const suspension = createSuspensionDrive({
    post, runTurn: executeTurn, notify: notifier,
    reloadSlot: (key, agent, cwd) => { // §2.2 会话钉定：每轮起跑前按本窗键重装槽（含 `_slot` 重钉）
      const slot = slotOfKey(key)
      return slot === null || typeof cwd !== "string" || cwd === "" ? false : loadAgentSlot(agent, cwd, slot)
    },
  })

  /** 计时读数（R3a 载荷扩 `timers` —— 核 `_pendingTimers` 活读投影 `{count, expired}`；新鲜度 = 本回合尾时点
   *  （RENDER-CORE §10 F 行：空闲期到期不即时刷新）；`expiresAt` 非数项不计到期）。 */
  function pendingTimers(agent, now = Date.now()) {
    const list = Array.isArray(agent?._pendingTimers) ? agent._pendingTimers : []
    return { count: list.length, expired: list.filter((timer) => typeof timer?.expiresAt === "number" && timer.expiresAt <= now).length }
  }

  /** 回合尾用量读数（`docs/desktop/design/IPC.md` §1 `ev:usage` 行 —— 产出方 = 宿主回合尾结算）：
   *  载荷 = `{ key, percent, tokens, timers }` —— `percent` = 核 `historyPercent` 投影（**端侧零重算** · 门 = 有效读数〔数字 ∧ `> 0`〕，
   *  不假造）；`tokens` = 本键会话累计（桥面 `onUsage` 累加 · CLI 同源映射）· `timers` = 核 `_pendingTimers` 活读（空在途 ⇒ 零值——
   *  显示面自持「非正 ⇒ 零节点」）。**三径同点调用**：落盘之后、终局事件之前 · **不抛前提** = `agent.history` 恒数组
   *  （核装配缺省 `thincoder-core/agent.mjs:64` · 接续恒置 `thincoder-core/session-lifecycle.mjs:108`）⇒ 本读数不改结算链。 */
  function postUsage(key, agent) {
    const percent = historyPercent(agent?.history ?? [], agent?.provider)
    if (typeof percent !== "number" || !(percent > 0)) return
    post("ev:usage", { key, percent, tokens: { ...tokensOf(key) }, timers: pendingTimers(agent) })
  }

  /** 装配 + 装载本键槽：`loadAgentSlot` 在**宿主内**（假 `assemble` 注入同走装载 —— §1.14 ① 的语义面
   *  是「装配出的代理必须持槽值」，不在装配函数里）；槽缺 ⇒ 新建形（代理原样）。 */
  async function assembleAndLoad(key, slot) {
    const cwd = projects.currentCwd()
    const agent = await assemble({ cwd, slot, key, deps })
    loadAgentSlot(agent, cwd, slot)
    return agent
  }

  async function ensure(key, slot) {
    if (agents.has(key)) return agents.get(key)
    if (!ensuring.has(key)) ensuring.set(key, assembleAndLoad(key, slot))
    try {
      const agent = await ensuring.get(key)
      agents.set(key, agent)
      return agent
    } finally {
      ensuring.delete(key)
    }
  }

  /** 回合尾挂起接管（KD-34 入口）：终局事件已出 · 在飞已释 ⇒ `poolLive(agent)` 判真 ⇒ 进挂起窗（核件消费；
   *  `cwd` = 窗入口 cwd——窗项持入口键 + 入口 cwd，§2.2）。成功 ∕ 失败两径同接管（后台项不因回合失败而失管）。 */
  function takeOver(key, agent) {
    suspension.start(key, agent, { cwd: projects?.currentCwd() ?? null })
  }

  /** `msg:send`：坏键 ⇒ bad-key · **窗内 ⇒ 入挂起队列**（含附件 ⇒ busy 留队重试——核件输入面 = 文本单形）·
   *  在飞 ⇒ busy · provider 无效 ⇒ provider-invalid（零假回合）；否则建在飞、起跑、**立即回 `{ok:true}`**。
   *  结算三映射（done / stopped / error）收尾清在飞 —— 三径各出一次回合尾 `ev:usage`（读数同点、终局事件之前）。
   *  三路结算**先落盘再出终局事件**（§1.14 ② —— 渲染侧收尾重读即可见本回合增量；CLI 先例 = 回合
   *  finally 尾部保存 ⇒ 中断 / 错误同样留现场）。
   *  附件面（`IPC.md` §2「附件注」）：`images` 逐项 `{name,mime,dataURL}`；判决与落盘全在
   *  `prepareTurnAttachments`（出口零抛 ⇒ 回合驱动零承担），弃项经回执 `degraded` 浮出（零静默）；
   *  落盘件随三径结算在 `executeTurn` finally 清理（**先释放锁**再清理 —— 清理由本档自吞错，锁必释放）。 */
  async function send(key, text, images) {
    const slot = slotOfKey(key)
    if (slot === null) return { ok: false, reason: "bad-key" }
    if (suspension.active(key)) { // 挂起窗口头（KD-34）：窗内输入 ⇒ 驱动器队列 + 唤醒（用户输入优先序沿核件）
      if (Array.isArray(images) && images.length > 0) return { ok: false, reason: "busy" }
      return suspension.pushInput(key, String(text ?? "")) ? { ok: true } : { ok: false, reason: "busy" }
    }
    if (flights.has(key)) return { ok: false, reason: "busy" }
    // 占位先于装配 await：首跑仍在懒装配时的同键再发亦落 `busy`——单驱动器不许双 `runAgent`。
    const controller = new AbortController()
    flights.set(key, controller)
    const release = () => {
      if (flights.get(key) === controller) flights.delete(key)
    }
    let agent = null
    try {
      agent = await ensure(key, slot)
    } catch (err) {
      release() // 装配抛不吞（直传 invoke 拒绝），但先摘本键在飞——否则本键永锁 `busy`
      throw err
    }
    if (agent._providerInvalid) {
      release()
      return { ok: false, reason: "provider-invalid" }
    }
    // 附件装配（项 1–4）：文本 / 路径 / 降级码三件——`cwd` = 项目根、`model` = 本回合实跑模型、
    // `locale` = 装配实例配置（`createAgent` 存本 —— 零二次 `loadConfig`），非视觉说明词面随之就地定局。
    const attached = prepareTurnAttachments(text, images, {
      cwd: projects?.currentCwd(), model: agent.provider?.model, locale: agent.config?.locale,
    })
    release() // 占位交接给 `executeTurn`（同刻重占 —— 零 microtask 空窗）
    void executeTurn(key, agent, attached.text, { attached }).then(
      () => { suspension.turnDone(key, agent); takeOver(key, agent) }, // 成功径 ⇒ 提示面档①（`!autoTurn` —— send 径恒非 auto）
      () => takeOver(key, agent),
    )
    return attached.degraded ? { ok: true, degraded: attached.degraded } : { ok: true }
  }

  /** `msg:interrupt`：无在飞 ⇒ `idle`；在飞 ⇒ abort + 本键待决门按拒结算。 */
  function interrupt(key) {
    if (slotOfKey(key) === null) return { ok: false, reason: "bad-key" }
    const controller = flights.get(key)
    if (!controller) return { ok: false, reason: "idle" }
    controller.abort()
    denyGates(key)
    return { ok: true }
  }

  /** `session:prefs` 写面（`docs/desktop/design/IPC.md` §2「会话级偏好注」项 2/4/7 · KD-19 单点）：判序 = `bad-key`
   *  → `busy`（在飞**零写**）→ 载荷两档（`invalid-patch` / `model-required`）→ 写盘 → 施加。
   *  写盘 = 端壳 `writeSlotPrefs`（核写口 + 回读投影）；写未发生（槽不可读 / `cwd` 无源）⇒ `slot-missing`。
   *  **施加** = 本键已装配者重施 `loadAgentSlot`（活动会话内存即生效）；未装配者只写盘（不隐式装配）。
   *  成功 ⇒ 族信封 + `meta`（与 `history:page` 同源投影）；失败 ⇒ 信封**无 `meta` 键** + 零写。 */
  function setPrefs(key, patch) {
    const cwd = projects?.currentCwd()
    const slot = slotOfKey(key)
    const fail = (reason) => ({ ok: false, reason, cwd: typeof cwd === "string" ? cwd : null, slot: null })
    if (slot === null) return fail("bad-key")
    if (flights.has(key)) return fail("busy")
    const bad = prefsPatchFailure(patch)
    if (bad) return fail(bad)
    if (typeof cwd !== "string" || !cwd) return fail("slot-missing")
    const written = writeSlotPrefs(cwd, slot, patch)
    if (!written.ok) return fail("slot-missing")
    if (agents.has(key)) loadAgentSlot(agents.get(key), cwd, slot)
    return { ok: true, reason: null, cwd, slot, meta: written.meta }
  }

  /** 模式位**活值**投影（`docs/desktop/design/IPC.md` §2「模式位投影注」项 2 · 状态栏对齐批）：四布尔逐项 ——
   *  与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:221-225`（`planMode` / `autoApprove` /
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

  /** 子 agent 面（R3b · D20 —— 出档 `subagent-face.mjs`）：停止出口 + 存活投影起 / 停 / 清点。 */
  const subagentFace = createSubagentFace({ agents, bridge })

  /** 装配实例清除（会话关闭面 —— 防泄漏）：**挂起窗级联中止（§2.2 —— 清池不注入 + 出窗帧；先于摘表 —— 窗仍持 agent 引用）**
   *  ∥ 装配表 / 在途装配 / 本键待决门（按拒结算 —— 不留悬 Promise）/ 本键令牌表 / 本键桥面 relay scope。
   *  **R3b**：同时 = 存活投影**清点**面（该键不再入拍）。 */
  function dispose(key) {
    suspension.abort(key)
    agents.delete(key)
    ensuring.delete(key)
    usageTally.delete(key)
    bridge.dropScope(key)
    denyGates(key)
  }

  /** 切项目级联（§2.2：`project:open` 成功且 cwd 变更 ⇒ 旧项目**全键**窗中止 —— 会话键面 = `String(slot)` 项目内命名空间，
   *  跨项目同槽号撞键 + 取值挂 `currentCwd()` 双错位）；返回中止窗数（`ipc.mjs` 成功径调用）。 */
  function abortSuspensions() {
    return suspension.abortAll()
  }

  // `respond` = 本档 `respondTo` 转口（契约：表外 id ⇒ `unknown-prompt` · 跨 kind 载荷 ⇒ `bad-kind` · 跨形 / 表外
  // verdict ⇒ `bad-verdict` · 非串且非 `null` 作答 ⇒ `bad-answer`；四档皆不 resolve —— 挂起保留；成功径叠加见上）。
  subagentFace.startHeartbeat() // 出生自愈起拍（起在装配期；停 `stopHeartbeat()` / 逐键清 `dispose(key)`）
  return { ensure, send, interrupt, setPrefs, respond: respondTo, dispose, abortSuspensions, flagsOf, ...subagentFace, table, agents }
}
