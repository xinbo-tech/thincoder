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
- 行面板 `#subagent-panel` 与活动面板的合并评估候选：**保留**（其独有载荷 = queued/
  waiting 行 + consult 计数/回复 preview）——后续可单独评估，非缺陷。

## 变更记录（历史折叠——详见 git log）

- 2026-09-08：从 ARCHITECTURE §6/§8 迁出成立本档——写全 VSC 独立实现（runAgent/子
  代理动作面/async 池/挂起 digest/eng-coder 交付），正文照抄 + 去 CLI 镜像指针。

## 1. 模块地图（本端接线——实现为唯一事实源）

| 文件 | 职责 |
|---|---|
| `src/agent.mjs` | `runAgent` 主循环：run-start pending 注入 → turn 循环 → chat → 工具批 → 收尾；ContinueError/resume；usage 基线；回合收尾 finalizeAgentTurn |
| `src/agent/setup.mjs` | setupAgentRun：注入上下文/system prompt、阈值解析、角色工具面装配、`getAuto` 注入 |
| `src/agent/execute-tools.mjs` | 工具调度/门禁/批审批（并行批执行） |
| `src/agent/run-stages.mjs` | checkAndCompact/fireEndOfRunDistill/finalizeAgentTurn/maybeGuardPushbacks（收尾 guard 推回） |
| `src/agent/run-helpers.mjs` | 常量（turn 上限/落盘阈值/结果落盘 64K）、pushReal/agentState、工具结果 offload |
| `src/agent/setup-reminders.mjs` | AUTO_REMINDER / ENG 提醒族 / injectEngineeringReminder |
| `src/agent-tools/subagent.mjs` | subagent 单工具动作面 + spawn 门 + 引擎（审计受限通道、token 门接点） |
| `src/agent-tools/subagent-async.mjs` | async 池/collectSettledAsync/mergeChildMutations/gateEngCoderSpawn |
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：filesOverlap/depInfo/queueRunnable/assertNoDepCycle/refillPool/nextSubagentId/停滞检测 |
| `src/agent-tools/subagent-actions.mjs` | status/cancel/escalate/consume-design 动作执行器 |
| `src/agent-tools/subagent-spawn-gate.mjs` | authorizeEngCoderDesignToken/executeConsumeDesignAction/resolveDesignSlot/dropExpiredTokenSlot |
| `src/agent-tools/subagent-spec.mjs` | description 面 / modeRoleField（schema enum） |
| `src/agent-tools/advisor-async.mjs` | 后台评审池（`_asyncAdvisors`，ADVISOR_POOL_LIMIT=2）+ launchAsyncAdvisor |
| `src/agent-tools/consult.mjs` / `subagent-escalate(-async).mjs` | consult_start/stop / escalate sync+async 路径 |
| `src/extension/chat-panel.mjs` / `panel-chat.mjs` | ChatPanel 生命周期；回合驱动经 `runAgent(p, cwd, text, callbacks, panel._abortController.signal, () => panel._autoApprove, runOpts(resume))` |
| `src/extension/suspension.mjs` | 挂起会话驱动：waitForSettleOrWake（`panel._suspWake` 单槽）、排队合并（MAX_MERGE_ITEMS=8/MAX_MERGE_CHARS=2000） |
| `webview/activity.js` / `panels.js` | 底部固定活动面板 `#subagent-activity` + 终态冻结入流 |

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
  `_pendingAsyncResults`/`_pendingAdvisorResults`/`_pendingEscalateResults`/
  `_pendingConsultResults`/`_consultSessions`/`_engDesignTokens`/`_suspended`——JSON
  序列化只走数组下标，附加属性不污染会话文件）。

**run-start 注入（先于 setupAgentRun 推入本 run 用户输入）**：前一轮异步蒸馏
（`opts.distillState.pending`）必须**先落地**（N1——压缩机行是本 run 起始上下文）；
挂起期 settle 停靠的 `history._pendingAsyncResults`/`_pendingAdvisorResults`/
`_pendingEscalateResults`/`_pendingConsultResults` 四族在此 splice 即消费
（单注入点——防重复注入；digest 处置轮据此触发）。

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
dependency outline]`（repomap 依赖图——实现注入格式为 `[System reminder: project
dependency outline: …]`，context.mjs）+ user input；`[System: AUTO mode active]` 在
AUTO 时注入（每次循环迭代动态检查 live getter——approve-all/AUTO 按钮轮次中途翻转后
下一条注入即生效）。每迭代重读 live AUTO 并补推 AUTO_REMINDER（翻转/压缩丢提醒不
遗漏）；engineering-mode 转换提醒经 injectEngineeringReminder（覆盖 TUI/panel 切换与
session resume 旁路）；meta 工具排队的 `_pendingReminders` 冲入 history。

**子 agent 支持**：`depth=0` 顶层 agent 拥有完整工具集 + meta 工具；`depth=1` 子
agent 工具集缩减、prompt 叠加角色 overlay、角色按模式覆盖（§4）；explore/plan 只读、
coder/eng-coder 完整工具 + verify/advisor 自审。轮次/并发上限与调度见 §5/§6。

## 4. 子代理单工具动作面（subagent.mjs）

**"ONE tool, FIVE actions"**——`action` 缺省 spawn（既有调用零迁移）；枚举 =
spawn / status / cancel / escalate / **consume-design**：

- `action:"spawn"`：起一个隔离上下文的子代理，只回最终报告。`task` 必填
  （self-contained——子代理零会话上下文）；`role`/`model`/`designId`/`designToken`
  /`async`/`files`/`dependsOn` 可选。
- `action:"status"`：非阻塞进度查询（id 单查或全池概览），零消耗——running 条目
  携 `{role, model, elapsedSec, turn, maxTurns}` + touched-files 摘要
  （touchedFiles 前 5 / touchedMore / 占位 "—（尚无改动）"/"—（未启动）"）。
- `action:"cancel"`：定向中止单个后台 async 子代理——`id` 必填（防误全停；
  Ctrl+C 停全部）；running 条目 abort → `{id, status:"cancelled"}`（不合并、不入
  pending、冻结通知）；queued 出队 → `{id, status:"cancelled", was:"queued"}` +
  position 前移；未知/已完成 id error；幂等。
- `action:"escalate"`：飞刀——consult 模型候选池（agent.consultModels）里飞入强
  模型做实现（写权限 + 术后报告），缺省 async；工程模式不可用（实现走
  eng-coder）。触发词条款："用户说 飞刀/escalate → 调 action:'escalate'"。
- `action:"consume-design"`（2026-09-07 链终消费制，工程模式父侧）：链终消费 design 的
  token 槽——designId 必填（多槽会话）；消费后再 spawn 同 designId 机械拒绝；幂
  等（未知/已消费 = no-op）。修正轮复用同槽，链还开着不得消费。
- `action:"check"` **已删除**（2026-09-06 用户裁定：check 是冗余 API——需要报告 =
  同步 spawn；async = 后台 + 结果自动送达）——**不写回**；status 非阻塞查询取代轮询
  引导（"查进度用 status——check 会阻塞直到完成"防误用语义随删除退役）。

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
  （逐键校验 payload-wins——每键正整数 ≥1，非法 fall back 默认 4/4）；满池排队返回
  `{id, role, status:"queued", position, waiting?, reason?}`，settle 自动补位
  （refillPool 最早可启动扫描——waiting 越行不阻塞槽位）。
- **终态**：settle 即翻 done + 墓碑（`history._asyncTombstones`）；报告自动送达——
  回合尾 collectSettledAsync 直注入或挂起期 digest 注入（§7）——arrival order
  多结果按完成序注入；cancel 的 cancelled settle 不入 pending、不直注入、停止冻结通知。
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
回合，进入挂起会话——输入放开（新消息经 `panel._chat` 排队 + 唤醒）；settle 事件驱动
auto-turn 消化（digest：手动档 organize-only 禁 spawn/写——动作域模板
`AUTO_TURN_DIGEST_DOMAIN` 注入 agent.mjs；AUTO 档全语义推进）；池空 + 无待处理输入 →
补发冻结自然退出。排队用户指令合并：单批 ≤8 条（`MAX_MERGE_ITEMS`）且合并注入 ≤2000
字符（`MAX_MERGE_CHARS`）；≥2 合批编号注入；超长/带图/空 → 直发单条保序；截批留队不
丢。digest 撞 ContinueError → AUTO 自动 resume / 手动静默停止（部分消化留历史不丢）。

**VS Code 结构差异**（与 CLI 同语义移植——CLI 的池/pending/_suspended 挂 agent 对象
跨 run 存活；VS Code agent 对象 per-run 重建——全部挂共享 depth-0 history 数组 §2）：

- 唤醒单槽：`panel._suspWake`（waitForSettleOrWake 注入）——`_chat` 挂起分流、settle
  回调（onAsyncSettled → `panel._suspWake?.()`）、abort 分支同槽（历史 `susp.wake`
  死字段修复——**VS 实现注**）。
- 释放窗口守卫：回合尾先于任何释放点登记 `panel._suspPending`，generateTitle await
  窗口内 `_chat` 入队 `_suspQueue`（零并发独立回合）；池已空/中止/面板消失 → 普通回合
  兜底（零丢失）。
- 中止统一：每次 controller 创建/重建登记 `panel._turnControllers`；会话中止
  （Stop/Ctrl+C/dispose）统一 abort 全部（旧 controller 的池 children 一并停止——
  aborted settle 即出池清理，不注入陈旧错误）；中止后 digest 排队消息**无条件消费残余**
  以普通回合按序执行（中止路径零丢失）。
- 会话 lines 双键：会话入口 lines 携 `contextHistory: history`（in-session 回合按
  activeLines 契约读 loadedLines.contextHistory——缺键致 digest 死循环的事故修复）。
- 挂起 UI：settle 期间块驻留活动面板（"done · awaiting digestion"），digest 完成逐条
  补发 done 回收；状态行（⏳ 后台 N 子代理 + 待消化计数）；输入框永不锁（loading.js
  `on && !susp`）；digest 中 Enter 由 host 排队（send.js `isRunning && !S._suspended`
  才拦截）。

## 8. eng-coder 交付协议（本端闭环）

- 交付协议在 eng-coder **内部闭环**（async 为其缺省运行形态——depth-0 全角色缺省
  async，§5）：实现 → explore 偏差审计（**BLOCKING ONLY**——受限变体 spawn-only，无
  status/escalate/async；审计预算 ≤6，第 7 次机械拒绝 = stalled 信号；任务书机械追加 =
  父 spawn 任务书 verbatim + 实际 `_touchedFiles` 并集，非自述清单）→ dirty 自修 →
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
  settle 判定 = 会话 pending==0（全 settle 一次注入）→ park 进 `history._pendingConsultResults`
  → 下回合 run-start/digest 注入；stop/abort 弃（不入 pending）；子代理信号 =
  sessionSignal ?? turn signal；挂起期撞 turn cap 自动降级 partial（不弹继续卡——无人在
  面板前）。consult children 的 onToken 例外保留——其 OUTPUT 流入会诊面板。
- **escalate**：sync 路径（async:false）verbatim 保留；缺省 async 入 **other 池**（与
  explore/plan 共享 4 槽——池满公平排队）；settle 三分类：done → merge-all + 重叠警告入
  报告；error → partial merge 决策（父 `_fileMutEvents` 重叠 → 不 merge + 报告列差异；
  无重叠 → merge）；cancelled → 不入 pending。settle 即出池（status 查为 unknown——报告
  经 digest 自动到达）。escalate 经 opts.streamOutput 选入 onToken（长手术不静默）。
- **async advisor**：`advisor-async.mjs`——`_asyncAdvisors` 独立池（ADVISOR_POOL_LIMIT=2
  超限拒）+ launchAsyncAdvisor（design reviewId=designId / 续跑轮现铸 token / rv 实例
  上下文）；settle 记账（陈旧判定跨 run、token 入槽 + engPersist slot 直写、round/prior
  ≤5、cancel 不入 pending 不入槽）→ digest 注入 + guard 未决不推回 + cancelAdvisorReview。
  工具 async 参数：depth-0 缺省后台（非阻塞默认——顶层评审不卡回合）；depth>0 拒/恒同步
  （eng-coder 内自审不翻转）。UI：panel-messages cancelSubagent 路由 role=advisor +
  webview subBlockTarget 加 advisor（⏹/冻结复用）。

## 10. 子代理活动显示（本地 webview 机制）

子 agent/consult/escalate/advisor-async 活动块在**底部固定活动面板**（`#subagent-activity`）
渲染（不随 #messages 滚动），终态**冻结折叠入消息流**。角色全同通道（频道名差异仅块键/
折叠归属）。UI 详情见 WEBVIEW（活动面板/冻结身份头）。
折叠归属）。UI 详情见 WEBVIEW（活动面板/冻结身份头——DOC-REORG 后续批建，当下
对应 ARCHITECTURE §11.1）。
