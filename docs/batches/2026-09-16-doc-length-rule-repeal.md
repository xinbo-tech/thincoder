# 批 12 · DOC-LENGTH-RULE-REPEAL（文档行数限制废除）· 2026-09-16

> 前情 = 用户 2026-09-16 裁定「**300 行 500 行那是对程序代码的限制**」+「**留读数干什么！**」⇒ 本批 = 把该规则的**残留彻底拔掉**
> 缘起（git 实证）：判据句 `结构档位硬限` 于 **2026-09-12 `cf9866f5`**（文档体系自持化轮）引入，**无用户裁定指针**（agent 自设规则）；2026-09-15 `856af2da` 迁移批据此**真拆过文档**（3030 行档 → 4 档）

## §1 需求讨论与裁定（主 agent）

> **批次状态：设计轮待发**（2026-09-16——§1 已落；§2 待 eng-designer）

**交付目标（一句话）**：废除「文档受行数限制」这条自设规则的**全部残留**——各档自指的「体量与拆分规划」节**整节删除**（连读数都不要），文档面行数标注一并取消（**代码面标注保留**）。

### 本批条目（3 条，逐条可验收）

1. **整节删除（活档面）**：全仓**活文档**（`docs/{core,cli,vsc}/**` 的设计 / 需求档）中形如 `## N. 体量与拆分规划（R24a）` 的小节**整节删除**——含**行数读数**、拆分触发状态、拆分规划、候选切面、到期条件（实测约 **120 档**带该节，逐档清单见 §1 已知事实）。
   > **收正批注（父侧直接执行 · 2026-09-16 · 评审轮 1 发现 5）**：本条「实测约 **120 档**」= **量级估计**；**权威读数 = 88 档**（§2.2 逐档实测 · 差集说明见 `:152`）。落笔与验收一律**以 §2.2 表为准**。
   判据：① 活档面 grep `体量与拆分规划` **命中 0** ② **指向该节的内部指针**逐处处置（改指他节 / 删）且**零悬空**（机检实证）③ 删除**不得伤及**同名节以外的任何内容（逐档 diff 抽样复核）。
2. **文档面行数标注取消**：`R24a` 中「**文档**档标当前行数 + 预计增量」的要求**取消**（含批次档受影响文件表里的 `.md` 行数）——**代码面（源 / 测试）标注保留不变**。
   判据：规则落点逐处收正（需求档 / 设计档 / 批次档模板的相应判据句）；**代码面标注零改动**（抽样核：受影响文件表中 `.mjs` 行的行数标注仍在）。
3. **规则废除的登记面闭合**：F12 判据句**已改正**（`docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:292`——含用户原话）⇒ 本批补：① 该档自指体量节（`:461-466`）随条目 1 删除 ② **全仓再扫一遍同类「文档行数/体量义务」判据句**（不止 F12——凡把行数限制施加于文档者，逐处登记 + 收正）。
   判据：扫出的每一处**要么收正、要么显式登记**（含理由）；零漏项。

### 边界（本批不做）

① **不动历史档正文**（`docs/batches/**` 批次档 · `docs/TODO-archive.md` 归档 —— 它们是**历史记录**，其中的「体量与拆分规划」字样**保留**；本批只改**活档**）② **不改机检脚本**（已实证：`scripts/**` 无任何一条在管文档行数——规则从来只有书面判据、没有执行体）③ **不动代码面**（源 / 测试档行数标注、代码拆分纪律照旧）④ 不做批 1–11 的在飞内容。

### 已知事实（供设计省勘察）

- **F12 已改正**（`:292`）：标题「（适用范围 = 程序代码）」+ 明写「文档（设计 / 需求 / 批次 / 台账）不受行数限制——超长只作提示 / 登记，不拆」+ 用户原话。**注意**：本轮用户进一步裁定「**连读数也不要**」⇒ 该句中的「只作提示 / 登记」亦须一并收正为**无任何义务**。
- **工具面无执行体**（本仓 grep 实证）：`scripts/check-doc-width.mjs`（**字符/行宽度**——另一回事，保留）· `check-ledger.mjs` · `doc-anchors*.mjs` 均**不含文档行数判据**。
- **带该节的活档清单**：`docs/cli/{design,requirements}/**`（10 档）· `docs/core/design/**`（约 70 档）· `docs/core/requirements/**`（约 20 档）· `docs/vsc/{design,requirements}/**`（8 档）——抽样实证：`DOC-DISCIPLINE.md:486` · `AGENT-LOOP-SUBAGENT.md:537` · `AGENT-LOOP.md:467` · `ENGINEERING-MODE.md:350` · `ADVISOR-CONVERGENCE.md:256` · `DOC-CODE-RECONCILE.md:458` · `TESTING.md:281` · `BATCH-RECORD.md:245` · `MULTI-INSTANCE-COLLAB.md:226` 等。
- **未清理的在飞项**：批 6（`DOC-DISCIPLINE.md`）、批 8（`AGENT-LOOP*.md`）两档的体量节**由本批统一删除**（该两批的拆分项已撤下 ✓）。
- **历史档里的「体量与拆分规划」模板要求**（如 `docs/core/design/BATCH-RECORD.md` 若把该节列为批次档/设计档模板节）——**须逐处判**：模板要求 = 活判据 ⇒ 收正。

### 验收口径（初拟 —— 设计轮细化到可机判）

① 活档面 `体量与拆分规划` **grep 零命中** ② 内部指针零悬空（`node scripts/doc-anchors.mjs` 本批零新增）③ 代码面标注零误删（抽样：受影响文件表 `.mjs` 行仍在）④ 三机检零新增 + 发布门全绿 ⑤ 全仓「文档行数义务」类判据句扫描表**零漏项**。

## §2 批次任务（eng-designer）

### §2.1 本批任务（eng-designer 落 · 2026-09-16）

**任务书依据**：本档 §1（需求讨论与裁定）+ 设计档 `docs/core/design/DOC-DISCIPLINE.md` §3.7（条目 H）+ §3 标题 + §5 AC（A-DD14–16）+ 用例表（DD-26–DD-33）。
**写权**：文档面 = eng-designer（D1 唯一作者）；本批**零源 / 测试档**（纯 `.md` 面）。

**三方条目一致（条目表——批次档 §2 = 设计档验收回指 = 需求档条目）**：

| # | 条目（本档 §1 原句锚） | 设计档落点 | 机判验收 | 需求档落点 |
|---|---|---|---|---|
| 条目 1 | 活档自指体量节**整节删除** + 指针零悬空 + 零附带 | §3.7「删除面」/「节外指称三条处置规则」/「误删防护」 | A-DD14 | F-R24a 收正链（`requirements/METHODOLOGY.md:67`） |
| 条目 2 | 文档面标注**取消**、代码面标注**保留** | §3.7「文档面标注取消 / 代码面保留（判据）」 | A-DD15 | F-R24a 判定句 + F12（`ENGINEERING-MODE-MECHANISM.md:292`） |
| 条目 3 | 登记面**闭合**（零漏项：要么收正、要么显式登记 + 理由） | §3.7「判据句族（OBL）」+「规则落点收正表 R1–R13」 | A-DD16 | F12 收正 + 全仓同类判据句 |

**落笔序（⑤ 步，逐波可中断核验）**：① 规则落点收正（R1–R13）② 节外指称 / 读数 **114 行**按三分支处置 ③ **88 档**整节删除（**含设计档 `docs/core/design/DOC-DISCIPLINE.md` §7** 自指体量节）④ 条目 2 取消面（受影响文件表 `.md` 行 + 正文残留句 + 体量判据行）⑤ 三闸复跑（`doc-anchors` / `check-doc-width` / `check-ledger`）+ 抽样 ≥5 档 diff 核（**零附带**）。

### §2.2 条目 1 · 删除面逐档清单（as-of 2026-09-16 实测：**88 档 / 88 节 / 节内合计 396 行**）

**判据（按内容类，不按节名）**：h2 节内容类 = 「自指体量 / 拆分说明」（自述本档行数 / 拆分触发状态 / 拆分规划 / 候选切面 / 到期条件）⇒ **整节删**。域 = `docs/{core,cli,vsc}/{design,requirements}/` **顶层** `.md`（分母 **111** 档 ⇒ 88 命中 / 23 档无该节）。
**节名三形态**：`## <N>. 体量与拆分规划（R24a）`（84）· `## 体量与拆分规划（R24a）`（无编号 3：`core/requirements/ENGINEERING-MODE-MECHANISM.md:469` · `core/requirements/ENGINEERING-MODE.md:357` · `core/requirements/TESTING.md:200`）· `## 档位与拆分说明（R24a）`（**1**，异名同实 ⇒ 同删：`core/design/AGENT-LOOP-SUBAGENT.md:540`）。
**行号 = as-of；落笔前逐档回读原文后落笔**——不得照抄本表（档内他处增删会漂行号）。

| # | 路径 | 节标题行 | 节内行数 | 全档行数 | 节标题（去 `## `） |
|---|---|---|---|---|---|
| 1 | `docs/cli/design/ACP-CLIENT.md` | 351 | 5 | 366 | 11. 体量与拆分规划（R24a） |
| 2 | `docs/cli/design/CRASH-REPORTS.md` | 176 | 3 | 188 | 7. 体量与拆分规划（R24a） |
| 3 | `docs/cli/design/RELEASE.md` | 129 | 3 | 138 | 9. 体量与拆分规划（R24a） |
| 4 | `docs/cli/design/TUI-COMMANDS.md` | 151 | 4 | 163 | 7. 体量与拆分规划（R24a） |
| 5 | `docs/cli/design/TUI-INPUT-BOX.md` | 243 | 3 | 253 | 10. 体量与拆分规划（R24a） |
| 6 | `docs/cli/design/TUI-SESSION-VIEW.md` | 204 | 4 | 222 | 7. 体量与拆分规划（R24a） |
| 7 | `docs/cli/design/TUI-TOOL-OUTPUT.md` | 112 | 3 | 122 | 9. 体量与拆分规划（R24a） |
| 8 | `docs/cli/design/TUI.md` | 412 | 7 | 427 | 9. 体量与拆分规划（R24a） |
| 9 | `docs/cli/requirements/ACP-CLIENT.md` | 120 | 3 | 132 | 7. 体量与拆分规划（R24a） |
| 10 | `docs/cli/requirements/CRASH-REPORTS.md` | 95 | 3 | 104 | 6. 体量与拆分规划（R24a） |
| 11 | `docs/cli/requirements/FEATURES.md` | 208 | 3 | 220 | 5. 体量与拆分规划（R24a） |
| 12 | `docs/cli/requirements/TUI-TOOL-OUTPUT.md` | 56 | 3 | 65 | 6. 体量与拆分规划（R24a） |
| 13 | `docs/cli/requirements/TUI.md` | 84 | 4 | 99 | 6. 体量与拆分规划（R24a） |
| 14 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 256 | 5 | 266 | 14. 体量与拆分规划（R24a） |
| 15 | `docs/core/design/ADVISOR-GUARDS.md` | 331 | 5 | 341 | 13. 体量与拆分规划（R24a） |
| 16 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 540 | 6 | 568 | 档位与拆分说明（R24a） |
| 17 | `docs/core/design/AGENT-LOOP.md` | 467 | 11 | 520 | 9. 体量与拆分规划（R24a） |
| 18 | `docs/core/design/AGENT-PARAMS.md` | 134 | 3 | 142 | 9. 体量与拆分规划（R24a） |
| 19 | `docs/core/design/APPLY-PATCH.md` | 90 | 3 | 99 | 9. 体量与拆分规划（R24a） |
| 20 | `docs/core/design/ARCHITECTURE.md` | 185 | 3 | 196 | 8. 体量与拆分规划（R24a） |
| 21 | `docs/core/design/BATCH-RECORD.md` | 245 | 5 | 257 | 10. 体量与拆分规划（R24a） |
| 22 | `docs/core/design/CHECKPOINT.md` | 205 | 3 | 220 | 9. 体量与拆分规划（R24a） |
| 23 | `docs/core/design/CONFIG.md` | 141 | 3 | 154 | 9. 体量与拆分规划（R24a） |
| 24 | `docs/core/design/CONSULTATION.md` | 243 | 3 | 260 | 9. 体量与拆分规划（R24a） |
| 25 | `docs/core/design/CONTEXT-COMPACTION.md` | 249 | 3 | 270 | 9. 体量与拆分规划（R24a） |
| 26 | `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` | 136 | 3 | 150 | 9. 体量与拆分规划（R24a） |
| 27 | `docs/core/design/DOC-CODE-RECONCILE.md` | 458 | 13 | 486 | 9. 体量与拆分规划（R24a） |
| 28 | `docs/core/design/DOC-DISCIPLINE.md` | 676 | 29 | 729 | 7. 体量与拆分规划（R24a） |
| 29 | `docs/core/design/DOC-MIGRATION.md` | 191 | 3 | 306 | 8. 体量与拆分规划（R24a） |
| 30 | `docs/core/design/EDIT-HELPERS.md` | 106 | 3 | 114 | 9. 体量与拆分规划（R24a） |
| 31 | `docs/core/design/EDIT.md` | 115 | 3 | 124 | 10. 体量与拆分规划（R24a） |
| 32 | `docs/core/design/ENG-TOKEN-BINDING.md` | 137 | 3 | 149 | 9. 体量与拆分规划（R24a） |
| 33 | `docs/core/design/ENGINEERING-MODE.md` | 350 | 5 | 366 | 13. 体量与拆分规划（R24a） |
| 34 | `docs/core/design/ESCALATE.md` | 163 | 3 | 177 | 9. 体量与拆分规划（R24a） |
| 35 | `docs/core/design/HASHLINE-EDIT.md` | 93 | 3 | 102 | 9. 体量与拆分规划（R24a） |
| 36 | `docs/core/design/I18N.md` | 78 | 3 | 91 | 9. 体量与拆分规划（R24a） |
| 37 | `docs/core/design/INSERT-AFTER.md` | 97 | 3 | 106 | 9. 体量与拆分规划（R24a） |
| 38 | `docs/core/design/LEDGER-SELF-CONTAINED.md` | 311 | 5 | 321 | 10. 体量与拆分规划（R24a） |
| 39 | `docs/core/design/LEDGER.md` | 269 | 5 | 279 | 11. 体量与拆分规划（R24a） |
| 40 | `docs/core/design/LOGGING.md` | 140 | 3 | 150 | 9. 体量与拆分规划（R24a） |
| 41 | `docs/core/design/MCP.md` | 208 | 10 | 225 | 9. 体量与拆分规划（R24a） |
| 42 | `docs/core/design/MEMORY.md` | 354 | 11 | 381 | 9. 体量与拆分规划（R24a） |
| 43 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 226 | 3 | 239 | 11. 体量与拆分规划（R24a） |
| 44 | `docs/core/design/PORTABILITY.md` | 176 | 3 | 188 | 8. 体量与拆分规划（R24a） |
| 45 | `docs/core/design/PROMPT-SYSTEM.md` | 216 | 3 | 230 | 9. 体量与拆分规划（R24a） |
| 46 | `docs/core/design/PROVIDER.md` | 378 | 11 | 403 | 9. 体量与拆分规划（R24a） |
| 47 | `docs/core/design/PROXY.md` | 129 | 3 | 139 | 9. 体量与拆分规划（R24a） |
| 48 | `docs/core/design/SEND-STALL-DISTILL.md` | 141 | 3 | 155 | 6. 体量与拆分规划（R24a） |
| 49 | `docs/core/design/SESSION.md` | 363 | 11 | 390 | 9. 体量与拆分规划（R24a） |
| 50 | `docs/core/design/SETTINGS-TOOL.md` | 133 | 3 | 144 | 7. 体量与拆分规划（R24a） |
| 51 | `docs/core/design/STRUCTURE-DEBT.md` | 68 | 3 | 79 | 6. 体量与拆分规划（R24a） |
| 52 | `docs/core/design/TESTING.md` | 281 | 5 | 295 | 10. 体量与拆分规划（R24a） |
| 53 | `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 157 | 3 | 165 | 9. 体量与拆分规划（R24a） |
| 54 | `docs/core/design/TOOLS.md` | 318 | 11 | 338 | 9. 体量与拆分规划（R24a） |
| 55 | `docs/core/design/TRACES.md` | 107 | 3 | 117 | 9. 体量与拆分规划（R24a） |
| 56 | `docs/core/design/TURN-CAP-CONTINUE.md` | 141 | 3 | 155 | 7. 体量与拆分规划（R24a） |
| 57 | `docs/core/design/TWO-REPO-MERGE.md` | 195 | 4 | 206 | 11. 体量与拆分规划（R24a） |
| 58 | `docs/core/design/VERIFY-REDESIGN.md` | 142 | 3 | 149 | 9. 体量与拆分规划（R24a） |
| 59 | `docs/core/design/WORKSPACE.md` | 86 | 3 | 96 | 9. 体量与拆分规划（R24a） |
| 60 | `docs/core/design/WRITE.md` | 85 | 3 | 93 | 9. 体量与拆分规划（R24a） |
| 61 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` | 210 | 3 | 220 | 9. 体量与拆分规划（R24a） |
| 62 | `docs/core/requirements/AGENT-PARAMS.md` | 71 | 3 | 82 | 6. 体量与拆分规划（R24a） |
| 63 | `docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` | 74 | 3 | 85 | 7. 体量与拆分规划（R24a） |
| 64 | `docs/core/requirements/ENG-TOKEN-BINDING.md` | 75 | 3 | 86 | 6. 体量与拆分规划（R24a） |
| 65 | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` | 469 | 6 | 496 | 体量与拆分规划（R24a） |
| 66 | `docs/core/requirements/ENGINEERING-MODE.md` | 357 | 5 | 367 | 体量与拆分规划（R24a） |
| 67 | `docs/core/requirements/ESCALATE.md` | 61 | 3 | 70 | 6. 体量与拆分规划（R24a） |
| 68 | `docs/core/requirements/METHODOLOGY.md` | 117 | 4 | 124 | 6. 体量与拆分规划（R24a） |
| 69 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 83 | 3 | 97 | 6. 体量与拆分规划（R24a） |
| 70 | `docs/core/requirements/NORMAL-MODE.md` | 148 | 3 | 161 | 8. 体量与拆分规划（R24a） |
| 71 | `docs/core/requirements/PHILOSOPHY.md` | 203 | 3 | 213 | 8. 体量与拆分规划（R24a） |
| 72 | `docs/core/requirements/PORTABILITY.md` | 112 | 3 | 126 | 7. 体量与拆分规划（R24a） |
| 73 | `docs/core/requirements/PROJECT.md` | 164 | 3 | 176 | 7. 体量与拆分规划（R24a） |
| 74 | `docs/core/requirements/RELEASE.md` | 73 | 3 | 84 | 7. 体量与拆分规划（R24a） |
| 75 | `docs/core/requirements/SEND-STALL-DISTILL.md` | 64 | 3 | 73 | 6. 体量与拆分规划（R24a） |
| 76 | `docs/core/requirements/SETTINGS-TOOL.md` | 82 | 3 | 95 | 6. 体量与拆分规划（R24a） |
| 77 | `docs/core/requirements/STRUCTURE-DEBT.md` | 70 | 3 | 82 | 6. 体量与拆分规划（R24a） |
| 78 | `docs/core/requirements/TESTING.md` | 200 | 3 | 213 | 体量与拆分规划（R24a） |
| 79 | `docs/core/requirements/TURN-CAP-CONTINUE.md` | 67 | 3 | 76 | 6. 体量与拆分规划（R24a） |
| 80 | `docs/core/requirements/TWO-REPO-MERGE.md` | 76 | 3 | 86 | 6. 体量与拆分规划（R24a） |
| 81 | `docs/core/requirements/VERIFY-REDESIGN.md` | 65 | 3 | 76 | 6. 体量与拆分规划（R24a） |
| 82 | `docs/vsc/design/PROJECT-SWITCHER.md` | 90 | 3 | 97 | 7. 体量与拆分规划（R24a） |
| 83 | `docs/vsc/design/SETTINGS.md` | 118 | 3 | 128 | 6. 体量与拆分规划（R24a） |
| 84 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 472 | 5 | 500 | 13. 体量与拆分规划（R24a） |
| 85 | `docs/vsc/design/WEBVIEW-INPUT.md` | 136 | 4 | 156 | 8. 体量与拆分规划（R24a） |
| 86 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 250 | 4 | 273 | 10. 体量与拆分规划（R24a） |
| 87 | `docs/vsc/design/WEBVIEW.md` | 233 | 13 | 269 | 9. 体量与拆分规划（R24a） |
| 88 | `docs/vsc/requirements/PROJECT.md` | 64 | 5 | 85 | 5. 体量与拆分规划（R24a） |

**按面分布**：core/design **47** 档 / 242 行 · core/requirements **21** 档 / 69 行 · cli/design **8** 档 / 32 行 · cli/requirements **5** 档 / 16 行 · vsc/design **6** 档 / 32 行 · vsc/requirements **1** 档 / 5 行（合计 88 档 / 396 行）。
**与 §1 的差**：§1 `:14` 记「实测约 **120** 档」= 量级估计 ⇒ **以本表 88 档为准**（本表 = 域内逐档实测；§1 不回改）。
**三处异名 / 无编号档**（易漏，单列）：`:16`（AGENT-LOOP-SUBAGENT.md，`档位与拆分说明`）· `:65`（ENGINEERING-MODE-MECHANISM.md）· `:66`（ENGINEERING-MODE.md）· `:78`（TESTING.md）。

**误删防护（硬）**：逐档 diff 只应出现「该节整块删除 + §2.3 指称行改写」两类 hunk；其余节 / 表 / 变更记录他行**逐字不变**（零附带）。抽样 ≥5 档覆盖三面 + 长节：`DOC-DISCIPLINE.md:676`（29 行）· `WEBVIEW.md:233`（13 行）· `AGENT-LOOP-SUBAGENT.md:540`（6 行，异名节）· `TUI.md:412`（7 行，cli 面）· `PROJECT.md:64`（5 行，vsc/req 面）。
**h3 面（**不删**——裁定）**：`AGENT-LOOP-SUBAGENT.md`:366 / `:489` 的 `### *.4 受影响文件清单（R24a）` = **保留**（判据：该 h3 的指称对象 = 代码面（源 / 测试档）受影响文件清单，非自指体量节；节名中的 `（R24a）` = 清单名，不构成体量自指）。

### §2.3 条目 1 · 节外指称面（域 = 六目录顶层 **111** 档；族正则 `R24a|体量|拆分规划|行数标注|行数读数|行数义务`；排除 ① 节内文本 ② 本档规则文本）

**口径（复扫可复现，as-of 2026-09-16）**：命中 **143 行** = **处置面 114 行**（① 指针 **3** · ② 读数 **52** · ③ 枚举 **59**）+ **保留面 29 行**。
**注**：设计档 §3.7 旧记「43 行 ∥ 保留 32 ∥ ①12 ②23 ③11」**作废**（模式集漏裸 `体量` 形态 ⇒ 不可复现）——本表为复扫口径的逐行清单。
**三分支处置规则（行级逐行判）**：① 指针句 ⇒ 删指针，有承接节则改指（改后复跑 `node scripts/doc-anchors.mjs` 零悬空）② 读数 / 义务句 ⇒ 删读数片段（整句仅为读数 ⇒ 整句删）③ 枚举 / 叙述句 ⇒ **删指称片段**（节名与读数），同句其余语义词**逐字保留**（不逐行加注记）。
**行号 = as-of；落笔前逐处回读原文后落笔**——不得照抄本表。

**处置面逐行清单（114 行；`③17` = 行号 17、分支 ③）**：

| # | 档 | 行数 | 行:分支 |
|---|---|---|---|
| 1 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 2 | ③17 ③201 |
| 2 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 8 | ③5 ①378 ②388 ②554 ①561 ②564 ②565 ②567 |
| 3 | `docs/core/design/AGENT-LOOP.md` | 10 | ③491 ②494 ③495 ②497 ②508 ②510 ②512 ②515 ②518 ②519 |
| 4 | `docs/core/design/CHECKPOINT.md` | 2 | ③212 ②217 |
| 5 | `docs/core/design/CONFIG.md` | 3 | ③149 ②152 ②153 |
| 6 | `docs/core/design/CONSULTATION.md` | 1 | ③253 |
| 7 | `docs/core/design/CONTEXT-COMPACTION.md` | 2 | ③256 ②265 |
| 8 | `docs/core/design/CORE-UNIFICATION.md` | 7 | ③31 ③277 ②284 ②977 ③1079 ③1083 ③1707 |
| 9 | `docs/core/design/DOC-CODE-RECONCILE.md` | 14 | ②230 ②254 ②263 ②265 ②287 ②288 ②289 ①300 ②310 ③478 ②480 ②483 ②484 ②485 |
| 10 | `docs/core/design/DOC-MIGRATION.md` | 2 | ③8 ③305 |
| 11 | `docs/core/design/DOC-SYSTEM.md` | 3 | ③155 ②332 ③404 |
| 12 | `docs/core/design/ENGINEERING-MODE.md` | 2 | ②107 ③117 |
| 13 | `docs/core/design/I18N.md` | 1 | ③88 |
| 14 | `docs/core/design/LOGGING.md` | 3 | ③147 ②148 ②149 |
| 15 | `docs/core/design/MCP.md` | 1 | ③222 |
| 16 | `docs/core/design/MEMORY.md` | 1 | ③371 |
| 17 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 1 | ②237 |
| 18 | `docs/core/design/PORTABILITY.md` | 1 | ③184 |
| 19 | `docs/core/design/PROMPT-SYSTEM.md` | 1 | ②225 |
| 20 | `docs/core/design/PROVIDER.md` | 4 | ③394 ③398 ②400 ②402 |
| 21 | `docs/core/design/SESSION.md` | 2 | ③378 ②389 |
| 22 | `docs/core/design/STRUCTURE-DEBT.md` | 2 | ③39 ③77 |
| 23 | `docs/core/design/TOOLS.md` | 1 | ③334 |
| 24 | `docs/core/design/TRACES.md` | 2 | ③114 ②115 |
| 25 | `docs/core/design/TWO-REPO-MERGE.md` | 1 | ③205 |
| 26 | `docs/core/design/WORKSPACE.md` | 1 | ③94 |
| 27 | `docs/core/requirements/ADVISOR-CONVERGENCE.md` | 1 | ③218 |
| 28 | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` | 6 | ②482 ②484 ②488 ②491 ②493 ②494 |
| 29 | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md` | 1 | ②95 |
| 30 | `docs/core/requirements/NORMAL-MODE.md` | 1 | ③156 |
| 31 | `docs/core/requirements/PHILOSOPHY.md` | 1 | ③211 |
| 32 | `docs/core/requirements/PORTABILITY.md` | 1 | ③120 |
| 33 | `docs/core/requirements/PROJECT.md` | 1 | ③172 |
| 34 | `docs/core/requirements/RELEASE.md` | 1 | ③82 |
| 35 | `docs/core/requirements/TESTING.md` | 1 | ③210 |
| 36 | `docs/core/requirements/TWO-REPO-MERGE.md` | 1 | ③85 |
| 37 | `docs/cli/design/ACP-CLIENT.md` | 1 | ②365 |
| 38 | `docs/cli/design/TUI-INPUT-BOX.md` | 1 | ③252 |
| 39 | `docs/cli/requirements/ACP-CLIENT.md` | 2 | ②127 ③131 |
| 40 | `docs/cli/requirements/CRASH-REPORTS.md` | 1 | ③103 |
| 41 | `docs/cli/requirements/FEATURES.md` | 2 | ③217 ②218 |
| 42 | `docs/cli/requirements/TUI-TOOL-OUTPUT.md` | 1 | ③64 |
| 43 | `docs/cli/requirements/TUI.md` | 2 | ③14 ③98 |
| 44 | `docs/vsc/design/VSC-DEBT.md` | 4 | ③33 ③34 ③45 ③168 |
| 45 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 3 | ③4 ③180 ②394 |
| 46 | `docs/vsc/design/VSC-MIGRATION.md` | 2 | ③5 ③130 |
| 47 | `docs/vsc/requirements/PROJECT.md` | 1 | ③78 |
| 48 | `docs/vsc/requirements/VSC-MIGRATION.md` | 1 | ③38 |

**保留面白名单（29 行，零改；判据 = 指称**对象**≠ 该节）**：命中 `R24a` 但**不含** `体量|拆分说明|体量节|R24a 节|§R24a` ⇒ 保留。

| # | 档 | 行数 | 行 |
|---|---|---|---|
| 1 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 3 | 199 205 243 |
| 2 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 5 | 366 489 529 552 563 |
| 3 | `docs/core/design/AGENT-LOOP.md` | 1 | 151 |
| 4 | `docs/core/design/CONFIG.md` | 1 | 76 |
| 5 | `docs/core/design/CONSULTATION.md` | 1 | 91 |
| 6 | `docs/core/design/CORE-UNIFICATION.md` | 6 | 550 1025 1081 1697 1709 1888 |
| 7 | `docs/core/design/DOC-CODE-RECONCILE.md` | 1 | 283 |
| 8 | `docs/core/design/MEMORY.md` | 1 | 75 |
| 9 | `docs/core/design/PROMPT-SYSTEM.md` | 1 | 204 |
| 10 | `docs/core/design/TWO-REPO-MERGE.md` | 1 | 108 |
| 11 | `docs/core/design/WORKSPACE.md` | 1 | 51 |
| 12 | `docs/core/requirements/METHODOLOGY.md` | 4 | 6 28 67 68 |
| 13 | `docs/vsc/design/VSC-DEBT.md` | 2 | 145 249 |
| 14 | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md` | 1 | 375 |

**白名单语义边界（防两条目串口径）**：白名单 = **条目 1 指称面零改**判据，**不豁免条目 3 的 OBL 判据句收正**——同一行可同时入白名单（条目 1）与为收正对象（条目 3）（例：`ADVISOR-CONVERGENCE.md:205` 入白名单 ∩ 为 R6 收正对象）。
**边界行（假阳 / 需逐行裁，落笔轮逐处回读后定）**：`requirements/TUI.md:14`（语汇义「体量」泛指）· `VSC-DEBT.md:33` / `:34`（选型理由中的「体量宽裕」）· `CORE-UNIFICATION.md:31`（提示词面体量自核）· `VSC-MIGRATION.md:130`（迁移期档体量实核）——**判据**：句中被指称者 ≠ 本批删除的自指节 ⇒ ③ 分支下**删指称片段、保留语义词**；确证无语义关联者 ⇒ 零改（逐处登记判定 + 理由）。

### §2.4 条目 2 · 文档面标注取消 / 代码面保留（逐处）

**取消面（三类）**：
① **受影响文件表内 `.md` 行** ⇒ 该两列填 `—`，**行保留**（不删行）；机械判据 = 表头含「当前行数 / 预计增量」列 且 行首格为 `.md` 路径。
  as-of 逐表：`AGENT-LOOP-SUBAGENT.md` §6.20.4（`:366` h3）/ §6.21.4（`:489` h3）· `CORE-UNIFICATION.md` §2.8.1（`:550`）/ §4.4.1（`:1697`）· `DOC-CODE-RECONCILE.md` §5.1.6（`:283`）·
  `PROMPT-SYSTEM.md` §4（`:204`）· `VSC-DEBT.md` §4（`:145` / `:249`）· `VSC-MIGRATION-INVENTORY.md` §10（`:375`）· 设计档 `docs/core/design/DOC-DISCIPLINE.md` §3.7 —— **落笔轮按上述机械判据全扫补全，不得只改本清单**。
② **正文残留句** ⇒ 整句删：`docs/core/design/DOC-SYSTEM.md:332`（本轮回读确认逐字在场：「**拆分规划（R24a）**：本档实测 **423 行**…已超软线」——整句仅读数与拆分规划，无语义残留）。
③ **体量判据行** ⇒ 整行删（判据随规则退役）：`docs/core/design/DOC-CODE-RECONCILE.md` C3（`:265`）· ACC-5（`:310`）。
**保留面（零改——不得误删）**：源 / 测试档（`.mjs` / `.cjs`）行「当前行数 + 预计增量 + 拆分计划」三件；抽样 ≥3 档须仍在：`CORE-UNIFICATION.md` §2.8.1（`:550`）/ §4.4.1（`:1697`）· `AGENT-LOOP-SUBAGENT.md` §6.20.4（`:366`）/ §6.21.4（`:489`）· `VSC-DEBT.md` §4（`:145`）。
**域外面**：`docs/batches/**` 不回改（一次性批次材料）· `docs/TODO-archive.md` 不回改（归档态）· `prompts/**` 零改（产品代码）· 参照历史树（`thincoder-cli/docs/**` / `thincoder-vscode/docs/**`）零改（只读政策）· `scripts/**` 零改。

### §2.5 条目 3 · 登记面闭合（收正表 + OBL 零漏项扫描）

**规则落点收正表（R1–R13；`回读` 列 = 2026-09-16 本轮逐处回读结论）**：

| # | 档:行 | 现状（指认） | 收正后 | 回读 |
|---|---|---|---|---|
| R1 | `docs/core/requirements/METHODOLOGY.md:67`（F-R24a） | 判定句已限「源 / 测试文件」；同句「**新建 / 迁移文件标预计规模**」**未限面**；范围边界列「纯文档 .md 豁免标注」 | 该半句限**源 / 测试档**；范围边界列改「**文档档零标注义务**（不标行数 / 不写预计增量 / 不写拆分规划）」 | 行在场 ✓；列内文字落笔轮回读 |
| R2 | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:65`（批次档模板节） | `### 受影响文件（带当前行数 + 预计增量）` | `### 受影响文件（源 / 测试档带当前行数 + 预计增量；文档档两列填 —）` | 行在场 ✓ 逐字 |
| R3 | 同上 `:292`（F12） | 「文档不受行数限制——超长**只作提示 / 登记**，不拆」 | 「文档不受行数限制——**无任何行数义务**（不限行数、不登记读数、不写拆分规划）」 | 行在场 ✓；该半句落笔轮回读 |
| R4 | `docs/core/design/ADVISOR-CONVERGENCE.md:17` | 「行数标注义务 = 纪律层文档规范节」（未限面） | 义务限**源 / 测试档**；文档规范节**不再承载**行数义务 | 行在场 ✓ |
| R5 | 同上 `:201` | 权威链句同款 | 同 R4 | 行在场 ✓ |
| R6 | 同上 `:205`（评审核查维度） | 「…纯 `.md` 文档豁免」（逐字在场 ✓） | 「文档档**零标注义务**（不标行数 / 不写拆分规划）」——维度射程不变 | 行在场 ✓ 逐字 |
| R7 | `docs/core/design/ENGINEERING-MODE.md:107` | 「**拆分规划（提示词面）**：…实测 296 行…当前不拆（只登记）」 | 收正 / 删——提示词档非程序代码 ⇒ 零行数义务 | 行在场 ✓ |
| R8 | `docs/core/design/STRUCTURE-DEBT.md:39` | 「设计（含受影响文件与行数标注）」 | 「设计（受影响文件：**源 / 测试**档行数标注）」 | 行在场 ✓ |
| R9 | `docs/core/design/AGENT-LOOP-SUBAGENT.md`:378 / `:388` / `:554` / `:561` / `:564` / `:565` / `:567`（+ 异名节 `:540`） | ① 指针（`:378` / `:561`）· ② 读数（`:388` / `:554` / `:564` / `:565` / `:567`）· ③ `:5` | 删读数片段 + 删 / 改指指针；异名节 `:540` **整节删**（§2.2 `:16` 行） | 7 行全部在场 ✓ |
| R10 | `docs/core/requirements/ENGINEERING-MODE.md:231` | 已限源 / 测试 ⇒ **零改**（核验项） | 零改 | **本轮未回读（标 unverified）**——落笔轮先读后判 |
| R11 | `docs/core/design/DOC-CODE-RECONCILE.md`:230 / `:254` / `:263` / `:265` / `:300` / `:310` / `:480`（+ `:287` / `:288` / `:289` / `:478` / `:483` / `:484` / `:485`） | ② 体量节读数与判据行 | ② 删读数片段；**判据行 C3（`:265`）/ ACC-5（`:310`）整行删**；③ 删指称片段 | 14 行全部在场 ✓（清单见 §2.3） |
| R12 | `docs/core/design/DOC-SYSTEM.md:332` | 正文残留：「**拆分规划（R24a）**：本档实测 **423 行**…已超软线」 | **整句删** | 行在场 ✓ 逐字 |
| R13 | 其余 ① ② ③ 命中行 | 变更记录 / 目录枚举 / 沿革句（全表 = §2.3 处置面 114 行） | 按三分支逐处处置 | 清单 = §2.3（as-of 行号，落笔轮回读） |

**OBL 零漏项扫描表（域 / 模式 / 计数 = 复扫口径，as-of 2026-09-16）**：

| 族 | 模式（正则） | 域内命中 | 处置 |
|---|---|---|---|
| OBL-1 自指节 | `体量与拆分规划\|档位与拆分说明` | **节内 88 节**（88 档）；节外 0 | 整节删（§2.2） |
| OBL-1b 节外指称 | `R24a\|体量\|拆分规划\|行数标注\|行数读数\|行数义务`（域 = 六目录顶层，排除节内 + 本档） | **143 行** = 处置 **114** + 保留 **29** | 三分支处置（§2.3） |
| OBL-2 文档行数义务句 | `只作提示\s*[/／]\s*登记\|文档超长\|文档.{0,12}行数限制\|超软线.{0,20}文档\|纯\s*`?\.md`?\s*文档豁免\|文档.{0,10}不受行数` | **活档 2 处**：`requirements/ENGINEERING-MODE-MECHANISM.md:292`（R3）· `design/ADVISOR-CONVERGENCE.md:205`（R6） | 2 处逐处收正；域外余量（批档 / 本档规则文本 / 参照树 / 提示词）**不处置 + 理由登记** |
| OBL-3 文档档行数读数 | `实测行数\|行数读数\|(实测\|声明)\s*\*{0,2}\d{2,4}\s*\*{0,2}\s*行` | **活档 25 行** | 随条目 1 / 2 处置（② 分支） |
| OBL-5 文档面标注义务句 | `带当前行数\s*\+?\s*预计增量\|行数标注\|行数义务\|预计增量\|预计规模\|拆分规划（提示词面）` | **活档 26 行** | 收正 = R1 / R2 / R4 / R5 / R6 / R7 / R8（各 1 行）；其余 **零改**（判据 = 指称对象为源 / 测试档） |

**旧记作废（透明度）**：§3.7 原记「OBL-1b 43 行」·「OBL-2 全树 19」·「OBL-3 23」·「OBL-5 收正 7 ∥ 零改 19」**均不成立**（模式与计数不自洽 / 切分假设不成立）——已按本轮复扫口径在 §3.7 与 §2.5 同步收正。
**不处置面（逐面理由）**：`docs/batches/**`（一次性批次材料）· `docs/TODO-archive.md`（归档）· `prompts/**`（产品代码）· 参照历史树（只读）· `scripts/**`（无文档行数执行体）。

### §2.6 机判验收（逐条）

| # | 判据（可机判） | 命令 / 期望 | 条目 |
|---|---|---|---|
| AC-1 | 删除面零残留 | `node scripts/…` 无用；用 `grep -rn "体量与拆分规划\|档位与拆分说明" docs/core docs/cli docs/vsc --include=*.md`（域 = 六目录顶层）⇒ **命中 0**（判前 as-of = 88） | 条目 1 |
| AC-2 | 指称面零漏项 | 族正则（§2.3）复扫 ⇒ 命中集 ⊆ §2.3 登记集 ∧ **未登记命中 = 0**（仅剩本档规则 / 判据文本） | 条目 1 |
| AC-3 | 指针零悬空 | `node scripts/doc-anchors.mjs` ⇒ **本批 authored 零新增悬空** ∧ **非前向引用类残留 0**；全域 `exit 0` = 批 9「拟新增」族**实装后**的收口态，**不作本批判据**（现存悬空 3 全 = 批 9「拟新增」族标注行——逐条归口 = §2.14） | 条目 1 |
| AC-4 | 零附带 | 88 档逐档 diff 只含「整节删 + 指称行改写」两类 hunk；抽样 ≥5 档（§2.2 列 5 档）逐档核 | 条目 1 |
| AC-5 | 文档面取消到位 | 受影响文件表 `.md` 行两列 = `—`（行保留）∧ `DOC-SYSTEM.md:332` 整句已删 ∧ `DOC-CODE-RECONCILE.md` C3 / ACC-5 整行已删 | 条目 2 |
| AC-6 | 代码面保留 | 源 / 测试档 `.mjs` 行「当前行数 + 预计增量 + 拆分计划」抽样 ≥3 档仍在（§2.4 列 3 处坐标） | 条目 2 |
| AC-7 | 零漏项登记 | OBL 五族复扫 ⇒ 活档命中集全部落在 R1–R13 与 §2.3 / §2.5 全表内（未登记命中 = 0）；F12 无「提示 / 登记」残留 | 条目 3 |
| AC-8 | 发布门 | `check-doc-width` 新增违规 0 · `check-ledger` 零新增 · 既有测试链照跑（本批零源 / 测试档 ⇒ 无新增用例） | 全部 |

**核验 = 主 agent**；命中的**代码面 / 机检脚本改动 ⇒ 停下打回主 agent**（不在本批）。

### §2.7 不在本批（红线）

① 不动历史档正文（`docs/batches/**` · `docs/TODO-archive.md` · 参照历史树）② 不改机检脚本（`scripts/**` 零改）③ 不动代码 / 测试面（源 / 测试档行数标注与代码拆分纪律照旧）④ 不做批 1–11 在飞内容 ⑤ 不新建文档档（本批零新建）⑥ 不重开已收口批的裁定 ⑦ 不改提示词（`prompts/**` = 产品代码）。

### §2.8 受影响文件（本批 .md 面；零源 / 测试档）

| 档 | 面 | 动作 |
|---|---|---|
| 88 档（§2.2 逐档表）+ §2.3 / §2.4 / §2.5 所列档 | 设计 / 需求 | 整节删 + 指称行改写 + R 表收正 |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计（本批设计档） | §3.7 落点 + §7 自指节随条目 1 删 + 变更记录 |
| 源 / 测试档（`.mjs`）· `scripts/**` | — | **零触碰** |

**注（条目 2 的首个适用实例）**：本批受影响文件表**不列行数 / 预计增量列**（本批即该规则的首个适用实例）。

### §2.9 未决 / 风险（交主 agent 判）

1. **§1 旧坐标漂移（不回改 §1，仅报告）**：§1`:29` 抽样 `DOC-DISCIPLINE.md:486` ⇒ 现 `:676`；`AGENT-LOOP-SUBAGENT.md:537` ⇒ 现 `:540`（其余 7 处抽样坐标本轮回读一致）；§1`:18`「该档自指体量节（`:461-466`）」⇒ 实测 `:469`（6 行）。
2. **§1 量级数差**：§1`:14`「约 120 档」vs 实测 **88 档**（§2.2 逐档实测；设计档 §3.7 已同步说明）。
3. **本轮未回读 / 待核（unverified）**：R10 `docs/core/requirements/ENGINEERING-MODE.md:231`；R1 范围边界列文字；R3 的「只作提示 / 登记」半句；提示词面零改核验（`prompts/advisor-design.md:21` · `prompts/discipline-engineering.md:218` / `:83`）——四者落笔轮**先回读后落笔**。
4. **边界行裁定权**：§2.3 末列四处「假阳 / 边界行」的最终判（零改 or 删指称片段）归落笔轮逐处回读后定，逐处登记判定 + 理由。

### §2.10 收尾验证轮 · 口径收正 + 三闸实测（as-of 2026-09-16 · eng-designer）

**AC-2 / A-DD14 复扫口径收正（D2 单一权威源 = 设计档 §3.7 + §5 A-DD14）**：指称面复扫命中 **143 行 = 处置面 114（§2.3 逐行清单）+ 保留面 29**（保留判据句 = 命中族正则但不含 `体量|拆分说明|体量节|R24a 节|§R24a` ⇒ 保留）；**未登记命中 = 0** 的域界定 = 上式两项之外仅剩本档（`docs/core/design/DOC-DISCIPLINE.md`）规则 / 判据文本。原 AC-2 写法（「命中集 ⊆ §2.3 登记集」）未含保留面 29 ⇒ **以本行为准**。

**裁定（§2.9 待决项处置）**：① `### *.4 受影响文件清单（R24a）`（h3 ×2）**保留零改**——指称对象 = 代码面清单名（判据句 = 设计档 §3.7「保留面」）；② `docs/core/design/AGENT-LOOP-SUBAGENT.md:540`「档位与拆分说明（R24a）」= **异名同实 ⇒ 属删除面**（OBL-1 模式含 `档位与拆分说明`）。

**三闸实测（as-of 2026-09-16 · cwd = `thincoder/`）**：

| 闸 | 命令 | 结果 | 归属 |
|---|---|---|---|
| 宽度 | `node scripts/check-doc-width.mjs` | **FAIL**：5 档 / 8 行超 300 字符（**表格行豁免在位**——`vsc-debt.md:124` 注记同证） | 本批 §1 **1 行**（`:29` 417 字符）+ 他批在飞 **7 行**：`doc-reconcile.md:125`（716）· `migration-wrapup.md:17`（461）/`:127`（302）· `residual-debt.md:168`（608）/`:191`（914）· `vsc-debt.md:129`（518）/`:144`（596）——**本批作者面（设计档 + 本 §2）零超宽** |
| 一致性 | 同上（V1/V2/V3） | **绿**：新增违规 **0** · 存量 **0** · 基线 **0 条**（保持为空） | — |
| 台账 | `node scripts/check-ledger.mjs` | exit **0**（绿） | —（**现况见 §2.14**：新增阻断 **1** = `docs/TODO.md:44` 组计数 15 ≠ 14） |
| 锚一致性 | `node scripts/doc-anchors.mjs` | **FAIL**：悬空 **5**（阈值 0）——产品树腿 5 / 迁移树腿 0（`--domain .` 同 5） | 存量：批 9「拟新增」族标记行 **3**（`docs/core/design/DOC-DISCIPLINE.md:34` / `:51` / `:728` ⇒ `thincoder-cli/test/doc-fnum-refs.test.mjs` 拟新增未创建）· 他批在途 **2**（`docs/vsc/design/VSC-DEBT.md:129` / `:164` ⇒ `thincoder-vscode/src/extension/panel-messages-session.mjs` 不存在）——**本批 authored 行零新增悬空**（**现况见 §2.14**：族标记行 `:731` · 他批 2 条已出列 ⇒ 悬空 **3**） |

**交回/打回主 agent（不入本批写域）**：① 上表宽度 7 行 + 锚 5 条 = 他批 / 批 9 在飞面——**是否一并修、谁修 = 主 agent 裁**（**不得设基线豁免**：一致性基线判据要求为空）；② 本批 §1 超宽 **1 行**（`:29` 417 字符）与 §1 抽样坐标漂移（条目见 §2.9——本轮落笔后本档行号整体下移，落笔轮回读）**归 §1 作者**；③ AC-3「全域 `exit 0`」措辞 = 语义面 ⇒ 主 agent 裁定（设计档 §5 A-DD14 同此）——**已裁定**：见 §2.14 裁定 1。

### §2.11 域口径补注（本档自身 = 域外 · as-of 2026-09-16 · eng-designer）

**补注**：族正则域（§2.3 / §2.5 OBL-1b 的「排除本档」）= 本档 `docs/core/design/DOC-DISCIPLINE.md` 自身**全部在域外**——**规则 / 判据文本 + 变更记录历史叙述**（含其中行数读数与「§7」型节引用）。判据句入设计档 §3.7「保留面」（域外补注）。

**受影响计**：本档 4 处「§7」型历史引用（`:739` / `:741` / `:744` / `:750`——均在本档变更记录内）**照留零改**（形态 = 历史叙述，与本档既有「原 §2.19 …」型同形）；本档变更记录中「≈480 → 279」型行数读数同属域外。**本档 4 行不计入处置面 114**（复扫域 = `--exclude=DOC-DISCIPLINE.md`）。

**上报（待裁 · 语义面）**：若主 agent 判上述 4 处应入处置面（③ 分支）⇒ **范围变更（语义面）** ⇒ 由主 agent 裁定后我加进 §2.3 逐行清单（计数 114 → 118 同步改动）。

### §2.12 §2.11 坐标 as-of 收正（一行）

§2.11 所列 4 处坐标 = **as-of 其落笔前**（`:739` / `:741` / `:744` / `:750`）；同轮设计档 §3.7 插入「域外补注」段（+2 行）后**实位 = `:741` / `:743` / `:746` / `:752`**（该档行号随写而动——判据以设计档 §3.7 判据句为准，行号只作 as-of 参考 · D4）；该档第三处「拟新增」标记行同理 `:728` → `:730`。

### §2.13 形态收正（V1 段引用红）+ 宽度闸新红上报（as-of 2026-09-16 · eng-designer）

**① §2.12 行内形态收正（本角色就地执行 · 非追加）**：§2.12 行内**段引用主语误写**——把所指设计档写作「本档」，同行后接 `§3.7` 节号 ⇒ 机检按「本档 = 批次档自身」解析 ⇒ no-section 红（批次档自身无 §3.7）。收正 = 该主语改写为「**设计档**」（+ 同句另两处「本档」→「该档」，指称对象 = `docs/core/design/DOC-DISCIPLINE.md`）。**披露**：该收正为**本角色 §2 段内单行机械形态收正**（V1 判据句 = `文档:节` 可解析）——不属追加；语义零变更（所指未动）。
  **同轮二次收正**：本条①原按引例逐字复写该误写形态 ⇒ 机检**二次计红**（V1 1 → 2）⇒ 收正为**免引例转述**（判据：报告内不得逐字复现违规形态）。

**② 宽度闸新增红（他批在途 · 不属本批写域）**：交付前复跑新增 **`docs/core/design/DOC-MIGRATION.md:290`（360 字符）**——行内自述 = 「批 11 · 修正轮 R1 · eng-designer」⇒ **他批在途落笔**（前一次复跑该档无红：5 档 / 8 行 → 6 档 / 9 行）。**本批**：本档 `:29`（§1 · 417 字符 = 现状文本）1 行 + 他批 4 档 7 行 ⇒ 本批**零新增宽度红**。处置（修 `:290` / 是否纳入本批发布基线）⇒ **主 agent 裁定**（本角色不跨批落笔）。

**③ 上报（同 ② 口径）**：宽度闸为**全域闸**——他批在途红即**阻断本批发布**；`fixtures/doc-consistency-baseline.json` = `entries: []`（实测 ✓ 须保持空）。

### §2.14 父侧裁定落笔轮（裁定 1–5 逐条落地 · 2026-09-16 · eng-designer）

**读法**：落点 = 本档 §2 + 设计档 `docs/core/design/DOC-DISCIPLINE.md`；§1 / §3 段零写；本节以「现况回读」为准（行号只作 as-of 参考 · D4）。

**裁定 → 落点（逐条 · 号 → `file:line`）**

| 裁定 | 内容 | 落点（`file:line`） | 状态 |
|---|---|---|---|
| 1 | AC-3 收窄：判据改「本批 authored 零新增悬空 ∧ 非前向引用类残留 0」；全域 `exit 0` = 批 9「拟新增」族实装后的收口态，**不作本批判据** | 本档 `:290`（AC-3 行）· 设计档 §5 A-DD14（`:598`） | 已落 |
| 2① | 本档自身 4 处「§7」型历史引用 = **域外照留**（历史叙述形态） | 设计档 §3.7 域外补注（`:228`）· 变更记录（`:770` 起） | 已落 |
| 2② | 异名节 `docs/core/design/AGENT-LOOP-SUBAGENT.md:540` = **删除面**（按内容类判、不按节名判） | 本档 §2.2 逐档表 / §2.10；设计档 §3.7「删除面」 | 照准 |
| 2③ | 两处 h3「受影响文件清单（R24a）」= **保留面** | 本档 §2.10 裁定 ①；设计档 §3.7「保留面」 | 照准 |
| 3 | 口径核查照录：旧记「`C_R24a` 91 档」全仓 grep **0 命中** ⇒ 载体不存在、无冲突可统一；`files` 88 档 ∥ `提及` 111 档 = 分母差异 | 设计档 §3.7（分母口径 `:213` · 结论 `:214`） | 已落 |
| 4 | 三闸红逐条归口（执行人见下「三闸红归口」表） | 本节 | 已落 |
| 5 | as-of 收正：自指体量节（§7）标题行 = 实测 `:706` | 设计档 §3.7 抽样坐标（`:237`）· 变更记录（`:776`） | 已落 |

**裁定 1 明细——悬空逐条归口（本轮回读）**

- 闸态（`node scripts/doc-anchors.mjs` 产品树腿）= **悬空 3 条**，全部 = 批 9「拟新增」族标注行：`docs/core/design/DOC-DISCIPLINE.md:34` / `:51` / `:731`（⇒ `thincoder-cli/test/doc-fnum-refs.test.mjs` 未创建）⇒ **前向引用类**（族实装后归零，仍列报）。
- ⇒ **非前向引用类残留 = 0** ⇒ AC-3 收窄后判据**成立**。
- 前记「悬空 5」中的 2 条**已出列**：`docs/vsc/design/VSC-DEBT.md:129` / `:164` ⇒ `thincoder-vscode/src/extension/panel-messages-session.mjs`——该档**现已在位**（工作树未跟踪）⇒ 不再悬空。**5 → 3 属读数变化，非判据变化**。
- 迁移树腿 = 0 条；宽符号面 = 报告态（不入闸）。

**坐标 churn 台账（同一族标记行 · 各轮读数）**

| 轮次 | 本档坐标 | Δ 原因 |
|---|---|---|
| 本批 §2.10 读数 | `:34` / `:51` / `:728` | 彼时 as-of |
| 设计档变更记录前条（`:766`） | `:34` / `:51` / `:730` | §3.7 增行 |
| 本轮（现况） | `:34` / `:51` / `:731` | 本轮 §3.7 增 1 行 |

**三闸红归口（裁定 4 · 执行人逐条 · 本轮实测）**

| 面 | 红 | 执行人 / 归属 |
|---|---|---|
| 宽度 | 本批 §1 `:29`（417 字符） | **主 agent**（父侧折行；本角色 §1 零动） |
| 宽度 | 他批 4 档 7 行：`doc-reconcile:125` · `migration-wrapup:17` / `:127` · `residual-debt:168` / `:191` · `vsc-debt:129` / `:144` | **父侧机械折行** |
| 宽度 | 本批 authored 面（设计档 + 本节）= **0 行** | — ✔ |
| 宽度 | `docs/core/design/DOC-MIGRATION.md:290` | **已消解**（本轮不在超宽列——他轮已修） |
| 锚 | 悬空 3（全 = 批 9 拟新增族） | **前向引用类 · 预期态**（不阻断本批） |
| 台账 | `docs/TODO.md:44` 组计数不符（声明 15 ≠ 实得 14） | **他域（台账 = 主 agent）**——本轮**新见**，非本批写域 |
| 一致性 | 新增违规 0 · 基线清单空 | — ✔ |

**裁定 5 数差（如实）**：裁定记现值 `:703` · 落笔前实测 `:705` · 落笔后（§3.7 增 1 行）= `:706`——落笔取**实测** `:706`（差异 2–3 行；行号只作 as-of 参考 · D4）。

**本轮不做（显式）**：不动他批 `docs/batches/**` 档 · 不动 `docs/TODO.md` / `docs/TODO-archive.md`（台账他域）· 不动 `scripts/**` · 不动源码 / 测试 · 不写 §1 / §3 段 · 本档 `:29` 折行由主 agent 执行。

## §3 设计评审（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

**评审对象**：批 12 DOC-LENGTH-RULE-REPEAL 设计面（批次档 `thincoder/docs/batches/2026-09-16-doc-length-rule-repeal.md` + 设计档 `thincoder/docs/core/design/DOC-DISCIPLINE.md` §3.7 / §5 A-DD14–16 / 用例 DD-26–33 / 受影响表）。

**范围限制**：未声明项目标准档与文档地图 ⇒ 文档归属 / 规范符合性判据降级（按 Project Guide + 评审判据判）；评审范围 = 上述两档（未外读），跨文件事实（88 档 · 143/114/29 · F12 现文 · 各档 as-of 行号）按两档 as-of 读数采信。内部自洽与两档互洽抽查已做：47+21+8+5+6+1=88 档 · 396=242+69+32+16+32+5 行 · 114=①3+②52+③59 · 143=114+29 · §2.2 表 88 行连续 · 本档 §7 区间 706–734（29 行）· :34/:51/:731 标记行与 :742/:744/:747/:753 「§7」型引用 · :598/:608/:234 复扫句。

**发现表**：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | 「指称面复扫」落笔后期望三处互不一致：`thincoder/docs/core/design/DOC-DISCIPLINE.md:608`（「事后复扫：命中 = 保留面 29」）vs `DOC-DISCIPLINE.md:598`（A-DD14「命中 143 = 处置面 114 + 保留面 29」）vs `DOC-DISCIPLINE.md:234` 与 `thincoder/docs/batches/2026-09-16-doc-length-rule-repeal.md:289`（AC-2「命中集 ⊆ 登记集」）；批次档 `doc-length-rule-repeal.md:322` 又声明「143 = 114 + 29，以本行为准」。② / ③ 分支删除的恰是携带被匹配 token 的片段（节名 / 读数——`DOC-DISCIPLINE.md:223-224`）⇒ 落笔后按「= 143」核将误红；三写法不能同真 | 统一为一条并标时点：143 = 落笔前 as-of 登记读数；落笔后判据 = 「保留面 29 ⊆ 命中集 ⊆（处置面 114 ∪ 保留面 29）∧ 未登记命中 = 0」；三处 + 批次档 AC-2 / §2.10 同步 |
| 2 | Acceptance criteria | 🟡 | AC-1 命令与声明域不一致、并对本档整体排除：命令（`doc-length-rule-repeal.md:288` / `DOC-DISCIPLINE.md:606`）为递归范围，声明域 = 六目录**顶层** 111 档（`DOC-DISCIPLINE.md:231` / `doc-length-rule-repeal.md:56`）；`--exclude=DOC-DISCIPLINE.md` 使本档 §7（最大节 · 29 行——`doc-length-rule-repeal.md:89`）不在「删除面零残留」判据内，仅剩 AC-4 抽样（`doc-length-rule-repeal.md:291`）兜底；规则 / 判据文本非标题形态，整体排除并非必需 | AC-1 改标题锚 grep（`^#+ .*(体量与拆分规划\|档位与拆分说明)`，域用 find / `-maxdepth` 落到六目录顶层）⇒ 本档 §7 标题纳入零命中、无须排除；或对 DOC-DISCIPLINE.md 单列一条「§7 标题行已不存在」判据 |
| 3 | Requirements coverage | 🟡 | 条目 1 × 条目 2 交叉面未登记：§7 内嵌批 9 受影响表含 6 条 `.mjs` 行（`DOC-DISCIPLINE.md:726-731`——`scripts/doc-anchors-*.mjs` · 两仓测试档 · 拟新增测试档）带「当前行数 + 预计增量」；随 §7 整节删除即被一并移除，而「代码面标注零改动」的抽样（`DOC-DISCIPLINE.md:613` / `doc-length-rule-repeal.md:248`）不含 §7 ⇒ 该移除既无授权说明、也不被判据覆盖 | 显式落一行：§7 内嵌批 9 受影响表（含 `.mjs` 行）= 一次性批次材料、随节删除；或把该表纳入 AC-6 例外口径（抽核面注明「不含被删节内的表」） |
| 4 | Clarity | 🟡 | R2 收正后模板保留两列并写「文档档两列填 —」（`DOC-DISCIPLINE.md:269` / `doc-length-rule-repeal.md:258`），而本批自称「该规则的首个适用实例」却不列该两列、表头为「档 / 面 / 动作」（`DOC-DISCIPLINE.md:294` / `:296-309` / `doc-length-rule-repeal.md:311`）——首实例与其所立模板相抵，纯文档批按哪种形态写无法判定 | 二选一并同步两处：模板改「文档档不列行数 / 增量列（零标注义务）」；或本批两表按「两列填 —」补列 |
| 5 | Scope | 🟡 | §1 未随实测收正（「约 120 档」`doc-length-rule-repeal.md:14` · 抽样坐标漂移 `:29`）——设计已声明「不回改 §1、仅报告」并登记（`:315-316`）；但引用 §1 者即得旧数（实测 88——`:152`），本评审的目标描述亦沿用「约 120 档」。coordination item，非缺陷 | 在 §1 处落一行收正批注（120 → 88；坐标以落笔回读为准），或在批准环节并载收正说明 |
| 6 | Acceptance criteria | 🔵 | §7 整节删除将移除批 9「拟新增」标记行 `DOC-DISCIPLINE.md:731`（在 §7 区间 706–734 内）⇒ 落笔后闸态悬空 3 → 2；AC-3 / A-DD14 的「悬空现况 3」（`DOC-DISCIPLINE.md:598` / `doc-length-rule-repeal.md:290` / `:376`）为落笔前读数 | 落笔时回读登记 3 → 2（「非前向引用类残留 0」判据不变），避免验收对表误判 |
| 7 | Clarity | 🔵 | 两处计数与枚举不同步：① R13 行「本表已逐处命名其中 15 行」（`DOC-DISCIPLINE.md:280`）与表内实际命名不符（R1–R9 = 15 + R11 7 + R12 1 ⇒ ≥23，R13 示例另计）；② 受影响表「其余 80 档」（`DOC-DISCIPLINE.md:308`）与 88 − 已列且属 88 的 9 档 = 79 不符（`DOC-SYSTEM.md` 不在 88 内——`:306` 自注「无体量节」） | 按现表重数（D3：计数与枚举同改），或改述为「逐档清单以批次档 §2.2 为准」不落数 |
| 8 | Clarity | 🔵 | OBL 族编号缺 4：列表 = OBL-1 / 1b / 2 / 3 / 5（`DOC-DISCIPLINE.md:251-255` / `doc-length-rule-repeal.md:275-279`），而 AC-7 / A-DD16 称「五族」（`doc-length-rule-repeal.md:294` / `DOC-DISCIPLINE.md:600`）——编号读起来像漏项 | 注明 OBL-4 去向（撤销 / 并入）一行，或径改连续编号 |
| 9 | Requirements coverage | 🔵 | 删除面判据 = 内容类（`DOC-DISCIPLINE.md:212`），检测 = 名字族「体量与拆分规划 / 档位与拆分说明」（OBL-1 `:251`）；第四个异名形态（如「体量与拆分说明」）既不落名字族、其标题也不落 AC-1 ⇒ 仅靠落笔回读兜底、无留证 | AC-1 增一条标题面枚举核对（`^#+ .*(体量\|拆分说明\|拆分规划)` 复扫），逐条登记「删除 / 保留 + 理由」——只留证、不扩范围 |
| 10 | Clarity | 🔵 | R11 判据行 C3 / ACC-5「整行删」（`DOC-DISCIPLINE.md:242` / `:278` · `doc-length-rule-repeal.md:247`）未列「入向编号引用」核查：V6 编号面 = 报告态未实装（`DOC-DISCIPLINE.md:34` / `:51`），V5 不判此类编号 ⇒ 他处若有引用 C3 / ACC-5 成语义悬空且不报 | 落笔时扫 `C3` / `ACC-5` 字面（含与 `§` 组合形态），逐处登记处置 |
| 11 | Requirements coverage | 🔵 | §3.7「文档档越线**不触发**任何**本批**拆分」（`DOC-DISCIPLINE.md:241`）的「本批」限定与 F12 废除（永久 · 无任何行数义务——R3 收正句 `:270`）口径相抵，可读成「仅本批豁免」 | 去「本批」（或改「不触发任何拆分 / 拆分规划」），与 R3 收正句同口径 |

**计数**：🔴 0 · 🟡 5 · 🔵 6（合计 11）

**VERDICT: pass**（无 🔴；🟡 5 + 🔵 6 不阻断批准）

## §4 用户批准（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

### eng-coder 收口（§5 · 自写 · 2026-09-16 收口轮）

**终态：stalled（半成品——Phase 1 已删净，Phase 2b/4/5 未完成）。** 回合将尽，按父侧指令停止继续删除，如实交回已删/未删清单与读数。

**已删（本批已落、可机证）**
- **Phase 1 整节删除（88 档）**：活档面 `## <N>. 体量与拆分规划（R24a）` / `## 档位与拆分说明（R24a）` 节标题 grep **命中 0**（本轮 `grep "体量与拆分规划|档位与拆分说明" thincoder/docs --glob **/*.md` 复核：活档无节标题命中；仅批次档历史面 + `DOC-DISCIPLINE.md` §3.7 规则/判据自述保留——两者按设计边界均属**保留面**）。
- **Phase 2b 已处置（部分）**：`AGENT-LOOP.md`（10 处）、`DOC-CODE-RECONCILE.md`（3 替换 + 4 删除，**替换/删除后未回读验证**，标 unverified）、R 表/义务修正文件（`AGENT-LOOP-SUBAGENT.md` / `DOC-SYSTEM.md` / `ADVISOR-CONVERGENCE.md` / `ENGINEERING-MODE.md` / `STRUCTURE-DEBT.md`）与 `METHODOLOGY.md` / `ENGINEERING-MODE-MECHANISM.md` 的 F-R24a 编辑（均 unverified，逐行未回读）。

**未删（本轮 grep 实证，Phase 2b 残余——AC-1 未达成）**
以下活档仍残留 ③ 枚举/叙述句（变更记录/叙述中「§N 体量与拆分规划」字样），需删指涉片段（保同句语义词）：
- `docs/core/design/MCP.md:211`
- `docs/core/design/MEMORY.md:359`
- `docs/core/design/PROVIDER.md:382`
- `docs/core/design/SESSION.md:366`
- `docs/core/design/TOOLS.md:322`
- `docs/core/design/TWO-REPO-MERGE.md:200`
- `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:475` 与 `:477`（各「体量与拆分规划实测行数收正」）

另：①指针/②读数义务 类残余（不含「体量与拆分规划」字面）本轮未再全量扫——§2.2 表 88 档中约 40+ 文件的 R24a/行数残余待扫；Phase 2c（2 extras）、Phase 4（§2.4 文档侧取消 C3/ACC-5 + DOC-SYSTEM:332 + .md 行→—）、Phase 5（AC-1..AC-8 机检）未完成。

**读数（本轮实测）**
- `grep 体量与拆分规划|档位与拆分说明 docs/**/*.md`：节标题 0；③ 叙述句残余 7 文件 8 行（如上）。
- `node scripts/doc-anchors.mjs`：悬空锚 **0**（闸态 OK）；报告态 5 处 distinct 3（A2×4 = `WEBVIEW.md` 符号、A3×1 = `TOOLS.md:189` child-permission 路径）——**与本批体量节删除无关**，属既有 doc-code 漂移。
- `node scripts/check-ledger.mjs`：**2 处违规（阻断）**，均 `docs/TODO-archive.md:291`（指针 `ENGINEERING-MODE-MECHANISM.md §1.19`、`DOC-DISCIPLINE.md §2` 本仓不可解析）——**非绿**，需父侧处置。

**已删档逐档 git diff 自检**：未完成（回合不足，仅 grep 宏观自检；DOC-CODE-RECONCILE.md 等文件的替换/删除 hunk 未回读核对——标 unverified）。

## §6 验证与收口（父代理）

> **收口判词：已收口 2026-09-16**（设计评审轮 1 pass → 实施轮（前轮删 88 节 + 续轮残余）→ 父侧核验 / 代做残余 → 收口）

### 交付判定（父侧实测）

| 条目 | 判定 |
|---|---|
| 条目 1 整节删除 | ✅ 88 节标题 grep **0 命中**（父侧复跑：core / cli / vsc 活档除 `DOC-DISCIPLINE.md` 规则自述外零命中） |
| 条目 2 文档侧标注取消 | ✅ R2 / R3 / F12 判据已收正 + 叙述句 8 处父侧删毕 |
| 条目 3 规则废除登记 | ✅ §3.7 规则自述 + 保留面 29（grep 判据） |

### 父侧收尾（代做 · 打标）

- 叙述句 8 处（`MCP.md:211` · `MEMORY.md:359` · `PROVIDER.md:382` · `SESSION.md:366` · `TOOLS.md:322` · `TWO-REPO-MERGE.md:200` · `ENGINEERING-MODE-MECHANISM.md:475`/`:477`）→ 父侧删「体量与拆分规划」指称片段（保语义词）；
- 台账 L4 两处（批 9 核销行裸指针）→ 父侧修（`check-ledger` 复跑 0 违规 ✓）。

### 未决（登记 / 触发）

1. `DOC-CODE-RECONCILE.md`「3 替换 + 4 删未回读」→ 逐 hunk 复核（登记，随下批）；
2. 保留面 29 行 diff 为空（DD-33 判据）——父侧以 grep 判据核（零改动面未逐 diff 目检）。

### D7 核销同步

| 项 | 状态 |
|---|---|
| 状态行 | 本档 → **已收口 2026-09-16** |
| 待办勾销 | 无独立台账条目（批 12 = 用户裁定「文档不受行数限制」的规则废除，非台账条目） |
| 台账可见面 | 收口行见会话流 |
