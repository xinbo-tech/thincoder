# 2026-10-10 · mechanical-cleanup
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10「全清了」直令 + 清账轮批档簇Ⅵ = #1076 ∥ #1097 ∥ #1136（机械坐标/措辞收正）。
> 台账 = #1076（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 簇Ⅵ）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10「全清了」——本批 = 清账轮簇Ⅵ（`docs/batches/2026-10-10-ledger-full-triage.md` §1 ②）；授权 = 会话全自动沿用。

**条目（3）**：
- `#1076`：desktop 行数表「单源 ∥ 读取面 ∥ 补行位」三处表述张力收口（`docs/desktop/design/PROJECT.md:221` ↔ `UI.md:505`/`SHELL.md:196` ↔ `PROJECT-MANIFEST.json` 实况）。
- `#1097`：450 族 vsc 映射候选（`MODEL-SPECS.md:1617–:1618` 丁 ⇒ 750？沿 `pickers.mjs` 先例）+ `MANIFEST` 同形块题族评估。
- `#1136`：`thincoder-core/config.mjs` activeProvider 措辞残留三处（`:247` ∥ `:255` 报文 ∥ `:272` doc comment）——改指 `defaultModel`/调用方名，与 `:419` 同拍（零行为）。

**边界**：桌面/vsc/核设计档与注释面；零行为改动（#1136 = 注释+文案）；不触他簇。

**授权口径**：会话全自动（2026-10-10 03:07「全自动」+ 03:44「全清了」）——设计 → 评审（用户点火）→ 批准 → 实施。

**父裁（2026-10-10）**：① RT-1 维持出案零动 ✓（`MANIFEST.md` 块题族反向案影响面六处——另轮）；② 两点必要扩展 ✓（`#1076` 同句族 11 档全量 + `SHELL.md:110` 死半句 ∥ `#1097` 五点含 `:665`）——同族留患不是选项；③ RT-2..RT-6（300 线句族 ∥ `ACTIVITY.md:397` ∥ `VSC-DEBT.md:284` ∥ `MANIFEST.md:234/:229` ∥ `MENU/PACKAGING §3.x`）归批 台账 `#1174`；④ RT-7 坐标漂移按现读落 ✓。

## §2 批次任务与设计（eng-designer）
**状态行**：✅ 设计完成 · 2026-10-10（B 组含候裁项（MANIFEST 块题族出案——§2.2 B-9））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**范围与来源**（承 §1 · 3 条）：簇Ⅵ 机械坐标/措辞收正——`#1076`（desktop 行数表「单源 ∥ 读取面 ∥ 补行位」三表述收口）∥ `#1097`（450 族 vsc 映射 + `MANIFEST` 同形块题族评估）∥ `#1136`（`config.mjs` activeProvider 措辞残留 ×4）。零行为 · 不触他簇；面 = 桌面/vsc/核设计档与注释面。设计档落点 = 本节（机械收正批——无独立设计档；被改文档本体即落点）。

**坐标现读口径**：本节全部坐标 = 2026-10-10 设计轮现读（read/grep/机检实跑）；批档/派单所记历史坐标的漂移（例 = `MODEL-SPECS` :1617–:1618 ⇒ 现 :1615–:1616；`MANIFEST.md` :225 ∥ :239/:243/:249/:251 ⇒ 现 :252 ∥ :255 ∥ :258 ∥ :260 ∥ :262 ∥ :264）按现读落——漂移说明见 §2.9 RT-7。

### 2.1 A —— `#1076`（三表述收口：唯一口径裁定 + 同句族全量随正）

**裁定句（唯一口径 · 三链同源）**：
行数预算**值行单源 = 各域表「文件账」节**（一档一行）；`PROJECT.md` §4.1 等表 = **逐档指针索引**（不复制值）；行数面机检声明 = `checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，**运行根单读**——子域不得自持声明）**逐条 = 节域**（现读 14 条 = `PROJECT.md` §4.1 + 13 域表）；机检逐条读节域、值行与实读内容行数比对（差异 = 报告态）；新档落盘 = 值行由落盘批在**所属域表**补、`PROJECT.md` §4.1 **同拍补指针行**。

**实况基线（设计轮实测）**：机检直跑 = 声明 14 ∥ 参与比对 163 行 ∥ 跳过非数行 185 ∥ 差异 **0**；`PROJECT.md` §4.1 现读 157 行**全为指针行**（0 值行参与比对）。⇒ 旧句三处（「本表 = 逐文件行数预算单源」∥「读取面 = `PROJECT.md` §4.1」∥「本表行按同值同步」）与实况相抵——收正源 = 裁定句。

| # | 坐标（现读） | 动作 | 目标形（逐字） | 机检法 |
|---|---|---|---|---|
| A-1 | `docs/desktop/design/PROJECT.md:221` | 改述 | 「本表 = **逐档指针索引**（行数预算**值行单源** = 各域表「文件账」节——本表不复制值；`docs/desktop/design/SHELL.md` §1 树不复制预算列）；**新档落盘随批登记**（此后新档：值行由落盘批在所属域表补行，本表同拍补指针行）——行数口径 = 内容行数（文末换行不计）；**行数面机检 = `checkConfig.lineCounts` 声明（`PROJECT-MANIFEST.json`）——doc-check 行数族**。」 | 旧句 grep=0 ∧ 新句在场 |
| A-2 | 同句族 **11 档**（同文 1:1 同改 · 均 `docs/desktop/design/` 下）：`UI.md:505` ∥ `SHELL.md:196` ∥ `ACTIVITY.md:156` ∥ `CHAT.md:162` ∥ `COMPOSER.md:164` ∥ `E2E-TESTING.md:251` ∥ `IPC.md:354` ∥ `RENDERER.md:341` ∥ `SESSIONS.md:132` ∥ `SETTINGS.md:329` ∥ `WEB-QUICKCHECK.md:180` | 改述 ×11 | 「**行数面机检**：`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，运行根单读）**逐条声明节域——本表为其一**（本域值行单源）；后续本域新档由落盘批在本表补值行，`docs/desktop/design/PROJECT.md` §4.1 同拍补指针行（沿 §4.1 纪律）。」 | 旧句 grep=0 ∧ 新句 11 命中 |
| A-3 | `docs/desktop/design/SHELL.md:110`（§1 作用域注——同族外沿：该句 = 「行数预算单源指针」所在句，SHELL 变更记录 2026-09-26 在册） | 半句收正（死措辞删除） | 「（宿主族 = 本档 §5.1）」——删「未迁族仍 = `docs/desktop/design/PROJECT.md` §4.1」半句（**「未迁族」现读空集**：§4.1 逐行皆指针） | 该半句 grep=0 |
| A-4 | `PROJECT-MANIFEST.json`（`checkConfig.lineCounts`） | **零动**（事实源） | —（条目实况逐条现读核过：`PROJECT.md` §4.1 + 13 域表） | — |
| A-5 | 观察（非判定面） | 零动 | `PROJECT.md` §4.1 声明条现读 0 值行参与比对（157 行全指针·机检跳过）——保留该条 = 声明面含索引节的现状选择，本批零动 | — |

**收正理由**：① 三处张力 = 迁移（2026-10-02 文件账切片）遗留的半迁移措辞（值已迁域表、措辞未随）；② 同句族判据 = 同文 1:1 全量同改——只改代表两处 = 留 9 处同患；③ A-3 死措辞删除（对象已消——不留尸体）；④ A-4/A-5 = 事实源与观察，零动。

### 2.2 B —— `#1097`（450 族映射 + `MANIFEST` 同形块题族评估）

**裁定句**：450 族（**注册拆分触发阈值**）按派生口径重算 = **硬限 − 50 ⇒ 750**（800 − 50）；落笔面 = 登记面（`docs/vsc/design/SETTINGS.md` §3）值语句 + 指针副本（`docs/core/design/MODEL-SPECS.md`）**同波同值**；**族单值化**（同注册不并存 450 ∥ 750 双值）；记录面与旧软线状态句不随（零动 + 报告 §2.9 RT-2）。

**理由链**：① 派生规则在册（源 = `thincoder-cli/docs/design/_archive/MODEL-MERGE-SESSION.md:88`「500（恰线）→ 拆分先行（→≤450）」= 硬限 − 50）；② 同族先例已落 = `thincoder-cli/src/tui/pickers.mjs:126`（「≤450」⇒「≤750」——值置换不留旧值）；③ 2026-10-08 口径更换批已裁「归 vsc 候窗一次裁 ⇒ **750（非 500）**」，本批 = 候窗落笔；④ 非 500：前轮 450⇒500 表外笔已**整笔回退**（无批内依据 + 与登记面异值）；⑤ 同波纪律：登记面 ∥ 副本同值——单改任一面铸「与登记面异值」；⑥ 族单值化含 `:646`「原触发」句——同 bullet 内不并存双值。

| # | 坐标（现读） | 动作 | 目标形（摘） | 机检法 |
|---|---|---|---|---|
| B-1 | `docs/vsc/design/SETTINGS.md:646` | 值置换 | 「原触发 = 阈值 **750** 行 ∨ **MCP / provider 面下次结构改动**（先到即拆）……」（数字 450⇒750；句内「越 500 硬限」叙述零动——§2.9 RT-2） | 见 T-4/T-5 |
| B-2 | `:651` | 值置换 | 「到期条件 = 阈值 **750 行**到达时（新触发——若拆后增量再逼近）。」 | 同上 |
| B-3 | `:665` | 值置换 | 「（< **750** 触发阈值）」（:667 同 bullet 姊妹点——同波防 bullet 内异值） | 同上 |
| B-4 | `:667` | 值置换 | 「拆分计划 = 触发阈值 **750 行** 或该档下次结构改动（先到即拆）」 | 同上 |
| B-5 | `:681` | 值置换 | 「拆分计划 = 触发阈值 **750 行** 或 **设置面样式族下次结构改动**（先到即拆）」 | 同上 |
| B-6 | `docs/core/design/MODEL-SPECS.md:1616`（副本注块现读 = :1615–:1616；批档旧记 :1617–:1618 已漂） | 值置换（同波同值） | 「拆分计划 = 触发阈值 **750 行** 或该档下次结构改动（先到即拆）；**登记 = `doc:SETTINGS.md:§3`**。」——「（>300 · 修正轮）」题标零动 | 副本 `450` 0 命中 ∧ `750` 1 命中 |
| B-7 | `SETTINGS.md` 变更记录（`:756` ∥ `:821` ∥ `:829`） | **零动** | 记录面 as-of 沿革——不追改 | — |
| B-8 | `docs/core/design/MANIFEST.md` 族（块题 `:252` ∥ `:258` ∥ `:262` ∥ 内文 `:255` ∥ `:260` ∥ `:264`） | **零动（出案）** | 见 B-9 | 族句在场（零触核） |

**落笔格式**：仅数字置换——各保持原行加粗 ∕ 非加粗形（B-1/B-2 非加粗 · B-4/B-5/B-6 加粗 · B-3 括号内非加粗）。

**评估面（B-9 · 候裁）**：`MANIFEST.md` 同形块题族（块题「Δ 上界 + >300 软线判定」×3 + 内文「>300 软线判定」×3）**出案 = 零动**：① 族内语句 = 各批 Δ/线判定**记录**（本档 `:219`「同一档多行 = 各批快照」自declared 口径）；② 单改块题 ⇒ 题体异线；全改 ⇒ 以新线改写旧判定（「存量越线档」词随新线即伪）；③ 族内**活**触发句已新线化（`:235`「越 800 硬限」∥ `:247`/`:248` 同）；④ 沿 2026-10-08 判读（丁为主 · 零动）——本批 = 该悬题收口。反向案（块题随线值）影响面 = 六处 ∧ 语义改写 ⇒ 建议另轮；候裁（§2.9 RT-1）。

### 2.3 C —— `#1136`（`config.mjs` activeProvider 措辞 ×4：注释 ×3 + 报文 ×1 · 零行为）

**立法面（零动·本批之据）**：`thincoder-core/config.mjs:7` 档头「activeProvider/activeModel 住会话槽（不在 config）」；全仓其余 `activeProvider` 命中 = 会话槽 / 运行时派生值（合法面——非本批面）。
**调用面（报文泛化之据）**：`findProvider` 系泛用——调用方 = `thincoder-core/advisor/run.mjs:32`（`cfg.provider`）∥ `thincoder-vscode/src/extension/presets.mjs:119`（`name` ∕ `defaultModel` 派生值）；报文零消费方断言（全仓 grep「not in providers list」= 本体 1 处）。

| # | 坐标（现读） | 现文（摘） | 目标形（逐字） |
|---|---|---|---|
| C-1 | `thincoder-core/config.mjs:247`（doc comment） | 「a typo in activeProvider silently falling…」 | 「a typo in the caller-supplied name (e.g. `defaultModel`) silently falling to the first provider would use the wrong key on the wrong endpoint.」 |
| C-2 | `:255`（错误报文） | `activeProvider "${name}" not in providers list (available: …); check for a typo in: ${configPath}` | `provider "${name}" not in providers list (available: …); check for a typo in: ${configPath}` |
| C-3 | `:272`（doc comment） | 「(API keys, baseURL, model, activeProvider all come from the file).」 | 「(API keys, baseURL, defaultModel all come from the file).」 |
| C-4 | `:419`（doc comment） | 「(providers/activeProvider stay as loaded).」 | 「(providers/defaultModel stay as loaded).」 |

**理由**：① 报文泛化 `provider`（泛用函数不点名单一来源）；② 注释指「调用方名」并以 `defaultModel` 为例（主源之一）；③ 行为零变（throw 契约 ∥ 兜底语义 ∥ 报文仅字面改）；④ `:419` 与前三处同拍（台账 `#1136` 在册）。

### 2.4 受影响文件清单（as-of 2026-10-10 设计轮实读 · 内容行数口径 = `split("\n").length − 1`）

| 文件 | 现状 | 预期增删 | 说明 |
|---|---|---|---|
| `docs/desktop/design/PROJECT.md` | **1810** | ±0（改述）＋变更记录 1 行 | A-1 |
| `docs/desktop/design/UI.md` ∥ `SHELL.md` ∥ `ACTIVITY.md` ∥ `CHAT.md` ∥ `COMPOSER.md` ∥ `E2E-TESTING.md` ∥ `IPC.md` ∥ `RENDERER.md` ∥ `SESSIONS.md` ∥ `SETTINGS.md` ∥ `WEB-QUICKCHECK.md` | **820 ∥ 343 ∥ 476 ∥ 258 ∥ 339 ∥ 311 ∥ 558 ∥ 552 ∥ 222 ∥ 566 ∥ 203** | 各 ±0（改述）＋变更记录 1 行 | A-2 ×11；`SHELL.md` 另含 A-3 |
| `docs/vsc/design/SETTINGS.md` | **861** | ±0（值置换）＋变更记录 1 行 | B-1..B-5 |
| `docs/core/design/MODEL-SPECS.md` | **2199** | ±0（值置换）＋变更记录 1 行 | B-6 |
| `thincoder-core/config.mjs` | **495** | **±0**（注释 ∥ 报文同位改——行数零变） | C-1..C-4 |
| `docs/core/design/MANIFEST.md` | 1004 | **零动** | B-8 / B-9（评估面） |
| `PROJECT-MANIFEST.json` | 57 | **零动** | A-4 |
| 测试面 | — | **零新档** | 纯文档/注释面；机检 = doc-check + grep 组（§2.5） |

**变更记录**：各涉改档随批补 1 行（沿惯例；无该节者免）——计入上表预期增删。
**机检基线（设计轮实测）**：`scripts/doc-check-linecounts.mjs` 直跑 = 声明 14 ∥ 比对 163 ∥ 差异 0（报告态）；收口跑点 = 实施轮 `node scripts/doc-check.mjs --root .`（悬空 ∥ 行宽 ∥ 行数面）。

### 2.5 用例表（正常 / 边界 / 错误 · 落点 = 实施轮机检组 + §5 读数）

| id | 类 | 输入 / 动作 | 期望输出与判据 |
|---|---|---|---|
| T-1 | 正常 | grep `activeProvider`（`thincoder-core/config.mjs`） | **= 1**（`:7` 立法行）；C-1..C-4 四处不含该词 |
| T-2 | 正常 | node 直调：`findProvider([], "")` ∥ `findProvider([{name:"a"}], "b")` | 兜底对象（零 throw）∥ throw ∧ message 含 `not in providers list (available:`（语义保形） |
| T-3 | 正常 | grep 旧句「读取面 = \`docs/desktop/design/PROJECT.md\` §4.1」（全 docs） | **0 命中**；A-2 新句在 11 档各 1 命中 ∧ A-1 新句在场 ∧ A-3 半句 0 命中 |
| T-4 | 正常 | grep `750`（`docs/vsc/design/SETTINGS.md` §3 ∥ `docs/core/design/MODEL-SPECS.md`） | 映射六处在场（SETTINGS ×5 + MODEL-SPECS ×1）同值 |
| T-5 | 边界 | grep `450`（两档全文） | 规范面（§3 ∥ 注块）**0 命中**；SETTINGS 仅变更记录区命中（`:756/:821/:829`）——记录面零动核 |
| T-6 | 边界 | `MANIFEST.md` 族句复核（块题 ∥ 内文六处） | 原样在场（B-9 零动出案核） |
| T-7 | 边界 | `node scripts/doc-check.mjs --root .`（实施轮收口） | exit 0 ∥ 悬空 0 ∥ 行宽 0 ∥ 行数面差异 **0（不增）** |
| T-8 | 错误 | 负控：grep `activeProvider/activeModel`（config.mjs） | ≥1（`:7` 立法行在场——防误删） |

### 2.6 验收对照（回指 §1 三条 + 台账）

| AC | 条目 | 设计落点 | 判定方式（机器核） |
|---|---|---|---|
| AC-1 | `#1076` | §2.1（裁定句 + A-1..A-3） | T-3 ∧ T-7：收正三面（`PROJECT.md` ∥ 11 域档 ∥ SHELL 半句）全落 ∧ 旧句 0 |
| AC-2 | `#1097` | §2.2（裁定句 + B-1..B-6） | T-4 ∧ T-5：映射六处 750 同值 ∧ 记录面零动 ∧ B-9 出案在档 |
| AC-3 | `#1136` | §2.3（C-1..C-4） | T-1 ∧ T-2 ∧ T-8：四处改指 ∧ 行为零变 |

### 2.7 关键决策（含被否）

| # | 决策 | 被否（理由） |
|---|---|---|
| KD-1 | #1076 唯一口径 = 值行单源住各域表 ∥ `PROJECT.md` §4.1 = 指针索引 ∥ 声明逐条 = 节域（运行根单读） | 维持旧「本表 = 单源」句（与 157 行指针实况相抵）∥ 值行回迁 §4.1（逆迁移） |
| KD-2 | 同句族 **11 档全量同波** | 只改 UI/SHELL 代表两处（留 9 处同患） |
| KD-3 | `SHELL.md:110`「未迁族」半句删除 | 留置（空集措辞——读者按活类别理解） |
| KD-4 | #1097 映射 = 450⇒750（含 :646「原触发」句单值化） | 保持 450（与族单值方向相抵）∥ 450⇒500（已整笔回退——依据不足 + 异值） |
| KD-5 | MANIFEST 同形块题族 = 零动出案 | 块题随线值（题体异线 ∕ 历史改写——反向案影响面在册候裁） |
| KD-6 | #1136 报文泛化 `provider "${name}"`；注释指「调用方名（例 `defaultModel`）」 | 保留 activeProvider（失实）∥ 报文指名 defaultModel（泛用函数点名反窄） |

### 2.8 边界（不做）

- 不改机制：行数口径 ∥ 机检实现（`scripts/doc-check*.mjs`）∥ `PROJECT-MANIFEST.json` 条目 ∥ 阈值体系——零代码行为。
- 不触记录面：各档变更记录旧行 ∥ 批档 ∥ `_archive`——不追改（含 2026-10-08 批的 as-of 坐标）。
- 不动族外层：`MANIFEST.md` 块题族（B-9 候裁）∥ 「越 300 建议线」句族 ∥ `VSC-DEBT` 触发线族 ∥ `ACTIVITY.md:397` 括注——零动（报告 §2.9）。
- 不新增内容：不补 `MENU.md` ∥ `PACKAGING.md` §3.x 的「行数面机检」注（内容增补 ≠ 收正——登记 §2.9 RT-6）。
- UI/交互：零改（无 `open` 项）。

### 2.9 上抛与报告项

| id | 类别 | 内容 | 建议 |
|---|---|---|---|
| RT-1 | 候裁 | `MANIFEST.md` 块题族反向案（块题随线值）——影响面 = 六处语义改写 | 维持出案零动；若裁反向 ⇒ 另轮（§2.2 B-9） |
| RT-2 | 报告 | vsc `SETTINGS.md` §3 ∥ `MODEL-SPECS.md` 内旧线状态句（「越 300 建议线 / 300 行建议线」题句族 `:645/:652/:664/:679` + `:665` 同句 + `:646` 内「越 500 硬限」叙述）——机械置换不保真（真值变） | 本批零动；口径统一另轮 |
| RT-3 | 报告 | `docs/desktop/design/ACTIVITY.md:397`「阈值 450——余量 ≈45 行」（settings-tools.js 批块括注）——候窗名单外同值引用 | 记录块（as-of）+ 需重算非置换 ⇒ 建议零动 |
| RT-4 | 报告 | `docs/vsc/design/VSC-DEBT.md:284`「逐档触线 >495 ∥ >497 ∥ >450」（触发值族·源 = 2026-09-20 批）——非 450 族派生定义内 | 未在候窗；另轮评估 |
| RT-5 | 报告 | `MANIFEST.md:234`「越 300 软线，未越 500 硬限」括注 ∥ `:229`「249 < 300」——已裁沿革留置（2026-10-08）∥ SOFT_LINE_REGISTRY 归重建轮 | 维持零动（复评在册） |
| RT-6 | 报告 | `MENU.md` §3.1 ∥ `PACKAGING.md` §3.1 = 声明内节域但无「行数面机检」注 | 现状零动；补齐 = 内容增补（建议登记） |
| RT-7 | 说明 | 历史坐标漂移（`MODEL-SPECS` :1617–:1618 ⇒ :1615–:1616；`MANIFEST` :225 ∥ :239/:243/:249/:251 ⇒ 现读 :252 ∥ :255 ∥ :258 ∥ :260 ∥ :262 ∥ :264） | 本表已按现读落；批档不追改（记录面） |

### 2.10 零触确认（设计轮）

- 本设计轮（eng-designer）：**零文件改动**——仅 §2 落笔；全部坐标/读数 = 现读实测（read ∥ grep ∥ 机检直跑）。
- 本批产品码面 = `config.mjs` 注释 ×3 + 报文 ×1（零行为）；余 = 文档面；测试面 = 零新档。
- 预审自查：条目覆盖 3/3（§2.1–§2.3）；受影响文件清单齐（§2.4）；AC 逐条机器可核（§2.6 × §2.5）；边界成文（§2.8）；上抛与报告项在册（§2.9）；UI 决策 = 零改（无 `open`）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**状态行**：✅ 已收口（2026-10-10 · 机械面轻收——记录 + 机检 + §6，不挂独立评审；口径 = 用户 03:28）

**父侧落笔（2026-10-10 · 父侧直接执行 · 逐处可 revert）· 22 处**：
- **A-1**：`docs/desktop/design/PROJECT.md:221` ⇒ 逐档指针索引（值行单源 = 各域表「文件账」节——本表不复制值）。
- **A-2**：同句族 **11 档**全量同改（`UI` ∥ `SHELL` ∥ `ACTIVITY` ∥ `CHAT` ∥ `COMPOSER` ∥ `E2E-TESTING` ∥ `IPC` ∥ `RENDERER` ∥ `SESSIONS` ∥ `SETTINGS` ∥ `WEB-QUICKCHECK` 各 1 处）⇒「逐条声明节域——本表为其一」。
- **A-3**：`docs/desktop/design/SHELL.md:110` 死半句删（「未迁族仍 = …」——空集措辞）。
- **B-1..B-5**：`docs/vsc/design/SETTINGS.md` `:646` ∥ `:651` ∥ `:665` ∥ `:667` ∥ `:681` —— 450 ⇒ 750（五处）。
- **B-6**：`docs/core/design/MODEL-SPECS.md:1616` —— 450 ⇒ 750（副本同波同值）。
- **C-1..C-4**：`thincoder-core/config.mjs` `:247` ∥ `:255` ∥ `:272` ∥ `:419` —— 报文泛化 `provider "${name}"` ∥ 注释改指调用方名（例 `defaultModel`）。
- 变更记录：逐档一行从简（本 §6 = 随批轨迹——机械面收口口径）。

**机检读数（父侧实跑 · §2.5 T-1..T-8 全绿）**：T-1 = 1 ✓ ∥ T-2 兜底 `{name:"default"}` ∥ throw 报文「provider "b" not in providers list (available: a)…」语义保形 ✓ ∥ T-3 = 旧句 0 ∥ 新句 11 ∥ A-3 半句 0 ✓ ∥ T-4 = SETTINGS 750×5 ∥ MODEL-SPECS 750×1 ✓ ∥ T-5 = 450 仅记录面 3 处（`:756`/`:821`/`:829`）∥ MODEL-SPECS 450=0 ✓ ∥ T-6 = MANIFEST 块题族零触 ✓ ∥ T-8 = 立法行 `:7` 在场 ✓ ∥ T-7 = `node scripts/doc-check.mjs` **EXIT 0**（锚 0 悬空 ∥ 行宽全绿 ∥ 行数面报告 1 条 = `PACKAGING.md` 报告态·不增——他批既存）。

**计数**：条目 3/3（`#1076` ∥ `#1097` ∥ `#1136`）全覆；落点 22 处；产品码 = `config.mjs` 注释 3 + 报文 1（零行为）。
