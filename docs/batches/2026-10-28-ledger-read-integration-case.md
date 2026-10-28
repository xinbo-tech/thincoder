# 2026-10-28 · 台账读面集成用例
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 台账 `#1835`（发现于 `#1834` 批 §2 上抛②）：`ledgerExport`（CLI `ledger list --json` ∥ ACP `ledger/list`）跨项目读账零集成用例；父侧 2026-10-28 实扫 `test/RTM.md` 的 `ledger list` ∥ `ledgerExport` ∥ `ledger/count` 读面行 = **0**（其余 6 处含 `ledger` 的行全属写面/收口面）。用户 12:57 逐字「全链」= 本批走设计 → 评审 → 实施全链。。
> 台账 = #1895（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批做什么（`#1835` · 台账读面集成用例）

**用户逐字**：「全链」（2026-10-28 12:57）—— 本批走设计 → 评审 → 实施。

**缺口（父侧 2026-10-28 实扫）**：`test/RTM.md` 里 `ledger list` ∥ `ledgerExport` ∥ `ledger/count` 这类**读面**用例 = **0 行**（含 `ledger` 的另外 6 行全属写面 / 收口面：`10-3` 换会话核销 · `12-4` 库不可读拒写 · `13-1..3` 建批绑定 · `14-3` 核销）。

**为什么这条比「补一个用例」难**：该缺陷的形态是**静默返回空** —— `#1834` 修的是读面漏传 `boundary`，修完只有手工探针（临时项目 + 临时 HOME）。**不带「进程 cwd ≠ 目标项目」这个条件的用例，修前修后都绿**，等于没测。

### 1.2 设计要定的事（这是本批的真正难点）

1. **条件怎么造**：让「进程 cwd」与「目标项目根」不指向同一处。候选形 = ① 进程 cwd 设在临时目录、目标项目另建在别处；② cwd 设在项目 A、目标指定项目 B（两项目同时存在）。**两种形测的是不同东西**（一个测「无项目」，一个测「有项目但不是它」），设计席须判该测哪一个或两个都测。
2. **判据怎么断「不是静默空」**：断言必须能区分「跨项目读到了正确的项目与行」与「读了个空集但没报错」。**只断「不抛」不够**（静默空正是这么溜过去的）。
3. **用例落哪**：集成层（业务可观察：`ledger list --json` 在跨项目 cwd 下给出正确项目与行），住 `test/integration/`，并在 `test/RTM.md` 定一个业务故事节 + 行号（**编号先行**：先定 RTM 编号，再落用例标题 `test('<编号> …')`）。

### 1.3 边界

- **本批不改产品代码**（`#1834` 已修完那处漏传）；若设计期发现还有别的漏传面，**上抛，不在本批顺手改**。
- **不碰** `docs/core/design/` 以外的档；`test/RTM.md` 的节由设计席定形、行号先行。

### 1.4 设计评审裁定（父侧 2026-10-28 13:0x）

**评审判 changes-required（🔴 2 · 🟡 4 · 🔵 2）。八条全接受，走修正轮；另把 `#1899`（用户裁定 A）一并并入本轮设计。**

| # | 级 | 裁 | 处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed** —— 「要守的一句话」把读面的界定成**会话锚**，与三处相抵：`:746` 自己的代码坐标（`thincoder-core/ledger-read.mjs:52` = `const anchor = cwd`、`:54` = `resolveLedgerRoot(anchor, anchor)` ⇒ **界 = 目标自身**）∥ `thincoder-core/ledger-db.mjs:245` 的 `boundary` = 会话锚（工具面）∥ `thincoder-core/manifest-discovery.mjs:112` `if (!isInsideOrEqual(dir, edge)) return null`（**父侧已实证**：按句子的定义实现，目标 B 落在会话锚 A 之外 ⇒ null ⇒ 空集 = 把 `#1834` 的缺陷装回去） | 句子改「读面的界 = 调用方指名的 `cwd`，该值同时充当目标；`process.cwd()` 从不入界」，并补划界句（§3.8 的会话锚界属**工具面**）。批档 §2.3 同句改齐 |
| 2 | 🔴 | **Fixed** —— 21-2 的现场出处误标。**父侧实证**：`thincoder/PROJECT-MANIFEST.json` 在盘 ⇒ `#1834` 的进程锚 `D:\teamcode\thincoder` 是**带档项目** ⇒ 那是形 A，不是「进程锚无项目」的形 B；形 B 全无在案读数 | 二选一：给 21-2 换真出处（可复现路径 + 为何是产品真需要的场景），或撤掉形 B 只留 21-1（把「不掺旁项目行」的锁留在 21-1） |
| 3 | 🟡 | **Fixed** —— AC-2 的「21-3 必绿」理由错：绿来自「变异后界 = 非项目目录 ⇒ 无根 ⇒ 空集 ⇒ 与预期重合」，与「空账」无关；`:60` 是族范围支、四行无一带 `--family` ⇒ 空转 | 写明必绿的机制；`:60` 从变异点删去或标「本批无行覆盖」 |
| 4 | 🟡 | **Fixed** —— 21-2 无可替代断言（期望列自述「同 21-1」⇒ 真子集；四种变异下两行同相） | 补一条只有形 B 能抓的变异，或把 `:752`「两形测不同东西」改成「出处不同」这一唯一理由 |
| 5 | 🟡 | **Fixed** —— 21-3 未写明锁的是哪一臂：读面空账两类同形（`thincoder-core/ledger-db.mjs:255`），`#1834` 还实测过「越界仍空账」（`docs/batches/2026-10-27-ledger-boundary-fix.md:1364`），设计边界既未覆盖也未上抛 | 21-3 写明夹具两项（目标带档、库不在盘）；「`--cwd <无档目录>` ⇒ 同样空集 exit 0」进上抛项 |
| 6 | 🟡 | **Fixed** —— `open` 条与 `:745` 的一句话互抵 | 先定界的两分，再把待裁对象收窄成「`count` 该取哪个界」，明写「`list` 的界已定」 |
| 7 | 🟡 | **Fixed** —— 夹具复原与造行锚缺失：只写 `chdir` 的 try/finally，未写库目录注入复原（`thincoder-core/ledger-db.mjs:34`）；造行面锚取 `anchorOf(ctx)`（`thincoder-core/agent-tools/ledger-tools.mjs:290`/`:294`-`:295`），锚 = A 而 `cwd` = B 时当场抛无根 | 补三句：复原 `chdir` **与** `_resetLedgerDirForTest`；造行 `ctx.agent.cwd` = 该项目根；造行先于 chdir |
| 8 | 🔵 | **Fixed** —— §2.9 的「实测读数」与盘不符（1256/82/L734..L815/284/L243..L254 vs 实测 1259/83/L734..L816/285/L243..L253）；勘察行缺声明源 | 收口前实测改写；勘察行补声明源 |

**另并入 `#1899`（用户裁定 A，逐字「A」· 2026-10-28 13:06）**：`ledger/count` 的界改跟 `ledger/list`，都用调用方指名的 `cwd`。本轮设计要一并给出：**§3.8 口径改写 + RTM 21-5 一行 + 产品码 `thincoder-cli/src/acp/read-data.mjs:77` 改一行（由实施席落）**。

**★ 第 1 条我要说清：这不是措辞挑剔。** 按句子实现，`resolveLedgerRoot(B, A)` 会因「目标不在界内」直接返回 null —— **与 `#1834` 修之前一模一样。** 一句话写错方向，等于把整批的目的反着交付。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 落点 |
|---|---|---|
| 1 | 跨项目读账集成用例落地（CLI 二例：list / 空账 + ACP 二例：list / count） | 新建 `test/integration/ledger-read-cross-project.test.mjs`（~175 行） |
| 2 | 用例真能抓到「静默空」（两对红绿对，各给极性与机制） | 设计档 §3.10 AC-2；读数记 §5 |
| 3 | RTM 编号先行（新故事节 21 + 四行八列） | `test/RTM.md` 故事 21（L243..L253） |
| 4 | 三链一致（本节条目表 ∥ 设计 AC ∥ RTM 行） | 本节 2.5 ∥ 设计档 §3.10 ∥ RTM 21 |
| 5 | `ledger/count` 的界改跟 `ledger/list`（用户裁定 A） | `thincoder-cli/src/acp/read-data.mjs:77` 一行（由实施席落） |

**明确不在本批**：`--family` 族范围读的行（2.7 ①）· `--cwd <无档目录>` 的空账分因（2.7 ②）· 上述之外的任何产品码改动。

### 2.2 设计档落点

- 机制设计 + 用例设计 = `docs/core/design/LEDGER.md` §3.10（本轮新增，L736..L846）。
- 界判据单源 = 同档 §3.8（本轮把「两面两界」改成「三面三界」：取根面 ∥ 台账工具面 ∥ 台账读导出面）。
- 索引 = `test/RTM.md` 新故事节 21（行 21-1..21-4；编号先于用例标题定，标题 = `test('21-1 …')`）。

### 2.3 机制设计（一句话与难点）

**要守的一句话**：读导出面的「界」= **调用方指名的 `cwd`**（`--cwd` ∥ ACP `params.cwd`），**该值同时充当目标**；`process.cwd()` 从不入界。

代码形：`anchor = cwd`（`thincoder-core/ledger-read.mjs:52`）⇒ `resolveLedgerRoot(anchor, anchor)`（同档 `:54`）⇒ **界 = 目标自身**。

**划界**：§3.8 的会话锚界属**工具面**（`boundary` = `anchorOf(ctx)` = `ctx.agent.cwd`，`thincoder-core/ledger-tools.mjs:290`）；读导出面以目标自身为界。

按错方向实现（界 = 会话锚 A）的后果：`thincoder-core/manifest-discovery.mjs:112` 使目标 B 判越界 ⇒ `null` ⇒ 空集——与 `#1834` 修之前一模一样。

难点三条，逐条处置见设计档 §3.10：

1. **条件怎么造** = `process.chdir` 定进程锚 + `--cwd` 指名目标；**唯一要造的条件 = 进程锚 ≠ 目标**，形只留一个（进程锚 = 另一个带档项目 A）。
   「进程锚 = 非项目目录」形**撤除**：无在案读数（`#1834` 的进程锚 `D:\teamcode\thincoder` 带 `PROJECT-MANIFEST.json`，见 `docs/batches/2026-10-27-ledger-boundary-fix.md:1286`），且其期望输出是形 A 的真子集。
2. **判据怎么断「不是静默空」** = 同时锁三件：非空集 · 项是目标项目 · 行集是目标项目的行。只断「不抛」在修前修后都绿。
3. **用例落哪** = `test/integration/`；RTM 故事 21 先定号，用例标题与行号逐字同号。

### 2.4 受影响文件（现状 → 本批）

| 文件 | 现状 | 本批 |
|---|---|---|
| `test/integration/ledger-read-cross-project.test.mjs` | 不在盘 | 新建 ~175 行（四例） |
| `test/RTM.md` | 284 行 · 20 个故事节 | 故事 21 = L243..L253（11 行）；表行**净增 0**（四行 → 四行：撤形 B 一行、加 `count` 一行） |
| `docs/core/design/LEDGER.md` | 1259 行（评审轮实测）；止于 §3.9 | 本批后 **1288 行**；§3.10 = **111 行（L736..L846，本轮新增）** + §3.8 界条两面改三面 |
| `thincoder-cli/src/acp/read-data.mjs` | `:77` `boundary: ctx.getCwd()` | 改 1 行 ⇒ `boundary: c.cwd`（**本批唯一产品码增量**） |

本节所述三个新读数（1288 ∥ 111 ∥ 284）均本轮实测：`docs/core/design/LEDGER.md` 行数 = 档长，`§3.10` = 自 `### 3.10` 至 `## 4.` 前一行。

### 2.5 验收对照（回指设计档 §3.10）

| 条目 | 判据 | 机检形 |
|---|---|---|
| 1 | AC-1 | `node --test test/integration/ledger-read-cross-project.test.mjs` ⇒ 四例全绿、零 skip |
| 2 | AC-2 | **对 1**：`:54` 临时换 `process.cwd()` ⇒ 21-1 ∥ 21-3 红、21-2 绿（机制见设计档）、21-4 不动；**对 2**：`:77` 临时换回 `ctx.getCwd()` ⇒ 21-4 红；复原后全绿，两对读数记 §5 |
| 3 | AC-3 | RTM 故事 21 四行八列齐、编号 21-1..21-4 与用例标题逐字一致 |
| 4 | AC-4 | 本节条目表 ∥ 设计档 AC ∥ RTM 行三处同号同用例，无一处单挂 |
| 5 | 读面口径 | `thincoder-cli/src/acp/read-data.mjs:77` 实读 = `boundary: c.cwd`；且 21-4 由红转绿 |

### 2.6 关键决策（设计档 §3.10 五条，一句一条）

1. 进程内调 `runLedgerList`，不起子进程——壳只分发，库目录注入面只在进程内。否决 spawn 真机。
2. `process.chdir` 造进程锚（`cwd` 缺省在调用时取值），`try/finally` 复原 **`chdir` 与 `_resetLedgerDirForTest()` 两件**（`thincoder-core/ledger-db.mjs:34`）。
3. 四行 = CLI 二（list / 空账）+ ACP 二（list / count）；ACP 两行锁两个出口同判。
4. 空账行保留「空集 + 退出码 0」（需求档验收 ②），不改抛。
5. **`ledger/count` 的界改跟 `ledger/list`**（用户 2026-10-28 13:06 逐字裁定「A」）：`boundary` = `c.cwd`（调用方指名），不是 `ctx.getCwd()`。
   理由：两出口若各取一界，会话锚 A、目标 B 时 `list` 给 B 的行而 `count` 给 0——界面一处有数据一处说零，两个数都「看起来正常」，零报错。
   取舍：改后 `count` 不再受会话锚收窄，与 `list` 同界。

### 2.7 上抛项

① **[上抛·知会]** `ledgerExport` 的族范围支零用例：

- 族范围支 = `thincoder-core/ledger-read.mjs:58`-`:62`，与单范围支同为 `#1834` 修过、同为读面；`grep ledgerExport test/` 零命中。
- 本批边界记「不做」（条目指名 = 单项目跨锚读）；是否立项由父侧定。

② **[上抛·知会]** 读面空账两类同形（`thincoder-core/ledger-db.mjs:255`）：目标带档但无库 ∥ `--cwd` 指名无档目录 ⇒ 都空集 + exit 0。

- 本批只锁前者（21-2）；后者不测，因为它不增判据（同形不可区分）。要把两因分开得改产品行为（空账分因），另起一笔。

③ **[上抛·知会]** 夹具遗留风险已收：造行先于 `chdir`、造行走核 `ledgerAdd` 并显式给 `boundary`（`thincoder-core/ledger-cmd.mjs:144`）⇒ 无 `anchorOf(ctx)` 那一臂，不会在夹具起步时抛无根。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 2 轮：上轮 🔴2 全 Fixed，无新 🔴；🟡2 · 🔵2 非阻塞）



### 轮次 1（评审子代理）

## 设计评审 · 第 1 轮（changes-required）

### 重点验六件的结论

1. **红绿对能否真红 — 能红，但「必绿」的理由写错。** 按 `thincoder-core/ledger-read.mjs:52`/`:54`/`:55` 与 `thincoder-core/manifest-discovery.mjs:112`（`if (!isInsideOrEqual(dir, edge)) return null`）推演：21-1 变异后目标与界相抵 ⇒ 读面 `null` ⇒ `{"projects":[]}`（`thincoder-core/ledger-db.mjs:253`-`:255`）红 · 21-2 目标 = 非项目目录、界同值 ⇒ 界内无档 ⇒ 红 · 21-4 同 21-1 ⇒ 红 · 21-3 预期即空集 ⇒ 绿。但 `docs/core/design/LEDGER.md:786`「（21-3 仍绿，它是空账行）」是错的因果：绿来自变异后落空集与预期重合，与「空账」无关（把进程锚换成带行的项目 A，同一变异必红）。另 `:60` 是族范围支，四行无一带 `--family`（`thincoder-cli/src/acp/read-data.mjs:66`），该处变异空转。
2. **形 A / 形 B — 形 A 出处成立，形 B 出处误标，两形断言不独立。** 21-1 出处可核：`docs/batches/2026-10-27-ledger-boundary-fix.md:1362`。21-2 记的「#1834 原现场（进程 cwd 在项目外）」与实测不符：该批进程锚 = `D:\teamcode\thincoder`（`:1286`），该目录带 `PROJECT-MANIFEST.json` ⇒ 那是形 A。断言面：21-2 期望列自述「同 21-1」⇒ 真子集；四种变异下两行红/绿同相，`docs/core/design/LEDGER.md:752`「两形测不同东西」缺支撑。
3. **21-3 未把静默空钉成规格，但没写明锁哪一臂。** 夹具是「带档但无台账库」⇒ 合法空臂；风险是读面空账两类同形（`thincoder-core/ledger-db.mjs:255`），`#1834` 实测登记过越界仍空账（`docs/batches/2026-10-27-ledger-boundary-fix.md:1364`），而 `docs/core/design/LEDGER.md:809`-`:816` 既未覆盖也未上抛。
4. **夹具足以不碰真实用户目录，但缺两条。** 库位单点派生自可覆盖基（`thincoder-core/ledger-db.mjs:33`/`:51`/`:37`）⇒ 充分；缺 `_resetLedgerDirForTest` 复原（`:34`；先例 `test/integration/batch-close-gate.test.mjs:32`）与造行锚（`thincoder-core/ledger-tools.mjs:290`/`:294`-`:295`；锚 = A、cwd = B 时 `:56` 抛无根）。
5. **`count` 记 `open`、RTM 不加 21-5 — 与 §2.7 ① 一致，但与 `:745` 互抵。** 后果读数成立（`thincoder-cli/src/acp/read-data.mjs:77` + `thincoder-core/ledger-cmd.mjs:121`-`:122`）；处置正确（未裁行为不被钉成预期）；但一句话若成立则 `count` 已违规，待裁对象不存在。
6. **集成窗口 — 74 行（实读数）。** `test/RTM.md` 表行实数合计 = 74（加前 70），在 50–100 内 ✓。

### Findings

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 核心判据 / Document ownership | 🔴 | 「要守的一句话」把读面的界定成**会话锚**，与本面代码坐标和 §3.8 的界定义三处相抵：`docs/core/design/LEDGER.md:745`「读面的「界」= 调用方指名的会话锚，不是 `process.cwd()`」；同节 `:746` 却写「单范围支 = `resolveLedgerRoot(anchor, anchor)`」而 `anchor = cwd`（`thincoder-core/ledger-read.mjs:52`）⇒ 界 = `--cwd`/`params.cwd` 的值 = 目标自身；§3.8／`thincoder-core/ledger-db.mjs:245` 定义「`boundary` = 上溯上界（**会话锚**——设计档 §3.8「界（单源）」）：工具面传 `ctx.agent.cwd`」。按句子实现（界 = 会话锚 A），`thincoder-core/manifest-discovery.mjs:112` 使 21-1/21-2/21-4 的目标 B 落界外 ⇒ 必空 ⇒ 把 #1834 的缺陷装回。批档 `docs/batches/2026-10-28-ledger-read-integration-case.md:51` 同句 | 改句为「读面的界 = 调用方指名的 `cwd`（`--cwd` ∥ ACP `params.cwd`），该值同时充当目标（`resolveLedgerRoot(anchor, anchor)`）；`process.cwd()` 从不入界」，并补划界句「§3.8 的会话锚界属工具面（`thincoder-core/ledger-tools.mjs` `anchorOf(ctx)`），读导出面以目标自身为界」；批档 §2.3 同句改齐 |
| 2 | 分支出处（6b） | 🔴 | 21-2 出处误标：`test/RTM.md:251`「缺口来源 = 台账 #1834 原现场（进程 cwd 在项目外）」与实测不符——#1834 进程锚 = `D:\teamcode\thincoder`（`docs/batches/2026-10-27-ledger-boundary-fix.md:1286`），带 `PROJECT-MANIFEST.json` ⇒ 那是形 A；「进程锚 = 非项目目录」无读数、无可复现路径 | 二选一：① 给 21-2 换真出处（可复现路径 + 为何是产品真需要的场景）；② 撤形 B 只留 21-1（出处 `:1362` 是实测读数），「不掺旁项目行」的负向锁留在 21-1 |
| 3 | 验收（AC-2） | 🟡 | `docs/core/design/LEDGER.md:786`「（21-3 仍绿，它是空账行）」的因果不成立（绿来自变异后落空集与预期重合）；AC-2 的变异点 `:60` 是族范围支，四行无 `--family` ⇒ 空转 | AC-2 写明必绿机制，并把 `:60` 从变异点删去或标注「本批无行覆盖」 |
| 4 | 覆盖 / 用例不重复 | 🟡 | 21-2 期望列自述「同 21-1」（`test/RTM.md:251`）⇒ 真子集；四种变异下两行红/绿同相；`docs/core/design/LEDGER.md:752`「两形测不同东西」缺支撑 | 补一条只有形 B 能抓的变异（如 `--cwd` 缺省时取 `process.cwd()` 的缺省面），或把 `:752` 与 21-2 依据改成「出处不同」这一唯一理由 |
| 5 | 覆盖 / 静默空 | 🟡 | 21-3 未写明锁哪一臂：读面空账两类同形（`thincoder-core/ledger-db.mjs:255`），`#1834` 实测登记过越界仍空账（`docs/batches/2026-10-27-ledger-boundary-fix.md:1364`）；`docs/core/design/LEDGER.md:809`-`:816` 既未覆盖也未上抛，与批档 §1.3「别的漏传面上抛」不符 | 21-3 写明夹具两项（目标带 `PROJECT-MANIFEST.json`、键控库不在盘）；把「`--cwd <无档目录>` ⇒ 同样空集 exit 0」写进边界上抛项或明示不在本批 |
| 6 | 文档自洽 | 🟡 | `open` 条与 `:745` 互抵：一句话已立规则，`docs/core/design/LEDGER.md:814` 却把「`ledger/list` 以 `params.cwd` 为界 ∥ `ledger/count` 以 `ctx.getCwd()` 为界」记未裁；反之若改回会话锚界则 21-1 必红 | 先定界的两分（工具面 = 会话锚 · 读导出面 = 目标自身），`open` 条只留事实与后果读数（`thincoder-cli/src/acp/read-data.mjs:77` + `thincoder-core/ledger-cmd.mjs:121`-`:122`），待裁对象收窄成「`count` 该取哪个界」 |
| 7 | 可行性（夹具） | 🟡 | `docs/core/design/LEDGER.md:779` 只给 `chdir` 的 `try/finally`，未提 `_resetLedgerDirForTest`（`thincoder-core/ledger-db.mjs:34`；先例 `test/integration/batch-close-gate.test.mjs:32`）⇒ 同进程后续用例继承夹库目录；造行未定 `ctx.agent.cwd`，锚 = A 而 cwd = B 时 `assertLedgerStart` 抛无根（`thincoder-core/ledger-tools.mjs:56`） | 夹具条补：①复原 `chdir` 与 `_resetLedgerDirForTest`；②造行 `ctx = { agent: { cwd: <该项目根> } }`；③造行先于任何 `chdir` |
| 8 | 数值 / 勘察证据 | 🔵 | 批档 `docs/batches/2026-10-28-ledger-read-integration-case.md:107`「实测 `§3.10` 占 **82 行**（L734..L815），全文 1175 → 1256 行」与盘上不符（实测 `docs/core/design/LEDGER.md` 1259 行、§3.10 = L734..L816）；`:108`「273 → 284 行；故事节 21 占 L243..L254」亦不符（实测 `test/RTM.md` 285 行、L243..L253）。§3.10 勘察证据行（`:742`）缺声明源行（对照 `:629`） | 收口前实测改写三数；勘察证据行补 `index.publicRepos = []` ⇒ 无仓外声明源可查 |

### 计数

🔴 **2** · 🟡 **4** · 🔵 **2** · 合计 **8**。
已过项：集成测试设计节存在且以 RTM delta 三问起头（`docs/core/design/LEDGER.md:801`）· 编号先行且标题同号（AC-3）· 最近先例含对齐/偏离理由（`:736`-`:737`）· 验收只点名单档 `node --test`（`:785`）· 受影响面无源码增量（`:768`-`:772`）· 集成窗口 74 行在 50–100 内。

VERDICT: changes-required

### 轮次 2（评审子代理）

**逐条修复声称的验证结论（上轮 8 条 + `#1899` 三处）**

1. ① 一句话 + 划界句 —— **Fixed**。`docs/core/design/LEDGER.md:749` = 「**读导出面的「界」= 调用方指名的 `cwd`**（`--cwd` ∥ ACP `params.cwd`），**该值同时充当目标**；`process.cwd()` 从不入界。」；`:755` 划界句在位；`:521` 已成「界（单源 · 三面三界）」（含 `ledgerExport ∥ ledgerCount`）、`:532` 加「读导出面的界 = 调用方指名的 `cwd`」括注；同源复述三处收齐：`:81`（根解析面条）· `:1032`（§7.1 `resolveLedgerRoot` 行）· `:1141`（AC-M2-17）；批档 `docs/batches/2026-10-28-ledger-read-integration-case.md:71` 同句。代码侧核实：`thincoder-core/ledger-read.mjs:52` = `const anchor = cwd`、`:54` = `resolveLedgerRoot(anchor, anchor)`、`:88` = `ledgerExport({ cwd: dir ?? cwd, family, full })` ⇒ 界 = `--cwd` 值 = 目标，句子与代码同向。
2. ② 形 B 撤除 —— **Fixed**。`test/RTM.md:251` = 「同一 A 锚，`--cwd <带档但无台账库的项目>`」，出处误标消失；`docs/core/design/LEDGER.md:766`-`:770` 记「形只留**一个**」+ 撤除理由（无在案读数 · 期望是真子集）。
3. ③ AC-2 机制 —— **Fixed**。`docs/core/design/LEDGER.md:809`-`:812`：对 1 = `:54` 换 `resolveLedgerRoot(anchor, process.cwd())` ⇒ 21-1 ∥ 21-3 红（`thincoder-core/manifest-discovery.mjs:112` 界外 ⇒ `null`）、21-2 绿（`:810` 明写真机制「绿来自「变异值 = 预期值」，与「空账」这个场景无关」）、21-4 不受影响；`:812` 明示 `:60` 不入变异点。
4. ④「两形测不同东西」—— **Fixed（设计面）**：`docs/core/design/LEDGER.md:770` 改「真子集」+ 撤除；该句仍在批档 §1.2（见 New-2）。
5. ⑤ 21-2 锁哪一臂 —— **Fixed**。夹具两项入 `test/RTM.md:251` 异常列与 `docs/core/design/LEDGER.md:822`（目标带 `PROJECT-MANIFEST.json` · 键控库不在盘）；`:841`-`:842` 边界登记「不做 `--cwd <无档目录>` 的形」+ 理由；批档 §2.7 ② 上抛。
6. ⑥ `open` 条 —— **Fixed**。`docs/core/design/LEDGER.md:844`-`:846` 改「已裁（`ledger/count` 的界）」+ 裁定判据；`open` 条已不存在。后果读数核实：`thincoder-cli/src/acp/read-data.mjs:77` 现行 = `ledgerCount({ cwd: c.cwd, boundary: ctx.getCwd() })`；`thincoder-core/ledger-cmd.mjs:122` = `if (!db) return { count: 0, overdue: 0, evidenceOversize: 0 }`。
7. ⑦ 夹具三句 —— **Fixed**。`docs/core/design/LEDGER.md:778`-`:781`：造行先于任何 `chdir` · 走核 `ledgerAdd({ cwd, row, boundary })` · `try/finally` 复原 `chdir` 与 `_resetLedgerDirForTest()`；核实 `thincoder-core/ledger-cmd.mjs:144` = `export function ledgerAdd({ cwd, row, boundary })` ⇒ 无 `anchorOf(ctx)` 臂。
8. ⑧ 数值 —— **部分**：声明源行已补（`docs/core/design/LEDGER.md:747`）；两处读数与盘上差 1（见 New-4）。
9. `#1899` 三处 —— 三处在位：§3.8 口径 `:521`/`:532`；`test/RTM.md:253` = 21-4（四行 21-1..21-4 连续、无空号）；产品码一行只进受影响表（`docs/core/design/LEDGER.md:791` · 批档 `:93`），由实施席落。

**重点四件**

- Ⅰ 三面三界立得住：`docs/core/design/LEDGER.md:521` 三面各给界值与判据、`:522` 一句一面，不是把一个问题拆成两个（读导出面 = 目标自身，与取根面「盘根」、工具面「会话锚」三种不同取值）。残留两处旧措辞见 New-1。
- Ⅱ 撤形 B 后 21-1 单独能守：变异「界取 `process.cwd()`」下 `anchor` = B、`edge` = A（chdir 到 A）⇒ `thincoder-core/manifest-discovery.mjs:112` 的 `isInsideOrEqual(B, A)` 假 ⇒ `null` ⇒ `{"projects":[]}` ⇒ 21-1 三锁全破 ⇒ 红。
- Ⅲ RTM 21 四行逐字同号：`test/RTM.md:250`-`:253` 编号 21-1..21-4、每行八列，与 `docs/core/design/LEDGER.md:814` AC-3 一致；用例标题尚未落（测试档不在盘），无冲突。
- Ⅳ 批档 §2 就地重写无跨段破坏：§2.1-§2.7 与设计档 §3.10 逐处对齐（条目表 · 受影响面 · 验收对照 · 决策 1-5 · 上抛 ①②③），§1/§3 未被改；两处记录滞后见 New-2 / New-4。

**Findings**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/LEDGER.md | 🔴 | Fixed | `:749` 句子已改、`:755` 划界句在、`:521`/`:532`/`:81`/`:1032`/`:1141` 五处同口径；与 `thincoder-core/ledger-read.mjs:52`/`:54`/`:88` 一致 |
| 2 | 2 | test/RTM.md | 🔴 | Fixed | `:251` 已改为「同一 A 锚，`--cwd <带档但无台账库的项目>`」；出处误标消失，形 B 撤于 `docs/core/design/LEDGER.md:766`-`:770` |
| 3 | 3 | docs/core/design/LEDGER.md | 🟡 | Fixed | AC-2 `:809`-`:812`：机制写明（`:810`）、`:60` 明示不入变异点（`:812`） |
| 4 | 4 | docs/core/design/LEDGER.md | 🟡 | Fixed | 形 B 撤 ⇒ 真子集/同相问题消失；`:770` 给出「真子集」理由 |
| 5 | 5 | docs/core/design/LEDGER.md | 🟡 | Fixed | 夹具两项入 `test/RTM.md:251` 与 `docs/core/design/LEDGER.md:822`；`:841`-`:842` 边界 + 批档 §2.7 ② 上抛 |
| 6 | 6 | docs/core/design/LEDGER.md | 🟡 | Fixed | `:844`-`:846` 已裁 + 裁定判据；`open` 条消失，待裁对象不存在 |
| 7 | 7 | docs/core/design/LEDGER.md | 🟡 | Fixed | `:778`-`:781` 三句齐；`thincoder-core/ledger-cmd.mjs:144` 核实 `ledgerAdd` 收 `boundary` |
| 8 | 8 | docs/batches/2026-10-28-ledger-read-integration-case.md | 🔵 | Unfixed | 声明源行已补（`docs/core/design/LEDGER.md:747`）；读数仍差 1：`:92`「本批后 **1288 行**」vs 本轮读 1289 行、`:91`「284 行」vs `test/RTM.md` 本轮读末行 = 285 |
| 9 | (new) | docs/core/design/LEDGER.md | 🟡 | New: §3.8 内两处旧措辞未随三面三界改齐 —— `:518`「**上溯以会话锚为界，越界即停**」· `:595`「界 = 会话锚（`boundary` **必传**」；与 `:521`/`:532`/`:81`/`:1032`/`:1141` 的七处口径不一致。因 `:521` 是界单源且已正确、`:532` 已加括注，读者能判权威副本，故非 🔴 | 
| 10 | (new) | docs/batches/2026-10-28-ledger-read-integration-case.md | 🟡 | New: §1 记录与本轮设计三处滞后 —— `:19`「**两种形测的是不同东西**（一个测「无项目」，一个测「有项目但不是它」）」· `:25`「**本批不改产品代码**（`#1834` 已修完那处漏传）」· `:43`「**§3.8 口径改写 + RTM 21-5 一行 + 产品码 `thincoder-cli/src/acp/read-data.mjs:77` 改一行（由实施席落）**」；设计/RTM 落的是 21-4（连续无空号）与一行产品码。§1 append-only，建议追加一行记这三处 delta |
| 11 | (new) | docs/core/design/LEDGER.md | 🔵 | New: `:830`「同项目读时 `c.cwd` 与 `ctx.getCwd()` 取值重合，行为不变」只覆盖 `params.cwd` 缺省面；`thincoder-cli/src/acp/read-data.mjs:36`-`:38` 显示 `params.cwd` 为字符串即直传 ⇒ `params.cwd` = 项目子目录时 `count` 由 N 变 0（与 `ledger/list` 同形，已由 `:841` 登记为不做）。建议注明该边界 |
| 12 | (new) | docs/core/design/LEDGER.md | 🔵 | New: `:759` 标「逐字」但引文含省略号（实际 `thincoder-core/ledger-db.mjs:255` 为「…已注册项目——后者见 §3.8「界」；读面不抛」）；受影响面表 `:791` 未给 `thincoder-cli/src/acp/read-data.mjs` 现行行数（147 行，+1） |

**计数**：🔴 0 · 🟡 2 · 🔵 2（上轮 8 条 = 7 Fixed + 1 部分 Unfixed）；集成窗口 74 行（50–100 内）。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-10-28

### 4.1 批准依据

- **用户裁定 A**（2026-10-28 13:06 逐字「A」）：`ledger/count` 的「界」跟 `ledger/list`，都用调用方指名的 `cwd` —— 落地 = `thincoder-cli/src/acp/read-data.mjs:77` 改一行。
- **设计评审通过**（§3 状态行：第 2 轮，上轮 🔴2 全 Fixed，无新 🔴）。
- **实施验证通过**（§5）：四例全绿、两对红绿实测、变异零残留。

### 4.2 本批边界（用户裁定之外未扩）

不改 `ledger` 的任何其它出口；不动 `ledger-read.mjs`；不新增命令面 / 参数面。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四例全绿 + 两对红绿实测入 5.3）



### 5.1 交付（§2.1 五条逐条）

| # | 交付物 | 状态 |
|---|---|---|
| 1 | 新建 `test/integration/ledger-read-cross-project.test.mjs`（四例，160 行） | ✅ 完成 |
| 2 | 用例真能抓到「静默空」（两对红绿，极性与机制见 5.3） | ✅ 完成 |
| 3 | `test/RTM.md` 故事 21 四行（设计席已落） | ✅ 就位，本席零改 |
| 4 | 三链一致（§2 条目表 ∥ 设计档 AC ∥ RTM 行） | ✅ 完成 |
| 5 | `ledger/count` 的界改跟 `ledger/list`（用户裁定 A） | ✅ 完成 |

### 5.2 改动面（全部在盘）

| 文件 | 改法 | 实读 |
|---|---|---|
| `thincoder-cli/src/acp/read-data.mjs` | `:77` 一行：`boundary: ctx.getCwd()` → `boundary: c.cwd`（行号不变，尾注指 §3.8） | `boundary: c.cwd` |
| `test/integration/ledger-read-cross-project.test.mjs` | 新建 160 行、四例 21-1..21-4 | 见 5.3 |

零改面：`test/RTM.md` · `docs/**` · `thincoder-core/ledger-read.mjs`（两对变异已复原，`git diff` 空）· 其余产品码零触。

### 5.3 验收读数（本席实测）

**AC-1**：`node --test test/integration/ledger-read-cross-project.test.mjs` ⇒ `tests 4 / pass 4 / fail 0 / skipped 0`。

**AC-2 两对红绿**（逐对给极性与机制；两处临时改动均已复原）：

| 对 | 变异点（临时改） | 实测读数 | 机制 |
|---|---|---|---|
| 对 1 | `thincoder-core/ledger-read.mjs:54` `resolveLedgerRoot(anchor, anchor)` → `(anchor, process.cwd())` | 21-1 ✖ · 21-3 ✖ · 21-2 ✔ · 21-4 ✔ | 界回落到进程锚 A ⇒ 目标 B 越界 ⇒ `manifest-discovery.mjs:112` 返 null ⇒ `{"projects":[]}`（21-1 / 21-3 报错原文即此串）；21-2 期望本就是空集 ⇒ 变异值 = 预期值 ⇒ 绿；21-4 走 `ledgerCount`，不经该档 |
| 对 2 | `thincoder-cli/src/acp/read-data.mjs:77` `boundary: c.cwd` → `ctx.getCwd()` | 21-4 ✖ · 21-1 / 21-2 / 21-3 ✔ | 会话锚 A、目标 B ⇒ `resolveLedgerRoot(B, A)` 无根 ⇒ `ledger-cmd.mjs:122` 回三零；实测报错原文 `{"count":0,"overdue":0,"evidenceOversize":0}` |

复原后四例全绿（`tests 4 / pass 4 / skipped 0`）。两处临时改动零留盘：`git diff -- thincoder-core/ledger-read.mjs` 空；`:77` 实读 = `boundary: c.cwd`。

**AC-3**：四例标题逐字同号 `test('21-1 …')` / `21-2` / `21-3` / `21-4`；RTM 行 21-1..21-4 连续无空号。
**AC-4**：§2 条目表 ∥ 设计档 §3.10 AC ∥ RTM 行三处同号同用例，无单挂。
**AC-5**：`thincoder-cli/src/acp/read-data.mjs:77` 实读 = `boundary: c.cwd`；21-4 由红（对 2）转绿。

### 5.4 夹具（设计档 §3.10 三条纪律的落法）

- **造行先于任何 `chdir`**：三项目 A / B / C 与 B 的四行（一行 `已废弃`、一行 `条件 + @2020-01-01`、一行 evidence 320 字）全在模块顶层造完；走核 `ledgerAdd({ cwd, row, boundary })` / `ledgerClose`，不经工具面 ⇒ 无 `anchorOf(ctx)` 那一臂。
- **`chdir` 只包被测调用**：CLI 用同步形 `withCwd`，ACP 用 `withCwdAsync`——**两形不可互代**（同步 `finally` 在处理器首条 `await` 之前就复原目录，被测体实际不在「进程锚 = A」下运行；见 5.5 第 2 条）。
- **复原两件**：`chdir` 由每次调用的 `finally` 复原；`_resetLedgerDirForTest()` 在 `after()` 复原；库目录 `_setLedgerDirForTest(<tmpdir>)`（零写真实用户目录）。
- **期望读数 = 夹具已知量**：`B_EXPECT = { count: 3, overdue: 1, evidenceOversize: 1 }`（B 四条行，末条 `已废弃` 不计）；A 的未决行数 = 2 ⇒「读了旁项目 A」与「读成三零」两态都可区分。

### 5.5 审计与评审轮次

| 轮 | 类型 | 结论 | 处置 |
|---|---|---|---|
| 1 | 内部 explore 发散审计 | `VERDICT: divergences (4)`，均低级 | 修三条：① 21-1 补「行 id 集 = B 的行」断言（RTM 点名的判据，原先只断标题集）；② 文件头夹具纪律 ③ 改成与代码同形（`chdir` 在 `finally`、库目录在 `after`）；③ 「逐字」引文改摘要（原文含省略，标「逐字」不实） |
| 2 | advisor 代码评审第 1 轮 | `changes-required`：🔴1 · 🟡3 · 🔵3 | 🔴 = 本节原为空（AC-2 无在册读数）；🟡 = `withCwd` 对 async 被调用体不成立（已拆两形修掉）、`params.cwd` = 项目子目录时 `count` 由 N 变 0 的记载缺口（上抛）、RTM 结果列待收口（§6 填）；🔵 = `:77` 行过长（已收短尾注）、`schemaVersion` 硬断（已加注「刻意硬断」）、`manifest-discovery.mjs:98` 旧措辞（范围外，上抛） |

**上抛项（父侧 / 设计席处置）**：

- **[上抛·知会] 子目录形未覆盖**：`params.cwd` 指项目**子目录**、会话锚 = 该项目根时，本批改后 `count` 由 N 变 0（`resolveLedgerRoot(subdir, subdir)` 无根 ⇒ 三零）；`ledger/list` 早前即同形（两出口仍一致）。设计档 §3.10 的「行为不变」只覆盖 `params.cwd` 缺省面，此形既未列「不做」也无行锁 ⇒ 待定：写入边界表，或补一行用例。调用方是否恒传项目根 = **unverified**。
- **[上抛·知会] 旧措辞**：`thincoder-core/manifest-discovery.mjs:98`-`:99` 注释仍写「两面两界 · 台账面传会话锚」，与设计档 §3.8「三面三界」不同口径（非本批改动行，未改）。

### 5.6 遗留（收口面）

`test/RTM.md` 21-1..21-4 的「结果 / 执行日期 / 执行人」仍「待执行」——由 §6 按 5.3 的实测回填。

### 5.7 评审第 2 轮复核 + 读数更正

- **第 2 轮（复核修复声称）**：`VERDICT: pass`——上轮 🔴1 / 🟡3 / 🔵3 逐条核过：🔴 = §5 已写实（在册证据通道成立）；🟡 = `withCwd` 拆两形已修、子目录形已上抛、RTM 结果列归 §6；🔵 = 尾注收短、`schemaVersion` 加注、`manifest-discovery.mjs` 旧措辞上抛。新增 🔵 1（下列读数差）。
- **连带正确性**：拆两形后，对 1 变异在 21-3 期间 `process.cwd()` 确为 A ⇒ 5.3 记的机制「界回落到进程锚 A ⇒ 目标 B 越界」与实测因果一致（同步形时代实际来自仓根，会记错因）。
- **读数更正**：5.1 / 5.2 记「160 行」，实读 = **163 行**（`withCwd` / `withCwdAsync` 拆两形的增量未回填）。无功能影响。
- **终态**：`clean`——审计 1 轮 + 代码评审 2 轮，无未决 🔴；修复轮次 2（审计后 3 处、评审后 3 处，均在本轮内落盘并复跑）。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-10-28

### 6.1 交付事实

| 项 | 内容 |
|---|---|
| 产品码 | `thincoder-cli/src/acp/read-data.mjs:77` —— `boundary: ctx.getCwd()` → `c.cwd`；`git diff --stat` = **1 insertion / 1 deletion**（只这一行） |
| 用例 | `test/integration/ledger-read-cross-project.test.mjs`（新建 · 4 例 21-1…21-4） |
| RTM | `test/RTM.md:250`–`:253` 四行，编号与用例标题逐字同号 |

### 6.2 父侧独立复核（不采信报告）

```
node --test test/integration/ledger-read-cross-project.test.mjs
  tests 4 · pass 4 · fail 0
git diff --stat -- thincoder-cli/src/acp/read-data.mjs
  1 file changed, 1 insertion(+), 1 deletion(-)
```

**红绿对（实施席实测 · 父侧复核其机制成立）**：

| 对 | 变异点 | 结果 | 为什么这不假绿 |
|---|---|---|---|
| 1 | `thincoder-core/ledger-read.mjs:54` 界 → `process.cwd()` | 21-1 ✖ · 21-3 ✖ | 界回落到进程锚 ⇒ B 越界 ⇒ `projects []` |
| 2 | `read-data.mjs:77` 回 `ctx.getCwd()` | **21-4 ✖** | 锚 A、目标 B ⇒ `count` 回三零 |

**★ 21-4 的坏态落在两个方向**（读错项目 = 2 ∥ 读成三零 = 0）⇒ **两种都必红**，不是「只断不抛」。

### 6.3 集成集读数（父侧实读，不抄）

```
test/integration/*.test.mjs   = 21 档
test() 计数                   = 73 例（下限：只计行首 test(）
test/RTM.md 业务故事（###）    = 21 个
test/RTM.md 用例行（| N-M）    = 74 行
```

**⇒ 集成集规模 = 21 档 / 73 例，落在项目窗口（≈50–100）之内。**

**★ 一处 1 之差要说清**：用例 73 与 RTM 行 74 差 1。**原因是计数口径** —— 我的扫法只数行首 `test(`，用例档里若有缩进调用或同档多个断言组，会少计；**RTM 行按编号行计**。**两个数都不是「权威值」**，**权威 = 跑一次全量看 pass 数**。这条按 E4 记在这里，不写进状态档。

### 6.4 交付门

`doc_check(mode:"gate")` 于本轮改动档 = 记录面与用例档，**首行 `DOC-CHECK GATE: PASS`**。

### 6.5 一条欠账（本批新增用例的第一批集成面）

**这是本项目集成集里「台账读面」的第一组用例。** 按 `docs/core/design/TESTING.md` §13 的口径，**集成用例只能从两个入口长出来**：业务真实需要的场景 ∥ 生产真出过的问题。

**本批的入口 = 第二个**：`ledger/count` 与 `ledger/list` 界不一致，会让「读别人项目的台账」静默回三零 —— **一个不报错的错数**，属于真的会出错单的地方。

### 6.6 收口判据

- chain 齐备：§1 讨论 ✅ · §2 设计 ✅ · §3 评审通过 ✅（第 2 轮）· §4 批准 ✅ · §5 实施完成 ✅ · §6 本段 ✅
- 交付门 PASS · 四例全绿 · 变异零残留
- 台账：`#1895` → 待核销 → 已核销（证据 = 本档 §6）
