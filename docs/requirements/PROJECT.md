# ThinCoder 项目需求（PROJECT）

> 板块：项目层（定位/技术约束/功能范围/远期需求）。需求层文档（`docs/requirements/`）。
> 状态：**v1 已交付（2026-08）；v2 规划中**（架构方向见 `../design/_archive/ARCHITECTURE-v2.md`）。
> 2026-09-10 自 `docs/design/REQUIREMENTS.md` 迁入本目录（文档重组）——三层重排：
> 总体需求 / 功能性需求 / 非功能性需求（内容零丢失，仅归类）。

## 1. 总体需求

**终极差异化目标 = "团队记忆"**——一人学到、全队皆知。这是继 teamcode（与 MiMo-Code 合作，因质量问题放弃）之后的第二次尝试。

- v1：不需要团队记忆，先把 agent 主干做薄做扎实
- 后期版本：实现团队记忆（需求细节见下）
- 架构约束：v1 虽不实现，但存储/记忆接口为团队记忆**预留扩展位**

## 2. 功能性需求

### 2.1 v1 功能范围（已全部超额交付 ✅）

**做**：Agent 主循环、基础工具集（read/write/edit/bash/glob/grep）、上下文压缩、TUI、
三层记忆体系（超原计划）、Agent 自律工具链（task/plan/goal/verify/recent_changes/question/checkpoint）、
子 agent 并行/MCP/checkpoint 断点恢复（提前交付）。

**明确不做（留 v2+）**：工作流引擎、桌面 GUI。

### 2.2 团队记忆（远期功能——v2）

**核心原则：存储/同步 与 检索性能 分层解耦，不焊死在一个组件上。**
架构方向细化记录见 `../design/_archive/ARCHITECTURE-v2.md`（v2 未启动，以其为输入）。

| 层 | 选型 | 职责 |
|---|---|---|
| 真相源 | Git 仓库（markdown 条目） | 团队同步、权限、版本历史、PR review |
| 本地索引 | SQLite（node:sqlite，可重建易失品） | 检索打在本地索引，不扫文件系统 |
| 全文检索 | SQLite FTS5（BM25） | 10 万级文档毫秒级 |
| 语义检索 | embedding 向量存 sqlite BLOB + JS 余弦 | 1 万条几 ms |
| 混合排序 | FTS5 + 向量 RRF | thin 版 RAG |
| 远期升级位 | pgvector/中心化服务端 | 条目百万级才需要，接口预留 |

**已细化的需求决策**：

- 共享内容范围 ✅：全都要——项目知识/架构决策/调试经验/代码规范
- 知识沉淀 ✅ 双轨制：手动（代码规范/架构决策——立规矩类）；自动提取（调试经验——从会话萃取）
- embedding ✅：SiliconFlow BAAI/bge-m3（Ollama 本地为离线备选）
- git 同步层 ✅ A+B 分层且 B 可选：Team 层（可选独立仓库 `~/.thincoder/teams/`）+ Project 层（`.thincoder/memory/`）
- 条目格式 ✅：Markdown + frontmatter（可读可 PR review；sqlite 导出/JSONL 排除）
- 冲突策略 ✅：结构规避 + 诚实报错（每条目一文件，天然不冲突；同条目并发冲突报错交 git）
- 索引重建 ✅：增量为主、重建兜底（sqlite 记同步 hash，`git diff` 增量重索引；`reindex` 全量）
- 自动提取时机 ✅：手动触发、自动候选、人工把关（`thincoder distill`/TUI `/distill`，逐条确认）

## 3. 非功能性需求（技术要求）

### 3.1 已定的技术约束

| 项 | 约束 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript (`.mjs`) | 不用 TypeScript，无构建步骤 |
| 依赖 | **零 npm 依赖** | 每引入一个依赖就引进一份技术债 |
| 运行平台 | Node.js >= 24 | `node:sqlite` 等原生能力 |
| 界面 | TUI：裸 ANSI 转义 | 零依赖，终端控制自研 |
| 模型兼容 | **只跟顶流、只跟最新** | 兼容老旧模型是负资产。支持 DeepSeek/Kimi/GLM/Qwen/MiniMax 等最新一代；预设表随换代增删（已支持 Anthropic/Google 原生协议与自定义端点——`format: anthropic/google`） |
| 上下文策略 | **准比短重要，宁长勿缺** | 1M 窗口是常态；不为了省 token 砍模型需要的上下文 |
| Thin 定位 | **锐利可靠，不是功能简陋** | 零依赖是工程洁癖，非苦行 |
| 国际化 | **面向全球，不做中文限定** | 提示词/TUI/系统消息均英文；不因团队在中国假设用户也是 |
| LLM 调用 | 原生 `fetch` 直连 OpenAI 兼容接口 | 不引 SDK |

### 3.2 质量约束（来自反面教材——teamcode 的教训）

- AI 生成后不实际运行验证：类型错误、依赖错位、API 混用
- 文档吹得比实现大（PPT 项目）
- 依赖版本不对齐（ai-sdk 两个 provider 版本互掐）
- 死代码不清理

> 这四条是**硬约束**：交付必须实测可跑；文档不得超出实现；依赖面零引入（见 3.1）；死代码随批清理。
