# 2026-10-24 · 评审判据补「项目设计交付物清单」（判据不随输入变）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 18:14「文档评审不应该根据输入来决定评审标准」——判据清单缺「项目设计要求清单」这一维，导致 F34 集成测试设计段在任何一轮都没被问过。
> 台账 = #1759（ADVISOR · 归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（判据一条已钉死；见下部门禁读数更正）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：`docs/core/requirements/TESTING.md` F34（`:199`）——设计档必须含集成测试设计段（场景 + 业务可观察判据），业务修改批缺该段 = 设计不合格。必要性 = 批内单测档收口即删，集成测试是唯一从用户可见入口走的验收回路；该条此前在评审面零落点，任何一轮评审都不会问。

**用户口径（2026-10-24 18:15）**：判据就一条——设计评审要检查设计档里有没有集成测试设计段；没有 ⇒ 设计不合格。不抽象成维度、不列清单表、不做防重复分析。

**设计落点**：
- 设计档 `docs/core/design/ADVISOR-CONVERGENCE.md` §17（新评审维度）+ §12 A-AC18（验收行）+ 档首维度指针补 §17。
- 提示词 `thincoder-core/prompts/advisor-design.md` §Review Criteria 第 12 条——eng-coder 落笔，逐字块 = 设计档 §17。

**机制设计**（一条）：设计档必须含集成测试设计段——本次改动新增 ∥ 修改的集成场景与每场景断言的业务可观察结果；缺段 ⇒ 🔴（设计不完整）；改动未触及业务行为 ⇒ 段内写明「无变化 + 理由」，这是唯一替代形态。

**受影响文件**：

| # | 文件 | 现量（本次实读） | 动作 ∥ 增量 |
|---|---|---|---|
| 1 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 451 | 已落：新增 §17（`:435-451`）+ A-AC18（`:402`）+ 档首指针（`:17`）——批前 432 ⇒ +19 |
| 2 | `thincoder-core/prompts/advisor-design.md` | 131 | 新增第 12 条（约 +5 行）——eng-coder 笔 |

tier 判定：451 ∥ 131，均 <500 行，结构不变，不触发拆分。

**验收对照**：
- ① 提示词第 12 条逐字在位（**逐字读核对**——散文锚测试禁写，`docs/core/requirements/TESTING.md` F19）。
- ② 设计档 §17 + A-AC18 在位（本档已落，读数见上表）。
- ③ doc-check gate PASS（本档读数：`DOC-CHECK GATE: PASS`，1 档 0 命中）。

**集成测试**：无新增集成场景——本改动 = 评审判据文本（过程面），不改变任何用户可见入口的业务行为；验证面 = 逐字读核对 + doc-check gate。

**边界**：不改 `thincoder-core/prompts/advisor/history.mjs` 的 DEFAULT_CRITERIA（代码评审默认面）· 不改需求档 · 不动既有 11 条判据的语义与编号。

**关键决策**：只加一条判据（用户裁定）——不把它做成「设计交付物清单」维度；严重级 🔴 沿用既有定义「design is incomplete ⇒ 🔴」（`thincoder-core/prompts/advisor-design.md:64`）。

**上抛项**：无。

**门禁读数更正（D6 回读）**：验收 ③ 的 `DOC-CHECK GATE: PASS`（1 档 0 命中）来自本席直接调 `doc_check(mode:"gate")`；本批 §2 写入后，`batch` 工具自带的收口门回报 `DOC-CHECK GATE: ERROR（引擎已更新（doc-check/version.mjs ∥ agent-tools/doc-check.mjs mtime 2026-10-24T09:45:49Z > 进程启动 2026-10-24T09:42:19Z），请重启会话后复跑）`——该 ERROR 是引擎版本一致性 fail-closed 态，
  不是文档命中。会话内无法取得新的 PASS 读数；
  复跑须重启会话。

**评审第 1 轮处置（fix 轮 · eng-designer）——10 条逐条**

| # | 级 | 处置 | 落点 |
|---|---|---|---|
| 1 | 🔴 | 补「同类先例」行：先例 = 本档 §14 ∥ §15 ∥ §16 三件套形（权威链引块 + 核查条目 + A-AC 行 + 逐字提示词建议）；实现坐标 = `thincoder-core/prompts/advisor-design.md:40`（第 9 条）∥ `:44`（第 10 条）；对齐 = 整形复用不另立专名，偏离 = 无 | `docs/core/design/ADVISOR-CONVERGENCE.md:442` |
| 2 | 🔴 | 补「勘察证据」行：`index.publicRepos` = `[]`（`PROJECT-MANIFEST.json:35` 实读）⇒ 零仓外声明源（无相关也照记）；树内公共源 = `docs/core/requirements/TESTING.md` F34 `:199` ∥ N20 `:115` ∥ 本档 §14–§16 | `docs/core/design/ADVISOR-CONVERGENCE.md:443` |
| 3 | 🟡 | 核查句补「逐条回指业务需求」（F34 `:199` 逐字）；新增「理由不成立 ⇒ 仍判 🔴」行（以窗口上限为由不成立，F34 `:199` 上限约束句）；逐字块同步补 traceback 与该行 | `docs/core/design/ADVISOR-CONVERGENCE.md:439` ∥ `:441` ∥ `:449-451` |
| 4 | 🟡 | A-AC18 补核验形态「（**逐字读核对**；机检限行为面 / 结构机检）」，沿 A-AC12/A-AC13 写法 | `docs/core/design/ADVISOR-CONVERGENCE.md:402` |
| 5 | 🟡 | A-AC18 补落地标记 = **待落笔**：实读 `thincoder-core/prompts/advisor-design.md` §Review Criteria 止于第 11 条（`:48`），其后即 `## Output Format`（`:53`），无第 12 条——实现轮写入后标日期 | `docs/core/design/ADVISOR-CONVERGENCE.md:402` |
| 6 | 🔵 | §17 引块补上段权威链（义务 = 纪律层设计步 · 核查维度行为语义 = 本节 · 执行实现 = 提示词第 12 条），与 §14/§15/§16 三段形齐 | `docs/core/design/ADVISOR-CONVERGENCE.md:437` |
| 7 | 🔵 | **不改档**：§13 空缺保空号（沿既有裁定「编号缺位保空号、不重编号」）；在档内记明空缺原因 = 沿革叙述，D8 禁（历史只住 git） | 无改动 |
| 8 | 🔵 | 理由句改三条：① 提示词 ∥ 过程面 ② 裁决面依赖模型输出、无可确定性断言的前端入口 ③ N20 只住三前端（`docs/core/requirements/TESTING.md:115`） | `docs/core/design/ADVISOR-CONVERGENCE.md:455` |
| 9 | 🔵 | 逐字文案 `the scenarios this change earns` ⇒ `requires` | `docs/core/design/ADVISOR-CONVERGENCE.md:449` |
| 10 | 🔵 | **不补**：受影响文件表已在本段上表（两行）；设计档重述 = D2 违例（单一权威源） | 本段上表 |

**计数**：🔴 2 · 🟡 3 · 🔵 5 = 10 条，全部处置（落地 8 条 · 不改档 2 条，逐条给由）。

**回读（D6）**：`docs/core/design/ADVISOR-CONVERGENCE.md` §17 现读 `:435-455`——引块 `:437` ✓ · 核查 `:439` ✓ · 缺段 ⇒ 🔴 `:440` ✓ · 理由不成立 `:441` ✓ · 同类先例 `:442` ✓ · 勘察证据 `:443` ✓ · 为什么必须查 `:444` ✓ · 逐字块 `:448-453` ✓ · 本批集成测试设计 `:455` ✓；A-AC18 `:402` ✓。引用的节号逐条存在：§14 `:407` ∥ §15 `:416` ∥ §16 `:425` ∥ §17 `:435`。

**本改动是否触及业务行为**：否（评审判据文本 = 提示词 ∥ 过程面；裁决面依赖模型输出、无可确定性断言的前端入口）；集成场景无新增——理由三条见 `:455`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：docs/core/design/ADVISOR-CONVERGENCE.md §17 设计评审判据第 12 条（集成测试设计段必查）；范围文件 = `docs/core/design/ADVISOR-CONVERGENCE.md` + `docs/core/requirements/TESTING.md`。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Closest-precedent（设计评审第 9 条） | 🔴 | 本设计档无「同类先例」行：全文仅 :451 载本批集成测试设计声明；`同类先例` 只出现在 §14 维度定义（:413「无同类先例可勘 ⇒ 显式声明（不得静默省行）」）与 A-AC15（:399），本批自身未给先例坐标/对齐·偏离理由 | 补一行先例坐标 + 对齐∥偏离理由：先例 = 本档 §14/§15/§16 三件套形（维度节 + 逐字提示词条 + A-AC 行）与 `thincoder-core/prompts/advisor-design.md` 第 9/10/6b 条；§17 复用同形 ⇒ 写明对齐、无偏离 |
| 2 | Survey-evidence（第 10 条） | 🔴 | 无「勘察证据行」：:416–:423 只定义该维度；本批未记录查过哪些公共源文档、有无相关（§15 :423「缺行 ⇒ 未查或未记」「无相关 ⇒ 也须照记」） | 补一行：查过哪些源（尤其独立文档仓）、各自是否相关；全无相关也照记「无相关」 |
| 3 | Requirements coverage | 🟡 | :439 核查句只要求「场景 + 业务可观察结果」，漏 docs/core/requirements/TESTING.md F34 的「场景表 + 判据，逐条回指业务需求」（docs/core/requirements/TESTING.md:199）；且 :440「无变化 + 理由」未限定理由必须是「改动未触及业务行为」，F34 明写的「窗口 50–100 是上限约束…不是「不新增」的理由」未进判据 ⇒ 可以「窗口已满」为由过关 | 核查句补「逐条回指业务需求」；:440 补「理由不成立（如以窗口上限为由）⇒ 仍判 🔴」 |
| 4 | Acceptance criteria | 🟡 | A-AC18（:402）只写「维度在位」，无核验形态；表头写「验收标准（机器可验）」（:383），而该条唯一可核形态是散文在场——正是 :379 与 docs/core/requirements/TESTING.md F19 禁止的散文锚机检 | 按 A-AC12/A-AC13 写法给 A-AC18 补「（逐字读核对；机检限行为面 / 结构机检）」 |
| 5 | Clarity | 🟡 | A-AC18 缺 A-AC15/16/17 都带的「已落笔（EN 在盘——date）」标记（:399–:401 vs :402）——第 12 条属待写入还是已核对在盘，验收时无法判定；`thincoder-core/prompts/advisor-design.md` 在盘状态属范围外（unverified） | AC 行写明本批是否写入 `thincoder-core/prompts/advisor-design.md` 第 12 条（待写 ⇒ 标落地条件；已在盘 ⇒ 标日期） |
| 6 | Methodology / doc consistency | 🔵 | :437 引块只有「需求依据 + 执行实现」两段，§14/§15/§16 的「权威链（指环单向化）：…义务 = 纪律层设计步…」三段形缺上段 | 补一句上段权威链，指向 F34 的纪律落点 |
| 7 | Doc hygiene | 🔵 | 节号 §12（:376）跳 §14（:407），无 §13，全文亦无对 §13 的引用 | 记明 §13 空缺原因（退役/合并）或重排节号 |
| 8 | Integration-test design statement | 🔵 | :451 理由句「不改变任何用户可见入口的业务行为」偏强——本改动会改变设计评审裁决行为（缺段设计自此吃 🔴）；真正站得住的理由（提示词/过程面 · 裁决依赖模型输出不可确定性断言 · N20 集成集只住三前端）未写 | 理由句改为「提示词/过程面 + 无确定性可断言的前端入口 + N20」三条 |
| 9 | Clarity | 🔵 | 逐字提示词 :446「the scenarios this change earns」用词生硬（earns 语义不明），而该句是运行期逐字文案 | 改为 "the scenarios this change requires" / "calls for" |
| 10 | Affected-file annotations | 🔵 | 档内无「受影响文件」表——本批只改 .md（本档 + `thincoder-core/prompts/advisor-design.md`），按 :357「文档档零标注义务」免标注；已核不构成缺陷 | 可选：补一行受影响文件清单（本档 + `thincoder-core/prompts/advisor-design.md`），便于父侧落笔 |

已核项（无 finding）：:437 对 docs/core/requirements/TESTING.md F34 的 `:199` 引用准确（F34 确在 docs/core/requirements/TESTING.md:199）；:441「集成测试是唯一从用户可见入口走的验收回路」与 docs/core/requirements/TESTING.md:30 同口径；:17 维度地图已同步纳入 §17；A-AC18 与 :437/:443 的「第 12 条」落点一致。
限制：上下文未提供文档地图（ownership 判据降级）与项目标准档；`thincoder-core/prompts/advisor-design.md` 不在评审范围，其条文落盘状态 unverified；无 git 仓，无变更集上下文。

计数：🔴 2 · 🟡 3 · 🔵 5。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 复核表（第 2 轮 —— 逐条核 prior 10 条）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔴 | Fixed | `docs/core/design/ADVISOR-CONVERGENCE.md:442: **同类先例**：先例坐标 = 本档 §14（`:407`）∥ §15（`:416`）∥ §16（`:425`）的同一形` —— 行已落，含实现坐标 + 对齐 + 偏离声明。残余（可选，🔵 级）：未给「先例批」坐标 |
| 2 | 2 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔴 | Fixed | `docs/core/design/ADVISOR-CONVERGENCE.md:443: **勘察证据**：`index.publicRepos` = `[]`（`PROJECT-MANIFEST.json:35`）⇒ **零仓外声明源**（无相关也照记）` —— 查过哪些源 + 有无相关两面齐 |
| 3 | 3 | docs/core/design/ADVISOR-CONVERGENCE.md | 🟡 | Fixed | `…:439: 且**逐条回指业务需求**`；`…:441: **理由不成立 ⇒ 仍判 🔴**`（含窗口上限不成立）；逐字提示词 `:449`/`:451` 同步 |
| 4 | 4 | docs/core/design/ADVISOR-CONVERGENCE.md | 🟡 | Fixed | `…:402: （**逐字读核对**；机检限行为面 / 结构机检）` —— 核验形态已明写 |
| 5 | 5 | docs/core/design/ADVISOR-CONVERGENCE.md | 🟡 | Fixed | `…:402: **待落笔**（该档现止第 11 条 `:48`——第 12 条由实现轮写入后标日期）` —— 落地状态已标 |
| 6 | 6 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔵 | Fixed | `…:437: **核查维度行为语义 = 本节**` —— 权威链三链齐（义务 = 纪律层设计步 ∥ 本语义节 ∥ 执行实现） |
| 7 | 7 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔵 | Unfixed | `…:376: ## 12. 验证` → `…:407: ## 14. 同类先例核查（设计评审维度）` —— 节号仍跳过 §13，全文无 §13 引用；🔵 不阻断 approval |
| 8 | 8 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔵 | Fixed | `…:455: 理由三条：① 本改动 = 评审判据文本（提示词 ∥ 过程面）` —— 已换成三条站得住的理由（+ ② 模型输出不可确定性断言 + ③ N20） |
| 9 | 9 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔵 | Fixed | `…:449: the scenarios this change requires` —— 措辞已改 |
| 10 | 10 | docs/core/design/ADVISOR-CONVERGENCE.md | 🔵 | Accepted | 未加「受影响文件」表；`.md` 豁免成立（`…:357: 文档档零标注义务`），本就不构成缺陷 |

**新问题**：无（本轮射程 = 修复引入的明显新问题；未发现）。

**不可核项（非 finding）**：§17 对范围外文件的引证 `thincoder-core/prompts/advisor-design.md:40/:44/:48`、`PROJECT-MANIFEST.json:35` 本轮未读（评审范围外）⇒ unverified。

**核对通过**：`:437` 的 F34 `:199` 与 `:439`/`:441` 的 F34 引文与 `docs/core/requirements/TESTING.md:199` 原文一致（「场景表 + 判据，逐条回指业务需求」/「上限约束」）；`:455` 的 N20 `:115` 与 `docs/core/requirements/TESTING.md:115` 一致。

计数：🔴 未决 0 · 🟡 未决 0 · 🔵 未决 1（Orig 7，不阻断）

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
