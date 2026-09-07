# VSC 端文档格式债清理——执行设计（DOC-REWRITE-VSC）

> 板块：结构债（VSC 端文档批——CLI `DOC-REWRITE.md` §6 V1-V5 的 VSC 执行面，独立代码树 `thincoder-vscode`）。状态：**设计（待评审）**——2026-09-08 用户裁定：VSC 端文档批按 CLI 同款路径——一份执行设计评审签发 token → 一次并行 spawn 全批 eng-coder（不哩哩啦啦）。
> 前置：CLI `docs/design/DOC-REWRITE.md`（判据/保真规则/AC——权威引用源）+ explore 实测扫描（2026-09-08，VSC docs 全景）+ 用户归档裁定。

## 1. 问题与目标

VSC 端 `thincoder-vscode/docs/` 有 ~30 份设计文档坏格式——与 CLI 端同病：markdown 换行丢失、整节/表/规则压单行、标题被吞正文；其中 `ARCHITECTURE.md` 152KB、`README.md`/`RELEASE.md`/`TURN-CAP-CONTINUE.md`/`PROJECT-SWITCHER.md` 为**整文件单物理行**（灾难级）。领导审核要求人类可读。

目标：把坏格式文档重写为**人类可读的当前态设计文档**——保留全部活机制 + 逐字契约，折叠历史流水账，格式正常化为多行 markdown。判据/保真规则/验收**同 CLI `DOC-REWRITE.md`**（§3 判据 / §4 逐字保真 / §8 AC1-AC5——VSC 版引用之，不复制正文）。

## 2. 处置分类（用户裁定 2026-09-08）

- **归档 `_archive/`**（用户裁定①同意）：Settings 历史 6 件 + COVERAGE-GAPS/SLEEP-REMOVAL 对（CLI 端同源已归档，对齐）：
  `SETTINGS-PANEL.md`/`SETTINGS-PANEL-2.md`/`SETTINGS-PANEL-PROXY-ROW.md`/`SETTINGS-REORG.md`/`SETTINGS-SUBMODEL-SHELL.md`/`MODEL-PICKER-UNIFY.md` + `COVERAGE-GAPS-{REQUIREMENTS,TUNING}.md` + `SLEEP-REMOVAL-{REQUIREMENTS,TUNING}.md` = **10 文件**。
- **归档 `_archive/`**（用户裁定①同意 + 评审 #1 补 webview-input-lag）：Settings 历史 6 件 + COVERAGE-GAPS/SLEEP-REMOVAL 对（CLI 同源已归档对齐）+ `webview-input-lag.md`（纯历史修复记录，已实施）：
  `SETTINGS-PANEL.md`/`SETTINGS-PANEL-2.md`/`SETTINGS-PANEL-PROXY-ROW.md`/`SETTINGS-REORG.md`/`SETTINGS-SUBMODEL-SHELL.md`/`MODEL-PICKER-UNIFY.md` + `COVERAGE-GAPS-{REQUIREMENTS,TUNING}.md` + `SLEEP-REMOVAL-{REQUIREMENTS,TUNING}.md` + `webview-input-lag.md` = **11 文件**。
- **保留 + 重写为可读**（用户裁定②）：`CONSULTATION.md`/`ESCALATE.md`（镜像 CLI——作为已完成专题记录保留重写，不归档；现行机制在 ARCHITECTURE）——**含漂移更新**（从头注 as-of 快照改为现行 ARCHITECTURE 机制状态）。
- **保留 + 重写为可读**：所有当前生效文档（README 地图 / ARCHITECTURE / RELEASE / REQUIREMENTS / PHILOSOPHY / PROJECT-SWITCHER / TURN-CAP / SETTINGS / RESPONSES-TRANSPORT / 专题对 AGENT-PARAMS/ENG-TOKEN-BINDING/SEND-STALL-DISTILL/TOOL-OUTPUT-LIMITS / COMPETITIVE_ANALYSIS / docs/TODO.md）。

## 3. 前置元动作（先于重写批——架构师执行）

1. **移植判据脚本** `scripts/check-doc-width.mjs` 从 CLI 仓复制进 VSC 仓（含 `_archive/` 豁免逻辑）——VSC 现无此脚本，验收依赖它。
2. **建立 `docs/design/_archive/`** 目录 + 登记豁免（CLI 同款）。
3. 归档 10 件物理移入 `_archive/`（git mv）+ VSC README 地图登记归档路径。

## 4. 重写批次与文件域（eng-coder 分派依据——一次全 spawn，调度器自排队 ≤4 并发）

探索实测校验后分组（每 eng-coder 1-3 文件，files 绝对路径 + 独立文件域不冲突；ARCHITECTURE 两 eng-coder 见 §5——非并行同文件，是两阶段依赖序列）。**VSC 端无 CLI 的共享 scripts/check-doc-width——重写后用移植脚本自验**。

| 批 | 文件 | 形态 | eng-coder 数 | 备注 |
|---|---|---|---|---|
| V1 | `docs/design/README.md` | 整文件单行 | 1 | 文档地图自身可读性 |
| V1a | `docs/design/ARCHITECTURE.md` | 152KB 灾难级 | 2（分主题） | 见 §5 特殊拆法 |
| V1b | `docs/design/RELEASE.md` + `docs/design/REQUIREMENTS.md` | 整单行 + 表单行 | 1 | 含逐字契约（CalVer/publish 文案） |
| V2 | `docs/design/PHILOSOPHY.md` + `docs/design/PROJECT-SWITCHER.md` + `docs/design/TURN-CAP-CONTINUE.md` | 巨型单行 | 1 | TURN-CAP 含漂移（explore-30 已废） |
| V2a | `docs/design/SETTINGS.md` + `docs/design/RESPONSES-TRANSPORT.md` | 区块单行 | 1 | SETTINGS 现行权威源 |
| V3 | 专题对保留重写 4 对：AGENT-PARAMS / ENG-TOKEN-BINDING / SEND-STALL-DISTILL / TOOL-OUTPUT-LIMITS（REQ+TUN） | 单行/表 | 2（每 2 对 1 只） | 逐字契约（timeoutMs 校验文案等） |
| V4 | `docs/design/CONSULTATION.md` + `docs/design/ESCALATE.md` | 行1 巨型 | 1 | 漂移更新（现行机制在 ARCHITECTURE） |
| V4a | `docs/COMPETITIVE_ANALYSIS.md` | 表单行 | 1 | 活增量文档 |
| V5 | `docs/TODO.md` | 行1 巨型 | 1 | 活 backlog（同 CLI TODO 整理法） |

**归档动作**（§3 前置，非 eng-coder 重写）——架构师 git mv 10 件 + 脚本移植 + README 登记。

## 5. ARCHITECTURE.md 特殊拆法（152KB 最重——不可整文件一次重写；两阶段，非并行同文件）

1. **先派 explore 出分主题大纲**（已产出——分主题 A-F 六块 + 块0 demux；含 supersede 末端锚句清单 + 漂移清单 + 历史段标注）。
2. **块0 demux（单物理行 → 多行，字节级内容不变，仅插换行）**——无此步任何按主题读都不可行。由 eng-coder 执行（需写能力）。
3. demux 后**块 A-F（或 A-E + F1/F2）由各 eng-coder 处理，各写独立 draft 文件（不直接写 ARCHITECTURE.md）**，每 eng-coder 一个 draft，块边界清晰无重叠。
4. **装配步骤**：draft 齐后由单一步骤合并成最终 ARCHITECTURE.md（或架构师指定一个 eng-coder 装配）。
5. 单一权威锚纪律 + 漂移修正（module 计数/PROVIDER_PRESETS 16→20/路径安全已废/HMAC 删除）以代码现状为准。

## 6. 逐字契约保真（引用 CLI DOC-REWRITE §4——同规则）

逐字契约句/防博弈措辞/隐藏活约束须整句照抄（错一词即错机制——测试/锚/模板一致性）；supersede 链从末端重建（check 已删不写回 / byte-identical 已取消不承诺 / token 无 HMAC）；行号去陈旧化；开放未决项不得折叠。

## 7. 执行模型

1. 本执行设计经 **advisor 一次 design 评审**签发一个 token（覆盖整批 VSC 重写）。
2. ARCHITECTURE 的 explore 大纲先派（§5），其余批按 explore 已扫结论直接派。
3. **用户批准后一次并行 spawn 全批 eng-coder**（各 files 独立不冲突），调度器自排队。
4. 每 eng-coder 任务书引用：本执行设计 + CLI DOC-REWRITE §3/§4/§8（判据保真）+ 对应 explore 扫描要点。
5. 交付审计：eng-coder 内部 explore 审计 + advisor 评审（同 CLI 协议）。

## 8. 验收

AC1 = VSC 全部待重写文档无 >300 字符单行（移植的 check-doc-width.mjs 扫）；AC2 = markdown 结构正确；AC3 = 逐字契约句 compare 未改动（compare 源 = 原文档 + explore 大纲标记句；mismatch 以现行语义为准并在交付报告声明）；AC4 = 历史折叠为变更记录；AC5 = 归档清单完整（**11 件**全入 `_archive/` + README 登记）。

## 变更记录

- 2026-09-08：立项。基于 CLI DOC-REWRITE.md §6 V1-V5 + VSC docs explore 实测扫描写本执行设计。用户裁定：归档 + CONSULTATION/ESCALATE 保留重写 + 一次全 spawn 执行模型。
- 2026-09-08 评审：签发 token。采纳：①CLI DOC-REWRITE §6 标注 supersede（已更新）；②webview-input-lag 补入归档（11 件）；③ARCHITECTURE 两阶段 + 块0 demux + 各 eng-coder 独立 draft + 装配步骤（§5 重写）；④≤4 并发 cap 自排队注。
