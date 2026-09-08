# 文档批 2（DOC-CLEANUP-BATCH）——引用清扫 + 格式债残留

> 板块：跨板块文档批（批专属设计档）。状态：**设计定稿待评审**（2026-09-08 用户裁：2a-5 并入 + 2b-1 走 a 并入——核实 VERIFY-REDESIGN D-V5/T-V5 接管 doc-only + 未提前身——并入其变更记录）——eng-coder 实现。
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

### 2a-5 VSC 根 METHODOLOGY.md:5 悬空（L44——2026-09-08 用户裁：并入本批）

- **现状**：头注指"与 docs/design/METHODOLOGY.md 同源"——VSC design 下无此文件。
- **改**：指针改指根版 METHODOLOGY.md（VSC 根级文档——非 design/ 下）。

## 2b. 格式债残留（净 5 件）

### 2b-1 CLI VERIFY-DOCONLY.md（结构坏 + 内容漂移——处置定案 a 并入 VERIFY-REDESIGN）

- **现状**：19 行标题吞正文（:2/:5/:13/:16）；内容漂移——自称"已实现(2026-08-03)"但引已删 test/tools.test.mjs + verify 09-07 重构为通用门禁（VERIFY-REDESIGN.md 现行）。
- **处置（2026-09-08 核实 + 用户裁——定案 a）**：**并入 VERIFY-REDESIGN.md**（非 TOOLS.md——核实：REDESIGN L44 D-V5 保留 doc-only 快路径 + L81 T-V5 用例已接管机制；但 REDESIGN 变更记录未提前身——VERIFY-DOCONLY 独有信息 = isDocFile 三处判定统一历史（verify.mjs/guard/dispatch——2026-08-03 实现记录）——并入 REDESIGN 变更记录补前身吸收行）→ **归档 _archive/**。

### 2b-2 CLI docs/guides/ides.md（结构坏）

- **现状**：30 行节标题吞 prose（:3/:4/:11/:16/:22/:25/:28）+ :25 代码围栏错位。
- **改**：demux 为多行干净格式（标题空行隔离 + 表格修正 + 围栏修复）。

### 2b-3 VSC docs/CAPABILITY_GAP.md（结构坏——合并 2a-2 同批）

- **现状**：26 行行内吞节（:1/:5/:10/:14/:16/:18/:23）——不在任何 V 批清单漏网。
- **改**：格式重写 + 2a-2 内容修正同批。

### 2b-4 >300 长行全量折行（评审重核——实际残留 7 档 15 行 + 双端）

- **现状（2026-09-08 实测——远超原估 3 行）**：docs/design >300 单行共 15 行 × 7 档——AGENT-LOOP:234(len952)/:494 + ASYNC-RESULT-CONTAINER ×6(:14/:15/:53/:70/:75/:92) + DESIGN-TOKEN-SETTLEMENT ×2(:56/:62) + DOC-REORG-VSC ×2(:66/:77) + STRUCTURE-DEBT:140 + SUBAGENT-OBSERVE-SEND ×2(:55/:61)。
- **改**：全量折行（判据①——无 >300 单行）——随批修（2b-6 顺带条款转正——受影响表全列）。
- **注**：原 2b-4 列 :269（Neutrality——恰 300 字符不超——不入折行——:234/:494 才是）。

### 2b-5 CLI docs/TODO.md 长行（:74/:87——行号校准）

- **现状（2026-09-08 实测）**：TODO.md 102 行（非 98）——长行 2 条：**:74（批实况行——2026-09-08 新增）+ :87（distill 条目——原写 :83 错——行号已漂）**。
- **改**：两行折行。

### 2b-6 归档引用清扫（评审线索——VERIFY-DOCONLY 归档后地图/先例悬空）

- **现状**：2b-1 归档 VERIFY-DOCONLY.md 后——README.md:39 地图仍列 "VERIFY-DOCONLY.md（doc-only 快路径）同板块独立保留" + SETTINGS-TOOL.md:3 仍引 "MCP.md / VERIFY-DOCONLY.md 先例"——**归档即悬空（自查漏）**。
- **改**：README.md:39 移除 VERIFY-DOCONLY（并入 VERIFY-REDESIGN 注——同板块独立保留只留 MCP/SETTINGS-TOOL）；SETTINGS-TOOL.md:3 去 VERIFY-DOCONLY 先例（改 MCP.md 单例）。
- **顺带**：双端其他若扫描发现 >300 残留——随批修（不另立项）。

## 3. 受影响文件

| 文件 | 端 | 改动 | 预计 delta |
|---|---|---|---|
| docs/design/AGENT-LOOP.md | CLI | 2a-1 + 2a-4 + 2b-4 折行(:234/:494) | 折行 + 两注 ≤±20 |
| docs/design/ASYNC-RESULT-CONTAINER.md | CLI | 2b-4 折行 ×6 | ≤±12 |
| docs/design/DESIGN-TOKEN-SETTLEMENT.md | CLI | 2b-4 折行 ×2 | ≤±4 |
| docs/design/DOC-REORG-VSC.md | CLI | 2b-4 折行 ×2 | ≤±4 |
| docs/design/STRUCTURE-DEBT.md | CLI | 2b-4 折行(:140) | ≤±2 |
| docs/design/SUBAGENT-OBSERVE-SEND.md | CLI | 2b-4 折行 ×2 | ≤±4 |
| docs/design/TOOLS.md | CLI | 2a-3 | ≤±1 |
| docs/design/VERIFY-REDESIGN.md | CLI | 2b-1 变更记录补前身吸收行（定案 a） | ≤±3 |
| docs/design/_archive/VERIFY-DOCONLY.md | CLI | 2b-1 归档（移 _archive/） | 移档 |
| docs/guides/ides.md | CLI | 2b-2 demux | ~+15 |
| docs/TODO.md | CLI | 2b-5 折行 ×2(:74/:87) | ≤±2 |
| docs/design/README.md | CLI | 2b-6 移除 VERIFY-DOCONLY 地图条目 | ≤±2 |
| docs/design/SETTINGS-TOOL.md | CLI | 2b-6 去 VERIFY-DOCONLY 先例 | ≤±1 |
| docs/CAPABILITY_GAP.md | VSC | 2a-2 + 2b-3 | ~+10 |
| METHODOLOGY.md（根级——VSC 仓） | VSC | 2a-5（2026-09-08 用户裁并入） | ≤±1 |
| STRUCTURE-DEBT.md | CLI | 执行核销（已标注——随批收尾核销行） | ≤±1 |

## 4. 验收

- AC1 2a-1/2a-3：AGENT-LOOP.md:94 无 memory_search 旧名 + TOOLS.md:4 指针指 EDIT-HELPERS.md
- AC2 2a-2 + 2b-3：CAPABILITY_GAP.md memory 单工具 + VSC 实际路径 + 干净格式
- AC3 2a-4：R7f 豁免注在 §12.2
- AC4 2b-1：VERIFY-DOCONLY 并入 VERIFY-REDESIGN 变更记录（前身吸收行——含 isDocFile 三处判定历史）+ 移 _archive/（不残留坏格式——定案 a）
- AC4b 2b-6：归档后无悬空引用——README.md:39 无 VERIFY-DOCONLY 活条目 + SETTINGS-TOOL.md:3 无先例引用
- AC5 2b-2/2b-4/2b-5：ides.md demux + docs/design 全部 15 条 >300 折行（7 档）+ TODO 2 条折行——全部 >300 清零（双端 scripts/check-doc-width 跑绿）
- 双端 scripts/check-doc-width.mjs 跑绿（或等效宽度检查——判据①）

## 5. 剔除项

- 批 A A1-A8/V1-V5 已执行主体（不重复——STRUCTURE-DEBT §8 已标注执行后状态）
- 已实现专题孪生对（A7/V3——保留重写已落地无需动）

## 变更记录

- 2026-09-08：立项。批 A 执行后核销（explore）——规划表更新为执行后状态 + 净剩余落本档。纯文档批——与批 1（代码小修）独立域。
- 2026-09-08：用户裁两点——2a-5 并入（VSC METHODOLOGY 指针修正）+ 2b-1 定案 a（核实 VERIFY-REDESIGN D-V5/T-V5 接管 doc-only 机制 + 未提前身——并入其变更记录含 isDocFile 历史 → 归档）。设计定稿待评审。
- 2026-09-08：两次评审超时（600s 验证引用扫描面大）——中途线索人工采纳——2b-4 扩全量折行（实测 7 档 15 行——远超原估 3 行）+ 2b-5 行号校准（:74/:87——非 :83）+ 2b-6 转正归档引用清扫（README:39/SETTINGS-TOOL:3——归档后悬空自查漏）——待重评审。
