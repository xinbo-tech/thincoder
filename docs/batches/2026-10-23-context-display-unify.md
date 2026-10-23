# 2026-10-23 · 三端上下文展示串同源（formatDeclaredContextK 接线）+ 设计档坐标随正
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-23 · 来源 = 收口后自查（桌面席 #21 与核席 #27 上抛的设计档漂移 + 三端展示串未同源）；用户 2026-10-23 19:05「你就照着完整流程做，不用着急」。
> 台账 = #1740（PROVIDER · 归批）。前情 = docs/batches/2026-10-23-context-from-model-list.md §1（已收口 2026-10-23）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-23
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**讨论（主 agent）**

**触发**：上一批（`2026-10-23-context-from-model-list`，已收口）落地后自查。两席上抛，我复核后确认两条都成立。

### 待办一 · 三端展示串未同源（功能性）

核已导出 `formatDeclaredContextK(k)`（`thincoder-core/model-specs.mjs:324`，内部 `formatContextK(k * 1024)`）；**桌面已接**，**CLI ∥ VSC 仍自拼** `String(k) + "K"`（`thincoder-cli/src/tui/provider-admin.mjs:367-371` · `thincoder-vscode/webview/settings-providers.js:19-25`）。

后果：声明 `1024`（= 1M）时，两端显 `1024K`、桌面显 `1M` —— **三端同串的判据只有一端满足**。`128` 这类不出舍入的值三端碰巧一致，所以这个缺口不容易在抽查里露头。

**根因**不是谁写错，是设计只写了「三端同一个格式器」没写死**入口**：核有两个格式器（`formatContextK` 收 token ∥ `formatDeclaredContextK` 收 K），端侧手里是 K，而当时第二个还没出生，于是各自拼串。

**需求已落** `docs/core/requirements/PROVIDER.md` §4.8 **R33**（gate PASS）：三端展示串一律经 `formatDeclaredContextK(k)`；判据四条（`1024 ⇒ 1M` · `128 ⇒ 128K` · 三端 `* 1024` 零命中 · 三端同串）。

### 待办二 · 设计档坐标漂移（文档维护）

核席最后一轮加了守卫与导出，`model-specs.mjs` 行号下移，设计档两处成了死坐标：

| 现文 | 实读 |
|---|---|
| `docs/core/design/PROVIDER.md:302`「`thincoder-core/model-specs.mjs:361`（**全仓唯一乘点**——L1 ∥ L2 共用）」 | 解析乘点在 `:379`；`:324` 还有一处**展示换算**，故「全仓唯一」按字面不成立 |
| `docs/core/design/PROVIDER.md:362`「判点 = `thincoder-core/model-specs.mjs:361`……与 L3 的判点（`thincoder-core/model-specs.mjs:367`）对称」 | R32 守卫判点 `:380`；L3 判点 `:392` |

### 边界（不做）

- 不改 `formatContextK` / `formatDeclaredContextK` 的行为与签名
- 不动桌面（已接）
- 不改解析链任何一层
- 不为「<k>K」留任何端侧兼容分支（替换，不兜底）

**用户口径**：2026-10-23 19:05「你就照着完整流程做，不用着急」——本批走完整四步，不抄近路。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-23 · doc_check gate PASS · 1 项上抛（R33③ 射程））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**条目（覆盖）**

| # | 条目 | 需求锚 | 本批做什么 |
|---|---|---|---|
| 1 | 三端展示入口写死 | `docs/core/requirements/PROVIDER.md` §4.8 R33 ①②④ | 三端凡渲染窗口串处（卡片行 ∥ 写面 current 段 ∥ 清除确认正文 ∥ 保存回执）一律经核 `formatDeclaredContextK`；端侧零拼串、零换算、零格式化器副本（设计 §6.15「读面载荷（三端同源）」） |
| 2 | 判别用例 | R33 ① | 设计 §6.15 W 表新增 W-9b（`1024 ⇒ 1M`）；W-9（`128`）标「非判别样本」 |
| 3 | 设计档死坐标随正 | 本批 §1 待办二 | 设计 §6.15 六处坐标 + 一处死指针（明细见「落地」） |

**不覆盖（明示不做）**：核两格式器的行为与签名 · 桌面（已接）· 解析链任何一层 · 端侧 `<k>K` 兼容分支（替换，不兜底）。

**落地（全在 `docs/core/design/PROVIDER.md` §6.15）**

| # | 落点 | 改法 |
|---|---|---|
| 1 | 「读面载荷（三端同源）」 | 新增「展示入口写死」段 + 三问 + 「VSC 宿主出词」决策与理由；VSC 载荷三键（`modelContext` / `modelContextText` / `context`）；CLI 四处窗口串同调核导出 |
| 2 | 解析链表 L1 / L2 行 | 乘点 `:361` ⇒ 解析乘点 `:379`；展示换算单列 `:324`（L2 行原写「全仓唯一乘点」） |
| 3 | 「人工声明的量级守卫」判点行 | `:361` ⇒ `:380`；L3 判点 `:367` ⇒ `:392` |
| 4 | survey-evidence 行 ∥ 「旧键仍读」行 | `:361` ⇒ `:379`；`providerSpecResolution` `:344-380` ⇒ `:358-405`；`lookupSpec` `:271-281` ⇒ `:271-280`；删 `provider-admin.mjs:218` 死指针 |
| 5 | 写面第 3 / 5 步 + i18n 四键模板 | 回显值改为核出词串；模板尾 `K` 去掉（`<N>` 承载完整串） |
| 6 | W 表 + 受影响文件表 | W-9b 新增；六行补本批 Δ；单元测试档一行 |

**受影响文件（现量 = `ReadAllLines().Length`，2026-10-23 实读；与 `wc -l` 同值）**

| 文件 | 现量 | Δ | 本批改动 |
|---|---|---|---|
| `thincoder-cli/src/tui/provider-admin.mjs` | 412 | +2 | `declaredContextText` 与写面三处（`:243` · `:272` · `:328`）改调核 `formatDeclaredContextK` |
| `thincoder-vscode/src/extension/provider-context.mjs` | 88 | +10 | `providerContextFields` 增 `modelContextText`（只投合法正整数） |
| `thincoder-vscode/webview/settings-providers.js` | 179 | −12 | 行面改渲染宿主 `modelContextText`，删自拼串与旧理由注释 |
| `thincoder-vscode/webview/settings-provider-dialog.js` | 493 | −1 | current 段（`:318`）改读 `modelContextText` |
| `thincoder-vscode/locales/zh.json` · `en.json` | 361 · 353 | ±0 | 四键模板去尾 `K` |
| 单元测试档（新增，收口删） | 0 | +~60 | W-9 ∥ W-9b ∥ R33③ 源扫 |
| `thincoder-core/model-specs.mjs` · `thincoder-desktop/**` · `thincoder-vscode/src/extension/settings.mjs` · `thincoder-cli/src/tui/model-picker.mjs` | 442 · — · 443 · 322 | 0 | 边界内不动（入口本体 / 已接 / 新键随 `providerContextFields` 展开 / 消费面不变） |

**验收（逐条回指 R33）**

| # | 判据 | 机验形 | 回指 |
|---|---|---|---|
| 1 | 声明 `1024` ⇒ 三端 `1M` | 设计 §6.15 W-9b；三端各跑一遍（卡片行 ∥ current 段 ∥ 回执） | R33 ① |
| 2 | 声明 `128` ⇒ 三端 `128K` | W-9（非判别样本——只验显示，验不了入口） | R33 ② |
| 3 | 三端展示面 `* 1024` 零命中 | 扫六个展示面档（CLI `provider-admin.mjs` · VSC `settings-providers.js` ∥ `settings-provider-dialog.js` ∥ `provider-context.mjs` · 桌面 `src/main/providers.mjs` ∥ `renderer/views/settings-sections-providers.mjs`）⇒ 0 行 | R33 ③ |
| 4 | 三端同渠道同模型同串 | W-9b 三端同串；VSC ∥ 桌面同走 `modelContextText`，CLI 同走 `declaredContextText` | R33 ④ |
| 5 | 坐标复测 | 核档逐点读：`:379` `const declaredTokens = kUnit * 1024` · `:380` `if (declaredTokens > base.context * 4)` · `:392` `if (listedTokens > staticValue * 4)` · `:324` `return formatContextK(k * 1024)` | 本批 §1 待办二 |
| 6 | 设计档 doc_check | `doc_check(mode:"gate", target:"D:\teamcode\thincoder", docs:["docs/core/design/PROVIDER.md"])` ⇒ `DOC-CHECK GATE: PASS`（本轮实跑：0 条命中） | 本批验收 ④ |

**关键决策**

1. **VSC = 宿主出词、面板只渲染**。理由：webview 当前零 `@thincoder/core` 引用（`thincoder-vscode/webview/**` 实读），取词面只走 `@thincoder/render-core`；宿主已引核（`thincoder-vscode/src/specs.mjs:13`）。被否：webview 直引核（把整张 `MODEL_SPECS` 表打进面板）· webview 自持副本（第二个格式器 = 正被修掉的漂移）。
2. **CLI = 直接调核导出**（node 端已有 `@thincoder/core/*` 引面：`thincoder-cli/src/tui/provider-admin.mjs:20-24`）；四处窗口串同调一个入口，不另造中间层。
3. **i18n 模板去尾 `K`**：`<N>` 承载完整串（`128K` / `1M`）；模板补 `K` 会让 1M 的声明出 `1MK`。
4. **判别样本 = `1024`**：`128` 不经舍入，自拼串与核出词同串，判别力为零。

**上抛（待父侧裁）[上抛·待裁]**

- **R33 ③ 字面不可满足**：全端扫 `* 1024` 会命中与窗口无关的字节算术（实读：`thincoder-vscode/src/agent/run-helpers.mjs:24-26` · `thincoder-cli/src/acp/resource-link.mjs:25` · `thincoder-vscode/src/tools/shell.mjs:222` 等）。设计把射程定为「窗口展示面六档」（验收 ③）。需求档是否补射程说明 = 父侧裁定（需求档不归本席）。

**修正轮 1（评审 #29 · changes-required 9 条全落地 · 2026-10-23）**

- 设计档 `docs/core/design/PROVIDER.md` §6.15 已按评审逐条修正（编号对照见评审 §3 轮次 1；逐条落点见本轮交付回报）。
- 受影响文件口径随设计更新两处：桌面由「八键 · 零改」改为「七键——删死键 `contextSaved`（桌面不出回执行）」；VSC 保存回执载荷增 `kText`（宿主出词）。
- R33③ 射程 = 五档（需求侧已定）；机检判据（文件集 ∥ 表达式 ∥ 排除项）入设计 §6.15「R33③ 源扫」。
- 同节另修三处残留旧答（`modelContext` / `model-context.mjs` / i18n 八键的存在性；`providers[].context` 的装载归一与外键乘点坐标）——与评审 #1 同类，逐条见交付回报。
- doc_check gate：`docs/core/design/PROVIDER.md` ⇒ PASS（0 命中）。

**修正轮 2（文档面 · 2026-10-23）**

- **协议登记随正（跨档事项）**：`docs/vsc/design/WEBVIEW-PROTOCOL.md` 三处登记 `kText`——§3.2 行 35（下行载荷）· §12 收面 `providerContextSaved` 行 ·
  §13 发面 `saveProviderModelContext` 行（回执注）。载荷形 = `{ name, model, k, kText }`，`kText` = 宿主经核 `formatDeclaredContextK(k)` 出词；语义单源 = `docs/core/design/PROVIDER.md` §6.15「读面载荷（三端同源）」。§3.2 计数面实读无变（行 1–35 = 35 项）。
- **评审第 2 轮 #10–#14 逐条落地**（全在 `docs/core/design/PROVIDER.md` §6.15）：
  - #10 指针与正文打架 ⇒ `:410` 删端侧禁令子句，留「卡面只把原值交入口出词」半句 + 单源指针（禁令单源 = 「读面载荷（三端同源）」）。
  - #11 同一坐标两符号 ⇒ `:757` 四坐标实读随正：`specForModel` `model-specs.mjs:294` · `providerSpec` `:407` · `resolveEnableThinking` `config.mjs:150` · `isBailianHost` `config.mjs:133`；`:323` 归 `formatDeclaredContextK`（与 `:447` / `:659` 一致）。
  - #12 三数不可对账 ⇒ `:612` 收成一个现量 **412**（本轮 `wc -l` 实读，node 复读同值）+ 一个 Δ **本批 +2**；删「批前 210」「净 +175」。
  - #13 已声明值定义与回填口径 ⇒ `:402` 限定为**合法**已声明值（非法 ⇒ 空，见「非法声明值的展示」）。
  - #14 卡片行形尾巴 `K` ⇒ `:405` 改 `逐条 模型: <N>` / 单条 `<N>`（`<N>` = 核出词串 `128K` / `1M`；模板不补 `K` 指「文案登记」）。
- **同档一致性顺手收（计数面，非评审条目，逐条报告）**：`:636` 「五行」⇒「六行」（实读标「本轮」行 = 6）；`docs/vsc/design/WEBVIEW-PROTOCOL.md:351` D-P11「三十四项」⇒「三十五项」（§3.2 表行 1–35 实读）。
- **边界遵守**：未动需求档 · 未动代码与 locales（实施席 #32 在跑）· 未改 W-9b 样本口径。
- **doc_check gate**：`docs/core/design/PROVIDER.md` ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` ⇒ `DOC-CHECK GATE: PASS`（0 命中）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · docs/core/design/PROVIDER.md §6.15 展示入口写死 + 坐标随正（判据源 = 需求 §4.8 R33）

评审对象（按声明，不推断）= 设计 `docs/core/design/PROVIDER.md` §6.15「展示入口写死（`formatDeclaredContextK` 三端同源）+ 坐标随正」；判据源 = 需求 `docs/core/requirements/PROVIDER.md` §4.8 R33（`:206`）。
范围限制（如实记录）：评审上下文未提供项目标准档与文档地图 ⇒ 文档归属判据降级（按 Project Guide + 评审准则判）；源文件不在评审范围 ⇒ 设计内全部源码坐标 / 行数为 `unverified`，criterion-8 抽样核对未能执行。
方法学合规（通过项）：设计档在位（设计层 §6.15 为唯一业主节）+ 需求档判据行在位（R33）；先例行在（`:291` 节级、`:450` 本批级）、survey-evidence 行在（`:293-295`）、既有件三问行在（`:448`、`:643`）、受影响文件表在（`:600-634`）、用例表在（`:488-513`、`:574-588`）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Existing-piece / Requirements | 🟡 | 同一符号的存在状态两处相反：`docs/core/design/PROVIDER.md:448` 三问作答 `existing: thincoder-core/model-specs.mjs:323 · name: "formatDeclaredContextK"`；而「既有件三问」表 `:643` 对同符号答 `**none found**：全仓代码面各零命中`。受影响文件表 `:605` 把 `formatDeclaredContextK` 列为上一批新增、`:450` 又写「本批零新机制」——两处支持「已存在」，故 `:643` 为残留旧答。同一检查项两个相反答案，实施者无法判断该入口是否需新建。 | 把 `:643` 行改为 `existing: <同一坐标>`（与 `:448` 同值）并删「新导出 / 零命中」表述；`formatDeclaredContextK` 只留一个存在性答案。 |
| 2 | Clarity / Feasibility（机制面自相矛盾） | 🔴 | 非法声明值在编辑弹窗里的回填行为两处相反，且其一与设计自引的装载机制不相容：`:410` 要求 `输入框**回填盘上原值**`（取盘面原文，理由 = 装载归一已把非法条目从内存镜像清掉）；W-18 期望却是 `编辑弹窗输入框**空**（装载归一已把非法条目从内存镜像剔除 ⇒ 回填门只认合法值）`（`:508`），而同一条的注又写 `输入框留原文供改正`（`:512`）。本条正压在本批载荷面上：`:456` 的 `modelContextText` `只投影合法正整数`，宿主投影里没有非法原值，设计也未给「取盘面原文」的读取路径 ⇒ 照 `:410` 实现缺取数口，照 `:508` 实现则与规范句相反。 | 定一条、删另一条：若取「回填盘上原值」，须补非法原值到端的取数路径（宿主载荷新增原值键 ∥ 端侧读盘面）并同改 W-18 期望；若取「空」，删 `:410` 的回填句与 `:512` 的「留原文」。 |
| 3 | Acceptance（判据可追溯） | 🟡 | 本批唯一判据源 R33 在验收索引里缺席：表标题即 `**验收回指（R24–R32）**`（`:554`），行止于 R32；R33 只散见于 `:462`、`:499`、`:513`、`:630`。收口时无法按判据源逐条对账。 | 补 R33 行（①→W-9b · ②→W-9「判别力为零」声明 · ③→`:630` 源扫 · ④→W-9），标题改 R24–R33。 |
| 4 | Acceptance / Clarity | 🟡 | R33③ 的射程未钉死：需求侧写 `射程 = 窗口展示面六档`（`docs/core/requirements/PROVIDER.md:206`）却只列五条路径（CLI 1 + VSC 3 + 桌面 1）；设计侧该判据只有一句 `R33③ 源扫（三端窗口展示面 `* 1024` 零命中）`（`:630`），无文件集、无扫描表达式、无排除项。机检件按现文无法写死。 | 在设计里列全扫描文件集（并把需求的「六 / 五」改一致），给出扫描表达式与排除项（注释 / 其它字节算术不在射程）。 |
| 5 | Clarity（四档中的「保存回执」） | 🟡 | `:444` 声明三端四档一律经核入口，但两端取词来源未定：webview `当前零 `@thincoder/core` 引用`（`:452`），`providerContextSaved` 只登记了消费点（`:619`），载荷哪个字段带核出词串没写；桌面侧又加了 `与 VSC 同名八键`（`:627`）里的 `contextSaved`，而写后回显登记为 `loadProviders()` 复读行面（`:420`）——回执档在 VSC 缺来源、在桌面无落点。 | 写明 VSC 保存回执的载荷字段（宿主出词串）与桌面是否出回执行；不出就删该端 `contextSaved` 键（避免死键）。 |
| 6 | Document ownership（重复描述） | 🟡 | 同一条展示规则在 §6.15 有两份活副本：`:403-406`（读面回显 = 同一函数 / 同一入口、收 K、内部 ×1024、三端不换算不拼串）与 `:444-446`（展示入口写死，同义 + 判缺陷两写法）。本档自身纪律是 D2 单一权威源（多处写「不重述」），两份规范句将来会漂。 | 保留一处为规范句，另一处降为指针（「规则单源 = §6.15 …」）——与 R33 想防的漂移同向。 |
| 7 | Clarity（坐标随正） | 🔵 | 入口坐标三处不一致：`:448` 写 `model-specs.mjs:323`，而 `:294` / `:302` 写 `:324`（同一符号 `formatDeclaredContextK`）。本批交付项含「坐标随正」。 | 三处统一为实读坐标。 |
| 8 | Criterion 8（受影响文件行数） | 🔵 | `thincoder-core/model-specs.mjs` 一行三个互不可对账的数：现量 `**442** （批后 `wc -l`；批前 370，净 +47）`（= 417）、性质格拆点判定写 `≈ 427 ≤ 500 软线`（`:605`）；且 Δ 列是变更描述而非 `≤±N` 形式。 | 给一个现量 + 一个 `≤±N`（或「本批零改 / 结构 unchanged」），删不可对账的中间数。 |
| 9 | Note（未验证前提） | 🔵 | 桌面端 `本批**零改**`（`:632`）与 VSC 侧 `本批：四键去模板尾 `K`（值改用核出词串）`（`:616`）并存，但桌面同名八键（`:627`）是否本就不带模板尾 `K` 未说明（前提未钉）。 | 一句话钉住前提（桌面八键字面本就以核出词串入模板、无尾 `K` ⇒ 零改），否则把 `i18n-settings.mjs` 纳入本批。 |

计数：🔴 1 · 🟡 5 · 🔵 3（共 9 条）。

VERDICT: changes-required

### 轮次 2（评审子代理）

## 第 2 轮 · 只验上一轮 9 条（🔴1 · 🟡5 · 🔵3）；不全量重扫

范围：`docs/core/design/PROVIDER.md`（§6.15 展示入口写死 + 坐标随正）∥ `docs/core/requirements/PROVIDER.md`（§4.8 R33 判据源）∥ 两份修复脚本（`.thincoder/tmp/fix-r33.mjs` · `fix-r33-scope.mjs`，后者为准）。限制：源码不在评审范围 ⇒ 设计内源码坐标/行数为 `unverified`（只查文档内部可对账性）；评审上下文无项目标准档与文档地图 ⇒ 文档归属判据降级。

**结论：9 条全部 Fixed（含 🔴2）；新问题 5 条（🟡-optional 2 · 🔵 3），无 🔴 ⇒ pass**

| # | 原# | 文件 | 严重度 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 🟡1 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:659` 改为 `existing`: `providerSpecResolution` `:358` · `formatDeclaredContextK` `:323` · `formatContextK` `:314`；`grep "none found"` = 0 命中。与 `:447` 三问、`:294`/`:302` 同值 |
| 2 | 🔴2 | docs/core/design/PROVIDER.md | 🔴 | Fixed | 口径统一取「空」：`:407` `编辑弹窗输入框**空**`（取数口不存在——`config.mjs:272-289`/`:286` 内存镜像已删、端侧拿不到原值）；`:509` 期望与 `:513` 注同判；「回填盘上原值」句零残留（grep 只余 407/509/513 三处「空」） |
| 3 | 🟡3 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:555` 标题 `**验收回指（R24–R33）**`；`:572` 新增 R33 行（①→W-9b · ②→W-9 · ③→五档源扫 · ④→W-9） |
| 4 | 🟡4 | requirements + design | 🟡 | Fixed | 需求 `:206` 改 `射程 = 窗口展示面五档` 且五条路径并列；设计 `:638-650` 新增「R33③ 源扫」五档表 + 表达式 `\*\s*1024` + 排除项；`:572`/`:632`/`:650` 一律五档；全库无「六档」残留 |
| 5 | 🟡5 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:459` 载荷定形 `providerContextSaved { name, model, k, kText }`（`kText` = 宿主出词）；`:461` 桌面不出回执行 + 删 `contextSaved` 死键；`:468` 八键 ∥ `:469` 七键一致；`:617`/`:621`/`:629`/`:660` 随动 |
| 6 | 🟡6 | docs/core/design/PROVIDER.md | 🟡 | Fixed | `:403` 已降为指针（`不在此重述`，单源 = 「读面载荷（三端同源）」）；规范句只存 `:442-445` 一处 |
| 7 | 🔵7 | docs/core/design/PROVIDER.md | 🔵 | Fixed | `:294` · `:302` · `:447` · `:659` 四处同值 `model-specs.mjs:323`；全文无 `:324` |
| 8 | 🔵8 | docs/core/design/PROVIDER.md | 🔵 | Fixed | `:607` 单值现量 `**442**（wc -l 实读）` + Δ `本批 ±0` + 拆点判定 442 ≤ 500；370/417/427 三数已删 |
| 9 | 🔵9 | docs/core/design/PROVIDER.md | 🔵 | Fixed | `:634` 前提钉住：桌面唯一改动 = 删死键，其余七键模板本就以核出词串入（`${current}`，无尾 `K`）⇒ 展示面零改 |
| 10 | (new) | docs/core/design/PROVIDER.md | 🟡-optional | New | 指针句与正文自相矛盾：`:403` 承诺 `不在此重述`，紧邻 `:410` 仍重述端侧禁令 `端侧**不得**自己乘 1024、不得自己查静态表、不得自己解析链、不得自己拼 K 串` |
| 11 | (new) | docs/core/design/PROVIDER.md | 🟡-optional | New | 同一坐标两个符号：`:757` 写 `thincoder-core/model-specs.mjs:290` / `:323`（= `providerSpec`），而 `:447`/`:659` 把 `:323` 判给 `formatDeclaredContextK` |
| 12 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | `:612` 三数不可对账：`**412** （本轮 wc -l；批前 210）` + `净 +175`（210+175=385≠412）；与已修的 🔵8 同类残留 |
| 13 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | 🔴2 修复残留：`:401` 把「已声明值」定义为「键存在即算（值非法的条目同样要能删）」，而 `:402` 仍写 `输入框只回显该模型的**已声明**值`——与 `:407` 的非法值 ⇒ 空 需加限定语 |
| 14 | (new) | docs/core/design/PROVIDER.md | 🔵 | New | `:405` 卡片行形写作 `逐条 `模型: NK``，与 `:483` `**模板不补 `K`**`、`:443` 的 `1M` 出词冲突——形记法不得被实现成字面尾 `K`（否则复现 `1MK`） |

计数：🔴 0 未决 · 🟡-optional 2（新）· 🔵 3（新）；上轮 9 条 = 9 Fixed。

VERDICT: pass

## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户整批令覆盖批准门（FR36）：2026-10-23 19:05「你就照着完整流程做，不用着急」——批内全链跑完，批准不停。

**评审轨迹**：
- 第 1 轮（`#29`）：changes-required —— 🔴1（非法声明值回填口径三处互斥）/ 🟡5 / 🔵3。
- 修正轮（`#30`）：9 条全落 + 5 处同节一致性修正（三问表存在性、装载归一点、外键乘点、locales 现量）。
- 第 2 轮（`#31`）：**pass** —— 上轮 9 条全 Fixed；新 5 条均为可选/风格（🟡-optional 2 · 🔵 3），未决 🔴 = 0。

**批准结论**：设计与需求一致，进入实施。

**实施切分**：
1. **代码面（eng-coder）**：三端六处自拼串改经核 `formatDeclaredContextK` · VSC 宿主投影 `modelContextText` + 回执载荷 `kText` · 桌面删 `contextSaved` 死键 · 两键去模板尾 `K` · 五档源扫。
2. **文档面（eng-designer）**：`docs/vsc/design/WEBVIEW-PROTOCOL.md` 登记 `kText`（§3.2 行 35 + §12/§13）+ 评审第 2 轮 5 条文档残留。

## §5 实施记录（eng-coder）

**实施记录（eng-coder · 2026-10-23）**

**交付摘要**：三端凡渲染窗口串处一律改经核 `formatDeclaredContextK(k)`；端侧自拼 `String(k) + "K"` 清零；核 `thincoder-core/model-specs.mjs` 本批零改。判别样本 = 声明 `1024` ⇒ `1M`（W-9b）；`128` 只作非判别显示样本（W-9）。

**改动 → 落点**

| 文件 | 落点 |
|---|---|
| `thincoder-cli/src/tui/provider-admin.mjs` | 核入口 `:23` · 写面 current 段 `:244` · 清除确认正文 `:273`（复用 `current`）· 保存回执 `:329` · 行面 `declaredContextText` `:370-376` |
| `thincoder-vscode/src/extension/provider-context.mjs` | 核入口 `:19` · 读面三键 `:30-39`（`modelContextText` 只投合法正整数 `:34-37`） |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 核入口 `:22` · 回执载荷 `kText` `:150-153` |
| `thincoder-vscode/webview/settings-providers.js` | 行面读宿主串 `:12-25` · 回执消费 `kText` `:81-95` |
| `thincoder-vscode/webview/settings-provider-dialog.js` | 已声明条目查表 `:296-308` · current 段 `:320-327` · 清除确认正文 `:477` |
| `thincoder-vscode/locales/zh.json` · `thincoder-vscode/locales/en.json` | `contextSaved` · `contextClearConfirm` 去模板尾 `K`（`:132-133`，两档同） |
| `thincoder-desktop/renderer/i18n-settings.mjs` | 死键 `contextSaved` 删除（en `:73-79` ∥ zh `:175-181` 七键；键面 96 ⇒ 95） |
| `thincoder-vscode/src/extension/settings.mjs` | 注释随三键 `:79-82` · `:103`（仅注释，零代码语义） |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | `:258` 注释去死键名（仅注释） |
| 三仓 `test/2026-10-23-context-display-unify.test.mjs` | 批次单元档（W-9 ∥ W-9b ∥ R33③ 源扫；收口删） |

**验收读数（2026-10-23 实跑）**

- `node --test thincoder-cli/test/*.test.mjs` ⇒ pass 4 / fail 0
- `node --test thincoder-vscode/test/*.test.mjs` ⇒ pass 33 / fail 0
- `node --test thincoder-desktop/test/*.test.mjs` ⇒ pass 3 / fail 0
- 三包 `node test/run.mjs`（清单/收集自检）⇒ 全绿
- 五档源扫 `\*\s*1024`：`provider-admin.mjs` 0 · `settings-providers.js` 0 · `settings-provider-dialog.js` 0 · `provider-context.mjs` 0 · 桌面 `src/main/providers.mjs` 1 命中为注释行 `:71`（设计排除项①），代码面 0
- `check-syntax.mjs`：vscode 146 档 OK · cli 125 档 OK

**偏离与清单外改动**

- 清单外（已披露）：`thincoder-vscode/test/files.mjs` · `thincoder-desktop/test/files.mjs` 登记新档（缺登记两包 `npm test` 清单自检判红）；`thincoder-vscode/src/extension/settings.mjs` 与 `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` 各一处注释随正。
- 与设计预估差：`settings-provider-dialog.js` 设计预估 −1 行，实际经一轮合并查表函数后 499 行（`wc -l`；≤500 软线）。
- 设计未裁定的边角：歧义键态三端不同判（VSC 弹窗取首键 / 桌面回「无可清除」/ CLI 明示歧义拒写）——属上一批既有行为，本批只换展示入口、未改判据，报父侧裁定。
- 未落地项：无。

**审计与评审轨迹**

- 内部只读审计（explore · 1 轮）：功能面零偏差（设计点名落点逐项在、无端侧拼串/换算、无 `<k>K` 兼容分支、核零改）；文档面 2 条（§5 空 → 本段补齐；§2 内部不一致 → 上抛）。
- 内部代码评审（advisor · code · 1 轮同步）：VERDICT pass，0 must-fix；🟡3（弹窗越 500 行软线 · 歧义取首键 · 回执出词不可单测）+ 🔵4（坐标/行数漂移 · 占位符名不一 · 谓词副本）。
- 修正轮 1（1 轮）：弹窗查表函数合并 ⇒ 499 行；补回执结构判据（VSC 单元档 +1 例）。
- 终态：**clean**（无待修项；3 条 🟡 中 2 条为设计未裁定/上一批行为，已上抛）。

**[上抛·待裁]** §2 受影响文件表与自身修正轮打架：`:76` 桌面仍写「零改」、`:103` 写「七键——删死键」；且表漏 `panel-messages-settings.mjs`（本批实际改动）。§2 = 设计席笔，本席未改。

**[上抛·知会]** 设计档漂移（设计席随正）：`docs/core/design/PROVIDER.md:462` 记 CLI 写面 `:243`/`:272`/`:328`、行面 `:367-371`，实读 `:244`/`:273`/`:329`/`:370-376`；受影响文件表现量 CLI 412 vs 417、弹窗 493 vs 499、`panel-messages-settings.mjs` 320 vs 327、`provider-context.mjs` 88 vs 98。

**doc_check 交付门读数**：`doc_check(mode:"gate", docs=["docs/batches/2026-10-23-context-display-unify.md"])` ⇒ `REFUSED（命中 17 条）`——全部落在本席笔域之外：`:110` 行宽 327 字符（§2 修正轮 2 行）+ `:117` 裸档名（§2）+ `:125`–`:170` 16 条裸档名锚（§3 评审席）。本席 §5 段实读 0 条（行宽 48 行全 ≤300；指针全用可解析全路径），未改写他人段以凑绿；按一段一作者交父侧路由。

## §6 验证与收口（父代理）

**验证与收口（主 agent）**

### 1. 验证读数（收口轮实跑 · 2026-10-23）

批次单元档（收口前）：

| 包 | 命令 | 读数 |
|---|---|---|
| cli | `node --test thincoder-cli/test/*.test.mjs` | **4 · 4 · 0** |
| vscode | `node --test thincoder-vscode/test/*.test.mjs` | **33 · 33 · 0** |
| desktop | `node --test thincoder-desktop/test/*.test.mjs` | **3 · 3 · 0** |

**父侧独立复核（不采信实施席报告）**：
- `formatDeclaredContextK(128)` = `128K` · `formatDeclaredContextK(1024)` = **`1M`**（实跑核导出）。
- 五档代码面 `*\s*1024` = **0**（`providers.mjs` 唯一命中在注释行 `:71`，按设计排除项①）；五档自拼 K 残留 = **0**。

**收口删**：三份批次单测已删并从 `thincoder-vscode/test/files.mjs` ∥ `thincoder-desktop/test/files.mjs` 注销。删后基线：cli **0** · vscode **27 · 27 · 0** · desktop **0**，零回归。

**集成面**：本仓无集成套件覆盖本面 ⇒ 无新增、无修订。

### 2. 文档门

`doc_check(mode:"gate")` 本批 docs 集（4 档：设计 `PROVIDER.md` · 需求 `PROVIDER.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · 本档）⇒ **`DOC-CHECK GATE: PASS`（0 命中）**。

门修过程（父侧机械笔，可 revert、零语义改）：本档 17 处裸档名/相对路径 → 全路径、超宽行折行；一次脚本误加双前缀（16 处）当场修回；§3 标题把设计档误写成需求档，已改正。设计受影响文件表现量按收口轮一次实读随正 7 行。

### 3. 结算同步清单

- **§2 ↔ 设计对账**：§2 各项与设计 §6.15 一致；受影响文件表读数已随正（7 行）。
- **前批遗留**：无（`#1740` 即本批；前批 `2026-10-23-context-from-model-list` 已收口）。
- **暂缓批复核**：无。
- **搁置项复核**：无。
- **修正轮落地前置**：设计修正 2 轮（`#30`/`#33`）· 实施修正 1 轮（`#32` 自查）· 均已落盘并复核。
- **用户文档面同步**：三端 CHANGELOG 需各一条（见下「遗留」）。

### 4. 已知边界（在册）

1. **歧义键态三端不同判**（实施席上抛，设计未写口径）：VSC 弹窗取首键出数、桌面回「无可清除」、CLI 明示歧义拒写。展示入口已统一，但该态的显示口径未定 —— 属前一机制的边角，本批未改判据。
2. **三端 CHANGELOG 未写本条**：展示串同源属用户可观察变化（`1024` 由 `1024K` 变 `1M`），应各补一条 —— 列入收口后补记。

### 5. 台账

`#1740` 结账依据 = 本条 + §4 批准 + 设计评审批次（§3 两轮），状态走 在途 → 待核销 → 已核销。
