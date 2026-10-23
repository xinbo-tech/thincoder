# 2026-10-23 · 集成测试设计 = 设计交付物必项（业务修改必随动）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-23 · 来源 = 用户 2026-10-23 22:58「感觉不够，我觉得应该要求业务设计必须设计集成测试，业务修改也必须更改集成测试，应该把集成测试的设计作为设计的一项任务要求下去。」。
> 台账 = #1743（TESTING · 归批）。前情 = docs/batches/2026-10-23-branch-must-have-evidence.md §1（在途）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**用户裁定（逐字）**：2026-10-23 22:58「感觉不够，我觉得应该要求业务设计必须设计集成测试，业务修改也必须更改集成测试，应该把集成测试的设计作为设计的一项任务要求下去。」

**背景（同一晚的前半段）**：用户 22:53 报「集成测试用例和代码似乎都没写」。实读三端：CLI 无 `test/integration/` 目录；VSC `test/integration/files.mjs` = `export default []`；桌面 `test/files.mjs` = `[]`。清单头注写明「2026-09-28 全清重置（用户令）：存量测试全部退役」⇒ 清空后无人重建。

**用户的第一判断**：这不是代码漏写，是**提示词层面的原因**——查证成立：

| 层 | 现状 | 后果 |
|---|---|---|
| 提示词 `discipline-engineering.md:182` | 「A repo with no integration tests ⇒ the gate stays honestly empty-green」+ 一句报告行 | 空集被写成**合法稳态**；报一句就过门 |
| 提示词 `discipline-engineering.md:168` | 收口行三选一含 `none` | 对空集永远成立 ⇒ 空 ⇒ 报 none ⇒ 批关 ⇒ 还是空 |
| 提示词 `discipline-engineering.md:171` | 「a single change **adds no case** to the set」 | **明文禁止**单次变更加用例 |
| 需求 `TESTING.md` F10 | 「需变则出条目」 | 留有「不需变」的出口 |

**裁定 = 替换，不是加强**：集成测试设计升为**设计交付物的必项**；业务修改**必须**同步改集成测试。据此，上面第 3 行（禁止单次变更加用例）是旧规则，**整条删除**，不与新规并存——并存会让后来人按旧句放过。

**边界（不误伤）**：
- 窗口 50–100 仍是**上限约束**（超窗裁旧场景），不再是「不新增」的理由。
- 「单元测试档用毕即删」「单元↔集成不互转」两条不动——它们管的是单元侧。
- 「只断言业务可观察结果」「集成集只住三个前端」不动。

**已落（父侧笔）**：`docs/core/requirements/TESTING.md` 新增 **F29 集成测试设计 = 设计交付物必项**（第 198 行；gate PASS；连带把档内 7 处 `design/TESTING.md` 裸名补成全路径）。

**待办**：设计侧三处逐字文（删 `:171` 旧句 + 改 `:168` 收口行 + 补 `:182` 空集口径）+ `persona-eng-designer.md` 落笔格加一项「集成测试设计」。派设计席。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**

| # | 需求条 | 本批落点 | 状态 |
|---|---|---|---|
| 1 | `docs/core/requirements/TESTING.md:198` F29（集成测试设计 = 设计交付物必项；业务修改必随动） | 设计 §6.47 B1–B4（三处提示词 + 设计席模板） | 覆盖 |
| 2 | F29 的收口条件（「集成场景无变化」只在改动未触及业务行为时成立） | 设计 §6.47 B1（`none` 条件） | 覆盖 |
| 3 | F29 的空集欠账口径（空集 = 欠账；现量 vs 窗口；台账行） | 设计 §6.47 B3 | 覆盖 |
| 4 | F29 的窗口口径（50–100 = 上限，超窗裁旧场景，不是不新增的理由） | 设计 §6.47 B2 | 覆盖 |

**不在本批（显式排除）**：需求档零改（F29 已由父侧落；`docs/core/requirements/METHODOLOGY.md` 的随正 = 上抛）· 单元测试四条零改（用毕即删 / 不互转 / 只断言业务可观察结果 / 实施者自写自跑）· F10 流程句零改（F29 只关「不需变」出口）· 三端集成集不重建（本批立规；欠账按新规由各端业务批补）· 不新增脚本 / CI / 机检门 · 不改产品代码。

**设计档落点**：`docs/core/design/PROMPT-SYSTEM.md` §6.47（逐字英文块 B1–B4 + 中文复核面 + 落点表 + 验收 A1–A6 + 用例表 C1–C6 + 关键决策 K1–K6 + 既有件三问 + 勘察证据行）。

**机制设计（一句话）**：设计层加第 9 项「集成测试设计」（场景 + 业务可观察判据 + 需求回指）；收口层的 `none` 加条件（仅未触及业务行为时成立）；空集从「诚实空绿」改判为欠账（现量 vs 窗口 + 台账行）；窗口 50–100 保持上限语义（超窗裁旧场景）。详见设计 §6.47。

**受影响文件与测试覆盖**

| 文件 | 现行 | 动作 | Δ |
|---|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 327 行 / 40,402 字符 | L1 `:168` 整替 · L2 `:171` 整替 · L3 `:182-183` 整替 | +4 行 ⇒ 331 |
| `thincoder-core/prompts/persona-eng-designer.md` | 142 行 / 18,006 字符 | L4 计数两处（`:106` / `:118`）· L5 插入 item 9（`:129` 后） | +2 行 ⇒ 144 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,351 行 / 287,837 字符（本节写入前） | 新增 §6.47 | 设计档面 |

测试覆盖：提示词面无机检门；验证 = ① 旧句四串各 0 次（A2）· ② 新串计数三串各 1 次 + `8 items` 0 次（A3）· ③ 两档逐行 ≤300（A4）· ④ `node scripts/prompt-refs-check.mjs` 命中 0（A5）· ⑤ `doc_check` gate 首行 PASS（A6）。无单元测试档——提示词文本改动，无执行面。

**验收对照（回指设计 §6.47 验收表）**

| 本批验收 | 设计回指 | 判法 |
|---|---|---|
| ① 三处提示词改动各给英文逐字块 + 中文复核面 | §6.47 A1 | 在盘 |
| ② `discipline-engineering.md:171` 旧句整条删除、零残留 | §6.47 A2 | 四串各 0 次 |
| ③ 设计席落笔格加「集成测试设计」项 | §6.47 A3 | 三串各 1 次 · `8 items` 0 次 |
| ④ `doc_check` PASS | §6.47 A6 | 首行 `DOC-CHECK GATE: PASS` |
| ⑤ 回报「需求条 → 改动 file:line」逐条表 | 本段 + 交付报告 | 逐条 |

**关键决策**：详见设计 §6.47 K1–K6——K1 窗口在 `:171` 原地改写为上限规则（不删空，`:176` 的 `their budget` 需要所指）· K2 `none` 加条件不取消 · K3 报告行保留 + 台账行 · K4 独立 item 9 · K5 双面形 · K6 窗口数字留提示词层。

**协调项**：与在途批 `docs/batches/2026-10-23-branch-must-have-evidence.md` 同档不同区——该批落 `persona-eng-designer.md:122-123`（item 1 bullet），本批落 `:106` / `:118` / `:129` 后；无文本重叠，实施次序任一先落均可。

**上抛项（待裁）**：① `docs/core/requirements/METHODOLOGY.md:91` 记「设计档 8 项之①（`thincoder-core/prompts/persona-eng-designer.md:62`）」——计数 8 与行号 `:62` 均随本批失效（现盘 item 1 在 `:119`），需求档笔 = 父侧；② `docs/core/design/PROMPT-SYSTEM.md` 旧节内「8 项」引用十处（`:137` `:643` `:647` `:651` `:2362` `:3146` `:3170` `:3233` `:3303` `:3330`，现盘读数）为各节当批决策记录，全档数面 sweep 是否另轮 = 父侧裁；③ 本节未加 §7 D-PS 行——§6.46 在途未占号，D-PS46 / D-PS47 归属父侧收口时定；④ 需求 F9 要求每批收口测试行带窗口读数，本批按派单落在 B3 空集规则；非空集的逐批窗口读数是否也进收口行 = 父侧裁。

**修正轮（评审 #13 处置 · 轮次 2 · 2026-10-23）**

评审 §3 九条逐条落地，全部改在设计 §6.47；不动提示词档、不动需求档、不改 §6.47 以外的节。

| 评审 # | 处置 | 落点（设计 §6.47） |
|---|---|---|
| 1 🔴 | B1 ② 补窗口读数——每批收口都报「集成集现量 vs ≈50–100」，空集批与实集批同一载体；A7 增 F9 回指验收条；上抛项 F9 条删除 | B1 · A7 · 上抛项 |
| 2 🟡 | A2 补 `gate stays honestly empty-green` 零残留串，并加三处替换锚各 1 次的判法 | A2 |
| 3 🟡 | B3 英文块定死台账行频次与范围（每仓一行、首次报空集时登记、债未清前不逐批重立）；中文复核面、C4、K3 随正 | B3 · C4 · K3 |
| 4 🟡 | B1 ① 兼写单元测试档清单与一行读数 | B1 |
| 5 🟡 | 勘察行补 `docs/core/design/TESTING.md:52` `:67` `:97` `:283` 实读（F9 窗口读数在案且与本批同向、要删的旧句该档零副本）；L6 零改面列入该档 | 勘察行 · L6 |
| 6 🟡 | §6.47 内 F29 全部改 F34（标题 / 来源 / 机制第 5 条 / 验收头 / C6 / K4 / 勘察行）；不再用限定形 | 全节 |
| 7 🔵 | 标题改为「两档提示词 · 四处落点」 | 标题 |
| 8 🔵 | B1 ② 补用例档落点 `test/integration/`；C1 随正 | B1 · C1 |
| 9 🟡 | 协调项（非缺陷）：METHODOLOGY 计数随正与档内数面 sweep 仍归父侧，本修正轮未动 | 上抛项 |

**盘面重读**：兄弟批 `2026-10-23-branch-must-have-evidence` 已在两档落笔（工作树 +4 行/档），§6.47 全部坐标按新盘面重读——discipline `:172` / `:175` / `:186-187`；persona item 1–8 = `:119-133`，B4 插入点 `:133` 后。受影响文件读数随正：discipline 331 行 / 41,270 字符；persona 146 行 / 18,815 字符；advisor-design 131 行 / 13,954 字符（L6 零改面）。预期改后：discipline 338 行（+4 / +1 / +2），persona 148 行（+2）。

**本批条目（修正后口径）**：需求条 = `docs/core/requirements/TESTING.md:198` **F34**（集成测试设计 = 设计交付物必项；业务修改必随动）——原表记的 F29 同指该行，编号随父侧改号更正为 F34；覆盖面与状态不变（四条均覆盖）。

**新增上抛项**：`docs/core/requirements/TESTING.md:198` 的「与 F10 的关系」格内仍写「F29 定**必做**」——该行已改为 F34，此处指代随同失效（同档 `:220` 的 F29 是 RTM 条）；需求档笔 = 父侧。

**闸读数**：`doc_check(mode:"gate", target=D:\teamcode\thincoder, docs=[docs/core/design/PROMPT-SYSTEM.md])` ⇒ 首行 `DOC-CHECK GATE: PASS`（1 档全清；中途中 1 条 `design/TESTING.md` 裸名锚缺，已在同轮修正为全路径）。

**修正轮（实施席 #17 上抛 🔴 处置 · 轮次 3 · 2026-10-23）**

**上抛**：advisor 代码评审第 1 轮 🔴——B3 围栏的台账行写 `one ledger row per repo`，与需求 N20（`docs/core/requirements/TESTING.md:114`：集成集只住三个前端；核仓不设集成集）相抵：按仓计，本项目会立 1 行（三前端同住一仓），核仓还会背一条永远结不清的行。

**用户裁定（经父侧转达，本席执行）**：提示词是**通用产品文本**，不能绑到 thincoder 自己的项目结构上——「三个前端入口」与「核仓不设集成集」都是本仓事实。B3 的计量单位 = **集本身**：`books a ledger row for the integration suite this project is missing`（单数 = 缺的那一套；一个项目缺一套就一行）；频次句只说「套」，不说仓 / 端。**本批验收 ① 口径随此裁定改为「B3 计量单位 = 集本身」**（不再按仓 / 端）。

**B1 ② 检查（派单要求）**：原句尾为 `each case file lands under the project's test/integration/ directory.`——`test/integration/` 是本仓目录约定（需求 F30 `docs/core/requirements/TESTING.md:221` 的坐标 ∥ N2），不是通用惯例 ⇒ 改为 `the project's integration test directory`。判断依据 = 本档既有口径 `docs/core/design/PROMPT-SYSTEM.md:298`：「新文零具体项目实例（`test/` 为通用约定名——定稿原词）」——`test/` 留（通用约定名），`integration/` 层级清（项目实例）。

**改动（设计 §6.47 · file:line · 改后盘面）**

| # | 位置 | 动作 |
|---|---|---|
| 1 | `docs/core/design/PROMPT-SYSTEM.md:3313` | B3 首行：计量单位 repo ⇒ 集本身（`a ledger row for the integration suite this project is missing`）；频次句 `:3314` 逐字不动 |
| 2 | 同档 `:3298` | B1 ② 行尾：`test/integration/` ⇒ `the project's integration test directory` |
| 3 | 同档 `:3293` / `:3310` | B1 / B3 落笔指令随正（B1 只改 `:174` 行；B3 `:191-194` 四行整替、仅首行改写） |
| 4 | 同档 `:3330` / `:3335` | 中文复核面 B1 / B3 随正 |
| 5 | 同档 `:3346` / `:3348` | 落点表 L1 / L3 坐标与动作随正（均 ±0 行） |
| 6 | 同档 `:3366` / `:3367` | 新增 A8（B3 计量单位 = 集本身：正串各 1 · 旧串 0）∥ A9（B1 ② 项目中性：`test/integration/` 0 次） |
| 7 | 同档 `:3373` / `:3376` / `:3395` | C1（本仓实例标注）/ C4 / K3 随正——K3 写明「提示词 = 通用产品文本，不绑仓 / 端」 |
| 8 | 同档 `:3384` | 受影响文件 discipline 行读数随正（338 行 / 42,234 字符 / max 300；Δ = L1 ② + L3 首行重落 ±0） |

**B3 围栏（英文逐字 · 改后）**

```text
- **A missing integration suite is a debt, not a steady state**: an empty set passes nothing — the closeout reports the count against the window (`0 / 50–100`) and books a ledger row for the integration suite this project is missing.
  The row is booked once, at the first closeout that reports the empty set; later batches do not re-book it while the debt stands.
  Report line: "not integration-test verified — the parent-side closeout run is the only integration-test run."
  Why: a gate assembled out of unit files says only that something is green, not that the release is; the report keeps the debt visible while the row keeps it scheduled.
```

**验收读数（本席实跑 · 设计档面）**：① B3 四行 233 / 130 / 111 / 169 字符（≤300）；B1 ② 195 字符；② B3 围栏块内 `per repo` 0 次 · `test/integration/` 0 次；③ `doc_check(mode:"gate", docs=[docs/core/design/PROMPT-SYSTEM.md])` ⇒ 首行 `DOC-CHECK GATE: PASS`（1 档全清）。A8 / A9 是**落地后判法**——待实施席按新围栏重落 B1 ②（`:174`）∥ B3（`:191-194`）后由父侧复跑；本席未改提示词档。

**派单坐标更正（一致面 · 报告）**：派单把「A repo = one git repo」记在 `docs/core/requirements/TESTING.md:246`、把「the core carries no integration suite」记在 `:182`——实读两处都在提示词档：`thincoder-core/prompts/discipline-engineering.md:246` ∥ `:182`（需求档同坐标分别是外部源表行与 harness 节文字）。结论不受影响，记录备核。

**观察（非本批面 · 未动）**：判定句「A repo = one git repo」本身（`thincoder-core/prompts/discipline-engineering.md:246`）与 B2 的 `a repo's suite budget`（同档 `:179`，需求 N19「一仓 50–100」同口径）仍以「仓」为单位；派单明令 B2 不动。若「提示词项目中性」也适用于这两处，属另轮裁定。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · §6.47 集成测试设计必项 ∥ 需求 F29 对齐（含 F9 窗口读数复核）

评审对象 = 设计 §6.47（`PROMPT-SYSTEM.md:3264-3419`）∥ 需求 `TESTING.md`（全档）。审查重点（派单指定）＝ F9 窗口读数是否仍覆盖非空集批次 —— **答：不覆盖**（见第 1 条）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🔴 | B1 目标文本（`:3296`）的 ② 只要求报「本批新增 ∥ 修订的集成用例名」；窗口读数只出现在 B3 空集条款（`:3311` 的 `0 / 50–100`）。需求 F9（`TESTING.md:80`）要求**每批**收口测试行带窗口读数（守闸读数、零新增簿记、漏填 = 记录可见缺口），§1.3 执行形（`TESTING.md:66`）明写「两闸守闸动作挂收口测试行（F9 ②半 = 集成影响 ∕ 窗口读数）」。设计自己的上抛项（`:3419`）把这个缺口记成「父侧裁」——即落地后非空集批次无窗口读数，而 B2 的上限规则（`:3304`「over the window, trim old scenarios」）恰在非空集批次才需要读数触发。验收表（`:3352` 起）也不含 F9 回指条。 | 在 B1 的 ② 内补窗口读数（如「② the integration set as it now stands against the ≈50–100 window, plus the cases this batch added ∥ revised, by case name」），同步 `:3327` 中文复核面与用例表增一行；或先改需求 F9 再落笔（改后它才不再是本批必须满足的条）。 |
| 2 | Acceptance criteria | 🟡 | A2（`:3357`）只扫 `Permanent, a single change` / `adds no case to the set` / `per-change additions` / `trim rather than add` 四条零残留——这覆盖 L2 的旧句，但 L3 整替的旧文（F3 于 `:3276` 引的 `**A repo with no integration tests ⇒ the gate stays honestly empty-green**`）没有任何零残留串。旧行留着，A2 仍读作通过。 | A2 补 B3 侧残留串（如 `gate stays honestly empty-green`），或加一行「三处替换锚各 0 次」逐块 grep 读数。 |
| 3 | Clarity | 🟡 | B3（`:3311`）「books a ledger row to build the set」未定频次与范围：字面读作每次收口都立行，K3（`:3389`）却说「一次性欠账登记」；N20（`TESTING.md:114`）把集成集限定在三前端仓 ⇒ 每仓一行 ∥ 每批一行未定。K5（`:3391`）定「英文块 = 唯一权威目标形」，歧义随落地进提示词，并与 F9「零新增簿记」相抵。 | 在英文块内定死（每仓一行、集非空前的首次登记、不逐批重立），中文复核面与 C4 随正。 |
| 4 | Requirements coverage | 🟡 | B1 ①（`:3296`）把收口行前半重述为「一行验证读数」；F9 ① 半（`TESTING.md:80`）＝「本批单元测试档清单（用毕即删——批档 §5 留一行读数）」——用例档清单这项义务在落地文本里没有承载面，L6（`:3348`）又声明其余面零改。 | ① 兼写清单与读数，或在 §6.47 记一句清单义务的承载面（如批档 §5）——若确实只留读数，写明是记录面转移。 |
| 5 | Survey evidence / Document ownership | 🟡 | 勘察证据行（`:3400-3410`）未查 `docs/core/design/TESTING.md`——而 `TESTING.md:4` 指名它是「集成测试集承载 ∕ 分层表」的设计层权威档；落点表 L6（`:3348`）列零改面时也漏了它。本批要删的「a single change adds no case to the set」与空集合法稳态两种读法都可能在该档复述。 | 勘察行补 `docs/core/design/TESTING.md` 的实读（相关 ∥ 无相关副本）；若该档复述了任一条，列入落点表或上抛项。 |
| 6 | Document ownership（doc state） | 🟡 | 需求档 `TESTING.md` 内 **F29 定义两次**：`:198`（集成测试设计 = 设计交付物必项）∥ `:220`（RTM 存在且随交付）。§6.47 标题（`:3264`）与验收头（`:3352`）都写「回指 F29」不带限定，只有来源行（`:3266`）用行号消歧。 | 记录即可（需求档非本席可改）：两个 F29 之一改名，或把 §6.47 内每处 F29 改为带限定形（F29（§6.1 条 · `TESTING.md:198`））。 |
| 7 | Clarity | 🔵 | 标题（`:3264`）「三处提示词 + 设计席模板」，但 B1–B3 同落 `discipline-engineering.md` 的 `## Testing discipline` 一节，只有 B4 触第二档——只读标题会去找第三个提示词档。 | 改成「两档提示词 · 四处落点」之类，或标题只述主题、数量交给落点表。 |
| 8 | Requirements coverage（traceability） | 🔵 | B1 ② 与 B4 都没说集成用例档本身落哪：需求 F30（`TESTING.md:221`）给了坐标 `test/integration/<场景名>.test.mjs`；按现设计，一批可以设计 item 9、收口报用例名（B1 ②）而从不落可执行用例，落地文本无一被违。 | 在 B1 ② 补落点（本批把用例档落进项目集成测试目录），或在 §6.47 记一句「用例落笔不在本批射程」的理由。 |
| 9 | Coordination | 🟡 | 上抛项（`:3416` / `:3417`）留两处计数滞后未结：`docs/core/requirements/METHODOLOGY.md:91` 仍写「设计档 8 项 … `:62`」；本档内 11 处「8 项 ∥ 8 items」引用（自注为各批决策记录）。 | 协调项（非缺陷）：METHODOLOGY 行随本批需求面带一次；档内历史引用是否 sweep 由父侧定。 |

**计数**：🔴 1 · 🟡 6 · 🔵 2。

**评审范围与限制（自述）**：受派单限定只读上述两档——(a) 无文档地图（评审上下文未提供 `docs/README.md`），第 7 条「文档归属」按 Project Guide 降级判断；(b) 受影响文件表（`:3376-3379`）的 327 / 142 行等读数未在射程内抽样，标 `unverified`；(c) 无项目标准档，方法学按 Project Guide + 评审判据判。

**结论**：设计档在盘（§6.47 形制齐：来源 / 缺的那一半 / 机制 / 双面逐字块 / 落点表 / 验收 / 用例表 / 关键决策 / 先例 ∥ 偏离 / 既有件三问 / 勘察证据行），先例行与勘察行齐备；唯一阻断项 = F9 窗口读数在非空集批次上没有承载体。

VERDICT: changes-required

### 轮次 2（评审子代理）

## 第 2 轮复核（上轮 9 条逐条核 · 现行盘面 2026-10-23 实读）

**焦点答案**：F9 窗口读数现已在**每批**成立（B1 ② `:3298`）——上轮 🔴1 已修。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/PROMPT-SYSTEM.md | 🔴 | Fixed | B1 ② `3298`: `   ② the integration set as it now stands against the ≈50–100 window, plus the cases this batch added ∥ revised, by case name — each case file lands under the project's `test/integration/` directory.` — 非空集批也有窗口读数；中文面 `3330`、C1 `3371`、新验收 A7 `3365`（grep 恰 1 次）三处随正；F9（requirements/TESTING.md:80 双半）两半均落地。 |
| 2 | 2 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | A2 `3360` 零残留串已含 `gate stays honestly empty-green`，并钉三处替换锚各 1 次。 |
| 3 | 3 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | B3 `3313` 「books one ledger row per repo」+ `3314` 「The row is booked once, at the first closeout that reports the empty set; later batches do not re-book it」——频次与范围在英文块内定死；K3 `3393` 与 C4 `3374` 同向。 |
| 4 | 4 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | B1 ① `3297` 恢复清单义务：`① this batch's unit test files named, with one verification reading (what was verified ∥ command ∥ result).`；A7 `3365` 以 `unit test files named` 恰 1 次钉住。 |
| 5 | 5 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Fixed | L6 `3351` 已列入 `docs/core/design/TESTING.md`（「F9 窗口读数在案且同向、旧句零副本」）；勘察行 `3410` 给出 `:52`/`:67`/`:97`/`:283` 实读。该档不在本轮声明评审范围内 ⇒ 其行内容本轮 unverified。 |
| 6 | 6 | docs/core/requirements/TESTING.md | 🟡 | Fixed | `198: \| F34 \| **集成测试设计 = 设计交付物必项**…`，同格「与 F10 的关系」已写「F34 定**必做**」；RTM 条仍为 `220: \| **F29** \| **RTM 存在且随交付** \|` ⇒ 重号消解；§6.47 内引用全部改 F34。 |
| 7 | 7 | docs/core/design/PROMPT-SYSTEM.md | 🔵 | Fixed | `3264: ### 6.47 集成测试设计 = 设计交付物必项（两档提示词 · 四处落点 · F34）`。 |
| 8 | 8 | docs/core/design/PROMPT-SYSTEM.md | 🔵 | Fixed | B1 ② 末句给用例档落点 `test/integration/`；与 F30（`requirements/TESTING.md:221`）∥ N2（`:105`）坐标一致。 |
| 9 | 9 | docs/core/design/PROMPT-SYSTEM.md | 🟡 | Accepted | 父侧协调项仍按声明挂着（`3419-3424`：METHODOLOGY.md:91 计数、档内十一处「8 项」引用、D-PS 编号归属）——越出本设计写权，声明即处置，非缺陷。 |
| 10 | (new) | docs/core/design/PROMPT-SYSTEM.md | 🟡 | New | 上抛项 #4 已过期：`3424: - 〔父侧 · 需求档残留〕`docs/core/requirements/TESTING.md:198` 的「与 F10 的关系」格内仍写「F29 定**必做**」——该行本批已由 F29 改为 F34，这处指代随同失效（同档 `:220` 的 F29 是 RTM 条，不是它）；需求档笔 = 父侧。`，而现行需求格已是「F34 定**必做**」——记录中的残留已不存在。报告即止：删/关该行。 |
| 11 | (new) | docs/core/design/PROMPT-SYSTEM.md | 🟡 | New | K6 的理由句与自家目标形相抵：`3396: \| K6 \| 50–100 的数字留在提示词面 \| 该数字在提示词层只此一处；移走会让窗口在上限意义上无读数 \|`，但落地块里该数出现三处（B1 `:3298` `≈50–100 window` ∥ B2 `:3306` `≈50–100 cases` ∥ B3 `:3313` `` `0 / 50–100` ``）。风险：实施席把「只此一处」读成去重令，把 B1 的读数删掉 = 反向撤 🔴1 的修复。改理由句（数字留在提示词面 = 三条规则各自自足）或删基数句。 |
| 12 | (new) | docs/core/design/PROMPT-SYSTEM.md | 🔵 | New | 上抛项 #2 坐标表部分失真：`3422: - 〔父侧 · 设计档数面〕本档旧节内的「8 项」/「8 items」引用十一处（`:137` `:643` `:647` `:651` `:2362` `:3146` `:3170` `:3233` `:3248` `:3460` `:3487`，本席 2026-10-23 实读）…`——`:3460` 是 D-PS32 行、`:3487` 是 `**功能点**：`，均无该串；区间内实际命中在 `:3465`（D-PS37「设计席人格 8 项 item 1」）。只作读数，随父侧 sweep 一并处理。 |
| 13 | (new) | docs/core/requirements/TESTING.md | 🔵 | New | §6.1 计数与表体不符：`191: **9 条**：` 对 10 行条目（`:194` F23 · `:195` F26 · `:196` F27 · `:197` F28 · `:198` F34 · `:199` N14 · `:200` N15 · `:201` N16 · `:202` N17 · `:203` N18）。存量问题（F 行改名前即存在），报告即止。 |

**计数**：Fixed 8 · Accepted 1 · New 4（🟡 2 / 🔵 2）· Unfixed 0 · 未决 🔴 0。

VERDICT: pass

### 轮次 3（评审子代理）

### 设计评审 · §6.47 B3 围栏 / B1 ② 尾句 / A8·A9（第 3 轮 · 项目中性验证）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 内部一致性 | 🔴 | B3 围栏 `:3313-3314` 的计量仍是项目单数：`:3313` 写 "books a ledger row for the integration suite this project is missing"、`:3314` 写 "The row is booked once, at the first closeout that reports the empty set"；而本节 K3 `:3395` 断「台账行 = **每套缺失的集成集一行**」、C4 `:3376` 按套判（"台账行每套缺失的集成集只立一次"）。提示词自身是复套模型（抽读 `thincoder-core/prompts/discipline-engineering.md:182` "Integration suites live in the front-end entry points only"），本仓三前端套件现全空（本档 `:3416`）——照围栏逐字落，三空套只立一行。K3 用来论证改单位的 N20 落点也仍未关：B3 无「本项目结构上不设套」的边界，而需求 `docs/core/requirements/TESTING.md:114` 明「核仓（`thincoder-core` ∕ `thincoder-render-core`）不设集成测试集」。 | 定死一个基数并在 `:3313-3314` 编码（每套一行、逐套点名、只立一次；或显式声明项目级一行），并令 K3 / C4 与之一致；若取每套，补「本项目结构上不设套」的边界，或指向已有承载该边界的那一行。 |
| 2 | Clarity（落笔指令） | 🟡 | L1 `:3346` 把 B1 ② 的 Δ 写成「（`test/integration/` ⇒ `the project's integration test directory`）」，但它所指的行已含该短语——抽读 `thincoder-core/prompts/discipline-engineering.md:174` = "each case file lands under the project's `test/integration/` directory."。照 L1 字面替换得叠句（"the project's the project's integration test directory directory"）；A9 `:3367` 对该叠句仍读作 1 次命中（子串），指令与验收都不拦这条错落。 | 把 Δ 写成整短语替换（"the project's `test/integration/` directory" 整段），并给 A9 一条能死在叠句上的读数（如重复前缀扫 0，另加 §6.1 围栏逐段比对）。 |
| 3 | Acceptance criteria | 🟡 | A8 `:3366` 声明「计量单位 = 集本身，不绑仓 / 端」，但其四项读数全是词形扫描（新串 1 次 · `one ledger row per repo` 0 · `A repo with no integration tests is a debt` 0）。项目单数基数（即现围栏形）四项全过 ⇒ 该条抓不到 #1 的缺陷。 | 加一条按基数判的读数（一项目两套缺失 ⇒ 两行且逐套点名；或对选定的复数 / 分配形态加扫描）。 |
| 4 | Requirements（读数粒度） | 🟡 | 删了量词却没给替代粒度：B1 ② `:3298` 写 "the integration set as it now stands against the ≈50–100 window"、B3 `:3313` 写空集 "reports the count against the window (`0 / 50–100`)"，而同节已落的 B2 `:3306` 仍写 "a repo's suite budget stays ≈50–100 cases"；需求 F9（`docs/core/requirements/TESTING.md:80`）要「本仓集成测试集现量 vs 50–100 窗口」、N19（`:113`）定「一仓 **50–100 用例**」、N20（`:114`）又把三套分住三前端。三空套时，落笔面读不出 `0 / 50–100` 是按套还是按仓。 | 该节只用一种粒度并让 B1 ② / B3 同词；若窗口仍按仓（N19），写明这一句、只把欠账行按套计。 |
| 5 | Clarity（B1 ② 覆盖） | 🔵 | "the project's integration test directory"（`:3298`）已脱仓名，但在一项目多包各持一套时未定所指（N20 `:114`；F30 `docs/core/requirements/TESTING.md:221` 钉 `test/integration/<场景名>.test.mjs`）——包内收口要自猜「project's」指哪一层。 | 可选：改为相对该套所属包 / 入口命名（仍不带本仓字面）。 |
| 6 | Doc state（数字漂移） | 🔵 | 同节两处「现盘实读」对同一档给出不同读数：`:3384` "338 行 / 42,234 字符" 对 `:3415` "discipline 331 行 / 41,270 字符"（§6.46 `:3220` 又为 327 行）；抽读该档 = 339 行（本档 `:3225` 自述 ±1 计数差）。 | 每轮只留一个现读；旧的标为历史。 |
| 7 | Requirements（F9 簿记） | 🔵 | B3 新增的台账行不在 F9 收口行的枚举内——`docs/core/requirements/TESTING.md:80` 把该行定为双半，"守闸读数、零新增簿记" 写在窗口读数格内。K3 `:3395` 对这句的读法（只修饰窗口读数）文本上站得住，本条不拦。 | 无（读法已获接受，仅记档）。 |

**已验证项（不构成问题）**：A9 的零命中可达成——`thincoder-core/prompts/discipline-engineering.md` 全档 `test/integration/` 仅 `:174` 一处（抽读实扫），落 L1 后为 0；B3 `:3315` 报告行与需求 F2（`docs/core/requirements/TESTING.md:73`）逐字一致；先例行 / 勘察证据行 / 既有件三问均在节内（`:3400` `:3406-3417` `:3404`）；落点仍在拥有该主题的档（`docs/README.md:51` 提示词系统 = `PROMPT-SYSTEM.md`）。

**计数**：🔴 1 · 🟡 3 · 🔵 3（共 7 条）

**VERDICT: changes-required**

## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户 2026-10-23 22:55「自动跑完」+ 23:00「也自动跑完」= 两批全链授权（FR36）。

**评审轨迹**：
- 第 1 轮（`#13`）：changes-required —— 🔴1（F9 窗口读数在非空集批次无承载体）/ 🟡6 / 🔵2。
- 修正轮（`#15`）：9 条全落；B1 ② 补窗口读数；需求条号 F29 → F34（父侧改）。
- 第 2 轮（`#16`）：**pass** —— 8 Fixed · 1 Accepted · 4 New（🟡2/🔵2，均报告级）· 未决 🔴 0。

**批准结论**：进入实施。实施面 = 两档提示词五处落点（B1–B3 落 `discipline-engineering.md`；B4 落 `persona-eng-designer.md` + 两处计数 8→9）。

**实施必须注意（评审 🟡11 的风险）**：K6 的理由句「50–100 的数字在提示词层只此一处」是**旧前提**——本批落地后该数在 B1 ②（读数）∥ B2（上限）∥ B3（空集读数）三处出现，**这是正确的**。实施席**不得**据此去重、不得删 B1 的窗口读数；围栏块逐字为准。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四处落点已落并验；B3 单位面按父侧裁定等新围栏重落）



**实施（eng-coder · 2026-10-23 23:20 前后）**

**落点（块 → file:line）**

| 块 | 落点 | 行数 | 判等 |
|---|---|---|---|
| B1 | `thincoder-core/prompts/discipline-engineering.md:172-176`（整替原 `:172`） | 5 | 与围栏逐行一致 |
| B2 | 同档 `:179-180`（整替原 `:175`） | 2 | 逐行一致 |
| B3 | 同档 `:191-194`（两行整替为四行） | 4 | 逐行一致 |
| B4 | `thincoder-core/prompts/persona-eng-designer.md:134-135`（插在 item 8 后） | 2 | 逐行一致 |
| L4 | 同档 `:106` ∥ `:118` 计数 `8` ⇒ `9` | ±0 | — |

围栏源 = `docs/core/design/PROMPT-SYSTEM.md:3296-3300` ∥ `:3306-3307` ∥ `:3313-3316` ∥ `:3322-3323`；13/13 行逐字比对一致（`node` 一次性脚本，两次读盘逐行 `===`）。

**计划外改动（已声明 · 同语义面）**：`thincoder-core/prompts/persona-eng-designer.md:73` ∥ `:103` 的 `the 8 output items` ⇒ `9`。
理由 = D3（计数与清单同步）——不改则同档「说 8、列 9」；设计落点表只枚举 `:106` ∥ `:118`，验收 A3 的零命串 `8 items` 抓不到 `8 output items`。两处行数 ±0、语义零变。

**验收读数（本席实跑）**

- A1：四块 13 行与围栏逐行一致。
- A2：旧句五串各 0（`Permanent, a single change` ∥ `adds no case to the set` ∥ `per-change additions` ∥ `trim rather than add` ∥ `gate stays honestly empty-green`）；三替换锚各 1。
- A3：`9. **Integration test design**` 1 · `**Design doc 9 items**` 1 · `design doc 9 items` 1 · `8 items` 0 · `8 output items` 0。
- A4：discipline 338 行 / max 300 / >300 = 0；persona 148 行 / max 298 / >300 = 0。
- A5：`node scripts/prompt-refs-check.mjs` ⇒ 提示词面 70 档 · 代码面 465 档 · 命中 0。
- A6：`doc_check(mode:"gate", docs=[两档提示词])` ⇒ 首行 `DOC-CHECK GATE: PASS`（2 档全清）。
- A7：`against the ≈50–100 window` 1 · `` `0 / 50–100` `` 1 · `unit test files named` 1。

**禁区词读数（按词面计 · 非 0）**：新增 13 行扫 `never|must not|do not|don't|forbidden` = 1 命中，落 `thincoder-core/prompts/discipline-engineering.md:192` 的 `do not re-book`。
处置 = 按 `docs/core/design/PROMPT-SYSTEM.md:964-965` 的口径登记为**保留位**（台账行生命周期的机制事实，非祈使禁令）；改写一字即破 A1 逐字判等 ⇒ 不改。

**审计与评审轮次**

- 内部 explore 审计（1 轮）：13/13 逐行一致 · A2/A3/A4/A7 pass · 无静默简化 · 1 项计划外（即上面两处计数）。
- advisor 代码评审（1 轮）：changes-required —— 🔴 1（B3 的「repo」单位 ∥ 需求 N20 ∥ 同档 `:246` 的 `an end ≠ a repo`）· 🟡 4 · 其中 1 项 🟡 经复核不成立（`test/` 与 `test/integration/` 为包含关系，`docs/core/requirements/TESTING.md:121` 已定单收集根 + 寿命分界）。
- 修复轮：0 —— 🔴 的修复面落在设计围栏（设计席笔），已上抛待裁；其余 🟡 为记录面。

**terminal state**：stalled —— 唯一未决 = B3 的单位面（等父侧裁：改设计围栏后重落 ∥ 按现文收口并在 §6 写口径）。

**裁定（父侧裁 (a) · 2026-10-23）**：改设计围栏 B3 的作用域 = 三个前端入口各一行（cli ∥ vsc ∥ desktop），不是仓、也不是端。
本席动作 = **保持现状**：`one ledger row per repo` 留盘，不改词、不删空；其余四处落点与两处计划外计数**不回滚**；新围栏到达后只重落 B3 一块，再复跑 A1–A7 读数。

**待办（本席 · 未完成）**：等新围栏 → 重落 B3 → 复跑读数 → 报告。

**FYI（随设计席改围栏时一并看，不属本席写权）**：窗口单位同面 —— `docs/core/requirements/TESTING.md:113` N19 写「一仓 **50–100 用例**」，B2 落地的 `a repo's suite budget stays ≈50–100 cases` 承它；与 N20「三前端各一集」并用时，窗口是每仓合计还是每端各一，英文面读不出。是否随 B3 一并把单位写明，归设计席。

## §6 验证与收口（父代理）

**核销同步（主 agent）**

**落地面（实读）**：
- `thincoder-core/prompts/discipline-engineering.md:172-176`（B1 五行）· `:179-180`（B2 两行）· `:191-194`（B3 四行）—— 基数 = **每套缺失的集成集一行**、逐套点名、每行只登记一次；窗口读数每批带。
- `thincoder-core/prompts/persona-eng-designer.md`：`Doc structure` 第 9 项 `Integration test design`（场景表 + 判据 + 回指业务需求）；计数 8 → 9（含两处 `8 output items`）。

**三轮评审轨迹**：#13 changes-required（🔴1 F9 窗口读数无承载）→ #16 pass → #22 changes-required（🔴1 计量基数仍是项目单数）。
**第 3 轮 🔴 的处置**：`PROMPT-SYSTEM.md:3313-3314` 围栏改 `for each integration suite this project is missing` + `Each row is booked once, at the first closeout that reports that set empty`；提示词同形落地。**项目中性**：全档不出现仓 / 端划分（`repo` / `front-end` / `cli` / `vsc` / `desktop` 在 B3 段落 0 命中）。

**读数**：`books a ledger row for each integration suite this project is missing` 1 · `Each row is booked once` 1 · `one ledger row per repo` 0 · `A repo with no integration tests is a debt` 0 · `test/integration/` 0 · 叠句 `the project's the project's` 0 · 行宽 >300 = 0 · `prompt-refs` 命中 0 · `doc_check` gate PASS。

**收口测试行**：本批验证 = 上述字符串读数 + 两包单测（core 35/0 · vsc 27/0）∥ 命令 = `node test/run.mjs`；**集成场景无变化**（改动面 = 提示词文本，未触及业务行为）。集成集现量 **0 / 50–100**（三前端仍空账——本批立的是「缺一套就记一笔」的规则，补集另批）。

**未落地（如实）**：评审 #22 的 🟡2（A8/A9 读数颗粒度）与 🟡4（窗口粒度 vs 欠账行粒度）只在提示词与围栏正文层面解决，设计档的验收条目文字未逐条重写；🔵 项（B1 ② 目录未定所指、行数漂移、F9 簿记读法）留台账。

**doc-check 门**：`DOC-CHECK GATE: PASS`。
