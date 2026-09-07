# Verify 工具文档改动快路径 > 状态：**已实现**（2026-08-03，`src/agent-tools/verify.mjs` 含 doc-only 快路径，`src/advisor/repos.mjs` 的 `isDocFile` 三处判定统一）。
> 关联：`src/agent-tools/verify.mjs`、`src/advisor/repos.mjs`（isDocFile） ## 问题陈述 工程模式下（以及普通模式）修改纯文档（docs/、*.md、LICENSE 等）后调用 verify：
- verify 仍输出完整报告（git diff --stat + 自检清单），对文档改动无意义；
- 若以 `full=true` 调用会跑全套测试——文档改动完全不需要；
- 体验上"改了文档也要过一遍验证流程"，与 runAdvisorReview 已有的 doc-only 快路径（"No issues found — documentation-only changes, code review skipped."）不对称。 ## 解决方案 在 `verify` 工具入口加 **doc-only 快路径**：changed files 全部为文档文件（复用 `isDocFile`，与 guard/门禁同一判定）时： ```
=== VERIFICATION REPORT ===
Changed files (git diff --stat):
...（列出文件）
Documentation-only changes — skipping syntax checks and tests.
（_verifyPassed = true，快速返回）
``` - 不改任何其他逻辑（代码改动的 verify 行为完全不变）；
- 复用 `src/advisor/repos.mjs` 的 `isDocFile`，三处判定（guard、dispatch 门禁、verify）保持一致；
- git 不可用/无仓库时维持现状（changedFiles 为空 → 现有路径）。 ## 受影响文件 | 文件 | 动作 |
|---|---|
| `src/agent-tools/verify.mjs` | 修改（入口加 doc-only 检查，import isDocFile） |
| `test/tools.test.mjs` 或 verify 相关测试 | 修改（新增 doc-only 快路径用例） | 不涉及：guard 逻辑（工程模式已关闭）、dispatch 门禁、提示词。 ## 验收标准 1. 仓库内仅修改文档文件（.md 等）→ 调 verify → 输出含 "Documentation-only changes" 且**不执行** node --check、不跑任何测试、`_verifyPassed = true`。
2. 改动含代码文件（.mjs/.js）→ verify 行为与现状完全一致（语法检查 + 相关测试）。
3. `node --test test\*.test.mjs` 全套通过。
