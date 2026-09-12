# 工程模式（Engineering Mode）——VS Code 独立实现

> 板块：工程模式——ThinCoder VS Code 的严格方法论工作流：design-before-code、
> 纪律层槽位提示词驱动、双门禁（设计评审 + 代码评审）。
> 提示词载体注（2026-09-10——PROMPT-SYSTEM 施工①③）：旧 engineering.md/engineering-sub.md 已退役——
> 工程纪律现驻 `src/prompts/discipline-engineering.md` + `persona-engineering.md`（装配链 = assemblePrompt
> 四槽位——蓝图 §3.2）；机制语义权威 = CLI 仓 `ENGINEERING-MODE（CLI 仓）`（§2.9 锚清单）。
> 与 `ENGINEERING-MODE（CLI 仓·设计）` 同名文档对应同一机制板块——各端独立实现，
> 内容以本端代码为准（本端 = `thincoder-vscode`；DOC-REORG-VSC）。
> 本文档为**架构级机制文档**：功能性需求以机制目标与约束表述；评审收敛/轮次衰减的
> 权威 = [ADVISOR-CONVERGENCE.md](ADVISOR-CONVERGENCE.md)；eng-coder 内部交付协议的
> 结构/接线概览 = AGENT-LOOP.md（VSC 端，DOC-REORG 建档）——本文档只写本端工程模式
> 自己的实现面（开关/guard/token/门禁/角色互斥/会话行为）。

## 0. 铁律（发起权与批准权归用户）

1. **设计评审只能由用户发起**——agent 准备并提醒"设计就绪，可以评审"，不自行调
   `advisor(type="design")`。
2. **打回后逐条呈递**——评审打回后每轮呈递发现 + 修复建议，**用户逐条拍板**再改。
3. **交付 code review 保持流程节点自动**——eng-coder 内部协议默认承担，不问用户。
4. **系统推回（guard）在工程模式一律关闭**——评审义务由 token/门禁机械链承担。

## 1. 目标与边界

工程模式把"设计先行、评审把关、验证收尾"提升为半机械流程：可硬拦的环节一律硬拦
（写文件门禁、token 校验、guard 推回、角色互斥），无法硬拦的靠
`discipline-engineering.md` / `persona-engineering.md` / `persona-eng-coder.md` / `persona-eng-designer.md` 纪律层与人格层槽位提示词约束（旧 `engineering.md` / `engineering-sub.md` 已随 PROMPT-SYSTEM 施工①退役）。核心承诺：**代码必须先有被评审过
的设计；评审对象由任务定义而非遍历猜测；评审循环在 eng-coder 内部闭环。**

本端实现面与 CLI 的差异只在于**平台接线**（webview 面板/会话槽位文件/extension 层）；
机制语义（token 格式、guard 语义、角色互斥、门禁判定）两端一致。下述全部以本端代码
为准。

## 2. 会话级模式开关（slot > config > false）

**`engineering` 与 `advisor.guard` 都是会话级**（2026-08-29 重构，修复跨端污染 bug：
旧设计只存 config.json 全局，CLI `/eng` 与 VS Code 设置面板都写它 → 两端互相翻转对方
的工程模式）。事实源 = **当前会话槽位文件**；config.json 的 `agent.engineering` /
`agent.advisor.guard` 降为 **CLI 兼容/可见性镜像**。

- **读取优先级（本端一致）**：slot 显式值 > config.json 兜底 > false。slot 无字段
  （旧槽位）→ 回退 config.json；slot 显式 `false` ≠ 未设置，压过 config 的 `true`。
  实现：`setup.mjs` 中 `engineering = engState?.enabled ?? cfgEngineering`；
  `advisorCfg.guard = engState?.advisorGuard ?? advisorCfg.guard ?? false`（slot 值在
  会话曾设置过时胜出；`null` = 从未设置 → config 兜底）。
- **engState 来源**：`panel-chat.mjs` 每回合从 `panel._activeData(turnSlot)` 读会话
  数据 → `engState = { enabled, advisorGuard, engDesignToken, engDesignTokens }`；
  挂起会话回合复用会话期捕获（进入期间禁切换）。`engState` 经 runOpts 传入
  `setupAgentRun` → 构造 agent 的 `config.agent.engineering` /
  `config.advisor.guard`。
- **写入路径（双写：slot 先、config 镜像后——slot 写失败不阻断 config 写）**：
  - `eng(enter/exit)` 工具（`src/agent-tools/eng.mjs`）：经 `_engPersist: {cwd,
    slot}` 通道（`setup.mjs` 从 opts 注入；**仅顶层**——子代理无 engPersist）→
    `setSlotEngineering` 写 slot；再 `persistRaw` 写 config 镜像。
  - 设置面板 ENG/GUARD toggle：`panel-messages.mjs` `setAdvisorGuard` /
    `setEngineeringEnabled` 消息 → `setSlotAdvisorGuard` / `setSlotEngineering` 写
    slot + `saveAgentSettingsFromPanel` 写 config 镜像 + `_pushSettingsLight` 反射。
  - `agentState()`（`run-helpers.mjs`）随每回合 saveLines 把 live
    engineering/advisorGuard + 多槽 engDesignTokens 带入槽位（**键存在性写**——slot
    无字段时才读 config 兜底；显式 null 清键防复活）。
- **初值链**：面板绑定槽位后，slot 值为会话事实源；config 只在 slot 从未设置时兜底。
  slot 写面实现 = `src/extension/session-slot-write.mjs`（`setSlotEngineering` /
  `setSlotAdvisorGuard` / `setSlotEngDesignTokens`——均为"loadSlotForWrite → 置字段 →
  saveSessionToSlot"，loadSlotForWrite 处理文件级新槽首写）。
- **guard 存槽 ≠ 机械推回**：guard 状态存槽只是会话级配置事实；工程模式下 guard 推回
  一律关闭（§0 铁律 4 + §4），存槽不改变这一点。

## 3. 评审能力恒启用 + guard opt-in

- **advisor 工具永远可用**（2026-08-21 语义重构）：旧 `advisor.enabled` 双义开关废弃
  ——评审能力无禁用开关，不配置也正常执行。开关收敛为 **guard**：
  `advisor.guard === true`（**默认 OFF**）时收尾推回强制评审；`false`/缺省 → 不推回。
  工具栏按钮消息 `setAdvisorEnabled` → **`setAdvisorGuard`**（本端消息名，见
  AGENTS.md 消息协议表）；按钮/设置面板状态读 `settings.advisor.guard`。
- **guard 推回（收尾注入——`run-stages.mjs` `maybeGuardPushbacks`）**，逐字前缀：

  ```
  [System reminder: you changed code in this run and MUST get an advisor review
  before finishing (round N). Call the `advisor` tool now. This is required, not
  optional — …]
  ```

  触发条件（逐项）：
  1. `advisor.guard === true`（OPT-IN）；
  2. **非工程模式**（`!agent.config.agent.engineering`——工程模式自有强制门，永不推
     回）；
  3. 本 run 有代码变更（`_mutatedThisRun` 且 `hasCodeMutations`——内容判定，见下）；
  4. 本 run 未评审（`!_calledAdvisorThisRun`）；
  5. 无在途 async 评审（`!advisorReviewInFlight`——未决不推回，等 settle 判定）；
  6. 推回次数与评审轮 < 上限（`MAX_ADVISOR_PUSHBACKS = 3`；评审轮
     `< MAX_ADVISOR_ROUNDS = 5`——超过 cap 不再推回，防 fix→pushback→cap-refused 死
     循环）。

- **内容级判定 `hasCodeMutations`（guard 共用单源）**：`_touchedFiles` 存绝对路径，
  用组件级匹配 `/(?:^|[\\/])src[\\/]/` **或**非文档路径判为代码——`src/` 下任何文件
  都是代码（含 `src/prompts/*.md`）；文档（`*.md`/LICENSE 等）不算。空
  `_touchedFiles` 时回退 `_mutatedThisRun`。
- **verify guard 同族 OPT-IN**：`agent.verifyGuard === true`（默认 OFF）——收尾时首次
  缺验推回 + 失败重试 ≤`MAX_VERIFY_RETRIES = 3`（run-stages.mjs 同文件实现）。

## 4. design token（无签名流程凭证 uuid:expiresAt）

- **签发**（`src/agent-tools/advisor.mjs`）：评审 0🔴 时 reviewer 以 `[DESIGN-TOKEN:…]`
  + designId 回显；引擎在通过时附 **Approved 后缀**（`buildApprovedSuffix`——sync
  settle 与 async settle 共用 builder）。token 由 `generateDesignToken` 生成 =
  `uuid:expiresAt`（无 HMAC 防伪层——2026-09-06 用户裁定"安全剧场"）；TTL 默认
  **7 天上限**（`TOKEN_TTL_DEFAULT_MS`），`agent.engTokenTtlMs` 可覆盖（非法值回退
  默认——永不静默关上限）。
- **格式校验 fail-closed**：`validateDesignToken` = `uuid:expiresAt` 恰好 2 段 + 数值
  时间未过期；**存量旧 3 段（含 HMAC）token 一次性格式错误失效**，需重新评审；
  畸形/NaN 一律判错（旧 fail-open 后门已封）。
- **多槽 Map + 槽文件权威台账（D5 2026-09-08——单值镜像已退役）**：通过后写 `agent._engDesignTokens.set(designId, token)`（多设计并行互不覆盖）+ **settle 当场同步写槽权威台账**（DESIGN-TOKEN-SETTLEMENT.md D1）。复审失败
  不碰任何槽（旧 token 存活至 TTL）；同 scope 复审沿用会话内同 designId
  （`designIdForScope`——sync/async 同构于 scope 记录）。旧 slot 残留单值镜像值由 `setup.mjs` **一次性迁移读**进 Map（legacy 兼容），此后零写。
- **R16 清理只删过期、三时机**：过期 token（格式有效且 TTL 已过）在
  (a) restore filter（`setup.mjs`——过期不入 Map/槽）、(b) `eng(enter)` sweep
  （`eng.mjs` `sweepExpiredDesignTokens`）、(c) spawn-gate slot 删除
  （`subagent-spawn-gate.mjs` `dropExpiredTokenSlot`）被删；畸形/不匹配只拒不删。
  token **跨模式开关存活**（OFF→ON/OFF 不清有效 token——mode toggle 不烧凭证）。
- **持久化**：多槽表随 `agentState()`（`engDesignTokens` 键）写槽 + async settle **当场同步 await 写槽**（D1——失败即 settle 失败，不 fire-and-forget）；`setup.mjs` restore filter 按 TTL 过滤读
  回 → 跨进程（重进/挂起后）TTL 内恢复。**会话内回合从槽新读 engState**（D3——弃入场快照）；spawn 门禁 miss 时回读槽 reconcile（D4）。

## 5. eng-coder spawn 门禁 + 链终消费

- **spawn 校验**（`subagent.mjs` execute → `subagent-spawn-gate.mjs`
  `authorizeEngCoderDesignToken`）：`resolveDesignSlot` 按 designId 定位槽
  （`_engDesignTokens.get(designId) === token`；缺 designId → 恰一槽；多槽歧义/找不到
  → throw 并附持有 id 列表）；格式 + TTL fail-closed。通过 → child 以
  `engDesignReviewed` 预授权 + spawn 侧 autoApprove 等效（`_engDesignReviewed = true`——
  免逐写询问：权限询问阶段整体跳过；其余前置门（JSON 解析/未知工具/planMode/design-token）
  先行且原样生效）。**错误信息即发现途径**——持久化恢复后父代理无 digest 可
  查 designId。
- **角色互斥**：非工程 enum `["explore","plan","coder"]`、工程 enum
  `["explore","plan","eng-coder","eng-designer"]`（`modeRoleField`——schema 首道防线 + execute 运行
  期硬门禁双保险；非工程模式禁 `eng-coder` 与 `eng-designer`）。运行期文案逐字：
  `Engineering mode: use role='eng-coder' for implementation tasks.` ·
  `Engineering mode is not active — role='eng-designer' is engineering-mode only (it writes the requirements/design documents inside the engineering workflow); use role='explore' or role='plan' for read-only work.`
- **链终消费（2026-09-07）**：`subagent action:'consume-design'`（`executeConsumeDesign
  Action`，`subagent-spawn-gate.mjs`）——父侧验收核销时显式调用，消费该 designId 槽 +
  镜像同步（mirror ∈ live slots 不变量已随 D5 退役——单值镜像删除，槽为唯一权威）；消费后再 spawn 同 designId = 机械拒；幂等
  （未知/已消费 = no-op 提示）。修正轮复用同槽（docs FIRST——落档再 spawn）；链未闭
  合（stalled/L2 非 clean/fix round 在途）不消费。

## 6. 写文件门禁（dispatch gate——`src/agent/tool-gates.mjs` `preGateBlocked`；修正轮 #3）

门禁在 plan-mode 检查之后、权限阶段之前（防绕过）；覆盖全部变更形态（写/删/改）。

- **eng-coder child 门禁**：`agent._role === "eng-coder" && engineering &&
  !agent._engDesignReviewed && FILE_MUTATORS` → 拦，文案：
  `Error: engineering design gate — call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent.`
- **父代理门禁**：`engineering && depth === 0 && !agentHasLiveEngSlot(agent) &&
  FILE_MUTATORS` → 用 `tool.touchedPaths` 收集路径，任一触碰代码
  （`/^src[\\/]/` 或 `!isDocFile(p)`——未知/缺路径保守视为代码）→ 拦，文案：
  `Error: engineering design gate — write the design document in docs/ first, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.`
- **豁免边界**：`docs/**` 与根级文档（写文档即设计步骤）放行；`src/` 下一切（含
  `src/prompts/*.md`）为产品代码，需 token。判定 `isDocFile` 在 `advisor/repos.mjs`。
- **D5 冻结窗口预闸（第 15 批 §14.4——本端）**：设计评审在途期间，父侧对被审文件集（含批次档）的写入被拒
  （`preGateBlocked` × `inflightDesignReviewConflict`——拒绝串见 `ADVISOR-CONVERGENCE.md` §14.4（c））。
  **在途下界 = 报告送达（digest 注入 / 回合尾 collect）或取消·中止**——「子进程退出」不是窗口边界
  （窗口 = 点火 → 结算）；逃生门 = 先 cancel → 改动 → 重发。（群 A 批§16.2——下界定义句同步。）

## 7. engineering 会话行为与 UI

- **system prompt**：工程模式（`engineering && (depth === 0 || role === "eng-coder" || role === "eng-designer")`）
  经 `assemblePrompt` 四槽位装配：eng-coder → `persona-eng-coder.md`+common+`discipline-engineering.md`、
  eng-designer → `persona-eng-designer.md`+common+`discipline-engineering.md`、
  engineering 主会话 → `persona-engineering.md`+common+`discipline-engineering.md`（PROMPT-SYSTEM 施工②
  ——旧 `loadEngineeringPrompt` + METHODOLOGY 降级警告已退役；蓝图 §3.4 降级链 = 槽缺失跳过+警告）。
- **模式 UI**：ENG 按钮/设置面板 toggle（消息 `setEngineeringEnabled`）；非工程模式
  subagent schema 不展示 eng-coder（§5 角色互斥）。活动面板渲染 advisor 活动块/取消
  按钮路由（`panel-messages.mjs` role=advisor）。
- **async advisor（R13）**：depth-0 缺省后台——`advisor(type="design")` 返回 ack，
  评审后台跑（`_asyncAdvisors` 池，ADVISOR_POOL_LIMIT=4 默认——agent.poolLimits.advisor
  可配——同 scope running 守卫——超限/同 scope 拒文案报生效上限——POOL-CONFIG-UNIFIED
  2026-09-09），settle → digest 自动回；
  design 评审 settle 后 token 入槽 + `_engPersist` 直写 slot（挂起期无 onComplete 通道
  的持久化路径）。depth>0 恒同步（eng-coder 内自审不翻转）。收敛语义（轮次/cap/prior
  随实例）见 ADVISOR-CONVERGENCE.md；实例机制权威 = AGENT-LOOP.md（VSC 端建档）。

## 8. 受影响文件（本端实现面）

| 域 | 文件 |
|---|---|
| 工具 | `src/agent-tools/eng.mjs`（enter/exit + sweep + 双写）、`advisor.mjs`（签发/校验/Approved）、`subagent.mjs`（role 门/互斥）、`subagent-spawn-gate.mjs`（resolveDesignSlot/authorize/consume） |
| agent 装配 | `src/agent/setup.mjs`（engState 读/restore filter/modeRoleField）、`run-helpers.mjs`（agentState/hasCodeMutations/上限）、`execute-tools.mjs`（dispatch 门禁）、`run-stages.mjs`（guard 推回） |
| 会话/面板 | `src/extension/session-slot-write.mjs`（setSlot*）、`session-io.mjs`、`panel-chat.mjs`（engState 读）、`panel-messages.mjs`（ENG/GUARD 消息） |
| 提示词 | `src/prompts/persona-engineering.md`、`persona-eng-coder.md`、`persona-eng-designer.md`、`discipline-engineering.md`、`common.md`（工程锚落点——旧 engineering.md/engineering-sub.md 已退役——PROMPT-SYSTEM 施工①③） |
| 评审 | `src/advisor/*.mjs` + `src/prompts/advisor-*.md`（见 ADVISOR-CONVERGENCE.md） |

## 9. 测试与验证

机制级行为（token 格式/TTL、角色互斥、dispatch 门禁、guard 条件、slot 双写、consume
幂等/隔离）经本端测试基建验证（TESTING.md §1 分层：L0+ 首实现 / L1 快层 / L2 链终
`test:full`）。逐字锚（guard 前缀句、角色互斥句、dispatch 文案）由 prompts 内容断言
防回退（fail-when-unchanged）。

新增台账可见面（LEDGER-SURFACE 批——机制与行文本权威 = `ENGINEERING-MODE（CLI 仓·设计）` §2.30，本节不重述）：
本端 `test/ledger.test.mjs`（入册 `test/files.mjs`）覆盖解析/计数/老化/阈值/去重/item 形态（含 tooltip 与 hide）/webview 行渲染。

**文档一致性机检（V1/V2/V3）与基线（本端原文自持）**：本端扫描器 = `scripts/check-doc-width.mjs`，基线档 = `test/fixtures/doc-consistency-baseline.json`。
**本基线必须保持为空**——新增违规一律红，**不得再入基线**（**入基线 = 例外 = 违规**，fail-closed：检查器对非空基线直接 FAIL）；
V3 判据射程 = 工具落地后（2026-09-11 起）创建的批次档（更早者的 §3 由父侧代写——结构性历史事实，不判）。

## 10. 已知取舍

1. 父代理无全面写文件门禁——必须能写 docs/；越权靠提示词（拦截型门禁覆盖产品代码）。
2. token 跨任务存活（链终消费制收口后仅链中存活）；无签名格式（uuid:expiresAt）防伪
   不声称——门禁可经工程模式开关绕过，无实际安全边界。
3. 门禁判定 `hasCodeMutations` 用绝对路径组件级匹配 `src[\\/]`——对存绝对路径的
   `_touchedFiles` 成立；multi-repo 时 advisor cwd 取主工作区，已知限制。
4. `verify` 收尾 guard 在工程模式同样被 token/门禁链取代（OPT-IN verifyGuard）。

## 变更记录（历史折叠——详见 git log）

- 2026-09-12（台账自持批·**基线清零 + 闸门收紧轮**——用户「残留即先例」裁定）：本端一致性基线**清空**（31 条逐条处置：V1 自洈 29 / V2 键失效 1 / V3 射程排除 1）· 检查器补「基线必须保持为空」硬规矩（非空即 FAIL——入基线 = 例外 = 违规）+ V3 判据射程（2026-09-11 起）；§9 补口径句。

- 2026-09-12：台账可见面批（LEDGER-SURFACE）——本端增量面登记：状态栏 item（含原生 tooltip）+ chat 流文本行
  （`ledgerNotice`）+ `src/ledger.mjs` / `src/extension/ledger-surface.mjs` / `webview/ledger-line.js`；
  机制与行文本权威 = `ENGINEERING-MODE（CLI 仓·设计）` §2.30（本端不重述）。

- 2026-09-11：群 A 批（VSC-MIRROR-SWEEP）——§6 补「D5 冻结窗口预闸」bullet（下界定义句入行——同步面 3/3；见 `ADVISOR-CONVERGENCE.md` §16.2）。

- 2026-08-24 ~ 09-07：机制逐批演进（发起权归用户 → 会话级 slot 开关 → designId 多槽
  → eng-coder 内部协议/default async → 无签名 token → 链终消费 → R16 清理三时机）——
  活机制已入正文各节；逐批需求/评审/实现流水账以 git 历史与 docs/TODO.md 为准。
- 2026-09-08：DOC-REORG-VSC 第 4 批建档——从 ARCHITECTURE §9 工程模式部分迁出正文，
  写全本端独立实现（§9 留 ARCHITECTURE 待后续批瘦身）。
- 2026-09-11：角色重定义批 RF-5c——跨仓登记面同步（零实现改动）：头注改「纪律层槽位提示词驱动」
  （与 CLI 端同口径）；§1 槽位清单 + §8 受影响文件表补 `persona-eng-designer.md`；
  §5 工程 enum 补 `eng-designer`（含第三门运行期文案）；§7 装配句补 eng-designer 分支。
