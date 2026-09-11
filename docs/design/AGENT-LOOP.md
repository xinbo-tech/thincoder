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
  两端待议（VSC `docs/TODO.md`）。
- advisor 工具集与 CLI 的差异项（CLI advisor 有 lsp，本端侧待补）——VSC
  `docs/TODO.md`。
- 挂起期进程级 reminder 注入含 ISO 时间戳且位于 time 注入之前——每进程首 run 缓存
  miss 一次（单次量级，可接受）——留待评估（thincoder `docs/TODO.md`）。
- UI ⏹ 活动块 live 头缺逐轮 turn 段（现有状态事件不携 turn——逐轮跳动需扩展端新
  通道，触碰桥白名单，不擅建）——降级口径已定：池条目终态通知携真实终值，冻结身份
  头显示终值。记录在案，无跟进计划。
- 行面板（子代理行 + consult 计数/回复 preview）**保留裁定反转（评审 #4——不得当历史
  折叠）**：B1 拆底部活动面板时裁"保留"（其独有载荷 = queued/waiting 行 + consult
  计数/回复 preview——开放项关闭）→ SESSION-ACTIVITY-REVISED（2026-09-09 用户裁定——
  行面板 = VSC 独有历史残留——双面根源）全撤：queued/consult 载荷迁活动区（等待块头/
  频道块 + 冻结 preview）——单面板形态一体满足用户三连（live 固定可见 + 一个面板 +
  CLI 一致）——#subagent-panel 自 index.html/CSS/panels.js 零残留（⑮ grep 锁）。

## 变更记录（历史折叠——详见 git log）
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
| `src/agent/execute-tools.mjs` | 工具调度/门禁/批审批（并行批执行） |
| `src/agent/run-stages.mjs` | checkAndCompact/fireEndOfRunDistill/finalizeAgentTurn/maybeGuardPushbacks（收尾 guard 推回） |
| `src/agent/run-helpers.mjs` | 常量（turn 上限/落盘阈值/结果落盘 64K）、pushReal/agentState、工具结果 offload |
| `src/agent/setup-reminders.mjs` | AUTO_REMINDER / ENG 提醒族 / injectEngineeringReminder |
| `src/agent-tools/subagent.mjs` | subagent 单工具动作面 + spawn 门 + 引擎（审计受限通道、token 门接点）；observe/send dispatch + readonly/control 分类 + runChild onToolCall 记当前工具 / turnInput 注入消费回调（SUBAGENT-OBSERVE-SEND） |
| `src/agent-tools/subagent-async.mjs` | async 池/collectSettledAsync/mergeChildMutations/gateEngCoderSpawn |
| `src/agent-tools/async-discard.mjs` | 中止丢弃单点（§12）：丢弃判定（只清已死）+ 终态记录 `discarded` + 模型可见丢弃提醒；**群 B 增补**：advisor 池同构（§15——`discardAbortedAdvisors`） |
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：filesOverlap/depInfo/queueRunnable/assertNoDepCycle/refillPool/nextSubagentId/停滞检测 + D1 池 accessor（getAsyncPool/removeFromAsyncPools——ASYNC-RESULT-CONTAINER） |
| `src/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER D1-D6）：settleAsyncEntry（四族公共收尾单点）/ pending 单容器（parkAsyncPending/injectPendingAsync role 分发）/ parentAborted 守卫 / buildChildSignal |
| `src/agent-tools/digest-budget.mjs` | digest 注入预算单源（§16）：常量 / 轮记账（digestBudgetOver）/ 超限落盘（persistOverflowReport）——四族注入器共用 |
| `src/agent-tools/subagent-actions.mjs` | status/cancel/escalate/consume-design/observe/send 动作执行器（observe/send——SUBAGENT-OBSERVE-SEND 2026-09-08） |
| `src/agent-tools/subagent-spawn-gate.mjs` | authorizeEngCoderDesignToken/executeConsumeDesignAction/resolveDesignSlot/dropExpiredTokenSlot |
| `src/agent-tools/subagent-spec.mjs` | description 面 / modeRoleField（schema enum）；observe/send 动作描述 + 枚举（SUBAGENT-OBSERVE-SEND） |
| `src/agent-tools/subagent-escalate-async.mjs` | 飞刀 async 引擎：turnInput 消费回调 + onToolCall 记当前工具 + settle 未投递注记（SUBAGENT-OBSERVE-SEND——与 spawn 同池 send 一致性，out-of-list） |
| `src/agent-tools/advisor-async.mjs` | 后台评审池（`_asyncAdvisors`，ADVISOR_POOL_LIMIT=4——可配 agent.poolLimits.advisor——同 scope 守卫）+ launchAsyncAdvisor |
| `src/agent-tools/consult.mjs` / `subagent-escalate(-async).mjs` | consult_start/stop / escalate sync+async 路径 |
| `src/extension/chat-panel.mjs` / `panel-chat.mjs` | ChatPanel 生命周期；回合驱动经 `runAgent(p, cwd, text, callbacks, panel._abortController.signal, () => panel._autoApprove, runOpts(resume))`；INPUT-LOCK-ASYNC（C'——2026-09-09）：busy 拒收分流（_chat 单槽 pendingInput——挂起空闲） |
| `src/extension/suspension.mjs` | 挂起会话驱动：waitForSettleOrWake（`panel._suspWake` 单槽）、单槽 pendingInput 消费（R15 排队合并已废——INPUT-LOCK-ASYNC——2026-09-09） |
| `webview/activity.js` / `panels.js` | 子代理活动块**全程驻留固定活动区 `#subagent-activity`**（messages 与输入之间——live 固定可见——2026-09-11 活动区回归：区内出生 · 原地折叠 · 区内保留上限——权威 `WEBVIEW.md` §12）；panels.js 行面板已撤 + goal/task 面板 + 桥路由 |

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

**上下文注入（顶层）**：`[System: working directory snapshot]` + `[System: project
dependency outline]`（repomap 依赖图——注入格式 `[System reminder: project
dependency outline: …]`；注入载体原为 context.mjs——GIT-ASYNC L21 整文件删除——
现 repo outline 由 repo_outline 工具按需取）+ user input；`[System: AUTO mode active]` 在
AUTO 时注入（每次循环迭代动态检查 live getter——approve-all/AUTO 按钮轮次中途翻转后
下一条注入即生效）。每迭代重读 live AUTO 并补推 AUTO_REMINDER（翻转/压缩丢提醒不
遗漏）；engineering-mode 转换提醒经 injectEngineeringReminder（覆盖 TUI/panel 切换与
session resume 旁路）；meta 工具排队的 `_pendingReminders` 冲入 history。

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

**注入贯通（SUBAGENT-OBSERVE-SEND.md D2——stateSink 先例顺延）**：runChild（spawn）与
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
  （`agent-tools/async-settle.mjs`——落 report/error/done/status、日志三连
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
- 挂起 UI：块**全程驻留活动区**（`#subagent-activity`——live 固定可见——2026-09-11
  活动区回归），**settled/done 即时原地折叠**（settled 视同 done——无 awaiting digestion
  驻留、无锚插——digest 与块零位移交互）；状态行（⏳ 后台 N 子代理 + 待消化计数——子代理计数徽标撤）；**输入门禁 = busy
（`S._turnState==="running"`——含 digest/标题窗口）派生**（loading.js——**readOnly 锁已撤**
（可录入）——busy 占位符「主会话处理中——Enter 提交禁用——可继续输入」——Ctrl+C 全停/Ctrl+I
注入保留：中断模态——注入通道在门禁前——不误伤——红线）；
susp 纯池等待输入开放（消息填单槽 + 唤醒——不排队）；send.js 出口守卫兜 busy 拒发（文本
保留）；Stop 只在 running 显（susp 纯池跑不显——无全停）。

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
  时经 `engDesignReviewed` 预授权（免逐写询问——豁免粒度仅 onPermissionRequest 阶段；
  design-token/planMode 等前置门先于权限阶段且原样生效）。设计评审签发的 token 使
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

**§11.2 接入面补全（2026-09-11 第 10 批——本端镜像；CLI 端权威 = `thincoder/docs/design/AGENT-LOOP.md` §18）**：

- ① `subagent status` 双池合并（本端 `src/agent-tools/subagent-actions.mjs` as-of :89-120 现只查子代理池——本批补）；
- ② `wait_for "advisor settled"` 判据改读评审池（本端 `src/tools/wait_for.mjs` as-of :125-129 同缺陷——修前恒 0ms 秒过；
  复用本端已导出 `advisorReviewInFlight`（`src/agent-tools/advisor-async.mjs:92`——双载体判据））；
- ③ `subagent cancel <advisor id>` 落评审池（面板 ⏹ 路由已有——`src/extension/panel-messages.mjs:238-241`；
  工具动作缺落点——本批补）+ ④ observe/send 遇 advisor id 明确指引；
- 命名差异登记：本端 `cancelAdvisorReview` ↔ CLI `cancelAsyncAdvisor`（语义同源；**各端原名不改**——D-B3）。
- 需求：CLI 档 `docs/requirements/AGENT-LOOP.md` §4（F-B1~F-B4）（CLI 侧）。
- 并入登记：条目 A（面板 live 块出生可靠性）本端权威 = `WEBVIEW.md` §5.1——本档不重复（单一权威源）。

## 10. 子代理活动显示（本地 webview 机制）

> **现行机制（2026-09-11 活动区回归批起）**：子代理/consult/advisor 块**全程驻留固定活动区**
> （`#subagent-activity`——messages 与输入之间；区内出生 → 原地折叠 → 区内保留上限）——live
> 固定可见（不随会话流滚动丢失）——权威契约与用例见 `WEBVIEW.md` §12（布局 §2 / 机制 §5）。
> 挂起期语义与中止面见上文 §7「挂起 UI」/「中止语义」。
> 历史两代（均已被本批取代，保留注记）：① 2026-09-09 前段 SESSION-ACTIVITY-REVISED（区内
> live + 终态落流锚 + settle 驻留）② 2026-09-09 后段 ACTIVITY-REWRITE-SIMPLE（流尾出生·原地
> 冻结——位置形态被本批取代；其机制纪律——无 DOM move / 幂等守卫 / 终态闭合 / 150 窗——保留）。


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

> 需求 = `AGENT-LOOP（CLI 仓）§9`（F-G1~F-G7 / N-G1~N-G4——指针不重述）。
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
| a3 | 消息面（user-role system reminder 注入 history） | 唯一可达模型的通道；同形先例 = cancel 提醒 `src/agent-tools/subagent-actions.mjs:161-174`（`injectCancelReminder`——取消注入的既有形态）；中止 = 全池取消，形态对称 | 选定形态；实现单点放新模块，不复制既有函数 | **选定 a3** |

**(b) 「已丢弃」的表示形态**（待裁 2——`{done:true}` 的现代表达）：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| b1 | 池内新 state（如 `status:"discarded"`） | 池条目状态机是**在飞**语义（refill/准入/域冲突全读它）；新增终态值会渗进调度与 webview 行派生 | 改动面大且与 done-in-pool 统一表示冲突 | 否决 |
| b2 | 旁路记录 Map（`_asyncDiscarded`） | 第二份终态账（与墓碑语义重叠）——违反 D2 单一权威源 | 双账本 | 否决 |
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
文案含 `must return a string value`；不得静默 `String(raw)` 成 `[object Object]`。CLI 对位：`src/agent/dispatch.mjs:413` 只 guard `undefined`——本端扩为全类型（差异登记 §12.8 #3）。

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
本仓 `docs/TODO.md` 需求池（2 条 → 3 条）。

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
| 6 | 会话收尾站清池（`suspension.mjs:299-308`——评审轮次 1 #1） | F-6 后仅面板销毁/扩展重载生命周期路径驱动；dispose 先统一 abort → 清池时池内条目已全死、无活消费方（机理见 6 注） | **登记不修**（属需求 `AGENT-LOOP（CLI 仓）§9.4` 跨会话排除面——接线会引入与 C-4 文案不符的伪提醒；详见 6 注） |

**6 注（评审轮次 1 #1——会话收尾站机理与归属）**：F-6（2026-09-09 用户裁定）后 `susp.abort` 不再由停止驱动（`suspension.mjs:195-200`；面板内新会话/切换/删会话/切项目均有 `_susp?.active`/`turnBusy()` 守卫阻断——`panel-messages.mjs:135/143/166/186`），仅剩面板销毁/扩展重载路径（`chat-panel.mjs:243-244`：先统一 abort 控制器快照与会话句柄）。
清池时池内条目已全死（子代持会话 signal 或快照 controller——dispose 全 abort；清池 ⟺ 已死成立、无孤儿，与 run-stages 的活条目被清不同）。
消费方（面板/agent/webview 与 history 载体）同点消亡、abort 分支不落盘（`_saveLines` 仅 idle 分支——`suspension.mjs:320`），且终态记录载体（history 附加属性）不随会话文件持久化——写痕无读者；被清条目事后查询 = 面板重生后的新会话，属 §9.4 明示不追溯面。
接线 C-1~C-4 另有二患：C-4 文案（by the user's Stop）在此为伪 + advisor/consult 池面不对称。→ **不修**（勿顺手接线）。


## 13. 旧锚清理：`§24` → 本端节映射（群 A 批）（2026-09-11）

> 来源：批次档 `thincoder/docs/batches/2026-09-11-VSC-MIRROR-SWEEP.md` §1 条目 A3
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
| 1 | `src/advisor/main.mjs:94` | `§24 D-24b` → `§9 D-24b` | B |
| 2 | `src/advisor/main.mjs:105` | `§24 D-24b` → `§9 D-24b` | B |
| 3 | `src/advisor/main.mjs:111` | `§24 D-24b` → `§9 D-24b` | B |
| 4 | `src/advisor/main.mjs:123` | `§24 D-24b` → `§9 D-24b` | B |
| 5 | `src/advisor/main.mjs:163` | `§24 D-24b` → `§9 D-24b` | B |
| 6 | `src/advisor/main.mjs:213` | `§24 D-24b` → `§9 D-24b` | B |
| 7 | `src/advisor/main.mjs:260` | `§24 D-24b` → `§9 D-24b` | B |
| 8 | `src/advisor/messages.mjs:50` | `§24 D-24b` → `§9 D-24b` | B |
| 9 | `src/advisor/messages.mjs:80` | `§24 D-24b` → `§9 D-24b` | B |
| 10 | `src/advisor/messages.mjs:90` | `§24 D-24b` → `§9 D-24b` | B |
| 11 | `src/advisor/run.mjs:96` | `§24 D-24b` → `§9 D-24b` | B |
| 12 | `src/advisor/run.mjs:118` | `§24 D-24b` → `§9 D-24b` | B |
| 13 | `src/advisor/run.mjs:202` | `§24 D-24b` → `§9 D-24b` | B |
| 14 | `src/agent/execute-tools.mjs:19` | `§24 D-24b` → `§9 D-24b` | B |
| 15 | `src/agent/execute-tools.mjs:261` | `AGENT-LOOP.md §24 尾修复注——` 短语删除（保 `2026-09-06` 日期） | C |
| 16 | `src/agent/execute-tools.mjs:425` | 同 15 | C |
| 17 | `src/agent/execute-tools.mjs:443` | `§24 D-24b` → `§9 D-24b` | B |
| 18 | `src/agent/run-stages.mjs:96` | `§24 D-24b` → `§9 D-24b` | B |
| 19 | `src/agent/run-stages.mjs:110` | `§24 D-24b` → `§9 D-24b` | B |
| 20 | `src/agent/run-stages.mjs:269` | `§24 D-24b` → `§9 D-24b` | B |
| 21 | `src/agent/setup.mjs:218` | `§24 D-24a` → `§5 D-24a`（`（R14）` 保留） | A |
| 22 | `src/agent/setup.mjs:240` | `§24 D-24a` → `§5 D-24a` | A |
| 23 | `src/agent-tools/advisor.mjs:25` | `§24 D-24b` → `§9 D-24b` | B |
| 24 | `src/agent-tools/advisor.mjs:93` | `§24 D-24b` → `§9 D-24b` | B |
| 25 | `src/agent-tools/advisor.mjs:183`（token ①） | `§24 D-24b` → `§9 D-24b` | B |
| 26 | `src/agent-tools/advisor.mjs:183`（token ②） | `§24 R12` → `§5 R12` | A′ |
| 27 | `src/agent-tools/advisor.mjs:193` | `§24 D-24b` → `§9 D-24b` | B |
| 28 | `src/agent-tools/advisor.mjs:197` | `§24 D-24b` → `§9 D-24b` | B |
| 29 | `src/agent-tools/advisor.mjs:234` | `§24 D-24b` → `§9 D-24b` | B |
| 30 | `src/agent-tools/subagent-async.mjs:314` | `§24 D-24a` → `§5 D-24a`（`（R14）` 保留） | A |
| 31 | `src/agent-tools/subagent-async.mjs:480` | `§24 D-24b` → `§9 D-24b` | B |
| 32 | `src/agent-tools/subagent-escalate-async.mjs:4` | `§24 D-24a` → `§5 D-24a` | A |
| 33 | `src/agent-tools/subagent-escalate.mjs:16` | `§24 D-24a` → `§5 D-24a` | A |
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

**（c）用例表（T-MA3）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA3-1 | 正常 | VSC 全仓 grep `§24`（排除 `_archive/`） | **零命中**（14 档 41 处全部落位） | AC-MA3-1 |
| T-MA3-2 | 正常 | 逐行对照本表键控（文件 + 新锚串） | 41 处逐处落位（域 A 5 / A′ 1 / B 33 / C 2） | AC-MA3-1 |
| T-MA3-3 | 边界（反证） | 合成含 `§24` 的行 → 同一 grep 断言捕获 | 报中（grep 非空转——修前红可复现） | AC-MA3-2 |
| T-MA3-4 | 边界（范围） | `test/**` / `webview/**` / `locales/**` grep | 零命中（本批范围外亦已零残留——扫描如实） | AC-MA3-1 |

**（d）AC（机判）**：

- AC-MA3-1：T-MA3-1 / T-MA3-2 / T-MA3-4 绿（零残留 + 逐行落位）；
- AC-MA3-2：T-MA3-3 绿（反证）；本批触碰档 `check-doc-width` 新增违规 0；VSC 快层全绿；
- AC-MA3-3：域计数对表（D3）：`§5 D-24a` 5 处 / `§5 R12` 1 处 / `§9 D-24b` 33 处 / 去死指针 2 处——数字与列表同改。

**（e）边界**：只清 `§24`（**不并修**同族旧编号锚——`§15`/`§18`/`§19.x`/`§20` 反描述串、prompts 内 `§11.1 R14`/`§18 D-E1a`/`§28 R26`——同族观察登记，另批勘察）；`docs/**` 记史面照留（本批只改上述 doc 行——1 行）；不建新档；D-24x / R12-R14 标签零改；**零行为**（纯注释文本）。

**（f）双端回指**：CLI 侧同族面已闭（`2026-09-11-DOC-HYGIENE` 批 C2——`§24`→`§11.x` 28 行）；本端映射不走 CLI 文本（各自节号自持——不追赶、不 byte 对齐）。

**变更记录**：2026-09-11 群 A 批——新增本节（旧锚 `§24` 清理：13 档 39 行 + doc 1 行；域规则 + 逐行映射表 + AC/用例）。

## 14. 受限通道描述面清单同步（群 A 批 A11）（2026-09-11）

> 来源：批次档 `thincoder/docs/batches/2026-09-11-VSC-MIRROR-SWEEP.md` §1 条目 A11（指针 =
> `2026-09-11-TUI-SELECTION.md:96`——CLI 批 20 A2 的 VSC 镜像候选；处置 =「取同源语义」）。
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
| T-MA11-1 | 正常 | grep `src/agent/setup.mjs`：`no action parameter`；6 动作名 | 恰 2 处；6 名全含于清单句 |
| T-MA11-2 | 边界 | grep 旧串 `no action:'status'/'escalate'` | 零命中 |
| T-MA11-3 | 回归 | 既有测试族（eng-designer-role / subagent 系）+ 快层 | 全绿 |

- **AC-MA11-1** = T-MA11-1 / T-MA11-2 绿；**AC-MA11-2** = 快层全绿 + `check-doc-width` 新增 0。

**（d）边界**：只改描述文本（两行）+ 本档 §8 两处同步；`subagent-spec.mjs` 主描述载荷零改；
机械门（`subagent.mjs:174-175`）零改；CLI 侧零改。

## 15. advisor 池中止收口：同构丢弃（群 B 批 B1——2026-09-11）

> 来源：批次档 `thincoder/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §1 条目 B1（复议指令 = 用户 16:45「都一起做了」）；
> 原登记 = 本档 §12.8 #1（第 35 批「登记不修——advisor 池面属他批」）。
> 需求 = `AGENT-LOOP（CLI 仓）§11` F-I1 / N-I1~N-I3（指针不重述）。冻结面：§12 已交付契约（C-1~C-9）语义零改——
> 本批只新增 advisor 池同构面（C-10）；CLI 仓零写入。（编号避撞注：落档时与群 A A11 §14 并发——本批两节顺延 §15/§16。）

### 15.1 复议结论（修 / 维持登记——二择一必须有理由）

**结论 = 修**（复用 C-1~C-4 判定与动作序，扩展至 advisor 池）。理由三条：

1. **缺陷实存**（复核 as-of 2026-09-11）：中止分支 `src/agent/run-stages.mjs:271-277` 对 `_asyncAdvisors` 仍 `advMap.clear()`；
   评审条目 controller 经 `buildChildSignal` 链到会话 signal（`src/agent-tools/advisor-async.mjs:259-268`）——与子代理同款
   「子代持会话 signal」前提（§12.1 ③；F-6 裁定：Stop 只停轮 controller）⇒ 轮级中止时**存活评审被静默清出池**：
   其 settle 时 `removeFromAsyncPools`（`subagent-scheduler.mjs:62-66`）作用在已空 Map——报告不可达；同时
   **done-in-pool 条目（已完成待收集的报告）一并被清**——报告真丢失。两类损失与 §12.1 ②③ 逐条同构。
2. **修法面全现成、成本有界**：判定谓词 `parentAborted`（`async-settle.mjs:76-80`）；池 accessor 已含 advisor 键
   （`subagent-scheduler.mjs:42-47`——`getAsyncPool(parent,"advisor")` / `removeFromAsyncPools` 直接可用）；
   终态墓碑单账本（`writeTombstoneTo`——advisor id 与 subagent 共命名空间，`nextSubagentId` 跨池取号）；
   `status` 终态回显已覆盖 advisor id（`subagent-actions.mjs:119-137` 单查两池未命中查墓碑）——零新谓词、零新账本。
3. **原判理由已消解**：第 35 批「属他批」= **排程**理由（§12.8 #1 自注「修法同 C-1~C-4，最小改动面 = 同一分支复用判定」），
   非机制理由；复议指令下无维持登记的理由。不修的残留代价 = 评审在 Stop 后静默消失（无提醒、无终态、报告损）——
   正是 §12 全批要治的病在 advisor 面的复制品。

**反对维持的补充评估**：advisor 的报告损可见损失低于子代理（评审可按需重发；token 未签发可重评）——但「静默」本身是缺陷
（模型不知道发生过什么、`status` 查 id 读成 unknown），且 done-in-pool 报告丢失与 F-G4 已裁原则（报告零丢失）直接冲突 → 维持不成立。

### 15.2 方案选型（实现形态——候选 ≥2）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **双导出 + 私有共享核**：`discardAbortedPool`（subagent，签名/文案零变）+ 新 `discardAbortedAdvisors`（advisor 文案）；私有 `discardRole(parent, spec)` 承载判定/出池/墓碑/汇总 | 既有 C-1~C-4 契约文本（含 C-4 提醒）零碰——T-D3/T-D4 断言零回归；新面文案独立可断；实现单核无重复（D2） | 模块 +~35 行（64→~99） | **选定** |
| 2 | 参数化单函数 `discardAbortedPool(parent, role)`（文案按 role 分支） | 调用点少改；但既有导出签名变化（测试直调）+ 文案分支混排 | 回归面大、可读性降 | 否决 |
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

> 来源：批次档 `thincoder/docs/batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §1 条目 B5
> （BATCH-3 交付偏差承接口——CLI 仓 `docs/TODO.md` 需求池行）。
> 语义源（CLI 侧）：`AGENT-LOOP（CLI 仓）§22`（单源模块 / 四族接线 / 用例与 AC——指针不重述）；
> 需求 = `AGENT-LOOP（CLI 仓）§11` F-I2 / N-I1~N-I3。
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

**D-DG1 单源模块**：新档 `src/agent-tools/digest-budget.mjs`——导出三件：`DIGEST_INJECT_BUDGET`（64×1024）；
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
| 1 | `src/agent-tools/digest-budget.mjs` | 新 | ~70 | 单源模块（D-DG1） |
| 2 | `src/agent-tools/subagent-async.mjs` | 499 | ~470（净减） | 迁出 + re-export（**贴线缓解**） |
| 3 | `src/agent-tools/advisor-async.mjs` | 493 | ≤498（**贴线注记**——越 500 停下报告） | +接线 |
| 4 | `src/agent-tools/subagent-escalate-async.mjs` | 221 | ~224 | +接线 |
| 5 | `src/agent-tools/consult.mjs` | 469 | ~473 | +接线 |
| 6 | `test/eng-settlement.test.mjs` | 290 | ~330 | T-DG1~T-DG3（§16.6） |

### 16.5 双端差异登记（语义零差——实现形态差异）

- 记账键：CLI = agent；本端 = history（既有差异——轮界定同式）；
- 落盘目录：CLI = configDir/tool-results + 清理轮转；本端 = cwd/.thincoder/tmp（offload 同目录）——既有差异；
- 零跨仓依赖——一致性由各端语义锚断言守（断言驻留绿）。

### 16.6 用例表

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-DG1 | 正常 | 同轮两条 advisor 条目（各 40K 正文——合计 80K > 64K）直驱 `injectAdvisorResult` | 首条 inline 预览；次条 = 清单行（全文落盘——读档断言）+ 不 inline 全文 | F-I2 |
| T-DG2 | 正常 | escalate / consult 族各一（超限形态） | 同规清单行（两族接线生效） | F-I2 |
| T-DG3 | 边界 | 跨族同轮：subagent 40K + advisor 40K | 次条判超（**共享预算**——单源记账） | F-I2 |

### 16.7 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-B5-1 | T-DG1 / T-DG2 / T-DG3 绿 | F-I2 |
| AC-B5-2 | 既有预算用例零回归（eng-settlement 全绿；`DIGEST_INJECT_BUDGET` re-export 恒等） | N-I1 |
| AC-B5-3 | 行数实测对表（subagent-async 净减；advisor-async ≤500）+ 两仓快层全绿 + check-doc-width 新增违规 0 | N-I3 |

### 16.8 边界（本批不做）

- 不改 offloadToolResult 阈值/单条路径；不改轮界定（相邻注入 = 同轮）；不改各族标签与墓碑语义；
- 不做跨轮累计/全局配额；不改 CLI 仓（镜像各自实现）；
- **零 UI 面**（预算行为不影响片/面板呈现——无 webview 改动）。

**计数（D3）**：用例 3（T-DG1~T-DG3）· AC 3（AC-B5-1~AC-B5-3）· 实施域 4 档改 + 1 档新
（subagent-async / advisor-async / subagent-escalate-async / consult / 测试档 + digest-budget 新档）。