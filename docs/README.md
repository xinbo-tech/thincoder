# ThinCoder 文档总地图（docs/）

> 本文件是 `docs/` 的**唯一**地图与文档规范载体——写/改任何文档前**先查这里**。
> 2026-09-10 建档（需求/设计分目录重组——用户裁定）：原 `design/` 目录地图（README）职能上移至此。

## 1. 目录结构

```
docs/
  README.md              ← 本文件：总地图 + 文档规范（唯一地图）
  requirements/<板块>.md ← 需求层（主 agent·产品经理产物；说明见 requirements/README.md）
  design/<板块>.md       ← 设计层 + 测试层（eng-designer 产物；测试与设计同档共评审）
  design/_archive/       ← 变更史档（批次档/已取代档——正文冻结，不再作为现状依据）
  design/prompts/        ← 提示词中文模板（权威源——双源流程见 design/PROMPT-SYSTEM.md §2）
  TODO.md                ← 项目级统一待办（含需求池）
  guides/                ← 使用指南
```

## 2. 文档规范（三层结构与归属）

### 2.1 三层拆分的归属

| 层 | 内容 | 住哪 | 作者 |
|---|---|---|---|
| 需求层 | 总体需求 / 功能性需求（用户故事或规格句）/ 非功能性需求 | `requirements/<板块>.md` | 主 agent（产品经理） |
| 设计层 | 方案选型与理由 / 架构·接口契约 / 受影响文件清单 / 关键决策记录 | `design/<板块>.md` | eng-designer |
| 测试层 | 用例表（正常/边界/错误）+ 输入·预期输出 + 与需求条对应关系 | `design/<板块>.md`（与设计同档） | eng-designer |

**为何测试跟设计走**：用例表直接对应架构决策——设计改则测试必改，同档同评审，"改设计忘了改测试"不易发生；
需求与设计之间隔着"设计 = 对需求的检验"这道关卡（见 `design/ENGINEERING-MODE.md` FR9），故需求层独立成档。

### 2.2 板块镜像

一个板块一对文件，**同板块名**：`requirements/<板块>.md` ↔ `design/<板块>.md`。

### 2.3 组织原则（归属规则）

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查 §3——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并**同时**在本文件 §3 登记。
4. **单一权威源**：同一机制只在一处详述（权威源）；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理**：方向性/时点/被取代文档移 `design/_archive/`；已实现专题独立保留（同板块权威档）。
6. **架构级/机制级文档**可简化功能性需求表述（以机制约束 FR 替代逐条用户故事）；非功能性需求与测试层仍须完整。

### 2.4 批次档与变更史（冻结规则）

- **批次档**（一次实施批的过程记录，如 `*-BATCH*` / `*-IMPL-*` / `*-TUNING`）与**变更史档**（已被取代的旧权威档）
  → `design/_archive/`，正文**冻结**（头注"变更史——正文冻结"）
- **只有板块权威档承载"现状"**——读者看现状只读 `docs/requirements/` + `docs/design/` 的现行档
- 存量迁移：**只迁板块权威档**的需求层；批次档/变更史档按需入档 `_archive/`

### 2.5 代码变更落文档（无豁免）

任何代码变更（含功能点级小改、脚本扩展、配置调整）都必须在文档落档：小改动并入所属板块的现有文档
（追加变更段或更新章节），新板块建新档并登记本文件 §3。未落文档的代码变更 = 文档漂移。

### 2.6 文档随对话演进

对话中的决策、约束、偏好当回合写入相关文档（设计档 / AGENTS.md / 本文件）——**未落档的决策等于没发生**。
代码实现后逐项勾销验收标准。

### 2.7 文档人类可读（格式纪律）

写/改本文件 §3 映射内的任一 `docs/` 文档须人类可读：

- **无 >300 字符单行**（整节/表/规则不得压成一行）
- **markdown 结构正确**（标题/表格/代码块不被吞进正文，空行隔离节）
- **变更记录折叠**（新变更落一行注记，不堆逐批需求/评审/测试流水账）

违反即文档格式债——与源码 500 行硬限同理。批量检查：`node scripts/check-doc-width.mjs`
（当前扫描域 = `docs/design/` 含 `_archive/`；`requirements/` 覆盖为待办，见 `TODO.md`）。

## 3. 板块 → 文档映射

> 路径相对本文件（`docs/`）。`~~删除线~~` = 已退役/已取代；`_archive/` = 变更史（正文冻结，不作现状依据）。
> 需求层当前为空（`requirements/` 仅说明档）——存量需求内容仍在各设计档内，拆分按**新老划断**（碰到哪迁哪，见 §2.4）。

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `design/ARCHITECTURE.md` | 权威源。`_archive/ARCHITECTURE-v2.md`（v2 草案，未启动） |
| 需求与决策 | `design/REQUIREMENTS.md` | 需求讨论与决策记录（存量三层同档形态） |
| 功能全览 | `design/FEATURES.md` | 基于代码现状梳理 |
| 三观（提示词根基） | `design/PHILOSOPHY.md` | 所有提示词具体规则由此处推导 |
| 会话 | `design/SESSION.md` | CLI 会话/存储权威 |
| 上下文压缩 | `design/CONTEXT-COMPACTION.md` | |
| 发布流程 | `design/RELEASE.md` | npm 发布流程 + 踩坑记录 |
| Design Token 硬化 | `design/ENG-TOKEN-BINDING-REQUIREMENTS.md`、`design/ENG-TOKEN-BINDING-TUNING.md` | v2 收窄：安全修复 + TTL 7 天可配 |
| 轮末蒸馏异步化 | `design/SEND-STALL-DISTILL-REQUIREMENTS.md`、`design/SEND-STALL-DISTILL-TUNING.md` | 机制本体归 `design/CONTEXT-COMPACTION.md` §5 |
| 工具输出限制 | `design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md`、`design/TOOL-OUTPUT-LIMITS-TUNING.md` | 现行权威源（TOOLS.md 未复制）；落盘阈值/显示层 |
| Agent 运行参数 | `design/AGENT-PARAMS-REQUIREMENTS.md`、`design/AGENT-PARAMS-TUNING.md` | 评审超时/轮次上限 |
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
| 提示词系统 | `design/PROMPT-SYSTEM.md` | 板块总体档（分层模型/装配矩阵/编写纪律权威现状）。施工档 `_archive/PROMPT-IMPL-{1-TEXT,2-CODE,3-TEST-MIGRATE}.md`；变更史 `_archive/{PROMPT-DECOUPLING,MAIN-DESIGN-ENHANCE,PROMPT-ATTENTION-RESTRUCTURE,PROMPT-ATTENTION-RESTRUCTURE-SPLIT-PLAN}.md`（冲突以 PROMPT-SYSTEM 为准） |
| 工具系统 | `design/TOOLS.md` | 权威源。`design/MCP.md`、`design/SETTINGS-TOOL.md` 同板块独立保留；`design/VERIFY-REDESIGN.md`（verify 重构——doc-only 快路径由 TOOLS.md D-V5 接管） |
| Checkpoint 事故恢复 | `design/CHECKPOINT.md` | 快照/回滚机制 + 两端存储统一 |
| 诊断事件日志 | `design/LOGGING.md` | 常驻事件骨架日志 |
| TUI | `design/TUI.md` | 权威源。`design/TUI-INPUT-BOX.md`、`design/TUI-TOOL-OUTPUT.md` 同板块独立保留 |
| TUI · 批记录 | `_archive/SYNC-CANCEL.md`、`_archive/INPUT-LOCK-ASYNC.md`、`_archive/INPUT-LOCK-BEHAVIOR-REVISED.md` | 2026-09-10 入档——机制正文落 AGENT-LOOP §7.2 / §9 + §11.3 与 TUI.md §4/§8 |
| 记忆 | `design/MEMORY.md` | 三层记忆（用户/项目/团队） |
| Provider | `design/PROVIDER.md` | LLM 调用层当前设计 |
| Proxy | `design/PROXY.md` | |
| ACP 协议 | `design/ACP-CLIENT.md` | |
| 会诊 | `design/CONSULTATION.md` | 机制外指 AGENT-LOOP §14 |
| 飞刀 | `design/ESCALATE.md` | 机制外指 AGENT-LOOP §14.2 + §7.2 |
| 测试基建 | `design/TESTING.md` | 测试分层纪律/库存治理（L0/L1/L2） |
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
| 文档基建（本批） | `design/DOC-REORG.md` | 2026-09-10 文档目录结构重组施工设计（批尾入档） |
| 在途设计档（未实施） | `design/POOL-CONFIG-UNIFIED.md`、`design/QUICKFIX-BATCH-3.md`、`design/SUBAGENT-ID-COUNTER-AGENT.md` | 设计待评审——未实施，不适用冻结 |

## 4. 归属判定（写档前四问）

1. 这个主题**已有档案**吗？（查 §3——有则更新它，不新建）
2. 属于哪个**板块**？（板块 = 业务/机制单元，不是功能点）
3. 该写哪一**层**？（需求 → `requirements/`；设计+测试 → `design/`）
4. 与既有档**冲突**吗？（冲突先摆出来讨论，不静默并存两份矛盾表述）

## 变更记录

- 2026-09-10：**文档目录结构重组**（DOC-REORG 批）——35 档批次/变更史档入 `design/_archive/`（正文冻结）；
  建 `requirements/`（含说明档）；地图自 `design/README.md` 迁入本文件（§1 目录/§2 规范/§2.7 人类可读 §3 登记表/§4 四问）。
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
