# 2026-10-24 · 常驻守卫的本能 = 集成测试：提示词补正redirect
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 18:08「你说的所谓『常驻测试』就是『集成测试』」→ 18:10「这是个问题，需要进提示词，让模型能理解它本能中的『常驻测试』与『集成测试』之间的联系」。
> 台账 = #1757（TESTING · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-24（设计档 §6.48 落笔；实施面 = discipline-engineering 一处四行，待 eng-coder 落笔）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-10-24（设计档落点 = `docs/core/design/PROMPT-SYSTEM.md` §6.48；实施面 = 提示词 1 档 1 处 4 行）

**本批条目（覆盖 1 条）**

| # | 条目 | 需求锚 | 设计落点 | 验收 |
|---|---|---|---|---|
| 1 | 「这块得留个长期守卫」这条本能 ⇒ 指向集成测试；无业务场景 ⇒ 记待办、不造常驻件 | `docs/core/requirements/TESTING.md:47`（§1.2 技法轴） | `docs/core/design/PROMPT-SYSTEM.md` §6.48（逐字英文块 B1 = 唯一目标形） | 设计 §6.48 表 A1–A7 |

**明确不在本批**（不在本批实施，≠ 无价值）：普通模式面 `thincoder-core/prompts/discipline-normal.md:191` 同款禁令、同样无去处（上抛项 1）· 合并同档 `:171` ∥ `:186` 的既有重复禁令（上抛项 2）· 需求档与 `docs/core/design/TESTING.md` **零改**（设计面机制 §3.1 ∥ §3.2 已在案，本批落点是提示词）。

**机制设计（细节 = 设计 §6.48「机制」节，此处只给判据链，不转抄）**

1. 本能指向集成测试：本项目常驻测试面只有集成测试 ⇒ 需求 `:47` + 需求 §1.2 技法轴。
2. 落点 = 业务场景用例，不是单测档的删减版 ⇒ 需求 F8（`:80`）+ 同档 §1.2 执行轴；判据 = 「同一份单测档换个名字仍是单测档」。
3. 无业务场景 ⇒ 守卫尚未成立 ⇒ 报告记一行台账、父侧登记 ⇒ 需求 `:47` + 提示词 `:191` 在册说法 `ledger row`。

**与既有句的不重复判据（D2）**：`:171` 管禁止、新句管去处与无场景；`:177` ∥ `:178` ∥ `:181` 已定形态 / 来源 / 位置，新句不复述；`:175` 的 `none` 门槛管「改了业务行为」，新句管「没有业务场景」——正交，不得互相顶替（设计 §6.48 A5 给出五串零命中的机判）。

**受影响文件与测试覆盖**

| 文件 | 现行（实读 2026-10-24） | Δ | 性质 |
|---|---|---|---|
| `thincoder-core/prompts/discipline-engineering.md` | 338 行 / 42,252 字符 / max 300 / >300 = 0 | +4 行 ⇒ 342 行 | 产品代码面（提示词）——**eng-coder 落笔**，本席未动 |
| `docs/core/design/PROMPT-SYSTEM.md` | 3,515 行 / 300,987 字符（本节写入前） | 新增 §6.48 | 设计档（本席写域） |

单元测试档：无（本批零可执行代码）。集成场景：无变化——本批只改模型可见提示词文本与设计档，未触及业务行为（需求 F9 ②半口径）；窗口读数由父侧收口行带出，本批不新增用例。

**关键决策**：K1–K5 在 §6.48（落节位与零块计数连带 · 不落公共层 · 不重写 `:171` · 记待办的动词落在子代理可执行的动作上 · 不用新名词）。此处不转抄（D2）。

**上抛项**：[上抛·待裁]（1）普通侧面是否补同款去处、措辞是否随该面寿命口径改写——父侧裁；（2）`:171` ∥ `:186` 既有重复是否合并——父侧裁，不在本批射程；（3）本节未加 §7 D-PS 行（承 §6.47 上抛，编号归属待父侧收口）。[上抛·知会] §1 现只有表头与模板占位行；本批实质由 spawn 任务书（含用户 18:08 ∥ 18:10 逐字）与需求新条 `docs/core/requirements/TESTING.md:47` 承载，设计每条前提均可回指这两处，无推断成分。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：docs/core/design/PROMPT-SYSTEM.md §6.48 常驻守卫提示词（四行文案 · 与既有句分工 · 无新术语）· 类型 = 设计评审 · 对象状态 = 待评审
**计数**：🔴 0 · 🟡 3 · 🔵 5 · VERDICT: pass

**已核读数（本席实读）**：`docs/core/requirements/TESTING.md:47` 需求全文在场；`thincoder-core/prompts/discipline-engineering.md` 的 `:166` `:167` `:171` `:172` `:175` `:177` `:178` `:181` `:184` `:186` `:190` `:191` 逐行与设计引用一致；该档 `##` 块 = 10（`:3` `:28` `:50` `:120` `:132` `:141` `:150` `:164` `:201` `:329`）；
  `^.{301,}` 零命中（`>300 = 0` 成立）；`instinct` ∥ `urge` 全档 0 命中；`docs/core/design/PROMPT-SYSTEM.md` 的 §6.44 `:2746-2903` ∥ §6.45 `:2905-3113` ∥ §6.46 `:3115-3261` ∥ §6.47 `:3264-3426` 四个区段边界实读相符。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Scope / 协调项 | 🟡 | 普通侧面同缺陷留在盘：设计自记 `thincoder-core/prompts/discipline-normal.md:190` 单测档随批档存、`:191` 同款禁令（本席实读 `:191` = 同款不提升句），并把该面处置记为「落与否 = 上抛项，本批不改」（§6.48 L2 行 · 末段上抛项）。需求条 `docs/core/requirements/TESTING.md:47` 属技法轴，而本档自述该知识非工程面独有（`:291` 落两模式纪律层；D-PS13）。⇒ 落地后同一缺陷仍留在一侧受众面上 | 把普通面一句登记为**已排期的协调项**（并把措辞按该面的寿命口径校准——`:190` 该面单测档随批档存、不删，故「无场景 ⇒ 不留件」的落点语义需按该面重写，不照抄工程面），使「补不补」从开放问题变成在册条目 |
| 2 | Clarity / 需求覆盖 | 🟡 | 去处置句不点角色：B1 行 1「that is the moment to design an integration case」（`:3464`）的读者含 eng-coder——设计自己在 K4 写明「工程纪律层的读者含 eng-coder」（`:3522`）；而 `docs/core/requirements/TESTING.md:82` 的 F10 与 `:94` 的维护模型把集成用例定形定在「eng-designer 定形 → eng-coder 落」。同块行 3 已把动作路由给父侧（`:3466`「as a ledger row for the parent to book」），行 1 没有 ⇒ 同一四行块内两处「有去处」的动作，一处定角色、一处不定 | 行 1 按行 3 的形补上动作归属（这条用例由谁定形、经谁发起），使纪律层不向子代理名下塞一个其角色之外的动作 |
| 3 | Acceptance criteria | 🟡 | A1 自称「需求三条各有一句对应」（`:3489`），判法写「逐行对照需求 `:47` 三句」；但需求 ②句自带「从用户可见入口走一遍」这半句，A5 又把 `from a user-visible entry`（`:3493`）列进零命中串——委派给 `:177` ∥ `:181` 的理由只写在「与既有句的分工」（`:3452`），A1 里没有。按 A1 自己给的判法去判，会读成「②句缺半句」 | 在 A1 内把该半句的委派写明（`:177` ∥ `:181` 已承载，按 A5 不复述），使该验收项按自己的判法即自足可判 |
| 4 | 既有件三问 | 🔵 | 新增标签的三问答只给了两问：`existing but unusable`（`:3529`）给了坐标（`:171`）与不可用理由（禁止面在盘、去处面缺），但既无逐字名（逐字句只在 F1 表 `:3438`），也无「谁」这一问；标签侧 `none found` 给了查面（全档、`:184` ∥ `:191` 反证） | 在 `:3529` 内补该既有句的逐字名与其所属层，使三问答在同一处可判，不必回翻 F1 表 |
| 5 | Doc hygiene / 编号 | 🔵 | 上抛项写「D-PS46 / D-PS47 的归属仍待父侧收口时定」（`:3549`）——这两个号是 §6.46 ∥ §6.47 留下的（`:3425` 同句），本节自己的待定号无名 ⇒ 读者无法从该行判断 §6.48 是否仍未占号 | 给本节自己的待定号一个名字（或统一写成「本节编号待定」），不复用前两节的号 |
| 6 | Doc hygiene / 测试纪律 | 🔵 | A3「落地后三串各恰 1 次」（`:3491`）是一次性落地读数，但 §6.48 无 §6.46 ∥ §6.47 那样的「机检：不新增断言」段；与一次性机制的唯一挂钩在 `:3459`（比对基线 = §6.1 批次收尾核对）。`docs/core/requirements/TESTING.md:160`（F19）「禁止新写散文锚」在盘 ⇒ 一次性属性应无歧义 | 明写 A3 ∥ A5 的读数属一次性（零常驻断言），并指回 §6.1 收尾核对步，免实施席把三串读成常驻锚 |
| 7 | Methodology（适用面限制） | 🔵 | 本次评审上下文未提供项目标准档与文档地图 ⇒ 第 7 条（文档归属）按 Project Guide 判、口径降级。设计称 `docs/core/design/TESTING.md` §3.1 ∥ §3.2（`:105-116`）已承载机制面、本批零改（`:3538`）——该档在声明评审范围之外，本席 `unverified` | 文档地图可得时，确认设计 docs/core/requirements/TESTING.md 的机制段承载技法轴新条（需求 `:47`），使需求→设计的追溯不只落在提示词面 |
| 8 | 读数抽查（criterion 8） | 🔵 | 受影响文件表（`:3507-3513`）抽查：`##` 块 10 成立 · `>300 = 0` 成立 · 行数 338 与其声明的口径（`split(/\r?\n/).length - 1`）一致 · 四处区段边界相符；字符数 42,252 本席无执行面复算，`unverified`（不影响判定：A6 的落地判据是落地后复读） | 无动作；落地轮按 A6 复读字符数即可 |

**判定**：🔴 = 0（三问既有件成立、落点可行、无新增分支、无机制级双述矛盾）⇒ 通过。上述 🟡 = 建议项（普通面协调 · 行 1 角色归属 · A1 判法自足），🔵 = 可选观察。

## §4 用户批准（主 agent）

**批准依据**：用户 2026-10-24 18:08 / 18:10 明确要求（「常驻测试在本项目里就是集成测试」「需要进提示词」）＋ 会话内「自动跑」授权；设计评审轮 1 通过后进入实施（记录见 §3）。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-10-24（L1 已落笔 · 偏离审计 CLEAN · 代码评审 pass · 修复轮 0）

**落点**：`thincoder-core/prompts/discipline-engineering.md` · `## Testing discipline` 节 · `:172-175`（`:171` 不提升禁令之后、`:176` 收口测试行之前）

**逐字内容（照 `docs/core/design/PROMPT-SYSTEM.md` §6.48 围栏块 `:3464-3467`，零改动，未折行）**

```text
- **The wish to keep a permanent test around is an integration test talking**: when a few assertions from this change feel worth keeping to watch the spot, that is the moment to design an integration case.
  **A trimmed copy kept in a permanent file is the same unit test file under a new name**: that is the promotion above, not an integration test.
  **With no business scenario behind the urge, there is nothing to keep yet**: name it in the report as a ledger row for the parent to book — do not manufacture a permanent file to discharge the urge.
  Why: the urge is right that the spot matters; a file with no scene pays permanent maintenance and guards nothing.
```

**验收对照（本批任务书 ①–④ + 设计 §6.48 A1–A7）**

| # | 验收 | 读数 | 结论 |
|---|---|---|---|
| ① | 四行插在 `:171` 之后、`:172` 之前（= 落地后 `:172-175`），逐字照 §6.48 | 四行与设计围栏块逐字符一致；相对顺序 `:171` < `:172` < `:176` 成立 | ✅ |
| ② | 该档 `>300` 字符行 = 0、`##` 块数 = 10 | `>300` = 0、max = 300；`##` = 10（`:3` `:28` `:50` `:120` `:132` `:141` `:150` `:164` `:205` `:333`） | ✅ |
| ③ | 既有 `:171`/`:175`/`:177`/`:178`/`:181`/`:184`/`:186`/`:191` 逐字不变 | `git diff --numstat` = `4 0`（零删零改）；八句逐字与 HEAD 比对 8/8 一致 | ✅ |
| ④ | `node --test thincoder-core/test/` 全绿 | 目录形式在 Node v24.19.0 报 `Cannot find module ...\thincoder-core\test`（runner 调用形式问题，非用例失败）⇒ 改用项目自带入口 `node test/run.mjs`（`npm test`）：57 tests / 57 pass / 0 fail。全仓 `**/*.mjs` 无任何用例引用该提示词档 | ✅ |
| A3 | 三串各恰 1 次 | `The wish to keep a permanent test around is an integration test talking` ∥ `A trimmed copy kept in a permanent file is the same unit test file under a new name` ∥ `name it in the report as a ledger row for the parent to book` = 1 / 1 / 1 | ✅ |
| A5 | 五串零命中（D2 零复述） | `established from business needs` ∥ `graduated from unit files` ∥ `from a user-visible entry` ∥ `together with the test code` ∥ `business scenarios` 在 `:172-175` 各 0 命中 | ✅ |
| A7 | 提示词面零文档引用 | `node scripts/prompt-refs-check.mjs` ⇒ 提示词面 70 档 · 代码面 466 档 · 命中 0 | ✅ |

**自检读数**：行数 338 → 342（口径 `split(/\r?\n/).length - 1`）；字符 42,252 → 42,920（Δ 668 = 四行 664 + 4 换行）；LF 换行、无 BOM；`doc_check(mode:"gate")` ⇒ `DOC-CHECK GATE: PASS`（1 档 · 0 命中）。

**决策披露**

| 决策 | 理由 |
|---|---|
| 只落 L1，L2（`thincoder-core/prompts/discipline-normal.md`）与 L3 全零改 | 任务书明令「不动 `thincoder-core/prompts/discipline-normal.md`」；设计 L2 行把普通面处置留给父侧裁。越界落笔会在父侧未裁的面上下一条它未批的规则 |
| 未改 `:171` 禁令句 | K3：禁令（禁止）与新句（去处）各管一面，改写会让两个判读面挤成一句；设计 A3 也把逐字不变列为验收 |
| 评审三项措辞建议不改 | 三项都指向 §6.48 逐字块本身；改任一处即破 A3 逐字判据 = 与本批验收正面冲突。措辞归设计侧（eng-designer 之笔） |

**偏离项**：无。仅一处落点、+4 行；无 out-of-list 文件改动。

**审计与评审轮次**

- 探索式偏离审计（read-only subagent）1 轮：七项判据全 PASS，`Terminal verdict: CLEAN`，零偏离。该席自述无 git 工具 ⇒ 「仅追加」一条靠行数算术与八句在场；本席以 `git diff --numstat` = `4 0` 与 8/8 逐字比对独立补齐该腿。
- 代码评审（advisor · `type=code`）1 轮：🔴 0 · 🟡 1 · 🔵 2 ⇒ pass。三项均非阻塞：① `:172` 题眼用 `wish` 而 `:174`/`:175` 用 `urge`（同物两名，与本档命名纪律相抵，但改则破 A3）；② `:173` 的 `the promotion above` 插入后跨了一行（非 D4 跨档指针，仅读位）；③ `:174` 的 `the report` 未点落点（`ledger row` 已在册、`for the parent to book` 已排除自身登记）。
- 修复轮次：0（三项皆设计侧措辞，交父侧裁，见决策披露第 3 行）。
- 终态：`clean`。

## §6 验证与收口（父代理）

## 验证与收口

**落盘读数（父侧复读）**

| 项 | 读数 |
|---|---|
| 落点 | `thincoder-core/prompts/discipline-engineering.md:172-175`（`:171` 不提升句之后、`:176` 收口测试行之前） |
| 改动量 | `git diff --numstat` = `4 0`（纯增四行，既有句零改） |
| 超宽行 | `>300` 字符行 = **0** |
| `##` 块数 | **10**（落笔前 10，不变） |
| 既有句 | 八句逐字比对 **8/8 一致** |
| 引用检查 | `node scripts/prompt-refs-check.mjs` 命中 0 |
| core 全量 | **33 pass / 0 fail** |

**批内单测档**：本批为纯提示词改动，未新增单测档（无对应可执行面）。

**集成场景 = 无新增（记明理由）**：提示词内容本身不改变任何代码路径，无可从用户入口断言的行为面。其效果只能由模型行为体体现，非确定性可断言。

**未决项（台账承接）**
- `#1760`：三处措辞（`wish`/`urge` 同一物两个名 · 跨行指代 · `the report` 未点落点）待下一批提示词改动一并处理。
- 普通模式面（`thincoder-core\prompts\discipline-normal.md:191`）同款禁令同样没有去处——本批按任务书只落工程面，未夹带。
