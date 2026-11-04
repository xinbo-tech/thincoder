# 批档 · 台账 · 评审三链统一（设计）

> 板 = core。本档拥有「一件工作从开批到核销」的**生命周期契约**：谁在什么状态下存在、哪道门在哪个时点判什么。
> 台账行状态机归 `docs/core/design/LEDGER.md`，批档六段与冻结归 `docs/core/design/BATCH-RECORD.md`，
> 设计凭证槽归 `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`——本档只写**三者相交的那部分**，不复试它们各自的部分。

## 1. 做法与理由

一件工作的三个载体现在各自独立：批档是一份 `.md`，台账是一行 SQLite，评审是 `§3` 的一段文本加一枚运行态 token 槽。
用户裁定把它们串成一条链：**建批档即建台账行**、**评审结论进状态机**、**没有在途台账行就不许写盘（不分面）**、**核销以收口为前提**。

做法一句话：**把三条链的每一处连接都改成「档面上的事实」**，不留运行态判据（内存 Map / 会话槽号），
这样换会话、重启进程、隔天补账，判据都还成立。

**最近先例**：`thincoder-core/ledger-cmd.mjs:395`（`REANCHOR_STATUSES`）+ `:421`（`ledgerReanchorBatch`）——形状 = 收口时按批指针重锚台账行；
设计档 = `docs/core/design/LEDGER.md` §6.2（取行句）· AC-M2-30；**落地批 = 台账 #1550**（在册状态 = 同档 §3.5 四件表）。

本档**对齐**它（收口是台账面的机器写点、失败不否决冻结、回执带 `[ledger reanchor]` 段）；**偏离**两处：
① 它把本批未落行一律压成 `条件`，本档改按**行状态分流**（`§2.7`）；② 本档新增反向的**重开回收**（`§2.13`），它没有对应件。

**调研证据**：

- **仓外声明源**：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（按键名定位；`:35` 2026-10-27 12:35 实读，本轮按键名复核仍命中同一行）⇒ **无仓外声明源可查**（照记）。
- **仓内设计层相关档**：`docs/core/design/LEDGER.md`（核销机检 / 收口重锚）· `docs/core/design/BATCH-RECORD.md`（收口链门 / §3 词表）· `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（槽归属）· `docs/core/design/TOOLS.md`（工具契约）· `docs/core/design/TESTING.md`（零留存门）。
- **面分类正源** = 需求层 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5（`:665`–`:668`），已并入 `§2.1` / `§2.10`。
- **普通模式面（负结果照记）**：`docs/core/requirements/NORMAL-MODE.md` 检索 `不适用` ∥ `设计评审` ∥ `追认核销` = **零命中**（2026-11-02 实跑）⇒ 该档没有把「无设计评审的出路」当依据的句子，本批不必改它。
- **需求层同面已收正**：需求档「收口前置·链完整性」条逐字「任何段不得声明不适用；§5 不受本门约束」⇒ 需求面与本档同口径，设计面不回改它。

**档归属**：跨链契约（一本 ↔ 行集 `§2.4` · 写锁 `§2.3` · 五道门 `§2.6` · 重锚分流 `§2.7` · 重开回收 `§2.13`）与 `§3` 状态行词表（`§2.5`——含打回即重置）由本档拥有。
`§2.1` / `§2.10`（面判）与 `§2.12`（排除名单）的长期归属 = `docs/core/design/ENGINEERING-MODE-V2.md` §13.5 的机判实现；`§2.7` / `§2.13` 归 `docs/core/design/LEDGER.md` §6.2。

**两侧写法不同时以本档为准**（取代项逐条列在 `§2.7`），直到对应正文并回该档。

**合并待办的承接判据**（不预设批次号）：承接方 = 各目标档所在板的下一次**正文合并批**；判据 = 该档「在册状态」节与本文 `§2.7` 取代项逐条归零（盘上不再有两侧并立的同一机制）；承接记录落在批档 `§6` 收口行。

## 2. 接口契约

### 2.1 面分类（拒文变体的判据底座）

**判据来源 = 需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.5**（`:665`–`:668`）：

| 面 | 路径枚举 |
|---|---|
| 文档面 | manifest `docRoot` 各值（`requirements` / `specs` / `design` / `modules` / `batches`，多根为数组）∥ `PROJECT-MANIFEST.json`（项目状态档——写权独属主 agent） |
| 产品面 | **其余一切路径**（fail-closed）——含 `scripts/**` · `test/**` · `.thincoder/**` · `.github/**` · `package-lock.json` · 产品文本面 |
| 辖界（不是面） | 祖先链无 manifest ⇒ 设计门不管（F11 / D17 既有；不是第三个面，也不是豁免桶）；写锁的判据点改由调用方声明后，该臂只属设计门（`§2.3`） |

- **四产品** = `thincoder-cli` / `thincoder-vscode` / `thincoder-desktop` / `thincoder-server`。`thincoder-core` 是核、不计入产品——它的面由首条 `thincoder-core/**` 覆盖。
- **显式偏离（用户 2026-10-27 口径）**：`thinworker` **不纳入**本判据；它的路径落兜底（= 产品代码面），本批不为它建目录枚举。
- **文档面为什么取 `docRoot`**：需求档写「按写权矩阵（D1）」，D1 判的是**归属**（哪类档谁写），不是路径枚举；机判需要路径前缀，`docRoot` 各值就是 D1 在写面上的投影。两者不冲突：`docRoot` 命中的路径，写权归属仍按 D1 判。
- **产品文本面** = 四产品包的外向文本（`README.md` · `package.json` · 发布清单 · 产品 `AGENTS.md`）——它**不是**文档面，按产品面走全流程。§13.5 按类别点名，实施按这四例认档。
- 判据单源住叶档 `thincoder-core/agent/write-face.mjs`（`faceOf(absPath, manifest)` → `"product" | "pass"`；三步面判顺序与每步依据 = `§2.10`）。
- 路径归一复用 `write-gate.mjs:98-102` 的 `gateKey` 形状（绝对化 + `/` 归一 + win32 大小写归一）；文档面取 manifest 值、不写死 `docs/`（先例 = `write-gate.mjs:58-60`）。
- **与 `conventions.mjs` 的关系**：面判据**不叠在 `classifyPath` 上**——两值直接判（`§2.10`）。`classifyPath` 本体零改，仍留给引类面用：它有七个生产消费面（`dispatch.mjs:115` · `verify.mjs:193` · `advisor-settle.mjs:74` · `advisor/repos.mjs:122` / `:146` · `declaration.mjs:246`），改它会把 verify / 评审陈旧 / 索引范围一起翻面。
- **一个消费面换判源**：`agent/dispatch.mjs:115` 的设计门由 `isCodePath(abs, conv)` 换成 `faceOf(abs, manifest)`——设计门的**前置条件不变**（活设计槽），只把它对「什么算产品面」的判断并到唯一一份判据上。理由：两道门各用一套面判据必然漂移，漂移的后果是「设计门放的、写锁拦的」各说各话。其余六个消费面零改。

### 2.3 写锁（笔-账绑定 · 写面冲突块第三道门）

`write-gate.mjs` 导出 `ledgerBindWriteConflict(agent, depth, tool, toolName, args)`，与既有两道并列挂 `dispatch.mjs` Phase 1。

**判据点 = 调用方声明的项目，不从会话锚推**（用户 2026-11-03 02:58 裁「调用时要同时提供项目和台帐号」）。声明面复用各工具既有的定位参数，只有 `bash` ∥ `memory` 没有定位参数、各补一个 `project`（逐工具对照见下节）。

**入口集** = `FILE_MUTATORS` 六件 + `file_ops` + `bash` + `execute` + `git` + `manifest` + `memory`（共十二把；问法分别见「`bash` ∥ `execute` 怎么问」·「`git` 怎么问」·「`manifest` ∥ `memory` 怎么问」；`settings` ∥ `browser` 不写项目内档，逐项答案见末节扫描表）。

**位次不变**：跨批档写 → D5 冻结窗 → 本锁；本锁**替换**原「有在途行即放行」判据，不是并列加一道。

**判据一句话**：工程模式 ∧ `depth = 0` ⇒ 这笔写必须**同时**给出项目与 `ledger:"#N"`，且 `#N` 是**声明项目**台账里一条 `status = 在途` 的行。缺项目 / 声明路径不是项目 / 缺号 / 号非行号形 / 号不在该项目的账上 / 号不在途 ⇒ 拒。

**`bash` ∥ `execute` 与写盘工具同一判据**（用户 2026-11-03 02:03，决策 36）：不按命令行内容分类——分类本身就是第二个洞，还给假安全感。

**为什么是笔-账绑定**：写盘工具的参数原本只有路径与内容，门只能问「这个仓有没有在途行」——一条在途行于是放行该根下任何一笔写，它拦不住「有账但在做别的事」。判据换成「这笔写替哪条账服务」，门才第一次看得见写者报的是哪条账。

**形状 = 逐笔带号**（用户 2026-11-03 02:02 裁定甲，决策 34）：不是轮内绑定——「轮内可能异步在做好几项任务」，轮内绑定把几件事压成一条账。

| 输入 | 结果 |
|---|---|
| `ledger:"#N"` · 行在盘 ∧ `在途` | 放行 |
| 未传 `ledger`（缺 / 空串 / 全空白） | 拒 —— `no ledger number on this call` |
| `ledger` 非行号形（剥前导 `#` 后非纯数字） | 拒 —— 原值带进拒文 |
| `#N` 不在盘 | 拒 —— `row #N does not exist in this project's ledger` |
| `#N` 在盘 · `已核销` / `已废弃` | 拒 —— 点名该状态（终态；出路 = 另立行 ∥ 用一条在途行） |
| `#N` 在盘 · `待讨论` / `待设计` / `待核销` | 拒 —— 点名该状态（不是「在途」；`待核销` 要开工须先回 `在途`） |
| `bash` ∥ `execute` · 号在途 | 放行（不判命令内容——`git status` 与 `rm -rf` 同判） |
| `bash` ∥ `execute` · 缺号 / 号非在途 | 拒（同上四情形），命令零执行 |
| `bash` ∥ `memory` · 缺 `project` | 拒 —— `no project on this call` |
| 声明路径上溯无 `PROJECT-MANIFEST.json` | 拒 —— `declared project is not a project (no PROJECT-MANIFEST.json at this path or within the session anchor): "<path>"` |
| `git` · 写型 action（`commit` / `push` / `rm` / `checkout` / `reset` / …）· 号在途 | 放行 |
| `git` · 写型 action · 缺号 / 号非行号形 / 号不在盘 / 号非在途 | 拒（同上四情形），仓库零动 |
| `git` · 只读 action（六项平铺：`diff` / `status` / `log` / `show` / `ls-remote` / `blame`） | 放行，不要号 |
| `git` · 子动作分支判只读（`checkpoint` 的 `list` ∥ `cat`；`tag` / `branch` / `stash` / `remote` / `worktree` 各自 `list`） | 放行，不要号——六条分支与六项平铺一起按端装饰体逐条抄齐（见「`git` 怎么问」） |
| `git` · 子动作分支判写型（`checkpoint` 的 `create` / `rewind` / `versions`；`tag` / `branch` / `stash` / `remote` / `worktree` 的 `create` / `delete` / `switch` / `push` / `pop` / `add` / `remove` …） | 要号，同四情形 |
| `git` · 带 `path` ∥ `workdir` · 目标所属项目台账里没有这个在途号 | 拒 —— 号要看在**目标项目**的账上，不是会话的账上 |
| 声明路径不是项目（上溯无 manifest，如容器根 `D:\teamcode`） | 拒 —— `declared project is not a project (no PROJECT-MANIFEST.json at this path or within the session anchor): "<path>"` |
| 未声明项目（`bash` ∥ `memory` 缺 `project`；`execute` ∥ `git` ∥ `manifest` 既无定位参数又无 `project`——不回落到会话 cwd） | 拒 —— `no project on this call` |
| 声明项目在、该号不在它账上（号属另一个项目） | 拒 —— `row #N does not exist in this project's ledger`；不换项目再找 |
| 一笔写跨两个项目 | 同一号要在两个项目的台账里各查到才放行；任一查不到 ⇒ 整笔拒、字节零动 |
| 台账读不到（库不可开 / 根推得出而 manifest 不可用） | 拒 —— `<case>` = `no ledger can be read for this project`，另起 `(ledger unreadable — <原错>)` 行 |
| 普通模式 | 不挂本门（零改） |
| `depth > 0`（子代理） | 不核本门（走既有 token 门，零改） |

**判据点怎么来（逐工具一个声明面 · 决策 40）**

| 工具 | 项目声明 = | 不带时 |
|---|---|---|
| 写盘七件（`write` / `edit` / `insert_after` / `apply_patch` / `delete` / `hashline_edit` / `file_ops`） | 目标路径本身（`toolTouchPaths` 出的绝对路径），沿祖先链取项目根 | 无路径 ⇒ 工具自己拒；路径上溯无 manifest ⇒ 拒（`declared project is not a project`，清单单位 = `unknown — no project owns this write's target`） |
| `bash` | 只有 `project`——**纯声明，不改进程工作目录**（命令仍在会话 cwd 执行） | 拒（`no project on this call`） |
| `memory` | 只有 `project`（只在该笔落 project 层时要） | 落 project 层而不给 ⇒ 拒（`no project on this call`）；`personal` ∥ `team` 不判 |
| `execute` | 定位参数 `workdir`（既有；真改子进程工作目录）优先；缺位时读 `project` | 两者都无 ⇒ 拒（`no project on this call`），不回落到会话 cwd |
| `git` | 定位参数 `path` ∥ `workdir`（既有）优先；都缺时读 `project` | 两者都无 ⇒ 拒（同上），不回落到会话 cwd |
| `manifest` | 定位参数 `target`（既有）优先；缺位时读 `project` | 两者都无 ⇒ 拒（同上），不回落到会话 cwd；`action:"init"` 的豁免 = 条件形（决策 43） |

- **判据点只有两个来源，都来自调用方**：① 该工具自带的定位参数（它本就说着「这一笔落在哪儿」）；② `project`（项目根绝对路径）。**会话锚不是来源**——它只用于解析相对路径与判相关性；`execute` ∥ `git` ∥ `manifest` 缺定位参数时同样不许回落到 cwd（决策 41）。
- **定位参数优先于 `project`**：两者同时在时以定位参数为准（它决定字节落在哪），`project` 只补位；`project` 在这五把上一律是纯声明，不改执行目录（`execute` ∥ `git` 的 `workdir` 才是改执行目录的那个）。
- **名字只为被读的地方存在**：写盘七件的目标路径恒在，`project` 在它们身上永不被读 ⇒ 不加（决策 40）。

- **声明的形态**：项目 = **项目根绝对路径**（带 `PROJECT-MANIFEST.json` 的那个目录）——台账按项目根算键（`thincoder-core/ledger-db.mjs` 逐字 `sha1(normalizeCwd(root))[:16]`），所以「传项目」就是把根传进来，不做名字映射、不另立概念。相对路径按会话 cwd 解析。
- **界 = 相关性判据（不是单向的「不许越界」）**：声明必须满足 (a) 落在带 `PROJECT-MANIFEST.json` 的目录上（或沿祖先链上溯到最近一个这样的目录），且 (b) 与会话锚相关——**声明根含会话锚**（会话 cwd 在项目子目录里，「命名我自己所在的项目」）∥ **声明根在会话锚之内**（沿祖先链上溯到最近带 manifest 的目录，声明项目内部的子目录按此归到该根）。无关键（平级目录、不含锚的更远祖先）⇒ 拒并点名该路径。
- **两个分支的落法（实施席照此写）**：(b) 支 = 既有单源 `resolveLedgerRoot(声明, agent.cwd)`（起点在锚之内 ⇒ 沿祖先链上溯到最近带 manifest 的目录）；(a) 支 = 声明路径**自身即带 manifest**，且 `agent.cwd` 在它之下 ⇒ 根 = 声明路径（`basis = self`，不上溯）。两条都取不到 ⇒ `declared project is not a project`，无一放行。
  为什么 (a) 支要门自己判一次：`resolveLedgerRoot` 的上溯界就是会话锚，起点落在界之上时它取不到根——而「会话 cwd 在项目子目录」正是项目指南记录的启动形（`cd thincoder/thincoder-cli && node bin/thincoder.cjs`），不认这一支，那种会话里 `bash` ∥ `memory` 声明根也被拒、声明子目录也被拒＝无解。
- **`bash` 的 `project` 不改执行目录**：该工具没有 cwd 参数，本批也不给它加 shell `cd` 语义。它是**声明即承诺**——命令内容不解析（决策 36），门只问「这笔替哪个项目的那条账服务」。想在别的目录里跑，仍用命令自己的路径（`bash -c "cd … && …"`），那一笔照样要写声明。
- **`execute` ∥ `git` ∥ `manifest` 的 `project` 只在定位参数缺位时被读**：`workdir` ∥ `target` 本就说着「写哪儿」，有它们时 `project` 不参与判定；没有时它是唯一来源（决策 40）。写盘七件不加——目标路径恒在。

- **`manifest` 的 `init` 豁免开在取根步（决策 43）**：`manifest({action:"init"})` ∧ 目标沿祖先链取不到项目根 ⇒ 不进本门（无账可问）；目标沿祖先链取得到根（含既有项目内的子目录自举）⇒ 本门照判（要项目、要号），目标自身已有 manifest 时门过后由工具自身拒（`init never overwrites`）；`write` 仍照判（要项目、要号）。
  为什么：`init` 的合法落点恰是「尚无 manifest 的目录」，而判据点要那个项目的账——那个项目还不存在 ⇒ 不豁免则工程模式父侧永远建不出新项目；而走不通的机制迟早被整条废掉。豁免开在取根步而非把 `init` 摘出要号集：既有项目内的子目录自举取得到根，那一笔落在既有项目内、账就在那个项目上，无条件豁免会让它逃门。边界 = 只覆盖 `init` 一个 action，且它只写 `PROJECT-MANIFEST.json` 一个文件。

**`git` 怎么问（决策 37）**

`git` 的写面是**声明式 action**（`args.action` 的枚举值），不是 shell 字符串 —— 所以它与 `bash` ∥ `execute` 不冲突：用户 02:03 禁的是按命令字面猜（`grep -q 'rm '` 那类），而 `git` 的分类读的是一个枚举值，零猜测。

- **只对写型 action 要号**，只读型不要号、门不问。
- **判法 = 既有谓词 `readonlyActionOf(tool, "git", args)`**（`thincoder-core/agent/dispatch-gates.mjs:133` 逐字 `return tool?.isReadonlyAction?.(args) ?? isReadonlyAction(toolName, args)`），不新写一套分类。
- **分类单源落核 = 端装饰体逐条抄齐**（`thincoder-vscode/src/tools/index.mjs:52`–`:60`，2026-11-03 实读；核 `thincoder-core/tools/git.mjs` 今日只有 `:92` 的 `readonly: false`、无 `isReadonlyAction`）：
  - 六项平铺 ⇒ 只读：`["diff", "status", "log", "show", "ls-remote", "blame"]`；
  - `checkpoint` ⇒ 只读集 = `["list", "cat"]`（该档 `:53`–`:55`，逐字 `if (args.action === "checkpoint") return ["list", "cat"].includes(args.checkpointAction)`；`:54` 的注逐字「但清的是 commit 后已失去意义的过期快照——保留只读分类免审批（CHECKPOINT.md F6/D3 设计意图）」）；
  - `tag` / `branch` / `stash` / `remote` / `worktree` ⇒ 各以 `*Action === "list"` 判只读（`:56`–`:60` 五行逐字同形），其余值判写型；
  - 其余 action ⇒ 写型（该档 `:61` 注逐字 `// add/rm/commit/push/fetch/pull/reset/revert/merge/cherry-pick/checkout/restore + tag/branch/stash 写操作`）。
- **取「抄齐」，不取「明示偏离」**：偏离会让核钩子与端装饰体答案相反，而端装饰体同时是权限短路 ∥ planMode 的判据（`thincoder-core/tools/git.mjs` 旁 `dispatch.mjs` 两处经 `tool.isReadonlyAction` 判），改它 = 改审批行为并推翻 `CHECKPOINT.md` F6/D3 的既有裁定，须用户另裁；本门的题目是「这笔写替哪条账服务」，不是重划只读面。
- **端装饰体随核钩子落地一并删**：`thincoder-vscode/src/tools/index.mjs` 里那个 `isReadonlyAction` 覆写删掉、`...coreGitTool` 展开保留（`CHECKPOINT.md` F6/D3 的口径注随名单搬进核钩子，语义不改）。理由：核有钩子后，端覆写是同一份名单的第二份拷贝，而 `tool?.isReadonlyAction?.(args) ?? …` 的优先级让端覆写吃掉核答案 ⇒ 两份必然漂移；删后 CLI ∥ desktop ∥ vscode 三面同答案，单源 = 核钩子。
- **缺钩子的面**回落核名面谓词得 `false` ⇒ 写型 ⇒ 要号，fail-closed，不出洞。
- **同一条命令经两把工具答案不同，这是有意的**：`bash` 跑 `git status` 要号（命令字面无法静态分类，决策 36），`git({action:"status"})` 不要号（枚举可判，决策 37）。不是不一致，是两把工具的证据面不同——下一轮不要来「统一」它们。
- **根取法**：`git` 的路径集 = `toolTouchPaths(tool, args)` 再补 `args.path` ∥ `args.workdir` —— `workdir` 是「在这个子目录里跑」（`thincoder-core/tools/git.mjs:96` 逐字 `if (args.workdir) ctx = { ...ctx, cwd: resolveBaseDir(ctx.cwd, args.workdir) }`）；两者都不带 ⇒ 拒（`no project on this call`），不回落到会话 cwd（决策 41）。若 `toolTouchPaths` 已覆盖 `path`，不重复计入（实施轮实读定，判据 = 一笔 `git commit` 带 `workdir` 判在 `workdir` 所属项目的根上）。

**`manifest` ∥ `memory` 怎么问（入口集扫描域的两处补入）**

入口集按**落盘目标是否在项目内**划线，不按工具名划线。四把有落盘面、原不在入口集的工具逐个判过（实读坐标在表内）：

| 工具 | 落盘目标 | 判法 |
|---|---|---|
| `manifest` | `<项目>/PROJECT-MANIFEST.json`——`thincoder-core/agent-tools/manifest.mjs:163` 逐字 `initManifest(root, { writer: "main" })` ∥ `:202` 逐字 `writeManifest(root, manifest, { writer: "main" })` | `write` 要号；`init` 条件豁免（豁免支在门体取根步——决策 43）；`read` 不要号。`action` 是枚举（`thincoder-core/agent-tools/manifest.mjs:133`），按值判不是猜内容——与 `git` 同法 |
| `memory` | `layer:"project"` ⇒ `<项目>/.thincoder/memory/**`——该工具 `layer` 描述逐字「project (shared via this repo's .thincoder/memory/)」；单条 `delete` 的层由 **id 前缀**定（`thincoder-core/memory/memory-tool.mjs` 逐字「layer is OPTIONAL … else the id prefix routes the delete」） | 落 project 层的写型 action 要号，认两个输入：`layer:"project"`，或单条删除且 id 前缀 = `project:`（`layer` 省略时工具按前缀路由到 project 层）。`personal` ∥ `team` 落用户数据目录 ⇒ 不要号；`put` 缺省 `personal`（逐字 `put defaults to personal`）⇒ 缺省径不进本门。`clear` 只对 personal 开放、`maintain` 无 `layer` 参数 ⇒ 两者落不到项目内档，不收进写型枚举 |
| `settings` | 用户数据目录的 `config.json`——该工具自述逐字「set = 写盘（config.json——磁盘真相最小化：只写被设的键）」；路径旁证 = `thincoder-core/memory/memory-tool.mjs:140` 逐字 `set memory.team in ~/.thincoder/config.json` | 不写项目内档 ⇒ 不进入口集 |
| `browser` | 自有 profile 与截图目录（`~/.thincoder/browser/…`） | 不写项目内档 ⇒ 不进入口集 |

- **这是扫描域，不是全称句**：上表 + 十件既有 = 「凡能把字节落到项目内的工具都在入口集内」的全部依据；新增工具进核时按同一问题判一次（落盘目标在不在项目内）。
- **`memory` 按 `layer` ∥ id 前缀判的边界**：`layer` 是枚举、缺省值有定义，id 前缀是工具自己的路由约定 ⇒ 两者都按值判；不解析笔记内容、不按标题猜（决策 36 的禁令同源）。
  只看 `layer` 会漏掉「不带 `layer`、按 `project:` 前缀删 project 层档」那条路——它删的是项目内字节，与 `layer:"project"` 同一后果。
- **`manifest` 的 `writer: "main"` 闸不受影响**：它判的是写者身份，本门判的是「替哪条账服务」，两件并存、互不替代。


**代价（写进设计，不回避；用户 2026-11-03 02:03 认下）**：工程模式下父侧**任何** `bash` ∥ `execute` 都要有在途行——包括 `npm test`、`git status`、`ls` 这类只读命令。这不是遗漏，是选的：命令行内容无法可靠静态分类（`node -e` / `npm run <脚本>` / 脚本参数拼接都能落盘），任何按字面分类的过滤器都是第二个洞，而且它给的是假安全感——“看上去筛过了”。

**正路（不是开子）**：挂行与开档都不经过这两把工具（`ledger` ∥ `batch` 是工具调用）⇒「没号就没法挂号」的锁死不存在。工程模式的第一件事实就是「先挂行、再开档」，之后该根就有在途行，跑什么都过。当下会话的号写在它绑定的批档档头 `> 台账 = #N` 那一行——父侧与子代理都不需要去查台账。

- **判序**：① 解析项目声明（缺 ⇒ `no project on this call`；上溯无 manifest ⇒ `declared project is not a project`；定位参数形式下某个目标不在任何项目里 ⇒ 同一句 `<case>`，清单单位换 `unknown — no project owns this write's target`）→ ② 读该根台账（读不到 ⇒ 拒）→ ③ 按号找行（不在盘 / 非在途 ⇒ 拒）。项目先判：判据点不存在时，号对不对无从谈起。
- **判据点由调用方给出**（决策 41）：会话锚只用于解析相对路径与定界，不再充当判据点；声明无效（缺 / 不是项目 / 越界）就是拒。
- **两种「根」不是一回事（判据的钉子）**：声明路径**已带** manifest（或其内部子目录）⇒ 正常判；manifest **在而不可用**（读不动 / 坏 JSON）与「根推得出、台账库却开不了」⇒ **拒**，另起 `(ledger unreadable — <原错>)` 一行。判的是「是不是项目」，不是「项目好不好用」。
- **一笔写跨两个项目**：同一号要在每个目标所属项目的台账里各查到才放行；任一目标查不到 ⇒ 整笔拒、文件字节零动（原子写）。这是上表的派生结论，不另立观测。
- **读法**：判据函数 `ledgerRowAt(declared, ledgerNo, cache)` 住本档**模块内**，不导出——唯一消费方就是本门。依次判：解析声明 → 取根（(b) 支 `resolveLedgerRoot(声明, agent.cwd)`：起点在会话锚之内 ⇒ 沿祖先链上溯到最近带 manifest 的目录；(b) 支取不到再走 (a) 支：声明路径自身即带 manifest 且 `agent.cwd` 在它之下 ⇒ 根 = 声明路径；两支都取不到 ⇒ 拒、含 `declared project is not a project`）→ `ledgerQuery({cwd: root, boundary: root})` 取该根行集 → 按 `id` 找行 → 判 `status`。
  `ledgerQuery` 现有过滤键只有 `status` / `kind` / `board` / `trigger` / `task_book`（`thincoder-core/ledger-cmd.mjs:95` 签名逐字），**没有按 id 的过滤形，本批不为门新增一个列过滤**：行集取全量后按 `id` 找（同一笔写的多目标按 `root` 缓存，一次写只读一遍账）。
- **`boundary` 必传，传的就是本门刚算出的那个根**：`openLedger` 的 `@param` 逐字「上溯上界（会话锚——**必传**；缺则该值缺失即失败，不落 `process.cwd()`）」，体内 `resolveLedgerRoot` 首行即 `resolve(boundary)`——缺省直接抛 ⇒ 每一笔写都被判成「台账读不到」。调用形 = `ledgerQuery({cwd: root, boundary: root})`。
- **`#` 可省**：`"#2016"` 与 `"2016"` 同判（剥前导 `#` 后须为纯数字；留在 `ledger` 里的非数字原值原样带进拒文）。
- **三问（判据函数与导出名的既有件答案）**：`existing: thincoder-core/ledger-cmd.mjs:95 ledgerQuery`——返回行集含 `id` / `status` 两列，本门只读；用它，不另写查询。本门上一版的 `ledgerOpenAt`（`thincoder-core/agent/write-gate.mjs:210`）判的是「有没有在途行」，判据换了，函数体与名字一起换（`ledgerRowAt`），旧形不留。
  两个新名取代旧名 `ledgerOpenWriteConflict` / `ledgerOpenAt`：旧名说的是「台账开着吗」，口径比新判据窄一层——名字留着，下一个读代码的人先学会的是旧规则（同决策 4 ∥ 32）。
- **最近先例**：本档 `§4` 决策 32（零消费判据退场）。实现坐标 = `thincoder-core/agent/write-gate.mjs` 的 `ledgerRowAt`（模块内、不导出）∥ 设计档节 = 本档 `§4` 决策 32 与 `§2.3` 判据表 ∥ 先例批号 = 台账 `#2016`（`docs/batches/2026-11-03-write-gate-ledger-bind.md` 那一批）。
  **对齐**：一个导出名 + 一个模块内判据函数，不新增门、不新增导出。**偏离**：32 删的是判据，本轮换的是判据的**输入**（从「该根有没有行」换成「这一笔报的号」），故连带面多一处——入口集工具的 schema 与工具描述（`§3`）。
- **面在这里退场**：判据不再随目标面变化（号在途就写，不论目标是文档面还是产品面），原「按面选拒文变体」的三条从句（产品代码 / 产品测试 / 文档）随判据一起删。
  `write-gate.mjs` 对 `faceDetail` 的 import 因此成为零消费，一并删；`thincoder-core/agent/write-face.mjs` 本体不动——设计门与索引面仍用它。
- **自洽（本批落地那一刻起，父侧自己的写怎么过）**：本批的账 = `#2016`（`在途`，`task_book` = 本档）。落地后父侧每一笔写盘带 `ledger:"#2016"`，实施席写代码同理。
  **挂行与开档都不经过写面**：`FILE_MUTATORS = new Set(["write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit"])`（`thincoder-core/agent/helpers.mjs:39` 逐字），`ledger` 与 `batch` 皆不在其中 ⇒「没有号就挂不了账」的锁死不存在：先挂行、再开档，然后才许写。
- **子代理面（`depth > 0`）零改**：既有 `depth === 0` 守卫不动，token 门照旧。子代理调写工具时 schema 里也有 `ledger`，但本门**不核**它——子代理的号来自它绑定的批档档头 `> 台账 = #N`（那一行它本来就要读），不需要自己查台账；父侧派单时把号写进任务书即可（`§2` 收口行点名这条纪律，不做机械判据）。
- **入口集的判据 = 凡能把字节落到项目内的工具都在内**：上表逐项扫描的结果就是这句话的依据（十件既有 + `manifest` ∥ `memory` 两处补入 + `settings` ∥ `browser` 两处不写项目内档），不写「其余全部在入口集内」这种没有扫描面的全称句。`ledger` ∥ `batch`（挂行 / 开档 / 写批档段）不在入口集，读类工具也不在。
- **与既有设计门的关系（并列、不替换）**：设计门问「设计做没做」，本锁问「这笔写替哪条在途行服务」。设计门自己的文档面放行原样保留——本锁不读它、也不改它。

| 态 | 设计门 | 本锁 | 结果 |
|---|---|---|---|
| 无活设计槽 · 写产品面 | 拒 | 不可达 | 设计门拒文（`engineering design gate`） |
| 有活设计槽 · 写文档面 · 号在途 | 放行 | 放行 | 写入 |
| 有活设计槽 · 写产品面 · 号在途 | 拒 | 不可达 | 设计门拒文（设计未做） |
| 无号 ∥ 号非在途 | — | 拒 | 本锁拒文（设计门若先拒，报的是设计门那条） |
| 未声明项目 ∥ 声明路径无 manifest | 放行（设计门的判据点仍是会话锚，本批不动它） | 拒 | 本锁拒文（`no project on this call` ∥ `declared project is not a project`） |

- **只在工程模式生效**：开关 = `agent.config?.agent?.engineering`（与设计门同一枚）。普通模式按 `docs/core/requirements/NORMAL-MODE.md` 的「纪律自持」不动——挂成两模式通用 = 改普通模式的产品行为，没人裁过（决策 18）。

**工具 schema 面**：`bash` ∥ `memory` ∥ `execute` ∥ `git` ∥ `manifest` 的 `parameters.properties` 各加 `project`（`type: "string"`，描述 = `PROJECT_PARAM_DESC`）；写盘七件不加（目标路径恒在）；`ledger` 面十二把不动。

- `project` 描述单源 = `thincoder-core/tools/shared.mjs` 的 `PROJECT_PARAM_DESC`，逐字：「本笔调用服务的项目根——带 `PROJECT-MANIFEST.json` 的那个目录（绝对路径，或相对会话 cwd）；工程模式下父侧 `bash` ∥ `memory` 必带，`execute` ∥ `git` ∥ `manifest` 在定位参数缺位时必带。纯声明：不改执行目录（`bash` 仍在会话 cwd 执行，`workdir` 才是改执行目录的那个）。」
- `project` ∥ `ledger` 都**不进 `required`**（决策 35 同款理由：静态 `required` 会让普通模式与子代理读到一条没人核的要求）；机械强制在门。
- 写盘七件沿用目标路径、不加字段（决策 40）；`execute` ∥ `git` ∥ `manifest` 先认各自定位参数（`workdir` ∥ `path` ∥ `target`），缺位时读 `project`，两者都无 ⇒ 拒。

- **代价 = 拒文是唯一教学面（决策 38）**：不传号 ⇒ 撞拒 ⇒ 读拒文才知道要传。所以拒文不是「顺手加的好东西」，它与 schema 同属判据面，必须写全三件：缺什么（`<case>`）、要带什么（`Pass ledger:"#N"`）、当下有哪些号可带（`In-flight rows in this project's ledger right now: …`），无在途行时给挂号两步。删掉这一段，工具面就没有任何地方告诉模型「有这个参数、该带什么」。

- **清单上限 10 条**：在途行多时逐条列全会把教学面变成台账导出。第 11 条起折成 `#N, #M, … +K more`（K = 余数）；`none` 与上限互斥，不并列。

- **无项目可问时清单单位写 `unknown — …`（三形各一句）**：没有可判的项目，就没有「本项目的账」可问——写 `none` 会被读成「项目判得出、只是清单空」。三形各有自己的条件与句子：未声明项目 ⇒ `unknown — no project on this call`；声明不是项目 ⇒ `unknown — the declared project is not a project`；写盘目标不在任何项目里 ⇒ `unknown — no project owns this write's target`。与 `none` 互斥：`none` 只说「项目判得出、清单空」。

拒文（逐字，机检可断言）= 一条基串 + 按情形选的 `<case>` 从句 + 一段用法句（**两个输入一次点出**）：

```
write refused — ledger row not bound: <case>. Pass project:<the project root that carries PROJECT-MANIFEST.json> and ledger:"#N" on this call — engineering mode binds every write to a project and to the in-flight ledger row it serves; a call that names neither is refused. In-flight rows in this project's ledger right now: <#N, #M … | none | unknown — no project on this call | unknown — the declared project is not a project | unknown — no project owns this write's target>. If none is in flight, hang one first — neither step is a write: ① ledger({action:"add", title, kind, cwd:<project root>}) hangs the row; ② batch({action:"create", ledger:"#N", topic, source}) opens the record over it (row → 在途).
```

| 情形 | `<case>` |
|---|---|
| 未传 / 空串 / 全空白（`ledger`） | `no ledger number on this call` |
| `ledger` 非行号形 | `ledger number "<原值>" is not a row number — pass "#N" or "N"` |
| 号不在该项目的账上 | `row #<N> does not exist in this project's ledger` |
| 号在盘 · status ≠ `在途` | `row #<N> is "<status>" — only a 在途 row carries writes` |
| 未声明项目 | `no project on this call` |
| 声明路径上溯无 manifest | `declared project is not a project (no PROJECT-MANIFEST.json at this path or within the session anchor): "<path>"` |
| 定位参数形式下某个目标不在任何项目里（逐目标各自沿祖先链取根：写盘七件的目标路径 ∥ `execute.workdir` ∥ `git.path` ∥ `git.workdir` ∥ `manifest.target`） | `declared project is not a project (no PROJECT-MANIFEST.json at this path or within the session anchor): "<path>"`（清单单位 = `unknown — no project owns this write's target`） |
| 台账读不到（不属上述情形：号对不对都判不了） | `no ledger can be read for this project` |

**各支拒文的出处（决策 6b：每支要么有实机出处，要么并支）**

| `<case>` | 出处（实读 ∥ 可复现） |
|---|---|
| 缺号 | 实机：2026-11-03 02:01 父侧 VSC 端那笔 `write` 不含任何台账号（批档 §1 现象条），正是本门今天拦不住的那一笔 |
| 非行号形 | 实机形 = 照抄档头：批档档头逐字 `> 台账 = #2016（core · 归批）`，整行照抄即非纯数字。既有同形在 `thincoder-core/ledger-write-ops.mjs:304` 逐字 `id = Number(ledgerNo)` ⇒ 非数字成 `NaN`、行查不到，报错指向不了人；本门把它提前成一句点名的拒文 |
| 号不在盘 | 实机形 = 跨项目引用：台账按项目根隔离（同一夹具档 `test/integration/batch-live-batch-lock.test.mjs` 用 `ledgerKey(root)` 建库位），A 项目的号在 B 项目的账上查不到；同一场景 = 臂⑬ 的 `git workdir` |
| 号非在途 | 实机：档头 `> 台账 = #N` 那行不随行状态变——收口后该行落 `待核销`、勾销后落 `已核销`（六态见 `docs/core/design/LEDGER.md`），照抄档头的旧号即撞此支；`<status>` 点名是该支的全部价值 |
| 未声明项目 | 实机：2026-11-03 02:53 重启后 `bash` 不带 `ledger` 照放行——会话锚 = `D:\teamcode`（容器根，祖先链无 manifest）⇒ 旧判据「推不出 ⇒ 门不管」。新形下同一笔落 `no project on this call` |
| 声明路径不是项目 | 实机形 = 把容器根 `D:\teamcode` 当项目传进来（两个项目在它下面，它自己不是项目）：界内上溯无 manifest ⇒ 拒并点名该路径——「不是项目」与「不是这个项目」是两种拒，不是两种放行 |
| 目标不在任何项目里 | 实机形 = 工程模式 depth-0 写 `<仓外临时目录>/x.mjs`（决策 41 认下的代价面）：逐目标沿祖先链无 manifest ⇒ 拒并点名该目标路径。与上支同句是代码实形：`thincoder-core/agent/write-gate.mjs` 逐字 `const caseNotAProject = (p) =>` 一句被两支共用（写盘目标沿祖先链搜得更远，那句括注仍为真），分的是清单单位（`unknown — no project owns this write's target`）而不是 `<case>` 串 |

- **台账读不到时**：基串之后另起一行 `(ledger unreadable — <台账原始错误>)`，且不列在途行清单（读不到就没有清单）。
- **拒文要列在途行（判据面要求，决策 38）**：`ledger` 不进 `required` ⇒ 模型不知道有这个参数，第一次撞的就是这条拒文，它是这条设计唯一的教学面。做成修法而不是兜底（门照拒）：列出当下在途的号，无在途行时给挂号两步（`ledger add` → `batch create`，两步都不经过写面）。

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
- **崩在窗口内**（新建行已 INSERT ∥ 接管的行已改、`COMMIT` 未执行、档已落盘）：SQLite 回滚事务 ⇒ 行回到原态；档在盘且无行指它 ⇒ 台账里也无在途行（锁照拦），重建同名档会被 `wx` 拒 → 拒文点名该残留路径。
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
| 为何不复用档头 `> 台账 = #N` | 档头那行是**本档自己那一行**（机器按真实行号填，纯人读面——机器判据不读它）；`覆盖账` 是**手写的意图面**（打算覆盖哪几条）。判据要拿「意图」比「事实」——用同一行就是自己比自己，漏登记的那条永远查不出 |

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
| §1 · §2 | 0 | — | §1 冻结门 ∥ 台账在途行（写锁 `§2.3`）∥ 重开合取 ∥ 在飞批扫描 | 不改判 |

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
| 写锁（笔-账绑定） | `write-gate.mjs` `ledgerBindWriteConflict`，挂 `dispatch.mjs` Phase 1（`§2.3`） | 辖内任何写盘 ∥ `bash` · `execute`（不分面、不分类命令）∧ 未携带 `ledger:"#N"` ∥ `#N` 不是本项目台账里的 `在途` 行 ⇒ 拒 | 仅工程 | `§2.3` 串 |
| §3 写入闸（裁定兜底） | `batch` append §3（`thincoder-core/agent-tools/batch.mjs` `appendBatchRecord`，段键 `n === 3`） | 判定输入 = 净化后正文（`sanitizeText(args.text)` 的结果，落档的就是它）；读数 ∈ {`无裁定行`, `两者同携`} ⇒ 当场拒，`VERDICT: changes-required` 照写（`verdictGapOf`，与下一行判据 ② 同一函数） | 两模式（写入方在两种模式下都只有评审实例） | `R-G3` |
| §5 写入门（段序门） | `batch` append §5（`thincoder-core/agent-tools/batch.mjs` `appendBatchRecord`） | 两条合取：① `§3` 状态行 = `评审通过` ② `§3` **最近一轮轮次块自己携 pass 裁定行**（零豁免：声明已停用） | 两模式 | `R-G2` ∥ `R-G2b` |
| 收口门 | `close` ∥ `status` 写 `§1 已收口` | 链门（§2 / §3 / §4 / §6 **各有内容**——`不适用` 声明已停用）**∧** `§3` 状态行 = `评审通过` | 两模式 | `R-G1`（§3 未过）∥ 既有 `J1`/`J2` |
| 核销门③ | `ledger-close-proof.mjs` `assertCloseOutProof` | 该档 `§3` 状态行 = `评审通过`（不读 token 槽归属；与收口门读同一件档面事实，零豁免） | 两模式 | `R-L3` |

**收口门的 §3 内容臂留着**（不换成只判状态词）：既有链门 = `§2`/`§3`/`§4`/`§6` 各段有内容（声明一律拒，`docs/core/design/BATCH-RECORD.md` §4.18-A），本批在它之上**加**一条状态词臂，两条全需满足。理由：内容臂守的是「段里真跑过」，状态词臂守的是「跑的结论是 pass」——换掉内容臂 = 门被放宽（一段空着但状态词对就过），那正是本批要堵的洞。

**`不适用` 声明机制整体退役，两道门读同一件档面事实**

两道门问的是同一件事实：这批有没有经过设计评审。判据 = `§3` 状态行 = `评审通过`，两门同读、零豁免。

- **声明机制退役（2026-11-02 用户裁定）**：`thincoder-core/agent-tools/batch-skeleton.mjs` 的 `INAPPLICABLE_SEGMENTS` = 空集，声明判定函数不导出（不立恒 false 版——插座留着就会被重新接上）；`sectionContentState` 只有 `content` / `empty` 两态，无 `not-applicable` 分支。
  `§1` 里出现 `> 不适用：§N —— <理由>` 即由 `malformedInapplicableLine` 拒——行首命中 `^>\s*不适用` 的每一行都是非法行，形合规与否同判。那一行是「停用机制的痕迹」，不是一条出路。
- **为什么连 `§2` / `§4` 也封**：声明「本批无设计」∥「无批准」就是没设计、没批准就把这批结了账，而这两条连「评审实例才写得了」那层外部事实都没有，全是一句话。
  `§3` 的声明至少还要求一个外部事实（只有绑本档的评审写得了状态行）——那是它比 `§2`/`§4` 更轻的损害，不是它的豁免。
- **判据不另立函数**：合取去掉后，判据 = `readSectionStatusWord(src, 3) === STATUS_WORDS[3].done`，三处门面同读一个词表（`STATUS_WORDS` 单源），不新增导出。
- **不改判序 / 不改状态词表**：核销门仍 ① → ② → ③ 逐项判、一次报全缺项；收口门仍 链门 → §3 臂 → 单测档门 → 机检门。
- **拒文同笔收正**：三处（`closeoutChainError` ∥ `inapplicableDeclarationError` ∥ `§5` 门括注）把「或声明不适用」删干净——路已不存在，留着就是把人引到死路的提示。收口门 `R-G1` 与核销门 `R-L3` 的字面本就不含这条路，零改。
- **有账之笔的两道闸**：设计门问「设计做没做」；写锁问「这笔写替哪条在途行服务」。
- **代价（用户认下）**：此后每一批（含纯措辞批、普通模式）都要有设计、评审、批准；普通模式与工程模式共用同一条设计评审通道（`docs/core/design/BATCH-RECORD.md` §4.16）。

**模式范围（决策 18）**：写锁仅工程模式；§5 门与收口门两模式同判。
- 理由：写锁是**强制机制**（拦不拦得住写），工程模式专属；段序门与收口门是**批档机制自身的段序纪律**——批档一份、两模式共用，段序在两种模式下都是真话（实现本来就发生在评审之后）。
- 普通模式没有声明出路：声明机制已退役，普通模式与工程模式一样要一轮真评审（同一通道，`docs/core/design/BATCH-RECORD.md` §4.16）。
- **这是有意改普通模式行为**（此前普通模式的 §5 无前置、收口不判 §3）：挂用户 2026-10-27 11:35「必须走过全流程」+ 11:52「同意」；不取「仅工程模式」——那会让普通模式的批档不必声明就跳过评审段，链门在两种模式下含义不一。

**§5 为什么该判 §3**：「评审进状态机」唯一能机械落地的位置就是 §5 写入点——实现发生在评审通过之后，序在这里才判得出真假。两条旁证：

- **修正轮不受影响**：修正轮在 §3 已 pass 之后改代码、追加 §5，判据当场成立。
- **不留口子**：`不适用` 声明机制已退役 ⇒ 收口前置即拒。无评审的批不存在——普通模式的收口评审就是设计评审通道（`docs/core/design/BATCH-RECORD.md` §4.16）。

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
- **不误伤**：修正轮在 `§3` 已 pass 之后改代码、追加 `§5`，判据当场成立。
- **`status` 单写不再足以开 `§5`**：本条落地后，只把 `§3` 状态行置 `评审通过` 而不落一块携 pass 裁定的轮次块 ⇒ `§5` 照拒。既有夹具里凡是「`status` 置 pass ⇒ `append §5`」的写法都要补块（`test/RTM.md` 14-8 即此形）。
- **存量出路（既有在飞批）**：`§3` 的 pass 块若写在「裁定行进 `§3`」成文之前（无裁定行的旧块）⇒ 判据 2 判成无结论、`§5` 不可写；而工程模式的 `§3` 只由绑本档的评审实例写（`batch.mjs:78-87`），父侧不能自行补块 ⇒ 出路 = **追加一轮携 pass 裁定的评审**（块落进 `§3` 即可）；不再跑一轮的，收口面照判据 1 走（收口门 ∥ 核销门③ 只判状态词，见下条）。这是可枚举的小集合（此刻在飞的批），不是持续产生的形。
- **不对称（已登记残余）**：判据 2 只落 `§5` 写入门。收口门与核销门③ 仍只判判据 1（状态词）⇒ 一笔「只写散文、无裁定」的 `§3` 之后，实现被拦而收口 / 核销照走。不同步扩的理由：`§5` 门判的是「能不能开工」，开工面拦得住损失就止住了；收口是本批**已经做完**的事，在那里再插一道评论文本判据，只会让台账行卡在结账位、逼父侧改档才能结账——比它挡住的洞更贵。日后要扩，先重估这条代价。

拒文（逐字）。判据 1 不过（与盘上实现一致）：

```
batch: §5 append refused — the implementation section opens only after the design review passed (§3 状态行 = <value>，须 = 评审通过). Nothing was written.
（`§3` 须真跑过一轮评审并给 pass——`§3` 不可声明不适用。）
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
batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. Missing: <段表>. Each named section must carry its own content — the `不适用` declaration is retired (every batch needs its design, its review and its approval). §6 must carry its verification. Nothing was written.
```

**四处拒文逐字面（收正清单）**：除上述两条，`closeoutS3Error`（`thincoder-core/agent-tools/batch-closeout.mjs:53-56`，逐字现为「……§2 / §4 / §6 各段须有内容或由 §1 声明不适用」）与 `§5` 门括注（同档 `:141-142`）同携已停用路——四处一并收正。`§3` 状态词臂拒文收正后只留「评审须真跑过并给 pass」。

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

面判定的机器单源 = `agent/write-face.mjs`；提示词里的面分流表必须与它同口径——否则模型按提示词、机器按代码，两套口径并存。

- **表本身**：`thincoder-core/prompts/discipline-engineering.md` 的 `## Change-face routing (doc face ∥ product face)`——两行（`Doc face` ∥ `Product face`）；标题与两行措辞的落笔字面 = 批档 `§2.3.4`，本档不另抄一遍。
- **钉句**（表后紧随一行，逐字）：`面判定机器单源 = thincoder-core/agent/write-face.mjs；本表与本行同义，冲突时以该档判据为准。`
- **落笔 = 实施轮 eng-coder**。

### 2.10 面判据 = 两值（文档面 ∥ 产品面）

`write-face.mjs` **直接判两值**：命中文档面 ⇒ 放行；其余 ⇒ 产品面（fail-closed）。判序见下表。

**构建产物目录不单列**：`dist` / `build` / `coverage` 同属产品面——判据不区分「机器生成」与「人写的」，一条判据比两条更省读者的判断；代价 = 清理构建物也要开批档。

而 `vendor` / `third_party` / `Pods` / `target` / `out` / `obj` / `.venv` / `venv` / `bin` 里**可能有人写的补丁**（`thincoder-cli/bin/**` 就是产品入口），放行它们会造出一条绕开批档的侧门——与本节末句「新目录能例外，锁就等于不存在」相抵。

名单只剩一份：`SKIP_DIRS`（42 项）答「索引剪什么」，也答「扫描跳什么」。`BUILD_ARTIFACTS`（10 项构建产物集）随面判据两值化**整条删**——它唯一的消费面就是面判（`agent/write-face.mjs` 的 `import` 与放行支）；面判不再问「这是不是产物」，这个集就没有第二个问它的人。留一个没有消费方的导出，下一轮读它的人先要判「这还成立吗」。

| 序 | 面 | 结果 |
|---|---|---|
| 1 | 出辖（祖先链无 manifest） | 放行（`dispatch.mjs:107` 同口径，零改——辖界，不是面） |
| 2 | manifest `docRoot` 前缀命中 | 放行（文档面） |
| 3 | 文件 = `PROJECT-MANIFEST.json`（项目状态档） | 放行（文档面） |
| 4 | 其余一切（含 `code` / `temp` / `aux` / `state` / 构建产物目录 / 仓根 `scripts` · `test` · `.thincoder` · `.github` · 锁文件） | **拦**（产品面，fail-closed） |

**`test/` 的面（一条判据）**：仓根 `test/**` 与包内 `test` / `tests` 同属产品面，改它要开批——需求档 §13.5 逐字把「**仓根** `test/**`」列在产品面。理由：测试与它守的代码同生共死，改测试与改代码在同一轮评审、同一份批档里。

**包内 `scripts/` 为什么拦**：`thincoder-core/scripts/check-syntax.mjs` 随核发布，是产品的一部分。面判只认声明文档根，包内包外同一条判据——没有「这个 `scripts` 在包里所以算产品」的第二种判法。

**项目内新建业务目录不放行**：`thincoder-core/newthing/foo.mjs` 照拦。新目录能例外，锁就等于不存在。

**拒文**：单源住 `§2.3`（一条基串 + 按面选的 `<what>` 从句 + 两步照做句），本节不另抄一份——同一道门两套逐字，实施席就不知道该照哪一份写。本节只判**面**（两值 + 判序），不判拒文。

**代价（有意）**：新建目录不建档就改不了；产品测试目录同样要批档。上一个目录先建批档，是这条锁要的摩擦。

**残留（写出来，不掩盖）**：第三方目录（`vendor` / `third_party` / `target` / `out` / `obj`）**不放行**——它们可能携带手写补丁，宁可多开一份批档。产品包内的 `dist` / `build` / `coverage` 同属产品面：判据不区分「机器生成」与「人写的」，一条判据比两条更省读者的判断；代价 = 清理构建物也要开批档。

**不做什么**：`conventions.mjs` / `classifyPath` / `isCodePath` **本体**零改。`codePaths` 键保留，本批不动。

六个消费面逐个点过：`agent/dispatch.mjs:115`（**换判源**：`isCodePath` → `faceOf`，`§2.1`）· `agent-tools/verify.mjs:193` · `agent-tools/advisor-settle.mjs:74` · `advisor/repos.mjs:122` / `:146` · `declaration.mjs:246`（此五处语义零改）。
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
```

**名单只此一份**：`BUILD_ARTIFACTS`（10 项构建产物集）随面判据两值化整条删（`§2.10`）——「不开批档能写什么」这个问题不再由排除名单回答，放行面只剩文档面一条。

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
| `agent/write-face.mjs` | 面判两值（`§2.10`）；不引排除名单——「什么算产物」不再参与面判定 |

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
| `待核销`（收口后重开） | **→ `在途`** | 行回工作位，活继续在这一行上；台账里又有该档的在途行 ⇒ 写锁放行（`§2.3`） |
| `已核销`（核销后重开） | **不动** | 终态（`ledger-db.mjs:163` 唯一出边 = `已废弃`）；行上挂着结账证据，拉回来等于抹掉「结过账」 |
| 其余（`条件` / `待讨论` / `待设计` / `已废弃` / `在途`） | 不动、不点名 | 都不是本批的活跃工作行：没做的、撤回的、已在工作位的 |

**`待核销` 为什么必须回收**：不回收 ⇒ 重开后行仍 `待核销` ⇒ 台账里没有该档的在途行 ⇒ 写锁按 `§2.3` 判据把每一笔写盘都拒（不分面）。人要干活先被自己的锁挡住，唯一出路是手改行——本该自动的一步。

**`已核销` 为什么不回收 + 必须点名**：核销是一次结账，终态不可逆；「批档重开、行已核销」的处置是**另立新行**（新档 `前情` 指回本档）——`#1827` 那次只能另立 `#1828` 就是这条。静默不回 = 父侧以为行被带回来了，下一步写产品码被写锁拒、回头才查；回执点名 = 当时一眼知道要另立行。

**写法**：台账写点单源 = `ledger-cmd.mjs` 新导出 `ledgerReclaimBatch({cwd, batch, boundary})`，与 `ledgerReanchorBatch`（`:421-454`）**同形对称**——同一行集 `resolveBatchRows`（行集判据单源）、`BEGIN IMMEDIATE` 单事务、失败 `ROLLBACK` 零行改、**不抛**（返回形 `failed`）。

- 返回形：`{batch, reclaimed:[{id,status,title}], unreclaimable:[{id,status,title}], failed:string|null}`。
- 逐行：`待核销` ⇒ `UPDATE items SET status='在途', executor=? WHERE id=?`——`trigger` / `resume_when` / `evidence` / `updated_at` **零触**（机器回收不是人工推进，行龄读数照旧；同 `ledgerReanchorBatch:418` 口径）；`executor` = **本会话 `sessionId`**（一次事务内取一次），因为行回工作位、而干活的就是重开这个会话——`docs/core/design/LEDGER.md` AC-M2-7（现盘 `:970`）「进入「在途」的迁移带 `executor` = 会话 `sessionId`」因而在机器径上也成立，判活面（同档 §7.3.1，现盘 `:912`）不会读到空属主。`已核销` ⇒ 入 `unreclaimable`；其余 ⇒ 跳过、不点名。
- **回退边与 AC-M2-7 的随动**：`docs/core/design/LEDGER.md:171` 现写「迁移表仅此两出边；六态**无回退边**」——本批开出第三条出边（`待核销 → 在途`），该句随之改为「回退边唯一一条 = `待核销 → 在途`（重开回收）」，AC-M2-7 的「回退清除」子句由此有了表内路径：回退进入在途 ⇒ `executor` 写本会话，同 §3.1 ① 式。收正归合并轮，本档已定语义。
- `ledger.mjs:157` 公共面同步再导出。

**位次与失败语义**：① `rewriteAsReopen` 写盘（`:476`）→ ② `await reclaimOnReopen(abs, cwd)` → ③ 回执拼 `reopenReceiptLine(reclaim)`。

- **失败不否决重开**：重开是从误冻结里出来的唯一通路，台账库忙不该把档锁死。失败 ⇒ 重开照成、回执点名 `failed` 原文 + 后果 + 出路。
- 后果点名（本节的坑）：行仍 `待核销` ⇒ 台账无在途行，产品码写仍被写锁拒；出路 = 库恢复后 `ledger({action:"update", id, status:"在途"})`。
- **因此迁移边在册**：`ALLOWED_MIGRATIONS["待核销"]` 含 `在途`（`thincoder-core/ledger-db.mjs:166` 实读：`["已核销", "在途", "已废弃"]`）。没有它上面那句出路是假话（`ledgerUpdate` 会拒）。机器路径走直改、不查迁移表（同重锚）；这条边只为**人面**而设，是 `在途 → 待核销`（收口）的反向边。

**回执逐字**（`reopenReceiptLine`，空行不出；`failed` 非空时只出第三行，替代前两行）：

```
[ledger reopen] 本批待核销行 → 在途 N 行：#12 「…」；#15 「…」
[ledger reopen] 本批已核销行不可回收 M 行：#1827 「…」——已核销为终态，重开不回收；要继续做须另立新行（新档 §1「前情」指回本档）
[ledger reopen] 回收失败：<原始错误>——台账零改；行仍 待核销 的，台账里没有该档的在途行（写锁会拒每一笔写盘），库恢复后 update → 在途
```

### 2.14 核销边：唯一路径 = 在途 → 待核销 → 已核销

台账的核销边只留一条：`待核销 → 已核销`（勾销）。`待讨论 / 待设计 → 已核销` 这条边删除。

**判据（单源 = `thincoder-core/ledger-write-ops.mjs` 的 `applyRowClose` 首判）**：目标 = `已核销` ∧ 行现态 ≠ `待核销` ⇒ 拒。拒文逐字：

```
ledgerClose：核销仅限 待核销（现态 <X>）：<出路句>
```

**出路句按现态分支**（同一件事实、出路不同——对 `在途` 说「先 update 到 在途 认领」是让人重做一步已做的事）：

| 现态 | 出路句 |
|---|---|
| `待讨论` / `待设计` | `先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销` |
| `在途` | `先 update 到 待核销（做完才结账），再 close 勾销` |
| 归档态（`已核销` / `已废弃`） | `该行已归档（<X>），不在核销面` |

归档态那支不是新分支：改前同一输入也走这条首判并拒（旧判据 `待讨论 / 待设计 / 待核销` 本就不含归档态），行为零改，只把这句兜底话换准。

**连带退役**：同函数 `:163` 的追认 `evidence` 门随边一并删——边没了，它判的那件事不存在。批量面 `close --batch` 的跳过文案改判据句：`待讨论 / 待设计` 行 ⇒ `ledgerClose：待认领不可核销（须先 update 到 在途）`。

**最近先例**：同档决策 28（`§2.6`，同批裁定）。**对齐**——同一形状：删掉一条「读起来像捷径」的判据输入，不加门、不写「已注明不可达」；代价与存量处置当场写明。

**偏离**——28 删的是**声明**这个判据输入（`INAPPLICABLE_SEGMENTS` 清空，判据本体由 `STATUS_WORDS` 单源给）；本决策删的是**迁移表的一条边**（边集单源 = `thincoder-core/ledger-db.mjs` 的 `ALLOWED_MIGRATIONS`），故连带面落在台账面（批量面跳过文案 ∥ 工具描述 ∥ 服务端镜像）而不在批档面。另一处偏离 = 出路句按现态分支。

**为什么删这条边**（用户 2026-11-02 16:32 裁定）：台账状态机有序，四个未决态各代表一件事实。

- `待设计` = 设计没写；`在途` = 有人认领、正在做；`待核销` = 做完了、在等结账。
- 这条边一步跨过这三件事实 ⇒ 允许「没设计、没人认领、没验证」的行显示为已结账。
- 它今天走不通，只因为 `assertCloseOutProof` 恰好挡着。拿另一道门给自己的合法性背书，正是本批要消灭的形状。

**「条目在别处完成」仍成立**，走法换了：先 `update` 到 `在途`（认领）→ `待核销` → 勾销；`evidence` 仍记结账依据（`docs/core/design/BATCH-RECORD.md` §5.2）。不给捷径边。

**一处一词**：迁移没了，名字不留——设计档、工具描述、代码注释里凡写那条旧边名的，同笔改「勾销」或删。

**不改**：六态词表；迁移表其余边（`待讨论 → 待设计` ∥ `待讨论 → 在途` ∥ `待设计 → 在途` ∥ `在途 → 待核销` ∥ `待核销 → 在途` ∥ 任意未归档态 → `已废弃`）；`待讨论` 行的其他出口零改。

**存量**：盘上 `待讨论 / 待设计` 行从此销不掉。出路 = 认领后走全链，不是新开一条核销路。

## 3. 受影响文件

**档位结论**：`thincoder-core/agent-tools/batch-skeleton.mjs` 现盘已越软线（508 行；拆单见下表第二行）· `thincoder-core/agent/write-gate.mjs` 改后越线（510 行；本批不拆，切法见该行）· `thincoder-core/tools/shared.mjs` 本批改动后仍在软线内（496 行，余 4 行，触线即拆）——其余各档在软线内。

`thincoder-core/agent-tools/batch-lifecycle.mjs` 已拆，现盘 368 行、软线内（拆出的三档在盘：`batch-ledger-bind.mjs` ∥ `batch-closeout.mjs` ∥ `batch-reopen.mjs`）。

**`thincoder-core/agent/write-gate.mjs` 已越 500 行软线**（改后实测 510 行）。本批判据点改动不是净负，原「净负 ⇒ 不拆」的前提不成立 ⇒ **本批不拆**（父侧 2026-11-03 04:37 裁：本批目标是判据点换面，拆单是另一件事；实施已交付并全绿，插入拆分会把一批两件事混在一起），切法与结论见下表该行。

本批涉及的各档行数（2026-11-03 实读；方法 = 逐档按行切分计数、含空行，等价 `wc -l`。旧表用的 `Get-Content | Measure-Object -Line` 跳空行，旧读数因此系统性偏低）：

| 档 | 行数 | 档位结论 |
|---|---|---|
| `thincoder-core/tools/shared.mjs` | 496 | 软线内（余 4）；本批加 `PROJECT_PARAM_DESC` 一条常量 + 导出。触线判据 = 实施后 >500 则把参数描述常量（`LEDGER_PARAM_DESC` 及其 `_GIT` ∥ `_MANIFEST` ∥ `_MEMORY` 后缀 + `PROJECT_PARAM_DESC`）整体迁到新档 `thincoder-core/tools/param-desc.mjs`，`shared.mjs` 改再导出（描述仍单源、消费面零改） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 508 | **已越软线**；本批改动是删行（净负），净负回不到线下 ⇒ **拆单**：把裁定行锚与两条计划（`ROUND_HEADING_RE` ∥ `countRoundBlocks` ∥ `lastRoundBlock` ∥ `nextRoundNumber` ∥ `_V_PRE` ∥ `_V_SUF` ∥ `VERDICT_CHANGES_LINE` ∥ `VERDICT_PASS_LINE` ∥ `verdictGapOf` ∥ `statusResetPlan` ∥ `statusPassPlan`）整体迁到新档 `thincoder-core/agent-tools/batch-verdict.mjs`，`batch-skeleton.mjs` 改再导出；判据 = 拆后 ≤500 ∧ 十一件导出名逐条仍在、导出面零变 |
| `thincoder-core/tools/file.mjs` | 453 | 软线内（余 47）；本批只加 `ledger` 一个参数 ⇒ 不拆 |
| `thincoder-core/tools/git.mjs` | 428 | 软线内；本批加 `ledger` + `project` + 只读钩子 ⇒ 不拆 |
| `thincoder-core/agent/write-gate.mjs` | 510 | **已越软线**（改动前 413）：删放行臂与 `faceDetail` import 是净负的，但新增 `resolveDeclaredRoot` ∥ `ledgerGateTargets` 三态 ∥ `ledgerRowRefusal` ∥ `ledgerNoProjectRefusal` 与三句清单单位把这行数加上去了 —— 净效果是净增。**本批不拆**（父侧 2026-11-03 04:37 裁：一条目标换面不混拆单）；切法 = 写锁段（`ledgerRowAt` ∥ 拒文组装 ∥ `resolveDeclaredRoot` ∥ `ledgerGateTargets`）整体搬进新档 `thincoder-core/agent/write-gate-ledger.mjs`，`write-gate.mjs` 改 re-export（`ledgerBindWriteConflict` 导出名与调用面零变）；拆单归另一批 |
| `thincoder-core/tools/ops.mjs` | 347 | 软线内（`ledger` 一行） |
| `thincoder-vscode/src/tools/shell.mjs` | 334 | 软线内（端 schema 副本补 `ledger` ∥ `project` 两行） |
| `thincoder-core/tools/patch.mjs` | 307 | 软线内（`ledger` 一行） |
| `thincoder-core/tools/bash.mjs` | 304 | 软线内（加 `project` 一行） |
| `thincoder-core/agent/dispatch.mjs` | 282 | 软线内 |
| `thincoder-core/memory/memory-tool.mjs` | 247 | 软线内（加 `project` 一行） |
| `thincoder-core/tools/execute.mjs` | 244 | 软线内（加 `project` 一行） |
| `thincoder-core/agent-tools/manifest.mjs` | 234 | 软线内（加 `project` 一行） |
| `thincoder-core/agent/dispatch-run.mjs` | 185 | 软线内 |
| `thincoder-vscode/src/tools/index.mjs` | 178 | 软线内（删端覆写是净负） |

上表逐档给结论，无一档用「改后复量一次」代替结论。

| 文件 | 现况 | 变化 |
|---|---|---|
| `thincoder-core/agent/write-face.mjs` | 新档 | 面判 = 两值直判（`§2.10`）：文档面放行 ∥ 其余产品面拦；不叠 `classifyPath` |
| `thincoder-core/skip-dirs.mjs` | 新档 | 排除名单单源（`SKIP_DIRS` 42 项 · `SKIP_DIRS_FOLD` 18 项 · `SKIP_DIR_PREFIXES`，`§2.12`） |
| `thincoder-core/index-discover.mjs` | 改造 | 删本地 `SKIP_DIRS`、改引单源 + 同名再导出 |
| `thincoder-core/tools/shared.mjs` | 改造 | 删 `IGNORED_DIRS`；`ledger` 参数描述单源（`LEDGER_PARAM_DESC` + `_GIT` ∥ `_MANIFEST` ∥ `_MEMORY` 三条后缀）+ `PROJECT_PARAM_DESC`（`project` 描述单源）——十二处各抄一遍就是同一机制十二份描述，措辞漂移后模型读到十二版规则 |
| `thincoder-core/tools/search.mjs` | 改造 | 三处 `IGNORED_DIRS` → `SKIP_DIRS`（改名） |
| `thincoder-core/tools/tree.mjs` | 改造 | 删本地 `SKIP_DIRS`、改引单源 |
| `thincoder-core/agent/live-batch.mjs` | **删档** | 判据改读台账在途行（`§2.3`）后 `liveBatchOpen` 零消费面 ⇒ 整档删（不留空壳、不留备用导出）；台账判据入住 `agent/write-gate.mjs` 的模块内函数 `ledgerRowAt`（不导出） |
| `thincoder-core/agent/write-gate.mjs` | 改造 | 写锁 = `ledgerBindWriteConflict`（判据 = 本笔报的 `#N` 是目标项目台账里的 `在途` 行）+ 模块内判据函数 `ledgerRowAt`（项目根推导 ∥ `ledgerQuery({cwd, boundary})` 取行集 ∥ 按 `id` 找行判 `status`；`ledger` 动态 import——W8 契约②，不导出）+ 四情形拒文；`faceDetail` import 删除（面在判据里退场）；导出名与模块内判据函数旧名 `ledgerOpenWriteConflict` ∥ `ledgerOpenAt` 一并换掉；入口集补 `bash` ∥ `execute` ∥ `git` ∥ `manifest` ∥ `memory`（`bash` 只认 `project` 声明——无定位参数，缺则拒（`no project on this call`）；`git` 按 `path` ∥ `workdir` 推根、`execute` 按 `workdir` 推根，缺位时读 `project`，仍无则同拒——不回落会话 cwd（决策 41）；`git` 的只读 action 按核钩子判；`manifest` 按 `action`、`memory` 按 `layer` ∥ `project:` id 前缀判；拒文清单上限 10 条 + 读不到那支的 `<case>`） |
| `thincoder-core/agent/dispatch.mjs` | 改造 | Phase 1 写面冲突块：`bash` ∥ `execute` ∥ `git` 也进（写锁那一道的门内），调形传 `tool` + `toolName` + `args`（路径集与 `args.ledger` 由判据函数自己取）；`reason` 改 `ledger binding`（旧串 `no in-flight ledger row` 退场）；既有两道（跨批档写 · D5 冻结窗）位次与判据零改 |
| `thincoder-core/agent/dispatch-run.mjs` | 改造 | 拒因串消费点：`denied` 分支按 `item.reason` 选回显串，旧串 `no in-flight ledger row` 随判据退场 ⇒ `"ledger binding"` 与既有两道同支，回 `Error: ${item.hint}`。不同笔改这里，拒文会掉进兜底串（模型看不到真拒因） |
| `thincoder-core/tools/file.mjs` ∥ `patch.mjs` ∥ `ops.mjs` ∥ `bash.mjs` ∥ `execute.mjs` ∥ `git.mjs` | 改造 | 各工具 `parameters.properties` 加 `ledger`（不进 `required`，决策 35）；`execute.mjs` ∥ `git.mjs` 另加 `project`（描述 = `PROJECT_PARAM_DESC`，只在定位参数缺位时被读）；`git.mjs` 另补 `isReadonlyAction` 钩子（名单 = `thincoder-vscode/src/tools/index.mjs:52`–`:60` 六项平铺 + 六条子动作分支逐条抄齐，决策 37；钩子成为单源后该端覆写删除，见下行） |
| `thincoder-vscode/src/tools/index.mjs` | 改造 | 删 `gitTool` 的 `isReadonlyAction` 覆写（`:50`–`:62`），保留 `...coreGitTool` 展开；`CHECKPOINT.md` F6/D3 的口径注搬进核钩子——核有钩子后端覆写就是同一份名单的第二份拷贝，且优先级让端覆写吃掉核答案 |
| `thincoder-vscode/src/tools/shell.mjs` | 改造 | 端自持的 `bash` 是独立 schema 副本（非核工具展开）⇒ 同一行 `ledger` 参数（描述引 `LEDGER_PARAM_DESC`）+ 同一行 `project`（描述引 `PROJECT_PARAM_DESC`）；不补则该端 schema 面上没有这两个参数，只有拒文能教它 |
| `thincoder-core/agent-tools/manifest.mjs` | 改造 | `parameters.properties` 加 `ledger`（不进 `required`）与 `project`（`target` 缺位时被读）；`init` ∥ `write` 进本门（`init` 的豁免支在门体取根步——决策 43）、`read` 不进（决策 39） |
| `thincoder-core/memory/memory-tool.mjs` | 改造 | `parameters.properties` 加 `ledger`（不进 `required`）+ `project`（`PROJECT_PARAM_DESC`，不进 `required`——该工具没有定位参数，判据点只能靠声明，决策 40）；落 project 层的写型 action 进本门——`layer:"project"`，或单条删除且 id 前缀 = `project:`（决策 39） |
| `thincoder-core/tool-docs/` 十二个工具描述档（`write` / `edit` / `insert_after` / `apply_patch` / `delete` / `hashline_edit` / `file_ops` / `bash` / `execute` / `git` / `manifest` / `memory` 各一档，同目录） | 改造 | 各补一行用法：`ledger:"#N"` = 本笔服务的那条在途台账行；工程模式下缺它 = 拒（描述面是模型真正读到的那一面）。`git` 档另写一句「只读 action 不要号」（含 `checkpoint` 的 `list` ∥ `cat`）；`manifest` 档写「`write` 要号；`init` 仅当目标在既有项目内（祖先链上有 `PROJECT-MANIFEST.json`）才要——祖先链无 manifest 的自举不要；`read` 不要」；`memory` 档写「落 project 层就要号——`layer:"project"` 或 `project:` id 前缀」；`bash` ∥ `execute` ∥ `git` ∥ `manifest` ∥ `memory` 五档另写一行 `project` 用法与那句「纯声明，不改执行目录」（`execute` ∥ `git` ∥ `manifest` 写明「定位参数缺位时才用」） |
| `thincoder-core/agent/dispatch.mjs` | 改造 | Phase 1 写面冲突块接第三道门（既有两道 = 跨批档写 · D5 冻结窗）+ `:115` 设计门换判源 `isCodePath` → `faceOf`（`§2.1`） |
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 改造 | 词表改 `评审通过` + 别名表；`§2.5` 新增导出 `statusPassPlan`，`VERDICT_PASS_LINE` 定义迁入锚块；`§2.6` `INAPPLICABLE_SEGMENTS` 清空（`[]`——声明机制整条退役） |
| `thincoder-core/agent-tools/batch-lifecycle.mjs` | 改造 | 拆分 + 改链门 + 重开回收调点（`§2.13`；见下）；`readBatchStatusLine` 的消费面五处（`findInFlightBatch` · `assertGateOpen` · 重开合取 · 收口重锚触发 · close 前置存在性网）调形零变，逐处符号 + 调用形见下表（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/agent-tools/batch-ledger-bind.mjs` | 新档 | 从 lifecycle 拆出建档 / 台账接管事务 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 新档 | 从 lifecycle 拆出链门 + 单测档门 + 机检门调点 + 重锚回执三行（`§2.11`） |
| `thincoder-core/agent-tools/batch.mjs` | 改造 | `ledger` 参数语义与描述面；`§2.5` 在 `append` 轨的判定处接第二个计划（`statusResetPlan(...) ?? statusPassPlan(...)`）；`readBatchStatusLine` 的消费点 = `append` 轨的 `const status = readBatchStatusLine(src)`，调形零变（本轮零改，判据 = `§1` 现量 0） |
| `thincoder-core/agent-tools/design-token.mjs` | 改造 | 两处运行时回执串（`REVIEW_RECORD_MARK` 第二句 ∥ `status-not-passed` 证句，字面 = `§2.5`）；`VERDICT_PASS_LINE` 改 import + 原样再导出；拒因三值与判据零改 |
| `thincoder-core/tool-docs/batch.md` | 改造 | `status` 条目补一句置位语义（逐字 = `§2.5`） |
| `thincoder-core/ledger-close-proof.mjs` | 零改 | ③ 已要求 `§3` 状态行 = `评审通过`，与收紧后的收口门自动一致 —— 本批不给它加任何放宽；`readBatchStatusLine` 的消费点调形零变 |
| `thincoder-core/ledger-db.mjs` | 改造 | 迁移表 +2 边（`待讨论 → 在途` · `待核销 → 在途`） |
| `thincoder-core/ledger-cmd.mjs` | 改造 | 重锚分流 + 兜底点名（`§2.11`，返回形加 `backstopped` 集）+ `ledgerReclaimBatch`（`§2.13`，与重锚同形） |
| `thincoder-core/prompts/discipline-engineering.md` | 改造 | `§2.9` 的一句：面分流表后加一行 |
| `thincoder-core/prompts/persona-engineering.md` | 改造 | `§2.4` 提示词落点：生命周期第 1 条扩写（字面逐字引自 `§2.4`） |
| `thincoder-core/ledger.mjs` | 改造 | 公共面再导出 `ledgerReclaimBatch`（同形） |
| `thincoder-core/agent-tools/batch-reopen.mjs` | 新档 | 重开回收调点 + 回执两 / 三行（`§2.13`）；`readBatchStatusLineRaw` 改读段头区（回执原文取真段级行，`§2.5`） |
| `thincoder-core/memory/schema.mjs` | 改造 | 删三处名单定义、改引单源 + 同名 re-export |
| `thincoder-core/memory.mjs` | 零改 | `SKIP_DIRS` 导出面由 re-export 保住 |
| `thincoder-core/tools/bash.mjs` | 改造 | `parameters.properties` 加 `project`（描述 = `PROJECT_PARAM_DESC`，不进 `required`）；判据读它、执行目录不变（决策 40） |

**上表 34 行**（2026-11-03 逐行实测：新档 5 · 改造 26 · 删档 1 · 零改 2；行数不等于档数—— `thincoder-core/agent/dispatch.mjs` 占两行，同一档两处改动）。

**判据点改动的档位结论**：逐档读数与结论见上表——越线的两档 = `thincoder-core/agent-tools/batch-skeleton.mjs`（508 行，归段头区收窄那一笔，拆单见上表第二行）与 `thincoder-core/agent/write-gate.mjs`（510 行，本批不拆，切法见该行）；其余受触档在软线内，最高 `shared.mjs` = 496（余 4）。

**档位结论（本轮定位面收窄）**：受触档 `thincoder-core/agent-tools/batch-skeleton.mjs` **已越软线（508 行）**——落法是写面与读面共用同一条段头区判定（`§2.5` 的单源表），读面不再有第二个取值区；行数靠拆单回到软线内（拆法与判据 = 上表第二行）。

- **落法做成净负**：删 `region` 形参、删其 JSDoc 段与两条计划的两处 `"header"` 实参 ⇒ 改后行数不高于改前（改前实测 508 行，判据 = `§5` R24 第 ⑧ 格）；不靠「注释行等量压缩」凑预算。`thincoder-core/agent-tools/batch.mjs` 与 `thincoder-core/agent-tools/design-token.mjs` 本笔零改，其余各档零触。
- **`readBatchStatusLine` 的消费面零改、行为不变**——一符号一行（3 档 7 个调用点），收窄只改解析体，调用形与三态返回值零变。**坐标一律用符号名，不记行号**——行号随任何一笔注释增删漂移，而符号名跟着代码走：

| # | 所在符号 | 调用形 |
|---|---|---|
| 1 | `thincoder-core/agent-tools/batch-lifecycle.mjs` 的 `findInFlightBatch` | `if (readBatchStatusLine(src) === "open") candidates.push(abs)`（在飞批扫描） |
| 2 | 同档 `assertGateOpen` | `const gate = readBatchStatusLine(src)`（冻结门） |
| 3 | 同档 `status` 轨的重开合取 | `const reopen = … && readBatchStatusLine(src) === "closed"`（重开合取，`§2.13`） |
| 4 | 同档 `status` 轨的收口重锚触发 | `closingValue && readBatchStatusLine(src) !== "closed"`（收口重锚） |
| 5 | 同档 `close` 轨的前置存在性网 | `if (readBatchStatusLine(src) !== "open" && sectionHasStatusLine(src, 1)) assertGateOpen(src)` |
| 6 | `thincoder-core/agent-tools/batch.mjs` 的 `append` 轨 | `const status = readBatchStatusLine(src)` |
| 7 | `thincoder-core/ledger-close-proof.mjs` 的 `assertCloseOutProof` | `const state = readBatchStatusLine(src)`（核销前置） |

- **另两个读面各自单列，不在这 7 行里**：`readBatchStatusLineRaw`（`thincoder-core/agent-tools/batch-reopen.mjs`）自己解析 `§1`，解析体读段头区（回执原文取真段级行）；`sectionHasStatusLine`（`thincoder-core/agent-tools/batch-skeleton.mjs`）**零改**（存在性网，`§2.5`）。
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

**分舱（该批的调度选择：舱内文件集不重叠 ⇒ 可并行；舱间按依赖排序）**：24 档落笔面分五舱（`thincoder-core/memory.mjs` 零改，不入舱）；表里「面」列记的是各舱实际落在哪类档上，是记录、不是拆单依据。

| 舱 | 面 | 档 | 先后 |
|---|---|---|---|
| 1 | 面判与名单 | `skip-dirs.mjs`(新) · `agent/write-face.mjs`(新) · `index-discover.mjs` · `tools/shared.mjs` · `tools/search.mjs` · `tools/tree.mjs` · `memory/schema.mjs` | ① 先落（面判底座） |
| 2 | 台账面 | `ledger-db.mjs` · `ledger-cmd.mjs` · `ledger.mjs` · `ledger-close-proof.mjs` | ② |
| 3 | 批档工具面 | `batch-skeleton.mjs` · `batch.mjs` · `design-token.mjs` · `batch-ledger-bind.mjs`(新) · `batch-closeout.mjs`(新) · `batch-reopen.mjs`(新) · `batch-lifecycle.mjs` | ③ 依赖舱 ② |
| 4 | 写锁接线 | `agent/write-gate.mjs` · `agent/dispatch.mjs` | ④ 依赖舱 ① ∥ ② |
| 5 | 提示词与工具描述面 | `thincoder-core/prompts/discipline-engineering.md` · `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/tool-docs/batch.md` | ⑤ 字面引舱 ① 的档名 |

最大舱 = 7 档（舱 1 ∥ 舱 3），均不跨面。

## 4. 关键决策（含被拒）

1. **判据全部落到盘面**——核销门 ③ 弃 token 槽、写锁弃内存态（判据 = 台账行，`§2.3`）。理由见 `§2.6`；被拒方案 = 保留槽归属并加「槽缺失时降级」，那会把「没跑过评审」和「换了会话」混成一件事。
2. **§3 只留一个完成词**（`§2.5`）。被拒 = 两终态词。
3. **§5 加段序门**（`§2.6`）：append §5 前置 §3 = `评审通过`，**零豁免**（声明机制已退役——每一批都要有一轮真评审）。被拒 = 不加门（理由「会不可写」不成立——`§5` 段号本就豁免）；被拒 = 顺带判 §2/§4（那两段在修正轮里可能晚于 `§5`）。
4. **重锚按行状态分流**（`§2.7`）。被拒 = 一律 `待核销`（把没做的行也记成做完）、一律 `条件`（现状，把做完的行记成没做）。
5. **存量 `已核销` 行的 trigger/resume_when 残值不动**：那两列在终态行上不参与任何决策（`overdue` 只判未决四态）。
   一次性改 1226 行是不可逆批量写、无业务收益；要做也是**单独一轮的 `scripts/` 清理**，不混进本批。
6. **迁移表开 `待讨论 → 在途`**（`§2.8`）。
7. **多条在途行并存**：`findInFlightBatch` 的「≥2 ⇒ 拒」是**默认定位**的歧义门（D-BR21），不是禁止并存，零改；写锁判的是「这一笔报的号是不是在途行」，与并存数无关（`§2.3`）。
8. **RTM 故事 2 退役**：原故事「未立项就写产品码：提醒一次，之后不再打断」的前提是「未立项也写得进去」；裁定 ⑤ 之后未立项写产品码**被拒**，前提消失，三行由故事 12 接替（`§9`）。被拒 = 保留三行并把断言改成「拒绝」——那会让故事名继续说反话。
9. **面判 = 两值直判**（`§2.10`）：命中文档面根 ⇒ 放行，其余 ⇒ 产品面拦；不叠 `classifyPath`、不引排除名单。被拒 = 叠分类器再加修正（每条修正都是一个按情况给的例外，而判它的人正是要用它的人）；被拒 = 全局改 `classifyPath`（七面同翻，非本批条目）。
10. **收口兜底点名而不拒**（`§2.11`）：收口要能走完；拒门会与重锚自相矛盾。被拒 = 前置拒门（与 `§2.7` 冲突）。
11. **写锁工程模式限定**（`§2.3`）：普通模式「纪律自持」，挂门 = 改产品行为。被拒 = 两模式通用。
12. **产物/依赖目录不放行**（`§2.10`、`§2.12`）：`dist` / `build` / `vendor` / `target` / `out` / `obj` 同属产品面。被拒 = 给产物目录单列一条放行支（清理 `dist` 不必开批，但那条支路写宽一格就是任意目录的例外）；被拒 = 让面判去引排除名单（第二个判据即第二个口子）。
13. **两个 `test/` 同待遇**（`§2.10`）：仓根 `test/**` 与包内 `test` / `tests` 同为产品面，都要开批（测试与它守的代码同轮评审）。被拒 = 放行仓根集成测试（「跨仓验证面」是一条按情况给的例外，而判它的人是写它的人）；被拒 = 一律放行（产品测试漏出锁）。
14. **排除名单落零依赖叶档**（`§2.12`）：`tools/*` 引 `conventions.mjs` 会拖进声明装载链，且该档自家分类器不用这份名单。被拒 = 放 `conventions.mjs` 常量区。
15. **四份名单全合并、以第 4 份为准取并集**（用户裁定「最好都合并」）：`bin` 不列、`turbo` 并入 `.turbo`、补 `.thincoder` / `.vs` / `.idea`。被拒 = 分两批合（中间态仍两份同名名单，正是要消的漂移）。代价 = 索引面多剪 8 类，已写明并接受（`§2.12`）。
16. **包内 `scripts/` 也是产品面**（`§2.10`）：面判只有声明文档根一个放行面，包内包外同一条。被拒 = 给包内 `scripts/` 留放行支（`thincoder-core/scripts/check-syntax.mjs` 随核发布，放它出锁外）。
17. **重开回收只回 `待核销`**（`§2.13`）：`已核销` 不回收、回执点名；联动只由重开合取触发。被拒 = 全状态回收（抹掉一次结账）；被拒 = 静默不回（`#1827` 撞的就是静默）。
18. **两道门的模式范围不同**（`§2.6`）：写锁仅工程，§5 段序门与收口门两模式同判（普通模式也一样——声明机制已退役，零豁免）。这是**有意改普通模式行为**；被拒 = 两模式挂写锁（与 `docs/core/requirements/NORMAL-MODE.md:99`「纪律自持」相抵）；被拒 = 两道门都限工程（普通批档的链门含义则与工程不等）。
19. **收口门保留 §3 内容臂**（`§2.6`）：状态词臂是**加**在既有链门上，不替掉它。被拒 = 只判状态词（段空着也能过 = 门被放宽）。
20. **设计门面判据换到 `faceOf`**（`§2.3`）：与写锁共用一份判据。被拒 = 维持 `isCodePath`（两道门各用一套面判，必然漂成「前门放的、后锁拦的」）。
21. **排除名单只服务索引，不服务面判**（`§2.10`、`§2.12`）：`SKIP_DIRS`（42 项）答「索引剪什么 / 扫描跳什么」，面判不读任何排除名单。被拒 = 用 `SKIP_DIRS` 做放行集（`vendor` / `third_party` / `target` / `out` / `obj` 里的手写补丁会绕开批档）；被拒 = 再留一份产物集给面判（第二个判据就是第二个口子）。
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

28. **`不适用` 声明机制整体退役**（`§2.6`）：`INAPPLICABLE_SEGMENTS` 清空 ⇒ `sectionInapplicable` 与 `sectionContentState` 的 `not-applicable` 分支一并退役；收口门 §3 臂无条件；核销门零改。链条上每一段都要有内容：§2 设计、§3 评审、§4 批准、§6 验证。

    理由一（用户 2026-11-02 16:17：「不，不允许做这种不适用声明，把这个口子堵住。」）：`§3` 状态行只有绑本档的评审实例写得进，是一道真门；`§1` 声明却是主 agent 在自己段里写的一行——让它算数，主 agent 就能把自己的批从「没评审」登记成核销通过。两门分量不同不是因为它俩判的事实不同，是因为**写得进去的人不同**。

    理由二（用户 2026-11-02 16:24：「那把那个口子也封掉，那些口子都是你他妈的留的！」）：`§2` / `§4` 的声明比 `§3` 更糟——声明「无设计」∥「无批准」就把这一批结了账，而这两条连「评审实例才写得了」那层外部事实都没有，全是一句话。

    代价（用户当场认下）：此后每一批（含纯措辞批、普通模式）都要有设计、评审、批准——没设计变更的批也要走一轮评审。

    被拒 = 让核销门认声明（要堵的就是那个口子，不是让第二道门也认它）；被拒 = 只删段号集、留着收口门的分支（该臂判据恒 false ⇒ 死代码，且拒文仍把人引向一条已不存在的路）；被拒 = 新导出 `sectionReviewPassed` 包装器（合取去掉后它只是 `readSectionStatusWord(...) === STATUS_WORDS[3].done` 的别名——判据本体已单源在 `STATUS_WORDS`，多一个名字就多一处可漂移的面，还给已越 500 软线的骨架档加行）。

29. **绕行面三条逐条判过、都不是口子**（`§2.6`）。每条给出判据与「判错会怎么露出来」：

    - **`§5` 豁免**：链判段集 = `const CHAIN_SEGMENTS = [2, 3, 4, 6]`（`thincoder-core/agent-tools/batch-closeout.mjs:33`），判空只有这一个入口；`assertSectionFiveGate` 门的是「写 `§5` 的序」，不要求 `§5` 存在。判错会露出来：`§5` 只在有实施席时存在；若另有门把它当必填，无实施席的批会在收口被拒——而它们照常收口。
    - **`trigger = 认账不排期` 零触不点名**：`thincoder-core/ledger-cmd.mjs:312` 先行 `continue`，行状态一字不动 —— 它仍在册、仍进 `query` 的 `aged` 读数（未决四态 ∧ 行龄 > 30 天），只是收口回执不点名。判错会露出来：一行没做完却没人看得见——只在有人只读收口回执、从不跑 `query` 时。这是可见面的薄弱点，不是绕行路；政策判断归行主人。
    - **`batch status` 写 `§1`「已收口」**：与 `close` 同调 `assertCloseoutGates`（`thincoder-core/agent-tools/batch-lifecycle.mjs:257` ∥ `:287`），同判序，差别只在 `action` 字串（进单测档门与机检门的措辞）与其后的设计凭证消费。判错会露出来：造一本 `§3` 空档，`close` 拒而 `status` 通过——一格夹具即红。
30. **核销边只留一条：`待核销 → 已核销`**（`§2.14`）：`待讨论 / 待设计 → 已核销` 这条边删除，`applyRowClose` 的源态判与 `:163` 的追认 `evidence` 门一并退役。

    理由（用户 2026-11-02 16:32 裁定）：台账状态机有序，四个未决态各代表一件事实——`待设计` = 设计没写、`在途` = 有人认领正在做、`待核销` = 做完了在等结账。这条边一步跨过去，等于允许「没设计、没人认领、没验证」的行显示为已结账。它今天走不通只因为 `assertCloseOutProof` 恰好挡着；拿另一道门给自己的合法性背书，正是本批要消灭的形状。

    被拒 = 「留着但注明不可达」（可达前提 = 一本走完全链收口的批档）：它答的是「能不能被利用」，没答「这条边该不该存在」；读起来像捷径的死分支，下一个人还会试，试完想的是怎么让机检过，而不是这批该不该走全链。

    被拒 = 加一道新门去拦它：边没了就不需要门，加门还要维护它的字面与判序。

    **最近先例**：同批评审对同一机制的处置——决策 28（`§2.6`）。**对齐**：删掉一条选择面，不新立判据、不新增导出、不动词表。**偏离**：28 的判据输入是 `§1` 的一段文本，本决策的判据输入是迁移表的一行边——因此它连带三处人话（本机批量面跳过文案 ∥ 工具描述五处 ∥ 服务端 400 与六处注），28 的连带面只在批档层。

    代价：`待讨论 / 待设计` 行从此只有认领一条出路（`update` 到 `在途` → 全链收口 → `待核销` → 勾销），没设计的东西不再能一步结账。

31. **条目在别处完成 ≠ 可以不开链收口**（`docs/core/design/BATCH-RECORD.md` §5.2）：设计档原写「核销判据 = 结账依据（不是挂靠批档的状态行）」，而代码 `assertCloseOutProof` ② 要求批档 `§1` = 已收口；同一件事文档一套、代码一套，以代码为准收正 —— 留「结账依据写 `evidence`」，删「不开链也能结账」。被拒 = 改代码去认文档（那正是本批要堵的口子）。

32. **零消费的判据整条退场**（用户 2026-11-03 裁定 ①）：写锁改读台账在途行后，原合取判据零消费面 ⇒ 代码档删、设计节删、引用面清，三件一起。

     理由：没有消费者的东西留着，下一轮读它的人先要判「这还成立吗」；而它要的维护是真的——写锁改判那一轮，代码里就留下三处仍在教旧判据的注释。
34. **写门判据从「有在途行」改成「这笔写报的号是在途行」**（用户 2026-11-03 02:02 裁定，`§2.3`）：一条在途行放行该根下任何一笔写，门看不见「谁在写、替什么写」。
     形状取**逐笔带号**，被拒 = 轮内绑定——同一轮里父侧可能异步在做好几项任务，轮内绑定把几件事压成一条账；被拒 = 维持「有在途行即放行」、只在拒文里提醒带号（提醒不是判据）。
35. **`ledger` 入入口集十二把工具的 `properties`，不进 `required`**（`§2.3`）：`required` 是静态字面，而这十二把工具在两模式、子代理、未声明项目的调用下共用。
     - 入口集 = `FILE_MUTATORS` 六件 + `file_ops` + `bash` ∥ `execute` ∥ `git` ∥ `manifest` ∥ `memory`（决策 36 ∥ 37 ∥ 39 的补入）。
     - 旧口径「七把写盘工具」= `FILE_MUTATORS` 六件 + `file_ops`——入口集的一半。
     被拒 = 静态 `required`：它让普通模式读到「必须传号」而写门在普通模式不挂（决策 18），也让子代理读到一条没人核的要求；机械强制在门（缺即拒），schema 只负责让模型知道有这个参数。
     被拒 = 按模式动态 `required`：`toOpenAISchema(tool)`（`thincoder-core/tools/shared.mjs:170`）没有 agent 入参，做成按模式变要改这个公共函数与它两个调用点的签名——为一条提示改公共面不值。
36. **`bash` ∥ `execute` 纳入同一判据，不按命令内容分类**（用户 2026-11-03 02:03，`§2.3`）：写门的入口集补上这两把能任意落盘的工具。
     被拒 = 按命令字面分类（`rm` / `mv` / `>` 之类）：分类本身就是第二个洞，还给假安全感——`node -e` / `npm run <脚本>` / 脚本参数拼接都能落盘，字面筛不住。
     代价（用户认下，写进 `§2.3`）：工程模式下父侧任何 `bash` ∥ `execute` 都要有在途行，包括 `npm test`、`git status`。正路 = 先挂行再干活（两步都不经过这两把工具）。

    被拒 = 留作「以后可能有人用」的备用导出：「以后」没有消费者，判据却要逐轮跟着台账面一起核。

**40 · 判据点 = 调用方声明的项目**（用户 2026-11-03 02:58 裁「调用时要同时提供项目和台帐号」，`§2.3`）：`agent.cwd` 是会话锚，而会话锚可以是容器根 / 工作区根——容器根本身不带 manifest，旧判据于是在那种形态下永不设防（实机：2026-11-03 02:53 重启后 `bash` 不带 `ledger` 照放行）。

    - **「项目」就是项目根**，不是新概念：台账按项目根算键、项目 = 带 `PROJECT-MANIFEST.json` 的目录，一个判据（`thincoder-core/ledger-db.mjs`）。所以参数值 = 根绝对路径，零映射表。
    - **声明面优先复用既有定位参数**：`execute` ∥ `git` 有 `workdir`（`git` 另有 `path`）、`manifest` 有 `target`、写盘七件有目标路径——它们本就说着「写哪儿」。只有定位参数**可能缺位**的 `bash` ∥ `memory` ∥ `execute` ∥ `git` ∥ `manifest` 五把加 `project`，且写明定位参数优先；写盘七件的目标路径恒在，`project` 在那里永不被读 = 第二个名字。
    - **`bash` 的 `project` 是纯声明**：不改执行目录（该工具没有 cwd 参数，本批也不给它加 shell `cd` 语义）。声明即承诺——命令内容不解析（决策 36），门只问「这笔替哪个项目的那条账服务」。
    - 被拒 = 继续从会话锚推、只把「推不出」改成拒：判据点仍不是调用方给的，「换个 cwd 就变判据」原样留着。
    - 被拒 = 十二把工具（含写盘七件）统一加 `project`：目标路径恒在，`project` 在那里永不被读；且两值不一致时「以谁为准」要再立一条判据。五把加 `project` 并写明定位参数优先，正是为了不让它变成第二个判据。

**41 · 声明无效 ⇒ 拒**（用户 2026-11-03 02:58 裁 ④，`§2.3`）：项目由调用方声明，**会话锚永不充当判据点**（全覆盖：入口集十二把无一回落 cwd，含 `execute` ∥ `git` ∥ `manifest`）——声明缺位（既无定位参数又无 `project`）⇒ `no project on this call`；声明与会话锚无关键，或相关但取不到带 manifest 的根 ⇒ `declared project is not a project`。判据的输入缺失时，门只会拒，不会放行。

    **相关性 = 界的判据**（`§2.3`）：声明根含会话锚（会话 cwd 在项目子目录里）∥ 声明根在会话锚之内（沿祖先链上溯）——两者之外一律拒。会话锚仍用于解析相对路径与判相关性，只是不再是「判哪个项目的账」的答案。被拒的替代 = 允许「推定不出来就不管」：容器根锚下每一笔写都不设防，就是那条臂的产物（实机：2026-11-03 02:53 `bash` 不带号照放行）。

    代价（用户认下）：工程模式 `depth = 0` **在各项目之外**的写（`<仓外临时目录>/x.mjs` 这类）从此一律拒——项目之外没有判据点；要写就先写在项目里。

**42 · 拒文同时教两个输入**（决策 38 的延伸，`§2.3`）：`project` ∥ `ledger` 都不进 `required` ⇒ 拒文是唯一教学面，故用法句一次点出两个输入（`Pass project:<…> and ledger:"#N" on this call`），挂号两步里的 `ledger add` 带 `cwd`——号挂在哪个项目，声明就写哪个项目。

**43 · `manifest({action:"init"})` 的豁免开在取根步**（父侧 2026-11-03 04:37 裁，`§2.3`）：`init` 的合法落点恰是「尚无 manifest 的目录」，而判据点要那个项目的账——那个项目还不存在 ⇒ 不豁免则工程模式父侧**永远建不出新项目**，而走不通的机制迟早被整条废掉。

    豁免边界（条件形——豁免支开在门体取根步）：目标沿祖先链取不到项目根 ⇒ 不进本门（无账可问）；取得到根（含既有项目内的子目录自举）⇒ 本门照判（要项目、要号），目标自身已有 manifest 时门过后由工具自身拒（`init never overwrites`）；只覆盖 `init` 一个 action，且它只写 `PROJECT-MANIFEST.json` 一个文件；`write` 仍照判（要项目、要号）。

    被拒 = 让 `init` 也带一个「假项目」声明：那要在门槛值里递一个不存在项目的账，等于给「项目外写」开后门（决策 41 的代价面同源）。

    **最近先例**：同档决策 37（`git` 按枚举 action 判写型，`§2.3`）。**对齐**：要号/豁免都判工具自己的枚举值，不新增判据面。**偏离**：37 的两值都在门内（写型要号 ∥ 只读不要号），43 的 `init` 有一格真正走出门外（取不到根 ⇒ 无账可问）——豁免落在门体取根步，不是把枚举值摘出要号集。

    **调研证据**：查无相关——该判据面（工程模式写锁对 `init` 的豁免形）无外部规范可引；本批调研面 = 档级 `§1` 调研证据块（仓外声明源 = 无）∥ 本档 `§2.3` 判据表与 `thincoder-core/agent-tools/manifest.mjs` 实读坐标。

**37 · `git` 纳入写锁，只读名单单源落核**（用户 2026-11-03 裁「`bash` **之类的工具**」⇒ `git` 在「之类」里）

`git` 的写面是声明式 action（枚举值），不是 shell 字符串 —— 同日那条禁令禁的是按命令字面猜（本身是第二个洞），`git` 不碰它。判法用既有 `readonlyActionOf`，不新写分类。

**名单 = 端装饰体逐条抄齐，核钩子成为单源**（`thincoder-vscode/src/tools/index.mjs:52`–`:60`，2026-11-03 实读）。

- **六项平铺判只读**：`diff` / `status` / `log` / `show` / `ls-remote` / `blame`。
- **六条子动作分支**：`checkpoint` 的 `list` ∥ `cat`；`tag` / `branch` / `stash` / `remote` / `worktree` 各自 `list`。
- **`checkpoint` 的 `list` ∥ `cat` 判只读**：该档 `:54` 逐字「保留只读分类免审批（CHECKPOINT.md F6/D3 设计意图）」—— F6 的清理副作用是已知且已裁下的。

- **为什么取「抄齐」而不取「明示偏离」**：偏离会让核钩子与端装饰体答案相反，而端装饰体同时是权限短路 ∥ planMode 的判据（`dispatch.mjs` 两处经 `tool.isReadonlyAction`）——改它就改了审批行为、并推翻 `CHECKPOINT.md` F6/D3 的既有裁定，那是用户的裁量；本门的题目是「这笔写替哪条账服务」。
- **端覆写同笔删**：核有钩子后，端覆写是同一份名单的第二份拷贝，而 `tool?.isReadonlyAction?.(args) ?? …` 的优先级让端覆写吃掉核答案 ⇒ 两份必然漂移。删后 CLI ∥ desktop ∥ vscode 三面同答案（同一机制多面：差要消掉，不留一个面另判）。

**被拒的替代**（三条）：

- 只在门里硬编码一份名单 —— 第二份单源，端间立刻漂移。
- 对 `git` 一律要号 —— 只读命令也挂号，代价白付；且它与 `bash` 的「无法静态分类」前提不同，有枚举可判就不要猜。
- 只抄六项平铺、漏掉六条子动作分支 —— `checkpoint rewind` / `branch delete` / `stash pop` 会按只读放行而不挂号（名单不完整的洞）。

**38 · `ledger` 不进 `required` ⇒ 拒文是唯一教学面**（决策 35 的代价面，用户 2026-11-03 认下）：模型不传号就撞拒，拒文是它唯一会看到的那一面。故拒文必须写全三件 —— 缺什么（`<case>`）、要带什么（`Pass ledger:"#N"`）、当下有哪些号可带（`In-flight rows in this project's ledger right now: …`），无在途行时给挂号两步。拒文与 schema 同属判据面：删掉这段，这个参数就没有任何可发现路径。

**39 · 入口集按「落盘目标在不在项目内」划线（扫描域，不是全称句）**（`§2.3`）：原句写「其余能落盘的工具全部在入口集内」，而它没有扫描面——`manifest` 的 `init` ∥ `write` 写 `<项目>/PROJECT-MANIFEST.json`、`memory` 的 `layer:"project"` 写 `<项目>/.thincoder/memory/**`，两把都不在那十件里。

- **补入两把，判法用工具自己的枚举**（与决策 37 同法，不碰决策 36 那条禁令）：`manifest` 按 `action`（`write` 要号、`read` 不要；`init` 要号与否由决策 43 的取根豁免定），`memory` 按 `layer`（`project` 要号，`personal` ∥ `team` 落用户数据目录不要；`put` 缺省 `personal`）。
- **不进入口集的两把及其理由**：`settings`（写 `~/.thincoder/config.json`）与 `browser`（自有 profile 与截图目录）不写项目内档——两把逐项写进 `§2.3` 的扫描表，不靠「其余」这句话兜。
- **被拒 = 保留全称句、只把 `manifest` 写成豁免**：豁免要有代价与理由；它的代价就是一条真实的写路径在门外无账可追，而理由是编的（它只写一个固定档，这不是豁免理由——固定档也是项目内容）。
- **代价**：入口集十二把，schema 与描述面各多两处；`memory` 的 `layer` 判法要在实施轮据其 `layer` 默认值实读确认（默认值已在该工具 schema 描述里逐字给出）。

## 5. 验收对照

每条回到批档 `§2` 的批次条目（R1–R25）；机检判据如下：

**可跑面（本批验收的入口）**：本批单测档 = `docs/batches/2026-11-03-write-gate-project-and-ledger.test.mjs`（与批档同名同目录，随本批收口删除），跑法 = `node --test docs/batches/2026-11-03-write-gate-project-and-ledger.test.mjs`。R2 的 ①–⑮ 与 R2 ⑫ 的白盒格全落在该档；集成面（12-x / 14-6）由父侧收口跑，不在本档。

| 条目 | 判据（可机检） |
|---|---|
| R1 建档=建台账 | 不传 `ledger` 建一档 ⇒ 台账多一行 `在途` 且 `task_book` = 该档；传已存在 `待讨论` 号 ⇒ 该行变 `在途`；传 `已核销` 号 ⇒ 拒且档未落盘、行零改（终态判据；事务内步序 = `§2.4`） |
| R2 写锁（笔-账绑定） | **判据 = 本笔报的 `#N` 是目标项目台账里的 `在途` 行**（`§2.3` 表）：① 未传 `ledger` ⇒ 拒，拒文含 `no ledger number on this call` 与用法句（`Pass project:` ∧ `ledger:"#N"`，两个输入一次点出），文件字节零改；② `ledger` 非行号形（`"abc"` / `"#"`）⇒ 拒，原值带进拒文；③ 号不在盘（`"#999999"`）⇒ 拒，含 `does not exist`；④ 号在盘而 status ∈ {`已核销`, `已废弃`, `待讨论`, `待设计`, `待核销`} ⇒ 拒，拒文点名该状态词；⑤ 号在途 ⇒ 放行，`"#N"` 与 `"N"` 同判，文档面与产品面同判（面不参与判据）；⑥ **未声明项目 ⇒ 拒**（`bash` ∥ `memory` 缺 `project`；`execute` ∥ `git` ∥ `manifest` 既无定位参数又无 `project`——不回落到会话 cwd）拒文含 `no project on this call`；**声明路径不是项目**（与会话锚无关键 ∥ 相关但取不到带 manifest 的根，含容器根 `D:\teamcode`）⇒ 拒、含 `declared project is not a project`；`memory` 的 `personal` ∥ `team` 落用户数据目录 ⇒ 不判（只有落 project 层才要 `project`）；写盘工具目标在任一项目之外 ⇒ 同拒；⑦ 台账读不到 / manifest 在而不可用 ⇒ 拒 + `(ledger unreadable — <原错>)`；⑧ 普通模式与 `depth > 0` 零改；⑨ 子代理带号不被本门核（拒因若现，只来自 token 门）；⑩ **`bash` ∥ `execute` 同判**：台账无在途行时跑一条只读命令（`git status`）⇒ 拒、命令零执行、拒文含 `no ledger number on this call`；带在途号跑同一条 ⇒ 执行并回输出；⑪ **`git` 写型要号**：台账无在途行时 `git({action:"commit", message, path})` ⇒ 拒、`git log` 输出不变、拒文含 `no ledger number on this call`；带在途号同笔 ⇒ 提交生效；⑫ **`git` 只读不要号**：同一会话、台账无在途行时 `git({action:"status"})` ⇒ 照跑回输出；白盒断言核钩子落地后 `readonlyActionOf(gitTool, "git", {action:"status"})` = `true` ∧ `{action:"commit"}` = `false` ∧ `{action:"checkpoint", checkpointAction:"list"}` = `true` ∧ `{action:"checkpoint", checkpointAction:"rewind"}` = `false` ∧ `{action:"branch", branchAction:"list"}` = `true` ∧ `{action:"branch", branchAction:"delete"}` = `false`（六项平铺与六条子动作分支各抽一格；白盒与本臂的行为半都落本批单测档）；⑭ **`manifest` 写型要号、读型不要、`init` 条件豁免**：`manifest({action:"write", key, value})` 不带号 ⇒ 拒、manifest 字节零改；`manifest({action:"read"})` 不带号 ⇒ 照跑；`init` 条件豁免（豁免支在门体取根步——决策 43，断言格 = R33 init 自举面）；⑮ **`memory` 按层判（`layer` ∥ id 前缀）**：`memory({action:"put", layer:"project", title, content})` 不带号 ⇒ 拒、`<项目>/.thincoder/memory/` 零写；`memory({action:"put", layer:"personal", title, content})` 不带号 ⇒ 照跑——同一个 action 两答案，分界在 `layer`；**单条 `delete` 不带 `layer`、id 带 `project:` 前缀 ⇒ 同样拒、文件仍在**（该层由前缀定，只看 `layer` 就漏掉这条删项目内档的路）；带号单删放行；⑬ **`git` 的根 = `path` ∥ `workdir`**：本仓有在途号、`workdir` 指到另一个无在途行的项目仓跑 `commit` ⇒ 拒（号必须在目标项目台账里）；同笔把号换成那个仓的在途号 ⇒ 放行；两者都不带 ⇒ 拒（`no project on this call`），不回落到会话 cwd |
| R3 §3 词表 | `status` §3 值 `评审通过` ⇒ 通过；值 `评审完成` ⇒ 拒（词表外）；旧档读侧 `评审完成` ⇒ 等义 pass |
| R4 §5 段序门 | `§3` 无 `评审通过` 时 `append §5` ⇒ 拒，拒文逐字 = `§2.6` 的 `R-G2` 串；`§3` pass 后追加照写；`§1` 写 `> 不适用：§3` ⇒ 照拒（声明不再是出路） |
| R5 收口门 | `§3` 无 pass 时 `close` ⇒ 拒，拒文含 `§3 状态行 = <value>`；既有四段内容臂**照判**（`§2`/`§4`/`§6` **各须有内容**——声明已停用）；收口后本批零 `在途` 行（重锚落 `待核销`） |
| R6 核销门去运行态 | 换会话（槽内无归属）核销一条合格行 ⇒ 通过；`§3` 非 pass 的档 ⇒ 拒，③ 串逐字；**已收口 ∧ `§3` 无状态行 ∧ `§1` 有 `> 不适用：§3 —— <理由>` ⇒ 照拒**（③ 串逐字；`§3` 不可声明，两门对同一份档结论一致） |
| R7 重锚分流 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 分别落 `待核销` / `条件`（后者 = 点火违规兜底，`§2.7`），回执两行 |
| R8 迁移表 | `update` 一条 `待讨论` 行 → `在途` ⇒ 通过 |
| R9 存量不回填 | 盘上带 `评审完成` 的存量档字节零改、读侧等义 pass；写 `评审完成` ⇒ 词表外拒 |
| R10 多条在途行并存 | 造两条在途行 ⇒ 两次 `create` 皆成立；带 `#A` 写一笔、再带 `#B` 写同一目标 ⇒ 两笔都放行（门判「报的号在途」，与并存数无关）；`status` 缺省定位对两档照拒（歧义门零改） |
| R11 存量残值不动 | `query` 全表计数与本批前一致（1226 行残值不变） |
| R12 面判据两值 | 带活设计槽时：`docs/core/design/X.md`（docRoot 内）· `PROJECT-MANIFEST.json` ⇒ 放行；`thincoder-core/agent/x.mjs` · `thincoder-vscode/test/x.test.mjs` · 仓根 `scripts/x.mjs` · `test/integration/x.test.mjs` · `.thincoder/tmp/x` · `node_modules/pkg/x.mjs` · `thincoder-cli/dist/out.mjs` · `vendor` / `target` 下 `.mjs` · `thincoder-core/newthing/foo.mjs` ⇒ 拒（产品面）；出辖 ⇒ 放行 |
| R13 收口显式处置 | 收口前 1 行 `在途` + 1 行 `待讨论` + 1 行父侧已置 `待核销` ⇒ 前两行被重锚（`待核销` / `条件`），回执点名「2 行由重锚默认推进」；第三行零触、不点名 |
| R14 排除名单单源 | `skip-dirs.mjs` 一处定义（`SKIP_DIRS` 42 项 · `SKIP_DIRS_FOLD` 18 项 · 前缀 `bazel-`）；四名单消费面（`index-discover` · `search` · `tree` · `memory/file-walk`）同值（面判不读排除名单，`§2.10`）；含 `.turbo` / `.thincoder` / `.vs` / `.idea`，不含 `bin` · 不含 `turbo` |
| R15 重开回收 | 收口后重开（行 `待核销`）⇒ 行 `在途`、回执第一行点名；核销后重开（行 `已核销`）⇒ 行零改、回执第二行逐 id 点名；`status` 写 §3 `评审通过` ⇒ 台账零写 |
| R16 两值面判 | `thincoder-core/scripts/s.mjs` ⇒ 拒；`thincoder-*/tests/x` ⇒ 拒；仓根 `scripts/x.mjs` · `test/integration/x.test.mjs` · `.thincoder/tmp/x` · 根 `README.md` ⇒ **拒（产品面）** |
| R17 一本 ↔ 行集 | 覆盖 3 条旧账建一档 ⇒ 三条 `task_book` 全解析回本档、§1 `覆盖账` 含三条 + 接管那条；`create` 不带 `ledger` ⇒ 自开一条、指针回本档、§1 写 `覆盖账 = #<自开号>`（判据第 3 步两边相等，不再判孤儿）；覆盖行已 `在途` 指别档 ⇒ 停、不绑；收口并结算后本档行集只剩 `已核销` / `已废弃`；重复登记撤回时 `evidence` 点名吸收行（`§2.4` 四步判据逐条可跑） |
| R18 回执建议句按类分流 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 回执第一行携「认领行只有两种终局」、第二行携「不是本批的活（点火违规）」、第三行只点名不给建议；`grep -c "没做完的" thincoder-core/agent-tools/batch-closeout.mjs` = 0 |
| R19 建档 `待核销` 号拒（`R-C4`） | `create{ledger:"#<待核销号>"}` ⇒ 拒，拒文逐字 = `§2.4` 第四条；档零落盘、行零改（抛出点 `thincoder-core/ledger-write-ops.mjs:309`） |
| R20 重新开账 = 另立新行 | 覆盖行已 `已核销` ⇒ `create` 不带 `ledger` 自开一行、§1 `覆盖账` 只含新号；旧行状态 / `evidence` 字节零改 |
| R21 迁移枚举与状态机逐边相等 | `thincoder-core/tool-docs/ledger.md` 的 `update` 枚举边集合 = `thincoder-core/ledger-db.mjs:163-166` 的边集合（含 `待讨论→在途` · `待核销→在途`）；`ALLOWED_MIGRATIONS` 本体零改 |
| R22 `§5` 门判据 2 | `§3` 状态行 = 评审通过 ∧ 最近一轮轮次块无 pass 裁定 ⇒ `append §5` 拒（`R-G2b` 串）、§5 字节不变；末块同携 pass 与打回两行 ⇒ 判打回（合取第二项不成立）；块内补 `VERDICT: pass` ⇒ 写入；`§3` 无轮次块 ⇒ 拒；`§1` 写 `> 不适用：§3` ⇒ 照拒（判据 1 不成立，无豁免） |
| R23 通过即置位（`§2.5`） | 夹具 = 骨架原形批档（§3 无状态行）：一笔 `append §3` 携 `VERDICT: pass` ⇒ 段内出现 `**状态行**：评审通过`、`readSectionStatusWord(src,3)` = `评审通过`、轮次块 +1、留痕行 0；同档再 append 一笔携 pass ⇒ 状态行字节零改、留痕行仍 0；写前 = `进行中（第 3 轮打回）` 的一笔携 pass ⇒ 状态行回 `评审通过`；一笔同携 pass 与打回两行 ⇒ 判打回（`进行中（第 N 轮打回）`；计划函数直调取证，`append §3` 已写不进去）；一笔无裁定行 ⇒ 状态行字节零改；`append §6` 携 pass 行 ⇒ 状态行零改；写前 = pass 的一笔携打回行 ⇒ 既有重置行为逐字不变（零回归）；`thincoder-core/tool-docs/batch.md` 的 `status` 条目含置位句（逐字 = `§2.5`）；**定位面收窄**：写前 §3 段头区无状态行、正文含一行 `**状态行**：进行中（引述）` 的一笔携 `VERDICT: pass` ⇒ 引述行逐字节不变 ∧ 段头区出现 `**状态行**：评审通过` ∧ `readSectionStatusWord(src,3)` = `评审通过` ∧ 轮次块 +1 ∧ 留痕行 0；同形但引述行本身写 `**状态行**：评审通过` ⇒ 置位仍触发（段头区补出 `**状态行**：评审通过`）；写前段头区 = `评审通过` 的一笔携打回行、正文引述 `**状态行**：进行中（上一轮）` ⇒ 段头区 = `进行中（第 N 轮打回）` ∧ 引述行字节不变 ∧ 留痕行 1；`status` 写 §2（段头区有行、`###` 之下另有一行同形）⇒ 段头区那行改写、`###` 之下那行字节不变 |
| R24 段级状态行只有一个取值区（`§2.5`） | 夹具 = §3 段头区无状态行、块正文含一行 `**状态行**：评审通过`：① `append §5` ⇒ 拒（`R-G2`）② `close` ⇒ 拒、拒文含 `§3 状态行 = （无状态行）` ③ `ledger close` 核销该档行 ⇒ 拒（`R-L3`）④ 派设计评审 ⇒ 拒签（`status-not-passed`）⑤ `batch list` 该档 `§3` = 空 ⑥ 同档落一笔携 `VERDICT: pass` 的 `§3` ⇒ 段头区出现 `**状态行**：评审通过`，①–⑤ 全部翻绿；同形夹具把引述行换成 `**状态行**：进行中` 时 ⑥ 仍成立（置位的第三合取读段头区 = 空 ⇒ 触发），引述行逐字节不变；⑦ 可跑文件 = **实施轮落的** `test/integration/batch-status-auto-set.test.mjs`（`node --test test/integration/batch-status-auto-set.test.mjs`，其 27-1 用例断言「评审写一笔即签字」；27-1 现态 = `test/RTM.md` 在册、「待执行」、用例本体随实施轮落）；⑧ 改后 `thincoder-core/agent-tools/batch-skeleton.mjs` 行数不高于改前（改前实测 508 行，含空行计数） |
| R25 重开自愈整链（`§2.5` 改判清单的现成本处置） | 夹具 = **新档自开行 + 三档同形的 `§3`**（`§3` 段头区无状态行、块首一行 `**状态行**：评审通过`）；行的行程写死 = `在途` → 收口 `待核销` → 重开回收 `在途` → 再收口 `待核销` → `ledger close` 勾销。断言：`status` 把 `§1` 写回 `进行中`（重开）⇒ `append §3` 携 `VERDICT: pass` ⇒ `§3` 段头区出现 `**状态行**：评审通过` ⇒ `close` 放行、该行的 `ledger close` 通过；全程不手改状态行。**三档本体的行是 `已核销`**（终态，重开不回收，`§2.13`）⇒ 照本体搭夹具最后一步必不通过；那三档要再结账须另立新行，夹具因此用新档自开行 |
| R26 收窄的终态拒文点名出路（`§2.5`） | 夹具 = 某档 `§1` 状态行落在段头区外（`###` 之下），**两个出口都断言**：① `status` 写 `§1` ⇒ 拒（冻结门 `assertGateOpen`）② 绑定调用方（子代理 / 评审实例）`append` 任一段 ⇒ 拒（`thincoder-core/agent-tools/batch.mjs` 的段绑定拒面）。两条拒文逐字含「inside the section header zone」与「move it up under `## §1`」两句（字面 = `§2.5`）；全仓 `.mjs` 实走 `Ask the record's creator to set the §1 status line` 命中 = 0（假出路句不许有一条以上）；把该行移进段头区后同一 `status` 写 ⇒ 通过（读到 `open` / `closed`，工具面恢复）；不加任何回落 |
| R27 §3 写入闸（`§2.6.1`） | 评审写一笔 §3 无裁定行 ⇒ 拒（拒文逐字 = `R-G3`：含 `VERDICT: pass` ∥ `VERDICT: changes-required` ∥ `no round number was consumed`），档字节零改、轮次块数不变；写 `**结论** = VERDICT: pass` ⇒ 同拒；写 `结论：通过` ∥ `结论：通过。` ∥ `VERDICT: 通过` ∥ `VERDICT: 通过。` ∥ `VERDICT: changes-required` 五笔各写入、块数各 +1（两锚中文分支尾句号同判）；写 `结论：不通过` ∥ `结论：不通过。` ∥ `VERDICT: 不通过` ∥ `VERDICT: 不通过。` 四笔照写入（打回那几笔同笔重置 `§3` 状态行，写前 = `评审通过` 时）；判定输入 = 净化后 `body`（自带 `### 轮次 N` 标题的一笔按净化后正文判）；一笔同携两行 ⇒ 拒（块内裁定 = 两者同携）；`grep -rn "export const VERDICT_PASS_LINE" thincoder-core` = 1 命中（判据只一份）；拒文自身读成「无裁定行」（`verdictGapOf(R-G3 全文)` = `无裁定行`，非 `两者同携`）；以代码围栏引用 `R-G3` 全文并另写一行 `VERDICT: pass` 的一笔 ⇒ 写入（纯文本粘贴同形撞既有文档机检门的段落阈值——本闸已放行，与本闸无关）；eng-designer §2 ∥ eng-coder §5 ∥ depth-0 §1 三笔写入不受本闸影响 |

| R28 核销边只留一条（`§2.14`） | `node --test test/integration/ledger-close-proof.test.mjs`：`待讨论` 行跑 `ledger close{status:"已核销"}` ⇒ 拒（拒文逐字含 `核销仅限 待核销（现态 待讨论）` 与**该现态的**出路句 `先 update 到 在途 认领`）、行状态仍 `待讨论`、`closed_at` 仍空；`待设计` 行同形同拒（现态点名 `待设计`、出路句同 `待讨论`）；`在途` 行同形同拒，**出路句 = `先 update 到 待核销（做完才结账），再 close 勾销`**（不是认领句）；归档态行同拒、出路句 = `该行已归档（<X>），不在核销面`；`待核销` 行仍通过（既有 a 档断言零改）；同档 `update` 到 `在途` → `待核销` → `close` 三步全过（「条目在别处完成」的走法）；零改读数 = `grep -c "追认核销" thincoder-core/ledger-write-ops.mjs` / `thincoder-core/ledger-cmd.mjs` / `thincoder-core/ledger-tools.mjs` / `thincoder-core/tool-docs/ledger.md` 四值全 0 |
| R29 零消费判据退场 | `thincoder-core/agent/live-batch.mjs` 不在盘（`ls thincoder-core/agent` 读数无该档）；`grep -rn "liveBatchOpen" thincoder-core` = 0 命中；`grep -rn "agent/live-batch" thincoder-core` = 0 命中（路径前缀形 = 还有人 import / require 已删模块；裸串 `live-batch` 会命中用例档名 `batch-live-batch-lock.test.mjs`——档名不是消费者）；判据函数住模块内且不导出：`grep -n "ledgerRowAt" thincoder-core/agent/write-gate.mjs` ≥ 1 命中 ∧ `grep -n "^export.*ledgerRowAt" thincoder-core/agent/write-gate.mjs` = 0 命中 ∧ 旧名全清 `grep -rn "ledgerOpenAt\|ledgerOpenWriteConflict" thincoder-core test` = 0 命中；本档 `grep -c "活批档"` = 1（唯一命中 = 本行判据句自身）· **扫描面 = `thincoder-core` + `test`（代码与测试面；设计档与本批档要逐字写这条判据，字面必然在，不进来）**：`grep -rn "liveBatchOpen" thincoder-core test` = 0 命中 · `grep -rn "agent/live-batch" thincoder-core test` = 0 命中 · `grep -rn "no live batch record" thincoder-core test` = 0 命中（旧拒文两条英文串随 `§2.10` 单源化同清；实测触发面 = `test/integration/batch-live-batch-lock.test.mjs` 三条断言与头注） |

| R30 项目声明面（`§2.3` · 决策 40） | `bash` ∥ `memory` ∥ `execute` ∥ `git` ∥ `manifest` 五把的 `parameters.properties` 有 `project`（描述 = `PROJECT_PARAM_DESC`，`required` 里没有它）；写盘七件的 schema 无 `project` 字段（目标路径即是声明）；`execute` ∥ `git` ∥ `manifest` 带定位参数（`workdir` ∥ `path` ∥ `target`）时 `project` 不参与判定（白盒：两者同给且指向不同项目 ⇒ 按定位参数判）；`grep -rn "PROJECT_PARAM_DESC" thincoder-core thincoder-vscode/src` 的镜像点 = `tools/bash.mjs` · `tools/execute.mjs` · `tools/git.mjs` · `agent-tools/manifest.mjs` · `memory/memory-tool.mjs` · `vscode/src/tools/shell.mjs` 六处 + `tools/shared.mjs` 定义处（描述单源，零手写副本） |
| R31 判据点 = 声明，无效即拒（`§2.3` · 决策 41） | 见 R2 ⑥；另：项目声明解析的四态——路径不存在 ∥ 与会话锚无关键（平级目录 / 不含锚的更远祖先）∥ 相关但取不到带 manifest 的根 ∥ 根在而 manifest 不可用（后者落 ⑦ 那支）——都落 `declared project is not a project`，无一放行；**相关性两支各一格**：(a) 会话 cwd = `<本仓>/thincoder-cli`、声明 = 本仓根 + 在途号 ⇒ 放行；(b) 会话 cwd = 本仓根、声明 = `<本仓>/thincoder-core` ⇒ 归到本仓根放行；`grep -c 'scope: "out"' thincoder-core/agent/write-gate.mjs` = 0（放行臂不在盘） |
| R32 声明语义（`§2.3`） | `bash` 带 `project:<另一项目>` 跑 `process.cwd()` ⇒ 打印会话 cwd（执行目录未变）；`project:"<本仓>/thincoder-core/agent"`（项目内子目录）⇒ 归到本仓、放行；`project` 相对路径按会话 cwd 解析 |
| R33 教学面同拍（`§2.3` · 决策 42） | 拒文含 `Pass project:` ∧ `ledger:"#N"` ∧ `In-flight rows in this project's ledger right now:` 三件；`thincoder-core/tool-docs/bash.md` ∥ `thincoder-core/tool-docs/execute.md` ∥ `thincoder-core/tool-docs/git.md` ∥ `thincoder-core/tool-docs/manifest.md` ∥ `thincoder-core/tool-docs/memory.md` 各含 `project` 一行与「纯声明」句；`test/RTM.md` 故事 12 含 12-12 / 12-13 / 12-14 三行；**无项目三形的清单单位**（各一句、与 `none` 互斥）= `unknown — no project on this call` ∥ `unknown — the declared project is not a project` ∥ `unknown — no project owns this write's target`；**`manifest` 的 `init` 自举面**：`manifest({action:"init", target:"<无 manifest 的新目录>"})` 不带项目、不带号 ⇒ 照跑、`PROJECT-MANIFEST.json` 落盘（不进本门）；另带有效 `project` 而祖先链仍取不到根 ⇒ 结果不变（照跑落盘——定位参数在场时 `project` 不参与判定，定位参数优先）；目标已有 manifest ⇒ 拒、拒文 = 工具自身那句 `init never overwrites`（不是本门拒文，清单单位不出现）；`init` 的 target 落在既有项目内（祖先链有 manifest）而 target 自身无 manifest ⇒ 本门照判（要号）——不带号 ⇒ 拒（`no ledger number on this call`）；`manifest({action:"write", …})` 不带号 ⇒ 仍拒（`no ledger number on this call`） |

## 6. 用例表

| 类 | 输入 | 期望 |
|---|---|---|
| 正常 | `create{topic,source}` 无 `ledger` | 档落盘 + 行 `在途` + 档头 `#N` |
| 正常 | `create{ledger:"#1830"}` 且该行 `待讨论` | 行 → `在途`、`task_book` = 本档 |
| 边界 | 两条 `在途` 行并存，先带 `#A` 写一笔、再带 `#B` 写同一目标 | 两次都放行——本门判「报的号在途」，与并存数无关；两笔各自是独立的记账声明 |
| 正常 | `git({action:"commit", …})` 带本仓在途号 | 提交生效 |
| 错误 | 台账无在途行时 `git({action:"commit", …})` | 拒，仓库零动 |
| 正常 | `git({action:"status"})` 不带号 | 照跑（只读 action 不要号） |
| 正常 | `git({action:"checkpoint", checkpointAction:"list"})` 不带号 | 照跑（子动作分支判只读——端装饰体 `:55` 的裁定） |
| 错误 | `git({action:"checkpoint", checkpointAction:"rewind", checkpointId:"…"})` 不带号 | 拒（子动作分支判写型），仓库零动 |
| 正常 | `manifest({action:"read"})` 不带号 | 照跑（不落盘） |
| 错误 | `manifest({action:"write", key, value})` 不带号（工程模式父侧） | 拒，manifest 字节零改 |
| 边界 | `memory({action:"put", layer:"personal", …})` 不带号 | 照跑（落用户数据目录，不是项目内档） |
| 错误 | `memory({action:"put", layer:"project", …})` 不带号 | 拒，`<项目>/.thincoder/memory/` 零写 |
| 错误 | `memory({action:"delete", id:"project:abc"})` 不带 `layer`、不带号 | 拒（单条删除的层由 id 前缀定，`project:` 前缀 ⇒ 项目内档），文件仍在 |
| 错误 | 带本仓在途号跑 `git({action:"commit", workdir:"<另一项目仓>"})`，该仓无在途行 | 拒，拒文指向该项目（号看目标项目的账） |
| 错误 | `execute({code, workdir:"<另一项目仓>"})` 带本仓在途号，该仓无在途行 | 拒，脚本零执行（`execute` 的根按 `workdir` 取，与会话同法的是不带 `workdir` 那支） |
| 边界 | 行 `在途` 但 `task_book` 指另一档 | 拒（`R-C2`） |
| 错误 | 行号不存在 / 已归档 | 拒（`R-C1` / `R-C3`），档不落盘 |
| 错误 | 台账无在途行时写 `thincoder-core/x.mjs` | 拒（`§2.3` 串），文件零改 |
| 错误 | 台账库不可开 | 拒，拒文带原始错误 |
| 错误 | `close` 时 `§3` = `进行中` | 拒，点名 §3 |
| 错误 | 核销 `§3` 非 pass 的档 | 拒（`R-L3`） |
| 错误 | 核销一份「已收口 ∧ `§3` 无状态行 ∧ `§1` 有 `> 不适用：§3 —— <理由>`」的存量档的行 | 拒（`R-L3` 逐字，③ 点名）——`§3` 不可声明不适用，声明不构成豁免 |
| 错误 | `§1` 写 `> 不适用：§3`（带不带理由同判）的档走到核销 | 到不了本门：收口面 `malformedInapplicableLine` 先拒（`§3` ∉ 可声明集 ⇒ 形不合）——新档停在 `进行中` ⇒ 本门报 ② 未收口 |
| 错误 | 有活设计槽、台账无在途行时写 `thincoder-core/vendor/` 或 `target/` 下的 `.mjs` | 拒（产品面——第三方目录可能带手写补丁）；**由 12-5 覆盖**：与 `node_modules` / `dist` / `test/integration` 断言同一个业务结果（未声明目录 ⇒ 产品面 ⇒ 拒），只是输入不同，不单开行 |
| 错误 | `§3` = `进行中` 时 `append §5` | 拒（`R-G2` 串），§5 字节不变 |
| 正常 | 评审 `append §3` 正文携 `VERDICT: pass` | 写入；块 +1；§3 段级状态行由工具置 `评审通过` |
| 边界 | `append §3` 正文携 `结论：通过`（独立整行） | 写入（本地化整行形同认） |
| 边界 | `append §3` 正文携 `结论：通过。`（尾句号） | 写入（pass 锚中文分支尾句号可省可带——与 `VERDICT: 通过。` 同判） |
| 错误 | `append §3` 正文无任何裁定行 | 拒（`R-G3`），字节零改、轮次号不消耗 |
| 错误 | `append §3` 正文写 `**结论** = VERDICT: pass`（非独立整行） | 拒（`R-G3`） |
| 错误 | `append §3` 一笔同携 pass 与打回两行 | 拒（块内裁定 = 两者同携） |
| 边界 | 评审在 §3 里以代码围栏引用 `R-G3` 拒文、并另写一行 `VERDICT: pass` | 写入（拒文自身读成「无裁定行」，不会构成「两者同携」；纯文本粘贴撞既有文档机检门，非本闸） |
| 边界 | `§1` 写 `> 不适用：§3` 的批 `append §5` | 拒（`R-G2`）——声明不再是出路；同档带一轮携 pass 裁定的 `§3` ⇒ 写入 |
| 边界 | `§3` 已 pass 的修正轮 `append §5` | 写入 |
| 错误 | 台账无在途行时写 `thincoder-vscode/test/x.test.mjs` | 拒（产品测试面串），字节零改 |
| 错误 | 台账无在途行时写 `test/integration/x.test.mjs` | 拒（产品面） |
| 错误 | 台账无在途行时写 `thincoder-core/newthing/foo.mjs` | 拒（新目录不例外） |
| 错误 | 写 `node_modules/pkg/x.mjs` · `thincoder-cli/dist/out.mjs` | 拒（产品面——构建物也要开批档） |
| 边界 | 写项目外路径（祖先链无 manifest） | 放行——判据作用域之外，不读台账（不是例外） |
| 错误 | 台账无在途行时写 `thincoder-core/scripts/s.mjs` | 拒（包内 `scripts/` 是产品代码面——修正③） |
| 正常 | 收口含 1 `在途` + 1 `待讨论` + 1 已处置 `待核销` | 前两行重锚并点名，第三行零触 |
| 错误 | 台账无在途行时写仓根 `scripts/x.mjs` | 拒（产品面） |
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

| 错误 | `待讨论` 行 `ledger close{status:"已核销"}` | 拒，拒文逐字 = `§2.14`；行状态仍 `待讨论`、`closed_at` 仍空 |
| 错误 | `待设计` 行同形 | 拒，现态点名 `待设计` |
| 错误 | `在途` 行 `ledger close{status:"已核销"}` | 拒，现态点名 `在途`（在途不可跳：先 `待核销`） |
| 正常 | `待核销` 行 `ledger close{status:"已核销"}` | 通过（勾销径零改） |
| 边界 | `待讨论` 行 `update` 到 `在途` → `待核销` → `close` | 三步全过（「条目在别处完成」的走法，`§2.14`） |
| 边界 | `close --batch` 含一行 `待讨论` + 一行 `待核销` | `待核销` 行销掉；`待讨论` 行落 `skipped` 并点名「须先 update 到 在途」；事务照提交 |
| 正常 | `bash({command:"git status", project:"<本仓根>", ledger:"#<本仓在途号>"})` | 执行并回输出 |
| 正常 | `memory({action:"put", layer:"project", project:"<本仓根>", ledger:"#N", title, content})` | 写入 `<本仓>/.thincoder/memory/` |
| 边界 | `bash({command:"…", project:"<本仓>/thincoder-core/agent", ledger:"#<本仓在途号>"})`（项目内子目录） | 按祖先链归到本仓，放行 |
| 边界 | `bash({command:"…"})` 不带 `project`，会话 cwd 推不出根 | 拒，`no project on this call`，命令零执行 |
| 错误 | `bash({command:"…", project:"D:\\teamcode", ledger:"#<本仓在途号>"})`（容器根，自身无 manifest） | 拒，`declared project is not a project` |
| 错误 | 声明 A 项目、号取自 B 项目 | 拒，`row #N does not exist in this project's ledger` |
| 错误 | 工程模式 depth-0 `write` 到 `<本仓外临时目录>/x.txt` | 拒，`declared project is not a project` |
| 边界 | 会话 cwd = `<本仓>/thincoder-cli`，`bash({command:"git status", project:"<本仓根>", ledger:"#<本仓在途号>"})` | 放行——声明根含会话锚（相关性 (a) 支），命令执行并回输出 |
| 错误 | 同一会话（cwd = `<本仓>/thincoder-cli`）`bash({command:"git status", ledger:"#<本仓在途号>"})` 不带 `project` | 拒，`no project on this call`，命令零执行 |
| 错误 | `execute({code:"…"})` 既不带 `workdir` 也不带 `project`（工程模式 depth-0） | 拒，`no project on this call`，脚本零执行——不回落到会话 cwd |
| 边界 | `execute({code:"…", workdir:"<另一项目仓>", project:"<本仓根>"})` | 按 `workdir` 判（定位参数优先），号要在那个仓的账上 |

## 7. 边界（本批不做）

- **设计门的判据点不动**：仍是会话锚（`thincoder-core/agent/dispatch.mjs` 的出辖放行零改）；本批只换写锁的判据点。
- **不给 `bash` 加 cwd 语义**：`project` 是纯声明，不改执行目录。
- **不给写盘七件加 `project`**：它们的目标路径即是声明，且恒在。`execute` ∥ `git` ∥ `manifest` 的 `project` 只在定位参数缺位时被读（定位参数优先）；`project` 在这五把上一律是纯声明，不改执行目录。
- **不动**：`depth > 0` 守卫、普通模式、设计门位次、跨批档写锁与 D5 冻结窗。

- 不做存量档回填（`§3` 词面 / 档头台账行）：已冻结档字节不动。
- **不为收窄的终态加回落**（`§2.5`）：值读 `unknown` 时仍 fail-closed，唯一出路 = 手改档把 `§1` 状态行移进段头区；拒文点名这条出路（`§5` R26）。
- 不改 `已核销` 行残值（`§4` 第 5 条）。
- 不动 `findInFlightBatch` 的歧义门、不动冻结门、不动 D5 冻结窗。
- 不动写面既有两道（跨批档写 · D5 冻结窗）；锁与它们并列挂同一块（`dispatch.mjs:142-165`）。
- 提示词面本批两笔（落点与字面 = `§2.9` ∥ 批档 `§2.3.4`）：`## Change-face routing (doc face ∥ product face)` 两行表 ∥ persona 节标题改 `### Change-face routing and dispatch fields`；由实施轮 eng-coder 落笔。
- 本档不写 `test/**`；RTM 改行与用例由实施轮按 `§9` 的 delta 落。**两处 `test/` 同属产品面**（`§2.10`）。
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
- **不改六态词表，也不改迁移表其余边**（`§2.14`）：迁移表只删核销那一条边（`待讨论 / 待设计 → 已核销`），其余六条零改；不给 `待讨论` 行开任何新出口。

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

`test/RTM.md` 已读（2026-11-03 实读）：故事 1–31 共 **108 行**（逐行计数，含故事 12 的 12-1 … 12-13 十三行）。三问逐条作答。

**破的行（现有断言被本批改掉 ⇒ 改写 ∥ 退役）**

| 行 | 原断言 | 本批之后 |
|---|---|---|
| 2-1 / 2-2 / 2-3（`test/RTM.md:27`–`:29`） | 未立项写产品源文件 ⇒ **文件确实写入**，只多一行 `[pen check]`，第二次不再提示 | 被裁定 ⑤ 取代：无在途台账行写产品码 ⇒ **拒**，文件零改。故事节 2 退役，由新故事 12 接替（决策 8） |
| 10-3（`test/RTM.md:120`） | 核销门 ③ 判「槽内有归属」：已收口但槽内无归属 ⇒ 拒 | ③ 改判档面：已收口 ∧ `§3` = `评审通过` ⇒ **通过**（槽内无归属也通过）；拒因改列为「`§3` 非 pass」 |
| 14-6（`test/RTM.md:179`） | 重开后「产品码写当场可写（台账里又有该档的在途行）」——建在旧判据上 | 改成两半：夹具带入档头号（重开后该行即在途）⇒ 带 `ledger:"#N"` 写照写；不带号写同一目标 ⇒ 拒。断言对象不变（重开 ⇒ 后续写能不能做） |

**冗余的行**：2-1 / 2-2 / 2-3（前提被取代，见上表）。其余 34 行无冗余。

**缺的行（编号先定在 RTM，再写用例标题 `test('<编号> …')`）**

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 服务条目 |
|---|---|---|---|
| 12-1 | `write` 工具 ↔ 笔-账绑定判定 | 台账有在途行 `#A`、本笔不传 `ledger` ⇒ 拒（拒文含 `no ledger number on this call` 与用法句 `Pass ledger:"#N"`），文件零改 | R2 |
| 12-2 | 同上 | 带 `ledger:"#A"` 与 `ledger:"A"` 两形写同一目标 ⇒ 都照写、字节 = 写入内容——`#` 可省，两形同判 | R2 |
| 12-3 | 笔-账绑定判定 ↔ 台账库 | 带 `已核销` 号 / 不存在的号 / `待讨论` 号 各写一笔 ⇒ 三次全拒，拒文分别点名该状态或 `does not exist`，文件零改 | R2 · R10 |
| 12-4 | 同上 | 台账库不可读 ∥ manifest 在而不可用 ⇒ 拒，拒文另起 `(ledger unreadable — <原错>)` 行；文件零改 | R2 |
| 13-1 | `batch create` ↔ 台账事务 | 不传 `ledger` 建一档 ⇒ 台账 +1 行 `在途`、`task_book` = 该档、档头写真实 `#N`（终态；事务步序与残留态见 `§2.4`） | R1 |
| 13-2 | 同上 | 传 `待讨论` 号 ⇒ 该行 `在途` + 指针回填 | R1 · R8 |
| 13-3 | 同上 | 传 `已核销` 号 ⇒ 拒，档零落盘、行零改 | R1 |
| 14-1 | `batch append §5` ↔ `§3` 状态行 | `§3` = `进行中` ⇒ 拒；`§3` = `评审通过` ⇒ 写入 | R4 |
| 14-2 | `batch close` ↔ 链门 | `§3` 非 pass ⇒ 拒，回执含 `§3 状态行 = <value>`；`§1` 状态行字节不变 | R5 |
| 14-3 | `ledger close` ↔ 档面 `§3` | 换会话（槽内无归属）核销合格行 ⇒ 通过 | R6 |
| 14-4 | `batch close` ↔ 台账重锚 | 本批 1 行 `在途` + 1 行 `待讨论` ⇒ 分别 `待核销` / `条件`，回执两行 | R7 |
| 12-5 | `write` 工具 ↔ 判据作用域（项目根推导） | 无在途行时写 `<仓外临时目录>/x.mjs` ⇒ **放行**（无「本项目的台账」可问，且不需号）；同会话写 `<仓内路径>` ⇒ 拒——证明放行的是作用域而不是面 | R2 |
| 12-6 | `search` / 索引发现 ↔ 排除名单单源 | 在 `thincoder-core/vendor/x.mjs` 放一份可搜索文本 ⇒ `search` 不再命中（名单合并后剪枝面扩大）；`node_modules` / `dist` 下的文件同样不进索引（借行：服务 R14，迁出条件见本轮 delta 块） | R14 |
| 12-7 | `bash` 工具 ↔ 笔-账绑定判定 | 无在途行时跑 `git status` ⇒ 拒、命令零执行、无输出；挂一条在途行后带号跑同一条 ⇒ 执行并回输出——只读命令与写命令同判 | R2 |
| 12-8 | `write` 工具 ↔ 子代理面 | 子代理（`depth > 0`）不带号写 ⇒ 本门不拒（拒因若现，只来自它自己的 token 门） | R2 |
| 14-5 | `batch close` ↔ 台账重锚兜底 | 收口含 1 行 `在途` + 1 行 `待讨论` ⇒ 回执点名「2 行由重锚默认推进」 | R13 |
| 14-6 | `batch status` 重开 ↔ 台账回收 | 收口后重开（行 `待核销`）⇒ 行回 `在途`、回执点名 1 行；产品码写当场可写 | R15 |
| 14-7 | 同上 | 核销后重开（行 `已核销`）⇒ 行仍 `已核销`，回执逐 id 点名「不可回收」；两种重开并存 ⇒ 两行回执各一行 | R15 |

**笔-账绑定的 RTM 答复（相对盘面）——重写 6 行 + 新增 3 行 + 零改 2 行**：

- **重写 6 行** = 12-1 ∥ 12-2 ∥ 12-3 ∥ 12-4 ∥ 12-5 ∥ 12-7（旧的「有没有在途行」断言不再成立；12-7 的号位原是「仓外作用域」，现改为 `bash` ∥ `execute` 同判）。
- **新增 3 行** = `git` 三行：12-9 ∥ 12-10 ∥ 12-11（下表）。
- **零改 2 行** = 12-6（排除名单，借行）∥ 12-8（子代理面，上一轮已在册）。
- **故事标题改口径**：「写盘与跑命令都要报它替哪条台账行服务（不分面、不分类命令）」。
- **破的行无一积压**：旧 12-3 的「两条在途行并存 ⇒ 照写」与旧 12-5 的「产品测试档变体句」随旧判据一起退场。

**进入口**：全部从父侧工具面进（`write` / `bash` / `execute` / `batch` / `ledger`）——用户走的就是这条路；无一条从内部函数进。

**落法**：改行与用例由实施轮落（本档不改 `test/`）：先把 12/13/14 三个故事节与编号写进 RTM，再写用例标题。

- **故事 12 节注补两句**（与同表故事 10 ∥ 11 ∥ 17 同形）：「交互组件 = 写盘 / 跑命令的工具面 ↔ 笔-账绑定判定 ↔ 台账库」与「进入口 = 父侧工具调用（工程模式 depth-0）」；`git` 三行同批进节注的行序（现为八态，落成十一态）。

**预算**：该轮新增 17 行、退役 3 行（累计现盘读数 = 本节顶部那一行，不在此重复）。

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

**收口面声明一律拒 的 RTM 答复——破 0 / 冗余 0 / 改 1（10-3 加 d 档） / 增 1（7-11）**

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 进入口 | 服务条目 |
|---|---|---|---|---|
| 10-3 d 档（`test/RTM.md` 故事 10，用例 `test/integration/ledger-close-proof.test.mjs`） | `ledger close` ↔ 收口面档面事实（`§1` 状态行 + `§3` 状态行） | 已收口 ∧ `§3` 无状态行 ∧ `§1` 声明 `> 不适用：§3 —— 纯措辞纠正，无设计变更` 的存量档，其行核销 ⇒ **拒**（③ 串逐字「重开该档补评审结论，或另起批次」）、行状态仍 `待核销`、`closed_at` 仍空；a / b / c 三档断言逐字保留 | 父侧 `ledger` 工具 `close` | R-S3-4（核销门判据零改）· R-S3-1 |
| 7-11（新增 · `test/RTM.md` 故事 7，用例 `test/integration/batch-close-gate.test.mjs`） | `batch close` ↔ 收口链门（`malformedInapplicableLine`） | `§1` 带一行 `> 不适用：§3` 而段内容齐的档 ⇒ `close` **拒**（`inapplicableDeclarationError` 逐字回该行）、`§1` 状态行字节不变、档未冻结 | 父侧 `batch` 工具 `close`（工程模式 depth-0） | R-S3-1 · R-S3-5 |

- **为什么 10-3 不另立行**：入口与观测面与 10-3 完全相同（`ledger` 工具 `close` → 工具回执 + 行集落盘值），另立一行把同一个业务结果写两遍。
- **为什么收口面另立一行**：入口不同（`batch close`）、观面不同（批档被拒且字节不变）、业务结果不同（这一批没结账）——它是声明退役在**写面**上的可观察后果，10-3 看不见。
- **进不了集成面的一半**：声明形不合的拒绝发生在**收口时点**（`malformedInapplicableLine`），由 7-11 承接；核销面那条（10-3 d 档）断言的是「存量声明档销不掉」。
- **套件规模**：改 1 行、增 1 行。

**核销边只留一条 的 RTM 答复——破 0 / 冗余 0 / 增 1**

- **破的行 = 0**：10-3 的三档夹具（a/b/c）行态全在 `待核销`，判的是核销门的三个缺项；本批改的是「什么状态的行能进核销」，不是「进来以后判什么」 ⇒ 三档断言逐字不变。
- **冗余的行 = 0**：无一行断言「`待讨论 / 待设计` 可核销」——全库检索 `追认核销` 在 `test/RTM.md` 零命中。
- **增 1 行 = 10-5**（故事 10「收口即清账」，用例 `test/integration/ledger-close-proof.test.mjs`）：交互 = 台账迁移边 ↔ 核销源态判；业务可观察结果 = `待讨论` 行 `ledger close{status:"已核销"}` ⇒ 拒（回照名现态与出路）、行状态仍 `待讨论`、`closed_at` 仍空；同档 `update` 到 `在途` → `待核销` → `close` ⇒ 三步全过；服务条目 = R28。
- **为什么另立一行而不是并进 10-3**：10-3 的进入口是「合格行能不能结账」，本行的进入口是「没认领的行能不能结账」——业务结果不同（前者是过与被拒，后者是这条边不存在）。
- **进入口** = 父侧 `ledger` 工具（`close` ∥ `update`），用户走的就是这条路。
- **套件规模**：该轮 +1 行（累计读数 = 本节顶部）。
- **落法**：编号 10-5 先写进 `test/RTM.md`，再写用例标题 `test('10-5 …')`——由实施轮落。

**服务端台账面（R-S3-10 ∥ R-S3-11 ∥ R-S3-12）的 RTM 答复——破 0 / 冗余 0 / 缺 1（本批不开立）**

- **检索读数**：`test/RTM.md` 查「团队台账」∥「team_ledger」= **零命中**（2026-11-02 实跑）⇒ 服务端面在集成套件里无故事节、无一行，本批无任何既有断言被改写（破 0、冗余 0）。
- **该不该有故事**：**该有**。它有一个真实的业务可观察结果——`close` 一条 `待讨论` 行 ⇒ 400 人话 + 行状态零变 + `closed_at` 仍空；进入口是用户真会走的（核工具 `team_ledger` ∥ 控制台 `#/me/ledger`），不是内部函数。
- **缺它的原因是载体事实**：`thincoder-server` 下 `*.test.mjs` 零档，集成套件只挂产品前端入口，服务端面从未进过套件。
- **本批不开立**：开一条新故事节 = 新增一个业务面进套件，属范围扩充；本批是收敛批。**如实记缺 1 行**，触发条件 = 服务端第一次建测试载体那一轮，届时同一轮补故事节 + 用例。
- **本批服务端验收因此落在两处**：设计面判据 = `docs/server/design/ledger/LEDGER.md` §11 `B7` ∥ `B7b`；可跑面 = 本批单测档 `docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs`（收口删除）。

**写锁改判台账在途行的 RTM 答复——破 2 / 冗余 0 / 改 1 / 增 3 / 零改 2 / 借行 1**

- **破的行 = 12-5**：上一版期望（`node_modules` / `dist` / `test/integration` ⇒ 放行）建在「构建物与测试面放行」的旧面判上，与本批判据相反。本节 12-5 行已按「四条全拒」重写；`test/RTM.md` 那一行本身不动（它本来就是这个期望）。
- **破的行 = 14-6**（`test/RTM.md:179`，故事 14，用例 `test/integration/batch-gates-reanchor.test.mjs`）：原断言逐字「随后产品码写当场可写（台账里又有该档的在途行）」建在旧判据上——行回 `在途` 就足以放行。新判据下那笔写缺号必拒 ⇒ 该行必红。改写为两半（带号照写 ∥ 不带号拒），断言对象不变。
- **实施轮扇面**：`test/integration/**` 里凡靠「有在途行 ⇒ 可写」立夹具或立断言的行，逐行点名改写；已知命中 = `batch-live-batch-lock.test.mjs`（故事 12 全段，本轮重写）与 `batch-gates-reanchor.test.mjs`（14-6）。判据 = 该档每一笔写盘、每一条 `bash` ∥ `execute` ∥ `git` 写型调用都带 `ledger`。
- **改的行 = 12-4**：加一格夹具——项目根在而 manifest 不可解（坏 JSON）⇒ 拒、拒文带原错。它与「声明路径不是项目」是两态（`§2.3` 钉子 · `§5` R2 ⑦）：判的是「是不是项目」，不是「项目好不好用」。
- **改的行 = 12-5**（判据点改成「调用方声明」后重新定杯）：旧期望「项目外目标 ⇒ 放行」建立在「推不出 ⇒ 门不管」上，新形下失效——项目之外没有判据点。改写为两条：写仓外目标 ⇒ 拒（`declared project is not a project`）；声明容器根 `D:\teamcode` ⇒ 同拒。断言对象不变（判据点合不合法）。原文里「放行的是判据作用域」那段理由随之退场。
- **借行 = 12-6**（保留，迁出触发条件写明）：它服务的条目是 R14（排除名单单源），业务入口是 `search` / 索引，与故事 12「写盘准入」不是同一件事。
  迁出需要一个新故事节，而新开业务面属范围扩充 ⇒ 本批保留并标「借行」；迁出触发条件 = 排除名单有独立故事节那一轮。
**`git` 纳入写的 RTM 答复——破 0 / 冗余 0 / 增 5**（编号先定在 `test/RTM.md`，再写用例标题 `test('<编号> …')`）

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 进入口 | 服务条目 |
|---|---|---|---|---|
| 12-9 | `git` 工具 ↔ 笔-账绑定判定（写型 action） | 无在途号跑 `git commit` ⇒ 拒、`git log` 输出不变；带在途号同笔 ⇒ 提交生效 | 父侧 `git` 工具 | R2 ⑪ |
| 12-10 | `git` 工具 ↔ 笔-账绑定判定（只读 action） | 无在途号跑 `git status` ⇒ 照跑回输出——同一笔门在写型与只读型上答案不同 | 父侧 `git` 工具 | R2 ⑫ |
| 12-11 | `git` 工具 ↔ 项目根推导（`path` ∥ `workdir`） | 本仓有号、`workdir` 指向无在途行的项目仓跑 `commit` ⇒ 拒并点该项目 | 父侧 `git` 工具 | R2 ⑬ |
| 12-12 | `bash` ∥ `memory` ↔ 笔-账绑定判定（项目声明输入） | 会话 cwd = 容器根（祖先链无 manifest）、台账无在途行：`bash` 跑 `git status` 不带 `project` ⇒ 拒（含 `no project on this call`）、命令零执行；带 `project:<本仓>` 仍不带号 ⇒ 拒（含 `no ledger number on this call`）；再带本仓在途号 ⇒ 执行并回输出 | 父侧 `bash` ∥ `memory` 工具 | R31 · R32 |
| 12-13 | 工具 ↔ 项目声明与台账对不上 | `project:"D:\\teamcode"`（自身无 manifest）+ 本仓在途号 ⇒ 拒（含 `declared project is not a project`）；声明 A 项目、号取自 B 项目 ⇒ 拒（含 `does not exist in this project's ledger`）；两条拒文都同时点出 `project` 与 `ledger` 两个输入 | 父侧工具调用 | R31 · R33 |

- **破的行 = 0**：既有 12-7 断的是「`bash` ∥ `execute` 的只读命令也要号」，`git` 只读型断的是反面 —— 两行不重叠：前者的命令无法静态分类，后者有枚举。
- **冗余的行 = 0**：无一行断言过 `git` 落盘。
- **为什么只读型要单独一行**：它是本批唯一一处「同一把工具、两种判据」的业务可观察结果；并进 12-9 会让「只读命令不要号」这条在零断言下存在，下一次收窄它一格也不会红。

- **套件规模**：本表五行（12-9 … 12-13，前三条是 `git` 的，后两条是项目声明面的）全部已在册 ⇒ 该块新增计 **5 行**；现盘读数 = **108 行**，已越 ≈50–100 的上界 8 行。上界是上界不是平均值：下一笔业务变更应裁旧场景，不再加行。

**项目声明面（R30–R33）的 RTM 答复——破 0 / 冗余 0 / 增 1 / 改 2**（编号先定在 `test/RTM.md`，再写用例标题 `test('<编号> …')`）

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 进入口 | 服务条目 |
|---|---|---|---|---|
| 12-14 | `bash` ↔ 项目声明与台账（会话 cwd 在项目子目录） | 会话 cwd = `<本仓>/thincoder-cli`：`bash` 带 `project:<本仓根>` + 本仓在途号 ⇒ 放行、命令执行并回输出；同一会话不带 `project` ⇒ 拒（`no project on this call`）、命令零执行 | 父侧 `bash` 工具（工程模式 depth-0） | R31 · R32 |

- **破的行 = 0**：12-12 / 12-13 断的是「容器根锚下声明补位」与「声明不是项目 / 号不在该项目账上」，无一断「会话 cwd 在项目子目录」这一形。
- **改的行 = 12-1 ∥ 12-7**：12-1 的用法句改成两输入（`Pass project:` ∧ `ledger:"#N"`）；12-7 两次调用各补 `project:<本仓>`——判据点不再是会话锚。断言对象不变。
- **12-14 与 12-12 为什么不并**：12-12 的会话 cwd 在容器根（锚里没有项目，项目在锚之下 ⇒ 测「声明补位」）；12-14 的会话 cwd 在项目之内（项目在锚之上 ⇒ 测「界的相关性 (a) 支」）。并成一行，后者零断言。
- **冗余的行 = 0**：无一行断言过「声明根含会话锚」这一支。
- **套件规模**：108 + 1 = **109 行**（超上界 9 行，处置同上块末句）。。

**`manifest` init 取根豁免（决策 43 修正轮 · 2026-11-03 批）的 RTM 答复——破 0 / 冗余 0 / 改 0 / 增 1**（编号先定在 `test/RTM.md`，再写用例标题 `test('<编号> …')`）

| 编号 | 交互（哪两个组件） | 业务可观察结果（断言） | 进入口 | 服务条目 |
|---|---|---|---|---|
| 12-15 | `manifest` 工具 ↔ 笔-账绑定判定（`init` 的取根豁免支） | 台账无在途行：`manifest({action:"init", target:"<祖先链无 manifest 的新目录>"})` 不带项目不带号 ⇒ 照跑、`PROJECT-MANIFEST.json` 落盘在 target（不进本门）；同形 target 换成既有项目内子目录 ⇒ 不带号拒（`no ledger number on this call`）、带本仓在途号 ⇒ 门过后工具拒（含 `init never overwrites`——落点解析到祖先项目根，`manifest.mjs:160`），manifest 字节零改 | 父侧 `manifest` 工具（工程模式 depth-0） | R2 ⑭ · R33 |

- **破的行 = 0**：故事 12 现行十四行无一碰 `manifest`（12-12 ∥ 12-13 ∥ 12-14 全是 `bash` ∥ `memory` ∥ 声明面）；故事 9 的 9-1 断 `init` 在工作区锚的拒——本批后门对「取不到根」的 init 跳过、拒文来自工具自身（workspace 态 + 候选全列），期望文本不变、该行由按现行码必红变为可达（代码径读数：现行 `write-gate.mjs:504` 对取不到根一律拒 ⇒ 门先于工具拒，9-1 期望的工具拒文到不了）。
- **冗余的行 = 0**：无一行断言过 `init` 的落盘行为（R33 的 init 自举面是 §5 判据文本，不是 RTM 行）。
- **为什么另立一行**：入口（`manifest` 工具）与观测面（manifest 落盘 ∥ 两级拒文）在既有行里零出现——并进任何一行都会让「自举不进本门」在零断言下存在。
- **套件规模**：增 1 行（现盘读数 109 ⇒ 110；上界处置同上块末句——下一笔业务变更裁旧场景）。
