# 工具输出长度限制调整 — 需求（VS Code 扩展）

> 状态：**已实现**（2026-08-24 评审修订后实施；marketplace/Open VSX 0.1.49 发布）
> 关联：`docs/design/TOOL-OUTPUT-LIMITS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder-vscode）；CLI（thincoder）有同需求独立文档（`TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`），两端语义一致
> ⚠️ **两端必须同步改（lockstep）**：阈值/preview/advisor 截断/显示层在两仓库各有实现，单边改动会造成行为漂移——评审 #1（2026-08-24）

## 1. 总体目标

把工具输出"超长落盘"的阈值从 16K 放大到 64K（65536 字符），并让显示层全链路对齐 64K——减少大输出（尤其 advisor 评审、读大文件、grep 大仓库）被过早落盘/截断的频率，让模型和用户在合理范围内直接看到完整内容。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为用户，我希望工具输出在 64K 以内**不落盘**，直接进上下文；超过 64K 才落盘并返回 64K preview + 文件路径 | `offloadToolResult` 阈值 16000 → 65536；≤65536 原样返回，>65536 落盘 |
| FR2 | 作为用户，我希望落盘时的内联 preview 也放大到 64K | `TOOL_RESULT_PREVIEW` 2000 → 65536——**2026-09-04 §5：预览构成为头 16K+尾 48K 双端（FR5 增量）——见 TUNING.md §5** |
| FR3 | 作为用户，我希望 advisor 评审循环里读到的工具结果同样放宽到 64K | advisor `MAX_RESULT_CHARS` 12_000 → 65536 |
| FR4 | 作为用户，我希望面板上实时看到的工具结果不被 20K 截断，与上下文一致到 64K | `panel-chat.mjs` onToolResult `slice(0, 20000)` → `slice(0, 65536)` |
| FR5 | 作为用户，我希望回看历史时工具卡内容不被 2K 截断 | `panel-session.mjs` `sendHistoryPage` 工具卡 `slice(0, 2000)` → `slice(0, 65536)` |
| FR6 | 作为用户，我希望现有行为完全兼容——落盘机制、文件路径指引、写时自清理、webview DOM 上限全部保留 | 落盘格式/清理/路径消息不变；`webview/lib.js` `MAX_TOOL_OUTPUT = 64*1024` 已达标不动 |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 一致性 | 全链路同一阈值 `64 * 1024 = 65536`（与现有 `webview/lib.js` `MAX_TOOL_OUTPUT` 完全一致），不引入第二套"64K" |
| N2 | 两端一致 | CLI 与 VS Code 扩展同一阈值、同一 preview、同一 advisor 截断、同一实时显示上限 |
| N3 | 可测试 | 阈值边界、preview、advisor 截断、实时显示、历史页均有单元测试；现有 20_000 触发落盘的测试改 >65536 输入 |
| N4 | 可维护 | 常量注释同步；不改动落盘保留期（TMP_RETENTION_MS）、写时自清理、失败回退截断、webview DOM 截断（capText）逻辑 |
