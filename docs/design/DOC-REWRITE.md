# 文档格式债清理——批 A 执行设计（DOC-REWRITE）

> 板块：结构债（`STRUCTURE-DEBT.md` §7 批 A 的执行设计）。状态：**设计（待评审）**——2026-09-07 用户裁定路径 1：一份执行设计签发 token，覆盖整批文档重写，并行 eng-coder 执行各文件。
> 前置：`STRUCTURE-DEBT.md`（top-8 + 批 A 计划）+ 多份 explore 大纲（AGENT-LOOP/METHODOLOGY/ARCHITECTURE/MCP/MEMORY/PROVIDER/CHECKPOINT/CONTEXT-COMPACTION）。

## 1. 问题与目标

双端 ~70 设计文档为**坏格式**（markdown 换行丢失，整节/表/规则压单行，标题被吞正文），且多为**逐批变更档案**（2026-08~09 每日追加的需求/评审/实现/核销流水账，物理乱序 + 层层 supersede）。领导审核要求**人类可读**。

目标：把每份坏格式文档重写为**人类可读的当前态设计文档**——保留全部**活机制正文 + 逐字契约**，折叠**历史变更流水账**，格式正常化为多行 markdown。样板 = TOOLS.md（2026-09-07 已重写干净）。

## 2. 处置分类（用户裁定）

- **归档 `_archive/`**：纯历史/方向草案/参考分析/被取代（已完成 8 文件：ARCHITECTURE-v2/ROADMAP-0.9.0/COMPETITIVE-CLI-2026/KIMI-CODE-PROMPT-ANALYSIS/TTSR-ANALYSIS/ENGINEERING-WORKLOOP/CLI-LINT-REQUIREMENTS/CLI-LINT-TUNING）。
- **保留 + 重写为可读**：所有当前生效设计文档，含已完成专题的 REQUIREMENTS/TUNING 对。

## 3. 重写判据（人类可读验收）

1. **无 >300 字符单行**。
2. **markdown 结构正确**——表格/标题/列表/规则用空行 + 换行正确分隔，标题不被吞进正文；代码块/表格不误拆。
3. **活机制正文完整保留**（尤其逐字契约句——见 §4 保真规则），历史变更流水账折叠为"变更记录"一行注记。
4. **漂移更新**：文档与实现不一致处更新（模块计数/参数名/已删除机制不再声称）。
5. 按机制主题重组（不按原 § 号逐节格式化）——尤其有 supersede 链的文档（AGENT-LOOP）。

## 4. 逐字契约保真规则（最高优先——错一个词即错机制）

各 explore 大纲已标注"活机制要点（照抄级）"与"藏于历史注的活约束（易漏）"。eng-coder 重写时：
- **逐字契约句必须整句照抄**（输出文本/提示文本/判定句/常量）——不得改写措辞。例：MEMORY 输出契约（`Deleted N entries`/`0 条匹配`/截断文案）、CONTEXT D1-D12 锚句与占位（`Understood. I'll continue from these notes…`）、CHECKPOINT D7 提示文本、PROVIDER reasoningEcho 三分支。
- **防博弈措辞逐字保留**（"必须拆——硬限，无例外、无相对比较通道"类）——改写会破坏与根注入体/模板/测试锚的一致性。
- **不删"藏于历史注的活约束"**——先把它提炼进正文再删批（如 CONTEXT D4 尾公式受 §9 预算约束、CHECKPOINT D2 commit.ok 判定非输出非空、D3 毫秒比较 %ct×1000）。
- **supersede 链从末端重建**（AGENT-LOOP：subagent 消费链 §15→17→19→20→24→25 取现行态；check 已删不得写回；byte-identical 已取消不得再承诺字节一致）。
- **行号/sha 锚陈旧**：`agent.mjs:78` 型去行号化（→符号锚或删）；as-of 快照段若被后续 supersede 引用改指新聚合节。
- **开放/未决项不得当历史折叠**（AGENT-LOOP §20.10 checklist、§29 部分、各 TODO 债条目）——大纲顶部列未决/待办状态行承接。

## 5. 双端一致性

- 双端都有且需同步的文档（AGENT-LOOP/TOOLS/METHODOLOGY 等）——CLI 重写后 VSC 镜像照抄锚句（镜像锚纪律，非 byte-identical，语义锚 + 内容断言）。
- 双端文件域不重叠 → 可并行 eng-coder，各自 files 独立。

## 6. 文件域与批次划分（eng-coder 分派依据）

参考 `STRUCTURE-DEBT.md` §7 批 A 计划（CLI A1-A8 + VSC V1-V5）。每 eng-coder 处理 1-3 份文档（避免单任务过大），files 用**绝对路径**声明。

**已由架构师手工完成并签入**（勿重复）：A1 README/REQUIREMENTS/FEATURES + A2 前半 PHILOSOPHY/PROXY/METHODOLOGY/ARCHITECTURE（7 文件）。

**待 eng-coder（CLI）**——按 explore 大纲逐份重写：
1. `AGENT-LOOP.md`（314KB 最重——机制主题重组，大纲见 explore id=1；估 1000-1500 行）
2. `MCP.md`（大纲见 explore id=3；估 ~550 行）
3. `MEMORY.md`（大纲见 explore id=3；估 ~350 行）
4. `PROVIDER.md`（大纲见 explore id=3；估 ~800 行——最重机制密度）
5. `CHECKPOINT.md`（大纲见 explore id=3；估 ~400 行）
6. `CONTEXT-COMPACTION.md`（大纲见 explore id=3；估 ~600 行）
7. `ENGINEERING-MODE.md`（51KB——需 explore 大纲，未产出）
8. `SESSION.md`/`TUI.md`（56/49KB——需 explore 大纲，未产出）
9. **`ADVISOR-CONVERGENCE.md`/`MULTI-INSTANCE-COLLAB.md`**（评审 #1——深 supersede 机制件，需 explore 大纲，非"可直接重写"小件）
10. `SETTINGS-TOOL.md`/`EDIT-TOOL-EOL-{REQ,DESIGN}`/`PROMPT-DECOUPLING.md`/`VERIFY-DOCONLY.md`（工具/机制专题——可重写或并入所属板块）
11. 其余中小件（ACP-CLIENT/CONSULTATION/ESCALATE/EVALUATION/LOGGING/TESTING/TUI-INPUT-BOX/TUI-TOOL-OUTPUT/已实现专题对 REQ+TUN 等——可直接重写，无深 supersede）

注：AGENT-LOOP 大小实测 314KB（scan 曾报 537KB 为早期过时值——以实测为准）。

**待 eng-coder（VSC）**——`docs/design/` + `docs/`（按 STRUCTURE-DEBT §7 V1-V5；**2026-09-08 已被 `DOC-REWRITE-VSC.md` supersede**——归档裁定 + 批次细分 + webview-input-lag 归档见该文档，本条 V 枚举仅历史参考勿执行）：
- V1 `README.md`/`ARCHITECTURE.md`（96KB 整 1 行最极端）/`RELEASE.md`/`REQUIREMENTS.md`
- V2 `PHILOSOPHY.md`/`PROJECT-SWITCHER.md`/`TURN-CAP-CONTINUE.md`/`SETTINGS.md`
- V3 已完成专题对（AGENT-PARAMS/COVERAGE-GAPS/ENG-TOKEN-BINDING/SEND-STALL/SLEEP-REMOVAL/TOOL-OUTPUT-LIMITS）+ SETTINGS-PANEL/REORG/SUBMODEL/MODEL-PICKER-UNIFY/RESPONSES-TRANSPORT/webview-input-lag
- V4 `CONSULTATION.md`/`ESCALATE.md` + `docs/COMPETITIVE_ANALYSIS.md`
- V5 VSC `docs/TODO.md`
（V 组多为单行整文件，需 explore 大纲优先）

## 7. 执行模型

1. 本执行设计经 **advisor 一次 design 评审**签发一个 token（覆盖整批重写）。
2. 未出大纲的大件（ENGINEERING-MODE/SESSION/TUI/VSC 组）先派 explore 补大纲。
3. 并行派多个 eng-coder，各处理 1-3 份文档（files 绝对路径不冲突）。
4. 每 eng-coder 任务书引用：本执行设计 + 对应 explore 大纲（我作为架构师把大纲要点带进任务书）+ 逐字保真规则。
5. 交付审计：eng-coder 内部 explore 审计（活机制齐全/逐字契约未改/无超长行/漂移更新）+ advisor 评审。

## 8. 验收

AC1 = 双端全部待重写文档无 >300 字符单行（脚本扫）；AC2 = markdown 结构正确；AC3 = 逐字契约句经 compare 未改动——**compare 源 = 原文档 + explore 大纲标记的契约句**；compare mismatch（评审 #3）：eng-coder 交付时发现原文档契约句本身已漂移（如 byte-identical 已取消处）→ 以 explore 大纲标注的现行语义为准并在交付报告声明；交付后发现 mismatch → advisor 审计 gating（打回修正）。
AC4 = 历史折叠为变更记录注；AC5 = 归档清单完整（无遗漏应归档文件）。

## 变更记录

- 2026-09-07：立项。基于 STRUCTURE-DEBT §7 + 多份 explore 大纲写本执行设计。用户裁定路径 1（一次评审签发 token → 并行 eng-coder）。
- 2026-09-07 评审补强：#1 §6 补 ADVISOR-CONVERGENCE/MULTI-INSTANCE-COLLAB 等文件显式排程；#2 AGENT-LOOP 大小注（实测 314KB）；#3 AC3 compare 源 + mismatch 处理；#4 §6 补 VSC V1-V5 枚举。评审签发 token。
