# 2026-09-25 · prompt-inflight-ask
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-22 08:05 提问 → 08:11 裁定「可以」（登记 #222）→ 2026-09-25 04:42「那需求池222开始落地吧」——在途提问（提示词面）落地批。
> 台账 = #222（PROMPT-SYSTEM · 归批）。前情 = docs/batches/2026-09-24-busy-queue-visible.md（已收口 2026-09-24）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件与现况（父侧 · 2026-09-25 04:4x · 台账 #222）

**来源**：用户 2026-09-22 08:05 提问「主 agent 的提示词能否充分利用 busy-injection 能力，在执行中向用户提问？」→ 08:11 裁定「可以」（需求登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.2 增补块）→ 2026-09-25 04:42「那需求池222开始落地吧」。

**现况实读（本席 04:4x）**：落点四处全空——`thincoder-core/prompts/persona-engineering.md`（163 行）/ `persona-normal.md`（35 行）/ 模板副本 `docs/core/design/prompts/persona-{engineering,normal}.md`（164 / 30 行）/ `thincoder-core/tool-docs/question.md`（16 行）——「在途提问 / 软转向」全档零命中；`question.md:12-13` 仍只有旧纪律行。**依赖面已交付** = F16 busy 队列（09-24 queue-visible 批：多槽 8 + 合并消费 + **步边界 pickup**——`AGENT-LOOP-ASYNC-POOL.md` §6.8；本批**零触**）。

**射程**（= 需求 §2.2 增补块四功能点）：① persona 双档（运行期 + 模板双副本）写入「在途提问」段（触发条件 / 一句式模板 / 收到 steer 即校正）；② 通道分界（硬门 ⇒ `question` 工具或停下上报；软转向 ⇒ 在途提问；例行确认门仍纯文本）；③ 纪律（一次一问 · 不重复索要 · 默认先行）；④ `tool-docs/question.md` 分界句。

**验收**（承需求）：① 双副本该段在位且逐字一致（UTF-8 扫描 + `prompts-dual-source` 绿）；② **零文档引用**（两界机检族——提示词内不得出现文档名/指路句）+ 机检净增 0；③ 三包全绿；④ 双面语义等价。

**授权**：用户 04:42 直令；全链自动（自缚沿用：评审复出 🔴 / 测试红 / 需新范围 ⇒ 停下上报）。

**边界**：busy 队列机制零动；prompt 文本内容**最终定稿权 = 主 agent**（设计轮给逐字草案，父侧核验时定稿）；已收口批档零触；其他提示词面零扩面。

### 1.3 评审轮 1 与裁定（父侧 · 2026-09-25 04:5x）

**评审 #75 = pass**（🔴0 · 🟡4 · 🔵5 = 9 条 · 发现表在 §3 轮次 1）。**裁定 = 9/9 全收**：

- **① 已由父侧落地**（评审点火前即收正——评审所见系批档 §1 的历史引文，非现况）：需求档 `PROMPT-SYSTEM.md` §2.2 验收① 已改为「四面副本（工程/普通 × 运行期/模板）该段在位；**同语言双副本与其语言面逐字草案全等**（`prompts-dual-source` 绿 + 一次性 UTF-8 逐行比对——非常驻散文锚；跨语言逐字相等不可达）」。
- **②–⑨ → 修正轮（#76）在途**：AC-7 基线相对化 · §2.4 增「变更面归属」列 · 四副本删「现行零变 / unchanged」变更对照残留 + 自查定义扩面 · (D) 标题体例实读实证 · AC-5 基线口径统一 · §2.9/KD-9 补工具描述可见性判定 · 首跑 M1–M3 先行 + 反证针形取自锁判据。

**评审侧核验亮点**（其独立实测）：插入锚两处实读在位 · 行宽自查 96 / 279 与其独立测量一致 · KD-3③/KD-7 均复核成立；运行期三档按声明排除（不可复核）。

### 1.4 全链授权（父侧代点火 + 代批准 · 2026-09-25 05:05）

**用户原话**：「自动跑完吧。」⇒ **全链授权**——设计评审点火权 + §4 批准权（代签）+ 修正轮 / 实施轮派发 + 收口核销提交推送（双远端），均委托父侧自动执行，至本批完结。

**父侧自缚（同本仓先例）**：① 代签仅当「评审 pass（0🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备；② 每次代签在 §4 写明「父侧代签（用户 05:05 授权）+ 依据」；③ 复评若再出 🔴 ⇒ 停下回报，不循环自动修；④ 实施验证不过 / 测试红 / 需新范围或用户口径裁决 ⇒ 停下只摆那一条。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1（#75）修正 9/9 落地——修正块 §2.11 · 草案自查复测已跑（2026-09-25））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与逐条落点

需求源 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.2 增补块（「在途提问」四功能点，需求面**不动笔**——需求档笔权在主 agent）。

| # | 需求条目（§2.2 增补块） | 落点 | 形态 | 插入锚（回读已核） |
|---|---|---|---|---|
| ① | 双档主会话人格写入该段：触发条件（长执行 ∧ 有可先行默认值）+ 一句式模板 + 收到 steer 即校正 | 四副本 = `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/prompts/persona-normal.md` · `docs/core/design/prompts/persona-engineering.md` · `docs/core/design/prompts/persona-normal.md` | 新增 `##` 节（8 行 + 1 空行 = +9） | 紧跟「确认与批准门」节末：工程副本 `:25` 后（运行期与模板同号）· 普通运行期 `:22` 后 · 普通模板 `:18` 后 |
| ② | 通道分界（硬门 ⇒ `question` 工具或停下上报；软转向 ⇒ 在途提问；例行确认门仍纯文本） | 同 ① 段内「通道分界」行（五档同构） | 段内 1 行 | — |
| ③ | 纪律（一次一问 · 不重复索要已授权范围 · 默认先行不空转） | 同 ① 段内「纪律」行 | 段内 1 行 | — |
| ④ | `tool-docs/question.md` 补两通道分界一句 | `thincoder-core/tool-docs/question.md`（**单副本**——工具描述无中文模板：实读 `docs/core/design/prompts/` 仅 prompts 15 档） | +1 行 | 既有「例行确认门」句（`:15`）之后 |

**本条与四功能点的行级映射（实现与核验用）**：L1 标题（段主题）· L2 引导句（长执行不必二选一）· L3 触发条件（①②条同时成立）· L4 一句式模板 · L5 收到 steer 即校正 · L6 默认值不越界（② 导出守卫，见 KD-5）· L7 通道分界（②）· L8 纪律（③）。

### 2.2 设计档落点

- **不新建设计档**（父侧 2026-09-25 裁定）：提示词文本即设计物——**逐字草案落本档 §2.3**（记录面；本批设计 = 文本本体 + 落点 + 机检面，无机制设计）。机制侧零档案变更。
- 常驻参考面 = 本档 §2.3；需求面功能点不动（主 agent 笔）。**变更记录不落提示词**（§4-15 提示词不含维护者注）——本次落笔的说明只在本档。

### 2.3 逐字草案（实现 = 逐字落地，不改字）

**（A）工程档 · 中文正本** —— `docs/core/design/prompts/persona-engineering.md`，插在 `:25` 后、`:27`（`## 调用链…`）前：

```text
## 在途提问（非阻塞软转向——长执行中不必二选一）
**长执行（子代理在飞 / 长链条）中不必二选一「阻塞等人」或「闷头跑完」**：问题随正文流发出，同时给出**可先行默认值**并继续推进。
- **触发条件（两条同时成立）**：① 正处长执行，停下等人的代价明显；② 该问题有**可先行默认值**——带着它继续推进，用户不答也不空转。
- **一句式模板**：「我按 <默认值> 继续（依据 <依据>）；你更想要 <另一选项>，回一句我就切。」
- **收到 steer 即校正**：用户的答话以普通用户消息送达（忙期提交的排队消息在当前步骤结束后生效）——收到即校正后续动作；不打断在飞工具，也不重跑已完成的部分。
- **默认值不越界**：默认值只在已获确认的范围内取值——在途提问不越过批准门，也不扩大范围。
- **通道分界**：硬门（新范围 / 口径裁决 / 不可带默认前行）⇒ `question` 工具（阻塞等答）或停下上报；软转向 ⇒ 在途提问（非阻塞）；例行确认门仍走纯文本。
- **纪律**：一次一问（同 `question` 工具的 ONE-question 纪律）· 不重复索要已授权范围 · 默认先行不空转。
```

**（B）工程档 · 英文运行面** —— `thincoder-core/prompts/persona-engineering.md`，插在 `:25` 后、`:27`（`## Call chain…`）前：

```text
## In-flight ask — non-blocking steer during long runs
**During a long run (subagents in flight / a long chain) you never have to choose between "block on the user" and "push through blind"**: raise the question in your ordinary reply text, state a **workable default**, and keep going.
- **Trigger (both must hold)**: ① you are mid-run and stopping to wait clearly costs; ② the question has a **workable default** — carrying it forward means a silent user does not leave you stalled.
- **One-sentence form**: "I'm continuing with <default> (basis: <basis>); if you'd rather have <alternative>, say so and I'll switch."
- **A steer corrects you at once**: the user's reply reaches you as an ordinary user message (a message queued while you were busy takes effect once the current step lands) — apply it to the work that follows; never interrupt tools already in flight, never re-run finished parts.
- **Defaults stay in bounds**: a default is drawn only from the scope already confirmed — an in-flight ask never crosses the approval gate or widens scope.
- **Channel boundary**: hard gate (new scope / a ruling on a criterion / no default can carry it) ⇒ the `question` tool (blocking) or stop and report; soft steer ⇒ in-flight ask (non-blocking); routine confirm gates stay plain text.
- **Discipline**: one question at a time (the `question` tool's ONE-question rule) · never re-ask for scope already authorized · default first, never idle.
```

**（C）普通档 · 中文正本** —— `docs/core/design/prompts/persona-normal.md`，插在 `:18` 后、`:20`（`## 能力边界`）前：

```text
## 在途提问（非阻塞软转向——长执行中不必二选一）
**长任务（长链条 / 子代理在飞）中不必二选一「阻塞等人」或「闷头跑完」**：问题随正文流发出，同时给出**可先行默认值**并继续推进。
- **触发条件（两条同时成立）**：① 正处长任务，停下等人的代价明显；② 该问题有**可先行默认值**——带着它继续推进，用户不答也不空转。
- **一句式模板**：「我按 <默认值> 继续（依据 <依据>）；你更想要 <另一选项>，回一句我就切。」
- **收到 steer 即校正**：用户的答话以普通用户消息送达（忙期提交的排队消息在当前步骤结束后生效）——收到即校正后续动作；不打断在飞工具，也不重跑已完成的部分。
- **默认值不越界**：默认值只在已获确认的范围内取值——在途提问不越过确认门，也不扩大范围。
- **通道分界**：硬门（新范围 / 口径裁决 / 不可带默认前行）⇒ `question` 工具（阻塞等答）或停下问用户；软转向 ⇒ 在途提问（非阻塞）；例行确认门仍走纯文本。
- **纪律**：一次一问（同 `question` 工具的 ONE-question 纪律）· 不重复索要已授权范围 · 默认先行不空转。
```

**（D）普通档 · 英文运行面** —— `thincoder-core/prompts/persona-normal.md`，插在 `:22` 后、`:24`（`## Main-agent role…`）前：

```text
## 在途提问（in-flight ask — non-blocking steer during long runs）
**During a long task (a long chain / subagents in flight) you never have to choose between "block on the user" and "push through blind"**: raise the question in your ordinary reply text, state a **workable default**, and keep going.
- **Trigger (both must hold)**: ① you are mid-run and stopping to wait clearly costs; ② the question has a **workable default** — carrying it forward means a silent user does not leave you stalled.
- **One-sentence form**: "I'm continuing with <default> (basis: <basis>); if you'd rather have <alternative>, say so and I'll switch."
- **A steer corrects you at once**: the user's reply reaches you as an ordinary user message (a message queued while you were busy takes effect once the current step lands) — apply it to the work that follows; never interrupt tools already in flight, never re-run finished parts.
- **Defaults stay in bounds**: a default is drawn only from the scope already confirmed — an in-flight ask never crosses the confirm gate or widens scope.
- **Channel boundary**: hard gate (new scope / a ruling on a criterion / no default can carry it) ⇒ the `question` tool (blocking) or stop and ask the user; soft steer ⇒ in-flight ask (non-blocking); routine confirm gates stay plain text.
- **Discipline**: one question at a time (the `question` tool's ONE-question rule) · never re-ask for scope already authorized · default first, never idle.
```

**（E）工具描述** —— `thincoder-core/tool-docs/question.md`，插在 `:15`（`- Routine confirmations … Use this tool ONLY when you need the user's decision or input to proceed.`）之后、`:16`（memory 行）之前：

```text
- Ask here when no default can carry the work forward (new scope, a ruling on a criterion) — this blocks; when a reasonable default exists, ask in your ordinary reply text and keep going — a reply arriving while you work steers the work from there.
```

**草案自查（判据单一来源 = `prompt-refs-zero.test.mjs` 导出的 `lineHits`；修正轮复测 2026-09-25）**：五块 **零文档引用命中**（J1/J2/J3 三式）· **零 >300 行**（中文最长 90、英文最长 279、工具行 248）· **零维护者注（日期 / 批名 / 评审号）∧ 零变更对照措辞（现行零变 / unchanged / 相对上一版）**。运行痕迹 = `.thincoder/tmp/inflight-draft-check3.mjs`（scratch，不入 git）。

### 2.4 受影响文件与行数预算（现读数 = 2026-09-25 04:5x 实读）

| 文件 | 现读数 | 变更 | 预计后 | 变更面归属 | 备注 |
|---|---|---|---|---|---|
| `thincoder-core/prompts/persona-engineering.md` | 163 行 | +9 | 172 | 运行期资产面 | 英文运行面（工程模式） |
| `docs/core/design/prompts/persona-engineering.md` | 164 行 | +9 | 173 | 文档面（`docs/**` 设计档） | 中文正本 |
| `thincoder-core/prompts/persona-normal.md` | 35 行 | +9 | 44 | 运行期资产面 | 英文运行面（普通模式）——标题体例实证见下 |
| `docs/core/design/prompts/persona-normal.md` | 30 行 | +9 | 39 | 文档面（`docs/**` 设计档） | 中文正本 |
| `thincoder-core/tool-docs/question.md` | 16 行 | +1 | 17 | 工具描述面 | 单副本 |

**变更面归属（评审发现 3 收正——派单面可判）**：路由表三分枚举 = 产品代码面 / 文档面 / 工程工具面（`docs/core/design/prompts/persona-engineering.md:69`）；两份中文正本落「文档面」支；`thincoder-core/prompts/**`（运行期资产面）与 `thincoder-core/tool-docs/question.md`（工具描述面）在枚举外——两面名 = 父侧 2026-09-25 裁定（本批新增登记）。

**实现轮次切分建议（每轮 files 声明 = 面纯——同轮不跨面）**：

- 轮 1（文档面）files = `docs/core/design/prompts/persona-engineering.md` · `docs/core/design/prompts/persona-normal.md`；
- 轮 2（运行期资产面）files = `thincoder-core/prompts/persona-engineering.md` · `thincoder-core/prompts/persona-normal.md`；
- 轮 3（工具描述面）files = `thincoder-core/tool-docs/question.md`；
- 顺序 = 轮 1 → 轮 2 → 轮 3（英文运行面自中文正本翻译落地——§2.5 双面流程；首跑先行见 §2.5）。

**（D）档标题体例实证（评审发现 5——实读）**：`thincoder-core/prompts/persona-normal.md` 标题为中文混排体例——`:16 ## 确认与批准门（写文件前先确认）` · `:29 ## 系统接口语义（fields this role receives）`；与 (B) 档（纯英文标题）不同构，(D) 标题维持混排形。

**拆档计划**：无（五档均远低于 500 行硬限；最大 173 行）。**触碰面之外零改**：无 `.mjs` 改动、无测试档改动、无机制档改动。

### 2.5 测试面与机检面

**常驻机检（4 条，实现轮收尾全跑）**：

| # | 命令（仓根 = `thincoder/`） | 判据面 | 基线（实测） |
|---|---|---|---|
| M1 | `cd thincoder-cli && npm test` | `prompt-refs-zero.test.mjs`（**T9 实档扫描** = 三面零文档引用锁：`thincoder-core/prompts/**` + `thincoder-core/tool-docs/**` + `docs/core/design/prompts/**`）· `prompts-dual-source.test.mjs`（T-CL1 common 14 节 / AC21 / 维护者注反证）· `prompts-async-guidance.test.mjs`（15 档在位 + 装配矩阵 + 表行 >200） | 818 例 0 红；两档专项 13 例 0 红 |
| M2 | `cd thincoder-core && npm test` | `prompt-files.test.mjs`（槽 15 / 工具描述 24）· `prompt-injections.test.mjs`（注入锚名集合） | 588 例 0 红 |
| M3 | `cd thincoder-vscode && npm test` | VSC 侧镜像（槽文件 / 锚名 / 工具描述） | 953 例 0 红 |
| M4 | `node scripts/doc-check.mjs` | 锚（悬空）+ 行宽（>300）——**扫描域 = `docs/`**（`_archive` / `batches` 排除）⇒ 覆盖两份中文正本，不覆盖核内运行面 | **仓级现为红**：悬空 / 宽行 = 设计轮 5 / 11 → 修正轮复测 **4 / 8**（他批落地已收窄；开跑以当次实测为准）——**均在他档，本批触碰面 0 命中** |

**本批机检判据取「净增 0 + 触碰档 0 命中」**：开跑前记一次 M4 两总数，收尾再记一次——`悬空` 与 `宽行` 两数不得高于基线，且两份中文正本 0 命中。

**首跑先行（评审发现 8——实现轮规程）**：首档落地后**立即整跑 M1–M3**（不等五档齐），**先记录结构面断言结果**（M1 的「装配矩阵」· M2 的「注入锚名集合」）再续落地；红 ⇒ 按 §1 停下条件**上报**（**不就地改测试 / 不就地改断言**），原始输出落 §5。

**一次性验证（不落常驻测试档——见 KD-4）**：node UTF-8 扫描——提取五档新段，与 §2.3 逐字草案逐行比对（全等）+ 打印行数 / 行宽；输出粘进批档 §5。判据同源要求：引用 `lineHits` 导出，**不复制判据字面**。

**零新增用例**：本批不新增 / 不删除任何测试用例（M1–M3 例数守恒：818 / 588 / 953）。

### 2.6 验收对照（AC——逐条回指本批条目与需求验收 ①–④）

| AC | 回指 | 判据（机器可验） |
|---|---|---|
| AC-1 | 功能点 ①（验收①「双副本在位」） | 五档段在位且与 §2.3 草案**逐字全等**（一次性扫描：五档 0 diff；行数 172 / 173 / 44 / 39 / 17） |
| AC-2 | 功能点 ①②③ 内容齐备 | §2.1 行级映射表逐项点名（L3 触发条件 / L4 模板 / L5 校正 / L7 分界 / L8 三条纪律）——主 agent 内容核验 |
| AC-3 | 功能点 ④ | `question.md` 新句在位（一次性扫描命中 1 行）+ 与 `:12`–`:15` 既有纪律不冲突（细读核验） |
| AC-4 | 验收② 零文档引用 | M1 的 `prompt-refs-zero` T9 零命中（扫描域含本批五档）· 全绿 |
| AC-5 | 验收② 机检净增 0 | M4：触碰档 0 命中；仓级悬空 / 宽行两总数不高于基线 = 开跑前实测两总数（修正轮复测 4 / 8——设计轮 5 / 11 已随他批落地收窄；开跑以当次实测为准） |
| AC-6 | 验收③ 三包全绿 | M1 / M2 / M3 全绿（818 / 588 / 953；零新增用例） |
| AC-7 | 验收④ 双面语义等价 | 中英两面逐条同构（L1–L8 一一对应；差异仅 = 各面语言与两处模式语境措辞，见 KD-3）；以实现前快照为参照，本批五档均在差异集内，且差异集无本批预期外的文件 |

### 2.7 案例表（正常 / 边界 / 错误）

| # | 类 | 输入 / 动作 | 期望 |
|---|---|---|---|
| C1 | 正常 | 落地后跑 M1 | 全绿（T9 零命中 + 双源 13 例 + 装配矩阵）；例数 818 不变 |
| C2 | 正常 | 落地后跑 M2 / M3 | 全绿（588 / 953；槽 15 / 工具描述 24 守恒） |
| C3 | 正常 | 落地后跑 M4 | 触碰两档 0 命中；悬空 / 宽行 ≤ 开跑前实测两数（修正轮复测 4 / 8） |
| C4 | 边界 | 临时超长行（≥301 字符）落**一份中文正本**（M4 扫描域内——运行期面不在其域） | M4 行宽报红（相对当次读数 +1）⇒ 证明行宽面覆盖正本档；撤回后回绿 |
| C5 | 边界 | 临时行载 T9 判据**自身夹具族样本**（J1 `AGENT-LOOP.md` · J2 `§11.2` · J3 `common.md`——样本实读自 `prompt-refs-zero.test.mjs` T1 / T7） | M1 的 T9 逐 token 报红（三式各 1 条）⇒ 证明零引用锁覆盖新文本；撤回后回绿 |
| C6 | 错误 | 某档新段缺失 / 与草案不一致 | 一次性扫描报出该档 diff（实现轮修至 0 diff 才可交） |
| C7 | 错误 | 段内出现维护者注（日期 / 批名 / 评审号）或变更对照措辞（现行零变 / unchanged / 相对上一版） | 违反提示词编写纪律 §4-15；一次性扫描附带负向正则扫（可选加跑） |

**反证窗口纪律（评审发现 9——收尾执行）**：C4 / C5 两针**同窗同档投放**（一次临时改动、一次撤回）；红 / 绿两次输出（M4 / M1 各一轮）落 §5；反证排在收尾、**窗口内不与他批跑测并行**（临时红有被他批读作红线的风险）；撤回后以 **0 diff** 复核（该档变更集干净 ∧ M4 两数复位）。

### 2.8 关键决策记录

- **KD-1 段形态 = 独立 `##` 节**（不并入「确认与批准门」节）。理由：三通道（硬门 / 例行确认门 / 软转向）需并列自足；确认门节语义保持现行零变；节标题给模型视觉锚（§4-10）。落点紧跟确认门节 = 三通道相邻，避免「在途提问 = 加长版确认门」的误读。
- **KD-2 落点锚 = 确认门节末**（工程副本 `:25` · 普通运行期 `:22` / 模板 `:18`）；`question.md` 新句放既有通道句（`:15`「例行确认门」）之后——三条通道陈述连读，且与 `:12`「Use sparingly」同向强化（不与之冲突）。
- **KD-3 双面 = 翻译不是 cp**：中文正本 + 英文运行面各按本面语言与文风逐字落地；两档措辞差异 = ① 引导句（工程「长执行 / 子代理在飞」· 普通「长任务 / 长链条」）② 越界句（工程「批准门」· 普通「确认门」）③ 硬门落荒措辞（工程「停下上报」= 该档既有词汇 · 普通「停下问用户」——普通档无「上报」语域）。**跨档不制造人为差异**（同机制同口径）。
- **KD-4 不落常驻散文锚测试**：读非测试档断言「句子在场」= 散文锚（2026-09-12 退役族；测试纪律禁新增）⇒ 需求验收①的「node UTF-8 扫描」按**一次性验证**执行（输出进 §5），常驻锁靠 M1–M4。
- **KD-5 新增守卫句「默认值不越界」**（L6）：由功能点 ② 直接导出（硬门含「新范围」+ 确认门现行语义），钉死「在途提问 ≠ 绕过确认门」；**非新增语义**——若评审判为超范围，可单行删除而不影响 ①②③ 覆盖。
- **KD-6 逐字文本落 §2**（父侧裁定；同族先例曾落设计档 `TOOLS.md` §6.15.2）：本批不新建设计档；后果 = 定稿文本的常驻面为本档 §2.3（收口后为冻结记录面，仍可读）。
- **KD-7 `question.md` 单副本**：实读 `docs/core/design/prompts/` 仅 15 档 prompts（无工具描述中文模板）⇒ 该句只落核内运行面。
- **KD-8 层归属 = 人格层（主会话双档），不进公共层**：子代理共装公共层 ⇒ 会把「在途提问」塞给「无用户可等」的角色（承 2026-09-17 收正）；确认门既已在人格层 ⇒ 同源通道分界同层。
- **KD-9 机制面零触**：文本只写事实句（排队消息届时生效 / 收到即校正）——不写容量、pickup 实现细节、不进机制档名（机制单源 `AGENT-LOOP-ASYNC-POOL.md` §6.8 不动）。

### 2.9 边界（本批不做）

busy 队列机制零动（queue / 核 / `AGENT-LOOP-ASYNC-POOL.md` 零触）· 不新增工具 · 不替代确认门与硬门 · 子代理无此通道（仍「无用户可等」）· 其他提示词面零扩面（`common.md` / 子代理 persona / 两档纪律层 / advisor 族）· 需求档不动笔（主 agent 笔）· 本档 §1 零触 · 已收口批档零触 · 不新增机械门。

**(E) 句可见面判定（评审发现 7——实读取证）**：

- **可见**：`question` 住核内静态内置表（`tools/index.mjs:19-27`，无深度 / 角色分支）；子代经 `tools: parent.tools` 继承（`agent-tools/subagent-actions.mjs:411`）——探 / 规子代的只读过滤后 `question` 仍在其列（该档 `readonly: true`；`agent-tools/subagent-spawn.mjs:253-260`）。
- **「对无用户角色仍自洽」依据**：① 该档既有 `question-ui-face` 注入行本就按无 UI 语境写成（CLI 端值：`headless runs, subagent children` ⇒ returns an error instead of asking——`thincoder-cli/src/prompt-injections.mjs:19`）；② (E) 新句与之一向（出口 = 默认值 / 普通回复文本），未向子代理追加「用 `question` 工具」的指令；③ 机械兜底 = 无交互 UI 即抛错（`tools/question.mjs:20`）。
- **与 §2.9 前句的关系**：「子代理无此通道」读解 = 软转向（在途提问）通道不入子代理面（KD-8 层归属）——与工具描述档的共享可见性无冲突。

### 2.10 上抛项（请父侧裁定 / 记录）

1. **需求验收①「该段在位且逐字一致」的读法**：双副本为**中英两面**（§2.5 双面流程 = 中文正本 → 英文运行面，翻译不是 cp），**跨语言逐字相等不可达**（承 2026-09-17「双源同一字面串」判据失效收正）。本设计按可检读法落地：**各副本与其语言面逐字草案全等 + 双面语义等价**。需求档措辞若要收正（如「各副本逐字落地 · 双面语义等价」），**需求档笔权在主 agent**——本席不动笔。
2. **「node UTF-8 扫描」的常驻性**：本设计判为**一次性验证**（常驻散文锚 = 已退役族，见 KD-4）。若父侧意图为常驻测试，需另裁（与退役判决冲突）；本批不落。
3. **`doc-check` 仓级现状为红**（悬空 5 / 宽行 11——均在他档；且同日另有 2 批在飞：ledger-key-normalize / model-specs-cleanup，4 档未提交改动）。本批 AC 取「净增 0 + 触碰档 0 命中」，**不承诺仓级全绿**；若要仓级绿 ⇒ 属另批范围（他批在飞面）。

### 2.11 评审轮 1 修正块（2026-09-25）

**来源** = §3 轮次 1（评审 #75 · pass · 🔴0 / 🟡4 / 🔵5 = 9 条）；父侧裁定 9/9 全收（§1.3）；处置执行人 = 本席（eng-designer）。**修正轮边界** = 只落本 9 条直接导出项（零新增语义 / 零范围扩写）；需求档 / §1 / 已收口批档 / 提示词现档零触（提示词两档仅**实读**取证）。

| # | 级别 | 落地 | 落点（本档） |
|---|---|---|---|
| 1 | 🟡 | 需求验收① 措辞收正——**已由父侧落地**（需求档 §2.2：四面副本在位 + 同语言双副本与语言面逐字草案全等 + 跨语言逐字相等不可达）；设计面零改 | 需求面（主 agent 笔）——本表记录 |
| 2 | 🟡 | AC-7 末句改基线相对式（以实现前快照为参照 · 五档均在差异集内 ∧ 差异集无本批预期外文件） | §2.6 AC-7 |
| 3 | 🟡 | §2.4 增「变更面归属」列（文档面 / 运行期资产面 / 工具描述面）+ 实现轮次切分建议（面纯 files 声明 · 轮序 = 文档面 → 运行期资产面 → 工具描述面） | §2.4 表 + 切分块 |
| 4 | 🟡 | 四副本 L7 尾句删（「——现行零变」/「— unchanged」）；自查定义扩面（∧ 零变更对照措辞）——复测残留 0 | §2.3 草案 A–D L7 + 自查行 |
| 5 | 🔵 | (D) 标题体例实读实证 = 中文混排（引文两行入 §2.4）——(D) 标题维持混排形 | §2.4 实证块 |
| 6 | 🔵 | AC-5 去硬编码括号，统一「基线 = 开跑前实测两总数」；修正轮复测 4 / 8（设计轮 5 / 11 已随他批落地收窄）——C3 同式收正 | §2.6 AC-5 + §2.5 M4 行 + §2.7 C3 |
| 7 | 🔵 | (E) 工具描述档可见面判定 = 对子代理可见 ∧ 对无用户角色仍自洽（依据 = 静态内置表无深度分支 / 子代继承 parent.tools / 既有 question-ui-face 注入行 / 无 UI 即抛错） | §2.9 判定块 |
| 8 | 🔵 | 「首跑先行」规程 = 首档后即整跑 M1–M3 · 先记结构面断言（装配矩阵 / 注入锚名集合）· 红 ⇒ 上报 + 原始输出落 §5 · 不就地改测试 / 断言 | §2.5 规程块 |
| 9 | 🔵 | C4 / C5 反证针形取自锁自身判据（J1/J2/J3 夹具族样本 · C4 针落 M4 扫描域内 · 同窗同档 · 红绿落 §5 · 0 diff 复核） | §2.7 C4/C5 + 窗口纪律块 |

**复测证据（本席 2026-09-25）**：`node .thincoder/tmp/inflight-draft-check3.mjs` —— 五块草案：引用命中 0 · 对照措辞残留 0 · 最长行 279（<300）；`node scripts/doc-check.mjs` 修正前后同读数 = 悬空 4 / 宽行 8（批次档在其扫描域外——本档修改零新增悬空 / 超宽）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：§2（四功能点落点 + §2.3 逐字草案 A–E + §2.4 受影响文件 + §2.5 机检面 + §2.6 AC + §2.7–2.10）+ 两份中文正本现文（insertion anchors 与既有语域）。

**实测已复核（评审域内）**：① 插入锚两处在位——`docs/core/design/prompts/persona-engineering.md:25`（`- 确认以普通回复文本交付；常规确认门**不用** question 工具。`）后即 `:27 ## 调用链…`；`docs/core/design/prompts/persona-normal.md:18`（同句式）后即 `:20 ## 能力边界` ✓；② 行数与预算自洽——两份正本实读 164 / 30 行 ✓，+9 = 8 行正文 + 1 空行，五档后数 172/173/44/39/17 算术成立 ✓；③ 行宽自查独立实测一致——批档:82 = 96 字符（中文最长）、批档:67 / :93 = 279 字符（英文最长）、无草案行 ≥280 ✓；④ 零命中声明——「在途提问 / 软转向」在两份正本现文 0 命中 ✓；⑤ KD-3③ 成立——「上报」在 persona-normal.md 全档 0 命中，而 persona-engineering.md:51/:89/:135/:136 有「停下上报」✓；⑥ KD-7 成立——`docs/core/design/prompts/` 列目录 15 档，无工具描述中文模板；`**/question.md` 仅核内 1 处（另两处在 `.thincoder/tmp/` 产物面）✓。

**不可复核（本评审域外·声明排除）**：`thincoder-core/prompts/persona-{engineering,normal}.md` 与 `thincoder-core/tool-docs/question.md` 的现文 / 行数（163 / 35 / 16）与标题语域；`prompt-refs-zero` 三式（J1/J2/J3）与 M1–M3 断言的具体形态。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（需求面措辞 · cross-file lag） | 🟡 | 需求验收① 的字面判据「双副本该段在位且逐字一致」（批档:17）在跨语言双面（中文正本 ↔ 英文运行副本）下不可达；设计已上抛并改判读法（批档:178：逐语言逐字 + 双面语义等价），但需求面措辞未同步 ⇒ 验收① 仍不可机检，且与 AC-1（批档:140）形成两条并存口径（doc-state lag） | 随本批落地同步把验收① 措辞收正为「各副本按其语言面逐字落地 + 双面语义等价（`prompts-dual-source` 绿）」——只改判据措辞，不改需求语义 |
| 2 | Acceptance criteria | 🟡 | AC-7 末句「`git status` 差异集 = 本批五档」（批档:146）与 §2.10-3 自陈「同日另有 2 批在飞…**4 档未提交改动**」（批档:180）冲突：收尾时差异集必含他批 4 档 ⇒ 判据按字面不可满足（合规交付会被判红） | 判据改为基线相对式：「以实现前快照为参照，本批五档均在差异集内，且差异集无本批预期外的文件」 |
| 3 | Methodology · Scope coordination | 🟡 | §2.4 五档跨两种变更面：`docs/core/design/prompts/persona-{engineering,normal}.md` 属文档面（`docs/**` 设计档——见 docs/core/design/prompts/persona-engineering.md:69 路由规则的「文档面」支，判据句「文档面派 eng-coder = 违规」），而 `thincoder-core/prompts/**` 与 `thincoder-core/tool-docs/question.md` 在该规则的三分枚举（产品代码面 / 文档面 / 工程工具面）中无可落面；设计面未记面归属 ⇒ 派单合规性无据（coordination item，非缺陷） | 在 §2.4 增「变更面归属」一列（文档面 / 运行期资产面 / 工具描述面），并据此切分实现轮次与每轮 files 声明 |
| 4 | Doc hygiene | 🟡 | 四副本 L7 尾句「——现行零变」/「— unchanged」（批档:56 / 69 / 82 / 95）是相对上一版的变更对照措辞，落在常驻提示词面（提示词读者无基线，「unchanged」无指称）——与 §2.2 自陈纪律「变更记录不落提示词」（批档:43）同族；而 §2.3 自查把维护者注定义为日期 / 批名 / 评审号（批档:105），该类残留不被覆盖 | 删除四副本 L7 尾句（「仍走纯文本 / stay plain text」已表连续）；并把自查定义扩为「无变更对照措辞（现行零变 / unchanged / 相对上一版）」一并扫 |
| 5 | Clarity（证据面） | 🔵 | (D) 标题取中英混排（批档:89）而 (B) 取纯英文（批档:63），差异仅由 §2.4 表格备注「该档标题为中文混排体例」（批档:113）支撑；该档不在评审域 ⇒ 无法复核，且 §2.3-(D) 同时把该档的下一节标题引作 `## Main-agent role…`（批档:86），读感与该备注相反 | 实现前以该档现文行引文复核标题体例（比照 §2.1「插入锚（回读已核）」体例）并把引文补进 §2.4 备注；若该档标题实为英文体例，(D) 标题改纯英文 |
| 6 | Acceptance criteria（数值口径） | 🔵 | AC-5 把基线硬编码为「（5 / 11）」（批档:144），而 §2.5 规定的口径是「开跑前记一次 M4 两总数…不得高于基线」（批档:130）；他批在飞可令两数漂移 ⇒ 两口径并存，紧者胜会因他批漂移误判 | AC-5 去掉硬编码括号，统一写「基线 = 开跑前实测两总数（本次实测 5 / 11）」 |
| 7 | Scope · Consistency | 🔵 | (E) 落 `thincoder-core/tool-docs/question.md`（共享工具描述面），而 KD-8 的层归属理由正是「子代理共装公共层 ⇒ 不塞给无用户可等角色」（批档:169）、§2.9 亦写「子代理无此通道」（批档:174）；该句对子代理的可见性未在评审域内复核（unverified），设计面未记该判定 | 在 §2.9 或 KD-9 补记该句的可见面与「对子代理无害 / 不可达」的判定依据；若子代理同样收到该工具描述，明确其在无用户角色下仍自洽 |
| 8 | Feasibility · Verification | 🔵 | 五档新增 `##` 节对既有结构面断言的敏感性在评审域内不可复核（§2.5 M1「装配矩阵」/ M2「注入锚名集合」，批档:125–126）；而本批边界「无 .mjs 改动、无测试档改动」（批档:117）不能吸收由此产生的红——只剩 §1 的「测试红 ⇒ 停下上报」 | 首档落地后立即整跑 M1–M3，先记录结构面断言结果再续落地；若红，按 §1 停下条件上报并把原始输出落 §5（不就地改测试 / 改断言） |
| 9 | Verification（反证有效性） | 🔵 | §2.7 C4 / C5 的反证以「临时塞 `prompt-files.md`」等具体针形为准（批档:155–156），未钉到锁自身判据（J1/J2/J3）的命中形态——串不中则「报红」不出现，覆盖性结论落空（三式形态不在评审域，unverified）；反证窗口内的临时红亦可能被同期在飞他批读作红线 | C5 的针形取自锁判据自身的命中样本（J1/J2/J3 的匹配串形态），红 / 绿两次输出落 §5；反证排在收尾、窗口内不与他批跑测并行，撤回后以 0 diff 复核 |

**计数**：🔴 0 · 🟡 4 · 🔵 5（合计 9）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准与实施派发（父侧代签 · 2026-09-25 05:0x）

**依据**：用户 04:42「那需求池222开始落地吧」= 全链授权；评审 #75 = **pass**（🔴0 · 🟡4 · 🔵5）；修正轮 #76 = **9/9 落地**（父侧核验：§2.4–§2.11 逐节读毕 · 草案面「现行零变 / unchanged」残留扫描 = **0** ✓ · 机检 4/8 零新增 ✓）。

**三条观测处置**：① 基线漂移 5/11 → 4/8 = 他批落地收窄，已入 §2.5/AC-5/C3 ✓；② VSC 端差措辞 → **入册 #289**（tech_todo · 归批）；③ §1 模板占位行 = 骨架合法行（全档一致），保留。

**需求面**：验收① 收正已落（父侧 04:44，§1.3 在档）。

**批准**：射程 ①–④（四副本 + `question.md`）**批准实施**。

**派发裁定（父侧 · 单轮 5 档）**：按 **D1「提示词 = 主 agent 内容权威 + eng-coder 落地」**——提示词类落地归口 eng-coder（含 `docs/core/design/prompts/**` 两份中文正本；该面在本批非「设计档内容创作」——文本已由设计轮逐字定稿 + 父侧批准）；且五档须**原子落地**（双源机检面防瞬态不对称红）。设计轮「三轮切分」（§2.4）= 面归属记录；派单形式由父侧径裁。

**实施**：eng-coder（initial · token 消费）· files = 五档 · 基线 = 机检 4/8 · 首跑先行（§2.5）+ 反证规程（§2.7）在派单内。

## §5 实施记录（eng-coder）
**状态行**：实施完成（initial 轮 · 五档逐字落地 + 一次性扫描 0 diff + 机检首跑/尾跑 + 反证 C4/C5 红绿闭环）


### 实施摘要（五档 = §2.3 逐字落地 · 零改字）

**落地顺序**：首档 = 核内工程档 (B)——理由：§2.5「首跑先行」要求首档后记录**结构面断言**（M1 装配矩阵 / M2 注入锚名集合），两条断言只读核内档；先落核内档，首跑才是真检验（§2.4 三轮切分 = 面归属记录，父侧已裁派单形式由父侧径裁）→ 续落 A / C / D / E。

| # | 档 | 草案块 | 新段落点 | 行数（前 → 后） | git 差异 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/prompts/persona-engineering.md` | (B) | `:27`–`:34`（段后空行 `:35`；`## Call chain…` 移至 `:36`） | 163 → **172** | +9 / −0 |
| 2 | `docs/core/design/prompts/persona-engineering.md` | (A) | `:27`–`:34`（空行 `:35`；`## 调用链…` 移至 `:36`） | 164 → **173** | +9 / −0 |
| 3 | `thincoder-core/prompts/persona-normal.md` | (D) | `:24`–`:31`（空行 `:32`；`## Main-agent role…` 移至 `:33`） | 35 → **44** | +9 / −0 |
| 4 | `docs/core/design/prompts/persona-normal.md` | (C) | `:20`–`:27`（空行 `:28`；`## 能力边界` 移至 `:29`） | 30 → **39** | +9 / −0 |
| 5 | `thincoder-core/tool-docs/question.md` | (E) | `:16`（`:15` Routine 行后、`:17` memory 行前） | 16 → **17** | +1 / −0 |

行数口径 = 不含尾换行幻影（同 §2.4 现读数 / read 工具行号）；含幻影读数 = 173 / 174 / 45 / 40 / 18。每档 = **8 行正文 + 1 空行**（五档同构）；E = +1 行（Notes 列表续行、无空行）——与预算逐数全等。锚点与 §2.4 实读全等（A/C/D 三档插于确认门节末行的既有空行之后；E 插于既有通道句后）。

### 一次性验证（node UTF-8 扫描 · 判据同源）

runner = `.thincoder/tmp/inflight-landed-check.mjs`（scratch · 不入 git）；判据 = 导入 `thincoder-cli/test/prompt-refs-zero.test.mjs` 的 `lineHits` 导出（**不复制判据字面**）。

- 提取 §2.3 五块草案（```text 围栏按序 A–E）↔ 五档新段**逐行全等：0 diff × 5** ✓
- 行数（去幻影）= 173 / 172 / 39 / 44 / 17（与期望逐数相等）✓
- 段内 + 整档 `lineHits` **零命中**（五档 × 两面全零）✓
- 段内**零变更对照措辞**（现行零变 / unchanged / 相对上一版）· **零维护者注**（日期 / 批名 / 评审号）✓
- 段内零 >300 行（段最长：A 89 · B 279 · C 90 · D 279 · E 248 字符）✓
- 段后空行在位（persona 四档）/ 段后续行非空（E）；块首定位 = A:27 · B:27 · C:20 · D:24 · E:16 ✓

输出（逐行节录）：

```text
草案块数 = 5（期望 5）；块行数 = 8 / 8 / 8 / 8 / 1（期望 8/8/8/8/1）
✔ 块数 5
── A → docs/core/design/prompts/persona-engineering.md
✔ 块首行定位（行号 27） ✔ 逐行全等 0 diff（diff=0）
✔ 行数（去尾幻影）= 173（期望 173；含尾换行 split 计数 = 174）
✔ 段后空行在位（下一行 ""） ✔ 段内 lineHits 零命中（0） ✔ 整档 lineHits 零命中（0）
✔ 段内零变更对照措辞（0） ✔ 段内零维护者注（0） ✔ 段内零 >300 行（段最长 89 · 整档最长 268）
── B → thincoder-core/prompts/persona-engineering.md
✔ 块首行定位（行号 27） ✔ 逐行全等 0 diff（diff=0）
✔ 行数（去尾幻影）= 172（期望 172；含尾换行 split 计数 = 173）
✔ 段后空行在位 ✔ 段内/整档 lineHits 零命中 ✔ 零对照措辞 / 零维护者注
✔ 段内零 >300 行（段最长 279 · 整档最长 981）
── C → docs/core/design/prompts/persona-normal.md
✔ 块首行定位（行号 20） ✔ 逐行全等 0 diff（diff=0）
✔ 行数（去尾幻影）= 39（期望 39；含尾换行 split 计数 = 40）
✔ 段后空行在位 ✔ 段内/整档 lineHits 零命中 ✔ 零对照措辞 / 零维护者注
✔ 段内零 >300 行（段最长 90 · 整档最长 238）
── D → thincoder-core/prompts/persona-normal.md
✔ 块首行定位（行号 24） ✔ 逐行全等 0 diff（diff=0）
✔ 行数（去尾幻影）= 44（期望 44；含尾换行 split 计数 = 45）
✔ 段后空行在位 ✔ 段内/整档 lineHits 零命中 ✔ 零对照措辞 / 零维护者注
✔ 段内零 >300 行（段最长 279 · 整档最长 351）
── E → thincoder-core/tool-docs/question.md
✔ 块首行定位（行号 16） ✔ 逐行全等 0 diff（diff=0）
✔ 行数（去尾幻影）= 17（期望 17；含尾换行 split 计数 = 18）
✔ 段后非空续行在位（"- After receiving an answer about a desi"…）
✔ 段内/整档 lineHits 零命中 ✔ 零对照措辞 / 零维护者注
✔ 段内零 >300 行（段最长 248 · 整档最长 250）
合计：全部通过（0 红）
```

### 机检读数（首跑先行 §2.5 → 尾跑）

**首跑先行**（首档 B 落地后立即整跑 M1–M3，不等五档齐）：

- **M1**（`cd thincoder-cli && npm test`）：**818 例 · 817 pass · 1 fail**。唯一红 = T9 实档扫描 → `thincoder-core/ledger-migrate.mjs:147 §6.1`（**他批在飞档**，归属实测见「差异说明」）。**结构面断言全绿**：`✔ §3.2 装配矩阵：六主链场景槽文件名与顺序 1:1` · `✔ §3.2 装配矩阵：consult = 自含基底不入主链（null 行）` · `✔ §3.2 装配矩阵：assemblePrompt 输出=槽序拼接 + 层序内部锚` · `✔ §3.2 装配矩阵：角色场景人格差异 + 常量导出面 = 六件` · `✔ 新 15 件在位于 prompts 树` · `✔ AC21 新槽文件双源齐备` · `✔ T-CL1 …## 块数 14` · `✔ §2.7 #9 表行 >200 零命中`。
- **M2**（`cd thincoder-core && npm test`）：**588 例 · 588 pass · 0 fail**。结构面：`✔ 锚名集合收窄 = 工具面 2 锚（bash-terminal-face / question-ui-face）` · `✔ prompt slots: 15 files in core` · `✔ tool docs: 24 files in core`。
- **M3**（`cd thincoder-vscode && npm test`）：**953 例 · 953 pass · 0 fail**。`✔ ③ 双源同名集合各 15` · `✔ ⑤ 本端镜像节引用不悬空` · `✔ T-TD-4' 描述面注入值`。

**尾跑**（五档齐 + 收尾）：

| 门 | 读数 | 红线 |
|---|---|---|
| M1 | 818 例 · 817 pass · **1 fail** | T9 ×1（他批 `ledger-migrate.mjs:133 §6.1`——与首跑同一条，行号随他批编辑位移） |
| M2 | **611 例**（基线 588 + 他批新增测试档 23 例）· 608 pass · **3 fail** | 三条**全部**实测归属他批在飞测试档（见「差异说明」）；本批零测试档改动 |
| M3 | 953 例 · 953 pass · **0 fail** | — |
| M4 | `node scripts/doc-check.mjs`：**悬空 4 / 宽行 8** = 开跑前实测基线（4 / 8） | 本批触碰两档（两份中文正本）**全文 0 行命中** ✓ |

口径：AC-5 = 两总数与开跑前实测逐数相等（净增 0）✓；AC-4/AC-6 = 本批五档在四跑全读数中**零命中**，红全部可实测归属他批（父侧裁定 = 基线相对式，实例与判据见「差异说明」）。

### 反证 C4/C5（§2.7 · 同窗同档 · 一次改一次撤）

针形投放于 `docs/core/design/prompts/persona-normal.md` 尾部（临时行 L40 / L41；窗口 = 投放到撤回，其间只跑 M4 + T9 单档，无他跑并行）：

- **C4 针** = `C4PROBE ` + 12×30 个 `x`（**379 字符** ≥301，M4 扫描域内）。
- **C5 针** = `C5PROBE … (AGENT-LOOP.md §11.2) pairs with common.md`——取自锁判据**自身夹具族样本**（J1 `AGENT-LOOP.md` · J2 `§11.2` · J3 `common.md`；实读自 `prompt-refs-zero.test.mjs` T1 / T7）。

**红轮**（两次输出）：

- M4：`✗ 行宽 docs/core/design/prompts/persona-normal.md:40（379 字符）` + `FAIL(行宽): 9 行超 300 字符`——相对当次读数 8 ⇒ **+1** ✓（证明行宽面覆盖中文正本档）；同轮 `悬空 4` 不变。
- T9（`cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs`）：**4 命中** = 三样本逐 token（`AGENT-LOOP.md` / `§11.2` / `common.md` @ `persona-normal.md:41`）**各 1 条** + 他批在飞档一条（`ledger-migrate.mjs:133 §6.1`）✓（证明零引用锁覆盖新增文本；三式形态与 J1/J2/J3 完全一致）。

**撤回 + 0 diff 复核**：

- 撤回后 sha256 = `fd7cf5b3ac6e73669785797682acfbc821206cf62da8cab7dd2f15639594092c` = 投放前（**逐字节 0 diff** ✓）；`git diff --numstat` 该档回 +9 / −0。
- **绿轮**：M4 回 **悬空 4 / 宽行 8**，该档零行命中 ✓；T9 回 8/9 pass——**三样本命中全消**，仅剩他批在飞档一条 ✓。

### 差异说明（他批在飞红 · 归属实测证据 + 裁定口径）

背景：同日他批在飞（ledger-key-normalize / model-specs-cleanup / intent-claims / question-tool-filter 等）与本批跑测同窗——下列归属证据均为**实测**（非推断）：

| # | 红 | 命中（逐条） | 实测归属证据 |
|---|---|---|---|
| 1 | M1 T9（首跑 + 尾跑同一条） | `thincoder-core/ledger-migrate.mjs:147 §6.1`（首跑）→ `:133 §6.1`（尾跑） | 该档**不在本批五档**（T9 失败清单逐条核对：本批五档零命中）；`git ls-files --error-unmatch` 拒（**未跟踪新档**）；birthtime = 05:04:32 · mtime = 05:06:50+（**本席跑测窗口内新建并持续写入**，行号随编辑位移 147 → 133）；会话起点 `git status` 的 untracked 清单不含它（彼时尚未创建）⇒ ledger-key-normalize 批在飞档 |
| 2 | M2 尾跑 ×3 | `test/core-hygiene.test.mjs:121`（因 `test/batch-paths.test.mjs` 的 `./batch-paths.mjs` 导入）· `test/ledger-migrate.test.mjs:165`（T28）· `test/ledger-migrate.test.mjs:198`（T29） | 三处命中面均为他批**新建测试档**：`test/batch-paths.test.mjs` birth 05:09:33 · `test/ledger-migrate.test.mjs` birth 05:10:54 / mtime 05:11:30（**本席 M2 尾跑进行中仍在写**）；`M thincoder-core/test/core-hygiene.test.mjs` 亦在他批改动集 ⇒ 三条红 = 他批未稳态，非本批面 |
| 3 | M2 尾跑例数 588 → 611 | — | 他批新增测试档的用例数（本批**零测试档改动**——git 差异集核对） |
| 4 | M4 尾跑「拟新增 13 → 15 · 候选 22622 → 22693」 | — | 他批文档面推进；**闸态两数（悬空 4 / 宽行 8）未变** = 本批净增 0 |

**裁定口径（父侧 2026-09-25 · 本批实例）**：AC-6「三包全绿」按**基线相对式**执行——「相对实现前基线**净增 0 红** ∧ 任何红必须**可归因本批面**；他批在飞档的瞬时红 = 差异说明（附实测证据：测试名 + 命中路径 + mtime / git 归属），不判本批红」；两条约束：① 归属证据必须实测可取（不许推断）② 收尾复跑若仍有**无法明确归属他批在飞档**的红（含本批五档任何命中 / 归属不明者）⇒ 停下上报，不扩大本规则。本批收尾复跑：**本批面净增红 = 0**；全部红逐条实测归属他批在飞档（上表，约束 ① 满足）；**无归属不明红**（约束 ② 未触发）。

### 上抛项（交父侧）

1. **他批在飞档 T9 红**（`thincoder-core/ledger-migrate.mjs:133 §6.1`，代码面带节号引用）：建议父侧转交 ledger-key-normalize 批收正（其自身门禁亦会命中；属他批面、不属本批射程）。
2. **M2 他批 3 红 + 核例数漂移**（588 → 611）：同源他批在飞；不判本批红，登记供父侧跨批协调。
3. 本批**无设计缺口 / 无锚点偏差 / 无文案相抵**：A–E 逐字 0 diff；五档锚点与 §2.4 实读全等（A/C/D 插于确认门节末行既有空行之后，E 插于既有通道句之后）。

### 审计与代码评审轮次（终态 = clean）

1. **内部 explore 偏离审计（1 轮）**：结论 **CLEAN——四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）均未发现**。独立复核面含：五档 ↔ §2.3 逐字（E 行另有字节闭包证明：1412 B → 1665 B = +253 B = 248 字符 + LF）· 落点 / 行数逐数 · 尾随空白 / CR / NBSP / 零宽全零 · 新文本全仓 grep（仅落五档 + 本批档 + 需求档 + 草稿期 scratch）· 机检日志交叉核对（M1 首/尾 · M2 首/尾三条红实读 · M3 两次 · M4 · 反证红绿）。三条非偏差观察项处置：
   - **O1（AC-6 字面）**：尾跑非「全绿」——四条红逐条实读均在**本批五档之外**（他批在飞档）。处置：父侧裁定（基线相对式）已入本记录「差异说明」；**裁定原文不在 §4**（§4 成文于裁定之前）⇒ 建议父侧 §6 收口时落一句认领（并入上抛项）。
   - **O2（`thincoder-core/prompts/common.md` mtime 落在交付窗口）**：**实测闭合**——`git diff` 零改（内容 = HEAD）；mtime 21:16:45 与核内 `persona-normal.md` 同秒 = M1/M3 常驻用例「§3.4 降级链」的「备份 → 写空 → 恢复」写面（`thincoder-cli/test/prompts-async-guidance.test.mjs` §3.4 ①②），**非本批笔**。
   - **O3（§5 落序叙述 vs mtime）**：A/C/D/E 由同一批 `edits` 调用一次落地（mtime 21:09 归 A/E）；C 的 21:14 = 反证 C4/C5 **撤回**写面；D 的 21:15 ≈ 同 O2 的用例恢复写面——落序叙述与 mtime 不矛盾，以此说明为准。
2. **内部 advisor 代码评审（1 轮）**：**VERDICT pass**（🔴 0 · 🟡 1（协调项 · 非本批缺陷 · 无 must-fix）· 🔵 2）。行 1 = 收尾残留红归属协调（同「差异说明」+ 上抛项，归父侧 §6 面）；行 2 = 五档内容零常驻锁的漂移防线（建议登记技术待办 / 核验清单加一步人工比对）；行 3 = §2.3 围栏块为 AC-1 判据基座——§6 收口**只追加、不改围栏**。
   **评审引证自查（诚实披露）**：评审一条旁证（「旧三档 doc-anchors / check-doc-width / check-ledger 已随 v2 撤除」）经本席复核**不成立**（全仓 `*.{mjs,yml,json}` 零 `check-doc-width` 命中）⇒ 该主张**未采信**；改以本席实测支撑：**行宽闸唯一落点 = `scripts/doc-check.mjs` + `PROJECT-MANIFEST.json:23-25`（`scanDirs=["docs"]` · `lineWidth: 300`）**，核内 prompts 面无行宽闸（对本批结论无影响）。
3. **自修轮次 = 0**（无审计 / 评审导出的必改项）；反证窗口的临时投放已撤回（sha256 恒等复核，见「反证」节）。**终态 = clean**（收敛）。

### 上抛项增补

4. 父侧 §6 收口请落一句**认领基线相对式裁定**（该裁定原文不在 §4，见上 O1）——供后续读者对齐 AC-4/AC-6 的达成口径。

## §6 验证与收口（父代理）

### 6.1 验证与收口（父侧 · 2026-09-25 05:2x）

**验证（父侧独立核验）**：
- 五档落点实读 = 与 §2.3 草案逐字一致（抽读五段 + 相邻节锚）：工程运行面 `:27-34`（`## Call chain` → `:36`）· 工程正本 `:27-34`（`## 调用链` → `:36`）· 普通运行面 `:24-31`（混排标题 · `## Main-agent role` → `:33`）· 普通正本 `:20-27`（`## 能力边界` → `:29`）· `question.md:16` 新行在位（`:15` 例行确认门行与 `:17` memory 行之间）✓；行数 **172 / 173 / 44 / 39 / 17** 逐数相符 ✓。
- 机检（承 §5）：M1 818（本批五档**零命中**；唯一红 = 他批在飞档，归属实测见 §5）· M2 611（3 红均他批新建测试档）· M3 953 全绿 · M4 **悬空 4 / 宽行 8 = 开跑前基线**。
- 反证 C4 / C5：红轮（行宽 8→9 命中本档 `:40` · T9 三样本逐 token 各 1 条）→ 撤回（sha256 恒等 0 diff）→ 绿轮复位（M4 回 4/8）✓ 闭环。
- **裁定认领**（上抛②）：AC-6 按**基线相对式**判定 = 净增 0 红 ∧ 归属实测（无归属不明红）——父侧 05:0x 裁定原文引述在 §5。
- §2.3 围栏块未触（上抛④）✓（§6 为追加，不改判据基座）。

**D7 结算面**：角色表（§1 父侧 / §2 eng-designer / §3 评审 / §4 父侧 / §5 eng-coder / §6 父侧）✓ · 状态行齐 ✓ · 计数（三包 818 / 611 / 953——M2 例数因他批新档增长，本批零增删）· 指针（台账 #222 → 本文档）· 变更记录（需求档 `PROMPT-SYSTEM.md` 验收① 收正 + 五档落地；**产品 CHANGELOG 不触**——发布段未开，与同夜批同口径）· 台账 #222 两段式核销（待核销 → 已核销）· **前批遗留核对 = 无**。

**上抛残留**：① 他批 T9 红（`ledger-migrate.mjs`）→ 已 relay 给 ledger-key-normalize 批（#77）✓；③ 漂移防线 → 入册 **#292**（trigger=归批；**注：不得落常驻散文锚测试**——KD-4 约束，只可流程步或结构级检查）。

**提交**：path-limited（五档 + 需求档 + 本档）+ 双远端推送（见收口提交）。
