# ThinCoder 文档总地图（docs/）

> 本文件是 `docs/` 的**唯一**地图与文档规范载体——写/改任何文档前**先查这里**。
> 2026-09-10 建档（需求/设计分目录重组——用户裁定）：原 `design/` 目录地图（README）职能上移至此。

## 1. 目录结构

```
docs/
  README.md              ← 本文件：总地图 + 文档规范（唯一地图）
  batches/<批>-<主题>.md   ← 批次记录（**一批一份，六段 append-only、一段一作者**：讨论/批次任务/设计评审/批准/实施/验证收口）
  requirements/<板块>.md ← 需求层（**eng-designer 产物**——三层归属与迁移规则见 §3）
  design/<板块>.md       ← 设计层 + 测试层（eng-designer 产物；测试与设计同档共评审）
  design/_archive/       ← 变更史档（批次档/已取代档——正文冻结，不再作为现状依据）
  design/prompts/        ← 提示词中文模板（权威源——双源流程见 requirements/PROMPT-SYSTEM.md §2）
  TODO.md                ← 项目级统一待办（含需求池）
  guides/                ← 使用指南
```

## 2. docs/ 里都有什么

| 文件/目录 | 里面是什么 | 什么说了算 |
|---|---|---|
| `requirements/PHILOSOPHY.md` | **三观**：ThinCoder 相信什么 | **最高需求**：提示词/设计/代码与之不符 → 改它们（或走需求变更改本档） |
| `batches/<批>-<主题>.md` | **批次记录**（**六段、一段一作者**）：§1 讨论 · §2 批次任务 · §3 设计评审 · §4 用户批准 · §5 实施记录 · §6 验证与收口 | **不是规格**——需求在 `requirements/` 成文；本档是决策与派工留痕，整批做完冻结 |
| `requirements/` | **需求**：产品应该是什么样（含 `FEATURES.md` 功能清单） | 用户确认即定稿（不过 advisor 评审） |
| `design/` | **设计 + 测试**：打算怎么做、怎么证明做对了 | 设计评审通过 + 用户批准后定稿 |
| `design/_archive/` | **变更史**：当时做了什么（批次档/被取代档） | 冻结——不作现状依据 |
| `TODO.md` | **待办 + 需求池**：技术待办 + 需求落地台账 | 台账——不进规格判定 |
| `guides/` | 使用指南 | — |

**判定"现状"只看 `requirements/` + `design/` 的现行档**：需求说"应该是什么样"，设计说"怎么做"；
`_archive/` 是历史（不作现状依据）。

> 三观（`PHILOSOPHY.md`）不在三层之内——它是三层**共同的依据**；功能全览也不是三层之一——
> 它从属于**代码**（是结果的镜像）。

## 3. 文档规范（三层结构与归属）

### 3.1 三层拆分的归属

| 层 | 内容 | 住哪 | 作者 |
|---|---|---|---|
| 需求层 | 总体需求 / 功能性需求（用户故事或规格句）/ 非功能性需求 | `requirements/<板块>.md` | eng-designer |
| 设计层 | 方案选型与理由 / 架构·接口契约 / 受影响文件清单 / 关键决策记录 | `design/<板块>.md` | eng-designer |
| 测试层 | 用例表（正常/边界/错误）+ 输入·预期输出 + 与需求条对应关系 | `design/<板块>.md`（与设计同档） | eng-designer |

**为何测试跟设计走**：用例表直接对应架构决策——设计改则测试必改，同档同评审，"改设计忘了改测试"不易发生；
需求与设计之间隔着"设计 = 对需求的检验"这道关卡（见 `requirements/ENGINEERING-MODE.md` FR9），故需求层独立成档。

**需求与设计的关系**：设计者把需求翻译成可执行方案的过程，就是需求的第一次严格检验——需求含糊、自相矛盾或
不可实现，在设计阶段必然暴露。因此需求文档**不过独立评审**（用户确认即可），设计评审是必经节点。

### 3.2 板块镜像

一个板块一对文件，**同板块名**：`requirements/<板块>.md` ↔ `design/<板块>.md`。

### 3.3 组织原则（归属规则）

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查 §3——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并**同时**在本文件 §3 登记。
4. **单一权威源**：同一机制只在一处详述（权威源）；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理**：方向性/时点/被取代文档移 `design/_archive/`；已实现专题独立保留（同板块权威档）。
6. **架构级/机制级文档**可简化功能性需求表述（以机制约束 FR 替代逐条用户故事）；非功能性需求与测试层仍须完整。

### 3.4 批次档与变更史（冻结规则）

**批次记录档（`batches/`）的生命周期**：§1 讨论起草于批次开始 → 需求谈清由 eng-designer 抽入
`requirements/` → §2 批次任务 → §3 设计评审 → §4 用户批准 → §5 实施记录 → §6 验证与收口 → **整档冻结**。
批次记录**不代替需求文档**——需求永远在 `requirements/` 里成文。

- **批次档**（一次实施批的过程记录，如 `*-BATCH*` / `*-IMPL-*` / `*-TUNING`）与**变更史档**（已被取代的旧权威档）
  → `design/_archive/`，正文**冻结**（头注"变更史——正文冻结"）
- **只有板块权威档承载"现状"**——读者看现状只读 `docs/requirements/` + `docs/design/` 的现行档
- 存量迁移：**只迁板块权威档**的需求层；批次档/变更史档按需入档 `_archive/`

### 3.5 代码变更落文档（无豁免）

任何代码变更（含功能点级小改、脚本扩展、配置调整）都必须在文档落档：小改动并入所属板块的现有文档
（追加变更段或更新章节），新板块建新档并登记本文件 §3。未落文档的代码变更 = 文档漂移。

### 3.6 文档随对话演进

对话中的决策、约束、偏好当回合写入相关文档（设计档 / AGENTS.md / 本文件）——**未落档的决策等于没发生**。
 代码实现后逐项勾销验收标准（**结论落批次档 §6**——不进设计档，用户 2026-09-10 裁定）。

### 3.7 文档人类可读（格式纪律）

写/改本文件 §3 映射内的任一 `docs/` 文档须人类可读：

- **无 >300 字符单行**（整节/表/规则不得压成一行）——**表格行豁免**：markdown 表格行结构性不可折行，超宽表格行不计入宽度检查（建议就近折行或表下补充——非阻断）
- **markdown 结构正确**（标题/表格/代码块不被吞进正文，空行隔离节）
- **变更记录折叠**（新变更落一行注记，不堆逐批需求/评审/测试流水账）
- **跨仓引用形态**：引用他仓文档不得写 `X.md` §N 形态（V1 按本仓 basename 解析——**basename 不在本仓扫描域时**恒判 `unknown-doc`；同名 basename 按本仓档解析、可能 `no-section` 误报甚至以错档通过）——写「名称（仓别）§N」（如 `WEBVIEW（VSC 仓）§5`）：去 `.md` 后缀、去路径前缀（跨仓引用 = V1 域外）

违反即文档格式债——与源码 500 行硬限同理。批量检查：`node scripts/check-doc-width.mjs`
（扫描域 = `docs/design/` + `docs/requirements/` + `docs/batches`——排除 `_archive/`（历史快照豁免）；`docs/README.md`、`docs/TODO.md`、`docs/PHILOSOPHY.md` 覆盖为待办，见 `TODO.md`）。

### 3.8 批次记录档（`batches/`——本仓路径）

**本仓路径**：`docs/batches/<批>-<主题>.md`（批 = 日期，如 `2026-09-10-ENGINEERING-MODE.md`）。
**主题 = 批次概括词**（通常即主板块名；**允许跨板块**——跨板块批仍一份档，档内分区；勿理解成“一个板块一份”）。

**机制（一批一份 / 六段 append-only、一段一作者 / 模板骨架 / 生命周期 / 为何不用滚动档）属产品需求——权威源
`requirements/ENGINEERING-MODE.md` §1.12**：本节不复制（单一权威源）；写/改批次档前先读那一节。

**本仓特有**：跨批检索由 `TODO.md` 需求池台账做索引（每条需求 → 哪批谈的 + 当前状态），而非翻遍批次档。

### 3.9 需求池（本仓路径）

**本仓路径**：`docs/TODO.md`「需求池」「技术待办」组。

**机制（职能 / 条目形态 / 挂任务书 / 状态机 / 两池不混）属产品需求——权威源
`requirements/ENGINEERING-MODE.md` §1.13**：本节不复制；登记条目或改状态前先读那一节。

**本仓特有**：条目格式 = 一行指针（需求句 → 需求档节 · 任务书 §2 · status）。

## 4. 板块 → 文档映射

> 路径相对本文件（`docs/`）。`~~删除线~~` = 已退役/已取代；`_archive/` = 变更史（正文冻结，不作现状依据）。
> 需求层已启用：`requirements/PROJECT.md` + 四对专题需求档已入位；其余板块的需求内容仍在各设计档内
> （三层同档历史形态），拆分按**新老划断**（碰到哪迁哪，见 §3.4）——批量拆分清单见勘察报告（`docs/TODO.md` 登记）。

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `design/ARCHITECTURE.md` | 权威源。`_archive/ARCHITECTURE-v2.md`（v2 草案，未启动） |
| 项目需求（定位/决策/远期） | `requirements/NORMAL-MODE.md` | 普通模式（默认模式：直接干活/无机械门禁） |
| `requirements/PROJECT.md` | 自原 `design/REQUIREMENTS.md` 迁入（2026-09-10 文档重组）——三层重排：总体需求/功能性需求/非功能性需求 |
| 功能全览 | `requirements/FEATURES.md` | 功能清单（功能性需求现状） |
| 三观（提示词根基） | `requirements/PHILOSOPHY.md` | 最高需求——所有提示词/设计具体规则由此处推导 |
| 会话 | `design/SESSION.md` | CLI 会话/存储权威 |
| 上下文压缩 | `design/CONTEXT-COMPACTION.md` | |
| 发布流程 | `design/RELEASE.md` | npm 发布流程 + 踩坑记录 |
| Design Token 硬化 | `requirements/ENG-TOKEN-BINDING.md`（需求）+ `design/ENG-TOKEN-BINDING.md`（设计） | 镜像命名（2026-09-10 归位）；v2 收窄：TTL 7 天可配 |
| 轮末蒸馏异步化 | `requirements/SEND-STALL-DISTILL.md`（需求）+ `design/SEND-STALL-DISTILL.md`（设计） | 机制本体归 `design/CONTEXT-COMPACTION.md` §5 |
| 工具输出限制 | `requirements/TOOL-OUTPUT-LIMITS.md`（需求）+ `design/TOOL-OUTPUT-LIMITS.md`（设计） | 现行权威源（TOOLS.md 未复制）；落盘阈值/显示层 |
| Agent 运行参数 | `requirements/AGENT-PARAMS.md`（需求）+ `design/AGENT-PARAMS.md`（设计） | 评审超时/轮次上限 |
| Agent 循环 | `design/AGENT-LOOP.md` | 权威源。`design/TURN-CAP-CONTINUE.md`（撞墙可继续）同板块独立保留 |
| Agent 循环 · 批记录 | `_archive/ASYNC-RESIDUE-FIX.md`、`_archive/SCHEDULER-DYNAMIC-DOMAIN.md` | 2026-09-10 入档——机制权威分别在 AGENT-LOOP §7.5/§7.7/§7.7.1、§10.1/§10.2 |
| 子代理观测/注入 | `design/SUBAGENT-OBSERVE-SEND.md` | 父侧 observe + send；VSC 同名对应——同机制各自独立 |
| async 结果容器统一 | `design/ASYNC-RESULT-CONTAINER.md` | VSC 同名对应——同机制各自独立 |
| eng 会话态/provider 清理 | `_archive/ENG-SESSION-PROVIDER-CLEANUP.md` | 2026-09-10 入档（批过程记录；机制叙述在档内） |
| 编辑工具（板块） | `design/EDIT.md`、`HASHLINE-EDIT.md`、`INSERT-AFTER.md`、`APPLY-PATCH.md`、`WRITE.md`、`EDIT-HELPERS.md` | 每工具一档（TOOLS.md §6 只留地图）；VSC 同名对应 |
| memory 工具完善 | `design/MEMORY.md` §6.2 | scope 参数改名 layer + delete layer 可选 |
| 工程模式 | `design/ENGINEERING-MODE.md` | 权威源。`_archive/ENGINEERING-WORKLOOP.md`（已固化进纪律层提示词） |
| 评审收敛 | `design/ADVISOR-CONVERGENCE.md`；`_archive/ADVISOR-VERDICT-TEMPLATE.md` | 裁决行模板 2026-09-10 入档——裁决行本体在 `src/prompts/advisor-*.md` |
| 设计评审凭证结算 | `design/DESIGN-TOKEN-SETTLEMENT.md` | VSC 同名对应——同机制各自独立 |
| 提示词系统 | `requirements/PROMPT-SYSTEM.md` | 板块总体档（分层模型/装配矩阵/编写纪律权威现状）。施工档 `_archive/PROMPT-IMPL-{1-TEXT,2-CODE,3-TEST-MIGRATE}.md`；变更史 `_archive/{PROMPT-DECOUPLING,MAIN-DESIGN-ENHANCE,PROMPT-ATTENTION-RESTRUCTURE,PROMPT-ATTENTION-RESTRUCTURE-SPLIT-PLAN}.md`（冲突以 PROMPT-SYSTEM 为准） |
| 工具系统 | `design/TOOLS.md` | 权威源。`design/MCP.md`、`design/SETTINGS-TOOL.md` 同板块独立保留；`design/VERIFY-REDESIGN.md`（verify 重构——doc-only 快路径由 TOOLS.md D-V5 接管） |
| Checkpoint 事故恢复 | `design/CHECKPOINT.md` | 快照/回滚机制 + 两端存储统一 |
| 诊断事件日志 | `design/LOGGING.md` | 常驻事件骨架日志 |
| 崩溃捕获与取证 | `requirements/CRASH-REPORTS.md`（需求）+ `design/CRASH-REPORTS.md`（设计+测试） | 2026-09-11 建档（TUI-OOM-FORENSICS 批）——R25 异常终止捕获 + TUI stderr 捕获 + 近堆上限堆快照 |
| TUI | `design/TUI.md` | 权威源。`design/TUI-INPUT-BOX.md`、`design/TUI-TOOL-OUTPUT.md` 同板块独立保留 |
| TUI · 批记录 | `_archive/SYNC-CANCEL.md`、`_archive/INPUT-LOCK-ASYNC.md`、`_archive/INPUT-LOCK-BEHAVIOR-REVISED.md` | 2026-09-10 入档——机制正文落 AGENT-LOOP §7.2 / §9 + §11.3 与 TUI.md §4/§8 |
| 记忆 | `design/MEMORY.md` | 三层记忆（用户/项目/团队） |
| Provider | `design/PROVIDER.md` | LLM 调用层当前设计 |
| Proxy | `design/PROXY.md` | |
| ACP 协议 | `design/ACP-CLIENT.md` | |
| 会诊 | `design/CONSULTATION.md` | 机制外指 AGENT-LOOP §14 |
| 飞刀 | `design/ESCALATE.md` | 机制外指 AGENT-LOOP §14.2 + §7.2 |
| 测试基建 | `design/TESTING.md` | 测试分层纪律/库存治理（L0/L1/L2）+ 测试生命周期与集成集（§3 起） |
| 多实例协作感知 | `design/MULTI-INSTANCE-COLLAB.md` | 多副本 agent 协作感知 |
| 结构债 | `design/STRUCTURE-DEBT.md` | 评估与清理路线图（横切）+ §7 分批路线 |
| 结构债批执行 | `design/STRUCTURE-DEBT.md` §7 + 批专属档 `_archive/STRUCTURE-DEBT-BATCH-5-6.md`、`_archive/STRUCTURE-DEBT-BATCH-7.md` | 每批独立成档；不逐档裸列（清单指 §7——免重复漂移） |
| 文档格式债批（历史） | `_archive/DOC-REWRITE.md`、`_archive/DOC-REWRITE-LARGE.md`、`_archive/DOC-REWRITE-VSC.md`、`_archive/DOC-CLEANUP-BATCH.md`、`_archive/DOC-SWEEP-2026-09-09.md`、`_archive/DOC-REORG-VSC.md` | 格式债清理批 A/批 2 执行设计 |
| 结构债批（其余） | `_archive/CODE-HARDENING-BATCH.md`、`_archive/SYSTEM-SPLIT-BATCH.md`、`_archive/BATCH-3-STRUCTURE.md`、`_archive/BATCH-4-DOC-CLEANUP.md` | 已交付核销 |
| 其他已交付批记录 | `_archive/`：QUICKFIX-BATCH-2 / ISSUE-FIX-BATCH / MODEL-MERGE-SESSION / MODEL-400-FIX /<br>DUAL-END-TRUNCATION / RESIZE-MOUSE-LEAK-FIX / TUI-STDERR-CAPTURE / TRACE-STORE-VSC（.md） | 2026-09-10 入档（机制权威已他移或被后续档取代） |
| 方法论（已退役） | ~~`_archive/METHODOLOGY.md`~~ | 已退役（2026-09-10——PROMPT-SYSTEM §2.5 项目层收敛）：骨干分拣入纪律层槽位文件（`src/prompts/discipline-engineering.md` / `discipline-normal.md` / `common.md`）——项目约定直接写 AGENTS.md |
| CLI Lint 引入（历史） | `_archive/CLI-LINT-REQUIREMENTS.md`、`_archive/CLI-LINT-TUNING.md` | 被 TOOLS.md §10.2 取代（eslint 删除） |
| 覆盖率缺口修复（历史） | `_archive/COVERAGE-GAPS-REQUIREMENTS.md`、`_archive/COVERAGE-GAPS-TUNING.md` | 测试清零政策取代 |
| 工具移除（历史） | `_archive/SLEEP-REMOVAL-REQUIREMENTS.md`、`_archive/SLEEP-REMOVAL-TUNING.md` | sleep 删除被 wait_for（TOOLS.md §16）取代 |
| 提示词架构（历史） | ~~`_archive/PROMPT-DECOUPLING.md`~~ | 已被 PROMPT-SYSTEM 蓝图 + 施工①②③取代 |
| 路线图/评估/竞评（历史） | `_archive/ROADMAP-0.9.0.md`、`_archive/EVALUATION.md`、`_archive/COMPETITIVE-CLI-2026.md`、`_archive/KIMI-CODE-PROMPT-ANALYSIS.md`、`_archive/TTSR-ANALYSIS.md`、`_archive/EDIT-TOOL-*.md` | 时点数据/已被取代——勿引用为现状 |
| 文档基建（本批） | `_archive/DOC-REORG.md` | 2026-09-10 文档目录结构重组施工设计——**已交付入档**（批尾 T1-T5 同日完成） |
| 在途设计档（未实施） | `design/POOL-CONFIG-UNIFIED.md`、`design/QUICKFIX-BATCH-3.md`、`design/SUBAGENT-ID-COUNTER-AGENT.md` | 设计待评审——未实施，不适用冻结 |

### 4.1 需求层文档（`requirements/`）

> 需求层文档清单（板块镜像——`requirements/<板块>.md` ↔ `design/<板块>.md`）。
> 未列出的板块，其需求层内容仍在对应设计档内（三层同档历史形态——按新老划断迁移，见 §3.4）。

| 需求档 | 板块 |
|---|---|
| `requirements/ACP-CLIENT.md` | ACP 协议（IDE 接入） |
| `requirements/ADVISOR-CONVERGENCE.md` | 评审收敛（advisor 审 → 修 → 复审循环的收敛保证） |
| `requirements/AGENT-LOOP.md` | Agent 循环（主循环/子代理生命周期/异步化） |
| `requirements/AGENT-PARAMS.md` | — |
| `requirements/ASYNC-RESULT-CONTAINER.md` | async 结果容器统一（settle 共享 helper / pending 单容器 / role·池 accesso |
| `requirements/CHECKPOINT.md` | Checkpoint 事故恢复（快照/回滚保险） |
| `requirements/CONSULTATION.md` | 会诊（多模型并行分析同一问题） |
| `requirements/CONTEXT-COMPACTION.md` | 上下文压缩 |
| `requirements/CRASH-REPORTS.md` | 崩溃捕获与取证（崩溃留痕 / Node 报告 / TUI stderr 捕获 / 近堆上限堆快照） |
| `requirements/DESIGN-TOKEN-SETTLEMENT.md` | 设计评审凭证结算（settle 当场落盘 / 门禁读权威 / 废旧镜像） |
| `requirements/ENG-TOKEN-BINDING.md` | — |
| `requirements/ENGINEERING-MODE.md` | 工程模式——thincoder 的严格方法论工作流：design-before-code、纪律层槽位提示词驱动、双门禁（ |
| `requirements/ESCALATE.md` | 飞刀（升级到更强模型实现） |
| `requirements/LOGGING.md` | 诊断事件日志（常驻事件骨架日志） |
| `requirements/MCP.md` | 工具系统 · MCP 客户端 |
| `requirements/MEMORY.md` | 记忆系统（三层记忆 + 代码/文档索引） |
| `requirements/MULTI-INSTANCE-COLLAB.md` | 多实例协作感知（多副本 agent 互相感知） |
| `requirements/PROJECT.md` | 项目层（定位/技术约束/功能范围/远期需求） |
| `requirements/PROMPT-SYSTEM.md` | 提示词系统（提示词分层/装配逻辑/文件命名法/各文件内容大纲/编写纪律） |
| `requirements/RELEASE.md` | 发布流程（npm / VS Code marketplace 发布） |
| `requirements/SEND-STALL-DISTILL.md` | 轮末探索蒸馏的**时序**——"何时等待/是否等待"（已实现专题，**当前生效**） |
| `requirements/SESSION.md` | 会话（CLI 会话存储/加载/恢复） |
| `requirements/SETTINGS-TOOL.md` | settings 工具（运行时配置查看/修改/热应用） |
| `requirements/STRUCTURE-DEBT.md` | 结构债（横切——跨双仓的结构债评估与分批清理） |
| `requirements/SUBAGENT-OBSERVE-SEND.md` | 子代理观测/注入（父侧 observe 查进度 + send 注入引导） |
| `requirements/TESTING.md` | 测试基建（分层纪律/库存治理/slow 门） |
| `requirements/TOOL-OUTPUT-LIMITS.md` | 工具输出的超长**落盘阈值与显示层**（已实现专题，**当前生效**——本对文档是该机制的现行权威源；`TOOLS.md |
| `requirements/TOOLS.md` | 工具系统（注册表/调度/安全边界/描述规范） |
| `requirements/TUI-TOOL-OUTPUT.md` | TUI 工具输出（行间区块显示） |
| `requirements/TUI.md` | TUI（终端界面：渲染/滚动/输入/会话显示） |
| `requirements/TURN-CAP-CONTINUE.md` | Agent 循环 · 撞墙继续（轮数预算耗尽后的续跑） |
| `requirements/VERIFY-REDESIGN.md` | verify 重构（声明式完成前门） |

## 5. 归属判定（写档前四问）

1. 这个主题**已有档案**吗？（查 §3——有则更新它，不新建）
2. 属于哪个**板块**？（板块 = 业务/机制单元，不是功能点）
3. 该写哪一**层**？（需求 → `requirements/`；设计+测试 → `design/`）
4. 与既有档**冲突**吗？（冲突先摆出来讨论，不静默并存两份矛盾表述）

## 变更记录

- 2026-09-11：新增「崩溃捕获与取证」板块——`requirements/CRASH-REPORTS.md` + `design/CRASH-REPORTS.md`（TUI-OOM-FORENSICS 批建档；R25 / TUI-STDERR-CAPTURE 归宿落定）——登记 §4 / §4.1。
- 2026-09-10：**文档目录结构重组**（DOC-REORG 批）——35 档批次/变更史档入 `design/_archive/`（正文冻结）；
  建 `requirements/`（含说明档）；地图自 `design/README.md` 迁入本文件（§1 目录/§2 档位分类/§3 规范/§4 登记表/§5 四问）。
- 2026-09-10：建档——`docs/` 唯一地图与文档规范载体（需求/设计分目录重组需求落档）。
- 2026-09-09：ASYNC-RESIDUE-FIX / SCHEDULER-DYNAMIC-DOMAIN / INPUT-LOCK-ASYNC 登记（2026-09-10 入档——行注改指机制权威）。
- 2026-09-08：新增「结构债批执行」板块行——批专属档自登记（清单指 STRUCTURE-DEBT.md §7，不逐档裸列）。
- 2026-09-07：新增「结构债」；verify 重构；归档 8 文件移 `_archive/`；归属规则加**规则 6（文档人类可读防复发）**
  ——无 >300 字符单行 / markdown 结构正确 / 变更记录折叠；配 `scripts/check-doc-width.mjs`。
- 2026-09-06：provider 数量修正（17→20）；新增「测试基建」「多实例协作感知」；SESSION.md §12；token 生命周期语义修订。
- 2026-09-05：新增专题「settings 工具」。
- 2026-09-03：新增「诊断事件日志」。
- 2026-09-02：CLI Lint 板块标记被 TOOLS.md §10.2 取代。
- 2026-09-01：新增「Checkpoint 事故恢复」。
- 2026-08-25：新增「轮末蒸馏异步化」「工具移除」「覆盖率缺口修复」「CLI Lint 引入」「发布流程」；ROADMAP-0.9.0 归档标注。
- 2026-08-24：新增「Agent 运行参数」「工具输出限制」。
- 2026-08-21：初版（文档归属纪律）。
