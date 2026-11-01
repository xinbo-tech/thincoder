# 2026-11-01 · evidence-naming-fix
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 12:19 逐字「可以」——批准把台账的 `evidenceOversize` 键名与相关描述从「尺寸超标」改成「文字太长、读不下去」的说法。前一轮用户已裁定（12:17）：「300字我们不是早就约定过不能用宽度超标表述吗？我说的是文字太长难于阅读」。。
> 台账 = #1947（LEDGER · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1947**

### 1.1 这一批治什么

**一条读数用「尺寸」命了名，而它想说的是一件「读起来」的事。**

**判据单源**（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.23，用户 2026-10-22 12:09 裁定）：

> **「行宽超标」这个说法本身把问题说错了。真正让人读不下去的，是一段文字太长，读者一口气读不完；而「行宽」说的是排版。名字错了，处理方式就跟着错。**

**现盘有三处从「量」那一侧命名**：

| 坐标 | 现文 |
|---|---|
| `thincoder-core/tool-docs/ledger.md:7` | `evidenceOversize`（evidence **超软上限 300 字**——读数非拒写） |
| `thincoder-core/tool-docs/ledger.md:8` | `evidenceOversize` = 其中 evidence **超限**行数 |
| `thincoder-core/ledger-cmd.mjs:53` | `const isEvidenceOversize = (row) => … String(row.evidence).length > EVIDENCE_SOFT_LIMIT` |

**为什么两套口径从没碰面**：段落判据住在 `docs/core/design/DOC-DISCIPLINE.md` §3.18（单位是段、量的是「这一段读不读得下去」），这条读数住在 `thincoder-core/ledger-cmd.mjs`（量的是字符数）。**落地时按实现取了名，没回头对一遍 §13.23。**

### 1.2 名字错了，处理方式就跟着错（这是本批真正要修的）

| 名字 | 读到的人会怎么做 |
|---|---|
| 「超软上限 / 尺寸超标」 | **把字删短凑到 300 以内** —— 细节还在行里，只是被打碎了 |
| 「太长、读不下去」 | **把细节搬回它该在的档，行里只留症状 + 坐标 + 指针** |

**后者才是这条读数想让人做的事。** 行里塞满来龙去脉，坏的不是「字数」，是**池子扫不动**：未决 45 行时有 38 行越线，`ledger count` 报的正是这个数 —— **而它现在叫「超标」，读起来像一道要凑的考试。**

### 1.3 用户裁定与路线

- **2026-11-01 12:17 逐字**：「300字我们不是早就约定过不能用宽度超标表述吗？我说的是文字太长难于阅读，为什么到这里还是宽度超标？」
- **12:19 逐字**：「可以」—— 批准改键名（不只是改描述）。
- **12:19 逐字**：「**不要走轻通道！**」—— **本批走全链**：设计 → 评审 → 批准 → 实施。

### 1.4 射程（父侧实扫，不是估计）

| 面 | 坐标 | 处数 |
|---|---|---|
| 产品码 | `thincoder-core/ledger-cmd.mjs`（11 / 31 / 51-53 / 95 / 111 / 122 / 131 / 133 / 139-140）· `thincoder-core/ledger-db.mjs:147`-`:150` · `thincoder-core/ledger.mjs:156`-`:157` | 3 档 |
| 对外读数面 | `thincoder-cli/src/acp/read-data.mjs:76`（注释）· `ledger` 工具的 `query` / `count` 出参键 | 2 处 |
| 描述面 | `thincoder-core/tool-docs/ledger.md:7`-`:8` | 2 行 |
| 设计档 | `docs/core/design/LEDGER.md`（23 处） | 1 档 |
| 生成面 | `docs/core/design/API-CONTRACT.md`（5 处） | 1 档（**走生成器，别手改**） |

### 1.5 设计席要判的四件（父侧不预设）

① **新名**：英文键名 + 中文描述各叫什么。判据 = §13.23（**名字要说真正的问题**），不是「比原来短一点」。

② **旧键要不要留别名**：`evidenceOversize` 会出现在两处对外面 —— `ledger` 工具的 `query` / `count` 出参，与 `thincoder-cli` 的 ACP `read-data`（`ledger list --json` 那条链）。**这是本批唯一的真实分歧点**：本仓有「兼容只在对外契约面才做」的口径，而这条算不算对外契约要你判 —— **判据给出来，别二选一随便挑。**

③ **设计档 23 处怎么同步**：`docs/core/design/LEDGER.md` 里既有「P4 读数面」的机制描述，也有历史批次的读数记录。**哪些该改、哪些是已收口批次的账不该回头改**，逐类给出判法。

④ **要不要一条机检锁**：这次是「同一件事在两个面各说一套」漂了这么久。**是加一条判据（如「读数名不得取自量词」），还是这只是一次性改名** —— 给理由。

### 1.6 边界

- **不改判据值**：300 这个数不动（它是对的），**只动它叫什么**。
- **不动 `ledger` 的状态机与迁移表**（与本批无关）。
- **不手改 `docs/core/design/API-CONTRACT.md` 的生成区**——走生成器重跑。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-11-01

## 一、本批条目（覆盖）

本批只有一件事：台账的 `evidence` 读数从「按量命名」改成「按读起来怎样命名」。

不新增读数、不改判据值、不改状态机。

| # | 条目 | 判据来源 |
|---|---|---|
| 1 | 读数键与中文描述换名：`evidenceOversize` ⇒ `evidenceTooLong`，中文名复用「文字太长，难于阅读」 | 用户 2026-11-01 12:17 ∥ 12:19 逐字；`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.23 判据 2 |
| 2 | 阈值常量换名：`EVIDENCE_SOFT_LIMIT` ⇒ `EVIDENCE_TOO_LONG_MAX`（值 300 不动） | 同上（`SOFT_LIMIT` 说的是「一条能挤的线」，正是把人推向凑数；`TOO_LONG_MAX` 量的是被量物——与 `paragraphMax` 同形，不替读者的感受作断言） |
| 3 | 不新增别名（两面逐面判，判据见 §二②） | 「兼容只在对外契约面才做」——先判「谁能在两个版本上」 |
| 4 | 设计档与描述面同步（逐类判法见 §二③） | D8（规范面失效表达必删）∥ D2（单一权威源） |

**需求档零改**：`docs/core/requirements/` 下 `evidenceOversize` ∥ `EVIDENCE_SOFT_LIMIT` 逐档 grep = **0 命中**（本席实扫）。

需求端不变 ⇒ 三链一致性的需求侧不动，本批不触需求档。

## 二、取名与四个判断

### ① 新名（判据 = §13.23 判据 2「名字说出问题本身」）

| 现名 | 新名 | 为什么是这个名 |
|---|---|---|
| `evidenceOversize` | `evidenceTooLong` | `Oversize` 是量词（大小），读到的人去删字数；`TooLong` 说的是「太长」，指着读者的时间，不指着字数 |
| `EVIDENCE_SOFT_LIMIT` | `EVIDENCE_TOO_LONG_MAX` | `SOFT_LIMIT` 说「一条可以挤一挤的线」；`TOO_LONG_MAX` 说「判成太长的这条线上限在哪」 |
| `ledgerEvidenceOversize` | `ledgerEvidenceTooLong` | 与键名 1:1（同名同物） |
| 中文「evidence 超软上限 300 字」∥「超限行数」 | 「evidence 文字太长，难于阅读」∥「其中文字太长、难于阅读的行数」；阈值另起一句「超 300 字即算命中」 | 名字取自 `thincoder-core/doc-check/paragraph.mjs:19`（`para: "文字太长，难于阅读"`）；§13.23 判据 2 要求「不报字符数」⇒ 字数写在名字之外的下一句，不塞进括注 |

**常量名为什么回到「被量物的上限」形**：`READABLE_MAX` 会被读成「到这里为止都读得下去」，而没有任何读数支撑这句话。判据档只给到 `docs/core/requirements/ENGINEERING-MODE-V2.md:1023`「一段 300 字其实已经挺长的了」——一句阈值判断，不是可读性实测。

在案反证：同库 57 行越线照跑（`docs/batches/2026-10-19-tech-sweep-ledger-mech.md:286` 记 `"evidenceOversize":57`）。常量名不该替一个软约定作事实断言。

`TOO_LONG_MAX` 与 §13.23 判据 2 自己举为正确形的 `paragraphMax`（`thincoder-core/doc-check/index.mjs:24`）才是真同形：都量被量物（文档里的一段 ∥ 台账一行的 `evidence`），不量读者的体验。

**不选的名字**：`evidenceUnreadable`——把「读不下去」说成「不能读」，说重了会让人去删行而不是搬细节；`evidenceLengthLimit`——换了个量词，问题没换；`EVIDENCE_READABLE_MAX`——把没实测的可读性写进了常量名（本席设计轮所取，评审轮 1 发现 2 判非，本块作废）。

**最近先例行**：先例 = `docs/core/design/LEDGER.md` §3.5 的 P4 先例行 ∥ §3.7 的逐行计算字段先例行（同档体例 = 先例坐标 + 对齐 + 偏离）。最近的同类改名批 = `docs/batches/2026-10-26-doc-check-wording.md`（`width` ⇒ `paragraph`：常量 `lineWidth` ⇒ `paragraphMax`、模块与报面同时换名）。

**对齐** = 同一条判据（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.23 判据 2）、同一手法（常量 ∥ 模块 ∥ 报面同拍换名，阈值值不动）、同一取舍（不留旧名）。**偏离** = 本批不换度量单位、不改引擎、不加机检锁——那边错的是「量什么」（行 ⇒ 段），这里错的是「叫什么」（量 ⇒ 读感），判据式逐字不变。

**勘察证据行**：查过 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.23（四条判据）∥ `docs/core/design/LEDGER.md` §5 ∥ §7.1 ∥ §8（AC-M2-31）——**相关**。

同一轮还查过 ACP 侧两处：`docs/cli/design/READ-DATA-INTERFACE.md:123`（§3.3 ACP 方法表）∥ `:220`（用例 RDI-7）——**相关**。

声明源 = `PROJECT-MANIFEST.json` `index.publicRepos` = **`[]`** ⇒ 无仓外声明源可查（照记）。**结论 = 无仓外声明源相关**。

**既有件三问（同一个 300）**：`existing` = `thincoder-core/doc-check/index.mjs:24` 的 `paragraphMax: 300,` · 名字逐字 = `paragraphMax` · 消费方 = `thincoder-core/doc-check/paragraph.mjs`（段判据阈值）。

**不复用**：面不同（文档纪律引擎 ∥ 台账核心）、被量物不同（文档里的一段 ∥ 台账一行的 `evidence` 字段）、复用会造一条跨模块新边——两个阈值本该各自可调，绑在一起后改一边另一边静默跟着动。

**对齐的只是命名形**（`<被量物>Max`），不是那个数。

### ② 别名：不留 —— 判据句在这里

**判据**：留别名只在「产方与消费方能停在两个版本上」时成立。

两者永不同步错位时，别名零收益，还带来第二处「一件东西两个名字」。

| 对外面 | 消费方 | 判定 |
|---|---|---|
| `ledger` 工具 `query` / `count` 出参 | 模型（同进程 · 同回合 · 同一份构建） | **不留**——产方即消费方，永不错位；出参同时挂两个名，等于把本批要治的病搬上线 |
| ACP `ledger/count`（`thincoder-cli/src/acp/read-data.mjs:77`） | 扩展（VSC ∥ 桌面） | **这一面才有资格留**（拥有档 = `docs/cli/design/READ-DATA-INTERFACE.md:123`，是真契约面）；**但资格不等于该留**，见下 |

ACP 面不留的实证：本仓源码全扫（扫描域 = 当前仓 `*.mjs`，**不含已发布产物**）旧名在核三档合计 **13 行**（本席按行实扫：`thincoder-core/ledger-cmd.mjs` 11 行 = `:11` / `:31` / `:95` / `:111` / `:115` / `:117` / `:118` / `:122` / `:133` / `:139` / `:140`；`thincoder-core/ledger-db.mjs` 2 行 = `:148` / `:150`）。

其余命中四类（同一次扫描）：集成用例（`test/integration/ledger-read-cross-project.test.mjs:59` / `:162`）· ACP 面一行注释（`thincoder-cli/src/acp/read-data.mjs:76`）· 描述面（`thincoder-core/tool-docs/ledger.md:7` / `:8`）· 再出口面（`thincoder-core/ledger.mjs:156` / `:157`）。

**「源里没人读」不等于「已发布扩展没人读」**：本席读到的是当前仓源码，不含装到用户机器上的旧包。兜底是方向不对称——后补别名是纯增量、零风险，撤别名要自己走一轮废弃窗口。

**零处按键名读取**——`:77` 原样直传核对象，不碰键。

决定这一条的是方向不对称：后补别名是纯增量（加一个键，旧消费方立刻复原，零风险）；撤别名要自己走一轮废弃窗口。

所以可逆方向 = 现在改名；真有仓外消费方停在旧版本时再补一个别名，代价一行。

### ③ 设计档同步：逐类判法（不一把 sed）

**这一面已经在盘**：`docs/core/design/LEDGER.md` 此刻旧名 **0 处**、新名 **20 行**。落笔 = 本席在设计轮直接改该档（`git status` 报该档 M、未提交）。

逐行坐标（本块实读）：`:323` · `:392` · `:453` · `:489` · `:726` · `:828` · `:855` · `:866` · `:869` · `:881` · `:883` · `:1162` · `:1179` · `:1180` · `:1182` · `:1217` · `:1307` · `:1390` · `:1393` · `:1432`。

先前的设计稿写「本席逐行实读命中 **25 行** ⇒ 本批触 **24 行**」，与此刻盘面不符：那些行已在设计轮改完，旧名计数为 **0**——「24 行待改」是空操作，验收里的相等式恒不成立。本块按现状重写；「23 处 ∥ 25 行 ∥ 24 行」三个计数一并作废。

**本批剩余面** = 产品码 + 描述面 + `docs/cli/design/READ-DATA-INTERFACE.md` + `docs/core/design/API-CONTRACT.md` + 测试。

设计档侧只剩一件：常量名随本块改判（`EVIDENCE_READABLE_MAX` ⇒ `EVIDENCE_TOO_LONG_MAX`，6 行 = `:323` ∥ `:726` ∥ `:869` ∥ `:883` ∥ `:1182` ∥ `:1307`），已落。键名零改——已在盘且内容正确。

| 类 | 坐标 | 判法 | 理由 |
|---|---|---|---|
| 设计档机制契约面 | `docs/core/design/LEDGER.md`（20 行） | **设计轮已改；本块只随常量名改 6 行** | 设计档只载当前真值；读数键名是接口契约的一部分，留一处旧名 = 规范面同时活着两个名字 |
| 已收口批次的账 | `docs/batches/**` | **零触碰** | 那是别人已结算的账，回改 = 改写别人的账；活档旧名清零的读数本来就把批档排除 |
| API 契约档生成区 | `docs/core/design/API-CONTRACT.md:1390` ∥ `:1410` ∥ `:1467` ∥ `:1468`（以 `:4638` 的 `<!-- END GENERATED -->` 为界） | **重跑 `node scripts/api-contract.mjs --write`，不手改** | 生成区由生成器唯一笔 |
| API 契约档语义区 | 同档 `:4699`（`ledgerCount` 返回值列） | **手改** | 该行实居语义区（`:4640` 起「语义区（人工唯一笔——生成器零触）」，生成器零触） |
| ACP 契约拥有档 | `docs/cli/design/READ-DATA-INTERFACE.md:123` ∥ `:220`（RDI-7 用例） | 改 | 当前真值，且该面是本批两个对外面之一 |
| 模型可见描述面 | `thincoder-core/tool-docs/ledger.md:7` ∥ `:8` | 改 | 模型每次调 `ledger` 读的就是这两行；键改了描述不改，读到的契约与实现对不上 |

**超前声明登记**：设计档 `:1162` 已把 `ledgerEvidenceTooLong` 记进「已落地」段、`:869` 已把常量写成新名，而产品码此刻仍是旧名（`thincoder-core/ledger-db.mjs:150` 实读 `export const EVIDENCE_SOFT_LIMIT = 300`）。这是设计面先落、实施面后跟的次序，不是漏改；§5 落盘后两面齐。登记在此，免被读成「已实现」。

### ④ 机检锁：不加语义锁，加一条收口读数

**不加**「读数名不得取自量词」这类判据。理由两条，都有据：

1. **机器判不了**：判「一个词是不是量词」没有可执行形。

写黑名单会误伤 `paragraphMax`——而 §13.23 判据 2 自己把这个 `Max` 形举为正确命名。锁会与实际判据相抵。

2. **本面没有同构的静默失效路径**：doc-check 那次必须加锁，是因为统计按字面比类名（`h.clazz === "段太长"`），改名后恒计 0、报面显示 0 段而实际有命中——静默错数。

本面的三个出参点同函数体同屏；ACP 面又有集成用例钉住键名（`test/integration/ledger-read-cross-project.test.mjs:59` 的 `B_EXPECT` 逐字含该键）⇒ 改名漏一处**当场红**，不是静默。

漂移的真实成因不是缺锁，是两个面从没对过口径：`thincoder-core/ledger-cmd.mjs:53` 按实现取名，没回看 §13.23。

锁拦不住起名那一刻的判断；能拦的是起名之后回头对一遍，那已由 §13.23 判据 2 承载。加锁会变成用户担心的「又一个要应付的考试」。

**改加的是一条收口读数**（不是常驻判据）：旧名在活档与产品码 grep = 0（排除 `docs/batches/`）。一次性的，跑完就完，不进任何门。

## 三、机制设计（改什么、改成什么）

| 档 / 坐标 | 现在 | 改成 |
|---|---|---|
| `thincoder-core/ledger-db.mjs:147`–`:150` | `EVIDENCE_SOFT_LIMIT = 300` + 「软上限（字）」注 | `EVIDENCE_TOO_LONG_MAX = 300` + 「过了这条线即判为太长」注；**值零改** |
| `thincoder-core/ledger-cmd.mjs:31` | import 旧常量 | 随名 |
| `thincoder-core/ledger-cmd.mjs:51`–`:53` | `isEvidenceOversize` + 注释「`evidence` 超限读数」 | `isEvidenceTooLong` + 「`evidence` 文字太长」注（判据式逐字不变：`length > EVIDENCE_TOO_LONG_MAX`） |
| `thincoder-core/ledger-cmd.mjs:11` ∥ `:95` ∥ `:115` ∥ `:117` ∥ `:118` ∥ `:137` | 注释行含旧键名 ∥ 「超限」措辞 | 随名 + 「文字太长」措辞（注释与实现同拍，否则旧名 grep 归不了零） |
| `thincoder-core/ledger-cmd.mjs:111` | `evidenceOversize: isEvidenceOversize(r)` | `evidenceTooLong: isEvidenceTooLong(r)` |
| `thincoder-core/ledger-cmd.mjs:122` ∥ `:133` | 零形 ∥ 真形带旧键 | 同改新键（三键形保持不变） |
| `thincoder-core/ledger-cmd.mjs:139`–`:140` | `ledgerEvidenceOversize` | `ledgerEvidenceTooLong`（仍为 `ledgerCount` 薄委托，零第二判定面） |
| `thincoder-core/ledger.mjs:156` ∥ `:157` | 两处再出口含旧名（`EVIDENCE_SOFT_LIMIT` ∥ `ledgerEvidenceOversize`） | 随名 |
| `thincoder-cli/src/acp/read-data.mjs:76` | 注释「出参 = 对象形 `{ count, overdue, evidenceOversize }`」 | 随名（`:77` 直传核对象，`boundary` 传参不动） |
| `thincoder-core/tool-docs/ledger.md:7` | 「evidence 超软上限 300 字——读数非拒写」 | 「evidence 文字太长，难于阅读——读数非拒写；超 300 字即算命中」 |
| `thincoder-core/tool-docs/ledger.md:8` | 「evidence 超限行数」 | 「其中文字太长、难于阅读的行数」 |
| `docs/cli/design/READ-DATA-INTERFACE.md:123` ∥ `:220` | 三键旧名 | 三键新名 |
| `docs/core/design/LEDGER.md`（20 行） | 键名已是新名（**设计轮已落**）；常量名仍为 `EVIDENCE_READABLE_MAX` | 键名零改；常量名 6 行改 `EVIDENCE_TOO_LONG_MAX`（`:323` ∥ `:726` ∥ `:869` ∥ `:883` ∥ `:1182` ∥ `:1307`）；中文描述同拍 |
| `docs/core/design/API-CONTRACT.md:1390` ∥ `:1410` ∥ `:1467` ∥ `:1468` | 生成区四行含旧名（`:1390` fn 行 · `:1410` 常量 const 行 · `:1467` 常量导出索引 · `:1468` 函数导出索引） | **重跑 `node scripts/api-contract.mjs --write`**，不手改（以 `:4638` 的 `<!-- END GENERATED -->` 为界） |
| `docs/core/design/API-CONTRACT.md:4699` | 语义区 `ledgerCount` 返回值列含旧键 | 手改（语义区 = `:4640` 起，生成器零触） |
| `test/integration/ledger-read-cross-project.test.mjs:59` ∥ `:162` | 断言字面含旧键 | 随名（业务结果与交互不变） |
| `test/RTM.md:254`（行 21-4「怎么算通过」列） | 含旧键 | 随名 |

**判据本体零改**：`String(evidence).length > 300` 逐字不动；`count` 的统计集（未决四态）不动；「读数非闸门、写入不拒」不动。

## 四、受影响文件与测试覆盖

**档位结论**：无档跨档位。五档逐档读实（文件末行号）= `thincoder-core/ledger-cmd.mjs` **336** ∥ `thincoder-core/ledger-db.mjs` **276** ∥ `thincoder-core/ledger.mjs` **161** ∥ `thincoder-cli/src/acp/read-data.mjs` **147** ∥ `test/integration/ledger-read-cross-project.test.mjs` **163**——无一越 500 顾问线。

本批为纯改名（净行数 ±0），零拆分义务。纯 `.md` 档按既有口径不列行数。

**受影响文件**：

- 产品码 = `ledger-db.mjs` ∥ `ledger-cmd.mjs` ∥ `ledger.mjs` ∥ `thincoder-cli/src/acp/read-data.mjs`（只改注释一行，`boundary` 传参不动）
- 描述面 = `thincoder-core/tool-docs/ledger.md`
- 设计档 = `docs/core/design/LEDGER.md` ∥ `docs/cli/design/READ-DATA-INTERFACE.md` ∥ `docs/core/design/API-CONTRACT.md`（生成器重跑）
- 测试面 = 批内单测档 + `test/integration/ledger-read-cross-project.test.mjs` + `test/RTM.md`

**用例表（批内单测档，名随批 · 收口轮删除）**：

| 号 | 类 | 输入 | 期望 |
|---|---|---|---|
| N1 | 正常 | 未决行 `evidence` = 301 字 | `query` 该行 `evidenceTooLong === true`；`count.evidenceTooLong === 1` |
| N2 | 边界 | 同一行 300 字 ∥ 301 字 | 300 字 ⇒ `false`；301 ⇒ `true`（阈值语义逐字未变） |
| N3 | 边界 | 缺 `evidence`（`null`）∥ 空串 | 两者皆 `false`（不改判） |
| N4 | 错误 | `count` 出参键集 | 恰 `{ count, overdue, evidenceTooLong }`；`"evidenceOversize" in 出参 === false`（旧键不留） |
| N5 | 正常 | `EVIDENCE_TOO_LONG_MAX` 取值 | `=== 300`；`EVIDENCE_SOFT_LIMIT` 已不可导出（`undefined`） |
| N6 | 正常 | 写一行 301 字 `evidence` | 写入**不拒**、行已落（「读数非闸门」零回归） |

## 五、验收对照（逐条回指 §一）

**实施轮直接跑的脸**：单测档 = `docs/batches/2026-11-01-evidence-naming-fix.test.mjs`（名随批 · 收口轮删除）；命令 = `node --test docs/batches/2026-11-01-evidence-naming-fix.test.mjs`。集成侧本批不改跑——集成行只在收口线报。

| 条目 | 机判断言 |
|---|---|
| 1 | N1–N4：出参键 = `evidenceTooLong`，旧键不存在；ACP `ledger/count` 回包同三键 |
| 2 | N5：常量名与新值；且 `thincoder-core/ledger-cmd.mjs:53` 判据式逐字含 `EVIDENCE_TOO_LONG_MAX` |
| 3 | N4 的负向臂：`"evidenceOversize" in 出参 === false`（别名没被偷偷留下） |
| 4 | 活档与产品码旧名 grep = **0**（排除 `docs/batches/`）∧ `docs/core/design/LEDGER.md` 新名命中 **≥ 20 行** ∧ 该档 `EVIDENCE_READABLE_MAX` 命中 = **0**（常量名已随本块改判） |
| 5 | 两面同拍：同一份 grep 里 `evidenceTooLong` ∥ `ledgerEvidenceTooLong` ∥ `EVIDENCE_TOO_LONG_MAX` 三枚在设计档与产品码各自在场、无一缺项——治的正是「同一件事两个面各说一套」 |

**集成面 delta（`test/RTM.md`）**：破行 **1** = 故事 21 行 `21-4`（其断言逐字含旧键 ⇒ 改新键名；评的交互与业务结果均不变）。四要素：**评的组件交互** = ACP `ledger/count` 处理器 → 核 `ledgerCount` 出参键 → 扩展读面；**业务可观察结果** = 跨项目计数三键同名可读（`count` ∥ `overdue` ∥ 太长行数）；**服务需求** = `docs/cli/design/READ-DATA-INTERFACE.md:220` 的 RDI-7 用例；**本仓入口** = 扩展拉取选中项目的台账。

冗余 **0**。新增 **0**——改名不产生新业务场景，按纪律不造用例。

## 六、关键决策

- **K1 中文名复用 doc-check 的名，不新起第二个**：同一个毛病在第二处换个说法，就是本批要治的病本身。判据 = 一词一物。
- **K2 不留别名**：判据 = 「能不能停在两个版本上」，加方向不对称（后补是增量、撤要窗口）。可逆方向优先。
- **K3 常量一起改**：只改键名、留着 `SOFT_LIMIT`，等于同一行里一半改成「读不下去」、一半还写着「软上限」——同一层里的那个分裂，本批就是来治它的。
- **K4 不加语义锁**：机器判不了「量词」；黑名单会误伤 `paragraphMax`（§13.23 自己认可的形）。
- **K5 常量名不用 `READABLE_MAX`**：判据档只给到「300 字已经挺长的了」（`docs/core/requirements/ENGINEERING-MODE-V2.md:1023`），没有「≤300 读得下去」的读数；把这句话写进名字 = 让软约定冒充事实。改 `EVIDENCE_TOO_LONG_MAX`，与判据 2 自己认可的 `paragraphMax` 真同形（量被量物的上限）。设计轮所取的 `EVIDENCE_READABLE_MAX` 在此作废。

## 七、边界（本批不做）

- 不改 300 这个值，不改判据比较式，不改 `count` 的统计集。
- 不动台账状态机 ∥ 迁移表 ∥ 写门 ∥ 收口重锚。
- 不手改 `docs/core/design/API-CONTRACT.md` 的生成区（走生成器重跑）。
- 不改任何 `docs/batches/**` 里的已收口账。
- 不做存量 `evidence` 行文的清理：那些行要在清扫轮把细节搬回它该在的档，本批只改名、不动行。

## 八、上抛项 / 报项

**上抛项 = 无**。四件都给了判据，无待裁项。

**报项（一致性面，本席已就地判，父侧复核即可）**：

1. 设计档侧改名**由本席在设计轮落笔**（`docs/core/design/LEDGER.md`：旧名 0 / 新名 20 行，工作树未提交）。评审轮 1 发现 1 据此重写 §二③ 与验收 4；「23 处 ∥ 25 行 ∥ 24 行」三个计数一并作废，不再作判据。
2. `docs/core/requirements/` 全域零命中 ⇒ 本批无需求档改动，无需求侧上抛。
3. **本席另见一条（只报不改，留父侧裁）**：`docs/core/design/LEDGER.md:323` 的 P4 三枚实现坐标 `:43` / `:101` / `:123` 与实读不符——`:43` = `function isRowAged(row, now) {`、`:101` = `if (!db) return []`、`:123` = `try {`，均非 P4 判点。同档 `:869` 自己给的 P4 坐标 = 常量 `thincoder-core/ledger-db.mjs:150` · 判真 `thincoder-core/ledger-cmd.mjs:53` · `query` `:111` · `count` `:133`。属存量陈旧指针（`git diff` 显示该三枚坐标随原行原样带入，非本批引入）⇒ 本批只报不改。

### 修正块 1（fix 轮 · 评审轮 1 发现 1–10 逐号 · eng-designer · 2026-11-01）

来由 = 本档 §3 轮次 1（changes-required · 🔴1 · 🟡6 · 🔵3）。形态 = 段内就地订正（上面各节已改讫）+ 本块逐号记录。零新语义：每条改动 = 评审发现 + 父侧处置的直接导出。

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | 设计档侧改名据实登记：落笔 = 本席在设计轮直接改 `docs/core/design/LEDGER.md`（工作树未提交），旧名 0 行 / 新名 20 行。「24 行待改」与验收 4 的相等式作废，改成可成立形；并登记超前声明（`:1162` ∥ `:869` 已携新名、产品码仍是旧名的先后次序，不是漏改） | §二③ 整节重写 · §五 验收 4 · §八 报项 1 |
| 2 🟡 | 常量名改判：`EVIDENCE_READABLE_MAX` ⇒ `EVIDENCE_TOO_LONG_MAX`（判据档没有「≤300 读得下去」的读数，名字不替软约定作断言）；设计档 6 行随改 | §一 条目 2 · §二① · §三 · §四 N5 · §六 K5 · 设计档 `:323` ∥ `:726` ∥ `:869` ∥ `:883` ∥ `:1182` ∥ `:1307` |
| 3 🟡 | 中文名只留「evidence 文字太长，难于阅读」，阈值另起一句；去掉「逐字复用」的说法，改记名字取自 `thincoder-core/doc-check/paragraph.mjs:19` + §13.23 判据 2「不报字符数」的口径 | §二① 第四行 · §三 描述面两行 |
| 4 🟡 | 补最近先例行（先例坐标 + 对齐 + 偏离） | §二① |
| 5 🟡 | 补勘察证据行（查过的五面 + 声明源 `index.publicRepos = []`） | §二① |
| 6 🟡 | 坐标表补全：`thincoder-core/ledger-cmd.mjs` 六行注释（`:11` `:95` `:115` `:117` `:118` `:137`）· `thincoder-cli/src/acp/read-data.mjs:76` · `docs/core/design/API-CONTRACT.md:1390` / `:1410` / `:1467` / `:1468`（以 `:4638` 的 `<!-- END GENERATED -->` 为界）+ 语义区 `:4699` · 测试两行 | §三 表 · §二③ 表 |
| 7 🟡 | 验收补可执行面：单测档路径 + `node --test` 命令；集成侧不改跑 | §五 首段 |
| 8 🟡 | 档位结论补三档读数（161 ∥ 147 ∥ 163），使「无档跨档位」逐档可复核 | §四 |
| 9 🔵 | 既有件三问：`paragraphMax` 坐标 + 为何不复用；中文名坐标由已收口批档改指活档 `thincoder-core/doc-check/paragraph.mjs:19` | §二① |
| 10 🔵 | 集成面 delta 补四要素（组件交互 ∥ 业务可观察结果 ∥ 服务需求 ∥ 本仓入口） | §五 |
| 11 🔵 知会 | 「零处按键名读取」成立；补扫描域（当前仓源码，不含已发布产物）与按行读数 13 行 | §二② |

**本轮自检读数**（本席实扫 2026-11-01）：`docs/core/design/LEDGER.md` 旧名 = 0 行 · 新名 = 20 行 · `EVIDENCE_READABLE_MAX` = 0 行。产品码与描述面仍是旧名——那是 §5 的面，本批设计轮零触。

**边界**：只动本档 §2 与 `docs/core/design/LEDGER.md`；产品码 ∥ 描述面 ∥ 测试 ∥ ACP 契约档 ∥ API 契约档零触（实施轮笔）。**另见 §八 报项 3**（存量陈旧指针，只报不改）。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审 · 2026-11-01 · evidence-naming-fix（§2 设计档）

评审对象 = 批档 §2 设计（`2026-11-01-evidence-naming-fix.md:72`–`:239`）∥ `docs/core/design/LEDGER.md` ∥ `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.23。

实扫域 = `D:\teamcode`（`**/*.{cs,ts,mjs,js,json,md}`）。逐档实读：`thincoder-core/ledger-cmd.mjs` · `thincoder-core/ledger-db.mjs` · `thincoder-core/ledger.mjs` · `thincoder-cli/src/acp/read-data.mjs` · `docs/core/design/API-CONTRACT.md`。

外加：`test/integration/ledger-read-cross-project.test.mjs` · `thincoder-core/doc-check/index.mjs` · `thincoder-core/doc-check/paragraph.mjs`。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 验收 / 清晰 | 🔴 | **设计档最大的那个面已经不是它读到的状态**。§二③ 称「本席逐行实读 `docs/core/design/LEDGER.md` 命中 **25 行**……⇒ **本批触 24 行**」（`:131`），§三 表列「`docs/core/design/LEDGER.md`（24 行）\| 旧名 \| 新名」（`:175`），验收 4 写「`docs/core/design/LEDGER.md` 新名命中数 = 旧名命中数（24 行，逐行可数）」（`:211`）。评审时实扫：**该档旧名命中 = 0 行，新名命中 = 20 行**（`:323`/`:392`/`:453`/`:489`/`:726`/`:828`/`:855`/`:866`/`:869`/`:881`/`:883`/`:1162`/`:1179`/`:1180`/`:1182`/`:1217`/`:1307`/`:1390`/`:1393`/`:1432`）：`:883` 已逐字写「**阈值** `EVIDENCE_READABLE_MAX` = 300 字（`ledger-db.mjs` 常量单源」，`:1162` 已把 `ledgerEvidenceTooLong` 记进「已落地」段；而同刻产品码 `thincoder-core/ledger-db.mjs:150` 仍是 `export const EVIDENCE_SOFT_LIMIT = 300`。后果三件：① 「24 行待改」是空操作；② 验收 4 的等式不可能成立；③ 该档此刻拿新名指不存在的实现名（`:869` 指「判真 `thincoder-core/ledger-cmd.mjs:53`」，而 `:53` 是旧常量）。§八 报项 1（23 处 vs 25 行）随之失效 | 按评审时实扫重写这一面：写明「该档侧改名已在盘（旧名 0 / 新名 20 行），本批剩余面 = 产品码 + 描述面 + `docs/cli/design/READ-DATA-INTERFACE.md` + `docs/core/design/API-CONTRACT.md` + 测试」；验收 4 改成可成立形（如「活档旧名 grep = 0 ∧ 该档新名命中 ≥20 行」）；另登记 `:1162` 的「已落地」句在落地前是超前声明；若那些新名非本批所加，先查清哪个轮次落的、为何无账，再定本批射程 |
| 2 | 需求覆盖 / 取名 | 🟡 | **`EVIDENCE_READABLE_MAX` 把没实测的断言说成了事实**：`:102`「`READABLE_MAX` 说「过了这里就读不下去」」。判据档给的只是阈值判断——`docs/core/requirements/ENGINEERING-MODE-V2.md:1023`「一段 300 字其实已经挺长的了」，没有任何读数说 ≤300 就读得下去；反证在案读数 `2026-10-19-tech-sweep-ledger-mech.md:286` 的 `"evidenceOversize":57`（同库 57 行越线、照样在跑）。且 `:106`「与 §13.23 判据 2 自己认可的 `paragraphMax` 同形」只同后缀：`paragraphMax`（`thincoder-core/doc-check/index.mjs:24`）说的是被量物的上限，`READABLE_MAX` 说的是读者体验 | 二选一且写明依据：(a) 回到「被量物的上限」形（如 `EVIDENCE_TOLONG_MAX`），与 `paragraphMax` 真正同形；(b) 保留 `READABLE_MAX` 但在设计档登记其证据，或明写「约定阈值，非实测可读线」，别让常量名替软约定作事实断言 |
| 3 | 文档归属 / 需求对齐 | 🟡 | **中文名不是「逐字复用」，且把字符数塞回了名字行**：`:104` 称「逐字复用产品已有的名（doc-check 报面即此名……）」，而成文（`:173`）是「evidence 文字太长，难于阅读（超 300 字即算）」。判据档 `docs/core/requirements/ENGINEERING-MODE-V2.md:1022` 对同条逐字写「不再出现「行宽」，也不报字符数」；实盘报面 `thincoder-core/doc-check/paragraph.mjs:19` = `para: "文字太长，难于阅读"`（无计数） | 名字行只留「evidence 文字太长，难于阅读」；阈值另起一句（如「超 300 字即算命中——读数非闸门」）。若坚持括注（模型须读到阈值），在设计档写一行对 §13.23 判据 2 的显式例外，别用「逐字复用」的语言盖过去 |
| 4 | 方法论 | 🟡 | **缺最近先例行**（判据 = 先例坐标 + 对齐 ∥ 偏离理由）。同形先例就在射程内：`docs/core/design/LEDGER.md` §3.5 / §3.7 的「先例行（逐项——对齐 ∥ 偏离）」；最近的同类改名先例 = `2026-10-26-doc-check-wording.md`（宽→段改名批）。本设计只把那批当「中文名出处坐标」（`:104`），无对齐 ∥ 偏离判句 | 补一行：先例坐标 + 对齐（同判据 = §13.23 判据 2）+ 偏离（本批不动机检引擎、不加锁）；或明写「无同形先例」并给理由 |
| 5 | 方法论 | 🟡 | **缺勘察证据行**（判据 = 写出查过哪些公共源档、有无相关）。`docs/core/design/LEDGER.md` §3.5 / §3.6 / §3.7 / §3.9 每节都带「勘察证据行」+ 声明源照记；本批设计档无此行，读起来等于「没查」 | 补一行：查过 §13.23 ∥ 该档 §5 / §7.1 / §8（AC-M2-31）∥ `docs/cli/design/READ-DATA-INTERFACE.md` §2.6（`:123` / `:220`）——相关；并照记声明源（`publicRepos = []`） |
| 6 | 清晰 / 受影响面 | 🟡 | **产品码坐标表漏了不会自己消失的旧名行**，而验收 4 要求旧名 grep = 0：`thincoder-core/ledger-cmd.mjs:11`（「`evidenceOversize`（§5 P4）」）/ `:95` / `:115` / `:117` / `:118` 全是含旧名的注释行；`docs/core/design/API-CONTRACT.md` 生成区实有三行旧名（`:1390` fn 行 · `:1410`「\| `EVIDENCE_SOFT_LIMIT` \| `thincoder-core/ledger-db.mjs:150` \| `const` \|」· `:1467` 导出索引），设计只给「`:1389` ∥ `:1468`」（`:139`），而 `:1389` 是 `ledgerCount` 行、不含旧名 | 注释行与 `:1410` / `:1467` 补进 §三 表；生成区坐标改成「`:1390` / `:1410` / `:1467` / `:1468`（以 `docs/core/design/API-CONTRACT.md:4638` 的 `<!-- END GENERATED -->` 为界）」 |
| 7 | 验收 | 🟡 | **验收没有可执行面**：§五 只把条目映到 N1–N6 断言（`:206`–`:211`），没给单测档路径、也没给 `node --test <file>` 命令；§四 只说「测试面 = 批内单测档 + `test/integration/ledger-read-cross-project.test.mjs` + `test/RTM.md`」（`:191`），档名留给实施轮 | 在 §五 落一行实施轮可直接跑的脸：单测档路径（名随批）+ `node --test <该档>`，并注明集成侧不改跑（集成行只在收口线报） |
| 8 | 档位判 | 🟡 | **档位结论只量了受影响码 ∥ 测试档里的两个**：`:182` 只给 `thincoder-core/ledger-cmd.mjs` = 336 ∥ `thincoder-core/ledger-db.mjs` = 276，而同批表还列 `thincoder-core/ledger.mjs` · `thincoder-cli/src/acp/read-data.mjs` · `test/integration/ledger-read-cross-project.test.mjs`。评审实测三者 = **161** / **147** / **163** 行（文件末行号）⇒ **结论（无一档越 500）成立**，但只靠两档读数撑着 | 把三个读数补进同一结论句，使「无档跨档位」可逐档复核 |
| 9 | 既有件 | 🔵 | **同一个 300 已有在册常量**：`thincoder-core/doc-check/index.mjs:24` = `paragraphMax: 300,`。本批新起 `EVIDENCE_READABLE_MAX = 300`，设计只在 `:106` 把它当「命名形先例」提一次，未答「为何不必复用」。中文名的活坐标亦应是 `thincoder-core/doc-check/paragraph.mjs:19`，而非已收口批档 `2026-10-26-doc-check-wording.md:21`——引账不引盘 | 补三问形：`existing` = `DOC_CHECK_BUILTINS.paragraphMax`（名字逐字 `paragraphMax`，面 = doc-check 引擎）+ 判为何不复用（面不同、语义不同、复用造跨模块新边）；中文名坐标改指 `thincoder-core/doc-check/paragraph.mjs:19` |
| 10 | 集成测试设计 | 🔵 | 集成面 delta 已在（`:213`：破行 1 = `21-4`、冗余 0、新增 0，理由成立且非禁用理由）；但只一句，缺同档四要素格式（`docs/core/design/LEDGER.md:702`–`:712` 表：组件交互 ∥ 业务可观察结果 ∥ 服务需求 ∥ 本仓入口） | 按四要素补一格：交互 = ACP `ledger/count` 处理器 → `ledgerCount` 出参键 → 扩展读面；结果 = 跨项目计数三键同名可读；需求 = `docs/cli/design/READ-DATA-INTERFACE.md` FR1 ∥ FR3；入口 = 扩展拉取选中项目台账 |
| 11 | 否定结论复核 | 🔵 | **「零处按键名读取」实扫成立（复核通过）**：`D:\teamcode` 全域该键只现于 ① 核自身（`thincoder-core/ledger-cmd.mjs:140` 的 `.evidenceOversize` 及其定义 / 注释）② 集成用例（`test/integration/ledger-read-cross-project.test.mjs:59` / `:162`）③ ACP 面一行注释（`thincoder-cli/src/acp/read-data.mjs:76`）④ 描述面 `thincoder-core/tool-docs/ledger.md:7` / `:8`；`thincoder-vscode` 与 `thinworker`（C#）零命中 ⇒ ACP 消费方确不按键读取，不留别名的判据站得住。补正两点：`:121` 的「核实现 8 处」偏低（含注释实为 13 行 / 21 处命中）；且「源里没人读」≠「已发布扩展没人读」 | 把扫描域与两处补正写进设计档（读的是当前仓源码，不含已发布产物）；若要说满否定结论，加一句「方向不对称已兜底（`:125`）」，不必再加别名 |

**计数**：🔴 1 · 🟡 6 · 🔵 3（共 10 条；第 11 条为复核通过记录，不计问题）。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 设计评审 · 2026-11-01 · evidence-naming-fix · 第 2 轮（只验轮次 1 的 🔴1 + 🟡6 + 🔵3 落地）

评审对象 = 批档 §2 设计（`2026-11-01-evidence-naming-fix.md:72`–`:304`）∥ `docs/core/design/LEDGER.md`。

验证方式 = 两档实扫，逐枚 grep `Oversize` / `evidenceTooLong` / `ledgerEvidenceTooLong` / `EVIDENCE_TOO_LONG_MAX` / `EVIDENCE_READABLE_MAX` / `EVIDENCE_SOFT_LIMIT` / `先例行` / `勘察证据行`。

射程限制（明记）：产品码 ∥ 描述面 ∥ 测试面归实施轮，本轮未读。

故 §五 验收 4 的「产品码旧名 grep = 0」臂与 §四 五档行数本轮无法复量。

🔴1 的可核判据只落在 `docs/core/design/LEDGER.md` 的三枚读数上。

**本席实扫读数（2026-11-01）**：

- `Oversize` / `oversize` = **0 行** ✓
- 新名命中 = **20 行**：`evidenceTooLong` 15 行 + `ledgerEvidenceTooLong`（`:1162` / `:1182`）+ `EVIDENCE_TOO_LONG_MAX`（`:323` / `:726` / `:869` / `:883` / `:1182` / `:1307`），并集去重。
- 该 20 行与 §二③`:157` 的逐行坐标**逐枚相符**。
- `EVIDENCE_READABLE_MAX` = **0 行** ✓ · `EVIDENCE_SOFT_LIMIT` = **0 行** ✓
- ⇒ 验收 4 后两枚与 🔴1 的自陈读数**全部为真**。

**逐条落地判定**：

- 🔴1 落：自陈在 §二③`:155` / `:159` / `:163`、§八 报项 1`:280`、修正块行 1`:290`、自检`:302` 五处，无掩饰；验收 4 已改成可成立形（`:251`）。
- 🟡2 落，但留一处旧格（见下表 1）。
- 🟡3 落：名字行只余「evidence 文字太长，难于阅读」（`:104` / `:207`），阈值另起一句；「逐字复用」已除去，仅存于修正块行 3`:292` 的处置记录。
- 🟡4 落：先例行 `:114`–`:116`；先例坐标经核 = `docs/core/design/LEDGER.md:316` 的 §3.5 先例行（`:340` / `:344`）∥ §3.7（`:485` / `:489`），实在。
- 🟡5 落：勘察证据行 `:118`–`:122`，体例同 `docs/core/design/LEDGER.md:348` / `:350`。
- 🟡6 落，但有坐标集漂移（见下表 2）。
- 🟡7 落：`:244` 命令行。
- 🟡8 落：`:220` 五档读数 336 ∥ 276 ∥ 161 ∥ 147 ∥ 163。
- 🔵9 – 🔵11 均落。

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 清晰 / 文档状态 | 🟡 | 🟡2 的改判在 §三 表里只落了一半：`:210` 的「现在」格仍写「常量名仍为 `EVIDENCE_READABLE_MAX`」，而同档 `:163` 写「6 行 = ……，已落」、`:302` 自检写「`EVIDENCE_READABLE_MAX` = 0 行」，本席实扫亦为 0（该档只剩 `EVIDENCE_TOO_LONG_MAX` 6 行）。同一格前半「键名已是新名（**设计轮已落**）」与后半自相矛盾；实施轮照此行会去找已不存在的 6 行 | 该行「现在」格改成就地盘面：「键名与常量名均已是新名（**设计轮已落**，6 行 = `:323` ∥ `:726` ∥ `:869` ∥ `:883` ∥ `:1182` ∥ `:1307`）」，把「改成」格收成零待办；或整行移入修正块留作记录 |
| 2 | 清晰 / 受影响面 | 🟡 | 🟡6 补了注释行与生成区四行，但**旧名坐标集在本档内出现三套互不相容的清单**：§1.4`:50` 为「11 / 31 / 51-53 / 95 / 111 / 122 / 131 / 133 / 139-140」；§二②`:141` 以「按行实扫」自居给「11 行 = `:11` / `:31` / `:95` / `:111` / `:115` / `:117` / `:118` / `:122` / `:133` / `:139` / `:140`」，缺 `:51`–`:53` 与 `:137`——而这两处正被 §三`:200` / `:201` 列为必改；§三`:201` 又列「`:11` ∥ `:95` ∥ `:115` ∥ `:117` ∥ `:118` ∥ `:137`」，不含 §1.4 的 `:131`。三套里至少一套是陈旧读数，而 §五 验收 4 的「旧名 grep = 0」只有这套清单可当复核图 | 以一次重扫为准，让 §1.4 ∥ §二② ∥ §三 共用同一枚坐标集（`:131` 与 `:137` 二者只能留一；`:51`–`:53` 必须进 §二② 的读数）；§二② 的「11 行」改写成与 §三 同源的读数 |
| 3 | 验收 / 可执行面 | 🔵 | 🟡7 只给了单测一条可跑命令（`:244`）；验收 4 ∥ 验收 5 仍是裸 grep 断言，未给命令与域（「活档」= 哪些根未枚举，§1.4 射程表与 §三 表各是一套面） | 验收 4/5 后附命令形与域（如域 = 「仓内 `*.md` + `*.mjs`，排除 `docs/batches/`」，产品码三档单列一条） |
| 4 | 文档卫生 | 🔵 | 修正块已把轮次 1 处置逐号记全（`:288`–`:300`），但作废式措辞仍留在规范面：§二①`:112`「（本席设计轮所取，评审轮 1 发现 2 判非，本块作废）」、§二③`:159`「三个计数一并作废」、§六 K5`:264`「在此作废」——读者会把这些当待办回头翻 | 规范面只留判据句（`EVIDENCE_READABLE_MAX` 为何不选 + `TOO_LONG_MAX` 为何同形），时序句收进修正块（`:291` 已有） |
| 5 | 数值漂移 | 🔵 | `:53` 仍写「`docs/core/design/LEDGER.md`（23 处）」，而同档 `:159` / `:280` 已宣布「23 处 ∥ 25 行 ∥ 24 行」三个计数作废；实扫为 20 行 | 该格改成「20 行（已随设计轮落地）」，或去掉计数只留「1 档」 |
| 6 | 取名（focus ②） | 🔵 | 新名确已从「读者体验」回到「被量物的上限」：`EVIDENCE_TOO_LONG_MAX` 不再断言「到这里为止都读得下去」（`:106` 的判据引证成立，`:264` K5 记了理由），该档 `READABLE_MAX` 残留 = 0。但 `:110`「与……`paragraphMax` 才是真同形：都量被量物」说过了一格——`paragraphMax`（`thincoder-core/doc-check/index.mjs:24`）是**不含判定**的量词上限，`TOO_LONG_MAX` 里仍带着判定词 `TOO_LONG`，两者同形到「阈值上限」这一层为止 | `:110` 改成「与 `paragraphMax` 同为**阈值上限形**（一名一阈、不含可读性断言）」，别写成「都量被量物」 |
| 7 | 超前声明 / 存量指针 | 🔵 | 本席复核轮次 1 点到的两处：`docs/core/design/LEDGER.md:1162` 把 `ledgerEvidenceTooLong` 记进「已落地」段而产品码仍旧名——设计已按评审建议登记为超前声明（`:174`），实施轮落盘即齐；`docs/core/design/LEDGER.md:323` 的 P4 三枚坐标（`:43` / `:101` / `:123`）陈旧——§八 报项 3（`:282`）已只报不改。两处均**不属本轮射程**，记账以免被读成漏判 | 无（实施轮落盘后 `:1162` 自动成真；`:323` 三枚坐标另立清扫轮，本轮不触） |

**计数**：🔴 0 · 🟡 2 · 🔵 5（共 7 条）。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准 = 逐次批准（本批不是批级放行）。**

- **起念原话**：2026-11-01 12:17 逐字「300字我们不是早就约定过不能用宽度超标表述吗？我说的是文字太长难于阅读，为什么到这里还是宽度超标？」
- **批准原话**：12:19 逐字「**可以**」—— 批准改键名（不只是改描述）。
- **路线裁定**：12:19 逐字「**不要走轻通道！**」—— **本批走全链**（设计 → 评审 → 批准 → 实施）。
- **批准的对象**：`evidenceOversize` → `evidenceTooLong` ∥ `EVIDENCE_SOFT_LIMIT` → `EVIDENCE_TOO_LONG_MAX`（**值 300 不动**）∥ `ledgerEvidenceOversize` → `ledgerEvidenceTooLong`；中文描述改用「文字太长，难于阅读」，字数移出名字行。
- **批准前已知的面**：设计经 **2 轮**独立评审（轮次 2 = `pass`；轮次 1 = `changes-required`，其中 🔴1 = **设计档那 24 行在设计轮就被改了**，据实登记）；实施动产品码 3 档 + 描述面 1 档 + ACP 契约注释 + 集成档 + RTM 一行 + 生成区重跑。
- **一条不做的**：不留旧键别名（设计 K2，判据 = 方向不对称：后补别名是纯增量，撤别名要自己走废弃窗口）。

## §5 实施记录（eng-coder）
**状态行**：实施完成



### 5.1 落笔（逐档 · 改前 ⇒ 改后）

| 档 | 改前 | 改后 |
|---|---|---|
| `thincoder-core/ledger-db.mjs` | `EVIDENCE_SOFT_LIMIT = 300` + 「软上限（字）」注 | `EVIDENCE_TOO_LONG_MAX = 300` + 「过了这条线即判为太长」注；**值 300 零改** |
| `thincoder-core/ledger-cmd.mjs` | `isEvidenceOversize` / `evidenceOversize` 三出参点 / `ledgerEvidenceOversize` / import 旧常量 / 六处含旧名的注释 | `isEvidenceTooLong`（判据式 `length > EVIDENCE_TOO_LONG_MAX` 逐字未变）/ `evidenceTooLong` 三出参点 / `ledgerEvidenceTooLong`（仍为 `ledgerCount` 薄委托）/ import 新常量 / 注释同拍 |
| `thincoder-core/ledger.mjs` | `:156` `EVIDENCE_SOFT_LIMIT` ∥ `:157` `ledgerEvidenceOversize` | 两再出口随名 |
| `thincoder-cli/src/acp/read-data.mjs` | `:76` 注释 `{ count, overdue, evidenceOversize }` | 注释随名；`:77` 直传核对象、`boundary` 传参零改 |
| `thincoder-core/tool-docs/ledger.md` | `:7`「evidence 超软上限 300 字——读数非拒写」∥ `:8`「evidence 超限行数」 | `:7`「evidence 文字太长，难于阅读——读数非拒写；超 300 字即算命中」∥ `:8`「其中文字太长、难于阅读的行数」 |
| `docs/cli/design/READ-DATA-INTERFACE.md` | `:123` ∥ `:220`（RDI-7）三键旧名 | 三键 `evidenceTooLong` |
| `docs/core/design/API-CONTRACT.md` | 生成区旧名四行 ∥ 语义区 `ledgerCount` 行旧键 | 生成区由 `node scripts/api-contract.mjs --write` 重跑（`:1418` ∥ `:1475` ∥ `:1476`）；语义区 `:4707` 手改（生成器零触） |
| `test/integration/ledger-read-cross-project.test.mjs` | `:59` `B_EXPECT` ∥ `:162` 断言文案旧键；`:56` ∥ `:57` 夹具措辞「evidence 超限」 | 新键同拍；措辞改「evidence 文字太长」 |
| `test/RTM.md` | `:254` 故事 21 的 `21-4` 行「怎么算通过」列旧键 | 新键（破行 1 · 冗余 0 · 新增 0） |
| 批内单测档 `docs/batches/2026-11-01-evidence-naming-fix.test.mjs` | 无 | 新建 N1–N6（名随批 · 收口轮删除） |

**零别名**（设计 K2 落地）：`ledgerCount` 只回三键，旧键不挂；`ledgerEvidenceTooLong` 不另立第二判定面。

### 5.2 验收读数（本席实跑 · 命令 + 结果）

| 面 | 命令 | 读数 |
|---|---|---|
| 单测（N1–N6） | `node --test docs/batches/2026-11-01-evidence-naming-fix.test.mjs` | tests 6 · pass 6 · fail 0 |
| 集成档（改了两行断言 ⇒ 本席交货前跑一次，不等收口线） | `node --test test/integration/ledger-read-cross-project.test.mjs` | tests 4 · pass 4 · fail 0（21-1 ∥ 21-2 ∥ 21-3 ∥ 21-4 全绿） |
| 生成区一致性 | `node scripts/api-contract.mjs --check` | `OK(api-contract): 骨架零漂移（4631 条 · 933 档）` |
| 旧名清零（验收 4 前臂） | grep `evidenceOversize\|EVIDENCE_SOFT_LIMIT\|isEvidenceOversize\|ledgerEvidenceOversize\|EVIDENCE_READABLE_MAX`，域 = 仓内 `**/*.{mjs,md,json,ts,js,cs}`，排除 `docs/batches/` 与 `node_modules` | **0 命中**；同一轮把域放大到 `D:\teamcode` 全域（排除 `thincoder/docs/batches/`）仍 0 命中——仓外两端（VSC ∥ C#）无按键名读取 |
| 设计档新名（验收 4 中臂） | grep 三枚新名于 `docs/core/design/LEDGER.md` | **20 行**（`:323` `:392` `:453` `:489` `:726` `:828` `:855` `:866` `:869` `:881` `:883` `:1162` `:1179` `:1180` `:1182` `:1217` `:1307` `:1390` `:1393` `:1432`） |
| 作废常量名（验收 4 后臂） | 同档 grep `EVIDENCE_READABLE_MAX` | **0 行** |
| 两面同拍（验收 5） | 三枚名各查设计档与产品码 | 设计档三枚全在；产品码三枚全在（`ledger-cmd.mjs:53` · `:139` · `ledger-db.mjs:150`）——无缺项 |
| 判据本体零改 | 实读 `thincoder-core/ledger-cmd.mjs:53` ∥ `:124` | 比较式 `> 300` 与统计集（未决四态）逐字未动 |
| 文档纪律门 | `doc_check(mode:gate)`，docs = 本席笔域四档 | `DOC-CHECK GATE: PASS`（4 档全清） |

`doc_check: PASS (4 docs)` —— `thincoder-core/tool-docs/ledger.md` · `docs/cli/design/READ-DATA-INTERFACE.md` · `docs/core/design/API-CONTRACT.md` · `test/RTM.md`。

### 5.3 出界改动（逐条申报 + 理由）

| # | 档 / 坐标 | 为何在父侧「落点」清单外 | 理由 |
|---|---|---|---|
| 1 | `docs/cli/design/READ-DATA-INTERFACE.md:123` ∥ `:220` | 不在本席声明文件表、亦不在父侧落点清单 | §2 §三 机制表逐字列入「改」；且验收 4 要求**活档**旧名 grep = 0，此档不改变该臂恒不成立 |
| 2 | `test/integration/ledger-read-cross-project.test.mjs:56` ∥ `:57` | §三 只点 `:59` ∥ `:162` | 同档内措辞同拍：用例标题与夹具注释仍写「evidence 超限」，会把本批要治的旧口径留在用例名里；夹具值（`"长".repeat(320)`）零改，断言面不变 |
| 3 | `thincoder-core/ledger-cmd.mjs:128` ∥ `:131` 局部变量 `oversize` ⇒ `tooLong` | §三 未点名（只点 `:122` ∥ `:133`） | 同函数体内不留半新半旧：键名改了、局部变量还叫「超尺寸」，正是本批判据要治的分裂 |

**未触**：`docs/core/design/LEDGER.md`（设计轮已落 20 行，父侧明令不触）、`docs/core/requirements/**`（0 命中）、`docs/batches/**` 里的已收口账、台账状态机 ∥ 迁移表 ∥ 写门。

### 5.4 审计与评审轮 · 终态

| 轮 | 形态 | 结论 |
|---|---|---|
| 1 | 内部探针审计（只读 explore） | `divergences: 0`（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST 四类皆空）。该席装配无 bash / execute ⇒ 未复跑测试，测试读数由本席实跑提供 |
| 2 | 独立代码评审（advisor，type=code） | `VERDICT: pass`（🔴 0 · 🟡 5 · 🔵 2，均为可选/提示）。自修轮 0 轮（无 🔴 可修） |

**评审项处置**：评审第 2 条（集成档改而未跑）⇒ 本席本轮已跑，4/4 绿，闭。第 1 条（§5 空）⇒ 本段落地，闭。第 3 ∥ 4 ∥ 6 条落在 §2 记录面（eng-designer 笔域，本席无笔权）⇒ 上报父侧。第 5 条（射程缺口：`docs/core/design/PROMPT-SYSTEM.md:606` ∥ `:5354` 仍以「软上限 ≈ 300 字」称同一阈值）⇒ 上报父侧裁：本批扩面 ∥ 另挂一条台账行。

**终态 = `clean`**。

### 5.5 上抛 / 待父侧裁（本席无笔权或不属本批射程）

| # | 项 | 坐标 | 建议 |
|---|---|---|---|
| 1 | §三 表「现在」格仍是「常量名仍为 `EVIDENCE_READABLE_MAX`」，与落地后盘面相反 | `docs/batches/2026-11-01-evidence-naming-fix.md:210` | 交 eng-designer 按盘面改写，或移入修正块留时序记录 |
| 2 | 旧名坐标三套互不相容（§1.4 ∥ §二② ∥ §三） | 同档 `:50` ∥ `:141` ∥ `:201` | 一次重扫统一；`evidenceOversize` 至今只落在 `docs/batches/**`（排除域），故验收 4 已成立，此条仅为可复核性 |
| 3 | 计数残留「`docs/core/design/LEDGER.md`（23 处）」 | 同档 `:53` | 改 20 行或去计数 |
| 4 | 同一 300 阈值在活档仍按「量」命名 | `docs/core/design/PROMPT-SYSTEM.md:606` ∥ `:5354` | 扩面 ∥ 挂账，父侧择一 |
| 5 | `docs/core/design/LEDGER.md:323` P4 三枚实现坐标陈旧（`:43` ∥ `:101` ∥ `:123` 均非 P4 判点） | `docs/core/design/LEDGER.md:323` | §八 报项 3 已登记「只报不改」，清扫轮收正 |

### 5.6 边界（本批零触，复核成立）

300 这个值零改 · 判据比较式逐字未改 · `count` 统计集（未决四态）未改 · 「读数非闸门、写入不拒」未改（N6 实跑：301 字行照写、原样落库）· 台账六态状态机与迁移表零改 · 生成区零手改（走生成器重跑）· 已收口批次的账零回改。

## §6 验证与收口（父代理）

### 6.1 父侧复跑（收口轮实读）

| 读什么 | 命令 / 方式 | 读数 |
|---|---|---|
| 本批单测 N1–N6 | `node --test docs/batches/2026-11-01-evidence-naming-fix.test.mjs` | **tests 6 / pass 6 / fail 0** |
| 集成档（21-1…21-4） | `node --test test/integration/ledger-read-cross-project.test.mjs` | **tests 4 / pass 4 / fail 0** |
| 仓根集成层 | `node test/run.mjs` | **fail 0** |
| grep① 旧名清零 | 仓内 `*.{mjs,md,json,ts,js,cs}`，排除 `docs/batches/` 与 `node_modules` | **源码 0 命中**；唯一命中在 `.thincoder/tmp/desktop-core-materialized-0.10.9/`（**临时区的历史快照，不是源码**） |
| grep② 设计档新名 | `docs/core/design/LEDGER.md` | **20 行**（验收要求 ≥20） |
| grep③ 作废常量名 | 同档 `EVIDENCE_READABLE_MAX` | **0 处** |
| 判据值没被顺手动 | `thincoder-core/ledger-db.mjs` 实读 | `EVIDENCE_TOO_LONG_MAX = 300` —— **一个字没动** |
| 文档机检 | `doc_check(mode:"gate")` | **PASS** |

### 6.2 这一批到底改了什么（一句话版）

**三枚名换掉，值不动**：`evidenceOversize` → `evidenceTooLong` · `EVIDENCE_SOFT_LIMIT` → `EVIDENCE_TOO_LONG_MAX`（**300 不变**）· `ledgerEvidenceOversize` → `ledgerEvidenceTooLong`。

**中文描述换口径**：`thincoder-core/tool-docs/ledger.md:7`-`:8` 由「超软上限 300 字 ∥ 超限行数」改为「**文字太长，难于阅读**——读数非拒写；超 300 字即算命中 ∥ 其中文字太长、难于阅读的行数」。

**为什么值必须不动**：这个名字治的是**叫法**，不是判据。**改判据值会把一件「改口」的事变成「改政策」**，而政策是用户定的。

### 6.3 实施席申报的四条出界改动（父侧逐条采认）

| # | 改动 | 采认理由 |
|---|---|---|
| 1 | `docs/cli/design/READ-DATA-INTERFACE.md:123` / `:220` | 不改它，验收 4 的「活档旧名 = 0」恒不成立——**它也是活档** |
| 2 | `test/integration/ledger-read-cross-project.test.mjs:56`-`:57` | 同一用例里还写着「evidence 超限」，**等于把本批要治的旧口径留在用例标题里** |
| 3 | `thincoder-core/ledger-cmd.mjs:128` / `:131` 局部变量 `oversize` → `tooLong` | 键改了、局部变量还叫「超尺寸」= 半新半旧 |
| 4 | `docs/core/design/API-CONTRACT.md` 生成区**整块重跑**（顺带吸收树上其它在途改动：`SILENCE_MS` / `buildShowRun` / 若干档行号位移） | **这是「走生成器、不手改」的机械后果**；重跑后 `--check` 报零漂移，即**档面 = 当前树**，这正是生成区该有的状态 |

**第 4 条要记牢**：生成区**整块重写**是它的设计，不是副作用事故——**手改生成区才会在下一次重跑被冲掉，且没人知道冲掉过。**

### 6.4 记录面已知不精确（评审 🟡1 / 🟡2 / 🔵4，本批不改）

**以下三处是设计档 §2 的账，评审判 advisory、不阻断；实施后仍未收：**

- §三 表「现在」格 `:210` 仍写「常量名仍为 `EVIDENCE_READABLE_MAX`」——**落地后盘面相反**（该名全域 0）；
- 旧名坐标三套互不相容（§1.4 `:50` ∥ §二② `:141` ∥ §三 `:201`：`:131` 与 `:137` 只该留一，`:51`–`:53` 某套漏了）；
- `:53` 计数残留「`docs/core/design/LEDGER.md`（23 处）」，实扫 **20 行**。

**为什么不收**：§2 是设计席段、append-only；**且验收 4 已经不依赖这套清单**（实施席按 grep 扫，实测 0 命中）。**⇒ 这三处影响的是「可复核性」，不是「做没做对」——记在这里，不装作已收。**

### 6.5 零留存

`docs/batches/2026-11-01-evidence-naming-fix.test.mjs`（一次性单测档）**收口即删**；读数留 §6.1。

### 6.6 本批没治的那一处（同病、不同物）

**`docs/core/design/PROMPT-SYSTEM.md:606` ∥ `:5354` 仍在用「软上限 ≈ 300 字」「超限行」描述同一类阈值**——**同一个病，另一个物（提示词面的段落判据，不是台账的 evidence 读数）。**

**⇒ 不在本批射程**（§1.4 未列该档），**登 `#1950`**：**改法同本批，但那是另一件东西，须单独定射程。**
