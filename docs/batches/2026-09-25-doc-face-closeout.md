# 2026-09-25 · doc-face-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 3/6 · 文档面收尾）。
> 台账 = #341 / #342 / #347 / #349（文档面收尾 · 归批）。前情 = docs/batches/2026-09-25-hygiene-items.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源** = 用户 2026-09-25 15:29「看一下技术待办，分一下批，整体处理」——技术待办排批（批 3/6 · 文档面收尾）。**全链口径** = 设计 → 评审 → §4 → 实施 → §6（承今日先例 · 父侧代执行）。

**批件**（4 条 · evidence 全档 = `ledger_query`）：

| # | 条目 | 要点 |
|---|---|---|
| 台账 #341 | PROMPT-SYSTEM §6.3 三示例归属 + 状态行收口 | 示例一「`discipline-engineering` 的池规则段」vs 现体（池规则落 `persona-engineering.md:157-158`）；`:173` 状态行「已裁保留」∥ `:176-178` 复核注「并入核内正文」未收口——语义面（改字面或加历时限定语；全验证 = 三示例现体与注入面实核）。 |
| 台账 #342 | CN 路由缺四行 | `docs/core/design/prompts/common.md:68-73`（CN 散文路由）缺 `verify` / `process` / `get_current_time` / `wait_for` 四行（EN 表 `thincoder-core/prompts/common.md:90-113` 有）——按 D-PS1「CN = 内容权威」并入 CN（或裁定「表 = 运行面形式」+ 补 CN 指针）；同捆 = 双源机检缺口（`prompts-dual-source.test.mjs` CN 侧断言指向 CLI 仓归档副本——真实 CN 面不在射程）。 |
| 台账 #347 | 旧编号 / 坐标族 sweep | ① 裸形旧编号面（~60 行 / ~20 档；`DOC-DISCIPLINE.md` §3.9 J-1「另轮读数域」）；② `TUI.md §15.x` 族死引（8+ 档）；③ `TODO-archive.md:263` 档名错位 · `TODO.md:50` 坐标漂移；④ §3.9 J-1 残差块销项 / 收口（设计档笔 D1）。 |
| 台账 #349 | 「自持」句限定语族 | 首例已消（`WEBVIEW.md:3` 补限定 ✓ 父侧笔 · 15:2x）；余 = 复核确认（全仓复扫无第二裸例）+ 防复发口径（新增句按族补限定）。 |

**边界**：需求层 / 设计层**重大语义**变更 = 设计笔（小修呈报）；提示词运行面（`thincoder-core/prompts/**`）落地 = 实施轮（D1：prompts = 主 agent 内容权威 + eng-coder 落地）——本批设计 = 判据 / 措辞面，落盘按面路由。

**前情** = 批 `2026-09-25-hygiene-items` §6（死指针 sweep 87 处批的余族承接）+ `misc-four` §2（§6.3 复核注来源）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（收正轮 1：三项落位（修正块 = §2.13）· 2026-09-25）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>


**来源** = 本档 §1（4 条：台账 #341 / #342 / #347 / #349）· 轮次 = initial · 设计笔 = eng-designer（本席）· 设计档修订**已落盘**（落点见 §2.2）。

### §2.1 覆盖条目与判据（四条）

| # | 条目 | 本设计落定 | 判据（可核） |
|---|---|---|---|
| 1 | 台账 #341（§6.3 三示例归属 + 状态行） | **改字面**——规范面删「已裁保留」表达、改现体陈述（端特有段现余 0 + 工具面 2 锚） | `PROMPT-SYSTEM.md:173-176` 无「已裁保留 / 复核」残留 ∧ 三处落点行号实核在档 ∧ 工具面 2 锚名在场 |
| 2 | 台账 #342（CN 缺四行 + 同捆机检缺口） | **并入 CN**（判据 = D-PS1）+ 余三项判非缺 + 机检读点改指真实 CN 面 | CN `common.md` 四名在场 ∧ EN 运行面零改 ∧ 测试读点指 `docs/core/design/prompts/` |
| 3 | 台账 #347（旧编号 / 坐标族 sweep） | 设计 = `DOC-DISCIPLINE.md` §3.12 条目 K（三族复扫判据 + 二态处置表 + 销项/收口口径）；③ 两行判 B 类零触碰 | ② 族域内 `TUI.md §15` 归 **0** ∧ ① 族 A 类位点零死编号 ∧ 两档零 diff ∧ `doc-check` 新增悬空 0 / 超宽 0（相对判据） |
| 4 | 台账 #349（措辞族） | 设计 = `DOC-DISCIPLINE.md` §3.13 条目 L（同节三要件在场判 + 防复发）；复核读数在册 | 三要件在场判可复跑 ∧ `WEBVIEW.md:3` 限定语逐字在场 ∧ A 态位点逐处带限定 / B 态零 diff |

### §2.2 设计档落点（file:line · 已落盘）

- `docs/core/design/PROMPT-SYSTEM.md`：**`:173-176`**（§6.3 端特有段收正；`:172` 纪律句保持不动）· **`:329-333`**（§10.2 双源内容差收正块）· **`:352`**（变更记录）。
- `docs/core/design/DOC-DISCIPLINE.md`：**`:83`**（§3 标题枚举同步 · D3）· **`:661-693`**（§3.12 条目 K）· **`:695` 起**（§3.13 条目 L）· **`:502`**（§3.9 J-1 残差块 +1 行登记）· **`:1132-1148`**（§5 A-DD20 / A-DD21 + 用例指针行）· 档尾变更记录行。

### §2.3 #341 实核证据链（裁定依据）

- **注入面**：提示词面注入锚**全消**——`thincoder-cli/src/prompt-injections.mjs:9-11` ∥ `thincoder-vscode/src/prompt-injections.mjs:9-12`（端特有段（收尾验收 / R14 池规则 / eng-coder Guidelines）通用化并入核内正文）；全仓实核余锚 = **仅工具面 2 锚**（`thincoder-core/tool-docs/bash.md:15` ∥ `question.md:11`）。
- **三示例现体**（均核内）：池规则 = `thincoder-core/prompts/persona-engineering.md:158`（`agent.poolLimits` 三键；CN 正本 `docs/core/design/prompts/persona-engineering.md:157-158`）· Multi-Task = 同档 `:154` 起「Parallel dispatch & multi-task」（CN 正本 `:151` 起「并行委派与多任务」）· 实现纪律 = `thincoder-core/prompts/persona-eng-coder.md:17`（不得静默降级）/ `:23`（收尾自审；CN 正本 `:18` / `:30`）。
- **裁定**：三示例现体均非「端特有段」（端差已消后的核内正文）⇒「已裁保留（A9 三件齐）」**对象不存在** ⇒ 按 no-revision-style 军规（用户 2026-09-18 定）规范面**删保留表达、改现体陈述**；A16 / C2 / A18 保留裁定与 A9 三件回填的历时性 → 变更记录（`:352`）。
- **否决「加历时限定语」**：对象已不存在，该写法必落「此前保留 ⇒ 现并入」修订式表达（军规禁）；且两读并存正是本条要收的缺陷。**否决「保留现字面」**：与 `:176-178` 复核注相抵（本轮立案根因）。

### §2.4 #342 逐字落笔面（实施轮直接照落）

**CN 正本** `docs/core/design/prompts/common.md`——在 `:72`（`…委派/评审/会诊用 `subagent`/`advisor`/`consult_*`。`）行**后新增一行**（行数 122 → 123；零删改）：

```text
进程 / 时钟 / 等待用 `process` / `get_current_time` / `wait_for`（别用 `tasklist`/`ps`、`date`、`sleep` 凑）、收尾门用 `verify`（你声明 verification.status，它机械把关——不替你跑检查，也别指望它跑测试）。
```

（与 EN 表 `thincoder-core/prompts/common.md:108` / `:109` 两行语义对等；**EN 运行面零改**；提示词内容权 = 主 agent——落笔前经其确认。）

**机检面** `thincoder-cli/test/prompts-dual-source.test.mjs`（改指，零新增断言）：`:44` 读点改 `../../docs/core/design/prompts/persona-eng-designer.md` · `:49` 存在性断言同改 · `:51` 头注格式断言（CN 形 `<!-- 槽位:[1] 消费方:[…] -->`，实核 `docs/core/design/prompts/persona-eng-designer.md:1` 已在形）· `:13-14` 头注路径收正（`docs/design/prompts/` → `docs/core/design/prompts/`）。

### §2.5 #347 实施口径（单源 = §3.12，本处只落当轮读数与写域）

- ② 族当轮实读 = **14 行 / 10 档**（清单 = `DOC-DISCIPLINE.md` §3.12②）；逐 token 实读承接节（`docs/cli/design/TUI-SESSION-VIEW.md` §5.x）⇒ 改指 / 改述。
- ① 族（裸形旧编号）读数浮动 ⇒ **当轮复扫定**（判类前实读靶档；两候选不可唯一 ⇒ 判保留 + 登记）。
- ③ 两行 = **零触碰**（B 类；档级处置待裁——见 §2.10）。
- **写域路由**：三树注改 / 测试头注 = eng-coder；`docs/TODO.md` / `docs/TODO-archive.md` = 零触碰；设计档面（§3.9 残差块收正）= eng-designer。

### §2.6 #349 复核读数与处置口径（单源 = §3.13）

- **判据**（同节三要件在场判）：族句所在节内①限定 / 否定句 ②时点锚 / 史实谓词 ③规范单源指针——任一在场 ⇒ 判合格。
- **复扫域** = `docs/**/design/**`（非归档）+ 提示词两面；族正则 = `原文自持|各自保留|不加面间同步依赖|互不追赶|各写一份|不做逐字硬一致|不做 byte-identical`。
- **读数（as-of 2026-09-25 本席复扫）**：族命中 **114 行**（域含 requirements 面）；设计层面**同节无三要件者 19 行**——
  `AGENT-LOOP-ASYNC-POOL.md:156` · `AGENT-LOOP-UPSTREAM.md:784` · `:786` · `BATCH-RECORD.md:310` · `:312` · `:346` · `CORE-UNIFICATION.md:1142` · `:1143` · `:1445` · `DOC-CODE-RECONCILE.md:31` · `:409` · `LEDGER-SELF-CONTAINED.md:85` · `:257` · `PORTABILITY.md:101` · `PROMPT-SYSTEM.md:77` · `TESTING.md:8` · `:10` · `TWO-REPO-MERGE.md:65` · `TUI.md:576`。
- **初判（逐行判类归实施轮）**：B 类（他义 / 记录面）= `TWO-REPO-MERGE.md:65`（版本线各自保留）· `PROMPT-SYSTEM.md:77`（旧头注引文 · 记录块）· `DOC-CODE-RECONCILE.md:31`（判据宿主复用）· `CORE-UNIFICATION.md:1445`（端侧替换选型）· `AGENT-LOOP-UPSTREAM.md:784`/`:786`（已裁前提出处 · 节内有日期）· `PORTABILITY.md:101`（旧档来源注）· `LEDGER-SELF-CONTAINED.md:85`/`:257`（否决行 / 对照表行）。
  A 态候选（活面形态句）= `BATCH-RECORD.md:310-312` · `:346` · `TESTING.md:8` · `:10` · `AGENT-LOOP-ASYNC-POOL.md:156` · `CORE-UNIFICATION.md:1142-1143` · `DOC-CODE-RECONCILE.md:409` · `TUI.md:576`——**处置 = 随该档下次触碰补限定 / 称引规范句**（本批不扫、不新增门；要本轮强扫 ⇒ 父侧明示扩射程）。
- **与 §1 父侧结论的关系（如实并记）**：父侧 15:2x 复扫「实锤裸句仅 `WEBVIEW.md:3` 一处」在本席判据下**复核成立**（同形态档头 / 总则句无第二处）；本席另登「同节无否定语的族句 19 行」——判据面不同（裸读法实锤 ≟ 写作形态候选），**非相互否证**。

### §2.7 受影响文件与测试面（as-of 2026-09-25 · 写域路由）

| 档 | 面 | 行数 | Δ | 落笔方 |
|---|---|---|---|---|
| `docs/core/design/PROMPT-SYSTEM.md` | 设计档 | 426 | 设计轮已落 | eng-designer ✓ |
| `docs/core/design/DOC-DISCIPLINE.md` | 设计档 | 1395 | 设计轮已落 | eng-designer ✓ |
| `docs/core/design/prompts/common.md` | 提示词（CN 正本） | 122 | **+1 行** | 内容权 = 主 agent；落笔 = 实施轮 |
| `thincoder-core/prompts/common.md` | 提示词（EN 运行面） | 163 | 0 | —（零改） |
| `thincoder-cli/test/prompts-dual-source.test.mjs` | 测试 | 121 | ±0（改指） | eng-coder |
| ② 族 10 档（注释面） | 代码 / 测试 | `thincoder-core/text-budget.mjs` 79 · `thincoder-cli/src/tui/`：`display-budget.mjs` 206 · `conversation-writer.mjs` 62 · `key-handler-search.mjs` 121 · `subagent-blocks.mjs` 453 · `subagent-children.mjs` 234 · `subagent-freeze.mjs` 246 · `tool-display.mjs` 157 · `tool-events.mjs` 449 · `thincoder-cli/test/tui-memory-budget.test.mjs` 334 | ±0（逐行替换） | eng-coder |
| ① 族档集 | 代码 / 测试 | 当轮复扫定（卫生轮读数 ~60 行 / ~20 档） | ±0 | eng-coder |
| `docs/TODO.md` 57 · `docs/TODO-archive.md` 316 | 退役历史 | — | 0（B 类） | **零触碰** |
| A 态候选档（§2.6 八处） | 设计档 | 随档触碰定 | 补限定语 | eng-designer（提示词面归主 agent） |

**测试面**：三包 `npm test` 复跑（cli / core / vsc）· `node scripts/doc-check.mjs`（**相对判据**：本轮新增悬空 0 / 新增超宽 0）· 定向 `node --test thincoder-cli/test/prompts-dual-source.test.mjs` · ② 族改指后零命中判（`node` 逐行扫——中文串判据禁 `findstr`，承 §3.11）· ③ 族零 diff 判（`git diff` 两档 hunk 0）。

### §2.8 验收对照（回指四条 → 机判）

| 条目 | 验收判据 | 单源 |
|---|---|---|
| #347 | **A-DD20**（6 条：① 族零死编号 / ② 族零命中 + 改后实存 / ③ 零 diff / 机检零新增 / 行数守恒 / 清单外零改动） | `DOC-DISCIPLINE.md:1132` |
| #349 | **A-DD21**（2 条：复核读数在册 + 限定语逐字在场 / A 态位点带限定、B 态零 diff） | `DOC-DISCIPLINE.md:1141` |
| #341 | `PROMPT-SYSTEM.md:173-176` 无保留残留 ∧ 三处落点实核 ∧ 工具面 2 锚在场 | `PROMPT-SYSTEM.md:173-176` |
| #342 | CN 四名在场 ∧ EN 零改 ∧ 测试读点指 `docs/core/design/prompts/` | `PROMPT-SYSTEM.md:329-333` + §2.4 逐字 |

**三链同源**：台账 #341 / #342 / #347 / #349 → 本表 §2.1 → 设计档落点（§2.2）——四条均 `tech_todo`（需求档面无对应条目，锚 = 台账行）。

### §2.9 关键决策（含否决备选）

| KD | 决策 | 否决备选与理由 |
|---|---|---|
| KD-1 | #341 = **改字面**（规范面改现体陈述） | 否决「加历时限定语」（必落修订式表达——军规禁）· 否决「保留现字面」（与本档 `:176-178` 复核注自抵，即本轮立案根因） |
| KD-2 | #342 = **并入 CN**（D-PS1 直通） | 否决「表 = 运行面形式 + 补 CN 指针」（令内容权威面反向依赖翻译产物；CN 人审面缺行） |
| KD-3 | ③ 族两行 = **B 类零触碰**（退役历史） | 否决「逐行改指」（改即触碰待裁的档级处置面） |
| KD-4 | #347 族域 = 三树**全**（含 `test/**`） | 否决「沿用 §3.9 J-1 源码面域」（② 族实存含测试头注 ⇒ 域须覆盖） |
| KD-5 | 批名（`TUI-OOM-ROOTCAUSE`）**非法定豁免** | 承 §3.9 J-1 先例（批名 ≠ 时点锚；带日期才 B 类） |
| KD-6 | #349 = **同节三要件在场判** + 防复发写作要求 | 否决「逐句强加限定语」（churn + 他义误伤）· 否决「新增机检门」（散文锚禁新增 · 2026-09-17「无限机检反感」裁定） |
| KD-7 | 销项 / 收口 = **设计档笔**（D1） | 承 #347④；块收口三判据落 §3.12（无「另轮 / 待核」常驻态） |

### §2.10 上抛项（父侧裁决 / 另批）

1. `docs/TODO.md` / `docs/TODO-archive.md` **档级处置仍待裁**（归档 / 删除 / 冻结；台账 #27 在案）——本笔零触碰；若需回改两行，须先裁档级处置。
2. **`timer` 工具路由缺行**：CN `:68-73` 与 EN `:91-113` 两处工具路由块**均无** `timer`（`thincoder-core/agent-tools/timer.mjs` 在位 + 全角色固定段装配）——非本批四条射程，建议入册（另批）。
3. §2.6 A 态候选约 10 行**逐行判类**归实施轮 / 随档触碰；要本批强扫 ⇒ 父侧明示扩射程。
4. `PROMPT-SYSTEM.md` §2.4 / §3.1 的 A16 / C2 / A18 三行仍载「端特有段按注入」文字（**裁决行记录面** = B 类零触碰）——要同步补注 ⇒ 属记录面回改，须明示。
5. **工作树垃圾**：仓根 27 个未跟踪临时证据档（`.tmp-hyg2-*.txt` · `.doc-check-*.txt` · `.fin-*.txt` 等，卫生族批遗留）+ `.thincoder/tmp/**` 打包残留——非本批写域，建议父侧清理轮并做。

### §2.11 边界与 UI / 交互面

- **零 UI / 交互面**（本批四条全为文档 / 提示词文本 / 代码注释面）——**无未决交互项**（`open` 项 = 0）。
- **边界**（承设计档 §3.12 / §3.13 边界条）：`docs/batches/**` · `_archive/**` · 产品参照树零触碰；需求档正文 = 父侧笔；提示词正文内容权 = 主 agent；**新增机检门禁**；冻结 / 归档面不回改。
- **档面形态说明**：本段首两行 = 工具状态行 + 骨架占位行（同批他档 §2 同形）；本席首次 append 携带的重复状态行已就地删除（同段 = 本席段；非内容改动）。

### §2.12 fix 轮 1 修正块（设计评审轮 1 · 发现 1–8 逐条落位）· 2026-09-25

**范围声明**：本块只承本档 §3 轮次 1 的 8 条发现（父侧逐条裁定接受 · 处置执行人 = 本席）；§2.1–§2.11 原文**零回改**（本段 append-only）——与本块相抵处一律以本块为准；**不扩射程**（需求档 / §3 评审段 / `docs/TODO*.md` 零触碰）。

| # | 处置（逐条） | 改动 file:line（as-of 2026-09-25 落笔后现盘） |
|---|---|---|
| 1 | **A-DD21 ②** 改述为「**本轮实际触碰的 A 态位点**逐处带限定 / B 态零 diff」+「未被触碰的 A 态候选在本轮验收射程外」；**成立前提** = §2.6 裁定（A 态候选 19 行随该档下次触碰处置——本批不扫 A 态。§2.1-#4 判据改述见下行，原文零回改） | `DOC-DISCIPLINE.md:1153` |
| 2 | **二态处置表落点定稿**：表体入**批档 §5 实施记录**（定稿 = 当轮复扫基线读数）+ A-DD20 ① 判类清单同源指针（同源 · 可逐行核对） | `DOC-DISCIPLINE.md:682` · `:1142` |
| 3 | **族域 / 路由 / 受影响表三处对齐——择「写域路由补全」**（族域保持 = 三树全 + `docs/**` 非归档）：域内 docs 面命中位点归属 = 该档面主笔（D1）；批级路由 / 受影响行 = 本块「受影响表补行」 | `DOC-DISCIPLINE.md:676` · 本块受影响表补行 |
| 4 | **尺寸档登记**（不拆 + 理由 + 触发 + 抽取候选线）：三档 = `subagent-blocks.mjs` 453 · `tool-events.mjs` 449（A9 / A10 行刷新）+ `tui-memory-budget.test.mjs` 334（新增 B7 行）；落点 = **`docs/cli/design/CLI-DEBT.md`**（CLI 树唯一活登记面 · §1-2 行维护① 自持「触碰批设计轮刷新」义务；不造第二册——D2） | `CLI-DEBT.md:40` · `:41` · `:58` · `:48`（计数 6→7）· `:60` · `:88` |
| 5 | **#347④**（§3.9 J-1 残差块销项 / 收口）补可核判据 **A-DD20 ⑦**（按当轮读数收正 ∧ 携消解路径 + 到期条件 ∧ 无常驻态） | `DOC-DISCIPLINE.md:1148` |
| 6 | **§10.2 表补 #13 行**（`persona-explore` 对——槽标 ✓ / 标题树 3/3 同 / 对齐）+ 表体接回（去中断空行）；「15 对」计数与列表同改（D3） | `PROMPT-SYSTEM.md:326`（`:325` / `:327` 邻接）· `:353`（变更记录） |
| 7 | **as-of 行号收正 + 浮动口径注**（见次表） | 本块 |
| 8 | 「裸形面 = 另轮读数域」两处笔误收正 | `DOC-DISCIPLINE.md:502` · `:684` |

**#7 as-of 收正表**（旧记 → 落笔后现盘）：

| 引用点 | 旧记（§2.2 / §2.8） | 落笔后现盘 |
|---|---|---|
| `DOC-DISCIPLINE.md` §3.12 条目 K | `:661-693` | `:661-698`（区块尾 = `**验收标准**：见 §5 的 **A-DD20**。` 行） |
| `DOC-DISCIPLINE.md` §3.13 条目 L | `:695` 起 | `:700 起`（评审轮现盘 `:699` + 本轮 §3.12 内插入 1 行） |
| `DOC-DISCIPLINE.md` §5 A-DD20 / A-DD21 | `:1132` / `:1141` | `:1140` / `:1150`（评审轮现盘 `:1139` / `:1148` + 本轮 +1 / +2） |
| `PROMPT-SYSTEM.md` §10.2 双源内容差收正块 | `:329-333` | `:330-334`（本批表体接回 = 净 0 行增：+1 行 / −1 空行） |
| `PROMPT-SYSTEM.md` 变更记录 | `:352` | `:353` |
| §2.7 两 .md 档行数 | `1395` / `426` | `1415` / `429`（`wc -l` 口径；read 面 = 1416 / 430。本轮增量 = DOC-DISCIPLINE +6 行 · PROMPT-SYSTEM +2 行） |

**浮动口径注**：上列行号 = **as-of 2026-09-25 本席落笔后现盘读数**——本仓多会话共写（`DOC-DISCIPLINE.md` 正被他批在途笔触碰）⇒ 行号随并行写入漂移；**主锚取节号**（`§3.12` / `§3.13` / `§5 A-DD20` / `§10.2`），行号只作 as-of 参考、不作复现判据。

**受影响表补行**（承 #3——族域 docs 面命中位的落笔归属；与 A-DD20 ⑥「清单外零改动」一致）：

| 档 | 面 | 行数 | Δ | 落笔方 |
|---|---|---|---|---|
| ① / ② 族域内 `docs/**` 非归档命中档（当轮复扫定） | 设计档 | 随档 | ±0（逐行替换） | eng-designer（需求档面 = 主 agent） |
| ① 族定稿档集中 >300 行档 | 代码 / 测试 | 随档 | ±0 | **按树落既有登记面**：核 = `SOFT_LINE_REGISTRY` + `CORE-UNIFICATION.md` §2.8.1 · CLI = `CLI-DEBT.md` · VSC = `VSC-DEBT.md` §12.1；docs 面 = 文档无行数义务——逐档「不拆 + 理由 + 触发 + 抽取候选线」，登记时点 = 实施轮读数落 §5 同轮 |

**#1 前提重申**（§2.1-#4 判据改述——原文零回改，以本行为准）：`#349` 判据 = 三要件在场判可复跑 ∧ `WEBVIEW.md:3` 限定语逐字在场 ∧ **本轮实际触碰的 A 态位点**逐处带限定 / B 态零 diff；**成立前提** = 未被本轮触碰的 A 态候选不构成本轮验收义务（处置 = 随该档下次触碰；要本轮强扫 ⇒ 须父侧明示扩射程）。**三链同源不受影响**：台账 #349 → §2.1-#4（改述见本块）→ `DOC-DISCIPLINE.md` §3.13 / A-DD21。

**#3 择一依据（据实勘 · 呈报）**：② 族当轮实读 **14 行 / 10 档全在三树代码 / 测试面**（域内 `docs/**` 零命中——复扫命令 = A-DD20 ②）；① 族为**浮动读数**（当轮复扫定）⇒ 设计轮不能证明 docs 面为空 ⇒ **收窄域 = 未验证的缩程**（fail-open 方向）⇒ 择「路由补全」保域全。**族域零收窄、零扩射程**。

**机检读数（相对判据 · 本席落笔后现盘）**：`node scripts/doc-check.mjs`（cwd = 仓根）⇒ 悬空 **4 → 4**（零新增）· 行宽 **18 → 20**——**+2 全落 `docs/vsc/design/WEBVIEW.md:140` / `:682`**（他批在途写域，非本轮三档）；**本轮三档**（`DOC-DISCIPLINE.md` / `PROMPT-SYSTEM.md` / `CLI-DEBT.md`）零新增超宽 · 零新增悬空。基线 = 本席首动作前复测（写死基线即失真——同 A-DD20 ④ 句式）。

**顺带观察（报而不改 · 非本轮射程）**：

1. `CLI-DEBT.md:32`（A1 行）拆分计划目标写**全路径**形态（`src/tui/provider-admin.mjs`（拟新增）——被机检列报），与 §3.8 / §3.9「拆分计划目标 = **裸名**形态」纪律不同形；本轮新行已按裸名形态（A9 / A10 / B7），旧行未动。
2. 档位读数无漂移：`subagent-blocks.mjs` 453 · `tool-events.mjs` 449 · `tui-memory-budget.test.mjs` 334——与 §2.7 自报同值（`split("\n").length − 1` 口径 = `wc -l`）。
3. `docs/vsc/design/WEBVIEW.md` 新增超宽 2 行 = 他批在途笔（同 `DOC-DISCIPLINE.md` 在途状态）；两档非本批写域。

### §2.13 设计档收正轮修正块（批 3 实施后 · 三项点名 · 处置执行人 = 本席）· 2026-09-25

**范围声明**：本块只承父侧裁定三项（§3.12 销项口径执行 · 实施披露回写 · docs 面活位点 A 类处置）；§2.1–§2.12 原文**零回改**（本段 append-only）——与本块相抵处一律以本块为准；**代码零触 · §3 评审段零触 · 不扩三项**。

| # | 处置（逐项） | 改动 file:line（as-of 2026-09-25 落笔后现盘） |
|---|---|---|
| 1 | **§3.9 J-1 残差块按当轮读数收正**（行 / 档双计 + 子族登记行逐条）＋「裸形面 = 另轮读数域」口径随销项退场（判据单源 = §3.12「销项 / 收口口径」三条）＋ §3.12 ③ 处同步 | `docs/core/design/DOC-DISCIPLINE.md`：口径边界行 `:429-432`（含带前缀面复扫读数）· 消解路径 / 到期条件行 `:497` · 子族登记行 `:498`–`:505` · **收正行（新增）** `:506-507` · §3.12 ③ 族裁定段 `:685` + 实施轮读数 `:687` · 销项 / 收口口径段执行态 `:691` · 变更记录 `:1491-1492` |
| 2 | **`WEBVIEW-PROTOCOL.md:185` 改指**（A 类 · 靶节存在性先核 = `AGENT-LOOP-SUBAGENT.md` §6.7.6 实存 ✓） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:185`（`§18 C-1/Q1` → `AGENT-LOOP-SUBAGENT.md` §6.7.6 C-1/Q1）· 变更记录 `:627` |
| 3 | **本修正块**（§2.4 字面回写 + 族域口径裁定记录） | 本档 §2.13 |

**§2.4 字面回写（承 §5 披露 2）**：§2.4 两处路径字面（原记 `../../docs/core/design/prompts/persona-eng-designer.md`）经 `read()` 助手（base = 包根 `thincoder-cli/`）解析为**仓外** `teamcode/docs/…` ⇒ **实落形 = `../docs/core/design/prompts/persona-eng-designer.md`**（现盘逐字 = `thincoder-cli/test/prompts-dual-source.test.mjs:44` 读点 / `:49` 存在性断言）；意图（读点指真实 CN 面）零变——§5 披露 2 落定。

**族域口径裁定记录（承 §5 待裁条 · 父侧 2026-09-25 裁定）**：① 族 = **AGENT-LOOP 族**（准 #63 口径——`AGENT-LOOP.md` / `AGENT-LOOP-SUBAGENT.md` / `AGENT-LOOP-ASYNC-POOL.md` / `TUI.md` + derived homes）；`thincoder-core/advisor/**`（§14.x / §16.x）· `thincoder-core/tools/**`（TOOLS 旧号）· VSC 面板 / 驱动族 = **另族续轮候选**（非本族域——已另册；消解径 = 下一产品码注释轮）。**族域零收窄 / 零扩射程**（§2.12 #3 口径维持）。

**机检读数（相对判据 · 本席复测）**：`node scripts/doc-check.mjs`（cwd = 仓根）⇒ 悬空 **4 → 4**（零新增）· 行宽 **21 → 18**（本笔零新增；绝对差 = 他批在途写域）。**自纠披露（1 项）**：首版 2 行超宽（`DOC-DISCIPLINE.md` `:429` / `:498` 各 310 字符——超 300 限 10）⇒ 就地折行（+2 物理行）；复测本笔两档零新增悬空 / 零新增超宽。基线 = 本席首动作前复测（4 / 21——与 §5 终态 4 / 19 之差 = 并行写域，非本笔）。

**顺带观察（报而不改 · 非本轮射程）**：① `thincoder-core/agent-tools/subagent.mjs:286`（`(§7.2 D3)` 裸形 token · 无日期）——本席复扫时见，判类存疑（或属另族靶档活引）；不在三项射程，交下轮判。② 批档 §2.13 与 §2 各块同段（append-only）——§2 现无「待收正」余项。

**三链同源**：台账 #347 → §2.1-#3 → 设计档 §3.12 / §3.9 J-1（收正后）——不改判据；本块只记执行读数。

**§2.13 补记（同轮补扫 · 报备）**：§3.12 ① 句原有对已退场口径的引述 + 判语（「§3.9 J-1 明定……」——J-1 收正后失据）= 悬引 ⇒ 就地改写为「本条即该面收正轮（读数 = §3.9 J-1 收正行）」（`DOC-DISCIPLINE.md:671`）；销项 / 收口口径段内的引述照留（= 退场对象名 + 携执行态，判非常驻态）——如需全清，父侧明示。零新语义。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审靶** = 4 档（`docs/core/design/PROMPT-SYSTEM.md` · `docs/core/design/prompts/common.md` · `docs/core/design/DOC-DISCIPLINE.md` · 本档 §2）。射程限制：EN 运行面 / 测试档 / 人格档 / TUI 系档 / WEBVIEW 等引用对象不在射程 ⇒ 涉及其内容的断言标 unverified；无文档地图与声明项目标准档 ⇒ Document ownership 判据降级。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 验收判据 | 🟡 | A-DD21 ②（`DOC-DISCIPLINE.md:1151`）与 §2.1-#4 判据（本档 `:38`）要求「A 态位点逐处带限定 / 改引规范句」，而 §2.6（本档 `:78`）把 A 态候选（约 10 行）处置定为「随该档下次触碰……本批不扫」——验收判据与处置口径相抵，按默认射程不可满足（或迫使越射程改动）。 | 二者对齐后再交批：判据限定为「本轮实际触碰的 A 态位点」，或把 A 态收正并入本批射程并同步受影响文件表；在验收表注明该条成立前提。 |
| 2 | 清晰度 | 🟡 | §3.12 规定二态处置表「表体入批档 §2」（`DOC-DISCIPLINE.md:681`），但本档 §2 未含该表（§2.5 只给读数与写域，`:66-69`），① 族行又须「当轮复扫定」（本档 `:67`）——表体落点无着落、填充时点未定；A-DD20 ①（`DOC-DISCIPLINE.md:1141`）「A 类位点零死编号」缺可对照的判类清单 ⇒ 独立复现性不足。 | 明确表体落点与填充时点（以当轮复扫基线为定稿），并让 A-DD20 ① 的判类清单与之同源、可逐行核对。 |
| 3 | 范围 | 🟡 | §3.12 族域含 `docs/**` 非归档面（`DOC-DISCIPLINE.md:675`），而受影响文件表把 ① 族写作面写作「代码 / 测试」（本档 `:91`）、写域路由只覆盖三树注改 / 测试头注与 §3.9 残差块（本档 `:69`）——若复扫出 docs 面 A 类位点，处置无归属，且与 A-DD20 ⑥「清单外零改动」（`DOC-DISCIPLINE.md:1146`）相抵。 | 二者取一：族域收窄到三树（与路由一致），或为 docs 面命中补写域路由与受影响行。 |
| 4 | 受影响文件尺寸标注 | 🟡 | 按本档 §2.7 自报行数（`:90`），三档 >300 行代码档——`thincoder-cli/src/tui/subagent-blocks.mjs` 453 · `thincoder-cli/src/tui/tool-events.mjs` 449 · `thincoder-cli/test/tui-memory-budget.test.mjs` 334——无尺寸档 / 拆分处置（承 §3.9 J-1「不拆 + 理由 + 触发 + 抽取候选线」先例）；① 族档集「当轮复扫定」（`:91`）亦无逐档行数 / Δ 标注。 | 为三档（及 ① 族定稿后的档集）补「不拆 + 理由 + 触发 + 抽取候选线」登记，形态承 §3.9 J-1。 |
| 5 | 验收判据 | 🟡 | #347 ④（§3.9 J-1 残差块销项 / 收口）有口径（`DOC-DISCIPLINE.md:683`）与路由（本档 `:69`），但 A-DD20 六条与 §2.1-#3 判据均未覆盖该交付——完成与否不受验收约束。 | 补一条可核判据（残差块按当轮读数收正 + 携消解路径 / 到期条件、无「另轮 / 待核」常驻态），或注明该交付的验收位置。 |
| 6 | 文档卫生 | 🟡 | 本批新增块所在小节 `PROMPT-SYSTEM.md:310` 的 §10.2 表以「15 对」为题而表内仅 14 行：缺 #13 行（`persona-explore` 对未列），`:326` 空行又把表格断为两段（`:327-328` 失表头）——D3（计数与列表同改）未收口。 | 补齐 #13 行或调整「15 对」计数；修表格衔接（去中断空行）。 |
| 7 | 清晰度 | 🔵 | 落点行号 as-of 漂移：`DOC-DISCIPLINE.md` §3.13 记 `:695` 起（现盘 `:699`）、§5 记 `:1132` / `:1141`（现盘 `:1139` / `:1148`）；`PROMPT-SYSTEM.md` 记 `:329-333` / `:352`（现盘 `:330-334` / `:353`）；§2.7 的 .md 行数（1395 / 426）现盘 = 1410 / 428（本档 `:42-43` / `:85-86`）。 | 引用改以节号为主锚、行号标 as-of 并注浮动口径；落笔前逐处回读。 |
| 8 | 文档卫生 | 🔵 | 「裸形面 = 另轮读数域」被引作「裸形形 = 另轮读数域」——两处笔误（`DOC-DISCIPLINE.md:502`、`:683`），与源表述（同档 `:431`）不符。 | 两处改为「裸形面 = 另轮读数域」。 |

计数：🔴 0 · 🟡 6 · 🔵 2
VERDICT: pass

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 15:29「整体处理」全链授权）：设计（§2 + §2.12 修正块）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡6 / 🔵2——父侧逐条裁定**全数接受**）→ 修正轮 8 条落位（`#60`）→ **父侧抽验通过**（`DOC-DISCIPLINE.md:1147`（A-DD20⑦）· `:1152-1153`（A-DD21② 改述）· `PROMPT-SYSTEM.md:326`（#13 行）· 表体接回——逐项实读）⇒ **批准进入实施**。**CN 四行逐字经主 agent（内容权）确认**（§2.4 逐字为准）。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮，`round=initial`（三族 sweep + CN 落笔 + 机检改指；§3.9 残差块销项 = 设计档笔另轮）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（initial 轮 · 2026-09-25）

**交付摘要（四项）**

1. **#342 CN 四行 + 机检改指**：`docs/core/design/prompts/common.md` `:72` 后**新增一行**（逐字 = §2.4；行数 122 → **123**，零删改）· `thincoder-cli/test/prompts-dual-source.test.mjs` 读点/存在性断言改指**真实 CN 面** `../docs/core/design/prompts/persona-eng-designer.md`（原指 CLI 仓归档副本）· `:13-14` 头注路径收正（`docs/design/prompts/` → `docs/core/design/prompts/`）· 零新增断言。**设计字面偏差（如实）**：§2.4 记的相对路径 `../../docs/...` 在 `read()` 助手（base = `thincoder-cli/`）下解析为**仓外** `teamcode/docs/...` ⇒ 实落 `../docs/...`（同 `readCore` 先例）；意图（读点指真实 CN 面）零变。
2. **② 族 41 行 / 16 档全处置**（设计 14 行 / 10 档 + **同族裸形同指 27 行**，见下）；A-DD20 ② 域内 `TUI.md §15` 串 = **0** ✓。
3. **① 族全量扫处置**（读数见下）——裸形死编号 A 类**逐处**改指 / 改述；B 类（行内时点锚 / 记表面 / 夹具引例）零触碰并登记。
4. **③ 族零触碰零 diff**（`docs/TODO.md` / `docs/TODO-archive.md`）；§3.9 残差块销项 = **设计档笔另轮**（本席未触，按派单）。

**② 族二态处置表（族|档|行|靶（实读）|判类|动作|改后形）**

| 族 | 档 | 行 | 靶（实读） | 判类 | 动作 | 改后形 |
|---|---|---|---|---|---|---|
| ② 带档名 14 行 | `thincoder-core/text-budget.mjs` | `:2` `:9` | `TUI-SESSION-VIEW.md` §5.2 / §5.1（实存） | A | 改指 | `TUI.md §15.3.2`→`TUI-SESSION-VIEW.md §5.2`；`§15.2 表 1`→`§5.1` |
| ② | `thincoder-cli/src/tui/display-budget.mjs` | `:2` `:12` | 同档 §5 / §5.1 | A | 改指 | `TUI.md §15.3`→`§5`；`§15.2 表 1`→`§5.1` |
| ② | `thincoder-cli/src/tui/conversation-writer.mjs` | `:14` | 同档 §5.1/§5.3 | A | 改指 | `TUI.md §15.3.1/§15.3.3`→`TUI-SESSION-VIEW.md §5.1/§5.3` |
| ② | `thincoder-cli/src/tui/key-handler-search.mjs` | `:2` | 同档 §5.1（`SEARCH_MATCH_CAP` 行） | A | 改指 | `TUI.md §15.3.1`→`TUI-SESSION-VIEW.md §5.1` |
| ② | `thincoder-cli/src/tui/subagent-blocks.mjs` | `:103` | 同档 §5.4 | A | 改指 | 同行替换 |
| ② | `thincoder-cli/src/tui/subagent-children.mjs` | `:19` `:126` | 同档 §5 动机注 / §5.3；§5.4 | A | 改指 | `§15.1 事实 3`→`§5 动机注`；`§15.3.3`→`§5.3`；`§15.3.4`→`§5.4` |
| ② | `thincoder-cli/src/tui/subagent-freeze.mjs` | `:15` `:94` | 同档 §5.3 落点表末行 | A | 改指 | `TUI.md §15.3.3 落点表末行`→`TUI-SESSION-VIEW.md §5.3 落点表末行` |
| ② | `thincoder-cli/src/tui/tool-display.mjs` | `:10` | 同档 §5.1 | A | 改指 | 同行替换 |
| ② | `thincoder-cli/src/tui/tool-events.mjs` | `:43` | 同档 §5.1/§5.3 | A | 改指 | 同行替换 |
| ② | `thincoder-cli/test/tui-memory-budget.test.mjs` | `:2` | §5 机制 + 用例宿主 = 本档（§15.6 无承接 ⇒ 改述半） | A | 改指 + 改述 | `TUI.md §15.3/§15.6`→`TUI-SESSION-VIEW.md §5 机制 · 用例宿主 = 本档` |
| ② 同族裸形同指 27 行 | `display-budget.mjs` `:4` `:20` `:45` `:79` `:112`×2 `:169` · `tool-events.mjs` `:50` `:63` `:65` `:103` `:111` `:173` `:272` `:293` `:341` `:348` · `conversation-writer.mjs:34` · `subagent-children.mjs` `:28` `:108` `:135` · `tool-display.mjs:80` · `tool-args.mjs:78` · `cmd-clear.mjs` `:12` `:19` · `cmd-new.mjs:23` · `cmd-session.mjs:121` · `tui-state.mjs:57` | — | 同档 §5.1 / §5.2 / §5.3 / §5.4（逐处实读） | A | 改指 | `§15.3.1`→`§5.1` · `§15.3.2`→`§5.2` 或 `§5.3`（按内容：计长/账→§5.2，清屏/切槽归零行→§5.3）· `§15.3.3`→`§5.3` · `§15.3.4`→`§5.4` |

（② 族**半改风险**故同族裸形同指一并处理——依据 = §3.12 族别口径 ②「靶档无该节 ⇒ 死编号 ⇒ 处置」+ 同档注释块内同指，留裸形即证「半改致歧」，承 hygiene-sweep-3 批先例。）

**① 族二态处置表（族|档|行|靶（实读）|判类|动作|改后形）**

判类口径 = §3.12 族别口径 ②（裸形 token ⇒ 实读靶档）+ §3.8 两分（活面形态句 = A；行内时点锚 / 史实谓词 / 记录面 / 夹具引例 = B）。**复扫读数**（命令见下）：**处置前 299 行 / 90 档**（初筛，含 `§15.x` 项）→ **扣同族裸形（② 族）与项后缀假阳后 = 231 行 / 68 档**（①② 全处置后 A 类零死编号）。

| 族（旧编号 → 现行家） | 档 | 行 | 判类 | 动作 |
|---|---|---|---|---|
| §20.3（abort 站点 → `AGENT-LOOP-SUBAGENT.md` §6.12） | `abort-provenance.mjs` `:19` `:78` `:96` `:111` · `advisor-async.mjs` `:260` `:401` `:419` · `async-settle.mjs:94` · `consult.mjs` `:222` `:467` · `escalate-async.mjs:268` · `subagent-async.mjs:208` · `subagent-run.mjs` `:120` `:179` · `subagent.mjs:74` · `agent.mjs:343` · `key-handler-ctrlc.mjs:36` · `provider/core.mjs:436` · `abort-provenance.test.mjs:140` | A | 改指 `AGENT-LOOP-SUBAGENT.md §6.12` |
| §20 / §20.x（调度 / 补位 / 墓碑 → 同档 §6.9） | `async-settle.mjs` `:238` `:252` `:282` · `panel-blocks.mjs` `:11` `:18` · `subagent-actions.mjs` `:9` `:136` `:166` · `subagent-async.mjs` `:197` `:241` `:280` `:387` · `subagent-run.mjs` `:5` `:102` `:146` `:211` · `subagent-scheduler.mjs` `:105` `:134` `:188` `:274` `:307` `:340` · `subagent-spawn.mjs` `:4` `:224` · `subagent.mjs` `:17` · `render-segments.mjs:82` · `subagent-blocks.mjs` `:41` `:43` `:161` `:180` `:202` · `subagent-freeze.mjs` `:26` `:34` · `subagent-panel.mjs:66` | A | 改指 同档 §6.9 |
| §21.1（停滞 / 序判定 → §6.9） | `subagent-actions.mjs` `:144` `:179` · `subagent-scheduler.mjs` `:162` `:242` `:275` `:277` `:295` | A | 改指 §6.9 |
| §20.9（Module Split Policy） | `subagent-actions.mjs:3` `subagent-async.mjs:12` `subagent-scheduler.mjs:3` | A / B（`:12` 行内带 `2026-09-05` ⇒ B） | 改述（去 `§20.9`，保 Policy 名）/ B 零触碰 |
| §7.2 / §7.2.1 / §7.2.3（relay / 冻结 / 面板 → `docs/cli/design/TUI.md` §6.8） | `dispatch.mjs:386` · `subagent-actions.mjs:468` · `subagent.mjs:389` · `mouse.mjs` `:39` `:137` · `layout.mjs` `:112` `:155` `:215` · `render-conversation.mjs` `:136` `:282` · `render-frame.mjs:271` · `subagent-panel.mjs` `:25` `:46` · `subagent-freeze.mjs` `:74` `:234` · `tool-display.mjs:128` · `tool-events.mjs` `:177` `:206` `:240` | A | 改指 `docs/cli/design/TUI.md §6.8` |
| §11.1 / §11.2（池域 / advisor 门 → `AGENT-LOOP-ASYNC-POOL.md` §6.10） | `completion.mjs:124` · `dispatch.mjs:396` · `record-results.mjs:103` · `run-stages.mjs:207` · `advisor-async.mjs` `:113` `:175` `:188` `:355` `:361` · `advisor.mjs` `:6` `:153` `:171` · `eng.mjs` `:62` `:93` · `subagent-actions.mjs:124` · `subagent-async.mjs` `:7` `:31` `:59` `:256` `:366` `:441` · `subagent-run.mjs` `:67` `:103` · `subagent-scheduler.mjs:399` · `agent.mjs` `:78` `:79` · `subagent-panel.mjs:59` · `suspension-drive.mjs` `:43` `:90` `:146` | A | 改指 `AGENT-LOOP-ASYNC-POOL.md §6.10` |
| §18 族（子代理门 / 任务域授权 / child permission → `AGENT-LOOP-SUBAGENT.md` §6.7.6） | `dispatch.mjs:250` · `family-tools.mjs` `:80` `:158` · `subagent-run.mjs:171` · `subagent-spawn.mjs` `:354` `:388` · `subagent.mjs:242` · `tool-gates.mjs(vsc):102`（§14.4→`ADVISOR-GUARDS.md §5`）· `panel-messages-turn.mjs(vsc)` `:181` `:191` · `permission-gate.mjs(vsc)` `:25` `:94` · `panel-messages.mjs(vsc):33` · `panel-subagent-relay.mjs(vsc):267` · `child-permission.test.mjs(vsc):7` · `child-permission-wiring.test.mjs(vsc):10` | A | 改指 `AGENT-LOOP-SUBAGENT.md §6.7.6` |
| §18.5（零 git → §6.7.4） | `audit-block.mjs` `:74` `:91` · `subagent-spawn.mjs:369` | A（`:90` 带 `2026-09-04` ⇒ B） | 改指 `§6.7.4` |
| §18.7 / §18.13（审计模板 / 预算 → §6.7.6） | `audit-block.mjs` `:12` `:73` `:86` `:96` `:100` | A | 改指 §6.7.6 |
| §18.6（轨迹 → `TRACES.md` §6.1） | `advisor/loop.mjs:161` · `agent.mjs` `:196` `:275` `:368` · `context.mjs:317` · `explore-distill.mjs:101` · `log.mjs:141` · `provider/core.mjs` `:99` `:110` `:279` · `distill.mjs` `:43` `:57` `:64` · `cmd-mcp.mjs:184` · `agent.mjs(vsc):289` | A（`goal.mjs:85` / `config.mjs:83` 带日期 ⇒ B） | 改指 `TRACES.md §6.1` |
| §18.8（评审对象锚 → `AGENT-LOOP-ASYNC-POOL.md` §6.18） | `advisor/messages.mjs:70` · `advisor/run.mjs:97` · `advisor.mjs` `:130` `:186` · `advisor.mjs`(agent-tools) `:99` | A | 改指 §6.18 |
| §18.3（评审池双载体 / 估算器） | `subagent-actions.mjs:82` · `tools/ops.mjs` `:173` `:186` `:231` → `AGENT-LOOP-ASYNC-POOL.md §6.11`；`advisor/compaction.mjs` `:13` `:40` · `advisor-context-budget.test.mjs` `:4` `:86` → `ADVISOR-GUARDS.md §9`；`subagent-observe-send.test.mjs:289` → §6.11 | A | 改指（两靶按题分流） |
| §18.12（路径归一 / 变更文件解析） | `verify.mjs` `:37` `:98` `:108` `:134` · `subagent-actions.mjs:56` | A | 改述（去 `§18.12`，保语义） |
| §19 / §19.x（depth 门族 → §6.7.2） | （本笔未新增；留父侧按 §3.9 J-1 先在册面） | — | 在册（零触碰） |
| §23.3.1（文本额度 → `AGENT-LOOP.md` §6.15） | `run-stages.mjs:260` · `spawn-child.mjs:238` · `elapsed`→`consult.mjs` `:32` `:285` · `escalate-async.mjs` `:30` `:107` `:203` · `subagent-actions.mjs` `:24` `:417` · `async-settle.mjs:158` · `suspension-drive.mjs:330` | A | 改指 `AGENT-LOOP.md §6.15` |
| §23.3.2（seqCache → `TRACES.md` §6.2） | `traces/trace-store.mjs` `:27` `:96` `:135` `:155` | A | 改指 `TRACES.md §6.2` |
| §22（digest 预算 → `AGENT-LOOP.md` §6.14） | `subagent-async.mjs` `:25` `:347` `:360` · `consult.mjs` `:36` `:186` · `async-settle.test.mjs:339` | A | 改指 `AGENT-LOOP.md §6.14` |
| §21 / §21.6（Stop 钩子 → `AGENT-LOOP.md` §6.13） | `hooks-stop.test.mjs` `:6` `:70` `:86` `:99` | A | 改指 `AGENT-LOOP.md §6.13` |
| §25（consult / escalate） | `family-tools.mjs:135` · `suspension-drive.mjs` `:45` `:69` `:75` `:89` · `tool-events.mjs:254` · `run-stages.mjs(vsc):314`→B（带日期）· `suspension.mjs(vsc)` `:119` `:372` `:376` `:390` → `CONSULTATION.md §6.2`；`escalate-async.mjs:93` · `subagent-actions.mjs` `:340` `:383` · `subagent-async.mjs:369` · `tool-events.mjs:235` · `family-tools.mjs`（同）→ `ESCALATE.md §5`；`execute-tools.mjs(vsc):397` → `CONSULTATION.md §6.2` | A | 改指（按题分流两靶） |
| §27 / §27.1（R23 嵌套冻结 / 收尾 → `docs/cli/design/TUI.md` §6.8.2） | `spawn-child.mjs` `:142` `:166` · `subagent-run.mjs:136` · `subagent.mjs` `:351` `:358` `:373` `:381` · `subagent-freeze.mjs:76` | A（`spawn-child.mjs:243` 带日期 ⇒ B） | 改指 §6.8.2 |
| §29 / §29.1（mutation 记账 fix A/B；design token F2*） | `dispatch.mjs` `:374` `:425` · `agency`→`advisor-async.mjs:433` · `advisor-settle.mjs` `:43` `:115` `:212` · `design-token.mjs` `:26` `:110` · `advisor.mjs`(agent-tools) `:188` `:268` · `subagent-spawn.mjs:108` · `messages.mjs:73` · `run.mjs:98` · `advisor.mjs:189` | A（带日期者 B：`messages.mjs:45` · `advisor-async.mjs:132` · `design-token.mjs:16` · `spawn-child.mjs:243` · `agent.mjs:389`） | 改述（去 `§29/§29.1`，保 `fix A/B` / `F2a…F2h` 标签） |
| §14.14 / §14.4 / §14.11 / §14.3（advisor 守卫族） | `dispatch.mjs:219` · `advisor-settle.mjs` `:13` `:78` · `advisor.mjs`(agent-tools) `:212` · `advisor-chain-guards.test.mjs` `:3` `:465` → `ADVISOR-GUARDS.md §5`；`advisor-settle.mjs` `:9` `:143` · `design-token.mjs:86` · `advisor.mjs:273` → `ADVISOR-GUARDS.md §1`；`advisor-settle.mjs:202` · `advisor.mjs:247` · `advisor-chain-guards.test.mjs:2` → 改述 | A | 改指 / 改述 |
| §12.x（relay 前缀文法 / 中止清池族） | `agent/relay-prefix.mjs` `:2` `:6` · `spawn-child.mjs` `:23` `:24` · `subagent-blocks.mjs(tui)` `:18` `:36` `:50` · `tool-events.mjs(tui):29` → 改述；`async-discard.mjs(vsc)` `:2` `:5` `:8` `:12` `:19` `:23` `:89` · `run-stages.mjs(vsc)` `:347` `:349` `:374` `:376` · `setup-tooltable.mjs(vsc)` `:147` `:183` → `AGENT-LOOP-ASYNC-POOL.md §6.20` | A | 改述 / 改指 §6.20 |
| §15（async 取号 / 面板 / abort → `AGENT-LOOP-SUBAGENT.md` §6.7.3） | `run-stages.mjs:245` · `spawn-child.mjs:112` · `escalate-async.mjs:245` · `subagent-async.mjs` `:47` `:119` `:300` `:303` `:354` · `subagent-blocks.mjs(tui):199` · `tool-events.mjs(tui):202` · `subagent-freeze.mjs` `:43` `:56` | A | 改指 §6.7.3 |
| §16（批权限询问 D-B1） | `dispatch.mjs` `:143` `:271` · `tool-events.mjs(tui):368` | A | 改述（去 `§16`，保 `D-B1`） |
| §9 / §10 / §13（旧机制族，按题） | `async-settle.mjs:184` → `§6.9`；`execute-tools.mjs(vsc)` `:19` `:372`（带日期 ⇒ B）；`tool-gates.mjs(vsc):13`（带日期 ⇒ B） | A / B | 改指 §6.9 / B |
| §11.2 / §11.2.1 / §11.1.5（VSC 面状态族） | `agent-state.mjs(vsc)` `:4` `:5` `:20` `:52` `:79` · `agent.mjs(vsc)` `:103` `:104` · `panel-chat.mjs(vsc):56` · `panel-session.mjs(vsc):114` · `agent-lifecycle-singleton.test.mjs(vsc)` `:9` `:197` · `webview-input-history.test.mjs(vsc):7` | A（`:2` / `:13` 等带日期/沿革者 B） | 改述（去旧号，保语义） |
| §14.3.x / §12.2.5（SESSION 旧号） | `cmd-new.mjs:18` · `cmd-session.mjs` `:117` → `SESSION.md §6.14`；`cmd-session.mjs:23` · `session-guard.mjs` `:14` `:20`（→`SESSION.md §6.12①`） | A | 改指 / 改述 |
| §7.7.1 | `prompts-async-guidance.test.mjs:6` | A | 改述（去 `§7.5-§7.7.1`，保其余标签） |
| §24.1 / §24.2 / §23.2（provider 头） | `provider-headers.test.mjs` `:4` `:9` `:68` `:93` `:177` | A | 改指 `PROVIDER.md §6.17` |

**① 族 B 类（零触碰 · 依据）**：行内**时点锚**（日期）⇒ B：`messages.mjs:45` · `advisor-async.mjs:132` · `design-token.mjs:16` · `spawn-child.mjs:243` · `goal.mjs:85` · `config.mjs:83` · `question.mjs:21` · `child-permission.mjs:3` · `audit-block.mjs:90` · `subagent-run.mjs:168` · `subagent.mjs` `:14` `:227` `:275` `:405` · `subagent-async.mjs` `:12` `:454` · `subagent-spawn.mjs:4` · `agent.mjs:389` · `record-results.mjs:19` · `agent-state.mjs(vsc):2` · `execute-tools.mjs(vsc)` `:24` `:110` `:345` · `tool-gates.mjs(vsc)` `:2` `:13` `:73` · `run-stages.mjs(vsc)` `:314` `:366` · `panel-callbacks.mjs(vsc):165` · `panel-messages-turn.mjs(vsc):22` · `permission-gate.mjs(vsc):11` · `suspension.mjs(vsc):52` · `agent.mjs(vsc)` `:103`（同块带日期）; **夹具引例 / 语法示例** ⇒ B：`batch-skeleton.mjs` `:14` `:20`（批次档段号形态示例）· `prompt-refs-zero.test.mjs` `:141` `:154`（测试夹具串 = 引用对象非指针）· `agent-tools-registry.test.mjs(vsc)` `:96` `:101`（剥离夹具说明 / 旧形字面）。

**docs 面清单（只登记不落笔——交父侧派设计席）**

| # | 档:行 | 靶（实读） | 判类 | 建议动作 |
|---|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:185` | 活面判据句末「（合并卡恒 depth-0——**§18 C-1/Q1**）」——`§18` 为该档死编号（child permission gate 归核 `AGENT-LOOP-SUBAGENT.md` §6.7.6） | **A（活面位点）** | 改指 `AGENT-LOOP-SUBAGENT.md` §6.7.6（C-1/Q1）；仅此一处，同档余引述判 B |

**docs 面 B 类（判零触碰 · 依据速记）**：不并项表 / 迁移映射表（`AGENT-LOOP.md:41` `:415` · `PROVIDER.md:405-420` · `TURN-CAP-CONTINUE.md:117-147` · `TRACES.md:129-137` · `WEBVIEW-INPUT.md:141-149` · `PROMPT-SYSTEM.md:263` · `CRASH-REPORTS.md:172`）· 变更记录 / 记表面（`CORE-UNIFICATION.md:1898` · `MODEL-SPECS.md:1918` · `ADVISOR-GUARDS.md:405`）· 变更沿革条目（`ADVISOR-CONVERGENCE.md:321` `:355` · `ESCALATE.md:100`）· 判据示例 / 迁移期引文（`PROMPT-SYSTEM.md:208` · `TESTING.md:409` · `DOC-MIGRATION.md:55` · `WEBVIEW-PROTOCOL.md:331` · `NORMAL-MODE.md:102` `:137` · `ADVISOR-CONVERGENCE.md:151` · `AGENT-LOOP-SUBAGENT.md:175`「旧档 §20」= 史实谓词）· `DOC-DISCIPLINE.md` 本档（`:496`–`:502` J-1 登记块 + §3.12 条文 · 登记面）· `docs/TODO-archive.md`（③ 族·零触碰）。

**域外登记（他族 / 已在册面 · 本笔零触碰）**：`thincoder-core/advisor/**` 余面（§14.x / §16.x 族——DOC-DISCIPLINE §3.11-J-1 在册 37 处 / 6 档；本笔仅处置同档 §18.x/§18.8 AGENT-LOOP 家引证）· `thincoder-core/tools/**`（TOOLS.md 旧号族——在册 23 处 / 8 档）· VSC 面板/驱动族 §12.2.x / §16.x / §7.x（`panel-callbacks.mjs` `:7` `:29` `:168` `:171` `:245` · `panel-messages-turn.mjs` `:181` `:191` 之外的 `:22` 带日期 ⇒ B）· `thincoder-vscode/src/agent/response-stages.mjs`（VSC-DEBT/`§12.5` 族）· `thincoder-core/test/**` 中 MODEL-SPECS/ADVISOR 族旧号（`§13.x`/`§14.x` 等——靶档实存或他族）。消解径同 §3.11-J-1 = 下一产品码注释轮。

**读数与验证（命令 + 结果）**

| 项 | 命令 | 读数 |
|---|---|---|
| 族扫描（自建 screen = docs 标题清单 + 三树 `§` token 分母档判定 + 「同行更早 `*.md` ⇒ 带档名」双向收窄） | `node -e <inline walk>` | 处置前 **299 行 / 90 档**（含 ② 族与项后缀假阳）→ 扣 ② 族 41 行 / 16 档 + 假阳 = **① 族 231 行 / 68 档** → **处置后 A 类零死编号**（余 52 处逐处判 B：日期 44 · 夹具引例 4 · 批次档段号形态示例 2 · 同块带日期 2） |
| ② 族串零命中 | `node -e`（正则 `TUI\.md\s*§15` × 三树） | **0** ✓ |
| ③ 族零命中 | `grep`（`docs/TODO.md` / `docs/TODO-archive.md` 内 `§`） | **0** ✓（两档 `git status` 零现） |
| 机检 | `node scripts/doc-check.mjs` | **悬空 4**（设计轮基线 4 ⇒ 零新增）· **行宽 19**（基线 20 ⇒ 零新增；−1 = 他批）· 用例号悬空 0 · 路径/坐标悬空 3（基线在册）· 符号窄 1（基线在册） |
| 行数守恒 | `git --no-pager diff --numstat`（只读） | 本笔档集**全档 Δ0**；唯一例外 `docs/core/design/prompts/common.md` = `1/0`（+1 行 = §2.4 预定新增）✓ |
| 测试 · cli | `node test/run.mjs` | tests **863** / pass **863** / fail **0** / cancelled **0** ✓ |
| 测试 · core | `node test/run.mjs` | tests **675** / pass **675** / fail **0** / cancelled **0** ✓ |
| 测试 · vsc | `npm test` | tests **997** / pass **997** / fail **0** / cancelled **0** ✓ |
| 专项 | `node --test test/{prompt-refs-zero,prompts-dual-source,prompts-async-guidance,doc-check,tui-memory-budget}.test.mjs` | tests **61** / pass **61** / fail **0** ✓（含「三式域内零命中」常驻锁与 TUI 内存预算族） |
| 越清单 | `git status --porcelain`（本笔落点） | 全落 §2.7 清单（①② 族档集 = 当轮复扫定）+ CN 两档 + 批档；`docs/TODO*` 零现 ✓ |

**披露与偏差（全部如实）**

1. **族读数修正**：设计轮估值 ~60 行 / 20 档 vs 实施轮实测 **231 行 / 68 档**（① 族）——已按 §2 父裁「以本轮实测为准」执行；② 族 14 行 / 10 档 → 实测 **41 行 / 16 档**（含**同族裸形同指 27 行**，零改集追加，防半改致歧）。
2. **§2.4 路径字面偏差**：`../../docs/core/...` 经 `read()` 助手（base = `thincoder-cli/`）解析为**仓外** `teamcode/docs/...` ⇒ 实落 `../docs/core/design/prompts/persona-eng-designer.md`（意图零变，读点仍指真实 CN 面）。**建议设计席回写 §2.4 与 §2.11 表格的路径字面**。
3. **B 类判据补充**（族/判类口径 ⑦ 报备）：**行内时点锚（日期）= B** 适用于**新增站点行**；沿革/注册陈述行（如 `subagent-async.mjs:12` `:454` 式）仍按 A 处置**不改**——本笔对含日期行一律零触碰（保守），未逐处翻案。
4. **§3.9 残差块销项** = 设计档笔（本席未触——派单边界）；本 §5 提供其所需读数（族扫描前后 / 零新增 / 处置量）。
5. **③ 族零触碰**（`docs/TODO.md` / `docs/TODO-archive.md`）；仓根 `.tmp-*` 与 `.thincoder/tmp/**` 垃圾 = 他批遗留（基线 53 M / 55 untracked，本笔零新增）。
6. **未新增任何断言**；CN 面新增仅「一行 = §2.4 逐字」，机检硬编码面按 §2.4 注改指（同批同意）。

**建议收正（交父侧 / 设计席）**：`docs/core/design/DOC-DISCIPLINE.md:502`（本批登记行）与 **§3.12 条目 K** 的 ③ 销项口径按本 §5 读数收正——销项条件（③ 族两档零命中）已满足；裸形面 ①② 族已全处置（A 类零），余面 = B 类（非销项对象）+ 域外族登记（仍在册）。

**审计轮次 1（内部 explore 子代理 · 只读 · 交付前偏离审计）**

- **结论**：② 族（本轮主交付）**处置干净** ✅（三树零命中 + 改后坐标逐处实存 + 语义对位正确）· CN 两档核实 ✅（逐字/行数 122→123/读点/头注/零新增断言）· ③ 族 ✅（两档 mtime + 内容双重证据）· **① 族 ⚠️ PARTIAL**——报 **6 项 A 类残留**（其中 `tool-events.mjs:177/206/240` 属**表-实不符**：§5 表内声明已改、盘上未改 🔴）+ 2 项「域外/待核」。
- **审计另报 3 项域外同缺陷类**（设计域明确排除 ⇒ 本笔零触碰，登记）：`PROVIDER.md §15` 具名系列（config-io/config/config-migrate/model-specs/model-picker/render-frame/advisor-project-context）· `TUI.md §9.xD/§10.6D/§12/§14` 裸形系列（clipboard/cmd-config/math/wizard/attention-state.test/tui-selection-surfaces.test）· `docs/design/TUI.md §6` **路径死引**系列（subagent-*）——后两者归 §2.6 路径形族 / 他批。
- **审计无法复跑项（如实）**：审计装配面无 bash/execute/git ⇒ doc-check 与三包测试**由本席复跑**（读数见下）；审计以行数守恒 + 抽样 25 档「仅节号替换、语义未变」作替代证据（与本席结论一致）。

**自修轮 1（审计发现逐项落盘 · 全部已改）**

| # | 处 | 原形 | 改后 |
|---|---|---|---|
| 1 🔴 | `thincoder-cli/src/tui/tool-events.mjs` `:177` `:206` `:240` | `§7.2.3` | `docs/cli/design/TUI.md §6.8`（首行带档名，同块后续 `§6.8`）——**表-实不符已消** |
| 2 🔴 | `thincoder-cli/src/tui/tool-display.mjs` `:115` `:118` | `§15 D-A1` / `§15 D-A3` | `AGENT-LOOP-SUBAGENT.md §6.7.3 D-A1` / `§6.7.3 D-A3` |
| 3 🟡 | `mouse.mjs:204` · `cmd-eng.mjs:55` · `advisor/messages.mjs:42` · `advisor.mjs:261` · `tools/ops.mjs:187/232` | `§11.2 D-24b` / `§11.2` | `AGENT-LOOP-ASYNC-POOL.md §6.10 D-24b` / `§6.10` |
| 4 🟡 | `agent-turn.mjs:110/140` · `tui-state.mjs:40` · `render-segments.mjs:70` · `render.mjs:245` · `render-loop.mjs:79` | `§7.2 D4/D5/D6` | `docs/cli/design/TUI.md §6.8 D4/D5/D6` |
| 5 🟡 | `thincoder-cli/test/provider-headers.test.mjs:2` | `PROVIDER.md §21–§24` | `PROVIDER.md §6.17` |
| 6 🟡 | `thincoder-vscode/src/agent.mjs:127` | `§15 D-A3` | `AGENT-LOOP-SUBAGENT.md §6.7.3 D-A3` |
| 7 | 同族补扫（审计下界之外的同类残留——自建 screen 复跑逐处实读） | `§16 D-B1`（vsc execute-tools `:43` `:123` · tool-gates `:5` `:55` `:136` · panel-callbacks `:245` · permission-gate `:89` · panel-messages-turn `:203` · child-permission.test `:273`） | 改述（去 `§16`，保 `D-B1`） |
| 8 | 同上 | `§9 D-24b` / `§15` / `§12.3 C-8`（vsc run-stages `:150` `:163` · panel-messages-turn `:66` · suspension `:12` `:37` `:68` `:118` `:341` `:369` `:371`） | `AGENT-LOOP-ASYNC-POOL.md §6.10` / `AGENT-LOOP-SUBAGENT.md §6.7.3` / `§6.20` |
| 9 | 同上 | `§16 D-B1`（cli key-handler `:47` · key-modes `:37`） | 改述 |
| 10 | 同上 | `§11.2` / `§11.2.1` 槽字段面（vsc panel-chat `:56` · panel-session `:114` · settings `:206` · cli cmd-config `:253` · agent-lifecycle-singleton.test `:5` `:7` `:366`） | 改述（去旧号，保语义） |
| 11 | 同上 | `§14.14 E-4`（`review-facts.mjs:16`）· `§14.4`（advisor-chain-guards.test `:221`） | `ADVISOR-GUARDS.md §5 E-4` / `§5` |
| 12 | 同上 | `需求 v2 §9.1`（`agent/setup-reminders.mjs:66`） | 改述（去死号，保「需求 v2」） |
| 13 | 同上（同档邻接死路径，如实披露） | `docs/design/TESTING.md`（`prompts-dual-source.test.mjs:6`） | `docs/core/design/TESTING.md`（与本笔 `:13-14` 同批改指同源） |
| 14 | **回退 1 处误改** | `thincoder-vscode/src/agent/tool-gates.mjs:13`（行内含 `2026-09-15` ⇒ **B 类应零触碰**——自修中一度误改） | 已逐字还原（B 类纪律复归） |

**自修后读数（复跑）**：family-token 复扫（无日期、无档名者）**余 22 行**——逐处判**非本族**（ACP `§11.2/§11.3/§11.4/§11.5/§11.7/§12.7/§12.8` 活引 · MODEL-SPECS 族 `§11.2/§13.4/§9.x` · TUI-INPUT-BOX `§7.2/§7.3/§7.5` 活引 · WEBVIEW 族 `§12/§13/§14` · 其他批测试档）⇒ **① 族 A 类 = 0**（AGENT-LOOP 文档族：四档 + derived homes 全覆盖）；② 族串仍 **0** ✓；**三包测试复跑全绿**（cli 863/863 · core 675/675 · vsc 997/997）✓。

**待父侧裁决（审计提出 · 本席不自裁）**：**族域口径张力**——§2.12 #3「族域零收窄、零扩射程」与 §5「域外登记（他族 / 在册）」并置。本席口径 = ① 族限**旧 AGENT-LOOP 文档族**（`AGENT-LOOP.md` / `AGENT-LOOP-SUBAGENT.md` / `AGENT-LOOP-ASYNC-POOL.md` / `TUI.md` + derived homes `TRACES.md` / `CONSULTATION.md` / `ESCALATE.md` / `ADVISOR-GUARDS.md` / `PROVIDER.md` / `SESSION.md` / `TUI-SESSION-VIEW.md`）；`thincoder-core/advisor/**` §14.x/§16.x（DOC-DISCIPLINE §3.11-J-1 明确**在册** 37 处 / 6 档）· `thincoder-core/tools/**` TOOLS 旧号（在册 23 处 / 8 档）· VSC 面板族 §12.2.x/§14.x = **他族** ⇒ 域外。若父侧裁定按「三树全」读，本席可续扫（域外族坐标已由审计给出，续轮工作量可估）。

**评审轮次 1（内部 advisor · type=code · 同步 · 交付前自评审）**

- **VERDICT: pass**（无 🔴；3 条 🟡 均**非 must-fix**（可选 / 登记类）；3 条 🔵 不阻断）。
- **评审已核实（逐处实读回读）**：CN 四行逐字 + 位次 ✓ · 机检读点/头注/存在性断言 ✓（`../docs/...` 仓内可解析，§5 披露的路径字面偏差**属实且正确**）· ② 族三树 `TUI.md §15` = **0** 且改后靶节（`TUI-SESSION-VIEW.md` §5.1–§5.4）实存且语义对位 ✓ · ① 族改指逐靶实存（`AGENT-LOOP-SUBAGENT.md` §6.7.x/§6.9/§6.12/§6.21/§6.29.x · `AGENT-LOOP-ASYNC-POOL.md` §6.8/§6.10/§6.11/§6.18/§6.20 · `AGENT-LOOP.md` §6.13–§6.15 · `TRACES.md` §6.2 · `PROVIDER.md` §6.17/§6.20 · `SESSION.md` §6.12/§6.14 · `ADVISOR-GUARDS.md` §5 · `CONSULTATION.md` §6.2 · `ESCALATE.md` §5 · `TUI.md` §6.8/§6.8.2）✓ · 行为零变（唯二非注释改动 = CN +1 行 + 测试读点）✓ · B 类纪律与披露一致（含 `tool-gates.mjs:13` 已逐字还原）✓。
- **评审留项（均标「非 must-fix」· 交下一轮登记面）**：① `ADVISOR-GUARDS.md §5 E-4/E-7/E-3d` 子 id 在靶档不可解析（只存于归档面 `thincoder-cli/docs/_archive/design/ADVISOR-CONVERGENCE.md`）——建议去 id 或登记 id 族映射（同形先例 `D-24b` 亦不在靶档）· ② `SESSION.md §6.12①` 子标不可解析（该节 bullet 无编号）· ③ `advisor-chain-guards.test.mjs:5` 三重死引（`docs/design/` 路径死 + §14.x 节死 + id 死）未入 §5 域外登记 ⇒ **登记缺口**（该族已声明他批）· 🔵 `docs/design/TUI.md §6` 路径死引系列 / `PROVIDER.md §15` 节死族（审计已披露）/ 全 scope >300 行档尺寸面（R3 不升级；本轮 Δ0）。
- **评审限制（如实）**：advisor 无执行 / VCS 工具 ⇒ 依赖 git 的验收项（③ 族零 diff / 行数守恒 / 清单外零改动）与三包测试复跑**未独立复跑**（以静态等价物核验：靶节实存回读 · 档读数对账 · CN 逐字比对）。

**终态：clean**（审计轮 1 = PARTIAL → 自修轮 1 全落盘 → 复扫 ① 族 A 类 0 / ② 族串 0 → 三包测试复跑全绿 → 评审轮 1 = pass，零 must-fix；修正轮上限 5 未用）。未决项 = 上列「评审留项」（登记类，非阻塞）+ 待父侧裁定的**族域口径张力**（§2.12 #3 vs §5 域外登记）。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#63`（内部审计 1 轮〔② 族干净 / ① 族 PARTIAL → 自修 14 项含 B 类误改回退〕+ 代码评审 1 轮 **pass**〔0🔴 · 3🟡 非 must-fix · 3🔵〕）+ 设计收正轮 `#67`（J-1 销项 + 改指 + §2.13）。
- **本席复核（读盘抽验）**：① 族 **231 行 / 68 档**处置（复扫 A 类 = 0）· ② 族 **41 行 / 16 档**（`TUI.md §15` 串 = 0）· ③ 族零 diff ✓；CN `common.md:73` +1 行（逐字 = §2.4）✓；`DOC-DISCIPLINE.md:429-432` J-1 收正 + `:506-507` 收口判据三条对位 ✓；`WEBVIEW-PROTOCOL.md:185` 改指（靶节先核）✓。
- 读数：三树 **863/863 · 675/675 · 997/997** 全绿；专项 61/61；doc-check 相对基线零新增（绝对读数含并发写者噪声——按相对判）。
- **观察登记（携消解路径）**：`DOC-DISCIPLINE.md:1170`（历史批验收块内「另轮读数域」引述——指针落点已收正、照留；随该档下次触碰全清）。
- 披露（认可）：§2.4 字面回写（`../docs/` = 实落形，入 §2.13）· 族域裁定（① 族 = AGENT-LOOP 族〔准 `#63` 口径〕；另族余面另册）· 评审 3 🟡 留项另册。

**收口**：§1 置「已收口」· 记录冻结；台账 #341 / #342 / #347 / #349 → 待核销 → 已核销；designToken 消费（链终止）。
