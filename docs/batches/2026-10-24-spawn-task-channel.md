# 2026-10-24 · spawn 取消自由文本任务参数：批档 = 唯一任务通道
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 22:42「真正的解决方案是取消designPoints这个参数，要求一切必须写在批档里」+ 22:43「那把这些自由文本参数都取消，eng-coder只接受批档一个任务通道」。
> 台账 = #1771（ENGINEERING-MODE · 归批）。前情 = 2026-10-24-prompt-wording-clarity.md（进行中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25

**要解决的问题（今晚实测）**：父侧用概念批的 token、概念批的批档，外加自己写的一段 `designPoints`，派出了 eng-coder（`#78`）——**那三处改动从未被设计过，也没被评审过**。

门当时校了三样：批档读得到、token 未过期、与该 designId 配对正确。三样全真，于是放行。**门校的是「凭证自洽」，不是「任务书属于这份设计」。**

- **已定决定**：取消自由文本任务参数，eng-coder 只接受批档一个任务通道。用户原话：「真正的解决方案是取消designPoints这个参数，要求一切必须写在批档里」「那把这些自由文本参数都取消，eng-coder只接受批档一个任务通道」· 时间：2026-10-24 22:42–22:43

**已有同向口径（不是新想法）**：`docs/core/requirements/_archive/ENGINEERING-MODE-MECHANISM.md` ── 「任务书就绪（本节即任务书──spawn 传路径，不另写副本）」。`designPoints` 等于允许主 agent 再写一本副本，而副本没有任何门校过。

**待设计定的范围**：eng-coder 侧 `goal` ∥ `knownFacts` ∥ `designPoints` ∥ `acceptance` ∥ `reportFormat` 是否全取消；eng-designer 同办与否；explore / plan / coder 三类无批档的角色怎么办。

**已知代价**：取消后子代理只能读 §2——§2 写得不够，就没有补递渠道，只能打回。那是好事（逼 §2 写清），但要在设计里写明。

- **已定决定**：**批档不得被引用**——一切引用只许指向需求 / 设计等持久约定。用户原话：「不允许跨批引用！所有的引用只能是对需求、设计之类的持久性约定的引用，批档不是持久稳定的，可能被归档清理，怎么能被引用呢！」· 时间：2026-10-24 22:55

  推论（写给实施与设计）：① 任务书 §2 里**禁止**出现任何批档路径（含「参照上一批」「同 `#NNNN`」这类指向）；要引用就引需求档条目或设计档小节。② 现有 `AGENT-LOOP-SUBAGENT.md` §6.29.3 的「跨批引用检测」**不是要保住它，而是要按本条重定**——检测面存在的前提是允许出现，而本条规定它不该出现。③ 现有设计 / 需求档里凡以批档为出处载体的行，按 `DOC-DISCIPLINE.md` §4.5.1「规范档引批档 ⇒ 删引用」处理。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**状态行**：✅ 设计完成（2026-10-24）

**本批条目（覆盖）**：机制正文全部在 `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.22（本批重写）；需求面口径在 `docs/core/design/ENGINEERING-MODE-V2.md` §（`:256-258`）。§2 只记「条 → 落点」，不复制判据。

| # | 条目 | 落点 |
|---|---|---|
| ① | 取消范围：eng-coder ∥ eng-designer 的全部任务书文本参数；explore / plan / 普通 coder 不动 | design §6.22.1 表 + §6.22.4 KD-SC1/SC2/SC3/SC4 |
| ② | spawn 门必填集合与拒因文案（一眼看出缺什么 / 哪个键被拒） | design §6.22.1 必填集合表 + 拒收文案模板 |
| ③ | 提示词面逐字（工具描述 / schema description / persona / discipline / preview） | design §6.22.8 P1–P12 |
| ④ | 过渡期：现存设计 / 需求档里 `designPoints` 落点条款 | design §6.22.3 清单 + P12、AC-SC-7 |
| ⑤ | gate PASS | 见 §6 记录 |

**范围判据（用户 2026-10-24 22:46，逐字）**：只读角色改不动任何东西，通道不构成风险；有写权的角色必须只有一个任务来源。
⇒ 收口面 = eng-coder ∥ eng-designer。非工程角色零改（含 explore 在工程模式内的审计派单）。

**动作表（实施轮按行落，落点 = 现盘坐标）**

| # | 文件 | 落点 | 期望结果 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/spawn-gates.mjs`（171） | 删 `ENG_TASK_BOOK_MIN`(:27) / `designPoints` 标签(:81) / `fifth.engineering`(:61)；新增 `ENG_REFUSED_PARAMS`（八名单源）+ `rejectEngFreeTextParams(args, role)` | 工程角色命中任一自由文本键 ⇒ 抛，文案按 design §6.22.1 模板；非工程角色路径零变 |
| 2 | `thincoder-core/agent-tools/subagent-spawn.mjs`（435） | `batchDoc` 门之后、`validateRoundParam` 之前调用拒收门；工程角色 `input` 改任务书行（§6.22.2）；`_engTaskInput` 同值 | 工程 spawn 放行时 input / `_engTaskInput` 含批档绝对路径与「§2 = 唯一任务通道」 |
| 3 | `thincoder-core/agent-tools/audit-block.mjs`（109） | 删 `summarizeEngTaskBook` 与其 marker 表；`buildAuditBlock` 注入 `Batch record (batchDoc): <abs path>` + §2 指向句（路径取 `ctx.agent._batchDoc`） | 审计块含批档路径；`summarizeEngTaskBook` 符号 0 命中 |
| 4 | `thincoder-core/agent-tools/subagent.mjs`（423） | 删 `designPoints` 属性(:155)；`:142` `task`、`:143` `context`、`:153-158` 五条 description 按 P3/P4/P5 改口；`:227-229` 载体判据改「工程角色 = 无文本参数」 | 描述面与门同源；非工程角色描述不变 |
| 5 | `thincoder-core/tool-docs/subagent.md`（39） | `:23` 整段替换为 P1 字面；`:26-27` 示例按 P2 | 与 §6.22.8-A / P2 逐字全等 |
| 6 | `thincoder-core/prompts/persona-engineering.md`（473） | `:72` / `:312` / `:432-433` 示例按 P6/P7/P9；`:325-346` 整段按 P8（`files` 是调度通道那两条警告逐字保留） | 工程派遣示例中 `goal=` / `knownFacts=` / `designPoints=` / `acceptance=` / `reportFormat=` 0 命中 |
| 7 | `thincoder-core/prompts/discipline-normal.md`（315） | `:253-260` 按 P10：收窄到 normal-mode 角色 + 加一行工程模式说明 | 「every spawn role」0 命中 |
| 8 | `thincoder-core/permission.mjs`（133） | `:38` 按 P11：拼装空 ⇒ 回退 `task book: batch record §2 (<path>)` | 工程 spawn 的权限预览非空且指向 §2 |
| 9 | `bench/probe/data.mjs`（217）· `bench/check/probe.check.mjs`（306）· `bench/check/probe-frozen.mjs`（107）· `bench/probe/driver.mjs`（267） | 三族夹具：五参 → `{round, batchDoc, model}`；p1/p2/p3 的冲突内容移进夹具批档 §2；断言组改「拒收 + 任务书行」 | bench 全绿；旧五参形夹具 0 命中 |
| 10 | `docs/core/design/MODEL-BENCH.md`（1844） | `:1439-1440` / `:1462` / `:1469-1503` 夹具形改指夹具批档 §2 | 与 bench 实盘一致 |
| 11 | 需求面（**主 agent 笔，设计席只登记**） | `docs/core/requirements/ENGINEERING-MODE-V2.md:430` / `:433`；`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md:7` / `:12-19` / `:33` | 按 design §6.22.8 P12 改法列 |

**验收对照（每条回指设计档，不在 §2 复制判据）**

| 设计判据 | 机检形态 |
|---|---|
| AC-SC-1 / AC-SC-2 | `bench/check/probe.check.mjs` 断言组：工程角色 × 八键逐键抛且点名；缺 `batchDoc` / `round` / `designToken` 各出既有拒句 |
| AC-SC-3 | driver 放行态：`input` 与 `_engTaskInput` 含批档绝对路径 + §2 指向句 |
| AC-SC-4 | 非工程五参行为 / 拼装序 / 文案逐字比对（改前基线） |
| AC-SC-5 | `thincoder-core/tool-docs/subagent.md` 新段与 design §6.22.8-A 逐字全等；两档 `designPoints` 表述 0 命中 |
| AC-SC-6 | 审计块含 `Batch record (batchDoc):`；`summarizeEngTaskBook` 0 命中 |
| AC-SC-7 | 现存档 `designPoints` 落点条款逐条改指（清单 = 动作表 11 行 + 本仓设计档） |

**关键决策（判据在 design §6.22.4）**：KD-SC1 全删（含 `reportFormat`——它是平台惯例，不是任务内容）；KD-SC2 非工程角色不动（范围判据）；KD-SC3 `goal` 等留在 schema、由门拒绝，`designPoints` 真删；KD-SC5 子代理自读 §2，运行时不注入正文；KD-SC7 §2 写不够 ⇒ 打回，**这是有意的**——没有补递渠道。

**上抛项**

- `[上抛·待裁]` `task` / `context` 一并拒收是**推导项**：用户列表点名五参，未点名这两键；依据 = 范围判据「有写权的角色必须只有一个任务来源」。若用户只认五参字面，删掉这两键的拒收即可，其余判据不动（design §6.22.4 KD-SC4）。
- `[上抛·知会]` 需求面五处（动作表第 11 行）属主 agent 笔；不随本批实施轮落地则需求与设计不同口径。

**明确不覆盖**：token 机制、`batchDoc` 必填性与其判据、`files` / `dependsOn` 调度语义、`round` 枚举、角色 enum、非工程角色任务书参数、§2 内容校验、`escalate` 的 `task` 语义（design §6.22.7）。

### 轮次 1 修正（2026-10-24 23:05）——按评审号处置

评审表 = §3 轮次 1，全接受。落点均在 `docs/core/design/`，判据正文不在此复述（§2 引用不抄写）。

| 号 | 处置 | 落点 |
|---|---|---|
| 🔴1 | `ENGINEERING-MODE-V2.md:68` M5 职责格改新口径（工程角色 = §2 + `round` + token ∥ 非工程角色 = 四项核心 + `scope`），并登入设计档受影响文件行（该档三处：`:68` / `:256` / `:306`） | `AGENT-LOOP-SUBAGENT.md` §6.22.3 该档行；`ENGINEERING-MODE-V2.md:68` |
| 🟡2 | 四处 F 指针改锚：`:23` → §6.23.3 · `:479` → §6.23.3 · `:824` → §6.22.1 ∥ §6.22.4 · `ENGINEERING-MODE-V2.md:306` → §6.22.1。同族另四处「F5」表述（§6.23.5 / §6.23.7 / §6.23.8 / §6.24）一并改锚 §6.23.3 | 同上两档 |
| 🟡3 | §6.22.1 增「门的取参面 = 工具入参原对象」；§6.22.4 KD-SC3 补同句；§6.22.6 增用例 #13（属性不在 schema ∥ 键到达门，两条断言同时成立）。实现轮须核实唯一取参点在 schema 剥键之前 | 同档 §6.22.1 / §6.22.4 / §6.22.6 |
| 🟡4 | 逐字正本单源：文本正本 = §6.22.8-A，§6.30 正文块删除改引用；示例正本 = §6.30 参数骨架块，§6.22.8 P2 改行引用 | 同档 §6.22.8 / §6.30 |
| 🟡5 | §6.22.5 全表改「判据 + 机检命令 ⇒ 期望」，AC-SC-5 落字面量 grep + `node --test`（照 §6.23.7 形） | 同档 §6.22.5 |
| 🟡6 | `thincoder-core/prompts/discipline-engineering.md`（345 行）登入受影响文件（±0）并记 0 命中读数 | 同档 §6.22.3 / §6.22.7 第 9 条 |
| 🟡7 | §6.29.3 登记「工程角色观测面恒空」+ 替代判据（双点留痕 + 评审人核）；§6.22.7 第 8 条 | 同档 §6.29.3 / §6.22.7 |
| 🟡8 | 引文标注改实：§6.22 范围判据改标「本设计的推导」并逐字引 22:42 / 22:43 两句；KD-SC4 依据改为 22:43「都取消」原话 | 同档 §6.22 / §6.22.4 |
| 🟡9 | `:42` spawn 参数格改「role / batchDoc / round / …（逐角色见 §6.22.1）」；`:21` eng-designer 行补 `round` | 同档 §6.7.1 / §6.7.2 |
| 🟡10 | §6.22 增「最近先例」（§6.23 族，对齐 / 偏离各一句）与「勘察证据」（查过的档 + 无同案结论） | 同档 §6.22 |
| 🟡11 | 本档 835 行已过 800 硬限 ⇒ 拆分候选登记（§6.22 逐字面 + §6.30 描述面另立设计档 `SPAWN-TASK-CHANNEL`，下一批创建） | 同档 §6.22.3 本档行 |
| 🔵12 | §6.22.3 加行数口径与 as-of 戳；同口径重读：本档 835 · `ENGINEERING-MODE-V2.md` 517 · `subagent-spawn.mjs` 435（`ENGINEERING-MODE-V2.md:68` 原记 484 已改 435） | 同档 §6.22.3；`ENGINEERING-MODE-V2.md:68` |

**§2 自更正（两处标注失实）**：上文「范围判据（用户 2026-10-24 22:46，逐字）」与上抛项「用户列表点名五参」两句不成立——记录在案的只有 22:42 / 22:43 两句原话（§1 已定决定），范围判据 = 本设计的推导。设计档已按此改标，§2 以本段为准。

**未动**（按任务书）：源码（`TOOLS` / `subagent.mjs` / `permission.mjs`）与需求档正文（主 agent 笔，改法见设计 §6.22.8 P12）。

**gate 读数**：`DOC-CHECK GATE: PASS`（两档全清，0 条命中）。

**收尾更正（读数不复制）**：上表 🔵12 行的行数读数成文于两处收尾修正之前；现行值以设计档 §6.22.3 两行（`AGENT-LOOP-SUBAGENT.md` 本档行 · `ENGINEERING-MODE-V2.md` 行）为准，本段不抄数。

**受影响文件面补登**：评审 🔴1 要求「把 `:68` 纳入受影响文件表」已落；评审 🟡2 要求「改锚登进受影响文件行」亦已落（本档行现写明 `:21` / `:42` / §6.24 / §6.30 四处改锚）。

### 用户新裁定（2026-10-24 22:55）——跨批引用禁令：第 7 条的处置方向改判

裁定原话见 §1。「登记降级」不够，按裁定重办三件：

| # | 处置 | 落点 |
|---|---|---|
| ① | **禁令写进设计正文**：任务书（批档 §2）禁止引用任何批档（路径 / 批档节号 / 「参照上一批」这类指向），只许引需求档条目 / 设计档小节 / 代码坐标；执行面 = §2 写作约束 + 设计评审退回项；不新增运行时内容校验（KD-SC7 不变） | `AGENT-LOOP-SUBAGENT.md` §6.22 |
| ② | **原检测面 = 废止**（提取谓词 · `child:batchdoc-ref` 事件 · T15 三件套一并删）：前提被裁定推翻（原判据自述「合法引用他批档是常态」）、扫描对象已失效（工程角色 input 只剩一行机械文本）、无场景分支不留。§6.29.2 双点留痕保留（管 payload 绑定，不涉跨批引用） | 同档 §6.29.3（标题改「跨批引用：规范禁止 + 检测面废止」）· §6.22.7 第 8 条 |
| ③ | **设计档清账**：本档删两处批档出处（§6.25 的「见批档 §2 发现表 F-1」括注、§6.22 的「原文照录自本批 §1」），并新增 AC-SC-8 判据 | 同档 §6.25 · §6.22 · §6.22.5 |

**顺带的同族处置**：§6.22.5 / §6.22.9 的「回指 §2 条目 N」列删除——设计档不向批档回指（引用方向 = 批档 → 规范档单向）；要件链由 §2 单向指向设计小节。

**AC 命令实测（改前基线，供实施轮对照）**：AC-SC-5 七列读数 `5 / 1 / 1 / 4 / 1 / 1 / 0`（改后期望 = 首三列与第三档均 0）；AC-SC-6 = `3`（改后期望 0）；AC-SC-8 = `0 0`（已达成）。命令原文见 §6.22.5。

**未动**：他档同类「规范档引批档」行不在本批范围。

### 轮次 2 修正（2026-10-24 23:0x）——按号处置

评审表 = §3 轮次 2，全接受。**🔴13 属轮次 1 漏项**：轮次 1 的跨节改锚清单只登 `:21` / `:42` / §6.24 / §6.30，未登 §6.26；不是轮次 1 的修正改出来的。落点均为 `docs/core/design/AGENT-LOOP-SUBAGENT.md`（下称「本档」）。

| 号 | 处置 | 改动 |
|---|---|---|
| 🔴13 | §6.26「改后」代码块去 `summarizeEngTaskBook` 调用，改注「touched 快照 + 模板逐字 + 批档路径行（路径取 `ctx.agent._batchDoc`；无 A2 摘要）」 | 本档 `:618` |
| 🔴13 | D23-6 改 `_engTaskInput` = 一行机械任务书行（批档绝对路径 + §2 指向句），A2 摘要面随 KD-SC6 删除 | 本档 `:679` |
| 🔴13 | 分类裁定表第 3 行：「A2 摘要的源」→「批档路径记账面」，补值形与 A2 面已删 | 本档 `:589` |
| 🔴13 | 受影响表两行去「`summarizeEngTaskBook` 外提 / 持有」（spawn 档只留审计模板构造体外提；audit-block 行只留 `buildAuditBlock` 三件） | 本档 `:659` · `:660` |
| 🔴13 | 跨节改锚清单补登 §6.26（与旧 #1 / #9 同一处置形），点名改锚四处 | 本档 `:329` |
| 🔴13 连座 | `_engTaskInput` 括注原写「审计通道据此取批档路径」，与 KD-SC6 的路径源（`ctx.agent._batchDoc`——见本 §2 动作表第 3 行）互斥 ⇒ 改「记账面 + 审计块另取 `_batchDoc`」 | 本档 `:306` |
| 🟡14 | 执行面单源 = §6.29.3 三项：`:263` 改纯指向（不再并列两项）；`:807` 第 ③ 项由「随本批完成清账」改为机检形态（AC-SC-8 三式） | 本档 `:263` · `:807` |
| 🟡14 | §6.26 A23 表「回指」列整列删（与 §6.22.5 / §6.22.9 同族处置）；表头句「逐条回指」→「逐条可机判」 | 本档 `:694` · `:696-703` |
| 🟡14 机检补面 | AC-SC-8 增第三式（批档 §2 条目号形）；正则字面按既有「不自匹配本行」法拼接断开 | 本档 `:358` |
| 🔵15 | 先取读数：项目引擎 `node scripts/doc-check.mjs --root .` ⇒ `FAIL(行宽): 1174 行超 300 字符`（全仓存量，非本档）；**本档 `行宽 …AGENT-LOOP-SUBAGENT` 命中 = 0**（表格行与围栏块豁免）⇒ 不折行，AC 表保持整条命令入格 | 本档零改 |

**验收读数（本轮实测）**：`summarizeEngTaskBook` 全档 6 处，全为「删 / 0 命中」义——`:318`（受影响表·删）· `:329`（改锚注·删）· `:342`（KD-SC6·删）· `:356`（AC-SC-6·0 命中）· `:431`（集成测试·0 命中）· `:679`（D23-6·删）；无「应存」表述。AC-SC-8 命令实测 = `0 0 0`。非表格 / 非围栏行 >300 字符 = 0。本档行数 = 841（未变）。

**本轮不做**：源码零改 · 需求档零改（按任务书）。

### 轮次 3 修正（2026-10-24 23:2x）——实施席落盘撞点两处

来源 = 实施席 2026-10-24 23:17 上抛（落盘实测）。设计档 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 两处改动，判据正文不在此复述。

| 号 | 处置 | 改动 |
|---|---|---|
| ① | AC-SC-5 的 `designPoints` 期望与 §6.22.8-B 互斥：P8 拒收名单**必须**点名该参数，故裸 `designPoints` 计数不可能是 `0`。判据改两段式——参数形 `designPoints=` 0 命中 ∥ 拒收名单相邻形（`designPoints` / `acceptance`）恰 1 处；命令 8 列，期望 `0 0 0 0 0 0 0 1` | `AGENT-LOOP-SUBAGENT.md:355` |
| ② | `docs/core/design/MODEL-BENCH.md` 行细化：该档**原已在**受影响表（`AGENT-LOOP-SUBAGENT.md:331`，现 1844 行），「未登记」在文件级不成立；缺的是行坐标与机制句。行改列 `:1439`（args 五参键 → `{round, batchDoc, model}`）· `:1440`（去 `taskBookParamsFor("eng-designer")` 五参名集）· `:1462`（去 `composeTaskBookBrief(params,"eng-designer")` 五参拼装）· 三族任务书 fenced 块 `:1467-1471` / `:1484-1488` / `:1501-1505`；Δ ≈−15 | `AGENT-LOOP-SUBAGENT.md:331` |

**读数（本轮实测）**

- 新命令按现盘提示词跑 = `4 1 1 4 1 1 0 0`（第 1 列 4 = 四条示例 `:72` / `:312` / `:432` / `:433`，即 P6/P7/P9 的替换对象；第 8 列 0 = 拒收名单尚未落盘）。
- 按 P6/P7/P8/P9 逐字目标在内存模拟落盘后 = `0 0 0 0 0 0 0 1` —— 与 AC-SC-5 新期望逐位相符；裸 `designPoints` 剩 1 处，即 §6.22.8-B 拒收名单（`:417` 逐字块第 1 行）。
- AC-SC-8 命令 = `0 0 0`（本轮新增文字未引入批档坐标）。

**§2 旧行更正**：上文「验收对照」表的 AC-SC-5 行「两档 `designPoints` 表述 0 命中」按设计档现文改读为「`designPoints=` 0 命中 + 拒收名单点名一次」；判据以设计档 §6.22.5 为准，本段不抄数值。

**未动**：源码与提示词零改（实施面属实施轮）；§6.22.8-B 逐字块零改；其余判据本体零改。

### 轮次 3 修正（续）——用户 23:20 裁定：拒收名册不进提示词

用户裁定（逐字）：「为什么要告诉模型不能用了？！这么奇葩！没列出的参数，模型怎么会用？」⇒ 本段推翻上一段 ① 的处置形（「期望 = 1 / 两段式」作废）。

| 号 | 处置 | 改动 |
|---|---|---|
| ①′ | §6.22.8-A（P1）∥ §6.22.8-B（P8）改正面向陈述：工程角色带 `batchDoc` / `round` / `designToken` / `designId` / `files` / `dependsOn`，任务书 = 批档 §2、子代理自读；八个禁用名整串删除。**拒收名册只活在门的报错里**（§6.22.1 拒收文案不动） | `AGENT-LOOP-SUBAGENT.md:411` · `:414-421` |
| ②′ | AC-SC-5 回到 `designPoints` = `0`（七列全 0）：提示词面不再出现退役参数，判据无需两段式 | `AGENT-LOOP-SUBAGENT.md:355` |
| ③′ | 受影响文件表：`docs/core/design/MODEL-BENCH.md` 行保持轮次 3 的行坐标登记（该行不涉名单，无需随裁定调整） | `AGENT-LOOP-SUBAGENT.md:331` |

**读数（本轮实测）**：A 段 ∥ B 段的禁用名形（`designPoints` / `goal=` / `knownFacts=` / `acceptance=` / `reportFormat=` / `scope=` / `context=`）= 0 / 0 全零；AC-SC-5 命令现盘读数 = `1 0 0 0 0 0 0`（唯一 1 = 实施席已落盘的旧 B 段名单行 `persona-engineering.md:325`，按新 B 段改写后归 0）；按新 B 段模拟落盘 = `0 0 0 0 0 0 0`，与 AC-SC-5 期望逐位相符；AC-SC-8 = `0 0 0`；设计档 gate = `DOC-CHECK GATE: PASS`（0 条命中）。

**未动**：源码与提示词零改 · `subagent.mjs` 的 P3/P4/P5 描述面仍以「点名拒收」列出参数名（实施面，按「其余不变」零改）。

### 轮次 3 修正（续二）——P3 ∥ P4 的名册随 23:20 裁定删除

来源 = 主 agent 派单（上一段 ①′ 的漏项：A ∥ B 已改好，P3/P4 的改法列仍带名册）。用户 23:20 裁定全文见 §1 与「轮次 3 修正（续）」。落点均在 `docs/core/design/AGENT-LOOP-SUBAGENT.md`。

| 项 | 改动 file:line | 改后形态 |
|---|---|---|
| P3 | `AGENT-LOOP-SUBAGENT.md:397`（改法列） | 工程角色句改「take NO task-book text parameters — their task book is batch record §2 (batchDoc), read by the child itself」；`task / context / goal / knownFacts / acceptance / reportFormat / scope / designPoints` 那串名册整串删除 |
| P4 | 同档 `:398`（改法列） | 只留前句 `Optional background for normal-mode spawns (explore/plan/coder) only; action:'spawn' only.`；「Engineering roles refuse it — …」半句删除 |
| 依据行 | 同档 `:408`（新增，P 表与 -A 块之间） | 「提示词面只作正面陈述，不预演错误」+ 拒收名册只活在门的报错里（指 §6.22.1 拒收文案） |

**读数（本轮实测，命令 = `node -e` 逐串计数，三档）**

- `AGENT-LOOP-SUBAGENT.md`：`passing task / context` = 0 · `designPoints is refused` = 0 · `Engineering roles refuse it` = 0；`is refused with the parameter named` = 1，唯一一处是 §6.22.8-A 的正面句「四项核心缺值即点名拒」，非名册。
- `thincoder-core/agent-tools/subagent.mjs`：三段名册串各 0，`designPoints` = 0（实施席已按同裁定落 P3/P4/P5；`:142` / `:143` 现文与设计档改法列逐字同形）。
- `thincoder-core/tool-docs/subagent.md`：三段名册串各 0，`designPoints` = 0。

**未动**：其余 P 项 · §6.22.8-A ∥ B（`:411` ∥ `:417-421`）· AC-SC-5 判据与七列期望（`:355`，期望仍全 0）· 门的拒收文案与八名单源（§6.22.1）· 源码与提示词（实施面）。

**gate 读数**：`DOC-CHECK GATE: PASS`（`AGENT-LOOP-SUBAGENT.md` 单档，0 条命中）。

**§2 更正（同轮，坐标随插入位移）**：上一段「未动」行写的 `§6.22.8-A ∥ B（:411 ∥ :417-421）` 是插入依据行之前的坐标；依据行落在 `:408`，两块各后移两行 ⇒ 现坐标 = 块标题 `:410` ∥ `:416`、正文 `:413` ∥ `:419-423`。正文以设计档为准，本行只纠坐标。

### 轮次 4 修正（2026-10-24 23:45）——实施席落盘撞行宽门：折行 + 冻结文案四裁

来源 = 主 agent 修正轮派单（实施席 §5 写入被批档写入门拒 16 条：设计给的 A ∥ B 逐字块本身破 300，加 `thincoder-core/tool-docs/subagent.md` 存量 14 行）。判据正文在设计档，本段只记「号 → 落点」。落点均 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`。

| 号 | 处置 | 改动 file:line |
|---|---|---|
| ① §6.22.8-A 折行 | A 块 1→6 行，折行不折字（断行处 = 原空格；归一 = `\n` 两侧空白折单空格后逐字全等，已实测往返成立）；AC-SC-5 判据随改归一比较 + 增两档整档无 >300 行的机检式 | 设计档 `:414-423` · `:356` |
| ② §6.22.8-B 首条折行 | 首 bullet 1→2 行（同归一规则，往返实测成立） | 设计档 `:428-429` |
| ③ 存量 14 行 | 登受影响文件表：`thincoder-core/tool-docs/subagent.md` 行 Δ 改 ≈+25 → ≈64，`:4-12` ∥ `:19-21` ∥ `:31` ∥ `:33` 同法折行（语义零改）——门按整档判，不修 §5 写不进 | 设计档 `:320` |
| ④-1 `:139` 指路句 | **改**（P13）：`that name belongs to the eng-coder/eng-designer spawns` → `${otherFifth} is retired for every role; the fifth parameter here is ${fifth}`。不改的后果：把派单方指去一个同样拒收该名的 spawn，与同档 `:83` 退役句互斥。AC-SC-4 例外登记 | 设计档 `:408`（P13）· `:355` |
| ④-2 `:49` round 门文案 | **改**（P13）：five-task-book 句 → `task-book text parameters are refused for engineering roles by a separate gate (rejectEngFreeTextParams)`。不改的后果：round 门（只管工程角色）自述一个不适用于工程角色的五参门。AC-SC-2 例外登记；`bench/check/probe-frozen.mjs` 冻结期望随更 | 设计档 `:408`（P13）· `:353` · `:328` |
| ④-3 `discipline-normal.md:255` round 行 | **删**（P14）：round = 工程角色必带项，normal-mode 清单不列（清单头 = normal-mode 四项核心，行内混工程参数 = 层次串）；工程面由同段末新增行承载 | 设计档 `:409`（P14）· `:322` |
| ④-4 `family-tools.mjs:99` / `:129` A2 摘要描述 | **改**（P15）：`:99` 注释与 `:129` 审计通道描述改指批档 §2 路径面（A2 摘要面已随 KD-SC6 删，现审计块 = 批档路径行 + §2 指向句 + touched 快照）；受影响表补登该档（206 行，±0） | 设计档 `:410`（P15）· `:325` |

**读数（本轮实测）**：A 块折后 6 行逐行 232 / 74 / 96 / 66 / 252 / 275（max 275）；B 首条 261 / 75；归一往返 = 原 1000 ∥ 335 字符逐字全等（与落盘行比对 true）；设计档非表格非围栏 >300 行 = 0；AC-SC-8 = `0 0`；gate = `DOC-CHECK GATE: PASS`（0 条命中）。

**实施面跟随项（下轮实施席落）**：① 两档按折后形重落 + 存量 14 行折行；② P13 / P14 / P15 三处文案落盘（含 probe-frozen 冻结期望与 probe.check 归一断言）；③ 落盘后跑 AC-SC-5 新增行宽式（两档均 0）。本设计轮零改源码与提示词。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审（§6.22 任务书单通道重写 ∥ ENGINEERING-MODE-V2.md:256-258）

审核对象 = AGENT-LOOP-SUBAGENT.md §6.22（:244–:414）· ENGINEERING-MODE-V2.md（全文读，重点 :256-258）。限制声明：无文档地图（ownership 按所属档标题 + Project Guide 判）；源码头行数未核（评审范围仅两档，标注 unverified）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属（同机制两处不同说法） | 🔴 | ENGINEERING-MODE-V2.md:68 M5 行「职责」仍写 `任务书四项核心 + 第五项按角色 + round + files 声明面拦截`，与同档 :256「工程角色 … spawn 不携带任何任务书文本参数」互斥；:59 自述「本表 = 后续 Function Spec 的权威拆分批据」，而本批受影响文件表 :315 对该档只登 `:256 任务书句随口径` ⇒ 两套规格同档共存且不会随本批消解 | 把 :68 的 M5 职责格纳入受影响文件表并改写为新口径（工程角色 = 任务书 = §2 + `round` + token；非工程角色 = 四项核心 + `scope`）；若该格确需保留原文，在同一处写明哪一句为准及理由 |
| 2 | 文档状态（指针悬空） | 🟡 | 重写后的 §6.22（:244–:414）不含任何 F 编号条目，但四处活指针仍指向 §6.22 的 F 项：:23「裁定源 = §6.22 F5」· :479「（§6.22 F5 的集与序）」· :824「门的判据面归 §6.22 F2」· ENGINEERING-MODE-V2.md:306「§6.22 F2」 | 把四处改锚到现行小节号（角色 enum → §6.22.1 · 门判据 → §6.22.1/§6.22.4），并把该改锚列入 §6.22.3 受影响文件行 |
| 3 | 可行性 / 清晰度 | 🟡 | `designPoints` 拒收依赖「已从 schema 删掉的键仍能到达门」，而 :379 要求「删除 designPoints 属性整行」、:324 称「从 schema 真删」、:268/:354 又要求命中即点名拒收——设计未声明 args 是否原样透传到 `spawn-gates.mjs`，AC-SC-1 的该路径因此不可核 | 在 §6.22.2 或 KD-SC3 补一句：门收到的是工具入参原对象（未声明键不被剥除），并加一条用例断言未声明键可达门 |
| 4 | 文档归属（重复描述） | 🟡 | 模型可见文本在档内双份逐字存在：:391（§6.22.8-A）与 :807（§6.30）byte 同文；示例同样双份（:376 P2 ∥ :814-816）；AC-SC-5 只锚 §6.22.8，另一份漂移无判据 | 逐字正本只留一处（§6.22.8 或 §6.30），另一处改为交叉引用；示例块同法（本档 KD-TF2 :821 自称单源纪律） |
| 5 | 验收可机判性 | 🟡 | AC-SC-5（:340）的判据含「五项参数表述 0 命中」——散文谓词，无字面量；§6.22.5 全表无一条可执行命令 / 测试档，而同档 §6.23.7 的 AC 逐条给了 `node --test …` + grep（与 ENGINEERING-MODE-V2.md:34 N2「禁散文判据」相悖） | AC-SC-5 改为逐个字面量 grep（`designPoints` / `four core` / `every spawn role` 各 0 命中）；§6.22.5 每条补命令与期望 exit（对齐 §6.23.7 形） |
| 6 | 覆盖缺口 | 🟡 | 提示词面清扫只点 `persona-engineering.md` / `discipline-normal.md`（AC-SC-5），工程模式纪律档 `thincoder-core/prompts/discipline-engineering.md`（ENGINEERING-MODE-V2.md:60 指出其为工程规则载体）既不在受影响文件表也无 0 命中判定——该档若载五项 / `designPoints`，工程模式仍读到已退役规则（unverified：该档内容未读，超出评审范围） | 把该档纳入受影响文件表并给同一条 0 命中判据，或在 §6.22.7 边界写明「已核该档无相关表述」 |
| 7 | 既有机制交互（未登记） | 🟡 | §6.29.3（:784）把跨批引用观测建立在「拼装后的任务书文本（任务书参数拼装 + 可选 `task`）」上；本批后工程角色 `input` = 一行机械文本（:293，只含本批档路径）⇒ 该观测面对最需要它的两个角色恒空，§6.22.7 边界未登记此降级 | 在 §6.22.7 或 §6.29.3 记一行：观测对象改指何处（如批档正文 ∥ 子代理读档留痕），或明示「工程角色该观测面失效」并给替代判据 |
| 8 | 证据溯源（引文标注） | 🟡 | :251 把「只读角色改不动任何东西 … 只有一个任务来源」标为「用户 2026-10-24 22:46，逐字」，而本批记录 22:46 的原话是「只改两个角色」；:325 称「用户列表点名五参」，而记录为 22:42「取消designPoints」+ 22:43「都取消，只接受批档一个任务通道」 | 引文按记录原话逐字引出，或把该句改标为推导（本设计的范围判据）；KD-SC4 的依据改为「都取消」这一句原话 |
| 9 | 跨节滞后 | 🟡 | §6.7.2 :42 spawn 参数格仍写 `task / role / designToken / designId + files? / dependsOn?`（`task` 已对工程角色拒收）；§6.7.1 :21 eng-designer 行只列 `batchDoc`（§6.22.1/ENGINEERING-MODE-V2.md:258 判 `round` 必带） | :42 格加一句「逐角色见 §6.22.1」；:21 行补 `round` 必带（若本批新增，则一并登受影响文件） |
| 10 | 方法论（缺两条自述行） | 🟡 | §6.22 无「最近先例」行（先例坐标 + 一致 / 偏离理由），也无「勘察证据」行（查过哪些公开源档、有无相关）；本档族有先例句（:34「沿 `sanitizeConsultModels` 先例」），故非档族惯例缺失 | §6.22 增两行：最近先例（如 §6.23「描述与门同源」族）+ 对齐 / 偏离理由；勘察证据（查过的核档 / 工具描述面）与结论 |
| 11 | 文件规模（债务） | 🟡 | 本档现读 826 行（按族内口径 ≈825 内容行）已过 AGENTS.md 的 800 硬限，本批继续在 §6.22 / §6.30 加行且无拆分计划（本档 §6.21.8 / §6.23.4 均有拆分登记先例） | 受影响文件行补拆分计划或拆分候选登记（如把 §6.22 与 §6.30 的模型可见文本面另立一档） |
| 12 | 数值漂移 | 🔵 | :314 记本档「681」而行数为 826；同一 `subagent-spawn.mjs` 在档内三处「现」值不同（:303 为 435 · :204 为 459 · :639 为 470），ENGINEERING-MODE-V2.md:68 记 484（源档未读，unverified） | 受影响文件行加 as-of 日期戳，数值按同一口径（内容行数）重读一次 |

计数：🔴 1 · 🟡 10 · 🔵 1。

VERDICT: changes-required

### 轮次 2（评审子代理）

### 第 2 轮复核（12 条旧项 + 新裁定落地）

**旧项状态（逐条读当前档核）**：1 🔴 M5 职责格 → Fixed（`ENGINEERING-MODE-V2.md:68` 已改新口径，受影响文件行 `:330` 增列该格）· 2 🟡 F5/F2 悬空指针 → Fixed（`:23` 改 §6.23.3 · `:499` 改 §6.23.3 · `:839` 改 §6.22.1∥§6.22.4 · arch `:306` 改 §6.22.1；全档 grep 无 `§6.22 F` 残留）· 3 🟡 designPoints 取参面 → Fixed（`:283` 取参面原对象 + 用例 #13）· 4 🟡 逐字双份 → Fixed（`:825` 正本住 §6.22.8-A · `:396` 示例正本住 §6.30）· 5 🟡 AC 可机判 → Fixed（`:349-358` 全表带命令）· 6 🟡 discipline-engineering 清扫 → Fixed（`:323` · `:250` · AC-SC-5 命令含该档）· 7 🟡 §6.29.3 观测面 → Fixed（`:809-813` 检测面废止 + 三条理由）· 8 🟡 引文溯源 → Fixed（`:259` 标「本设计的推导，非用户逐字」· `:340` 改「未逐项点名五参」）· 9 🟡 §6.7.1/:21 与 §6.7.2/:42 滞后 → Fixed · 10 🟡 最近先例/勘察证据 → Fixed（`:248` · `:249-254`）· 11 🟡 800 硬限无拆分计划 → Fixed（`:329` 拆分候选登记）· 12 🔵 数值漂移 → Fixed（`:312` 行数口径 + as-of 戳）。

**新发现**：
- 🔴 N1 同机制两处不同说法（审计块内容）：
  `AGENT-LOOP-SUBAGENT.md:342`（KD-SC6 删 `summarizeEngTaskBook`，审计块改注入 §2 路径）与 `:618`（§6.26 改后契约仍含 `summarizeEngTaskBook(ctx.agent._engTaskInput)`）。
  另有 `:660`（§6.26 受影响文件表把该函数登记进 audit-block.mjs）、`:589`（row3 记 `_engTaskInput` = 「A2 摘要的源」「保持」）。
  本批自述的跨节改锚四处（`:329`）未含 §6.26 ⇒ 落地后同档两套互斥契约并存。
  *（父侧机械折行：原文单行 324 字符，语义零改，2026-10-24 23:03）*
- 🟡 N2 22:55 裁定执行面两版 + 残留未清：`:263` 执行面 = 2 项（§2 写作 + 设计评审）；`:807` 执行面 = 3 项（多「设计档自查」）。「规范档不得以批档为出处载体」半幅未清账——`§6.26` A23-1…A23-6 回指列仍为 `批次档 §2 条目 N`（`:698-703`），而 AC-SC-8 机检只查 `docs/batches/[0-9]{4}` 与 `发现表 F-[0-9]`（`:358`）⇒ 该类形态机检不覆盖。
- 🔵 N3（unverified）新增表格行超长单行（如 `:355` AC-SC-5 命令列），同档 `:703` 自检判据为「零新增行宽违规」；行宽检查器是否豁免表格未读（域外）。

**计数**：🔴 1 · 🟡 1 · 🔵 1（新）；旧 12 条全闭。

VERDICT: changes-required

### 轮次 3（评审子代理）

### 第 3 轮复核（范围 = 上轮 15 条：🔴1/🟡2..11/🔵12 + 上轮新 3 条 #13/#14/#15）

| # | Orig# | File | 严重度 | 状态 | 证据（本轮 read 现态） |
|---|---|---|---|---|---|
| 1 | 1 | ENGINEERING-MODE-V2.md:68 | 🔴 | Fixed | 「工程角色任务书 = 批次档 §2（零任务书文本参数，命中即点名拒收）+ `round` + designToken；非工程角色 = 四项核心 + `scope`」；435 行与 §6.22.3 一致 |
| 2 | 2 | AGENT-LOOP-SUBAGENT.md:23 | 🟡 | Fixed | `:23` 裁定源 = §6.23.3 · `:499` 集与序 = §6.23.3 · `:839` 门判据面归 §6.22.1 ∥ §6.22.4 · arch `:306` §6.22.1；grep `§6.22 F[0-9]` 零残留 |
| 3 | 3 | AGENT-LOOP-SUBAGENT.md:283 | 🟡 | Fixed | 「**门的取参面 = 工具入参原对象**」+ 用例 #13（属性不在 schema ∥ 键到达门）+ 实现轮核实/兜底句 |
| 4 | 4 | AGENT-LOOP-SUBAGENT.md:825 | 🟡 | Fixed | 「**逐字正本住 §6.22.8-A，本节不复制**」；示例正本住 §6.30（`:827-832`）↔ P2 `:396` |
| 5 | 5 | AGENT-LOOP-SUBAGENT.md:349 | 🟡 | Fixed | 表头「判据 / 机检命令 ⇒ 期望」；AC-SC-1…8 各带 `node --test` / `node -e` 命令与期望值 |
| 6 | 6 | AGENT-LOOP-SUBAGENT.md:323 | 🟡 | Fixed | `discipline-engineering.md` 入 `:250` / `:323` / `:389` 三处 + AC-SC-5 命令含其计数 |
| 7 | 7 | AGENT-LOOP-SUBAGENT.md:812 | 🟡 | Fixed | §6.29.3 改「规范禁止 + 检测面废止」，理由 2 = 扫描对象失效；边界 8 `:388` 同口径 |
| 8 | 8 | AGENT-LOOP-SUBAGENT.md:259 | 🟡 | Fixed | 「**范围判据（本设计的推导，非用户逐字）**」+ 22:42/22:43 原话；`:340`「未逐项点名五参」 |
| 9 | 9 | AGENT-LOOP-SUBAGENT.md:42 | 🟡 | Fixed | spawn 格「逐角色见 §6.22.1——工程角色无任务书文本参数」；`:21` 补 `round` |
| 10 | 10 | AGENT-LOOP-SUBAGENT.md:248 | 🟡 | Fixed | 「最近先例」+ 对齐/偏离 + 「勘察证据」三族清单 + `:254` 首案句 |
| 11 | 11 | AGENT-LOOP-SUBAGENT.md:329 | 🟡 | Fixed | 「拆分候选登记」另立 `SPAWN-TASK-CHANNEL`（下一批）+ `:667` 文档档不适用源码行数线 |
| 12 | 12 | AGENT-LOOP-SUBAGENT.md:312 | 🔵 | Fixed | 行数口径（`\n`+1）+ as-of 戳 + 「他节不作当前值用」；本档 841 = 实测 |
| 13 | new-r2 🔴 | AGENT-LOOP-SUBAGENT.md:618 | 🔴 | Fixed | §6.26 四处契约已改锚：`:618` 注释「无 A2 摘要——§6.22 KD-SC6」（`summarizeEngTaskBook` 调用已删）· `:660` 受影响表「不持 A2 摘要函数」· `:589` 分类表第 3 行 · `:679` D23-6「一行机械任务书行」；`:329` 登记改锚面 |
| 14 | new-r2 🟡 | AGENT-LOOP-SUBAGENT.md:263 | 🟡 | Fixed | 「执行面 = **§6.29.3 单源**（三项，本节不复制）」；`§807` ③ 改指 AC-SC-8 三式；AC-SC-8 增第三式（`批次档 §2 条目` 形，拼接断开不自匹配）；原残留实例（§6.26 回指列）已删——grep「批次档 §2 条目」仅命中 `:358` 自身定义 |
| 15 | new-r2 🔵 | AGENT-LOOP-SUBAGENT.md:355 | 🔵 | Unfixed（unverified · 无理由） | 超长表格行仍在（`:355` 内 `const c=(f,s)=>fs.readFileSync(f,'utf8').split(s).length-1` 同段约 1.5k 字符）；同档 `:703`「触碰档零新增悬空锚 / 零新增行宽违规」；检查器表格豁免面未读（域外）⇒ 无法判定，故不闭合 |

**计数**：旧 12 项 12/12 Fixed；上轮新 3 项 = 🔴1 Fixed · 🟡1 Fixed · 🔵1 Unfixed（advisory/unverified，不阻塞）。新 🔴 = 0。

**附记（advisory，不另立条目）**：`:388`（§6.22.7 边界 8）仍以两件枚举执行面「执行面 = §6.22 的 §2 写作约束 + 设计评审退回」，未含 §6.29.3 ③ 的 AC-SC-8 机检面——与 `:807` 三项不同。上轮 #14 所点两处（`:263` / `:807`）已闭，此处为同一单源指令的第三处残留，建议随下一批一并收正。

**VERDICT: pass** —— 未留未解决 🔴；#15 为 🔵 advisory/unverified，不阻塞。

### 轮次 4（评审子代理）

评审对象：AGENT-LOOP-SUBAGENT.md §6.22.8-A/B（:414-434）· P13/P14/P15（:408-410）· 受影响表（:320/:322/:325/:328）· AC-SC-5（:356）。轮次性质：第 4 轮，仅核修正轮（A/B 折行 · 存量 14 行登表 · P13/P14/P15 四条冻结文案裁定）是否闭合、是否引入新问题。

**闭合核验（逐项）**：

1. **A/B 折行**：A 块 6 行（:417-422）对应 :320「1→6 行」；B 块首条 2 行（:428-429）对应 :321「1→2 行」。断行处均为原空格/词边界（逐行核：417→418 `format)` / `— plus`、421→422 `passed.` / `An eng-coder`、428→429 `open.` / `The child`）。行宽抽测（逐字估算）：最长行 :422 ≈278、:421 ≈252、:428 ≈258，均 ≤300；拼接估算 A ≈1000、B 首条 ≈331，与 :436「单行 1000 ∥ 335」自述吻合。归一规则三方一致：:414（归一比较规则见 AC-SC-5）⇆ :356（`\n` 两侧空白折叠为单空格）⇆ :436（归一后逐字全等已实测）⇆ :327（probe.check A 段断言改行折叠归一比较）。✓ 闭合。
2. **存量 14 行登表**：:320 坐标 `:4-12`（9）∥ `:19-21`（3）∥ `:31`（1）∥ `:33`（1）= 14 ✓ 算术闭合；折法 = 「同法折行（语义零改，断行处 = 原空格）」与 A 块同规，可实施；AC-SC-5 尾段机检（两档整档 >300 行计数 ⇒ `0`）提供判据 ✓。
3. **P13（:408）**：`:49` 新文案指 `rejectEngFreeTextParams`，与 :316 新增单源同名 ✓；`:139` 新文案 `is retired for every role` 与 :301 拒收后缀句、AC-SC-4（:355）例外登记互指一致，互斥消解判据（`:83` 退役句为准）三方同文 ✓；:328 冻结面两句期望文案随 P13 更新已登表 ✓。
4. **P14（:409）**：删 discipline-normal.md:255 的 `round` 行，与 P10（:405）新增段末「Engineering-mode spawns …」行形成承接（工程面有落点）；:322 登表 ±0（P10 +1 / P14 −1）算术闭合 ✓；与 §6.22.1（round = 工程角色必带）层次一致 ✓。
5. **P15（:410）**：`:99` / `:129` 新文案 = 批档路径 + §2 指向 + touched 快照，与 KD-SC6（:343）、§6.26 D23-6（:693）、:603（S3 行）三面同口径 ✓；:325 登表 ±0 ✓。

**新问题扫描**：A/B 块内容与 §6.22.1 参数面逐条对账（四项核心 + scope 必带 / task 可选补充 / 工程角色 batchDoc + round + designToken（+多槽 designId）/「only task channel」/ bounce 措辞与 :298 拒收模板同源）——零矛盾；两块不点名被拒参数，符合 :412「拒收名册只活在门的报错里」与 AC-SC-5 同句判据；AC-SC-5 七列 grep 目标（persona 'four core'/'goal=' 等 ⇒ 0）与 P6-P10 改法可互相推出 ✓。未发现新 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | P14 删 `round` 行在 AC-SC-5 无机检锚——七列 grep（:356）覆盖 designPoints / every spawn role / four core / goal=，但 `round` 是现役工程参数而非退役表述，其从 normal-mode 清单消失无对应计数列 | AC-SC-5 增一列：discipline-normal.md 中该 round 行特征串（如 `fix rounds are point-fixes only`）计数 ⇒ `0` |
| 2 | Acceptance criteria | 🔵 | AC-SC-5 要求 persona-engineering.md 整档无 >300 行，但受影响表只对 tool-docs/subagent.md 登记存量长行（14 条），persona 面无存量登记；从 :436「335」为 B 块首条实测值可推 persona 无其他存量长行——unverified（评审域只含本设计档，无法核该档实测） | 登记一句「persona-engineering.md 存量 >300 行 0 条（实测）」使判据自足 |
| 3 | Doc state（邻接观察，域外） | 🔵 | :318（§6.22.3）称 `audit-block.mjs` 现 109 行 ≈−37，:674（§6.26）称同档现 0 +~95——同档两节当前值口径互斥（跨节滞后）；在本轮对象域外，按 R7a 只报不改 | 下一轮或父侧统一两节对该档的基线口径 |
| 4 | Methodology | 🔵 | 受影响表 :320/:322/:325/:328 的现值行数无法抽查核对——评审域声明只含本设计档，读他档越域；:312 行数口径句（as-of 时间戳）在档内自足 | 无需动作；实现轮以实测为准 |

 counts：🔴 0 · 🟡 1 · 🔵 3

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：用户 2026-10-24 23:15「spawn批批准。」——批准对象 = §6.22 / §6.29.3 与 `ENGINEERING-MODE-V2.md:68` 的落地（工程角色零任务书文本参数；批档不得被引用）。
**批准前置**：设计三轮评审（轮 1 = 1🔴+10🟡+1🔵 · 轮 2 = 新增 1🔴 · 轮 3 = pass，0 未决 🔴）；未决项 = 1 条 🔵（行宽 unverified，不阻塞）。
**批准即实施启动**：本轮同日 spawn eng-coder 落 §6.22.8 P1–P12 与 §6.22.3 受影响文件表。

## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成（2026-10-25）

两轮合并记录：#98 实施轮 + 2026-10-24 修正轮。**#98 报告原文不在盘上**（只存在于父侧会话历史；父侧 2026-10-25 裁定 §5 由本席自写）——其过程读数凡本轮未复跑者一律不引用；下列读数除注明外均为 2026-10-25 本轮实测。

### 机制交付

- **八键单源**：`ENG_REFUSED_PARAMS` = goal / knownFacts / acceptance / reportFormat / scope / task / context / designPoints（`thincoder-core/agent-tools/spawn-gates.mjs:64`，唯一名集处）；**键在场即拒**（值全空白同拒），命中逐键点名并附必填集合；`designPoints` 另附退役句（同档 `:83`）。
- **门序**：batchDoc 门 → 拒收门（`thincoder-core/agent-tools/subagent-spawn.mjs:218`）→ round 门；门取工具入参原对象，schema 未声明键可达门（用例 #13 在断言组内）。
- **任务书行**：工程角色 `input` = `_engTaskInput` = 一行机械任务书行（`subagent-spawn.mjs:328`：批档绝对路径 + 「§2 = 唯一任务通道」）。
- **审计块**：`summarizeEngTaskBook` 全删（本轮复扫全 `thincoder-core` 树 = 0 命中）；注入 `Batch record (batchDoc):` 路径行 + §2 指向句 + touched 快照（`thincoder-core/agent-tools/audit-block.mjs`）。
- **检测面废止**：跨批引用检测面按 22:55 裁定废止（`docs/core/design/AGENT-LOOP-SUBAGENT.md §6.29.3`，设计席笔）。
- **提示词面**：P1–P11（#98 落）+ 本轮 P13 / P14 / P15 与 A / B 折行——拒收名册只活在门的报错里，提示词只作正面陈述（`AGENT-LOOP-SUBAGENT.md §6.22.8` 依据行）。

### 改动表（两轮合并；坐标 = 当前盘上）

| # | 文件 | 落点 | 轮 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/spawn-gates.mjs` | `isEngineeringRole :57` · `ENG_REFUSED_PARAMS :64` · `rejectEngFreeTextParams :77`；删 `ENG_TASK_BOOK_MIN` / designPoints 标签 / fifth.engineering 支 | #98 |
| 2 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 拒收门调用 `:218`；任务书行 `:328`（input / `_engTaskInput` 同值） | #98 |
| 3 | `thincoder-core/agent-tools/audit-block.mjs` | 删 `summarizeEngTaskBook` 与 marker 表；审计块注入批档路径行 + §2 指向句 | #98 |
| 4 | `thincoder-core/agent-tools/subagent.mjs` | 删 `designPoints` 属性（现 0 命中）；`:142` / `:143` / `:153-158` 描述按 P3/P4/P5 改口 | #98 |
| 5 | `thincoder-core/tool-docs/subagent.md` | P1 任务书段 + P2 示例两行（eng-coder / explore） | #98 |
| 6 | `thincoder-core/prompts/persona-engineering.md` | P6 `:72` · P7 `:312` · P8 B 块段 · P9 `:417-418` | #98 |
| 7 | `thincoder-core/prompts/discipline-normal.md` | P10 `:253-261`（收窄 normal-mode + 工程说明行） | #98 |
| 8 | `thincoder-core/permission.mjs` | P11 `:40`：拼装空 ⇒ 回退 `task book: batch record §2 (<path>)` | #98 |
| 9 | `bench/probe/data.mjs` · `bench/check/probe.check.mjs` · `bench/check/probe-frozen.mjs` · `bench/probe/driver.mjs` | 三族夹具五参 → `{round, batchDoc, model}`；冲突内容移进夹具批档 §2；断言组改拒收 + 任务书行 | #98 |
| 10 | `thincoder-core/tool-docs/subagent.md` | A 块单行 → 折后 6 行（`:39-44`）；存量 14 行同法折行（新 `:4-24` · `:31-37` · `:52-54` · `:56-58`） | 修正轮 |
| 11 | `thincoder-core/prompts/persona-engineering.md` | B 块首条单行 → 折后 2 行（`:324-325`） | 修正轮 |
| 12 | `thincoder-core/agent-tools/spawn-gates.mjs` | P13：`:49` round 门句 · `:139` 指路句（改后形逐字） | 修正轮 |
| 13 | `thincoder-core/prompts/discipline-normal.md` | P14：删 `round` 行（原 `:255`） | 修正轮 |
| 14 | `thincoder-core/agent/family-tools.mjs` | P15：`:98-99` 注释 · `:129` 审计通道描述（改指批档 §2 路径面） | 修正轮 |
| 15 | `bench/check/probe.check.mjs` | A 段断言改归一比较（`:173-178`，设计 `:327` 登记）；`:159` 注释随评审 🔵 修正（「零变」失实 → P13 改后形标注） | 修正轮 |

### 修正轮处置（号 → 改动 file:line → 读数）

| 号 | 改动 | 读数（本轮实测） |
|---|---|---|
| ① | `tool-docs/subagent.md` A 块 `:23` → 折后 6 行（新 `:39-44`） | 归一（`\n` 两侧空白折单空格）后与 §6.22.8-A 逐字全等、恰 1 处；逐行 ≤275 |
| ② | 同档存量 14 行折行（语义零改，断行处 = 原空格） | 归一往返逐字全等 14/14（脚本逐行验证）；整档 >300 行 = 0 |
| ③ | `persona-engineering.md` B 首条 → 折后 2 行（`:324-325`） | 归一后与 §6.22.8-B 首条逐字全等、恰 1 处；整档 >300 行 = 0 |
| ④ | `spawn-gates.mjs:49` · `:139` 按 P13 落 | 旧串两式 0 命中；新串在盘；`probe-frozen.mjs` 零改（该档无此两句冻结期望，见下「审计知会」） |
| ⑤ | `discipline-normal.md` 删 `round` 行 | 特征串 `fix rounds are point-fixes only` 0 命中 |
| ⑥ | `family-tools.mjs:98-99` · `:129` 按 P15 落 | 旧串 0 命中；explore 契约句仍恰 2 处（`probe.check.mjs:169` 断言面不动） |
| ⑦ | §5 = 本段（自写） | 写入回执见本段尾 |

### AC 读数（除注明外本轮复跑）

| 判据 | 命令 ⇒ 结果 |
|---|---|
| AC-SC-1 | `node bench/check/run.mjs` ⇒ **118/0**：拒收断言组 = 工程角色 × 八键 ×（实值 / 空白）逐键抛且点名；`designPoints` 退役句在；非工程零变 |
| AC-SC-2 | `node --test bench/check/probe.check.mjs bench/check/probe-frozen.mjs` ⇒ **exit 0**（tests 2 · pass 2）；例外登记（round 门 `:49` 文案按 P13 改）已落 |
| AC-SC-3 | 放行态断言组绿（118/0 内）：`input` / `_engTaskInput` 含批档绝对路径 + §2 唯一通道句 |
| AC-SC-4 | 非工程五参行为 / 拼装序 / 冻结面绿（118/0 内）；例外登记（`:139` 指路句按 P13 改）已落，`probe.check.mjs:159` 断言锁改后形 |
| AC-SC-5 | 七列 ⇒ **`0 0 0 0 0 0 0`**（原命令复跑）；行宽式 ⇒ 两档均 **`0`**；tool-docs 任务书段与 §6.22.8-A 归一逐字恰 1 处（断言组绿）；B 首条归一逐字恰 1 处（node 复算） |
| AC-SC-6 | `summarizeEngTaskBook` 全 `thincoder-core` 树 ⇒ **`0`**；审计块含 `Batch record (batchDoc):` 行 ✓（断言组绿） |
| AC-SC-7 | **未全绿**：需求面与设计面仍以 `designPoints` 为活规格——pen 分属主 agent（P12）与设计席（D1 路由），不在实施席清单；坐标见下「偏移清单」 |
| AC-SC-8 | 三式 ⇒ **`0 0 0`**（原命令复跑） |

CLI：`cd thincoder-cli && node test/run.mjs` ⇒ **15/15**（本轮复跑）。

### 设计档偏移清单（as-of 2026-10-25 盘上实测；均不在本轮处置面）

- `docs/core/design/MODEL-BENCH.md`：`:1439`（args 五参键）· `:1440`（`taskBookParamsFor("eng-designer")` 名集）· `:1462`（`composeTaskBookBrief` 五参拼装）· `:1469` / `:1486` / `:1503`（三族任务书 `designPoints:` 行）——旧夹具形在盘；pen 属设计席（§2 动作表第 10 行）。
- `docs/core/design/PROMPT-SYSTEM.md`：`:248` · `:1357` · `:2603` 含 `designPoints` 表述（`:1357` 所记 persona 坐标 `:158` / `:161-171` 已失效）；不在本批受影响表。
- 需求档（主 agent 笔，§2 动作表第 11 行 / P12）：`docs/core/requirements/ENGINEERING-MODE-V2.md:430` · `:433`（· `:12` 同口径句）；`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-DELEGATION.md:7` · `:12` · `:16` · `:19`——「四项核心 + 第五项按角色（工程角色 = designPoints）」活规格在盘。
- `docs/core/design/API-CONTRACT.md`：`:586` · `:4513` 登记 `summarizeEngTaskBook`（符号已删）；`:719` 登记 `ENG_TASK_BOOK_MIN`（常量已删）；新导出 `ENG_REFUSED_PARAMS` / `isEngineeringRole` / `rejectEngFreeTextParams` 未登记——导出登记面与本批交付漂移。

### 设计面待裁四条（§2 轮次 4 的 ④-1…④-4）——本轮已随 P13/P14/P15 落地

- ④-1 `:139` 指路句 → P13 改后形已落（`spawn-gates.mjs:139`）。
- ④-2 `:49` round 门句 → P13 改后形已落（`spawn-gates.mjs:49`）。
- ④-3 `discipline-normal.md` 的 `round` 行 → P14 已删。
- ④-4 `family-tools.mjs` 两处 → P15 已落（`:98-99` · `:129`）。

### 复盘轮次

- **#98 实施轮**：过程轮次不可得（报告不在盘上），不引用；其落盘物本轮全部复验在盘（见改动表 1-9 行与 AC 读数）。
- **修正轮审计**：1 轮（explore 只读分歧审计）⇒ **VERDICT: clean**——七点逐项与设计逐字一致，四类别（部分实现 / 静默简化 / 文档漂移 / 越清单）零发现。附 `[上抛·知会]` 1 条：设计档 `:328` 记「probe-frozen 冻结面含 `:49` / `:139` 两句期望文案随 P13 更新」与实况不符——该档只冻结夹具批次档字面（`SANDBOX_BATCH_RECORDS` / `FROZEN_FIXTURES`），无此两句，无可更之物；实施席零改是正确处置。
- **修正轮评审**：1 轮（advisor code review）⇒ **pass**（0 🔴 · 1 🟡 · 2 🔵）。🔵1 = `probe.check.mjs:159` 注释失实（「错误文案零变」与 P13 改动矛盾）——本轮已修正并重跑 118/0。🟡1 = `persona-engineering.md:311` 旧口径句「coder subagent … the design doc as the task book」与新单通道口径相邻，不在 P1–P15 清单——本轮未动，建议父侧登记（设计席 / 提示词面裁决）。🔵2 = 设计档 `:327` 行对 `probe.check.mjs` 的估算（306 ≈−12）与实况（338）漂移——设计席笔。
- **终态**：clean。

### §5 写入回执

（append 回执原文贴于 §6 前的本段末——若被门拒，命中清单原样贴回，不绕门。）

回执原文（2026-10-25 首次 append）：`batch_segment: appended 6438 characters to §5 of the batch record.` + `[doc-check gate] DOC-CHECK GATE: PASS · 范围 3 档`——**写入一次成功，写入门零命中**（折行处置生效，16 条 >300 行全清）。

同回执另附一行 `DOC-CHECK GATE: ERROR（引擎已更新…mtime > 进程启动 2026-10-24T09:42:19…请重启会话后复跑）`——那是独立 gate 面的引擎时效判（引擎文件新于本会话启动时刻），会话级条件、非文档命中；本会话内复跑 standalone gate 恒得此行，重启会话后方可复跑。

## §6 验证与收口（父代理）

## 验证与收口

**实施两轮**：`#98`（初轮：门 + schema + 任务书行 + 审计块 + P1–P11 + bench 夹具迁移）· `#110`（修正轮：折行落地 + P13/P14/P15 + §5 写入）。

**复核读数**（实施席实测 + 父侧抽核）：

| 项 | 读数 |
|---|---|
| bench `check` | 118 passed · 0 failed |
| cli `npm test` | 15/15 |
| AC-SC-5 七列 + 行宽 | `0 0 0 0 0 0 0` · 两档整档 0 条 >300 |
| `summarizeEngTaskBook` 全树 | 0 |
| AC-SC-8 三式 | `0 0 0` |
| §5 写入 | gate PASS（范围 3 档，两次） |

**需求面（P12，父侧笔）**：`ENGINEERING-MODE-V2.md:430` ∥ `:433` + `SPEC-DELEGATION.md:7` ∥ `:12-19` ∥ `:35` 已按新口径改写（任务书 = 批次档 §2；非工程角色 = 四项核心 + `scope`）。

**遗留（登记，不阻塞）**：
- 设计面旧口径残点：`MODEL-BENCH.md`（`:1439/:1440/:1462/:1469/:1486/:1503`）· `PROMPT-SYSTEM.md`（`:248/:1357/:2603`）· `API-CONTRACT.md:586`（生成区，重生成随正）——设计席笔，归后续轮；`persona-engineering.md:311` 旧口径句（评审 🟡1）同归。
- 本批 gate 会话内恒 ERROR（引擎残影——会话 09:42 启动早于 17:46 删判据提交 `a0cb6e24`）；§5 append 门两次 PASS。真读数待会话重启。

**测试行**：① 本批单测档 = bench 探针族（常驻，非批内档）· ② 集成集现量 15 例 / 窗口 50–100，本批增删 0（改的是派单面，无业务行为变更——`none` 判据成立：既不触组件交互也不改既有用例断言的业务结果）。
