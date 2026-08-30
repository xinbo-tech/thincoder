# TUI 工具输出统一

> 状态：已实现（2026-08-29 核对重写；本文档描述的行内区块机制已落地，原 2026-08-01 过渡期设计面板相关内容随"面板区废除"作废删除）

## 1. 需求（Requirements）

### 1.1 总体需求

TUI 的工具输出统一为**行间区块**：所有工具执行时在对话区产出 `❯ toolName args` 标题行 + 执行中滚动内容 + 完成行。工具面板区已废除（`src/agent/dispatch.mjs` "Panel area abolished" 注释处），不存在面板/行间双轨。

### 1.2 功能性需求

| # | 用户故事 |
|---|---|
| FR1 | 每个工具调用产生一个行间区块，含工具名和参数摘要作为 title（`❯ write src/x.mjs` / `❯ bash npm test`） |
| FR2 | 执行中内容以 `│ ` 前缀滚动显示，默认保留最近 N 行（N = `agent.streamPreviewLines` ?? 工具限定值 ?? 5），溢出折叠为 `│ …` |
| FR3 | 工具完成时清掉滚动块，追加完成行 `❯ name — done (耗时) → 摘要`（含 OK/FAILED 语义） |
| FR4 | 完整输出不受区块限制——超长结果落盘保留（阈值以 TOOL-OUTPUT-LIMITS-*.md 为权威源，常量 `agent/helpers.mjs` TOOL_RESULT_OFFLOAD_LIMIT，round3 #3 去重），行间区块只做预览；模型从 history 读取完整结果 |

### 1.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| NFR1 | 性能 | 区块渲染与行间消息同开销，流式追加走 scheduleRender 增量路径，不触发全量重绘 |
| NFR2 | 可维护 | 输出经 `onToolOutput(name, chunk)` 单一入口；chunk 契约见 §2.2 |

## 2. 设计（Design）

### 2.1 区块格式与生命周期

```
❯ bash npm test  (in thincoder)   ← onToolCall：标题行（工具色；可读关键参数摘要）
  │ line1                         ← onToolOutput：滚动内容（_live 标记，最近 N 行）
  │ …                               溢出折叠标记
❯ bash — done (1200ms) → 345 tests passed   ← onToolResult：清滚动块，换完成行
```

- 数据路径：`onToolOutput` → `state.lines`（`_live: toolName` 标记）→ 按工具滚动清理
- 颜色：title 用工具色（bash=黄 warn，verify=青 tool，advisor=亮绿；映射见 tool-events.mjs onToolCall 的 color 表），内容 dim
- 历史持久化：完整工具结果按现有落盘/截断机制进 history（FR4），区块只是 UI 层预览

### 2.1.1 参数可见性（tool-args.mjs，2026-08-30 对齐 vscode 卡片头；用户报告恢复会话零参数后落地）

- **单源摘要**：`tool-args.mjs describeToolArgs(name, args)`——按工具挑关键参数的可读单行（bash=命令+workdir、文件工具=路径+offset/limit/edit 摘要、搜索=pattern+path、未知/MCP 工具=紧凑 JSON 80 截断）。live 标题行（tool-events.mjs onToolCall）与恢复标题行（startup.mjs historyToLines）共用。
- **live 标题行**：`❯ name <可读摘要>`（此前是原始 JSON 前 80 字符——长路径截半不可读）。
- **恢复路径**（用户报告主修点：display snapshot 废弃后 historyToLines 是恢复唯一路径，而它从不渲染 args——恢复的会话完全没有参数）：`[tool] name — <摘要>` 标题行 + **全量 pretty JSON 落 dim 行**（TUI 无悬停，全量必须落行；超长由连续 dim 折叠收纳——与工具结果的恢复惯例一致）。畸形 args JSON 降级为原始串 dim 行，不崩。
- vscode 对齐关系：卡片头 name+args 截断 ≈ 标题行摘要；点击展开 body ≈ 全量 JSON dim 行（连续 dim 折叠收纳）。

### 2.2 `onToolOutput` chunk 契约（{kind,text} 正式契约，§7.2 F7 承载处）

`onToolOutput(name, chunk)` 的 chunk 两形态：

- **对象形态**（正式契约）：`{ kind, text }`，kind ∈ `think | text | tool`——advisor（`advisor/run.mjs` emit() 包装）等工具使用；有序多块流（如 advisor 的 think↔tool 交替）靠 kind 区分渲染
- **裸字符串**（兼容形态）：bash 等工具直接发 stdout/stderr 字符串
- **消费端容错**：TUI 统一归一化 `typeof chunk === "string" ? { kind: "text", text } : chunk`——一行兜底，emit 端新工具应优先发对象形态

### 2.3 受影响文件（现状）

| 文件 | 职责 |
|---|---|
| `src/agent/dispatch.mjs` | 工具 onOutput → callbacks.onToolOutput(name, chunk, toolCallId) 统一接线；onToolCall/onToolResult 同样贯穿 toolCallId（2026-08-30，并行同名工具按 id 精确路由到各自块） |
| `src/tui/tool-events.mjs` | onToolOutput 消费（2026-08-30 自 agent-turn 拆出）：advisor 特判进 `_advisorBlocks`；带 `role#id/` 前缀的子agent 输出经 subagent-blocks.mjs routeSubToolOutput 进对应区块（§7.2 D4）；其余进工具单框载体（`_toolBlock`，2026-08-30 单框化——`❯ name args · status` 头 + args JSON/流式输出/结果 body） |
| `src/tui/render-conversation.mjs` | `_advisorBlocks` 有序渲染、dim 折叠、`_toolBlock` 载体渲染（fold key 用行级 `_lineId` 派生，loadOlder 不漂移） |

### 2.4 工具单框载体的收尾与共享守卫（2026-08-30 补齐）

- **载体收尾语义分层**：普通工具结果落载体本体（`slimToolResultForDisplay` 共享守卫，见下）；**subagent/escalate/advisor** 的结果由专用分支承载（子agent 冻结框/评审冻结框），但 dispatch 级载体仍需标 done——`settleToolBlock(state, name, toolId, summary)` 统一收尾（否则 turn 清扫会把成功调用误标 "(interrupted)"）。中断清扫：`sweepToolBlocks(state)`（agent-turn finally 调用，与 freezeAllSubTasks 并列——未 done 载体标 `done+interrupted` 并清 `_toolTicks`）。
- **`slimToolResultForDisplay(result, maxRows=400)`**（tool-events 导出，LIVE 与 RESTORE 共用，2026-08-30 consult）：① read_image 等多模态结果剥离 base64 images 只留 text（模型侧图像走 multimodal 通道）② 超过 maxRows 截断（全文在 history）。restore 路径（historyToLines）同函数——历史上没有守卫导致恢复旧会话时 base64 洪水重现。
- **工具块宽度的组件 cols 纪律**：工具块展开/折叠态的组件调用**必须传 cols**（漏传 = 组件按默认 80 wrap，生成中"左边一小块"——2026-08-30 真根因，详见 TUI.md §5 组件 cols 纪律）。
- **中断配对**（agent.mjs executeToolCalls）：工具执行中 Ctrl+I——已提交的 assistant tool_calls 先合成占位 tool 结果（`[Tool execution interrupted — results discarded]`）再注入中断消息，保证重试轮历史可配对（strict provider 否则 400）。

### 2.5 历史包袱清理（2026-08-30 consult 整改）

- `_live` 行与 `LIVE_LINE_LIMITS` 已随单框化废弃（死代码已删）；输出上限具名常量 `TOOL_OUTPUT_LINE_CAP`(200)/`SUBAGENT_PREVIEW_LINES`(8)/`PREVIEW_LINE_CHARS`(120)/`REMINDER_CAP`(3)/`REMINDER_PERSIST_TURNS`(5)。

## 3. 测试（Testing）

### 3.1 验收标准

- AC1: 工具执行时对话区出现 `❯ toolName args` title 行
- AC2: 内容行不超过 N 行（FR2），超长尾部 `│ …` 折叠
- AC3: 完成时滚动块清除，追加 `❯ name — done (耗时) → 摘要`（含失败语义）
- AC4: 历史中保留完整结果（>64K 落盘机制不变）

### 3.2 用例表

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T1 | 正常：短工具 | write src/x.mjs (10ms) | title `❯ write src/x.mjs`，完成行 `done (10ms)` | FR1/FR3 |
| T2 | 边界：长输出滚动 | bash 输出 50 行 | 只保留最近 N 行，`│ …` 折叠标记 | FR2 |
| T3 | 错误：工具失败 | edit 匹配失败 | 完成行含失败语义（FAILED 字样由 tool-summaries.mjs 摘要承载；done 行恒为 dim 色，"红色"预期未经代码证实——2026-08-30 评审裁定以文本语义为准） | FR3 |
| T4 | 正常：流式工具 | verify 跑测试 | 内容行实时追加，完成后固定完成行 | FR2/FR3 |
| T5 | 边界：超长结果落盘 | write 返回 20k 字符 | 行间预览 + history 完整保留 | FR4 |
| T6 | 契约：裸串归一化 | bash 发裸字符串 chunk | 按 {kind:"text"} 渲染 | §2.2 |
| T7 | 契约：对象形态透传 | advisor 发 {kind:"think"} | 进 `_advisorBlocks` 有序块 | §2.2 |

## 4. 边界划清：普通工具输出 vs 子agent 活动（2026-08-29 交叉引用；D4 落地后窄带由 §7.2 区块取代）

普通工具（bash/read/verify 等）的输出走本文档的行间区块路径（onToolOutput → `_live` 滚动行 → done 行），**不经过** `state.subTasks`。subTasks 只承载带 `role#id/` 前缀的子agent 活动（原窄带渲染；由 AGENT-LOOP.md §7.2 D4 的会话流内可折叠区块取代——状态以该节为准，数据结构升级、名字保留），两条路径数据结构与渲染分支完全分离。子agent 活动输出的统一方案见 `AGENT-LOOP.md` §7.2——窄带退役不影响本文档覆盖的任何工具输出路径。
