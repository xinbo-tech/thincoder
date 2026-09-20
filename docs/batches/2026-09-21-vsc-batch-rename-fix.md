# VSC 端 batch 改名镜面修复（VSC-BATCH-RENAME-FIX）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 06:42 · 来源 = 用户 06:42「两组都处理了吧」（批准 VSC 遗留两组同批处理）。
> 台账 = #28（需求池 · 归批）。
> 前情 = docs/batches/2026-09-21-batch-lifecycle-tool.md §6（已收口 2026-09-21）——本批 = 其上抛③「VSC 5 红归 VSC 轮」的兑现批。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-21（实施验证通过 · VSC 876/876 独立复测 · 台账 #28 已核销；记录冻结）

**痛点实证**（父侧 06:39 独立实测）：batch 改名批（`0b45957c`）落地后 VSC 全量 **876 中 5 红**。逐红定性：

**组 1（4 红 · 机械面——基线快照钉改前形状）**：

| 红 | 档:行 | 现断言 | 应为 |
|---|---|---|---|
| W9① 核登记册名集 | `agent-tools-registry.test.mjs:29` | 15 名含 batchSegmentTool | **16 名**加 `batchTool`（核册双导出：主名 + 别名，批档 AC-2） |
| T57 装配分支 | `eng-designer-role.test.mjs:105/109` | designer 挂 `batch_segment` + 经它写 §2 | 断言 `batch`（生产挂载主名；:109 写 §2 用例可改走主名 execute） |
| T57 零回归 | `eng-designer-role.test.mjs:126` | eng-coder 名单含 "batch_segment" | 字面改 `"batch"` |
| T60 只读面 | `batch-segment.test.mjs:178` | 评审写通道名 | 同根因随主名 |

**组 2（1 红 · 待定性）**：T5 eng-designer 行为红（断言 B「矩阵同源 5 角色」）——不在实施轮 coder 勘明的 3 处机械清单内，红因需实跑细看：同根因则机械修复顺手落；属行为面（如 depth-0 挂载差异）则停下上抛，勿自行裁。

**边界（不做什么）**：不改核侧（`0b45957c` 已收口）；不动 #84 缝契约；VSC prompt 镜像面随批收口（若有旧名残留——逐处列披露）；T5 若定性为行为面 ⇒ 停下上报，本批不裁行为。

### 1.0 授权口径

用户 06:42「两组都处理了吧」= 批准两组同批处理与排程。评审点火权与 §4 批准权处理方式沿用本会话既定授权惯例（LEDGER-EXECUTOR §1.0 与 BATCH-LIFECYCLE-TOOL §1.0 两式，按用户届时口径落）。

## §2 批次任务与设计（eng-designer）

**状态行**：（eng-designer 写入时更新）

**本批条目（覆盖）**：

**设计档落点**：

**机制设计**：

**受影响文件与测试面**：

**验收对照**：

**关键决策**：

**上抛项**：

**状态行**：🔄 设计完成（eng-designer · 2026-09-21）

**本批条目（覆盖）**：VSC 全量 876 中 5 红收正（核 `0b45957c` batch 改名镜面遗留）：

| # | 红例 | 修复面 |
|---|---|---|
| 1 | W9① 核登记册名集（`agent-tools-registry.test.mjs:29/:36`） | `batchSegmentTool` → `batchTool`（仍 15 名——`agent-tools.mjs:17/:21` 实读：过渡别名不入登记册，换名非加名） |
| 2 | T57 正常（`eng-designer-role.test.mjs:98/:105/:109`） | 挂载名断言随主名 `batch`；`:109` 改走主名 execute 形 `{action:"append",…}`（`batch.mjs:321` required + `:342` 分发——缺 action 即 throw） |
| 3 | T57 零回归（`eng-designer-role.test.mjs:120/:126`） | eng-coder 名单 `"batch_segment"` → `"batch"` |
| 4 | T60（`batch-segment.test.mjs:183/:186/:187/:188`） | 评审挂载名断言随主名（核 `advisor/loop.mjs:45` 实读已挂 `batchTool(batchDoc,{review:true})`——主名 `batch`） |
| 5 | T5（`host-shape-spawn.test.mjs:125/:126/:127`） | `FAMILY_FIXTURE`：depth-0 行加 `"batch"`（15→16 名）；eng 两行换名；coder/explore/explore-eng 三行不动 |

**设计档落点**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` 新增 **§6.28**（先例 = §6.24 批 VSC-MIRROR-RETIRE 同型落点；候选 `docs/vsc/design/WEBVIEW-TOOLTABLE.md` 不存在——glob 实勘，不另建档）。

**机制设计**：断言面单侧收正——5 红全为测试断言钉改前形状；VSC 生产装配零自持 batch_segment 活体（工具本体 = 核单源 family 段 / advisor 挂载；端侧仅 `_batchDoc` 绑定 = `setup.mjs:325–327`），生产行为零改。随批收正注释面 6 处 = src 4（`setup-tooltable.mjs:4/:22` · `setup.mjs:5/:325`）+ 测试档头注 2（`batch-segment.test.mjs:8` · `eng-designer-role.test.mjs:8`）。保缝面：① `configureBatchSegment` 缝契约名不动（#84 记账缝——`setup-tooltable.mjs:14/:27`）；② shim 直调用例 T59/T66/T-FZ3 保留（别名等价载体）；③ 迁移错误串 `"batch_segment:"` 前缀逐字保持（`batch.mjs:172` 等核锚——非本批改名面）。

**受影响文件与测试面**（行数口径 = wc -l，as-of 2026-09-21 实读）：

| 档 | 现量 | Δ |
|---|---|---|
| thincoder-vscode/test/agent-tools-registry.test.mjs | 70 | ±0 |
| thincoder-vscode/test/eng-designer-role.test.mjs | 199 | ±0 |
| thincoder-vscode/test/batch-segment.test.mjs | 233 | ±0 |
| thincoder-vscode/test/integration/host-shape-spawn.test.mjs | 215 | ±0 |
| thincoder-vscode/src/agent/setup-tooltable.mjs | 230 | ±0（注释面） |
| thincoder-vscode/src/agent/setup.mjs | 500 | ±0（注释面） |
| docs/core/design/AGENT-LOOP-SUBAGENT.md | 2155 | +约55（§6.28 + 变更记录） |

**验收对照**：

- **AC-1**（硬）：`cd thincoder-vscode && npm test` ⇒ 876/876 零红（改前 871/876）。
- **AC-2**：四红源档单跑全绿——`node --test test/agent-tools-registry.test.mjs test/eng-designer-role.test.mjs test/batch-segment.test.mjs test/integration/host-shape-spawn.test.mjs`（cwd = thincoder-vscode）。
- **AC-3**：残留字面清零——VSC `src`+`test`+`webview` 域 snake_case `batch_segment` 字面命中 = 0（注释面收正后；`batchSegmentTool`/`configureBatchSegment` camelCase 缝名与 `batch-segment.mjs` 连字符路径不计入——形态不同）。

**关键决策**：

- **D-1** 登记册仍 **15 名**——§1 表「16 名」不成立（`agent-tools.mjs:17/:21` 实读：`batchSegmentTool` 过渡别名不入登记册，`:29` 换名后名数不变）。
- **D-2** T60 四处随改主名——交接前注「T60 全保留」不成立（`loop.mjs:45` 实读：评审挂载已是主名 `batch`，断言钉旧名即红）。
- **D-3** `:109` 改走主名 execute 形（`batch.mjs:321` `required:["action"]` + `:342–353` 分发实读——缺 action 落 unknown action throw）。
- **D-4** 注释面 = **4 处**（前注 6 处不确——setup-tooltable.mjs 实勘仅 `:4/:22`）。
- **D-5** 设计档落点 = AGENT-LOOP-SUBAGENT.md §6.28（VSC 装配镜像面 owner 档；另建 vsc 档 = 单一权威源破面）。

**上抛项**：无。观察登记（不阻塞）：`setup.mjs` 现量 500 = 硬限值在位——本批 ±0 不越线；该档后续任何净增行即越硬限，拆分另案归父侧派单。

**§2 落笔后实勘收正（追加 · 2026-09-21）**：

- ① **AC-3 豁免集补齐**：`batch-segment.test.mjs:126` 核错误串前缀断言（`/^batch_segment: the text contains a section header line/`）= 核契约保缝面（核 `batch.mjs:251` 对子代理身份错误串逐字保持 `batch_segment:` 前缀）——不计入清零命中面；webview 域实勘零命中（AC-3 三域 `src`+`test`+`webview` 覆盖确认）。与设计档 §6.28 A-3 豁免集同源。
- ② **注释面计数再收正**：合计 **6 处** = src 4（`setup-tooltable.mjs:4/:22` · `setup.mjs:5/:325`）+ 测试档头注 2（`batch-segment.test.mjs:8` · `eng-designer-role.test.mjs:8`）——本节前文「注释面 4 处 / 交接前注 6 处不确」以本条为准（测试头注两处为本席全域 grep 追加发现；设计档 §6.28 D-4 同源）。
- ③ **红 4 定性补记**：T60 四处中 `:183/:188` 在旧名下恒真（误绿面——断言力已失），`:186/:187` 为真红；修复 = 四处全改主名 `batch`（断言力恢复）。设计档 §6.28 D-2 同源。
- ④ **§6.28 已落**：`docs/core/design/AGENT-LOOP-SUBAGENT.md`（坐标表 / 保缝面三处 / D-1–D-5 / U1–U5 / A-1–A-3 / 边界 + 变更记录一行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审射程 = 批档（§1/§2）+ 设计档 §6.28 两份 in-scope 档全文实读；代码面与行数读数不在本轮射程（声明射程外 · unverified），按设计档 as-of 实读采信。无 Document map / Project standards 档 → Document ownership 与方法论维度降级判定（计入发现 6）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 文档一致性（R7a） | 🟡 | 坐标面两档不一致：批档 §2 本批条目行 2/3 载 `eng-designer-role.test.mjs:98/:120`（批档 :56–:57）、§1 表 T60 载 `batch-segment.test.mjs:178`（:21），而 owner 面 §6.28 改前→改后表仅列 `:105/:109/:126`（设计档 :2041–2043）与 `:183/:186/:187/:188`（:2044）——`:98/:120/:178` 在 owner 面无落点，亦无「用例块首行 vs 断言行」收拢注记；实施者仅按 §6.28 作业时，若 :98/:120 含 snake_case 字面则 AC-3 命中不豁免、A-1 回炉。 | §6.28 表或 §2 追加块补一行坐标收拢注（:98/:120/:178 与所列断言行是同块首行还是独立改动点，逐一定性），两档坐标集归一。 |
| 2 | Doc hygiene（2026-09-18 用户裁定） | 🟡 | 批档 §2 机制设计句（批档 :63）留失效计数「随批收正注释面 4 处指称（…交接前注「6 处」实勘收正——setup-tooltable 仅 2 处）」——已被同节追加②（:96，合计 6 处 = src 4 + 测试头注 2，以本条为准）取代，句内自带辨析随之失效；规范面 4/6 两读并存（owner 面 §6.28 D-4 :2063 与行 6/7 :2047–2048 均为 6 处，终值无歧义）。设计档 D-1/D-4 的「前注 X 不确/不成立」括注（:2058/:2063）为同族修订式残留（较轻——判据/终值自持）。 | §2 机制设计句就地改写为现态陈述（「注释面 6 处 = src 4 + 测试头注 2」），4→6 勘误过程只留追加块；D-1/D-4 括注可顺手改现态（历史归变更记录/追加块）。 |
| 3 | Acceptance criteria | 🔵 | A-3（设计档 :2083，残留清零）有判据 + 豁免集（:2085–2086）但无逐字机检命令（同档 §6.27.12.13 U-SL4 先例 = 单行 node -e 结构机检）；cmd.exe 三域 + 三豁免需实施者自拼，可验非即跑。 | 补一行逐字检查命令（`batch_segment` 为 ASCII 串，findstr / node -e 均可；配三豁免过滤），消豁免应用主观空间。 |
| 4 | 证据面（射程限制） | 🔵 | 设计全部代码坐标（`agent-tools.mjs:17/:21`、`batch.mjs:321/:342/:251`、`family-tools.mjs:141/:170/:171`、`advisor/loop.mjs:45`、`setup.mjs:325–327` 等）与受影响文件行数表（批档 :67–:75）均标「实读/实勘」，本轮声明射程限两档 → 代码面未复核（unverified-by-review）。 | 本批无需动作；A-1/A-2 全量跑测即机械复核（红清零 = 坐标面自证）。 |
| 5 | 数字漂移（R7c） | 🔵 | §1 表 W9①「应为 16 名」（批档 :18）与终态 15 名（D-1）在 §1 原句未就地注记——收正链完整（D-1 :2058 + 批档 :55 双点注明「§1 表『16 名』不成立」）。 | 可选：§1 该行尾加「（→ D-1 收正为 15 名）」指位；不加亦可（链路可追溯）。 |
| 6 | Document ownership / 方法论 | 🔵 | 本轮无 Document map / Project standards 档 → 落点判定降级：D-5（设计档 :2064–2065，本档 §6.28 承 §6.24 先例 + 候选 vsc 档 glob 实勘不存在）按档内先例自洽，但「是否另有他档已 own 该面」无法对全仓档图复核（unverified）。 | 现有射程内不构成阻塞；若仓内另有档图，收口轮对一眼即可。 |

覆盖核对：5 红全部有逐处坐标 + 改后形态（红 1–5 ↔ U1–U5 ↔ A-2 回指闭合）；保缝面三处（缝契约名 / shim 直调用例 / 核错误串前缀）与 AC-3 豁免集同源；边界明示（核侧 / #84 缝 / shim / 错误串前缀零触）；`setup.mjs` 现量 500 = 硬限在位、本批 ±0、净增拆分另案已登记（批档 :91 · 设计档 :2090）——尺寸面合规。

计数：🔴 0 · 🟡 2 · 🔵 4。

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：✅ 设计批准（2026-09-21 07:01 · **父侧代签**——本会话授权惯例沿用：LEDGER-EXECUTOR §1.0「排程与推进授权」+ BATCH-LIFECYCLE-TOOL §1.0「04:08 自动跑完吧代授权」+ 台账 #28 立批时用户 06:42「两组都处理了吧」批准范围）。**代签三条件核验**：① 复评 VERDICT pass（§3 轮次 1：🔴 0 · 🟡 2 · 🔵 4）✓ ② 无修正轮（评审未要求修正，🟡#1/#2 归实施轮与收口轮顺手落——裁定见下）✓ ③ token 已签发 ✓。
**随批准裁定（6 项发现归属）**：🟡#1（坐标收拢注）→ 实施轮 eng-coder 顺手落（§6.28 表或批档追加块一行）；🟡#2（:63 失效计数句就地改写 + D-1/D-4 括注现态化）→ 实施轮顺手落（批档属其 append 面 + 设计档面）；🔵#3（A-3 逐字机检命令）→ 实施轮补进 §6.28；🔵#4/#6 → 无需动作（射程限制声明在案）；🔵#5 → 可选不派。**无 Deferred 悬空**。

## §5 实施记录（eng-coder）

### 轮次 1（实施 · eng-coder）

**交付摘要**：核侧 batch 改名（`0b45957c`）镜面遗留 5 红收正 + 注释面 6 处 + §4 裁定三项文档顺手活——20 处编辑全部落位（registry :29/:36 共 2 · eng-designer :8/:98/:105/:109/:120/:126 共 6 · batch-segment :8/:183/:186/:187/:188 共 5 · host-shape :125/:126/:127 共 3 · setup-tooltable :4/:22 共 2 · setup.mjs :5/:325 共 2），全部行内替换 ±0 行（git diff 权威：每 hunk `-旧 +新` 同位成对，无增删行）；零生产逻辑改动（src 两档仅注释行变，`configureBatchSegment` 注册体原样）；核侧零触；保缝面三处零触。

**验证记录**：
- AC-1：`npm test` 全量 **876/876 零红**（fail 0 · cancelled 0 · skipped 0 · duration_ms 53849）——改前基线实测 871/876（5 红坐标 = 设计逐处表红①–⑤）
- AC-2：四红源档 `node --test` 单跑 **28/28 全绿**
- AC-3：三域机检（src+test+webview）snake_case `batch_segment` 行命中 = **1**（恰 = `batch-segment.test.mjs:126` 核错误串前缀断言，豁免③），豁免集外 = **0**；A-3 逐字机检命令（§6.28 :2090–:2092，实施轮代落）实跑输出 `1` 自证可用

**审计与评审轮次**：
- explore 发散审计（对照 §6.28 逐处表逐行 + 保缝面/断言力/落点归属）：11 表行全吻合、保缝面三处零触、核侧与生产逻辑零触、±0 行、`:109` 写入断言真验非恒真（:110 落档内容断言）、U4 四处方向逐字同向——四类偏差均未发现，**CLEAN**
- advisor 代码评审（收敛检查）：**VERDICT: pass**（1 🟡 已裁定登记不阻塞 + 2 🔵，零 must-fix）；一条引用校验旗标（setup-tooltable.mjs:4 引文省略行首 `* 一致：` 前缀）经实读复核闭合——内容实况与断言一致
- 终态 = **clean**；fix round = 0

**§4 裁定三项顺手活落位**：🟡#1 坐标收拢注（设计档 :2050——`:98/:120/:178` = test() 标题行定性）✅；🟡#2 批档 :63 失效计数句现态改写（「注释面 6 处 = src 4 + 测试头注 2」）+ 设计档 D-1/D-4 修订式括注删除、现态化（:2060/:2065）✅；🔵#3 A-3 逐字机检命令补入 §6.28（实跑输出 1 自证）✅；🔵#5（§1「16 名」尾注）按 §4 裁定不派，未落。

**上抛披露（两则，均非本批引入）**：
1. 批档 §2 受影响文件表 as-of 行数读数与现盘 `wc -l` 在 5/6 档均匀 +1 偏移（表载 70/199/233/215/230 vs 现盘 69/198/232/214/229；setup.mjs 500 恰吻合）——git 权威证本批 ±0 行，属先在计量口径差（advisor 🔵：收口轮可注记或刷新，不阻塞）
2. 工作树先在改动 `thincoder-vscode/README.md`（"zero npm dependencies" → "zero third-party runtime dependencies"）——本会话开始前已在，本批零触；措辞与 AGENTS.md 硬约束句一致，随 §6 披露面带走

## §6 验证与收口（父代理）

### 6.1 实施验证（父侧独立复测 · 2026-09-21 07:17）

- **AC-1 独立复跑**：`npm test` = **876/876 零红** ✓（与 §5 声明一致；改前基线 871/876）。
- **AC-3 独立扫描**：三域 snake_case `batch_segment` = **1 命中**，坐标 `test/batch-segment.test.mjs:126`——恰 = 豁免③（核错误串前缀断言），**豁免集外 = 0** ✓。
- **AC-2 采信**（§5 实跑 28/28；AC-1 全量含四档，独立复跑已覆盖）。
- 工作树核：本批触面 7 档 + 批档新档，与 §2 受影响表逐一对号；`thincoder-vscode/README.md` 先在改动（"zero third-party runtime dependencies" 措辞——与 AGENTS.md 硬约束一致）**非本批面**，不随批带走（留工作树，属 README 维护线）。
- §4 裁定三项顺手活落点核：🟡#1 设计档 :2050 收拢注 ✓ · 🟡#2 批档 :63 现态改写 + 设计档 :2060/:2065 括注现态化 ✓ · 🔵#3 A-3 机检命令 §6.28 :2090–:2092 ✓（实跑输出 1 自证）。

### 6.2 上抛项收口（§5 三项）

| # | 上抛 | 裁定 |
|---|---|---|
| ① | §2 文件表行数口径差（5/6 档 +1） | 计量口径差（表 = 06:5x as-of、盘 = 本批 ±0 后）——**收口轮注记即可，不刷新**（表值系设计轮实测，追改反而造新漂移；git ±0 为权威）|
| ② | 工作树先在 README.md 改动 | 非本批面，不随批提交（见 6.1）|
| ③ | `.npmtest-out.txt` 临时档 | 已建即清，无残留 ✓ |

### 6.3 台账与凭证

- 台账 **#28 → 已核销**（结算依据 = 6.1 复测 + §5 交付表 + 本 §6）；VSC 镜像面 batch_segment 活体清零（豁免集外）。
- 凭证槽 consume：designId `9ff333a1-3cc8-4699-a854-0ff16b787ed5`。

### 6.4 收口

- 提交 = **`（本 §6 同轮落地，hash 见 git log）`**；提交面 = 本批 7 档 + 批档（**README.md 不入**）；CLI 实例在飞面零触碰——path-limited。
- 状态行冻结：§1 →「✅ 已收口 2026-09-21」。
- 遗留债：无新债（VSC 面活体清零；#4 live 块等其余台账项不在本批域）。
