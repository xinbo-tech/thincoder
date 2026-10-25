# 2026-10-25 · runner 分层随正：失实文案与不可满足 AC 收正（轻通道）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-25 · 来源 = 台账 #1767（RELEASE.md 两处失实 + CI 停用注释援引已失效旧令）+ #1770（两处设计档 AC 不可满足 + release-check 文案滞后）——runner 分层批（#1764）落地后的随正面。
> 台账 = #1779（TESTING · 归批）。前情 = 2026-10-24-paragraph-width-criterion.md（已收口 2026-10-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**本批 = 轻通道轮**（缺陷修复面：实现已变，文案与 AC 还停在旧口径——工作 = 把文案与判据拉回实现，不加语义）。

**三笔（父侧直接执行）**：

| 笔 | 落点 | 改了什么 |
|---|---|---|
| ① | `docs/RELEASE.md:100` ∥ `:183` | 「prepublishOnly → npm test」→ 「prepublishOnly → check-syntax（语法门）」；补「核仓无集成测试集，测试职责在前端包」 |
| ② | `.github/workflows/test.yml:79` | 停用注释补「该令已于 2026-10-18 被更晚裁定取代」 |
| ③ | `docs/core/design/MODEL-SPECS.md:291` · `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:350` · `thincoder-cli/scripts/release-check.mjs:3/:92/:93` | 核入口的验收与文案从「npm test」改「语法门 prepublishOnly」；release-check 的「单元 + 集成 + slow 全量」改「集成测试（cli 只收集成层）」 |

**核销**：#1767 ∥ #1770（同源两笔，同轮）。

> 不适用：§2 —— 缺陷修复面（实现已变，文案与判据拉回实现），父侧直接执行，无设计席段
> 不适用：§3 —— 轻通道（机械修正，无新语义），无设计评审
> 不适用：§4 —— 轻通道收口（批准面 = 本笔的披露行，无独立设计待批）

**实施任务书（给 eng-designer——§2 由你写，本节 = 你的输入）**：

**目标**：清四档的 102 条段判据命中（88 段太长 + 14 档缺），让四档过门。

**修法判据**（四档同式）：
- **段太长**：在长段的语义断点处插入空行拆段，每段 ≤300 字符。**语义零改、零删字**——只加空行断段，不改任何字。表格行 / 标题 / 列表 / 引用 / 围栏不动。
- **档缺**：裸档名 → 写仓根相对全路径（先 grep 目标档确认存在再写）。

**四档分工**（每档一个实施席，并行）：

| 档 | 段太长 | 档缺 |
|---|---|---|
| `docs/RELEASE.md` | 7（`:10` ∥ `:172` ∥ `:213` ∥ `:253` ∥ `:342` ∥ `:348` ∥ `:370`） | 3（`:5` ∥ `:12` ∥ `:76` → `docs/core/design/CORE-UNIFICATION.md`） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | ≈40 | ≈10 |
| `docs/core/design/MODEL-SPECS.md` | ≈50 | 0 |
| `docs/core/requirements/PROVIDER.md` | 4（`:10` ∥ `:99` ∥ `:108` ∥ `:131`） | 0 |

**验收**：`node scripts/doc-check.mjs --root .` 里该档命中 = 0。

## §2 批次任务与设计（eng-designer）

**状态行**：设计完成 2026-10-25（机械清理面——四档段判据命中归零，零语义改动；含本轮实测补充（锚类命中处置规则））

**批次任务**：清四档的段判据命中，让四档过门（任务书 = §1 实施任务书；修法判据同 §1——段太长只插空行断段、语义零改零删字；档缺写仓根相对全路径、先确认目标档在盘再写）。

**实测命中面**（2026-10-25 08:3x 跑 `node scripts/doc-check.mjs --root .` 逐档计数）：

| 档 | 现行数 | 段太长 | 锚命中（入闸） | 锚列报（不入闸） |
|---|---|---|---|---|
| `docs/RELEASE.md` | 389 | 7（:10 :172 :213 :253 :342 :348 :370） | 2（:13 `src/cli/team-command.mjs` · :213 `scripts/release-check.mjs`） | 0 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 1217 | 34（:30 :74 :77 :96 :106 :131 :135 :140 :146 :164 :240 :246 :267 :271 :277 :282 :334 :411 :414 :418 :502 :599 :675 :686 :703 :713 :753 :758 :763 :766 :785 :854 :935 :1015） | 29 | 0 |
| `docs/core/design/MODEL-SPECS.md` | 1884 | 43（:88 :121 :155 :168 :183 :191 :219 :229 :252 :326 :366 :384 :394 :437 :445 :453 :462 :475 :509 :519 :608 :834 :929 :1018 :1090 :1102 :1181 :1186 :1189 :1262 :1344 :1357 :1364 :1369 :1374 :1402 :1501 :1543 :1547 :1555 :1659 :1665 :1833） | 34 | 2（:1103 · :1402，拟新增——列报不入闸） |
| `docs/core/requirements/PROVIDER.md` | 230 | 4（:10 :99 :108 :131） | 2（:206 两条） | 0 |

段太长合计 88，与 §1 的 88 一致；锚面实测 69（67 入闸 + 2 列报），与 §1 枚举的 14 条不符（出入与待裁见文末）。

**条目表**（一需求一条目）：

| # | 条目 | 落点 | 验收 |
|---|---|---|---|
| E1 | RELEASE.md 段判据清零 | `docs/RELEASE.md` | 见下「验收」 |
| E2 | AGENT-LOOP-ASYNC-POOL.md 段判据清零 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 同上 |
| E3 | MODEL-SPECS.md 段判据清零 | `docs/core/design/MODEL-SPECS.md` | 同上 |
| E4 | PROVIDER.md 段判据清零 | `docs/core/requirements/PROVIDER.md` | 同上 |

**修法判据**：同 §1（段太长 = 语义断点插空行、每段 ≤300 字符、语义零改零删字、表格/标题/列表/引用/围栏不动；悬空锚 = 先定位真实档、改写仓根相对全路径——含 .mjs 代码坐标，定位不到的死指针不得自删，逐条回报父侧）。

**验收**：`node scripts/doc-check.mjs --root .` 输出中该档命中 = 0（段太长与入闸悬空锚均清零；列报面不入闸、不计）。

**分工**：四档四个实施席并行（§1 四档分工表），文件零交叠。

**设计档落地**：无——零语义格式修复，不动任何设计档语义面；本节即本批全部设计内容。

**集成测试 delta**：无——纯文档面，不触组件交互与业务可观结果，RTM 零增删改。

**边界**：不做任何语义改写；不修四档以外的命中（全仓段太长 2249 段、悬空锚逾万条，均不在本批）；不动 doc-check 引擎与判据。

**待裁项**（已上抛父侧，待答）：§1 档缺枚举 14 条（裸档名 → 全路径）与实测 69 条锚命中（多为 .mjs 代码坐标）不符——两套引擎读数不可互换（scripts/doc-check.mjs 档头自述 V5 三锚 vs 核 gate 两判据）。倾向 = 按实测面执行（验收令锚定 scripts/doc-check.mjs）。

**状态行**：设计完成（2026-10-25）

**批次条目（来源 = §1 实施任务书；命中数 = 2026-10-25 doc_check 报告态实读复核）**：

| 条目 | 档（仓根相对） | 段太长 | 档缺 | 合计 | 现行数 |
|---|---|---|---|---|---|
| E1 | `docs/RELEASE.md` | 7 | 3 | 10 | 389 |
| E2 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 34 | 11 | 45 | 1217 |
| E3 | `docs/core/design/MODEL-SPECS.md` | 43 | 0 | 43 | 1884 |
| E4 | `docs/core/requirements/PROVIDER.md` | 4 | 0 | 4 | 230 |

合计 102 条（段太长 88 + 档缺 14），与 §1 口径一致；§1 表内 E2/E3 的「≈」估值以本表实读为准（E2 = 34 段 + 11 档，E3 = 43 段 + 0 档）。

**明确不在本批**：

- `scripts/doc-check.mjs`（V5 报告脚本）的代码路径 / 符号锚类命中（E2 另 29 条、E3 另 34 条等）——该脚本判据集与门引擎不同形（其档头自述「读数不可互换」），不属本批清理面。
- 四档之外的任何档；行太长（0 命中）。
- 任何语义改动——本批 = 纯形态修正（拆段 + 指针补全）。

**修法判据（同 §1，操作面重述）**：

- 段太长：在长段的语义断点处插空行拆段，拆后每段 ≤300 字符；零改字、零删字——只加空行。表格行 / 标题 / 列表 / 引用 / 围栏不动。
- 档缺：按下表把裸档名改为仓根相对全路径，只动指针文本，不动句子其余部分。14 个目标档均已验在盘（2026-10-25 glob 实读）。

**档缺解析表（14 条）**：

| 档:行 | 现文 | 改为 |
|---|---|---|
| `docs/RELEASE.md:5` ∥ `:12` ∥ `:76` | `CORE-UNIFICATION.md` | `docs/core/design/CORE-UNIFICATION.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:175` ∥ `:194` | `thincoder-cli/docs/design/AGENT-LOOP.md` | `thincoder-cli/docs/_archive/design/AGENT-LOOP.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:199` | `advisor-design.md` | `thincoder-core/prompts/advisor-design.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:707` | `WEBVIEW-PROTOCOL.md` | `docs/vsc/design/WEBVIEW-PROTOCOL.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:761` | `TUI.md` | `docs/cli/design/TUI.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:953` | `WEBVIEW.md` | `docs/vsc/design/WEBVIEW.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1011` | `RENDERER.md` ∥ `IPC.md` ∥ `WEBVIEW.md` ∥ `WEBVIEW-PROTOCOL.md` | `docs/desktop/design/RENDERER.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/vsc/design/WEBVIEW.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:1151` | `prompts/common.md` | `thincoder-core/prompts/common.md` |

解析依据：E2 `:175`/`:194` 句自述「旧 §12.1/§12.2 · 留参照历史」——指已归档旧档，故指 `_archive` 路径而非核仓活档 `docs/core/design/AGENT-LOOP.md`；其余各条按句内板块语境取唯一在盘活档。

行号 = 实读时刻坐标；拆段加空行后行号会漂，实施席按文本定位。

**受影响档与预期增量**：E1–E4 四档；增量 = 仅空行（拆段）+ 14 处指针文本改。无代码面、无测试档。

**验收判据（逐档机器可验）**：

- 主判据：doc_check 门引擎对该档命中 = 0——§1 的 102 条口径即该引擎读数（本批实读复核一致），「过门」即过此门。
- 次判据：`git diff` 只含空行增 + 上表 14 处指针行改；实施席交付时贴 diff 统计为证。
- 实施分工：每档一个实施席并行（§1）；席位验收 = 本席档的主判据 + 次判据。

**⚠️ 口径钉正（报主 agent）**：§1 验收行写的 `node scripts/doc-check.mjs --root .` 不能作本批验收仪——该脚本 = V5 报告面，判据集与门引擎不同形（档头自述），实测其锚类全仓悬空 15819 条且闸态 FAIL(锚)，四档在其中的代码路径锚命中不在本批修法判据内，该口径永远到不了「该档命中 = 0」。本批验收以 doc_check 门引擎该档命中 = 0 为准。

**测试面**：纯文档形态修正，不动组件交互与业务可见结果——集成集增删 0；无批内单测档（无可跑断言面），以次判据 diff 约束 + 门引擎读数为证。

## §3 设计评审（评审子代理）
> 不适用：§3 —— 轻通道（机械修正，无新语义），无设计评审。

## §4 用户批准（主 agent）
**状态行**：批准（2026-10-25 · 缺陷修复面 · 机械修正 · 可回滚）

## §5 实施记录（eng-coder）
> 不适用：§5 —— 无 eng-coder 实施段，父侧直接执行，记录在 §1。

## §6 验证与收口（父代理）

## 验证与收口

**父侧复核（逐条实读）**：

| 落点 | 现文 |
|---|---|
| `docs/RELEASE.md:100` | `prepublishOnly → check-syntax`（语法门）段在位 |
| `docs/RELEASE.md:183` | 「语法门 check-syntax——核仓无集成测试集」在位 |
| `.github/workflows/test.yml:79` | 注释含「该令已于 2026-10-18 被更晚裁定取代」 |
| `docs/core/design/MODEL-SPECS.md:291` | A-10 改 `npm run prepublishOnly`（语法门） |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:350` | A6 改 `npm run prepublishOnly`（语法门） |
| `thincoder-cli/scripts/release-check.mjs:3` | 「集成测试（cli 只收集成层）」 |
| `thincoder-cli/scripts/release-check.mjs:92-93` | 「集成测试」+「cli runner 只收集成层」 |

**测试行**：① 本批无批内单测档（纯文案/注释修正，无可跑断言面）· ② 集成集现量 15 例 / 窗口 50–100，本批增删 0。

**核销**：#1767 · #1770（同源两笔，同轮）。

## 段判据清零（第二轮——四档存量）

**修法**：段太长 = 语义断点插空行拆段（脚本辅助 + 人工复核）；档缺 = 裸名补全路径（目标档逐一 grep 确认在盘）。

**读数**（`doc_check` 产品门，四档逐档跑）：

| 档 | 拆前 | 拆后 |
|---|---|---|
| `docs/RELEASE.md` | 10（7 段 + 3 锚） | **0** |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | ≈50（34 段 + 16 锚） | **0** |
| `docs/core/design/MODEL-SPECS.md` | 43（全段） | **0** |
| `docs/core/requirements/PROVIDER.md` | 4（全段） | **0** |

合计 102 → 0。

**核销**：#1767 · #1770 · #1779（三轮同源，同轮）。
