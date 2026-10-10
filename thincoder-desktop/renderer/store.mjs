/**
 * store.mjs — 渲染面单状态树（`docs/desktop/design/SHELL.md:32` · `docs/desktop/design/RENDERER.md:17`）：
 * 单一持有点 + 订阅（**变更触发** · 等值零通知 · 通知中再变更不递归）。
 * 面域 = 会话 / 块与历史 / 活动池 / 设置族 —— 数据面切片 = 块 / 历史回填 / 跟滚（会话模型轮 R13：
 * 标签族三切片 `tabs` ∕ `activeTab` ∕ `pendingClose`＋关闭确认四纯动作、左列行形态 `railForm` 两纯动作随会话模型
 * 裁撤退场 —— 活动会话单源 = `activeSession`，会话控制面内态〔开合 ∕ 换形〕归 `renderer/mount-sessions.mjs` 面内记账）；
 * 会话族与活动池切片随各自批次填充。
 * 批 9 增 `settings` 切片（开合 / 四段三态 / 向导 / 校验结果 —— `docs/desktop/design/UI.md` §1 设置面行）——**值面归接线层**（`renderer/mount-settings.mjs` 只经
 * `patchSettings` 落值），本档只持槽位 + 四条纯动作；`configured` 为**三态读数**（`null` = 未知）。
 * **B10 W2 增三键**（`settings.providers` 切片 —— S1 ∕ S2 面）：`edit`（行内钥编辑态 = 渠名；写者 = 出口，`loadProviders` ∕ 关面复位）· `probe`（「拉取模型」三态果 `{ state, models, reason }`）· `draft`（表单暂存值回填快照 —— 探果写切片致重挂时救回未落盘输入）。
 * **三端对齐批增一键**（2026-10-07 · 台账 #1027–#1029 · KD-75 ③）：`addShape`（添加弹窗**形状唯一源** ——
 *  值 = 类型选择现值：预设名 ∥ `"custom"`；缺省 `"preset"`；写者 = 出口族 `onAddShape`，开 ∥ 关弹窗 ∥ 写成功径复位）。
 * **桌面残余三轮 · 波 C 增一键**（#615② —— 改钥失败径草稿种子）：`keyDraft`（`{ name, value }` ∕ `null` —— 设 ∕ 改钥失败 ⇒ 键入值落此槽，重挂后行内输入按名回填；
 *  成功 ∕ 取消 ∕ 开面 ∕ 关面四处复位；写者 = `renderer/mount-settings-segments-providers.mjs`）。
 * R3a 增四槽（D17 状态行读数面 —— `renderer/views/statusline.mjs` 读面）：`turns` / `turnStarts` / `tokens` / `timers`（后两槽 = `ev:usage` 载荷扩）。
 * **timer-wake 阶段 2 增一槽** `timerNotice`（**到期触发切片** —— 写者 = 归约面 `ev:timer`；读面 = 流内触发行 `renderer/views/chat-chrome.mjs`；
 *  与 `timers` 读数槽两回事（后者 = 在途计数投影）；非落盘件 ⇒ 首屏页读整置即失 —— `renderer/page-read.mjs`）。
 * **R4 增两槽**（提示锚 + 状态面）：`statusText`（**状态文本切片** —— 按会话键；写者 = 归约面 `ev:statusText`
 *  （出档 `renderer/events-status.mjs`）；读面 = 状态行段 3 支③五 kind）· `compress`（**压缩状态行切片** —— 按会话键；
 *  写者 = 归约面 `ev:compress`；读面 = 流内压缩行 `renderer/views/compress-status.mjs`；非落盘件 ⇒ 首屏页读整置即失）。
 * R3b 增一槽（D20 子 agent 面 —— `renderer/views/activity.mjs` 读面）：`subBlocks`（**按会话键分槽**：
 *  `{ [会话键]: 块模型[] }`；写者 = 归约面 `ev:subagent`（核态机 —— `/rc/subblocks/state.mjs`）；同笔**摘工具行**
 *  —— `pool` 切片不再载 `blocks`（工具调用面 = 对话流工具卡 —— `docs/desktop/design/UI.md` §1 本批注项 2）。
 * 纯数据面：零 DOM / 零 IPC；零 `node:` / 零裸包（渲染面静态闭包判据）。
 *
 * 语义（批档 §2.4（f）· §2.5 U28–U32）：
 *   ① 切片操作 = **纯函数**（`appendBlock` / `beginBackfill` / `endBackfill` / `setFollowing` /
 *      `returnToBottom` / `togglePool` / `patchSettings` / `setWizardStep` / `dismissWizard` /
 *      `setAttachDegraded`）—— 返回**新态**；拒收 / 无变化 ⇒ **原引用**（引用等值 ⇒ 零通知，视图层可据引用短路）；
 *      排队消息面（快照镜面 `applyQueue` + 满队常量 `QUEUE_MAX`）已出档 `renderer/queue.mjs`
 *      （拆分产出 —— 「回合中插入」批收正：原三纯动作随本地队列退场），本档不再持该族；
 *   ② `set(next)` 逐键 `Object.is` 比较（`next` = 补丁（局部键）或整态（全键）—— 同一路径：
 *      `store.set(appendBlock(store.get(), block))`），**至少一键变更才通知**；回执 = `(state, changedKeys)`；
 *   ③ 通知期内的再 `set` **入队** —— 当前轮通知跑完再发（不递归、不丢、合并后一次性通知）；
 *   ④ 工艺常量（`MAX_RENDER_BLOCKS = 150` / 跟滚 24px / 药丸 420ms 窗 / 标签宽）归**视图批** —— 数据面只收参数
 *      （`limit` / `{ page }`），不内联常量（批档 §2.6 D-4 ·
 *      `docs/desktop/design/RENDERER.md` §2 / §3）；
 *   ⑤ 监听器异常面：逐个捕获（记 `console.error`）+ `draining` 由 `finally` 复位 —— 单个监听器抛错
 *      既不吞同轮其余监听器，也不堵死此后派发（不静默丢通知）。
 */

/** 初态：`locale` 由引导面置位；`project` / `sessions` / `pool` 槽位在、消费面随后续批。
 *  `tabBadges` / `sessionMeta` / `poolCollapsed` = **槽位注册**（消费面已在册 —— 输入区候选面读
 *  `sessionMeta`（`renderer/composer-sync.mjs`）、会话控制条目位标 ∕ 状态行告警位读 `tabBadges`、池面折叠读 `poolCollapsed`）⇒ 注册后零行为变化；
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
 *  同源（活动会话在飞块数——范归约面写；`pool` 切片不再载 `blocks`——摘工具行）。`goal` = **目标面切片**（R5 · B10：
 *  按会话键存 `{ status, objective, criteria }`（写者 = 归约面 `ev:goal`——宿主桥按核 `agent.goal` 单源投影；
 *  读面 = 目标卡 `renderer/views/goal.mjs` ∥ 状态行 🎯 非段位元素）；非载体 / 缺键 ⇒ 该会话零节点 —— 禁假造）。`ledger` = **账本警示切片**
 *  （账本可靠批 · 桌面微轮：写者 = `renderer/session-wire.mjs` `refreshRail` 唯一写路径；读面 = 会话控制下拉首行注记）。
 *  `pending` = **排队消息切片**（「对齐第二批」项 2 · **「回合中插入」批收正**）：`{ [会话键]: string[] }`
 *  —— A9 收正形：元素 = 文本串（宿主出站 `items` 恰形；`ts` 留宿主内部载体）；
 *  **宿主单源快照的镜面**（写者 = `renderer/events.mjs` `ev:queue` 归约 ∥ `renderer/page-read.mjs` `applyPage`
 *  首屏重建 —— 原输入区三纯动作退场）；读面 = 输入区上方待发送带 / 状态行段 14（本会话队）。
 *  同笔 `pool.queue` = **席位保留 · 零写者**（用户排队消息改住输入区上方待发送带（`pending` 镜面）—— 右列「队列」族不再承载；族空 ⇒ 零节点恒不在场）。
 *  `attachDegraded` = **附件降级码切片**（「回合中插入」批）：按会话键存降级码（`non-vision` / `partial`）——
 *  写者两处 = `ev:queue` 消费回执（`delivered.degraded` 浮出）∥ 输入区直发回执；读面 = 输入区提示行
 *  （`renderer/mount-composer.mjs` 挂件锚 `data-composer-notices` 内 —— 经 `degradedCode` 过闸，表外码 ⇒ 零节点）。
 *  **主题切换批增一槽**（D33 · 台账 #743）：`theme`（顶层切片 —— 三值闭集 `system` ∥ `light` ∥ `dark`；写者两处 =
 *  装配播种 ∥ 设置面出口（`renderer/theme.mjs` = `data-theme` 唯一状态写者，本切片 = 其镜面）；读面 = 设置面头三态钮
 *  —— `renderer/mount-settings.mjs` `SETTINGS_KEYS` 重绘键）。
 *  `modelCandidates` = **模型候选切片**（输入面板上提批 · R1 ∕ 全渠扇出批收正 —— 核件面板读面③ `state.models()`
 *  的端侧来源）：`{ models, unavailable }`（`models` = 逐项 `{ id, label, provider, group, reasoning }` —— **核件面形**；
 *  投影 = `renderer/composer-sync.mjs` 候选面：`model:catalog` 回执投影；`unavailable` = 失败渠 `{ provider, reason }`
 *  诊断面（现时视图零消费 —— 诊断主载 = 核落账，禁假造）；未取 / 取失败 ⇒ 空表（禁假造）；写者单点 = 纯动作 `setModelCandidates`。
 *  `helpLines` = **`/help` 行集切片**（`/help` 增量 · 2026-10-01② · 台账 #761）：按会话键存 `{ kind, text }` 行集（核 `formatHelp` 产出）；写者单点 = 纯动作 `setHelpLines`
 *  （端装配面 `printHelp` 口）；读面 = 流内帮助行族（非块节点 · 尾组槽位 —— `renderer/views/chat-chrome.mjs`）；非落盘件 ⇒ 首屏页读整置即失（同 `timerNotice` 族）；
 *  **行痕族三员清点时机 = 两门**（行痕族消失时机批 · 2026-10-04 · 台账 #919；timer 员并入 · 2026-10-05 · 台账 #952）：`helpLines` ∥ `stopMark` ∥ `timerNotice` 首屏门保留 + 回合起跑门（`msg:send` 出站即清 —— 单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74）。
 *  `stopHold` = **晚到 `stopped` 丢弃闩切片**（同批）：按会话键置真（回合起跑门簿记）——闩开窗内（出站起、本键回合首帧前）到达的 `stopped` **只弃痕写**（`renderer/events.mjs` `withStopMark` 单点门；回合尾其余结算零触）；
 *  开门 = 本键回合首帧（`turn` 事件 ∧ 此前非 running —— 与 `turnStarts` 起刻同判，摘闩住 `renderer/events.mjs`）；**门簿记非痕**：闩不入首屏五清（首屏页读不摘 —— 防清后失守）、不入 `CHAT_KEYS`（零渲染依赖 —— 闩单独写 ⇒ 零重绘）。
 */
export function initialState() {
  return {
    locale: "en",
    theme: "system", // 主题三态切片（D33——装配播种 ∥ 出口写；缺省 `system`；`data-theme` 应用住 `renderer/theme.mjs`）
    project: { cwd: null, recent: [] },
    sessions: [],
    activeSession: null,
    ledger: null,
    tabBadges: {},
    sessionMeta: {},
    sessionFlags: {},
    usage: {},
    turns: {},
    turnStarts: {},
    tokens: {},
    timers: {},
    timerNotice: {},
    statusText: {}, // R4：状态文本切片（按会话键 —— 五 kind；写者 = 归约面 `ev:statusText`；读面 = 状态行段 3 支③）
    compress: {}, // R4：压缩状态行切片（按会话键 —— 单元素四态；写者 = 归约面 `ev:compress`；读面 = 流内压缩行）
    helpLines: {}, // `/help` 行集切片（按会话键 —— `{ kind, text }[]`；写者 = `setHelpLines`；读面 = 流内帮助行族）
    stopHold: {}, // 晚到 `stopped` 丢弃闩（回合起跑门簿记 —— 按会话键；写者 = `clearTurnTraces` ∥ 摘闩 = `renderer/events.mjs` 回合首帧；门簿记非痕：不入五清 ∥ 不入 CHAT_KEYS —— 零重绘；单源 = KD-74）
    goal: {}, // R5：目标面切片（按会话键 —— `{ status, objective, criteria }`；写者 = 归约面 `ev:goal`；读面 = 目标卡 ∕ 状态行 🎯）
    subBlocks: {},
    pending: {},
    attachDegraded: {},
    modelCandidates: { models: [], unavailable: [] },
    providerState: null, // #841：provider 态投影切片（三回执族写者 —— `history:page` ∥ `msg:send` 成功 ∥ 设置写成功；读面 = 输入区提示带明示行；`null` = 未达 ⇒ 零节点，禁假造）
    blocks: [],
    flowOps: [], // 流面作业单（结构变更由发生点带上 —— 写口单点 = `withFlowOp`；段 = 帧出口结算后清账）
    history: { hasOlder: false, inFlight: false, page: null },
    following: true,
    pendingNew: 0,
    pool: { running: 0, approval: 0, queue: [], approvals: [] },
    poolCollapsed: {},
    settings: {
      open: false,
      notice: null,
      modal: null, // 组弹窗切片（D39 ∥ D38 · #817：`null` ∥ 组名十值闭集——七段名 + `providerAdd`（三端对齐批 · KD-75 ①②）∥ `mcpForm` ∥ `consultAdd`（添加入口弹窗统一批 · KD-77 ①②）；写者 = `renderer/mount-settings.mjs` `openSettingsModal` ∥ `closeSettingsModal`）
      configured: null,
      // 步初值 = 路由屏（`"route"` —— 登录面补全批：首启两路路由屏为第一屏；闭集见 `WIZARD_STEPS`）。
      wizard: { step: "route", dismissed: false, notice: null },
      providers: { state: "none", presets: [], providers: [], edit: null, probe: null, draft: null, keyDraft: null, addShape: "preset" },
      verify: null,
      model: { state: "none", provider: null, current: null, models: [] },
      agent: { state: "none", fields: [] },
      mcp: { state: "none", servers: [], details: {}, form: null },
      // R7 两新段（env = proxy ∕ shell；models = consult ∕ advisor 行两 picker）与 tools 段键族（R2 起自持）：
      env: { state: "none", proxy: { uri: "", web: true }, shell: { current: null, candidates: [] }, test: null },
      // tools 段：`keys` 初始 `null`〔键面读数未达〕⇒ 两 key 行零节点（首读落位后成对象）；`edit` = 行内编辑态。
      tools: { state: "none", status: null, building: false, keys: null, edit: null },
      models: {
        state: "none", consult: [], advisor: { provider: null, model: null },
        picker: { provider: "", rows: [], model: null },
        advisorPicker: { provider: "", rows: [], model: null },
      },
    },
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

/** 流面作业单写口（**唯一写口** —— 与 `blocks` 写同笔；单源 = `docs/desktop/design/RENDERER.md` §1.1「流面作业单」条）：
 *  结构变更由**发生点**带上作业（有序单；帧出口结算后清账）——`{ kind: "build" }`（整置 —— 页回执首屏 ∥ **回填页并入**
 *  （回填落位批 · 2026-10-04） ∥ 换会话 ∥ 关页 ∥ 摘至零块）· `{ kind: "insert", index }`（按位插入 —— 座次位，#765 在册面）·
 *  `{ kind: "cut", index }`（退流 —— 本地先行回声按引用摘）；**新块到达零作业**（追加由账自明）。
 *  入单校验面 = 帧侧 `flowStep`（畸形项静默跳过，帧尾随清账）。 */
export function withFlowOp(state, op) {
  return { ...state, flowOps: [...(state.flowOps ?? []), op] }
}

/** 窗口切片（T-DSK17 数据面 · **留档块记账** = `docs/desktop/design/RENDERER.md` §2）：`visible` = 尾 `limit` 块
 *  （**引用等值**）；`hidden` = 未渲染更早块数 = **页读域可回填块数** —— 留档块（`kind === "subagent"`：
 *  **留档批 · #719 收正** —— 页读域第六型，**页读有源**）与五型同规：退出尾窗 ⇒ **计入** `data-hidden` ∥
 *  折摘要块 ∥ 可回填（原「运行期块退出尾窗不计入」例外退场）；
 *  正整数 `limit` ⇒ 尾窗切片；`limit ≤ 0` / 非整数 ⇒ 防御档（`visible` 空、未渲染 = 全量）。 */
export function visibleWindow(blocks, limit) {
  const shown = Number.isInteger(limit) && limit > 0 ? Math.min(limit, blocks.length) : 0
  const hidden = blocks.length - shown
  return { visible: blocks.slice(blocks.length - shown), hidden }
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

/** 位标状态位（T-DSK20 数据面 · 会话模型轮 R13：消费面 = 会话控制条目位标 ∕ 状态行跨会话告警位）：四值码，
 *  优先序 待审批 > 运行中 > 完成 > 空闲；空集 ⇒ `"idle"`。词面映射（码 → 文案）归视图批 —— 本处不出词（批档 §2.6 D-5）。 */
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

/** 附件降级码切片写（纯动作 —— 「回合中插入」批：输入区降级提示行载波，按会话键）：写者两处 = `ev:queue`
 *  消费回执（`renderer/events.mjs` —— `delivered.degraded` 浮出）∥ 输入区直发回执（`renderer/mount-composer.mjs`
 *  —— 受理径回执 `degraded`）；`code` 非非空串（合 `null`）⇒ **清本键**（下次判决替换 / 清除）；同值 / 坏键 ⇒ **原引用**。 */
export function setAttachDegraded(state, key, code) {
  if (typeof key !== "string" || key === "") return state
  const table = state?.attachDegraded ?? {}
  const next = typeof code === "string" && code !== "" ? code : null
  if ((table[key] ?? null) === next) return state
  const out = { ...table }
  if (next === null) delete out[key]
  else out[key] = next
  return { ...state, attachDegraded: out }
}

/** `/help` 行集切片写（纯动作 —— `/help` 增量：端装配面 `printHelp` 口唯一写点）：键无效 ⇒ **原引用**；行集非数组 ∥ 空 ⇒ **清本键**；同值（同引用）⇒ 原引用；否则落新引用。 */
export function setHelpLines(state, key, rows) {
  if (typeof key !== "string" || key === "") return state
  const table = state?.helpLines ?? {}
  const next = Array.isArray(rows) && rows.length > 0 ? rows : null
  if ((table[key] ?? null) === next) return state
  const out = { ...table }
  if (next === null) delete out[key]
  else out[key] = next
  return { ...state, helpLines: out }
}

/** 回合起跑门清点（纯动作 —— 行痕族消失时机批 · 2026-10-04 · 台账 #919；timer 员并入 · 2026-10-05 · 台账 #952；单源 = `docs/desktop/design/RENDERER.md` §1.6 KD-74）：
 *  `msg:send` 出站时刻同笔调用（写者两处 = `renderer/composer-wire.mjs` `sendDirect` ∥ `sendQueued` 的 `call("msg:send")` 前沿）——
 *  ① 摘本键 `helpLines`；② 摘本键 `stopMark`；③ 摘本键 `timerNotice`（晚到到达照写照显——留至下一回合门）；④ 置闩 `stopHold[key] = true`（晚到 `stopped` 丢弃闩——门簿记非痕，
 *  开门 = 本键回合首帧住 `renderer/events.mjs`）。两门 = 幂等并集：键无效 ⇒ 原引用；三痕已空 ∧ 闩已在 ⇒ 原引用（等值零通知）。
 *  `compress` ∥ `digest` 两族零触（未裁零动——`compress` 观察项）。 */
export function clearTurnTraces(state, key) {
  if (typeof key !== "string" || key === "") return state
  const help = state?.helpLines ?? {}
  const marks = state?.stopMark ?? {}
  const notices = state?.timerNotice ?? {}
  const holds = state?.stopHold ?? {}
  let nextHelp = help
  if (help[key] !== undefined) { nextHelp = { ...help }; delete nextHelp[key] }
  let nextMarks = marks
  if (marks[key] !== undefined) { nextMarks = { ...marks }; delete nextMarks[key] }
  let nextNotices = notices
  if (notices[key] !== undefined) { nextNotices = { ...notices }; delete nextNotices[key] }
  const nextHolds = holds[key] === true ? holds : { ...holds, [key]: true }
  if (nextHelp === help && nextMarks === marks && nextNotices === notices && nextHolds === holds) return state
  return { ...state, helpLines: nextHelp, stopMark: nextMarks, timerNotice: nextNotices, stopHold: nextHolds }
}

/** 模型候选切片写（纯动作 —— 输入面板上提批 ∕ 全渠扇出批收正：核件面板读面③ `state.models()` 唯一写点）：
 *  `models` ∕ `unavailable` 非数组 ⇒ 空表；两者**同引用**（调用面未重取）⇒ **原引用**（零通知）；
 *  候选行数组 = 调用面新取（新数组）⇒ 落新引用。 */
export function setModelCandidates(state, models, unavailable) {
  const list = Array.isArray(models) ? models : []
  const missing = Array.isArray(unavailable) ? unavailable : []
  const held = state?.modelCandidates ?? {}
  if (held.models === list && held.unavailable === missing) return state
  return { ...state, modelCandidates: { models: list, unavailable: missing } }
}

/** provider 态投影切片写（纯动作 —— #841「provider 态投影注」）：核三态投影 `{ state, channel, model,
 *  reason, invalidReason }` 落切片；写者 = 三回执族三处（`renderer/page-read.mjs` 页读 ∥ `renderer/composer-wire.mjs`
 *  `msg:send` 成功 ∥ `renderer/mount-settings-exits.mjs` 设置写成功）；载荷非对象（键缺席 ∥ 形不合）⇒
 *  **原引用**（零写 —— 禁假造）；同引用 ⇒ 原引用。 */
export function setProviderState(state, payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return state
  return Object.is(state.providerState, payload) ? state : { ...state, providerState: payload }
}

/** 配置档读数**三态归一**（`docs/desktop/design/UI.md` §1 首启向导行）：真 = 已配 · 假 = 未配 ·
 *  其余（缺片 / 非布尔 —— 读失败与畸形档）⇒ `null` = **未知**（未知**不落假**：向导闸只认显式假，
 *  畸形档 ⇒ 向导不进、设置面可进 —— 批档 §2.10 项 3）。 */
export function configuredFlag(value) {
  if (value === true) return true
  if (value === false) return false
  return null
}

/** 向导步闭集（**登录面补全批收正** —— 步界单源 = `docs/desktop/design/SETTINGS.md` §2.6：`"route"` ∥ `"team"` ∥ 1–3；
 *  两屏（路由 ∥ 团队表单）的**表外值回落 `"route"`** 归显示面 `renderer/views/onboarding.mjs`（本表经其导入——零第二副本）。 */
export const WIZARD_STEPS = Object.freeze(["route", "team", 1, 2, 3])

/** 向导步进（步闭集 = `WIZARD_STEPS`——表外 / 同值 ⇒ **原引用**（无变化零通知））。 */
export function setWizardStep(state, step) {
  const wizard = state.settings?.wizard ?? {}
  if (!WIZARD_STEPS.includes(step) || wizard.step === step) return state
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
