# ThinCoder VS Code — 功能范围（FEATURES）

> 归位注记：本档自 `docs/requirements/PROJECT.md`（原 `docs/design/REQUIREMENTS.md`）§v1 功能范围节**逐字拆出**（文档体系各仓自持批 LEDGER-SELF-CONTAINED——拆出后 `PROJECT.md` 不再载该节）。
> 定位：本仓 **v1 功能范围清单**（已实现态）——需求层功能面；产品定位与决策记录见 `PROJECT.md`。

## v1 功能范围（已实现）

- Agent 主循环：多轮工具调用，上下文压缩，子 agent 派生
- 工具系统：20+ 工具（文件/搜索/Git/系统/网络/交互/补丁）
- Agent 自律工具链：`task` / `plan` / `goal` / `verify` / `recent_changes` / `subagent` / `skill`
- 多 Provider：20 个 preset（含 Claude/Gemini）+ 自定义 endpoint（openai/anthropic/google 三协议），与 CLI 共享 `~/.thincoder/config.json`
- 多会话 + 模型选择器 + 设置面板 + 快捷键
- `autoApprove` 会话级开关（槽位字段，与 CLI 共享），默认 `false`；AUTO 按钮 / approve-all 翻转，mid-turn 立即生效
- repo_outline + context compaction

**v1 范围已全部覆盖（08-14）：** 文件式记忆（`.thincoder/memory/` markdown + frontmatter，CLI 格式兼容）、MCP 客户端（stdio/http/ws）、read_image（工具 + 粘贴图片）、编辑器上下文感知（editor-context 注入）、LSP 集成（`tools/lsp.mjs`，直接用 VS Code 语言服务 API）均已实现。v2 待定项暂无。

## 变更记录

- 2026-09-12：建档（拆出——内容自 `PROJECT.md` 原 §v1 功能范围节逐字迁入，零语义变更）。
