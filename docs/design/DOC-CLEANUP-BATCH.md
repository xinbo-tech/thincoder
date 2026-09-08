# 文档批 2（DOC-CLEANUP-BATCH）——引用清扫 + 格式债残留

> 板块：跨板块文档批（批专属设计档）。状态：设计待评审——评审通过 eng-coder 实现。
> 来源：STRUCTURE-DEBT §8 执行后核销（2026-09-08 explore 一手——批 A A1-A8/V1-V5 已执行完毕，本批为**净剩余**：2a 引用清扫残留 + 2b 格式债残留 5 件）。纯文档（docs/ 下 .md + 双端）——无代码逻辑改动。

## 1. 定位

批 A 文档格式债执行后的**收尾批**——清 2a 引用残留（旧工具名/悬空指针/R7 豁免注）+ 2b 结构残留（VERIFY-DOCONLY/ides.md/CAPABILITY_GAP 坏格式 + 长单行）。工作量小（净剩余），与批 1（代码小修）并行域无冲突。

## 2a. 引用清扫残留

### 2a-1 CLI AGENT-LOOP.md:94 旧工具名（L30 残留①）

- **现状**：§3 prepareRun 记忆检索步写 `memory_search(input)` 前 3 条——旧裸工具名。
- **改**：`记忆检索（memory search 动作）前 3 条…`（对应单 memory 工具五动作表述——MEMORY.md:15 自注旧裸名不再写为活工具）。

### 2a-2 VSC docs/CAPABILITY_GAP.md:7/8/21 旧工具名 + 路径（L30 残留②——合并 2b-3 格式重写同批）

- **现状**：行 7/8 列 `memory_put 工具 | src/memory/core.mjs | …JSON 文件存储`、`memory_search 工具`——工具名已并为 `memory` 单工具五动作（VSC 426b574 交付）+ VSC 无 src/memory/core.mjs（实为 memory-tool.mjs/memory.mjs）+ 存储描述"JSON 文件"过期（实为 CLI memory.db / VSC 文件制）。
- **改**：能力行改 `memory` 单工具（search/put/list/delete/clear）+ 路径改 VSC 实际（src/memory-tool.mjs）+ 存储描述按 VSC 文件制（frontmatter md——见 MEMORY.md）。与 2b-3 格式重写同批。

### 2a-3 CLI TOOLS.md:4 悬空指针（D-T1.8 机械扫新增）

- **现状**：关联权威头注含 `` `EDIT-TOOL-EOL-DESIGN.md`（编辑工具 EOL 语义） ``——已移 `_archive/`（内容并入 EDIT-HELPERS.md）。
- **改**：指针改 `EDIT-HELPERS.md`。

### 2a-4 AGENT-LOOP §12.2 R7 豁免注（L43）

- **现状**：R7 铁律正文在 AGENT-LOOP.md §12.2（:442-460）——无"残留扫描只约束活体文案"豁免。
- **改**：:459 前补 `R7f 引用清扫/旧名残留/文档卫生只约束活体文案（docs/design/ 生效档 + 根级生效文档）；_archive/ 历史快照不在判定面（报 _archive 内旧名/旧路径不构成 🟡/🔵）。`

### 2a-5（扩围候选）VSC 根 METHODOLOGY.md:5 悬空（L44）

- **现状**：头注指"与 docs/design/METHODOLOGY.md 同源"——VSC design 下无此文件。
- **改**：指针删或改指根版。**扩围需你裁**（L44 原独立项）。

## 2b. 格式债残留（净 5 件）

### 2b-1 CLI VERIFY-DOCONLY.md（结构坏 + 内容漂移——先定去留）

- **现状**：19 行标题吞正文（:2/:5/:13/:16）；内容漂移——自称"已实现(2026-08-03)"但引已删 test/tools.test.mjs + verify 09-07 重构为通用门禁（VERIFY-REDESIGN.md 现行）——doc-only 快路径重构后是否仍存需核。
- **处置（三选一）**：a) 并入 TOOLS.md 工具系统板块 + 归档；b) 更新为 VERIFY-REDESIGN 续（若 doc-only 快路径仍存）；c) 纯归档（被 VERIFY-REDESIGN 取代）。**需实现时核实 VERIFY-REDESIGN.md 是否覆盖 doc-only——倾向 a/c**。

### 2b-2 CLI docs/guides/ides.md（结构坏）

- **现状**：30 行节标题吞 prose（:3/:4/:11/:16/:22/:25/:28）+ :25 代码围栏错位。
- **改**：demux 为多行干净格式（标题空行隔离 + 表格修正 + 围栏修复）。

### 2b-3 VSC docs/CAPABILITY_GAP.md（结构坏——合并 2a-2 同批）

- **现状**：26 行行内吞节（:1/:5/:10/:14/:16/:18/:23）——不在任何 V 批清单漏网。
- **改**：格式重写 + 2a-2 内容修正同批。

### 2b-4 CLI AGENT-LOOP.md 3 条 >300 单行（:234/:269/:494）

- **现状**：settle 统一机制/Neutrality/consult settle 密度段 3 条长单行（09-08 新增长行）。
- **改**：折行（判据①——无 >300 单行）。

### 2b-5 CLI docs/TODO.md:83 长行

- **现状**：distill 条目长行（98 行档剩 1 条 >300）。
- **改**：折行。

### 2b-6 顺带：TOOLS.md §8 地图/双端其他若扫描发现 >300 残留——随批修（不另立项）

## 3. 受影响文件

| 文件 | 端 | 改动 | 预计 delta |
|---|---|---|---|
| docs/design/AGENT-LOOP.md | CLI | 2a-1 + 2a-4 + 2b-4 | 折行 + 两注 ≤±20 |
| docs/design/TOOLS.md | CLI | 2a-3 | ≤±1 |
| docs/design/VERIFY-DOCONLY.md | CLI | 2b-1（处置：并入/更新/归档） | 视处置 |
| docs/guides/ides.md | CLI | 2b-2 demux | ~+15 |
| docs/TODO.md | CLI | 2b-5 | ≤±1 |
| docs/CAPABILITY_GAP.md | VSC | 2a-2 + 2b-3 | ~+10 |
| docs/design/METHODOLOGY.md（根级） | VSC | 2a-5（若扩围） | ≤±1 |
| STRUCTURE-DEBT.md | CLI | 执行核销（已标注——随批收尾核销行） | ≤±1 |

## 4. 验收

- AC1 2a-1/2a-3：AGENT-LOOP.md:94 无 memory_search 旧名 + TOOLS.md:4 指针指 EDIT-HELPERS.md
- AC2 2a-2 + 2b-3：CAPABILITY_GAP.md memory 单工具 + VSC 实际路径 + 干净格式
- AC3 2a-4：R7f 豁免注在 §12.2
- AC4 2b-1：VERIFY-DOCONLY 处置完成（并入/更新/归档——不残留坏格式）
- AC5 2b-2/2b-4/2b-5：ides.md demux + AGENT-LOOP 3 条折行 + TODO:83 折行——全部 >300 清零
- 双端 scripts/check-doc-width.mjs 跑绿（或等效宽度检查——判据①）

## 5. 剔除项

- 批 A A1-A8/V1-V5 已执行主体（不重复——STRUCTURE-DEBT §8 已标注执行后状态）
- 已实现专题孪生对（A7/V3——保留重写已落地无需动）
- L44 VSC METHODOLOGY.md:5 悬空（2a-5 扩围候选——需用户裁）

## 变更记录

- 2026-09-08：立项。批 A 执行后核销（explore）——规划表更新为执行后状态 + 净剩余落本档。纯文档批——与批 1（代码小修）独立域。
