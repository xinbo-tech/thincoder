# Agent 主循环（agent 板块）——VS Code 扩展实现

> 板块：Agent 循环。本文件描述 VS Code 扩展侧 agent 主循环的**当前设计**——runAgent
> 回合驱动、循环控制/guard/中断、工具结果落盘与上下文注入、子代理单工具动作面、async
> 后台池与任务调度器、挂起回合与 digest、eng-coder 交付协议、会诊/飞刀/async advisor
> 异步化、子代理活动显示。与 CLI 同名文档对应同一机制板块——各端独立实现，内容以本端
> 代码为准。
> 权威源：`src/agent.mjs` + `src/agent/` + `src/agent-tools/subagent*` +
> `src/extension/`（挂起/唤醒接线）。实现为唯一事实源。
> 关联：`ENGINEERING-MODE.md`（工程模式/token 门）、`ADVISOR-CONVERGENCE.md`（评审
> 收敛）、`TOOLS.md`（工具注册/调度）、`SESSION.md`（会话）、`CONTEXT-COMPACTION.md`
> （压缩）、`CONSULTATION.md`（会诊）、`ESCALATE.md`（飞刀）。
> 注：ENGINEERING-MODE / ADVISOR-CONVERGENCE / TOOLS / CONTEXT-COMPACTION / WEBVIEW
> 为 DOC-REORG-VSC 后续批将建的 sibling 档——当下机制详情以本档正文与 ARCHITECTURE
> 对应节为准，建成后此处即权威归属。
> 2026-09-08：从 `ARCHITECTURE.md` §6/§8 迁出成立本档（DOC-REORG-VSC 第 1 批）——
> 写全 VSC 独立实现（不指 CLI）；ARCH 瘦身由后续批统一做。
> 2026-09-11：§7 输入门禁两句按 INPUT-LOCK-BEHAVIOR-REVISED 同步（旧 C' 态残留修订——第 22 批 C3；旧句：输入禁用 / readOnly 锁）。

## 未决 / 待办状态行（承接开放项——勿当历史折叠）

- `eng(enter)` 的用户同意门、design token 的用户批准点、拒绝文案降噪——CLI 同存，
  两端待议（VSC `docs/TODO.md`——产品级台账已退役：台账单仓化，现体 = 仓根 `docs/TODO.md`）。
- advisor 工具集与 CLI 的差异项（CLI advisor 有 lsp，本端侧待补）——VSC
  `docs/TODO.md`（产品级台账已退役——台账单仓化：现体 = 仓根 `docs/TODO.md`）。
- 挂起期进程级 reminder 注入含 ISO 时间戳且位于 time 注入之前——每进程首 run 缓存
  miss 一次（单次量级，可接受）——留待评估（`TODO（CLI 仓）`）。
- UI ⏹ 活动块 live 头缺逐轮 turn 段（现有状态事件不携 turn——逐轮跳动需扩展端新
  通道，触碰桥白名单，不擅建）——降级口径已定：池条目终态通知携真实终值，冻结身份
  头显示终值。**2026-09-12 收口（活动区收口批 C-11③/C-12 #4——`status:"turn"` 帧上屏）：
  本条由本批履行（设计权威 = `WEBVIEW.md` §14 C-11③；实现随批交付——批次档
  `2026-09-12-VSC-ACTIVITY-CLOSURE（本仓）`）。（修正轮 #2）**
- 行面板（子代理行 + consult 计数/回复 preview）**保留裁定反转（评审 #4——不得当历史
  折叠）**：B1 拆底部活动面板时裁"保留"（其独有载荷 = queued/waiting 行 + consult
  计数/回复 preview——开放项关闭）→ SESSION-ACTIVITY-REVISED（2026-09-09 用户裁定——
  行面板 = VSC 独有历史残留——双面根源）全撤：queued/consult 载荷迁活动区（等待块头/
  频道块 + 冻结 preview）——单面板形态一体满足用户三连（live 固定可见 + 一个面板 +
  CLI 一致）——#subagent-panel 自 index.html/CSS/panels.js 零残留（⑮ grep 锁）。

## 变更记录（历史折叠——详见 git log）
- 2026-09-12（VSC-CHILD-PERMISSION 批——子代理审批面对齐）：新增 §18（C-1..C-13 · KD-1..KD-8 · 用例 19 条 · AC-CP1..AC-CP9）；§1 模块地图两行（`tool-gates.mjs` / `child-permission.mjs`）与 execute-tools 行改写；R2 修正随批（`ESCALATE.md` 4 处 / `ENGINEERING-MODE.md` / `TOOLS.md` §8 / 本档 §8 同族句）。（修正轮 #3）
- 2026-09-12（活动区收口批——A 方案反转 + digest/块头/状态行/Send 对齐）：§1 模块地图行 · §7 挂起 UI / 中止语义 · §10 全节改写——权威 = `WEBVIEW.md` §14（§12 为沿革与反转注）；未决行「live 头逐轮 turn 段」加收口注（C-11③ 履行——修正轮 #2）。
- 2026-09-12（VSC-CONTEXT-PARITY 批·实现后同步——交付实测态对齐）：§17.6 行 12/13 实测回填（`repomap.mjs` 304 →
  结构债候选；`test/context-parity.test.mjs` 385 → 登记）+ 尾注「实现后同步」段（含语料波 `prompts-async-guidance` 535 指数）；
  §17.10 补登记（文档召回 `> heading` 段本端恒缺——索引无 heading 字段；模板逐字、条件省略）。纯登记与实测对齐、零契约语义变动。
- 2026-09-11（VSC-CONTEXT-PARITY 批·修正轮——设计评审轮次 1 #1~#10 落修）：§3 注入段改指针指 §17（消批后双描述）·
  §17.4+D-CI2 补 restarted 段去向注（原段删除）· §17.6/§17.11 计数对齐（15 档 = 源档 12 + 测档 3）+ run-stages
  结构债候选注 · §17.7 补 T-CI-2a/b/c 与 T-CI-3b、T-CI-5/T-CI-10 seam 计数落点、T-CI-11 跨仓只读 fail-closed——T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） ·
  §17.8 AC-CI-5 / §17.9 边界 / §17.11 KD-10 同步。纯口径与覆盖补全、零契约语义变动。
- 2026-09-11：活动区回归批（VSC-ACTIVITY-REGION-RESTORE）——块全程驻留固定活动区（区内出生 · 原地折叠 · 区内保留）；§1 模块地图行 / §7 挂起 UI 与中止语义 / §10 全节改写——权威 = `WEBVIEW.md` §12。
- 2026-09-11：群 B 批（VSC-REVIEW-ASYNC-SWEEP）**新增 §15**（advisor 池中止收口——`discardAbortedAdvisors` + C-10；§12.8 #1 收口注）**与 §16**（digest 注入预算统一 VSC 镜像——`digest-budget.mjs`）；§1 模块地图 +2 行（编号避撞：落档时群 A A11 §14 已占位，本批两节顺延 §15/§16）。
- 2026-09-11（群 B 批·修正轮——设计评审轮次 1 #2/#5/#6 落修）：§12.3 C-9 收口注（原「零改动」= 第 35 批排程口径——§16 净减迁出）· §16.3 `tag` 落处注明（落盘文件名后缀）· §1 模块地图 `subagent-scheduler.mjs` 两行合并（去重——D1 accessor 行并入）。零契约语义变动。
- 2026-09-11：第 35 批（GitHub #6）新增 §12 async 子代理保真——issue 四根因现场复核（①④ 机制面已不成立、②③ 症状修）+ 差异登记六项；§1 模块地图补 `async-discard.mjs`、§5 补中止丢弃指针（评审轮次 1 修正轮：§12.1/12.3/12.4/12.6/12.7/12.8 修订——会话收尾站登记 §12.8 #6）。
- 2026-09-11：群 A 批（VSC-MIRROR-SWEEP）新增 §13 旧锚清理（`§24` → 本端 `§5`/`§9` 节映射——13 档 39 行 + doc 1 行；逐行映射表 + AC/用例）。
- 2026-09-11：群 A 批增补 A11——受限通道描述面清单同步（§8 两处就地更新 + 新增 §14；`src/agent/setup.mjs:85-86` 逐字表）。
- 2026-09-09：§8 任务书机械追加措辞核（A2-SUMMARY-PARITY——A2 摘要对齐 CLI：节头定位优先 + 无 `##` flat 任务书 inline 兜底 + marker 未命中 → "(not found in the parent task book)" 不编造——删 <2 节整书 verbatim 回退）。

- 2026-09-11：第 21 批（B6）——§7 补 1 行指针（digest 起跑可见指示 → 本仓 `WEBVIEW.md` §7.4——评审 #3 协调项履行）。

- 2026-09-08：§11 实现交付后——eng-coder 报告 3 上报项：①槽持久化缺口（agentState 不带 tasks/goal/pendingReminders——destroy 丢）——父侧裁 a 案（补带三字段——文件域扩展 run-helpers/panel-callbacks）落 §11.7；②commit a0fabf8 卷入同伴 D6 文件（共享 git index 竞态——内容正确接受）；③setup.mjs 500 行边缘（挂 TODO 拆）。

- 2026-09-08：新增 §11 agent 生命周期对齐 CLI 设计变更段（需求 SESSION.md 需求段——用户裁定快车道）。评审后并入 §2。
- 2026-09-08：§11 评审 9 项 advisory 全采纳——#1 SESSION 状态指针/#2 槽字段↔hydrate 映射表(11.2.1)/#3 受影响文件表(11.3.1)/#4 用例表(11.4.1)/#5 A-C 归类(_tasks/_goal/_pendingReminders 移会话级)/#6 §11.3 标题(裁定记录——无待裁)/#7/#9 merge 清单(11.6)/#8 F2 措辞(砍 opts 搬运非落盘链)。

- 2026-09-08：从 ARCHITECTURE §6/§8 迁出成立本档——写全 VSC 独立实现（runAgent/子
  代理动作面/async 池/挂起 digest/eng-coder 交付），正文照抄 + 去 CLI 镜像指针。

## 1. 模块地图（本端接线——实现为唯一事实源）

| 文件 | 职责 |
|---|---|
| `src/agent.mjs` | `runAgent` 主循环：run-start pending 注入 → turn 循环 → chat → 工具批 → 收尾；ContinueError/resume；usage 基线；回合收尾 finalizeAgentTurn；回合头 turnInput 注入消费（SUBAGENT-OBSERVE-SEND D2——下回合边界消化 send 队列） |
| `src/agent/setup.mjs` | setupAgentRun：注入上下文/system prompt、阈值解析、角色工具面装配、`getAuto` 注入 |
| `src/agent/execute-tools.mjs` | 工具调度/批执行（并行批执行）；门禁谓词族拆出 → `src/agent/tool-gates.mjs`（§18 C-11）（修正轮 #3） |
| `src/agent/tool-gates.mjs` | 前置门族（§18 C-11 拆出——verbatim）：`agentHasLiveEngSlot` / `l3TouchedPaths` / `preGateBlocked` / `isSubagentConsumeDesignAction` / `collectBatchPermission`（修正轮 #3） |
| `src/agent/run-stages.mjs` | checkAndCompact/fireEndOfRunDistill/finalizeAgentTurn/maybeGuardPushbacks（收尾 guard 推回） |
| `src/agent/run-helpers.mjs` | 常量（turn 上限/落盘阈值/结果落盘 64K）、pushReal/agentState、工具结果 offload |
| `src/agent/setup-reminders.mjs` | AUTO_REMINDER / ENG 提醒族 / injectEngineeringReminder |
| `src/agent-tools/subagent.mjs` | subagent 单工具动作面 + spawn 门 + 引擎（审计受限通道、token 门接点）；observe/send dispatch + readonly/control 分类 + runChild onToolCall 记当前工具 / turnInput 注入消费回调（SUBAGENT-OBSERVE-SEND） |
| `src/agent-tools/subagent-async.mjs` | async 池/collectSettledAsync/mergeChildMutations/gateEngCoderSpawn |
| `src/agent-tools/async-discard.mjs` | 中止丢弃单点（§12）：丢弃判定（只清已死）+ 终态记录 `discarded` + 模型可见丢弃提醒；**群 B 增补**：advisor 池同构（§15——`discardAbortedAdvisors`） |
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：filesOverlap/depInfo/queueRunnable/assertNoDepCycle/refillPool/nextSubagentId/停滞检测 + D1 池 accessor（getAsyncPool/removeFromAsyncPools——ASYNC-RESULT-CONTAINER） |
| `src/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER D1-D6）：settleAsyncEntry（四族公共收尾单点）/ pending 单容器（parkAsyncPending/injectPendingAsync role 分发）/ parentAborted 守卫 / buildChildSignal |
| `src/agent-tools/digest-budget.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/digest-budget.mjs`） | digest 注入预算单源（§16）：常量 / 轮记账（digestBudgetOver）/ 超限落盘（persistOverflowReport）——四族注入器共用 |
| `src/agent-tools/subagent-actions.mjs` | status/cancel/escalate/consume-design/observe/send 动作执行器（observe/send——SUBAGENT-OBSERVE-SEND 2026-09-08） |
| `src/agent-tools/subagent-spawn-gate.mjs（W12 已迁核——现体见批次档 §5）` | authorizeEngCoderDesignToken/executeConsumeDesignAction/resolveDesignSlot/dropExpiredTokenSlot |
| `src/agent-tools/subagent-spec.mjs（W12 已迁核——现体见批次档 §5）` | description 面 / modeRoleField（schema enum）；observe/send 动作描述 + 枚举（SUBAGENT-OBSERVE-SEND） |
| `src/agent-tools/subagent-escalate-async.mjs（W12 已迁核——现体见批次档 §5）` | 飞刀 async 引擎：turnInput 消费回调 + onToolCall 记当前工具 + settle 未投递注记（SUBAGENT-OBSERVE-SEND——与 spawn 同池 send 一致性，out-of-list） |
| `src/agent-tools/child-permission.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/child-permission.mjs`） | child 审批通道（§18 C-2）：`makeChildPermission` / `childOwnerLabel`（owner label 与活动块同源）（修正轮 #3） |
| `src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）` | 后台评审池（`_asyncAdvisors`，ADVISOR_POOL_LIMIT=4——可配 agent.poolLimits.advisor——同 scope 守卫）+ launchAsyncAdvisor |
| `src/agent-tools/consult.mjs（W12 已迁核——现体见批次档 §5）` / `subagent-escalate(-async).mjs` | consult_start/stop / escalate sync+async 路径 |
| `src/extension/chat-panel.mjs` / `panel-chat.mjs` | ChatPanel 生命周期；回合驱动经 `runAgent(p, cwd, text, callbacks, panel._abortController.signal, () => panel._autoApprove, runOpts(resume))`；INPUT-LOCK-ASYNC（C'——2026-09-09）：busy 拒收分流（_chat 单槽 pendingInput——挂起空闲） |
| `src/extension/suspension.mjs` | 挂起会话驱动：waitForSettleOrWake（`panel._suspWake` 单槽）、单槽 pendingInput 消费（R15 排队合并已废——INPUT-LOCK-ASYNC——2026-09-09） |
| `webview/activity.js` / `panels.js` | 子代理活动块**区驻留 → 消化后归档落流**（消息与输入之间的固定活动区 `#subagent-activity`——live 固定可见；2026-09-12 收口批：终态清退 + 消化回收归档 `#messages`——权威 `WEBVIEW.md` §14，§12 为沿革）；panels.js 行面板已撤 + goal/task 面板 + 桥路由 |

模块拆分批：subagent-async.mjs 按 Module Split Policy 拆出 subagent-scheduler.mjs 与
subagent-actions.mjs（同 CLI 拆分治理轮）。

## 2. runAgent 主循环（src/agent.mjs）

**签名（现行）**：

```js
runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)
// 实现缺省：callbacks = {}, autoApprove = true, opts = {}
```

- `callbacks`：onToken/onReasoning/onToolCall/onToolResult/onToolPanel/onComplete/
  onCompress*/onSubagent/onAgentTurn/onPermissionRequired/onBatchPermissionRequest/
  onQuestion…（顶层接线逐层注入子代理 ctx）。
- `opts`：子 agent 上下文 `{ depth, role, maxTurns }` + 自动回合/挂起
  （autoTurn、susp、skipSession、history/fullHistory、inheritedGuard、sessionSignal、
  distillState/distillSignal、guardCarry、suspDriven 等）。
- **autoApprove 语义**：参数为启动快照（可为函数）；**活事实源 = 每轮 live
  getter**——`getAuto = typeof autoApprove === "function" ? autoApprove : () => autoApprove`，
  execute-tools/setup 向工具 ctx 注入 `getAuto`，approve-all / AUTO 工具栏按钮在轮次
  中途翻转后，权限询问与 AUTO 标注下一条即生效。VS agent 是 per-run 对象、无 CLI 的
  `parent.autoApprove` 字段——两端语义等价。面板接线传 getter：
  `runAgent(..., signal, () => panel._autoApprove, runOpts(resume))`。
- **per-run vs 跨 run**：agent 对象 per-run 重建；跨 runAgent 存活状态挂在**共享的
  depth-0 history 数组**上（`_asyncSubagents`/`_asyncAdvisors`/`_asyncTombstones`/
  `_pendingAsyncResults`（pending 单容器 +role——四族统一停靠，见 §5）/
  `_consultSessions`/`_engDesignTokens`/`_suspended`——JSON
  序列化只走数组下标，附加属性不污染会话文件）。

**run-start 注入（先于 setupAgentRun 推入本 run 用户输入）**：前一轮异步蒸馏
（`opts.distillState.pending`）必须**先落地**（N1——压缩机行是本 run 起始上下文）；
挂起期 settle 停靠的 `history._pendingAsyncResults` pending 单容器在此 splice 即消费
（单注入点——防重复注入；条目带 role——注入器按 role 分发四族文案；digest 处置轮
据此触发）。

**回合收尾（finalizeAgentTurn，run-stages.mjs）**：consult 清理 / async 池收集 /
guardCarry 继承，finally 单点执行。collectSettledAsync 在回合尾收集 settle 结果
（suspDriven 留池由挂起会话 digest）。

## 3. 循环控制 / guard / 中断 / 落盘 / 上下文注入

**循环控制**：默认最大轮次 100（顶层 `agent.maxTurns`；子代理 `agent.subagentTurns`
共享 config 默认 100）；并行工具批执行（executeToolBatches）；Stall 检测（连续 5 轮
工具重复 ≥3 次 → 警告注入）；零工具回合（empty 处理：纯 reasoning → 当 content；
空响应 ≤ MAX_EMPTY_RETRIES 注入重试提醒，超限报错）；回合后注入（timer 到期提醒、
goal 预算）；收尾 guard 推回组在 run-stages.mjs（maybeGuardPushbacks——pending 任务
≤1 次/任务 → verify guard OPT-IN `agent.verifyGuard === true`（缺验推回 + 失败重试
≤ 上限 + 耗尽诚实声明）→ advisor guard OPT-IN `agent.advisor.guard === true`
（默认 OFF，工程模式豁免——见 ENGINEERING-MODE.md））；guard 记账键随 auto-turn 继承
进下一 USER run（`INHERITED_GUARD_KEYS`——auto-turn 变更逃不出 guard）。

**中断语义（AbortController + signal.reason）**：Ctrl+C abort（`signal.aborted` 循环
头 throw `DOMException("Aborted")`）/ Ctrl+I interrupt——SSE 流返回 partial，提交
partial assistant 输出、注入 `[User interrupt: …]` 消息、throw 让外层重建 controller
续跑同回合；工具执行期 interrupt 不提交 partial 工具结果（避免误导模型）。每轮迭代
`callbacks.onAgentTurn?.(turn + 1)`（per-child turn hook——subagent 同步进 async 池
条目的 entry.turn，status 决策字段）。

**工具结果落盘与写时自清理**：结果超 **64K 字符**（`MAX_TOOL_RESULT`）落盘
`<cwd>/.thincoder/tmp/tool-<id>.txt`，模型只见双端预览 `[Large output saved. Read the
full result with the read tool: …]` + `buildHeadTailPreview`（head 16K + 省略注 + tail
≤48K——UTF-16 安全双端切片）。落盘目录写时自清理：每次 offload 写新文件前删除目录内
mtime 超 3 天（`TMP_RETENTION_MS`）的文件——子目录不动、异常静默；同目录 paste-* 粘贴
图片临时文件一并按此回收。实现 `src/agent/run-helpers.mjs`；落盘目录两端各自为政
（CLI `~/.thincoder/tool-results/`、VS Code `<cwd>/.thincoder/tmp/`）。

**上下文注入（顶层）**（修正轮 #2——改指针指 §17，消除批后双描述）：注入面全表（每 run 块清单 /
顺序 / 缓存契约 / 门条件）= **§17**（VSC-CONTEXT-PARITY 批——2026-09-11；实现 = `src/agent/
context-injections.mjs` 单编排 + `setup.mjs` 尾块）。旧句「快照 + 依赖大纲注入」（载体 context.mjs 已
随 GIT-ASYNC 退役）与现实现不符——随 §17 作废、不在此重述。`[System: AUTO mode active]` 在 AUTO 时
注入（每次循环迭代动态检查 live getter——approve-all/AUTO 按钮轮次中途翻转后下一条注入即生效）；每
迭代重读 live AUTO 并补推 AUTO_REMINDER（翻转/压缩丢提醒不遗漏）；engineering-mode 转换提醒经
injectEngineeringReminder（覆盖 TUI/panel 切换与 session resume 旁路）；meta 工具排队的
`_pendingReminders` 冲入 history。

**子 agent 支持**：`depth=0` 顶层 agent 拥有完整工具集 + meta 工具；`depth=1` 子
agent 工具集缩减、prompt 叠加角色 overlay、角色按模式覆盖（§4）；explore/plan 只读、
coder/eng-coder 完整工具 + verify/advisor 自审。轮次/并发上限与调度见 §5/§6。

## 4. 子代理单工具动作面（subagent.mjs）

**"ONE tool, SEVEN actions"**——`action` 缺省 spawn（既有调用零迁移）；枚举 =
spawn / status / cancel / escalate / **consume-design** / **observe** / **send**：

- `action:"spawn"`：起一个隔离上下文的子代理，只回最终报告。`task` 必填
  （self-contained——子代理零会话上下文）；`role`/`model`/`designId`/`designToken`
  /`async`/`files`/`dependsOn` 可选。
- `action:"status"`：非阻塞进度查询（id 单查或全池概览），零消耗——running 条目
  携 `{role, model, elapsedSec, turn, maxTurns}` + touched-files 摘要
  （touchedFiles 前 5 / touchedMore / 占位 "—（尚无改动）"/"—（未启动）"）。
- `action:"observe"`（SUBAGENT-OBSERVE-SEND.md D1，2026-09-08）：父查运行中异步子代理
  的 recent-activity 快照（判推进 vs 卡死）——最近 **N=5** 条回合摘要（截断抽取——每
  回合 assistant content 首行 / 工具名列表——非原始消息体）+ **当前工具**（onToolCall
  捕获的 entry._currentTool）+ turn/touched + status。id 必填；零消耗（readonly）。
  queued → 占位；done（本回合 settle 未取）→ 终态 + 报告预览。
- `action:"cancel"`：定向中止单个后台 async 子代理——`id` 必填（防误全停；
  Ctrl+C 停全部）；running 条目 abort → `{id, status:"cancelled"}`（不合并、不入
  pending、冻结通知）；queued 出队 → `{id, status:"cancelled", was:"queued"}` +
  position 前移；未知/已完成 id error；幂等。
- `action:"send"`（SUBAGENT-OBSERVE-SEND.md D2，2026-09-08）：父向 running 异步子代理
  发消息 → 入池条目 `entry._injected` 队列 → 子**下回合边界**作普通 user 指令消费
  （引导纠结/跑偏的子代理——比 cancel 省在途工作）。`id` + `message` 必填；仅 running
  可 send（sync 无池条目→unknown、settled/queued/未知 id 明确错误）。**注入延迟**：
  send 落子代理正在跑的 generation（mid-LLM-await）不入打断——当前工具/回合返回后下个
  回合头（runAgent 主循环 opts.turnInput 消费）才入子历史——非即时。send→settle 竞态：
  settle 收尾未消费 `_injected` → settle 附"未投递"注记（settleAsyncEntry/
  settleEscalateEntry）。凭证纪律：不读写 token/designId。
- `action:"escalate"`：飞刀——consult 模型候选池（agent.consultModels）里飞入强
  模型做实现（写权限 + 术后报告），缺省 async；工程模式不可用（实现走
  eng-coder）。触发词条款："用户说 飞刀/escalate → 调 action:'escalate'"。
- `action:"consume-design"`（2026-09-07 链终消费制，工程模式父侧）：链终消费 design 的
  token 槽——designId 必填（多槽会话）；消费后再 spawn 同 designId 机械拒绝；幂
  等（未知/已消费 = no-op）。修正轮复用同槽，链还开着不得消费。
- `action:"check"` **已删除**（2026-09-06 用户裁定：check 是冗余 API——需要报告 =
  同步 spawn；async = 后台 + 结果自动送达）——**不写回**；status 非阻塞查询取代轮询
  引导（"查进度用 status——check 会阻塞直到完成"防误用语义随删除退役）。

**动作分类（execute-tools.mjs isReadonlyAction/isControlAction——subagent.mjs 谓词）**：
status / observe = **readonly**（plan mode 放行、零消耗、readonly 批不审批）；cancel /
send = **control**（控制类豁免——只入队/只停不落盘——plan mode 放行、免权限审批、批审批
分组不入组、手动档 digest 放行）。`consume-design` 独立谓词只接权限豁免位（非只读非
control——见 §2.6）。observe/send 仅 depth-0（子代理上下文无 async 池——错误明示）。

**注入贯通（SUBAGENT-OBSERVE-SEND.md D2——stateSink 同款顺延）**：runChild（spawn）与
飞刀 async 引擎（escalate）各以新回调 `opts.turnInput` 传给子 runAgent——读池条目
`entry._injected` 清空取回；子 runAgent 主循环**回合头**（agent.mjs）把待投递消息 push
作 user 回合入子 history。observe 摘要源 = `entry.childAgent.history`（setup 把
agent.history = 该轮 history——与 runChild 闭包 sink.history 同数组——对象引用实时读）；
当前工具 = runChild/飞刀引擎 onToolCall 回调顺记 `entry._currentTool`。

**角色按模式互斥**（modeRoleField——schema 首道防线 + 运行期硬门禁双保险）：非工程
模式 enum `["explore","plan","coder"]`、工程模式 enum `["explore","plan",
"eng-coder"]`；schema 过滤让模型看不到非法角色，execute 内运行期校验不替代：
（逐字——`subagent.mjs`）：

```
Engineering mode: use role='eng-coder' for implementation tasks.
Engineering mode is not active — use role='coder' for implementation tasks.
```

suffix（工程模式拼到工具级 description 尾，逐字）：
`In engineering mode, use role='eng-coder' for implementation (coder is disabled).`
非工程 suffix = `""`。角色名精确匹配 fail-closed（变体拼写
"Coder"/" coder" 绕过门禁的 coder-leak 修复——Unknown role error）。
"Mode filtering: normal mode exposes explore/plan/coder; engineering mode exposes
explore/plan/eng-coder. The schema enum reflects the active mode."
（本体在 `subagent-spec.mjs`/`modeRoleField`。）

**描述面**：`subagent-spec.mjs` 的 description 与 CLI 权威版逐段对齐（本端有意差异
仅面板 action 段剔除——VS Code 无 panel action）；async 收尾锚句（逐字定稿——防模型
自发轮询挂起，内容断言锁定）——"the child runs in the background and its report is
delivered to you automatically — before your next turn, or digested in the suspension
session — so end the turn; do not poll or wait for the result."（本体在 spec）。

## 5. async 与后台池

- **async 缺省（现行）**：depth-0 顶层所有角色 spawn 缺省 async；escalate 同规则缺省
  async（见 §9）；depth>0 恒同步（拒绝 async spawn——"async spawn only available at
  the top level"；`async:false` 显式阻塞。工具 `async` 描述：role 级默认措辞 →
  "Default: depth-0 → true"。
- **并发上限**：`ASYNC_SUBAGENT_LIMIT = 4`（历史常量，随角色分池演进——见下）；角色
  分池：`ASYNC_POOL_LIMITS { engCoder: 4, other: 4 }`，entryDomain 单一事实源
  （`role === "eng-coder" ? "engCoder" : "other"`），`agent.poolLimits` 面板可配置
  （逐键校验 payload-wins——每键正整数 ≥1，非法 fall back 默认 4/4；**第三键 advisor——
  POOL-CONFIG-UNIFIED 2026-09-09——effectivePoolLimits 遍历键表 3 键——仅供面板生效值
  显示/读取回退——调度路径过滤不消费（subagent 两域判定不变）——advisor 实际调度上限
  由 advisor-async 独立读取器决定（§9）**）；满池排队返回
  `{id, role, status:"queued", position, waiting?, reason?}`，settle 自动补位
  （refillPool 最早可启动扫描——waiting 越行不阻塞槽位）。
- **终态**：settle 即翻 done + 墓碑（`history._asyncTombstones`）；报告自动送达——
  回合尾 collectSettledAsync 直注入或挂起期 digest 注入（§7）——arrival order
  多结果按完成序注入；cancel 的 cancelled settle 不入 pending、不直注入、停止冻结通知。
- **中止丢弃**（第 35 批 §12——GitHub #6）：中止分支**只清已死条目**（存活条目与 done-in-pool 留池）；
  丢弃必留痕 = 整批一条模型可见提醒 + 终态记录 `discarded`；`status <id>` 对已丢弃/已取消/已送达
  回显终态（不再 unknown）。详见 §12.3 契约（本处只留指针——单一权威源）。
- **settle 统一机制（ASYNC-RESULT-CONTAINER.md D1-D6，2026-09-08）**：四族（subagent/
  advisor/escalate/consult）settle 公共收尾单点 = `settleAsyncEntry`
  （`src/agent-tools/async-settle.mjs`——落 report/error/done/status、日志三连
  （ev:cancelled / {child|advisor}:done|:error + ev:settled）、cancelled/parentAborted/
  挂起分流、`_resolve` 唤醒 waiter、腾槽补位、notifySettle）；守卫统一
  `!parentAborted`（严格版——signal aborted 非 interrupt 或 controller aborted 非
  cancel）；族特有段作 `onAccounting` hook（advisor 陈旧判定/token D1 落盘；escalate
  三分类 merge 决策）。**pending 单容器** `_pendingAsyncResults` +role（五族分叉废弃
  ——`_pendingAdvisorResults`/`_pendingEscalateResults`/`_pendingConsultResults`
  退役）；**done-in-pool 统一表示**：留池 done:true + pending 单容器——`_inPending`
  标记保留（settle/sweep 同一表示防重复移交）。**池 accessor** `getAsyncPool(parent,
  role)`（subagent-scheduler.mjs——吸收 `history?._X ?? agent._X` 双查询）。
  **buildChildSignal**（async-settle.mjs——`sessionSignal ?? agent._sessionSignal ??
  ctx.signal ?? null` 单点，consult 补 _sessionSignal 兜底）。
- **任务调度器**（§6）：`files`/`dependsOn`；重叠串行化、依赖链自动启动、环拒
  （assertNoDepCycle）、sync spawn 冲突拒；依赖被取消/失败 → 条目驻留标记
  "dependency cancelled" 由模型决定（AUTO 会话自动启动）；SLA waiting 行渲染 + 停滞检测。
- **id 分配**：`nextSubagentId(parent)` 共享分配器（计数器与池内最大 key 取上界续
  号——async 子代理 id 跨 runAgent 复用的修复，spawn 与 escalate 同用；consult/async
  advisor 同命名空间——webview 行 map 共用）；status/cancel 数值键归一（纯数字字符串
  归一化，错误消息回显原值）。

## 6. 子代理任务调度器（files / dependsOn）

- `files`（写域声明——文件级路径；目录声明拒绝——冲突检测器按文件粒度）/
  `dependsOn`（先序 id；报告已自动送达的 id 视为满足——AUTO 会话自动启动）。
- 重叠文件 → 串行化（后发者排队等冲突清空）；依赖链自动启动；环拒
  （assertNoDepCycle——依赖环不进入无限等待）；sync spawn 撞调度冲突拒绝
  （"sync spawn (async:false) cannot queue behind a scheduling conflict…"）。
- 依赖被取消/失败 → 条目驻留标记 "dependency cancelled" 由模型决定。
- SLA waiting 行渲染 + 停滞检测（waiting 越行不阻塞槽位——refillPool 最早可启动）。
- **动态文件域（SCHEDULER-DYNAMIC-DOMAIN 2026-09-09——CLI docs/design 同名专题——同构镜像）**：
  冲突判定的"他条目域" = `effectiveFiles(e)` = 声明域 ∪（running 且已绑 childAgent 的
  `childAgent._touchedFiles`——写工具批提交实时记录，fileKey/filesOverlap 键空间零改动）；
  queued 无 childAgent（首 onAgentTurn 才绑）——天然只声明域。describeBlockers /
  queueRunnable / detectStall 三处统一经有效域实时读（refill 在 start 前必经重扫——start
  决策保护不依赖新事件）；waiting 文案区分命中来源——命中仅来自 touched（∉ 声明域）→
  `域冲突 <file>（运行中实际写入）`，纯声明命中（含声明∩touched 重叠）文案不变。边界：
  running-vs-running 抢占不做（只保护未来 start 决策——后续项）；中途写窗口接受。

## 7. 挂起回合 digest（VS 结构差异——本地接线）

挂起态是**交互层状态**（extension 驱动）：用户回合结束而后台池仍 live → 不阻塞
回合，进入挂起会话——挂起空闲输入开放（新消息经 `panel._chat` 填 pendingInput 单槽 + 唤
醒）；**busy（`_turnState==="running"`——普通回合/digest/标题窗口——单一判据）提交拒收**
（INPUT-LOCK-BEHAVIOR-REVISED——2026-09-09——**输入不禁**（可录入回显）——Enter/发送拒发不排队——
webview 输入面见下方 UI 段）；settle
事件驱动 auto-turn 消化（digest：手动档 organize-only 禁 spawn/写——动作域模板
`AUTO_TURN_DIGEST_DOMAIN` 注入 agent.mjs；AUTO 档全语义推进）；池空 + 无待处理输入 →
补发冻结自然退出。排队用户指令合并（R15）已随禁排队废弃（单消息逐发——攒批取数/合并文案/
上限常量全删）。digest 撞 ContinueError → AUTO 自动 resume / 手动静默停止（部分消化留历史不丢）。

（第 21 批 B6）消化轮起跑的面板可见指示见本仓 `WEBVIEW.md` §7.4（流内 `#digest-status` 元素 + `digest`
消息行）——本档承载机制面，呈现细节不重复。

**VS Code 结构差异**（与 CLI 同语义移植——CLI 的池/pending/_suspended 挂 agent 对象
跨 run 存活；VS Code agent 对象 per-run 重建——全部挂共享 depth-0 history 数组 §2）：

- 唤醒单槽：`panel._suspWake`（waitForSettleOrWake 注入）——`_chat` 挂起分流、settle
  回调（onAsyncSettled → `panel._suspWake?.()`）、abort 分支同槽（历史 `susp.wake`
  死字段修复——**VS 实现注**）。
- 释放窗口守卫：回合尾先于任何释放点登记 `panel._suspPending`，A2 后标题移入 finally 归位
  前（running——routeUserTurn 拒收）——释放窗口与会话建立同同步续段（零事件窗口——入队容
  器已随禁排队废弃）；`_chat` 对无会话的 susp 态消息防御拒收（零并发独立回合——不孤儿化池）。
  中止残余单槽消息以普通回合兜底执行（零丢失）。
- 中止语义（F-6——SESSION-ACTIVITY-REVISED 2026-09-09 评审 #1——废除 D-S9 全停）+
  INPUT-LOCK（C'——2026-09-09）：
  每次 controller 创建/重建登记 `panel._turnControllers`；**Stop 只停主会话当前
  controller**（回合/digest 轮——panel-messages abort case 以 `_turnState==="running"`
  为门——不再 `abortControllers`/会话句柄全链 abort、不再 `_suspWake` 唤醒——无全停
  按钮——susp 纯池跑 Stop 不显——池空自然消化完——CLI 对拍）；子代理停止靠活动区每块
  ⏹（cancelSubagent 定向 abort——running+pool 块与 queued/waiting 块头（QUEUED-VISIBILITY F-2——
  取消 = 出队 + 墓碑）；冻结块 ⏹ 随 freeze 移除）。面板销毁（dispose）仍统一中止会话（abortControllers
  快照 + susp.abort——面板死 = 会话死——唯一全链路径）；中止后 digest 排队消息无条件
  消费残余以普通回合按序执行（中止路径零丢失）——busy 禁排队后残余至多单槽一条。
- 会话 lines 双键：会话入口 lines 携 `contextHistory: history`（in-session 回合按
  activeLines 契约读 loadedLines.contextHistory——缺键致 digest 死循环的事故修复）。
- 挂起 UI（**2026-09-12 收口批修订——`WEBVIEW.md` §14**）：块**区驻留 → 消化后归档落流**——
  settled → **awaitingDigest 驻留**（头词 `done · awaiting digestion`——§14 C-2）；消化回收 →
  归档进 `#messages`（轮边界前——§14 C-3）；会话退出 = 区全体归档（§14 C-8）；digest 轮标签/
  状态元素/cap 行见 §14 C-9/C-10。状态行（⏳ 后台 N 子代理 + 待消化计数——子代理计数徽标撤）；
  **输入门禁 = busy（`S._turnState==="running"`——含 digest/标题窗口）派生**（loading.js——
  **readOnly 锁已撤**（可录入）——busy 占位符「主会话处理中——Enter 提交禁用——可继续输入」——
  Ctrl+C 全停/Ctrl+I 注入保留：中断模态——注入通道在门禁前——不误伤——红线）；**Send 按钮
  running 期隐藏**（§14 C-14——2026-09-12）；susp 纯池等待输入开放（消息填单槽 + 唤醒——
  不排队）；send.js 出口守卫兜 busy 拒发（文本保留）；Stop 只在 running 显（susp 纯池跑不显——无全停）。

## 8. eng-coder 交付协议（本端闭环）

- 交付协议在 eng-coder **内部闭环**（async 为其缺省运行形态——depth-0 全角色缺省
   async，§5）：实现 → explore 偏差审计（**BLOCKING ONLY**——受限变体 spawn-only，无
   action 参数（escalate/status/cancel/consume-design/observe/send 不可用）、无 async（A11 清单同步——§14）；审计预算 ≤6，第 7 次机械拒绝 = stalled 信号；任务书机械追加 =
  父 spawn 任务书摘要（三要素 verbatim——涉及文档/文件清单/验收标准——节头定位优先、
  无 `##` 的 flat 任务书 inline 兜底；marker 未命中 → "(not found in the parent task
  book)" 不编造——无整书 verbatim 回退——A2-SUMMARY-PARITY 2026-09-09）+ 实际
  `_touchedFiles` 并集，非自述清单）→ dirty 自修 →
  advisor 复评 → 收敛 → 一次交付。
- **token 门**（authorizeEngCoderDesignToken，subagent-spawn-gate.mjs）：eng-coder
  spawn 必须持有 advisor(type='design') 评审 0🔴 签发的 token——格式（`uuid:expiresAt`）
  + TTL fail-closed；**过期展示即删除死槽**，mismatch/畸形拒绝不删槽；
  `_engDesignTokens.get(designId) === token` 槽位匹配。写门禁：eng-coder 子代理 spawn
  时经 `engDesignReviewed` 预授权 + spawn 侧 autoApprove 等效（免逐写询问：权限询问阶段
  整体跳过；design-token/planMode 等前置门先于权限阶段且原样生效）。设计评审签发的 token 使
  eng-coder 内自审（advisor type=code）不翻转 async。
- 变更记账：`_touchedFiles` 机械跟踪；`mergeChildMutations`——**取消路径不合并**（磁盘
  半成品不入父 guard 记账，不触发 verify/advisor 推回）；成功路径合并入父 `_fileMutEvents`
  供 guard 推回判定。delivery 报告含轮次/终态/audit 记录（修正轮 ≤5；stalled 不静默）。
- 受限 spawn（engAuditSubagentTool）：eng-coder / eng-designer ctx 内 subagent
   schema = role 仅 explore、async 参数移除（同步强制）、**action 参数整体移除**
   （spawn-only——escalate/status/cancel/consume-design/observe/send 不可用）、描述点名
   SURVEY/AUDIT + BLOCKING ONLY；机械层 gateEngCoderSpawn 在 mode 门之前执行
   （eng-coder 专属错误先于通用工程模式错误）。A11 描述面清单同步（群 A 批）见 §14。

## 9. 会诊 / 飞刀 / advisor 完全异步化

- **consult**：工具面 = consult_start/consult_stop（**consult_check 退役**——结果自动
  digest 注入后无消费对象）；会话容器 = `history._consultSessions`（跨 run 存活）；
  settle 判定 = 会话 pending==0（全 settle 一次注入）→ park 进 pending 单容器
  `history._pendingAsyncResults`（role=consult——会话升格完整 entry）
  → 下回合 run-start/digest 注入；stop/abort 弃（不入 pending）；子代理信号 =
  buildChildSignal（sessionSignal ?? agent._sessionSignal ?? turn signal——D5/D6）；挂起期撞 turn cap 自动降级 partial（不弹继续卡——无人在
  面板前）。consult children 的 onToken 例外保留——其 OUTPUT 流入会诊面板。
- **escalate**：sync 路径（async:false）verbatim 保留；缺省 async 入 **other 池**（与
  explore/plan 共享 4 槽——池满公平排队）；settle 三分类：done → merge-all + 重叠警告入
  报告；error → partial merge 决策（父 `_fileMutEvents` 重叠 → 不 merge + 报告列差异；
  无重叠 → merge）；cancelled → 不入 pending。settle 即出池（status 查为 unknown——报告
  park-ALWAYS 入 pending 单容器（role=escalate）经 digest 自动到达）。escalate 经 opts.streamOutput 选入 onToken（长手术不静默）。
- **async advisor**：`advisor-async.mjs`——`_asyncAdvisors` 独立池（ADVISOR_POOL_LIMIT=4
  默认——**可配 agent.poolLimits.advisor（读取器每 launch 判定——非法/缺省回退 4——
  超限拒文案报生效上限——POOL-CONFIG-UNIFIED 2026-09-09）**——同 scope 守卫：同
  reviewType+scopeKey 有 running 记录 → 拒（settle 后逐个发起——settled 续跑 round+1
  语义不变——与池容量守卫两关独立）+ launchAsyncAdvisor（design reviewId=designId / 续跑轮现铸 token / rv 实例
  上下文）；settle 记账（陈旧判定跨 run、token 入槽 + engPersist slot 直写、round/prior
  ≤5、cancel 不入 pending 不入槽）——挂起期 settle 移交 pending 单容器（role=advisor）→
  digest 注入 + guard 未决不推回 + cancelAdvisorReview（取消路由——②-6b）。
  工具 async 参数：depth-0 缺省后台（非阻塞默认——顶层评审不卡回合）；depth>0 拒/恒同步
  （eng-coder 内自审不翻转）。UI：panel-messages cancelSubagent 路由 role=advisor +
  webview subBlockTarget 加 advisor（⏹/冻结复用）。

**§11.2 接入面补全（2026-09-11 第 10 批——本端镜像；CLI 端权威 = `AGENT-LOOP（CLI 仓）` §18）**：

- ① `subagent status` 双池合并（本端 `src/agent-tools/subagent-actions.mjs` as-of :89-120 现只查子代理池——本批补）；
- ② `wait_for "advisor settled"` 判据改读评审池（本端 `src/tools/wait_for.mjs` as-of :125-129（W14 已迁核——现体 `thincoder-core/tools/ops.mjs` 的 wait_for 分支） 同缺陷——修前恒 0ms 秒过；
  复用本端已导出 `advisorReviewInFlight`（`src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）:92`——双载体判据））；
- ③ `subagent cancel <advisor id>` 落评审池（面板 ⏹ 路由已有——`src/extension/panel-messages.mjs:238-241`；
  工具动作缺落点——本批补）+ ④ observe/send 遇 advisor id 明确指引；
- 命名差异登记：本端 `cancelAdvisorReview` ↔ CLI `cancelAsyncAdvisor`（语义同源；**各端原名不改**——D-B3）。
- 需求：`AGENT-LOOP（CLI 仓·需求）§4`（F-B1~F-B4）。
- 并入登记：条目 A（面板 live 块出生可靠性）本端权威 = `WEBVIEW.md` §5.1——本档不重复（单一权威源）。

## 10. 子代理活动显示（本地 webview 机制）

> **现行机制（2026-09-12 收口批起）**：子代理/consult/advisor 块**区驻留 → 消化后归档落流**——
> 出生/驻留于固定活动区（`#subagent-activity`——live 固定可见）；settled → awaitingDigest 驻留
> （带提示）；消化回收 → 归档进 `#messages`（消化轮边界前）；普通终态即时归档；全完成后区
> `:empty` 零高——权威契约与用例见 `WEBVIEW.md` §14（布局 §2 / 机制 §5；§12 为沿革与反转注）。
> 挂起期语义与中止面见上文 §7「挂起 UI」/「中止语义」。
> 历史三代（均为沿革注记）：① 2026-09-09 前段 SESSION-ACTIVITY-REVISED（区内 live + 终态落流
> 锚 + settle 驻留）② 2026-09-09 后段 ACTIVITY-REWRITE-SIMPLE（流尾出生·原地冻结）③ 2026-09-11
> 活动区回归（区内出生 · 原地折叠 · 区内保留）——本批反转 ③ 的冻结块去向与 settled 呈现
> （旧 DOM-move 锚链仍禁——新干净机制 §14.4）；各代机制纪律（幂等守卫 / 终态闭合 / 150 窗）保留。


## 11. agent 生命周期对齐 CLI（设计变更段——2026-09-08 用户裁定，评审后实现）

> 需求：SESSION.md「需求段」F1-F4 + N1-N5。本段为设计——评审通过并入 §2 现状态。
> 2026-09-08 评审 9 项 advisory 全部采纳（修正见下）。
> 一句话：VSC 顶层 agent 从"每轮 runAgent 重建 + opts 状态搬运"改 CLI 式"面板会话级单例复用"——panel 持 panel._agent，首轮建、回合复用、状态内存携带、回合尾落盘保留。砍 per-run 重建背的 opts.engState/agentState 搬运链（批 1 异步评审 token 未注册 = 双载体漂移实证）。

### 11.1 方案

**核心拆分**：setup.mjs 的 setupAgentRun 拆出三段——① agent 对象构造（:252-284）抽独立工厂 `buildTopLevelAgent`（首轮-only）；② 每轮 hydrate（config/tools/MCP/engDesignTokens 水合/systemPrompt/history 重指/上下文注入——每轮执行）；③ 回合上下文注入（:350-394——每轮原样）。runAgent 加 `opts.agent`（仅 depth-0 honored）：存在 → hydrate 复用；缺省 → 工厂新建（子代理/向后兼容）。

**改造面**（从 explore 一手报告提炼——详见各文件:行）：
1. **setup.mjs**：拆 buildTopLevelAgent（对象构造 :252-284）+ hydrateRun（每轮 reconcile：config :150-199 保留每轮拾取外部变更/tools+MCP :93-148 每轮重建/engDesignTokens 水合 :219-250 每轮保留（settle 落盘在 run 外——hydrate 是唯一 reconcile 点）/systemPrompt 每轮/stateSink 附加不动（子级专属））。
2. **agent.mjs runAgent**：:79-80 改——顶层 + opts.agent → hydrateRun（跳过构造）；:84-103 逐 run 覆盖字段；resume 迭代（ContinueError/Ctrl+I）传同一 opts.agent（单例）——但每 runAgent 调用仍做 per-run 复位（= 现行为逐字对齐——避免续跑语义漂移）。
3. **panel-chat.mjs / chat-panel.mjs**：ChatPanel 构造加 `this._agent = null`；runPanelChatImpl ensureSlot 后 ensurePanelAgent（存在且 _engPersist 的 cwd×slot 匹配 → 复用；否则销毁新建）；runOpts 砍 engState/planMode 状态载荷（hydrate 直接从槽 reconcile——槽读保留：settle 落盘在 run 外）。
4. **销毁边界全列**（均 panel._agent = null）：loadSession（panel-session:121——switchSession/newSession/deleteSession/status 全覆盖）+
   applyProjectSwitch（panel-project:26）+ follow-active-editor（chat-panel:60）+ workspace-folder 兜底（chat-panel:76）+ panel dispose（chat-panel:162）+
   webview onDidDispose（chat-panel:101）。**安全前提（explore 确认）**：全部切换边界被 _turnActive/_susp?.active 守卫——销毁时无活回合/后台池。
5. **落盘链**：agentState(agent)/onComplete/onDistilled 闭包快照/engTokensMergeForSave/setSlotEngDesignTokens **全保留**（2026-09-08 澄清：每轮 saveLines 是对话持久化刚需——CLI 回合尾 saveSession 同款——非防丢保险；engDesignTokens settle 落盘 run 外触发——两者均与 agent 生命周期无关，该在还在）。砍的是"每轮经 opts 搬进全新对象"的搬运，不是槽读写。execute-tools.mjs:57-76 单例友好无需改。
6. **子代理/consult/escalate（depth>0）零改动**——opts.agent 仅 depth-0 honored；stateSink/entry.childAgent 语义不动。

### 11.2 per-run 字段回合边界复位清单（agent 复用后——防行为漂移）

**A. 每 runAgent 调用必须显式复位**（现靠重建清零）：
  - _touchedFiles/_verifiedThisRun/_verifyPassed/_verifyRetries/_honestReminderInjected/_pendingTimers/_lastPromptTokens/_usageAtLen/_compressFailures/_emptyRetries（**预算类**——评审 #6 无争议必复位）
  - _advisorRound/_advisorSession/_lastAdvisorOutput/_calledAdvisorThisRun/_mutatedThisRun/_pendingReminders/_inAutoTurn/_sessionSignal/_runStartHistoryLen/_lastCompressInfo
  - _lastEngState（**必须复位 false**——eng 进出重通知语义）。
  **顺序纪律**：复位清单先于 inheritedGuard 应用（:87-89——guard 标记继承到"复位过的"下一 run）。

**B. run 绑定每轮重指**（覆盖即可）：_provider/_role/cwd/history/_fullHistory/_planMode/config/_engPersist。

**C. 会话级保留（单例收益本体）**：_engDesignTokens（Map——hydrate reconcile + TTL，**永不复位清空**）/config 的 engineering+advisor.guard（槽权威）/ _engPersist（绑定键）/ _engDesignReviewed（顶层恒 false 无影响）/ **_tasks/_goal（评审 #5——会话级不复位）** / **_pendingReminders（SESSION §6 槽字段——会话级）**。

**D. 池载体仍挂共享 history 数组**（_asyncSubagents/_asyncAdvisors/_pendingAsyncResults/_consultSessions/_suspended/_asyncTombstones——agent.mjs:97-99 仅 run 期 attach）——单例不复用这些字段做持久化载体。

### 11.2.1 槽字段 ↔ hydrate 恢复映射（评审 #2——关闭 F4/AC3 恢复缺口）

destroy 边界（loadSession/project-switch/dispose/reload）重建单例时，以下槽持久化字段必须 hydrate 回填（槽 = 权威）：

| 槽字段 | hydrate 回填目标 | 说明 |
|---|---|---|
| engDesignTokens | agent._engDesignTokens（Map） | TTL 过滤（11.1① 已列） |
| engineering + advisor.guard | agent.config | 槽权威——config.json 仅镜像 |
| planMode | agent._planMode | B 类每轮重指 |
| tasks / goal | agent.tasks / agent.goal | **会话级（C 类）——destroy 重建必须从槽回填**（saveLines 已持久化——hydrate 增补读） |
| pendingReminders | agent._pendingReminders | 会话级——hydrate 回填 |
| activeModel/provider | agent._provider | B 类 |

**重建流程**：factory 新建 → hydrateRun（含上表回填）——首轮与 destroy 后重建同路径。扩展重载 → panel._agent = null → ensurePanelAgent 走同路径。

### 11.3 行为漂移裁定记录（2026-09-08 评审 #6——已全部裁定，无待裁项）

1. **_tasks / _goal：照 CLI 定——会话级不复位**（2026-09-08 核 CLI 代码：createAgent 初始化 agent.tasks/agent.goal → 跨回合保留——仅全 done auto-collapse 或 /new 清；goal 由 /goal 命令显式管理。CLI agent 常驻 = tasks/goal 天然会话级。VSC 现因重建丢 = 与 CLI 不一致——单例对齐即不复位——无需裁决）。
2. **_emptyRetries/_compressFailures/verify·advisor 预算类**：必须复位（防预算跨回合累计——无争议）。
3. **续跑语义**：resume 迭代（ContinueError/Ctrl+I）每 runAgent 调用复位 = 现行为逐字对齐（建议——保守）。

### 11.3.1 受影响文件表（评审 #3——行数 + delta 标注）

| 文件 | 改动 | 当前行数 | delta |
|---|---|---|---|
| src/agent/setup.mjs | 拆 buildTopLevelAgent + hydrateRun | ~396 | 重构（净 ~±20） |
| src/agent.mjs | runAgent opts.agent 分支 | ~325 | ≤±15 |
| src/extension/chat-panel.mjs | ChatPanel._agent + 销毁点接线 | ~290 | ≤±20 |
| src/extension/panel-chat.mjs | ensurePanelAgent + runOpts 砍 engState | ~430 | ≤±30 |
| src/extension/panel-session.mjs | loadSession 销毁接线 | ~437 | ≤±5 |
| src/extension/panel-project.mjs | applyProjectSwitch 销毁接线 | ~120 | ≤±5 |
| src/extension/panel-callbacks.mjs | 不变（落盘链保留） | ~130 | 0 |
| test/agent-lifecycle-singleton.test.mjs | **新增**——纯函数单测 | 新 | ~+150 |

### 11.4 测试

- **纯函数单测**（对标 eng-settlement.test 模式）：hydrate 复位清单纯函数 + ensurePanelAgent 绑定判定（cwd×slot 匹配/不匹配）——快层可测。
- 生命周期语义（回合复用/切换销毁）真机 slow 门控兜底。
- 回归：现有快层套件不 import setup/runAgent/panel-*——无直接网；补上述纯函数锁。

### 11.4.1 用例表（评审 #4——正常/边界/错误）

| 用例 | 类型 | 输入 | 预期输出 | 对应 |
|---|---|---|---|---|
| 连续多回合同 agent | 正常 | 同 panel 回合 1→2→3 | panel._agent 同一对象；_engDesignTokens 回合间携带 | AC1/F1 |
| 首轮建 + 后续 hydrate | 正常 | 首轮无 opts.agent | factory 新建 + hydrateRun；下轮 opts.agent → hydrate 复用 | AC2 |
| engState 移除 | 正常 | runOpts 无 engState | hydrate 从槽 reconcile；无 per-run 重建 | AC2/F2 |
| 回合尾落盘 | 正常 | 回合完成 | onComplete saveLines 写全历史 + 状态字段 | AC3/F3 |
| cwd×slot 匹配复用 | 边界 | 同 cwd 同 slot 第二轮 | 复用不销毁 | AC1 |
| cwd×slot 不匹配销毁新建 | 边界 | 换 slot 后下一轮 | 旧 agent 销毁 + 新 factory 建 | AC4/F4 |
| destroy 后重建回填 | 边界 | 切走再切回同槽 | hydrate 回填 tasks/goal/pendingReminders/engTokens | 11.2.1/AC3 |
| resume 续跑预算复位 | 边界 | Ctrl+I 中断续跑 | 每 runAgent 预算类复位（不跨迭代累计） | AC6/N5 |
| depth>0 子代理新建 | 边界 | eng-coder spawn | 子代理 runAgent 新建（opts.agent 不 honored） | AC5/N4 |
| config 外部变更 | 边界 | 会话中改 config.json | 下轮 hydrate 拾取（非首轮-only） | AC7 |
| destroy 期间守卫拒 | 错误 | 回合中（_turnActive）切 session | 拒绝——agent 不销毁（现有守卫） | AC4 |
| 扩展重载恢复 | 错误 | 进程杀后重开 | panel._agent=null → 重建 + hydrate 回填——盘不丢 | AC3/F3 |

### 11.5 验收

- AC1 顶层 agent 会话级单例：同一 panel 连续多回合 panel._agent 同一对象（_engDesignTokens 回合间携带）
- AC2 状态零搬运：opts.engState 移除——hydrate 从槽 reconcile（无 per-run 全量重建）
- AC3 落盘不退化：回合尾 onComplete 落盘保留（engDesignTokens 回合尾盘同步）——槽文件仍是权威
- AC4 切换销毁：loadSession/new/delete/project-switch/dispose 后 panel._agent = null + 盘不丢
- AC5 子代理不动：depth>0 runAgent 仍新建（无回归）
- AC6 复位清单生效：回合级计数器回合边界清零（advisor/verify 预算不跨回合累计）
- AC7 config/MCP 变更下轮生效（hydrate 每轮 reconcile——非首轮-only）
- 测试：纯函数单测绿 + 真机 slow 绿

### 11.6 merge 清单（评审 #7/#9——并入 §2 时执行）

- [ ] §2:89-93 「per-run vs 跨 run」现状段改写为会话级单例（评审 #9）
- [ ] §2 签名块 runAgent 加 opts.agent 说明（评审 #9）
- [ ] 守卫核验：六销毁点逐个确认 _turnActive/_susp 守卫在位（评审 #7——代码核对）
- [ ] SESSION.md:32 需求状态行更新（需求定稿 + 指向本 §11）（评审 #1）
- [ ] 本 §11 变更段折叠入 §2/§3（3 层→2 层）
- [ ] 变更记录补评审采纳行


### 11.7 交付缺口补强（2026-09-08 实现后父侧裁——a 案）

- **缺口（eng-coder 交付报告 §4 项 3 上报）**：§11.2.1/AC3「saveLines 已持久化 tasks/goal/pendingReminders」对纯 VSC 会话**不成立**——`agentState()` 只带 engineering/advisorGuard/engDesignTokens（run-helpers.mjs:228-236）——tasks/goal/pendingReminders **从不回写槽** → destroy/重载后这三字段只能靠对话文本重建（单例切走再切回同槽会丢——F4 场景）。
- **父侧裁（2026-09-08 用户批准 a 案）**：**agentState 补带三字段回写槽**——与 CLI 一致（CLI saveSession 带 tasks/goal——session.mjs:131/137）——单例收益完整跨 destroy 存活。
- **文件域扩展（越原 §11.3.1 表）**：`src/agent/run-helpers.mjs`（agentState 补 tasks/goal/pendingReminders）+ `src/extension/panel-callbacks.mjs`（onComplete 携入——现有 `{...agentState}` 透传即带）——原 §11.3.1 受影响表未列——实现时补登。
- **验证**：destroy（loadSession 切走）→ 切回同槽 → 重建 hydrate 从槽回填 tasks/goal/pendingReminders（原 11.2.1 用例表「destroy 后重建回填」行覆盖）。


## 12. async 子代理保真：丢弃可见 / 无孤儿 / 终态可辨（第 35 批，2026-09-11——GitHub #6）

> 需求 = `AGENT-LOOP（本仓·需求）§9`（F-G1~F-G7 / N-G1~N-G4——指针不重述）。
> 任务书 = `2026-09-11-VSC-ASYNC-PARITY（CLI 仓）§2`。
> 本批 = **VSC 单端**（CLI 仓代码/测试零改动，仅只读对位）；批次档 §1 的 issue 断言按 §12.1 复核结论执行。

### 12.1 issue 四根因现场复核（as-of 2026-09-11——修前必读；issue file:line 与现行树多处不符）

**① async spawn 返回 raw object → `[object Object]`（模型拿不到 id）——机制不成立。**
spawn ack 早已是 JSON 字符串：`src/agent-tools/subagent-async.mjs:324-326`（running）/ `:336-342`（queued），
与 CLI 对位一致（`src/agent-tools/subagent-run.mjs:193/201`），且被契约测试断言（`test/batch-doc-gate.test.mjs:79-89` 的 `JSON.parse(ack)`）。
→ 修 ① 会改错东西；本批只做纵深防御 = F-G1 契约锁 + F-G2 类型守卫。

**② abort 时 `asyncMap.clear()` 静默清池、无注入通知——成立。**
`src/agent/run-stages.mjs:255-259`（plain abort → 清 subagent + advisor 两池，仅落 `ev:stopped` 日志、模型零提示）。
→ 修：F-G3（丢弃提醒 + 终态记录），只对真被丢弃的条目。
会话收尾站 `src/extension/suspension.mjs:299-308` 形似——**评审轮次 1 #1 复核裁定：非本批修复面**（F-6 后仅面板销毁路径驱动、清池时条目已全死、无活消费方——需求 §9.4 跨会话排除面；机理与归属见 §12.8 #6），勿顺手接线。

**③ 回合非正常结束 → 孤儿 / 报告静默丢失——成立（会话内路径）。**
会话子代持**会话 signal**（`src/agent-tools/async-settle.mjs:86-88` buildChildSignal；`src/extension/panel-chat.mjs:411` sessionSignal），
而 F-6（2026-09-09 用户裁定）后 Stop 只停当前轮 controller（`src/extension/panel-messages.mjs:218-221`）——
digest 轮被 Stop 时出现「子代存活 ∧ 池被 clear」：子代成孤儿，其 settle 的 `removeFromAsyncPools` 作用于已空 Map，报告无人消费。
→ 修：F-G4（清池只清已死）+ F-G5（会话不搁置后台池）。

**④ 空池恒返 `{done:true}` → abort-discard 后读成「已消费」——机制不成立、语义面残留。**
`check` 动作已随 §19.8（2026-09-06）删除（`src/agent-tools/subagent-actions.mjs:4-5`——结果仅自动通道）；
残留 = 已丢弃 / 已取消的 id 在 `status` 面回 `unknown async subagent id`（同文件 `:116`）——同样读作「从未存在 / 已消费」。
→ 修：F-G6/F-G7（终态记录 + `status` 终态回显 + dependsOn 停靠）。

**症状1「新消息把还在跑的子代理杀了」（issue 标题）——机制已亡。**
busy 拒收（`src/extension/panel-messages.mjs:56-61`）+ 挂起期消息走单槽 pendingInput（`src/extension/suspension.mjs:241-256`）
+ F-6 废除 D-S9 susp 全停（`src/extension/suspension.mjs:195-201`）。→ 现状锁（T-D10），不重开、不修。

**边界澄清**：③ 只在「子代持会话 signal」时成立；顶层轮 Stop 时子代随轮 signal 中止，清池即诚实（清池 ⟹ 子代已死）。本批补的是这条不变量的缺口，
不重开 F-6 的「Stop 不停后台池」裁定（那是用户裁定，不是缺陷）。

### 12.2 方案选型（批次 §1 待裁 1/2/3 的裁定——候选 ≥2，否决项给理由）

**(a) 丢弃通知的注入形态**（待裁 1）：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| a1 | 结果面（附在某个工具结果上） | 中止发生在工具调用**之外**（回合收尾/会话驱动）——无在飞工具结果可附；模型此刻不在等任何工具回执 | 不可实现 | 否决 |
| a2 | 块面（webview ⟦ev⟧ 事件族） | 只达**用户**（webview 渲染），模型看不到；且块面已被 F-6/活动区分支占位（他批） | 不达模型 + 越界他批 | 否决 |
| a3 | 消息面（user-role system reminder 注入 history） | 唯一可达模型的通道；同形：cancel 提醒 `src/agent-tools/subagent-actions.mjs:161-174`（`injectCancelReminder`——取消注入的既有形态）；中止 = 全池取消，形态对称 | 选定形态；实现单点放新模块，不复制既有函数 | **选定 a3** |

**(b) 「已丢弃」的表示形态**（待裁 2——`{done:true}` 的现代表达）：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| b1 | 池内新 state（如 `status:"discarded"`） | 池条目状态机是**在飞**语义（refill/准入/域冲突全读它）；新增终态值会渗进调度与 webview 行派生 | 改动面大且与 done-in-pool 统一表示冲突 | 否决 |
| b2 | 旁路记录 Map（`_asyncDiscarded`——引例：否决备选名，两仓皆无） | 第二份终态账（与墓碑语义重叠）——违反 D2 单一权威源 | 双账本 | 否决 |
| b3 | 既有终态记录（墓碑）扩展 + `status` 回显 | 墓碑已是**跨 run 存活的终态单一记录**（`src/agent-tools/subagent-scheduler.mjs:69-88`，dependsOn 消费 `:165-178`）；只需新增 status 值 `discarded` 与一个读取器 | 单账本、零池态改动、零调度面扩散（depInfo 映射见契约 12.3） | **选定 b3** |

**(c) 中止时池的生命周期**（待裁 3）：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| c1 | 全清（现状 `asyncMap.clear()`） | 清掉存活子代 = 孤儿（③）；清掉已完成未取回条目 = 丢弃真报告；模型零提示（②） | 缺陷本体 | 否决 |
| c2 | 全留（一条不清） | 已死且 queued 的条目**永不启动也永不出池** → `poolLive`（`src/extension/suspension.mjs:49-56`：size>0 即真）恒真 → 挂起会话不退出；死 running 条目虽会随 settle 出池但状态含混 | 僵尸/悬挂 | 否决 |
| c3 | **只清已死**（丢弃判定见契约 12.3） | 存活条目留池（F-6 一致：其报告仍沿自动通道到达）；done-in-pool 留池（报告零丢失——自动通道是唯一消费方，§19.8）；已死条目出池 + 留痕（提醒 + 墓碑） | 单一不变量：**清池 ⟺ 该条目已死且其报告不可达** | **选定 c3** |

### 12.3 契约（实现契约——逐条定稿；文案/判据即验收对象）

**C-1 丢弃判定（单点，新模块 `src/agent-tools/async-discard.mjs`）**

```
丢弃 ⟺ entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(entry) === true
保留 ⟺ 其余（含：存活子代（会话 signal 未中止）/ done-in-pool / cancelled 条目——各由既有路径收尾）
```

- `parentAborted` 复用 `src/agent-tools/async-settle.mjs:76-80`（既有单点守卫，不新造谓词）。
- 判定读 `entry.signal`（子代有效信号——会话 signal 优先）与 `entry.controller`——与 settle/inject 同源。

**C-2 丢弃动作序（每条目）**：写终态记录 → 出池（`removeFromAsyncPools(parent, "subagent", entry.id)`）→ 汇总 → 整批**一次**注入提醒 + 一条 `ev:discarded` 日志。

- **签名与返回结构（评审轮次 1 #6 补——T-D3 消费）**：`discardAbortedPool(parent)`——`parent` 取 agent 形态（双载体同 `removeFromAsyncPools`：`parent.history ?? parent`）。
- 返回 `{ discarded, kept }`：`discarded` = 丢弃条目摘要数组 `[{id, role, wasStatus}]`（`wasStatus ∈ running|queued`——C-4 列表括号词的数据源）；`kept` = 判定后仍在子代理池的条目数（数字——T-D3 断言 `kept === 2`）。

**C-3 终态记录**：`writeTombstoneTo(history ?? parent, entry.id, "discarded", entry.role)`（既有写口，`src/agent-tools/subagent-scheduler.mjs:79-88`）。
新增读取器 `tombstoneOf(parent, id)`（同模块导出，status 动作消费）。

**C-4 提醒文案（verbatim 模板——测试断关键子串）**：

```
[System reminder: {N} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: {列表}. 
Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]
```

- `{列表}` = `role#id (was running)` / `role#id (was queued — never started)`，逗号连接。
- 模板中的换行仅为本档排版折行——实现为**单条文本**（词间单空格；测试断关键子串，不逐字断行）。
- 整条经 `escapeXml`（`src/agent/run-helpers.mjs`）后 `history.push({role:"user", content: ...})`——与 cancel 提醒同形态同注入面。
- **零丢弃 → 零注入**（零噪音；中止但无可丢弃条目时不产生提醒）。

**C-5 `status` 终态回显（`src/agent-tools/subagent-actions.mjs` 单查分支——池两查未命中后）**：

| 终态记录 | 返回 | note（要点） |
|---|---|---|
| `discarded` | `{id, role, status:"discarded"}` | 被用户 Stop 丢弃——报告不会到达（半成品未合入/未审计） |
| `cancelled` | `{id, role, status:"cancelled"}` | 被取消——报告不会到达（其工作已停） |
| `consumed` | `{id, role, status:"done"}` | 已送达——报告已注入会话 |
| `failed` | `{id, role, status:"failed"}` | 带错误结算——错误报告已注入，无待处理 |
| 无记录 | 现状 `{id, status:"error", error:"unknown async subagent id: <id>"}`（不变） | — |

无 id 概览（`overview.running/queued/done`）**形态零变**（终态记录是 id 级查询面；概览不引入无界增长字段）。

**C-6 dependsOn 停靠（`src/agent-tools/subagent-scheduler.mjs` depInfo）**：墓碑 `discarded` → 返回 `{state:"cancelled", role}`（与取消同分支：依赖者驻留 depc、等父决定）——
不新增调度器 state 值、不改 AUTO 放行规则。理由：丢弃 = 依赖未交付，静默放行是错的；冒 `unknown` 硬错同样失真。

**C-7 工具结果类型守卫（`src/agent/execute-tools.mjs`）**：工具 `execute` 返回**非字符串** → `throw`（既有一层 catch 转 `Error: ...` 可见结果，模型读得到）——
文案含 `must return a string value`；不得静默 `String(raw)` 成 `[object Object]`。CLI 对位：`src/agent/dispatch.mjs:413`（CLI 仓）只 guard `undefined`——本端扩为全类型（差异登记 §12.8 #3）。

**C-8 会话不搁置（`src/extension/suspension.mjs` digest 轮）**：`entry.runTurn` 抛 `AbortError` → 记 `digest:stopped` 日志 + `continue`（`finally` 照发 `digest end ok:false`）；
非 AbortError 照旧上抛（`digest-visibility` T-D3 契约零变）。循环退出条件不变：池空 + 无 pending 由步骤 3 自然退出。

**C-9 模块放置**：新模块 `src/agent-tools/async-discard.mjs`（只导出 `discardAbortedPool`；import `async-settle.mjs`（parentAborted）+
`subagent-scheduler.mjs`（getAsyncPool/removeFromAsyncPools/writeTombstoneTo）+ `run-helpers.mjs`（escapeXml）——模块图无环、叶子向）。
`subagent-async.mjs` **零改动**（499 行贴线——不越 500）。**收口注（群 B §16 承接——2026-09-11）**：原「零改动」= 第 35 批排程口径；本批以净减方式迁出预算块（499 → ~470）——§12 冻结面限「语义零改」，行数净减不越线。

### 12.4 受影响文件表（行数 as-of 2026-09-11 实测 → 预计；口径 = 读档 `N lines total`；源文件硬限 500）

| 文件 | 现 | 预计 | 改动点 |
|---|---|---|---|
| `src/agent-tools/async-discard.mjs` | 新 | ~75 | 丢弃判定/出池/墓碑/提醒（C-1~C-4） |
| `src/agent/run-stages.mjs` | 298 | ~+8（≤306） | 中止分支：`clear()` → `discardAbortedPool` + `ev:discarded`（含 advisor 池留原样注释） |
| `src/agent/execute-tools.mjs` | 480 | ~+5（≤485） | C-7 类型守卫（**他批在写——排程串行**） |
| `src/agent-tools/subagent-actions.mjs` | 384 | ~+18（≤402） | C-5 终态回显分支 |
| `src/agent-tools/subagent-scheduler.mjs` | 491 | ~+7（**≤498 贴线**） | `tombstoneOf` 导出 + depInfo `discarded` 映射（C-6）——越 500 停下报告 |
| `src/extension/suspension.mjs` | 359 | ~+7（≤366） | C-8 digest 轮 AbortError 容忍 |
| `test/async-parity.test.mjs` | 新 | ~200 | T-D1~T-D10（§12.5） |
| `test/files.mjs` | 59 | +1 | 新档登记 |

**行数拆分口径（评审轮次 1 #2 补）**：`run-stages.mjs` 298 → ≤306 **跨 300 行咨询线**——本批仅中止分支接线（≈8 行），**不拆分**（300 为咨询级、无阻断语义）；若后续批次再增长，挂结构债候选。`subagent-scheduler.mjs` 491 → ≤498 贴 500 **硬限**——越线停下报告（不带代偿）。

文档（设计者写域，coder 零碰；已落——实测行数）：`AGENT-LOOP（CLI 仓）` 245 → **297**（§9）·
本档 529 → **731**（as-of 2026-09-11 修正轮后实测——§12 + §1 模块地图行 + §5 指针 + 变更记录行）· `2026-09-11-VSC-ASYNC-PARITY（CLI 仓）§2`（任务书）·
本仓 `docs/TODO.md` 需求池（2 条 → 3 条）——产品级台账已退役（台账单仓化：现体 = 仓根 `docs/TODO.md`）。

### 12.5 用例表（正常 / 边界 / 错误——输入 / 预期输出；映射列 = 需求号）

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-D1 | 正常 | `subagentTool.execute({role:"explore",task,async:true})`（running 与 queued 两形态，桩 runAgent） | 返回值为 `string`；`JSON.parse` 得 `{id, role, status}`；id 与 `_asyncSubagents` 键一致 | F-G1 |
| T-D2 | 错误 | `executeToolBatches` 驱动返回对象 / `undefined` 的假工具 | 工具结果以 `Error:` 开头且含 `must return a string value`；不含 `[object Object]`；正控（字符串工具）原样通过 | F-G2 |
| T-D3 | 边界 | 池四条目：死 running（轮 signal 已 abort）/ 死 queued（controller 已 abort）/ 活 running（会话 signal 未 abort）/ done-in-pool | `discardAbortedPool` 只清前两条（`discarded.length === 2`）；`kept === 2`；活条目与 done 条目仍在池；墓碑恰 2 条 `discarded` | F-G4 |
| T-D4 | 正常 | 同上（含 2 条丢弃） | history 末恰 1 条 user-role 提醒：含两 `role#id`、`will NOT arrive`、`discarded`；XML 转义生效；**零丢弃 → 零注入** | F-G3 |
| T-D5 | 正常 | `finalizeAgentTurn`（signal 已 abort 非 interrupt）+ 混合池 + history | 死条目出池 + 墓碑；活条目留池；`ev:stopped` 与 `ev:discarded` 各一条日志 | F-G3/F-G4 |
| T-D6 | 边界 | 同上，`depth===0` | `history._asyncSubagents === agent._asyncSubagents` 且 size>0（池未被摘除/未换 Map——`run-stages.mjs:279` 回写保留） | F-G4 |
| T-D7 | 正常/错误 | 桩 `suspensionSession` + runTurn：① 抛 `AbortError`（池 live）② 抛普通 Error | ① 会话不退出（继续到池空自然退出）；② 照旧上抛（digest-visibility T-D3 契约零变） | F-G5 |
| T-D8 | 正常/边界 | `subagentTool.execute({action:"status", id})`：墓碑 discarded / cancelled / consumed / failed / 无记录 | 四种终态各自 `status` + note；无记录仍 `unknown`；无 id 概览形态零变 | F-G6 |
| T-D9 | 边界 | `depInfo(parent, id)`：墓碑 discarded；`dependsOn:[id]` 的新 spawn | 返回 `{state:"cancelled", role}`（depc 分支）；后续 spawn 入 queued 标 depc 而非抛 unknown | F-G7 |
| T-D10 | 现状锁 | 面板 susp 态收到 `userMessage`（`handlePanelMessage` 直驱，桩面板） | 池 Map 引用与条目数不变（新消息不动池）；busy 态走拒收（不新开并发回合） | 症状1 现状 |

### 12.6 验收标准（逐条回指需求——每条可机器验证）

| AC | 判据 | 回指 | 用例 |
|---|---|---|---|
| AC-G1 | T-D1 全绿（两形态） | F-G1 | T-D1 |
| AC-G2 | T-D2 全绿（含正控） | F-G2 | T-D2 |
| AC-G3 | T-D4 全绿（提醒恰一条 + 零丢弃零注入） | F-G3 | T-D4 |
| AC-G4 | T-D3 + T-D5 + T-D6 全绿（清池 ⟺ 已死 + 载体不变式） | F-G4 | T-D3/5/6 |
| AC-G5 | T-D7 全绿（① 不退出 ② 照旧上抛） | F-G5 | T-D7 |
| AC-G6 | T-D8 全绿（四终态 + unknown 不变） | F-G6 | T-D8 |
| AC-G7 | T-D9 全绿（depc 停靠） | F-G7 | T-D9 |

公共 AC（NFR）：**AC-N1** 快层 `npm test` 全绿（既有异步族零伤）；**AC-N2** `test/files.mjs` 登记行在位且新档被跑；
**AC-N3** `git status` 证 CLI 仓代码/测试零改动；**AC-N4** 两仓 `check-doc-width` 本批触碰档新增违规 0 + 行数表实测相符。
覆盖注记（评审轮次 1 #7）：**T-D10**（现状锁）由 **AC-N1 + AC-N2** 覆盖（新档被跑 + 快层全绿含该档）；语义 = 症状1 现状锁（不重开、不修），不单设 AC 行。

### 12.7 边界（本批不做——不得在实现中自行扩面）

- **UI / 交互决策（全落档，无 open 项）**：本批 **webview 与交互面零改动**——块/行/⟦ev⟧ 事件族与既有文案一律不动
  （用户可见面维持现状：中止后块按既有 error/done 终态回收）；新增可见面只有两处且都是**模型可见**（C-4 history 提醒、C-5 status 回显）。
- 不改 CLI 仓任何代码/测试（只读对位）；不改 webview 呈现与 ⟦ev⟧ 事件族；不新增块状态。
- 不修 advisor 池同构问题（见 §12.8 #1——**登记**，勿顺手改）；不改 `subagent-async.mjs`（499 贴线）。
- 不重开 F-6/INPUT-LOCK/D-S9 裁定；不改 settle/注入/墓碑既有语义（只新增一个 status 值与一个读取器）。
- 不改 `_pendingAsyncResults` 语义：run-stages 中止分支现状保留（subagent/advisor 停靠项不清、consult/escalate 清——`run-stages.mjs:236-242`）；会话收尾站（`suspension.mjs:299-308`）四族全清现状亦原样保留（§12.8 #6 登记）。
- 不修会话收尾站清池（`suspension.mjs:299-308`）：F-6 后仅面板销毁/扩展重载路径驱动、清池时条目已全死、无活消费方——需求 §9.1「会话收尾」的会话内落点已由 F-G3~F-G5 覆盖，面板销毁面属 §9.4 跨会话排除面（§12.8 #6）；不做跨会话丢弃追溯。
- 不新建文档档；不写 CHANGELOG/README/TODO（父侧核销面）。

### 12.8 双端差异登记与残留（父侧知悉——不在本批扩面）

| # | 项 | 现状（对位） | 处置 |
|---|---|---|---|
| 1 | advisor 池同构缺口 | 同一中止分支 `run-stages.mjs:271-277` 对 `_asyncAdvisors` 仍 `clear()`——会话内被 Stop 时的存活评审同样会成孤儿（报告损） | **登记 → 已承接**（群 B 批——本档 §15：`discardAbortedAdvisors` 复用 C-1~C-4 判定；原「本批不修」为第 35 批排程口径） |
| 2 | CLI 面无丢弃提醒与丢弃终态记录 | CLI Stop = 全停（`key-handler.mjs:60-75`）→ 清池即诚实（无孤儿）；但其模型面同样无「谁被杀」提示、无丢弃终态 | **登记**（CLI 属他批/后续批——本批不改 CLI） |
| 3 | 守卫口径差异 | CLI `dispatch.mjs:413` 只 guard `undefined`；本端 C-7 扩为全非字符串 | **登记**（本端从严——理由：`[object Object]` 静默污染正是 issue ① 的病征类） |
| 4 | 中止后 done-in-pool 报告的到达时点 | 本端留池 → 由**下一次**回合尾收集/会话 sweep 注入（不丢但可能滞后）；CLI 直接清掉 | **登记**（本端保全报告；自动通道唯一消费方裁定 §19.8 不变——不在中止路径新增注入点） |
| 5 | ack 的 id 类型 | 本端 ack `id` 为 number；CLI 为 `String(id)` | **登记**（本端 status/cancel 已做数值归一——不改） |
| 6 | 会话收尾站清池（`suspension.mjs:299-308`——评审轮次 1 #1） | F-6 后仅面板销毁/扩展重载生命周期路径驱动；dispose 先统一 abort → 清池时池内条目已全死、无活消费方（机理见 6 注） | **登记不修**（属需求 `AGENT-LOOP（本仓·需求）§9.4` 跨会话排除面——接线会引入与 C-4 文案不符的伪提醒；详见 6 注） |

**6 注（评审轮次 1 #1——会话收尾站机理与归属）**：F-6（2026-09-09 用户裁定）后 `susp.abort` 不再由停止驱动（`suspension.mjs:195-200`；面板内新会话/切换/删会话/切项目均有 `_susp?.active`/`turnBusy()` 守卫阻断——`panel-messages.mjs:135/143/166/186`），仅剩面板销毁/扩展重载路径（`chat-panel.mjs:243-244`：先统一 abort 控制器快照与会话句柄）。
清池时池内条目已全死（子代持会话 signal 或快照 controller——dispose 全 abort；清池 ⟺ 已死成立、无孤儿，与 run-stages 的活条目被清不同）。
消费方（面板/agent/webview 与 history 载体）同点消亡、abort 分支不落盘（`_saveLines` 仅 idle 分支——`suspension.mjs:320`），且终态记录载体（history 附加属性）不随会话文件持久化——写痕无读者；被清条目事后查询 = 面板重生后的新会话，属 §9.4 明示不追溯面。
接线 C-1~C-4 另有二患：C-4 文案（by the user's Stop）在此为伪 + advisor/consult 池面不对称。→ **不修**（勿顺手接线）。


## 13. 旧锚清理：`§24` → 本端节映射（群 A 批）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A3
> （指针 = `docs/TODO.md:165` + CLI 批 `2026-09-11-DOC-HYGIENE.md` §2.29.3——CLI 端已清（`§24`→`§11.x`））。
> 语义源：CLI §2.29.3 口径（**节粒度重锚 + `D-24x` 标签保留**）；双端纪律：本端节号自持——**不抄 CLI 的 `§11.x`**（本端 `§11` = 生命周期对齐段，非 async 池）。

**（a）口径（映射规则——本端）**：

- `D-24a` / `R14` / 角色分池 / `poolLimits` / other 池 → **本端 `§5`**（async 与后台池——角色分池 / 池容量 / settle 统一机制）；
- `D-24b` / `R13` / async advisor（实例上下文 / settle 记账 / 两池合计 / pending / digest / 陈旧判定） → **本端 `§9`**（会诊 / 飞刀 / advisor 完全异步化）；
- `R12`（depth-0 缺省 async） → **本端 `§5`**（async 缺省节）；
- `D-24x` / `R12`–`R14` **标签保留**（与 CLI 批口径同形）；替换仅改锚文本，其余逐字不动；
- `AGENT-LOOP.md §24 尾修复注` 形态（R-bug 双前缀注释）：该注两档均无（死指针）→ **去短语**（保留 `（2026-09-06）` 日期与修复内容）；
- 本仓 doc 行 `docs/design/ENG-TOKEN-BINDING-TUNING.md:80`：同规则重锚（设计者落——不在 coder 写域）。

**（b）逐行映射表（源码 13 档 39 行 / 40 处 token + doc 1 行；行号 as-of 2026-09-11——实现时以 grep 重扫为准）**：

| # | 文件:行（as-of） | 旧锚 → 新锚 | 域 |
|---|---|---|---|
| 1 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:94` | `§24 D-24b` → `§9 D-24b` | B |
| 2 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:105` | `§24 D-24b` → `§9 D-24b` | B |
| 3 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:111` | `§24 D-24b` → `§9 D-24b` | B |
| 4 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:123` | `§24 D-24b` → `§9 D-24b` | B |
| 5 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:163` | `§24 D-24b` → `§9 D-24b` | B |
| 6 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:213` | `§24 D-24b` → `§9 D-24b` | B |
| 7 | `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:260` | `§24 D-24b` → `§9 D-24b` | B |
| 8 | `src/advisor/messages.mjs（W12 已迁核——现体见批次档 §5）:50` | `§24 D-24b` → `§9 D-24b` | B |
| 9 | `src/advisor/messages.mjs（W12 已迁核——现体见批次档 §5）:80` | `§24 D-24b` → `§9 D-24b` | B |
| 10 | `src/advisor/messages.mjs（W12 已迁核——现体见批次档 §5）:90` | `§24 D-24b` → `§9 D-24b` | B |
| 11 | `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:96` | `§24 D-24b` → `§9 D-24b` | B |
| 12 | `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:118` | `§24 D-24b` → `§9 D-24b` | B |
| 13 | `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:202` | `§24 D-24b` → `§9 D-24b` | B |
| 14 | `src/agent/execute-tools.mjs:19` | `§24 D-24b` → `§9 D-24b` | B |
| 15 | `src/agent/execute-tools.mjs:261` | `AGENT-LOOP.md §24 尾修复注——` 短语删除（保 `2026-09-06` 日期） | C |
| 16 | `src/agent/execute-tools.mjs:425` | 同 15 | C |
| 17 | `src/agent/execute-tools.mjs:443` | `§24 D-24b` → `§9 D-24b` | B |
| 18 | `src/agent/run-stages.mjs:96` | `§24 D-24b` → `§9 D-24b` | B |
| 19 | `src/agent/run-stages.mjs:110` | `§24 D-24b` → `§9 D-24b` | B |
| 20 | `src/agent/run-stages.mjs:269` | `§24 D-24b` → `§9 D-24b` | B |
| 21 | `src/agent/setup.mjs:218` | `§24 D-24a` → `§5 D-24a`（`（R14）` 保留） | A |
| 22 | `src/agent/setup.mjs:240` | `§24 D-24a` → `§5 D-24a` | A |
| 23 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:25` | `§24 D-24b` → `§9 D-24b` | B |
| 24 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:93` | `§24 D-24b` → `§9 D-24b` | B |
| 25 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:183`（token ①） | `§24 D-24b` → `§9 D-24b` | B |
| 26 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:183`（token ②） | `§24 R12` → `§5 R12` | A′ |
| 27 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:193` | `§24 D-24b` → `§9 D-24b` | B |
| 28 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:197` | `§24 D-24b` → `§9 D-24b` | B |
| 29 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:234` | `§24 D-24b` → `§9 D-24b` | B |
| 30 | `src/agent-tools/subagent-async.mjs:314` | `§24 D-24a` → `§5 D-24a`（`（R14）` 保留） | A |
| 31 | `src/agent-tools/subagent-async.mjs:480` | `§24 D-24b` → `§9 D-24b` | B |
| 32 | `src/agent-tools/subagent-escalate-async.mjs（W12 已迁核——现体见批次档 §5）:4` | `§24 D-24a` → `§5 D-24a` | A |
| 33 | `src/agent-tools/subagent-escalate.mjs（W12 已迁核——现体见批次档 §5）:16` | `§24 D-24a` → `§5 D-24a` | A |
| 34 | `src/agent.mjs:24` | `§24 D-24b` → `§9 D-24b` | B |
| 35 | `src/agent.mjs:110` | `§24 D-24b` → `§9 D-24b` | B |
| 36 | `src/extension/panel-messages.mjs:228` | `§24 D-24b` → `§9 D-24b` | B |
| 37 | `src/extension/suspension.mjs:31` | `§24 D-24b` → `§9 D-24b` | B |
| 38 | `src/extension/suspension.mjs:62` | `§24 D-24b` → `§9 D-24b` | B |
| 39 | `src/extension/suspension.mjs:106` | `§24 D-24b` → `§9 D-24b` | B |
| 40 | `src/extension/suspension.mjs:306` | `§24 D-24b` → `§9 D-24b` | B |
| 41 | `docs/design/ENG-TOKEN-BINDING-TUNING.md:80`（doc 行——设计者已落） | `§24 D-24b` → `§9 D-24b` | B |

**计数（D3——可机判）**：全仓 14 档 / 41 处 token（行 40；其中 `advisor.mjs:183` 单行双 token）；
域分布 = A（`§5 D-24a`）5 处 · A′（`§5 R12`）1 处 · B（`§9 D-24b`）33 处 · C（去死指针）2 处；源码 = 13 档 39 行 40 处；doc = 1 行。

**（c）用例表（T-MA3——已退场：设计期编号，现态不在册）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA3-1（已退场——设计期编号；现态不在册） | 正常 | VSC 全仓 grep `§24`（排除 `_archive/`） | **零命中**（14 档 41 处全部落位） | AC-MA3-1 |
| T-MA3-2（已退场——设计期编号；现态不在册） | 正常 | 逐行对照本表键控（文件 + 新锚串） | 41 处逐处落位（域 A 5 / A′ 1 / B 33 / C 2） | AC-MA3-1 |
| T-MA3-3（已退场——设计期编号；现态不在册） | 边界（反证） | 合成含 `§24` 的行 → 同一 grep 断言捕获 | 报中（grep 非空转——修前红可复现） | AC-MA3-2 |
| T-MA3-4（已退场——设计期编号；现态不在册） | 边界（范围） | `test/**` / `webview/**` / `locales/**` grep | 零命中（本批范围外亦已零残留——扫描如实） | AC-MA3-1 |

**（d）AC（机判）**：

- AC-MA3-1：T-MA3-1 / T-MA3-2 / T-MA3-4（已退场——设计期编号；现态不在册）绿（零残留 + 逐行落位）；
- AC-MA3-2：T-MA3-3（已退场——设计期编号；现态不在册）绿（反证）；本批触碰档 `check-doc-width` 新增违规 0；VSC 快层全绿；
- AC-MA3-3：域计数对表（D3）：`§5 D-24a` 5 处 / `§5 R12` 1 处 / `§9 D-24b` 33 处 / 去死指针 2 处——数字与列表同改。

**（e）边界**：只清 `§24`（**不并修**同族旧编号锚——`§15`/`§18`/`§19.x`/`§20` 反描述串、prompts 内 `§11.1 R14`/`§18 D-E1a`/`§28 R26`——同族观察登记，另批勘察）；`docs/**` 记史面照留（本批只改上述 doc 行——1 行）；不建新档；D-24x / R12-R14 标签零改；**零行为**（纯注释文本）。

**（f）双端回指**：CLI 侧同族面已闭（`2026-09-11-DOC-HYGIENE` 批 C2——`§24`→`§11.x` 28 行）；本端映射不走 CLI 文本（各自节号自持——不追赶、不 byte 对齐）。

**变更记录**：2026-09-11 群 A 批——新增本节（旧锚 `§24` 清理：13 档 39 行 + doc 1 行；域规则 + 逐行映射表 + AC/用例）。

## 14. 受限通道描述面清单同步（群 A 批 A11）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A11（指针 =
> `2026-09-11-TUI-SELECTION.md:96`（CLI 仓）——CLI 批 20 A2 的 VSC 镜像候选；处置 =「取同源语义」）。
> 语义源：CLI 批 20 的受限变体动作清单（7 动作含 panel）；VSC 端独立落——**本端无 panel 动作**
> （`subagent.mjs:2-3`——§19.6 AC-P4），清单 = 本端全部动作减 spawn。

**（a）逐字表（`src/agent/setup.mjs`——受限变体 description 两行；行号 as-of 2026-09-11）**：

1. `:85`（eng-designer）——旧片段：
   `BLOCKING ONLY — spawn-only (no action:'status'/'escalate', no async).`
   新片段：
   `BLOCKING ONLY — spawn-only: the restricted channel has no action parameter (escalate/status/cancel/consume-design/observe/send are not available) and no async.`
2. `:86`（eng-coder）——旧片段：
   `BLOCKING ONLY — spawn-only (no action:'status'/'escalate', no async): the audit report decides your next protocol step.`
   新片段：
   `BLOCKING ONLY — spawn-only: the restricted channel has no action parameter (escalate/status/cancel/consume-design/observe/send are not available) and no async — the audit report decides your next protocol step.`

- 替换 = 片段级（其余文本逐字不动；行数零净变）；
- 「no action parameter」= 本端机制事实（`setup.mjs:71` `delete props.action`）——与 CLI 端「保留 action enum」形态差异如实落笔（两行非 CLI 文本镜像——「各端独立落」）；
- 清单序 = CLI 序去 `panel`；本端全部动作（`subagent.mjs:167`）= spawn/status/cancel/escalate/consume-design/observe/send——减 spawn = 上列 6 名。

**（b）§8 就地同步**（本档两处——清单同源）：

- §8 首 bullet「受限变体 spawn-only，无 status/escalate/async」→「受限变体 spawn-only，无 action 参数（escalate/status/cancel/consume-design/observe/send 不可用）、无 async」；
- §8 末 bullet「受限 spawn」条：补「action 参数整体移除（spawn-only——escalate/status/cancel/consume-design/observe/send 不可用）」+ 角色面校正为「eng-coder / eng-designer ctx 内」（eng-designer 通道既有——原句仅写 eng-coder，事实滞后）。

**（c）用例 / AC（机判）**：

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| T-MA11-1（已退场——设计期编号；现态不在册） | 正常 | grep `src/agent/setup.mjs`：`no action parameter`；6 动作名 | 恰 2 处；6 名全含于清单句 |
| T-MA11-2（已退场——设计期编号；现态不在册） | 边界 | grep 旧串 `no action:'status'/'escalate'` | 零命中 |
| T-MA11-3（已退场——设计期编号；现态不在册） | 回归 | 既有测试族（eng-designer-role / subagent 系）+ 快层 | 全绿 |

- **AC-MA11-1** = T-MA11-1 / T-MA11-2（已退场——设计期编号；现态不在册）绿；**AC-MA11-2** = 快层全绿 + `check-doc-width` 新增 0。

**（d）边界**：只改描述文本（两行）+ 本档 §8 两处同步；`subagent-spec.mjs` 主描述载荷零改；
机械门（`subagent.mjs:174-175`）零改；CLI 侧零改。

## 15. advisor 池中止收口：同构丢弃（群 B 批 B1——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（本仓）` §1 条目 B1（复议指令 = 用户 16:45「都一起做了」）；
> 原登记 = 本档 §12.8 #1（第 35 批「登记不修——advisor 池面属他批」）。
> 需求 = `AGENT-LOOP（本仓·需求）§11` F-I1 / N-I1~N-I3（指针不重述）。冻结面：§12 已交付契约（C-1~C-9）语义零改——
> 本批只新增 advisor 池同构面（C-10）；CLI 仓零写入。（编号避撞注：落档时与群 A A11 §14 并发——本批两节顺延 §15/§16。）

### 15.1 复议结论（修 / 维持登记——二择一必须有理由）

**结论 = 修**（复用 C-1~C-4 判定与动作序，扩展至 advisor 池）。理由三条：

1. **缺陷实存**（复核 as-of 2026-09-11）：中止分支 `src/agent/run-stages.mjs:271-277` 对 `_asyncAdvisors` 仍 `advMap.clear()`；
   评审条目 controller 经 `buildChildSignal` 链到会话 signal（`src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）:259-268`）——与子代理同款
   「子代持会话 signal」前提（§12.1 ③；F-6 裁定：Stop 只停轮 controller）⇒ 轮级中止时**存活评审被静默清出池**：
   其 settle 时 `removeFromAsyncPools`（`subagent-scheduler.mjs:62-66`）作用在已空 Map——报告不可达；同时
   **done-in-pool 条目（已完成待收集的报告）一并被清**——报告真丢失。两类损失与 §12.1 ②③ 逐条同构。
2. **修法面全现成、成本有界**：判定谓词 `parentAborted`（`async-settle.mjs:76-80`）；池 accessor 已含 advisor 键
   （`subagent-scheduler.mjs:42-47`——`getAsyncPool(parent,"advisor")` / `removeFromAsyncPools` 直接可用）；
   终态墓碑单账本（`writeTombstoneTo`——advisor id 与 subagent 共命名空间，`nextSubagentId` 跨池取号）；
   `status` 终态回显已覆盖 advisor id（`subagent-actions.mjs:119-137` 单查两池未命中查墓碑）——零新谓词、零新账本。
3. **原判理由已消解**：第 35 批「属他批」= **排程**理由（§12.8 #1 自注「修法同 C-1~C-4（同一分支复用判定）」），
   非机制理由；复议指令下无维持登记的理由。不修的残留代价 = 评审在 Stop 后静默消失（无提醒、无终态、报告损）——
   正是 §12 全批要治的病在 advisor 面的复制品。

**反对维持的补充评估**：advisor 的报告损可见损失低于子代理（评审可按需重发；token 未签发可重评）——但「静默」本身是缺陷
（模型不知道发生过什么、`status` 查 id 读成 unknown），且 done-in-pool 报告丢失与 F-G4 已裁原则（报告零丢失）直接冲突 → 维持不成立。

### 15.2 方案选型（实现形态——候选 ≥2）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **双导出 + 私有共享核**：`discardAbortedPool`（subagent，签名/文案零变）+ 新 `discardAbortedAdvisors`（advisor 文案）；私有 `discardRole(parent, spec)` 承载判定/出池/墓碑/汇总 | 既有 C-1~C-4 契约文本（含 C-4 提醒）零碰——T-D3/T-D4 断言零回归；新面文案独立可断；实现单核无重复（D2） | 模块 +~35 行（64→~99） | **选定** |
| 2 | 参数化单函数 `discardAbortedPool(parent, role)`（文案按 role 分支） | 调用侧仅需补参数；但既有导出签名变化（测试直调）+ 文案分支混排 | 回归面大、可读性降 | 否决 |
| 3 | 单函数一次处理两池（混合提醒文案） | 调用点一行；但 C-4 文案「subagent(s)」对 advisor 不真，改写既有契约文本 = T-D4 断言辞污染 | 契约文本污染 | 否决 |

### 15.3 契约 C-10（逐条定稿——advisor 池同构面）

**C-10a 丢弃判定（单点复用）**：与 C-1 逐字同谓词——`丢弃 ⟺ entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(entry) === true`。
advisor 条目无 `entry.signal` 字段——谓词天然走 `entry.controller.signal.aborted && !entry.cancelled` 支（`async-settle.mjs:76-80`）。

**C-10b 动作序（每条目）**：与 C-2 同序——写终态记录（`writeTombstoneTo(history ?? parent, entry.id, "discarded", "advisor")`）→
出池（`removeFromAsyncPools(parent, "advisor", entry.id)`）→ 汇总 → 整批**一次**提醒 + 一条 `ev:discarded` 日志（有丢弃才记）。

**C-10c 提醒文案（verbatim——测试断关键子串）**：

```
[System reminder: {N} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: {列表}.
No design token was issued for a discarded design review; launch the review again if it is still needed.]
```

- `{列表}` = `advisor#id (design|code) (was running)`，逗号连接（advisor 池无排队语义——超限即拒，`advisor-async.mjs:219-221`；`wasStatus` 恒 running）。
- 整条经 `escapeXml` 后 `history.push({role:"user", content})`——与 C-4 同注入面；**零丢弃 → 零注入**。

**C-10d 接线点（唯一）**：`src/agent/run-stages.mjs:271-277` 中止分支——`advMap.clear()` → `discardAbortedAdvisors(agent)`
（原「登记不修」注释退场为交付注释）。会话收尾站清池（`suspension.mjs:303-312`）维持 §12.8 #6 登记——本批不碰。

**C-10e 终态与复位面（既有机制免改）**：`discarded` 墓碑由 `subagent status <id>` 回显（`subagent-actions.mjs:124-132`）；
被丢弃条目的迟到 settle 走 aborted 分支（`advisor-async.mjs:333-337` → `record.state="cancelled"`、零注入零 token）；
丢弃后 `advisorReviewInFlight`（`advisor-async.mjs:88-98`）读空——guard 可推回重评（与子代理面同构）。

### 15.4 受影响文件（行数 as-of 2026-09-11 实测——口径 `N lines total`）

| # | 文件 | 现 | 预计 | 改动点 |
|---|---|---|---|---|
| 1 | `src/agent-tools/async-discard.mjs` | 64 | ~99 | 私有共享核 + `discardAbortedAdvisors`（C-10a~c） |
| 2 | `src/agent/run-stages.mjs` | 304 | ~306 | 中止分支接线（C-10d——2 行级；原跨 300 咨询线注记维持） |
| 3 | `test/async-parity.test.mjs` | 397 | ~440 | T-D11~T-D13（§15.5） |

文档面（设计者写域——已落）：本档 §15 + §12.8 #1 收口注 + §1 模块地图行 + 变更记录行。

### 15.5 用例表（正常 / 边界 / 错误——输入 / 预期输出）

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-D11 | 正常 | `finalizeAgentTurn`（signal abort 非 interrupt）+ advisor 池三条目（死 running：controller 已 abort / 活 running：会话 signal 未 abort / done-in-pool）+ history | 死条目出池 + `discarded` 墓碑；活与 done 留池；`ev:discarded` 恰一条；history 末恰一条 advisor 文案提醒（含 `advisor#id`、`(design)`、`will NOT arrive`） | F-I1 |
| T-D12 | 边界 | 同分支、零可丢弃条目（全活池） | 池零动；零提醒零 `ev:discarded`（零噪音） | F-I1 |
| T-D13 | 正常 | `subagent` 工具 `action:'status'` 查丢弃后的 advisor id | `{status:"discarded", role:"advisor"}` 回显（不再 unknown） | F-I1 |

### 15.6 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-B1-1 | T-D11 / T-D12 绿（清池 ⟺ 已死 + 零丢弃零噪音） | F-I1 |
| AC-B1-2 | T-D13 绿（终态回显） | F-I1 |
| AC-B1-3 | 既有 T-D3~T-D10 全绿（subagent 面契约零回归——C-4 提醒逐字未动） | N-I1 |
| AC-B1-4 | VSC 快层全绿；CLI 仓代码/测试零改动（`git status` 判据） | N-I1 / N-I3 |

### 15.7 边界（本批不做）

- 不改 C-1~C-9 契约与 subagent 面文案；不改会话收尾站清池（§12.8 #6 登记维持）；
- 不中止存活评审、不做自动重发/自动取消；不改 settle/注入/墓碑既有语义；不改 pending 单容器；
- CLI 面零改（CLI Stop = 全停 → 清池即诚实——§12.8 #2 登记维持）；
- **零 UI 面**（无面板 / webview / 事件族改动——丢弃的可见面 = 模型提醒 + status 回显，与子代理面同）。

**计数（D3）**：用例 3（T-D11~T-D13）· AC 4（AC-B1-1~AC-B1-4）· 实施域 3 档（async-discard / run-stages / 测试档）
· 文档域已落（本节 + §12.8 收口注 + §1 模块地图 + 变更记录）。

## 16. digest 注入预算统一（群 B 批 B5——VSC 镜像——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（本仓）` §1 条目 B5
> （BATCH-3 交付偏差承接口——CLI 仓台账需求池行）。
> 语义源（CLI 侧）：`AGENT-LOOP（CLI 仓）§22`（单源模块 / 四族接线 / 用例与 AC——指针不重述）；
> 需求 = `AGENT-LOOP（本仓·需求）§11` F-I2 / N-I1~N-I3。
> 镜像口径：语义同源、本端原文自持、零跨仓依赖（无 import / 无同步脚本）——差异登记 §16.5。
> 冻结面：§5 / §9 / §12 / §15 已交付契约零碰；CLI 仓零写入。

### 16.1 问题（现状复核 as-of 2026-09-11）

预算现覆盖 = 仅 subagent 族：`DIGEST_INJECT_BUDGET` + `digestRoundFor` + `persistDigestReport` 全在
`src/agent-tools/subagent-async.mjs:372-437`，判超只在 `injectAsyncResult` 内联。三族绕过：
`injectAdvisorResult`（`advisor-async.mjs:471-480`）、`injectEscalateResult`（`subagent-escalate-async.mjs:210-220`）、
`injectConsultResult`（`consult.mjs:118-134`）——派发点 `injectPendingAsync`（`async-settle.mjs:54-69`）按 role 分流，
各族注入器不经 subagent 预算路径。多族条目同轮合并注入（挂起 digest 轮 `suspension.mjs:259-284` 与退出残余
`:313-322`、run-start 注入 `agent.mjs:70-75`、回合尾直采 `subagent-async.mjs:456-465` / `advisor-async.mjs:483-492`）
时可累计超限——BATCH-3 F-2 的原始事故面（1.3MB 请求体）在混合族轮仍可复现。

### 16.2 方案选型

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **共享叶子模块 `digest-budget.mjs`（单源）+ 四族注入器接线** | 常量/判超/记账/落盘四处合一（D2）；派发路径与直采路径全覆盖；`subagent-async.mjs` 释放 ~30 行（现 499——距 500 硬限 1 行） | 新档 ~70 + 三注入器各 +2~4 行 | **选定** |
| 2 | 只在派发点 `injectPendingAsync` 统一 | 单点最集中；但**直采路径绕过**（回合尾 collect 不经派发点）——覆盖不完备 | — | 否决 |
| 3 | 各注入器各自实现判超（不建模块） | 零新档；但记账双份/判超三份 = 多源漂移（D2）+ 轮记账互相看不见（跨族合计失效） | — | 否决 |

### 16.3 契约（逐条——实现对象）

**D-DG1 单源模块**：新档 `src/agent-tools/digest-budget.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/digest-budget.mjs`）——导出三件：`DIGEST_INJECT_BUDGET`（64×1024）；
`digestBudgetOver(history, size)`（判超 + 记账——`used > 0 && used + size > BUDGET` 首条豁免保留；轮界定
`history.length !== r.len + 1` 语义逐字自 `subagent-async.mjs:381-390` 迁入，键 = history）；`persistOverflowReport(raw, { cwd, tag })`
（`.thincoder/tmp` 落盘——落盘名 `tool-<ts><rand>-<tag>.txt`（`tag` = 溯源标签：写入族 + 条目 id——文件名后缀）；清单行；失败 null——调用方回退 inline）。

**D-DG2 四接线点**：`injectAsyncResult`（subagent 族——判超/落盘改调共享模块，标签与墓碑语义零变）；
`injectAdvisorResult` / `injectEscalateResult` / `injectConsultResult`（三族新接线——统一形态：raw 计入预算 → 超限
→ 落盘清单行（失败回退 inline 预览））。

**D-DG3 计数口径**：计入预算的 `raw` = 报告/错误正文（不含 `[System reminder: …]` 标签行——与既有 subagent 口径一致）；
错误条目同计同落盘。

**D-DG4 兼容面**：`subagent-async.mjs` 保留 `DIGEST_INJECT_BUDGET` re-export（测试导入面零改——`test/eng-settlement.test.mjs:27`）；
单条 offload 预览路径零改（单条大报告不回归）。

### 16.4 受影响文件

| # | 文件 | 现 | 预计 | 动作 |
|---|---|---|---|---|
| 1 | `src/agent-tools/digest-budget.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/digest-budget.mjs`） | 新 | ~70 | 单源模块（D-DG1） |
| 2 | `src/agent-tools/subagent-async.mjs` | 499 | ~470（净减） | 迁出 + re-export（**贴线缓解**） |
| 3 | `src/agent-tools/advisor-async.mjs（W12 已迁核——现体见批次档 §5）` | 493 | ≤498（**贴线注记**——越 500 停下报告） | +接线 |
| 4 | `src/agent-tools/subagent-escalate-async.mjs（W12 已迁核——现体见批次档 §5）` | 221 | ~224 | +接线 |
| 5 | `src/agent-tools/consult.mjs（W12 已迁核——现体见批次档 §5）` | 469 | ~473 | +接线 |
| 6 | `test/eng-settlement.test.mjs` | 290 | ~330 | T-DG1（W12 已退役——删除记录见批次档 §5）~T-DG3（§16.6） |

### 16.5 双端差异登记（语义零差——实现形态差异）

- 记账键：CLI = agent；本端 = history（既有差异——轮界定同式）；
- 落盘目录：CLI = configDir/tool-results + 清理轮转；本端 = cwd/.thincoder/tmp（offload 同目录）——既有差异；
- 零跨仓依赖——一致性由各端语义锚断言守（断言驻留绿）。

### 16.6 用例表

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-DG1（W12 已退役——删除记录见批次档 §5） | 正常 | 同轮两条 advisor 条目（各 40K 正文——合计 80K > 64K）直驱 `injectAdvisorResult` | 首条 inline 预览；次条 = 清单行（全文落盘——读档断言）+ 不 inline 全文 | F-I2 |
| T-DG2（W12 已退役——删除记录见批次档 §5） | 正常 | escalate / consult 族各一（超限形态） | 同规清单行（两族接线生效） | F-I2 |
| T-DG3 | 边界 | 跨族同轮：subagent 40K + advisor 40K | 次条判超（**共享预算**——单源记账） | F-I2 |

### 16.7 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-B5-1 | T-DG1（W12 已退役——删除记录见批次档 §5） / T-DG2（W12 已退役——删除记录见批次档 §5） / T-DG3 绿 | F-I2 |
| AC-B5-2 | 既有预算用例零回归（eng-settlement 全绿；`DIGEST_INJECT_BUDGET` re-export 恒等） | N-I1 |
| AC-B5-3 | 行数实测对表（subagent-async 净减；advisor-async ≤500）+ 两仓快层全绿 + check-doc-width 新增违规 0 | N-I3 |

### 16.8 边界（本批不做）

- 不改 offloadToolResult 阈值/单条路径；不改轮界定（相邻注入 = 同轮）；不改各族标签与墓碑语义；
- 不做跨轮累计/全局配额；不改 CLI 仓（镜像各自实现）；
- **零 UI 面**（预算行为不影响片/面板呈现——无 webview 改动）。

**计数（D3）**：用例 3（T-DG1（W12 已退役——删除记录见批次档 §5）~T-DG3）· AC 3（AC-B5-1~AC-B5-3）· 实施域 4 档改 + 1 档新
（subagent-async / advisor-async / subagent-escalate-async / consult / 测试档 + digest-budget 新档）。

## 17. 会话上下文注入面对齐（VSC-CONTEXT-PARITY 批——2026-09-11）

> 来源：批次档 `2026-09-11-VSC-CONTEXT-PARITY（本仓）` §1（用户 22:54「VSC 端会话体验与 CLI
> 差距巨大——提示词系统和注入信息面出现巨大差异，挖差异并修正使行为与 CLI 一致」+ 23:02 三条裁定：
> **权威源 = CLI 蓝图** / `[Current file:]` 收窄保留 / **提示词与注入顺序全对齐**；父侧 23:06 追加约束 =
> 注入落位与前缀缓存契约）。
> 需求 = `AGENT-LOOP（CLI 仓）§13`（F-Q1~F-Q13 / N-Q1~N-Q4——逐条回指）；语料面 = VSC `VSC-PROMPTS.md`
> 「语料修复」节；工具描述面 = VSC `TOOLS.md §12`。
> 镜像口径：语义同源、本端原文自持、零跨仓依赖（无 import / 无同步脚本）。CLI 仓零写入。
> 冻结面：§11（生命周期）语义零改（本 §17 只做注入面增补 + 顺序重排）；§5/§9/§12/§15/§16 零碰。

### 17.1 问题（现状复核 as-of 2026-09-11）

CLI 主会话每 run 有 10 类上下文注入块，VSC 端缺失 10 项中的 8 项、错位 1 项（系统提示尾块）、另有 2 项
「有收集无消费」死载荷；两家同有块的顺序也各不相同。逐条证据（VSC 侧均为零命中反证）：

| # | 项 | CLI 对位（基准） | VSC 现状（as-of） |
|---|---|---|---|
| 1 | 项目指令注入（AGENTS） | `src/agent/setup.mjs:341-344`（CLI 仓） + `helpers.mjs:324-348` | 无（`loadProjectInstructions` 零命中） |
| 2 | 记忆召回（≤3 条） | `setup.mjs:114-124` | 无（`memory.mjs:249 search` 存在但无注入调用） |
| 3 | 文档召回（≤5 条 chunk/300 字符预览） | `setup.mjs:100-113` | 无（索引为文件式向量索引——`indexer.mjs searchIndex` 存在但无注入调用） |
| 4 | checklist 推送 | `setup.mjs:126-139` | `tools/checklist.mjs:318 pendingItems` 已实现**零调用** |
| 5 | 工作目录快照（OS/cwd/Session start/目录树） | `setup.mjs:64-79` + `helpers.mjs:275-312` | 无（仅 systemPrompt 尾一行 `OS:/Working directory:`——`setup.mjs:338`） |
| 6 | 依赖大纲推送 | `setup.mjs:90-98` + `tools/repomap.mjs:185 buildSummary` | 无（`repomap.mjs` 仅工具面、无 summary 导出——`repoOutlineTool:121`） |
| 7 | skills 清单注入 | `setup.mjs:345-349` + `skills.mjs:116-122` | **载荷已传被丢弃**：`panel-chat.mjs:401` 算好传入 → `setup.mjs:133` 解构后无引用（死参数） |
| 8 | plan 节律重注（稀疏 2/满 5/新消息 + 进出 pending 句） | `src/agent-tools/plan.mjs:11-53`（W9 已迁核——现体 `thincoder-core/agent-tools/plan.mjs`） + `run-stages.mjs:91-108` | 仅压缩后重注一版（`run-helpers.mjs:280-285`）；`src/agent-tools/plan.mjs` 无提醒常量/pending 注入 |
| 9 | 异常 finish reason / 警告注入 | `run-stages.mjs:27-51` | 无（`ended abnormally` 零命中；`provider.mjs:244 _warnings` 通道存在但无注入消费） |
| 10 | skill 注入形态（`<skill-loaded>` + 转义 + 去重 + 不截断） | `src/agent-tools/skill.mjs:30-45`（CLI 仓） | 工具结果返回 + `slice(0,8000)` 截断 + 无转义 + 无去重（`skill.mjs:38-45`） |
| 附 A | MCP 警告（收集后无消费） | CLI 亦无 history 注入——可见面 = 采集点 `console.error` + `agent._mcpWarnings`（`cli/make-agent.mjs:104-109,124`） | `setup.mjs:177-184` 收集后无消费、无 console 可见面；注释自称「injected as a reminder」= 失真 |
| 附 B | 编辑器注入常驻噪声 | （CLI 无此面） | `editor-context.mjs:21-42` 每回合重注入同文（≤3000 字符） |

顺序差异（两端同有块）：CLI = git → 快照 → restarted → 大纲 → 文档 → 记忆 → checklist → 用户输入 →
env-state → peer → time → pending → AUTO；VSC = restarted → AUTO/许可 → git → 用户输入 → env-state →
peer → time → 编辑器注入（→ 图片指针挂用户消息）。VSC 独有：`[Current file:]`、permission 句（无
CLI 对位——`pushModeReminders` else 分支）、粘贴图指针。

### 17.2 方案选型

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 逐项就地移植（各块贴到现调用点） | 零新档；但 `setup.mjs` 现 464 行——+150 行必破 500 硬限（先拆 setup 又是一次额外手术）；顺序散布多处不可单测 | — | **否决** |
| 2 | 新增注入模块 `src/agent/context-injections.mjs`（每块一函数 + 单一编排入口） | `setup.mjs` 只 +~6 行；顺序单一权威（编排一处可见）；可直驱单测（hydrateRun 抄 history 序列）；新档 ~200 < 300 advisory | 新档 1（纯 .md/模组面） | **选定** |
| 3 | 跨仓共享注入模块（与 CLI 共实现） | 违反多实现面纪律（零跨仓依赖）；CLI 侧本批零改 | — | **否决** |

### 17.3 契约（逐条——实现对象；文案逐字 = 本表 / CLI 行号）

**D-CI1 新模块 `src/agent/context-injections.mjs`（~200 行）**——每块一函数，全部「只追加、只 transient、失败静默」：

- `loadProjectInstructions(cwd)`（cli `helpers.mjs:324-348` 同语义）：序 = 用户级 `~/.thincoder/AGENTS.md` →
  项目 `AGENTS.md` → `project_rules.md`（引例——运行期项目档名；源 = `src/agent/context-injections.mjs:46`）；各段 `<!-- From: <path> -->` 头；合并≤32_000 字符，超限前置 WARNING 注释（全文照收——软限）。
- `listWorkDir(cwd, { rootMax: 30, subMax: 10 })`（cli `helpers.mjs:275-312` 同格式）：dirs → files，
  跳过 `.git`/`node_modules`，隐藏计数，`(N more entries omitted)` 注。
- `pushOsSnapshot(agent, history, { platform, cwd })`：agent 级一次（惰性 `agent._osReminderInjected`——
  与 `_sessionStart` 同生命周期：随 agent 单例存、destroy 重建后重注、`resetRunState` 不清）；文案两形态逐字
  = cli `setup.mjs:74/:76`（有树：`[System reminder: OS: X. Working directory: Y. Session start: Z. Working directory snapshot:\n<untrusted_cwd_listing>\n…\n</untrusted_cwd_listing>]`；无树：短形态）。
- `pushOutline(history, cwd)`：新增 `repomap.mjs` 导出 `buildSummary(cwd)`（复用 `buildDepGraph`）→ 前缀
  `[System reminder: project dependency outline:`（cli `helpers.mjs:85` 常量值）；history 含同前缀 → 跳过；`(no …` 开头 → 跳过。
- `pushDocRecall(history, cwd, input)`：`getEmbedder()` + `loadIndexManifest(cwd)` 均在位才走
  `searchIndex(cwd, embedder, input, { kind: "doc", limit: 5 })`；行形态 = cli `setup.mjs:108-109`
  （`- path > heading: <untrusted_doc_chunk>…</untrusted_doc_chunk>`；预览 300 字符——safeSliceUTF16(
  `run-helpers.mjs:97`）；chunk 总数不可得时省略 `(N chunks indexed…)` 后缀（差异登记 §17.10）。
- `pushMemoryRecall(history, cwd, input)`：`memory.mjs search(cwd, input, { limit: 3 })`；行形态 = cli
  `setup.mjs:119-120`（`- [type] title: <untrusted_memory>content</untrusted_memory>`）。
- `pushChecklist(history, cwd)`：`tools/checklist.mjs pendingItems(cwd)`（既有——写回副作用同 CLI）；
  行形态 = cli `setup.mjs:134`（`- [~]` in_progress / `- [ ]` pending，只取 text）。
- `injectRunContext(agent, { history, cwd, input, depth, resume, autoTurn, platform })`：编排 #1–#7
  （§17.4），全部 `depth === 0 && !resume && !autoTurn` 门（召回面仅 depth 0——差异登记 §17.10）。

**D-CI2 `setup.mjs` 编排 + 系统提示尾块（[4] 层）**：

- 删 `:338` 的 `OS: … Working directory: …` 尾行（载体归 `pushOsSnapshot`）；
- systemPrompt 尾追加（cli `setup.mjs:341-349` 同序）：`\n\nProject instructions (follow these as project
  conventions):\n<untrusted_project_instructions>\n${escapeXml(projectRules)}\n</untrusted_project_instructions>`
  （不分 depth）+ skills 清单（depth 0——`\n\n${listing}`）；
- `hydrateRun` 中段改为调用 `await injectRunContext(...)`（落位 = 现 git 注入点；编排块 #1–#7 在此统一注入——**原 git 行与 restarted 段（`:396-399`）均随编排退役**，不原位保留；修正轮 #8）——顺序见 §17.4。

**D-CI3 skills 面（`src/extension/skills.mjs` + 消费）**：`loadSkills` 扩至 CLI 语义（`skills.mjs:51-109` 同构）：
项目层 → 用户层（`~/.thincoder/skills`）；`name/SKILL.md` + 平铺 `name.md`；名称 `/^[a-zA-Z0-9_-]+$/`；条目
`{ name, path, description }`（描述 = 头部 400 字符内首个非 `#` 行、截 120）；排序稳定。新增
`formatSkillListing(skills)`（cli `skills.mjs:116-122` 逐字：空 → `""`；≤3 条 `- **name**: description`；溢出
`  ... and N more`；前缀 `DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):`）。
`panel-chat.mjs:401` 载荷保留（消费面 = D-CI2 尾块——死参数消除）。

**D-CI4 plan 节律（`src/agent-tools/plan.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/plan.mjs`） + `agent.mjs` 接线）**：port cli `plan.mjs` 全部件——
三常量文案逐字（FULL/SPARSE/EXIT）；`SPARSE_INTERVAL=2` / `FULL_INTERVAL=5`；`planReminderForTurn(agent,
userMessageSince)` 计数语义逐条；`execute` 中 enter/exit 先置 `_pendingReminders` 再返包（cli `:72/:78`；
本端字段 = `ctx.agent._planMode`——既有差异，沿用）；`agent.mjs` 循环头接线（位置 = `injectEngineeringReminder`
之前，cli `run-stages.mjs:95-114` 同序）；`newUserSince` 判据 = 末条真实 user 消息（非 `[System reminder:`/
`[User interrupt:` 前缀）且长度 > `_planReminderAtLen`。压缩后静态行（`run-helpers.mjs:280-285`）保留。

**D-CI5 编辑器注入收窄（F-Q10）**：`setup-reminders.mjs pushInjections` 同文去重——`history` 已有内容相等
的消息则跳过该条（幂等注入）；采集面（`editor-context.mjs`）零改（无活动编辑器已返 null）；3000 上限不变。

**D-CI6 permission 句退役 + AUTO 落位（F-Q13/裁定 1）**：删 `setup-reminders.mjs:179-189 pushModeReminders`
与 `setup.mjs:412` 调用（CLI 无 permission 提醒——注释「parity」失真随删）；AUTO 推送唯一 = `agent.mjs:168-170`
循环检查（语义 = `getAuto() && !history.some(AUTO_REMINDER)`——cli `ensureAutoReminder` 同语义）；位置 = hydrate
全部注入之后（cli `setup.mjs:351` 尾位同构）。`run-helpers.mjs:289-299` 压缩重注删 permission 分支（保留 AUTO）。

**D-CI7 MCP 警告收口（F-Q11）**：`src/mcp/index.mjs:330-337`〔W7 迁移——现体 `src/extension/panel-mcp.mjs:55`〕失败分支加 `console.error("[mcp] " + msg)`（cli
`make-agent.mjs:106` 同前缀）；`setup.mjs:174-175` 注释修正（删除「injected as a reminder」不实句）；
`mcpWarnings` 字段保留（消费面 = console；不发明 history 注入）。

**D-CI8 skill 工具注入形态（`src/agent-tools/skill.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/skill.mjs`）——cli `skill.mjs:23-46` 对齐）**：load = 走 loader 语义
（含 `name/SKILL.md`）→ 去重（history 含 `<skill-loaded name="X"` → 逐字返回 cli `:33` 句）→ `_pendingReminders.push`
`<skill-loaded name="X" source=".thincoder/skills/X.md">\n${escapeXml(content)}\n</skill-loaded>\n\nFollow the
skill's instructions above for the current task.`（cli `:43` 逐字）→ 工具返回 `Skill "X" loaded. Instructions
will appear in the next message.`（cli `:45` 逐字）；**删 `slice(0,8000)`**；list → `- name: description` 行；
未命中 → `Error: skill "X" not found. Available: …`（cli 同形）。

**D-CI9 异常提醒（`run-stages.mjs` 新 `injectResponseReminders(agent, response)` + `agent.mjs` 接线）**：

- `response._warnings` 非空 → `[System reminder — warnings from your last response:\n- name: message]`
  （本端文本——本端无 stream rules，PROVIDER 传输面既定；语义同 cli `:30-36` 去重注入）；
- `response.finishReason` ∉ {`stop`,`tool_calls`} → `[System reminder: the previous turn ended
  abnormally — ${detail}. The assistant response that follows may be incomplete.]`（reasonMap 三档 + 兜底逐字
  = cli `run-stages.mjs:39-49`）；
- 调用点 = `agent.mjs` chat 返回后（cli `agent.mjs:293` 同位——在 interrupt/builtin 处理之后、toolCalls 分支之前）。

**D-CI10 顺序与尾块**：§17.4 / §17.5。

### 17.4 序表（CLI 现序 vs VSC 现序 vs 目标序——逐格）

基准 = cli `setup.mjs prepareRun`（非 resume、depth 0；余下各 run 同构）。

| 位 | CLI 现序（基准——行号 as-of） | VSC 现序（as-of——行号） | VSC 目标序 | 归属 |
|---|---|---|---|---|
| 1 | git context（`:54-63`） | restarted（`:396-399`） | git context | B |
| 2 | OS/cwd/Session start/快照（`:64-79`，进程一次） | AUTO/许可（`:412`） | OS/cwd/Session start/快照（agent 实例一次） | B |
| 3 | restarted（`:86-89`） | git（`:418`） | restarted（保留一次性闸） | B |
| 4 | 依赖大纲（`:90-98`） | 用户输入（`:429-432`） | 依赖大纲 | B |
| 5 | 文档召回（`:100-113`） | env-state（`:438-442`） | 文档召回 | B |
| 6 | 记忆召回（`:114-124`） | peer（`:446`） | 记忆召回 | B |
| 7 | checklist（`:126-139`） | time（`:448`） | checklist | B |
| 8 | 用户输入（`:140`） | 编辑器注入（`:450`） | 用户输入（+图片指针——`:454` 挂消息） | — |
| 9 | env-state（`:147-148`） | （图片指针 `:454`） | env-state | B |
| 10 | peer（`:149`） | | peer | B |
| 11 | time（`:157-161`） | | 编辑器注入（VSC 独有——去重后） | B* |
| 12 | pendingReminders（`:163-168`） | | time（最后——契约不变） | B |
| 13 | AUTO（`:351` 尾位） | | AUTO（循环头推送——实际位 = 全部注入后） | B |

- `B` = 每 run 尾区 transient 块；`B*` = 端特有但同尾区纪律。pendingReminders：VSC 消费点在循环头
  （`agent.mjs:177-180`，每回合）——相对位（time 之后）与 CLI 尾部 flush 同构，保留。
- 其余注入面：系统提示 = 四槽（两端同构，**零改**）+ [4] 层尾块（D-CI2）；压缩后重注 = 任务表 + plan 行 + AUTO
  （D-CI6；cli `context.mjs:214-234` + `run-stages.mjs:70` 同集合）。
- **restarted 段去向（修正轮 #8）**：现段 = `src/agent/setup.mjs:396-399`（`detectRestoredSession` + push——
  现位于 mode/git 之前）——由 `injectRunContext` #3 承接（目标位 = 快照之后）；**原段删除**（不原位保留——
  D-CI2「替换现 git 注入位置」= 编排调用落位，非保留 restarted 行）。

### 17.5 注入落位与缓存契约（父侧 23:06 约束——纪律）

**A 类（系统提示词头——会话内稳定）**：项目指令（AGENTS.md）· skills 清单（cli `setup.mjs:341-349` 同位）。
已知代价：盘上文件中途变更 → 全前缀失效（下 run 生效）——接受（登记 §17.9）。

**B 类（每 run 尾区 transient）**：git · OS/cwd/快照 · restarted · 大纲 · 文档召回 · 记忆召回 · checklist ·
env-state · peer · 编辑器注入 · time。纪律：**只追加（单调）**——新块只 push 到 history 尾；禁中段插入；
禁改写已入线消息（图片指针例外：本轮真实用户消息在发送前挂接）。

**time 最后（裁决）**：CLI 契约 = time reminder 最后（cli `setup.mjs:145-146/152-156`「prefix-cache contract」）；
VSC 现序违反了它（`:448` time → `:450` pushInjections）。**取「time 移到编辑器注入之后」**——对齐 CLI
（编辑器注入插在 peer 与 time 之间）；不选「改契约」（用户裁定 = 顺序对齐 CLI，且本端无契约理由支撑倒序）。

**机判（N-Q1）**：同一会话连续两 run 快照 —— 前一 run 的 `[system, ...history]` 必须是后一 run 请求体的前缀
且逐字节相等（用例 T-CI-9；压缩轮除外——重建线）。

### 17.6 受影响文件（as-of 2026-09-11；R24a 行数标注）

实施域（VSC 仓，15 档 = 源档 12（1 新 + 11 改）+ 测档 3（1 新 + 1 改 + 1 登记）——修正轮 #9 计数对齐）：

| # | 文件 | 现 | 预计 | 动作 |
|---|---|---|---|---|
| 1 | `src/agent/context-injections.mjs` | 新 | ~200 | D-CI1 全部块 + 编排 |
| 2 | `src/agent/setup.mjs` | 464 | ~470 | 删尾行/删 mode 调用/退块编排/尾块追加 |
| 3 | `src/agent/setup-reminders.mjs` | 266 | ~250 | 删 pushModeReminders；pushInjections 去重 |
| 4 | `src/agent/run-helpers.mjs` | 301 | ~295 | 删 permission 分支 |
| 5 | `src/agent/run-stages.mjs` | 306 | ~340 | +injectResponseReminders |
| 6 | `src/agent.mjs` | 366 | ~382 | plan cadence 接线 + 异常提醒调用 |
| 7 | `src/agent-tools/plan.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/plan.mjs`） | 33 | ~90 | D-CI4 port |
| 8 | `src/agent-tools/skill.mjs`（W9 已迁核——现体 `thincoder-core/agent-tools/skill.mjs`） | 53 | ~62 | D-CI8 |
| 9 | `src/extension/skills.mjs` | 30 | ~95 | loader 语义 + formatSkillListing |
| 10 | `src/extension/panel-chat.mjs` | 499 | 499（载荷不变；**贴线注记**——不得加行） | 仅注释 |
| 11 | `src/mcp/index.mjs` | 417 | ~419 → **0（W7 迁移——原档已删；现体 = 端壳 `src/extension/panel-mcp.mjs`）** | console 可见面 |
| 12 | `src/repomap.mjs` | 225 | ~245 → **304（实测）** | +buildSummary 导出；**结构债候选**〔实现后同步（2026-09-12）〕 |
| 13 | `test/context-parity.test.mjs` | 新 | ~260 → **385（实测）** | T-CI-1~T-CI-11（含子态 T-CI-2a/b/c、T-CI-3b——修正轮 #4）机判；**登记**（>300 咨询线）〔实现后同步（2026-09-12）〕——T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） |
| 14 | `test/files.mjs` | 72 | 73 | 新档登记 |
| 15 | `test/setup-reminders.test.mjs` | 267 | ~285 | AUTO 位置/无 permission/去重断言 |

文档域（设计者写域——coder 零碰）：本 §17 + `VSC-PROMPTS.md` + `TOOLS.md §12`。提示词与工具描述文件归
另两波（VSC-PROMPTS / TOOLS 设计节）。`src/agent/agent-state.mjs` 零改（`_osReminderInjected` 随 agent 单例存）。

**行数拆分口径（修正轮 #6——同 §12.4 同口径）**：`run-stages.mjs` 306 → ~340 **跨 300 行咨询线**（≤500
硬限内）——本批增量 = `injectResponseReminders` 单函数块（响应提醒面后续可独立成档）；本批不拆分，
**挂结构债候选**。

**实现后同步（2026-09-12——交付实测对齐）**：`src/repomap.mjs` 实测 **304**（预计 ~245）——超 300 咨询线（≤500
硬限内）；本批不拆分（与 §17.3 `buildSummary` 落点契约一致），**挂结构债候选**（同 `run-stages.mjs` 口径）。测试档：
`test/context-parity.test.mjs` 实测 **385**（预计 ~260）——超 300 咨询线，**登记**（本批不拆分）；语料修复波测试档
`test/prompts-async-guidance.test.mjs` 实测 **535**（as-of 本批交付对齐——当时越 500 硬帽）——**后经语料修复波（散文锚退役）降至 177**（≤500）；测试档同受 500 硬限无豁免——`child-permission` 超限拆分已落（方案 =
`LEDGER-SELF-CONTAINED.md §9`；行数表 = `VSC-PROMPTS.md` 语料修复节）。

### 17.7 用例表（正常/边界/错误三态——全部直驱 hydrateRun/模块函数，不跑真 LLM）

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-CI-1 | 正常 | depth 0 首 run（非 resume）；memory/index 均在位有命中 | history 块序列 = 序表 #1–#12；前缀与行形态逐字 | F-Q1~F-Q7 + F-Q13 |
| T-CI-2a | 边界 | AGENTS.md 缺；skills 目录空 | systemPrompt 无 `<untrusted_project_instructions>`、无 skills 尾块；零报错（静默） | F-Q1/F-Q5/F-Q7 |
| T-CI-2b | 正常（正向） | skills 目录 2 档（≤3）；AGENTS 在位 | systemPrompt 尾含 `DISREGARD any earlier skill listings. Current available skills (use the skill tool to load one):` 前缀 + 2 条 `- **name**: description`；无 `... and N more`；`opts.skills` 载荷与尾块一致（死参数消除——正向消费；修正轮 #4） | F-Q7/F-Q12 |
| T-CI-2c | 边界（截断） | skills 目录 5 档（>3） | 尾块恰 3 条 + `... and N more`；零报错（修正轮 #4） | F-Q7 |
| T-CI-3 | 边界 | 索引缺失/embedder 缺 | 文档召回块零注入（其余块在） | F-Q3 |
| T-CI-3b | 边界 | 记忆 search 零命中（索引在位） | 记忆召回块零注入（其余块在——修正轮 #4） | F-Q2 |
| T-CI-4 | 边界 | 无活动编辑器（injections 空）；同文重投 | 无 `[Current file:` 块；同文二次投递零新增 | F-Q10 |
| T-CI-5 | 边界 | 第二 run（同 agent 单例）；seam 计数（修正轮 #10） | 快照块不重注 + 快照 I/O 恰 1 次/实例（seam 计数）；outline 不重注 + 大纲生成恰 1 次/session（seam 计数）；time 在新尾 | F-Q5/F-Q6/N-Q2 |
| T-CI-6 | 正常 | plan enter → 连续turn / 新消息 / exit | FULL（进入）→ 稀疏 2/满 5/新消息语义；exit pending 句 | F-Q8 |
| T-CI-7 | 正常 | response.finishReason="length"；`_warnings` 非空 | 两条提醒文本逐字 | F-Q9 |
| T-CI-8 | 正常 | skill load（含 `name/SKILL.md` 形态）；重复 load | `<skill-loaded>` 消息 + 转义 + 不截断；二次 → 已加载句 | F-Q7（D-CI8） |
| T-CI-9 | 边界 | 连续两 run 快照（同会话） | 前一请求体 ⊆ 后一请求体且逐字节相等（前缀缓存契约） | N-Q1 |
| T-CI-10 | 错误 | 召回/大纲/快照内部 I/O 失败（mock 抛错）；seam 计数（修正轮 #10） | 该块静默跳过；其余块与 user 输入零影响；召回/大纲/快照各恰 1 次调用/run（失败不重试——seam 计数） | N-Q2 |
| T-CI-11 | 正常（双端对照） | 跨仓只读兄弟仓 （CLI 仓）`src/agent/setup.mjs`（`THINCODER_CLI_ROOT` 可覆盖；缺仓/异位 = fail-closed——显式失败不 skip；修正轮 #1） | 序表各 CLI 锚字面 + **文件内出现序**与 §17.4 单调一致检测——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；现体 = 兄弟仓 CLI 源在位（缺仓/异位 = fail-closed 显式失败）——该残部已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） | F-Q13 |

**跨仓只读语义（修正轮 #1——父侧裁定：保留 fail-closed 并写明；N-Q3/N-P1 登记豁免随附；T-CI-11 已退场——整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5）**：T-CI-11 读
**兄弟仓**（相对本仓根 `../thincoder`；环境 = 两仓并排 checkout（teamcode 工作区）；`THINCODER_CLI_ROOT` 可覆盖（**该口已退场——两仓合并批 2；末载体随批 3 · S5（R10）移除；删除记录 = 2026-09-13-TWO-REPO-MERGE §5**）——同
`test/prompts-mirror-anchors.test.mjs:21,30-34` 同款）。——该同款跨仓读面已退场（段删——两仓合并批 3 · S5（R10）；删除记录 = 2026-09-13-TWO-REPO-MERGE §5）。**缺仓/异位 = fail-closed（显式失败，
不 skip）**——理由：skip 会让「CLI 序变 → VSC 红」的漂移检测静默失效（本测试是双端序面的唯一机验锚；真空
通过比红更坏）。该只读检验属**交付期对照面**——产品/运行链路零跨仓依赖（无 import / 无同步脚本 / 无共享
模块）不变。需求侧登记补充 = `AGENT-LOOP（CLI 仓）§13.3` N-Q3 豁免句 + `PROMPT-SYSTEM（CLI 仓）§9.3`
N-P1 同款。

**N-Q2 seam 计数落点（修正轮 #10）**：调用次数断言就地挂 **T-CI-5**（快照 I/O 1 次/实例 · 大纲生成
1 次/session）与 **T-CI-10**（召回/大纲/快照 1 次/run——失败不重试）；计数形态 = 直驱测试对块函数 I/O 依赖
做计数包装（spy 形态实现选定、报告备案——判据 = 调用次数）。效果断言（不重注/静默）与计数断言并存、互为佐证。

### 17.8 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-CI-1 | T-CI-1~T-CI-11 全绿（`node test/run-fast.mjs`）——T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） | F-Q1~F-Q13 / N-Q1~N-Q4 |
| AC-CI-2 | 机检：`pushModeReminders` 全仓零命中；`Permission mode` 零命中；`slice(0, 8000)` 于 skill.mjs 零命中；`[mcp] ` 于 `src/mcp/index.mjs` 命中（W7 迁移——现体 = 端壳 `src/extension/panel-mcp.mjs`） | F-Q9/F-Q10/F-Q11 |
| AC-CI-3 | systemPrompt 两态：有 AGENTS → `<untrusted_project_instructions>` 在、`OS:` 尾行不在；无 → 两者均不在；skills 空 → 零追加 | F-Q1/F-Q5/F-Q7 |
| AC-CI-4 | 行数实测对表（§17.6）+ 两仓快层全绿（VSC 含新档登记）+ `check-doc-width` 新增违规 0 | N-Q3/N-Q4 |
| AC-CI-5 | T-CI-11 绿（跨仓只读兄弟仓 `../thincoder`；**fail-closed**：缺仓/异位 = 失败不 skip——修正轮 #1）；双端序锚漂移检测（CLI 侧序变即红）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；残部（跨仓只读源在位守卫）已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） | F-Q13 |

### 17.9 边界（本批不做）

- 不改 CLI 仓（代码/提示词）；不做跨仓依赖（产品/运行面——T-CI-11 跨仓只读检验除外：交付期对照、fail-closed，见 §17.7/§17.8；修正轮 #1/#7）；不改子代理（depth>0）的 **per-run history 注入面**（`[4]` 尾块不分 depth——F-P5 既定项、D-CI2）；不改 webview/面板协议；（T-CI-11 已退场——整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5）
- 不做注入预算/裁剪；不做 skills 热刷新；不做 `_warnings` 之外新警告源；
- 已知代价登记：A 类块随磁盘文件变更于下 run 生效（前缀失效一次）——接受；
- 反例处置登记：permission 句删除后「非 AUTO 模式提醒」面 = 本端无（CLI 同）——模板文本已覆盖确认门。

### 17.10 双端差异登记（语义同源——实现形态差异）

- 召回门：CLI 记忆/文档召回门 = `agent.memory` 存在（非 depth 门——子代理路径无该载荷）；本端 = 显式
  `depth===0` 门（本端索引/记忆为 cwd 级模块态，无门则子代理每 run 召回——语义对齐）。
- 文档召回后缀 `(N chunks indexed total — call doc_search if you need more)`：本端索引无全局 chunk 计数 → 省略。
- 文档召回行内 `> heading` 段：CLI 行模板含 ` > heading`（数据 = `doc_chunks.heading`——按 `##` 切块）；本端
  `searchIndex` 结果无 heading 字段（`{file, kind, startLine, endLine, score}`——`indexer.mjs:370`）→ 该段**恒缺**；（W8 已退役——核面承接见 `docs/core/design/MEMORY.md` §6.9）
  行模板逐字实现、条件段恒省（`context-injections.mjs:151`）〔实现后同步（2026-09-12）登记〕。
- 大纲生成：CLI = 索引 DB 断点（`doc_chunks`）；本端 = live `buildDepGraph`（workspace.findFiles ≤5000）——内容格式同构。
- warnings 行：CLI = `stream rule warnings`；本端 = `warnings`（无 stream rules——PROVIDER 传输面）。
- 转义集：本端 `escapeXml` 无 `'`→`&apos;`（既有差异；仅含撇号文本行面微差）。

### 17.11 关键决策记录（含否决备选）

| # | 决策 | 选定 | 否决备选（理由） |
|---|---|---|---|
| KD-1 | 注入实现形态 | 新增 `context-injections.mjs` 单模块 + 编排（§17.2） | 就地移植（撞 setup.mjs 500 硬限）；跨仓共享（违多实现面纪律） |
| KD-2 | time 位置 | time 移到编辑器注入之后（对齐 CLI 契约） | 改契约（保留 VSC 倒序）——无契约理由支撑，与裁定 3 相讳 |
| KD-3 | permission 句 | 删除（对齐 CLI）；AUTO 唯一推送点 = 循环检查 | CLI 侧补句（违裁定 1——权威源单向；且 CLI 本面无此语义） |
| KD-4 | `[Current file:]` 收窄形态 | 同文（路径+区间+内容）幂等去重 | 频次降采样（会静默丢上下文）；仅选区（改语义，超裁定 2 范围） |
| KD-5 | 并行节单宿主 | `discipline-engineering.md`（与 CLI 同宿主；镜像已登记同指） | pe 保留（改变 CLI 对位面；且 de 已含 R14 全段） |
| KD-6 | 恢复标题文本 | 镜像/CLI 同源标题（UI & interface design (from discipline.md) / 代码结构判据—…） | 残余文本仅补 `### `（备选已记——父侧可裁，仅换标题行字符串） |
| KD-7 | 召回 depth 门 | depth 0 门 + 差异登记 §17.10 | CLI 式无 depth 门（本端索引/记忆为 cwd 级模块态——子代理会多召回） |
| KD-8 | 两家死载荷 | skills：真实消费（尾块）；MCP：console 可见面对齐 CLI | 删除 skills 载荷（仍会重复读盘）；MCP 发明 history 注入（CLI 无此行为——违对齐判据） |
| KD-9 | 写入后增量重索引（E1 附） | 本批不做（出批登记——VSC indexer 无单文件 API，属索引板块） | 本批一并实现（跨板块、无设计基础） |
| KD-10 | 双端对照 AC 形态 | 跨仓序锚漂移检测（T-CI-11——机验；**fail-closed**——缺仓/异位 = 红不 skip；交付期对照面、产品面零跨仓依赖——修正轮 #1） + 序表逐格文档基准 | 真运行时双端 dump 脚本（双端 trace 形态未对齐——机验成本高于本批；留交付复核流程）；skip-if-absent（跳过 = 漂移检测静默失效——不取）——T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5） |

**计数（D3）**：用例 14 条（T-CI-1、T-CI-2a、T-CI-2b、T-CI-2c、T-CI-3、T-CI-3b、T-CI-4、T-CI-5、T-CI-6、T-CI-7、T-CI-8、T-CI-9、T-CI-10、T-CI-11；在役 13——T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5））——修正轮 #4 ·
AC 5（AC-CI-1~AC-CI-5）· 关键决策 10（KD-1~KD-10）· 实施域 15 档 = 源档 12（1 新 + 11 改）+ 测档 3（1 新 + 1 改 + 1 登记）（修正轮 #9）·
文档域 3（本 §17 / VSC-PROMPTS / TOOLS §12）。

## 18. 子代理审批面对齐：child permission gate（2026-09-12——VSC 单端）

> 需求源：本仓 `docs/requirements/AGENT-LOOP.md` §17（F-CP1/F-CP2）；批次：本仓
> `docs/batches/2026-09-12-VSC-CHILD-PERMISSION.md` §1（用户 2026-09-12 裁定 A：child（depth>0）写操作
> 走审批门——现状为「偶然的洞」）。目标语义 = CLI（参照实现：`src/agent-tools/subagent-spawn.mjs:300-324`（CLI 仓）
> 的 owner key 模态 + `src/agent/dispatch.mjs:289-299`（CLI 仓）的 `⟦ev⟧approval` 头标 + `src/tui/subagent-panel.mjs:54/:103`（CLI 仓））；
> CLI 仓零改（CLI 为语义参照，实现不动）。R2 文档矛盾修正（`ESCALATE.md` / `ENGINEERING-MODE.md` / `TOOLS.md` / 本档 §8 同族句——`TOOLS.md` 随修正轮 #1 扩列）随本批落档。

### 18.1 需求层（指针 + 对位索引）

| 需求 | 判定句要点 | 本档契约 | 用例 | 验收 |
|---|---|---|---|---|
| F-CP1（R1） | ask 弹卡带归属 `{child key} · {tool}` / auto·approve-all 静默 / 块头 ⏸ + 等待审批 / 覆盖 escalate / 取消释放 | §18.4 C-1..C-10/C-12 | T-CP1..T-CP16、T-CP18、T-CP19（W12 已退役——删除记录见批次档 §5） | AC-CP1..AC-CP6、AC-CP8/9 |
| F-CP2（R2） | 四处同族句改后与实现语义一致（机检措辞） | §18.4 C-13 | T-CP17 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:127`）） | AC-CP7 已退场（随 T-CP17 整删——删除记录 = `TESTING.md` §8.1（`:127`）） |

### 18.2 问题陈述（现状复核——as-of 2026-09-12，file:line 实测）

**三道闸同向关闭 → child 写操作静默直通**（VSC）：

| # | 闸 | 位置 | 事实 |
|---|---|---|---|
| ① | 深度门 | `src/agent/execute-tools.mjs:258`（批扫描 `:157` 同族） | 权限条件含 `depth === 0` → depth>0 永不进入权限阶段 |
| ② | 无通道 | `src/agent-tools/subagent-run.mjs:87-126` | child callbacks 八项（onToken/onReasoning/onToolCall/onToolResult/onToolPanel/onAgentTurn/onComplete/onQuestion）——无 permission 回调 |
| ③ | 预授权过宽 | `subagent-run.mjs:126` · `subagent-escalate.mjs:170` · `subagent-escalate-async.mjs:111` | 三处 child `runAgent(..., true, opts)` 的 `autoApprove` 形参恒 `true` → child `getAuto()` 恒真 → 权限阶段整段跳过（含 eng-coder 以外的写角色） |

**可写面**：写权 child = `coder` / `eng-designer`（`subagent.mjs` 角色白名单）；`explore`/`plan` 工具集限只读
（`readonlyToolNames`）；`eng-coder` spawn 时经 design token 预授权（C-3/KD-2——保持不弹卡；原标「§18 D-E3」系源注释旧锚，出处见 §18.9）（修正轮 #6）；`consult` 只读不涉。

**文档矛盾（R2 对象——全仓 grep 无「child 免审批」裁定）**：

| 档 | 行 | 现行措辞 | 与实现的关系 |
|---|---|---|---|
| `ESCALATE.md` | `:33` / `:79` / `:125` / `:143` | 「走正常权限门」/「权限门（`onPermissionRequest` 转发）」 | 与 depth 门 + 无回调直接矛盾（本批落地后成真——按落地真语义改写） |
| `ENGINEERING-MODE.md` | `:128-130` | 「免逐写询问，豁免粒度仅 onPermissionRequest 阶段」 | 措辞失准（实为 autoApprove 整段跳过）——按真机制改写 |
| `TOOLS.md`（VSC 仓） | `:178-180` | 「写豁免仅限 onPermissionRequest 阶段」 | 同族措辞失准（实为 autoApprove 整段跳过）——随修正轮 #1 改写 |

### 18.3 方案选型对比（Q1–Q6——候选 ≥2，逐项判据 + 否决理由）

| # | 问 | 选定 | 否决候选（理由） |
|---|---|---|---|
| Q1 | child 弹卡形态 | **逐项卡**（复用既有权限卡/队列/响应机制；批合并本体保留顶层） | child 也走批合并（CLI 无此前例：`spawn-child.mjs:131-148` `wrapChildCallbacks` 仅四回调、`subagent-spawn.mjs:453-456` 亦未传批回调——属新语义；且合并卡归属/响应路由扩面。R1「复用既有批合并」按「复用既有权限机制」落法——登记候选扩展不建） |
| Q2 | 归属载体 | 回调第 4 参显式 `opts = { owner:{label,role,id}, signal }` | 名称内嵌 `${owner}/${tool}`（CLI 形态——本端卡按 locale 分句渲染，内嵌串劣化 i18n 与 aria；且取消反查需结构化 id） |
| Q3 | ⏹/取消释放 | ask 绑定 child signal——**一机制覆盖 ⏹ / 模型 cancel / 会话中止** | 面板队列按 owner 反查（只覆盖 UI ⏹ 一路；模型 cancel 与会话中止仍悬挂 = 缺口） |
| Q4 | 块头态通知通道 | 新回调 `onSubagentApproval` + 新消息 `subagentApproval`（任务可见性族——outbox/flush 既有） | `⟦ev⟧` token 复用（VSC 中继把 token 当文本渲染——需解析剥离，污染 forward）；并入 `subagent` status 族（`applySubagentStatus` 三态机闭合声明——新 status 落终态分支，语义污染） |
| Q5 | execute-tools 越硬限 | **机械拆 gate 层**（C-11） | 只登记不拆（506 > 500 已越硬限——本批再增行坐实债；拆面 verbatim 零语义，风险可控） |
| Q6 | 响应匹配 | `promptId` 精确匹配（question 的 F-C1d 同构） | 队头 shift（多 child 并发卡错 resolve——带归属显示后错卡更可见） |

### 18.4 契约（逐条定稿——实现对象）

**C-1 闸范围（`src/agent/execute-tools.mjs:258`）**：权限条件删除 `depth === 0`——新条件 =
`!getAuto() && tool && !tool.readonly && !actionReadonly && !controlAction && !isSubagentConsumeDesignAction(toolName, args) && callbacks.onPermissionRequired`。
批扫描（`:157`）保持 `depth !== 0` 短路（child 不入批合并——Q1）。depth-0 行为零变化。
注释面同步：`:93-96` / `:243-256` 的「eng-coder children never reach this stage / Non-eng-coder children keep the pre-existing semantics」两段改写为 post-R1 语义（eng-coder 仍不达——autoApprove 预授权；写权 child 手动档抵达）。

**C-2 child 通道（新档 `src/agent-tools/child-permission.mjs`——W9 已迁核：现体 `thincoder-core/agent-tools/child-permission.mjs`）**：导出
`makeChildPermission({ ctx, id, role, model, signal })` → `null`（无 `ctx.callbacks.onPermissionRequired`——headless/AUTO 构建期）
或 `async (toolName, args, diffInfo) => boolean`。语义（顺序定死）：
① announce `ctx.callbacks.onSubagentApproval?.({ id, role, model, tool: toolName })`；
② `await ctx.callbacks.onPermissionRequired(toolName, args, diffInfo, { owner, signal })`；
③ finally announce `{ …, tool: null }`（清态）。
`owner = { label: childOwnerLabel(role, id, model), role, id }`；`childOwnerLabel` = `escalate <model> #<id>`
（role ∈ {escalate, consult} 且 model 在）否则 `<role>#<id>`（= 活动块 label 同源——用户目视配对）。
角色域（调用侧）：`coder` / `eng-designer` 传通道；`explore` / `plan` / `eng-coder` 不传（C-3 注释面同述）。

**C-3 模式继承（三处 autoApprove 形参）**：
- `subagent-run.mjs:126` → `role === "eng-coder" ? true : (() => ctx.getAuto?.() ?? false)`；
- `subagent-escalate.mjs:170` 与 `subagent-escalate-async.mjs:111` → `() => ctx.getAuto?.() ?? false`。
效果：AUTO（含轮中 approve-all 翻转）→ child `getAuto()` 真 → 权限阶段跳过（零卡）；手动档 → 抵达权限阶段按 C-2 弹卡。
连带（登记 KD-7）：手动档非 eng-coder child 的 history 不再注入 AUTO 提醒句（原恒 `true` 的副产物）——CLI child（autoApprove=false）同态；需求侧口径澄清 = 审批面（连带接受——修正轮 #5）。

**C-4 owner 与 promptId（`src/extension/permission-gate.mjs`）**：`permissionGate(panel)` 返回函数签名扩为
`(toolName, args, diffInfo, opts?)`（`opts = { owner, signal }`，depth-0 既有调用不传 → 向后兼容）。
队列条目 = `{ id, resolve, toolName, owner }`；`id` = `panel._permissionSeq` 自增（question 的 promptId 同构）；
postMessage = `{ type:"permissionRequest", tool, args, diff, owner: owner?.label ?? null, promptId: id }`。

**C-5 响应路由（`src/extension/panel-messages.mjs:309-320`）**：`permissionResponse` 按 `msg.promptId` 精确查队列条目
（`find`）；无 promptId（旧 webview）→ 回退队头 shift（历史语义）；找不到 → no-op（陈旧卡不误 resolve）。
approveAll 分支语义保留（全队列 resolve(true) + `_setAutoApprove(true)`——顶层既有语义零改）。

**C-6 卡释放（host 侧）**：`permissionGate` 内统一释放函数 `release(entry, verdict)`（出队 + resolve + post
`{ type:"permissionWithdrawn", promptId }`）。挂载三路：① `opts.signal` abort（child 定向取消——`subagent-actions.mjs:250-253`
`entry.controller.abort()`）；② `panel._abortController` abort（Stop 触发——现行 `permission-gate.mjs:32-39` 对顶层 ask 已生效，
本批统一入 `release` 并补 `permissionWithdrawn`）：轮级 Stop 只停主会话当前 controller、不停后台池（F-6——本档 §7）——
子代存活；其 pending ask 统一 `release(entry, false)`（**deny**）→ 卡移除；child 收 deny 工具结果后沿常态继续（自身未被 abort——
无解绕分支；与 C-10 同法、异触发源）——同 `TOOLS.md` §8「Stop 释放挂起门」同口径（resolve(false)/deny、循环不悬挂）（修正轮 #2）；
③ approve-all 连带（C-5 分支对其余 pending 逐个发 `permissionWithdrawn`——多卡并发不留残卡）。
webview：移除 `.permission-prompt[data-prompt-id=…]`（无 promptId → 移除全部——中止即整轮作废）。

**C-7 归属显示（`webview/permission.js:21-67`）**：owner 非空 → 卡首行 =
`<span class="perm-owner">{owner}</span> · <code>{tool}</code>`（R1 逐字格式）；owner 空 → 既有句零改。
卡元素携 `data-prompt-id`。

**C-8 块头审批态**：
- 回调（`src/extension/panel-callbacks.mjs`）：`onSubagentApproval: (info) => postSubagentEvent(panel, { type:"subagentApproval", ...info })`。
- webview 路由（`webview/chat.js`）：`case "subagentApproval"` → `applySubagentApproval(m)`。
- `webview/activity.js` 新导出 `applySubagentApproval(m)`：`blockNamesFor(m.role, m.id, m.model, m.sessionId)` 查块（绝不建块）；
  命中且非冻结 → `meta.approval = m.tool ? String(m.tool).slice(0, 40) : null` + `refreshBlock`；冻结/未知 → 丢弃（幂等守卫同族）。
- `webview/activity-view.js`：`buildBlock` meta 增 `approval: null`；`headerText` live 态 approval 非空 → icon `⏸`（覆盖 `▶`）；
  `stateWord` 首判 `meta.approval` → `t("sub.awaitingApproval", { tool })`；`freezeBlock` 清 `approval`。

**C-9 escalate 接线**：sync（`subagent-escalate.mjs` callbacks 对象——`id: subId`）与 async（`subagent-escalate-async.mjs`
callbacks 对象——`id: entry.id`）各加 `onPermissionRequired: makeChildPermission({ ctx, id, role:"escalate", model: tag, signal })`
（helper 返 null 时省略该键）；owner label = `escalate <tag> #<id>`。

**C-10 ⏹ 取舍（含——Q3）**：机制 = C-6 ①——零面板队列反查。语义 = ⏹ 取消 running child → pending ask resolve(false) →
卡移除 → child 收 deny（工具结果 `Denied by user (permission mode).`，本端既有串——顶层同串）并随后在 abort 检出点解绕
（`runChild` cancelled 分支——既有）。模型 `subagent action:'cancel'` 与会话中止同路径。

**C-11 结构拆分（execute-tools 越硬限归位）**：`src/agent/execute-tools.mjs` 506（实测口径——> 500 硬限；MIRROR-SWEEP 批
交付表已记录 506 漂移）→ 拆出 `agentHasLiveEngSlot` / `l3TouchedPaths` / `preGateBlocked` / `isSubagentConsumeDesignAction` /
`collectBatchPermission` 至新档 `src/agent/tool-gates.mjs`（verbatim 迁移，零语义；execute-tools import 新档——无环；
`executeToolBatches` 与 L3 记账面留原档）。测档 `test/advisor-guard-completion.test.mjs（W12 已退役——删除记录见批次档 §5）:176-177` 的源读路径随迁改指新档。

**C-12 i18n**：新键 `sub.awaitingApproval`——zh `等待审批: ${tool}`（CLI 面板同文逐字）/ en `Awaiting approval: ${tool}`；两 locale 同步。

**C-13 R2 文档修正（本设计随批落档，改后与 C-1..C-10 真语义一致）**：
- `ESCALATE.md:33` → 权限格改「**可写**（走正常权限门——ask 弹卡带归属 / AUTO 直通）」；
- `ESCALATE.md:79` → 「走正常权限门（ask 弹卡带归属；AUTO 直通）」；
- `ESCALATE.md:125` → 「权限门（`onPermissionRequest` 转发——ask 模式经父面板弹卡，卡归属 `escalate <label> #N`；AUTO 直通）」；
- `ESCALATE.md:143` → 「写权限/权限门（ask 弹卡带归属）/追踪全部现成」；
- `ENGINEERING-MODE.md:128-130` → 「免逐写询问；spawn 侧以 autoApprove 等效预授权 = 权限询问阶段整体跳过，其余前置门（JSON/未知工具/planMode/design-token）先行且原样生效」。
- `TOOLS.md:178-180` → 「免逐写询问：权限询问阶段整体跳过；JSON 解析/未知工具/planMode/design-token 前置门先行且原样生效」（修正轮 #1——同族句扫尾）。
- 同族句同步（本档 §8——`engDesignReviewed` 预授权句）：「豁免粒度仅 onPermissionRequest 阶段」→「免逐写询问：权限询问阶段整体跳过」（四处 = 三档 + 本档 §8——`TOOLS.md` 随修正轮 #1 扩列）。

### 18.5 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| KD-1 | child 逐项弹卡；批合并保留 depth-0（Q1） | CLI 对位（child 无批通道）；合并卡归属/路由扩面；「复用既有批合并」按机制复用解读——登记候选扩展 |
| KD-2 | eng-coder 保持 `autoApprove=true` 预授权（不引入 CLI 的 `_engTaskAuthorized` 标志） | VSC 既有机制表达同语义（`runChild` 注释 + T-E14 面测试在位——T-E14 已退场：设计期编号，现态不在册；行为面测试在位）；换标志位 = 无收益的机制漂移 |
| KD-3 | explore/plan 不配通道 | 工具集限只读（不可达面不造分支）；CLI 同角色 `childPermission=false` 对位 |
| KD-4 | 模式继承按 live getter（非构建期快照） | 与顶层 autoApprove「活事实源」同源——轮中 approve-all 翻转即对 child 生效 |
| KD-5 | ⏹ deny 含（信号绑定——C-10） | 否则取消后的 child 停泊在 ask 上不悬挂——不是可选装饰而是正确性要件 |
| KD-6 | execute-tools 拆分含（C-11） | 506 已越 500 硬限且本批在增行；verbatim 拆 = 低风险归位（「撞到错误结构就改」） |
| KD-7 | 手动档 child 不再收 AUTO 提醒句（连带） | CLI child 同态（autoApprove=false）；如实登记不静默；需求侧口径澄清 = 审批面、连带接受（修正轮 #5） |
| KD-8 | owner label = 活动块 label 同源（escalate 含 tag） | 卡与块可目视配对；单一 label 生成函数（D2——两端各一实现：host helper / webview 既有 blockNamesFor） |

### 18.6 受影响文件全清单（行数 as-of 2026-09-12 实测；口径 = `split("\n").length` 含末行；源档守 500 硬限 / 新档 ≤300）

| # | 文件 | as-of | 预计 | 变更要点 |
|---|---|---|---|---|
| 1 | `src/agent/execute-tools.mjs` | 506 | ~385（净减——C-11 拆出 + C-1） | C-1 条件/注释；拆出五函数 |
| 2 | `src/agent/tool-gates.mjs`（新） | — | ~155 | C-11 verbatim 迁入 |
| 3 | `src/agent-tools/child-permission.mjs`（新）（W9 已迁核——现体 `thincoder-core/agent-tools/child-permission.mjs`） | — | ~55 | C-2 helper |
| 4 | `src/agent-tools/subagent-run.mjs` | 190 | ~206 | C-2/C-3 接线（callbacks + autoApprove） |
| 5 | `src/agent-tools/subagent-escalate.mjs（W12 已迁核——现体见批次档 §5）` | 219 | ~233 | C-9 |
| 6 | `src/agent-tools/subagent-escalate-async.mjs（W12 已迁核——现体见批次档 §5）` | 226 | ~240 | C-9 |
| 7 | `src/extension/permission-gate.mjs` | 71 | ~115 | C-4/C-6 |
| 8 | `src/extension/panel-callbacks.mjs` | 186 | ~190 | C-8 回调 |
| 9 | `src/extension/panel-messages.mjs` | 485 | ~492（<500） | C-5 路由 + approve-all 连带 |
| 10 | `webview/activity.js` | 354 | ~372 | C-8 applySubagentApproval |
| 11 | `webview/activity-view.js` | 157 | ~172 | C-8 块头/态词/清态 |
| 12 | `webview/permission.js` | 108 | ~122 | C-7 + data-prompt-id |
| 13 | `webview/chat.js` | 355 | ~363 | C-8 路由 + C-6 移除 case |
| 14 | `locales/en.json` + `locales/zh.json` | 248 ×2 | +1 ×2 | C-12 |
| 15 | `test/child-permission.test.mjs`（新） | — | ~380 | T-CP1..T-CP16 + T-CP18 + T-CP19（W12 已退役——删除记录见批次档 §5） 主力（T-CP17 已退场——整删，删除记录 = `TESTING.md` §8.1（`:127`））；**测试档登记**（**拆分已落**——500 行硬限无豁免：余档 **368** / 新档 `test/child-permission-wiring.test.mjs` **218**，守恒 **18 = 12 + 6**；拆分方案 = `LEDGER-SELF-CONTAINED.md §9`） |
| 16 | `test/advisor-guard-completion.test.mjs（W12 已退役——删除记录见批次档 §5）` | 339 | ±1 | C-11 源读改指（修正轮 #7 补 as-of） |
| 17 | `test/files.mjs` | 75 | +1 | 新测档登记 |
| 18 | 文档域：`docs/design/AGENT-LOOP.md`（本 §18）/ `TOOLS.md` §8 / `WEBVIEW.md` §7.2 / `ESCALATE.md` / `ENGINEERING-MODE.md` / `README.md` 变更记录 | — | — | 设计者已落（本批） |

**拆分评估注**：① `execute-tools.mjs` 506→~385（C-11 专项）；② `panel-messages.mjs` 485→~492（<500，余量薄——只许增量逐行）；
③ `activity.js` 354→~372 / `chat.js` 355→~363（越 300 咨询线——本批不拆，登记结构债候选）；④ 源新档（`tool-gates.mjs` / `child-permission.mjs`）≤300；**测试档拆分已落**（500 行硬限无豁免）——
`test/child-permission.test.mjs` 拆后 **368** + 新档 `test/child-permission-wiring.test.mjs` **218**（守恒 **18 = 12 + 6**；拆分方案 = `LEDGER-SELF-CONTAINED.md §9`）。
**与在途批文件域重叠（调度排队——父侧）**：活动区批（`2026-09-12-VSC-ACTIVITY-CLOSURE`）同触 #4/#8/#10/#11/#13/#14——调度器按 `files` 排队，后落批须对表重读。
**不入 files**：`docs/TODO.md` / `CHANGELOG.md`（父侧）；CLI 仓一切代码（需求树除外——设计者已落）——产品级台账已退役（台账单仓化：现体 = 仓根 `docs/TODO.md`）。

### 18.7 用例表（正常 / 边界 / 错误——输入 / 预期输出；映射列 = 需求号）

| # | 场景 | 输入（夹具直驱） | 预期输出 | 需求 |
|---|---|---|---|---|
| T-CP1 | ask + coder child 写 | 手动档；child 发 write；面板 gate 直驱 | 卡出现且含 `coder#N · write`（逐字）；块头 `⏸` + `等待审批: write`；approval 事件已发 | F-CP1 |
| T-CP2 | approve 后继续 | T-CP1 卡上 approve | 队列条目 resolve(true)；工具执行（结果非拒绝串）；块头态词清除 | F-CP1 |
| T-CP3 | deny 语义 | T-CP1 卡上 deny | resolve(false)；child 工具结果 = `Denied by user (permission mode).` | F-CP1 |
| T-CP4 | AUTO 直通 | getAuto() 真；child 写 | 零卡、零 approval 事件、工具执行 | F-CP1 |
| T-CP5 | 轮中 approve-all | 两 child 挂起 → 其一卡 approve-all | 全队列 resolve(true) + AUTO 置位；其余卡 permissionWithdrawn 移除；后续 child 写零卡 | F-CP1 |
| T-CP6（W12 已退役——删除记录见批次档 §5） | escalate sync | escalate 引擎 callbacks 直驱（subId） | ask 到达面板；owner = `escalate <tag> #<id>` | F-CP1 |
| T-CP7（W12 已退役——删除记录见批次档 §5） | escalate async + ⏹ | 池条目 controller.abort() | ask resolve(false) + permissionWithdrawn 发出 + 卡移除；无悬挂 | F-CP1 |
| T-CP8 | 双 child 路由 | 两卡并存；先点第二张 | 第二条目 resolve（promptId 匹配——非队头） | F-CP1 |
| T-CP9 | 陈旧/无 id 响应 | 无 promptId 响应 / 未知 promptId 响应 | 前者回退队头；后者 no-op（零 resolve） | F-CP1 |
| T-CP10 | eng-coder 零卡 | eng-coder child（ask 档）写 | 零卡、零 approval 事件（C-3/KD-2 保持） | F-CP1 |
| T-CP11 | 只读角色零卡 | explore/plan child | 零卡（无通道） | F-CP1 |
| T-CP12 | depth-0 零回归 | 顶层逐项 + 批合并既有路径 | 既有语义/文案/队列零变化（T-E14 族全绿——T-E14 已退场：设计期编号，现态不在册；行为面测试在位） | F-CP1 |
| T-CP13 | 冻结块迟来事件 | 冻结块 + approval 事件 | 丢弃（meta 零写、零复活） | F-CP1 |
| T-CP14 | child 多写 | child 单响应 ≥2 非只读工具 | 逐项两卡（批合并分支零进入） | F-CP1 |
| T-CP15 | 无通道静默 | 无 onPermissionRequired（headless） | child 静默直通（零卡零事件）——零回归 | F-CP1 |
| T-CP16 | 态词清除 + i18n | 事件 tool=null；两 locale 文件 | 态词回落 chunk 态（或 thinking…）；zh/en 键在位且插值正确 | F-CP1 |
| T-CP17 | R2 措辞锚 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:127`）） | F-CP2 |
| T-CP18 | 结构 | 行数实测 + 源读 | execute-tools ≤500；tool-gates ≤300 | N-CP2 |
| T-CP19（W12 已退役——删除记录见批次档 §5） | Stop 释放 | escalate async ask pending（T-CP7（W12 已退役——删除记录见批次档 §5） 同夹具）+ `panel._abortController.abort()` | ask resolve(false)（deny）+ `permissionWithdrawn` 发出 + 卡移除；child 未被 abort（F-6 不停池——存活继续） | F-CP1 |

**测试族写法**：新档 `test/child-permission.test.mjs`——host 面直驱 `permission-gate.mjs` / `panel-messages.mjs`
（panel 假体——同 `chat-panel-messages.test.mjs` 模式）+ webview 面 `installChatFixture`（happy-dom——同 `activity-flow.test.mjs` 模式）；
i18n/文档锚用 fs 直读。

### 18.8 验收标准（逐条回指需求——每条可机器验证）

| # | 回指 | 判据 |
|---|---|---|
| AC-CP1 | F-CP1（机制） | T-CP1/T-CP2/T-CP3/T-CP5 全绿：卡 + 归属逐字 + approve/deny 语义 + approve-all 连带 |
| AC-CP2 | F-CP1（模式继承） | T-CP4/T-CP5 全绿：AUTO 零卡；轮中翻转后续零卡 |
| AC-CP3 | F-CP1（角色域） | T-CP10/T-CP11/T-CP12/T-CP15 全绿：eng-coder/explore/plan/无通道零卡；depth-0 零回归 |
| AC-CP4 | F-CP1（escalate/释放） | T-CP6（W12 已退役——删除记录见批次档 §5）/T-CP7（W12 已退役——删除记录见批次档 §5）/T-CP19（W12 已退役——删除记录见批次档 §5） 全绿：sync/async ask + 归属 + 取消释放（⏹/Stop——deny） |
| AC-CP5 | F-CP1（块头） | T-CP1/T-CP13/T-CP16 全绿：⏸ + 态词、冻结丢弃、两 locale |
| AC-CP6 | F-CP1（路由/释放） | T-CP8/T-CP9/T-CP14 全绿：promptId 匹配 + 回退 + 逐项形态 |
| AC-CP7 | F-CP2 | 已退场（随 T-CP17 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:127`）） |
| AC-CP8 | N-CP2（结构） | T-CP18 + 行数实测表：execute-tools ≤500、源新档 ≤300（测试档 500 硬限无豁免——超限拆分已落，方案 = `LEDGER-SELF-CONTAINED.md §9`）、`check-doc-width` 两仓新增违规 0 |
| AC-CP9 | N-CP1（零回归/协议） | VSC 快层全绿；CLI 仓 `git status` 零代码改；`WEBVIEW.md` §7.2 协议增量逐条在位（C-4/C-5/C-6/C-8 四行） |

### 18.9 边界（本批不做 + 登记项）

- **不做**：CLI 端（语义参照）；child 批合并（候选扩展——Q1 登记）；question 面 child 卡释放（既有缺口——本批只做
  permission，登记）；批卡协议（`batchPermissionRequest` 无 promptId/无 owner——登记，不动）；顶层 depth-0 审批语义任何改动；
  新权限模式 / 新对话框类型；`docs/design/prompts/` 与提示词文件（零改动）。
- **与在途批（父侧核销项）**：活动区批 `2026-09-12-VSC-ACTIVITY-CLOSURE` 的 `WEBVIEW.md §14.3 C-13 表` / §14.9 与
  `AGENT-LOOP（本仓·需求）§16` F-R4/N-CL4 中「审批态 = 无数据源」理由句随本批落地失实——两批均落/核销时由父侧同步
  （本批不改他批档——冻结窗口纪律近亲；本项已登记不静默）。
- **端差登记（语义同源、形态端差）**：CLI child 审批经 TUI 模态（`_permQueue` 串行 + owner key `${key}/${tool}` + `⟦ev⟧approval`
  头标）；VSC 经面板卡栈（promptId 路由 + owner 标签 + `subagentApproval` 事件）——本端原文自持。
- **遗留登记**：KD-7（AUTO 提醒句删除）；KD-2（不引入 `_engTaskAuthorized`）；C-11 拆分后 `tool-gates.mjs` 的模块图登记——本档 §1 两条新行已补（修正轮 #3）；README/ARCHITECTURE/AGENTS 模块地图面如需 = 父侧。
- **旧标出处（修正轮 #6）**：`§18 D-E3` 系源注释沿用的旧锚标签（§18 旧编号族——同族观察登记见本档 §13 边界 (e)，另批勘察）；本档两处引用已改指 C-3/KD-2（§18.2 可写面句 / §18.7 T-CP10）。

### 18.10 UI / 交互决策落档

| # | 决策 | 形态（定稿） |
|---|---|---|
| U-1 | 卡归属行 | `{owner} · {tool}`（owner = 活动块 label；escalate 含 tag）；无 owner 卡零改 |
| U-2 | 卡移除 | host 释放即移除（`permissionWithdrawn`）——含 approve-all 连带清扫；无残卡 |
| U-3 | 块头 | `⏸` 图标 + `等待审批: <tool>` 态词（zh 与 CLI 逐字）；resolve 即清（回落 chunk 态词） |
| U-4 | i18n | 新键仅 `sub.awaitingApproval`（两 locale）；归属行纯标识符（无 locale 文本） |
| U-5 | 焦点/按键 | deny 仍获焦点（既有）；不新造快捷键；⏹ 语义不改（取消 = 定向 abort——C-10） |
| U-6 | open 项 | 无（全部定稿） |

**计数（D3）**：用例 19 条（编号 T-CP1..T-CP19（W12 已退役——删除记录见批次档 §5）；在役 18——T-CP17 已退场，删除记录 = `TESTING.md` §8.1（`:127`））· 验收 9（编号 AC-CP1..AC-CP9；在役 8——AC-CP7 随 T-CP17 退场）·
关键决策 8（KD-1..KD-8）· 方案选型问 6（Q1–Q6）· 契约 13（C-1..C-13）· 实施域 17 档（源 13：2 新 + 11 改；测 3：1 新 + 1 改 + 1 登记；含文档域 6 档随批落档）。