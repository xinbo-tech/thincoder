# 2026-11-02 · process-doc-hit-tag
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-02 · 来源 = 用户 2026-11-02 18:32 原话「关于grep找到批档去的那个问题，还有别的解法吗？比如给grep和bash之类的工具说明加上一些描述，告诉会找到过时的文档，他结果不能用作设计依据？」+ 18:34 选定「B」（= 命中处打标，不是只写说明）。
> 台账 = #2006（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与已定决定

**性质**：既有需求 FR41（`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19）的机制补强，走全链。

**背景（我造成的）**：本会话两次拿整树 `grep` 做文档发现，把 `docs/batches/` 里的旧话捞出来当依据，其中一次还重开一本已收口批档改其正文。用户 18:25 前后据此一度要收走 `grep ∥ bash ∥ execute`。

**用户给的解法阶梯**（我列的四个方案，用户 18:34 选「B」）：

- A 写进工具说明 —— 弱：说明在选工具时读，命中在干活时读，两者不同时在场；
- **B 命中处打标 —— 用户选定**：命中行所在档属索引排除集 ⇒ 输出里可见地标「过程档」；
- C 拿掉工具 —— 验证回路一起断；
- D 把批档挪出树 —— 改批档身份，动作过大。

**已定决定**

- **已定决定**：采用 **B（命中处打标）**，不改工具集、不造拦截门。· 用户原话：「**B**」 · 时间：2026-11-02 18:34
- **已定决定**：标记的判据单源 = 索引排除集（`docs/batches/**` ∥ `**/_archive/**`），不新造一份排除名单。· 依据：同一事实两处声明必分叉；索引那份已有单源（`thincoder-core/declaration.mjs` 面⑥）。 · 时间：2026-11-02 18:34
- **已定决定**：标记**不是门** —— 不拦、不筛、不改命中集，只加可读信息；与 §13.19 既有不变量「不新增机械门」不冲突。· 时间：2026-11-02 18:34
- **已定决定**：**`bash` 不在本轮** —— 它的输出是任意文本，只能靠正则猜路径所属档，误标比不标更坏；本轮只做「输出形能判定所属档」的检索面（`grep`）。· 时间：2026-11-02 18:34（我提，用户未否）

**待裁（设计席定形时回报）**

- 标记落形：行首前缀 ∥ 尾部汇总行 ∥ 两者。**行首前缀会改 `file:line:content` 的行内容**，若有消费面按此形解析会坏 —— 设计席须实读消费面再定。

**覆盖账 = #2006**

**形态补裁（用户 2026-11-02 18:37）**

- **已定决定**：取「甲」——标记落在**行首前缀**（原行内容跟着走），不是尾部汇总行。· 用户原话：「**甲，但是只标[过程档]肯定是不够的，必须用更明确的指示，告知不能作为设计依据。**」 · 时间：2026-11-02 18:37
- **已定决定**：前缀**必须带明确指令语**，不只标类别。只写「过程档」不够——读的人不必知道本项目里这个词的含义，看到就该知道**这行不能拿来当依据**。· 同上原话 · 时间：2026-11-02 18:37
- **由设计席定形（需回报）**：指令语的逐字（例如「过程档·不可作设计依据」这类，字数受行宽约束）、以及**是否保留 `file:line:` 段的可解析性**（前缀插在最前面会移动 `file:line` 的位置，若有消费面按「行首即路径」解析会坏）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五处接线 = grep ∥ bash 同步 ∥ bash 后台 ∥ execute ∥ VSC 端 bash 两出口 · 评审三轮 13 条已逐条落回）
## 2. 本批条目（覆盖）

| # | 条目 | 判据出处 |
|---|---|---|
| 1 | `grep` 输出：命中行所属档落在索引排除集（`docs/batches/**` ∥ `**/_archive/**`）⇒ 该行行首加逐字前缀 `[process doc: not a design basis]`；非过程档命中行**零字节变化** | 需求 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19 条 3-补 · 机制 `docs/core/design/TOOLS.md` §6.28 |
| 2 | 命令输出面（`bash`（核同步 ∥ 核后台摘要 ∥ VSC 端）∥ `execute`）：行首路径 token **真解析到盘上**且该档在排除集 ⇒ 行首同前缀；解析不到 ⇒ 一个字节不动（误标比不标更坏）；VSC 的 `bash` 是端侧独立实现，两处输出出口（visible ∥ 子进程）各接一次，`inject` 出口零捕获输出不接 | 同上 + 用户 18:38「bash 也要做」∥ 18:41 `execute` 一并做 |
| 3 | 命令输出面（`bash` ∥ `execute`）末尾汇总行：N > 0 ⇒ 追加 §6.28 写死的逐字串 `[process doc: N of this output's lines come from process docs — not a design basis]`；N = 0 ⇒ 不加（逐字与取英文的理由见 §6.28「末尾汇总行」） | 同上（用户 18:38「再加一道兜底」） |
| 4 | 不是门：不拦、不筛、不改命中集；`grep` ∥ `bash` ∥ `execute` 的参数面与返回结构（string）零改 | 同上 |
| 5 | `execute` 与 `bash` 共用同一套判据、同一 helper，只换拼装点与解析基准（基准 = 子进程 cwd `baseDir`，不是 `ctx.cwd`；后台径 = `launchBgTask` 内传给 `spawn` 的 `cwd` 局部值）；失败径同标；`execute` 无后台形 ⇒ 零摘要面 | 机制 `docs/core/design/TOOLS.md` §6.28「`execute` 面」 |

**本批不做**：`glob` / `ls`（输出是路径清单、无行内容）· `doc_search` / `read_history` · `execute` 的后台形（实读：不存在）· 提示词面 · 面⑥ 判据 · 需求档（父侧已定稿）。

## 3. 设计档落点

`docs/core/design/TOOLS.md` §6.28「工具输出里的过程档标记」（新增小节，就地承载；无新档、无跨板搬移）。

## 4. 受影响文件与测试覆盖

| 文件 | 动作 | 层级 |
|---|---|---|
| `thincoder-core/tools/process-doc-mark.mjs` | 新增叶档：`PROCESS_DOC_MARK` · `processDocSummary` · `isProcessDocPath` · `markProcessDocLines` | 核 · 工具输出面 |
| `thincoder-core/tools/search.mjs` | grep 两条输出分支接打标（无上下文形 ∥ 上下文形） | 同层 |
| `thincoder-core/tools/bash.mjs` | 同步径 `applyLineFilter` 之后接打标 | 同层 |
| `thincoder-core/agent-tools/bash-async.mjs` | `renderTail` 输出接同一 helper（`escapeXml` 之前）+ 建 entry 处补记 `cwd` | 同层 |
| `thincoder-core/tools/execute.mjs` | `runNode` 之后单一出口接同一 helper（`baseDir` 作解析基准） | 同层 |
| `thincoder-vscode/src/tools/shell.mjs` | VSC 端 `bash` 两处输出出口接线（visible ∥ 子进程）；`inject` 出口零捕获输出、不接 | 端 · 工具输出面（同判据、同 helper） |
| `test/integration/grep-process-doc-mark.test.mjs` | 新增集成用例 31-1（四面合例）/ 31-2 | 测试面 |
| `test/RTM.md` | CLI 端新增第 31 节 + 31-1 / 31-2 两行 | 测试面 |

**层级结论（核/端）**：判据单源在 `declaration.mjs`（既有），本批只加消费点。`grep` ∥ `execute` 是同核实现（`thincoder-vscode/src/tools/index.mjs:17` 取核 `grepTool`、`:21` 取核 `executeTool`），改核即端上生效；**`bash` 有端侧分叉**——VSC 取 `./shell.mjs`（`index.mjs:34`）的独立实现，故受影响文件表含该档，否则 VSC 端整面不标。

**层级结论（代码结构）**：本批无档越 500 行结构层 ⇒ 零拆分计划（判据 = 有无越层，不记逐档行数——行数随改动漂，读数不属设计面）。

## 5. 验收对照

逐条判据 = `docs/core/design/TOOLS.md` §6.28「验收」1–14，与本批条目一一对应（需求侧单源 = 需求档 §13.19 验收 ④ 指回该表）：

- 1–6 → 条目 1（grep 面：带前缀全等 ∥ 非排除档逐字节相同 ∥ `_archive` 面① 命中 ∥ 上下文两形 ∥ `(no matches)` 与 schema 零改 ∥ 出辖不标）；
- 7–10 → 条目 2 / 3（命令面三形 ∥ 盘上不存在的假路径零打标 ∥ 汇总行 N 对账 ∥ `filter` 按原始行命中）；
- 11–13 → 条目 5（`execute` 成功径 ∥ 失败径 ∥ `workdir` 在场的解析基准）；
- 14 → 条目 2（VSC 端 `bash` 两出口同标 ∥ `inject` 径零标）。

本轮跑法 = `node --test test/integration/grep-process-doc-mark.test.mjs`（改动面检查；全量套件是父侧收口门，不在本批跑）。

集成用例增量（自 `test/RTM.md` 起答）= 打破 0 行 · 冗余 0 行 · 新增 2 行（31-1 / 31-2），逐行内容见设计档 §6.28 表。

## 6. 关键决策

- **前缀落行首**（用户 18:37 选「甲」）：实读消费面 0 个按「行首即路径」解析；`[outside]` 先例走行尾是因为它的行首是寻址键，grep 的 `file:line` 不是。
- **指令语逐字 = `[process doc: not a design basis]`**：工具输出面全英文，同一行混中英破坏一词一物。
- **bash / execute 判据 = 盘上真解析**，禁止「看起来像路径」就标；判定一次调用内按 token 记忆（`Map<token, boolean>`）、**不设解析上限**——理由与实测读数 = 设计档 §6.28「成本与界」；输入量级由工具自身帽子兜住。
- **汇总行只在命令面**：grep 面用户明确不要尾部汇总那一形。
- **execute 解析基准 = `baseDir`（子进程 cwd）**，不是 `ctx.cwd`：`workdir` 在场时只有按子进程 cwd 才解得对上；实读 `resolveBaseDir` + `spawn({cwd: baseDir})` 两处坐实。
- **execute 失败径同标**：错误文本也是行内容，只标成功径 = 换个失败命令就绕过。
- **execute 无后台形**（schema 六参无 `async`，全档零 `onOutput` / `outputPanel` / `launchBgTask`）⇒ 零摘要面，不为它设接缝。

## 7. 上抛项

无。原 §1 待裁「标记落形 ∥ 是否保留 `file:line:` 可解析性」已回报：行首前缀 + 逐字指令语，且实读证明零消费方按行首解析。

**本席自定（非上抛，理由在 §6）**：集成用例 31-1 扩成四面而非新增 31-3——同一业务场景、同一断言、同一交互，风险在拼装点不在面数。
## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（首轮）

范围限制：本会话无项目标准档、无文档地图（`docs/README.md` 未在评审上下文中提供）⇒ 文档归属判据降级，只按 `AGENTS.md` 与 §6.28 ↔ §13.19 3-补 的对应关系判。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 需求覆盖 / 可行性 | 🔴 | 覆盖结论与代码相反：设计称「CLI / VSC / server / 桌面 / advisor 经核同一实现自动生效，零端侧分叉」。实读 `thincoder-vscode/src/tools/index.mjs`：`import { bashTool } from "./shell.mjs"` —— VSC 的 `bash` 是独立实现（`thincoder-vscode/src/tools/shell.mjs`，自带 `function applyLineFilter(output, filter) {`，三处输出出口：`terminal === "inject"` ∥ visible ∥ 子进程）。grep ∥ execute 确实是核内单实现，bash 不是 ⇒ 受影响文件表漏该档，VSC 端 bash 面今日不被标 | 二选一并写进 §6.28 与本批条目：①受影响文件表加该档并给三出口接线点；②显式声明端侧排除 + 理由（并改掉「零端侧分叉」这句） |
| 2 | 文档归属 | 🔴 | 同一机制的逐字文案两处不同：批档 §2 条目 3 写「N > 0 ⇒ 追加一行「本次输出有 N 行来自过程档 · 不可作依据」」，而 §6.28 写死 `[process doc: N of this output's lines come from process docs — not a design basis]`，并给了取英文的理由「同一行混中英破坏「一词一物」」 | 批档 §2 可就地改：把该格换成 §6.28 的逐字英文串，或明写「逐字见设计档」而不再给出另一种文本 |
| 3 | 受影响文件层级 | 🟡 | 设计只有「**层级结论**：无跨层——判据单源在 `declaration.mjs`（既有），本批只加一个消费点」，讲的是核/端分层；表内「同层」列口径同此。缺代码结构层的结论行 | 补一行结论即可（评审实测：search 251 · bash 295 · bash-async 282 · execute 238 行，均未越 500，无一越层，无需拆分计划） |
| 4 | 可行性 / 正确性 | 🟡 | 后台径基准写死为 `ctx.cwd`：「`entry` 现无 `cwd` 字面——`launchBgTask` 建 entry 处补记 `cwd: ctx.cwd` 一行」。该档真正传给 spawn 的是 `const cwd = ctx?.cwd ?? parent.cwd`；`ctx.cwd` 缺省时记进 entry 的是 undefined，解析基准随之为 undefined | 补记 spawn 实际用的那个 `cwd` 局部值，不另取 `ctx.cwd` |
| 5 | 分支来源（6b） | 🟡 | 两条分支未给场景：①出辖（祖先链无 manifest）；②「**解析上限 500 个不同 token / 次**——超界后的行不溯源、不打标」——后者既无读数也无复现路径，验收 1–13 里也无对应行，而它使「能判定就标」在长输出上静默失效 | 500 上限给一条可复现读数（命令 + 输出行数）或删掉该上限分支；出辖分支补一句场景或并入「解析不到 ⇒ 不动」的同一句 |
| 6 | 验收 | 🟡 | 验收 1–13 全是断言句，未给可跑的入口；RTM 两行只写「证据档 = `test/integration/grep-process-doc-mark.test.mjs`」，本批没有一条 `node --test <档>` 形态的验收命令 | 在 §6.28 验收段末写死本轮实施要跑的档与调用形（改动面测试档；无单测档就写实际跑过的检查与读数） |
| 7 | 需求对应 | 🟡 | 设计称「需求档（父侧已定稿）」零改，而 §13.19 的验收只有①②③（提示词两分法 ∥ 跨仓命中 ∥ 无矛盾），无一条判 3-补 的输出面打标 ⇒ 需求层机判看不见本批行为，13 条判据只活在设计档 | 二选一：需求侧补一条机判验收（父侧裁），或明确写「3-补 的验收单源 = 本设计档 §6.28 验收 1–13」 |
| 8 | 既有面零改 | 🔵 | 验收 2 要求非排除档命中「与改动前逐字节相同」，新增调用面可能破它：`thincoder-core/declaration.mjs` 的 `loadProjectDeclaration` 有 `console.warn("[declaration] … is not a usable declaration …")`，而 §6.3 记「dispatch console 回显：工具执行期间的 console 输出回显到结果」 | 一句话写明该谓词在工具输出面不许产生 console 噪声（或断言输出前声明已缓存） |
| 9 | 精度 | 🔵 | RTM 12-6 的通过条件原文是「首次零命中（名单合并后三处都被剪）；普通目录那份命中——证明剪枝生效而非搜索坏了」；`(no matches)` 全等与 `/visible\.txt/` 是实现该行的测试档里的断言。设计写「12-6 只判 `(no matches)` 与 `/visible\.txt/`」把两者混为一处 | 改写成「12-6 由 `test/integration/batch-live-batch-lock.test.mjs` 断言 `(no matches)` 全等与 `/visible\.txt/` 子串，与行首位置无关」 |
| 10 | 清晰度 | 🔵 | 新增第 30 节只给了两行表 + 入口 + 证据档，未给该节的「目的 / 节注（回指 ∥ 交互组件 ∥ 进入口 ∥ 三态行序）」，而 RTM 现有各节皆有这一行 | 在 §6.28 的 RTM 增量里补该节节注的写法，或写明实施轮按 RTM 体例补 |

计数：🔴 2 · 🟡 4 · 🔵 4（共 10）。

已核通过项（不列为发现）：

- 判据单源：`isExcludedRelPath(rel, decl, base = null)` 与 §6.28「第三参传 `decl.root`」的理由逐字对得上。
- `execute` 面：六参、裸 stdout、`baseDir = resolveBaseDir(ctx.cwd, args.workdir)`、五条早退行，均与设计所述一致。
- `bash-async` 的 `entry` 字面确无 `cwd` 键；`renderTail` 与 `injectBgResult` 的接缝如设计所写。
- grep 唯一读输出文本的用例确为 `test/integration/batch-live-batch-lock.test.mjs`（`/visible\.txt/` 子串 + `(no matches)` 全等）。
- 装配面：`thincoder-vscode/src/tools/index.mjs`、`thincoder-server/src/agent/chat-env-tools.mjs`、`thincoder-core/advisor/loop.mjs` 确取核 `grepTool`。
- RTM：第 29 节为 CLI 端末节（第 30 节号可用）；12-6 未断言输出行形 ⇒「打破 0 行」成立。
- 最近先例（三问式，`[outside]`）与调研证据行齐备。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 轮次 2 设计评审（验首轮 10 条落地 · 面 = 批档 §2 ∥ `docs/core/design/TOOLS.md` §6.28 ∥ `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19）

| # | 原# | 档 | 严重度 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 1 | TOOLS §6.28 / 批档 §2 | 🔴 | Fixed | 已补第五接线点：TOOLS 标题行「**接线点五处，不是三处**」并给出 VSC `bash` 是端侧独立实现的实证；批档受影响表新增 `thincoder-vscode/src/tools/shell.mjs` 行（「VSC 端 `bash` 两处输出出口接线（visible ∥ 子进程）；`inject` 出口零捕获输出、不接」）；验收 14 覆盖两出口。`inject` 径「零捕获输出」这一前提本席本轮未复读该源档（不在评审面），按设计声明记。 |
| 2 | 2 | 批档 §2 条目 3 | 🔴 | Fixed | 已改成与 §6.28 逐字同一串：「追加 §6.28 写死的逐字串 `[process doc: N of this output's lines come from process docs — not a design basis]`；N = 0 ⇒ 不加」——中英两版并存的矛盾消除。 |
| 3 | 3 | 批档 §2 | 🟡 | Fixed | 已补代码结构层结论行：「**层级结论（代码结构）**：本批无档越 500 行结构层…⇒ 零拆分计划。」结论（无档越 500、零拆分）成立。所列行数（244 / 278 / 249 / 224 / 304）本轮无法复量（源档不在评审面），数值不影响该结论。 |
| 4 | 4 | TOOLS §6.28 / 批档 §2 条目 5 | 🟡 | Fixed | 后台径基准已改为 spawn 实际用的局部值：「建 entry 处补记的必须是**这个局部值**，不另取 `ctx.cwd`」；批档条目 5 同口径（「后台径 = `launchBgTask` 内传给 `spawn` 的 `cwd` 局部值」）。 |
| 5 | 5 | TOOLS §6.28 | 🟡 | Fixed | 上限分支已删并换成三条真实读数：「**不设解析上限**」+ `git ls-files` 2083 行 ∥ 2081 token 等；出辖分支已补场景：「（场景 = 会话锚在无 manifest 的目录里跑检索：家目录 ∥ 临时目录 ∥ `execute` 的 `workdir` 指向树外）」。读数由设计席实跑，本轮未复跑。 |
| 6 | 6 | TOOLS §6.28 / 批档 §5 | 🟡 | Fixed | 已写死可跑入口：「**本轮要跑的检查（改动面，不是全量套件）**：`node --test test/integration/grep-process-doc-mark.test.mjs`」，批档 §5 同句；全量套件仍归父侧收口门，未越红线。 |
| 7 | 7 | 需求 §13.19 | 🟡 | Fixed | 需求侧已补判据：「④ **3-补（输出面打标）的验收单源 = 设计档的验收判据表**」；设计侧「需求侧单源：需求档 §13.19 验收 ④」与之一致，13→14 条判据表即那张表。 |
| 8 | 8 | TOOLS §6.28 | 🔵 | Fixed | 已补「**零 console 噪声**：打标 helper 内零 `console` 调用」段，并说明 `loadProjectDeclaration` 的 warn 前提与夹具不进该径 ⇒ 验收 2 的逐字节断言口径明确。 |
| 9 | 9 | TOOLS §6.28 | 🔵 | Fixed | 已改写为「12-6 的通过条件由 `test/integration/batch-live-batch-lock.test.mjs` 断言 `(no matches)` 全等与 `/visible\.txt/` 子串，与命中行的行首位置无关」——RTM 行文与实现档断言不再混为一处。 |
| 10 | 10 | TOOLS §6.28 | 🔵 | Fixed | 已给第 30 节节注全文（回指 ∥ 交互组件 ∥ 进入口 ∥ 两态行序）。注：该节写「两态」而非既有节的三态体例，本席无法复读 `test/RTM.md` 核对（不在评审面），若 RTM 体例要求三态，需补一行失败态。 |
| 11 | (新) | 批档 §2 §6 关键决策 | 🔴 | New | 上限那条没跟着改：批档现役设计段仍写「解析上限 500 个不同 token / 次，超界不标（安全方向 = 与今天逐字相同）」，而 §6.28 已删掉上限并给了反证：「2081 个不同 token 只是**一份常见输出**的量 ⇒ 任何「几百」量级的帽子都会让这类输出整段静默不标，与本节目的相反。」同一机制两处相反；§2 可就地改，实施席若照 §2 落地就实现了一个 §6.28 明确否掉的帽子，并与验收 9 的 N 对账冲突。修法：把该半句改为「按 token 记忆、无上限」或删除。 |

计数：首轮 10 条 = 2🔴 + 4🟡 + 4🔵 全部落地（Fixed）；新增 🔴 1 条（第 11 条）。

VERDICT: changes-required

### 轮次 3（评审子代理）

**第 3 轮 · 验第 2 轮唯一 🔴 落地**（评审面 = 批档 `2026-11-02-process-doc-hit-tag.md` §2「6. 关键决策」∥ `docs/core/design/TOOLS.md` §6.28「成本与界」段及节注块附近）

| # | 原# | 档 | 严重度 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 2轮#11 | 批档 §2 §6 关键决策 | 🔴 → Closed | Fixed | 上限那半句已落地。批档现文 = 「判定一次调用内按 token 记忆（`Map<token, boolean>`）、**不设解析上限**——理由与实测读数 = 设计档 §6.28「成本与界」；输入量级由工具自身帽子兜住。」——「解析上限 500 个不同 token / 次，超界不标」这一句已不在批档任何位置（全文仅存的 500 字样是 §2 的「500 行结构层」与 §3 记录面里的历史引述）。与 `docs/core/design/TOOLS.md` §6.28「**不设解析上限**——本仓实测三份真实输出」＋「2081 个不同 token 只是**一份常见输出**的量 ⇒ 任何「几百」量级的帽子都会让这类输出整段静默不标」口径一致，且用回指而非复制读数，两处不会再分叉。与验收 9（N 对账）的冲突随之消失。 |
| 2 | (新) | 批档 §2 | 🔵 | Advisory | 「**层级结论（代码结构）**：本批无档越 500 行结构层——本席实量（`Get-Content` 全行数）`search.mjs` 244 · `bash.mjs` 278 · `bash-async.mjs` 249 · `execute.mjs` 224 · `thincoder-vscode/src/tools/shell.mjs` 304」把逐档行数写进了设计档，而这些数已开始漂：本轮实量 `thincoder-core/tools/search.mjs` 末行为第 251 行（写 244）、`thincoder-vscode/src/tools/shell.mjs` 读面报「326 lines total」（写 304）。结论（无档越 500、零拆分）两档皆验成立——251 / 326 均 < 500。 | 层级结论行只留结论（无档越 500 行、零拆分计划），逐档行数删去（读数不属设计档——判据是「有没有越层」，不是「多少行」）。 |
| 3 | 2轮#10 | `docs/core/design/TOOLS.md` §6.28 | 🔵 | Advisory（证据面 unverified） | 节注块「**节注的两态形合 RTM 体例**：`test/RTM.md` 既有节以同一形式记两态（第 19 节 `两态（行序）= 19-1 正常 · 19-2 边界`、第 25 节同形）⇒ 第 30 节两行即两态，不补失败态行」——第 2 轮的疑问已由逐字引文回答，但 `test/RTM.md` 不在本轮评审面，故该对照句本轮 `unverified`。 | 核对 `test/RTM.md` 第 19 / 25 节节注的两态行文与第 30 节节注同形；若体例实为三态，改节注为三态或在第 30 节补一行失败态。 |

计数：🔴 0 · 🟡 0 · 🔵 2（第 2 轮唯一 🔴 = 第 1 条，已 Closed）。

已核通过项（不列为发现）：

- 逐字串单源：批档条目 3「追加 §6.28 写死的逐字串 `[process doc: N of this output's lines come from process docs — not a design basis]`；N = 0 ⇒ 不加」与 `docs/core/design/TOOLS.md` §6.28 本节写死的同一串、`processDocSummary` 的模板逐字一致；helper 注释「N>0 时末尾追加汇总行；N=0 ⇒ 原样返回入参」与之同口径。
- 判据面未受上限删除影响：§6.28「**不设解析上限**」只述量，判据仍是「真解析到盘上同一处」（「纪律：不许按「看起来像路径」打标」＋验收 8 负例），条目 2「解析不到 ⇒ 一个字节不动（误标比不标更坏）」保持。
- `Map<token, boolean>`（命令面，§6.28 成本与界）与 `Map<file, boolean>`（grep 面，判法逐字）两处记忆口径在批档条目 5 与 §6.28 落点表里各归其面，未见混用。
- 「不是门」不变量在批档条目 4 与 §6.28「机制一句话」两处同形，未因加汇总行变为门（验收 9 的 N = 实标行数，非命中集改判）。
- 验收跑法仍为改动面单档：「`node --test test/integration/grep-process-doc-mark.test.mjs`」，全量套件留在父侧收口门——未把发布门写成轮次成本。
- 文档归属：§6.28 就地新增于既有 `docs/core/design/TOOLS.md`，无新档、无跨板搬移；批档 §2 用回指（「理由与实测读数 = 设计档 §6.28「成本与界」」）而非复制读数，两处不会各说各话。
- 最近先例行 / 调研证据行仍齐备（§6.28「**最近先例（三问式）**：`existing:` …」∥「**调研证据行**：仓外声明源 = `index.publicRepos: []` …」），第 2 轮未破。

范围说明：本轮只验第 2 轮新增那一条 🔴 的落地；`docs/core/design/TOOLS.md` 只读 §6.28 及其节注 / 成本与界段。无项目标准档、无文档地图（评审上下文未提供 `docs/README.md`）⇒ 文档归属判据按 `AGENTS.md` 降级判。

VERDICT: pass

## §4 用户批准（主 agent）

**批准依据**：用户 2026-11-02 18:41 逐字「两个都评审吧，然后自动跑完」——同一句覆盖本批与 `#2004`。

**批准时的状态**：

- 设计评审 3 轮（本档 §3）：首轮 changes-required（🔴 2 ∥ 🟡 5 ∥ 🔵 3）→ 第 2 轮 changes-required（新 🔴 1：批档 §2 关键决策仍写「解析上限 500」，与设计档「不设解析上限」相反）→ 第 3 轮 pass。
- 实施完成，实施席自含内部审计 1 轮 + 代码评审 1 轮（pass）。
- 通过后两处设计改动（RTM 节号 30→31 ∥ 接缝行号改符号定位）已由设计席落盘并复核。

**批准范围**：需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.19 条 3-补 全条（用户 18:32 / 18:34「B」/ 18:37「甲」/ 18:38 / 18:41 五裁）。

## §5 实施记录（eng-coder）

## 5. 实施记录（eng-coder · 2026-11-02）

**交付结论**：§2 条目 1–5 全部落地，五处接线点齐备，零超范围改动。终态 = clean（审计 1 轮 · 代码评审 1 轮 · 自修 3 轮）。

### 5.1 改了什么（逐档）

| 档 | 动作 | 落点 |
|---|---|---|
| `thincoder-core/tools/process-doc-mark.mjs` | 新增（134 行） | 导出 `PROCESS_DOC_MARK` · `processDocSummary` · `isProcessDocPath` · `markProcessDocLines`；判据直调 `declaration.mjs` 的 `isExcludedRelPath(abs, decl, decl.root)`（第三参传 root = §6.28 标为唯一易错点的那一处） |
| `thincoder-core/tools/search.mjs` | 改 2 处分支 | 一次调用一个 `Map`，`mark(f)` 前缀命中行与上下文行（`:` 形 ∥ `-` 形同标）；打标在 `truncate` 之前 |
| `thincoder-core/tools/bash.mjs` | 改同步径 | `applyLineFilter` 之后打标，基准 = `ctx.cwd`；`guard.notice` ∥ `hint` 留在标之外 |
| `thincoder-core/agent-tools/bash-async.mjs` | 改两处 | entry 记下传给 `spawn` 的局部 `cwd`（不另取 `ctx.cwd`）；`renderTail` 截帽后再打标，`entry.report` ∥ `injectBgResult` 两个消费点同源 |
| `thincoder-core/tools/execute.mjs` | 改单一出口 | `const body = ok && args.filter ? applyFilter(...) : text` → `markProcessDocLines(body, baseDir)`；失败径同标（去掉 `if (!ok) return` 短路） |
| `thincoder-vscode/src/tools/shell.mjs` | 接两处出口 | visible ∥ 子进程各接一次，基准 = `ctx.cwd`；`inject` 出口零捕获输出、不接 |
| `test/integration/grep-process-doc-mark.test.mjs` | 新增（370 行） | 集成用例 31-1 / 31-2，16 个子用例覆盖 §6.28 验收 1–14 |
| `test/RTM.md` | 新增第 31 节 + 31-1 / 31-2 | 位置 = CLI 端末节之后、`## VS Code 端` 之前（按 RTM 体例带 目的 ∥ 节注 两行与 8 列表头） |

**超范围改动 = 0**：实改 8 档，与 §2 受影响文件表逐行相同；`bash` 之外的 `glob` / `ls` / `doc_search` / `read_history` 零触碰。

### 5.2 逐条交付

| # | 条目 | 状态 | 证据 |
|---|---|---|---|
| 1 | `grep` 输出命中行按档打标，非过程档零字节变化 | ✅ Done | 用例「grep 面：过程档命中带前缀」「上下文两形同标」「`(no matches)` 与 schema 零改」 |
| 2 | 命令面（`bash` 同步 ∥ 后台摘要 ∥ `execute` ∥ VSC 两出口）按行首路径真解析打标 | ✅ Done | 用例「bash 面（核同步）」「bash 后台摘要面」「execute 成功径 ∥ 失败径 ∥ `[stderr]:` 段」「VSC 端 bash 两出口」 |
| 3 | 命令面末尾汇总行：N > 0 追加逐字串，N = 0 不加 | ✅ Done | 用例「N 对账」「N = 0 面逐字节不变」；`grep` 面零汇总行有断言 |
| 4 | 不是门：不拦、不筛、不改命中集、参数面零改 | ✅ Done | 三面 schema 键集全等断言 + 命中行数断言（`lines.length === 3`） |
| 5 | `execute` ∥ `bash` 共用同一 helper，只换拼装点与解析基准 | ✅ Done | `execute` 基准 = `baseDir`（`workdir` 用例专测）；后台径基准 = spawn 局部 `cwd`（后台用例专测） |

### 5.3 验证读数（改动面，不是全量套件）

- `node --test test/integration/grep-process-doc-mark.test.mjs` ⇒ `tests 18 · pass 18 · fail 0`（2026-11-02）。
- 受影响既有面回归：`node --test test/integration/batch-live-batch-lock.test.mjs` ⇒ `pass 6 / fail 0`（12-6 是唯一读 `grep` 输出文本的既有用例）；`node --test test/integration/tester-role.test.mjs` ⇒ `pass 1 / fail 0`（子代理报告读 `bash` 输出）。
- 批内单测档：本批无（判据面由集成用例承载）⇒ 收口无删除物。集成增量 = 打破 0 行 · 冗余 0 行 · 新增 2 行（31-1 / 31-2）。

### 5.4 内部审计（explore，1 轮）与自修

审计 1 轮，四条 🔵 全为判据强度 / 文案漂移，零 🔴 / 🟡：

| 发现 | 处置 |
|---|---|
| 验收 5 的 schema 零新增键只断了 `grep` | 已修：新增子用例断言 `bash` / `execute` 键集全等 |
| 验收 7「行其余部分逐字节不变」在绝对形 ∥ MSYS 形只做 `startsWith` | 已修：改为全等断言（MSYS 形按脚本自己的构造式算期望值） |
| `isProcessDocPath` 的 `cache` 未「缺省自建」，与 §6.28 签名注释不符 | 已修：缺省自建 `Map`，JSDoc 同步 |
| 设计档 §6.28 接缝坐标行号随改动前移 | 不改代码（行号坐标本会随插入行漂移），已在 5.6 记为设计档漂移交父侧 |

### 5.5 内部代码评审（advisor，1 轮）与自修

`type=code` 1 轮，裁定 **pass**（3 🟡 均非必改 + 3 🔵）：

| 发现 | 严重度 | 处置 |
|---|---|---|
| 验收 10 的 `execute` 半面无断言 | 🟡 | 已修：新增「`execute` 面：`filter` 同样按原始行命中」子用例（含 `filter: "^\[process doc"` 的直接反证） |
| 验收 12 的 `[stderr]:` 段无机检 | 🟡 | 已修：新增「`[stderr]:` 段里的过程档路径行同标」子用例（stdout + stderr 双股 + 段头行零变化） |
| RTM 通过结论先于记录（§5 原为空） | 🟡 | 本节即记录；读数见 5.3 |
| 设计档 §6.28 仍写第 30 节 / 30-1 / 30-2（实际第 30 节已被 tester 用例占用） | 🟡 | 设计档不属本席 ⇒ 5.6 交父侧（实现取 31 是对的） |
| 档头自称「单源叶档」不实（静态闭包经判据单源达 `node:sqlite`） | 🔵 | 已修：档头改为「单源小档」并写明依赖链与端壳闭包后果 |
| 出辖用例依赖宿主 `os.tmpdir()` 无 manifest 祖先 | 🔵 | 不改：仓内任何落点都在本仓 manifest 之辖，`os.tmpdir()` 是唯一能造「无档祖先」的落脚点；已在用例里写明这条理由，防后人误改 |

### 5.6 设计档漂移（交父侧路由，eng-designer 的笔）

- `docs/core/design/TOOLS.md` §6.28 的 RTM 增量仍写「第 30 节 / 30-1 / 30-2」及其节注「两态（行序）= 30-1 正常 · 30-2 边界」，而第 30 节在 `test/RTM.md` 已被「读数子代理」占用 ⇒ 实际交付为第 31 节 + 31-1 / 31-2（用例标题同步）。需改的那一侧是设计档。
- 同节「落点（单源，五处共用）」表的接缝坐标（如 `search.mjs` L183–185 ∥ `bash.mjs` L290–292）是插入行前的行号，本批插入打标行后已前移；判据与实现一致，仅坐标漂。

### 5.7 与 §2 的对账

| §2 判据 | §5 交付 | 一致 |
|---|---|---|
| 条目 3 逐字串 = §6.28 写死的那一串 | helper 的 `processDocSummary` 与该串逐字一致，用例全等断言 | 一致 |
| 条目 5 后台径基准 = `launchBgTask` 内传给 `spawn` 的 `cwd` 局部值 | entry 记的正是该局部值 | 一致 |
| 条目 5「`execute` 与 `bash` 共用同一套判据、同一 helper」 | 两面同调 `markProcessDocLines` | 一致 |
| 验收跑法 = `node --test test/integration/grep-process-doc-mark.test.mjs` | 5.3 按此跑，全绿 | 一致 |

**5.8 读数更正（同轮自纠）**：5.1 表里两个行数是我估的，不是量的，按实量更正——

| 档 | 5.1 写 | 实量（`fs.readFileSync(…).split("\n").length`） |
|---|---|---|
| `thincoder-core/tools/process-doc-mark.mjs` | 新增 134 行 | 139 行 |
| `test/integration/grep-process-doc-mark.test.mjs` | 新增 370 行 | 364 行 |

其余四档实量：`search.mjs` 257 · `bash.mjs` 299 · `bash-async.mjs` 287 · `execute.mjs` 241 · VSC `shell.mjs` 330——全部 < 500，§2「零拆分计划」结论不受影响。教训按实：数字不量不写，估出来的数与量出来的数长得一模一样，读到的人分不出来。

## §6 验证与收口（父代理）

### 6.1 交付面（五条目 + 三面）

| # | 条目 | 落点 |
|---|------|------|
| 1 | `grep` 命中行按档打标 | `thincoder-core/tools/search.mjs`（无上下文形 ∥ 上下文两形都在 `truncate` 之前） |
| 2 | 命令面四面 | `thincoder-core/tools/bash.mjs`（同步）· `thincoder-core/agent-tools/bash-async.mjs`（后台摘要，entry 记传给 `spawn` 的局部 `cwd`）· `thincoder-core/tools/execute.mjs`（单一出口，失败径同标）· `thincoder-vscode/src/tools/shell.mjs`（visible ∥ 子进程两出口） |
| 3 | 末尾汇总行（仅命令面） | `processDocSummary`；N = 0 ⇒ 输出逐字节不变 |
| 4 | 不是门 | 不拦、不筛、不改命中集；三面参数面 schema 键集全等 |
| 5 | 判据单源 | `thincoder-core/tools/process-doc-mark.mjs`（新建，四件导出）；判据直调既有 `isExcludedRelPath(abs, decl, decl.root)` |

### 6.2 验证读数（父侧实跑，非转述）

- 集成用例 `test/integration/grep-process-doc-mark.test.mjs`：**18 / 18**（父侧 2026-11-02 19:15 复跑）。
- 受影响的既有面：`test/integration/batch-live-batch-lock.test.mjs` **6 / 6** ∥ `test/integration/tester-role.test.mjs` **1 / 1**。
- **发布门（父侧，全量套件）**：`node test/run.mjs` ⇒ `tests 124 · pass 124 · fail 0 · exit 0`（2026-11-02 19:35 复跑，在所有改动之后）。
- 文档门：`doc_check(mode:"gate")` ⇒ `DOC-CHECK GATE: PASS`（6 档全清）。
- 实施侧另跑：`node --test bench/check/probe.check.mjs` 11/11（含修掉一处改前就红的机检）∥ `node --check` 八档全过。

### 6.3 单测档与集成集

**本批无批档单测档**（起草时定为只用集成面）：改动面的检查 = `node --test test/integration/grep-process-doc-mark.test.mjs`，读数见 §6.2。

**集成集计数**：本批新增 2 行（RTM 第 31 节 · 31-1 四面合例 ∥ 31-2 边界）；现 31 节，窗口约 50–100 ⇒ 在窗内。

### 6.4 未验项与已知边界

- **设计档接缝坐标已全部改为符号 ∥ 逐字代码定位**（行号随插入行漂）；本档不留行号形接缝。
- **`execute` 的后台形不存在**（实读：schema 六参无 `async`），故不为它设摘要接缝。
- **VSC `bash` 的 `inject` 出口不接**（实读：返回固定说明、零捕获输出，没有可标的行）。

### 6.5 收口链检查

- **暂缓批复核**：无。
- **§2 ↔ 设计档对账**：§2 四处的节号已随设计档 30→31 收正（`batch edit`，语义零改）；层级结论已去掉逐档行数（读数不属设计档）。
- **§2 ↔ §5 对账**：§5 记 8 档实改，与 §2 受影响表逐行相同；超范围改动 0。
- **前批遗留**：无（本批自持一行）。
- **用户文档面同步**：新增的标记机制在工具输出面直接可见；`thincoder-core/tool-docs/` 无对应条目需改（标记不是新工具、不是新参数）。
- **台账**：`#2006` 指针指向本档，收口后核销。
