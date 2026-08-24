# 覆盖率缺口修复 — 需求（CLI）

> 状态：待评审（2026-08-25）
> 关联：`docs/design/COVERAGE-GAPS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展（thincoder-vscode）有同需求独立文档（`COVERAGE-GAPS-REQUIREMENTS.md`），两端语义一致
> 背景：TOOL-OUTPUT-LIMITS 批代码评审遗留 3 项（2 项在本仓库，1 项在 vscode 端），本批收口

## 1. 总体目标

修复 TOOL-OUTPUT-LIMITS（64K）批次遗留的测试覆盖缺口：①CLI 端 `MAX_RESULT_CHARS` 常量断言方式与 vscode 不一致（读源码正则 vs import 断言）；②CLI 端"旧阈值无残留"（AC7）靠一次性人工 grep，无自动化锁定。目标：本批把①与 CLI 端 AC7 变成可回归的自动化检查；vscode 端 AC9 自动化**记录待后续批**（评审 #1，2026-08-25——CLI 断言查 CLI 专属字面量，不覆盖 vscode 20K 残留，byte-identical 不算覆盖）。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为开发者，我希望 `MAX_RESULT_CHARS` 以标准 import 方式断言（与 vscode 端一致），锁定导出值 | 常量 `export`；测试 `import { MAX_RESULT_CHARS }` + `assert.equal(MAX_RESULT_CHARS, 64 * 1024)`（替代读源码正则；**保证范围 = 值锁定**，截断点消费由现有行为测试与代码审查兜底——评审 #2，2026-08-25） |
| FR2 | 作为开发者，我希望"旧阈值（16000/2000/12000）无残留"成为自动化测试，而非人肉 grep | 新增源码断言测试：helpers.mjs 无 `16_000`/`2_000`（边界匹配）；advisor/run.mjs 无 `12_000`（边界匹配，评审 #3） |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 两端一致 | CLI 与 vscode 同一断言语义；`MAX_RESULT_CHARS` 两端均导出 |
| N2 | 可维护 | 断言限定在工具输出相关文件（不误伤业务常量如 20000 秒超时等）；区分旧阈值与合法业务常量 |
| N3 | 可测试 | 新增用例全部通过；全套测试无回归 |
