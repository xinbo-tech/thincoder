# 产品定性（PROJECT）· 需求

> 板块 = **产品定性**——ThinCoder 产品族的定位与跨产品共享契约（两独立产品 / 共享配置与会话 / Provider 契约）。
> 本档 = 产品级定性面的**需求层权威**（决策表 + 共享契约——承旧 VSC 档 `PROJECT.md` 的产品级定性面）。
> VSC 专有面（界面 / 入口 / 审批 / webview 形态 / 会话流时序）= `docs/vsc/requirements/PROJECT.md`（本批同 split——切分规则见 §5.2）。
> CLI 侧同名档（`thincoder-cli/docs/requirements/PROJECT.md`——产品定性更完整）**已并入（2026-09-15 · CLI 尾部真批 · 按其档头自注对账合并）**——
> 产品级定性面（品类 / 用户 / 核心承诺 / 产品边界 / 定位坐标 / 两种工作模式 / 总体需求 / v1 范围 / v2 团队记忆 / 技术与质量约束）入 §5；(d) 类入 §6.1。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 5**——`thincoder-vscode/docs/requirements/PROJECT.md` 拆分重建：产品级定性面 ⇒ 本档；
> 旧档原地一字不改、留作参照历史）。

## 1. 总体定位

ThinCoder 产品族 = **两个独立产品**（终端 CLI + VS Code 扩展）——同级独立、用户只装哪一个都行；
共享设计理念、提示词体系，以及**会话数据与配置数据**（两端读写同一份磁盘文件，可无缝接续同一会话、同一组 provider）。

## 2. 产品族定性决策

| 项 | 决策 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript（`.mjs`） | 无 TypeScript，无构建步骤，ESM 原生 |
| 依赖 | 零 npm 运行时依赖 | 仅 `node:` 标准库 + 各端宿主 API（VSC 端宿主 = VS Code Extension API——见 `docs/vsc/requirements/PROJECT.md`） |
| 产品关系 | 同级独立产品 | 互不依赖；同时装则共享配置与会话，切换无感 |

## 3. 跨产品共享契约

| # | 契约 | 内容 |
|---|---|---|
| **C1** | 配置共享 | 两端读写 `~/.thincoder/config.json`（`providers[]` + `activeProvider`）；`apiKey` 缺省回退环境变量；旧 VS Code settings 一次性迁移后停用 |
| **C2** | 会话共享 | `~/.thincoder/sessions/`（完整 sha1(cwd) + 槽位）——两端互读，可无缝接续同一会话 |
| **C3** | Provider 预设权威 | preset 表以核 `thincoder-core/config-presets.mjs` 的 `PROVIDER_PRESETS` 为唯一权威（当前全集 **21** 个，含 `kimi-code` / `glm-code` / `mimo` / `mimoplan` / `claude`（format: anthropic）/ `gemini`（format: google））——各端不再各自硬编码（避免漂移）。〔2026-09-20 渠道接入批同步：旧述权威路径 `thincoder-cli/src/config.mjs` 已不存在（#129 融合后表体住核）；计数 20→21 与 `thincoder-core/config-presets.mjs` 同变〕 |
| **C4** | custom 三协议 | 手动输入 name / baseURL / model，并选 API format：`openai`（默认）/ `anthropic` / `google`，写入 `provider.format`；三协议均有 transport |
| **C5** | 模型选择两级结构 | provider → 模型 两级 + add / remove / key 管理项（对齐 CLI `openModelPicker → openModelListForProvider`）；各端按各自界面形态实现（VSC 端形态见 `docs/vsc/requirements/PROJECT.md`） |
| **C6** | 添加 / 删除 provider 流程 | 对齐 CLI `addProviderFlow` / `removeProviderFlow` / `setKeyFlow`：添加 = 选 preset（过滤已添加）→ 自动填 baseURL / model → 输入 API key（custom 走 C4 手动流程）；删除 = 列出非 active 的 provider；key 管理 = 单独入口 |
| **C7** | 多 Provider 默认选择 | 自动选第一个有 key 的 provider（用户配 key 本身就是选择行为；配了多个按列表顺序取第一个） |
| **C8** | API Key 存储 | Key 落 `~/.thincoder/config.json` 明文，与 CLI 共享同一份配置（决策动因：两端共享配置 > 密钥链隔离）；旧版 SecretStorage 仅用于一次性迁移，迁移后清除 |
| **C9** | 与 CLI 记忆互通 | **暂不处理**——VSC 文件式记忆（`.thincoder/memory/` markdown + frontmatter）与 CLI 条目格式兼容；自动互通 / 合并检索未做，决策保留 |

## 4. 与 thincoder CLI 的关系

```
thincoder CLI                          thincoder-vscode
├── 终端 TUI（裸 ANSI）               ├── VS Code 侧面板（Webview）
├── 3 层记忆 + MCP                    ├── 文件式记忆 + MCP
└── npm i -g thincoder                └── VS Code Marketplace
两端共享（同一磁盘位置，互相读写）
├── ~/.thincoder/config.json 配置（providers + activeProvider）
└── ~/.thincoder/sessions/ 会话（完整 sha1(cwd) + 槽位）
```

同级独立产品。用户只装哪一个都行；同时装则共享配置与会话，切换无感。

## 5. 产品定性（单产品面——CLI 侧同名档并入 · 2026-09-15）

> 来源 = `thincoder-cli/docs/requirements/PROJECT.md`（原地留参照）。三观（`docs/core/requirements/PHILOSOPHY.md`）回答「agent 是谁、信什么」；
> 本节回答**产品层**问题：ThinCoder 作为一件产品是什么、给谁用、靠什么立足、明确不做什么。
> **本节是全部需求的上游**——任何需求 / 设计 / 代码与本节冲突时，改它们或走需求变更改本节。

### 5.1 品类与用户

- **品类**：**通用 AI 编码智能体**——能读写代码、与人协作完成软件开发任务。CLI/TUI、VS Code 扩展、ACP 接入是接入面，不是定性。
- **用户**：**把代码交给 agent 负责、自己保留决策权的开发者与团队**——人定方向、agent 写代码。
  不假设用户在中国、不假设用户用 Node、不假设用户项目的目录形状（见 `docs/core/requirements/PORTABILITY.md` §2——FR10 正文随 v1 需求档归档待搬迁归位）。

### 5.2 核心承诺（立身之本）

| # | 承诺 | 含义 |
|---|---|---|
| C1 | **能干活** | 读→想→写→测的完整闭环：工具面、代码库检索、子代理并行、MCP |
| C2 | **靠得住** | 设计先行、评审把关、验证收尾（工程模式）——不是「生成即交付」 |
| C3 | **透明** | 交付与需求的差距**逐条交代**——人看不见代码，只能听见你说的话 |
| C4 | **不膨胀** | 零 npm 依赖、无构建步骤、只跟顶流模型——**锐利而非功能简陋** |
| C5 | **记得住**（路线） | 跨会话 / 跨人记忆——一人学到、全队皆知（终极差异化，v2） |

### 5.3 明确不做什么（产品边界）

- **不做通用编辑器 / IDE**——不重造编辑器；IDE 内以扩展 / ACP 接入（接入面属形态，不属定性）；
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
| 是什么 | 你说要什么，我就直接干——改 bug、加功能、写脚本、查问题，边做边交代。质量靠纪律和自查 | 动手前先把「打算怎么做」写成文档——独立评审挑毛病、你点头，才允许改代码；交付前再评审一遍、跑完验证才算完。慢，但每一步都有据可查 |
| 质量靠什么 | 纪律提示词 + 自查（无机械拦截） | 机械拦截 + 独立评审 + 凭证链（先批准、后动手） |
| 什么时候用 | 默认；日常绝大多数任务 | 改动有规模、要留痕、值得先想清楚再动手的任务（多文件 / 跳模块 / 需评审） |
| 什么时候不用 | —— | 小探索、即改即验的小修——**流程开销大过收益**，用普通模式 |

**详细需求**：工程模式 → `docs/core/requirements/ENGINEERING-MODE-V2.md`；普通模式 → `docs/core/requirements/NORMAL-MODE.md` §5–§6。

### 5.6 总体需求与功能范围

**终极差异化目标 =「团队记忆」**——一人学到、全队皆知（继 teamcode 合作尝试之后的第二次尝试）。
v1 不需要团队记忆、先把 agent 主干做薄做扎实；存储 / 记忆接口为团队记忆**预留扩展位**。

- **v1 功能范围（已全部超额交付）**：Agent 主循环、基础工具集、上下文压缩、TUI、三层记忆体系（超原计划）、
  Agent 自律工具链（task / plan / goal / verify / recent_changes / question / checkpoint）、子 agent 并行 / MCP / checkpoint 断点恢复（提前交付）；
  明确不做（留 v2+）：工作流引擎、桌面 GUI。
- **v2 团队记忆（远期——核心原则：存储 / 同步与检索性能分层解耦）**：真相源 = Git 仓库（markdown 条目）；本地索引 = SQLite（`node:sqlite`，可重建易失品）；
  全文检索 = SQLite FTS5（BM25）；语义检索 = embedding 向量存 sqlite BLOB + JS 余弦；混合排序 = FTS5 + 向量 RRF；远期升级位 = pgvector / 中心化服务端（接口预留）。
  架构方向细化 = `thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md`（旧树历史档，就地留参照——v2 未启动，以其为输入）。
  **已细化的需求决策**：共享内容范围全都要（项目知识 / 架构决策 / 调试经验 / 代码规范）；沉淀双轨制（手动立规矩 + 自动萃取调试经验）；
  embedding = SiliconFlow BAAI/bge-m3（Ollama 本地为离线备选）；git 同步层 A+B 分层且 B 可选（Team 层可选独立仓库 `~/.thincoder/teams/` + Project 层 `.thincoder/memory/`）；
  条目格式 = Markdown + frontmatter；冲突策略 = 结构规避 + 诚实报错；索引重建 = 增量为主、重建兜底；自动提取 = 手动触发、自动候选、人工把关（`thincoder distill` / TUI `/distill`）。

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

**质量约束（硬约束——来自 teamcode 反面教材）**：交付必须实测可跑（生成后不实际运行验证 = 类型错误 / 依赖错位 / API 混用）；
文档不得超出实现（PPT 项目教训）；依赖面零引入；死代码随批清理。

## 6. 不并项与历史沿革

### 6.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/PROJECT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「归位注记」（自旧树设计层的 REQUIREMENTS 档归位——原档已不存在；原 v1 功能范围节拆出至 `FEATURES（VSC 侧）`） | 旧树内归位史 | 旧树批次语境——本档即基准层权威登记 |
| 旧档「待决策」节头注（「原列各议题均已标记决策态」） | 决策过程注记 | 决策态已全部落定——结论入 §2–§3，过程注记不并 |
| 旧档「独立产品，不依赖 thincoder CLI。零外部依赖（npm + 文件系统）」散行 | 定性重述 | 已并入本档 §2（同一事实只详述一处——D2） |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/PROJECT.md`（2026-09-15 CLI 尾部真批对账并入——§5）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（板块行 + 状态行「v1 已交付（2026-08）；v2 规划中」+ 归位注「2026-09-10 自旧树设计档迁入——三层重排」） | 时点状态 / 旧树归位史 | 批次语境——现行态已入 §1–§3 / §5；「v1 已交付」事实面已入 §5.6 |
| 旧档 §0 引言行 / 旧节号的「详见」指针（旧树相对路径） | 旧树指针形态 | 已改指基准层档（§5 段头与 §5.5） |
| 旧档 §3.1「模型兼容」行的渠道枚举（「支持 DeepSeek/Kimi/GLM/Qwen/MiniMax 等最新一代」） | 时点渠道枚举 | 易漂移枚举不并——定性句「只跟顶流、只跟最新」已入 §5.7；现行渠道清单 = 产品代码面（预设表） |

### 6.2 不并项登记（拆分去向——逐项登记）

**切分规则（本批裁定——承批次任务书）**：跨产品契约（与 CLI 共享磁盘文件 / 协议 / 行为对齐）⇒ 本档（core）；仅本端实现 / 界面 / 宿主面 ⇒ `docs/vsc/requirements/PROJECT.md`。

| 旧档面 | 内容 | 去向 |
|---|---|---|
| 「已确定的决策」表的 界面 / 入口 / LLM 调用 / 工具审批 / 模型能力 / Session 标题 六行 | VSC 端实现与界面定性 | `docs/vsc/requirements/PROJECT.md` |
| 模型选择契约的 webview 实现形态（hover flyout 子菜单）· 协议 transport 实现登记 | VSC 端实现形态 | 同上（契约本体 = 本档 C5 / C4） |
| 「待决策」节：安全边界 / Multi-root 策略 / Webview 技术选型 / 国际化 | VSC 端产品决策 | 同上 |
| 「会话流时序对齐 CLI」节（2026-09-09 需求点——待设计） | webview 面需求（owning board = panel/webview） | 同上（待设计登记） |
| CLI 侧同名档（`thincoder-cli/docs/requirements/PROJECT.md`） | CLI 产品定性正文（更完整） | **已并入（2026-09-15 CLI 尾部真批——按其档头自注对账合并）**——产品级定性面入 §5；(d) 类入 §6.1；VSC 专有面本就不在该档（CLI 档无 VSC 面） |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有（对账合并——用户裁定②）· eng-designer**）：`thincoder-cli/docs/requirements/PROJECT.md` 逐节对账并入——
  产品级定性面入新增 §5（品类 / 用户 / 核心承诺 C1–C5 / 产品边界 / 定位坐标 / 两种工作模式 / 总体需求与 v1 范围 / v2 团队记忆分层与已细化决策 /
  技术约束九项 / 质量约束四条）；既有「不并项」「体量」两节顺延为 §6 / §7；v2 架构指针改现状全路径（`thincoder-cli/docs/design/_archive/ARCHITECTURE-v2.md`——历史档留参照）；
  (d) 类（状态行 / 旧树归位注）入 §6.1。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 5**）：建档——`thincoder-vscode/docs/requirements/PROJECT.md` **拆分重建**：
  产品级定性面 ⇒ 本档；VSC 专有面 ⇒ `docs/vsc/requirements/PROJECT.md`（切分规则见 §5.2——承 §7.2 D4 归属疑变的父侧裁定）。
