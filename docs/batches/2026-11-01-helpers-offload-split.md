# 2026-11-01 · helpers-offload-split
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 22:19「开」—— 台账条件已成立：`thincoder-core/agent/helpers.mjs` 现盘 501 行 > 500 主动审视线（父侧 22:17 实读）。
> 台账 = #1973（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

- **已定决定**：开本批。 · 用户原话：「**开**」 · 时间：2026-11-01 22:19

### 事实（父侧本轮实读 · 2026-11-01 22:17）

`thincoder-core/agent/helpers.mjs` = **501 行**，越过 `docs/core/design/DOC-DISCIPLINE.md` 的「文件档 `>500` 主动审视」线（同档 `:666` 另注「`.md` 档零尺寸档位义务」）。

阈值判据单源 = 同档 §3.10 族；`>500` 是**主动审视**（不是必须拆），`>800` 才是必须拆。

### 为什么现在做（不是「到点自动做」）

台账原记 `trigger=条件`，复启条件写的是「触碰 `helpers.mjs` 或其行数越 500」。**条件已成立** —— 但它成立的时点不是今天：这档早就贴在 500 线上。**它今天才开工，是因为用户问了。** 这一点如实记下来：**条件触发的债，条件满足了也不会自己开工。**

### 拆点（台账在册，本次复核）

`docs/core/design/TIMEOUT-DIGEST.md` 原登记句：**「拆点 = 把 offload / 预览族整块外移为 `thincoder-core/agent/offload.mjs`（原档保留 re-export，消费面零改），仅此一处」**。

**设计席要先判这三件**：

1. **offload / 预览族到底是哪几个符号** —— 以现盘实读为准，不引历史清单；
2. **re-export 形** —— 原档留 `export { … } from "./offload.mjs"`，**所有既有 import 面零改**（这是本批的硬约束：拆档不得让任何一个消费方改一行）；
3. **501 → 拆后两档各多少行** —— 拆完必须两档都在 500 线内，否则拆了等于没拆。

### 边界（本批不做的面）

- **不改任何行为** —— 纯搬家 + re-export；函数体逐字搬移，零改字；
- **不动 `thincoder-core/agent/` 以外的档**；
- **不顺手清理同档其他问题** —— 碰到就报，不代改。

### 备注（一条已撤的相邻债）

`#1954`（`docs/core/design/AGENT-LOOP-SUBAGENT.md` 过 800 硬限需拆）**已撤回**：对象是 `.md` 设计档，而 800 硬限只管代码档（父侧 22:18 实读该判据原文）。

### 1.1 设计轮上抛四条 · 父侧裁决（2026-11-01 22:24）

**② 先纠一个事实（我自己写错的）：这档不在 501，是 500 —— 恰好压线，没越线。**

本轮实读：`split("\n").length - 1` = **500**（判据口径，同 `docs/core/design/DOC-DISCIPLINE.md` 的 U-2）；`split(/\r?\n/).length` = **501**（读工具行号口径，多算末行）；末字符是换行。**按判据 `>500 主动审视`，500 不触发。**

⇒ **本批性质由此更正**：不是「越线必修」，是**用户已授权的一次主动拆分**（贴线 + 一个 11 符号的族正好成块）。§1 事实段那句「越过 500 主动审视线」按此改为「恰在线上」。**这个错正是 `#1974` 那批在清的东西——同一个量的两种量法，当场又撞了一回。**

**① 那 61 处坐标：不按偏移重算。**

**理由是本批自身正在示范的那条成本**：代码一搬，25 档 61 处同时失效——**这就是「行号作引用」的账单，当场到了。** 按偏移重算 = 把这个成本再付一次，**下一次搬动又得重付。**

**裁决分两段**：

- **本批处理 7 处「指的对象换了档」的**（`docs/core/design/TOOL-OUTPUT-LIMITS.md` 6 + 本设计档 1）——**那不是号漂，是事实变了**（符号搬走了），必须改指新档；
- **其余 54 处不改号**，按长期方向（行号不作引用）走清账队列。**本批与 §6 如实记「已知旧值窗口」并落台账**，不许当它不存在。

**③ 三份 `safeSliceUTF16`：立账，本批不动。** 同一函数三份复本（搬到新档的那份 ∥ `thincoder-core/text-budget.mjs` ∥ `thincoder-core/agent/setup.mjs` 私有复本）——归 `条件` 触发，接笔 = 下次实质触碰这三档之一。

**④ `docs/core/design/TIMEOUT-DIGEST.md` 的 2.4 之后直跳 `## 4.`：只报不改。** 补标题要自拟节名（语义面），不属纯结构收正。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
**本批条目（覆盖）**

| # | 条目 | 判据去向 |
|---|---|---|
| E1 | offload / 预览族整块外移 `thincoder-core/agent/offload.mjs` | 本节 2.1 族清单（10 件）· 验收 A1 / A3 / A6 / A7 |
| E2 | 原档具名 re-export，消费方一行不改 | 本节 2.3 · 验收 A2 / A4 / A8 |
| E3 | 拆后两档都在 500 线内 | 本节 2.4 · 验收 A5 |
| E4 | 对象换了档的活档坐标改指 `thincoder-core/agent/offload.mjs` | 本节 2.6 两桶 · 验收 A9 |

**勘察证据（survey-evidence）**

`index.publicRepos = []`（`PROJECT-MANIFEST.json`）——本仓无公开源仓；公开源面 = 已查、无相关。

仓内状态档查了四处，各有相关，均在本节落地：

- `docs/core/design/TOOL-OUTPUT-LIMITS.md` §2–§6.1——该机制的权威档，落盘族 / 双端预览的全部活坐标住它名下（2.6 的改指清单即对它的逐行实读）；
- `docs/core/design/TIMEOUT-DIGEST.md` §2.2 与 §4 D5——本批设计档，两条分支依据行与 D5 的坐标已改指；
- `docs/core/design/DOC-DISCIPLINE.md` 尺寸档位段——`>500` 主动审视 ∥ `>800` 必须拆的判据源（2.4 引用，不自立口径）；
- `docs/core/design/TESTING.md` 测试两层形态段——单元测试档住批次目录、名随批档（用例档落点引用，不自立口径）。

**既有件三问（本批唯一新名：`thincoder-core/agent/offload.mjs`）**

`none found:` 查过三样：全仓文件名扫 `offload` 命中 1 处且是本批档自身；`thincoder-core/agent/` 现盘 29 个 `.mjs` 无同族名档；同目录的拆分先例（`run-start.mjs` ∥ `turn-loop.mjs` ∥ `chat-call.mjs`，2026-09-29 三拆）同形——原档留 re-export、消费面零改。

最近但不可用的既有件 = `thincoder-vscode/src/agent/run-helpers.mjs`：端侧镜像承载同名同义实现（`:26` `MAX_TOOL_RESULT` · `:35` `safeSliceUTF16` · `:44` `safeSliceUTF16Tail` · `:57` `buildHeadTailPreview`）。**出界理由**：那是双端镜像的端侧一份（落点归 `docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.3），本批写域 = 核侧；把核侧族搬进端壳既违反依赖方向，也与「零行为改动」冲突。

**设计档落点（`docs/core/design/TIMEOUT-DIGEST.md`）**

三处已改指：§2.2 节标题、两条分支依据行（落盘走 `offloadToolResult` 的 `force` 支 ∥ `buildDualEndPreview` 的 ≤16K 形）、§4 D5 的坐标（改为符号锚 `safeSliceUTF16End` ∥ `buildDualEndPreview`，不带行号）。

该档 §2.4 之后的两句现态句（族住哪、谁转口）登记的是**拆分落地后的真值**：以 §5 落地为条件，§6 收口前必须成真；本批撤销或改范围则随之回退。核验点 = A2（三件仍在原档转口）∥ A9（零残留旧坐标）。

**这个窗口只有一个关闭动作 = A9**：§6 时点 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 的 `在位` 表已改指 `offload.mjs` ⇒ 两句成真；A9 未达成而收口 ⇒ 两句回退，并记明回退（不许两句假着收口）。

**锁为什么住批档、不住设计档**：两句本身是状态面真值（住设计档），而「尚未成真 ∥ 撤销即回退」是过程句（住批档）——把窗口写进状态档＝让状态档携带会随收口作废的过程内容，正是状态／过程混写。

### 2.1 族清单（调用关系判族，不看名字）

**判族口径**：族 = 「从两个导出入口可达、且不被档内任何其他符号调用的闭包」。逐符号读调用点，无一处越出该闭包。

| 符号 | 现位（`thincoder-core/agent/helpers.mjs`） | 对外导出 | 档内调用点 | 族外调用方 |
|---|---|---|---|---|
| `offloadToolResult` | `:157`–`:174` | 是 | — | `thincoder-core/agent/dispatch-run.mjs:148` · `thincoder-core/agent-tools/consult.mjs:195` · `thincoder-core/agent-tools/subagent-async.mjs:389` |
| `cleanupOldToolResults` | `:134`–`:151` | 是 | `:161`（族内） | `thincoder-cli/src/tui/clipboard.mjs:6` · `thincoder-core/agent-tools/bash-async.mjs:37` · `thincoder-core/agent-tools/digest-budget.mjs:31` · `thincoder-core/agent-tools/ssh-session.mjs:24` · `thincoder-vscode/src/extension/image-handler.mjs:16` |
| `TMP_RETENTION_MS` | `:80` | 是 | `:146`（族内） | 源码零引用（只在 `docs/core/design/API-CONTRACT.md` 的符号表登记） |
| `TOOL_RESULT_OFFLOAD_LIMIT` | `:36` | 否 | `:158`（族内） | — |
| `TOOL_RESULT_PREVIEW` | `:37` | 否 | `:74`（族内） | — |
| `TOOL_RESULT_PREVIEW_HEAD` | `:38` | 否 | `:72`（族内） | — |
| `TOOL_RESULT_PREVIEW_TAIL` | `:39` | 否 | `:74`（族内） | — |
| `safeSliceUTF16` | `:45`–`:50` | 否 | `:72`（族内） | — |
| `safeSliceUTF16End` | `:56`–`:62` | 否 | `:75`（族内） | — |
| `buildDualEndPreview` | `:71`–`:77` | 否 | `:166`／`:170`（族内） | — |

**十件** = 导出三件 + 私有七件（四常量 ∥ 两把 UTF-16 安全切片 ∥ `buildDualEndPreview`）。搬的两个连续区间 = `:36`–`:80`（45 行）与 `:130`–`:174`（45 行），相对顺序原样保留，函数体逐字搬移。

**为什么同一族（职责面）**：职责 = 一次「把超长正文落到盘上、把注入体压成预览 + 路径」。五件私有件全是这一步的分解：门限常量 → 两端安全切片 → 预览拼装 → 落盘 → 写时自清理。

**为什么同一族（调用面）**：上表八个族外调用方只碰这三个导出，无一碰私有件；私有件的调用点全在族内。

**名字诱饵（明写，防误判）**：`safeSliceUTF16` ∥ `safeSliceUTF16End` 名字像通用文本工具，按名字分族会被留在原档或并进 `thincoder-core/text-budget.mjs`——两者都错。

它们的唯一调用方是 `buildDualEndPreview`（`:72`／`:75`）。同名同义另有两份：`thincoder-core/text-budget.mjs:55`（消费 = `thincoder-core/memory/*`）、`thincoder-core/agent/setup.mjs:32`（私有复本）。

本批不合并不改指这三份——语义面，见上抛。

### 2.2 反向依赖与 import 边

搬出的十件不调用原档任何符号。外部依赖 = `configDir`（`../config.mjs`，仅作 `offloadToolResult` 的默认目录参数）+ `join`（`node:path`）+ 五个 `node:fs/promises` 名（`writeFile` / `mkdir` / `readdir` / `stat` / `unlink`）。新档对原档零入边 ⇒ 不成环。

**两条 import 语句随族走**（三条语句、七个绑定名）：新档自持 `configDir`（1 名）+ 五个 `fs/promises` 名 + `join`（原档多处仍在用，两边各持一份）。

**使用点逐名对上（现盘实读）**：`configDir` 唯一使用点 = `:157`（默认参数）；`fs/promises` 五个名 = `readdir` `:138` · `stat` `:145` · `unlink` `:146` · `mkdir` `:162` · `writeFile` `:164`（五名五处，页内 `join` 是同行的另一个 import，不计数）。拆后原档两条 import 语句成死引用，删。

**包级静态闭包不变**：新档增一条 `→ ../config.mjs` 静态边，原档同日失去同一条（`thincoder-core/config.mjs` 不 import 任何 `agent/` 档——grep 该档 `helpers.mjs|agent/` 只命中一条注释）。端壳静态闭包不增。

### 2.3 re-export 形：具名清单

```js
export { offloadToolResult, cleanupOldToolResults, TMP_RETENTION_MS } from "./offload.mjs"
```

**先例（对齐，不新造形）**：`thincoder-core/agent.mjs:30` 逐字 = `export { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "./agent/helpers.mjs"`；同一先例的另一半 = 该档 `:22` 注记的 2026-09-05 拆分（「agent.mjs 530 > 500 硬限」⇒ 迁出一族 + re-export 保 import 面）——与本批同形同事由。

**设计档一侧的判据小节** = `docs/core/design/PORTABILITY.md` §2：该节把「权威迁移（谓词换源，不设 re-export——只留一个导入路径）」与「结构重构（纯搬迁拆分，**保留转口 re-export**）」分开，本批属后者。

**不取 `export *`**：转口面 = 恰好这三件；`export *` 让新档将来的任何内部导出无声扩到原档面上，把「零改的 import 面」变成一条会自己变宽的边。

**私有七件不导出**：搬后仍在 `offload.mjs` 内私有，搬前搬后可见性逐件相等。

### 2.4 行数与几何

**新档布局（行号为设计约定，实施按此排）**：档头注释 3 行（`:1`–`:3`）→ 三条 import（`:4`–`:6`）→ 空行 → 区间一 45 行（`:8`–`:52`）→ 空行 → 区间二 45 行（`:54`–`:98`）。

| 档 | 拆前 | 拆后 | 500 线 |
|---|---|---|---|
| `thincoder-core/agent/helpers.mjs` | 500 | 407 | 内（余量 93） |
| `thincoder-core/agent/offload.mjs` | 新 | 98 | 内 |

**算式**：原档 500 − 90（两区间）− 2（两区间各连带删其后一个空行，即 `:81` ∥ `:175`）− 2（删两条 import）+ 1（加一行具名 re-export）= 407。新档 = 3 + 3 + 1 + 45 + 1 + 45 = 98。**只删这两个连带空行**——原档 `:118`–`:119` 本就是双空行（与本批无关），顺手做一次全局空行归并会量出 406，A5 按 407 判红。

**量法（A5 用同一量法）**：`node -e "const t=require('fs').readFileSync(P,'utf8');console.log(t.split('\n').length-1)"`——即 `\n` 计数。同口径下 §1.1 ② 判原档 500 未越 `>500`。read 工具行号口径 = 该数 + 1（末行空位）⇒ 408 ∥ 99，两口径都不触线。

**映射规则（预备，不作判据）**：原 `n ∈ [36,80]` ⇒ 新 `n − 28`；原 `n ∈ [130,174]` ⇒ 新 `n − 76`。改指坐标一律**取自实档读数**（A9 的核法），映射只用于事前预判。

### 2.5 验收（逐条指回批次条目）

| # | 指回 | 判据（机判） |
|---|---|---|
| A1 | E1 · E3 | `node --check thincoder-core/agent/helpers.mjs` 与 `node --check thincoder-core/agent/offload.mjs` 均 exit 0 |
| A2 | E1 · E2 | 符号集守恒：改前先跑 `node -e "import('file:///<abs>/thincoder-core/agent/helpers.mjs').then(m=>console.log(Object.keys(m).sort().join(',')))"` 存快照，改后同命令 ⇒ 两串逐字相等；另断言 `offload.mjs` 的导出键集恰 = `TMP_RETENTION_MS,cleanupOldToolResults,offloadToolResult` |
| A3 | E1 | 搬移零改字，**基线 = 实施前工作树快照**（实施第一步把原档复制到批次临时区，不信 `git show HEAD`——工作树可能有未提交改动，HEAD 会把正确搬移判红、错误搬移判绿）；**按内容锚切片**：段一 = 从 `const TOOL_RESULT_OFFLOAD_LIMIT` 起、至 `const GIT_TIMEOUT_MS` 前；段二 = 从 `cleanupOldToolResults` 的 JSDoc 头（`/**` 起、首句 `Best-effort write-time self-cleanup`）起、至 `// 失败冷却 v1` 前——**锚必须落 JSDoc，不能落 `export async function cleanupOldToolResults`**（实读 2.1 区间 `:130`–`:174`，函数声明在 `:134`，`:130`–`:133` 是随族搬走的四行 JSDoc；按函数行切片会漏那四行，正确实现判红）；两段各 trimEnd；**双向断言**：新档全文自 `const TOOL_RESULT_OFFLOAD_LIMIT` 起 === 段一 + `\n\n` + 段二 + `\n`（逐字节），且**改后的 `thincoder-core/agent/helpers.mjs` 不含上述任一段**（原档留副本 ⇒ 红；基线快照按定义恒含两段，不作断言对象） |
| A4 | E2 | §5 消费面零改：`git status --porcelain` **在 §5 时点**只出现 `thincoder-core/agent/helpers.mjs`（改）· `thincoder-core/agent/offload.mjs`（新）· 本批档 · 本批单元测试档 · `docs/core/design/TIMEOUT-DIGEST.md`；多出第二条消费方路径 ⇒ 红。`docs/core/design/TOOL-OUTPUT-LIMITS.md` 不写进本白名单是有意的：它在 §5 落地后才由设计席改（2.6 表 · D7），§6 时点才作为第六条出现，判据归 A9——写进来就等于允许 eng-coder 改设计档 |
| A5 | E3 | 两档各 `≤ 500`，量法 = §2.4 的 `\n` 计数命令，期望 407 ∥ 98 |
| A6 | E1 | 行为等价：`offloadToolResult` 四形（短文原样返回 ∥ 超 64K 双端预览 + 路径 + 落盘全量 ∥ `force` 短文落盘且正文恰一次 ∥ 不可写目录回落正文 + `offload to disk failed`）；`cleanupOldToolResults` 删旧留新、子目录不动；`TMP_RETENTION_MS === 259200000` |
| A7 | E1 | 无死 import，**锚到 import 行 ∥ 整标识符**（子串匹配会把 `readdirSync` / `status` 命中，把正确实现判红）：`helpers.mjs` 内 `/^import .*\.\.\/config\.mjs/m` 命中 0、`/^import .*node:fs\/promises/m` 命中 0、`\bconfigDir\b` 命中 0；`offload.mjs` 内前两条各命中 1、`\bconfigDir\b` 命中 2——import 行 1（`import { configDir } from "../config.mjs"`）∥ 使用点 1（默认参数 `join(configDir, "tool-results")`） |
| A8 | E1 | 端壳静态闭包零增：`thincoder-vscode/src/extension/image-handler.mjs:16` 逐字零改（经 `helpers.mjs` 转口即可达三件） |
| A9 | E4 | 坐标改指（§5 落地后由设计席做），判据分主辅两条：**主判 = 枚举**——2.6 桶一清单逐条改指到 `thincoder-core/agent/offload.mjs` 的实档行（符号名对得上，行号取自实档）；**辅判 = 路径形 grep**——`grep -n "helpers\.mjs:" <该档>` 的输出去掉含 `run-helpers` 的行后，在 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 与 `docs/core/design/TIMEOUT-DIGEST.md` 均命中 0（改前读数：前者 11 行命中 · 后者 0 行）。**为何 grep 只是辅判**：裸 `:N` 记号（`safeSliceUTF16End` 后的 `:56`、`buildDualEndPreview` 的 `:72`–`:76`）前面不带档名，任何 `helpers.mjs:` grep 都看不见它 ⇒ 只有逐条枚举能判「这个号现在指到哪」。**为何要排掉 `run-helpers`**：该档 §6.3 的五个 `thincoder-vscode/src/agent/run-helpers.mjs:NN`（`:25` `:56` `:97` `:167` `:196`）含同一子串，它们是端壳镜像档（2.6 口径已排除），不排掉则判据永远到不了 0 |

单元测试档 = `docs/batches/2026-11-01-helpers-offload-split.test.mjs`（`node --test docs/batches/2026-11-01-helpers-offload-split.test.mjs` 跑绿；随批删）。断言只落行为与结构机检（命名空间相等、子串等体、四形行为），不读文档正文断句。

**集成设计（delta 口径 · `test/RTM.md`）**：无一行被改写、无冗余行、无新增行。理由：本批不改任何业务可观察结果；offload 族是内核机制面，端侧可观察量（报告可回溯、长结果可读）的断言口径一字不变，且 `test/RTM.md` 现无一行以「符号住哪个档」为判据。

### 2.6 受影响文件 + 档位结论 + 坐标两桶

| 文件 | 动作 | 执行席 / 时点 |
|---|---|---|
| `thincoder-core/agent/offload.mjs` | 新建（十件 + 三条 import + 档头注释） | eng-coder · §5 |
| `thincoder-core/agent/helpers.mjs` | 两区间外移 + 删两条 import + 加一行具名 re-export | eng-coder · §5 |
| `docs/batches/2026-11-01-helpers-offload-split.test.mjs` | 新建，随批删 | eng-coder · §5 |
| `docs/core/design/TIMEOUT-DIGEST.md` | §2.2 标题 ∥ 两条依据行 ∥ D5 坐标改指（已落） | 设计席 · 本轮 |
| `docs/core/design/TOOL-OUTPUT-LIMITS.md` | 11 行 19 处 + 2 处无号改指（清单见下） | 设计席 · **§5 落地后**（坐标取自实档，非按偏移算） |

**为什么该档排在 §5 之后**：代码落地前算出的新行号是纸面推演，正是本批要清的那种债；落地后从实档读，读数即事实。设计档改指归设计席（设计档不归 eng-coder），故 A4 的白名单不含它，A9 单列一档判据。

**坐标清单与计数口径（两桶）**

- 口径：逐行左→右扫，每个 `:N` ∥ `:N-M` 记号归属**其左侧最近的 `*.mjs` 路径记号**；归属键 = `thincoder-core/agent/helpers.mjs` 的全路径形 ∥ 裸 `helpers.mjs` ∥ `agent/helpers.mjs` 续接形。`thincoder-core/mcp/helpers.mjs` ∥ `thincoder-vscode/src/agent/run-helpers.mjs` 是别的档，不计。
- 射程：仓内活档——`docs/**` 去 `batches/**` 与 `_archive`、文件名不含 archive，加各包 `.mjs` ∥ `.js`。
- 读数（本席本轮 `node` 实算 · 2026-11-01）：**85 处 / 60 行 / 19 档**。含 1 处误归属：`docs/core/design/PROMPT-SYSTEM.md:741` 的 `:57-60` 实指 `thincoder-core/agent/setup.mjs` 侧新增消费点（同行最近的路径记号恰是 `agent/helpers.mjs`，实际不指它）⇒ 两桶都不计。

**桶一（对象换了档 ⇒ 本批改指）= 在盘 19 处 / 11 行 / 1 档 + 2 处无号**：

- `docs/core/design/TOOL-OUTPUT-LIMITS.md` 19 处 / 11 行 + 2 处无号（`:13` 节标题的 `（thincoder-core/agent/helpers.mjs）`；`:31`「`helpers.mjs` 内两个同义函数」）：`:30`（`:45` `:56`）· `:35`（`:157`）· `:37`（`:36`）· `:41`（`:159`）· `:45`（`:80` `:161` `:167`）· `:53`（`:168` `:172`）· `:84`（`:36`–`:39`）· `:85`（`:80`）· `:86`（`:45` `:56`）· `:87`（`:71`）· `:88`（`:157` `:134` `:161`）；
- `docs/core/design/TIMEOUT-DIGEST.md` 2 处 / 1 行（D5 的 `:57` ∥ `:72`–`:76`）——**本席本轮已改指符号锚**（`safeSliceUTF16End` ∥ `buildDualEndPreview`），故不在上面的在盘读数里；记这一行是说明它属同一桶。

**桶二（号漂 ⇒ 已知旧值窗口）= 65 处 / 48 行 / 18 档**：坐标所指符号仍在原档，只是行号因两区间外移而整体前移。本批**不按偏移重算**（§1.1 ① 裁决：行号不作引用，重算即把这笔成本再付一次）——推「触碰即以实读改正」，并请父侧落台账（见 2.8）。**这个数是活读数**：并发批次正在改其中几档，明天量出来会不同——台账行携规则，不携这个数。

**档位结论**：无一档跨档。拆后两档 407 ∥ 98，均 `≤ 500`（非 `> 500`，不进主动审视）。函数档判据 `≥300` 触及即判：新档最长函数 = `offloadToolResult`（18 行）；原档最长函数 `repairHistory` 不在本批搬移区间内，其行区间随 §5 前移（按桶二口径此处不记号）；两档无函数触及该线，不需要拆分计划。

**本批新建的单元测试档**（`docs/batches/2026-11-01-helpers-offload-split.test.mjs`，随批删）同列在 2.6 受影响表，档位结论一并判：预期远低于 500（体量 = A2 符号集 ∥ A6 四形行为 ∥ A8 端壳零改三类断言）；**§5 落地后用 2.4 的同一量法量一次，§6 按该读数核**（不按预算数核）。

### 2.7 关键决策（含被拒选项）

| # | 决策 | 被拒选项与理由 |
|---|---|---|
| D1 | 族 = 调用关系闭包（十件，两区间） | 按名字分族——把 `safeSliceUTF16` 一族留在原档则原档仍 ≈ 455 且掉不出一条清晰的边；按「名字里有 offload」挑，会拆开真正耦合的一组 |
| D2 | 具名 re-export（三件） | `export *`——转口面会自己变宽；逐件 `export const x = offload.x`——两处名字与两份绑定，`thincoder-core/agent.mjs:30` 已给具名形 |
| D3 | 搬两个连续区间 + 收相邻空行 | 整档改成纯 barrel——原档所有坐标同时作废（170 处），代价最大；只搬导出不搬私有件——私有件留在原档即新档要反向 import，成环 |
| D4 | 新档自持三条 import，原档删无用 import | 让原档保留 import 供新档用——跨档取 import 面 = 隐式耦合 |
| D5 | 本批零行为改动 | 顺手把三份 `safeSliceUTF16` 合成一份——语义面 + 跨子系统（`memory/*`）写域，另批 |
| D6 | 不留「拆分后的单文件最大」读数句 | 把行数写回设计档——行数属过程面，读数随下次改动立刻旧；批档记过程，设计档只记「族住哪、谁转口」 |
| D7 | 坐标改指分两步：代码（§5）→ 设计档（§5 后） | 一步完成（实施时同改 `docs/core/design/TOOL-OUTPUT-LIMITS.md`）——代码落地前只能按偏移表算，纸面号又是一次推演；两步则从实档读，且不把设计档写权压给 coder |
| D8 | 新档不留原行号注释 | 保留 `// was helpers.mjs:157` 一类注——历史不进状态面，git 已有 |

### 2.8 上抛项（待父侧裁）

**① 桶二的台账行** —— 本席无台账写权。请父侧落一行（建议 `trigger=条件`，复启条件 = 「触碰该档即按实读改正号」），并在 §6 记明这是已知旧值窗口。桶二的范围与读数只住 2.6（本节不复述数字——复述即第二份会漂的抄本）。本席的判：不按偏移重算（§1.1 ① 已裁「行号不作引用」）；重算 = 同一笔成本再付一次，且下次搬动又失效。

**② 三份 `safeSliceUTF16` 并存（报不改）** —— 三处 = `thincoder-core/agent/offload.mjs`（本批从 `thincoder-core/agent/helpers.mjs` 搬入的那份，符号 `safeSliceUTF16`）· `thincoder-core/text-budget.mjs:55`（同名导出，memory 子系统用）· `thincoder-core/agent/setup.mjs:32`（第三份私有复本）。三份注释自认同义；合并 = 语义面 + 跨写域，本批不动。

### 2.9 评审落点（§3 轮次 1 · 十条 → 本节位置）

| 评审 # | 落点 |
|---|---|
| 1 🔴 A3 | 2.5 A3 重写：基线改实施前工作树快照、内容锚切片、双向断言 |
| 2 🔴 范围 | 2.6 表加 `docs/core/design/TOOL-OUTPUT-LIMITS.md` + 逐行清单（在盘 19 处带号 + 2 处无号，另 2 处已在 D5 落掉）；A4 判 §5 时点、该档归 A9（D7）；已裁的「同批扫∥另批」待裁项删除 |
| 3 🟡 件数 | 全文改 10（E1 ∥ 2.1 表十行 ∥ 2.1 结句 ∥ 2.6 表「十件」）；设计档该句本就按十数，无需改 |
| 4 🟡 文档态 | 设计档落点段：删「物件已实现」的理由，改记「以 §5 落地为条件 ∥ 撤销即回退 ∥ §6 前必须成真」 |
| 5 🟡 坐标 | 2.6 写明计数口径 + 两桶 + 桶一逐行清单；D5 两处已改符号锚；桶二落 2.8 上抛 |
| 6 🟡 A7 | 2.5 A7 改行锚 + 整标识符正则 |
| 7 🟡 勘察 | 本节新增「勘察证据」段（`index.publicRepos = []` + 四处仓内状态档） |
| 8 🟡 三问 | 本节新增「既有件三问」段（`none found:` + 查过三样 + VSC 同形件出界理由） |
| 9 🔵 数值 | 2.2 改「三条语句、七个绑定名」；2.4 按增量重算 407 ∥ 98；A5 写明量法 |
| 10 🔵 坐标 | 2.1 逐符号表重排（`_PREVIEW` ∥ `_TAIL` 同在 `:74`，`_HEAD` 在 `:72`）；2.2 五个名五处 |

### 2.10 评审落点（§3 轮次 2 · 八条 → 本节位置）

| 评审 # | 落点 |
|---|---|
| 1 🔴 A3 | 2.5 A3 段二锚改为 `cleanupOldToolResults` 的 JSDoc 头（`/**` + `Best-effort write-time self-cleanup`），并写明不能锚 `export async function` 行（`:130`–`:133` 是随族搬的四行 JSDoc） |
| 2 🔴 A3 | 2.5 A3 第二半主语改为「**改后的** `thincoder-core/agent/helpers.mjs` 不含任一段」；基线快照恒含两段，明写不作断言对象 |
| 3 🔴 A9 | 2.5 A9 重写：枚举为主判、路径形 grep 为辅判、写明裸 `:N` 盲区、写明 `run-helpers` 排除理由与改前读数（11 行 ∥ 0 行） |
| 4 🟡 A7 | 2.5 A7 的 `offload.mjs` 侧 `\bconfigDir\b` 期望 1 → 2（import 行 ∥ 默认参数各 1） |
| 5 🟡 档位结论 | 2.6 档位结论补本批单元测试档一行：同法量、§6 按读数核 |
| 6 🟡 文档态 | 设计档落点段补「窗口唯一关闭动作 = A9」+「锁为何住批档、不住设计档」 |
| 7 🔵 数值 | 本节末两段：2.6 两桶复点为唯一读数、§1.1 初读已被取代 |
| 8 🔵 先例 | 2.3 先例段补设计档小节坐标 `docs/core/design/PORTABILITY.md` §2 |

**两套数的处置（🔵 7）**：§1.1 ② 的「本批 7 处 ∥ 其余 54 处」是**初读**（全路径单形态扫、无计数口径）；2.6 的「桶一 19 处 + 2 处无号 ∥ 桶二 65 处」是**按 2.6 口径的复点**（三形态归属 + 误归属点名排除）。两者不一致时**以 2.6 为准**；§1 是 append-only 讨论段，不回改——其初读由此句标记为已被取代。

**同档一处顺手收正（非评审条目）**：2.6 档位结论段里 `repairHistory` 原带的 `:287`–`:333` 行号区间已删——那是本批搬移前的编号，搬后必漂，按桶二口径不重算 ⇒ 只留符号名，不留号。

### 2.11 A9 坐标改指落地（设计席 · 2026-11-01）

**状态**：A9 完成。`docs/core/design/TOOL-OUTPUT-LIMITS.md` 13 行（11 行带号 / 19 处记号 + 2 处无号）全部改指 `thincoder-core/agent/offload.mjs`。

**改指前后逐条**（改后行号 = 本轮实读实档，未用 2.4 的映射表推算）

| 档行 | 改前（`helpers.mjs`） | 改后（`offload.mjs`） | 实档锚（该行原文首段） |
|---|---|---|---|
| `:13` 节标题 | 无号 `thincoder-core/agent/helpers.mjs` | 无号 `thincoder-core/agent/offload.mjs` + 转口一句 | — |
| `:30` | `:45` ∥ `:56` | `:17` ∥ `:28` | `function safeSliceUTF16(text, max) {` ∥ `function safeSliceUTF16End(text, max) {` |
| `:31` | 裸 `helpers.mjs` | 裸 `thincoder-core/agent/offload.mjs` | — |
| `:35` | `:157` | `:81` | `export async function offloadToolResult(` |
| `:37` | `:36` | `:8` | `const TOOL_RESULT_OFFLOAD_LIMIT = 64 * 1024` |
| `:41` | `:159` | `:83` | `if (!force && !overLimit) return text` |
| `:45` | `:80` ∥ `:161`–`:167` | `:52` ∥ `:85`–`:91` | `export const TMP_RETENTION_MS` ∥ 清理调用 → 双端预览 + 路径提示语 |
| `:53` | `:168`–`:172` | `:92`–`:96` | `} catch {` … `offload to disk failed]` |
| `:84` | `:36`–`:39` | `:8`–`:11` | 落盘阈值 + preview 四常量块 |
| `:85` | `:80` | `:52` | `export const TMP_RETENTION_MS` |
| `:86` | `:45` ∥ `:56` | `:17` ∥ `:28` | 两把 UTF-16 安全切片 |
| `:87` | `:71` | `:43` | `function buildDualEndPreview(text) {` |
| `:88` | `:157` ∥ `:134` ∥ `:161` | `:81` ∥ `:58` ∥ `:85` | 落盘主函数 ∥ 清理函数 ∥ 清理调用 |

**A9 主判（枚举）读数**：19 处记号逐条落在实档行上（上表 11 行），无一处按偏移推算；2 处无号同步改指。

**A9 辅判（路径形 grep）读数**：`helpers\.mjs:` 在本档命中行 **16 → 5**；改后 5 行全含 `run-helpers`（`docs/core/design/TOOL-OUTPUT-LIMITS.md` §6.3 端壳镜像面，按判据排除）⇒ **0**。`docs/core/design/TIMEOUT-DIGEST.md` 改前 0 → 改后 **0**。

**2.11-a 一处内容增补（报备，父侧可删）**：`:13` 节标题除改指外多一句「`thincoder-core/agent/helpers.mjs` 以具名 re-export 转口同名三件——既有 import 面零改」。
理由：改指后本档不再提 `helpers.mjs`，而消费方仍从它导入，读者会读到两处描述相反。该句只把 §2.3 已定的转口形放到读者需要的位置，不带新语义。

**2.11-b A4 量法替换登记（父侧已认可）**：2.5 A4 的字面白名单按字面做不到（工作树有二十余批并发改动），实施改「改前 / 改后 `git status --porcelain` 取差集，增量恰三条」。实质不变（消费面零改），只换量法；**2.5 那行字面以本行为准**。

**2.11-c 转口位置 = 本席裁决**：具名 re-export 落 `thincoder-core/agent/helpers.mjs:9`（import 块末），不放族原位。三条理由：

- 族原位插入会净增 2 行（`export` 紧贴 `const GIT_TIMEOUT_MS`，要空行即再多一行）⇒ 408 ≠ 2.4 的 407 ⇒ A5 判红；
- import 块末借用原有空行 ⇒ 净增 1 行 ⇒ 407，与 2.4 算式一致；
- 同形先例 `thincoder-core/agent.mjs` 的转口亦紧接 import 区。

**2.11-d 评审 🔵3 不采纳**（给 `helpers.mjs:9` 加缘由注释）：加注即 407 → 408，与 2.4 算式、A5 判据同时冲突。位置与先例已定，注释非必须。

**2.11-e 2.4 映射规则未作判据**：`n − 28` ∥ `n − 76` 本轮只用于事后对照，所有改指行号取自实档读数。

**残留**：桶二（号漂窗口）按 §1.1 ① 裁决不改号，台账行见 2.8 ①，待父侧落。

## §3 设计评审（评审子代理）
**状态行**：评审通过（第 3 轮：上轮 8 条（🔴3 · 🟡3 · 🔵2）全部关闭，无新增 🔴）



### 轮次 1（评审子代理）

设计评审 · helpers.mjs offload 族外移（2026-11-01）

**已验证为正确（非条目）**
- 族闭包成立：两区间十个声明在档内无第二调用方；`configDir` 无第二用户，五个 `fs/promises` 名只族内使用。
- 名字诱饵判对：`safeSliceUTF16` 三份复本（`thincoder-core/text-budget.mjs` 一份供 `memory/*`、`thincoder-core/agent/setup.mjs` 一份私有）。
- 先例逐字在盘：`thincoder-core/agent.mjs` 的 `export { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "./agent/helpers.mjs"` + 2026-09-05 注。
- 500/501 口径更正为真；档位结论（无一档跨档）成立；集成 delta 用了唯一合法理由，未写全套跑。

| # | 类别 | 严重度 | 问题（摘要） | 建议（摘要） |
|---|------|--------|--------------|--------------|
| 1 | 验收 A3 | 🔴 | HEAD 不是改前基线：正确搬移判红、错误搬移判绿 | 基线改用实施前工作树快照；按内容锚切片；双向断言 |
| 2 | 范围 / 受影响文件 | 🔴 | 裁定的 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 不在受影响表，A4 白名单反而禁改 | 折进 §2：表 + 白名单 + 删已答上抛 + 旧值窗口落账 |
| 3 | 需求 / 清晰度 | 🟡 | 族记作 11，实为 10；设计档新句按十数 | 定一个数，另一档对齐 |
| 4 | 文档归属 / 文档态 | 🟡 | 两句新写按当下真值，但新档尚不存在 | 保留两句，锁在 §5 落地后；撤销则回退 |
| 5 | 范围（⑤ 坐标裁决） | 🟡 | 清单不可复现；裸形态 `helpers.mjs:NN` 逃出射程；D5 两处未改指 | 写明计数口径，按两形态重出清单，只分两桶 |
| 6 | 验收 A7 | 🟡 | 子串匹配把 `readdirSync` / `status` 命中，正确实现判红 | 锚到 import 行 / 整标识符 |
| 7 | 方法（勘察证据） | 🟡 | §2 无 survey-evidence 行 | 补该行（无相关也写 none relevant） |
| 8 | 方法（既有件三问） | 🟡 | 新档名无三问答复 | 补 `none found:` + 查过什么 + VSC 同形件 |
| 9 | 清晰度（数值） | 🔵 | 「四条 import」与三条不符；≈409/≈99 算不出；A5 不点量法 | 按增量重算；A5 写量法 |
| 10 | 清晰度（坐标） | 🔵 | 三名映号错位；五个名给了六个数 | 逐名对上各自使用点 |

**逐条细节**

1 🔴 验收 A3。原文「取 `git show HEAD:…helpers.mjs` 的 `:36`–`:80` 与 `:130`–`:174`，按单空行相接，断言新档全文包含该拼接串（逐字节）」。
- 工作树有未提交改动时 HEAD 不是改前文本：正确搬移（抄工作树字节）判红；错误搬移（抄 HEAD、丢掉未提交改动）判绿。
- 切片还按 HEAD 的 `:36`/`:130` 取位，仅在行布局相同时成立；「包含」单向——原档留副本仍过，只靠 A7 的 import 检查兜。
- 建议：基线改为实施前工作树字节快照（拷一份或取两段哈希）；按内容锚切片（`const TOOL_RESULT_OFFLOAD_LIMIT` 起至 `const GIT_TIMEOUT_MS` 前；
  `export async function cleanupOldToolResults` 起至 `offloadToolResult` 末）；同时断言新档包含 ∥ 原档不含。

2 🔴 范围。§1 裁「- **本批处理 7 处「指的对象换了档」的**（`docs/core/design/TOOL-OUTPUT-LIMITS.md` 6 + 本设计档 1）」。
- 该档不在 §2.6 受影响文件表（只有 `thincoder-core/agent/offload.mjs`／`thincoder-core/agent/helpers.mjs`／`docs/core/design/TIMEOUT-DIGEST.md`／测试档）。
- 也不在 A4 白名单（「`git status --porcelain` 只出现 …helpers.mjs（改）· …offload.mjs（新）· 本节所在批档 · 本批单元测试档 · …TIMEOUT-DIGEST.md」）。
- ⇒ 实施者要么漏做裁定要求，要么做对却挂 A4。
- 「6」不可复现：该档至少十一行带指向搬家区间的坐标。例：「双端切片（本档私有实现）… `thincoder-core/agent/helpers.mjs:45`、`safeSliceUTF16End`（`:56`）」；
  「| 落盘阈值 + preview 四常量 | `thincoder-core/agent/helpers.mjs:36`–`:39` | 在位 |」；
  「| 落盘主函数 + 写时自清理 | `thincoder-core/agent/helpers.mjs:157`（`offloadToolResult`）· `:134`（清理函数）· `:161`（清理调用） | 在位 |」。
- §2.8 ① 仍把问题重开（「我的判：**同批扫**」）⇒ §2 既未落裁定的 7，也未落自己的 61。
- 落地后本设计档写「offload / 预览族住 `thincoder-core/agent/offload.mjs`」，该档「在位」表仍指 `thincoder-core/agent/helpers.mjs`——同一机制两处活描述。
- 建议：受影响文件表加入该档并逐条列出改指处（按该档重数一遍）；A4 白名单同步加入；删已被回答的 §2.8 ①；54 处落成旧值窗口 + 台账行。

3 🟡 族件数。三处记 11：E1「族 11 件」· §2.1「11 个符号；搬的两个连续区间 = `:36`–`:80`（45 行）与 `:130`–`:174`（45 行）」· §2.6「族 11 件 + 四条 import」。
- 区间内实为十个声明：四常量 ∥ 两把切片 ∥ `buildDualEndPreview` ∥ `TMP_RETENTION_MS` ∥ `cleanupOldToolResults` ∥ `offloadToolResult`。
- 设计档新句自己按十数：「导出面三件 = … ；档内私有件 = 落盘门限四常量 + `buildDualEndPreview` + 两把 UTF-16 安全切片」。
- 区间具体、搬移不歧义，但「几件」正是后来核验者要对的数。建议：定一个数，另一档对齐，逐符号表作枚举单源。

4 🟡 文档态。两句按当下真值陈述，此刻不真：「offload / 预览族住 `thincoder-core/agent/offload.mjs`：…」与
  「`thincoder-core/agent/helpers.mjs` 以具名 re-export 转口同名三件——所有既有 `import … from "…/helpers.mjs"` 逐字零改」。
- 新档尚不存在（全项目 glob `**/offload*.mjs` 零命中）；`thincoder-core/agent/helpers.mjs` 尚未转口。
- 同形见 `docs/core/design/TIMEOUT-DIGEST.md` 的 §2.2 标题（「### 2.2 报告落盘（`thincoder-core/agent/offload.mjs` `offloadToolResult` + `subagent-async.mjs` 注入点）」）与两条已改指依据行。
- 关于删除本身：删「拆点 = … 仅此一处」**方向正确**——拆分落地后待拆登记即规范性面上的死工单，「族住哪、谁转口」才是耐久事实。
- 错的只是时态/时点：理由「其物件已实现」在落笔时不为真。建议：保留两句并锁在 §5 落地后；批次撤销则回退；§6 收口前必须成真。

5 🟡 ⑤ 坐标裁决。裁决用词「54 处不改号 … 本批与 §6 如实记「已知旧值窗口」」；§2.6 又把 54 定义成
  「须按偏移表重算的 54 处（`−46` 段 30 处 / 12 档，`−92` 段 24 处 / 14 档）」——对象已搬走的坐标不能「重算」，只能改指。
- 「61 / 25 档」未写计数口径（占位 / 行 / 实例），不可复现：裁定点名的档实为至少十一行，不是 6。
- 漏裸形态：`docs/core/design/TIMEOUT-DIGEST.md` 的 D5 写「`buildDualEndPreview` 对 ≤16K 正文头尾各返整串（`helpers.mjs:57`、`:72-76`）」；
  `:57` 在已搬的 `safeSliceUTF16End` 块内、`:72-76` 在已搬的 `buildDualEndPreview` 块内，两者都是「对象换了档」。
- 而本档被计为「只有 1 处」且 D5 未动；以全路径形态（`thincoder-core/agent/helpers.mjs:NN`）作键的 sweep 看不见该行。
- 建议：写明计数口径，按两形态（全路径 ∥ 裸 `helpers.mjs:NN`）重出清单，只分两桶：「对象换了档 ⇒ 改指新档（本批）」与「号漂 ⇒ 旧值窗口 + 台账行」。D5 那两处属第一桶。

6 🟡 验收 A7。原文「无死 import：`helpers.mjs` 内 `configDir` 与 `writeFile|mkdir|readdir|stat|unlink` 命中 0」。
- 子串匹配把正确实现判红：原档仍有 `entries = readdirSync(cwd, { withFileTypes: true })` 与 `children = readdirSync(join(cwd, e.name))…`（被 `readdir` 命中）。
- 同档 `composeGitContext` 有「const dirty = status ? status.split("\n").length : 0」等多处 `status`（被 `stat` 命中）；追红者可能顺手删无关的 `readdirSync`。
- 建议：判据锚到 import 行 / 整标识符（`^import .*node:fs/promises`、`\bstat\b`）。

7 🟡 勘察证据。§2 无 survey-evidence 行——没有一句说查了哪些公开源、有无相关内容。
- 答案很可能为 none relevant（`docs/core/design/TIMEOUT-DIGEST.md` 自己记着 `index.publicRepos = []`），但 none 必须落纸才能与「没查」区分。建议：§2 补该行。

8 🟡 既有件三问。本批引入一个新名——档 `thincoder-core/agent/offload.mjs`——无三问答复（`existing: …` ∥ `none found: …` ∥ `existing but unusable: …`）。
- 实质答案在评审侧：全项目无 `offload*.mjs`；最近的既有件是 `thincoder-core/agent/helpers.mjs` 本身与 VSC 侧 `run-helpers.mjs` 的落盘实现（设计未列后者为已勘候选）。
- 建议：补一行 `none found:` + 查过什么，并点名 VSC `run-helpers.mjs` 同形件为已考虑、出界（或说明为何不构成候选）。

9 🔵 数值。§2.4「新档 = 90 + 档头注释 1 + import 4 + 区间之间空行 1 + 收尾空行 = ≈ 99」，而 §2.2 只列三条 import 语句（`configDir` ∥ 五个 `fs/promises` 名 ∥ `join`），却写「新档自持这四条 import」。
- 原档「≈ 409」未计它删掉的两条 import 与加的一行转口（501 − 92 + 1 − 2 ≈ 408）。
- A5「两档行数各 `≤ 500`（同一口径量两次）」未点命令，而本批 §1.1 ② 改的正是这个口径歧义。档位结论两个方向都不受影响。
- 建议：按增量重算；A5 写明量法（如 `split("\n").length - 1`）；「四条 import」改回三条。

10 🔵 逐符号坐标。§2.1 把 `TOOL_RESULT_PREVIEW ∥ …_HEAD ∥ …_TAIL` 映到「`:72`／`:74`／`:75`」。
- 实际：`_HEAD` 在 `safeSliceUTF16` 调用处；`_TAIL` 与 `TOOL_RESULT_PREVIEW` 同在 `tailLen` 那行；第三个数是 `safeSliceUTF16End` 的调用处。
- 同区间 import 行写「五个 `fs/promises` 名唯一使用点 = `:138`／`:145`／`:146`／`:162`／`:163`／`:164`」——五个名给六个数（一个是 `const file = join(…)`，不用任何 `fs/promises` 名）。
- 实质（两条 import 边无第二用户）成立。建议：逐名对上各自使用点。

**直接回答两问**
- ①：边界判对、诱饵点对——件数是 10 不是 11（第 3 条）。
- ⑤：裁决方向（不按偏移重算）成立，账单是真的（无关档里已有偏 2–4 行的旧坐标）；但范围画得不够：清单不可复现、裸形态逃出射程、裁定点名的档整档不在受影响文件表（第 2、5 条）。
- `docs/core/design/TIMEOUT-DIGEST.md` 那句：删得对，替身句的真值提前了（第 4 条）。

**计数**：🔴 2 · 🟡 6 · 🔵 2（共 10 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

设计评审 · helpers.mjs offload 族外移 · 第 2 轮（核验口径：判据不重开，只核上轮 10 条改了没有 + 两问）

**核验表（上轮 10 条 → 本轮判定）**

| 上轮 # | 条目 | 判定 | 本轮实读依据 |
|---|---|---|---|
| 1 🔴 | A3 基线 | **未过**（新 🔴 见本轮 1、2） | 基线改工作树快照、内容锚、双向断言三件都已落纸；但段二起点锚与搬移区间不符，且双向断言第二半主语写错 |
| 2 🔴 | 受影响表 / A4 | **过**（偏离采纳） | `docs/batches/2026-11-01-helpers-offload-split.md` 2.6 表列该档为「设计席 · §5 落地后」；A4 白名单不含它并写明理由；A9 单列判据。原实质缺陷（该档整档不在受影响表）已消 |
| 3 🟡 | 件数 | **过** | E1「（10 件）」· 2.1 表十行 · 2.1 结句「十件 = 导出三件 + 私有七件」· 2.6 表「十件」四处一致 |
| 4 🟡 | 文档态两句 | **过**（余 🟡 见本轮 6） | 「设计档落点」段已改「以 §5 落地为条件，§6 收口前必须成真；本批撤销或改范围则随之回退」 |
| 5 🟡 | 计数口径 / 两桶 | **过** | 2.6 口径 + 射程 + 读数 + 两桶齐备；按该口径实读 `docs/core/design/TOOL-OUTPUT-LIMITS.md`，11 行 19 记号逐条对得上（`:13` `:30` `:31` `:35` `:37` `:41` `:45` `:53` `:84`–`:88`；`:36`–`:39` 记两个记号） |
| 6 🟡 | A7 行锚 | **部分过**（余 🟡 见本轮 3） | 行锚与整标识符已改；`offload.mjs` 内 `\bconfigDir\b` 期望 1 与实况不符 |
| 7 🟡 | 勘察证据 | **过** | 「勘察证据（survey-evidence）」段在册：`index.publicRepos = []` + 四处仓内状态档 |
| 8 🟡 | 既有件三问 | **过** | 「既有件三问」段 `none found:` + 查过三样 + VSC 同形件（`thincoder-vscode/src/agent/run-helpers.mjs`）出界理由 |
| 9 🔵 | 算式 | **过** | 407 ∥ 98 按增量复算成立；118–119 双空行实读成立，406 的警示有效 |
| 10 🔵 | 逐名坐标 | **过** | 2.1 档内调用点与 `thincoder-core/agent/helpers.mjs` 实读一致：`:72` `_HEAD` 与 `safeSliceUTF16` · `:74` `_PREVIEW` 与 `_TAIL` · `:75` `safeSliceUTF16End` · `:166`/`:170` `buildDualEndPreview`；2.2 五名五处 `:138` `:145` `:146` `:162` `:164` |

**本轮发现**

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 验收 A3 | 🔴 | 段二起点锚 `export async function cleanupOldToolResults` 在 `thincoder-core/agent/helpers.mjs` 实为 134 行，而 2.1/2.4 的搬移区间是 `:130`–`:174`；130–133 是被一起搬走的 JSDoc。按 A3 断言，正确实现（含 JSDoc）在新档里多 4 行 ⇒ 判红 | 段二起点锚改为「`cleanupOldToolResults` 的 JSDoc 起」（或锚 `Best-effort write-time self-cleanup`），与 2.4 的 45 行区间对齐 |
| 2 | 验收 A3 | 🔴 | 双向断言第二半「且快照原档不含上述任一段」主语错：快照按定义就是改前原档，恒含两段 ⇒ 任何实现都判红 | 主语改为「改后的 `thincoder-core/agent/helpers.mjs` 不含任一段」 |
| 3 | 验收 A7 | 🟡 | `offload.mjs` 内 `\bconfigDir\b` 期望命中 1 不成立：新档自持 `import { configDir } from "../config.mjs"` 1 处 + 默认参数 `join(configDir, "tool-results")` 1 处 ⇒ 正确实现命中 2 | 期望改 2，或拆成「import 行 1 ∥ 使用点 1」 |
| 4 | 验收 A9 | 🔴 | `grep -n "helpers\.mjs:"` 在 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 命中 0 不可达：该档 §6.3 的 `thincoder-vscode/src/agent/run-helpers.mjs:25` `:97` `:56` `:167` `:196` 五处含子串 `helpers.mjs:`；这也与本档 2.6 自己的口径（「`run-helpers.mjs` 是别的档，不计」）相反 | 判据改为 `thincoder-core/agent/helpers\.mjs:` ∥ `agent/helpers\.mjs:` ∥ 排除 `run-helpers\.mjs:` 的裸 `helpers\.mjs:`；裸 `:N`（如 `:56`）任何 `helpers.mjs:` grep 都看不见，须写明「逐条落在实档行上」才是主判据 |
| 5 | 档位结论 | 🟡 | 2.6「档位结论」只量了两份 `.mjs`；受影响表里的 `docs/batches/2026-11-01-helpers-offload-split.test.mjs`（新建单元测试档）无档位结论 | 补一句该新档的预期量级，或写明「新档，§5 落地后同法量一次」，使 §6 可核 |
| 6 | 文档态 | 🟡 | `docs/core/design/TIMEOUT-DIGEST.md` 的两句现态句此刻不真（新档尚不存在），而同机制在 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 仍写「在位 = helpers.mjs」；锁定条件只写在批档，不在设计档内 | 保留两句；§6 收口前 A9 必须使其成真（不成真则回退并记明）——这是该窗口的唯一关闭动作 |
| 7 | 数值 / 记录 | 🔵 | 同一批档内两套数并存：§1.1 ②「本批处理 7 处…其余 54 处不改号」vs 2.6「桶一 19 处 + 2 处无号 ∥ 桶二 65 处」 | 在 2.9 或 §6 记一句「以 2.6 的重数为准，§1.1 的 7/54 为初读」，不改 §1（append-only） |
| 8 | 方法 | 🔵 | closest-precedent 行给了实现坐标（`thincoder-core/agent.mjs:30` + 该档 2026-09-05 拆分注记），但未点名对应的设计档小节 | 补一个设计档小节坐标即可 |

**两问答复**

① 桶二做成活读数、不入状态档、只入台账规则：**对**。
- 数的生命周期短于规则：台账行的复启条件是「触碰该档即按实读改正号」，不含数。
- 读数只留 2.6 一处，标了日期与「活读数」，§2.8 明写不复述 ⇒ 没有第二份会漂的抄本。
- 加法自洽已核：85 = 19 + 65 + 1（误归属）；60 = 11 + 48 + 1；19 档 = 桶一 1 + 桶二 18。
- 唯一要守的：§6 别把这个数当「当前值」引用——§2.8 已写明，照做即成立。

② 归属规则「逐行左→右，`:N` 归其左侧最近的 `*.mjs` 路径记号」：**已收敛，不是同一个病**。
- 上轮批评的是「同一个量几套不可比的形 + 无口径」，不是扫法本身。
- 本轮：一条口径写死 + 三个归属键收进同一键 + 同名别的两档当场排除 + 1 处误归属点名排除（不是把规则改宽）。
- 按此口径复算该档清单，11 行 19 记号全部对得上，口径可复现。
- 残余风险（一行两路径）在桶一侧由 A9 的逐档查询兜——前提是 A9 的 grep 先修好（本轮 4）。

**计数**：🔴 3 · 🟡 3 · 🔵 2（共 8 条；上轮 10 条中 8 条通过，1 条部分通过，1 条未过）

VERDICT: changes-required

### 轮次 3（评审子代理）

设计评审 · helpers.mjs offload 族外移 · 第 3 轮（只核上轮 8 条：🔴3 · 🟡3 · 🔵2；判据不重开，不挖新问题）

**核验表（上轮 8 条 → 本轮判定）**

| 上轮 # | 条目 | 判定 | 本轮实读依据 |
|---|---|---|---|
| 1 🔴 | A3 段二锚 | **过** | 2.5 A3 现文「段二 = 从 `cleanupOldToolResults` 的 JSDoc 头（`/**` 起、首句 `Best-effort write-time self-cleanup`）起、至 `// 失败冷却 v1` 前」，并写明「函数声明在 `:134`，`:130`–`:133` 是随族搬走的四行 JSDoc」。与 `thincoder-core/agent/helpers.mjs` 实读对齐：`/**` 在 130，131 逐字 `Best-effort write-time self-cleanup: delete files in dir whose mtime exceeds TMP_RETENTION_MS.`，134 是函数声明 ⇒ 按新锚切片得 130–174 共 45 行，与 2.1/2.4 的 45 行区间逐行同长 |
| 2 🔴 | A3 第二半主语 | **过** | 现文「且**改后的 `thincoder-core/agent/helpers.mjs` 不含上述任一段**（原档留副本 ⇒ 红；基线快照按定义恒含两段，不作断言对象）」——主语已换成改后原档，恒红句消除，「原档留副本」这条真拦得住 |
| 3 🟡 | A7 `configDir` 计数 | **过** | 现文「`\bconfigDir\b` 命中 2——import 行 1（`import { configDir } from "../config.mjs"`）∥ 使用点 1（默认参数 `join(configDir, "tool-results")`）」。该档现盘 `configDir` 恰两处（`import { configDir } from "../config.mjs"` ∥ `dir = join(configDir, "tool-results")`），无第三处 ⇒ 搬后新档 2、原档 0 两边都判得出 |
| 4 🔴 | A9 grep 不可达 | **过** | 已拆主判（枚举 = 2.6 桶一清单逐条落到实档行）+ 辅判（路径形 grep 去掉含 `run-helpers` 的行）。本轮实读 `docs/core/design/TOOL-OUTPUT-LIMITS.md`：`helpers\.mjs:` 命中 16 行 = 桶一 11 行 + `run-helpers` 5 行（`:25` `:56` `:97` `:167` `:196`），且那 11 行无一含 `run-helpers` ⇒ 排掉后 = 11（与「改前读数 11 行」相符），改指后 0 可达；`docs/core/design/TIMEOUT-DIGEST.md` 同命令本轮命中 0（「后者 0 行」成立）。裸 `:N` 盲区已写明并归主判 |
| 5 🟡 | 档位结论漏新档 | **过** | 2.6 末段「**本批新建的单元测试档**…同列在 2.6 受影响表，档位结论一并判：预期远低于 500…**§5 落地后用 2.4 的同一量法量一次，§6 按该读数核**（不按预算数核）」——预算值与实测值已分开 |
| 6 🟡 | 文档态窗口 | **过** | 「**这个窗口只有一个关闭动作 = A9**：…A9 未达成而收口 ⇒ 两句回退，并记明回退」+「**锁为什么住批档、不住设计档**」两段在册。两句现态句（`offload / 预览族住 `thincoder-core/agent/offload.mjs``、`以具名 re-export 转口同名三件`）仍按落地后真值陈述，属 R7e 报而不拦，关闭动作唯 A9 |
| 7 🔵 | 两套数 | **过** | 现文「§1.1 ② 的…是**初读**…；2.6 的…是**按 2.6 口径的复点**…两者不一致时**以 2.6 为准**；§1 是 append-only 讨论段，不回改——其初读由此句标记为已被取代」 |
| 8 🔵 | 先例 | **过** | 2.3 补「设计档一侧的判据小节 = `docs/core/design/PORTABILITY.md` §2」。该节实读：「**射程区分**：本句纪律的对象 = **权威迁移**面（谓词换源——只留一个导入路径）；**结构重构**面（纯搬迁拆分）**保留转口 re-export**」+「对照：`messages.mjs` 拆分面**保留 re-export**（结构重构 ≠ 权威迁移）」⇒ 先例选得对，本批属后者 |

**随轮一处（`repairHistory` 行区间已删）** = 删得对：2.6 档位结论现文「原档最长函数 `repairHistory` 不在本批搬移区间内，其行区间随 §5 前移（按桶二口径此处不记号）」，只留符号名不留号——搬后必漂，且与桶二「不重算」口径一致。

**计数**：🔴 0 · 🟡 0 · 🔵 0（上轮 8 条全部关闭：🔴3 全过 · 🟡3 全过 · 🔵2 全过；另有 1 处已知旧值窗口按 R7e 报而不拦）

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**批准对象**：`thincoder-core/agent/helpers.mjs` 的 offload / 预览族十件外移为 `thincoder-core/agent/offload.mjs`，原档具名 re-export、消费面零改；附带 `docs/core/design/TOOL-OUTPUT-LIMITS.md` 的坐标改指。

**批准依据链（全部在盘可查）**：

| 环节 | 事实 |
|---|---|
| 设计评审 | 三轮；第 3 轮 `VERDICT: pass`（上轮 8 条全部关闭：🔴 0 · 🟡 0 · 🔵 0） |
| —— 轮次块 | 批档 §3 的 `### 轮次 3（评审子代理）`，含核验表 + 计数 + VERDICT |
| —— 签字 | §3 状态行 = `评审通过` |
| 授权凭据 | 评审结算回执 `Approved. Pass this exact token to eng-coder` —— **凭据值按纪律不入档** |
| 用户批准 | 用户原话「**自动跑完**」（2026-11-01 23:20，整批令）与更早的「**开**」（22:19）；本批全链在该授权范围内 |

**批准范围**：设计档 §2 所述十件搬移 + 具名 re-export + 坐标改指。**评审遗留项零**（第 3 轮 🔴 0 / 🟡 0 / 🔵 0）。

**批准前后的次序如实记**：本批设计面在评审前已落盘（§2.9 / §2.10 / §2.12 三轮边判边落），与 D1 的全链次序（设计 → 评审 → 批准 → 落笔）不符。**记录在案，不追认**——批准人看到的是 §2.12.8 列出的「可回退项 = 无」。

## §5 实施记录（eng-coder）

**状态行**：实施完成

### 5.1 交付摘要

三档落地。新档 `thincoder-core/agent/offload.mjs` = 98 行；原档 `thincoder-core/agent/helpers.mjs` 500 → 407 行；本批单元测试档 = 190 行，随批删。

十件逐字搬移，原档留具名 re-export，八个族外消费方一行未动。零行为改动。

### 5.2 验收逐条读数

| # | 判据 | 读数 |
|---|---|---|
| A1 | 两档 `node --check` | `helpers.mjs` exit 0 · `offload.mjs` exit 0 |
| A2 | 符号集守恒 | 改前快照 39 名（存 `.thincoder/tmp/2026-11-01-helpers-offload-split/a2-preimage.txt`），改后同命令逐字相等；`offload.mjs` 键集恰 = `TMP_RETENTION_MS,cleanupOldToolResults,offloadToolResult`；三件在 helpers 侧与 offload 侧为同一函数对象（活绑定） |
| A3 | 搬移零改字 | 双向断言两半均 true（跑法见 5.3） |
| A4 | 消费面零改 | `git status --porcelain` 改前/改后取差集，增量恰 3 条：`M thincoder-core/agent/helpers.mjs` · `?? thincoder-core/agent/offload.mjs` · `?? docs/batches/2026-11-01-helpers-offload-split.test.mjs`；删除项 0 条 |
| A5 | 两档行数 | 按 §2.4 的 `\n` 计数：`helpers.mjs` 407 · `offload.mjs` 98，与期望逐数相等，两档均 ≤ 500 |
| A6 | 行为等价 | `node --test docs/batches/2026-11-01-helpers-offload-split.test.mjs` → tests 11 · pass 11 · fail 0。四形 ∥ 清理两例 ∥ 常量值全绿 |
| A7 | 无死 import | `helpers.mjs` 三条各命中 0；`offload.mjs` 前两条各 1、`\bconfigDir\b` 2（import 行 ∥ 默认参数） |
| A8 | 端壳静态闭包零增 | 八个消费方逐条实读，specifier 与导入名全在；`image-handler.mjs` 不在 A4 增量内 ⇒ 逐字零改 |
| A9 | 坐标改指 | 不在本席写域（2.6 归设计席 · §5 落地后）。本席已使前提成立：新档存在、原档已转口，坐标可从实档读 |

A6 另跑一次加载冒烟：`dispatch-run.mjs` · `consult.mjs` · `subagent-async.mjs` · `bash-async.mjs` · `digest-budget.mjs` · `ssh-session.mjs` · `agent.mjs` · `clipboard.mjs`（经 `@thincoder/core` 别名）八个入边全部 load OK。

`image-handler.mjs` 需 `vscode` 运行面，plain node 下不可加载；其可达性由单测的 A8 名字解析断言兜。

### 5.3 A3 双向断言怎么跑的

第一步取基线：实施动手前把原档 `fs.copyFileSync` 到批次临时区，逐字节回比确认一致。**不用 `git show HEAD`**（工作树有二十余批并发改动，HEAD 会把正确搬移判红）。

切片按 §2.5 A3 的内容锚，不按行号：段一 = 自 `const TOOL_RESULT_OFFLOAD_LIMIT` 起、至 `const GIT_TIMEOUT_MS` 前，trimEnd；段二 = 自 `cleanupOldToolResults` 的 JSDoc 头（`/**` + 首句 `Best-effort write-time self-cleanup`）起、至 `// 失败冷却 v1` 前，trimEnd。两段各 45 行。

断言两半各一条：

1. 新档全文自 `const TOOL_RESULT_OFFLOAD_LIMIT` 起 === 段一 + `"\n\n"` + 段二 + `"\n"`，逐字节 ⇒ **true**（5264 字节对 5264 字节）；
2. 改后的 `helpers.mjs` 不含任一段 ⇒ **true**（两段的 `includes` 均为 false；族内十个标识符在原档内只剩转口那一行的三个名字）。

### 5.4 决策披露：一处位置选择与一处报不改

**① 转口行位置 = import 块末（原档 `:9`），不是族原位。** 这不是 §2 写明的，是本席按 2.4 的算式选的。

2.4 的两句只钉两件事：新档行布局，与原档算式「500 − 90 − 2 − 2 + **1**」。算式要求净增 1 行。

族原位插一行会给出一处「`export` 紧贴 `const GIT_TIMEOUT_MS`、中间无空行」的形态，要空行就得净增 2 行 ⇒ 408，A5 判红。import 块末正好借用原有的空行 ⇒ 净增 1 行 ⇒ 407。

**代价**：档首的 import 区里混了一条 export 语句。同形先例 `thincoder-core/agent.mjs` 的转口也紧接 import 区（`:21` 收 import、`:30` 是转口）。请父侧在 §6 记明这是本席的位置裁决。

**② 一处旧值注释：报不改。** 搬入的 `safeSliceUTF16` 头注写「与 setup.mjs 的 `safeSliceUTF16` 同语义（两处独立实现…）」，而 2.8 ② 记的是三份（另含 `thincoder-core/text-budget.mjs:55`）。

搬移动的是字节，不是内容——改它就是改字，与 A3 的零改字判据直接冲突。按 §1 边界「碰到就报，不代改」上抛。

### 5.5 自查与评审轮次

| 轮 | 内容 | 结论 |
|---|---|---|
| R1 自修 | 首版把转口放族原位并配一个空行 ⇒ 实量 408 ≠ 设计 407 | 按 5.4 ① 改放 import 块末，复量 407 |
| R2 内审 | 只读分歧审计（对照 §2 的 A1–A9 与文件清单） | `VERDICT: clean` · 0 处分歧。审计侧无 shell 工具，其 A1/A6/A4 三分项标 unverified——本席的运行读数（5.2）补上这三项 |
| R3 评审 | 独立代码评审（三档 + 本批档） | `VERDICT: pass` · 🔴0 · 🟡1 · 🔵4 |
| R4 自修 | 采纳 🔵4（A8 判据锚定）与 🔵5（临时目录 `t.after` 清理） | 两处均在本席写域内、属判据加固而非语义改动；复跑 11/11 绿，`os.tmpdir()` 无残留 |

**终态：clean（收敛）。** 无 🔴，无须再评审轮。

评审 🟡1 的实质（A1/A3/A4/A5 读数要有持久载体）由本段 5.2 与 5.3 落纸即销。

评审 🔵3（建议给 `helpers.mjs:9` 加一行缘由注释）**未采纳**：加了就把 407 变成 408，与 2.4 的期望读数、A5 的判据读数同时冲突。要不要动，是设计席的裁决，不是本席的。

### 5.6 未做与上抛

- **A9 未做** —— 不在本席写域。§2 设计档零触，`docs/core/design/TOOL-OUTPUT-LIMITS.md` 零触。
- **🔵3 未做** —— 见 5.5 末段，需设计席裁。
- **集成面** —— 按 §2.5 的 delta 口径为「无一行改写、无冗余、无新增」，本席未增删 `test/RTM.md`。本批未跑集成套（按测试纪律，集成跑归父侧收口）。
- **`docs/core/design/TIMEOUT-DIGEST.md` 的两句现态句**现已成为真值（新档在盘、原档已转口）；窗口的关闭动作 = A9，仍待设计席。

### 5.7 一处自读数更正

5.1 段写「本批单元测试档 = 190 行」，是本席落笔时未实量的估数。实量（§2.4 同一量法 `split("\n").length - 1`）= **185 行**；读工具行号口径 = 186。

更正以 185 为准。档位结论不变（远低于 500）。此错由本席在交付前复核时发现——估数当读数写进记录，正是本批要清的那类账。

## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

### 6.1 本批交付了什么

把 `thincoder-core/agent/helpers.mjs` 的十件（导出三件 + 私有七件）整块外移为 `thincoder-core/agent/offload.mjs`，原档留**具名 re-export**；八个消费方**一行未改**。附带 A9：`docs/core/design/TOOL-OUTPUT-LIMITS.md` 的 19 处坐标逐条改指新档实档行。

### 6.2 读数（父侧本轮实跑，非转述）

| 项 | 命令 / 口径 | 读数 |
|---|---|---|
| **集成面（收口门）** | `node --test "test/integration/*.test.mjs"` | **tests 94 · pass 94 · fail 0** |
| 单测（收口即删） | `node --test docs/batches/2026-11-01-helpers-offload-split.test.mjs` | **11 / 11 绿**；**该档已按纪律删除**，读数留在此行 |
| 逐字搬移 | A3 双向断言（实施前工作树快照 + 内容锚切片） | 新档自锚起 **=== 段一 + 空行 + 段二 + 换行** → **5264 字节对 5264 字节**；改后原档不含任一段 → 真 |
| 行数 | `split("\n").length - 1` | `helpers.mjs` 500 → **407** ∥ `offload.mjs` **98**；两档均在 500 线内 |
| 坐标改指 | A9 主判（枚举）+ 辅判（路径形 grep） | 主判 **19 / 19** 逐条对上实档行（每条跑探针打印原文）；辅判 `helpers\.mjs:` 命中 **16 → 5（全 `run-helpers`）→ 0** |
| 消费面 | 改前/改后 `git status --porcelain` 差集 | 增量恰 3 条；八个消费方 specifier 与导入名零改；八条入边加载冒烟全通 |
| 文档门 | `doc_check(mode:"gate")` | `DOC-CHECK GATE: PASS` |

### 6.3 两处量法与位置的替换（都已在 §2 登记，不留字面与做法不一致）

- **A4 量法**：字面白名单按字面做不到（工作树有二十余批并发改动，`git status --porcelain` 列出六十余条无关路径）⇒ 改成**改前/改后取差集**，实质不变（消费面零改）。
- **转口位置**：`thincoder-core/agent/helpers.mjs` 的 import 块末（不插族原位）—— 族原位会净增 2 行得 408、A5 判红；import 块末借原有空行净增 1 行得 407，与 2.4 算式一致。同形先例 = `thincoder-core/agent.mjs`。

### 6.4 没做（如实）

- **两个设计 doc 的两句现态句窗口**：A9 已达成本轮（坐标已改指、新档在盘）⇒ 那两句已成真值，窗口**无需回退**。
- **桶二 65 处号漂**：按 §1.1 ① 裁决不改号，落台账 `#1975`（只携规则、不携处数）。
- **`safeSliceUTF16` 三份复本**：搬移动的是字节不是内容，改它会撞 A3 零改字判据 ⇒ 只报不改，落台账 `#1976`。

### 6.5 集成面

本批**不新增、不改写**任何集成用例（理由 = 不改任何业务可观察结果，产品行为零变）。`test/RTM.md` 零改。

### 6.6 收口结论

设计三轮过审、实施一次（含两轮自修 + 一轮内审 + 一轮独立代码评审）、A9 由设计席落、父侧集成面 94/94 绿、单测档已删、两笔债入账。**本批收口。**
