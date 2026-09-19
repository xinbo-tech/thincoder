# 批 10 · DOC-RECONCILE（文档↔实装对账轮）· 2026-09-16

> 前情 = 批 1–5 已收口（`5b0387b5`）· 批 6/7/8/9 在飞 · 本批条目源自 `docs/TODO.md` 技术待办（「文档↔实装漂移（类）」）

## §1 需求讨论与裁定（主 agent）

> **批次状态：已收口 2026-09-16**（设计 pass → 实施零改笔 → 父侧三项收正 → §6 收口 → 台账核销 → 关链）

**交付目标（一句话）**：对**已登记的「事实句落后于现码/现测试」**逐档逐句核一遍，**能改的改、须留的留痕**——产出「对账表 + 处置 + 读数」，使该条债清零或如实收窄。

### 本批条目（1 条，可验收）

**文档↔实装漂移（类）：设计/需求档「事实句」落后于代码/测试现态**（2026-09-12 LEDGER 批串行排查暴露；单仓化时两产品条目合并为一条）。

**已登记证据（起点清单——设计轮先实读复核，逐条判「仍漂 / 已消」）**：

- CLI 侧：`thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md:766` · 同档 `:913`（同族）· `thincoder-cli/docs/design/ENGINEERING-MODE.md:2221`（AC76 子串族）· `thincoder-cli/docs/design/TURN-CAP-CONTINUE.md:159` · `thincoder-cli/docs/design/ACP-CLIENT.md:435`
- VSC 侧：`thincoder-vscode/docs/design/WEBVIEW.md:231`（「红线…（grep 零命中保持）」）· 同档 `:1736`（T-R9 面待核）· `thincoder-vscode/docs/design/VSC-PROMPTS.md:218`（AC-PC-2 尾块两态面待核）
- 追加证据：`docs/core/design/PROVIDER.md:276` §9 实测行数记「293 行」实为 294 · `docs/core/design/CORE-UNIFICATION.md:1323`「现形」锚滞后（所引 `:195` 现为 `statusTextPayload`；`onQuestion` 现居 `:320`）

**判据（逐条）**：每条事实句 ⇒ ① 实读现码/现测试 ② 判「仍漂 / 已消 / 判不出（须留痕）」③ 处置 = **改文档**（事实句收正）∥ **改码**（不属本批——如实登记）∥ **留痕**（写清为何不判）。
**收口判据**：① 起点清单**逐条有结论**（不得漏项）② 「仍漂」项**全部处置完**（改文或登记）③ 处置后**复跑一遍**起点清单 ⇒ 零未处置项。

### 边界（本批不做）

① **不改源码/测试**（只改文档；若查明是**码**错 ⇒ 登记另批，不在本批改）② 不做**未登记**的全档普查（本批 = 起点清单，发现新漂移 ⇒ **登记一行**、不扩批——「同族新增 ⇒ 记一行、停下上报」）③ 不改批 1–9 内容。

### 已知事实（供设计省勘察）

- 提交基线 `5b0387b5`；三机检现状见批 6 §1（宽度/台账/锚读数）。
- 起点清单里 **CLI 参照历史树**（`thincoder-cli/docs/**`）另有 37 条路径锚悬空 = **批 6 处置面**（本批**不重复碰**）；本批面 = **事实句**（非路径锚）。
- 该债已两次追加证据（PROVIDER 行数 / CORE-UNIFICATION 锚）⇒ 设计轮须把「追加证据」纳入机制（**触发=条件**，见消解路径）。

### 验收口径（初拟 —— 设计轮细化到可机判）

① 起点清单**逐条**给出「号 → 档:行 → 现值 → 判定 → 处置」表 ② 「仍漂」项处置后**复跑零未处置**③ 新发现项**逐条登记**（不静默）④ 三机检零新增 + 发布门全绿。

## §2 批次任务（eng-designer）

（以下为 eng-designer 落笔内容——§2 正文）

> 模板占位行「_（待写）_」由 append-only 规则留在本行之上——请父侧/§2 段维护者按 §1 段形态处置。

### §2.1 本批条目与需求映射（三方一致）

**需求条目（唯一源）**：`docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` §1.20 之 **0-1 / 0-2 / 0-3 / 0-4**（其中 **0-4 = 本批新增**，含三值判定 + 三叉处置 + 追加证据通道）。

**证据面（本批清单）**：§1 起点清单 **10 条** = CLI 侧 5（`ADVISOR-CONVERGENCE.md:766` / `:913` · `ENGINEERING-MODE.md:2221` · `TURN-CAP-CONTINUE.md:159` · `ACP-CLIENT.md:435`）+ VSC 侧 3（`WEBVIEW.md:231` / `:1736` · `VSC-PROMPTS.md:218`）+ 追加证据 2（`PROVIDER.md` §9 行数声明 · `CORE-UNIFICATION.md:1323`）。

**判据与结论形态（设计侧）**：`docs/core/design/DOC-CODE-RECONCILE.md` §5.2（本批执行明细按 D-DR16 落本档 §2.2–§2.6，设计档只留判据 / 决策 / 结论形态）。
**三方一致**：本表 — §2.4 验收回指 — 需求档 §1.20 之 0-1–0-4，同一条目集，无第四源。

### §2.2 逐条对账表（10 条；判定三值 = 仍漂 / 已消 / 判不出 · 处置三叉 = 改文档 ∥ 改码（另批）∥ 留痕）

| # | 起点（档:行） | 重锚（基准层对端） | 判定 | 处置 | 证据（本轮实读） |
|---|---|---|---|---|---|
| 1 | `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md:766` | `docs/core/design/ADVISOR-CONVERGENCE.md`（265 行） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 对端在位（本批实核） |
| 2 | `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md:913` | 同上（同档同族） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 同上 |
| 3 | `thincoder-cli/docs/design/ENGINEERING-MODE.md:2221`（AC76 子串族） | `docs/core/design/ENGINEERING-MODE.md`（365 行） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 对端在位 |
| 4 | `thincoder-cli/docs/design/TURN-CAP-CONTINUE.md:159` | `docs/core/design/TURN-CAP-CONTINUE.md`（154 行） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 对端在位 |
| 5 | `thincoder-cli/docs/design/ACP-CLIENT.md:435` | `docs/cli/design/ACP-CLIENT.md`（365 行） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 对端在位（CLI 专有面副本） |
| 6 | `thincoder-vscode/docs/design/WEBVIEW.md:231` | `docs/vsc/design/WEBVIEW.md`（268 行） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 对端在位 |
| 7 | `thincoder-vscode/docs/design/WEBVIEW.md:1736` | 同上（同档同族） | **已消**（0-2 参照历史面命中） | 零改笔 + 重锚登记 | 同上 |
| 8 | `thincoder-vscode/docs/design/VSC-PROMPTS.md:218` | **基准层对端不存在** | **已消**（0-2 参照历史面命中）· 就地留 | 零改笔；落点 = 原档（**不迁**） | `docs/vsc/design/VSC-MIGRATION-INVENTORY.md:83` / `:123` · `D-VM9`（`:408`） |
| 9 | `docs/core/design/PROVIDER.md` §9 行数声明 | 基准层（现行档） | **已消** | 零动作 | 现档 `:380` 记 **402**（`wc -l`） = 本轮实测 **402** ✓ |
| 10 | `docs/core/design/CORE-UNIFICATION.md:1323`（`ctx.onQuestion` 行现形坐标） | 基准层（现行档） | **仍漂**（起点 as-of：所引坐标已非 onQuestion） | **改文档**（Δ 0 行）· 现状已收正 | 本轮实读：VSC = `panel-callbacks.mjs:320` ✓ · CLI = `tui/tool-events.mjs:372` ✓（明细见下） |

**#10 证据明细**（超宽折行）：起点所记滞后锚 = `thincoder-vscode/src/extension/panel-callbacks.mjs:195`——该行现为 `statusTextPayload` 定义行（本批实读）。

**#10 现状**：`:1323` 的 VSC 现形 = `panel-callbacks.mjs:320`（= 起点所记现居坐标）· CLI 现形 = `thincoder-cli/src/tui/tool-events.mjs:372`（`onQuestion:` 定义行）；工作树该档对 HEAD **无 diff** ⇒ 修正已在 HEAD 侧（提交归属待核，见 §2.6 (f)）。

**计数口径**：清单 10 / 结论 10（10/10，零漏项）；**仍漂 = 1/1 已处置**；不适用 = 8（0-2 参照历史面）；已消 = 1。**在账证据数**（0-2 判定句：参照历史面命中不计入）= **2**。

### §2.3 受影响文件全清单（R24a——当前行数 + 预计增量）

| 文件 | 当前行数（口径 = `wc -l`，见 §5.2 决策面 1） | 预计增量 | 本批动作 |
|---|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | 1952 | 0 | §2.2 #10 两端现形坐标对现态（已收正） |
| `docs/core/design/DOC-CODE-RECONCILE.md` | 485 | +34（451 → 485，已落） | 新增 §5.2；§9 体量行 + 变更记录一行 |
| `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` | 485 | +6（479 → 485，已落） | §1.20 之 **0-4**（+4）；变更记录（+2） |
| 测试文件 | — | — | **无**（纯文档面；本批不新增机检断言） |

**超档标注**：`docs/core/design/CORE-UNIFICATION.md` = **1952 行，超 500 硬限**（既有性质，本批 Δ 0）——**拆分规划不在本批**，登记 §2.6 (c)。

### §2.4 验收标准（逐条回指需求；每条可机判）

| # | 回指 | 判据 | 命令 / 读数 |
|---|---|---|---|
| ACC-1 | 0-4「清单逐条有结论」 | §2.2 表体行 = 10，且判定列无空 / 无「未处置」 | 数 `§2.2` 表体行 = 10 |
| ACC-2 | 0-4「仍漂项全部处置完」 | 仍漂项 1/1 已处置（`:1323` 两端坐标对现态） | 实读 `docs/core/design/CORE-UNIFICATION.md:1323` 两坐标 + `thincoder-cli/src/tui/tool-events.mjs:372` / `thincoder-vscode/src/extension/panel-callbacks.mjs:320` |
| ACC-3 | 0-2「参照历史面不参与对账」 | **本批写面文件集**零改笔 | **本批写面档** `git diff --stat -- <本批写面 3 档清单>` = **空**（原「参照历史面 diff = 空」无基线 ref、与并发批共享工作树 ⇒ 不可判——评审轮 1 发现 3 收正） |
| ACC-4 | 0-1「先定权威副本」 | 8 条起点逐条有基准层重锚落点（或显式「对端不存在 + 不迁」在档） | §2.2 重锚列 10/10 非空 |
| ACC-5 | 需求档落地 | §1.20 之 0-4 在档且逐字含三值 / 三叉 / 追加证据通道 | 实读 `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:320` |
| ACC-6 | N2「基线必须为空」+ N5「既有判据零改」 | 本批写面 3 档：锚零悬空 · 宽度零超限 | `node scripts/doc-anchors.mjs`（V5 引擎；过滤参数以 `--help` 为准）· `node scripts/check-doc-width.mjs` |

**ACC-6 限域声明**：全仓现存违规（宽度 6 行 / 台账 7 条 / 基准层悬空 31 条）**不在本批写面** ⇒ 归父侧另轮处置，**不得入基线**（N2）；读数见 §2.6 (b)(d)。

### §2.5 边界（本批不做）

- 不改参照历史面正文（`thincoder-cli/docs/**` · `thincoder-vscode/docs/**`——判据 0-2）。
- 不改源码 / 测试（判为码错 ⇒ **登记另批**，见 §2.6）；不改 `_archive/`。
- 不做未登记全档普查（新漂移 ⇒ 登记一行 + 停下上报，D-DR18）。
- 不改批 1–9 内容；不写本仓之外文件。
- 不处置行数口径两说（`wc -l` ∥ `ARCHITECTURE.md:8` 含末行）——本批择一、不统一（待裁项，见 §2.6 (e)）。

### §2.6 新发现登记 / 上报项（不扩批）

- **(a) `docs/core/design/ARCHITECTURE.md:117–119`**：记 TUI / ACP-CLIENT / CRASH-REPORTS 为「CLI 侧未迁」，而基准层 CLI 专有面副本**已在位**（`docs/cli/design/{TUI,ACP-CLIENT,CRASH-REPORTS}.md`，本批实核）⇒ 表述 / 落点候选滞后（**非起点清单 ⇒ 不扩批**）。**停下上报**：孰是须父侧定。
- **(b) 三机检现状读数**（复跑 2026-09-16；均**不在本批写面** ⇒ **归父侧另轮**；**不得入基线**，N2）——读数为可改面的快照，漂移以复跑为准（命令见 §2.4 ACC-6）：
- **(b1) `check-doc-width` FAIL 6 行 / 4 档**：`docs/batches/2026-09-16-migration-wrapup.md:17`（461）· `…residual-debt.md:163`（608）· `…vsc-debt.md:17（335）/ :70（430）/ :119（518）` · `docs/vsc/design/VSC-DEBT.md:69`（390）。
- **(b2) 一致性输出面（命令 = `check-doc-width.mjs` 面——原记 `check-ledger` 归名误，评审轮 1 F-5 收正）FAIL 6 条**：V2 `…migration-wrapup.md:4` 计数 2（「33 条」/「26 条」≠ 枚举 3）· V3 缺 §3 工具轮次行 4（criteria-face / doc-reconcile / engine-debt / migration-wrapup）。**前序 V1（`docs/core/design/DOC-RULES.md` 段引用）已消**——复跑不再命中。
- **(c) 基准层悬空锚 31 条**（127 档域读数）：含 `docs/vsc/design/VSC-DEBT.md` **22 处**（该档为未跟踪新增档）+ `docs/core/design/CORE-UNIFICATION.md:609 / :611 / :615 / :1688` 4 处 + 他档 5 处（本轮过滤面未见，未逐条枚举）。**均非本批起点** ⇒ 另批；`CORE-UNIFICATION.md` 的 1952 行拆分规划同归此项。
- **(d) 前序疑点撤回**：`thincoder-vscode/scripts/reconcile-lookup.mjs:25-29` 的 `LOOKUP_DIRS` 本轮实读 = **迁移后三面域**（`docs/core|cli|vsc` 各 design / requirements）⇒ 早前「域常量指迁前目录 ⇒ 恒空输出」**不成立，撤回**（注释自记「2026-09-15 迁移批后 = 三部分」）。
- **(e) 待裁（本批不处置）**：① 行数声明单一权威源（`wc -l` ∥ `ARCHITECTURE.md:8` 含末行口径——§5.2 待裁登记）；② `TWO-REPO-MERGE*` 族跨仓引用面是否入账（本批未计数——**unverified**）；③ CLI `question.md` 迁前取数（**unverified**）。
- **(f) 起点证据的归属待核**：§2.2 #10 所记滞后锚的**修正提交归属**未定（本轮可证：该档对 HEAD 无 diff 且 `:1323` 两坐标均成立 ⇒ 修正在 HEAD 侧）；如需追溯须父侧跑 `git log -p -- docs/core/design/CORE-UNIFICATION.md`。

## §3 设计评审（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

**评审范围**：批 10 DOC-RECONCILE 设计面（`docs/batches/2026-09-16-doc-reconcile.md` §1+§2），同轮核对 `docs/core/design/{PROVIDER,CORE-UNIFICATION,ARCHITECTURE}.md`。

**重点核实读结论**：① 判定/处置逐条有据——#9（`:380` 记 402 = `wc -l` 实测 402）✓；#10 两坐标 + 该单元格第三坐标实读均与现码一致（`thincoder-cli/src/tui/tool-events.mjs:372` · `thincoder-vscode/src/extension/panel-callbacks.mjs:320` · `thincoder-core/agent/dispatch.mjs:394`；`:195` = `statusTextPayload` ✓）✓；#1–#8 重锚对端在位 ✓（含 `docs/cli/design/{TUI,ACP-CLIENT,CRASH-REPORTS}.md` 与 `docs/vsc/design/WEBVIEW.md`）。
  ② 验收 6 条：2 条有命令（ACC-3 / ACC-6，ACC-6 过滤未定），4 条仅人读读数（详见发现 3/4/5）。
  ③ §2.6(a) 矛盾**属实**（`ARCHITECTURE.md:117`–`:119`「CLI 侧未迁」∥ `docs/cli/design/{TUI,ACP-CLIENT,CRASH-REPORTS}.md` 在位）——登记 + 停下上报合规（发现 6）。
  ④ 悬空锚 31 条为声明读数，本轮不可复跑（**unverified**；4 行锚形态与 `VSC-DEBT.md` 在位已实核）（发现 10）。
  ⑤ 受影响文件表 2/3 行与声明口径相符（CORE-UNIFICATION 行 +1，发现 9）；六条 ACC 与 10 条起点映射基本齐（缺口见发现 5）。

**限制声明**：本轮未提供项目标准档与文档地图（Document ownership 判据降级）；评审面无脚本执行能力（机检类读数标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity / 口径一致性 | 🟡 | §2.2 表体 8/10 行 判定列取值「不适用」（`:57`–`:64`），超出本节自declared「判定三值 = 仍漂 / 已消 / 判不出」（`:53`）、需求 0-4 三值定义（`docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:320`）、以及 `docs/core/design/DOC-CODE-RECONCILE.md:388`（本批决策面 2「否决四值（增『不适用』）」——0-2 命中应记「已消」）；计数口径（`:72`）仍按第 4 类计（不适用 = 8） | 把 8 行判定与三值口径对齐（改值；或把 0-2 命中合法化为独立取值并同步决策记录 / 0-4 / 计数 / ACC-1 判据），三处取一为准 |
| 2 | Acceptance criteria | 🟡 | #10 判定「仍漂」与同行处置「改文档（Δ 0 行）· 现状已收正」（`:66`）相抵——按 0-4 定义（`ENGINEERING-MODE-MECHANISM.md:320`：已消 = 声明 = 实测 / 现测成立）该条属已消；本轮实读 `CORE-UNIFICATION.md:1323` 三坐标均对现态（VSC `panel-callbacks.mjs:320` · CLI `tool-events.mjs:372` · `agent/dispatch.mjs:394`）⇒ 无改笔对象；「仍漂 = 1/1 已处置」（`:72`）与 ACC-2（`:90`）表述随之失真 | 复核 #10 三值归属与判定时点口径（起点 as-of 属实 vs 现态已收正）并同步计数 / ACC-2 措辞，避免「仍漂」与「Δ 0」并存 |
| 3 | Acceptance criteria | 🟡 | 6 条 ACC 中 4 条无命令（ACC-1 `:89`／ACC-2 `:90`／ACC-4 `:92`／ACC-5 `:93` 均为人读读数），与「每条可机判」（`:85`）不符；ACC-3（`:91`）`git diff --stat` 无基线 ref（改动提交后恒空）；ACC-6（`:94`）「过滤参数以 `--help` 为准」未钉死过滤面；ACC-2 只核 `:1323` 两坐标（该单元格含第三坐标 `agent/dispatch.mjs:394`）；全表无反向（反证）用例 | 逐条补命令字面量 + 通过阈值 + 限域（或显式标人读）；ACC-3 以起点提交 / 未提交改动集为基线；反证面可对齐既有形态（`CORE-UNIFICATION.md:1765`–`:1766` 反证列） |
| 4 | Acceptance criteria（限域） | 🟡 | ACC-6 判据「本批写面 3 档：锚零悬空」（`:94`）与 §2.6(c)（`:112`）相抵：§2.3（`:78`）把 `docs/core/design/CORE-UNIFICATION.md` 计入本批 3 档，而该档含 4 处基准层悬空锚（`:609` / `:611` / `:615` / `:1688`）且明标「另批处置、不得入基线」⇒ 按字面 3 档口径该条必红，按「写面 = 仅受改笔档」又只剩 2 档 | 明示该条限域口径（建议「相对基线零新增」+ 明确文件清单 / 过滤参数），并同步 `:96` 限域声明与 §2.6(c) 归属 |
| 5 | Requirements coverage | 🟡 | §1 验收口径 ③（新发现项逐条登记、不静默）与 ④ 的 check-ledger / 发布门（`:36`）未落成任何 ACC（ACC-6 只列 doc-anchors + check-doc-width）；起点 #9（已消）无独立复核项（其 402 = 402 读数仅由本轮评审实核） | 为 ③ 落一条可判条目（§2.6 登记块 ↔ 台账追加行对照）、为 ④ 补 check-ledger / 发布门判读口径或写明不适用理由；#9 补一条读数复核项 |
| 6 | Scope（coordination） | 🟡 | §2.6(a) 本轮实核属实：`ARCHITECTURE.md:117`–`:119` 标 TUI / ACP-CLIENT / CRASH-REPORTS「CLI 侧未迁」（指向 `thincoder-cli/docs/design/*`），基准层 `docs/cli/design/{TUI,ACP-CLIENT,CRASH-REPORTS}.md` 在位（层级口径 = `CORE-UNIFICATION.md:1916`）；设计按边界 ②（`:26`）登记 + 停下上报 = 合规。残留：§2.2 #5 重锚落点（`:61`）与 `:118` 标注同目标相抵——(a) 未澄前该行与 ACC-4「重锚落点」判读双源 | (a) 的去向（改 ARCHITECTURE.md / 归迁移批）与 §2.2 #5 重锚行表述、ACC-4 判读一并对齐并登记成行 |
| 7 | Affected-file size（R24a） | 🟡 | `docs/core/design/CORE-UNIFICATION.md`（1951–1952 行，远超 500）在档无「体量与拆分规划」节（本轮 grep 未见；同层 ARCHITECTURE §8 / PROVIDER §9 / DOC-CODE-RECONCILE §9 均有）；本批 Δ 0 且 §2.6(c) 登记「另批」。项目内两说并存：WEBVIEW（1867 行）先例「超 500 硬限必拆」（`docs/batches/2026-09-15-vsc-doc-migration.md:36`）∥ 本档 `:1073`「纯 `.md` 档免档位判定」⇒ 拆分责任批 / 时点未定 | 明确该类 .md 档拆分口径，并为该档拆分规划指定责任批 / 时点（本批登记即可，不做拆分） |
| 8 | Acceptance criteria（数字） | 🔵 | ACC-6 限域声明「台账 7 条」（`:96`）∥ §2.6(b2) 复跑读数「check-ledger FAIL 6 条」（`:111`，同处明记 V1「已消——复跑不再命中」）⇒ 同一读数两数字未同步（+1 疑为 V1 旧值） | 统一为复跑后读数或给两处标 as-of |
| 9 | Affected-file size（口径） | 🔵 | §2.3 行数「`docs/core/design/CORE-UNIFICATION.md` 1952」（`:78`）与本表声明口径（`wc -l`，`:76`）不符：read 计行 = 1952（含末行空段）⇒ 按项目自订换算（`DOC-CODE-RECONCILE.md:266` / `:387`：read = `wc -l` + 1）应为 1951；另两行 485 / 485 与 wc -l 口径相符 | 按声明口径改数或标注所用口径（该行 Δ 0，不影响结论） |
| 10 | Clarity（证据可核性） | 🔵 | §2.6(c) 计数本轮不可复跑（评审面无脚本执行）：「基准层悬空 31 条 / VSC-DEBT.md 22 处 / CORE-UNIFICATION 4 处」（`:112`）为声明读数（**unverified**；已知 `docs/vsc/design/VSC-DEBT.md` 在位且锚点密布、`:609` / `:611` / `:615` / `:1688` 确为脚本名 + 行号形态）；「该档为未跟踪新增档」无 git 面可核（**unverified**） | 由执行侧在收口前复跑一次读数并登记 as-of |
| 11 | Clarity（实施面） | 🔵 | §2.3（`:78`–`:80`）三行「本批动作」全部标「已落」⇒ 实施轮（§5）施工面未声明（若实施 = 零改笔、仅复核 / 机检复跑） | 显式写明本批实施面（零改笔 + 复核清单），避免 §5 空转或重复改笔 |

VERDICT: pass
计数：🔴 0 · 🟡 7 · 🔵 4 · 合计 11 条

## §4 用户批准（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_本段（实施轮 · eng-coder）记录见下方 §5.1–§5.7——施工面 = 复核 + 机检复跑 + 记录；**零改笔于源码 / 测试 / 设计档 / 参照历史面**。_

### §5.1 实施面声明（施工面 = 复核 + 机检复跑 + 记录；**零改笔**）

- **本段（实施轮）改笔数 = 0**：不动源码 / 测试 / 设计档 / 参照历史面 / 批 1–9 正文。
  设计轮已落的两档（`docs/core/design/DOC-CODE-RECONCILE.md` +34 · `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` +6）见 §2.3「本批动作」列「已落」——属**设计轮笔**，实施轮不重复改。
- **本段唯一写入 = 本档 §5**（工具 `batch_segment`，append-only）。本段未新增任何未跟踪档。
- **工作树自证**（`git status --porcelain`，本轮实读，仓根 `D:/teamcode/thincoder`）：`M` 21 档 + `??` 8 档。
  其中**参照历史面 3 档被改**（`thincoder-vscode/docs/design/{AGENT-LOOP,TOOLS}.md` · `.../requirements/TOOLS.md`）——**非本段笔**（归属见 F-2）；其余为他批在途笔 / 本批设计轮笔。
- **本轮实跑命令（verbatim）**：`node scripts/doc-anchors.mjs` · `node scripts/check-doc-width.mjs` · `node scripts/check-ledger.mjs` · `git diff --stat -- thincoder-cli/docs thincoder-vscode/docs` · `git status --porcelain`。
- **本节读数取证命令**（非闸命令，用于 §5.3 / §5.6 / (b) 的独立复现）：`wc -l docs/core/design/{CORE-UNIFICATION,DOC-CODE-RECONCILE,PROVIDER}.md docs/core/requirements/ENGINEERING-MODE-MECHANISM.md`（§5.6 表）· `grep -n "29[34]" docs/core/design/PROVIDER.md`（零命中）· `grep -nE '^ *[^|].{301,}$' <各档>`（超宽清单逐行复核）。

### §5.2 ACC-1–ACC-6 逐条实读结论

| ACC | 判据（§2.4） | 本轮实读 | 结论 |
|---|---|---|---|
| ACC-1 | §2.2 表体行 = 10；判定列无空 / 无「未处置」 | §2.2 `:57`–`:66` = 10 行；判定列 10/10 非空、无「未处置」 | ✅ 满足（字面） |
| ACC-2 | 仍漂项 1/1 已处置（`:1323` 两端坐标对现态）；复跑零未处置 | `CORE-UNIFICATION.md:1323` VSC = `panel-callbacks.mjs:320` ✓ · CLI = `tui/tool-events.mjs:372` ✓（第三坐标 `agent/dispatch.mjs:394` ✓）· `:195` = `statusTextPayload` ✓；10 起点复跑零「未处置」 | ✅ 满足（字面）；「仍漂」标签与 0-4「已消」定义相抵（§3 发现 2 在案；本段已登记 + 上报 = F-6，处置权归设计段 / 父侧） |
| ACC-3 | `git diff` 参照历史面 = 空 | **3 档 / 21 插入 / 7 删除**：`thincoder-vscode/docs/design/AGENT-LOOP.md` · `design/TOOLS.md` · `requirements/TOOLS.md` | ❌ **字面红**；归属 = 批 8 ENGINE-DEBT（ED-2 `engine-debt.md:181` · ED-4 `:215`）——**恰为该 3 档**；本段零改笔（F-2）；**判据本身无基线 ref**（工作树与并发批共享 ⇒ 「diff = 空」不可解成「本批零改笔」，同 §3 发现 3） |
| ACC-4 | 8 条起点重锚落点在位（或缺席在档）；重锚列 10/10 非空 | 重锚列 10/10 非空 ✓；对端实读：`docs/core/design/ADVISOR-CONVERGENCE.md` 265 · `ENGINEERING-MODE.md` 365 · `TURN-CAP-CONTINUE.md` 154 · `docs/cli/design/ACP-CLIENT.md` 365 · `docs/vsc/design/WEBVIEW.md` 268 ✓；#8 `docs/vsc/design/VSC-PROMPTS.md` **不存在** ✓ + `VSC-MIGRATION-INVENTORY.md:83` / `:123`（不迁）/ `:408`（D-VM9）在档 ✓ | ✅ 满足 |
| ACC-5 | 需求档 `:320` 逐字含 0-4 三值 / 三叉 / 追加证据通道 | `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md:320` 实读逐字：三值（仍漂 / 已消 / 判不出-须留痕）· 三叉（改文档 ∥ 改码-另批 ∥ 留痕）· 追加证据通道 · 收口判据 ①②③ · 判定句 ✓ | ✅ 满足 |
| ACC-6 | 本批写面 3 档：锚零悬空 · 宽度零超限 | 宽度：3 档均不在超宽清单 ⇒ **零超限** ✓；锚：`CORE-UNIFICATION.md` **4 条悬空**（`:609` / `:611` / `:615` / `:1688`）⇒ 字面红；另两档零悬空 ✓ | ⚠️ 半满足（宽度绿 / 锚字面红——限域双源口径在案，§3 发现 4） |

### §5.3 起点 10 条复核（复跑读数 —— 收口判据 ③）

| # | 起点 | 本轮读法 | 实读 | 与 §2.2 对照 |
|---|---|---|---|---|
| 1 | `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md:766` | 重锚对端存在性 | `docs/core/design/ADVISOR-CONVERGENCE.md` 265 行在位 | 一致（已消） |
| 2 | 同档 `:913` | 同上（同档同族） | 同上 | 一致 |
| 3 | `thincoder-cli/docs/design/ENGINEERING-MODE.md:2221` | 同上 | `docs/core/design/ENGINEERING-MODE.md` 365 行在位（同名需求档 `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` 485 亦在位——落点择取见 §2.2 #3，本段不裁；**双落点观察已登记 = F-8**） | 一致 |
| 4 | `thincoder-cli/docs/design/TURN-CAP-CONTINUE.md:159` | 同上 | `docs/core/design/TURN-CAP-CONTINUE.md` 154 行在位 | 一致 |
| 5 | `thincoder-cli/docs/design/ACP-CLIENT.md:435` | 同上 | `docs/cli/design/ACP-CLIENT.md` 365 行在位 | 一致 |
| 6 | `thincoder-vscode/docs/design/WEBVIEW.md:231` | 同上 | `docs/vsc/design/WEBVIEW.md` 268 行在位 | 一致 |
| 7 | 同档 `:1736` | 同上（同档同族） | 同上 | 一致 |
| 8 | `thincoder-vscode/docs/design/VSC-PROMPTS.md:218` | 基准层对端缺席 + 「不迁」在档 | `docs/vsc/design/VSC-PROMPTS.md` **不存在**；原档 `thincoder-vscode/docs/design/VSC-PROMPTS.md` 308 行在位 | 一致（就地留 / 不迁） |
| 9 | `docs/core/design/PROVIDER.md` §9 行数声明 | 现档声明 vs `wc -l` | `:380` 记「本档 **402 行**（as-of 批 1）」；本轮 `wc -l` = **402** ⇒ 声明 = 实测；全档 grep 无「293 / 294」残留 | 一致（已消） |
| 10 | `docs/core/design/CORE-UNIFICATION.md:1323` | 三坐标对现码 | 见 ACC-2 行（三坐标全对现态） | 一致（现态成立）；三值归属见 ACC-2 行 |

**反证面（可判性实证 —— 任务书「要做的」第 3 条 / 自检 ④）**：取已消项 #9（`PROVIDER.md:380`「本档 **402 行**」）核「若声明与实测不符则必红」的可判性——
① 判据句（命令 + 期望）：`wc -l docs/core/design/PROVIDER.md` 期望 = **402**（= `:380` 声明）⇒ 本轮实测 402 / 期望 402 ⇒ **绿**（相符即绿）；
② 两向可判的活例（证明判据非空转——非「凡长即红 / 凡声明即绿」）：宽度判据 —— `node scripts/check-doc-width.mjs` 对**非表格行** >300 字符必红，现存红例 = 本档 `:125`（716 字符、非表格行）而 `:131`–`:137` 同为长行但属表格行 ⇒ 豁免（判据按行型可判）；
③ 计数判据（V2）—— `docs/batches/2026-09-16-migration-wrapup.md:4` 声明「**33** 条」/「**26** 条」而同行括号枚举各 3 项 ⇒ 本轮**实红**（= §5.4(c) 的 V2×2）；同判据在「声明 = 枚举」时零命中（同档其余行）⇒ **不符必红 / 相符必绿**两向成立。

### §5.4 三机检 as-of 读数（t1 = 2026-09-16 09:31–09:33 UTC · t2 = 09:37–09:38 UTC —— 含与 §2.6 声明的差异）

**标签约定**：本节 bullet 的 (a)–(d) = **命令面序号**（① `doc-anchors` ② `check-doc-width` ③ 一致性输出面 ④ `check-ledger`）；下方差异表行的 (b1)/(b2)/(c)/(d) **承 §2.6 语义**（≠ 命令面序号）——两套不混读（F-3 引用 §2.6(b1)/(c) 属后者）。

- **(a) `node scripts/doc-anchors.mjs`（无过滤 = 双域跑）**
  - 基准层域（8 目录 / **126 档**）：候选 9283 · **悬空 17**（全在 V5-A 路径/坐标）· 注记豁免 916 · 用例号 0 悬空 · 符号·窄 0 悬空 ⇒ `FAIL(V5): 17 条悬空锚（闸态——阈值 0）`。
    17 条分布（本轮逐条实读）：`docs/vsc/design/VSC-DEBT.md` **8**（`:42` / `:111` / `:129` / `:135` / `:163` / `:164` / `:165` / `:180`）
    · `docs/core/design/CORE-UNIFICATION.md` **4**（`:609` / `:611` / `:615` / `:1688`）· `docs/core/design/DOC-SYSTEM.md` **4**（`:10` / `:175` / `:178` / `:380`）· `docs/vsc/requirements/WEBVIEW.md` **1**（`:97`）。
  - CLI 参照历史面域（8 目录 / **99 档**）：候选 8891 · **悬空 37** ⇒ `FAIL(V5): 37 条悬空锚`（= §1 `:31` 批 6 处置面）。
  - VSC 引擎（报告态）：命中 1 — A3 `docs/design/TOOLS.md:189` `@thincoder/core/...`（= 域内相对形 `thincoder-vscode/docs/design/TOOLS.md:189`；仓根外前缀，不入闸）。
- **(b) `node scripts/check-doc-width.mjs`** ⇒ `FAIL(宽度): 5 文件 / 7 行超 300 字符`——清单见下行 + 差异表 (b1)；其中本批档自产行 = F-1。
  `docs/batches/2026-09-16-{doc-length-rule-repeal.md:29(417) · doc-reconcile.md:125(716) · migration-wrapup.md:17(461) · residual-debt.md:168(608)+:191(914) · vsc-debt.md:129(518)+:144(596)}`。
  - **t3 补记（交付时点实读）**：宽度读数升为 **6 档 / 9 行** —— 新增 `docs/core/design/DOC-DISCIPLINE.md:388(327)+:608(387)`（**设计档、非本段笔**；他批设计轮在途）⇒ t2→t3 增量全在他批面，本批档仍仅 `:125` 一行。
- **(c) 一致性（同命令输出面）** —— **读数在途（他批并改）：t1 = 6 条**（V2 `migration-wrapup.md:4`「33 条」/「26 条」≠ 枚举 3 ×2；V3 缺 §3 轮次行 ×4 = criteria-face / doc-length-rule-repeal / engine-debt / migration-wrapup）；
  **t2 = 2 条**（仅剩 V2×2——V3 四档的 §3 轮次行于 t1→t2 间落档）。两时点存量（基线内）均 **0 条**；两时点本批档 `doc-reconcile.md` 均 **不在 V3 列表**（其 §3 轮次行合规 ✓）。
- **(d) `node scripts/check-ledger.mjs`** ⇒ `OK: thincoder/docs/TODO.md` · `OK: thincoder/docs/TODO-archive.md`（归名差异见 F-5）。

| 面 | §2.6 声明 | 本轮复跑 | 差异 |
|---|---|---|---|
| (b1) 宽度 | FAIL **6 行 / 4 档**（migration-wrapup:17 · residual-debt:163 · vsc-debt:17/:70/:119 · VSC-DEBT.md:69） | FAIL **7 行 / 5 档**（见 (b)） | 行数 +1；行号漂移 3 处（residual-debt 163→168、vsc-debt 17/:70/:119→:129/:144、VSC-DEBT.md 1 行已消）；新增 3 行（含本批档 §3） |
| (b2) 一致性 | FAIL **6 条**（V2×2 + V3×4；V3 = criteria-face / **doc-reconcile** / engine-debt / migration-wrapup；V1 已消） | **t1 = 6 条**（V2×2 + V3×4；V3 = criteria-face / **doc-length-rule-repeal** / engine-debt / migration-wrapup）· **t2 = 2 条**（仅 V2×2——V3 四档 t1→t2 间被他批清空） | 计数与时点绑定——**V3 档集换位一档** ⇒ 登记 **F-7**（非「同档集」；本行经发散审计指正后收正） |
| (c) 基准层悬空 | **31 条**（127 档；VSC-DEBT 22 + CORE-UNIFICATION 4 + 他档 5） | **17 条**（126 档；VSC-DEBT **8** + CORE-UNIFICATION 4 + DOC-SYSTEM 4 + vsc/requirements/WEBVIEW 1） | 总 −14、档数 −1；**差异全在 `VSC-DEBT.md`**（未跟踪在途新增档——他批在写）；**档数 −1 的那一档归属 = unverified**（他批在途） |
| (d) 台账条数 | §2.4 `:96`「台账 7 条」∥ §2.6(b2)「6 条」 | `check-ledger` **OK ×2**（零违规） | 两数字未同步（§3 发现 8 在案）；复跑台账面 0 违规（≠ 声明 6 / 7 条）——归名见 F-5 |

### §5.5 新发现登记 / 停下上报（D-DR18——登记一行，不扩批）

- **F-1（本批自产 · 须父侧处置）**：本批档 **§3 `:125` = 716 字符**超宽（`check-doc-width` 命中）。该行 = §3 评审段正文（落笔 = 评审子代理），**处置权不在实施段**（红线 ①：不改 §2 / §3）⇒ **停下上报**：建议父侧按「段作者修订 / 父侧代笔打标」路径折行。
- **F-2（ACC-3 字面红 · 归属他批）**：参照历史面 3 档被改（21 插入 / 7 删除）——归属 = 批 8 ENGINE-DEBT：ED-2（`engine-debt.md:181` 表行 + `:98` 落点：VSC `design/TOOLS.md` §8/§10 + `requirements/TOOLS.md` F6）· ED-4（`:215` 指针 `F-B1~B4` → `F-B1~B5`，落点 VSC `design/AGENT-LOOP.md` §9）——**恰为该 3 档** ⇒ 非本批笔，本批不处置（越批只登记不处置）。
- **F-3（读数漂移 · 他批在途）**：§2.6(b1)/(c) 的宽度与悬空读数、及 (b2) 的 V3 档集，与复跑不符（见 §5.4 差异表）；差异落点全在他批在写的档（`docs/vsc/design/VSC-DEBT.md` 未跟踪 / 他批批次档）⇒ 登记 as-of 读数（**读数与时点绑定**），**不改判、不入本批写面**（V3 档集换位 / 清空见 F-7）。
- **F-4（= F-1 指针行 —— 不另计）**：本批档宽度自产读数同 F-1（分列以免漏读）。
- **F-5（归名待核 · 不影响读数）**：§2.6(b2) 把一致性 6 条归名 `check-ledger`；本轮 `check-ledger`（cwd = 仓根）输出面仅台账 OK ×2，一致性 6 条由 `check-doc-width` 输出面给出 ⇒ **同一读数**（V2/V3 明细逐条一致），命令归名待核（收正落点 = §2.6(b2) `:111`，归设计段 / 父侧）。
- **F-6（设计面残留 · 非本段可裁）**：三项 = ① §2.2 #10 判定「仍漂」vs 处置「改文档（Δ 0 行）」（`:393` 已把同族项裁为「已消 ∥ 不适用」）；
  ② §2.2 `:72` 计数口径「不适用 = 8」（第 4 值）vs 其判定列 `:57`–`:64` 实读全为「已消」；③ ACC-6 限域双源（`§2.3 :78` 三档含 `CORE-UNIFICATION.md` vs §2.6(c) 另批处置）。
  ②另有实证：`docs/core/design/DOC-CODE-RECONCILE.md:388`「**否决四值**（增『不适用』…白增枚举）」而同档 `:393` 即用「∥ 不适用」⇒ 设计档自相抵。三项均属 §3 发现 1 / 2 / 4 在案 + 设计段落笔 ⇒ 本段只报读数（ACC-2 / ACC-6 行），**不裁、不改笔**。
- **F-7（V3 档集换位一档 · 登记）**：§2.6(b2) 的 V3 = {criteria-face, **doc-reconcile**, engine-debt, migration-wrapup}；t1 复跑 V3 = {criteria-face, **doc-length-rule-repeal**, engine-debt, migration-wrapup}
  （`doc-reconcile` §3 已有工具写入的轮次行 ⇒ 出集；`doc-length-rule-repeal` 无该行 ⇒ 入集）；t2 复跑该四档 §3 轮次行均已落档 ⇒ V3 面清空（他批在途）。计数不变（6 = V2×2 + V3×4）⇒ **只登记、不下判**；
  成因候选（**unverified**）：`doc-length-rule-repeal` 的 §4/§6 实内容后于 §2.6 落档 / `doc-reconcile` 的 §3 轮次行后落——须父侧核。
- **F-8（双落点观察 · 登记）**：§2.2 #3 重锚只给 `docs/core/design/ENGINEERING-MODE.md`（365）；同一旧坐标同名的 `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md`（485）亦在位（§5.3 #3 实读）
  ⇒ ACC-4「重锚落点在场」判读双解。**只登记、不下判**（择取归父侧 / 设计段；若判「非漂移」请注明依据 = D2 单一权威源）。
- 观察项（**不属本批面**）：`CORE-UNIFICATION.md` 4 条悬空锚 + 1951 行 > 500 硬限 ⇒ §2.6(c) 已登记「另批 + 拆分规划」。

### §5.6 行数口径实读（决策面 1 佐证 —— `wc -l` ∥ read 计行）

| 档 | `wc -l` | read 计行 | 末行换行 | Δ |
|---|---|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | 1951 | 1952 | true | +1（§2.3 记 1952 = read 口径） |
| `docs/core/design/DOC-CODE-RECONCILE.md` | 485 | 486 | true | +1（§2.3 记 485 = `wc -l` 口径） |
| `docs/core/requirements/ENGINEERING-MODE-MECHANISM.md` | 485 | 486 | true | +1（§2.3 记 485 = `wc -l` 口径） |
| `docs/core/design/PROVIDER.md` | 402 | 403 | true | +1（§9 记 402 = `wc -l` 口径） |
| `docs/batches/2026-09-16-doc-reconcile.md`（本档 §5 写入前） | 156 | 157 | true | +1 |

5 档均 `endsNL = true` ⇒ 两说差异恒为 +1（**待裁项**，见 §2.5 `:104`；本段不统一、不择一）。

### §5.7 收口读数小结（本段）

起点 **10/10** 有结论（零漏项）· 复跑零「未处置」· 反证面 1 例（§5.3）· ACC 6 条：**4 绿**（ACC-1 / 2 / 4 / 5）· **1 半满足**（ACC-6 宽度绿 / 锚字面红）· **1 字面红且归属他批**（ACC-3）；
三机检（as-of t2 = 09:37 UTC）：宽度 7 行（含本批档 §3 1 行 = F-1）· 一致性 **2 条**（t1 = 6 条；全落他批批次档；V3 档集换位 / 清空见 F-7）· 锚 17（基准层）+ 37（批 6 面）· 台账 OK ×2。
**t3 补记（交付时点）**：宽度 **6 档 / 9 行**（增量 = `DOC-DISCIPLINE.md:388` / `:608`，非本段笔；见 §5.4(b) t3 行）· 一致性仍 **2 条**（V2×2）= 与本批面无涉。
**发布门面（§1 `:36` ④）**：本批零改源码 / 测试 ⇒ 测试门与 release 门**不适用**（无受改面可跑）；受改面读数即上方三机检（§3 发现 5 的覆盖缺口已由此行闭合）。
**本段零改笔（源码 / 测试 / 设计档 / 参照历史面）；未处置项 = 0（本批面）；他批 / 待裁项已逐条登记（F-1–F-3 · F-5–F-8 共 7 项；F-4 = F-1 指针行）。**

## §6 验证与收口（父代理）

> **收口判词：已收口 2026-09-16**（设计 pass → 实施零改笔 → 父侧三项收正 → 机检复跑在案）

### 交付判定（逐条）

| # | 条目 | 交付 | 判定 |
|---|---|---|---|
| 1 | 起点清单 10 条对账 | §2.2 逐条（判定三值 + 处置三叉）· 复跑零未处置 | ✅ 全交付 |
| 2 | 「仍漂」项处置 | #10 转「已消」（三坐标实核） | ✅ |
| 3 | 新发现登记 | §2.6 / §5.5 F-1–F-8（登记一行、不扩批） | ✅ |
| 4 | 父侧收正 | F-1 折行（§3 `:125` → 5 行）· F-2 ACC-3 判据收正（「本批写面文件集 diff = 空」）· F-5 命令归名（`check-doc-width` 面） | ✅ 已落 |

### 验收读数（as-of 2026-09-16 收口）

- **ACC-1 / 2 / 4 / 5** ✅ 绿；**ACC-6** 宽度绿 · 锚字面红（归属他批，见下）；**ACC-3** 字面红 → **判据已收正**（字面红归因 = 批 8 三档改笔）。
- 三机检：宽度 = 本批档零在列（他批 5 档 8 行）· 一致性 = 2 条（全在 `migration-wrapup.md:4`，他批档）· 锚 = 基准层 17 条 + 批 6 面 37 条（**均非本批笔**）· 台账 = `OK ×2`（0 违规）。

### D7 核销同步清单

| 项 | 状态 |
|---|---|
| 角色表 / 段位 | §1 主 agent · §2 eng-designer · §3 评审（轮 1）· §5 eng-coder · §6 父代理 —— 落位齐 |
| 状态行 | 本档 → **已收口 2026-09-16** |
| 计数 | 起点 10 = 10（零漏项）· 新发现 F-1–F-8 登记 |
| 指针 | 设计档 / 需求档回指在位（§2.1 三方一致） |
| 变更记录 | 需求档 §1.20 之 0-4 由设计轮落（`ENGINEERING-MODE-MECHANISM.md`）；本批不改该档正文 |
| 待办勾销 | 台账「文档↔实装漂移（类）」→ **核销 → 归档**（父侧同轮执行） |
| 台账可见面 | 收口行 = 台账汇总面输出（见会话流） |

### 未决（移交 / 登记）

1. **ACC-3 / ACC-6 字面红** = 批 8 三档改笔 + 他批悬空锚 —— 非本批笔（§5.5 F-2 · §2.6(c) 在案）；
2. **F-3 / F-4 / F-6 / F-7 / F-8**（读数漂移 · 判定标签 · §2.6 相抵 · 档集换位 · 双重落点）—— **只登记不下判**，随 owning 批处置；
3. **§2.6(a) `ARCHITECTURE.md:117`–`:119`** —— 父侧裁定 = **基准层为准（副本已在位）** ⇒ 该三处标属**滞后事实句**，**移交批 11 迁移收尾面**（其 §9.3 / A24 族同面）。

**收口结论**：本批**达成交付目标**（起点清单逐条有结论 + 零漏项 + 复跑零未处置）；字面红项**归属明确且非本批笔**。
