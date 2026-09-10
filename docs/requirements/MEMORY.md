# 记忆（MEMORY）— 需求

> 板块：记忆系统（三层记忆 + 代码/文档索引）。需求层文档（`docs/requirements/`）。
> 来源：2026-09-10 自 `../design/MEMORY.md` 抽取需求陈述（§1 总览与目标）。
> 状态：**现行**。设计+测试见 `../design/MEMORY.md`；长期目标（团队记忆）见 `PROJECT.md` §2.2。

## 1. 总体需求

记忆系统让 agent **跨会话**保存、检索、治理三类知识——个人记忆、项目共享记忆、团队共享记忆——
并同时提供**代码/文档索引**（code/doc chunk），使 `memory` / `code_search` / `doc_search` / `repo_outline`
得以在当前代码库内检索。

这是 ThinCoder 终极差异化目标（**团队记忆**——一人学到、全队皆知）的承载面。

## 2. 功能性需求

| # | 需求 | 说明 |
|---|---|---|
| F1 | 三层记忆 | 写入时指定 layer：personal（纯 DB 行）/ project（项目 markdown 文件为源，DB 为索引）/ team（git 仓库同步） |
| F2 | 磁盘为真相 | project/team 层：**markdown 文件即知识本体**（可人工编辑、可 git 管理）；DB 只是可重建索引 |
| F3 | 双路检索 | FTS5（含 CJK 逐字分段）+ 向量余弦（懒构建，失败**静默降级纯 FTS**） |
| F4 | 单一工具面 | `memory` 单工具、`action` 路由五动作（search/put/list/delete/clear）——旧 `memory_put/search/delete` 裸工具已合并退役 |
| F5 | 代码/文档索引 | 与记忆同库检索面（`code_search`/`doc_search`/`repo_outline`） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零依赖 | 存储统一单文件 `~/.thincoder/memory.db`（`node:sqlite`：FTS5 虚表 + BM25 排序 + 向量 BLOB）——零第三方依赖 |
| N2 | 可重建 | DB 为易失索引，真相在文件/git——损坏可重建，不丢知识 |
| N3 | 降级可用 | 向量检索失败静默降级 FTS——记忆功能不因可选能力缺失而不可用 |
| N4 | 跨端 | VS Code 端同语义独立实现（镜像待补的后续项见设计档） |
