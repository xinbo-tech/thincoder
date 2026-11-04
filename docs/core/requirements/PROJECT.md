# 产品定性（PROJECT）· 需求

> 板块 = **产品定性**——ThinCoder 产品族的定位与跨产品共享契约（三独立产品 / 共享配置与会话 / Provider 契约）。
> 本档 = 产品级定性面的**需求层权威**（决策表 + 共享契约——承旧 VSC 档 `PROJECT.md` 的产品级定性面）。
> VSC 专有面（界面 / 入口 / 审批 / webview 形态 / 会话流时序）= `docs/vsc/requirements/PROJECT.md`（切分规则见 §5.2）。
> 产品级定性面（品类 / 用户 / 核心承诺 / 产品边界 / 定位坐标 / 两种工作模式 / 总体需求 / v1 范围 / v2 团队记忆 / 技术与质量约束）= §5。

## 1. 总体定位

ThinCoder 产品族 = **三个独立产品**（终端 CLI + VS Code 扩展 + 桌面端应用）——同级独立、用户只装哪一个都行；
共享设计理念、提示词体系，以及**会话数据与配置数据**（各端读写同一份磁盘文件，可无缝接续同一会话、同一组 provider）。

## 2. 产品族定性决策

| 项 | 决策 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript（`.mjs`） | 无 TypeScript，无构建步骤，ESM 原生 |
| 依赖 | 零 npm 运行时依赖 | 仅 `node:` 标准库 + 各端宿主 API（VSC 端宿主 = VS Code Extension API——见 `docs/vsc/requirements/PROJECT.md`；桌面端宿主 = Electron，随发行物分发——见 `docs/desktop/requirements/PROJECT.md`） |
| 产品关系 | 同级独立产品 | 互不依赖；同时装则共享配置与会话，切换无感 |

## 3. 跨产品共享契约

| # | 契约 | 内容 |
|---|---|---|
| **C1** | 配置共享 | 各端读写 `~/.thincoder/config.json`（`providers[]` + 顶层 `defaultModel`——`provider:model` 复合，新会话起点）；`activeProvider` = 派生读面（非存储契约）；敏感值位可携 `${env:VAR}` **显式引用**（消费侧解析——未设 ∕ 空串即抛错，**无隐式回退**）；旧 VS Code settings 一次性迁移后停用 |
| **C2** | 会话共享 | `~/.thincoder/sessions/`（完整 sha1(cwd) + 槽位）——各端互读，可无缝接续同一会话 |
| **C3** | Provider 预设权威 | preset 表以核 `thincoder-core/config-presets.mjs` 的 `PROVIDER_PRESETS` 为唯一权威（当前全集 **25** 个，含 `kimi-code` / `glm-code` / `mimo` / `mimoplan` / `claude`（format: anthropic）/ `gemini`（format: google）/ `huawei` / `opencode-go` ∥ `opencode-go-anthropic`（OpenCode Go 双协议侧——同 key，模型按侧选））——各端不各自硬编码（避免漂移）。 |
| **C4** | custom 三协议 | 手动输入 name / baseURL（**不携模型**），并选 API format：`openai`（默认）/ `anthropic` / `google`，写入 `provider.format`；三协议均有 transport |
| **C5** | 模型选择两级结构 | 渠道行 → 模型条目 两级菜单（**选取单位 = 模型条目——渠道行非可选**）+ add / remove / key 管理项（对齐 CLI `openModelPicker → openModelListForProvider`）；各端按各自界面形态实现（VSC 端形态见 `docs/vsc/requirements/PROJECT.md`） |
| **C6** | 添加 / 删除 provider 流程 | 对齐 CLI `addProviderFlow` / `removeProviderFlow` / `setKeyFlow`：添加 = 选 preset（过滤已添加）→ 自动填 `baseURL`（不携模型）→ 输入 API key（custom 走 C4 手动流程）；删除 = 列出非 active 的 provider；key 管理 = 单独入口 |
| **C7** | 多 Provider 默认选择 | 自动选第一个有 key 的 provider（用户配 key 本身就是选择行为；配了多个按列表顺序取第一个） |
| **C8** | API Key 存储 | Key 落 `~/.thincoder/config.json` 明文，各端共享同一份配置（决策动因：各端共享配置 > 密钥链隔离）；旧版 SecretStorage 仅用于一次性迁移，迁移后清除 |
| **C9** | 与 CLI 记忆互通 | **暂不处理**——VSC 文件式记忆（`.thincoder/memory/` markdown + frontmatter）与 CLI 条目格式兼容；自动互通 / 合并检索未做，决策保留 |

## 4. 三端关系

| 端 | 界面 | 记忆面 | 发行 |
|---|---|---|---|
| thincoder CLI | 终端 TUI（裸 ANSI） | 3 层记忆 + MCP | `npm i -g thincoder` |
| thincoder-vscode | VS Code 侧面板（Webview） | 文件式记忆 + MCP | VS Code Marketplace |
| thincoder-desktop | Electron 壳（前端本端自持） | 复用核记忆面 | 三平台安装包 |

共享面（同一磁盘位置，互相读写）：`~/.thincoder/config.json` 配置（providers + activeProvider）· `~/.thincoder/sessions/` 会话（完整 sha1(cwd) + 槽位）。

三端同级独立产品。用户只装哪一个都行；同时装则共享配置与会话，切换无感。

## 5. 产品定性（单产品面）

> 三观（`docs/core/requirements/PHILOSOPHY.md`）回答「agent 是谁、信什么」；
> 本节回答**产品层**问题：ThinCoder 作为一件产品是什么、给谁用、靠什么立足、明确不做什么。
> **本节是全部需求的上游**——任何需求 / 设计 / 代码与本节冲突时，改它们或走需求变更改本节。

### 5.1 品类与用户

- **品类**：**通用 AI 编码智能体**——能读写代码、与人协作完成软件开发任务。CLI/TUI、VS Code 扩展、桌面端、ACP 接入是接入面，不是定性。
- **用户**：**把代码交给 agent 负责、自己保留决策权的开发者与团队**——人定方向、agent 写代码。
  不假设用户在中国、不假设用户用 Node、不假设用户项目的目录形状（见 `docs/core/requirements/PORTABILITY.md` §2）。

### 5.2 核心承诺（立身之本）

| # | 承诺 | 含义 |
|---|---|---|
| C1 | **能干活** | 读→想→写→测的完整闭环：工具面、代码库检索、子代理并行、MCP |
| C2 | **靠得住** | 设计先行、评审把关、验证收尾（工程模式）——不是「生成即交付」 |
| C3 | **透明** | 交付与需求的差距**逐条交代**——人看不见代码，只能听见你说的话 |
| C4 | **不膨胀** | 零 npm 依赖、无构建步骤、只跟顶流模型——**锐利而非功能简陋** |
| C5 | **记得住**（路线） | 跨会话 / 跨人记忆——一人学到、全队皆知（终极差异化，v2） |

### 5.3 明确不做什么（产品边界）

- **不做通用编辑器 / IDE**——不重造编辑器；IDE 内以扩展 / ACP 接入（接入面属形态，不属定性）；桌面端同受此限——不含文件视图与编辑器；
- **不做云服务 / 托管平台**——本地运行、本地存储；团队记忆用 git 同步而非自建云；
- **不做模型 / 推理服务**——只做 agent 层，直连各家 API（原生 fetch）；
- **不做工作流引擎**——v2+ 也不当成重心；
- **不靠堆集成取胜**——零依赖政策是不变量：能不用依赖就不用。

### 5.4 定位坐标

在「什么都集成、依赖沉重」与「玩具」之间选第三条：**薄而利**——用约束（零依赖、只跟顶流模型、不堆功能）换锐利度，
把力气花在**协作纪律与记忆**上。用户可感知的差别一句话：**别人拼「能做什么」，它拼「做得多可靠、多透明、多可追溯」。**

### 5.5 两种工作模式

产品有两种工作模式，**互斥**（同一时刻只能处在一个，可随时切换），提示词两套独立：

| | **普通模式**（默认） | **工程模式** |
|---|---|---|
| 是什么 | 你说要什么，我就直接干——改 bug、加功能、写脚本、查问题，边做边交代；有规模的工作按批落地（批次档 + 台账），收口一次走文档规范化 + 独立评审。质量靠纪律和自查 | 动手前先把「打算怎么做」写成文档——独立评审挑毛病、你点头，才允许改代码；交付前再评审一遍、跑完验证才算完。慢，但每一步都有据可查 |
| 质量靠什么 | 纪律提示词 + 自查 + 收口一次独立评审（无机械拦截） | 机械拦截 + 独立评审 + 凭证链（先批准、后动手） |
| 什么时候用 | 默认；日常绝大多数任务 | 改动有规模、要留痕、值得先想清楚再动手的任务（多文件 / 跳模块 / 需评审） |
| 什么时候不用 | —— | 工程模式里没有「小修直改」这一档：想先改后走流程 ⇒ **换普通模式**（不在工程模式里开旁路）。 |

两模式的**差别只在约束强度**（机械门的有无）；**管理工作的逻辑同一套**——批次档 + 台账 + 收口（详细 = `docs/core/requirements/NORMAL-MODE.md` §5.6）。

**分工的总纲（用户 2026-11-02 23:54 逐字）**：「以后的逻辑是如果想先改后走流程，就直接用普通模式，工程模式就严格执行纪律，把决策权收回给人。」

⇒ **工程模式内不再有「这个算不算小改 / 这一步要不要走流程」的裁量**：判断权归人（换不换模式由你定），执行者只有两条路——走全链，或换普通模式。**为什么**：留给执行者解释的那部分，就是被用成豁免的那部分（本档 §5.5 与 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5 同源）。

**详细需求**：工程模式 → `docs/core/requirements/ENGINEERING-MODE-V2.md`；普通模式 → `docs/core/requirements/NORMAL-MODE.md` §5–§6。

### 5.6 总体需求与功能范围

**终极差异化目标 =「团队记忆」**——一人学到、全队皆知。
v1 不需要团队记忆、先把 agent 主干做薄做扎实；存储 / 记忆接口为团队记忆**预留扩展位**。

- **v1 功能范围**：Agent 主循环、基础工具集、上下文压缩、TUI、三层记忆体系（超原计划）、
  Agent 自律工具链（task / plan / goal / verify / recent_changes / question / checkpoint）、子 agent 并行 / MCP / checkpoint 断点恢复；
  明确不做（留 v2+）：工作流引擎。
- **v2 团队记忆（远期——核心原则：存储 / 同步与检索性能分层解耦）**：
  - **真相源** = Git 仓库（markdown 条目）
  - **本地索引** = SQLite（`node:sqlite`，可重建易失品）
  - **全文检索** = SQLite FTS5（BM25）
  - **语义检索** = embedding 向量存 sqlite BLOB + JS 余弦
  - **混合排序** = FTS5 + 向量 RRF
  - **远期升级位** = pgvector / 中心化服务端（接口预留）
  - **架构方向细化** = `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md`（v2 未启动，以其为输入）
  - **已细化的需求决策**：
    - 共享内容范围：全都要（项目知识 / 架构决策 / 调试经验 / 代码规范）
    - 沉淀双轨制：手动立规矩 + 自动萃取调试经验
    - embedding：SiliconFlow BAAI/bge-m3（Ollama 本地为离线备选）
    - git 同步层：A+B 分层且 B 可选（Team 层可选独立仓库 `~/.thincoder/teams/` + Project 层 `.thincoder/memory/`）
    - 条目格式：Markdown + frontmatter；冲突策略：结构规避 + 诚实报错
    - 索引重建：增量为主、重建兜底；自动提取：手动触发、自动候选、人工把关（`thincoder distill` / TUI `/distill`）

### 5.7 技术与质量约束

| 项 | 约束 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript（`.mjs`） | 不用 TypeScript，无构建步骤 |
| 依赖 | **零 npm 依赖** | 每引入一个依赖就引进一份技术债 |
| 运行平台 | Node.js >= 24 | `node:sqlite` 等原生能力 |
| 界面 | TUI：裸 ANSI 转义 | 零依赖，终端控制自研 |
| 模型兼容 | **只跟顶流、只跟最新** | 兼容老旧模型是负资产；预设表随换代增删（已支持 Anthropic / Google 原生协议与自定义端点——`format: anthropic/google`） |
| 上下文策略 | **准比短重要，宁长勿缺** | 1M 窗口是常态；不为省 token 砍模型需要的上下文 |
| Thin 定位 | **锐利可靠，不是功能简陋** | 零依赖是工程洁癖，非苦行 |
| 国际化 | **面向全球，不做中文限定** | 提示词 / TUI / 系统消息均英文；不因团队在中国假设用户也是 |
| LLM 调用 | 原生 `fetch` 直连 OpenAI 兼容接口 | 不引 SDK |

**质量约束（硬约束）**：交付必须实测可跑（生成后不实际运行验证 = 类型错误 / 依赖错位 / API 混用）；
文档不得超出实现；依赖面零引入；死代码随批清理。
