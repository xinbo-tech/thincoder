# spawn 排队纪律（提交即走）· 批次记录（2026-09-11）

> **搬迁注记（LEDGER-SELF-CONTAINED 批——拆分）**：本档对端（VSC）份已由 VSC 仓 `docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE（VSC 仓）` 逐字承载（D10——零改写）；本档保留本仓份。
> 移出条目（对端份）清单：§2 落点 VSC 2 档 + 2 测试档分端（as-of `:41`–`:42`）——条目计数（对端份 / 本仓份）= 4 / 2（判据 = `docs/design/LEDGER-SELF-CONTAINED.md` §8.3 拆分表）。

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 16:47「**你应该用调度器去排队而不是自己管排队，最好能在提示词里也说明一下**」。

---

## §1 讨论（主 agent）

### 一、问题（用户裁定 + 父侧实证）

- **父侧行为缺陷**：手工管队列（逐档放行 / 自记 coder 队 / 因池满而叙述等待）——**调度器（`files`/`dependsOn`）与并发池本就是接管排队的机制**（AGENT-LOOP.md **§10 + §11**——现行锚；原写 §24 为重排前旧锚，作废）。
- **提示词现状（16:48 实测 grep）**：
  - `discipline-engineering.md` **双端已有**「Declare spawn scheduling metadata in task briefs」段（CLI :197-203 / VSC :198-200）——但缺「**不手工管队列**」的正面句；
  - `persona-engineering.md`：VSC 端有该段（:70-79）；CLI 端零命中（端注：per-role-domain pools 段为 VSC 特有——本批**不强行对称**，主落点 = discipline 双端）。

### 二、落修内容（主 agent 内容权——草稿句）

在双端 `discipline-engineering.md` 的调度段补一条（语义同源、各端措辞自定）：

> **提交即走——排队是机制的职责**：spawn 一律带 `files`/`dependsOn` 后**直接提交**——域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；**不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。父侧只读状态（status/observe），不模拟调度器。

（VSC `persona-engineering.md` 对位段同步加等价句；CLI 端 persona 保持不对称不引入。）

### 三、状态

**讨论收敛 2026-09-11 16:47**（用户指令）。下一步 = §2 批次任务（eng-designer：定落点 + 机验断言）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

### 批次任务（eng-designer 自写 · 2026-09-11）

**状态（三态推进）**：① 任务书就绪（本段）→ ② 设计就绪待评审（发起权在用户——评审经 `batchDoc` 传本档 → 写本档 §3）→ ③ 批准后 spawn eng-coder（设计 token 门）。实施者 = eng-coder（提示词落笔）；设计文档面 = eng-designer（本设计轮已落）。

**落点（3 档——纯插入，各 +1 行）**：
- `thincoder/src/prompts/discipline-engineering.md` —— Multi-Task 调度段：插入锚 = 含 `**Keep the concurrency cap` 的行（as-of :205）之前；
- `thincoder-vscode/src/prompts/discipline-engineering.md` —— 同款锚（as-of :206）之前；
- `thincoder-vscode/src/prompts/persona-engineering.md` —— Multi-Task 对位段：同款锚（as-of :81）之前（即 R14 段后）。

**CLI persona 明示不引入（不对称理由）**：CLI `src/prompts/persona-engineering.md` 端无 Multi-Task/调度对位段（实测零 `Multi-Task`/`Declare spawn`——CLI 该块宿主 = CLI de）；VSC pe 的 Multi-Task 段为 VSC 端特有端段（锚#7 断言宿主 = VSC pe）。端差零新增——不强行对称。

**本批条目（来源 = 本档 §1 草稿句；逐条机验回指见「机验断言」）**：
① spawn 一律带 `files`/`dependsOn` 后**直接提交**；
② 域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；
③ **不手工记队列、不逐档放行、不因冲突/池满而推迟提交**；
④ 父侧只读状态（status/observe），不模拟调度器。

**三方条目一致**：本段条目 ①–④ = 本段机验断言表的回指对象 = **需求档条目**（`docs/requirements/PROMPT-SYSTEM.md` §2.5 纪律层「spawn 排队纪律」条——修正轮补，2026-09-11）= 设计档变更注记所载语义（`docs/design/PROMPT-SYSTEM.md` 变更记录——本端，已落 + 修正轮注记；`thincoder-vscode/docs/design/VSC-PROMPTS.md` 变更记录——对位，已落）。

**微批口径（设计档记录形态）**：单方案（本档 §1 草稿句 = 唯一来源——无选型对比，豁免声明）；无接口/UI 面（提示词文本）；关键决策 = 落点 3 档 + 插入锚（cap 行前）+ 不对称裁定（见上）+ 修正轮增项（锚防护 3 套件——文件表 #4–#6；位置机验 T-SQ7）。

#### 1. 目标与为什么

用户 16:47 指令（本档 §1）：「用调度器去排队而不是自己管排队，最好能在提示词里也说明一下」。
双端提示词已有「Declare spawn scheduling metadata in task briefs」段（声明 `files`/`dependsOn` 后由调度器排队），**缺「不手工管队列」的正面句**——父侧手工管队列（逐档放行 / 自记 coder 队 / 因池满而叙述等待）无文本约束。
本批 = 补该正面句。机制权威 = `docs/design/AGENT-LOOP.md` §10（子代理任务调度器——「父代理只声明域与依赖、提交即走」）+ §11（分域池）——提示词文本对既有机制术语的传播。

#### 2. 已知事实（已勘察——不重复勘察）

- 落点现状（as-of 2026-09-11 16:50 实测）：CLI de :197-204 =「Declare…」块（:204 = `Directory declarations…`，:205 = cap 行）；VSC de :198-205（:205 = `Directory declarations…`，:206 = cap 行）；VSC pe :70-77（:77 = `Directory declarations…`，:78-80 = R14 段，:81 = cap 行）。
- **唯一插入锚 = cap 行**（含 `Keep the concurrency cap`——三档各 1 次、逐字同文）；`Directory declarations are NOT supported` 句在 de 双档出现 2 次（实测行序：「实施委托结构化」段在前——CLI :173 / VSC :174；Multi-Task 段在后——CLI :204 / VSC :205）——**不得**以它为唯一锚。
- 等价句既有：双端 dn 已有「never hand-serialize what the scheduler queues」（CLI dn :139 / VSC dn :116）——本批不触碰 dn。
- **CN 权威档零改**：`docs/design/prompts/discipline-engineering.md` 双端无该调度段（实测零 `Declare spawn`、零 `Multi-Task`）；VSC CN pe :50 已声明「中文镜像不含该节（机制正文在英文落地）」——CN 零改与既有镜像差异声明一致。
- 零损守（既有断言——全 `includes()` 形态，纯插入不动）：CLI `test/prompts-async-guidance.test.mjs:126`（de 调度器句）· VSC 同档 :114（pe 同句）· VSC `test/prompts-mirror-anchors.test.mjs:148-149`（CN de 端段句）· CLI `test/prompts-dual-source.test.mjs`（de 双源字面 + 头注 + 位序）。
- 行数（内容行口径——实测）：CLI de 213 · VSC de 221 · VSC pe 86；落定预计各 +1。均在档位内——无拆分触发。

#### 3. 落笔文本与插入细则（唯一来源 = 本档 §1 草稿句——逐字）

落笔行（唯一格式级微调 = 行首 `- ` bullet 前缀——注明；其余逐字、单物理行、行尾 `。`）：

```text
- **提交即走——排队是机制的职责**：spawn 一律带 `files`/`dependsOn` 后**直接提交**——域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；**不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。父侧只读状态（status/observe），不模拟调度器。
```

（本档 §1 许可「各端措辞自定」；本批主 agent 落笔口径 = 逐字照落——取更严口径，三档同文。）

| # | 文件 | 插入锚（as-of——落笔首步现场复核） | 落定 |
|---|------|----------------------------------|------|
| 1 | `thincoder/src/prompts/discipline-engineering.md` | cap 行（:205）之前；上一行 = `Directory declarations…`（:204——取 cap 前那处） | 新行 = :205；cap 顺延 :206；213 → 214 |
| 2 | `thincoder-vscode/src/prompts/discipline-engineering.md` | cap 行（:206）之前；上一行 = `Directory declarations…`（:205） | 新行 = :206；cap 顺延 :207；221 → 222 |
| 3 | `thincoder-vscode/src/prompts/persona-engineering.md` | cap 行（:81）之前；上一行 = R14 段末（:80——`agent.poolLimits` 行） | 新行 = :81；cap 顺延 :82；86 → 87 |
| 4 | `thincoder/test/prompts-async-guidance.test.mjs` | 锚#7 测试体（:124-127——:126 = de 调度器句断言，本档 §2:68 所引守卫）——新增断言行插于 :126 后 | +1 断言行：`assert.ok(de.includes(SQ_LITERAL), "锚#7 提交即走句缺失（CLI 宿主 de）")`；419 → 420 |
| 5 | `thincoder-vscode/test/prompts-async-guidance.test.mjs` | 锚#7 测试体（:112-115——:114 = pe 同句断言，本档 §2:68 所引守卫）——插于 :114 后 | +1 断言行：`assert.ok(pe.includes(SQ_LITERAL), "锚#7 提交即走句缺失（VSC 宿主 persona-engineering）")`；452 → 453 |
| 6 | `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` | ⑥ GROUPS（:212-216——本档 §2:68 所引镜像套件）——新组条目插于组 2（:215）后 | +1 跨仓组（组 3）：`{ id: "组3 提交即走句 en↔en", files: [SRC + "discipline-engineering.md"], literals: [SQ_LITERAL] }`（组内 cli/vsc 两侧断言）；组清单同步 = 测试名 + 头部注释；318 → 319 |

**测试档锚防护（修正轮新增——文件表 #4–#6；各 +1 条 includes 断言/组）**：断言字面 SQ_LITERAL = 上框落笔行**逐字**（含行首 `- ` 前缀——与 T-SQ1 全文判据同串）；分发按本档 §2:68 所引既有守卫；CLI `prompts-dual-source.test.mjs` 零改（EN-only 新句不属双源对断言面——既有断言保持绿）。

**禁止范围**：不触碰提示词既有行（纯插入——提示词 3 档 diff 必须 `+1 −0`）；不动 R14 段 / cap 行 / 锚#1–#7 句；不改 CN 权威档与 CLI persona、双端 dn；新行零维护者注（无日期/批次号/评审号/设计标注）；测试档改动限文件表 #4–#6（各 +1 断言行/组——VSC ma 组清单同步；其余测试档零改）；不 commit（父侧收口）。

#### 4. 机验断言（用例三态：正常 / 边界 / 错误 + 回归——全部可机跑）

| # | 态 | 判据（机器可验证） | 核法 |
|---|----|-------------------|------|
| T-SQ1 | 正常 | 3 档均逐字含落笔行全文（上框）且含 4 关键子串：`提交即走` · `不手工记队列` · `不逐档放行` · `不因冲突/池满而推迟提交` | 读 3 档 includes（全文 + 子串） |
| T-SQ2 | 正常（跨仓） | 两仓 grep `提交即走`（`src/prompts/`）命中集 = 文件表 #1–#3（且仅这 3 档） | grep `src/prompts/`（两仓） |
| T-SQ3 | 边界 | 负断言：CLI `src/prompts/persona-engineering.md` 零 `提交即走`（不对称按设计）；`docs/design/prompts/`（双端）零 `提交即走`（CN 零改） | grep 负断言 |
| T-SQ4 | 边界（零损） | 3 档 diff = 纯插入（`git diff --numstat` 每档 `1 0`）；既有锚串仍驻留：`Declare spawn scheduling metadata in task briefs` · `overlapping domains are queued by the scheduler, never hand-serialized` · `Keep the concurrency cap: at most 4 concurrent eng-coders`（VSC 档加 `per-role-domain pools`） | numstat + grep 正断言 |
| T-SQ5 | 错误（卫生） | 新增行零维护者注：无 `\d{4}-\d{2}-\d{2}` / `第\s*\d+\s*批` / `评审 #` / `【` 标注 | 扫新增行（正则） |
| T-SQ6 | 回归 | 锚套件全绿（本批测试档改动后——文件表 #4–#6 新版在场）：CLI `node --test test/prompts-async-guidance.test.mjs test/prompts-dual-source.test.mjs`；VSC `node --test test/prompts-async-guidance.test.mjs test/prompts-mirror-anchors.test.mjs` | 运行（输出长先落盘后查） |
| T-SQ7 | 正常（位置——修正轮） | 逐档断言新行位置 = cap 行位置 − 1（其上一行 = 两 de 档 `Directory declarations…` 行——cap 前那处 / VSC pe `agent.poolLimits` 行） | 逐档行数组：lines[capIdx-1] 含 `提交即走`；lines[capIdx-2] 含 `Directory declarations`（de 双档）/ `agent.poolLimits`（VSC pe）——capIdx = 含 `Keep the concurrency cap` 的行索引 |
| T-SQ8 | 正常（锚防护——修正轮） | 3 套件新增锚断言在位（文件表 #4–#6）：各含 SQ_LITERAL——CLI ag 锚#7 测试 / VSC ag 锚#7 测试 / VSC ma ⑥ GROUPS 组 3 | 读 3 测试档核 SQ_LITERAL 命中 + 套件全绿（与 T-SQ6 同跑） |

**回指**：T-SQ1 ↔ 条目 ①–④（全句驻留）；T-SQ2 / T-SQ3 ↔ 条目 ①–③ 落面 + 不对称边界；T-SQ4 ↔ 零损（既有段）；T-SQ5 ↔ 文本卫生；T-SQ6 ↔ 回归；T-SQ7 ↔ 落点位置（cap 行前一行——文件表落定列）；T-SQ8 ↔ 锚防护（条目 ①–④ 长期驻留——文件表 #4–#6）。

**落笔前置（顺序不跳）**：① 三档锚行现场复核（cap 行存在且唯一；de 双档 `Directory declarations…` 2 处——以「cap 行前那处」为定位口径）；② 行数按现场重测（差异以现场为准）；③ T-SQ6 套件改动前先跑基线（如有既存 fail——登记并区分他链在途 vs 本批引入）。

#### 5. 交付报告格式

三值表（Done / Simplified / Not done——逐条目 ①–④）+ 6 档改动清单（提示词 3 + 测试 3——文件表 #1–#6）+ T-SQ1–T-SQ8 运行输出 + `git diff --numstat` 证据 + 「提示词改动需 reload 会话后生效」声明 + 偏差如实披露（超声明 = 披露即可）。§5 由 eng-coder 自写。

#### 6. 就绪状态与父侧排程项

- 任务书就绪；**设计待评审**（发起权在用户）。
- 父侧排程件：实施 spawn 的 `files` 声明 = 文件表 #1–#6（提示词 3 + 测试 3——file 级）；收口核销 + 三态核销；如需池/需求档登记 = 父侧裁定（任务书未列）。
- 实施拆分：单 coder 6 档即可（提示词 3 行 + 测试 3 处；CLI/VSC 两面并行非必需）。

### 修正轮落档（eng-designer 自写 · 评审轮次 1 后——2026-09-11）

> 父侧裁定 5 条（🟡#1/#2/#3 + 🔵#6/#7 = 修；🔵#4/#5 = 维持不改）；以下逐条落点，§2 上文各处已就地修订。

- **🟡#1 三方一致第三腿**：需求档 `thincoder/docs/requirements/PROMPT-SYSTEM.md` §2.5 纪律层补「spawn 排队纪律」条（+ 变更记录一行）；设计档 `thincoder/docs/design/PROMPT-SYSTEM.md` 变更记录 +1 行（修正轮注记）；本段「三方条目一致」同步改写（第三腿 = 需求档条目）。
- **🟡#2 位置机验**：用例表补 T-SQ7（新行 = cap 行位置 − 1；其上一行 = 两 de 档 `Directory declarations…` / VSC pe `agent.poolLimits`）+ 回指同步。
- **🟡#3 锚防护**：文件表 #4–#6（测试档 3 套件各 +1——CLI/VSC `prompts-async-guidance` 锚#7 测试 + VSC `prompts-mirror-anchors` ⑥ 组 3 跨仓 en↔en）+ 用例表 T-SQ8 + 禁止范围红线行修订（D3）。
- **🔵#6**：T-SQ5 的 `第 N 批` → `第\s*\d+\s*批`（可机跑模式）。
- **🔵#7**：已知事实第 2 条第二处序数改正（实测行序：「实施委托结构化」段在前——CLI :173 / VSC :174；Multi-Task 段在后——CLI :204 / VSC :205）。
- **🔵#4 / 🔵#5** = 维持不改（父侧裁定——未动）。

## §3 设计评审（评审子代理）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 / 文档链（协调项） | 🟡 | 需求层零改属声明（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:52`：「需求档 docs/requirements/PROMPT-SYSTEM.md 本批零改（微批——需求来源 = 本档 §1 用户指令）」）——「三方条目一致」（`thincoder/src/prompts/discipline-engineering.md:36`）第三腿（需求档条目）留空；`docs/README.md` §3.4 写「需求谈清由 eng-designer 抽入 requirements/」「批次记录不代替需求文档——需求永远在 requirements/ 里成文」，快车道口径 =「no step cut」（`thincoder/src/prompts/discipline-engineering.md:180`）。属协调项，非实现阻塞。 | 父侧裁定（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:111` 已预留「如需…需求档登记 = 父侧裁定」）：确认微批豁免并在 §6 留痕，或登记一行需求条目/注明所依托的既有条目。 |
| 2 | 验收标准（落点位置） | 🟡 | 「cap 行之前」的位置要求（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:83-85`）无机验覆盖：T-SQ1（整行 includes）、T-SQ2（grep 命中集）、T-SQ4（numstat `1 0` + 锚串驻留）、T-SQ5、T-SQ6 在「行落在文件任意位置（如追加到文件尾）」时仍全绿——位置要求目前只靠交付报告 diff 的人工阅读。 | 补一条可判检查：逐档断言新行位置 = cap 行位置 − 1（或断言其上一行 = 两 de 档的 `Directory declarations…` 行 / VSC pe 的 `agent.poolLimits` 行）。 |
| 3 | 测试 / 持久防护 | 🟡 | 新句将成 3 档长期行为锚，但本批声明「零测试档改动」（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:87`）——无 fail-when-unchanged 断言防守，与项目提示词锚防护机制（`thincoder/src/prompts/discipline-engineering.md:87-89`「一致由同源设计 + 各端独立语义锚断言守」）不一致；设计所引既有守卫（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:68`）只覆盖邻句而非新句。 | 可把新句加入既有各端锚套件（各 +1 条 includes 断言），或记一条跟进；鉴于本批声明的零测试档口径，由父侧裁定。 |
| 4 | 文档归属（D2 复核） | 🔵 | D2 核查结论：草稿句与既有调度段**无矛盾**。部分语义重叠（限同节内）：元数据子句（`thincoder/src/prompts/discipline-engineering.md:197` / `thincoder-vscode/src/prompts/discipline-engineering.md:198` / `thincoder-vscode/src/prompts/persona-engineering.md:70`）与「overlapping domains are queued by the scheduler, never hand-serialized」（`thincoder/src/prompts/discipline-engineering.md:199` / `thincoder-vscode/src/prompts/discipline-engineering.md:200` / `thincoder-vscode/src/prompts/persona-engineering.md:72`）；无跨档漂移面，属可接受的行为强化。`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:59`「缺正面句」表述略强（`:66` 已承认 dn 等价句；never hand-serialized 已覆盖部分语义）。 | 无需改动（用户明确要求该文本）；如日后要精简，重叠处是裁点。 |
| 5 | 清晰度 / 精度 | 🔵 | 新句通述「域冲突由调度器排队」「不因冲突/池满而推迟提交」未带 async 限定——既有邻句（`thincoder/src/prompts/discipline-engineering.md:198` / `thincoder-vscode/src/prompts/discipline-engineering.md:199` / `thincoder-vscode/src/prompts/persona-engineering.md:71`）为「sync spawns conflicting on files error out (not queued)」。默认 async eng-coder 流程无冲突；sync 冲突子场景仍是报错非排队。 | 可不改（邻句仍保留完整语义、相距 2 行）；如需可加 async 限定——父侧酌定，非阻塞。 |
| 6 | 验收标准（T-SQ5） | 🔵 | T-SQ5 的「`第 N 批`」为口语占位（`thincoder/docs/batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:97`）——字面机跑匹配不到「第 3 批」；「全部可机跑」口径下需具体模式。落笔行本身不含任何被扫形态（已核）。 | 脚本化 T-SQ5 时具体化（如 `第\s*\d+\s*批`）。 |
| 7 | 抽检 / 表述精度 | 🔵 | 抽检记录（全对）：cap 行锚三档各 1 次、逐字同文（`thincoder/src/prompts/discipline-engineering.md:205` / `thincoder-vscode/src/prompts/discipline-engineering.md:206` / `thincoder-vscode/src/prompts/persona-engineering.md:81`）；as-of 行号与行数（213/221/86）与 §2 全符；`Directory declarations…` 2 处行序（:173/:204、:174/:205）已核；§2 落笔行 = §1 草稿句逐字 + 声明的 `- ` 前缀；`提交即走` 三档零命中（grep）。一处表述瑕疵：`:65`「（第二处 = 「实施委托结构化」段）」与实测行序相反——该处实为前一出现（`thincoder/src/prompts/discipline-engineering.md:173` / `thincoder-vscode/src/prompts/discipline-engineering.md:174`），Multi-Task 内那处在后（:204 / :205）。 | 序数改「另一处」或对调即可——纯表述；操作结论（非唯一 → 以 cap 行为唯一锚）已验证正确。 |

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 4（合计 7）

## §4 用户批准（主 agent 记）

_（待记——主 agent）_

**2026-09-11 17:30 父侧代签**——用户 16:40「自动推进到全完成」授权窗口；三条件齐备：轮次 1 pass（🔴0·🟡3·🔵4）+ **修正轮 5/5 落修 + 父侧核验通过**（需求条目/设计注记/T-SQ7/T-SQ8/字数/序数——逐条抽核 ✓）+ **token 已签发**（值不落档）。

**批准范围**：3 档提示词（CLI de / VSC de / VSC pe——§1 草稿句逐字）+ 锚套件测试（CLI/VSC `prompts-async-guidance` 各 +1 断言 · VSC `prompts-mirror-anchors` ⑥ 组——§2:86-88 分派）+ 需求档/设计档已落面。

**父侧裁定随签**：① #161 两项判断（CLI `prompts-dual-source` 不分派——EN-only 句不构成双源对；VSC-PROMPTS.md 零动——D2 单一权威源指向 CLI 档）＝ 维持；② 实施者 = eng-coder（提示词落笔权）。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### 实施记录（eng-coder 自写 · 2026-09-11）

**交付摘要**：本批 6 档全部落地——3 档提示词纯插入落笔行（照 §2:76 逐字，三档同文）+ 3 测试档锚防护（SQ_LITERAL 定义 + 断言/组）。T-SQ1–T-SQ8 内容级全过；两仓定向套件绿（CLI 60/60 · VSC 55/55）；快层零本批引入回归。落笔行 = §2:76 逐字（含行首 bullet），三提示词档与三测试档共用同串（跨 6 文件逐字核对通过）。

**条目三值表（①–④ 全 Done；无 Simplified / Not done）**

| 条目 | 状态 | 证据 |
|------|------|------|
| ① files/dependsOn 声明后直接提交 | Done | 落笔行「后**直接提交**」 |
| ② 域冲突由调度器排队（queued + position）、池满由池排队 | Done | 落笔行同句 |
| ③ 不手工记队列、不逐档放行、不因冲突/池满而推迟提交 | Done | 落笔行同句 |
| ④ 父侧只读状态（status/observe）、不模拟调度器 | Done | 落笔行尾句 |

**6 档改动清单（前态快照 ↔ 现场）**

| # | 文件 | 落点（现况） | 本批增量 |
|---|------|--------------|----------|
| 1 | thincoder/src/prompts/discipline-engineering.md | 新行 :208（cap :209） | +1 −0（纯插入；重建核验） |
| 2 | thincoder-vscode/src/prompts/discipline-engineering.md | 新行 :209（cap :210） | +1 −0 |
| 3 | thincoder-vscode/src/prompts/persona-engineering.md | 新行 :81（cap :82） | +1 −0 |
| 4 | thincoder/test/prompts-async-guidance.test.mjs | SQ_LITERAL :53 · 断言 :131 | +2 −0 |
| 5 | thincoder-vscode/test/prompts-async-guidance.test.mjs | SQ_LITERAL :41 · 断言 :116 | +2 −0 |
| 6 | thincoder-vscode/test/prompts-mirror-anchors.test.mjs | SQ_LITERAL :210 · 组 3 :217 · 组清单同步 :15/:200/:212 | +5 −3 |

numstat（快照 ↔ 现场，`git diff --no-index --numstat`）：cli-de 4 0（本批 1 + 他链 3）· vsc-de 4 0（同）· vsc-pe 1 0 · cli-ag 12 11（本批 +2；余为他链重构）· vsc-ag 2 0 · vsc-ma 5 3。

**T-SQ1–T-SQ8 运行输出（机跑）**
- T-SQ1 通过：三档全文含落笔行 + 4 子串（提交即走 / 不手工记队列 / 不逐档放行 / 不因冲突/池满而推迟提交）；三测试档 SQ_LITERAL 与 §2:76 逐字相等。
- T-SQ2 通过：两仓 src/prompts 命中集 = CLI 仅 de、VSC 仅 de+pe。
- T-SQ3 通过：CLI persona 零命中；双端 docs/design/prompts 零命中。
- T-SQ4 通过：三档重建核验 = 纯插入（移除插入行 ≡ 前态快照）；既有锚串 Declare spawn… / never hand-serialized / Keep the concurrency cap / per-role-domain pools 全驻留。
- T-SQ5 通过：新行与新增测试串零维护者注形态（日期 / 第N批 / 评审# / 【】）。
- T-SQ6 通过：CLI `node --test prompts-async-guidance + prompts-dual-source` = 60/60；VSC 同跑（ag + mirror-anchors）= 55/55；
  快层 VSC 483 pass / 0 fail（slow 门 0 拦截）；CLI 快层 545 pass / 2 fail——T41①（doc-consistency 仓库扫描）与 T-20（portability 提示词）
  均他链在途（T-20 断言面 = persona-eng-designer.md 他链文件），非本批引入。
- T-SQ7 通过：逐档 新行 = cap 行 − 1；上一行 = 两 de 档 Directory declarations… / VSC pe agent.poolLimits 行。
- T-SQ8 通过：CLI ag 锚#7（宿主 de）· VSC ag 锚#7（宿主 pe）· VSC ma ⑥ 组 3（en↔en 跨仓）各含 SQ_LITERAL，套件全绿。

**审计与代码评审轮次与终态**
- 探索审计（只读 explore）轮次 1：报 DEVIATIONS ——（a）§5 待写（本段落笔即消解）；（b）CLI ag 他链重构增量归属未定（已按他链披露）。
  逐字 / 位置 / 零损 / 不对称 / 卫生 / 锚防护 / 隔离归因全核过。
- 内部 advisor 代码评审轮次 1：VERDICT pass（🔴 0 · 🟡 1 · 🔵 1）。裁决：🟡 存量文件行数（三测试档本批前即 >300；非 must-fix、维持现状）→ 不修；
  🔵 §2 文件表未计 SQ_LITERAL 定义行（各档实 +2 行 vs 预测 +1）→ 本段对账注记消解（见偏差披露第 1 条）。
- fix round：0 轮（两发现均非 must-fix，无代码修正）。
- 终态：**clean**。

**「提示词改动需 reload 会话后生效」声明**：三档为装配期读取的字节源——改动需重启 / reload 会话生效，对运行中会话零即时影响。

**偏差如实披露**
1. SQ_LITERAL 定义行（每测试档 +1 行）：§2 文件表按「+1 断言行/组」预测，未含定义行；实际各 +2（定义 + 断言/组），VSC ma 另含 3 行组清单同步改写（+5 −3）。
   原因：断言文本以 SQ_LITERAL 标识符引用落笔行字面，无定义行则套件 ReferenceError；定义行落点 = ag 档源码常量块尾 / ma 档 ⑥ 字面表块尾。父侧评审对象声明已涵盖此项。
2. VSC ma 段注 :200 一并同步——设计写「测试名 + 头部注释」，段注同属组清单枚举，按 D3 计数枚举纪律一起同步（枚举共 3 处）。
3. 绝对行号 vs 设计 as-of（205 / 206 / 81）：现场漂移 +3——他链在我前态快照后向双端 de 档插入 3 行块；落点现为 208 / 209 / 81。判据为不变量「新行 = cap 行 − 1」，全符。
4. `git diff --numstat`「每档 1 0」不可得字面证据：文件本批前已多链置脏、批中又有他链写入；改以「前态快照 ↔ 现场」重建 + 逐行归因（本批纯插入部分逐档 1 0 成立，见上表）。
5. 并发他链改动（双端 de 档 +3 行块；CLI ag 重构；CLI 快层用例数批间变化与 slow 门清零 = ledger 族归册）不属本批，已隔离披露；不影响本批判据与位置判据。

**file 域核对**：实际触碰 = 声明 6 档，无域外文件改动；核验用临时快照目录（工作区根 .sq-snap/）已删除。未 commit（父侧收口）。

## §6 验证与收口（父代理自写）

**2026-09-11 17:55 · 父侧收口**

- **交付核验**（父侧抽核实测）：3 档提示词新行 = cap 行 − 1 邻接 ✓（CLI de `:208`/cap `:209` · VSC de `:209`/`:210` · VSC pe `:81`/`:82`——行文本逐字含「提交即走——排队是机制的职责」）；3 测试档 `SQ_LITERAL` 在位；定向测试绿（CLI 60/60 · VSC 55/55——coder 实测）。
- **三方一致**（D7）：批次档 §2 ═ 需求条目（`thincoder/docs/requirements/PROMPT-SYSTEM.md:113`）═ 设计注记（`thincoder/docs/design/PROMPT-SYSTEM.md:396-398`）✓。
- **偏差处置**：① `SQ_LITERAL` 定义行 +1/档 = 披露接受（断言必需）；② 绝对行号漂移（他链 de 档 +3 行块）= 不变量全符、零违；③ 非对称范围（de 双端 + pe 仅 VSC）= 设计原判（VSC persona 端专属段）。
- **核销同步清单**（D7 六项）：角色表——无涉；状态行——需求档 `:113` 条目随本行记录；计数——T-SQ1–8 / 档 3+3 与 §2 一致 ✓；指针——两处落点可达 ✓；变更记录——设计档修正轮注记在档 ✓；待办勾销——**零勾销**（微批，需求池无独立条目）。
- **链终**：designToken 已消费（consume-design）——本批**全链闭环 ✓**。
- **遗留**：提示词 reload/重启后生效（运行中会话零即时影响）；commit 随「扫」批；后续任何改动 = 新评审新令牌。
