# ThinCoder VS Code 需求文档地图（docs/requirements/）

> 本文件是 `docs/requirements/` 的登记规则与归属判据——写/改本仓需求文档前**先查这里**。
> 本目录为**本仓自持面**（2026-09-12 建立）：本仓需求住本仓。
> 树终态计数：**17 → 34 档**（① 行建档 17 档）；现态 = **34 = 34 已建 + 0 待建**（建档实施完成——见下方对位表）。
> 与对端仓（CLI）的需求档**语义同源、本端原文自持**——不做逐字一致、不加跨端同步依赖（在案多实现面纪律）。

## 为什么本目录存在

本仓此前**没有** `docs/requirements/`——本仓需求写在 CLI 仓需求档里。这是历史遗留的越仓承载，不是设计意图。

- **本仓 `docs/design/` 早已自持**（**49 档**——顶层 `.md` 含 `README.md`；归位后实测——归位前 55 档）——反证本仓有能力自持文档层。
- 塌的只有**需求层与批档层**；本目录即需求层的补齐。

## 规则

1. **一个板块一个文档**：新功能点不新建文档，并入所属板块的现有文档（追加变更段或更新章节）。
2. **先查地图定位归属**：写文档前先查本表——找到所属板块就改该板块文档，**不得为既有板块新建文件**。
3. **新板块才新建**：确无归属的新板块才新建文档，并立即在本表登记。
4. **单一权威源**：同一机制只在一处详述；其余文档引用（指路），不复制内容——多处复制必然漂移矛盾。
5. **各仓自持**：本目录只承载**本仓**需求——他仓 / 他项目 / 他产品线的事项与指针不写进本仓（台账射程同规）。
   本仓缺失的文档层就地补建——**不得以「另一仓已有」「避免重复」为由省略本仓文档**。
6. **文档人类可读**：无 >300 字符单行（表格行豁免）；markdown 结构正确（标题/表格/代码块不被吞进正文、空行隔离节）；
   变更记录折叠（新变更落一行注记，不堆逐批流水线账）。
   批量检查：`node scripts/check-doc-width.mjs`（扫描域 = `docs/design/` + `docs/requirements/` + `docs/batches`）。
7. **跨仓引用形态**：引用他仓文档不写 `X.md` §N 形态——写「名称（仓别）§N」（去 `.md` 后缀、去路径前缀）；
   带 `.md` 的跨仓形态在 V1 检查器下恒判 `unknown-doc`（fail-closed）。
8. **批次档**：批次记录住 `docs/batches/<批>-<主题>.md`（各仓自持）；机制权威见本仓 `docs/requirements/ENGINEERING-MODE.md`。

## 板块 → 文档映射

| 板块 | 文档文件 | 备注 |
|---|---|---|
| （本档） | `README.md` | 需求层地图：登记规则 + 36 档对位表 |
| 工程模式 | `ENGINEERING-MODE.md` | 台账 / 批次档 / 需求档的自持规则、机检闸、提示词承载；§1.7 = 归档对位登记（接收面） |
| Agent 循环 | `AGENT-LOOP.md` | 子代理生命周期 / 异步化 + webview 活动面需求（**C 桶接收档**——自对端仓 `AGENT-LOOP（CLI 仓·需求）` 的 VSC 托管族迁入 7 节：§9 / §10 / §11 / §12 / §14 / §16 / §17；本端原文自持、节号保留源编号） |
| 测试基建 | `TESTING.md` | 测试判据与保留面（散文锚退役批建立）；与对端同标识条目语义同源、本端原文自持 |
| Agent 运行参数 | `AGENT-PARAMS.md` | 评审超时 / 轮次上限（归位——自 `docs/design/AGENT-PARAMS-REQUIREMENTS.md`） |
| Design Token 硬化 | `ENG-TOKEN-BINDING.md` | 流程凭证语义 / TTL（归位） |
| 轮末蒸馏异步化 | `SEND-STALL-DISTILL.md` | 结束信号先行、蒸馏异步（归位） |
| 工具输出限制 | `TOOL-OUTPUT-LIMITS.md` | 落盘阈值与预览构成（归位） |
| 产品定位与决策 | `PROJECT.md` | 定位 / 决策记录 / 与 CLI 的关系（归位异名——原 `docs/design/REQUIREMENTS.md`） |
| 三观（提示词根基） | `PHILOSOPHY.md` | 世界观 / 人生观 / 价值观（归位） |
| v1 功能范围 | `FEATURES.md` | 已实现功能清单（自 `PROJECT.md` 拆出） |
| 诊断事件日志 | `LOGGING.md` | 常驻骨架日志（本批新建——机制在位无档补齐） |
| 多实例协作感知 | `MULTI-INSTANCE-COLLAB.md` | 同 cwd 多副本感知 / 文件域避让（本批新建） |
| normal 模式 | `NORMAL-MODE.md` | 提示词槽位装配层（本批新建） |
| `settings` 工具 | `SETTINGS-TOOL.md` | 配置读写通道与形状护栏（本批新建） |
| 结构债 | `STRUCTURE-DEBT.md` | 文件 / 函数 / 文档粒度硬指标（本批新建） |
| verify 门禁 | `VERIFY-REDESIGN.md` | 声明式完成前门（本批新建） |
| async 结果容器 | `ASYNC-RESULT-CONTAINER.md` | 异步子代理结果结算（本批建档——原对位 = `docs/design/ASYNC-RESULT-CONTAINER.md`） |
| 设计评审凭证结算 | `DESIGN-TOKEN-SETTLEMENT.md` | settle 当场落盘 / 门禁读权威（本批建档——原对位 = `docs/design/DESIGN-TOKEN-SETTLEMENT.md`） |
| 飞刀 | `ESCALATE.md` | 升级到更强模型实现（本批建档——原对位 = `docs/design/ESCALATE.md`） |
| MCP 客户端 | `MCP.md` | MCP 工具展开并入统一工具表（本批建档——原对位 = `docs/design/MCP.md`） |
| 可移植性 | `PORTABILITY.md` | 项目约定声明 / 降级可见 / 索引与门禁面（本批建档——原对位 = `docs/design/PORTABILITY.md`） |
| VSC 提示词 | `VSC-PROMPTS.md` | 槽位装配 / 双源 / 降级链（异名——对位对端 `PROMPT-SYSTEM`）（本批建档） |
| 发布流程 | `RELEASE.md` | 双源发布 / 唯一门禁 / CalVer 定号（本批建档——原对位 = `docs/design/RELEASE.md`） |
| 子代理观测 / 注入 | `SUBAGENT-OBSERVE-SEND.md` | observe 查进度 + send 注入引导（本批建档——原对位 = `docs/design/SUBAGENT-OBSERVE-SEND.md`） |
| 工具系统 | `TOOLS.md` | 注册表 / 描述装载 25 档 / 调度与审批（本批建档——原对位 = `docs/design/TOOLS.md`） |
| webview 界面 | `WEBVIEW.md` | 本端 UI 面（对话流 / 活动区 / 工具卡；异名——对端 TUI）（本批建档） |
| 撞墙继续 | `TURN-CAP-CONTINUE.md` | 轮数预算耗尽续跑 / 跨段累计编号（本批建档——原对位 = `docs/design/TURN-CAP-CONTINUE.md`） |
| 评审收敛 | `ADVISOR-CONVERGENCE.md` | advisor 独立评审的收敛保证 + 评审链边缘守卫（本批建档 A 轮——原对位 = `docs/design/ADVISOR-CONVERGENCE.md`） |
| 快照与回滚 | `CHECKPOINT.md` | git 破坏性操作保险（v2 全量副本 + 自动快照接线；本批建档 A 轮——原对位 = `docs/design/CHECKPOINT.md`） |
| 会诊 | `CONSULTATION.md` | 多模型并行分析（digest 唯一消费通道；本批建档 A 轮——原对位 = `docs/design/CONSULTATION.md`） |
| 上下文压缩 | `CONTEXT-COMPACTION.md` | 安全点压缩 / 摘要回注 / 降级链 / webview 可见性（本批建档 A 轮——原对位 = `docs/design/CONTEXT-COMPACTION.md`） |
| 记忆系统 | `MEMORY.md` | 两层记忆 + 代码 / 文档索引（本批建档 A 轮——原对位 = `docs/design/MEMORY.md`） |
| 会话 | `SESSION.md` | 槽位持久化 / 恢复 / GC（本批建档 A 轮——原对位 = `docs/design/SESSION.md`） |

**树终态计数：17 → 34 档**（= 原 17 已建 + ① 行建档 17 档）：**现态 = 34 = 34 已建 + 0 待建**（建档实施收齐——2026-09-12 A 轮 6 档落盘后；见下方对位表）。

**待建档登记**：**0 档**（清零——① 行 17 档已全部落盘并逐档并入本文件「板块 → 文档映射」表；下方对位表**无「待建」行**）。

## 36 档对位表（CLI 仓需求档 → 本仓判 → 本仓对位档 → 处置）

> 判值三态：① = **建本仓需求档**（现态 **0 行**——建档实施已完成）· ② = **已有对位**（本仓需求层已有档，注明实际档名）· ③ = **本端无此面**（写理由）。
> **判据句（2026-09-12 10:57 用户裁定「全部啊！」）**：**需求层必须在本仓有档**——② 已有对位**不得以 design 层充当**；「对端有」「design 层有」不构成需求层缺失的理由。
> 语义同源参照 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.6`（逐档清单 36 行——原值 / 本仓现状 / 处置 / 依据句）；本表为本端原文自持的逐档登记。

| # | CLI 仓需求档 | 判 | 本仓对位档（实际档名 / 待建档名） | 处置 / 理由 |
|---|---|---|---|---|
| 1 | `ACP-CLIENT` | ③ | — | 本端无此面（保持）：本端即 IDE 内嵌扩展，不以 ACP 接入 |
| 2 | `ADVISOR-CONVERGENCE` | ② | `docs/requirements/ADVISOR-CONVERGENCE.md` | **已建** `docs/requirements/ADVISOR-CONVERGENCE.md`（本批建档 A 轮——原对位 = `docs/design/ADVISOR-CONVERGENCE.md`） |
| 3 | `AGENT-LOOP` | ② | `docs/requirements/AGENT-LOOP.md` | 已有对位（C 桶接收档） |
| 4 | `AGENT-PARAMS` | ② | `docs/requirements/AGENT-PARAMS.md` | 已有对位（归位） |
| 5 | `ASYNC-RESULT-CONTAINER` | ② | `docs/requirements/ASYNC-RESULT-CONTAINER.md` | **已建**（本批建档——原对位 = `docs/design/ASYNC-RESULT-CONTAINER.md`） |
| 6 | `CHECKPOINT` | ② | `docs/requirements/CHECKPOINT.md` | **已建** `docs/requirements/CHECKPOINT.md`（本批建档 A 轮——原对位 = `docs/design/CHECKPOINT.md`） |
| 7 | `CONSULTATION` | ② | `docs/requirements/CONSULTATION.md` | **已建** `docs/requirements/CONSULTATION.md`（本批建档 A 轮——原对位 = `docs/design/CONSULTATION.md`） |
| 8 | `CONTEXT-COMPACTION` | ② | `docs/requirements/CONTEXT-COMPACTION.md` | **已建** `docs/requirements/CONTEXT-COMPACTION.md`（本批建档 A 轮——原对位 = `docs/design/CONTEXT-COMPACTION.md`） |
| 9 | `CRASH-REPORTS` | ③ | — | 本端无此面（保持）：本端无崩溃取证面（`crash*.mjs` 零命中） |
| 10 | `DESIGN-TOKEN-SETTLEMENT` | ② | `docs/requirements/DESIGN-TOKEN-SETTLEMENT.md` | **已建**（本批建档——原对位 = `docs/design/DESIGN-TOKEN-SETTLEMENT.md`） |
| 11 | `ENG-TOKEN-BINDING` | ② | `docs/requirements/ENG-TOKEN-BINDING.md` | 已有对位（归位） |
| 12 | `ENGINEERING-MODE` | ② | `docs/requirements/ENGINEERING-MODE.md` | 已有对位（已在位） |
| 13 | `ESCALATE` | ② | `docs/requirements/ESCALATE.md` | **已建**（本批建档——原对位 = `docs/design/ESCALATE.md`） |
| 14 | `FEATURES` | ② | `docs/requirements/FEATURES.md` | 已有对位（拆出） |
| 15 | `LOGGING` | ② | `docs/requirements/LOGGING.md` | 已有对位（本批新建——机制在位无档） |
| 16 | `MCP` | ② | `docs/requirements/MCP.md` | **已建**（本批建档——原对位 = `docs/design/MCP.md`） |
| 17 | `MEMORY` | ② | `docs/requirements/MEMORY.md` | **已建** `docs/requirements/MEMORY.md`（本批建档 A 轮——原对位 = `docs/design/MEMORY.md`） |
| 18 | `MULTI-INSTANCE-COLLAB` | ② | `docs/requirements/MULTI-INSTANCE-COLLAB.md` | 已有对位（本批新建） |
| 19 | `NORMAL-MODE` | ② | `docs/requirements/NORMAL-MODE.md` | 已有对位（本批新建） |
| 20 | `PHILOSOPHY` | ② | `docs/requirements/PHILOSOPHY.md` | 已有对位（归位） |
| 21 | `PORTABILITY` | ② | `docs/requirements/PORTABILITY.md` | **已建**（本批建档——原对位 = `docs/design/PORTABILITY.md`） |
| 22 | `PROJECT` | ② | `docs/requirements/PROJECT.md` | 已有对位（归位异名——原 `docs/design/REQUIREMENTS.md`） |
| 23 | `PROMPT-SYSTEM` | ② | `docs/requirements/VSC-PROMPTS.md` | **已建**（本批建档 + **异名**——对位对端 `PROMPT-SYSTEM`；本端档名 = `VSC-PROMPTS`） |
| 24 | `RELEASE` | ② | `docs/requirements/RELEASE.md` | **已建**（本批建档——原对位 = `docs/design/RELEASE.md`） |
| 25 | `SEND-STALL-DISTILL` | ② | `docs/requirements/SEND-STALL-DISTILL.md` | 已有对位（归位） |
| 26 | `SESSION` | ② | `docs/requirements/SESSION.md` | **已建** `docs/requirements/SESSION.md`（本批建档 A 轮——原对位 = `docs/design/SESSION.md`） |
| 27 | `SETTINGS-TOOL` | ② | `docs/requirements/SETTINGS-TOOL.md` | 已有对位（本批新建） |
| 28 | `STRUCTURE-DEBT` | ② | `docs/requirements/STRUCTURE-DEBT.md` | 已有对位（本批新建） |
| 29 | `SUBAGENT-OBSERVE-SEND` | ② | `docs/requirements/SUBAGENT-OBSERVE-SEND.md` | **已建**（本批建档——原对位 = `docs/design/SUBAGENT-OBSERVE-SEND.md`） |
| 30 | `TESTING` | ② | `docs/requirements/TESTING.md` | 已有对位（并行批落位） |
| 31 | `TOOL-OUTPUT-LIMITS` | ② | `docs/requirements/TOOL-OUTPUT-LIMITS.md` | 已有对位（归位） |
| 32 | `TOOLS` | ② | `docs/requirements/TOOLS.md` | **已建**（本批建档——原对位 = `docs/design/TOOLS.md` + 编辑族 6 档） |
| 33 | `TUI` | ② | `docs/requirements/WEBVIEW.md` | **已建**（本批建档 + **异名**——本端 UI 面 = webview；端差已登记） |
| 34 | `TUI-TOOL-OUTPUT` | ② | `docs/requirements/WEBVIEW.md`（**与 #33 同档**） | **已建**（本批建档——呈现面 = webview 工具卡） |
| 35 | `TURN-CAP-CONTINUE` | ② | `docs/requirements/TURN-CAP-CONTINUE.md` | **已建**（本批建档——原对位 = `docs/design/TURN-CAP-CONTINUE.md`） |
| 36 | `VERIFY-REDESIGN` | ② | `docs/requirements/VERIFY-REDESIGN.md` | 已有对位（本批新建） |

**三值计数**：① **0** · ② **34** · ③ **2** → **36** ✅（原「① 18」**全部建档转 ②**——本批建档 17 档〔`WEBVIEW` 一档承载 #33 / #34 两行〕；① 余 **0 行 = 清零**）

**① 待建档 0 档**（清零——原 ① 6 行已于 A 轮全部落盘：`ADVISOR-CONVERGENCE` · `CHECKPOINT` · `CONSULTATION` · `CONTEXT-COMPACTION` · `MEMORY` · `SESSION`）。
建档规则（建档单位 = 本端机制板块 / 命名取本端权威档名 / 两层各持其档 / 非复制）见本仓设计档 §8.6。

## 需求档写法（三层）

需求文档按**三层**组织（与对端同源）：

- **总体目标** — 一段话定位：为谁解决什么问题；
- **功能性需求** — 逐条可验收；每条带范围边界（明确不做什么）；
- **非功能性需求** — 性能 / 安全 / 兼容 / 可维护 / 可扩展等硬指标（含度量方式）。

**判定句**：每条功能性需求须有可机器验证的判定句，并回指设计档验收标准。

## 变更记录

- 2026-09-12：建档（台账自持批 LEDGER-SELF-CONTAINED——本仓 `docs/requirements/` 首建；首档 = `ENGINEERING-MODE.md`）。
- 2026-09-12：登记 `TESTING.md`（散文锚退役批 PROSE-ANCHOR-RETIRE 建立——规则 3「新板块才新建 + 立即本表登记」；父侧落笔）。
- 2026-09-12（修正轮——设计评审轮次 1 #7）：计数口径统一（`docs/design/` 顶层 **55 档**，含 `README.md`；as-of 实测）。
- 2026-09-12（LEDGER-SELF-CONTAINED 批实施）：归位 6（`AGENT-PARAMS` / `ENG-TOKEN-BINDING` / `SEND-STALL-DISTILL` / `TOOL-OUTPUT-LIMITS` / `PROJECT` / `PHILOSOPHY`）· 拆出 1（`FEATURES`）·
  新建 6（① 行）——本表登记全集 16 档 + 36 档对位表三值齐备。
- 2026-09-12（**C 桶接收轮**——用户 2026-09-12 10:55 当场裁定：C 桶接收面 = **建本仓需求档**）：
  新建 `AGENT-LOOP.md`（自 `AGENT-LOOP（CLI 仓·需求）` 迁入 VSC 需求 7 节——逐字迁移 + 跨端引用形态收敛）；
  对位表第 3 行判 ② → **①**；**三值计数 = ① 7 · ② 27 · ③ 2**；**树终态 16 → 17 档**；§1.7 接收项（CLI 设计档 `ENGINEERING-MODE` §2.24.9 归档对位行）。
- 2026-09-12（**需求树逐档成套轮**——用户 2026-09-12 10:57 当场裁定「全部啊！」：② 已有对位不得以 design 层充当——**需求层必须在本仓有档**）：
  对位表判值改判：**② 27 档中的 18 档异层者 → ①（待建）**、原 ① 7 档（已建）→ **②**；表列扩为「判 / 本仓对位档（实际档名 / 待建档名）/ 处置 · 理由」；
  **三值计数 = ① 18 · ② 16 · ③ 2**；**树终态 17 → 34 档**；① 待建档 17 档逐档列名（`WEBVIEW` 一档承载 `TUI` / `TUI-TOOL-OUTPUT` 两行）；
  **建档实施 = 下一轮**（清单经用户过目 + 评审后）——本轮不写新档正文。
- 2026-09-12（**需求树逐档成套轮 · 建档实施**——2026-09-12 10:57 用户裁定「全部啊！」的实施面；分轮推进）：
  本批建档 11 档——`ASYNC-RESULT-CONTAINER` · `DESIGN-TOKEN-SETTLEMENT` · `ESCALATE` · `MCP` · `SUBAGENT-OBSERVE-SEND` · `WEBVIEW`（B13 建档实施 B 轮）
  + `PORTABILITY` · `VSC-PROMPTS`〔异名——对位对端 `PROMPT-SYSTEM`〕· `RELEASE` · `TOOLS` · `TURN-CAP-CONTINUE`（B13 建档实施 C 轮）；
  对位表 12 行判 ① → ② + 处置列「已建」；**三值计数 = ① 6 · ② 28 · ③ 2**；**树终态 34 档（现态 = 已建 28 · 待建 6）**；板块表 +11 行；① 待建档 6 档。
- 2026-09-12（**需求树逐档成套轮 · 建档实施 A 轮**——实施面收齐）：
  本批建档 6 档——`ADVISOR-CONVERGENCE` · `CHECKPOINT` · `CONSULTATION` · `CONTEXT-COMPACTION` · `MEMORY` · `SESSION`（B13 建档实施 A 轮）；
  对位表 6 行判 ① → ② + 处置列「已建」；**三值计数 = ① 0 · ② 34 · ③ 2**；**树终态 34 档 = 34 已建 + 0 待建**；板块表 +6 行（28 → 34）；① 待建档 0 档。
