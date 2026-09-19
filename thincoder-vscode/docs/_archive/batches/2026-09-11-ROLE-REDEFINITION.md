# 批次记录（本仓份）— ROLE-REDEFINITION（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-ROLE-REDEFINITION（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **5** 条目 = discipline-engineering VSC×2 + persona-eng-coder VSC×2 + prompts-mirror-anchors VSC×1）；源档 blob SHA = 5e9810b10f8e。
> 源档案内锚：§5 `:184` / `:191` 分端（CLI 4 档 + AGENTS/README + 2 测试档）。

## 本仓份（逐字自源档搬运）

**落笔对表（13 档——逐字源 = 设计档 §2.28.4；本仓份 = 下表 VSC 行）**：

| # | 文件（端） | 落笔 |
|---|---|---|
| 1–4 | `discipline-engineering.md` ×4（CLI/VSC × src/docs） | RF-1 替句「实现后验收勾销落批次档 §6（设计档内不写勾销状态）。」+ RF-4d 头注「eng-coder + eng-designer subagents — all engineering-mode assemblies」/ zh 同型（逐字源 :1378/:1416） |
| 7–8 | `persona-eng-coder.md`（VSC src/docs） | 同上 + RF-4c：EN 自审第 6 条替句 + 粘连断行修复（`Your last message…` 起新行）；zh ⑥ 替句（:1413–1415） |
| 13 | `test/prompts-mirror-anchors.test.mjs`（VSC） | 新增 ⑧ 组（勾销/自审第 6 条/身份句/头注——本端四端面）+ 头注七面→八面（RF-6 :1427） |

> 上表行号为源档行号；行 1–4 中 **VSC 两行（src/docs 两面）= 本仓份**，CLI 两行为对端份（留源档）；行 7–8 全为本仓份。

**AC 自证（源档 §5 行内——本仓相关）**：AC61 ✅ 4 面旧句零命中 + 两替子串在位 · AC64 ✅ 4 面旧句零命中（`architect`/`架构师`/`provided a design document`/「父代理提供了设计文档」）、新子串在位；**VSC 自审第 6 条双面替句在位** · AC66 ⚠️ 本批文件新增超宽 0 / 新增一致性违规 0（批前/批后差集）；**VSC 快层全绿**。

**测试实测值（源档 §5 行内）**：VSC 定向 `node --test test/prompts-mirror-anchors.test.mjs` = **9/9 pass**；VSC 快层 = 447 / 441 / **0 fail**；`node scripts/check-doc-width.mjs` = 本批 13 档**零命中**。

**审计与代码评审（源档 §5）**：explore 偏差审计 1 轮——四类偏差全 0；advisor 代码评审 1 轮 **pass**（🔴0 · 🟡4 · 🔵3）→ 裁决 Fixed 1 / Not an issue 2 / Deferred 4；复跑定向测试绿。**终态 = clean**。
