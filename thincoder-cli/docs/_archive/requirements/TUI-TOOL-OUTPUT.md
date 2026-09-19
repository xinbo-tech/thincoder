# TUI-TOOL-OUTPUT — 需求

> 板块：TUI 工具输出（行间区块显示）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/TUI-TOOL-OUTPUT.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 需求

### 1.1 总体需求

TUI 的工具输出统一为**行间区块**：所有工具执行时在对话区产出 `❯ toolName args` 标题行 + 执行中滚动内容 + 完成行。

### 1.2 功能性需求

| # | 用户故事 |
|---|---|
| FR1 | 每个工具调用产生一个行间区块，含工具名和参数摘要作为 title（`❯ write src/x.mjs` / `❯ bash npm test`） |
| FR2 | 执行中内容以 `│ ` 前缀滚动显示，默认保留最近 N 行（N = `agent.streamPreviewLines` ?? 工具限定值 ?? 5），溢出折叠为 `│ …` |
| FR3 | 工具完成时清掉滚动块，追加完成行 `❯ name — done (耗时) → 摘要`（含 OK/FAILED 语义） |
| FR4 | 完整输出不受区块限制——超长结果落盘保留（阈值权威 = TOOL-OUTPUT-LIMITS-*.md，常量 `thincoder-core/agent/helpers.mjs` TOOL_RESULT_OFFLOAD_LIMIT），行间区块只做预览；模型从 history 读取完整结果 |

### 1.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| NFR1 | 性能 | 区块渲染与行间消息同开销，流式追加走 scheduleRender 增量路径，不触发全量重绘 |
| NFR2 | 可维护 | 输出经 `onToolOutput(name, chunk)` 单一入口；chunk 契约见 §3 |
