# 批档 · 台账 · 评审三链统一（设计）

> 板 = core。本档拥有「一件工作从开批到核销」的**生命周期契约**：谁在什么状态下存在、哪道门在哪个时点判什么。
> 台账行状态机归 `docs/core/design/LEDGER.md`，批档六段与冻结归 `docs/core/design/BATCH-RECORD.md`，轻通道流程倒置归 `docs/core/design/LIGHT-CHANNEL.md`，
> 设计凭证槽归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`——本档只写**三者相交的那部分**，不复试它们各自的部分。

## 1. 做法与理由

一件工作的三个载体现在各自独立：批档是一份 `.md`，台账是一行 SQLite，评审是 `§3` 的一段文本加一枚运行态 token 槽。
用户裁定把它们串成一条链：**建批档即建台账行**、**评审结论进状态机**、**没有活批档不许改产品代码**、**核销以收口为前提**。

做法一句话：**把三条链的每一处连接都改成「档面上的事实」**，不留运行态判据（内存 Map / 会话槽号），
这样换会话、重启进程、隔天补账，判据都还成立。

**最近先例**：`thincoder-core/ledger-cmd.mjs:395`（`REANCHOR_STATUSES`）+ `:421`（`ledgerReanchorBatch`）——形状 = 收口时按批指针重锚台账行；
设计档 = `docs/core/design/LEDGER.md` §6.2（取行句）· AC-M2-30；**落地批 = 台账 #1550**（在册状态 = 同档 §3.5 四件表）。

本档**对齐**它（收口是台账面的机器写点、失败不否决冻结、回执带 `[ledger reanchor]` 段）；**偏离**两处：
① 它把本批未落行一律压成 `条件`，本档改按**行状态分流**（`§2.7`）；② 本档新增反向的**重开回收**（`§2.13`），它没有对应件。

**调研证据**：

- **仓外声明源**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（按键名定位；`:35` 2026-10-27 12:35 实读，本轮按键名复核仍命中同一行）⇒ **无仓外声明源可查**（照记）。
- **仓内设计层相关档**：`docs/core/design/LEDGER.md`（核销机检 / 收口重锚）· `docs/core/design/BATCH-RECORD.md`（收口链门 / §3 词表）· `docs/core/design/LIGHT-CHANNEL.md`（轻通道轮在盘谓词）· `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（槽归属）· `docs/core/design/TOOLS.md`（工具契约）· `docs/core/design/TESTING.md`（零留存门）。
- **面分类正源** = 需求层 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5（`:665`–`:668`），已并入 `§2.1` / `§2.10`。

**档归属**：跨链契约（一本 ↔ 行集 `§2.4` · 活批档 `§2.2` · 四道门 `§2.6` · 重锚分流 `§2.7` · 重开回收 `§2.13`）与 `§3` 状态行词表（`§2.5`——含打回即重置）由本档拥有。
`§2.1` / `§2.10`（面判）与 `§2.12`（排除名单）的长期归属 = `docs/core/design/ENGINEERING-MODE-V2.md` §13.5 的机判实现；`§2.7` / `§2.13` 归 `docs/core/design/LEDGER.md` §6.2。

**两侧写法不同时以本档为准**（取代项逐条列在 `§2.7`），直到对应正文并回该档。

**合并待办的承接判据**（不预设批次号）：承接方 = 各目标档所在板的下一次**正文合并批**；判据 = 该档「在册状态」节与本文 `§2.7` 取代项逐条归零（盘上不再有两侧并立的同一机制）；承接记录落在批档 `§6` 收口行。

## 2. 接口契约

### 2.1 面分类（锁的判据底座）

**判据来源 = 需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5**（`:665`–`:668`）：

| 面 | 路径枚举（逐字引需求档） |
|---|---|
| 产品代码面 | `thincoder-core/**` · **四产品** `{src,bin,webview,test}/**` · 产品文本面 |
| 工程工具面 | **仓根** `scripts/**` · **仓根** `test/**` · `.thincoder/**` · `.github/**` · `package-lock.json` |
| 文档面 | 需求档原文 =「按写权矩阵（D1）」；机判投影 = manifest `docRoot` 各值（`requirements` / `specs` / `design` / `modules` / `batches`，多根为数组） |
| **兜底** | 未列入两枚举的路径 **一律产品代码面**（fail-closed） |

- **四产品** = `thincoder-cli` / `thincoder-vscode` / `thincoder-desktop` / `thincoder-server`。`thincoder-core` 是核、不计入产品——它的面由首条 `thincoder-core/**` 覆盖。
- **显式偏离（用户 2026-10-27 口径）**：`thinworker` **不纳入**本判据；它的路径落兜底（= 产品代码面），本批不为它建目录枚举。
- **文档面为什么取 `docRoot`**：需求档写「按写权矩阵（D1）」，D1 判的是**归属**（哪类档谁写），不是路径枚举；机判需要路径前缀，`docRoot` 各值就是 D1 在写面上的投影。两者不冲突：`docRoot` 命中的路径，写权归属仍按 D1 判。
- **产品文本面** = 四产品包的外向文本（`README.md` · `package.json` · 发布清单 · 产品 `AGENTS.md`）。§13.5 按类别点名，实施按这四例认档。
- **仓根 `test/**`（集成用例目录）= 工程工具面 ⇒ 放行**：集成测试是跨仓验证面，不属产品；改它不开批。产品包内的 `test/**` 相反，见 `§2.10` 的修正②。
- **包内 `scripts/` 不在工具面**（需求档 `:666` 逐字）：工具面的 `scripts/**` 只指仓根那一条；`thincoder-core/scripts/check-syntax.mjs` 是随包发布的产品代码 ⇒ 拦。判据见 `§2.10` 的修正③。
- 判据单源住新叶档 `thincoder-core/agent/write-face.mjs`（`faceOf(absPath, manifest)` → `"product" | "pass"`；七步面判顺序与每步的放行依据 = `§2.10`）。
- 路径归一复用 `write-gate.mjs:98-102` 的 `gateKey` 形状（绝对化 + `/` 归一 + win32 大小写归一）；文档面取 manifest 值、不写死 `docs/`（先例 = `write-gate.mjs:58-60`）。
- **与 `conventions.mjs` 的关系**：本判据**复用** `classifyPath`（`conventions.mjs:151`）的判类结果，只在其上叠三处修正，不另写分类器（`§2.10`）。`classifyPath` 本体零改——它有七个生产消费面（`dispatch.mjs:115` · `unbooked-pen.mjs:52` · `verify.mjs:193` · `advisor-settle.mjs:74` · `advisor/repos.mjs:122` / `:146` · `declaration.mjs:246`），改它会把 verify / 评审陈旧 / 索引范围一起翻面。
- **一个消费面换判源**：`agent/dispatch.mjs:115` 的设计门由 `isCodePath(abs, conv)` 换成 `faceOf(abs, manifest)`——设计门的**前置条件不变**（活设计槽 ∥ 轻通道轮），只把它对「什么算产品码」的判断并到唯一一份判据上。理由：两道门各用一套面判据必然漂移，漂移的后果是「设计门放的、写锁拦的」各说各话。其余六个消费面零改。

### 2.2 活批档（锁的判据）

**活批档** = 三条同时成立，全部是盘面事实：

1. 某批档 `§1` 状态行 = `进行中`；
2. 该档档头 `> 台账 = #N` 的 N 在项目台账里有一行，且 `status = 在途`；
3. 该行 `task_book` 的文件部分（`formatOf` 同口径 = 首个 `§` 前子串）解析出的档 = **该批档本身**。

多条同时为活 = 合法（用户裁定允许多个活批档并行），锁只问「是否存在至少一条」。

**既有件的三问（先查再建）**：

| 问 | 答 |
|---|---|
| 这功能现在住在哪 | `thincoder-core/agent/light-round.mjs:28` `lightRoundOpen(agent)`——它的谓词与活批档**同形**：`status = 在途` 行 ∧ `task_book` 指向的档 `§1` = `进行中`（该档头注 `:4`–`:13` 逐字）。另 `thincoder-core/token-ttl.mjs:282` `anyLiveDesignSlot(agent)` = 设计槽判活（内存 Map + 槽文件回读），与批档无关。 |
| 叫什么 | `lightRoundOpen` / `anyLiveDesignSlot`（两处既有名，本批不改名） |
| 谁消费 | `lightRoundOpen`：`agent/dispatch.mjs:102`（设计门逃生支）。`anyLiveDesignSlot`：`agent/dispatch.mjs:100`（设计门资格）。 |

**做法 = 复用读法、不另写扫描器**：新叶档 `agent/live-batch.mjs` 导出 `liveBatchOpen(agent, { roundMarker })`，判据与查找面**逐字沿用** `light-round.mjs` 的实现。
候选面 = 会话锚 + 直接子目录一层（`ledgerChildren` 单源）；workspace 候选跳过；行先按 `status = 在途` 过滤；再以各候选为基解析 `task_book` 的 `§` 前子串；`readBatchStatusLine` 判 `open`。

`lightRoundOpen` 改为薄壳：`liveBatchOpen(agent, { roundMarker: ROUND_MARKER })`——唯一差异 = 轻通道轮的行 `title` 必须携「收尾链待跑」。

- **推论（可核）**：轻通道轮在盘 ⇒ 活批档成立（轻通道轮的行本就是 `在途` ∧ 指针指回轮档 ∧ 轮档 `§1` 进行中）。所以新锁**不必**为轻通道留口子，也不会把它拦下。
- **查找面与上界**：候选 ≤ 1 + 直接子目录数；DB 读 = 每候选一次 `ledgerQuery`（`status: "在途"`）；档读 = 每命中行一次 `readFileSync`。**读错 / 不可判 ⇒ false（fail-closed，照拦）**——锁是业务门，读不到不等于放行。

### 2.3 写锁（写面冲突块第三道门）

`write-gate.mjs` 新增导出 `productCodeWriteConflict(agent, depth, absPaths)`，与既有两道并列挂 `dispatch.mjs` Phase 1
（`dispatch.mjs:142-165` 同一块：`FILE_MUTATORS` / `file_ops` 才进；既有两道 = `:149-155` 跨批档写 · `:156-164` D5 冻结窗）。

**与既有设计门的关系（组合方式 = 前置保留 + 面判据合并）**：

| 门 | 位次 | 前置（合取） | 面判据 |
|---|---|---|---|
| 既有设计门（`dispatch.mjs:99-132`） | **前** | 工程模式 ∧ `depth = 0` ∧ `!anyLiveDesignSlot` ∧ `!lightRoundOpen` | 本批**换判源**：`isCodePath` → `faceOf`（`§2.1`）；否则它的面判先行，本锁对产物目录的放行永不可达 |
| 本锁（`productCodeWriteConflict`） | 后（`§142-165` 块内，与另两道并列） | 工程模式 ∧ `depth = 0` ∧ 无活批档（`§2.2`） | `faceOf`（同一份） |

- 两道门判的是**两件不同的事**：前门问「设计做没做」，后锁问「批开没开」。所以**并列、不替换**：有设计槽但没开批 ⇒ 后锁拒；开了批但设计门先看到没设计槽 ⇒ 前门拒。
- **两态验收（验收与用例表同此）**：

| 态 | 前门 | 本锁 | 结果与拒文 |
|---|---|---|---|
| 无活设计槽 · 非轻通道 · 无活批档 | 拒 | 不可达 | 旧设计门拒文（`engineering design gate`）。**面判据已换**：产物目录不再被它拦 |
| 有活设计槽 · 无活批档 | 放行 | 拒 | `§2.3` 拒文 |
| 有活批档 · 无活设计槽（也非轻通道） | 拒 | 不可达 | 旧设计门拒文（设计未做） |
| 活批档 ∧ 活设计槽 | 放行 | 放行 | 写入 |
| 轻通道轮在盘 | 放行（`lightRoundOpen`） | 放行（轻通道轮 ⊂ 活批档，`§2.2`） | 写入 |
| 出辖（祖先链无 manifest） | 放行 | 放行 | 写入（两道门同口径） |

- **判序 = 面判先行**：`faceOf` 判 `pass`（文档面 / 工程工具面 / `BUILD_ARTIFACTS` / 出辖）⇒ **不读台账、直接放行**；只有目标判为**产品代码面**时才读台账。理由：出辖路径的祖先链无 manifest，台账根同样不可推导——若先读台账，下面「读不到台账 ⇒ 拒」会把上表「出辖 ⇒ 放行」吃掉；先后定死，同一输入的成败才唯一。
- **拦**：目标在**产品代码面** ∧ 不存在活批档 ⇒ 拒。
- **不拦**：文档面 · 工程工具面 · `depth > 0`（子代理走既有 token 门）· 只读动作（本就进不了本块）。
- **读不到台账**（库不可开 / 根不可推导）⇒ **拒**，拒文点名台账的原始错误——锁是业务门，读不到不等于放行。
- **只在工程模式生效**：开关 = `agent.config?.agent?.engineering`（与 `dispatch.mjs:99` 既有设计门同一枚）。普通模式不挂本门。依据 `docs/core/requirements/NORMAL-MODE.md:99`：两模式工作管理同一套，差别只在约束强度（工程 = 机械强制——设计令牌 ∥ spawn 强制档绑定 ∥ 写门；普通 = 纪律自持）。挂成两模式通用 = 改普通模式的产品行为，没人裁过。

拒文（逐字，机检可断言）：

```
write refused — no live batch record: a product-code write needs a live batch (record §1 = 进行中 ∧ its ledger row = 在途 ∧ that row's task_book points back to the record). Open one first: batch({action:"create", topic, source}) — it opens the ledger row in the same call. Nothing was written.
```

### 2.4 建档 = 建台账行（一件事）

`batch({action:"create"})` 新增必判分支，`ledger` 参数由「可选、不校验」变成**接管或新建**：

| 传入 | 行的现态 | 结果 |
|---|---|---|
| `#N` | 不存在 | 拒（`R-C1`） |
| `#N` | `待讨论` / `待设计` | 接管 → `在途`，`task_book` = 本档相对指针 |
| `#N` | `在途` ∧ `task_book` 指回本档 | 接管（不动状态、零写） |
| `#N` | `在途` ∧ `task_book` 指别处 | 拒（`R-C2`） |
| `#N` | `已核销` / `已废弃` | 拒（`R-C3`） |
| 不传 | — | 新建一行：`在途` · `kind` = `tech_todo`（`requirement` 由 `board` 决定）· `title` = `topic` · `task_book` = 本档 · `trigger` = `归批` |

**事务（单事务在台账侧，档写在事务窗口内；落档先于指针写入）**：

1. `ledger-cmd.mjs` 新导出 `ledgerBindBatch({cwd, ledgerNo, taskBook, title, kind, board}, writeRecord)` 开 `BEGIN IMMEDIATE`；
2. **新建路径**：INSERT 一行 `待讨论`（`ledgerAdd` 既有形，`ledger-cmd.mjs:176`；无指针，故 DDL 咬合 CHECK（`docs/core/design/LEDGER.md:54`）不拦），拿到真实行号 `#N`；**接管路径**：`#N` 已知，跳过本步；
3. 回调 `writeRecord(#N)` 写批档（`wx` 独占创建，不覆写既有档）——**必须先于步 4**：写门两形都判「解析出的档在盘」（在册旧形 `docs/core/design/LEDGER.md:732`；新形臂② `:745`），先写指针、后落档 ⇒ 被自己的门当场拒；
4. 行写入走 `applyRowUpdate` 的**同一函数体**（不重做门：迁移表 → 核销标记门 → executor 语义 → 写门 → `UPDATE`）：`待讨论` / `待设计` → `在途` + `task_book` = 本档（新建行同此一步）；为此给该函数加内部形参 `tx`（外层已有事务时不自开 `BEGIN`），并拆出 `applyRowUpdateTx(db, row, patch)`——**不直写 SQL**，否则迁移表新边（`§2.8` / `§2.13`）反而不会被用；
5. `COMMIT`。任一步抛 ⇒ `ROLLBACK` + `unlinkSync(批档)`（该档本笔刚建）+
   原样上抛。回滚失败 ⇒ 拒文点名「台账已回滚 / 档残留 <路径>」，**不静默**。

- **为什么 INSERT 在最前**：档头要写真实 `#N`，而 `#N` 只有行落库才有；`在途` 行被 DDL 咬合 CHECK 强制非空指针 ⇒「先 INSERT `在途`、后落档」走不通，故先落一行不带指针的 `待讨论`。
- **`待讨论 → 在途` 这条边因此是必经一步**：新建路径的整个事务建立在它上——没有它，`create` 写不出来（理由与验收影响见 `§2.8`）。
- **接管路径同一条道理**：`#N` 已知 → `writeRecord` → `applyRowUpdate`（迁 `在途` + 写指针）→ `COMMIT`；指针永远后写。
- **崩在窗口内**（新建行已 INSERT ∥ 接管的行已改、`COMMIT` 未执行、档已落盘）：SQLite 回滚事务 ⇒ 行回到原态；档在盘且无行指它 ⇒ 不是活批档（锁照拦），重建同名档会被 `wx` 拒 → 拒文点名该残留路径。
- **验收判据不变**：`§5` R1 与 `§9` 13-1 断言的是**终态**（一行 `在途` + `task_book` 回指本档 + 档头真实 `#N`），事务内步序不进判据。

**档头台账行**：`> 台账 = #N（board · 归批）` 由**真实行号**填（不再留 `#<编号>` 占位），`batchSkeleton` 的 `ledger` 实参从「给了就填」变成「必填」。
`board` 未给 ⇒ `tech_todo` 行 `board` 留空、档头写 `（— · 归批）`，不拒（`board` 是分类不是身份）。

**一本批档的账 = 指回本档的行集（点火时数几条 ⇒ 绑几条）**

**主线一句**：**台账行的 `task_book` 就是批档指针**——挂账时为空（行落 `待讨论`、不指任何批档）；**开批时把本档要处理的每一条行都写上本档指针**；收口时这批行一起结（终局只有 `已核销` ∥ `已废弃`）。

**判据单源**：本档的账 = `task_book` 的文件部分解析回本档的**全部行**（`thincoder-core/ledger-write-ops.mjs:185` `resolveBatchRows`；收口重锚 ∥ `ledger update/close --batch` ∥ 重开回收三处同读这一条；读面导出 = `thincoder-core/ledger-cmd.mjs:269` `ledgerBatchRows`，公共面 `thincoder-core/ledger.mjs:157`）。行集是**集合**——既有机制本来就按集合写，本节只规定点火时把它填满。

**读径（判据第 1 步走哪一条）**：走上面那条**同址解析**径。`ledger({action:"query", task_book:"…"})` 是**原值等值**（列串直比，`thincoder-core/ledger-cmd.mjs:108`），该档 `:96`–`:97` 自述与选行「文件部分解析同址」两径口径不同、各自单源 ⇒ **不作判据读径**，只作人读。人工跑一次：

```text
node -e "import('./thincoder-core/ledger.mjs').then(m=>console.log(m.ledgerBatchRows({cwd:'<项目根>',batch:'<本档相对指针>'})))"
```

**先例**：`resolveBatchRows` 已是行集判据单源，本节**对齐**它的形状（不在批档侧另立第二条判据）；**偏离**一处——它只回答「现在谁指回本档」，本节补上「点火时应当有几条指回本档」。

**事故形态（本条规则要堵的洞）**：`#1912` 建档不带 `ledger` ⇒ 工具自动开一条行；它覆盖的 `#1900` / `#1909` / `#1910` / `#1911` 一条也没写 `task_book` ⇒ 四行不在本档行集内 ⇒ 收口重锚（`thincoder-core/ledger-cmd.mjs:311` 逐行取自 `resolveBatchRows`）对它们零触，四行永远开在 `待讨论`。**同一件事五条账，就是这么来的。**

**铁律：认领已有的活，不新建台账行。** 本档覆盖 ≥ 1 条旧账时，`batch create` 带 `ledger:"#N"` 接管其中一条，其余每条同轮绑回本档——**本档不新开第二条台账行**。

理由：台账行是**要求点**的账（`kind` / `title` / `resume_when` / 行龄都挂在行上），批档是**执行载体**；同一点再开一行 = 同一件事两套账，收口时必现「批里已结、账上还开着」。事故第二次就是读者看不出这一条：`#1912` 开了新行、覆盖的四条一条没绑。

**两条情形（主线落在哪种形状上，不是并列的三条路）**：

| 这本覆盖几条旧账 | 是主线的哪种情形 | 点火怎么做 |
|---|---|---|
| **≥ 1 条**（认领） | 主线本形——**不新建台账行** | 带 `ledger:"#N"` 接管最相关的一条；其余每条同轮绑回本档 |
| **0 条**（新债） | 主线走空集，本档自开一条 | `create` 不带 `ledger` ⇒ 工具自动开一条（`在途` · 指针回本档） |

**逐行处置（覆盖行的现态决定动作；`在途` 指别档是停，不是抢）**：

| 该行现态 | 怎么做 |
|---|---|
| `待讨论` / `待设计` | 绑回本档：`ledger({action:"update", id: 1900, task_book:"<本档相对指针>", status:"在途"})`——`id` 是**数字**、不带 `#`（`batch` 的 `ledger:"#N"` 是字符串，两面不同形） |
| `在途` ∧ 指针指本档 | 零写（已在本档行集） |
| `在途` ∧ 指针指别档 | **停——本批不认领这一行**：该行已被 `<path>` 持有，同一时刻一条债只许一个批档持有；认领 = 承诺做完，所以「先解绑再绑」也不是本批的路（那是两次转手，不是认领） |
| `待核销` | 停：已结账待勾销，不构成本批的活（`create` 对 `待核销` 号同拒，`thincoder-core/ledger-write-ops.mjs:194`）；先核销它，或由持有它的批档重开回收（`§2.13`） |
| `已核销` / `已废弃` | 不列入 `覆盖账`；它记的若正是本批要做的那件事 ⇒ §1 写一行理由，说明为何重新开账 |

**认领即承诺（收口分流的后果）**：认领一条行 = 承诺本批把它做到终局。所以点火前先判「这条能在这批做完吗」，判不能 ⇒ **不认领它**（不算覆盖、不绑、§1 不列）。收口时认领行只有两种终局：做完 ⇒ `已核销`；判定「不用做」（前提不成立 / 已有它法）⇒ `已废弃` + `evidence` 写判据。**没有第三种**——退回 `待讨论`、转 `条件` 等下一批都不是认领行的出路（判据单源 = `docs/core/requirements/ENGINEERING-MODE-V2.md:718`「认领即承诺」）。

**点火直跳 `在途`，不过 `待设计`**：`待设计` 那条边表达的是「已排设计」，不是点火发生的事——理由与建档事务的必要性单源 = `§2.8`，本节只引用。

**唯一允许撤回的场合 = 重复登记**：两行记的是同一件债 ⇒ 冗余那行 `close {status:"已废弃"}`，`evidence` 点名吸收它的行号。理由：`已废弃` 的语义是**撤回**，把做完的点记成撤回是记错账（`thincoder-core/ledger-write-ops.mjs:155` 只拦 `已核销`，撤回任意态放行）。本形按 `§7` 的边界保留：台账上暂无实读的「两行同债」样本，本节只判这个形本身。

**可追溯性由什么补回**：每条原始条目**留在台账上、指针指回本档**——不是靠批档 §1 抄一遍。§1 另写一行 `覆盖账 = …`（见下）：它是判据的输入，也是人读的一面。

**`覆盖账` 行（§1 段体，逐字一形）**：

| 问 | 答 |
|---|---|
| 住哪 | 批档 §1 段体，一行。`docs/core/design/BATCH-RECORD.md` 无 §1 必写行清单——它按需登记单条行约定（`已定决定` 行 `:255` · `不适用` 声明 `:442` · `批起 sha` 记入行 `:595`），故本行的判据与字面归本节拥有 |
| 叫什么 | `覆盖账 = #N [#M …]`——`覆盖账 = ` 后接空格分隔的 `#` 行号，**首项 = 本档自己那一行**（接管的那条 ∥ 自开的 `#N`），其余按行号升序；恒写、单行、无注释。例：`覆盖账 = #1915 #1900 #1909 #1910 #1911`；自开的档写 `覆盖账 = #1915` |
| 谁消费 | 判据第 2 / 3 步（机判的比对集）+ 人读 |
| 为何不复用档头 `> 台账 = #N` | 档头那行是**本档自己那一行**（机器按真实行号填，活批档判据 `§2.2` 读它）；`覆盖账` 是**手写的意图面**（打算覆盖哪几条）。判据要拿「意图」比「事实」——用同一行就是自己比自己，漏登记的那条永远查不出 |

**判据（拿一本批档 + 台账，机械地判「这本的账对不对」）**：

1. **行集非空**：按上条**读径**取本档行集 ⇒ ≥ 1 行（`create` 保证：不接管就自开一条）。
2. **覆盖账条条在册**：`覆盖账` 里每个 `#N` ⇒ 该行 `task_book` 的文件部分解析回本档；或该行已在归档态（`已核销` / `已废弃`）且 `evidence` 点名了吸收它的行（只可能是重复登记）。
3. **反向无孤儿**：第 1 步行集与 `覆盖账` 的 id 集逐条比对 ⇒ 两边相等。差一条就是一条孤儿账。（自开那条也列在 `覆盖账` 里 ⇒ 0 覆盖的档不再被判成孤儿。）
4. **收口后零未决**：本档收口并结算后同一读径的行集里不得有 `待讨论` / `待设计` / `在途` / `待核销`——终局只有 `已核销` / `已废弃`（`docs/core/requirements/ENGINEERING-MODE-V2.md:718`）。机器兜底对残留的 `待讨论` / `待设计` 只落 `trigger = 条件`、状态留原值（`§2.7`）⇒ 第 4 步照样报出来。

- **判据管不到的一面（如实写）**：它只保证「登记了的没漏」，不保证「漏了没登记」——`覆盖账` 由人写，少写一条查不出来。那一面归点火前的台账扫描（`thincoder-core/prompts/persona-engineering.md:382` 第 4 条）与行龄读数（`aged`），不由本节兜。

- **不加机械门**：判据是给人 ∥ 主 agent 跑的自检，不进工具（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.8 边界：不为此加机械门）。`create` / `update` / `close` 语义一条不动，本节只规定**用哪几条、怎么用**。

**提示词落点**（实施轮 eng-coder 落笔）：`thincoder-core/prompts/persona-engineering.md` 生命周期第 1 条，改后整条逐字——

```text
1. **Batch ignition** ⇒ `batch({action:"create"})` — the record and its ledger row are one action; the `ledger` argument is the fork: **omitted** ⇒ a new row opens for this record; **`ledger:"#N"`** ⇒ that row is taken over (待讨论 / 待设计 → 在途 · `task_book` = this record).
   **The line: a row's `task_book` IS the record pointer** — empty while pooled; at ignition every row this record handles gets the pointer; at closeout the set settles together (已核销 ∥ 已废弃, no third ending). The path must exist — the write gate refuses a pointer to a missing record.
   **Claiming never opens a new row**: **0** covered rows ⇒ omit `ledger` (this record opens its own) · **1** ⇒ pass it as `ledger:"#N"` (a **string**; `"1900"` also works) · **several** ⇒ the closest one the same way, then bind each remaining covered row in the same round.
   Bind form: `ledger({action:"update", id: 1900, task_book:"<this record>", status:"在途"})` — `id` is a **number**: no `#`, unlike `batch`'s `ledger:"#N"` (a string) — straight to 在途, never through 待设计.
   - **Bind by row state**: 待讨论 / 待设计 ⇒ bind · already 在途 pointing here ⇒ write nothing · 在途 pointing at another record ⇒ **do not claim it** (one debt, one holder).
     A row already 待核销 or archived is not this record's work: settle the 待核销 one first (待核销 → 已核销) or reopen the record holding it (it returns to 在途); an archived row stays settled — a new row carries the work. Either way leave it out of §1's account and write the reason there.
   - **Claiming is a promise to finish**: decide before ignition whether it can be finished in this batch; if not, do not claim it. At closeout each claimed row ends 已核销 or 已废弃.
   - **Why the rest must be bound**: closeout re-anchors only rows whose `task_book` points at this record — a covered row left unbound stays open forever and the same work ends up with two accounts.
   - **Duplicate rows are the one exception**: two rows recording the same debt ⇒ withdraw the redundant one (`close {status:"已废弃"}`) with `evidence` naming the row that absorbed it.
   - **Register them in §1** on one line — `覆盖账 = #N [#M …]`, this record's own row first and always included (this record opening its own row writes `覆盖账 = #1915`). That line is what the account check compares against.
```

- **边界**：只换这一条；台账节前四条与生命周期第 2–5 条零改。工具描述面零改——`thincoder-core/agent-tools/batch.mjs:306` 已准确陈述「带 `ledger` 接管 / 不带就新开」这一分岔。

拒文（逐字）：

```
batch: ledger entry #<N> does not exist in this project's ledger — pass an existing number, or omit ledger and let create open a new row. Nothing was written.
batch: ledger entry #<N> is 已核销 / 已废弃 — an archived row cannot carry a new batch record (open a new row instead). Nothing was written.
batch: ledger entry #<N> is 在途 and its task_book points at <path> — another batch owns it; a record may take over a row only when its task_book points at this record. Nothing was written.
```

### 2.5 §3 状态行词表（评审结论进状态机）

最终形态：`3: { open: "进行中", done: "评审通过" }`——**只有 pass 叫完成**，不设第三态词。

- `changes-required` 不写状态词：该轮评审结论落在 `§3` 段体（`### 轮次 N` 块），状态行留 `进行中`——「评审没通过」= 评审未完成，这是真话。（工具被动重置时携 `（第 N 轮打回）` 括注，见下。）

**打回即重置（工具被动写，2026-10-28）**：状态行由工具改，不靠评审记得。

触发 = 三合取：① 一笔 `append §3`；② 这一笔的文本带打回裁定行；③ 写这一笔之前 `§3` 状态行 = `评审通过`。

② 的判据单源 = `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `VERDICT_CHANGES_LINE`——`VERDICT: changes-required` / `VERDICT: 不通过` / `VERDICT: 需修改` 与 `结论：…` 同义形的整行判据，与设计凭证裁定闸读同一条正则。

**三件同源**：`_V_PRE` / `_V_SUF`（`thincoder-core/agent-tools/batch-skeleton.mjs:261` / `:262`）与 `VERDICT_CHANGES_LINE`（同档 `:263`）住骨架档，写入面与签发面同读；签发面的 `VERDICT_PASS_LINE` 留 `thincoder-core/agent-tools/design-token.mjs:114`，经 import 取这两条锚。

- **锚形只此一份**：不复制到第二档，也不由两档各写一遍（`design-token.mjs:20` 已 import 骨架档，无循环）。

三条全中 ⇒ 同一笔写盘里两处落笔：状态行 → `进行中（第 N 轮打回）`；本轮块首戳一行留痕 `> 状态行重置：第 N 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · <YYYY-MM-DD>`。

- **重置不等于清空**：留痕行把「上一轮 pass 被这一轮推翻」写在档里——状态行只余 `进行中`，不写留痕则读档的人会以为从没评过。
- **只走既有写面**：状态行仍由 `updateSectionStatusLine` 单行改写（同档 `:164`），不新开第二条写路径；留痕行是本轮块内的段体内容，与工具戳的 `### 轮次 N（评审子代理）` 同面，append-only 不变。
- **③ 把「上一轮 pass」写死在内**：`§3` 已是 `进行中` ∥ 无状态行 ⇒ 零写、零留痕（本来就写着「评审未完成」，重置无事可做；本轮块本身即证据）。顺序交接不误伤：未打回的批（首轮 pass）不触发。
- **为什么必须机械**：状态行是下游 `§5` 写入门（`thincoder-core/agent-tools/batch-closeout.mjs:105`）∥ 收口门 ∥ 核销门③的唯一判据面。靠评审「记得把状态行改回去」是一条纪律，而纪律在打回那一轮最容易漏；写成工具条件，漏不掉。**第四处读它的是签发面**：`thincoder-core/agent-tools/design-token.mjs:229`-`:233` 的 §3 落地门判据 2（`status-not-passed`）——打回后再 pass 那一轮须重写 §3 状态行，否则拒签；此前它吃上一轮残留而放行，补写即可重评。
- **修前实读（敞口本身）**：`§3` 状态行 = `评审通过` ∧ `§3` 已有轮次块含 `VERDICT: changes-required` ⇒ 直调 `assertSectionFiveGate` 喂此夹具**不抛**（放行——该函数放行时不返回值也不打印，「不抛」就是它唯一的可观察面）；同刻 `readSectionStatusWord(src, 3)` 返回 `评审通过`。重置落地后同夹具读到 `进行中`，门遂拒。
- **判 `§3` 结论只认状态行那一行**：留痕行逐字写「上一轮状态行 = 评审通过」，轮次块正文也可能出现词表关键字——`**状态行**：` 前缀之外的关键字不构成结论（读面单源 = `readSectionStatusWord` 的段内状态行行扫描）。
- **留痕行不经文档机检门**：门位在 `insertIntoSection` 之前（`thincoder-core/agent-tools/batch.mjs:243`，判集只含评审正文 `pending.body`），留痕行插在其后 ⇒ 不进门判集；门判的仍是评审正文本身。
- **边界（如实登记）**：这一笔连裁定行都没有（设计凭证侧判 `no-pass-line`）⇒ 本重置不触发，`§3` 仍留上一轮的 `评审通过`，`§5` 门可写。本轮无裁定行时，工具无从区分「打回」与「补记一段散文」，故不扩触发面。
- **被拒方案（两终态词 `评审通过` / `评审须修改`）**：代价 = 每个读侧多一态（`readSectionStatusWord` / 链门 / `batch/list` / 词表并集四处）、
  拒文多一支、且 `须修改` 与 `进行中` 对「评审还在跑」不可区分；收益（分清「没跑」与「跑了没过」）`§3` 段体的轮次块已经给了。故不取。
- **存量档兼容**：旧字面 `评审完成` 读侧等义于 `评审通过`（`readSectionStatusWord` 一张别名表，逐条注退场条件 = 盘上再无该字面）。
  存量档**不回填**（已冻结档不改字节）。
- 冻结门零变：`gate` 只读 `§1`。

### 2.6 四道门各判什么

| 门 | 位置 | 判据 | 模式 | 拒绝时报什么 |
|---|---|---|---|---|
| 写锁 | `write-gate.mjs` `productCodeWriteConflict`，挂 `dispatch.mjs` Phase 1（`§2.3`） | 目标在产品代码面 ∧ 无活批档 ⇒ 拒 | 仅工程 | `§2.3` 串 |
| §5 写入门（段序门） | `batch` append §5（`batch.mjs:163` `appendBatchRecord`） | `§3` 状态行 = `评审通过`；**或** `§1` 声明 `> 不适用：§3 —— <理由>`（无评审的批） | 两模式 | `R-G2` |
| 收口门 | `close` ∥ `status` 写 `§1 已收口` | 链门（既有四条与 §3 内容臂**零改**）**∧**（`§3` 状态行 = `评审通过` **∨** `§1` 声明 §3 不适用） | 两模式 | `R-G1`（§3 未过）∥ 既有 `J1`/`J2` |
| 核销门③ | `ledger-close-proof.mjs` | **档面事实**：该档 `§3` 状态行 = `评审通过`（不再读 token 槽归属） | 两模式 | `R-L3` |

**收口门的 §3 内容臂留着**（不换成只判状态词）：既有链门 = `§2`/`§3`/`§4`/`§6` 各段有内容或声明不适用（`docs/core/design/BATCH-RECORD.md:435`），本批在它之上**加**一条状态词臂，两条全需满足。理由：内容臂守的是「段里真跑过」，状态词臂守的是「跑的结论是 pass」——换掉内容臂 = 门被放宽（一段空着但状态词对就过），那正是本批要堵的洞。

**模式范围（决策 18）**：写锁仅工程模式；§5 门与收口门两模式同判。
- 理由：写锁是**强制机制**（拦不拦得住写），工程模式专属；段序门与收口门是**批档机制自身的段序纪律**——批档一份、两模式共用，段序在两种模式下都是真话（实现本来就发生在评审之后）。
- 普通模式的出路 = `§1` 声明 `> 不适用：§3 —— <理由>`（`batch-lifecycle.mjs:262` 本就允许 §2/§3/§4 声明）；普通模式无设计评审，该声明本就该写。
- **这是有意改普通模式行为**（此前普通模式的 §5 无前置、收口不判 §3）：挂用户 2026-10-27 11:35「必须走过全流程」+ 11:52「同意」；不取「仅工程模式」——那会让普通模式的批档不必声明就跳过评审段，链门在两种模式下含义不一。

**§5 为什么该判 §3**：「评审进状态机」唯一能机械落地的位置就是 §5 写入点——实现发生在评审通过之后，序在这里才判得出真假。三条旁证：

- **轻通道不受影响**：轻通道是父侧直改，**不写 §5**（§5 段号在收口链门里本就豁免，`batch-lifecycle.mjs:24` · `:262`）；它补全流程落在 §3 / §6。
- **修正轮不受影响**：修正轮在 §3 已 pass 之后改代码、追加 §5，判据当场成立。
- **唯一要留的口子 = 无评审的批**：`§1` 声明 `§3` 不适用（普通模式无设计评审，`batch-lifecycle.mjs:262` 允许 §3 声明）⇒ 放行。不留这个口子会把普通模式的 §5 全部堵死。

拒文（逐字）：

```
batch: §5 append refused — the implementation section opens only after the design review passed (§3 状态行 = <value>，须 = 评审通过；无评审的批在 §1 声明 `> 不适用：§3 —— <理由>` 放行). Nothing was written.
```

**核销门为什么能去运行态**：`§3` 只能由**绑在该档上的评审实例**写（`batch` 工具的 review 绑定，`batch.mjs:78-87`），
所以「§3 有 pass」本身就证明了「有一次绑本档的评审跑过并给了 pass」，与 token 槽归属同义，且换会话成立。
代价：评审自报 pass 的信任面不变（今天也是评审自己写 §3）。

拒文（逐字）：

```
  ③ 批档 §3 未通过评审（§3 状态行 = <value>，须 = 评审通过）：重开该档补评审结论，或另起批次
batch: 收口链未跑完（closeout chain gate）— close refuses: §3 状态行 = <value>，须 = 评审通过（评审须真跑过并给 pass）；§2 / §4 / §6 各段须有内容或由 §1 声明不适用。Missing: <段表>. Nothing was written.
```

### 2.7 收口重锚按状态分流

`ledgerReanchorBatch` 的行集判据从「一律 `条件`」改成按**行状态**分流（`在途` 是本批的工作行，`待讨论`/`待设计` 是本批没动的行）：

| 行状态（收口时） | 收口后 | 复启句 | 回执 | 含义 |
|---|---|---|---|---|
| `在途` | `待核销` | 不写 | 点名 | 认领行未显式处置：机器兜底推进（父侧应在收口前处置——做完 ⇒ `待核销`，判定不做 ⇒ `已废弃`） |
| `待讨论` / `待设计` | `条件` | `原批 <批名> 已收口，须另起批次接手` | 点名 | **点火违规**：未认领却绑在本档。机器只落 `trigger`、状态留原值，`§2.4` 判据第 4 步当场报出（`resume_when` 现值非空 ⇒ 保留原值，句子追加 `evidence`） |
| `待核销` | 不动 | — | 不点名 | 已在结账位 |
| `已核销` / `已废弃` | 不动 | — | 不点名 | 终态 |

**认领行的终局（`§2.4`「认领即承诺」）**：本档行集里的认领行结算后只有 `已核销` ∥ `已废弃`（做完 ⇒ `待核销` → 勾销；判定不做 ⇒ `已废弃` + `evidence` 写判据）。「没做完 ⇒ 转 `条件` 等下一批」不是认领行的出路。

**先行排除（与状态分流并列、优先级更高）**：`trigger = 认账不排期` 的行 ⇒ **零触、不点名**，不论其 `status`。
理由与 `docs/core/design/LEDGER.md` §6.2 的 `认账不排期` 零触句（「**只锚 `条件`，不锚 `认账不排期`**」）同义：`认账不排期` = 行主人的政策判断，机器不代填、不代推。

**取代声明**：本节分流规则与 `docs/core/design/LEDGER.md` 下列条目**相反，按本节执行**——§6.2 取行句（「取本批未落行…自动改 `trigger=条件`」）· AC-M2-30 · §9 边界（「只锚 条件」）。
该三处按节 / AC 名定位（行号随该档增行漂移，不入引用）；收正归合并轮；`认账不排期` 零触一条与该档同义，保留。

**在册状态读数（实测）**：单源 = `docs/core/design/LEDGER.md` §3.5 四件表——本轮已收正：A / 归批门 / B / C **机制均已在盘**，C 的**规则面**（本节分流）未落。

实读：`thincoder-core/agent-tools/batch-lifecycle.mjs:503` / `:542` / `:601` 调 `reanchorOnClose`；`thincoder-core/ledger-cmd.mjs:395` `REANCHOR_STATUSES = ["待讨论","待设计","在途"]` · `:421` `ledgerReanchorBatch` 在盘。

该表 C 行「规则面未落」= 本节的分流规则；本档落地后由合并轮同步该行读数。

**兜底与点名**：收口时仍是 `在途` 的行 = 父侧未显式处置，重锚默认推进到 `待核销` 并在回执点名（判据、回执逐字 = `§2.11`）。

### 2.8 迁移边（点火与建档用哪两条）

`待讨论 → 在途` 与 `待设计 → 在途` 两条边**在册**——`ALLOWED_MIGRATIONS` 逐字：`"待讨论": ["待设计", "在途", "已废弃"]` · `"待设计": ["在途", "已废弃"]`（`thincoder-core/ledger-db.mjs:163`-`:164`，2026-10-28 实读）。本批工具零改，点火与建档都直接走这两条。

**建档的必要性**：建档事务（`§2.4`）的新建路径必须 INSERT 一行 `待讨论`（`在途` 被 DDL 咬合 CHECK 强制非空指针，不能先 INSERT `在途`）、落档后再迁 `在途` 并写指针——`待讨论 → 在途` 是那条路径的必经一步。R8 的验收用例是一条 `待讨论` 行 `update → 在途` 通过，消费方含建档路径本身。

**点火直跳 `在途`，不过 `待设计`**：`create` 接管 `待讨论` 行是「需求已确认、当场开工」这一个业务事件，拆成两次 UPDATE 才落地没有收益——中间那条边表达的是「已排设计」，不是点火发生的事。两条边并存不产生歧义：`task_book` 在不在，就是「有没有真的开批」。

### 2.9 提示词面单句（落点；实施轮落笔）

面判定的机器单源 = `agent/write-face.mjs`；提示词里已有三面分流表，需一句话把它钉到该单源上——否则模型按提示词、机器按代码，两套口径并存。

- **落点**：`thincoder-core/prompts/discipline-engineering.md:28` 的 `## Change-face routing (doc face ∥ engineering-tools face ∥ product-code face)` 表后，紧随一行。
- **字面**：`面判定机器单源 = thincoder-core/agent/write-face.mjs；本表与本行同义，冲突时以该档判据为准。`
- **范围**：只加这一行；三面表既有措辞零改。本档给落点与字面，落笔 = 实施轮 eng-coder。

### 2.10 面判据 = `classifyPath` + 三处修正（E10′）

`write-face.mjs` **复用 `classifyPath`**（`conventions.mjs:151`），不另写一套分类——两套面判据必然漂移。在它的结果上叠**三处修正**：

| # | 修正 | 判据 | 现状 → 本批 |
|---|---|---|---|
| ① | **构建产物目录放行** | 路径任一段 ∈ `BUILD_ARTIFACTS`（`node_modules` · `dist` · `build` · `coverage` · `.turbo` · `__pycache__` · `.next` · `.nuxt` · `.svelte-kit` · `bower_components`；单源 = `thincoder-core/skip-dirs.mjs`，`§2.12`） | 判 `code` ⇒ 拦 → **放行** |
| ② | 仓根以下 `test` / `tests` 段**拦** | 某段 = `test` ∥ `tests` ∧ 该段不是首段 | 判 `aux` ⇒ 放行 → **拦** |
| ③ | `scripts` 段**只在仓根** | 某段 = `scripts` ∧ 该段不是首段 ⇒ 拦 | 判 `aux` ⇒ 放行 → **拦** |

**修正①为什么只放构建产物、不放第三方目录**：`node_modules` / `dist` / `build` / `.next` 这类目录里的文件**没有一行是人写的**，拦它只逼人给清理产物的动作开批档。

而 `vendor` / `third_party` / `Pods` / `target` / `out` / `obj` / `.venv` / `venv` / `bin` 里**可能有人写的补丁**（`thincoder-cli/bin/**` 就是产品入口），放行它们会造出一条绕开批档的侧门——与本节末句「新目录能例外，锁就等于不存在」相抵。

两份名单用途不同：`SKIP_DIRS`（42 项）答「索引剪什么」，`BUILD_ARTIFACTS`（10 项）答「什么可以不开批档就写」。

| 序 | 面 | 结果 |
|---|---|---|
| 1 | 出辖（祖先链无 manifest） | 放行（`dispatch.mjs:107` 同口径，零改） |
| 2 | manifest `docRoot` 前缀命中 | 放行（文档面） |
| 3 | **仓根**首段 = `scripts` ∥ `test` ∥ `.thincoder` ∥ `.github`，或 = `package-lock.json` | 放行（工程工具面） |
| 4 | 任一段 ∈ `BUILD_ARTIFACTS`（精确段匹配，与 `memory/file-walk` 的折叠 / 前缀口径分开——面判不折叠） | 放行（修正①） |
| 5 | **仓根以下**任一段 = `scripts` ∥ `test` ∥ `tests` | **拦**（修正②③） |
| 6 | `classifyPath` = `doc` / `temp` / `aux` / `state` | 放行 |
| 7 | 其余（含 `code`） | **拦** |

**两个 `test/` 为什么不同待遇**（与需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md:667` 逐字对齐）：

- **仓根 `test/**`（放行）**：跨仓验证面，不属产品，改它不开批。
- **包内 `test` / `tests` 段（拦）**：与产品代码同生共死——改测试与改它守的代码在同一轮评审、同一份批档里。需求档 `:667` 逐字：产品代码面的 `test` 指**包内** `thincoder-*/test/**`。

**包内 `scripts/` 为什么拦**（与 `:666` 逐字对齐）：`thincoder-core/scripts/check-syntax.mjs` 随核发布，是产品的一部分；`aux` 的 `scripts` 段任意深度太宽，会把包内脚本漏出锁外。工具面的 `scripts/**` 只指仓根那一条。

**项目内新建业务目录不放行**：`thincoder-core/newthing/foo.mjs` 照拦。新目录能例外，锁就等于不存在。

**拒文**（逐字）：产品代码面与产品测试面同一条基串；测试面换首句与尾句。

```
write refused — no live batch record: a product-code write needs a live batch (record §1 = 进行中 ∧ its ledger row = 在途 ∧ that row's task_book points back to the record). Open one first: batch({action:"create", topic, source}) — it opens the ledger row in the same call. Nothing was written.
```

```
write refused — no live batch record: a product test file needs a live batch too (a test and the code it guards are reviewed in the same round). Open one first: batch({action:"create", topic, source}) — it opens the ledger row in the same call. Nothing was written.
```

**代价（有意）**：新建目录不建档就改不了；产品测试目录同样要批档。上一个目录先建批档，是这条锁要的摩擦。

**两个残留（写出来，不掩盖）**：

- 产品包内名为 `dist` / `build` / `coverage` 的子目录（如 `thincoder-core/dist/`）仍放行——它们是构建物，改它不算是改源码；代价 = 有人把源码放进去就能绕过锁，判据不区分这两种意图。
- 第三方目录（`vendor` / `third_party` / `target` / `out` / `obj`）**不放行**：它们可能携带手写补丁，宁可多开一份批档。

**不做什么**：`conventions.mjs` / `classifyPath` / `isCodePath` **本体**零改。`codePaths` 键保留，本批不动。

七个消费面逐个点过：`agent/dispatch.mjs:115`（**换判源**：`isCodePath` → `faceOf`，`§2.1`）· `agent/unbooked-pen.mjs:52` · `agent-tools/verify.mjs:193` · `agent-tools/advisor-settle.mjs:74` · `advisor/repos.mjs:122` / `:146` · `declaration.mjs:246`（此六处语义零改）。
### 2.11 收口前显式处置本批每一行（E11）

**判据**：收口时本批行集里**仍是 `在途`** 的行 = 父侧未显式处置。理由：做完了的处置动作就是把它 `update → 待核销`，做完的行不会留在 `在途`。这是档面 + 台账面的合并事实，零运行态。

**收口前父侧三步**（纪律，不是门）：① 按 `§2.4` 的读径读本批行集；② 逐行判：做完 ⇒ `update → 待核销`；判定「不用做」（前提不成立 / 已有它法）⇒ `update → 已废弃` + `evidence` 写判据——没有「没做完」这一档（`§2.4`「认领即承诺」）；③ 再收口。

**重锚只兜底**（叠在 `§2.7` 的分流上）：

| 行状态（收口时） | 谁判的 | 收口后 | 回执 |
|---|---|---|---|
| `待核销` | 父侧显式处置 | 不动 | 不点名 |
| `条件` / `已废弃` | 父侧显式处置 | 不动 | 不点名 |
| `在途` | **机器兜底** | `待核销` | 点名 |
| `待讨论` / `待设计` | **机器兜底** | 只落 `trigger = 条件` + 复启句，状态不动（点火违规，`§2.7`） | 点名 |

**为什么不拒**：收口路径要能走完（父侧已裁）。但「哪些是父侧判的、哪些是机器兜的」必须看得出来——回执点名即此。

回执逐字（`reanchorReceiptLine` 三行，空行不出）：

```
[ledger reanchor] 本批在途行 → 待核销 N 行：#12 「…」；#15 「…」
[ledger reanchor] 本批未动行 → 条件 M 行：#16 「…」
[ledger reanchor] 本批 N+M 行由重锚默认推进，父侧未显式处置：#12, #15, #16 —— 做完的请在收口前 update → 待核销，没做完的 update → 条件 / 已废弃
```

第三行只在 N+M > 0 时出现；N+M = 0 ⇒ 零该行（父侧全处置过，回执不噪）。

### 2.12 排除名单单源（E12 · 四份合一份，用户 2026-10-27 裁定「最好都合并」）

**现状：四份并存**（任务书初稿说三份，本轮实测四份；本批四份全合并）：

| # | 坐标 | 名称 | 项数 | 消费面 |
|---|---|---|---|---|
| 1 | `thincoder-core/index-discover.mjs:28` | `SKIP_DIRS`（导出） | 8 | 索引发现 `:98` / `:155` |
| 2 | `thincoder-core/tools/shared.mjs:27` | `IGNORED_DIRS`（导出） | 6 | `tools/search.mjs:9` / `:74` / `:172` |
| 3 | `thincoder-core/tools/tree.mjs:13` | `SKIP_DIRS`（**未导出**） | 13 | `tree.mjs:65` 自身 |
| 4 | `thincoder-core/memory/schema.mjs:48` | `SKIP_DIRS` + `SKIP_DIRS_FOLD`（`:63`）+ `SKIP_DIR_PREFIXES`（`:69`） | 39 | `memory/file-walk.mjs:13` 的 `isSkippedRelPath` |

**合并方向 = 以第 4 份为准取并集**：它是四份里最成熟的一份，三件另三份没做的事都已做对——`bin` 故意不列（`:59` 注释原话）、win32 大小写折叠（`Node_Modules` 仍要剪）、前缀族（`bazel-<workspace>` 无法枚举）。

**单源落点 = 新零依赖叶档 `thincoder-core/skip-dirs.mjs`**，三个导出、只有常量：

```js
export const SKIP_DIRS         // 39 项（第 4 份原值）+ .thincoder / .vs / .idea = 42 项——索引侧剪枝全集
export const SKIP_DIRS_FOLD    // 18 项，原样
export const SKIP_DIR_PREFIXES // ["bazel-"]
export const BUILD_ARTIFACTS   // 10 项：node_modules · dist · build · coverage · .turbo · __pycache__ · .next · .nuxt · .svelte-kit · bower_components——面判放行集（§2.10 修正①）
```

**两个集的关系**：`BUILD_ARTIFACTS` 是 `SKIP_DIRS` 的**子集**（逐项都在那 42 项里），且是其「无手写可能」的那一分支。
两份名单同档而不合一，因为问题不同：一个答「扫描时跳什么」，一个答「不开批档能写什么」。同一文件、同一次 import，不另建第二处真相。

**`SKIP_DIRS` 逐项（42 项）**：

- 产物 / 依赖（19）：`node_modules` · `.git` · `dist` · `build` · `.turbo` · `coverage` · `__pycache__` · `.venv` · `venv` · `target` · `.next` · `.nuxt` · `.svelte-kit` · `vendor` · `Pods` · `bower_components` · `third_party` · `obj` · `out`
- 用户 / 系统目录（14）：`AppData` · `Application Data` · `Desktop` · `Documents` · `Downloads` · `Music` · `Pictures` · `Videos` · `OneDrive` · `Contacts` · `Favorites` · `Links` · `Saved Games` · `Searches`
- 其他非代码目录（6）：`Library` · `go` · `Program Files` · `Program Files (x86)` · `Windows` · `$Recycle.Bin`
- 本批补（3）：`.thincoder` · `.vs` · `.idea`

**`SKIP_DIRS_FOLD`（18 项，`:63`–`:67` 原样）**：`node_modules` · `dist` · `build` · `.turbo` · `coverage` · `__pycache__` · `.venv` · `venv` · `target` · `.next` · `.nuxt` · `.svelte-kit` · `vendor` · `Pods` · `bower_components` · `third_party` · `obj` · `out`。`.git` 不在——它在 `file-walk` 的点段规则里（`:47` 注释）。

**四项处置（附理由，防后人删改）**：

| 项 | 处置 | 理由 |
|---|---|---|
| `.thincoder` | 进 `SKIP_DIRS`，**不单列** | 工具临时目录（browser profile / shots / 记忆库）；它就是产物目录，与 `dist` / `.next` 同类，没有第二个语义 |
| `.vs` / `.idea` | 进 `SKIP_DIRS` | IDE 配置目录：进索引是噪音，进锁是无谓摩擦 |
| 三者不进 `SKIP_DIRS_FOLD` | 折叠集**原样** | 折叠集为「工具在 win32 造出的混合大小写」而设；这三项由工具以小写创建，折叠无收益 |
| `bin` | **不列**（沿第 4 份） | `thincoder-cli/bin/` 有 2 个 `.mjs` 是 CLI 入口、产品代码（§13.5 的 `{src,bin,webview,test}/**`）；列入会把入口漏出锁外 |
| `turbo` | **并入 `.turbo`** | `tree.mjs:13` 的 `turbo`（无点）是笔误：另三份都是 `.turbo`，工作区递归查 `*turbo*` 零命中该目录 |

**一处必须写明的行为变更（用户裁定接受）**：`index-discover` 与 `tools/search` 原只剪 8 / 6 项，接单源后 `vendor` · `third_party` · `Pods` · `target` · `out` · `obj` · `venv` · `.nuxt` 等也落剪枝——索引面因此少收这些目录（多为第三方 / 生成物）。`memory/file-walk` 本就在剪它们，两个面从此同答案。

**只合并名单，不合并判定形状**：`memory/file-walk` 的 `isSkippedRelPath` 带折叠 + 前缀 + 点段规则；`index-discover` / `search` / `tree` 用精确段匹配。`skip-dirs.mjs` 只给名单，不给判定函数；另三处若也要折叠 / 前缀，是行为变更，不属 E12。

| 消费面 | 改法 |
|---|---|
| `memory/schema.mjs:48-69` | 删三处定义，改 `import` + **同名 re-export**（`memory.mjs:7` 的导出面逐字零变） |
| `index-discover.mjs:28` | 删本地 `const`，改 `import` + 同名再导出（既有 import 面零改） |
| `tools/shared.mjs:27` | 删 `IGNORED_DIRS`；`search.mjs` 三处改引 `SKIP_DIRS`（一词一物）。实施时 grep 确认无第四消费面；若有 ⇒ 保留同名再导出 |
| `tools/tree.mjs:13` | 删本地 `const`（未导出），改 `import` |
| `agent/write-face.mjs` | 引单源作修正①（`§2.10`，取 `BUILD_ARTIFACTS`）——写锁与索引对「什么算产物」只有一种答案 |

**为什么落叶档不落 `conventions.mjs`**：`memory/schema.mjs` 引 `node:sqlite` / `node:fs` / `node:path` / `../fts-text.mjs`，不是零依赖；`conventions.mjs` 的依赖链已被 `declaration.mjs` → `manifest.mjs` 拖着走。叶档零出边，四处引它不成环、不加重量。

### 2.13 重开回收（E13）

**收口的反面**：`§2.7` / `§2.11` 管「批档关 ⇒ 行离开工作位」；重开管「批档开 ⇒ 行回工作位」。两者不对称，两个载体就各说各话——台账说「待结账」，批档说「在干」。

**触发判据（写死，一处消费）**：台账联动**只**由重开合取触发，判据 = `batch-lifecycle.mjs:462` 已有的布尔 `reopen`：

```
seg === 1 ∧ depth0 ∧ ¬review ∧ stripDecorations(value) === 进行中 ∧ readBatchStatusLine(src) === "closed"
```

- **直接复用该布尔**，不重新推判据——两处各推一次必然漂移。
- **不触发的**：`status` 写 §2 / §3 / §5 状态行（`seg ≠ 1`）· `status` 写 §1 `进行中` 而前态 `open`（首建状态行 / 改括注；合取第四项不成立）· 评审实例写 §3（`review`）· 子代理写 §2 / §5（`depth0` 为假）· `close` ∥ `status → 已收口`（那是收口重锚，反方向，零触）。
- 一句话：**`status` 的其他一切用法零台账写**——尤其「`§3` 写 `评审通过` 不动台账」。

**两种重开，处置相反**（`rewriteAsReopen` 已区分，台账跟上）：

| 处境（重开时行的状态） | 重开后 | 理由 |
|---|---|---|
| `待核销`（收口后重开） | **→ `在途`** | 行回工作位，活继续在这一行上；`§2.2` 三合取当场成立 |
| `已核销`（核销后重开） | **不动** | 终态（`ledger-db.mjs:163` 唯一出边 = `已废弃`）；行上挂着结账证据，拉回来等于抹掉「结过账」 |
| 其余（`条件` / `待讨论` / `待设计` / `已废弃` / `在途`） | 不动、不点名 | 都不是本批的活跃工作行：没做的、撤回的、已在工作位的 |

**`待核销` 为什么必须回收**：不回收 ⇒ 重开后 §1 = `进行中` 但行仍 `待核销` ⇒ `§2.2` 第二条不成立 ⇒ 该档**不是活批档** ⇒ 产品码写全被写锁拒。人要干活先被自己的锁挡住，唯一出路是手改行——本该自动的一步。

**`已核销` 为什么不回收 + 必须点名**：核销是一次结账，终态不可逆；「批档重开、行已核销」的处置是**另立新行**（新档 `前情` 指回本档）——`#1827` 那次只能另立 `#1828` 就是这条。静默不回 = 父侧以为行被带回来了，下一步写产品码被写锁拒、回头才查；回执点名 = 当时一眼知道要另立行。

**写法**：台账写点单源 = `ledger-cmd.mjs` 新导出 `ledgerReclaimBatch({cwd, batch, boundary})`，与 `ledgerReanchorBatch`（`:421-454`）**同形对称**——同一行集 `resolveBatchRows`（行集判据单源）、`BEGIN IMMEDIATE` 单事务、失败 `ROLLBACK` 零行改、**不抛**（返回形 `failed`）。

- 返回形：`{batch, reclaimed:[{id,status,title}], unreclaimable:[{id,status,title}], failed:string|null}`。
- 逐行：`待核销` ⇒ `UPDATE items SET status='在途', executor=? WHERE id=?`——`trigger` / `resume_when` / `evidence` / `updated_at` **零触**（机器回收不是人工推进，行龄读数照旧；同 `ledgerReanchorBatch:418` 口径）；`executor` = **本会话 `sessionId`**（一次事务内取一次），因为行回工作位、而干活的就是重开这个会话——`docs/core/design/LEDGER.md` AC-M2-7（现盘 `:970`）「进入「在途」的迁移带 `executor` = 会话 `sessionId`」因而在机器径上也成立，判活面（同档 §7.3.1，现盘 `:912`）不会读到空属主。`已核销` ⇒ 入 `unreclaimable`；其余 ⇒ 跳过、不点名。
- **回退边与 AC-M2-7 的随动**：`docs/core/design/LEDGER.md:171` 现写「迁移表仅此两出边；六态**无回退边**」——本批开出第三条出边（`待核销 → 在途`），该句随之改为「回退边唯一一条 = `待核销 → 在途`（重开回收）」，AC-M2-7 的「回退清除」子句由此有了表内路径：回退进入在途 ⇒ `executor` 写本会话，同 §3.1 ① 式。收正归合并轮，本档已定语义。
- `ledger.mjs:157` 公共面同步再导出。

**位次与失败语义**：① `rewriteAsReopen` 写盘（`:476`）→ ② `await reclaimOnReopen(abs, cwd)` → ③ 回执拼 `reopenReceiptLine(reclaim)`。

- **失败不否决重开**：重开是从误冻结里出来的唯一通路，台账库忙不该把档锁死。失败 ⇒ 重开照成、回执点名 `failed` 原文 + 后果 + 出路。
- 后果点名（本节的坑）：行仍 `待核销` ⇒ 该档不是活批档，产品码写仍被写锁拒；出路 = 库恢复后 `ledger({action:"update", id, status:"在途"})`。
- **因此迁移边在册**：`ALLOWED_MIGRATIONS["待核销"]` 含 `在途`（`thincoder-core/ledger-db.mjs:166` 实读：`["已核销", "在途", "已废弃"]`）。没有它上面那句出路是假话（`ledgerUpdate` 会拒）。机器路径走直改、不查迁移表（同重锚）；这条边只为**人面**而设，是 `在途 → 待核销`（收口）的反向边。

**回执逐字**（`reopenReceiptLine`，空行不出；`failed` 非空时只出第三行，替代前两行）：

```
[ledger reopen] 本批待核销行 → 在途 N 行：#12 「…」；#15 「…」
[ledger reopen] 本批已核销行不可回收 M 行：#1827 「…」——已核销为终态，重开不回收；要继续做须另立新行（新档 §1「前情」指回本档）
[ledger reopen] 回收失败：<原始错误>——台账零改；行仍 待核销 的，该档不是活批档（写锁会拒产品码写），库恢复后 update → 在途
```

## 3. 受影响文件

**行数口径**：`readFileSync(p,'utf8').split('\n').length`（**含末尾空元素——比 `wc -l` 多 1**），取数时刻 2026-10-27 12:35——全表同一趟重取（先前的 625 / 172 / 454 等是更早一趟的读数，混了口径）。
与两档在册读数不同不矛盾：`docs/core/design/LEDGER.md:621` 的 556 · `docs/core/design/BATCH-RECORD.md:499` 的 506 是更早提交的读数，之后几轮又长了。

| 文件 | 现况 | 变化 |
|---|---|---|
| `thincoder-core/agent/write-face.mjs` | 新档 | 面判 = `classifyPath` + 三处修正（`§2.10`），引 `skip-dirs.mjs`；约 70 行 |
| `thincoder-core/skip-dirs.mjs` | 新档 | 排除名单单源（`SKIP_DIRS` 42 · `SKIP_DIRS_FOLD` 18 · `SKIP_DIR_PREFIXES`，`§2.12`），约 30 行 |
| `thincoder-core/index-discover.mjs` | 177 行 | 删本地 `SKIP_DIRS`、改引单源 + 同名再导出（行数不变） |
| `thincoder-core/tools/shared.mjs` | 474 行 | 删 `IGNORED_DIRS`（−1 行） |
| `thincoder-core/tools/search.mjs` | 249 行 | 三处 `IGNORED_DIRS` → `SKIP_DIRS`（改名，行数不变） |
| `thincoder-core/tools/tree.mjs` | 81 行 | 删本地 `SKIP_DIRS`、改引单源（−1 行） |
| `thincoder-core/agent/live-batch.mjs` | 新档 | 活批档判定（扫档 + 台账查询，`ledger` 动态 import——W8 契约），约 110 行 |
| `thincoder-core/agent/light-round.mjs` | 64 行 | 改为薄壳委托 `liveBatchOpen(agent, { roundMarker: ROUND_MARKER })`——导出名 / 签名不变，扫描体迁 `live-batch.mjs`（`§2.2`）：64 → ≈30 行（−34；目标容差 ±8） |
| `thincoder-core/agent/write-gate.mjs` | 173 行 | +`productCodeWriteConflict`，约 250 行 |
| `thincoder-core/agent/dispatch.mjs` | 275 行 | Phase 1 写面冲突块接第三道门（既有两道 = 跨批档写 · D5 冻结窗）+ `:115` 设计门换判源 `isCodePath` → `faceOf`（`§2.1`），约 285 行 |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 314 行 | 词表改 `评审通过` + 别名表，约 325 行 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 626 行 | 拆分 + 改链门 + 重开回收调点（`§2.13`；见下） |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 新档 | 从 lifecycle 拆出建档/台账接管事务，约 150 行 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 新档 | 从 lifecycle 拆出链门 + 单测档门 + 机检门调点 + 重锚回执三行（`§2.11`），约 95 行 |
| `thincoder-core/agent-tools/batch.mjs` | 345 行 | `ledger` 参数语义与描述面，约 360 行 |
| `thincoder-core/ledger-close-proof.mjs` | 81 行 | ③ 改读 §3，约 88 行 |
| `thincoder-core/ledger-db.mjs` | 272 行 | 迁移表 +2 边（`待讨论 → 在途` · `待核销 → 在途`），≈ +2 行 |
| `thincoder-core/ledger-cmd.mjs` | 455 行 | 重锚分流 + 兜底点名（`§2.11`，返回形加 `backstopped` 集）+ `ledgerReclaimBatch`（`§2.13`，与重锚同形），约 495 行 |
| `thincoder-core/prompts/discipline-engineering.md` | 358 行；面分流表在 `:28` | `§2.9` 的一句，表后 +1 行（无结构性改动，约 359 行） |
| `thincoder-core/prompts/persona-engineering.md` | 481 行 → 490 行（481 = 落笔前读数，非同表旧口径；490 = 现盘实数） | `§2.4` 提示词落点：生命周期第 1 条 1 行 → 10 行（+9 行），字面逐字引自 `§2.4` |
| `thincoder-core/ledger.mjs` | 161 行 | 公共面再导出 `ledgerReclaimBatch`（`:157` 同形，+1 词，≈ +1 行） |
| `thincoder-core/agent-tools/batch-reopen.mjs` | 新档 | 重开回收调点 + 回执两 / 三行（`§2.13`），约 55 行 |
| `thincoder-core/memory/schema.mjs` | 483 行 | 删三处名单定义、改引单源 + 同名 re-export（−22 行） |
| `thincoder-core/memory.mjs` | — | 零改（`:7` 的 `SKIP_DIRS` 导出面由 re-export 保住） |

**拆分预算（一本账，逐项相加 = 626）**：`batch-lifecycle.mjs` 626 行已越 500 硬线，本批按「建 / 关 / 开」切三刀：

| 去向 | 内容 | 行数 |
|---|---|---|
| 迁出 → `batch-ledger-bind.mjs`（新） | 建档与台账接管事务（`§2.4`） | 150 |
| 迁出 → `batch-closeout.mjs`（新） | 链门 + 单测档门 + 机检门调点 + 重锚回执三行（`§2.11`） | 95 |
| 迁出 → `batch-reopen.mjs`（新） | 重开回收调点 + 回执两 / 三行（`§2.13`） | 55 |
| 留下 | status / close / 消费面 | 626 − 300 = 326 |
| 本批新增 | close 径接 closeout 调点 ∧ 重开径接 reopen 调点 | +20 |

⇒ `batch-lifecycle.mjs` ≈ **346 行**（≤±30）；三新档 150 / 95 / 55。依赖仍单向：`skeleton ← closeout ← bind ← reopen ← lifecycle`。

**分舱（需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md:333`「一舱一单面 ≤15 档」）**：22 档按变更面分五舱，舱内不跳面，舱间按依赖排序。

| 舱 | 面 | 档 | 先后 |
|---|---|---|---|
| 1 | 面判与名单 | `skip-dirs.mjs`(新) · `agent/write-face.mjs`(新) · `index-discover.mjs` · `tools/shared.mjs` · `tools/search.mjs` · `tools/tree.mjs` · `memory/schema.mjs` | ① 先落（面判底座） |
| 2 | 台账面 | `ledger-db.mjs` · `ledger-cmd.mjs` · `ledger.mjs` · `ledger-close-proof.mjs` | ② |
| 3 | 批档工具面 | `batch-skeleton.mjs` · `batch.mjs` · `batch-ledger-bind.mjs`(新) · `batch-closeout.mjs`(新) · `batch-reopen.mjs`(新) · `batch-lifecycle.mjs` | ③ 依赖舱 ② |
| 4 | 写锁接线 | `agent/live-batch.mjs`(新) · `agent/light-round.mjs` · `agent/write-gate.mjs` · `agent/dispatch.mjs` | ④ 依赖舱 ① ∥ ② |
| 5 | 提示词面 | `thincoder-core/prompts/discipline-engineering.md` | ⑤ 字面引舱 ① 的档名 |

最大舱 = 7 档（舱 1），均不跨面。

**单测档（改动面，收口即删——零留存；零现有档——`thincoder-core/test/` 现只有 2 个目录项）**：

| 档 | 覆盖条目 | 预估 |
|---|---|---|
| `thincoder-core/test/write-face.test.mjs` | R2 · R12 · R14 · R16（面判六态 + 名单同值） | ~18 例 |
| `thincoder-core/test/live-batch.test.mjs` | R2 · R10（三合取 · 多活 · 读错 fail-closed） | ~8 例 |
| `thincoder-core/test/batch-bind.test.mjs` | R1 · R8（新建 / 接管 / 三拒 / 回滚） | ~10 例 |
| `thincoder-core/test/batch-gates.test.mjs` | R3 · R4 · R5 · R9 · R16（词表 · 段序 · 收口 · 别名） | ~12 例 |
| `thincoder-core/test/ledger-reanchor.test.mjs` | R7 · R11 · R13（分流 · 兜底点名 · 残值） | ~9 例 |
| `thincoder-core/test/ledger-reclaim.test.mjs` | R15（重开回收 · 已核销不回 · executor） | ~6 例 |

**改行预算**：新档 6（`skip-dirs` / `write-face` / `live-batch` / `batch-ledger-bind` / `batch-closeout` / `batch-reopen`）+ 改档 17（含 `agent/light-round.mjs` 与 `thincoder-core/prompts/persona-engineering.md`）+ 单测档 6（删）= 29 档落笔面。

## 4. 关键决策（含被拒）

1. **判据全部落到档面**——核销门 ③ 弃 token 槽、活批档弃内存 Map。理由见 `§2.6`；被拒方案 = 保留槽归属并加「槽缺失时降级」，那会把「没跑过评审」和「换了会话」混成一件事。
2. **§3 只留一个完成词**（`§2.5`）。被拒 = 两终态词。
3. **§5 加段序门**（`§2.6`）：append §5 前置 §3 = `评审通过`，无评审的批按 §1 的 `不适用` 声明放行。被拒 = 不加门（理由「轻通道会不可写」不成立——轻通道不写 §5）；被拒 = 顺带判 §2/§4（那两段在轻通道与修正轮里都可能晚于 §5）。
4. **重锚按行状态分流**（`§2.7`）。被拒 = 一律 `待核销`（把没做的行也记成做完）、一律 `条件`（现状，把做完的行记成没做）。
5. **存量 `已核销` 行的 trigger/resume_when 残值不动**：那两列在终态行上不参与任何决策（`overdue` 只判未决四态）。
   一次性改 1226 行是不可逆批量写、无业务收益；要做也是**单独一轮的 `scripts/` 清理**，不混进本批。
6. **迁移表开 `待讨论 → 在途`**（`§2.8`）。
7. **多活批档**：`findInFlightBatch` 的「≥2 ⇒ 拒」是**默认定位**的歧义门（D-BR21），不是禁止并存，零改；锁只问「存在否」。
8. **RTM 故事 2 退役**：原故事「未立项就写产品码：提醒一次，之后不再打断」的前提是「未立项也写得进去」；裁定 ⑤ 之后未立项写产品码**被拒**，前提消失，三行由故事 12 接替（`§9`）。被拒 = 保留三行并把断言改成「拒绝」——那会让故事名继续说反话。
9. **面判 = `classifyPath` + 三处修正**（`§2.10`）：复用既有分类器、只叠修正，避免两套判据漂移。被拒 = 在 `write-face.mjs` 另写一套分类（必漂移）；被拒 = 全局改 `classifyPath`（七面同翻，非本批条目）。
10. **收口兜底点名而不拒**（`§2.11`）：收口要能走完；拒门会与重锚自相矛盾。被拒 = 前置拒门（与 `§2.7` 冲突）。
11. **写锁工程模式限定**（`§2.3`）：普通模式「纪律自持」，挂门 = 改产品行为。被拒 = 两模式通用。
12. **产物/依赖目录放行**（`§2.10`、`§2.12`）：不放行则清理 `dist` 也要建批档。被拒 = 全 fail-closed 不放产物目录。
13. **两个 `test/` 不同待遇**（`§2.10`）：产品测试拦（与产品码同轮评审）、仓根集成测试放行（跨仓验证面）。被拒 = 一律拦（集成测试也要开批）；被拒 = 一律放行（产品测试漏出锁）。
14. **排除名单落零依赖叶档**（`§2.12`）：`tools/*` 引 `conventions.mjs` 会拖进声明装载链，且该档自家分类器不用这份名单。被拒 = 放 `conventions.mjs` 常量区。
15. **四份名单全合并、以第 4 份为准取并集**（用户裁定「最好都合并」）：`bin` 不列、`turbo` 并入 `.turbo`、补 `.thincoder` / `.vs` / `.idea`。被拒 = 分两批合（中间态仍两份同名名单，正是要消的漂移）。代价 = 索引面多剪 8 类，已写明并接受（`§2.12`）。
16. **`aux` 的 `scripts` / `test` / `tests` 段只在仓根生效**（`§2.10` 修正②③）：包内 `scripts/` = 产品代码面。被拒 = 任意深度放行（`thincoder-core/scripts/check-syntax.mjs` 漏出锁外）。
17. **重开回收只回 `待核销`**（`§2.13`）：`已核销` 不回收、回执点名；联动只由重开合取触发。被拒 = 全状态回收（抹掉一次结账）；被拒 = 静默不回（`#1827` 撞的就是静默）。
18. **两道门的模式范围不同**（`§2.6`）：写锁仅工程，§5 段序门与收口门两模式同判（普通模式出路 = `§1` 声明 §3 不适用）。这是**有意改普通模式行为**；被拒 = 两模式挂写锁（与 `docs/core/requirements/NORMAL-MODE.md:99`「纪律自持」相抵）；被拒 = 两道门都限工程（普通批档的链门含义则与工程不等）。
19. **收口门保留 §3 内容臂**（`§2.6`）：状态词臂是**加**在既有链门上，不替掉它。被拒 = 只判状态词（段空着也能过 = 门被放宽）。
20. **设计门面判据换到 `faceOf`**（`§2.3`）：与写锁共用一份判据。被拒 = 维持 `isCodePath`（产物目录的放行永远不可达，且两道门的面判会漂）。
21. **修正① 收窄到构建产物集**（`§2.10`）：被拒 = 用 42 项 `SKIP_DIRS` 做放行集（`vendor` / `third_party` / `target` / `out` / `obj` 里的手写补丁会绕开批档）；被拒 = 全不放（清理 `dist` 也要开批档）。
22. **接管不直写 SQL，且落档先于指针写入**（`§2.4`）：走 `applyRowUpdate` 同一函数体（`tx` 形参），批档在指针 UPDATE 之前落盘。被拒 = 在建档处直写 `UPDATE`（迁移表两条新边 / 写门 / executor 语义要逐条重做）；被拒 = 先写指针后落档（写门两形都判「解析出的档在盘」，必被自己的门拒）。

23. **一本批档的账 = 指回本档的行集**（`§2.4`）：覆盖几条就绑几条；认领不新开台账行，撤回只许用于重复登记（同一件债记了两次）。

    理由：需求面 `docs/core/requirements/ENGINEERING-MODE-V2.md:718` 本身就是行集模型（一点一账 + 每条覆盖行绑回本档）——同一件事两套账，必然出现「批里已结、账上还开着」。

    被拒 = 一本一行、其余 `已废弃` 并入并 `evidence` 记「并入 #N」：① 做完的点被记成撤回（`已废弃` 的语义是撤回，`§2.4`）；② 攒批本就是多点进一批（`thincoder-core/prompts/persona-engineering.md:385`），点与执行载体的单位不同。代价 = 点火多写 N−1 条 `update`（与并入路径同量）。

## 5. 验收对照

每条回到批档 `§2` 的批次条目（R1–R17）；机检判据如下：

| 条目 | 判据（可机检） |
|---|---|
| R1 建档=建台账 | 不传 `ledger` 建一档 ⇒ 台账多一行 `在途` 且 `task_book` = 该档；传已存在 `待讨论` 号 ⇒ 该行变 `在途`；传 `已核销` 号 ⇒ 拒且档未落盘、行零改（终态判据；事务内步序 = `§2.4`） |
| R2 写锁 | **两态分明**（`§2.3` 表）：① 无活设计槽 · 无活批档 ⇒ 旧设计门拒（面判据已换 = 产物目录不再被它拦）；② 有活设计槽 · 无活批档 ⇒ 拒，拒文逐字 = `§2.3` 串；有活批档 + 活设计槽 ⇒ 写入；③ 文档面（docRoot 内）· 仓根 `scripts/**` · `.thincoder/**` 照写；④ 仓根 `test/integration/*.test.mjs` ⇒ 放行（工程工具面） |
| R3 §3 词表 | `status` §3 值 `评审通过` ⇒ 通过；值 `评审完成` ⇒ 拒（词表外）；旧档读侧 `评审完成` ⇒ 等义 pass |
| R4 §5 段序门 | `§3` 无 `评审通过` 时 `append §5` ⇒ 拒，拒文逐字 = `§2.6` 的 `R-G2` 串；`§3` pass 后追加照写；`§1` 声明 §3 不适用 ⇒ 照写 |
| R5 收口门 | `§3` 无 pass 时 `close` ⇒ 拒，拒文含 `§3 状态行 = <value>`；既有四段内容臂**照判**（`§2`/`§4`/`§6` 有内容 ∥ §1 声明不适用）；收口后本批零 `在途` 行（重锚落 `待核销`） |
| R6 核销门去运行态 | 换会话（槽内无归属）核销一条合格行 ⇒ 通过；`§3` 非 pass 的档 ⇒ 拒，③ 串逐字 |
| R7 重锚分流 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 分别落 `待核销` / `条件`（后者 = 点火违规兜底，`§2.7`），回执两行 |
| R8 迁移表 | `update` 一条 `待讨论` 行 → `在途` ⇒ 通过 |
| R9 存量不回填 | 盘上带 `评审完成` 的存量档字节零改、读侧等义 pass；写 `评审完成` ⇒ 词表外拒 |
| R10 多活批档 | 造两档同活 ⇒ 两次 `create` 皆成立、写锁放行；`status` 缺省定位对两档照拒（歧义门零改） |
| R11 存量残值不动 | `query` 全表计数与本批前一致（1226 行残值不变） |
| R12 面判据三处修正 | 带活设计槽时：`node_modules/pkg/x.mjs` · `thincoder-cli/dist/out.mjs` ⇒ 放行；`thincoder-core/vendor/x.mjs` · `thincoder-core/target/x.mjs` ⇒ 拒（不在 `BUILD_ARTIFACTS`）；`thincoder-vscode/test/x.test.mjs` ⇒ 拒；`test/integration/x.test.mjs` ⇒ 放行；`thincoder-core/newthing/foo.mjs` ⇒ 拒。无设计槽时：上述「放行」行由旧门放行、上述「拒」行由旧门拒（面判据同源） |
| R13 收口显式处置 | 收口前 1 行 `在途` + 1 行 `待讨论` + 1 行父侧已置 `待核销` ⇒ 前两行被重锚（`待核销` / `条件`），回执点名「2 行由重锚默认推进」；第三行零触、不点名 |
| R14 排除名单单源 | `skip-dirs.mjs` 一处定义（`SKIP_DIRS` 42 项 · `SKIP_DIRS_FOLD` 18 项 · 前缀 `bazel-`）；四名单消费面（`index-discover` · `search` · `tree` · `memory/file-walk`）与写锁 `write-face` 同值；含 `.turbo` / `.thincoder` / `.vs` / `.idea`，不含 `bin` · 不含 `turbo` |
| R15 重开回收 | 收口后重开（行 `待核销`）⇒ 行 `在途`、回执第一行点名；核销后重开（行 `已核销`）⇒ 行零改、回执第二行逐 id 点名；`status` 写 §3 `评审通过` ⇒ 台账零写 |
| R16 `aux` 收紧 | `thincoder-core/scripts/s.mjs` ⇒ 拒；`thincoder-*/tests/x` ⇒ 拒；仓根 `scripts/x.mjs` · `test/integration/x.test.mjs` ⇒ 放行 |
| R17 一本 ↔ 行集 | 覆盖 3 条旧账建一档 ⇒ 三条 `task_book` 全解析回本档、§1 `覆盖账` 含三条 + 接管那条；`create` 不带 `ledger` ⇒ 自开一条、指针回本档、§1 写 `覆盖账 = #<自开号>`（判据第 3 步两边相等，不再判孤儿）；覆盖行已 `在途` 指别档 ⇒ 停、不绑；收口并结算后本档行集只剩 `已核销` / `已废弃`；重复登记撤回时 `evidence` 点名吸收行（`§2.4` 四步判据逐条可跑） |

## 6. 用例表

| 类 | 输入 | 期望 |
|---|---|---|
| 正常 | `create{topic,source}` 无 `ledger` | 档落盘 + 行 `在途` + 档头 `#N` |
| 正常 | `create{ledger:"#1830"}` 且该行 `待讨论` | 行 → `在途`、`task_book` = 本档 |
| 边界 | 两档同活 | 皆成立；锁放行 |
| 边界 | 行 `在途` 但 `task_book` 指另一档 | 拒（`R-C2`） |
| 错误 | 行号不存在 / 已归档 | 拒（`R-C1` / `R-C3`），档不落盘 |
| 错误 | 写 `thincoder-core/x.mjs` 无活批档 | 拒（`§2.3` 串），文件零改 |
| 错误 | 台账库不可开 | 拒，拒文带原始错误 |
| 错误 | `close` 时 `§3` = `进行中` | 拒，点名 §3 |
| 错误 | 核销 `§3` 非 pass 的档 | 拒（`R-L3`） |
| 错误 | 有活设计槽、无活批档写 `thincoder-core/vendor/` 或 `target/` 下的 `.mjs` | 拒（不在 `BUILD_ARTIFACTS`——第三方目录可能带手写补丁） |
| 错误 | `§3` = `进行中` 时 `append §5` | 拒（`R-G2` 串），§5 字节不变 |
| 边界 | `§1` 声明 `> 不适用：§3` 的批 `append §5` | 写入（无评审的批不受段序门拦） |
| 边界 | `§3` 已 pass 的修正轮 `append §5` | 写入 |
| 错误 | 无活批档写 `thincoder-vscode/test/x.test.mjs` | 拒（产品测试面串），字节零改 |
| 边界 | 无活批档写 `test/integration/x.test.mjs` | 放行（工程工具面） |
| 错误 | 无活批档写 `thincoder-core/newthing/foo.mjs` | 拒（新目录不例外） |
| 边界 | 写 `node_modules/pkg/x.mjs` · `thincoder-cli/dist/out.mjs` | 放行（`BUILD_ARTIFACTS` 段命中） |
| 边界 | 写项目外路径（祖先链无 manifest） | 放行（出辖） |
| 错误 | 无活批档写 `thincoder-core/scripts/s.mjs` | 拒（包内 `scripts/` 是产品代码面——修正③） |
| 正常 | 收口含 1 `在途` + 1 `待讨论` + 1 已处置 `待核销` | 前两行重锚并点名，第三行零触 |
| 边界 | 无活批档写仓根 `scripts/x.mjs` | 放行（工程工具面） |
| 正常 | 收口后重开（行 `待核销`） | 行 → `在途`；回执第一行点名该行 |
| 错误 | 核销后重开（行 `已核销`） | 行零改；回执第二行逐 id 点名「已核销为终态，重开不回收」 |
| 边界 | 一行 `待核销` + 一行 `已核销`，重开 | 前者 → `在途`、后者零改；两行回执各一行 |
| 正常 | 覆盖 3 条旧账建一档（带 `ledger` 接管 1 条 + 另 2 条绑回） | 3 行 `task_book` 全指回本档；收口后 3 行离开 `在途` |
| 边界 | 新债建一档（不带 `ledger`） | 自开 1 行 `在途`、指针回本档；§1 写 `覆盖账 = #<自开号>`；判据四步全过 |
| 边界 | 覆盖行已 `在途` 且指针指另一档 | 停：不绑、不认领、§1 `覆盖账` 不收这一行（拿它当 `ledger` 号则拒，`R-C2`） |
| 错误 | 覆盖的旧账一条也没绑（`#1912` 现场） | 判据第 3 步报差集：`覆盖账` 有 id、本档行集无此 id |
| 边界 | 两行记同一件债 | 冗余行 `已废弃`、`evidence` 点名吸收行；判据第 2 步放行 |

## 7. 边界（本批不做）

- 不做存量档回填（`§3` 词面 / 档头台账行）：已冻结档字节不动。
- 不改 `已核销` 行残值（`§4` 第 5 条）。
- 不动 `findInFlightBatch` 的歧义门、不动冻结门、不动 D5 冻结窗。
- 不动写面既有两道（跨批档写 · D5 冻结窗）；锁与它们并列挂同一块（`dispatch.mjs:142-165`）。
- 提示词面本批**只加一句**（落点与字面 = `§2.9`），由实施轮 eng-coder 落笔；三面表既有措辞零改。
- 本档不写 `test/**`；RTM 改行与用例由实施轮按 `§9` 的 delta 落。**两个 `test/` 不同面**：仓根 `test/**` 属工程工具面（改它不开批）；产品包内 `test` / `tests` 段属产品代码面（`§2.10` 修正②）。
- **层别纪律（写档做法）**：本档与批档 `§2` 的一切档引用一律带层别全路径（`docs/core/design/` ∥ `docs/core/requirements/` 前缀），不写裸档名。
  理由：`docs/core/design/ENGINEERING-MODE-V2.md` 与 `docs/core/requirements/ENGINEERING-MODE-V2.md` 同名不同层，裸档名解析到哪层不确定；
  本批修正轮就是这么查错了层（按设计层解析、该层无 §13.5），面分类判据因此错了一轮。
- **不动 `conventions.mjs` / `classifyPath` / `isCodePath` 本体**（`§2.10`）：`agent/dispatch.mjs:115` 换判源（`isCodePath` → `faceOf`，`§2.1`），其余六个消费面语义本批零改。
- **不删 manifest `codePaths` 键**、不改 `manifest-schema.mjs` 与 manifest 工具可写键。
- **排除名单只合并名单本身**（`§2.12`）：单源 = 第 4 份全量 ∪ `.thincoder` / `.vs` / `.idea`；判定函数不合并（`isSkippedRelPath` 的折叠 / 前缀留在原地）。
- **写锁只在工程模式生效**（`§2.3`）；普通模式零改。
- **重开回收只回 `待核销`**（`§2.13`）：`已核销` 是终态，重开不回收、只点名；不做「核销撤回」。
- **`status` 的台账联动只由重开合取触发**（`§2.13`）；写 §2 / §3 / §5 状态行零台账写。
- **不改台账工具行为**（`§2.4` 两条情形全用既有语义：`create` 带 / 不带 `ledger` · `update` 的 `待讨论 → 在途` 边 · `close` 撤回）；**不加机械门**（判据是自检）；**不自动绑定**（绑回本档是主 agent 的点火动作，不是工具的副作用）。
- **重复登记撤回按既定边界保留**：台账上暂无「两行同债」的实读样本，本节只判这个形本身，不为它加查证动作。
- **回执文案本批不动**：`§2.11` 第三行的建议句里仍写「没做完的 `update → 条件`」，与 `§2.4`「认领即承诺」不一致；改文案属工具面，本批零改，判据以 `§2.7` 为准。

## 8. UI / 交互决策

无 UI。交互面 = 工具回执与拒文，全部在 `§2.3`–`§2.7` 逐字给出，无未定项。
「回执要不要给 remediy（恢复动作）」——给了：每条拒文末句都是下一步怎么做（建批档 / 重开补评审 / 换行号）。

## 9. 集成测试设计（RTM delta）

`test/RTM.md` 已读：CLI 端故事 1–11 共 **37 行**；VS Code / Desktop 端尚无集成用例。三问逐条作答。

**破的行（现有断言被本批改掉 ⇒ 改写 ∥ 退役）**

| 行 | 原断言 | 本批之后 |
|---|---|---|
| 2-1 / 2-2 / 2-3（`test/RTM.md:27`–`:29`） | 未立项写产品源文件 ⇒ **文件确实写入**，只多一行 `[pen check]`，第二次不再提示 | 被裁定 ⑤ 取代：无活批档写产品码 ⇒ **拒**，文件零改。故事节 2 退役，由新故事 12 接替（决策 8） |
| 10-3（`test/RTM.md:120`） | 核销门 ③ 判「槽内有归属」：已收口但槽内无归属 ⇒ 拒 | ③ 改判档面：已收口 ∧ `§3` = `评审通过` ⇒ **通过**（槽内无归属也通过）；拒因改列为「`§3` 非 pass」 |

**冗余的行**：2-1 / 2-2 / 2-3（前提被取代，见上表）。其余 34 行无冗余。

**缺的行（编号先定在 RTM，再写用例标题 `test('<编号> …')`）**

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 服务条目 |
|---|---|---|---|
| 12-1 | `write` 工具 ↔ 面判定 + 活批档判定 | 无活批档写 `thincoder-core/agent/x.mjs` ⇒ 拒，文件零改 | R2 |
| 12-2 | 同上 | 同一会话写 docRoot 内 `.md` 与 `scripts/*.mjs` ⇒ 照写 | R2 |
| 12-3 | 活批档判定 ↔ 台账库 | 两个活批档并存 ⇒ 产品码照写（锁只问存在否） | R10 · R2 |
| 12-4 | 活批档判定 ↔ 台账库 | 台账库不可读 ⇒ 拒，拒文带原始错误 | R2 |
| 13-1 | `batch create` ↔ 台账事务 | 不传 `ledger` 建一档 ⇒ 台账 +1 行 `在途`、`task_book` = 该档、档头写真实 `#N`（终态；事务步序与残留态见 `§2.4`） | R1 |
| 13-2 | 同上 | 传 `待讨论` 号 ⇒ 该行 `在途` + 指针回填 | R1 · R8 |
| 13-3 | 同上 | 传 `已核销` 号 ⇒ 拒，档零落盘、行零改 | R1 |
| 14-1 | `batch append §5` ↔ `§3` 状态行 | `§3` = `进行中` ⇒ 拒；`§3` = `评审通过` ⇒ 写入 | R4 |
| 14-2 | `batch close` ↔ 链门 | `§3` 非 pass ⇒ 拒，回执含 `§3 状态行 = <value>`；`§1` 状态行字节不变 | R5 |
| 14-3 | `ledger close` ↔ 档面 `§3` | 换会话（槽内无归属）核销合格行 ⇒ 通过 | R6 |
| 14-4 | `batch close` ↔ 台账重锚 | 本批 1 行 `在途` + 1 行 `待讨论` ⇒ 分别 `待核销` / `条件`，回执两行 | R7 |
| 12-5 | `write` 工具 ↔ 面判定 + `BUILD_ARTIFACTS` | 无活批档写 `thincoder-vscode/test/x.test.mjs` ⇒ 拒；写 `node_modules/…` · `thincoder-cli/dist/…` ⇒ 放行；写 `test/integration/…` ⇒ 放行 | R12 · R14 |
| 12-6 | `search` / 索引发现 ↔ 排除名单单源 | 在 `thincoder-core/vendor/x.mjs` 放一份可搜索文本 ⇒ `search` 不再命中（名单合并后剪枝面扩大）；`node_modules` / `dist` 下的文件同样不进索引 | R14 |
| 14-5 | `batch close` ↔ 台账重锚兜底 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 回执点名「2 行由重锚默认推进」 | R13 |
| 14-6 | `batch status` 重开 ↔ 台账回收 | 收口后重开（行 `待核销`）⇒ 行回 `在途`、回执点名 1 行；产品码写当场可写 | R15 |
| 14-7 | 同上 | 核销后重开（行 `已核销`）⇒ 行仍 `已核销`，回执逐 id 点名「不可回收」；两种重开并存 ⇒ 两行回执各一行 | R15 |

**进入口**：全部从父侧工具面进（`write` / `batch` / `ledger`）——用户走的就是这条路；无一条从内部函数进。

**落法**：改行与用例由实施轮落（本档不改 `test/`）：先把 12/13/14 三个故事节与编号写进 RTM，再写用例标题。

**预算**：37 行 − 退役 3 + 新增 **16** = **50 行**，在 ≈50–100 窗的 ≤100 上限内。

**本批增量（一本 ↔ 行集，`§2.4`）的 RTM 答复 = 零 delta**：工具行为一条未改，本批改的是主 agent 点火那一步的判据、提示词，与收口分流的规则面（`§2.7`），没有任何业务可观察结果的断言被改写或新增。这不是「跨组件但无用户可见入口」的豁免，而是**没有可机检的业务结果**——绑没绑对由 `§2.4` 的四步判据读台账与 §1 判，不由集成用例判。
