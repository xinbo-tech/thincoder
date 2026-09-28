/**
 * store.mjs — 渲染面单状态树（`docs/desktop/design/SHELL.md:32` · `docs/desktop/design/RENDERER.md:17`）：
 * 单一持有点 + 订阅（**变更触发** · 等值零通知 · 通知中再变更不递归）。
 * 面域 = 会话 / 标签页 / 块与历史 / 活动池 / 设置族 / 项目级信息 —— 数据面切片 = 块 / 历史回填 / 跟滚 / 标签
 * （标签含**关闭确认面**：`pendingClose` + 判据 `needsCloseConfirm` + 三纯动作；左列含**行形态**：`railForm` +
 * 两纯动作 —— 批 A ④ 改名 / 删除换形）；会话族与活动池切片随各自批次填充。
 * 批 9 增两切片：`settings`（开合 / 四段三态 / 向导 / 校验结果 —— `docs/desktop/design/UI.md` §1 设置面行）与
 * `projectInfo`（三读数 + 超阈标 + 相位 + 失败串）——**值面归接线层**（`renderer/mount-settings.mjs` 只经
 * `patchSettings` 落值），本档只持槽位 + 四条纯动作；`configured` 为**三态读数**（`null` = 未知）。
 * R3a 增四槽（D17 状态行读数面 —— `renderer/views/statusline.mjs` 读面）：`turns` / `turnStarts` / `tokens` / `timers`。
 * R3b 增一槽（D20 子 agent 面 —— `renderer/views/activity.mjs` 读面）：`subBlocks`（**按会话键分槽**：
 *  `{ [会话键]: 块模型[] }`；写者 = 归约面 `ev:subagent`（核态机 —— `/rc/subblocks/state.mjs`）；同笔**摘工具行**
 *  —— `pool` 切片不再载 `blocks`（工具调用面 = 对话流工具卡 —— `docs/desktop/design/UI.md` §1 本批注项 2）。
 * 纯数据面：零 DOM / 零 IPC；零 `node:` / 零裸包（渲染面静态闭包判据）。
 *
 * 语义（批档 §2.4（f）· §2.5 U28–U32）：
 *   ① 切片操作 = **纯函数**（`appendBlock` / `beginBackfill` / `endBackfill` / `setFollowing` /
 *      `returnToBottom` / `openTab` / `closeTab` / `requestCloseTab` / `confirmCloseTab` / `cancelCloseTab` /
 *      `openRailForm` / `closeRailForm` / `togglePool` / `patchSettings` / `setWizardStep` / `dismissWizard` /
 *      队列三动作 `enqueue` / `dequeue` / `drainQueue`（`pool.queue` 唯一写面 · 满队常量 `QUEUE_MAX` 单源 —— 批 A））——
 *      返回**新态**；拒收 / 无变化 ⇒ **原引用**（引用等值 ⇒ 零通知，视图层可据引用短路）；
 *   ② `set(next)` 逐键 `Object.is` 比较（`next` = 补丁（局部键）或整态（全键）—— 同一路径：
 *      `store.set(appendBlock(store.get(), block))`），**至少一键变更才通知**；回执 = `(state, changedKeys)`；
 *   ③ 通知期内的再 `set` **入队** —— 当前轮通知跑完再发（不递归、不丢、合并后一次性通知）；
 *   ④ 工艺常量（`MAX_RENDER_BLOCKS = 200` / 跟滚 24px / 药丸 420ms 窗 / 标签宽）归**视图批** —— 数据面只收参数
 *      （`limit` / `{ page }`），不内联常量（批档 §2.6 D-4 ·
 *      `docs/desktop/design/RENDERER.md` §2 / §3）；
 *   ⑤ 监听器异常面：逐个捕获（记 `console.error`）+ `draining` 由 `finally` 复位 —— 单个监听器抛错
 *      既不吞同轮其余监听器，也不堵死此后派发（不静默丢通知）。
 */

/** 初态：`locale` 由引导面置位；`project` / `sessions` / `pool` 槽位在、消费面随后续批。
 *  `tabBadges` / `sessionMeta` / `poolCollapsed` = **槽位注册**（消费面已在册 —— `views/chrome.mjs` 会话头读
 *  `sessionMeta`、`requestCloseTab` 防御取 `tabBadges`、池面折叠读 `poolCollapsed`）⇒ 注册后零行为变化；
 *  三切片与 `pool` 族（待审批 / 队列两族）皆 = **供给面写入**（值面未落 ⇒ 零节点 —— 禁假造）。
 *  `usage` 为**槽位注册**（写者 = `ev:usage` 归约 · 按会话 `key` 写）；消费面 = 状态栏读数节点
 *  （`docs/desktop/design/UI.md` §1）—— 消费未落 ⇒ 注册后零行为变化。
 *  `turns` / `turnStarts` / `tokens` / `timers` 四槽 = **状态行读数槽随动**（R3a · D17 承载段数据源 ——
 *  写者 = 归约面（`turns` / `turnStarts` 自 `ev:activity` turn 载荷；`tokens` / `timers` 自 `ev:usage` 载荷扩），
 *  读面 = `renderer/views/statusline.mjs`；值面未落 ⇒ 对应段零节点 —— 禁假造）。
 *  `sessionFlags` = **模式位切片**（状态栏对齐批 · D22）：按会话键存四布尔（写者 = 归约面 `applyFlags` ——
 *  页读 / 出站回执两径）；读面 = 状态行 banner 四段（真 ⇒ 在场 · 假 / 缺 ⇒ 零节点 —— 禁假造）。
 *  `subBlocks` = **子 agent 块切片**（R3b · D20）：按会话键分槽（无该键 / 非数组 ⇒ 该会话零块 —— 禁假造）；
 *  元素 = 核态机模型（`renderer/events.mjs` 归约面写，读面 `renderer/views/activity.mjs`）。`pool.running` 读数
 *  同源（活动会话在飞块数——范归约面写；`pool` 切片不再载 `blocks`——摘工具行）。`ledger` = **账本警示切片**
 *  （账本可靠批 · 桌面微轮：写者 = `renderer/mount-sessions.mjs` `refreshRail` 唯一写路径；读面 = 会话区末子注记）。 */
export function initialState() {
  return {
    locale: "en",
    project: { cwd: null, recent: [] },
    sessions: [],
    activeSession: null,
    tabs: [],
    activeTab: null,
    pendingClose: null,
    railForm: null,
    ledger: null,
    tabBadges: {},
    sessionMeta: {},
    sessionFlags: {},
    usage: {},
    turns: {},
    turnStarts: {},
    tokens: {},
    timers: {},
    subBlocks: {},
    blocks: [],
    history: { hasOlder: false, inFlight: false, page: null },
    following: true,
    pendingNew: 0,
    pool: { running: 0, approval: 0, queue: [], approvals: [] },
    poolCollapsed: {},
    settings: {
      open: false,
      notice: null,
      configured: null,
      defaultModel: null,
      wizard: { step: 1, dismissed: false, notice: null },
      providers: { state: "none", presets: [], providers: [] },
      verify: null,
      model: { state: "none", provider: null, current: null, models: [] },
      agent: { state: "none", fields: [] },
      mcp: { state: "none", servers: [] },
    },
    projectInfo: { counts: null, thresholdReached: null, phase: null, notice: null },
  }
}

/** 块落树（单块增量 —— 视图批按帧调用、频次限流归视图批）：块**始终落树**；
 *  停跟期间只累 `pendingNew`（药丸计数），`following` 不变。
 *  规格外入参（`undefined`）⇒ **显式拒收**（原引用、不落树）—— 视图批调用面禁传空；
 *  该分支不登记为对外契约（无用例钉）。 */
export function appendBlock(state, block) {
  if (block === undefined) return state
  const pendingNew = state.following ? state.pendingNew : state.pendingNew + 1
  return { ...state, blocks: [...state.blocks, block], pendingNew }
}

/** 窗口切片（T-DSK17 数据面）：`visible` = 尾 `limit` 块（**引用等值**）；
 *  `hidden` = 隐藏块数（number）：正整数 `limit` ⇒ `blocks.length - limit`；
 *  `limit ≤ 0` / 非整数 ⇒ 防御档（`visible` 空、`hidden = blocks.length`）。 */
export function visibleWindow(blocks, limit) {
  const shown = Number.isInteger(limit) && limit > 0 ? Math.min(limit, blocks.length) : 0
  return { visible: blocks.slice(blocks.length - shown), hidden: blocks.length - shown }
}

/** 回填起页（T-DSK18 数据面 · `docs/desktop/design/RENDERER.md` §3 触发条件）：**有更早页 ∧
 *  无在途**才受理 —— 否则原态（拒：无更早页 / 重入）；受理 ⇒ 置在途 + 记本页量。 */
export function beginBackfill(state, { page } = {}) {
  if (state.history.hasOlder !== true || state.history.inFlight) return state
  return { ...state, history: { ...state.history, inFlight: true, page } }
}

/** 回填收束：清在途（页量留档）；非在途 ⇒ 原态。 */
export function endBackfill(state) {
  if (!state.history.inFlight) return state
  return { ...state, history: { ...state.history, inFlight: false } }
}

/** 跟滚开关：停跟（上滚）/ 复跟（近底 24px 判定归视图批 —— 本处只收结果）。 */
export function setFollowing(state, following) {
  return typeof following === "boolean" && following !== state.following ? { ...state, following } : state
}

/** 回底：复跟 + 药丸清零（`docs/desktop/design/RENDERER.md` §3 回底按钮）。 */
export function returnToBottom(state) {
  if (state.following && state.pendingNew === 0) return state
  return { ...state, following: true, pendingNew: 0 }
}

/** 开标签：同键去重（另置活动）；新键 ⇒ 序追加 + 置活动。 */
export function openTab(state, key) {
  const exists = state.tabs.includes(key)
  return { ...state, tabs: exists ? state.tabs : [...state.tabs, key], activeTab: key }
}

/** 关标签：不变量 —— 关活动 ⇒ **邻位接管（优先右邻、无右邻取左邻）**；关唯一标签 ⇒
 *  `activeTab = null`；关非活动 ⇒ 活动键不变；键不在列表 ⇒ 原态。 */
export function closeTab(state, key) {
  const index = state.tabs.indexOf(key)
  if (index < 0) return state
  const tabs = state.tabs.filter((tab) => tab !== key)
  if (key !== state.activeTab) return { ...state, tabs }
  const activeTab = tabs.length === 0 ? null : tabs[Math.min(index, tabs.length - 1)]
  return { ...state, tabs, activeTab }
}

/** 关闭确认判据（判据**单源** —— 视图只消费：`docs/desktop/design/UI.md` §1 交互行）：标签状态码集
 *  ∩ `{approval, running}` ≠ ∅ ⇒ 需确认（**不含者直接关**）；入参形与 `deriveTabBadge` 同（码集），
 *  非数组 ⇒ 假（状态面缺省防御）。 */
export function needsCloseConfirm(codes) {
  if (!Array.isArray(codes)) return false
  return codes.includes("approval") || codes.includes("running")
}

/** 关闭请求（关闭控件出口）：键不在 `tabs` ⇒ **原态**（拒）；需确认（`needsCloseConfirm`）⇒ 置 `pendingClose`
 *  = 本键（`tabs` / `activeTab` 不动 —— 确认面重挂触发）；不需 ⇒ **直接 `closeTab`**（守卫内化，调用面零分支）；
 *  同键已待确认 ⇒ 原引用（无变化）。 */
export function requestCloseTab(state, key, codes) {
  if (!state.tabs.includes(key)) return state
  if (!needsCloseConfirm(codes)) return closeTab(state, key)
  return state.pendingClose === key ? state : { ...state, pendingClose: key }
}

/** 确认关闭（确认键出口）：无待确认键 ⇒ **原态**；有 ⇒ `closeTab` + 清键（邻位接管律不变）。 */
export function confirmCloseTab(state) {
  if (state.pendingClose == null) return state
  return closeTab({ ...state, pendingClose: null }, state.pendingClose)
}

/** 取消关闭（取消键出口）：无待确认键 ⇒ **原态**；有 ⇒ 清键（`tabs` / `activeTab` 不动）。 */
export function cancelCloseTab(state) {
  return state.pendingClose == null ? state : { ...state, pendingClose: null }
}

/** 左列行形态（**换形态态单源** —— `docs/desktop/design/UI.md` §1 左列会话行 · 批 A ④；沿 `pendingClose` 先例）：
 *  `{ key, mode }`，`mode ∈ {rename, delete}`（闭集 —— 表外面拒收）；键 / 模式形不合 ⇒ **原引用**（拒收）；
 *  同键同形 ⇒ 原引用（无变化）。行键域 = 会话行串键（与行控件 `data-slot` 同域）。 */
export function openRailForm(state, key, mode) {
  if (typeof key !== "string" || (mode !== "rename" && mode !== "delete")) return state
  if (state.railForm?.key === key && state.railForm.mode === mode) return state
  return { ...state, railForm: { key, mode } }
}

/** 收形（取消 / 应用两出口共用尾）：无形态 ⇒ **原态**；有 ⇒ 清空（`tabs` / `activeTab` 不动）。 */
export function closeRailForm(state) {
  return state.railForm == null ? state : { ...state, railForm: null }
}

/** 标签状态位（T-DSK20 数据面）：四值码，优先序 待审批 > 运行中 > 完成 > 空闲；空集 ⇒ `"idle"`。
 *  词面映射（码 → 文案）归视图批 —— 本处不出词（批档 §2.6 D-5）。 */
export function deriveTabBadge(states = []) {
  if (states.includes("approval")) return "approval"
  if (states.includes("running")) return "running"
  if (states.includes("done")) return "done"
  return "idle"
}

/** 池折叠（`docs/desktop/design/UI.md` §2 项 1 行：折叠态按会话记忆——键 = 会话键）三支：
 *  命中 ⇒ 翻转 · 缺键 ⇒ 落 `true`（首击折叠，无需先写槽）· 非串键 ∨ 目标值 ≡ 现值 ⇒ **原引用**。 */
export function togglePool(state, key) {
  if (typeof key !== "string") return state
  const collapsed = state.poolCollapsed ?? {}
  const current = collapsed[key]
  const next = current !== true
  return next === current ? state : { ...state, poolCollapsed: { ...collapsed, [key]: next } }
}

/** 满队常量（**单源** —— `pool.queue` 队长上限；池面队列族与输入区共用同一个数）：
 *  设计面只点名「常量单源」（`docs/desktop/design/UI.md` §1 输入区行 / §2 项 1「队列入池」）而**未定值** ——
 *  值 8 = 本档实施选择（满队判据 / 提示行 / 不入队三事皆与该值无关）；披露 = 批次档 §5。 */
export const QUEUE_MAX = 8

/** 队列写面（`pool.queue` **唯一写面** —— 三纯动作 + 常量单源；条目形 `{ title, status: "queued" }`，
 *  形单源 = 池面队列条目消费集 `renderer/views/activity.mjs:119-125`）：
 *  ① `enqueue(state, title)` —— 尾追一条；**满队**（队长 ≥ `QUEUE_MAX`）∥ 非串 / 空白串 ⇒ **原引用**（不收）；
 *  ② `dequeue(state)` —— 摘队首（只减不取值：值面读 `state.pool.queue[0]` —— 回合尾 flush **先发后出队**）；
 *  ③ `drainQueue(state)` —— 排空队列（关页 / 复位路径）；空队 ⇒ **原引用**。
 *  三动作皆态进态出（拒收 / 无变化 ⇒ 原引用 ⇒ 零通知 —— 同本档其余纯函数）。 */
export function enqueue(state, title) {
  const pool = state.pool ?? {}
  const queue = Array.isArray(pool.queue) ? pool.queue : []
  if (typeof title !== "string" || title.trim() === "" || queue.length >= QUEUE_MAX) return state
  return { ...state, pool: { ...pool, queue: [...queue, { title, status: "queued" }] } }
}

/** 摘队首：空队 ⇒ 原引用。 */
export function dequeue(state) {
  const pool = state.pool ?? {}
  const queue = Array.isArray(pool.queue) ? pool.queue : []
  if (queue.length === 0) return state
  return { ...state, pool: { ...pool, queue: queue.slice(1) } }
}

/** 排空队列：空队 ⇒ 原引用。 */
export function drainQueue(state) {
  const pool = state.pool ?? {}
  const queue = Array.isArray(pool.queue) ? pool.queue : []
  if (queue.length === 0) return state
  return { ...state, pool: { ...pool, queue: [] } }
}

/** 设置族切片补丁：逐键 `Object.is` 比较 ⇒ 至少一键变更才落新引用；非对象补丁 / 无变化 ⇒ **原引用**
 *  （引用等值 ⇒ 零通知 —— 视图层可据引用短路）。值面（四段读数 / 向导 / 校验结果）归接线层填。 */
export function patchSettings(state, patch) {
  if (patch === null || typeof patch !== "object") return state
  const current = state.settings ?? {}
  const next = { ...current }
  let changed = false
  for (const [key, value] of Object.entries(patch)) {
    if (Object.is(current[key], value)) continue
    next[key] = value
    changed = true
  }
  return changed ? { ...state, settings: next } : state
}

/** 配置档读数**三态归一**（`docs/desktop/design/UI.md` §1 首启向导行）：真 = 已配 · 假 = 未配 ·
 *  其余（缺片 / 非布尔 —— 读失败与畸形档）⇒ `null` = **未知**（未知**不落假**：向导闸只认显式假，
 *  畸形档 ⇒ 向导不进、设置面可进 —— 批档 §2.10 项 3）。 */
export function configuredFlag(value) {
  if (value === true) return true
  if (value === false) return false
  return null
}

/** 向导步进（步域 1..3 闭集）：越界 / 非整数 / 同值 ⇒ **原引用**（无变化零通知）。 */
export function setWizardStep(state, step) {
  const wizard = state.settings?.wizard ?? {}
  if (!Number.isInteger(step) || step < 1 || step > 3 || wizard.step === step) return state
  return patchSettings(state, { wizard: { ...wizard, step } })
}

/** 向导退场旗（**会话内幂等**：再置 ⇒ 原引用；旗随会话走 —— 下次冷启动重新过闸，可重入）。 */
export function dismissWizard(state) {
  const wizard = state.settings?.wizard ?? {}
  if (wizard.dismissed === true) return state
  return patchSettings(state, { wizard: { ...wizard, dismissed: true } })
}

/** 状态树：**单一持有点** = 闭包内 `state`；`get()` 给现态，`set(next)` 逐键比较 + 变更通知。 */
export function createStore(seed = initialState()) {
  let state = seed
  const listeners = new Set()
  let draining = false
  const pending = []

  function notify(changed) {
    pending.push(changed)
    if (draining) return
    draining = true
    try {
      while (pending.length > 0) {
        const keys = []
        for (const group of pending.splice(0)) for (const key of group) if (!keys.includes(key)) keys.push(key)
        for (const listener of [...listeners]) {
          try { listener(state, keys) } catch (err) { console.error("[store] listener failed:", err) }
        }
      }
    } finally {
      draining = false
    }
  }

  return {
    /** 订阅 → 退订函数（通知期内的退订当轮即生效 —— 快照迭代）。 */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    /** 现态（引用等值可作短路判据）。 */
    get() { return state },
    /** 逐键 `Object.is`：至少一键变更才通知（`changedKeys` 序稳定）；无变更 ⇒ 零通知、原态。 */
    set(next) {
      if (next === null || typeof next !== "object") return state
      const changedKeys = []
      let nextState = state
      for (const [key, value] of Object.entries(next)) {
        if (Object.is(state[key], value)) continue
        if (nextState === state) nextState = { ...state }
        nextState[key] = value
        changedKeys.push(key)
      }
      if (changedKeys.length === 0) return state
      state = nextState
      notify(changedKeys)
      return state
    },
  }
}

/** 单例（引导面与视图面共用一棵树 —— `renderer/app.mjs` 持此引用）。 */
export const store = createStore()
