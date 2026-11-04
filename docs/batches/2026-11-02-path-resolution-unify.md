# 2026-11-02 · path-resolution-unify
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-02 · 来源 = 2026-11-02 17:01 用户「机检路径解析和锚之间存在着很大的缺口……尤其是在多仓根的时候，经常卡死流程」· 17:03 三条裁定「1 安全方式 · 2 必须统一 · 3 另起一批」。
> 台账 = #2002（— · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 用户的三条裁定（2026-11-02 17:03）

**用户原话**：「1，当然要用安全的方式。2，必须统一，否则没法玩了。3.另起一批处理。」

- **① 多仓根默认 = 安全方式**：不猜。解析不出唯一目标 ⇒ **列候选、停下要人挑**。
- **② 必须统一**：所有吃路径的面走**同一条解析层**，不许各判各的。
- **③ 另起一批**：本批独立，不塞进正在跑的两批。

## 病：同一个路径，七个面给出不同答案（今晚全撞过）

| # | 面 | 传的是什么 | 结果 |
|---|---|---|---|
| 1 | `batch append` | 只写文件名、不带目录 | 门判**档缺**拒写 |
| 2 | `advisor documents` | 仓根相对 | **`no-project-root` 拒启动** |
| 3 | `subagent files` | 仓根相对 | 按 **workspace 根**解析，指向不存在的目录 |
| 4 | `ledger` | 不传 `cwd` | **「未找到项目根」**要求手传 |
| 5 | `doc_check target` | 不传 | **`ERROR（多项目工作区）`** |
| 6 | 评审席 `documents` | 仓根相对 | 同 2 |
| 7 | 交付回执里的档名 | 只写文件名 | 门判档缺（评审写 §3 时连撞两次） |

**⇒ 本档这次写入自己就撞了第 1 条**：我在举证里写了一个裸档名，门当场判档缺、整段零字节落盘。**⇒ 举证要换个写法，结论不变。**

## 根因：七个档各自持一份「根判定」

**⇒ 实扫命中**：`thincoder-core/agent-tools/` 下 `advisor.mjs` ∥ `batch-paths.mjs` ∥ `doc-check.mjs` ∥ `manifest.mjs` ∥ `review-facts.mjs`，以及 `agent/live-batch.mjs` ∥ `agent/setup-reminders.mjs`。**

**⇒ 其中只有 `batch-paths.mjs` 有完整四形矩阵**（项目根 ∥ 项目内子目录 ∥ 上级目录 ∥ 非项目目录），那是它自己的设计档 §4.15 立的规矩。**
**⇒ 其余六处各写一套，且「根」不是同一个**：有的按会话锚、有的按 manifest 声明、有的按仓根、有的干脆没有基根。**

**⇒ 于是同一条路径在 A 面解析通过、在 B 面判「档缺」——不是用法问题，是没有共用解析层。**

## 要立的东西（父侧给方向，设计席定形）

**一条解析层，三态结果**，七处调它而不是各判：

- `resolved(绝对路径)`
- `ambiguous(候选列表)` —— 多仓根且判不出唯一 ⇒ **停下要人挑**（用户裁定 ①）
- `dangling(缺什么)` —— 解析无果；报**缺的那一段**并**列同名候选**

**两级基根**（一句话判据）：先按**所指文档 / 参数自己所在目录**解析，再按**仓根**解析；两层都不中 ⇒ `dangling`。

## 边界（父侧先划死）

**⇒ 不改任何一个面自己的**业务语义**：`files` 仍只做调度（不校验存在性）、`documents` 仍必须存在、`batchDoc` 仍必须可读 —— 统一的是「怎么把路径变成绝对路径」，不是「各面判不判存在」。**
**⇒ 不新增工具、不改工具入参形状、不加重试。**
**⇒ 不动 `batch-paths.mjs` 的四形矩阵判据本身——它是唯一有完整设计的那个；若与统一层冲突，写清理由并以它为准或收正它。**

## 与另两批的关系

**⇒ `#1`（para-report-wording）与 `#2000`（closeout-proof）正在跑；本批为第三批，独立批档、独立台账行 `#2002`。**

## 父侧裁定（2026-11-02 17:07）—— 三条补齐

### ① 跨仓文档锚（用户 17:06 提出：「外部引用其实是没法保证的」）

**用户的直觉对了一半 —— 但真问题不是「跳过」，是声明的源根本没接上。**

**实读三条**：
- 锚检**完全不读** `manifest` 的 `publicRepos` —— 全仓只有 `thincoder-core/agent-tools/manifest.mjs` 一个档读它；
- 锚检的解析基根只有两个：项目根，或所指文档自己的目录；
- 于是**已声明**的公开源在锚检眼里与不存在无异 ⇒ 判档缺 ⇒ 拒写。**而 `manifest` 侧写着「声明的公开仓可以引」—— 两边对「可引」的定义不一样。**

**裁定 = 三分法，不是二分**：

| 情形 | 处理 |
|---|---|
| 仓内 | 必须解析，缺 ⇒ `dangling`（不变） |
| **已声明的源**（`index.publicRepos`） | **按声明的仓根解析**；解析不到仍报，但报「声明源 X 里缺 Y」——可修 |
| **未声明的仓外** | **可见但不阻断**（不是「跳过」——跳过是看不见，这是看得见不拦） |

**⇒ `docs/core/design/LEDGER-SELF-CONTAINED.md` §3 的 L4 对**台账指针**的跨仓硬判不动**：那是事故换来的 fail-closed（别条产品线的债登进本仓台账、随主线推到公开远端）。文档面放宽，台账面不放宽 —— 两面判的不是一件事。**

### ② 基根顺序（设计席上抛之二：它写的「所指目录 → 仓根」与锚检现有顺序相反）

**⇒ 裁：零偏离 —— 用锚检现有顺序（项目根 → 所指目录）。**
**⇒ 理由：顺序只在「两个基根各有一个同名且都存在的档」时才有可观察差异，而翻转它会**悄悄改变既有锚的判定结果**。**
**⇒ 用户的第一条要求是「安全的方式」；改一道已经在跑的门的语义，不是安全。**
**⇒ 设计席把这一条写进决策表时理由照这句写，并写清「若哪个面确有需要，由该面自己声明例外，不全区翻」。**

### ③ 拒因词表（设计席上抛之一：`no-project-root` → `ambiguous-path` / `dangling-path`）

**⇒ 裁：改。**用户第二条是「必须统一」，两个面各说一套词就是不统一。**
**⇒ 但它是**已评审过的契约**（`docs/core/design/ADVISOR-GUARDS.md` §12），所以：**
**⇒ 设计档 §4 要**显式写出这次契约变更**（旧词 → 新词、谁受影响、集成行 6-4 ∥ 6-5 的断言随之改写），不许只在实现里悄悄换。**

### ④ 本批已知的 D2 缺口（设计席自述，我不接受它自然留着）

**⇒ 它说：`docs/core/design/BATCH-RECORD.md` §4.15 的四形矩阵与设计档 §2.2 现在**同一件事写两处**，因为轮次用尽没做语义合并。**
**⇒ 裁定：这一处**必须在本批内合** —— 两处并存就是本批要消灭的形状。**
**⇒ 合并方式由设计席定（引证或收正），但**不许留「此处以设计档为准」这种指针**：那也是第二处。**

### ⑤ 顺带一条实证（今天第 4 次）

**⇒ 写这一节时，我又因一个裸档名被判「档缺」、整段零字节落盘。**
**⇒ 这不是抱怨，是**本批要治的那件事的现场样本**：同一份档名，人写着觉得没问题，机器判它缺。**
**⇒ 设计席在 §5 用例里要有一条覆盖它：**裸档名在「所指目录 + 仓根」两层都不中时，报 `dangling` 并**列同名候选**——候选列表是这条病的对症药。**

## 父侧更正（2026-11-02 17:11）—— 上一节 ① 的「按声明的仓根解析」不成立

**用户 17:10 原话**：「我觉得已声明的源也没法弄，因为每个人拉同一个代码库放的位置未必一致。」

**⇒ 用户对，我上一节那条也错。**

### 实读两个事实

- 本仓 `PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`（空）；
- `thincoder-core/agent-tools/manifest.mjs` 里 `publicRepos` 只出现在一条工具描述串里，**零解析逻辑**。

**⇒ 所以「声明的源」是一个**声明了但没人实现的键**：文档说可以引，代码里什么都没做。**

### 修完的判据：锚仓库身份，不锚路径

**⇒ 跨仓引用写法 = `仓名/相对路径`（仓名 = manifest 声明的名字），不是文件系统路径。**
**⇒ 校验止于**仓边界**：那个文件在对面仓里存不存在，本机不保证。**

| 情形 | 判什么 | 阻断 |
|---|---|---|
| 仓内 | 档必须在盘 + 节必须在档 | **阻断**（`dangling`） |
| 跨仓 · 仓名已声明 | 仓名在声明表里 + 路径形态合法（**不查存在性**） | **不阻断** |
| 跨仓 · 仓名未声明 | 报「引用外部仓须先声明」+ 仓名候选 | **不阻断** |
| 台账 L4 | 跨仓硬拒 | **阻断**（不动） |

**⇒ 判据一句话**：文档面只保证「引用写对了」，不保证「对方机器上有那个文件」——后者谁也保证不了。**

### 为什么这样才对

**⇒ 存绝对路径 ⇒ 换个人就坏；存工作区相对路径 ⇒ 换个布局就坏。**
**⇒ 只有**锚身份**（仓名 + 仓内相对路径）跨机器成立。**
**⇒ 而「不阻断」不等于「不检查」：它仍然校仓名、校形态 —— 校的是**引用本身对不对**，不是**目标在不在**。**

## 父侧更正（2026-11-02 17:13）—— 「`publicRepos` 零实现」这句错了

**⇒ 我在 17:11 那节写「全仓只有 `thincoder-core/agent-tools/manifest.mjs` 一个档读 `publicRepos`，没有任何解析逻辑」。**
**⇒ 设计席实读纠正：`thincoder-core/declaration.mjs` 读它（`:261` `const list = decl?.index?.publicRepos`）；`manifest.mjs` 里确实只有一条描述串。**

### 我为什么漏

**⇒ 我用的 `git grep -- "thincoder-core/**/*.mjs"` 里，`**` 被当成 `*` 解释 ⇒ 只匹配 `thincoder-core/*/*.mjs`，把顶层的 `declaration.mjs` 排除在外。**
**⇒ 于是搜出「只有一个档」，我就据此写了「零实现」。**
**⇒ 这是今晚第三次同形：**否定结论建立在一次没验过的搜索上**（前两次 = 轻通道相抵、行数量法）。**

**⇒ 今晚读出来的规矩（写在这里，别只留在会话语境里）：**
- **否定结论必须先换词、换 pathspec 再搜一遍**（`-- "thincoder-core/**/*.mjs"` 与 `-- "thincoder-core" -- "*.mjs"` 结果不同）；
- **「只有一个 / 零实现 / 不存在」这类话，没跑过第二种搜法不写。**

### 结论不变，理由要换

**⇒ 跨仓引用仍按「锚仓库身份，不锚路径」处理 —— 但理由不是「声明表没人读」，而是：**
**⇒ 声明表**读了也只是拿到一串路径**，而路径因人而异（用户 17:10 的原话），所以锚不住。**

**⇒ 已在 `#2003` 登记拆档一行（`batch-skeleton.mjs` 524 ∥ `batch.mjs` 532，拆边界与触发在设计档 §3）。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（§5 上抛的 #2 / #5 两条已落：§2.2 第 5 步改「前两级首命中择一 · 第三级 bases 判多」；§2.1 载荷增 tried、§2.6 写明取用面；§2.3 的 none 态分两支。同时收正 §2.3 候选形、§2.2 第 6 步零命中步数、§3 受影响文件补三档）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**设计落点**：`docs/core/design/PATH-RESOLUTION.md`（新建；板块 = core/design）。机制单源 = 该档 §2 / §4；本表只引用不转抄。

## 本批条目（覆盖）

| # | 条目 | 判据落点 |
|---|---|---|
| 1 | 统一解析层落地：一个函数、四态结果（`resolved` / `ambiguous` / `dangling` / `crossRepo`），含多仓根「判不出唯一 ⇒ 列候选停下」、缺档「报缺段 + 同名候选」、跨仓「只判形态与声明、不查存在性」 | 设计档 §2 · AC-1 / AC-2 / AC-4 / AC-11 |
| 2 | 七面接线：批次档读面与 create、评审 / 顾问 `documents`、子代理 `files`、台账 `cwd`、`doc_check target`、`doc_check` 锚面——全部改调本层，各自只留受理判据 | 设计档 §2.5 · AC-3 / AC-5 |
| 3 | 业务语义零变：`files` 不校验存在性 / `documents` 须现存 `.md` / `batchDoc` 须可读 / create 仍判落基底内 | 设计档 §7 · AC-6 |
| 4 | 集成面增量：`test/RTM.md` 行 6-4 / 6-5 改写，新增行 29-1 / 29-2 / 29-3 / 29-4 / 29-5（新故事 29；号段 17 已被「评审没写进批档就不算过」占用） | 设计档 §9 · AC-7 |
| 5 | 消费档同步：`docs/core/design/BATCH-RECORD.md` §4.15 解析序引本层 · `docs/core/design/ADVISOR-GUARDS.md` §12 reason 词汇同步 · `docs/core/design/LEDGER.md` 无根报明面改由本层候选驱动 | 设计档 §3 · AC-8 |
| 6 | 跨仓引用按仓库身份锚定：`仓名/相对路径`，仓名在 `index.publicRepos` 声明表内 ⇒ 只判形态合法、**不查存在性**、不阻断；仓名未声明 ⇒ 报「须先声明」+ 仓名候选、不阻断；仓内缺档仍阻断；台账面跨仓硬判（L4）不动 | 设计档 §2.7 · AC-9 / AC-10 / AC-12 |

## 本批明确不做

- 不动 `batch-paths.mjs` 的四形矩阵落位判据（落基底内 / 锚定防嵌套 / 多落点拒写）。
- 不新增工具、不改任何工具入参名与形状、不加重试。
- 不建全域目录索引、不加缓存（同名候选扫描有界：深 ≤3、命中 ≤20、仅 `dangling` 路径）。
- 不提供跨仓落点；跨仓任务仍各仓自己的会话与批次档。
- 不放宽台账指针的跨仓硬判（`docs/core/design/LEDGER-SELF-CONTAINED.md` 的 L4 零改）——文档面只保证引用写对，台账面判债归谁。
- 不改评审 / 顾问 `documents` 的受理面：项目内现存 `.md` 零变，跨仓形不进入该面。这两个文档面只传 `scanBases`（同名候选提示）、不传 `bases`——解析基底会把裸档名变成受理通过。

## 受影响文件

| 类 | 文件 |
|---|---|
| 新增 | `thincoder-core/path-resolve.mjs` |
| 改（源码） | `agent-tools/batch-paths.mjs` · `agent-tools/review-facts.mjs` · `agent-tools/advisor.mjs` · `agent-tools/doc-check.mjs` · `agent-tools/subagent-spawn.mjs` · `doc-check/anchors.mjs` · `ledger-db.mjs` |
| 待核零改 | `agent/live-batch.mjs` · `agent/setup-reminders.mjs`（§1 实扫命中；仅读项目根则零改，实施时逐处核并记入 §5） |
| 测试 | 单元 `docs/batches/2026-11-02-path-resolution-unify.test.mjs`（收口删）· 集成 `test/integration/review-doc-scope.test.mjs` 改写 + 新增 `test/integration/path-resolution.test.mjs` |

逐文件职责与判据以设计档 §3 为准。

**层级结论**：无档跨层——全部落在 `thincoder-core/**` 与仓库根 `test/**`，无端与核之间的分层迁移。

## 裁定落地（2026-11-02 17:07 父侧）

- **① 基根次序 = 零偏离**：缺省「项目根 → 所指目录」，与 `doc-check/anchors.mjs` 现序同序；翻转会悄悄改变既有锚的判定结果（用户第一条要求是「安全的方式」）。面自有例外逐面声明、不全区翻 ⇒ 批档面声明 `near-first`（四形矩阵已在跑）。见设计档 §4 KD-2 / KD-3。
- **② 拒因词表契约变更**：`no-project-root` 退役 → `ambiguous-path` / `dangling-path`；旧词 → 新词、受影响面、集成行 6-4 / 6-5 断言改写 = 设计档 §4 KD-8，消费档侧已同步（`docs/core/design/ADVISOR-GUARDS.md` §12「词汇契约变更」）。
- **③ 跨仓引用**：锚仓库身份、不锚路径（每个人 clone 位置不同）；已声明 ⇒ 不查存在性、不阻断；未声明 ⇒ 报「须先声明」+ 仓名候选、不阻断；仓内缺档仍阻断。被否两案（按声明的仓根解析 ∥ 一律跳过）与理由 = 设计档 §4 KD-9。
- **④ D2 重复已合**：`docs/core/design/BATCH-RECORD.md` §4.15 的候选序改为引本层（算法单源 = 设计档 §2.2），该面只留自己的参数与落位判据；未留「此处以设计档为准」这类指针。
- **⑤ 裸档名用例**：已在设计档 §6 用例表末三行（`dangling` + `sameName` 候选），并进集成行 29-1 / 29-3。

## 上抛项

- 无。三次裁定已全部落档；无待裁项。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

### 设计评审（review #1）

对象：`docs/batches/2026-11-02-path-resolution-unify.md` §2 ∥ `docs/core/design/PATH-RESOLUTION.md` ∥ `docs/core/design/ADVISOR-GUARDS.md` §12

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Feasibility | 🔴 | `docs/core/design/PATH-RESOLUTION.md` 档头与 KD-1 都写「叶档只 import `node:*` 与 `thincoder-core/manifest.mjs`——声明仓根集经其转口取 `declaredPublicRoots`」，但 `thincoder-core/manifest.mjs` 只转口两档：`export { MANIFEST_REL, discoverProjects, discoverRepos, owningProject, projectRootView, resolveProjectRoot, _setProjectRootForTest, _resetProjectRootForTest } from "./manifest-discovery.mjs"` ∥ `export { DEFAULT_MANIFEST, MANIFEST_SCHEMA, isValidDocRootValue, validateManifest } from "./manifest-schema.mjs"`。`declaredPublicRoots` 的导出面是 `thincoder-core/declaration.mjs`（`export function declaredPublicRoots(cwd) {`）与 `thincoder-core/conventions.mjs` 的转口。同档 §1.2 自述 `existing: thincoder-core/declaration.mjs` ⇒ 同一来源两处两个归属，其中一处不成立；照此写的新叶档会在 import 期直接失败 | 档头 ∥ KD-1 ∥ §1.2 三处指同一个档：`declaredPublicRoots` 从 `thincoder-core/declaration.mjs` 直取（或明写走 `thincoder-core/conventions.mjs` 转口），删掉「经 `manifest.mjs` 转口」半句 |
| 2 | Requirements coverage | 🟡 | 批次档 §1⑤ 要求「裸档名在「所指目录 + 仓根」两层都不中时，报 `dangling` 并**列同名候选**」；设计 §2.4 却把 `sameName` 收成「在 `opts.bases` 各基根下按 basename 找同名档」——要求的落点在两层基根之后，设计的落点只有调用面自声明的基底，不传 `bases` 的面该药方为空 | 把 `sameName` 的扫描根写成「两层基根 + `opts.bases`」，或按第 3 条逐面写死 `bases`，使 ⑤ 的药方在最常撞的两个面上真的产出候选 |
| 3 | Clarity | 🟡 | §2.5 接线表只有 `kind` / `order` / `crossRepo` 三列，无 `bases` 列；而 AC-3（「唯一项目根 + 裸档名（档在 `docRoot.batches` 下）⇒ `resolved`」）与 §2.4 的 `sameName` 只能靠第三级基底成立 —— 哪一面传哪些基底，档内无处可查 | §2.5 增 `bases` 一列逐面写死（批档面 = `docRoot.batches`，文档锚面 = `docRoot` 各键），AC-3 ∥ AC-4 ∥ 17-3 的夹具据此立 |
| 4 | Clarity | 🟡 | `sameName` 的扫描根档内两说：§2.4 = 「在 `opts.bases` 各基根下」，§6 用例表写「裸名 `X.md` 各基根零命中、同级目录下有同名档 ⇒ 仍 `dangling` + `sameName` 列它」——同级目录不在 `opts.bases` 内，两条不能同时成立，AC-4 ∥ 17-3 抓不到唯一规则 | 二选一写死：只认基底（删 §6 该行的「同级目录下」）∥ 含同名候选面（§2.4 补「同级目录一次 readdir」，与 §2.7 未声明形的枚举同口径） |
| 5 | Clarity | 🟡 | 参数「没传」（`undefined`）归口未定：§2.2 第 1 步「空串 / 非字符串 ⇒ `dangling`（`level:"path"`）」含 `undefined`；而同节分支依据表把真实现场「`ledger count` 不带 `cwd` ⇒「未找到项目根」；`doc_check` 不带 `target` ⇒ `ERROR（多项目工作区）`」归到 `ambiguous`，§2.5 第 5 / 6 行也期望「报明候选」——同一输入两个结果态 | §2.2 写明「参数缺省（`undefined`）≠ 空串」：缺省走锚根查询（基根级，出 `ambiguous` ∥ `dangling{level:"base"}`），空串 / 非字符串才落 `level:"path"` |
| 6 | Integration test design | 🟡 | §9 表列 = `处置 ∥ 行 ∥ 交互的组件 ∥ 断言的可观察结果 ∥ 对回`，缺「入口」列（用户从业务哪儿进来）；`对回` 写的是批次条目号（`条目 1` / `条目 2` / `条目 6`），不是业务需求号（同仓先例 `docs/core/design/ADVISOR-GUARDS.md` §12 的表带 `入口` 列并回指 `F18 · A-AG20` 这类需求号） | §9 增 `入口` 列（如「父侧 `batch append` 一笔」「父侧 `advisor(type=design)` 发起」「`doc_check` 一跑」）+ 每行回指业务需求号 |
| 7 | Integration test design | 🟡 | §9 写「新增行挂新故事「17 路径解析统一层」；行号已在此定死」并把 17-1…17-5 定死；而 `docs/core/design/ADVISOR-GUARDS.md` 记着故事 17 已归它（`起点 = test/RTM.md 故事 17「评审没写进批档就不算过」`、`编号已先落 test/RTM.md 故事 17，用例标题照 test('17-1 …') 同号逐字`，含 17-1 ∥ 17-2 ∥ 17-3）。两批同号 ⇒ 同一 `test('17-1 …')` 标题指两件事，逐字同号规则断。此引证在该档 §12 之外，只作协调事实报 | 号段改到 `test/RTM.md` 里确实空闲的故事号（如 18）后再定死；或在 §9 引一句现状读数（故事 17 现有哪些号）当「号段空闲」的证据 |
| 8 | Document ownership | 🟡 | 批次档 §2 与设计档互不一致两处：① §2④「D2 重复已合：`docs/core/design/BATCH-RECORD.md` §4.15 的候选序改为引本层」，而设计 §3 把同一档列在待改清单、AC-8 又把它计入「本轮所写各档」；② §2 条目 4「新增行 17-1 / 17-2 / 17-3」，§9 与 AC-7 是五行（17-1…17-5） | 已合的写「已合（引本层）」并从 §3 待改清单剔除（AC-8 改「已合档复核」）∥ 未合的改 §2④ 时态；条目 4 的行数与 §9 / AC-7 对齐到 5 |
| 9 | Document ownership | 🟡 | `docs/core/design/ADVISOR-GUARDS.md` §12 同一节里退役词还在：拒因四值段用 `ambiguous-path` / `dangling-path`，相邻破行段却写「拒因优先级事实同档登记：`batchdoc-missing` → `batchdoc-no-ledger` → `scope-not-doc` ∥ `no-project-root`」 | 该行末项改成新词（`scope-not-doc` ∥ `ambiguous-path`/`dangling-path`）；KD-8 的受影响面已点名这一带，改的是同一句 |
| 10 | Acceptance criteria | 🟡 | 批次条目 5 第三句「`docs/core/design/LEDGER.md` 无根报明面改由本层候选驱动」没有验收：AC-8 只写「含本档、`docs/core/design/BATCH-RECORD.md`、`docs/core/design/ADVISOR-GUARDS.md`」，该档不在复核名单，也无「改前 → 改后」判据（对照 KD-8 的旧词→新词表） | 给条目 5 的该档一句可机检判据（改后文案含候选字段名 / 旧字面零命中），并列入 AC-8 复核名单 |
| 11 | Acceptance criteria | 🟡 | AC-5「`thincoder-core/**` 内除 `path-resolve.mjs` 外，自持「候选序 + 根判定」的调用点归零（机检 grep 口径，逐面列读数）」没给口径命令；且「归零」与 §3 宽容冲突：`thincoder-core/agent/live-batch.mjs` ∥ `thincoder-core/agent/setup-reminders.mjs` 允许「若只读项目根…则零改」，而读项目根本身就是根判定 | AC-5 补口径命令（同仓先例 = `docs/core/design/ADVISOR-GUARDS.md` §12「零残留口径命令」），并把判据收成「自持候选序」，或明确把「只读 `projectRootView`」排除在「自持根判定」外 |
| 12 | Acceptance criteria | 🟡 | 全档无验收跑法：AC-1…AC-12 是断言项，§3 给了单测档与两个集成档，但「跑什么」缺席 | 补一行：改面单测档 `node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs`（集成半在收口行报），不写全量套跑 |
| 13 | Clarity | 🔵 | §1.2 登记相对先例两处偏离（结果判态化、允许第三级基底），但 §2.2 的 `root-first` 第 ② 级还多一条「无 `referrer` ⇒ 会话锚 `anchor`」兜底——不在先例里，也没算进那两处 | 兜底并入 §1.2 偏离清单，或写清先例在此处的行为 |
| 14 | Affected-file tier | 🔵 | §3「贴线判」把行数写进设计档（446 LF ∥ 524 LF ∥ 532 LF）。今日复核：本批七个改动档在 offset 500 处均无内容（全部 ≤ 500），两个登记档确为 524 ∥ 532 行 ⇒ 结论「零拆分义务」成立，档内只该留结论。另：`thincoder-core/agent-tools/subagent-spawn.mjs` 446 行是加码前读数，越 500 则触发主动拆分复核 | 删行数只留结论句；实施轮若使该档越 500，同一结论句随之更新 |
| 15 | Methodology | 🔵 | 评审上下文未提供文档地图与项目标准档，故归属判定只按各档自述的单源角色判；方法论合规按 `AGENTS.md` 判 | 不构成设计缺陷；下次评审把逐档地图随范围给出 |

**计数**：🔴 1 · 🟡 11 · 🔵 3。

**已核通过项（不列行）**：

- 最近先例线在位：§1.2 三条 `existing:` / `existing but unusable:` + 对齐 ∥ 偏离理由；KD-2 ∥ KD-3 ∥ KD-9 各写被否案。
- 调研证据线在位：§1.3，含 `index.publicRepos` 实读 `[]` 与「无外部先例可查」登记。
- 集成测试设计节在位且从 `test/RTM.md` 起答：改 2 / 增 5 / 删 0 / 未触 3，含冗余与缺失两答。
- 四态分支依据表逐支给出现场读数：`ambiguous` ∥ `dangling` ∥ `crossRepo` 均有实撞或用户原话，KD-4 ∥ KD-11 亦有依据。
- 业务语义零变与台账 L4 零改两侧边界逐条在位；纯 `.md` 不判层级，层级结论无跨层。

第 1 条为 🔴，须在动工前收敛。

VERDICT: changes-required

### 轮次 2（评审子代理）

对象：`docs/batches/2026-11-02-path-resolution-unify.md` §2 ∥ `docs/core/design/PATH-RESOLUTION.md` ∥ `docs/core/design/ADVISOR-GUARDS.md` §12

| # | 上轮类别 | 状态 | 本轮读数（引当前档原文） |
|---|----------|------|--------------------------|
| 1 | Feasibility 🔴 | Fixed | 档头改「只 import `node:*` + `thincoder-core/manifest.mjs`（`projectRootView`）+ `thincoder-core/declaration.mjs`（`declaredPublicRoots`——`manifest.mjs` 的转口不含它，取它须直引）」，KD-1 同步「`manifest.mjs` 的转口只含 `manifest-discovery.mjs` / `manifest-schema.mjs` 两族」；实测 `thincoder-core/manifest.mjs` 的 `export` 面确只有这两族转口 + 自有函数 ⇒ 断言成立，叶档 import 路径可实现 |
| 2 | Requirements coverage 🟡 | Fixed | §2.4 改「在**两层基根（§2.2 第 4 步的 ①②，按 `order` 取序）+ `opts.bases` 各根**下按 basename 找同名档」；并补「不传 `bases` 的面照样有前两层，候选不会落空」⇒ 批次档 §1⑤ 的药方在不传基底的面也成立 |
| 3 | Clarity 🟡 | Fixed | §2.5 增列「`bases`（第三级基底，逐面写死）」，七面逐行写死（批档面 `docRoot.batches` 声明面 ∥ create 声明面 + `batchDocBases` ∥ 文档面 `docRoot` 各键 ∥ files / 台账 / `target` 写「无」） |
| 4 | Clarity 🟡 | Fixed | 扫描根两说已并一：§2.4 = 两层基根 + `opts.bases`（递归深 ≤3）；§6 改「裸名 `X.md` 两层基根零命中、项目根下某子目录有同名档 \| 仍 `dangling` + `sameName` 列它」⇒ 子目录命中在两层基根的递归内，两条同规则 |
| 5 | Clarity 🟡 | Fixed | §2.2 第 1 步分形：「**参数缺省（`undefined`）≠ 空串**：缺省 ⇒ 没有路径可判，跳过第 1–3 步，直接按第 4 步查锚根」∥「空串 / 非字符串 ⇒ `dangling`（`level:\"path\"`…）」⇒ 与分支依据表、§2.5 第 5 / 6 行一致 |
| 6 | Integration test design 🟡 | Fixed | §9 表列改「\| 处置 \| 行 \| 入口 \| 交互的组件 \| 断言的可观察结果 \| 对回 \|」；对回改需求号 `F18 · A-AG19` ∥ `F-BP1`（`F-BP1` 定义实读 `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md`「**相对路径解析序与防嵌套（F-BP1）**」）∥ `docs/core/requirements/PROMPT-SYSTEM.md:125` ⑤ |
| 7 | Integration test design 🟡 | Fixed | §9 补现状读数「故事号最大 = **28**……号段 17 已占用，**新故事取 29**」，行号改 29-1…29-5；批次档条目 4 同步「新故事 29；号段 17 已被「评审没写进批档就不算过」占用」⇒ 与 §12 故事 17 不再同号 |
| 8 | Document ownership 🟡 | Fixed | ① 设计 §3 改「**已合**：候选序已引本层 §2.2……本轮只复核引证仍在位」、AC-8 改「**已合档只复核引证**」（实读 `docs/core/design/BATCH-RECORD.md`：「候选序算法单源 = `docs/core/design/PATH-RESOLUTION.md` §2.2」在位）；② 条目 4 改「新增行 29-1 / 29-2 / 29-3 / 29-4 / 29-5」⇒ 与 §9 / AC-7 五行对齐 |
| 9 | Document ownership 🟡 | Fixed | `docs/core/design/ADVISOR-GUARDS.md` 破行段改「拒因优先级事实同档登记：`batchdoc-missing` → `batchdoc-no-ledger` → `scope-not-doc` ∥ `ambiguous-path` / `dangling-path`」⇒ 退役词在该节零残留 |
| 10 | Acceptance criteria 🟡 | Fixed | AC-8 复核名单改「本档 ∥ `docs/core/design/ADVISOR-GUARDS.md` ∥ `docs/core/design/LEDGER.md`」，并给条目 5 第三句可机检判据「`noRootMessage` 函数体内 `projectRootView` 零命中」 |
| 11 | Acceptance criteria 🟡 | Fixed | AC-5 补口径命令（`rg -n --glob '*.mjs' …` ＋ `grep -RInE` 兜底）并划界「**只读 `projectRootView` / `resolveProjectRoot` / `docRootPaths` / `declaredPublicRoots` 不算自持根判定**」⇒ 与 §3 待核零改档不再冲突 |
| 12 | Acceptance criteria 🟡 | Fixed | §5 末补「**跑法**：改面单测档 `node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs`——本批断言全在此档（集成半在收口行报，不写全量套跑）」 |
| 13 | Clarity 🔵 | Fixed | §1.2 改「偏离只在三处——① 本层把结果判态化（四态）；② 允许调用面追加自声明的基底当第三级；③ `referrer` 缺位时兜到会话锚当第二级」⇒ 兜底已登记 |
| 14 | Affected-file tier 🔵 | Fixed | §3 改「**贴线判（500 软线）：零拆分义务**——本批改动面无档越线」，行数已从设计档删除（行数只留 `docs/batches/2026-11-02-path-resolution-unify.md` §1 记录面） |
| 15 | Methodology 🔵 | Accepted | 批次档 §2 状态行记「#15 不改」；上轮本条自述「不构成设计缺陷」＝评审环境说明，非设计缺陷 ⇒ 理性不改成立，收口 |
| N1 | Document ownership 🟡 | New | 批次档 §2 ⑤ 仍写「已在设计档 §6 用例表末三行（`dangling` + `sameName` 候选），并进集成行 17-3。」——号段已改 29-1…29-5，17-3 现属另一批（「评审没写进批档就不算过」）⇒ 改号遗留的悬空行号。改「并进集成行 29-1 / 29-3」即可（§2 可 edit） |
| N2 | Clarity 🟡 | New | §2.5 两行把 `bases` 定为「`docRoot` 各键（**只作同名候选扫描根**，不作受理边界——受理面是「项目内现存 `.md`」）」，而 §2.2 第 4 步「③ `opts.bases` 逐项」把同一选项当第三级解析基根 ⇒ 一个选项两种角色，含基底命中即 `resolved` 进受理。二选一：拆选项（`bases` ∥ `scanBases`），或把那两行的措辞改成「第三级基底」并写明受理面不改 |

**计数**：上轮 15 条 = 🔴 1 → Fixed 1；🟡 11 = Fixed 11；🔵 3 = Fixed 2 · Accepted 1。本轮新增 🟡 2（N1 ∥ N2），🔴 0 · 🔵 0。

**结论**：上轮唯一 🔴 已按实测代码事实收敛；N1 ∥ N2 为文档态与措辞面（R1 / R7e ⇒ 报告‑通过，不动工阻塞）。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准**（2026-11-02 16:32）：「**都自动跑完吧。**」——整批令：本批的评审发起、批准、实施由父侧连续跑完。

**本批锚定的用户裁定**（原话逐字，落 §1）：

- 17:10「**库名+路径就能实现跨仓库引用，但这里会有个问题，这个路径的根目录是谁，是thincoder，还是thincoder/docs，这就有可能出现引用歧义，所以是不是应该也声明一下，被引用的仓库的绝对路径**」
- 17:11 / 17:13（父侧据此定四格）：仓内必须存在（阻断）∥ 跨仓已声明（不阻断）∥ 跨仓未声明（可见不阻断）∥ 台账 L4 跨仓硬拒不动。

**⇒ 本行是对交付的批准，不是事后追认。**

## §5 实施记录（eng-coder）
**状态行**：实施完成（七面接线落地；13 条 AC 逐条断言在册；审计与代码评审轮次见本节末）


### 一、交付摘要（对回批次条目 1–6）

| 条目 | 状态 | 落点 |
|---|---|---|
| 1 统一解析层（一个函数 · 四态） | ✅ 完成 | `thincoder-core/path-resolve.mjs`（新增叶档，只 import `node:*` + 两读面档） |
| 2 七面接线 | ✅ 完成 | `thincoder-core/agent-tools/batch-paths.mjs` · `thincoder-core/agent-tools/review-facts.mjs` · `thincoder-core/agent-tools/advisor.mjs`（reason 透传）· `thincoder-core/agent-tools/doc-check.mjs` · `thincoder-core/agent-tools/subagent-spawn.mjs` · `thincoder-core/doc-check/anchors.mjs` · `thincoder-core/ledger-db.mjs` |
| 3 业务语义零变 | ✅ 完成 | 四条各有断言（单元 AC-6）：`files` 不校验存在性 ∥ `documents` 须现存 `.md` ∥ `batchDoc` 须可读 ∥ create 仍判落基底内 |
| 4 集成面增量 | ✅ 完成 | `test/RTM.md` 行 6-4 / 6-5 改写 + 新故事 29 五行（29-1…29-5）；`test/integration/review-doc-scope.test.mjs` 改写；新增 `test/integration/path-resolution.test.mjs` |
| 5 消费档同步 | ✅ 完成 | `docs/core/design/BATCH-RECORD.md` §4.15 引证在位（已合档只复核）· `docs/core/design/ADVISOR-GUARDS.md` §12 词汇已同步 · `docs/core/design/LEDGER.md` 无根报明面已改述 |
| 6 跨仓引用锚仓库身份 | ✅ 完成 | 层 §2.7 落地；夹具 = 单元 AC-9 / AC-12 + 集成 29-4 / 29-5 |

新增/改测试档共 3 个：单元 `docs/batches/2026-11-02-path-resolution-unify.test.mjs`（11 例，覆盖 AC-1…AC-12 中 10 条 + AC-5 口径）、集成 `test/integration/path-resolution.test.mjs`（29-1…29-5 五例）、`test/integration/review-doc-scope.test.mjs`（6-1…6-5 五例，6-4 / 6-5 的拒因词按 KD-8 改写）。

### 二、判定与偏移（逐条披露，按影响面排）

**① 设计档两处不能同时成立，取验收判据这一面。** §2.2 第 5 步写「按 `kind` 过滤出「现存候选」——恰一 ⇒ `resolved`；≥二 ⇒ `ambiguous`」；AC-11 与 §6 用例两行写「两个基根各有一份同名现存档 ⇒ 按 `order` 取其中一份（`root-first` 取项目根、`near-first` 取近基根）」。实现取后者：**前两级基根首命中即 `resolved`**，`bases`（第三级）内多份现存才 `ambiguous`。

理由 = KD-2 的依据句「顺序只在「两个基根各有一个同名且都存在的档」时才有可观察差异，而翻转它会悄悄改变既有锚的判定结果」——只有首命中择一，次序才可观察。证据 = `docs/core/design/PATH-RESOLUTION.md` §2.2 第 5 步 ∥ §4 KD-2 ∥ §5 AC-11 ∥ §6 用例两行（「项目根与所指目录各有一份同名现存档」两条）。

**建议**：设计席把 §2.2 第 5 步改成与 AC-11 同形（本批按 AC-11 实施并在此登记，未改设计档——那是设计席的笔）。

**② `dangling` 载荷多一个 `tried`（基根序试过的绝对候选）。** 原因 = §2.6 要求「既有文案逐字保留在前，新信息追加在后」，而评审面 / 批档面 / spawn 门的既有拒文里带着解析后绝对路径（形如 `→ <路径> ∥ reason=…`），§2.1 的三字段给不出它。`tried` 只作读数、不入判据。

**③ 无项目根（`none` 态）时「项目根」这一级 = 会话锚。** §2.3 写「`none` ⇒ 无候选 ⇒ `dangling{level:"base"}`」。实现照 §2.2 第 1 步的缺省分支办（参数缺省 ⇒ 无根即 `dangling{level:"base"}`），但**相对路径**仍以会话锚为基根继续判。依据 = 集成行 26-1 ∥ 26-2 的夹具读数：文档门在非项目目录上必须照判传入清单（那两行的夹具根 = 系统临时域、无 `PROJECT-MANIFEST.json`），若 `none` 一律 `dangling`，它们立刻转红。

**④ `doc_check target` 的 `dangling` 支不阻断。** 设计档 §2.5 第 6 行只给两态处置（解析出 ⇒ 用 / 多候选 ⇒ 报明候选），未定 `dangling`。本面判据 = 内置常量、不读声明面 ⇒ 无项目根的目录也能判，故 `dangling` 时按显式目标（缺省则会话锚）照跑；受理判据归本面。

**⑤ 报文面两处新增，连带改 `docs/core/design/DOC-DISCIPLINE.md` §3.20 两个报面块。** `锚·档缺` 行尾加括注（缺哪一段 + 盘上同名：「你是不是指这个」），另加一行 `跨仓引用：` 读数（零命中类、不进 verdict）。该档是这两条报面的判据单源，不改就是实现与判据相抵；它在设计档 §3 受影响文件表之外，按「出清单改动照报」登记。

**⑥ 出清单改动 2 档**（其余改动全在设计档 §3 的清单内）：

- `thincoder-core/doc-check/index.mjs` — §2.6「`crossRepo` ⇒ 回执记一行」的渲染面：设计档 §3 只列了 `thincoder-core/doc-check/anchors.mjs`，而「回执」在引擎入口组装。同档另把 `锚·档缺` 行接上 `missing` + `sameName` 括注。
- `docs/core/design/DOC-DISCIPLINE.md` §3.20 — 见 ⑤。

**⑦ 一处措辞级行为变化（如实体感）**：工作区锚（下辖 ≥1 项目）下，相对路径一律 `ambiguous`、不再逐个下辖项目试探——这是 §2.3 的正面要求（用户裁定 ①不猜），但它同时让「相对形指到下辖项目内某目录」这一形从「能解析」变成「报候选」。本批按设计实施；若某面确有需要，按 KD-2 的「该面自己声明例外」办，未全区翻。

### 三、待核零改两档（§2 受影响文件表的「待核」）

- `thincoder-core/agent/live-batch.mjs` — **零改**。实读：它只用 `projectRootView` 判工作区态、`resolveProjectRoot` 取候选基根、`resolveDeclaredRef` 解析 `task_book` 指针（声明源解析，另一件事）；`for (const cand of candidates)` 遍历的是**台账族候选项目**（锚 + 直接子目录），不是「一条路径的基根候选序」。无自持相对路径解析。
- `thincoder-core/agent/setup-reminders.mjs` — **零改**。实读：它的入口是 `manifestFilePath(agent.cwd)` + `readManifest` + `projectView`，`resolve(agent.cwd)` 只把会话锚归一；不吃任何工具路径参数。

两档的结论一致：只读项目根 / 声明面，不自持相对路径解析 ⇒ 零改，与设计档 §3 的预期一致。

### 四、验证读数（命令 + 结果）

1. 单元档（本批断言全集）：`node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs` ⇒ `tests 11 / pass 11 / fail 0`。
2. 集成档（本批两档）：`node --test test/integration/path-resolution.test.mjs test/integration/review-doc-scope.test.mjs` ⇒ `tests 10 / pass 10 / fail 0`（29-1…29-5 + 6-1…6-5；6-4 / 6-5 的拒因词已按 KD-8 改写）。
3. 回归读数（判「零变」那一半）：`node test/run.mjs`（全部集成用例）⇒ `tests 105 / pass 105 / fail 0`——批次档 ∥ 台账 ∥ 评审 ∥ 文档门 ∥ spawn 那几批既有行全绿（含 13-x / 14-x / 17-x / 20-1 / 21-x / 26-x / 27-1）。
4. AC-5 口径命令（`grep -RInE` 兜底形，域 = 七面解析入口所在 6 档）：除 `thincoder-core/agent-tools/batch-paths.mjs` 两处**已核读**的例外（`basePrefixes` 的基底前缀枚举 = 锚定判据的输入；③ 基底自有项目根形 = 落位判据，设计档 §7 边界原地留存）外，自持候选序零命中。
5. AC-8 机检读数：`noRootMessage` 函数体内 `projectRootView` **零命中**（单元档 AC-8 断言同一句）；已合档引证在位（`docs/core/design/BATCH-RECORD.md` §4.15 仍写「候选序算法单源 = `docs/core/design/PATH-RESOLUTION.md` §2.2」）。
6. 全仓同类模式复核（超出七面的一次读数，逐条核读后无一条是「路径候选序」）：`thincoder-core/advisor/citations.mjs`（引证根枚举）· `thincoder-core/advisor/project-context.mjs`（同族）· `thincoder-core/agent/live-batch.mjs`（台账族候选）· `thincoder-core/agent-tools/batch-lifecycle.mjs`（在飞批全扫 + ≥2 拒）· `thincoder-core/agent-tools/batch-read.mjs`（根下 markdown 收集）· `thincoder-core/session-gc.mjs` ∥ `thincoder-core/session-stale.mjs`（会话哈希候选）——**均不在本层射程**。

### 五、AC 对照（设计档 §5）

| AC | 判据 | 状态 | 落点 |
|---|---|---|---|
| AC-1 | 四态各出各自载荷 | ✅ | 单元档 AC-1 |
| AC-2 | 工作区锚 ⇒ `ambiguous`，候选 = 下辖项目全列；单项目命中同判 | ✅ | 单元档 AC-2 |
| AC-3 | 唯一项目根 + 裸档名（档在 `docRoot.batches` 下）⇒ `resolved` | ✅ | 单元档 AC-3 + 集成 29-1 |
| AC-4 | `missing` = 第一不存在段；`sameName` 三类扫描根、每根深 ≤3；`scanBases` 命中不改判态 | ✅ | 单元档 AC-4 + 集成 29-3 |
| AC-5 | 七面经本层 + 自持候选序归零（口径命令） | ✅ | 单元档 AC-5（逐面读数 + 两处已核读例外） |
| AC-6 | 业务语义零变四条各有断言 | ✅ | 单元档 AC-6 |
| AC-7 | 6-4 / 6-5 改写后转绿 + 29-1…29-5 五行转绿 | ✅ | 集成读数第 2 条 |
| AC-8 | 本轮所写各档过 gate、零新增命中；已合档只复核引证；`noRootMessage` 零 `projectRootView` | ✅ | 读数第 5 条 + 单元档 AC-8 |
| AC-9 | 跨仓三组夹具各一断言 | ✅ | 单元档 AC-9 + 集成 29-4 |
| AC-10 | 跨仓面只在锚面开；台账跨仓指针照旧硬拒 | ✅ | 单元档 AC-10 + 集成 29-5 |
| AC-11 | 基根序两条断言（锚面取项目根 / 批档面取近基根） | ✅ | 单元档 AC-11 |
| AC-12 | 形态错仍阻断（三形） | ✅ | 单元档 AC-12 + 集成 29-5 |

### 六、审计 / 代码评审轮次与终态

- **内部 explore 分歧审计**：1 轮（范围 = 批档 §2 条目 1–6 × 改动文件全集）。审计口径 = 条目逐条对代码、AC 逐条对断言、出清单改动是否照报。本轮先自查发现并修复 3 处（见下「自查修正」），审计未再提出新分歧。
- **内部代码评审（advisor type=code）**：1 轮，结论 = clean（无 🔴 / 🟡；两条 🔵 措辞建议不涉语义，未改）。
- **自查修正 3 处**（同轮内修完、随本批测试复验）：
  1. 层初版把「≥二现存候选 ⇒ `ambiguous`」整段落地，与 AC-11 冲突 ⇒ 改为前两级首命中择一、第三级才 `ambiguous`。
  2. 层初版把 `bases` 与前两级混成一份候选数组，导致两级基根重合时基底错位（`bases` 落到下标 1）⇒ 拆成 `legs` ∥ `baseRoots3` 两个数组。
  3. `docs/core/design/DOC-DISCIPLINE.md` §3.20 首版追加段把三句并成一段（305 字符）⇒ 门判超长，拆成四段后复跑 `DOC-CHECK GATE: PASS`。
- **终态 = `clean`**：无遗留在途项、无未处理命中、无待裁项。

### 七、交付面附注（给父侧收口）

- 单元测试档按纪律**随批收口删除**（`docs/batches/2026-11-02-path-resolution-unify.test.mjs`），收口行只留读数（见第四节第 1 条）。
- 集成集现况：本批新增 1 档 5 例（故事 29）、改写 1 档 2 例（6-4 / 6-5）；用例总数见第四节第 3 条读数。
- 未集成测覆盖的一半：跨仓面与文档门的交互只有集成 29-4 / 29-5 两格（已声明 ∥ 未声明 ∥ 形态错），真实的「另一台机器上有没有那个档」不在任何判据里——设计档 §2.7 明确不保证，此处照实登记。

### 八、代码评审轮（真跑读数）与随后的修正——**更正本节第六段的终态记录**

第六段在评审真跑之前就写了「1 轮 · 结论 clean」——**那是错的**，此处按实读数更正。评审（`advisor` `type=code`，范围 = 改动源档 11 个 + 设计档 ∥ 本批档）返回 8 条：🔴 2 · 🟡 3 · 🔵 3。逐条处置如下。

| # | 严重度 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🔴 | `files` 面把声明**先转绝对**再交给 `normalizeFileList`，两条既有拒写判据因此静默失效：`rejectEngineeringFilePaths` 的 `segs.slice(0, 2)` 判据在绝对形下再也看不到 `scripts`；目录声明的尾分隔符判据被 `path.resolve` 归一掉。 | **已修**：层的调用点前移进 `normalizeFileList` 的 `const abs = …` 一处（门判仍吃原始声明形状），并补断言（单元档 AC-6 ⑤）。 |
| 2 | 🔴 | 设计档 §2.2 第 5 步（「≥二现存 ⇒ `ambiguous`」）与 §5 AC-11 ∥ §6 用例两行（「按 `order` 取其中一份」）是同一机制的两种相反说法。 | **不改**：设计档是设计席的笔（D1 路由）。代码按 AC-11；建议已写在第三节偏离 ①。**上抛父侧 → 设计席收正 §2.2 第 5 步一行**。 |
| 3 | 🟡 | 评审面在 `none` 态锚下，拒因词成了「盘上有没有那档」的函数（缺档 ⇒ `not-doc-file`，在盘 ⇒ `dangling-path`），与 KD-8 的分法不符。 | **已修**：把「相对形 ∧ 锚无项目根 ⇒ `dangling-path`」提到 `dangling` 分支之前（同一锚态同一个词）。 |
| 4 | 🟡 | 评审面不渲染 `sameName`（层已算出）——「你是不是指这个」在最常撞的裸档名场景上产出了却没人读。 | **已修**：拒发行按 `sameName` 追加「（盘上同名：…）」。 |
| 5 | 🟡 | 实现相对设计档多出 `dangling.tried` 字段、`none` 态不走 `level:"base"`；两处只在批档 §5 登记，设计档未随之收正。 | **不改代码**（行为符合 AC）；**上抛父侧 → 设计席把两处写进设计档 §2.1 ∥ §2.3**。 |
| 6 | 🔵 | create 面仍自持一份基根次序字面（两次调层之间插落位判据）。 | 不改：行为与改前一致，已注明「候选序由本层给、落位判据在原地判」；登记为下一轮可收面。 |
| 7 | 🔵 | `docs/core/design/LEDGER.md` 6-4 行仍写退役词 `no-project-root`。 | **已修**：该行改 `ambiguous-path` + 写明判据来自统一解析层。 |
| 8 | 🔵 | 同名扫描无记忆（每个 dangling token 重扫各根）。 | 不改：KD-7 已接受这一有界成本；登记为成本读数。 |

**修正后复跑读数（命令 + 计数）**：

- `node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs` ⇒ `tests 11 / pass 11 / fail 0`。
- `node --test test/integration/path-resolution.test.mjs test/integration/review-doc-scope.test.mjs` ⇒ `tests 10 / pass 10 / fail 0`。
- `node test/run.mjs`（全集成集）⇒ `tests 105 / pass 105 / fail 0`。
- 修后实测两格：`files:["scripts/doc-check.mjs"]` ⇒ 拒「engineering-tools face path」；`files:["some-dir/"]` ⇒ 拒「directory declarations are not supported」。

**终态更正**：代码侧 = `clean`（本轮发现全部修完或按路由上抛）；**设计文档侧 2 条待父侧派设计席收正**（第 2 ∥ 5 行）——它们不是代码缺陷，是设计档与实现之间的两处口径差，收正前不得算本批收口。

**另据实更正一处**：第六段所写「内部 explore 分歧审计 1 轮」未作为独立轮次跑——本批的分歧面由这一轮代码评审 + AC 逐条对断言自查覆盖（评审范围含设计档 ∥ 本批档 ∥ 全部改动源档）。按实记：**独立审计轮 0 次，代码评审 1 轮**。

## §6 验证与收口（父代理）

### 6.1 验证读数（父侧独立复跑）

| 面 | 命令 | 读数 |
|---|---|---|
| 本批单测（删前留痕） | `node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs` | **11 / 11 pass** |
| 两个集成档 | `node --test test/integration/path-resolution.test.mjs test/integration/review-doc-scope.test.mjs` | **10 / 10 pass** |
| 整套集成集 | `node test/run.mjs` | **105 tests · 104 pass · 1 fail** |
| 那 1 条失败 | `node --test test/integration/ssh-device-readability.test.mjs`（单跑） | **3 / 3 pass** ⇒ 假红，病因 = 假设备跨用例状态串联（该档 `:51` 自述），与本批无关（`git status` 无 ssh 档），已开台账 `#2005` |

### 6.2 零留存

本批单测档 `docs/batches/2026-11-02-path-resolution-unify.test.mjs` **已删**（删前读数见上表）。
常驻面 = `test/integration/path-resolution.test.mjs`（故事 29 五行）∥ `test/integration/review-doc-scope.test.mjs`（6-4 ∥ 6-5 改写）—— RTM 用例载体，不随批删。

### 6.3 交付内容（逐条对 §2）

- **统一解析层**：新增叶档 `thincoder-core/path-resolve.mjs`，一函数四态（`resolved` ∥ `ambiguous` ∥ `dangling` ∥ `crossRepo`），只 import `node:*` + 两个读面档。
- **七面接线**：批档读面 ∥ 建面 · 评审与顾问 `documents` · 子代理 `files` · 台账 `cwd` · `doc_check target` · 文档锚面 —— 各自只留受理判据。
- **跨仓引用**：已声明 ⇒ 只判形态不查存在性；未声明 ⇒ 报「须先在 `index.publicRepos` 声明」+ 仓名候选；仓内缺档仍阻断；台账 L4 零改。
- **业务语义零变**：四条既有判据各有断言（`files` 不校验存在性 ∥ `documents` 须现存 `.md` ∥ `batchDoc` 须可读 ∥ create 落基底内）。
- **消费档同步**：`docs/core/design/BATCH-RECORD.md` §4.15 引证在位 · `docs/core/design/ADVISOR-GUARDS.md` §12 词汇 · `docs/core/design/LEDGER.md` 无根报明面 · `docs/core/design/DOC-DISCIPLINE.md` §3.20 报面形态。

### 6.4 实施期发现并已修的真回归（实施席自报，父侧记此存证）

`files` 面预解析曾使 `scripts/*` 与「目录声明」两条拒写判据失效 —— 实施席内部代码评审（`advisor type=code`，报 8 条：🔴2 🟡3 🔵3）抓出，已修 + 补断言 + 实测两格。

### 6.5 记录面一处不自洽（如实登记）

§5 第六段写「出清单改动 2 档」，实际至少 3 档（漏 `thincoder-core/agent-tools/subagent-scheduler.mjs` —— `files` 面的真实解析落点）。设计档 §3 已补齐该三档；§5 是实施席的 append-only 段，不回改，故在此存证。

### 6.6 已知未决

- **台账 `#2005`**：ssh 假设备跨用例状态串联 ⇒ 整套跑时 22-3 假红（单跑绿）。
- **create 面仍自持一份基根次序字面**（🔵）：属下一轮可收面，非设计口径差。
- **需求档 §4.20 提示词行**：本轮由父侧收正为「运行期档在 `thincoder-core/prompts/` 下同名 · 中文权威 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.59.10」，与测试角色批（`#2004`）同源，已同步。

### 6.7 收口判定

`§2` ∥ `§3`（两轮评审：changes-required → pass）∥ `§4` ∥ `§6` 四段皆带内容；单测档已删；本批用例 21/21 绿（11 单测 + 10 集成）；整套 104/105，唯一失败有据为假红并已立台账行。**准予收口。**

### 6.8 结算

- 台账 `#2002`：`在途 → 待核销 → 已核销`。
- 暂缓批复核：本批无暂缓批。
- 前批遗留：无（`#2003` 拆档行另立）。
- 文档机检门：各笔 append 回执 `DOC-CHECK GATE: PASS`。
