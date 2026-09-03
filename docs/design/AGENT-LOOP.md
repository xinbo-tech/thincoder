# Agent 主循环设计（thincoder/src/agent.mjs + agent/）

> 状态：2026-08 回补 + 2026-09 增量（挂起回合 §17/工程交付协议 §18/工具面合并 §19——各节自带状态——2026-09-03 刷新）。LLM ↔ 工具调用循环：回合驱动、guard 体系（pending tasks / verify / advisor / 诚实声明）、中断语义、子代理、压缩/用量锚点、停滞检测、goal 预算。

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
- `controller.abort()`（Ctrl+C abort / /abort）：当前 chat 抛 AbortError → runAgent 直接上抛，不提交半截历史
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
**Phase 2 执行**（**顺序保序**）：只读工具 + `parallel` 标记的工具可并行（Promise.all 一批），非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前副作用工具 `snapshotForUndo`（/undo 回滚基线）；结果超限落盘 `~/.thincoder/tool-results/`（阈值以 TOOL-OUTPUT-LIMITS-*.md 为权威源 + `agent/helpers.mjs` TOOL_RESULT_OFFLOAD_LIMIT 常量，round3 #3 去重——此处不再复述取值沿革）+ 2K 预览；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace 防路径泄露）；PostToolUse 钩子 fire-and-forget。**console 回显（2026-08-31 工具顺手度，用户批准"你做吧"）**：dispatch 拦截工具 `execute` 期间的 `console.log`/`console.error`（原只到终端、模型看不到），收集后附在工具结果后回显给模型（`[console during <tool>]` 段）；异常路径（工具抛错前的探查输出——调试最有价值）同样回显；嵌套 dispatch（subagent）各自拦截/恢复、捕获分离；bash 工具输出走子进程回显（onOutput）不受影响。

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
- **Available roles 矩阵**：explore（只读查询族/自动注入 git 上下文/报告须列未找到项/thoroughness 三档）、plan（纯只读规划）、coder（父全量读写执行 + verify/advisor 自评 + 强制交付表）、eng-coder（工程模式替换 coder + 设计驱动 overlay + 必带 designToken）
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
- **事件名 × 发射点 × 载体矩阵（round2 #3 修订，消歧；code review #7 补 §15 例外）**：`⟦ev⟧` token 常规只有两种——`turn`（runAgent depth>0 在 `_currentTurn` 更新处发，phase=llm，{n}/{max} 必填）与 `approval`（dispatch.mjs 权限询问处发，{n}/{max} 取子 agent 当前 turn 计数）；**tool/done phase 不发 token**——由既有 onToolCall/onToolResult 前缀 relay 承担（TUI 前缀分支更新 currentTool 与 done 状态，即 D4）。**§15 例外：`done`**——仅 async 子代理回合收尾集合完成后由 agent.mjs 发（见 §15 D-A3；**§17 D-S8 修订：挂起态延迟至池空冻结补发，round2 #1**），TUI 冻结区块信号（同步子代理的 done 仍由 onToolResult 前缀 relay 承担）。phase 枚举中的 `tool/done` 描述的是头部状态机的输入来源之一，不是 token 种类。
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
- **F6 · 空态**：无运行中区块时面板不渲染（无悬空分隔线——现状分隔线逻辑迁移到面板边界）
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
2. 无运行中区块 → 面板不渲染（无悬空分隔线）
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
| T2 空态 | 无 running | subagentH=0，面板不渲染 |
| T3 压缩链 | 小终端（rows 不足） | 面板先压至 0；conv ≥1、inputBox/status 保留 |
| T4 面板渲染 | 2 个并行子 agent（折叠态） | 顶部分隔线 + 各区块折叠头 + tail 3 |
| T5 面板点击 | 点击面板内折叠头 | 切换展开/折叠；展开超限 → ▲▼ 翻窗 |
| T6 滚轮穿出 | 面板上滚动（未命中区块内容行） | 会话滚动（面板不动） |
| T7 块内滚动 | 展开区块内容行上滚轮 | 块内滚动（不滚会话） |
| T8 冻结回归 | 子 agent 完成 | 面板移除该区块 + 流内 ✓ 头（既有冻结语义——§7.2 D4 完成态/T-I，评审 #6 改引用） |
| T9 折叠保持回归 | turn 切换 | sub-{key} 折叠状态保持（既有断言） |


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
4. 其余各条（并行不编辑同一文件、失败就收窄重试或自己做、escalate EARLY、冲突时自己读代码仲裁）保持不变。

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
- **F3 · 子代理并行**：相互独立的子任务一次 spawn 多个（subagent 并行执行；**同一文件编辑冲突例外**——不并行派发到同一文件的编辑）
- **F7 · 多项目独立变更并行（用户补充 2026-09-01：monorepo 场景实证——"变更两个子项目时明显应该分两个子 agent，但实际上很少这么做"）**：变更横跨多个**独立子项目**（如 thincoder / thincoder-vscode——不共享待改文件、无交叉依赖）→ **按项目拆分并行子 agent**（每项目一个，各改各的、各自跑自己的测试）——**触发条件（全部满足才拆）**：① 子项目互相独立（不共享待改文件）；② 改动无耦合（A 的输出不是 B 的输入）；③ 各自有独立测试可自验——任一不满足 → 不拆（主 agent 串行协调或单 agent 处理）
- **F4 · 会诊并行**：consult 多模型独立并行（已有——不动）
- **F5 · 不并行边界（必须写明，防滥用）**：① 写**同一文件**（冲突）；② **依赖链**（前一步输出是后一步输入——串行必然）；③ **bash/审批敏感命令**（执行器串行 + 并行 = 审批风暴——多个权限弹窗）；④ **同一 git 仓库并发 git 命令**（仓库锁冲突）；⑤ **有状态操作**（session/权限/队列——串行）
- **F6 · 收益判断**：并行化**大操作**（用户等待收益可见）；**微操作**（<1s 级）不并行（启动/上下文成本 > 收益）——"尽可能"不等于"无脑全并行"

**非功能性需求**：
- **NF1 · 两端 byte-identical**：CLI + VS Code `src/prompts/system.md` 条款逐字一致（既有纪律延续）
- **NF2 · 零执行器改动**：机制已存在（dispatch 批并行）——本需求纯提示词条款 + 文档，**不改 dispatch.mjs/执行器**
- **NF3 · 测试**：两端各自断言 system.md 含并行化条款（照既有 system.md 内容断言测试的 `readFileSync` + `assert.match` 模式——评审 #2 改符号引用弃行号）+ 既有测试全绿（无行为变更——纯提示词）

**范围边界**：`src/prompts/system.md`（两端）+ AGENT-LOOP.md（本文档 §14）+ 两端提示词内容断言；不改执行器/工具；VS Code 端提示词同步（byte-identical 纪律）。

**设计（2026-09-01）**：

**D1 · system.md 条款**（"How you work — while coding" 段，现有并行条款（"When you need multiple independent pieces of information, call tools in parallel…"）之后追加——英文提示词惯例，两端 byte-identical——评审 #2 改锚点引用，弃行号）：
> - **Parallelize aggressively:** send multiple independent tool calls in one response (read-only batches run concurrently); use the `edits` array for independent multi-file changes; spawn multiple independent subagents at once — including splitting changes across independent sub-projects (e.g. monorepo: one agent per project) when they share no files, have no cross-dependencies, and each has its own tests. Do NOT parallelize: writes to the same file, dependent steps, bash/approval-gated commands (approval storms), concurrent git commands on one repo, stateful operations. Parallelize big operations; skip micro-parallelism (<1s ops).

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
- id 分配：复用既有 counter（`_subAgentCounter` 同一序列，`role#N` 与 TUI 区块 key 一致——async 子代理的 TUI 面板行为不变，relay 照常流式显示）

**D-A2 `subagent_check` 工具**（新增，`src/agent-tools/subagent.mjs`）：

- 参数：`id`（可选——缺省 = 任意下一个完成，**arrival order**：多个 async 时按完成顺序返回最快的；带 id = 等特定子代理——含 queued 项先等启动）、`n`（必填——**1-based 递增读数**：`n` 计数器为 agent 对象 **per-run 字段**（随 runAgent 非 resume 重置；turn-end 清空后下轮首调重置 1）；**校验：`n !== lastN + 1` → `{ status:"error", error:"invalid read counter — pass n = lastN+1" }`**（乱序/重复 n 拒绝，防模型空转）；**超过 `MAX_ASYNC_CHECKS = 3` → `{ status:"error", error:"check limit exceeded — use turn-end auto-wait for the rest" }`**——consult 同款防循环，评审 #1 补定义）；**工具声明 `readonly: true`**（评审 #6——consult_check 先例，planMode 门控需要）
- 语义：**阻塞到目标完成**（带 id：等该 id——含 queued 项，先等它启动再等完成；不带 id：等 running 集合中下一个完成的）——返回 `{ id, role, status: "done", report }` 或 `{ id, status: "error", error }`（**含错误路径：id 未知/已消费 → `{ id, status: "error", error: "unknown async subagent id: <id>" }`**——评审 #5）；子代理全完成且已消费 → 返回 `{ done: true }`（consult_check 同款终结语义）
- 实现：`_asyncSubagents` Map + 每项 `{ role, promise, report, error, done }`；check 对未完成项 `await promise`（Promise.race 于目标集合）；消费后从 Map 删除；**上限指标 = running 数**（`done` 项不计入，与 D-A1/T6 一致）
- 描述引导：工具 description 写明用法——"spawn async 后可以继续其他工作（检查/读文件），最后用 subagent_check 取结果；多个 async 时先完成先返回"

> **§19 修订（2026-09-03 round2 批准时标注）：`subagent_check` 工具退役——并入 `subagent` 工具 `action:"check"`（语义原样保留——arrival order/阻塞/n 计数/消费删除——见 §19）——本 D-A2 保留为 as-of 快照**
**D-A3 回合收尾自动等待**（`src/agent.mjs` runAgent finally）：

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
| T5 | ✓ 回合收尾（~~旧语义：finally await 全部 + 清空~~——**被 §17 D-S1 取代：collectSettled 收已完成注入 + 未完成移交池**，round2 #1） | async 未 check + runAgent 自然结束 | §17 落地后：回合自然结束不等待；已 settle 注入 + 未 settle 保留池 | §17 D-S1 |
| T6 | ✓ 槽位队列（超限入队） | 第 5 个 async spawn（4 个 running） | **入队**：返回 `{id, status:"queued", position:1}`，不拒绝；前 4 个不受影响 | F5/D-A1 |
| T10 | ✓ 腾槽补位 | 第 5 个入队后，1 个 running 完成（promise settle） | 队列头部 queued 项**自动启动**（status→running，position 释放）；无需模型再 spawn | F5/D-A1 |
| T11 | ✓ 队列位置 | 第 6、7 个 spawn（5 在跑/队） | position 递增（1、2）；位置信息随 spawn 返回可见 | F5/D-A1 |
| T12 | ✓ check 错误路径（评审 #5） | check 未知 id / 已消费 id | `{id, status:"error", error:"unknown async subagent id: <id>"}` 不悬挂 | D-A2 |
| T13 | ✓ n 超限（评审 #4） | check 第 4 次调用（n=4 > MAX_ASYNC_CHECKS=3） | `{status:"error", error:"check limit exceeded — use turn-end auto-wait for the rest"}` | D-A2 |
| T14 | ✓ 乱序/重复 n（评审 #1） | check 传 n=1 后再次 n=1（未递增） | `{status:"error", error:"invalid read counter — pass n = lastN+1"}`；不消费结果 | D-A2 |
| T7 | ✓ 默认阻塞回归 | 不带 async 的正常 spawn | 行为与现有一致（阻塞等报告）——既有 subagent 测试全绿 | F4 |
| T8 | ✓ 中断 | async 运行中 Ctrl+C | abort 传播；收尾不再等待（error 带中断语义） | D-A3 |
| T9 | ✓ 上限纪律同步（评审 #4） | 读 engineering.md | 含 "Cap: at most 4 concurrent eng-coders" + "past 4"（两端 byte-identical） | F5/D-A4 |

**验收**：AC1 = async spawn 不阻塞主会话（T1/T2）；AC2 = 多 async 先完成先取（T3/T4）；AC3 = 回合结束未取结果不丢（T5——**§17 落地后语义 = 未 settle 移交池 + 下轮 D-S3 注入，round2 #1**）；AC4 = **槽位队列：超限入队不拒绝（T6）+ 完成即腾槽补位（T10）+ 位置信息（T11）** + 同步 spawn 上限 3→4 生效（T9：`engineering.md` 内容断言含 "Cap: at most 4 concurrent eng-coders" + "past 4"——照 §16 T-B4 模式）；AC5 = 默认阻塞零回归（T7 + CLI 全量 + lint 绿）——**§18 修订：eng-coder 除外（角色级缺省 async——见 §18 D-E1，T7 适用其余角色）**；AC6 = check 错误路径与防循环上限（T12/T13）。

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
- **D-B4 提示词纪律同步（并入 §14 D1 条款，评审 #8）**：不新增独立句——在 system.md "How you work — while coding" 段 §14 D1 的并行条款（"use the `edits` array for independent multi-file changes"）内扩展：追加 "and apply_patch for whole-file/new-file changes; prefer one batched call over N single edits"（两端 byte-identical，避免相邻两句）

### 16.3 非功能需求（评审 #6 补）

- **NF-B1 契约零破坏**：`onPermissionRequest(toolName, args)` 签名不变；无 `onBatchPermissionRequest` handler 时缺省回退逐项通道（ACP 桥/headless/旧版不误伤不悬挂）
- **NF-B2 两端 parity**：system.md 批量句两端 byte-identical；edit/apply_patch 描述两端同改（VS Code 对齐）
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

- **D-S1 回合尾语义**：`collectAsyncSubagents` 拆为 `collectSettledAsync(agent)`（注入已完成，形态不变——函数名统一，round2 #6）+ 未完成项**保留在池**（不清空、不等待、不发 done 冻结——区块继续 live）。finally 分支（agent.mjs:447-452）在"anything else"路径调用 collectSettled 后**直接返回**，不再 allSettled 等待
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
  - **D-S3 prepareRun 前注入（注入单主，round2 #3；行号改符号锚点——round3 #4）**：`_pendingAsyncResults` 数组（同 `_pendingDistill` 的 runAgent 首行 await 落定模式，agent.mjs:114-118 仅作 as-of 快照）——每回合（用户回合与 auto-turn）开始前把已 settle 未注入项注入历史。**条目生命周期（唯一记账点）**：settle → 入 `_pendingAsyncResults`（pending）→ **仅在 prepareRun 前注入点消费**（injected 后即从数组移除 = consumed）——D-S6 触发不再自行注入（只负责触发 auto-turn，注入由 auto-turn 的 prepareRun 统一完成）；D-S2 池空判据的"未注入" = `_pendingAsyncResults` 非空；负测试：settle 与回合边界竞态只注入一次。**消费点集合（round3 #2 收敛）**：① 回合尾 collectSettledAsync 对"回合内已 settle"项**直注入**（不经 pending，形态同 §15）；② 挂起期 settle 项入 pending → 由下个回合（用户回合或 auto-turn）prepareRun 注入；③ 退出前若仍有残余（② 的极端竞态）→ 兜底直注入再退——三路互斥：注入即从对应容器移除（直注入从池移除 / pending 注入从数组移除），负测试"只注入一次"覆盖 ① 与 ② 边界
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
- **D-S8 状态呈现**：TUI 状态行（后台 N 子代理）/区块不冻结继续 live/池空冻结退出；VS Code 面板同构。**冻结门控（评审 #2）**：§15 "settle 即发 ⟦ev⟧done"（subagent.mjs settle 回调无条件发）在**挂起态改为延迟发**——settle 时若处于挂起态（回合已结束且池未空）→ 不发 done 冻结，区块头保持 ✓-pending 中间态（`role#id · done · awaiting digestion`）；池空冻结退出时统一补发 done（**修复轮 2026-09-03：补发按 settle 锚点 splice 落位——冻结块位于其 digest 总览文本之前而非流尾**；机制见 §7.2 D4 完成态）；正常回合内 settle（非挂起态）行为不变（完成即冻结）——subagent.mjs settle 回调需感知挂起态（agent 级标志 `_suspended`）。**`_suspended` 翻转点（round2 #7 + round3 D-S9 行表收敛——实现以此为准）**：交互层在 runAgent finally 返回后、进入挂起前置位；挂起自然退出（池空冻结补发后）清除；**会话内用户回合执行期翻 false**（普通回合语义：settle 即冻结 + 回合尾直注入 ①）；**auto-turn 消化轮执行期保持 true**（D-S9 "auto-turn 期间仍挂起（_suspended 保持）"——消化中 settle 延迟冻结 + 入 pending，轮末合并消化轮消化，round3 #1/T-S17 依赖此；round2 #7 "auto-turn 执行期恒 false" 被该行表收敛取代）——settle 回调以读取时刻为准（见 D-S9 时序边界，确定性无竞态锁）
- **受影响文件（两端）**：
  - CLI `src/agent.mjs`（✓）：finally 收尾改 `collectSettledAsync`（等全部 → 收已完成 + 移交未完成——settle 直注入委派 subagent.mjs 的 `injectAsyncResult`）；runAgent 加 `autoTurn` 选项（prepareRun 以 `resume: resume || autoTurn` 复用"不 push input"机制，per-run 状态仍按普通回合重置）；`_pendingAsyncResults` 注入（prepareRun 前，同 `_pendingDistill` 落定点）；`_inheritedGuard`（autoTurn 结束快照 guard 字段 → 下一用户回合 !resume 时恢复而非重置）；手动档消化动作域模板 `AUTO_TURN_DIGEST_DOMAIN`（autoTurn && !autoApprove 注入）；finally 清池规则改为 `signal.aborted && !signal.reason.interrupt`（Ctrl+I 不再误清池——挂起会话内 children 持 `_sessionSignal`，digest 自身 Ctrl+I/Ctrl+C 不误伤）
  - CLI `src/agent-tools/subagent.mjs`（✓）：`_inAutoTurn && !autoApprove` 机械拒绝 spawn（async + 同步，手动档；AUTO 档放行）；settle 回调挂起分流——`parent._suspended` 时改发 ⟦ev⟧settled（延迟冻结）+ 条目移交 `_pendingAsyncResults`（D-S3 ② 记账点），非挂起照发 ⟦ev⟧done；`injectAsyncResult(agent, entry)` 共享注入器（collectSettled 直注入 ① 与 run 首行 pending 注入共用，形态同 §15）；`buildChildRunOpts` signal 优先 `agent._sessionSignal`（会话 children 与回合 controller 隔离）
  - CLI 交互层（✓ agent-turn.mjs / key-handler.mjs——按实现定位；startup.mjs 无需改动）：`runAgentTurn(ctx, text, { autoTurn, skipSession })` + 挂起会话驱动 `suspensionSession`（D-S9 状态机行表：settle→pending→合并消化轮、pendingInput 优先、池空补发冻结退出）、`digestTurn`（手动档不传权限/问答 handler——D-S7 装配契约；AUTO 档普通回调）、`poolLive/sweepSettledToPending/waitForSettleOrWake/backgroundStatusText`；key-handler：挂起态 Enter（非 slash）→ pendingInput 队列 + 唤醒（F3：输入框零干扰）、Ctrl+C → 武装窗口两级中止（round2 偏差 #4：未武装时处理中仅停当前回合（digest/会话内回合）、纯等待仅提示武装，3s 窗口内再次按下才彻底中止——abort 集合全部 controller + `_suspAborted` 标记 + 唤醒）；agent-turn.mjs（round2 偏差 #1/#2-CLI）：挂起会话退出复位 `state._suspAborted`（不粘滞——中止后池再 live 可重新进入挂起态）、abort 分支残余 pendingInput 转回 `state.queue`（不静默丢）；tool-events.mjs（✓ 交互层回调装配）：权限/批权限/问答 handler 按 ctx 提供与否条件接线（手动 digest 传 null → denied 不弹面板）
  - TUI 渲染（✓）：subagent-blocks.mjs `SUB_EVENT_RE` 加 `settled` phase + routeSubToken 中间态（done + awaitingDigest 驻留面板不冻结）；subagent-panel.mjs 渲染 `!done || awaitingDigest` 条目，头部 `[✓ key · …] done · awaiting digestion`（✓-pending 中间态）；池空退出补发 done 冻结 = 既有 `freezeAllSubTasks`（runAgentTurn finally 在 willSuspend 时跳过冻结——区块跨回合 live）
  - VS Code 同构（✓ 2026-09-02 交付：suspension.mjs/panel-chat/webview 输入态/ARCHITECTURE.md:473-486 引用段 + test/suspension.test.mjs T-S1..S17；偏差修复轮：_chat 唤醒断链 D1 + T-S3b——架构师统一回写）
  - 测试（✓）：`test/suspension.test.mjs` 新增（T-S1..S17 完整用例表实现，agent 级/驱动级/TUI 级三层）；`test/subagent.test.mjs` §15 T5 标题与注释随 collectSettled 语义更新；§15 其余用例零改动全绿（T-S13 回归）
  - 文档（✓ 本节 + `docs/design/TUI.md` §7/模块地图 + `docs/design/TUI-INPUT-BOX.md` §1 挂起输入契约——评审 #3）；VS Code `docs/design/ARCHITECTURE.md` 引用段 + 两端 CHANGELOG（父代理统一，未做）
- **测试**（round2 #2：T-S1..S13 实现前必须展开为 §15.4 式完整用例表——#/场景/输入/预期/映射 + 正常/边界/错误标注 + F1-F8/N1-N5 覆盖检查——列为 eng-coder 硬验收项，§7.2 先例）：T-S1 回合尾不等（慢 async + 回合自然结束早于子代理完成）；T-S2 注入不丢（已完成项在下轮 prepareRun 前注入）；T-S3 挂起态输入可用（池非空时新回合正常开跑）；T-S4 叠加并发（两回合各派 async，池累积，上限 4 全局）；T-S5 Ctrl+C 清池回归（round2 偏差 #4 修订：彻底中止 = 武装窗口内二次按下语义——driver 级用例直接模拟二次效果，TUI 级 Ctrl+C 用例随两次制更新并注明）；T-S6 挂起自然退出（池空 → 回空闲；**修复轮 2026-09-03：+ 冻结块按 settle 锚点落 digest 总览文本之前的驱动级断言——settle token 经真实 callbacks 路由、digest 文本进流后补发冻结**）；T-S14 中间态渲染（round2 #4：挂起期 settled 块显示 "done · awaiting digestion" 驻留面板；池空冻结退出时补发 done 冻结进流——§7.2.1 F5 挂起例外回归；修复轮 2026-09-03：+ 锚点断言（冻结块 splice 落 settle 时刻流位置——digest 总览文本之前））；T-S7 auto-turn 消化（手动档：完成无输入 → 自动回合注入消化 + 要点总结进会话流）；T-S8 禁 spawn 分档（手动档 async + 同步均拒绝 / AUTO 档放行——推进链：auto-turn spawn async → settle → 新 auto-turn 消化，链在用户输入或池空时终止）；T-S9 排队续发（auto-turn 中 Enter → 队列 → 结束后自动新回合）；T-S10 权限拒绝（auto-turn 撞权限门 → 拒绝不悬挂）；T-S11 合并消化（多子代理近邻完成 → 一轮注入全部）；T-S12 AUTO 写一致性（auto-turn 下写调用在 AUTO 模式自动执行——与 async 子代理同级信任；手动模式拒绝）；T-S13 既有 §15 全回归（阻塞模式/check/上限/中断）；T-S15 双模式输入对照（round3 #5：auto-turn 中 Enter → 排队不打断、Ctrl+I → 立即打断、输入框文本不被后台事件改动——F3/F7 断言）；T-S16 压缩兜底回归（round3 #5：挂起期多注入后下轮 compressIfNeeded 触发——N4）；T-S17 settle-during-digest（round3 #5/#1：A 消化轮运行中 B settle → A 结束后自动续开合并消化轮消化 B，不滞留——F5/F8）；**round2 偏差修复轮测试（2026-09-02）**：T-S5b（偏差 #1——中止后 `_suspAborted` 复位：abort → 再 spawn async → 回合尾重新进入挂起态 + 释放窗口守卫恢复）；round2 偏差 #2-CLI（中止时 digest 期排队消息不静默丢——残余 pendingInput 转回 state.queue + 提示行）；round2 偏差 #4 TUI ×2（挂起 Ctrl+C 两次制：纯等待首次仅提示武装不中止 / 处理中首次仅停当前回合（后台 controller 不动）/ 武装窗口内再次按下才彻底中止——abort 集合全覆盖语义保留）
- **验收**：AC-S1 = 回合尾不阻塞（网友痛点：async 跑着主会话可继续对话）；AC-S2 = 子代理结果零丢失（下轮/自动可见）；AC-S3 = 输入框零干扰；AC-S4 = 挂起自然退出；AC-S5 = 既有 §15 语义回归（阻塞模式/check/上限/中断全不变）；AC-S6 = 两端全量绿；AC-S7 = F7/F8 映射（T-S15 双模式 / T-S17 settle-during-digest 自动消化，round3 #5）
  **验收核对（2026-09-02 实现后，CLI）**：AC-S1 ✓（T-S1：回合尾不等——elapsed < 子代理耗时）；AC-S2 ✓（T-S1/T-S2/T-S2b/T-S11：直注入/pending 注入/合并消化/退出兜底三路互斥）；AC-S3 ✓（T-S15：后台事件不改输入框）；AC-S4 ✓（T-S6/T-S17：池空自然退出 + settle-during-digest 合并续开不滞留）；AC-S5 ✓（§15 全回归：subagent.test.mjs 21 用例零改动全绿）；AC-S6 ✓（两端全量绿——CLI 1041 pass 0 fail + lint 210 OK；VS Code 912/912 + lint 200 OK）；AC-S7 ✓（T-S15 双模式 / T-S17 自动消化）

**偏差修复轮 2（CLI thincoder/，2026-09-02 · code review round2 findings #1/#2-CLI/#3/#4——限定 CLI 端；VS Code 端同类 findings 的修复见 ARCHITECTURE.md 记录）**：

- **#1 `_suspAborted` 粘滞**：key-handler 彻底中止置 `state._suspAborted = true`，只在 suspensionSession 首行复位——但会话入口（runAgentTurn 挂起分支 `!state._suspAborted` 门控）在标志为 true 时永不再次进入 → 首行复位是死代码。后果：① 中止后用户再 spawn async、回合尾池 live → 不再进挂起态（D-S9 "回合返回且池非空 → 置 _suspended → 挂起态"被破坏）——子代理结果退化到"下个回合尾 collectSettledAsync 才注入"，状态行/自动消化/区块驻留全消失且无提示；② 释放窗口守卫（`_suspPending = willSuspend && !skipSession && !_suspAborted`）同步失效——释放窗口 Enter 重新并发开第二个 runAgentTurn（双驱动器竞态复现）。**修复**：suspensionSession 返回后（runAgentTurn 挂起分支内、await 之后）复位 `state._suspAborted = false`——中止 unwind 已完成、池已清空/耗尽，复位不误触发重入；彻底中止路径恒 abort 会话 signal，会话退出判定不受复位影响。**测试 T-S5b**。
- **#2-CLI 中止静默丢消息**：挂起中 Enter 已清输入框并入 pendingInput（用户视为已发送）；彻底中止分支只清池（`_asyncSubagents.clear()` / `_asyncQueue` / `_pendingAsyncResults`），不处理 `state.pendingInput` → 消息在输入框已清空的情况下永久消失，无任何提示。**修复**：中止分支把残余 pendingInput 转回 `state.queue`（`{text}` 条目——下个普通回合的队列循环续发，零丢失）+ 提示行明示去向（`[background work stopped — N queued message(s) will run as a normal turn]`）。**测试 round2 #2-CLI**。
- **#3 注释整段重复**：agent-turn.mjs finally abort 集合快照注释逐字重复两份（语句夹在中间）——删第二份保留一份。
- **#4 挂起态 Ctrl+C 无二次确认**：一次按键即 abort 全部 controller + 清池终止整个后台会话；空闲态 Ctrl+C 有 3s 防误触武装，挂起态（消化中用户可能只想让刷屏的 digest 停下）与彻底中止共用同一无确认路径，误触代价高（子代理工作被 abort 丢弃）。**修复（武装窗口两级，仿空闲态退出语义）**：未武装时——处理中（digest 消化/会话内回合）首次 Ctrl+C 仅中止当前回合（`state.controller.abort()`，会话与后台子代理不受影响）+ 武装 3s；纯挂起等待期首次仅提示武装（提示含运行中数量，不中止不清池）；3s 窗口内再次 Ctrl+C 才彻底中止（abort 集合 = 链条内全部 controller + `_suspAborted` 标记 + 唤醒 driver 清池）。`state.suspAbortArmed` + `ctx.suspArmTimer`（3s，可注入 `exitArmDelay` 同款窗口）；会话退出（suspensionSession finally）解除武装防跨会话粘滞。**测试兼容（按修复要求注明）**：既有单次中止断言（TUI "偏差#3"用例——round1 #3 abort 集合全覆盖）更新为两次制（首次仅武装、二次彻底中止——children 不逃逸语义保留）；T-S5 driver 级用例直接模拟二次效果（语义不变）；新增 digest 处理中首次仅停当前回合的 TUI 用例。
- 受影响：`src/tui/key-handler.mjs`（挂起 Ctrl+C 两级 + F1 帮助文案）、`src/tui/agent-turn.mjs`（标志复位 + pendingInput 转移 + 注释去重 + 会话退出解除武装）、`test/suspension.test.mjs`（T-S5b / round2 #2-CLI / round2 #4 TUI ×2 / T-S5 注释 + TUI 用例更新）、本节 + `docs/design/TUI.md` / `TUI-INPUT-BOX.md`（同步）
---

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
① 实现——照设计文档（既有协议：清单外文件零触碰/验收自验）
② 自查透明表（交付报告逐条 Done/Simplified/Not done——既有）
③ spawn explore 偏差审计——对照设计逐条查四类偏差
   （部分实现/静默简化/文档漂移/超清单改动——与 2026-08-30 主侧审计同规格）。
   **文档漂移处置（round5 #5）**：eng-coder **永不编辑设计文档**（设计文档是输入非交付物——"清单外文件零触碰"含设计文档）——真实文档漂移（设计本身需改）→ 写入交付报告/stalled 注记——文档修订归架构师/父侧（防子代理改文档洗审计）
   **审计任务书独立性（round4 #4）**：任务书基于**父 spawn 任务书**（设计文档 + 验收标准 +
   受影响文件清单——架构师 spawn 时已传入——非 eng-coder 自由生成）；交付文件清单
   = 父任务书文件清单 ∪ eng-coder 实际 _touchedFiles 的**机械并集**（不取自 eng-coder 自述——
   防自述漏报逃逸超清单审计——T-E15）
④ 审计 dirty → 同一子代理回合继续自修（不需要第二个 spawn——invent nothing new：
    审计发现清单即任务）→ 回 ③（explore 再审计）
⑤ 审计 clean → 调 advisor（type=code，documents = 设计文档 + 交付文件清单）
⑥ advisor 有需修 findings → 自修 → 回 ⑤（advisor 复评）——**仅当修复触碰了上次评审未覆盖的文件**才先回 ③ 再审计（round5 #1 定稿路由）
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
- CLI：`src/agent-tools/subagent.mjs`（schema 默认按 role 解析 async）、`src/agent/setup.mjs`（eng-coder depthOnly 工具装配——加受限 subagent（explore-only + 同步））、`src/agent/spawn-child.mjs`（role 过滤校验：eng-coder 上下文 spawn 仅 explore）、`src/prompts/engineering-sub.md`（内部交付协议附录 + 修正轮计数提醒——byte-identical 三件套）、`src/prompts/engineering.md`（两端——架构师侧 spawn→等报告→主侧审计流程改 async+内部协议口径——防双重审计/误用）、`src/agent.mjs`（核验：digest 消化既有——若零改动从清单移除——实现前定稿）、docs/design/AGENT-LOOP.md §18 本节、ENGINEERING-MODE.md（**全量同步点**——round4 评审 #1：① FR4 代码评审归属行——2026-08-01 裁定"eng-coder 子代理环境无法真实调用 LLM advisor"**反转**：advisorTool 现已在 eng-coder 子代理工具集（setup.mjs:240）且工具实现无 depth/role 限制（advisor.mjs——readonly 内嵌循环）——裁定依据（当时工具未装配）已过时——同批更新 FR4 + §2.3 门表两行（Code review/偏差审计）+ AC5/AC9 + §7 变更记录 2026-08-30 条——不留双文档矛盾）、CHANGELOG（两端，父代理统一更新）、两端测试
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
---

## 19. subagent 工具面合并：单工具四动作（spawn/check/status/escalate）（2026-09-03，用户裁定：工具会爆炸——靠参数做不同的事——escalate 并入 2026-09-03 二次裁定）

> **状态：设计批准（round2 通过 0🔴——控制面扩展 19.5 待评审——2026-09-03）**。触发：§18 后 async eng-coder 不阻塞主会话——但用户实测"主会话里查一下子代理状态就又挂住了"——根因 = `subagent_check` 是无条件阻塞工具（id 给定 → "Blocks until the target finishes"——查进度把并行主回合重新钉死）。用户裁定：① 工具面收敛——subagent 家族（subagent + subagent_check）合并成一个 `subagent` 工具靠 action 参数分流；② **独立动作**（status 非阻塞查询 = 独立 action——check/status 分离）；③ 接受破坏性迁移。eng-coder 是 subagent 的 role（非独立工具）——合并零影响。

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
| spawn（缺省） | task/role/async/designToken/designId（既有全集） | `{id, role, status:"running"/"queued", position?}` | 同步 role 等完成；async 立即返回 |
| check | id?（省 = 下一完成）/ n（必填） | 报告（arrival order/指定 id——消费） | **阻塞**（等目标 settle——显式取回语义） |
| status | id?（省 = 全部概览） | `{id, role, status:"running"/"queued"/"done", position?, done?, error?, ...}`——不消费（§19.5：running 带 model/elapsedSec/turn/maxTurns） | **不阻塞**（立即） |
| escalate | task/model?（consultModels 池——"provider:model"——缺省池首） | 术后报告（专家实现完成——WRITE 干活） | 同步（等专家完成——既有语义） |
| cancel（§19.5 新增——19.5.2b 承诺同批修订） | id（必填——防误全停） | `{id, status:"cancelled"}`/`{id, status:"cancelled", was:"queued"}`/`{id, status:"error", error}` | 立即（定向 abort——异步生效） |

> **supersede 注（2026-09-03 §19.5 实现轮）**：本矩阵 action 面随 §19.5 控制面扩展为**五动作**——cancel 行的门禁分类（控制类豁免）、定向中止语义（cancelled settle/queued 出队/模型可见提醒）与 AC-M1 措辞见 §19.5（D-M6/19.5.2b）——§15 D-A2 先例：本段保留为 as-of 快照，实现以 §19.5 为准。

**D-M2 status 形态**（§19.5 D-M5 修订：概览条目从 id 数组改**结构化对象数组**——`{ overview: { running: [{id, role, model, elapsedSec, turn, maxTurns}], queued: [{id, role, position}], done: [{id, role}] }, target?: {...} }`）——**事实源 = 池（_asyncSubagents）**（评审 #2——挂起期 settle 项已移 `_pendingAsyncResults`（§17 D-S3 ②——注入即消）——**不计入 done 待取**——done 条目附注"回合内 settle 未取——check 取回或回合尾注入"（措辞对齐 §17——挂起期项由 digest 自动消化不经 check）；未知 id → `{status:"error", error:"unknown async subagent id"}`（与 check 同——T12 语义）。**免 n 计数**（status 是只读查询不消费——回合内自然限频——模型不会空转循环）。status 后接 check 无 n 冲突（status 不动 _asyncCheckLastN）。

**D-M4 escalate 并入（评审 2026-09-03 用户裁定）**：既有 escalate 执行逻辑（escalate.mjs——resolveChildProvider 选模型/createAgent coder role/runWithContinue/mergeChildMutations/术后报告）搬入 subagent 工具的 `action:"escalate"` 分支——保留全部既有约束：depth-0 only（depth>0 → error）、工程模式禁用（engineering → error——"实现走 eng-coder"）、consultModels 空 → error、模型选择校验、**relay 前缀 `escalate#N/` 保留**（action 名 escalate 与既有前缀同名——TUI 路由/subagent-blocks/tool-events **零改动**——区块显示/活动流不变）。`escalateTool` 退役（escalate.mjs 移除——setup.mjs 注册点删——subagent 工具常驻——escalate action 在 consultModels 空时返回 error——既有错误语义）。触发词条款（提示词——"用户说 飞刀/escalate → 调 subagent action:escalate"）随提示词迁移。**引用面**：174 处——~113 为 escalate.mjs 自身 + escalate.test.mjs（随迁移消解）；外部集成 = setup.mjs 注册（删）+ 提示词条款（改）+ 测试迁移（escalate.test.mjs 直接调 escalateTool → subagent action:"escalate"）——UI/事件/配置零改动。

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

- N1：**描述预算**——五动作单工具描述在既有 schema description 预算内（工具描述重写后模型可解析——T-M12 断言 byte-identical + 内容锚）
- N2：**语义保证**——check 的消费/删除/n 计数与 status 的零消费/零计数完全隔离（T-M4/M10 断言——action 间不串扰）
- N3：**零改动面**——TUI/ACP relay 路由零改动（escalate# 前缀保留——T-M16 断言）；配置零改动（consultModels 语义照旧）
- N4：**两端一致**——subagent 工具 schema/描述与 prompts 两端 byte-identical（T-M12——既有 15 文件比对覆盖）


### 19.5 控制面扩展：status 增强 + cancel + UI 停止 + 嵌套前缀子标（2026-09-03，用户裁定）

> **状态：设计批准（2026-09-03 round2 通过——0🔴——7 项 refinement 已处置——designToken 已签发）**。触发：用户实测控制面薄弱（"至少应该有列表，是不是还应该有其他的必要控制能力？比如中止？"）+ 嵌套 relay 前缀泄漏（"explore 子 agent 在 eng-coder 中显示不正常——出现了好多 explore#1/ 字样"）。用户裁定：① 主会话工具面补控制能力；② 界面上也应能停止（子 agent 标题行加停止）；③ 嵌套前缀显示形态 = 方案 A（块内子标）。

#### 19.5.1 需求

- F9：`status` 全览条目补**可决策字段**——`{id, role, model, elapsedSec, turn, maxTurns}`（决定中止谁时看得清——现状只有 id 数组）
- F10：**cancel 动作**——定向中止单个后台子代理——`action:"cancel"` + `id`（必填——防误全停——省略 id = error）——其余子代理/挂起会话不受影响
- F11：**UI 停止**——运行中子代理标题行停止控件（CLI 鼠标 + VS Code webview ⏹）——点击 = cancel 同语义（定向）
- F12：**嵌套 relay 前缀子标**（方案 A）——eng-coder 内 explore（§18 受限变体——同步 spawn）活动经双层前缀（`eng-coder#N/explore#M/`）到主会话——首段路由块 + 剩余段渲染为块内 dim 子标行（`explore#1 · read — …`）——前缀不再字面泄漏进内容
- F13：两端一致（CLI/VS Code 同构）

#### 19.5.2 设计

**D-M5 status 全览增强**：全览条目从 id 数组改结构化对象数组——`running: [{id, role, model, elapsedSec, turn, maxTurns}]`、`queued: [{id, role, position}]`、`done: [{id, role}]`——**数据装配锚点（round1 #3）**：spawn 时（subagent-async spawn 分支）记 `entry.model`（childProvider.model）与 `entry.startedAt`；turn/maxTurns 在**子代理 callbacks 包装层同步**（wrapChildCallbacks 内解析 ⟦ev⟧turn 更新 entry——或 spawnChild 提供 per-child turn 钩子——选改动最小方案——实现时定并注）；`elapsedSec = (now - startedAt)/1000` 计算于 status 调用时——单查（id）形态不变 + 同字段。

**D-M6 cancel 动作**：`action:"cancel"` + `id`（必填）→ 定位池条目 → **定向 abort**（**条目级 AbortController（round2 #2 定稿）**：async spawn 时每条目建独立 controller（链到会话/回合 signal——consult `session.controllers` 为仓内先例）存条目——Ctrl+C 全停语义不变（session abort 逐链传播）——abort → 子代理 runAgent signal →）→ **cancelled settle（round1 #1 机制定稿）**：
- **条目标记**：cancel 时置 `entry.cancelled = true`（清池/注入判定依据）
- **settle 回调 cancelled 分支**（subagent-async.mjs settle 回调）：`entry.cancelled` → **不入 `_pendingAsyncResults`、不参与 collectSettledAsync 直注入**（清池规则同 Ctrl+C 全停但只清该条目——陈旧错误零注入）→ 发**停止冻结事件**（`⟦ev⟧stopped`——新相位——TUI routeSubToken 识别 → 区块以 interrupted 语义冻结——标题 "stopped"）→ digest 提示"已中止 explore#N/eng-coder#N（主会话决定）"（经 pending 提示行——非错误报告形态）
- **模型可见提醒（round2 #3）**：cancel 生效后注入短 user-role 提醒（形态仿 injectAsyncResult——XML 转义）：`[System reminder: subagent eng-coder#N cancelled by user — partial changes not merged/audited]`——cancelled settle 不入 pending/不直注入（无错误报告）但**取消事实与半成品警示对模型可见**（防基于半成品树继续——mergeChildMutations 不覆盖 abort 路径）——T-M19 断言补
- 未知/已完成 id → error（同 status/check 错误形态）；**只允许主会话（depth-0）**（子代理上下文无 cancel 意义——受限变体已禁）；cancel 后槽位腾出（maybeRefillAsync——queued 补位——既有机制）
- **queued 目标（round1 #2 定稿）**：id 命中 queued 条目（未启动无 controller）→ **出队移除 + position 释放（后续条目 position 前移）+ 返回确认**（`{id, status:"cancelled", was:"queued"}`——不 abort）

**D-M7 UI 停止（两端）**：
- CLI：运行中区块折叠头右侧停止标记（`⏹`——dim——仅 running 态显示——done/冻结后消失）——复用既有鼠标管线（mouse.mjs SGR 点击 + handleMouseClick）——点击命中区 = 标题行右缘（宽度 = ⏹ 标记列）→ cancel（定向该子代理——经 TUI 层调用池 abort——与 D-M6 同实现路径——不经过模型回合）——**用户点击是即时动作不依赖模型**（关键属性：失控子代理时模型可能不可靠——UI 停止必须不经模型）
- VS Code：webview 子块标题行 ⏹ 按钮（DOM click → postMessage cancel → extension 层定向 abort——同样不经模型）
- 与 Ctrl+C 的关系：UI 停止 = 单子代理定向；Ctrl+C = 既有全停（挂起两级——round2 #4）——并存

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

