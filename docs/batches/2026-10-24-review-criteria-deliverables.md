# 2026-10-24 · 评审判据补「项目设计交付物清单」（判据不随输入变）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 18:14「文档评审不应该根据输入来决定评审标准」——判据清单缺「项目设计要求清单」这一维，导致 F34 集成测试设计段在任何一轮都没被问过。
> 台账 = #1759（ADVISOR · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
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

**过期读数收正（fix 笔 · 设计席 · 2026-10-24）**

| # | 坐标 | 收正 | 依据 |
|---|---|---|---|
| 1 | `docs/core/design/ADVISOR-CONVERGENCE.md:402`（A-AC18 尾部） | `**待落笔**（该档现止第 11 条 `:48`——第 12 条由实现轮写入后标日期）` ⇒ `**已落笔**（EN 在盘——2026-10-24）`（对齐 A-AC15 ∥ A-AC16 形） | 第 12 条在盘 `thincoder-core/prompts/advisor-design.md:52-55`，`:57` = `## Output Format`；`git diff` = +4 / −0（本档 §5） |
| 2 | `docs/core/design/PROMPT-SYSTEM.md:2491` | 「设计评审 11 条」⇒「设计评审 12 条」 | 同档 `## Review Criteria` 节 `:21-56` 整数编号计数 = 12（1–12），另 `6b` 一条（本笔 `node` 实读） |

**回读（D6）**：`待落笔` 在 `docs/core/design/**` 全域 0 命中；`设计评审 11 条` 0 命中 · `设计评审 12 条` 恰 1 命中（`:2491`）。

**未动**：提示词档（产品代码面）· §17 机制句（`docs/core/design/ADVISOR-CONVERGENCE.md:437` ∥ `:446`，已写第 12 条、无待落笔标记）· `thincoder-core/prompts/persona-eng-designer.md`（归 `#1760`）· 同档各节当批读数中的「11 条」（全档数面 sweep 已有在案上抛项）。

**门禁**：`doc_check(mode:"gate")`（2 档 = `docs/core/design/ADVISOR-CONVERGENCE.md` ∥ `docs/core/design/PROMPT-SYSTEM.md`）= `DOC-CHECK GATE: PASS`，0 命中。

**本改动是否触及业务行为**：否（设计档读数收正，零代码 / 零提示词面改动）。

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

**批准依据**：用户 2026-10-24 18:14「文档评审不应该根据输入来决定评审标准」＋ 18:15「我实际要求要检查是否包含集成测试」——两条直接指名本批要做什么；配合会话内「自动跑」授权，设计评审轮 2 通过后进入实施。

**我写偏过一次**：第一版任务书把「加一条判据」扩写成「项目设计交付物清单」维度（要列清单、标需求出处、做防重复分析、加元层论述），被用户当场打回，按最小形重写为一条判据。

## §5 实施记录（eng-coder）

**实施完成**（eng-coder · 2026-10-24）

**落点**：`thincoder-core/prompts/advisor-design.md:52-55`——`## Review Criteria` 第 11 条（`:48-51`）之后、`## Output Format`（`:57`，改前 `:53`）之前，新增第 12 条 4 行。文案逐字取自 `docs/core/design/ADVISOR-CONVERGENCE.md:449-452`【提示词逐字建议】代码块，零改写。

**落文（逐字，4 行）**：

```text
12. **Integration-test design**: the design document must contain an integration-test design section — the scenarios this change requires, the business result each asserts, and the business requirement each traces back to.
    **A design missing that section ⇒ 🔴 (design incomplete)**; a change that alters no business behavior states so, with its reason, in that section.
    **A reason that is not "this change alters no business behavior" does not stand** — e.g. the 50–100 case window being full ⇒ still 🔴.
    **Why**: integration tests are the only acceptance run that starts from a user-visible entry, and the batch's unit-test files are deleted at closeout — a design that never names those scenarios leaves the change with no acceptance at all.
```

**验收自检**：

| # | 验收 | 读数 | 结论 |
|---|---|---|---|
| ① | 第 12 条逐字在位 | 与 `docs/core/design/ADVISOR-CONVERGENCE.md:449-452` 四行逐字比对 = `true`（逐字读核对，非散文锚机检） | ✅ |
| ② | `>300` 字符行 = 0 | 全档 136 行，最长 290 字符（`:33`，既有第 7 条）；新增 4 行 = 222 / 149 / 137 / 242 | ✅ |
| ③ | 既有 11 条逐字不变 | `git diff` = +4 / −0；`## Output Format` 由 `:53` 顺移 `:57` | ✅ |
| ④ | 落点位置 | `:51` 第 11 条末行 → `:52-55` 第 12 条 → `:56` 空行 → `:57 ## Output Format` | ✅ |

**验证读数**：

- `node test/run.mjs`（`thincoder-core`）= tests 33 · pass 33 · fail 0。
- `doc_check(mode:"gate")`（`target` = `D:\teamcode\thincoder`，`docs` = `["thincoder-core/prompts/advisor-design.md"]`）= `DOC-CHECK GATE: PASS`（1 档 0 命中）。
- 装载面：`loadAdvisorPrompt("advisor-design.md")` = 14710 字符 / 136 行，第 12 条读回在第 52 行。

**决策披露**：

| # | 决策 | 理由 |
|---|---|---|
| 1 | 只改 1 档、只增 4 行 | 派单边界：不改既有 11 条（含 6b）、不动 `## Output Format`、不改设计档；`git status` 仅本档改动 |
| 2 | 未改 A-AC18「待落笔」 | 设计档已过评审、处冻结面，派单明禁；改标日期归设计席（见上抛 ①） |
| 3 | 未新增集成测试用例 | 改动 = 评审判据文本（过程面），无用户可见入口的业务行为变化；验证面 = 逐字读核对 + doc-check gate |
| 4 | 未动 `.thincoder/advisor.md` ∥ `PROMPT-SYSTEM.md` ∥ `persona-eng-designer.md` | 均不在本批文件表；`.thincoder/advisor.md` 且在本仓之外（写外仓 = 越界）——三项移交父侧（见上抛 ②③④） |

**内部探索偏差审计**（1 轮 · 只读子代理）：终端状态 `clean`——部分实现 / 静默简化 / 档漂移 / 清单外改动四类偏差均无。审计侧无 git 工具，AC ③④ 以位移算术代验；本席随后自取 `git diff`（+4 / −0）与 `git status` 补齐，残留已消。

**内部 advisor 代码评审**（1 轮 · `type:"code"`）：`VERDICT: pass`——6 条（🟡 3 · 🔵 3），无 🔴。处置：③号（§5 空缺）由本段补写闭环；①号（A-AC18 状态）∥ ②号（工作区判据面）∥ ④号（设计侧措辞）∥ ⑤号（提示词面登记 / 计数）∥ ⑥号（门禁读数）均在本笔写权之外，逐条移交父侧、未代改。

**修正轮**：0（代码面无需修正；本轮唯一补笔 = 本段 §5）。

**终端状态**：`clean`。

**上抛（父侧）**：

- ①【知会】`docs/core/design/ADVISOR-CONVERGENCE.md:402` A-AC18 仍读「**待落笔**（该档现止第 11 条 `:48`）」——第 12 条已在盘（`:52-55`），该行状态与坐标均已过期；改标「已落笔（EN 在盘——2026-10-24）」归设计席。
- ②【待裁】`.thincoder/advisor.md` 工作区级判据（设计维度 `:23-28` 共 6 条）无「集成测试设计段」；经 `thincoder-core/advisor/history.mjs:53-58` → `thincoder-core/advisor/messages.mjs:239-241` 以 `## Review Criteria` 块注入评审用户消息 ⇒ cwd = `D:\teamcode` 时评审席仍见一份不问该问题的判据面。写权在仓外，本笔未动。
- ③【知会】`docs/core/design/PROMPT-SYSTEM.md:2491` 仍读「设计评审 11 条」；本笔无 D-PS 登记行（先例 §6.46 ∥ §6.47）。计数 sweep 由父侧收口裁定。
- ④【知会】`thincoder-core/prompts/persona-eng-designer.md:134` 义务面仍用 `the scenario table this change earns`，判据面已用 `requires`（`:52`）——同件两词，待父侧裁是否另起一笔对齐。
- ⑤【知会】本批 §2 记的 `doc_check` ERROR 与 §3 的 `>300` 行命中（`:77`，304 字符，评审席笔、非本席面）：本席按显式 `target` 直调 `doc_check(mode:"gate")` 得 PASS（1 档 0 命中）；`batch` 收口门若仍报 ERROR 属引擎版本态，非文档命中，须重启复跑。

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核**

| 项 | 读数 |
|---|---|
| 判据落点 | `thincoder-core/prompts/advisor-design.md:52-55`（第 12 条四行，与设计档 `:449-452` 逐字一致） |
| 既有与新增 | `git diff` = `+4 / −0`；`## Output Format` 由 `:53` 顺移 `:57` |
| 超宽行 | `>300` 字符 = 0（最长 290，全档 136 行） |
| core 全量 | 33 pass / 0 fail |
| A-AC18 | 已由「待落笔」改为「**已落笔**（EN 在盘——2026-10-24）」 |
| `PROMPT-SYSTEM.md` 计数 | 「设计评审 11 条」→「12 条」 |

**批内单测档**：本批为判据文本，无单测档。

**集成场景 = 无新增（记明理由）**：本批改的是评审判据文本，不改变任何代码路径；其效果须由模型行为体体现，无可确定性断言的前端入口。

**评审链路**：设计（§17 一条判据）→ 轮 1 **changes-required**（2 🔴：定义判据的文档自身没带「同类先例」行与「勘察证据」行）→ 修正 10 条 → 轮 2 **pass**（0 🔴 未决，仅 §13 空号一条 🔵）。

**未决项（台账承接）**
- `.thincoder/advisor.md`（工作区级判据，`D:\teamcode` 下，本仓之外）设计维度 6 条无「集成测试设计」——该档不在本仓，未改，已上抛待用户裁。
- `persona-eng-designer.md:134` 的 `earns` 措辞 → `#1760`。
