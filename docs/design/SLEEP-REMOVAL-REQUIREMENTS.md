# sleep 工具删除 — 需求（CLI）

> 状态：**已实现**（2026-08-25 评审修订后实施；npm 0.12.43 / vscode 0.1.49 发布）
> 关联：`docs/design/SLEEP-REMOVAL-TUNING.md`（设计）、`docs/design/README.md`（文档地图）
> 范围：本仓库（thincoder CLI）；VS Code 扩展（thincoder-vscode）有同需求独立文档（`SLEEP-REMOVAL-REQUIREMENTS.md`），两端语义一致
> ⚠️ **两端必须同步改（lockstep）**：工具定义/注册/提示词路由在两仓库各有实现，单边删除会造成工具表不一致

## 1. 总体目标

删除 `sleep` 工具。该工具在编程场景**零真实使用**（两端会话历史 9828 个 session 文件中 0 次模型调用），且其工具说明"wait for an async task to finish"误导模型在同步阻塞工具（如 advisor）之后调用 sleep 空等——造成 10-300 秒的无效等待。删除比修改说明更彻底：只要工具在列表里，模型就有调用动机。

## 2. 功能用户故事（Functional）

| # | 用户故事 | 验收语义 |
|---|---|---|
| FR1 | 作为用户，我希望模型不再拥有 sleep 工具，杜绝"同步工具执行后 sleep 空等"的误用 | 工具定义/注册删除，模型工具表无 `sleep` |
| FR2 | 作为用户，我希望提示词不再指向 sleep 工具（路由规则删除） | `discipline.md` 的 "sleep → dedicated tools" 表述删除；等待需求允许走 bash 内联命令 |
| FR3 | 作为用户，我希望代码内部真实的等待逻辑不受影响（速率限制/重试退避） | `_rateHooks.sleep`/`embedding.mjs` 内部 sleep 函数保留（非工具，模型不可见） |

## 3. 非功能标准（Non-functional）

| # | 维度 | 标准 |
|---|---|---|
| N1 | 彻底性 | 工具定义、注册（3 处）、说明文件、提示词引用、测试全部清理，无残留 |
| N2 | 可逆 | 删除仅限工具层；git 历史可恢复；若未来引入真异步工具再按新语义重新设计 |
| N3 | 一致性 | 两端同步删除，工具表/提示词行为一致 |
| N4 | 可测试 | 删除后工具表不含 sleep 的断言测试（可选）；现有测试中 sleep 用例删除 |
