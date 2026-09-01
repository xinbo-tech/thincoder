# CLI Lint 引入 — 需求（CLI）

> ⚠️ **已被 TOOLS.md §10.2 取代（2026-09-02）**：ESLint 全套已删除，改为零依赖 `node scripts/check-syntax.mjs`（node --check）。本文件保留为沿革快照，内容不再生效。
>
> 状态：**已实现**（2026-08-25 实施完成：0 error / 668 测试全绿；普通模式直接实施，评审未走）
> 关联：`docs/design/CLI-LINT-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展已有 eslint（0 error），本批不动 vscode 端
> 背景：2026-08-25 代码质量评估发现 CLI 无 lint（无配置、无 script、无 devDeps）——风格漂移只能靠 review 抓

## 1. 总体目标

给 CLI 引入 ESLint（与 vscode 端同规则基线），消除 dry-run 暴露的 21 个 error，使 `npx eslint src` 达到 **0 error**（与 vscode 对齐）。warning 暂不清理（另批），但规则全部就位，增量改动即时受检。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为开发者，我希望 `npm run lint` 一条命令跑 lint | package.json 增加 `lint: eslint src` script |
| FR2 | 作为开发者，我希望 lint 结果 0 error（21 个全部消除） | errors 清零：no-undef（globals 配置）、no-useless-assignment（删死赋值）、preserve-caught-error（补 cause） |
| FR3 | 作为开发者，我希望现有 668 个测试全部不回归 | 修复只动死代码与错误构造，行为零变化；`node --test test/*.test.mjs` 全绿 |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 两端一致 | eslint.config.mjs 基于 vscode 版派生（同 `@eslint/js` recommended 基线、同核心规则），globals 按纯 Node 运行时适配 |
| N2 | 零依赖原则不破 | eslint/@eslint/js 仅入 devDependencies（发布产物不含，与 vscode 同做法） |
| N3 | 最小侵入 | warning 一律不动（含 TUI 正则控制字符——`\x1b` ANSI 是本质需求）；修复只针对 error 级 |
| N4 | 可测试 | `npm run lint` exit 0；全套测试通过 |
