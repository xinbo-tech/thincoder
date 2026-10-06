# 2026-10-06 · 三层结构常识入公共层（提示词批）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 08:16「这个三层结构是我最近得出来的经验，我也希望进 thincoder 的提示词体系」+ 08:18「讲清道理……每个模式和角色都该知道」+ 08:19「可以，现在就跑」。
> 台账 = #956（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批定位

- **来源** = 用户 2026-10-06 08:14（server 结构层令）→ 08:16「这个三层结构是我最近得出来的经验，我也希望进 thincoder 的提示词体系」→ 08:18「讲清道理，让 agent 知其然知其所以然……这是常识，每个模式和角色都该知道」→ **08:19「可以，现在就跑」= 批点燃**。
- **本批** = **三层结构常识入提示词公共层**（#956）——`板 → 域 → 档`：① 域 = 并发隔离单位（并行批次各动各域）；② 域目录从第一天就立（哪怕单档）；③ 拆分恒落域内（新档进同域目录——零跨域动 ∥ 零路径重排）；④ 代码树与文档树同拍（模块镜像）。
- **写法（用户 08:18 定）**：**讲道理式**——讲清并行写冲突的因果，让 agent 知其所以然；非光规范句。
- **需求单源** = `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 登记块（#956——目标 ∥ 四条 ∥ 写法 ∥ 落点 ∥ 边界 ∥ 验收）。
- **既有同族条** = 工程纪律层 `discipline-engineering.md`「按域分界（创建即留并行面）」（EN `:103` ∥ CN `:101`）——升层后**收窄/回指**（D2 防重述）随设计轮定。
- **边界（本批不做）**：他条零触 ∥ 不加机械门 ∥ EN 运行期落地 = 实施轮。
- **台账** = #956（待设计——任务书指针 = 本档）。

### 1.2 授权（**父侧代点火 + 代批准 · 全链 · 2026-10-06 08:32**）

用户原话：「**点火。自动跑完**」⇒ 本批全链——**设计评审点火权 + §4 批准权（代签）+ 修正轮/实施轮派发 + 收口核销 ∥ 提交 ∥ 推送**——均委托父侧自动执行，至本批完结（排空模式 · 无时限）。

**父侧自缚三条**（本仓惯例 · 先例同形）：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 新范围或用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆动作先停。

**射程** = 本批（三层常识设计 → 实施〔EN 回写〕→ 收口）——不自动扩到他批/新批。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 1 已落（评审 §3 轮次 1——八条处置 ∥ #7 不做）；CN 已落（板归属条换写 + 判据条收窄并入）∥ EN 待实施轮 ∥ 上抛 1 项（U2 在册——U1 已落勾销 ∥ U3 消退））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）
- **#956 三层结构常识入公共层**——本设计轮交付：① 落点定案（公共层新增节）∥ ② CN 正本逐字稿（已落）∥ ③ EN 译本稿（下附 §2.4；实施轮落运行期）∥ ④ 同族条处置（收窄——已落 CN）∥ ⑤ 计数连带列明（4 处）∥ ⑥ 设计档更新（`PROMPT-SYSTEM.md` §6.16 + D-PS22 ∥ D-PS23 + 变更记录）∥ ⑦ 验收映射。
- 要求四条功能点全覆盖：① 域 = 并发隔离单位 ② 域目录从第一天就立 ③ 拆分恒落域内 ④ 代码树与文档树同拍——并带 why（并行写冲突因果）+ 判域口径（自旧条升层）。

### 2.2 落点与方案终值
- **落点** = 公共层 `common.md` **档末新增第 15 节**「工作结构常识（板 → 域 → 档）」（why + 判域口径 + 四条规矩）。
- **同族条** = `discipline-engineering.md`「按域分界（创建即留并行面）」⇒「按域分界（细则）」：删 2 条（划界原则 ∥ 并行写者错开——公共层已承载）+ 保留 3 条细则（热点面最小化 ∥ 一句话判据 ∥ 改组已有内容时——逐字）。
- **双文成稿位置**：CN 正本已落（`docs/core/design/prompts/common.md:130`–`:140` ∥ `docs/core/design/prompts/discipline-engineering.md:101`–`:105`）；EN 译本稿 = 本节 §2.4（实施轮落 `thincoder-core/prompts/` 两档——M9 翻译回写）。
- **关键决策** = 设计档 §7 **D-PS22 ∥ D-PS23**（含否决备选——本处不重述，D2）。

### 2.3 CN 正本逐字稿（已落——当批围栏块）

`docs/core/design/prompts/common.md:130`–`:140`（新增第 15 节）：

```markdown
## 工作结构常识（板 → 域 → 档）

**工作结构（代码树 ∥ 文档树）分三层：板 → 域 → 档**——板 = 业务板块；域 = 目录（**并发隔离单位**）；档 = 单个文件。

**为什么按域分**：写冲突的根源 = 两件并行的工作改同一批文件——互相覆盖、互相踩、返工。**怎么判域**：谁跟谁总是一起动 ⇒ 同一份档；谁跟谁从不同时动 ⇒ 分开写。照此分域，并行的工作各动各域、互不干扰；**域划对了，并行写冲突才能降到足够低**——划不对，冲突只会在运行期撞出来。

**四条规矩**：
- **① 域 = 并发隔离单位**：并行的工作各动各域，互不牵动——一项工作只落在自己的域里。
- **② 域目录从第一天就立**（哪怕域里只有一份档）：晚立 = 已有的档要挪窝——挪窝 = 路径重排 + 引用连带；先立目录，往后拆分不动既有档。
- **③ 拆分恒落域内**：新档一律落进本域目录——**零跨域动 ∥ 零路径重排**，域外零扰动。
- **④ 代码树与文档树同拍**：模块镜像——代码拆出一个模块，文档树在对应位置拆出对应域；两棵树保持同一个模块结构。
```

`docs/core/design/prompts/discipline-engineering.md:101`–`:105`（同族条收窄后现状）：

```markdown
### 按域分界（细则）

- **热点面最小化**：不让一份档（或一个节）成为多路不相干工作的必经之处——共享面只承真正共享的事实；随多路工作变动的计数、枚举行从共享档上摘走，每个数只住一处。
- **一句话判据**：并行进行的两个任务会不会写到同一个文件——会 ⇒ 再分界；分不开 ⇒ 同域顺位（串行）＝预期，不是缺陷。
- **改组已有内容时**：逐字搬迁（重组不改字），原位留一行指针、不留副本；计数随内容对拍守恒。
```

### 2.4 EN 译本稿（实施轮落运行期——M9 翻译回写）

`thincoder-core/prompts/common.md` 新增第 15 节（EN 稿）：

```markdown
## 工作结构常识（Work structure — board → domain → file）

**Work structure (code tree ∥ doc tree) comes in three tiers: board → domain → file** — board = a business board; domain = a directory (the **concurrency-isolation unit**); file = a single file.

**Why domains**: the root of write conflicts = two pieces of parallel work editing the same set of files — overwriting each other, stepping on each other, rework. **How to draw domains**: things that always move together ⇒ one document; things that never move together ⇒ separate. Split this way, and parallel work stays in separate domains without interfering; **get the domains right, and parallel write conflicts stay low enough** — get them wrong, and the conflict only surfaces at runtime.

**Four rules**:
- **① Domain = the concurrency-isolation unit**: parallel work moves within its own domains — no pull between domains; a piece of work lands only in its own domain.
- **② Stand the domain directory up from day one** (even with a single file inside): starting late = existing files must move — moving = path churn + broken references; stand it up first, and later splits never move what is already there.
- **③ Splits always land inside the domain**: new files go into the same domain directory — **zero cross-domain churn ∥ zero path rearrangement**, zero disturbance outside the domain.
- **④ Code tree and doc tree move in step**: modules mirrored — when the code splits out a module, the doc tree splits out the matching domain at the corresponding position; the two trees keep one module structure.
```

`thincoder-core/prompts/discipline-engineering.md`「Partition by domain」节收窄后（EN 稿）：

```markdown
### Partition by domain (details)

- **Minimize hot surfaces**: never let one document (or one section) become the mandatory stop for several unrelated workstreams — a shared surface carries only genuinely shared facts; move counters and enumerations that shift with several workstreams off the shared document — every number lives in exactly one place.
- **One-line criterion**: would two tasks running in parallel write the same file — if yes ⇒ split further; if it cannot be split ⇒ same-domain sequencing (serial) = expected, not a defect.
- **When reorganizing existing content**: move text verbatim (restructuring changes no wording); leave a one-line pointer at the old site — no duplicate copy; counts reconcile against the moved content.
```

### 2.5 受影响文件与计数（D3）

| 文件 | 现状（前） | 本批 Δ | 面 | 状态 |
|---|---|---|---|---|
| `docs/core/design/prompts/common.md` | 128 行 · 14 节 | **+12 → 140 行 · 15 节** | CN 正本 | 已落（本设计轮） |
| `docs/core/design/prompts/discipline-engineering.md` | 172 行 | **−2 → 170 行**（5 条 → 3 条；标题括注「创建即留并行面」⇒「细则」） | CN 正本 | 已落（本设计轮） |
| `docs/core/design/PROMPT-SYSTEM.md` | 665 行 | **+24 → 689 行**（§6.16 + D-PS22 ∥ D-PS23 + 变更记录） | 设计档 | 已落（本设计轮） |
| `thincoder-core/prompts/common.md` | 14 节 | 第 15 节（同量） | EN 运行面 | 待实施轮 |
| `thincoder-core/prompts/discipline-engineering.md` | 5 条 | −2 条（同收窄） | EN 运行面 | 待实施轮 |
| `docs/core/requirements/PROMPT-SYSTEM.md` | — | §2.3 标题 14 → 15 + 表行 15 | 需求档 | **主 agent 笔**（上抛 U1） |
| 测试面 | — | 零改（无存活计数断言——原 common 节数守恒用例随 2026-09-28 测试树全清退役） | — | — |

计数连带 4 处（详 = 设计档 §6.16「计数连带」节）：① 需求档标题 + 表行（U1）② 设计档 §10.2 行 5 读数 14/17 ⇒ 15/18（U2）③ 无存活断言（机检族无节数断言）④ `##` 块 CN ∥ EN 14 → 15。

### 2.6 验收对照（回指需求 #956 验收 + 本批加严）

| # | 判据 | 读数 |
|---|---|---|
| 1 | 双面（模板 + 运行期）该节在位 + 语义等价 | CN 已落（`:130`–`:140`）∥ EN 稿 = §2.4（实施轮落）——落地后按 M9 语义等价核 |
| 2 | `prompt-refs-check` 零命中 | **实测 0 命中**（提示词面 80 档 · 代码面 421 档） |
| 3 | 计数连带同步 | 4 处列明（§2.5）；需求档面 = U1；设计档 §10.2 = U2 |
| 4 | 用户审核面 = CN 正本可读 | ✓（CN 正本本设计轮已可读） |
| 5 | `doc-check` exit 0 | 本批触面 = 锚 0 悬空 ∥ 行宽 0 超限（全 docs .md 扫描实测）；**整档 exit=1 唯一来源 = 另批在飞档**（U3） |
| 6 | 讲道理自查（逐句：运行时读得到 ∥ 有说服非光规范） | ✓（why 段 = 因果链；四条规矩各带后果；零文档引用 · 所指全运行时可得） |
| 7 | 歧义自查（单读不歧义） | ✓（术语就地定义；「三层」与通用尺子节「三层齐备」分域各义） |

### 2.7 上抛项与披露
- **U1（主 agent 笔）**：需求档 §2.3 标题「common.md 14 节」⇒ 15 + 表行 15（建议续行 =「工作结构常识——板 → 域 → 档：域 = 并发隔离单位 ∥ 域目录从第一天立 ∥ 拆分恒落域内 ∥ 码档同拍（why + 四条规矩）」）。
- **U2**：设计档 §10.2 表行 5 读数「14/17」⇒ **15/18**（随两面落地收正；实施轮/收口执行）。
- **U3（观察）**：并行批在飞（`docs/batches/2026-10-06-server-gateway.md` + `docs/server/**` + manifest 增列 server 根）⇒ doc-check 整档 **exit=1** 唯一来源 = `docs/server/requirements/PROJECT.md:39`（318 字符超限——非本批写域，未动）；候选总量漂移 49289 → 49311（+22）同因归彼（本批两档新增锚 = 0，逐行实测）。
- **披露（收窄/回指取舍论证）**：选「去重保留」（删 2 留 3）；否决「收窄为回指」（D-PS3 前例：公共层恒第二位注入——指针无导航价值）·「整条删」（三细则无公共层承载——私删行为规则＝静默缩水）·「原样保留」（D2）。**判域口径自旧条升层**（「总是一起动 ⇒ 同一份档；从不同时动 ⇒ 分开写」入公共层 why 面——#827 merge-on-dedupe 先例）——**此点请评审重点裁**。
- **披露（自捕）**：设计档落点行首版 303 字符（超 3）——复测前已拆两行；doc-check 复测本批面 0 超限。设计要点 ①–⑦ 全落；无其他偏离。

**2026-10-06 · 修复轮 1（评审 §3 轮次 1 逐号处置 · 父侧八条采纳 ∥ #7 不做）· eng-designer**

**逐号处置（号 → 改动 file:line，读回 D6 在册）**：

1. 🔴 **板归属条互斥收口**（发现 1）——处置 = **换写**（去 1:1 基数、保内核、补关系句）：`docs/core/design/prompts/discipline-engineering.md:94`——「一个板块一个文档」⇒ **`- **按业务板块组织文档，不按功能点拆**：文档归板块（板内分域分档、可多档）；一个功能点不独立成文。`**
   **裁定理由（一句）**：定权威 = 公共层三层模型（板 → 域 → 档——板内含域与档、可多档）；「一板一档」的 1:1 基数与之互斥且无在案支持（现实反例 = 「核心统一」板块多子系统档），而该条有效内核（按板块组织 ∥ 题不独立成文）保留；「板内分域分档、可多档」即二者关系句（板 = 归属、域/档 = 板内结构）；不全删（内核无他载）·不另立回指（D-PS3 前例）。
   **EN 面（实施轮落，以本块为准）**：`thincoder-core/prompts/discipline-engineering.md:96` ⇒ `- **Organize docs by business board, not by feature**: documents belong to their board — a board may hold several files across its domains; a feature point doesn't get its own doc.`
2. 🟡 **保留条收窄**（发现 2 · 二择一 = 收窄）——`docs/core/design/prompts/discipline-engineering.md:104`——「一句话判据：并行进行的两个任务会不会写到同一个文件——会 ⇒ 再分界；分不开 ⇒ 同域顺位（串行）＝预期，不是缺陷。」⇒ **`- **分不开时**：同域顺位（串行）＝预期，不是缺陷。`**（判据本体已随本批升公共层 why 面 ⇒ 纪律层留公共层未承载的出口半句）。
   **为何不采「显式裁定重叠可接受」**：该重叠系判据全文重述、非「最短动作锚」（编写纪律 #10 适用面）——违 D2 与本批「公共层已承载 ⇒ 删 / 收」的既定处置原理。
   **EN 面（实施轮落，以本块为准）**：`thincoder-core/prompts/discipline-engineering.md:109` ⇒ `- **When it cannot be split**: same-domain sequencing (serial) = expected, not a defect.`
3. 🟡 **EN 稿标题收纯英文**（发现 3）——本档 §2.4 标题行「`## 工作结构常识（Work structure — board → domain → file）`」⇒ **`## Work structure (board → domain → file)`**（EN 面惯例 = 纯英文节名）；§2.4 其余 EN 文面零改（以本块为准）。
4. 🟡 **U1 勾销 + 上抛计数收正**（发现 4）——U1 **已落**（需求档 `docs/core/requirements/PROMPT-SYSTEM.md:59`「common.md 15 节」∥ `:79` 表行 15 ∥ `:283` 落笔行——以在盘措辞为准，本档 §2.7-U1 建议续行**不覆盖**）；U3 **消退**（2026-10-06 08:31 ∥ 修复轮复跑：整档 `doc-check` exit 0——他批在飞档长行已折）；**上抛现况 = 1 项（U2 在册）**；状态行随正（同轮）。§2.5 需求档行「（上抛 U1）」随正 ⇒ 已落。
5. 🟡 **验收 5 读数收正**（发现 5）——§2.6 行 5：**整档 `doc-check` exit 0**（2026-10-06 08:31 ∥ 修复轮复跑实测——悬空 0 ∥ 行宽 OK）；原「整档 exit=1 唯一来源 = 另批在飞档」句随实态收（U3 消退）。**设计档同拍**：`docs/core/design/PROMPT-SYSTEM.md:418`（§6.16 机检面）收正 = 「exit 0（整档实读——锚零悬空 ∥ 行宽零超限；2026-10-06 复跑）」。
6. 🔵 **行宽预算收口单一**（发现 6）——`docs/core/design/PROMPT-SYSTEM.md:400`（§6.15 机检面）：「≤128 字符」⇒ **「≤300（= 仓行宽闸值——manifest `checkConfig.lineWidth`）」**；读数行保留（实测值不变）。依据 = ≤300 为唯一在案预算（manifest 闸值 ∥ 文档行宽纪律「无 >300 字符单行」∥ 同族五处共形）；≤128 无在案依据（孤例）⇒ 收口单一、不复注局部预算。
7. 🔵 **不做**（发现 7）——已登记 U2（本档 §2.7-U2 ∥ 设计档 §6.16 计数连带 ②：§10.2 表行 5「14/17」随两面落地收正 ⇒ 15/18）；落定前不收口，逐字零动。
8. 🔵 **EN 两档补现况读数**（发现 8）——§2.5 表 EN 两行随正：`thincoder-core/prompts/common.md` = **171 行 · 14 节** ∥ `thincoder-core/prompts/discipline-engineering.md` = **180 行 · 5 条**（as-of 2026-10-06——供收尾「落地档 ↔ 围栏块」逐行比对定位漂移）；同表 CN discipline 行 Δ 补「+ 板归属条换写 ∥ 判据条收窄（修复轮 1）——行数不变」。
9. 🔵 **落形安排补记**（发现 9）——`docs/core/design/PROMPT-SYSTEM.md:415`（§6.16 落点行）补：「**落形安排** = 本批 CN 正本由 eng-designer 在设计轮落形（父侧派单安排——2026-10-06；账内先例 = 落笔归实现轮，本批为单批安排）」——承 `:278` 先例形。

**本块为本轮现态（承前句）**：本档 §2.2 ∥ §2.3（围栏块 `:61`–`:67` 之「一句话判据」行）∥ §2.4（标题行 + 「Partition by domain」中条）∥ §2.5 ∥ §2.6（行 5）∥ §2.7（U1 / U3）相关句以本块为准。

**读回与机检**：九处落点逐处回读在册（D6——含改后行上下文）；`node scripts/doc-check.mjs` ⇒ **exit 0**（整档实读——悬空 0 ∥ 行宽 OK（区带豁免在效）；候选 49316）∥ `node scripts/prompt-refs-check.mjs` ⇒ **零命中**（提示词面 80 档 ∥ 代码面 421 档——CN 两处改笔零文档引用）。仓套件 = 父侧收口一次（本席未跑——纪律）。

**范围外同族（只报告不触）**：`docs/core/design/prompts/persona-eng-designer.md:51`（「一板块一档、功能点不独立成文」）∥ `:38`（落点形 `design/<板块>.md`）——与发现 1 同族；射程外零触，处置建议 = 父侧另裁（修法可同形：弃 1:1 基数、保「题不独立成文」）。

**披露（观察 · 未动）**：设计档 §7 **D-PS23** 枚举仍载「保留 3 细则：…一句话判据…——逐字」——修复轮 1 已收窄 / 更名（「分不开时」）；守「本轮不重开 KD」零动，如需枚举同步 = 父侧一笔。

**补正（同日 · 修复轮 1 收尾）**：

- **§2.5 设计档行随正**：`docs/core/design/PROMPT-SYSTEM.md` = **665 ⇒ 692 行**（Δ +24 ⇒ **+27**——修复轮 1 增量 +3：§6.16 同族条处置 +1 行 ∥ 变更记录 +2 行；实测读回 692）。
- **item 1 措辞收窄**：「无在案支持」专指本案冲突面——「业务板块 ↔ 单一文档」的 1:1 基数；既有记录中的近形字面（`docs/core/design/DOC-DISCIPLINE.md` §3.14 **M-1**「一档一板块」）其语境 = 机制面粒度（M-1 原文自定「板块 = 可独立演进的机制面」），不足以支持跨层拉平的 1:1 主张。**登记观察（未触）**：「板块」一词的全仓口径（§15 板 ∥ §3.14 M-1 机制面面）如需归一，另批裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（轮次 1 · 设计轮）**——审阅对象 = 「#956 三层结构常识入公共层」（CN 已落 ∥ EN 待实施轮）；审阅范围 = `docs/core/design/PROMPT-SYSTEM.md` ∥ `docs/core/design/prompts/common.md` ∥ `docs/core/design/prompts/discipline-engineering.md` ∥ `docs/core/requirements/PROMPT-SYSTEM.md` ∥ 本批档。
**限制说明**：无项目文档地图 ∥ 无项目标准档（Document ownership 按 AGENTS.md + 范围内文档互核）；EN 运行面 ∥ 测试树 ∥ 脚本实测读数不在本评审射程（相关读数标 unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 新增 §15 把工作结构模型定型为**板 → 域 → 档**（`docs/core/design/prompts/common.md:132`：「板 = 业务板块；域 = 目录（**并发隔离单位**）；档 = 单个文件」），而纪律层同一结构面仍在位一条互斥表述——`docs/core/design/prompts/discipline-engineering.md:94`：「**按业务板块组织文档，不按功能点拆**：一个板块一个文档」。两档同链注入（`common.md:1` 槽位 [2] 恒第二位 ∥ `discipline-engineering.md:1` 槽位 [3] 工程模式全装配）⇒ 同一结构机制两处描述不同（一板块一档 vs 板内含目录 + 多档）。本批「同族条处置」只巡「按域分界」节（`PROMPT-SYSTEM.md:410`；本批档 `:37`），未处置此条；`PROMPT-SYSTEM.md:5`（板块「核心统一」下多份子系统档）即其现实反例。 | 把该条纳入本批同族条处置面——定一处权威（新升层的三层模型）并使他处收正 ∥ 删除（D2 ∥ D8）；或在设计面显式登记其处置口径与理由（保留 ∥ 收窄 ∥ 删），收尾核对按登记核。 |
| 2 | Document ownership | 🟡 | 保留条与升层内容残留重述——`discipline-engineering.md:104`：「并行进行的两个任务会不会写到同一个文件——会 ⇒ 再分界」 ∥ `common.md:134`：「谁跟谁总是一起动 ⇒ 同一份档；谁跟谁从不同时动 ⇒ 分开写」＝同一判据两处（升层后判据本体已在公共层）。升层本身与 D-PS3（源侧删除）及去重判例同向（本批档 `:127` 自请评审重点裁此点），问题仅残留重述。 | 收窄保留条：判据单一权威留公共层，纪律层只留公共层未承载的半句（同域顺位串行 = 预期）；或设计面显式裁定该重叠可接受（编写纪律 #10 关键锚点重复）。 |
| 3 | Clarity | 🟡 | EN 运行面译本稿标题仍带中文——本批档 `:74`：「## 工作结构常识（Work structure — board → domain → file）」；EN 面标题惯例为纯英文（`PROMPT-SYSTEM.md:186`：EN 侧节名「Parallel dispatch & multi-task」∥ `PROMPT-SYSTEM.md:525`：「`## Batch-record lifecycle (five rules)`」），且 EN 面受众 = 「**英文运行面**（国外模型不懂中文）」（`PROMPT-SYSTEM.md:496`）。 | 实施轮落 EN 标题时按 EN 面惯例收为纯英文，或显式记录双语标题的理由（草案内仅此一处，同稿其余标题形已合规）。 |
| 4 | Doc state | 🟡 | 上抛项状态滞后——U1 已在盘落成（本批档 `:124` 仍记其为待办），而需求档标题 + 表行已就位：`docs/core/requirements/PROMPT-SYSTEM.md:59`（「common.md 15 节」）∥ `:79`（表行 15）∥ `:283`（「+ 计数 14 → 15（标题 + 表行，D3）」）；本批档状态行仍记「上抛 3 项」（本批档 `:28`）。 | 收口按实态勾销 U1（勿以批档建议续行覆盖主 agent 已落措辞），并随实态收正上抛计数。 |
| 5 | Scope coordination | 🟡 | 协调项（非缺陷）——验收 5「`doc-check` exit 0」（本批档 `:119`）在本批窗口内不可达：整档 exit=1 唯一来源 = 另批在飞档（本批档 `:126`）；同批设计档机检面行仍写「`scripts/doc-check.mjs` exit 0（锚零悬空 ∥ 行宽零超限）」（`PROMPT-SYSTEM.md:417`）未带该限定。 | 以「本批触面零悬空 ∥ 零超限」为核销读数（整档读数随他批清后复跑），或给设计档机检面行补同形限定——避免收口追一个本批不可达的绿。 |
| 6 | Doc hygiene | 🔵 | 行宽预算两说并存——`PROMPT-SYSTEM.md:400`（「CN 新行守行宽（≤128 字符」） vs `:417`（「CN 新行守行宽 ≤300」，同形见 `:305` ∥ `:306` ∥ `:343` ∥ `:361` ∥ `:384`）∥ `:602`（「行宽闸 ≤300」）；§15 新行的合规读数取决于以哪一档为准。 | 设计面收口单一预算（或注明 ≤128 为单批局部预算及其依据），使收尾核对有唯一基准。 |
| 7 | Doc state | 🔵 | 已登记读数滞后——`PROMPT-SYSTEM.md:518` §10.2 行 5 仍读「14/17」，而 CN 面现为 15 节（§15 已在盘）；修正已登记（本批档 `:125` ∥ `PROMPT-SYSTEM.md:419`：「本档 §10.2 表行 5 读数「14/17」随两面落地收正 ⇒ **15/18**」）。 | 按登记随 EN 面落地同轮收正；落定前勿收口（无须提前动作）。 |
| 8 | Affected-file annotations | 🔵 | 受影响文件表读数不对称——CN 三档带行读数与 Δ（本批档 `:101`–`:103`），EN 两档只记节 / 条数（本文档 `:104`–`:105`）。本批触面全为 `.md`（结构尺度豁免 ⇒ 非 🟡 以上；且零代码 / 测试档 ⇒ 无需拆分计划）。 | 实施轮落 EN 时补一行现况读数，便于收尾「落地档 ↔ 围栏块」逐行比对时定位漂移。 |
| 9 | Methodology | 🔵 | 落笔时序留痕——CN 正本本设计轮已落（`PROMPT-SYSTEM.md:414`：「档末新增第 15 节——本设计轮已落」），与 §6.1 链路「**落笔走正常链**（设计评审 → 用户批准 → eng-coder）」（`PROMPT-SYSTEM.md:163`）不同形；同类先例在设计面记明父侧安排（`PROMPT-SYSTEM.md:278`：「本批由 eng-designer 在设计轮落形，父侧 16:41 裁定；账内先例 = 落笔归实现轮，本批为单批安排」）。 | 在 §6.16 落点行或批档补一句本轮落形安排的父侧依据（谁裁 / 何时），供收口审计追溯；不回改已落文本。 |

**域外注记（无严重度）**：审阅范围限五档；核同族表述时于范围外行式读到同形句——`docs/core/design/prompts/persona-eng-designer.md:51`（「一板块一档」）∥ `:38`（落点形 `design/<板块>.md`）——与发现 1 同族，处置时一并看，不在本评审对象内。

**计数**：🔴 1 ∥ 🟡 4 ∥ 🔵 4（共 9 条）。
VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审（轮次 2 · 修复轮 1 验证）**——审阅对象 = 修复轮 1 后现态（CN 已落 ∥ EN 待实施轮）；范围 = 同轮次 1（五档）；本轮回读 = 五档现态（design 692 行 ∥ common 140 行 ∥ discipline-engineering 170 行 ∥ 需求 285 行 ∥ 本批档）。

**轮次 1 九条逐条验证**：

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/prompts/discipline-engineering.md:94` | 🔴 | Fixed | 现读「- **按业务板块组织文档，不按功能点拆**：文档归板块（板内分域分档、可多档）……」——1:1 基数退场、补关系半句，与 `common.md:132` 三层模型不再互斥；设计档 `:411` ∥ 变更记录 `:554` 同拍；范围内同族表述复扫仅剩范围外 `persona-eng-designer.md:51`（本批档 `:152` 在册——只报告不触）。 |
| 2 | 2 | `docs/core/design/prompts/discipline-engineering.md:104` | 🟡 | Fixed | 现读「- **分不开时**：同域顺位（串行）＝预期，不是缺陷。」——判据半句退场（判据本体在 `common.md:134`）；设计档 `:410` 枚举同步为「保留三条操作细则（热点面最小化 ∥ 分不开时 ∥ 改组已有内容时）」。 |
| 3 | 3 | 本批档 `:74`/`:140` | 🟡 | Fixed（以修复块为准） | `:140` 给 EN 标题收正形「⇒ **`## Work structure (board → domain → file)`**（EN 面惯例 = 纯英文节名）」，`:148` 声明 §2.4 标题行由本块取代 ⇒ 实施轮按本块落（EN 尚未落地，属预期）。 |
| 4 | 4 | 本批档 `:28` ∥ 需求档 | 🟡 | Fixed | 状态行现读「上抛 1 项（U2 在册——U1 已落勾销 ∥ U3 消退）」；需求档侧实态在盘（`requirements/PROMPT-SYSTEM.md:59`「common.md 15 节」∥ `:79` 表行 15 ∥ `:283` 落笔行）⇒ 勾销成立。 |
| 5 | 5 | 本批档 `:142` ∥ 设计档 `:418` | 🟡 | Fixed（读数不可独立复核） | 前提 = U3 消退；`:142` 收正 §2.6 行 5 = 整档 exit 0；设计档 `:418` 现读「`scripts/doc-check.mjs` exit 0（整档实读——锚零悬空 ∥ 行宽零超限；2026-10-06 复跑）」。脚本 ∥ 他批档不在射程 ⇒ 该读数 unverified。 |
| 6 | 6 | `docs/core/design/PROMPT-SYSTEM.md:400` | 🔵 | Fixed | 现读「CN 新行守行宽 ≤300（= 仓行宽闸值——manifest `checkConfig.lineWidth`」——≤128 退场、预算收口单一；变更记录 `:554` 在册。 |
| 7 | 7 | `docs/core/design/PROMPT-SYSTEM.md:519` | 🔵 | Accepted | 仍读「\| 5 \| `common` \| ✓ \| 14/17」= 已登记 U2（本批档 `:125` ∥ 设计档 `:419`「随两面落地收正 ⇒ **15/18**」）；轮次 1 建议本即「无须提前动作」⇒ 关（Deferred 成立）。 |
| 8 | 8 | 本批档 `:145` | 🔵 | Fixed（随修复块） | 补 EN 两档现况读数（common 171 行 · 14 节 ∥ discipline-engineering 180 行 · 5 条，as-of 2026-10-06）；`:148` 声明 §2.5 由本块取代。EN 档读数不在射程 ⇒ unverified。 |
| 9 | 9 | `docs/core/design/PROMPT-SYSTEM.md:415` | 🔵 | Fixed | 现载「**落形安排** = 本批 CN 正本由 eng-designer 在设计轮落形（父侧派单安排——2026-10-06；账内先例 = 落笔归实现轮，本批为单批安排）」——承 `:278` 先例形。 |
| N1 | (new) | `docs/core/design/PROMPT-SYSTEM.md:450` ∥ `:420` | 🟡 | New（不阻塞） | 修复轮记录面残留 2 处：① `:450` D-PS23 枚举仍载「保留 3 细则：热点面最小化 ∥ 一句话判据 ∥ 改组已有内容时——逐字」——与在盘（`discipline-engineering.md:104`「分不开时」+ 判据半句退场）不符；本批档 `:154` 已披露——理由部分成立（不重开决策 ≠ 不同步描述），收口一笔可关；② `:420` 计数连带 ① 仍引「§2.3 标题「common.md 14 节」」——需求档标题现读 15 节（`requirements/PROMPT-SYSTEM.md:59`）——可标「已落」或随正。 |

**计数**：轮次 1 九条 = Fixed 8 ∥ Accepted 1 ∥ Unfixed 0；新发现 = 🔴 0 ∥ 🟡 1 ∥ 🔵 0。**结论：全 🔴 已清（含验证），无新 🔴 ⇒ pass**（token 随主回复签发）。
VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-06 08:32「点火。自动跑完」全链授权）**

- **三条件齐备**：① 评审 **pass**（§3 轮次 2——轮次 1 九条 = Fixed 8 ∥ Accepted 1 ∥ Unfixed 0 ∥ 新发现 🟡1（N1——不阻塞））；② 修正轮已落地并逐条核验（父侧回读 + 轮次 2 验证）；③ **token 已签发**（评审回执——值不入档）。
- **批准范围** = 实施轮：**EN 运行面两档回写**（`thincoder-core/prompts/common.md` 第 15 节 ∥ `thincoder-core/prompts/discipline-engineering.md` 两处）+ 批档 §5 实施记录。边界 = §2（含修复块）为准；CN 两档零触。
- **依据登记** = §3（轮次 1 ∥ 轮次 2）∥ §2 修复块（`:130`–`:148`）∥ 本档状态行。可撤回（用户任何时点否决 ⇒ 实施止付 ∕ 回滚）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（EN 两档回写已落 · 在盘核语义全等 · 两机检 exit 0 · 审计零发现 ∥ advisor pass（终态 clean））



**实施轮（EN 运行面回写）· eng-coder · 2026-10-06**

**改动清单（file:line——逐处）**

| # | 文件:行 | 改动 | 依据 |
|---|---|---|---|
| 1 | `thincoder-core/prompts/common.md:172`–`:182` | 档末新增第 15 节：标题 `## Work structure (board → domain → file)`（纯英文——修复块项 3 覆盖形）；why 段 ∥ 判域口径 ∥ 四条规矩；`##` 块 14 → 15 | §2.4 围栏块 1 + 修复块项 3 |
| 2 | `thincoder-core/prompts/discipline-engineering.md:96` | 板归属条换写：弃 1:1 基数、保内核、补「板内分域分档、可多档」关系半句 | 修复块项 1（批档 `:136`） |
| 3 | 同档 `:103` | 节标题括注 `(leave parallel room at creation time)` ⇒ `(details)` | §2.4 围栏块 2 |
| 4 | 同档 `:107` | 判据条收窄 ⇒ `- **When it cannot be split**: same-domain sequencing (serial) = expected, not a defect.` | 修复块项 2（批档 `:139`） |
| 5 | 同档 删 2 条（原 `:105` ∥ `:108`——新档无行） | 划界原则条 ∥ 并行写者错开条——整条删除 | §2.2 / §2.4 围栏块 2 |

保留条零触：`热点面最小化`（`:105`–`:106`）∥ `改组已有内容时`（`:108`）——逐字；删条零残留（五 probe 实测 0 命中）。行数读数：common **171 → 183**（+12 = 本节 11 行 + 分隔空行 1）· discipline **180 → 178**（−2 条净减）。

**两条机检读数（本席实跑 · cwd = 仓根）**
- `node scripts/prompt-refs-check.mjs` ⇒ `汇总：提示词面 80 档 · 代码面 421 档 · 命中 0` + `OK(prompt-refs): J1/J2/J3 三式零命中`——**exit 0**。
- `node scripts/doc-check.mjs` ⇒ `OK(锚): 0 条悬空（闸态——阈值 0）` ∥ `OK(行宽): 源域全部 .md 无 >300 字符单行`（候选 49316；区带豁免在效）——**exit 0**。

**在盘核（落地档 ↔ 批档 §2 围栏块 一次性比对 · D-PS4 语义锚口径）**：common §15 = **逐行全等 11/11**（含修复块标题覆盖）；discipline 节 = **语义全等**（标题 ∥ 判据条 = 修复块覆盖形；「热点面最小化」条沿用原两行体——稿面为单行渲染，属「保留·逐字」面、零触）。

**行宽读数（新行自查）**：common 新行 = 41 / 194 / **494** / 15 / 164 / 238 / 183 / 214——唯 `:176`（Why 段）494 > 300：按 §2.4 单行体 + EN 面既有单行惯例落位（EN 面不在 doc-check 扫描域：manifest `scanDirs=["docs"]`；设计面行宽纪律 = 「CN 新行守行宽 ≤300」`PROMPT-SYSTEM.md:418`）。discipline 改行 = 180 / 33 / 88 ≤300（沿用行 184 / 135 / 202 同体）。**可裁项**：父侧若要 EN 新行硬守 ≤300 ⇒ `:176` 零字软折行一处即可（本席未折 = 守「按稿落位」）。

**决策透明**：① 派单「两处」按两个节读（板归属条 ∥ 「Partition by domain」节）——节面收窄（标题 + −2 条）以 §2.4 围栏块 2 ∥ §2.5「−2 条（同收窄）」为准（EN ∥ CN 双面语义等价所需）；② 修复块两处覆盖形逐字落；③ 其余 EN 文面零触。

**边界**：CN 两档 / 设计档 / 需求档 / 批档他段 / 他批（server）文件 = 零触（`git status` 对照：本席笔 = EN 两档 + 本段）。测试面 = 零改（设计面既定——无存活计数断言；核验 = 上述两脚本 + 在盘核）；仓套件 = 父侧收口一次（本席未跑——纪律）。

**审计与代码评审轮次（内部）· 终态 = clean**

- **轮 1 · explore 偏差审计（只读）**：四类偏差（验收部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 清单外改动）**零发现**——验收 ①–④ 逐条核过（① 在盘逐行全等 + 修复块覆盖形逐字；② 变更面静态等价零命中〔脚本未复跑——审计装配无 shell，如实标〕；③ 域推导（`scanDirs=["docs"]`）证明本席写入面不触该检查域；④ §5 + 状态行在位）；越界核 = 未发现。两处「已披露形态」（`:176` 494 单行 ∥ 保留条两行体）经其独立校准 = 正当披露非偏差（新增实存证：`.thincoder/tmp/lc818-baseline/en-discipline-engineering.md:106`–`:107` 两行体基线）。
- **轮 1 · advisor 代码评审（type=code）**：**VERDICT: pass**（🔴 0 ∥ 🔵 4——全非阻断；无必修项 ⇒ fix round = 0、无须轮 2 复核）。应答表如下。
- **fix round 数** = 0 ∥ **纠正轮** = 0 ∥ **终态 = clean**。

**advisor 评审应答表（轮 1）**

| # | 发现（文件:行 · 级别） | 本席处置 | 说明 |
|---|---|---|---|
| 1 | `thincoder-core/prompts/common.md:176` 🔵——why 段 494 单行 > 300（记录读数） | 接受（维持现状 + 在册） | 非闸项（EN 面域外——manifest `scanDirs=["docs"]`）；守「按稿落位」= 不折；父侧如裁折 ⇒ 零字折一处 + 同轮改 §5 对照读数。 |
| 2 | `docs/core/design/PROMPT-SYSTEM.md:519` 🔵——§10.2 行 5 读数滞后（U2） | 接受（在册，非本轮面） | 已登记 U2（批档 §2.7 ∥ 设计档 §6.16 计数连带 ②）；设计档不在批准边界——收口轮父侧一笔收正。 |
| 3 | `thincoder-core/prompts/common.md:172` 🔵——标题纯英文 vs 档内双语惯例 | 接受（按裁定落地，记录） | 该形 = 设计评审判定形（§3 轮次 1 发现 3 → 修复块项 3）；全档标题形归一 = 另批形态题。 |
| 4 | `thincoder-core/prompts/common.md:174` 🔵——`domain` 新义与既有写域/任务域义并存 | 接受（无动作） | 非矛盾（就地定义 ∥ `files` 声明仍限 file-level；CN 面同形 ⇒ 两面等价）；消歧如做 = 文档面另批。 |

**披露（advisor 引用面）**：advisor 报告内两处既有先例引用经宿主机检未过（ledger-unification 批档 ∥ `PROMPT-SYSTEM.md:400`）——本席应答表与交付报告不依赖该两处；本条依据 = 本席自读 manifest（`:25` / `:27` / `:30`）∥ 设计档 `:418` ∥ `docs/batches/2026-09-25-conflict-escalation-bound.md:156`（自跑 grep 实读）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）**

**来路**：用户 2026-10-06 08:14/08:16/08:18/08:19 结构层令 → 批 §1 开批（父侧代点火 + 代批准 · 全链）→ 设计轮（CN 正本落形 + §6.16 + D-PS22/23）→ 评审 §3 轮次 1（changes-required：🔴1 ∥ 🟡4 ∥ 🔵4）→ 修复轮 1（八条落位 ∥ #7 不动）→ 评审 §3 轮次 2（**pass**——Fixed 8 ∥ Accepted 1 ∥ New 🟡1＝N1）→ §4 父侧代签 → 实施轮（EN 两档回写）→ 本段。

**验证读数（父侧亲跑）**：
- `node scripts/prompt-refs-check.mjs` ⇒ 提示词面 80 档 · 代码面 421 档 · **命中 0**（exit 0）。
- `node scripts/doc-check.mjs` ⇒ 交卷时（2026-10-06 09:0x）**exit 0**（锚零悬空 ∥ 行宽零超限）；收口时整档锚面 **38 悬空**——根因 = `thincoder-server/` 新树四 basename（`config.mjs` ∥ `log.mjs` ∥ `providers.mjs` ∥ `errors.mjs`）碰撞使检查器「唯一 basename 回退」（`scripts/doc-check-anchors.mjs:186`）失据，38 条老档旧路径残引翻闸——**非本批面**（逐条比对 38/38 全落四 basename；分布五域），已立账 **#958**（#904 同族——先清账后开闸）；**本批触面零悬空**。
- **在盘核**（落地 ↔ 批档 §2 围栏块 + 修复块）：EN `common.md` §15 = **逐行全等 11/11** ∥ EN `discipline-engineering.md` 节 = **语义全等**（标题 + 判据条覆盖形；删 2 条零残留）——实施轮实测，父侧实读复核（EN §15 :172–:183 ∥ 板归属条 :96 ∥ 判据条 :107 ∥ 删后三 bullet）。
- **EN `common.md:176` = 494 字符未折**——裁定 = **维持**（判据三条：① EN 面不在闸域〔manifest `scanDirs=["docs"]`〕；② 设计字面 = 「CN 新行守行宽 ≤300」；③ EN 面单行体例先例〔`2026-09-25-conflict-escalation-bound.md` 同类〕）；如需折 = 一处软折 + §5 对照口径同改（可后补）。

**父侧机械收正（收口轮 · 直接执行 · 逐处对表 · 可 revert）**：
1. 设计档 `PROMPT-SYSTEM.md` §10.2 行 5 读数 14/17 ⇒ **15/18**（U2 落）；
2. §6.16 计数连带 ①②④ 行态收正（需求档标题/表行已落 ∥ = 15/18 已落 ∥ CN 15 ∥ EN 15）；
3. §6.16 落点行 + 边界行「EN 运行期 = 实施轮」标记 ⇒ 已落；
4. §7 D-PS23 枚举 ⇒ 修复轮 1 在盘形（「分不开时」）；
5. §6.16 机检面补破口注（#958）；需求档 `docs/core/requirements/PROMPT-SYSTEM.md:79` 行尾「EN 运行期 = 实施轮」⇒ 两面已落；
6. 设计档变更记录 +1 行（收口轮）。
**N1 两处**（评审轮次 2 新发现）由此全关（D-PS23 枚举 ∥ 计数连带 ①）。

**测试面**：① 本批无批内件（无代码面）——机检 = `prompt-refs-check` + `doc-check` + 在盘核一次性比对；② 集成场景 = **无**（提示词内容变更，零集成测试面）。

**遗留 / 移交**：`#957`（`persona-eng-designer` 同族句——**CN + EN 两面同改**，随提示词面触碰）；`#958`（锚闸破口——归清账批）；`#956`（本批台账——核销）。

**收口**：CN/EN 两面 + 设计/需求档 + 本档 = 提交携带（下条记）。
