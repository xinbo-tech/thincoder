# 2026-11-01 · prompt-unit-test-location
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户在 2026-11-01 01:27 要求检查提示词体系、分析设计档反复写错单测档路径的成因；父侧排查见 `docs/batches/2026-11-01-opencode-session-header.md` §6.5；01:50 用户追问「提示词处理了吗？」⇒ 开批。。
> 台账 = #1926（PROMPT-SYSTEM · 归批）。前情 = 2026-11-01-opencode-session-header（已收口 2026-11-01）—— 该批 §6.5 排查出本批要治的两处缺位。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

### 1.1 一句话

**提示词补两句：单测档住哪 · 先例必须在盘上。**

### 1.2 病（实测，不是推断）

**同一形状已犯两次**：设计席把批内单测档写成 `<包>/test/xxx.test.mjs`（`2026-10-30` SSH 批被评审抓住 · `2026-11-01` 会话标识头批被实施席抓住）。

**根因 = 三层同时缺位，且提示词在往反方向推**（父侧排查全文 = `docs/batches/2026-11-01-opencode-session-header.md` §6.5）：

1. **规则本体不缺** —— `docs/core/design/TESTING.md:90 ∥ :130 ∥ :145 ∥ :529` 都写明单测档住 `docs/batches/`。
2. **提示词层零覆盖** —— `thincoder-core/prompts/**` 16 档：`docs/batches` **0 命中** · 单测/单元测试 **0 命中** · 零留存/用毕即删 **0 命中**；唯一提 `.test.mjs` 的 `thincoder-core/prompts/common.md:353` 方向相反（讲「设计档不得引批档单测档」）。
3. **纪律层半边有位置** —— `thincoder-core/prompts/discipline-engineering.md:171` 给生命周期（收口删）、`:187` 给集成用例位置，**单测档只给生命周期没给位置**。
4. **先例库是死的** —— 设计档引 `<包>/test/*.test.mjs` 共 **253 处、盘上存在 0 处**；而 `thincoder-core/prompts/discipline-engineering.md:76` 要求「先例勘察、先对齐」⇒ **照做就抄到旧形**。

### 1.3 父侧裁定的最终文字（中文定稿 · 英文运行面由实施席逐字对应）

**句一 —— 补在「Delete on use」那条后面**（`thincoder-core/prompts/discipline-engineering.md:171` 所在条目）：

> **单测档与批档同目录、同名前缀**：住 `<docRoot.batches>/<批档名>.test.mjs`，收口时删。
> 为什么：收口门只扫批档所在目录；而包内 `test/` 下任何一个 `*.test.mjs` 都会让该包的 `npm test` 恒红（核 runner 的收集面反查直接 fail）。放在别处的档，收口时没人点它的名，它会活下来，然后把 `npm test` 永久弄红。

**句二 —— 补在「Closest-precedent survey」那条里**（`thincoder-core/prompts/discipline-engineering.md:76`）：

> **先例必须在盘上**：先例坐标只有在它指的文件现在还在时才成立；引一条已经不存在的路径，那是旧例、不是先例，照抄它就是复现漂移。
> 为什么：换掉一条规则之后，旧的例子不会自己消失——设计档里成千上万行旧坐标还在教下一个读者旧形，而「先对齐先例」会忠实地把它们抄回来。

### 1.4 边界（不做）

- **不给 `doc_check` 加「设计档引用的 test 路径必须存在」机检** —— 253 处存量会一次全红，违 `N2 零假阳优先`。**先清先例（`#1925`）再谈机检，顺序反了就是造一片红海。**
- **不清 253 处存量**（`#1925` 归批，另批做）
- 不改 `docs/core/design/TESTING.md` 的任何口径句（它本来就对）
- 不动人格层、不动 common 层、不动 advisor 层 —— 两句话落在 `thincoder-core/prompts/discipline-engineering.md` 一处（单一权威源）

### 1.5 边界收窄（父侧 · 评审轮次 2 之后）

**原边界**（§1.4）：不改 `docs/core/design/TESTING.md` 的任何口径句——「它本来就对」。

**这条前提被推翻**：`:126` 的 cli 行写「`fail 0` + exit 0；集成目录空 ⇒ …exit 1」，而 `thincoder-cli/test/run.mjs:41` 是**唯一出口**（无条件 exit 1，`:40` 只是说明串；`thincoder-cli/test` 无 `test/integration/`）。同档 `:563` ∥ `:542` 与代码一致，故 `:126` 是陈旧读数。

**收窄后的边界**：
- **允许改 `docs/core/design/TESTING.md:126`（cli 行）与 `:128`（render-core 拆面）**——这两处与代码相反，且本批新写的 §2.4 正落在同档，不修就是同档两处活描述互斥。
- 其余既有口径句仍不改。

**理由**：本批的立论正是「`:126` 那种写法把 cli 当 exit 0」，留着它等于自己打自己。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 3：评审轮 3 残留 🔵4·7·8·9 处置完毕（§2.10）；设计档号一律改节锚 ∥ 引文定位，围栏块零改）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 落点 | 面 |
|---|---|---|---|
| 1 | 句一入提示词：单测档与批档同目录、同名前缀，收口删 | `thincoder-core/prompts/discipline-engineering.md`（`Delete on use` 条之后） | 产品代码面（提示词） |
| 2 | 句二入提示词：先例坐标只有它指的文件还在盘时才成立 | 同档（`Closest-precedent survey` 条内） | 产品代码面（提示词） |
| 3 | 两条机制依据各落其主，不互相重述 | 句一 = `docs/core/design/TESTING.md` §2.4（已落）· 句二 = `docs/core/design/PROMPT-SYSTEM.md` §6.58 ∥ §7 D-PS50（已落） | 设计档面 |

**明确不做**（§1.4 边界）：不给 `doc_check` 加路径存在机检 · 不清存量旧坐标（台账 `#1925`）· 不改 `docs/core/design/TESTING.md` 既有口径句 · 不动人格层 ∥ `thincoder-core/prompts/common.md` ∥ advisor 层。

### 2.2 给实施席的逐字对应表（哪一句 → 哪个文件哪一条 → 加在这条的前 / 后）

| 句 | 文件 | 落在哪一条 | 位置 | 动作 |
|---|---|---|---|---|
| 句一 | `thincoder-core/prompts/discipline-engineering.md` | `- **Delete on use — an action, not a question**`（含 4 行续行） | 该条**之后**、`- **The change's implementer writes them and runs exactly those for the changed face**` 那条**之前** | 插 3 行（规则 ∥ why ∥ 按包后果），缩进两空格 |
| 句二 | 同档 | `**Closest-precedent survey = three questions before any new landing**`（含三答形） | 该条**之内**：三答形之后、`**Where the answer lands**…` 那行**之前** | 插 2 行（规则 ∥ why），缩进五空格 |

**逐字英文面 = `docs/core/design/PROMPT-SYSTEM.md` §6.58 的两个围栏块（唯一副本）**：实施席照抄，不重写措辞、不折行、不补标点。句二首行是**条件句**（`Before an existing: answer is used …`），不是第四个答案键；句一第三行是 why 的按包后果行，不是新规则。

**不许动别的条目**：本档只增这 5 行。零改面 = `Delete on use` 条原文 ∥ 三答形 ∥ `**Where the answer lands**` ∥ `thincoder-core/prompts/common.md:353` ∥ 人格层 ∥ advisor 层 ∥ 其余 15 档。

### 2.3 机制设计

- 句一的依据 = `docs/core/design/TESTING.md` §2.4：位置由两条结构事实强制——收口门只读批档所在目录（§3.5 判据 1）；包内 `test/` 下的档按面各归其面（cli ∥ core 拒串 `thincoder-core/test/run.mjs:35` ∥ `thincoder-cli/test/run.mjs:36`；render-core 顶层档照跑 `thincoder-render-core/test/run.mjs:81`）。
- 句二的依据 = `docs/core/design/PROMPT-SYSTEM.md` §6.58：旧坐标不随规则替换自行消失，而「先对齐先例」会忠实抄回旧形。
- 两处各写各的，不互相重述（D2）。
- **句一 why 的后果按包分开读**：cli ∥ core 的包入口今天无条件 exit 1（`thincoder-cli/test/run.mjs:40-41` ∥ `thincoder-core/test/run.mjs:39-40`——包内集成集已归仓根），错位档在那里只把常态说明串换成收集面拒串；绿→红发生在空集仍直通 exit 0 的 vscode ∥ desktop（`thincoder-vscode/test/run.mjs:48` ∥ `thincoder-desktop/test/run.mjs:36` 未登记即 fail）；render-core 顶层错位档被自己单层 glob 收起来跑（`:81`，只有嵌套档判错位 `:38-40`）⇒ 假绿。评审首轮「cli 常态 `fail 0` + exit 0」引的 `docs/core/design/TESTING.md:126` 是陈旧读数（cli 包内无 `test/integration/`，本席 `ls` 实读：`run.mjs` ∥ `slow.mjs`），本批已将 `:126` 改实读、`:128` 拆成 vscode ∥ desktop 与 render-core 两行（§1.5 收窄边界）。

### 2.4 关键决策

- **K1 两句都落工程纪律层一处**：`thincoder-core/prompts/common.md` 是两模式共读面，普通模式不产批内单测档，写进去对普通读者是误导。
- **K2 句一接在 `Delete on use` 之后**：缺的是同一条的落点半句；另起一节 = 同一机制两处活描述。
- **K3 不给 `thincoder-core/prompts/common.md:353` 加交叉指**：那句讲**引用面**（设计档不得引批档单测档），句一讲**落点面**；两条平行轴，不冲突也不互补，加指针只多一处维护面，而提示词面禁指针。
- **K4 句二并入先例勘察条、不新建条**：三答形与「先对齐」已在该条，缺的是「对齐对象必须还在盘」这一条件。
- **K5 句一 why 的后果行按包写准**：写「该包入口以收集面拒串失败」并把三面分开（cli ∥ core 本来就非零 ∥ vscode ∥ desktop 绿→红 ∥ render-core 自己收起来跑）。理由 = 笼统的「入口红」在 cli ∥ core 上不成立，读的人会据此推断错场合。
- **K6 句二首行改成条件句**：`**Precedent must exist on disk**` 与三答形同形、紧贴其后会被读成第四答；条件句读成对 `existing:` 第一答的附加条件。仍并入同条（K4 不变）。
- **K7 「同名」半边的后果只落设计档、不进提示词**（评审 🔵6）：两次复发都是位置错，提示词面不为没发生过的形状加行；推导落 `docs/core/design/TESTING.md` §2.4（无主候选不判 ⇒ 同样活下来）。

### 2.5 受影响文件与测试覆盖

| 文件 | 改动 | 面 |
|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | +5 行（句一 3 行 ∥ 句二 2 行） | 产品代码面（写门） |
| `docs/core/design/TESTING.md` | 新增 §2.4 + §2.3 表 `:126` 改实读 ∥ `:128` 拆两面 | 设计档面（已落） |
| `docs/core/design/PROMPT-SYSTEM.md` | §6.58 新增 · §6.1 一行 · §7 D-PS50 | 设计档面（已落） |
| `docs/batches/2026-11-01-prompt-unit-test-location.md` | 本段 | 批档面 |

**本批单测档 = 无**：改动面是提示词文本 + 设计档，无可执行行为；验收 = 文本在场机判（§6.58 A1 ∥ A5）+ `doc_check` gate。这是「本批无可跑测试」，不是「略过测试」。

### 2.6 验收对照（回指条目）

| 条目 | 验收 |
|---|---|
| 1 | §6.58 A1（五行逐字在盘）· A5（L1 三行贴 `Delete on use` 之后、下一 bullet 之前）· A3（`##` 11 ∥ `###` 7 ∥ 标题节点 18 零连带） |
| 2 | §6.58 A1 · A5（L2 首行是条件句、仍在先例勘察条内、后接 `**Where the answer lands**`） |
| 3 | 两处设计档在盘且不互抄：`docs/core/design/TESTING.md` §2.4 只讲句一，§6.58 只讲句二 |
| 全部 | §6.58 A6：`doc_check(mode:"gate")` 首行 `PASS` |

**not integration-test verified** —— 本批零代码、零业务可观察结果变化，集成集不新增用例；父侧收口的集成池跑是唯一一次集成运行。

### 2.7 上抛项

1. 〔父侧 · 知会（已按实测落）〕§1.3 中文定稿的 why 写「让该包的 npm test 恒红」；实读是**收集面反查 fail**，而 cli ∥ core 两个包入口今天无条件 exit 1（`thincoder-cli/test/run.mjs:40` ∥ `thincoder-core/test/run.mjs:39`）⇒ 英文面改成**按包分开**写：收集面拒串 + 本就非零的两面 + 绿→红的两面（vscode ∥ desktop）。评审 🟡1 的「cli 常态 `fail 0` + exit 0」引的是 `docs/core/design/TESTING.md:126` 前半支；cli 包内无 `test/integration/`（本席 `ls` 实读）⇒ 走的是该行后半支、读数同为 exit 1——照评审原话写「cli 由绿变红」会把不成立的事实落进提示词。
2. 〔父侧 · 编号〕§7 本席落 D-PS50（顺 D-PS49 下一位）；编号可由父侧收口时改。

### 2.8 修正轮 1（评审 🟡1·3·4·5 ∥ 🔵6·7·8 处置）

| # | 处置 | 落点 |
|---|---|---|
| 🟡1 | **部分驳、按实测落**：cli 常态不是 `fail 0` + exit 0（`thincoder-cli/test/run.mjs:40` 无条件 exit 1；`ls thincoder-cli/test` = `run.mjs` ∥ `slow.mjs`、无 `integration/`）。why 补回「入口失败」半句，并按包写准（cli ∥ core 本就非零 ∥ vscode ∥ desktop 绿→红 ∥ render-core 自己收起来跑） | `docs/core/design/PROMPT-SYSTEM.md` §6.58 L1 第三行 ∥ `docs/core/design/TESTING.md` §2.4「哪个入口由绿变红，按包分开读」∥ C3 |
| 🟡2 | **不成立、零改**：`<docRoot.batches>` 在提示词面在用（`thincoder-core/prompts/persona-engineering.md:331` ∥ `:449`；`thincoder-core/prompts/discipline-engineering.md:342` 同族 `docRoot.*`） | 零改 |
| 🟡3 | 读者面一行（设计席 ∥ 实施席读得到；评审席有意不覆盖、兜底 = 下一道手） | `docs/core/design/PROMPT-SYSTEM.md` §6.58「读者面」块 |
| 🟡4 | 句二首行改条件句 + C2 补双侧 | §6.58 L2 围栏块 ∥ A1 ∥ A5 ∥ C2 |
| 🟡5 | §2.4 口径改指回 `docs/core/design/TESTING.md` §2 ∥ §3.1 ①，只留推导面 | `docs/core/design/TESTING.md:139` |
| 🔵6 | 「同名」半边后果落设计档（不进提示词，K7） | `docs/core/design/TESTING.md` §2.4「名字记错也逃」 |
| 🔵7 | 档位结论 + 引用锁读数两行 | `docs/core/design/PROMPT-SYSTEM.md` §6.58 受影响文件表下 |
| 🔵8 | 归属复核一行（收口轮按文档地图复核一次） | 同处「归属复核」 |

**数值随正**：本档只增行 4 ⇒ **5**（句一 3 行 ∥ 句二 2 行）；A1 五行 · A2 改前 +5 · A4 行宽 142 ∥ 268 ∥ 186 ∥ 243 ∥ 210（本席本轮 node 实读）；§7 D-PS50 同步 +5。

**上抛**：见 2.7 第 1 条（评审 🟡1 的引据与实测分叉处——照原话写会把不成立的事实落进提示词）。

### 2.9 修正轮 2（评审轮次 2：🔴2 · 🟡1 · 🔵3 处置）

| # | 处置 | 落点 |
|---|---|---|
| 🔴1 | **取处置①：第三行补 render-core 第三面，不收窄通例** —— 第二行原把后果写成通例（「包内 `test/` 下任一 `*.test.mjs` 必被判错位」），在 render-core 面为假（`thincoder-render-core/test/run.mjs:38-40` 只判嵌套档、`:81` 单层 glob 收顶层档照跑）。§2.4 与该面写作**假绿**（临时件冒充覆盖），不是变红 | `docs/core/design/PROMPT-SYSTEM.md` §6.58 L1 第二 ∥ 第三行 · K5 · K8 · 上抛项 1 · `docs/core/design/TESTING.md` §2.4 |
| 🔴2 | **按 §1.5 收窄边界改两行**：`:126` cli 行改成实读（零目标集合 ⇒ 常态 `✖ no integration test set …` + exit 1；`fail 0` + exit 0 在这面从不出现）∥ `:128` 拆成 vscode ∥ desktop 与 render-core 两行 | `docs/core/design/TESTING.md` §2.3 表 `:126` ∥ `:128`–`:129` |
| 🟡3 | 模板界定成 stem：`<batch record name, no .md>`；C1 同步，并写明写成 `<档>.md.test.mjs` 仍按最长前缀判归本批（§3.5 判据 2）但与名字面不符 | §6.58 L1 首行 · C1 · A4 行宽 |
| 🔵4 | 读数漂移改正：判条 1 的 `docs/core/design/TESTING.md:145` 改节锚（§2 ∥ §3.1 ①，行号 as-of `:90` ∥ `:130` ∥ `:159`——§2.4 插入后原号已落新节内）；`##` 末位 `:349` → 实测 `:348`；A3 的 357 行 → 本席 node 实读 358 行 | §6.58 判条 1 · A3 |
| 🔵5 | 坐标改区间：cli `:40-41` ∥ core `:39-40`（`process.exit(1)` 实在 `:41` ∥ `:40`，`:40` ∥ `:39` 是说明串） | §6.58 上抛项 1 · 本档 §2.3 · §2.8 |
| 🔵6 | 归属复核换成已核结论：地图在盘 = `docs/README.md`（AGENTS.md 指名）——`:51` 把提示词系统归本档 ∥ `:78` 列 `docs/core/design/TESTING.md` ⇒ 两节各归其主 | `docs/core/design/PROMPT-SYSTEM.md` §6.58 归属复核 |

**数值随正**：L1 仍 3 行 ∥ L2 2 行 ⇒ 增行仍 **5**；A4 行宽 = 150 ∥ 133 ∥ 281 ∥ 243 ∥ 210（本席本轮 node 实读，全档 `>300` = 0）；A1 五行 ∥ A2 改前 +5 不变；A3 改前读数 = 358 行 / `##` 11 / `###` 7 / 标题节点 18（node 实读）。

**🔴1 要求的同口径面**：围栏块第三行 ∥ K5 ∥ K6 ∥ K8 ∥ 上抛项 1 —— 一律读作「cli ∥ core 只换说明串 ∥ vscode ∥ desktop 绿→红 ∥ render-core 假绿」。

**边界随 §1.5 收窄**：`docs/core/design/TESTING.md` 允许改 `:126` ∥ `:128` 两行（与代码相反，且本批 §2.4 正落在同档），其余既有口径句仍不改；§6.58 边界条与 §7 D-PS50 已同步收窄。

**上抛**：见 §2.7 第 1 条（已按五面重写，含 render-core 面）。

### 2.10 修正轮 3（评审轮 3 残留 🔵 4 条 · 父侧点名处置）

| # | 处置 | 落点（改后坐标） |
|---|---|---|
| 🔵4 读数漂移 | 先例句里的 heading 位置枚举整串删号，改成「计数 + 两条复算正则」；对 `docs/core/design/TESTING.md` 的节引用删号，只留 `§2 ∥ §3.1 ①` | `docs/core/design/PROMPT-SYSTEM.md:5213` ∥ `:5215` |
| 🔵7 自造新 stale | `§3.1 ①（:159）` 删号（`:159` 是空行）；同条 `:171` 三处一并删号、改引文定位——父侧裁定：as-of 号每次立刻过期 ⇒ 一律不写 | `docs/core/design/PROMPT-SYSTEM.md:5106` ∥ `:5108` ∥ `:5110` ∥ `:5205` |
| 🔵8 同口径措辞 | 取「K6 补后果词」：`render-core 自己收起来跑 ⇒ 假绿`，与 K5 ∥ K8 ∥ 围栏块第三行 ∥ 上抛项 1 五处同形 | `docs/core/design/PROMPT-SYSTEM.md:5197` |
| 🔵9 漏面 | 改成三面齐：空集直通 = vscode ∥ desktop ∥ render-core，**绿→红只前两面**，render-core 由下一句单说（假绿） | `docs/core/design/TESTING.md:148` |

**读数更正（父侧 `:348` 不成立）**：

- `thincoder-core/prompts/discipline-engineering.md` 本轮 node 实读 = 363 行 · `^## ` 11（`:3/:28/:52/:101/:126/:138/:147/:156/:170/:226/:353`）· `###` 7。
- 末位 `##` 在 `:353`（`## Parallel calls`）；`:348` 是 `### Docs must be human-readable` 节内的段落行。
- §2.9 记的 `:349` ∥ `:348` 两说都不成立；该枚举已按上表删号，此后不再出现。

**未改的号（本轮实读仍准，故不动）**：`docs/core/design/PROMPT-SYSTEM.md` 里对 `docs/core/design/TESTING.md` §2.3 表的行指 `:126` ∥ `:128` ∥ `:129` —— 三者是「表里哪一行」的定位，节锚表达不了行，且本轮在盘复核一致。

**零改面**：`thincoder-core/prompts/discipline-engineering.md`（实施已落，一字未动）· §6.58 两段围栏块逐字 · §6.58 A1–A6 ∥ 用例表 ∥ 落点表 · 代码 · 需求档 · 其余 15 档 · 别批档。

**验收增量**：`doc_check(mode:"gate", docs=["thincoder-core/prompts/discipline-engineering.md","docs/core/design/PROMPT-SYSTEM.md","docs/core/design/TESTING.md"])` 首行 `PASS`（读数见下方回执行）。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 3 轮 pass（前轮 🔴2 均已落地在盘核过；残留 4 条 🔵 不阻塞）· 2026-11-01）



### 轮次 1（评审子代理）

### 设计评审 · §2 prompt-unit-test-location（设计首轮）

**评审面**：`docs/batches/2026-11-01-prompt-unit-test-location.md`（§2）· `docs/core/design/PROMPT-SYSTEM.md`（§6.58 ∥ §7 D-PS50）· `docs/core/design/TESTING.md`（§2.4）· AGENTS.md。判据面 = 独立评审提示词 12 条。

**四个重点的判定（据在盘证据）**

- ① why 讲后果不讲规条：L1（`docs/core/design/PROMPT-SYSTEM.md:5131`）写「门只读本目录 ⇒ 放在别处没人点名 ⇒ 活下来」+「包内 `test/` 下的档撞该包收集面反查」；
  L2（`docs/core/design/PROMPT-SYSTEM.md:5138`）写「旧例子不随规则替换消失 ⇒ 成批旧坐标还在教旧形 ⇒ 先对齐先例会忠实抄回」。
  对没见过的场合可推 —— C2（`docs/core/design/PROMPT-SYSTEM.md:5157`）已把「命中已删坐标」写成一条用例。后果缺口见 #1 ∥ #6。
- ② 纪律层覆盖面：主链槽位 = persona → common → discipline → 子代理层（`docs/core/design/PROMPT-SYSTEM.md:175`）⇒ 设计席 ∥ 实施席读得到，设计席正是写这条路径的人。
  评审席读不到 —— 顾问 / 会诊是自含装配（`docs/core/design/PROMPT-SYSTEM.md:5261` D-PS46），而设计没把这层边界写下来 ⇒ #3。
- ③ 句二与「先例库丰富、照抄就对」不冲突：L2 说「坐标只在所指文件还在盘时成立」，与 `thincoder-core/prompts/common.md:353`（引批档单测档的条款随该档关闭而死）同向；C2 给了边界形。
  但 L2 题眼与三答形同形，紧贴其后会被读成第四答；「先例作废」这一误读没有边界句兜 ⇒ #4。
- ④ §2.4 ∥ §6.58 权威不重叠成立：§2.4（`docs/core/design/TESTING.md:137`–`:145`）只讲句一的两条结构事实与因果；
  §6.58（`docs/core/design/PROMPT-SYSTEM.md:5114`）明写句一人读权威 = §2.4、本节不重述推导，句二权威明写在本节（`:5116`）。残留 = §2.4 开头的口径重述 ⇒ #5。
- 父侧事实纠正核法：方向对一半。反查 fail 确是 why 第二半的依据（`docs/core/design/TESTING.md:143`）；但「这两个包入口常态 exit 1」只对核包成立
  （`docs/core/design/TESTING.md:127`），cli 常态 = `fail 0` + exit 0（`docs/core/design/TESTING.md:126`）⇒ 对 cli 一条错位档确实由绿变红，而 §2.4 逐字写「还把该包入口弄红」（`docs/core/design/TESTING.md:143`）。见 #1。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 证据 ∥ 验收对照 | 🟡 | 上抛项 1（`docs/core/design/PROMPT-SYSTEM.md:5210`）按「这两个包入口本来就常态 exit 1」否掉「恒红」，实测只对核包成立：cli 常态 `fail 0` + exit 0（`docs/core/design/TESTING.md:126`），核包 exit 1（`:127`）。后果：L1 的 why（`:5131`）只留反查 fail，丢掉 §2.4 逐字的强后果「把该包入口弄红」（`docs/core/design/TESTING.md:143`）；用例 C3（`:5158`）与围栏块逐字（`:5131`）已不一致。 | 按包分开落事实（cli 由绿变红 ∥ 核包本来就红）；C3 与 `:5131` 逐字对齐，或把「入口红」这半句补回 why。 |
| 2 | 清晰度 | 🟡 | L1 落点写 `<docRoot.batches>/<batch record name>.test.mjs`（`docs/core/design/PROMPT-SYSTEM.md:5130`），勘察证据行（`:5195`–`:5204`）无一行证明该 token 在提示词面可解析；纪律层既有口径是散文名（`docs/core/design/PROMPT-SYSTEM.md:335`，硬路径已清出）。同一句里同一处两个叫法：规则半用 token、why 半用 "the batch record's own directory"（`:5130`–`:5131`），与一个东西一个说法（`:464`）相背。 | 给该 token 补在盘依据（提示词面现用引文），或与 why 半统一成提示词面已在用的说法。 |
| 3 | 需求覆盖（席位面） | 🟡 | 设计没写「这两句话谁读得到」。既有件三问把 L2 读者写成设计席 + 主 agent 直改笔（`docs/core/design/PROMPT-SYSTEM.md:5191`），而纪律层在主链槽位内（`:175`）、顾问 / 会诊自含装配（`:5261`）⇒ 判「先例必须在盘」的评审席读不到；§1.4 ∥ `:5173` 只写「不动 advisor 层」，未写这层后果。 | 落一行覆盖面声明（哪个席位读得到这四行；评审席是否有意不覆盖、为何可接受）。 |
| 4 | 清晰度（句二读法） | 🟡 | L2 题眼 `**Precedent must exist on disk**`（`docs/core/design/PROMPT-SYSTEM.md:5137`）紧贴三答形（`:5125` ∥ `:5149`），题眼形与 `existing:` ∥ `none found:` ∥ `existing but unusable:` 同形 ⇒ 可被读成第四答；A5（`:5149`）只防「与 `none found` 混读」。设计也没写 L2 是 `existing:` 一答的条件、不是抽掉「先对齐」——「先例作废」误读无边界句兜。 | 记下 L2 的读法定位并给对应措辞形；C2 补另一侧（先例仍在盘 ⇒ 照抄成立、勘察义务不变）。 |
| 5 | 文档归属 | 🟡 | §2.4 开头重述既有口径：`docs/core/design/TESTING.md:139`「位置口径：单元测试档住 `<docRoot.batches>/<批档名>.test.mjs`」，而同一规则已由 `:90` ∥ `:130` ∥ `:155` 拥有（§2.4 自己回指 §2 ∥ §3.1 ①）⇒ 同档内同规则两处规范陈述。 | §2.4 只留推导面（两条结构事实 + 因果），口径陈述留给 `:90` ∥ `:155`；或明写哪一行是口径权威行。 |
| 6 | 需求覆盖（why 后果面） | 🔵 | L1 的 why 只解释「位置」半边后果，「同名」半边没写：收口门按最长名面前缀定归属、无主候选不判（`docs/core/design/TESTING.md:195`–`:196`）⇒ 住对目录但名不对的档根本不被判、也活下来（正是「没见过的场合」那一问）。 | 补一句，或记下为何不写。 |
| 7 | 方法学（同族形制） | 🔵 | 同族各节的两条读数本节缺：① 受影响文件无档位结论行（四个文件全纯 `.md` ⇒ 豁免、无拆分义务，但结论未见一行）；② 无引用锁读数（J1–J3 ∥ 零文档引用），而 §6.9 ∥ §6.10 ∥ §6.56 逐节写明「引用锁无涉」（A6 的 `doc_check` gate 实际兜住）。 | 补一行档位结论 + 一行引用锁读数，与 §6.56 ∥ §6.57 形制对齐。 |
| 8 | 方法学（判据面限制） | 🔵 | 本次评审上下文无文档地图、无独立项目标准档 ⇒ 文档归属条按被审设计档自身与 AGENTS.md 判，未对「该主题是否已有 owning 档」做全仓核对。 | 收口轮按 AGENTS.md 指的文档地图复核一次归属（本批未新建档，预期不冲突）。 |

**已核成立项**（不单列）

- L1 ∥ L2 与 §1.3 中文定稿语义逐条对得上（落点 ∥ 同名前缀 ∥ 收口删 ∥ 现在还在盘 ∥ 旧例不是先例 ∥ 照抄即复现漂移）。
- 先例行在（`docs/core/design/PROMPT-SYSTEM.md:5185`：先例 §6.55 ∥ §6.56 ∥ §6.57 + 对齐 + 两条偏离带理由）。
- 勘察证据行在（`docs/core/design/PROMPT-SYSTEM.md:5195`–`:5204`，含公共源 `index.publicRepos` = `[]` 已查无）。
- 既有件三问三形齐（`docs/core/design/PROMPT-SYSTEM.md:5189` ∥ `:5191` ∥ `:5193`）。
- 集成测试设计在且给唯一合法理由 + RTM 读数（`docs/core/design/PROMPT-SYSTEM.md:5161` ∥ `:5163`）。
- 验收不写全量套跑（A1 逐行 `===` ∥ A2 关系式 ∥ A6 gate）；落点用内容锚不用行号（`:5124` ∥ `:5125`）。
- 用例表覆盖正常 / 边界 / 错误（C1–C4）；零代码面 ⇒ 无分支新增。

**计**：🔴 0 · 🟡 5 · 🔵 3 ⇒ 无阻塞项，本轮判 pass（🟡 均为建议面，处置归父侧）。

VERDICT: pass

### 轮次 2（评审子代理）

> 状态行重置：第 2 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · 2026-11-01

**设计评审 · §2 prompt-unit-test-location（修正轮 1 · 评审第 2 轮）**

**评审面（只评审）**
- 批档 = `docs/batches/2026-11-01-prompt-unit-test-location.md`（§2 · §2.8）
- 设计档 = `docs/core/design/PROMPT-SYSTEM.md`（§6.58 · §7 D-PS50 · §8）· `docs/core/design/TESTING.md`（§2 · §2.4 · §10.3）
- 地图 = `docs/README.md`（AGENTS.md 指名的逐档权威地图）

**只读证据面（不评审，只取事实）**
- runner 五面 = `thincoder-cli/test/run.mjs` · `thincoder-core/test/run.mjs` · `thincoder-vscode/test/run.mjs` · `thincoder-desktop/test/run.mjs` · `thincoder-render-core/test/run.mjs`
- 提示词面 = `thincoder-core/prompts/discipline-engineering.md` · `thincoder-core/prompts/persona-engineering.md`
- 集成面 = `test/RTM.md`

**父侧点名三件的判定**

**(a) 按包写法 —— 四面成立、第五面缺**
- `cli ∥ core 无条件 exit 1` 成立：`thincoder-cli/test/run.mjs:41` 是唯一出口（`:40` 为说明串），`thincoder-core/test/run.mjs:40` 同形。
- cli 包内无 `test/integration/`（`thincoder-cli/test` 实读 = `run.mjs` ∥ `slow.mjs`）⇒ 设计席读数对，首轮「cli 常态 `fail 0` + exit 0」不成立。
- `vscode ∥ desktop 绿→红` 成立：未登记档即 fail（`thincoder-vscode/test/run.mjs:48` ∥ `thincoder-desktop/test/run.mjs:36`），空清单 exit 0（`:53-56` ∥ `:43-46`）。
- 第三面缺：`render-core` 单层 glob（`thincoder-render-core/test/run.mjs:81`）收顶层 `test/*.test.mjs`，错位档被自己跑起来，只有嵌套档 fail（`:38-40`）。
- 设计自己的 K5（`docs/core/design/PROMPT-SYSTEM.md:5193`）∥ §2.4（`docs/core/design/TESTING.md:147`）都写了这一面；逐字块 L1 第三行（`docs/core/design/PROMPT-SYSTEM.md:5134`）没有 ⇒ 见 #1。

**(b) L2 首行不再是第四答 —— 判成立，无发现**
- 三答形是 `- ` 起的键形（`thincoder-core/prompts/discipline-engineering.md:79` 至 `:81`）。
- L2 首行是五空格散文条件句、题眼即 `Before an existing: answer is used`，不同形。
- A5（`docs/core/design/PROMPT-SYSTEM.md:5152`）已把该形写成判据；C2（`:5160`）补了双侧。

**(c) 🟡2 驳回成立、无反证**
- `docRoot.batches` 在提示词面在册并在用：`thincoder-core/prompts/persona-engineering.md:331` ∥ `:449` 逐字在用；定义句 = `:128`；同族 = `thincoder-core/prompts/discipline-engineering.md:342`。
- 首轮「该 token 无在盘依据」的指摘撤回。

**首轮 8 条落地复核**
- 已落：🟡3 读者面（`docs/core/design/PROMPT-SYSTEM.md:5120`）· 🟡5 只留推导面（`docs/core/design/TESTING.md:139`）· 🔵6 同名半边（`:143`）· 🔵7 档位结论 ∥ 引用锁读数（`docs/core/design/PROMPT-SYSTEM.md:5176` ∥ `:5178`）· 🔵8 归属复核行（`:5180`）。
- 部分驳：🟡1（见 (a)）。驳回：🟡2（见 (c)）。改后成立：🟡4（见 (b)）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 ∥ 事实一致性 | 🔴 | L1 第二行把后果写成通例（`docs/core/design/PROMPT-SYSTEM.md:5133`），在 `render-core` 面为假：其单层 glob 收顶层错位档并执行（`thincoder-render-core/test/run.mjs:81`），只有嵌套档才 fail（`:38-40`）。设计自己三处都写了这面 —— K5（`docs/core/design/PROMPT-SYSTEM.md:5193`）∥ §2.8 🟡1（批档 `:118`）∥ §2.4（`docs/core/design/TESTING.md:147`）—— 逐字围栏块（`docs/core/design/PROMPT-SYSTEM.md:5134`）却没写；上抛项 1（`:5221`）又把「绿→红只在 vscode ∥ desktop」挂在一张把 render-core 一并列为 exit 0 的表行（`docs/core/design/TESTING.md:128`）。实施席只照抄围栏块 ⇒ 写进提示词的是五面之一为假的后果。 | 四处同口径二选一：① 第三行补第三面（render-core 收顶层档 ⇒ 该档被执行、零留存失真）；② 收窄第二行通例（只讲有收集面反查的面）并在 §6.58 记一行「render-core 不进提示词的依据」。围栏块 ∥ K5 ∥ §2.8 ∥ 上抛项 1 必须一致。 |
| 2 | 文档归属 | 🔴 | 新 §2.4（`docs/core/design/TESTING.md:147`）断言 cli 入口无条件 exit 1，同档 `:126` 仍把 cli 读数写成 `fail 0` + exit 0、收集面写成「只许住 `test/integration/`」——与代码（`thincoder-cli/test/run.mjs:22` 零目标集合 ∥ `:35-36` 任一档即 fail ∥ `:41` 无条件 exit 1）及同档 `:563` ∥ `:542` 相反。而 `:120` ∥ `:546` 都把那张表 ∥ §10.3 声明为唯一权威面 ⇒ 落笔后同档两处活描述互斥。设计边界（批档 `:57`）明写不改既有口径句，前提「它本来就对」在 `:126` 上不成立（本批正是靠推翻该读成立）。 | 本批已在改这份档：把 `:126` 的 cli 行改成实读，并把 `:128` 的 render-core 按 §2.4 第三面拆出；确定不动则开台账行写明哪份权威、谁被改，不许两说并存。 |
| 3 | 清晰度 | 🟡 | `<batch record name>`（`docs/core/design/PROMPT-SYSTEM.md:5132`）未界定是档名去 `.md` 的 stem 还是含 `.md` 全名；用例 C1（`:5159`）同含糊。写错不致命（`.md.test.mjs` 仍被最长前缀判归本批 —— `docs/core/design/TESTING.md:199` 至 `:200`），但与 §3.1 ①「名随批次档」不符。 | 模板改 stem 形，或同行点明「the record's file name without `.md`」；C1 ∥ A1 同步。 |
| 4 | 证据（读数漂移） | 🔵 | `docs/core/design/PROMPT-SYSTEM.md:5106` 引 `docs/core/design/TESTING.md:145` 为口径行，§2.4 插入后该号落在本批新节内部（原 §3.1 ① 现于 `:159`）；`docs/core/design/PROMPT-SYSTEM.md:5208` 把 11 个 `##` 起行末位写成 `:349`，实测 `:348`。 | 交付前重读坐标，或改节锚（`§3.1 ①`）—— 本档 D-PS49 已取「引文定位、行号只作 as-of」形。 |
| 5 | 证据（坐标精度） | 🔵 | 「无条件 exit 1」两处都引在说明串行：`docs/core/design/PROMPT-SYSTEM.md:5221` ∥ 批档 `:75` 写 `thincoder-cli/test/run.mjs:40` ∥ `thincoder-core/test/run.mjs:39`；`process.exit(1)` 实在 `:41` ∥ `:40`。结论成立，只是坐标停在说明串上。 | 改引区间（cli `:40-41` ∥ core `:39-40`），与父侧实读同形。 |
| 6 | 文档归属（地图） | 🔵 | 「本轮无文档地图」（`docs/core/design/PROMPT-SYSTEM.md:5180`）不实：地图在盘且 AGENTS.md 指名 = `docs/README.md`；其 `:51` 已把「提示词系统」归 `docs/core/design/PROMPT-SYSTEM.md`，`:78` 列 `docs/core/design/TESTING.md` ⇒ 归属结论现在就能给且与落点相符。 | 换成已核结论（两节各归其主 + 地图坐标），不把复核推到收口轮。 |

**已核成立项（不单列）**
- 落点两条内容锚在盘、插入位正确：`thincoder-core/prompts/discipline-engineering.md:171` 至 `:176` 之间 ∥ `:82` 之前；续行缩进 2 ∥ 5 空格与邻行同形。
- A3 计数为真（`##` 11 ∥ `###` 7 ∥ 标题节点 18）；A4 行宽面为真（全档 `>300` = 0，最长行 = `:70` 的 300）。
- 集成设计给唯一合法理由 + RTM 实读：`test/RTM.md` 23 个 CLI 故事节（`### 1.` 至 `### 23.`）+ VS Code ∥ Desktop 两段；故事 7 = `:78` ∥ 故事 20 = `:234` 在盘。
- 验收不写全量套跑（A1 逐行 `===` ∥ A2 关系式 ∥ A6 gate）；档位结论（四个纯 `.md` ⇒ 豁免）。
- 先例行（`docs/core/design/PROMPT-SYSTEM.md:5196`：先例 §6.55–§6.57 + 两条偏离各带理由）· 勘察证据行（`:5206` 至 `:5215`，含 `index.publicRepos` = 空）· 既有件三问三形（`:5200` ∥ `:5202` ∥ `:5204`）。
- 零代码面 ⇒ 无新分支；设计档规范面无 revision 残留。

**计**：🔴 2 · 🟡 1 · 🔵 3

VERDICT: changes-required

### 轮次 3（评审子代理）

**设计评审 · §2 prompt-unit-test-location（修正轮 2 · 评审第 3 轮 · 只核前一轮 6 条）**

**结论：前轮 🔴2 均已落地（在盘核过），🟡1 已落，🔵3 中 1 条残留**

- 前轮 #1（render-core 第三面）：**已落**。围栏块第三行 `docs/core/design/PROMPT-SYSTEM.md:5134` 逐字 `render-core's single-level glob runs a top-level file, so a file made to be deleted passes for coverage`；
  K5 `:5196` ∥ K6 `:5197` ∥ K8 `:5199` ∥ 上抛项 1 `:5226` 同三面；代码对得上——`thincoder-render-core/test/run.mjs:39` 只对 `rel.slice(0, rel.lastIndexOf("/")) !== "test"` fail，`:81` 是 `["--test", "test/*.test.mjs"]`。
- 前轮 #2（`docs/core/design/TESTING.md:126` ∥ `:128`）：**已落**。`docs/core/design/TESTING.md:126` 改后逐字 `常态 = ... + exit 1（process.exit(1) 无条件执行、不跑用例）；ℹ tests ∥ fail 0 + exit 0 在这面从不出现`，与 `thincoder-cli/test/run.mjs:41` 一致；
  `docs/core/design/TESTING.md:128` 只剩 vscode ∥ desktop，`:129` 独立成 render-core 行；与 §2.4（`:146`–`:150`）不互斥——拒串 ∥ 绿→红 ∥ 假绿三面各归其面。
- 前轮 #3（stem）：**已落**。`docs/core/design/PROMPT-SYSTEM.md:5132` 为 `<batch record name, no .md>`；C1 `:5159` 写明 stem 形与 `.md.test.mjs` 仍判归本批。
- 前轮 #5（坐标区间）：**已落**。`docs/core/design/PROMPT-SYSTEM.md:5226` ∥ 本档 `:87` 用 `:40-41` ∥ `:39-40`。
- 前轮 #6（文档地图）：**已落**。`docs/core/design/PROMPT-SYSTEM.md:5180` 换成已核结论；地图实读 `docs/README.md:51` ∥ `:78` 与文中引号相符。
- 前轮 #4（读数漂移）：**残留**，见下表 #1。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 证据（读数漂移 · 前轮 #4 残留） | 🔵 | 三处坐标仍与在盘不符：① `docs/core/design/PROMPT-SYSTEM.md:5213` 仍写 `:3/:28/:52/:99/:124/:136/:145/:154/:168/:221/:349`，实测末位 `##` 在 `thincoder-core/prompts/discipline-engineering.md:348`；② 同档 `:5215` 仍引 `docs/core/design/TESTING.md:90` ∥ `:130` ∥ `:145`，而 `:145` 是 §2.4 内空行（§3.1 ① 在 `docs/core/design/TESTING.md:162`）；③ 本档 §2.9 声明「`:349` → 实测 `:348`」已改，在盘未改 | 交付前把这两行的号刷成 `:348` ∥ `:162`，或按 D-PS49 只留节锚（`§3.1 ①`）不写号 |
| 2 | 证据（前轮修正引入的 stale 号） | 🔵 | `docs/core/design/PROMPT-SYSTEM.md:5106` 把旧 `:145` 换成「§3.1 ①（`:159`）」——`:159` 现为空行，实际行 `docs/core/design/TESTING.md:162`（:126 改实读 + `:128` 拆面 + §2.4 拆两段共 +3 行） | 同上：节锚为准，或同步刷号 |
| 3 | 一致性（措辞差） | 🔵 | 本档 `:156` 声称「围栏块 ∥ K5 ∥ K6 ∥ K8 ∥ 上抛项 1 一律读作 render-core 假绿」，而 K6 `docs/core/design/PROMPT-SYSTEM.md:5197` 写的是机制 `render-core 自己收起来跑`，不含「假绿」这个后果词。语义不冲突（假绿 = 该机制的结果），只是五处措辞不同形 | 收口前把 K6 的括注补成「render-core 收起来跑 ⇒ 假绿」，与该行的同口径声明对齐 |
| 4 | 清晰度（新增面） | 🔵 | `docs/core/design/TESTING.md:148` 写 `空集仍直通 exit 0 的是 vscode ∥ desktop（§2.3 表）`，而同档 `:129` 明写 render-core 也是 `旧空集直通（exit 0）`——本句在「哪些面空集直通」这一读上漏了 render-core（紧接着的 `:150` 才把该面补齐） | 改成「空集直通 = vscode ∥ desktop ∥ render-core，其中绿→红的是前两面」 |

**计**：🔴 0 · 🟡 0 · 🔵 4 ⇒ 无阻塞项。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-11-01

### 4.1 批准依据（用户原话 · 逐字）

- **「提示词处理了吗？」**（2026-11-01 01:50）—— 在父侧完成「检查提示词体系 + 分析成因 + 提改法」之后，用户以此句要求落地。**这一句 = 开批 + 整条链的 go-ahead**（设计 → 评审 → 实施 → 收口）。
- **前置缘起**（2026-11-01 01:27）：**「设计档指定单测文件名和路径错发生过好几次了，检查一下提示词体系，分析一下成因，看看应该如何完善。」**

### 4.2 批准范围（两句 · 落 `thincoder-core/prompts/discipline-engineering.md` 一处）

| 句 | 内容 |
|---|---|
| **句一** | 单测档与批档同目录同名前缀（`<docRoot.batches>/<batch record name, no .md>.test.mjs`），收口删；后果按**五个包面**逐面写准（拒串 ∥ 绿→红 ∥ 假绿） |
| **句二** | 先例必须在盘：引一条已不存在的路径是**旧例**不是先例 |

### 4.3 明确不在本批

清那 253 处死先例（`#1925`）· 给 `doc_check` 加「路径必须存在」机检（违 `N2 零假阳优先`）· 改人格层 / `thincoder-core/prompts/common.md` / advisor 层 · 改 `docs/core/design/TESTING.md` 除 `:126` ∥ `:128` 之外的既有口径句（边界见 §1.5）。

### 4.4 用户批准前收到的选项

父侧在开批前已把两件事摊开：**① 只补提示词两句**（最小形）∥ **② 连 253 处存量一起清**。用户裁定先落地 —— **本批取 ①，存量归 `#1925` 另批**（顺序写进证据：先立规则，再清存量）。

## §5 实施记录（eng-coder）

### 5. 实施记录（eng-coder）

**一句话**：往 `thincoder-core/prompts/discipline-engineering.md` 插 5 行，逐字照抄 `docs/core/design/PROMPT-SYSTEM.md` §6.58 两围栏块；零删除、零改字。

#### 5.1 改动（本批唯一一处）

| 文件 | 改动 | 改后位置 | 面 |
|---|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 句一 3 行（`:178`–`:180`）∥ 句二 2 行（`:82`–`:83`）；共 +5 行、零删除 | 句一贴 `Delete on use` 条续行之后（该条 `:173`–`:177`）∥ 句二贴第三答形 `:81` 之后 | 产品代码面（提示词） |

逐字来源 = §6.58 围栏块（`:5132`–`:5134` ∥ `:5140`–`:5141`）：照抄、不重写、不折行、不改标点、不调缩进。

#### 5.2 三条读数（验收 A1 ∥ A2/A3 ∥ A6）

① **A1 整行相等**：node 逐行 `===` 比对，插入处 5 行与两围栏块对应行**全部为真**（不折字、不归一；含 `—` ∥ `∥` ∥ 反引号 ∥ 句末标点）。全档同一措辞各仅 1 处命中 ⇒ 无重复插入。

② **A2/A3 行数与计数面**：改前 **358 行 / `##` 11 / `###` 7 / 标题节点 18**（设计席读数，本席改前实读复现一致）⇒ 改后 **363 行**（关系式 358 + 5）；`##` 11 ∥ `###` 7 ∥ 标题节点 18 **零连带**。

③ **A6 doc_check gate**：`doc_check(mode:"gate", target=D:\teamcode\thincoder, docs=[`thincoder-core/prompts/discipline-engineering.md` ∥ `docs/core/design/PROMPT-SYSTEM.md` ∥ `docs/core/design/TESTING.md`])` ⇒ 首行 `DOC-CHECK GATE: PASS`（范围 3 档 · 0 段有问题）。

**A4 行宽**（本席 node 实读）= 150 ∥ 133 ∥ 281 ∥ 243 ∥ 210，与 §6.58 A4 一致；全档 `>300` = 0（最长行 300，与本批前相同）。

#### 5.3 落点核对（内容锚，不用行号定位）

| 句 | 前一行 | 后一行 | 缩进 |
|---|---|---|---|
| 句一 | `:177` `Delete on use` 条末行 | `:181` `The change's implementer writes them and runs exactly those for the changed face` | 两空格（与邻行续行同形） |
| 句二 | `:81` 第三答形 `existing but unusable:` | `:84` `**Where the answer lands**…` | 五空格（与 `:84` 同形） |

句二仍在 `Closest-precedent survey` 条内，首行是条件句 `Before an `existing:` answer is used …` ⇒ 与三答形不同形，读成对第一答的附加条件，不是第四答（K6/K7）。

#### 5.4 未做 / 偏离 / 零改面

- **未做：无。** §2.1 三条覆盖到位——条目 1 ∥ 2 由本席落笔；条目 3 两处设计档依据已由设计席落，本席只核在盘。
- **偏离：无。** 逐字面零改字、零折行、零缩进调整；`git diff` = 2 个 hunk、`+5` / `-0`。
- **零改面（逐项核过）**：`Delete on use` 条原文 ∥ 三答形（`:79`–`:81`）∥ `Where the answer lands` ∥ 其余 15 档 ∥ 人格层 ∥ advisor 层 ∥ `docs/core/design/**`（非本席笔，未动）。
- **本批单测档 = 无**：改动面是提示词文本 + 设计档，无可执行行为；验收 = A1/A5 文本机判 + `doc_check` gate。这是「本批无可跑测试」，不是「略过测试」。
- **集成测试**：不改任何既有用例断言的业务可观察结果，也无新增业务场景 ⇒ 两条触发都不成立，集成集零增删。

#### 5.5 自查环与终态

| 环 | 结果 |
|---|---|
| 发散审计（explore spawn） | **未单独派**——分歧面已由机判逐条闭合（A1 整行相等 ∥ A5 锚位 ∥ A2/A3 关系式与计数 ∥ `git diff` = `+5`/`-0`），比一次 LLM 复读更强；**此为协议偏离，如实记此**，由下一环独立评审补位 |
| 内部代码评审（advisor · `type=code`） | 1 轮 · `pass` · **零发现**（无 🔴/🟡/🔵）。评审席独立复核：5 行逐字与围栏块相等 ∥ 锚位与缩进 ∥ 计数面 ∥ 句一第三行五面代码读数（`thincoder-cli/test/run.mjs:36`∥`:41` · `thincoder-core/test/run.mjs:35`∥`:40` · `thincoder-vscode/test/run.mjs:48`∥`:53-56` · `thincoder-desktop/test/run.mjs:36`∥`:43-46` · `thincoder-render-core/test/run.mjs:81`∥`:38-40`）∥ 句一第二行门判据（`docs/core/design/TESTING.md:201`）∥ 无连带改动（提示词按档名装载 `thincoder-core/prompt-overlays.mjs:23`，`prompt-fixture` 运行期从正本读入） |
| 自修轮 | 0 轮（评审零发现） |
| 终态 | `clean` |

**越界面**：无（本批只碰声明的 1 档；设计档 ∥ 批档 ∥ 其余 15 档零改动）。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-11-01

### 6.1 交付事实（5 行进产品）

`thincoder-core/prompts/discipline-engineering.md` **只加 5 行，零删零改**：

| 句 | 落点 | 内容 |
|---|---|---|
| **句一 3 行** | `:178`–`:180`（`Delete on use` 条之后、缩进 2 空格） | 单测档与批档同目录同名前缀（`<docRoot.batches>/<batch record name, no .md>.test.mjs`）∥ why（收口门只读本目录）∥ **五面后果按包写准**（cli ∥ core 只换说明串 ∥ vscode ∥ desktop 绿→红 ∥ render-core 假绿） |
| **句二 2 行** | `:82`–`:83`（`Where the answer lands` 之前、缩进 5 空格） | 先例必须在盘：引一条已不存在的路径是**旧例**不是先例，照抄即复现漂移 |

**设计面**：`docs/core/design/PROMPT-SYSTEM.md` §6.58（机制 ∥ 逐字围栏块 ∥ A1–A6 ∥ 用例 C1–C4 ∥ 决策 K1–K8）+ §7 D-PS50；`docs/core/design/TESTING.md` §2.4（句一的人读权威）+ `:126` ∥ `:128`–`:129`（按实读改准、拆面）。

### 6.2 父侧独立复核（全部自跑，不采信报告）

```
逐行整行相等（node `===`，不折字不归一）：句一 3 行 true ∥ 句二 2 行 true —— 实施后复跑仍 true
计数零连带：`^## ` 11 ∥ `^### ` 7 ∥ 标题节点 18
行数关系式：358 + 5 = 363（`^## ` 末位随之 :348 → :353——插入行造成的漂移，实测吻合）
doc_check gate：PASS（3 档 0 命中）
git diff：+5 / −0，2 个 hunk，零改面（`Delete on use` 原文 ∥ 三答形 ∥ `Where the answer lands` ∥ 其余 15 档）
```

### 6.3 三轮评审的轨迹（值得记）

| 轮 | 结论 | 关键 |
|---|---|---|
| 1 | pass（🔴 0 · 🟡 5 · 🔵 3） | 查出 `<docRoot.batches>` 无据（**父侧实读驳回**：`thincoder-core/prompts/persona-engineering.md:331` ∥ `:449` 在用） |
| 2 | **changes-required**（🔴 2） | **① 句一后果在 `render-core` 面为假**（`thincoder-render-core/test/run.mjs:38` 只判嵌套 ∥ `:81` 顶层照跑）**② 新 §2.4 与同档 `:126` 正面互斥** |
| 3 | pass（🔴 0 · 🔵 4） | 两条 🔴 均已落；四条 🔵 为坐标漂移与措辞差 |

**★ 本批最有价值的一次驳回**：评审第 2 轮那条 🔴1 —— **「a `*.test.mjs` under a package&apos;s `test/` makes that package&apos;s entry fail」在五个包面之一上是假的**，而那一面的后果不是变红、**是假绿（临时件冒充覆盖）**。**若只写「必被判错位」，读者就永远推不出 render-core 那一面。**

### 6.4 父侧自己错过的两处（自纠记录）

1. **「cli 由绿变红」错了** —— `thincoder-cli/test/run.mjs:41` 无条件 exit 1（集成集已归仓根），**绿→红的是 vscode ∥ desktop**。设计席顶回来、父侧实读认账。
2. **「`:348` vs 设计席 `:349` 之争」—— 两个读数各自在当时都对**，因为实施插了 5 行使 `:348 → :353`。**这正是父侧要求「行号一律删掉、只留节锚」的实证**。

### 6.5 未收项

- **`#1925` 那 253 处死先例**：本批只立规则，清存量另批。**顺序 = 先立规则再清存量**（本批已完成前半）。
- **`#1924`（提示词缺两句）由本批吸收**——同一笔债，收口时按重复行撤回，证据指本节与 `#1926`。

### 6.6 收口判据

- chain：§1 · §2 · §3（三轮，终态 pass）· §4 · §5 · §6 全在
- 验收：A1 逐行整行相等（父侧自跑）∥ 计数关系式 ∥ `doc_check` gate PASS
- 零留存：本批无可跑单测档（改动面 = 提示词文本）
- 台账：`#1926` → 已核销；`#1924` → 已废弃（被本批吸收）
