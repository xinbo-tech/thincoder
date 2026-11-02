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

**档归属**：跨链契约（一本 ↔ 行集 `§2.4` · 活批档 `§2.2` · 五道门 `§2.6` · 重锚分流 `§2.7` · 重开回收 `§2.13`）与 `§3` 状态行词表（`§2.5`——含打回即重置）由本档拥有。
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
| `#N` | `待核销` | 拒（`R-C4`）——已结账待勾销的行不构成本批的活 |
| `#N` | `已核销` / `已废弃` | 拒（`R-C3`） |
| 不传 | — | 新建一行：`在途` · `kind` = `tech_todo`（`requirement` 由 `board` 决定）· `title` = `topic` · `task_book` = 本档 · `trigger` = `归批` |

**`R-C4` 为什么另立、不并入 `R-C3`**：两条拒的出路不同。

`R-C3` 的行在**终态**——重开回收也不回它（`§2.13`），出路只有另立新行；`待核销` 的行还在**结账位**（`§2.7` 第四列），出路有两条：先勾销它，或由持有它的批档重开回收把它带回 `在途`（`§2.13`）。并成一句拒文，父侧读到拒时不知道该走哪条。

实现面同形：`thincoder-core/ledger-write-ops.mjs:192` `bindArchivedError` 与同档 `:194` `bindSettledError` 本就是两个独立字面（各在 `:308` / `:309` 抛出）。

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
| `待核销` | 停：已结账待勾销，不构成本批的活（`create` 对 `待核销` 号同拒 = `R-C4`，`§2.4` 建档表）；先核销它，或由持有它的批档重开回收（`§2.13`） |
| `已核销` / `已废弃` | 不列入 `覆盖账`——**重新开账 = 另立新行**：旧行已在终态（不可绑，`R-C3`），本批做同一件事时 `create` 不带 `ledger` 自开一行，`覆盖账` 只写这个新号，§1 写一行理由说明为何重新开账；旧行原样留着（`evidence` 记着上一次的结账理由，不回收——`§2.13`）。与铁律「本档不新开第二条台账行」不冲突：铁律禁的是**同一件债在同一时刻挂两条未决行**，另立新行的前提正是旧行已离开未决面 |

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

- **判据管不到的一面（如实写）**：它只保证「登记了的没漏」，不保证「漏了没登记」——`覆盖账` 由人写，少写一条查不出来。那一面归点火前的台账扫描（`thincoder-core/prompts/persona-engineering.md` §Ledger 的 `Batch design` 条）与行龄读数（`aged`），不由本节兜。

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
batch: ledger entry #<N> is 待核销 — a row already settled to 待核销 cannot carry a new batch record (reopen the record that owns it with batch status, or open a new row instead). Nothing was written.
```

### 2.5 §3 状态行词表（评审结论进状态机）

最终形态：`3: { open: "进行中", done: "评审通过" }`——**只有 pass 叫完成**，不设第三态词。

- `changes-required` 不写状态词：该轮评审结论落在 `§3` 段体（`### 轮次 N` 块），状态行留 `进行中`——「评审没通过」= 评审未完成，这是真话。（工具被动重置时携 `（第 N 轮打回）` 括注，见下。）

**打回即重置（工具被动写，2026-10-28）**：状态行由工具改，不靠评审记得。

触发 = 三合取：① 一笔 `append §3`；② 这一笔的文本带打回裁定行；③ 写这一笔之前 `§3` 状态行 = `评审通过`。

② 的判据单源 = `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `VERDICT_CHANGES_LINE`——`VERDICT: changes-required` / `VERDICT: 不通过` / `VERDICT: 需修改` 与 `结论：…` 同义形的整行判据，与设计凭证裁定闸读同一条正则。

**四条锚同源**：`_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` / `VERDICT_PASS_LINE` 四条导出全住 `thincoder-core/agent-tools/batch-skeleton.mjs`（`_V_PRE` 起的那一组）。写入面（打回重置 ∥ 通过置位）与签发面（`verdictGateFailure`）∥ `§5` 写入门同读这四条。

`thincoder-core/agent-tools/design-token.mjs` 只 import 后原样再导出（`export { VERDICT_PASS_LINE }`），并改调 `verdictGapOf` 取裁定读数（`§2.6.1`）。

`thincoder-core/agent-tools/batch-closeout.mjs` 的 `lastRoundVerdictGap` 同改调 `verdictGapOf`，因此**不再 import 两条裁定锚**——它的 import 面随判据单源而变，不是零改。

生成区 `docs/core/design/API-CONTRACT.md` 随生成器刷新，不手改。

- **锚形只此一份**：不复制到第二档，也不由两档各写一遍（`design-token.mjs` 已 import 骨架档，无循环）。

三条全中 ⇒ 同一笔写盘里两处落笔：状态行 → `进行中（第 N 轮打回）`；本轮块首戳一行留痕 `> 状态行重置：第 N 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · <YYYY-MM-DD>`。

- **重置不等于清空**：留痕行把「上一轮 pass 被这一轮推翻」写在档里——状态行只余 `进行中`，不写留痕则读档的人会以为从没评过。
- **只走既有写面**：状态行仍由 `updateSectionStatusLine` 单行改写（同档 `:164`），不新开第二条写路径；留痕行是本轮块内的段体内容，与工具戳的 `### 轮次 N（评审子代理）` 同面，append-only 不变。
- **③ 把「上一轮 pass」写死在内**：`§3` 已是 `进行中` ∥ 无状态行 ⇒ 零写、零留痕（本来就写着「评审未完成」，重置无事可做；本轮块本身即证据）。顺序交接不误伤：未打回的批（首轮 pass）不触发。
- **为什么必须机械**：状态行是下游 `§5` 写入门（`thincoder-core/agent-tools/batch-closeout.mjs:105`）∥ 收口门 ∥ 核销门③的唯一判据面。靠评审「记得把状态行改回去」是一条纪律，而纪律在打回那一轮最容易漏；写成工具条件，漏不掉。**第四处读它的是签发面**：`thincoder-core/agent-tools/design-token.mjs` 的 §3 落地门判据 2——读 `readSectionStatusWord(batchSrc, 3)` 那处，拒因 `status-not-passed`；打回后的 pass 那一轮，字由工具置回 `评审通过`（本节「通过即置位」），判据 2 读到的就是这一轮的字；字不到位即拒签。
- **修前实读（敞口本身）**：`§3` 状态行 = `评审通过` ∧ `§3` 已有轮次块含 `VERDICT: changes-required` ⇒ 直调 `assertSectionFiveGate` 喂此夹具**不抛**（放行——该函数放行时不返回值也不打印，「不抛」就是它唯一的可观察面）；同刻 `readSectionStatusWord(src, 3)` 返回 `评审通过`。重置落地后同夹具读到 `进行中`，门遂拒。
- **判 `§3` 结论只认状态行那一行**：留痕行逐字写「上一轮状态行 = 评审通过」，轮次块正文也可能出现词表关键字——`**状态行**：` 前缀之外的关键字不构成结论；前缀行本身也只在段头区内才算结论（定位面见本节「段级状态行的定位面」，读面只有那一个取值区）。
- **留痕行不经文档机检门**：门位在 `insertIntoSection` 之前（`thincoder-core/agent-tools/batch.mjs:243`，判集只含评审正文 `pending.body`），留痕行插在其后 ⇒ 不进门判集；门判的仍是评审正文本身。
- **触发面不扩（理由）**：这一笔连裁定行都没有（设计凭证侧判 `no-pass-line`）⇒ 本重置不触发，`§3` 仍留上一轮的 `评审通过`。触发面**不**扩到「写 `§3` 即重置」——工具手上只有文本，无从区分「打回」与「补记一段散文」，扩面就是按意图猜，猜错还改写了写者刚落的档。
- **堵这个洞的拒面（判据 / 拒文已定，代码随本批落）**：`§5` 写入门不再只看状态词，还要求 `§3` **最近一轮轮次块自己携 pass 裁定**（判据 / 拒文 = `§2.6`）。所以「写 `§3` 要带裁定行」成为任何一笔的必做，两种情形同一条处置。
- **被拒方案（两终态词 `评审通过` / `评审须修改`）**：代价 = 每个读侧多一态（`readSectionStatusWord` / 链门 / `batch/list` / 词表并集四处）、
  拒文多一支、且 `须修改` 与 `进行中` 对「评审还在跑」不可区分；收益（分清「没跑」与「跑了没过」）`§3` 段体的轮次块已经给了。故不取。
- **存量档兼容**：旧字面 `评审完成` 读侧等义于 `评审通过`（`readSectionStatusWord` 一张别名表，逐条注退场条件 = 盘上再无该字面）。
  存量档**不回填**（已冻结档不改字节）。
- 冻结门零变：`gate` 只读 `§1`。

**通过即置位（工具被动写）**：与「打回即重置」对称的另一半——一笔 `append §3` 的正文只携 pass 裁定行（**不含**打回裁定行）且写前 `§3` 状态行 ≠ `评审通过` ⇒ 同一笔写盘把段级状态行置成 `评审通过`。

- **三合取**：① 本笔写 §3；② 净化后正文命中 `VERDICT_PASS_LINE` **且不命中** `VERDICT_CHANGES_LINE`；③ 写这一笔之前 `readSectionStatusWord(src, 3) !== STATUS_WORDS[3].done`（取值区 = 段头区，与写面同一条定位面；`region` 实参随收窄退场）。三条全中 ⇒ 返回 `{ roundN, statusValue }`（`statusValue` 取 `STATUS_WORDS[3].done`，不写死字面）。
- **③ 的方向与打回那条相反**：打回要「上一轮 = pass」（推翻一条已落的字），通过要「当前 ≠ pass」（补上一条没落的字）；两条的 ③ 因此天然互斥，同一笔不会都触发。
- **写前无 §3 状态行**（`readSectionStatusWord` 返 `null`——骨架只给 §2 产状态行）⇒ ③ 成立，`updateSectionStatusLine` 按既有插入形在段头后补出该行。这是新批档首次 pass 的常态形状，不是边角。
- **不写留痕行**：置位的理由是「块自己说了 pass」，同一笔落进 §3 的轮次块就是那条记录，再写一行等于把块的内容抄第二遍。打回方向要留痕，是因为重置**抹掉**了一条已落的 pass，而抹掉这件事没有第二处记录。
- **只走既有写面**：仍是 `updateSectionStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs:164`）单行改写、仍是一次 `writeFileSync`——与打回那条同一条路径，不新开第二条。
- **段级状态行的定位面（单源一句）**：段级状态行 = **段头区**内那一行 `**状态行**：`——段头区 = `## §N` 标题行之后、下一个标题行（任意 `##` / `###` / `####` 起的行）之前。
  - **写**：区内有该行 ⇒ 原位单行改写；区内没有 ⇒ 在段头后补出（插入形沿用既有，`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `updateSectionStatusLine`）。**读**（两条计划的 ③ ∥ 六处门面 ∥ `batch/list`）= 同一条定位面。区外——轮次块正文里引述的 `**状态行**：…` 行——既不被改写，也不构成结论。
  - **区内多行 ⇒ 取区内首命中**：读面 `lines.map((line) => STATUS_LINE_RE.exec(line)).find(Boolean)`（`thincoder-core/agent-tools/batch-skeleton.mjs:202`），写面 `parts.findIndex(...)` 也只认区内第一行（`:176`）⇒ 一条不可解析的首行会把后面的行遮住，该段对所有读面读成 `null`。
    已登记的实例（形状，不点名档）：一个骨架原形批档的 `§2` 段头区里先有占位行 `**状态行**：（…）`、其后才是结论行 ⇒ 该段对所有读面读成 `null`；同形全仓计数未量。
  - **区界判据 = `^#{2,}`**（`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `ZONE_END_RE`，写面与触发读面同读这一条）：认到 `####` 及更深的子标题为止。比「下一个 `##` / `###`」宽一档，方向是**偏安全**——段级状态行由工具插在 `## §N` 标题正下方，任何级别的子标题都在它之后，所以多认一层子标题只会让区更早结束，不会把正文行当成段级状态行。
  - **不设「宽读」模式**：`region` 参数退场——`readSectionStatusWord` 只有一个取值区。留一个可选的段内首命中 = 留一条按需把引述行读成结论的入口，而它的缺省值正好落在错的那一侧。
  - **为什么是段头区而不是 §3 特例**：工具写的每一条段级状态行都落在这里（create 骨架如此、缺行插入形如此），§1 / §2 / §5 / §3 因此同一条规则；两处实现里没有 `seg === 3` 分支。
  - **为什么必须收窄**：`append §3` 先插块、后置位——块正文落进段之后，段内首命中就可能停在块正文的引述行上；收窄后写位与「段级」二字对齐，正文字节回到 append-only 的保证里。
  - **取值区只有两种取值：段头区（10 行）与段内（末行，有意不收窄）**——单源表逐处可核：

| 面 | 坐标 | 取值区 |
|---|---|---|
| 写面（state / close / 重开 / 置位 / 重置共用） | `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `updateSectionStatusLine` | **段头区** |
| 打回重置 ③ | 同档 `statusResetPlan` | **段头区** |
| 通过置位 ③ | 同档 `statusPassPlan` | **段头区** |
| `§5` 写入门判据 1 | `thincoder-core/agent-tools/batch-closeout.mjs` 的 `assertSectionFiveGate` | **段头区** |
| 收口门 §3 状态词臂 | 同档 `assertCloseoutGates` | **段头区** |
| 核销门③ | `thincoder-core/ledger-close-proof.mjs` 的 `assertCloseOutProof` | **段头区** |
| 签发面判据 2（`status-not-passed`） | `thincoder-core/agent-tools/design-token.mjs` | **段头区** |
| `batch/list` 列举面 | `thincoder-core/agent-tools/batch-read.mjs` 的 `listBatchRecords` | **段头区** |
| §1 冻结判据 | `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `readBatchStatusLine` | **段头区** |
| §1 重开回执读原文 | `thincoder-core/agent-tools/batch-reopen.mjs` 的 `readBatchStatusLineRaw` | **段头区** |
| §1「有没有状态行」存在性网 | 同骨架档 `sectionHasStatusLine` | **段内**（有意不收窄，见下） |

  - **上表 10 处收窄、1 处有意不收窄；前 10 行读段头区**：写面 1（`updateSectionStatusLine`）· 触发读面 2（两条计划的 ③）· 门面 6（`§5` 写入门判据 1 · 收口门 §3 臂 · 核销门③ · 签发面判据 2 · `batch/list` · §1 冻结判据）· `§1` 重开原文读面 1 = 10；第 11 行 `sectionHasStatusLine` 有意留段内宽读。门面问「这一段的结论是什么」，写面与触发面问「这一笔该写哪一行」——两个问题只有一个答案面：段头区。
    两边读不同的区，正文里一行 `**状态行**：评审通过` 就能在门面上冒充段级状态行，而写面与触发面看不见它。
  - **为什么必须全收窄**：只收窄写面与触发面时，门面仍按段内首命中取值——同一个机制两种读法并存，而默认落在宽的那侧。⇒ `readSectionStatusWord(src, seg)` 只读段头区；`statusResetPlan` / `statusPassPlan` 的显式 `"header"` 实参随之删去。
  - **§1 的存在性网有意不收窄**：`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `sectionHasStatusLine` 判「§1 里有没有状态行」（段内），不是「值是什么」。
    它宽读是 fail-closed 的兜底：`readBatchStatusLine` 读不成值（`unknown`）而 `sectionHasStatusLine` 为真 ⇒ 冻结门照跑（`thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `assertGateOpen` 调点）。
    若把它一并收窄，一条只写在 §1 正文里的状态行会让「有行 ⇒ 关门」变成「无行 ⇒ 放行」——那是把冻结面放宽，不是把读面收齐。
  - **收窄的一个终态（登记，不加回落）**：某档 `§1` 的状态行若落在段头区外，值读成 `unknown` ⇒ `status` 路径 `assertGateOpen` 拒、`close` 路径同拒，而重开合取要求 `readBatchStatusLine(src) === "closed"`（`unknown` 永不满足）⇒ 连「补出段头区那一行」的 `status` 写都被同一道门拦下，工具面没有出路。**唯一出路 = 主 agent 手改该档，把 `§1` 状态行移进段头区**（移进后读到 `closed` / `open`，工具面恢复）。
  - **同一道门的两个出口说同一句真话（判据 = `§5` R26）**：值读成 `unknown` 有两处拒文——冻结门（`thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `assertGateOpen`；`append` / `status` / `close` 同过此门）与段绑定拒面（`thincoder-core/agent-tools/batch.mjs` 的 `append` 轨；子代理 / 评审实例写批档走这条）。两处读同一个值、判同一件事，措辞必须同口径：点名「行在段头区外」与「移进段头区」。
  - **出路句必须是真动作**：指向「让建档人再写一次状态行」的措辞对这个终态是假出路——写出的新行仍落在区外，用户照做一次、再撞一次。两个出口的出路句只许是「把行移进 `## §1` 段头区」。
  - **射程 = 一条用户可见的字符串**：不新增分支、不改判据、不改判序、不改拒因；两个出口的差异只在首行标签与主语（`the record` ∥ `the bound batch record`）。
  - **冻结门拒文（逐字）**：

    ```
    batch: 状态行不可解析或缺失 — the record has no §1 `**状态行**：` line inside the section header zone whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). If the record does carry such a line further down — in a round block or in the section body — move it up under `## §1`: a status line outside the header zone is never read. Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close).
    ```

  - **段绑定拒面拒文（逐字；现盘落点 = `thincoder-core/agent-tools/batch.mjs` 的 `append` 轨 `unknown` 分支，按本句落）**：

    ```
    batch_segment: 状态行不可解析或缺失 — the bound batch record has no §1 `**状态行**：` line inside the section header zone whose value contains 已收口 or 进行中 (fail-closed: the write is refused as if frozen). If the record does carry such a line further down — in a round block or in the section body — move it up under `## §1`: a status line outside the header zone is never read. Nothing was written. Do NOT close the record after a refused append — nothing landed, and closing freezes the missing section for good (失败 ⇒ 勿 close).
    ```

    今日实例 = 0（`§1` 段位「段头区无行 ∧ 区外有行」实测 0 段）⇒ **不加回落**：可用的回落只有「按段内宽读取值」与「`unknown` 时跳过冻结门」，前者重开方向 A 的冒充通道（本节「不许回落」），后者把冻结门改成 fail-open——两者换取的实例数都是 0。

**收窄的代价（实测，决定权所在）**

- **量法**（本节读数的取法 = 2026-11-02 一次实测；`region` 退场后按「复跑形」重跑）：
  - **域** = 仓内全部 `.md`；「非批档域」= 再扣 `docs/batches/**` 与任何 `_archive`。批档域单列，因为它是门面唯一的输入面。
  - **归属键** = 一个 `## §N` 段（`N` 单数位——`^## §1` 不命中 `## §10`）。
  - **围栏内算不算** = **算**：读面不认围栏（`sectionBodyLines` 只按行切分，无围栏状态），围栏里的行与正文同权。
  - **取值面（本轮）** = 直接调单源函数 `readSectionStatusWord(src, seg, "section")` 与 `readSectionStatusWord(src, seg, "header")` 比较，不复写解析。
  - **复跑形（`region` 退场后）** = 一刀临时脚本，三步与本节读数的取法逐条对齐：
    - **切区**：按 `^#{2,}` 把每段切成段头区与段体，在「段头区首命中」与「段内首命中」两处各取值后比较。`STATUS_LINE_RE` 从 `thincoder-core/agent-tools/batch-skeleton.mjs` import（同档 `:75` 已导出）；区界 `ZONE_END_RE` 未导出（同档 `:77`）⇒ 脚本本地复写 `^#{2,}`，判据与该档同一条。
    - **词条过滤**：只对 `STATUS_WORDS` 有条目的段位取数（`§1` / `§2` / `§3` / `§5`，同档 `:40`）；`§4` / `§6` 无条目，任何区都读成字面「无状态词」⇒ 按裸文本比会照样命中那 52 段，复跑得 **63** 而不是 11。
    - **归一化**：比较对象 = 归一后的词值，不是裸行文本——先过段位别名表（`§3` 的 `评审完成` → `评审通过`，同档 `:51`），再按 `closed` / `done` / `open` 顺序取 `value.includes(word)`（同档 `:206`–`:211`）；带括注的 `进行中（第 N 轮打回）` 因此读成 `进行中`，裸文本比则不等。

| 读数 | 值 |
|---|---|
| 批档域档数 / `## §N` 段数 | 262 档 / 1567 段 |
| 段头区无行 ∧ 区外有行（全段位） | **63 段**（§3 = 3 · §5 = 8 · §4 = 15 · §6 = 37 · §1 = 0 · §2 = 0） |
| 两区取值不等的段（真正的改判面） | **11 段** = §3 三档 + §5 八档 |
| 非批档域 §3 同形命中 | **0 段** |
| 落在围栏内的区外状态行 | **0 段** |

- **63 与 11 的差 = 该段位有没有词条**：§4 / §6 无 `STATUS_WORDS` 条目，`readSectionStatusWord` 对它们任何区都返回字面「无状态词」⇒ 那 52 段不构成读数，也不改判。

- **与 #1972 的读数对比（−1 的成因）**：259 档 / 1551 段 / 64 段 ⇒ 现盘 262 档 / 1567 段 / 63 段。档 +3、段 +16 = 本批之后新增的批档；**命中 −1 = 已落的写面收窄在起作用**——`status` 的每次写都把状态行补进段头区（`updateSectionStatusLine`），该段随即离开「段头区无行 ∧ 区外有行」这一类 ⇒ 残余池随正常写入自行衰减。**这条成因是推断，未逐段取证**：没有点名从 64 掉到 63 的那一段（档名 + 段位 + `§1` 是否 `已收口`），也没有排除「手工改档」「档被删」两种替代成因——取证形 = 按 #1972 那 64 段的名单逐一复读，找出今天读不到的那一段；给不出就降为可能成因。

- **改判清单（逐档点名，收窄后读什么）**：

| 段位 | 档数 | 收窄后 | 读它的面 | 存量档现态 ⇒ 现成本 |
|---|---|---|---|---|
| §3 | 3 | `评审通过` → 空 | `§5` 写入门判据 1 · 收口门 §3 臂 · 核销门③ · 签发面判据 2 · `batch/list` | `docs/batches/2026-10-28-product-text-sweep.md`（台账 #1854 `已核销`）· `docs/batches/2026-10-28-rule-writing-sweep.md`（#1912 `已核销`）· `docs/batches/2026-10-28-sse-first-chunk-idle.md`（#1859 `已核销`）；三档 `§1` 均 `已收口` ⇒ **现成本 0** |
| §5 | 8 | `实施完成` → 空 | 只 `batch/list`（无门读 §5 状态词） | 7 档 `§1` 已收口 + `docs/batches/2026-10-15-doc-ref-direction-cleanup.records.md`（记录面档、无 `§1`）⇒ 列举面少一个词，无门的后果 |
| §1 · §2 | 0 | — | §1 冻结门 ∥ 活批档（写锁）∥ 重开合取 ∥ 在飞批扫描 | 不改判 |

- **有没有一份会因此收不了口**：收口本身不会——那三档早已收口、台账行也已核销。会的是**重开之后**：重开这三档再收口 / 再核销，需要一轮携 pass 裁定行的评审（置位把状态行写进段头区 ⇒ 自愈，不是人工补字）。**再核销要另立新行**：三档本体现存的行是 `已核销`（终态，重开不回收，`§2.13`）⇒ 重开后要结账得新开一行，旧行原样留着（`§2.4`）。
  那三行的形状就是方向 B：`### 轮次 N（评审子代理）` 块首的 `**状态行**：…` 是评审当时写进块里的，工具不再往那里写。

- **方向 A 的现量 = 0（按下列判别依据读，不是独立的一次量）**：63 段里没有一段是「正文引述行」。三处 §3 的逐条判别依据 = 该行紧跟在 `### 轮次 N（评审子代理）` 块首、括注写的是本轮结论：
  - `docs/batches/2026-10-28-product-text-sweep.md:322`——`### 轮次 1（评审子代理）`（`:320`）之下，`**状态行**：评审通过（第 3 轮回评：第一轮 8 条 = 7 Fixed + 1 Accepted，🔴 0 · 🔵 2（2026-10-28））`。
  - `docs/batches/2026-10-28-rule-writing-sweep.md:226`——`### 轮次 2（评审子代理）`（`:224`）之下，`**状态行**：评审通过`。
  - `docs/batches/2026-10-28-sse-first-chunk-idle.md:160`——`### 轮次 1（评审子代理）`（`:158`）之下，`**状态行**：评审通过（轮次 2 回评：轮次 1 十条全闭（🔴 0），新增 1 🟡 + 3 🔵 不挡通过）`。
  - **为什么是解释而不是量**：工具从不往轮次块里写（`updateSectionStatusLine` 只改段头区）⇒ 块内那行必为手写；手写行是「真状态行」还是「引述」只能由散文判，而「段头区里的行分不出是谁写的」是本节已登记的残余（见下）。
  ⇒ 「引述行冒充段级状态行」至今零实例；真实存在的是方向 B（那三档），而方向 B 就是**触发面与门面读不同的区**这件事本身。
  **读数与决定解耦**：这个数取 0 还是 3 都不改路线 ③——③ 把两个方向一起关掉（`§4` 决策 26），A 的实例数只影响代价大小，不影响收还是不收。

- **收窄后两个方向同时消失**：两个面读同一区 ⇒ 门面与触发面永远同答（要么都读到那行，要么都读成「无状态行」）。方向 B 的「打回不落字 ∧ 门面读到那行」不再可能成立。

- **不许回落（边界）**：不取「段头区为空则回落缺省读」。回落把方向 A 的通道还给触发面——一条引述行就能冒充段级状态行，而它换取的是 0 个实例。
  判据：任何补法若让「正文引述行可以冒充段级状态行」重新成立，它就不成立。

- **已登记残余（不在本条射程）**：段头区里的行分不出**是谁写的**——评审手写在该区的行与工具写的行同形同值。本条定的是「住哪」，不是「谁写的」；判「谁写的」在签发面判据 2 与 `§5` 写入门判据 2（块自己携裁定），不在读面。
- **两个方向的定序与互斥（单源表）**：

| 本笔正文（净化后） | 写前 §3 状态行 | 处置 |
|---|---|---|
| 携打回裁定行（同携 pass 行那支已写不进去，只经计划函数直调可达） | = `评审通过` | 重置 → `进行中（第 N 轮打回）` + 轮次块首留痕行 |
| 携打回裁定行（同携那支同上，只经计划函数直调可达） | ≠ `评审通过` | 零写（本来就写着「评审未完成」） |
| 只携 pass 裁定行 | ≠ `评审通过` | 置位 → `评审通过`，无留痕行 |
| 只携 pass 裁定行 | = `评审通过` | 零写（不重复写痕；状态行字节零改） |
| 无任何裁定行 | 任意 | 零写 |

- **为什么打回优先**：一笔同携两行是自相矛盾的回执，而裁定读数的判序**只住一处**——`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `verdictGapOf`（先打回、后 pass）；签发面 `verdictGateFailure`（`thincoder-core/agent-tools/design-token.mjs`）经它取值，两条状态计划各自写的组合序与它同向（`§2.6.1` 登记残余）。状态行必须与门对同一份文本得出的结论一致，否则同一份回执在两个面上结论相反。
- **与 `§2.6` 判据 1 ∥ 判据 2 的关系**：置位落地后，判据 1（状态词）成为判据 2（末块携 pass）的派生读数；判据 2 **不撤**——它是状态的来源，也是挡住「`status` 单写就开 `§5`」的那一条。
- **最近先例**：`statusResetPlan`（同档 `:306`）——**对齐**：同签名 `(src, seg, body, date)`、同触发位置（`thincoder-core/agent-tools/batch.mjs:249` 一处判定）、同写面、同「一次 `writeFileSync`」。**偏离一处**：它返回 `{ roundN, statusValue, traceLine }`，本方向只返回 `{ roundN, statusValue }`（无留痕行，理由见上）。不合并成一个函数的理由 = 合并要改它的函数体（`§7` 边界：打回行为零回归），且返回形要加一个没有消费方的判别位。
- **调用点（定序一字）**：`const plan = statusResetPlan(...) ?? statusPassPlan(...)`——`??` 的左先右后与上表同向；即使将来某条条件被放宽到两者可同时命中，判出来的仍是打回，与门的结论一致。
- **锚住骨架档的理由**：置位判据住在骨架档——若把 pass 锚留在签发面，骨架档就要回 import 签发面而成立循环（签发面已 import 骨架档）。
- **运行时回执串（字面单源）**：`thincoder-core/agent-tools/design-token.mjs` 的 `REVIEW_RECORD_MARK` 第二句 = 「补写该批档 §3（发现 + VERDICT —— 状态行由工具随块落）后重跑设计评审」（与 `docs/core/design/ADVISOR-GUARDS.md` §1.3 的标记块同字）；同档判据 2 的证句 = 「块落盘时由工具置位」。**判据零改**：拒因三值与 `settlementCriterion` 值集不动。
- **工具描述面同笔落一句（`thincoder-core/tool-docs/batch.md` 的 `status` 条目）**：工具描述是模型真正读到的那一面——不写，评审照旧手动签一次（无害但多余），更坏的是它会以为必须。逐字追加 = 「A §3 pass round sets that section's status line in the same write — `status` on §3 is an optional rewrite, never a required step.」
- **被拒方案**：维持现状（评审每轮多调一次 `status`）——一个动作被拆成两笔就必然漏一笔，而两笔分开后「只写块」与「只写字」各成一个镜像错，判据两个都不接受。

### 2.6 五道门各判什么

| 门 | 位置 | 判据 | 模式 | 拒绝时报什么 |
|---|---|---|---|---|
| 写锁 | `write-gate.mjs` `productCodeWriteConflict`，挂 `dispatch.mjs` Phase 1（`§2.3`） | 目标在产品代码面 ∧ 无活批档 ⇒ 拒 | 仅工程 | `§2.3` 串 |
| §3 写入闸（裁定兜底） | `batch` append §3（`thincoder-core/agent-tools/batch.mjs` `appendBatchRecord`，段键 `n === 3`） | 判定输入 = 净化后正文（`sanitizeText(args.text)` 的结果，落档的就是它）；读数 ∈ {`无裁定行`, `两者同携`} ⇒ 当场拒，`VERDICT: changes-required` 照写（`verdictGapOf`，与下一行判据 ② 同一函数） | 两模式（写入方在两种模式下都只有评审实例） | `R-G3` |
| §5 写入门（段序门） | `batch` append §5（`thincoder-core/agent-tools/batch.mjs` `appendBatchRecord`） | 两条合取：① `§3` 状态行 = `评审通过` ② `§3` **最近一轮轮次块自己携 pass 裁定行**；**或** `§1` 声明 `> 不适用：§3 —— <理由>`（无评审的批） | 两模式 | `R-G2` ∥ `R-G2b` |
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

**判据 2：最近一轮轮次块的裁定行（拒面，不是触发面）**

`§2.5` 的打回重置只认「带打回裁定的一笔」。评审写了一笔 `§3` 却不带任何裁定行时，上一轮的 `评审通过` 仍是字面字，`§5` 照着放行——设计被打回了，实现却开了工。

两条修法：扩触发面（写 `§3` 即重置）∥ 收紧拒面（门读块内的裁定行）。取**拒面**：

- 触发面要判「这一笔是打回还是补记」，那是猜意图；工具手上只有文本，猜错的代价是改写了写者刚落的档。
- 拒面只问一个**可读的事实**：门所依赖的那个块，自己有没有说结论。没说结论的处置对两种情形是**同一条**（补一行裁定，或补写该轮结论）——不需要先分清意图。

**判据单源（接口面）**：块 = 最后一个 `### 轮次 N` 块，取块面 = `thincoder-core/agent-tools/batch-skeleton.mjs` 本轮新增的导出
**`lastRoundBlock(src, seg = 3) → string ∥ null`**（`seg` 段内无块 ⇒ `null`；返回块文本，含块首行，不含下一块首行）。
它**只切块**——块内裁定一律由下面两条既有锚判，判定面不在这条导出里（一处不多，也不许再长出一处）。切块正则复用同档既有导出 `ROUND_HEADING_RE`（`:222`）。

裁定行锚 = `_V_PRE` / `_V_SUF` / `VERDICT_CHANGES_LINE` / `VERDICT_PASS_LINE` 四条，全住 `thincoder-core/agent-tools/batch-skeleton.mjs` 的锚块；签发面与 `§5` 写入门 ∥ 通过置位经 import 同读（**零复制**——锚形只此一份）。

**两个锚的中文分支：尾句号可省可带**。

pass 形四格同判：`结论：通过` ∥ `结论：通过。` ∥ `VERDICT: 通过` ∥ `VERDICT: 通过。`。

打回形四格同判：`结论：不通过` ∥ `结论：不通过。` ∥ `VERDICT: 不通过` ∥ `VERDICT: 不通过。`。

英文形（`VERDICT: pass` ∥ `VERDICT: changes-required`）不带句号。

**理由**：同一个锚、两条分支，对同一语义必须给同一结论——`VERDICT: 通过。` 判是而 `结论：通过。` 判否，是锚内的不对称，不是两条形。
**打回锚缺句号的两处后果**：`结论：不通过。` 读成「无裁定行」。

⇒ `§3` 写入闸误拒一笔真打回。

⇒ `§2.5` 的「打回即重置」不触发（状态行停在 `评审通过`，`§5` 门照放行）。

两处都与上一条同形，故一并补。
**这一改连带签发面与状态机**：`verdictGateFailure` 与两条状态计划读同一对锚 ⇒ 行为随锚对齐而变，**不是措辞整理**。
**混合形仍不命中**：`**结论** = VERDICT: pass` 不是「带不带句号」的问题，是把两种写法混成第三种。

**pass 谓词（显式合取）**：末块**含** pass 裁定行 **∧** **不含**打回裁定行。两行同携 ⇒ 判打回——与签发面 `verdictGateFailure`（`thincoder-core/agent-tools/design-token.mjs`，经 `verdictGapOf` 取值）同序（先打回、后 pass）。这一条不是新政策：两个面判的是同一份回执文本，顺序不同就会两处结论相反。

- **门序**：先判状态词（判据 1），过了再判块。状态词不过时拒文已足以说明，不必再报块。
- **`§3` 无任何轮次块 ⇒ 判据 2 不成立（照拒）**：真跑过的 pass 必有本轮块（`docs/core/design/ADVISOR-GUARDS.md` §1.2 A-AG22 判据 1），无块即无 pass 可依。
- **不误伤的三处**：修正轮（`§3` 已 pass、末块携 pass 裁定）· 轻通道（不写 `§5`）· 无评审的批（`§1` 声明不适用，两判据同免）。
- **`status` 单写不再足以开 `§5`**：本条落地后，只把 `§3` 状态行置 `评审通过` 而不落一块携 pass 裁定的轮次块 ⇒ `§5` 照拒。既有夹具里凡是「`status` 置 pass ⇒ `append §5`」的写法都要补块（`test/RTM.md` 14-8 即此形）。
- **存量出路（既有在飞批）**：`§3` 的 pass 块若写在「裁定行进 `§3`」成文之前（无裁定行的旧块）⇒ 判据 2 判成无结论、`§5` 不可写；而工程模式的 `§3` 只由绑本档的评审实例写（`batch.mjs:78-87`），父侧不能自行补块 ⇒ 出路 = **追加一轮携 pass 裁定的评审**（块落进 `§3` 即可）；不再跑一轮的，收口面照判据 1 走（收口门 ∥ 核销门③ 只判状态词，见下条）。这是可枚举的小集合（此刻在飞的批），不是持续产生的形。
- **不对称（已登记残余）**：判据 2 只落 `§5` 写入门。收口门与核销门③ 仍只判判据 1（状态词）⇒ 一笔「只写散文、无裁定」的 `§3` 之后，实现被拦而收口 / 核销照走。不同步扩的理由：`§5` 门判的是「能不能开工」，开工面拦得住损失就止住了；收口是本批**已经做完**的事，在那里再插一道评论文本判据，只会让台账行卡在结账位、逼父侧改档才能结账——比它挡住的洞更贵。日后要扩，先重估这条代价。

拒文（逐字）。判据 1 不过（与盘上实现一致）：

```
batch: §5 append refused — the implementation section opens only after the design review passed (§3 状态行 = <value>，须 = 评审通过). Nothing was written.
（仅普通模式的批可在 §1 写 `> 不适用：§3 —— <理由>` 放行 —— 普通模式无设计评审。工程模式的批要真跑评审；轻通道的评审是后置，不是免掉：改完补设计与评审，补完再收回口。）
```

判据 2 不过（`R-G2b`）：

```
batch: §5 append refused — the last §3 round block carries no pass verdict (§3 最近一轮轮次块 = 第 <N> 轮，块内裁定 = <无裁定行 | VERDICT: changes-required | 两者同携>). A pass means that block carries a `VERDICT: pass` line and no changes-required line — a round that does not state a pass is not a pass: append the verdict line to that block (`VERDICT: pass`)，或按裁定行重跑评审。Nothing was written.
```

**核销门为什么能去运行态**：`§3` 只能由**绑在该档上的评审实例**写（`batch` 工具的 review 绑定，`batch.mjs:78-87`），
所以「§3 有 pass」本身就证明了「有一次绑本档的评审跑过并给了 pass」，与 token 槽归属同义，且换会话成立。
代价：评审自报 pass 的信任面不变（今天也是评审自己写 §3）。

拒文（逐字）：

```
  ③ 批档 §3 未通过评审（§3 状态行 = <value>，须 = 评审通过）：重开该档补评审结论，或另起批次
batch: 收口链未跑完（closeout chain gate）— close refuses: §3 状态行 = <value>，须 = 评审通过（评审须真跑过并给 pass）；§2 / §4 / §6 各段须有内容或由 §1 声明不适用。Missing: <段表>. Nothing was written.
```

### 2.6.1 §3 写入闸（裁定行在写的时刻就要在）

`§3` 的每一笔追加都自成一轮次块（工具盖 `### 轮次 N`）。所以「写后的末块有没有裁定行」在写前就读得出来——它就是这一笔的正文。判据因此在写前判得出真假，不必等实施席开 `§5` 时由门报出来。

**为什么在写时判**：能写 `§3` 的只有绑在本档上的评审实例，它结算后即不在场；`§5` 门报错时，唯一有权补那一行的人已经走了。写时拒把错误退回评审手上，代价是一笔重发。

**工具面闭集（工具通道里谁写得到 `§3`）**：

| 通道 | 写得到 `§3` | 本闸 |
|---|---|---|
| 设计评审实例（`batch` 以 `review: true` 绑定） | 能 | **已接**——`allowedSegment` 判 `review` ⇒ 3 |
| 主 agent（depth 0 append） | 不能 | 不适用——`DEPTH0_SEGMENTS.append` 两模式集均不含 3 |
| eng-designer ∥ eng-coder | 不能 | 不适用——`SEGMENT_BY_ROLE` = §2 ∥ §5 |
| coder（普通模式，携绑定） | 不能 | 不适用——`SEGMENT_BY_ROLE_NORMAL` = §5 |
| `batch edit` | 不能 | 不适用——`edit` 段域只有 §2 |
| 主 agent ∥ 携绑定子代理直写本档文件（`write` / `edit` 工具直写，不经本工具） | 能 | 不接——工具面之外的另一条通道，已登记（`docs/core/design/BATCH-RECORD.md` §4.19「旁路仍在」，处置 = 登记即终局：不补门、不另裁；§4.2 记「主 agent（depth 0）不受该门约束」）。理由：本闸的靶是**结算离场的评审**，那条通道上动手的人还在场、能当场补行；补段级写门会先挡住正当写入（改档头、工具未建模的一次性修字面） |
| 评审实例直写批档文件（`write` / `edit` 工具） | 不能 | 不适用——**装配面实测无旁路**：评审工具集 = `read` ∥ `glob` ∥ `grep` ∥ `ls` ∥ `lsp` ∥ 代码检索，设计评审绑本档时再追加 `batch`（append / status）；不含 `write` / `edit` / `bash` / `apply_patch` ⇒ 写批档的唯一通道就是 `append`，本闸正挂在该通道上。量法 = `thincoder-core/advisor/loop.mjs` `advisorToolsFor`（`tools` 初值六件 + `reviewType === "design" && batchDoc` 时 `batchTool(batchDoc, { review: true })`） |

⇒ 闸挂在**段键** `n === 3` 上，不挂在身份旗标上：段键是「谁能写这一段」的机械事实，将来身份面扩权（例如 depth-0 得 `§3`）自动被覆盖；旗标是装配面事实，改装配漏挂一处就静默失效。

**判据单源**：`thincoder-core/agent-tools/batch-skeleton.mjs` 的锚块新增纯函数 **`verdictGapOf(text) → null ∥ 「无裁定行」 ∥ 「VERDICT: changes-required」 ∥ 「两者同携」`**（先打回后 pass，与签发面同序）。三处共读同一个函数：

- `§5` 写入门判据 2（`lastRoundVerdictGap`，`thincoder-core/agent-tools/batch-closeout.mjs`）——本批只把它的组合序换成调用，字符串逐字不变。
- 本闸（`append §3`）。
- 签发面 `verdictGateFailure`（`thincoder-core/agent-tools/design-token.mjs`）——**改调 `verdictGapOf`，返回串词汇不动**：`null` 映回 `null`；`「VERDICT: changes-required」` ∥ `「两者同携」` 映回 `changes-required`（同携今天就走这一格——`VERDICT_CHANGES_LINE.test` 先命中，保住盘上行为）；`「无裁定行」` 映回 `no-pass-line`。对外说法（拒因枚举）零改，改的只是判据的来源。

**登记残余（已知第四处，本批不动）**：`statusPassPlan` 仍把「命中 pass ∧ 不命中打回」逐条自写（`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `statusPassPlan` 内两行 `VERDICT_PASS_LINE.test` ∧ `VERDICT_CHANGES_LINE.test`）。这是决策 24 拒合并的代价，本批只登记、不改它。

**先查再建**：`verdictGapOf` 是本批新名。

- `existing: thincoder-core/agent-tools/batch-closeout.mjs` · name: `lastRoundVerdictGap` · failed on: 未导出，且入参是**块文本**、带 `null` 分支（「段内无块」）——写时手上是本笔正文，为复用而把未落盘文本伪装成块，会把 `null` 语义带进来。
- `existing but unusable: thincoder-core/agent-tools/design-token.mjs` · name: `verdictGateFailure` · failed on: 组合序被调用方语义绑死（返回 `no-pass-line` 这类签发面词汇），写面按它判会把拒因词表带歪。
- `none found: 组合序现只住未导出的 lastRoundVerdictGap ∥ design-token.mjs 的 verdictGateFailure`（两个面各写一遍，第三面是本次新增）。

**判定输入 = 净化后的 `body`**：不是 `args.text`。`sanitizeText` 会丢掉自带轮次标题与凭证行，而落档的就是 `body` ⇒「写前正文 ≡ 写后末块」（`§2.6` 判据 2 判的就是那个块）只对 `body` 成立。

**放行面 = 只拒两格**：`verdictGapOf(本笔正文)` ∈ {`「无裁定行」`, `「两者同携」`} ⇒ 拒；其余两值（`null` ∥ `「VERDICT: changes-required」`）⇒ 照写。

- **判打回的一笔必须写得进去**：`§5` 门判据 2 与「打回即重置」（`§2.5` 单源表第 1、2 行）都靠那一块自己携打回裁定行；在写面拦它 = 把打回这条业务路堵死（`test/RTM.md` 14-8 就要这一笔写进去）。
- **两者同携 ⇒ 写时就拒（程序不变量）**：一处自相矛盾的回执（同携 pass 与打回两行）在盘上没有合法读法——门判打回、状态行判打回、签发面判打回，三条面读同一份文本，它唯一的效果是让人猜哪一行算数。它不是「某个真实场景要写的东西」，而是本闸与 `§2.6` pass 谓词都写了、盘上却无样本的交叉格 ⇒ 按程序不变量落：`verdictGapOf` 的第四格由写面与本闸同判，复现路径 = 单测喂一笔同携正文，断言两处同值（无盘上存量样本）。

**拒写 ≠ 落盘**：拒文在任何字节落盘之前抛出，轮次号也不消耗（N 由 `nextRoundNumber` 在插入时才取）⇒ 评审把同一笔正文加上裁定行重发即可，不必补记、不必换轮。

**分段追加不受影响**：每次调用各成一块（`docs/core/design/BATCH-RECORD.md` §4.1），第二段自己成块、末块就是它，`§5` 门本来就要求它自带裁定——「每一笔都要带裁定行」不是对合法流程的收紧，是把既有要求提前报出来。

**存量不回填**：闸只管新写的笔；盘上既有的无裁定块由重跑一轮评审补块，收口 ∥ 核销仍只判状态词（残余登记见 `§2.6` 的「不对称（已登记残余）」条）。

拒文（逐字，`R-G3`）：

```
batch_segment: §3 append refused — this round block states no readable verdict (块内裁定 = 无裁定行 | 两者同携). A §3 block must carry exactly one verdict as a line of its own; put exactly one of `VERDICT: pass` ∥ `VERDICT: changes-required` on such a line in the text you append — copying this refusal verbatim copies the words, not a verdict line.
(本地化整行形 `结论：通过` / `结论：不通过` 同认，中文形的尾句号可省可带（`结论：通过。` 同认）。不作独立整行的写法不认——例如 `**结论** = VERDICT: pass`。) Nothing was written — no bytes landed and no round number was consumed: append the same text again with the verdict line added.
```

**拒文自身不得构成裁定行（两个词内联，不各占一行）**：`R-G3` 里两个裁定词必须留着——照抄它的人要能复制；但它们**不许各占独立一行**。各占一行时这段拒文自己就读成「两者同携」，**引用它解释这道闸的那一笔永远写不进去**（想解释这道闸的人恰被它挡在门外）。

- **读数**：改前拒文（两词各占一行）自读 = `两者同携`；把它引用进一笔并另写一行 `VERDICT: pass` 仍 = `两者同携`。改后拒文自读 = `无裁定行`，引用进一笔 + 另写一行 `VERDICT: pass` = `null`（本闸放行）。
- **引用形 = 代码围栏**：`R-G3` 全文 563 字符、首行 337 字符。`append` 的同一条落盘路径上除本闸还有既有文档机检门（段落长度阈值 300），门位在本闸之后、写盘之前；围栏内不计段落。
  纯文本粘贴的那一笔本闸放行（`null`），仍被它拒（`命中 1 条`，块数 0）；换成围栏引用即写入、块 +1 ⇒ 引用一段工具原文本来就该用围栏。
- **两套阈值各管各的**：拒文是**工具消息**，按消息计；引它进**文档**时按段落计。拒文长度因此不动——为迁就一种引用方式去改一句已逐字钉死的拒文，是本末倒置。
- **也不许用缩进 ∥ 列表符隔开**：那样照抄示例的评审写出的行不命中整行锚 ⇒ 补一行永不生效，变成死循环。内联是同时满足「可复制」与「不构成裁定行」的唯一形。
- **代价**：拒文不再是「两行示例逐字」，而是一句内联；照抄的评审需自己把词写成整行——而那正是拒文第一句要求的事。

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

**描述面必须逐边枚举**：工具描述（`thincoder-core/tool-docs/ledger.md` 的 `update` 条）是模型读到这一面的唯一出处——它漏一条边，模型就按漏掉的那一版办事，而 `§2.4` 的建档与点火两条路都走在 `待讨论 → 在途` 上。

故描述面**逐边写全**，与 `ALLOWED_MIGRATIONS` 单源（`thincoder-core/ledger-db.mjs:163`–`:166`）：`待讨论 → 待设计 / 在途 / 已废弃` · `待设计 → 在途 / 已废弃` · `在途 → 待核销 / 已废弃` · `待核销 → 已核销 / 在途 / 已废弃` · `已核销 → 已废弃` · `已废弃` 无出边。两条非常规边各带一句用途：`待讨论 → 在途` = 点火与建档的正路（不是例外，不过 `待设计`）；`待核销 → 在途` = 重开回收（六态唯一的回退边）。

描述面**不引档名**（它由模型直接读，指向别档的引用会在改词后失效）——用途句自己把话说全。

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
[ledger reanchor] 本批在途行 → 待核销 N 行：#12 「…」；#15 「…」 —— 认领行只有两种终局：做完的 close 勾销（待核销 → 已核销），判定不做的 update → 已废弃 并写判据（认领即承诺，没有第三种）
[ledger reanchor] 本批未动行 → 条件 M 行：#16 「…」 —— 这些行不是本批的活（未认领却被绑在本档 = 点火违规）；已落 trigger = 条件 + 复启句，由下一批接手，本批不再处置
[ledger reanchor] 本批 N+M 行由重锚默认推进，父侧未显式处置：#12, #15, #16
```

**建议句为什么贴在自己的行上**：第一行只装 `在途` 行、第二行只装 `待讨论` / `待设计` 行，建议就落在它管的那一类旁边；挂在汇总行上就得一句话管两类，而两类的出路相反（一类只有两种终局，一类本来就不该在本批）——两类并进一句正是要收的病句。汇总行因此只点名，不再给建议。

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

**触发判据（写死，一处消费）**：台账联动**只**由重开合取触发，判据 = `thincoder-core/agent-tools/batch-lifecycle.mjs:234` 已有的布尔 `reopen`：

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

**档位结论**：只有 `thincoder-core/agent-tools/batch-lifecycle.mjs` 跨档位（越 500 行软线）——拆单见下；其余各档不跨档位。

| 文件 | 现况 | 变化 |
|---|---|---|
| `thincoder-core/agent/write-face.mjs` | 新档 | 面判 = `classifyPath` + 三处修正（`§2.10`），引 `skip-dirs.mjs` |
| `thincoder-core/skip-dirs.mjs` | 新档 | 排除名单单源（`SKIP_DIRS` 42 项 · `SKIP_DIRS_FOLD` 18 项 · `SKIP_DIR_PREFIXES`，`§2.12`） |
| `thincoder-core/index-discover.mjs` | 改造 | 删本地 `SKIP_DIRS`、改引单源 + 同名再导出 |
| `thincoder-core/tools/shared.mjs` | 改造 | 删 `IGNORED_DIRS` |
| `thincoder-core/tools/search.mjs` | 改造 | 三处 `IGNORED_DIRS` → `SKIP_DIRS`（改名） |
| `thincoder-core/tools/tree.mjs` | 改造 | 删本地 `SKIP_DIRS`、改引单源 |
| `thincoder-core/agent/live-batch.mjs` | 新档 | 活批档判定（扫档 + 台账查询，`ledger` 动态 import——W8 契约）；`readBatchStatusLine` 的消费点 = `liveBatchOpen` 内 `if (readBatchStatusLine(src) === "open")`，调形与三态返回值零变（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/agent/light-round.mjs` | 改造 | 改为薄壳委托 `liveBatchOpen(agent, { roundMarker: ROUND_MARKER })`——导出名 / 签名不变，扫描体迁 `live-batch.mjs`（`§2.2`） |
| `thincoder-core/agent/write-gate.mjs` | 改造 | +`productCodeWriteConflict` |
| `thincoder-core/agent/dispatch.mjs` | 改造 | Phase 1 写面冲突块接第三道门（既有两道 = 跨批档写 · D5 冻结窗）+ `:115` 设计门换判源 `isCodePath` → `faceOf`（`§2.1`） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 改造 | 词表改 `评审通过` + 别名表；`§2.5` 新增导出 `statusPassPlan`，`VERDICT_PASS_LINE` 定义迁入锚块 |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 改造 | 拆分 + 改链门 + 重开回收调点（`§2.13`；见下）；`readBatchStatusLine` 的消费面五处（`findInFlightBatch` · `assertGateOpen` · 重开合取 · 收口重锚触发 · close 前置存在性网）调形零变，逐处符号 + 调用形见下表（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 新档 | 从 lifecycle 拆出建档 / 台账接管事务 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 新档 | 从 lifecycle 拆出链门 + 单测档门 + 机检门调点 + 重锚回执三行（`§2.11`） |
| `thincoder-core/agent-tools/batch.mjs` | 改造 | `ledger` 参数语义与描述面；`§2.5` 在 `append` 轨的判定处接第二个计划（`statusResetPlan(...) ?? statusPassPlan(...)`）；`readBatchStatusLine` 的消费点 = `append` 轨的 `const status = readBatchStatusLine(src)`，调形零变（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/agent-tools/design-token.mjs` | 改造 | 两处运行时回执串（`REVIEW_RECORD_MARK` 第二句 ∥ `status-not-passed` 证句，字面 = `§2.5`）；`VERDICT_PASS_LINE` 改 import + 原样再导出；拒因三值与判据零改 |
| `thincoder-core/tool-docs/batch.md` | 改造 | `status` 条目补一句置位语义（逐字 = `§2.5`） |
| `thincoder-core/ledger-close-proof.mjs` | 改造 | ③ 改读 §3；`readBatchStatusLine` 的消费点 = `assertCloseOutProof` 的已收口前置 `const state = readBatchStatusLine(src)`，调形零变（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/ledger-db.mjs` | 改造 | 迁移表 +2 边（`待讨论 → 在途` · `待核销 → 在途`） |
| `thincoder-core/ledger-cmd.mjs` | 改造 | 重锚分流 + 兜底点名（`§2.11`，返回形加 `backstopped` 集）+ `ledgerReclaimBatch`（`§2.13`，与重锚同形） |
| `thincoder-core/prompts/discipline-engineering.md` | 改造 | `§2.9` 的一句：面分流表后加一行 |
| `thincoder-core/prompts/persona-engineering.md` | 改造 | `§2.4` 提示词落点：生命周期第 1 条扩写（字面逐字引自 `§2.4`） |
| `thincoder-core/ledger.mjs` | 改造 | 公共面再导出 `ledgerReclaimBatch`（同形） |
| `thincoder-core/agent-tools/batch-reopen.mjs` | 新档 | 重开回收调点 + 回执两 / 三行（`§2.13`）；`readBatchStatusLineRaw` 改读段头区（回执原文取真段级行，`§2.5`） |
| `thincoder-core/memory/schema.mjs` | 改造 | 删三处名单定义、改引单源 + 同名 re-export |
| `thincoder-core/memory.mjs` | 零改 | `SKIP_DIRS` 导出面由 re-export 保住 |

**上表 26 档**：新档 6 · 改造 19 · 零改 1。

**档位结论（本轮定位面收窄）**：受触档 `thincoder-core/agent-tools/batch-skeleton.mjs` **不跨档位**——落法是写面与读面共用同一条段头区判定（`§2.5` 的单源表），读面不再有第二个取值区；不新开档、不新增导出。

- **落法做成净负**：删 `region` 形参、删其 JSDoc 段与两条计划的两处 `"header"` 实参 ⇒ 改后行数不高于改前（改前实测 500 行，判据 = `§5` R24 第 ⑧ 格）；不靠「注释行等量压缩」凑预算。`thincoder-core/agent-tools/batch.mjs` 与 `thincoder-core/agent-tools/design-token.mjs` 本笔零改，其余各档零触。
- **`readBatchStatusLine` 的消费面零改、行为不变**——一符号一行（4 档 8 个调用点），收窄只改解析体，调用形与三态返回值零变。**坐标一律用符号名，不记行号**——行号随任何一笔注释增删漂移，而符号名跟着代码走：

| # | 所在符号 | 调用形 |
|---|---|---|
| 1 | `thincoder-core/agent/live-batch.mjs` 的 `liveBatchOpen` | `if (readBatchStatusLine(src) === "open") return { open: true, error: null }`（活批档三合取） |
| 2 | `thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `findInFlightBatch` | `if (readBatchStatusLine(src) === "open") candidates.push(abs)`（在飞批扫描） |
| 3 | 同档 `assertGateOpen` | `const gate = readBatchStatusLine(src)`（冻结门） |
| 4 | 同档 `status` 轨的重开合取 | `const reopen = … && readBatchStatusLine(src) === "closed"`（重开合取，`§2.13`） |
| 5 | 同档 `status` 轨的收口重锚触发 | `closingValue && readBatchStatusLine(src) !== "closed"`（收口重锚） |
| 6 | 同档 `close` 轨的前置存在性网 | `if (readBatchStatusLine(src) !== "open" && sectionHasStatusLine(src, 1)) assertGateOpen(src)` |
| 7 | `thincoder-core/agent-tools/batch.mjs` 的 `append` 轨 | `const status = readBatchStatusLine(src)` |
| 8 | `thincoder-core/ledger-close-proof.mjs` 的 `assertCloseOutProof` | `const state = readBatchStatusLine(src)`（核销前置） |

- **另两个读面各自单列，不在这 8 行里**：`readBatchStatusLineRaw`（`thincoder-core/agent-tools/batch-reopen.mjs`）自己解析 `§1`，解析体读段头区（回执原文取真段级行）；`sectionHasStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs`）**零改**（存在性网，`§2.5`）。
- **重开合取只有一处 = `thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `status` 轨（`… && readBatchStatusLine(src) === "closed"`）**（`§2.13` 的判据句同此）。

**拆分预算（`batch-lifecycle.mjs` 越 500 行软线，按「建 / 关 / 开」切三刀）**：

| 去向 | 内容 |
|---|---|
| 迁出 → `batch-ledger-bind.mjs`（新） | 建档与台账接管事务（`§2.4`） |
| 迁出 → `batch-closeout.mjs`（新） | 链门 + 单测档门 + 机检门调点 + 重锚回执三行（`§2.11`） |
| 迁出 → `batch-reopen.mjs`（新） | 重开回收调点 + 回执两 / 三行（`§2.13`） |
| 留下 | status / close / 消费面 |
| 本批新增 | close 径接 closeout 调点 ∧ 重开径接 reopen 调点 |

⇒ `batch-lifecycle.mjs` 回到 500 行软线以内；三新档按上表内容切分。依赖仍单向：`skeleton ← closeout ← bind ← reopen ← lifecycle`。

**分舱（该批的调度选择：舱内文件集不重叠 ⇒ 可并行；舱间按依赖排序）**：25 档落笔面分五舱（`thincoder-core/memory.mjs` 零改，不入舱）；表里「面」列记的是各舱实际落在哪类档上，是记录、不是拆单依据。

| 舱 | 面 | 档 | 先后 |
|---|---|---|---|
| 1 | 面判与名单 | `skip-dirs.mjs`(新) · `agent/write-face.mjs`(新) · `index-discover.mjs` · `tools/shared.mjs` · `tools/search.mjs` · `tools/tree.mjs` · `memory/schema.mjs` | ① 先落（面判底座） |
| 2 | 台账面 | `ledger-db.mjs` · `ledger-cmd.mjs` · `ledger.mjs` · `ledger-close-proof.mjs` | ② |
| 3 | 批档工具面 | `batch-skeleton.mjs` · `batch.mjs` · `design-token.mjs` · `batch-ledger-bind.mjs`(新) · `batch-closeout.mjs`(新) · `batch-reopen.mjs`(新) · `batch-lifecycle.mjs` | ③ 依赖舱 ② |
| 4 | 写锁接线 | `agent/live-batch.mjs`(新) · `agent/light-round.mjs` · `agent/write-gate.mjs` · `agent/dispatch.mjs` | ④ 依赖舱 ① ∥ ② |
| 5 | 提示词与工具描述面 | `thincoder-core/prompts/discipline-engineering.md` · `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/tool-docs/batch.md` | ⑤ 字面引舱 ① 的档名 |

最大舱 = 7 档（舱 1 ∥ 舱 3），均不跨面。

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

    被拒 = 一本一行、其余 `已废弃` 并入并 `evidence` 记「并入 #N」：① 做完的点被记成撤回（`已废弃` 的语义是撤回，`§2.4`）；② 攒批本就是多点进一批（`thincoder-core/prompts/persona-engineering.md` §Ledger 的 `Merge what can be merged`），点与执行载体的单位不同。代价 = 点火多写 N−1 条 `update`（与并入路径同量）。

24. **通过置位与打回重置并列为两条计划**（`§2.5`）：调用点 `statusResetPlan(...) ?? statusPassPlan(...)`，互斥由第 ③ 合取的方向保证，`??` 的左先右后又与 `verdictGateFailure` 同序。
25. **§3 写入闸 = 写时就拒，不延到 `§5` 门去报**（`§2.6.1`）：能写 `§3` 的只有绑本档的评审实例，它结算后即离场——`§5` 门报错时，唯一有权补那一行的人已经不在了。被拒 = 扩打回重置的触发面（写 `§3` 即重置：工具手上只有文本，分不清「打回」与「补记一段散文」，猜错还改写了写者刚落的档）；被拒 = 放宽 `§5` 门（门的作用就是掐住「块里没有可认的裁定」）。
26. **两锚的中文分支同判**（`§2.6`）：尾句号可省可带——pass 侧 `结论：通过。` 与 `VERDICT: 通过。` 同判 pass，打回侧 `结论：不通过。` 同判打回（缺句号时它读成「无裁定行」⇒ 新闸误拒真打回、状态行不重置）。连带签发面与状态机（三处同读一锚，`design-token.mjs` 的 `verdictGateFailure` 本批改调 `verdictGapOf`，返回串词汇不变）。被拒 = 维持不对称、只在工具描述里写「结论形不带句号」（同一语义两套结论，读者靠记忆）；被拒 = 顺带认混合形 `**结论** = VERDICT: pass`（那不是句号问题，是把两种写法混成第三种）。

    被拒 = 合并成一个 `statusSyncPlan`（要改打回函数体，破 `§7` 的零回归边界；返回形还多一个没有消费方的判别位）。被拒 = 让**状态行计划**自己再拦一次两行同携（同序判定已由 `statusResetPlan(...) ?? statusPassPlan(...)` 的优先序给出；写面拒同携是 `§3` 写入闸那一道的事，不在状态行这一层重报）。

- **决策 25（段级状态行的定位面 = 段头区，写与读同一条）**：`updateSectionStatusLine` 的定位面 = **段头区**（`§2.5`）；六处门面、两条计划的 ③、`batch/list` 与 §1 的两条读面同读这一区（决策 26）。
  - **被拒 · 改时序（先置位、后插块）**：只救「本笔新插的块引述了状态行」一形；§3 里**上一轮**块正文引述的行仍在首命中位上，改写照旧发生——修好与否取决于调用顺序，而不取决于定位规则。
  - **被拒 · 只在 §3 分支收窄**：同一条定位问题在 §1 / §2 / §5 上是同一个写函数（`status` / `close` / 重开三处共用），一个函数里放两个定位语义，下一轮读档的人无从判断该按哪个读。
  - **代价与边界**：正文字节不再被本通道改写——`append §3` 的例外只剩状态行那一行本身（§2 的段体区间改写是另一条通道，判据见 `docs/core/design/BATCH-RECORD.md` §4.19）。

- **决策 26（六处门面与 §1 重开原文读面一并拉到段头区，`region` 形参退场）**：段级状态行的取值区只有一个（单源表 = `§2.5`）。

  理由：门面问「这一段的结论是什么」，写面问「这一笔该写哪一行」——两个问题只能有一个答案面。两边读不同的区时，正文里一行 `**状态行**：评审通过` 就能在门面上冒充结论，而写面与触发面看不见它。收窄之后 `section`（段内首命中）没有第二个消费者，留着它 = 留一条按需把引述行读成结论的入口，且默认值恰好落在错的一侧。

  **被拒 · 路线①（保持现状，两个方向登记在册）**：登记不是拦法。按段内首命中取值的四处正是冒充行最有用处（`§5` 写入门判据 1 · 收口门 §3 臂 · 核销门③ · 签发面判据 2）——它换来的是「签字面可以被正文文本推动」。

  **被拒 · 路线②（段头区为空则回落缺省读）**：它让「正文引述行可以冒充段级状态行」重新成立，而它换取的是 0 个实例（方向 A 现量 = 0，`§2.5`）。判据写死：任何补法若让该冒充重新成立，它就不成立——除非同时给出更强的拦法；本批不需要那个例外。

  **代价（实测，逐档名单 = `§2.5` 改判清单）**：三档 §3 读成 `null`（三档早已收口、台账行均 `已核销` ⇒ 现成本 0；重开后再收口须一轮携 pass 的评审，置位自愈）· 八档 §5 在 `batch/list` 少一个词（无门读 §5）· §1 / §2 零改判。

  **§1 的存在性网不收窄**（`sectionHasStatusLine`）：判「有没有」用段内宽读、判「值是什么」用段头区，两者合起来才是 fail-closed；一并收窄会把「有行 ⇒ 关门」改成「无行 ⇒ 放行」。

  **最近先例**：同档决策 25（写面收窄，`§2.5`）。**对齐**——同一条定位面（段头区）与同一条区界判据 `ZONE_END_RE`（`thincoder-core/agent-tools/batch-skeleton.mjs:77`）；**偏离**——决策 25 只动写面，本决策把六处门面与 `§1` 重开原文读面一并拉过去，并让 `region` 形参退场。

27. **拒文自身不得构成裁定行**（`§2.6.1`）：`R-G3` 的两个裁定词内联成一句，不各占独立一行。

    理由：两个词各占一行时，拒文自己就读成「两者同携」（实测：改前拒文 `verdictGapOf` = `两者同携`；把它引用进一笔并另写一行 `VERDICT: pass` 仍是 `两者同携`）⇒ 引用它解释这道闸的评审**永远写不进去**——想解释这道闸的人恰被它挡在门外。改后拒文自读 = `无裁定行`，引用进一笔 + 另写一行 `VERDICT: pass` = `null`（本闸放行；入档的引用形 = 代码围栏）。

    被拒 = 加缩进 ∥ 列表符隔开（照抄示例写出的行不命中整行锚 ⇒ 补一行永不生效，死循环）；被拒 = 删掉两个词（照抄的人无处可复制，拒文不再自明）。代价 = 拒文里不再有两行逐字示例，照抄者要自己把词写成整行——而那正是拒文第一句所要求的。

    引用形 = **代码围栏**，不是纯文本粘贴：拒文全文 563 字符、首行 337 字符，纯文本粘贴进 `§3` 时本闸放行而既有文档机检门（段落阈值 300，门位在本闸之后）拒（`命中 1 条`，块数 0）；围栏内不计段落 ⇒ 围栏引用即写入。引用一段工具原文本来就该用围栏，把验收写成「纯文本原样粘贴」等于要求一条与既有文档纪律相抵的行为。

    拒文长度不动：它是**工具消息**，按消息计；引它进**文档**时按段落计——两套阈值各管各的，为迁就一种引用方式去改一句已逐字钉死的拒文，是本末倒置。

## 5. 验收对照

每条回到批档 `§2` 的批次条目（R1–R25）；机检判据如下：

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
| R18 回执建议句按类分流 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 回执第一行携「认领行只有两种终局」、第二行携「不是本批的活（点火违规）」、第三行只点名不给建议；`grep -c "没做完的" thincoder-core/agent-tools/batch-closeout.mjs` = 0 |
| R19 建档 `待核销` 号拒（`R-C4`） | `create{ledger:"#<待核销号>"}` ⇒ 拒，拒文逐字 = `§2.4` 第四条；档零落盘、行零改（抛出点 `thincoder-core/ledger-write-ops.mjs:309`） |
| R20 重新开账 = 另立新行 | 覆盖行已 `已核销` ⇒ `create` 不带 `ledger` 自开一行、§1 `覆盖账` 只含新号；旧行状态 / `evidence` 字节零改 |
| R21 迁移枚举与状态机逐边相等 | `thincoder-core/tool-docs/ledger.md` 的 `update` 枚举边集合 = `thincoder-core/ledger-db.mjs:163-166` 的边集合（含 `待讨论→在途` · `待核销→在途`）；`ALLOWED_MIGRATIONS` 本体零改 |
| R22 `§5` 门判据 2 | `§3` 状态行 = 评审通过 ∧ 最近一轮轮次块无 pass 裁定 ⇒ `append §5` 拒（`R-G2b` 串）、§5 字节不变；末块同携 pass 与打回两行 ⇒ 判打回（合取第二项不成立）；块内补 `VERDICT: pass` ⇒ 写入；`§3` 无轮次块 ⇒ 拒；`§1` 声明 §3 不适用 ⇒ 写入 |
| R23 通过即置位（`§2.5`） | 夹具 = 骨架原形批档（§3 无状态行）：一笔 `append §3` 携 `VERDICT: pass` ⇒ 段内出现 `**状态行**：评审通过`、`readSectionStatusWord(src,3)` = `评审通过`、轮次块 +1、留痕行 0；同档再 append 一笔携 pass ⇒ 状态行字节零改、留痕行仍 0；写前 = `进行中（第 3 轮打回）` 的一笔携 pass ⇒ 状态行回 `评审通过`；一笔同携 pass 与打回两行 ⇒ 判打回（`进行中（第 N 轮打回）`；计划函数直调取证，`append §3` 已写不进去）；一笔无裁定行 ⇒ 状态行字节零改；`append §6` 携 pass 行 ⇒ 状态行零改；写前 = pass 的一笔携打回行 ⇒ 既有重置行为逐字不变（零回归）；`thincoder-core/tool-docs/batch.md` 的 `status` 条目含置位句（逐字 = `§2.5`）；**定位面收窄**：写前 §3 段头区无状态行、正文含一行 `**状态行**：进行中（引述）` 的一笔携 `VERDICT: pass` ⇒ 引述行逐字节不变 ∧ 段头区出现 `**状态行**：评审通过` ∧ `readSectionStatusWord(src,3)` = `评审通过` ∧ 轮次块 +1 ∧ 留痕行 0；同形但引述行本身写 `**状态行**：评审通过` ⇒ 置位仍触发（段头区补出 `**状态行**：评审通过`）；写前段头区 = `评审通过` 的一笔携打回行、正文引述 `**状态行**：进行中（上一轮）` ⇒ 段头区 = `进行中（第 N 轮打回）` ∧ 引述行字节不变 ∧ 留痕行 1；`status` 写 §2（段头区有行、`###` 之下另有一行同形）⇒ 段头区那行改写、`###` 之下那行字节不变 |
| R24 段级状态行只有一个取值区（`§2.5`） | 夹具 = §3 段头区无状态行、块正文含一行 `**状态行**：评审通过`：① `append §5` ⇒ 拒（`R-G2`）② `close` ⇒ 拒、拒文含 `§3 状态行 = （无状态行）` ③ `ledger close` 核销该档行 ⇒ 拒（`R-L3`）④ 派设计评审 ⇒ 拒签（`status-not-passed`）⑤ `batch list` 该档 `§3` = 空 ⑥ 同档落一笔携 `VERDICT: pass` 的 `§3` ⇒ 段头区出现 `**状态行**：评审通过`，①–⑤ 全部翻绿；同形夹具把引述行换成 `**状态行**：进行中` 时 ⑥ 仍成立（置位的第三合取读段头区 = 空 ⇒ 触发），引述行逐字节不变；⑦ 可跑文件 = **实施轮落的** `test/integration/batch-status-auto-set.test.mjs`（`node --test test/integration/batch-status-auto-set.test.mjs`，其 27-1 用例断言「评审写一笔即签字」；27-1 现态 = `test/RTM.md` 在册、「待执行」、用例本体随实施轮落）；⑧ 改后 `thincoder-core/agent-tools/batch-skeleton.mjs` 行数不高于改前（改前实测 500 行） |
| R25 重开自愈整链（`§2.5` 改判清单的现成本处置） | 夹具 = **新档自开行 + 三档同形的 `§3`**（`§3` 段头区无状态行、块首一行 `**状态行**：评审通过`）；行的行程写死 = `在途` → 收口 `待核销` → 重开回收 `在途` → 再收口 `待核销` → `ledger close` 勾销。断言：`status` 把 `§1` 写回 `进行中`（重开）⇒ `append §3` 携 `VERDICT: pass` ⇒ `§3` 段头区出现 `**状态行**：评审通过` ⇒ `close` 放行、该行的 `ledger close` 通过；全程不手改状态行。**三档本体的行是 `已核销`**（终态，重开不回收，`§2.13`）⇒ 照本体搭夹具最后一步必不通过；那三档要再结账须另立新行，夹具因此用新档自开行 |
| R26 收窄的终态拒文点名出路（`§2.5`） | 夹具 = 某档 `§1` 状态行落在段头区外（`###` 之下），**两个出口都断言**：① `status` 写 `§1` ⇒ 拒（冻结门 `assertGateOpen`）② 绑定调用方（子代理 / 评审实例）`append` 任一段 ⇒ 拒（`thincoder-core/agent-tools/batch.mjs` 的段绑定拒面）。两条拒文逐字含「inside the section header zone」与「move it up under `## §1`」两句（字面 = `§2.5`）；全仓 `.mjs` 实走 `Ask the record's creator to set the §1 status line` 命中 = 0（假出路句不许有一条以上）；把该行移进段头区后同一 `status` 写 ⇒ 通过（读到 `open` / `closed`，工具面恢复）；不加任何回落 |
| R27 §3 写入闸（`§2.6.1`） | 评审写一笔 §3 无裁定行 ⇒ 拒（拒文逐字 = `R-G3`：含 `VERDICT: pass` ∥ `VERDICT: changes-required` ∥ `no round number was consumed`），档字节零改、轮次块数不变；写 `**结论** = VERDICT: pass` ⇒ 同拒；写 `结论：通过` ∥ `结论：通过。` ∥ `VERDICT: 通过` ∥ `VERDICT: 通过。` ∥ `VERDICT: changes-required` 五笔各写入、块数各 +1（两锚中文分支尾句号同判）；写 `结论：不通过` ∥ `结论：不通过。` ∥ `VERDICT: 不通过` ∥ `VERDICT: 不通过。` 四笔照写入（打回那几笔同笔重置 `§3` 状态行，写前 = `评审通过` 时）；判定输入 = 净化后 `body`（自带 `### 轮次 N` 标题的一笔按净化后正文判）；一笔同携两行 ⇒ 拒（块内裁定 = 两者同携）；`grep -rn "export const VERDICT_PASS_LINE" thincoder-core` = 1 命中（判据只一份）；拒文自身读成「无裁定行」（`verdictGapOf(R-G3 全文)` = `无裁定行`，非 `两者同携`）；以代码围栏引用 `R-G3` 全文并另写一行 `VERDICT: pass` 的一笔 ⇒ 写入（纯文本粘贴同形撞既有文档机检门的段落阈值——本闸已放行，与本闸无关）；eng-designer §2 ∥ eng-coder §5 ∥ depth-0 §1 三笔写入不受本闸影响 |

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
| 正常 | 评审 `append §3` 正文携 `VERDICT: pass` | 写入；块 +1；§3 段级状态行由工具置 `评审通过` |
| 边界 | `append §3` 正文携 `结论：通过`（独立整行） | 写入（本地化整行形同认） |
| 边界 | `append §3` 正文携 `结论：通过。`（尾句号） | 写入（pass 锚中文分支尾句号可省可带——与 `VERDICT: 通过。` 同判） |
| 错误 | `append §3` 正文无任何裁定行 | 拒（`R-G3`），字节零改、轮次号不消耗 |
| 错误 | `append §3` 正文写 `**结论** = VERDICT: pass`（非独立整行） | 拒（`R-G3`） |
| 错误 | `append §3` 一笔同携 pass 与打回两行 | 拒（块内裁定 = 两者同携） |
| 边界 | 评审在 §3 里以代码围栏引用 `R-G3` 拒文、并另写一行 `VERDICT: pass` | 写入（拒文自身读成「无裁定行」，不会构成「两者同携」；纯文本粘贴撞既有文档机检门，非本闸） |
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
| 错误 | `§3` 状态行 = `评审通过` 但最近一轮轮次块无裁定行，`append §5` | 拒（`R-G2b`），§5 字节不变 |
| 正常 | 同一档在该块补 `VERDICT: pass` 后 `append §5` | 写入 |
| 错误 | `§3` 无任何轮次块而状态行 = `评审通过`，`append §5` | 拒（`R-G2b`：无块即无 pass 可依） |
| 错误 | `create{ledger:"#<待核销号>"}` | 拒（`R-C4`），档不落盘、行零改 |
| 边界 | 覆盖行已 `已核销`、本批做同一件事 | `create` 不带 `ledger` 自开一行；§1 写重新开账理由；旧行零改 |
| 正常 | 收口含 1 行 `在途` + 1 行 `待讨论` | 回执建议各贴其行，汇总行只点名 |
| 正常 | `append §3` 携 `VERDICT: pass`（写前 §3 无状态行） | 状态行 = `评审通过`；`§5` 门两判据当场成立 |
| 边界 | 已 pass 的档再 append 一笔携 pass | 状态行字节零改（不重复写痕） |
| 边界 | 打回轮之后 append 一笔携 pass（写前 = `进行中（第 3 轮打回）`） | 状态行回 `评审通过` |
| 错误 | 一笔同携 pass 与打回两行 | 判打回（重置），不置位——`append §3` 已写不进去，此支只经计划函数直调可达 |
| 边界 | 一笔无任何裁定行的 §3 补记 | 状态行零改 |
| 边界 | `append §6` 携一行 pass 字面 | 状态行零改（触发面只认 §3） |
| 正常 | 写前 §3 段头区无状态行，一笔携 `VERDICT: pass`、正文含一行 `**状态行**：进行中（引述）` | 引述行逐字节不变；段头区补出 `**状态行**：评审通过`；轮次块 +1；留痕行 0 |
| 边界 | 同上，但引述行本身写 `**状态行**：评审通过` | 置位仍触发（③ 读段头区 ⇒ 空）：段头区补出 `**状态行**：评审通过`，引述行零改 |
| 边界 | 写前段头区 = `评审通过`、一笔携打回行的正文引述 `**状态行**：进行中（上一轮）` | 段头区 = `进行中（第 N 轮打回）`；引述行零改；留痕行 1 |
| 边界 | `status` 写 §2，段头区有状态行、`###` 之下另有一行 `**状态行**：…` | 段头区那行改写；`###` 之下那行字节不变 |
| 错误 | `§3` 段头区无状态行、块正文引述 `**状态行**：评审通过`，`append §5` | 拒（`R-G2`），§5 字节不变；同档 `close` ∥ `ledger close` ∥ 签发同拒 |
| 边界 | 同上，同档落一笔携 `VERDICT: pass` 的 `§3` | 段头区补出 `**状态行**：评审通过`；引述行字节不变；四处同刻翻绿 |

## 7. 边界（本批不做）

- 不做存量档回填（`§3` 词面 / 档头台账行）：已冻结档字节不动。
- **不为收窄的终态加回落**（`§2.5`）：值读 `unknown` 时仍 fail-closed，唯一出路 = 手改档把 `§1` 状态行移进段头区；拒文点名这条出路（`§5` R26）。
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
- **不扩打回重置的触发面**（`§2.5`）：写 `§3` 不带裁定行不重置状态行；堵洞的是 `§5` 门的判据 2（`§2.6`）。
- **不改 `status` 动作**（`§2.5`）：评审仍可手动写 §3 状态行；本批只让「写块」这一笔自己带上置位。
- **不放宽结算判据**（`§2.5`）：`status-not-passed` 留在签发路径上——它守的是「块与字同轮一致」，本批让字自动到位，不动判据。
- **不改提示词面**：三处「写 §3」指令（`thincoder-core/prompts/advisor-design.md:115` ∥ `thincoder-core/prompts/advisor-round2.md:64` ∥ `thincoder-core/prompts/advisor-round3.md:66`）零改——它们要求的正是置位的触发面，且不含「另写状态行」。`thincoder-core/prompts/**` 对 `action:"status"` 零命中（判据与结果见 §2 上抛项 2）。
- **不改状态机行为**：`ALLOWED_MIGRATIONS` 在盘且正确（`thincoder-core/ledger-db.mjs:163`–`:166`），本批只收正描述面与档面。

## 8. UI / 交互决策

无 UI。交互面 = 工具回执与拒文，全部在 `§2.3`–`§2.7` 逐字给出，无未定项。
「回执要不要给 remediy（恢复动作）」——给了：每条拒文末句都是下一步怎么做（建批档 / 重开补评审 / 换行号）。
回执与拒文面：本批改两处运行时串（`§2.5` 末两条，字面已定），无未定项。

## 9. 集成测试设计（RTM delta）

**本批 delta（`§2.6.1` §3 写入闸）**：

- **破的行 = 14-1**（`test/integration/batch-gates-reanchor.test.mjs`，故事 14「`§5` 只在评审通过后开写」）：它的中段经工具写一笔无裁定的 `§3`（`方案可行，另附两条补记。`），本批起该笔写不进去。改写为三段：① 工具写无裁定行 ⇒ 拒（`R-G3`）；② 夹具直写一笔含无裁定块的存量档（不经工具）⇒ `append §5` 仍拒（`R-G2b`，块内裁定 = 无裁定行）；③ 补一块携 `VERDICT: pass` 的轮次块 ⇒ `append §5` 放行。② 留着是为了 `R-G2b` 对存量块仍可断言。
- **14-1 改写后的四列**（`test/RTM.md` 那一行逐列重写）：交互 = `batch append §3` ↔ §3 写入闸；业务可观察结果 = 无裁定行的一笔 `§3` ⇒ 拒（`R-G3`，字节零改、轮次号不消耗）∥ 夹具直写的存量无裁定块 ⇒ `append §5` 拒（`R-G2b`）∥ 补一块携 `VERDICT: pass` 的轮次块 ⇒ 放行；进入口 = 父侧派设计评审（工程模式 depth-0）→ 评审 `append §3`；服务条目 = R4 + 本批 R1。
- **14-8 作回归支**（`test/RTM.md:184`）：它的第二笔 `§3` 携 `VERDICT: changes-required` ⇒ 只拒两格的放行面下照写入，打回重置与随后的 `§5` 拒逐字照旧 ⇒ 断言语义不动；收口时跑一遍即证「打回没被新闸堵死」。
- **冗余的行 = 无**：27-1（一笔签完）的每一笔 `§3` 都自带裁定行，行为不变。
- **缺的行 = 无**：本批改的是「同一业务结果在哪个时点报出来」——「评审不说结论，批次就不前进」这条断言由 14-1 承担；另立一行会把同一故事写两遍（进入口同为父侧派设计评审，观测面同为批档 `§3`）。
- **2026-11-02 裁定（拒文自身不触发本闸）的 delta = 0**：改的是拒文自身的形，不是任何业务可观察结果——同一输入仍拒、同一输入仍写，只是被拒者照抄拒文时不再把自己锁在外面（那条证据由单测取，`R27` 新增那一格）。
- **套件规模**：总行数不变（本批改 1 行、增 0 行）。

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

**一本 ↔ 行集的 RTM 答复 = 零 delta**：工具行为一条未改，该变更改的是主 agent 点火那一步的判据、提示词，与收口分流的规则面（`§2.7`），没有任何业务可观察结果的断言被改写或新增。这不是「跨组件但无用户可见入口」的豁免，而是**没有可机检的业务结果**——绑没绑对由 `§2.4` 的四步判据读台账与 §1 判，不由集成用例判。

**台账契约五面收正的 RTM 答复——破 3 / 冗余 0 / 缺 0**：

| 行 | 原断言 | 收正之后 |
|---|---|---|
| 14-1（`test/RTM.md` 故事 14） | `§3` = `评审通过` ⇒ `append §5` 写入 | 夹具须让 `§3` 最近一轮轮次块携 `VERDICT: pass`（判据 2）；同行的拒绝半支加一格：块内无裁定行 ⇒ 拒（`R-G2b`）。断言对象（`append §5` ↔ `§3`）不变 |
| 14-5（`test/RTM.md:181`） | 回执末行逐字含「做完的请在收口前 update → 待核销，没做完的 update → 条件 / 已废弃」 | 建议句按类分流（`§2.11`）：末行只点名；断言改到第一 / 第二行的建议句上 |
| 14-8（`test/RTM.md:184`） | 打回后**再 `status` 置 `评审通过`** ⇒ `append §5` 放行 | 判据 2 落地后 `status` 单写不足以开 `§5`（末块仍是携 `changes-required` 的那一块）⇒ 改为「再 pass = **追加一块携 `VERDICT: pass` 的 `§3` 轮次块**」，断言由「再 pass ⇒ 放行」改为「补块 ⇒ 放行」。夹具的拒绝半支与 `§5` 字节不变那条零改 |

**新增行 = 0**：五面收正改的是既有行的断言文本 ∥ 既有一门的一条判据，没有一个新交互面、也没有一个新的用户入口——`R18` / `R19` / `R20` / `R21` 是文案、枚举与既有一表的行，`R22` 是既有门加判据。14-8 的改写同样只是让既有断言按新判据成立（它原本就断言「同一批判的问题在 `§5` 门上可见」，判据换了一条，断言的对象不变）。

**实施轮扫面**：`test/integration/**` 与 `docs/batches/**` 里所有 `append §5` 的夹具，其 `§3` 须先有携 pass 裁定的轮次块——无则被判据 2 拒（这正是判据的本意，命中行随本批改写，逐行记 §5）。

**§3 状态行自动置位的 RTM 答复——破 0 / 冗余 0 / 缺 1**

**破的行 = 0**。三行既有断言逐一核对（改的是夹具的步数，不是被断言的结果）：

| 行 | 原断言 | 本批之后 |
|---|---|---|
| 14-1 | 第二次拒（块内无裁定行）；夹具里「评审写一轮 §3 + `§3 = 评审通过`」两步 | 不动：那一轮的块无裁定行 ⇒ 置位不触发，`status` 仍是那一半的唯一写法；断言逐字不变 |
| 14-8 | 打回那笔改状态行字节；`status` 单写仍拒；补一块携 pass ⇒ 放行 | 不动：补块那一步自己把状态行写成 `评审通过`（写前已是 pass ⇒ 零写），断言逐字不变 |
| 17-1 | pass 但不写 §3 ⇒ 拒；补写 §3 后重评 ⇒ 签发 | 不动：补写那一步现在同时落状态行，断言（签发 / spawn 门放行）逐字不变；夹具少一步手写 `status` |

**新增行（编号先定在 `test/RTM.md`，再写用例标题 `test('<编号> …')`）**

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 服务条目 |
|---|---|---|---|
| 27-1（故事 27） | `batch append §3` ↔ 批档 §3 状态行 ↔ 结算面 / `§5` 写入门 | 绑本档的评审只写一笔携 `VERDICT: pass` 的 §3（不另写状态行）⇒ §3 状态行 = `评审通过`、结算签发 token、随后 `append §5` 放行 | R23 |

**定位面收窄的 RTM 答复——破 0 / 冗余 0 / 缺 0**。

- 27-1 的夹具是一笔只携 `VERDICT: pass` 的 §3（正文不含 `**状态行**：` 行）；17-1 / 14-1 / 14-8 的夹具同为直写档或只有裁定行，无一含引述行 ⇒ 断言对象零变。
- **引述行不被改写不进集成面**：它判的是同一入口里一笔写盘的字节后果，而业务可观察结果 = 「评审写一笔即签字」，正是 27-1 已断的那一条；引述行保住是同一结果的另一个必要肢，由改时单测取证（`§5` R23）。
- 父侧若要把引述行纳入 27-1 的断言，实施轮在 `test/RTM.md` 该行补一句即可（本档不改 `test/`）。

**进入口** = 父侧派设计评审（工程模式 depth-0）→ 读回执，与 17-1 同一入口；17-1 判「没写 §3 ⇒ 不签发」，27-1 判「写了一笔就够」。

**实施轮扫面（本条的）**：`test/integration/**` 里凡断言「携 pass 的那一笔之后状态行**仍**是 `进行中`」的夹具，本批之后必红——命中行按断言本意改写，逐行记 `§5`。

- **历史 delta 块不追改**：本档 `§9` 上方各轮的 delta 表记的是各自那轮的状态（含 27-1 的「新增行」块），不回补笔迹——RTM 的现状以 `test/RTM.md` 为准。
