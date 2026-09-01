# Agent 主循环设计（thincoder/src/agent.mjs + agent/）

> 状态：2026-08 回补。LLM ↔ 工具调用循环：回合驱动、guard 体系（pending tasks / verify / advisor / 诚实声明）、中断语义、子代理、压缩/用量锚点、停滞检测、goal 预算。

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
  4. 超 turn 上限 → throw ContinueError（TUI 询问是否续跑，续跑走 resume 保状态）
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
- 权限：手动模式下子代理的非只读工具透传到父 agent 的权限审批（人在回路）
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
- **事件名 × 发射点 × 载体矩阵（round2 #3 修订，消歧）**：`⟦ev⟧` token 只有两种——`turn`（runAgent depth>0 在 `_currentTurn` 更新处发，phase=llm，{n}/{max} 必填）与 `approval`（dispatch.mjs 权限询问处发，{n}/{max} 取子 agent 当前 turn 计数）；**tool/done phase 不发 token**——由既有 onToolCall/onToolResult 前缀 relay 承担（TUI 前缀分支更新 currentTool 与 done 状态，即 D4）。phase 枚举中的 `tool/done` 描述的是头部状态机的输入来源之一，不是 token 种类。
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
- **运行态（会话流内联）**：`state.subTasks[key]` 升级为完整活动缓冲 `{ key, role, model, started, done, blocks: [{kind,text}], currentTool, turn, maxTurns, approval, lastError }`（**approval 字段补列——§7.2.1 D2 ⏸ 图标的承载字段，由 `routeSubToken` 事件解析维护，评审 #9 结构定义补齐**）。onToken/onReasoning/onToolCall 前缀分支改写：reasoning token **追加进 blocks**（kind=think，不再丢弃）；onToolCall 更新 currentTool 并开新 block（kind=tool）；onToolOutput 带前缀分支把 chunk 追加进当前 tool block（保留换行结构）；turn 事件 token 更新 turn/maxTurns。onToolResult(subagent) 不再 3 秒删除，改为标记 done（头部 ✓）。
- **落位（渲染）**：子agent 区块渲染进会话流（render-conversation.mjs 新增 subagent blocks 段，位于 advisorBlocks 段之前），**段首带一条与会话区切分的分隔线**（`─` × cols-1，dim，与 task 面板顶部线同款，2026-08-30 用户要求；仅当存在运行中区块时出现——done 块已冻结进会话流，空段不留悬空线）：折叠态 = 头部摘要行 `[▶ coder#1 · glm-5.3 · 45s · turn 12/100] bash — npm test`（运行中 elapsed 由 1s ticker 刷新）+ tail 3 行（blocks 尾部；2026-08-30 用户拍板 2→3）；展开态 = blocks 全量按 kind 着色（think=C.reason、tool=C.tool、text=C.text），**经公共组件 fold-block.mjs renderBlockTimeline + renderExpandedBlock 渲染，展开封顶屏幕 60% + 底部可达折叠控制行（2026-08-30 用户报告驱动，TUI.md §5）**。展开/折叠走 expandedBlocks 集合（key=`sub-${key}`）+ `toggleFoldBlock` 单源切换。默认折叠；同一 key 折叠状态跨 turn 保持（expandedBlocks 不随 turn 清理该前缀）。**【§7.2.1 已变更：运行中区块迁至固定底部面板（会话与 todo 之间）——本段"会话流内联"仅指冻结态落位；运行态见 §7.2.1 D2（评审 #4 supersede 指针）】**
- **完成态（2026-08-30 修订：冻结进对话流 + 保留独立折叠交互，废除尾部驻留）**：初版实现把区块渲染成会话末尾的固定段且 done 后保留——完成的 ✓ 块永远钉在输入框上方（"残影"，用户报告），多子agent 还会叠加。修订：onToolResult 标记 done 后，完成冻结家族（`subagent-blocks.mjs` freezeSubTaskLines/freezeDoneSubTasks，2026-08-30 自 agent-turn 归位）把整个区块（含 blocks/lastError/耗时）作为 `_frozenSubTask` 载体行存进 `state.lines` 并从 `state.subTasks` 删除——留痕随会话滚走，内存仍受 N2 环形上限约束。**冻结区块保持完整折叠交互（用户拍板 2026-08-30：不因冻结降级）**：render-conversation 识别载体行后按 `sub-${key}`（与运行中区块同一个 key，折叠状态跨冻结边界延续）渲染——折叠态 = `▶ [✓ coder#1 · model · done 45s · turn n/max] … click to expand` + tail 3 行；展开态 = `▼` 控制行 + 全量时间线（kind 着色，`_skipDimFold` 防连续 dim 折叠套叠）；点击 ▶/▼ 切换与运行中区块一致。尾部固定段只渲染**运行中**条目（done 条目若因旧会话残留出现也跳过不渲染）；finally 兜底把中断（Ctrl+C/错误）仍在跑的区块一并冻结（lastError=interrupted）。完整报告前 8 行预览仍由 onToolResult 路径进会话流（不变）。convCacheKey 的 frozenSig 记录载体行 key 集合（展开/折叠翻转由既有 `exp` 项覆盖）。
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

**背景**（用户真实使用反馈）：D4 把运行中子 agent 区块渲染进会话流内联（render-conversation.mjs subagent blocks 段 + 分隔线）——用户实测发现**该容器区（"底部画着横线、里面跑着好几个子 agent 的面板"）会随会话滚动，没有固定在底部**。需求：运行中的子 agent 活动改为**固定底部面板**（不随会话滚动），与 todo 面板同型；完成后仍冻结进会话流（D4 现状不变，历史可读）。

**功能性需求**：
- **F1 · 位置**：固定面板位于**会话区与 todo 面板之间**（布局顺序：header → conversation → subagent 面板 → todo → picker → permission → queue → input → status）——用户拍板
- **F2 · 高度**：**完全自适应**——面板高度 = 全部运行中区块的完整高度（无上限；并行多个子 agent 内容全显示，会话区相应被挤小）——用户拍板。**已知限制（评审 #1，用户拍板方案 a）**：多个展开块总高超屏时面板底部裁剪（无面板级滚动）——展开块自身可滚（60% 窗口化 + 块内滚动保留）——用户逐个展开/收起
- **F3 · 固定**：面板独立于 conversation 滚动区——会话滚动（滚轮/PgUp/流式）不影响面板位置；面板上滚轮**穿出滚会话**（与 todo 面板行为一致）
- **F4 · 折叠**：面板内每个子 agent 区块**默认折叠**（头部摘要 + tail 3，点击展开）——与现状流内区块一致（用户拍板）；展开态经 fold-block.mjs 公共组件（60% 封顶 + 块内滚动 + 底部可达收起控制行）
- **F5 · 冻结**：子 agent 完成后**立即冻结进会话流**（✓ 头 + 可展开，D4 现状不变）——面板只显示运行中区块，完成即移出
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


