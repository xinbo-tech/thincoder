# 覆盖率缺口修复 — 需求（VS Code 扩展） > 状态：**已实现**（2026-08-25 评审修订后实施，commit acce3e4）
> 关联：`docs/design/COVERAGE-GAPS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder-vscode）；CLI（thincoder）有同需求独立文档（`COVERAGE-GAPS-REQUIREMENTS.md`），两端语义一致
> 背景：TOOL-OUTPUT-LIMITS 批代码评审遗留 3 项（1 项在本仓库，2 项在 CLI 端），本批收口 ## 1. 总体目标 修复 TOOL-OUTPUT-LIMITS（64K）批次遗留的测试覆盖缺口：`onToolResult` 的 64K 实时显示截断（`panel-chat.mjs:183-187`）无单元测试——该截断点一旦回归（如改回 20K），测试全绿也抓不到。目标是用现有测试基建补上覆盖。 ## 2. 功能用户故事（Functional） | # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为开发者，我希望 `onToolResult` 的 64K 截断有自动化测试：70_000 字符工具结果经回调后 ≤ 65536 且 > 20000（证明旧 20K 已破、新 64K 生效） | 新增全路径测试用例（真实 ChatPanel + scripted LLM server，断言 webview 收到的 `toolResult` 消息长度） | ## 3. 非功能标准（Non-functional） | # | 维度 | 标准 |
|---|---|---|
| N1 | 零结构改动 | 不导出 `buildCallbacks` 闭包、不改 `panel-chat.mjs` 结构——用现有测试基建（chat-panel.test.mjs 的 makePanel + scriptedLLMServer 全路径模式） |
| N2 | 两端一致 | 与 CLI 端同批收口；CLI 端另有 MAX_RESULT_CHARS 导出对齐与残留自动化（见 CLI 文档） |
| N3 | 可测试 | 新用例通过；全套测试无回归 |
