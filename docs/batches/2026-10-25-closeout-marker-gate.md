# 2026-10-25 · 轻通道核销机械门：收尾链待跑标记未清 ⇒ 拒核销
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 用户 2026-10-25 09:17 裁定：轻通道核销前机械检测——「可以，看来还不得不做这一步」。实证：同日三轮轻通道未跑收尾评审即核销（stale-runner-refs · operand-count-sync · acceptance-subset），「收尾未落 ⇒ 不许核销」只是纪律句、无机械门，被钻空。。
> 台账 = #1780（LIGHT-CHANNEL · 归批）。前情 = 2026-10-25-acceptance-subset.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（全链——新机制）

**需求（用户 2026-10-25 09:17 裁定，原话「可以，看来还不得不做这一步」）**：

轻通道轮次行核销前，机械查标题里的「收尾链待跑」标记——**标记在 ⇒ 拒核销**。现在这条是纪律句（`LIGHT-CHANNEL.md` §2.5「前置 = 纪律句，非机械门」），同日三轮实测被钻空（三轮核销时收尾评审都没跑）。

**需求五元素**：

- **模块目标**：给「收尾未落 ⇒ 不许核销」一条机械牙——核销时标记还在，就拦住，不再靠自觉。
- **功能点**：`ledger close`（→ 已核销）时查行标题是否含「收尾链待跑」；含 ⇒ 拒，报错说明为什么。
- **边界**：只拦标题带标记的行；不带标记的行照常。不查批档内容、不查评审是否真跑——标记的存在与否就是判据（父侧清标记 = 收尾跑完的声明，这个声明的责任在父侧）。
- **验收**：构造一行带标记的台账行，`close → 已核销` 被拒且报错含「收尾链待跑」；去掉标记后再 close 通过。
- **依赖**：`thincoder-core/ledger-cmd.mjs` 的 close 路径（单行落笔）；设计档 `docs/core/design/LIGHT-CHANNEL.md` §2.5 同步（纪律句升机械门）。

**设计档落点**：`docs/core/design/LIGHT-CHANNEL.md` §2.5（纪律句原位升级——「前置 = 纪律句，非机械门」改机械门）；需求档 `docs/core/requirements/LIGHT-CHANNEL.md` §2.5 同拍。

**注意**：本批同时欠一笔旧账——三轮轻通道（stale-runner-refs · operand-count-sync · acceptance-subset）的收尾评审补跑（advisor 评审已在飞，见 §4）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初版一轮落成——机检门存量段太长 33 处待父侧裁定（§2 上抛项 3））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

- **覆盖**：台账 #1780（LIGHT-CHANNEL · 归批）——核销标记门一件：轻通道轮次行核销前置由纪律句升格为机械门。
- **明确不在本批**：三轮旧账（stale-runner-refs · operand-count-sync · acceptance-subset）的收尾评审补跑（§1 注意项——advisor 评审已在飞，父侧自理）；需求档判定句补登（需求档 = 父侧写权——见上抛项 1）；三设计档存量段太长 33 处（机检基线——见上抛项 3）。

### 设计档落点

- `docs/core/design/LIGHT-CHANNEL.md`：§2.5 原位重写（纪律句 → 机械门——机制本体全件在此）∥ §1 设计原则 ②③ 随动 ∥ §3 咬合处置「台账生命周期」行随动 ∥ §4 验收映射 +⑩ ∥ §5 边界随动 ∥ §7 +K22 ∥ §8 集成 delta（= `none`，理由在档）。
- `docs/core/design/LEDGER.md`：§3 收口两源块 +核销标记门句（含拒文逐字——该机检断言面的家）∥ §3.1 判序句补标记门环。
- `docs/core/design/PROMPT-SYSTEM.md`：§6 K3 行标记坐标格随动（`agent/light-round.mjs:25` → `ledger-db.mjs` 单源）。

### 机制设计（一句话 + 指针）

凡把行写入 `已核销` 的台账动作（close 单行 ∥ close --batch ∥ update 迁移三径），结果行标题携「收尾链待跑」⇒ 机械拒；判据只认标题标记（不查批档 ∥ 不查评审实跑）。机制本体、门径判序、拒文逐字、标记单源迁址、用例表 M1–M6、受影响文件表 = `docs/core/design/LIGHT-CHANNEL.md` §2.5——§2 只引不抄（D2）。

### 受影响文件与测试覆盖

- 产品码 4 档（`ledger-cmd.mjs` ∥ `ledger-db.mjs` ∥ `ledger.mjs` ∥ `agent/light-round.mjs`）+ 工具描述 1 档（`tool-docs/ledger.md`）+ 提示词 1 档（`persona-engineering.md`——逐字 EN 在 design §2.5）+ 单元测试档 1 档（新）——逐档现量 / Δ / tier = design §2.5 受影响文件表。
- 测试覆盖 = 单元测试档 `docs/batches/2026-10-25-closeout-marker-gate.test.mjs`（M1–M7 = design §2.5 用例表 + 迁址回归；随批删除——测试纪律）；集成面 = `none`（判据 = design §8 末段——两维均未触及）。

### 验收对照（回指批档 §1 五元素之验收条）

| # | 需求验收 | 判据（机检形） |
|---|---|---|
| ① | 携标记行 `close → 已核销` 被拒、报错含「收尾链待跑」 | 用例 M1（`node --test docs/batches/2026-10-25-closeout-marker-gate.test.mjs`） |
| ② | 去标记后再 close 通过 | 用例 M2（同档） |
| ③ | 设计增量——迁移径 ∥ 批量径 ∥ 撤回径同判（K22） | 用例 M3–M5（同档） |
| ④ | 不带标记的行照常（需求边界句） | 用例 M6（同档） |

### 关键决策

= design §7 K22（全三径同门 ∥ 判据只认标题标记 ∥ 标记单源迁 `ledger-db.mjs`）——理由原文在档，§2 不复制。

### 上抛项

1. 〔父侧 · 需求档笔〕批档 §1「需求档 `LIGHT-CHANNEL.md` §2.5 同拍」指针不符——需求档 §2.5 = F-LC5 代码笔通路；核销前置内容住需求档 §2.3 F-LC3（「收尾全链未落 ⇒ 不许核销」）。建议：F-LC3 补判定句（机械门形）+ 需求档 §4 验收 +⑩——需求档 = 父侧写权，本席未动。
2. 〔父侧 · 设计扩展点——请明示确认〕需求功能点原文只点名 `ledger close`；设计把同一判据加到 **update 迁移径**（迁移表内 `待核销 → 已核销` 是合法边——不门即留同类旁路）与**批量径**（落 `skipped` 逐行点名）。需求边界句（只拦携标记行 ∥ 不查批档 ∥ 不查评审实跑）零破。若不认可，裁后走修正轮收窄。
3. 〔父侧 · 机检基线〕`doc_check` 报告态基线（本席落笔前实跑）：三档存量段太长 33 处（LEDGER.md 26 ∥ LIGHT-CHANNEL.md 7 ∥ PROMPT-SYSTEM.md 0）——交付门整档判 ⇒ 本批 gate 将 REFUSED 于存量段。逐段改写 33 处超本批射程（他席所拟语义面），请父侧裁定处置。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 核销标记门增量（设计 `docs/core/design/LIGHT-CHANNEL.md` §2.5 ∥ K22 ∥ §4 ⑩ ∥ §8 尾段；`docs/core/design/LEDGER.md` §3 核销标记门块；需求 `docs/core/requirements/LIGHT-CHANNEL.md` §2.3 机械门句）。三档全读。

核查通过面：需求覆盖（F-LC1–6 ∥ 验收①–⑨ + ⑩ 映射全在档，§4 表逐行可核）；可行性（判序与 LEDGER §3.1 既有判序链一致——LIGHT-CHANNEL.md:86 ⇔ LEDGER.md:162；标记单源迁址两档同述——LIGHT-CHANNEL.md:88 ⇔ LEDGER.md:147）；方法学（设计档在场、受影响文件表现量 + Δ + tier 判定俱全，`.md` 档豁免形正确）；清晰性（拒文逐字、判序、用例 M1–M6 正常/边界/错误齐备）；6b 分支出处（K22 引同日三轮收尾评审未跑即核销实证 + 用户裁定原话）；先例行在场（:97）；勘察行在场（:99——`index.publicRepos: []` 无公开源）；新名三问在场（:93–95）；集成测试设计 §8 从 RTM 出发（:390——`thincoder-cli/test/RTM.md` 实读 5 节 15 例，逐行对账后判 `none`，理由 = 组件交互零改 + 拒放行走既有工具拒文通道，合规）；验收 = 改动面单元测试档读数（§4 ⑩——非全套件）。限制声明：无项目标准档、无文档地图（ownership 按 AGENTS.md 结构判——主题拥有档放置正确）；评审范围限三档，受影响表行数无法对源文件抽查（unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（验收口径协调项） | 🟡 | 设计 §4 ⑩（核销标记门验收行）已登场并自注「需求档判定句补登 = 父侧笔」（docs/core/design/LIGHT-CHANNEL.md:314），但需求档 §4 验收清单止于 ⑨（docs/core/requirements/LIGHT-CHANNEL.md:97-100）——需求侧补登是设计已声明的待办，属协调项非缺陷 | 需求档 §4 补登 ⑩ 行（或等效判定句），与设计 §4 ⑩ 对齐 |
| 2 | Clarity（体量口径划界） | 🟡 | 文件体量阈值两档表述不一致：设计受影响表称「低于 500 硬线（ENGINEERING-MODE-V2.md:647）……超 300 软线」（LIGHT-CHANNEL.md:105；§2.9 表 :254 同口径），LEDGER.md §3.5 口径 = 500 顾问线 ∥ 800 硬线（AGENTS.md）+ 650 拆分触发（BATCH-RECORD §4.18）（LEDGER.md:366, :373）。ENGINEERING-MODE-V2.md:647 在评审范围外，300/500 是否为一组有界独立口径 unverified；本案各文件最高 ~443 行，两种口径下「不拆」结论一致，无相抵后果 | 核实 ENGINEERING-MODE-V2.md:647 的 300/500 与 AGENTS.md 500/800 的管辖面划分，在任一档登记「两口径管辖面」式划界句（体例先例 = LEDGER.md:373） |
| 3 | Document ownership | 🔵 | 核销标记门拒文逐字串双份登记：LIGHT-CHANNEL.md:89 与 LEDGER.md:146 逐字一致，且 LEDGER.md:144 已声明「判据单源 = LIGHT-CHANNEL.md §2.5」——现状无矛盾，逐字契约双份有漂移风险 | LEDGER §3 拒文行可改为回指单源（档内既有体例 = LEDGER.md:707「失败文案（单源 = §6.1，本节不另立）」） |
| 4 | 数值漂移 | 🔵 | `agent/light-round.mjs` 现量两处读数不同：LIGHT-CHANNEL.md:108 = 67 行（实读 2026-10-25），LEDGER.md:571 = 66 行（早先批次登记）——读数日不同且期间有增量，非矛盾；未对源文件复核（范围外，unverified） | 无需动作；登记备查 |

计数：🔴 0 ∥ 🟡 2 ∥ 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**状态行**：已批准 2026-10-25（用户原话「批准」——批准即实施启动，FR32）

**批准范围**：核销标记门全件（§2 设计）——三径同门（close 单行 ∥ close 批量 ∥ update 迁移）· 判据只认标题标记 · 撤回不拦 · 标记单源迁 `ledger-db.mjs` · 提示词/工具说明各一句 · 单元测试档 M1–M6。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-25（三径同门 + 单源迁址 + 提示词面 + 单测 7/7；审计 1 轮零实偏、评审 1 轮 pass，终态 clean）



### 实施记录（eng-coder · 2026-10-25）

**交付摘要**：核销标记门三径同门落地——`applyRowClose`（`ledger-cmd.mjs`：源态判后、值计算前，判行标题）∥ `applyRowUpdate`（迁移表判后、executor/evidence 值计算前，判结果标题 `patch.title ?? row.title`），携「收尾链待跑」⇒ 拒（拒文逐字 = design §2.5），撤回不拦；批量两径共函数自然覆盖、拒落 `skipped` 逐行点名。`ROUND_MARKER` 单源迁 `ledger-db.mjs` 常量区（与 `PENDING_STATUSES` 同栏），`ledger.mjs` re-export 增名，`light-round.mjs` 删本地常量经既有动态 import 解构（W8 零新静态边——grep 活码面零第二份定义）。提示词面两档同拍：`persona-engineering.md:226`（design 逐字 EN）∥ `tool-docs/ledger.md` close 条 +1 句、update 条 +半句。

**受影响文件**（实改 7 档，全部在设计受影响文件表 ∪ 父裁落点内）：`thincoder-core/ledger-cmd.mjs`（431→443）∥ `ledger-db.mjs`（266→271）∥ `ledger.mjs`（159→159，行内增名）∥ `agent/light-round.mjs`（67→64）∥ `tool-docs/ledger.md` ∥ `prompts/persona-engineering.md` ∥ 单测档 `docs/batches/2026-10-25-closeout-marker-gate.test.mjs`（新，130 行）。表外改动 = 零。

**决定与偏差披露**：

| # | 项 | 处置 |
|---|---|---|
| 1 | 单测档落点：设计表 :111 = `thincoder-core/test/…`，与 runner 分层批（56e8d898）SC-1 机械门 + `TESTING.md:122` 状态裁决冲突 | 上抛 → 父裁落 `docs/batches/`；写门再拒裁定字面档名（伴随档须与绑定批档同名），落 `2026-10-25-closeout-marker-gate.test.mjs`——档名二裁 **[上抛·待裁]**（已发 ask；advisor 同标 🟡 实质满足） |
| 2 | M7 迁址回归例（设计用例表 M1–M6 外增补） | 已声明：M1–M6 不触 `lightRoundOpen` 消费面，缺本例迁址破闸无哨兵；头注 :11-12 在档 |
| 3 | 设计档 `LIGHT-CHANNEL.md:111` 落点行现仍读旧值 | **[上抛·知会]** 收正 = 父侧笔（父已认领）；批档 §2 :49/:55 验收表同滞（父侧收口一笔） |
| 4 | `assert.throws` 不回传错误对象（Node 24 实测）∥ `ledgerUpdate` 回执只携 `id` | 实施轮自修两处测试写法（`capture` helper ∥ 改读行态）——测试件内部写法，零产品码影响 |

**审计与评审轮次**：explore 偏离审计 1 轮——零实偏（唯一出入 = 披露 #1，父裁在先）；advisor 代码评审 1 轮——pass（🔵 M7 `id=1` 硬编码 ⇒ 同轮修复为捕获 `ledgerAdd` 回传值；🔵 批档 §2 验收表滞后 ⇒ 转父侧；🟡 档名 ⇒ 披露 #1 上抛）。修复后复跑 7/7 绿。**终态 = clean**。

**测试行**：① 单测档 = `docs/batches/2026-10-25-closeout-marker-gate.test.mjs`（M1–M6 = design §2.5 用例表 + M7 迁址回归）；读数 = `node --test docs/batches/2026-10-25-closeout-marker-gate.test.mjs` ⇒ tests 7 ∥ pass 7 ∥ fail 0（2026-10-25 实跑两轮——修复前 M1/M3 红于测试写法、修复后全绿）。② 集成面 = `none`（判据 = design §8 末段——组件交互零改 + 拒放行走既有工具拒文通道，非集成测试验证面）。

## §6 验证与收口（父代理）

## 验证与收口

**实施验证**（父侧亲跑）：`node --test docs/batches/2026-10-25-closeout-marker-gate.test.mjs` ⇒ tests 7 · pass 7 · fail 0。

**评审链**：设计评审 #12 pass（0🔴 2🟡——🟡① 需求档 ⑩ 已补 · 🟡② 体量口径划界已登记 #1782）；eng-coder 内部代码评审 1 轮 pass（🔵 M7 硬编码同轮修复）。

**修正轮**：两处落点收正（设计档 `LIGHT-CHANNEL.md:111` + 批档 §2 :49/:55 旧落点 `thincoder-core/test/…` → `docs/batches/2026-10-25-closeout-marker-gate.test.mjs`）——eng-coder#14 上抛、父侧裁定并收正。

**测试行**：① 批内单测档 `docs/batches/2026-10-25-closeout-marker-gate.test.mjs`（130 行，M1–M7），验证 = 核销标记门三径同判，命令 = `node --test docs/batches/2026-10-25-closeout-marker-gate.test.mjs`，结果 = 7/7 绿（收口即删）。② 集成集现量 15 例 / 窗口 50–100，本批增删 0（集成面 = none——判据 design §8 末段）。

**核销**：#1780（本批条目）· #1783（落点修正——同轮已落）。
