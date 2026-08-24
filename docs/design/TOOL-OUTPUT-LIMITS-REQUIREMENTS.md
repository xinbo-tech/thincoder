# 工具输出长度限制调整 — 需求（CLI）

> 状态：待评审（2026-08-24）
> 关联：`docs/design/TOOL-OUTPUT-LIMITS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展（thincoder-vscode）有同需求独立文档（`TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`），两端语义一致
> ⚠️ **两端必须同步改（lockstep）**：阈值/preview/advisor 截断在两仓库各有实现，单边改动会造成行为漂移——评审 #1（2026-08-24）

## 1. 总体目标

把工具输出"超长落盘"的阈值从 16K 放大到 64K（65536 字符），并让显示层全链路对齐 64K——减少大输出（尤其 advisor 评审、读大文件、grep 大仓库）被过早落盘/截断的频率，让模型和用户在合理范围内直接看到完整内容。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为用户，我希望工具输出在 64K 以内**不落盘**，直接进上下文；超过 64K 才落盘并返回 64K preview + 文件路径 | `offloadToolResult` 阈值 16_000 → 65536；≤65536 原样返回，>65536 落盘 |
| FR2 | 作为用户，我希望落盘时的内联 preview 也放大到 64K——大输出不至于只剩 2K 摘要 | `TOOL_RESULT_PREVIEW` 2_000 → 65536 |
| FR3 | 作为用户，我希望 advisor 评审循环里读到的工具结果同样放宽到 64K，评审不会被 12K 截断误判 | advisor `MAX_RESULT_CHARS` 12_000 → 65536 |
| FR4 | 作为用户，我希望现有行为完全兼容——落盘机制、文件路径指引、写时自清理全部保留 | 落盘格式/清理逻辑/路径消息不变，仅阈值与 preview 长度变化 |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 一致性 | 全链路同一阈值 `64 * 1024 = 65536`（与 VS Code webview `MAX_TOOL_OUTPUT` 现有值一致），不引入第二套"64K" |
| N2 | 两端一致 | CLI 与 VS Code 扩展同一阈值、同一 preview 长度、同一 advisor 截断（共享 `~/.thincoder/config.json` 语义） |
| N3 | 可测试 | 阈值边界（恰好 65536 不落盘 / 65537 落盘）、preview 长度、advisor 截断均有单元测试；现有用 20_000 触发落盘的测试改为 >65536 输入 |
| N4 | 可维护 | 常量语义注释同步（"16k"→"64k"）；不改动落盘文件保留期（TMP_RETENTION_MS）、写时自清理、失败回退截断逻辑 |
