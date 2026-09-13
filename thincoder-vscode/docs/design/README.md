# ThinCoder VS Code 设计文档地图（docs/design/）

> 本文件是 `docs/design/` 的板块登记表与归属规则——写/改设计文档前**先查这里**。
> 文档地图重写批 V1（2026-09-08）：归档 11 文件移 `_archive/` 并更新登记；整文件单行 demux 为多行 markdown。
> 核心纪律：**一个板块一个文档**；功能点并入所属板块文档（不新建）；新板块才新建并在此登记；同一机制只在一处详述（权威源），其余文档引用、不复制。与 CLI 端 `README（CLI 仓）` 同构。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| 架构 | `ARCHITECTURE.md` | 薄枢纽（DOC-REORG-VSC 收官 2026-09-08）——设计原则/架构图/模块地图指针/与 CLI 差异表；机制正文在各板块档 |
| 会话 | `SESSION.md` | 权威源（DOC-REORG-VSC 批 3——ARCHITECTURE §4 迁出写全）；与 CLI 同名对应；槽位/端 marker/GC/懒历史/富注入 |
| 上下文压缩 | `CONTEXT-COMPACTION.md` | 权威源（批 6——ARCHITECTURE §10 迁出写全）；与 CLI 同名对应 |
| Agent 循环 | `AGENT-LOOP.md` | 权威源（批 1——ARCHITECTURE §6+§8 迁出写全）。`TURN-CAP-CONTINUE.md`（插件侧实现记录——2026-08-25 两端收口各为实现记录）同板块独立保留；`INPUT-LOCK-ASYNC`（CLI docs/design——主会话输入禁排队 C'——2026-09-09 双端——机制正文本端落 AGENT-LOOP §7——登记于此防悬空——CLI 地图 TUI 行同登记）；`ASYNC-RESIDUE-FIX`（CLI docs/design——异步残留修复批） |
| 子代理观测/注入 | `SUBAGENT-OBSERVE-SEND.md` | 父侧 observe(查进度)+send(注入引导) 运行中子代理；CLI 同名对应——同机制各自独立 |
| async 结果容器统一 | `ASYNC-RESULT-CONTAINER.md` | settle 共享 helper/pending 单容器+role/池 accessor/buildChildSignal；CLI 同名对应——同机制各自独立 |
| 轨迹存档 | `_archive/TRACE-STORE-VSC.md`（本仓——原 CLI docs/design，LEDGER-SELF-CONTAINED 批迁入） | VSC chat() 出口完整轨迹 JSONL 落盘同构 CLI（D-TR1-TR10）——trace-store.mjs/src/traces——设计档 = 本仓 `_archive/TRACE-STORE-VSC.md`（迁入后登记改指本仓——零失效指针） |
| 编辑工具（板块） | `EDIT.md`、`HASHLINE-EDIT.md`、`INSERT-AFTER.md`、`APPLY-PATCH.md`、`WRITE.md` + `EDIT-HELPERS.md`（共享 helper + lfOffsetToRaw） | 每工具一档（2026-09-08 重组——TOOLS.md §9 退地图）。原 EDIT-TOOL-IMPROVEMENT.md 并档归档。CLI 同名对应——同机制各自独立 |
| memory 工具完善 | `MEMORY.md` §3（delete 工具语义修正/layer 统一段——2026-09-08 并入所属板块文档，原 MEMORY-TOOL-SCOPE-FIX.md 作废删除） | scope 参数改名 layer + delete layer 可选 + 工具描述重写；CLI 同名对应——同机制各自独立 |
| 工程模式 | `ENGINEERING-MODE.md` | 与 CLI 同名对应（批 4——ARCHITECTURE §9 迁出写全）；会话级开关/eng token/门禁/guard |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` | 与 CLI 同名对应（批 4——ARCHITECTURE §9 评审收敛迁出写全）；advisor 轮次衰减/cap/铁律 R1-R7 |
| 设计评审凭证结算 | `DESIGN-TOKEN-SETTLEMENT.md` | async 评审 token 结算根治（settle 同步落盘/修快照清零/门禁读权威/废旧镜像）；CLI 同名对应——同机制各自独立 |
| 工具系统 | `TOOLS.md` | 权威源（批 5——ARCHITECTURE §7 迁出写全）。`MCP.md`（MCP 机制——批 5 自 ARCHITECTURE §13 MCP 行展开，与 CLI 同名对应）同板块独立保留 |
| Checkpoint 事故恢复 | `CHECKPOINT.md` | 权威源（批 6——ARCHITECTURE §13 Checkpoint 行展开写全）；快照/回滚，与 CLI 同存储同格式、快照跨端互通 |
| 记忆 | `MEMORY.md` | 权威源（批 6——ARCHITECTURE §13 Memory 行展开写全）；文件式 markdown + 可选向量，无 FTS5 |
| Provider | `PROVIDER.md` | 权威源（批 2——ARCHITECTURE §5 + RESPONSES-TRANSPORT 并入）；transport/预设表/模型适配 |
| Webview 前端/消息协议 | `WEBVIEW.md` | VSC 独有（无 CLI 对应——批 7）；webview 布局/文件结构/活动面板 R22/组件 + 消息协议（ARCHITECTURE §11+§12 迁出） |
| 需求与决策 | `docs/requirements/PROJECT.md` | 需求与决策记录（归位 `docs/requirements/`——台账自持批 LEDGER-SELF-CONTAINED；v1 功能范围节拆出至 `FEATURES.md`） |
| 三观（提示词根基） | `docs/requirements/PHILOSOPHY.md` | 归位 `docs/requirements/`（价值层需求——LEDGER-SELF-CONTAINED 批） |
| 提示词系统（双源：中文权威 + 英文落地） | `VSC-PROMPTS.md` + `docs/design/prompts/`（15 档中文权威） | 本端 15 文件槽位化现行态 + 端特有差异（R14 池规则段等）——机制权威 = **本端双源**（中文权威 ↔ `src/prompts/` 英文落地，差异逐项见「镜像差异表」节）；`PROMPT-SYSTEM（CLI 仓·需求）` 蓝图 + 施工档三件为参照（语义同源·原文自持）——2026-09-10 双端同批 · 2026-09-11 双源化（第 5 批 VSC-MIRROR） |
| 配置面板（Settings） | `SETTINGS.md` | 现行权威源（2026-08-25 合并 6 份历史批次文档：SETTINGS-PANEL(-2)/PROXY-ROW/REORG/SUBMODEL-SHELL/MODEL-PICKER-UNIFY，已入 `_archive/`，细节查原文件） |
| 项目切换 | `PROJECT-SWITCHER.md` | |
| 发布流程 | `RELEASE.md` |
| 测试基建 | `TESTING.md` | 测试生命周期与集成集（新建 2026-09-11——与 CLI 仓同名档对应；语义同源·本端原文自持）。快/全两层 + slow 门 + 显式清单实现面见 `TESTING.md` §1 |
| 台账自持（文档体系各仓自持） | `LEDGER-SELF-CONTAINED.md` | 本批——台账射程（只收本仓条目）/ 需求树建设 / 批档接收 / 机检 L4（`scripts/check-ledger.mjs`）/ 提示词自持条文 / 存量宽口径处置 |
| 文档↔实装对账 | `DOC-CODE-RECONCILE.md` | 本批——文档锚一致性机检 **V5**（用例号 / 符号 / 路径三类锚的**存在性**；报告态 → 清后转阻断、阈值 0）+ 层 3 反查（`scripts/reconcile-lookup.mjs`）+ 语义巡检机制；需求 = `docs/requirements/ENGINEERING-MODE.md` §1（F15–F20 / N6–N9）；与对端（CLI 仓）**语义同源·本端原文自持**（差异逐项见该档 §13） |
| 可移植性 | `PORTABILITY.md` | VSC 镜像面（批次二）——对照 = `PORTABILITY（CLI 仓·设计）`（§9 = 对位清单权威）；分类唯一权威 / 声明面 / 门禁拒绝 / 索引扩表判据 |
| 会诊 | `CONSULTATION.md` | |
| 飞刀 | `ESCALATE.md` | |
| Design Token 硬化 | `ENG-TOKEN-BINDING-TUNING.md`（需求 = `docs/requirements/ENG-TOKEN-BINDING.md`） | v2 收窄：安全修复（双后门/复活陷阱）+ TTL 7 天可配（2026-08-25，v1 内容绑定被实况否决见文档考古） |
| 覆盖率缺口修复 | `docs/design/_archive/COVERAGE-GAPS-REQUIREMENTS.md`、`docs/design/_archive/COVERAGE-GAPS-TUNING.md` | 遗留测试覆盖收口（2026-08-25，与 CLI 同源）——已退役（归位 `docs/design/_archive/`） |
| 轮末蒸馏异步化 | `SEND-STALL-DISTILL-TUNING.md`（需求 = `docs/requirements/SEND-STALL-DISTILL.md`） | send 按钮卡顿修复：结束信号先行、蒸馏异步（2026-08-25，与 CLI 同源） |
| 工具移除 | `docs/design/_archive/SLEEP-REMOVAL-REQUIREMENTS.md`、`docs/design/_archive/SLEEP-REMOVAL-TUNING.md` | sleep 工具删除（2026-08-25，与 CLI 同源）——已退役（归位 `docs/design/_archive/`） |
| 工具输出限制 | `TOOL-OUTPUT-LIMITS-TUNING.md`（需求 = `docs/requirements/TOOL-OUTPUT-LIMITS.md`） | 落盘阈值/显示层 16K→64K（2026-08-24，与 CLI 同源） |
| Agent 运行参数 | `AGENT-PARAMS-TUNING.md`（需求 = `docs/requirements/AGENT-PARAMS.md`） | 评审超时/轮次上限调整（2026-08-24，与 CLI 同源） |
| Webview 性能 | `docs/design/_archive/webview-input-lag.md` | 输入卡顿修复方案（纯历史修复记录，已实施）——已退役（归位 `docs/design/_archive/`） |

## 规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **存量碎片处理（2026-08-25 收口）**：Settings 6 文档已合并为 `SETTINGS.md`（现行权威源，历史批次文档已归档 `_archive/`）；TURN-CAP 两端同源已收口为各自实现记录。新增同主题内容须先查本表归属。
6. **文档人类可读（2026-09-08 防复发）**：写/改本文档映射内任一 `docs/design/` 文档须人类可读——**无 >300 字符单行**（整节/表/规则不得压成一行）、**markdown 结构正确**（标题/表格/代码块不被吞进正文，空行隔离节）、**变更记录折叠**（新变更落一行注记，不堆逐批需求/评审/测试流水账）。违反即文档格式债，与源码长行硬限同理。批量检查：`node scripts/check-doc-width.mjs`（扫 `docs/design/` 无 >300 单行，`_archive/` 豁免）。
   **表格行豁免（群 A 批——2026-09-11）**：markdown 表格行结构性不可折行——超宽不报（谓词与 V2 枚举同源）；正文非表格行超宽照报。
   附则（检查器契约——群 A 批）：宽度扫描**单源** = `checkDocWidths(root,{max,dir})`（主流程零内联重复扫描，两处规则不得漂移）；本批改动面零行（现状实跑：69 文件零超宽——豁免为未来性对齐）。检查器本体归属 = 本档规则 6 的执行器。
   **AC-MA8-1..2 / T-MA8-1–2**（群 A 批·A8）：机判 = 夹具输入（>300 表格行 / >300 非表格行）→ 前者零报、后者照报；`checkDocWidths` 内用 `isTableRow` 谓词；主流程零内联 `length > maxW` 扫描（grep）；宿主 = `test/doc-consistency.test.mjs`（新两例）+ `scripts/check-doc-width.mjs`。

## 镜像差异表（提示词双源——`docs/design/prompts/` ↔ `src/prompts/` ↔ CLI 仓同名档）

> 第 5 批 VSC-MIRROR（2026-09-11）建双源：`docs/design/prompts/` 15 档初始内容**逐字**自 CLI 仓同名档拷贝；
> 差异只允许在**路径/UI 引用处**与**端特有段**，逐项登记如下（语义同源·原文自持——依据 `ENGINEERING-MODE（CLI 仓·设计）§2.22.1/§2.22.7`；两仓合并批 3：本表 = 产品侧对位面）。

| # | 文件 + 段 | 差异 | 来源 |
|---|---|---|---|
| 1 | `discipline-engineering.md` · 尾部「VSC 端特有段：R14 池规则」节 | 镜像独有（CLI 侧不引入） | 端特有段 = 本端 `src/prompts/discipline-engineering.md` 同名尾部节（as-of :225-228；per-role-domain pools / `agent.poolLimits`） |
| 2 | `persona-engineering.md` · 尾部「VSC 端特有段」节 | 镜像独有 | 端特有段 = 本端 `src/prompts/persona-engineering.md` VSC 独有段（多并行指针 / R14 池规则 / 取消语义） |
| 3 | `advisor-design.md`（评审标准 7 + 要点，2 处）/ `discipline-normal.md`（工作流节 + 文档先行节，2 处） | `docs/README.md` → `docs/design/README.md` | 对端路径改写（本端文档地图 = `docs/design/README.md`） |
| 4 | `discipline-engineering.md` · D2 / 评审收敛纪律 / 委派节 / 写文档节 | CLI 侧引用注记 + 本端权威改写 | 对端节引用（需求档树/`docs/batches/`/`ENGINEERING-MODE（CLI 仓·设计）§2.20`/`METHODOLOGY（CLI 仓·设计）` 属 CLI 仓 → 注「（CLI 侧）」；`README（CLI 仓）§2.7` → 本端 `docs/design/README.md` 归属规则 6） |
| 5 | `discipline-normal.md` / `persona-eng-coder.md` / `persona-engineering.md` · AGENT-LOOP 引用；`discipline-engineering.md` · 异步锚句 | 保留 CLI 节号 + `（CLI 仓·设计）` 前置注记 + 本端对应节号；异步锚句 = 引文保字面 + 节号注记（「该节号 = CLI 侧；本端对应节 = §9 …」形态） | 对端节引用（`AGENT-LOOP（CLI 仓·设计）§18/§25`、以及机制对不上的 `AGENT-LOOP（CLI 仓·设计）§11.2`——本端对应 §8 交付协议 / §9 异步化） |
| 6 | `discipline-normal.md` / `persona-eng-designer.md` / `persona-engineering.md` · 需求层与批次档树引用 | 行内注记「CLI 侧」（如「——CLI 侧批次档树」） | 对端路径（第 5 批登记时本端无 `docs/requirements/`·`docs/batches/`——批次档单一归属 = CLI 仓；2026-09-12 本端两树已自持补齐） |
| 7 | （V1 判据——非文本差异） | 含「（CLI 侧）」注记的引用行 V1 豁免（不报、不入基线）；本表自身的 CLI 侧设计档引用同按规范形态（`名称（CLI 仓·层别）§N`）书写 | **VSC 独有语义**（CLI 侧 V1 不变）——CLI 侧设计档 `ENGINEERING-MODE（CLI 仓·设计）§2.22.7` |
| 8 | `persona-eng-coder.md` · 尾部「VSC 端特有段：实现纪律与交付报告」节 | 镜像独有（CLI 侧不引入）；反向差异：镜像 `file 域声明语义` 节在本端英文落地无对应节（镜像以 CLI 结构为准） | 端特有段 = 本端 `src/prompts/persona-eng-coder.md:33-49`（实现纪律 / 逐文件自查 / 清单外变更 / 收尾自审 / 报告格式） |
| 9 | `discipline-engineering.md` · 端内锚注/施工迁注文本（`:8` Mandatory Flow 零裁量锚（ENGINEERING-MODE §2.9 锚#1）/ `:38-41` 第 5 批修订注 / `:58` 设计行为纪律四维锚节 / `:168` 异步锚句迁注「逐字随迁——原 engineering.md 评审节」） | 镜像不并入（镜像以 CLI 中文档结构与机制文本为准；本项为端内锚注/迁注文本——差异已如实登记） | 端内文本差异——已登记（非静默） |

## 变更记录

- 2026-09-13：**两仓合并批 3（S6）纪律句收窄**——镜像差异表行 3–6 描述按产品侧对位口径改写（`（CLI 侧）` 注记与 V1 豁免保留——R15）。
- 2026-09-12：文档↔实装对账批（DOC-CODE-RECONCILE）——新增板块行「文档↔实装对账」`DOC-CODE-RECONCILE.md`（V5 锚一致性机检 / 反查 / 语义巡检）；该档为 V5 判据权威源，V1–V3 指针 = `ENGINEERING-MODE.md` §9、V4 指针 = `LEDGER-SELF-CONTAINED.md` §8.10.1（不重述——单一权威源）。

- 2026-09-12：台账自持批（LEDGER-SELF-CONTAINED）——本表补登 `LEDGER-SELF-CONTAINED` / `PORTABILITY` 两行；需求档归位行同步（`docs/requirements/` 四归位 + `PROJECT` 异名归位 + `PHILOSOPHY` 归位——零失效路径）。

- 2026-09-12：子代理审批面对齐批（VSC-CHILD-PERMISSION）——`AGENT-LOOP.md` **§18** 新增（child permission gate：ask 弹卡带归属 / 模式继承 / 块头 ⏸ / 取消释放 / R2 文档修正）；`TOOLS.md` §8 子代理审批条；协议增补 `WEBVIEW.md` §7.2（4 行）；`ESCALATE.md` / `ENGINEERING-MODE.md` 矛盾措辞随批修正。
- 2026-09-11：群 A 批（VSC-MIRROR-SWEEP）——规则 6 补**表格行豁免**句 + 检查器契约附则（宽度扫描单源 `checkDocWidths`；`scripts/check-doc-width.mjs` 断言面同步）。

- 2026-09-11：新增板块「测试基建」（`TESTING.md`）——测试生命周期与集成集对位档（与 CLI 仓同名档对应；语义同源·本端原文自持）。集成清单制 / runner / 发布门三环接线为待实施项。
- 2026-09-11：提示词双源化（第 5 批 VSC-MIRROR）——新建 `docs/design/prompts/` 15 档中文权威镜像（逐字自 CLI 仓拷贝 + 端特有段并入 + 对端节引用改写，逐项见「镜像差异表」节）；`src/prompts/` 14→15（新增 `persona-eng-designer.md`）+ 锚句宿主档定点改写（A1–A8/A11/A12）；「机制权威」句改写为**本端双源**
- 2026-09-09：ASYNC-RESIDUE-FIX 登记（CLI docs/design——双端 prompts 异步残留措辞清理——本端 main.md/engineering.md 同步修正——评审采纳版）——Agent 循环 行注登记。
- 2026-09-09：INPUT-LOCK-ASYNC 登记（主会话输入禁排队 C'——busy（running 含 digest）锁输入/拒收——R15 排队合并废弃 + 单槽交接——CLI+VSC 双端实现——本端机制正文 AGENT-LOOP §7 更新）
- 2026-09-09：SESSION-RESTORE-PARITY 登记（会话/存储/恢复——VSC 恢复呈现对齐 CLI：
  assistant 帧容器/嵌套工具卡/跨页配对/turnStart 可见前驱/首窗 200——改动见档内受影响文件）
- 2026-08-21：初版（文档归属纪律，规格见 CLI `docs/design/AGENT-LOOP.md` §12 及本仓库 `ARCHITECTURE.md` 同步段）
- 2026-08-24：新增板块「Agent 运行参数」（AGENT-PARAMS-*）与「工具输出限制」（TOOL-OUTPUT-LIMITS-*）
- 2026-08-25：新增「轮末蒸馏异步化」（SEND-STALL-DISTILL-*）、「工具移除」（SLEEP-REMOVAL-*）、「覆盖率缺口修复」（COVERAGE-GAPS-*）；Settings 6 份历史批次文档合并入 `SETTINGS.md`
- 2026-09-06：README provider 数量修正（17→20——补 GLM Coding Plan / MiMo / MiMo Token Plan，与 `src/config-presets.mjs` PROVIDER_PRESETS 对齐）；其余文档质量观察项见会话记录，未入库
- 2026-09-06：会话目录残留 GC + 标题写显性化（机制权威源 `SESSION（CLI 仓·设计）` §12）——VSC 端 eng-coder 交付：`src/extension/session-gc.mjs`（残留 GC + 冷 cwd 原语，CLI 同源移植；F2 手动执行面仅 CLI `thincoder session gc`）+ setSlotTitle `{ok, reason}` 契约（session-io.mjs）+ 面板调用方适配（panel-messages/panel-session）+
  `test/session-gc.test.mjs`（已删除——删除记录 = 3b974ae · 2026-09-07「测试清空」批）
- 2026-09-08：文档格式债清理批——**归档 11 件移 `_archive/`**（SETTINGS-PANEL(-2)/PROXY-ROW/REORG/SUBMODEL-SHELL/MODEL-PICKER-UNIFY + COVERAGE-GAPS 对 + SLEEP-REMOVAL 对 + webview-input-lag）并更新登记；整文件单行 demux 为多行 markdown；归属规则加**规则 6（文档人类可读防复发）**——配 `scripts/check-doc-width.mjs` 批量检查。
  - 2026-09-08：DOC-REORG 第 2 批——`RESPONSES-TRANSPORT.md`（已退役——现体 = `docs/design/PROVIDER.md`）并入新建 `PROVIDER.md`（板块 Provider/transport），README 登记行同步（原 Responses 行改为 PROVIDER 行）
- 2026-09-08：DOC-REORG-VSC 第 7 批——新板块登记：Webview 前端/消息协议（WEBVIEW，VSC 独有无 CLI 对应），自 ARCHITECTURE §11+§12 迁出（消息协议并入）。
- 2026-09-08：DOC-REORG-VSC 第 4 批——新板块登记：工程模式（ENGINEERING-MODE）+ 评审收敛（ADVISOR-CONVERGENCE），各自独立完整（与 CLI 同名档对应）。
- 2026-09-08：DOC-REORG-VSC 收官（第 8 批）——ARCHITECTURE 瘦身为薄枢纽（删除已迁出 §4-§13 与 §15 CLI 指针表；§3 模块地图加「详细设计 →」指针列）；本表全量登记核对 + 板块名对齐 CLI（补齐 会话/上下文压缩/Agent 循环（AGENT-LOOP 权威 + TURN-CAP 同板块）/工具系统/Checkpoint 事故恢复/记忆 行；Provider 行更名对齐；MCP.md 随 CLI 归「工具系统」行独立保留注；顺序归组为 机制板块 → VSC 独有 → 专题）。

## 变更记录（SESSION 系列补登——2026-09-09 核销）
- `SESSION-RESTORE-PARITY.md`（恢复呈现对齐——0231627——consume 592ea112）
- `SESSION-ACTIVITY-REVISED.md`（活动区回归/Stop 语义——5be6c67——consume f125c0d5）

## 变更记录（ACTIVITY-SPLIT 补登——2026-09-09 核销）
- `ACTIVITY-SPLIT.md`（activity.js 三文件拆分——6d66dd5——287/229/94——consume 18d53f6e）

## 变更记录（READ-HISTORY-SPLIT 补登——2026-09-09 核销）
- `READ-HISTORY-SPLIT.md`（read-history.mjs 两文件拆分——5300f09——272/119——consume 521b9987）

## 变更记录（A2-SUMMARY-PARITY 补登——2026-09-09 核销）
- `A2-SUMMARY-PARITY.md`（A2 摘要对齐 CLI——051b317——consume c6fe8a25）

## 变更记录（GIT-ASYNC 补登——2026-09-09 核销）
- `GIT-ASYNC.md`（git 富注入异步化双端——L21——ed3fe3e——CLI 镜像半 ccd1b51——consume 待父侧补记）

## 变更记录（QUEUED-VISIBILITY 补登——2026-09-09 交付）
- `QUEUED-VISIBILITY.md`（排队 subagent 可见性差集增量——F-1 基线 + F-2 queued ⏹ 取消双端（覆盖 SESSION-ACTIVITY-REVISED F-6 旧"接受无取消"裁定）+ F-3 VSC Reload 快照重推 + F-4 i18n——设计档在 VSC 侧——CLI 参照读绝对路径——双仓实现——consume 待父侧补记）


## 变更记录（本会话批核销——2026-09-09）
- INPUT-LOCK / MAIN-DESIGN / MODEL-MERGE / ISSUE-FIX / ASYNC-RESIDUE / QUEUED-VISIBILITY / MODEL-400 全交付——consume 核销——L2 全绿（CLI 204/204 + VSC 239/239）。

## 变更记录（SCHEDULER-DYNAMIC-DOMAIN 补登——2026-09-09）
- `SCHEDULER-DYNAMIC-DOMAIN`（CLI docs/design——调度器动态文件域 = 声明 ∪ running touched——双端 scheduler effectiveFiles 同构镜像——机制正文本端落 AGENT-LOOP §6——CLI 地图 Agent 循环 行注登记；本端行注从略——行已 287 字符，规则 6 三百字符硬限容不下新增注记）。

## 变更记录（REMOVE-POOL-SNAPSHOT 补登——2026-09-09）
- `REMOVE-POOL-SNAPSHOT.md`（撤 F-3 webviewReady 池快照重推——postPoolSnapshot 过度工程——VSC 端实现——F-2 queued 可见保留——QUEUED-VISIBILITY F-3 已撤销注记于该档）

## 变更记录（ACTIVITY-REWRITE-SIMPLE 交付——2026-09-09）
- `ACTIVITY-REWRITE-SIMPLE.md`（活动块去加戏重写——B1 流尾形态回归——活动区容器/DOM
  move/落流锚插/settle 驻留/簿记/awaiting/preview/ticker 删——queued 可见保留去 reload
  恢复——扩展端零动）——**supersedes**：`SESSION-ACTIVITY-REVISED.md` / `QUEUED-VISIBILITY.md`
  / `ACTIVITY-SPLIT.md`（整档）+ `SESSION-FLOW-B.md` B1 节（子代理块流尾形态段——B2 boot
  节不涉）。WEBVIEW.md §2/§5 权威措辞随批同步。

