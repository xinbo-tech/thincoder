# Advisor 评审收敛协议（ADVISOR-CONVERGENCE）· 设计

> 本档是 advisor 评审收敛机制的**设计权威**：定义「审查 → 修复 → 复审」循环如何**收敛**——要么全部问题确认修复，要么**以失败结论终止**（无机械轮次上限，§3）。
> 轮次提示词与机械执行层（轮次衰减 / citations / guard / 失败结算结论）是本档语义的执行实现；评审契约句以本档为准。
> 需求层指针 = `docs/core/requirements/ADVISOR-CONVERGENCE.md`（该板块需求档——现状绝对路径）。
> 兄弟档：`docs/core/design/ADVISOR-GUARDS.md`（评审链边缘守卫：判定族 / 凭证链 / 引文候选链 / 预算 / 冻结窗口 / 护栏 / 预算跟随 / 加权）·
> `docs/core/design/ENGINEERING-MODE-V2.md`（token / 门禁 / guard 开关 / 信任模型——v1 设计档已归档 `_archive/`）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（异步评审实例机制 · 判定铁律 · 评审对象锚）。
> 权威边界：**同步评审路径 = 本档**；**异步评审路径 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.10**（轮次语义以实例机制落地）；
> **判定铁律 R1–R7 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.19**——与本档**正交**（本档管轮次衰减 / 终止语义——**无机械上限**（§3）；铁律管严重级怎么定）；冲突时以本档轮次表为准。
> 实现载体：轮次提示词（`thincoder-core/prompts/advisor-round1.md` / `thincoder-core/prompts/advisor-round2.md` / `thincoder-core/prompts/advisor-round3.md` / `thincoder-core/prompts/advisor-design.md`——硬加载，缺失即抛错）·
> `thincoder-core/advisor.mjs`（system prompt 轮次选择 / follow-up 构建 / 评审会话组装）· `thincoder-core/advisor/run.mjs`（评审执行与启动拒绝契约）· `thincoder-core/advisor/notice.mjs`（失败结论 / 拒回文案 + 对象标识行单源）·
> `thincoder-core/advisor/loop.mjs`（工具循环：硬墙 / 预算提示 / 结构化尾）· `thincoder-core/advisor/compaction.mjs`（压缩与守卫族）·
> `thincoder-core/advisor/convergence.mjs`（round2+ 收敛消息体）· `thincoder-core/advisor/messages.mjs`（user 消息构建）·
> `thincoder-core/advisor/citations.mjs`（host-verified citations）· `thincoder-core/advisor/history.mjs`（响应表 / 对话背景提取）·
> `thincoder-core/advisor/repos.mjs`（评审范围采集）· `thincoder-core/agent-tools/advisor.mjs` / `advisor-async.mjs`（工具面与异步池）·
> `thincoder-core/agent-tools/advisor-settle.mjs`（结算 / 陈旧判定）· `thincoder-core/agent/record-results.mjs`（工具结果记账）· `thincoder-core/agent/completion.mjs`（完成 guard 推回）。
> 尺寸档位义务（限源 / 测试文件：现量判定尺寸档位、行数与增量不落档）= 纪律层代码结构判据节——文档规范节不承载该义务；核查用的尺寸档位判据数值 = `docs/core/design/DOC-DISCIPLINE.md` §3.10「尺寸档补充登记」（**数值单源**）；评审核查维度行为 = 本档 §9 ∥ §14 ∥ §15 ∥ §16 ∥ §17。

## 1. 目标

独立评审必须在“审查 → 修复 → 复审”循环中**收敛**：要么确认全部问题已修复，要么**以失败结论终止**（失败路径产出「发生了什么 + 下一步」；反复机械失败 ⇒ 停下上报用户——§3）。

- **轮次衰减**：system prompt 按轮次替换（§2 / §4）——ROUND1 全量、ROUND2 验 prior 为主、ROUND3+ 严格只验 prior。
- **无机械轮次上限**：不设会话级轮次计数器、不按计数拒发；失败路径以结论终止、反复失败停下上报（§3）。
- **会话隔离 + 证据机械校验**：每轮 fresh session（旧 read 数据物理不在上下文）+ host-verified citations 机械比对磁盘（§4 / §5）。
- **确定性状态**：轮次 / 失效 / 重置全部由运行状态位决定，**不解析 LLM 输出**（§2 / §6）。

## 2. 轮次定义

### 2.1 轮次表

| 轮次 | system prompt | 检查范围 | 新问题权限 |
|---|---|---|---|
| Round 1 | 代码评审档 / 设计评审档 | 全量审查（评审对象声明 + 范围文件；先读项目指南指向的需求文档） | 任意问题，建立 issue 表 |
| Round 2 | round2 档 | 以验证 prior 表为主 | **仅限**明显可见且导致 crashes / data loss / logic errors 的新问题 |
| Round 3+ | round3 档 | 严格只验证 prior 表 | **禁止**（“Do NOT look for new issues”） |

- **评审对象锚**：round1 与 round2+ 的用户消息都以机械生成的 **Review-object declaration** 块开头（`{type, target, status, reason, exclude}`——每轮注入）——评审员不推断“评谁 / 为什么评”。
- **设计评审与代码评审共用收敛提示词轮换**：round 1 用设计评审档（设计评审标准 + Approval Signal——无 🔴 时回显凭证与 designId 双值逐字）；round 2/3+ 用收敛提示词（验证 prior 表、证据强制）。
- **轮次无机械上限**（§3）：两侧轮次都继续递增（收敛提示词轮换 + 轮次显示照常）——第 6 次及以后的调用照常受理，不因轮次被拒。

### 2.2 轮次映射与 off-by-one

- **轮次计数 = 已完成**的 advisor 评审尝试次数（同步路径：工具调用完成后记账——含失败/错误返回的尝试；拒发——类型门 / 池满 / 无范围——不计不置；异步路径：结算时递增——attempts 语义一致）。
- round1 与 round2+ 的**语义判定是确定性的**：`轮次 > 0` **且**存有上一轮评审输出 → round 2+；否则 round 1（重启后归零 → 保守全量重评）。**无解析**：不解析 prior 表头、不匹配 all-clear 短语。
- **提示词选择**：调用时已完成 0 → ROUND1，1 → ROUND2，≥2 → ROUND3。实现用「已完成次数 + 1」推导**即将进行**的轮次号——与已完成的次数相差 1，勿混淆。
- **轮次预算按 review 实例计**（同步与异步工具路径共用实例注册表——reviewId = designId / 随机 id——round/prior 随实例；并发多评审的 round/prior 互不污染）。实例解析与结算细节权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.10。
- **重置语义**：无 prior 且本 run 未改代码 → 轮次归零、开新评审周期（首次评审 / 上次 all-clear / 纯文档或无修改的 run——各自获得完整预算）；本 run 改过代码 → **保留轮次**（completion guard 必推回；轮次用于提示词衰减与显示——**不作终止判据**）。每 runAgent 起始重置镜像状态（resume 续写保留——轮次跨续跑延续）。

### 2.3 工具轮预算

提示词自报工具轮预算（防止评审者按预算花满时间的放大器）：round 1 = **20** 轮（里程碑引导 6/10/17）；round 2/3 = **15** 轮（8 轮未验完即收尾兜底）。
**机械硬帽 100 工具轮**（type-agnostic，设计评审同受；评审死循环时宿主机械打断）。

### 2.4 通过 / 阻断判定

- **通过 = 无未决 🔴**：全部 🔴 已解决（**fixed ∨ accepted**——accepted = 经争议窗收口的携理由不修项，§2.5）、仅剩 🟡/🔵 → 评审通过（🟡/🔵 不阻断 approval——照列不隐藏）。任一 🔴 未决（含零理由不修项）→ 不得声称 passed。
- **宿主判定面**：评审的“通过/不通过”**不是宿主控制流输入**——宿主不做 findings/短语解析——guard 只消费“评审发生”+ 轮次预算；是否通过由主 agent 读评审输出自行判断。**唯一机械例外** = 设计评审的凭证回显即通过信号（凭证入槽 / 门禁解锁）。
- **文档状态矛盾不卡 pass**：文档矛盾 / 状态不一致 → 🟡 报出即过（report-and-pass，评审只读不改）——**机制级描述不一致除外（= 🔴——必须处理后才可过）**。判据来源 = 判定铁律（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.19）——本档不重复铁律正文。

### 2.5 争议裁决窗与非修项收口（F32 / F33）

> 用户裁定（需求层 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §2.4）——双方判定相持的红不得无限持续：被审方不修须携理由；前两轮评审者可评估理由并打回；**第三轮起接受携理由的不修项收口**。
> 边界：轮次判定机制本体（确定性状态位 ∥ 周期界 ∥ 归零）零动；零计数器；零 LLM 输出解析（F6——表列词表 = 父侧阅读面，不驱动控制流）；pass 判据来源仍 = 评审者判。同步 / 异步共用轮次提示词（轮次语义单源 = 本档；异步实例机制零改）。

- **争议项定义**：同一项上「评审者判应修 ∧ 被审方判不修」。非修形态 = 响应表 `Not an issue`（技术反驳 + 证据）∥ `Deferred`（认账不修 + 理由）——**每项不修必须携理由**；零理由（沉默 ∥ 回避 ∥ 无理由记录）不在接受之列。
- **窗（时限与终局）**：**轮 1–2** 评审者可评估理由并打回（理由不成立 ⇒ 该项保持未解）；**轮 3+ 对已携理由的不修项接受收口**——不再评估理由成立性、不得再以同项打回。同一争议占轮 ≤ 2 轮窗（第 3 轮必收）⇒ 相持循环必然终止。
- **表列形态（可核性——零解析）**：轮 2 / 3 验证表 `Status` 词表 = `Fixed` / `Accepted`（携理由不修——被接受收口）/ `Unfixed`（未解——含零理由项）/ `New`（仅轮 2）；`Accepted` 与未解项**都须入表列出**（收口不得自表中静默消失——父侧可核「prior 🔴 全部 ∈ {fixed, accepted}」）；每个前轮条目每轮须得其一（不悬置）。
- **`Dispatched` 条目归宿**（响应表在途未落地——§7）：在途 ≠ 已解决，不属 `Fixed` / `Accepted` ⇒ 轮 2 / 3 表内列 `Unfixed`（落地后由下一轮核验转 `Fixed`；批准请求前须收敛为 `Fixed`——§7.1）。
- **判据随动（F33）**：**pass = prior 🔴 全部 ∈ {fixed, accepted}** ∧ 修复未引入新 🔴——两轮裁决句同含该合取（轮 3+ 禁新问题（§2.1）⇒ 后分句在轮 3+ 为惰性）；存在零理由未解项 ⇒ **不可 pass**。设计评审凭证回显条件同源随动（构建面句 = `thincoder-core/advisor/messages.mjs`）。
- **零理由面的出口**（如实）：零理由项不受接受 ⇒ 保持未解（不可 pass）——出路 = 被审方补理由 ∥ 修复，或父侧上报用户裁（沿「未决 🔴 必须向用户呈现」纪律）；**接受收口只关评审者面，不免除父侧上报义务**。
- **残余（如实注——非「不修」形态的不收敛路径）**：窗只覆盖「携理由的不修项」；① 评审者拒不执行接受句（轮 3+ 仍以同项打回）——机制层零强制（零解析 / 不驱动控制流），出口 = 父侧上报用户裁（沿「未决 🔴 必须向用户呈现」纪律，同零理由出口）；② 被审方虚报 `Fixed`（实际未落地）——轮 3+ 对 `Fixed` 的判定仍须对照当前文件验证，虚报 ⇒ 保持未解（不可 pass），出口同①。⇒ 窗的「必然终止」以提示词层遵从为机制边界。
- **设计轨适用性**（需求档 F32 边界要求——「design 轨适用形由设计轮核」）：**两轨同形适用**。依据 = ① 轮 2 / 3 提示词两轨共用（`thincoder-core/advisor.mjs` 轮次选择——设计轮 2/3 与代码轨落同一对提示词）；② 争议结构同构（评审者 ⇄ 设计作者之响应表）；③ F33 的「解」定义轨无关；④ 设计评审 pass = 凭证回显——回显条件句随动后同受窗语义。
- **归宿面（不可验证 ∥ 不完整 ⇒ 结论化）**：窗语义保证每个条目每轮有归宿（`Fixed` / `Accepted` / `Unfixed` 三态之一，无一悬置）；不可验证侧的精确分类与写作禁则 = `docs/core/design/ADVISOR-GUARDS.md` §3；不完整（宿主截断族）⇒ 失败结论块 = 同档 §7（零改复核）。
- **提示词面逐字建议**（**内容依据 = 机制文档**——落地形态照 D1；单份 = 运行期 EN，口径 = 该单份逐字）：

**【轮 2 · 评估句】**替换 «not an issue» 评估句（`thincoder-core/prompts/advisor-round2.md` + 中文对位），并补状态词表行：

```text
EN:
- For items left unfixed (marked "not an issue" / "Deferred", or not addressed at all): every non-fix MUST carry a reason —
  a technical rebuttal with evidence, or an explicit acknowledged-not-fixed record; evaluate whether that reasoning holds.
- Where it does not hold, the item stays unresolved — push back (this round is the last one where a reasoned non-fix can be
  pushed back). Where it holds, close the item: list it with Status `Accepted`.
- Zero-reason silence or evasion never closes an item — list it as `Unfixed`.
- Status vocabulary: `Fixed` / `Accepted` (a reasoned non-fix — closed) / `Unfixed` (unresolved — including zero-reason non-fixes) / `New`.
  Accepted closures and unresolved items must both be listed — an item must not vanish from the table silently.
CN:
- 未修项（标 `not an issue` / `Deferred`，或完全未回应）：每项不修必须携理由——技术反驳+证据，或认账不修的显式记录；评估理由是否成立。
- 理由不成立 ⇒ 该项保持未解、可打回（本轮为最后一个可打回携理由不修项的轮次）；理由成立 ⇒ 以 `Accepted` 收口并列表。
- 零理由的沉默/回避永不收口——列 `Unfixed`。
- Status 词表：`Fixed` / `Accepted`（携理由不修——收口）/ `Unfixed`（未解——含零理由项）/ `New`；`Accepted` 与未解条目都必须入表——不得静默丢条目。
```

**【轮 3 · 接受句】**规则区追加（`thincoder-core/prompts/advisor-round3.md` + 中文对位）：

```text
EN:
- For prior items the agent left unfixed with a reason (a technical rebuttal with evidence, or an explicit acknowledged-not-fixed
  record): ACCEPT them — at this round a reasoned non-fix closes the item (do not re-adjudicate the reasoning here; list it with
  Status `Accepted`); do not push back on the same item again.
- Items with no reason (silence, evasion, a bare claim without justification) stay unresolved — list them with Status `Unfixed`;
  a zero-reason non-fix is never accepted.
- Status vocabulary: `Fixed` / `Accepted` (a reasoned non-fix — closed at this round) / `Unfixed` (unresolved — including
  zero-reason non-fixes). Every prior item must receive one of these dispositions; accepted and unresolved items must be listed —
  never drop an item silently.
CN:
- 前轮未修且携理由的条目（技术反驳+证据 ∥ 认账不修的显式记录）：接受收口——本轮起携理由的不修项以 `Accepted` 收口（不再评估理由成立性；列入表内），不得再以同项打回。
- 零理由条目（沉默/回避/无理由记录）保持未解——列 `Unfixed`；零理由的不修项永不接受。
- Status 词表：`Fixed` / `Accepted`（携理由不修——本轮收口）/ `Unfixed`（未解——含零理由项）；每个前轮条目须得其一——`Accepted` 与未解条目都必须入表，不得静默丢条目。
```

**【裁决句随动】**轮 2 / 3 裁决含义句同改（关键改动 = «resolved» 定义 + changes-required 补零理由项）：

```text
EN（轮 2 / 轮 3 同片）:
- pass = every prior-review 🔴 issue is resolved — fixed (verified against the current files) or accepted (a reasoned non-fix,
  closed at this round) — AND the fixes introduced no new 🔴.
- changes-required = any prior 🔴 still unresolved (including any zero-reason non-fix — silence or evasion is never accepted),
  any new 🔴 introduced by the fixes, or any 🟡 the review marks as must-fix.
CN:
- pass = 前轮所有 🔴 已解决——fixed（对照当前文件验证）或 accepted（携理由不修，本轮收口）——且修复未引入新 🔴。
- changes-required = 前轮任何 🔴 未解决（含零理由的不修项——沉默/回避永不接受）、修复引入任何新 🔴、或任何被标为必修的 🟡。
```

**轨射程注（裁决句「must-fix 🟡」分句）**：该分句只对 code 轨有实义（标 must-fix 的 🟡 ⇒ changes-required）；设计轨无 must-fix 🟡 类、🟡/🔵 不阻断 approval（§2.4）⇒ 在 design 轨为惰性；must-fix ∥ optional 面语义本体零动（F33 边界）。

**【收尾句（不悬置）】**轮 2 / 3 收尾规则句追加（归宿面——不可验证 ∥ 不完整 ⇒ 结论化）：

```text
EN: If you must wrap up with items not fully verified, list each of them explicitly with its state (Status `Unfixed`,
evidence not verified this round) — never drop an item silently; the verdict line still closes the round with a conclusion.

CN: 若要带着未完全核验的条目收尾：逐一明列（`Unfixed`，证据本轮未核验）——不得静默丢条目；裁决行仍须给出本轮结论。
```

**【构建面回显条件句】**`thincoder-core/advisor/messages.mjs` Approval Signal（设计轨轮 2+ 的操作性载体）：

```text
- `finds NO 🔴 (Critical) issues` ⇒ `no unresolved 🔴 (Critical) issue remains`
- 尾行补定义：a reasoned non-fix accepted by the reviewer does not block (🔴 only — 🟡/🔵 never block approval); anything else stays unresolved.
```

**【被审方义务面】**纪律档（`thincoder-core/prompts/discipline-normal.md` · `thincoder-core/prompts/persona-engineering.md` + 中文对位——轮次衰减句追加）：

```text
EN: Every non-fix must carry a reason (a technical rebuttal with evidence, or an explicit acknowledged-not-fixed record);
the reviewer may push back on insufficient reasons through round 2, and from round 3 accepts reasoned non-fixes —
a zero-reason refusal is never accepted and stays unresolved.

CN: 每项不修必须携理由（技术反驳+证据 ∥ 认账不修的显式记录）；第 1–2 轮评审者可对理由不成立的不修项打回，
第 3 轮起携理由的不修项被接受收口——零理由的沉默/回避永不接受、保持未解。
```

- 轮 1（代码）与设计评审轮 1 无 prior——窗语义不入（该两档除引证禁则外零改；轮 1 裁决句照旧 = 无 🔴 即 pass）。

## 3. 轮次与终止（无机械上限）

### 3.1 无会话级轮次计数器（用户裁定）

**裁定原话（逐字）**：「不不不，过度工程，防无限重评审也不是这么防的，到处加机械限制是一种非常拙劣低级的做法，完全不体现程序员的能力和水平。」

- **无会话级计数载体**：不设任何计数载体、不按计数拒发（无按计数拒发的常量 / 工具层预检 / 内防线 / guard 轮次项）。
- **纪律面（提示词面 = 逐字建议，落笔权在主 agent）**：两处提示词末句（EN 运行面）`thincoder-core/prompts/discipline-normal.md:126` · `thincoder-core/prompts/persona-engineering.md` §Review convergence 的 `Rounds are uncapped — repeated mechanical failure (same criterion) ⇒ stop and report.`——
  **落点（N5）**：末句 = en `No round cap — repeated mechanical failure (same criterion) ⇒ stop and report.`（句首两段逐字保留）。
- **轮次字段保留（区分对待——勿一刀切）**：每实例的轮次（`run.round`）**保留**——它是**提示词衰减**（§2.1 轮次表）与 TUI / VSC 轮次显示的数据源；**轮次不是终止判据**，不参与任何拒发判定。
- **保留的既有自限**（逐条登记——都不是「评审发起封禁」）：工具轮硬帽 100（§2.3 宿主打断死循环）· 评审墙钟预算（F15）· completion guard 推回预算——两层口径：进展窗口 `MAX_ADVISOR_PUSHBACKS` ≤ 3 条 ∥ 未评审周期 `MAX_ADVISOR_REMINDERS` ≤ 5 条（权威面 §6.4；两者都只节流 guard 自身的提醒，不封禁评审发起）· 异步池并发上限（资源保护归调度域）。
- **终止从哪来**：正常路径 = pass / changes-required 收敛；失败路径 = **失败有结论**（§3.2）——「有结论」即出口，不需要计数器兜底。

### 3.2 失败路径：有结论 + 停下上报（F28 / F29）

- **失败有结论**：机械失败结算（宿主截断族 / 陈旧 / 凭证落盘失败 / 无报告）**逐次**产出可用结论（发生了什么 + 下一步）——结论文案与对象标识四项单源构建 = `thincoder-core/advisor/notice.mjs`；逐字模板与判据名表 = `docs/core/design/ADVISOR-GUARDS.md` §7。
- **反复失败 ⇒ 停下上报用户**：同因 ≥ 3 次是**上报触发**（父侧呈报事实 + 候选处置），**不是封禁判据**——机制面**零封禁**（不得静默拒绝任何发起）。机制侧贡献 = 逐次可见（每次失败的结论块载 `criterion=<判据名>`）；父侧纪律 = §3.3。
- **零会话级计数载体**：反复失败靠结论可见性 + 父侧纪律，不靠计数器（无停止谓词 / 无两级检查点 / 无计数载体）。

### 3.3 父侧纪律（提示词面——落笔权在主 agent）

逐字建议（**落位清单写全**；**已落笔**——运行期 `thincoder-core/prompts/discipline-engineering.md` §基本流程 · 步骤 4（测试）之子条目「评审反复机械失败」）：

- **工程模式（本句落位）**：运行期 `thincoder-core/prompts/discipline-engineering.md` §基本流程 步骤 4（测试）之子条目（`:41` 之后——与步骤 2 的写权子条目同层）。
- **普通模式（同族句落位）**：运行期 `thincoder-core/prompts/discipline-normal.md` §Review discipline（`:119` 起）——即 §3.1 逐字句所在的同一节位。

```text
- **评审反复机械失败**：同一评审面同类机械失败累计 ≥3 次（失败结论块 criterion= 相同）⇒ 停止重跑，把事实与候选处置摆给用户——不自动重跑、不自动缩范围、不自行改判据。
```

### 3.4 事实面载体（零状态）

- 该档 = 纯事实面：`normAbs`（路径归一单源）+ `docSetKey`（评审范围键）——零状态、零计数（`thincoder-core/agent-tools/review-facts.mjs`）。
- 结算分类 = **纯函数（零状态）**——落 `thincoder-core/advisor/notice.mjs`；输出 = 判据名。

### 3.5 同族对照（只出表——是否同口径撤除 = 用户裁）

同族对照：同一「计数 ⇒ 停止」族另有三处（**只出表、不动手**——行 1 / 行 2 = 批次档纪律面（用户裁项）· 行 3 = 子代理交付协议（**父侧并入登记——非本面射程**））：
**状态**：行 1 / 行 2 = **待用户裁**；行 3 = **非本面射程**（父侧登记在册）。

| # | 判据 | 阈值 | 落点 | 现状语义 | 候选处置 |
|---|---|---|---|---|---|
| 1 | §5 修正轮上限 | 5 轮（触顶 ⇒ 越界 ⇒ 另起新批） | `docs/core/design/BATCH-RECORD.md` §5.1 L3 · 同档 BR-13 · D-BR14 · 需求面 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13 | 计数封顶：触顶即「本批自然边界」 | ① 同口径撤除（去 5 轮上限）· ② 改造（不封顶；达阈 ⇒ 停下上报）· ③ 不动 |
| 2 | §3 设计评审停止判据 | 持续拒绝 >3 轮 ⇒ 停下上报（**非封禁**） | 同上（L3 / BR-13）· 权威 = 本档 §3 | 已是「停下上报」语义（与 F28 同向） | ① 保留并改指本档新址（锚漂移收正）· ② 同口径改写为「同因 ≥3 次 ⇒ 停下上报」· ③ 不动 |
| 3 | eng-coder 自修轮上限（**父侧并入登记——非本面射程**） | 自修至多 5 轮修正 | 运行期 `thincoder-core/prompts/persona-eng-coder.md`「自含交付协议（概览）」节（`self-fix (max 5 correction rounds)`）· 需求面 `docs/core/requirements/ENGINEERING-MODE-V2.md` §7.4（「自修（≤5 轮）」） | 计数封顶：超限即收口交付 / 另起新批 | ① 同口径撤除（去 5 轮上限）· ② 改造（不封顶；达阈 ⇒ 停下上报）· ③ 不动 |

**补登记（轮次 · 口径宽扫）**：行 1 / 行 2 的**运行期孪生行** = `thincoder-core/prompts/persona-engineering.md` §Batch-record lifecycle 的 `§5 fix-round cap = 5 rounds`。
现载「§5 修正轮上限 5 轮 / §3 设计评审无轮次上限（cap 豁免）/ 停止判据（持续拒绝 >3 轮）⇒ 停下上报」。
行 3 的孪生行见上表（宽扫口径核过——同类）。

### 3.6 轮次上限字面族现存盘点（口径命令可重跑）

**口径**：「轮次上限」字面族扫全仓，对象 = 提示词面（`thincoder-core/prompts/`）· 需求面 · 设计面；排除 `node_modules` / `_archive`。

```text
命令 1（提示词面）：grep -rnE "Max 5 rounds|最多 5 轮|max 5 correction rounds|5 轮" thincoder-core/prompts
命令 2（需求面）：grep -rnE "5 轮|≤5 轮|机械 cap" docs/core/requirements
```

**① 提示词面（活行 2 = 2 句——§3.1 逐字句；同族 2 组 = 裁项在 §3.5）**

| # | file:line | 现形态（末句） | 处置 |
|---|---|---|---|
| P1 | `thincoder-core/prompts/discipline-normal.md` | 现行句 `No round cap — repeated mechanical failure (same criterion) ⇒ stop and report.` | **已落**——§3.1 逐字句 |
| P2 | `thincoder-core/prompts/persona-engineering.md` §Review convergence（轮次衰减条） | 现行句：`Rounds are uncapped — repeated mechanical failure (same criterion) ⇒ stop and report.` | 同上（已落） |
| P5 | `thincoder-core/prompts/persona-engineering.md` §Batch-record lifecycle 的 `§5 fix-round cap = 5 rounds` | §5 修正轮上限 5 轮 / §3「cap 豁免」/ >3 轮停止判据 | **同族 · 未落**——§3.5 行 1 / 行 2（待用户裁）；已登记 |
| P6 | `thincoder-core/prompts/persona-eng-coder.md:22` | `self-fix (max 5 correction rounds)` | **同族 · 未落**——§3.5 行 3（非本面射程） |

**② 需求面（只登记、不改文——需求档笔在父侧；三行未落）**

| # | file:line | 现形态 | 处置 |
|---|---|---|---|
| R1 | `docs/core/requirements/NORMAL-MODE.md:68` | F7「…🔴 不得埋；**≤5 轮收敛**；全清后跑 `verify`」 | 登记：与撤 cap 口径冲突 |
| R2 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md:13` | 继承枚举「轮次衰减 / **机械 cap** / 会话隔离 / 失败护栏」 | 登记：枚举陈旧 |
| R3 | `docs/core/requirements/ENGINEERING-MODE-V2.md:391`（同族见 `:187` ∥ `:668`） | 「自修（≤5 轮）」/「§5 修正轮上限 5 轮…」 | 登记：§3.5 行 1 / 行 3 的需求面 |

**③ 假阳登记（非同族——宽扫命中，勿误收）**：`thincoder-core/prompts/advisor-design.md:10`（`≤500` 行 = 代码结构档位判据）· `docs/core/requirements/CONSULTATION.md:56`（`consultModels` 候选池 ≤5）。

## 4. 收敛会话与证据纪律

### 4.1 stale-context 加固

旧消息中的历史快照（旧 diff / 旧文件内容）与当前状态必须分离。**防护**：

- ROUND2/3 的 system prompt 与 follow-up 用户消息均声明 **STALE-CONTEXT WARNING**：更早消息中的任何内容都是历史快照——**视为过期——只有本轮 `read` 的结果描述当前状态**。
- **round2+ follow-up 刻意零 git**：不注入 diff / 状态快照（已提交的修复不会出现在 diff 里 ⇒ 会误导复评，把“无变化”读成“无修复”）——验证只靠 `read`。
- **证据强制**：任何 “Unfixed” / “New” 判定必须附 `read` 验证的 `file:line` 证据（引本轮 read 的确切行内容——行号本身不是证据）；无证据的判定视为未验证、不予接受。机械校验见 §5。

### 4.2 fresh session——每轮全新会话

- **round 2+ 不复用 round 1 的会话数组**：每轮构建全新 `[system(轮次提示词), user(对象声明块 + prior 全文 + agent 响应表 + 指令)]`。
  **旧 read 输出从物理上不在上下文里**——它是复评误报的最大锚定源（模型引用旧文件内容而非重新 read），也是 token 浪费源（大文件全文滞留触发频繁压缩）。“保留探索上下文”与证据规则（只有本轮 read 才算数）天然冲突——已废除。
- 评审失败不产生可泄漏的半成品上下文（每轮 fresh，天然免疫）。
- 会话延续字段保留（初始化兼容）但**不再作为会话延续读取/写入**；每 run 重置。

### 4.3 prior 全文注入——唯一完整验证清单

- 现行态 = round 2+ 用户消息注入**上一轮评审的完整原文**（模型自行理解表格与结论——无表头/短语硬解析）。
- **为什么必须注入**：prior 是**唯一完整的验证清单**——agent 响应表只覆盖 agent 选择回答的问题，agent 遗漏/回避的问题若无 prior 会在收敛中**静默通过**（验证目标被 agent 自我声明绑架）。
  **注入风险与既有防线**：**复述** → host-verified citations 机械拦截 + fresh session 排除旧 read 数据；**跨主题污染** → 确定性轮次判定；**token** → 注入的是评审原文而非解析表。
- **消息形态（单源）**：
  - `## Round N — Verify Prior Table + Flag New Issues`（round 2）/ `## Round N — Strict Verification`（round 3+）——声明本轮 system prompt 已收窄范围；
  - `## Prior Review Output (verify every item it raises)`——上一轮评审完整原文；
  - `## Agent Response (fix claims — reference only)`——agent 响应表（**聚焦参考**——**不再是验证清单**；格式漂移或缺失时 fallback 文本兜底，不驱动控制流）；
  - `## Instructions`——编号指令：逐项 read 验证 prior 每项 / STALE-CONTEXT WARNING / 无 git / 必须 read 当前文件再判定 / **证据规则**（引本轮 read 确切行内容——无 fresh 引证 = unverified 不受理）/ round 2 可标修复引入的明显新问题（crashes, data loss, logic errors——非 style）/ round 3+ **“Do NOT look for new issues”**。
- **只存“评审形态输出”作 prior**：评审完成时宿主只在该输出像评审时（markdown 表格行或足够长正文）存为 prior——空回复 / 纯工具进度不得成为 round2+ 的验证清单。同步路径存于 agent 状态；实例路径存于 run 实例；子代理内的 advisor 调用**不写父 agent 状态**。
- **取件下界（per-review 窗口）**：agent 响应表取件按**本评审实例**收敛——下界 = 本评审**投递水印**（`run.historyAnchorIdx`：本评审结果进入父 history 的落点；async = 投递单点 `injectAsyncResult` ∥ sync = 工具结果提交点落——机制见 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.10）。
  取件 = 自水印**前向**扫描取**首张**响应表；无水印（legacy 直调 / 无实例）回落既有全文倒扫。依据 = 并发评审下全文倒扫取「最新」表 ⇒ 取到他场。

  **残余声明**：① **索引稳定性前提**：水印 = 投递刻 history 下标；跨存档重装（整换径 `thincoder-core/session-lifecycle.mjs:115` `agent.history = [...machineMerged]`）∥ 头裁切后可失配；失配两向（同因）——前向窗**越过**本表 ⇒ 回落「no response table」兜底文本 ∥ 前向窗起点**左移** ⇒ 覆盖更早区段（可含投递前）⇒ 可取他场**更早**表；两向均 = 聚焦参考降级、不驱动控制流。

  ② 水印下界只保证「≥ 本评审投递点」——他场响应表若在本评审投递之后、本次构建之前交错写入，取件仍可先命中他场；「聚焦参考」语义不变（不驱动控制流——与 F9 / F-A12 不相触）。
- **已知边界（legacy 路径）**：legacy 收敛路径不应用转义——**直接外部调用方须自行转义**（parent 对话引用字面转义序列时有服务端 400 风险）；正常流已转义，无风险。

## 5. host-verified citations——机械证据校验

提示词的证据规则无法由 LLM 自我强制——模型可以声称读过而实际复述 prior 表。**宿主侧机械校验是最后防线**：

- 评审结果拿到后解析其中的 `file:line: content` 引用（后缀白名单（源码/配置/文档扩展名，防 URL 假阳性）+ 内容长度下限 + 排除反引号引文）。
- 逐条磁盘比对：该文件该行的实际内容是否**包含**引用内容；引用路径有**路径围栏**（realpath 解析后必须仍在 cwd 内——LLM 生成的路径不可信，防越界读泄漏配置）。
- 验证报告追加到评审结果：`[host-verified] N/M citations match current file state.` + 不匹配清单（至多 10 条，含失败原因）。
- 父 agent（决策方）与用户看到验证报告后，对不匹配的 “Unfixed” 判定自动降权——**未通过校验的引用不能支撑打回**。效果：模型编造 / 复述旧证据的成本从“零”变为“必然被标记”。
- **候选根派生（与`路径围栏`配合；实现契约见 `docs/core/design/ADVISOR-GUARDS.md`）**：按声明路径派生候选根（工作区根 / 声明仓根 / 声明文件目录），逐引文按候选顺序试解析；失败原因四类（无候选文件存在 / 内容不符 / 越围栏 / 非连续引文——逐字分类 = `docs/core/design/ADVISOR-GUARDS.md` §3）。

## 6. 评审触发与失效（guard 推回）

### 6.1 触发范围：只跟代码修改绑定

用户裁定（“修改代码以后触发评审，为什么要扩散到 bash 这一类的东西？”）。现行：

1. **文件写工具**（write / edit / insert_after / apply_patch / delete / hashline_edit）调用 → 重置“评审已覆盖”+“已验证”标记（评审/验证确实过时——文件状态变了）。
2. **非写文件副作用工具**（bash / git）→ **只重置 verify**（其 diff / 状态快照可能过时），**不重置评审标记**——bash 被系统规则禁止写文件，合规 agent 的 bash 不会改变被评审代码。
3. 由此“评审 → 只读/环境操作 → 完成”不再触发多余评审轮；“评审 → 再次改代码 → 重新评审”保持。

**残余边界（接受）**：违规 agent 用 bash 改代码文件 → 不进触碰集 → 内容判定检测不到 → 评审漏过。这是“bash 写文件被禁”规则下不存在的场景（规则与机械判定的一致性优于对违规行为的兜底）。

**内容级判定（guard 共用单源）**：产品代码树下的任何文件都是代码（含提示词档——无条件）；产品树**外**的文档文件与临时件**不算**代码修改；无已知路径的修改保守视为代码（兜底）。

### 6.2 失效语义与 completion guard 公式

**“评审失效”不是独立机制，是 guard 条件的状态转换**。guard 的唯一依据是“是否存在未评审的代码修改”：

```js
// 完成时推回判定（顶层、guard 开启、非工程模式）
if (!pending                          // 异步评审在飞/排队 → 未决不算未评审 → 不推回
    && agent._mutatedThisRun          // ① 本 run 改过代码
    && !agent._calledAdvisorThisRun   // ② 修改尚未被评审覆盖
    && hasCodeMutations(agent)        // 内容判定——产品代码全算，文档/临时件排除

    && advisorPushbacks < MAX_ADVISOR_PUSHBACKS   // 层 1：单个进展窗口（§6.4 A）
    && (agent._advisorReminders ?? 0) < MAX_ADVISOR_REMINDERS) { 推回 }  // 层 2：周期硬上限（§6.4 B）
// 任一层停推（层 1 或层 2 耗尽，两条合取不再成立）且 `_advisorHonestySent` 未置 ⇒ 推一条诚实提醒（置位）并
// continue；位已置 ⇒ done 放行（§6.4「到顶行为」——「未评审」不许静默成「已交付」）。位随写序推进点归假
// （复位点 3）⇒ 有新进展时该次停推再得一条。
```

- **② = “评审已覆盖”位**：评审完成置真（同步：工具结果记账；异步：非陈旧结算）——表示“当前代码状态已被评审覆盖”；**再次修改代码**置回假——这就是“失效”。没有 ②，修改事实永不消除 → guard 无限推回、run 永不完成；没有失效重置，评审后修复的问题无人验证 → 收敛断裂。**失效是收敛循环（评审 → 修复 → 再评审 → … 直到 0 🔴，或失败路径给出结论）的引擎**。
- **guard opt-in**：默认关闭（advisor 工具本身永远可用，guard 只控制完成时是否推回）；**工程模式永不启用**（工程模式的评审义务由 token / 门禁链机械强制）；仅顶层 run。
- **异步交互**：评审启动后发生文件写 → 结算判 **stale** → 不置“评审已覆盖”、不签 token → guard 继续推回发起新评审；非陈旧的代码评审结算 → 置位。
- 子代理代码合并（eng-coder 返回）→ 合并进父侧修改追踪、使先前 verify / advisor 标记失效，并按 §6.4 A 判据 2 复位 advisor 推回预算——父代理无法通过“把改动委托给 eng-coder”跳过代码评审。
- 新 run → 重置为未评审（新评审周期）→ 按条件判定。

### 6.3 触发路径清单

| 事件 | 评审失效？ | 推回？ |
|---|---|---|
| 文件写工具改代码 | 是 | 是（guard 综合判定） |
| 子代理代码合并 | 是 | 是 |
| bash / git（非写文件副作用） | 否 | 否（只失效 verify——快照可能过时） |
| 只读工具（read / grep / lsp / glob） | 否 | 否 |
| 写文档 / 写临时文件 | 状态位翻转但内容判定过滤 | 否 |
| verify / task / question / plan 等 | 否 | 否 |
| 异步评审在飞（池内 / 排队） | 不推回（未决 ≠ 未评审）；陈旧结算后恢复推回 | — |
| 新 run（新任务） | 重置为未评审（新评审周期） | 按条件判定 |

### 6.4 推回预算的两层口径（A：真进展才回满 · B：未评审周期硬上限）

**A —— 预算只在被审对象真的变了时回满**

推回预算 `advisorPushbacks` 的复位判据 = **被审对象真的变了**，落成一条：本批内父侧的**写序** `agent._mutationSeq` 推进了（谓词 `wroteSince(agent, agent._mutSeqMark)`，与零落笔看门狗同源——`_mutSeqMark` 每轮头前移，批后比一次）。

写序只有一个推进面，两个写者：

1. **成功的文件写工具**（`FILE_MUTATORS`）——`thincoder-core/agent/dispatch-gates.mjs` 的 `noteExecutedMutation`（失败写入不推进：它带「结果非 `Error:` 前缀」的门）。
2. **子代理代码合并**——`mergeChildMutations` 把子代理改动合进父侧、并按 `noteMutations` 推进写序。

读文件 / 搜代码 / lsp / bash / git 这类批次**不复位**。

- **判据为什么是它**：预算的语义 = 同一条提醒给模型 N 次机会。只读批次对被审代码零改变，复位它就把「N 次机会」变成无限次——实测形态是模型读一次文件、提醒来一条，无限重复。
- **子代理合并在判据内、不另立**：§6.3 已把「子代理代码合并」判为评审失效 = 是（父代理不能靠把改动委托出去跳过评审），但合并**不是** `FILE_MUTATORS` 工具调用——只认写工具时，全委托形态的父侧预算永不复位，层 1 缺口 3 条即冻死，与只读形态同病。依据 = 批档 §1「缺口二」裁定；可复现路径 = `thincoder-core/agent-tools/subagent-async.mjs` 的 `mergeChildMutations`（实读「`if (parent._calledAdvisorThisRun) parent._calledAdvisorThisRun = false`」）在子代理工具调用里执行，该批 `results` 里没有任何 `FILE_MUTATORS` 工具。
  单源而非双判据：写序本就是「被审对象变了」的既有载体（陈旧判定与零落笔看门狗共用），合并早已推进它——再抽一个谓词 = 同一件事两处判据，必漂移。
- **残余（如实）**：合并发生在**批次之外**（异步子代理在收尾 / 摘要窗口结算）时，下一轮头把标前移已越过它，本窗口不复位——表现为该周期提前进入诚实提醒，不放宽任何判据。
- **verify 面零改**：`guardPushbacks`（verify 推回预算）仍在工具批执行处**无条件**清零——成功的批与报错的批同样清零。依据 thincoder-core/agent/turn-loop.mjs「任一工具批即回满」。它与 advisor 面同处一段但不再共用判据：advisor 面只在写序推进时复位。verify 面是否存在同族病理，本批未量，不做推断。

**B —— 未评审周期（episode）的提醒硬上限**

- 计数器 `agent._advisorReminders` = 本周期已发出的 advisor 提醒条数；上限常量 `MAX_ADVISOR_REMINDERS = 5`。到顶诚实提醒的一次性位 = `agent._advisorHonestySent`（同周期；计数只在周期起点 ∥ 终点两处归零，一次性位另随写序推进点归假——见下「复位点穷举」）。
- **计数器为什么挂在 agent 上、不挂在回合环**：`turn-loop.mjs` 的 `advisorPushbacks` 是 `runAgent` 体内的局部变量，每次进入 `runAgent` 归零；轮数墙续跑（`TURN-CAP-CONTINUE.md`）正是再次进入 `runAgent`——局部计数器随之回满，这就是「单会话 624 轮」成立的机制。挂 agent 上的计数在续跑（`resume: true`）面不复位，与 `run-start.mjs`「mutation/guard 连续性必须跨续跑存活」的既有口径同向。
- **周期（episode）** = 从「代码被改且无评审覆盖」到「评审真的覆盖了这份代码」。复位点穷举（三处，别处零写）——两个复位对象的落点不同：
  - `agent._advisorReminders = 0`（周期计数）：只在下面 1 ∥ 2 两处（周期起点 ∥ 终点）。
  - `agent._advisorHonestySent = false`（诚实提醒位）：1 ∥ 2 两处，**另加** 3（写序推进点）——有新进展 ⇒ 该次交付重新需要一句诚实声明。
  1. **新用户回合起点 · 无继承时**——`thincoder-core/agent/run-start.mjs` 的 `if (!resume)` 块里，`agent._verifyRetries = 0` / `agent._advisorRound = 0` 所在的 `else` 分支（即 `_inheritedGuard` 为空那一支）；续跑（`resume: true`）整块不执行，不复位。
     - **与 `restoreGuard` 的先后**：该块形如 `if (g) { restoreGuard(agent, g); agent._inheritedGuard = null } else { …复位… }`——两支互斥，本复位只在 `else` 支，故不存在「先清零又被回填」或「先回填又被清零」。回填支逐字覆盖为快照值（`restoreGuard` 只拷 `INHERITED_GUARD_KEYS` 内的键），`_inheritedGuard = null` 即消费点，一个快照只被一个回合取走。
     - **哪些 run 过这一块**：`resume !== true` 的每个 run 都进 `if (!resume)`——包括 digest / timer / upstream 三类自动回合（它们同样不带 `resume`）。故复位另加一条「非自动回合」的合取（`!(autoTurn || upstreamTurn || timerTurn)`）：**自动回合不清零**。理由 = 自动回合不改代码、也不评审，它落在周期中间而非起点；清零会让「用户回合 → 自动回合 → 用户回合」的链每段重新拿满 5 条，上限被自动回合吃掉。
     - **读数（自动回合不清零）**：自动回合收尾走 `thincoder-core/agent/run-stages.mjs` 的 `agent._inheritedGuard = snapshotGuard(agent)`（仅 `autoTurn` ∧ 正常结束时）；下一次用户回合在复位块 `if (g)` 支经 `restoreGuard` 回填 ⇒ 两字段随快照跨自动回合连续。两字段不在 `INHERITED_GUARD_KEYS` 时，回填不带它们、`else` 支又因 `g` 非空不执行 ⇒ 计数冻结在自动回合前的值——这条正是为什么要进清单。
  2. **评审覆盖成立处**——同步面 `record-results.mjs`（`agent._calledAdvisorThisRun = true` 的那一处，未完成尾不计）与异步面 `agent-tools/advisor-settle.mjs`（非陈旧结算）。理由：覆盖之后模型再改代码，是一个**新**的未评审周期，应得完整预算；不复位则预算在一个长回合内被历史周期吃完，guard 对后续周期静默。
  3. **写序推进点（位随新进展复位）**——`thincoder-core/agent/turn-loop.mjs` 的工具批执行处：`if (wroteSince(agent, agent._mutSeqMark)) {` 之内 `advisorPushbacks = 0` 与 `agent._advisorHonestySent = false` 两行手拉手。
     - **复位什么、不复位什么**：复位层 1 预算与诚实提醒位；**不复位** `agent._advisorReminders`——那是层 2 的周期上限计数，复位它等于取消周期上限。
     - **为什么位要跟着复位**：只复位预算、不复位位，「已发诚实提醒 → 又改代码 → 再收尾」这一段就静默放行（未评审即交付不吭声）——正是本机制要堵的形状；跟着复位，则每次「停推且仍未评审」的收尾各得一条，重复次数由模型真改了几次自然限定。
- **到顶行为（照 verify 面同构，不新造机制）**：回合判定为「未评审」而**这一轮推不成**（层 1 或层 2 任一耗尽）且位未置 ⇒ guard 推**一条诚实提醒**（置位、`continue`），要求模型在自己的回答里明说「这段代码未经评审」；下一轮仍推不成且位已真 ⇒ `done` 放行。位随写序推进点归假 ⇒ **每次「停推且仍未评审」的收尾各得一条**，重复次数由模型真改了几次自然限定；无新进展的周期只一条。文案只陈述事实（几条已发 ∥ 代码未评审 ∥ 二选一），**不**承诺「不再推」——新进展之后确实还会再推提醒。
  - **为什么是「任一层停推」而不是「推满 5 条」**：层 1 的预算只在真的写文件（或有子代理合并）时回满（上文 A），所以「改过一次代码后只读不写」是最常见的形态——层 1 停在 3 条、周期计数也停在 3，只认 5 条的到顶条件永不成真 ⇒ 两支都不进、直接 `done`、零诚实提醒，正是本机制要挡的「未评审即交付且静默」。现行判据（逐字实读）：`thincoder-core/agent/turn-loop.mjs` 的复位整段在 `if (wroteSince(agent, agent._mutSeqMark)) {` 之内；`thincoder-core/agent/completion.mjs` 的到顶分支条件含 `((agent._advisorReminders ?? 0) >= MAX_ADVISOR_REMINDERS || advisorPushbacks >= MAX_ADVISOR_PUSHBACKS)`——两层任一耗尽即成真。
  - **形态先例（verify 面到顶）**：`thincoder-core/agent/completion.mjs` 注释逐字「`// Exhausted retries — inject honesty reminder once`」，其提醒文案逐字开头「`[System reminder: ${MAX_VERIFY_RETRIES} verify attempts exhausted. You have not passed verification.`」。advisor 面照此形、只换主语：要求模型把「未经评审」说在自己的回答里——**不带**任何用户可见标记 / 新字段 / 配置键。
  - **末条推回文案（逐字——第 5 条 = 既有提醒正文 + 末条句）**：正文与前 4 条逐字相同（现有推回 `content`），末条句追加在正文之后：

```text
[System reminder: you changed code in this run and MUST get an advisor review before finishing (round ${rounds + 1}). Call the `advisor` tool now. This is required, not optional — do not skip it even if you believe the changes are trivial — the review will be quick either way. After the review, produce a response table for every issue found (see discipline rules for format). This is reminder ${MAX_ADVISOR_REMINDERS} of ${MAX_ADVISOR_REMINDERS} — the last one. If you deliver without an advisor review, state explicitly in your reply to the user that this code has not been reviewed.]
```

  - **到顶诚实提醒文案（逐字——`_advisorHonestySent` 置真时推的那一条）**：

```text
[System reminder: ${agent._advisorReminders ?? 0} advisor reminders sent. You have not had this code reviewed. Either call the `advisor` tool now, or state explicitly in your reply that this code has not been reviewed — do not present the work as reviewed. The user needs to know it is unreviewed.]
```

  - **断言引同一份逐字**：判据 = 末条句字面 `This is reminder`——第 1–4 条文案里无此字面（五条共用开头 `[System reminder: `，「含 reminder 一词」不作判据）；第 5 条含 `This is reminder 5 of 5 — the last one`（`MAX_ADVISOR_REMINDERS = 5` 代入）；到顶条含 `advisor reminders sent.` ∧ `state explicitly in your reply that this code has not been reviewed`（条数写实——3 或 5，取 `agent._advisorReminders`；断言不写死条数）。用例的文案比对取自上面两块，不另写一份。
  - **旧形（两字段缺失）**：两字段以 `?? 0` / `?? false` 读——缺失即视作 0 / 假，首条提醒照推、计数转 1；`thincoder-core/agent.mjs` 的默认对象因此零改（不新增初值），升级前的旧 agent 对象不需要迁移。
  - **一次性位 `agent._advisorHonestySent`**：周期两处复位点外，另随写序推进点（复位点 3）归假——无新进展的周期一条、有新进展后该次停推再得一条；不作 `runAgent` 体内局部变量——续跑重进 `runAgent` 时局部量每次回假，诚实提醒会随续跑重复。
  - **为什么不复用 verify 的 `honestReminderInjected`**：它是 `runAgent` 局部（`handleCompletion` 第 6 形参，契约行逐字「`@param {boolean} honestReminderInjected - whether exhausted-verify reminder was already sent (mutated)`」）。两面共用一个位，两 guard 同开时先到的一方即把另一方的诚实提醒吞掉——advisor 那一条正是本档要保的「未经评审」声明。
  - **为什么必须有这一条**：到顶后静默放行 = 把「未评审即交付」这条业务失败做成静默成功，而这道 guard 存在的目的就是挡它；提醒的作用是提醒、不是把回合焊死——同一条提醒重复 624 次严格劣于 5 条 ＋ 1 条诚实声明。
- **状态的跨段存活**：`_advisorReminders` / `_advisorHonestySent` 与本族 run 级字段同进 `thincoder-core/agent/helpers.mjs` 的 `INHERITED_GUARD_KEYS`。依据 thincoder-core/agent/helpers.mjs「快照/回填两 helper 共用本清单」：不在清单里的字段，自动回合收尾留下的 guard 三态（`run-stages.mjs` 的 `agent._inheritedGuard = snapshotGuard(agent)`）会被 `restoreGuard` 回填，而计数不随——下一次用户回合计数从零起，上限形同没设。同族既有键逐字含「`"_touchedFiles", "_verifyRetries", "_advisorRound",`」。
- **上限取 5 而非 3**：进展窗口预算保持原值 3；周期上限再给一次「真改了代码还是漏评审」的宽限。5 条仍不评审的模型不是在等提醒。
- **两层的叠加**：单个周期内 ≤ `MAX_ADVISOR_REMINDERS`（5）条，任一进展窗口内 ≤ `MAX_ADVISOR_PUSHBACKS`（3）条。

## 7. 响应表纪律（Action 四值）

纪律层的响应表纪律（**纯提示词纪律——不加机械解析**——响应表仍是“聚焦参考”，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取，保持逐字。每 issue 一行；`#` = advisor 的 issue 编号（**round2+ 用原编号**——不重编号）。
2. **`Action` 四值封闭词表**：`Fixed`（**已落地**——已改代码/设计）、`Dispatched`（**修正轮在途——尚未落地**）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附理由——适用于 🟡/🔵 改进、需用户先拍板的 🔴，或**携理由的认账不修 🔴**（争议窗自第 3 轮起收口，§2.5）；零理由即不接受，**不得用于静默丢弃真缺陷**）。`Detail` = 改了哪、在哪（file:line），或证据 / 理由。**不修即须携理由**——零理由的沉默 ∥ 回避不在接受之列（争议窗语义见 §2.5）。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码 / 设计——“之前就有”“不是我引入的”永远不是跳过修复的理由；问题何时出现不决定它该不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**（父代理不直接写实现代码）；一个 🔴 既不修也不 surface = **阻断收敛**。
5. **收口时序**：见 §7.1。

### 7.1 修正轮 ⇄ 用户批准 时序

- **链行节点**（两档同文插入）：`… 提醒用户发起设计评审（发起权在用户）→ **评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** → 用户批准 → spawn eng-coder 实现。`
- **时序规则**：评审 pass 后逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），**修正轮落地并经核验后，才可请求用户批准**；**修正轮在途时不得请求批准**——在途状态只作汇报，汇报不携带批准请求。
  **修正轮边界**：只落评审发现与裁决直接导出的修正——**不得夹带新语义 / 新范围**；夹带即新内容，须显式摆给用户单独定。
  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。
- **落点**：两档运行期提示词——`thincoder-core/prompts/discipline-normal.md` §Review discipline ∥ `thincoder-core/prompts/persona-engineering.md` §Review convergence；
  就地把「三选一」句替换为四值文本；时序 bullet 紧随裁决表条块末行之后。

## 8. 需求契合度检查（requirement fit）

- **ROUND1 提示词含此评审维度**——核对实现与用户诉求的差异，两个对照：
  - (a) **声称 vs 实现**：实现者陈述的目的（对话背景 / 响应表 / 提交说明）对照实现实际行为——“声称做 X 却给了 Y”是偏差；
  - (b) **期望 vs 形态**：需求文档（项目指南指向）与用户明确期望对照交付形态——“要 A 却给了 B”是偏差。
- 偏差按影响标 🔴/🟡，Issue 中写明：用户要什么、实现给什么、差在哪。**证据约束**：判断必须引用证据（用户原话或实现行）——无证据的“需求偏差”至多标 🔵——与 citations 机械校验共用同一证据规则。
- **需求文档是主参照**：评审 user 消息注入项目指南块（预算 = max(8KB, 评审模型上下文 × 5%)；注入段标注项目根），评审者第一步必须读它并按指引读需求文档——“用户需求在文档里，对话背景只是补充”（对话背景只取最近 3 轮）；无项目指南档时诚实降级（明说以对话背景为准）。
- **项目根定位**：项目根是工作目录下的**子目录**——从评审范围第一个文件所在目录**在 cwd 边界内**向上找最近的项目指南档（monorepo：被评审文件归属的子项目就是项目根）；都找不到 → 诚实降级。**不向上越过 cwd**。

## 9. 源码档尺寸档位核查（设计评审维度）

> 权威链（指环单向化）：尺寸档位**义务**（限源 / 测试文件；量出来的数只用于定尺寸档位，不落档）= 纪律层代码结构判据节；**判据数值单源 = `docs/core/design/DOC-DISCIPLINE.md` §3.10「尺寸档补充登记」**；核查维度行为语义 = 本节；执行实现 = 设计评审提示词的对应维度。

advisor design review 标准维度补一条：

- **源码档尺寸档位核查**：本批要动的源 / 测试档（清单取自**批档 §2**——**设计档不设「受影响文件」表**：那张表答的是「这一批改了哪些档」，是一次性执行记录，住状态档就是一份没人回来更新的过期账），评审席按样本抽样、**逐档自行现量**，按 `docs/core/design/DOC-DISCIPLINE.md` §3.10 的判据数值判它该不该拆。**判据两条**：① 越档者逐档给拆分计划（点名拆点与迁入档）；② **设计档内不出现行数 / 增量数值——出现即报**（数值带时刻，抄进状态档即从「某刻的事实」变成「一句明天就旧的话」）。`.md` 档零尺寸档位义务（不判尺寸档位 / 不写拆分计划）。

## 10. 工程模式集成（收敛相关）

工程模式承诺「Advisor is mandatory at both design and code gates」。机械强制链的**完整机制权威 = `docs/core/design/ENGINEERING-MODE-V2.md`**（v1 设计档已归档）——本档只留收敛相关语义：

- **Design gate**：spawn eng-coder 时 token 校验 + 写文件门禁——确保设计评审先行；design 评审通过（凭证回显）时同步置位。凭证机制（多槽 / 消费 / TTL）权威 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（v1 设计档已归档）。
- **Code gate**：eng-coder 返回后子代理改动合并使父代理 guard 触发（§6.2）——无法绕过代码评审。
- **guard 在工程模式关闭**——评审义务由上述机械链承担，不靠 completion 推回。
- **轮次与终止**：per-review 实例；**无机械轮次上限**（§3）——第 6 次及以后的发起照常受理；失败路径以结论终止、反复失败停下上报（§3.2）。
- **信任模型边界**：机械闸作用于 eng-coder 子代理；父代理本身不受写文件门禁约束（需写 docs/），其“设计先行、委托实现、实现后 code review”靠工程提示词约束。

## 11. 配置

- 项目级 `.thincoder/advisor.md`：评审准则覆盖——存在则替换内置默认准则（正确性 / 安全 / 一致性 / 完整性 / 可维护性五维）；项目可在覆盖文件里追加规则（如本仓的文件尺寸档 >500 advisory / >800 critical）。
- `config.json`：`advisor.provider` / `advisor.model` 可选覆盖主 agent 的 provider / model；`advisor.guard` 为 completion guard 开关（默认 false）。
- **轮次提示词硬加载**：四份提示词文件缺失即抛错（防静默降级到劣质内置 prompt）。

## 12. 验证

评审收敛行为（轮次提示词替换、prior 原文注入、确定性轮次判定、**第 6 次及以后照常受理探针**、guard 推回判定、fresh session、host-verified citations、对象声明块注入）的回归测试按测试基建执行（`docs/core/design/TESTING.md` §10：单入口 `npm test`——`slow` 纯别名、原慢测用例随入口全跑）。

提示词锚（“Do NOT look for new issues”、证据规则句等）的防回退核对 = **逐字读核对**；如需机检，形态限**行为面 / 结构机检**（禁读非测试文件断言「某句在场 / 缺席」的散文锚测试——纪律 = `docs/core/requirements/TESTING.md` §2）。

**验收标准（逐条回指需求）**：

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-AC1 | 轮次表与提示词选择：round1 全量 / round2 验 prior 为主 / round3+ 只验 prior；判定无 LLM 输出解析 | 轮次定义 |
| A-AC2 | 轮次无上限：同实例第 6 次（及以后）发起照常受理——不返回终止串；guard 不以轮次为停推条件 | §3.1 |
| A-AC3 | 零会话级轮次计数器：无按计数拒发的常量 / 工具层预检 / 内防线 / guard 轮次项 | §3.1 |
| A-AC4 | fresh session：round2+ 不复用 round1 会话数组；旧 read 输出不在上下文 | 会话隔离 |
| A-AC5 | prior 注入：round2+ 用户消息含上轮完整原文；非评审形态输出不作 prior | prior 注入 |
| A-AC6 | citations 机械校验：`[host-verified] N/M` 报告在位；不匹配清单 ≤10 条；围栏生效 | 证据纪律 |
| A-AC7 | 触发范围：文件写工具与子代理合并 → 失效 + 可推回；bash / git → 只失效 verify；只读 → 否 | 触发范围 |
| A-AC8 | guard 公式全条件齐备才推回（5 合取 + 3 前置：顶层 / guard 开启 / 非工程模式）；opt-in 且工程模式关闭 | guard |
| A-AC9 | 响应表 `Action` 四值封闭；`Dispatched` 行在批准请求前须收敛为 `Fixed` | 响应表 / 时序 |
| A-AC10 | 需求契合度维度在位（声称 vs 实现 / 期望 vs 形态）；证据约束（无证据至多 🔵） | 需求契合 |
| A-AC11 | 尺寸档位核查维度在位（清单取自批档 §2 ∧ 评审自行现量 ∧ 设计档内无行数 / 增量数值）；函数档为第一判据 | 尺寸档位核查 |
| A-AC12 | 争议窗与接受收口（F32）：轮 2 可对不修理由出打回（轮 1 无 prior——窗语义不入，§2.5）、轮 3+ 对携理由不修项接受收口；零理由项任一轮保持未解（提示词逐字在位 + 表列 `Accepted` 词表行逐字可核——**逐字读核对**；机检限行为面 / 结构机检） | §2.5 |
| A-AC13 | pass 判据随动（F33）：轮 3+ prior 🔴 全部 ∈ {fixed, accepted} 才可 pass；零理由未解项 ⇒ 不可 pass（轮 2 / 3 裁决句逐字 + 设计回显条件句在位——**逐字读核对**；机检限行为面 / 结构机检） | §2.4 / §2.5 |
| A-AC14 | 跨评审隔离：并发 / 延迟下消息构建取本评审实例值（排队启动复核）；轮 2+ 响应表取件不小于本评审投递水印（前向取首表；无水印回落全文倒扫） | §4.3 / `AGENT-LOOP-ASYNC-POOL.md` §6.10 |
| A-AC15 | 同类先例核查维度在位（「同类先例」行：先例坐标 + 对齐 ∥ 偏离理由；偏离理由显式判据；无先例须显式声明）；设计评审提示词对应维度在位——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 9 条；**已落笔**（EN 在盘——2026-10-10） | 同类先例 |
| A-AC16 | 勘察证据行核查维度在位（「勘察证据行」：查过哪些公共源文档 ∥ 有无相关；缺行 ⇒ 未查或未记；无相关须照记）；设计评审提示词对应维度在位——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 10 条；**已落笔**（EN 在盘——2026-10-14） | 勘察证据 |
| A-AC17 | 分支出处核查维度在位（每条新增分支带「依据」：真实观测 ∥ 复现命令；两者都给不出 ⇒ 🔴；真防御给得出复现路径即过）；设计评审提示词对应维度在位——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 `6b` 条（第 6 条与第 7 条之间） | 分支出处 |
| A-AC18 | 集成测试设计段核查维度在位（设计档缺该段 ⇒ 🔴（设计不完整）；改动未触及业务行为 ⇒ 段内写明「无变化 + 理由」，理由须是「未触及业务行为」本身，以窗口上限为由不成立 ⇒ 仍 🔴；段内场景逐条回指业务需求）；设计评审提示词对应维度在位——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 12 条（**逐字读核对**；机检限行为面 / 结构机检）；**已落笔**（EN 在盘——2026-10-24） | 集成测试设计段 |

**工具轮 assistant 消息构造（回声恒带——`CONTEXT-COMPACTION.md` §7 D-CC22）**：`thincoder-core/advisor/loop.mjs:207-217` 推入 `messages` 的 assistant 消息由核单点 `assistantToolCallMessage(response, providerSpec(provider))`（`thincoder-core/model-specs.mjs`）构造——`reasoningEcho:"required"`

 族（继承主 provider 或显式 `advisor.provider`，均按 `providerSpec` 判定）**恒带** `reasoning_content`（本轮无推理 ⇒ 空串）；`optional` / 未声明族恒不带。

## 14. 同类先例核查（设计评审维度）

> 权威链（指环单向化）：同类先例勘察**义务**（设计前置勘察 · 对齐优先 · 偏离须显式理由）= 纪律层设计步；核查维度行为语义 = 本节；执行实现 = 设计评审提示词的对应维度（承 F2-6）——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 9 条；**已落笔**（EN 在盘——2026-10-10）。

advisor design review 标准维度补一条：

- **同类先例核查**：设计档是否含**「同类先例」行**——先例坐标（实现坐标 ∥ 设计档对应节 ∥ 先例批）+ 对齐 ∥ 偏离理由；**有意偏离 ⇒ 理由须显式**（可核形 = 指认所勘先例 + 说清既有形为何不适用——缺任一即未显式）；**无同类先例可勘 ⇒ 显式声明**（不得静默省行）。
- **与方案选型对比互邻**（F2-6 边界）：先例 = 对比的输入面——对比在场（候选 ≥2）时先例即其判据输入；本维度只核「同类先例」行，不引入候选对比要求。

## 15. 勘察证据行核查（设计评审维度）

> 权威链（指环单向化）：跨仓文档勘察**义务**（设计席开工前先查工作目录树内的公共源文档 · 「查没查」在链上可见）= 纪律层设计步（需求侧登记 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.4「跨仓勘察三句」块）；核查维度行为语义 = 本节。
> 执行实现 = 设计评审提示词的对应维度——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 10 条；**已落笔**（EN 在盘——2026-10-14）。

advisor design review 标准维度补一条：

- **勘察证据行核查**：设计档是否携**勘察证据行**——查过哪些公共源文档（尤其独立文档仓）∥ 有没有相关。**缺行 ⇒ 未查或未记**；**无相关 ⇒ 也须照记**（不得静默省行）——复核链本无此项；「没查」得有地方现形。

## 16. 分支出处核查（设计评审维度）

> 权威链（指环单向化）：**义务** = 设计档每条针对输入 ∥ 状态的分支须带「依据」（真实观测 ∥ 可复现失败路径）= 纪律层设计步（需求 = `docs/core/requirements/METHODOLOGY.md` §2.1 F2-7）；**核查维度行为语义 = 本节**；执行实现 = 设计评审提示词的对应维度——落点 = `thincoder-core/prompts/advisor-design.md` §评审标准第 `6b` 条（第 6 条与第 7 条之间）。

advisor design review 标准维度补一条：

- **分支出处核查**：设计档是否逐条给出新增分支的**出处**——真实观测（数据读数 ∥ 日志一行 ∥ 用户报告，引读数或原文）或可复现的失败路径（把它复现出来的命令）。**两者都给不出** ⇒ 该分支防的是一个没有发生过的场景 ⇒ **🔴**。
- **真防御能过**：给得出复现路径的分支照过——本维度杀的是「说不出场景」的分支，不是防御本身。
- **与第 6 条 `Scope` 的分工**：第 6 条判**范围总量**（该不该做 · 有无简化机会 · 有无蔓延）；本节判**单条分支的出处**——两条独立判红，不得以第 6 条过掩本节红，也不得把本节的红记成范围问题。

## 17. 集成测试设计段核查（设计评审维度）

> 权威链（指环单向化）：集成测试设计段**义务**（业务设计一并设计集成测试——场景 + 业务可观察判据 + 逐条回指业务需求）= 纪律层设计步（需求 = `docs/core/requirements/TESTING.md` F34 `:199`，该条明书「不是评估项、不是可选项」）；**核查维度行为语义 = 本节**；执行实现 = 设计评审提示词的对应维度——落点 = `thincoder-core/prompts/advisor-design.md` §Review Criteria 第 12 条。

- **核查**：设计档是否含集成测试设计段——本次改动新增 ∥ 修改的集成场景表、每场景断言的业务可观察结果，且**逐条回指业务需求**（F34 `:199`「场景表 + 判据，逐条回指业务需求」）。
- **缺段 ⇒ 🔴**（设计不完整）；改动未触及业务行为 ⇒ 该段写明「无变化 + 理由」，这是唯一替代形态。
- **理由不成立 ⇒ 仍判 🔴**：理由须是「改动未触及业务行为」本身；以集成窗口已满（50–100 用例）为由不成立——F34 `:199` 明书该窗口是**上限约束**（超窗裁减旧场景），不是「不新增」的理由。
- **同类先例**：先例坐标 = 本档 §14（`:407`）∥ §15（`:416`）∥ §16（`:425`）的同一形（权威链引块 + 核查条目 + A-AC 行 + 提示词逐字建议）；实现坐标 = `thincoder-core/prompts/advisor-design.md:40`（第 9 条）∥ `:44`（第 10 条）。**对齐**：本节整形复用，不另立专名。**偏离**：无。
- **勘察证据**：`index.publicRepos` = `[]`（`PROJECT-MANIFEST.json:35`）⇒ **零仓外声明源**（无相关也照记）。本节成形所据的树内公共源 = `docs/core/requirements/TESTING.md`（F34 `:199` = 唯一需求依据 ∥ N20 `:115` = 集成集只住三前端）· 本档 §14 ∥ §15 ∥ §16（同形先例）。
- **为什么必须查**：集成测试是唯一从用户可见入口走的验收回路；批内单测档收口即删——设计时没定下集成场景，这个改动收口后就没有验收了。

**【提示词逐字建议】`thincoder-core/prompts/advisor-design.md` §Review Criteria 第 12 条**：

```text
12. **Integration-test design**: the design document must contain an integration-test design section — the scenarios this change requires, the business result each asserts, and the business requirement each traces back to.
    **A design missing that section ⇒ 🔴 (design incomplete)**; a change that alters no business behavior states so, with its reason, in that section.
    **A reason that is not "this change alters no business behavior" does not stand** — e.g. the 50–100 case window being full ⇒ still 🔴.

    **Why**: integration tests are the only acceptance run that starts from a user-visible entry, and the batch's unit-test files are deleted at closeout — a design that never names those scenarios leaves the change with no acceptance at all.
```

**本批集成测试设计**：无新增集成场景——理由三条：① 本改动 = 评审判据文本（提示词 ∥ 过程面）；② 裁决面依赖模型输出，无可确定性断言的前端入口；③ 集成集只住三前端（`docs/core/requirements/TESTING.md` N20 `:115`）。验证面 = 逐字读核对 + doc-check gate。
