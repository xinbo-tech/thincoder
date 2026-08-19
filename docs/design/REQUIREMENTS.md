# ThinCoder 需求讨论记录

> 状态：v1 已交付（2026-08），v2 规划中。本文档记录需求讨论与决策过程。

## 已确定的决策

| 项 | 决策 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript (`.mjs`) | 不用 TypeScript，无构建步骤 |
| 依赖 | **零 npm 依赖** | 不信任外部代码的质量和稳定性——每引入一个依赖就引进一份技术债 |
| 运行平台 | Node.js >= 24（已定） | `node:sqlite` 等原生能力，免去存储依赖 |
| 界面 | TUI：裸 ANSI 转义 ✅ | 零依赖，终端控制自研（raw mode / 按键解析 / 宽字符，约几百行） |
| 模型兼容范围 | **只跟顶流、只跟最新**，不为了兼容老旧模型捆住手脚 | AI 产业迭代太快，兼容老旧模型是负资产——早期不成熟模型行为怪异，要堆大量防御性适配。只支持顶流厂商（DeepSeek/Kimi/GLM/Qwen/MiniMax/OpenAI/Claude/Gemini 等）的最新一代模型。预设表随模型换代增删，不留历史包袱。**（08-13 变更注记：Anthropic/Google 原生协议与通用自定义端点后来已支持——`format: anthropic/google` 三个 transport 均已实现。）** |
| 上下文策略 | **准比短重要，宁长勿缺** | 过去的"精炼焦虑"是 4K/8K 时代的阴影。现在主流模型 1M 窗口是常态，未来继续增长。信息完整比字数少重要得多——不要为了省 token 砍掉模型需要的上下文。 |
| Thin 工程定位 | **锐利可靠，不是功能简陋** | 零依赖不是苦行，是工程洁癖——每引入一个依赖就引进一份技术债（bug、安全漏洞、版本冲突）。我们做的是专业工程工具，不是玩具。 |
| 国际化 | **面向全球用户，不做中文限定** | 不预设用户群体为中国开发者。提示词用英文书写（模型对英文指令服从性更好），TUI 文本、系统消息、CLI 输出均为英文。不因为团队在中国就假设用户也是。 |
| LLM 调用 | 原生 `fetch` 直连 OpenAI 兼容接口 ✅ | 不引 SDK，用户明确要求 |

## 项目定位与长期目标

**ThinCoder 的终极差异化目标是"团队记忆"** —— 一人学到、全队皆知。
这是继 teamcode（与 MiMo-Code 合作开发，因质量问题放弃）之后的第二次尝试。

- v1：不需要团队记忆，先把 agent 主干做薄做扎实
- 后期版本：实现团队记忆（需求细节见下）
- **架构约束**：v1 虽不实现，但存储和记忆的接口设计必须为团队记忆预留扩展位，避免后期推翻重来

## 团队记忆（远期目标，架构方向已定 ✅）

**核心原则：存储/同步 与 检索性能 分层解耦，不焊死在一个组件上。**

| 层 | 选型 | 职责 |
|---|---|---|
| 真相源 | **Git 仓库**（markdown 知识条目） | 团队同步（push/pull）、权限（继承 git 权限）、版本历史、PR review |
| 本地索引 | **SQLite**（`node:sqlite`，零依赖，可随时重建的易失品） | 一切检索都打在本地索引上，不直接扫文件系统 |
| 全文检索 | **SQLite FTS5**（BM25） | 10 万级文档个位数毫秒，对团队知识量级性能溢出 |
| 语义检索 | **embedding 向量存 sqlite BLOB + JS 暴力余弦**（Float32Array） | 1 万条≈几 ms，10 万条≈几十 ms，够用 |
| 混合排序 | FTS5 + 向量 RRF | 即 teamcode 宣称的 RAG，thin 实现 |
| 远期升级位 | pgvector / 中心化服务端 | 仅在条目百万级或多人并发写同一库时才需要；对调用方无感（接口预留） |

已细化：
- 共享内容范围 ✅：**全都要**——项目知识、架构决策、调试经验、代码规范
- 知识沉淀方式 ✅：**双轨制**，按内容性质分：
  - **手动分享**：代码规范、架构决策等"立规矩"类——人说了算，不依赖提取
  - **自动提取**：调试经验、问题解法等"沉淀"类——从会话中自动萃取（Dream/Distill 思路），靠人手动会想不起来分享
- embedding 服务选型 ✅：**SiliconFlow BAAI/bge-m3**（免费额度、中文效果好、OpenAI 兼容协议可直接复用 provider.mjs；Ollama 本地为离线备选，OpenAI 国内受限不考虑）

## v1 功能范围（已定 ✅）

**v1 功能范围（全部超额交付 ✅）：**

**做：**
- Agent 主循环：用户输入 → LLM → 工具调用 → 结果回喂，直到任务完成
- 基础工具集：read / write / edit / bash / glob / grep
- 上下文压缩：对话过长时自动摘要，撑住长任务（学 kimi-code）
- TUI：对话流 + 流式输出 + 输入框 + 状态栏（裸 ANSI）
- 个人记忆 → **三层记忆体系全部实现**（personal/project/team，FTS5 + 向量 RRF，markdown 条目 git 同步）——超出原计划（原仅规划 sqlite 单机轻量版）
- Agent 自律工具链 ✅：`task` / `plan` / `goal` / `verify`（跑真实测试 + 修复-验证循环）+ recent_changes / question / checkpoint
- 额外提前交付 ✅：子 agent 并行、MCP、checkpoint 断点恢复、团队记忆三层体系

**明确不做（留 v2+）：**
- 工作流引擎、桌面 GUI

## 反面教材（teamcode 的教训）

- AI 生成后不实际运行验证：类型错误、依赖错位、API 混用
- 文档吹得比实现大（PPT 项目）
- 依赖版本不对齐（ai-sdk 两个 provider 版本互掐）
- 死代码不清理

## 待讨论

- 配置与存储细节 ✅：`~/.thincoder/` 布局（sessions/、memory.db、config.json、teams/）已定型，配置文件格式为 JSON
- v2 git 同步层形态 ✅：**A+B 分层，且 B 可选**：
  - **Team 层（可选）**：独立团队记忆仓库（clone 到 `~/.thincoder/teams/<team>/`），跨项目共享。配置了才启用，不配置不强制——单机/个人使用不受影响
  - **Project 层**：项目仓库内 `.thincoder/memory/` 目录，项目专属知识，随项目仓库走
  - 检索时所有已启用层合并查询；git 操作直接调系统 git 命令，不引 git 库
- v2 条目格式 ✅：**Markdown + frontmatter**（type/title/tags/author/created），GitHub 上直接可读可编辑，PR review 友好；frontmatter 解析自研 ~30 行零依赖。sqlite 导出/JSONL 方案排除（不可读、不可 review）
- v2 冲突策略 ✅：**结构规避 + 诚实报错**：
  - 每条目一个文件（`YYYYMMDD-<slug>-<rand4>.md`），不同条目天然不冲突（99% 场景）
  - 同条目并发修改冲突时：报错并提示到仓库目录手动解决，把 git 的事还给 git
  - 不做自动合并、不做"保留双方"——知识被静默篡改比冲突更可怕
- v2 索引重建策略 ✅：**增量为主、重建兜底**：
  - sqlite 记录上次同步 commit hash；sync 时 `git diff --name-only <old>..HEAD` 只重索引变化条目
  - `reindex` 命令全量重建（索引是易失品，随时可从 markdown 重建）
  - embedding 向量存 sqlite 随条目走，不重复调 API；frontmatter 记 embedding 模型名，换模型强制重建向量
- v2 自动提取时机 ✅：**手动触发、自动候选、人工把关**：
  - 不做会话结束全自动沉淀（与人审原则冲突）
  - `thincoder distill` / TUI `/distill`：agent 读当前会话产出候选条目，逐条 y/n 确认后入库
  - rule 类候选默认提示"建议手动写"（双轨制）
