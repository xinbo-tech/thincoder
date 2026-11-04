# PATH-RESOLUTION · 路径解析统一层

> 板块 = core/design。本档 = 「相对路径 → 绝对路径」的机制单源。
> 七个吃路径的面各自只保留**受理判据**（存不存在 / 是不是文档 / 能不能读 / 落不落基底内）；「一条路径指向哪里」只由本层回答。
> 代码落点：`thincoder-core/path-resolve.mjs`（新增叶档：只 import `node:*` + `thincoder-core/manifest.mjs`（`projectRootView`）+ `thincoder-core/declaration.mjs`（`declaredPublicRoots`——`manifest.mjs` 的转口不含它，取它须直引）。

## 1. 方案与理由

**模块目标**：让所有吃路径的工具参数走同一条解析层，把一条相对路径判成四态之一——解析出唯一落点 / 判不出唯一（列候选、停下）/ 解析无果（报缺哪一段）/ 跨仓引用（报形态、不查存在性）。

### 1.1 要解的病

七个面各持一份「根判定」：有的按会话锚、有的按 manifest 声明、有的按仓根、有的没有基根。于是同一条相对路径在 A 面解析通过、在 B 面判缺，而各面给出的拒因词也各说一套。

病根不是用法，是**没有共用解析层**：同一件事七个写点 ⇒ 同一句输入七种答案，且没有一处能对齐。

### 1.2 最近先例

- `existing: thincoder-core/doc-check/anchors.mjs`（私有函数 `resolveDoc`）· 形 = **两级解析序**：① 项目根相对（`resolve(base, token)`）→ ② 引用方档所在目录相对（`resolve(dirname(refFile), token)`）；零命中 ⇒ 判缺。
  **对齐 = 零偏离**：本层的基根次序逐字沿用这两级、同序（KD-2）。偏离只在三处——① 本层把结果判态化（四态）；② 允许调用面追加自声明的基底当第三级；③ `referrer` 缺位时兜到会话锚当第二级（先例无此兜底——不兜则第二级在「手上没有引用方档」的面整段消失，而七面里多数调用点正是这一形）。
- `existing: thincoder-core/declaration.mjs` · name: `declaredPublicRoots` ∥ `resolveDeclaredRef` · consumers: 台账 `task_book` 指针写门 ∥ 迁移旗。
  形 = 声明公共仓的绝对根集由 `declaredPublicRoots` 单点给出，「首段命中声明仓目录名 ⇒ 于该声明根解析余段」。
  **复用**：本层的**声明仓名集**直接取 `declaredPublicRoots` 各根的 `basename`——不重建第二份声明表。偏离 = 那个函数为台账指针查**存在性**；本层的文档面**不查**（KD-9）。
- `existing but unusable: thincoder-core/agent-tools/batch-paths.mjs` · 形 = 候选序 cwd → 项目根 → 声明基底，加锚定防嵌套与落基底内判据。
  **不可复用之处**：它一半是**落位判据**（新档须落基底内、不许二次拼接、fail-closed 上抛）。那是「准不准落这儿」，与本层的「指向哪儿」是两个问题；合进来会让 create 的拒写语义渗进读面。
  **复用面**：它的候选序形状是本层基根序的来源之一；落位判据原地留存（见 §7 边界）。

### 1.3 调研证据

- `doc_search` 与设计档目录全 grep「路径解析 / 解析层 / 基根」：命中的都是各面自己的路径条款——批次档的相对路径解析序（`docs/core/design/BATCH-RECORD.md` §4.15）、评审文档受理（`docs/core/design/ADVISOR-GUARDS.md` §12）、docRoot 解析管线（`docs/core/design/MANIFEST.md`）。**没有任何一档描述统一层**。
  判读：这是**新建机制**，不是收正既有机制——所以没有「既有档就地改」的落点，新建本档；既有各面各改一句为引本层（§3）。
- 声明源现状实读两条：`PROJECT-MANIFEST.json` 的 `index.publicRepos` = `[]`；该键在 `thincoder-core/agent-tools/manifest.mjs` 里只有一条工具描述串（`key` 参数的说明），而在 `thincoder-core/declaration.mjs` 里由 `declaredPublicRoots` 读成绝对根集。
  判读：**声明表能读、但锚检不消费它**——「可引」写在声明面，判据写在另一个面，两边接不上（§2.7 要修的就是这一处）。
- 公开源仓 = 空（`index.publicRepos` 实读 `[]`）⇒ 无外部先例可查，本节只报这一条读数。

## 2. 接口契约

### 2.1 一个函数，四态结果

```
resolvePathTarget(anchor, given, opts) → Result
```

| opts | 形 | 用途 |
|---|---|---|
| `referrer` | `string`（绝对路径，可选） | 谁在指这份档（在飞批次档 / 评审 batchDoc / 被检文档）——只取它的目录当「所指目录」基根 |
| `bases` | `string[]`（可选） | 本面声明的**第三级解析基底**（`docRoot.batches` …）——命中即 `resolved`，不改前两级的次序 |
| `scanBases` | `string[]`（可选） | **只喂同名候选的扫描根**（`docRoot` 各键）——不参与解析、不产 `resolved`；面要的是「你是不是指这个」而不是放宽受理时传它 |
| `kind` | `"file"` \| `"dir"` \| `"any"` \| `"none"` | 存在判口径，缺省 `"file"` |
| `order` | `"root-first"`（缺省）\| `"near-first"` | 前两级基根的次序：项目根先 ∥ 所指目录先（逐面声明，KD-2 / KD-3） |
| `crossRepo` | `"dangling"`（缺省）\| `"visible"` | 跨仓面：判 `dangling` ∥ 判 `crossRepo`（只有文档锚面取 `"visible"`，KD-10） |

| state | 载荷 | 含义 |
|---|---|---|
| `resolved` | `abs: string` | 判出唯一落点 |
| `ambiguous` | `candidates: string[]` | 判不出唯一 ⇒ **停下要人挑**（不猜） |
| `dangling` | `missing: string` · `sameName: string[]` · `level: "base" \| "path"` · `tried: string[]` | 解析无果 ⇒ 报**缺的那一段** + 列同名候选；`level` 说明缺在基根还是缺在路径段；`tried` = 基根序下试过的绝对候选（**只作读数、不入判据**——既有拒文里带解析后绝对路径的面从这里取，例如评审面 `resolved` 字段） |
| `crossRepo` | `repo: string` · `declared: boolean` · `relPath: string` · `candidates: string[]` | 跨仓引用 ⇒ 只判「引用写对了没有」，**不查存在性**、不阻断（KD-9） |

**四态各自的分支依据**（每一支都必须能填出这一格；填不出就删掉这一支）：

| state | 依据（现场读数 / 可复现路径） |
|---|---|
| `resolved` | 今天能成的那些调用本来就是这一支：`batch append` 传完整仓根相对路径、`doc_check docs:[...]` 传全路径——都当场判对 |
| `ambiguous` | 会话锚 = 上级目录（下辖多个项目）：`ledger count` 不带 `cwd` ⇒「未找到项目根」；`doc_check` 不带 `target` ⇒ `ERROR（多项目工作区）`。两条是同一个病：判不出唯一根 |
| `dangling` | `batch append` 传裸档名 ⇒ 门判档缺、整段零字节落盘（2026-11-02 立题当日四次实撞的最后一次） |
| `crossRepo` | 用户 2026-11-02 17:06 原话「外部引用其实是没法保证的」+ 同一小时的实测（§1.3）：声明表能读、锚检不读它 ⇒ 已声明的跨仓引用被判「档缺」拒写 |

### 2.2 判定算法

1. **归一与缺省分野**：字符串取 `trim`，`\` 归成 `/`。两形分开判，结果态不同：
   - **参数缺省（`undefined`）≠ 空串**：缺省 ⇒ 没有路径可判，跳过第 1–3 步，直接按第 4 步查锚根——判得出唯一根 ⇒ 以其为基根续判；判不出 ⇒ `ambiguous{candidates}`（§2.3 有候选）∥ `dangling{level:"base"}`（零候选）。真实现场即这一支：`ledger count` 不带 `cwd` ⇒「未找到项目根」；`doc_check` 不带 `target` ⇒ `ERROR（多项目工作区）`。
   - **空串 / 非字符串** ⇒ `dangling`（`level:"path"`，`missing` = 该参数本身）。
2. **绝对路径**：直接 `resolved(abs)`，零基根走查（各面受理判据照旧）。依据：现场没有一例是绝对路径出错，改这一形是零收益的回归面。
3. **`kind: "none"`**：取候选序首个为 `resolved`，恒不产 `ambiguous` / `dangling` / `crossRepo`。依据 = `files` 只做调度、不校验存在性（§7 边界），现存行为即如此。
4. **基根序**（缺哪级就跳过；`order` 决定前两级的先后）：
   - `root-first`（缺省）：① `resolveProjectRoot(anchor)` → ② `referrer` 的目录（无 `referrer` ⇒ 会话锚 `anchor`）→ ③ `opts.bases` 逐项。
   - `near-first`：① `referrer` 的目录（无 `referrer` ⇒ 会话锚）→ ② 项目根 → ③ `opts.bases` 逐项。
   - 解析不出项目根时分两形：`workspace` ⇒ 项目根这一级不成立，直接走 §2.3（判 `ambiguous`）；`none` ⇒ 项目根这一级**以会话锚充作**，两级照常走查（锚是手上唯一的基根，§2.3 有依据）。
   - `scanBases` 不进这一步——它只在第 7 步的 `dangling` 上供同名候选（§2.4）。
5. **判态**（前两级择一 · 第三级判多）：前两级基根（第 4 步 ①②，按 `order`）**首命中即 `resolved`**——按序逐级 `existsAs`，第一份现存者胜出，后一级不再看；第三级 `bases` 逐个取现存候选——恰一 ⇒ `resolved`，≥二 ⇒ `ambiguous`（全部列出，按基根序列候选）。
   - 依据 = KD-2 的那句理由「顺序只在两个基根各有一份同名且都存在的档时才有可观察差异」：次序要可观察，只能靠首命中择一；前两级判多则 `order` 无从生效，AC-11 的两条断言也不成立。
6. **跨仓识别**（仅 `opts.crossRepo === "visible"`、输入**多段**、且第 4–5 步零命中）：见 §2.7。
7. **零命中且不成跨仓形** ⇒ `dangling`（`level` = 缺在基根还是缺在路径段）。

### 2.3 多仓根：判不出唯一 ⇒ 停下（不猜）

`projectRootView(anchor).state === "workspace"`（下辖有已注册项目，1 ∥ ≥2 同判）⇒ 项目根这一级不成立 ⇒ 候选 = 下辖项目全列（按名排序）——候选报的是「可以选哪几个根」，不是「哪几个命中了」；零落点也**仍判 `ambiguous`**。

即使只有一个项目命中同名档，也判 `ambiguous`。依据 = 2026-10-25 用户裁定「为啥要试探？不能要求写对吗？」——层里替人挑，就是把被否掉的试探请回来。

`state === "none"`（空目录 / 锚自身为裸仓、下辖无已注册项目）分两支，按手上有没有路径：**参数缺省**（没有路径可判）⇒ 无候选 ⇒ `dangling`，`level:"base"`，文案报「无项目根」+ 期望形（§2.2 第 1 步）；**带相对路径** ⇒ 项目根这一级以会话锚充作，两级照常走查（§2.2 第 4 步）。

后一支的依据是现场必判：文档门要判传入清单，而集成行 26-1 / 26-2 跑在无清单文件的临时域上（`test/integration/doc-check-line-refs.test.mjs:26` 夹具根 = `mkdtempSync(join(tmpdir(), "lr-integration-"))`，夹具只写列出的那几个档、不写清单档）——`none` 一律 `dangling` 会让这两行立刻转红。

### 2.4 同名候选（`dangling` 时报「你是不是指这个」）

`sameName` = 在**两层基根（§2.2 第 4 步的 ①②，按 `order` 取序）+ `opts.bases` + `opts.scanBases` 各根**下按 basename 找同名档：**每根各自起算**递归深度 ≤ 3、命中上限 20、跳过隐藏目录与 `_archive`。

扫描根取这三类，是因为 `dangling` 恰在两层基根全不中之后才成立（第 5–7 步）——病发现场就在这两层里，候选也只能在同一批根里找得出来；不传 `bases` / `scanBases` 的面照样有前两层，候选不会落空。

「每根各自起算」是 `scanBases` 的用处所在：以 `docRoot.design` 为扫描根起算深 ≤3 能到 `docs/core/design/modules/<域>/X.md`；同一份档从项目根起算要下探五层（`docs` / `core` / `design` / `modules` / `<域>`），项目根那一遍扫不到它。

只在 `dangling` 路径上跑——成功路径零扫描，所以这份成本买不到延迟。

依据 = 裸档名判档缺时，人拿到的是「档缺」，得自己翻目录找；本条把「翻目录」这一步替人做掉（用例表末三行）。

### 2.5 接线表：七面各调本层，各留受理判据

| 面 | 代码落点 | `kind` / `order` / `crossRepo` | 基底（逐面写死）：`bases` = 第三级解析基底 · `scanBases` = 只喂同名候选 | 三态处置 | 该面不变的业务语义 |
|---|---|---|---|---|---|
| 批次档读面（append / status / close / spawn 门 / 评审门） | `thincoder-core/agent-tools/batch-paths.mjs` → `resolveBatchReadPath` | `file` / `near-first` / `dangling` | `docRoot.batches` 声明面（读面无 manifest ⇒ 无这一级；取面分野 = `docs/core/design/BATCH-RECORD.md` §4.15 条 1） | 解析出 ⇒ 用；多候选 ⇒ 拒 + 列候选；无果 ⇒ 既有文案 + 追加同名候选 | 参数在 + 路径可读 |
| 批次档 create | 同上 → `resolveBatchCreatePath` | `none` / `near-first` / `dangling` | `docRoot.batches` 声明面 + 缺省回退（`batchDocBases`，恒非空） | 候选序改由本层给；落位判据（落基底内 / 锚定防嵌套 / 多落点拒）原地留存 | 新档须落声明基底内（fail-closed） |
| 评审席 `documents` / 顾问 `documents` | `thincoder-core/agent-tools/review-facts.mjs` → `resolveReviewDocPaths` | `file` / `root-first` / `dangling` | `bases` = 无；`scanBases` = `docRoot` 各键——该面今天不按 docRoot 解析（`resolveReviewDocPaths` 的解析基面只有会话项目根），补一个解析基底就是放宽两门已跑的受理面 | 解析出 ⇒ 进受理；多候选 ⇒ 拒 `reason=ambiguous-path` + 候选；`dangling.level="base"` ⇒ 拒 `reason=dangling-path`；`dangling.level="path"` ⇒ 拒 `reason=not-doc-file`（受理判据判决，零变） | 必须现存 `.md`、必须在项目内 |
| 子代理 `files`（spawn 门） | `thincoder-core/agent-tools/subagent-spawn.mjs` | `none` / `near-first` / `dangling` | 无（`kind:"none"` 恒不产 `dangling`，无同名候选可言） | 恒解析出（只调度） | 不校验存在性 |
| 台账 `cwd`（读 / 写两面） | `thincoder-core/ledger-db.mjs` → `resolveLedgerRoot` / `ledgerDbPath` | `dir` / `root-first` / `dangling` | 无（根由第 4 步锚查给，候选 = 下辖项目，不靠基底） | 解析出 ⇒ 用；多候选 ⇒ 报明候选（今天 =「未找到项目根」）；无根仍抛 | 台账库仍按项目根键控；跨仓硬判不放宽（KD-10） |
| `doc_check target` | `thincoder-core/agent-tools/doc-check.mjs` | `dir` / `root-first` / `dangling` | 无（同上） | 解析出 ⇒ 用；多候选 ⇒ 报明候选（今天已是这一形，KD-5） | 判据参数仍为内置常量 |
| `doc_check` 锚（文档指针解析） | `thincoder-core/doc-check/anchors.mjs` → `resolveDoc` | `file` / `root-first` / `visible` | `bases` = 无；`scanBases` = `docRoot` 各键——`resolveDoc` 的两级序只有项目根与引用方目录，解析面零变 | 两级序改由本层提供；`dangling` ⇒ `档缺` + 同名候选提示；`crossRepo` ⇒ **零命中**，回执记一行（§2.6） | 判据仍是「档在盘 / 节在盘」——仓内那一段 |

**跨仓面只服务第 7 行**（文档锚面，§2.7）。其余面 `crossRepo` 取缺省 `"dangling"`，仓外路径照旧判缺——裁定的是「文档面只保证引用写对、不保证对方机器上有那个档」，不是全区放宽（KD-10）。

### 2.6 报明文口径

四类结果的文案形状统一成同一句话骨架，语种随各面既有面（本层只给骨架与字段，不锁语种）：

- `resolved`：不报（静默用）。
- `ambiguous`：`<参数面>：<输入> 解析到 N 个候选，判不出唯一（fail-closed）——<候选全列>；请显式给路径`。
- `dangling`：`<参数面>：<输入> 找不到——缺「<第一不存在段>」`；`sameName` 非空时追加 `；盘上同名：<列表>`；`level:"base"` 时改报「无项目根」+ 期望形；既有拒文带解析后绝对路径的面（如评审面的 `resolved` 字段）取 `tried[0]` 渲染那个读数，`tried` 空则不渲染。
- `crossRepo` 已声明：`<参数面>：<输入> → 仓「<repo>」的 <relPath>（声明源引用，未校验存在性）`——一行读数。
- `crossRepo` 未声明：`<参数面>：<输入> 引用外部仓「<repo>」——引用外部仓须先在 index.publicRepos 声明；本机仓名候选：<列表>`——一行读数，不阻断。

既有文案逐字保留在骨架之前，新信息追加在后——除了 §2.5 表里点名改词汇的两处（评审面 reason、台账无根文案），其余面报错文本零删改。

### 2.7 跨仓引用：锚仓库身份，不锚路径

**判据一句话**：文档面只保证「引用**写对了**」，不保证「对方机器上有那个档」——后者谁也保证不了（用户 2026-11-02 17:06）。

**既有需求已立同一形态**（`docs/core/requirements/PROMPT-SYSTEM.md:125` ⑤）：「引用形态 = 声明源前缀形（`<声明仓目录名>/<仓内相对路径>`）+ 记录面有界例外（登记 / 归属零松）+ 三态（核〔在场可解析〕∥ 未核〔声明源缺位——列报不入闸〕∥ 红〔不可解析 ∧ 未声明〕）」。

本层是它的文档面落地：核 ⇒ `crossRepo{declared:true}`；未核 ⇒ 同判（不查存在性）；红 ⇒ 按形态分两子——形态不合法 ⇒ 阻断（`dangling`），仓名未声明但形态合法 ⇒ 列报不阻断（父侧 2026-11-02 17:11 裁定）。

需求句里「记录面零松」那半 = 台账面，原地不动（KD-10）。

写法 = `仓名/相对路径`，仓名 = `index.publicRepos` 声明项的名字（`basename(声明项)`），不是磁盘位置。

| 情形 | 判什么 | 阻断吗 |
|---|---|---|
| 仓内 | 档必须在盘 + 节必须在档 | **阻断**（`dangling`） |
| 跨仓 · 仓名已声明 | 仓名在声明表里 + 路径形态合法（余段非空、不含 `..` 越出仓根、非绝对形）；**不查存在性** | **不阻断** |
| 跨仓 · 仓名未声明 | 报「引用外部仓须先在 index.publicRepos 声明」+ 仓名候选 | **不阻断**（可见读数） |
| 台账跨仓指针（L4） | 跨仓硬拒，判据零改 | **阻断**（不动） |

识别判据（第 6 步逐条）：

- **已声明形**：首段 ∈ 声明仓名集（`declaredPublicRoots(anchor)` 各根 `basename`）⇒ `crossRepo{declared:true}`。声明根**不 stat**——位置因人而异，查它等于把 clone 路径当成事实。
- **未声明形**：首段 = 项目根的**同级目录**名（一次 `readdir`，不递归；命中上限 20、按名排序）⇒ `crossRepo{declared:false}` + `candidates` = 同级目录名。这是「本机看得到的仓名」，只作读数，不作判据。
- **形态不合法**（余段为空 / 含 `..` 越仓根 / 绝对形）⇒ 不是跨仓形，落 `dangling`：形态是作者能写对的事，写错仍阻断。

被否两案（KD-9）：**按声明的仓根解析**——每个人的 clone 位置不同，声明里那条相对路径在别人机器上指不到，仓根不是作者能锚的事实；**一律跳过**——跳过是看不见，拼错的仓内引用会跟着一起消失。

`docs/core/design/LEDGER-SELF-CONTAINED.md` 对台账指针的跨仓硬判**不动**：那是事故换来的 fail-closed（别条产品线的债登进本仓台账、随主线推到公开远端）。文档面判「引用写对没有」，台账面判「这笔债归谁」——两面判的不是一件事。

## 3. 受影响文件清单

新增：

- `thincoder-core/path-resolve.mjs`

改（源码）：

- `thincoder-core/agent-tools/batch-paths.mjs` — 候选序改调本层；落位判据留存
- `thincoder-core/agent-tools/review-facts.mjs` — `resolveReviewDocPaths` 改调本层；reason 词汇增 `ambiguous-path` / `dangling-path`
- `thincoder-core/agent-tools/advisor.mjs` — reason 透传文案（实施时核词汇表是否硬编码，硬编码则同步）
- `thincoder-core/agent-tools/doc-check.mjs` — `target` 三态；工作区分支改调本层
- `thincoder-core/doc-check/anchors.mjs` — `resolveDoc` 改调本层（`crossRepo` 面在此接）
- `thincoder-core/ledger-db.mjs` — `noRootMessage` 改由本层候选驱动
- `thincoder-core/agent-tools/subagent-scheduler.mjs` — `files` 的实际解析落点（`kind:"none"` 只做调度）；门在 spawn 侧，解析在调度侧——绝对形不得提前交给 spawn 的判据
- `thincoder-core/agent-tools/subagent-spawn.mjs` — `files` 拒文追加同名候选（`danglingSameNameHint`）；三条门判据仍吃原始声明形状
- `thincoder-core/doc-check/index.mjs` — `crossRepo` 读数行的渲染面（§2.6 回执一行）＋ `锚·档缺` 行的 `missing` / `sameName` 括注

待核（批次档 §1 实扫命中，本设计未读其实现）：`thincoder-core/agent/live-batch.mjs` · `thincoder-core/agent/setup-reminders.mjs` —— 若只读项目根、不自持相对路径解析，则零改；实施时逐处核用途并记入 §5 实施记录。

测试：

- 单元（随批档、收口删）：`docs/batches/2026-11-02-path-resolution-unify.test.mjs`
- 集成：`test/integration/review-doc-scope.test.mjs`（6-4 / 6-5 改写）；新增 `test/integration/path-resolution.test.mjs`

文档：

- `docs/core/design/PATH-RESOLUTION.md`（本档）
- `docs/core/design/BATCH-RECORD.md` §4.15 — **已合**：候选序已引本层 §2.2，本面只留自己的参数与落位判据（无算法复写）——本轮只复核引证仍在位
- `docs/core/design/ADVISOR-GUARDS.md` §12 — reason 词汇表同步（含契约变更登记）
- `docs/core/design/LEDGER.md` — 无根报明面改由本层候选驱动
- `docs/core/design/DOC-DISCIPLINE.md` §3.20 — 该档是「`锚·档缺` 行尾括注」与「`跨仓引用：` 读数行」两条报面的判据单源，实现改了报文就必须同步它

**层级结论**：无档跨层。全部改动落在 `thincoder-core/**` 与仓库根 `test/**`，没有一端（cli / vsc / desktop / server）与核心之间的分层迁移，也没有跨层共享的接口形状变化。

**贴线判（500 软线）：零拆分义务**——本批改动面无档越线；两个既有档越线、**不在本批改动面**（`thincoder-core/agent-tools/batch-skeleton.mjs` ∥ `thincoder-core/agent-tools/batch.mjs`），已登记台账待下一批接笔。

拆边界 = 「骨架常量与判定字面」对「工具 action 分发与 schema」——拆开后前者只留常量与纯判定、后者只留 action 分派。

本批不拆（改它们不是本批的任务），**登记下一批接笔**（台账另开一行，挂 `条件`）。

## 4. 关键决策记录

**KD-1 新建叶档 `path-resolve.mjs`，不并入 `manifest.mjs`。**

理由：`manifest.mjs` 是**声明面读取**（读档、校验、docRoot 展开）；本层是**消费面算法**（候选、判态、报明）。合成一档会让「读声明」与「判落点」共用一个写面。

依赖方向沿用 `batch-paths.mjs` 的现成纪律：叶档只 import `node:*` 与两个读面档——`thincoder-core/manifest.mjs`（`projectRootView`）与 `thincoder-core/declaration.mjs`（`declaredPublicRoots`）。

后者必须直引：`manifest.mjs` 的转口只含 `manifest-discovery.mjs` / `manifest-schema.mjs` 两族，不过 `declaredPublicRoots`——经它转口写的 import 在加载期就抛。

**KD-2 基根次序 = 项目根 → 所指目录（零偏离）。**
依据（用户 2026-11-02 17:07 裁定 ②）：顺序只在「两个基根各有一个同名且都存在的档」时才有可观察差异，而翻转它会**悄悄改变既有锚的判定结果**——用户的第一条要求是「安全的方式」，改一道已经在跑的门语义不是安全。
因此本层缺省 `order = "root-first"`，与 `resolveDoc` 现序逐字同序。**哪个面确有需要，由该面自己声明例外，不全区翻**（例外形 = `order: "near-first"`，见 KD-3）。

**KD-3 批档面声明例外 `order: "near-first"`（cwd / 会话锚先、项目根后）。**
依据：`batch-paths.mjs` 的四形矩阵已在跑，`docs/core/design/BATCH-RECORD.md` §4.15 的落位判据依赖 cwd 先（cwd = 基底父目录 + `batches/<x>.md` 靠第一级命中）。

翻成 `root-first` 会让 create 落到 `<项目根>/batches/<x>.md`——那是改一门已在跑的行为，不是统一层的收益。
被否：全区 `root-first`（会改 create 落点）· 全区 `near-first`（与 KD-2 相反）。例外面 = §2.5 表前两行 + `files` 行，逐行声明。

**KD-4 工作区锚恒判 `ambiguous`，哪怕只有一个项目命中。**
依据：用户 2026-11-02 裁定 ①「多仓根默认 = 安全方式：不猜，解析不出唯一目标 ⇒ 列候选、停下要人挑」+ 2026-10-25 裁定「不能要求写对吗？」（否掉的就是层内试探）。
被否：`owningProject` 兜底挑一个——那正是七个面各挑各的来历。

**KD-5 `doc_check target` 的工作区分支已经是本层要的形**（报明候选 + 拒跑），本层只把它的候选枚举换到层里，文案不动。它是七个面里唯一「已经做对」的一面，被当作 KD-4 的实现先例。

**KD-6 不新增工具、不改任何工具入参名与形状、不加重试。**
依据：批次档 §1 划死的边界。统一的是「怎么把路径变成绝对路径」，不是「各面判不判存在」。

**KD-7 同名候选扫描有界（深 ≤3、命中 ≤20、仅 `dangling` 路径）。**
被否：建全域目录索引。`doc-check/anchors.mjs` 已经为同一个理由否过一次——「为认出一个裸名而重建索引，等于把全仓扫描请回来」。

**KD-8 拒因词汇契约变更（`no-project-root` → `ambiguous-path` / `dangling-path`）。**
依据：用户 2026-11-02 裁定 ②「必须统一」——两个面各说一套词就是不统一。这是**已评审契约的变更**，故显式登记：

| 旧词 | 新词 | 何时 |
|---|---|---|
| `no-project-root` | `ambiguous-path` | 相对形 ∧ 会话锚 = 工作区（下辖 ≥1 项目），判不出唯一根 |
| `no-project-root` | `dangling-path` | 相对形 ∧ 无项目根且零候选（`none` 态 / 解析无果 `level:"base"`） |

- **受影响面**：`thincoder-core/agent-tools/review-facts.mjs`（判据与 reason 值）· `thincoder-core/agent-tools/advisor.mjs`（拒发文案透传）· `docs/core/design/ADVISOR-GUARDS.md` §12（分支 2 判据行 / 拒因值集 / A-AG19）· 集成行 6-4 / 6-5 的断言（`reason=no-project-root` 改 `reason=ambiguous-path`）。
- **不变**：`criterion=scope-not-doc` 恒定；`outside-project` / `not-doc-file` 两值零变，语义零变（`not-doc-file` 仍管「有基根、档不存在或非 `.md`」）。

**KD-9 跨仓引用锚仓库身份，不锚路径；不查存在性。**
依据：用户 2026-11-02 17:06「外部引用其实是没法保证的」+ 父侧同小时的实测（声明表能读、锚检不读）。
被否两案：**按声明的仓根解析**——每个人 clone 的位置不一样，声明里那条相对路径在别人机器上指不到，仓根不是作者能锚的事实；**一律跳过**——跳过是看不见，一条真拼错的仓内引用会跟着一起消失，而它正是锚检要抓的那一类。取「看得见不拦」：`crossRepo` 一行读数、零命中。

**KD-10 `crossRepo` 只在文档锚面开，台账面与其余面不放宽。**
依据：父侧裁定同句——`docs/core/design/LEDGER-SELF-CONTAINED.md` 对台账指针的跨仓硬判是事故换来的 fail-closed，**文档面放宽、台账面不放宽**，两面判的不是一件事。
实现形 = `opts.crossRepo` 逐面声明（§2.5 表），缺省 `"dangling"` ⇒ 不放宽的面行为零变。

**KD-11 仓内缺档仍阻断；跨仓形只认 `仓名/相对路径`，形态写错仍阻断。**
依据：裸档名 / 拼错是作者能写对的事——把它们一起放宽，等于让「档在盘」这条判据对仓内也失效。未声明形靠「同级目录名」认出，只作**读数候选**，不作判据（KD-9 的被拒第二案）。

**KD-12 被否：只统一错误文案，不统一解析。**
七个面仍各判各的，同一个路径照旧在两个面得到两个答案。

**KD-13 被否：把七面改成「多试几个基根、试不出就随便取一个」。**
那是今天的现状，被用户裁定 ① 否掉。

## 5. 验收判据（对回批次条目）

| # | 判据（机检口径） | 对回 |
|---|---|---|
| AC-1 | 单元测试覆盖四态：`resolved` 出绝对路径 / `ambiguous` 出候选数组 / `dangling` 出 `missing` + `sameName` + `level` / `crossRepo` 出 `repo` + `declared` + `relPath` | 条目 1 |
| AC-2 | 会话锚 = 工作区（下辖 ≥2 项目）+ 相对路径 ⇒ `ambiguous`，候选 = 下辖项目全列且按名排序；单项目命中同名档时同样 `ambiguous` | 条目 1 |
| AC-3 | 唯一项目根 + 裸档名（档在 `docRoot.batches` 下）⇒ `resolved`，不再判档缺 | 条目 2 |
| AC-4 | `dangling` 时 `missing` = 第一个不存在的路径段；`sameName` 列出两层基根（项目根 / 所指目录，按 `order`）+ `bases` + `scanBases` 各根下的同名档，每根各自起算深 ≤3（无则空数组）；`scanBases` 命中不改判态（不产 `resolved`） | 条目 1 |
| AC-5 | 七面全部经本层，且「自持候选序」归零：① 七面各自的解析入口都调 `resolvePathTarget`（逐面列读数 = 文件 + 引入行）；② `thincoder-core/**` 内除 `path-resolve.mjs` 外无「多基根候选序 + 首命中择一」的实现点——口径命令 `rg -n --glob '*.mjs' -e 'for \(const \\w+ of (bases|roots|candidates)' -e '\\.find\([^)]*existsSync' thincoder-core` ⇒ 除本层零命中（无 `rg` 时同形 `grep -RInE`），命中处逐条核读并列入读数。**只读 `projectRootView` / `resolveProjectRoot` / `docRootPaths` / `declaredPublicRoots` 不算自持根判定**（取根单源就在这几处，改它们才叫搬根判定） | 条目 2 |
| AC-6 | 业务语义零变：`files` 不校验存在性 / `documents` 须现存 `.md` / `batchDoc` 须可读 / create 仍判落基底内 —— 四条各有断言 | 条目 3 |
| AC-7 | 集成面：`test/integration/review-doc-scope.test.mjs` 6-4 / 6-5 改写后转绿；§9 的五行 29-1 ∥ 29-2 ∥ 29-3 ∥ 29-4 ∥ 29-5 转绿 | 条目 4 |
| AC-8 | 本轮所写各档逐档过 `doc_check` gate、零新增命中：本档 ∥ `docs/core/design/ADVISOR-GUARDS.md` ∥ `docs/core/design/LEDGER.md`；**已合档只复核引证**：`docs/core/design/BATCH-RECORD.md` §4.15 仍写「候选序算法单源 = `docs/core/design/PATH-RESOLUTION.md` §2.2」且本面无算法复写。LEDGER.md 的可机检读数（条目 5 第三句）：`thincoder-core/ledger-db.mjs` 的 `noRootMessage` 函数体内 `projectRootView` 零命中——候选尾改由本层 `ambiguous.candidates` 拼入，本面不自行枚举 | 条目 5 |
| AC-9 | **三组夹具各有断言**：① 仓内缺档 ⇒ `dangling`（阻断，`档缺` 命中）；② 已声明仓名 ⇒ `crossRepo{declared:true}`，零命中、且**声明根不在盘时同判**（不查存在性）；③ 未声明仓名 ⇒ `crossRepo{declared:false}`，文案含「须先在 index.publicRepos 声明」+ 仓名候选、零命中 | 条目 6 |
| AC-10 | 跨仓面只在锚面开：同一跨仓输入在台账面 / 批档面仍判缺（`opts.crossRepo` 缺省生效），且台账跨仓指针照旧硬拒（一条拒写断言） | 条目 6 |
| AC-11 | 基根序：两个基根各有一份同名现存档 ⇒ 文档锚面取**项目根**那份（`root-first`）、批档面取**近基根**那份（`near-first`）——两条断言各一 | 条目 1 |
| AC-12 | 形态错仍阻断：`仓名/../越界` · `仓名/`（余段空）· 未声明且首段非同級目录 ⇒ 均 `dangling`，无一落 `crossRepo` | 条目 6 |

**跑法**：改面单测档 `node --test docs/batches/2026-11-02-path-resolution-unify.test.mjs`——本批断言全在此档（集成半在收口行报，不写全量套跑）。

## 6. 用例表

| 类 | 输入 | 期望 |
|---|---|---|
| 正常 | 唯一项目根 · `docs/batches/X.md`（仓根相对） | `resolved` = 该档绝对路径 |
| 正常 | 唯一项目根 · 裸名 `X.md`，档在 `docRoot.batches` 下 | `resolved`（第三级基底命中） |
| 正常 | `referrer` = `docs/batches/Y.md` · 裸名 `X.md`（与 Y 同目录，项目根下无同名档） | `resolved` = 同目录那份（`root-first`：项目根零命中后第二级命中） |
| 正常 | 绝对路径 | `resolved` = 原值，零基根走查 |
| 正常 | `kind:"none"` + 不存在的目标 | `resolved`（首个候选），零 `dangling` |
| 边界 | 工作区锚 · 相对路径 | `ambiguous`，候选 = 下辖项目（按名排序） |
| 边界 | 两个声明基底各有一份同路径现存档 | `ambiguous`，两份全列 |
| 边界 | 工作区锚 · 只有一个项目下有该档 | 仍 `ambiguous`（KD-4） |
| 边界 | 项目根与所指目录各有一份同名 **现存** 档 · `order:"root-first"` | `resolved` = 项目根那份（KD-2） |
| 边界 | 同一输入 · `order:"near-first"` | `resolved` = 所指目录那份（KD-3 例外面） |
| 边界 | 声明源已声明 `thin2` · `thin2/docs/a.md`（本机根本没有 `thin2` 这份盘） | `crossRepo{declared:true}`，零命中（**不查存在性**） |
| 边界 | 未声明仓名 `other/docs/a.md`（`other` 是项目根同级目录） | `crossRepo{declared:false}`，「须先在 index.publicRepos 声明」+ 仓名候选，零命中 |
| 边界 | 同上输入 · `crossRepo:"dangling"`（缺省，台账面 / 批档面） | `dangling`（阻断） |
| 错误 | 唯一项目根 · 裸名，两层基根与各基底均无同名档 | `dangling`，`missing` = 该名，`sameName` = `[]` |
| 错误 | 裸名 `X.md` 两层基根零命中、项目根下某子目录有同名档 | 仍 `dangling` + `sameName` 列它（裸名不成跨仓形，KD-11） |
| 错误 | 已声明仓名 + `../` 越出仓根 | `dangling`（形态不合法，阻断） |
| 错误 | 唯一项目根 · 路径里有一个档名拼错（该名在盘上不存在） | `dangling`，`missing` = 该文件段，`sameName` 列同名档 |
| 错误 | 空串 / 非字符串 | `dangling`，`missing` = 该参数本身 |
| 错误 | 路径含 `..` 越出项目根 | 本层照解析；越界由各面受理判据判（`outside-project` 不变） |

## 7. 边界（不做什么）

- **不做存在性校验**：本层只回答「指向哪儿」；「准不准用」留在各面。跨仓引用更进一步：只判形态与声明，盘上有没有那个档不进判据（KD-9）。
- **不改工具入参**：参数名、形状、缺省值一律不动；不新增工具、不加重试。
- **不动 `batch-paths.mjs` 的四形矩阵落位判据**：落基底内、锚定防嵌套、多落点拒写，三项原地留存。
- **不改台账库键、不放宽台账指针的跨仓硬判**：台账仍按项目根键控；L4 判「债归谁」，与文档面判的不是一件事（KD-10）。
- **不改评审 / 顾问 `documents` 的受理面**：项目内现存 `.md` 零变；跨仓形不进入该面。两个文档面只传 `scanBases`（同名候选提示）、不传 `bases`——给它们加解析基底会把裸档名变成受理通过，那是放宽两门已跑的门。
- **不跨仓写**：跨仓任务各仓自己的会话、自己的批次档；本层不提供跨仓落点。
- **不建目录索引、不缓存**：同名候选扫描有界（KD-7）；跨仓未声明形的同级目录列举 = 一次 `readdir`，不递归、不落缓存。

## 8. 界面 / 交互决策

本机制无 UI。人机交互面 = 报明文（§2.6），四条已全部定形，无 `open` 项：

- 多候选：列全 + 一句「请显式给路径」，人一步就能挑。
- 缺档：先报缺哪一段，再列同名候选——人不用自己翻目录。
- 跨仓：一行「仓「X」的 Y（未校验）」∥ 一行「须先声明，本机仓名候选：…」——人知道这一处没保证、也知道下一步写什么。
- 解析成功：静默，不占一次回执。

## 9. 集成测试设计（`test/RTM.md` 增量）

读 `test/RTM.md` 现状后按增量答（最终形 = 改 2 行 · 增 5 行 · 删 0 行 · 未触 3 行）：

**现状读数（2026-11-02 实读，号段凭据）**：故事号最大 = **28**；故事 17 = 「评审没写进批档就不算过」，其下 17-1 / 17-2 / 17-3 三行都在（`test/integration/advisor-record-gate.test.mjs`）⇒ 号段 17 已占用，**新故事取 29**。

| 处置 | 行 | 入口 | 交互的组件 | 断言的可观察结果 | 对回 |
|---|---|---|---|---|---|
| 改 | 6-4 | 会话内发起设计评审（`documents` 传项目根相对 `.md`） | 设计评审入口 × 本层 | 会话锚 = 工作区 + 相对 `.md` ⇒ 当场拒，报明理由 `ambiguous-path` + 候选列（原断言 `no-project-root`） | F18 · A-AG19 |
| 改 | 6-5 | 同上 | 设计评审入口 × 本层 | 会话锚 = 非项目目录（下辖 1 个项目）+ 相对 `.md` ⇒ 拒，报 `ambiguous-path` + 该候选；不把唯一下辖项目当根 | F18 · A-AG19 |
| 新增 | 29-1 | 父侧 `batch append` 写一笔 §2 | 批档写入 × 本层 × 文档门 | 唯一项目根 + 裸档名 ⇒ 写入落盘，门不再判档缺 | F-BP1 |
| 新增 | 29-2 | 父侧同一句报明（批档 / 台账 / 文档门各一笔） | 三面 × 工作区锚 | 同一句报明形状：拒 + 候选全列，三面文案骨架一致 | F18 · F-BP1 |
| 新增 | 29-3 | 父侧一次写门判档（裸档名） | 文档门 × 本层 | 裸名不在任何基根 ⇒ 报「缺哪一段」+ 同名候选（「你是不是指这个」） | F-BP1 |
| 新增 | 29-4 | 文档门判一份跨仓引用的档 | 文档门 × 声明仓名 × 本层 | 已声明仓名 + 相对路径 ⇒ 零命中（写作被放行），且**盘上无该仓**时同判——另起一格未声明仓名 ⇒ 零命中但回执行含「须先声明」+ 仓名候选 | `docs/core/requirements/PROMPT-SYSTEM.md:125` ⑤（核 / 未核 / 红 三态） |
| 新增 | 29-5 | 文档门判一份形态错的跨仓引用 | 文档门 × 跨仓形态 × 本层 | `仓名/../越界` ⇒ 仍判缺（阻断）；同输入改台账面 ⇒ 硬拒（KD-10 的可见差） | 同上 ⑤ + `docs/core/design/LEDGER-SELF-CONTAINED.md` §3 L4 |

- 新增行挂新故事「29 路径解析统一层」；行号已在此定死，实施时 `test('29-1 …')` 逐字用同一号。
- 6-1 / 6-2 / 6-3 不受影响（在项目根内解析，本层不改这一格；6-3 的 `outside-project` 判据零变）。
- 冗余：无。本次不删任何既有行。
- 行号落在 `test/RTM.md` 的动作归实施轮（RTM 与集成用例同处维护）；本档只定号与断言口径。
