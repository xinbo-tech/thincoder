# Agent 主循环（agent 板块）

> 板块：Agent 循环。权威源：thincoder-cli/src/agent.mjs + src/agent/ + 子代理相关（spawn-child / subagent 工具 / suspension）。本文件描述 agent 主循环的**当前设计**——回合驱动、guard 体系、中断语义、工具调度、子代理机制、挂起回合与 digest、工程交付协议、评审收敛。跨文档已接管的主题只留指针，不复制。
> 关联权威：`ENGINEERING-MODE.md`（工程模式判定 / 铁律 / token 门）、`ADVISOR-CONVERGENCE.md`（评审轮次收敛）、`TESTING.md`（测试分层 L0/L1/L2）、`TOOLS.md`（工具系统注册/调度出口）、`TUI.md`（显示面）、`TOOL-OUTPUT-LIMITS-*.md`（落盘阈值）。
>
> 其余关联：`SESSION.md`（会话）、`CONTEXT-COMPACTION.md`（压缩）、`CONSULTATION.md`（会诊）、`ESCALATE.md`（飞刀）、`LOGGING.md`（事件日志）、`PROVIDER.md`（模型上下文）。
>
> 本文档以机制主题组织，不按历史批次号排序。历史变更折叠到各节末尾「变更记录」一行注记（格式 `2026-xx-xx: <专题>（<commit hash>; 详见 git log）`）。逐字锚句保留一份为准（设计文档 = 锚定稿源）——外指不复制到别处。

## 未决 / 待办状态行（承接开放项——勿当历史折叠）

- **checklist 多批跟踪强化**（工程模式每批准设计批 = checklist 一条——用户"放一放，等我想好了再说"——挂起；恢复条件 = 用户给方向：唯一制/分界/保持）——见 docs/TODO.md。
- **普通模式偏差审计**（第 23 批评估收口 2026-09-11——F-N1.1..6 条目迁入 `../requirements/NORMAL-MODE.md` §6；审计结论与收口落点见 §19——待批次批准实施；**原「执行/检查分离（扩展 F-N1.5）实施细节待批」不成立**：该细节已由 F-N1.5/F-N1.6 条款实落）。
- **R23 VS Code 镜像批评估**（2026-09-11 前提更新：CLI 子块小节已随 SUBAGENT-TAIL 批退役——现行差异 =
  CLI 内层行无归属标 vs VS chunk.sub 行首子标——`thincoder-vscode/src/agent-tools/subagent-run.mjs`
  `runChild`·`forward`（子标挂载，as-of :26-37）、`webview/ui.js（VSC 仓）` `appendAdvisorChunk`（`.advisor-sub`
  行首 dim 子标，as-of :41-94）；评估项 = 是否给 CLI 内层行加归属标 / 如何随镜像批对齐——待独立批次）。
- **B3 观察点**（advisor 20 轮预算——B1/B2 生效后看实测轮数再议）。
- **观测设施清理**：LOGGING 可观测项（调试完成后删除）——记 docs/TODO.md。
- **子代理行数债**：subagent-async / subagent-blocks / subagent.mjs 等超 500 行硬限——拆分轮见 docs/TODO.md「拆分治理组」。
- **混合边停滞残留意向**（P-SL2——纯文件边环已修；依赖边 × 文件域边跨类型环靠停滞检测兜底——docs/TODO.md）。
- **后台池可观测/可控补面（第 10 批——设计已落档待评审）**：CLI 端 `wait_for "advisor settled"` 判据读错池
  （`thincoder-core/tools/ops.mjs` as-of :223-227 只查 `_asyncSubagents`）；VSC 端 `subagent status/cancel` 未接评审池（工具面）
  + 同款 wait_for 缺陷。设计见 §18；需求见 `../requirements/AGENT-LOOP.md` §4。
- **VSC 端 600s 绝对墙钟残留（第 24 批 abort 来源标注勘察发现——2026-09-11）**：`thincoder-vscode/src/provider.mjs`
  as-of :324 每请求 `AbortSignal.timeout(600_000)`——用户实证死亡文案（"aborted due to timeout"）的唯一在网生产点；
  VSC 仓独立写域，**父侧排程**（所需档与完整修复路径见 §20.10）。
- **TOOLS.md §3 hooks 事件表收口（第 30 批 Stop 钩子——2026-09-11）**：`docs/design/TOOLS.md:38` 行需更新
  （+Stop / `~/.thincoder/hooks/` 路径纠错）——本批未落（不在声明面），父侧排程（目标文本见 §21.9）。


## 变更记录（历史折叠——详见 git log）

- 2026-08：回补主循环/上下文/guard/中断/子代理基底（子代理活动统一、运行面板固定化、sync 精确冻结）。
- 2026-09-02：子代理异步化（async + 槽位队列 4）→ 挂起回合 V2（会话级后台双通道 + auto-turn digest）→ 工具使用优化（approval 批确认 + 批量形态引导）→ 工程交付协议（eng-coder 默认 async + 内部自审计闭环）。
- 2026-09-03：工具面合并单工具动作面（spawn/status/…）+ 控制面扩展（cancel/UI 停止/嵌套前缀）+ 子代理任务调度器（files/dependsOn）+ Ctrl+C 武装化 + panel 检查工具。
- 2026-09-04：子代理零 git + 完整轨迹存档 + 测试分层收口（父侧 L2）+ advisor 评审对象锚 + 工程模式铁律固化 + byte-identical 约束取消（设计锚为准）+ verify 改动文件定位修复 + 审计范围引导（quick + 预算句）+ 测试文件按域拆分 + 普通模式偏差审计。
- 2026-09-05：Module Split Policy / checklist 多批跟踪 / 委托操作标准 / 环形死锁修正 / 停滞机械检测。
- 2026-09-06：回合外事件后台化统一模型（advisor async + 角色分池 + 排队合并）+ 会诊/飞刀完全异步化（digest 自动注入） + long 输出落盘纪律 + question 工具抑制。
- 2026-09-07：嵌套子代理显示统一（R23）/ files 父侧文件拦截（R26）/ async advisor stale 误判修复 + 凭证机制（§11.2）。
- 2026-09-11：普通模式偏差审计评估 + 会话上下文轮退役（第 23 批——§19 新增；F-N1 条目迁入需求档；相关文本与状态行同步）。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：新增 §23（子代理族与轨迹存档内存上界：捕获截断 / 释放点 /
  单遍序列化 / 在途上界；需求 = `../requirements/AGENT-LOOP.md` §15）；批次档
  `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`。
- 2026-09-11（TUI-OOM-ROOTCAUSE 批·设计评审轮次 1 修正轮——本档 #2/#9/#10/#12）：§13 追加内容
  额度修订行（#2）· §23.7 AC-O4 锚点改指 §13 字段清单（#9）· §23.3.2 seqCache 多进程语义登记
  （#10）· §23.5 头注释同步登记 + §18.5 `subagent-actions` 行数实测刷新（#12）。

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
- **reason 词汇表扩展（2026-09-11 第 24 批）**：程序性取消 / 停止（含二按全停）/ 定时器中止站点新增 `abortTrigger` 载荷形态（上列 `{interrupt}` 判据点语义零改）——枚举 / 判定 / 求值链见 §20.3。

**变更记录**：2026-08 回补中断语义；2026-09-02 挂起驱动下 finally 语义放宽（§9）；2026-09-03 Ctrl+C processing 武装化 + 回合 abort 与池解耦（§9.5）；2026-09-03 autoTurn 选项 + AUTO 档续跑；2026-09-11 第 24 批 reason 词汇表扩展指针（§20.3——`abortTrigger` 形态）。

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

**综述**：子代理 = `depth > 0` 的独立 agent 对象 + 丢弃式局部双线；role（explore/plan/coder/eng-coder/eng-designer）决定工具集（只读过滤）与 overlay prompt。**文档组织**：显示/交互面 → TUI.md；工程交付协议（eng-coder 内部自审计闭环）→ ENGINEERING-MODE.md + §8 交付协议；工具面/async/调度器/分域池 → §7.1-§7.4 + §10/§11。

### 7.1 角色与委派

**Available roles 矩阵**（subagent 工具 description 逐字对齐——setup.mjs filteredSubagent / VS Code modeRoleField 覆盖 role 字段）：

| 角色 | 能力 | 模式 |
|---|---|---|
| explore | 只读查询族/**零 git——不注入 git 上下文（§7.4）**/报告须列未找到项/thoroughness 三档 | 普通 + 工程（只读） |
| plan | 纯只读规划 | 普通 + 工程 |
| coder | 父全量读写执行 + verify/advisor 自评 + 强制交付表 | 普通 |
| eng-coder | 工程模式替换 coder + 设计驱动 overlay + 必带 designToken + explore 受限审计 | 工程 |
| eng-designer | 工程模式写稿面唯一作者（需求档/设计档/批次档 §2，含修订）+ **无 designToken**（授权 = 需求已确认）+ 必带 batchDoc + explore 受限勘察（≤6/批，不占审计预算） | 工程 |

**Mode filtering**：普通模式 explore/plan/coder，工程模式 explore/plan/eng-designer/eng-coder——schema enum 反映现行模式（角色互斥：工程禁 coder / 普通禁 eng-coder 与 eng-designer，schema 枚举 + 运行期硬门禁双保险）。

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

**sync 定向中止（SYNC-CANCEL——2026-09-09 机制正文；专题设计 SYNC-CANCEL.md——README
随核销登记）**：
- **面**：CLI TUI **顶层 sync 块**（sync spawn——深度>0 或阻塞调用）运行中 ⏹ 可点——
  定向中止（只停子代理——父回合继续拿 stopped 报告）。嵌套层无独立 ⏹ 面（F5 逐层自属
  controller 链传播）；VSC webview 不同构——同步 spawn 块无 ⏹（无池条目——cancel 路由
  定位不到——防无效 ⏹；⏹ 面 = running+pool 停 + queued/waiting 头取消）；
  escalate sync 块无 ⏹ 面；
  **action:"cancel" 只对 async 池/advisor 池——sync 由 ⏹ → cancelSyncChild 直连**
  （subagent-async.mjs——与 cancelAsyncSubagent 同模块同形态）。
- **信号链（F1/F5）**：sync 阻塞分支（subagent.mjs execute）runChildPipeline 前建**自属**
  AbortController——`armSyncChildAbort`（childRunOpts.signal 覆写 ctrl.signal——照抄 async
  分支覆写模式——buildChildRunOpts 不改——escalate/consult 零触碰）；ctrl 链到基信号
  `buildChildSignal`（`_sessionSignal ?? ctx.signal`——挂起 digest 场景 ctx.signal 未 abort
  而 base aborted——R2）——Ctrl+C/I 整回合停语义不变（base abort 逐链传播）；**注册
  `parent._syncChildAborts`**（Map——key = relayPrefix 去尾 `role#N`——{ ctrl,
  stopped:false }——与 async 条目 controller 存池分层一致）——try/finally **三路径注销**
  （成功/折叠/整回合停——R7 防跨回合残留）。
- **catch 三分支（F2）**：纯函数 `classifySyncAbort(ctxSignal, baseSignal, ctrlSignal, err)`
  ——① base/ctx aborted → 整回合停现状保留（rethrow）；② err AbortError && ctrl aborted
  && 非整回合停 → **折叠**：eng-coder mergeChildMutations（与 escalate runner 同形）+ stopped
  partial 报告（STOPPED_MARK 公共锚 + `_capturedOutput` + eng-coder designId 后缀）+
  ⟦ev⟧stopped 直发（TUI 块冻结标 stopped 而非 done——R6）+ 正常 return（ctx._subagentKey
  照设——成功冻结管线复用）；③ 其他错误现状保留。
- **TUI 三层**：面板门控 `!sub.done && (sub.async === true ||
  state._agent?._syncChildAborts?.has(sub.key) || sub.queued) && (SUBAGENT_ROLES/advisor)`
  （headless/测试无 _agent → sync 不钉——零回归；queued 臂 = QUEUED-VISIBILITY F-2）；
  mouse 命中区零改动——cancelSubagent 池/advisor miss 后
  查 sync registry → cancelSyncChild；**v2 模态 deny（用户裁）**：⏹ 顺带 deny 该 child 的
  pending 权限/continue 模态（ask 加 owner key 标识——name `${key}/${tool}`；continue ask
  args.agent=key 既有）——模态立即解除（child 随即在 abort 检出点解绕折叠）；`_permQueue`
  排队 ask 闭包查 entry.stopped 旗标 → 不弹模态直接拒绝。该缺陷 async cancel 同样存在
  （现状已知——非本批引入——v2 deny 机制后续可复用 async）。
- **STOPPED_MARK**（spawn-child.mjs TURN_CAP_MARK 旁——"stopped by user"）：折叠报告公共
  锚——tool-events onToolResult partial 检测扩展该串（块冻结标 stopped 而非 done）。

**变更记录**：2026-09-03 五动作（含 escalate 并入/status/cancel/panel）→ 2026-09-06
check 删除（§7.5）——工具面六动作 → 五动作 → 2026-09-08 observe/send
（SUBAGENT-OBSERVE-SEND）——五 → 七动作 → 2026-09-09 sync ⏹ 定向中止
（SYNC-CANCEL——本节 cancel 边界注）。

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

顶层主 agent 的 git 上下文保留（§3——有完整 git 工具、实时收集、无断裂）。动机：git 是污染源（`git diff HEAD` 不见已提交修复、untracked 新文件不可见、`status` 是全工作区脏状态）——比没有 git 更危险。与 advisor 零 git 同构——双物理防线（工具不存在 + 不注入）；**口径收窄（第 4 批）**：「恒定六工具不含 git」只对代码评审成立——设计评审在批次档已绑定时额外挂 `batch_segment` 写通道（`ENGINEERING-MODE.md` §2.20.3），git 仍在零工具之列。

**变更记录**：2026-09-04 用户两次裁定（偏差审计禁 git → 根本不该注入）——§7.4。

### 7.5 check 删除 + async 锚句（2026-09-06）

`action:"check"`（阻塞取回 async 报告）已**删除**——check 是冗余 API。需要报告 → 顶层已禁 async:false（§7.7——一律异步——报告自动到）；深度>0 内（子代理）同步 spawn 仍可用（平台规则）。async = 后台跑 + 结果自动送达——没有"异步拉起再等它"的路径。删后无"拉回阻塞"动作——模型不再自发轮询钉死回合。结果自动通道（§9）不受影响——done 条目无人工消费后自动通道照常接管（不丢）。consumed 墓碑保留（§10 dependsOn"consumed id 视为已满足"）。

**async 锚句（逐字定稿——subagent 描述 Async spawn 段——双端照抄，fail-when-unchanged）**：

> After an async spawn the turn winds down normally — nothing expects you to wait for it: the child runs in the background and its report is delivered to you automatically — before your next turn, or digested in the suspension session — so end the turn; do not poll or wait for the result.
> Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule).

**变更记录**：2026-09-06 删 check（§7.5）。2026-09-08 用户裁定顶层 spawn 一律异步（§7.7——async:false 例外移除——提示词同步）。2026-09-08 评审 8 项采纳（AC1 机械断言/测试点名/锚句单源 §7.5/AC3 验证/TODO 后备/§7.3 中性/编号序注/实现自验注——token e21d5ace）。

### 7.7 顶层 spawn 一律异步——async:false 例外移除（2026-09-08 用户裁定）

> 需求层已迁出（2026-09-10）：顶层 spawn 异步化需求见 `../requirements/AGENT-LOOP.md` §2。
> 状态：**已交付核销**（2026-09-08——评审 8 项采纳 + eng-coder clean 交付——CLI c08e1b2 / VSC 8763ac2——L2 双端绿——consume a2b10815——待平台侧工具描述同步 + 机制兜底 TODO）。

**现状问题**：async 锚句（§7.5 :258）与 main.md:13/engineering.md:18 都含 "pass `async:false` only when…"——给了模型 async:false 例外通道——实际反复误用（explore/eng-coder 同步 spawn——阻塞自己 turn + 占池）。

**改**：
1. **async 锚句改版**（:258——**§7.5 为唯一权威驻点（评审 #3——行 8 单源纪律——§7.7 只留指针不重复承载逐字文本）**——fail-when-unchanged 断言需同步）：删 "use a synchronous spawn instead — pass `async:false`" 引导——改为 **顶层一律异步**。新锚句（实现时落 §7.5 :258——§7.7 此处仅变更记录）：
   > "Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 (the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it). Inside subagents (depth>0) spawns are always synchronous (platform rule)."
   （评审 #3：实现后 §7.5 锚句区为此文唯一权威——§7.7 保留指针引用不再逐字复述）
2. **main.md:13**（双端）：删 "pass `async: false` only when the report is required before continuing" → "never pass `async:false` at top level — results reach you automatically; if your next step depends on the report, end the turn and let it arrive".
3. **engineering.md:18**（已退役——2026-09-10 PROMPT-SYSTEM 施工①③）：同改（"Pass `async:false` only when you must handle the report synchronously before continuing" → 删——顶层一律 async）。
4. **§7.3 L228 机制注**（评审 #7——措辞中性化）：L228 括注 "（逃逸口）" 改中性机制描述——"depth-0 参数合法；顶层行为受提示词约束——见 §7.7"——`async:false` 机制保留（子代理内部 depth>0 用）——不并置"逃逸口"与"不鼓励"混杂信号。
5. **平台侧 subagent 工具描述**（不可改——平台注入）：仍含旧 async:false 引导——**上报平台侧同步**（项目仓改不了——锚句 fail-when-unchanged 测试需排除平台描述或记录偏差）。

（评审 #5 编号序注：§7.7 编号超前 §7.6——本段插入于 §7.5 后（主题邻接——async 锚句）——重排编号会断既有引用——取保留现序 + 此注说明——§7.6 人格锚不受影响）

**受影响文件**（评审 #2——测试文件点名 + 行数注）：AGENT-LOOP.md（锚句 :258 + §7.3 L228 注 + §7.7 新段 + 变更记录）；src/prompts/main.md（双端——CLI 仓 + VSC 仓 各一）；src/prompts/engineering.md（双端——已退役：2026-09-10 PROMPT-SYSTEM 施工①③）；prompts 内容断言测试（双端——实现时 grep 定位含 async 锚句断言的测试文件——按实际点名补登——delta ≤±N）——行数实现时刷新。

**验收**：
- AC1（评审 #1——机械断言 1:1）：main.md/engineering.md（双端）删旧句逐字（"pass `async: false` only when the report is required before continuing" / "Pass `async:false` only when you must handle the report synchronously before continuing"）+ 新句存在断言（"never pass `async:false` at top level"）——fail-when-unchanged 双端内容断言同步
- AC2 锚句改版在 §7.5（fail-when-unchanged 断言同步——测试绿）
- AC3（评审 #4——验证方式明确）顶层 spawn 实践：explore/eng-coder 全异步——父侧核销项（会话轨迹审计——depth-0 spawn 无 async:false）——非 eng-coder 自查项
- AC4 depth>0 平台 sync 不变（机制零触碰）

（评审 #6 后备注：若纯提示词修复后顶层 async:false 仍复发——机制层兜底方案（工具层拒 depth-0 async:false）挂 docs/TODO.md 技术组——本批不实现）

（评审 #8 实现期自验注：eng-coder 开工前先 read 两端 main.md/engineering.md 定位旧句——行号/字句与设计描述不符则停下上报——fail-when-unchanged 断言删旧句会兜底）

（锚句权威指针（评审 #3）：async 锚句改版后的逐字文本以 **§7.5 锚句区**为唯一权威驻点（2026-09-08 改版落此）——本 §7.7 只留变更记录与指针，不重复承载逐字文本——锚句内容以 §7.5 为准。）


### 7.7.1 escalate/advisor 顶层也纳入一律异步（2026-09-08 用户裁定 a——范围扩展）

> 需求层已迁出（2026-09-10）：escalate/advisor 顶层异步化需求见 `../requirements/AGENT-LOOP.md` §2。
> 同步例外全移除（含 §14.2 "async:false 显式同步保留"句）。快车道（用户明确指令）。
> 状态：**已交付核销**（2026-09-08——评审 #1 5项 + #2 4项采纳——eng-coder clean 交付——CLI ed4fc5c / VSC 1a89da8——双端测试 118/111 全绿——L2 绿——consume 494298fe——上报待裁项见 §7.7.1 变更记录）。

**现状**：§14.2 :540 escalate "`async:false` 显式同步保留" 与新 §7.7 "顶层一律异步" 打架；
- VSC main.md:28 escalate 段仍含 "pass `async:false` to wait for the report synchronously"
  （CLI main.md:28 已纯异步引导——**双端漂移**）；CLI/VSC engineering.md advisor 段无
  async:false 引导（grep 核实——eng-coder 报告项 4 的 engineering.md:16 观察不实）——该档已退役（2026-09-10 PROMPT-SYSTEM 施工①③）。
- **工具描述面（最大引导面——2026-09-08 用户质询发现）**：§7.7 item 5 假设"平台侧不可改"
  **错误**——Async spawn 段 description 在项目仓 src/agent-tools/subagent.mjs:70（CLI）/
  src/agent-tools/subagent-spec.mjs:40（VSC）——模型每次调 subagent 看到的描述 = 此处字符串——仍含完整旧
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
5. **工具描述 Async spawn 段**（CLI subagent.mjs:70 / VSC src/agent-tools/subagent-spec.mjs:40（VSC 仓）——§7.7 item 5 纠错）：
   删 "Pass async:false only when you must handle the report synchronously" + "use a synchronous
   spawn instead — pass `async:false`" 引导——改 "顶层一律异步——报告自动到——depth>0 内同步"
   （对齐 §7.7 新锚句）。escalate 段描述同步去 async:false 句（若含）。
6. **机制注**（评审 #2 N1——重编号）：escalate/advisor 的 depth-0 async:false 参数仍
   平台合法（机制零触碰——AC5 同 §7.7 AC4）——提示词/工具描述不引导——标注与 §7.7 一致。

**受影响文件**（评审 #2——注解 + 测试点名）：AGENT-LOOP.md（§14.2 + §7.2 escalate 行注 + §7.7.1 新段 + 变更记录）；
   VSC src/prompts/main.md、CLI src/prompts/main.md（核实）；CLI src/agent-tools/subagent.mjs（Async
   spawn 段描述——行数 >500 既有债不重论——描述串替换 = structure unchanged——delta ≤±N 实现时刷新）；
   VSC src/agent-tools/subagent-spec.mjs（VSC 仓；同）；prompts 内容断言测试（双端——实现时 grep 定位——
   §7.7:276 排除平台描述的 carve-out **反转**——描述既在仓内可改——断言纳入——按实际点名补登——
   实测 test/ 对 async 锚句/描述零命中——本批新建 CLI test/prompts-async-guidance.test.mjs + VSC
   test/prompts-async-guidance.test.mjs（AC1-AC4 fail-when-unchanged 正向断言）。

**变更记录**：2026-09-08 用户质询"平台侧不可改"→ 纠错：工具描述在项目仓 src/agent-tools/（可改）——§7.7 item 5 假设错误已注——工具描述面纳入本设计（最大引导面）。
> 2026-09-08 交付后收尾：eng-coder 上报 run-stages.mjs:112 advisor 必审提醒串含顶层 async:false 引导——
> 父侧 minor fix 已清（改一律异步——机制零触碰——只改提醒文案）+ main.md:8 上报经核为误报
> （双端 L13/L28 已清——无残留）——commit 见 VSC 仓。2026-09-08 §7.7.1 实现交付（eng-coder——item
> 1/4 落 §14.2 + §7.2 escalate 行注——见上）。实现核实纠正设计观察不实三处：CLI main.md:28 实含
> 残留 / VSC engineering.md:16 advisor 段实含同步句 / advisor.mjs 描述实含同步句（CLI:44 + VSC:177——engineering.md 已退役：2026-09-10 PROMPT-SYSTEM 施工①③）
> ——已一并清（"有则一并清并上报"）。VSC discipline.md:69 escalate 行同款残留一并清（报告项；该档已退役——2026-09-10 PROMPT-SYSTEM 施工①③）。
> run-stages.mjs:112 提醒串父侧已清（2026-09-08 收尾 commit）。main.md:8 上报经核为误报（双端无残留）。
> 待父侧核销（L2/consume——已完成 ed4fc5c/1a89da8 + L2 双端 118/111 绿）。

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

**会话上下文轮（旧 §18.8.1——2026-09-04 设计）——已退役（第 23 批评估 2026-09-11）**：该设计（新第一轮 + `advisor-context.md` + cap 6）
从未实现；其问题域（评审可评估「真需求覆盖」）现由四个机制承接：① 会话背景注入（`thincoder-core/advisor/messages.mjs`——最近 3 组交流，机械提取）；
② 需求文档主参照（Project Guide 指向——评审工作流第 2 步必读）；③ 设计评审批次档绑定（`batchDoc`——`ENGINEERING-MODE.md` §2.20.3）；
④ 评审对象声明（§12.1）。round2+ 无会话考古、四模板 Neutrality 锚不变。评估与证据见 §19。

**变更记录**：2026-09-04 advisor 人格锚（§7.6）+ coder/consult 人格锚（§7.6）+ 会话上下文轮设计（§7.6）；2026-09-11 会话上下文轮退役（从未落地——第 23 批评估，见 §19）。

## 8. 工程交付协议：eng-coder 内部自审计闭环（概览）

> 完整协议（内部闭环步骤 ①-⑦ / 收敛计数 ≤5 / 任务域授权 / 审计任务书独立性 / 报告终态 clean|stalled）→ **ENGINEERING-MODE.md**（权威）。**测试分层（L0+/L1/L2）+ 父侧 L2 收口 + 修正轮默认不重跑 LLM** → TESTING.md §1（权威——原测试分层节已迁）。此处只述本文件机制关系。

- **eng-coder 默认 async**：spawn 即返回 → 主回合结束进挂起 → 交付 settle → digest 注入消化。主会话无跨 digest 状态机（复杂度归位子代理内部回合循环）。
- **eng-coder 内部 spawn 受限**：只允许 explore role + 同步（机械层——防内部递归 spawn eng-coder 无限嵌套）；非 explore/async → 工具层拒绝。子代理内（depth>0）async 本就拒。
- **任务域授权**：spawn 时刻授权（用户已批准设计+任务）——内部写操作自动放行（豁免粒度仅 onPermissionRequest 阶段；planMode/design-token 等前置门照常）。域外写仍受纪律约束——交付偏差审计兜底。
- **收敛与终态**：内部 explore 偏差审计 + advisor 复评闭环（§8.1）；修正轮共享计数 ≤5；报告自述 `clean`（审计 clean + advisor clean）或 `stalled`（未收敛/节点失败重试仍败）。**子代理零 git**（§7.4——审计证据 = 任务书 + 磁盘 + `_touchedFiles`）。
- **审计效率**：审计 explore thoroughness = **quick**（非广度探索）+ 机械预算句（只读 `_touchedFiles` 文件 + 任务书点名节，预算 ≤10 工具轮）+ A1 指令模板/A2 摘要块/A3 报告模板。
- **文档漂移处置**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物）——真实漂移写入交付报告/stalled 注记——修订归架构师/父侧（防子代理改文档洗审计）。

### 8.1 偏差审计四类 + 普通模式轻量审计

**四类偏差**（对照设计逐条查）：**部分实现 / 静默简化 / 文档漂移 / 超清单改动**。"超清单"判据 = 改了且未报告 = 偏差（静默越权）；
已报告 = 透明可接受（A 裁定——清单外改动允许但必须逐项报告）。**普通模式轻量审计**（现行提示词 `persona-normal` / `common` / `discipline-normal`——
条目见 `../requirements/NORMAL-MODE.md` §6）：主代理验证 coder 交付时对照①本轮用户指令②板块设计文档（文档地图定位）查三向一致 + 指令落文档——
零额外 LLM（读是既有动作）；F-N1.4 升级：实现偏差由主 agent 修正至符合设计后才宣布完成（真实文档漂移/超范围 → 报告用户不擅改）。

**变更记录**：2026-09-02 工程交付协议（用户重构裁定链下沉 eng-coder）；2026-09-04 测试分层收口 + 审计范围引导 + 文档漂移永不编辑；2026-09-05 普通模式偏差审计修正闭环；2026-09-11 第 23 批——F-N1 条目迁入 `../requirements/NORMAL-MODE.md` §6（评估与收口见 §19）。

## 9. 挂起回合：会话级后台双通道 + digest

> 权威：CLI `src/tui/agent-turn.mjs`（runAgentTurn + suspensionSession 驱动）+ VS Code 面板
> 循环同构。**机制核心**：async 子代理运行中主会话**回合尾不阻塞**——进入挂起态（挂起空闲
> 输入可用、状态行"后台 N 子代理运行中"）；子代理完成 → 自动消化（digest auto-turn）。
> **主会话 busy（processing 含 digest）提交禁发**（输入不禁——可打字回显——Enter/斜杠同
> 吞——斜杠白名单已删——INPUT-LOCK-BEHAVIOR-REVISED 2026-09-09 修订）——排队机制整批废弃（INPUT-LOCK-ASYNC——
> 专题记录 `INPUT-LOCK-ASYNC.md`——2026-09-09：R15 攒批删 + pendingInput 单槽化——§9.2 行表/§11.3）。

**问题源**：async 子代理运行期间主会话回合尾阻塞等待全部完成（等待期用户无法输入）。用户方案：回合尾语义从"等全部"改为"收已完成 + 移交未完成"——挂起态是**交互层状态**（runAgent 保持"单输入 → 输出"不变式——挂起循环落在调用方 turn 循环）。

### 9.1 回合尾语义（collectSettledAsync）

回合尾不再直注入排空——done 条目**留池**（settled not consumed）→ agent-turn willSuspend（poolLive 覆盖池非空）判 true → 进 suspensionSession → sweepSettledToPending → pending 非空 → digestTurn。**无 suspension 驱动调用方**（headless/直连 runAgent）保留回合尾直注入兜底（不丢结果）。多条目近邻完成 = **合并一轮消化**。

### 9.2 挂起状态机

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态 | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 入 `_pendingAsyncResults` → 开 auto-turn | auto-turn 期间仍挂起 |
| suspension | 用户 Enter（无 digest 在跑——挂起空闲） | 新回合输入入 `pendingInput` 单槽（至多一条——F-6）+ 唤醒 | 回合末池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（digest 在跑 = busy） | **提交吞**——Enter 不发送（斜杠命令同吞——白名单已删——INPUT-LOCK-BEHAVIOR-REVISED）+ busy 提示（INPUT-LOCK F-3——旧"入 pendingInput 队列"已废——busy 禁排队） | auto-turn 结束后回挂起（文本保留可重发） |
| suspension | 释放窗口/槽满 Enter | 单槽交接（偏差 #1 守卫）——槽满吞 + 提示 | 不变 |
| auto-turn | 池项 settle（消化中） | settle 入 pending（不并发开新轮——单 runAgent 循环） | 轮末按 pending/池态续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 `_suspended` | → idle（挂起自然退出） |
| auto-turn | 结束且 pending 非空 + 无 pendingInput | 立即续开合并消化轮（一次注入全部 pending） | → 新 auto-turn |
| auto-turn | 结束且池非空 | 回挂起等下一 settle | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合 | → 回合 |

**时序边界**：settle 与 `_suspended` 翻转竞态——`_suspended` 在 runAgent finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；门控以回调读取时刻为准（确定性，无锁需求）。

### 9.3 digest auto-turn（动作域两档）

- **触发**：挂起态池项 settle 且无待处理用户消息（pendingInput 单槽空）→ 交互层开 auto-turn（注入由 auto-turn 的 prepareRun 统一完成——单注入点）；多子代理近邻完成 → 一轮消化全部。
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
- **清理**：中止后复位 `state._suspAborted`（可重新进入挂起态）；残余 pendingInput 单槽消息转回 `state.queue`（单条——不静默丢）；回合启动解除 `exitArmed` 残留（空闲退出双确认不跨回合）。

**变更记录**：2026-09-02 挂起回合 V2（用户裁定 AUTO 推进型）+ 偏差修复轮；2026-09-03 硬化轮（settle 完成队列 + 消化逐条回收）+ Ctrl+C 武装化 + sync spawn 精确冻结；
2026-09-06 pendingInput 排队用户指令合并（§11.3）；2026-09-09 INPUT-LOCK-ASYNC（C'——busy 含 digest 输入禁用——提交吞 + 白名单直执行——R15 攒批/queue 排队废弃——pendingInput 单槽——§11.3 全文废弃记录——专题 INPUT-LOCK-ASYNC.md）；
2026-09-09 busy 行为修订（INPUT-LOCK-BEHAVIOR-REVISED——评审通过——输入不禁只禁提交——斜杠白名单删——忙时同吞——退出靠 Ctrl+C——双端实现——专题档见 docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md——已归档（DOC-REORG 批））。

> 〔eng-designer 折行 2026-09-11 13:10：单行 444 字符 → 纯折行（批 14 候选 2；文字零增删、语义不变）〕

## 10. 子代理任务调度器（files/dependsOn）

> 权威：`src/agent-tools/subagent-scheduler.mjs`（CLI 拆分后宿主）+ VS Code 同构。**机制**：父代理只声明域与依赖、提交即走——调度器保证同文件串行、依赖有序、并发不误伤——根治同文件并发失误（2026-09-03 id:13/14 事故为证）。

### 10.1 调度参数与准入

- **`files?: string[]`**——写域声明（eng-coder 纪律——§8.1 L443 A 裁定：清单外改动允许但必须逐项报告——审计兜底；不做任务书文本自动解析）。**目录声明不支持**（`normalizeFileList` 对以 `/` 或 `\` 结尾 / 指向既有目录 → 抛明确错误——fail-closed）。归一化：相对 cwd 转绝对 + 正斜杠 + win32 小写比较键。
- **`dependsOn?: string[]`**——子代理 id 列表（显式依赖）。
- **`batchDoc?: string`**（eng-coder spawn 门禁参数——**非调度参数**，不参与冲突判定）：工程模式下 spawn
  `role="eng-coder"` **必传**——批次档路径（`docs/batches/<批>-<主题>.md`，即该 spawn 实现的任务书）；
  判据 = 参数在 + `resolve(cwd, batchDoc)` 存在且为文件（**不校验内容/措辞**）；没传 / 路径不可读 →
  spawn 拒绝（校验落点 = `buildSpawnChild`——token 门之前，sync/async 两路共经）。explore/plan/coder
  spawn 不受影响；机制权威 = ENGINEERING-MODE.md §2.12。
- **缺省**（无 files 无 dependsOn）= 既有语义（立即启动、不参与冲突检测）。
- **准入（spawn 时）**：若 (running ∪ queued) 有 files 交集 或 dependsOn 未 done → 入 queued（waiting-deps 态记原因）；否则立即 start。
- **仅 async 参与调度**：sync spawn（async:false）带 files/dependsOn 且命中冲突 → **明确错误**（不队列化——sync 语义零变更）。
- **动态文件域（SCHEDULER-DYNAMIC-DOMAIN 2026-09-09）**：冲突判定的"他条目域" =
  `effectiveFiles(e)` = 声明域 ∪（running 且已绑 childAgent 时的
  `childAgent._touchedFiles`——写工具批提交实时记录，绝对路径与 normalizeFileList 同源，
  fileKey/filesOverlap 键空间零改动）。queued 条目无 childAgent（start 才绑）——天然只
  声明域（`?.` null 安全）。out-of-list 写入（交付常态——纪律允许 + 逐项报告）由此获得域保护。

### 10.2 补位 + 环形死锁防御 + 停滞检测

- **补位（maybeRefillAsync）**：settle/cancel 释放槽后从 queued 选"依赖全满足 + 域无冲突"的最早条目启动到槽满。队列可混 waiting-deps + slot-queued——扫描最早可启动项（先入者优先）。
- **同文件串行序判定（防互等）**：域冲突阻断**只适用"先入者"**（id 数值比较——spawn 序递增）与 running；**后入者不阻断**——避免两个 queued 同文件互等死锁。running 永远阻断。
- **依赖终态释放**：依赖在目标 settle（任何终态）或条目移除时视为满足；**默认分支**——依赖取消/失败 → 依赖者留 queued 标 `dependency-cancelled` + 注入提醒供模型决策（仅父侧显式处置或 AUTO 档才自动启动——滞留有意、显式可清、不静默）。
- **dependsOn 成环** → spawn 拒绝（防御断言）；**unknown id** → 拒绝（明确错误）。
- **停滞机械检测（detectStall）**：池无 running 且 queued ≥1 且每 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内（阻塞闭包无外逃）且无 dep-cancelled 标记 → status 视图标记停滞 + 逐条阻塞链 + 引导 cancel 破环。保守不误报。
- **动态域读点（SCHEDULER-DYNAMIC-DOMAIN）**：describeBlockers / queueRunnable /
  detectStall 三处"他条目域"统一经 `effectiveFiles` 实时读（refill 在 queued start 前
  必经重扫——start 决策保护不依赖新事件）。waiting 文案区分命中来源：命中仅来自
  touched（∉ 声明域）→ `域冲突 <file>（运行中实际写入）`；纯声明命中（含声明∩touched
  重叠）文案不变。detectStall 因 running 锚点守卫动态域零增量（读法同界防御一致）。
  **边界**：running-vs-running 抢占不做（动态域只保护未来 start 决策——后续项）；中途写
  窗口（批提交延迟）接受。

### 10.3 排队面板 UX（waiting 标注）

任何排队 spawn（waiting-deps 或 slot-queued）在 spawn 返回时立即建面板块（`⟦ev⟧queued/cancelled` 事件 token——spawn 返回发 queued、出队/取消发 cancelled）——块头标注 `[▶ role#N · waiting] waiting for: …` / `queued · position N`；启动后转 running（`⟦ev⟧async` 清标 + started 归零——同 key 不重建）。面板存在条件 = running ∪ queued/waiting 非空。

### 10.4 files 父侧文件拦截（R26）

父侧维护文件（docs/TODO.md、CHANGELOG.md、checklist.md 及 checklist* 前缀）**不得列入 files 声明**（核销/记录义务归架构师）——黑名单机械校验：归一化后 basename 全名匹配 + 大小写不敏感（路径任意层）→ 声明含任一 → 拒绝 + 英文提示（fail-closed——校验先于调度器）。**设计文档（docs/design/*.md）仍可声明**（eng-coder 落 supersede/实现记录是常态）——不误伤。

**变更记录**：2026-09-03 任务调度器（§10 + prompts 调度器条款）；2026-09-04 目录声明拒绝（§10.1）+ 环形死锁修正（§10.2）+ 停滞检测；2026-09-07 files 父侧文件拦截（R26，§10.4）；2026-09-09 调度器动态文件域（SCHEDULER-DYNAMIC-DOMAIN——声明 ∪ running touched——§10.1/§10.2）+ files 纪律残留清（§10.1 对齐 §8.1 L443 A 裁定）。


## 11. 回合外事件后台化统一模型（分域池 + async advisor）

> R13（advisor async）+ R14（角色分池 + 可配置）合批（R15 排队用户指令合并已随 INPUT-LOCK-ASYNC 废弃——见 §11.3 废弃记录——2026-09-09）。**统一模型**：既有 async 池机制（pending 移交/run 首行注入/消化轮/冻结回收）角色无关——advisor/escalate/consult 复用同一套 pending/digest/注入/冻结消费机制。

### 11.1 角色分池 + 可配置（R14）

- **池容量**：`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`（默认——用户裁定"eng-coder 四路，其他 4 路"）；角色域 = role ∈ {eng-coder} → engCoder 池；其余（explore/plan/coder/sub）→ other 池（VS Code 按装配实况——未知角色归 other）。
- **运行中计数按域分别记**；队列补位按域腾槽。跨域总量 8、同域仍 4。
- **配置键**：单对象 `agent.poolLimits = { engCoder, other, advisor }`——subagent 两键运行期读 + 校验（正整数 ≥1，非法回退默认 4/4）；**advisor 第三键（POOL-CONFIG-UNIFIED 2026-09-09——三池统一默认 4/4/4）**由 §11.2 的独立读取器消费（合法 ≥1 整数生效——非法/缺省回退默认 4——与 subagent 域读取器独立不共享——键表语义不同）。变更下回合生效；入口 CLI /config + VS Code 设置面板。

### 11.2 async advisor（R13——独立后台评审池）

- **池形态**：独立 `_asyncAdvisors`（复用 pending/digest/注入/冻结机制；新 runner 包装 runAdvisorReview——不碰 subagent 管线）。容量默认 `ADVISOR_POOL_LIMIT = 4`（三池统一默认 4——POOL-CONFIG-UNIFIED F-1）——
  **可配 `agent.poolLimits.advisor`**（advisor-async 读取器每 launch 读 agent.config——合法 ≥1 整数生效、非法/缺省回退 4——拒文案报当前生效上限）——超限 → 返回错误文案（"另有一评审在跑——逐个发起"——评审间有依赖语义，排队无意义——②-6a 无排队语义不变）。

> 〔eng-designer 折行 2026-09-11 13:10：单行 338 字符 → 纯折行（批 14 候选 2；文字零增删、语义不变）〕
- **工具语义**：advisor 加 `async: true`；**缺省 async**（R12 depth-0 缺省口径）——仅 depth-0（depth>0 显式 async 拒 / 缺省恒同步）。发起返回 ack → 回合自然收尾 → 挂起态 → settle → digest。
- **同 scope 并发守卫（POOL-CONFIG-UNIFIED F-5——用户裁① 2026-09-09）**：launch 判定 = 两关独立——① 池容量（全局 running ≤ 生效上限）；② 同 scope（同 reviewType+scope 有 running 评审 → 拒——design scope = 文档集键 docSetKey——code = 单 code 线程 openCodeRun 语义——任一 running code 评审阻断新 code launch）。
  **settled 续跑语义不变**（round+1/prior 注入——resolve 只查 settled 的分歧由此消除——running 并行多实例歧义放大被拒）；拒文案含 scope 语义与指引（"此 scope 已有评审在跑——settle 后逐个发起"——去数字化）。

> 〔eng-designer 折行 2026-09-11 13:10：单行 391 字符 → 纯折行（批 14 候选 2；文字零增删、语义不变）〕
- **UI 通道**：subagent 面板 + role="advisor" 伪角色（块/⏹/冻结全复用；cancel = 定向 abort → cancelled settle：不入 pending、不入 token 槽、digest 提示"评审已取消——token 未签发"）。
- **settle 记账（token/guard/cap 改绑）**：评审 settle 时（消化链首行注入前）执行：
  - ①**陈旧判定**——评审 launch 后发生 FILE_MUTATORS → 评审基于旧状态 → 不置 `_calledAdvisorThisRun`、代码评审不签发 token（guard 仍推回发起新评审）；
  - ②通过 → token 入槽 `_engDesignTokens.set(designId, token)` + 当场同步落盘权威台账（D1——单值镜像已退役——DESIGN-TOKEN-SETTLEMENT.md D3/D5）；③`_advisorRound` 改按 review 实例记（`_advisorRuns`——cap 随实例 ≤5 轮）；④guard 推回判定看后台评审是否已 settle 且非陈旧。
- **收敛状态 per-review 化**：`_advisorRuns: Map<reviewId, {round, priorOutput, stale}>`——reviewId = designId（设计评审）/随机 id（code 复核）；多评审并行隔离。
- **消化处置轮**：报告注入 → 模型消化（呈递发现 + 修复建议——不擅自动手——手动档 digest 禁写域自洽）→ 用户逐项拍板 → 修正轮在 agent 回合内发起 round2（async 再启——round/prior 从 `_advisorRuns` 取）。
- **凭证机制（designId/token）**：设计锚/同步/回显/登记/消费/校验——权威见 ENGINEERING-MODE.md §2.6（2026-09-07 凭证机制完整设计；sync 语义同 scope 复审沿用同 id；VS round2+ 注入段对齐 CLI）。

### 11.3 排队用户指令合并（R15）——废弃记录（2026-09-09 INPUT-LOCK-ASYNC）

**机制**（2026-09-06——已实现后废弃）：pendingInput 消费改**攒批合并**：回合空闲时 pendingInput ≥2 → 合成一条注入（编号列出逐条，一次处理）。**边界**：单批 ≤8 条且合并注入 ≤2000 字符（常量双端同名）；超限 → 截批先行；单条 >2000 字符不进批逐条直发；**/cmd 类不进合并缓冲**（逐条保序即时）。

**废弃原因与去向**（INPUT-LOCK-ASYNC——用户裁 C'——2026-09-09）：主会话 busy（processing 含
 digest）输入禁用——**排队从源头根除**（digest 后置意图污染）——pendingInput 收敛单槽（至多
 一条待交接——挂起空闲 Enter 填槽 + 唤醒——driver 消费清槽单消息逐发）；`state.queue` 缩为残项
 单容器（释放窗口兜底/中止残余——零丢失保留）。双端删除面：CLI 攒批纯函数族 + 渲染 queue 面板/
 提示/Ctrl+D/"❯ You: (from queue)" 标签 + 提交排队分支；VSC 消费取数/合并文案/上限常量 + 路由
 入队 + 排队回执 UI 消息。双端单槽交接与中止残余兜底均有测试锁（CLI `test/input-lock.test.mjs`；
 VSC chat-panel/webview-turnstate 测试族更新）。

**变更记录**：2026-09-06 三合一合批（§11——分域池 + async advisor + 排队合并）大合验双端全绿；
  会诊/飞刀完全异步化（R17）→ §14；2026-09-07 凭证机制完整设计（ENGINEERING-MODE 同步）；
  2026-09-09 并发池统一可配置（POOL-CONFIG-UNIFIED——三键 4/4/4 + advisor 读取器 + 同 scope
  守卫 + 文案去数字化——§11.1/§11.2 更新）；2026-09-09 R15 整批废弃（INPUT-LOCK-ASYNC——busy
 禁排队——§11.3 改废弃记录——CLI/VSC 双端实现）。
 2026-09-09 busy 行为修订（INPUT-LOCK-BEHAVIOR-REVISED——评审通过——输入不禁只禁提交——斜杠白名单删——双端实现——见 docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md——已归档（DOC-REORG 批））。

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
- R3 裁定（挂债——如文件尺寸）→ 🟡/🔵 不升级（不重复纠结）
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

- **文档地图**（docs/README.md）：板块 → 文档文件映射 + 归属规则（一个板块一个文档、功能点并入所属板块、新板块才新建并登记、单一权威源）。
- **design 评审增强**：Review Criteria 第 7 维 Document ownership（与现有文档矛盾 → 🔴；该并入却新建/重复描述 → 🟡）+ 引用纪律（精确 file:line + unverified 标注）；design 提示词硬加载（缺失即抛错——防静默降级到劣质 prompt）。
- **代码变更都必须落文档（无"改动太小免文档"豁免）**：任何代码变更都在 docs/ 落文档（需求层 docs/requirements/、设计+测试层 docs/design/）——小改动并入所属板块现有文档（追加变更段/更新章节），新板块/机制建新文档（按文档地图命名）。**开发前先定位文档归属**（文档地图 → 所属板块文档——已有写变更段、无则新建并登记地图——然后才动手编码）——普通模式与工程模式同款纪律、无豁免。未落文档 = 文档漂移。
- **开工前计划确认纪律**：任何写文件/写文档动作前文字复述理解 + 计划要点等用户确认（无豁免——普通 + 工程都生效；子代理不适用——确认由父 agent 完成）。**question 工具抑制**见 §16。

### 12.4 byte-identical 取消（2026-09-04）——设计锚为准

CLI/VS Code `src/prompts/` 两端 **byte-identical 机械约束取消**（两端可各自演进——不再强制字节相同、不需同步脚本）。**替代 = 设计锚机制**：镜像锚文本在设计文档**逐字定稿**（权威源）——实现面照抄——差异暴露靠设计评审（Document ownership）+ 交付审计 + cross-repo-parity 语义锚（内容断言各端独立 fail-when-unchanged）。

byte-identical 相关机械比对断言/同步脚本全部清理；**内容断言（锚句存在）保留**。**保留的非镜像字节断言**：advisor-design.md 硬加载逐字节（防静默降级）、DeepSeek 前缀缓存字节断言（session-compaction/time-injection）、cross-repo-parity 语义锚。

**变更记录**：2026-08-21 文档归属纪律 + advisor design 评审增强（§12.3）+ 开工前确认（§12.3）；2026-09-03 代码变更都落文档 + 开发前落档；2026-09-04 评审对象锚（§12.1）+ 铁律固化（§12.2）+ advisor/coder/consult 人格锚（§7.6）+ byte-identical 取消（§12.4）。
## 13. 完整轨迹存档（traces）

> CLI-only（VS Code 同语义约定不实现——记 docs/TODO.md）。**机制**：每个模型调用（主 agent/子代理/advisor/compress/distill/consult/auto-think）的**完整轨迹**自动落盘 `~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl`——含发往模型的输入消息、模型输出、reasoning 全文、工具调用 args、usage——供事后逐轮分析"纠结/思路反复/决策分叉"。

- **采集点唯一**：`chat()` 导出（thincoder-core/provider/core.mjs——所有 chat 调用经本函数）出口收集——不在四个 transport 分别埋点（续写/重试会 `result.reasoning +=`，出口收集才完整）。
- **元数据**：ts/session（`_sessionStart`）/cwdHash/role/depth/turn/provider-model/kind/stage/**isContinuation**（续写/重试链标记）/messages/content/reasoning/toolCalls/usage/finishReason/error。日期分日按**本地日期**。
- **脱敏**：复用 log.mjs 黑名单（apikey/designtoken/password/secret/token/authorization/proxyuri/proxy）+ SECRET_FORM 形态扫描——落盘前遮蔽。
- **写盘**：fire-and-forget 异步（不 await——chat() 返回不被阻塞）；落盘失败静默吞错；seq = 当日目录 max+1（不覆写）。
- **默认 OFF**（2026-09-05 发布隐私——traces.enabled 默认 false；本机调试可显式开）；启动清理 `cleanupTraces` 删 mtime > `traces.retentionHours`（默认 24h）的 .jsonl + 空日期目录；config 经 /config 菜单 + config.json。

**变更记录**：2026-09-04 用户裁定全量轨迹存档（§13）；2026-09-05 默认 OFF + 启动清理（D-TR6/D-TR10）；2026-09-06 并入 R2（auto-think logCtx 全字段——开关闭环）。

**修订（TUI-OOM-ROOTCAUSE 批——2026-09-11——内容面；修正轮 #2）**：轨迹内容新增**额度截断**
（消息内容/推理/工具参数串 > `TRACE_MESSAGE_MAX_CHARS` 64K → 头 16K + 中段标记 + 尾 48K；单记录
> `TRACE_RECORD_MAX_CHARS` 4M → `messages` 降 stub——元数据保留、标记可断言）——上方「完整轨迹 /
reasoning 全文」表述按此限缩（**字段集不变**——F-O4）；写入代价形态（单遍序列化/在途上界/序号
缓存）与常量单源见 §23.3.2；`thincoder-core/traces/trace-store.mjs` 头注释同批同步（「大小不限/不截断」表述
作废——§23.5 登记）。

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
- **工程模式拒保持**（工程纪律层拒 escalate——普通模式工具——eng 模式走 eng-coder；旧 engineering.md 表述——施工③随迁 persona-engineering.md 分工界面节）。
- **消化指令语义**：escalate = "报告已 merge——可继续改进"——动作域仍按档（无"飞刀可写"例外）。

**变更记录**：2026-09-06 R17（用户"这两都得完全异步化"）——设计 §14——CLI 已实现 + VS 镜像。2026-09-08 §7.7.1——escalate 顶层一律异步（同步保留句移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）。

## 15. 操作纪律 / 工具使用（提示词层）

> 提示词纪律条款的**来源语义**——落点 = 14 文件槽位集合（persona-*×6/common/discipline-*×2/特殊×5——2026-09-10 PROMPT-SYSTEM 施工①③起；旧 system.md/engineering.md/discipline.md/main.md 已退役，历史批次叙述按写作时点保留）。此处不复制提示词全文，只列本文件关联的操作纪律骨架 + 逐字锚归属。

- **操作并行化**：Parallelize aggressively——独立信息获取一次发多个；多文件编辑用 edits 数组；独立子任务一次 spawn 多个（含跨独立子项目拆分——share no files / no cross-dependencies / each has its own tests）；**Do NOT parallelize**：写同一文件（**声明 files 的 async spawn 例外——调度器自动排队**）、依赖链、bash/审批敏感命令（审批风暴）、同一 git 仓库并发 git、有状态操作；并行大操作、跳过微操作。
- **批量形态引导**（§4.3）：edits 数组原子多文件 / apply_patch 新建多文件——描述层引导。
- **委托标准**（纪律层委派节——旧 main.md F-N1.6 登记名）：委托 = 改动面 ≥2 文件 或 单文件逻辑改动 >30 行 或 涉模块边界/导入面；内联 = 单文件 ≤30 行 或 纯文档/提示词同步 或 探索性。任务书标准结构（目标/已知事实/设计要点+禁止/约束/验收硬/交付报告表/调度元数据）——"Sized delegation without these fields is a defect"。
- **委托规模默认走 coder 子代理**（执行/检查分离——避免自查盲区）——"implemented by a coder subagent BY DEFAULT"/"spawn async with the design as the task book"。
- **长测试输出先落盘再查**：全量/长测试（≥60s）先重定向日志文件再查（`node --test … > log 2>&1`）——汇总从日志尾读、失败详情 grep——不用过滤管道直接跑长命令（过滤丢失败详情 + 管道缓冲截断）。日志放非工作区（OS 临时/~/.thincoder/）查毕删除。
- **Module Split Policy**：大文件拆分标准方法——①**write-first**（先整段写入目标文件再删源——任何时刻有副本）②段零改动（只修 import）③接线 ④node --check + 相关测试 + 全量绿 + **test/assertion 计数前后一致**（孤儿体/断引用显性暴露；断言静默丢弃 = 拆分缺陷）+ **同一任务内完成**（不拆两批中间态）。
- **edit 工具纪律**（discipline-normal.md Edit & write discipline 节——旧 main.md 扩展注登记名）：old_string/行号/hash 只来自最新 read（never reconstruct from memory）；hashline old_hashes 只来自 read(hashes=true)；报错即修法——第二次同形失败 = 重读文件——never retry the identical input a third time。

**变更记录**：2026-08-21 开工前确认/文档归属；2026-08-23 委托策略；2026-09-01 操作并行化；2026-09-03 代码变更都落文档；2026-09-04 Module Split Policy + 审计范围引导；2026-09-05 委托操作标准/执行检查分离/edit 纪律；2026-09-06 长测试输出落盘。

> 需求层已迁出（2026-09-10 需求层拆分批）：question 工具抑制需求见 `../requirements/AGENT-LOOP.md` §1。

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

## 18. 后台评审池可观测/可控（第 10 批——2026-09-11 设计）

> 需求：`../requirements/AGENT-LOOP.md` §4（F-B1~F-B4 + NFR-B1/B2）。
> 批次：`../batches/2026-09-11-VSC-ASYNC-VISIBILITY.md`（§1 条目 B——平台机制缺陷已实证三次）。
> 机制地基：§11.2 async advisor（独立池 `_asyncAdvisors`）+ §7.2 单工具动作面（status/cancel/observe/send）；
> 本节只写**接入面补全**，不改池本体语义（容量/scope 守卫/cancel 的 token 语义均从 §11.2）。
> VSC 镜像：`AGENT-LOOP（VSC 仓）§9`（同一机制本端实现面）。

### 18.1 问题陈述（现场复核——三条缺陷的**双端分布**）

用户实证（2026-09-09；2026-09-11 并入第 10 批）。现场复核结论（as-of 2026-09-11，逐条给证据）：

| # | 缺陷 | CLI 端 | VSC 端 |
|---|---|---|---|
| ① | `subagent status` 查不到后台评审 | **已具备**（2026-09-08） | **缺失** |
| ② | `wait_for \"advisor settled\"` 误报（0ms 即过但池仍拒重发） | **缺陷在** | **缺陷在** |
| ③ | 评审无 cancel 通道 | **已具备** | **部分缺失**（面板 ⏹ 有 / 工具动作缺） |
| ④ | 动作面指引（observe/send 遇 advisor id） | 已有 | **缺失** |

**逐条现场证据**：

- **①** CLI `src/agent-tools/subagent-actions.mjs:98` `:109` `:145`（双池合并——单查 fall-through + 概览并表）；
  VSC `src/agent-tools/subagent-actions.mjs:89-120`（只 `getAsyncPool(ctx.agent, \"subagent\")`）。
- **②** 两端同形：判据读**子代理池**里的 role===\"advisor\" 条目——CLI `thincoder-core/tools/ops.mjs:223-227`、
  VSC `src/tools/wait_for.mjs:125`（VSC 仓；至 129 行）（均经 `hasRunningAsync` → `asyncPool` = `_asyncSubagents`）；
  而评审条目在 `_asyncAdvisors`（§11.2）——该池里永无 role=\"advisor\" 条目 → `!hasRunning` 恒 true → **0ms 秒过**。
- **③** CLI：`thincoder-core/agent-tools/advisor-async.mjs:247` `cancelAsyncAdvisor` + `src/agent-tools/subagent-async.mjs:249-250`
  （id 不在子代理池 → 落 advisor 池）+ TUI `src/tui/mouse.mjs:207`；VSC：`src/extension/panel-messages.mjs:238`（VSC 仓；至 241 行）
  （面板 ⏹ 路由已有）+ `thincoder-core/agent-tools/advisor-async.mjs:414` `cancelAdvisorReview`，但 `subagent cancel`
  工具动作无 advisor 落点（`src/agent-tools/subagent-actions.mjs:211-216` 只查子代理池）→ **模型无法取消**。
- **④** CLI `src/agent-tools/subagent-actions.mjs:235-236`（observe 遇 advisor id → 明确指引）；VSC 无此分支 → 回含糊 \"unknown async subagent id\"。

**同源判定（对照批次 §1 的"可能同源"）**：与**条目 A 不同源**——B 的缺陷面在 **agent-tools/tools 层的池访问器只读子代理池**（一个池忘了接入第二个池的消费点），
A 的缺陷面在 **webview 块身份/投递链**。共性是"第二池接入面遗漏"这一**系统模式**（非同一根因）：证据 = B 的修复点全是
`getAsyncPool(...,"advisor")` 类接入点，与 A 的 `ensureBlock`/`postMessage` 无交集。

### 18.2 方案选型对比（子条目①的接入形态——判据来自需求 §4.2）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **并入 `subagent status`**（双池并表；advisor 条目带 role="advisor" + reviewType/round/elapsed） | 满足 F-B1 ✓；零新工具（工具面不膨胀）✓；与 CLI 已交付形态一致（**双端同源** = NFR-B1）✓；模型可见性靠工具描述一句 ✓；与 §7.2 七动作面零冲突 ✓ | 代价：`subagent` 语义扩到评审（文档/描述必须写清）；返回字段须区分评审专属字段 | **选定** |
| 2 | 新开 `advisor status` 工具/动作 | 语义最清楚；但**新增动作面**（§7.2 七动作 → 八）+ 模型需学新入口 + 与 CLI 已落地形态分叉（双端两说）——否决 | — | 否决（工具面膨胀 + 双端分叉） |
| 3 | 只做面板展示（live 块），不给模型查询面 | 仅需面板侧改动；但**模型侧的"死等"问题不解**（用户原话：不可知 → digest 是唯一信号）——否决 | — | 否决（解不了实证问题） |

子条目②（`wait_for` 口径）：判据改造**单方案**（既有条件字面不变，只把判据源从子代理池换到评审池）——显式声名单方案无对比；
否决备选 = 新增条件字面（`advisor id:N done` 等：需求 §4.2 边界明列不做）。
子条目③（cancel）：VSC 端**单方案**——按 CLI 已交付行为对齐（advisor id 落点 + 同语义取消），无对比空间。

### 18.3 契约（状态通道 / 等待口径 / 取消路由 / 指引）

1. **状态通道**（双端同语义）：`subagent status` 读**两池并集**——子代理池 `getAsyncPool(agent,"subagent")` + 评审池
   `getAsyncPool(agent,"advisor")`（两端 accessor 均已带 history 载体吸收——§11.2/async-settle D1）。
   单查（带 id）：先子代理池，未命中落评审池（两池共用 `nextSubagentId` 命名空间——id 全局唯一）；
   概览：`running` 行含 `role` / `model` / `elapsedSec` / `turn`/`maxTurns`（子代理）或 `reviewType`(design|code) /
   `round` / `elapsedSec`（评审）；`done` 行带"已 settle 未消化"注记（走自动送达通道）。
   未命中两池 → 既有错误文案不变（`:unknown async subagent id:`——既有测试锁定，不改）。
2. **等待口径**（双端）：`advisor settled` 判据 = **评审池无 running/queued 条目**（双载体：`agent._asyncAdvisors` ∪
   `history._asyncAdvisors`）——与 §11.2 的"未决评审判定"**同源**（CLI `advisorReviewPending` / VSC
   `advisorReviewInFlight`——若某端 helper 只查单载体，则本批改为双载体并补用例）。条件字面/超时/间隔语义零变。
3. **取消路由**（双端）：`subagent cancel <id>` 在子代理池未命中时**落评审池**：命中 running 评审 →
   `entry.cancelled = true` + `controller.abort()`（VSC 已有 `cancelAdvisorReview`——直接复用；CLI 复用
   `cancelAsyncAdvisor`）+ 机读线提醒（"评审已取消——token 未签发"）+ 幂等（重复取消返回同一确认）；
   未命中两池/已完成 → 既有错误文案。**取消语义从 §11.2**（不入 pending、不入 token 槽）。
4. **动作面指引**：`observe`/`send` 遇 advisor id → 明确指引（对齐 CLI 已有文案语义：指向 `action:'status'`
   或提醒结果自动送达）；两行动作**不为 advisor 开新能力**（需求 §4.2 边界）。
5. **工具描述**：`subagent` 工具描述 status/cancel 句补"后台评审（advisor）同面可查/可取消"——两端各自原文自持（语义同源）。

### 18.4 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-B1 | ① 并入 `subagent status`（不新开工具） | 双端同源优先于"入口更清"；否决新工具/新动作（见 18.2） |
| D-B2 | ② 只改判据源，不动条件字面 | 条件字面已被提示词层引用（`docs/design/prompts/discipline-*.md` 工具表）——加字面会连带提示词面；否决新增字面 |
| D-B3 | ③ VSC 端复用本端 `cancelAdvisorReview`（不引入 CLI 的 `cancelAsyncAdvisor` 名） | 各端独立实现、语义同源（原文自持）——两命名差异登记于此，不做跨仓统一改名 |
| D-B4 | ④ 指引文案两端各自原文（语义同源） | 文案字节一致非目标（多实现面纪律）；行为机判一致为目标 |
| D-B5 | ① 的 done 行注记保留（不把已 settle 未消化当 running） | 防"假活"——输出必须与自动送达通道自洽 |

### 18.5 受影响文件全清单（双端分列——行数口径 = `wc -l`；as-of 2026-09-11）

**CLI 端**

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `thincoder-core/tools/ops.mjs` | 286 | +14 | ② `advisor` 分支改读评审池（双载体判据）+ 条件说明行同步（工具描述） |
| `src/agent-tools/subagent.mjs` | 402 | +4 | ⑤ 工具描述 status/cancel 句补评审面 |
| `src/agent-tools/subagent-actions.mjs` | 479 | ±3 | ①③ 已具备（行数 2026-09-11 实测刷新——修正轮 #12；若实现中发现口径缺口 ≤+10） |
| `test/subagent-observe-send.test.mjs` | 200 | +45 | ①③④ CLI 端 advisor 池用例（单查/概览/取消/指引） |
| `test/wait-for-advisor-pool.test.mjs`（新） | 0 | +60 | ② 口径用例（红→绿：起池 running → 条件为假；池空 → 真） |
| `docs/design/TOOLS.md` | 124 | +3 | §7 wait_for 条款口径同步（`advisor settled` = 评审池真实态） |
| `docs/design/AGENT-LOOP.md` | 724（批次前）→ 862（本批落档后） | +~138（见行数差） | 本节（§18） |

**VSC 端**

| 文件 | 现行行数 | 预计增量 | 改动 |
|---|---|---|---|
| `src/agent-tools/subagent-actions.mjs` | 337 | +55 | ① 双池合并（单查 fall-through + 概览并表 + 评审专属字段）；③ cancel advisor 落点；④ observe/send 指引 |
| `src/agent-tools/subagent.mjs` | 380 | +4 | ⑤ 工具描述同步 |
| `src/tools/wait_for.mjs`（VSC 仓） | 195 | +10 | ② 判据改读评审池（复用 `advisorReviewInFlight`——双载体已具备） |
| `test/subagent-observe-send.test.mjs` | 167 | +45 | ①③④ 用例（VSC 现状盲区） |
| `test/wait-for-advisor-pool.test.mjs`（新） | 0 | +60 | ② 用例（双端同构） |
| `test/files.mjs`（VSC 仓） | 49 | +1 | 新测试文件登记（接线硬项） |
| `docs/design/AGENT-LOOP.md`（VSC） | 506 | +14 | §9 mirror 注（本批三面 + 命名差异登记 D-B3） |
| 合计（双端） | — | ~+440（代码面 ~+90） | 14 项 = 12 改 + 2 增（CLI 7 + VSC 7） |

### 18.6 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 预期输出（可机判） | 需求回指 |
|---|---|---|---|---|
| T-B1 | 概览双池并表 | 子代理池 1 running + 评委池 1 running | `overview.running` 含 2 条，评审条目带 `role:"advisor"` + `reviewType`/`round` | F-B1 |
| T-B2 | 单查（advisor id） | `status {id: <advisor 条目 id>}` | 返回该评审条目（含 elapsedSec/round）；不报 unknown | F-B1 |
| T-B3 | done 行注记 | 池内 `done:true` 评审（未消化） | `status:"done"` + note（自动送达）；不计入 running | F-B1/D-B5 |
| T-B4 | 等待口径（红→绿） | 池内 1 running 评审 → 池空（settle） | `evaluateWaitForCondition("advisor settled")` 先 false 后 true（修前恒 true） | F-B2 |
| T-B5 | 等待口径边界 | 池内 `done:true` 未消化评审 | 判为 settled（true）——不阻塞 | F-B2 |
| T-B6 | 定向取消 | `cancel {id:<running 评审>}` | `{id,status:"cancelled"}` + controller.abort 已调 + 机读线提醒；重复调用幂等 | F-B3 |
| T-B7 | 取消错误行 | ① 已完成评审 ② 两池皆无 id ③ 无 id | ① `already finished` ② 既有 unknown 文案 ③ 既有 requires-id 文案 | F-B3 边界 |
| T-B8 | 动作面指引 | `observe {id:<advisor id>}` / `send {id:<advisor id>}` | 明确指引文案（含 `action:'status'` 指向）；**不**报 unknown | F-B4 |

### 18.7 验收标准（逐条回指需求——每条可机器验证）

- **AC-B1**（F-B1）= T-B1/T-B2/T-B3：双端 `subagent status` 概览含评审条目、单查命中评审池、done 注记在位（两端用例各一组）。
- **AC-B2**（F-B2）= T-B4/T-B5：`evaluateWaitForCondition("advisor settled", ctx)` 在"池有 running"时 false、池空/仅 done 时 true（两端各一组）。
- **AC-B3**（F-B3）= T-B6/T-B7：cancel 落评审池并中止 controller；错误行文案与既有语义一致。
- **AC-B4**（F-B4）= T-B8：observe/send 遇 advisor id 返回指引（grep 断言关键字 + 用例断言 `status:"error"` 不带 "unknown"）。
- **AC-B5**（NFR-B1）= 双端同输入同判定（用例表 T-B1..T-B8 两端各跑一组；差异仅文案/命名，登记于 D-B3）。
- **AC-B6**（NFR-B2）= CLI `npm test` 全量绿 + VSC `test/run-fast.mjs` 全绿（含既有 subagent/async-settle/ops 族）。
- **AC-B7**（文档面）= 本节 + TOOLS.md 口径行 + VSC §9 mirror 注在位；`node scripts/check-doc-width.mjs` 新增超宽 0。

### 18.8 边界与冲突点核对

- **本批不做**：池容量/scope 守卫/评审排队语义（§11.2 原样）；评审收敛机制（`ADVISOR-CONVERGENCE.md` 第 9 批链在飞——
  **D5 冻结/零碰**）；面板 live 块的出生链（属条目 A——VSC 仓 `docs/design/WEBVIEW.md（VSC 仓）` §5.1）；admitted 新条件字面。
- **冲突点核对**：① 与 §7.2 七动作面——零新增动作（并入 status/cancel）✓；② 与 §11.2——只补接入面，不动池语义 ✓；
  ③ 与 `REMOVE-POOL-SNAPSHOT`——零关系（评审池从不参与池快照，撤除面是 queued 行）✓；
  ④ 与第 9 批 `ADVISOR-CONVERGENCE.md`——只在"取消"上共用机制（本批不碰该档，实施时如发现需改该档 → **停下报告**）。
- **父侧登记项**（非本设计写域）：CLI `docs/README.md` 地图无需改（§18 属既有档内新节）；批后核销按 D7 清单走。

## 19. 普通模式偏差审计 + 会话上下文轮——评估与收口（第 23 批——2026-09-11）

> 需求：`../requirements/NORMAL-MODE.md` §6（F-N1.1–F-N1.6——本批自旧 §21 条目迁入）·
> `../requirements/ADVISOR-CONVERGENCE.md` §11（会话上下文轮退役）。
> 批次：`../batches/2026-09-11-NORMAL-MODE-AUDIT.md` §1（D1/D2——2026-09-08 用户裁「恢复」的评估项；2026-09-11 用户裁「开」）。
> 缓行条件（「等 §11.3 / 批 5 / 批 6」）已闭合：§11.3 已交付（现为废弃记录——§11.3）；批 5/6 收口入档（`_archive/STRUCTURE-DEBT-BATCH-5-6.md`）。
> 与两个旧设计面（旧 §21 / 旧 §18.8.1）的关系 = **执行 + 补指针 / 修订（退役）**——见 §19.4。

### 19.1 评估结论（做 / 不做 / 何时做）

**D1（普通模式偏差审计）**——三段结论：

- **原义审计 = 已做**：F-N1.1..6 已实落为提示词条款（`src/prompts/discipline-normal.md` :13 / :15-17 / :92 / :125-133 / :147-150）；
  设计判据「零额外 LLM」保持（审计 = 既有交付核对的一部分，不新增步骤）。此项无需再做。
- **常态化独立审计机制 = 不做**（机械论证）：① 与 N-N1（零额外 LLM）冲突——独立审计 = 新步骤 / 新 spawn；
  ② 数据源无着——「实况审计」需轨迹 / 会话数据，而轨迹默认关（`src/config.mjs:108`——2026-09-05 用户裁定发布隐私）；
  ③ 与 F-N1.1..6 语义重复。三项并列机械论证，任一成立即否决。
- **一次性收口 = 做（本批）**：审计发现五条偏差 + 一条登记（§19.3）——按完整修复路径收口（文档面本批落；断言面与指针面随本批实施）。

**D2（会话上下文轮）**——两段结论：

- **原设计 = 退役（不做）**（机械论证）：① 从未实现——git 全历史无 `advisor-context.md`（新增过滤检索零命中）、
  轮序 / cap 5→6 无实现提交；② 问题域（评审可评估「真需求覆盖」）已由四个现行机制承接（§19.5 第 5 条）；
  ③ 设计要素与后裁定冲突——cap 5→6 已被 design 评审 cap 豁免（2026-09-07）取代、新轮序与现行三轮语义
  （`ADVISOR-CONVERGENCE.md` §2.1）冲突、会话考古例外与四模板 Neutrality 锚冲突；④ 实施成本（新提示词 + 轮序机改 + 双端 + 断言）对比零增量收益。
- **文档修正 = 做（本批）**：§7.6 行 433 的「现行态」表述与实现及 `ADVISOR-CONVERGENCE.md` §2.1/§3 矛盾（文档漂移）→ 退役记录（§19.5 第 5 条）。

### 19.2 方案选型对比（D1/D2 各三候选——判据 = 批次 §1 五问 + 纪律层约束）

**D1：**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 常态化独立审计机制（新步骤 / 审计器 spawn） | 覆盖最全 ✓；与 N-N1 冲突 ✗；轨迹默认关 → 无数据源 ✗；与 F-N1.1..6 语义重复 ✗ | — | 否决（三项判据不过） |
| 2 | **一次性收口（条目迁址 + 断言恢复 + 指针修复 + 状态行收口）** | 覆盖全部实发现偏差（§19.3）✓；零行为面改动 ✓；零额外 LLM ✓；成本 = 1 新测试档 + 提示词指针 4 处 + 文档面 | 代价：不获得「持续发现新偏差」能力（断言只锁已知条款）——接受（实况考古不做，§19.10） | **选定** |
| 3 | 全不做（搁置） | 零成本 ✓；五条偏差原样留存（条目失所 / 断言失锁 / 指针悬空）✗ = 文档漂移不处置 | — | 否决（违反偏差处置纪律） |

**D2：**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 按原设计实现（新第一轮 + `advisor-context.md` + cap 6） | 问题域真 ✓；与现行轮序语义 / cap 豁免 / Neutrality 锚冲突 ✗；双端实施成本 ✗；增量收益 ≈ 0（四机制已承接）✗ | — | 否决 |
| 2 | **退役原型 + 文档修正（行 433 → 退役记录）** | 文档与实现恢复一致 ✓；零代码改动 ✓；承接机制有据（file:line）✓ | 代价：放弃「专用上下文轮」形态——接受（轻量机制已足） | **选定** |
| 3 | 增强现行机制（如扩会话背景轮数） | 改提示词语义——超本批边界（§19.10）✗；收益未证明 ✗ | — | 否决（超边界） |

### 19.3 审计面与判据（D1——本批执行的偏差面清单）

| 面 | 审什么 | 判据 | 结果 |
|---|---|---|---|
| ① 需求条目面 | F-N1.1..6 定义是否有现行承载 | 指针纪律（ID 可寻址） | **F-1**：条目定义随旧 §21 重写失所（现档仅存 ID 引用）→ 迁入需求档 §6 |
| ② 实现条款面 | 提示词条款 vs 需求条目 | 三向一致 | 在位（§19.1 D1 证据）——clean |
| ③ 机械锁面 | F-N1 条款是否有断言锁 | 测试纪律（fail-when-unchanged） | **F-2**：零断言（`test/` 无 F-N1 锚；原 T-N1.x 随 2026-09-07 测试清空删除、未恢复）→ 新增锁 |
| ④ 指针 / 未决面 | 活引用可解析 + 未决行诚实 | 指针纪律 + 状态行纪律 | **F-3**：提示词「§21」悬空 ×4；**F-4**：未决行「实施细节待批」悬挂（内容已由 F-N1.5/1.6 实落） |
| ⑤ 文本一致面 | 条款叙述的文件名单 vs 现行提示词层 | 实现即事实 | **F-5**：§8.1 条款文件名单过期（`main.md/coder.md/discipline.md` → 现行 `persona-normal/common/discipline-normal`） |

**登记项（F-6——本批不修）**：F-N1.2 的 coder 侧自查行（旧 `coder.md`）现无独立条款——其透明度效力由交付表
（`common.md` 交付报告节）+ 主代理侧核验条款承接（COMMON-LAYER 迁移在案）；是否恢复 coder 侧行 = 提示词语义面，另行批次评估。

**计数（D3）**：发现 = 收口 5（F-1–F-5）+ 登记 1（F-6）。

### 19.4 与旧 §21 / 旧 §18.8.1 既有文本的关系

- **旧 §21（设计档旧编号——重写后落 §8.1）= 执行 + 补指针**：机制本体（F-N1.1..6）已实落于提示词条款，本批不改语义；
  补指针 = 条目迁入 `../requirements/NORMAL-MODE.md` §6（可寻址）+ §8.1 文本同步（F-5）。
- **旧 §18.8.1（= §7.6 行 433 文本）= 修订（退役）**：历史事实保留（2026-09-04 设计过、评审未发起、未实现），
  「现行态」表述替换为退役记录 + 承接机制指针（§19.5 第 5 条）。

### 19.5 契约（收口落点——逐字 / 指针）

1. **需求条目**：`../requirements/NORMAL-MODE.md` §6 = F-N1.1 / N-N1 / F-N1.2 / F-N1.3 / F-N1.4 / F-N1.5 / F-N1.6（判定句逐条）。
2. **提示词指针修复（CLI 两档——删除「§21 」前缀；内容权 = 主 agent）**：
   `src/prompts/discipline-normal.md:125`（`（§21 F-N1.5 2026-09-05 ruling）` → `（F-N1.5 2026-09-05 ruling）`）、
   同档 `:133`（F-N1.6 同款）；`docs/design/prompts/discipline-normal.md:128` / `:136`（中文「裁定」同款）。
3. **断言锁**：`test/prompts-normal-audit.test.mjs`（新增——用例表 §19.8；**已并入 `test/prompts-dual-source.test.mjs`**——2026-09-11 TEST-LIFECYCLE；删除记录 = `TESTING.md` §7.2）。
4. **状态行收口**：「未决 / 待办状态行」条目「普通模式偏差审计范围」改述为收口条目（指向需求档 §6 + 本节）。
5. **D2 退役记录（§7.6 行 433 替换——逐字；落文允许追加指针句）**：

   > **会话上下文轮（旧 §18.8.1——2026-09-04 设计）——已退役（第 23 批评估 2026-09-11）**：该设计（新第一轮 + `advisor-context.md` + cap 6）
   > 从未实现；其问题域（评审可评估「真需求覆盖」）现由四个机制承接：① 会话背景注入（`thincoder-core/advisor/messages.mjs`——最近 3 组交流，机械提取）；
   > ② 需求文档主参照（Project Guide 指向——评审工作流第 2 步必读）；③ 设计评审批次档绑定（`batchDoc`——`ENGINEERING-MODE.md` §2.20.3）；
   > ④ 评审对象声明（§12.1）。round2+ 无会话考古、四模板 Neutrality 锚不变。评估与证据见 §19。

对拍口径（修正轮注）：契约块正文逐字；落文**允许追加指针句**——现行落文与契约一致（含收尾句「评估与证据见 §19。」）；对拍遇仅指针句差异不判偏离。

### 19.6 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-23-1 | D1 = 一次性收口（不建常态化机制） | §19.1/§19.2——零额外 LLM 判据 + 数据源无着；否决候选 1/3 |
| D-23-2 | F-N1.1..6 条目**原 ID 迁入**需求档（不重编号） | 既有引用（提示词 / 设计档）按 ID 即可解析——迁址即指针修复；重编号（F11+）会再制造一轮引用漂移——否决 |
| D-23-3 | D2 = 退役原型设计（不实施） | §19.1/§19.2——未实现 + 四机制承接 + 与后裁定冲突；否决「按原设计实现」与「增强现行机制」 |
| D-23-4 | 指针修复取「删前缀」而非「改指新节」 | §8.1 不承载 F-N1.5/1.6 全文（条目本体在需求档 §6）——改指会再造半个悬空；ID 自身可解析即达标 |
| D-23-5 | 断言锁 = 新档（不改在途测试档） | COMMON-LAYER 批在改 `prompts-async-guidance` / `prompts-dual-source`（在途）——新档零冲突（§19.7） |

### 19.7 受影响文件全清单（行数口径 = 行计数；as-of 2026-09-11）

> 口径（修正轮注）：列 2「变更前 / 变更后」——文档域 = 本批变更前 / 落笔后实测（as-of 2026-09-11；他批后续增量不计入本表）；实施域 = 现行 / 预计。列 4 增量标注实测 / 预计。

**文档域（eng-designer 写域——本批已落）**

| 文件 | 变更前 / 变更后 | 变更 | 增量（实测 / 预计） |
|---|---|---|---|
| `docs/requirements/NORMAL-MODE.md` | 62 → 86 | §6 新增（F-N1 条目 + 判定句）+ 抬头设计指针更新 | +24（实测） |
| `docs/requirements/ADVISOR-CONVERGENCE.md` | 280 → 294 | §11 新增（会话上下文轮退役登记） | +14（实测） |
| `docs/design/AGENT-LOOP.md` | 873 → 1024 | §19 新增 + 状态行条目收口 + §7.6 行 433 退役 + §8.1 文本修正 + 变更记录 | +151（实测） |
| `docs/TODO.md` | 173 → 173 | 行 135 状态推进（台账） | ±0（行替换） |

**实施域（eng-coder 写域——本批批准后）**

| 文件 | 变更前 / 变更后 | 变更 | 增量（实测 / 预计） |
|---|---|---|---|
| `test/prompts-normal-audit.test.mjs` | — → ~100 | **新增**（T-NA3/T-NA4 在役；T-NA1/T-NA2 已退场——整删，删除记录 = `TESTING.md` §11.3） | ~100（预计） |
| `src/prompts/discipline-normal.md` | 180 → 180 | 指针修复 2 处（§19.5 第 2 条——内容权主 agent） | 0（行内微调） |
| `docs/design/prompts/discipline-normal.md` | 183 → 183 | 指针修复 2 处 | 0（行内微调） |

**父侧面（非本批写域——登记）**：`CHANGELOG.md`；`docs/README.md` 地图零改（无新档）；VSC 端零面
（会话上下文轮 VSC 侧无落档；VSC 提示词无 F-N1 引用——登记）。

### 19.8 用例表（T-NA——正常 / 边界 / 错误）

| # | 类别 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-NA1 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | D1 / F-1·F-2 |
| T-NA2 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | D1 / F-1·F-2 |
| T-NA3 | 边界（反例） | 两档全文件扫描 | 悬空指针零残留：不含 `§21`（修复后 fail-when-unchanged——修复前应红） | D1 / F-3 |
| T-NA4 | 错误（回归） | 既有 prompts 测试族 | 全绿（零破坏——本批不动其它锚句） | D1·D2 边界 |

### 19.9 验收标准（AC-NA——逐条回指 D1/D2）

- **AC-NA1**（D1 / F-1）= `../requirements/NORMAL-MODE.md` §6 在位：F-N1.1–F-N1.6 六个 ID + N-N1 全命中（grep 断言）；抬头指针指向本节（§19）。
- **AC-NA2**（D1 / F-2）= 判据面退场（T-NA1 / T-NA2 均整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）。
- **AC-NA3**（D1 / F-3）= T-NA3 绿（两档含 `§21` 命中数 = 0）。
- **AC-NA4**（D1 / F-4）= 状态行条目改述在位（grep：该条含「第 23 批」与需求档 §6 指向；「实施细节待批」**不作未决主张**出现——机判口径 = 「未决 / 待办状态行」节内凡命中该串的行须同行含「不成立」（引用性历史否定留痕，as-of `:13`；未否定形态零命中））。
- **AC-NA5**（D2）= §19 在位 + §7.6 行 433 退役记录在位（grep：含「已退役（第 23 批评估」+「四个机制承接」；`advisor-context.md` 不再被述为现行机制）。
- **AC-NA6**（纪律面）= 本批触碰文件零新增违规（`node scripts/check-doc-width.mjs`——宽度 + V1/V2/V3；仓库内他批在途文件的存量违规不在本批判据内）；T-NA4 绿（既有 prompts 测试零干扰）。
- **AC-NA7**（D2）= `../requirements/ADVISOR-CONVERGENCE.md` §11 在位（退役登记 + 判定句 + 边界）。
- **AC-NA8**（D1 / F-5）= §8.1 条款文件名单同步在位（grep：§8.1 节内含逐字句「现行提示词 `persona-normal` / `common` / `discipline-normal`」；旧名单串 `main.md` / `coder.md` / `discipline.md` 在该节零命中）。

### 19.10 边界（本批不做）与登记项

- 不做常态化审计机制 / 实况考古审计（§19.1 D1）；不实现会话上下文轮（退役）；
- 不改提示词语义（除 §19.5 第 2 条指针前缀删除——非语义）；不改任何运行时代码（本批零 `src/**.mjs` 改动）；
- 不碰他链在途档（`ADVISOR-CONVERGENCE.md` 设计档 §16 第 25 批在途 / COMMON-LAYER 批在途 / 第 14 批折行在途——零碰）；
- VSC 端零面（登记）；F-6（coder 侧自查行）另行批评估（登记）；
- 同族指针债登记：提示词镜像 `docs/design/prompts/discipline-normal.md` 另存悬空的 AGENT-LOOP §25 引用（V1 基线在案）——随提示词批清理；
- `test/fixtures/doc-consistency-baseline.json` 零改（本批不新增 V1/V2 违规、不修基线项）。

**变更记录**：2026-09-11 第 23 批——普通模式偏差审计评估 + 会话上下文轮退役（新增本节；状态行条目收口；§8.1 / §7.6 文本同步）；同日评审后修正轮（6 条）——AC-NA4 机判口径改「引用性否定 vs 未决主张」、AC-NA5 收窄 D2、新增 AC-NA8（F-5 独立机判）、🔵#3–#5 修正 3 处、#6 复核保持。

## 20. 子代理 abort 来源标注（可诊断性）（第 24 批——2026-09-11）

> 需求：`../requirements/AGENT-LOOP.md` §6（F-D1.1–F-D1.4——判定句）。
> 批次：`../batches/2026-09-11-ABORT-PROVENANCE.md` §1（用户反馈已实证两次——用户 2026-09-11 裁「本仓接管」）。
> 相关设计面：§2.1（中断语义——reason 词汇表就地扩展，见 §20.3）· `ASYNC-RESULT-CONTAINER.md`（settle 共享 helper——报告合成点所在）·
> `PROVIDER.md` §3（重试、超时与错误分类——产生点所在）· `LOGGING.md`（`llm:error` 事件面——§20.3 第 3 条触面）。

### 20.1 问题陈述（现场复核——file:line as-of 2026-09-11）

**F-AP1（产生点无来源）**：abort 错误在产生点只有通用文案——「哪一层、何触发」零标注。产生点全景：
`thincoder-core/provider/core.mjs:27-31`（`abortDOM`——退避 / 限流等待）· `thincoder-core/provider/sse.mjs:185-189`（读循环）·
`thincoder-core/provider/anthropic.mjs:80` 与 `:187-190` · `thincoder-core/provider/google.mjs:107` 与 `:210-213` ·
`thincoder-core/provider/rate.mjs:89`（`"Aborted"`——连 `signal.reason` 都未拷贝）· `thincoder-core/proxy.mjs:55-59`（`abortError` 单点）·
`src/agent.mjs:293`（`"User interrupted"`）与 `:325` · `src/agent-tools/subagent.mjs:290` 与 `:295`。

**F-AP2（链式传播丢 reason——关键丢失点）**：子代理 / 评审 / 会诊 controller 链到基信号的**5 处 hop 全部以裸 `abort()` 转发**——
reason 在该点丢失：`src/agent-tools/subagent-run.mjs:101-103` · `src/agent-tools/subagent.mjs:67-69`（sync 装配 `armSyncChildAbort`）·
`thincoder-core/agent-tools/escalate-async.mjs:177-178` · `thincoder-core/agent-tools/advisor-async.mjs:285-286` · `thincoder-core/agent-tools/consult.mjs:418-419`。
实测（Node 24.19.0 / undici 7.29.0）：裸 abort 下 fetch 拒绝 = `DOMException[AbortError] "This operation was aborted"`、
**无 `reason` 字段**——「谁杀的」在死亡现场已不可恢复。

**F-AP3（报告面压成 message 单行）**：结算面把错误对象压成 message 字符串——name / cause / reason / 标注全丢：
`src/agent-tools/subagent-run.mjs:159`（`entry.error = err?.message ?? String(err)`）· `thincoder-core/agent-tools/advisor-async.mjs:299` ·
`thincoder-core/agent-tools/escalate-async.mjs:255` · `thincoder-core/agent-tools/consult.mjs:341` · `subagent.mjs:344`（`errText(e, 200)`）。
digest 原样注入 `entry.error`（`subagent-async.mjs:372-400`）——**用户实证所见的一行即此**。

**F-AP4（TUI 状态面粗粒度）**：`src/tui/subagent-freeze.mjs:143` 冻结兜底写死 `"interrupted"`；`tool-events.mjs:182` 的
`lastError` 只认 TURN_CAP_MARK / STOPPED_MARK 两标记——异步死亡在块面零文案（digest 是其唯一载体）。

**F-AP5（残留 600s 面——Q3 勘察结论）**：

- **CLI 请求链零绝对墙钟残留**：2026-09-01 已废除（`src/provider/core.mjs:70-71` 注——signal 只载用户 / 取消链）。
  实测（undici 7.29.0）：裸 abort 产生的文案 = `"This operation was aborted"`（**非** "aborted due to timeout"）——
  **CLI 请求链已不能产生用户实证的文案**。
- **现存活墙钟边界 = 有意设计面**（裁定与标注见 §20.3 第 4 条）：proxy 响应头 600s（`thincoder-core/provider/core.mjs:420` → `thincoder-core/proxy.mjs:86`
  "Response timeout"）· SSE 读侧 idle 120s（`thincoder-core/provider/sse.mjs:176-179`）· proxy body idle 120s（`thincoder-core/proxy.mjs:104`）·
  consult watchdog 600s（`thincoder-core/agent-tools/consult.mjs:35` 与 `:206-212`）· advisor 评审预算（`thincoder-core/advisor/loop.mjs:141-143`——已自带
  「Advisor: review timeout」文案）。
- **VSC 镜像残留（用户实证文案的唯一在网生产点）**：`thincoder-vscode/src/provider.mjs:28`（`FETCH_TIMEOUT_MS = 600_000`）→
  `:324` `AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)])` → `:327`——**每个请求**带绝对 600s 墙钟；
  `:24-27` 注释自称 "CLI parity" = **陈旧**（CLI 废掉的正是此物）。实测：timeout 信号触发时拒绝 =
  `TimeoutError "The operation was aborted due to timeout"`——与用户实证文案**逐字一致**。
  VSC 档不在本批写域——登记 + 父侧排程（§20.10）。

**F-AP6（相邻缺陷——cause 丢失）**：`entry.error = err?.message` 同时丢 `cause`——「fetch failed」类网络死亡
（真因在 undici 的 cause 链）同样不可判；本批由 §20.3 第 3 条合成器一并覆盖（P1——**可由评审剥离**，见 §20.5 D-24-5）。

### 20.2 方案选型对比（Q1 分层 / Q2 载体 / Q3 切除——判据 = 批次 §1 五问）

**Q1 来源面分层：**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 仅 trigger 单轴（user / timeout / cancel / stop / unknown） | 答「何触发」✓；答「哪一层发起」✗（D1 与 F-D1.1 明列两问） | — | 否决 |
| 2 | **trigger × layer 双轴（选定）** | 两问直落 ✓；layer 取 D1 原文三分（provider / agent / settle）——枚举小、稳定 ✓；站点精度由 detail 承载 ✓ | 代价：detail 为自由短串（非枚举）——接受（机判靠 trigger / layer 两轴） | **选定** |
| 3 | 自由文本单串（无枚举） | 人读 ✓；机判 ✗（AC 不可断言——D3 计数无从守） | — | 否决 |

**Q2 标注载体：**

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | message 内嵌（来源拼进错误 message） | 零消费面改动 ✓；污染一切 message 消费面（errText 截断 / 日志 / 模型可见文案）✗；不可机判 ✗ | — | 否决 |
| 2 | **结构化字段 `err.abortInfo`（主载体）+ 报告面合成器（选定）** | 可机判 ✓；message 零改（零回归）✓；一模块一词汇表（单一权威）✓ | 代价：报告面 5 处换合成器调用——接受 | **选定** |
| 3 | 上报面独立新通道（digest 新增字段 / 行） | 契约面大（注入格式 / 预算 / 双端）✗；与报告正文分离——模型决策要多读一处 ✗ | — | 否决 |

**Q3 残留 600s 路径：**

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 切除 CLI 请求链 600s 面 | CLI 请求链已无绝对墙钟（F-AP5 实证）——**无可切除对象** | — | 不适用 |
| 2 | **保留有意边界 + 标注使可判（选定）** | 边界均为有意设计（proxy 头 / 读侧 idle / watchdog）✓；标注后各自带 `timeout` + 边界名 ✓ | 代价：边界死亡依赖合成器在位（§20.3 第 3 条） | **选定** |
| 3 | VSC 600s 绝对墙钟本批一并切 | 双端纪律 = 各端独立实现、互不追赶；VSC 档不在本批写域 ✗ | — | 否决（登记 + 父侧排程） |

### 20.3 契约（词汇表 / 模块接口 / 死亡行 / 站点 / 数据流）

**第 1 条 词汇表（单一权威源 = 新模块 `src/abort-provenance.mjs`）**

**trigger（枚举 5 值）**：

| trigger | 判据（`signal.reason`） | 发起面（站点） |
|---|---|---|
| `user` | `reason.interrupt === true` | Ctrl+C 停回合（`tui/key-handler.mjs:94` 与 `:114`）· Ctrl+I（`tui/key-modes.mjs:224`）· ACP cancel（`acp/session.mjs:49`） |
| `timeout` | `reason.name === "TimeoutError"`；或 `reason.abortTrigger === "timeout"`（定时器面） | 读侧 idle / proxy 定时器 / consult watchdog（第 4 条） |
| `cancel` | `reason.abortTrigger === "cancel"` | 池 cancel（`subagent-async.mjs:202`）· sync ⏹（`:226`）· 评审 cancel（`thincoder-core/agent-tools/advisor-async.mjs:213`） |
| `stop` | `reason.abortTrigger === "stop"` | 全停 / 清池（`tui/key-handler.mjs:62` 与 `:67`）· consult 会话停（`thincoder-core/agent-tools/consult.mjs:357` 与 `:452`） |
| `unknown` | reason 缺失且错误无 `abortInfo` | **诊断告警态**（残留 / 未标注路径——必须显式呈现，不得静默） |

**layer（枚举 3 值——D1 原文三分）**：`provider` / `agent` / `settle`；未标注错误回落 `unrecorded`
（合成器兜底 token——计入 unknown 告警形态）。

**求值链（trigger 判定——一处写死；`deathLine` / `annotateAbort` 共用）**：
`err.abortInfo?.trigger`（已标注——产生点 / 补标点已判，直取）→ 否则 `triggerOf(signal)`（信号域——上表判据逐条读 `signal.reason`；得非 `unknown` 值直取）→
否则 `err.name` 兜底（`TimeoutError` → `timeout`；`AbortError` → `unknown`（告警）；后缀渲染条件仍按第 3 条）。
归属：标注域归产生点（`abortError` / `timeoutError`）与 `annotateAbort`；信号域归 `triggerOf`；兜底归合成器 `deathLine`。

**reason 形态（4 形态——就地扩展，向后兼容）**：
① `{interrupt: true(, message)}`（既有——user 面）② `TimeoutError`（Node 原生——timeout 面）
③ `{abortTrigger: "cancel"|"stop"|"timeout"(, abortDetail)}`（新增——程序性取消 / 停止 / 定时器）④ 缺失（→ unknown）。

既有 `reason.interrupt` 判据点（`agent.mjs:242` · `run-stages.mjs:147` · `agent-turn.mjs:149-164` · `agent.mjs:343`）
**零触碰**——新增形态不含 `interrupt` 键，各判据行为与今日「undefined reason」逐字同构。

**form ① 既存实测（修正轮 #4——只读抽查）**：四站点均自带 reason（零改动）——`key-handler.mjs:94` 与 `:114` = `{interrupt: true}` · `key-modes.mjs:224` = `{interrupt: true, message}` · `acp/session.mjs:49` = `{interrupt: true, message: "cancelled by client"}`。

**第 2 条 模块接口（`src/abort-provenance.mjs`——新增；纯函数、零 import——任意层可引、无环）**

| 导出 | 签名 | 语义 |
|---|---|---|
| `TRIGGERS` | `["user","timeout","cancel","stop","unknown"]`（计数 5） | 枚举权威（测试锁） |
| `triggerOf` | `(signal) => trigger` | 按第 1 条判据序判定 |
| `abortError` | `(signal, layer, detail) => DOMException` | 产生点：`AbortError` + `reason` 透传 + `abortInfo` 标注 |
| `timeoutError` | `(message, layer, detail) => Error` | 定时器面：自有 message + `abortInfo{trigger:"timeout"}` |
| `annotateAbort` | `(err, signal, layer, detail) => err`（第 4 参 `detail` 可选——3 参调用兼容） | 外部错误（undici 拒否等）补标——缺 `abortInfo` 才补；不改 name / message；`detail` 载站点名短串（站点 #2 传 `"request"`）；缺省回落 `unrecorded` |
| `deathLine` | `(err, signal) => string` | 报告面合成器（第 3 条形态） |

**第 3 条 死亡行形态（合成器输出——fail-when-unchanged 断言锚）**

`<原 message>[ ← cause: <cause.message>][ · abort(<trigger>@<layer>:<detail>)]`

- **原 message 前缀逐字保留**（零回归——既有前缀 / 包含断言不受影响）；
- 后缀出现条件 = `err.abortInfo` 存在 ∨ `signal?.aborted` ∨ `err.name ∈ {AbortError, TimeoutError}`；
- unknown 形态（告警）：`· abort(unknown@<layer>:no reason on signal)`；未标注回落 `unknown@unrecorded`；
- 总长 ≤300 字符（超长优先截 detail——文档宽度判据同量级）。

**合成点（settle 族报告面——5 档；行号 as-of 交付后实测）**：`subagent-run.mjs:162` · `thincoder-core/agent-tools/advisor-async.mjs:303` ·
`thincoder-core/agent-tools/escalate-async.mjs:258` · `thincoder-core/agent-tools/consult.mjs:334` 与 `:343` · `subagent.mjs:346`（sync 错误日志）。`logEvent("child:error", …)` 经 `entry.error`
自动携带（零改动）；`llm:error` 事件面（`thincoder-core/provider/core.mjs:107`）的 `err` 字段同合成器（P1）。

**第 4 条 站点总表（12 行——产生 9 / 传播 1 / 取消停止 1 / 定时器 1）**

| # | 面 | 站点（as-of） | 动作 |
|---|---|---|---|
| 1 | 产生 | `thincoder-core/provider/core.mjs:27-31`（abortDOM——退避 / 限流等待） | `abortError(provider, "sleep")` |
| 2 | 产生 | `thincoder-core/provider/core.mjs:426-427`（fetch 拒否 catch） | `annotateAbort(provider, "request")` |
| 3 | 产生 | `thincoder-core/provider/sse.mjs:185-189`（读循环） | `abortError(provider, "stream-read")` |
| 4 | 产生 | `thincoder-core/provider/anthropic.mjs:80` 与 `:187-190` | `abortError(provider, "transport-anthropic")` |
| 5 | 产生 | `thincoder-core/provider/google.mjs:107` 与 `:210-213` | `abortError(provider, "transport-google")` |
| 6 | 产生 | `thincoder-core/provider/rate.mjs:89`（TPM/RPM 闸门——补 reason 透传） | `abortError(provider, "rate-gate")` |
| 7 | 产生 | `thincoder-core/proxy.mjs:55-59`（socket abort 单点——`:79` / `:193` / `:232` / `:239` 全走它） | `abortError(provider, "proxy")` |
| 8 | 产生 | `agent.mjs:306`（interrupted response）与 `:338`（post-chat） | `annotateAbort` / `abortError(agent, …)` |
| 9 | 产生 | `subagent.mjs:290` 与 `:295`（sync stopped 抛错） | `abortError(settle, "sync-stopped")` |
| 10 | 传播 | F-AP2 五处 hop | `ctrl.abort(baseSignal.reason)`（reason 保留） |
| 11 | 取消停止 | cancel 3 处 + stop 4 处（第 1 条表内站点） | `abort({abortTrigger:…, abortDetail:…})` |
| 12 | 定时器 | 错误面（destroy / reject 抛错）：`thincoder-core/provider/sse.mjs:178` · `thincoder-core/proxy.mjs:81` · `thincoder-core/proxy.mjs:99` · `thincoder-core/provider/google.mjs:203`（google-sse-idle）；信号面（watchdog 中止 ctrl）：`thincoder-core/agent-tools/consult.mjs:213` | 错误面 `timeoutError(…)`；信号面 `abort({abortTrigger:"timeout", abortDetail:"consult-watchdog"})` |

规则（覆盖勘察外的漏网站点）：**对单个任务目标的定向中止 = cancel；整批 / 会话 / 回合级停止 = stop；用户按键 = user；
定时器 = timeout；无标注 = unknown**（unknown 即告警——不得静默）。

**第 5 条 数据流（单链——谁写、谁读）**

调用面（TUI / ACP / cancel 动作）写 `reason`（形态 ①③）→ 链 hop 逐跳保 reason（第 4 条 #10）→
provider / agent / settle 产生或补标错误（`abortInfo`，第 4 条 #1–#9、#12）→ 结算面合成 `deathLine`（第 3 条 5 处）→
`entry.error` / consult note / `child:error` 日志 → digest 注入（`subagent-async.mjs:372-400` 零改）→ 用户与模型**一次可判**。

### 20.4 残留 600s 面裁定（Q3——勘察结论与证据）

1. **CLI 请求链无可切除对象**：绝对墙钟已于 2026-09-01 废除（`thincoder-core/provider/core.mjs:70`——71 行同段）；实测文案亦不符（F-AP5 第 1 条）；
2. **有意边界保留**（proxy 头 600s / 读侧 idle 120s / proxy body idle 120s / consult watchdog 600s / advisor 评审墙）——
   本批使其死亡自带 `timeout` 标注（§20.3 第 4 条 #12），不再"静默"；
3. **VSC 镜像 600s 绝对墙钟**（用户实证文案的唯一在网生产点）——双端纪律下**登记 + 父侧排程**（§20.10），本批零碰。

### 20.5 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-24-1 | layer 取 D1 原文三分（provider / agent / settle）+ detail 载站点名 | 与需求措辞同构、枚举稳定；否决「每站点一个 layer 值」（枚举膨胀、与需求不对齐） |
| D-24-2 | 载体 = 结构化 `err.abortInfo`（非 message 内嵌） | 零回归 + 可机判；否决 Q2-1（message 污染）/ Q2-3（新通道） |
| D-24-3 | reason 词汇表**就地扩展**（新 `abortTrigger` 形态）——不改 `{interrupt}` 既有形态 | 既有判据点零触碰（§20.3 第 1 条末）；否决「把 user 也迁入新形态」（触发大批既有断点） |
| D-24-4 | 死亡行 = 原 message 前缀 + 后缀（不重写 message） | 既有文案 / 前缀断言零回归；否决「重写 message 为来源优先形态」 |
| D-24-5 | cause 链渲染（P1）随本批落地、**可由评审剥离** | F-AP6 同点同修（零额外成本）；剥离后 P0 完整（合成器保留原样即可） |
| D-24-6 | VSC 残留不当场修 | 双端纪律（各端独立实现）+ 写域边界；登记 §20.10 |

### 20.6 受影响文件全清单（行数口径 = 行计数；as-of 2026-09-11）

**文档域（eng-designer 写域——本批已落）**

| 文件 | 批前基线（as-of 批前） | 变更 | 落档后（评审轮次 1 实测） |
|---|---|---|---|
| `docs/requirements/AGENT-LOOP.md` | 134 | §6 新增（F-D1.1–F-D1.4 + 判定句 + 边界；修正轮零改） | 168 |
| `docs/design/AGENT-LOOP.md` | 1024 | §20 新增 + §2.1 一行指针（修正轮 #5）+ 状态行条目 + 本节变更记录 | 1282（其后并入他批增量不计入——如第 30 批 §21） |
| `docs/design/PROVIDER.md` | 1365 | §3 一行指针（修正轮 #5——来源标注指向 §20.3） | +1 |
| `docs/TODO.md` | 173 | 行 151 状态推进（台账——行替换） | ±0 |

行数口径：批前基线 = 各节落档前；落档后 = §6 / §20 落档后、评审轮次 1 时点读数。文档面核对（修正轮 #5）：`LOGGING.md` 核得零改（`llm:error` err = `errText(e, 200)` 截断字符串——字段与截断形态不变，P1 仅换内容来源）。

**实施域（eng-coder 写域——本批已交付；行数 as-of 2026-09-11 交付后实测）**

| 文件 | 批前基线 | 交付后实测 | 净变 | 变更 |
|---|---|---|---|---|
| `thincoder-core/abort-provenance.mjs` | —（新增） | 117 | 新增（设计估 ~90） | 词汇表 + 6 导出 |
| `thincoder-core/provider/core.mjs` | 482 | 477 | -5 | 产生点 `sleep` + `request`（+ P1 llm:error 面） |
| `thincoder-core/provider/sse.mjs` | 266 | 265 | -1 | 产生点 `stream-read` + 定时器 `sse-idle` |
| `thincoder-core/provider/anthropic.mjs` | 226 | 225 | -1 | 产生点 transport 两处 |
| `thincoder-core/provider/google.mjs` | 259 | 258 | -1 | 产生点 transport 两处 + 定时器 `google-sse-idle` |
| `thincoder-core/provider/rate.mjs` | 108 | 109 | +1 | 产生点 `rate-gate`（含 reason 透传） |
| `thincoder-core/proxy.mjs` | 267 | 262 | -5 | 产生点 `proxy` 单点 + 定时器两处 |
| `src/agent.mjs` | 401 | 414 | +13 | 产生点 `agent` 两处 |
| `src/agent-tools/subagent.mjs` | 403 | 405 | +2 | 产生点 2 + hop 1 + 合成 1 |
| `src/agent-tools/subagent-run.mjs` | 203 | 206 | +3 | hop 1 + 合成 1 |
| `src/agent-tools/subagent-async.mjs` | 473 | 474 | +1 | cancel 两处 |
| `thincoder-core/agent-tools/escalate-async.mjs` | 287 | 290 | +3 | hop 1 + 合成 1 |
| `thincoder-core/agent-tools/advisor-async.mjs` | 350 | 354 | +4 | hop 1 + 合成 1 + cancel 1 |
| `thincoder-core/agent-tools/consult.mjs` | 456 | 461 | +5 | hop 1 + 定时器 1 + stop 2 + 合成 2 |
| `src/tui/key-handler.mjs` | 440 | 441 | +1 | stop reason 两处 |
| `test/abort-provenance.test.mjs` | —（新增） | 190 | 新增（设计估 ~170） | T-AP1–T-AP8 在役；T-AP9/T-AP10 已退场（整删——删除记录 = `TESTING.md` §11.3） |

口径注：行数 = 读回行数（与批前基线同一计数法）；交付后读数含评审修正轮增量与他批在途并发编辑
（共享档净变非本批独占——如 `agent.mjs` +13 以他批为主）。

行数警戒（交付后实测）：`subagent-async.mjs`（474）· `consult.mjs`（461）· `key-handler.mjs`（441）· `subagent.mjs`（405）均在
500 行硬限内（本批增量小——最逼近者 `consult.mjs` 461）；未触发拆分治理。

**父侧面（非本批写域——登记）**：`CHANGELOG.md`（父侧核销注）；VSC 仓（§20.10）。

### 20.7 用例表（T-AP——正常 / 边界 / 错误）

| # | 类别 | 输入 | 预期输出（可机判） | 回指 |
|---|---|---|---|---|
| T-AP1 | 正常（词汇表） | `triggerOf` 四形态输入：`{interrupt:true}` / `TimeoutError` / `{abortTrigger:"cancel"}` / `undefined` | `user` / `timeout` / `cancel` / `unknown` 逐一命中；`TRIGGERS` 计数 = 5 | F-D1.1 |
| T-AP2 | 正常（链传递） | 五处 hop 各一：`base.abort({interrupt:true,message})` → 子 ctrl | 子 `signal.reason` 深等 base.reason（fail-when-unchanged） | F-D1.2 |
| T-AP3 | 正常（报告合成） | `deathLine(abortError(sig,"provider","stream-read"), sig)` | 前缀 = 原 message 逐字；含后缀 `abort(user@provider:stream-read` | F-D1.3 |
| T-AP4 | 边界（unknown 告警） | 裸 `abort()`（无 reason）→ `deathLine` | 显式含 `unknown`（不得静默——空后缀即红） | F-D1.4 |
| T-AP5 | 边界（定时器面——两形态） | ① `timeoutError("SSE idle timeout…","provider","sse-idle")` → `deathLine`；② `triggerOf({abortTrigger:"timeout"})` | ① 含 `timeout@provider:sse-idle`；② = `timeout` | F-D1.1 · F-D1.3 |
| T-AP6 | 边界（cause 链——P1） | `Object.assign(new Error("fetch failed"),{cause:new Error("HeadersTimeoutError")})` | `deathLine` 含 `← cause:` 与 cause 文本 | F-D1.3（一次可判） |
| T-AP7 | 错误（取消 / 停止） | cancel / stop 站点 reason（`{abortTrigger:"cancel"}` / `"stop"`）→ `deathLine` | 分别含 `cancel@…` / `stop@…` | F-D1.1 |
| T-AP8 | 错误（零回归） | 既有测试族（`sync-cancel` / `async-settle` / `queued-stop` / `subagent-observe-send` / `advisor-chain-guards`） | 全绿（既有 abort 锁零伤） | N-D1.1 |
| T-AP9 | 错误（合成点残留） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F-D1.3 |

### 20.8 验收标准（AC-AP——逐条回指 D1 / F-D1.x）

- **AC-AP1**（F-D1.1）= T-AP1 绿 + `TRIGGERS` 计数 5 与 `../requirements/AGENT-LOOP.md` §6 表述一致（`node --test test/abort-provenance.test.mjs`）。
- **AC-AP2**（F-D1.2）= T-AP2 绿 + grep 断言：五处 hop 均以 `abort(` 实参携带 reason（裸 `ctrl.abort()` 形态在五档命中 = 0）。
- **AC-AP3**（F-D1.3）= T-AP3 绿（T-AP9 已退场——整删，删除记录 = `TESTING.md` §11.3） + 合成器在五处合成点在位（grep `deathLine(` 命中 ≥5；`err?.message ?? String(err)` 命中 = 0）。
- **AC-AP4**（F-D1.4）= T-AP4 绿（unknown 显式——用户实证形态可判；空后缀即红）。
- **AC-AP5**（F-D1.1/F-D1.3 边界）= T-AP5 + T-AP7 绿（timeout / cancel / stop 三面标注落地；timeout 两形态 = 错误面 `timeoutError` + 信号面 `{abortTrigger:"timeout"}`——含 `triggerOf({abortTrigger:"timeout"}) → timeout` 断言）。
- **AC-AP6**（N-D1.1）= T-AP8 绿——既有 abort / 结算 / 取消测试族全绿（零回归）。
- **AC-AP7**（纪律面）= `node scripts/check-doc-width.mjs` 本批触碰档零新增违规（宽度 + V1/V2/V3）；仓库内他批在途文件的存量违规不在本批判据内。
- **AC-AP8**（P1 面，可剥离）= T-AP6 绿（cause 链）——**若评审裁定剥离 P1**，本 AC 随同摘除，AC-AP1–AC-AP7 不受影响。

### 20.9 纪律核对（D1 · 既有测试锁 · 双端纪律）

- **D1 覆盖**：F-D1.1–F-D1.4 四条判定句 → AC-AP1–AC-AP5 逐条回指（§20.8）；
- **既有 abort 测试锁零伤**：`test/sync-cancel.test.mjs`（hop / ⏹ 分类）· `test/async-settle.test.mjs`（settle 语义）·
  `test/queued-stop.test.mjs`（cancel 路由）· `test/subagent-observe-send.test.mjs`（cancel 链路）· `test/advisor-chain-guards.test.mjs`
  （timeout 六 kind）——本批只加标注与合成器，不改判定谓词（`classifySyncAbort` / `parentAborted` / `classifyErr` 零改），全族必须绿（T-AP8）；
- **双端纪律**：各端独立实现、语义同源——CLI 面本批落地；VSC 面差异（600s 绝对墙钟 + 镜像标注面）**如实登记**（§20.10），
  不以任一端产物为准回改另一端；不做 byte-identical 镜像同步。

### 20.10 边界（本批不做）与登记项

- **不改 abort 机制本体**（何时 abort / 谁有权 abort 零改）——只加标注与渲染（范围边界，批次 §1 明列）；
- 不改 digest 注入格式 / 预算（`subagent-async.mjs:372-400` 契约零改）；不改提示词语义；不碰他链在途档；
- **登记（本批不做）**：① TUI 块面错误文案（F-AP4——digest 已是首次可判载体，块面文案另行批）；
  ② tool-result 面（`agent/dispatch.mjs:464` `Error: <message>`）与 sync 重抛面；③ MCP 家族（`thincoder-core/mcp.mjs:23-24` / `transport-*`）同形标注
  （不在子代理死亡链上——同类机制、另行批）；④ 死亡行后缀预算（超长 message 时后缀可被截尾吞——「先削 message 再拼后缀」）：后续改进（非本批——评审 🟡-2 登记）。
- **VSC 残留面——父侧排程**（所需档 + 用途 + 完整修复路径）：`thincoder-vscode/src/provider.mjs`（`:324` 去绝对墙钟 /
  `:327` 头阶段语义对齐 CLI——**用户实证文案的唯一在网生产点**）+ VSC 镜像标注与合成面（`agent-tools/subagent-run.mjs` 等 `entry.error` 合成）；
  VSC 档 = `AGENT-LOOP（VSC 仓）` 与 `PROVIDER（VSC 仓）`（VSC 仓独立写域——本批零碰）；
- **零改确认（勘察）**：`thincoder-core/provider/responses.mjs` 无自有产生点（错误经共享 `proxyFetch` / `chat` 面）· `thincoder-core/provider/retry.mjs` 只透传（`:36`）。
- **UI/交互决策（本批）**：用户可见面 = digest 中的死亡行（沿用既有注入通道——无新控件、无交互变更）；
  TUI 块状态面零改（登记①——见下 open ②）；`detail` 短串展示为自由文本（不渲染为独立 UI 元素）。

**未确认面（open）**：① 用户实证两次的**原始死亡文本**未入档——§20.4 给出「唯一在网生产点 = VSC 600s 绝对墙钟」的
机械论证（文案逐字一致 + CLI 已废实证），若用户可补截图 / 原文即可二审（不阻塞本批）；
② `detail` 短串是否收紧为枚举——待实现后按实测站点收敛（本批只锁 trigger / layer 两轴）。

**变更记录**：2026-09-11 第 24 批——子代理 abort 来源标注（可诊断性）（新增本节；需求档 §6 同批落地；VSC 残留 600s 面登记父侧）；
同日评审轮次 1 后修正轮（🔴1 + 🔵4 全落）——timeout 三处对齐（判据行 `reason.abortTrigger === "timeout"` · 形态③纳 `"timeout"` · 站点 #12 分错误面/信号面）·
求值链段（err 优先 + 三步归属）· §20.6 行数口径改「批前基线 → 落档后实测」· form ① 四站点既存证据行 · §2.1 与 `PROVIDER.md` §3 指针（LOGGING.md 核得零改）。
同日交付后设计刷新——`annotateAbort` 签名 4 参可选形态 · 站点表 #8 行号校正（`:306`/`:338`）· 补两处同类站点（`thincoder-core/provider/google.mjs:203` 定时器面 / `thincoder-core/agent-tools/consult.mjs:334`+`:343` 合成器面——并随行校正 #12 与合成点链行号）· §20.6 实施域行数交付后实测刷新 · §20.10 登记 ④（后缀预算——后续改进）。

## 21. Stop 钩子（主会话 run 结束事件）（第 30 批——2026-09-11）

> 来源：批次 `../batches/2026-09-11-STOP-HOOK.md` §1；需求 `../requirements/AGENT-LOOP.md` §7。
> 用户裁定（2026-09-11 13:36）：事件名 `Stop`；范围 = 每回合、仅主会话（子代理不触发）。

### 21.1 问题陈述（现场复核——as-of 2026-09-11）

- **需求**：Gitee #IKD5XY——「回答结束触发自定义通知」（弹窗 / 声音）。通知设施交给用户脚本（hook）——产品不做 OS 级通知。
- **引擎现成**：`src/hooks.mjs:27-42`（`runHooks`：配置读取 / matcher 过滤 / 逐条 runOneHook / block 返回 false）、
  `src/hooks.mjs:44-93`（`runOneHook`：基础载荷 JSON → stdin、timeout 默认 10s、spawn 失败/超时 → 放行）。
  调用点仅三类：`src/agent/dispatch.mjs:254` / `:310`（PreToolUse——可阻断）、`:439`（PostToolUse——fire-and-forget）、
  `:453`（PostToolUseFailure——fire-and-forget）。
- **缺面 = run 终止触发点**：`callbacks.onTurnEnd?.(agent, turn)` 是**回合循环内的逐轮簿记**（TUI：流刷新 + 增量落盘，
  `src/tui/tool-events.mjs:380-401`）——调用点 `src/agent/completion.mjs:42/65/83/96/111/139`（六处 continue 路径）、
  `src/agent/post-turn.mjs:69`（每个工具轮）、`src/agent.mjs:387`（工具期中断）——**不含** run 正常完成路径。
  run 终止的唯一收口点 = `finally` → `await finalizeAgentTurn(...)`（`src/agent.mjs:409` → `src/agent/run-stages.mjs:121`）。
- **死事件（已删——2026-09-11 清理）**：`Notification` 原声明于 `src/hooks.mjs:11`，**零调用点**；现已清退（全仓零命中）。存活面清点（as-of 当时）：代码注释 1 处 ·
  `docs/design/_archive/ROADMAP-0.9.0.md`（归档）· `README.md:306`（0.9.0 历史变更史）；存活文档 `docs/design/TOOLS.md:38`
  未列该事件；配置无校验（hooks 按事件名动态读取——`src/hooks.mjs:28`）。
- **文档面**：hooks 事件列表的存活处 = `docs/design/TOOLS.md:38`（三事件 + `~/.thincoder/hooks/` 路径误述——
  实际 = config.json `hooks` 键，权威 `src/hooks.mjs:5`）；`docs/design/AGENT-LOOP.md:125` 只述 PreToolUse 阻断点。
- **双端**：VSC 仓**无 hooks 引擎**——`thincoder-vscode/src/hooks.mjs` 不存在、`runHooks` / hooks 引擎引用于 `thincoder-vscode/src` 零命中；
  VSC 有自有 `thincoder-vscode/src/agent/run-stages.mjs` 镜像（日后 VSC 若上 hooks，Stop 触发点挂同位置——登记，不做）。

### 21.2 方案选型对比

**Q1 触发点（判据 = 「回答结束」语义 / 通知价值 / 覆盖完整性 / 实现成本）：**

| # | 候选 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 逐内层轮（onTurnEnd 消费点） | 长任务 N 轮 → N 次通知（风暴）；「回答未结束就报结束」语义错位 | —— | **否决** |
| 2 | run 正常完成返回点（`agent.mjs:332`） | 只覆盖 done；撞帽暂停 / 异常终止无通知——而这两态恰是用户离开时最需要被叫回的场景 | —— | **否决**（覆盖不足） |
| 3 | 收尾点 `finalizeAgentTurn` + 显式条件 | 单点覆盖全部退出路径（done / maxTurns / error / abort 分支同点分流）；条件可读（depth / abort / AbortError） | 需给收尾函数补 `depth` 入参（调用点 1 行） | **选定** |
| 4 | TUI 层（`agent-turn.mjs` break 点） | 只覆盖交互面——headless（`-p` / runAgent 直调）丢失；引擎语义散到 TUI | —— | **否决** |

**Q2 载荷载体（判据 = 与既有三事件同构 / 改动面 / 扩展性）：**

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 基础骨架 + `ctx.extra` 可选合并 | 既有三调用点不传 extra → 载荷逐字零变；Stop 专属字段（turn / reason）单点注入 | 引擎 +1 行 | **选定** |
| 2 | 为 Stop 单建载荷构造器 | 复制骨架 → 两处漂移源 | —— | **否决** |
| 3 | 复用既有字段承载（如 reason 塞 `result`） | 字段语义重载（`result` = 工具结果、`error` = 失败消息）——下游脚本无法稳定判读 | —— | **否决** |

**Q3 `Notification` 处置（判据 = 运行时影响 / 用户陷阱 / 用途重叠）：**

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | 删除声明（引擎头 + 文档面） | 零调用点（自重引入即死）；存活文档不列；配置无校验 → 删除 = **零运行时影响**（既有 Notification 配置本就惰性）；「能配却永不触发」是陷阱；「通知」用途已被 Stop 覆盖 | 需核文档面（已核——§21.1） | **选定** |
| 2 | 接线（映射到 Stop / 新工具触发） | 语义与 Stop 重复；新工具 = 新范围（批次边界外） | —— | **否决** |

### 21.3 契约（触发判定 / 时序 / 载荷 / 引擎改动 / 事件表）

**触发判定（逐字）**——`src/agent/run-stages.mjs` `finalizeAgentTurn` 首部（`flushPeerDomains(agent)` 之后）：

```js
// 第 30 批 D1（Stop 钩子）：主会话 run 终止 → fire-and-forget（非阻塞；失败静默——与 PostToolUse 同语义）。
// 排除用户中止（Ctrl+C / Ctrl+I——中止后 TUI 重建 controller 续跑或已显式停回合）与 AbortError 展开。
if (depth === 0 && !signal?.aborted && thrownError?.name !== "AbortError") {
  runHooks("Stop", {
    agent,
    error: thrownError && !(thrownError instanceof ContinueError) ? thrownError : undefined,
    extra: {
      turn: agent._currentTurn ?? 0,
      reason: thrownError instanceof ContinueError ? "maxTurns" : thrownError ? "error" : "done",
    },
  }).catch(() => {})
}
```

- 判定语义：`depth === 0`（仅主会话——用户裁定）；`signal?.aborted` 排除 Ctrl+C（停回合）与 Ctrl+I（注入续跑）；
  `AbortError` 名称兜底（`agent.mjs:304` 的 interrupt 合成 AbortError 不带 signal 判据——防续跑期假通知）；
- `reason` 三态：`done`（正常完成）· `maxTurns`（`ContinueError`——撞帽暂停）· `error`（其余异常——`error` 字段带 message）；
- 每 runAgent 调用至多一次（触发块在收尾函数内、收尾函数在 `finally` 单点调用）。

**时序（与 post-turn / onTurnEnd 的关系）**：

```
回合循环每轮：chat → dispatch（Pre / Post / Failure hooks）→ post-turn 注入（onTurnEnd = TUI 簿记）
→ 循环退出（正常 return / ContinueError / 异常 / 中止）
→ finally → finalizeAgentTurn：① flushPeerDomains ② ★Stop 触发（本批新增）③ 池收尾（collectSettledAsync）④ guard 继承
```

- `onTurnEnd`（逐轮簿记）与 `Stop`（run 终止）**层级不同**：前者既有语义零改，后者不逐轮触发；
- Stop 置于收尾链**首部**：后续收尾步骤的任何异常不得吞掉通知（与 `flushPeerDomains` 首行同理由）；
- auto-turn（digest）回合 = depth 0 → 同样触发（决策 §21.4-④）；撞帽后用户续跑 = 新 runAgent 调用 → 再次触发
  （每段一次；最终回答的 Stop = 链上最后一次）；
- fire-and-forget：不 await（`runHooks(...).catch(() => {})`）、不计入回合时延；子进程存活性随宿主进程
  （与 PostToolUse 同语义——不 unref、不新增退出面）。

**载荷（stdin JSON——字段与顺序）**：

```json
{"event":"Stop","toolName":null,"toolArgs":null,"result":null,"error":null,"turn":7,"reason":"done","timestamp":"2026-09-11T07:00:00.000Z"}
```

| 字段 | 值 | 说明 |
|---|---|---|
| `event` | `"Stop"` | 事件名（用户裁定） |
| `toolName` / `toolArgs` / `result` | `null` | 无工具面——骨架字段保留（镜像既有事件形态） |
| `error` | `null` \| string | **仅 `reason="error"` 时** = 异常 message；其余态 null |
| `turn` | number | 链内累计轮号（`agent._currentTurn`——`helpers.turnFrame` 帧值，跨段累计，与状态行同源） |
| `reason` | `"done"` \| `"maxTurns"` \| `"error"` | 终止原因三态 |
| `timestamp` | ISO 8601 | 既有骨架同款 |

- 不携带回答正文 / agent 对象 / 会话标识（脚本按需自取环境；后续增字段 = 向后兼容）；
- `matcher` 对 Stop 无效（引擎改动 2）；`action: "block"` 无意义（返回值无人消费——fire-and-forget）。

**引擎改动（`src/hooks.mjs`——三处小改，既有三调用点零改）**：

1. `runOneHook` 载荷构造：基础键与 `timestamp` 之间插入 `...(ctx.extra ?? {})`（既有调用点不传 → 逐字零变）；
2. `runHooks` matcher 守卫：`if (hook.matcher && ctx.toolName != null)`——工具事件 `toolName` 恒非空（零变化），
   无工具名事件（Stop）忽略 matcher（**否决「仅文档说明」**：配了 matcher 会静默失火——陷阱，守卫 1 行可除）；
3. 头部事件表：删 `Notification` 行、增 `Stop` 行（含「无工具名 / block 无意义」注记）。

**事件表（本批收口后全四类）**：

| 事件 | 触发点 | matcher | block 语义 |
|---|---|---|---|
| PreToolUse | 工具执行前（dispatch 预审段——可阻断） | 工具名 | 有（非零退出阻断——`dispatch.mjs:334` 错误文案） |
| PostToolUse | 工具成功后（fire-and-forget） | 工具名 | 无（返回值无人消费） |
| PostToolUseFailure | 工具失败后（fire-and-forget） | 工具名 | 无 |
| **Stop**（新） | 主会话 run 终止（fire-and-forget） | 忽略（无工具名） | 无 |

> 长期权威面 = `docs/design/TOOLS.md` §3（事件表行——登记项 §21.9）与 `src/hooks.mjs` 头（代码内权威）；
> §3 落地前本节 = 过渡权威（落档后本节只留指针）。

### 21.4 关键决策记录（含否决备选）

1. **触发点 = 收尾点单点 + 显式条件**（否决逐内层轮 / 正常返回点 / TUI 层——§21.2 Q1）；
2. **中止排除** = `signal?.aborted` + `AbortError` 兜底：Ctrl+I 是「注入后自动续跑」、Ctrl+C 是用户当场停——
   两者都不需要通知（用户在场 + 工作未终止）；
3. **撞帽 / 异常也触发**（`reason` 区分）：两态都是「agent 停了、可能需要你」——撞帽在 TUI 会阻塞问「Continue?」，
   无人值守时恰是通知价值最高点；否决「仅 done」（覆盖不足）；
4. **auto-turn（digest）触发**：异步工作结算后的 digest 回合 = 用户离开时工作真正收尾的时刻——排除它反丢核心场景；
   接受的代价 = 罕见的「digest 撞帽 + autoApprove 自动续跑」链会多一次通知（**登记接受**——脚本可按 `reason` 过滤）；
5. **载荷收敛**：不带回答正文 / agent 对象（通知场景非必需；正文会引入截断策略 + 状态暂存；后续加字段向后兼容）；
   `turn` 用链内累计帧值（与状态行同源）；
6. **失败静默**：与既有三事件同语义（引擎层已静默——spawn 失败 / 超时放行）；否决「Stop 单独可见化」（不一致 + 新日志面）；
   全族可诊断面（如 `ev:hook` 事件）**登记**为独立批（§21.9）；
7. **`Notification` 删除**（否决接线——§21.2 Q3）；
8. **matcher 守卫进引擎**（否决「仅文档说明」——§21.3 引擎改动 2）；
9. **extra 合并而非新构造器**（单一载荷构造点——D2）；
10. **不改 TUI / dispatch / completion / post-turn**：本批只在收尾点挂载 + 引擎载荷扩展（不扩回归面）。

### 21.5 受影响文件全清单（行数口径 = 行计数；as-of 2026-09-11）

| 文件 | 当前行数 | 预计增量 | 改动面 |
|---|---|---|---|
| `src/hooks.mjs` | 94 | +4~6（→ ~98-100） | 头部事件表（−1 行 / +1 行）· matcher 守卫 +1 · extra 合并 +1（含注释） |
| `src/agent/run-stages.mjs` | 228 | +9~12（→ ~237-240） | `import { runHooks }` + 触发块（§21.3 逐字）+ JSDoc（ctx.depth） |
| `src/agent.mjs` | 412 | 0（同改 1 行） | `:409` 调用点补 `depth` 入参 |
| `test/hooks-stop.test.mjs` | 新增 | ~150-190 | 假 hook 脚本（mkdtemp 运行期生成；`process.execPath` + 脚本路径为 command / args）+ 11 用例（§21.6） |
| `docs/requirements/AGENT-LOOP.md` | 169 | +41（→ 210，已落档） | 新 §7（需求层） |
| `docs/design/AGENT-LOOP.md` | 1282 | +232（→ 1514，已落档——含状态行 1 条） | 新 §21（本节）+ 状态行 1 条 |
| 登记（**不在本批声明面——父侧排程**）`docs/design/TOOLS.md` | 126 | 1 行替换 | §3 hooks 行：+Stop / 路径纠错（目标文本见 §21.9） |

**零改确认**：`src/agent/dispatch.mjs`（490——三调用点逐字零改）· `src/agent/completion.mjs`（147）·
`src/agent/post-turn.mjs`（71）· `src/tui/**`（TUI 面零改——`tool-events.mjs`（406）onTurnEnd 语义不动）·
`thincoder-vscode/**`（VSC 仓零碰）。

### 21.6 用例表（T-HS——正常 / 边界 / 错误）

| # | 类 | 场景 | 输入 / 动作 | 预期输出 | 映射 |
|---|---|---|---|---|---|
| T-HS1 | 正常 | 主会话正常完成 | 桩 agent（`agent.config.hooks.Stop` = 假脚本——注入面见注）+ `finalizeAgentTurn(agent,{depth:0})` | 脚本产物出现：`event="Stop"` / 骨架 null / `reason="done"` / `turn` 数字 / timestamp ISO | F-E1 / F-E2 / F-E3 |
| T-HS2 | 边界（**归册按慢门实测**） | 非阻塞 | 脚本先落 started 标记 → 等 go 信号文件（≤10s 超时自杀；此间不落载荷）→ 落载荷 | `await finalizeAgentTurn`（测试级 15s 超时兜底）返回后：轮询 started（≤5s）→ 断言载荷**不存在**（宿主返回先于脚本产物——await 化回归 = 死锁 → 测试超时红）；写 go → 轮询载荷出现（确已执行） | F-E3 |
| T-HS3 | 边界 | 撞帽 | `thrownError = new ContinueError(50)` | `reason="maxTurns"`、`error=null` | F-E2 |
| T-HS4 | 边界 | 子代理 | `depth:1` | 零产物（不触发） | F-E1 |
| T-HS5 | 边界 | 用户中止 | ① `signal` 已 abort ② `thrownError = AbortError` | 两态各自零产物 | F-E1 |
| T-HS6 | 边界 | auto-turn 回合 | `autoTurn:true` + `depth:0` | 触发（`reason="done"`）——决策 ④ 留痕 | F-E1 |
| T-HS7 | 边界 | Stop hook 带 matcher | `matcher:"^bash$"`（无工具名） | 仍触发（matcher 忽略——决策 ⑧） | F-E4 |
| T-HS8 | 错误 | hook 命令不存在 | `command` = 不存在路径 | `finalizeAgentTurn` 零异常、零产物 | F-E3 |
| T-HS9 | 错误 | 非预期异常 | `thrownError = new Error("boom")` | `reason="error"`、`error="boom"` | F-E2 |
| T-HS10 | 回归 | 工具事件 matcher 语义 | 经注入配置两跑：`runHooks("PreToolUse", {toolName, agent})`——`agent.config.hooks.PreToolUse` = 假脚本（matcher `^bash$`——注入面见注）；`toolName` = `"read"` / `"bash"` | read 不触发 / bash 触发（过滤语义保持） | F-E4 / N-E1 |
| T-HS11 | 静态 | 事件集收口 | 扫描 `src/hooks.mjs` 源码 | 头部事件表四类齐（名单锁）；含 `Stop` / 不含 `Notification` 逐串断言——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F-E5 |

> 桩 agent 可行性（勘察）：`finalizeAgentTurn` 的依赖对最小桩零崩溃——`flushPeerDomains`（`_peerWritten` 缺席即返回）·
> `getAsyncPool`（`?? null`）· `collectSettledAsync`（池空 → 早退）· `closeOpenCodeAdvisorRuns`（`_advisorRuns` 非 Map 免疫）。
> 假脚本落 `fs.mkdtempSync(os.tmpdir())`（运行期生成——零固件维护）；`command = process.execPath`（免 PATH / Windows 差异）。
> **配置注入面（修正轮 🟡1——既有缝）**：引擎配置读取 = `ctx.agent?.config?.hooks?.[event]`（`src/hooks.mjs:28`——逐调用动态读取、无模块级状态）——
> 测试以**参数注入**覆盖（构造桩 `agent.config.hooks[event]`；env 覆盖 / 模块级 setter / 临时配置目录均不需要）：**零新增缝**——`hooks.mjs` 影响表（+4~6）与「零改」口径不变。
> **轮询与归册（修正轮 🔵3）**：全部「轮询」统一 ≤5s 上限 + 失败信息（目标路径 + 脚本 stderr 摘要）；T-HS2 以**信号同步**（go 文件）与收尾时延解耦——归册按慢门实测点名（TESTING.md §1.2）；其余用例保持快层 <500ms。

### 21.7 验收标准（AC-HS——逐条回指 D1 / F-E.x / N-E.x）

- **AC-HS1**（F-E1）= T-HS1 / T-HS3 / T-HS4 / T-HS5 / T-HS6 绿（`node --test test/hooks-stop.test.mjs`——触发面五态）。
- **AC-HS2**（F-E2）= T-HS1 / T-HS3 / T-HS9 绿 + 载荷字段断言（reason 三态 / error 仅 error 态非空 / turn 数字 / timestamp ISO / 骨架 null）。
- **AC-HS3**（F-E3）= T-HS2（归册按慢门实测——归册时走 `npm run test:full`）+ T-HS8 绿（「宿主返回先于脚本产物」+ 零异常）。
- **AC-HS4**（F-E4）= T-HS7 / T-HS10 绿 + grep 断言 `ctx.toolName != null` 守卫在位（`src/hooks.mjs`）——该 grep 断言已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）。
- **AC-HS5**（F-E5）= T-HS11 绿（`src/hooks.mjs` 头部事件表四类齐）；源码含 Stop / 不含 Notification 逐串断言——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3）；
  `TOOLS.md` §3 分句随父侧排程落档（登记项 §21.9——不阻塞代码面）。
- **AC-HS6**（N-E1）= `npm test` 全绿 + `npm run test:full` 全绿（既有族零回归；hooks 无既有测试——首个 hooks 测试档为本批新增）。
- **AC-HS7**（纪律面 / N-E3）= 两仓 `node scripts/check-doc-width.mjs` 本批触碰档零新增违规 + 本批交付 diff 不含
  `thincoder-vscode/**`（VSC 仓零碰——diff 面核对）。
- **AC-HS8**（N-E2）= 断言锁定 + 反例可复现（fail-when-unchanged 抽查）：① 摘除触发块 → T-HS1 转红；
  ② 摘除 matcher 守卫 → T-HS7 转红；③ 恢复 `Notification` 声明行 → T-HS11 转红——coder 交付报告附抽查证据（三条反例各一次）。

### 21.8 纪律核对（D1 · D2 事件表归属 · 既有测试锁 · 双端纪律）

- **D1 写权**：需求 / 设计档 = eng-designer（本批 §7 / §21 本节）；批次档 §2 = eng-designer（`batch_segment`）；
  `src/**` = eng-coder（设计 token 门）；`docs/design/TOOLS.md` §3 = 设计档（设计者权属）——**不在本批声明面**，登记父侧排程；
- **D2 单一权威源**：事件表长期权威 = `docs/design/TOOLS.md` §3 + `src/hooks.mjs` 头；本节 = 本批落地依据（过渡权威——§21.3 注记），
  不复制到别处；`docs/design/AGENT-LOOP.md:736` 指针行（hooks → TOOLS.md）保持有效；
- **既有测试锁**：hooks 引擎**无既有测试**（`thincoder-cli/test/**` 对 `runHooks` / `hooks.mjs` 零命中——`_catalogHooks` / `_rateHooks`
  为测试注入钩子、同名不同物）→ 无锁伤面；零回归由全量 `npm test` 覆盖（AC-HS6）；
- **双端纪律**：各端独立实现、语义同源——本批 **CLI 单端**（VSC 仓无 hooks 引擎——§21.1 勘察），VSC 零碰、不做 byte-identical；
  VSC 差异登记 + 父侧排程（§21.9）；
- **文档宽度 / 计数（D3）**：本批触碰四档零新增违规（AC-HS7）；事件计数陈述（四类）与列表同改。

### 21.9 边界（本批不做）与登记项

- **不做**：OS 级通知设施（弹窗 / 声音——用户脚本面）· 工具化通知 · 逐内层轮触发 · 子代理 Stop ·
  hooks 引擎既有语义改动 · TUI 面改动 · 新建档；
- **登记（父侧排程——所需档 + 用途 + 完整修复路径）**：
  1. `docs/design/TOOLS.md` §3 hooks 行（`TOOLS.md:38`）——**1 行替换**，目标文本：
     「- **hooks**：PreToolUse / PostToolUse / PostToolUseFailure / Stop 用户脚本（配置在 `~/.thincoder/config.json` 的
     `hooks` 键；PreToolUse 可阻断；Stop = 主会话 run 终止事件）。事件表与载荷契约 = AGENT-LOOP §21.3 / `src/hooks.mjs` 头。」
     （同时纠正 `~/.thincoder/hooks/` 路径误述）；
  2. hooks 引擎失败可诊断面（`ev:hook` 事件 / 全族可见化）——独立批评估（§21.4-⑥）；
  3. VSC 差异：VSC 无 hooks 引擎 → 无 Stop 面（如需对位 = 独立批；挂载点 = `thincoder-vscode/src/agent/run-stages.mjs`）；
- **存量面不回改**：`README.md:306`（0.9.0 历史变更史）与 `_archive/ROADMAP-0.9.0.md` 为历史记录——不重写
  （功能面露出随发布批，父侧定）；
- **UI / 交互决策（本批）**：零 UI 变更（无新控件 / 无渲染改动——用户可见面 = 其自有脚本产物）；无 open 交互项。

**未确认面（open）**：① 口径确认——「每回合」在本设计读作**每次主会话 run 终止**（用户可见「一次回答」）；
若用户本意含「每个内层工具轮」则另需裁定（本批按前者设计——通知风暴与「回答结束」语义相悖，§21.4-①）；
② 未来 CLI 若引入非用户源 `AbortError`（如请求超时 abort），Stop 对该类终止静默——彼时按 `reason` 扩展（独立批）。

**变更记录**：2026-09-11 第 30 批——Stop 钩子（主会话 run 结束事件）+ Notification 死声明除名（新增本节；需求档 §7 同批落地；TOOLS.md §3 更新登记父侧）。
同日评审轮次 1 后修正轮（🟡1 + 🔵3 全落）——配置注入面复核（既有缝 = `ctx.agent.config` 参数注入；零新增缝）· 状态行 / 影响表括注改「+Stop / 路径纠错」·
T-HS2 改信号同步（墙钟余量消除）+ 归册按实测 · T-HS1 删「宿主返回不等待」半句 · §21.6 注记统一轮询上限 / 失败信息。

## 22. digest 注入预算统一（群 B 批 B5——双端语义源）（2026-09-11）

> 来源：批次档 `../batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §1 条目 B5（`docs/TODO.md` 需求池行；BATCH-3 交付偏差承接口）。
> 需求 = `AGENT-LOOP（VSC 仓·需求）§11`（F-I2 / N-I1~N-I3——指针不重述；**本批迁对端**——台账自持批：
> VSC 端托管族七节自本端 `../requirements/AGENT-LOOP.md` 迁出，移出清单见该档档首）。
> 双端纪律：语义同源、各端独立实现、零跨仓依赖；VSC 面落 `AGENT-LOOP（VSC 仓）§16`（镜像）。
> 冻结面：§9 / §11 / §14 已交付契约零碰（只扩预算覆盖，不改轮界定 / 标签 / 墓碑语义）；VSC 仓零写入。

### 22.1 问题（现状复核 as-of 2026-09-11）

预算现覆盖（CLI 面）= subagent / advisor / escalate 三族（共用 `injectAsyncResult`——`src/agent-tools/subagent-async.mjs:325-363 / 373-405`）；
consult 族绕过：`injectConsultResult`（`thincoder-core/agent-tools/consult.mjs:181-188`）——offload 预览只有单条保护、无轮累计。
注入路径：run-start 注入（`src/agent.mjs:103-110`）+ 挂起退出残余（`src/tui/suspension-drive.mjs:280-286`）——role 分支两处内联，consult 两路皆绕过。
BATCH-3 F-2 原始事故面（1.3MB 请求体）+ 交付偏差记录（`docs/design/_archive/BATCH-3-STRUCTURE.md` 变更记录：「四族共用单点」与实际派发不符——扩面需新任务重评审）。
多族合并轮（subagent + consult 同轮）累计超限可复现。

### 22.2 方案选型（候选 ≥2——与 VSC §16.2 同三候选）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **共享叶子模块 `digest-budget.mjs`（单源）+ 四族全接线** | 常量 / 判超 / 记账 / 落盘四处合一（D2）；派发与直采路径全覆盖；`subagent-async.mjs` 释放 ~25 行 | 新档 ~70 + consult 接线 +2~4 行 | **选定** |
| 2 | 只在 role 分支调用点统一（`agent.mjs` / `suspension-drive.mjs`） | 单点集中；但直采路径（回合尾 collect——`subagent-async.mjs` 内）不经调用点——覆盖不完备 | — | 否决 |
| 3 | 各注入器各自实现判超（不建模块） | 零新档；但记账双份/判超多份 = 多源漂移（D2）+ 跨族合计失效 | — | 否决 |

### 22.3 契约（逐条——实现对象；VSC 面同语义）

**D-DG1 单源模块（CLI 面）**：新档 `thincoder-core/agent-tools/digest-budget.mjs`——导出三件：`DIGEST_INJECT_BUDGET`（64×1024）；
`digestBudgetOver(agent, size)`（判超 + 记账——`used > 0 && used + size > BUDGET` 首条豁免保留；轮界定
`agent.history.length !== r.len + 1` 语义逐字自 `subagent-async.mjs:330-343` 迁入，键 = agent）；
`persistOverflowReport(raw, { tag })`（`configDir/tool-results` 落盘 + `cleanupOldToolResults` 轮转 + 清单行；失败 null——调用方回退 inline）。
测试缝 `_setDigestOffloadDirForTest` 随迁（原处 re-export）。

**D-DG2 接线点**：`injectAsyncResult`（subagent / advisor / escalate 三族——判超 / 落盘改调共享模块，标签与墓碑语义零变）；
`injectConsultResult`（consult 新接线——统一形态：raw 计入预算 → 超限 → 落盘清单行（失败回退 inline 预览））。

**D-DG3 计数口径**：计入预算的 `raw` = 报告 / 错误正文（不含 `[System reminder: …]` 标签行——与既有口径一致）；错误条目同计同落盘。

**D-DG4 兼容面**：`subagent-async.mjs` 保留 `DIGEST_INJECT_BUDGET` + `_setDigestOffloadDirForTest` re-export
（测试导入面零改——`test/async-settle.test.mjs:18`）；单条 offload 预览路径零改。

### 22.4 受影响文件（行数 as-of 2026-09-11 实测）

| # | 文件 | 现 | 预计 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/digest-budget.mjs` | 新 | ~70 | 单源模块（D-DG1） |
| 2 | `src/agent-tools/subagent-async.mjs` | 474 | ~450（净减） | 迁出 + re-export |
| 3 | `thincoder-core/agent-tools/consult.mjs` | 461 | ~465 | +接线 |
| 4 | `test/async-settle.test.mjs` | 349 | ~390 | T-DG1~T-DG3 |

### 22.5 用例表（T-DG1~T-DG3——CLI 面）

| # | 类型 | 输入 | 预期输出（断言） | 需求 |
|---|---|---|---|---|
| T-DG1 | 正常 | 同轮两条 consult（各 40K 正文——合计 80K > 64K）直驱 `injectConsultResult` | 首条 inline 预览；次条 = 清单行（全文落盘——读档断言）+ 不 inline 全文 | F-I2 |
| T-DG2 | 正常 | 三族既有路径超限形态（subagent / advisor / escalate 经 `injectAsyncResult`） | 清单行同规（迁移后行为恒等——零回归对照） | F-I2 |
| T-DG3 | 边界 | 跨族同轮：subagent 40K + consult 40K | 次条判超（**共享预算**——单源记账） | F-I2 |

### 22.6 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-B5-CLI-1 | T-DG1 / T-DG2 / T-DG3 绿 | F-I2 |
| AC-B5-CLI-2 | 既有预算用例零回归（`DIGEST_INJECT_BUDGET` / 测试缝 re-export 恒等） | N-I1 |
| AC-B5-CLI-3 | 行数实测对表（subagent-async 净减）+ CLI 快层全绿 + `check-doc-width` 新增违规 0 | N-I3 |

### 22.7 边界（本批不做）

- 不改轮界定（相邻注入 = 同轮）/ 各族标签与墓碑 / offload 单条路径；不做跨轮累计 / 全局配额；
- 不改 VSC 仓（镜像各自实现——`AGENT-LOOP（VSC 仓）§16`）；**零 UI 面**。

**计数（D3）**：用例 3（T-DG1~T-DG3）· AC 3（AC-B5-CLI-1~3）· 实施域 3 档改 + 1 档新（subagent-async / consult / 测试档 + digest-budget 新档）
· 文档域已落（本节 + 变更记录行）。

**变更记录**：2026-09-11 群 B 批——新增本节（digest 注入预算统一：单源模块 + 四族全接线；VSC 镜像 = `AGENT-LOOP（VSC 仓）§16`）。



---

## 23. 长会话内存上界：子代理族与轨迹存档（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 需求：`../requirements/AGENT-LOOP.md` §15（F-O1–F-O5 / N-O1–N-O4）。来源：批次档
> `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md` §1（勘察 C2/C4）。子代理人读线窗口机制与主 agent
> 同源（`SESSION.md` §14.3）——本节只落**子代理特有面**（捕获上限 / 释放点）与**轨迹存档面**。

### 23.1 问题陈述（证据 as-of 2026-09-11——实读）

| # | 事实 | 证据（file:line） |
|---|---|---|
| 1 | `_capturedOutput` = 子代理流式文本的**第二份全量拷贝**：逐 token `output += …; child._capturedOutput = output`——无上限；跨 Continue 续跑继续累积 | `src/agent/spawn-child.mjs:210-212` · `:218-228` |
| 2 | 消费面读时截断（2000/4000）——头部诊断价值有限、尾部（停在何处）优先 | `subagent-actions.mjs:445/456` · `thincoder-core/agent-tools/escalate-async.mjs:242/258`；例外：`subagent.mjs:354` 停止报告内联全量（再经通用 offload ≥64K 落盘） |
| 3 | 子代理人读线 `_fullHistory` 同主 agent：永不压缩、全量常驻（每个 child 一份） | `thincoder-core/context.mjs:163-180` · 子代理创建 `subagent-spawn.mjs:332-340` |
| 4 | 条目对 `entry.childAgent` 的引用**从不显式释放**（grep 阴性）——释放仅靠条目对象被回收 | `subagent-run.mjs:133` · `thincoder-core/agent-tools/escalate-async.mjs:198`（绑定）；`subagent-run.mjs:184`（池）· `async-settle.mjs:47-50`（pending） |
| 5 | 消化窗口：done-in-pool 驻留至回合尾收集/run 起始注入/挂起残差三消费点；挂起期（suspDriven）settled 留池等待消化 | `run-stages.mjs:233-239` · `agent.mjs:105-113` · `suspension-drive.mjs:283-289` · `run-stages.mjs:215-218/231` |
| 6 | 轨迹存档：单次调用**整对象图深拷贝**（redactValue 递归复制容器）+ 独立 `JSON.stringify`（第二份全尺寸字符串），在途无上限（fire-and-forget 不 await、无队列/计数）；本机实测单记录 1.0–1.9MB、分钟级连发 | `thincoder-core/traces/trace-store.mjs:117-126` · `:157-177` · `:171` · `:188-196`；实测（本机 traces 目录） |
| 7 | 序号分配每次同步扫目录（`existsSync` + `readdirSync`） | `thincoder-core/traces/trace-store.mjs:85-106` |

### 23.2 方案选型对比

**表 1：`_capturedOutput` 上界形态**（判据：有界 / 消费面保真 / 成本 / 复杂度）

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **滞后水位截断**（超 hard=128K → 裁至头 16K + 标记 + 尾 48K；摊还 O(1)） | 消费面读 2K/4K——头尾保真覆盖；停止报告内联场景有截断标记；无 IO、无新增生命周期 | **选定** |
| 2 | 超限落盘全文 + 指针 | 「截断≠丢失」最强；但为被停子代理的部分输出引入热路径落盘 + 文件生命周期（收益低——完整文本已随 relay 进父侧显示/日志面） | 否决 |
| 3 | 环形窗口（保尾丢头） | 丢失「从哪开始」——停止报告头段即断 | 否决（头尾双保更优） |

**表 2：释放点形态**（`childAgent`/`report`）

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **消化注入完成后置空**（三消费点同点；幂等守卫） | 池内窗口（未消化）语义零变；释放点收敛在「文本已进父历史」之后 | **选定** |
| 2 | settle 时刻置空 | 破坏未消化期的 `status`/`observe`（done 条目读 child 摘要）——窗口内行为回归 | 否决 |
| 3 | 不置空（现状） | 条目被回收前长挂 child（挂起期 = 分钟级驻留） | 否决 |

**表 3：轨迹单记录写入形态**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **单遍序列化（脱敏内联）+ 内容额度** | 免对象图拷贝与二次全量字符串；峰值 ≈ 单份受限字符串；字段集不变 | **选定** |
| 2 | 保留深拷贝、仅加内容额 | 拷贝仍在（容器图 + 字符串对象）——峰值降幅有限 | 否决 |
| 3 | 降级为「仅存元数据」 | 分析价值丢失（轨迹目的 = 逐轮分析） | 否决 |

**表 4：在途上界与序号**

| # | 候选 | 评估 | 结论 |
|---|---|---|---|
| 1 | **待写计数上限 8 + 超限丢弃计数 + 序号进程内缓存** | 峰值 ≤ 8 × 记录上限；丢弃可观测；消除逐调用目录扫 | **选定** |
| 2 | 串行队列（无丢） | 写盘慢时队列无限增长（掩盖问题）；与本模块「尽力面」不符 | 否决 |
| 3 | 保持无限待写 | 爆炸半径 = 突发条数 × 单记录——本批要治的面 | 否决 |

### 23.3 契约（实现对象）

**23.3.1 子代理面**

- **人读线窗口**：子代理创建时置 `child._historyWindow = RECORD_WINDOW_MESSAGES`（200——常量单源
  `session-store.mjs`；机制 = `context.mjs` pushReal 驱逐——与主 agent 同路径）。
- **捕获截断**：`spawn-child.mjs` 捕获闭包改为 `output = appendCappedText(output, t, CAPTURE_CAP_OPTS)`
  后赋值 `child._capturedOutput`——`CAPTURE_CAP_OPTS = { hard: 131_072, head: 16_384, tail: 49_152,
  marker: "… [captured output truncated: N chars omitted] …" }`（输出 ≤64K+标记；续跑同闭包累积，
  语义一致）。
- **释放**：新 helper `releaseSettledEntry(entry)`（`async-settle.mjs`）——`entry.childAgent = null;
  entry.report = null`（幂等）；三消费点注入完成后调用：`run-stages.mjs:233-239` ·
  `agent.mjs:105-113` · `suspension-drive.mjs:283-289`。池内/挂起未消化窗口零变化。
- **纯函数单源**：`capText` / `appendCappedText` 本体 = `thincoder-core/text-budget.mjs`（零依赖纯函数；
  TUI 面 `display-budget.mjs` 与 agent 面共用——D2）。

**23.3.2 轨迹面（`trace-store.mjs`）**

- **单遍序列化**：`record = serializeRecord(fields)`——字符串字段经 `redactSecret(fieldKey, s)`
  后直接写入输出缓冲（数组/对象逐层手写 JSON 结构）；**不再构造复制图**；输出与既有
  `JSON.stringify` 形态同构（字段名/次序保持）。
- **内容额度**：消息内容/推理/工具参数串 > `TRACE_MESSAGE_MAX_CHARS = 65_536` → 头 16K + 中段
  标记 + 尾 48K（与工具预览同族）；序列化后总长 > `TRACE_RECORD_MAX_CHARS = 4_000_000` →
  `messages` 字段整体降级为 stub 串（`"[trace record truncated for size: N chars / M messages]"`），
  其余字段保留；两处均新增标记字段可断言。
- **在途上界**：模块级 `pending` 计数（写盘 IIFE 进入 +1、settle −1）；达
  `TRACE_PENDING_MAX = 8` → 本记录丢弃，`_dropped` 计数 +1，首次饱和打一行 stderr
  `[trace] pending write queue full — N record(s) dropped`（每饱和段一次）。
- **序号缓存**：`seqCache: Map<dayDir, maxSeq>`——首次 `readdirSync` 后进程内递增预留；
  目录被清理（retention）后取下界重扫一次（防御）。**多进程语义（修正轮 #10——登记）**：同 cwd
  多实例各自进程内缓存——seq 可撞、同 sessionKey 记录并入同名文件（append 不覆写）；**可容忍**
  （本机 traces = 诊断面、默认 OFF、撞号不损坏数据）；不做跨进程协调/落盘校验。
- 开关/字段/落点/保留期/清理零改。**D2 指针**：§13 为轨迹机制权威——本批已在 §13 追加内容
  额度修订行（截断 = 内容面——修正轮 #2）；本节承载实现细节（单遍序列化 + 内容额度 + 在途
  上界 + seqCache）。

### 23.4 关键决策记录（含否决备选）

- **D-SM1 捕获 = 滞后水位截断**（表 1）：hard 128K → 头 16K / 尾 48K——读时消费者（2K/4K）
  语义等价；停止报告内联场景出现截断标记（可断言）。
- **D-SM2 释放 = 注入完成后置空**（表 2）：池内窗口零变；三消费点 + 幂等 helper。
- **D-SM3 子代理窗口复用主 agent 机制**（`_historyWindow`）——不另造第二套。
- **D-TR1 单遍序列化**（表 3）：脱敏内联、零复制图；字段集与形态逐字保持。
- **D-TR2 额度双层**（单消息 64K / 单记录 4M）+ **不降到无内容**（stub 保计数）；实测合法
  记录 ≤1.9MB 不受影响（4M 上限留头寸）。
- **D-TR3 上界 = 丢弃计数（尽力面）**（表 4）；`seqCache` 同批修（消除逐调用同步扫）。
- **D-TR4 不新增配置项**：额度为编译期常量（轨迹为诊断面——默认 OFF 时零成本）。

### 23.5 受影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11）

| 文件 | 当前行数 | 预计增量 | 变更点 |
|---|---|---|---|
| `thincoder-core/text-budget.mjs` | 新 | +80 ± 20 | capText / appendCappedText（零依赖纯函数） |
| `src/agent/spawn-child.mjs` | 229 | +14 | 捕获闭包截断（常量 + 标记） |
| `src/agent-tools/subagent-spawn.mjs` | 454 | +3 | 子代理 `_historyWindow` 置位 |
| `src/agent-tools/async-settle.mjs` | 192 | +10 | `releaseSettledEntry` helper |
| `src/agent/run-stages.mjs` | 243 | +4 | 消费点调用释放 |
| `src/agent.mjs` | 414 | +6 | run 起始注入点调用释放 |
| `src/tui/suspension-drive.mjs` | 298 | +4 | 挂起残差消费点调用释放 |
| `thincoder-core/agent-tools/escalate-async.mjs` | 290 | +2 | 注释锚（childAgent 语义面）+ 若有族特有消费点则补调 |
| `thincoder-core/traces/trace-store.mjs` | 225 | +55 → ~280 | 单遍序列化 + 双层额度 + 在途计数 + seqCache + **头注释同步**（「不截断」表述作废——§13 修订行；修正轮 #2） |
| `test/subagent-memory-bounds.test.mjs` | 新 | +130 ± 30 | T-SM1–T-SM4 |
| `test/trace-bounds.test.mjs` | 新 | +130 ± 30 | T-TR1–T-TR5 |

> 拆分结论：全部 ≤500；`subagent-spawn.mjs`（457）与 `agent.mjs`（420）越 300 咨询线——登记、
> 不拆（既定口径）；`escalate-async.mjs`（292）临界登记。

### 23.6 用例表（正常 / 边界 / 错误）

| # | 层 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T-SM1 | 快层 unit | 捕获截断 | 模拟 token 流累计 10MB | `_capturedOutput.length ≤ 131_072`；头 16K 原样、尾 48K 原样（首尾子串断言）；标记含省略数 | F-O2 |
| T-SM2 | 快层 unit | 捕获额下零改 | 累计 8KB | 逐字等于输入拼接（无标记——负断言） | F-O2/N-O2 |
| T-SM3 | 快层 unit | 子代理窗口 | 子代理 pushReal 300 条 | `_fullHistory.length == 200` 且为最新；observe `recentTurnLines` 取 5 回合正常 | F-O1 |
| T-SM4 | 快层 unit | 释放点 | fake 条目 settle→注入完成 | 注入后 `childAgent === null && report === null`；注入前非 null（窗口内）；幂等重入不抛 | F-O3 |
| T-TR1 | 快层 unit | 单遍序列化等价 | 固定字段集（含敏感串/嵌套） | 输出 JSON parse 后与 §13 元数据字段清单逐字段相等（参照物 = §13 清单——本仓无既有轨迹用例：新档自身为参照实现，修正轮 #9）；敏感串被脱敏 | F-O4 |
| T-TR2 | 快层 unit | 单消息额度 | 一条 1MB content | 该串 ≤64K+标记；首尾保真 | F-O4 |
| T-TR3 | 快层 unit | 单记录额度 | 构造 >4MB | `messages` 为 stub、元数据字段保留、标记含计数 | F-O4 |
| T-TR4 | 快层 unit | 在途上界 | 注入慢写替身 + 连发 20 条 | 在途 ≤8；丢弃计数 = 12；stderr 饱和行一次 | F-O5/N-O3 |
| T-TR5 | 快层 unit | 序号缓存 | 连续 3 次调用注入 fake fs | `readdirSync` 恰 1 次；seq 递增且不撞号 | F-O5 |

### 23.7 验收标准（逐条回指需求——可机判）

| AC | 回指 | 判据（机验） |
|---|---|---|
| AC-O1 | F-O1 | T-SM3 绿；`RECORD_WINDOW_MESSAGES` 单源（grep = 200） |
| AC-O2 | F-O2 | T-SM1/T-SM2 绿；捕获常量经 `text-budget.mjs` 单源 |
| AC-O3 | F-O3 | T-SM4 绿（释放语义行为面）；三消费点 grep（释放调用在位）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） |
| AC-O4 | F-O4 | T-TR1/T-TR2/T-TR3 绿；字段集对照 = `AGENT-LOOP.md` §13 字段清单（修正轮 #9——本仓无既有轨迹用例，锚点改指 §13；新档自身为参照实现） |
| AC-O5 | F-O5 | T-TR4/T-TR5 绿；`TRACE_PENDING_MAX` 单源 |
| AC-O6 | N-O2 | 既有族全绿：`test/async-settle.test.mjs` · `test/subagent-observe-send.test.mjs` · `test/subagent-scheduler.test.mjs` · `test/integration/subagent-lifecycle.test.mjs`；digest 注入预算用例零伤（§22） |
| AC-O7 | N-O3 | 丢弃/截断标记断言（T-SM1/T-TR3/T-TR4） |
| AC-O8 | N-O4 | 触碰档 ≤500；`check-doc-width` 新增违规 0 |

### 23.8 边界（本批不做）

- 不做报告（`entry.report`）内容截断（报告为交付物——完整放行；靠释放点与 digest 预算治理）；
- 不改 settle/挂起状态机与 digest 注入（§22 机制零动）；不做轨迹重放/自动清理外的生命周期；
- 不做 VSC 端（其轨迹面约定不实现——既有登记；子代理面 VSC 各自实现）。
