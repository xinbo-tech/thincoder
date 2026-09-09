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
- 2026-09-09：§8 任务书机械追加措辞核（A2-SUMMARY-PARITY——A2 摘要对齐 CLI：节头定位优先 + 无 `##` flat 任务书 inline 兜底 + marker 未命中 → "(not found in the parent task book)" 不编造——删 <2 节整书 verbatim 回退）。

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
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：filesOverlap/depInfo/queueRunnable/assertNoDepCycle/refillPool/nextSubagentId/停滞检测 |
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：filesOverlap/depInfo/queueRunnable/assertNoDepCycle/refillPool/nextSubagentId/停滞检测 + D1 池 accessor（getAsyncPool/removeFromAsyncPools——ASYNC-RESULT-CONTAINER） |
| `src/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER D1-D6）：settleAsyncEntry（四族公共收尾单点）/ pending 单容器（parkAsyncPending/injectPendingAsync role 分发）/ parentAborted 守卫 / buildChildSignal |
| `src/agent-tools/subagent-actions.mjs` | status/cancel/escalate/consume-design/observe/send 动作执行器（observe/send——SUBAGENT-OBSERVE-SEND 2026-09-08） |
| `src/agent-tools/subagent-spawn-gate.mjs` | authorizeEngCoderDesignToken/executeConsumeDesignAction/resolveDesignSlot/dropExpiredTokenSlot |
| `src/agent-tools/subagent-spec.mjs` | description 面 / modeRoleField（schema enum）；observe/send 动作描述 + 枚举（SUBAGENT-OBSERVE-SEND） |
| `src/agent-tools/subagent-escalate-async.mjs` | 飞刀 async 引擎：turnInput 消费回调 + onToolCall 记当前工具 + settle 未投递注记（SUBAGENT-OBSERVE-SEND——与 spawn 同池 send 一致性，out-of-list） |
| `src/agent-tools/advisor-async.mjs` | 后台评审池（`_asyncAdvisors`，ADVISOR_POOL_LIMIT=4——可配 agent.poolLimits.advisor——同 scope 守卫）+ launchAsyncAdvisor |
| `src/agent-tools/consult.mjs` / `subagent-escalate(-async).mjs` | consult_start/stop / escalate sync+async 路径 |
| `src/extension/chat-panel.mjs` / `panel-chat.mjs` | ChatPanel 生命周期；回合驱动经 `runAgent(p, cwd, text, callbacks, panel._abortController.signal, () => panel._autoApprove, runOpts(resume))`；INPUT-LOCK-ASYNC（C'——2026-09-09）：busy 拒收分流（_chat 单槽 pendingInput——挂起空闲） |
| `src/extension/suspension.mjs` | 挂起会话驱动：waitForSettleOrWake（`panel._suspWake` 单槽）、单槽 pendingInput 消费（R15 排队合并已废——INPUT-LOCK-ASYNC——2026-09-09） |
| `webview/activity.js` / `panels.js` | 子代理活动块固定于活动区 `#subagent-activity`（messages 与输入之间——live 固定可见——SESSION-ACTIVITY-REVISED 回归）+ 冻结落流锚移入 #messages（尾推/settle 锚插 digest 报告前）；panels.js 行面板已撤（簿记 map 供块 meta 水合）+ goal/task 面板 + 桥路由 |

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

## 7. 挂起回合 digest（VS 结构差异——本地接线）

挂起态是**交互层状态**（extension 驱动）：用户回合结束而后台池仍 live → 不阻塞
回合，进入挂起会话——挂起空闲输入开放（新消息经 `panel._chat` 填 pendingInput 单槽 + 唤
醒）；**busy（`_turnState==="running"`——普通回合/digest/标题窗口——单一判据）输入禁用**
（INPUT-LOCK-ASYNC C'——2026-09-09——提交拒收不排队——webview 输入锁见下方 UI 段）；settle
事件驱动 auto-turn 消化（digest：手动档 organize-only 禁 spawn/写——动作域模板
`AUTO_TURN_DIGEST_DOMAIN` 注入 agent.mjs；AUTO 档全语义推进）；池空 + 无待处理输入 →
补发冻结自然退出。排队用户指令合并（R15）已随禁排队废弃（单消息逐发——攒批取数/合并文案/
上限常量全删）。digest 撞 ContinueError → AUTO 自动 resume / 手动静默停止（部分消化留历史不丢）。

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
  ⏹（cancelSubagent 定向 abort——仅 running+pool 块——queued/waiting 块头不挂——接受
  无取消路径——队列自然推进）。面板销毁（dispose）仍统一中止会话（abortControllers
  快照 + susp.abort——面板死 = 会话死——唯一全链路径）；中止后 digest 排队消息无条件
  消费残余以普通回合按序执行（中止路径零丢失）——busy 禁排队后残余至多单槽一条。
- 会话 lines 双键：会话入口 lines 携 `contextHistory: history`（in-session 回合按
  activeLines 契约读 loadedLines.contextHistory——缺键致 digest 死循环的事故修复）。
- 挂起 UI：settle 期间块**驻留活动区**（"done · awaiting digestion"——live 块固定于
  `#subagent-activity`——SESSION-ACTIVITY-REVISED——行面板已撤），digest 完成逐条补发
  done → 块按 settle 锚（_freezeAtEl）插回 #messages digest 报告前（锚被 150 裁 →
  尾推退化）；状态行（⏳ 后台 N 子代理 + 待消化计数——子代理计数徽标撤）；**输入锁 = busy
  （`S._turnState==="running"`——含 digest/标题窗口）派生**（loading.js——readOnly + busy
  占位符——Ctrl+C 全停/Ctrl+I 注入保留：中断模态豁免锁——注入通道在门禁前——不误伤——红线）；
  susp 纯池等待输入开放（消息填单槽 + 唤醒——不排队）；send.js 出口守卫兜 busy 拒发（文本
  保留）；Stop 只在 running 显（susp 纯池跑不显——无全停）。

## 8. eng-coder 交付协议（本端闭环）

- 交付协议在 eng-coder **内部闭环**（async 为其缺省运行形态——depth-0 全角色缺省
  async，§5）：实现 → explore 偏差审计（**BLOCKING ONLY**——受限变体 spawn-only，无
  status/escalate/async；审计预算 ≤6，第 7 次机械拒绝 = stalled 信号；任务书机械追加 =
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
- 受限 spawn（engAuditSubagentTool）：eng-coder ctx 内 subagent schema = role 仅
  explore、async 参数移除（同步强制）、描述点名 AUDIT/BLOCKING ONLY；机械层
  gateEngCoderSpawn 在 mode 门之前执行（eng-coder 专属错误先于通用工程模式错误）。

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
  ≤5、cancel 不入 pending 不入槽）→ digest 注入 + guard 未决不推回 + cancelAdvisorReview。
  ≤5、cancel 不入 pending 不入槽）→ 挂起期 settle 移交 pending 单容器（role=advisor）
  digest 注入 + guard 未决不推回 + cancelAdvisorReview。
  工具 async 参数：depth-0 缺省后台（非阻塞默认——顶层评审不卡回合）；depth>0 拒/恒同步
  （eng-coder 内自审不翻转）。UI：panel-messages cancelSubagent 路由 role=advisor +
  webview subBlockTarget 加 advisor（⏹/冻结复用）。

## 10. 子代理活动显示（本地 webview 机制）

子 agent/consult/escalate/advisor-async 活动块**固定于活动区**（`#subagent-activity`——
messages 与输入之间——live 固定可见——不随会话流滚动丢失），终态**冻结移入对话流**
（`#messages`——普通终态尾推 append；§17 settled 驻留区 + settle 锚 `_freezeAtEl` 插
回 digest 报告前——CLI _freezeAt DOM 版——150 窗口只数冻结）。queued/waiting = 区内
等待块头（无 ⏹）。挂起期 settled 块驻留区（awaiting digestion 头）直到 digest done
补发/会话退出冻结。UI 详情见 WEBVIEW §2/§5（活动区/落流锚/等待块头）。


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
