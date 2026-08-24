# Agent 主循环设计（thincoder/src/agent.mjs + agent/）

> 状态：2026-08 回补。LLM ↔ 工具调用循环：回合驱动、guard 体系（pending tasks / verify / advisor / 诚实声明）、中断语义、子代理、压缩/用量锚点、停滞检测、goal 预算。

## 1. 模块地图

| 文件 | 职责 |
|---|---|
| `agent.mjs` | runAgent 主循环：prepareRun → turn 循环 → chat → 分发 → 后处理；ContinueError/resume；usage 基线 |
| `agent/setup.mjs` | prepareRun：上下文注入（git/目录/指令/记忆/文档/outline）、system prompt 组装、阈值解析 |
| `agent/dispatch.mjs` | executeToolCalls：两段调度（权限预审 → 顺序保序执行）、hooks、错误落盘 |
| `agent/completion.mjs` | handleCompletion：零工具调用回合的 guard 链（pending → verify → advisor → 收尾） |
| `agent/post-turn.mjs` | 回合后注入：停滞检测、goal 预算预警 |
| `agent/helpers.mjs` | 常量（turn 上限、结果落盘阈值）、escapeXml、repairHistory、git 上下文、目录树 |
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
- 工具执行期间中断：`signal.reason.interrupt` → 不提交半截工具结果，注入中断消息后 continue（下一 turn 重新生成）

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
**Phase 2 执行**（**顺序保序**）：只读工具 + `parallel` 标记的工具可并行（Promise.all 一批），非只读工具**打断批量串行**（先 flush 再单独执行）——保证顺序语义且允许只读并行。执行前副作用工具 `snapshotForUndo`（/undo 回滚基线）；结果 >16K 字符落盘 `~/.thincoder/tool-results/` + 2K 预览；错误写入 `~/.thincoder/tool-errors/`（模型只见 message + 关键参数，不见 stack trace 防路径泄露）；PostToolUse 钩子 fire-and-forget。

## 5. 零工具调用回合（completion.mjs handleCompletion）

顺序（每个 guard 推回一次后 continue，直到通过）：
1. **空响应恢复**（IK60QP）：`!response.content` → 注入 `[System reminder: your last response was empty…]` 重试，上限 `MAX_EMPTY_RETRIES=2`（每次用户消息重置），仍空才抛原错误（含 /think 降档建议）
2. **pending tasks 提醒**：有 pending → 注入任务列表提醒并继续循环（模型更新 task 状态后再收尾）；**最多推回一次**（`_taskPushbacks`，task 工具更新列表即重置）——模型第二次坚持收尾则放行，避免 pending 项无法解决时无限循环
3. **verify guard**（opt-in `verifyGuard: true`，工程模式除外）：改过代码未 verify → 推回调 verify（≤2 次）；verify 失败 → 推回修复（≤3 次）；耗尽 → 诚实声明提醒（必须说明哪些测试失败/试了什么/根因）
4. **advisor guard**（opt-in `advisor.guard === true`，工程模式除外）：改过代码未评审 → 推回调 advisor（≤3 轮，收敛协议见 ADVISOR-CONVERGENCE.md）。advisor 评审能力本身**恒启用**（不依赖任何开关，未配 advisor.provider 时评审继承主 provider）——`advisor.enabled` 字段已废弃（2026-08-21 语义重构，见下）
5. 通过 → pushReal assistant 回复 + 返回 content

## 6. 回合后注入（post-turn.mjs）

- **停滞检测**：同一工具+同一参数序列化签名连续 3 次 → 注入"你在原地空转，换条路或求助"（窗口 5）
- **goal 预算**：goal 活跃时每轮注入目标/已用 turn 数；用满 75% 时预警；`goal complete` 需验证证据门槛（见 goal 工具）

## 7. 子代理（subagent 工具）

- `depth > 0`：独立 agent 对象 + 丢弃式局部双线；role（explore/plan/coder/eng-coder）决定工具集（只读过滤）与 overlay prompt
- 流式 relay：`role#id/` 前缀 token 转发给父回调（TUI subTasks 面板 / VS Code subagent 面板）。**TUI 消费端正则须含连字符（2026-08-21，已实现 ✅）**：`src/tui/agent-turn.mjs` 三处前缀剥离正则 `/^(\w+)#(\d+)\//` → `/^([\w-]+)#(\d+)\//`——`\w` 不含连字符，`eng-coder#N/` 当前匹配失败，带前缀 token 原样落入主聊天流每个 chunk 刷屏（其余 role 无连字符未暴露）。修复后 eng-coder token 正常路由 subTasks 面板。测试 `test/agent-turn.test.mjs`：① `onToken("eng-coder#1/hello")` → subTasks["eng-coder#1"] 收文、主流无前缀；② `coder#2/` 回归仍路由；③ 无前缀 token 照常进 streaming；④ `onToolCall("eng-coder#3/read")` 路由 tool。VS Code 无此机制（子 agent 走 onToolPanel 通道），不涉及。
- 报告契约：<200 字符视为交接不完整，打回扩写一次（`MIN_REPORT_CHARS`）；超长报告落盘全量保留
- 权限：手动模式下子代理的非只读工具透传到父 agent 的权限审批（人在回路）
- eng-coder：设计 token 门控（`_engDesignToken`，评审通过后签发，跨 turn 存活；子代理授权在 spawn 前校验）

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


