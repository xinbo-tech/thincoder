/**
 * agent/family-tools.mjs — 家族矩阵单源（`assembleFamilyTools`）。
 *
 * 批次 `docs/batches/2026-09-15-vsc-tool-table-dup.md` §2.3A：家族矩阵（哪个运行面得哪些
 * 家族工具）自 CLI 侧 `agent/setup.mjs:173-293`（as-of 迁出前坐标）整体迁出——CLI 与 VSC 同调同一份实现
 * （消灭「同一角色矩阵两份实现」= 本批缺陷的类根因）；端差（VSC 装饰链 / settings 追加 /
 * consult 池来源）经 `decorate` 注入——**不传 = 核默认形态**（CLI = 迁出前逐字）。
 *
 * 返回 = 家族段数组（**非**工程模式：`[task, plan, timer, ...depth 家族 / 角色段]`；工程模式：
 * 固定段 = `[task, timer]`——plan 不入表，FR31 ① / KD8）——**不含** `agent.tools`
 * 展开与 `extraTools`（调用点各自展开：核 `agent/setup.mjs` 两段式）。
 *
 * 登记册**动态**载入：`agent-tools.mjs` 静态图经 consult/subagent 族可达核 agent 栈
 * （`../agent/setup.mjs` → `../memory.mjs` → `node:sqlite`）——静态引入会破端壳 W8 契约②
 * （`thincoder-vscode/test/engine-floor-guard.test.mjs`：端壳静态链不得到达 `node:sqlite`）。
 * 核内先例 = 登记册头注「Loaded from agent.mjs via dynamic import to avoid ESM circular
 * dependencies」（本档先于 `agent/setup.mjs` 的调用点载入，同一语义）。
 */
export async function assembleFamilyTools({
  depth,                 // number   0 = 主 agent；>0 = 子代理
  role = null,           // string   子代理角色（eng-coder / eng-designer / coder / consult / explore / …）
  engineering = false,   // boolean  depth-0 role enum 注入用（工程模式）
  consultModels = [],    // array    consult 池（[] ⇒ consult 工具不注册）
  batchDoc = null,       // string   batchSegment 绑定路径（eng 角色）
  decorate = null,       // object   端差面：{ subagent?, consultStart?, consultStop?, settings? }
} = {}) {
  // CORE-UNIFICATION TOOLS #83：consult 家族随统一登记册自 `../agent-tools.mjs` 取用（单一来源）
  const { planTool, subagentTool, taskTool, skillTool, goalTool, verifyTool, recentChangesTool, timerTool, advisorTool, engTool, readHistoryTool, batchSegmentTool, consultStartTool, consultStopTool, parentChannelTool } = await import("../agent-tools.mjs")
  // 写命令（主 agent 专用）——动态 import 且**仅 depth===0 载入**（ledger 链静态达 node:sqlite——
  // W8 契约②；子代理路径不注册 = 零载入——depth>0 解构得空、不引用即无副作用）
  const { ledgerAddTool, ledgerUpdateTool, ledgerCloseTool } = depth === 0 ? await import("../ledger.mjs") : {}

  // withPool: decorate the consult_start description with the CURRENT candidate pool
  // so the model knows which models it can pick (CLI parity with the plugin). The
  // retired escalate tool surface is now the subagent action:"escalate" — its pool
  // list is decorated onto the action property description below (same intent).
  const withPool = (tool) => {
    const models = consultModels
    const list = models.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")
    if (!list) return tool
    return { ...tool, description: tool.description + `\nCurrently configured consultants (this tool's pool): ${list}` }
  }

  // Role enum is mutually exclusive: normal mode has "coder", engineering mode has "eng-coder"/"eng-designer"
  const subagentRoles = (depth === 0 && engineering)
    ? {
        enum: ["explore", "eng-designer", "eng-coder"],
        description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        suffix: " In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for writing the requirements/design documents.",
      }
    : {
        enum: ["explore", "plan", "coder"],
        description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        suffix: "",
      }

  const filteredSubagent = depth === 0 ? {
    ...subagentTool,
    description: subagentTool.description + subagentRoles.suffix,
    parameters: {
      ...subagentTool.parameters,
      properties: {
        ...subagentTool.parameters.properties,
        role: { ...subagentTool.parameters.properties.role, ...subagentRoles },
        // §19: escalate 动作的候选池 = consultModels（缺省池首 / 指定 provider:model）。
        // 池装饰挂在 action 属性描述（原 escalate 工具注册时 withPool 同款意图——模型
        // 需要知道可选候选人）。escalate 在工程模式禁用——装饰只对正常模式有意义。
        action: (consultModels.length && !engineering)
          ? {
              ...subagentTool.parameters.properties.action,
              description: subagentTool.parameters.properties.action.description +
                `\nCurrently configured escalate candidates (agent.consultModels pool): ${consultModels.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")}`,
            }
          : subagentTool.parameters.properties.action,
      },
    },
  } : subagentTool

  // §18 D-E3 + ENGINEERING-MODE.md §2.15 D（第 2 批——参数化复用，不并列第二个 IIFE）：
  // 工程子代理（depth>0；eng-coder = 偏差审计 / eng-designer = 自己勘察）get a restricted
  // spawn channel — role enum limited to explore, NO async parameter (sync only) and action
  // pinned to spawn（§19 D-M3 restricted-variant action gate——escalate/check/status are
  // refused here at the schema level too；the mechanical re-check lives in subagent.mjs
  // execute → the §19 action gate + gateEngCoderSpawn (spawn-child.mjs) — schema enums are
  // advisory, providers don't enforce them）。描述文案按父角色分流（审计 vs 勘察）。
  const engChildRole = depth > 0 && (role === "eng-coder" || role === "eng-designer") ? role : null
  const engChildSubagent = engChildRole
    ? (() => {
        const props = { ...subagentTool.parameters.properties }
        // §19 review hygiene: the child channel is spawn-only sync explore — drop
        // async, the check/status params (id/n), the eng-coder token params
        // (designToken/designId are meaningless for a read-only spawn; the parent
        // spawn already carried the token) and batchDoc (an audit child derives no
        // batch parameter — its task book rides the mechanical summary of the
        // parent's _engTaskInput instead). Schema noise would invite the
        // model to pass irrelevant args.
        delete props.async // sync only — the parent blocks on the child's report
        delete props.id
        delete props.n
        delete props.designToken
        delete props.designId
        delete props.batchDoc
        // M5 F2（ENGINEERING-MODE-V2-MODULE-DELEGATION §1.2）：round 同理删除——勘察/审计
        // 通道 role=explore 唯一，F2 门豁免 → 该字段对子通道无意义（schema 噪音会诱模型
        // 传无关参数——同 batchDoc 删除理由）。
        delete props.round
        const designer = engChildRole === "eng-designer"
        props.role = {
          type: "string",
          enum: ["explore"],
          description: designer
            ? "explore only — the eng-designer's internal spawn channel is reserved for read-only surveys of the current state (≤6 spawns per batch)."
            : "explore only — the eng-coder's internal spawn channel is reserved for read-only divergence audits.",
        }
        props.action = {
          type: "string",
          enum: ["spawn"],
          description: `spawn only — the ${engChildRole}'s internal spawn channel is read-only (escalate/status/cancel/panel/consume-design/observe/send are refused: escalate spawns a coder+WRITE child, and the pool/panel actions have no async pool or panel mirror in a child context).`,
        }
        return {
          ...subagentTool,
          name: "subagent",
          description: designer
            ? "Spawn a read-only `explore` sub-agent to SURVEY the current state for the design: it reads code / docs / existing designs and reports evidence with file:line. BLOCKING ONLY (no async) and action:'spawn' ONLY — the survey channel is read-only; escalate/status/cancel/panel/consume-design/observe/send are not available. Survey budget: ≤6 explore spawns per batch — the main agent's survey result is reference only; do your own."
            : "Spawn a read-only `explore` sub-agent to AUDIT your delivery against the design: it compares the delivered code with the design for divergence — partially implemented acceptance criteria, silent simplifications, doc drift, changes outside the approved file list. BLOCKING ONLY (no async — the audit report decides your next protocol step). action:'spawn' ONLY — the audit channel is a read-only spawn; escalate/status/cancel/panel/consume-design/observe/send are not available. The audit task book is appended MECHANICALLY — your own spawn task (docs involved / acceptance criteria / file list) plus the files you actually touched; never hand the audit a self-written file list (a self-report could omit exactly the out-of-scope file it must catch).",
          parameters: { ...subagentTool.parameters, properties: props },
        }
      })()
    : null

  // consult 工具仅在配置时注册（consultModels 空池时注册会让模型调用后吃一个错误回合）——
  // §19: escalate 已并入常驻 subagent 的 action:"escalate"（无空池注册问题——动作在
  // 池空时返回既有错误语义，工程模式 fail-closed 在 execute 内拒绝）。
  // §25 D-R17a: consult_check 已退役（digest 自动注入是唯一消费通道）——consult 家族
  // 只剩 2 工具（consult_start/consult_stop——setup 注册点与描述面同步清零）。
  const consultTools = consultModels.length
    ? [decorate?.consultStart ?? withPool(consultStartTool), decorate?.consultStop ?? consultStopTool]
    : []

  const depthOnly = depth === 0
    ? [decorate?.subagent ?? filteredSubagent, skillTool, goalTool, engTool, verifyTool, recentChangesTool, readHistoryTool, advisorTool,
      ...consultTools,
      // 台账写命令（M2——仅主 agent；查询面 ledger_count 住基础集 tools/index.mjs）。
      // fail-closed：子代理不挂载 = 写面机械不可达。
      ledgerAddTool, ledgerUpdateTool, ledgerCloseTool,
      // 端差（decorate.settings——VSC depth-0 主 agent 面；缺省不追加）：核默认形态里
      // settings 住**基础集**（`tools/index.mjs` `assembleBuiltinTools`），端侧自持清单
      // 无该面 ⇒ 端以 decorate 补位（收敛通道 = 将来去 decorate 项即归核位）。
      ...(decorate?.settings ? [decorate.settings] : [])]
    // SESSION.md §6.9: read_history is depth-0 ONLY — a subagent querying "the session"
    // would mix its throwaway context with the parent's record (semantic confusion).
    // It is readonly:true, so planMode pass and no permission ask come automatically (T-S9).
    // Write-permission coder sub-agents (subagent role="coder" + escalate action):
    // the system prompt names verify (system.md) and advisor (discipline.md) — without them an
    // escalate hit "unknown tool" and fell back to bash node --check / npm test to
    // self-verify (2026-08-16 deepseek escalate diagnosis; plugin parity).
    // eng-coder: advisor + verify + the §18 audit-only subagent channel (D-E3).
    // eng-designer (§2.15 D): the survey-only subagent channel alone — no advisor
    // (it does not fire reviews) and no verify (its deliverable is documents, not code).
    // §2.20.3（第 4 批）：两分支各追加 batch_segment——目标档 = spawn 时绑定的
    // `batchDoc`（§2.20.2）；主 agent 不挂载（§1/§4/§6 走普通文档写）。
    // SUBAGENT-UPSTREAM-CHANNEL（AGENT-LOOP-SUBAGENT.md §6.27.4 装配接线）：子代理上行通道
    // （`notify_parent`）随 depth>0 段**前置**——4 处携带 = eng-coder / eng-designer / coder / 兜底段
    // （未列名 depth>0 role 落同一兜底段 ⇒ 亦装配；语义 =「depth>0 且非 consult 皆装配」）；
    // 计数口径：`consult` 分支不入 ⇒ 「5 个插入点」读法已作废（实读 `thincoder-core/agent/family-tools.mjs:165-169`）。
    // consult 段不入（其角色语义 = 父发起的一次性会诊，父在其 settle 前不期望中途对话）。
    : engChildRole === "eng-coder" ? [parentChannelTool, advisorTool, verifyTool, batchSegmentTool(batchDoc), ...(engChildSubagent ? [engChildSubagent] : [])]
    : engChildRole === "eng-designer" ? [parentChannelTool, batchSegmentTool(batchDoc), ...(engChildSubagent ? [engChildSubagent] : [])]
    : role === "coder" ? [parentChannelTool, verifyTool, advisorTool]
    : role === "consult" ? [recentChangesTool]
    : [parentChannelTool]

  // 固定段（装配序 = agent.tools → 固定段 → 家族段 → extraTools）：task/timer 全模式全深度；
  // plan 随模式位——ENG-PLAN-EXCLUSION（FR31 ① · KD8 卸载而非「注册 + 报错」· KD11 全深度两端）：
  // plan **不入表**（模型不可见——看不见的选项不会被选）；普通模式固定段逐字不变（FR31 边界）。
  // 判据 = 单一模式位 `engineering`（不带深度分支——子代理面随同排除，role enum
  // `:44-49` + spawn 门已同向）。
  return engineering
    ? [taskTool, timerTool, ...depthOnly]
    : [taskTool, planTool, timerTool, ...depthOnly]
}
