/**
 * agent/agent-state.mjs — §11.2 agent 状态纯函数层（setup.mjs 拆分——2026-09-08
 * 500 行硬限触碰执行——VSC TODO L15 / CLI TODO L10 同物登记；原注释随函数逐字迁入）：
 * resetRunState（§11.2 A per-run 复位清单）/ reconcileEngDesignTokens（§11.2 C
 * engDesignTokens 水合）/ applySlotSessionState（§11.2.1 槽字段 ↔ hydrate 映射）——
 * 纯函数、无 IO（test/agent-lifecycle-singleton.test.mjs 单测锚点）。
 */
import { isExpiredDesignToken, extractTokenUUID } from "../agent-tools/advisor.mjs"
import { TRACES_DEFAULTS } from "../config-io.mjs"

/**
 * §11.2 A —— per-run 复位清单（现靠重建清零的字段回合边界显式复位——预算/守卫不跨回合
 * 累计——AC6；顺序纪律：hydrateRun 先复位、agent.mjs 的 inheritedGuard 应用在后）。
 * 纯函数（单测锚点）。C 类（槽回填源）与 B 类（hydrate 立即重指）不受影响。
 */
export function resetRunState(agent) {
  agent._touchedFiles = []
  agent._verifiedThisRun = false
  agent._verifyPassed = undefined
  agent._verifyRetries = 0
  agent._honestReminderInjected = false
  agent._pendingTimers = []
  agent._lastPromptTokens = null
  agent._usageAtLen = null
  agent._compressFailures = 0
  agent._emptyRetries = 0
  agent._taskPushbacks = 0 // 预算类同款（清单外补充——task 完成门每任务表态 ≤1 的回合级计数）
  agent._advisorRound = 0
  agent._advisorSession = null
  agent._lastAdvisorOutput = null
  agent._calledAdvisorThisRun = false
  agent._mutatedThisRun = false
  agent._inAutoTurn = false
  agent._sessionSignal = null
  agent._runStartHistoryLen = 0
  agent._lastCompressInfo = null
  agent._lastEngState = false // eng 进出重通知语义——每 runAgent 重通知（现重建行为逐字对齐）
  agent._pendingReminders = []
  return agent
}

/**
 * §11.2 C / 11.2.1 engDesignTokens 水合（纯函数）：Map 永不复位清空——内存未结算项保留
 * （sync advisor 通过后 abort / settle 槽写失败的内存-only token 不因回合边界丢——双载体
 * 漂移根因消除）；槽权威条目合入（TTL 过滤——expired 从不授权）；过期计数回写（D2 触发③）；
 * 单值镜像 engDesignToken 仅 Map 空时一次性迁移读（AC3 唯一镜像读点）。
 * @returns {{ map: Map, droppedExpired: boolean }}
 */
export function reconcileEngDesignTokens(existing, slotTokens, legacyToken) {
  const map = existing instanceof Map ? existing : new Map()
  let droppedExpired = false
  for (const [id, tok] of [...map]) {
    if (typeof tok === "string" && isExpiredDesignToken(tok)) { map.delete(id); droppedExpired = true }
  }
  if (slotTokens && typeof slotTokens === "object" && !Array.isArray(slotTokens)) {
    for (const [id, tok] of Object.entries(slotTokens)) {
      if (typeof tok !== "string" || map.has(id)) continue
      if (isExpiredDesignToken(tok)) { droppedExpired = true; continue }
      map.set(id, tok)
    }
  }
  // 迁移读（AC3）：Map 空（TTL 清后）且镜像为有效格式 token → 一次性迁入
  if (map.size === 0 && typeof legacyToken === "string" && !isExpiredDesignToken(legacyToken)) {
    map.set(extractTokenUUID(legacyToken), legacyToken)
  }
  return { map, droppedExpired }
}

/**
 * §11.2.1 槽字段 ↔ hydrate 映射（纯函数——单测锚点）。槽 = 权威（每轮 apply）：
 * engineering/advisor.guard → agent.config（槽字段钉；缺席 → engState（子代理镜像）→ cfg）；
 * traces → agent.config.traces（cfg.traces 或 TRACES_DEFAULTS 合并——TRACE-STORE-VSC
 * D-TR6——恒有定义——chat 调用点开关读 agent.config.traces.enabled）；
 * planMode → agent._planMode（B 类每轮重指；opts.planMode 覆盖优先）；
 * engDesignTokens → reconcile（C 类永不清空）。restore=true（factory 新建——首轮/destroy
 * 重建同路径）→ 会话级槽字段回填 tasks/goal/pendingReminders（11.2.1/AC3）。
 * @param cfg config.json 解析产物（agent.config 由此整建——AC7 每轮拾取外部变更）。
 * @returns {{ engineering: boolean, droppedExpired: boolean }}
 */
export function applySlotSessionState(agent, { slot, engState, planModeOverride }, { cfg, restore = false }) {
  const slotEng = slot?.engineering
  const engEnabled = engState?.enabled
  const engineering = slotEng != null ? slotEng === true
    : (engEnabled != null ? engEnabled === true : cfg.engineering === true)
  const slotGuard = slot?.advisor?.guard
  const engGuard = engState?.advisorGuard
  const guard = slotGuard != null ? slotGuard === true
    : (engGuard != null ? engGuard === true : cfg.advisor?.guard === true)
  agent.config = {
    advisor: { ...(cfg.advisor ?? {}), guard },
    agent: { ...(cfg.agentFields ?? {}), engineering },
    proxy: cfg.proxy, shell: cfg.shell, providersList: cfg.providersList, websearch: cfg.websearch,
    // traces（TRACE-STORE-VSC D-TR6——镜像 CLI loadConfig().traces 合并）：cfg.traces 由
    // hydrate cfgBag 携带（raw.traces 合并 TRACES_DEFAULTS——默认 off——2026-09-05 发布
    // 隐私裁定）；直呼/旧 cfgBag（缺 traces）→ TRACES_DEFAULTS——agent.config.traces 恒有
    // 定义——chat 调用点 `agent.config.traces.enabled !== false` 反映真实开关（缺省 off，
    // 记录绝不因 cfg 缺键意外开启）。settings 工具 hot-apply（setKeyPath → config 对象）
    // 对 traces.enabled 同键生效。
    traces: cfg.traces ? { ...cfg.traces } : { ...TRACES_DEFAULTS },
  }
  agent._planMode = planModeOverride !== undefined ? planModeOverride === true : (slot?.planMode === true)
  // engDesignTokens：内存保留 + 槽权威合入（slot 优先；无槽绑定（子代理/直连）回退 opts.engState 载体）
  const rt = reconcileEngDesignTokens(agent._engDesignTokens, slot?.engDesignTokens ?? engState?.engDesignTokens, slot?.engDesignToken ?? engState?.engDesignToken)
  agent._engDesignTokens = rt.map
  if (restore) {
    agent._tasks = Array.isArray(slot?.tasks) ? [...slot.tasks] : []
    agent._goal = slot?.goal ?? null
    agent._pendingReminders = Array.isArray(slot?.pendingReminders) ? [...slot.pendingReminders] : []
  }
  return { engineering, droppedExpired: rt.droppedExpired }
}
