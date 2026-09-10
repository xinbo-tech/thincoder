# VSC 端镜像（第 1/2/4 批机制搬到 thincoder-vscode）· 批次记录（2026-09-10）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer；**本批由父侧代写并打标**——本会话为 VSC 宿主，工具面只暴露 explore/plan/eng-coder，eng-designer 尚不可 spawn，正是本批要修的事）·
> §3 设计评审（**评审子代理**——本批工具落地后用 `batch_segment` 自写，落地前由父侧代写并**打标**）· §4 用户批准（主 agent）· §5 实施记录（**eng-coder**）· §6 验证与收口（**父代理**）。
> 不是规格：需求在 `requirements/` 成文（本批 = §1.17/FR23）；整批做完整档冻结。机制与模板见 `requirements/ENGINEERING-MODE.md` §1.12。
> **本档 = 第 5 批**（第 1 批 `2026-09-10-ENGINEERING-MODE.md` · 第 2 批 `2026-09-10-ENG-DESIGNER.md` ·
> 第 3 批 `2026-09-10-MODEL-SELECTION.md`〔并行会话〕· 第 4 批 `2026-09-10-BATCH-SEGMENT-TOOL.md`）。

---

## §1 讨论（主 agent）

### 批次范围

**第 5 批 = VSC 端镜像**——把 CLI 仓已核销的三批机制**完整搬到 `thincoder-vscode`**：

| # | 搬什么 | CLI 权威落点 |
|---|---|---|
| ① | **batchDoc 门**（spawn 注入批次档路径 + 「参数在 + 路径可读，否则拒」） | 第 1 批 · `src/agent-tools/subagent-spawn.mjs` |
| ② | **eng-designer 角色 + 行为纪律**（六段自写 / 执行者拒收 / 澄清必经主 agent / 三方条目一致） | 第 2 批 · `setup.mjs` + `subagent.mjs` + `prompt-overlays.mjs` + 人格文件 |
| ③ | **文档更新纪律 D1-D7 + 机械校验 V1/V2** | 第 2 批 · `scripts/check-doc-width.mjs` + `test/doc-consistency.test.mjs` + 基线 |
| ④ | **`batch_segment` 工具 + V3**（§3 自写通道） | 第 4 批 · `src/agent-tools/batch-segment.mjs` + advisor 参数/实例键 + `check-doc-width` V3 |

**不在本批**：CLI 侧任何改动（三批已核销）；平台可观测性族（advisor 池盲区 / abort 无标注 / live 块）；工程模式可移植性 FR10-FR15；TUI 开放项。

### 谈成什么（逐条——2026-09-10 用户裁定）

1. **范围 = 三批全搬**（用户原话选定：「能 spawn eng-designer，让它自己写需求/设计（含 §2 任务书）——把 CLI 三批全搬」）。
   **终局判据 = 本 VSC 会话能 spawn eng-designer 并令其自写 §2/设计档**。
2. **验收两层**（用户选定：「你手动重载扩展后自验」）：①机械面全绿（VSC 测试 + 新用例）②**用户手动重载扩展后亲手跑一遍 eng-designer**。
   第 2 批踩过的坑入档：**「文件在了」≠「机制活了」**——源码改动需重载扩展才生效，本批不得再拿静态存在冒充生效。
3. **提示词双源 = 双源**（用户选定）：VSC 也**新建** `docs/design/prompts/` 中文权威镜像，与 CLI 结构完全对齐（现 VSC 为单源 14 文件）。
4. **语义同源、原文自持**（沿用 VSC 自定纪律 `src/prompt-overlays.mjs:5`）：两端**不共用代码**，各自实现，语义必须同源。

### 勘察结论（explore 2026-09-10——**跨仓映射，只读**）

**可行性：三批都「不可直接照抄」，需适配——适配量差异大。**

| 面 | 判定 | 关键事实（实测） |
|---|---|---|
| batchDoc 门 | 需适配（落点不同） | VSC **无** CLI 的 `subagent-spawn.mjs` 双路装配单点；阻塞 spawn 在 `subagent.mjs:150+`、异步在 `subagent-async.spawnAsyncSubagent:216`。**机制本体零冲突，可逐字移植** |
| eng-designer 角色 | 需适配（工作量最大） | 角色判据 / role enum / 装配分支 / **webview 角色枚举 4 处** / 人格文件**全部不存在**；同类骨架在（`prompt-overlays.SCENARIO_SLOT_FILES`、`modeRoleField`） |
| `batch_segment` | 需适配（advisor 落点不同） | 工具本体可照搬；VSC 的 `advisorToolsFor` 在 **`src/advisor/tools.mjs:26`（单参）**，`runAdvisorReview` 多 `rv` 实例参数（CLI 为 `batchDoc` 参数通道） |
| V1/V2/V3 | 缺该机制 | VSC `check-doc-width.mjs` **51 行只有宽度检查**、无导出/无 CLI 模式、**未接任何自动化**（快层目标是显式清单 `test/files.mjs` 28 条，无通配入册） |
| 提示词双源 | **新建结构** | VSC 单源 `src/prompts/` 14 文件，`docs/design/prompts/` 不存在；VSC 自己的 `docs/design/README.md:30` 写明「机制权威 = CLI 仓」 |
| **最干净可照抄点** | — | **`src/prompt-overlays.mjs`：VSC 82 / CLI 83 行，逐行同构**，唯一差异 = CLI 多的两行 eng-designer 条目（CLI:26、CLI:52） |

**零命中清单（未推断）**：`batchDoc`（全 VSC `src/`）· 任何 `batch*.mjs` · `eng-designer`（`_role`/enum/场景表/webview 表）· `docs/design/prompts/` · `docs/requirements/`·`docs/batches/` · `test/doc-consistency.test.mjs` + 基线 · 三批提示词锚句（六段自写/执行者拒收/澄清必经主 agent/三方条目一致/D1-D7）。

### 对账结果（与既有文档/裁定的冲突）

| # | 现存表述 | 本批处置 |
|---|---|---|
| 1 | VSC `docs/design/README.md:30`「本端 14 文件…机制权威 = CLI 仓 `PROMPT-SYSTEM.md`」 | 本批建 `docs/design/prompts/` 双源 → 该句须改写（父侧登记，设计列入受影响文件） |
| 2 | VSC `AGENTS.md:120`「1060+ tests / explicit file list in package.json」 | 与现状（`test/files.mjs` 28 条）口径不一致——**非本批引入**，建议以 `test/files.mjs` 为准；登记待办 |
| 3 | VSC 无 `docs/requirements/`·`docs/batches/` 树 | 本批**只建 `docs/design/prompts/`**；V1/V2 扫描域对缺失目录跳过（待设计定）——**批次档仍落 CLI 仓 `docs/batches/`**（本档即证） |
| 4 | 两端档位边缘：CLI `advisor-async.mjs` 恰 500 / `run.mjs` 497 | VSC 镜像新增代码前**先给档位账**（设计受影响文件表带 as-of 行数 + 增量上限） |

### 本批需求清单（回读给用户 → 用户确认）

| # | 需求点 | 归属 | 状态 |
|---|---|---|---|
| 1 | **FR23 F1-F7**（batchDoc 门 / 角色 / 行为纪律 / `batch_segment` / V1-V3 / 双源 / 镜像锚） | §1.17 | 已收口 |
| 2 | **FR23 N1-N5**（语义同源 / 零回归 / 可机械验证 / 两层验收 + 重载前置 / 档位纪律） | §1.17 | 已收口 |

### 状态

**已收口 2026-09-10**（用户确认：范围三批全搬 · 双源结构 · 验收两层含手动重载自验 · 语义同源原文自持）。下一步 = **设计**（落 `docs/design/ENGINEERING-MODE.md` §2.22 + §2.23，含镜像锚逐字定稿）。

### 过程留痕

- 本批是**跨仓**批（`thincoder` → `thincoder-vscode`）：需求档/批次档/设计档仍在 CLI 仓（机制归属板块不变），**实现面**在 VSC 仓。
- 勘察由 explore 子代理完成（只读、未改任何文件；报告的口径与未验证项已如实标注：`npm test` 等**未实跑**，「VSC 的 check-doc-width 不跑」= 静态接线结论）。

---

## §2 批次任务（eng-designer 自写）

> **父侧代写并打标（2026-09-10）**：本会话为 VSC 宿主，工具面只暴露 explore/plan/eng-coder——**无法 spawn 设计者，故由主 agent 代写本节**（与 §1.12 一段一作者不冲突：宿主能力缺失下的打标代写）。

### 本批覆盖的需求条目

FR23 F1-F7 + N1-N5——逐条见 `docs/requirements/ENGINEERING-MODE.md` §1.17（三层：功能 / 非功能 / 四项待设计选型，已收口）。

### 明确不在本批的条目

| 项 | 去向 |
|---|---|
| CLI 仓任何改动（第 1/2/4 批已核销） | — |
| 平台可观测性族（advisor 池不可查/不可取消 · abort 无来源标注 · live 块） | 单列待设计 |
| 工程模式可移植性 FR10-FR15 · VSC git 工具镜像缺口 | 单列 |
| **VSC 自建 `docs/requirements/`·`docs/batches/` 树** | 不做（批次档单一归属 = CLI 仓，见 §2.22.6） |

### 受影响文件（带当前行数 + 预计增量）

**权威表 = 设计档 `docs/design/ENGINEERING-MODE.md` §2.23**（VSC 仓实测 as-of 2026-09-10；代码面 23 项 + 提示词面 6 项，逐项带行数与增量上限，已含拆分结论）。
**唯一逼近硬顶**：`src/agent-tools/subagent-async.mjs` 489 + ≤10 = 499——越 500 停下报告并带拆分计划。

### 验收标准（逐条回指需求）

**实施者自验以设计档 §3.1 / §3.2 为准**，不得转述：

- **AC37**（batchDoc 门两路 + 角色域 + schema/delete 清单）· **AC38**（eng-designer **八处** + 勘察通道⑨必搬）· **AC39**（文本类锚 A1-A8/A11/**A12** 逐字；A9/A10 行为锚）· **AC40**（工具移植 + 只读面）·
  **AC41**（rv 实例键）· **AC42**（V1/V2/V3 + 接线钉死 files.mjs + 跨仓边界）· **AC43**（双源 + 端特有段）· **AC44**（验收不冒充）。
- **用例表 T54–T65**（含 T55b/T57b/T65）——输入/预期输出已定死，实现后必须全绿。
- **验收两层（需求 N4）**：①机械面全绿 ②**用户手动重载扩展后 spawn eng-designer 自验**——交付报告必须写明“生效需重载”。
- **主 agent 人格面同批**（轮次2 评审 #1）：`persona-engineering.md` 双源含产品经理身份 + spawn eng-designer 调用链（A12）——中文权威与英文落地不得互斥。

### 任务书就绪（本节即任务书——spawn 传路径，不另写副本）

**就绪**。实现 = **2 个并行 eng-coder**（文件域不相交，见 §2.22.8）：面 ① 代码面 / 面 ② 提示词双源面；两面的 `files` 声明交调度器。

## §3 设计评审（评审子代理自写）

### 轮次与发现（发现摘要 / 🔴 处置——**凭证值不落档**）

_（本工具落地前：父侧代写并打标；落地后：`batch_segment` 逐轮追加 `### 轮次 N（评审子代理）` + 完整发现表 + VERDICT + 计数）_

## §4 用户批准（主 agent 记）

### 批准（日期 + 批准范围）

_（待用户批准）_

## §5 实施记录（eng-coder 自写）

### 交付摘要（改了什么 / 碰过的文件 / 如何验证）

_（待实施）_

### 交付透明表（Done / Simplified / Not done）

_（待实施）_

### 审计与代码评审（轮次 / 终态 clean|stalled）

_（待实施）_

### fix round（如有：发现 → 修复）

_（待实施）_

## §6 验证与收口（父代理自写）

### 父侧验证（L2 全量结果 + verify）

_（待核销）_

### 逐条验收结论（通过 / 未过 / 未做 + 理由）

_（待核销）_

### 需求池核销

_（待核销）_

### 核销同步清单（逐项核：角色表 / 状态行 / 计数 / 指针 / 变更记录 / 待办勾销）

_（待核销）_

### 遗留项

_（待核销）_
