# Agent 主循环（agent 板块）

> 板块：Agent 循环。权威源：thincoder/src/agent.mjs + src/agent/ + 子代理相关（spawn-child / subagent 工具 / suspension）。本文件描述 agent 主循环的**当前设计**——回合驱动、guard 体系、中断语义、工具调度、子代理机制、挂起回合与 digest、工程交付协议、评审收敛。跨文档已接管的主题只留指针，不复制。
> 关联权威：`ENGINEERING-MODE.md`（工程模式判定 / 铁律 / token 门）、`ADVISOR-CONVERGENCE.md`（评审轮次收敛）、`TESTING.md`（测试分层 L0/L1/L2）、`TOOLS.md`（工具系统注册/调度出口）、`TUI.md`（显示面）、`TOOL-OUTPUT-LIMITS-*.md`（落盘阈值）。
>
> 其余关联：`SESSION.md`（会话）、`CONTEXT-COMPACTION.md`（压缩）、`CONSULTATION.md`（会诊）、`ESCALATE.md`（飞刀）、`LOGGING.md`（事件日志）、`PROVIDER.md`（模型上下文）。
>
> 本文档以机制主题组织，不按历史批次号排序。历史变更折叠到各节末尾「变更记录」一行注记（格式 `2026-xx-xx: <专题>（<commit hash>; 详见 git log）`）。逐字锚句保留一份为准（设计文档 = 锚定稿源）——外指不复制到别处。

## 未决 / 待办状态行（承接开放项——勿当历史折叠）

- **checklist 多批跟踪强化**（工程模式每批准设计批 = checklist 一条——用户"放一放，等我想好了再说"——挂起；恢复条件 = 用户给方向：唯一制/分界/保持）——见 docs/TODO.md。
- **普通模式偏差审计范围**（§8.1——已实现 F-N1.1..6；执行/检查分离（扩展 F-N1.5——默认走 coder）的实施细节待批）。
- **R23 VS Code 镜像批评估**（嵌套子代理子块形态 vs VS 子标——端差异已声明——镜像批待评）。
- **B3 观察点**（advisor 20 轮预算——B1/B2 生效后看实测轮数再议）。
- **观测设施清理**：LOGGING 可观测项（调试完成后删除）——记 docs/TODO.md。
- **子代理行数债**：subagent-async / subagent-blocks / subagent.mjs 等超 500 行硬限——拆分轮见 docs/TODO.md「拆分治理组」。
- **混合边停滞残留意向**（P-SL2——纯文件边环已修；依赖边 × 文件域边跨类型环靠停滞检测兜底——docs/TODO.md）。

## 变更记录（历史折叠——详见 git log）

- 2026-08：回补主循环/上下文/guard/中断/子代理基底（子代理活动统一、运行面板固定化、sync 精确冻结）。
- 2026-09-02：子代理异步化（async + 槽位队列 4）→ 挂起回合 V2（会话级后台双通道 + auto-turn digest）→ 工具使用优化（approval 批确认 + 批量形态引导）→ 工程交付协议（eng-coder 默认 async + 内部自审计闭环）。
- 2026-09-03：工具面合并单工具动作面（spawn/status/…）+ 控制面扩展（cancel/UI 停止/嵌套前缀）+ 子代理任务调度器（files/dependsOn）+ Ctrl+C 武装化 + panel 检查工具。
- 2026-09-04：子代理零 git + 完整轨迹存档 + 测试分层收口（父侧 L2）+ advisor 评审对象锚 + 工程模式铁律固化 + byte-identical 约束取消（设计锚为准）+ verify 改动文件定位修复 + 审计范围引导（quick + 预算句）+ 测试文件按域拆分 + 普通模式偏差审计。
- 2026-09-05：Module Split Policy / checklist 多批跟踪 / 委托操作标准 / 环形死锁修正 / 停滞机械检测。
- 2026-09-06：回合外事件后台化统一模型（advisor async + 角色分池 + 排队合并）+ 会诊/飞刀完全异步化（digest 自动注入） + long 输出落盘纪律 + question 工具抑制。
- 2026-09-07：嵌套子代理显示统一（R23）/ files 父侧文件拦截（R26）/ async advisor stale 误判修复 + 凭证机制（§11.2）。

---

## 1. 模块地图

| 文件 | 职责 |
|---|---|
| `src/agent.mjs` | `runAgent` 主循环：prepareRun → turn 循环 → chat → 分发 → 后处理；ContinueError/resume；usage 基线；回合收尾（collectSettledAsync——挂起驱动语义见 §9）；结果提交/记账在 `agent/record-results.mjs` |
| `src/agent/setup.mjs` | prepareRun：上下文注入（git/目录/指令/记忆/文档/outline）、system prompt 组装、阈值解析、角色工具面装配（depthOnly） |
| `src/agent/dispatch.mjs` | executeToolCalls：两段调度（权限预审 → 顺序保序执行）、hooks、错误落盘、action 级门控（子代理 readonly/控制类）、批权限合并 |
| `src/agent/completion.mjs` | handleCompletion：零工具调用回合的 guard 链（pending → verify → advisor → 收尾） |
| `src/agent/post-turn.mjs` | 回合后注入：停滞检测、goal 预算预警 |
| `src/agent/helpers.mjs` | 常量（turn 上限、结果落盘阈值）、escapeXml、repairHistory、AUTO_REMINDER 单源、git 上下文、目录树 |
| `src/agent/record-results.mjs` | 工具结果提交 + 变更记账：tool 消息落盘（多模态延迟注入）、FILE_MUTATORS 失效链、`_touchedFiles` + noteMutations |
| `src/agent/spawn-child.mjs` | 子代理统一管线：makeRelay / wrapChildCallbacks / runWithContinue / ensureChildApiKey / clampEffort / `⟦ev⟧` strip / 嵌套 done/stopped 补发射 |
| `src/agent/run-stages.mjs` | （拆分批）回合阶段骨架 / abort 分支 / pending 单容器过滤 |
| `src/auto-think.mjs` | 任务难度分类 → 自动设置 reasoning effort（opt-in） |
| `src/agent-tools/subagent*.mjs` | subagent 工具：spawn/status/escalate/cancel/panel 动作面、async 池、调度器、审计任务书（见 §7/§8/§10）；subagent-panel.mjs = §19.6 panel 执行器（2026-09-08 自 subagent-actions.mjs 二次拆分） |
| `src/agent-tools/async-settle.mjs` | async 结果容器统一共享 helper（ASYNC-RESULT-CONTAINER D1-D6）：settleAsyncEntry（四族公共收尾单点）/ getAsyncPool（双池 accessor）/ parkAsyncPending（pending 单容器）/ parentAborted 守卫 / buildChildSignal |
| `src/agent-tools/subagent-scheduler.mjs` | 任务调度器：normalizeFileList/filesOverlap/depInfo/queueRunnable/assertNoDepCycle/停滞检测（见 §10） |
| `src/agent-tools/advisor*.mjs` | advisor 工具（async 面见 §11.2）；对象锚与铁律见 §12 |
| `src/tui/*` | TUI 渲染/交互（见 TUI.md）；子代理相关渲染模块 subagent-blocks / subagent-panel / subagent-children |

模块拆分批：subagent-async.mjs 按 Module Split Policy（§15）拆出 subagent-scheduler.mjs（调度组）与 subagent-actions.mjs（status/panel/escalate 动作执行）——见 §10；2026-09-08 subagent-actions.mjs 二次拆分出 subagent-panel.mjs（§19.6 面板段）——见 §7.3。

## 2. runAgent 主循环

```
runAgent(agent, input, callbacks, { depth, signal, maxTurns, resume, autoTurn, suspDriven })
```

1. **prepareRun**（§3）：注入上下文 + 组装 systemPrompt/tools/schema + 阈值。
2. **非 resume 时重置 per-run 状态**（mutation/verify/advisor/touchedFiles/emptyRetries/compressFailures/autoThink；`_inheritedGuard` 例外——见 autoTurn）。
3. **turn 循环**（≤ maxTurns，默认 200；goal 模式 200；子代理 100）：
   - 压缩检查（仅 `lastRole ∈ {user, tool}` 安全点——见 CONTEXT-COMPACTION.md）；
   - plan-mode 提醒节流注入、工程模式状态注入；
   - autoThink 分类（turn 0 且配置开启）；
   - chat()（流式；onToken/onReasoning/onWait 透传；streamRules 共享 firedPatterns）；
   - 响应后处理：流规则 abort/warn、用户中断（Ctrl+I）、usage 基线、异常 finishReason 提醒；
   - 有 toolCalls → executeToolCalls（§4）→ 结果回喂 → 回步骤 a；
   - 无 toolCalls → handleCompletion（§5）→ done / continue（guard 推回）。
4. **超 turn 上限 → 抛 ContinueError**。续跑决策统一规则：`engineering && autoApprove → 自动 resume 续跑`（AUTO = 用户授权无人值守，责任在用户；resume 保 guard 状态）；否则询问是否续跑（resume 续跑）。规则适用所有回合（depth-0 用户回合 / auto-turn；depth>0 子代理同规则——async 子代理无面板通道时 AUTO && 工程 → 自动续跑，否则维持"失败返回报告"语义）。

**autoTurn（无输入回合——§9 digest 用）**：`runAgent` 加 `{ autoTurn: true }` 选项——语义 = 不 push input + per-run 状态重置（如普通回合）+ history 尾 = 已注入的 reminder user 消息——复用 resume 的"不 push input"机制但不绑定 ContinueError 语义。

**resume**：`_mutatedThisRun/_verifiedThisRun/_verifyRetries/_touchedFiles/_advisorRound` 等**保留**——guard 连续性与收敛预算不能被续跑重置；`_emptyRetries/_compressFailures` 也保留（跨 turn 计数，防刷）。

### 2.1 中断语义（AbortController + signal.reason）

- `controller.abort()`：**二按全停**（processing/挂起态 Ctrl+C 武装化，见 §9.5；`/abort` 命令实体不存在——全停 = 二按）——当前 chat 抛 AbortError → runAgent 直接上抛；回合收尾清池分支命中（`aborted && !interrupt` → 无条件清 `_asyncSubagents`——见 §11 abort 面）。
- `controller.abort({ interrupt: true, message })`（Ctrl+I）：chat 中断 → 提交部分输出（pushReal）+ 注入 `[User interrupt: message]` → 抛 AbortError；agent-turn 捕获后**重建 controller 续跑**（同一轮内继续，用户消息即时生效）。
- `abort({ interrupt: true })` 无 message（Ctrl+C 首按——停回合）：中断 → 注入后**不续跑**（break 停回合）；agent-turn 区分 `reason.interrupt && reason.message`（Ctrl+I 续跑）vs 无 message（停）。
- **工具执行期间中断**：`signal.reason.interrupt` → 先为已提交的 tool_calls 合成占位 tool 结果（`[Tool execution interrupted — results discarded]`——tool 消息必须紧跟 assistant tool_calls，否则 strict provider 重试轮 400）再注入中断消息后 continue。
- **中断清扫（runAgentTurn finally）**：`freezeAllSubTasks` + `sweepToolBlocks`（未 done 工具载体标 done+interrupted、清 `_toolTicks`）——无 running 残留、无陈旧计时泄漏；`state.dims.refresh()`。
- **垃圾回滚**：无 message interrupt 落 `[User interrupt: undefined]` 垃圾——agent-turn 无 message 分支回滚尾部垃圾（chat catch / response.interrupted 两路径注入恒为 history 最后一条；工具执行中断常规路径经下一 chat dedup 后垃圾仍居尾——接受窄边）。

**变更记录**：2026-08 回补中断语义；2026-09-02 挂起驱动下 finally 语义放宽（§9）；2026-09-03 Ctrl+C processing 武装化 + 回合 abort 与池解耦（§9.5）；2026-09-03 autoTurn 选项 + AUTO 档续跑。

## 3. prepareRun 上下文注入（setup.mjs）

按序注入（全部 `role: "user"` 机读消息，带 `transient` 标记的落盘时过滤）：

1. **git 上下文**（顶层 depth===0）：分支、最近 5 条提交、未提交改动清单（非 git 仓库静默跳过）。**子代理一律不注入**（零 git——见 §7.4）。
2. **目录树**（顶层）：`listWorkDir`（根 ≤30 项、子目录 ≤10 项，隐藏折叠，超限截断）。
3. **项目指令**：AGENTS.md / CLAUDE.md / project_rules.md（≤32K 字符，`<untrusted_project_instructions>` 包裹）。
4. **记忆检索**：记忆检索（memory search 动作）前 3 条（`<untrusted_memory>` 包裹 + XML 转义）。
5. **文档检索**：doc_search 前 5 条 chunk（`<untrusted_doc_chunk>` 包裹）。
6. **依赖大纲**：repomap 输出（`OUTLINE_INJECT_PREFIX`）。
7. **用户输入**（pushReal：双线）。
8. **多模态图像**（视觉模型：附加到首条 user 消息）。

**system prompt 字节稳定**（前缀缓存契约）：跨 run 逐字节不变——每轮变化的记忆/文档注入走 user 上下文消息而非 system；`Session start` 时间戳每会话固定一次（`_sessionStart`）。有回归测试断言两次请求 system 消息逐字节相等。

**变更记录**：2026-08 回补（含多模态延迟注入、untrusted 包裹纪律）；子代理零 git（2026-09-04——§7.4）。

## 4. 工具调度（dispatch.mjs——两段式）

**Phase 1 预审**（全部 toolCalls 先过一遍，任一被拒不影响其他）：

```
JSON 参数解析失败 → error
未知工具 → error
planMode && 非只读 → denied "plan mode"
eng-coder && 未过设计评审 && FILE_MUTATORS → denied "engineering design gate"
父 agent && 工程模式 && 无设计 token && 触及代码文件 → denied（docs/ 与根级文档豁免）
非只读 && !autoApprove → onPermissionRequest / onBatchPermissionRequest（用户确认）；无 handler → denied
PreToolUse hooks → 阻断
```

**Phase 2 执行（顺序保序）**：只读工具 + `parallel` 标记工具可并行（Promise.all 一批）；非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前副作用工具 `snapshotForUndo`（/undo 回滚基线）。

结果超限落盘 `~/.thincoder/tool-results/`（阈值权威源 = TOOL-OUTPUT-LIMITS-*.md + `helpers.mjs` TOOL_RESULT_OFFLOAD_LIMIT——双端预览）；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace）；PostToolUse 钩子 fire-and-forget。

**console 回显**：dispatch 拦截工具 `execute` 期间 console.log/error，收集后附结果回显模型（`[console during <tool>]` 段）；异常路径同样回显；嵌套 dispatch（子代理）各自拦截/恢复、捕获分离；bash 走子进程 onOutput 不受影响。

### 4.1 action 级门控（子代理单工具动作面——§7.2）

工具级 readonly 标志无法同时表达 spawn（副作用）/status（只读查询）/cancel（控制）——dispatch 预审按 **action 参数**分类：

- **readonly 面**：`status`、`observe`（只读查询——planMode 放行、免审批、可批并行——SUBAGENT-OBSERVE-SEND：observe 摘要查询无副作用）。
- **控制类豁免**（`isSubagentControlAction`——cancel + panel freeze + **send**）：免权限审批（send 写子注入队列属父对子轻量引导——非产品代码写——父回合内显式调用即授权）、planMode 允许、批审批不入组、手动档 digest 内放行。
- **spawn / escalate**：按非只读处理（planMode deny、串行、门禁照常）。

### 4.2 approval 批确认（防点击疲劳）

Phase 1 收集同批（同一 toolCalls 数组）所有**通过前置门禁、到达权限询问阶段**的非只读工具（前置已拦下的不计入批）→ **一次询问**：`"N 个工具需要权限：A、B、C — approve all / approve one by one / deny"`。新回调 `onBatchPermissionRequest({ tools: [{name, args}], count })` 返回 `"approveAll"/"oneByOne"/"deny"`；`deny` → 全批拒绝无二次询问；`oneByOne` → 回退既有逐项通道。

**`onPermissionRequest(toolName, args)` 契约签名不变**（ACP/桥/子代理透传零波及）；无 `onBatchPermissionRequest` handler 时缺省回退逐项通道（不误伤整批）。autoApprove 短路不变；只读工具不参与。

### 4.3 批量形态引导（数据驱动——非新增工具）

- **`edits` 数组**（同文件多处修改 / 多文件独立修改——原子多文件，任一失败全不写）。
- **apply_patch**（新建多个文件 `--- /dev/null` / 整文件替换 / 统一 diff 形态）——与 edits 场景互补（逐条精确 vs 整块/新建）。
- **提示词并行化条款**（system.md "How you work — while coding" 段——含 carve-out：并行禁令对声明 `files` 的 async spawn 例外——调度器自动排队，§10）。

**变更记录**：2026-08 回补两段调度；2026-08-31 console 回显；2026-09-02 approval 批确认 + 批量形态引导（§4.2/§4.3）；2026-09-03 action 级门控 + carve-out（§4.1/§10）；2026-09-08 observe（readonly）/send（控制豁免）并入分类（SUBAGENT-OBSERVE-SEND）。调度权威出口见 TOOLS.md（工具注册/ctx/hooks/undo）——本文档只述调度决策语义。

## 5. 零工具调用回合（completion.mjs handleCompletion）

顺序（每个 guard 推回一次后 continue，直到通过）：

1. **空响应恢复**：`!response.content` → 注入 `[System reminder: your last response was empty…]` 重试，上限 `MAX_EMPTY_RETRIES=2`（每次用户消息重置），仍空才抛原错误。
2. **pending tasks 提醒**：有 pending → 注入任务列表提醒并继续循环；**最多推回一次**（`_taskPushbacks`，task 工具更新列表即重置）——模型第二次坚持收尾则放行。
3. **verify guard**（opt-in `verifyGuard: true`，工程模式除外）：改过代码未 verify → 推回调 verify（≤2 次）；verify 失败 → 推回修复（≤3 次）；耗尽 → 诚实声明提醒。
4. **advisor guard**（opt-in `advisor.guard === true`，工程模式除外）：改过代码未评审 → 推回调 advisor（≤3 轮，收敛协议见 ADVISOR-CONVERGENCE.md）。advisor 评审能力**恒启用**（不依赖开关，未配 advisor.provider 时继承主 provider）；`advisor.enabled` 字段已废弃。

    guard 是**会话级**（`/advisor` 切换、saveSession/applySession 往返 `data.advisor.guard`），config.json `agent.advisor.guard` 退为兼容镜像——权威描述见 ENGINEERING-MODE.md。
5. 通过 → pushReal assistant 回复 + 返回 content。

**guard 设计取舍**：guard 链全部"注入提醒 + continue"而非硬中断（模型自我修正优于外部强制，计数上限防死循环）；verify/advisor 仅 opt-in（工程模式用流程驱动评审替代逐轮推回）；resume 保留 guard 状态（续跑不能重置已验证/收敛事实，否则可被无限续跑绕过）。

**变更记录**：2026-08-21 advisor 开关语义重构（评审恒启用、guard 收敛）——§5。

## 6. 回合后注入（post-turn.mjs）

- **停滞检测**：同一工具 + 同一参数序列化签名连续 3 次 → 注入"你在原地空转，换条路或求助"（窗口 5）。
- **goal 预算**：goal 活跃时每轮注入目标/已用 turn 数；用满 75% 预警；`goal complete` 需验证证据门槛（见 goal 工具）。

**变更记录**：2026-08 回补。

## 7. 子代理（subagent 工具）

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role（explore/plan/coder/eng-coder）决定工具集（只读过滤）与 overlay prompt。**文档组织**：显示/交互面 → TUI.md；工程交付协议（eng-coder 内部自审计闭环）→ ENGINEERING-MODE.md + §8 交付协议；工具面/async/调度器/分域池 → §7.1-§7.4 + §10/§11。

### 7.1 角色与委派

**Available roles 矩阵**（subagent 工具 description 逐字对齐——setup.mjs filteredSubagent / VS Code modeRoleField 覆盖 role 字段）：

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族/**零 git——不注入 git 上下文（§7.4）**/报告须列未找到项/thoroughness 三档 | 普通 + 工程（只读） |
| plan | 纯只读规划 | 普通 + 工程 |
| coder | 父全量读写执行 + verify/advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 designToken + explore 受限审计 | 工程 |

**Mode filtering**：普通模式 explore/plan/coder，工程模式 explore/plan/eng-coder——schema enum 反映现行模式。

**Why delegate?**：隔离上下文（子 agent 全部读写调用不进父窗口）+ 单任务专注 + 并行省时 + coder/eng-coder 自带 verify/advisor 自评（交付前已验）。thoroughness 三档：quick（单点定向）/ medium（默认，适度并行）/ thorough（多位置全面分析，报告列搜索过什么/没找到什么）——提示词约定形态，不加工具参数。

**报告契约**：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留。

**权限**：手动模式下子代理非只读工具透传到父 agent 权限审批（人在回路）——**eng-coder 例外：spawn 时任务域授权**（已批准设计+任务书即授权——内部写豁免逐写审批，见 ENGINEERING-MODE §2.6/§8 交付协议）；非 eng-coder 子代理手动档语义不变。

**eng-coder/consult/advisor 子代理人格锚**（角色句后插——独立判断/证据纪律/中立性/边界）逐字锚句见 §7.6。**子代理零 git**见 §7.4。

**变更记录**：2026-08-21 role 描述能力矩阵 + explore thoroughness；2026-08-23 委托策略（广度探索下沉 explore）；2026-09-04 coder/consult 人格锚（§7.6）。

### 7.2 单工具动作面（subagent 工具——七动作）

subagent 家族合并为**单工具 + action 参数分流**（"工具会爆炸——靠参数做不同的事"）：**spawn / status / observe / send / escalate / cancel / panel**——`check` 已删除（§7.5——2026-09-06）。
**observe + send**（SUBAGENT-OBSERVE-SEND——2026-09-08）给父对运行中异步子代理的**运行时观测与轻量引导**：observe 查进度（摘要，隔离不破坏——N2）、send 注入引导（子回合边界作普通指令消费——非打断）。
consult 家族维持独立（会诊多模型会话级生命周期——不并入）。escalate 并入为 `action:"escalate"`（工具面收敛——普通模式工具，工程模式拒——走 eng-coder）。

| action | 参数 | 返回 | 阻塞 |
|---|---|---|---|
| spawn（缺省） | task/role/designToken/designId + **files?/dependsOn?**（§10——仅 async 参与调度；sync 命中冲突 → 明确错误） | `{id, role, status:"running"/"queued", position?, waiting?, reason?}` | 同步 role 等完成；async 立即返回 |
| status | id?（省 = 全部概览） | 结构化对象数组 `{running/queued/done}`——running 带 model/elapsedSec/turn/maxTurns/touched 摘要；queued 带 position/waiting/reason；不消费 | 不阻塞（立即） |
| observe | id（必填）+ recent?（摘要条数上限，默认 5） | `{id, role, status, turn, maxTurns, touched…, currentTool? (数组——在跑工具名), recentTurns:[…], done?}`——running 带最近 N 条回合摘要 + in-flight 当前工具（读 dispatch 状态非仅 history——卡死检测）+ touched；queued 占位；done 可查（终报走自动通道） | 不阻塞（立即） |
| send | id（必填）+ message（必填） | `{id, status:"delivered", queued}`——消息入队待子回合边界消费；error（settled/cancel/unknown/queued/sync） | 立即（入队） |
| escalate | task/model?（consultModels 池——缺省池首） | 术后报告（专家 WRITE 干活）——缺省 async（other 池后台 + settle 三分类 → digest） | 缺省 async；`async:false` 同步（顶层行为受提示词/工具描述约束——见 §7.7.1） |
| cancel | id（必填——防误全停） | `{id, status:"cancelled"}` / `{was:"queued"}` / error | 立即（定向 abort） |
| panel | {view?, freeze?}（互斥，view 默认） | 镜像快照 / 冻结回收确认 | 同步 |

**action 缺省 = spawn**——既有 subagent 调用（无 action）零迁移。**eng-coder role 覆盖**（role 参数照旧——工程协议零影响）。dispatch 按 action 分类（§4.1）——`status`/`observe` readonly、`cancel`/`send`/`panel freeze` 控制类豁免、`spawn`/`escalate` 非只读。

**observe 契约**（readonly——N2 摘要不灌全量）：目标 = 父自身 spawn 的异步子代理池条目（_asyncSubagents——非 advisor/escalate）；父回合内可见的 running/queued/done 均可查。数据源 = entry.childAgent（_fullHistory 最近 N 条回合摘要 + _touchedFiles + dispatch in-flight `_inflightTools` 当前工具 + turn/maxTurns）。凭证纪律不变（observe/send 不读写 token/designId——AC4）。


**send 契约**（控制类豁免——父回合内显式调用即授权）：仅**运行中异步子代理**可注入——消息 push 进 `entry._injected`，子回合边界（agent.mjs 回合循环头 consumeInjected 回调）消费 → pushReal 成 user 回合进子历史 → 子代理按**普通用户指令**处理（注入不等同偏离豁免——子收敛/审计纪律不变）。
sync（父在等不可中转）/queued（未启动）/settled/cancel/未知 id → 明确错误。**send→settle 竞态**：入队后子代理在下一回合边界前 settle → 消息未投递——settle 收尾附报告"undelivered"提示（防父误以为引导已落地）。

**cancel 判断纪律**（subagent.mjs cancel 描述尾句——逐字锚——§7.2 cancel 描述）：
"Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first; prefer scoped recovery (restore a single affected file) over killing the child — a running child's in-flight work dies with it, partial changes stay unmerged and unaudited."
`action:"status"` running 条目带 **touched files 摘要**（复用 `_touchedFiles`——杀前看得见代价——前 5 + 截断）。`action:"observe"` running 条目同样带 touched 摘要 + recentTurns + currentTool。

**变更记录**：2026-09-03 五动作（含 escalate 并入/status/cancel/panel）→ 2026-09-06 check 删除（§7.5）——工具面六动作 → 五动作 → 2026-09-08 observe/send（SUBAGENT-OBSERVE-SEND）——五 → 七动作。

### 7.3 async 子代理（后台并行）

**缺省 async**：`asyncFlag = asyncArg ?? (depth === 0)`——**depth-0 缺省 async（全角色）**；depth>0 缺省 sync（子代理内部强制同步——eng-coder 内部 explore 审计 spawn 不受破坏）；`async:false` 显式覆盖（depth-0 参数合法；顶层行为受提示词约束——见 §7.7）。

**async 分支**：子代理照常启动（复用 spawnChild 管线——relay/turn-cap/权限/mergeChildMutations 全不变），父侧不 await——`_asyncSubagents` 记录 + 立即返回 `{id, role, status:"running"}`。settle → 报告经自动通道送达（回合尾注入 / 挂起 digest——§9）。

**槽位队列 + 分域池**：async 入口检查 running 数（<域上限 → 立即启动；≥ → 入队 `{status:"queued", position}`）；任一 running settle → 队列可启动项自动补位。分域池与可配置上限见 §11.1。

- **settle 统一机制（ASYNC-RESULT-CONTAINER.md D1-D6，2026-09-08）**：四族（subagent/advisor/escalate/consult）settle 公共收尾单点 = `settleAsyncEntry`（`agent-tools/async-settle.mjs`——落 done/status、日志三连（ev:cancelled / child:done|:error + ev:settled）、
  cancelled/parentAborted/挂起分流、settleSeq/`_settle` 唤醒 waiter、腾槽补位（subagent/escalate 族恒补——settle/cancel 释放槽即补位；advisor/consult 豁免））；
  守卫统一 `!parentAborted`（严格版——ctx.signal aborted 或条目 controller aborted）；族特有段作 `onAccounting` hook（advisor 陈旧判定/token D1 落盘记账；escalate 三分类 merge 决策）。
  **pending 单容器** `_pendingAsyncResults` +role（三族分叉废弃——`_pendingEscalateResults`/`_pendingConsultResults` 退役，consult 升格完整 entry）；**done-in-pool 统一表示**：留池 done:true + pending 单容器——`_inPending` 标记保留（settle/sweep 同一表示防重复移交）。
  **池 accessor** `getAsyncPool(parent, role)`（async-settle.mjs——advisor → `_asyncAdvisors`，其余 → `_asyncSubagents` 吸收双池）。**buildChildSignal**（async-settle.mjs——`_sessionSignal ?? ctx.signal ?? null` 单点，consult 补 _sessionSignal 兜底）。
*实现偏差注（2026-09-08 advisor code review）：设计 D3 原把 maybeRefillAsync 归入 onAccounting hook（仅 settled 分支执行）——running 取消的 cancelled 分支将不再补位（槽释放但 queued 头停滞）——实现修正为公共尾部恒补（与 VSC 镜像同款）；设计文档 D3/变更记录由父侧随交付报告同步裁定。*

**变更记录**：2026-09-02 显式 async → eng-coder 缺省 async → 2026-09-06 depth-0 全角色缺省 async（R12）。

### 7.4 子代理零 git

**全部 explore/plan（及审计）子代理零 git**：不注入 git 上下文、不承诺 git 命令、工具集无 git——子代理证据链只含"任务书 + 磁盘当前状态（read/glob/grep）+（审计时）`_touchedFiles` 机械并集"。

顶层主 agent 的 git 上下文保留（§3——有完整 git 工具、实时收集、无断裂）。动机：git 是污染源（`git diff HEAD` 不见已提交修复、untracked 新文件不可见、`status` 是全工作区脏状态）——比没有 git 更危险。与 advisor 零 git（恒定六工具不含 git）同构——双物理防线（工具不存在 + 不注入）。

**变更记录**：2026-09-04 用户两次裁定（偏差审计禁 git → 根本不该注入）——§7.4。

### 7.5 check 删除 + async 锚句（2026-09-06）

`action:"check"`（阻塞取回 async 报告）已**删除**——check 是冗余 API。需要报告 → 顶层已禁 async:false（§7.7——一律异步——报告自动到）；深度>0 内（子代理）同步 spawn 仍可用（平台规则）。async = 后台跑 + 结果自动送达——没有"异步拉起再等它"的路径。删后无"拉回阻塞"动作——模型不再自发轮询钉死回合。结果自动通道（§9）不受影响——done 条目无人工消费后自动通道照常接管（不丢）。consumed 墓碑保留（§10 dependsOn"consumed id 视为已满足"）。

**async 锚句（逐字定稿——subagent 描述 Async spawn 段——双端照抄，fail-when-unchanged）**：

> After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.
> Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule).

**变更记录**：2026-09-06 删 check（§7.5）。2026-09-08 用户裁定顶层 spawn 一律异步（§7.7——async:false 例外移除——提示词同步）。2026-09-08 评审 8 项采纳（AC1 机械断言/测试点名/锚句单源 §7.5/AC3 验证/TODO 后备/§7.3 中性/编号序注/实现自验注——token e21d5ace）。

### 7.7 顶层 spawn 一律异步——async:false 例外移除（2026-09-08 用户裁定）

> 需求：用户 2026-09-08 裁定（两次痛骂——同步 spawn 反复犯）——**顶层（depth-0）spawn 禁 async:false——一律异步**。depth>0 平台强制 sync 不受影响（子代理内部——平台硬规则）。快车道（用户明确指令）。
> 状态：**已交付核销**（2026-09-08——评审 8 项采纳 + eng-coder clean 交付——CLI c08e1b2 / VSC 8763ac2——L2 双端绿——consume a2b10815——待平台侧工具描述同步 + 机制兜底 TODO）。

**现状问题**：async 锚句（§7.5 :258）与 main.md:13/engineering.md:18 都含 "pass `async:false` only when…"——给了模型 async:false 例外通道——实际反复误用（explore/eng-coder 同步 spawn——阻塞自己 turn + 占池）。

**改**：
1. **async 锚句改版**（:258——**§7.5 为唯一权威驻点（评审 #3——行 8 单源纪律——§7.7 只留指针不重复承载逐字文本）**——fail-when-unchanged 断言需同步）：删 "use a synchronous spawn instead — pass `async:false`" 引导——改为 **顶层一律异步**。新锚句（实现时落 §7.5 :258——§7.7 此处仅变更记录）：
   > "Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule)."
   （评审 #3：实现后 §7.5 锚句区为此文唯一权威——§7.7 保留指针引用不再逐字复述）
2. **main.md:13**（双端）：删 "pass `async: false` only when the report is required before continuing" → "never pass `async:false` at top level — results reach you automatically; if your next step depends on the report, end the turn and let it arrive".
3. **engineering.md:18**：同改（"Pass `async:false` only when you must handle the report synchronously before continuing" → 删——顶层一律 async）。
4. **§7.3 L228 机制注**（评审 #7——措辞中性化）：L228 括注 "（逃逸口）" 改中性机制描述——"depth-0 参数合法；顶层行为受提示词约束——见 §7.7"——`async:false` 机制保留（子代理内部 depth>0 用）——不并置"逃逸口"与"不鼓励"混杂信号。
5. **平台侧 subagent 工具描述**（不可改——平台注入）：仍含旧 async:false 引导——**上报平台侧同步**（项目仓改不了——锚句 fail-when-unchanged 测试需排除平台描述或记录偏差）。

（评审 #5 编号序注：§7.7 编号超前 §7.6——本段插入于 §7.5 后（主题邻接——async 锚句）——重排编号会断既有引用——取保留现序 + 此注说明——§7.6 人格锚不受影响）

**受影响文件**（评审 #2——测试文件点名 + 行数注）：AGENT-LOOP.md（锚句 :258 + §7.3 L228 注 + §7.7 新段 + 变更记录）；src/prompts/main.md（双端——CLI thincoder + VSC thincoder-vscode 各一）；src/prompts/engineering.md（双端）；prompts 内容断言测试（双端——实现时 grep 定位含 async 锚句断言的测试文件——按实际点名补登——delta ≤±N）——行数实现时刷新。

**验收**：
- AC1（评审 #1——机械断言 1:1）：main.md/engineering.md（双端）删旧句逐字（"pass `async: false` only when the report is required before continuing" / "Pass `async:false` only when you must handle the report synchronously before continuing"）+ 新句存在断言（"never pass `async:false` at top level"）——fail-when-unchanged 双端内容断言同步
- AC2 锚句改版在 §7.5（fail-when-unchanged 断言同步——测试绿）
- AC3（评审 #4——验证方式明确）顶层 spawn 实践：explore/eng-coder 全异步——父侧核销项（会话轨迹审计——depth-0 spawn 无 async:false）——非 eng-coder 自查项
- AC4 depth>0 平台 sync 不变（机制零触碰）

（评审 #6 后备注：若纯提示词修复后顶层 async:false 仍复发——机制层兜底方案（工具层拒 depth-0 async:false）挂 docs/TODO.md 技术组——本批不实现）

（评审 #8 实现期自验注：eng-coder 开工前先 read 两端 main.md/engineering.md 定位旧句——行号/字句与设计描述不符则停下上报——fail-when-unchanged 断言删旧句会兜底）

（锚句权威指针（评审 #3）：async 锚句改版后的逐字文本以 **§7.5 锚句区**为唯一权威驻点（2026-09-08 改版落此）——本 §7.7 只留变更记录与指针，不重复承载逐字文本——锚句内容以 §7.5 为准。）


### 7.7.1 escalate/advisor 顶层也纳入一律异步（2026-09-08 用户裁定 a——范围扩展）

> 需求：§7.7 只覆盖 spawn——用户裁 a：**escalate（飞刀）/advisor 顶层也纳入一律异步**——
> 同步例外全移除（含 §14.2 "async:false 显式同步保留"句）。快车道（用户明确指令）。
> 状态：**已交付核销**（2026-09-08——评审 #1 5项 + #2 4项采纳——eng-coder clean 交付——CLI ed4fc5c / VSC 1a89da8——双端测试 118/111 全绿——L2 绿——consume 494298fe——上报待裁项见 §7.7.1 变更记录）。

**现状**：§14.2 :540 escalate "`async:false` 显式同步保留" 与新 §7.7 "顶层一律异步" 打架；
- VSC main.md:28 escalate 段仍含 "pass `async:false` to wait for the report synchronously"
  （CLI main.md:28 已纯异步引导——**双端漂移**）；CLI/VSC engineering.md advisor 段无
  async:false 引导（grep 核实——eng-coder 报告项 4 的 engineering.md:16 观察不实）。
- **工具描述面（最大引导面——2026-09-08 用户质询发现）**：§7.7 item 5 假设"平台侧不可改"
  **错误**——Async spawn 段 description 在项目仓 src/agent-tools/subagent.mjs:70（CLI）/
  subagent-spec.mjs:40（VSC）——模型每次调 subagent 看到的描述 = 此处字符串——仍含完整旧
  async:false 引导（"Pass async:false only when you must handle the report synchronously."+
  "use a synchronous spawn instead — pass `async:false`"）——§7.7 交付只改提示词未改此面
  = 主引导面漏改——本设计纳入。

**改**：
1. **AGENT-LOOP §14.2 飞刀小节**（评审 #1 + #2 N2——行号屡漂——按句引用不硬编号）：
   "`async:false` 显式同步保留" 句 → 删——escalate 顶层一律异步（同 §7.7）——报告自动到
   （ack → 回合自然收尾 → 挂起 settle → digest）。
2. **VSC src/prompts/main.md:28** escalate 段：删 "pass `async:false` to wait for the report synchronously"——对齐 CLI main.md:28 纯异步引导（DEFAULT-ASYNC + 报告自动到）。
3. CLI main.md:28（已纯异步——核实无需改——若含 async:false 残留一并清）。
   **advisor 面**（评审 #3——明确声明）：advisor 工具描述/提示词面经 grep 确认无 async:false 同步
   引导（§11.2 advisor 设计本就缺省 async 无同步保留句——与 escalate §14.2 不同）——仅机制注
   （item 5）适用——实现时复核一次（含 advisor*.mjs 描述 + main.md/engineering.md advisor 段）。
4. **§7.2 escalate 行机制注**（评审 #4——与 §7.3 L228 同款中性注）：:208 escalate 行 "`async:false`
   同步" 保留为机制描述（参数平台合法——item 5）——加注 "（顶层行为受提示词/工具描述约束——见 §7.7.1）"。
5. **工具描述 Async spawn 段**（CLI subagent.mjs:70 / VSC subagent-spec.mjs:40——§7.7 item 5 纠错）：
   删 "Pass async:false only when you must handle the report synchronously" + "use a synchronous
   spawn instead — pass `async:false`" 引导——改 "顶层一律异步——报告自动到——depth>0 内同步"
   （对齐 §7.7 新锚句）。escalate 段描述同步去 async:false 句（若含）。
6. **机制注**（评审 #2 N1——重编号）：escalate/advisor 的 depth-0 async:false 参数仍
   平台合法（机制零触碰——AC5 同 §7.7 AC4）——提示词/工具描述不引导——标注与 §7.7 一致。

**受影响文件**（评审 #2——注解 + 测试点名）：AGENT-LOOP.md（§14.2 + §7.2 escalate 行注 + §7.7.1 新段 + 变更记录）；
   VSC src/prompts/main.md、CLI src/prompts/main.md（核实）；CLI src/agent-tools/subagent.mjs（Async
   spawn 段描述——行数 >500 既有债不重论——描述串替换 = structure unchanged——delta ≤±N 实现时刷新）；
   VSC src/agent-tools/subagent-spec.mjs（同）；prompts 内容断言测试（双端——实现时 grep 定位——
   §7.7:276 排除平台描述的 carve-out **反转**——描述既在仓内可改——断言纳入——按实际点名补登——
   实测 test/ 对 async 锚句/描述零命中——本批新建 CLI test/prompts-async-guidance.test.mjs + VSC
   test/prompts-async-guidance.test.mjs（AC1-AC4 fail-when-unchanged 正向断言）。

**变更记录**：2026-09-08 用户质询"平台侧不可改"→ 纠错：工具描述在项目仓 src/agent-tools/（可改）——§7.7 item 5 假设错误已注——工具描述面纳入本设计（最大引导面）。2026-09-08 §7.7.1 实现交付（eng-coder——item 1/4 落 §14.2 + §7.2 escalate 行注——见上）：实现核实纠正设计三处观察不实（CLI main.md:28 实含 "pass `async: false` when you must work with the report synchronously" 残留 / VSC engineering.md:16 advisor 段实含 "Pass `async:false` only when you must block…" / advisor*.mjs 描述实含同步句（CLI:44 "Pass async:false to force the blocking review" + VSC:177 "Pass async:false for a blocking review whose result you need"）——已一并清（advisory 面"有则一并清并上报"）；VSC discipline.md:69 escalate 行 "async:false waits" 同款残留一并清（报告项）；VSC run-stages.mjs:112 advisor 提醒串含 "pass async:false only when you must read the result before continuing"——机制文件未动——上报父侧待裁；explore 审计 Q2：双端 main.md:8 委托标准段残留 "async default — sync only when the next step depends on this output and nothing else can proceed"（F-N1.6——spawn 域 §7.7 批未点名的同款残留——与 §7.5 锚句张力——上报父侧待裁——本批未动）；待父侧核销（L2/consume）。

**验收**：
- AC1 双端 main.md escalate 段无 async:false 同步引导（与 spawn 段一致——一律异步）
- AC2 §14.2 无 "async:false 显式同步保留" 句
- AC3 工具描述 Async spawn 段无 async:false 顶层引导（双端 subagent.mjs:70/subagent-spec.mjs:40——与锚句一致）
- AC4（评审 #5——肯定断言）双端 main.md escalate 段改后含 "report arrives automatically"（或等义异步引导）
  而非仅旧句删除——工具描述 Async spawn 段与 §7.5 锚句一致（fail-when-unchanged 正向断言）
- AC5 机制零触碰（depth>0 平台 sync 不变——escalate 内部深度规则不动）
- AC6（评审 #5——父侧核销）深度轨迹审计：depth-0 escalate/advisor 启动无 async:false——非 eng-coder 自查项


### 7.6 子代理/顾问人格逐字锚集

> 收 **prompts 测试锁定的逐字锚句**（设计文档 = 锚定稿源）——coder.md/consult-base.md/advisor 四模板角色句后插入，两端照抄，内容断言 fail-when-unchanged（byte-identical 已取消——§12.4——语义锚）。

**coder.md 锚（D-SP1——角色句"You are a coding subagent…"后插入）**：

```text
## Your role (identity — read before you code)
You are an IMPLEMENTER with independent judgment — not a typewriter.
1. **Evidence discipline**: every factual/behavioral assertion you make MUST be verified from the code/docs in front of you (read them, cite file:line) — or explicitly marked `unverified`. NEVER assert "Known behavior…", "I'm confident…",
   or rely on remembered API semantics when the source is readable — a behavioral question is an EVIDENCE question, not a reasoning question.
2. **Neutrality**: you implement the design; you are not the designer. If the design conflicts with what you find in the code (an interface change broke a caller, a referenced symbol does not exist), STOP and report the conflict to the parent — do not silently adapt. The parent decides; you surface.
3. **Boundary**: your task = the parent's task brief (files, acceptance criteria). Do not expand it. Findings that touch things outside the brief (other modules, parent-side docs) go in a trailing "out-of-scope note" in your report — no action without the parent's word.
```

**consult-base.md 锚（D-SP2）**：

```text
## Your role (identity — read before you answer)
1. **Evidence discipline**: you are the perspective the main agent lacks — that value comes from verified facts, not confidence. Any factual or behavioral assertion you make MUST be backed by what you read (or known from the problem brief) — or explicitly marked `unverified`.
   NEVER assert "Known behavior…", "I'm confident…", or rely on remembered API semantics when the source is readable. Unknown → say so: "I don't know" is a valid consultant answer; a confident guess is noise.
2. **Neutrality**: you are one of several consultants — no authority to decide. Recommend and reason; the main agent integrates. Do not write fixes or replacement text in your reply.
```

**advisor 四模板锚（D-AR1——advisor-design/round1/round2/round3 开头插）**——首句与四小点核心句（英文，逐字；`…` = 上接 D-AR1 全文中译本见 ENGINEERING-MODE.md 引用段）：

> You are an INDEPENDENT REVIEWER — authority in judgment, not in decisions.
> 1. **Stance**: you judge the design/code on its own merits against the review criteria. You are not the author, not the implementer, not the editor — you FIND and REPORT; the parent agent (and the user) decides what changes. Do NOT write replacement text or patch code in your findings …
> 2. **Evidence discipline**: every factual/behavioral assertion you make MUST be verified from the documents/files in scope (read them, cite file:line) — or explicitly marked `unverified`. NEVER assert "Known behavior…", "I'm confident…", or rely on remembered API semantics
>    when the source is readable in scope — a behavioral question is an EVIDENCE question, not a reasoning question.
> 3. **Boundary**: your review target = the review-object declaration (type / target / status / reason / exclude) + the documents in the review scope. Do NOT expand it … Findings that touch something outside this scope go in a trailing "out-of-scope note" — NO severity assigned to them.
> 4. **Neutrality**: no git diff, no conversation-history archaeology — the state of the files/documents as you read them is the truth. Do not guess author intent.

**Round 1 例外（设计评审会话上下文轮）**：新第一轮 = 会话上下文轮（`advisor-context.md`——注入需求聚焦会话上下文 ≤3KB 含来源标注——评"真需求覆盖"）；原 7 维全量轮移第二轮；round2+ 无会话考古（Neutrality 保持）。cap 5→6。

**变更记录**：2026-09-04 advisor 人格锚（§7.6）+ coder/consult 人格锚（§7.6）+ 会话上下文轮（§7.6）。

## 8. 工程交付协议：eng-coder 内部自审计闭环（概览）

> 完整协议（内部闭环步骤 ①-⑦ / 收敛计数 ≤5 / 任务域授权 / 审计任务书独立性 / 报告终态 clean|stalled）→ **ENGINEERING-MODE.md**（权威）。**测试分层（L0+/L1/L2）+ 父侧 L2 收口 + 修正轮默认不重跑 LLM** → TESTING.md §1（权威——原测试分层节已迁）。此处只述本文件机制关系。

- **eng-coder 默认 async**：spawn 即返回 → 主回合结束进挂起 → 交付 settle → digest 注入消化。主会话无跨 digest 状态机（复杂度归位子代理内部回合循环）。
- **eng-coder 内部 spawn 受限**：只允许 explore role + 同步（机械层——防内部递归 spawn eng-coder 无限嵌套）；非 explore/async → 工具层拒绝。子代理内（depth>0）async 本就拒。
- **任务域授权**：spawn 时刻授权（用户已批准设计+任务）——内部写操作自动放行（豁免粒度仅 onPermissionRequest 阶段；planMode/design-token 等前置门照常）。域外写仍受纪律约束——交付偏差审计兜底。
- **收敛与终态**：内部 explore 偏差审计 + advisor 复评闭环（§8.1）；修正轮共享计数 ≤5；报告自述 `clean`（审计 clean + advisor clean）或 `stalled`（未收敛/节点失败重试仍败）。**子代理零 git**（§7.4——审计证据 = 任务书 + 磁盘 + `_touchedFiles`）。
- **审计效率**：审计 explore thoroughness = **quick**（非广度探索）+ 机械预算句（只读 `_touchedFiles` 文件 + 任务书点名节，预算 ≤10 工具轮）+ A1 指令模板/A2 摘要块/A3 报告模板。
- **文档漂移处置**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物）——真实漂移写入交付报告/stalled 注记——修订归架构师/父侧（防子代理改文档洗审计）。

### 8.1 偏差审计四类 + 普通模式轻量审计

**四类偏差**（对照设计逐条查）：**部分实现 / 静默简化 / 文档漂移 / 超清单改动**。"超清单"判据 = 改了且未报告 = 偏差（静默越权）；已报告 = 透明可接受（A 裁定——清单外改动允许但必须逐项报告）。**普通模式轻量审计**（main.md/coder.md/discipline.md）：主代理验证 coder 交付时对照①本轮用户指令②板块设计文档（文档地图定位）查三向一致 + 指令落文档——零额外 LLM（读是既有动作）；F-N1.4 升级：实现偏差由主 agent 修正至符合设计后才宣布完成（真实文档漂移/超范围 → 报告用户不擅改）。

**变更记录**：2026-09-02 工程交付协议（用户重构裁定链下沉 eng-coder）；2026-09-04 测试分层收口 + 审计范围引导 + 文档漂移永不编辑；2026-09-05 普通模式偏差审计修正闭环。

## 9. 挂起回合：会话级后台双通道 + digest

> 权威：CLI `src/tui/agent-turn.mjs`（runAgentTurn + suspensionSession 驱动）+ VS Code 面板循环同构。**机制核心**：async 子代理运行中主会话**回合尾不阻塞**——进入挂起态（输入可用、状态行"后台 N 子代理运行中"）；子代理完成 → 自动消化（digest auto-turn）；用户输入随时开新回合与之并行。

**问题源**：async 子代理运行期间主会话回合尾阻塞等待全部完成（等待期用户无法输入）。用户方案：回合尾语义从"等全部"改为"收已完成 + 移交未完成"——挂起态是**交互层状态**（runAgent 保持"单输入 → 输出"不变式——挂起循环落在调用方 turn 循环）。

### 9.1 回合尾语义（collectSettledAsync）

回合尾不再直注入排空——done 条目**留池**（settled not consumed）→ agent-turn willSuspend（poolLive 覆盖池非空）判 true → 进 suspensionSession → sweepSettledToPending → pending 非空 → digestTurn。**无 suspension 驱动调用方**（headless/直连 runAgent）保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。

### 9.2 挂起状态机

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑） | 普通新回合（prepareRun 注入 pending） | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑） | 入 `pendingInput` 单槽队列 | auto-turn 结束后自动开新回合 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 runAgent 循环） | 轮末按 pending/池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle（挂起自然退出） |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合 | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 runAgent finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；门控以回调读取时刻为准（确定性，无锁需求）。

### 9.3 digest auto-turn（动作域两档）

- **触发**：挂起态池项 settle 且无 pendingInput → 交互层开 auto-turn（注入由 auto-turn 的 prepareRun 统一完成——单注入点）；多子代理近邻完成 → 一轮消化全部。
- **消化动作域（两档）**：
  - **手动档**（无 AUTO——只做"信息整理"）：允许——总结报告要点注入会话流、更新任务清单、标记需决策点 + 写下建议（只写不执行）；禁止——写文件/改代码、执行类工具（bash/execute/verify）、spawn 一切子代理（async + 同步——**机械拒绝**，subagent 入口检查 `_inAutoTurn && !autoApprove`）。
  - **AUTO 档**（autoApprove 开——与用户回合一致全语义推进型）：读/写/spawn/verify/执行全开放（用户授权无人值守）；禁 spawn 机械限制撤销（推进链成立——链终止 = 池空自然停 + 用户输入随时打断）；guard = 普通回合同款。
  - **两档通用**：auto-turn 的 mutation 标记不随下轮 per-run 重置而丢——autoTurn 结束时 guard 字段合并保留（`_inheritedGuard`）→ 下一用户回合覆盖 auto-turn 期间改动（防静默漏验）。
- **权限**：手动档 auto-turn 不传 onPermissionRequest handler（无 handler 即 denied——不弹审批面板）；AUTO 档沿用 autoApprove。自省工具（task/checklist）按只读/豁免分类放行。
- **轮次上限**：auto-turn **不另设轮次预算**——统一用系统 maxTurns；成本护栏 = 手动档消化动作域 + 合并消化 + AUTO 责任转移。

### 9.4 冻结门控 + 消化完成逐条回收

- **挂起态 settle 延迟冻结**：settle 时若处于挂起态 → 不发 `⟦ev⟧done`，区块头保持中间态（`done · awaiting digestion` 驻留面板）；正常回合内 settle 行为不变（完成即冻结）。
- **digest 消化完成即逐条补发冻结回收**（不等池空）：pending 条目注入后按 settle 锚点 splice 落位（冻结块位于其 digest 总览文本**之前**）；池空 freeze-out 仅兜底未消化残项。
- **settle 锚点 splice**：settled 分支记录 `sub._freezeAt`（= settle 时刻流位置）；freezeSubTaskLines 按锚点 splice 插入（`?? lines.length` 尾推兜底）；多锚点按 `_freezeAt` **降序**冻结（splice 是绝对位置插入，先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处按净位移校正锚点。

### 9.5 挂起期 Ctrl+C 武装化（三态一致）

- **processing/挂起态 Ctrl+C 首按** → `abort({ interrupt: true })` 无 message（停当前回合——不清池——后台保留——提示"再按中止全部后台"）+ 武装 3s；**3s 内二按** → 全停（平 abort → 清池 + 标记 + 唤醒）。
- 挂起态①（digest/会话内回合首按）同改 interrupt 语义（不清池——会话续活）。`/abort` 命令实体不存在——全停 = 二按语义。
- **二按统一全停块**：武装检查提升到状态路由之前（两次按下之间状态会迁移）；二按 = 当前回合平 abort（清池）+ abort 集合全部 controller；仅挂起态置 `_suspAborted` + 唤醒（非挂起语境置位会粘滞阻塞未来会话重入）。
- **清理**：中止后复位 `state._suspAborted`（可重新进入挂起态）；残余 pendingInput 转回 `state.queue`（不静默丢）；回合启动解除 `exitArmed` 残留（空闲退出双确认不跨回合）。

**变更记录**：2026-09-02 挂起回合 V2（用户裁定 AUTO 推进型）+ 偏差修复轮；2026-09-03 硬化轮（settle 完成队列 + 消化逐条回收）+ Ctrl+C 武装化 + sync spawn 精确冻结；2026-09-06 pendingInput 排队用户指令合并（§11.3）。

## 10. 子代理任务调度器（files/dependsOn）

> 权威：`src/agent-tools/subagent-scheduler.mjs`（CLI 拆分后宿主）+ VS Code 同构。**机制**：父代理只声明域与依赖、提交即走——调度器保证同文件串行、依赖有序、并发不误伤——根治同文件并发失误（2026-09-03 id:13/14 事故为证）。

### 10.1 调度参数与准入

- **`files?: string[]`**——写域声明（eng-coder 纪律"不碰清单外文件"+ 审计兜底；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误——fail-closed）。归一化：相对 cwd 转绝对 + 正斜杠 + win32 小写比较键。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **缺省**（无 files 无 dependsOn）= 既有语义（立即启动、不参与冲突检测）。
- **准入（spawn 时）**：若 (running ∪ queued) 有 files 交集 或 dependsOn 未 done → 入 queued（waiting-deps 态记原因）；否则立即 start。
- **仅 async 参与调度**：sync spawn（async:false）带 files/dependsOn 且命中冲突 → **明确错误**（不队列化——sync 语义零变更）。

### 10.2 补位 + 环形死锁防御 + 停滞检测

- **补位（maybeRefillAsync）**：settle/cancel 释放槽后从 queued 选"依赖全满足 + 域无冲突"的最早条目启动到槽满。队列可混 waiting-deps + slot-queued——扫描最早可启动项（先入者优先）。
- **同文件串行序判定（防互等）**：域冲突阻断**只适用"先入者"**（id 数值比较——spawn 序递增）与 running；**后入者不阻断**——避免两个 queued 同文件互等死锁。running 永远阻断。
- **依赖终态释放**：依赖在目标 settle（任何终态）或条目移除时视为满足；**默认分支**——依赖取消/失败 → 依赖者留 queued 标 `dependency-cancelled` + 注入提醒供模型决策（仅父侧显式处置或 AUTO 档才自动启动——滞留有意、显式可清、不静默）。
- **dependsOn 成环** → spawn 拒绝（防御断言）；**unknown id** → 拒绝（明确错误）。
- **停滞机械检测（detectStall）**：池无 running 且 queued ≥1 且每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内（阻塞闭包无外逃）且无 dep-cancelled 标记 → status 视图标记停滞 + 逐条阻塞链 + 引导 cancel 破环。保守不误报。

### 10.3 排队面板 UX（waiting 标注）

任何排队 spawn（waiting-deps 或 slot-queued）在 spawn 返回时立即建面板块（`⟦ev⟧queued/cancelled` 事件 token——spawn 返回发 queued、出队/取消发 cancelled）——块头标注 `[▶ role#N · waiting] waiting for: …` / `queued · position N`；启动后转 running（`⟦ev⟧async` 清标 + started 归零——同 key 不重建）。面板存在条件 = running ∪ queued/waiting 非空。

### 10.4 files 父侧文件拦截（R26）

父侧维护文件（docs/TODO.md、CHANGELOG.md、checklist.md 及 checklist* 前缀）**不得列入 files 声明**（核销/记录义务归架构师）——黑名单机械校验：归一化后 basename 全名匹配 + 大小写不敏感（路径任意层）→ 声明含任一 → 拒绝 + 英文提示（fail-closed——校验先于调度器）。**设计文档（docs/design/*.md）仍可声明**（eng-coder 落 supersede/实现记录是常态）——不误伤。

**变更记录**：2026-09-03 任务调度器（§10 + prompts 调度器条款）；2026-09-04 目录声明拒绝（§10.1）+ 环形死锁修正（§10.2）+ 停滞检测；2026-09-07 files 父侧文件拦截（R26，§10.4）。


## 11. 回合外事件后台化统一模型（分域池 + async advisor + 排队合并）

> R13（advisor async）+ R14（角色分池 + 可配置）+ R15（排队用户指令合并）合批。**统一模型**：既有 async 池机制（pending 移交/run 首行注入/消化轮/冻结回收）角色无关——advisor/escalate/consult 复用同一套 pending/digest/注入/冻结消费机制。

### 11.1 角色分池 + 可配置（R14）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认——用户裁定"eng-coder 四路，其他 4 路"）；角色域 = role ∈ {eng-coder} → engCoder 池；其余（explore/plan/coder/sub）→ other 池（VS Code 按装配实况——未知角色归 other）。
- **运行中计数按域分别记**；队列补位按域腾槽。跨域总量 8、同域仍 4。
- **配置键**：单对象 `agent.poolLimits = { engCoder, other }`；运行期读 + 校验（正整数 ≥1，非法回退默认 4/4）+ 变更下回合生效；入口 CLI /config + VS Code 设置面板。

### 11.2 async advisor（R13——独立后台评审池）

- **池形态**：独立 `_asyncAdvisors`（复用 pending/digest/注入/冻结机制；新 runner 包装 runAdvisorReview——不碰 subagent 管线）。容量 `ADVISOR_POOL_LIMIT = 2`（并行评审上限）——超限 → 返回错误文案（"另有一评审在跑——逐个发起"——评审间有依赖语义，排队无意义）。
- **工具语义**：advisor 加 `async: true`；**缺省 async**（R12 depth-0 缺省先例）——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **UI 通道**：subagent 面板 + role="advisor" 伪角色（块/⏹/冻结全复用；cancel = 定向 abort → cancelled settle：不入 pending、不入 token 槽、digest 提示"评审已取消——token 未签发"）。
- **settle 记账（token/guard/cap 改绑）**：评审 settle 时（消化链首行注入前）执行：
  - ①**陈旧判定**——评审 launch 后发生 FILE_MUTATORS → 评审基于旧状态 → 不置 `_calledAdvisorThisRun`、代码评审不签发 token（guard 仍推回发起新评审）；
  - ②通过 → token 入槽 `_engDesignTokens.set(designId, token)` + 单槽镜像；③`_advisorRound` 改按 review 实例记（`_advisorRuns`——cap 随实例 ≤5 轮）；④guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, {round, priorOutput, stale}>`——reviewId = designId（设计评审）/随机 id（code 复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手——手动档 digest 禁写域自洽）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round/prior 从 `_advisorRuns` 取）。
- **凭证机制（designId/token）**：设计锚/同步/回显/登记/消费/校验——权威见 ENGINEERING-MODE.md §2.6（2026-09-07 凭证机制完整设计；sync 语义同 scope 复审沿用同 id；VS round2+ 注入段对齐 CLI）。

### 11.3 排队用户指令合并（R15）

pendingInput 消费改**攒批合并**：回合空闲时 pendingInput ≥2 → 合成一条注入（编号列出逐条，一次处理）。**边界**：单批 ≤8 条且合并注入 ≤2000 字符（`MAX_MERGE_ITEMS = 8`/`MAX_MERGE_CHARS = 2000`）；超限 → 截批先行（前 8 条合并，余下留待下批）；单条 >2000 字符不进批逐条直发；**/cmd 类不进合并缓冲**（逐条保序即时）；到达时间窗 = 空闲即合（不设延迟）。与挂起消化共存（子代理报告合并与用户指令合并共用消费点不互扰）。

**变更记录**：2026-09-06 三合一合批（§11——分域池 + async advisor + 排队合并）大合验双端全绿；会诊/飞刀完全异步化（R17）→ §14；2026-09-07 凭证机制完整设计（ENGINEERING-MODE 同步）。

## 12. 评审收敛 + 铁律 + 文档纪律

> 评审轮次收敛（round1/2/3 提示词轮换、预算、fresh session）→ **ADVISOR-CONVERGENCE.md**（权威）。此处只述本文件关联的对象锚、铁律与文档纪律的来源语义。

### 12.1 advisor 评审对象锚

评审调用注入**机械生成的对象声明**——消除评审员推断"评谁/为什么评"的纠结（目标范围主题实证 73%）。父侧调用传 `object` 参数（`{type, target, status, reason, exclude}`——tool 参数为 JSON）→ advisor.mjs 在评审 user 消息机械注入对象声明块——**每轮（round1 fresh + round2+ 复评）都注入**。定序：对象声明块 → 评审内容。

**对象声明块格式（逐字定稿——英文）**：

```
## Review-object declaration (mechanical — do not infer)
Review type: {type} | Target: {target} | Object state: {status} | Trigger: {reason}
Excluded (not in this review): {exclude}
Follow this declaration — do not infer the review target from the documents.
```

无 object 参数 → 降级现状（不注入不崩——旧调用兼容）。

### 12.2 判定铁律（R1-R7）

> 铁律块注入全部 4 模板（advisor-design/round1/round2/round3）——辅助判定不改变语义。来源标注（诚实——不假装权威）：「verified judgments, NOT absolute — continuously re-reviewed」（英文单向定稿——4 模板同句）。**来源 = 样本 7 轮观察固化——持续复核。**

**D-10.1 R1-R7 判定铁律（逐字定稿——中文稿；提示词层英文定稿）**：

- R1 文档状态/内容不一致（非机制描述冲突——区别于 Document ownership 维度）→ 🟡（报出即修——父侧文档层——不是🔴；**例外：同一机制两处不同描述 = Document ownership 🔴**——维持 advisor-design.md 约定——不降级）
- R2 实现偏离设计（验收未达/静默简化）→ 🔴（必须修）
- R3 已有先例裁决（挂债——如文件尺寸）→ 🟡/🔵 不升级（不重复纠结）
- R4 测试脆弱（墙钟/依赖序列化形态）→ 🔵 + 建议改确定性
- R5 范围协调（父侧待办）→ 🟡 "协调项"（不报缺陷）
- R6 测试缝——测试需 mock 内部工具集/慢工具——工具集由循环内硬编码获取（不可注入）→ 不要试 真实慢工具/FIFO/大文件（不确定）/观察 onTool（不足以区分）/mock LLM 返回真实工具（太快）——唯一路径 = 加测试 seam（setter 或参数 override + `??` 默认兜底——默认 null 生产零变化——测试 finally 恢复）——两端同法
- R7a 文档状态矛盾/跨文件滞后 → 🟡 报出不改（评审只读；机制级矛盾除外——见 R1 例外 =🔴）
- R7b 内容矛盾 → 设计层(D) > 需求层(F) > 记录(TODO)——较高层为准
- R7c 数字漂移/TODO 未勾销/文档卫生 → 🔵
- R7d 语义悬空 → 🟡 报设计缺口（父侧补）
- R7e 从不因文档状态矛盾卡"通过"——矛盾=🟡 报出即过（**机制级描述不一致除外 =🔴**——必须处理后才可过）
- R7f 引用清扫/旧名残留/文档卫生只约束活体文案（docs/design/ 生效档 + 根级生效文档）；_archive/ 历史快照不在判定面（报 _archive 内旧名/旧路径不构成 🟡/🔵）。
- 来源：样本 7 轮——已验证判定——持续复核

### 12.3 文档归属纪律 + 代码变更都必须落文档

- **文档地图**（docs/design/README.md）：板块 → 文档文件映射 + 归属规则（一个板块一个文档、功能点并入所属板块、新板块才新建并登记、单一权威源）。
- **design 评审增强**：Review Criteria 第 7 维 Document ownership（与现有文档矛盾 → 🔴；该并入却新建/重复描述 → 🟡）+ 引用纪律（精确 file:line + unverified 标注）；design 提示词硬加载（缺失即抛错——防静默降级到劣质 prompt）。
- **代码变更都必须落文档（无"改动太小免文档"豁免）**：任何代码变更都在 docs/design/ 落文档——小改动并入所属板块现有文档（追加变更段/更新章节），新板块/机制建新文档（按文档地图命名）。**开发前先定位文档归属**（文档地图 → 所属板块文档——已有写变更段、无则新建并登记地图——然后才动手编码）——普通模式与工程模式同款纪律、无豁免。未落文档 = 文档漂移。
- **开工前计划确认纪律**：任何写文件/写文档动作前文字复述理解 + 计划要点等用户确认（无豁免——普通 + 工程都生效；子代理不适用——确认由父 agent 完成）。**question 工具抑制**见 §16。

### 12.4 byte-identical 取消（2026-09-04）——设计锚为准

CLI/VS Code `src/prompts/` 两端 **byte-identical 机械约束取消**（两端可各自演进——不再强制字节相同、不需同步脚本）。**替代 = 设计锚机制**：镜像锚文本在设计文档**逐字定稿**（权威源）——实现面照抄——差异暴露靠设计评审（Document ownership）+ 交付审计 + cross-repo-parity 语义锚（内容断言各端独立 fail-when-unchanged）。

byte-identical 相关机械比对断言/同步脚本全部清理；**内容断言（锚句存在）保留**。**保留的非镜像字节断言**：advisor-design.md 硬加载逐字节（防静默降级）、DeepSeek 前缀缓存字节断言（session-compaction/time-injection）、cross-repo-parity 语义锚。

**变更记录**：2026-08-21 文档归属纪律 + advisor design 评审增强（§12.3）+ 开工前确认（§12.3）；2026-09-03 代码变更都落文档 + 开发前落档；2026-09-04 评审对象锚（§12.1）+ 铁律固化（§12.2）+ advisor/coder/consult 人格锚（§7.6）+ byte-identical 取消（§12.4）。
## 13. 完整轨迹存档（traces）

> CLI-only（VS Code 同语义约定不实现——记 docs/TODO.md）。**机制**：每个模型调用（主 agent/子代理/advisor/compress/distill/consult/auto-think）的**完整轨迹**自动落盘 `~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl`——含发往模型的输入消息、模型输出、reasoning 全文、工具调用 args、usage——供事后逐轮分析"纠结/思路反复/决策分叉"。

- **采集点唯一**：`chat()` 导出（src/provider/core.mjs——所有 chat 调用经本函数）出口收集——不在四个 transport 分别埋点（续写/重试会 `result.reasoning +=`，出口收集才完整）。
- **元数据**：ts/session（`_sessionStart`）/cwdHash/role/depth/turn/provider-model/kind/stage/**isContinuation**（续写/重试链标记）/messages/content/reasoning/toolCalls/usage/finishReason/error。日期分日按**本地日期**。
- **脱敏**：复用 log.mjs 黑名单（apikey/designtoken/password/secret/token/authorization/proxyuri/proxy）+ SECRET_FORM 形态扫描——落盘前遮蔽。
- **写盘**：fire-and-forget 异步（不 await——chat() 返回不被阻塞）；落盘失败静默吞错；seq = 当日目录 max+1（不覆写）。
- **默认 OFF**（2026-09-05 发布隐私——traces.enabled 默认 false；本机调试可显式开）；启动清理 `cleanupTraces` 删 mtime > `traces.retentionHours`（默认 24h）的 .jsonl + 空日期目录；config 经 /config 菜单 + config.json。

**变更记录**：2026-09-04 用户裁定全量轨迹存档（§13）；2026-09-05 默认 OFF + 启动清理（D-TR6/D-TR10）；2026-09-06 并入 R2（auto-think logCtx 全字段——开关闭环）。

## 14. 会诊 / 飞刀完全异步化（R17）

> 权威：CONSULTATION.md（会诊机制）、ESCALATE.md（飞刀机制）。**核心**：consult/escalate 从"结果消费绑死在回合内"旧模型改为**digest 自动注入**——发完即可继续交互，完成自动到达、模型消化轮逐条处置。

### 14.1 会诊（consult）

- consult_start 非阻塞发起；**consult_check 退役**（§14——无消费对象——digest 注入后）；**consult_stop 保留**（取消语义——cancel 后不入 pending）。
- **settle**：`_consultSessions` 某 id pending=0（全部模型回复/失败）→ 升格完整 entry（`{id, role:"consult", report, done:true}`——ASYNC-RESULT-CONTAINER.md D2）移 `_pendingAsyncResults` 单容器（+role——原 `_pendingConsultResults` 独立流退役）→ 下回合 run 首行注入
  （"[System reminder: consultation #id finished — N replies: …]" 全文）→ 消化轮逐条判断处置。
- **注入时机**：全 settle 后一次注入（意见全貌才可判断——部分 settle 不提前注入）；超长 → digest 截断/落盘。
- **消化轮动作域**：按消费回合档位走既有规则（手动档 = 整理禁写；AUTO/用户回合 = 正常决策域）——无"consult 可写"例外。族差异只在消化指令语义（会诊 = 逐条判断采纳并处置）。
- 空闲 settle 也触发消化（驱动判据 = pending 单容器非空——四族统一——T-R17j）。

### 14.2 飞刀（escalate）

- escalate 加 async 语义——**入 other 池**（与 explore/plan 共享槽——公平排队）。发起返回 ack → 回合自然收尾 → 挂起态 → settle。**顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）。机制默认与参数合法性见 §7.2 escalate 行注（机制描述保留——提示词/工具描述不引导）。
- **settle 三分类**：done → merge mutations 回父（重叠写文件 → 报告级重叠警告——不 gate）+ 报告全文入 pending → digest；error（child 失败/撞 cap）→ 按父侧是否已改重叠文件决定 partial merge + 错误报告注入；cancelled → 不入 pending——提示（对齐 cancel 定向中止语义）。
- **工程模式拒保持**（engineering.md 拒 escalate——普通模式工具——eng 模式走 eng-coder）。
- **消化指令语义**：escalate = "报告已 merge——可继续改进"——动作域仍按档（无"飞刀可写"例外）。

**变更记录**：2026-09-06 R17（用户"这两都得完全异步化"）——设计 §14——CLI 已实现 + VS 镜像。2026-09-08 §7.7.1——escalate 顶层一律异步（同步保留句移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）。

## 15. 操作纪律 / 工具使用（提示词层）

> 提示词纪律条款的**来源语义**——落点 = system.md/engineering.md/discipline.md/main.md 等（各端照抄镜像锚——§12.4）。此处不复制提示词全文，只列本文件关联的操作纪律骨架 + 逐字锚归属。

- **操作并行化**：Parallelize aggressively——独立信息获取一次发多个；多文件编辑用 edits 数组；独立子任务一次 spawn 多个（含跨独立子项目拆分——share no files / no cross-dependencies / each has its own tests）；**Do NOT parallelize**：写同一文件（**声明 files 的 async spawn 例外——调度器自动排队**）、依赖链、bash/审批敏感命令（审批风暴）、同一 git 仓库并发 git、有状态操作；并行大操作、跳过微操作。
- **批量形态引导**（§4.3）：edits 数组原子多文件 / apply_patch 新建多文件——描述层引导。
- **委托标准**（main.md F-N1.6）：委托 = 改动面 ≥2 文件 或 单文件逻辑改动 >30 行 或 涉模块边界/导入面；内联 = 单文件 ≤30 行 或 纯文档/提示词同步 或 探索性。任务书标准结构（目标/已知事实/设计要点+禁止/约束/验收硬/交付报告表/调度元数据）——"Sized delegation without these fields is a defect"。
- **委托规模默认走 coder 子代理**（执行/检查分离——避免自查盲区）——"implemented by a coder subagent BY DEFAULT"/"spawn async with the design as the task book"。
- **长测试输出先落盘再查**：全量/长测试（≥60s）先重定向日志文件再查（`node --test … > log 2>&1`）——汇总从日志尾读、失败详情 grep——不用过滤管道直接跑长命令（过滤丢失败详情 + 管道缓冲截断）。日志放非工作区（OS 临时/~/.thincoder/）查毕删除。
- **Module Split Policy**：大文件拆分标准方法——①**write-first**（先整段写入目标文件再删源——任何时刻有副本）②段零改动（只修 import）③接线 ④node --check + 相关测试 + 全量绿 + **test/assertion 计数前后一致**（孤儿体/断引用显性暴露；断言静默丢弃 = 拆分缺陷）+ **同一任务内完成**（不拆两批中间态）。
- **edit 工具纪律**（main.md 扩展注 2）：old_string/行号/hash 只来自最新 read（never reconstruct from memory）；hashline old_hashes 只来自 read(hashes=true)；报错即修法——第二次同形失败 = 重读文件——never retry the identical input a third time。

**变更记录**：2026-08-21 开工前确认/文档归属；2026-08-23 委托策略；2026-09-01 操作并行化；2026-09-03 代码变更都落文档；2026-09-04 Module Split Policy + 审计范围引导；2026-09-05 委托操作标准/执行检查分离/edit 纪律；2026-09-06 长测试输出落盘。

## 16. question 工具抑制（2026-09-06）

**总体需求**：抑制 question 工具过度使用与不当形态（过度提问/大段文字/一条多问），修复 VS Code 卡片渲染可读性。**确认门（routine confirmation）用普通文本回复履行**——用户直接答"可以"——question 只留给真正需要用户选择/输入的场景。

- **工具描述三锚（question.md/VS Code question.mjs 对齐）**：每调用一问；单问简短（背景/分析放正文回复不放 question）；routine confirmations 走普通回复（仅真决策用工具）。
- **提示词**：engineering.md Questioning Style + system.md 确认门段 + discipline.md 工具表反模式列。
- **机械限制**：question 长度 ≤100 字符、options ≤4 条——超限返回错误串不弹卡不调 onQuestion。
- **VS Code 渲染**：`.question-text` 加 white-space:pre-wrap + max-height 兜底滚动。

**变更记录**：2026-09-06 用户实测 VS Code 端过度偏爱 question——四层根因 + CLI 已实现 + VS 镜像。

## 17. 权威源接管点（指针汇总）

以下机制**不在本文件详述**——权威源在别处，本文件只指路（不复制以免漂移）：

| 机制 | 权威源 | 本文件说明 |
|---|---|---|
| 工程模式判定/铁律/token 门/主流程 | ENGINEERING-MODE.md | §8 协议概览 + §12 铁律来源 |
| 评审轮次收敛 | ADVISOR-CONVERGENCE.md | §12 对象锚 + 轮次语义 |
| 测试分层 L0/L1/L2 | TESTING.md §1 | §8 指注（首次实现 L0+、修正轮 L0、父侧 L2 唯一全量点） |
| 工具注册/schema/ctx/hooks/undo | TOOLS.md | §4 调度决策语义 |
| 结果落盘阈值 | TOOL-OUTPUT-LIMITS-*.md | §4 引用 |
| TUI 显示/渲染/折叠块 | TUI.md | §7 显示面指针；子代理活动块/面板/freeze/子标见 TUI.md |
| 会话 | SESSION.md | read_history 语义 |
| 上下文压缩 | CONTEXT-COMPACTION.md | §2 压缩安全点 |
| 会诊/飞刀机制 | CONSULTATION.md / ESCALATE.md | §14 异步化 |
| 事件日志 | LOGGING.md | traces 上游互补 |
| 模型上下文配置 | PROVIDER.md | 推理/预算 |
| 记忆 | MEMORY.md | §3 记忆检索 |
| MCP 机制 | MCP.md | 工具面扩展 |
| 多实例协作感知 | MULTI-INSTANCE-COLLAB.md | 并行副本感知 |
