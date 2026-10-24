# 2026-10-24 · FR45 落地：行宽判据换成段判据
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-22 12:09 FR45 裁定（需求档 §13.23）+ 2026-10-24 23:41「我有个问题为什么300字行宽的处理仍然是折行？」+ 23:44「先把这个落地吧。」。
> 台账 = #1777（ENGINEERING-MODE · 归批）。前情 = 2026-10-24-prompt-wording-clarity.md（已收口 2026-10-24）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**要落地的裁定（FR45，2026-10-22 12:09 已成文于需求档 §13.23，从未实施）**：行宽判据换成段判据——单位是段不是行（「折行能把行宽治好，段落还是那一段」）；名字说出真问题（`paragraphMax` · 「一段太长 N 段」· 不再出现「行宽」）；阈值 300 字符一段；存量与新增分域判（存量只点名、不计入拒因——与台账 `#1734` 是同一件事的两半）。

**为什么现在做（今晚症状）**：RTM 与 spawn 两批的逐字块撞行宽门（1000 / 335 字符单行），父侧把「折行不折字」当修法连派两轮——正是 FR45 点名否掉的处理方式。引擎没换，修法就永远停在「折行过门」。

**本批范围**：引擎换判据（`width.mjs` → `paragraph.mjs`，含报面与常量名）· gate 分域（新增拒、存量点名）· 需求档 F3 判据条随正 · 引「行宽」的设计档口径句随正 · 过渡豁免（`thincoder-core/prompts/**` 行宽免判）按原归口删除。**不做**：不清存量段落（另批按板块清）· 不动锚判据。

**待设计定的**：段的定义边界（表格/标题/列表/引用/围栏不计——需求已给）；提示词面仍量行（FR46 的理由：模型读原始文本，一行一块）——两面的「块」定义不同，设计里要写清这一刀切在哪。
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮：降级清单四项落地，gate PASS）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：台账 `#1777`（ENGINEERING-MODE · 归批）——FR45 落地：行宽判据换成段判据。条目 = 1 条。

**显式不在本批**：清当前盘上超 300 字符的段（另批按板块清）· 锚判据 · FR46 的提示词重写面 · 需求档 §13.23 判据 4 的删除（父侧笔——用户 2026-10-24 已裁）· 台账 `#1734` 撤销（父侧——该行描述的就是被裁掉的分域洞）。

**设计档落点**：`docs/core/design/DOC-DISCIPLINE.md` §3.18 条目 Q（判据口径单源——就地重写）· §5 A-DD27（判据七条——就地重写）· 档头枚举与 §3 标题枚举同轮改（D3）。

**机制设计（引，不抄）**：判据六条 = `docs/core/design/DOC-DISCIPLINE.md` §3.18——单位是段（相邻非空正文行合并；表格 / 标题 / 列表 / 引用 / 围栏不计且断段）· 提示词面量行（`thincoder-core/prompts/**` 逐行裸判，FR46 的理由）· 命名 `paragraphMax` / `lineMax` / `paragraph.mjs`、报面命中类「段太长 / 行太长」· 阈值 300 · 不分域（命中即拒，用户 2026-10-24 裁定）· 谓词单源随迁。

**两面切块**：文档面量段（人读渲染结果，相邻非空行并成一段）· 提示词面量行（模型读原始文本，一行一块）——切线落在 `isPromptFace` 谓词上（形态对齐 `thincoder-core/doc-check/anchors.mjs` 的 `OPERAND_FACE` 正则，单源住 `paragraph.mjs`）。

**受影响文件表**（当前行数 = 2026-10-24 实读）：

| 文件 | 现行数 | 预计 | 动作 |
|---|---|---|---|
| `thincoder-core/doc-check/width.mjs` → `paragraph.mjs` | 87 | ≈ +30 | 迁名 + 段合并算法 + 新谓词 `isListItem` / `isPromptFace`（谓词族六件逐字随迁） |
| `thincoder-core/doc-check/index.mjs` | 172 | ≈ +5 | 常量换名（`paragraphMax` / `lineMax` / `paragraphExemptZones`）· 报面两类命中行 · 返回字段 `widthHits` → `paragraphHits` |
| `thincoder-core/doc-check/anchors.mjs` | —（本批只动 import 行） | ±1 | import `./width.mjs` → `./paragraph.mjs`；`OPERAND_FACE` 改引 `isPromptFace` |
| `thincoder-core/agent-tools/doc-check.mjs` | 75 | ±2 | 注释口径（判据名随正） |
| `thincoder-core/agent-tools/batch-gate.mjs` | 191 | ±3 | `res.widthHits` → `res.paragraphHits` + 注释措辞 |
| `thincoder-core/tool-docs/doc_check.md` | 67 | ≈ +2 | 「Line width」条改写成段 / 行两条 + 引擎档名随正 + 删已失效的引擎版本一致性两段（与 `version.mjs` 现态对齐——发现 ③） |
| `scripts/doc-check-width.mjs` → `scripts/doc-check-paragraph.mjs` | 8 | ±2 | 迁名 + 再出口名单随正 |
| `scripts/doc-check.mjs` | 78 | ≈ +4 | `CRITERIA_KEYS` 换名 · 结论行 `FAIL(行宽)` → `FAIL(段太长)` / `FAIL(行太长)` · 调用行随正 |
| `scripts/doc-check-anchors.mjs` | —（本批只动 import 行） | ±1 | import `./doc-check-width.mjs` → `./doc-check-paragraph.mjs` |
| `docs/core/design/DOC-DISCIPLINE.md` | 2180 | ≈ +25 | §3.18 + A-DD27 重写 + 双枚举 + §3.20 报面句形 / 判据② / 实装现状 / 谓词单源 + §7 F1–F3 / F2 键表 / 四档接口 / 再出口缝 / AC-M8-5 + §3.1 C 与 §3.15 N 的「宽度豁免」称谓随动（逐处表 = 修正轮清单，见报告降级项） |
| `docs/core/requirements/DOC-CHECK.md` | 55 | ±2 | F3 判据条 + 边界「不新增判据」句（**父侧笔**——改法见下「上抛项」①） |
| 单元测试档 `docs/batches/2026-10-24-paragraph-width-criterion.test.mjs` | 新建 | ≈ 120 | DD-115–DD-118 夹具（§3.4 条目 E：临时域 · 零落仓 · 并发免疫） |

**验收对照（逐条可机判）**：= §5 A-DD27 七条——① 口径六条 + 双枚举在册（D3）② 段中插换行判定不变（FR45 验收②，折行失效）③ 900 字符分三段判合规（FR45 验收③，拆段有效）④ 提示词面逐行裸判 ⑤ 谓词单源 + 旧两档零在盘 ⑥ 自测护栏跑绿 ⑦ 引擎与报面 `行宽` / `lineWidth` grep = 0（FR45 验收①）。

**关键决策（含被否）**：① 可执行行在段判据里**不豁免**（段 = 读者所见，码段渲染后仍在段内——旧豁免到此为止）；② 区带机制随迁改名 `paragraphExemptZones`（机制保留、内置恒空——删它 = 超出 FR45 的语义变更）；③ 提示词面不设结构豁免（FR46 横切检查 = 逐行裸判）；④ **不设分域**（用户 2026-10-24 裁定覆盖 FR45 判据 4）——当前盘上超 300 字符的段实测 1,992 段 / 333 档（2026-10-22，需求档 §13.23 载）⇒ 落地后每一处命中都拒写，直到清完；这是如实登记的代价，不留任何「只点名」的口子。

**用例表**：DD-115 正常（900 字符分三段 ⇒ 0 命中）· DD-116 边界（段中插换行 ⇒ 判定不变；提示词面档一行 301 ⇒ `行太长` 1 条）· DD-117 错误（一段 400 字符 ⇒ `段太长` 1 条，定位 = 段首行号）· DD-118 错误（命名残留 ⇒ grep 非零即红）。

**集成测试设计**：本批 = 引擎判据改动；集成面 = batch 工具两机械点的既有用例（DD-92–DD-99）——「命中即拒」通路零改（报面行形变、通路不变），**无新集成用例**；单元用例 = DD-115–DD-118（随批档）。

**边界（不做）**：不改锚判据 · 不动 FR46 重写面 · 不清当前盘上超段（另批）· 不改 batch-gate 的按作者分界机制（既有机制，与被裁的分域是两件事——它按「谁的档」分界，不按「新旧」分界）。

**上抛项**：
- ①〔父侧笔〕`docs/core/requirements/DOC-CHECK.md`：F3「锚 + 行宽（内置常量 300）」→「锚 + 段长（内置常量 300；提示词面量行）」；§3 边界「只有锚 + 行宽两条」同改；需求档 §13.23 判据 4 整条删（用户已裁）。
- ②〔父侧笔〕台账 `#1734` 撤销（用户 2026-10-24 裁）。
- ③〔发现 · 已核〕任务书所述「过渡豁免（`doc-check/index.mjs:33-42`）」在盘上**不存在**——该段实为 `pathKey` / `undecidableReason`；`thincoder-core/doc-check/anchors.mjs:59` 注释明确「提示词面照判，无面级豁免」；需求档 §13.23 亦记「已撤」⇒ 该落点**零笔**。
- ④〔发现 · 已核〕`docs/render-core/design/RENDER-CORE.md` 无「行宽」命中（grep `docs/render-core` 零命中）——需求档落点行提到它 = 已过时。
- ⑤〔发现 · 已核〕`thincoder-core/tool-docs/doc_check.md` 仍描述「引擎版本一致性（六档 mtime）」，但 `thincoder-core/doc-check/version.mjs` 头注载该族已删（2026-10-24）——描述与代码相抵；本批改写该档时随正（一致性面，已入受影响表）。
- ⑥〔降级项〕`docs/core/design/DOC-DISCIPLINE.md` 的 §3.18 旧口径行（:843 起至 §3.19 前）与 §3.20 / §7 的散点「行宽」称谓本轮未逐行重写——修正轮清单 = 受影响表该档行；§3.18 新口径块 = 现态权威。

**修正轮（2026-10-25 · 降级清单四项落地）**：

| # | 处置 | 落点 |
|---|---|---|
| ① §3.18 旧口径行 | 旧块（原 `:874` 起至 §3.19 前）收正为五行尾块：域（判定范围）· 区带豁免指针 · 残余登记 ①② · 落点判据 · 公共源勘察；与新权威块相抵处（度量单行 / 豁免四类 / `FAIL(行宽)` 报面 / 谓词表 / DD-66–68 / 受影响面表 / 覆盖偏移 / 同拍收窄）以新块为准删除——新旧不并置 | `docs/core/design/DOC-DISCIPLINE.md` §3.18 |
| ② §5 A-DD27 随正 | 七条就地重写（口径六条在册 · 折行失效 · 拆段有效 · 提示词面逐行裸判 · 谓词单源 + 旧两档零在盘 · 自测护栏 · 命名残留 grep = 0），A-DD23 称谓随正（`OK(段太长)` ∥ `OK(行太长)` · `paragraphExemptZones` · 区带外命中即拒），A-DD29 ④⑤⑥ 常量与缝档名随正 | `docs/core/design/DOC-DISCIPLINE.md` §5 |
| ③ 双枚举随正 | 档头枚举与 §3 标题枚举：「行宽口径（条目 Q）」→「段判据口径（条目 Q）」·「表格行宽度豁免」→「表格行豁免」·「历史区宽度豁免」→「历史区带豁免」；§3.18 / §3.1 / §3.15 三节标题同轮改（D3） | `docs/core/design/DOC-DISCIPLINE.md` 档头 · §3 |
| ④ 散点称谓逐处处置 | 改述为「段」：§3.19 两件 · §3.20 判据② / 复算判法 / 裁定面命中类 / 报面三模板 / 产品档位 / 谓词单源 / 处置表 / 实装现状 / DD-80 / DD-83 · §4.2.6 实装现状 · §7 F1–F3 / F2 键表（3 键 ⇒ 4 键：`paragraphMax` / `lineMax` / `paragraphExemptZones` / `exemptions`）/ 四档接口 / 再出口缝 / 自测护栏 / AC-M8-5；主函数名定 `checkParagraphs`（随迁改名，与 `paragraphMax` 同族） | `docs/core/design/DOC-DISCIPLINE.md` §3.19 / §3.20 / §4.2.6 / §7 |

**不分域复核（用户 23:47 裁定）**：本轮触及面零「存量 / 新增」二分、零「只点名不拒」——§3.15 防复发改写为「区带外命中即拒（口径 = §3.18 ⑤）」；A-DD27 ⑤ 的「本笔零新增超宽（存量另步）」整条不存于新七条；存量清账仅作另批登记（§3.18 ⑤ 既有句）。

**历史语境保留（逐条理由）**：R-3 / R-6 / R-7 / R-11 表与 DD-71 · §3.19 射程边界 · A-DD28 ④ 及「另 / 读数面」两行 · §7 沿革句 · F3「三套行宽判据」——均为条目 R 与 v1/v2 沿革的当轮登记（`docs/core/design/DOC-DISCIPLINE.md` §3.19「退场注」声明该表「现文（摘）」列 = 当批原文摘引（历史面），不作现态读）；§3.18 新权威块内既有件三问 / DD-118 / 命名条为机制本体句（判据自身须点名被禁词面方能机检）；A-DD27 ⑤⑦ 的 `width.mjs` / `doc-check-width.mjs` 与 grep 词表同属判据点名。

**读数**：产品引擎实跑 `runDocCheck`（report · 清单 = 本档）⇒ 命中 0 条（锚 0 · 行宽 0）——修正后整档过门。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：DOC-DISCIPLINE.md §3.18 新权威块（:843-873）+ §3.18 尾块（:874-883）+ §5 A-DD27（:1940-1954）+ 全档「行宽」称谓收正。通读全档（含 §7 机检引擎面与 §3.20 条目 S 报面），grep 全档核「行宽 / lineWidth / widthExemptZones / checkDocWidths / width.mjs / check-doc-width」命中面。

正面核验：需求覆盖齐（FR45 ①②③ → A-DD27 ⑦②③，④ 读数明记由实施轮实测登记、不预载——DOC-DISCIPLINE.md:1954）；勘察证据行在位（:882，publicRepos = [] ⇒ 无相关公共源）；既有件三问在位（:855，existing ∥ name ∥ consumers + none found 段合并逻辑）；D3 枚举同步齐（档头 :3 与 §3 标题 :118 均含「段判据口径（条目 Q）」）；§3.20 / §7 报面与常量键面已为新名（段太长 / 行太长 / paragraphMax / lineMax，:1075 / :1130-1140 / :2104-2113）；分支出处齐（不分域 = 用户 2026-10-24 裁定 + 实测 1,992 段 / 333 档 :850；未闭合围栏 / 引文块 fail-open 登记 :878）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity（文档态一致性） | 🟡 | §3.18 尾块「域（判定范围）：调用方传入的文件清单（无清单 ⇒ 报错）」（DOC-DISCIPLINE.md:874）不分 report / gate 两面，且自称「工具面同口径 = §3.20 条目 S」；但 §7「两面空清单」（:2139）与 A-DD34 ③（:2052）明定 gate 空清单 ⇒ `PASS（0 档）`——对 gate 面读者该句失真 | 把该句射程限定到 report 面（手跑入口），或补 gate 面空清单放行的例外句 |
| 2 | Scope（称谓收正残留） | 🟡 | 评审对象声明 = 全档「行宽」称谓收正，但本档收正枚举（:862）只列 §3.18 / §5 A-DD27 / 双枚举 / §3.20 / §7 / §3.1 / §3.15；现役规范面残留未列入：§3.19 射程边界「不改锚 ∥ 行宽 ∥ A4–A7 报告面」（:927）、A-DD28 ④∥另∥读数面三处「锚 ∥ 行宽」（:1961 / :1963 / :1964）、DD-71（:966） | 将 §3.19 / A-DD28 / DD-71 的现役句纳入收正枚举（改「段判据」称谓），或显式登记其为 as-of 记录面豁免；§7 沿革（:2097）与 F3（:2105）描述 v1 史实、R 表「现文（摘）」列（:908-916）为 as-of 引文，建议一句话声明这两族保留 |
| 3 | 受影响文件标注（criterion 8） | 🟡 | `anchors.mjs`（±1）与 `scripts/doc-check-anchors.mjs`（±1）（:859 / :861）只注增量、缺当前行数；其余各档行数无法在本评审射程内对盘抽核（单档评审）——unverified | 两档补当前行数读数（wc -l 实读） |
| 4 | Doc hygiene | 🔵 | 本档行数标注「2180」（:862）与当前实读（约 2162 行）有出入；as-of 声明可覆盖，属正常漂移 | 无需处理；若下轮触碰本节可顺手收正读数 |

VERDICT: pass（🔴 0 · 🟡 3 · 🔵 1）

## §4 用户批准（主 agent）

**批准**：用户 2026-10-25 03:14「自动跑完」——批次级放行（批准 + 批内全链自动跑完）。
**批准前置**：需求 FR45（2026-10-22 §13.23）+ 不分域裁定（2026-10-24 23:47）；设计评审首轮 pass（0 🔴 · 3 🟡 · 1 🔵）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（审计 1 轮（1 项透明清单外随迁）+ 评审 pass，终态 clean）



**状态行旁注**：实施轮 2026-10-25 落毕。

**改动面（11 档）**：

| 落点 | 改动 |
|---|---|
| `thincoder-core/doc-check/width.mjs` → `paragraph.mjs`（119 行） | git mv 迁名 + 段合并新写；谓词族七件逐字随迁；新写 `isListItem` / `isPromptFace`；`checkDocWidths` → `checkParagraphs`（文档面量段 ∥ 提示词面逐行裸判；命中携 `clazz` = 段太长 ∥ 行太长，定位 = 段首行号） |
| `thincoder-core/doc-check/index.mjs`（176 行） | 常量 `lineWidth`/`widthExemptZones` → `paragraphMax`/`lineMax`/`paragraphExemptZones`；报面两类命中行 `✗ 段太长` ∥ `✗ 行太长`；返回字段 `widthHits` → `paragraphHits` |
| `thincoder-core/doc-check/anchors.mjs`（135 行） | import 迁 `./paragraph.mjs`；面判据改引 `isPromptFace`（旧 `OPERAND_FACE` 正则删，形态逐字同） |
| `thincoder-core/agent-tools/doc-check.mjs`（69 行） | 头注判据名随正（锚 ∥ 段判据） |
| `thincoder-core/agent-tools/batch-gate.mjs`（189 行） | `res.widthHits` → `res.paragraphHits` + 头注措辞 |
| `thincoder-core/tool-docs/doc_check.md`（63 行） | 「Line width」条改写为 Paragraph length ∥ Line length 两条；gate 段「overlong line」→「overlong paragraph / line」 |
| `scripts/doc-check-width.mjs` → `scripts/doc-check-paragraph.mjs`（8 行） | git mv 迁名 + 再出口名单随正（十名） |
| `scripts/doc-check.mjs`（82 行） | `CRITERIA_KEYS` 四键换名；结论行 `FAIL(段太长)` ∥ `OK(段太长)` ∥ `FAIL(行太长)` ∥ `OK(行太长)`；调用行随正 |
| `scripts/doc-check-anchors.mjs` | import `./doc-check-width.mjs` → `./doc-check-paragraph.mjs` + 头注行 |
| `scripts/doc-check-linecounts.mjs` | 同上（**清单外随迁**——缝档消档则其 import 悬空，属必要接线；§7 四档接口本就点名其为消费面） |
| `docs/batches/2026-10-24-paragraph-width-criterion.test.mjs`（106 行，新建） | DD-115–DD-118 夹具（系统临时域 · 零落仓 · 并发免疫） |

**验收读数（A-DD27 逐条）**：

1. 口径六条在册（设计档面，修正轮已落）——实施零改设计文本。
2. 折行失效 ✓：夹具一段 301 字符拆 150+151 两行 ⇒ `段太长` 1 条（DD-116）；先红证据 = 旧引擎（`git show HEAD:.../width.mjs` 原字节）同夹具 ⇒ **0 命中**（折行过门，正是被否行为）。
3. 拆段有效 ✓：900 字符三段（各 300）+ 结构行断段 ⇒ 0 命中（DD-115）。
4. 提示词面逐行裸判 ✓：`thincoder-core/prompts/**` 形态档一行 301 ⇒ `行太长` 1 条；围栏块内 301 行照判（无结构豁免）（DD-116）。
5. 谓词单源 ✓：单源 = `paragraph.mjs`；`width.mjs` / `doc-check-width.mjs` 零在盘（existsSync = false ×2）；缝档 8 行零逻辑。
6. 自测护栏 ✓：`node --test docs/batches/2026-10-24-paragraph-width-criterion.test.mjs` ⇒ **4/4 绿**。
7. 命名残留 ✓：五面域 grep `行宽` / `lineWidth` / `widthExemptZones` / `checkDocWidths` ⇒ **0**（DD-118 + 独立 grep 双证）。

**两路读数一致**：`node scripts/doc-check.mjs --root .` ⇒ `FAIL(段太长): 2249 段超 300 字符` · `OK(行太长)`；产品引擎 `runDocCheck` 同档集（456 档）⇒ 段太长 2249 · 行太长 0——**两路逐数相等**。FR45 验收④ 落地后首跑存量命中读数 = **2249 段**（登记；清账另批）。

**审计与评审**：explore 发散审计 1 轮 ⇒ 偏离 1 项（`doc-check-linecounts.mjs` import 迁名在批准清单外——本表已披露，透明可接受）；其余全对盘。advisor 代码评审 1 轮 ⇒ **pass（0 🔴 · 1 🟡 · 2 🔵）**，无修正轮。终态 = **clean**。

**上抛与登记**：
- 〔上抛·知会〕评审 🟡1：`tool-docs/doc_check.md:12` 写 "Six names count as operands"，而 `anchors.mjs:45-49` `CANON_OPERANDS` 实为七名（含 `RTM.md`）——锚判据面前批残留滞后（本批明定不动锚判据），非本批引入；父侧路由（补登或记账）。
- 〔上抛·知会〕设计档 `DOC-DISCIPLINE.md:778` 的「≈117 行——实施轮实测回填」实测 = **119 行**（`paragraph.mjs`）；缝档实测 8 行（与登记相符）。回填笔 = 设计席。
- 〔上抛·知会〕本批迁名致旧缝名成死指针的**设计/需求面残留**（非本批笔域，父侧路由）：`API-CONTRACT.md:38-39`（导出登记指 `scripts/doc-check-width.mjs`）· `ARCHITECTURE.md:43`（目录图）· `CORE-UNIFICATION.md:981/:988` · `DOC-CODE-RECONCILE.md:49` · `VSC-DEBT.md:358` · 需求面 `TESTING.md:158/:170/:175` · `STRUCTURE-DEBT.md:35` · `CORE-UNIFICATION.md:117`（N6）。
- 〔上抛·知会〕工作树另有他笔在飞改动 `scripts/prompt-refs-check.mjs`（RTM.md 白名单注释）——非本批笔，零触。
- 〔知会〕本会话 `doc_check` 工具 gate 跑的是会话启动时加载的旧引擎（报面仍「锚 ∥ 行宽」），其 PASS 读数只对锚面有效；新引擎读数以本表「两路读数」为准。
- 〔知会〕批档 §2 上抛项⑤ 的「删 doc_check.md 引擎版本一致性两段」= **零笔**——活档无该两段（`version.mjs` 族 2026-10-24 已删净，仅 `.thincoder/tmp` 草稿面有旧副本）。

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核**：

| 项 | 读数 |
|---|---|
| 引擎迁名 | `paragraph.mjs` 119 行在位 · `width.mjs` 不在盘 |
| 常量/报面 | `paragraphMax` ∥ `lineMax` 在位 · 旧 `lineWidth` = 0 |
| 批内单测档 | DD-115–118 **4/4 绿**（含先红证据：旧引擎折行 0 命中 vs 新引擎判 1 条） |
| 两路读数 | `node scripts/doc-check.mjs` = `FAIL(段太长): 2249 段`（存量如实记）· `OK(行太长)` 提示词面 |
| 命名残留 | `行宽` ∥ `lineWidth` ∥ `widthExemptZones` 引擎与报面 0 |
| 不分域 | 存量 2249 段照常判——没有「只点名不拒」 |

**收口测试行**：① 批内单测档 `docs/batches/2026-10-24-paragraph-width-criterion.test.mjs`（106 行，DD-115–118）**用毕即删**，读数已录 §5。② 集成集现量 15 例 / 窗口 50–100，本批增删 0（改的是机检引擎，无业务行为变更）。

**遗留（登记）**：
- 存量 2249 段超 300——清账另批（需求档已载「另批按板块清」）。
- 评审 🟡 三条：§3.18 尾块不分 report/gate 面 · §3.19/A-DD28 残留「行宽」 · 两档行数标注——归后续轮。
- 迁名死指针面（`API-CONTRACT.md` · `ARCHITECTURE.md` · `CORE-UNIFICATION.md` 等 9 处）——归后续文档轮。
- `DOC-DISCIPLINE.md:778`「≈117 行」实测 119 行——设计席回填笔。

**文档机检门**：本会话工具面仍是旧引擎（09:42 加载，报面「锚 ∥ 行宽」）；新引擎两路读数已取。会话重启后统一为段判据面。
