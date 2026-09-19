# 文档↔实装对账（DOC-CODE-RECONCILE）· 批次记录（2026-09-12）

> 六段 append-only，一段一作者（§1 主 agent / §2 eng-designer / §3 评审子代理 / §4 主 agent / §5 eng-coder / §6 父代理）。
> 编制：主 agent · 2026-09-12 22:55 · 来源 = 用户 22:52「如何解决？我希望还是解决掉」+ 22:54「可以啊，我希望完整的全面清理解决」。
> 依据批 = `2026-09-12-LEDGER-SELF-CONTAINED（本仓）`（其 §6 收口登记的「文档↔实装漂移（类）」技术待办 = 本批的来源项）。

---

## §1 讨论（主 agent 记）

### 立批缘由

2026-09-12 的 LEDGER 批串行排查中，**逐轮撞见同一类残量**：设计/需求档的「事实句」落后于代码/测试现态。当晚「撞见即清」共 **250+ 处**（散文锚受益面 131 · 段删件断言级 52 · 旧指认/旧称/旧口径/已废机制 ≈70），但**没有全量清单**——清的是撞见的，不是存在的。

**用户裁定（2026-09-12 22:54）**：「可以啊，我希望**完整的全面清理**解决。」——本批 = 该类的**全量清理 + 防回潮**。

### 病根（结构化，非零散遗漏）

| 环节 | 现状 | 后果 |
|---|---|---|
| 批次「受影响文件表」 | 列代码/测试档 | 描述被改面的设计档**不在表里**——无归属 |
| 一段一作者 | coder 不碰设计/需求档 | 描述句**无人认领** |
| 子代理自查 | 核「我的改动是否自洽」 | 抓不到「全档与现态不符」 |
| 机检（V1–V4） | 管**形态**（引用形态 / 计数 / §3 轮次 / 跨仓形态） | **不管「句子说的还是不是真的」** |

### 方案（三层，按「机器能否判定」切开）

**层 1 · 机检器先行（V5「文档锚一致性」）**：报告态先上（不阻断），把**可机器判的事实锚**全扫出来——① 用例号锚（`T-xx` 须在 test/ 树存在，或已标退场）② 符号锚（反引号内的本仓自建符号须在 src/ 树存在，或已标已废）③ 路径锚（引用的文件须存在）。该层同时交付**全量清单**（量化）与**常驻闸**（清完后转 fail-closed、阈值 0——与基线同一套 doctrine）。

**层 2 · 按锚类型清账**：① → ② → ③ 逐类清；每处按本轮已落形态处置（**现态改写** 或 **退场/已废注记 + 来源指针**）——清账后 V5 转阻断。

**层 3 · 防回潮 + 人巡语义**：① **反查脚本**（`git diff` 抽变更符号 → 反查 `docs/design` + `docs/requirements` → 输出「必须跟着改的设计档清单」，供批次「受影响文件表」收录）；② V5 常驻（再出现即红）；③ **语义巡检**（无锚的中文描述句——机器判不了，归设计者按档巡检，有周期、有归属）。

### 边界（父侧如实设定，不假装全能）

- **机器可全清**：三类锚（用例号 / 符号 / 路径）——目标 = **0**，且有常驻闸。
- **机器判不了**：**无锚的语义句**（例：「消息一律入队（回合尾 FIFO 消费，零丢失）」若不写 `_suspQueue` 这个符号，机器无从对账）——归**设计者巡检**。本批**不承诺该类清零**，只承诺**有归属、有周期**。
- **假阳纪律（硬）**：V5 判据不精确 = 红一片 = 无人看 = 等于没有（与 V1–V4 被要求的「零假阳才能常驻」同一标准）。已识别的假阳类必须显式排除或转另类判定：设计档内部编号（`AC-xx` ≠ 用例号）· 库/浏览器 API（`preventDefault` 等）· 提交哈希 · 命令字面与 fenced 块（可执行坐标——证据保字面）。

### 量化（父侧原型实测，作设计输入）

单档实测（本仓 `docs/design/WEBVIEW.md` · 扫描面 299 档）：用例号锚 148 个（真缺失 0）· 符号锚 196 个（真缺失 9 个 + 噪声 2 个）· 路径锚 52 个（缺失 1 个）——**单档 ≈10 处真锚**；两仓 `docs/design` + `docs/requirements` 合计 ≈200 档 ⇒ **量级 = 数百处**（与当晚顺手的 250+ 同类，但本批要求**全量清单**）。

### 范围外

不改代码/测试语义（本批为**文档面对账**；锚缺失若暴露真实代码问题 → 停下上报，不自行改码）· 不重写历史批档（append-only）· 不动 `_archive/`。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

---

**依据**：批次档 §1（父侧已定输入——病根表 / 三层方案 / 边界 / 量化实测 / 假阳类）；需求档 §1.20（FR26——本批新落）+ §1.19 F15–F17（用户 23:01 裁定，本次并入）；设计档 §2.32（V5 判据规格 + 三层交付 + 选型 + 决策 D-V5-1–D-V5-7 + 边界）；**本批 = 该类的全量清理 + 防回潮**（用户 22:54「完整的全面清理」）。

### 本批覆盖的需求条目（三条 + 批级门）

| 条目 | 内容 | 需求回指 | 设计回指 | 验收 / 用例 |
|---|---|---|---|---|
| **A · 层 1 机检器 V5** | 三锚（用例号 / 路径 / 符号）抽取与存在性判定 + 假阳类逐条排除 + 注记识别 + 报告态（不阻断）+ 全量清单 | §1.20 F1–F5 · N1–N5 | §2.32.3（判据规格全文） | AC-V5-1–AC-V5-9 · AC-V5-16（N5） / T-V5-1–T-V5-11 · T-V5-16 |
| **B · 层 2 清账 + 收紧** | 按锚类型清账（用例号 → 符号 → 路径）+ 三选处置（现态改写 / 退场·已废注记 + 来源指针 / 订正）+ 清完后转闸（阈值 0） | §1.20 F6 · F4 · N2 | §2.32.4 | AC-V5-10 · AC-V5-11 / T-V5-12 |
| **C · 层 3 防回潮 + 流程入规** | 反查脚本（`doc-impact`）+ V5 常驻 + **语义巡检机制**（周期 / 归属 / 记录形态）+ **跨仓批派单与写域**（父侧追加项）+ 提示词逐字落笔 | §1.20 F7–F9 · §1.19 F15–F17 | §2.32.5（含落笔表） | AC-V5-12–AC-V5-14 / T-V5-13–T-V5-15 |
| 批级门 | 两仓 `check-doc-width` 新增超宽 0 + 新增一致性违规 0；CLI 快层全绿；改动档守 500 硬限 | — | §2.32.6 档位结论 | AC-V5-15 |

**父侧追加项（用户 2026-09-12 23:01「本来就应该各自落笔。」）已并入条目 C**：① **派单形态** = 跨仓批每仓一轮、各带自己仓的批次档（语义同源由同一份简报保证，不做逐字一致）② **写域纪律** = 子代理只写本仓；写对端仓任何档 = 违规；确需对端改动 → 停下上报、由父侧另派对端轮
③ **提示词层落点** = `src/prompts/discipline-engineering.md` **+ `docs/design/prompts/discipline-engineering.md`（两副本逐字同落——修正轮 #1）** §「文档与台账自持（各仓记各仓的）」+ 另起节「改动面反查」
（逐字台词 = 设计 §2.32.5.5 落笔表；落笔归 coder 轮；**对端同节由对端仓一轮自行落笔——本端不代写**）。

### 明确不在本批的条目（边界——需求 §1.20「范围边界」/ 设计 §2.32.8）

- **无锚语义句清零**：机器判不了（需求 F9 明示不承诺；归语义巡检——有周期、有归属、有记录形态）。
- **符号宽形态入闸**：实测 196/2629 命中以假阳为主（对端符号 / 库·平台 API / 退场叙述）——按假阳纪律不入闸，只入报告清单（决策 D-V5-3）。
- **「设计计划未落地」类**（用例表编号在 test 树无宿主的计划面，实测 294 条）：**不属悬空**（编号定义在本档用例表内），归测试生命周期 / 批次档 §6 收口面——本批不判、不清。
- **代码 / 测试语义改动**（含不改测试用例名——用例号锚缺失只走文档面处置）；锚缺失若暴露真实代码问题 → **停下上报**。
- **历史批档重写**（`docs/batches/**` append-only；V5 扫描域不含批档）· **`_archive/` 触达**（历史快照）· **V5 入产品提示词**（本仓自用工具面）。
- **对端（VSC 仓）任何档**——含提示词镜像与对端批次档（跨仓写 = 违规，见条目 C ②）。

### 实施轮次（建议——父侧定夺）

- **轮 1 = 条目 A**：`scripts/doc-anchors.mjs` + `test/doc-anchors.test.mjs` + 报告态全量清单（**不阻断**）；交付物 = 代码 + 首跑清单（层 2 的输入）。
- **轮 2 = 条目 B**：逐档清账（顺序 用例号 → 符号 → 路径）+ 清完后收紧（`V5_GATE` 翻 `true`——落 `scripts/doc-anchors.mjs`，三条件见设计 §2.32.3.5）；**写域 = 首跑清单**（输出中 `docs/design/**` + `docs/requirements/**` 命中档逐档转 file-level `files` + 翻转项——对接方式见设计 §2.32.4）。
- **轮 3 = 条目 C**：`scripts/doc-impact.mjs` + 常驻接线 + 提示词逐字落笔（4 条——**1 节 × 2 副本**：`src/prompts/discipline-engineering.md` + `docs/design/prompts/discipline-engineering.md` 逐字同落；修正轮 #1）。

各轮各自过批级门（AC-V5-15）；轮 2 写域 = 首跑清单动态集（+ `scripts/doc-anchors.mjs`）、轮 3 写域 = `scripts/doc-impact.mjs` + 测试 + 两副本提示词档——若有交集由调度器排队（不手工串行）。

### 受影响文件（当前行数 + 预计增量；行数口径 = read 工具；as-of 2026-09-12——修正轮 / 实施轮 / 实施后同步轮回填实测）

| # | 文件 | 当前行数 | 动作 | 预计增量 | 归属 |
|---|---|---|---|---|---|
| 1 | `docs/requirements/ENGINEERING-MODE.md` | 926（批前）→ **1000（修正轮后实测）** | 改（§1.19 补 F15–F17 + 新增 §1.20 + header 行；修正轮：F10 / F17 / §1.20 判定句行 + N5 判定句同步） | **+74（实测）** | eng-designer（**已落**） |
| 2 | `docs/design/ENGINEERING-MODE.md` | 2735（批前）→ **3024（实施后同步轮实测）** | 改（§2.19 补 V5 行 + 新增 §2.32 + §3.1 AC + §3.2 用例 + §7 变更记录；修正轮：3🔴+3🟡+7🔵 落地；实施后同步轮：设计↔实装对齐 + 口径刷新） | **+289（累计实测）** | eng-designer（**已落**） |
| 3 | `docs/README.md` | 247（批前）→ **250（实施前小轮后实测）** | 改（§3.7 补 V5 判据面一条；修正轮：补运行命令；实施前小轮：命令去重） | **+3（实测）** | eng-designer（**已落**） |
| 4 | `scripts/doc-anchors.mjs` | 新 → **300（实施轮实测；split 口径 300 / read 口径 299）** | **新增**（三锚 + 存在性域 + 注记 + 两态 + CLI 清单） | ~260 → **300（实测）** | eng-coder（轮 1） |
| 5 | `test/doc-anchors.test.mjs` | 新 → **282（实施轮实测）** | **新增**（T-V5-1–T-V5-12 · T-V5-15 · T-V5-16；T-V5-13/14 → 行 7；快层 8 例 + `slow()` 6 例） | ~240 → **282（实测）** | eng-coder（轮 1） |
| 6 | `scripts/doc-impact.mjs` | 新 | **新增**（纯函数 + git 包装 + CLI） | ~150 | eng-coder（轮 3） |
| 7 | `test/doc-impact.test.mjs` | 新 | **新增**（T-V5-13 / T-V5-14——含慢层 git 夹具） | ~110 | eng-coder（轮 3） |
| 8 | `scripts/check-doc-width.mjs` | 367（批前）→ **368（实施后实测）** | 改（导出既有 `isExecutableLine` / `inCodeSpan`——共享豁免谓词单源；头部导出清单 +1 行；判据语义零改） | **+1（实测）** | eng-coder（轮 1） |
| 9 | `src/prompts/discipline-engineering.md` | 252 | 改（「文档与台账自持」续编号 6–8 + 另起节「改动面反查」——逐字见设计 §2.32.5.5） | +~14 | eng-coder（轮 3——提示词落笔） |
| 10 | `docs/design/prompts/discipline-engineering.md` | 181 | 改（同行 9 逐字——**两副本逐字同落**；修正轮 #1） | +~14 | eng-coder（轮 3——提示词落笔） |
| 11 | `scripts/doc-anchors.mjs`（轮 2） | 轮 1 交付（~260） | 改（`V5_GATE` `false`→`true`——1 行）+ **清账档集合**（= 首跑清单输出的 `docs/design/**` + `docs/requirements/**` 命中档——动态集，逐档入轮 2 `files`；对接方式见设计 §2.32.4） | +0 / 动态 | eng-coder（轮 2） |

**档位结论**：`check-doc-width.mjs` 367 → ≤369（≤500 硬限；**新判据面独立成档**——既有拆分计划本批不触发）；**新四档各自 ≤300**（`scripts/doc-anchors.mjs` / `test/doc-anchors.test.mjs` / `scripts/doc-impact.mjs` / `test/doc-impact.test.mjs`）。`test/fixtures/doc-consistency-baseline.json`（7 行）**零改**（必须保持为空——N2）。

### 验收标准（逐条回指需求）

验收 = 设计 §3.1 **AC-V5-1–AC-V5-16**（逐条已回指需求条）+ 用例 **T-V5-1–T-V5-16**（设计 §3.2）。
**无机械判据项（明示）**：① 语义巡检机制（需求 F9——机器判不了）② 提示词逐字落笔（需求 §1.19 F15–F17）——落笔面验收 = coder 交付报告 + 评审（提示词句子断言属已退役的散文锚面，`TESTING.md` §11）。
**机检口径**：AC-V5-15 的「新增 0」= **批前 / 批后命中集合差**（非 exit 码——扫描域仍有他链在飞档的存量时，检查器退出码非零属既有事实）。

### 三方条目一致（硬）

本表条目 **A / B / C + 批级门** = 设计 AC-V5-1–AC-V5-16 的回指条目 = 需求 §1.20 F1–F10 / N1–N5（+ §1.19 F15–F17）——三链同源，逐条可对（N5 独立判定句 = AC-V5-16 / T-V5-16）。

### 任务书就绪

本节即任务书本体（spawn 传本档路径，不另写副本）。eng-coder spawn 需：`designId` + `designToken`（设计评审通过后由父侧签发）+ `batchDoc` = 本档路径 + `files`（file-level 路径——本表第 4–11 行按轮次取用；轮 2 的 `files` 由首跑清单派生——设计 §2.32.4；**不含**项目流程文件）。

**范围外注记（不列级）**：① 本档 §4 占位段的 `---` 分隔行会命中 V3（骨架标点被当实文——父侧写域；随 §3 获评审轮次行自消或由父侧去掉该行）。② 对端（VSC 仓）同名批次档 §1 同源、各端原文自持——对端 §2/设计/提示词同节由对端仓一轮落笔。

### 修正轮（评审轮次 1 后——3🔴+3🟡+7🔵 逐条落地；只落评审发现直接导出的修正、零新语义）

**披露**：本档 §2 已按修正结论做**行级同步**（条目表 A 行验收列 · 轮次表轮 2 / 轮 3 / 轮次小结 · 受影响文件表 11 行 · 档位结论 · 验收标准 · 三方一致 · 任务书就绪行）；本块为留痕与核验索引，§1 / §3–§6 零触碰。

**逐条落点（可对档核验——设计档 = `../design/ENGINEERING-MODE.md`）**：

- **🔴#1 中文权威镜像**：设计 §2.32.5.5 落笔表落点列改「两副本 §…」并补镜像行（`docs/design/prompts/discipline-engineering.md`）+ 落笔注① 明写**两副本逐字同落**（`docs/README.md`:15 中文权威源 + AC15 双源口径 + 镜像同节现存 5 条）；设计 §2.32.6 受影响表 + 本档 §2 各补镜像行（+~14）；轮 3 口径改「1 节 × 2 副本」；需求档 §1.19 F17 落点行同步。
- **🔴#2 T-V5-12 宿主与判据**：设计 §2.32.6 行 4 / 行 6 用例覆盖**逐例钉死**（行 4 = T-V5-1–12 · 15 · 16；行 6 = T-V5-13/14）；T-V5-12 改**夹具域 + 显式 `gate` 参数**（§3.2；§2.32.3.5/3.6 补翻转落点与两态口径）；受影响表补轮 2 行（`V5_GATE` 翻转 + 清账档集合 = 首跑清单——**动态清单 → `files` 对接方式入设计 §2.32.4**）；AC-V5-10/11 核验面改轮 2 收口复跑；本档 §2 行 5 / 轮次表同步。
- **🔴#3 对端仓锚统一**（父侧裁定 = 二选一之选定）：**V4 违规形态（枚举外）→ V5 跳过**；**合规形态（`路径（仓别）`——E3）→ 入存在性域、不可达记「域外」不阻断**——设计 §2.32.3.1 排除式 5 / §2.32.3.2 解析序 ③ + 降级条 / §2.32.3.4 假阳类 7 / §2.32.3.6 射程表**全文统一**；AC-V5-8/9 与 T-V5-10/11 夹具钉成**互斥两类**（T-V5-3 补合规形态正例）；需求档 F10 同步。
- **🟡#4 标记集**：设计 §2.32.3.3 闭枚举补 `归档` / `换名` / `改名`；假阳类 8 括注对齐；T-V5-5 **十类夹具逐类钉死**（AC-V5-4 同步）。
- **🟡#5 N5 独立判定句**：设计新增 **AC-V5-16 / T-V5-16**（`SCAN_DIRS` 不变 + V1–V4 批前/批后逐字节对照 + 夹具快照）；§2.32.8 补指针；需求档 §1.20 判定句行 + N5 判定句同步；本档 §2 验收 / 三方行同步。
- **🟡#6 反查时点与基准**：设计 §2.32.5.1 接口 / 输入 / 归属改定（`--base` **必给** = 上一批收口点、**实施轮开工前**跑）；落笔表第 4 条逐字同改 + 落点改「另起节」。
- **🔵#7–#13**：366→367（D-V5-4）· 「新四档」（设计 + 本档两处）· 需求档行 1 实测回填（+74）· V5-B 正则收紧（`TLS12` / `TAB123` 不入抽取——假阳类 10 + T-V5-5 ⑩；实证：全域扫描 lost 仅此二类，`T-01`–`T-22` 等合法形态全保留）· item 9 另起节「改动面反查（文档影响面）」（#11）·
  `docs/README.md` §3.7 补运行命令 · 196 口径统计面消歧（#13——单档 vs 全域；`TS2023` 复核实测连批前正则亦不命中，夹具以 `TLS12` / `TAB123` 为准）。

**机检与回读（D6）**：

- `node scripts/check-doc-width.mjs`（本仓）：**宽度 0**（137 文件）· 一致性 V1/V2/V3/V4 **新增 0 · 存量 0** · exit 0（批前基线同为 0/0；修正引入的两行超宽误报已于收口前折行消除）。
- 行数回读（口径 = read 工具）：需求档 **1000** · 设计档 **3001** · `docs/README.md` **251** · 本档 **191**（含本修正轮块）——受影响表所载（1000 / 3001 / 251）与磁盘一致。
- 边界：只改文档（本仓 `docs/` + 本档 §2）；`src/**` / `test/**` / 台账 / 对端（VSC 仓）零触碰；提示词两副本实体零触碰（落笔归 coder 轮）。

### 实施前小轮（端差登记 + README 去重——用户 2026-09-12 23:37 裁定「端差选 A = 登记共存」）

**依据**：本档 §3 轮次 2 复评 pass（结论里新增条 N1 = README 同节重述）+ 用户 23:37 逐项裁定（本仓 CLI 侧）。**判据 = 多实现面纪律「各端独立实现、语义同源、差异如实登记、互不追赶」+ 单源精神**（不以先例为据）。

| # | 项 | 改前 → 改后 | 判据 | 机检 / 证据 |
|---|---|---|---|---|
| 1 | **端差登记** | 设计档 §2.32.8 边界区，「对端仓零写」条之后**新增一条「两端差异不对齐（各自保留、互不追赶）」**：本仓（CLI）对端仓树不可达 = 合规形态锚记「域外」报告行、**不阻断**（指针 = §2.32.3.2 降级条）；对端仓（VSC）= **fail-closed 拒跑**（`DOC-CODE-RECONCILE（VSC 仓）§4.1`「缺仓行为 = fail-closed」）；**不做统一、不以任一端为准回改另一端** | 多实现面纪律（判据句逐字入档） | 该行 262 字符（≤300）；V1–V4 新增 0 |
| 2 | **README 去重**（复评 N1） | `docs/README.md` §3.7：**删条目内命令句**（改前 `:99`「运行 = `node scripts/doc-anchors.mjs`…」）+ 条目末补「。」；**保留检查器登记行**（改前 `:103`——行号 as-of） | 单源——同一事实不在同节重述 | 全档 `doc-anchors.mjs` 现仅 1 处（改后 `:102`） |

**落点选择（「择合适处」的依据——择 §2.32.8 而非 §2.32.7）**：
① 内容是**不做项**（不统一 / 不回改任一端），与同节既有「对端仓零写」条同族；
② 决策区条目为 `D-V5-n` 枚举，入表将使「`决策 D-V5-1–D-V5-7`」这一既有区间声明在 §7 与本档 §2 依据行（`:56`）同时失真——而 §2 为 append-only 不可回改 → 边界区无编号、无计数声明，落此不产生任何区间漂移。

**变更留痕**：设计档 §7 变更记录新增本轮小节（`docs/design/ENGINEERING-MODE.md:2717`，含 README 去重项）。

**机检与回读（D6）**：

- `node scripts/check-doc-width.mjs`（cwd = `thincoder-cli/`）：`OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。` · `一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。` · **exit 0**——与本轮**批前基线同（0/0）**（批前同命令同结果，已实跑）。
- 行数回读（口径 = read 工具）：设计档 **3001 → 3007**（+6 = §2.32.8 一条 + §7 变更记录 4 行 + 空行）；`docs/README.md` **251 → 250**（−1）；本档改前 **221**。
- 边界（实核）：`git status` 改动面 = `docs/README.md` · `docs/design/ENGINEERING-MODE.md`（本轮）+ `docs/requirements/ENGINEERING-MODE.md`（**前轮**修正轮已改，本轮零触碰）+ 本档（untracked）——`src/**` / `test/**` / 台账 / **对端（VSC）仓**零触碰。

**未做项（明示）**：无——本小轮两项均已落地；未以先例为据（判据句 = 多实现面纪律 + 单源精神，逐字入档）。

### 实施后同步轮（设计↔实装对齐 + 设计级待裁处置——父侧已裁；只改文档、零代码）

**依据**：父侧任务书「实施后同步轮（CLI 侧）」+ 本档 §5 披露与待裁项；判据 = **设计档须与实装现态一致**（唯一依据——不以先例为据）；零假阳硬前提（F2 / N1）；例外 / 射程定义须引判据句（F14）。

**披露（行级同步）**：本档 §2「受影响文件」表 5 行（行 2 / 3 / 4 / 5 / 8）+ 表头 as-of 行按实施轮 / 本轮回填实测；§1 / §3–§6 零触碰。

**逐项「改前 → 改后」**（file:line = 设计档 `../design/ENGINEERING-MODE.md`，行号 as-of 本轮改前）

| # | 项 | 改前（:行） | 改后 | 证据 / 边界 |
|---|---|---|---|---|
| 1 | V5-B 正则（`:2095`） | `T-[A-Z]{1,5}\d{1,3}` 单段捕获（多段号只捕前缀） | 补 `(?:-\d{1,3})?` 多段号完整捕获 + 收尾 `(?![A-Za-z0-9-])`——按实装收正 | `T-V5-12` 类多段号完整命中（实测复核）；`TLS12` / `TAB123` 收紧面零改 |
| 2 | 快层归属注（`:2688`） | 仅 T-V5-14 走 `slow()` | 六例 `slow()` 归册（T-V5-6/7/8/9/11/12——子进程 spawn）；快层 8 例 / `test:full` 14 例 | 实施轮实测 0.8–1.9s/例 |
| 3 | 行数刷新（`:553` / `:2227` / `:2233` / `:2243` 等） | `check-doc-width.mjs` 367；README 251；新档无实测值 | **367 → 368**（+1 头部导出清单行）；README **250**；新档回读 300 / 282 | 设计 §2.32.6 表 + §2.19 V5 行 + 档位结论 + D-V5-4 同刷 |
| 4 | 交叉引用核 | — | §2.32 自引用全量核验 = **0 悬空**（78 处引用逐处可解析）；`§2.32.3.8` / `.9` 型引用零命中 | 唯一提及 = 本档 §5 披露行（eng-coder 段——非本轮写域） |
| 5 | 对端仓根 env（`:2104`） | 「工作区可达」 | 可达来源序：显式 `peerRoot` → `THINCODER_PEER_ROOT`（别名 `THINCODER_CLI_ROOT`；自指防护）→ 兄弟目录 | 按实装补记 |
| 6 | 假阳缺口两项（实装暴露） | 无判据覆盖（F2 / N1 缺口） | 排除式 1 补**通用入口名类**（`app` 类）+ §2.32.3.3 补**「原…系」并档叙述形态**——判据句 + 射程入档 | 不开豁免通道；**实装对齐随其后实施轮** |
| 7 | ④ 仓前缀适用面（`:2104`） | 未写明通过条件 | 按实装写入（③ 不命中转 ④ 本仓同名 ⇒ 通过）+ §2.32.8 登记**假阴面代价**（缺档不报） | 父侧裁定两项 |

**机检与回读（D6）**：

- `node scripts/check-doc-width.mjs`（cwd = `thincoder-cli/`）：`OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。` · `一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。` · **exit 0**。
- `node scripts/check-ledger.mjs`：`OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规（阻断——修掉）· 基线 0 条` · **exit 0**。
- 行数回读（口径 = read 工具）：设计档 **3007 → 3024**；需求档 1000 · `docs/README.md` 250 · `scripts/doc-anchors.mjs` 300 · `test/doc-anchors.test.mjs` 282 · `scripts/check-doc-width.mjs` 368。

**边界（实核）**：只改文档（设计档 + 本档 §2）；`src/**` / `test/**` / `scripts/**` 只读核——实体零触碰；台账零触碰；对端（VSC）仓零触碰；本档 §5 零触碰；措辞未用「最小改动」类；未以先例为据。

**实施依赖（上报）**：第 6 项新增判据的实装对齐（`scripts/doc-anchors.mjs` 排除面扩展）未落地——建议随下一实施轮（轮 2 同在 `scripts/doc-anchors.mjs` 变更面）并入 `files`；未落地前该两形仍按旧判据报（实例见 §5）。

### 跨仓失实注销轮（对端缺仓口径变更后——2026-09-13；只改文档、零代码）

**依据**：对端（VSC）2026-09-13 用户裁定后，其缺仓（对端仓树不可达）口径由 **fail-closed 拒跑** 改为 **「域外标记、不阻断」**（对端 `DOC-CODE-RECONCILE（VSC 仓）§4.1`——父侧已核）⇒ 两端口径现已一致 ⇒ 本仓设计档 §2.32.8 内「两端差异不对齐（各自保留、互不追赶）」登记条失实 ⇒ **注销**（注销留行、不删行 + 注销注记 + 理由 + 指针）。

**逐项「改前 → 改后」**（设计档 = `../design/ENGINEERING-MODE.md`；行号 as-of 本轮改前）

| # | 项 | 改前 → 改后 | 证据 / 边界 |
|---|---|---|---|
| 1 | §2.32.8 端差条**注销留行**（改前 `:2263`） | 原条**字节保留**；其后追加注销注记行（理由 = 2026-09-13 用户裁定后对端改「域外标记、不阻断」⇒ 两端口径一致 ⇒ 端差消解；指针 = 对端 `DOC-CODE-RECONCILE（VSC 仓）§4.1`） | 注记行 152 字符（≤300）；V5 悬空 0 |
| 2 | §7 变更记录（改前 `:2724` 区） | 顶部新增一行（本次注销 + 裁定来源 = 对端仓 2026-09-13 用户裁定） | 行数回读 3025 → 3028（+3：注记 +1 · §7 一行 + 空行 +2） |
| 3 | 顺带核——本仓设计档内其它「对端 fail-closed」提及 | 全档扫描：仅 §7 历史条目（改前 `:2736` 区；2026-09-12 实施前小轮记录）含该表述——**历史语义保留**（变更记录 = 当时动作，不以现态回改）；其余设计档零命中 | 需求档 / `docs/README.md` 同核：无现态端差陈述（不在本改动面） |

**机检与回读（D6）**（设计档改后实跑；批前 / 批后同）：

- `node scripts/check-doc-width.mjs`（cwd = `thincoder-cli/`）：`OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。` · `一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。` · **exit 0**。
- `node scripts/check-ledger.mjs`：`OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md` · `0 处违规（阻断——修掉）· 基线 0 条` · **exit 0**。
- `node scripts/doc-anchors.mjs`：`V5 汇总：候选 8457 · 悬空 0 · 注记豁免 719 · 域外 0` · `OK(V5): 0 条悬空锚（闸态——阈值 0）` · **exit 0**。
- 行数回读（口径 = read 工具）：设计档 **3025 → 3028**。

**边界（实核）**：只改文档（设计档 + 本档 §2）；`src/**` / `test/**` / `scripts/**` 实体零触碰（机检只读运行）；台账零触碰；对端（VSC）仓零触碰；本档 §1 / §3–§6 零触碰；措辞未用「最小改动」类；未以先例为据。

## §3 设计评审（评审子代理写）

_（待写——评审子代理）_

---

### 轮次 1（评审子代理）

**设计评审（DOC-CODE-RECONCILE 批——设计 §2.32 + 需求 §1.19 F15–F17 / §1.20 + README §3.7 + 本档 §1/§2）**

评审对象 = 声明清单四档（批次档 §1/§2 + 需求 §1.19 新增 / §1.20 + 设计 §2.32 + §3.1 AC-V5-1–15 + §3.2 T-V5-1–15 + README §3.7 新增条 + §2.19 V5 行 + §7 变更记录行）；前序批已收口内容不在射程。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected files | 🔴 | 受影响文件表与提示词落笔表只列 `src/prompts/discipline-engineering.md`（设计 `:2225` / 本档 §2 行 9），漏 CLI 中文权威镜像 `docs/design/prompts/discipline-engineering.md`——该镜像同节现存 5 条（`docs/design/prompts/discipline-engineering.md:89`–`:97` 与 `src/prompts/discipline-engineering.md:114`–`:122` 同节同 5 条），README:15 定义 `design/prompts/` = 中文权威源，AC15（设计 `:2273`）明写双源口径，先例 = 台账自持批两副本同落 +8。照本设计落地 → 双源漂移 | 两表各补一行（镜像档 +~14），落笔表注明「两副本逐字同落」；§2 轮 3 的「落 1 档」改「1 节 × 2 副本」 |
| 2 | Requirements coverage / 三方条目一致 | 🔴 | T-V5-12 宿主与判据自相矛盾且无归属：设计行 4 称 `test/doc-anchors.test.mjs` 覆盖 T-V5-1–T-V5-15（`:2220`），同行 6 又把 T-V5-13/14 划给 `test/doc-impact.test.mjs`（`:2222`）；本档 §2 行 5 只写 T-V5-1–T-V5-11 + T-V5-15（`:94`），轮 2/轮 3（`:81`/`:82`）与「第 4–9 行按轮次取用」（`:114`）均未给 T-V5-12 宿主；且 T-V5-12 输入写「清账后的本仓扫描域（三锚命中 0）」（`:2673`）与「用例与 AC 跨切换点零改（显式 gate 参数直驱）」（`:2136`）冲突——按字面落地则轮 1 快层即红（原型实测尚有 121 处悬空），撞批级门「快层全绿」（`:2469`）；`V5_GATE` 翻转（`:2135`）改 `scripts/doc-anchors.mjs`，该档却只标「轮 1」 | ①逐例钉死宿主；②T-V5-12 改夹具域 + 显式 gate 参数（或移轮 2 并补 test 行）；③受影响文件表补轮 2 行（翻转 + 清账档集合 = 首跑清单），并写清动态清单如何转 `files` 声明 |
| 3 | 判据规格自相矛盾 | 🔴 | 对端仓锚「判不判」两说：排除式 5 把「对端仓目录直引形态（V4 面）」列为硬排除（`:2093`），但存在性域把对端仓根入解析序（`:2103`）、降级条记「域外」入报告行（`:2106`）、假阳类 7 排除式写「对端仓根入存在性域」（`:2126`）、射程边界写「V5 只判对端形态入域后的存在性」（`:2145`）；AC/T 亦分两派：AC-V5-8/T-V5-10 要零命中（`:2462`/`:2671`），AC-V5-9/T-V5-11 要域外报告行（`:2463`/`:2672`）。影响 F2（零假阳）与 F10（不重复报行） | 二选一并全文统一（建议 V4 违规形态跳过、`路径（仓别）` 合规形态入域判定），并把两派 AC/用例夹具钉死为互斥两类 |
| 4 | 判据规格（枚举 vs 声明） | 🟡 | 标记集是闭枚举 14 项（`:2111`，无 `归档`/`换名`），但假阳类 8 自称「同行注记标记集（含 `已拆`/`已并入`/`归档` 类书面语）」（`:2127`），AC-V5-4/T-V5-5 又要求九类（含退场叙述行）零命中 → 照闭枚举实现则「已归档/换名」行仍报（违 F2/N1） | 把 `归档`/`换名`/`改名` 补进闭枚举，或改括注；T-V5-5 夹具逐类钉用词 |
| 5 | Requirements coverage | 🟡 | N5「V1–V4 / L1–L4 判据语义与扫描域零改；宽度域与台账域互不侵入」（需求 `:978`）无独立 AC/用例回指——AC-V5-15 只到批级门、AC-V5-6 只覆盖基线面 | 补一条 AC（V1–V4 输出批前/批后一致 + SCAN_DIRS 不变）+ 用例，或在 AC-V5-15 显式回指 N5 |
| 6 | Feasibility / 流程句 | 🟡 | 反查脚本时点与输入语义不符：接口 = `git diff --name-only <base>`（默认 `--base`=HEAD，`:2174`），干净工作区输出为空；落笔表 item 9 却写「批次开工前跑…录入本批受影响文件表」（`:2208`）、归属写「批次 §2 落笔前跑一次」（`:2178`）——docs FIRST 下开工前无代码 diff | 改时点/基准（base = 上一批收口点，或实施轮开工前对上一轮 diff 跑），逐字入落笔表 |
| 7 | 数值漂移 | 🔵 | 同档两说：D-V5-4 写「366+~260 > 500」（`:2236`），§2.19 V5 行 / 受影响文件 / 档位结论均写 367（`:553`/`:2223`/`:2227`）；磁盘实测 367 | 统一 367 |
| 8 | D3 计数纪律 | 🔵 | 「新三档各自 ≤300」（`:2227`、本档 `:100`）与 4 个新档（`:2219`–`:2222`）不符 | 改「新四档」或注明统计范围 |
| 9 | 数值漂移（as-of） | 🔵 | 行 1 标 926（批前）/ +~95（`:2217`、本档 `:90`），实读 999（实增 +73）；行 2 标 2735/+~250，实读 2983（+248，吻合） | 回读后改实测增量或标 as-of 口径 |
| 10 | 假阳风险 | 🔵 | V5-B 正则 `T-?[A-Z]{0,5}\d{1,3}`（`:2094`）命中 `TLS12`/`TS2023`/`TAB123` 类标识符 | 收紧形态或列入假阳表 + T-V5-5 夹具 |
| 11 | 落点归属 | 🔵 | item 9「改动面反查」放进 §「文档与台账自持（各仓记各仓的）」（`:2208`/`:2210`；宿主节见 `src/prompts/discipline-engineering.md:114`–`:122`）——节题与内容不符 | 改节题覆盖，或同档另起一句 |
| 12 | 文档可执行性 | 🔵 | README §3.7 新增 V5 条（`:97`–`:98`）未挂检查命令，节末「批量检查」只列 `node scripts/check-doc-width.mjs`（`:100`–`:101`） | 补运行命令（README 非提示词面，无 FR13 问题） |
| 13 | 数字口径存疑（未核实） | 🔵 | 本档 §1 单档实测「符号锚 196 个（真缺失 9 + 噪声 2）」（`:42`）vs 设计全域宽形态「2629 候选 / 悬空 196」（`:2074`/`:2156`）——同数指两量，疑转写 | 复核两处口径并标统计面 |

射程外注记（不列级）：设计档既有 AC54/AC58 的行号指针（`scripts/check-doc-width.mjs` `:297`/`:32`/`:34`）与磁盘实测不符（现 `:41` = `SCAN_DIRS` 声明行、`:43` = `BASELINE_PATH` 声明行）——属前批已收口行，仅记；层 2 清账若把行号指针纳入 V5 射程，此类将自现。

计数：🔴 3 · 🟡 3 · 🔵 7；结论 = **changes-required**（审批门阻断）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**复审（轮 2）——修正轮 3🔴+3🟡+7🔵 全量复核**

对象 = 四档（本档 §1/§2 + 需求 §1.19 F15–F17 / §1.20 + 设计 §2.32 + §3.1 AC-V5-1–16 + §3.2 T-V5-1–16 + §2.19 V5 行 + §7 + `docs/README.md` §3.7）；前序批已收口节不在射程。结论全部出自本轮实读（引文 = 本轮 read/grep 输出）。

| # | Orig | 状态 | 核验（本轮实读摘引） |
|---|---|---|---|
| 1 | 🔴#1 中文权威镜像 | **Fixed** | 落笔表 row 5 = `docs/design/prompts/discipline-engineering.md`（**中文权威镜像**）+ 注①「**两副本** = `src/prompts/discipline-engineering.md`（产品装配源）+ `docs/design/prompts/discipline-engineering.md`（中文权威镜像）——**逐字同落**」（设计 `:2212`/`:2214`）；受影响表两行（设计 `:2229`/`:2230`；本档 `:100`/`:101`）；轮 3 口径「4 条——**1 节 × 2 副本**」（本档 `:84`）；需求 F17 同步（需求 `:909`）。镜像档实存同节 5 条（`docs/design/prompts/discipline-engineering.md:89`–`:97`，181 行）；src 侧同节 5 条（`src/prompts/discipline-engineering.md:116`–`:122`，252 行）——「续编号 6–8」可落 |
| 2 | 🔴#2 T-V5-12 宿主与判据 | **Fixed** | T-V5-12 = 夹具域 + 显式 `gate` 参数、不读真实扫描域（设计 `:2681`）；宿主逐例钉死（设计 `:2224` = T-V5-1–12·15·16；`:2226` = T-V5-13/14；本档 `:96`/`:98`）；轮 2 行 + 动态清单→`files` 对接（本档 `:102`；设计 `:2168`）；翻转属轮 2（设计 `:2137`）；AC-V5-10 核验面 = 轮 2 收口复跑（设计 `:2471`） |
| 3 | 🔴#3 对端仓锚统一 | **Fixed** | 排除式 5（设计 `:2093`–`:2094`）/ 解析序③（`:2104`）/ 降级条（`:2107`）/ 假阳类 7（`:2127`）/ 射程表（`:2147`）**五处一致**；AC-V5-8/9（`:2469`/`:2470`）与 T-V5-10/11（`:2679`/`:2680`）钉成互斥两类；T-V5-3 ③ 补合规形态正例（`:2672`）；需求 F10 同步（需求 `:970`） |
| 4 | 🟡#4 标记集 | **Fixed** | 闭枚举补 `归档`/`换名`/`改名`（设计 `:2112`）；假阳类 8 括注对齐（`:2128`）；T-V5-5 十类逐类钉死（`:2674`）；AC-V5-4（`:2465`） |
| 5 | 🟡#5 N5 | **Fixed** | AC-V5-16（设计 `:2477`）+ T-V5-16（`:2685`）+ §2.32.8 指针（`:2250`）+ 需求判定句（需求 `:992`）；可行性实核：`checkDocConsistency` 已导出（`scripts/check-doc-width.mjs:280`）、`SCAN_DIRS` 已导出（`:41`）——「+2 导出」口径不阻碍 T-V5-16 ② |
| 6 | 🟡#6 反查时点 | **Fixed** | `--base` **必给** = 上一批收口点、**实施轮开工前**跑（设计 `:2177`/`:2181`）；落笔表第 4 条逐字同改（`:2211`） |
| 7 | 🔵#7 366 | **Fixed** | D-V5-4 改 367（设计 `:2243`）；设计档内再无 366 述及（grep 仅 `:420` 无关行号指针 + 变更记录 `:2723`） |
| 8 | 🔵#8 新三档 | **Fixed** | 设计 `:2234` + 本档 `:104` 均「**新四档**」；「新三档」零残留 |
| 9 | 🔵#9 行数 | **Fixed** | 行 1 = 926（批前）→ **1000（修正轮后实测）**/+74（设计 `:2221`；本档 `:92`）；实读含第 1000 行 |
| 10 | 🔵#10 正则 | **Fixed** | V5-B 收紧（设计 `:2095`）+ 排除式③（`:2096`）+ 假阳类 10（`:2130`）+ T-V5-5 ⑩（`:2674`） |
| 11 | 🔵#11 item 9 落点 | **Fixed** | 落笔表第 4 条改**另起节**「改动面反查（文档影响面）」（设计 `:2211`；注① `:2214`） |
| 12 | 🔵#12 README 命令 | **Fixed** | `docs/README.md:99`「运行 = `node scripts/doc-anchors.mjs`（报告态——清账收紧后加 `--v5-gate`；本批交付）」+ `:103`（**新：同节两处同述——见下新增条**） |
| 13 | 🔵#13 196 口径 | **Fixed** | 数字口径注（设计 `:2160`——单档 vs 全域两统计面，勿互读） |

**新增（本轮）**

| N1 | new | 🔵 | `docs/README.md` §3.7 同节两处同述 V5 运行命令（`:99` 条内「运行 = …」与 `:103` 独立行）——建议留一处（非阻断） |
|---|---|---|---|

计数：🔴 0 · 🟡 0 · 🔵 1（新增 N1）；前轮 13 项全 Fixed。
VERDICT: pass

## §4 用户批准（主 agent 记）

_（待写——主 agent）_

---

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

---

### 轮 1（条目 A = 层 1 机检器 V5 + 报告态首跑清单）——交付摘要（eng-coder 自写，2026-09-12）

**交付物三档**（行数口径 = read 工具；`git status` = 2 新增 + 1 改）

| # | 文件 | 行数 | 动作 | 内容 |
|---|---|---|---|---|
| 1 | `scripts/doc-anchors.mjs` | **300**（split 口径 300 / 末行 299） | 新增 | 三锚抽取 + 假阳十类排除 + 存在性域与解析序 + 注记识别 + 报告/闸两态 + CLI 清单（`V5_GATE` 初值 `false` + `--v5-gate`） |
| 2 | `test/doc-anchors.test.mjs` | **282** | 新增 | T-V5-1–T-V5-12 · T-V5-15 · T-V5-16（14 例；8 快层 + 6 `slow()` 归册——见下「披露」） |
| 3 | `scripts/check-doc-width.mjs` | **368**（批前 367） | 改 | 两处 `export` 前缀（`isExecutableLine` / `inCodeSpan`——±0 行）+ 头部导出清单一行（+1）；判据语义零改（V1–V4 输出批前/批后逐字节一致——已实跑核对） |

**判据逐条落地对照（判据源 = 设计 §2.32.3 全文；不以先例为据）**

| 判据面（设计节） | 落地形态（`scripts/doc-anchors.mjs`） | AC |
|---|---|---|
| V5-A 路径/坐标（§2.32.3.1）：射程（含 `/` 或带 `:NN`）+ 排除式 1–5 | `PATH_RE` 逐字 + 占位/通配、末段占位集、点目录（`..` 档相对不排除）、组合简写、`isExecutableLine` 共享谓词、后接 `§N` 归 V1 | AC-V5-2 |
| 排除式 5②：对端仓**裸直引**（V4 违规形态）⇒ V5 跳过；**合规形态**（`路径（仓别）`）⇒ 入域 | `NOTE_AFTER_RE` 判注记——无注记即跳过（不判、不报、不入域外行）；有注记入对端域判存在性 | AC-V5-8 / AC-V5-9 |
| V5-B 用例号（§2.32.3.1）：收紧形态 + 排除式 ①②③ | `CASE_RE`（裸 `T` 后 ≤1 字母：`TLS12` / `TAB123` 不入抽取）+ 裸 `T<数>.<数>` 排除 + 前导 `-` 排除 | AC-V5-1 |
| V5-B 存在性域 = **定义面三源**（§2.32.3.2） | `buildCaseIndex`：① 两仓 `test/**` 文本；② 定义位（表格首格 / 列表项首 / **粗体行首**）；③ 表头含 `用例名` 的表格行任意格 | AC-V5-1 |
| V5-C 符号（§2.32.3.1）：窄形态三要素入闸 / 宽形态报告面不入闸 | 反引号标识符（共享 `inCodeSpan` 确认码段内）+ 定义谓词闭枚举 + **唯一**宿主档坐标 ⇒ 判宿主档文本存在性；宽形态（≥5 字符含大写或 `_`）只入报告清单 | AC-V5-3 / 假阳类 2（D-V5-3） |
| 存在性域与解析序（§2.32.3.2）① 本仓根 → ② 本档所在目录 → ③ 对端仓根（合规形态）→ ④ 唯一 basename 索引 | `resolveFile` / `pathState`；④ = **本仓**同名唯一命中即通过 / 多命中且无目录前缀 ⇒ 报（对端面由 ③ 承担） | AC-V5-3 |
| 缺仓行为（§2.32.3.2 降级条） | 对端根 = `THINCODER_PEER_ROOT`（别名 `THINCODER_CLI_ROOT`）/ 工作区兄弟目录；不可达 ⇒ 合规形态锚记「**域外**」入报告行、**不阻断 / 零抛出**（不静默放过、不静默报红） | AC-V5-9 |
| 注记识别（§2.32.3.3）：闭枚举 17 项逐字（含 `归档`/`换名`/`改名`）+ 同行粒度 + 指针本体同受判定 | `NOTE_MARKERS` 逐字 + `pointerRanges`（`源 = …` / `删除记录 = …` 区间内**不自豁免**）+ 报告面「注记豁免条数」（防标记集滥用） | AC-V5-4 |
| 假阳类十类（§2.32.3.4） | 逐类排除：①内部编号 ②库·平台 API（宽形态不入闸）③40 位 hex ④命令 / fenced 块 ⑤占位路径 ⑥运行期点目录 ⑦对端裸直引 ⑧退场/换名/归档叙述行 ⑨裸 `T<数>.<数>` ⑩`TLS12`/`TAB123` | AC-V5-4 / F2 / N1 |
| 两态（§2.32.3.5） | 模块常量 `V5_GATE = false` + CLI `--v5-gate` + 判定函数**显式 `gate` 参数**；报告态退出码不受影响、不入基线；闸态阈值 0 ⇒ `exit 1` | AC-V5-5 / AC-V5-6 / AC-V5-11 |
| 输出格式与计数口径 | 报告段 `报告(V5): <档>:<行> <锚>（<类>）` + 汇总行 `V5 报告 <n> 条（报告态——不阻断）` + 四数（候选 / 悬空 / 注记豁免 / 域外）+ 分档候选·悬空·豁免·域外计数 | AC-V5-7 |
| 射程边界（§2.32.3.6） | 后接 `§N` ⇒ 跳过（V1）；对端裸直引 ⇒ 跳过（V4）；批档不入扫描域（V3）；不碰计数（V2）——**不重复报同一行** | AC-V5-8 / F10 |
| 既有判据零伤（§2.32.8 / N5） | `SCAN_DIRS` 三元素逐字不变；`check-doc-width.mjs` 改动 = 两处 `export` + 头部清单 1 行；V1–V4 输出**逐字节一致**（实跑核对） | AC-V5-16 |

**收束命令与机检原文（as-of 本次实施轮）**

```
$ node scripts/check-doc-width.mjs
OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。
一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。          [exit 0 —— 批前/批后输出逐字节一致（149 字节，Buffer.compare === 0）]

$ node scripts/check-ledger.mjs
OK: thincoder/docs/TODO.md / OK: thincoder/docs/TODO-archive.md
0 处违规（阻断——修掉）· 基线 0 条（**本基线必须保持为空**）。      [exit 0]

$ npm run lint
check-syntax: 312 file(s) OK                                        [exit 0]

$ node scripts/doc-anchors.mjs                                      [exit 0 —— 报告态不阻断]
V5 文档锚一致性：扫描域 docs/design + docs/requirements · 97 档 · 对端仓 d:\teamcode\thincoder-vscode
V5 汇总：候选 8458 · 悬空 187 · 注记豁免 564 · 域外 0
  用例号（V5-B）：候选 1893 · 悬空 16 · 注记豁免 319
  路径/坐标（V5-A）：候选 3306 · 悬空 169 · 注记豁免 151 · 域外 0
  符号·窄（V5-C）：候选 4 · 悬空 2 · 注记豁免 0
  符号·宽（V5-C 报告面——不入闸）：候选 3255 · 悬空 104 · 注记豁免 94
V5 报告 187 条（报告态——不阻断）

$ node test/run-fast.mjs      [exit 0]  tests 607 · pass 550 · fail 0 · skipped 57（slow 归册）· 慢测门零拦截
$ node test/run-full.mjs      [exit 0]  tests 607 · pass 607 · fail 0 · skipped 0
$ node test/run-integration.mjs [exit 0] tests 23 · pass 23 · fail 0
$ node --test test/doc-anchors.test.mjs  [exit 0] tests 14 · pass 8 · skipped 6（slow——`test:full` 全跑）
```

**点检（F2 / N1 零假阳——抽样核证；逐条判定归层 2 清账面）**：命中项抽样 30+ 例逐条核对磁盘/文档，**全部真悬空**——
退役提示词档（`main.md` / `engineering.md` / `system.md` / `discipline.md`——已退役仍被带行号引用）· 已删/已并测试档（`test/acp.test.mjs` / `test/prompts-normal-audit.test.mjs` / `test/prompts-carryover-anchors.test.mjs`）·
已归档/已换名设计档（`docs/design/TUI-STDERR-CAPTURE.md` / `docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md`）· 计划面档名（`scripts/doc-impact.mjs` / `test/doc-impact.test.mjs`——轮 3 落地后自清）·
失效符号（`context_limit` 生成点行〔`src/advisor/loop.mjs` 零命中〕· `Notification` 死事件声明〔`src/hooks.mjs` 零命中——findstr 实证〕）· 用例号 16 条——均为退场批与清空批的旧引用行，无本地注记。
宽形态（报告面）命中为**平台 API / 容器内对象字段 / 声明面**类，全部不入闸（D-V5-3）。

**披露（实施面差异与处置——逐条可核）**

1. **主行程 CLI 用例归册 `slow()`**（T-V5-6/7/8/9/11/12 六例）：批次实测单例 0.8–1.9s（子进程 spawn 成本——`test/slow.mjs` 归册阈值 >500ms）；首跑快层被慢测门拦截（4 例 817–1908ms，硬红）⇒ 按归册铁律改 `slow()`（D-T6 的「子进程类归册」既定口径）。快层保留 8 例纯函数 / 夹具域用例；`test:full` 全 14 例实跑全绿。
2. **V5-B 正则补「多段号完整捕获」**（`T-[A-Z]{1,5}\d{1,3}(?:-\d{1,3})?` + 收尾 `(?![A-Za-z0-9-])`）：设计 §2.32.3.1 逐字形态对 `T-V5-12` / `T-LS-3` 类只捕获 `T-V5` 前缀，与同节「`T-V5-*` / `T-LS*` / `T-H8` / `T-01` 类均保留」的**声明意图**相抵；收紧面（`TLS12` / `TAB123` 不入抽取、裸 `T<数>.<数>` 排除、前导 `-` 排除）零改。档内已留注（`scripts/doc-anchors.mjs` 档尾）。
3. **`scripts/check-doc-width.mjs` 头部导出清单 +1 行**（367 → 368，设计上限 ≤369）：两处 `export` 前缀 ±0 行，但头部「导出（…消费）」清单须与实际导出同步（D7）⇒ 补一行。**判据语义零改**（V1–V4 输出逐字节一致）。
4. **对端仓根 env 名**：设计只写「工作区可达」；落地取 `THINCODER_PEER_ROOT`（本端命名）+ 别名 `THINCODER_CLI_ROOT`（对端侧同源简报的既定名）；另支持显式 `peerRoot` 参数（用例直驱入口）。
5. **简报指称「设计 §2.32.3.8/§2.32.3.9（输出格式与计数口径）」与「`evidenceState` 可导出」两条在设计档中不可解析**（§2.32.3 只到 §2.32.3.7；
   `evidenceState` 实体在 `scripts/check-ledger.mjs:120` = **台账域**）——按设计文本落地：输出格式/计数口径取 §2.32.3.5 报告段 + AC-V5-7 四数口径；
   **未导出 `evidenceState`**（N5 / AC-V5-16 明写本批变更面 = `check-doc-width.mjs` 两处 `export`；台账域零触碰）。详见交付报告。

---

### 轮 1 · 首跑全量清单（F5——报告态输出；层 2 清账输入 / 轮 2 写域来源）

**复现命令**：`cd thincoder && node scripts/doc-anchors.mjs`（报告态；闸态加 `--v5-gate`）。**总计 = 187 条悬空**（用例号 16 · 路径/坐标 169 · 符号 2 · 域外 0）；候选 8458 · 注记豁免 564。命中档 = **31 档**（轮 2 `files` 动态集 = 下表「档」列去重逐行 + `scripts/doc-anchors.mjs`〔翻转〕）。

**逐档计数（档 | 计 | 用例号 | 路径/坐标 | 符号 | 域外）**

| 档 | 计 | 用例号 | 路径/坐标 | 符号 | 域外 |
|---|---|---|---|---|---|
| `docs/design/ACP-CLIENT.md` | 2 | 0 | 2 | 0 | 0 |
| `docs/design/ADVISOR-CONVERGENCE.md` | 4 | 0 | 3 | 1 | 0 |
| `docs/design/AGENT-LOOP.md` | 27 | 0 | 26 | 1 | 0 |
| `docs/design/AGENT-PARAMS.md` | 2 | 0 | 2 | 0 | 0 |
| `docs/design/ASYNC-RESULT-CONTAINER.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/design/CHECKPOINT.md` | 9 | 5 | 4 | 0 | 0 |
| `docs/design/CONSULTATION.md` | 2 | 2 | 0 | 0 | 0 |
| `docs/design/ENGINEERING-MODE.md` | 28 | 0 | 28 | 0 | 0 |
| `docs/design/ESCALATE.md` | 3 | 3 | 0 | 0 | 0 |
| `docs/design/LEDGER-SELF-CONTAINED.md` | 8 | 0 | 8 | 0 | 0 |
| `docs/design/LOGGING.md` | 4 | 0 | 4 | 0 | 0 |
| `docs/design/MEMORY.md` | 4 | 0 | 4 | 0 | 0 |
| `docs/design/MULTI-INSTANCE-COLLAB.md` | 2 | 2 | 0 | 0 | 0 |
| `docs/design/POOL-CONFIG-UNIFIED.md` | 9 | 0 | 9 | 0 | 0 |
| `docs/design/PORTABILITY.md` | 8 | 0 | 8 | 0 | 0 |
| `docs/design/PROMPT-SYSTEM.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/design/PROVIDER.md` | 12 | 2 | 10 | 0 | 0 |
| `docs/design/QUICKFIX-BATCH-3.md` | 11 | 0 | 11 | 0 | 0 |
| `docs/design/SESSION.md` | 12 | 0 | 12 | 0 | 0 |
| `docs/design/SETTINGS-TOOL.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/design/STRUCTURE-DEBT.md` | 3 | 0 | 3 | 0 | 0 |
| `docs/design/TESTING.md` | 14 | 1 | 13 | 0 | 0 |
| `docs/design/TOOLS.md` | 2 | 0 | 2 | 0 | 0 |
| `docs/design/TUI-INPUT-BOX.md` | 4 | 0 | 4 | 0 | 0 |
| `docs/design/TUI.md` | 6 | 1 | 5 | 0 | 0 |
| `docs/design/VERIFY-REDESIGN.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/requirements/ACP-CLIENT.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/requirements/ENGINEERING-MODE.md` | 3 | 0 | 3 | 0 | 0 |
| `docs/requirements/PORTABILITY.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/requirements/PROJECT.md` | 1 | 0 | 1 | 0 | 0 |
| `docs/requirements/PROMPT-SYSTEM.md` | 1 | 0 | 1 | 0 | 0 |
| **合计** | **187** | **16** | **169** | **2** | **0** |

**逐条清单（187 条；`档:行` + 锚 + 类）**

- `docs/design/ACP-CLIENT.md:207` test/acp.test.mjs（路径/坐标）
- `docs/design/ACP-CLIENT.md:376` src/acp/edit-bridge.mjs（路径/坐标）
- `docs/design/ADVISOR-CONVERGENCE.md:446` discipline-normal.md:93（路径/坐标）
- `docs/design/ADVISOR-CONVERGENCE.md:497` core.mjs:72（路径/坐标）
- `docs/design/ADVISOR-CONVERGENCE.md:1189` context_limit（符号）
- `docs/design/ADVISOR-CONVERGENCE.md:1247` advisor.mjs:165（路径/坐标）
- `docs/design/AGENT-LOOP.md:326` main.md:13（路径/坐标）
- `docs/design/AGENT-LOOP.md:332` main.md:13（路径/坐标）
- `docs/design/AGENT-LOOP.md:333` engineering.md:18（路径/坐标）
- `docs/design/AGENT-LOOP.md:339` src/prompts/main.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:339` src/prompts/engineering.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:361` main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:362` main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:363` engineering.md:16（路径/坐标）
- `docs/design/AGENT-LOOP.md:366` subagent-spec.mjs:40（路径/坐标）
- `docs/design/AGENT-LOOP.md:375` src/prompts/main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:375` main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:376` main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:382` subagent-spec.mjs:40（路径/坐标）
- `docs/design/AGENT-LOOP.md:390` src/prompts/main.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:390` src/prompts/main.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:399` main.md:8（路径/坐标）
- `docs/design/AGENT-LOOP.md:401` main.md:28（路径/坐标）
- `docs/design/AGENT-LOOP.md:402` engineering.md:16（路径/坐标）
- `docs/design/AGENT-LOOP.md:403` discipline.md:69（路径/坐标）
- `docs/design/AGENT-LOOP.md:404` main.md:8（路径/坐标）
- `docs/design/AGENT-LOOP.md:535` docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:633` docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md（路径/坐标）
- `docs/design/AGENT-LOOP.md:977` test/prompts-normal-audit.test.mjs（路径/坐标）
- `docs/design/AGENT-LOOP.md:1087` core.mjs:420（路径/坐标）
- `docs/design/AGENT-LOOP.md:1179` core.mjs:107（路径/坐标）
- `docs/design/AGENT-LOOP.md:1209` core.mjs:70（路径/坐标）
- `docs/design/AGENT-LOOP.md:1340` Notification（符号）
- `docs/design/AGENT-PARAMS.md:66` test/advisor.test.mjs（路径/坐标）
- `docs/design/AGENT-PARAMS.md:67` test/agent.test.mjs（路径/坐标）
- `docs/design/ASYNC-RESULT-CONTAINER.md:20` src/agent-tools/async-pool.mjs（路径/坐标）
- `docs/design/CHECKPOINT.md:158` test/tools.test.mjs（路径/坐标）
- `docs/design/CHECKPOINT.md:158` test/cmd-restore.test.mjs（路径/坐标）
- `docs/design/CHECKPOINT.md:204` T2b（用例号）
- `docs/design/CHECKPOINT.md:204` T2c（用例号）
- `docs/design/CHECKPOINT.md:204` T5b（用例号）
- `docs/design/CHECKPOINT.md:204` T7d（用例号）
- `docs/design/CHECKPOINT.md:204` T8c（用例号）
- `docs/design/CHECKPOINT.md:204` test/tools.test.mjs（路径/坐标）
- `docs/design/CHECKPOINT.md:205` test/cmd-restore.test.mjs（路径/坐标）
- `docs/design/CONSULTATION.md:146` T-R17a（用例号）
- `docs/design/CONSULTATION.md:150` T-R17a（用例号）
- `docs/design/ENGINEERING-MODE.md:552` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:632` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:681` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:689` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:753` activity-view.js:13（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:753` activity.js:37（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:757` persona-eng-designer.md:24（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:832` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1209` scripts/lib/doc-scan.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1242` test/prompts-split-guard.test.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1674` test/advisor-description.test.mjs:18（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1703` docs/design/TUI-STDERR-CAPTURE.md（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1818` docs/.ledger-notify.json（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1979` extension/chat-panel.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:1979` extension/panel-messages.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2067` scripts/doc-impact.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2173` scripts/doc-impact.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2225` scripts/doc-impact.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2226` test/doc-impact.test.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2234` scripts/doc-impact.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2234` test/doc-impact.test.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2415` docs/design/TUI-STDERR-CAPTURE.md（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2490` src/app.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2629` test/advisor-description.test.mjs:18（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2724` test/doc-impact.test.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2882` persona-engineering.md:10（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2939` scripts/doc-consistency.mjs（路径/坐标）
- `docs/design/ENGINEERING-MODE.md:2962` advisor-design.md:9（路径/坐标）
- `docs/design/ESCALATE.md:118` T-R17a（用例号）
- `docs/design/ESCALATE.md:133` T-R17d（用例号）
- `docs/design/ESCALATE.md:137` T-R17a（用例号）
- `docs/design/LEDGER-SELF-CONTAINED.md:185` test/prompts-carryover-anchors.test.mjs（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:265` discipline-normal.md:13（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:516` docs/design/AGENT-PARAMS-REQUIREMENTS.md（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:534` docs/design/REQUIREMENTS.md（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:726` docs/design/AGENT-PARAMS-REQUIREMENTS.md（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:730` docs/design/REQUIREMENTS.md（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:783` test/prompts-carryover-anchors.test.mjs（路径/坐标）
- `docs/design/LEDGER-SELF-CONTAINED.md:796` test/prompts-carryover-anchors.test.mjs（路径/坐标）
- `docs/design/LOGGING.md:41` agent/execute-tools.mjs（路径/坐标）
- `docs/design/LOGGING.md:47` extension/suspension.mjs（路径/坐标）
- `docs/design/LOGGING.md:62` agent/execute-tools.mjs（路径/坐标）
- `docs/design/LOGGING.md:66` extension/suspension.mjs（路径/坐标）
- `docs/design/MEMORY.md:207` test/distill.test.mjs（路径/坐标）
- `docs/design/MEMORY.md:455` test/config.test.mjs（路径/坐标）
- `docs/design/MEMORY.md:476` core.mjs:68（路径/坐标）
- `docs/design/MEMORY.md:477` core.mjs:88（路径/坐标）
- `docs/design/MULTI-INSTANCE-COLLAB.md:178` T-F4（用例号）
- `docs/design/MULTI-INSTANCE-COLLAB.md:178` T-F5（用例号）
- `docs/design/POOL-CONFIG-UNIFIED.md:31` config-io.mjs:271（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:47` zh.json:235（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:48` extension/panel-messages.mjs:361（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:48` config-io.mjs:369（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:63` advisor.mjs:43（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:64` engineering.md:16（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:91` src/prompts/engineering.md（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:96` test/advisor-description.test.mjs（路径/坐标）
- `docs/design/POOL-CONFIG-UNIFIED.md:97` test/settings-panel.test.mjs（路径/坐标）
- `docs/design/PORTABILITY.md:296` discipline-engineering.md:44（路径/坐标）
- `docs/design/PORTABILITY.md:305` advisor-design.md:9（路径/坐标）
- `docs/design/PORTABILITY.md:310` persona-eng-designer.md:13（路径/坐标）
- `docs/design/PORTABILITY.md:311` persona-eng-designer.md:27（路径/坐标）
- `docs/design/PORTABILITY.md:434` discipline-normal.md:13（路径/坐标）
- `docs/design/PORTABILITY.md:463` agent/execute-tools.mjs:108（路径/坐标）
- `docs/design/PORTABILITY.md:483` indexer.mjs:231（路径/坐标）
- `docs/design/PORTABILITY.md:484` advisor-round1.md:7（路径/坐标）
- `docs/design/PROMPT-SYSTEM.md:230` design/COMMON-LAYER.md（路径/坐标）
- `docs/design/PROVIDER.md:434` T-C1（用例号）
- `docs/design/PROVIDER.md:443` T-C1（用例号）
- `docs/design/PROVIDER.md:502` advisor/provider.mjs（路径/坐标）
- `docs/design/PROVIDER.md:566` send.js:47（路径/坐标）
- `docs/design/PROVIDER.md:566` turn-model.mjs:22（路径/坐标）
- `docs/design/PROVIDER.md:809` send.js:47（路径/坐标）
- `docs/design/PROVIDER.md:809` turn-model.mjs:22（路径/坐标）
- `docs/design/PROVIDER.md:982` test/deepseek-v41-specs.test.mjs（路径/坐标）
- `docs/design/PROVIDER.md:1014` test/deepseek-v41-specs.test.mjs（路径/坐标）
- `docs/design/PROVIDER.md:1074` test/deepseek-v41-specs.test.mjs（路径/坐标）
- `docs/design/PROVIDER.md:1209` src/provider/headers.mjs（路径/坐标）
- `docs/design/PROVIDER.md:1262` core.mjs:405（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:53` advisor.mjs:269（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:57` subagent-panel.mjs:112（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:57` test/advisor-description.test.mjs:18（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:58` advisor/main.mjs:94（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:59` agent/execute-tools.mjs:19（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:60` subagent-escalate-async.mjs:4（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:60` subagent-escalate.mjs:16（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:61` extension/panel-messages.mjs:230（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:61` suspension.mjs:27（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:93` test/advisor-description.test.mjs（路径/坐标）
- `docs/design/QUICKFIX-BATCH-3.md:123` test/advisor-description.test.mjs（路径/坐标）
- `docs/design/SESSION.md:379` system.md:24（路径/坐标）
- `docs/design/SESSION.md:396` panel-chat.mjs:348（路径/坐标）
- `docs/design/SESSION.md:402` panel-chat.mjs:60（路径/坐标）
- `docs/design/SESSION.md:409` session.mjs:261（路径/坐标）
- `docs/design/SESSION.md:454` system.md:24（路径/坐标）
- `docs/design/SESSION.md:457` system.md:24（路径/坐标）
- `docs/design/SESSION.md:467` src/prompts/system.md（路径/坐标）
- `docs/design/SESSION.md:467` src/prompts/system.md（路径/坐标）
- `docs/design/SESSION.md:472` system.md:24（路径/坐标）
- `docs/design/SESSION.md:575` session-io.mjs:104（路径/坐标）
- `docs/design/SESSION.md:575` panel-session.mjs:87（路径/坐标）
- `docs/design/SESSION.md:725` session.mjs:88（路径/坐标）
- `docs/design/SETTINGS-TOOL.md:152` test/config.test.mjs（路径/坐标）
- `docs/design/STRUCTURE-DEBT.md:87` session.mjs:424（路径/坐标）
- `docs/design/STRUCTURE-DEBT.md:109` system.mjs:150（路径/坐标）
- `docs/design/STRUCTURE-DEBT.md:145` METHODOLOGY.md:5（路径/坐标）
- `docs/design/TESTING.md:278` test/activity-debloat.test.mjs（路径/坐标）
- `docs/design/TESTING.md:279` test/advisor-description.test.mjs（路径/坐标）
- `docs/design/TESTING.md:280` test/advisor-thinking-picker.test.mjs（路径/坐标）
- `docs/design/TESTING.md:281` test/deepseek-v41-specs.test.mjs（路径/坐标）
- `docs/design/TESTING.md:282` test/distill.test.mjs（路径/坐标）
- `docs/design/TESTING.md:283` test/mouse-sane-gate.test.mjs（路径/坐标）
- `docs/design/TESTING.md:284` test/tool-args.test.mjs（路径/坐标）
- `docs/design/TESTING.md:285` test/websearch-config.test.mjs（路径/坐标）
- `docs/design/TESTING.md:291` test/config.test.mjs（路径/坐标）
- `docs/design/TESTING.md:292` test/prompts-normal-audit.test.mjs（路径/坐标）
- `docs/design/TESTING.md:294` test/settings-panel.test.mjs（路径/坐标）
- `docs/design/TESTING.md:312` test/integration-provider.mjs（路径/坐标）
- `docs/design/TESTING.md:402` helpers/webview-env.mjs（路径/坐标）
- `docs/design/TESTING.md:466` T-AP10（用例号）
- `docs/design/TOOLS.md:161` test/websearch-config.test.mjs（路径/坐标）
- `docs/design/TOOLS.md:182` test/websearch-config.test.mjs（路径/坐标）
- `docs/design/TUI-INPUT-BOX.md:112` test/tui.test.mjs（路径/坐标）
- `docs/design/TUI-INPUT-BOX.md:112` test/clipboard.test.mjs（路径/坐标）
- `docs/design/TUI-INPUT-BOX.md:315` test/tui.test.mjs（路径/坐标）
- `docs/design/TUI-INPUT-BOX.md:315` test/clipboard.test.mjs（路径/坐标）
- `docs/design/TUI.md:432` T-S14（用例号）
- `docs/design/TUI.md:472` test/activity-debloat.test.mjs（路径/坐标）
- `docs/design/TUI.md:1063` test/advisor-thinking-picker.test.mjs（路径/坐标）
- `docs/design/TUI.md:1068` test/advisor-thinking-picker.test.mjs（路径/坐标）
- `docs/design/TUI.md:1297` permission-gate.mjs:28（路径/坐标）
- `docs/design/TUI.md:1297` panel-callbacks.mjs:67（路径/坐标）
- `docs/design/VERIFY-REDESIGN.md:34` src/agent-tools/verify-watch.mjs（路径/坐标）
- `docs/requirements/ACP-CLIENT.md:17` schema/v1/schema.json（路径/坐标）
- `docs/requirements/ENGINEERING-MODE.md:785` activity-view.js:13（路径/坐标）
- `docs/requirements/ENGINEERING-MODE.md:785` activity.js:37（路径/坐标）
- `docs/requirements/ENGINEERING-MODE.md:966` scripts/doc-impact.mjs（路径/坐标）
- `docs/requirements/PORTABILITY.md:62` indexer.mjs:231（路径/坐标）
- `docs/requirements/PROJECT.md:5` docs/design/REQUIREMENTS.md（路径/坐标）
- `docs/requirements/PROMPT-SYSTEM.md:152` cwd/METHODOLOGY.md（路径/坐标）

**宽形态（报告面——不入闸，供语义巡检选样）**：候选 3255 · 悬空 **104**（32 档）· 注记豁免 94。样例（前 8 条）：
`docs/design/ACP-CLIENT.md:106 initialize.authMethods` · `:278 SUB_PREFIX_RE` · `:299 isFromMainAgent` · `:325 SUB_PREFIX_RE` · `:412 tool_call_update.toolCallId` ·
`:419 tool_call.title` · `docs/design/ADVISOR-CONVERGENCE.md:552 ADVISOR_FAILURE_TEXT` · `:560 ADVISOR_FAILURE_TEXT`——命中面以平台 API / 容器对象字段 / 声明面为主（假阳类 2 面），**全表可复跑取得**。

**自清效应（说明）**：清单为「本档 + 本轮新档」落地后复跑值；`test/doc-anchors.test.mjs` 建立后，设计/需求档中引用该档的 7 条锚已自动通过（首跑前 187+7=194 → 现 187）。`scripts/doc-impact.mjs` / `test/doc-impact.test.mjs`（轮 3 交付）落地后相应 6 条亦自清。

---

### 轮 1 · 修正轮（内部偏差审计 + 内部代码评审后——只落直接导出的修正，零新语义）

**① 内部偏差审计（explore 子代理·只读·轮次 1）**：`VERDICT: clean` —— **四类偏差 0**（部分实现 0 · 静默简化 0 · 文档漂移 0 · 范围外改动 0）；登记/待裁 6（🟡 2 · 🔵 4）；抽样反查 15 条 → 实现级假阳 **0** · 设计级假阳缺口 2。审计自述能力边界：无执行工具（未复跑运行结果——运行类结论仅按 §5 自述采信）。

**② 据审计落地的自修（三项）**

| # | 审计项 | 处置 | 落点 |
|---|---|---|---|
| Q-6 | 解析序 ③「**仅合规形态**入域」——实现此前对**所有** token 追加对端根候选（取宽方向，会掩盖「本仓不可解析、对端实存」的裸路径锚） | **Fixed**：`resolveFile` 的对端候选仅在该 token 带合规注记时追加（`env.peer && note`）；`pathState` / 窄符号宿主调用处同步传 `note` | `scripts/doc-anchors.mjs:194` / `:199` / `:252` |
| Q-3 | §5 对 `check-doc-width.mjs` 改动面的描述漏记两处**函数注释改写** | **Fixed（本块补记）**：改动面 = 两处 `export` 前缀（±0 行）+ 头部导出清单一行（+1）+ `:238`/`:245` 两处函数注释改写（±0 行，含新 V5 引用）——**判据语义零改** | `scripts/check-doc-width.mjs:35` / `:238` / `:245` |
| Q-5 | AC-V5-16 ③ 只留结果自述、无独立复核物 | **Fixed**：`git show HEAD:scripts/check-doc-width.mjs` 落临时档（仓外）→ 与现档**同域复跑对照**：输出**逐字节一致**（599 字节 · exit 同码 1〔他链在飞档照报〕）——独立复核成立，非自述 | 复核命令见下 |

**③ 设计级假阳缺口上报（Q-4——判据权威 = 设计，实现零改，交设计者/父侧裁定）**：两处反例均由**设计的闭枚举 / 占位集**决定，非实现走样——
① `docs/design/ENGINEERING-MODE.md:2490` `src/app.mjs`：该行是用例表用例描述（夹具路径），占位集（设计 `:2089`）不含 `app` ⇒ 照判据报；
② `docs/design/MULTI-INSTANCE-COLLAB.md:178` `T-F4` / `T-F5`：该行是节标题「（**原** T-L/T-F4/T-F5 系…）」退场叙述，而注记闭枚举（设计 `:2112`）无「原…系」形态 ⇒ 照判据报。
**处置建议（父侧定）**：或按 F14 走设计修订 + 重评审（扩充枚举/占位集），或作为层 2 已识别噪声在清单内标注——**本轮不擅自扩集**（例外的唯一依据 = 判据句）。

**④ §5 自纠（批次档格式机检——D6 回读发现）**：本段首块引入两处**批次档自身**的格式违规：`:310` 单行 309 字符（>300 硬限）· `:301` V2 命中（「16 条」声明 16 ≠ 括号枚举 2）。
**处置 = 定向修正**（`310` 拆行；`301` 改「16 条——均为退场批与清空批的旧引用行，无本地注记」消括号枚举）；**本块追加的「列举报表」长行同样于 D6 回读后逐行折行**（同属本段我自己的行）。
**手段说明（披露）**：`batch_segment` 为 append-only（不便撤回刚追加的排版违规），故对本段**我自己的行**做定向编辑——**段号未越、他人段零触碰**；修后复跑 `node scripts/check-doc-width.mjs` = 宽度 0 · V1–V4 新增 0 · exit 0。

**⑤ 内部代码评审（advisor type=code · 轮次 1 · 对象声明含 exclude = 设计决策本体）**：**🔴 0 · 🟡 4 · 🔵 6 · VERDICT: pass**。裁决表（逐条）：

| # | Action | Detail |
|---|---|---|
| 1（V5-B 正则 vs 设计逐字） | **Deferred** | 实现按设计同节**声明意图**（「`T-V5-*` 类均保留」）落地多段号捕获；照逐字正则会使全域 `T-V5-n` 引用全报悬空（破 F2 硬条）⇒ **保持实现，待设计面同步该行逐字**（设计者/父侧；本轮不改档）。已在档尾 `:297`–`:299` 留注 |
| 2（对端合规形态落 ④ 静默通过） | **Deferred** | 现行为与设计 §2.32.3.2 ④ 逐字一致（④ 未区分仓前缀形态）⇒ 属**设计面确认项**：建议对仓前缀形态跳过 ④（解析序 ③ 命中/不命中即定论）。现状无实害（本仓域内暂无 `路径（仓别）` 形态 `.md` 锚）——建议随轮 2 裁定 |
| 3（6 例归册 `slow()` 与设计快层归属注不一致） | **Deferred** | 归册方向正确（>500ms 必归册——硬红防线）；需设计面同步该注（`:2688`）。若要恢复快层两态覆盖，可让 `main` 接受显式 `root` 参数（形态归设计侧）——记待裁 |
| 4（`check-doc-width.mjs` 368 > 300） | **Not an issue** | 既有拆分计划已登记（设计 §2.32.6 档位结论「≥400 必拆 · 本批不触发」）；本批净增 = 头部清单一行；≤369 预算内、未越 500 硬限。按先例不重开 |
| 5（T-V5-15 恒真子串断言） | **Fixed** | 删恒真子串断言 → 改断言快层**默认目标 glob** 口径（发现面实核）。`test/doc-anchors.test.mjs:249` |
| 6（宽口径自指拼装） | **Fixed** | 期望值改三锚计数**独立钉死**（不再由被测对象字段拼装）。`test/doc-anchors.test.mjs:139` |
| 7（符号存在性子串匹配 + 读失败抛出） | **Fixed** | 新增 `symbolIn`（整标识符边界匹配）；宿主档不可读 ⇒ 不可判、**不抛**。`scripts/doc-anchors.mjs:57` / `:253` |
| 8（cwd 根 + 缺失目录静默「0 档」） | **Not an issue** | 与既有 `check-doc-width.mjs:324` 同口径（先例在案）；记 README 侧可补「须在仓根运行」一句 |
| 9（交付表行数口径混用） | **Fixed** | 本块口径注：`scripts/doc-anchors.mjs` **read 口径 = 299 行**（split 口径 300 = 299 + 末尾换行）；`test/doc-anchors.test.mjs` = 282；`scripts/check-doc-width.mjs` = 367 → 368。轮 2 翻转 ±0 后复核 ≤300 |
| 10（清单异质子类未分标） | **Deferred** | 层 2 开工前建议标出「对端可能命中」子类（可由 peer 根 basename 索引机械产出）——避免按同一处置模板误改方向；**该子类按设计仍属真悬空（域内不可解析），非假阳** |

**⑥ 修正后复跑（冻结态——全链机检原文）**

```
$ node scripts/check-doc-width.mjs      → OK(宽度) 137 文件 · 一致性 V1/V2/V3/V4 新增 0 · 存量 0        [exit 0]
$ node scripts/check-ledger.mjs         → OK 两档 · 0 处违规 · 基线 0 条                                [exit 0]
$ npm run lint                          → check-syntax: 312 file(s) OK                                 [exit 0]
$ node test/run-fast.mjs                → tests 607 · pass 550 · fail 0 · skipped 57 · 慢测门零拦截      [exit 0]
$ node test/run-full.mjs                → tests 607 · pass 607 · fail 0 · skipped 0                    [exit 0]
$ node test/run-integration.mjs         → tests 23 · pass 23 · fail 0                                  [exit 0]
$ node --test test/doc-anchors.test.mjs → tests 14 · pass 8 · skipped 6（slow ⇒ test:full 全跑）         [exit 0]
$ git show HEAD:scripts/check-doc-width.mjs → 临时档复跑 vs 现档：输出 599 字节逐字节一致（AC-V5-16③）  [同 exit]
$ node scripts/doc-anchors.mjs          → 悬空 347（用例号 16 · 路径/坐标 329 · 符号 2 · 域外 0）        [exit 0]
```

**⑦ 修正后首跑数字（层 2 输入——取代上面「修正前 187」块）**：候选 **8458** · 悬空 **347** · 注记豁免 **564** · 域外 **0**；命中档 **36 档**（修正前 31 档）· 宽形态（报告面）候选 3255 · 悬空 104 · 注记豁免 94。
**+160 条差异的成因（可核）**：全部为「**裸路径锚（无 `（仓别）` 注记）在本仓域内不可解析、修正前经解析序 ③ 对端根兜底通过**」类 ⇒ 系 Q-6 修正（设计 §2.32.3.2 ③「**仅合规形态**入域」逐字落地）的直接结果；用例号（16）与符号（2）两面**零变化**。
**层 2 写域（动态集）** = 下列 36 档逐档 file-level + `scripts/doc-anchors.mjs`（`V5_GATE` 翻转）——共 37 项。

**终态：clean**（审计 clean · 代码评审 pass · 修正轮 1 轮 / 3 项 Fixed + 1 项 Not an issue 复核 + defer 项已逐条上报 · 全链绿）。

**待裁/上报项（4——归父侧/设计者）**：① 设计 §2.32.3.1 V5-B 正则逐字同步 ② §2.32.3.2 ④ 对「仓前缀形态」的适用面 ③ §3.2 快层归属注同步 ④ 两处设计级假阳缺口（闭枚举 / 占位集扩充与否——F14 通道）。

---

### 轮 1 · 修正后首跑全量清单（F5 —— 报告态输出；层 2 清账输入 / 轮 2 写域来源）

**复现**：`cd thincoder && node scripts/doc-anchors.mjs`（报告态，exit 0；闸态加 `--v5-gate`）。**总计 347 条悬空**（用例号 16 · 路径/坐标 329 · 符号 2 · 域外 0）· 候选 8458 · 注记豁免 564 · 命中档 **36**。
逐档格式：`` `档`（计——分类计数）：`行 锚` · … ``。

- `docs/design/ACP-CLIENT.md`（2——路径/坐标 2）：`207 test/acp.test.mjs` · `376 src/acp/edit-bridge.mjs`
- `docs/design/ADVISOR-CONVERGENCE.md`（10——路径/坐标 9 · 符号 1）：`327 test/prompts-mirror-anchors.test.mjs` · `335 test/prompts-mirror-anchors.test.mjs:30` · `382 test/files.mjs` ·
  `421 test/prompts-mirror-anchors.test.mjs` · `446 discipline-normal.md:93` · `497 core.mjs:72` · `669 test/files.mjs` · `1183 src/specs.mjs` · `1189 context_limit` · `1247 advisor.mjs:165`
- `docs/design/AGENT-LOOP.md`（34——路径/坐标 33 · 符号 1）：`16 webview/ui.js` · `326 main.md:13` · `332 main.md:13` · `333 engineering.md:18` · `339 src/prompts/main.md` · `339 src/prompts/engineering.md` ·
  `361 main.md:28` · `362 main.md:28` · `363 engineering.md:16` · `366 subagent-spec.mjs:40` · `375 src/prompts/main.md:28` · `375 main.md:28` · `376 main.md:28` · `382 subagent-spec.mjs:40` ·
  `390 src/prompts/main.md` · `390 src/prompts/main.md` · `392 src/agent-tools/subagent-spec.mjs` · `399 main.md:8` · `401 main.md:28` · `402 engineering.md:16` · `403 discipline.md:69` · `404 main.md:8` ·
  `535 docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md` · `633 docs/design/INPUT-LOCK-BEHAVIOR-REVISED.md` · `792 src/tools/wait_for.mjs:125` · `795 src/extension/panel-messages.mjs:238` ·
  `865 src/tools/wait_for.mjs` · `868 test/files.mjs` · `898 docs/design/WEBVIEW.md` · `977 test/prompts-normal-audit.test.mjs` · `1087 core.mjs:420` · `1179 core.mjs:107` · `1209 core.mjs:70` · `1340 Notification`
- `docs/design/AGENT-PARAMS.md`（2——路径/坐标 2）：`66 test/advisor.test.mjs` · `67 test/agent.test.mjs`
- `docs/design/ASYNC-RESULT-CONTAINER.md`（1——路径/坐标 1）：`20 src/agent-tools/async-pool.mjs`
- `docs/design/CHECKPOINT.md`（9——用例号 5 · 路径/坐标 4）：`158 test/tools.test.mjs` · `158 test/cmd-restore.test.mjs` · `204 T2b` · `204 T2c` · `204 T5b` · `204 T7d` · `204 T8c` · `204 test/tools.test.mjs` · `205 test/cmd-restore.test.mjs`
- `docs/design/CONSULTATION.md`（2——用例号 2）：`146 T-R17a` · `150 T-R17a`
- `docs/design/CONTEXT-COMPACTION.md`（3——路径/坐标 3）：`292 src/compact.mjs` · `293 src/compact.mjs` · `296 src/compact.mjs`
- `docs/design/ENGINEERING-MODE.md`（72——路径/坐标 72）：`276 test/subagent-id-counter.test.mjs:12` · `552 scripts/doc-consistency.mjs` · `632 scripts/doc-consistency.mjs` ·
  `681 scripts/doc-consistency.mjs` · `689 scripts/doc-consistency.mjs` · `734 src/agent-tools/subagent-spawn-gate.mjs` · `753 activity-view.js:13` · `753 activity.js:37` · `757 persona-eng-designer.md:24` ·
  `763 src/advisor/tools.mjs:26` · `780 test/files.mjs` · `780 test/files.mjs` · `781 test/files.mjs` · `801 test/prompts-mirror-anchors.test.mjs` · `802 test/prompts-mirror-anchors.test.mjs` ·
  `822 src/agent-tools/subagent-spawn-gate.mjs` · `827 src/advisor/tools.mjs` · `832 scripts/doc-consistency.mjs` · `833 webview/activity-view.js` · `834 webview/activity.js` · `835 webview/settings-agent.js` ·
  `836 webview/settings-models.js` · `837 test/files.mjs` · `856 test/prompts-mirror-anchors.test.mjs` · `1066 test/files.mjs` · `1209 scripts/lib/doc-scan.mjs` · `1242 test/prompts-split-guard.test.mjs` ·
  `1536 test/prompts-mirror-anchors.test.mjs` · `1602 webview/loading.js:38` · `1602 webview/send.js` · `1674 test/advisor-description.test.mjs:18` · `1679 webview/loading.js:38` · `1680 webview/send.js` ·
  `1703 docs/design/TUI-STDERR-CAPTURE.md` · `1818 docs/.ledger-notify.json` · `1919 src/extension/chat-panel.mjs` · `1920 src/extension/panel-messages.mjs` · `1921 src/extension/panel-project.mjs` ·
  `1922 webview/chat.js` · `1923 webview/ledger-line.js` · `1924 webview/chat.css` · `1966 src/extension/chat-panel.mjs` · `1967 src/extension/panel-messages.mjs` · `1968 src/extension/panel-project.mjs` ·
  `1969 webview/chat.js` · `1970 webview/ledger-line.js` · `1971 webview/chat.css` · `1974 test/files.mjs` · `1975 test/files.mjs` · `1979 extension/chat-panel.mjs` · `1979 extension/panel-messages.mjs` ·
  `1979 webview/chat.js` · `1979 webview/chat.css` · `2006 src/extension/panel-messages.mjs` · `2067 scripts/doc-impact.mjs` · `2173 scripts/doc-impact.mjs` · `2225 scripts/doc-impact.mjs` ·
  `2226 test/doc-impact.test.mjs` · `2234 scripts/doc-impact.mjs` · `2234 test/doc-impact.test.mjs` · `2330 src/advisor/tools.mjs` · `2333 test/files.mjs` · `2415 docs/design/TUI-STDERR-CAPTURE.md` ·
  `2490 src/app.mjs` · `2579 test/files.mjs` · `2629 test/advisor-description.test.mjs:18` · `2724 test/doc-impact.test.mjs` · `2851 test/files.mjs` · `2882 persona-engineering.md:10` ·
  `2904 src/advisor/tools.mjs:26` · `2939 scripts/doc-consistency.mjs` · `2962 advisor-design.md:9`
- `docs/design/ESCALATE.md`（3——用例号 3）：`118 T-R17a` · `133 T-R17d` · `137 T-R17a`
- `docs/design/LEDGER-SELF-CONTAINED.md`（28——路径/坐标 28）：`117 docs/design/WEBVIEW.md` · `185 test/prompts-carryover-anchors.test.mjs` · `265 discipline-normal.md:13` ·
  `516 docs/design/AGENT-PARAMS-REQUIREMENTS.md` · `520 src/compact.mjs` · `525 src/agent-tools/subagent-escalate.mjs` · `534 docs/design/REQUIREMENTS.md` · `535 docs/design/VSC-PROMPTS.md` · `535 docs/requirements/VSC-PROMPTS.md` ·
  `545 docs/design/WEBVIEW.md` · `545 docs/requirements/WEBVIEW.md` · `546 docs/requirements/WEBVIEW.md` · `726 docs/design/AGENT-PARAMS-REQUIREMENTS.md` · `730 docs/design/REQUIREMENTS.md` ·
  `783 test/prompts-carryover-anchors.test.mjs` · `783 test/files.mjs` · `785 test/child-permission.test.mjs` · `785 test/child-permission-wiring.test.mjs` · `785 test/files.mjs` ·
  `796 test/prompts-carryover-anchors.test.mjs` · `796 test/files.mjs` · `892 test/child-permission.test.mjs` · `892 test/child-permission-wiring.test.mjs` · `892 test/files.mjs` ·
  `934 test/ledger-check.test.mjs` · `934 test/files.mjs` · `977 test/files.mjs` · `1011 test/child-permission.test.mjs`
- `docs/design/LOGGING.md`（9——路径/坐标 9）：`41 agent/execute-tools.mjs` · `47 extension/suspension.mjs` · `62 agent/execute-tools.mjs` · `66 extension/suspension.mjs` · `88 src/provider.mjs` ·
  `89 src/agent/execute-tools.mjs` · `90 src/extension/panel-chat.mjs` · `91 src/extension/suspension.mjs` · `92 src/compact.mjs`
- `docs/design/MEMORY.md`（5——路径/坐标 5）：`207 test/distill.test.mjs` · `447 src/tools/shell.mjs:233` · `455 test/config.test.mjs` · `476 core.mjs:68` · `477 core.mjs:88`
- `docs/design/MULTI-INSTANCE-COLLAB.md`（2——用例号 2）：`178 T-F4` · `178 T-F5`
- `docs/design/POOL-CONFIG-UNIFIED.md`（14——路径/坐标 14）：`31 config-io.mjs:271` · `46 webview/settings-agent.js:20` · `47 locales/en.json:235` · `47 zh.json:235` ·
  `48 extension/panel-messages.mjs:361` · `48 config-io.mjs:369` · `63 advisor.mjs:43` · `64 engineering.md:16` · `86 src/config-io.mjs` · `88 webview/settings-agent.js` · `89 locales/en.json` ·
  `91 src/prompts/engineering.md` · `96 test/advisor-description.test.mjs` · `97 test/settings-panel.test.mjs`
- `docs/design/PORTABILITY.md`（8——路径/坐标 8）：`296 discipline-engineering.md:44` · `305 advisor-design.md:9` · `310 persona-eng-designer.md:13` · `311 persona-eng-designer.md:27` · `434 discipline-normal.md:13` · `463 agent/execute-tools.mjs:108` · `483 indexer.mjs:231` · `484 advisor-round1.md:7`
- `docs/design/PROMPT-SYSTEM.md`（9——路径/坐标 9）：`230 design/COMMON-LAYER.md` · `300 test/prompts-mirror-anchors.test.mjs` · `302 test/files.mjs` · `355 test/prompts-mirror-anchors.test.mjs` ·
  `356 docs/design/VSC-PROMPTS.md` · `413 test/prompts-mirror-anchors.test.mjs` · `549 test/prompts-mirror-anchors.test.mjs` · `606 test/prompts-mirror-anchors.test.mjs` · `660 test/prompts-mirror-anchors.test.mjs`
- `docs/design/PROVIDER.md`（43——用例号 2 · 路径/坐标 41）：`434 T-C1` · `443 T-C1` · `502 advisor/provider.mjs` · `553 webview/settings-providers.js` · `563 webview/model-picker.js` · `566 send.js:47` ·
  `566 turn-model.mjs:22` · `613 webview/model-picker.js` · `664 src/config-presets.mjs` · `666 src/config-io.mjs` · `667 src/provider.mjs` · `669 src/provider/transports/openai.mjs` · `670 src/advisor/provider.mjs` ·
  `673 src/extension/settings-panel-write.mjs` · `674 src/extension/provider-flows.mjs` · `675 src/extension/vision-channel.mjs` · `676 src/extension/panel-chat.mjs` · `677 src/extension/turn-model.mjs` ·
  `678 src/extension/presets.mjs` · `679 webview/settings-providers.js` · `680 webview/model-picker.js` · `697 test/image-downgrade.test.mjs` · `698 test/config-io-panel.test.mjs` · `699 test/files.mjs` ·
  `700 test/model-picker-fallback.test.mjs` · `701 test/smoke-provider.mjs` · `767 webview/settings-providers.js:24` · `809 send.js:47` · `809 turn-model.mjs:22` · `916 src/agent/execute-tools.mjs:384` ·
  `982 test/deepseek-v41-specs.test.mjs` · `989 src/config-presets.mjs` · `1014 test/deepseek-v41-specs.test.mjs` · `1043 test/image-downgrade.test.mjs` · `1074 test/deepseek-v41-specs.test.mjs` ·
  `1075 test/image-downgrade.test.mjs` · `1076 test/files.mjs` · `1095 test/files.mjs` · `1209 src/provider/headers.mjs` · `1262 core.mjs:405` · `1293 test/model-picker-fallback.test.mjs` ·
  `1353 webview/model-picker.js` · `1354 test/files.mjs`
- `docs/design/QUICKFIX-BATCH-3.md`（14——路径/坐标 14）：`53 advisor.mjs:269` · `57 subagent-panel.mjs:112` · `57 test/advisor-description.test.mjs:18` · `58 advisor/main.mjs:94` ·
  `59 agent/execute-tools.mjs:19` · `60 subagent-escalate-async.mjs:4` · `60 subagent-escalate.mjs:16` · `61 extension/panel-messages.mjs:230` · `61 suspension.mjs:27` ·
  `91 test/files.mjs` · `93 test/advisor-description.test.mjs` · `97 src/extension/image-handler.mjs` · `98 test/image-downgrade.test.mjs` · `123 test/advisor-description.test.mjs`
- `docs/design/SESSION.md`（16——路径/坐标 16）：`7 src/extension/session-io.mjs` · `378 docs/design/GIT-ASYNC.md` · `379 system.md:24` · `396 panel-chat.mjs:348` · `402 panel-chat.mjs:60` · `409 session.mjs:261` ·
  `430 test/agent-lifecycle-singleton.test.mjs` · `442 test/agent-lifecycle-singleton.test.mjs` · `454 system.md:24` · `457 system.md:24` · `467 src/prompts/system.md` · `467 src/prompts/system.md` ·
  `472 system.md:24` · `575 session-io.mjs:104` · `575 panel-session.mjs:87` · `725 session.mjs:88`
- `docs/design/SETTINGS-TOOL.md`（1——路径/坐标 1）：`152 test/config.test.mjs`
- `docs/design/STRUCTURE-DEBT.md`（4——路径/坐标 4）：`87 session.mjs:424` · `109 system.mjs:150` · `145 METHODOLOGY.md:5` · `175 docs/COMPETITIVE_ANALYSIS.md`
- `docs/design/SUBAGENT-ID-COUNTER-AGENT.md`（2——路径/坐标 2）：`29 test/files.mjs` · `30 test/subagent-id-counter.test.mjs`
- `docs/design/TESTING.md`（19——用例号 1 · 路径/坐标 18）：`152 test/integration/files.mjs` · `278 test/activity-debloat.test.mjs` · `279 test/advisor-description.test.mjs` · `280 test/advisor-thinking-picker.test.mjs` ·
  `281 test/deepseek-v41-specs.test.mjs` · `282 test/distill.test.mjs` · `283 test/mouse-sane-gate.test.mjs` · `284 test/tool-args.test.mjs` · `285 test/websearch-config.test.mjs` · `291 test/config.test.mjs` ·
  `292 test/prompts-normal-audit.test.mjs` · `293 test/subagent-id-counter.test.mjs` · `294 test/settings-panel.test.mjs` · `312 test/integration-provider.mjs` · `382 test/integration/files.mjs` ·
  `402 helpers/webview-env.mjs` · `432 test/files.mjs` · `466 T-AP10` · `577 test/files.mjs`
- `docs/design/TOOLS.md`（4——路径/坐标 4）：`161 test/websearch-config.test.mjs` · `163 webview/settings-tools.js` · `165 test/agent-lifecycle-singleton.test.mjs:45` · `182 test/websearch-config.test.mjs`
- `docs/design/TUI-INPUT-BOX.md`（4——路径/坐标 4）：`112 test/tui.test.mjs` · `112 test/clipboard.test.mjs` · `315 test/tui.test.mjs` · `315 test/clipboard.test.mjs`
- `docs/design/TUI.md`（9——用例号 1 · 路径/坐标 8）：`432 T-S14` · `472 test/activity-debloat.test.mjs` · `567 webview/ui.js` · `1063 test/advisor-thinking-picker.test.mjs` ·
  `1068 test/advisor-thinking-picker.test.mjs` · `1297 permission-gate.mjs:28` · `1297 panel-callbacks.mjs:67` · `1297 webview/status-bar.js` · `1302 webview/status-bar.js`
- `docs/design/VERIFY-REDESIGN.md`（1——路径/坐标 1）：`34 src/agent-tools/verify-watch.mjs`
- `docs/requirements/ACP-CLIENT.md`（1——路径/坐标 1）：`17 schema/v1/schema.json`
- `docs/requirements/ADVISOR-CONVERGENCE.md`（1——路径/坐标 1）：`94 test/prompts-mirror-anchors.test.mjs`
- `docs/requirements/AGENT-LOOP.md`（6——路径/坐标 6）：`47 docs/design/WEBVIEW.md` · `72 test/helpers/webview-env.mjs` · `72 test/chat-panel.test.mjs` · `253 test/webview-input-enter.test.mjs` · `253 test/files.mjs` · `308 test/prompts-mirror-anchors.test.mjs`
- `docs/requirements/ENGINEERING-MODE.md`（5——路径/坐标 5）：`785 activity-view.js:13` · `785 activity.js:37` · `788 src/advisor/tools.mjs:26` · `789 test/files.mjs` · `966 scripts/doc-impact.mjs`
- `docs/requirements/PORTABILITY.md`（1——路径/坐标 1）：`62 indexer.mjs:231`
- `docs/requirements/PROJECT.md`（1——路径/坐标 1）：`5 docs/design/REQUIREMENTS.md`
- `docs/requirements/PROMPT-SYSTEM.md`（1——路径/坐标 1）：`152 cwd/METHODOLOGY.md`
- `docs/requirements/TUI.md`（1——路径/坐标 1）：`37 webview/input.js:76`

**合计 36 档 / 347 条**（用例号 16 · 路径/坐标 329 · 符号 2 · 域外 0）——**轮 2 清账写域 = 本 36 档 + `scripts/doc-anchors.mjs`（翻转）**。
**宽形态（报告面，不入闸——供语义巡检选样）**：候选 3255 · 悬空 104（32 档）· 注记豁免 94；命中面以平台 API / 容器对象字段 / 声明面为主（假阳类 2 面），全表可复跑取得。
**清单子类提示（评审 #10 待裁）**：本清单混列「退役档引用 / 已删测试档 / 设计计划面 / **对端仓实存档**（如 `docs/design/TESTING.md:402 helpers/webview-env.mjs` —— 本仓无、对端 `thincoder-vscode/test/helpers/webview-env.mjs` 实存）」——**均为按判据的真悬空**，仅处置方向不同（补仓别注记 vs 现态改写），层 2 开工前建议先分子类。

---

**行号 as-of 校正（D6 回读）**：本段上文引用的 `scripts/doc-anchors.mjs` 行号在收口前的档位压缩（≤300 行预算）后整体 ±1——最终锚点：`V5_GATE` `:20` ·
`symbolIn` `:70` · 解析序 ③ 对端候选 `:193` · 域外降级 `:199` · ④ 口径 `:202` · 窄符号判定 `:253` · `main` cwd `:289`。
最终行数：`scripts/doc-anchors.mjs` **300**（split 口径 300 / read 口径 **299**）· `test/doc-anchors.test.mjs` **282** · `scripts/check-doc-width.mjs` **368**（批前 367）。
批次档 §5 首跑清单块回读核对：**36 档 / 347 条逐条在档**（与本段总计一致）。

### 轮 2（条目 B = 层 2 清账 + 收闸）——交付摘要（eng-coder 自写，2026-09-13）

**前段中断事实（如实）**：轮 2 前段（既有 eng-coder 实例，2026-09-12 夜间）在清账主体落地后**上下文超限中断**——工作树留有无记录的清账改动（36 档文档 + `scripts/doc-anchors.mjs` 实装对齐），批次档与本段零记录。本续轮承接：① 审计前段 ② 收尾末 9（计划面引用）→ 复跑至悬空 0 ③ 落本记录 ④ 收闸（`V5_GATE` 翻 `true`）⑤ 收束机检。

**已清量口径（347 → 330 → 9 → 0）**：347 = 轮 1 修正后清单终值（本档 §5 轮 1 清单「合计 347」）；330 = 前段中间态（父侧任务书口径与前段落款同记；本续轮起点实核为 9）；9 = 本续轮起点（全为路径/坐标面——8 = 轮 3 交付面引用〔`scripts/doc-impact.mjs` / `test/doc-impact.test.mjs`〕+ 1 = ACP 拆分计划目标档）；0 = 本续轮收口实测（原文见下）。设计 §2.32.6 行 11 首值曾记「350」，与 347 相抵，本轮按可核值 347 归一（审计发现，已修——见「自修清单」）。

**① 审计前段（无记录改动 · 抽检 9 档）**：抽检 `docs/design/ACP-CLIENT.md` · `QUICKFIX-BATCH-3.md` · `VERIFY-REDESIGN.md` · `docs/requirements/PROJECT.md` ·
`docs/design/ADVISOR-CONVERGENCE.md` · `CHECKPOINT.md` · `LOGGING.md` · `MEMORY.md` · `PORTABILITY.md`。结论：**处置形态全落设计 §2.32.4 三选**——① 现态改写（补全路径前缀 / 行号 / `（VSC 仓）` 合规注记：
如 `advisor.mjs:269` → `src/advisor.mjs:269`；`agent/execute-tools.mjs` → `src/agent/execute-tools.mjs（VSC 仓）`）；② 退场·已废注记 + 来源指针（`已清空——测试清零批` / `已退场——TEST-LIFECYCLE` /
`已并入 config-merge——TEST-LIFECYCLE` / `已删——2026-09-07 通用验证门禁重构` 等 + 批名/档指针）；③ 订正（失效行号指针按实装改写，如 `context_limit` 生成点 `:124` → kind 字面 `run.mjs:43` + 渲染行 `loop.mjs:127`）。
**未发现只删不记**；抽检面未涉计数枚举 ⇒ D3 无触发。其余 27 档未逐档通读（形态同类）——如需全量逐档复核，可复跑清单比对（本档 §5 轮 1 清单为底稿）。

**② 逐档处置（收尾末 9——档 → 处 → 形态）**：

| # | 档 | 处 | 原形态（行号 as-of 改前） | 处置形态 |
|---|---|---|---|---|
| 1 | `docs/design/ENGINEERING-MODE.md` | 7 | 全路径引用（`:2067` 三层交付表落点列 · `:2179` §2.32.5.1 标题 · `:2231`/`:2232` 受影响表行 5/6 · `:2240` 档位结论 · `:2741` §7 修正轮行） | **现态改写（§2.32.4 ①）**：全路径 → 裸档名 + 计划注（`doc-impact.mjs`（拟落 `scripts/`）· `doc-impact.test.mjs`（拟落 `test/`）——轮 3 交付） |
| 2 | `docs/requirements/ENGINEERING-MODE.md` | 1 | `:966`（F7 行）全路径 | 同上（`doc-impact.mjs`（拟落 `scripts/`——轮 3 交付）） |
| 3 | `docs/design/ACP-CLIENT.md` | 1 | `:376` 拆分计划目标档 `src/acp/edit-bridge.mjs` | 同上（`edit-bridge.mjs`（拟落 `src/acp/`）） |

**判据与信息保全（如实）**：末 9 均为**计划面引用**（目标档按批内计划在轮 3 落地，非退场/已废——不适用注记形态）；按 §2.32.4 ① 现态改写为「与现态相符」的句子（档未落）。精确落地路径仍可恢复：批次档 §2 轮 3 小节 + 设计 §2.32.5.1 接口行（命令字面 `node scripts/doc-impact.mjs --base …` 经共享谓词 `isExecutableLine` 豁免，全路径保留合法）。判据 = 需求 §1.20 F6 / 设计 §2.32.4 ① 逐字；**未以先例为据**；措辞未用「最小改动」类。

**③ 收闸（`V5_GATE` 翻 `true`——设计 §2.32.3.5 三条件）**：① 扫描域三锚命中 = 0（② 处置 + 复跑原文）；② `scripts/doc-anchors.mjs`：`V5_GATE` `false` → `true`；
③ 快层断言 as-of 同步（`test/doc-anchors.test.mjs`——`V5_GATE === true` 断言 + 报告态 CLI 用例改 `--v5-report` 直驱，计 4 行；依据 = §2.32.3.5 条件③「一次性」）。
**增项披露**：新增 CLI `--v5-report`（临时放宽——翻转后报告态仍可直驱；对称既有 `--v5-gate`；设计 §2.32.3.5 两态行同轮对齐）；闸态零命中输出新增洁净句 `OK(V5): 0 条悬空锚（闸态——阈值 0）`（命中 >0 维持 `FAIL(V5)` 句）。
设计档同轮对齐：§2.32.3.5 两态行 + §2.32.6 行 11（清账至 0 / 翻 `true` / 增项披露落点 = 本段）+ §2.32.3.1/§2.32.3.3 两处「实装对齐」前瞻注收正为「已落」。
**反证**：夹具域 `--v5-gate` ⇒ exit 1、`--v5-report` ⇒ exit 0、无参（翻转后默认闸态）⇒ exit 1（原文见下）。

**④ 机检原文（as-of 2026-09-13 凌晨——逐字）**：

```
$ cd thincoder && node scripts/doc-anchors.mjs                                   [exit 0]
V5 文档锚一致性：扫描域 docs/design + docs/requirements · 97 档 · 对端仓 d:\teamcode\thincoder-vscode
V5 汇总：候选 8438 · 悬空 0 · 注记豁免 719 · 域外 0
  用例号（V5-B）：候选 1900 · 悬空 0 · 注记豁免 365
  路径/坐标（V5-A）：候选 3266 · 悬空 0 · 注记豁免 252 · 域外 0
  符号·窄（V5-C）：候选 3 · 悬空 0 · 注记豁免 1
  符号·宽（V5-C 报告面——不入闸）：候选 3269 · 悬空 104 · 注记豁免 101
OK(V5): 0 条悬空锚（闸态——阈值 0）

$ 反证（tmp 夹具域 + docs/design/f.md 悬空锚）：
  --v5-gate   ⇒ exit 1 · FAIL(V5): 1 条悬空锚（闸态——阈值 0）
  --v5-report ⇒ exit 0 · V5 报告 1 条（报告态——不阻断）
  （无参）     ⇒ exit 1（翻转后默认闸态）

$ node scripts/check-doc-width.mjs                                               [exit 0]
OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。
一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。
$ node scripts/check-ledger.mjs                                                  [exit 0]
OK: thincoder/docs/TODO.md / OK: thincoder/docs/TODO-archive.md · 0 处违规 · 基线 0 条
$ npm run lint                                                                   [exit 0]
check-syntax: 312 file(s) OK
$ node test/run-fast.mjs      [exit 0]  tests 607 · pass 550 · fail 0 · skipped 57（slow 归册）
$ node test/run-full.mjs      [exit 0]  tests 607 · pass 607 · fail 0 · skipped 0
$ node test/run-integration.mjs [exit 0] tests 23 · pass 23 · fail 0
$ THINCODER_TEST_FULL=1 node --test test/doc-consistency.test.mjs [exit 0] tests 14 · pass 14 · fail 0
```

**自修清单（偏差审计轮——内部 explore，1 轮，DIVERGENT → 修正全落）**：#1 §2.32.6 行 11「350」无出处且与 347 相抵 → 归一 347；#2 §2.32.3.1/§2.32.3.3 前瞻注「实装对齐随其后实施轮」与现态相抵 → 收正「已落」；#3 `docs/README.md` §3.7 V5 运行句「报告态 → 收紧后 `--v5-gate`」翻转后反向 → 改「默认闸态；临时放宽 = `--v5-report`」；#4 行 11「（披露）」无落点 → 改「披露见批次档 §5」（本段落点）。

**代码评审轮（内部 advisor type=code，1 轮，changes-required → 逐条收敛，🔴 0 残留）**：#1 🔴 实跑复证驳回（`extractAnchors` 直驱 `docs/design/ENGINEERING-MODE.md:2696` → `paths: []` + `isExecutableLine` = true——排除式 4 豁免；
该行从未入命中集：本轮起点「悬空 9」清单与其后全部复跑均不含）；#2 Fixed（本段落点）；#3 Not an issue（批档 as-of/append-only 口径）；#4 Deferred（归轮 3 条目 C「V5 常驻」）；#5 Deferred（洁净句判据面）；#6 Not an issue（清账口径来源 = 父侧任务书逐字）；#7 Fixed（§2.32.3.5「已翻」）。**终态 = clean**（Deferred 上报见下）。

**未决/上报（不静默）**：① **V5 常驻的真实域自动接线**——设计 §2.32.5.2「再出现即红」当前仅在 CLI 手工/批次面成立（`test/doc-anchors.test.mjs` 全 14 例读夹具域；发部门链无 V5 面）——归**轮 3 条目 C「常驻接线」**；② 洁净句 `OK(V5): …` 无断言覆盖且用例表未载判据——建议设计侧补判据后随批补断言；③ 批档 §2 实施后同步轮小节（`:192`）「实装对齐未落地」行按 as-of 口径保留（append-only——本段即核销注：已落地）。

**边界（实核）**：只写本仓（`scripts/doc-anchors.mjs` + `test/doc-anchors.test.mjs` + 末 9 所在 3 档 + 审计修正 2 档〔`docs/README.md` · 设计档〕）；台账零触碰；对端（VSC 仓）零触碰；批档 §1 / §2 / §3 零触碰；措辞未用「最小改动」类；未以先例为据。

### 轮 3（条目 C = 层 3 防回潮 + 流程入规）——交付摘要（eng-coder 自写，2026-09-13）

**交付面（8 档 + 本段）**：`scripts/doc-impact.mjs`（新，142 行）· `test/doc-impact.test.mjs`（新，91）· `scripts/doc-anchors.mjs`（改：排除式 5① 收窄为 `.md` + 坐标行区间 `:N-M`——300 行零变）·
`test/doc-anchors.test.mjs`（改：291 → 298）· `src/prompts/discipline-engineering.md`（改：252 → 259）· `docs/design/prompts/discipline-engineering.md`（改：181 → 188）·
`docs/design/ENGINEERING-MODE.md`（机械登记，3025）· `docs/requirements/ENGINEERING-MODE.md`（F7 行 as-built，1000 零变）。行数口径 = read 工具（split 含尾空行，与设计 §2.32.6 as-built 一致；逐档实测）。

**① 反查脚本（设计 §2.32.5.1；T-V5-13/14）**：`node scripts/doc-impact.mjs --base <ref> [--files a,b] [--json]`——`--base` **必给**（无 HEAD 默认）；输入 = `git diff --name-only`（变更文件）+ `git diff -U0`（新增/删除行 token：强形态过滤保留——camelCase / snake_case / 全大写 / `_` 前缀 / 点径（非扩展名尾）；
反引号标识符经 V5 `extractAnchors` 并入——宽形态面较松，为已登记取舍）；输出 = 变更面 + `docs/{design,requirements}` 命中档清单（每档一行 + 命中词 + 命中数）+ 建议录入行；
**只读 / 不写 / 不阻断**——正常运行与 git 降级均 exit 0（降级打印「反查跳过」行），缺 `--base` ⇒ exit 2（fail-loud；已登记设计 `:2183` + 互指句）。实现形态 = 纯函数 `docImpact({changedFiles, changedSymbols, docsRoot})`（快层直驱）+ 薄 git 包装（慢层 `slow()` 归册）。扫描域常量复用 `V5_SCAN_DIRS`（单源）。
**② V5 常驻接线（Deferred #4 收口）**：真实域自动接线落 = `test/doc-anchors.test.mjs` 新增 **T-V5-15②**（`slow()`——`scanDocAnchors(REPO)` 默认 peer 解析，实测 ≈1.3s）：断言默认闸态 + 真实域 `danglingTotal` = 0 + 洁净句；
发部门链（`lint` → `test:full` → `test:integration`）经 `test:full` 的 `test/*.test.mjs` glob **间接生效**（设计 §2.32.5.2 现载——「① 快层面 ② 发部门链经快层间接」，与 V1–V4 的 T41① 慢层真域口径同族）。**`package.json` 零触碰**——CLI 无 `doc:check` 脚本，设计现载无此环（`doc:check` 为 VSC 侧载体；两端各自保留）；如需专环须设计修订后另派。
**③ 提示词落笔（F20——1 节 × 2 副本）**：设计 §2.32.5.5 行 1–4 逐字落两副本——「文档与台账自持」续编号 6–8（跨仓批每仓一轮 / 子代理只写本仓 / 需对端改动停下上报）+ 另起节「改动面反查（文档影响面）」（脚本名未入提示词）。两副本 + 与设计落笔表**逐字对拍全等**（7 行段 byte-identical = true；4/4 行与表格逐字符一致）。
**④ Deferred #5 收口**：闸态洁净句 `OK(V5): 0 条悬空锚（闸态——阈值 0）` 补断言（`test/doc-anchors.test.mjs` T-V5-12① 夹具域 + T-V5-15② 真实域两处）；设计 §3.2 T-V5-12 行同步（「轮 3 补断言」）。
**⑤ 顺带两项（父侧裁——小假阴收口）**：① 排除式 5① 由「后接 `§N` 即跳」收窄为「**`.md` token** 后接 `§N` 才跳」（V1 只判 `.md`；非 `.md` 照判存在性）——设计 §2.32.3.1 排除式 5 + §2.32.3.6 V1 行同步；
② V5-A 坐标扩**行区间 `:N-M`**（整条抽取、不截断——对端点名 `stripLineNo` 于本仓不存在，落点 = `PATH_RE` 坐标组 + 反查侧行内剥除，同规语义）——设计 §2.32.3.1 正则 + 射程行同步。
**复跑对照**：两项改动前后真实域输出**零差异**（V5-A/V5-B 候选 ±0、悬空 0；全 `docs/**` 无「非 `.md`+`§N`」实例、`:N-M` 实例全在批档域外）——**新可见项 0，无待处置面**；夹具级锁定 = T-V5-2 扩 ⑤ 断言（非 `.md` 不豁免两向 + `:N-M` 整条抽取——设计 §3.2 T-V5-2 行同步）。
**⑥ 设计侧机械登记**：§2.32.3.1（正则 + 排除式 5）/ §2.32.3.6（V1 行）/ §2.32.5.1（标题 + 退出码互指句）/ §2.32.5.2（T-V5-15② 指针）/ §2.32.6 行 1–6 · 9–10 as-built（142 / 91 / 291→298 / 259 / 188 / 3025 / F7 零变）/ §3.2（T-V5-2 / T-V5-12 / T-V5-15 行 + 快层归属注收正：快层 8 例 · 慢层 7 例 · 全 15 例）/ 三层交付表行；需求档 F7 去计划注；「拟落」计划注全清（§7 历史条目除外）。

**机检原文（as-of 2026-09-13——逐字）**：

```
$ node scripts/check-doc-width.mjs                                                     [exit 0]
OK(宽度): 扫描域全部 .md 无 >300 字符单行（137 文件）。
一致性 V1/V2/V3/V4：新增违规 0 条 · 存量（基线内）0 条。
$ node scripts/check-ledger.mjs                                                        [exit 0]
OK: thincoder/docs/TODO.md / OK: thincoder/docs/TODO-archive.md · 0 处违规 · 基线 0 条
$ npm run lint                                                                         [exit 0]
check-syntax: 314 file(s) OK
$ node scripts/doc-anchors.mjs                                                         [exit 0]
V5 汇总：候选 8456 · 悬空 0 · 注记豁免 719 · 域外 0（用例号 1908 / 路径·坐标 3274 / 符号窄 3；符号宽报告面 3271·悬空 103——不入闸）
OK(V5): 0 条悬空锚（闸态——阈值 0）
$ 夹具反证（tmp 域 + 悬空锚）：--v5-gate ⇒ exit 1 · FAIL(V5): 1 条悬空锚；--v5-report ⇒ exit 0；无参（默认闸态）⇒ exit 1
$ node test/run-fast.mjs                                                               [exit 0]
tests 611 · pass 552 · fail 0 · skipped 59（slow 归册）
$ node test/run-full.mjs                                                               [exit 0]
tests 611 · pass 611 · fail 0 · skipped 0
$ node test/run-integration.mjs                                                        [exit 0]
tests 23 · pass 23 · fail 0
$ node scripts/doc-impact.mjs --base HEAD（正例——本仓整批未提交面）   [exit 0]
变更面：文件 39 个 · 符号候选 139 个 → 反查命中 84 档（逐档行 + 命中词 + 命中数）+ 建议录入行
$ 反例（tmp 无变更 git 仓）：文件 0 · 符号候选 0 → 反查命中 0 档 · exit 0
$ 缺 --base ⇒ exit 2（用法行）；非 git 目录 ⇒ 「反查跳过（不阻断）」+ exit 0
$ 两副本对拍（7 行段 JSON 全等）：byte-identical = true（src@123 / mirror@98）；与设计 §2.32.5.5 行 1–4 逐字 4/4 全等
```

**审计与评审（内部协议——AGENT-LOOP §18）**：① **explore 偏差审计 1 轮 = DIVERGENT → 3 发现全处置**：🟡 本段未落（即本段落地消解）· 🔵 仓外证据脚本 `d:\teamcode\round3-evidence.mjs` 越出写域（已删除——零仓库污染，如实披露）· 🔵 退出码 2 未登记（已登记设计 §2.32.5.1 + 互指句）。
② **advisor code review 1 轮 = pass（🔴0 · 🟡2 · 🔵3）**，逐条裁决：🟡#1 退出码口径四处粒度不一 → **Fixed**（§2.32.5.1 补互指句；F7 / D-V5-6 / AC-V5-12 文本本体保留——语义非门禁无出入，归父侧文档层对齐，见「上报」）· 🟡#2 两处判据修正无夹具锁定 → **Fixed**（T-V5-2 扩 ⑤ 断言 + 设计行同步）·
🔵#3 点径含裸文件名形态 → **Fixed**（点径排除代码/文档扩展名尾——与对端 A2 排除式同族；测试反证含 `config.json`）· 🔵#4 设计档 §7 缺轮 3 行 → **上报**（§7 属历史注记面，机械登记落在 §2.32.6 行 2 动作列；随收口轮补一行或由父侧明示不另起）· 🔵#5 批档 §2 受影响文件表轮 3 各档未回填实测（行 6/7/9/10 仍预估；设计表已实测）→ **上报**（表头已声明回填口径，随同步/收口轮按设计表数值回填）。**终态 = clean**。

**未决/上报（不静默）**：① 退出码口径三处不全述（需求 §1.20 F7「退出码 0，查询工具」· 设计 D-V5-6「非门禁（退出码 0）」· AC-V5-12「退出码 0（非门禁）」——§2.32.5.1 已两值并列 + 互指句，三处本体未改）——建议父侧文档层统一括注或维持现状（语义无出入，非门禁面不阻断）；② 设计档 §7 变更记录缺轮 3 行（见上）；③ 批档 §2 受影响文件表轮 3 实测未回填（见上）；④ 反查「宽形态并入面」（反引号 `<file>.md` 类经 V5 宽形态仍入候选）为已登记取舍（档头措辞已收正），如需更严另议。

**边界（实核）**：只写本仓（8 档 + 本段；`package.json` / 台账 / `bin/` / `src/**` 代码面零触碰）· 对端（VSC 仓）零触碰 · 批档 §1–§4 零触碰（本段 = §5 append）· 措辞未用「最小改动」类 · 未以先例为据 · 无凭证值入档。

**勘误（同段 D6 回读补正——append 不改原文）**：① 上文「`test/doc-anchors.test.mjs`（改：291 → 298）」的起点应为准 **282**（轮 1 终值；轮 2 为 4 行同级改、行数零变）——轮 3 净增 **+16 → 298**；291 为轮 3 中途值（首轮增补后）。
② ⑤ 项「两项改动前后真实域输出零差异」= **代码修正落盘当时**（设计/需求档登记之前）的前后对照（逐字对照 = no diff）；此后轮 3 自身的文档登记新增引用使计数面变化：用例号候选 +8 · 路径·坐标候选 +8（均悬空 0）· 宽形态候选 +2 / 悬空 −1（`docImpact` 落地自清——报告面不入闸）——**全文悬空恒 0、闸态 exit 0**。
③ 交付面 8 档中 `scripts/doc-impact.mjs` / `test/doc-impact.test.mjs` 的最终行数 = **142 / 91**（点径扩展名排除修正后实测；设计 §2.32.6 行 5/6 同值）。

## §6 验证与收口（父代理自写）

**收口 2026-09-13（DOC-CODE-RECONCILE——文档↔实装对账：全量清理 + 防回潮）**

**用户裁定**：2026-09-12 22:54「可以啊，我希望完整的全面清理解决」· 23:37「a 批准」（端差选 **A = 登记共存**）。

| 面 | 结果 |
|---|---|
| 层 1 装置 | `scripts/doc-anchors.mjs`（300 行——三锚 + 假阳十类 + 注记闭枚举 17 项 + 两态 `V5_GATE`/`--v5-gate`/`--v5-report`）· `test/doc-anchors.test.mjs`（298 行）|
| 层 2 清账 | **347 → 0**（用例号 16→0 · 路径 329→0 · 符号窄 2→0；宽形态 104 为**报告面**不入闸）——逐档处置记录 = 本档 §5（含前段中断事故与续轮审计）|
| 层 3 防回潮 | `scripts/doc-impact.mjs`（142 行反查；`--base` 必给；只读不阻断）· **常驻 = T-V5-15② 真实域慢例**（在 `test:full` 内 ⇒ 再出现即红）· 语义巡检机制 = 设计 §2.32.5.3（周期/归属/记录形态）· **F20 派单与写域纪律 = 提示词两副本落笔**（byte-identical + 与设计逐字 4/4 全等 ✓）|
| 门禁（终态实跑）| 宽度 0（137 档）· V1–V4 0/0 · 台账 0 · lint 314 · fast 611/552/0 · **full 611/611** · **集成 23/23** · **V5 悬空 0（闸态 exit 0）** |
| 签入 | `dd01ab6`（44 档 +2362/−291）→ gitee + github 双远端已推 |
| 设计槽 | 链终消费（值不落档）|

**语义巡检（AC-DC11 第二子条）**：无锚语义句（机器判不了）——本批语义面发现 = 设计同步轮 7 项 + 端差 1 项（均入本档 §2）✓；机制（周期/归属/记录形态）= 设计 §2.32.5.3。
**未落项（如实）**：无（本仓 **无** `doc:check` 专环——那是对端载体；本仓常驻面 = `test:full` 内的 T-V5-15② ✓）。
**遗留**：见 `docs/TODO.md` 技术待办（`:N/:M` 多坐标形态 · 漂移类待核面）。
