# 覆盖率缺口修复 — 需求（CLI）

> 状态：**历史已取代——建议归档**（原状态 2026-08-25 已实现，commit a966af0/acce3e4）。
> **取代说明（2026-09-07）**：本专题的唯一交付物是锁测试覆盖的**回归断言用例**，该批用例已被
> 测试清零政策 + TESTING.md §1 D-T5 Phase-3 清理删除（advisor-review「无 12_000 边界残留」整案、
> agent-core「16_000/2_000 无残留」整案均在删除清单）。现 `test/` 的 `.test.mjs` 仅剩
> `verify-redesign.test.mjs`（slow-gate 机制自验，非本专题产物）。本专题据此退役——保留为历史记录，
> 不再作为当前需求文档。
> 唯一存活残迹 = `src/advisor/run.mjs` 的 `export const MAX_RESULT_CHARS`（`TOOL-OUTPUT-LIMITS`
> 机制的一部分，归该文档管辖）。

> 原范围关联：`COVERAGE-GAPS-TUNING.md`（设计）、`docs/design/README.md`（文档地图）。
> VS Code 扩展有同需求独立文档，两端语义一致。

## 1. 总体目标（历史）

TOOL-OUTPUT-LIMITS（64K）批次代码评审遗留的测试覆盖缺口收口：

1. CLI 端 `MAX_RESULT_CHARS` 常量断言方式与 vscode 不一致（读源码正则 vs import 断言）。
2. CLI 端"旧阈值无残留"（AC7）靠一次性人工 grep，无自动化锁定。

目标：把①与 CLI 端 AC7 变成可回归的自动化检查（**已随测试清零政策退役**）；vscode 端 AC9
自动化记录待后续批（评审 #1，2026-08-25）。

## 2. 功能用户故事（Functional，历史）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为开发者，我希望 `MAX_RESULT_CHARS` 以标准 import 方式断言（与 vscode 端一致），锁定导出值 | 常量 `export`；测试 `import { MAX_RESULT_CHARS }` + `assert.equal(MAX_RESULT_CHARS, 64 * 1024)`（保证范围 = 值锁定） |
| FR2 | 作为开发者，我希望"旧阈值（16000/2000/12000）无残留"成为自动化测试 | 源码断言测试：helpers.mjs 无 `16_000`/`2_000`；advisor/run.mjs 无 `12_000` |

## 3. 非功能标准（Non-functional，历史）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 两端一致 | CLI 与 vscode 同一断言语义；`MAX_RESULT_CHARS` 两端均导出 |
| N2 | 可维护 | 断言限定在工具输出相关文件（不误伤业务常量）；区分旧阈值与合法业务常量 |
| N3 | 可测试 | 新增用例全部通过；全套测试无回归 |

## 变更记录

- 2026-08-25：实施（commit a966af0/acce3e4）。
- 2026-09-07：判定退役——测试清零政策删除了本专题的全部回归断言，改为历史记录并建议归档。
