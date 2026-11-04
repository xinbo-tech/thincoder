# 2026-11-03 · write-gate-ledger-bind
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-03 · 来源 = 用户 2026-11-03 02:01 实机质问（写门「只要有活台账就放行」）＋ 02:02 裁形状「当然是甲啊！轮内可能异步在做好几项任务啊！」。
> 台账 = #2016（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-03
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 用户裁决（本轮唯一形状裁定）

- **已定决定**：写门判据加**笔-账绑定**，形状取**甲 · 逐笔带号**（每次写盘调用自带 `ledger:"#N"`，不是轮内绑定） · 用户原话：「**当然是甲啊！轮内可能异步在做好几项任务啊！**」 · 时间：2026-11-03 02:02

## 问题陈述（父侧实读，非设计结论）

**现象**：用户 2026-11-03 02:01 在 VSC 端看到 `write` 调用未被拦 —— 而本仓台账此刻有两条在途行（`#2012` ∥ `#2013`），其工作与本笔写无关。

**现状判据（逐字）**：`thincoder-core/agent/write-gate.mjs:271` `if (verdict.open) continue`，同行注「该根台账里有在途行 ⇒ 放行（多行合法——只问存在否）」；判定式 = `ledgerQuery({ cwd: root, boundary: root, status: "在途" })`（`:229`）。

**后果**：一条在途行放行该根下**任何一笔写**。它只拦「本仓一条在途行都没有」，拦不住「有账但在做别的事」，也拦不住「有账却写范围外的档」。写工具参数只有 `path` ∥ `content`，**不携带任何台账号**。

**根因（父侧自认）**：`#2011` 设计期把「零合取项」误读成「不判笔-账对应」。前者防的是「每次写都要人重新挂账」的摩擦，后者是把判据拆空 —— 两件事，做成了后一件。

## 本轮不做什么

- 不动 `bash` ∥ `execute` 的绕过问题（另挂，见台账）。
- 不动子代理深度的既有 token 门（`write-gate.mjs:264` 的 `depth === 0` 守卫保留）。

## 用户裁决（第二笔 —— 撤父侧原「本轮不做」）

- **已定决定**：`bash` ∥ `execute` 一并纳入写门判据，**不得留作「已知缺口」** · 用户原话：「**另外，你他妈的居然bash之类的工具还不纳入写门，你他妈的开洞的毛病真是改不了了。**」 · 时间：2026-11-03 02:03

**父侧自认（两处）**：

- 本批 §1 的「本轮不做什么」原写「不动 `bash` ∥ `execute` 的绕过问题（另挂，见台账）」—— 该条**作废**，本节末尾登记。
- 更早的错误是**替缺口找理由**：父侧 2026-11-03 02:00 说过「把 `bash` 纳入，每一笔 `npm test` 也要先有在途行，这个门就会挡住正常开发节奏」。该说法把「摩擦」当成了不堵洞的依据 —— 摩擦可以靠「挂着账再跑」解决，洞不能靠摩擦大小来定性。

**判法约束（父侧裁，写进设计）**：

- **不得靠猜命令内容**（`grep -q 'rm '` 那类正则分类）—— 那本身就是第二个洞，且会给假安全感。`bash` ∥ `execute` 与 `FILE_MUTATORS` **同一判据**：要号、核号。
- 由此产生的**真实代价**要写进设计而不是回避：工程模式下父侧**任何** `bash` ∥ `execute` 调用都要求有在途行（含跑测试、查状态这类只读命令）—— 解决办法是「先挂账再干活」，不是给命令分类开洞。

## 第 1 轮修正后两处上抛的裁定（父侧 2026-11-03 02:21）

**① `checkpoint list` ∥ `cat` 保持只读、不要号 —— 裁：保持。**

- **已定决定**：`git({action:"checkpoint", checkpointAction:"list"|"cat"})` 不入写门判据（不挂号即可跑） · 父侧裁定 · 时间：2026-11-03 02:21

**三条理由，按轻重排**：

1. **它正是「没账时也要能用」的那一把**：checkpoint 的用途是出事后回看与回退。而「出事」常发生在账已经收口的时候（`待核销` / `已核销` ⇒ 无在途行）。给它要号，等于在**最需要恢复的那一刻把恢复工具锁上** —— 这才是真的走不通。
2. **它删的是过期快照，不是项目字节**：F6 的清理只清「commit 后已失去意义」的快照目录（设计档已引 `docs/core/design/CHECKPOINT.md` F6/D3 的判据）。
3. **只读名单单源在端装饰体**，改它要连带改审批面（同是权限短路 ∥ planMode 判据）—— 那是用户裁量面，不是本批能顺带改的。

**⇒ 若日后认为它该要号**：前提是先裁 `docs/core/design/CHECKPOINT.md` F6/D3，且端装饰体同笔改；单改核钩子会造成一面一号。

**② §2 那条删不掉的重复状态行 —— 裁：留着，不改工具。**

**⇒ 事实**：占位行已由 `status` 写成 `设计完成`，原第 47 行那条也是 `设计完成` ⇒ 两行同值，读面取首命中 = `设计完成`，**行为正确**。**
**⇒ `batch edit` 拒写任何状态行（工具逐字「that line has exactly one writer: status」）—— 这是对的机制，不为一条冗余开第二次写权。**
**⇒ 登记为残余**（见 §6）：冗余行不影响读面，`status` 下次写会把首行更新，第二行成为惰性副本；工具面「去重路径」已挂台账另议。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成

### 本批覆盖（台账 #2016）

| # | 条目 | 状态 |
|---|---|---|
| E1 | 写门入口集全部**十二**把工具（`FILE_MUTATORS` 六件 + `file_ops` + `bash` + `execute` + `git` + `manifest` + `memory`）的 schema 加 `ledger` 参数 | ✅ 设计已落 |
| E2 | 判据重写为「该号的行存在 ∧ `status = 在途` ∧ 未废弃」，不再问「有没有在途行」 | ✅ |
| E3 | 四情形拒文（缺号 / 号非行号形 / 号不在盘 / 号不在途），缺号即拒，拒文带一行最小用法；每支出处逐支点名（设计 §2.3 的出处表） | ✅ |
| E4 | 子代理面（`depth > 0`）零改：本门不核子代理的号；号由父侧写进任务书，子代理从绑定批档档头取 | ✅ |
| E5 | 位次：替换既有写锁那一道，不并列加门；跨批档写 ∥ D5 冻结窗仍在前 | ✅ |
| E6 | `bash` ∥ `execute` 纳入同一判据，不按命令内容分类（用户 02:03 裁）；代价与正路写进设计 | ✅ |
| E7 | 自洽：落地起本批每一笔写盘 / 每一次跑命令带 `ledger:"#2016"`；挂行与开档不经过入口集 | ✅ |
| E8 | `git` 进同一道门，但**只对写型 action 要号**；只读名单 = 端装饰体逐条抄齐（六项平铺 + 六条子动作分支，`checkpoint` 的 `list` ∥ `cat` 判只读），单源落核钩子；**端覆写同笔删**，`thincoder-vscode/src/tools/index.mjs` 进受影响表；目标根按 `path` ∥ `workdir` 取，都不带则同会话根 | ✅ |
| E9 | 拒文升级为判据面要求：`ledger` 不进 `required` ⇒ 拒文是唯一教学面，必须写全三件——缺什么 / 要带什么号 / 当下有哪些号可带（清单上限 10 条，超出折 `#N, #M, … +K more`） | ✅ |
| E10 | 入口集按「落盘目标在不在项目内」划线，写成有扫描面的句子：`manifest`（`init` / `write` 要号、`read` 不要）∥ `memory`（`layer:"project"` ∥ `project:` id 前缀要号）补入；`settings` ∥ `browser` 不写项目内档，逐项写答案（设计决策 39） | ✅ |
| E11 | 集成面：RTM 14-6 登记为破的行（夹具补号，断言改「带号即写 ∥ 不带号即拒」）；`test/integration/**` 扫面一条；故事 12 节注补「交互组件 / 进入口」两句；行数分账按盘面改「重写 6 + 新增 3 + 零改 2」 | ✅ |

**台账实读（本批开档时）= 三条在途**：`#2012` ∥ `#2013` ∥ `#2016`（含本批自己的行；§1 写的「两条」是开档前的读数）。

**不在本批**：`test/` 与提示词面由实施轮落（本档不动）；`git` 只读名单抄齐时若与端装饰体出差异，按设计档「`git` 怎么问」处置——差要消掉，不留一个面另判。

### 设计档落点

机制设计 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`：

- **§2.3** 判据 ∥ 入口集 ∥ `bash`·`execute` 问法 ∥ `git` 问法 ∥ `manifest`·`memory` 问法与扫描表 ∥ 四情形拒文与出处表 ∥ 自洽 ∥ 子代理 ∥ 工具 schema 面。
- **§2.6** 五道门表的写锁行；**§3** 受影响档（含行数复量）。
- **§4** 决策 34 ∥ 35 ∥ 36 ∥ 37 ∥ 38 ∥ 39；**§5** R2 十五臂 + 可跑面。
- **§6** 用例表：写盘一格 + `git` 五格 + `manifest`·`memory` 三格。

符号面 = `thincoder-core/agent/write-gate.mjs` 导出 `ledgerBindWriteConflict` ∥ 模块内判据函数 `ledgerRowAt`（不导出）· 写型/只读判据 = 既有 `readonlyActionOf`（`thincoder-core/agent/dispatch-gates.mjs`），单源落 `thincoder-core/tools/git.mjs` 的钩子。集成面 = `test/RTM.md` 故事 12（重写 6 + 新增 3 + 零改 2）+ 故事 14 的 14-6 改写。

### 受影响文件与分层结论

| 档 | 性质 | 要点 |
|---|---|---|
| `thincoder-core/agent/write-gate.mjs` | 改造 | 判据换输入（本笔报的号）+ 导出与模块内函数改名 + 四情形拒文 + 删 `faceDetail` import + 入口集补 `bash` ∥ `execute` ∥ `git` ∥ `manifest` ∥ `memory`（`bash` 按 `agent.cwd` 推根；`git` 按 `path` ∥ `workdir` 推根、`execute` 按 `workdir` 推根，都不带则同会话根；`git` 只读 action 按核钩子判；`manifest` 按 `action`、`memory` 按 `layer` ∥ `project:` id 前缀判；拒文清单上限 10 条） |
| `thincoder-core/agent/dispatch.mjs` | 改造 | `bash` ∥ `execute` ∥ `git` ∥ `manifest` ∥ `memory` 进写锁那道门内；调形传 `tool` + `toolName` + `args`（路径集与 `args.ledger` 由判据函数自己取）；`reason` 改 `ledger binding` |
| `thincoder-core/agent/dispatch-run.mjs` | 改造 | 拒因串的消费点在本档：`denied` 分支按 `item.reason` 选回显串，旧串 `no in-flight ledger row` 随判据退场 ⇒ 不同笔改这里，拒文会掉进兜底串（模型看不到真拒因）；改法 = `"ledger binding"` 与既有两道同支，回 `Error: ${item.hint}` |
| `thincoder-core/tools/` 六档（`file` · `patch` · `ops` · `bash` · `execute` · `git`） | 改造 | 各 `parameters.properties` 加 `ledger`（不进 `required`）；`git.mjs` 另补 `isReadonlyAction` 钩子——名单 = 端装饰体 `thincoder-vscode/src/tools/index.mjs:52`–`:60` 六项平铺 + 六条子动作分支逐条抄齐（`checkpoint` 的 `list` ∥ `cat` 判只读，与端装饰体同答案） |
| `thincoder-core/tools/shared.mjs` | 改造 | `ledger` 参数描述单源（`LEDGER_PARAM_DESC` + `_GIT` ∥ `_MANIFEST` ∥ `_MEMORY` 三条后缀）：十二处各抄一遍就是同一机制十二份描述，措辞漂移后模型读到十二版规则 |
| `thincoder-core/agent-tools/manifest.mjs` | 改造 | `parameters.properties` 加 `ledger`（不进 `required`）；`init` ∥ `write` 进本门、`read` 不进 |
| `thincoder-core/memory/memory-tool.mjs` | 改造 | `parameters.properties` 加 `ledger`（不进 `required`）；落 project 层的写型 action 进本门——`layer:"project"`，或单条 `delete` 不带 `layer` 而 id 前缀 = `project:`（该工具的层由前缀定） |
| `thincoder-vscode/src/tools/index.mjs` | 改造 | 删 `gitTool` 的 `isReadonlyAction` 覆写、保留 `...coreGitTool` 展开；`docs/core/design/CHECKPOINT.md` F6/D3 的口径注搬进核钩子（核有钩子后端覆写是同一份名单的第二份拷贝，且优先级让端覆写吃掉核答案） |
| `thincoder-vscode/src/tools/shell.mjs` | 改造 | 端自持的 `bash` 是独立 schema 副本（非核工具展开）——不补 `ledger` 则该端 schema 面上没有这个参数，只有拒文能教它 |
| `thincoder-core/tool-docs/` 十二个工具描述档 | 改造 | 各补一行用法（描述面是模型真正读到的那一面：`ledger:"#N"` = 本笔服务的那条在途台账行）；`git` 档另写「只读 action 不要号」、`manifest` 档「仅 `init`/`write` 要号」、`memory` 档「`layer:"project"` ∥ `project:` id 前缀要号」 |
| `test/integration/batch-live-batch-lock.test.mjs` | 改造 | 按 RTM 故事 12 的十一行重写（重写 6 + 新增 3 + 零改 2；含 `git` 三行 12-9 ∥ 12-10 ∥ 12-11） |
| `test/integration/batch-gates-reanchor.test.mjs` | 改造 | 14-6：夹具补档头号，断言改「带号即写 ∥ 不带号即拒」 |
| `test/RTM.md` | 改造 | 故事 12 节重写（补「交互组件 / 进入口」两句、`git` 三行编号先定）+ 故事 14 的 14-6 行改写（`test/` 由实施轮落） |

**分层结论**：无档跨层，四类各留本层：

- **产品代码面十四档**：`thincoder-core/agent/write-gate.mjs` · `thincoder-core/agent/dispatch.mjs` · `thincoder-core/agent/dispatch-run.mjs` · `thincoder-core/tools/` 六档（`file` · `patch` · `ops` · `bash` · `execute` · `git`）· `thincoder-core/tools/shared.mjs` · `thincoder-core/agent-tools/manifest.mjs` · `thincoder-core/memory/memory-tool.mjs` · `thincoder-vscode/src/tools/index.mjs` · `thincoder-vscode/src/tools/shell.mjs`。
- **工具描述面十二档** · **集成用例两档** · **文档面两档**（本档 + 设计档）。

工具描述与 schema 同笔落地，不拆两轮。行数复量：上列各档 159–449 行，均不越 500 软线（`thincoder-core/tools/file.mjs` 449 最近，实施轮改后复量）。

### 验收对照

判据逐臂在**设计 §5 R2**，本段只引不抄。

- **号的四情形**：缺号 / 非行号形 / 号不在盘 / 号非在途。
- **放行面**：号在途放行且 `#` 可省、面不参与；出辖不需号；`git` 只读不要号（含六项平铺与两条子动作分支的白盒格）。
- **取根**：`git` 与 `execute` 按 `path` / `workdir` 取根。
- **两把结构化工具**：`manifest` 写型要号、读型不要；`memory` 按 `layer` ∥ id 前缀判——单条 `delete` 不带 `layer`、id 带 `project:` 前缀同样要号。
- **环境面**：台账读不到即拒；普通模式与 `depth > 0` 零改；子代理带号不被本门核；`bash` ∥ `execute` 同判。

**可跑面（本批验收入口）**：本批单测档 = `docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs`（与批档同名同目录，随本批收口删除），跑法 = `node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs`；R2 的 ①–⑮ 与 ⑫ 的白盒格都落该档。集成面 = RTM 故事 12 十一行 + 14-6，由父侧收口跑。

改漏会红在哪一步（逐处一行）：

| 改漏的处 | 红在哪 |
|---|---|
| 判据不换（仍问「有没有在途行」） | R2 臂①② 红，RTM 12-1 同时红 |
| 入口集漏 `bash` | R2 臂⑩、RTM 12-7 红（只读命令无号照跑） |
| 入口集漏 `execute` | 同一臂只红一半（`bash` 通、`execute` 通不了，缺一即红） |
| `git` 不入入口集 | R2 臂⑪、RTM 12-9 红（无号 `git commit` 照提交） |
| `git` 写成「一律要号」 | R2 臂⑫、RTM 12-10 红（只读 `git status` 无号被拒）；白盒那格 `readonlyActionOf(gitTool,"git",{action:"status"})` 同时红 |
| `git` 只按会话根取根 | R2 臂⑬、RTM 12-11 红（`workdir` 那仓有在途行时误放行，或本仓有号时误拒） |
| 核工具漏补 `isReadonlyAction` | 臂⑫ 只在装了端装饰体的面绿、CLI ∥ desktop 红——一面绿一面红正是本条要消的差 |
| `required` 被写进 schema | 决策 35 破：普通模式读到一条不成立的强制（RTM 无行可红，只能靠评审读 `§3` 受影响表） |

### 关键决策

- **34 · 判据改输入**：从「该根有没有在途行」换成「这笔报的号是不是在途行」（用户 02:02 裁 甲 · 逐笔带号）。被拒 = 轮内绑定——轮内可能异步在做几项任务，会把几件事压成一条账。
- **35 · `ledger` 不进 `required`**：`required` 是静态字面，而工具在两模式 / 子代理 / 出辖目标下共用；静态必填让普通模式读到一条不成立的强制（决策 18 写锁仅工程）。机械强制在门，schema 只负责让模型知道有这个参数。
- **36 · `bash` ∥ `execute` 同判、不分类命令**（用户 02:03 裁）：按字面分类本身是第二个洞并给假安全感。代价已写进设计 §2.3 —— 工程模式下父侧任何 `bash` ∥ `execute` 都要有在途行，含 `npm test` / `git status`；正路 = 先挂行再干活。
- **37 · `git` 纳入，只读 action 不要号**（用户 02:03 原话「`bash` **之类的工具**」⇒ `git` 在「之类」里）：名单 = 端装饰体 `thincoder-vscode/src/tools/index.mjs:52`–`:60` **逐条抄齐**——六项平铺（`diff` / `status` / `log` / `show` / `ls-remote` / `blame`）+ 六条子动作分支（`checkpoint` 的 `list` ∥ `cat`；`tag` / `branch` / `stash` / `remote` / `worktree` 各自 `list`）。`checkpoint` 的 `list` ∥ `cat` **判只读**（该档 `:54` 逐字「保留只读分类免审批（`docs/core/design/CHECKPOINT.md` F6/D3 设计意图）」）；判写型的子动作（`create` / `delete` / `rewind` / `versions` / `pop` / `push` …）要号。判法用既有 `readonlyActionOf`，不新写分类。核补同名钩子后**端覆写同笔删**（`thincoder-vscode/src/tools/index.mjs` 进受影响表），单源在核钩子、三面同答案。根按 `path` ∥ `workdir` 取，都不带则同会话根。
- **39 · 入口集按「落盘目标在不在项目内」划线**：扫描出两把漏网的写型工具——`manifest`（`init` / `write` 写 `<项目>/PROJECT-MANIFEST.json`）与 `memory`（`layer:"project"` 写 `<项目>/.thincoder/memory/**`）⇒ 补入入口集：`manifest` 按 `action` 判、`memory` 按 `layer` 判（都用工具自己的枚举，与 37 同法，不碰 36 那条禁令）。`settings`（写 `~/.thincoder/config.json`）∥ `browser`（自有 profile 与截图目录）不写项目内档 ⇒ 不进，逐项写进设计 §2.3 扫描表。原「其余能落盘的工具全部在入口集内」全称句删掉——它没有扫描面。
- **38 · `ledger` 不进 `required` 的代价 = 拒文是唯一教学面**（用户 2026-11-03 认下）：模型不传号就撞拒，拒文是它唯一会看到的那一面。故拒文必须写全三件——缺什么 / 要带什么号 / 当下有哪些号可带，无在途行时给挂号两步。拒文与 schema 同属判据面，删掉它这个参数就没有可发现路径。

### 上抛项

- 无。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

评审范围 = `docs/batches/2026-11-03-write-gate-ledger-bind.md` ∥ `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3 ∥ `test/RTM.md`。三个裁决都有逐字落点（判据换输入 · 甲·逐笔带号 · `bash` ∥ `execute` 同判），拒文三件式与入口集骨架可跑。以下 3 条 🔴 挡住通过。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 可行性 ∥ 跨端一致 | 🔴 | `git` 只读名单读错单源：设计把 `checkpoint` 判成不按只读放行，而它声明的单源在 `thincoder-vscode/src/tools/index.mjs` 写的是「保留只读分类」并返回 `["list","cat"]`；`tag`/`branch`/`stash`/`remote`/`worktree` 五条 `list` 分支设计未列。照此落地 ⇒ 核钩子与端装饰体答案相反 | 名单按端装饰体逐条抄齐（含五条子动作分支与 `checkpoint`）；若坚持 `checkpoint` 要号，写成明示偏离并同笔改端装饰体，并把该端档列入受影响档 |
| 2 | 需求覆盖 ∥ 入口集完整性 | 🔴 | 「其余能落盘的工具全部在入口集内」不成立：`manifest` 工具 `init`/`write` 经 `initManifest`/`writeManifest` 写 `PROJECT-MANIFEST.json`，不在十件入口集，且未给豁免理由 | 把写 `PROJECT-MANIFEST.json` 纳入入口集或写明豁免与代价；`settings`/`memory`/`browser` 的落盘面同步扫一遍逐个给答案 |
| 3 | 集成测试设计（RTM delta） | 🔴 | 破的行报少一条：`test/RTM.md` 14-6 仍断言「产品码写当场可写（台账里又有该档的在途行）」且夹具不带号；新判据下该笔必拒 ⇒ 14-6 红，而 delta 只报 12-5、`git` 那轮报破 0 | 把 14-6 写进破的行并改写（夹具补号、断言改「带号即写」）；同轮扫 `test/integration/**` 里其余靠「有在途行即可写」的夹具 |
| 4 | 分支出处（6b） | 🟡 | 四种拒情形里只有「缺号」有实机出处；非行号形 / 号不在盘 / 号非在途三支只有夹具，没有点名出处 | 给三支各点一次出处，或并成一支「不是本项目的活号」共用一句拒文与一格夹具 |
| 5 | 文档状态 | 🟡 | 批档 §2 段头区有两行 `**状态行**：`，首行是占位 `（eng-designer 写入时更新）` ⇒ 按 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 的定位面，§2 对所有读面读成 `null`（该档已登记此形） | 删占位那一行，段头区只留一行为结论行 |
| 6 | 文档状态 ∥ 旧判据残留 | 🟡 | 同一档里旧判据与旧符号名仍在教：决策 7「写锁只问台账里有没有在途行」∥ §3 表 `ledgerOpenAt` 行 ∥ §5 R29 断言 grep 命中 `ledgerOpenAt`（改名后必红）∥ §5 R10「写锁放行」 | 四处按新判据与新名收正；R29 的 grep 断言随改名一并改口径 |
| 7 | 集成测试设计 | 🟡 | `test/RTM.md` 故事 12 节注只有回指与行序，没有交互组件与进入口（故事 10 ∥ 11 ∥ 17 都有）；设计 delta 未要求补 | 故事 12 节注补「交互组件 =」与「进入口 =」两句，与同表其他故事节同形 |
| 8 | 清晰度 | 🟡 | 行数分账与盘面不一致：批档 §2 写「重写 6 + 新增 4 + 12-6 零改」，而 `test/RTM.md` 里 12-8 已在册、设计 §9 的 `git` delta 报增 3 ⇒ 增量被数成 4，实施席可能重复落 12-8 | 分账改为「重写 6 + 新增 3 + 零改 2」，或点名 12-8 已在册 |
| 9 | 验收 | 🟡 | 验收只引 R2 十三臂，没有指名可跑文件/命令；白盒那一格（`readonlyActionOf` 对 `git` 两动作）在受影响表里没有落点（`test/` 推给实施轮） | 验收补一行可跑面（本批单测档路径与命令），白盒那一格写进该档 |
| 10 | 分层抽查 | 🔵 | 分层结论「无档跨层」经复量成立：`write-gate.mjs` 282 · `dispatch.mjs` 280 · `tools/file.mjs` 449 · `patch.mjs` 305 · `ops.mjs` 347 · `bash.mjs` 300 · `execute.mjs` 242 · `git.mjs` 403 · 集成用例 179 行 | 无需动作；`tools/file.mjs` 离软线最近（449），改后复量一次 |
| 11 | 一致性 | 🔵 | 同一句只读命令两条路不同判：`bash` 跑 `git status` 要号，`git({action:"status"})` 不要号；设计两侧都写了，但没把这处不对称点名 | 在 §2.3 的 `git` 段补一句「同一条命令经 `bash` 要号、经 `git` 不要号」，免得下一轮有人来「统一」 |
| 12 | 清晰度 | 🔵 | 拒文要列「当下有哪些号可带」，未设上限；台账行多时这句会很长（教学面变成噪音） | 给清单设上限并写「等 N 条」，与 `aged` 读数不冲突 |

计数：🔴 3 · 🟡 6 · 🔵 3。范围限制：无文档地图、无项目标准档，文档归属按 `AGENTS.md` 与三档自述判；分层结论由复量核对（第 10 行）。

VERDICT: changes-required

### 轮次 2（评审子代理）

本轮 = 第 1 轮 12 条的落地验证 + 新问题扫描；三档全文重读（`docs/batches/2026-11-03-write-gate-ledger-bind.md` · `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.3 ∥ §3 ∥ §4 ∥ §5 ∥ §9 · `test/RTM.md`）。原 3 条 🔴 ∥ 6 条 🟡 ∥ 3 条 🔵 全部落地；新出 3 条 🔵 建议，不挡通过。

| 原# | 严重度 | 结论 | 依据（本轮实读） |
|---|---|---|---|
| 1 | 🔴 | Fixed | 只读名单改「抄齐」：六项平铺 + 六条子动作分支，checkpoint 的 list ∥ cat 判只读（引端档 :54 的免审批注），端覆写同笔删、`thincoder-vscode/src/tools/index.mjs` 进两份受影响表；R2 ⑫ 带白盒六格 |
| 2 | 🔴 | Fixed | 入口集 = 十二把；manifest（init ∥ write）∥ memory（layer:project）补入，settings ∥ browser 逐项给答案；决策 39 把原全称句改成扫描域 |
| 3 | 🔴 | Fixed | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §9 把 14-6 登记为破的行（带号照写 ∥ 不带号拒），并给实施轮扫面逐行点名已知命中两档 |
| 4 | 🟡 | Fixed | §2.3 新增四支拒文出处表，四支各有实机 ∥ 实读坐标；非行号形带 `thincoder-core/ledger-write-ops.mjs` 坐标 |
| 5 | 🟡 | Fixed | 批档 §2 段头区首命中已是结论行，占位行不再把 §2 读成 null；第二行同值按 §1 裁定 ② 保留 |
| 6 | 🟡 | Fixed | 决策 7 ∥ §3 live-batch 行 ∥ R10 ∥ R29 四处已改到 ledgerRowAt 与新判据；R29 另加旧名零命中一格 |
| 7 | 🟡 | Fixed | E11 与受影响表写明故事 12 节注补交互组件 ∥ 进入口两句，与故事 10 ∥ 11 ∥ 17 同形 |
| 8 | 🟡 | Fixed | 分账改为重写 6 + 新增 3 + 零改 2，与盘面 8 行 + git 三行一致 |
| 9 | 🟡 | Fixed | 验收补可跑面：批档同名单测档路径 + `node --test` 跑法，R2 ①–⑮ 与 ⑫ 白盒格都落该档 |
| 10 | 🔵 | Fixed | 受影响表补行数复量（164–449）与 `thincoder-core/tools/file.mjs` 改后复量判据 |
| 11 | 🔵 | Fixed | §2.3 已补一句说明同一命令经 bash 与经 git 答案不同是有意的、下一轮不要统一 |
| 12 | 🔵 | Fixed | 拒文清单上限 10 条、第 11 条起折 +K more，与 none 互斥 |
| N1 | 🔵 | New | 替代全称句的扫描域句仍是全称形，而同节两句后 ledger ∥ batch 正写项目内档却故意不在入口集 —— 建议加一句限定：台账 ∥ 批档面自身除外 |
| N2 | 🔵 | New | manifest 的 init 表述为要号，但 R2 ⑭ 只断言 write ∥ read；init 在无 manifest 的树上按出辖放行，建议一句话对齐口径并补一格 |
| N3 | 🔵 | New | §3 称 write-gate.mjs 186 行（标注实读），本轮读到 282 行；档位结论（≤500）不受影响 |

计数：🔴 0 · 🟡 0（原 6 条全 Fixed）· 🔵 3（新建议，不挡通过）。范围限制：无文档地图 ∥ 无项目标准档，文档归属按 `AGENTS.md` 与三档自述判。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-03 02:25 逐字「批准」。

**批准时的状态**：设计评审两轮 —— 第 1 轮判 stale（父侧在飞时写了批档，撞 D5；无 token）→ 重发 → 第 2 轮 **pass**（第 1 轮 3🔴 / 6🟡 / 3🔵 全 Fixed，新增 3 条 🔵 建议不挡）。

**批准范围**：写门判据从「项目台账里有没有任意在途行」换成「**这一笔报的 `#N` 是不是该项目台账里的在途行**」；入口集扩到十二把工具（`FILE_MUTATORS` 六件 + `file_ops` + `bash` + `execute` + `git` + `manifest` + `memory`）；拒文作为唯一教学面；`git` 只读名单抄齐端装饰体后核内补钩子、端覆写同笔删。

**判据**：设计 §5 `R2` 十五臂 + 白盒格；可跑面 = `node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs`。

**父侧派工时的一处坐标更正（§2 待设计席收正）**：§2 受影响表与设计 §3 写的 `thincoder-core/agent-tools/memory-tool.mjs` 盘上不存在；实读真实路径 = `thincoder-core/memory/memory-tool.mjs`。派工按实读路径下发。

## §5 实施记录（eng-coder）

**交付摘要**：写锁判据从「该根有没有任意在途行」换成「**本笔报的 `#N` 是目标所属项目台账里一条 `在途` 行**」（笔-账绑定）；入口集扩到十二把工具；`git` 的写型 ∥ 只读名单单源落核；`ledger` 进十二把工具的 schema 但不进 `required`（拒文成为唯一教学面）。

**判据落法**

- 导出 `ledgerBindWriteConflict(agent, depth, tool, toolName, args)`，住 `thincoder-core/agent/write-gate.mjs`。
- 模块内判据函数 `ledgerRowAt(absPath, ledgerNo, cache)`（不导出）：推项目根 → 取该根行集 → 按 `id` 找行 → 判 `status`。
- 路径集与 `args.ledger` 由判据函数自己取；四情形拒文逐字对设计 §2.3。
- `faceDetail` import 已删（面在判据里退场）。

**落地清单（本批声明档）**：

| 档 | 改了什么 |
|---|---|
| `thincoder-core/agent/write-gate.mjs` | 判据换输入 + 导出与模块内函数改名 + 十二把入口集 + 四情形拒文（清单上限 10）+ 删 `faceDetail` import + 加 `toolTouchPaths` ∥ `readonlyActionOf` 两条 import |
| `thincoder-core/agent/dispatch.mjs` | 写门移到跨批档写 ∥ D5 冻结窗之后、`FILE_MUTATORS` 块之外（十二把工具同一道门）；`reason` 改 `ledger binding` |
| `thincoder-core/tools/` 六档（`file` ∥ `patch` ∥ `ops` ∥ `bash` ∥ `execute` ∥ `git`） | 各 schema 加 `ledger`（不进 `required`）；`git.mjs` 补 `isReadonlyAction` 钩子（六项平铺 + 六条子动作分支，`checkpoint` 的 `list` ∥ `cat` 判只读，F6/D3 口径注随名单搬入） |
| `thincoder-core/agent-tools/manifest.mjs` ∥ `thincoder-core/memory/memory-tool.mjs` | schema 加 `ledger` + 各自的适用面后缀（`init`∥`write`；`layer:"project"`） |
| `thincoder-vscode/src/tools/index.mjs` | 删 `gitTool` 的 `isReadonlyAction` 覆写、保留 `{ ...coreGitTool }`（与核钩子**同一笔**：核有钩子同时端覆写删，三面同答案，无中间态） |
| `thincoder-core/tool-docs/` 十二档 | 各补一段 `ledger` 用法；`git` 另写只读不要号、`manifest` 写仅 init/write、`memory` 写仅 project 层 |
| `test/integration/batch-live-batch-lock.test.mjs` | 按故事 12 重写成十一例（12-1…12-11） |
| `test/integration/batch-gates-reanchor.test.mjs` | 14-6 改成两半（带重开那条在途号 ⇒ 照写；不带号 ⇒ 拒） |
| `test/RTM.md` | 故事 12 节注补「交互组件 / 进入口」两句、八态改十一态、新增 12-9 ∥ 12-10 ∥ 12-11 三行、14-6 行改写 |
| `docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs` | 本批单测档（R2 十五臂 + ⑫ 白盒六格），收口即删 |

**越界档（§2 受影响表未列、交付需要；理由逐条）**：

| 档 | 为什么必须改 |
|---|---|
| `thincoder-core/agent/dispatch-run.mjs` | 拒因是字符串键，消费点在本档：`denied` 分支按 `item.reason` 选回显串，旧串 `no in-flight ledger row` 已随判据退场 ⇒ 不同笔改这里，拒文会掉进兜底串（模型看不到真拒因） |
| `thincoder-core/tools/shared.mjs` | `ledger` 参数描述单源（`LEDGER_PARAM_DESC` + 三条后缀）：十二处各抄一遍就是同一机制十二份描述，措辞漂移后模型读到十二版规则 |
| `thincoder-vscode/src/tools/shell.mjs` | 端自持的 `bash` 是独立 schema 副本（非核工具展开）；不补 `ledger` 则该端 schema 面上没有这个参数，只有拒文能教它 |

**R2 十五臂落地证据**（单测档 `node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs` = 15 pass / 0 fail）：

| 臂 | 单测格 | 改漏会红在哪 |
|---|---|---|
| ① 缺号 | 拒文含 `no ledger number on this call` + `Pass ledger:"#N"` + 在途清单 + 挂号两步；文件零改 | 判据不换（仍问「有没有在途行」）⇒ 该格绿、正路红 |
| ② 非行号形 | `"abc"` ∥ `"#"` 两笔各拒，原值带进拒文 | 不做行号解析 ⇒ 号形错也被当成「不在盘」 |
| ③ 号不在盘 | `#999999` ⇒ `does not exist in this project's ledger` | 只查「有没有在途行」⇒ 放行 |
| ④ 号非在途 | 已核销 ∥ 已废弃 ∥ 待讨论 ∥ 待设计 ∥ 待核销 五笔各拒并点名状态词 | 只判「行存在」不判 `status` ⇒ 归档号照写 |
| ⑤ 号在途放行 | `#N` 与 `N` 两形、文档面与产品面两目标都照写 | 面或字面参与判据 ⇒ 其中一形被拒 |
| ⑥ 出辖 | 仓外目标不带号照写；同会话仓内目标拒 | 出辖写成「放行支」而非判据作用域 ⇒ 仓内也会被放 |
| ⑦ 台账读不到 | 库位是目录 ∥ manifest 坏 JSON 两态都拒 + `(ledger unreadable — …)`，且不列清单 | 读错吞成「放行」⇒ 业务门失效 |
| ⑧ 普通模式 | `engineering: false` ⇒ 不带号照写 | 挂成两模式通用 ⇒ 普通模式产品行为被改 |
| ⑨ 子代理 | depth 1 不带号 ∥ 带错号都写得进去（本门不核） | 去掉 `depth === 0` 守卫 ⇒ 子代理被本门拒、token 门语义被改 |
| ⑩ bash ∥ execute | 无号两把都拒（`mkdir wg-probe` 零执行、`code` 零输出）；带号两把都执行 | 入口集漏一把 ⇒ 只红一半；按命令内容分类 ⇒ 只读命令被放 |
| ⑪ git 写型 | 无号 `commit` 拒且 `rev-parse --verify HEAD` 仍空；带号提交生效、`log` 出现 message | 入口集漏 `git` ⇒ 无号 commit 照提交 |
| ⑫ git 只读 + 白盒 | `status` 无号照跑；`readonlyActionOf` 六格（status∥commit · checkpoint list∥rewind · branch list∥delete） | 写成「一律要号」⇒ `git status` 被拒；核不补钩子 ⇒ 只在装了端覆写的面绿 |
| ⑬ 根取法 | 本仓号 + `workdir` 指另一仓跑 `commit` ⇒ 拒且目标仓零动；换目标仓的号 ⇒ 放行；`execute({workdir})` 同判 | 只按会话根取 ⇒ 跨项目误放行 ∥ 误拒 |
| ⑭ manifest | `write` 无号拒、盘字节零改；`read` 无号照跑；带号写生效 | 写型/读型不分开 ⇒ read 被要号或 write 被放行 |
| ⑮ memory | `put layer:"project"` 无号拒、project 层零写；**单条 `delete` 不带 `layer`、按 `project:` 前缀** 也拒、文件仍在；`layer:"personal"` 不过本门；带号单删放行 | 只看 `layer` ⇒ 按 id 前缀删 project 层档那条路开洞 |

**集成面读数**

- `node --test test/integration/batch-live-batch-lock.test.mjs` = 11 pass（12-1…12-11）。
- `node --test test/integration/batch-gates-reanchor.test.mjs` = 8 pass（含改写后的 14-6）。
- 另跑 13 个受影响集成档（批档 ∥ 台账 ∥ 路径 ∥ tester）= 37 pass。
- `thincoder-core/scripts/check-syntax.mjs` = 287 档 OK。

**行数复量（改后，判据 = 仍 ≤ 500 软线）**

| 档 | 行数 |
|---|---|
| `thincoder-core/tools/file.mjs` | 454（离软线最近） |
| `thincoder-core/tools/shared.mjs` | 492 |
| `thincoder-core/tools/git.mjs` | 426 |
| `thincoder-core/agent/write-gate.mjs` | 393 |
| `thincoder-core/tools/ops.mjs` | 348 |
| `thincoder-vscode/src/tools/shell.mjs` | 333 |
| `thincoder-core/tools/patch.mjs` | 308 |
| `thincoder-core/tools/bash.mjs` | 302 |
| `thincoder-core/agent/dispatch.mjs` | 283 |
| `thincoder-core/memory/memory-tool.mjs` | 246 |
| `thincoder-core/tools/execute.mjs` | 243 |
| `thincoder-core/agent-tools/manifest.mjs` | 233 |
| `thincoder-core/agent/dispatch-run.mjs` | 186 |
| `thincoder-vscode/src/tools/index.mjs` | 179 |

**审计与评审轮次**

- 只读偏离审计（explore）1 轮：🔴 0 条（E1–E11 逐条有落点）；🟡 3 条全是文档漂移。
- 代码评审（advisor `type=code`）1 轮：changes-required —— 2 条 🟡 + 4 条 🔵。
- 自修 1 轮 → 复跑全绿。

**自修（评审后 1 轮，两处）**

- **`memory` 的单条删除绕门**：判据原只认 `layer === "project"`，而该工具的单条删除 `layer` 可省、按 id 前缀路由到 project 层（`thincoder-core/memory/memory-tool.mjs` 逐字「layer is OPTIONAL … else the id prefix routes the delete」）⇒ 不带号也能删 `<项目>/.thincoder/memory/**`。已改成「`layer` 或 id 前缀 = `project:`」；`clear` ∥ `maintain` 从写型枚举剔掉（前者 personal-only、后者无 `layer` 参数，落不到项目内档）。单测 R2 ⑮ 补两格。
- **`execute` 的 `workdir` 换不换根**：判据原把 `bash` ∥ `execute` ∥ `memory` 一律按会话根判，而 `execute` 的参数表里有 `workdir`（逐字「Run in this directory … default cwd」）——同名参数在 `git` 上换根、在 `execute` 上不换，是两套答案。已改成与 `git` 同法取根；单测 R2 ⑬ 补两格。

**未修（评审 🔵，逐条理由）**

- `memory` project 层的实际落盘目录来自装配参数（`opts.projectDir`），本门按会话 cwd 判——只在显式配了 `memory.projectDir` 时问错账，属配置面差异，记在设计面。
- R2 ⑮ 的 personal 半原为弱断言，本轮已升级（白盒 + 行为两条），已收。
- 每笔调用开一次库：设计 §2.3 明写「同一笔写的多目标按 root 缓存，一次写只读一遍账」= 本批选的缓存粒度，按设计保留。

**终态**：`clean` —— 审计 🔴 0；评审 2 条 🟡 全修；复跑 15/15 ∥ 11/11 ∥ 8/8 ∥ 37/37 + 语法 287 档全绿。

**设计漂移（交设计席收正，不在本席笔下）**

- 两份受影响表（`§2` 表 ∥ 设计 `§3` 表）缺本轮实际改到的三档：`thincoder-core/agent/dispatch-run.mjs`（拒因消费点）、`thincoder-core/tools/shared.mjs`（参数描述单源常量）、`thincoder-vscode/src/tools/shell.mjs`（端自持 bash schema）。
- 设计决策 35 写「`ledger` 入**七把**写盘工具的 `properties`」，同档 `§2.3` 写「入口集**十二把**工具的 `parameters.properties` 各加 `ledger`」——两处口径不一致，实施按十二把落。
- 设计 `§2.3` 的四情形表没有第 5 条 `<case>`；台账读不到时基串仍需一个 `<case>`，实施取 `no ledger can be read for this project`（另起 `(ledger unreadable — …)` 一行、不列清单），该串无设计出处。
- 设计 `§2.3` 写「`bash` ∥ `execute` 不带目标路径 ⇒ 会话根」，事实是 `execute` 带 `workdir`（`thincoder-core/tools/execute.mjs` 的参数表）；实施按 `git` 同法处理 `execute` 的 `workdir`，故那句只对 `bash` 成立。
- 设计 `§2.3` 写「`memory` 的写型 action（`put` / `delete` / `clear` / `maintain`）要号」，事实是该工具的层级可由 id 前缀定（单条删除）、`clear` 只对 personal 开、`maintain` 无 `layer` 参数；实施按「凡能落到项目内档的路都要号」落地。

### 自修（第 2 轮 · 设计席自检揪出的描述面漂移）

- **处**：`thincoder-core/tools/shared.mjs` 的 `LEDGER_PARAM_DESC_MEMORY`（`ledger` 参数描述单源——决策 38 的教学面）。
- **改前逐字**：`；仅 `layer:"project"` 要号（`personal` ∥ `team` 落用户数据目录）`
- **改后逐字**：`；仅落 project 层的写型 action 要号：`layer:"project"`，或单条删除且 id 以 `project:` 开头（`personal` ∥ `team` 落用户数据目录，不要号）`
- **理由**：门认两个输入（`thincoder-core/agent/write-gate.mjs:347` `memoryTargetsProjectLayer`：`layer === "project"`，或 `layer` 省略 ∧ id 前缀 `project:`），描述只写了一个 ⇒ 模型按前缀删 project 层档时，教学面没告诉它要号。
- **边界**：只改这一段常量字符串；schema 结构、其余后缀（`_GIT` ∥ `_MANIFEST`）、代码逻辑零改。
- **读数**：`node --check thincoder-core/tools/shared.mjs` = OK；`node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs` = 15 pass / 0 fail。
- **面外同源漂移（未改，交父侧裁）**：`thincoder-core/tool-docs/memory.md:16` 逐字「must pass it only when `layer: "project"`」——同一句的另一份拷贝，同样只写了一个输入。
- **措辞精度（未改，交父侧裁）**：新句第二个输入写无条件（「或单条删除且 id 以 `project:` 开头」），门的 `:352` 逐字 `if (layer !== "") return false` ⇒ 显式给了别的层时前缀路不生效（该层由 `layer` 定）；设计 §2.3 原文带「（`layer` 省略时工具按前缀路由到 project 层）」。按派工原话落，未自行加限定。

### 描述面漂移收口（派工：三处，两改一留）

**① `thincoder-core/tool-docs/memory.md`:16（改 —— 模型读到的教学面）**

- **改前逐字**：`In engineering mode the parent agent must pass it only when `layer: "project"` — `personal` / `team` entries live in the user data directory, so they need no number.`
- **改后逐字**：`In engineering mode the parent agent must pass it for any write that lands in the project layer: either `layer: "project"`, or a single delete whose id starts with `project:` while `layer` is omitted (`personal` / `team` entries live in the user data directory, so they need no number).`
- **同源对齐**：与 `thincoder-core/tools/shared.mjs` 的 `LEDGER_PARAM_DESC_MEMORY`、`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 的 §2.3 同义三面同拍；门认两个输入（`thincoder-core/agent/write-gate.mjs` 的 `memoryTargetsProjectLayer`）—— `layer === "project"`，或 `layer` 省略 ∧ id 前缀 `project:`。

**② `thincoder-core/tools/shared.mjs` 的 `LEDGER_PARAM_DESC_MEMORY`（改 —— 补 `layer` 省略限定）**

- **改前逐字**：`；仅落 project 层的写型 action 要号：`layer:"project"`，或单条删除且 id 以 `project:` 开头（`personal` ∥ `team` 落用户数据目录，不要号）`
- **改后逐字**：`；仅落 project 层的写型 action 要号：`layer:"project"`，或省略 `layer`、单条删除且 id 以 `project:` 开头（此时层由前缀定；`personal` ∥ `team` 落用户数据目录，不要号）`
- **依据**：门 `:352` 逐字 `if (layer !== "") return false` ⇒ 显式给了别的层时前缀路不生效，原句把第二个输入写成无条件，与门答案相反。

**③ `thincoder-core/tools/shared.mjs` 第 37 行的 JSDoc —— 不改（已知同源行内注只写一个输入，按非教学面保留）**

- 依据：决策 38 的「教学面」= schema description ∥ tool-docs，行内注不在其中；故本档只留这一句，不留待办，下一轮不必当新发现重报。

**④ 同笔附带（落盘需要，非裁决面）：`thincoder-core/tool-docs/memory.md` 句界分段**

- ① 的整段 361 字越 300 软线（改前 253 字不越），`doc_check` 门命中原句。字一个未动，只在句界断成两段：定义句（74 字）∥ 适用面句（286 字）。

**读数**

- `node --check thincoder-core/tools/shared.mjs` = 0（静默 OK）。
- `node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs` = 15 pass / 0 fail / 0 skipped。
- `doc_check` 门（`thincoder-core/tool-docs/memory.md`）= `DOC-CHECK GATE: PASS`（0 段有问题）。

## §6 验证与收口（父代理）

## 交付核验（父侧实跑 + 实施席读数）

| 判据 | 命令 / 判法 | 读数 | 谁跑的 |
|---|---|---|---|
| 单元测试（R2 十五臂） | `node --test docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs` | **15 pass / 0 fail** | **父侧实跑** |
| 集成（故事 12 十一行 + 14-6） | `node --test test/integration/batch-live-batch-lock.test.mjs test/integration/batch-gates-reanchor.test.mjs` | **19 pass / 0 fail**（11 + 8） | **父侧实跑** |
| 语法面 | `thincoder-core/scripts/check-syntax.mjs` | 287 档 OK | 实施席 |
| 判据在盘 | 逐字核 `thincoder-core/agent/write-gate.mjs` | 导出 `ledgerBindWriteConflict` ∥ 模块内 `ledgerRowAt`；旧名 `ledgerOpenAt` ∥ `ledgerOpenWriteConflict` 全库 **0** | **父侧实跑** |
| 接线 | 逐字核 `thincoder-core/agent/dispatch.mjs` | 调新判据，旧串 `no in-flight ledger row` **0** | **父侧实跑** |
| 单源成立 | 逐字核两档 | 核 `thincoder-core/tools/git.mjs` 有 `isReadonlyAction`；端 `thincoder-vscode/src/tools/index.mjs` 只剩三行**注释**提它（覆写已删） | **父侧实跑** |
| 教学面三面同拍 | grep 两档 | `thincoder-core/tools/shared.mjs` 的 `LEDGER_PARAM_DESC_MEMORY` 与 `thincoder-core/tool-docs/memory.md` 都写全两路输入 | **父侧实跑** |
| 文档门 | `doc_check(mode:"gate")` 于设计档 ∥ 批档 ∥ 两份工具描述 | `DOC-CHECK GATE: PASS` | 父侧 ∥ 实施席 |

## 实施期发现（父侧确认，已并入设计与两份受影响表）

- **三档越出原受影响表**：`thincoder-core/agent/dispatch-run.mjs`（拒因串消费点）∥ `thincoder-core/tools/shared.mjs`（`ledger` 描述单源）∥ `thincoder-vscode/src/tools/shell.mjs`（端自持 bash schema 副本）。设计席逐条核代码后补进两份表，分层汇总 28 → **30 档**。
- **两处设计前提被事实推翻，已改成机制事实**：`execute` 带 `workdir`（按它取根）；`memory` 的层可由 `project:` id 前缀定（只看 `layer` 会漏掉「不带 layer 删 project 层档」那条路）。后者另补 R2 ⑮ 断言。
- **`<case>` 补齐**：台账读不到时的基串 `no ledger can be read for this project` 已进设计 §2.3。

## 已知残余（不设门，登记）

- `thincoder-core/tools/shared.mjs` 第 37 行的 JSDoc 仍只写一个输入 —— 行内注不是教学面（教学面 = schema description ∥ 工具描述档），故保留；下一轮不当新发现重报。
- 拒文清单上限 10 条：在途行多时清单折行显示，判据不受影响。

## 收口检查

- **暂缓批复核：无**。
- **文档门**：本批文档集 `PASS`。
- **单元测试档**：`docs/batches/2026-11-03-write-gate-ledger-bind.test.mjs`（15 例），按零留存于本收口删除。
- **运维事实（下一轮必读）**：新判据在**已启动进程里不生效** —— Node ESM 于进程启动时装载，落盘改动不热更新。要让新门生效，**重启 CLI ∥ reload VSC 扩展**；重启前旧进程仍跑旧判据（`#2016` 在途时表现为放行）。
- **台账**：`#2016` 随本收口核销。
