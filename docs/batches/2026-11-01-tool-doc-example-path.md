# 2026-11-01 · tool-doc-example-path
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 11:51 逐字「2 也开批」——「2」= 父侧前述三件里的第 2 件：把 `thincoder-core/tool-docs/advisor.md:6` 的举例路径从「本仓某个具体设计档」换成通用形。。
> 台账 = #1942（TOOLS · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论与结论（主 agent）

**覆盖账 = #1942**

### 1.1 这是从哪来的

父侧查「提示词面还有没有本仓自身路径」时，扫 `thincoder-core/prompts`（16 档）与 `thincoder-core/tool-docs`（54 档），**全量只有一处举例用了本仓的具体设计档路径**：

```
thincoder-core/tool-docs/advisor.md:6
  `documents` — one rule: a relative path resolves against the session project root
  (e.g. `docs/core/design/ADVISOR-GUARDS.md`); an absolute path is used as-is.
```

### 1.2 为什么这是缺陷（不是洁癖）

**`e.g.` 后面那个路径，只在 Thincoder 自己的仓库里存在。**

模型读到这条描述时正站在**用户的项目**里；它照着举例去 `read` 一个文件，**那个文件在用户项目里不存在** —— 于是它要么报一个假错误，要么改猜别的路径。

**这是 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1 那条规则的同一类病**：**通用 agent 的描述面不该把自家仓库的结构写成通用真理。** 那一节治的是**注入面**（代码里硬编码路径）；这一条治的是**描述面**（举例里写死路径）。

### 1.3 射程（父侧实扫，不是估计）

- **本仓 `tool-docs/` 54 档 + `prompts/` 16 档，符合本病的只有这 1 行。**
- `test/RTM.md` 另有 4 处（`prompts` 3 + `tool-docs` 1），**但那不是本仓专属**：RTM 是本产品规定的集成索引位置，任何用本产品的项目都该有这个口径 —— **那是产品规矩，不是我们仓库的结构，不属本批**。

### 1.4 边界

- **只动这一行**，不改描述语义（相对路径的解析规则一字不动，只换举例）。
- **不动 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1**（父侧已于本日收正，与本节同源不同面）。
- **不动 `thincoder-core/advisor/project-context.mjs`** —— 注入面已经是对的。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成 2026-11-01

### 2.1 本批条目（覆盖）

| # | 条目 | 覆盖 |
|---|---|---|
| 1 | `thincoder-core/tool-docs/advisor.md:6` 的 `documents` 举例不再指向本仓档（换角括号占位形，规则句一字不动） | ✅ 本批 |
| 2 | 规则语义（相对形按会话项目根解析 ∥ 绝对形照用） | 零改——属不变面，不属改动面 |
| 3 | `test/RTM.md` 那 4 处 ∥ `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1 ∥ `thincoder-core/advisor/project-context.mjs` | ❌ 不在本批（§1.3 / §1.4 已定射程） |

### 2.2 设计档落点

`docs/core/design/PROMPT-SYSTEM.md` §6.60（工具描述面 = 提示词面，其行本体归本档——`docs/core/design/TOOLS.md` §1）。

### 2.3 机制设计（一句）

描述面举例只给**形**（角括号占位），不给任何具体档名：模型在用户项目里照举例去读的事实前提随之消失；同时不落回 `prompt-refs-check` 的 J1/J3 命中（具名 `*.md` 必命中 ⇒ 改址不改病）。

选形依据与两条理由的全文见设计档 §6.60「举例形选型」；此处只记结论，不重述。

### 2.4 受影响文件与测试覆盖

| 档 | 动作 | 面 |
|---|---|---|
| `thincoder-core/tool-docs/advisor.md` | `:6` 整行换举例（行数 ±0） | 模型可见描述面（`write-face.mjs` 判 `classify:doc` = 放行面，本席实跑读数） |
| `docs/core/design/PROMPT-SYSTEM.md` | 新增 §6.60 | 设计档（本席写域） |

**层级结论**：无档跨层，无拆分计划。

**测试覆盖**：本批无可跑运行时面（描述文本），验收 = 四条读数（设计档 §6.60 A1–A4）；不新增单测档、不新增机检门。

### 2.5 验收对照（回指设计档 §6.60）

| # | 判据 | 回指 |
|---|---|---|
| A1 | `grep -rn "docs/core/design" thincoder-core/tool-docs/` ⇒ 0 命中 | 设计档 §6.60 A1 |
| A2 | `node scripts/prompt-refs-check.mjs` 命中数 = 改前 − 1 | 设计档 §6.60 A2 |
| A3 | 规则两句逐字在位（各恰 1 次） | 设计档 §6.60 A3 |
| A4 | `doc_check(mode:"gate")` 首行 PASS | 设计档 §6.60 A4 |

**改前读数（本席实跑，2026-11-01）**：`prompt-refs-check` = 提示词面 70 档 · 代码面 476 档 · 命中 10，其中一条在 `thincoder-core/tool-docs/advisor.md:6`。改后读数见 §5 与父侧收口。

### 2.6 关键决策

| # | 决策 | 理由（摘要，全文见设计档 §6.60） |
|---|---|---|
| K1 | 举例取角括号占位形，不取任何具体档名 | 具名形一律落回 J1/J3 命中；占位形同时告诉读者「这是形，不是文件」 |
| K2 | 不动 `test/RTM.md` 的 4 处 | RTM 是产品规矩（任何用本产品的项目都该有该索引位置），不是本仓结构 |
| K3 | 不改规则语义、不动注入面（§5.1 ∥ `project-context.mjs`） | 本批只治描述面举例；注入面已正 |

### 2.7 上抛项

- **[上抛·知会] `prompt-refs-check` 存量与本档旧读数不一致（不阻本批）**：`docs/core/design/PROMPT-SYSTEM.md` 有一处 A5 行记「命中 5」，本席 2026-11-01 实跑为 `命中 10`（阈值 0 = 闸态，已 FAIL）。
  本批只减 1（那条在射程内），其余 9 条不在本批射程。是否另开批清存量 = 父侧裁。
  读数：`node scripts/prompt-refs-check.mjs` ⇒ `汇总：提示词面 70 档 · 代码面 476 档 · 命中 10`。

### 2.8 设计席自查（三交叉）

1. **引用集 ↔ 标题集**：本节指向设计档 §6.60（本轮新增，在盘）；同档 §6.6（`:205`）、§6.59（`:5229`）均在盘。
2. **表行 ↔ 汇总数**：§2.1 三行 ∥ §2.4 两行 ∥ §2.5 四行 ↔ 设计档 §6.60 的落点表 1 行 ∥ 验收 4 条 ∥ 用例 3 条 ∥ 决策 3 条——逐项对齐。
3. **断言 ↔ 实测**：文中数字（70 档 / 476 档 / 命中 10 / 行数 ±0）全部本轮实跑或实读，非记忆。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · 2026-11-01（round 1）

**两项重点实核（用户点名的 ①②）**

- **① 选形成立**：实读 `scripts/prompt-refs-check.mjs:33` = `const J1_RE = /[A-Z][A-Z0-9-]{2,}\.md/g` ∥ `:39` = `const J3_RE = /[a-z][a-z0-9-]*\.md/g`；对 `thincoder-core/tool-docs/advisor.md` 全档跑 J1 正则 = 0 命中、跑 J3 正则 = 1 命中且只在 `:18`（白名单操作数，`scripts/prompt-refs-check.mjs:37` ∥ `:39-40` 剥除面）—— `:6` 的 `docs/<area>/<name>.md` 两式皆不命中 ⇒ **角括号形确实不构成具名 token**；本仓 `docs/core/design/PROMPT-SYSTEM.md:223` 自有同判（「路径形（`<…>` / `*` 紧邻）与全大写形天然不命中」）。改址不改病的论断亦成立（大写具名落 J1、任意小写具名落 J3）。
- **② 规则本体零改**：`thincoder-core/tool-docs/advisor.md:6` 上 `a relative path resolves against the session project root` ∥ `an absolute path is used as-is` 各恰 1 次（全档 alternation 扫描只回 `:6` 一行）⇒ 两句逐字在位、无重复。
- 归属复核（文档地图缺位，另行实读补）：`docs/core/design/TOOLS.md:20` 逐字「工具**描述文本**（运行期面 = 核包 `thincoder-core/tool-docs/*.md`）的行本体住 `docs/core/design/PROMPT-SYSTEM.md`（提示词面）」⇒ §6.60 落本档成立，无归属冲突。
- 档位实量（本席自查）：`thincoder-core/tool-docs/advisor.md` = 35 行（≤500）；`docs/core/design/PROMPT-SYSTEM.md` = 5,482 行但属纯 `.md` 设计档 ⇒ 豁免。§2.4「无档跨层，无拆分计划」成立。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 集成测试设计（判据 12 · 项目自有 B8–B11） | 🔴 | §6.60 全节无「集成测试设计」段：勘察证据行 `docs/core/design/PROMPT-SYSTEM.md:5438` 只列 `docs/core/design/TOOLS.md` §1 ∥ 本档 §6.6 ∥ 目标档全档 ∥ `thincoder-core/prompts/persona-eng-designer.md:30` ∥ `scripts/prompt-refs-check.mjs:26` ∥ `:33-39`，**无 `test/RTM.md` 读数**；`docs/core/design/PROMPT-SYSTEM.md:5414` 只写「本批无运行时可跑面（描述文本），验收即上面四条读数」，既非两条触发判据、也未给 RTM delta。本档自有判据 `docs/core/design/PROMPT-SYSTEM.md:4019` 逐字「缺段 ⇒ 🔴」，且邻节 §6.56 `:5164` ∥ §6.57 `:5039` ∥ §6.58 `:4930` 均带该段 | 在 §6.60 补一段集成测试设计：先从 `test/RTM.md` 读出近面行，再给 delta（破行 / 冗余 / 新增）或按两条触发写明 `none` 并附 RTM 读数；形制照 §6.56 `:5164-5166` |
| 2 | 状态一致性（R1） | 🟡 | 目标档已落改、批次仍在设计评审：`thincoder-core/tool-docs/advisor.md:6` 现盘已是角括号占位形（实读），而 `docs/batches/2026-11-01-tool-doc-example-path.md:20` 引的扫描读数仍是旧举例；`docs/core/design/PROMPT-SYSTEM.md:5386` 把已改后的行标为「现盘」。后果 = A2 的「改前 − 1」基线（批档 `:86` 命中 10）对应的是已不存在的磁盘态，A1 ∥ A3 会平凡通过 | 在设计档与批档 §2 把该行读数改成 as-of 时点形（改前读数 + 改后读数各一），并在 §5 记明是哪一轮、哪一笔落下的这行 |
| 3 | 验收可判性 / 选形依据过强 | 🟡 | `docs/core/design/PROMPT-SYSTEM.md:5397`「覆盖任意具名 `*.md` 档」∥ `:5428`「具名形一律落回 J1/J3 命中」有例外：干名只含数字时 J1 无 `[A-Z]` 起头、J3 无 `[a-z]` 起头 ⇒ 两式皆不命中，该形照样把具体档写死而 A2 会绿 | 把理由改述为「举例不得指向任何具体档」，并给 A 加一条形判（该行须含角括号占位形，或判该行不含 `<...>` 即未达成）——形由判据锁住，不靠「正则抓得到」 |
| 4 | 清晰度（逐字目标形缺位） | 🟡 | §6.60 只有一个标为「现盘」的围栏块（`docs/core/design/PROMPT-SYSTEM.md:5386-5390`），没有 §6.56–§6.59 的「逐字目标形（实施席照此落笔 · 唯一副本 = 本节）」块（对照 `:5010-5015` ∥ `:5246-5251` ∥ `:5129-5135`）⇒ 实施席读不出该落什么 | 把该围栏块改标为逐字目标形（现盘已等值就写明等值），或给 before ∥ after 两栏 |
| 5 | 先例坐标（判据 9） | 🟡 | `docs/core/design/PROMPT-SYSTEM.md:5432` 的先例行只给设计档节号（§6.6 ∥ §6.59），无实现坐标 ∥ 先例批次；实体坐标散在 `:5396`（`thincoder-core/prompts/persona-eng-designer.md:30`）与 `:5436`，未并回该行 | 把实现坐标（`thincoder-core/prompts/persona-eng-designer.md:30` ∥ `docs/core/design/PROMPT-SYSTEM.md:214` 的 `docs/batches/<batch>-<topic>.md` 路径形）并入先例行 |
| 6 | 验收面窄（判据 5） | 🔵 | `docs/core/design/PROMPT-SYSTEM.md:5409` A1 名为「本仓档路径举例清零」，命令只 grep `docs/core/design` 一个前缀——换成本仓别的面举例（核包前缀 ∥ 具体批次档路径 ∥ 纯数字干名）A1 照绿 | 把 A1 的命令面写成与标题等宽的判据，或把标题收窄成它实际证明的那一句 |
| 7 | 已有更近先例未引 | 🔵 | 选形的自有依据就在本档：`docs/core/design/PROMPT-SYSTEM.md:223`（路径形 `<…>` 紧邻天然不命中）∥ `:214`（`docs/batches/<batch>-<topic>.md` 作路径操作数在册）；§6.60 只引了人格档 `:30` | 引用面补这两条，选形依据即从「外部先例」升为「本档已裁定」 |
| 8 | 档位 | 🔵 | 数量面：`thincoder-core/tool-docs/advisor.md` 35 行、`docs/core/design/PROMPT-SYSTEM.md` 5,482 行——后者靠纯 `.md` 豁免才不触 800 硬顶，结论行本身成立但非无条件可复算 | 结论行注明豁免依据（设计档非代码档），免得被读成「测量通过」 |

**计数**：🔴 1 · 🟡 4 · 🔵 3

**VERDICT: changes-required**

（未调 `batch status` 写「评审通过」——本轮不通过，写该状态行即失实。）

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
