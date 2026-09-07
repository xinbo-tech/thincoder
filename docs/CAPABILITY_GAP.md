# CLI ↔ VS Code 能力差距 > 目标：把 CLI 已验证的能力全部移植到 VS Code 扩展。本文档即 checklist，完成一条划一条。 ## 代码理解（3 项） | # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 1 | `repo_outline` | `src/tools/repomap.mjs` | 文件依赖关系图。Agent 看到哪些文件 import 了哪些文件，改一处知道影响面。 | ✅ |
| 2 | `code_search` | `src/memory/code-sync.mjs` | 搜索源代码，返回匹配代码块 + 行号。基于 VS Code 内置文件搜索，无 FTS5。 | ✅ |
| 3 | `doc_search` | `src/memory/docs.mjs` | 搜索 README、设计文档、AGENTS.md。按 ## 标题分块返回。 | ✅ | ## 长期记忆（4 项） | # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 4 | `memory_put` 工具 | `src/memory/core.mjs` | Agent 学到的知识持久化存储。JSON 文件存储，纯 Node.js 标准库。 | ✅ |
| 5 | `memory_search` 工具 | `src/memory/core.mjs` | 关键词匹配 + 评分排序（标题 3pt > 标签 2pt > 正文 1pt）。 | ✅ |
| 6 | 代码索引同步 | `src/memory/code-sync.mjs` | 需要 better-sqlite3（FTS5），零依赖约束下暂不支持。`code_search` 用 VS Code 内置搜索替代。 | ⏸️ |
| 7 | 文档索引同步 | `src/memory/docs.mjs` | 同上。`doc_search` 用 VS Code 内置搜索替代。 | ⏸️ | ## Provider 健壮性（3 项） | # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 8 | TPM 闸门 | `src/provider/rate.mjs` | 滑动窗口限流，超预算自动等待，实测 usage 记账。 | ✅ |
| 9 | Partial Mode 续写 | `src/provider/core.mjs` | finish_reason=length 时自动续写，最多 3 次递归。 | ✅ |
| 10 | DeepSeek Prefix Completion | `src/provider/core.mjs` | /beta 端点 + prefix 消息续写，含双写 /beta 防护。 | ✅ | ## MCP 协议（1 项） | # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 11 | MCP 支持 | `src/mcp/` | stdio + streamable HTTP 两种 transport，JSON-RPC 2.0。mcpTool 统一入口（connect/list/call/disconnect）。 | ✅ | ## Checkpoint（1 项） | # | 能力 | CLI 位置 | 说明 | 状态 |
|---|------|---------|------|------|
| 12 | Checkpoint rewind | `src/git/checkpoint.mjs` | git stash 快照 + `rewind`（自动创建恢复前快照，可逆）+ `cat`（查看快照内文件）+ 单文件恢复。 | ✅ | --- ## 已补齐 | # | 能力 | 备注 |
|---|------|------|
| 1-3 | 代码理解 | `repo_outline` + `code_search` + `doc_search` |
| 4-5 | 长期记忆 | `memory_put` + `memory_search`（JSON 文件存储） |
| 8-10 | Provider | TPM 闸门 + Partial Mode + DeepSeek Prefix |
| 11 | MCP | stdio + HTTP transport，`mcpTool` 入口 | ## 受限于零依赖不可移植 | # | 能力 | 原因 |
|---|------|------|
| 6-7 | 代码/文档索引同步 | 需要 better-sqlite3（FTS5 + 向量），零依赖约束下暂不引入。功能由 VS Code 内置搜索替代。 |
