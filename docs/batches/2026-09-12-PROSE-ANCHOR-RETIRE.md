# 散文锚测试退役（PROSE-ANCHOR-RETIRE）· 批次记录 · **VSC 仓侧**（2026-09-12）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-12 04:26 · 来源 = 用户 2026-09-12 04:09–04:11 裁定（散文锚一律不做）+ 04:26 指示「批次档 cli/vscode 各一份」。

> **本档性质**：本批的 **VSC 仓侧记录**——同批 CLI 仓侧记录住 CLI 仓 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`。两侧**各持自身范围**；互引形态由本批设计裁定。

---

## §1 讨论（主 agent 记）

### 状态

**VSC 侧已开档 2026-09-12 04:26**。下一步 = **设计**。

### 用户裁定（VSC 侧自持表述——与 CLI 侧同源）

| # | 条目 | 裁定 |
|---|---|---|
| R1 | 退役类别 | **散文锚测试一律不做**——读档断言「某句在场/缺席」（`includes` / 逐字常量子串 / 查句子的正则）。**含双端提示词镜像锚**（本仓 `test/prompts-mirror-anchors.test.mjs` / `test/prompts-async-guidance.test.mjs` 的大头）——用户对「保留双端镜像锚」的建议明确否决 |
| R2 | 存量 | **全删**（无「保留待议」项）。依据 = 该类锚收益无实证；锚红后的动作永远是「把字改回去」（维护锚本身），不反映系统缺陷 |
| R3 | 保留面（**不删**） | **结构机检**一类：本仓 `test/doc-consistency.test.mjs`（引用能否解析 / 计数是否相符）· 行宽检查 · `slow` 门（归册防漏）——判据 = 断言**结构自洽**，非断言**句子在场** |
| R4 | 新增纪律 | **禁止新写散文锚**——纪律落点 = **提示词层**（本仓提示词双源 + 测试纪律档；见并行批 LEDGER-SELF-CONTAINED 的 R3 提示词层要求） |
| R5 | 双端对齐 | 与 CLI 侧同批对齐；**各端独立实现、语义同源**——不做 byte-identical、不加跨端同步依赖 |

### VSC 侧事实基线（实测——designer 起点）

| 项 | 实测 |
|---|---|
| `test/` 顶层 `.test.mjs` | **62 档** · 总行数 14651（**as-of 2026-09-12 04:26**；口径 = 顶层 `.test.mjs`——父侧 05:19 复测 62 ✓；原写「65 档」为初测口径混入子目录/非用例档，已更正） |
| **散文锚重型档**（读档 + `includes`/`assert.match` ≥3） | **28 档** |
| 这些档的用例数 | **约 330 用例 ≈ 全 suite 50%** |
| 最重的几档 | **口径与逐档用例数以本仓设计档 §8.1 清单为准**（as-of 2026-09-12）；父侧实测抽查：`prompts-async-guidance` **49 用例** · `prompts-mirror-anchors` **12** · `portability-vsc-advisor-context` **8** |
| 混装档（行为测试夹锚断言） | 存在（如 `config-pool` 21 用例 / 5 includes）→ **只退锚断言，不得整档删** |

### 判据（可机械归类——designer 据此产清单）

一条断言属**散文锚**（删），当且仅当三条同时成立：① 读**非测试档**（`src/**`、`docs/**`、`webview/**`、`AGENTS.md`、`README` 等）；② 断言其**文本内容**在场/缺席；③ 断言对象**不是可解析结构**。

**边界对照**：

| 断言 | 归类 | 处置 |
|---|---|---|
| 「台账头部含某句中文」 | 散文锚 | **删** |
| 「批档引用的 `WEBVIEW.md §12` 可解析」 | 结构机检 | **留** |
| 「`## 技术待办（N 条）` 的 N == 组内实条目数」 | 结构机检 | **留** |
| 「`status=` 取值 ∈ 六态」 | 结构机检 | **留** |

### 设计必须回答的问题（VSC 侧）

1. **本仓散文锚逐条删除清单**（`档:行` + 用例名 + 归类依据；混装档只列锚断言）——**不得按档删**；
2. **本仓结构机检的保留与不被弱化**（`doc-consistency` V1–V3 语义零改）；
3. **禁止新写散文锚的纪律在提示词层的落点**（本仓双源提示词）；
4. **与并行批 LEDGER-SELF-CONTAINED 的文件域重叠面**显式登记（两批都触本仓提示词档）；
5. 删除后**用例总数下降须与清单条数对得上**（可机判）；发布门不降（`lint → test:full → test:integration` 全绿）。

### 两侧一致性核验（主 agent 职责——2026-09-12 04:27 用户裁定）

用户口径：**这种一式两份的设计，designer 可能是各自写，写出来的东西可能不一样，但是主 agent 有义务检查两份的逻辑是否一致。**

**核验口径**（不是逐字比对——逐字一致是明令禁止的）：

| 维度 | 核验什么 |
|---|---|
| 裁定同源 | 两侧对 R1–R5 的**语义**是否同一——不得一侧禁、一侧放行 |
| 判据同一 | 「什么算散文锚」的判据三条 + 边界对照表两侧同口径；保留面（结构机检）两侧一致 |
| 边界同形 | 范围外 / 端差处置两侧一致 |
| **端差显式** | 允许的端差**是否逐条登记**（本仓 `docs/design/README.md` 「镜像差异表」先例 · `AGENT-LOOP.md:607` N-CL4「端差逐条登记不静默」）——**静默的端差 = 漂移，不得放过** |

**核验时点**：两侧设计均落档后、**评审前预检**（A3）内执行；核验结论连同差异表随「设计就绪待评审」一并报用户。

**提示词层落点**：本职责的提示词层条文由并行批 `LEDGER-SELF-CONTAINED` 的 **R8** 承载（**单一权威源**——本档只引用不重述）。

**依据（在案纪律）**：多实现面纪律 = 各端独立实现、**语义同源**、不做 byte-identical、**差异如实上报**。

### 待裁项裁定与缺陷处置（2026-09-12 04:41 用户「可以」）

| # | 事项 | 裁定 |
|---|---|---|
| **PA-A1** | 装配器 / 渲染出口传出的**提示词句子**断言（≈20 条） | **裁为「锚」→ 追加删除**——断言对象是提示词句子即属散文锚，**不因「不读文件」而得豁免**；本仓侧追加条数由修正轮出（含入 §8.1 清单） |
| **PA-A2** | `locales/*.json` 文本值**逐字**断言 | **维持现判（保留）** |
| **PA-A3** | 工具 `description` 静态文案（本仓 `settings-tool` T-S2.35） | **反向回退——保留**（产品契约面，非文档散文锁） |
| **PA-B1** | 缺陷 **b**（本仓设计档 §8.2 `:213` / AC-VT10 称「本端 `check-ledger.mjs`」——**本仓无该脚本** = 事实错误 / 端差未登记）· **d**（本仓 §8 `:96-97` 的跨仓引用——与并行批 `LEDGER-SELF-CONTAINED` 的 R1/R7 冲突） | **先修再评审**——由修正轮落地（CLI 侧登记同名项） |
| **PA-撤回** | 父侧首轮误报的「缺陷 a」 | **已撤回**（本仓惯例，见 CLI 侧同节） |

### 追加裁定（2026-09-12 05:11 用户当场质问——「涉及 VSC 的文档不在这边写」）

用户原文：「**我们没有定过不跨仓登记的原则吗？！为什么涉及 vsc 的文档不在这边写！**」

**指认的违规（父侧逐行核实）**：

| # | 位置 | 违规 |
|---|---|---|
| 1 | `thincoder/docs/requirements/TESTING.md:105`（F16） | 写「CLI + VSC **两仓同批**」= **CLI 仓需求档代 VSC 立规** |
| 2 | 本批 VSC 侧需求**无本仓落点** | `thincoder-vscode/docs/design/TESTING.md:97` 自述「需求现指 CLI 侧档（**已登记依赖——未消解**）」；`:268` 变更记录同述 |
| 3 | 父侧处置 | 把它登记为「已登记依赖——未消解」推给对齐轮 = **拿「以后再说」躲事**——与 R1/R6/R7 冲突，**用户否决该处置** |

**裁定（取代任何「跳仓承载 / 延后对齐」处置）**：

1. **VSC 侧 TESTING 需求必须在本仓落档**——`thincoder-vscode/docs/requirements/TESTING.md`（语义同源、**各端原文自持**，非复制）；
2. **CLI 仓需求档不得代 VSC 立规**——「两仓同批」类条文改为指本仓需求档；跟端一致性由「语义同源」声明承载；
3. **两侧指针全面对齐**——本仓设计档 / 批档中原指 CLI 仓需求档处，全部改指本仓档；
4. **该依赖本批就地消解**，**不挂对齐轮**。

**执行**：已作为修正轮 **id=10 的第 9 条交付**下达（已送达）。CLI 侧记录的 §1 同条登记待 #10 收笔后补（避开并发写）。

### 验收标准（用户 2026-09-12 05:17 裁定——「我只有一个标准：vscode」）

用户原文：「**我不管你怎么干，我只有一个标准:vscode**」

**裁定**：本会话全部工作的**唯一验收基准 = thincoder-vscode 侧完整落地**：

1. **VSC 文档体系成套**——`docs/requirements/`（按对位蓝图）· `docs/README.md` · `docs/batches/` · `docs/design/` 全对位；**缺项补建，不得只搭骨架**；
2. **VSC 实现面同批落齐**——本批 VSC 侧清单 / 机检 / 提示词**在本仓内落地并跑绿**，不得只落 CLI 侧；
3. **本仓门禁为验收依据**——`lint → test:full → test:integration`（`vscode:prepublish` 三环）全绿；
4. **判定句**：**CLI 侧完成 ≠ 完成**；VSC 侧未齐即未完成。

### 范围外

- CLI 仓侧范围（见 CLI 仓 `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`）；
- 台账 / 批档 / 需求档的各仓自持（并行批 LEDGER-SELF-CONTAINED）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

---

### 本批任务——散文锚退役（PROSE-ANCHOR-RETIRE · VSC 仓侧执行面）

> 目标（为什么）：让本端测试只在**系统行为 / 结构自洽**上红——消灭「读档断言某句在场/缺席」这类改一字即红、失败零信息量、锚红后动作永远是「把字改回去」的断言（判据三条与边界对照见本档 §1）。
> 依据：该类锚收益无实证；成本实测 = 本端顶层测试 62 档中粗筛 28 档 / ≈330 用例（≈ 本端 suite 50%）；逐条判定后收敛为 101 条处置行（差额成因见 `docs/design/TESTING.md` §8.1 对账条）。
> 保留面对照：结构机检有实证战果（本批讨论当刻 `docs/design/TESTING.md` 一致性检查报出真问题）——保留面判据零改。
> 设计全文 = 本仓 `docs/design/TESTING.md` §8（§8.1 逐条删除清单 · §8.2 本端执行面要点 · §8.3 验收 AC-VT8–AC-VT12 · §8.4 边界 · §8.5 文件域重叠面 · §8.6 两侧记录与跨批协调）——**已定稿（含 2026-09-12 修正轮二）**，执行轮以该节为准。
> 判据与口径裁定（共享语义源）：其指针已在 `docs/design/TESTING.md` §8 头注登记（D2 单一权威源——本档不重述）。
> 需求侧：本端 TESTING 需求自持于本仓 `docs/requirements/TESTING.md`（F15–F22 / N10–N12——2026-09-12 修正轮二新建；语义同源、各端原文自持）。

#### 1. 覆盖条目（本批 5 条）

| # | 条目 | 落点 | 状态 |
|---|---|---|---|
| 1 | 本端散文锚逐条删除——27 档 · 整删 61 · 段删 40（= 101 条处置行） | `docs/design/TESTING.md` §8.1 | 清单已定稿，待实施 |
| 2 | 保留面不弱化——`scripts/check-doc-width.mjs`（行宽 + 一致性 V1/V2/V3 单源）· `test/doc-consistency.test.mjs` · slow 门，判据零改 | `docs/design/TESTING.md` §8.2 / §8.3 AC-VT10 | 设计已定，实施零改 |
| 3 | 禁写散文锚纪律落提示词层——本仓提示词双源「测试纪律」节加禁写句 | `docs/design/TESTING.md` §8.5；本档 §3 受影响文件 | 待 eng-coder 落笔（内容权归主 agent） |
| 4 | 对账可机判——本端用例总数 653 → 592（下降数 == 清单整删条数 61） | `docs/design/TESTING.md` §8.3 AC-VT8 | 待实施 |
| 5 | 双端纪律——零新增跨仓同步依赖 / 零 byte-identical 断言（各端原文自持） | `docs/design/TESTING.md` §8.3 AC-VT11 / §8.4 | 实施遵守 |

#### 2. 明确不在本批（外）

- 他仓（CLI 仓）执行面——其清单与本端各自自持，本端不代述、不代判；
- 保留面（`scripts/check-doc-width.mjs` 的 V1/V2/V3 · `test/doc-consistency.test.mjs` · slow 门）的**语义与判据改动**；
- 台账机检（L1–L3）判据改动与台账本体内容治理（本端无该执行面——端差登记见 `docs/design/TESTING.md` §8.2）；
- 行为测试的增删改；新增测试档；本端登记制与两清单边界（`test/files.mjs` / `test/integration/files.mjs`）的任何改动；
- 既有验收 AC-VT1–AC-VT7 的语义；
- 需求落点新建与跨仓引用改指——**已就地消解（2026-09-12 修正轮二）**：本仓需求档已建、指针已对齐（原「归对齐轮」处置经用户 05:11 裁定否决）。

#### 3. 受影响文件（本仓实测——行数与用例数 as-of 2026-09-12）

**测试面**（27 档点名档；「预计净减」含连带常量 / import 清理，执行轮实测回填）：

| 档（`test/` 顶层） | 现状行数 | 用例数 | 整删 | 段删 | 预计净减 |
|---|---|---|---|---|---|
| activity-closure | 302 | 14 | 0 | 2 | −5 |
| activity-flow | 461 | 17 | 0 | 4 | −19 |
| activity-live-ux | 173 | 6 | 1 | 0 | −10 |
| advisor-chain-guards | 427 | 15 | 0 | 3 | −15 |
| advisor-context-budget | 179 | 8 | 1 | 1 | −15 |
| advisor-guard-completion | 341 | 11 | 0 | 3 | −11 |
| advisor-refusal-accounting | 239 | 11 | 1 | 0 | −9 |
| async-visibility | 410 | 10 | 0 | 1 | −8 |
| batch-doc-gate | 178 | 9 | 1 | 1 | −13 |
| child-permission | 533 | 19 | 1 | 1 | −27 |
| context-parity | 386 | 14 | 0 | 1 | −18 |
| digest-visibility | 199 | 9 | 0 | 2 | −7 |
| doc-consistency | 196 | 8 | 0 | 1 | −3 |
| eng-designer-role | 189 | 11 | 0 | 1 | −1 |
| index-perception | 260 | 9 | 0 | 1 | −5 |
| ledger | 255 | 11 | 1 | 1 | −16 |
| portability-vsc-advisor-context | 193 | 8 | 4 | 1 | −67 |
| portability-vsc-classification | 205 | 7 | 1 | 0 | −22 |
| portability-vsc-index | 225 | 6 | 2 | 0 | −57 |
| prompts-async-guidance | 535 | 49 | 35 | 8 | −288 |
| prompts-mirror-anchors | 383 | 12 | 9 | 1 | −132 |
| setup-reminders | 298 | 15 | 0 | 1 | −3 |
| status-line | 182 | 7 | 1 | 2 | −21 |
| tool-descriptions | 86 | 4 | 2 | 2 | −33 |
| turn-across-segments | 197 | 10 | 0 | 1 | −2 |
| verify-redesign | 181 | 13 | 1 | 0 | −12 |
| webview-turnstate | 329 | 6 | 0 | 1 | −2 |
| **合计（27 档）** | **7542** | **319** | **61** | **40** | **−821** |

- 合计行口径：行数 / 用例数列 = 上述 27 档之和（非全 suite）；用例数 = `test(` / `slow(` / `it(` 起始行计数。
- 档位（R24）：本批**只减不增**。两档存量越 500 硬限——`prompts-async-guidance` 535 → 预计净减 −288 ≈ 247（回落 500 内）；`child-permission` 533 → 预计净减 −27 ≈ **506，仍越 500 硬限**——**不拆档**（拆档破坏清单集中度，与既有削段先例一致）→ **登记存量债**：归属 = 后续批次，随该档下次触碰出拆分计划（执行轮实测回填）。
- `test/files.mjs`（登记清单）：**零改**——现行 63 条登记项（62 档 `.test.mjs` + 1 档 `test/smoke-settings.mjs`），本批无整档删除（27 档每档均有保留用例），登记项与实档数不变（`docs/design/TESTING.md` §8.2）。

**提示词面**（写权 = 主 agent 内容权 + eng-coder 落笔；与并行批同两档、不同节位）：

| 文件 | 现状行数 | 增量 | 说明 |
|---|---|---|---|
| `src/prompts/discipline-engineering.md` | 241 | +2 | 「测试纪律」节（:30–35）加禁写散文锚句 |
| `docs/design/prompts/discipline-engineering.md` | 164 | +2 | 同节（:22–27）加同义句——各端原文自持，不做 byte-identical |

**文档面**（本批设计侧已落笔，执行轮零改）：本仓 `docs/design/TESTING.md` §8（现档 **282** 行——修正轮二后实测；另本仓 `docs/requirements/TESTING.md` 新 87 行 = 本端需求自持档）。

#### 4. 文件域重叠面（登记——不裁定分派）

| 面 | 本批（PROSE-ANCHOR-RETIRE） | 并行批（本仓记录 = `docs/batches/2026-09-12-LEDGER-SELF-CONTAINED.md`） | 重叠 |
|---|---|---|---|
| 本仓提示词双源 | 「测试纪律」节加禁写散文锚句 | 该批提示词层要求（台账维护条款面） | 是（同两档、不同节位） |
| 本仓测试面 | `test/**`（`docs/design/TESTING.md` §8.1 清单） | 台账面测试（如涉） | 待该批设计定，本批不预设 |

- 两侧实施分派方式（同链 / 各端独立）与两侧记录的互引形态规范**不属本批设计裁定范围**（属并行批设计范围）——本批只如实登记现状与依赖。
- 同两档的并发写入排程（冻结窗口 / 串行化）归父侧；eng-coder 不自行改排程、不自行择时。

#### 5. 验收判据回指（设计档 §8.3——每条可机验）

| AC | 本端机验（命令 / 判据） | 回指 |
|---|---|---|
| AC-VT8 | 口径 = 顶层 `test/*.test.mjs` 内 `test(` / `slow(` / `it(` **起始行**计数；实测 653（637 `test(` + 16 `slow(` + 0 `it(`）→ 目标 592（下降 61 == 清单整删条数） | `docs/design/TESTING.md` §8.3 |
| AC-VT9 | 清单逐条落地——`docs/design/TESTING.md` §8.1 点名用例名 / 断言行实测零命中；`test/files.mjs` 零改（diff 空） | `docs/design/TESTING.md` §8.3 |
| AC-VT10 | `node scripts/check-doc-width.mjs` 新增超宽 0 + 新增一致性违规 0（口径 = 批前 / 批后命中集合差）；`scripts/check-doc-width.mjs` 判据面 diff 空；`npm run lint → npm run test:full → npm run test:integration` 三环全绿 | `docs/design/TESTING.md` §8.3 |
| AC-VT11 | 零新增跨仓同步依赖 / 零 byte-identical 断言（grep 本批改动档） | `docs/design/TESTING.md` §8.3 |

计数命令（本端；两仓同口径）：

```bash
node -e "const fs=require('fs'),p='test';let n=0;for(const f of fs.readdirSync(p).filter(x=>x.endsWith('.test.mjs')))n+=(fs.readFileSync(p+'/'+f,'utf8').match(/^\s*(?:test|slow|it)\(/gm)||[]).length;console.log(n)"
```

执行轮自验（正常 / 边界 / 错误）：

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| 1 | 正常：对账 | 上列计数命令（落地后跑） | 输出 592 |
| 2 | 正常：保留面与门 | `node scripts/check-doc-width.mjs` + `npm test` | 新增违规 0；快层全绿 |
| 3 | 边界：段删残留 | 被段删的档整档跑 | 用例名集不变，行为断言仍绿 |
| 4 | 错误：对账反证 | 人为多删一个保留用例 | 下降数 ≠ 61 → 红（非空转） |

#### 6. 须注意项（执行者须知——不裁定）

1. **清单即射程**：`docs/design/TESTING.md` §8.1 的 101 条处置行逐条落地；**清单外零触碰**（未点名的用例与档一律保留）；判据灰区已由修正轮裁定完毕（装配器 / 渲染出口的提示词句子 = 锚、已追加删除；`locales` 文本值保留；工具 `description` 保留）——执行轮**零再判**；清单与实测不符 → **停手上报**，不自行增减条目。
2. **两类删除语义**：`整删` = 删整个用例（用例总数 −1）；`段删` = 只删点名的断言行（用例总数不变，行为断言保留）。档内定位以「档 + 用例名」为准，行号漂移不阻断（D4）。
3. **连带清理边界**：仅限点名档**档内**的孤立 helper / import / 常量（删除后零 unused，不得留死代码）；跨档零引用面（如 `test/helpers/**`）出现时 → 上报，不自行删。
4. **计数对账**：落地后实测须为 592；与 61 之差不符 → 停手上报（D3：声明数与实条目数同步改）。
5. **提示词双源两档**：落笔 = 加禁写句（内容权归主 agent）；同两档并行批在写 → 写入前与父侧确认排程。
6. **端差不得静默**：本端 `scripts/` 实测无 `check-ledger.mjs`（结构机检面 = `check-doc-width.mjs` + `check-syntax.mjs` + doc-consistency 用例 + slow 门）——执行轮**不得为本端补造脚本**；形态归宿见 `docs/design/TESTING.md` §8.2 / §8.6。
7. **依赖与端差（2026-09-12 修正轮二——就地消解）**：需求落点 / 跨仓引用已就地消解（本仓需求档自持、指针已对齐）；台账机检执行面 = 端差在册（本批零改、不新造脚本）。

**就绪**：本档 §2 已落（本端执行面任务书）——设计就绪待评审（发起权在用户）。

**修正轮二登记（2026-09-12——设计评审轮次 1 落修范围内的 #7/#9/#10；id=10）**

- 本段修正 = 需求指针三处（§2 头注 / 「明确不在本批」/ 「须注意项」7）改指本仓档 + 档位算式更正（`child-permission` 仍越 500 硬限——存量债登记）+ 依赖就地消解。
- 落笔方式 = eng-designer（修正轮）**直改本档 §2**（本角色 `batch_segment` 绑定 CLI 侧记录、无跨档通道）——父侧核验。
- 本端设计档同步 = `docs/design/TESTING.md` §8（头注 / §8.2 / §8.3 AC-VT12 / §8.6 全落）；跨批协调项（SWEEP-FOLLOWUP 守恒锁——CLI 侧 `SPLIT_CASES`）已登记于本端设计档 §8.6（本端无同类锁值同步面——grep 实测零命中）。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

## §4 用户批准（主 agent 记）

_（待写——主 agent）_

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

### 实施记录（eng-coder 自写——2026-09-12）

**交付摘要**：散文锚退役（VSC 侧执行面）落地——按 `docs/design/TESTING.md` §8.1 清单（27 档 · 整删 61 · 段删 40 = 101 条处置行）逐条删除；
提示词双源各加 1 条禁写 bullet（机检锚串 `散文锚` + `行为面` 同在「测试纪律」节内）。用例总数 **653 → 592（下降 61 == 整删条数）**；
`test/files.mjs` 零改（git diff 空）；`scripts/**` 零改（git diff 空）。触碰面 = `test/**` 27 档 + `src/prompts/discipline-engineering.md` + `docs/design/prompts/discipline-engineering.md`。

**基线（实测）**：批前快层 `npm test` = tests 654 / pass 635 / fail 3 / skipped 16（对账口径 = `test(`/`slow(`/`it(` 起始行 = 653）；批后 = tests 593 / pass 575 / fail 2 / skipped 16（对账口径 = 592）。两口径下降数均 = 61。

**点名零命中核验方式**：脚本扫描 `test/*.test.mjs` 全文——① §8.1 全部 61 个整删用例名（截断名逐字）→ **0 命中**；
② 关键段删断言行标识（`∈ 七词表`/`七词全量 ==`/`scrollBottomBtn.id`/`工具级 description 非 DESC 装载`/`delete props.batchDoc`/`CLI 序锚缺失`/`两路径共用注入点` 等）→ 命中仅剩两类合法项：冻结用例名（段删保留用例名不变——AC-PA3）与退役注记注释；
③ 退役注记曾命名已删标识符（needsRebuildBody / REASON_WORDS）——已改写为描述式措辞消除命中。逐档验证 = 27 档整档跑绿（段删档用例名集不变）。

> 父侧机械折行（2026-09-12 06:36）：上两条原为单行 359 / 339 字符——按行宽规则折行，**语义零改**（枚举/数值/标识符逐字保留）。

**决策透明表**：

| # | 决策/偏离 | 处置 |
|---|---|---|
| 1 | **child-permission 对拍行**（原 :531，清单外）：T-CP18 中「guard-completion 源读改指新档」断言的操作数 = `readSrc("../src/agent/tool-gates.mjs")` 字面串，已由本批 advisor-guard-completion T-VG19 段删（178-180）移除——保留即恒红且成死代码（实证：`readSrc`/`tool-gates` 在 guard-completion 现零出现） | **最小一致性修正：删该行**（T-CP18 其余断言与用例名保留；档头 :12-13 注记）。来源 = 清单内部两行机械冲突（执行轮发现）；若父侧裁定重开修正轮，可回退重议 |
| 2 | T-TD-3 段删（66-72）后计数断言保留需求 | 循环体改写为直接计数（`descHits += lines.filter(...)`），保留断言行 `descHits === 25` 保持绿（结构性计数 = 设计保留项） |
| 3 | 档头注释/退役注记同步（注释面非断言面；同类先例 = 2026-09-11 削段注记） | 各档头加 `PROSE-ANCHOR-RETIRE` 注记与枚举更正；含 child-permission 手法句去「R2 文档锚」、advisor-context-budget 头改 T-CB1–T-CB5、index-perception 注记去已删标识符、prompts-async-guidance 降级链注释更正 |
| 4 | 存量孤儿（**HEAD 实测均为既有——先于本批**） | `flushSubagentOutbox`(async-visibility) / `read`(eng-designer-role) / `snapshot`(index-perception) / `discoverFamily`·`detailScans`·`findProject`(ledger) / `INLINE_KEPT`(tool-descriptions)——按「清单外零触碰」未动，登记为后续 hygiene 项 |

**审计与代码评审轮次与终态**：

- **分歧审计（explore 子代理）：1 轮 · 无 divergence 行（0 findings）**——其 8 项疑问逐条由执行轮实测闭环（592 计数 / check-doc-width 集合差 0 / files.mjs+scripts diff 空 / HEAD 基线核验等）。
- **代码评审（advisor）：轮 1 = 超时（600s wall-clock，无最终结论）；轮 2（收窄至 5 高险档）= VERDICT: pass**——发现 3 条：🟡 INLINE_KEPT（HEAD 既有 → 降为存量项，见决策表 #4）· 🟡 child-permission 对拍行须登记（→ 本段已登记，closure）· 🔵 prompts-async-guidance 注释残留旧表述（→ 已修）。**修正轮 0 轮**（无 must-fix）。
- **终态：clean**（无未解 🔴 / 无 must-fix 🟡）。

**验收实测**：

| AC | 实测 |
|---|---|
| AC-VT8 | 对账口径计入 592（下降 61 == 整删 61）✓ |
| AC-VT9 | 61 命名零命中 ✓；关键断言行命中仅冻结名/注记（见上）✓；`test/files.mjs` git diff 空 ✓ |
| AC-VT10 | `check-doc-width.mjs`：宽度 0 新增；一致性新增 0（批前/批后同为既有 V3 两条 → 集合差 0）；`scripts/**` diff 空；三环：`lint` ✓（286 JS OK）· `test:full` 591/593（2 红为批前既有）· `test:integration` 28/28 ✓ |
| AC-VT11 | 新增行零跨仓依赖 / 零 byte-identical 断言（diff 扫描；1 条命中为注记措辞「跨仓逐字由 prompts-mirror-anchors 承载」，非依赖）✓ |

**批前既有红（非本批；基线即红——父侧预告「他链存量红如实报」）**：

1. `context-parity` T-CI-2a——本机真实 `~/.thincoder/config.json` 置 `agent.engineering: true`，装配产物为工程档 vs 断言 `assemblePrompt("normal")`（环境依赖；本批在该档只做 T-CI-11 段删）。
2. `doc-consistency`「仓库扫描」——既有 V3 两条（两批次档 §3 尚无工具写入轮次行——评审轮在途态）。
3. `provider-timeout-semantics` T-MA1-4——20ms/40ms 计时竞态，满载偶发；单跑绿（非本批文件）。
4. `slow 门防漏` 提示随负载波动（同次多跑 3→6 条未标 slow 超阈提示；基线亦有此类条目）——非本批新增。

**未做/未验证项（如实，不含糊）**：

- **CLI 仓侧执行面**（并行 coder 域）——本轮零覆盖、零触碰。
- 两侧记录互引形态与 SWEEP 守恒锁值同步（CLI 侧面）——本端无锁值面（设计 §8.6），未核 CLI 侧。
- 27 档以外文件仅由全量测试（`test:full`/`test:integration`）行为面覆盖；**未做**其逐档人工重读。
- `_fv.log`（仓根）为**批前快照**（仍列已删用例 T105/AC-V01/T-TD-4 等；报 1 red）——不得作为本批验收证据；如系交付验证日志需重跑覆盖。
- 段删档的「行为断言仍绿」以整档跑绿 + 用例名集不变为证（未对每条保留断言行做点验式复核——父侧复核轮可补）。

## §6 验证与收口（父代理自写）

### 收口（2026-09-12 06:37——本端实施落定后，父侧自写）

**本端实施**（#18——与 CLI 侧并行独立、共享同一设计链）：

- 下降数 **653 → 592（−61 == 整删条数 61）** ✓（父侧实点 **592** ✓）
- 触碰面 = `test/**` **27 档** + 提示词 2 档；`test/files.mjs` **diff 空** ✓；`scripts/**` diff 空 ✓
- 门禁：`lint` 286 OK ✓ · 快层 593（575 pass / 2 fail / 16 skip）· 全量 591/593 · **集成 28/28** ✓
- 提示词双档锚串（`散文锚` + `行为面`）✓；点名用例名 / 断言行零命中 ✓

**本端独有面（本批新增）**：`docs/requirements/TESTING.md`（**本仓需求自持首建**——F15–F22 / N10–N12 / 判据 C1-a–d）✓。

**存量红（如实记，非本批新增）**：`context-parity` T-CI-2a（本机 config `agent.engineering:true` 环境依赖）· `provider-timeout-semantics` T-MA1-4（计时竞态，单跑绿）· §3 V3 瞬态 ×2（评审轮在途——工具写入即自消）· slow 门负载波动。

**验收口径（父侧裁定）**：以「**改动面新增红 0 / 新增慢门命中 0**」为准 ✓；全绿受上述他链/环境面阻断——不得记为未完成，亦不得伪记全绿。

**遗留（登记，不吞）**：① `child-permission` 533 → **504 行**仍越 500 硬限——设计档按**存量债**登记（本批不拆）；**父侧已上呈用户裁定**（存量债 vs 本批拆）② VSC 设计档 §10/§11 题注（`:464`/`:496`）「测试档拆分」措辞级残差（#23 报，未改——不新增范围）③ 两仓台账 / checklist 核销（主 agent）。

> 父侧更正留痕（2026-09-12 06:38）：本节初写时因父侧工具调用失误（一 path 配两 edit）误将本块写入 CLI 侧记录——已即时移除并改落本档；现两仓各持其份，语义零改。
