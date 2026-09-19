# CLI ↔ VS Code 能力差距

> 目标：把 CLI 已验证的能力全部移植到 VS Code 扩展。本文档即 checklist，完成一条划一条。

## 代码理解（3 项）

| # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 1 | `repo_outline` | `src/tools/repomap.mjs` | 文件依赖关系图。Agent 看到哪些文件 import 了哪些文件，改一处知道影响面。 | ✅ |
| 2 | `code_search` | `src/memory/code-sync.mjs`（CLI 仓） | 搜索源代码，返回匹配代码块 + 行号。基于 VS Code 内置文件搜索，无 FTS5。 | ✅ |
| 3 | `doc_search` | `src/memory/docs.mjs`（CLI 仓） | 搜索 README、设计文档、AGENTS.md。按 ## 标题分块返回。 | ✅ |

## 长期记忆（3 项）

| # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 4 | `memory` 单工具（search/put/list/delete/clear 五动作） | `src/memory-tool.mjs`（工具面 + 动作执行）、`src/memory.mjs`（存储/检索核） | 知识持久化存储：文件式 markdown + frontmatter（layer 分目录，纯 node:fs 零依赖——见 MEMORY.md）；检索关键词打分（标题 3pt > 标签 2pt > 正文 1pt），embedding 可用时向量语义优先。 | ✅ （W8 已迁核——现体 `thincoder-core/memory.mjs`）|
| 5 | 代码索引同步 | `src/memory/code-sync.mjs`（CLI 仓） | 需要 better-sqlite3（FTS5），零依赖约束下暂不支持。`code_search` 用 VS Code 内置搜索替代。 | ⏸️ |
| 6 | 文档索引同步 | `src/memory/docs.mjs`（CLI 仓） | 同上。`doc_search` 用 VS Code 内置搜索替代。 | ⏸️ |

## Provider 健壮性（3 项）

| # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 7 | TPM 闸门 | `src/provider/rate.mjs` | 滑动窗口限流，超预算自动等待，实测 usage 记账。（W10 已迁核——现体 `thincoder-core/provider/rate.mjs`） | ✅ |
| 8 | Partial Mode 续写 | `src/provider/core.mjs`（CLI 仓） | finish_reason=length 时自动续写，最多 3 次递归。 | ✅ |
| 9 | DeepSeek Prefix Completion | `src/provider/core.mjs`（CLI 仓） | /beta 端点 + prefix 消息续写，含双写 /beta 防护。 | ✅ |

## MCP 协议（1 项）

| # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 10 | MCP 支持 | `src/mcp/` | stdio + HTTP + WS 三种 transport，JSON-RPC 2.0。server 工具**动态展开**为原生工具（`{server}_{tool}`——模型直接调用、可并行——无网关路由——mcpTool 网关已废弃——MCP.md D1）。 | ✅ |

## Checkpoint（1 项）

| # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 11 | Checkpoint rewind | `src/git/checkpoint.mjs` | **全量副本**快照（`~/.thincoder/checkpoints/{cwdHash12}/`——git stash 已退役）+ `rewind`（自动创建恢复前快照，可逆）+ `cat`（查看快照内文件）+ 单文件恢复。 | ✅ |

---

## 已补齐

| # | 能力 | 备注 |
|---|------|------|
| 1-3 | 代码理解 | `repo_outline` + `code_search` + `doc_search` |
| 4 | 长期记忆 | `memory` 单工具五动作（文件式 md + frontmatter 存储） |
| 7-9 | Provider | TPM 闸门 + Partial Mode + DeepSeek Prefix |
| 10 | MCP | stdio + HTTP + WS transport，工具动态展开（`mcpTool` 网关已废弃——源 = MCP.md D1） |

## 受限于零依赖不可移植

| # | 能力 | 原因 |
|---|------|------|
| 5-6 | 代码/文档索引同步 | 需要 better-sqlite3（FTS5 + 向量），零依赖约束下暂不引入。功能由 VS Code 内置搜索替代。 |
