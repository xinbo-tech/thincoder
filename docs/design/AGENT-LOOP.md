# Agent 主循环设计（thincoder/src/agent.mjs + agent/）

> 状态：2026-08 回补 + 2026-09 增量（挂起回合 §17/工程交付协议 §18/工具面合并 §19——各节自带状态——2026-09-03 刷新（§7.2.3/§17.5/§17.5.5/§19.5/§19.6/§20/§17.6——sync spawn 精确冻结/settle 完成队列/实测修订/控制面扩展/panel 检查）——**2026-09-04 增量：§18.5-§18.12（子代理零 git/轨迹存档/测试分层/对象锚/铁律/镜像约束取消/verify 定位修复——各节自带状态行）**）。LLM ↔ 工具调用循环：回合驱动、guard 体系（pending tasks / verify / advisor / 诚实声明）、中断语义、子代理、压缩/用量锚点、停滞检测、goal 预算。

## 1. 模块地图

| 文件 | 职责 |
|---|---|
| `agent.mjs` | runAgent 主循环：prepareRun → turn 循环 → chat → 分发 → 后处理；ContinueError/resume；usage 基线。结果提交/记账已拆至 `agent/record-results.mjs`（2026-08-30 consult） |
| `agent/setup.mjs` | prepareRun：上下文注入（git/目录/指令/记忆/文档/outline）、system prompt 组装、阈值解析 |
| `agent/dispatch.mjs` | executeToolCalls：两段调度（权限预审 → 顺序保序执行）、hooks、错误落盘；onToolCall/onToolOutput/onToolResult 三回调贯穿 toolCallId（并行同名工具在 TUI 侧按 id 精确路由，2026-08-30）；read_image 等多模态工具按 `tool.multimodal` flag 跳过 offload |
| `agent/completion.mjs` | handleCompletion：零工具调用回合的 guard 链（pending → verify → advisor → 收尾） |
| `agent/post-turn.mjs` | 回合后注入：停滞检测、goal 预算预警 |
| `agent/helpers.mjs` | 常量（turn 上限、结果落盘阈值）、escapeXml、repairHistory、AUTO_REMINDER/ensureAutoReminder 单源、git 上下文、目录树 |
| `agent/record-results.mjs` | 工具结果提交 + 变更记账（2026-08-30 consult P2 自 agent.mjs 拆出）：tool 消息落盘（多模态延迟注入——图像不得插在并行工具结果之间）、FILE_MUTATORS 失效链（advisor/verify 状态）、touchedFiles + fire-and-forget reindex |
| `auto-think.mjs` | 任务难度分类 → 自动设置 reasoning effort（opt-in） |
| `agent/spawn-child.mjs` | 子代理统一管线（§7.2 D3 新增，round3 #6 补录）：makeRelay / wrapChildCallbacks / runWithContinue / ensureChildApiKey / clampEffort / `⟦ev⟧` strip——subagent/escalate/consult 共享 |

## 2. runAgent 主循环

```
runAgent(agent, input, callbacks, { depth, signal, maxTurns, resume })
  1. prepareRun：注入上下文 + 组装 systemPrompt/tools/schema + 阈值（详见 §3）
  2. 非 resume 时重置 per-run 状态（mutation/verify/advisor/touchedFiles/emptyRetries/compressFailures）
  3. turn 循环（≤ maxTurns，默认 200；goal 模式 200；子代理 100）：
     a. 压缩检查（仅 lastRole ∈ {user, tool} 安全点；见 CONTEXT-COMPACTION.md）
     b. plan-mode 提醒节流注入、工程模式状态注入
     c. autoThink 分类（turn 0 且配置开启）
     d. chat()（流式；onToken/onReasoning/onWait 透传；streamRules 共享 firedPatterns）
     e. 响应后处理：流规则 abort/warn、用户中断（Ctrl+I）、usage 基线、异常 finishReason 提醒
     f. 有 toolCalls → executeToolCalls（§4）→ 结果回喂 → 回到 a
       无 toolCalls → handleCompletion（§5）→ done / continue（guard 推回）
  4. 超 turn 上限 → throw ContinueError。**续跑决策统一规则（2026-09-02 用户裁定：工程模式 && AUTO 开 → 自动续跑，不弹面板不询问——AUTO = 用户授权无人值守，责任在用户）**：`engineering && autoApprove → 自动 resume 续跑`（resume 保 guard 状态）；否则 TUI 询问是否续跑（续跑走 resume）。规则适用于所有回合（depth-0 用户回合 / auto-turn；depth>0 子代理同规则——async 子代理无面板通道时 AUTO && 工程 → 自动续跑，否则维持"失败返回报告"语义见 §15）
```

**中断语义**（AbortController + signal.reason）：
- `controller.abort()`（Ctrl+C **二按**全停 / **无 /abort 命令**——评审 #1：/abort 不存在（17.6.4 核对）——本行 Ctrl+C 映射随 §17.6 修订）：当前 chat 抛 AbortError → runAgent 直接上抛，不提交半截历史——**supersede（2026-09-03 §17.6）：processing 态 Ctrl+C 首按 = interrupt 无 message（停回合不清池——部分输出提交）——二按才平 abort 全停——见 §17.6.2**
- `controller.abort({ interrupt: true, message })`（Ctrl+I）：chat 中断 → 提交部分输出（pushReal）+ 注入 `[User interrupt: message]` → 抛 AbortError；**agent-turn 捕获后重建 controller 续跑**——同一轮内继续，用户消息即时生效
- 工具执行期间中断：`signal.reason.interrupt` → **先为已提交的 tool_calls 合成占位 tool 结果**（`[Tool execution interrupted — results discarded]`，tool 消息必须紧跟 assistant tool_calls——否则 strict provider 对重试轮 400）**再注入中断消息**后 continue（2026-08-30 consult）
- 中断清扫（runAgentTurn finally）：`freezeAllSubTasks` + `sweepToolBlocks`（未 done 的工具载体标 done+interrupted、清 `_toolTicks`）——保证无 running 残留、无陈旧计时泄漏；`state.dims.refresh()`（输出停止 = ConPTY buffer 信息恢复的确定性时刻）

**resume（ContinueError 续跑）**：`agent._mutatedThisRun/_verifiedThisRun/_verifyRetries/_touchedFiles/_advisorRound` 等 **保留**——guard 连续性和收敛预算不能被续跑重置；`_emptyRetries/_compressFailures` 也保留（预算跨 turn 计数，防刷）。

## 3. prepareRun 上下文注入（setup.mjs）

按序注入（全部 `role: "user"` 机读消息，带 `transient` 标记的落盘时过滤）：
1. **git 上下文**（顶层）：分支、最近 5 条提交、未提交改动清单（非 git 仓库静默跳过）
2. **目录树**（顶层）：`listWorkDir`（根 ≤30 项、子目录 ≤10 项，隐藏折叠，超限截断）
3. **项目指令**：AGENTS.md / CLAUDE.md / project_rules.md（≤32K 字符，`<untrusted_project_instructions>` 包裹）
4. **记忆检索**：`memory_search(input)` 前 3 条（`<untrusted_memory>` 包裹 + XML 转义）
5. **文档检索**：doc_search 前 5 条 chunk（`<untrusted_doc_chunk>` 包裹）
6. **依赖大纲**：repomap 输出（`OUTLINE_INJECT_PREFIX`）
7. 用户输入（pushReal：双线）
8. 多模态图像（视觉模型：附加到首条 user 消息）

**system prompt 字节稳定**（前缀缓存契约）：跨 run 逐字节不变——每轮变化的记忆/文档注入走 user 上下文消息而非 system；`Session start` 时间戳每会话固定一次（`_sessionStart`）。有回归测试断言两次请求 system 消息逐字节相等。

## 4. 工具调度（dispatch.mjs，两段式）

**Phase 1 预审**（全部 toolCalls 先过一遍，任一被拒不影响其他）：
```
JSON 参数解析失败 → error
未知工具 → error
planMode && 非只读 → denied "plan mode"
eng-coder && 未过设计评审 && FILE_MUTATORS → denied "engineering design gate"
父 agent && 工程模式 && 无设计 token && 触及代码文件 → denied（docs/ 与根级文档豁免）
非只读 && !autoApprove → onPermissionRequest（用户确认）；无 handler → denied
PreToolUse hooks → 阻断
```
**Phase 2 执行**（**顺序保序**）：只读工具 + `parallel` 标记的工具可并行（Promise.all 一批），非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前副作用工具 `snapshotForUndo`（/undo 回滚基线）；结果超限落盘 `~/.thincoder/tool-results/`（阈值以 TOOL-OUTPUT-LIMITS-*.md 为权威源 + `agent/helpers.mjs` TOOL_RESULT_OFFLOAD_LIMIT 常量，round3 #3 去重——此处不再复述取值沿革——**预览 64K（2026-08-24——权威源 TOOL-OUTPUT-LIMITS-TUNING.md——2026-09-04 §5 修订：头 16K+尾 48K 双端预览——见 TUNING §5）**）；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace 防路径泄露）；PostToolUse 钩子 fire-and-forget。**console 回显（2026-08-31 工具顺手度，用户批准"你做吧"）**：dispatch 拦截工具 `execute` 期间的 `console.log`/`console.error`（原只到终端、模型看不到），收集后附在工具结果后回显给模型（`[console during <tool>]` 段）；异常路径（工具抛错前的探查输出——调试最有价值）同样回显；嵌套 dispatch（subagent）各自拦截/恢复、捕获分离；bash 工具输出走子进程回显（onOutput）不受影响。

## 5. 零工具调用回合（completion.mjs handleCompletion）

顺序（每个 guard 推回一次后 continue，直到通过）：
1. **空响应恢复**（IK60QP）：`!response.content` → 注入 `[System reminder: your last response was empty…]` 重试，上限 `MAX_EMPTY_RETRIES=2`（每次用户消息重置），仍空才抛原错误（含 /think 降档建议）
2. **pending tasks 提醒**：有 pending → 注入任务列表提醒并继续循环（模型更新 task 状态后再收尾）；**最多推回一次**（`_taskPushbacks`，task 工具更新列表即重置）——模型第二次坚持收尾则放行，避免 pending 项无法解决时无限循环
3. **verify guard**（opt-in `verifyGuard: true`，工程模式除外）：改过代码未 verify → 推回调 verify（≤2 次）；verify 失败 → 推回修复（≤3 次）；耗尽 → 诚实声明提醒（必须说明哪些测试失败/试了什么/根因）
4. **advisor guard**（opt-in `advisor.guard === true`，工程模式除外）：改过代码未评审 → 推回调 advisor（≤3 轮，收敛协议见 ADVISOR-CONVERGENCE.md）。advisor 评审能力本身**恒启用**（不依赖任何开关，未配 advisor.provider 时评审继承主 provider）——`advisor.enabled` 字段已废弃（2026-08-21 语义重构，见下）。**guard 是会话级（2026-08-29）**：初值优先读会话槽位（`/advisor` guard 切换、`saveSession`/`applySession` 往返 `data.advisor.guard`），config.json `agent.advisor.guard` 退为兼容镜像——详见 ENGINEERING-MODE.md §5「配置与会话恢复」（同一机制的权威描述——评审 round3 #5 节题对齐）。
5. 通过 → pushReal assistant 回复 + 返回 content

## 6. 回合后注入（post-turn.mjs）

- **停滞检测**：同一工具+同一参数序列化签名连续 3 次 → 注入"你在原地空转，换条路或求助"（窗口 5）
- **goal 预算**：goal 活跃时每轮注入目标/已用 turn 数；用满 75% 时预警；`goal complete` 需验证证据门槛（见 goal 工具）

## 7. 子代理（subagent 工具）

- `depth > 0`：独立 agent 对象 + 丢弃式局部双线；role（explore/plan/coder/eng-coder）决定工具集（只读过滤）与 overlay prompt
- 流式 relay：`role#id/` 前缀 token 转发给父回调。**TUI 消费端沿革**：2026-08-21 为 subTasks 窄带（连字符正则修复 `/^(\w+)#(\d+)\//` → `/^([\w-]+)#(\d+)\//`——`\w` 不含连字符，`eng-coder#N/` 漏路由致带前缀 token 落入主流刷屏；test/agent-turn.test.mjs 4 断言）；2026-08-29 起 §7.2 D4 定稿：消费端改为会话流内可折叠区块、窄带退役——上述断言随 §7.2 实现按 T-B/T-H 演进，前缀格式与正则不变（round3 #2 压缩为一行沿革）。VS Code 无此机制（子 agent 走 onToolPanel 通道），不涉及。
- 报告契约：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留
- 权限：手动模式下子代理的非只读工具透传到父 agent 的权限审批（人在回路）——**eng-coder 例外：spawn 时任务域授权（已批准设计+任务书即授权）——内部写豁免逐写审批（不弹面板）——见 §18 D-E3（T-E12）**；非 eng-coder 子代理（explore/coder 等）手动档语义不变
- eng-coder：设计 token 门控（designId 多槽 `_engDesignTokens`——评审通过 token 入槽、advisor 结果回显 designId；兼容单槽 `_engDesignToken` 镜像；权威源见 ENGINEERING-MODE.md §2.6——评审 #4）
### 7.1 子代理工具描述：角色能力矩阵 + 委派动机（2026-08-28）

**需求**（用户研究驱动）：父模型从 subagent 工具 description 只能拿到一行角色标签（explore/plan/coder/eng-coder 各一句），缺"角色×工具×注入×报告契约"能力对照与委派动机——该用哪个角色、为何委派靠猜；且 description 泄漏开发注释（`ENUM IS OVERRIDDEN IN setup.mjs PER ENGINEERING MODE`）。对照参考项目（kimi-code profile 描述动态渲染 / opencode registry"可见性=权限"）+ ThinCoder 既有机制（§7：多角色 overlay、只读过滤、git 注入、报告契约、delivery 表）定案。

**设计**（两端 `src/agent-tools/subagent.mjs` description 逐字对齐）：
- **Available roles 矩阵**：explore（只读查询族/**零 git——不注入 git 上下文，见 §18.5**/报告须列未找到项/thoroughness 三档）、plan（纯只读规划）、coder（父全量读写执行 + verify/advisor 自评 + 强制交付表）、eng-coder（工程模式替换 coder + 设计驱动 overlay + 必带 designToken）
- **Mode filtering 说明**：普通模式 explore/plan/coder，工程模式 explore/plan/eng-coder，schema enum 反映现行模式
- **Why delegate? 段**：隔离上下文（子 agent 全部读写调用不进父窗口）+ 单任务专注 + 并行省时 + coder/eng-coder 自带 verify/advisor 自评（交付前已验）
- role 参数 description 清理开发注释泄漏（指向工具描述能力矩阵）

**测试**：`test/subagent.test.mjs` 内容断言（两端各一）——probe `Available roles` / `Why delegate?` / `already verified` / `- explore` / `- plan` / `- coder` / `- eng-coder` / `git context auto-injected` / `delivery transparency table` / `Mode filtering`；且 description 与 role 描述不得含 `OVERRIDDEN` / `SETUP.MJS`（防开发注释泄漏回归）。

**研究对照结论（归档）**：kimi-code / opencode 双参考仓探索（2026-08-28）。已落档位 A（静态矩阵）；档位 B（按模式+调用方 allowlist 动态渲染角色×工具，工具集变化自动跟随）入 `docs/TODO.md`。其余差距修正记录：报告长度门禁 ThinCoder **已有**（`MIN_REPORT_CHARS` §7:87，kimi 同能力）——真正缺失的是**可配置化**（minChars/retries/continuationPrompt 挂 profile，kimi）与**子代理实体化 resume 生命周期**（agent_id 持久化续跑，kimi，candidate）；**嵌套深度硬上限 + "子代理默认禁再启子代理"**（opencode，信任层 candidate）；git remote 公共 host 白名单 sanitize（kimi，安全 candidate）。反向结论：ThinCoder 的父上下文注入（`Context:`/`Task:` 包装）+ 记忆/checklist/outline 注入参考项目所无（更主动），保留。

**受影响文件**：`src/agent-tools/subagent.mjs`（description + role 参数）、`src/agent/setup.mjs`（depth-0 组装时 role 参数被 `subagentRoles` 覆盖——2026-08-28 复查发现并统一为同一矩阵引用文本；subagent 工具仅 depth-0 注入，工具内直改的 role 描述若不同步 setup 就是死文本）、`test/subagent.test.mjs`（内容断言）；VS Code 端同款（其 `docs/design/ARCHITECTURE.md` 引用段；role 覆盖点为其 `modeRoleField`，有 mode 互斥 + 描述一致性双测试）。

### 7.2 子agent 活动输出统一（2026-08-29 定稿：需求 + 设计）

> **状态：已实现（2026-08-30 两端落地，§7.2 交付批次——round3 #6 补注）**。

**问题**（用户实证：coder/eng-coder 运行"像卡住了"）：输出通道只覆盖 LLM 生成窗口——① 子agent 的工具输出完全不 relay（subagent/escalate/consult 的 childCallbacks 均无 onToolOutput），长工具（npm test / dotnet build）执行期窄带钉死在工具名上；② TUI 丢弃子agent reasoning（agent-turn.mjs 前缀分支只建条目不追加内容）；③ 运行中无计时/turn 进度（elapsed 仅 done 后显示）；④ 等权限审批不可见（手动模式下分不清"在等人"和"卡死"）；⑤ 无占位/心跳。另有重复实现：counter/relayPrefix/`[model]` 元数据/callbacks 包装 ×3 份、turn-cap continue 循环 ×3 份、apiKey 检查 ×4 处、effort 枚举钳制 ×2 份。

**功能性需求**（用户故事总述：作为用户，我想在子agent 运行的任意时刻看到它当前在做什么——工具/输出/思考/等待/进度（round3 #4 补），以便区分"慢"与"卡死"；逐条：）F1 运行态可见——长工具执行期实时显示工具名+节流输出 tail；F2 思考可见——子agent reasoning 显示 tail（与主流 reasoning 同等待遇）；F3 等待可见——等审批时明确显示"等待审批：tool args"；F4 进度语义——`role · model · elapsed(跳动) · turn N/max`，turn 事件由 runAgent depth>0 统一发出（天然心跳）；F5 consult 顾问同等待遇；F6 advisor 输出收编统一契约（有序时间线持久化行为不变，kind 流对渲染端保持兼容映射）；F7 `{kind,text}` 定为 onToolOutput 正式契约（emit 端统一，消费端保留裸串一行容错）。

**UI/交互决策（用户拍板 2026-08-29）**：
- 子agent 活动显示为**主会话流内可折叠区块**：默认折叠 = 头部摘要行 + 最后几行 tail；展开 = 全部活动按时间序（token 流/工具输出/阶段与审批变化）；完成后**保留、可重新展开**——子agent 的工具调用不进父会话历史，区块是其活动唯一载体（与普通工具"完成收缩为 done 行、完整结果在工具消息"的语义刻意不同）
- 并行多子agent = 每个一个区块（各自独立折叠/展开）
- TUI subTasks 窄带退役，职责由区块接管
- 控制面不变：维持整体停（不做单独中止/跳过某个子agent）

**关键事实（锁定，防重复走查）**：subTasks 窄带只渲染带 `role#id/` 前缀的子agent 活动（`state.subTasks`）；普通工具输出走 onToolOutput → 工具单框载体（tool-events.mjs `_toolBlock`：参数 JSON + 流式输出 + 结果，`TOOL_OUTPUT_LINE_CAP=200`，2026-08-30 单框化取代 `_live` 行；TUI-TOOL-OUTPUT.md §2 为权威源）——两条路径数据结构与渲染分支完全分离，**窄带退役对非子agent 工具输出零影响**（2026-08-29 核实；TUI-TOOL-OUTPUT.md §4 交叉引用）。

**范围（用户裁定 2026-08-29；评审 #1 修订 2026-08-29）**：仅 CLI（thincoder）。生成侧 spawnChild 管线收编上述重复（subagent/escalate/consult 接入；advisor 内循环走契约对齐——见 F6 与下方"否决"第二条）；渲染侧仅 TUI（子agent 活动区块与 advisor 块共用折叠块渲染机制，见 D4）。VS Code 端不动（跟进项见 docs/TODO.md）；**ACP 例外**——bridge.mjs 的 `⟦ev⟧` 事件剥除纳入本轮（防本轮引入 ACP 会话回归，见 D7），前缀 token 透传的既有遗留仍在 TODO。

**不合并项（防过度抽象）**：consult 会话/队列语义、报告契约（MIN_REPORT_CHARS 扩写）、webview panels.js 卡片清理策略、resolveChildProvider（已是共享范本）。

**设计（2026-08-29 定稿）**

**D1 事件契约：不新增事件总线，`role#id/` 前缀 relay 扩展两个事件 token**

结构化事件继续走现有 token 管线（`onToken`），以保留字符开头、可机械识别的形式编码（哨兵串为罕见字符组合，正常内容混淆概率极低；生成侧仍对子 agent 文本 strip 哨兵序列防伪造——见 D7）。选择扩展现有管线而非新增 `onSubagentEvent` 回调的理由：① 生成侧（subagent/escalate/consult 三处 childCallbacks）与消费侧（TUI 前缀正则分流）均已存在且稳定，新增回调需要同时改 runAgent 签名、三个生成工具、TUI callbacks 装配——扩散面更大；② 未来端点接入时按既有前缀管线消费（注意：ACP 桥现状是前缀 token 原样透传，事件剥除见 D7——"天然继承"不成立，需端点各自适配）。

- 进度事件 token：带前缀的 onToken chunk，payload 形如 `⟦ev⟧turn\x1e{n}\x1e{max}\x1e{phase}\x1e{detail}`——以字面哨兵串 `⟦ev⟧` 开头（LLM 不会生成），`\x1e`（RS）作字段分隔。phase ∈ `llm | tool | approval | done`；detail 为工具名或审批描述（≤40 字符截断）。TUI 解析后**不进 blocks、不进主流**，仅更新区块头部状态；sanitizeDisplay 兜底 strip（防未来漏解析时控制字符入流）。
- **事件名 × 发射点 × 载体矩阵（round2 #3 修订，消歧；code review #7 补 §15 例外）**：`⟦ev⟧` token 常规只有两种——`turn`（runAgent depth>0 在 `_currentTurn` 更新处发，phase=llm，{n}/{max} 必填）与 `approval`（dispatch.mjs 权限询问处发，{n}/{max} 取子 agent 当前 turn 计数）；**tool/done phase 不发 token**——由既有 onToolCall/onToolResult 前缀 relay 承担（TUI 前缀分支更新 currentTool 与 done 状态，即 D4）。**§15 例外：`done`**——仅 async 子代理回合收尾集合完成后由 agent.mjs 发（见 §15 D-A3；**§17 D-S8 修订：挂起态延迟至池空冻结补发，round2 #1**），TUI 冻结区块信号（同步子代理的 done 仍由 onToolResult 前缀 relay 承担）。phase 枚举中的 `tool/done` 描述的是头部状态机的输入来源之一，不是 token 种类。——**superseded（2026-09-03）：事件族持续扩展——done（§15）/settled（§17）/stopped+async（§19.5）/queued+cancelled（§20）——各节为准**
- 模型元数据：沿用现有 `[model]` token，不重复设计。
- **F7 落地方式**：`onToolOutput` 的 `{kind,text}` 契约本已在 advisor/bash 中实际使用（advisor/run.mjs emit() 包装；bash 裸字符串由 TUI 兜底归一化）。本轮仅立规成文（TUI-TOOL-OUTPUT.md §2 已承载），不新增代码。
- 子agent 工具输出 relay：**复用 dispatch.mjs 的 onOutput → `callbacks.onToolOutput(name, chunk)` 既有接线**——生成侧 childCallbacks 增加 `onToolOutput: (name, chunk) => parent.onToolOutput(`${relayPrefix}${name}`, chunk)`，TUI 端 onToolOutput 对带前缀 name 剥前缀路由进对应区块（kind 解析复用既有 string→{kind,text} 归一化）。节流/截断由渲染层统一施加（生成层原样转发，保持各端自行决定展示粒度）。

**D2 runAgent depth>0 自动发进度事件（生成侧单点）**

runAgent turn 循环内 `agent._currentTurn` 更新处（`src/agent.mjs`，D2 emit 点），`depth > 0` 且 `callbacks.onToken` 存在时 emit 一个 turn 事件 token（含 phase）。工具执行期 phase 变化由 dispatch 层透传的 onToolCall/onToolResult 事件承担——即 D1 的 tool 事件。审批等待：dispatch.mjs 权限询问处 emit `approval` 事件（子agent 的 childPermission 透传链已存在，加一行 emit）。

**D3 生成侧统一：spawnChildAgent 管线模块（agent/spawn-child.mjs，新增）**

收编三份重复（收编范围以"机械同构"为界，业务差异留在各工具内）：
- `_subAgentCounter` + relayPrefix 生成 + `[model]` 元数据发送 → `makeRelay(parent, label)`
- onToken/onReasoning/onToolCall/**onToolOutput** 前缀包装 → `wrapChildCallbacks(relayPrefix, parentCallbacks)`
- turn-cap continue 循环骨架（ContinueError → "continue" 面板 → resume:true → 拒绝降级）→ `runWithContinue(runner, child, input, opts, { label, askContinue })`；差异点经参数注入：subagent 用 `_permQueue` 串行化，escalate 无 permQueue 直接询问，consult 用 session.continueQueue——`askContinue` 为回调参数
- apiKey trim/检查 → `ensureChildApiKey(provider, label)`
- effort 枚举钳制 → `clampEffort(provider, model, effort)`（consult/escalate 两份逐行拷贝合并）
- 不收编：角色过滤/overlay/git 注入/subagent 专属（报告契约、mergeChildMutations）、escalate 专属（touched-files、effortNote）、consult 专属（session 队列、watchdog、main_history 工具）

**D4 TUI 渲染：子agent 活动区块 = 会话流内可折叠块（退役窄带）**

复用现有两套机制拼装，不新造渲染器：
- **运行态（会话流内联）**：`state.subTasks[key]` 升级为完整活动缓冲 `{ key, role, model, started, done, blocks: [{kind,text}], currentTool, turn, maxTurns, approval, lastError }`（**approval 字段补列——§7.2.1 D2 ⏸ 图标的承载字段，由 `routeSubToken` 事件解析维护，评审 #9 结构定义补齐**）。onToken/onReasoning/onToolCall 前缀分支改写：reasoning token **追加进 blocks**（kind=think，不再丢弃）；onToolCall 更新 currentTool 并开新 block（kind=tool）；onToolOutput 带前缀分支把 chunk 追加进当前 tool block（保留换行结构）；turn 事件 token 更新 turn/maxTurns。onToolResult(subagent) 不再 3 秒删除，改为标记 done（头部 ✓）。**修复轮 2026-09-03（工具输出 raw 透传）**：routeSubToolOutput 此前每 relay chunk 强加 `+"\n"`——relay chunk 是子进程 stdout/LLM SSE 的任意字节边界碎片（无换行、切词中），逐 chunk 补 \n 把碎片切成独立显示行 + 词拦腰断 + 烧 N2 行配额（用户实测"逐 chunk 分行"）；且 tool-events 归一化先 trimEnd、吃掉 chunk 真实行尾 \n。修复：子agent 工具输出改 **raw 拼接**（emit 端 run.mjs/system/verify 自带换行结构，无损还原——本句"保留换行结构"契约落实）+ **子代理前缀路径绕过 trimEnd**（main path 保留逐行裁剪）。断言：subagent-blocks.test.mjs 路由合并用例 raw 预期、agent-turn.test.mjs T-Ab（真实 onToolOutput 管线）。
- **落位（渲染）**：子agent 区块渲染进会话流（render-conversation.mjs 新增 subagent blocks 段，位于 advisorBlocks 段之前），**段首带一条与会话区切分的分隔线**（`─` × cols-1，dim，与 task 面板顶部线同款，2026-08-30 用户要求；仅当存在运行中区块时出现——done 块已冻结进会话流，空段不留悬空线）：折叠态 = 头部摘要行 `[▶ coder#1 · glm-5.3 · 45s · turn 12/100] bash — npm test`（运行中 elapsed 由 1s ticker 刷新）+ tail 3 行（blocks 尾部；2026-08-30 用户拍板 2→3）；展开态 = blocks 全量按 kind 着色（think=C.reason、tool=C.tool、text=C.text），**经公共组件 fold-block.mjs renderBlockTimeline + renderExpandedBlock 渲染，展开封顶屏幕 60% + 底部可达折叠控制行（2026-08-30 用户报告驱动，TUI.md §5）**。展开/折叠走 expandedBlocks 集合（key=`sub-${key}`）+ `toggleFoldBlock` 单源切换。默认折叠；同一 key 折叠状态跨 turn 保持（expandedBlocks 不随 turn 清理该前缀）。**【§7.2.1 已变更：运行中区块迁至固定底部面板（会话与 todo 之间）——本段"会话流内联"仅指冻结态落位；运行态见 §7.2.1 D2（评审 #4 supersede 指针）】**
- **完成态（2026-08-30 修订：冻结进对话流 + 保留独立折叠交互，废除尾部驻留）**：初版实现把区块渲染成会话末尾的固定段且 done 后保留——完成的 ✓ 块永远钉在输入框上方（"残影"，用户报告），多子agent 还会叠加。修订：onToolResult 标记 done 后，完成冻结家族（`subagent-blocks.mjs` freezeSubTaskLines/freezeDoneSubTasks，2026-08-30 自 agent-turn 归位）把整个区块（含 blocks/lastError/耗时）作为 `_frozenSubTask` 载体行存进 `state.lines` 并从 `state.subTasks` 删除——留痕随会话滚走，内存仍受 N2 环形上限约束。**冻结区块保持完整折叠交互（用户拍板 2026-08-30：不因冻结降级）**：render-conversation 识别载体行后按 `sub-${key}`（与运行中区块同一个 key，折叠状态跨冻结边界延续）渲染——折叠态 = `▶ [✓ coder#1 · model · done 45s · turn n/max] … click to expand` + tail 3 行；展开态 = `▼` 控制行 + 全量时间线（kind 着色，`_skipDimFold` 防连续 dim 折叠套叠）；点击 ▶/▼ 切换与运行中区块一致。尾部固定段只渲染**运行中**条目（done 条目若因旧会话残留出现也跳过不渲染）；finally 兜底把中断（Ctrl+C/错误）仍在跑的区块一并冻结（lastError=interrupted）。完整报告前 8 行预览仍由 onToolResult 路径进会话流（不变）。convCacheKey 的 frozenSig 记录载体行 key 集合（展开/折叠翻转由既有 `exp` 项覆盖）。**修复轮 2026-09-03（冻结锚点）**：挂起期 settled 块此前池空补发冻结时无条件尾推 `state.lines.push`——冻结块落到其 digest 总览文本之后（锚点丢失，用户实测；§15 "冻结位置 = 完成时刻流位置" 语义在挂起路径失守）。修复：routeSubToken settled 分支记录 `sub._freezeAt`（= settle 时刻 `state.lines.length`）；freezeSubTaskLines 改 **锚点 splice 插入**（`?? lines.length` 尾推兜底——即时完成/中断等无锚点路径不变）；freezeDoneSubTasks/freezeAllSubTasks 同批多锚点按 _freezeAt **降序**冻结（splice 是绝对位置插入，先插小锚点会把大锚点目标后移一位）；>5000 行头裁切处（index.mjs pushLine → `shiftFreezeAnchors`）对在途锚点按**净位移**校正（splice(0,1000) 后补 1 条标记行 = −999，非 −1000——code review round1 #3，min 0）。断言：subagent-blocks.test.mjs 冻结锚点 ×5（含头裁净位移校正 + splice 落位）、suspension.test.mjs T-S6/T-S14 位置断言。
- **窄带退役**：layout.mjs 删除 subPanelH/panels.subagent 槽；render-frame.mjs 删除 renderSubagent；agent-turn.mjs 删除 3 秒清理定时器。`state.subTasks` 名字保留（数据结构升级，消费端换了）。
- **elapsed 跳动**：现有 1s ticker（agent-turn.mjs，§7.2.1 评审 #5 归属更正）在 subTasks 有运行中条目时触发 scheduleRender——无需新定时器。

**D5 消费端格式约定（TUI strip 规则）**

事件 token 含控制字符，任何渲染路径不得原样显示：render-conversation 的 sanitizeDisplay 扩展 strip `\x1d/\x1e` 包裹段；fold 缓存签名（render-conversation.mjs `convCacheKey`）纳入 subTasks blocks 状态（折叠展开 + blocks 增长都要失效缓存）。

**D6 outputPanels 死代码清理（随本轮）**

layout.mjs（outputPanelsH 计算、panels.output 槽）、render-frame.mjs（renderOutput、PANEL_KIND_COLORS、renderRows output 分支）、render-loop.mjs（outputPanels prune）全删；agent-turn.mjs 的 LIVE_LINE_LIMITS 与 `_live` 行**已随工具单框化删除**（2026-08-30，e41fad5；见 TUI-TOOL-OUTPUT.md §2.5 清理记录）。回归断言随 T-H：测试中校验全仓无 `outputPanels` 写入方、layout 无 output/subagent 槽。

**D7 ACP 桥剥除 + 哨兵防伪造（评审 #1/#7 修订，2026-08-29）**

- bridge.mjs onToken（既有 `[model]` 剥除处）加一行：匹配 `⟦ev⟧` 事件 token（含前缀变体 `[\w-]+#\d+/⟦ev⟧…`）直接 return——ACP 客户端不收到控制字符事件；事件对 ACP 的结构化映射（tool_call_update）留后续批次（TODO）。
- 生成侧 relay（spawn-child 的 wrapChildCallbacks）对子 agent 的 LLM 文本 token strip `⟦ev⟧` 哨兵序列——模型伪造事件 token 的风险面收窄到"仅生成侧发出口"。**已知限制（round2 #7）**：按单 chunk 匹配，若子 agent 文本流把哨兵串切在 chunk 边界（`⟦e` + `v⟧`）会漏剥——残危害由 D5 sanitizeDisplay 兜底，属外观级；接受该限制，不引入跨 chunk carry-over 缓冲（复杂度不值）。
- 测试：`test/acp.test.mjs` 扩展——事件 token（裸/带前缀）不透传、普通 token 照常；`test/spawn-child.test.mjs` 补 strip 用例。

**非功能性需求（评审 #4 修订，2026-08-29）**

- N1 relay 节流：子agent 工具输出转发由 TUI 渲染层节流 250ms（生成层原样转发，展示粒度各端自定）。
- N2 缓冲上限：每子agent blocks 缓冲上限 500 行——超限环形丢弃最旧行，留一行 `…（已省略 N 行）` 标记；done 后区块保留但同样受此上限（防长会话内存无界）。
- N3 渲染成本：事件 token 与 block 追加只更新区块缓冲，不触发会话区全量重绘（复用 scheduleRender 增量路径）；fold 缓存签名纳入 blocks 增长（D5），签名计算 O(1) 计数器式，不拼接全量文本。

**受影响文件清单**

| 文件 | 变更 |
|---|---|
| `src/agent/spawn-child.mjs` | 新增：makeRelay / wrapChildCallbacks / runWithContinue / ensureChildApiKey / clampEffort |
| `src/agent-tools/subagent.mjs` | 接入 spawn-child；childCallbacks 增 onToolOutput relay；删除内联重复 |
| `src/agent-tools/escalate.mjs` | 接入 spawn-child（runWithContinue/ensureChildApiKey/clampEffort）；删除内联重复 |
| `src/agent-tools/consult.mjs` | 接入 spawn-child；删除内联重复；watchdog 留在工具内 |
| `src/agent.mjs` | depth>0 turn 事件 emit（D2）；导出不变 |
| `src/agent/dispatch.mjs` | 权限询问处 emit approval 事件（D2）；onOutput 接线处注释同步 |
| `src/tui/agent-turn.mjs` | §7.2 批次：前缀分支改写（reasoning 不丢弃/onToolOutput 路由/事件 token 解析）；删 3 秒清理与窄带特判（完成冻结后经 subagent-blocks.mjs 冻结家族执行，见下行） |
| `src/tui/render-conversation.mjs` | 新增 subagent blocks 渲染段（折叠头 + tail + 展开全量）；sanitizeDisplay strip 事件 token；fold 缓存签名纳入 subTasks |
| `src/tui/layout.mjs` | 删 subPanelH/panels.subagent/outputPanelsH/panels.output |
| `src/tui/render-frame.mjs` | 删 renderSubagent/renderOutput/相关分支 |
| `src/tui/render-loop.mjs` | 删 outputPanels prune（§7.2）；**1s ticker 条件纳入 subTasks 运行中条目——实现在 agent-turn.mjs**（§7.2.1 评审 #5 归属更正：render-loop 无 ticker） |
| `src/tui/index.mjs` | subTasks 初始结构注释更新 |
| `src/tui/subagent-blocks.mjs` | 新增（实现期从 agent-turn.mjs 拆出满足 500 行硬限）：SUB_PREFIX_RE/SUB_EVENT_RE、blocks 环形缓冲（N2）、250ms 渲染节流（N1）、routeSub* 路由、finishSubTask、[model] 元数据记录；完成冻结家族（freezeSubTaskLines/freezeDoneSubTasks/freezeAllSubTasks）2026-08-30 自 agent-turn 归位 |
| `src/tui/tool-events.mjs` | 2026-08-30 新增（agent-turn 534 行超限拆分）：工具事件三回调 + flushStream + onTurnEnd 等回调装配自 agent-turn 迁出 |
| `test/spawn-child.test.mjs` | 新增：管线单测（relay 包装/continue 循环/apiKey/effort 钳制/`⟦ev⟧` strip） |
| `test/agent-turn.test.mjs` | 扩展：事件 token 解析、reasoning 进 blocks、onToolOutput 路由、done 保留；[model] 前缀 token 端到端用例（T-A/T-E 等） |
| `test/subagent-blocks.test.mjs` | 新增（实现期从 agent-turn 测试拆出）：前缀隔离/主流隔离、[model] 只记录一次、事件 token 只进头部、think 合并、tool 标题+输出单块、finishSubTask 最早先 done + epoch、N2 环形丢弃 |
| `test/tui.test.mjs` | 扩展：折叠/展开渲染、tail 3 行（2026-08-30 拍板 2→3）、缓存失效、事件 token strip |
| `test/acp.test.mjs` | 扩展：事件 token（裸/带前缀）不透传（D7） |
| `test/subagent.test.mjs` 等 | 回归：除 T-B 反转的断言外既有断言不动，跑通（round2 #6 澄清） |

**设计层关键决策记录**

- **否决：新增 onSubagentEvent 独立回调总线**——结构更"干净"，但 runAgent 签名、三个生成工具、TUI 装配、ACP 桥四处同改，扩散面大于收益；前缀管线三端已在消费，扩展它最小侵入。代价：事件编码借道 token 流（控制字符包裹保证不与内容混淆）。
- **否决：advisor 迁移到 spawn-child**——advisor 是内嵌工具循环（自建 chat 调用），不经过 runAgent；其 kind 流契约已符合 D1 的 {kind,text} 规范。F6"收编"的实际含义 = 契约对齐 + 渲染共用折叠块机制，不是代码路径合并。
- **advisor 渲染改可折叠框（2026-08-30 用户拍板，评估后裁定仍不迁入）**：评估结论 = 执行模型不迁（收敛协议 round1/2/3 提示词轮换 + fresh session + cap 都是修过真实 bug 的机制，迁移=高风险零收益）；但流式输出平铺刷屏是真问题（用户报告）→ **渲染层改为可折叠框**：运行中（`_advisorBlocks`）默认折叠 = `▶ [advisor · review] N lines — click to expand` + tail 3 行（tail 剥 `[thinking…]` 占位符），展开 = `▼` + 有序 kind 着色时间线（think/tool/text 配色不变，T-F 回归保持）；key=`advisor-blocks`（单实例）。完成后 flush 不再平铺全文+自动展开，改为 `_frozenAdvisor` 载体行——冻结折叠语义与子agent 区块对齐（`▶ [advisor · review done] … click to expand`，key=`advisor-done-{i}`），全文仍在工具结果消息中可查。默认折叠运行中也生效（用户拍板："默认折叠吧"）。
- **否决：TUI 侧新增独立"子agent 时间线视图"**（按 ] 键全屏查看）——折叠区块 + 展开已满足"看全部"诉求；独立视图是新的导航状态机，本轮不加。
- **turn 事件放 runAgent 而非各工具**：一处 emit 覆盖所有 depth>0 孩子且天然携带真实 turn/maxTurns；工具侧补发会重复计数。

**测试设计（T-A..T-J 场景映射；实现前必须展开为 输入/预期 完整用例表并随实现交付——评审 #5 修订，列为 eng-coder 硬验收项；round2 #2：N1/N2 必须有用例）**

- T-A（F1）：subagent 孩子内 bash 长输出 → 区块 tool block 增长、折叠头显示 bash tail；映射 TUI-TOOL-OUTPUT T4 同构。
- T-B（F2）：子agent reasoning token → blocks 追加 kind=think（现有测试断言"只建条目"反转为"追加内容"）。
- T-C（F3）：手动模式子agent 写文件 → approval 事件 → 折叠头显示"等待审批"。
- T-D（F4）：depth=1 孩子跑 3 turn → 3 个 turn 事件 token、折叠头 turn 3/100 跳动。
- T-E（F5）：consult 顾问 → 同样的区块渲染 + main_history 调用可见。
- T-F（F6）：advisor 输出经折叠块渲染回归（现有 _advisorBlocks 行为不变，渲染段共用）。
- T-G（F7）：bash 裸串 → 归一化为 {kind:"text"}；advisor 对象 chunk 原样。既有行为锁定。
- T-H（退役）：窄带不再渲染（layout 无 subagent 槽）、3 秒清理删除、outputPanels 无写入方残留（D6 回归断言）、普通工具 `_live` 路径回归不受影响（TUI-TOOL-OUTPUT.md §4 边界锁定）。
- T-I（错误/边界）：ContinueError 拒绝继续 → 区块冻结进对话行（`[✓ …]` 头 + dim 活动行），lastError 显示 partial；并行 3 子agent → 3 独立区块互不串扰；resume 后 blocks 续接不重建。
- T-J（D7）：ACP 事件 token 剥除 + 生成侧哨兵 strip（用例见 D7）。
- T-K（round2 #2，NFR）：N1 节流——250ms 窗口内多次 onToolOutput chunk 至多触发一次渲染提交；N2 缓冲上限——第 501 行起环形丢弃最旧行并出现"…（已省略 N 行）"标记，done 后区块同样受约束。
- T-L（round3 #5）：escalate 孩子产出区块且其专属行为不被 spawn-child 收编破坏（effortNote 拼接、touched-files 清单、无 permQueue 的 continue 询问路径）。

### 7.2.1 运行中面板固定化（2026-09-01 用户需求变更：需求层）

> **状态：已实现（2026-09-01 两端落地——round3 #6 补注；§17 挂起例外见 D-S8 冻结门控）**。

**背景**（用户真实使用反馈）：D4 把运行中子 agent 区块渲染进会话流内联（render-conversation.mjs subagent blocks 段 + 分隔线）——用户实测发现**该容器区（"底部画着横线、里面跑着好几个子 agent 的面板"）会随会话滚动，没有固定在底部**。需求：运行中的子 agent 活动改为**固定底部面板**（不随会话滚动），与 todo 面板同型；完成后仍冻结进会话流（D4 现状不变，历史可读）。

**功能性需求**：
- **F1 · 位置**：固定面板位于**会话区与 todo 面板之间**（布局顺序：header → conversation → subagent 面板 → todo → picker → permission → queue → input → status）——用户拍板
- **F2 · 高度**：**完全自适应**——面板高度 = 全部运行中区块的完整高度（无上限；并行多个子 agent 内容全显示，会话区相应被挤小）——用户拍板。**已知限制（评审 #1，用户拍板方案 a）**：多个展开块总高超屏时面板底部裁剪（无面板级滚动）——展开块自身可滚（60% 窗口化 + 块内滚动保留）——用户逐个展开/收起
- **F3 · 固定**：面板独立于 conversation 滚动区——会话滚动（滚轮/PgUp/流式）不影响面板位置；面板上滚轮**穿出滚会话**（与 todo 面板行为一致）
- **F4 · 折叠**：面板内每个子 agent 区块**默认折叠**（头部摘要 + tail 3，点击展开）——与现状流内区块一致（用户拍板）；展开态经 fold-block.mjs 公共组件（60% 封顶 + 块内滚动 + 底部可达收起控制行）
- **F5 · 冻结**：子 agent 完成后**立即冻结进会话流**（✓ 头 + 可展开，D4 现状不变；**挂起态例外：§17 挂起期间 settled 块驻留面板 "done · awaiting digestion" 中间态，池空冻结退出时统一补发 done——round2 #4**）——面板只显示运行中区块，完成即移出
- **F6 · 空态**：无运行中区块时面板不渲染（无悬空分隔线——**superseded by §20 D-SD3b：queued/waiting 块驻留时面板保持——存在条件 = running ∪ queued 非空——2026-09-03**——现状分隔线逻辑迁移到面板边界）
- **F7 · 交互**：面板内点击（展开/收起/块内翻窗）坐标映射到面板行；折叠状态（expandedBlocks key=`sub-${key}`）跨 turn 保持（D4 现状）

**非功能性需求**：
- **NF1 · 小终端压缩链**：面板加入 fixedH 扣减；终端高度不足时**面板最先让位**（可压缩至 0 隐藏，子 agent 活动仍进缓冲区不丢），输入框/状态栏/会话区保留（会话区最小 1 行）——评审 #2 措辞统一
- **NF2 · 一致性**：面板滚轮/点击行为与 todo 面板同型（穿出滚会话）；面板边界用分隔线（现状 `─` 线迁移）
- **NF3 · 测试**：layout 测试（面板位置/高度/压缩链）、渲染测试（区块在面板）、交互测试（面板点击/滚轮映射）、既有 §7.2 T-A..T-L 回归（冻结/折叠/节流/N2 行为不变）
- **NF4 · 性能**：面板渲染成本与流内渲染同量级（复用 renderBlockTimeline/renderExpandedBlock；无新增每 token 开销）

**范围边界**：仅 CLI TUI 渲染层（layout/render-conversation/render-frame/mouse 命中映射）；数据层（subagent-blocks.mjs 缓冲/冻结/路由）**不改**；VS Code 端不涉及；frozen 区块流内渲染不动。

**设计（2026-09-01）**：

**D1 · 布局（layout.mjs）**：新增 `panels.subagent` 条件面板（运行中区块存在时），位于 conversation 之后 todo 之前。**高度预计算复用既有模式**（与 visibleTasks/permPreviewLines 同型）：layout 内调 `renderSubagentPanel(state, cols, maxRows)`（纯函数——签名与受影响文件表统一，评审 #8）得 `subagentLines` → `subagentH = subagentLines.length`（完全自适应——所有运行中区块折叠头+tail3 或展开态全量；展开态经 renderExpandedBlock 的 60% 封顶窗口化，输出行数即面板高度）——layout 返回 subagentLines 供 render-frame 直接 put（不重复渲染）。**`renderSubagentPanel` 放中立模块**（不引入 layout↔render-frame 循环依赖——评审 #6：置于既有无环模块或 fold-block 同层）

**D2 · 渲染迁移（render-conversation.mjs / render-frame.mjs）**：runningSubs 段（`buildConvLines` 的 subagent blocks 段：分隔线 + 区块循环——评审 #3 改符号引用）从 buildConvLines **移除**，迁移为 `renderSubagentPanel(state, cols, maxRows)`（签名与 D1/受影响文件表统一——评审 #8；复用同一区块渲染逻辑：折叠头 `[▶/⏸ key · model · elapsed · turn] state`——**⏸ = 等待审批态图标**（sub.approval 非空时显示），评审 #5 定义；`[✓ …]` 为冻结态（图标在括号内，与运行头格式统一）+ tail 3 / 展开 renderBlockTimeline+renderExpandedBlock；顶部一条 `─` 分隔线——现状语义迁移，`if (panels.subagent) put(panels.subagent.y, subagentLines)`（**layout 预计算行，不重复渲染——与 D1 一致，评审 #3 对齐措辞**）于 conversation 之后 todo 之前）。frozen 段（state.lines `_frozenSubTask`）保持流内不动。

**D3 · 压缩链（layout.mjs）**：subagent 面板加入 fixedH；溢出时**面板最先让位**（可压至 0 隐藏，缓冲区不丢数据；输入框/状态栏/会话区不可挤没——用户 NF1，评审 #2 措辞统一）——压缩顺序：**subagent 面板 → 会话区 → picker → permission → todo divider**。

**D4 · 交互（mouse.mjs）**：
- **滚轮**：面板行默认穿出滚会话（`handleWheel` 会话区判定自然覆盖——评审 #3 改符号引用）；**面板内展开区块保留块内滚动**——handleWheel 增加面板区命中映射（r ∈ subagent 面板 → 面板行 → 区块行 → `_foldBlock`/`_foldTotal` 标记 → scrollFoldBlock；未命中 → 穿出）——与 todo 面板同型 + 现状块内滚动能力不丢
- **点击**：handleMouseClick 增加面板区映射（r ∈ subagent 面板 → 面板行 → 区块行 → `_foldToggle` 折叠/展开、`_foldScrollUp/_foldScrollDown` 翻窗）

**D5 · 折叠状态/冻结**：expandedBlocks key=`sub-${key}` 跨 turn 保持（现状不变）；完成后 freezeSubTaskLines 冻结进流（✓ 头），面板下一帧自然移除该区块（runningSubs 过滤——现状逻辑迁移）

**受影响文件**：
| 文件 | 改动 |
|---|---|
| `src/tui/subagent-panel.mjs` | 新增（§7.2.1 D1 中立模块——layout 预计算高度与 render-frame put 共用，避免 layout↔render-frame 循环依赖，评审 #6）：`renderSubagentPanel(state, cols, maxRows)` 纯函数——运行中区块面板行（顶部分隔线 + 折叠头 `[▶/⏸ …]`/tail 3/展开），自 render-conversation runningSubs 段迁移 |
| `src/tui/layout.mjs` | +`panels.subagent` 槽（conversation 与 todo 之间）+ subagentH 预计算（调 renderSubagentPanel 得 subagentLines，layout 返回供 render-frame 直接 put）+ fixedH 扣减 + 压缩链（**面板最先让位**，可至 0 隐藏；顺序 subagent 面板 → 会话区 → picker → permission → todo 分隔线） |
| `src/tui/render-conversation.mjs` | -buildConvLines runningSubs 段（含分隔线逻辑；折叠头渲染迁至面板）——frozen 段（`_frozenSubTask`）不动；convCacheKey 的 subSig 分量移除（运行区块已移出会话渲染——子agent 活动不再失效会话缓存，N3 成本同步消除；冻结载体行由 lines.length + frozenSig 覆盖） |
| `src/tui/render-frame.mjs` | +put 调用（conversation 之后 todo 之前，put layout 预计算的 subagentLines，对象行转 ANSI 字符串） |
| `src/tui/mouse.mjs` | +面板区命中映射：handleWheel（r ∈ subagent 面板 → 面板行 → 区块行 → `_foldBlock`/`_foldTotal` 标记 → scrollFoldBlock；未命中 → 穿出滚会话）；handleMouseClick（r ∈ subagent 面板 → 面板行 → 区块行 → `_foldToggle` 折叠/展开、`_foldScrollUp/_foldScrollDown` 翻窗） |
| `docs/design/TUI.md` | 布局段 + **模块地图 + §4/§5 同步更新**（评审 #4：模块地图 render-conversation 行"子agent/advisor 折叠块渲染"、§4"子代理活动现为会话流内可折叠区块"、§5"运行区块段首分隔线（render-conversation subagent blocks 段首）"——按 TUI.md 模块地图随实现同步回写纪律） |
| `CHANGELOG.md` | CLI 行为变更记录（评审 #5——VS Code 端不涉及，不记其 CHANGELOG） |
| 测试：`test/tui.test.mjs`（layout 槽位/空态/压缩链/面板渲染/缓存）+ `test/mouse.test.mjs`（面板点击/滚轮）——按既有测试结构放置（layout 测试现居 tui.test.mjs）；**实现时审计行数**（评审 #7：layout/render-frame/mouse 若超 500 硬限先拆分再报；**render-conversation.mjs 改后仍超限（TODO 实测 573）——merge 前完成 frozen/tool-block 段拆分或按 TODO 条目单独收口，评审 #6**） | 新用例 T1-T9；`test/render-loop.test.mjs` T-H 源锁正则修订（layout 禁词表移除 `panels\.subagent`，subPanelH/output 禁词保留） |

**验收标准**：
1. 面板位于会话与 todo 之间；会话滚动（滚轮/PgUp/流式）面板位置不动
2. 无运行中区块且无 queued/waiting → 面板不渲染（无悬空分隔线——supersede by §20 D-SD3b）
3. 多子 agent 并行 → 面板全显示（自适应高度）
4. 面板内点击：折叠/展开/翻窗正常；展开超限 → 块内滚动（60% 窗口化保留）
5. 面板上滚轮：未命中区块 → 穿出滚会话；命中展开区块内容行 → 块内滚动
6. frozen 行为不变（完成即冻结进流，面板移除该区块）
7. 小终端：面板先让位（可至 0 隐藏），输入框/状态栏/会话区保留
8. 折叠状态跨 turn 保持
9. 全量测试绿（**§7.2 T-A..T-L 回归——T-H 断言随本设计修订**：评审 #1——T-H 原断言"layout 无 subagent 槽"与本设计重新加槽冲突，改为窄带特有断言（renderSubagent/subPanelH 已删、3 秒清理已删）；T-A/T-C/T-D 渲染目标审计（折叠头现渲染于面板而非会话流））；新增用例全过
10. TUI.md 更新（布局段 + 模块地图 + §4/§5——评审 #4）

**测试用例**：
| 用例 | 输入 | 预期 |
|---|---|---|
| T1 布局槽位 | 有 running 子 agent | panels.subagent 位于 conversation 与 todo 之间（y 顺序正确） |
| T2 空态 | 无 running 且无 queued/waiting（supersede by §20 D-SD3b——评审 #2） | subagentH=0，面板不渲染 |
| T3 压缩链 | 小终端（rows 不足） | 面板先压至 0；conv ≥1、inputBox/status 保留 |
| T4 面板渲染 | 2 个并行子 agent（折叠态） | 顶部分隔线 + 各区块折叠头 + tail 3 |
| T5 面板点击 | 点击面板内折叠头 | 切换展开/折叠；展开超限 → ▲▼ 翻窗 |
| T6 滚轮穿出 | 面板上滚动（未命中区块内容行） | 会话滚动（面板不动） |
| T7 块内滚动 | 展开区块内容行上滚轮 | 块内滚动（不滚会话） |
| T8 冻结回归 | 子 agent 完成 | 面板移除该区块 + 流内 ✓ 头（既有冻结语义——§7.2 D4 完成态/T-I，评审 #6 改引用） |
| T9 折叠保持回归 | turn 切换 | sub-{key} 折叠状态保持（既有断言） |


### 7.3 子代理人格定位/职责边界（2026-09-04 · 用户拍板——审计结论——与 §12.1 同主题延伸）

> 状态：**设计（2026-09-04——用户拍板"1"（修 coder + consult-base——两端）——来源：全量扫描审计（CLI + VS Code 15 prompt——VS Code 与 CLI 逐字节相同 7 项子代理）——结论：explore/plan/eng-coder/engineering-sub 有人格（证据纪律/边界/中立性在）；**coder 与 consult-base 缺**（职责最重（写权限/判断）反而人格最薄——与 explore（只读+报告是命门）相反——"职责越重人格越薄"倒挂）——与 §12.1 advisor 修前同构）。触发：用户问"其他子 agent 是否也存在人格问题"——一审发现 2 真实短板。**

**需求层**：
- **F-SP1（coder 证据纪律）**：作为用户，我希望 coder 子代理一切事实/行为断言"取证或标未验证"——禁止"I'm confident…/Known behavior…"记忆断言——行为疑问=取证题（读源码/测试——向 explore 标准看齐——它是唯一有写权限的执行者——却缺证明句）；
- **F-SP2（coder 中立性）**：作为用户，我希望 coder 遇到"设计与代码冲突"（接口变更断调用方/引用符号不存在）**停报不静默适配**——父侧决策（你是实现者不是设计者——发现的矛盾上抛——不自行消化）；
- **F-SP3（consult-base 证据纪律 + 不知就说）**：作为用户，我希望 consult 顾问"取证或标未验证"——"I don't know"是合法答案——自信猜测是噪音（顾问价值=视角——来自事实而非自信；
- **N-SP1（零破坏）**：两模板其余部分一字不动——锚仅插入开头（角色句后）——既有断言/行为零改。

**设计层（逐字锚——两端照抄——byte-identical 已取消——语义锚）**：
- **D-SP1（coder.md 锚——角色句"You are a coding subagent…"后插入——英文）**：
  ```text
  ## Your role (identity — read before you code)

  You are an IMPLEMENTER with independent judgment — not a typewriter.

  1. **Evidence discipline**: every factual/behavioral assertion you make MUST be
     verified from the code/docs in front of you (read them, cite file:line) —
     or explicitly marked `unverified`. NEVER assert "Known behavior…",
     "I'm confident…", or rely on remembered API semantics when the source is
     readable — a behavioral question is an EVIDENCE question, not a reasoning
     question.
  2. **Neutrality**: you implement the design; you are not the designer. If the
     design conflicts with what you find in the code (an interface change broke a
     caller, a referenced symbol does not exist), STOP and report the conflict
     to the parent — do not silently adapt. The parent decides; you surface.
  3. **Boundary**: your task = the parent's task brief (files, acceptance
     criteria). Do not expand it. Findings that touch things outside the brief
     (other modules, parent-side docs) go in a trailing "out-of-scope note" in
     your report — no action without the parent's word.
  ```
- **D-SP2（consult-base.md 锚——角色句后插入——英文）**：
  ```text
  ## Your role (identity — read before you answer)

  1. **Evidence discipline**: you are the perspective the main agent lacks —
     that value comes from verified facts, not confidence. Any factual or
     behavioral assertion you make MUST be backed by what you read (or known
     from the problem brief) — or explicitly marked `unverified`. NEVER assert
     "Known behavior…", "I'm confident…", or rely on remembered API semantics
     when the source is readable. Unknown → say so: "I don't know" is a valid
     consultant answer; a confident guess is noise.
  2. **Neutrality**: you are one of several consultants — no authority to
     decide. Recommend and reason; the main agent integrates. Do not write
     fixes or replacement text in your reply.
  ```
- **D-SP3（两端）**：CLI + VS Code 各 2 文件（coder.md + consult-base.md）——同锚——byte-identical 已取消——语义锚（cross-repo-parity 精神——两端各自照抄设计锚——内容断言各端独立）。

**受影响文件（两端）**：
- CLI `src/prompts/coder.md` + `src/prompts/consult-base.md`（角色句后插锚 D-SP1/D-SP2）；
- VS Code 同两文件（镜像——各自照抄）；
- 两端测试（内容断言——T-SP 系——落点：既有模板断言处——CLI/VS Code `test/prompts.test.mjs`（§18.14 拆分后——原 agent.test.mjs——as-of 注：id:14 实现时在 agent.test.mjs，拆分迁 prompts.test.mjs）——与 T-AR/T-10.1 同 file——programmatic verbatim 检查）；
- 文档：AGENT-LOOP.md（§7.3 本节）、两端 CHANGELOG.md（父侧统一——提示词变更记录）。

**测试（T-SP）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-SP1 | N | 读两模板（两端） | coder.md 含 "IMPLEMENTER with independent judgment" + "Evidence discipline" + "Neutrality" + "Boundary" + "STOP and report" 锚句——fail-when-unchanged |
| T-SP2 | N | 读 consult-base.md（两端） | 含 "Evidence discipline" + "I don't know is a valid consultant answer" + "recommend and reason" 锚句——fail-when-unchanged |
| T-SP3 | E | 既有模板断言回归（T-10.1/T-AR/borrowing 等） | 全绿（零破坏——N-SP1——既有断言位置未动） |
| T-SP4 | A | 锚缺失（模拟回归——删一锚句） | 断言失败（fail-when-unchanged——防回潮） |

**验收（AC-SP）**：AC-SP1 = T-SP1/2 绿（两模板锚句在）；AC-SP2 = T-SP3 绿（零破坏）；AC-SP3 = T-SP4 绿（防回潮）；AC-SP4 = 双端同语义（各自照抄设计锚——父侧核销——cross-repo 精神）。**AC-SP5（可计量——观测非门禁——评审 #4 修正）**：后续 coder/consult 报告轨迹"I'm confident/Known behavior"密度——复用 §18.8 口径——**测量面 = 交付报告正文 + §18.6 轨迹 reasoning**——**基线：无既有样本——"基线不可得——待观察"**（§18.8 的 #530/#593/#636 基线针对 advisor 评审——coder/consult 无对应样本——明示待观察——显著下降（≥30%）作观测达标——样本积累后补基线）。


## 8. advisor 开关语义重构（2026-08-21）

**需求**：`advisor.enabled` 曾是双义开关——既 gate 评审能力（非工程模式 enabled=false 时 advisor 工具直接拒绝 "not enabled"），又 gate guard 推回（`enabled && guard !== false`）。用户拍板：**评审能力恒启用，开关语义收敛为 guard**；guard 默认 OFF（评审自愿调用，打开才强制）。工程模式行为不变（评审恒可用、guard 豁免）。

**设计**：
- `src/advisor/run.mjs`：删除 enabled gate（"Advisor: not enabled" 拒绝移除）——advisor 工具任何模式都可调用；评审 provider 沿用 `resolveAdvisorProvider`（未配 advisor.provider → 继承主 provider）
- `src/agent/completion.mjs`：guard 条件 `cfg?.enabled && cfg?.guard !== false` → `cfg?.guard === true`；工程模式豁免保留
- `src/config.mjs`：默认配置 `advisor: { enabled: false }` → `advisor: { guard: false }`（enabled 字段废弃不再读写；存量配置不迁移——pre-release 约定，CHANGELOG 说明）
- `src/tui/cmd-advisor.mjs`：菜单删除 "Advisor ON/OFF" toggle（评审恒 ON，仅显示状态）；"Guard on/off" 成为唯一开关项
- `src/tui/render-frame.mjs`：状态栏 banner 由 `advisor.enabled` 驱动改为 guard 驱动——`agent.config?.advisor?.guard === true` 时显示 `GUARD│`（ADVISOR banner 删除；banner 展示的是"强制评审已开"这一值得提醒的状态，而非恒真的评审可用性）
- 提示词/工具描述无 enabled 引用，不改

**测试**：
| # | 用例 | 输入 | 预期 |
|---|---|---|---|
| 1 | 评审恒可用 | config `{ advisor: {} }`（无 enabled/guard）非工程模式调 advisor | 正常执行评审（不再返回 not enabled） |
| 2 | guard 默认 OFF | `{ advisor: {} }` 改代码后收尾 | 不推回，正常收尾 |
| 3 | guard ON 推回 | `{ advisor: { guard: true } }` 改代码未评审收尾 | 推回 "MUST get an advisor review" |
| 4 | 工程模式豁免 | engineering: true 改代码收尾（guard 任意） | 不推回 |
| 5 | 存量 enabled 不生效 | `{ advisor: { enabled: true } }` 改代码收尾 | 不推回（enabled 不再读取）；评审仍可手动调用 |
| 6 | /advisor 菜单 | toggle 项 | 不再出现 Advisor ON/OFF；Guard 项读写 `guard` 字段 |
- 更新既有断言：`test/completion.test.mjs`（enabled 推回用例改 guard）、`test/advisor.test.mjs`（enabled gate 放行用例改为无配置）、`test/slash-commands.test.mjs:354`（toggle 写 enabled → guard）、`test/agent.test.mjs` 相关推回用例

**受影响文件**：`src/advisor/run.mjs`、`src/agent/completion.mjs`、`src/config.mjs`、`src/tui/cmd-advisor.mjs`、`src/tui/render-frame.mjs`、`test/completion.test.mjs`、`test/advisor.test.mjs`、`test/slash-commands.test.mjs`、`test/agent.test.mjs`、`CHANGELOG.md`。VS Code 端见其 `docs/design/ARCHITECTURE.md` 同款变更段（两端逐行等价，CLI 为准）。

## 9. 关键设计决策

| 决策 | 理由 |
|---|---|
| guard 链全部"注入提醒 + continue"而非硬中断 | 模型自我修正优于外部强制；计数上限防死循环 |
| verify/advisor 仅 opt-in | 默认不打扰（对齐用户偏好；工程模式用流程驱动评审替代逐轮推回） |
| 中断=提交部分输出+注入消息+续跑 | Ctrl+I 语义是"插话"不是"取消"——上下文连贯 |
| resume 保留 guard 状态 | 续跑不能重置已验证/收敛事实，否则可被无限续跑绕过 |
| 两段调度顺序保序 | 只读并行提速，副作用严格串行保因果 |
| 错误落盘不落模型 | stack trace 泄露路径且干扰推理；`~/.thincoder/tool-errors/` 供事后分析 |


## 10. 提示词借鉴增量（kimi-code 对照，2026-08-21）

**需求**（对照 kimi-code 提示词研究，用户批准两项借鉴，范围最小化）：
1. explore 彻底度分级——kimi 有 quick/medium/thorough 三档（whenToUse 文案约定），ThinCoder 缺；采用 **prompt 约定形态（B 方案，用户拍板）**，不加工具参数。
2. "识别最重要验收标准"——kimi system 提示词要求 identify "the most important criteria to achieve the goal"，ThinCoder 的确认理解条款缺这半句。

**设计**（两端 `src/prompts/` 改动必须保持 byte-identical 同步；两端 subagent 工具描述各自同步语义）：
- `src/prompts/explore.md`：新增 **Thoroughness levels** 段——quick（单点定向搜索，回答一个具体问题）；medium（**默认**，适度多路并行）；thorough（多位置、多命名习惯全面分析，报告须列出搜索过什么、没找到什么）。
- `src/prompts/main.md`：Delegate well 条款补一句——委派 explore 时在 task 描述中指定彻底度（quick/medium/thorough），按需分级，未指定走默认。
- 两端 `src/agent-tools/subagent.mjs` 工具 description：explore 描述处补 "specify thoroughness in the task: quick / medium / thorough (default medium)"（CLI setup.mjs 的 filteredSubagent 与 VS Code modeRoleField 只覆盖 role 字段，description 追加自动生效）。
- `src/prompts/system.md`："Confirm understanding" 句改为——State what you believe the user asked for and what you plan to deliver, **including the most important acceptance criteria**. Wait for confirmation.（coder.md 不动：其 delivery table 已强制逐条 requirement 列示，强于该补句。）
- 明确不做：不加 thoroughness 工具参数（用户拍板 B 方案）；不改 explore 的 prompt 前缀/工具集；不动 kimi 对照结论中其余 ✅ 项。

**测试**（两端各自断言提示词文件内容，位置选现有 prompt 相关测试）：
- ① explore.md 含 "Thoroughness levels" 与 quick/medium/thorough 三档及默认档说明
- ② main.md 含委派彻底度指引
- ③ system.md 确认理解句含 "most important acceptance criteria"
- ④ 两端 `src/prompts/` 15 文件仍 byte-identical（比对测试已落地：CLI `test/agent.test.mjs`，thincoder-vscode 同级目录不存在时动态 skip）
- ⑤ 回归：两端 subagent 工具 schema 的 role enum 覆盖不受影响（modeRoleField / filteredSubagent 现有测试仍绿）

**受影响文件**：`src/prompts/explore.md`、`src/prompts/main.md`、`src/prompts/system.md`、`src/agent-tools/subagent.mjs`（两端各一份，共 6 个源文件）+ 两端测试文件 + 两端 `CHANGELOG.md`。VS Code 端见其 ARCHITECTURE.md 同款变更段。


## 11. 开工前计划确认纪律（2026-08-21）

**需求**（用户报告 + 拍板）：agent 在澄清交流中常"自以为清楚了"就直接写代码/写文档，跳过确认。要求：**任何写代码/写文档动作前，都必须用纯文字复述"理解+计划"，等用户明确确认后才动手；无豁免**（连看起来再小再明确的改动也要确认）。机制 = 提示词纪律（用户拍板：不用 question 卡片）；普通模式与工程模式都生效；子 agent 不适用（子 agent 不向用户提问，确认由父 agent 完成）。

**设计**（两端 `src/prompts/` 保持 byte-identical）：
- `system.md` 强化 "Confirm understanding" 条款，追加无豁免纪律：
  - 写文件动作（write/edit/apply_patch/insert_after/delete/hashline_edit 及一切写文件的 bash）前，必须先文字复述理解+计划要点，等待用户明确确认（"OK/可以/继续"类回复）；未确认、沉默、或用户回复新要求 → 一律不动手。
  - 明确堵死自我豁免：多轮澄清后即使自认完全清楚，也必须把计划文字化并等待确认；"这太明显了不用问"不是跳过理由；用户的新问题不是确认。
  - 与现有条款衔接：确认过的内容在后续对话中被新要求改变时，动手前重新复述重新确认。
- `engineering.md` 澄清阶段补同类条款：clarification DONE（用户确认或答案不再改变需求）后、写需求/设计文档前，把"对需求的理解 + 下一步计划"文字呈现并等待用户确认——工程模式的"写文档"同样在纪律范围内（用户报告明确包含"写文档"）。
- `discipline.md` / `main.md` 不动（分层逻辑不变，纪律统一挂在 system.md 与 engineering.md）。
- 明确不做：不加 question 工具卡片（用户拍板）；不加机械门禁；子 agent overlay 不改。

**测试**（两端 `test/agent.test.mjs` 追加断言）：
- ① system.md 含无豁免确认纪律关键句（如 "no exemption" / 写文件动作清单）
- ② engineering.md 含"写文档前计划确认"条款关键句
- ③ 两端 15 文件 byte-identical（既有比对测试自动覆盖）
- ④ 回归：两端全量测试通过

**受影响文件**：`src/prompts/system.md`、`src/prompts/engineering.md`（两端各一份，共 4 个源文件）+ 两端 `test/agent.test.mjs` + 两端 `CHANGELOG.md`。VS Code 端见其 ARCHITECTURE.md 同步变更段。

## 12. 文档归属纪律 + advisor 设计评审增强（2026-08-21）

**需求**（用户报告 + 拍板 B 方案，合并上一轮已批 A 方案）：
- 文档碎片化：agent 说一件事就新建文档，不找相关文档修改（settings 板块 6 个文档即实证），且同一机制多处重复描述互相矛盾（落盘路径 tmp/ vs tool-results/、字段往返"待补"vs"已落地"）。治理：未来纪律（文档地图 + 提示词归属条款）+ 评审把关（advisor design review 新增归属检查维度）。存量合并不在本范围（记 TODO）。
- advisor 设计评审缺陷（A 方案，已批）：① fallback 提示词缺 Approval Signal 规则 → 评审永远无法批准；② Instructions 与系统提示词维度列表漂移（漏 Methodology compliance）；③ 无引用纪律 → host 引用验证对 design 形同虚设（实测 0/8 命中）。

**设计**：
1. **文档地图**：两端各建 `docs/design/README.md`——「板块 → 文档文件」映射表（含"一个板块一个文档、功能点并入所属板块、新板块才新建并登记"规则说明）。
2. **两端 `src/prompts/system.md`**（byte-identical）：「Discussion → docs」类条款处补文档归属纪律：写文档前先查 `docs/design/README.md` 文档地图（无地图则查 AGENTS.md/docs 目录）定位所属板块文档——**找到就改、不得为既有板块新建文件**；确无归属才新建并登记进地图；同一机制只在一处详述（权威源），其余文档引用不复制。
3. **两端 `src/prompts/advisor-design.md`**（byte-identical）：
   - Review Criteria 加第 7 维 **Document ownership**：变更是否并入所属板块文档而非碎片化新建？表述是否与现有文档重复/矛盾？
   - 严重度约定：与现有文档**矛盾**的表述 → 🔴；该并入却新建/重复描述 → 🟡。
   - 加 **引用纪律**：引用设计文档原文用精确 `file:line` 格式，未核实内容标注 unverified（激活 host citation 验证）。
4. **两端 messages.mjs design 分支**（CLI `src/advisor/messages.mjs`、VS Code `src/advisor/messages.mjs`）：Instructions 补第 6 维度（Methodology compliance，与系统提示词对齐）；若存在 `docs/design/README.md` 文档地图，注入「## Document Map」段供归属检查对照。
5. **fallback 转硬加载**：两端 design 提示词加载改为与 round1/2/3 同待遇——`loadPrompt("advisor-design.md", ...)` 直接抛错（缺失即安装损坏，静默降级到劣质 prompt 的后果是评审机制失效）；删除 `ADVISOR_DESIGN_FALLBACK` 常量与 try/catch。
6. 范围外（记 TODO.md）：存量碎片文档合并（settings 6 文档等）；design round2 专用提示词（§11 评审发现 #4）。

**测试**（两端各自断言）：
- ① advisor-design.md 含 "Document ownership" 维度与 🔴/🟡 分级句、含引用纪律句（file:line / unverified）、含 Approval Signal / `[DESIGN-TOKEN:…]` 回显规则（防 fallback 删除后规则回归丢失）
- ② system.md 含文档归属纪律关键句（doc map / update instead of creating）
- ③ 文档地图 README.md 存在且含板块映射表
- ④ messages.mjs design 分支：Instructions 含 Methodology 维度；存在文档地图时注入 Document Map 段（单测 buildAdvisorUserMessage 输出）
- ⑤ fallback 移除：grep 无 ADVISOR_DESIGN_FALLBACK；advisor-design.md 缺失时构建抛错（两端各有 loadPrompt 测试或沿用既有 pattern）
- ⑥ 回归：两端全量测试通过；两端 prompts 15 文件 byte-identical

**受影响文件**：`docs/design/README.md`（两端各新建）、`src/prompts/system.md`、`src/prompts/advisor-design.md`（两端各一份）、CLI `src/advisor.mjs` + `src/advisor/messages.mjs`、VS Code `src/advisor/main.mjs` + `src/advisor/messages.mjs`、两端测试、两端 `CHANGELOG.md`。VS Code 端见其 ARCHITECTURE.md 同步变更段。


#### 12.1 advisor 角色定位/职责边界（2026-09-04 · 用户拍板——纠结评估结论落地）

> 状态：**已实现（2026-09-04——设计评审 0🔴（round1——token 3d0299bc/designId 418d5fb6——8 项处置全落）——用户批准——实现：CLI id:9（clean——L1 1356/1308/0）+ VS Code id:10（clean——L1 1051/0——锚逐字 EXACT-match ×4——首审 1🔴 误报已复核——复评 0🔴）——父侧 L2 核销：CLI 1359/1359 + VS Code 1056/1056 全绿（2026-09-04））**。

**需求层**：
- **F-AR1（角色定位）**：作为用户，我希望 advisor 明确"独立评审者"身份——权威在判定、不在决策——发现/报告/判级但不替设计者写方案（评审模板现状：只教"怎么评"——没教"是谁评的/立场/边界"——评审模型被迫从上下文反推职责）。
- **F-AR2（证据纪律）**：作为用户，我希望 advisor 一切事实/行为断言"取证或标未验证"——禁止"Known behavior…/I'm confident…"记忆断言——行为疑问=取证题（用只读工具核实——源码/既有测试在清单内可读）——不要推理（今天实证：path.win32.join 记忆断言 vs 同一评审对文档引用却机械核对——两套真相标准）。
- **F-AR3（边界）**：作为用户，我希望评审目标=声明块+清单——不自行扩大；出界发现→报告尾部"出界注"——不判级（评审对象锚 §18.8 机制已实现——父侧漏传已修——但评审自身缺"边界说明"）。
- **F-AR4（非作者）**：作为用户，我希望评审不替作者修复——发现即报告（修复权在父侧/用户——评审报告是证据不是改稿）。
- **N-AR1（零破坏）**：四模板其余部分（评审维度/引文纪律/判定规则 R1-R7/approval signal）一字不动——角色段仅插入开头——既有断言（模板内容断言）不破。

**设计层**：
- **D-AR1（统一锚——逐字定稿——四模板开头插入——英文）**——插入位置：第一句（身份句）之后、Review Criteria/工作流段之前——每模板同段同文（byte-identical 已取消——两端各自照抄本锚——内容断言守护）：
  ```text
  ## Your role (identity — read before the criteria)

  You are an INDEPENDENT REVIEWER — authority in judgment, not in decisions.

  1. **Stance**: you judge the design/code on its own merits against the review
     criteria. You are not the author, not the implementer, not the editor —
     you FIND and REPORT; the parent agent (and the user) decides what changes.
      Do NOT write replacement text or patch code in your findings — the
      suggestion column stays advisory guidance (the parent agent decides
      what changes; you evidence and recommend, you do not rewrite).
  2. **Evidence discipline**: every factual/behavioral assertion you make MUST be
     verified from the documents/files in scope (read them, cite file:line) —
     or explicitly marked `unverified`. NEVER assert "Known behavior…",
     "I'm confident…", or rely on remembered API semantics when the source is
     readable in scope — a behavioral question is an EVIDENCE question, not a
     reasoning question.
   3. **Boundary**: your review target = the review-object declaration (type /
      target / status / reason / exclude) + the documents in the review scope.
      Do NOT expand it. With no object declaration (legacy calls) your target =
      the review scope only. Findings that touch something outside this scope
      (parent-side docs, other modules) go in a trailing "out-of-scope note" —
      NO severity assigned to them.
  4. **Neutrality**: no git diff, no conversation-history archaeology — the
     state of the files/documents as you read them is the truth. Do not guess
     author intent.
  ```
- **D-AR2（两端）**：CLI + VS Code 各四模板（advisor-design/round1/round2/round3）——同锚——byte-identical 已取消——语义锚（cross-repo-parity 精神——内容断言各端独立）——**round1 评审 #2 处置（2026-09-04）**：证据纪律与既有 Citation Discipline 同机制——角色层**重述以强化**（prompt 需重复强调——docs/design 的单源原则不适用于 prompt 内部——此处明示接受重复）。
- **D-AR3（不动）**：§18.8 对象锚机制/§18.10 铁律块/评审维度/引文纪律——零改——角色段补的是"人格层"——**#2 措辞更新：与"规则层"互补——角色层重述规则层要点（证据/边界）以强化——非新增规则**。

**受影响文件（两端）**：
- CLI `src/prompts/advisor-design.md` + `advisor-round1.md` + `advisor-round2.md` + `advisor-round3.md`（四模板开头插锚）；
- VS Code 同四文件（镜像——各自照抄锚——内容断言）；
- 两端测试（模板内容断言——T-AR1..4——落点：**§18.10 T-10.1 先例：CLI `test/prompts.test.mjs` / VS Code 对应（§18.14 拆分后——原 agent.test.mjs——as-of 注：id:12 实现时在 agent.test.mjs，拆分迁 prompts.test.mjs——与 T-10.1 同 file——不另立）**）；
- 文档：AGENT-LOOP.md（§12.1 本节）、两端 CHANGELOG.md（父侧统一——提示词变更记录——§11/§13/§14 先例——round1 #8 补）。

**测试（T-AR）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-AR1 | N | 读四模板（两端） | 各含 "Your role (identity" + "INDEPENDENT REVIEWER" + "Stance" + "Evidence discipline" + "Boundary" + "Neutrality" 六锚句——fail-when-unchanged（round1 #4——断言含 F-AR4 "replacement text" 句——#7 计数更正） |
| T-AR2 | N | 模板内容 | 角色段含 "NEVER assert \"Known behavior…\""（禁止句在——证据纪律落地——round1 #7 清理：原问句残留删） |
| T-AR3 | E | 角色段与既有规则冲突 | 无——角色段为独立小节——既有"Citation Discipline"/"Approval Signal"/判定规则位置未动（既有断言绿） |
| T-AR4 | A | 锚缺失（模拟回归——删除一锚句） | 断言失败（fail-when-unchanged——防回归——round1 #4 补错误路径） |

**验收（AC-AR）**：AC-AR1 = T-AR1 绿（四模板锚句在——fail-when-unchanged）；AC-AR2 = T-AR2 绿（禁止句在——证据纪律落地）；AC-AR3 = 既有模板断言零破坏（既有断言绿——N-AR1）；AC-AR4 = 双端同语义（T-AR1 语义断言——cross-repo 精神）。**AC-AR5（可计量——round1 #6 修订）**：后续评审轨迹“Known behavior/I'm confident”记忆断言计数——复用 §18.8 密度口径（正则命中数/1K reasoning 字数——基线取 §12.1 实现前同型评审样本）——**显著下降（≥30%）作观测达标——非门禁——复核定口：同型样本不足时记“样本不足——待观察”**。

## 13. 委托策略：广度探索下沉 explore（2026-08-23）

**需求**（用户报告「主 agent 历史被逐步 tool call 淹没、质量差」，选 A+C；A=行为层委托，C=历史卫生见 `CONTEXT-COMPACTION.md`）：

### 总体需求
主 agent 的机器线历史（`history`，落盘 `contextHistory`）被大量内联逐步探索（read/grep/ls/glob 等）淹没，多轮后上下文质量退化。把「广度理解性探索」下沉到 explore 子代理、只让其**报告**进入主历史，提升主历史信号密度——与 `CONTEXT-COMPACTION.md` 的历史卫生（截断/压缩）正交互补。

### 功能性需求
- F1：当任务需要**跨多文件/目录的理解性探索**（找用法、摸结构、读一批文件）时，主 agent 有一条明确规则把其交给 `explore` 子代理（任务里标注用法），使主历史只保留一份报告而非几十条逐步工具调用。
- F2：当主 agent **即将立刻编辑**某文件时，它可自己 read 该文件，使精确行保持在自身工作上下文内（精度例外，目的不是省 token）。
- F3：`coder` 子代理完成后，主 agent 的「验证」= 读其**声称改动**的文件 + 运行测试，而非重做整段探索——不让自己随后的复核行为抵消委托收益。

### 非功能性需求
- N1：委托规则由 `main.md`（及 explore/coder overlay）以「触发条件明确的规则句」表达，非模糊建议；两端 prompt byte-identical。
- N2：纯提示词行为层改动，不新增工具/机制，与 C 解耦可独立落地。

**设计**（重写 `main.md` "Delegate well" 段；两端 byte-identical）：

1. **首句点破收益**：在委托总述后补一条——子 agent 跑在隔离上下文，它的逐步 read/grep **不进你的历史**，只有最终报告回来；内联做宽探索才会把自己的窗口埋进噪声、多轮后注意力退化。
2. **触发规则句**（替换原句「Delegate breadth-first exploration; do precision edits yourself」为两条）：
   - 宽度优先探索——跨多文件/目录的理解（找用法、摸结构、读一批文件）——交给 `explore` 子代理，任务里标注 thoroughness（quick/medium/thorough）。
   - 只有当你**即将立刻编辑**某文件时才自己 read 它：精确编辑需要精确行在你的工作上下文里——这是**精度例外，不是省 token 技巧**。
3. **验证句**（替换原句「When a coder subagent finishes, verify its report: read the files it claims to have changed, run the tests — do not trust subagent reports blindly」）：coder 子代理完成后，验证 = 读它**声称改动**的文件 + 运行测试；**不要重做你已委托的那整段探索**——那会抵消委托。
4. 其余各条（并行不编辑同一文件、失败就收窄重试或自己做、escalate EARLY、冲突时自己读代码仲裁）保持不变。——**supersede 注（2026-09-03 §20.7）："并行不编辑同一文件"条随 §20.7 从 main.md Delegation 段移除（调度器条款取代——声明 files 的 async spawn 可同文件并行派）——本行 as-of 保留**

**测试**（实现前补全，两端各断言）：
- `main.md` 含委托收益句（isolated context / only its final report / flood 类）、含「about to edit it immediately」触发句、含「Do NOT redo the whole exploration」句。
- 两端 prompts byte-identical 比对测试继续通过。

**受影响文件**：`src/prompts/main.md`（两端各一份）、两端测试、两端 `CHANGELOG.md`。

## 14. 操作并行化纪律（2026-09-01 用户需求：需求层）

**背景**（用户指示）："能并行化的尽可能并行化，节省用户等待时间"——ThinCoder 执行器**已支持并行**（dispatch.mjs 两段式：readonly/parallel 工具批并行 `Promise.all`、写/bash 串行——§4；subagent/consult 一次多个并行），但**提示词没有引导模型利用**——模型默认一次一个工具调用，独立操作被串行化，用户等待时间翻倍。需求：提示词补并行化纪律（含边界）。

**总体目标**：agent 默认并行化独立操作（信息获取/多文件编辑/子代理），显著减少用户等待；同时明确"不并行"边界——防止冲突、审批风暴、仓库锁。

**功能性需求**：
- **F1 · 并行发起**：独立信息获取/只读工具调用**一次发起多个**（read/grep/glob/search/lsp 等批并行——执行器自动 Promise.all）——把现有"call tools in parallel"条款从被动允许升级为主动引导
- **F2 · 多文件编辑**：独立文件的多处编辑用 `edits` 数组形态（原子多文件——一次往返）
- **F3 · 子代理并行**：相互独立的子任务一次 spawn 多个（subagent 并行执行；**同一文件编辑冲突例外**——不并行派发到同一文件的编辑）——**supersede 注（2026-09-04 §20.7——评审 round1 #4）**：声明 `files` 的同文件 async spawn 可并行派发——调度器排队处理（见 §20.7 D-PS1/D-PS2 + §20.3 T-SD2/T-SD13）；本句为 2026-09-01 需求层记录——写域声明后冲突不再手动避让
- **F7 · 多项目独立变更并行（用户补充 2026-09-01：monorepo 场景实证——"变更两个子项目时明显应该分两个子 agent，但实际上很少这么做"）**：变更横跨多个**独立子项目**（如 thincoder / thincoder-vscode——不共享待改文件、无交叉依赖）→ **按项目拆分并行子 agent**（每项目一个，各改各的、各自跑自己的测试）——**supersede 注（2026-09-04 §20.7——评审 round1 #4）**：同时声明 files 写域（跨面镜像声明）——调度器按域排队——见 §20.7 D-PS2/FR8——**触发条件（全部满足才拆）**：① 子项目互相独立（不共享待改文件）；② 改动无耦合（A 的输出不是 B 的输入）；③ 各自有独立测试可自验——任一不满足 → 不拆（主 agent 串行协调或单 agent 处理）
- **F4 · 会诊并行**：consult 多模型独立并行（已有——不动）
- **F5 · 不并行边界（必须写明，防滥用）**：① 写**同一文件**（冲突）；② **依赖链**（前一步输出是后一步输入——串行必然）；③ **bash/审批敏感命令**（执行器串行 + 并行 = 审批风暴——多个权限弹窗）；④ **同一 git 仓库并发 git 命令**（仓库锁冲突）；⑤ **有状态操作**（session/权限/队列——串行）——**carve-out 注（2026-09-04 §20.7——评审 round1 #4）**：①对**声明 files 的 async spawn 例外**——调度器自动排队（system.md 实际文本含 carve-out 句——见 §20.7 D-PS1；本句为 2026-09-01 需求层记录）
- **F6 · 收益判断**：并行化**大操作**（用户等待收益可见）；**微操作**（<1s 级）不并行（启动/上下文成本 > 收益）——"尽可能"不等于"无脑全并行"

**非功能性需求**：
- **NF1 · 两端 byte-identical**：CLI + VS Code `src/prompts/system.md` 条款逐字一致（既有纪律延续）
- **NF2 · 零执行器改动**：机制已存在（dispatch 批并行）——本需求纯提示词条款 + 文档，**不改 dispatch.mjs/执行器**
- **NF3 · 测试**：两端各自断言 system.md 含并行化条款（照既有 system.md 内容断言测试的 `readFileSync` + `assert.match` 模式——评审 #2 改符号引用弃行号）+ 既有测试全绿（无行为变更——纯提示词）

**范围边界**：`src/prompts/system.md`（两端）+ AGENT-LOOP.md（本文档 §14）+ 两端提示词内容断言；不改执行器/工具；VS Code 端提示词同步（byte-identical 纪律）。

**设计（2026-09-01）**：

**D1 · system.md 条款**（"How you work — while coding" 段，现有并行条款（"When you need multiple independent pieces of information, call tools in parallel…"）之后追加——英文提示词惯例，两端 byte-identical——评审 #2 改锚点引用，弃行号）：
> - **Parallelize aggressively:** send multiple independent tool calls in one response (read-only batches run concurrently); use the `edits` array for independent multi-file changes — **§20.7 carve-out（2026-09-03）：本并行条款的 "writes to the same file" 禁令对声明 files 的 async spawn 例外——调度器自动排队重叠任务（见 §20 D-SD3/§20.7——system.md 实际文本含 carve-out 句）**; spawn multiple independent subagents at once — including splitting changes across independent sub-projects (e.g. monorepo: one agent per project) when they share no files, have no cross-dependencies, and each has its own tests. Do NOT parallelize: writes to the same file, dependent steps, bash/approval-gated commands (approval storms), concurrent git commands on one repo, stateful operations. Parallelize big operations; skip micro-parallelism (<1s ops).

**D2 · 语义映射**（条款 ↔ F1-F7）："multiple independent tool calls" → F1；"`edits` array" → F2；"spawn multiple independent subagents" + "splitting changes across independent sub-projects…share no files / no cross-dependencies / each has its own tests" → F3+F7（触发条件逐字）；"Do NOT parallelize" 五项 → F5；"big operations / micro-parallelism" → F6；F4（consult）机制既有，条款不含（不重复）。

**D3 · 测试（NF3）**：两端各自在既有 prompts 内容断言测试文件加一条——断言 `system.md` 含条款关键短语（`Parallelize aggressively`、`splitting changes across independent sub-projects`、`Do NOT parallelize`、`approval storms`）——照既有 prompts 断言测试的 `readFileSync` + `assert.match` 模式（CLI 在 advisor.test.mjs——评审 #2 改符号引用弃行号）；两端提示词文本 byte-identical 比对（既有纪律测试继续通过）。

**受影响文件**：
| 文件 | 改动 |
|---|---|
| `thincoder/src/prompts/system.md` | +并行化条款（D1） |
| `thincoder-vscode/src/prompts/system.md` | 同（byte-identical） |
| `thincoder/test/advisor.test.mjs`（或既有 prompts 断言处） | +T1 条款断言 |
| `thincoder-vscode/test/`（对应 prompts 断言测试） | +T2 条款断言 |
| `docs/design/AGENT-LOOP.md` | 本文档 §14 |
| 两端 `CHANGELOG.md` | 提示词变更记录 |

**验收标准**：
1. 两端 `src/prompts/system.md` byte-identical，含并行化条款（F1/F2/F3+F7/F5/F6 语义逐条可指认）
2. 条款含 F7 触发条件（share no files / no cross-dependencies / each has its own tests）
3. 两端条款断言测试通过
4. 既有测试全绿（纯提示词变更——无行为路径改动）
5. 两端 CHANGELOG 更新

**测试用例**：
| 用例 | 输入 | 预期 |
|---|---|---|
| T1 CLI 条款断言 | 读 system.md | 含 `Parallelize aggressively` + `splitting changes across independent sub-projects` + `Do NOT parallelize` + `approval storms` |
| T2 VS Code 条款断言 | 读 system.md | 同 T1（文本与 CLI 逐字一致） |
| T3 回归 | 既有提示词断言 + 全量 | 全绿 |



## 15. subagent 异步化：真后台并行（2026-09-02，用户问题：并行化缺陷评估）

> **状态：已实现（2026-09-02，两端落地 + 测试全绿）**。用户实证两缺陷：① 主会话 spawn 子代理后被阻塞——"检查 xxx"类动作做不了（或只能等 spawn 返回后做旧状态检查）；② 同批并行 spawn 的子代理快的早完成，主会话必须等最慢的（先完成结果不能立即处理）。**用户裁定**（2026-09-02 逐项确认）：A 真后台并行（consult 范式：非阻塞 spawn + 轮询 check）；A 显式开启（默认阻塞不变）；A 回合收尾自动等待全部完成；A CLI 强制并发上限（3 → 4）。

### 15.1 问题

- **F-1 阻塞**：`subagent` 工具内部 `await runWithContinue(...)`（src/agent-tools/subagent.mjs 的 `runWithContinue` 调用点）——调用后主会话停等子代理完成，无法在后台运行期间推进自己的回合（检查/读文件/其他工具）
- **F-2 批尾效应**：同一响应多个 spawn 并行跑（平台并发），但**全部完成后统一返回**——快的子代理报告不能先到先处理
- consult 已有异步范式（`consult_start` 非阻塞 + `consult_check` 轮询）可借鉴——subagent 缺同款能力

### 15.2 需求

- F1：`subagent` 工具加 `async: true` 参数——显式开启后 spawn **立即返回** `{ id, role, status: "running" }`（不 await 报告）；主会话可继续自己的回合
- F2：新增 `subagent_check` 工具——取回 async 子代理结果；**多 async 按完成顺序（arrival order）消费**——先完成先处理（F-2 消除）
- F3：回合结束时未完成的 async 子代理**自动等待完成**，报告注入会话（干活型不白做）
- F4：默认行为不变——不带 async 时完全保持现有阻塞语义（提示词/流程/测试零波及）——**§18 F1 修订（2026-09-02）：eng-coder role 缺省 async（其余角色不变）——见 §18 D-E1**
- F5：**CLI 并发上限 4 + 槽位队列（async，机械层，用户 2026-09-02 拍板）**——`_asyncSubagents` 中 running 数 <4 时新 async spawn **立即启动**；≥4 时**入队等待**（`status:"queued"`，返回 `position`），**running 子代理完成（promise settle）即腾槽 → 队列头部自动补位启动**——不拒绝、不要求模型分批（"槽位空出立即 spawn 下一个"）。**同步 spawn 不受机械上限约束**（本就阻塞不堆积）。**既有工程纪律上限 3 → 4（提示词层，两端）**：同步并行 eng-coder spawn 的纪律上限同步改为 4

### 15.3 设计

**D-A1 `subagent` 工具 async 分支**（`src/agent-tools/subagent.mjs`）：

- schema 加 `async: { type: "boolean", description: "true = spawn without waiting — returns {id} immediately, fetch results later via subagent_check. Default false (blocking)." }`
- `async: true` 分支：子代理照常启动（**复用既有 spawnChild 管线**——relay/turn-cap/权限/mergeChildMutations 全不变），但**父侧不 await 报告**——`agent._asyncSubagents.set(id, { role, promise })`（promise = runWithContinue 的结果，settle 时自动落 `report`/`error` 字段）后**立即返回** `{ id, role, status: "running" }`
- **槽位队列（D-A4/D-A6，用户 2026-09-02 拍板）**：async 分支入口检查 `_asyncSubagents` 中 **running 数**（`status==="running"`，已完成未消费与 `queued` 不计入）——<4 → 立即启动（`status:"running"`）；≥4 → **入队**（`status:"queued"`、`position = 队内序号`），spawn 返回 `{ id, role, status:"queued", position }`。**腾槽补位**：任一 running 子代理 promise settle（无论完成/失败/abort）→ 队列头部 queued 项自动启动（status→running，position 释放）；队列空则止。**不拒绝、不分批**
- id 分配：复用既有 counter（`_subAgentCounter` 同一序列，`role#N` 与 TUI 区块 key 一致——async 子代理的 TUI 面板行为不变，relay 照常流式显示）。**§20 扩展（2026-09-03——实现记录 20.5）**：队列条目可带调度等待态（waiting-deps——文件域冲突/依赖未满足——不入 running 不占槽）——补位语义由"队首启动"改为"最早可启动扫描"（waiting 越行不阻塞槽位）；槽满等位条目与 waiting 条目同队列混排（position = 队列序）；面板 waiting 块随 spawn 返回即建——详见 §20 D-SD1..SD5。

**D-A2 `subagent_check` 工具**（新增，`src/agent-tools/subagent.mjs`）：

- 参数：`id`（可选——缺省 = 任意下一个完成，**arrival order**：多个 async 时按完成顺序返回最快的；带 id = 等特定子代理——含 queued 项先等启动）、`n`（必填——**1-based 递增读数**：`n` 计数器为 agent 对象 **per-run 字段**（随 runAgent 非 resume 重置；turn-end 清空后下轮首调重置 1）；**校验：`n !== lastN + 1` → `{ status:"error", error:"invalid read counter — pass n = lastN+1" }`**（乱序/重复 n 拒绝，防模型空转）；**超过 `MAX_ASYNC_CHECKS = 3` → `{ status:"error", error:"check limit exceeded — use turn-end auto-wait for the rest" }`**——consult 同款防循环，评审 #1 补定义）；**工具声明 `readonly: true`**（评审 #6——consult_check 先例，planMode 门控需要）
- 语义：**阻塞到目标完成**（带 id：等该 id——含 queued 项，先等它启动再等完成；不带 id：等 running 集合中下一个完成的）——返回 `{ id, role, status: "done", report }` 或 `{ id, status: "error", error }`（**含错误路径：id 未知/已消费 → `{ id, status: "error", error: "unknown async subagent id: <id>" }`**——评审 #5）；子代理全完成且已消费 → 返回 `{ done: true }`（consult_check 同款终结语义）
- 实现：`_asyncSubagents` Map + 每项 `{ role, promise, report, error, done }`；check 对未完成项 `await promise`（Promise.race 于目标集合）；消费后从 Map 删除；**上限指标 = running 数**（`done` 项不计入，与 D-A1/T6 一致）
- 描述引导：工具 description 写明用法——"spawn async 后可以继续其他工作（检查/读文件），最后用 subagent_check 取结果；多个 async 时先完成先返回"

> **§19 修订（2026-09-03 round2 批准时标注）：`subagent_check` 工具退役——并入 `subagent` 工具 `action:"check"`（语义原样保留——arrival order/阻塞/n 计数/消费删除——见 §19）——本 D-A2 保留为 as-of 快照**
**D-A3 回合收尾自动等待**（`src/agent.mjs` runAgent finally）——**§17.5 supersede（2026-09-03）**：本条的"回合尾注入"形态在挂起驱动下改由消化轮注入（collectSettledAsync 不再直注入排空——done 留池 → 挂起会话 sweep → digest 消化——详见 §17.5.2）；无驱动调用方（headless/直连 runAgent）保留本条直注入兜底（17.5.4 #2）：

- finally 中若 `_asyncSubagents` 有 **running + queued** 项 → **收尾补位循环**（评审 #2 定死：**保持并发上限 ≤4 串行补位**——当前 running settle 一个才启动下一个 queued，不解除上限；`Promise.allSettled` 在补位循环完成后对最终 running 集合取快照）再 `await Promise.allSettled([...promises])`——等全部完成后，把报告/错误**注入会话**（pushReal 一条 user 角色 `[System reminder: async subagent #id (role) finished]` + 报告或错误文本，**报告文本做 XML 转义**——评审 #7，子代理报告可能含来自文件/网页的注入面内容，遵循 reminder 纪律；超长报告（>64K）注入预览 + 落盘路径）——主会话下一回合可见结果。**已知权衡（评审 #8 声明）**：结果在最终回复后才注入，父侧 verify/advisor guard 不复检这批改动——靠 §7.1 子代理自带自评（verify + advisor）兜底，下回合模型可见并处理
- 注入后清空 `_asyncSubagents`
- **`⟦ev⟧done` 事件（code review #7 补记 + 用户问题 2026-09-02 修正发射时机）**：**每个 async entry 在 promise settle 时立即发** `${relayPrefix}⟦ev⟧done\x1e0\x1e0\x1edone\x1e` token（subagent.mjs 的 settle 回调发，非回合收尾统一发）——完成即冻结、冻结块位置 = 完成时刻的会话流位置（对齐同步子代理行为；用户实证：收尾统一发导致"直到所有任务完成后才变灰 + 冻结块堆在会话末尾结论之后"）。回合收尾 collectAsyncSubagents 不再发 done（只注入 reminder + 清空）——收尾时仍在跑的最后几个经 settle 回调发 done（主会话已结束，块在末尾，合理）——§7.2 D1 "tool/done phase 不发 token" 的**§15 例外**（该句原意是同步子代理的 tool/done 由 onToolResult 前缀 relay 承担；async 子代理的完成发生在父工具返回之后，需显式 done 事件通知 TUI 冻结）
- **async 子代理权限交互（评审 #2 补）**：后台子代理撞权限门时审批面板照常弹出（`_permQueue` 串行化，不与其他权限请求重叠）；回合收尾等待把"待审批"视为**可解析状态**——用户批准 → 子代理 settle → 等待完成；无用户在场（headless/无审批回调）→ 权限请求按既有 no-permission-handler 语义拒绝，子代理失败返回（不悬挂）。——**eng-coder 例外（§18 D-E3）：spawn 时任务域授权——child 内部 onPermissionRequest 豁免（autoApprove 等效，仅该阶段）——"无 handler 拒绝"对 eng-coder 不再成立**；非 eng-coder 子代理不受影响
- **使用层级（评审 #4 定死）**：`async: true` 仅 **depth-0 主会话**有效——depth>0 子代理内传 async → 报错拒绝（"async spawn only available at the top level"）；后台子代理撞 turn-cap → **自动拒绝继续（不弹 continue 面板）**，子代理失败返回（报告带 turn-cap 原因）——不打扰主会话；**例外（2026-09-02 统一规则）**：工程模式 && AUTO 开 → 自动续跑（同 §2 规则——AUTO 授权无人值守）
- **中断/resume 生命周期（评审 #3 定死）**：Ctrl+C 中断 → abort 传播（subagent 的 signal 传递），未完成项随 abort 失败（AbortError 语义），**`_asyncSubagents` 立即清空（不注入陈旧错误）**——用户显式停；ContinueError（turn cap）→ **finally 不等待不注入，`_asyncSubagents` 原样保留**（避免延迟 continue 面板），resume 后回合收尾语义顺延（下轮 turn-end 再收尾）
- 回合收尾等待项数 = `_asyncSubagents.size`（含已 settle 未消费——allSettled 立即返回）；**上限口径 = running 数**（D-A1/D-A2/T6 一致，评审 #2 对齐）——回合收尾清空后自然归零

**D-A4 并发上限常量**：`ASYNC_SUBAGENT_LIMIT = 4`（subagent.mjs 模块常量）。**同步纪律上限 3 → 4（两端，评审 #3 修正引用——内容锚，不用行号）**：工程模式提示词 `src/prompts/engineering.md` 的 "Cap: at most 3 concurrent eng-coders" 短语改 "Cap: at most 4 concurrent eng-coders"，**配套 rationale 句 "past 3 the bookkeeping cost..." 同步改 "past 4"**（T9 断言短语即正确形态）；`docs/design/ENGINEERING-MODE.md` FR8（上限 ≤3）+ 2026-09-01 关键决策④ rationale 同样 3→4（三处同步，缺一处即文档矛盾）。异步化后主会话同一时刻在跑的子代理可能更多，4 是用户拍板值

**D-A5 提示词/文档**（`src/prompts/system.md` 工具描述 + AGENT-LOOP.md 本节）：

- subagent 工具 description 追加 async 用法段（D-A2 描述同款）
- "Delegate well" 段补一句：可 async spawn 后台子代理后继续主会话工作（何时用 async——需要主会话并行推进时；何时不用——必须等报告才能继续时用默认阻塞）

**受影响文件（两端）**：CLI `src/agent-tools/subagent.mjs`（✓ async 分支 + subagent_check + 上限）、CLI `src/agent.mjs`（✓ 回合收尾 await + 注入）、VS Code `thincoder-vscode/src/agent-tools/subagent.mjs`（✓ 同实现——VS Code subagent 完整对齐，MAX_PARALLEL_SUBAGENTS 3→4 同改）、VS Code `thincoder-vscode/src/agent.mjs`（✓ 收尾）、`src/prompts/system.md`（✓ 工具描述 + Delegate well 段，两端 byte-identical）、`src/prompts/engineering.md`（✓ 上限 3→4 同步）、`docs/design/ENGINEERING-MODE.md`（✓ FR8 + 决策④ rationale 3→4）、`docs/design/AGENT-LOOP.md`（✓ 本节）、CLI `test/subagent.test.mjs`（✓ T1-T8/T10-T14；**T9 断言在 `test/agent.test.mjs`**——engineering.md 内容断言照 §16 T-B4 模式）+ VS Code 对应测试（agent.test.mjs:1035）（✓）、`CHANGELOG.md`（两端，父代理统一更新）；consult.mjs **不改**（范式参考，不复制——consult 是咨询语义可放弃，subagent 是任务语义要收尾，独立实现）

### 15.4 测试

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T1 | ✓ async 立即返回 | mock 慢子代理（延迟完成）+ async:true | spawn 返回 `{id, status:"running"}` **早于**子代理完成；`_asyncSubagents` 有该项 | F1/D-A1 |
| T2 | ✓ 主会话继续 | async spawn 后同一回合再调另一只读工具 | 第二工具正常执行返回（不被 spawn 阻塞） | F1/D-A1 |
| T3 | ✓ 完成顺序 | 2 个 async（快/慢）| `subagent_check`（无 id）先返回快的 id+报告；第二次 check 返回慢的；第三次返回 `{done:true}` | F2/D-A2 |
| T4 | ✓ 特定 id 等待 | 带 id check 慢的 | 阻塞到该 id 完成返回其报告 | F2/D-A2 |
| T5 | ✓ 回合收尾（~~旧语义：finally await 全部 + 清空~~——**被 §17 D-S1 取代：collectSettled 收已完成注入 + 未完成移交池**，round2 #1）——**再被 §17.5 取代（2026-09-03——回合尾留池 digest——详见 §17.5.2——agent 级无驱动用例保留直注入）** | async 未 check + runAgent 自然结束 | §17 落地后：回合自然结束不等待；已 settle 注入 + 未 settle 保留池 | §17 D-S1 |
| T6 | ✓ 槽位队列（超限入队） | 第 5 个 async spawn（4 个 running） | **入队**：返回 `{id, status:"queued", position:1}`，不拒绝；前 4 个不受影响 | F5/D-A1 |
| T10 | ✓ 腾槽补位 | 第 5 个入队后，1 个 running 完成（promise settle） | 队列头部 queued 项**自动启动**（status→running，position 释放）；无需模型再 spawn | F5/D-A1 |
| T11 | ✓ 队列位置 | 第 6、7 个 spawn（5 在跑/队） | position 递增（1、2）；位置信息随 spawn 返回可见 | F5/D-A1 |
| T12 | ✓ check 错误路径（评审 #5） | check 未知 id / 已消费 id | `{id, status:"error", error:"unknown async subagent id: <id>"}` 不悬挂 | D-A2 |
| T13 | ✓ n 超限（评审 #4） | check 第 4 次调用（n=4 > MAX_ASYNC_CHECKS=3） | `{status:"error", error:"check limit exceeded — use turn-end auto-wait for the rest"}` | D-A2 |
| T14 | ✓ 乱序/重复 n（评审 #1） | check 传 n=1 后再次 n=1（未递增） | `{status:"error", error:"invalid read counter — pass n = lastN+1"}`；不消费结果 | D-A2 |
| T7 | ✓ 默认阻塞回归 | 不带 async 的正常 spawn | 行为与现有一致（阻塞等报告）——既有 subagent 测试全绿 | F4 |
| T8 | ✓ 中断 | async 运行中 Ctrl+C | abort 传播；收尾不再等待（error 带中断语义） | D-A3 |
| T9 | ✓ 上限纪律同步（评审 #4） | 读 engineering.md | 含 "Cap: at most 4 concurrent eng-coders" + "past 4"（两端 byte-identical） | F5/D-A4 |

**验收**：AC1 = async spawn 不阻塞主会话（T1/T2）；AC2 = 多 async 先完成先取（T3/T4）；AC3 = 回合结束未取结果不丢（T5——**§17 落地后语义 = 未 settle 移交池 + 下轮 D-S3 注入，round2 #1**——**§17.5 再修订（2026-09-03）：agent 级无驱动用例（T5）保留直注入兜底语义（17.5.4 #2）——驱动级用例（T-S2/T-H 系列——T-H6）断言改"回合尾消化轮注入"（17.5.2——详见 §17.5）**）；AC4 = **槽位队列：超限入队不拒绝（T6）+ 完成即腾槽补位（T10）+ 位置信息（T11）** + 同步 spawn 上限 3→4 生效（T9：`engineering.md` 内容断言含 "Cap: at most 4 concurrent eng-coders" + "past 4"——照 §16 T-B4 模式）；AC5 = 默认阻塞零回归（T7 + CLI 全量 + lint 绿）——**§18 修订：eng-coder 除外（角色级缺省 async——见 §18 D-E1，T7 适用其余角色）**；AC6 = check 错误路径与防循环上限（T12/T13）。

### 15.5 关键决策

- **consult 范式借鉴而非复用**：consult 是"多模型咨询"语义（会话级、可放弃、main_history 注入）；subagent 是"任务执行"语义（调用级、要收尾、mergeChildMutations 回传）——共享"非阻塞 + 轮询"形态，实现独立（consult.mjs 零改动）
- **显式 async 而非默认全异步**：现有提示词/流程（偏差审计、交付核验等）都是"spawn 后等报告"的阻塞用法；默认变更会波及全部——显式参数把新能力做成加法——**§18 F1 修订（2026-09-02）：角色级缺省例外——eng-coder 默认 async（工程交付协议需要——见 §18）**
- **收尾等待而非 abort**：eng-coder 干活型，回合结束 abort = 工作白做（用户明确选等待）；中断（Ctrl+C）仍传播 abort（用户显式停不等待）
- **槽位队列而非拒绝/分批（用户 2026-09-02 拍板）**：超限入队 + 完成即腾槽补位——模型一次可 spawn 任意数量，无需分批等待（"槽位空出立即 spawn 下一个"）；同步 spawn 本就不堆积（阻塞），不受限；用户拍板上限 3→4
- **否决**：a) 默认全异步（波及面大，F4 相反）；b) 回合结束 abort（丢工作）；c) 上限仅自律（防呆失效风险）；d) 超限拒绝 + 模型自行分批（正是用户否掉的行为）；e) 消费才腾槽（check 后才补位——槽位利用率低，用户要求完成即补）

### 15.6 两端对齐（VS Code，2026-09-02 用户确认）

VS Code 端 subagent 机制完整对齐（`thincoder-vscode/src/agent-tools/subagent.mjs`——独立上下文 runAgent(depth=1)、role 白名单、并行 spawn、eng-coder designToken 多槽）——**本节全部机制两端同实现**：async 分支 + subagent_check（readonly）+ 回合收尾 + 上限（`MAX_PARALLEL_SUBAGENTS` 3→4 + ASYNC_SUBAGENT_LIMIT=4）。VS Code 无 TUI 面板——子代理活动走 webview 活动流（onToolPanel），async 子代理活动照常显示，收尾注入走既有会话消息通道。

**完成态同修（2026-09-02 修复轮，D-A3 对齐）**：async 子代理 settle 即发 `onSubagent({ id, role, status: "done" })` 通知（subagent.mjs `runChild` 完成路径——与 CLI `⟦ev⟧done` settle 即发同语义，回合中完成即通知，不等到收尾）；webview 消费端 `handleSubagentMessage`（webview/panels.js）收到 done/error 即折叠对应活动区块（`sub:role#id` / `sub:escalate <tag> #id` 键匹配——保留可展开、不移除，对齐 CLI 冻结语义；此前只有 consult 区块在终态折叠，subagent/escalate 区块会保持"运行中"外观直到回合结束）。



## 16. 工具使用优化：approval 批确认 + 批量形态引导（2026-09-02，用户问题：工具操作并行化评估）

> **状态：已实现（2026-09-02，两端落地 + 测试全绿）**。两项均来自 2026-09-02 并行化评估：① 同批多个非只读工具逐个弹权限确认（点击疲劳）；② 真实使用数据实证（1187 会话文件 / 1248 回合）：edit 单条 243/257（94.6%）vs `edits` 数组 14/257（5.4%）、apply_patch 0 次、**35 例同回合手工批量**（同一回合连发 2-8 次单条 edit 改多处）——批量能力存在但模型不习惯用，**不是缺工具，是缺引导**。

### 16.1 approval 批确认（防点击疲劳）

**问题**：dispatch Phase 1 对非只读工具**逐项** `await onPermissionRequest(...)`（src/agent/dispatch.mjs 的 Phase-1 预审 `onPermissionRequest` 调用点）——同响应 N 个非只读工具（如 3 个 write）→ N 次确认弹窗（已串行排队不重叠，但用户逐次点击）。

**设计**：

- **D-B1 同批权限合并询问**：Phase 1 收集同批次（同一 toolCalls 数组）所有**通过前置门禁、到达权限询问阶段**的非只读工具（评审 #7：planMode 拒绝/eng gate 拒绝/JSON 解析失败等已被前置门禁拦下的工具不计入批询问）→ **一次询问**覆盖：`"N 个工具需要权限：A、B、C — approve all / approve one by one / deny"`（评审 #1 统一语义：**`deny` → 全批拒绝、无二次询问**；`oneByOne` → 回退逐项二次询问——修掉此前"deny 也回退逐项"的矛盾表述）
- **实现约束（评审 #1/#6/#9 定死）**：新增回调 `onBatchPermissionRequest({ tools: [{name, args}], count })`（返回 `"approveAll"`/`"oneByOne"`/`"deny"`——**标识符统一为 approveAll**）——`onPermissionRequest(toolName, args)` 契约签名**不变**（ACP/桥/子代理透传零波及）；dispatch 在 Phase 1 聚合：同批非只读工具 >1 时先发聚合询问；**`deny` → 全批拒绝、无二次询问；`oneByOne` → 回退既有逐项通道**；`approveAll` 语义 = 本批放行标志（autoApprove 风格、批次作用域、不持久）。**无 `onBatchPermissionRequest` handler 时缺省 = 回退逐项通道**（与 `onPermissionRequest` 无 handler → denied 的既有语义衔接——ACP 桥/headless/旧版不实现新回调不误伤整批）
- **autoApprove 短路不变**：autoApprove 时跳过（同批也跳过）
- **只读工具不参与**：只读批本来就不询问

### 16.2 批量形态引导（数据驱动，非新增工具）

**数据**（2026-09-02 实证）：edit 单条 94.6%；apply_patch 0 使用；35 例手工批量（如 8 个 .gitignore 连发、compact.mjs 4 连发、CHANGELOG 6 连发——同一回合多次单条 edit 替代一次批量）。

**设计**：

- **D-B2 edit 工具描述批量引导**（src/tools/edit.mjs 的 schema description + 工具定义描述，两端同改）：明确"**同文件多处修改 → `edits` 数组一次调用原子完成**（多条目同文件串行执行，2026-09-01 已支持——TOOLS.md 权威）；多文件独立修改 → 同一 `edits` 数组多条目"——把 35 例手工批量收敛为 edits 数组（回合数↓、原子性↑：任一失败全不写）
- **D-B3 apply_patch 场景引导**：描述补"新建多个文件（`--- /dev/null`）/整文件替换/统一 diff 形态"——apply_patch 0 使用主因是模型不知道它覆盖多文件新建场景；保留工具（与 edits 各有价值：edits 适合逐条精确替换、hunk 适合整块/新建）
- **D-B4 提示词纪律同步（并入 §14 D1 条款，评审 #8）**：不新增独立句——在 system.md "How you work — while coding" 段 §14 D1 的并行条款（"use the `edits` array for independent multi-file changes"）内扩展：追加 "and apply_patch for whole-file/new-file changes; prefer one batched call over N single edits"（两端 byte-identical，避免相邻两句）——**引用注（2026-09-03 §20.7）：同一 D1 条款随后再经 §20.7 carve-out（并行禁令对声明 files 的 async spawn 例外）——§14 D1 实际文本的沿革 = §16 D-B4 扩展 + §20.7 carve-out 叠加——以 system.md 实际文本为准**

### 16.3 非功能需求（评审 #6 补）

- **NF-B1 契约零破坏**：`onPermissionRequest(toolName, args)` 签名不变；无 `onBatchPermissionRequest` handler 时缺省回退逐项通道（ACP 桥/headless/旧版不误伤不悬挂）
- **NF-B2 两端 parity**：system.md 批量句两端 byte-identical；edit/apply_patch 描述两端同改（VS Code 对齐）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——两端一致性 = 设计锚（逐字定稿）+ 评审/审计**
- **NF-B3 性能**：批询问只发一次（同批 N 个非只读工具 1 次询问，非 N 次）；autoApprove 短路不变
- **NF-B4 测试**：T-B1..T-B6 映射验收；TUI/webview 合并询问 UI 测试随实现补（评审 #8——dispatch 层断言 + UI 层渲染断言）

**受影响文件（两端）**：CLI `src/agent/dispatch.mjs`（✓ D-B1 批确认聚合 + 回调接线）、CLI `src/tui/` 权限面板（✓ 合并询问 UI——approve all / one by one / deny 三选项）、VS Code `thincoder-vscode/src/agent/execute-tools.mjs`（✓ 批聚合——permission-gate 已有 approve-all 三按钮雏形，对齐合并询问形态）、VS Code `thincoder-vscode/src/webview/permission.js`（✓ 合并行 UI）、`src/tools/file.mjs`（✓ D-B2 描述，两端同改）、`src/tools/patch.mjs`（✓ D-B3 描述，两端同改）、`src/prompts/system.md`（✓ D-B4，两端 byte-identical）、`docs/design/AGENT-LOOP.md`（✓ 本节）、CLI `test/dispatch.test.mjs`（✓ T-B1/T-B2）+ VS Code 对应测试（✓）、`test/` prompts 断言（✓ T-B3）、`CHANGELOG.md`（两端，父代理统一更新）

**测试**：

| # | 场景 | 输入 | 预期 | 映射 |
|---|---|---|---|---|
| T-B1 | ✓ 同批 3 非只读工具 | 同一 toolCalls 数组 3 个 write（无 autoApprove） | **一次**权限询问（合并名 + 计数）；批准后逐个执行 | D-B1 |
| T-B2 | ✓ 批内逐项/拒绝 | 批询问选 "oneByOne"/"deny" | oneByOne → 回退既有逐项通道（签名不变）；deny → **全批拒绝、无二次询问** | D-B1 |
| T-B6 | ✓ 无 handler 缺省（评审 #6） | 不提供 onBatchPermissionRequest（ACP 桥/headless/旧版） | 自动回退逐项通道（同批 N 个仍 N 次既有询问，不误伤、不悬挂） | D-B1 |
| T-B3 | ✓ 批量引导描述 | 读 edit/apply_patch 工具描述 | 含"edits 数组原子/多文件同批""apply_patch 新建多文件"语义句 | D-B2/B3 |
| T-B4 | ✓ 提示词纪律 | 读 system.md | 含批量优先句（两端 byte-identical 断言） | D-B4 |
| T-B5 | ✓ 回归 | 全量 | 既有 dispatch/权限测试全绿（autoApprove 短路/单工具询问不变） | D-B1 |

**验收**：AC1 = 同批多非只读工具一次询问（T-B1）；AC2 = 权限契约签名零破坏（T-B2 + 既有测试）；AC3 = edit/apply_patch 描述含批量引导（T-B3）；AC4 = system.md 批量句两端一致（T-B4）；AC5 = CLI 全量 + lint 绿（T-B5）。

**关键决策**：① **批确认而非排队展示**：排队已有（串行 await），痛点是逐次点击——合并询问是真正的解法；② **引导而非新工具**：数据证明批量能力存在（edits 数组/apply_patch/execute），缺的是模型使用习惯——描述层引导零机制风险；③ apply_patch 保留（与 edits 场景互补：逐条精确 vs 整块/新建）；④ 否决：a) 新批量 write 工具（第 5 种批量形态，工具面膨胀）；b) 权限静默自动批准（安全红线）；c) 默认全异步（§15 已否决同款）。

---

## 17. 挂起回合：会话级后台双通道（2026-09-02，用户方案：async 子代理运行中主会话可继续对话）

> **状态：已实现（2026-09-02，V2 完整版 + 推进型——用户拍板：AUTO 模式下 auto-turn 可推进（写/spawn 全开放），手动模式维持消化型；CLI 端落地 + 测试全绿：§15 T5 断言随 collectSettled 语义更新（subagent.test.mjs）+ test/suspension.test.mjs T-S1..S17 全绿 + 全量 1041 pass 0 fail）**。
> 权威源补充：本节是 §15（subagent 异步化）的语义演进——**F3"回合收尾自动等待"被本节挂起语义取代**（见 17.3 评估①）。**§15.4 T5/AC3 断言随本节修订（评审 #1）**：T5 原期望"finally await 全部 + _asyncSubagents 清空"（`thincoder/test/subagent.test.mjs`）改为 `collectSettledAsync` 语义（收已完成注入 + 未完成移交池——函数名统一 collectSettledAsync，round2 #6）；AC3"回合结束未取结果不丢"语义保留（结果经 D-S3 下轮注入/auto-turn 消化）但实现断言同步改。

### 17.1 问题与需求

**用户问题（网友需求传导）**：async 子代理运行期间，主会话**回合尾阻塞等待全部完成**（§15 F3/D-A3——collectAsyncSubagents 等 running 全 settle 才结束回合，可能几分钟）——等待期用户无法输入。网友要"生成/子代理运行期间插话"；Ctrl+I 只解决生成中插话，不解决回合尾后台等待。

**用户方案（2026-09-02 逐项拍板）**：
- 主会话自己的工作做完后**不真结束回合**——进入挂起态，用类似 question 的界面接收用户输入
- 有用户输入 → 执行用户输入；等待输入期间子代理完成 → **先处理子代理完成后的工作**
- **#1 挂起退出（前者）**：子代理全完成 + 最后一条输入已执行完 → 自然结束（回合结束，回正常空闲态）
- **#2 允许叠加（后者）**：跨回合 async 累积并发——新回合可不收完旧 async（新回合继续派新活，池叠加）
- **#3 与 Ctrl+I 关系（不相关，两种模式）**：挂起态输入 ≠ 打断（子代理继续跑）；普通生成中 Ctrl+I 插话语义保留
- **#4 核心语义（输入到一半子代理回来了）**：**输入框与子代理处理完全独立**——子代理完成 → **立即自动处理**（不等用户输入、不看输入框状态）；输入框不清空、不抢焦点；处理轮运行中用户 Enter → **排队**（处理轮结束后自动以用户消息续发；Ctrl+I 仍可立即打断处理轮）
- **死锁否决**：用户指出"输入到一半人离开（抽烟/开会）→ 输入框非空判据会永久挂起子代理"——**否决**"输入框非空不处理"与"非空+空闲超时"两个方案——判据根本不该存在：子代理完成是自动事件，用户输入是独立通道，两通道永不互等

**功能需求**：
- F1：回合尾 async 未完成 → 不阻塞等待（进入挂起态）；已完成结果不丢
- F2：双通道事件循环——子代理完成 → 自动处理（无用户输入也处理）；用户提交 → 新回合
- F3：输入框永不被后台事件干扰（不清空/不抢焦点/不判定输入状态）
- F4：处理轮（模型消化子代理结果）运行中用户 Enter → 排队，处理轮结束自动续发用户消息
- F5：挂起自然退出 = 后台池空（无 running/queued/未注入）+ 无待处理用户输入 → 回空闲态
- F6：跨回合 async 叠加（并发上限 4 全局不变——_asyncSubagents 是 agent 对象级，天然跨轮）
- F7：两种模式并存——挂起态输入模式（新回合，不打断后台）vs 普通模式（Ctrl+I 插话保留）
- F8：子代理完成处理的**自动性**——不依赖用户在场（人离开回来即见处理完的报告）

**非功能需求**：
- N1：自动处理回合（若做 V2 auto-turn）的成本护栏——不得无限烧模型轮次
- N2：自动处理撞权限门 → 无用户在场按 no-permission-handler 拒绝（§15 D-A3 评审 #2 同语义），不悬挂
- N3：防后台链失控——**手动档**自动处理中禁 spawn 新 async（结构防失控）；**AUTO 档**允许推进链（用户授权无人值守，2026-09-02 裁定）——链终止靠池空自然停 + 用户输入随时打断（D-S5 pendingInput 优先），不设代数上限（"不各搞一套"——无新机制，AUTO 责任转移）
- N4：上下文膨胀防护——挂起期注入在无输入期可能累积 → 下轮开跑压缩兜底（已有：runAgent 轮内安全点首查 `compressIfNeeded`——符号锚点，agent.mjs:183-189 仅作 as-of 快照，round3 #4）
- N5：两端一致（CLI TUI / VS Code 面板同构交付）

### 17.2 可行性评估（2026-09-02 一手代码核实，用户要求"好好评估"）

① **runAgent 是单输入回合模型**（`runAgent(agent, input, ...)`，agent.mjs:110 as-of 2026-09-02）——一轮输入 → chat/tools 循环 → finally 收尾。挂起循环**必须落在调用方/交互层**（CLI agent-turn/startup 的 turn 循环、VS Code 面板消息循环），runAgent 保持"单输入 → 输出"不变式——压缩/回注/task/纪律全部按轮执行，**不改造 runAgent 内部循环**（在内部做事件等待会让一轮无限长，压缩/权限/审计语义全乱）。结论：**挂起态 = 交互层状态**，runAgent 是它的"执行原语"。

② **现 finally 收尾等待语义**（`runAgent` finally + `collectAsyncSubagents`，agent.mjs:437-492 as-of）：turn 尾 `await Promise.allSettled` 等全部 running → 注入全部报告 → 清空。改造点 = **回合尾语义从"等全部"改为"收已完成 + 移交未完成"**：collectAsyncSubagents 拆两半——已 settle 的立即注入（保留现注入形态：user reminder + XML 转义 + 64K 落盘）；未 settle 的移交会话级后台池（不等待）。finally 不再阻塞。

③ **后台池零新状态**：`agent._asyncSubagents` / `agent._asyncQueue` 已是 **agent 对象级**（跨 runAgent 调用存活——§15 D-A1/D-A3 的 Ctrl+C 清空/ContinueError 保留语义都在 runAgent finally 里按 agent 处理）——"移交池"就是"不清不注入不等待"，F6 叠加并发自动成立。并发上限 4（running 数口径）天然全局。

④ **跨 run 延迟注入有现成先例**：`agent._pendingDistill`（runAgent 首行 await 处，agent.mjs:114-118 as-of——上次运行的探索蒸馏在 prepareRun 前 await 落定，防机器线重建吞掉新输入）——已完成 async 结果注入"下一回合 prepareRun 前"可复用同款机制（_pendingAsyncResults 数组，prepareRun 前 pushReal 注入）。SEND-STALL-DISTILL §2.2/N1 语义同构。

⑤ **"子代理完成 → 立即自动处理"两个实现档位**：
- **V1 注入档（无模型回合）**：完成即注入历史（reminder 形态，同现收尾注入）→ 用户下一条消息模型自然看到并处理。改动小（④ 机制 + 回合尾移交），但"处理"滞后到用户下次输入——不满足用户"先处理子代理完成后的工作"的字面意图（用户没输入时结果只是躺着）
- **V2 自动消化档（auto-turn）**：完成且无用户输入 → 系统驱动一次**无输入的模型回合**（注入 [System reminder: async #N finished] + 报告 → runAgent 空输入消化——模型总结/派后续活/回挂起）。**这是本节最大复杂度点**：auto-turn 的成本（每次完成烧一轮模型）、权限（撞门 → N2 拒绝）、循环防护（消化中再 spawn async → 链式永动——需 **auto-turn 禁 spawn async** 或深度上限）、与压缩/纪律的交互。F4 排队输入在 V2 才有意义（处理轮存在）
- **范围建议**：评审定 V1 或 V2——V1 满足网友"能输入"痛点（回合不等、输入可用、结果下轮见）；V2 满足"自动处理"完整语义但成本/护栏重

⑥ **输入 UI 现状**：CLI TUI 输入框 processing 期禁输（key-handler：processing 中 Enter 走 interruptPrompt 分支），挂起态需放开输入（processing=false + 后台池非空 → 输入可用，Enter = 新回合而非 Ctrl+I 打断）；VS Code 面板输入框同构放开。question 界面（工具问答）不复用——挂起输入是**交互层通道**不是工具调用（语义：用户自由消息，非结构化问答）。

⑦ **TUI 子代理区块**：现回合结束收尾注入后 done 冻结（D-A3 settle 回调发 ⟦ev⟧done）。挂起态下回合已结束但区块**继续 live**（子代理还在跑）——渲染层需"后台模式"（状态行：后台 N 子代理运行中 + 输入框可用）；池空 → 区块自然冻结 + 挂起退出。VS Code 面板同构。

⑧ **中断/异常兼容**（沿用 §15 D-A3 既有语义，`runAgent` finally 分支，agent.mjs:447-452 as-of）：挂起态 Ctrl+C → 清池退出（abort 传播）；ContinueError（turn cap）→ 池保留、resume 顺延；会话关闭 → 池 abort。**挂起态不是新异常路径**——是 finally 语义的放宽，既有分支全部保留。

⑨ **压缩兜底**：挂起期注入累积（无输入期多子代理完成 → 多条 reminder 注入）——下轮开跑 runAgent 轮内首查 `compressIfNeeded`（轮内安全点检查处，agent.mjs:183-189 as-of，history 尾 user → 触发）自动压缩。V2 auto-turn 每次消化前同样走轮内压缩。无需新压缩机制。

⑩ **风险清单**：
- R1（V2 才有）：auto-turn 链式 spawn 失控 → N3 护栏（禁 spawn 或上限）
- R2：auto-turn 模型消化质量——无用户上下文时模型可能"自作主张"推进工作 → auto-turn 注入模板限定消化动作域（仅总结报告 + 更新任务状态，不主动执行新工具？——评审定）
- R3：挂起态时长无界（用户拍板 #1 自然退出——池空即退；池不空可无限挂——用户主动行为，接受）
- R4：V1 下用户输入时池中仍有未完成项 → 该轮 prepareRun 前只注入已完成项，未完成项下轮继续注入（F6 叠加语义自然成立）——用户可能困惑"报告分轮到达" → UI 提示（区块逐个冻结 + 状态行计数）

**评估结论**：方案可行，架构落点明确（交互层挂起态 + 回合尾移交 + prepareRun 前注入 + 既有 agent 级池），无颠覆性改造；V1 是小改造（finally 语义放宽 + 交互层状态 + 注入机制复用），V2 引入 auto-turn 需额外护栏。**建议 V1 起步**（满足网友核心痛点），V2 作后续演进。

### 17.3 设计（V2 完整版——V1 注入档并入为 D-S3/D-S4 的基础语义，V2 auto-turn 为 D-S5..D-S7）

- **D-S1 回合尾语义**：`collectAsyncSubagents` 拆为 `collectSettledAsync(agent)`（注入已完成，形态不变——函数名统一，round2 #6）——**注入语义被 §17.5 替代（2026-09-03——回合尾不再直注入——详见 §17.5.2）**+ 未完成项**保留在池**（不清空、不等待、不发 done 冻结——区块继续 live）。finally 分支（agent.mjs:447-452）在"anything else"路径调用 collectSettled 后**直接返回**，不再 allSettled 等待
- **D-S2 交互层挂起态**（CLI agent-turn/startup turn 循环、VS Code 面板循环）：回合返回后 `agent._asyncSubagents` 非空 → 进入挂起态（非 processing——输入框可用、状态行"后台 N 子代理运行中"）；退出条件 = 池空（无 running/queued/**未注入**——与 F5 同口径，评审 #8）+ 无排队输入 → 回空闲。**退出判据 = 持续评估（round3 #1）**：每次 settle / 轮末 / 注入后都检查池态（无 running/queued/未注入 + 无 pendingInput 即退），不依赖"等到下一 settle"事件
- **D-S9 交互层挂起状态机（round2 #5）**——状态 × 事件 × 动作 × 出口：

| 状态 | 事件 | 动作 | 出口 |
|---|---|---|---|
| idle | 回合返回且池非空 | 置 `_suspended` → 挂起态（输入可用 + 状态行"后台 N 子代理"） | → suspension |
| idle | 回合返回且池空 | 正常回 idle | 不变 |
| suspension | 池项 settle 且无 pendingInput | settle 项入 _pendingAsyncResults → 开 auto-turn（消化/推进按档） | auto-turn 期间仍挂起（_suspended 保持） |
| suspension | 用户 Enter（无 pendingInput 在消化） | 普通新回合（D-S4；prepareRun 注入 pending） | 回合结束时池空 → idle；非空 → 回 suspension |
| suspension | 用户 Enter（消化 auto-turn 运行中） | 入 pendingInput 单槽队列（输入框清空） | auto-turn 结束后自动以该消息开新回合 |
| auto-turn | 池项 settle（消化中，round3 #1） | settle 项入 _pendingAsyncResults（**不并发开新轮**——单 runAgent 循环） | 轮末按 pending/池态评估续开或退出 |
| auto-turn | 结束且池空 + 无 pendingInput | 补发 done 冻结 + 清 _suspended | → idle（挂起自然退出） |
| auto-turn | 结束且 pending 非空 + 无 pendingInput（round3 #1） | **立即续开合并消化轮**（一次注入全部 pending——防 settle-during-digest 滞留） | → 新 auto-turn（消化后按池态评估） |
| auto-turn | 结束且池非空 | 回挂起等下一 settle（_suspended 保持） | → suspension |
| auto-turn | 结束且有 pendingInput | 自动以该消息开新回合（不触发新 auto-turn） | → 回合（结束后按池态回 idle/suspension） |
| suspension/auto-turn | Ctrl+C 第一次（未武装） | 处理中：仅中止当前回合（digest/会话内回合——round2 偏差 #4，会话与后台子代理不受影响）+ 武装 3s 窗口；纯挂起等待：仅提示武装（仿空闲态退出） | → 回 suspension |
| suspension/auto-turn | Ctrl+C 第二次（3s 武装窗口内） | 清池（§15 abort 语义）+ 清 _suspended；abort 集合 = 链条内全部 controller（含旧 controller 下 children——round1 偏差 #3） | → idle |
| suspension/auto-turn | ContinueError | 按 §2 统一续跑规则（工程 && AUTO → 自动 resume；否则询问/auto-refuse——**实现裁定：digest 撞 turn cap 无面板——AUTO 档自动 resume（agent.autoApprove 短路），手动档静默拒绝**（部分消化留在历史、会话回挂起，结果不丢；无人值守期不弹 continue 面板）） | → 续跑回合或回挂起 |

时序边界（round2 #5）：settle 与 `_suspended` 翻转竞态——`_suspended` 在 runAgent finally 返回后（交互层进入挂起前）置位；settle 回调读到的标志若为 false（回合刚结束瞬间）→ 按正常回合语义发 done 冻结（该块本就在流尾，无害）；D-S8 门控以回调读取时刻为准（确定性，无锁需求）
  - **D-S3 prepareRun 前注入（注入单主，round2 #3；行号改符号锚点——round3 #4）**：`_pendingAsyncResults` 数组（同 `_pendingDistill` 的 runAgent 首行 await 落定模式，agent.mjs:114-118 仅作 as-of 快照）——每回合（用户回合与 auto-turn）开始前把已 settle 未注入项注入历史。**条目生命周期（唯一记账点）**：settle → 入 `_pendingAsyncResults`（pending）→ **仅在 prepareRun 前注入点消费**（injected 后即从数组移除 = consumed）——D-S6 触发不再自行注入（只负责触发 auto-turn，注入由 auto-turn 的 prepareRun 统一完成）；D-S2 池空判据的"未注入" = `_pendingAsyncResults` 非空；负测试：settle 与回合边界竞态只注入一次。**消费点集合（round3 #2 收敛）**：① 回合尾 collectSettledAsync 对"回合内已 settle"项**直注入**（不经 pending，形态同 §15）——**被 §17.5 替代（2026-09-03——回合尾不再直注入排空——done 留池 → 挂起 digest——无驱动调用方保留直注入兜底——详见 §17.5.2）**；② 挂起期 settle 项入 pending → 由下个回合（用户回合或 auto-turn）prepareRun 注入；③ 退出前若仍有残余（② 的极端竞态）→ 兜底直注入再退——三路互斥：注入即从对应容器移除（直注入从池移除 / pending 注入从数组移除），负测试"只注入一次"覆盖 ① 与 ② 边界
- **D-S4 输入通道**：挂起态提交 = 普通新回合（D-S3 注入先行）；**输入框状态永不被后台事件读写**（F3 铁律——事件处理与输入框零耦合）
- **D-S5 排队（F4）**：auto-turn 处理轮 running 中用户 Enter → 消息入队（交互层 `pendingInput` 单槽队列——F3 铁律：输入框不清空、文本保留在框内可继续编辑，Enter 后消息进队列并清框），处理轮结束交互层**自动以该消息开新回合**；队列非空期间**不触发新 auto-turn**（排队输入优先）；Ctrl+I 仍可立即打断处理轮（普通插话语义保留）
- **D-S6 auto-turn（V2 核心）**：
  - **入口（一手核实 2026-09-02）**：`runAgent` 加 `{ autoTurn: true }` 选项——prepareRun 的 input 注入在 `!resume` 块内（`prepareRun` 的 pushReal input 处，setup.mjs:168 as-of），autoTurn 语义 = **不 push input + per-run 状态重置（如普通回合）+ history 尾 = 已注入的 reminder user 消息**——复用 resume 的"不 push input"机制但**不绑定 ContinueError 语义**（resume preserve per-run 状态是给续跑守卫用的；autoTurn 是系统驱动新回合，per-run 重置如普通回合：_advisorRound/_compressFailures/_asyncCheckLastN 等全重置）
  - **触发**：挂起态池项 settle 且无 pendingInput → settle 项入 `_pendingAsyncResults`（D-S3 记账）→ 交互层开 auto-turn（**注入由 auto-turn 的 prepareRun 统一完成**——单注入点，round2 #3）；**合并**：触发时 `_pendingAsyncResults` 全部已 settle 未注入项在 auto-turn prepareRun 一次注入（多子代理近邻完成 → 一轮消化全部，N1 成本护栏）
  - **消化动作域（两档，用户 2026-09-02 拍板推进型——动作域 = 模式函数）**：
    - **手动档（无 AUTO——auto-turn 只做"信息整理"，不做"状态改变"）**：auto-turn = 系统事件驱动、无用户输入的 runAgent 回合（模型只会回合式工作；"处理子代理报告"在架构上必然 = 开一个回合）。动作域：
    - **允许（整理已发生的）**：① 总结报告要点注入会话流（用户回来可读；只读验证报告声称——read/搜索类工具放行）② 更新任务清单（标 done）③ 标记需决策点 + 写下建议（"建议下一步：…"——只写不执行）
    - **禁止（让新事情发生的）**：写文件/改代码；执行类工具 bash/execute/verify（灰度 1）；spawn 一切子代理（async + 同步——**机械拒绝**，subagent.mjs 入口检查 `agent._inAutoTurn && !agent.autoApprove` → 返回 `{ status: "error", error: "cannot spawn subagents from a manual auto-turn — wait for user input" }`）
    - **灰度裁定（2026-09-02，手动档）**：灰度 1（自跑 verify/测试）→ 不跑，写成建议；灰度 2（产出落盘）→ 不写；灰度 3（只读 read 验证）→ 允许
    - **AUTO 档（autoApprove 开——auto-turn = 普通回合全语义，推进型）**：动作域 = **与用户回合一致**——读/写/spawn（async + 同步）/verify/执行类全开放（AUTO 自动执行——用户已授权无人值守，责任在用户，2026-09-02 裁定与 async 子代理同级信任）；**禁 spawn 机械限制撤销**（推进链成立：auto-turn spawn async → 池项 settle → 新 auto-turn 消化 + 可再 spawn——链终止 = 池空自然停 + 用户输入随时打断（D-S5 pendingInput 优先，输入即新回合链断））；guard 语义 = 普通回合同款（mutation → 回合内 guard 推回自验——评审 #5 修订：推进档不跳 guard）；auto-turn 结束仍有残留未验证 mutation → _inheritedGuard 并入下一用户回合（防静默漏验）。**guard 分档总则（round2 #6 归位）**：手动档结束路径不跑 guard 推回（消化语义——动作域禁 verify/测试，推回会自锁死循环）；AUTO 档 = 普通回合同款（回合内推回自验）；**两档通用**：auto-turn 的 mutation 标记（_mutatedThisRun/_touchedFiles 等）不随下轮 per-run 重置而丢——autoTurn 结束时 guard 字段合并保留（resume 式语义），下一用户回合 prepareRun 不重置（`_inheritedGuard`）→ 下轮 guard 覆盖 auto-turn 期间改动（防静默漏验）
  - **轮次上限（用户 2026-09-02 裁定，评审 #4 撤销专属预算）**：auto-turn **不另设轮次预算**——统一用系统 maxTurns 设定（runAgent 默认 200/overrideTurns 机制，§2）——"不要每个地方各搞一套"；成本护栏 = 手动档消化动作域（禁 spawn/写）+ 合并消化 + **AUTO 责任转移**（用户开 AUTO = 授权无人值守成本）；单次挂起内 auto-turn 次数自然受池大小约束（每 settle ≤1 次 + 合并消化）；撞 ContinueError → 按 §2 统一续跑规则
- **D-S7 权限（N2，round3 #3 补装配契约）**：auto-turn 撞权限门（手动模式）→ 拒绝不悬挂。**装配**：手动档 auto-turn 调 runAgent 时**不传 onPermissionRequest handler**（→ dispatch 无 handler 即 denied——不弹审批面板，防 auto-turn 期悬挂/打断无人值守语义）；AUTO 档沿用 autoApprove 自动执行。**自省工具放行分类**：task/checklist 类簿记工具按只读/豁免分类放行（手动档动作域②"更新任务清单"依赖此）
- **D-S8 状态呈现**：TUI 状态行（后台 N 子代理）/区块不冻结继续 live/池空冻结退出；VS Code 面板同构。**冻结门控（评审 #2）**：§15 "settle 即发 ⟦ev⟧done"（subagent.mjs settle 回调无条件发）在**挂起态改为延迟发**——settle 时若处于挂起态（回合已结束且池未空）→ 不发 done 冻结，区块头保持 ✓-pending 中间态（`role#id · done · awaiting digestion`）；池空冻结退出时统一补发 done（**修复轮 2026-09-03：补发按 settle 锚点 splice 落位——冻结块位于其 digest 总览文本之前而非流尾**；机制见 §7.2 D4 完成态）——**§17.5.5 supersede（2026-09-03）：digest 消化完成即逐条补发冻结回收（settle 锚点 splice——digest 总览文本之前——round1 #1 裁定）成为主路径——池空 freeze-out 仅兜底未消化残项——详见 §17.5**；正常回合内 settle（非挂起态）行为不变（完成即冻结）——subagent.mjs settle 回调需感知挂起态（agent 级标志 `_suspended`）。**`_suspended` 翻转点（round2 #7 + round3 D-S9 行表收敛——实现以此为准）**：交互层在 runAgent finally 返回后、进入挂起前置位；挂起自然退出（池空冻结补发后）清除；**会话内用户回合执行期翻 false**（普通回合语义：settle 即冻结 + 回合尾直注入 ①）；**auto-turn 消化轮执行期保持 true**（D-S9 "auto-turn 期间仍挂起（_suspended 保持）"——消化中 settle 延迟冻结 + 入 pending，轮末合并消化轮消化，round3 #1/T-S17 依赖此；round2 #7 "auto-turn 执行期恒 false" 被该行表收敛取代）——settle 回调以读取时刻为准（见 D-S9 时序边界，确定性无竞态锁）
- **受影响文件（两端）**：
  - CLI `src/agent.mjs`（✓）：finally 收尾改 `collectSettledAsync`（等全部 → 收已完成 + 移交未完成——settle 直注入委派 subagent.mjs 的 `injectAsyncResult`）；runAgent 加 `autoTurn` 选项（prepareRun 以 `resume: resume || autoTurn` 复用"不 push input"机制，per-run 状态仍按普通回合重置）；`_pendingAsyncResults` 注入（prepareRun 前，同 `_pendingDistill` 落定点）；`_inheritedGuard`（autoTurn 结束快照 guard 字段 → 下一用户回合 !resume 时恢复而非重置）；手动档消化动作域模板 `AUTO_TURN_DIGEST_DOMAIN`（autoTurn && !autoApprove 注入）；finally 清池规则改为 `signal.aborted && !signal.reason.interrupt`（Ctrl+I 不再误清池——挂起会话内 children 持 `_sessionSignal`，digest 自身 Ctrl+I/Ctrl+C 不误伤）
  - CLI `src/agent-tools/subagent.mjs`（✓）：`_inAutoTurn && !autoApprove` 机械拒绝 spawn（async + 同步，手动档；AUTO 档放行）；settle 回调挂起分流——`parent._suspended` 时改发 ⟦ev⟧settled（延迟冻结）+ 条目移交 `_pendingAsyncResults`（D-S3 ② 记账点），非挂起照发 ⟦ev⟧done；`injectAsyncResult(agent, entry)` 共享注入器（collectSettled 直注入 ① 与 run 首行 pending 注入共用，形态同 §15）；`buildChildRunOpts` signal 优先 `agent._sessionSignal`（会话 children 与回合 controller 隔离）
  - CLI 交互层（✓ agent-turn.mjs / key-handler.mjs——按实现定位；startup.mjs 无需改动）：`runAgentTurn(ctx, text, { autoTurn, skipSession })` + 挂起会话驱动 `suspensionSession`（D-S9 状态机行表：settle→pending→合并消化轮、pendingInput 优先、池空补发冻结退出）、`digestTurn`（手动档不传权限/问答 handler——D-S7 装配契约；AUTO 档普通回调）、`poolLive/sweepSettledToPending/waitForSettleOrWake/backgroundStatusText`；key-handler：挂起态 Enter（非 slash）→ pendingInput 队列 + 唤醒（F3：输入框零干扰）、Ctrl+C → 武装窗口两级中止（round2 偏差 #4：未武装时处理中仅停当前回合（digest/会话内回合）、纯等待仅提示武装，3s 窗口内再次按下才彻底中止——abort 集合全部 controller + `_suspAborted` 标记 + 唤醒）；agent-turn.mjs（round2 偏差 #1/#2-CLI）：挂起会话退出复位 `state._suspAborted`（不粘滞——中止后池再 live 可重新进入挂起态）、abort 分支残余 pendingInput 转回 `state.queue`（不静默丢）；tool-events.mjs（✓ 交互层回调装配）：权限/批权限/问答 handler 按 ctx 提供与否条件接线（手动 digest 传 null → denied 不弹面板）
  - TUI 渲染（✓）：subagent-blocks.mjs `SUB_EVENT_RE` 加 `settled` phase + routeSubToken 中间态（done + awaitingDigest 驻留面板不冻结）；subagent-panel.mjs 渲染 `!done || awaitingDigest` 条目，头部 `[✓ key · …] done · awaiting digestion`（✓-pending 中间态）；池空退出补发 done 冻结 = 既有 `freezeAllSubTasks`（runAgentTurn finally 在 willSuspend 时跳过冻结——区块跨回合 live）
  - VS Code 同构（✓ 2026-09-02 交付：suspension.mjs/panel-chat/webview 输入态/ARCHITECTURE.md §17 引用段 + test/suspension.test.mjs T-S1..S17；偏差修复轮：_chat 唤醒断链 D1 + T-S3b——架构师统一回写）
  - 测试（✓）：`test/suspension.test.mjs` 新增（T-S1..S17 完整用例表实现，agent 级/驱动级/TUI 级三层）；`test/subagent.test.mjs` §15 T5 标题与注释随 collectSettled 语义更新；§15 其余用例零改动全绿（T-S13 回归）
  - 文档（✓ 本节 + `docs/design/TUI.md` §7/模块地图 + `docs/design/TUI-INPUT-BOX.md` §1 挂起输入契约——评审 #3）；VS Code `docs/design/ARCHITECTURE.md` 引用段 + 两端 CHANGELOG（父代理统一，未做）
  - **§17.5 supersede（2026-09-03）**：本表 `collectSettledAsync` 语义与文件面在挂起驱动下再修订——CLI/VS Code `agent.mjs`（collectSettledAsync 不再直注入——suspDriven 标志/检测，无驱动调用方保留直注入兜底）+ 交互层（agent-turn.mjs / VS Code suspension 驱动——settled-only 池也进挂起、digest 触发检查点）+ TUI 渲染层零改动（17.5.4 #5）+ digest 完成逐条冻结回收（17.5.5）——详见 §17.5；受影响文件逐文件见 §17.5.2 清单
- **测试**（round2 #2：T-S1..S13 实现前必须展开为 §15.4 式完整用例表——#/场景/输入/预期/映射 + 正常/边界/错误标注 + F1-F8/N1-N5 覆盖检查——列为 eng-coder 硬验收项，§7.2 先例）：T-S1 回合尾不等（慢 async + 回合自然结束早于子代理完成）；T-S2 注入不丢（已完成项在下轮 prepareRun 前注入）；T-S3 挂起态输入可用（池非空时新回合正常开跑）；T-S4 叠加并发（两回合各派 async，池累积，上限 4 全局）；T-S5 Ctrl+C 清池回归（round2 偏差 #4 修订：彻底中止 = 武装窗口内二次按下语义——driver 级用例直接模拟二次效果，TUI 级 Ctrl+C 用例随两次制更新并注明）；T-S6 挂起自然退出（池空 → 回空闲；**修复轮 2026-09-03：+ 冻结块按 settle 锚点落 digest 总览文本之前的驱动级断言——settle token 经真实 callbacks 路由、digest 文本进流后补发冻结**）；T-S14 中间态渲染（round2 #4：挂起期 settled 块显示 "done · awaiting digestion" 驻留面板；池空冻结退出时补发 done 冻结进流——§7.2.1 F5 挂起例外回归；修复轮 2026-09-03：+ 锚点断言（冻结块 splice 落 settle 时刻流位置——digest 总览文本之前））；T-S7 auto-turn 消化（手动档：完成无输入 → 自动回合注入消化 + 要点总结进会话流）；T-S8 禁 spawn 分档（手动档 async + 同步均拒绝 / AUTO 档放行——推进链：auto-turn spawn async → settle → 新 auto-turn 消化，链在用户输入或池空时终止）；T-S9 排队续发（auto-turn 中 Enter → 队列 → 结束后自动新回合）；T-S10 权限拒绝（auto-turn 撞权限门 → 拒绝不悬挂）；T-S11 合并消化（多子代理近邻完成 → 一轮注入全部）；T-S12 AUTO 写一致性（auto-turn 下写调用在 AUTO 模式自动执行——与 async 子代理同级信任；手动模式拒绝）；T-S13 既有 §15 全回归（阻塞模式/check/上限/中断）；T-S15 双模式输入对照（round3 #5：auto-turn 中 Enter → 排队不打断、Ctrl+I → 立即打断、输入框文本不被后台事件改动——F3/F7 断言）；T-S16 压缩兜底回归（round3 #5：挂起期多注入后下轮 compressIfNeeded 触发——N4）；T-S17 settle-during-digest（round3 #5/#1：A 消化轮运行中 B settle → A 结束后自动续开合并消化轮消化 B，不滞留——F5/F8）；**round2 偏差修复轮测试（2026-09-02）**：T-S5b（偏差 #1——中止后 `_suspAborted` 复位：abort → 再 spawn async → 回合尾重新进入挂起态 + 释放窗口守卫恢复）；round2 偏差 #2-CLI（中止时 digest 期排队消息不静默丢——残余 pendingInput 转回 state.queue + 提示行）；round2 偏差 #4 TUI ×2（挂起 Ctrl+C 两次制：纯等待首次仅提示武装不中止 / 处理中首次仅停当前回合（后台 controller 不动）/ 武装窗口内再次按下才彻底中止——abort 集合全覆盖语义保留）
- **验收**：AC-S1 = 回合尾不阻塞（网友痛点：async 跑着主会话可继续对话）；AC-S2 = 子代理结果零丢失（下轮/自动可见）；AC-S3 = 输入框零干扰；AC-S4 = 挂起自然退出；AC-S5 = 既有 §15 语义回归（阻塞模式/check/上限/中断全不变）；AC-S6 = 两端全量绿；AC-S7 = F7/F8 映射（T-S15 双模式 / T-S17 settle-during-digest 自动消化，round3 #5）
  **验收核对（2026-09-02 实现后，CLI）**：AC-S1 ✓（T-S1：回合尾不等——elapsed < 子代理耗时）；AC-S2 ✓（T-S1/T-S2/T-S2b/T-S11：直注入/pending 注入/合并消化/退出兜底三路互斥）；AC-S3 ✓（T-S15：后台事件不改输入框）；AC-S4 ✓（T-S6/T-S17：池空自然退出 + settle-during-digest 合并续开不滞留）；AC-S5 ✓（§15 全回归：subagent.test.mjs 21 用例零改动全绿）；AC-S6 ✓（两端全量绿——CLI 1041 pass 0 fail + lint 210 OK；VS Code 912/912 + lint 200 OK）；AC-S7 ✓（T-S15 双模式 / T-S17 自动消化）

**偏差修复轮 2（CLI thincoder/，2026-09-02 · code review round2 findings #1/#2-CLI/#3/#4——限定 CLI 端；VS Code 端同类 findings 的修复见 ARCHITECTURE.md 记录）**：

- **#1 `_suspAborted` 粘滞**：key-handler 彻底中止置 `state._suspAborted = true`，只在 suspensionSession 首行复位——但会话入口（runAgentTurn 挂起分支 `!state._suspAborted` 门控）在标志为 true 时永不再次进入 → 首行复位是死代码。后果：① 中止后用户再 spawn async、回合尾池 live → 不再进挂起态（D-S9 "回合返回且池非空 → 置 _suspended → 挂起态"被破坏）——子代理结果退化到"下个回合尾 collectSettledAsync 才注入"，状态行/自动消化/区块驻留全消失且无提示；② 释放窗口守卫（`_suspPending = willSuspend && !skipSession && !_suspAborted`）同步失效——释放窗口 Enter 重新并发开第二个 runAgentTurn（双驱动器竞态复现）。**修复**：suspensionSession 返回后（runAgentTurn 挂起分支内、await 之后）复位 `state._suspAborted = false`——中止 unwind 已完成、池已清空/耗尽，复位不误触发重入；彻底中止路径恒 abort 会话 signal，会话退出判定不受复位影响。**测试 T-S5b**。
- **#2-CLI 中止静默丢消息**：挂起中 Enter 已清输入框并入 pendingInput（用户视为已发送）；彻底中止分支只清池（`_asyncSubagents.clear()` / `_asyncQueue` / `_pendingAsyncResults`），不处理 `state.pendingInput` → 消息在输入框已清空的情况下永久消失，无任何提示。**修复**：中止分支把残余 pendingInput 转回 `state.queue`（`{text}` 条目——下个普通回合的队列循环续发，零丢失）+ 提示行明示去向（`[background work stopped — N queued message(s) will run as a normal turn]`）。**测试 round2 #2-CLI**。
- **#3 注释整段重复**：agent-turn.mjs finally abort 集合快照注释逐字重复两份（语句夹在中间）——删第二份保留一份。
- **#4 挂起态 Ctrl+C 无二次确认**：一次按键即 abort 全部 controller + 清池终止整个后台会话；空闲态 Ctrl+C 有 3s 防误触武装，挂起态（消化中用户可能只想让刷屏的 digest 停下）与彻底中止共用同一无确认路径，误触代价高（子代理工作被 abort 丢弃）。**修复（武装窗口两级，仿空闲态退出语义）**：未武装时——处理中（digest 消化/会话内回合）首次 Ctrl+C 仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响——**supersede（2026-09-03 §17.6）：平 abort 命中 agent.mjs 回合收尾清池分支（aborted && !interrupt）一次误杀全部后台——停回合改 `abort({ interrupt: true })` 无 message——见 §17.6.2/17.6.4**）+ 武装 3s；纯挂起等待期首次仅提示武装（提示含运行中数量，不中止不清池）；3s 窗口内再次 Ctrl+C 才彻底中止（abort 集合 = 链条内全部 controller + `_suspAborted` 标记 + 唤醒 driver 清池——**supersede：二按统一为状态路由前检查（跨态桥接）——§17.6.4**）。`state.suspAbortArmed` + `ctx.suspArmTimer`（3s，可注入 `exitArmDelay` 同款窗口）；会话退出（suspensionSession finally）解除武装防跨会话粘滞。**测试兼容（按修复要求注明）**：既有单次中止断言（TUI "偏差#3"用例——round1 #3 abort 集合全覆盖）更新为两次制（首次仅武装、二次彻底中止——children 不逃逸语义保留）；T-S5 driver 级用例直接模拟二次效果（语义不变）；新增 digest 处理中首次仅停当前回合的 TUI 用例。
- 受影响：`src/tui/key-handler.mjs`（挂起 Ctrl+C 两级 + F1 帮助文案）、`src/tui/agent-turn.mjs`（标志复位 + pendingInput 转移 + 注释去重 + 会话退出解除武装）、`test/suspension.test.mjs`（T-S5b / round2 #2-CLI / round2 #4 TUI ×2 / T-S5 注释 + TUI 用例更新）、本节 + `docs/design/TUI.md` / `TUI-INPUT-BOX.md`（同步）
---



### 7.2.3 sync spawn 完成精确冻结（2026-09-03 · 设计——方案 e——**已批准**——处置注见 7.2.3.4）

> 状态：**已实现（2026-09-03 CLI 落地——方案 e——T-F1..F5 展开用例全绿——实现记录见 7.2.3.2 段尾）**。触发：用户实测——"主 agent 同步发起的 explore 完成后未从 subagent 面板回收"——场景确认：sync explore 与后台 async eng-coder 并存面板——explore 完成残留面板。

#### 7.2.3.1 问题（根因——代码已确认）

finishSubTask（subagent-blocks.mjs）无 id——按"最早 started"启发式冻结（finishSubTask 无 id——择块逻辑 as-of 2026-09-03）——假设"完成的就是最早启动的"——**只在面板单 running 块时成立**。§15 async 化后：async eng-coder（先 started）与 sync explore 并存——explore 完成 → onToolResult → finishSubTask 冻最早 started = **误冻 eng-coder 块**（还在跑——迟到 token 靠墓碑吞）——**explore 块残留面板不回收**。对照：async settle 精确（⟦ev⟧done 带 relayPrefix）——**sync 是唯一启发式路径**（§15 前单块假设残留）。

#### 7.2.3.2 设计（方案 e——ctx 回传 key → onToolResult 精确冻）

1. **subagent execute（sync spawn 路径）**：makeRelay 已生成 relayPrefix（role#N）——execute 返回前 ctx 上留 `ctx._subagentKey = relayPrefix.slice(0, -1)`——**async 分支明确不设 ctx._subagentKey（round2 #2——async ack 结果 {id, status:"running"} 到 onToolResult 时 subKey undefined——TUI 对 status:running 结果跳过冻结（既有 isAsyncSpawnResult 判定）——不落启发式）**
2. **dispatch runOne**：execute 返回后、onToolResult 前——读 `ctx._subagentKey`——`callbacks.onToolResult(name, result, toolId, subKey)`（第四参——undefined 兼容既有签名）
3. **TUI onToolResult**：sync 完成（非 async 结果）——`subKey` 有值 → **新 finishSubTaskKey(state, key, lastError)** 精确冻（含 freezeDoneSubTasks——删条目）；subKey undefined（旧路径/异常）→ 启发式兜底保留
4. **并行 sync spawn**（同批 N explore——dispatch 批并行）——各 runOne 独立 ctx——各带自己 key——乱序完成精确 ✓
5. **async 路径零改动**（⟦ev⟧done 已精确——settle 回调带 relayPrefix）
6. **错误/拒绝路径不冻结**（round1 #1）：execute 抛错/Phase-1 拒绝时 ctx 未设——该结果走普通工具错误块——**不触发 finishSubTask 启发式**（错误路径不冻结任何 running 块）——T-F5 扩为"失败/拒绝 → 不误冻"
7. **escalate 同享**（round1 #2）：§19 合并后 escalate = subagent action——同 spawn 管线同享 ctx._subagentKey（relayPrefix escalate#N）——同步完成精确冻
8. **VS Code 端声明**（round1 #6）：VS Code webview 活动流按 sub:role#id 键匹配（无启发式）——本修复 **CLI-only**——两端不需同步改

**受影响文件**：src/agent-tools/subagent.mjs（sync spawn execute ctx._subagentKey）、src/agent/dispatch.mjs（runOne onToolResult 传参）、src/tui/tool-events.mjs（onToolResult 收 subKey——sync 分支精确冻）、src/tui/subagent-blocks.mjs（新 finishSubTaskKey）、测试（subagent-blocks/tool-events——sync + async 混跑面板回收用例）

**实现记录（2026-09-03 CLI 交付——符号锚纪律，无行号引用）**：

- **完成链**：subagent.mjs 阻塞 spawn（sync 成功路径）返回前 `ctx._subagentKey = relayPrefix.slice(0, -1)`——**仅成功路径**：async 分支不设（round2 #2——ack 结果带 status:running 由既有 isAsyncSpawnResult 跳过冻结）；错误/拒绝（throw/门拒早退 return）到该点之前已离开——ctx 未设。escalate 同享（round1 #2）：subagent-async.mjs 成功返回前同设（`!escErr`——运行中途失败不设）。dispatch runOne 把工具 ctx 对象提升为变量、execute 返回后读 `toolCtx._subagentKey` 作 `onToolResult(name, result, toolId, subKey)` 第 4 参——undefined 兼容既有签名（普通工具/老回调零波及；toolRouter 短路路径不带 key）。TUI tool-events onToolResult 收 subKey——完成分支路由 subagent-blocks.mjs 新 `finishSubTaskKey(state, key, lastError)` 按 key 标 done（冻结载体进流 + 删条目由既有 freezeDoneSubTasks 承接——与 §17.5.5 freezeReclaimDigestedBlocks 等锚点冻结家族并存不冲突）。
- **兜底三支**（onToolResult spawn 完成分支）：① subKey 有值 → finishSubTaskKey 精确冻（T-F2/F3）；② spawn 门拒错误（`{status:"error"}` JSON——manual auto-turn spawn 门拒绝即此形态）→ **不冻结任何块**（round1 #1"错误路径不冻结任何 running 块"的机械落实——错误文本预览保留供用户可见——T-F5）；③ subKey undefined 非错误（老回调/测试直调/未知工具成功路径）→ 既有 finishSubTask 启发式兜底（面板单块时与精确冻同效——T-F1）。escalate 分支同款（subKey 有值精确冻 / 无值角色启发式——escalate 串行 + 角色限定，启发式天然精确）。
- **行为差异（如实上报，非简化）**：escalate 运行中途失败（escErr 软返回——错误文本形态）不设 key——TUI 走 escalate 角色启发式冻结自身 partial 块（legacy 行为不变——角色限定不触他块）；sync spawn 硬失败（throw）由 dispatch 错误块承接——不调 onToolResult（既有架构事实，T-F5 断言锁定）。
- **测试落位**：finishSubTaskKey 数据层（test/subagent-blocks.test.mjs——T-F1/F2/F3/F5 + escalate key + lastError）；TUI 路由层（test/agent-turn.test.mjs——T-F2 核心混跑面板 / T-F3 乱序 / T-F5 门拒不冻 / T-F4 ⟦ev⟧done 回归 / escalate subKey + 兜底）；工具层（test/subagent.test.mjs——sync 成功设 key / async 不设（round2 #2）/ 拒绝与抛错不设）；dispatch 层（test/dispatch.test.mjs——第 4 参透传 / 并行独立 ctx / undefined 兼容 / 抛错与 Phase-1 拒绝不调 onToolResult）。全量 CLI 测试绿（0 fail）。

#### 7.2.3.3 测试（硬验收）

- T-F1：sync explore 完成（面板仅它）→ 回收（既有行为回归）
- T-F2：**sync explore + async eng-coder 并存**——explore 完成 → explore 块冻结回收——eng-coder 块保持 running（不误冻）
- T-F3：并行 2 sync explore 乱序完成 → 各自块精确回收（无误冻错位）
- T-F4：async settle 路径回归（⟦ev⟧done 精确冻结不变）
- T-F5：**sync spawn 失败/被拒（execute 抛错/Phase-1 拒绝——ctx 未设）+ async running → 不触发启发式冻结（round1 #1——错误路径不冻结任何 running 块）**——subKey undefined 兜底仅成功路径未知工具/老回调——不崩

**验收**：AC-F1 = sync 完成必回收且不误冻他块（T-F2/F3）；AC-F2 = async/既有路径零回归（T-F1/F4）；AC-F3 = 兜底防御（T-F5）

### 17.5 §17 硬化轮：settle 完成队列（2026-09-03 · 设计——方案 B 用户批准——**已批准**——round1 处置注见 17.5.4）

> 状态：设计批准（2026-09-03 round1 通过——0🔴——6 refinement 处置注见 17.5.4——designToken 已签发）。触发：用户复现——"前端回合在跑时后端 eng-coder 完成——丢 digest——没看到交付后处理"——建议"先进完成队列——前端忙完再挨个处理"（explore 诊断 2026-09-03——缝隙 A 滞留/B 结构性互斥/C 可见性——TODO 立项）。

#### 17.5.1 问题（诊断结论）

回合中 settle（_suspended=false——前端 processing）→ 非挂起分支（subagent.mjs settle finally 分流处）只发 ⟦ev⟧done + 条目留池等"回合尾 collect"——缝隙：
- **A 滞留**：长回合（工具循环）报告滞留池内无通知
- **B 结构性互斥（正主）**：collectSettledAsync 回合尾**先注入排空**（最终答复后——本轮模型已不可能处理）→ 池空 → willSuspend=false → **挂起会话不启动 → digest 永不触发**——消化机制只服务挂起态 settle——回合中 settle 与消化互斥（对照：ContinueError 取消路径反而消化——collect 被跳过 → 留池 → 挂起 → digest）
- **C 可见性/丢失**：注入不进 state.lines（当前会话不可见——"似乎丢失"字面来源）——滞留期 Ctrl+C 清池不注入 → 报告真丢

#### 17.5.2 设计（方案 B——用户批准——"空闲再挨个处理"语义）

**collectSettledAsync（agent.mjs 回合尾 collect 函数）语义变更**：回合尾**不再直注入排空**——done 条目**留池**（状态不变——settled not consumed）→ agent-turn willSuspend（poolLive 已覆盖池非空）判 true → 进 suspensionSession → 首轮 sweepSettledToPending → pending 非空 → digestTurn → digest runAgent 首行统一注入（prepareRun pending 注入）→ 模型消化 → 池空自然退出冻结。多条目近邻完成 = 合并消化一轮（D-S6 既有）。

**语义变化（显式接受）**：正常回合尾残留已 settle 未消费条目 → 烧一个 auto-turn 消化轮（手动档 organize-only / AUTO 档全语义——既有护栏复用）——消化输出进流 → 用户可见 "[auto-turn: digesting finished subagent reports…]" + 消化总结——**补可见性缺口（C）**。

**不变面**：suspension 内 Ctrl+C 两级中止清 pending（用户显式停——语义与现状一致）；check/status 在 sweep 前仍从池读（语义保持）；ContinueError/cancel 路径既有消化语义不变。

**受影响的测试语义**：test/subagent.test.mjs T5（subagent.test.mjs 回合收尾用例——现断言"直注入+清空+done 先于结论"——符号锚）→ 改断言为"回合尾消化轮注入"——**round1 #2 裁决覆盖本条（见下受影响文件清单）：agent 级无驱动 T5 断言不变——"回合尾消化轮注入"仅适用驱动级用例（T-S2/T-H 系列——T-H6 改指）**。

**受影响文件（round1 补全 + 实现版自查补实际模块——2026-09-03 交付）**：
- CLI：`src/agent.mjs`（collectSettledAsync——回合尾不再直注入——**无 suspension 驱动调用方保留直注入兜底**（round1 #2——标志/检测——headless/直连 runAgent 不丢结果）；suspDriven runAgent 选项）；`src/tui/agent-turn.mjs`（runAgentTurn 驱动标记 suspDriven:true + willSuspend 判 true 路径——digest 触发检查点——settled-only 池也进挂起 + inSessionTurn 收尾守卫 + suspensionSession 内 digest/用户回合后逐条回收调用 + 状态行文案区分（round1 #6））；`src/tui/subagent-blocks.mjs`（freezeReclaimDigestedBlocks——17.5.5 逐条冻结回收实现载体）；**TUI 渲染层零改动**（round1 #5——mid-turn settle 块已在 settle 时刻 ⟦ev⟧done 冻结入流——消化文本落其后——无需改渲染）
- VS Code（round1 #1——N5 两端一致）：`src/agent.mjs`（collectSettledAsync suspDriven 透传）+ `src/agent-tools/subagent-async.mjs`（collectSettledAsync 同语义——留池不排空）+ `src/extension/panel-chat.mjs`（runOpts suspDriven:true——面板 = 挂起驱动）+ `src/extension/suspension.mjs`（驱动核对 + reclaimDigestedBlocks——17.5.5 逐条补发 done）+ ARCHITECTURE.md 引用段（supersede 注）+ 对应 T5 断言——同批或架构师统一回写标注
- test/subagent.test.mjs（T5 断言——**round1 #2 裁决：T5 = agent 级无驱动用例——保留直注入兜底语义——T5 断言不变**——"回合尾消化轮注入"仅适用驱动级用例（T-S2/T-H 系列——T-H6 改指））+ §17 T-S2 核对（agent 级——兜底覆盖）
- 文档修订注扩至（round1 #3）：**§17 D-S1/D-S3 ① + D-S8 + §17.3 文件表 + §15.4 T5/AC3 + §15 D-A3**（supersede 注——§15 D-A2/§19.5 先例）+ AGENT-LOOP 本段权威
- **AC-H4 新增**（round1 #3）：文档修订注已全部落地（上列各处——实现验收项）

#### 17.5.3 测试（硬验收——eng-coder）

- T-H1：回合中 settle（子代理先于父最终答复完成 + 模型不调 check）→ 回合自然结束后——消化轮触发（digest auto-turn）——报告注入模型上下文 + 消化输出进流可见
- T-H2：多条目近邻 settle → 合并一轮消化
- T-H3：check 提前消费（模型调 check 取走）→ 池空——无多余消化轮（不重复烧）
- T-H4：滞留期 Ctrl+C → 清 pending 不注入（既有语义回归）
- T-H5：挂起态 settle 路径回归（既有好路径不变——T-S14 等）
- T-H6：驱动级测试断言更新（直注入 → 回合尾消化轮——T-S2/T-H 系列——agent 级 T5 因无驱动兜底保留直注入——round1 #2）

**验收**：AC-H1 = 回合中 settle 报告必达模型（消化轮——T-H1）；AC-H2 = 无重复消化（check 消费后不烧——T-H3）；AC-H3 = 既有挂起/Ctrl+C 语义零回归（T-H4/H5）


## 18. 工程交付协议：eng-coder 默认 async + 内部自审计闭环（2026-09-02，用户重构裁定：链下沉 eng-coder 内部）

> **状态：设计批准（2026-09-02 round5 通过——0🔴，4🟡+3🔵 advisory 已处置——designToken 已签发）**。用户实测痛点：同步 spawn 的 eng-coder 阻塞主会话——"功能目的就是 eng-coder 执行中主会话能去干别的"。初版设计（主会话跨 digest 自动链状态机）经 round1/round2 评审暴露状态机载体/驱动/停止机制缺陷后，**用户拍板重构：把交付后审计/修正/review 全部移入 eng-coder 子代理内部**——主会话只 spawn 一次（默认 async），子代理内部完成"实现 → explore 偏差审计 → 自修 → advisor 复评 → 收敛"后一次交付。主会话侧无链状态机。用户裁定要点：① eng-coder **默认 async**（§15 F4 修订）；② 交付协议在 **eng-coder 内部**闭环（B1 全自动——手动档也跑，无需用户在旁）；③ **eng-coder 工具集加 explore**（内部 spawn 同源偏差审计）；④ 收敛上限 5 轮修正；⑤ 双通道并行（§17 既有——用户输入与 async 子代理互不打断——无链状态可停）。

### 18.1 需求

- F1：`subagent` 工具 **eng-coder role 默认 async**（不带 async 参数 = async:true）——explore/plan 等其余角色默认阻塞不变；显式 `async: false` 可强制同步（需要"派完立即连续处理"的场景——如架构师要现场复核）
- F2：eng-coder async 交付 = **已审计已评审的最终交付**——子代理内部协议：实现 → explore 偏差审计 → dirty 自修 → advisor code review → findings 自修 → 收敛 → 交付报告（含审计/评审轮次与终态）
- F3：内部协议在**手动模式也完整执行**（子代理内部自闭环——不依赖用户在场；主会话 digest 只做既有消化）
- F4：收敛上限 **5 轮修正**（内部计数）——超限子代理停下并交付 stalled 报告（不静默）
- F5：**双通道并行**（§17 既有）：主会话派完即结束回合进挂起——用户输入随时接管（与 async 子代理并行）——"停链" = 中止该 async 子代理（§15 既有中止语义——Ctrl+C/会话中止/回合内指示中止）
- F6：**eng-coder 内部 spawn 受限**：只允许 explore role + 同步（机械层）——防内部递归 spawn eng-coder 无限嵌套；非 explore 角色/async → 工具层拒绝
- F7：两端一致（CLI/VS Code 同构）

### 18.2 设计

**D-E1 eng-coder 默认 async（§15 F4 修订）**：`subagent` schema 的 `async` 布尔——**缺省按 role 解析**：`role === "eng-coder" ? true : false`（schema description 注明）；`async: false` 显式覆盖。调用方（架构师）派 eng-coder 默认 async → spawn 返回 `{id, running}` → 主回合结束进挂起（§17）→ 交付 settle → digest 注入消化。**子代理内（depth>0）spawn 规则不变**（§15 顶层限制——async 仍仅 depth-0；eng-coder 内部 spawn 见 D-E3——同步受限）。

**D-E2 eng-coder 内部交付协议（本轮核心——替代跨 digest 链状态机）**：eng-coder 子代理的任务书（父 agent spawn 时生成——架构师按既有结构化任务书 + 本协议附录）与提示词（engineering-sub.md 扩展——byte-identical 三件套）共同驱动内部闭环：

```
① 实现——照设计文档（**清单外文件：A 裁定 2026-09-04——允许但必须逐项报告**——见 §18.10 D-10.2 ② + ENGINEERING-MODE.md FR6；**设计文档除外**——永不编辑——见下 / 验收自验）
② 自查透明表（交付报告逐条 Done/Simplified/Not done——既有）
③ spawn explore 偏差审计——对照设计逐条查四类偏差
   （部分实现/静默简化/文档漂移/超清单改动——与 2026-08-30 主侧审计同规格）。
    **文档漂移处置（round5 #5）**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物——**A 裁定仅指代码文件——设计文档永远在"零编辑"范畴**）——真实文档漂移（设计本身需改）→ 写入交付报告/stalled 注记——文档修订归架构师/父侧（防子代理改文档洗审计）
   **审计任务书独立性（round4 #4）**：任务书基于**父 spawn 任务书**（设计文档 + 验收标准 +
   受影响文件清单——架构师 spawn 时已传入——非 eng-coder 自由生成）；交付文件清单
   = 父任务书文件清单 ∪ eng-coder 实际 _touchedFiles 的**机械并集**（不取自 eng-coder 自述——
   防自述漏报逃逸超清单审计——T-E15）。**子代理零 git（2026-09-04——§18.5）：explore/plan spawn 一律不注入
   git 上下文（CLI 注入分支删除——按 §18.5 D-AG1）——审计证据 = 设计文档 + 磁盘当前状态 + _touchedFiles；git status
   全工作区脏状态与任务域无关，不作超清单依据——见 §18.5 D-AG1/D-AG3**
④ 审计 dirty → 同一子代理回合继续自修（不需要第二个 spawn——invent nothing new：
    审计发现清单即任务）→ 回 ③（explore 再审计）**（superseded——2026-09-04 §18.7 D-TS2：修正轮默认不重跑审计——仅触碰未覆盖文件才回③）**
⑤ 审计 clean → 调 advisor（type=code，documents = 设计文档 + 交付文件清单）
⑥ advisor 有需修 findings → 自修 → 回 ⑤（advisor 复评）——**仅当修复触碰了上次评审未覆盖的文件**才先回 ③ 再审计（round5 #1 定稿路由）**（superseded——2026-09-04 §18.7 D-TS2：修正轮默认不重跑复评——终审=advisor 复评 1 次定案）**
⑦ clean → 交付报告：Done 透明表 + 审计轮次/评审轮次/终态（clean/stalled）
```

- **收敛计数（评审 round3 #5 定稿 + round5 #1 明确——提示词轮次提醒）**：修正轮（④⑥的每次自修——**④⑥ 共享同一计数**）计数 ≤5——**计数载体 = engineering-sub.md 每轮注入的"修正轮 N/5"提醒**（协议节点前模型自述轮次——纯提示词纪律 + 报告自述终态）——超限即停，交付报告标注 `stalled` + 未收敛点清单（不静默）。**机械后备（round5 #2）**：spawn-child 拒绝 eng-coder 子代理**第 7 次 explore 审计 spawn**（error 提示"修正轮超限——交付 stalled 报告"）——复用既有"节点失败重试 1 次仍败 → stalled"错误路径——5 轮纪律失效时不静默（提示词层 + 计数层双保险）
- **父侧 NFR2/MAX_ADVISOR_ROUNDS 交互（round4 #5）**：父侧"第 6 次 advisor 调用机械拒绝"只约束父代理发起的 code review（ENGINEERING-MODE NFR2）——in-child advisor 调用豁免该计数（bounds = 子代理 100 turn 上限 + stalled 报告兜底——§18.4 N1 "复评 ≤6" 是子代理内部纪律估计，不触发父侧 NFR2）
- **子代理 turn 上限交互（评审 round3 #4）**：内部协议回合计入子代理既有 100 turn 上限（§2）——大实现 + 审计≤6 + 复评≤6 可能撞 cap：撞 cap = 子代理按既有语义返回（手动档自动拒续——报告带 turn-cap 原因 = 部分交付不静默；工程模式 && AUTO → 自动续跑（§15 D-A3 例外既有））——协议不为此调高上限（AUTO 续跑兜底）
- **主会话 digest 只做既有消化**（手动档：整理交付报告要点——交付报告自带审计/评审记录，用户一眼看到质量闭环状态；AUTO：可继续推进后续任务）
- **无跨 digest 状态机**：无 _engChain/无白名单门/无 poke/无退出门控/无冲突仲裁——round2 评审 #1/#2 的全部状态机问题随重构消解（复杂度归位到子代理内部回合循环——子代理回合本来就有 chat/tools 迭代能力）

**D-E3 工具扩展 + 任务域授权（评审 round3 #1——用户裁定：进子代理前授权，内部自动）**（setup.mjs depthOnly 装配——当前 eng-coder = [advisorTool, verifyTool]——补 subagent 受限变体）：
- eng-coder 子代理的 subagent 工具 schema：**role 枚举只有 explore**（参数层过滤——spawnChild 处机械校验：eng-coder 上下文（depth>0 且角色 eng-coder）spawn 非 explore role → 拒绝 error）
- **async 强制 false**（同步——eng-coder 内部回合等审计报告再决策——§15 顶层限制不变：async 仍仅 depth-0）
- explore 审计报告经子代理 relay 注入 eng-coder 回合（既有 §7.1 管线——子代理区块/报告形态复用——无新接线）
- 递归深度自然受控（explore 无 subagent 工具——审计链路不长于 1 层孙子）
- **任务域授权（用户裁定——评审 round3 #1）**：授权点 = **spawn 时刻**（架构师 spawn eng-coder 前用户已批准设计+任务）→ eng-coder **内部所有写操作自动放行**（autoApprove 等效——豁免 §7 手动档子代理写透传父审批（:91 人在回路）/§15 D-A3 无 handler 拒绝（:542）——不弹逐写面板——与 18.3 "用户批准任务 = 授权" 一致）。**作用域限定**：任务域 = designId 对应设计文档 + 任务书文件清单（越界写仍受 eng-coder 纪律约束——交付偏差审计兜底（T-E13）。**交叉引用注（round5 #6 锚点化）**：§7「权限」条（手动档子代理写透传——人在回路）与 §15 D-A3「权限交互」条（无审批回调拒绝）的 blanket 句对 eng-coder 不再成立——两处同批加"eng-coder 例外见 §18 D-E3"指向（单源纪律——AC-E7）——T-E15 手动档写权限用例：autoApprove=false 会话中 eng-coder 写文件成功）。**非 eng-coder 子代理（explore/coder 等）手动档语义不变**（§7 人在回路保留）。实现：spawn eng-coder 时 child runOpts 置授权标志——**豁免粒度 = 仅 onPermissionRequest 阶段**（autoApprove 等效——round4 #3：Phase-1 清单的 JSON 解析/未知工具/planMode deny/design-token deny 照常生效——绝不全清单豁免）——受影响：src/dispatch 权限门（onPermissionRequest 分支）+ setup/spawn-child runOpts
- explore 内部 spawn 只读——无权限门问题（§4 只读豁免）

**D-E4 交付与消化（主会话侧）**：eng-coder settle → 交付报告注入（§15/§17 既有 collectSettled/pending 注入——无交付检测/链启动逻辑）→ 下一 digest/用户回合消化（手动档 digest 总结要点注入会话流——交付报告含"审计 N 轮 clean / advisor 复评 M 轮 clean/stalled"记录——质量闭环可见）。

**D-E5 双通道与中止（F5）**：§17 既有语义——用户输入 = 新回合与 async 子代理并行；"停链/调整" = 用户回合指示 → 模型中止该 async 子代理（§15 既有 abort 路径——子代理中止 → settle error → 注入）或 Ctrl+C（挂起态两级中止——round2 #4）。**无链状态可改**（重构红利）。

**D-E6 收敛与终态**：eng-coder 报告自述终态——`clean`（审计 clean + advisor clean——报告含轮次）或 `stalled`（5 轮修正未收敛 / explore 或 advisor 节点失败重试 1 次仍败——报告含未收敛点/失败原因）。**盲信对齐（评审 round3 #8）**：内部 advisor code review 以实际文件为对象（documents = 设计文档 + 交付文件清单——独立于 eng-coder 自述——§13 禁盲信纪律在子代理内部落实）；**可行性注（round4 #1 核实）**：advisorTool 已在 eng-coder 子代理工具集（setup.mjs eng-coder depthOnly 装配分支——§7.1 角色矩阵"coder/eng-coder 自带 verify/advisor 自评"——round2 #7 符号锚点化）且实现无 depth/role 限制——ENGINEERING-MODE.md 2026-08-01 裁定（"子代理环境无法真实调用 LLM advisor"）依据 = 当时工具未装配——随本设计同批反转（见受影响文件）；主会话对报告的信任 = 对"内部已做文件级复核"的信任——父侧复核（ENGINEERING-MODE.md 原 step 7 父侧自动偏差审计——round4 #6 术语：该节点原为**自动**（2026-08-30 裁定——无需用户发起）非"手动"——随本设计改为父侧**可选**复核——默认由内部协议承担）保留可选——两文档口径同批一致化。

**受影响文件（两端）**：
- CLI：`src/agent-tools/subagent.mjs`（schema 默认按 role 解析 async）、`src/agent/setup.mjs`（eng-coder depthOnly 工具装配——加受限 subagent（explore-only + 同步））、`src/agent/spawn-child.mjs`（role 过滤校验：eng-coder 上下文 spawn 仅 explore）、`src/prompts/engineering-sub.md`（内部交付协议附录 + 修正轮计数提醒——byte-identical 三件套）、`src/prompts/engineering.md`（两端——架构师侧 spawn→等报告→主侧审计流程改 async+内部协议口径——防双重审计/误用）、`src/agent.mjs`（核验：digest 消化既有——若零改动从清单移除——实现前定稿）、docs/design/AGENT-LOOP.md §18 本节、ENGINEERING-MODE.md（**全量同步点**——round4 评审 #1：① FR4 代码评审归属行——2026-08-01 裁定"eng-coder 子代理环境无法真实调用 LLM advisor"**反转**：advisorTool 现已在 eng-coder 子代理工具集（eng-coder 子代理工具装配点——advisorTool）且工具实现无 depth/role 限制（advisor.mjs——readonly 内嵌循环）——裁定依据（当时工具未装配）已过时——同批更新 FR4 + §2.3 门表两行（Code review/偏差审计）+ AC5/AC9 + §7 变更记录 2026-08-30 条——不留双文档矛盾）、CHANGELOG（两端，父代理统一更新）、两端测试
- VS Code：同构（setup-reminders.mjs/run-helpers 装配对应 + prompts 同批）
- 测试（实现前展开为 §15.4 式完整用例表——eng-coder 硬验收项）：
  - T-E1 eng-coder 缺省 async（spawn 返回 running 不阻塞）——explore 缺省阻塞（回归）
  - T-E2 async:false 显式覆盖（eng-coder 同步）
  - T-E3 eng-coder 内部 spawn explore 成功（审计节点——同步返回报告）
  - T-E4 eng-coder 内部 spawn 非 explore role（eng-coder/explore 以外）→ 工具层拒绝
  - T-E5 eng-coder 内部 spawn explore 带 async:true → 拒绝（同步强制）
  - T-E6 内部协议：mock 审计 dirty → 自修 → 再审计 clean → advisor clean → 报告含轮次
  - T-E7 收敛上限：5 轮自修未 clean → stalled 报告（含未收敛点）
  - T-E8 explore/advisor 节点失败重试 1 次仍败 → stalled 报告
  - T-E9 主会话双通道：eng-coder async 运行中用户输入 → 新回合正常；回合指示中止 → 子代理中止（§15 回归）
  - T-E10 §15/§17 全回归（阻塞模式/挂起/消化分档——手动档 digest 禁 spawn（§17 N3）不变；AUTO 档 digest 可 spawn（推进链——§17 D-S6 AUTO 档）不受 §18 影响）
  - T-E11 交付报告 digest 消化：手动档 digest 总结注入（含审计/评审记录可见）
  - T-E12 域内写授权：autoApprove=false 会话中 eng-coder 写**任务域内**文件成功（spawn 即授权——手动档无逐写面板）
  - T-E13 域外写：eng-coder 写任务域外文件——机械上不拦（纪律层）——交付偏差审计报告含"超清单改动"标注（审计兜底可见）
  - T-E14 授权粒度：授权标志只豁免 onPermissionRequest 阶段——planMode/design-token 门仍在子代理内生效（回归）
  - T-E15 审计任务书独立性：内部 explore 审计任务书基于**父 spawn 任务书**（设计文档 + 验收标准 + 受影响文件清单）——非 eng-coder 自由生成（round4 #4）
  - T-E16 **prompt 内容断言（round5 #4——工程惯例 T9/T-B4 式）**：engineering-sub.md 含协议步骤 + "修正轮 N/5"提醒（byte-identical 两端）；engineering.md 含 async 交付叙述（byte-identical 两端）+ **重断言 "Cap: at most 4 concurrent eng-coders"/"past 4"**（保 §15 T9 不破）；subagent schema async 描述 = 角色级默认措辞
- 验收：AC-E1 = eng-coder 默认 async（T-E1/T-E2）；AC-E2 = 内部协议闭环（T-E3..E6）；AC-E3 = 收敛上限不静默（T-E7/T-E8）；AC-E4 = 受限 spawn 边界（T-E4/T-E5）；AC-E5 = 双通道与中止（T-E9）；AC-E6 = 两端全量绿（T-E10/E11）；AC-E7 = §7 权限条与 §15 D-A3 权限交互条同批加"eng-coder 例外见 §18 D-E3"指向（round5 #3——doc 断言随 T-E16）

### 18.3 关键决策

- **内部链而非主会话链（用户重构裁定）**：round2 评审证明跨 digest 状态机（stage 载体/池空驱动/停止机制）复杂度高且缺陷多——用户拍板把审计/修正/评审循环下沉到 eng-coder 子代理内部（子代理回合循环天然支持迭代——零新状态机）；主会话恢复简单（默认 async + 既有消化）
- **eng-coder 加 explore（用户裁定）**：内部同源偏差审计需要 explore 角色——工具集补受限 subagent（explore-only + 同步）——保留 2026-08-30 审计规格（四类偏差/对照设计）的隔离价值；advisor（已有）承担 code review 层——两闸在子代理内部齐备
- **默认 async 角色级**（非全局）：explore/plan 同步保留（§15 F4 仅 eng-coder 修订）；显式 async:false 覆盖
- **B1 责任转移哲学延续**：用户批准任务 = 授权 eng-coder 在任务域内自动实现+审计+自修（无需逐轮审批——D-E3 无需额外授权机制——eng-coder 本身就是已批准执行者）
- **否决**：a) 主会话跨 digest 链状态机（round2 评审否决——见上）；b) eng-coder 内部自由 spawn（任意角色/async——递归失控风险——D-E3 受限）；c) 用户输入暂停子代理（双通道并行——§17 核心——停 = 显式中止）

### 18.4 非功能需求

- N1：**成本有界**——内部协议自动轮次上界 ≈ 实现 1 + 审计 ≤6（1+5 修正）+ advisor 复评 ≤6 + explore 子代理开销——有界收敛（5 轮纪律）——不无限
- N2：**不静默**——stalled/失败均入交付报告（自述终态）——主侧 digest 消化可见
- N3：**两端一致**——CLI/VS Code 同规格（F7）——VS Code 实现按 ARCHITECTURE.md 惯例落引用段

### 18.5 子代理零 git：审计与普通探索均不注入 git 上下文（2026-09-04 · 用户裁定——**已批准**）

> 状态：**设计批准（2026-09-04 round1 0🟡通过——7🟡+3🔵处置见 18.5.1——designToken 已签发——用户已批准——实现中）**。触发：用户实测工程模式审计"经常想用 git 检查但没给工具 / wait / 思路反复"——根因分析实证见下；**用户两次裁定**：①"偏差审计也应该禁掉 git……我是要检查现码和现设计之间的偏差，关 git 什么事儿"——方向从"给 explore 只读 git 变体（B 方案）"**反转**为"审计零 git"；②随即扩展为"**根本就不应该注入 git 上下文，注入了又会误导**"——**普通（非审计）explore/plan 同样不注入**（撤销"保留注入、VS Code 补实现"的初版设计）。B 方案废弃，fetch/archive 白名单议题随方案失效。

**问题（实证——2026-09-04 一手核实）**：

1. **CLI `src/agent-tools/subagent.mjs` 的 spawn input 组装处**（git 注入块——`collectGitContext` 调用点；:327-328 as-of 2026-09-04）：explore/plan spawn **无条件**在 input 前置 `<untrusted_git_context>`（`collectGitContext`：branch + log -5 + `status --short`）——审计 explore（`engAuditAttempt !== null`）与普通探索**同样收到**。注入内容是**全工作区**脏状态快照，与任务域无关：审计场景与 `_touchedFiles`（任务域机械并集）不一致 → "status 里这个文件算不算超清单？"语义陷阱；普通探索场景把无关乎任务的仓库状态塞进上下文——用户裁定："注入了又会误导"。
2. **`src/prompts/explore.md`（两端）**：:6 "Git context (branch, recent commits, working tree state) is injected with your task—use it, no need to re-run git orientation commands"——声明注入（含指令误导：指引用 git 上下文）；:12 "Run read-only shell commands (git log, git diff, ls, find) when helpful"——**承诺 git 命令能力**。但 explore 工具集经 `readonlyToolNames` 过滤（`subagent.mjs` 的 role 工具面裁剪点），`gitTool` 导出标记 `readonly: false`（`src/tools/git.mjs`）→ **工具不存在**。指令-能力断裂：提示词诱导"跑 git diff"，工具面拒绝，模型只能全量 read 猜差异——"想用 git 却没给工具"的直接机理。
3. **VS Code subagent 工具 description**（explore 行——§7.1 逐字对齐）+ **VS Code `explore.md` 注入声明段**："Receives git context auto-injected / Git context is injected with your task"——**承诺注入**；但实现中 `childInput` = task 原样（`runAgent(child, …)` 的 `childInput` 传递点），grep 全仓无 `collectGitContext`/`untrusted_git_context`——**注入从未实现**。与 CLI 方向相反的承诺-实现断裂（CLI：实现有、prompt 乱承诺命令；VS Code：prompt/描述承诺、实现没有）。
4. **语义**：子代理证据链 = 任务书 ∪ 磁盘当前状态（read/glob/grep）∪（审计时）`_touchedFiles` 机械并集——**无一项来自 git**。git 是污染源：`git diff HEAD` 不可见**已提交**修复（7d49a52/d3be613 advisor 痛史同构——"committed fixes never show in diff HEAD"）、untracked 新文件不可见、`status` 是全工作区脏状态。依赖 git 判"改了什么" = 既有盲区又带污染的快照——比没有 git 更危险。

**F（功能性需求）**：

- F-AG1：作为用户，我希望**全部 explore/plan 子代理零 git**——不注入 git 上下文、不承诺 git 命令、工具集无 git——子代理证据链只含"任务书 + 磁盘当前状态（read/glob/grep）+（审计时）_touchedFiles"。（用户裁定①"检查现码和现设计之间的偏差，关 git 什么事儿"+ ②"根本就不应该注入 git 上下文，注入了又会误导"。）
- F-AG2：作为用户，我希望 CLI 与 VS Code **两端行为一致且均为零 git**——消灭"一端实现注入（CLI）、一端只承诺（VS Code）"的分叉。
- F-AG3：作为用户，我希望审计任务书明文化范围权威声明——`_touchedFiles` 为审计范围；工作区其他改动与本任务无关，不作超清单依据。

**NFR**：

- N-AG1：**审计范围防线不变**——零 git 只改子代理的输入/提示词面，`_touchedFiles` 机械并集与父任务书拼接（§18 D-E2 ③/T-E15）原样保留（独立性不依赖 git）。
- N-AG2：**不触 advisor**——`advisor/run.mjs` 恒定六工具、`messages.mjs` 零 git 维持（d3be613 用户裁定"advisor must never touch git"不变）。
- N-AG3：**两端同批 + 内容断言同步**（prompts 变更三件套惯例）。
- N-AG4：**零回归**——**顶层主 agent 的 git 上下文（§3 prepareRun，`setup.mjs:88` depth===0，`agent.mjs` 导入链）不属本裁定**：主 agent 有完整 git 工具、每轮实时收集非 stale 快照、无断裂问题——删除只触子代理 spawn 注入面；`helpers.mjs` 的 `collectGitContext` **保留**（顶层仍在用）。

**D（设计决策）**：

- D-AG1（权威句）：**子代理零 git（全角色）**。CLI `subagent.mjs:326-329` 的 git 注入分支**整体删除**（不再调用 `collectGitContext`；`engAuditAttempt` 判定、审计块拼接 :335-340 原样保留——审计范围防线不动）；VS Code 维持无注入（无需补实现），两侧对齐。
- D-AG2：`explore.md`（两端）:6 注入声明**删除**（"Git context is injected…" 整句移除）；:12 的 git 命令承诺**删除**（"git log, git diff" 移除，保留 ls/find 类只读表述或改写为"以实际工具集为准"的通用句）。
- D-AG3：审计任务书（两端拼装处）追加范围权威声明：`_touchedFiles` 为审计范围；本任务零 git（不注入 git 上下文）；工作区未列于 `_touchedFiles` 的改动与本任务无关，不作超清单依据。
- D-AG4：**两端** subagent 工具 description（§7.1 逐字对齐——CLI/VS Code 同款）的 "Receives git context auto-injected" 措辞**删除**，改为零 git 语义（"No git context injected—evidence from read/glob/grep and the task book"）——描述与实现一致；两端 test/subagent.test.mjs 的同名断言（§7.1 "两端各一"）**反转为零 git 断言**。
- D-AG5（**否决记录——2026-09-04 沿革**）：方案 A（父侧注入 diff 文本）与方案 B（git 只读变体 + action 级白名单——含用户此前"fetch 保留/archive 禁"议题）**均废弃**——裁定零 git 后 B 的"能力缺失"前提不成立；fetch/archive 白名单议题随 B 方案失效，不再单列。初版"非审计保留注入、VS Code 补实现"亦被二次裁定撤销。
- D-AG6（**同构性声明**）：本裁定与 advisor 零 git（7d49a52 → 77c411b → d3be613 三次演进，教训 = "只有物理取消（工具/输入不存在）才闭环，提示词拦不住"）同构——子代理与 advisor 同属"对照验证"上下文，零 git 是统一结论；本就无 git 工具集（readonly 过滤）+ 删除注入 = **双物理防线**，与 advisor 一致。
- D-AG7（**范围边界**）：顶层主 agent git 上下文**保留**（§3 prepareRun——历史背景不同：有完整 git 工具、实时收集、无断裂）。若用户后续裁定顶层也禁，另行申请。

**受影响文件（两端）**：

- CLI：`src/prompts/explore.md`（D-AG2）、`src/agent-tools/subagent.mjs`（D-AG1 删除注入分支 + D-AG3 声明 + **D-AG4 工具描述零 git 措辞**）、`test/agent.test.mjs`（explore.md 断言同步——失败即新增/修订）、`test/subagent.test.mjs`（**"git context auto-injected" 断言反转**（§7.1 两端各一）+ 新用例）；`src/agent/helpers.mjs`/`src/agent/setup.mjs`/`src/agent.mjs` **不改**（collectGitContext 顶层链路保留——N-AG4）
- VS Code：`src/prompts/explore.md`（D-AG2）、`src/agent-tools/subagent.mjs`（D-AG4 描述 + D-AG3 声明）、`src/agent-tools/subagent-async.mjs`（auditTaskBook D-AG3 声明；函数已在此——CLI 拼装在 execute 内，VS Code 在 auditTaskBook——按各自现有结构落）、测试（`test/subagent.test.mjs:408` "git context auto-injected" 断言**反转为零 git 断言** + `test/agent.test.mjs`）
- 文档：`AGENT-LOOP.md` 本节 + §18.2 :874-877 行加指注（已有——措辞改"子代理零 git"见 §18.5）+ §7.1 :98 角色矩阵行加指注（已有——措辞改）；两端 CHANGELOG（父代理统一）；docs/design/README.md 无需登记（并入既有板块）

**测试（T-AG——eng-coder 展开 N/E/A）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-AG1 | N | CLI spawn（role=explore，任一任务） | childInput 不含 `<untrusted_git_context>`（注入分支已删）；含 Audit scope 块（审计任务时） |
| T-AG2 | N | CLI spawn（role=plan） | childInput 不含 git context |
| T-AG3 | N | VS Code spawn（role=explore/plan） | childInput 不含 git context（现状维持 + 断言锁定） |
| T-AG4 | N | `explore.md`（两端） | 不含 "git log"/"git diff" 命令承诺；不含 "Git context is injected" 注入声明 |
| T-AG5 | N | 工具描述（两端 subagent.mjs description——§7.1 逐字对齐） | 不含 "Receives git context auto-injected"；描述与实现一致（零 git 语义） |
| T-AG6 | N | 审计任务书（两端） | 含"零 git"范围权威声明（_touchedFiles 为权威） |
| T-AG7 | E | 顶层 prepareRun（回归） | depth===0 仍注入 git context（setup.mjs:88 既有断言保持绿） |
| T-AG8 | N | advisor 工具集（回归） | run.mjs 恒定六工具不含 git（既有断言保持绿） |
| T-AG9 | E | CLI 注入删除后（死进口清理） | `subagent.mjs` 不再 import/引用 `collectGitContext`（**escapeXml 保留**——取消系统提醒路径仍在用——不删 import）；helpers.mjs 导出保留（顶层 setup.mjs/agent.mjs 引用） |

**验收**：AC-AG1 = 子代理输入/提示词/描述零 git（T-AG1/2/3/4/5）；AC-AG2 = 审计范围权威声明落地（T-AG6）；AC-AG3 = 顶层注入维持（T-AG7）；AC-AG4 = 两端全量绿 + advisor 零 git 回归 + collectGitContext 死进口清理（T-AG8/9 + 既有全量）。

> **实现前补充（评审 #10 处置）**：T-AG4 断言覆盖面除 explore.md 外，实现时还应 grep plan.md / engineering-sub.md / main.md 等全部 prompts，确认无其他 git 注入/命令承诺残留（有则一并清理并纳入断言样本）；无则记录"已确认"。

### 18.5.1 round1 评审处置（2026-09-04——0🟡通过——7🟡+3🔵——designToken 已签发——用户批准方案 A 全项处置）

| # | 处置 | 说明 |
|---|---|---|
| 1 | 已修 | 行号锚全改符号锚（subagent.mjs 注入块/readonlyToolNames 过滤点/gitTool 导出/VS Code description/runAgent childInput 传递点等）——保留 as-of 行号注（如 :327-328） |
| 2 | 已修 | N-TR4 放宽为"接口微侵入"：logCtx 增补 role/depth/kind 字段（非接口破坏）；D-TR4 明确每调用点补传——主循环/advisor/context 处 |
| 3 | 已修 | seq = 当日目录 max+1（跨会话/重启不覆写）+ T-TR10 跨会话用例 |
| 4 | 已修 | N-TR3 措辞改"调用出口写一次（续写/重试合并后）" |
| 5 | 已修 | D-TR5 错误路径轨迹（error + finishReason:null）+ T-TR11 用例 |
| 6 | 已修 | T-AG9 收紧为仅 collectGitContext（escapeXml 保留——取消系统提醒路径仍在用——:511-517 段） |
| 7 | 已修 | D-AG4/受影响文件扩为两端；两端 test/subagent.test.mjs 同名断言反转为零 git 断言（CLI/VS Code 各一——§7.1 "两端各一"） |
| 8 | 接受现状 | 归属维持 AGENT-LOOP §18.6（随 §18.5 批次、聚焦子代理/advisor）——D-TR7 补权威源注（LOGGING.md 为其上游互补） |
| 9 | 已修 | §18.2 指注措辞改"按 §18.5 D-AG1"（不再过去时） |
| 10 | 已修 | 补实现前 grep 全 prompts（plan.md/engineering-sub.md/main.md——T-AG4 样本覆盖） |


### 18.6 子代理与 advisor 完整轨迹存档（2026-09-04 · 用户裁定——**已批准**）

> 状态：**设计批准（2026-09-04 round1 0🟡通过——7🟡+3🔵处置见 18.6.1——designToken 已签发——用户已批准——实现中）**。触发：用户观察工程模式审计"经常想用 git 检查但没给工具 / wait / 思路反复"（§18.5 同源），要求"现阶段把 eng-coder 偏差审计和 advisor 的 reasoning 输入都存档写到某个目录里保存一下，后续我需要分析他们思考的纠结点"。澄清裁定：①内容 = **完整轨迹**（发往模型的输入消息 + 模型输出 + reasoning + 工具调用——"最全，体积大"——用户裁"成本不是问题，我只要能力"）；②范围 = **全部轨迹**（所有子代理 explore/plan/coder/eng-coder + 所有 advisor，含 code 与 design 评审——"全部轨迹……最全"）；③**CLI only**（VS Code 记 TODO 技术组——端差异见 D-TR7）；④与 §18.5 **同批评审、同一 eng-coder 实现**（D-TR9）。**round1 评审（2026-09-04）0🔴 通过——7🟡+3🔵——处置见 18.6.1——designToken 已签发**。

**问题（为什么需要——实证）**：现有观测设施只有**摘要**，无**全量轨迹**：

1. `logEvent` 事件落点（`src/log.mjs` 的 `llm:start/done/error`——stage/turn/auto/child 字段，**单行 ≤512 字符**）——够看"发生了什么"，看不到"模型怎么想的"。
2. 会话槽位文件（`saveSession` 导出 `src/session.mjs`——全量 history）——但 history 里 reasoning 只在 `reasoningEcho:"required"` 模型下回写且非逐 chunk 全量；`slimForDisplay` 导出（`src/session.mjs`）还会截断（tool_calls args→300、tool content→500）。
3. **全仓无"完整请求-响应轨迹（含 reasoning 全文）"落盘设施**（explore 定位确认）——分析"纠结点"（wait/思路反复/决策分叉）没有原始数据支撑；§18.5 的根因分析只能靠代码推断，无法用真实存档验证。

**F（功能性需求）**：

- F-TR1：作为用户，我希望每个模型调用（**全部**——主 agent/子代理/advisor/compress/distill/consult/auto-think）的**完整轨迹**自动落盘——含发往模型的输入消息、模型输出文本、reasoning 全文、工具调用（args）、usage，供后续逐轮分析思考过程。
- F-TR2：作为用户，我希望轨迹带**可分析元数据**——ts、会话身份（`agent._sessionStart`）、cwd hash、role、depth、round/turn、provider/model、kind（subagent/advisor/…）、stage——能把一条轨迹精确对回"哪个子代理哪一轮"。
- F-TR3：作为用户，我希望轨迹存档**不影响主流程**——落盘失败静默降级（与既有 offload/log 惯例同），模型调用路径零额外阻塞。
- F-TR4：作为用户，我希望存档**脱敏**——复用 `log.mjs:39-41` 的敏感黑名单（apikey/designtoken/password/secret/token/authorization/proxyuri/proxy）+ 密钥形态扫描（`sk-`/`Bearer `/`key=…`），敏感值落盘前遮蔽——持久化存用户盘，安全默认。

**NFR**：

- N-TR1：**容量有界**——单条轨迹一个文件（JSONL），大小不限（"成本不是问题"），目录按 `YYYY-MM-DD/` 分日组织，后续分析可按日/会话过滤。
- N-TR2：**采集点唯一**——在 `chat()` 导出（`src/provider/core.mjs`，注释："所有 chat 调用（主回合/消化轮/compress/distill/advisor/子代理/auto-think/consult）都经本函数"）加轨迹收集；**不得**在四个 transport（sse/anthropic/google/responses）分别埋点——续写/重试路径会 `result.reasoning +=`，出口收集才完整；advisor 复用同一 `chat()`（`runAdvisorToolLoop` 的 chat 调用点——`src/advisor/run.mjs`），天然覆盖。
- N-TR3：**reasoning 全量**——取 `chat()` 返回值 `response.reasoning`（出口汇总，含续写片段）；不增量实时（分析非实时用途；**调用出口写一次**——续写/重试合并后，与 offload 惯例同）。
- N-TR4：**接口微侵入**——`chat()` **签名不变**（轨迹收集在函数体内部，产出写 `~/.thincoder/traces/`）；唯一调用方变动 = `logCtx` **增补** `role`/`depth`/`kind` 字段（每调用点补传 1-2 字段——主循环/advisor/上下文构建等；非接口破坏，既有字段原样保留）。
- N-TR5：**既有测试零回归**——新增轨迹模块单测独立（mock `chat` 输入输出），不注入既有测试路径。

**D（设计决策）**：

- D-TR1（权威句）：**完整轨迹存档 = 在 `chat()` 导出（`src/provider/core.mjs`）出口统一收集**——每次调用落 `.jsonl` 一文件到 `~/.thincoder/traces/YYYY-MM-DD/`；**写盘机制（round2 评审 #4——F-TR3 零阻塞承诺兑现）**：fire-and-forget 异步 append（或小队列），**不 await 写盘**——chat() 返回不被轨迹写阻塞；落盘失败静默吞错（T-TR6）；防失控：写盘链计数上限（如每-天挂起写盘 >N → 丢弃并计数——不打爆进程）；记录字段：`ts`、`session`（`agent._sessionStart`）、`cwdHash`、`role`（logCtx 增补）、`depth`（logCtx 增补——**`null` = 非子代理栈（如 advisor 工具链），合法语义**）、`turn`、`provider/model`、`stage`、`kind`（logCtx 增补——subagent/advisor/…）、**`isContinuation`**（续写/重试链标记——true = 该调用是续写链的一环；用于分析"纠结"时区分续写/重试与全新调用）、`messages`（输入，脱敏后）、`content`（输出）、`reasoning`（全文）、`toolCalls`（args）、`usage`、`finishReason`、`error`（失败路径——见错误轨迹定义）。**（2026-09-04 fix round1 处置：删除 `round` 字段——全设计无 round 定义，turn/depth/kind 已足够——不发明无来源字段；新增 `isContinuation`）**
- D-TR2：**脱敏复用**——`src/log.mjs` 的黑名单字段（apikey/designtoken/password/secret/token/authorization/proxyuri/proxy 类）+ `SECRET_FORM` 形态扫描抽为共享函数（或就地引用），轨迹写盘前对 `messages`/`content`/`reasoning`/`toolCalls` 全字段应用——不发明新遮蔽模式。
- D-TR3：**目录/命名惯例**——`join(configDir, "traces")`（`configDir = ~/.thincoder`——`src/config.mjs`）+ 写前 `mkdirSync(..., { recursive: true })`（与 sessions/tool-results 同惯例）；文件名 `<sessionKey>-<seq>.jsonl`，`sessionKey = sha1(cwd)[:12]`（与 `sessionPath` 同算法——`src/session-slots.mjs`）、**`seq` = 当日目录内最大已有 seq + 1**（跨会话/进程重启不覆写——评审 #3）。**日期分日按本地时区（2026-09-04 fix round1 处置：初版 `toISOString()`=UTC 日期——本地 00:00-08:00 的调用会落进前一日目录，用户视角分日错位——改本地日期；测试 T-TR12）**
- D-TR4：**采集上下文**——`chat()` 调用方标识经 `logCtx`（既有 stage/turn/auto/child；advisor 传 `{ stage: "advisor" }`——`runAdvisorToolLoop` 的 chat 调用点）；**本设计增补 `role`/`depth`/`kind` 字段**（每调用点补传——主循环 `agent.mjs` 的 logCtx 构造处、advisor `run.mjs`、上下文构建 `context.mjs` 等——轨迹收集只读 `logCtx`，无新参数、签名不变）。
- D-TR5：**错误路径轨迹**——`chat()` 抛错（provider 失败/重试耗尽）也**落盘**：记录 `error`（errText 截断 + 类别）与 `finishReason: null`——失败轨迹恰是分析"纠结点"最有效的材料（审计/评审失败侧）。
- D-TR6：**默认全采集**——`traces.enabled` 开关（`config.mjs` 加载）默认 **on**（"现阶段"=随会话生效）；关 = 不落盘。**（2026-09-04 fix round1 处置：开关透传覆盖**全部** chat 调用点——含 goal.mjs/distill.mjs/cmd-mcp.mjs 三处（初版清单遗漏——关=不落盘语义未闭环——测试 T-TR13）**——**（2026-09-05 修订注——用户"准备发 npm——不希望用户那边也采集跟踪数据"：默认翻转为 OFF（发布隐私）——DEFAULTS.traces.enabled:false——新用户零采集；本机调试分析可显式开（~/.thincoder/config.json traces.enabled:true——用户机已设）；/config 菜单可设（cmd-config.mjs——traces.enabled 项）**
- D-TR7：**范围声明**——本设计仅 CLI；VS Code 端 `chat()`（`thincoder-vscode/src/provider.mjs` 导出——as-of 行 130）同构但**不实现**（runAgent 签名不同、无统一 `llm:*` 日志包装点；两端无共享代码，只有同一语义约定——**评审 #8：归属接受现状——本节为轨迹机制权威源，LOGGING.md 事件骨架为其上游互补——不新建观测板块文档**）——记 `docs/TODO.md` 技术组；不承诺未实现能力。
- D-TR8：**生命周期**——不自动清理（分析周期未知）；清理机制（按天/会话 GC 配置）记 `docs/TODO.md` 技术组。**（2026-09-05 修订注：清理闭环落 D-TR10——启动清理已实现——TODO 项作废）**
- D-TR10：**启动清理（2026-09-05 用户裁定——发布隐私 + 磁盘卫生）**——`cleanupTraces`（trace-store.mjs 导出）：CLI 启动时（bin/thincoder.mjs switch 前——fire-and-forget 不阻塞）删除 traces 根下 **mtime 超过 `traces.retentionHours`（默认 24h）** 的 .jsonl 轨迹文件 + 空日期目录；非 jsonl 不碰；失败静默（与写盘同纪律）。配置：`traces.enabled`（默认 off——D-TR6 修订）与 `traces.retentionHours` 均可经 `/config` 菜单（cmd-config.mjs）与 config.json 设置。测试 T-TR15。
- D-TR9：**与 §18.5 关系**——同批评审、同一 eng-coder 任务（两 SECTION 文件清单合并：§18.5 删注入/改提示词/测试 + §18.6 新轨迹模块/测试）；一条交付链（设计→评审→批准→eng-coder 一次实现）。

**受影响文件（CLI only——两端不同批）**：

- 新增：`src/traces/trace-store.mjs`（收集+写盘+脱敏+命名+目录惯例）、`test/traces.test.mjs`（mock chat 输入输出全用例）
- 修改：`src/provider/core.mjs`（`chat()` 出口加轨迹收集调用——接口签名不变）、`src/log.mjs`（黑名单/遮蔽函数提取为共享导出——或就地引用）、`src/config.mjs`（`traces.enabled` 开关字段——默认 on）、**调用点 logCtx 增补**（`src/agent.mjs` 主循环 logCtx 构造处、`src/advisor/run.mjs`、`src/context.mjs`——每处 +1~2 字段，见 D-TR4；**fix round1：追加 `src/agent-tools/goal.mjs`/`src/distill.mjs`/`src/tui/cmd-mcp.mjs` 三处开关透传**）
- 文档：`AGENT-LOOP.md` 本节；`docs/TODO.md` 技术组（VS Code 同构不实现 + 清理机制）
- **不动**：四个 transport（sse/anthropic/google/responses）——reasoning 在出口汇总；`subagent*.mjs` 调用方零改动

**测试（T-TR——eng-coder 展开 N/E/A）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-TR1 | N | `chat()` 正常返回（mock provider，含 reasoning + toolCalls） | `~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl` 落盘，含 messages/content/reasoning/toolCalls/usage |
| T-TR2 | N | advisor 调用（`logCtx.stage=advisor`） | 轨迹文件 `stage:"advisor"` 元数据正确 |
| T-TR3 | N | 子代理调用（depth>0） | `depth` + `role` 元数据正确——审计 explore 可对回 |
| T-TR4 | E | `messages` 含 `apiKey`/`designtoken`/`password` 字段 | 落盘值遮蔽（复用 log.mjs 黑名单） |
| T-TR5 | E | `reasoning` 含 `Bearer sk-xxx` 形态 | 落盘值遮蔽（SECRET_FORM 扫描） |
| T-TR6 | E | 落盘失败（目录不可写/IO 错误） | 静默降级，不抛错、不阻塞 chat() 返回 |
| T-TR7 | A | `traces.enabled: false` | 不落盘（默认 true——开关可控） |
| T-TR8 | N | 同会话两调用 | 两次写不同 seq 号（递增不覆盖） |
| T-TR9 | E | 超大内容（长 reasoning/大 messages） | 不截断——单文件可大（用户接受） |
| T-TR10 | E | 跨会话/进程重启（同 cwd、同日） | 新轨迹 seq = 当日目录 max+1——**不覆写**既有旧轨迹 |
| T-TR11 | E | `chat()` 抛错（provider 失败/重试耗尽） | 落盘错误轨迹（`error` + `finishReason:null`）——不阻塞主流程 |
| T-TR12 | E | 本地时间 00:00-08:00 调用（UTC 尚在前一日） | 落盘目录按**本地日期**（当日目录，非 UTC 前一日——fix round1） |
| T-TR13 | N | `traces.enabled:false` + goal/distill/cmd-mcp 调用 | 不落盘（开关透传覆盖全部调用点——fix round1） |
| T-TR14 | E | 续写/重试链 | `isContinuation:true` 标记（新调用 false——fix round1） |

**验收**：AC-TR1 = 完整轨迹落盘（T-TR1/8/9/10/11）；AC-TR2 = 元数据可对回（T-TR2/3）；AC-TR3 = 脱敏（T-TR4/5）；AC-TR4 = 零影响主流程（T-TR6/7/11）；AC-TR5 = 全部模型调用路径经唯一入口收集（`chat()` 注释覆盖全链路——含 compress/distill/consult/auto-think——测试抽查）。

### 18.6.1 round1 评审处置（2026-09-04——0🟡通过——7🟡+3🔵——designToken 已签发——用户批准方案 A 全项处置）

| # | 处置 | 说明 |
|---|---|---|
| 1 | 已修 | 行号锚全改符号锚（logEvent 落点/saveSession/slimForDisplay/chat 导出/续写重试路径/runAdvisorToolLoop 等）——保留 as-of 注 |
| 2 | 已修 | 元数据来源实锤：logCtx 只有 {stage,turn,auto,child}——role/depth 在 chat() 层不可得 → N-TR4 改"接口微侵入" + D-TR4 调用点补传 |
| 3 | 已修 | seq = 当日目录 max+1 + T-TR10 |
| 4 | 已修 | N-TR3 措辞统一（调用出口写一次） |
| 5 | 已修 | 错误路径轨迹定义（D-TR5）+ T-TR11 |
| 6 | 已修 | T-AG9 收紧（escapeXml 保留——取消系统提醒路径在用） |
| 7 | 已修 | D-AG4 扩两端 + 两端断言反转 |
| 8 | 接受现状 | 归属权威源注（D-TR7——LOGGING.md 为其上游互补，不新建观测板块文档） |
| 9 | 已修 | §18.2 措辞（按 §18.5 D-AG1） |
| 10 | 已修 | 实现前 grep 全 prompts 补充（§18.5 实现前补充段） |

### 18.6.2 fix round1 处置（2026-09-04——父侧裁决——同 designId+token）

**背景**：首轮 eng-coder 交付终态 stalled——advisor 4🔴（500 行约定——既有债务，父侧裁决**挂债不修**）+ 实现本身全部权威句达标（1318/1318）。父侧核销后逐项裁决：

| # | 裁决 | 落点 |
|---|---|---|
| 1 | 接受现状 + 挂债 | 4 文件 >500 行（subagent.mjs 619/agent.mjs 530/context.mjs 524/core.mjs 555——HEAD 即超限 612/514/510/544，全仓 8 个超限先例）——记 `docs/TODO.md` 技术组（模块拆分轮——与 VS Code 侧同款处置共识） |
| 2 | **修** | 开关透传覆盖全部调用点：goal.mjs/distill.mjs/cmd-mcp.mjs（初版清单遗漏——关=不落盘语义未闭环）——D-TR6/受影响清单修订（上文） |
| 3 | **修** | 删 `round` 字段（无来源）——D-TR1 |
| 4 | 接受 + 注明 | advisor depth=null = 合法语义（非子代理栈，kind=advisor 已区分）——D-TR1 |
| 5 | **修** | 加 `isContinuation` 字段（续写/重试链区分）——D-TR1 + T-TR14 |
| 6 | **修** | 本地日期分日（初版 UTC——本地 00:00-08:00 落前一日目录）——D-TR3 + T-TR12 |
| 7 | 接受 | sync 段（readdir+redact 快照）正确性选择——记录存档 |

> **fix round 任务书**（同 designId+token——合规 token 复用）：目标 = 第 2/3/5/6 项（三处开关透传 + 删 round + 加 isContinuation + 本地日期）；第 1/4/7 项为接受，不改代码。

---


### 18.7 测试分层收口：全量测试父侧收口（2026-09-04 · 用户裁定——需求登记——设计层已落——round1 评审 0🟡通过——处置见 18.7.1）

> 状态：**已实现（2026-09-04——设计批准：round1 0🟡通过——round2 复审 0🟡通过——7🟡+3🔵+4🟡+3🔵 处置见 18.7.1——designToken d57b0fa0——用户批准 2026-09-04——CLI + VS Code 双端实现——L2 核销 1330/1330 通过——实现记录见 ENGINEERING-MODE.md §7 2026-09-04 R2 条；fix round1（L0 语义缺口处置）亦已核销）**。触发：用户实测工程模式测试耗时

**需求层（用户裁定 D·父侧收口）**：

- **总体需求**：工程模式交付链（eng-coder 实现 + 修正轮 + 父侧核销）中，全量测试（`test:full`/`run-full.mjs`，含 slow 真机层）**只跑 1 次且收口在父侧**——eng-coder 全程只跑快层（`npm test`，~15s）；慢点可控、次数确定。

- **功能性需求**：
  - F-TS1：作为用户，我希望 eng-coder 交付链测试**分三级粒度**——首次实现后 = **L1 快层** `npm test`（1272 个/15s）；每个修正轮（④⑥）= **L0 = 调用 `verify`（默认模式：语法检查 + 模块相关测试，秒级）**——非手写 node --test；`verify` 对 null 映射模块（mcp/prompts/context/session）的 ACTION REQUIRED 语义**不采用**（不写新测试）→ 显式升 L1；全量不跑（父侧 L2 唯一 1 次）。
  - F-TS2：作为用户，我希望**父侧核销**跑全量 `test:full` **恰好 1 次**（每交付链终态）——全量验证收口父侧（可控时机，与交付核销同点）。
  - F-TS3：作为用户，我希望该纪律落到协议文字——`engineering-sub.md` ①"run the tests"明确定义快层/全量时机；`engineering.md` 父侧核销"run the tests it claims pass"明确 = 全量 1 次；任务书模板措辞同步（两端 byte-identical 惯例）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条为 R2 批时点记录**。
  - F-TS4：作为用户，我希望**慢层（slow 真机）不在工程模式交付链默认出现**——全量只包含 slow 的语义保持（`test:full` 才放行），快层天然 skip。
  - F-TS5（2026-09-04 二次裁定——LLM 验证收紧）：作为用户，我希望**修正轮（④⑥）默认不重跑 explore 审计 + advisor 复评**——修正后只跑 **L0**（测试粒度按 F-TS1——原句"只跑快层 npm test"指"不重跑 LLM 验证"，supersede 2026-09-04 round1 评审 #1）；全部修正收敛后做**终审 = advisor 复评**（无第 2 次审计——审计仅例外路径）——LLM 验证次数 = **3 次/链**（①审计 1 + ②advisor 首审 1 + ③advisor 终审 1；审计第 2 次仅例外回③，不计入常态），不随修正轮数线性增长（当前 4+ 次）。
  - F-TS6（2026-09-04 用户"我觉得可以"——审计 explore 效率优化——**并入 R2**）：作为用户，我希望**审计 explore 单次耗时优化**——A1：任务书开头注入**审计指令模板**（四类偏差定义 + 校验清单格式 + 范围限制"只审 _touchedFiles/父任务书确认文件——不重读全文档"）；A2：父任务书逐字全量 → **机械摘要块**（设计文档路径 + 验收标准列表——审计者按需 read 设计文档）；A3：**审计输出报告模板**注入（正常/偏差/问题格式——不让模型自由发挥）——三者改提示词/任务书层，不新建角色、不改审计语义（四类偏差/独立视角保持）。
  - F-TS7（2026-09-04 用户"可以"——advisor code review 执行层优化——**并入 R2**）：作为用户，我希望 **advisor 工具执行批并行**——`runAdvisorToolLoop`（src/advisor/run.mjs 工具执行段）同一 LLM 回复内的多个只读工具调用**并行执行**（Promise.all——与主链路 dispatch 只读并行语义一致；每个工具错误独立捕获；结果按 tool_call_id 回填保持与 toolCalls 顺序一致——防错配）；**两端同批**（VS Code advisor/run.mjs 镜像——执行循环同段）。
  - F-TS8（2026-09-04 用户"可以"——advisor 提示词范围收缩——**并入 R2**）：作为用户，我希望 **advisor-round1.md 评审范围收缩**——:7 "Read the specified files in full" 改为聚焦评审范围（优先读评审对象文件；设计文档只读与本实现相关的节——不全量读全文档）；:13 保持批量提示并注明"批量 read 的多个文件**并行执行**（并发——不要串行等）"；:4 预算（20 轮）**保持**（B3——实测后再议——不先调）。

- **范围边界**：不改变分层机制本身（快层/全量/slow.mjs 门控已存在——F-TS4 指协议默认值而非机制重建）；不改测试用例内容；日常（非工程模式）开发流程不在本需求范围；父侧"全量 1 次" = 每交付链终态（一个 eng-coder 主交付 + 其 fix round 视为同一链）。**F-TS5 不改审计/advisor 内容深度**——只改调用时机（修正轮不默认重跑；终态终审一次）——保真条款（审计四类偏差）与隔离视角（quality gate）依然存在。
- **重复层显式纳入（2026-09-04 用户"这个应该也要处理掉吧"）**——三形态与 R2 裁定映射：①父侧复跑已验过的全量 = D 收口（eng-coder 不再跑全量，父侧全量唯一 1 次）；②修正轮全套重验（全量+审计+复评）= D+A 收口（修正轮只快层 + 不重跑 LLM，终态一次终审）；③跨 spawn/端隔离 = 维持（CLI/VS Code 各归壹链，各跑各自测试——非重复，不消）。**判定：重复层三形态零遗漏，全部已由 F-TS1/2/5 + N-TS1/5 承载，无需新增条目。**

- **非功能性需求**：
  - N-TS1：交付链全量次数 = **0（eng-coder）** + **1（父侧）**——可计数验证（测试必须通过后再交付/核销——正确性不降）。
  - N-TS6：**三级粒度定义**（2026-09-04 用户裁"1"——L0 相关测试——round1 评审 #3 修订）：L0 = **调用 `verify`（默认模式：语法检查 + 相关测试，秒级）**——非手写 node --test；`verify` 对 null 映射模块（mcp/prompts/context/session）的 ACTION REQUIRED 语义不采用（不写新测试）→ 升 L1；L1 = `npm test` 快层（~15s）；L2 = `test:full` 全量（~40s 含 46 slow）——仅在父侧核销跑 1 次。
  - N-TS2：工程模式交付总耗时（测试部分）从 ~5×40s 降至 ~n×15s + 1×40s（n=修正轮数）。
  - N-TS3：两端提示词（engineering-sub.md/engineering.md）变更**同批 + 内容断言同步**（prompts 变更三件套惯例）；协议归属文档 = 本节（AGENT-LOOP.md §18 板块）+ ENGINEERING-MODE.md §2.2 主流程引用段。
  - N-TS4：承诺-实现一致——任务书措辞与协议文字必须一致（"run the tests" = 快层显式定义），不留"运行全量"旧措辞。
  - N-TS5：**LLM 验证次数有界**——3 次/链（首审计 1 + 首 advisor 1 + 终审 1），不随修正轮数增长——可计数验证（修正轮只补快层与相关测试）。

**设计层（2026-09-04 · 用户"开始这批"——设计——待评审——用户发起）**：

### 方案选型

五块并行落地（①②③协议层 / ④审计任务书层 / ⑤B1 执行层 + B2 提示词层）：

- **①②③ 同源**：协议文字修改（`engineering-sub.md` 内部协议 + `engineering.md` 父侧核销）——单处权威文字，两端 byte-identical + 内容断言（三件套惯例）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条为 R2 批时点记录**。
- **④ 同源**：审计任务书机械拼接点（CLI `subagent.mjs` 审计块 / VS Code `subagent-async.mjs` `auditTaskBook`）——模板注入（A1 指令 + A2 摘要 + A3 报告格式）——机械层完成，不依赖模型自悟。
- **⑤B1 执行层**：`run.mjs` 工具执行段改批并行（Promise.all——与主链路 dispatch 只读并行同语义）——同段两端镜像。
- **⑤B2 提示词层**：`advisor-round1.md` :7/:13 修订（范围收缩 + 并行语义明示）——两端 byte-identical——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条为 R2 批时点记录**。

### D（设计决策）

- **D-TS1（协议——验证粒度）**：`engineering-sub.md` ① 明确定义——**首次实现后 = L1 快层 `npm test`**；**每修正轮（④⑥）= L0 = 调用 `verify` 默认模式**（语法检查 + 模块相关测试——eng-coder 工具集已验证含有 verify 工具——**不手写 node --test**；`verify` 的 null 映射 ACTION REQUIRED 语义**不采用**——映射 null 或触主干文件 → 显式升 L1）；**父侧核销 = L2 全量 `test:full` 1 次**（每链终态——见 `engineering.md`）。**fix round1 修订（2026-09-04——L0 语义缺口处置）**：验证机制实锤 verify 依赖 git-diff 定位改动文件——修正轮未提交工作区会列出**前几轮全部未提交改动**（超集——安全方向，非误报；相关测试超集不伤害验收）——接受该特性为**已知语义**；**定向路径**：当修正仅涉及**测试映射明确**的模块时，可按 `_touchedFiles` 定向 `node --test <file>`（这是 verify 粒度不足时的显式升级——不打"不手写"禁句——"不手写"指不得**跳过** verify 或自写全套；定向 = 与 verify 定位结果一致的收缩）。
- **D-TS2（协议——LLM 标准链序列——round1 评审 #2 定死）**：**标准链 = ③ 审计=LLM#1**（clean 后进⑤）→ **④ dirty→修(L0,无 LLM)** → **⑤ advisor 首审=LLM#2** → **⑥ findings→修(L0,无 LLM)** → **终审=advisor 复评=LLM#3**（验证 fix——**不复跑审计**）→ ⑦ 交付。**审计第 2 次仅例外**（修正触碰上次审计/评审未覆盖文件 → 回③——协议既有第⑥条文字保留；例外不计入常态 3 次）。修正轮（④⑥）默认不重跑 explore 审计与 advisor 复评（修完后只 L0）；LLM 验证 = 3 次/链。
- **D-TS3（协议——父侧核销）**：`engineering.md` 父侧核销段——"run the tests it claims pass"明确改为"**信任 eng-coder 内部 L1/L0 结果（§18 内部协议已保真），父侧核销 = L2 全量 1 次（每链终态）——不再复跑 L1**"。
- **D-TS4（A1 审计指令模板）**：审计任务书机械拼接处注入——审计语义（四类偏差：部分实现/静默简化/文档漂移/超清单）+ 范围限制（"只审 _touchedFiles 与父任务书确认的文件；工作区未列改动与本任务无关——不作超清单依据"——与 §18.5 D-AG3 声明同源不重复）+ 校验清单格式（每偏差项 = 文件:行 + 设计引用 + 严重级 + 证据）。**→ §18.13（预算句——机械段追加于本模板 + A2 之后、A3 之前——2026-09-04 已实现——见 §18.13）**。
- **D-TS5（A2 任务书摘要）**：审计任务书中的"Parent spawn task book"从全量 verbatim 改为**机械摘要块**——保留三要素：设计文档路径列表 + 受影响文件清单（逐字——审计范围依据）+ 验收标准（逐字——审计对照依据）；排除冗长上下文/背景（审计者 read 文档本身即可——文档仍在上下文外可用）。独立性不变（不取自 eng-coder 自述——仍由 `_engTaskInput` + `_touchedFiles` 机械生成）。
- **D-TS6（A3 报告模板）**：审计任务书末尾注入审计报告格式模板（正常/偏差/问题三态——每行字段化：`| 类别 | 文件:行 | 设计引用 | 严重级 | 证据 |`——无偏差时"四类偏差均未发现"）。
- **D-TS7（B1 批并行——执行层）**：`run.mjs` 工具执行循环改——同一 LLM 回复的多个只读工具调用 `Promise.all` 并行执行；**结果按 `toolCalls` 顺序回填**（Promise.all 保序——tool_call_id 不错配）；每工具超时/错误独立捕获（既有 TOOL_TIMEOUT 保留——不影响其他工具）；只读工具集无副作用——无需排序/串行化；`onTool` 进度行保持逐工具发射（显示顺序无关紧要——仍按 toolCalls 顺序发射进度行）。VS Code `advisor/run.mjs` 同段镜像。**隔离声明（round1 评审 #10）**：B1 仅为**循环内工具并行**——不解决 TODO『平台执行问题·advisor 并行调用实为串行』（docs/TODO.md:186——多 advisor 调用观测之谜——LOGGING 取证项，本设计不涉及）。
- **D-TS8（B2 范围收缩——提示词）**：`advisor-round1.md` :7 "Read the specified files in full" 改为"**按评审范围聚焦**——优先读评审对象文件（交付清单）；设计文档只读与本实现相关的节（不全量读全文档）；**不要为了理解去读无关模块**"；:13 保持批量提示并补"**批量 read 的多个文件并行执行（并发——不要串行等）**"；:4 预算（20 轮）**保持**（B3——实测后再议）。
- **D-TS9（B3 预算不动）**：20 轮保持——B1/B2 生效后看实测轮数再议（记录为 TODO 观察点）。
- **D-TS11（父侧 L2 失败处置——round1 评审 #8）**：父侧核销 `test:full` 有 fail → 该链终态 **non-clean**——按工程模式 stalled 语义处置：**报告用户（未达验收——不静默放行）**；可转 fix round（同 designId+token——记录未收敛点）或用户决定。
- **D-TS12（auto-think 并入——round1 评审 #4 对齐 TODO.md:37 用户裁定）**：`src/auto-think.mjs` 的 chat 调用点 logCtx **全字段补传**（traces/session/cwd/role/depth/kind——当前仅 {stage,turn,child}）——D-TR6"关=不落盘"开关闭环（该点残留导致 traces.enabled:false 时仍落盘）。
- **D-TS10（两端同批）**：所有提示词字节级镜像（engineering-sub.md / engineering.md / advisor-round1.md——两端同一文本）；B1 代码两端同段同语义；测试断言两端各一。——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条为 R2 批时点记录**

### 受影响文件（两端）

**CLI**：`src/prompts/engineering-sub.md`（D-TS1/2）、`src/prompts/engineering.md`（D-TS3）、`src/prompts/advisor-round1.md`（D-TS8）、`src/agent-tools/subagent.mjs`（D-TS4/5/6——审计块模板注入）、`src/advisor/run.mjs`（D-TS7）、`src/auto-think.mjs`（D-TS12——logCtx 全字段）、`test/prompts.test.mjs`（提示词断言：L1/L0/L2 定义/修正轮不重跑/父侧全量一次/round1 范围收缩+并行句——T-TS1/2/3/7——§18.14 拆分后落点——原 agent.test.mjs）、`test/subagent-scheduler.test.mjs`（审计块模板断言——T-TS4/5/6）、`test/advisor-parallel.test.mjs`（B1 批并行——T-TS8/9）。
**VS Code**：`src/prompts/engineering-sub.md`、`src/prompts/engineering.md`、`src/prompts/advisor-round1.md`（字节镜像）、`src/agent-tools/subagent-async.mjs`（auditTaskBook——D-TS4/5/6）、`src/advisor/run.mjs`（D-TS7）、对应测试。
**文档**：`AGENT-LOOP.md` 本节（本设计层）+ §18.2 协议指注（D-TS1/2/3——措辞修订；**round2 评审 #3 扩列：§18.2 D-E2 ④⑥ supersede 注解、§18.4 N1 成本数注解、§18 T-E6/T-E7 测试语义对齐**）+ ENGINEERING-MODE.md **§7 变更记录**（R2 记录——§2.2 主流程 step6/AC9 口径同步——round1 评审 #6 对齐 R1 先例）；`docs/TODO.md`（需求池 R2 行——实现后勾销；B3 观察点）；**两端 CHANGELOG（父代理统一更新）**。
**不做**：`verify.mjs` 不改（L0 使用 verify 默认模式——直接调用；（T-TS11 只验证协议句——不实现映射逻辑）；测试用例内容不改；分层机制（slow.mjs 门控）不改。

### 测试（T-TS——eng-coder 展开 N/E/A）

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-TS1 | N | `engineering-sub.md` 读 | 含 L1/L0/L2 定义句（首次=快层/修正轮=相关测试/全量=父侧）——内容断言 |
| T-TS2 | N | 同上 | 含"修正轮默认不重跑审计/复评（例外：触碰未覆盖文件回③）"句 |
| T-TS3 | N | `engineering.md` 父侧核销段 | 含"父侧核销 = L2 全量 1 次——不复跑 L1"句 |
| T-TS4 | N | 审计 spawn（engAuditAttempt 非空） | childInput 含 A1 指令模板（四类偏差+范围限制+清单格式） |
| T-TS5 | N | 同上 | childInput 含 A2 摘要块（文档路径+文件清单+验收标准逐字——不含冗长上下文） |
| T-TS6 | N | 同上 | childInput 含 A3 报告模板（三段格式+"四类偏差均未发现"） |
| T-TS7 | N | `advisor-round1.md`（两端） | :7 范围收缩句（聚焦评审对象——不读全文档）+ :13 并行句 |
| T-TS8 | E | B1——mock 两慢工具同批（延迟 100ms/100ms） | **并行确定性断言**（round1 评审 #9）：两工具都在任一完成前启动（记录 start 顺序——不再断言墙钟 100-120ms——CI 抖动免疫）；`Promise.all` 核验 |
| T-TS9 | E | B1——一工具抛错（超时/ENOENT）另一成功 | 错误独立捕获——两结果均回填、顺序按 toolCalls 保序——无未处理拒绝 |
| T-TS10 | E | 修正轮触碰未覆盖文件 | 回③重审计（例外路径生效——协议句验证） |
| T-TS11 | N | L0 兜底——改动文件映射 null | 升 L1 快层（verify 映射思路——协议句验证） |
| T-TS12 | A | `traces.enabled:false` + auto-think 调用点 | 不落盘（D-TS12 开关闭环——修前仍落盘，修后不落） |
| T-TS13 | A | 父侧核销 `test:full` 出现 fail | 终态 non-clean——按 D-TS11 处置（报告用户/转 fix round——不静默放行） |

### 验收（AC-R2）

- AC-R2-1 = 协议三块落文 + 断言绿（T-TS1/2/3/10/11）；
- AC-R2-2 = 审计任务书模板三件（A1/A2/A3）落地（T-TS4/5/6）；
- AC-R2-3 = B1 批并行 + 错误隔离 + 保序（T-TS8/9）；
- AC-R2-4 = B2 范围收缩两句落文（T-TS7）；
- AC-R2-5 = 两端同批（提示词字节一致——既有断言）+ 全量测试绿（两端各自）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条为 R2 批时点记录**；
- AC-R2-6 = auto-think 开关闭环（T-TS12）+ 父侧 L2 失败处置（T-TS13）。

> **边界注（round1 评审 #4——已并入本设计，对齐 TODO.md:37 用户裁定）**：auto-think 残留（§18.6 fix round 2 残留项）**包含于本设计**——D-TS12 落 `src/auto-think.mjs` logCtx 全字段（D-TR6 开关闭环）——见受影响文件/T-TS12。

### 18.7.1 round1 评审处置（2026-09-04——0🟡通过——7🟡+3🔵——用户批准方案 A 全项——designToken 已签发）

| # | 处置 | 说明 |
|---|---|---|
| 1 | 已修 | F-TS1/F-TS5 矛盾调和——F-TS5 supersede 注（"只跑快层" = 不重跑 LLM；修正轮粒度 = 按 F-TS1 = L0） |
| 2 | 已修 | 标准链序列定死（D-TS2：③审计=LLM#1 → ④L0 修 → ⑤advisor 首审=LLM#2 → ⑥L0 修 → 终审=advisor 复评=LLM#3；审计第 2 次仅例外）——F-TS5 括号对齐 |
| 3 | 已修 | L0 机制统一 = 调用 verify 默认模式（非手写 node --test）；null 映射 → 显式升 L1（不采用 verify 的 ACTION REQUIRED 语义）——D-TS1/N-TS6/F-TS1 同步 |
| 4 | 已修 | auto-think 并入 R2（D-TS12 + 受影响文件 + T-TS12）——对齐 TODO.md:37 用户裁定 |
| 5 | 已修 | §18.7 位置移动——从 §19.2 D-M1 表头后移到 §18.6.2 后（§19 前）——消除表格割裂（**round2 复审 #3：原"见 §18.7.2"为悬空引用——实际无该节——此处指 §18.7 位置说明——已在 §18.7 自带状态行记录——指针修正**） |
| 6 | 已修 | 受影响文件补两端 CHANGELOG；ENGINEERING-MODE.md 指针改 §7 变更记录 |
| 7 | 已修 | 标题同步（设计层已落——round1 评审通过——见 18.7.1） |
| 8 | 已修 | 补 A 类测试（T-TS12/13）+ D-TS11（父侧 L2 失败处置） |
| 9 | 已修 | T-TS8 改并行确定性断言（start 顺序——弃墙钟） |
| 10 | 已修 | D-TS7 隔离声明（B1 ≠ 多 advisor 调用之谜——LOGGING 取证项） |

> **实现中偏差（2026-09-04——advisor 轨迹分析 #15 发现——已处置，见 D-TS1 fix round1 修订 + docs/TODO.md「R2 · L0 语义缺口」——待 fix 实现）**：D-TS1 的 L0（修正轮 = 调 verify 默认）依赖 `verify` 的 git-diff 定位改动文件——修正轮未提交场景下会列出前几轮全部未提交文件（超集——安全方向），"只跑本轮改动模块"语义被稀释；**处置方案（2026-09-04 用户"1"启动 fix 环）**：接受超集语义（相关测试超集不伤验收）+ 映射明确时按 `_touchedFiles` 定向（D-TS1 修订）；eng-coder 保留 git 工具确认（§18.5 零 git 仅影响注入/提示词/explore 工具面——eng-coder 非只读角色保留）。

**实现完成（2026-09-04——CLI + VS Code 双端——L2 核销 1330/1330 + 1031/1031——见 ENGINEERING-MODE.md §7 R2 条）。**

### 18.8 advisor 评审对象锚（2026-09-04 · 用户批准——需求登记——**设计层已落——待评审（与 §18.10 同批）**）

> 状态：**设计（2026-09-04 用户"可以"——澄清完成——需求层 + 设计层已落——round1 评审 2026-09-04 1🔴+4🟡+2🔵 处置完成（§18.10.1）——round2 复审 2026-09-04 1🔴+5🟡+2🔵 处置完成（§18.10.2）——round3 复审 2026-09-04 0🔴 批准（§18.10.3——token b7db45cd…/designId de2a4980——用户批准——实现中））**。触发：轨迹数据分析（2026-09-04 272 条——advisor 评审纠结主题统计）——顶层 advisor **目标范围主题命中 73%**（"评谁/为什么评"——评审对象锚定缺失）；实证案例 #12：评审员读文档后 3 连 wait——"是不是评 §18.7? 还是 §18.5/18.6?"——目标是让评审员**无需考古**。

**需求层**：

- **总体需求**：advisor 设计评审/代码评审调用时，注入**机械生成的\"评审对象声明\"**——消除评审员在上下文里推断\"本次评审对象是谁、为什么评它\"的纠结（目标范围 73% 主题）。

- **功能性需求**：
  - F-OA1：作为用户，我希望每次 advisor 评审收到**对象声明块**——评审类型（design/code）、评审对象（文档 + 节/文件）、对象状态（待评审/已批准/已实现）、为何评它（用户发起/交付核销）、评审范围（documents 既有——不变）、**明确排除清单**（已批准/已实现项——不评）。
  - F-OA2：作为用户，我希望对象声明**每轮都注入**（round 1 fresh + round 2+ 复评都锚定——防复评又考古）。
  - F-OA3：作为用户，我希望对象声明**机械生成**（父侧调用时传参——非模型自悟）。

- **范围边界**：不改评审语义（7 维度/🔴🟡/引文验证不变）；不动 documents 参数；不动 advisor-round1.md 核心检查项；不改评审轮次/预算。

- **非功能性需求**：
  - N-OA1：对象声明 = 调用参数传入（`advisor(type, documents, object)`——新增参数——精确零解析）；`object` 参数包含：`{type, target, status, reason, exclude}`。
  - N-OA2：两端同批（CLI/VS Code 评审机制镜像）；断言同步（message 含对象声明句）。
  - N-OA3：既有评审行为零回归（无 object 参数时——降级现状——不阻塞旧调用）。

**设计层**：

- **D-OA1（注入点）**：`advisor.mjs` 的 `advisorTool` 处理——新增 `object` 参数（可选）——收到后传入 `prepareAdvisorMessages`/`buildAdvisorUserMessage`——在评审 user 消息机械注入对象声明块——**定序：对象声明块 → 评审内容（含 §12 Document Map 段——相对序满足：声明先于评审内容；Document Map 为内容段内部——2026-09-04 对齐实际实现措辞）**（T-OA5 断言"声明后接评审内容"——不破坏；全轮次 round1/2/3/design 都走该构造——T-OA2）。
- **D-OA2（对象声明块格式——逐字定稿——英文——与交付实现一致（2026-09-04 修正：round3 裁决①英文定稿——设计层锚同步英文化））**：
  > `## Review-object declaration (mechanical — do not infer)`
  > `Review type: {type} | Target: {target} | Object state: {status} | Trigger: {reason}`
  > `Excluded (not in this review): {exclude}`
  > `Follow this declaration — do not infer the review target from the documents.`
- **D-OA3（对象来源）**：父侧调用时构造——`advisor(type="design", documents=[...], object={type,target,status,reason,exclude})`（对象形态——与 N-OA1 一致；工具参数为 JSON——传 JSON 对象）——`agent-tools/advisor.mjs` 解析传入;旧调用(无 object)降级现状(不注入);
- **D-OA4（数据实测纳入）**：本设计优先治\"目标范围 73%\"——与裁决模板(严重级 21%)分开——先做本项(锚定)——裁决模板观察后再定。

**受影响文件（两端）**：`src/agent-tools/advisor.mjs`（object 参数 + 注入）、`src/advisor/messages.mjs`/`messages.mjs`（声明块构造——机械注入 user 消息——**全轮次覆盖：round1/2/3/design 都走该构造**）、`src/advisor/run.mjs`（透传——如有必要）、两端 `test/advisor.test.mjs`（新断言：评审消息含对象声明句；无 object 降级不崩）、**4 模板**（`advisor-design.md` + `advisor-round1/2/3.md`——**定稿：一致性句"你已收到对象声明块"全 4 模板加**——与 §18.10 铁律**合并为一次 prompt 编辑批次**（铁律段 + 对象声明句一次落，防字节漂移）——两端 byte-identical 更新）。

**测试（T-OA——eng-coder 展开 N/E/A）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-OA1 | N | advisor(type=design, documents, object={target:§18.7,status:待评审}) | 评审 user 消息含对象声明块（评审对象/状态/排除） |
| T-OA2 | N | round 2+ 复评 | 对象声明仍注入（每轮锚定） |
| T-OA3 | E | 无 object 参数 | 不注入——降级现状——不崩（旧调用兼容） |
| T-OA4 | E | object 含排除清单 | 排除项在声明块中（\"不评已批准项\"） |
| T-OA5 | N | 评审内容 | 对象声明后仍接既有评审内容/引文——不破坏 |

**验收（AC-OA）**：AC-OA1 = 对象声明注入（T-OA1/2/4）；AC-OA2 = 旧调用兼容（T-OA3）；AC-OA3 = 两端同批 + 断言绿（T-OA5 + 既有）；AC-OA4 = **可计量指标——交付门缓冲（round3 裁决为准——2026-09-04——supersede 旧“硬验收”措辞——见 §18.10.3 ④ + TODO「§18.8/§18.10 生效复核口径」）**——轨迹存档 stats（§18.6 落盘）中评审轮内“评审对象考古”类信号**密度（= reasoning 正则命中数 / reasoning 字数 × 1000——正则 = wait/hmm/actually/hold on/let me reconsider/on second thought——基线 = 本批实现前同类型评审取样（round1/2/3 三次外部设计评审——#530/#593/#636——实测 ≈1.86/1K——见 TODO 复核口径段））环比下降 >30%**——**测量方式**：脚本统计轨迹 JSON reasoning 命中/字数 ×1000——**判定：>30% 降幅作交付后观测——非交付门禁——未达降幅呈交用户复核**（交付门缓冲——实现批门槛 = 基线采集 + 统计脚本存在）。

**round1 评审（2026-09-04）已发起——1🔴+4🟡+2🔵——全部处置接受（见 §18.10.1——含本节处置）——待用户发起复审（"评审吧"）。**

### 18.8.1 评审轮序：会话上下文前置轮（2026-09-04 · 用户裁定——"原来的第一轮要有，移到第二轮，以后的轮次顺序往后移动，这几轮的上下文跟原来一样，前面加一轮，这一轮要注入会话上下文，否则他怎么评估呢？"）

> 状态：**需求+设计（2026-09-04——用户指令方向明确——评审待发起）——动机：advisor 评审无会话上下文（§12.1 Neutrality"无 conversation-history archaeology"）——Requirements coverage 只能对照文档内 F 段——审不了"会话里讨论过但文档没记/记偏"的真需求覆盖（真实盲区——非理论）。**

**问题（P-RO1）**：advisor 设计评审(现有轮序)只读 documents 列表——不看会话——用户真需求/裁定/演进(会话自有信息)**对评审不可见**——"设计是否覆盖了真需求"一维实际缺依据——评审者只能"设计是否自洽"(文档内循环)——无法从需求源头检查捕获完整性。

**需求（F-RO1——用户原话）**：**前面加一轮**——这一轮**注入会话上下文**——让评审者先有"来龙去脉"再评。
- **F-RO1.1（前插轮）**：新第一轮 = **会话上下文轮**——注入需求聚焦会话上下文——评审者**基于"会话背景 + 设计文档"**评估(尤其"真需求覆盖")；
- **F-RO1.2（原轮顺延）**：原第一轮(7 维全量——advisor-design.md)**移到第二轮**——上下文与原来一样(不变)；原 round2/3+ **往后顺延**——上下文不变；
- **N-RO1（上下文边界）**：会话注入＝**需求聚焦摘要**（用户原话/裁定/需求演进/优先级——有限 KB——主代理 prepareAdvisorMessages 处提炼——**不是全量历史**——超预算禁止；**来源标注**每条带会话来源可回溯）。

**设计（D-RO1）**：
- **D-RO1.1（轮序）**：Round 1 = **会话上下文轮**（新提示词 `advisor-context.md`——设计评审 + 会话背景注入——评"真需求覆盖"为首要 + 初扫 7 维）；Round 2 = 原 7 维全量（advisor-design.md——上下文同现在）；Round 3 = 原 round2（验 prior）；Round 4+ = 原 round3+（严格验 prior）——**总上限 5→6**（新轮占 1——每轮都评判——一致性）；
- **D-RO1.2（注入实现——prepareAdvisorMessages）**：design review 且 Round 1 时——user 消息注入**会话需求聚焦块**（主代理提炼：用户原话摘录/逐条裁定/需求演进/挂起点——≤3KB——来源标注）；Round 2+ 不注入（同现状——fresh + prior 原文）；
- **D-RO1.3（§12.1 锚/Neutrality 修订）**：Neutrality 条改——**Round 1 会话上下文显式注入（内容受控——来源标注）为评审依据；Round 2+ 仍无会话考古**（anchor 修订——两端）；
- **D-RO1.4（测试）**：T-RO1 系——Round 1 注入断言（user 消息含会话块）+ 轮序断言（design Round1=context 提示词/Round2=design 提示词）+ cap 6 + §12.1 锚句改断言。

**受影响文件（两端）**：`src/prompts/advisor-context.md`（新——轮 1 提示词——含 §12.1 锚四句 + 7 维 + 会话评估指令）、`src/prompts/advisor-design.md`（原轮 1——轮 2 不变）、`src/advisor/messages.mjs`（prepareAdvisorMessages——Round1 注入会话块）、`src/advisor/run.mjs`（cap 5→6 + 轮序映射）、`src/advisor.mjs`（轮次判定——design Round1 同 code Round1 递减）、测试（prompts.test.mjs + advisor 域文件——拆分后）——AGENT-LOOP.md(§18.8.1 本节)；CHANGELOG(父侧)。

**测试（T-RO1）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-RO1.1 | N | 模拟 design review Round 1 | user 消息含会话需求聚焦块（≤3KB 断言 + 来源标注） |
| T-RO1.2 | N | design Round 2 | 无会话块——prior 原文 + 7 维提示词（轮序正确） |
| T-RO1.3 | N | 第 6 次调用 | cap 消息（6 上限断言） |
| T-RO1.4 | E | §12.1 锚句（Neutrality 修订版） | 在 advisor-context.md/design.md（fail-when-unchanged） |
| T-RO1.5 | E | 既有 advisor 断言回归（T-AR/T-OA 等） | 全绿（零破坏——其它轮语义不变） |

**验收（AC-RO1）**：AC-RO1.1 = T-RO1.1/1.2 绿（轮序+注入）；AC-RO1.2 = T-RO1.3 绿（cap 6）；AC-RO1.3 = T-RO1.4/1.5 绿（锚+零破坏）；AC-RO1.4 = 双端同语义（上下文轮语义锚）。


### 18.9 镜像对齐优化（2026-09-04 · ~~并入轨迹分析优化批~~——**已撤销，降级为本仓库开发工具**）

> 状态：**已撤销（2026-09-04 用户原则纠正——通用 coding agent 不得在代码/机制层锁死与具体项目的关联）**。**降级说明**：镜像对齐（thincoder ↔ thincoder-vscode 提示词 byte-identical）是**本仓库自身开发杂务**（用 thincoder 开发 thincoder 的项目约定），不是通用 coding agent 能力——**不写入 agent 设计文档**（本节移出 AGENT-LOOP.md 的 agent 机制范畴——相关内容改为本仓库开发工具记录，见 docs/TODO.md「项目仓库脚本」）。**通用原则（用户裁定 2026-09-04）**：thincoder 是通用 coding agent——agent 的代码/提示词不得内置"我知道 thincoder 与 vscode 是镜像"——多关联项目镜像约定由 **用户项目设计文档/任务书声明**（agent 只执行通用文件操作：复制/比对/校验），不是 agent 专属机制。**进一步（2026-09-04 11:11 §18.11）**：byte-identical 约束本身已取消（见 §18.11）——"降级为仓库工具（同步脚本）"的记录随之失效——同步脚本候选已取消（TODO 勾销）——本节仅留原则史。

> **原设计草案（已撤销——保留供参考）**：单源同步脚本（CLI 权威 → 复制 VS Code + 镜像清单报告）——**若做为仓库开发脚本**（thincoder/scripts/sync-prompts.mjs + package.json script）——属仓库内容，非 agent 机制——agent 不内置；任务书可提及（"本仓库有 sync:prompts 脚本"）。

**本段不再进入 agent 设计评审**——对象锚（§18.8）为通用改进保留走评审；镜像对齐归项目仓库工具。

（原镜像对齐设计草案 F-MA/T-MA 等——已撤销——仅在文档顶部状态说明中保留摘要——不再赘述。）

### 18.10 工程模式判定/边界铁律固化（2026-09-04 · 用户"可以"——8 点批实现设计）

> 状态：**设计（2026-09-04——8 点纠结点批次全部定案后落——round1 评审 2026-09-04 1🔴+4🟡+2🔵 处置完成——处置见 §18.10.1——round2 复审 2026-09-04 1🔴+5🟡+2🔵 处置进行中——评审对象含 §18.8 对象锚（同批））**。触发：轨迹分析 8 主题（严重级 769K / 文档状态 729K / 方案选择 870K / 机制可行 779K / 该不该修 510K 等）——用户逐个拍板——最终裁定：**把 agent 已验证做对的判定固化为铁律**（R1-R7——来源 = 7 轮最终评审实际判定/决策链）——注入提示词——下次不必重想。

**需求层**：

- **总体需求**：工程模式评审/审计/开发过程中——agent 常反复推导"如何判定"（🔴/🟡/🔵——严重级）、"文档状态矛盾怎么办"、"测试缝怎么加"、"清单外能不能改"、"镜像测试红怎么办"——数据实证这些判定 agent **已能做出正确结果**——但每次都要长推理（推理轮 = 耗时主因——126s 单轮）。目标：**固化已证明的判定**——提示词注入铁律表——下次直接套用。

- **功能性需求**：
  - F-10.1：作为用户，我希望**严重级/文档状态判定**按已固化铁律（R1-R5/R7）执行——评审员不再反复自问"🟡 or 🔴?"
  - F-10.2：作为用户，我希望**测试缝判定**按 R6 执行——"工具集不可注入 → 唯一路径=加 seam"——不再试 A→B→C→D 发明
  - F-10.3：作为用户，我希望**授权边界**按 A 裁定——清单外改动**允许但报告**（非"绝对禁改"）——审计判据改"改了未报告=偏差"
  - F-10.4：作为用户，我希望**镜像并行语义**明确——byte-identical 测试失败 ≠ 你错（对端未同步）——报告即可
  - F-10.5：作为用户，我希望**评审对象锚**（§18.8）——评审员知道"评谁"

- **范围边界**：不改变 4 步流程/评审 7 维度/🔴🟡🔵 含义（铁律是**辅助判定**不改变语义）；不锁项目（R1-R7 是通用判定规则）；不动代码实现（仅提示词 + 断言）。

- **非功能性需求**：
  - N-10.1：铁律注入 = 提示词文字（**全部 4 模板**——`advisor-design.md` + `advisor-round1.md` + `advisor-round2.md` + `advisor-round3.md` + `engineering-sub.md` 等——两端 byte-identical——既有断言）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——本条铁律块锚照常（锚文本在设计文档逐字定稿——两端照抄——不再字节断言）**——**用户裁定 2026-09-04 方案 B：4 模板都改**（round1 只覆盖首轮——2/3 轮复审/终审无铁律会失效；设计评审走 advisor-design.md——round1 不覆盖）
  - N-10.2：铁律来源标注——"样本 7 轮观察固化——非绝对——持续复核"（诚实——不假装权威）；
  - N-10.3：零新增工具/参数（pure prompt 增强）——**但 §18.8 对象锚例外**（新增 object 参数——见 §18.8）。

**设计层**：

- **D-10.1（R1-R7 判定铁律——注入全部 4 模板——逐字定稿）**：
  > `## 判定铁律（直接套用——不自行推导）`
  > `R1 文档状态/内容不一致（非机制描述冲突——区别于 Document ownership 维度）→ 🟡（报出即修——父侧文档层——不是🔴；**例外：同一机制两处不同描述 = Document ownership 🔴——维持 advisor-design.md 约定——不降级**）`
  > `R2 实现偏离设计（验收未达/静默简化）→ 🔴（必须修）`
  > `R3 已有先例裁决（挂债——如文件尺寸）→ 🟡/🔵 不升级（不重复纠结）`
  > `R4 测试脆弱（墙钟/依赖序列化形态）→ 🔵 + 建议改确定性`
  > `R5 范围协调（父侧待办）→ 🟡 "协调项"（不报缺陷）`
  > `R6 测试缝——测试需 mock 内部工具集/慢工具——工具集由循环内硬编码获取（不可注入）→ 不要试 真实慢工具/FIFO/大文件（不确定）/观察 onTool（不足以区分）/mock LLM 返回真实工具（太快）——唯一路径 = 加测试 seam（setter 或参数 override + ?? 默认兜底——默认 null 生产零变化——测试 finally 恢复）——两端镜像同法`
  > `R7a 文档状态矛盾/跨文件滞后 → 🟡 报出不改（评审只读；**机制级矛盾除外——见 R1 例外——=🔴**）`
  > `R7b 内容矛盾 → 设计层(D)>需求层(F)>记录(TODO)——较高层为准`
  > `R7c 数字漂移/TODO 未勾销/文档卫生 → 🔵`
  > `R7d 语义悬空 → 🟡 报设计缺口（父侧补）`
  > `R7e 从不因文档状态矛盾卡"通过"——矛盾=🟡 报出即过（**机制级描述不一致除外——=🔴——必须处理后才可过**）`
  > `来源：样本 7 轮——已验证判定——持续复核`

- **D-10.2（机制三句——注入 `engineering-sub.md`——逐字定稿）**：**同步注（2026-09-04——CLI 交付 stalled F1 处置——docs-FIRST）**：`engineering-sub.md:9`（"Do NOT modify any file not listed in the approved design."）与 `:19`（"zero touches outside the approved file list"）为**旧硬句——与本文件 :34 A-裁定句同文件同机制两相反规定**——按 A 裁定同步为："report every out-of-list change with its reason"（:9/:19 措辞同步——eng-coder.md:27 现句可复制）——**补测试断言"engineering-sub.md 无旧硬句"防回归**——（本批任务书"只追加锚不重排"——故列为父侧闭环项——修正轮执行）；
  ① 测试缝句（同 R6——放 eng-coder 端——实现时遇"接口不可注入"直接加 seam）；
  ② 授权边界句（A 裁定）：`文件清单外改动允许——交付时逐项报告（说明原因）；审计"out-of-list"判据 = 改了且未报告=偏差（静默越权）；已报告=透明可接受`；
  ③ 镜像并行句：`byte-identical 测试失败 ≠ 你错——可能对端未同步——检测漂移不判对错——交付时说明`。**——已取消（2026-09-04 §18.11——byte-identical 约束取消——该句注入**将随 §18.11 实现批删除（待交付——当前两端文件仍含旧句——AGENTS.md 注"末次维护 2026-09-04"）**——见 §18.11——设计记录保留 as-of）**

- **D-10.3（对象锚 §18.8）**：评审调用父侧传 `object` 参数 → 注入对象声明块——**本批评审同批**（§18.8 已完整设计——实现同批）。

- **D-10.4（来源标注）**：R1-R7 全部标——**统一措辞（2026-09-04——vs D-10.1"已验证判定"统一）**：「verified judgments, NOT absolute — continuously re-reviewed」（= 样本 7 轮观察——非绝对——持续复核——**英文单向定稿——4 模板同句——实现照抄——无"已验证"vs"非绝对"双措辞**）——诚实——不假装权威。

**受影响文件（两端——提示词三件套惯例）**：`src/prompts/advisor-design.md`（R1-R7 判定铁律——设计评审）、`src/prompts/advisor-round1.md`、`src/prompts/advisor-round2.md`、`src/prompts/advisor-round3.md`（R1-R7 判定铁律——代码评审轮次）、`src/prompts/engineering-sub.md`（D-10.2 三句）、两端 `test/agent.test.mjs`（内容断言——铁律句/三句——4 模板各验——副本未改必失败）、`AGENT-LOOP.md`（本节 + §18.8 引用注）、`ENGINEERING-MODE.md`（**同步点——round1/round2 处置已改 FR4/FR6/§2.2 step6/T11/T19——本表补登**）、`docs/TODO.md`（8 点批勾销指向）、`ADVISOR-CONVERGENCE.md`（**指注：铁律与轮换/预算机制正交——见 §18.10.3**）。

**测试（T-10——eng-coder 展开 N/E/A）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-10.1 | N | advisor-design.md / round1 / round2 / round3 各读 | 4 模板各含 R1-R7 判定铁律句（"文档矛盾→🟡"等）——内容断言（4 份） |
| T-10.2 | N | engineering-sub.md 读 | 含三句（测试缝/授权边界 A 裁定/镜像并行）——内容断言 |
| T-10.3 | E | 判定铁律中无"锁项目"词 | grep 无 thincoder/vscode 项目名——通用性断言 |
| T-10.4 | N | 两端文件比对 | byte-identical（既有断言保持）——**指针（2026-09-04 §18.11）：15 文件比对断言已取消——见 §18.11——本条为 §18.10 批时点记录** |
| T-10.5 | E | 铁律标注 | 含"样本 7 轮——持续复核"——来源诚实标注 |

**验收（AC-10）**：AC-10.1 = 铁律+三句落文（T-10.1/2）；AC-10.2 = 通用性（T-10.3——不锁项目——用户原则）；AC-10.3 = 两端一致（T-10.4）；AC-10.4 = 来源标注（T-10.5）；AC-10.5 = 既有评审行为零回归（✅ 不改变语义——铁律辅助判定）。

**round1 评审（2026-09-04）已发起——1🔴+4🟡+2🔵——全部处置接受（见 §18.10.1）——待用户发起复审（"评审吧"）。**

#### 18.10.1 round1 评审处置（2026-09-04——1🔴+4🟡+2🔵——用户裁定"全部"接受）

| # | 类别 | 严重级 | 处置 |
|---|---|---|---|
| 1 | 文档归属 | 🔴 | 已修——ENGINEERING-MODE.md FR4/§2.2 step6/T19 同步 D-TS2 口径（修正轮默认不重跑审计/复评——终审=advisor 复评 1 次定案——LLM 3/链）——消除与 AGENT-LOOP §18.7 的矛盾 |
| 2 | Clarity | 🟡 | 已修——§18.8 状态行/标题改"设计层已落——待评审（与 §18.10 同批）" |
| 3 | 验收标准 | 🟡 | 已修——AC-OA4 改可计量指标（轨迹 wait 考古信号密度环比下降 >30%）——**指针（2026-09-04 复审后——round3 裁决：交付门缓冲——见 §18.8 AC-OA4 修订——本节措辞为 round1 时点记录）** |
| 4 | 文档归属 | 🟡 | 已修——R1/R7a/R7e 划清两类：状态/数字漂移=🟡/🔵；**机制级两处不同描述（Document ownership）=🔴 不降级**（维持 advisor-design.md 约定） |
| 5 | 状态 | 🟡 | 已修——R2 状态统一"已实现"：§18.7 状态行改已实现 + :1227/:1352 改实现完成 + TODO:331 勾销 |
| 6 | Clarity | 🔵 | 已修——ENGINEERING-MODE:304-306 重复状态块删除（merged 为两端均已实现块） |
| 7 | Clarity | 🔵 | 已修——TODO 行数快照措辞"以拆分轮启动时实测为准"（历史混排标注） |

**状态：round1 处置完成（1🔴 清除）——round2 复审 2026-09-04 1🔴+5🟡+2🔵——用户裁定"全部修"——round2 处置见下。**

#### 18.10.2 round2 评审处置（2026-09-04——1🔴+5🟡+2🔵——用户裁定"全部修"）

| # | 类别 | 严重级 | 处置 |
|---|---|---|---|
| 1 | 文档归属 | 🔴 | 已修——A 裁定（清单外允许但报告）与既有旧口径矛盾：ENGINEERING-MODE.md FR6（L24）/T11（L171）/AGENT-LOOP §18 D-E2 ①（L872）+ L876 措辞减轻（A 裁定仅指代码文件——设计文档永远零编辑）——全部同步 A 裁定口径——受影响文件表补 ENGINEERING-MODE/§18 既有行 |
| 2 | Clarity | 🟡 | 已修——§18.8 悬空引用（§18.8.1 不存在）→ 指针改 §18.10.1（含本节处置）+ 状态行修正 |
| 3 | Clarity | 🟡 | 已修——§18.8/§18.10 状态行与正文矛盾 → 统一"round1 处置完成 + round2 进行中——处置见 §18.10.1/§18.10.2" |
| 4 | 验收标准 | 🟡 | 已修——AC-OA4 去逃逸条款：定死正则/基线（前 10 次取样）/测量方式（脚本统计）/硬验收（未达降幅 ≠ 通过）——**指针（2026-09-04 复审后——round3 裁决：交付门缓冲 supersede 硬验收——见 §18.8 AC-OA4 修订——本节为 round2 时点记录）** |
| 5 | Clarity | 🟡 | 已修——"可选一致性句"定稿为"全 4 模板加" + §18.8/§18.10 同批合并为一次 prompt 编辑批次（防字节漂移） |
| 6 | Clarity | 🔵 | 已修——D-OA3 object 示例统一对象形态（与 N-OA1 一致——工具参数为 JSON 对象） |
| 7 | 卫生 | 🔵 | 已修——TODO:77 标题改"8 点全部已拍" + R1 加 D-10.1 权威句指注（防漂移） |
| 8 | 卫生 | 🔵 | 已修——TODO:325 R2 记录加 as-of 注（后已批准 + 双端实现 + 核销通过） |

**状态：round2 处置完成（1🔴+5🟡+2🔵 全修）——待用户发起 round3 复审（"评审吧"——严格核对 fix claims）。**


#### 18.10.3 round3 复审（2026-09-04——0🔴 通过——token b7db45cd…/designId de2a4980——用户批准）

round3 复审结果：**0🔴——批准**（designToken `b7db45cd-9f39-4aba-8253-13242a6f4e6e:1789071504953:a09ffb56dd08b9cf` / designId `de2a4980-cc6e-4fdb-8649-10f7a5ef3a8c`）；5🟡+2🔵 建议项——**裁决（2026-09-04 用户"批准"）**：按建议 3——不阻塞——**作为实现批 task 条款处理**（①英文逐字定稿 ②R6 通用化+符号移设计注 ③铁律块"按评审类型取适用"指引句 ④AC-OA4 交付门缓冲（基线采集+脚本存在；>30% 降幅作交付后观测）⑤T-10.3 扩 grep（符号名/CLI|VS Code 形态））；⑤⑤⑦⑧（受影响文件表补 ENGINEERING-MODE.md/ADVISOR-CONVERGENCE 指注/§18.8 状态行/A 裁定落点/对象块定序/R1 措辞）为**文档层修订——父侧同批落**（本批实现前完成）。

> 英文锚（实现批——照抄——语义 = §18.10 D-10.1/D-10.2 中文定稿——惯例：提示词锚一律英文——D-CL1 先例）：见实现批任务书（§18.10.3 引用——不在此重复）。

**状态：设计批准（round3 0🔴——token b7db45cd…/designId de2a4980——用户批准 2026-09-04——实现中）。**



**实现完成（2026-09-04——CLI + VS Code 双端——§18.8/§18.10 批自身核销：CLI 1344 测/1298 pass/0 fail（46 skip 慢测）+ VS Code 1043/1043——见 docs/TODO.md「重启交接 4」；**注：旧行“1330/1330 + 1031/1031”属 R2/§18.7 核销（ENGINEERING-MODE §7 R2 条——2026-09-04 数字漂移已更正）**）。**
### 18.11 byte-identical 镜像约束取消——设计锚为准（2026-09-04 · 用户裁定——"取消二者二进制一致约束"——替代方案 A 拍板）

> 状态：**设计（2026-09-04 11:11——用户裁定"取消 byte-identical 约束"——替代方案 A（设计锚为准——设计文档逐字定稿镜像锚，两端各自照抄，差异靠设计评审+交付审计发现，不再机械断言字节相同）——用户复"清理不必要的约束"确认清理范围——round1 评审 2026-09-04 0🔴 通过（token a56c7b19…/designId 800f8be4——5🟡+2🔵 建议项——用户裁决"批准"——按建议 B 实现批 task 条款——**本批修订 1/2/3/4/5/6/7 已落（见下）**）——**round2 复审 2026-09-04 1🔴（D-BI6 扫描不完整——byte-identical 残留未清——见 §18.11 处置注）+6🟡/🔵——全部已修（指针 8 处/TODO 勾销/数字更正/悬空修正/残片清）——待 round3 复审**）。**触发：8 点批第 1 点（对齐镜像 976K——最大纠结主题）最终裁定落地——用户指出 byte-identical 约束在并行镜像开发中制造漂移纠缠/协调成本（id:4-7 四轮 byte-identical 红绿循环为实证）——约束收益 < 成本——取消。

**需求层**：
- **F-BI1（取消）**：作为用户，我希望取消 CLI/VS Code `src/prompts/` 两端 byte-identical 机械约束——两端可各自演进——不再强制字节相同、不再需要同步脚本。
- **F-BI2（保留锚）**：作为用户，我希望**设计文档镜像锚机制保留**——多实现面派发时锚文本在设计文档逐字定稿（权威源）——实现面照抄——差异靠设计评审+交付审计发现（非机械比对）。
- **F-BI3（清理）**：作为用户，我希望 byte-identical 相关的不必要约束全部清掉——机械比对断言（15 文件对/4 模板复制/mirror 句断言）删除；内容断言（锚句存在）保留。
- **F-BI4（并入内容修复）**：engineering.md:107（审计描述缺 "AND not reported"——A 裁定同类残留）——修（用户已拍）；:295（父代理 Hard Rules）——保留不动（用户已拍——非矛盾）。
- **N-BI1**：单端"防静默降级"字节断言（advisor-design.md 硬加载）、DeepSeek 前缀缓存字节断言（session-compaction/time-injection）、src 语义锚（cross-repo-parity）——**不属"两端镜像"——保留不动**。

**设计层**：
- **D-BI1（替代机制）**：清晰化——镜像锚仍在设计文档逐字定稿（METHODOLOGY 多实现面条款保留"锚"概念）；两端实现各自照抄（任务书给出锚文本）——**取消** byte-identical 断言与同步脚本——差异暴露 = 设计评审（Document ownership 检查——R1 例外机制级两描述=🔴）+ 交付审计（实现面偏离设计锚=超清单/静默简化类偏差）+ cross-repo-parity 语义锚（src 已用此法——提示词层继承同一精神：语义锚代替字节锚）。
- **D-BI2（清理清单——测试）**（符号锚——行号为 as-of 注）：
  1. CLI `test/agent.test.mjs` **“两端 src/prompts/ 15 文件 byte-identical” test**（:4254-4265 as-of）——**删除**（含 assert + skip 逻辑）；
  2. CLI `test/agent.test.mjs` **“byte-identical（项目铁律）”注释**（:3779 as-of）——**改注释**为“各端内容断言（锚句存在）防漂移”（内容组保留）；
  3. CLI `test/agent.test.mjs` **“prompts 4 模板: 铁律块+一致性句字节一致” test**（:4129-4134 as-of）——**删除**（内容断言 T-10.1 已覆盖铁律块句存在——字节比对冗余）；
  4. CLI `test/agent.test.mjs` **mirror 句断言**（:4148-4149 as-of）——**删除**（句子本体删——见 D-BI3）；
  5. CLI `test/subagent.test.mjs` **T-M12 注释**（:1311 as-of）——“两端 byte-identical 由既有 15 文件比对覆盖”——**改**为“内容断言”（不再引用 15 文件比对）；
  6. CLI `test/agent.test.mjs` **“byte-identical 三件套前提” 注释**（:5151 as-of）——**改**（cap 短语内容断言保留——注释更新）；
  7. VS Code `test/agent.test.mjs` **T-10.4 6 文件比对 test**（:1656-1661 as-of）——**删除**；
  8. VS Code `test/agent.test.mjs` **“byte-identical（项目铁律）” 注释**（:1162 as-of）——**改**；
  9. VS Code `test/agent.test.mjs` **mirror 句断言**（:1632 as-of）——**删除**；
  10. VS Code `test/agent.test.mjs` **discipline 内容级断言注释**（:1678/1718 as-of）——**改**；
  11. **补（round1 #2）**：两端 `test/agent.test.mjs` **§18.10 T-10.2/T-10.2b “engineering-sub.md 含三句” 内容断言**——**改“三句”→“两句（测试缝+授权边界——mirror 句已删）”**——fail-when-unchanged 措辞随改；
  - **保留**（明确非镜像）：`advisor.test.mjs`（两端）提示词硬加载逐字节（防静默降级）、`agent.test.mjs:1314`（sys1==sys2 缓存前缀）、`session-compaction.test.mjs`/`time-injection.test.mjs`（缓存前缀）、`cross-repo-parity.test.mjs`（src 语义锚——继承引用——加注释“§18.11 提示词层同精神”）。
- **D-BI3（清理清单——提示词）**：两端 `src/prompts/engineering-sub.md`：**mirror 并行句**（"Mirror-parallel semantics: a byte-identical test failure is NOT your fault…"——§18.10 D-10.2 ③ 注入）——**删除**（byte-identical 测试不再存在——句子无意义——机制三句变两句——测试缝句+授权边界句保留）；`engineering.md`（两端）：`:107`——"changes outside the approved file list" → "**changes outside the approved file list AND not reported in the delivery report**"（A 裁定口径）；":295"——保留（非矛盾——父代理边界）。
- **D-BI4（清理清单——文档）**：
  1. 本项目版 `docs/design/METHODOLOGY.md`（L43 等现行句——"两端 byte-identical 照抄"——**改**为"设计锚为准——两端各自照抄——不再 byte-identical 断言"；历史记录按 as-of 保留）；
  2. 根模板 `D:/teamcode/METHODOLOGY.md`（仓外——多实现面节——镜像锚同为设计文档逐字定稿——byte-identical 句改设计锚句——**非 git——同批实现侧更新**）；
  3. `src/prompts/methodology-template.md`（两端——15 对之一）——锚文本随根模板更新**本次照抄一次**（锚→副本仍同文——仅"今后不再强制"）——**注意**：本次更新后不再有 byte-identical 断言——但内容仍一致（照抄）；
  4. 两端 `AGENTS.md`——2026-09-04 镜像约定声明——**改**："byte-identical 约束已取消（2026-09-04）——设计锚为准——差异靠评审/审计"；
  5. `docs/design/AGENT-LOOP.md`——§18.10 D-10.2 ③（镜像并行句——设计记录原文）——**更新**（"句已取消——见 §18.11"——历史处置记录保留 as-of）；§18.9（同步脚本——已撤销记录）——补注"取消取消——byte-identical 没了脚本无必要"——等等——§18.9 是"撤销（同步脚本降级仓库工具候选）"——现在连候选都取消——TODO 同步脚本行勾销；
  6. `docs/design/ENGINEERING-MODE.md`——§2.7 受影响文件补登本批 + 变更记录段（2026-09-04 条）+ **现行 “byte-identical 硬约束” 句扫描指注（见 D-BI6）**；
  7. `docs/TODO.md`——8 点批第 1 点进一步裁定已落（2026-09-04 11:11）；同步脚本候选——**勾销**（取消）；
  8. **round1 #6 处置**：`scripts/sync-prompts.mjs` 若存在——**删除** + package.json `sync:prompts` 脚本随删；若不存在——**显式确认**“无脚本残留”（实现批任务书明确）。
- **D-BI5（范围边界——round1 #4 修订）**：**产品提示词（两端 `src/prompts/*`）在范围内**（D-BI3 改）——**“平台层”= agent 框架自身 system prompt（非本仓库 `src/prompts/`）——不动**；不改历史设计记录原文（as-of——仅加“更新见 §18.11”指针句——控制在受影响文件表列出的范围内）；`thincoder-desktop/vendor` 第三副本（第三方快照——不在镜像对——不动——TODO 原条取消/降级）。
- **D-BI6（悬空引用扫描——round1 #3 处置）**：以下**现行**引用 15 文件比对的句子加指针“**15 文件比对断言已取消——见 §18.11**”（或显式 as-of 声明）：`§19.4 N4`“既有 15 文件比对覆盖”、`§16 NF-B2`、`§20.7 F-PS4`、ENGINEERING-MODE.md `:119`“byte-identical 硬约束”（行号 as-of——round3 #7 更正：实际 :119——原 :117 为 messages.mjs 行）、**`§18.10 T-10.4`**（“两端文件比对 / byte-identical（既有断言保持）”——round1 补点名——该断言行被 D-BI2 删除清单覆盖——同样加“已取消——见 §18.11”指针）——**受影响文件表扩**（AGENT-LOOP 相关现行段——逐处加指针注；历史 as-of 记录保留原文——不重写）。
- **D-BI7（归属注——round1 #5 处置）**：本节与 §18.9 张力——**归属接受现状**：§18.11 记于 AGENT-LOOP §18（工程模式既有域——随 §18.8/§18.10 同域——用户裁定与实现记录同处）；§18.9“镜像=开发杂务不写 agent 设计文档”原则——本节的“取消”是**机制级裁定**（影响测试/提示词/两端纪律——非纯杂务）——保留在 §18；同步脚本取消记录已在 §18.9 补注 + TODO 勾销——不再提升为独立仓库工具文档。

**受影响文件（两端）**：
- 测试：CLI `test/agent.test.mjs`（6 处删/改）、`test/subagent.test.mjs`（1 处注释）、VS Code `test/agent.test.mjs`（5 处删/改）；
- 提示词：两端 `src/prompts/engineering-sub.md`（mirror 句删）、两端 `src/prompts/engineering.md`（:107 修——15 对之一——本次两端各自改——**无 byte-identical 断言后允许各自演进——但本次仍两端同改（内容修复同向）**）、两端 `src/prompts/methodology-template.md`（锚文本照抄根模板——本次同步一次——不再断言）；
- 文档：`docs/design/AGENT-LOOP.md`（§18.11 本节 + §18.10 D-10.2 ③ 更新 + §18.9 补注）、`docs/design/METHODOLOGY.md`（现行句）、`docs/design/ENGINEERING-MODE.md`（§2.7 + 变更记录）、两端 `AGENTS.md`、`docs/TODO.md`、根模板 `D:/teamcode/METHODOLOGY.md`（仓外——非 git——同批更新）；
- 不动：`cross-repo-parity.test.mjs`、advisor.test.mjs 硬加载断言、缓存前缀断言（保留——非镜像）、`thincoder-desktop/vendor`、系统提示词。

**测试（T-BI——eng-coder 展开 N/E）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-BI1 | N | 删除后跑 CLI/VS Code 全量 | 全绿（无 byte-identical 断言）——内容断言（锚句）仍绿 |
| T-BI2 | N | grep 两端 test/ **+ docs/design/ + src/prompts/** “byte-identical/15 文件比对” | 仅保留非镜像断言（advisor 硬加载/缓存前缀/cross-repo 语义锚）——无规范“byte-identical 强制/15 文件比对”措辞残留（现行句——历史 as-of 记录除外——**排除机制（round1 #4 定死）：grep 命中行须带“as-of”标记或命中行号在实现批维护的 allowlist（文件:行——含 §16 NF-B2/§19.4 N4/§20.7 F-PS4/§18.10 T-10.4 的指针注行）——列表附 D-BI6**——否则断言失败） |
| T-BI3 | N | 读 engineering.md:107（两端） | 含 "AND not reported"——内容断言（如 T 系列有）更新/新增 |
| T-BI4 | N | 读 engineering-sub.md（两端） | mirror 句零残留——测试缝+授权边界两句在 |
| T-BI5 | N | 读两端 AGENTS.md + METHODOLOGY 现行句 | 无 "byte-identical 强制" 措辞——设计锚为准措辞在 |
| T-BI6 | E | 单独 clone CLI（无 VS Code 目录） | 测试不崩（删除了 skip 逻辑——不再有 15 文件比对——内容断言独立） |

**验收（AC-BI）**：AC-BI1 = 两端全量绿（T-BI1）；AC-BI2 = 镜像断言零残留（T-BI2——仅非镜像保留）；AC-BI3 = :107 修 + mirror 句删（T-BI3/4）；AC-BI4 = 文档现行条款无 byte-identical 强制措辞（T-BI5）；AC-BI5 = 单仓场景不崩（T-BI6）。
### 18.12 verify 改动文件定位修复——cwd 错位 + 双端对齐（2026-09-04 · 用户确认启动——根因已明）

> 状态：**已实现（2026-09-04——round1 评审 0🔴 通过（token a3e7aa20…/designId 1ab6cf3e——5🟡+2🔵 建议项——用户裁决"批准"——按建议 B——本批修订 #3/#5/#6 已落——#4/#2/#7 随 §18.11 批）——实现：CLI id:3（clean——L1 1347/1299/0 fail + tools.test.mjs 140/140——含 T-VR1/2/2b/3/2c + F-VR1 相关测试项目根回退/缺失判负）+ VS Code id:4（clean——L1 1043/0/0——T-VR4——_touchedFiles 同构确认——无降级）——父侧 L2 test:full 核销 2026-09-04：CLI 1347/1347 0 fail 0 skip + VS Code 1043/1043 0 fail 0 skip）。**实现记录见下——偏差（透明）：测试落点 test/tools.test.mjs（非任务书 agent.test.mjs——按设计"核对两文件现状"规则）；T-VR2b/2c 超表（审计/advisor 回归）；F-VR1 补全（D-VR5 级——相关测试项目根回退+缺失判负——见 §18.12 实现注）；verify.mjs 332→429 行（>300 advisory——TODO 行数债候选）。**触发：用户观察"VS Code 端多跑测试"——深挖实锤：eng-coder 子代理 `agent.cwd` 继承父会话 workspace 根（`D:\teamcode`——非 git 根）——verify git-diff 锚定 `ctx.agent.cwd`（`verify.mjs:78` as-of）→ "not a git repo" → changedFiles 空 → L0 失效 → eng-coder 手动全量兜底（多跑）——VS Code verify.mjs（109 行）本身**无 git-diff/changedFiles 段**（L27 execute 直接语法检查+测试——与 CLI 不同构）。**行号注：本节行号（verify.mjs:78/69/70 等）为 as-of 快照——符号锚 = verifyTool/runTestFile/改动文件定位段（实现批按符号定位——行号仅轨迹注）**。

**需求层**：
- **F-VR1（L0 可靠）**：作为用户，我希望 verify 在"子代理 cwd ≠ git 根"场景仍能定位改动文件——L0（相关测试）不再失效——修正轮不再被迫全量。
- **F-VR2（双端对齐）**：VS Code verify.mjs 与 CLI 同构——补改动文件定位逻辑。
- **F-VR3（workdir 语义澄清）**：verify workdir 文档不再误导（"git-diff 锚定项目根"→ 新语义）。
- **N-VR1**：零行为回归——git diff 路径在正常 cwd（git 根）场景行为不变；L0 超集语义（D-TS1 已接受）保持。

**设计层**：
- **D-VR1（定位源——并集——超集语义（D-TS1 已接受））**：changedFiles 源 = **① `ctx.agent._touchedFiles`（per-run 记账——绝对路径——顶层+子代理均记账——`agent.mjs:101/427/157`——最可靠）∪ ② git diff 回退**（cwd 尝试链：`testCwd`（workdir 解析后——`verify.mjs:70`）→ `ctx.agent.cwd`——两处均试——任一成功即用）；两者并集（超集——D-TS1 语义——**并集前归一化：所有路径统一为绝对路径 + 正斜杠 + win32 小写比较键（§20.5 先例——files 归一化同法）**——_touchedFiles 本身为绝对路径；git diff 相对路径按对应 git 根 resolve 成绝对再归一化）。**效果**：cwd 错位场景 _touchedFiles 非空 → 定向；正常场景 git diff 不变。
- **D-VR2（VS Code 对齐——定死——round1 #5 处置）**：`thincoder-vscode/src/agent-tools/verify.mjs` 补同一逻辑（_touchedFiles ∨ git diff（testCwd→ctx.cwd））——与本端 ctx 结构适配——**判定定死**：VS Code 端 runAgent 与 CLI 同构（§15.6 两端对齐——含 `_touchedFiles` per-run 记账——实现批**必须先实测确认**（读 `thincoder-vscode/src/agent.mjs` 或 runAgent 设置点——存在 → 同构同法；不存在 → **补记账**（对齐 CLI `agent.mjs:101/157/427`——VS Code 端 runAgent 同构——属实现批范围）——**不留"缺则仅 git diff 链"降级**（该降级使 AC-VR2 可空转——cwd 错位仍是 VS Code 痛点——TODO 根因链 ④）。
- **D-VR3（workdir 注释）**：CLI `verify.mjs:68-69` 注释"git-diff stays anchored to the project root"→ **改**为"changed-file resolution = _touchedFiles ∪ git diff（testCwd→cwd 尝试）"；VS Code 对应描述同步（独立——无 byte-identical 约束——§18.11 后两端各自演进——但本次同向对齐）。
- **D-VR4（不动）**：verify 其余行为（syntax/测试/verdict/D-TS1 L0 语义）不动；根因链（spawn cwd 指向任务书目录——候选 2）——**不采纳**（影响所有子代理基线——风险 > 收益——_touchedFiles 已解决；若有其他场景需要——另行设计）。

**受影响文件（两端）**：
- CLI `src/agent-tools/verify.mjs`（改动文件定位段——D-VR1/3）；
- VS Code `src/agent-tools/verify.mjs`（补定位段——D-VR2/3；若 VS Code `agent.mjs` 缺 `_touchedFiles` 记账——按 D-VR2 补）；
- 测试：CLI `test/agent.test.mjs` **或 `test/verify.test.mjs`**（**定死：核对两文件现状——承载 verify 的单测文件即落点**——新增 T-VR1/2/3）；VS Code 对应测试（T-VR4）；
- 文档：`docs/design/AGENT-LOOP.md`（§18.12 本节）、`docs/design/TOOLS.md`（**定死：查 TOOLS.md 是否承载 verify 工具描述——承载 → 同批同步 workdir/定位语义；未承载 → 零动作**）、`docs/TODO.md`（根因条勾销指向）、**两端 `CHANGELOG.md`（父代理统一——实现记录）**。

**测试（T-VR——eng-coder 展开 N/E）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-VR1 | N | mock ctx.agent.cwd = 非 git 根（如 D:/workspace）+ agent._touchedFiles 含 src/x.mjs | verify 定向（含 src/x.mjs 语法检查/相关测试）——不因 "not a git repo" 失效——不跑全量 |
| T-VR2 | N | 正常 cwd（git 根）——git diff 可用 | 行为不变（git diff 链仍生效——_touchedFiles ∪ git diff） |
| T-VR3 | E | _touchedFiles 空 + git diff 全失败 | 回退现有行为（空列表→正常路径——不崩——D-TS1 null 映射不采用语义） |
| T-VR4 | N | VS Code verify 同场景 | 与 CLI 同构行为（定位成功） |

**验收（AC-VR）**：AC-VR1 = T-VR1/2/3 绿（CLI——cwd 错位场景定向成功、正常场景不变、空回退不崩）；AC-VR2 = T-VR4 绿（VS Code 对齐）；AC-VR3 = verify 全量回归绿（既有测试）；AC-VR4 = workdir 注释与实现一致（D-VR3）。

### 18.13 审计范围引导：quick 档 + 机械预算句（2026-09-04 · 用户观察——"审计 explore 跑非常久——缺乏范围引导"）

> 状态：**已实现（2026-09-04——双端——VS Code id:25 核验 clean（零改动——id:17 取消前落盘 + §18.14 拆分迁移断言——L1 1061/1061——T-A1.1/.2/.4 在 prompts.test.mjs/eng-delivery.test.mjs——审计 1 CLEAN + advisor 首审/复评 0🔴）——CLI 端：**已落盘（2026-09-04 22:12 重派前核查发现——engineering-sub.md:25 quick 锁句 + subagent.mjs:427 预算句逐字同设计——测试 prompts.test.mjs:509（T-A1.1+防回潮）/eng-delivery.test.mjs:878/941（T-A1.2+防回潮）——L2 1416/1416 覆盖——AC-A1.1/1.2 绿——原「id:16 取消——待重派」记录作废——无需重派）**——父侧 L2 核销待全部批次后）**。（历史：用户裁定"可以，先量化"→ 量化结论：无现有数据可答时长（LOGGING 骨架未含子代理审计时序——子代理上下文不落盘——观测缺口）→ 用户裁决："别补可观测了，回头现有的也要去掉的，调试完成了就要删"——只修引导——不补观测点）**

**问题（P-A1）**：eng-coder 内部审计 explore 跑非常久——根因三层（实读 §18 D-E3/engineering-sub.md）：
1. **thoroughness 档错位**：engineering-sub.md 审计指令 = `"medium unless the delivery is large"`——审计=定点核对（对照设计找偏差）——不是广度探索——medium（多探针）天然偏重；大交付还升 thorough——**方向反了**；
2. **范围纪律纯文本自觉**：审计任务书范围句 1 条（"只审 _touchedFiles 与父任务书确认的文件"——D-TS4）——但 AGENT-LOOP.md（**约 200K/2196 行——as-of——评审 #6**）——"相关节"判定宽 → explore 大段读——**无机械硬锚**（如仅读任务书画线的节——不整读）；
3. **explore 无"审计档"**：explore.md thoroughness 三档（quick/medium/thorough）——无"审计=最小确认"心智——探索者对审计算法 = 最大探索。

**需求（F-A1）**：作为用户，我希望 eng-coder 审计 explore **不跑那么久**——审计=最小确认（读该读的）——不广度扫描。
- **F-A2（quick 档默认）**：审计 spawn thoroughness = **quick**（不再 medium/不随交付规模升 thorough——审计范围内已机械确定——无需广度）；
- **F-A3（机械预算句）**：审计任务书机械段加预算句——"只读 _touchedFiles 实际文件 + 设计文档任务书点名的节（受影响文件表/验收标准/状态行）——不整读文档——预算 ≤10 工具轮——超时报 PROBLEM 下结论"；
- **N-A1（零破坏）**：四类偏差语义/报告三态/父侧审计链路不变——只缩范围与档。

**设计（D-A1）**：
- **D-A1.1（engineering-sub.md 审计指令）**：`thoroughness: "medium unless the delivery is large"` → `thoroughness: "quick"`（+ 一句锁定："审计是对照核对——非广度探索——读该读的即止"）；
- **D-A1.2（审计任务书机械段——subagent.mjs 拼接注入处——D-TS4 拼接处——定序：A1 指令模板 + A2 摘要块之后、A3 报告模板之前——评审 #7**）：加预算句（逐字）：
  ```text
  [Audit budget — mechanical]: read ONLY the touched files listed above and
  the design-doc sections the parent task book names (affected-files table,
  acceptance criteria, status line). Do NOT read whole documents. Budget =
  10 tool rounds max — if you cannot conclude within it, report PROBLEM
  (inconclusive) rather than continuing to explore.
  ```
- **D-A1.3（范围句保留）**：既有"只审 _touchedFiles 与父任务书确认的文件；工作区未列改动与..."句不动——预算句是追加（强化——非替换）；
- **D-A1.4（两端）**：engineering-sub.md 两端同步（语义锚——各自照抄）；审计任务书模板在 subagent.mjs（CLI）+ 对应（VS Code——核对同构）——同批。

**受影响文件（两端）**：
- CLI `src/prompts/engineering-sub.md`（审计指令 quick）+ `src/agent-tools/subagent.mjs`（审计任务书机械段加预算句——D-TS4 拼接处——**VS Code 对应：`src/agent-tools/subagent-async.mjs` `auditTaskBook`——符号锚（评审 #1——§18.5/§18.7 已立——不用"核实 file 位"**））+ 测试——**T-A1.1 → `test/prompts.test.mjs`（engineering-sub.md 内容断言——T-TS1/T-10.1 模式——§18.14 拆分后落点）；T-A1.2 → 承载审计任务书模板断言的域文件（CLI 拆分后现状——T-TS4/5/6 模式——评审 #3——**§18.14 D-T1.8：落点随拆分更新——以拆分后实际域文件为准**）**；
- VS Code 对应（subagent-async.mjs auditTaskBook——同构）；
- 文档：AGENT-LOOP.md（§18.13 本节 + D-TS4 加指针）、两端 CHANGELOG（父侧）。

**测试（T-A1）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-A1.1 | N | 读 engineering-sub.md（两端） | 审计指令含 `thoroughness: "quick"` + "审计是对照核对"句——fail-when-unchanged |
| T-A1.2 | N | 读审计任务书机械段（subagent.mjs 拼接） | 含 "Audit budget — mechanical" + "10 tool rounds max" + "report PROBLEM"——fail-when-unchanged |
| T-A1.3 | E | 既有审计断言回归（D-TS4 范围句/四类偏差/报告三态） | 全绿（零破坏——N-A1——追加不替换） |
| T-A1.4 | A | 预算句/quick 缺失（模拟回归） | 断言失败（防回潮） |

**验收（AC-A1）**：AC-A1.1 = T-A1.1/2 绿（quick + 预算句在）；AC-A1.2 = T-A1.3 绿（零破坏）；AC-A1.3 = **定性验收（评审 #2——"阅读量"无数据源——与"不补观测"裁定张力——删除该词——判定 = ①交付报告审计轮次数 + ②用户对下次审计时长的主观反馈**（后续若仍报慢——证据链由交付报告轮次支撑——用户裁定"调试完成就删观测"）；AC-A1.4 = 双端同语义。

**范围声明（评审 #5）**：本批范围 = **eng-coder 内部审计**（F-A1 明示）——**父侧可选审计**（§18 D-E6——主会话直接 spawn）**不在本批**——父侧审计若仍报慢——同类问题同理（quick + 预算句）——另行处理时按本设计同法——**明示 out-of-scope**。

**归档（用户裁定——观测清理哲学）**：本段隐含——**不新增观测**——现有 LOGGING/traces 可观测（if any）调试完成后删除——**记 TODO 清理项**（不随本批——另行）。

### 18.14 测试文件按域拆分（2026-09-04 · 用户观察——"agent.test.mjs 类测试文件成并发锁——排队"——方案 B 拍板）

> 状态：**已实现（2026-09-04——双端——VS Code id:22 clean（12 域——L1 1061/1061）+ CLI id:21 clean（37 域 + helpers×4 + fixtures + verify.mjs 映射修复（清单外必需——原映射指向已删文件→功能性失效——已修）——L1 1371/1323/0/48skip——机械保真 741/741——cross-repo-parity 绿——审计 2 轮 + advisor 0🔴（评审 🟡#2 D-T1.6 枚举已修）——父侧 D-T1.8 文档引用修正进行中（报告清单 ~30 处——as-of 豁免）——父侧 L2 核销待全部批次后）**。

**需求（F-T1——登记句）**：作为用户，我希望测试文件按域拆分——**不再把一堆测试写在一个大文件里**——并发批次不再因共享测试文件排队——每文件 ≤1500 行主题隔离。
- **F-T2（域规则）**：拆分按主题（prompt 内容断言 / agent 内核 / advisor / 压缩压缩 / subagent 家族 / 工具域 / TUI / PDF / MCP / memory…）——命名 `<域>.test.mjs`；
- **F-T3（断言落点惯例）**：今后新 prompt 断言 → `prompts.test.mjs`（不再 agent.test.mjs）——**文档引用同步改**（AGENT-LOOP §18.7/§12.1/§7.3/§18.13 + TOOLS/TUI 的"T-TS1 → test/agent.test.mjs"类引用几十处——拆分另一半 = 引用修正——不修就是新漂移）；
- **N-T1（零破坏）**：拆分 = 移动不重写——每测试体原样迁移（完整 test 块——memory 教训：锚点必须完整块含收尾 `})`——防孤儿体）——测试语义/名称零改——node --test 全量绿；helper 重复才抽 `test/helpers.mjs`（方案 C 精神——不强求）。

**待办**：①explore 内容分布映射（各文件主题块→子文件映射表——设计输入）；②设计定稿（映射表 + 受影响文件 + 引用修正表 + 测试 T-T1 系）；③等 id:14-17 交付→评审→实现（双端）。

### 18.14.1 设计（映射定稿——2026-09-04 · explore thorough 报告——方案 B）

**关键决策（D-T1）**：
- **D-T1.1（域名规则）**：按主题拆——`prompts.test.mjs`（prompt 内容断言——**今后新 prompt 断言落点——锁根治**——CLI ≈985 行/VS Code ≈790 行）/`agent-core`/`agent-context`/`compaction`/`guards`/`eng-delivery`/`provider-stream`/`stream-rules`/`dispatch-domain`/`distill`/`eng-reminders`/`subagent-core`/`subagent-async`/`subagent-tool`/`subagent-panel`/`subagent-scheduler`/`suspension-core`/`suspension-digest`/`suspension-interrupt`/`suspension-tui`/`advisor-message`/`advisor-review`/`advisor-eng`/`advisor-parallel`/`file-tools`/`edit-tools`/`git`/`checkpoint`/`bash`/`verify-domain`/`execute`/`checklist`/`skills-distill`/`ops-scope`/`tui-render`/`tui-input`/`tui-panel`/`tui-stream`/`tui-picker`/`pdf-parse`/`pdf-golden`(fixtures)/`vscode-*`——**每文件 ≤1500 行**；
- **D-T1.2（prompts.test.mjs 为锚）**：CLI agent.test.mjs 两块(1919-1998 80 行 + 3844-4566 723 行 + 内嵌 helper 随迁)+ advisor.test.mjs 1061-1163(103 行) → prompts.test.mjs(≈985 行)；VS Code agent.test.mjs 1199-1932 + 1952-2006(≈790 行) → 同文件——**两端同构不同份**（CLI 平铺/VS Code describe——cross-repo-parity.test.mjs 守护两端一致性——**拆分不破坏其路径引用**——D-T1.3）；
- **D-T1.4（伪大文件）**：pdf.test.mjs 344-1600 = GOLDEN_B64 数据(1257 行)——迁 `test/fixtures/pdf-golden.mjs`——逻辑留 pdf-parse.test.mjs(≈380 行)；
- **D-T1.5（混杂带）**：CLI agent.test.mjs 470-870 是唯一人工再切区——按测试名前缀归 agent-core(权限透传/task 提醒)/agent-context(序列化/压缩判定)/provider-stream(流式 provider)三向（报告建议）;
- **D-T1.6（helper 抽取——方案 C 精神——评审 🟡#2 修正：实际抽 4 个）**：CLI 跨文件重复 helper——按 3+ 重复同体规则抽 `test/helpers/`——**实际 4 个（id:21 实现验证）：freshMemory×3 / mockLLM×10（agent-style 完全同体）/ LONG_REPORT×3 / waitFor×4（5000ms 版）——asyncServer/asyncParent 为 2 变体（subagent 版无 requests 捕获/asyncParent 差异）——按"不强抽——内联原地"保留（×2 者不算 3+ 规则）**——；
- **D-T1.7（零互引——拆分干净）**：explore 确认大测试文件零互引——拆分只改各新文件自身 import(自带 `node:test`/`./slow.mjs`/`../src/*` 相对路径不变——同 test/ 目录)——**无连锁义务**;
- **D-T1.8（引用修正——拆分另一半）**：文档测试落点引用同步(AGENT-LOOP §18.7/§12.1/§7.3/§18.13 + TOOLS/TUI 的"T-* → test/agent.test.mjs"类——几十处——改至新文件);
- **D-T1.9（N-T1 零破坏——拆分机械）**：移动不重写——完整 test 块迁移(含收尾 `})`——memory 孤儿体教训)——测试名/语义零改——全绿。
- **D-T1.10（既有文件政策——评审 #2）**：**非大文件保留原地且为其主题的权威归所**——大文件块中已有同主题文件的**并入既有文件**（不建同名/同类兄弟文件）——仅 `pdf.test.mjs` → `pdf-parse.test.mjs` 是改名（D-T1.4）；新增域名不得与既有文件同主题（dispatch→并入既有 dispatch.test.mjs——不建 dispatch-domain；compaction→并入既有 session-compaction.test.mjs 域段或独立 compaction.test.mjs 仅当不重——按主题归属定）；
- **D-T1.11（T-T1.4 限定——评审 #3）**：文档引用**现行引用零残留**——历史 as-of 实现记录（✓ 已实现/cherry 记录）**豁免**（§18.11 D-BI6 先例——历史保留原文）——grep 过滤：仅查现行指令段（§12.1/§7.3/§18.7/§18.13 测试落点句——改新文件名）——as-of 记录标 "（as-of——实现时路径）" 不列入；
- **D-T1.12（D-T1.5 定稿——评审 #6）**：470-870 混杂带按测试名前缀三向（agent-core/agent-context/provider-stream）**为决策**（非建议）；D-T1.7 注：helper 抽取后的 `./helpers/*` 导入是**唯一预期导入变化**（D-T1.6 附带——其余 import 不变）。

**受影响文件（两端）**：CLI test/ 7 大文件拆 25 域 + 新 helpers/ 模块 + 新 fixtures/；VS Code test/ 3 大文件拆 12 域；文档引用修正（D-T1.8）；cross-repo-parity.test.mjs **不动**（D-T1.3）。

**测试（T-T1）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-T1.1 | N | 拆分后 `npm test`（快层） | 全绿（测试数不变——移动不重写——语义零改） |
| T-T1.2 | N | 各新文件行数 | ≤1500（硬限——域隔离） |
| T-T1.3 | N | prompts.test.mjs 存在 + 含 T-AR/T-SP/T-10.1 断言 | 在（断言落点迁移成功） |
| T-T1.4 | E | 文档引用 grep（T-* → 新文件名） | 零残留旧路径（D-T1.8 完成） |
| T-T1.5 | A | 孤儿体检查（完整块迁移） | node --check 全绿（无拆散——memory 教训） |

**验收（AC-T1）**：AC-T1.1 = T-T1.1 绿（全量——零语义破坏）；AC-T1.2 = T-T1.2 绿（≤1500）；AC-T1.3 = T-T1.3 绿（prompts.test.mjs 锚落地——今后锁根治）；AC-T1.4 = T-T1.4/5 绿（引用零残留/无孤儿）；AC-T1.5 = 双端同构（cross-repo-parity 绿——D-T1.3）。





## 19. subagent 工具面合并：单工具动作面（**六动作：spawn/check/status/escalate/cancel/panel——评审 #1：标题数随扩展刷新——2026-09-03**）（2026-09-03，用户裁定：工具会爆炸——靠参数做不同的事——escalate 并入 2026-09-03 二次裁定）

> **状态：已实现（2026-09-03 双端——§19 单工具五动作本体 + §19.5 控制面（实现记录见 19.5.4——CLI db408d2/b66831d + VS Code 70f3f8f 同规格镜像）+ §19.6 panel 六动作（19.6.5 记录）；设计批准沿革与处置注见 §19.5 状态行/19.5.4——标记刷新 2026-09-03（19.6.5 评审 #5 注承诺））**。触发：§18 后 async eng-coder 不阻塞主会话——但用户实测"主会话里查一下子代理状态就又挂住了"——根因 = `subagent_check` 是无条件阻塞工具（id 给定 → "Blocks until the target finishes"——查进度把并行主回合重新钉死）。用户裁定：① 工具面收敛——subagent 家族（subagent + subagent_check）合并成一个 `subagent` 工具靠 action 参数分流；② **独立动作**（status 非阻塞查询 = 独立 action——check/status 分离）；③ 接受破坏性迁移。eng-coder 是 subagent 的 role（非独立工具）——合并零影响。

### 19.1 需求

- F1：`subagent` 单工具——`action` 参数分流（spawn / check / status）——`subagent_check` 工具退役
- F2：`action:"status"` = **非阻塞状态查询**——立即返回（不消费报告、不等待）：指定 id 单查 / 省略 = 全部概览（running N / queued N（含 position）/ done 待取 N）
- F3：`action:"check"` = 既有 subagent_check 语义**原样保留**（arrival order / 指定 id 阻塞 / n 计数 / MAX_ASYNC_CHECKS / 消费后删除）

- F4：`action` 缺省 = "spawn"——既有 subagent 调用（无 action 参数）零迁移——所有既有 spawn 用例/提示词行为不变
- F5：eng-coder 覆盖不变（role 参数照旧——§18 协议零影响）
- F6：两端一致（CLI/VS Code 同构——含 subagent_check 退役同步）
- F7：**escalate（飞刀）并入**（用户 2026-09-03 裁定——工具面继续收敛）——`action:"escalate"` = 既有飞刀语义（consultModels 池选强模型 + WRITE 干活 + 术后报告——docs/design/ESCALATE.md 语义不变）——`escalate` 工具退役
- F8：**consult 家族维持独立**（用户裁定"会诊先独立"——多模型会话级生命周期与单 spawn 调用级不同——不并入——见 §19.3「范围 = subagent + escalate」决策行——round2 #6 指针修正）

### 19.2 设计

**D-M1 动作/参数矩阵**（单 schema——description 说明按 action 取参数）：

**action 级门控（评审 #1——dispatch 分类；§19.5 round2 #4 扩展）**：工具级 readonly 标志无法同时表达 spawn（副作用）与 check/status（只读）/cancel（控制）——dispatch Phase-1/Phase-2 按 **action 参数**分类：`check`/`status` 动作按 readonly 处理（planMode 放行、免权限审批、可批并行——继承 §15 D-A2 readonly:true 决策）；`cancel` 归**控制类豁免**（dispatch `isSubagentControlAction`——免权限审批（只停不启——无新副作用）、planMode 允许（取消既有子代理——spawn 仍拒）、批审批不入组、手动档 digest 内放行——见 §19.5 D-M6/19.5.2b）；`spawn` 动作按非只读处理（planMode deny、串行、门禁照常——§18 任务域授权仅涉 child 内部权限不涉 spawn 门禁）——实现点：dispatch 预审读 action 参数分支（受影响文件补 `src/agent/dispatch.mjs`）

| action | 参数 | 返回 | 阻塞 |
|---|---|---|---|

| spawn（缺省） | task/role/async/designToken/designId（既有全集）+ **files?/dependsOn?（§20——写域声明/显式依赖——仅 async 参与调度；sync 命中等待 → 明确错误）** | `{id, role, status:"running"/"queued", position?, waiting?, reason?}`——queued 等待态带 waiting（"waiting-deps"/"dependency-cancelled"）+ reason（**§20 D-SD3b——实现记录 20.5**） | 同步 role 等完成；async 立即返回 |
| check | id?（省 = 下一完成）/ n（必填） | 报告（arrival order/指定 id——消费） | **阻塞**（等目标 settle——显式取回语义） |
| status | id?（省 = 全部概览） | `{id, role, status:"running"/"queued"/"done", position?, done?, error?, ...}`——不消费（§19.5：running 带 model/elapsedSec/turn/maxTurns；queued 带 position——**§20：queued 等待态带 waiting/reason**——20.5） | **不阻塞**（立即） |
| escalate | task/model?（consultModels 池——"provider:model"——缺省池首） | 术后报告（专家实现完成——WRITE 干活） | 同步（等专家完成——既有语义） |
| panel（§19.6 新增——评审 #1 补行：view=readonly 类/freeze=控制类（门禁分类见 19.6.2——digest 放行/受限变体拒） | {view?, freeze?}（互斥——view 默认） | 镜像快照/冻结回收确认 | 同步（工具调用即返回——镜像/冻结动作即时完成） |
| cancel（§19.5 新增——评审 #1 拆行修正：原行与 panel 行融合损坏） | id（必填——防误全停） | `{id, status:"cancelled"}`/`{id, status:"cancelled", was:"queued"}`/`{id, status:"error", error}` | 立即（定向 abort——异步生效——同 §19.5.2b 行逐字） |

> **supersede 注（2026-09-03 §19.5 实现轮）**：本矩阵 action 面随 §19.5 控制面扩展为**五动作**——cancel 行的门禁分类（控制类豁免）、定向中止语义（cancelled settle/queued 出队/模型可见提醒）与 AC-M1 措辞见 §19.5（D-M6/19.5.2b）——§15 D-A2 先例：本段保留为 as-of 快照，实现以 §19.5 为准。——**域澄清（评审 #2）：AC-M1 五动作 = §19 cancel 批域验收——§19.6 加 panel 后工具面六动作（NF-P 口径）——域不同不冲突——2026-09-03**

**D-M2 status 形态**（§19.5 D-M5 修订：概览条目从 id 数组改**结构化对象数组**——`{ overview: { running: [{id, role, model, elapsedSec, turn, maxTurns}], queued: [{id, role, position}], done: [{id, role}] }, target?: {...} }`）——**事实源 = 池（_asyncSubagents）**（评审 #2——挂起期 settle 项已移 `_pendingAsyncResults`（§17 D-S3 ②——注入即消）——**不计入 done 待取**——done 条目附注"回合内 settle 未取——check 取回或 digest 消化"（**2026-09-04 round3 #3 修正——原"回合尾注入"已由 §17.5.2 supersede：挂起驱动下 done 留池→挂起会话 sweep→digest 消化——不经回合尾注入；无驱动调用方（headless/直连）保留 turn 尾直注入兜底——见 §17.5.2/§19.5.4——措辞对齐 §17——挂起期项由 digest 自动消化不经 check）；未知 id → `{status:"error", error:"unknown async subagent id"}`（与 check 同——T12 语义）。**免 n 计数**（status 是只读查询不消费——回合内自然限频——模型不会空转循环）。status 后接 check 无 n 冲突（status 不动 _asyncCheckLastN）。

**D-M4 escalate 并入（评审 2026-09-03 用户裁定）**：既有 escalate 执行逻辑（escalate.mjs——resolveChildProvider 选模型/createAgent coder role/runWithContinue/mergeChildMutations/术后报告）搬入 subagent 工具的 `action:"escalate"` 分支——保留全部既有约束：depth-0 only（depth>0 → error）、工程模式禁用（engineering → error——"实现走 eng-coder"）、consultModels 空 → error、模型选择校验、**relay 前缀 `escalate#N/` 保留**（action 名 escalate 与既有前缀同名——TUI 路由/subagent-blocks/tool-events **零改动**——区块显示/活动流不变）。`escalateTool` 退役（escalate.mjs 移除——setup.mjs 注册点删——subagent 工具常驻——escalate action 在 consultModels 空时返回 error——既有错误语义）。触发词条款（提示词——"用户说 飞刀/escalate → 调 subagent action:escalate"）随提示词迁移。**引用面**：174 处——~113 为 escalate.mjs 自身 + escalate.test.mjs（随迁移消解）；外部集成 = setup.mjs 注册（删）+ 提示词条款（改）+ 测试迁移（escalate.test.mjs 直接调 escalateTool → subagent action:"escalate"）——UI/事件/配置零改动。——**评审 #2 补：受影响清单加 docs/design/ESCALATE.md（supersede/指向编辑——工具面退役但机制文档更新调用路径为 action:"escalate"）+ TOOLS.md 工具注册表核验（escalate/subagent_check 名称残留——同批清）**

**D-M3 迁移（subagent_check 退役）**：17 处引用改——`subagent-async.mjs`（subagentCheckTool 定义 → 并入 subagentTool 的 check 动作——模块内合并）、`subagent.mjs`（工具描述重写——含 check 阻塞警告 + status 提示——"查进度用 status——check 会阻塞直到完成"——防 §19 触发场景重演）、`main.md`/`engineering.md` 等提示词引用（subagent_check 名称 → subagent action 语义）、测试（subagent_check 直接调用点 → action:"check"）。**挂住问题根治 = 描述层**：status 存在 + check 描述显式"阻塞"——模型查进度选 status。**受限变体 action 门控（round2 #3）**：§18 D-E3 的 eng-coder 受限 subagent 变体（explore-only + 同步）机械门控扩展——变体内仅 `action:"spawn"`（+ explore role + sync）放行——`escalate`/`check`/`status` 动作工具层拒绝（escalate 会内部 spawn coder+WRITE——违 explore-only 意图；check/status 在子代理上下文无意义——无 async 池）——补测试（镜像 T-E4/E5 的 action 维度）。**文件归属定句（评审 #3）**：`subagentCheckTool` 现定义于 `subagent-check.mjs`（退役——并入 subagent.mjs 的 check 动作）；`subagent-async.mjs` 保留 async 机制（settle/collect/审计任务书等）——迁移清单以此为准

**受影响文件（两端）**：`src/agent-tools/subagent-check.mjs`（退役——内容并入）、`src/agent-tools/escalate.mjs`（退役——escalate action 逻辑并入——2026-09-03 用户裁定）、`src/agent/setup.mjs`（escalateTool 注册删——subagent 常驻）、`src/agent-tools/subagent.mjs`/`subagent-async.mjs`（工具定义合并 + action 分流 + status/escalate 实现 + 描述重写）、`src/agent/dispatch.mjs`（action 级门控——readonly 分类按 action——round2 #2）、`src/prompts/main.md` + `src/prompts/engineering.md`（工具描述引用——byte-identical 两端）、AGENT-LOOP.md §15（D-A2 修订注——subagent_check → check 动作）+ §19 本节、两端测试（subagent.test.mjs——spawn 缺省零迁移回归 + check 迁移 + status 新用例）、VS Code ARCHITECTURE.md 引用段（实现时按其惯例落）、两端 CHANGELOG（父代理统一更新——评审 #5）

**测试（实现前展开为用例表——eng-coder 硬验收项）**：
- T-M1 spawn 缺省 action 行为不变（同步阻塞 / async 立即返回——既有用例零改全绿）
- T-M2 check 指定 id 阻塞取回（既有 subagent_check 用例迁移后全绿）
- T-M3 check 省略 id arrival order（迁移回归）
- T-M4 check n 计数/超限拒绝（迁移回归）
- T-M5 status 指定 running id → 立即返回 running（**不阻塞——主回合不挂**——§19 触发场景）
- T-M6 status 指定 queued id → 返回 position
- T-M7 status 指定 done 未取 id（**回合内 settle 场景**——挂起期 settle 项已移 pending 不在池）→ 返回 done + "未取"注记——**不消费**（随后 check 仍可取回——评审 #2 范围注）
- T-M8 status 省略 id → 全部概览（running/queued/done 三类）
- T-M9 status 未知 id → error（不消费）
- T-M10 status 后接 check——n 计数不受 status 影响
- T-M11 subagent_check 工具名消失（schema 无此工具——两端）
- T-M12 提示词内容断言：subagent 描述含 action/status/"check 会阻塞" 引导（两端 byte-identical）
- T-M13 §15/§17/§18 全回归（挂起/消化/内部协议——eng-coder role spawn 路径）
  - T-M14 escalate action 迁移回归（既有 escalate 测试——指定模型/默认池首/术后报告/merge 回传）
  - T-M15 escalate 保留约束（depth>0 拒/工程模式拒/consultModels 空拒——迁移回归）
  - T-M16 escalate relay 前缀 `escalate#N/` 不变（TUI 区块/活动流回归——route 零改动验证）
  - T-M17 **action 门控（round2 #2 + §19.5）**：planMode 下 status/check 放行（readonly 分类）vs spawn/escalate 拒绝（非只读分类）；**cancel 控制类豁免（19.5.2b round2 #4——planMode 放行/免审批/批审批不入组）**；混合 action 批次批审批按 action 分组（check/status/cancel 不入审批组）

**验收**：AC-M1 = 单工具**五动作** spawn/check/status/escalate/cancel（cancel 见 19.5——T-M1..M4 迁移回归 + T-M11 + T-M14..M16 + T-M20/M27——19.5.2b 修订注承诺同批落地）；AC-M2 = status 非阻塞（T-M5..M10——主会话查状态不挂）；AC-M3 = 描述引导防误用（T-M12）；AC-M4 = 两端全量绿（T-M13）；AC-M5 = escalate 并入零行为变化（T-M14..M16——飞刀语义/约束/区块前缀全保留——仅工具面收敛）

### 19.3 关键决策

- **单工具 action 分流而非多工具**（用户裁定——"工具会爆炸——靠参数做不同的事"）：subagent 家族同生命周期（spawn 产 id → check/status 消费/查询）——天然一体——硬拆（subagent_status 新工具）违背收敛方向
- **check/status 独立动作**（用户裁定——"独立动作会更好吧"）：语义分离——check = 显式取回（消费 + 可阻塞——取回本来就要等）；status = 只读查询（不消费不阻塞）——不合并成 wait 布尔（动作面清晰）
- **action 缺省 = spawn**：既有 spawn 调用面（提示词/流程/测试）零迁移——破坏面只限 subagent_check 调用点（17 处——一次性迁移）
- **范围 = subagent + escalate（2026-09-03 用户裁定扩展）**：escalate 与 subagent 同为调用级单 spawn 机制（当初收编共享 runChildPipeline）——并入为 action:"escalate"——约束/前缀/语义全保留——工具面 subagent/escalate → 单 subagent；**consult 维持独立**（用户裁定"会诊先独立"——多模型会话级生命周期——start/check 循环/stop/N child 一会话——与单 spawn 调用级不兼容——硬并参数爆炸——维持三个独立工具）
- **否决**：a) status 并入 check 加 wait:false（动作含混——check 的"消费/计数"语义与查询纠缠）；b) 新独立工具 subagent_status（工具面继续膨胀——违裁定方向）；c) 提示词层规避不改工具（用户问进度时模型无信息可答——根治需要 status）

### 19.4 非功能需求（round2 #8 补）

- N1：**描述预算**——五动作单工具描述在既有 schema description 预算内（工具描述重写后模型可解析——T-M12 断言 byte-identical + 内容锚）——**§20 扩展（2026-09-03）：spawn 调度参数 files/dependsOn 两可选参 + 描述调度段——预算复核随 §20 用例（T-M12 锚同 §19.6 NF-P 复核——20.5 交付面）**
- N2：**语义保证**——check 的消费/删除/n 计数与 status 的零消费/零计数完全隔离（T-M4/M10 断言——action 间不串扰）
- N3：**零改动面**——TUI/ACP relay 路由零改动（escalate# 前缀保留——T-M16 断言）；配置零改动（consultModels 语义照旧）
- N4：**两端一致**——subagent 工具 schema/描述与 prompts 两端 byte-identical（T-M12——既有 15 文件比对覆盖）——**指针（2026-09-04 §18.11）：15 文件比对断言已取消——见 §18.11——当前描述/提示词两端一致性 = 设计锚 + 评审/审计（不再 byte-identical 断言）**


### 19.5 控制面扩展：status 增强 + cancel + UI 停止 + 嵌套前缀子标（2026-09-03，用户裁定）

> **状态：设计批准（2026-09-03 round2 通过——0🔴——7 项 refinement 已处置——designToken 已签发）+ 已实现（2026-09-03 双端交付 + 重启重评审（token 54e3e5f5——处置 commit 1721d21）对齐轮——实现记录见 19.5.4）**。触发：用户实测控制面薄弱（"至少应该有列表，是不是还应该有其他的必要控制能力？比如中止？"）+ 嵌套 relay 前缀泄漏（"explore 子 agent 在 eng-coder 中显示不正常——出现了好多 explore#1/ 字样"）。用户裁定：① 主会话工具面补控制能力；② 界面上也应能停止（子 agent 标题行加停止）；③ 嵌套前缀显示形态 = 方案 A（块内子标）。

#### 19.5.1 需求

- F9：`status` 全览条目补**可决策字段**——`{id, role, model, elapsedSec, turn, maxTurns}`（决定中止谁时看得清——现状只有 id 数组）
- F10：**cancel 动作**——定向中止单个后台子代理——`action:"cancel"` + `id`（必填——防误全停——省略 id = error）——其余子代理/挂起会话不受影响
- F11：**UI 停止**——运行中子代理标题行停止控件（CLI 鼠标 + VS Code webview ⏹）——点击 = cancel 同语义（定向）
- F12：**嵌套 relay 前缀子标**（方案 A）——eng-coder 内 explore（§18 受限变体——同步 spawn）活动经双层前缀（`eng-coder#N/explore#M/`）到主会话——首段路由块 + 剩余段渲染为块内 dim 子标行（`explore#1 · read — …`）——前缀不再字面泄漏进内容
- F13：两端一致（CLI/VS Code 同构）

#### 19.5.2 设计

**D-M5 status 全览增强**：全览条目从 id 数组改结构化对象数组——`running: [{id, role, model, elapsedSec, turn, maxTurns}]`、`queued: [{id, role, position}]`、`done: [{id, role}]`——**数据装配锚点（round1 #3）**：spawn 时（subagent-async spawn 分支）记 `entry.model`（childProvider.model）与 `entry.startedAt`；turn/maxTurns 在**子代理 callbacks 包装层同步**（wrapChildCallbacks 内解析 ⟦ev⟧turn 更新 entry——或 spawnChild 提供 per-child turn 钩子——选改动最小方案——**round2 #4 裁定：wrapChildCallbacks 内解析 ⟦ev⟧turn 更新 entry（wrapper 侧——以 entry 自身 relayPrefix 定位）**）；`elapsedSec = (now - startedAt)/1000` 计算于 status 调用时——单查（id）形态不变 + 同字段。——**§20 扩展（2026-09-03——D-SD3b/实现记录 20.5）**：queued 条目（单查 + 概览）在等待态（依赖未满足/域冲突/依赖取消失败）下带 `waiting`（"waiting-deps"/"dependency-cancelled"）+ `reason`（冲突对象/依赖对象——F-SD4——模型可见排队原因）；纯槽满等位不带（position 已足够）。T-M6/T-M8/T-M18 断言形态随 §20 扩展（实现记录 20.5——用例表 T-SD7）。

**D-M6 cancel 动作**：`action:"cancel"` + `id`（必填）→ 定位池条目 → **定向 abort**（**条目级 AbortController（round2 #2 定稿）**：async spawn 时每条目建独立 controller（链到会话/回合 signal——consult `session.controllers` 为仓内先例）存条目——Ctrl+C 全停语义不变（session abort 逐链传播）——abort → 子代理 runAgent signal →）→ **cancelled settle（round1 #1 机制定稿）**：
- **条目标记**：cancel 时置 `entry.cancelled = true`（清池/注入判定依据）
- **settle 回调 cancelled 分支**（subagent-async.mjs settle 回调）：`entry.cancelled` → **不入 `_pendingAsyncResults`、不参与 collectSettledAsync 直注入**（清池规则同 Ctrl+C 全停但只清该条目——陈旧错误零注入）→ 发**停止冻结事件**（`⟦ev⟧stopped`——新相位——TUI routeSubToken 识别 → 区块以 interrupted 语义冻结——标题 "stopped"）→ digest 提示"已中止 explore#N/eng-coder#N（主会话决定）"（经 pending 提示行——非错误报告形态）
- **模型可见提醒（round2 #3）**：cancel 生效后注入短 user-role 提醒（形态仿 injectAsyncResult——XML 转义）：`[System reminder: subagent eng-coder#N cancelled by user — partial changes not merged/audited]`——cancelled settle 不入 pending/不直注入（无错误报告）但**取消事实与半成品警示对模型可见**（防基于半成品树继续——mergeChildMutations 不覆盖 abort 路径）——T-M19 断言补
- 未知/已完成 id → error（同 status/check 错误形态）；**只允许主会话（depth-0）**（子代理上下文无 cancel 意义——受限变体已禁）；cancel 后槽位腾出（maybeRefillAsync——queued 补位——既有机制）
- **queued 目标（round1 #2 定稿）**：id 命中 queued 条目（未启动无 controller）→ **出队移除 + position 释放（后续条目 position 前移）+ 返回确认**（`{id, status:"cancelled", was:"queued"}`——不 abort）
- **决策注（§19.5.5 D-CL3——2026-09-03）**：cancel = 最后手段——父侧核实纪律（personal:58——核实优先/最小干预/最后手段）——§18 交付协议下 partial 永不合并

**D-M7 UI 停止（两端）**：
- CLI：运行中区块折叠头右侧停止标记（`⏹`——dim——仅 running 态显示——done/冻结后消失）——复用既有鼠标管线（mouse.mjs SGR 点击 + handleMouseClick）——点击命中区 = 标题行右缘（宽度 = ⏹ 标记列）→ cancel（定向该子代理——经 TUI 层调用池 abort——与 D-M6 同实现路径——不经过模型回合）——**用户点击是即时动作不依赖模型**（关键属性：失控子代理时模型可能不可靠——UI 停止必须不经模型）
- VS Code：webview 子块标题行 ⏹ 按钮（DOM click → postMessage cancel → extension 层定向 abort——同样不经模型）
- 与 Ctrl+C 的关系：UI 停止 = 单子代理定向；Ctrl+C = 既有全停（挂起两级——round2 #4）——并存

**D-M7b async 标记 + sync/async 显式标识 + ⏹ 门控（2026-09-03 用户裁定——实现后补充）**：**① 事件通道**：async spawn 分支（makeRelay 后）emit `⟦ev⟧async\x1e` 事件 token（与 ⟦ev⟧turn 同族——sync 不发）→ routeSubToken 解析设 `sub.async = true`（makeRelay emit 在**实际启动时**（评审 #4——slot-queued/waiting-deps spawn 无 relay 流——spawn 返回前 emit 会在块存在前丢——排队条目启动时 emit → waiting 块已在（D-SD3b）→ sub.async 设置成功——routeSubToken 对缺失 key 的 async 事件缓冲 pending 标志（兜底）——补 queued→running ⏹ 可见性测试）。**② 标题行显式标识（用户裁定 B 形态——sync/async 都标）**：`[▶ eng-coder#2 · async · glm-5.3 · running …]` / `[▶ explore#1 · sync · glm-5.3 · …]`——`async`/`sync` 文字（dim 色——与模型名并列——running 态显示）——不靠"没标推断"。**③ ⏹ 门控**：⏹ 只对 async 区块（running && SUBAGENT_ROLES && sub.async——sync 区块无 ⏹——杜绝"可见但不可中止"误导——id:9 交付曾以"可操作指引"过渡）。渲染纯读 state ✓（纯函数设计不破坏）。测试：async 区块 async 标识 + ⏹ 显示可中止；sync 区块 sync 标识 + 无 ⏹；async 事件解析。

**D-M8 嵌套 relay 前缀子标（方案 A）**：`parseRelayPath(text)` 通用解析——`eng-coder#N/explore#M/read` → 首段（块路由——现状逻辑零改——兼容单层）+ 剩余段渲染规则：
- 文本行（onToken）：内层段前缀（如 `explore#1/`）替换为块内行首 dim 子标 `explore#1 · `（内容跟随）
- 工具行（onToolCall）：`explore#1/read` → 行首子标 + 工具名（dim `explore#1 · ` + 既有工具行形态）
- 工具输出：跟随最近子标归属（不重复前缀——输出行接在对应工具行后——现状块内顺序天然如此）
- 任意嵌套深度通用（未来子代理内子代理不限一层——循环解析）
- **嵌套事件类 token 处置（round1 #4 + round2 #6）**：双层前缀的 `⟦ev⟧turn`/`⟦ev⟧done`/`⟦ev⟧settled`/`[model]` 等事件类 token——**剥除不路由**（不更新外层块头 turn/maxTurns——防 explore 进度污染 eng-coder 块头——eng-coder 自身的单层 ⟦ev⟧turn 照常）；reasoning（think）token 走子标渲染（同文本行规则——dim `explore#1 · ` 后接思考行）；**ACP 桥剥除正则扩展多段**（bridge.mjs D7 剥除——`(?:[\w-]+#\d+/)+⟦ev⟧`——防双段事件漏过桥进 ACP 客户端流——违 D7 不变式——acp.test.mjs 补嵌套前缀用例）
- VS Code 同构（webview 子块行渲染——子标 span）
- explore 是**同步** spawn（§18 受限变体）——无独立生命周期事件（settle/done 不到主会话——在 eng-coder 回合内跑完）——**无需嵌套块状态管理**（复杂度关键洞察——只处理活动行带子标）

**受影响文件（两端）**：subagent 工具（status 字段 + cancel action——subagent-async.mjs/子模块）、池条目字段（startedAt/turn/model 记录）、TUI（subagent-panel/subagent-blocks 标题行 ⏹ + handleMouseClick 命中区 + parseRelayPath 子标渲染）、VS Code webview（panels/chat 标题行 ⏹ + 子标 span + cancel 消息路由）、extension 层 cancel 接线、测试、AGENT-LOOP §19.5 本节、**docs/design/TUI.md（round2 #5——模块地图 subagent-blocks/agent-turn 行 + 面板/区块描述段——⏹ 控件/⟦ev⟧stopped/子标渲染——§7.2.1 评审 #4 先例——doc 断言随 T-M25）**、CHANGELOG（父代理统一）

**测试（实现前展开——eng-coder 硬验收项）**：
- T-M18 status 全览含 role/model/elapsedSec/turn/maxTurns（running 条目）
- T-M19 cancel 定向中止（目标 interrupted settle——无陈旧注入——其余子代理继续跑——区块 stopped）
- T-M20 cancel 未知 id / 已完成 id → error；省略 id → error（防误全停）
- T-M21 cancel 后槽位补位（queued 自动启动——既有 maybeRefillAsync 回归）
- T-M22 UI 停止：CLI 鼠标点击标题行 ⏹ 区 → 定向 abort（不经模型——mock 验证直连路径）；VS Code webview ⏹ 点击 → cancel 消息
- T-M23 UI ⏹ 仅 running 显示（done/冻结后消失）
- T-M24 嵌套前缀解析：`eng-coder#2/explore#1/read` → 块路由 eng-coder#2 + 子标 explore#1（单层兼容回归——无嵌套前缀时零变化）
- T-M25 嵌套文本/工具/输出三形态子标渲染（CLI + VS Code 断言）
- T-M26 §15/§17/§19 全回归
  - T-M27 queued 取消（round2 #1）：入队 2 项后取消队首 → 返回 `{status:"cancelled", was:"queued"}`——后续项 position 前移——running 槽不受影响——无 abort 发生（AC-M7 同步含 T-M27）

**验收**：AC-M6 = status 可决策字段（T-M18）；AC-M7 = cancel 定向中止语义（T-M19..M21）；AC-M8 = UI 停止不经模型（T-M22/M23）；AC-M9 = 嵌套前缀无泄漏 + 子标渲染（T-M24/M25）；AC-M10 = 两端全量绿（T-M26）

#### 19.5.2b §19 修订注（round1 #5）

§19 批准后控制面扩展使工具面为**五动作**：D-M1 动作矩阵补 `cancel` 行（`| cancel | id（必填——防误全停） | {id, status:"cancelled"/"error"} | 立即（定向 abort——异步生效） |`）；AC-M1 措辞改"单工具五动作 spawn/check/status/escalate/cancel（cancel 见 19.5）"——实现时同批修订 §19 对应行并加 supersede 注（§15 D-A2 先例）。**cancel 门禁分类（round2 #4 定稿）**：cancel 归**控制类豁免**（仿 check `readonly: true` 先例——§15 D-A2:532——dispatch 层面按控制动作处理：**免权限审批（只停不启——无新副作用）**、planMode **允许**（取消既有子代理——spawn 仍拒）、批审批分组不入组；手动档 digest 内 cancel 放行（19.5.3 动作域）与该分类一致——无 permission handler 也不拒（控制类豁免）——补 digest 内 cancel 放行用例

#### 19.5.3 关键决策

- **UI 停止不经模型**（关键属性）：失控子代理时模型可能不可靠/回合已结束——UI 停止直连 TUI/extension 层 abort 路径（不经模型回合）——与工具 cancel（模型可用时）并存
- **cancel 单 id 必填**：防误全停（明确目标）——全停仍走 Ctrl+C（既有）——不加 cancel-all（模型循环逐 id 明确性优先）
- **嵌套前缀子标而非块中块**（方案 A——用户确认）：explore 同步 spawn 无生命周期——纯活动行——子标（dim 行首标记）足够归属可辨——块中块（D 方案）为无生命周期实体建层级 UI 过度
- **动作域（round1 #6）**：cancel/status 在手动档 auto-turn（digest）动作域内**放行**（控制类动作——同 task/checklist 自省类——D-S7 分类补 cancel/status——digest 期间模型可中止失控子代理）；UI ⏹ 命中区与折叠头点击**列级区分**（⏹ 区点击 = cancel——不触发折叠翻转——T-M22 断言）
- **否决**：a) pause/resume（子代理独立回合进程——真暂停需冻结/解冻上下文——复杂易错——cancel + 同 token 重 spawn（§2.8）覆盖）；b) cancel-all 参数（误触风险——Ctrl+C 已覆盖）；c) 嵌套块中块（过度——见上）；d) 剥掉内层前缀（行不可辨——explore 审计过程与 eng-coder 自身活动混淆）

#### 19.5.4 实现记录（2026-09-03——双端交付 + 重启重评审处置对齐轮）

**交付轮**：CLI db408d2（§19.5 控制面本体——T-M18..M27）+ b66831d（D-M7b async 标记/头标/⏹ 门控）+ aeff441（§19.6 panel 以其为基座）；VS Code 70f3f8f 同规格镜像 + 审计/评审修正轮（记录于本仓库 ARCHITECTURE.md §19.5 引用段——结构差异同载）。**本段 = 重启重评审（token 54e3e5f5——处置 commit 1721d21）后的对齐 + 补漏轮**（§19.6.5 评审 #5 注承诺的 §19/§19.5 状态标记刷新随本段落地）。

**落点（符号锚——CLI）**：
1. **status 可决策字段**（F9/D-M5）：spawn 时记 `entry.model`（`subagent.mjs` async 分支装配）；`startedAt` 记于 **entry.start() = 实际启动时刻**（queued 等待不计 elapsed）；turn/maxTurns 在 callbacks 包装层解析 ⟦ev⟧turn 镜像（`subagent.mjs` trackOpts.onToken——以 entry 自身 relay 流为界——round2 #4 裁定）；elapsedSec 计算于 status 调用时（`subagent-async.mjs` statusFields/executeStatusAction——单查 + overview {running/queued/done} 结构化对象数组——T-M18/M8）
2. **cancel 动作**（F10/D-M6）：`subagent-async.mjs` cancelAsyncSubagent——工具路径（executeCancelAction——depth-0 only + id 必填）与 TUI ⏹（`mouse.mjs` createMouseDispatch cancelSubagent——key 尾段取 id）共用核心；running 目标条目级 controller abort（`subagent.mjs` async 分支 entry.controller——链 `_sessionSignal ?? ctx.signal`——Ctrl+C 全停逐链传播语义不变）→ settle finally **cancelled 分支**（不入 `_pendingAsyncResults`/不参与 collect 直注入 + ⟦ev⟧stopped 冻结 + user-role 提醒 XML 转义——round2 #3）；queued 目标出队 + position 前移 + `was:"queued"` 确认（T-M27）；未知/已完成/省略 id → error（T-M20）；cancel 后 maybeRefillAsync 补位（T-M21）
3. **UI ⏹**（F11/D-M7/D-M7b）：CLI 面板折叠头右缘 ⏹（`subagent-panel.mjs` renderSubagentPanel——_stopSub/_stopCol 元数据——glyph 内收一列——code review 🟡#1）+ 列级点击命中（`mouse.mjs` handleMouseClick——⏹ 区 cancel 不触发折叠翻转——T-M22）；**门控 = running && SUBAGENT_ROLES && sub.async**（sync 区块无 ⏹——D-M7b ③——T-M23/mouse D-M7b ③ 回归）；头标 sync/async 显式文字（dim——与模型名并列——渲染端 subagent-panel.mjs/render-segments.mjs——B 形态——冻结后保留）
4. **⟦ev⟧async 标记**（D-M7b ① + 处置 #4）：`subagent.mjs` entry.start() 发射（**实际启动时**——queued 入队不 paint 不发——补位启动先发 async 后发 [model]——sync 不发）；`subagent-blocks.mjs` routeSubToken 解析设 `sub.async`；**缺失 key 缓冲 pending 标志（处置 #4 兜底——本对齐轮补——CLI）：async 事件在块创建（ensureSubTaskKey）之前到达 → 缓冲 state._pendingAsyncKeys → 块创建时应用——async 事件先于块存在到达不丢——queued→running ⏹ 可见性保真**（补测试：subagent-blocks 数据层缓冲用例 + tui.test 面板层 queued→running ⏹ 可见性用例）
5. **嵌套前缀子标**（F12/D-M8）：`subagent-blocks.mjs` parseRelayPath 循环解析（任意深度）——首段路由 + 剩余段行首 dim 子标（sublabelLine + `subagent-panel.mjs` styleSubLabelRow）——内层 ⟦ev⟧/[model] 剥除不路由（防 explore 进度污染 eng-coder 块头）；ACP 桥剥除正则扩展多段（`acp/bridge.mjs`——acp.test.mjs 嵌套前缀用例）
6. **门禁分类**（19.5.2b round2 #4）：`agent/dispatch.mjs` isSubagentControlAction（cancel + panel freeze）——planMode 放行/免权限审批/批审批不入组/无 handler 不拒；手动档 digest 内放行（subagent.mjs cancel/panel 动作分支 + 测试）；受限变体 spawn-only（subagent.mjs execute 分流——depth>0 eng-coder 上下文拒绝非 spawn 动作）

**VS Code 结构差异**（ARCHITECTURE.md §19.5 引用段）：CLI 的文本事件通道（⟦ev⟧async/turn/stopped + routeSubToken）→ 本端 `callbacks.onSubagent` 消息族（started **带 `pool:true`** = ⏹ 门控源——恒于 entry.start 实际启动时发——同步 spawn 的 started 无 pool 标记——审计 F1）+ onAgentTurn 钩子同步 entry.turn + cancelled 冻结相位（webview stopped）；嵌套子标经 chunk.sub 透传（toolPanelPayload 白名单——`String.prototype.sub` 陷阱规避）。

**偏差落文**：
- **处置 #4（⟦ev⟧async 发射点）**：CLI/VS Code 早期交付已按"实际启动"实现（entry.start——评审前设计文本写"makeRelay 后 spawn 返回前"——代码先于文档修订）；本对齐轮补的是文档措辞（1721d21 D-M7b 修订）与实现的**缓冲兜底 + queued→running ⏹ 可见性测试**（CLI routeSubToken pending 缓冲 + tui 面板层测试；VS Code T-M21 补 started+pool 断言——started 恒由事件创建块——无缺失 key 窗口——pending 缓冲无对应物——语义等价注释落测试）
- **§19.5 早交付未落实现记录**（状态行滞留"设计批准"）——19.5.4 本段补记 + §19 状态行刷新（19.6.5 评审 #5 承诺）
- 行数债：CLI subagent-async 656/subagent-blocks 577/subagent.mjs 531——本批零增长或微小——并入拆分轮（docs/TODO.md）；VS Code subagent.mjs 465/subagent-async 529/subagent-escalate 189（超过 500 硬顶的拆分候选——tool-events 先例——2026-09-03 实测行数）

**测试**：CLI T-M18..M27（test/subagent.test.mjs + subagent-blocks.test.mjs + mouse.test.mjs + tui.test.mjs + agent-turn.test.mjs + acp.test.mjs/spawn-child.test.mjs 扩展——N/E/A 展开随交付）；VS Code T-M18..M27（test/subagent.test.mjs + ui.test.mjs + chat-panel.test.mjs）。**全量（2026-09-03 对齐轮后）**：CLI `npm test` 1224/0 全绿（45 slow 豁免）；VS Code `npm test` 1006/0 全绿。

**验收勾销**：AC-M6 = status 可决策字段（T-M18）；AC-M7 = cancel 定向中止（T-M19..M21/M27）；AC-M8 = UI 停止不经模型（T-M22/M23）；AC-M9 = 嵌套前缀无泄漏 + 子标渲染（T-M24/M25）；AC-M10 = 两端全量绿（T-M26——§15/§17/§19 回归随双端全量）





#### 19.5.5 cancel 核实纪律增强（2026-09-03 · 设计——用户批评确立——**已实现**）

> 状态：设计批准 + 已实现（2026-09-03——评审 0🔴 通过（token 00fde4f4）——id:4 交付 clean（audit 1 轮 + advisor 1 轮 0🔴——CLI 1299/0 + VS Code 1020/0）——commit 2ee884f/d6cd34f——本段勾销）

### 19.5.5.1 需求

**总体需求**：cancel 子代理的**判断纪律**机制化——不只靠父代理记忆——模型在调用 cancel 动作那一刻看到条款（工具描述）+ 工程模式提示词句（eng-coder 管理场景）——防随意杀（核实优先/最小干预/最后手段）。

**功能性需求**：
- F-CL1：subagent 工具 cancel 动作描述补判断纪律尾句（逐字英文锚——双端 byte-identical）
- F-CL2：engineering.md Multi-Task Parallelism 段补 cancel 纪律一句（逐字锚——工程模式 eng-coder 管理主场景）
- F-CL3：AGENT-LOOP §19.5 D-M6 cancel 语义补决策注（cancel = 最后手段——§18 交付协议代价）

**非功能性需求**：描述预算（cancel 动作描述 +1-2 句内——不喧宾夺主）；措辞与既有描述风格一致（英文——机制陈述 + 判断引导）。

### 19.5.5.2 设计

- **D-CL1 镜像锚（subagent.mjs cancel 动作描述尾句追加——逐字定稿——双端照抄）**：
  > "Use it when a background child is going the wrong way (e.g. burning turns) and you must stop it before its report arrives. **Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first; prefer scoped recovery (restore a single affected file) over killing the child — a running child's in-flight work dies with it, partial changes stay unmerged and unaudited.**"
- **D-CL2 镜像锚（engineering.md Multi-Task Parallelism 段尾句追加——逐字定稿——评审 #3：与 §20.7 D-PS2 同段——实现时锚 post-D-PS2 文本——两节互指——不先于 §20.7 落）**：
  > "Cancelling a running eng-coder is a last resort — its in-flight delivery dies unmerged and unaudited; verify the alarm with reliable checks and prefer scoped recovery first."
- **D-CL3 AGENT-LOOP 注**：§19.5 D-M6（cancel 语义）行补决策注（"cancel = 最后手段——父侧核实纪律（personal:58——核实优先/最小干预/最后手段）——§18 交付协议下 partial 永不合并"）
- **D-CL4 测试**：T-CL1 内容断言（subagent.mjs 描述含 "last resort" + "verify alarming signals"——fail-when-unchanged——双端）；T-CL2（engineering.md 含 "Cancelling a running eng-coder is a last resort"——双端）；既有 T-M12（subagent 描述内容锚）若断言全文则同步
- **D-CL5 验收**：双端 byte-identical——内容断言绿——既有全量回归绿（描述变化影响 T-M12 式锚断言——核实现有断言再落）

### 19.5.5.3 受影响文件

- CLI + VS Code：`src/agent-tools/subagent.mjs`（cancel 描述——schema 区）+ `src/prompts/engineering.md`（尾句）+ 测试（subagent 描述内容锚断言所在——核实现有）+ AGENT-LOOP.md（本段 + §19.5 D-M6 注）


#### 17.5.4 round1 评审处置（2026-09-03——0🔴 通过——6 项）

1. VS Code 受影响面已补（上表——N5 两端一致）
2. 无驱动调用方兜底已补（collectSettledAsync 保留直注入——标志/检测）
3. 修订注范围已扩（D-S8/§17.3/§15.4 T5+AC3——AC-H4 文档落地验收）
4. 行号锚 → 符号（collectSettledAsync/sweepSettledToPending/digestTurn 函数锚——确需行号标 as-of）
5. 受影响文件逐文件具体化（上表——渲染零改动结论句）
6. 状态行文案区分（🔵——"N 完成待消化"与"N 运行中"——实现时顺手对齐——不阻塞）

#### 17.5.5 实测修订：digest 完成即逐条冻结回收（2026-09-03——用户实测——"eng-coder#9 完成且已消化仍挂面板"）

**实测**：async 子代理在挂起期 settle → settled 分支（驻留面板 awaitingDigest）→ digest 消化完成（报告已进上下文）——但**块冻结回收与池空耦合**（freeze-out 在池空才补发）——同池其他子代理（id:8）仍在跑 → 已消化块滞留面板——状态滞后（显示 awaiting digestion 但已消化完）。

**修订（补 17.5.2）**：digest 消化完成（pending 条目注入后）→ **逐条补发 done 冻结回收**（不等池空——块从面板移除进流——**位置 = settle 锚点（splice 落位——digest 总览文本之前——同 §7.2 D4 修复轮/D-S8 锚点语义——评审 round1 #1 裁定**）——池空 freeze-out 仅兜底未消化残项（挂起会话结束统一清场）——**块回收与池空解耦**。

**受影响测试补充**：T-H7 = 池内其他子代理运行中——某 settled 条目被 digest 消化 → 该块立即冻结回收（面板仅剩仍 running 的——**冻结块 splice 落 settle 锚点——digest 总览文本之前——T-S6/T-S14 位置断言同口径**）——T-H5 回归不变。

**验收补充**：AC-H5 = 消化完成块不滞留面板（T-H7——不等池空）——（AC-H4 已被 17.5.4 #3 占用——doc-landing——17.5.5 改用 AC-H5——round1 #3 评审）


#### 7.2.3.4 round1 评审处置（2026-09-03——0🔴 通过——8 项（7 advisory + CHANGELOG 记录））

1. 错误/拒绝路径不冻结（7.2.3.2 第 6 点——execute 抛错/拒绝走工具错误块——不触发启发式——T-F5 扩）
2. escalate 同享 subKey（第 7 点——§19 合并后同管线）
3. T-F 用例表实现前展开（§15.4 式 N/E/A——eng-coder 验收随交付）
4. 行号锚 → 符号（finishSubTask + as-of 注）
5. §17.5 标题同步"已批准"（17.5.4 已在——标题残留修）
6. VS Code 声明（CLI-only——webview 键匹配无启发式——不需同步改）
7. 本节状态同步"设计批准"（即本段——token 已签发——实现排队）
8. CHANGELOG 记录（round2 #6——本节 CLI 行为变更（面板回收时序）——父代理统一批记录——§19 sweep 惯例——§17.5 同）


#### 19.5.6 status 条目补 touched files 摘要（2026-09-04 · 用户拍板立项——来源：9-03 cancel 核实纪律第 5 点·机制化）

> 状态：**已实现（2026-09-04——用户"A"立项——round1 评审输出超限不可恢复；round2/round3 复审 0🔴 通过（token 8578c8cc/designId 590b873e——6🟡+3🔵 建议项——用户裁决"批准"（B）——实现批 task 条款：#1/#2/#9 设计细化已落（D-SF1/D-SF2/T-SF2a/b/done 明示）——实现：CLI id:7（clean——审计 1× LOW（文档文件表误归——父侧已修）+ advisor 首审 0🔴（4 项——#2 工具描述补新字段已修/#4 T-SF5 时序 600→1500ms 已修）+ 复评 0🔴——L1 1353 tests/1305 pass/0 fail——subagent.test.mjs 77 pass/0 fail/1 slow skip——T-SF1..5 六用例全绿）+ VS Code id:8（同批镜像——父侧核销合并）——父侧 L2 核销待 id:8 交付后）。**实现记录（2026-09-04）**：CLI `subagent.mjs`（entry.start() 绑 childAgent 对象引用——D-SF1）+ `subagent-async.mjs`（touchedSummary/shortTouchedPath/statusFields）——超清单：subagent.mjs（设计文件表误归——绑定点物理归属——实现按 D-SF1 正确执行——父侧已修文件表）/T-M8 deepEqual 更新（新字段追加）——行数债：subagent-async 984/subagent.mjs 699（>500 硬限——TODO 拆分轮已登记）。**触发：**今天 §18.12（verify 修复）复用 `_touchedFiles` per-run 记账——证明该数据源已存在且记账成本为零——status 摘要时机变好（零新增采集）——补上"杀前看得见代价"的机制化缺口。

**需求层**：
- **F-SF1（看得见代价）**：作为用户，我希望 `subagent status` **running** 条目带 **touched files 摘要**——杀子代理前看得见它改了哪些文件（代价可见）——机制化防随意杀（纪律第 1-4 点已靠提示词+记忆——本点补机制；queued 未启动——无 touched 信息——见 N-SF2）。
- **总体目标（round3 #8 补）**：把“杀子代理前看得见代价”从提示词纪律升为工具机制——status 一个字段——零新增采集——让 cancel 决策有据可依。
- **F-SF2（复用记账）**：不新增采集——**直接复用 `agent._touchedFiles`**（per-run 记账——§18.12 已确认——顶层+子代理均记账——绝对路径）。
- **N-SF1（摘要限长）**：条目不刷屏——摘要 = 前 5 个文件路径（**相对查询方（父代理）cwd** 缩短；cwd 之外路径保留绝对形态 + "../" 前缀）+ "… N more"（超出截断）——路径过长（>80 字符）截尾。
- **N-SF2（零破坏）**：status 条目既有字段（id/role/model/elapsedSec/turn/maxTurns）不变——新字段追加；queued 条目无 touched 信息（未启动）——显示 "touched: —（未启动）" 或省略。

**设计层**：
- **D-SF1（装配点——round3 #1 定死——2026-09-04 id:7/8 实现补注）**：subagent-async.mjs **status 分支条目标装配点**（spawn 时记 entry.model/startedAt 处——§19.5.2 D-M5 锚点）——**绑定时刻 = `entry.start()`/首拍 `onAgentTurn`（实际启动时——queued 条目 spawn-ack 时刻尚无子代理对象——§20 D-SD3b——须在 start 时绑；VS Code 端对象在 runAgent setup 内异步创建——绑定锚点 = 首拍 onAgentTurn（最早存在时刻——架构约束——语义等价——已实现注释披露））**；**绑定对象 = `entry.childAgent`（子代理**对象**引用——不是 `_touchedFiles` 数组引用——per-run 状态在 prepareRun 重置（§2）——数组引用会陈旧——对象引用才能保证“运行期实时读——杀前一刻最新”）**——status 查询时实时读 `childAgent._touchedFiles`（绝对路径）——queued 条目无对象 → 占位（T-SF2）。**（round3 #1 处置——§19.5.6 评审建议——实现批 task 条款）**
- **D-SF2（摘要形态——2026-09-04 id:7/8 统一修正——CLI 参考语义为准）**：**占位形态（无改动/queued）**：`touched: "—（尚无改动）"`（running 0 改动）/ `touched: "—（未启动）"`（queued——T-SF2a/2b）；**摘要形态（有改动）**：`touchedFiles: [f1..f5]`（相对路径 + 截断 + 限长——N-SF1）+ `touchedMore: N`（仅 >5 时出现——独立字段——不混入数组）——**done/error/取消条目：本批不含 touched 字段**（round3 #9——AC-SF3 既有字段断言覆盖）——本批只做 running/queued——**（端际统一：CLI 与 VS Code 同形态——原设计 D-SF2 数组写法 vs T-SF2 占位文案矛盾——实现批分叉后统一——以本节为准）**。
- **D-SF3（两端）**：CLI subagent-async.mjs status 分支 + VS Code 对应（subagent-async.mjs 同构——§15.6 两端对齐——byte-identical 已取消——各自实现同语义——语义锚（cross-repo-parity 精神））。
- **D-SF4（不动）**：cancel 动作本体/核实纪律提示词（19.5.5 已落——不改）——本批仅 status 字段。

**受影响文件（两端）**：
- CLI `src/agent-tools/subagent.mjs`（**entry.start() 绑 childAgent 对象引用——D-SF1——物理归属本文件**——statusFields 装配）+ `src/agent-tools/subagent-async.mjs`（status 摘要渲染 + touchedSummary/shortTouchedPath——**实现记录修正 2026-09-04（id:7 交付——设计轮文件表误归——绑定点在 subagent.mjs——实现按 D-SF1 正确执行）**）；
- VS Code `src/agent-tools/subagent.mjs`（onAgentTurn 绑定 + 工具描述——id:8 实现——**首拍 onAgentTurn 锚点注**）+ `src/agent-tools/subagent-async.mjs`（status 摘要字段/函数——同构）+ `src/agent/setup.mjs`（**stateSink.agent 对象引用——id:8 超清单——机制必需——子代理对象异步创建——唯一透明通道**——设计表补登）；
- 两端测试（status 条目断言——T-SF1/2）——落点：`test/subagent.test.mjs` 或既有 status 断言文件（核对）——**实现已落 test/subagent.test.mjs（T-SF1..5 六用例——77 pass/0 fail）**；
- 文档：AGENT-LOOP.md（§19.5.6 本节）、TODO:356 勾销指向。

**测试（T-SF——eng-coder 展开 N/E）**：
| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-SF1 | N | 子代理在跑（已触文件）→ status | running 条目含 touchedFiles 摘要（相对路径 + 前 5 + 截断注） |
| T-SF2a | N | 子代理 running 但 0 改动 | 条目带 "touched: —（尚无改动）"（区分占位——round3 #2） |
| T-SF2b | N | 子代理 queued（未启动） | 条目带 "touched: —（未启动）"——不崩（确定性占位） |
| T-SF3 | E | touchedFiles >5 | 限长（前 5 + "… N more"）——N-SF1 |
| T-SF4 | E | 路径 >80 字符 | 截尾——不超行 |

**验收（AC-SF）**：AC-SF1 = T-SF1/2 绿（运行条目含摘要——未启动不崩）；AC-SF2 = T-SF3/4 绿（限长/截断——N-SF1）；AC-SF3 = 既有 status 字段零破坏（既有断言绿）；AC-SF4 = 双端同语义（T-SF4 语义断言——cross-repo 精神）。

### 19.6 subagent panel 检查工具（2026-09-03 · 设计——用户裁定：视图 + 干预——**已批准**）

> 状态：**已实现（2026-09-03 交付——CLI 1268/0——AC-P1..P4 勾销——实现记录见 19.6.5——评审 #5 注：基于 §19 action-dispatch 门控基础实现——§19/§19.5 状态标记滞后（实现已含其基础面——标记后续刷新））**

#### 19.6.1 需求

- F-P1：模型可查**面板视图**（TUI 运行面板正在显示的区块——与用户所见一致）
- F-P2：模型可对**异常驻留块**（digest 已完成仍驻留 awaitingDigest）触发**补发冻结回收**
- F-P3：headless/无面板会话降级（池视图）

#### 19.6.2 设计（D-P1..P4）

**D-P1 面板镜像**：TUI 装配处（index.mjs state._agent = agent——state 挂 agent 引用）→ subagent-blocks 的 state.subTasks 变更点（ensureSubTaskKey/冻结家族/删除/routeSub*）同步写 agent._panelSnapshot（区块数组快照：{key, role, status: running|done|awaitingDigest, startedAt（读时算 elapsedSec——round1 #4）}——**§20 扩展（2026-09-03）：waiting/等位块以 queued 态入镜——syncPanelSnapshot 状态三分扩为 running|queued|done|awaitingDigest（20.5 落点 2——面板视图与所见一致 + freeze 门控读此态）**）——状态变更即刷新——O(n) 小）——agent 层工具可读。

**D-P2 subagent action:"panel"**（subagent.mjs——readonly 面）：
- 参数 {view?: bool（默认 true——返回镜像区块列表）, freeze?: key}——单动作双参（互斥——freeze 优先）
- view 返回：_panelSnapshot——**awaitingDigest 条目交叉 _pendingAsyncResults 标注 digested（agent 侧读时增强——round1 #3）**——无镜像（headless/VS Code——round1 #1：VS Code webview 无 state.subTasks 对应物——恒降级池视图 + no panel——CLI-only 完整能力——7.2.3.2 #8 先例）
- freeze:key → 门控（D-P3）通过 → 发 key + "/" + 哨兵 done token（onToken——settle 同机制字面格式——TUI routeSubToken 冻结回收）——**落位：复用既有 sub._freezeAt（若仍在——settle 锚点 splice）——否则 §17.5.5 同口径尾推兜底并注明（round1 #2）**

**D-P3 冻结门控（安全）**：仅允许冻结 awaitingDigest 且池无对应运行条目（= 已消化驻留块——pending 已消费——状态滞后）——pending 仍有对应（报告未达模型）拒绝（提前回收破坏消化顺序）——不存在的 key/仍 running 的块拒绝——错误信息明确

**D-P4 语义定位**：这是 §17.5.5（digest 完成逐条冻结）的**工具面冗余通道**——代码修复后异常驻留自然消失——panel 工具是诊断 + 兜底干预（模型解释怪相 + 修旧会话残留）——不替代机制修复

**受影响文件（round1 #5 补）**：src/agent-tools/subagent.mjs（panel action + 门禁分类——view/freeze 归只读/控制类——planMode/审批/受限变体（eng-coder 内拒绝）/digest 动作域四表扩展）、src/agent/dispatch.mjs（分类接线）、src/tui/index.mjs（state._agent 挂载）、src/tui/subagent-blocks.mjs（镜像写入点）、测试（subagent 工具 panel 用例 + 镜像同步用例——headless 降级/门控拒绝/成功冻结）

#### 19.6.3 测试（硬验收）

- T-P1：面板 2 块（1 running + 1 awaitingDigest 已消化）——view 返回镜像（状态准确）
- T-P2：freeze 已消化驻留块 → done token 发出 → 块冻结回收（mock TUI 断言）
- T-P3：freeze pending 有对应的块 → 拒绝（不破坏消化顺序）
- T-P4：freeze running 块 → 拒绝
- T-P5：headless（无镜像）→ view 降级池视图——freeze 报不可用
- T-P6：镜像同步（state.subTasks 变更 → _panelSnapshot 刷新——mock 断言）

**NF-P（round1 #8 补）**：镜像刷新成本 O(n) 每块级变更（n ≤ N2 500 环形上限——不逐 token 刷）；六动作描述预算复核（§19.4 N1 扩展——T-M12 断言同步扩）；panel 归只读/控制类——不触项目文件

**验收（round1 #6——T-P 实现前展开为 N/E/A 完整用例表——eng-coder 硬验收项）**：AC-P1 = 面板视图与用户所见一致（T-P1/P6）；AC-P2 = 门控安全（T-P3/P4）；AC-P3 = 降级（T-P5）；AC-P4 = CLI-only 声明落地（round1 #1）



#### 19.6.5 实现记录（2026-09-03 交付——id:17——CLI 1268/0）

1. D-P1 镜像：state._agent 挂载 + _panelSnapshot 初始 []——subagent-blocks 13 个块级变更点 sync（不逐 token——NF-P）
2. D-P2/D-P3：action:"panel" view/freeze——门控（awaitingDigest 且池/pending 无对应——digested 读时交叉标注）——freeze 发 key/⟦ev⟧done 字面 token（_freezeAt 锚点复用——无锚点尾推——ack note 注明）——门禁分类四表（view 只读/freeze 控制类——planMode 放行——受限变体拒绝——digest 放行）
3. F-P3：headless/VS Code 恒降级池视图（degraded:true + no-panel——AC-P4）——VS Code 独立树无 panel schema——天然降级
4. 集成点补充（审计裁定合理）：tool-events onToolResult isSubagent 排除 panel action 结果（防 panel 调用误冻 running 子块——1 行）
5. 工具层 bug 顺手修：blockKeyIn spread Map 得 [key,value] 对（门控池检查形同虚设）→ values() 取值 + 测试锁定
6. 残留 advisory：tool-args.mjs action-only subagent 调用块标题光秃（a.action 兜底建议——非本批——TODO）
7. 行数债：subagent-async 649/subagent-blocks 562/tool-events 537/subagent 531——并入拆分轮

#### 19.6.4 round1 评审处置（2026-09-03——0🔴 通过——9 项）

1. VS Code CLI-only 降级声明（D-P2——webview 无 state.subTasks 对应物——7.2.3.2 #8 先例——AC-P4）
2. freeze token 字面格式 + 落位规则（复用 _freezeAt 若在——否则尾推兜底注明）
3. view 交叉 _pendingAsyncResults 标注 digested（模型可定位异常块）
4. frozen 死字段删除 + startedAt 读时算 elapsed
5. action 门禁分类（view/freeze 只读/控制类——planMode/审批/受限变体/digest 四表——受影响文件补 dispatch.mjs）
6. T-P 实现前展开 N/E/A 完整用例表（eng-coder 硬验收）
7. scope 最小面（view 优先——freeze 门控从严——CHANGELOG 诊断定位——不叠新能力）
8. NF-P 段补（快照成本界/六动作预算复核 T-M12 扩展）
9. 状态行同步（顶部刷新枚举含 §19.6）


## 20. 子 agent 任务调度器（2026-09-03 · 需求 + 设计——方案 1 用户确认——**已批准**）

> 状态：设计批准（2026-09-03 round1 1🔴 + round2 0🔴 通过——advisory 处置注见 20.4——designToken 已签发）+ **已实现（2026-09-03——实现记录见 20.5——偏差落文——CLI npm test 1286/1241 全绿（45 slow 豁免）——VS Code 1017/1017——镜像同步交付）**。触发：用户提议——"前端评审好了就 spawn 出去——实际执行由调度器安排——能并发则并发、该等则等、按依赖顺序排队跑"。实证痛点：父代理手动调度（冲突检查/并行串行/cancel 重派全靠脑内——2026-09-03 id:13/14 同文件并发失误 = 调度缺失的直接代价）；已批任务排队（§19.5/§19.6 等让位）无机制。用户选方案 1（spawn 带调度元数据 + 调度器自动准入排队）。


**总体目标**：把"任务执行序"从父代理脑内移入机制——父代理只声明域与依赖、提交即走——调度器保证同文件串行、依赖有序、并发不误伤——根治同文件并发失误与手动排队（今日 id:13/14 事故为证）。
### 20.1 需求

- F-SD1：**流式提交**——父代理评审好即 spawn（带调度元数据）——提交后零调度心智（不盯队列/不手动 cancel 重排）
- F-SD2：**同文件域自动串行**——新任务 files 与 running/queued 任务域交集 → 自动排队（waiting-deps）——依赖完成自动补位启动
- F-SD3：**显式依赖**——dependsOn 未完成 → 排队（文件域外依赖——如"等 X 交付后再做 Y"）
- F-SD4：**状态可见**——status 显示 waiting-deps + 原因（冲突对象/依赖对象）——模型可查
- F-SD5：两端一致（CLI/VS Code 同构）

### 20.2 设计（D-SD1..SD5）

**D-SD1 spawn 调度参数（可选——零改动兼容既有 spawn（**round1 #2：仅 async spawn 参与调度——sync spawn（async:false eng-coder/coder）带 files/dependsOn 且命中冲突 → 明确错误——不队列化 sync——sync 语义零变更**）**：
- `files?: string[]`——写域声明（eng-coder 纪律"不碰清单外文件"+ 偏差审计兜底——声明即契约——**不做任务书文本自动解析**（不可靠——v1 边界））
- `dependsOn?: string[]`——子代理 id 列表（显式依赖）
- 缺省（无 files 无 dependsOn）= 既有语义（立即启动——不参与冲突检测——子代理/explore 等不受影响）

**D-SD2 池条目域元数据**：spawn 时 entry 记 `_files`/`_dependsOn`——running ∪ queued 条目全带

**D-SD3 准入检测（spawn 时）**：新任务 spawn：若 (running ∪ queued).some(e => e._files ∩ new.files ≠ ∅) 或 dependsOn 任一条目未 done → **不立即 start——入 queued（waiting-deps 态——记原因）**——否则立即 start（既有语义）

**D-SD3b 面板 UX（2026-09-03 用户裁定——spawn 即见 + waiting 标注）——supersede §7.2.1 F6/T2（评审 #1：面板存在条件从"running 非空"扩为"running ∪ queued/waiting 非空"——waiting 块驻留期面板保持渲染——T2 断言同步扩——§7.2.1 F6 行加 supersede 指针）**：**任何排队 spawn（waiting-deps 或 slot-queued）在 spawn 返回时立即建面板块**（不等子代理首 token——排队子代理未启动无 relay 流——块由 spawn 侧直接建——**通道（round2 #2）：新 ⟦ev⟧queued/cancelled 事件 token（spawn 返回时发 queued——出队/取消发 cancelled——TUI routeSubToken 消费——与 7.2.3.2 #2 async ack 跳过冻结不冲突——tool-events/routeSubToken 分支补受影响文件）**）——块头标注：`[▶ role#N · waiting] waiting for: explore#2（域冲突 src/x.mjs）、eng-coder#1（依赖未完成）`——slot-queued 标注 `queued · position 3`（槽满等位）——**启动后块头转正常 running 态**（relay 首 token 接管——既有 ensureSubTaskKey 命中同 key 不重建）——块不可展开（无活动）——取消/出队时移除。**waiting 语义对模型可见**（spawn 返回 {id, status:"queued", reason} + §19.5 status 含 waiting 态 + 原因——§20 受影响文件补 subagent-blocks.mjs（waiting 块建/转/撤）与渲染（块头 waiting 标注）——测试补 T-SD11（spawn 即面板可见 + waiting for 标注）T-SD12（启动后转 running——同 key 不重建））

**D-SD4 补位增强（maybeRefillAsync）**：settle/cancel 释放槽后——从 queued 选"依赖全满足 + 域无冲突"的最早条目启动——**多任务同时解除（一批 eng-coder 全等同一依赖）→ 按 queued 序逐个启动到槽满**（上限 4 不变）


**D-SD5 死锁防御 + 取消（round1 #1 补——依赖终态释放规则）**：dependsOn 成环（A→B→A）→ spawn 时检测拒绝（错误明确）；域冲突天然无环（串行释放）；cancel queued waiting-deps = 出队（既有——后续项前移）；受保护任务（同批同依赖释放）无抢占（v1 不做优先级）。**依赖释放规则（终态语义）**：依赖在目标 settle（任何终态——成功/错误/取消）或条目移除（check 消费/出队）时视为满足——waiting-deps 条目重新评估：目标取消/错误 → 依赖者自动释放启动（父代理负责失败处置）——**被 round2 #3 默认分支取代（supersede——见下）**——**默认分支（round2 #3 定死）：依赖取消/失败 → 依赖者留 queued 标 dependency cancelled + 注入提醒供模型决策——仅父代理显式处置或 AUTO 档才自动启动——**round1 #4：queued（未运行）依赖被 cancel 无 settle 事件——"dependency cancelled" 提醒在 cancel 动作返回时即注入（模型可见——工具结果内）——面板/status 恒显示标注——滞留有意（挂起持续至用户/模型处置——显式可清——不静默）****；spawn 时 dependsOn 引用 unknown id → 明确错误（对齐 check/status 未知 id 语义 T12）——**round1 #8：被 check 消费的条目（池删除）——dependsOn 引用 → 消费即终态——保留终态墓碑（consumed id 视为已满足——dependsOn 语义完成）——非 consumed 的 unknown id 才拒绝——补 T-SD14**——补 T-SD9（cancel queued 依赖 → 依赖者自动释放）T-SD10（unknown id 拒绝）

**v1 边界**：不做优先级/抢占/超时重调度/自动域解析——files 声明缺失的任务不参与冲突检测（行为 = 现状——逐步迁移）——round1 #5：声明错误（漏文件/path 形态不一 src/x vs ./src/x）静默绕过串行化——false-negative 风险明示——实现时 path 归一化再交集——eng-coder spawn 带 designId 时尽量从 §18 任务域（设计文档 + 交付文件清单）播种 _files

**受影响文件**：src/agent-tools/subagent.mjs（spawn 参数 + 准入）、src/agent-tools/subagent-async.mjs（池条目域 + maybeRefillAsync 增强）、status 输出（waiting-deps 态 + 原因）、测试（subagent.test——准入/排队/补位/取消/环拒绝）、AGENT-LOOP 本段 + §15 池引用注 + §19.2 D-M1 矩阵 queued/返回形态行 + §19.5 D-M5 status 形态 + T-M6/T-M8/T-M18 + §19.4 N1/T-M12 描述预算（supersede 注——round1 #3——19.5.2b 先例——实现时同批修订列具体行）、两端同构 + VS Code 测试（T-SD 镜像子集——round1 #4）+ **docs/design/TUI.md（round2 #4——面板段/module map——waiting 标注/queued 块）——两端 CHANGELOG（父代理统一）——§19.6 D-P1 _panelSnapshot 写点随 waiting 块生命周期扩展（指注）**

### 20.3 测试（硬验收——eng-coder 展开 N/E/A）

- T-SD1：无调度参数 spawn → 立即启动（既有语义回归）
- T-SD2：同文件域冲突 spawn → waiting-deps（不入 running——status 显示原因）
- T-SD3：依赖完成 settle → 排队任务自动补位启动（槽空即启）
- T-SD4：多任务同依赖 → 释放后逐个启动到槽满（上限 4）
- T-SD5：dependsOn 成环 → spawn 拒绝（错误明确——round2 #5：自然流程不可达（unknown id 拒 + spawn 序天然无环）——人工向池注入构造——防御断言定位）
- T-SD6：cancel waiting-deps 任务 → 出队 + 后续前移（既有 queued 取消语义）
- T-SD7：status 显示 waiting-deps 态（模型可见排队原因）
- T-SD8：文件域不相交 + 无依赖 → 并行（不误排）
- T-SD9：cancel queued 依赖 → 依赖者留 queued 标 dependency cancelled + 提醒（round2 #3 锁定默认——仅 AUTO/父显式处置才启动——supersede round1 #1）
- T-SD10：dependsOn unknown id → spawn 拒绝（round1 #1）
- T-SD11：排队 spawn 返回即面板可见 + waiting for 标注（D-SD3b）
- T-SD12：启动后转 running——同 key 不重建（D-SD3b）
- T-SD13：sync spawn 带调度参数命中冲突 → 明确错误（round2 #7——sync 不队列化）
- T-SD4b：混合队列（waiting-deps + slot-queued 共存）启动序断言（round2 #6）


**NF-SD（round1 #4 + round2 #8 补）**：准入检测 O(running∪queued × files) 每 spawn（槽 ≤4 + 队列有限——可接受）；每次 settle 重扫 waiting-deps 队列同界；spawn 描述预算增量（files/dependsOn 两可选参——T-M12 锚复核同 §19.6 NF-P）；**VS Code 对等验证（F-SD5）**：§15.6 模式——双端同构 + 双端测试（T-SD 镜像子集）——受影响文件含 VS Code 测试；**排队滞留可见性（round2 #8）**：waiting-deps 长滞（依赖取消留 queued 分支）不静默——status/面板恒显示 dependency cancelled 标注 + 注入提醒——可 cancel（**评审 #6 澄清：滞留条目使挂起持续（D-S2 池空退出判据含 queued）——用户/模型 cancel 该条目后池空才自然退出——显式可清——不静默——行为有意**）


**验收（round2 #1——T-SD9..13 回指）**：AC-SD1 = 流式提交零调度心智（T-SD2/3——冲突自动排——依赖自动启）；AC-SD2 = 并行不误伤（T-SD8）；AC-SD3 = 死锁/取消安全（T-SD5/6/9/10——依赖取消/失败处置 = 留 queued 标注 + 模型提醒（不自动释放——round2 #3）——unknown id 拒——评审 #3）；AC-SD4 = 状态可见（T-SD7/11/12——含 waiting 面板标注）；AC-SD5 = 既有语义零回归（T-SD1/13——sync 冲突错误）

### 17.6 Ctrl+C processing 态武装化 + 回合 abort 与池解耦（2026-09-03 · 紧急修复——用户两次实测被坑——已实现 17.6.4）

> 状态：设计批准（评审 0🔴——round1 处置 742ae35：D-C1 round1#1 agent-turn 区分机制 + D-C4 /abort 语义）+ **已实现（2026-09-03——见 17.6.4 实现记录）**。触发：用户实测——"输错半句一 Ctrl+C 把 eng-coder#14 杀了"（同日第二次——id:13 亦误杀）——提示"3s 内再按才杀"与实际"一次就全杀"不符。

#### 17.6.1 根因（代码实锤）

- **A**：agent.mjs 回合收尾（signal.aborted && !reason.interrupt）→ 无条件 _asyncSubagents.clear()——任何非 interrupt 回合中止连坐清池（杀全部后台）
- **B**：key-handler processing 态 Ctrl+C（非挂起）无武装窗口——第一按直接 controller.abort()（无 interrupt reason——命中 A）——挂起态/空闲态有双确认而 processing 没有——三态不一致
- 对照：Ctrl+I（reason.interrupt）路径不清池（正确）——processing 态 Ctrl+C 应同语义

#### 17.6.2 修复（D-C1..C3）

- **D-C1 key-handler processing 态武装化**：第一按 → abort({interrupt: true})——**无 message（round1 #1——agent-turn 区分：有 message 的 interrupt（Ctrl+I）= 重建续跑——无 message 的 interrupt（Ctrl+C 首按）= 停回合不续跑——受影响文件补 agent-turn.mjs 核对）**（停当前回合——不清池——后台保留——提示 "[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]"）——3s 内第二按 → 全停（clearTimeout + abort（无 interrupt——走 agent.mjs 清池分支）+ _suspAborted + 唤醒）——与挂起态分支同构——武装计时/过期复位复用既有语义
- **D-C2 agent.mjs 清池条件核对**：interrupt 路径已安全（!interrupt 条件排除——不改）——全停清池走既有 abort 分支（二按 abort 无 interrupt → 清池）——agent.mjs 零改动（核对确认）
- **D-C3 提示一致性**：processing 首按提示含"再按中止全部后台"字样（对齐挂起态文案）

**D-C4 /abort 语义（round1 #2）**：/abort = 显式全停——对齐二按语义（无武装直接全停——用户显式命令——可辩护）——注一句 + 回归测试锁定

**受影响文件**：src/tui/key-handler.mjs（processing Ctrl+C 武装化——~10 行）、测试（key-handler/tui——首按不清池/次按清池/过期复位）、AGENT-LOOP 本段 + TUI.md §3 键分发注（Ctrl+C 三态武装一致）

#### 17.6.3 测试（硬验收）

- T-C1：processing + 池有 running 条目——Ctrl+C 首按 → 回合停（interrupt 标记）——池保留（后台不死）
- T-C2：3s 内次按 → 池清 + 全停标记
- T-C3：首按后 3s 过期——再按 = 首按语义（不清池）
- T-C4：Ctrl+I 路径回归（既有 interrupt 不清池不变）
- T-C5：挂起态/空闲态既有双确认回归（零变化）

**验收**：AC-C1 = processing Ctrl+C 首按不再误杀后台（T-C1——核心）；AC-C2 = 全停仍可达（T-C2）；AC-C3 = 三态零回归（T-C3..C5）

#### 17.6.4 实现记录（2026-09-03——实现交付 + 偏差落文）

**改动文件**：`src/tui/key-handler.mjs`（Ctrl+C 重构）、`src/tui/agent-turn.mjs`（interrupt 区分 + 垃圾回滚）、`test/suspension.test.mjs`（T-C1..C5 + T-C5b，38/38）、`docs/design/TUI.md` §1 模块地图 + §3 键分发注、本段。agent.mjs 零改动确认（D-C2——清池条件未动）。

- **D-C1 落点**（key-handler Ctrl+C 重构——三态一致）：
  - 非挂起 processing 首按 → `abort({ interrupt: true })`（无 message）+ 提示（D-C3 文案）+ 武装 3s（复用 `suspAbortArmed`/`suspArmTimer`/`exitArmDelay`）；
  - 挂起态①（digest/会话内回合首按）同步改 interrupt 语义（**偏差落文 1——超出 D-C1 字面 scope**）：设计 D-C1 只写非挂起 processing 分支，但挂起态①原平 abort 命中同一根因 A（agent.mjs `aborted && !interrupt` → 无条件清池）——用户实证场景（提示"再按才杀"与实际"一次就全杀"不符 = 挂起态①的提示文案）正是此路径：digest/会话内回合首按平 abort → 回合收尾清池 → 会话即死、后台全灭。不改则 AC-C1 在用户真实场景不成立。interrupt 无 message + agent-turn 区分（不续跑）后：回合停、池保留、会话续活（T-C5/T-C5b）。与 AGENT-LOOP §17 设计声明"digest 自身 Ctrl+C 不误伤"一致。
  - **二按统一全停块（偏差落文 2——结构选择）**：武装检查提升到状态路由之前——两次按下之间状态会迁移（首按停回合 → 释放窗口 → 挂起会话启动），若武装只查挂起分支，非挂起 processing 首按后的二按会落入空闲退出分支（三按误退出应用）。二按 = 当前回合平 abort（无 interrupt——agent.mjs 清池）+ abort 集合全部 controller；仅挂起态置 `_suspAborted` + 唤醒（非挂起语境置位会粘滞阻塞未来会话重入——round2 偏差 #1 语义）。
  - 空闲态 exitArmed 双确认零改动。
- **agent-turn 区分（round1 #1 落点）**：`reason.interrupt && reason.message`（Ctrl+I）= 重建续跑（既有）；无 message（Ctrl+C 首按）= break 停回合不续跑。**垃圾回滚（偏差落文 3）**：agent.mjs 中断三段（chat catch / response.interrupted / 工具执行中断）无条件注入 `[User interrupt: <message>]`，对 message 存在无守卫——无 message interrupt 落 "[User interrupt: undefined]" 垃圾上下文。D-C2 agent.mjs 零改动约束下在 agent-turn 无 message 分支回滚尾部垃圾（确定性：chat catch / response.interrupted 两路径注入恒为 history 最后一条；工具执行中断第三点常规路径经下一次 chat 的 dedup 后垃圾仍居尾——**已知窄边（审计 🔵-4）**：第三点 continue 后若轮顶压缩注入先于重抛落尾，回滚够不到更深的垃圾——仅历史残留外观级，未做跨段扫描）。**partial 部分输出保留（advisor round1 🟡 裁定——2026-09-03）**：无 message interrupt 走 provider interrupted 路径时 agent.mjs 先提交部分输出再抛——agent-turn 只回滚垃圾、**保留 partial**——interrupt 家族语义（§2 Ctrl+I 同款"提交部分输出"，停回合沿用；修复前平 abort 不落 history 的差异即 interrupt 语义本身）。回滚 partial 需在 history 层区分工具/子代理路径的既有完整消息（不可靠）——不做；行为由 T-C4 场景 2 断言锁定（partial 保留 + 垃圾清除）。
- **D-C4 /abort（偏差落文 4）**：核对结论——CLI 无 `/abort` 命令实体（SLASH_COMMANDS/HANDLERS 无此命令；§19.5 决策"全停走 Ctrl+C、不加 cancel-all"同族）。D-C4 语义（显式全停无武装）由**二按全停**承担并锁定：T-C2（handler 级二按平 abort 断言）+ 既有驱动级全停回归（T-S5/偏差#3/round2 偏差#4 ×2）。如需真实 `/abort` slash 命令（slash-commands.mjs + cmd 文件 + /help 行——超本段受影响文件清单），列为后续候选。
- **实现时核实的 e2e 语义事实（记录——非偏差）**：非挂起 processing 态的后台池条目只可能是**本回合** spawn 的 children（baseSignal = 当前回合 controller——subagent.mjs settle cancelled 分支——偏差#3 测试同语义）——回合中止时随 controller 中止属既有接受语义（Ctrl+I 同）；本修复保护的是**会话期** children（持会话 signal——digest/会话内回合首按后存活——T-C5b E2E）与池账本本身。AC-C1 的"池保留"在 handler/机器层成立（T-C1——interrupt 排除 agent.mjs 清池分支）。
- **测试**：T-C1（processing 首按 interrupt 无 message + 池保留 + 武装）/ T-C2（二按平 abort 全停——不粘滞）/ **T-C2b（advisor round1 🟡 处置——无后台池二按不吞键落回空闲退出双确认）**/ **T-C2c（advisor round2 🟡 处置——回合启动解除 exitArmed 残留）**/ T-C3（过期复位再按 = 首按语义）/ T-C4（agent-turn 区分：message 续跑 vs 无 message 停 + 垃圾回滚 + partial 保留锁定）/ T-C5（挂起态① interrupt 语义 + 双确认零回归）/ T-C5b（会话内回合首按停——会话与池保留——settle 照常消化——用户实证场景 E2E）。T-C6（/abort 显式全停回归）→ 映射 T-C2 + 既有 T-S5/偏差#3。**全量测试记录（2026-09-03 实现后，CLI）**：`npm test` 全绿（45 skipped = 既有 THINCODER_TEST_FULL slow-test 豁免）；`test/suspension.test.mjs` 40/40（含 8 新用例——3 次重跑稳定）；agent-turn/tui 套件随全量绿。

**advisor round1 处置（2026-09-03——1🔴 + 2🟡 + 1🔵）**：
- 🔴 agent-turn.mjs 524 行超 500 硬限——**归属：超限由既有未提交 §17.5.5 工作造成（HEAD 433 → 交付前 509），本批 +15 叠加至 524**——拆分（挂起驱动段迁出）会重构他人未提交代码 + 新增文件超本段清单——**不在此交付内拆**——父侧 TODO 登记候选（与 §17.5.5 交付协调拆分；tool-events 先例）。
- 🟡 二按空转吞键 → 已修复（key-handler armed 块加 hasStopTarget 门——无目标落回空闲退出分支——T-C2b 锁定）。
- 🟡 partial 部分输出保留语义 → 已裁定（interrupt 家族语义——见偏差落文 3）+ T-C4 断言锁定；如需"停 = 不留下半截"需 agent.mjs 源头守卫（D-C2 约束外）——父侧裁定候选。
- 🔵 picker 分支先于武装检查 → 注释注明例外（picker 语义优先——场景极窄），零行为变更。

**advisor round2 处置（2026-09-03——收敛复核）**：
- prior 🟡 二按空转吞键 → 已修复（hasStopTarget——T-C2b 锁定）；prior 🟡 partial 语义 → 已裁定落文 + T-C4 锁定；prior 🔵 picker 例外 → 注释落文。**Verified（round2 复核确认）**。
- 新 🟡 落空穿透 + 陈旧 exitArmed → **已修复**：回合启动即解除空闲退出武装（agent-turn runAgentTurnInner——`state.exitArmed = false` + 清 `ctx.exitArmTimer`——exitArmed 只属于空闲态双确认，不跨回合残留——T-C2c 锁定：清除 + timer 不触发）。
- prior 🔴 agent-turn.mjs 行数超限 → **不在此交付内拆（向父侧路由）**：超限由既有未提交 §17.5.5/§20 并行工作造成（HEAD 433 → 本交付前 509），本批叠加至 526（round2 记），round3 exitArmed 修复 +9 → 现 535 内容行（536 含尾空行）；拆分会重构并行任务未提交代码（freezeReclaimDigestedBlocks 集成段）——实测该并行任务本会话内仍在写树（docs/TODO.md 于本交付进行中变更——16:10）——同文件并发重构即本修复所治事故（id:13/14 同文件并发）本身，不在并行未落盘代码上动刀。父侧处置建议：§17.5.5/§20 交付落盘后登记 docs/TODO.md 拆分项（挂起驱动段 suspensionSession/digestTurn/waitForSettleOrWake/backgroundStatusText/sweepSettledToPending/poolLive 迁出——tool-events 先例——render-conversation L93 开放登记同款），或由该任务交付时一并拆。**round3 复核（2026-09-03）：fixable 项全清（#2..#5 Verified）——本项仍不通过——评审通道连续两轮受阻于同一 scope 外项 → 按 AGENT-LOOP §18 协议交付 stalled 报告（父侧裁定：拆分协调或 TODO 登记收口）。**

#### 20.4 评审处置（2026-09-03——round1 1🔴 + round2 0🔴 通过）

- round1 #1 依赖终态释放规则（D-SD5）——round2 复审确认
- round2 #1 T-SD9..13 入表 + AC 回指
- round2 #2 waiting 块通道（⟦ev⟧queued/cancelled）
- round2 #3 释放默认分支定死（留 queued + 标注 + 提醒——supersede 旧自动释放句——T-SD9 同步）
- round2 #4 queued-cancel 注入触发（cancel 返回即发）+ 滞留有意明示
- round2 #5 T-SD5 人工注入/防御断言
- round2 #6 越行/position 语义 + T-SD4b
- round2 #7 sync 冲突 error + 元数据
- round2 #8 NFR/滞留可见性
- **§17.6 round2 复审注（误置 §20.4——评审 #2 归位标注）**：复审 #1..8（区分机制/abort 语义/supersede 标注/状态行/事件矩阵/头注/墓碑）——token 8a85b23d = §17.6 评审批签发——§20 自身 round2 见上


#### 20.5 实现记录（2026-09-03——CLI + VS Code 双端交付——偏差落文）

**改动文件（CLI——符号锚）**：`src/agent-tools/subagent-async.mjs`（调度核心：`normalizeFileList`/`filesOverlap`/`depInfo`/`describeBlockers`/`queueRunnable`/`assertNoDepCycle`/`dependentLabels`/`refreshQueuedTokens` + `maybeRefillAsync` 重写 + `executeCheckAction`/`cancelAsyncSubagent` 墓碑 + `executeStatusAction` queued 形态 + `executeCancelAction` queued-cancel 处置 + `injectAsyncResult` 墓碑）、`src/agent-tools/subagent.mjs`（schema `files`/`dependsOn` + 描述调度段 + execute 准入 + entry `_files`/`_dependsOn` + settle-finally 墓碑/依赖者注记/refresh）、`src/tui/subagent-blocks.mjs`（SUB_EVENT_RE 扩 queued + queued/cancelled 事件分支 + async 转 running 清标 + 镜像 queued 态）、`src/tui/subagent-panel.mjs` + `src/tui/render-segments.mjs`（waiting 头渲染）、测试（subagent.test/subagent-blocks.test/tui.test——T-SD1..14 N/E/A）、本段 + §15 池引用注 + §19.2 D-M1 行 + §19.5 D-M5 注 + §19.4 N1 注 + §7.2.1 F6/T2 行（supersede 指针——评审轮已落）+ docs/design/TUI.md（round2 #4）。VS Code 同构镜像 + 测试子集（本仓 ARCHITECTURE.md 引用段记录结构差异）。

**落点（CLI 符号锚）**：
1. **D-SD1 参数 + D-SD3 准入**（subagent.mjs execute——auto-turn 门后）：files 相对 cwd 归一化绝对路径（win32 比较键小写——round1 #5）；dependsOn 字符串化。校验序 = 形态 → unknown id（depInfo——池/pending/墓碑三源——T-SD10）→ 环（assertNoDepCycle——人工注入可达环拒——T-SD5）→ 等待态（describeBlockers——派生不存储）。**sync（async:false）命中 wait/depc → throw（不队列化——T-SD13）**；无冲突 sync 元数据不登记（阻塞 spawn 独占回合——无并发窗口——零语义变更）。entry 记 `_files`/`_dependsOn`（D-SD2——running ∪ queued 全带）。
2. **D-SD3b waiting 块通道**（round2 #2 定稿）：事件 token `⟦ev⟧queued\x1e{kind}\x1e{position}\x1equeued\x1e{detail}`（kind ∈ slot|wait|depc——slot 等位/wait 依赖域冲突/depc 依赖取消失败——TUI subagent-blocks queued 分支建/刷新块——覆盖式更新——已启动块迟到事件丢弃）与**零字段** `⟦ev⟧cancelled\x1e`（出队/取消——移除块不冻结——守卫 !async——running 取消走 stopped 通道）；排队 spawn 返回即经 `refreshQueuedTokens` 发射（去重 sig——队列突变点全接：settle 后/cancel-return）。块头 = `[▶ role#N · waiting/queued …]` + 状态区 detail（waiting for:/dependency cancelled: 恒标）或 `queued · position N（槽满等位）`；启动（⟦ev⟧async）清标 + started 归零——同 key 不重建（T-SD11/12）。面板镜像（§19.6 D-P1——syncPanelSnapshot）waiting 块以 queued 态入镜。
3. **D-SD4 补位**（maybeRefillAsync 重写）：队列可混 waiting-deps + slot-queued——扫描最早 **queueRunnable**（依赖全满足 + 域无冲突 vs running ∪ queued self-excl——队列序保同文件串行：先入者启动后以 running 身份继续挡后入者；waiting 越行不阻塞槽位——T-SD4b）条目启动到槽满 ≤4（纯 slot 队列与旧 shift 等价——既有用例零改全绿）。
4. **D-SD5 释放 + 墓碑 + 提醒**（round2 #3 锁定默认）：终态墓碑 `agent._asyncTombstones`（写点 = check 消费 executeCheckAction——consumed/failed/cancelled 三分、queued-cancel cancelAsyncSubagent、running-cancel settle-finally、注入消费 injectAsyncResult——两消费点同源——T-SD14）；依赖 settle（任何终态）→ settle-finally maybeRefill + refresh 重估（**非 AUTO：取消/失败 → 依赖者留 queued 标 depc——不自动启动**；AUTO：视可启动——准入/refill 双点放行——T-SD9b）；提醒两通道：queued 依赖取消无 settle 事件 → **cancel 返回工具结果内注记**（dependents/note 字段——round1 #4 明示"工具结果内"）；running 依赖取消 → settle-finally cancelled 分支 user-role 提醒（既有形态扩展依赖者注记——T-SD9c）。
5. **status/spawn-return 形态**（F-SD4/D-SD3b）：queued 条目非 slot 态补 `waiting: "waiting-deps"|"dependency-cancelled"` + `reason`（单查 + 概览——派生实时）。

**偏差落文**：
- **偏差 1（事件 token 字段形态）**：设计未定字段格式——按既有 SUB_EVENT_RE 四段家族定 `queued` 四段（kind/position/phase/detail）；cancelled 按 async 先例零字段——TUI 两分支分置（queued 在 SUB_EVENT_RE 内、cancelled 零字段先行）。
- **偏差 2（AUTO depc 准入即放行）**：AUTO 档引用已取消墓碑 id 的**新 spawn** → 立即启动（与释放评估同语义——describeBlockers 单点）；手动档 → queued 标 depc 待决策。设计仅述释放路径——准入路径同规则延伸。
- **偏差 3（注入消费墓碑）**：T-SD14 墓碑字面仅指 check 消费——自动注入消费（回合尾 collect + digest 首行注入——消费点在 agent.mjs——清单外）经共享注入器 `injectAsyncResult`（清单内）写墓碑——同语义无遗漏；**full-stop 全停（Ctrl+C 清池）不写墓碑**——全停后引用旧 id = unknown 明确错误（非 consumed 语义自洽）。
- **偏差 4（running 依赖取消的依赖者标注点）**：设计述"cancel 返回即处置"泛指——实现按条目态分流：queued 依赖取消 → cancel-return 立即（无 settle 事件）；running 依赖取消 → settle-finally cancelled 分支（abort 在途窗口内依赖者维持 waiting——毫秒级——终态单点处置 + 提醒同点）。
- **偏差 5（v1 播种无源）**："eng-coder spawn 带 designId 时尽量从 §18 任务域播种 _files"——advisor 设计评审留存仅 designId→token（无文件清单留存）——v1 无播种源——files 参数为唯一声明通道（声明缺失 = 不参与冲突检测——行为 = 现状——明示）。
- **行数债**：subagent-async（~896）/subagent-blocks（~625）/subagent.mjs（~609）本批增量超 500 硬顶——并入既有拆分轮（docs/TODO.md——tool-events 先例）——本交付不新拆。

**测试（CLI）**：T-SD1..14 展开 N/E/A（subagent.test §20 节——池层 12 用例 + subagent-blocks.test 数据层 4 用例 + tui.test 面板层 2 用例——含 queued-only 面板保持；§19.5 处置 #4 旧"入队不 paint"语义测试按 D-SD3b supersede 改写）。**全量（2026-09-03）**：CLI `npm test` 1286/1241 全绿（45 slow 豁免）；VS Code `npm test` 全绿（T-SD 镜像子集——10 池层用例 + webview 行 2 用例）。

**验收勾销**：AC-SD1 = 流式提交（T-SD2/3）；AC-SD2 = 并行不误伤（T-SD8）；AC-SD3 = 死锁/取消安全（T-SD5/6/9/10——depc 锁 + AUTO 放行）；AC-SD4 = 状态可见（T-SD7/11/12）；AC-SD5 = 零回归（T-SD1/13 + 全量绿）。

#### 20.6 advisor code review 处置（2026-09-03——0🔴——功能项修复 + 落文）

code review 0🔴（6 项——2 功能级 🟡 + 1 登记 🟡 + 3 文案/形态 🔵）。处置：
- **🟡1 行数债登记刷新（TODO.md 数字过期）**：TODO.md 拆分轮条目仍记旧数（649/531/577）——本记录已列现值（~896/625/609——VS Code ~833/~510）——TODO.md 属父侧文档，**随批刷新登记由父侧执行**（本交付不新拆——20.5 行数债句同载）。
- **🟡2/🟡3 check 对 depc 锁定条目的无界等待**（CLI `executeCheckAction` / VS Code `subagentCheck`）：§20 depc 锁（round2 #3）引入"queued 条目永不自动启动"态——check（同步阻塞工具调用）指定该 id / arrival-order 池全锁定 → 模型回合永久钉死（仅 Ctrl+C 可解）。修复：等待前判锁——目标 depc（非 AUTO）→ 立即返回 `{status:"queued", waiting:"dependency-cancelled", reason, note(处置引导)}`；arrival-order 无 running/done 且全 queued depc → 明确 error（列 ids）。AUTO 档不锁定（守卫放行——对照用例锁定）。双端测试：CLI subagent.test §20 节 2 用例 + VS Code 镜像 1 用例（含 AUTO 对照）。
- **🟡4 check 消费 × 挂起移交竞态（双送达）**：check 在途等待的条目在挂起分支 settle（digest 回合）→ 先移交 `_pendingAsyncResults` 后唤醒 waiter——check 醒来消费后条目仍在 pending → 下轮 prepareRun 重复注入（同一报告双送达——D-S3 只注入一次不变式）。修复：check 消费点**反向清除 pending**（CLI executeCheckAction / VS Code purgePending——消费即终态，两消费点互斥）。双端负测试（构造在途等待 + 移交时序）。
- **🔵5 AUTO 取消注记文案**：queued 依赖取消的 dependents/note 与 running 取消提醒——AUTO 档依赖者同段已自动启动时文案仍称 "stay queued"。修复：note/提醒在 refill 后重算（仍 queued 者才列）；AUTO 且全部已启动 → "auto-started (AUTO session)"措辞（CLI executeCancelAction + settle 提醒 autoNote；VS Code cancelSubagent + injectCancelReminder）。
- **🔵6 两端形态分叉落文（有意偏差）**：在途 check 观察到 cancelled 目标——CLI 返回 "unknown async subagent id" 错误、VS Code 返回 `{status:"cancelled"}`——两形态均各有测试锁定（§19.5 既有——非 §20 引入）——按 §19.4 N4 精神明示为两端各自既有测试断言形态，统一留后续批次。
- **复审轮 #7/#8 残留闭合（结构性守卫）**：advisor round2 发现守卫仅覆盖 depc-kind——wait-kind 条目（文件域阻塞源 = 另一条 queued-depc 条目）在无 running 池中同样永不启动（refill 由 settle 驱动——无 running = 无 settle）→ check 仍悬挂。修复：守卫扩为**结构性判据**——① target 级：queued 目标且池内无 running → 立即返回 queued+位置/原因+引导注记（depc 分支保持优先——原文案）；② arrival-order：无 running 且无 done（done 条目经已 resolve settled 即时消费——不误伤）→ 明确错误（逐条列 stuck 状态）。池有 running → 守卫放行（等待语义保留——running settle 唤醒——对照用例锁定）。AUTO 无 running 同样立即返回（带 AUTO 引导注记——语义修订：原③"等待放行"改为"立即返回"——无 running 时 AUTO 也无法触发 refill）。双端测试扩展（CLI subagent.test #3 场景 ③④⑤ / VS Code 镜像 ③④⑤⑥）。


#### 20.7 prompts 调度器条款升级（2026-09-03 · 设计——用户裁定——**已批准**——评审 #4 标题同步）

> 状态：**设计批准（2026-09-03 评审 0🔴 通过——token 00fde4f4——实现记录见下——评审 #4 生命周期标记修正）**。来源：TODO 立项（f874a4f）——main.md Delegation 段旧纪律未随 §20 升级。

> **实现遗留补注（2026-09-04——用户观察"总是等 eng-coder 结束再 spawn"——父侧实证）**：实现批遗漏 **engineering.md :212-213 旧句**（"Never assign two parallel eng-coders edits to the same file — conflicts waste everyone's time."——否定式手动避让）——与 :242-248 调度器新条款（"overlapping domains are queued by the scheduler, never hand-serialized"）**同文件矛盾**——T-PS2 断言只覆盖 4 句旧措辞（"share NO file"/"run the tasks serially"/"Dependency chain → serial"/"Pre-check"）——**漏了本句**——故旧句溜过实现。**修复（并入最近批——待 §18.11/18.12 交付后）**：①两端 engineering.md :212-213 删/替为调度器句；②T-PS2 补断言 `!text.includes("Never assign two parallel eng-coders")`（CLI）；③查 :4014 既有反向断言（"same file — conflicts waste"——疑似另处残留——核实归属）；④TODO:330 勾销/更新。token 00fde4f4 已失效——修正轮前需重新评审（拿新 token）。


> **round2/round3 复审处置（2026-09-04）**：round2 复审 1🔴（D-BI6 扫描不完整——byte-identical 残留未清）+6🟡/🔵——**全部已修**（8 处指针/状态行 round2 注/TODO 勾销/数字更正/悬空修正/残片清——见 §18.11 状态行/§18.12 处置注）→ round3 复审 2026-09-04 **0🔴 通过**（token 2ed92fcc…/designId 639244b2——5🟡+2🔵 建议项——用户裁决"批准"——按建议 B——实现批 task 条款：#1-5 父侧同批落文档（round2 处置表/状态对齐/§18.12.1 处置表/:1260+:1969 指针/T-VR3 定死）、#6/7 随手——**修正轮 spawn 立即**（删 L213 + T-PS2 补断言——两端——与 §18.12 批文件域冲突由调度器排队）。**


### 20.7.1 需求

**总体需求**：主提示词（main.md Delegation 段 + engineering.md 并行段）从"手动并行避让纪律"升级为"调度器驱动派发"——模型知道 spawn 声明 files/dependsOn——冲突/依赖/排队全交调度器——调度器能力不被闲置（旧条款教模型自己判断"同文件别并行"——否定式自我管理——§20 的正向用法是声明写域让调度器自动排队）。

**功能性需求**：
- F-PS1：main.md Delegation 段旧条款（"Never give parallel subagents tasks that edit the same files——conflicts waste everyone's time"）→ 调度器条款（镜像锚逐字定稿——见 20.7.2 D-PS1）
- F-PS2：engineering.md 并行段（Multi-Task Parallelism——同文件不并行/依赖串行手动纪律）同款升级
- F-PS3：任务书引导——spawn 声明 files（写域）+ dependsOn（依赖）——调度器自动准入/排队/补位——同文件任务可并行派（自动 queued——冲突清自动启动）
- F-PS4：两端 byte-identical（15 prompts 铁律）——**指针（2026-09-04 §18.11）：byte-identical 约束已取消——见 §18.11——当前两端一致性 = 设计锚（逐字定稿）+ 评审/审计**
- **F-PS5（复审 #6 补——system.md §14 D1 carve-out）：system.md "Do NOT parallelize" 条款加 carve-out（声明 files 的 async spawn → 调度器排队例外——旧禁令限定未声明/工具级并行写）——T-PS3/AC-PS4 承载**

**非功能性需求**：条款精简短（提示词预算——不喧宾夺主）；模型可操作（读完知道 spawn 时该带什么参数）。

### 20.7.2 设计

- **D-PS1 镜像锚（main.md Delegation 段替换句——逐字定稿——两端照抄）**：
  > "**Declare spawn scheduling metadata**: pass `files` (the write domain) and `dependsOn` (prior async ids) when delegating — **for async spawns with `files` declared**, the scheduler auto-serializes overlapping-file tasks (queued until clear) and orders dependency chains. Same-file async spawns are safe to fire with files declared — the queue handles contention; **declare `files` or the scheduler can't serialize (undeclared = no detection); sync spawns conflicting on files error out (not queued)**; never hand-serialize what the scheduler queues."（评审 #3 限定——不过度承诺）
- **D-PS2 engineering.md 并行段替换（逐字英文锚——评审 #1 补——实现时先贴出 engineering.md Multi-Task Parallelism 段当前原文作内容锚——替换后旧措辞零残留断言同 T-PS2）**：现有"同文件不并行/依赖串行手动纪律"措辞改为（**评审 #1 逐字定稿——两端照抄**）：
  > "**Declare spawn scheduling metadata in task briefs**: spawn with `files` (write domain) and `dependsOn` (prior async ids) — the scheduler gates admission: async spawns overlapping running/queued files wait queued (clear when the blocker settles); sync spawns conflicting on files error out (not queued); dependency chains auto-order. Mirror tasks across independent trees spawn as parallel eng-coders, each declaring its own file domain — overlapping domains are queued by the scheduler, never hand-serialized. **Keep the concurrency cap: at most 4 concurrent eng-coders (review #2 — phrase preserved, T9/T-E16 assertions stay green).**"
- **D-PS3 测试（评审 #4——in-file 先例 + 具名文件）**：T-PS1 内容断言（main.md/engineering.md 含新条款——fail-when-unchanged——T-B4 式（§16）——CLI advisor.test.mjs/VS Code 对应测试）；T-PS2 旧条款零残留（main.md "Never give parallel subagents tasks that edit the same files" + **engineering.md 旧措辞同断言（评审 #2）**——两端——**实现时先 grep 确认旧句逐字在位（评审 #3——防 vacuous zero-residue——fail-when-unchanged 纪律）**）；**T-PS3（评审 #1——system.md 一致性）：system.md §14 D1 条款含 carve-out（"declared files → scheduler queues"——旧禁令限定为未声明/工具级并行写）——T1 断言（§14——system.md 文本锚）同步更新**；**既有断言保持绿：§15 T9 + §18 T-E16（engineering.md cap 句——评审 #2——D-PS2 内嵌保留声明）**
- **D-PS4 验收（AC 表回指 F-PS1..4——评审 #2）**：AC-PS1（F-PS1）main.md 新条款在 + 旧句零残留（T-PS1/2）；AC-PS2（F-PS2）engineering.md 同（T-PS1/2）；AC-PS3（F-PS3）任务书引导可验证——spawn 参数声明引导句在（D-PS1 内嵌——T-PS1 锚该句）；AC-PS4（F-PS4）两端 prompts 同步 byte-identical + **system.md carve-out 两端同（T-PS3）**；AC-PS5（NFR）T-M12 描述预算不受影响（subagent 工具描述无改动——纯 prompts 文本）

### 20.7.3 受影响文件

- CLI + VS Code：`src/prompts/main.md`、`src/prompts/engineering.md`、**`src/prompts/system.md`（§14 D1 carve-out——评审 #1）**（各 15 文件对中的 3——byte-identical）+ 测试（CLI advisor.test.mjs/VS Code 对应——T-PS1..3 + **既有 §15 T9/§18 T-E16 保持绿（评审 #2）**）+ AGENT-LOOP.md（**本段 + §14 F3/F5/F7/D1 supersede 指针 + §13 point 4 注（评审 #1）+ §16 D-B4 引用注（评审 #4——同一 system.md 条款的扩展沿革）**）+ **两端 CHANGELOG（父代理统一）+ VS Code ARCHITECTURE.md 引用段注（评审 #5——§14/§16 先例）**
- **状态注（评审 #5）**：本段内"评审 #N"标记 = 批准前 informal 迭代处置（并入本版）——正式评审 = 2026-09-03 轮（token 1c6431c1）

**实现记录（2026-09-03——id:3 交付中途父侧 cancel——prompts/测试双端已完整落盘并验证——AGENT-LOOP 注父侧补）**：

- 改动（双端 byte-identical）：main.md Delegation 段旧句 → D-PS1 逐字锚；engineering.md Multi-Task Parallelism 段 → D-PS2 逐字锚（cap 句保留——T9/T-E16 绿）；system.md §14 D1 → carve-out 句。测试：CLI advisor.test.mjs + agent.test.mjs（291/283 绿）+ VS Code agent.test.mjs + unit.test.mjs（182/182 绿）。
- 验收勾销：AC-PS1..5 全 ✓（锚句在/旧句零残留/cap 在/carve-out 在/byte-identical 双端口查在/全量回归绿）。
- 父侧注：§14 D1 carve-out 注 + §13 point 4 supersede 注 + §16 D-B4 引用注（同批落）。两端 CHANGELOG 父代理统一。

- **修正轮实现记录（2026-09-04——round3 复审 0🔴（token 2ed92fcc/designId 639244b2——用户"批准"）→ 双端修正轮）**：
  - CLI（id:5）——clean（审计 CLEAN + advisor 首审 0🔴 + 终审通过——修正轮 1/5）：删除 `engineering.md :212-213` 旧句（"Never assign two parallel eng-coders…"）+ T-PS2 补零残留断言（agent.test.mjs :1965）+ :4014 正向断言（"same file — conflicts waste"）归属核实 = engineering.md T-PS2 域 → 改零残留（:4015）+ 测试标题 "并行互斥" → "并行避让旧句零残留"（advisor 🔵3）——L1 1347 tests/1299 pass/0 fail（48 skip slow）；agent.test.mjs 209 pass/0 fail/5 skip。
  - VS Code（id:6）——clean（审计 CLEAN + advisor 首审 0🔴（1🟡1🔵 均父侧协调项）+ 终审通过——无修正轮）：删除 `engineering.md :212-213` 旧句 + :1427 正向→零残留（超清单——交付必需——同 CLI :4014 处置）+ :1479 补零残留断言——L1 1043/1043 pass/0 fail；grep 旧句零命中（仅 2 处零残留断言）。
  - 父侧同步：TODO:332/354 勾销（2026-09-04）；两端差异 = 断言消息措辞（CLI 中文/VS Code 英文——风格级——§18.11 允许独立演进）。


### 20.8 files 声明协议加固（2026-09-04 · 用户"1+2"——归因：三层——我(主责)/工具描述缺口/调度器静默失效——3 次实证 id:19/20/23/24 目录声明绕过冲突检测）

> 状态：**已实现（2026-09-04——双端——VS Code id:26 clean（L1 1065/1065）+ CLI id:32 clean（L1 1375/0fail——T-F1.1/2/3/4/5 全绿——0🔴 审计+首审+复评——修正轮改注释引用号）——评审 0🔴 token fdc5f843/designId 5589b605——5 项建议全处置：T-F1.5/#2 英文锚/#3 时序修/#4 已知限制/#5 as-of——AC-F1.1..5 全核销（AC-F1.4 双端同语义闭合）——父侧 L2 待全部批次后）**。

**问题（P-F1）**：`normalizeFileList`（subagent-async.mjs:728）把目录声明当成普通路径 normalize——`filesOverlap`（:743）集合交集不判 `test/`(目录) 与 `test/agent.test.mjs`(文件) 重叠——**目录声明静默绕过冲突检测**——承诺"overlapping-file tasks are serialized"但目录声明不排队——主代理(我)3 次用目录声明 spawn——与文件级任务并发改同文件——cancel 3 次。

**需求（F-F1）**：作为用户，我希望 files 声明 **目录形态被拒/明确警告**——不给模型"用目录概括"的静默错误通道。
- **F-F1.1（提示词+描述）**：main.md §20.7 条款 + subagent 工具描述 files 段补："**文件级明细——每个将修改的文件一条——目录声明不支持**";
- **F-F1.2（检测器）**：`normalizeFileList` 对目录形态（以 `/` 或 `\` 结尾 / 指向既有目录）→ **抛明确错误**（"files 声明不支持目录——给文件级明细"）——静默失败变显式错误——**fail-closed**（不让它通过再排队——直接拒 spawn）。

**设计（D-F1）**：
- **D-F1.1（检测器——detector 优先）**：`normalizeFileList` 加目录检测——`f` 以 `/` 或 `\` 结尾 → throw（含路径）；`existsSync(abs)` 且 `statSync(abs).isDirectory()` → throw——**subagent.mjs 调 normalizeFileList 处(execute spawn 入口)转 catch → 返回明确错误文本**(错误即工具结果——模型看到"files 目录不支持——请列文件级明细"——不加静默);
- **D-F1.2（提示词+描述——两端——评审 #2 英文逐字锚）**：main.md Delegation §20.7 段 + subagent 工具 description files 段 + engineering.md Multi-Task 段补**英文逐字句**（两端照抄——语义锚——byte-identical 已取消）：**"files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error."**——**错误字符串英文定稿（D-F1.1 检测器用——评审 #2）**：**"files must be file-level paths — directory declarations are not supported"**；
- **D-F1.3（测试）**：T-SD 系扩展——T-F1 系：目录声明→抛错/错误结果(fail-closed——a 目录形态 b 既有目录);文件级声明→normalize 正常;回归——既有 T-SD1..14 全绿(文件级路径未变——零破坏)——**评审 #1 补 T-F1.5**：提示词/描述锚句断言(fail-when-unchanged——main.md/engineering.md/subagent description——落点：prompts.test.mjs(prompt 断言——§18.14 D-T1.3) + subagent 域文件(描述断言——拆分后现状 glob);
- **D-F1.4（范围）**：不改依赖链/排队逻辑——纯 normalizeFileList 前置校验 + 描述句——检测器一处(CLI)/一处(VS Code 对应——**VS Code 端 subagent-async.mjs 同构——镜像批**)。

**受影响文件（两端）**：CLI `src/agent-tools/subagent-async.mjs`（normalizeFileList 加目录检测）+ `src/agent-tools/subagent.mjs`（description files 段句）+ `src/prompts/main.md`（§20.7 句）+ `src/prompts/engineering.md`（Multi-Task 段）+ `test/subagent.test.mjs`（T-F1 系——**注意：subagent.test.mjs 将被 §18.14 拆分——落点=拆分后承载调度器域断言的域文件（subagent-scheduler.test.mjs 或等价——按启动时现状 glob）**）；VS Code 镜像；文档：AGENT-LOOP.md(本节);CHANGELOG(父侧)。

**测试（T-F1）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-F1.1 | A | files=["test/"] 目录形态(尾斜杠) spawn | 报错/错误结果——文件级明细提示(fail-closed) |
| T-F1.2 | A | files=["test"] 既有目录 | 同上——被拒 |
| T-F1.3 | N | files=["test/agent.test.mjs"] 文件级 | normalize 正常——不误伤 |
| T-F1.4 | E | 既有文件级冲突任务 | 照旧排队(回归——T-SD 全绿) |
| T-F1.5 | N | 读 main.md/engineering.md/subagent description | 含英文逐字锚句(fail-when-unchanged——评审 #1 补) |

**已知限制（评审 #4——残留 false-negative）**：不存在的目录声明（无尾斜杠 + 目录未创建，如 "src/features"）仍可通过检测（不命 existsSync）——静默绕过冲突检测——与 §20.2 v1 边界同类（声明错误静默绕过已明示）——**本批只闭合已知目录形态（尾斜杠/既有目录）——不存在目录形态暂不处理——明示非静默承诺全覆盖**。

**验收（AC-F1）**：AC-F1.1 = T-F1.1/2 绿(目录被拒——fail-closed);AC-F1.2 = T-F1.3 绿(文件级不误伤);AC-F1.3 = T-F1.4 绿(零破坏——回归);AC-F1.4 = 双端同语义;AC-F1.5 = main.md/engineering.md/description 句在(fail-when-unchanged)。

### 20.9 Module Split Policy（2026-09-04 · 用户裁定——通用拆分方法——AGENTS.md 否决(每项目不同)/system.md 定位(所有 agent 注入——普通+工程)）

> 状态：**已实现（2026-09-04——双端——VS Code id:30 clean（L1 1070/1070）+ CLI id:33 clean（L1 1376/1328/0fail——锚逐字核验 802 字符一致（verbatim:true）——T-P1.1/1.2 绿——审计 clean + advisor 0🔴（无 fix——首审即终审））——评审 0🔴 token d3370478——6 项建议全处置（断言词/计数对账/证据/措辞/插入位置/独特词）——AC-P1.1 核销（AC-P1.2 双端同语义——802 字符逐字证据——父侧 L2 待全部批次后）**。

**需求（F-P1）**：作为用户，我希望大文件拆分有**标准方法**——agent 不再每次自创顺序——**先写后删**（安全——任何时刻代码有副本——反序"先删后写"崩溃即丢——不可逆）。
- **F-P1.1（先写后删）**：把要拆的段**整段原样写入目标文件**——再在大文件删除该段；
- **F-P1.2（段零改动）**：拆出段本身零改——只修 import 相对路径（新文件位置）——node:test/slow.mjs 自带；
- **F-P1.3（接线）**：大文件剩余引用拆出符号 → import；拆出段引用大文件符号 → 一并迁或 export/import 互通；
- **F-P1.4（验证）**：node --check + 相关测试 + 全量绿（孤儿体/断引用显性暴露）——**同一任务内完成**（不拆两批中间态——不可审计）。

**设计（D-P1）**：
- **D-P1.1（承载——system.md 层）**：两端 `src/prompts/system.md` 加 **Module Split Policy** 段（4 句逐字——英文——下面锚——语义锚两端——byte-identical 已取消——**评审 #5 插入位置：system.md 的 "How you work — while coding" 段——与 §14 D1 并行条款同段（既有 System.md 断言不依赖位置——定死防两端漂移）**）：
  > **Module Split Policy**: to split a large file — ① **write-first** — write the moved segment verbatim into the target file, then delete it from the source (code always has a copy; deleting first is irrecoverable on failure); ② logic body unchanged — only imports adjust (relative paths + new imports for referenced source symbols); ③ wiring — the source's remaining references to the moved symbol import it; the moved segment's references to source symbols move along or export/import back; ④ verify — node --check + related tests + the full suite go green, AND the test/assertion count before and after the split must match (broken references and orphan bodies surface explicitly; a silent drop of assertions is a split defect); complete the split inside ONE task (no two-batch intermediate states).
- **D-P1.2（测试）**：T-P1（fail-when-unchanged——system.md 含 "write-first" + "Module Split Policy"——落点 prompts.test.mjs（§18.14 D-T1.3 拆分后）——**随 §18.13/§20.8 同批**）
- **D-P1.3（范围）**：提示词层仅 system.md（不散 multi——普通+工程 agent 都注入——**子代理 inherit 已证实（评审 #3——setup.mjs:350-353：`systemPrompt = overlay + "\n\n" + base`——base=主 system.md——子代理以 system.md 为基底——spawn-child 不收编 overlay——证据牢）**）——不改 METHODOLOGY/AGENTS.md（每项目差异）。

**受影响文件（两端）**：`src/prompts/system.md`（Module Split Policy 段）+ 测试（prompts.test.mjs——拆分后）——AGENT-LOOP.md(§20.9 本节)；CHANGELOG(父侧)。

**测试（T-P1）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-P1.1 | N | 读两端 system.md | 含 "Module Split Policy" + "write-first" + "assertion count"（fail-when-unchanged——评审 #6 断言词改独特短语） |
| T-P1.2 | E | 回归——既有 system.md 断言 | 全绿（零破坏——其他段未动） |

**验收（AC-P1）**：AC-P1.1 = T-P1.1/1.2 绿；AC-P1.2 = 双端同语义（语义锚——各自照抄设计——父侧核销）。

> **实现记录（2026-09-05——CLI subagent-async.mjs 拆分执行——Module Split Policy 首例全量执行）**：`src/agent-tools/subagent-async.mjs`（1020 行 → 404 行）按 §20.9 纪律拆三文件——**subagent-scheduler.mjs**（230 行：§20 调度组 + 文件域组——normalizeFileList/filesOverlap/showFile/fileKey/depInfo/describeBlockers/queueRunnable/assertNoDepCycle/dependentLabels/refreshQueuedTokens/maybeRefillAsync——TODO L421 同向）、**subagent-actions.mjs**（415 行：executeStatusAction + touchedSummary/shortTouchedPath/statusFields、executePanelAction + panelFreezeGate/blockKeyIn、executeEscalateAction + touchedFilesNote）；主体保留 check/cancel（executeCheckAction/executeCancelAction + cancelAsyncSubagent——cancel 留主体使 mouse.mjs 零改动，且 actions 若含 cancel 组将超 500 硬限——执行重平衡）与 resolveChildProvider/常量/runChildPipeline/injectAsyncResult/buildChildRunOpts/mergeChildMutations。接线：subagent.mjs 两 import 块 + 文末 shim 按新归属改源（maybeRefillAsync 再导出源 → scheduler）；async 尾部 re-export shim（queueRunnable/describeBlockers——test/subagent-scheduler.test.mjs 动态 import 零改动转发链——freeze.mjs 先例）；双向回引（async↔scheduler：describeBlockers 族 ↔ ASYNC_SUBAGENT_LIMIT）仅调用期使用——无求值期循环。验证：node --check 全绿；迁移段逐字字节对拍（scheduler 230/actions 415/async 保留段全一致）；subagent 族 6 文件测试计数前后对拍零漂移（111 tests/109 pass/2 skipped 前后相同）；全量 1464 tests/1414 pass/48 skip——**2 fail 为本会话前未提交 WIP（cmd-think/autoThink T8b + compressFallback T3b——WIP-only 复现、单拆文件回退对照证与拆分无关）**；测试文件零改动。TODO.md L421 勾销属父侧。

### 20.10 checklist 多批跟踪强化（2026-09-04 · 用户观察——"普通模式 task 用得多——工程模式似乎没有"——用户"该强化一下"——追问"是否已写进提示词"→ 已存在（engineering.md:295-296 抽象句/METHODOLOGY Checklist/discipline.md:61）——**弱在抽象无触发场景**）

> 状态：**设计（2026-09-04——用户拍板强化——**2026-09-04 用户"放一放，等我想好了再说"——挂起（清单统一制方向未定——唯一制/分界/保持——评审未发起——恢复条件：用户给方向）**——实现随 §18.13/§20.8/§20.9 同批（engineering.md 与 §20.8 共享文件——调度排队）——动机：今天 9 批并行——checklist 未登记——上下文压缩后批状态全靠摘要——违 METHODOLOGY"checklist 常在——不依赖上下文"）**。

**需求（F-C1）**：作为用户，我希望工程模式下**每个批准的设计批 = checklist 一条**——状态实时迁移（in_progress/done）——**多批并行尤其**——不靠对话记忆/摘要。
- **F-C1.1（触发场景）**：设计立项（评审通过后）即 add；实现 spawn 即 in_progress；L2 核销 + commit 即 done；
- **F-C1.2（具体化）**：engineering.md:295-296 抽象句扩为带场景锚句——不再只是"Use checklist"。

**设计（D-C1）**：
- **D-C1.1（engineering.md 锚——两端语义锚——byte-identical 已取消）**——Hard Rules 两条扩为（英文逐字——评审 #2 惯例）：
  > - Use checklist (persistent) and task (per-session) tools to track progress.
  >   Every requirement maps to a checklist entry. In engineering mode, every
  >   approved design batch gets its own checklist entry: add it when the design
  >   is approved, mark in_progress when its eng-coder spawns, mark done after
  >   the parent-side L2 verification and commit — never rely on conversation
  >   summaries to remember batch state (the checklist survives compaction).
- **D-C1.2（测试）**：T-C1（fail-when-unchanged——engineering.md 含 "every approved design batch" + "checklist survives compaction"——落点 prompts.test.mjs（§18.14 拆分后）——随同批；
- **D-C1.3（范围）**：仅 engineering.md（工程模式——discipline.md 普通模式已有更细——不动）；METHODOLOGY 不改（其 Checklist 一节已够——工程模式版强化在 prompt）。

**受影响文件（两端）**：`src/prompts/engineering.md`（Hard Rules 锚扩）+ 测试（prompts.test.mjs——拆分后）——AGENT-LOOP.md(§20.10 本节)；CHANGELOG(父侧)。

**测试（T-C1）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-C1.1 | N | 读两端 engineering.md | 含 "every approved design batch" + "checklist survives compaction"（fail-when-unchanged） |
| T-C1.2 | E | 回归——既有 engineering.md 断言（多任务并行/标题卫生/T19 等） | 全绿（零破坏） |

**验收（AC-C1）**：AC-C1.1 = T-C1.1/1.2 绿；AC-C1.2 = 双端同语义（语义锚）。



### 21. 普通模式偏差审计（2026-09-04 · 用户需求——"普通模式也应该有文档，不过用户经常会忽视，agent 也会忽视……我希望审计的是：①口头指令落设计文档了吗？②实现和文档和口头指令一致吗？"）

> 状态：**需求+设计（2026-09-04——用户发起——评审待发起——实现随批（main.md/coder.md/discipline.md 提示词——与 §20.9/§14 system.md 同域——排队）——动机：普通模式 coder 交付——主代理验证（§13）只"读声称改动+跑测试"——无偏差检查——口头指令→开发（不落文档）→实现与口头偏离——静默无声）——2026-09-04 22:16 用户裁「先不做这个」——挂起——**2026-09-04 23:53 用户恢复（需求翻转：开发前也落档 + 完成后检查补写——普通模式继承工程模式文档纪律无豁免——F-N1.1 改自动补写 / D-N1.3 删排除转纪律 / F-N1.3 + D-N1.5 新增开发前落档）**——round1 评审 2026-09-04 0🔴 通过（token 87db7936）**，#1/#2 实现前必须处置 + #3/#4/#5 调和（round2 处置 2026-09-05 0:11 用户"都同意" + 0:34 用户"可以"：D-N1.1 锚加自动补写 / D-N1.5 补英文逐字锚（discipline.md 全英文）+ 删"搜索引擎" + 职责归主 agent / T-N1.4 断言改英文 + 新增 T-N1.5 零残留 / F-N1.2 四类偏差调和（超清单改动） + D-N1.5 完工时报告真实文档漂移）——**round2 复审 2026-09-05 0🔴 通过——批准**（token 260ea5fc…/designId 739e3ad6——六项修复声明核对落地——4 项 advisory：#1/#2 🟡 实现前处置（D-N1.1 锚中文内嵌 + 断言短语不逐字；F-N1.3 开发前落档句无断言）+ #3/#4 🔵——**处置待用户裁决**）——round3 处置 2026-09-05 0:51 用户"都修"（advisory #a/#b/#c 已修：D-N1.1 锚改纯英文+`add a short change record` 连续子串 ✓ / F-N1.3 补英文逐字锚 + T-N1.6 新增 + AC-N1.1 补 1/6 ✓ / D-N1.4 范围补 discipline.md ✓ + METHODOLOGY.md 2026-08-23 条 superseded as-of 注 ✓；#d 不修——F-N1.2 已注明等价）——实现待用户批准（依赖：prompts.test.mjs 落点 §18.14 拆分——排队）——恢复条件：用户发起**——**2026-09-05 用户"批准" → 双端 eng-coder 实现完成：CLI id:1 clean（audit CLEAN + advisor 0🔴 + 修正轮 0——L1 69/69）+ VS Code id:2 clean（audit CLEAN + advisor 0🔴 + 修正轮 1/5 位置微调——L1 61/61 + 全量 1134/1134）——父侧 L2 核销：CLI 1439/1391/0fail（48 slow skip）+ VS Code 1140/1140/0fail——T-N1.1/1.2/1.4/1.5/1.6 全绿 + T-N1.3 回归零破坏——双端锚文本逐位在档——AC-N1.1 ✓ AC-N1.2 ✓ AC-N1.3 ✓（零额外 LLM——纯提示词层）——验收全勾销（实现批确认后落档）**。
> **扩展注（2026-09-05 用户——"我希望普通模式编码完成后能检查一下产出与设计是否一致，不一致要修正"）——F-N1.4 修正闭环（把"上报"升级为"修正"）**：§21 既语义止于"偏差上报用户"——普通模式主 agent **自编码**场景无"核对→修正"闭环；本扩展把**实现偏差的处置从上报升级为修正**：完成宣布前对照拥有设计文档核对产出 → **实现偏差（部分实现/静默简化——四类偏差口径前两类）由主 agent 修正至符合设计后再宣布完成**；**真实文档漂移/超范围改动（后两类）→ 报告用户——不擅自改设计**（§18 同口径——文档修订归父侧——设计层 > 实现，R7b）。落点：① main.md "How you finish" 区新增主 agent 完成前核对条款（自编码场景）；② main.md D-N1.1 锚尾追加修正分句（子代理交付验证同升级——implementation deviations are fixed (by you, or sent back to the coder) before the delivery counts as done）；③ coder.md D-N1.2 自查行尾追加修正分句（Fix implementation deviations ... so the delivery matches the doc before reporting）。**零额外 LLM 保持**（核对复用完成前既有读/verify——N-N1 不变——不 spawn 独立审计）。测试：**T-N1.7**（main/coder 新子串 fail-when-unchanged——"reconcile the delivery against the owning design doc" / "implementation deviations are fixed" / "Fix implementation deviations"）。**实施**：2026-09-05 直接实施（CLI + VS Code byte-identical 镜像 + T-N1.7 双端绿）。
> **扩展注 2（2026-09-05——记忆清空实验 → 纪律固化——用户"我清除记忆就是为了找出那些纪律应该被写进提示词才能覆盖所有人"）**：清空记忆后本会话 edit 工具 12 条失败记录中 8 条 = 空白差异、4 条 = 猜哈希——此前这些行为由**个人记忆规则兜底**（rule: edit 纪律/失败重试纪律——已随记忆清除而失效）——证明"只存记忆的纪律只覆盖一台机器一个会话"。**固化三条进 discipline.md（双端 byte-identical + T-N1.8 锚断言 fail-when-unchanged）**：① 新鲜读来源（old_string/行号/hash 只来自最新 read——never reconstruct from memory）；② hash 来源（hashline old_hashes 只来自 read(hashes=true)——错误里拷真 hash——never invent one）；③ 重试上限（报错即修法——第一次照做；第二次同形失败 = 重读文件/读实现——never retry the identical input a third time）。配套工具侧：edit 空白差异自动落点（TOOLS.md §14.2 P15.11——内容零差异的机械损耗由工具兜底）。
> **扩展注 3（2026-09-05——普通模式两段式——用户"把 coder 用起来……主 agent 设计好了以后交给 coder 去开发，最好异步……回来主 agent 检查，这样就解决了自查的问题"——F-N1.5）**：§21 审计的最大盲区 = **审计者与执行者同一心智**（自查抓不到"执行者真心认为合理的静默简化"）。F-N1.5 引入**执行/检查分离**：规模实现批次默认走 coder 子代理——设计心智（主 agent）与实现心智（coder——隔离上下文从零读磁盘事实建模型）分离，复核时偏差显形。判据与流程：
> **扩展注 4（2026-09-05——委托操作标准 F-N1.6——用户"spawn coder 干活现在并没有明确的标准是吗"——四连 spawn 临场暴露：任务书三份三种结构、委托全靠主 agent 手感——补操作层标准）**：
> - **规模判据（可操作——F-N1.5 "规模批次" 量化）**：委托 = 改动面 ≥2 文件 **或** 单文件逻辑改动 >30 行 **或** 涉模块边界/导入面 **或** 涉双端镜像（任务书覆盖两端）；内联 = 单文件 ≤30 行逻辑 **或** 纯文档/提示词同步（byte-identical 双端文本——主 agent 全上下文——coder 需重读海量文档找位——成本不成比例）**或** 探索性/需连续交互；
> - **任务书标准结构**（每次 spawn 必带——缺字段 = 委托缺陷——coder 会重探索父已探索过的）：① 目标（做什么 + 为什么——背景/设计引用）② 已知事实（路径级结构/消费者/父侧探索移交——防重复探索）③ 设计要点 + 明确禁止（不碰清单外文件/冲突 STOP 不静默选一）④ 约束（引用专用纪律——Module Split Policy 等——+ 通用只动 files 域）⑤ 验收（**硬——机器可核验——可执行命令/阈值/断言对拍**——软验收词 "合理/做好" 禁用）⑥ 交付报告要求（Done/Simplified/Not done 表格 + 偏差说明）⑦ 调度元数据（files/dependsOn——声明即契约）；
> - **委托模式判据**：async 默认（F-N1.5）；sync 仅当后续动作必须依赖其产出且无其他事可做；并行多 spawn 仅当文件域互斥 + 验收独立 + 任务同构或同批（今天 4 连 spawn = 同构双端 × 依赖链）；串行依赖用 dependsOn 表达（队列自动——不手动排程）；
> - **通用验收基线**（普通 coder——不因批变）：verify（语法 + 相关测试）+ F-N1.4 对照设计书 + node --check + 测试文件零改动（纯迁移批）+ lint 全量；
> - **复核协议（父侧）**：读声称文件 → 跑相关测试 → 硬验收对拍（任务书有阈值时）→ 对照设计书核偏差（F-N1.4）→ 偏差退回 coder ≤2 轮 → 方向分歧上报用户。
> - 锚：main.md "Sized delegation without these fields is a defect"（T-N1.10）。
- **判据（规模批次 = 多文件/跨模块/有已确认设计书）**：默认 spawn coder（`async: true`——设计书为 task book）；小改动/探索性/需连续交互的改动保留主 agent 内联（防"委托崇拜"空耗）；
- **复核**：F-N1.4 现成条款执行（读声称文件 + 测试 + 对照设计书）——偏差退回 coder（≤2 轮）或主 agent 修小偏差；方向性分歧上报用户；
- **不重复条款**：coder.md §7.3 中立性已含等价条款（设计冲突 STOP 上报——不静默适配——2026-09-04 人格锚）——本注只加 main.md 委托默认句（英文锚 "implemented by a coder subagent BY DEFAULT" / "spawn async with the design as the task book"——T-N1.9）；
- **成本取舍**：实现批次 token 增 2-4×（coder 全回合 + 复核读）——换取独立性；判据句挡小改动无谓委托。**实施**：2026-09-05 直接实施（双端 main.md + T-N1.9 + 本注——纯提示词/文档层）。

**问题（P-N1）**：普通模式无偏差审计——工程模式的 explore 审计（§18）只覆盖 eng-coder——普通模式 coder 交付：①用户口头指令常未被落文档（用户忽视+agent 忽视）；②实现与口头指令/文档偏离无人对照——静默简化漏——主代理验证只确认"文件改对+测试过"——不查"方向对不对"。

**需求（F-N1——用户原话转录）**：作为用户，我希望普通模式**交付后审计两件事**：
- **F-N1.1（指令落文档审计）**：审计**用户口头指令是否已落设计文档**——未落 → **自动补写**（完成时对照所属设计文档——未落 → 主动补一段"变更记录/决策说明"——文档地图定位归属——普通模式与工程模式同款纪律：**代码变更都必须落文档，无豁免**）；
- **F-N1.2（三向一致审计）**：审计**实现 ↔ 文档（若有）↔ 口头指令** 一致——四类偏差**同工程模式口径**（部分实现/静默简化/文档漂移/超清单改动——第四类"超范围"与 §18 的"超清单改动"等价：跨越任务书/设计文档许可的文件与行为——评审 #3 调和）；其中"文档漂移"**复用 §18 定义**（真实文档漂移 = 设计本身需改 → 写入交付报告——文档修订归父侧，见 §18.2 round5 #5），普通模式另含**指令↔文档维度**（指令有但文档无——F-N1.1 捕获；文档有但实现无——方向偏）；
- **N-N1（成本——零额外 LLM）**：普通模式主代理验证（§13 verify）**本就要读声称改动文件**——将"读"升级为"对照读"（对照任务书指令 + 板块设计文档）——**同一轮读完成审计**——不加 LLM 调用——审计结果并入交付复核报告（普通模式 ≠ 工程模式——不 spawn 独立 explore 审计——主代理顺手核）。
- **F-N1.3（开发前落档——2026-09-04 用户补需求）**：作为用户，我希望普通模式**开发前也落文档**——不管多小的改动——开发前先定位文档归属（docs/design/README.md 文档地图→所属板块文档），已有 → 写变更段/设计注；无 → 新建文档并登记地图——**然后才动手编码**——无豁免（普通模式与工程模式同款纪律）；

**设计（D-N1）**：
- **D-N1.1（主代理条款——main.md Delegation 段/§13 验证段扩——评审 #1 英文逐字锚/#4 文档地图/#3 协调**：主代理验证 coder 交付时——对照①本轮用户指令（会话历史——口头）②板块设计文档（**先查 docs/design/README.md 文档地图（§12）定位归属文档——若存在**）——查三向一致 + 指令落文档（F-N1.1/1.2）——结果进交付复核（偏差→报告用户；无偏差→正常）——**零额外 LLM（读是既有动作）**；**英文逐字锚（维护：挂 §13 验证句后）**：
  > **When verifying a subagent delivery, also check: (a) whether this round's user instruction landed in the board design doc (docs/design/ — locate the owner via the doc map); if not, add a short change record to the owning doc, locating it via the doc map (变更记录/决策说明 appended to that doc); (b) whether the implementation matches the design doc (if any) AND the user instruction — deviations (partial implementation / silent simplification / doc drift / out-of-scope) go to the user. Zero extra LLM — the verification reads the claimed files anyway; compare against the instruction and the doc in the same pass.**
  （**评审 #3 协调**：main.md 同段已有 §20.7 D-PS1 锚（当前 :17——本批挂其后——不替换——实现批任务书注明合并文本 = §20.7 锚 + §21 扩句）；
- **D-N1.2（coder 自查项——coder.md 交付表扩——评审 #1 英文逐字锚**：coder 交付报告加一致性自查行（非执行——报告可含——主代理复核为准）；**英文逐字锚**：
  > **- consistency self-check: does the delivery match the task instruction and the board design doc (if any)? Report deviations explicitly.**；
- **D-N1.3（纪律——评审 #5 明示取舍**✝**，2026-09-04 用户翻转）**：普通模式继承工程模式同款纪律——**代码变更都必须落文档，无豁免**（无"改动太小免文档"通道）——开发前落档（F-N1.3 定位归属）→ 编码 → 完成后检查补写（F-N1.1 自动补写）——**无文档的"日常开发"不存在**（✝ 原"落档行为机制不在本批"已删除——2026-09-04 用户裁定）；
- **D-N1.4（测试）**：T-N1 系——main.md/coder.md/discipline.md 语句断言（fail-when-unchanged——prompts.test.mjs——拆分后落点）。
- **D-N1.5（开发前落档条款——discipline.md 强触发——2026-09-04 新）**：
  - **discipline.md（M/S 级改强触发——英文逐字锚）**：
    > **- Medium (2-3 steps, refactoring): Read the docs → Plan → Change → update the owning doc — a decision or completed change is recorded there (no gap-spotting trigger; small changes are documented too). No design doc needed. Use `task` tool.**
    > **- Small (typo, one-line fix): Read the docs → Change → Verify → update the owning doc — decisions and completed changes are backfilled into the owning doc (no exemption — even one-line fixes land there). Use `task` tool. No design doc.**
  - **main.md/coder.md（开发前落档职责归主 agent——§11 确认流程合流——评审 round2 advisory #2 补断言）**：主 agent 在执行本轮任务前定位文档归属（文档地图 → 所属板块文档），已有写变更段、无则新建并登记地图——然后才派发/编码——不用 coder 子代理承担落档（避免扩界）；**英文逐字锚（维护：挂 main.md §11 开工前确认段尾 / coder.md 任务书段）**：
    > **- before you start coding, locate the owning design doc for this change (docs/design/ — via the doc map); if it exists, note the change in it (变更记录/设计注); if not, create it and register it in the map. Then code. No exemption — even one-line fixes.**；
  - **完工时**：主 agent 对照所属文档检查——指令落档没 + 实现与文档一致（F-N1.1/1.2 审计 + F-N1.3 补写）——没落的补写（D-N1.1 锚 "add a short change record"）；**实现与文档不一致（真实文档漂移）→ 报告用户而非擅自改文档**（与 §18 同口径——文档修订归父侧）；

**受影响文件（两端）**：`src/prompts/main.md`（D-N1.1 条款）+ `src/prompts/coder.md`（D-N1.2 自查行）+ `src/prompts/discipline.md`（**D-N1.5 强触发——M/S 级句改英文前档**）+ 测试（prompts.test.mjs——§18.14 拆分后）——AGENT-LOOP.md(§21 本节)；CHANGELOG(父侧)。**不改**：§18（工程模式流程不动）/explore 审计不动（普通模式轻量——主代理顺手——非独立 LLM）。

**测试（T-N1）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-N1.1 | N | 读 main.md | 含英文逐字锚 "landed in the board design doc" + "add a short change record"（自动补写）+ "deviations (partial implementation / silent simplification / doc drift / out-of-scope)"（fail-when-unchanged——评审 #1 改英文短语——评审 round2 #1 补补写短语——advisory #a 改纯英文锚对齐 token） |
| T-N1.2 | N | 读 coder.md | 含英文逐字锚 "consistency self-check"（fail-when-unchanged——评审 #1 改英文短语） |
| T-N1.3 | E | 回归——既有 main.md + coder.md 断言（§20.7 D-PS1/§7.3 T-SP 系等） | 全绿（零破坏——评审 #2 补 coder.md） |
| T-N1.4 | N | 读 discipline.md | 含英文锚 "update the owning doc — a decision or completed change is recorded there" + "small changes are documented too"（D-N1.5 强触发——fail-when-unchanged——评审 round2 #2 改英文断言） |
| T-N1.5 | E | 读 discipline.md | **不含旧条件句 "if you spotted a gap"**（零残留——旧 M/S 弱触发已替换——评审 round2 #2） |
| T-N1.6 | N | 读 main.md + coder.md | 含英文锚 "before you start coding, locate the owning design doc" + "register it in the map"（开发前落档——F-N1.3——fail-when-unchanged——advisory #b 补断言） |

**验收（AC-N1）**：AC-N1.1 = T-N1.1/1.2/1.6 绿；AC-N1.2 = T-N1.3 绿（零破坏——main.md + coder.md）；AC-N1.3 = 审计零额外 LLM（**机制锚点——评审 #6**：不新增工具/不 spawn explore/不改 §13 验证路径——§21 设计即满足——主代理读数时顺手对照——实施后可由实现批在验证中确认）。


### 21.1 调度器环形死锁修正（2026-09-04 · 用户"环形死锁的问题你得先处理一下"——两次实证 id:26/27、id:32/33——根因代码级确诊）

> 状态：**已实现（双端——2026-09-04——VS Code id:35 clean（L1 1074/1074）+ CLI id:34 clean（L1 1379/1331/0fail——T-SL1/2/4 绿 + T-SD1..14 回归——审计 clean + advisor 首审/复评 0🔴——修复轮 >=\=/Number()/死导入）——评审 0🔴 token 84b9dae8——AC-SL1/2 核销 + AC-SL3 双端同语义——混合边残留 + 行数债见 TODO——父侧 L2 待全部批次后——**全部批交付完成——待父侧 L2 + 用户重启**）**。

**问题（P-SL1——根因证据）**：`queueRunnable`（subagent-async.mjs:820-835——D-SD4 补位判据）与 `describeBlockers`（:797-806）对域冲突检查：

```js
if (e.status !== "running" && e.status !== "queued") continue
if (filesOverlap(myFiles, e._files ?? [])) return false   // 831——queued 也阻断
```

**queued 也一律 return false → 两个 queued 同文件(如都含 test/prompts.test.mjs)互相阻断 → A 等 B、B 等 A → 环形死锁**——两次实证(id:26/27、id:32/33——用户两次发现"后台调度卡住")。**与注释意图矛盾**（:818-819——"先入者启动后以 running 身份继续挡住后入者；后入者只被先入者阻塞"——**注释写对了——代码缺"先入/后入序"判断**——实现 bug 非设计 bug——D-SD4 设计意图完好）。

**需求（F-SL1——用户原话）**：作为用户，我希望**两个排队任务同文件不互等**——同文件串行 = **先入者先启动、后入者等先入者**——不自锁。
- **F-SL1.1（序判定）**：域冲突阻断**只适用于"先入者"**（spawn 序早于当前任务的 queued）与 **running**——**后入者（晚于当前任务）不阻断**——用池条目 id（= spawn 序——数字递增——已核实 `:102/:236/:920`）数值比较；
- **F-SL1.2（队列序保证）**：先入者启动后转 running——**继续挡后入者**（running 永远阻断）——自然串行——无需额外状态；
- **N-SL1（零破坏）**：单任务/无冲突/依赖序行为零改——仅"两个 queued 同文件"场景从死锁变串行。

**设计（D-SL1）**：
- **D-SL1.1（queueRunnable 修——3 行）**：:831 return false 前加序判定：
  ```js
  if (e.status === "queued" && Number(e.id) > Number(entry.id)) continue // 后入者不阻断——先入者先启动
  ```
  （running 照旧阻断——任意序；先入者 queued 也阻断——它先启动——id 形态防御：Number() 归一数字/数字字符串——非数字 → NaN → 比较 false → 不跳过——fail-closed 与旧行为一致——id:35 先例）；
- **D-SL1.2（describeBlockers 同步——展示一致）**：:804 同样序判定（只列"会真正阻断我的"——后入者不列——避免 status 显示误导"等一个其实等不到的人"）；
- **D-SL1.3（测试）**：T-SL 系——两 queued 同文件：①小 id(先入)准入允许(不被后入阻断)+ 后入者准入拒绝(被先入 running/queued 阻断)——串行无环；②既有 T-SD1..14 回归零破坏；③无冲突场景不受影响。——**已知限制（评审 #4——2026-09-04 补充）**：先入者 **depc 锁定**（依赖被取消——永不自动启动——§20 NF-SD"滞留有意——显式可清"）时——后入同文件条目**滞留等待先入者**（cancel 先入者即释放——避免误判为新死锁——实现侧注释同义落（queueRunnable——id:34））；

**受影响文件（CLI）**：`src/agent-tools/subagent-async.mjs`（D-SL1.1/1.2）+ `test/subagent-scheduler.test.mjs`（T-SL 系——拆分后域文件）；AGENT-LOOP.md(§21.1 本节)；CHANGELOG(父侧)。**VS Code 镜像**（同构——subagent-async.mjs 同修——同批）。

**测试（T-SL）**：

| # | 类别 | 输入 | 预期输出 |
|---|---|---|---|
| T-SL1 | N | 两 queued 同文件（先入 id=2/后入 id=3） | 先入可启动（不被后入阻断）；后入等先入（阻断）——不互等 |
| T-SL2 | N | 单任务无冲突 | 准入正常（零破坏——回归） |
| T-SL3 | E | 既有 T-SD1..14 | 全绿（零破坏） |
| T-SL4 | A | 三 queued 同文件链 | 按序逐一启动——无环（先到先得） |

**验收（AC-SL）**：AC-SL1 = T-SL1/T-SL4 绿（无环+串行序）；AC-SL2 = T-SL2/T-SL3 绿（零破坏）；AC-SL3 = 双端同语义（镜像修）。


> **扩展注 P-SL2（混合边环形等待残留——TODO L434——2026-09-05 立项 C——用户"按你的推荐做"——停滞机械检测）**：§21.1 修复覆盖**纯文件边互等环**（id 序判定破环）；残留场景 = **依赖边 + 文件域边跨类型成环**——`A(files X, dep C)` + `B(files X)` + `C(dep B)`：B 等 A（文件——A 先入占 X——序判定合法）、A 等 C（依赖）、C 等 B（依赖）——**单边检查各无违例——组合即停滞**——无 running、全 queued、每任务 blocker 均落 queued 集内。**非静默**（check 守卫返回明确错误——人工 cancel 可解——advisor 首审标既有形态 🟡）。
>
> **需求（F-SL2）**：作为用户，我希望排队整体停滞（不可自行解除的等待闭包）被**机械检测并明确报错**（列阻塞链）——而非等模型发现"等了很久没动静"。
> - F-SL2.1：池无 running 且 queued ≥1 且**每个 queued 的 blocker（files 冲突者 + 未 settle 依赖目标）都落在 queued 集内**（阻塞闭包无外逃）→ 停滞；
> - F-SL2.2：**保守不误报**——合法等待不报：有 running 锚点（依赖链正常排队）；dependency-cancelled/failed 等待（外部决策可解——§20 NF-SD 滞留有意）；单 queued；正常文件串行（blocker 含 running）。
>
> **设计（D-SL2——实现落点 = 拆分后的 subagent-scheduler.mjs——2026-09-05 拆分批交付后实现）**：复用 describeBlockers 的 blocker 计算——新增停滞判定（check/status 守卫与 maybeRefillAsync 空转检测处调用）：running 数 = 0 && queued ≥2 && 每 queued 的 blockers ⊆ queued 集 && 无 dep-cancelled 标记 → 返回停滞错误 + 逐条阻塞链（`B → A（files X——先入者）→ C（dependsOn B）→ B` 形态）——引导 cancel 破环重派。判据收窄保证零误报代价 = 部分形态停滞漏报（接受——宁可人工发现不可机器误打断）。
>
> **测试（T-SL2）**：① 混合环构造 → 停滞报错含链；② 正常依赖链（running 锚点）不报；③ dep-cancelled 等待不报；④ 合法文件串行不报；⑤ 既有 T-SD/T-SL 回归零破坏。**验收（AC-SL2）**：T-SL2 全绿 + 零误报用例全绿——**已实现双端（2026-09-05——CLI scheduler 27/27（22 既有 + 5 新增）+ VS Code scheduler 19/19（17+2）——全仓 0 fail（CLI 1469/VS Code 1135）——断言净增对拍（CLI +5 用例/VS Code +27 断言）——实现注见下（CLI 批）+ VS Code 批记录于 VS Code 仓 CHANGELOG Unreleased——可达性分析注：D-SL1 序判定后自然 spawn 流 wait 边恒指更小 id——混合环仅人工注入可构造——检测为防御性（T-SD5 同族）**。
>
> **实现注（2026-09-05——CLI 批 P-SL2——双端同批中本仓侧）**：落点 `src/agent-tools/subagent-scheduler.mjs`——新增 `detectStall(parent)`（判定 = running 0 && queued ≥2 && 无 depc 标记条目 && 每 queued 的 blocker ⊆ queued 集且非空——blocker 计算与 describeBlockers/queueRunnable 同界同序判定——复用 filesOverlap/depInfo/showFile——链 = 沿每 queued 的首个 blocker 走到首个重复节点闭环——每节点自带"等谁+为何等"注（`coder#2（files x.mjs——先入者） → coder#1（dependsOn 3） → …`——信息同 D-SL2 示例——注位自源节点——读取无歧义））+ `STALL_NOTE` 引导常量。调用点（侵入最小组合——maybeRefillAsync 空转处不调用：refill 嵌 settle/cancel 链无模型可见输出通道且抛错有副作用风险）：subagent-async.mjs check 守卫 ①（target 级——停滞时返回 stall:true + 本任务链 + 引导注记）与 ②（arrival-order——停滞时错误列逐条阻塞链 + cancel 引导）——不满足停滞判据的形态维持原文本逐字（T-SL2-③/⑤ 断言零变化）；subagent-actions.mjs status 视图——overview 级 `stall.chains` 标记 + 单条目 `stall.chain`（仅停滞池出现——正常路径字段零变化）。测试追加 test/subagent-scheduler.test.mjs（T-SL2 ①-⑤ 五用例——只追加零修改——断言对拍：该文件 pass 22 → 27 净增 = 新用例数——全仓 1469 tests 0 fail）——混合环仅人工注入可构造（spawn 序 wait 边恒指向先入者——T-SD5 同族防御）——判据按状态不依赖可达性论证。链注位与 D-SL2 示例手写形态的差异（示例中间跳注位不一致——实现取每跳自源节点注）为展示细节——AC-SL2 语义全对齐。