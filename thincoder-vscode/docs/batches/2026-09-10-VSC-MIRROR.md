# VSC 端镜像（第 1/2/4 批机制搬到 thincoder-vscode）· 批次记录（2026-09-10）

> 搬迁注记：本档自 CLI 仓 `2026-09-10-VSC-MIRROR（CLI 仓）` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = 8778288e05ba · 源提交 = 05d0946）。

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
| 1 | VSC `docs/design/README.md:30`「本端 14 文件…机制权威 = `PROMPT-SYSTEM（CLI 仓·需求）`」 | 本批建 `docs/design/prompts/` 双源 → 该句须改写（父侧登记，设计列入受影响文件） |
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
| **需求档 §1.17 N3 计数口径修正**（“双源 29 文件” → “双源 15+15=30 档之宿主档”——轮次4 评审 #8） | **eng-designer 落笔**（写权表 §2.15 A2 / D1）——本批无 designer spawn（宿主不可），**入 TODO 待办**；不改此项不影响实现面（N3 为验证口径，由 AC43/T62 的 30 档断言覆盖） |

### 受影响文件（带当前行数 + 预计增量）

**权威表 = 设计档 `docs/design/ENGINEERING-MODE.md` §2.23**（VSC 仓实测 as-of 2026-09-10；代码面 23 项 + 提示词面 **8 项**〔含轮次2 新增的 A12 双源两行〕），逐项带行数与增量上限，已含拆分结论。
**唯一逼近硬顶**：`src/agent-tools/subagent-async.mjs` 489 + ≤10 = 499——越 500 停下报告并带拆分计划。

### 验收标准（逐条回指需求）

**实施者自验以设计档 §3.1 / §3.2 为准**，不得转述：

- **AC37**（batchDoc 门两路 + 角色域 + schema/delete 清单）· **AC38**（eng-designer **八处** + 勘察通道⑨必搬）· **AC39**（文本类锚 A1-A8/A11/**A12** 逐字；A9/A10 行为锚）· **AC40**（工具移植 + 只读面）·
  **AC41**（rv 实例键）· **AC42**（V1/V2/V3 + 接线钉死 files.mjs + 跨仓边界）· **AC43**（双源 + 端特有段）· **AC44**（验收不冒充）。
- **用例表 T54–T66**（含 T55b/T57b/T57c）——输入/预期输出已定死，实现后必须全绿。
- **验收两层（需求 N4）**：①机械面全绿 ②**用户手动重载扩展后 spawn eng-designer 自验**——交付报告必须写明“生效需重载”。
- **主 agent 人格面同批**（轮次2 评审 #1）：`persona-engineering.md` 双源含产品经理身份 + spawn eng-designer 调用链（A12）——中文权威与英文落地不得互斥。

### 任务书就绪（本节即任务书——spawn 传路径，不另写副本）

**就绪**。实现 = **2 个并行 eng-coder**（文件域不相交，见 §2.22.8）：面 ① 代码面 / 面 ② 提示词双源面；两面的 `files` 声明交调度器。

## §3 设计评审（评审子代理自写）

### 轮次 1（评审子代理）与发现（发现摘要 / 🔴 处置——**凭证值不落档**）

> **父侧代写并打标（2026-09-11）**：本工具落地前无写入通道（`batch_segment` 未实现）——以下轮次 1 发现表由主 agent 按设计评审报告逐条转写，**每条带编号**（供设计档 §2.22 的「发现 #N」解析——轮次3 评审 #10）。
>
> **父侧形态更正（2026-09-12）**：本小节标题原为「轮次与发现（…）」——补轮次号以合 V3 轮次行机判（**轮次 1**）；**转写性质不变**（上注为准）。

**轮次 1（设计评审，2🔴 + 8🟡 + 4🔵）**（轮次4 评审 #6：原题头误写 1🔴——表内 #1/#2 均为 🔴）

| # | 级别 | 发现 | 处置 |
|---|---|---|---|
| #1 | 🔴 | F2 角色落点漏运行期门（白名单/模式门/子代门）——照设计落地 designer 根本 spawn 不出来 | §2.22.4 五处→八处 + 不变量 6 + T57 下沉 + T57b |
| #2 | 🔴 | 档位表无拆分结论（advisor 296→310 跨 300） | §2.23 逐档补拆/不拆 + 理由 |
| #3 | 🟡 | batchDoc 门角色域/schema 属性/受限变体 delete 清单未定 | §2.22.3 补角色域 + schema + delete + T55b |
| #4 | 🟡 | designer 勘察通道（CLI §2.15 D2/D3）未镜像 | §2.22.4 ⑨ |
| #5 | 🟡 | V1/V2 与接线两半无用例 | 新 T63/T64 |
| #6 | 🟡 | V3 在 VSC 结构性空转未交代 | §2.22.6 跨仓边界写死 |
| #7 | 🟡 | 锚 A1 无 VSC 落点（逐字源在 CLI requirements） | 锚表加宿主列；A1 宿主改 VSC discipline-engineering 新增六段节 |
| #8 | 🟡 | 双源“逐字拷 CLI”与 VSC 端特有段互斥 | §2.22.7 端特有段进镜像 + AC43/T62 断言 |
| #9 | 🟡 | 档位账自相矛盾（→171 却带 >300 注） | 删旧括注（后于轮次2 再校准为 ≤+247） |
| #10 | 🟡 | 批次档 §2 仍骨架（任务书未落） | §2 由父侧代写并打标 |
| #11 | 🔵 | 计数口径 27/28 未标 | §2.22.6 写明 28 条清单项 / 27 个 `.test.mjs` |
| #12 | 🔵 | `docs/design/README.md` 行未标仓 | 改 `thincoder-vscode/docs/design/README.md` |
| #13 | 🔵 | “両側”字形 | 统一“两侧” |
| #14 | 🔵 | spawn 样例行缺 `batchDoc=`（未入锚/改动面） | 新锚 A11 |

**轮次 2（设计评审，1🔴 + 8🟡 + 5🔵）**

| # | 级别 | 发现 | 处置 |
|---|---|---|---|
| #1 | 🔴 | VSC 主 agent 人格面缺位（`persona-engineering.md:10-13` 仍 ARCHITECT，与带入的 A1/A4 同装配互斥） | 新锚 **A12** + §2.23 补双源两行 + **T65** |
| #2 | 🟡 | 用例表标题 T54–T62 滞后 | 标题更新（本轮再修为 T54–T66） |
| #3 | 🟡 | §3 轮次 1 发现未落档 + 「发现 #N」无落点 | **本表（带编号）** + 设计档处置段逐条化 |
| #4 | 🟡 | AC38 ⑨ 留“不搬”降级口 | 改必搬（**本轮回写正文，见轮次3 #1**） |
| #5 | 🟡 | 接线二选一（files.mjs / package.json） | 钉死 `test/files.mjs` |
| #6 | 🟡 | check-doc-width 估算与 CLI 实测差百行 | 上限对齐（本轮再校准为 ≤+247） |
| #7 | 🟡 | 提示词面测试档位标注缺失 | anchors +≤120；files.mjs +≤8 |
| #8 | 🟡 | AC39 对 A9/A10 不可机判 | 文本类锚/行为锚分治 |
| #9 | 🟡 | 跨仓节引用无处置口径 | §2.22.7 处置（V1 判据于**轮次3 #7** 补全） |
| #10 | 🔵 | “余 14 档都改”措辞 | 收紧为仅锚句宿主档 |
| #11 | 🔵 | “见下表末行”相对指针 | 改“见本节 ⑨” |
| #12 | 🔵 | child 任务文本行是否同形未定 | 定镜像（T54 断言于**轮次3 #11** 补全） |
| #13 | 🔵 | 镜像差异表宿主未定 | 钉死 VSC `docs/design/README.md` 新增节 |
| #14 | 🔵 | 终局判据指针标注错 | 改 FR23/§1.17 |

**轮次 3（设计评审，1🔴 + 6🟡 + 6🔵）**（轮次4 评审 #7 补登——与设计档 :1039-1045 处置段对应）

| # | 级别 | 发现 | 处置 |
|---|---|---|---|
| #1 | 🔴 | 勘察通道同档两说（正文留“不搬”退路 vs AC38/任务书“必搬”） | 删退路句，正文改“必搬 + 遇阻停下报告”（设计档 :736） |
| #2 | 🟡 | 用例表标题未随轮次2 更新（写 T54–T64，实有 T65；T62 未归位） | 标题改 T54–T66 + T62 归位 |
| #3 | 🟡 | 不变量 3 写“锚句 A1-A11”（含行为锚 A9/A10、漏 A12） | 改“文本类锚 A1-A8/A11/A12；A9/A10 行为锚” |
| #4 | 🟡 | AC41（rv 实例键并发）无用例承载 | 新 **T66**（镜像 CLI T51） |
| #5 | 🟡 | AC38 ⑨ 验收面与工具面双缺（④ 未列勘察工具；T57 只断言 batch_segment/advisor） | ④ 明列勘察通道工具 + 新 **T57c** |
| #6 | 🟡 | 任务书“提示词面 6 项” vs §2.23 实为 8 行（A12 双源两行未同步） | §2 改 8 项 |
| #7 | 🟡 | 跨仓节引用缺机判规则（“（CLI 侧）”注记如何处置未定） | §2.22.7 写死 V1 豁免判据 + 入 T63④ |
| #8 | 🔵 | check-doc-width 上界算术不自洽（+≤250 → 301 越 300） | 改 ≤+247（→298） |
| #9 | 🔵 | 需求 N3“双源 29 文件” vs 设计 30 档；修正口径无落点 | 入 designer 任务书项（本档 §2 待办） |
| #10 | 🔵 | 「发现 #N」无解析源 | 本档 §3 落带编号的轮次 1/2 发现表 |
| #11 | 🔵 | “注入行同形（T54 断言）”与 T54 实际断言不符 | T54 补任务文本注入行断言 |
| #12 | 🔵 | 差异表宿主增量 ≤±4 与“新增节”不符 | 改 +≤20 |
| #13 | 🔵 | 新增测试档计数口径不一（5/6/5+fixture） | 统一“5 new test + 1 fixture” |

## §4 用户批准（主 agent 记）

### 批准（日期 + 批准范围）

**2026-09-11 · 用户批准（原话：「批准」）**——批准范围：

1. **设计** `docs/design/ENGINEERING-MODE.md` **§2.22–§2.23**（VSC 端镜像）+ **AC37–AC44** + **T54–T66**；
2. **评审链**：设计评审 **轮次 4 PASS**（token 由平台签发给本会话——**凭证值不落档**）；PASS 后 advisory（9🟡+5🔵）已**同链全修**（无新范围，不触发重评审）；
3. **实现方式**：**2 个并行 eng-coder**（面① 代码面 / 面② 提示词双源面，文件域不相交，`files` 交调度器）；任务书 = 本档 **§2**。

**附带条件**：① 两处档位硬上限（`subagent-async.mjs` ≤499；`check-doc-width.mjs` ≤+247 或拆 `doc-consistency.mjs`）；越线停下报告。
② **§5 由父侧按两面交付报告代写并打标**（两个并行子代理会同写同一档——避免并发写冲突，沿用 §3 同款代写打标通道；`batch_segment` 需下次进程启动才生效）。
③ 验收两层（需求 N4）：机械面全绿 + **用户手动重载扩展后 spawn eng-designer 自验**。

## §5 实施记录（eng-coder 自写）

> **父侧代写并打标（2026-09-11）**：两个并行 eng-coder（面① 代码面 / 面② 提示词双源面）会写同一档，为避免并发写冲突按 §3 同款代写打标通道转写；两面交付报告全文在各自会话，以下为逐条转写。`batch_segment` 需**重载扩展**后生效（生效前置见下）。

### 交付摘要（改了什么 / 碰过的文件 / 如何验证）

**面① 代码面**（20 改 + 6 增）：`batch-segment.mjs`(184 行,契约同 CLI)· batchDoc 门（共享 `resolveBatchDoc` @ `subagent-spawn-gate.mjs` + 阻塞/异步两路各一调用点 +
  角色域 `{eng-coder,eng-designer}` + schema 属性 + 受限变体 delete 清单 + `child._batchDoc` + 任务文本 `Batch record (batchDoc): <abs>` 行·同形无退路）·
  eng-designer **八处**全落（白名单+错误文案/第三模式门/子代门/装配含 batch_segment+勘察通道/enum/overlays 两行/webview 四处/人格档属面②）·
  advisor 适配点①（`advisorToolsFor` 三参,仅 design+已绑定,代码评审工具集逐字节不变）+ ②（`rv.batchDoc` 实例键；同步路 `callbacks.batchDoc`——无 rv,已注明）·
  `check-doc-width.mjs` 51→297（宽检+V1/V2/V3+基线+导出,V1「(CLI 侧)」豁免,缺目录跳过）· 接线钉死 `test/files.mjs`（5 新档全入册）。
**面② 提示词双源面**（18 增 + 8 改）：新建 `docs/design/prompts/` 15 档中文权威（逐字拷 CLI；9 档 identical,6 档差异全登记）·
  端特有段 3 处进镜像（R14 池规则/persona 独有段/persona-eng-coder 实现纪律节）· 跨仓节引用按「能对上改写、对不上注（CLI 侧）」处置（**零悬空引用**）·
  `src/prompts/` 14→15（新建 `persona-eng-designer.md`）+ 锚句宿主 6 档定点改（A1/A2/A4/A6/A7/A11 → discipline-engineering 新增六段节+D1-D7+A7+A11 样例；
  A5/A6 → advisor 三档 §3 落档节；A3 → persona-eng-coder；**A12 → persona-engineering 身份段/调用链段**）· 新建 `test/prompts-mirror-anchors.test.mjs`(203 行,五面断言)·
  `docs/design/README.md`「机制权威」句改写 + 镜像差异表 9 行。

**如何验证**：VSC 仓 `npm test` **353/352 pass / 0 fail / 1 skip**（含两面新档）；CLI 仓 `npm test` **341/330 / 0 fail**
  （基线补 1 条 V3 工具前时代批次档——T41① 真阳性,按 §2.19 存量入基线）；`check-doc-width` 新增违规 0；档位 `subagent-async.mjs` **499 ≤499**、`check-doc-width.mjs` **297 ≤298**；A12 抽验（VSC persona-engineering 无 ARCHITECT 句,含 PM 身份+调用链）。

### 交付透明表（Done / Simplified / Not done）

| 项 | 状态 |
|---|---|
| batchDoc 门（两路+角色域+schema/delete+双形态注入+同形无退路） | Done（面①） |
| eng-designer 八处 + ⑨勘察通道（explore-only/sync/不计审计预算） | Done（面①） |
| batch_segment 契约 + advisor 适配点①② + 代码评审工具集逐字节不变 | Done（面①） |
| V1/V2/V3+基线+接线（files.mjs 钉死）+ 跨仓边界 + V1「(CLI 侧)」豁免 | Done（面①） |
| 15 档中文镜像 + 端特有段进镜像且被断言 + 跨仓引用零悬空 + 差异表 9 行 | Done（面②） |
| 锚句宿主定点改（A1-A8/A11/A12 宿主）+ persona-eng-designer 新建 + A12 人格改述 | Done（面②） |
| Simplified | 无 |
| 越界改动（已登记报备） | 面①：subagent-run(+2 绑定透传)/AGENTS.md(+1 模块图)/subagent-spec(角色矩阵对齐)/prompts-async-guidance(+2 接线)/两处测试缝；面②：discipline-engineering:38 语境注改述（与新增 A1 六段节同档互斥）/persona-engineering 端特有段样例补 batchDoc= |
| Not done（如实列出） | ① AGENT-LOOP §18/§25 节号统一改号（需同批改 src 双源——超出锚点范围，镜像已注）② docs/design/VSC-PROMPTS.md 未随批更新（装配矩阵缺 eng-designer 行——**designer 写域**）③ 设计档 §2.23 as-of 行数已位移（as-of 快照不当契约）④ 镜像锚测试依赖兄弟仓（缺仓 fail-closed）⑤ V3 占位行判据两端同调问题 ⑥ subagent-spec.mjs 未入 §2.23 表（设计档缺口） |

### 交付透明表（Done / Simplified / Not done）

### 审计与代码评审（轮次 / 终态 clean|stalled）

### fix round（如有：发现 → 修复）

## §6 验证与收口（父代理自写）

### 父侧验证（L2 全量结果 + verify）

**2026-09-11 父侧核验（架构师）**——两面内层协议已各自完成（面① explore 审计+advisor 评审+修正轮 1/5+复审计，终态 **clean**；面② explore 审计+advisor 两轮，终态 **clean**），父侧做合流核验：

| 核验项 | 结果 |
|---|---|
| VSC 仓 `npm test`（两面合流） | **353/352 pass / 0 fail / 1 skip**（含两面全部新档） |
| CLI 仓 `npm test`（零回归面） | **341/330 / 0 fail**（基线补 1 条 V3 工具前时代批次档——T41① 真阳性，按 §2.19 存量入基线，非缺陷） |
| 锚点抽验（面①） | ROLES 含 eng-designer+错误文案 / resolveBatchDoc+两路调用点 / advisorToolsFor 三参 / batch_segment 无 path+戳仅 §3 / V1-V3 函数齐 / V1「(CLI 侧)」豁免 / 5 新档入册 ✓ |
| 锚点抽验（面②） | 镜像 15↔15 集合相等 / A12 正反断言（无 ARCHITECT 句、含 PM 身份+调用链）/ 端特有段（R14）进镜像 / 新测试档 203 行 ✓ |
| 档位 | `subagent-async.mjs` **499 ≤499** · `check-doc-width.mjs` **297 ≤298**（未触发拆分退路） |
| 越界改动 | 面① 5 项 / 面② 2 项——**均已报备并核可**（同档互斥改述与样例同步属设计本意） |
| 面内 L0 | 面① 83/83+129/129；面② 48/48；宽度/一致性 0 新增违规 |

### 逐条验收结论（通过 / 未过 / 未做 + 理由）

### 需求池核销

- 2026-09-11：`docs/TODO.md` 需求池「VSC 端镜像（FR23——第 5 批）」条目已勾销（FR23 实现面落地）；遗留项（designer 写域的文档同步、AGENT-LOOP 节号统一、VSC-PROMPTS.md 更新等）转入技术分组。

### 核销同步清单（逐项核：角色表 / 状态行 / 计数 / 指针 / 变更记录 / 待办勾销）

- [x] TODO 需求池勾销（FR23 条目 → [x]）+ 遗留项入技术分组
- [x] 设计档 `ENGINEERING-MODE.md` §7 补第 5 批核销行
- [x] 本档 §5（父侧代写打标，两面转写）+ §6 回填
- [x] 两端 L2 全绿（VSC 353 / CLI 341）
- [ ] **用户终局自验（需求 N4）**：重载扩展 → 本会话 spawn eng-designer → 看其自写 §2/设计档（**生效前置：源码改动需重载**）
- [ ] designer 写域同步（designer 落笔，需 CLI 会话或下批）：需求档 §1.17 N3 计数口径 · VSC-PROMPTS.md 装配矩阵 · AGENT-LOOP 节号统一

### 遗留项

1. **用户终局自验未做**（需求 N4 第二层）：重载扩展后 spawn eng-designer 实跑——验收权在用户；
2. **designer 写域文档同步**（需 eng-designer，本宿主不可 spawn）：需求档 §1.17 N3 计数口径 · `thincoder-vscode/docs/design/VSC-PROMPTS.md` 装配矩阵（缺 eng-designer 行、仍写 14 文件）· `AGENT-LOOP.md` §18/§25 节号统一（src 双源）；
3. **两端同调问题**：V3 占位行判据（只豁免 `_（…）_` 形态）——CLI/VSC 同调；
4. **镜像锚测试依赖兄弟仓**（缺仓 fail-closed 整档红）——建议独立 script 或显式 skip；
5. **`subagent-spec.mjs` 未入设计 §2.23 表**（设计档缺口——本批越界改动已报备）；
6. **并行会话共写 `subagent.mjs`**（MODEL-SELECTION 批 `resolveChildProvider` 1 行在途）——合入时注意。
