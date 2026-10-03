# 2026-10-03 · advisor-convergence
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 22:40「可以，advisor的问题就按这个路线落地吧」——承台账 #849（IKJ8CI）四起现场分点分析；点一「争议两轮窗 + 第三轮收口」已入需求档 §2.4（F32/F33——用户 22:24 裁定）；本批 = 该路线的落地批。
> 台账 = #849（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（§1 已写（来源 ∥ 需求 F32/F33 ∥ 随行两面 ∥ 不做清单 ∥ 验收方向）——候设计轮）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与点火**：用户 2026-10-03 22:40「可以，advisor的问题就按这个路线落地吧」= 本批点火令。路线 = 当晚四起现场（台账 #849 · IKJ8CI）分点分析的结论：**根因 = 「一个不给过、一个不肯改」的相持无终局**（用户 22:38 裁定：guard 打回本身合理——开 guard 即「先审后交」意愿；出问题的仍是相持；父侧「等用户腿 ∥ 成本披露」候选已撤回）。

**需求（点一 · 已锁入需求档）**：`docs/core/requirements/ADVISOR-CONVERGENCE.md` §2.4（F32/F33——用户 22:24 逐字裁定；提交 `9b4909f6`）：
- **F32** 争议两轮窗 + 第三轮收口：被审方不修须携理由（技术反驳 + 证据 ∥ 认账不修的显式记录）；前两轮评审者可评估并打回；**第三轮起对「已携理由的不修项」接受收口**；零理由的沉默 ∥ 回避不在接受之列。
- **F33** pass 语义随动：🔴 的「解」= **fixed ∨ accepted**；🟡 ∥ 🔵 面语义零动。

**随行面（同夜已裁，入本批）**：
1. **引证形状面**：引证 = 源文本**连续子串**（既有机制复核与收正）；失败原因**精确分类**——「含省略号 ⇒ 非引文形」+ 给出改法，把「形状不符」与「内容造假」分开报；评审提示词面同步落「引证禁 `…`（改引连续子串）」写作禁则（用户 21:1x 裁定）。
2. **归宿面**：不可验证 ∥ 不完整**必须收束出结论**（不悬置）——与 F32 互补（非相持场景的出口）；「不匹配不能支撑打回」语义本体零动。

**明示不做**（均有出处，防漂）：
- 入口内容门（硬代码判内容）= 已撤回（用户 21:17）；
- 任何轮次上限 ∥ 机械刹车 ∥ 零 diff 逃生 = 拒（用户 2026-09-18 裁定沿）；
- 成本 ∥ 等待用户腿面（父侧 2a/2b 候选）= 已撤回（用户 22:38）；
- 轮次判定机制本体（确定性状态位 ∥ 周期界 ∥ 归零）= 零动（定案面）；
- 「不匹配不能支撑打回」语义本体 = 不改（F14 边界沿）；
- `completion.mjs` guard（促评门）= 零动（用户 22:38 裁定：打回合理）。

**验收方向**：① 争议项第 3 轮必收（带理由 ⇒ accepted；pass 语义随动）；② 省略号引证 ⇒ 精确分类 + 可操作改法（不再是无归宿 mismatch）；③ 不可验证 ∥ 不完整 ⇒ 出结论（批内用例）；④ 既有语义零回归（轮次机制 ∥ 正常引证 ∥ deweight 规则照旧）。

**边界（机制面）**：不改任何既有判定族语义本体；**design 轨适用形由设计轮核**（需求档 F32 边界原文——本条不预先断言各轨轮次语义）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两设计档落笔（ADVISOR-CONVERGENCE 450 行 ∥ ADVISOR-GUARDS 431 行）· 受影响文件 18 档 · 批内用例 T1–T13 · 上抛 3 项（U1/U2/U3））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-03 · initial 轮）**

**本批条目（覆盖 · 回指 §1 需求块与需求档 §2.4）**

- **R1 · F32 争议两轮窗 + 第三轮收口**：同一争议项（评审者判应修 ∧ 被审方判不修）——**轮 1–2** 评审者可评估理由并打回（理由不成立 ⇒ 保持未解）；**轮 3+** 对**已携理由**的不修项接受收口（不得再以同项打回）；零理由的沉默 ∥ 回避不在接受之列。落地 = 轮 2 / 轮 3 提示词面（逐字建议）+ 验证表 `Status` 词表增 `Accepted` + 被审方纪律面义务句 + 设计档 §2.5。
- **R2 · F33 pass 语义随动**：🔴 的「解」= **fixed ∨ accepted**；🟡/🔵 面零动。落地 = 轮 2 / 轮 3 裁决含义句 + 设计评审 Approval Signal 回显条件句（`thincoder-core/advisor/messages.mjs`）+ 设计档 §2.4 / §2.5。
- **R3 · 引证形状面**（随行 1）：引证 = 源文本**连续子串**（复核结论 = 命中判据 `includes` 本体正确、零改）；失败原因**精确分类**——「含省略号 ⇒ 非连续引文（含改法）」与 `content mismatch` 分列；四面评审提示词落「引证禁 `…` / `...`」写作禁则 + 违规示例替形。
- **R4 · 归宿面**（随行 2）：**不可验证** ⇒ 未过核验的引用不支撑打回（本体零改）+ 条目不得悬置（每轮明列 Status 收束 + 收尾「不得静默丢条目」句）；**不完整** ⇒ 失败结论块逐次产出（F28/F29——零改复核）。
- **不覆盖（本批边界）**：不改轮次判定机制本体（确定性状态位 ∥ 周期界 ∥ 归零）；不设会话级计数器 ∥ 机械刹车 ∥ 零 diff 逃生；不改「不匹配不能支撑打回」语义本体；不动 `completion.mjs` guard（含促评门文案）；不引入 LLM 输出解析（F6——表列词表纯阅读面，不驱动控制流）；不改 pass 判据来源（评审者判）；不加轮次上限；不动需求档（笔在父侧）；不引入新判定族 / 新结算 kind（归宿面零新增——复用既有结论块）。
- **需求档合规检查**：F32 / F33 判定句 ↔ 本批 R1 / R2 = 逐条对位（§2.4 原文，含用户逐字裁定）；**随行两面（R3 / R4）在需求档无独立编号条目**——现只载于 §1 + 台账 #849（上抛 U2）；需求档 §4 边界行「不改评审侧提示词」与 F32 落地相抵（上抛 U1）。
- **边界注记（登记 · 非上抛）**：引文抽取的行尾吞并（非省略号形——吞并后随文字/括注）仍报 `content mismatch`——本批不引入模糊匹配故不治；修正径 = 提示词面「连续引用」写作纪律；如需另治请点派。

**设计档落点（机制权威 · 本轮已落笔）**

- `docs/core/design/ADVISOR-CONVERGENCE.md`（356 ⇒ **450**）：§2.4 通过判据随动（fixed ∨ accepted）；**新增 §2.5**（争议裁决窗与非修项收口——定义 / 窗 / 表列词表 / 判据随动 / 零理由出口 / 设计轨适用判定 / 提示词面逐字建议）；§7 响应表纪律（`Deferred` 适用面开「携理由认账不修 🔴」+ 不修须携理由句）；§12 增 A-AC12 / A-AC13；变更记录。
- `docs/core/design/ADVISOR-GUARDS.md`（408 ⇒ **431**）：§3 失败原因三分 ⇒ **四类**（加「非连续引文（省略号）」+ 改法；命中判据与报告头行零改）+ 引证形状写作禁则（四面逐字建议 + 示例替形）+ 归宿面契约；§10 增 A-AG16 / A-AG17；变更记录。
- 两档 = 既有 owning 档（无新档；D2 单一权威源：窗 / pass 语义 → CONVERGENCE；引证分类 → GUARDS）。

**机制设计**

（一）**F32 / F33 — 窗与收口**（语义契约 = 设计档 §2.5）：
- **窗映射（按 F32 判定句字面）**：**轮 1–2** = 可打回窗（评审者评估理由成立性；不成立 ⇒ 保持未解）；**轮 3+** = 必收（对已携理由的不修项接受收口；不再评估理由成立性）。同一争议占轮 ≤ 2 轮窗（第 3 轮必收）⇒ 相持循环必然终止。边角记录：轮 2 新问题导致的争议在轮 3 即入必收（判定句按全局轮号；登记）。
- **表列形态（可核性——零解析）**：轮 2 / 3 验证表 `Status` 词表 = `Fixed` / `Accepted`（携理由不修——收口）/ `Unfixed`（未解——含零理由）/ `New`（仅轮 2）；**accepted 与未解项都须入表**（收口不得静默消失——父侧可核「prior 🔴 全部 ∈ {fixed, accepted}」）；每个前轮条目每轮须得其一（不悬置）。
- **判据随动**：轮 3+ **pass = prior 🔴 全部 ∈ {fixed, accepted}**（轮 2 另加「修复未引入新 🔴」）；存在零理由未解项 ⇒ 不可 pass。设计轨 pass = 凭证回显——回显条件句改「**no unresolved 🔴 remains**」+ 定义句（操作性载体）。
- **设计轨适用性判定**（需求档 F32 边界要求）：**两轨同形适用**——依据 ① 轮 2/3 提示词两轨共用（`thincoder-core/advisor.mjs:100-107` 轮次选择：设计轮 2/3 与代码轨落同一对提示词）② 争议结构同构（评审者 ⇄ 设计作者响应表）③ F33「解」定义轨无关 ④ 回显条件句随动后设计轨同受窗语义。边界：机制本体 / 零解析 / 零计数器零动。
- **零理由面的出口（如实）**：保持未解（不可 pass）——出路 = 被审方补理由 ∥ 修复，或父侧上报用户裁（接受收口只关评审者面，不免除父侧上报义务）。
- **提示词面逐字建议（全量文本 = 设计档 §2.5；内容权在主 agent——落地照 D1）**：轮 2 评估句（3 行替换，`advisor-round2.md:15`）∥ 轮 3 接受句（2 行新增，`advisor-round3.md:12` 后）∥ 两轮 `Status` 词表行 ∥ 两轮裁决句（`:46` / `:42`）∥ 收尾不悬置句（两轮收尾规则）∥ 纪律面义务句（`discipline-normal.md:128` / `persona-engineering.md:112` 轮次句追加 + `Deferred` 行扩展）∥ messages 回显条件句。双源 = 运行期 EN ⊗ 中文设计档 CN。

（二）**引证形状面**（设计 = `ADVISOR-GUARDS.md` §3）：
- 失败分类四类：`file unreadable` ∥ `content mismatch @ path` ∥ `path traversal`（三旧类零改）+ **非连续引文**（内容含 `…` ∥ `...`）⇒ `not a contiguous citation (ellipsis) @ path — quote one contiguous excerpt`（**形状 vs 内容造假分列**）。
- 命中判据（`line.includes` 连续子串）与报告头行 `[host-verified] N/M` **零改**；判定面 = 仅失败分类，零新增匹配路径、零模糊匹配。
- 禁则四面 + 示例替形（`setTimeout(...)` ⇒ 连续引用形；含 `convergence.mjs:27`）。

（三）**归宿面**（设计 = `ADVISOR-GUARDS.md` §3 + 既有 §7）：
- 不可验证：分类 + 改法（（二））+ 条目不悬置（每轮明列收束、收尾不静默丢）；「不能支撑打回」本体零改。
- 不完整：失败结论块（`thincoder-core/advisor/notice.mjs` `settlementCriterion` / `buildSettlementConclusion` + `advisor-settle.mjs` 消费链）零改复核——本批**零新增判定族 / 零新 kind**。

**受影响文件表（18 档 · file:line 级 · 行数预算 = 现读 ⇒ 预期）**

| # | file | 现读 | 预算 | 改动面（file:line 级） |
|---|---|---|---|---|
| 1 | `thincoder-core/advisor/citations.mjs` | 139 | +6~+10 | `:22` 邻位省略号判据常量；`:78-84` 失败分类分支加「非连续引文」类 + 改法（`includes` 命中判据零改）；`:10-11` 头注定性同步 |
| 2 | `thincoder-core/advisor/messages.mjs` | 299 | **±0（净零——顶 300 软线内）** | `:51-52` 回显条件句 `finds NO 🔴` ⇒ `no unresolved 🔴 remains`；`:56` 尾行补定义句 |
| 3 | `thincoder-core/advisor/convergence.mjs` | 80 | ±0 | `:27` 示例引文替形 |
| 4 | `thincoder-core/prompts/advisor-round1.md` | 41 | +1 | `:26` 后追加禁则句 |
| 5 | `thincoder-core/prompts/advisor-round2.md` | 46 | +4~+5 | `:15` 评估句替换（3 行）+ `:11` 收尾句追加 + `:16` 示例替形 + `:17` 后禁则句 |
| 6 | `thincoder-core/prompts/advisor-round3.md` | 42 | +5~+6 | `:12` 后接受句（2 行）+ `:13` 示例替形 + `:14` 后禁则句 + `:42` 裁决句替换 + `:10` 收尾句追加 |
| 7 | `thincoder-core/prompts/advisor-design.md` | 43 | ±0~+1 | `:19` 引证段追加禁则句 |
| 8 | `thincoder-core/prompts/discipline-normal.md` | 209 | ±0~+1 | `:128` `Deferred` 行扩展；`:129` 轮次句追加义务句 |
| 9 | `thincoder-core/prompts/persona-engineering.md` | 193 | ±0~+1 | `:108` `Deferred` 行扩展；`:112` 轮次句追加义务句 |
| 10 | `docs/core/design/prompts/advisor-round1.md` | 70 | +1 | `:50` 后禁则句（CN） |
| 11 | `docs/core/design/prompts/advisor-round2.md` | 61 | +4~+5 | `:26` 评估句替换 + `:20` 收尾句 + `:27` 示例替形 + `:61` 裁决句 |
| 12 | `docs/core/design/prompts/advisor-round3.md` | 58 | +5~+6 | `:12` 后接受句 + `:25` 示例替形 + `:58` 裁决句 + 收尾句 |
| 13 | `docs/core/design/prompts/advisor-design.md` | 73 | ±0~+1 | `:43` 引证段追加禁则句（CN） |
| 14 | `docs/core/design/prompts/discipline-normal.md` | 205 | ±0~+1 | `:127` `Deferred` 行；`:128` 轮次句 |
| 15 | `docs/core/design/prompts/persona-engineering.md` | 193 | ±0~+1 | `:106` `Deferred` 行；`:112` 轮次句 |
| 16 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 356 ⇒ **450（已落）** | +94 | §2.4 / §2.5（新增）/ §7 第 2 条 / §12 / 变更记录 |
| 17 | `docs/core/design/ADVISOR-GUARDS.md` | 408 ⇒ **431（已落）** | +23 | §3 / §10 / 变更记录 |
| 18 | `docs/batches/2026-10-03-advisor-convergence.test.mjs`（拟新增） | 0 | ~200–280 | 批内件（T1–T13 · 随批留存 · 不进仓套件） |

**批内用例设计（可机判 · 先红后绿可行）** — 落点 = `docs/batches/2026-10-03-advisor-convergence.test.mjs`（拟新增；跑法 = 仓根 `node --test docs/batches/2026-10-03-advisor-convergence.test.mjs`；零网络 / 零真实 LLM / 零长等待）：

| 用例 | 面 | 输入 / 操作 | 预期（机检断言） | 初态 |
|---|---|---|---|---|
| T1（主腿） | 引证分类 | 夹具档 + 引文内容含 `…`（路径行号真实、内容缩略）⇒ `verifyCitations` | `failed[0].reason` 匹配 `not a contiguous citation (ellipsis)` 且含 `quote one contiguous excerpt`；**不**匹配 `content mismatch` | **红**（现报 mismatch） |
| T2 | 引证分类 | 非省略号且内容不在行上 | reason = `content mismatch @ …`（旧类零改） | 绿 |
| T3 | 引证分类 | 内容含 `...`（ASCII）同 T1 形 | 同 T1（形状类） | **红** |
| T4 | 引证反例锁 | 内容含 `...` 但逐字命中（所引行确含该串）⇒ **仍 matched**（零误报） | matched=true | 绿 |
| T5 | 引证零回归 | 精确连续子串引用 ⇒ matched；`appendCitationReport` 头行 `[host-verified] 1/1 citations match current file state.` 逐字 | 头行零改 | 绿 |
| T6 | 引证路径类 | 越围栏 ⇒ `path traversal`；缺档 ⇒ `file unreadable` | 两旧类零改 | 绿 |
| T7 | 提示词 · 轮 2 窗句 | 读 `thincoder-core/prompts/advisor-round2.md` + CN 对位 | 含 `every non-fix MUST carry a reason` ∥ `last one where a reasoned non-fix can be pushed back` ∥ `Status \`Accepted\`` | **红** |
| T8 | 提示词 · 轮 3 接受句 | 读 round3 两档 | 含 `ACCEPT them` ∥ `do not re-adjudicate` ∥ `zero-reason` | **红** |
| T9 | 提示词 · 裁决句随动 | 读轮 2 / 3 两档 | 含 `or accepted (a reasoned non-fix` ∥ `zero-reason non-fix — silence or evasion is never accepted` | **红** |
| T10 | 提示词 · 禁则 + 示例替形 | 读四面 EN + 四面 CN + `convergence.mjs` | 禁则句在位（`Never abbreviate a quote with an ellipsis` / `引证内禁用省略号`）；全量扫 `setTimeout(...)` 零命中 | **红** |
| T11 | 设计回显条件句 | `buildDesignApprovalBlock("t","d")` 输出（`thincoder-core/advisor/messages.mjs` 导出） | 含 `no unresolved 🔴` + `does not block`；不含 `finds NO 🔴` | **红** |
| T12 | 收尾不悬置句 | 轮 2 / 3 两档 | 含 `never drop an item silently` / `不得静默丢条目` | **红** |
| T13 | 归宿 · 结论块（复核腿） | `settlementCriterion({hasResult:false})` / `{incomplete:"timeout"}` / `{incomplete:"interrupted"}`；`buildSettlementConclusion(…)` 输出 | `no_report` / `timeout` / `null`；块含标识行 + 选项行 | 绿（零改复核） |

**验收对照（回指）**

| # | 验收（可机判） | 回指 | 载体 |
|---|---|---|---|
| AC-1 | 窗三句 + 状态词表 + 裁决句随动（四组 × EN/CN 逐字在位） | F32 / F33 | 提示词八档（T7–T10 / T12） |
| AC-2 | pass 随动可核：回显条件句 = `no unresolved` + 定义句 | F33 | `messages.mjs`（T11） |
| AC-3 | 省略号 ⇒ 非连续引文（含改法）∥ 非省略号 mismatch 照旧 ∥ 命中判据 / 头行 / 路径类零改 | 随行 1 | `citations.mjs`（T1–T6） |
| AC-4 | 禁则四面在位 + `setTimeout(...)` 示例零残留（含 `convergence.mjs`） | 随行 1 | 提示词 + 代码（T10） |
| AC-5 | 不可验证 ⇒ 分类 + 收尾不静默丢；不完整 ⇒ 结论块（复用） | 随行 2 | T12 / T13 |
| AC-6 | 零回归：轮次机制 ∥ `Do NOT look for new issues` ∥ 降权语义照旧 | §1 验收④ | T5 / T6 / T13 + 断言 |
| AC-7 | 仓根 `node scripts/doc-check.mjs` 复跑 exit 0（悬空 0 · 行宽 OK） | 验收标准 | 设计轮已复跑（读数见 §2 末） |

**关键决策（含被否项）**

| KD | 决策 | 依据 / 被否项 |
|---|---|---|
| KD-1 | 窗映射 = 轮 1–2 可打回 ∥ 轮 3+ 必收（全局轮号） | F32 判定句字面；被否：按争议自身龄映射（与判定句字面不符 + 需跨轮记录——违零载体） |
| KD-2 | 表列新值 `Accepted`（词表四值）+ 入表可见 | F33 需「prior 🔴 ∈ {fixed, accepted}」可核；被否：仅措辞不带新值（收口与 fixed 不可分、静默消失不可核）；被否：主机解析词表（违 F6） |
| KD-3 | 省略号检测 = `…` ∥ `...`；命中判据零改 | 用户裁定「省略号禁用于承担判断面」+ 三处现场「引用截断形态」；被否：对省略号拆分比对 / 归一化（与「连续子串」语义相抵 + 引模糊匹配）；边角登记：真含 `...` 的陈旧引文会归形状类（消息仍指向重引——接受） |
| KD-4 | 示例替形（`setTimeout(...)` ⇒ 连续引用形；含 `convergence.mjs`） | 示例自身不得违反禁则（自洽）；被否：保留示例（两说） |
| KD-5 | 设计轨两轨同形 + 回显条件句随动 | F32 边界「design 轨适用形由设计轮核」——判定依据见 §2.5；被否：设计轨豁免（相持不终止——违裁定意旨） |
| KD-6 | 被审方义务落纪律面（双源四档）；`Deferred` 开「携理由认账不修 🔴」一格 | F32①（不修须携理由——技术反驳 ∥ 认账不修两形态）；被否：不落纪律面（① 无落点）；被否：新增第五 Action 值（破「四值封闭」） |
| KD-7 | 归宿面零新增：复用分类 + 既有结论块 | §1 边界（无新判定族 / 不机械刹车）；被否：对「引证全灭」新设结算 kind（改 F28 kind 枚举——超射程） |
| KD-8 | 「guard 零动」含促评门文案（`(round N+1)`） | §1 明示不做 + 用户 22:38 裁定；登记（上抛 U3） |

**上抛项（待父侧裁 / 笔在父侧）**

- **U1 · 需求档 §4 边界行与 F32 相抵**：§4「不改评审侧提示词（`advisor-*.md` / `consult-base.md`）」与 F32 落地（评审提示词必改）相抵——建议收正该行（加限定「F32 落地面除外」∥ 收窄射程）。
- **U2 · 随行两面无需求档编号**：引证形状面 / 归宿面现只载于 §1 + 台账 #849——三链同源要求下建议立条目或明书归属（如 F5 / F28 落地面）。
- **U3 · 「加轮文案收正」未入射程**：台账 #849 标题三件之一——最接近读法 = 促评门文案（`thincoder-core/agent/completion.mjs:144` `(round ${rounds + 1})`）随「guard 零动」出射程；登记，如另有实指请点派。

**自检读数（设计轮 · 已复跑）**：仓根 `node scripts/doc-check.mjs` ⇒ **exit 0**——`OK(锚): 0 条悬空` ∥ `OK(行宽): 无 >300 字符单行`；行数面报告 4 条 = 先行存在（desktop 三档 + E2E 一档，非本批面）。两设计档落笔后复跑零新增违规。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象：design/ADVISOR-CONVERGENCE.md §2.5（F32/F33 契约）∥ design/ADVISOR-GUARDS.md §3（四类失败 + 四面禁则 + 归宿面）∥ requirements/ADVISOR-CONVERGENCE.md §2.4（F32–F35）。F32–F35 逐条对照（含判定句与边界句）：覆盖面完整，未发现 🔴。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance criteria / doc-state | 🟡 | `thincoder/docs/core/design/ADVISOR-GUARDS.md:368`（A-AG5）仍写「失败原因三分」，与本档 §3 `:122`「失败原因四类」及需求 `thincoder/docs/core/requirements/ADVISOR-CONVERGENCE.md:61`（F34「失败分类四分」）相抵；变更记录 `ADVISOR-GUARDS.md:407` 已载「三分 ⇒ 四类」而该验收行未随动（A-AG16 `:379` 只补形状类）。 | 将 A-AG5 的失败原因计数与 §3 现状对齐（或直接回指 §3），让四分分类有唯一逐字验收锚。 |
| 2 | Doc hygiene（边界面残句） | 🟡 | `thincoder/docs/core/requirements/ADVISOR-CONVERGENCE.md:97`（§4 边界行）保留「（2026-10-03——原「不改评审侧提示词」句由 F32 落地作废）」——被作废句的沿革括注留在边界面（沿革已在变更记录 `:247` 有账）。 | 删除该括注，边界行只留现行命令句；沿革归变更记录面。 |
| 3 | Consistency（判据射程） | 🟡 | `thincoder/docs/core/design/ADVISOR-CONVERGENCE.md:70` 括注把「修复未引入新 🔴」定为轮 2 另加，而 `:115`「轮 2 / 轮 3 同片」的逐字块 `:117`/`:119` 对两轮同含该条——轮 3+ 判据范围两说（轮 3+ 禁新问题使其多为惰性，字面冲突仍在）。 | 统一「修复未引入新 🔴」的轮次射程（一处说法），或明写该条在轮 3+ 为惰性。 |
| 4 | Clarity | 🔵 | `ADVISOR-CONVERGENCE.md:137` 的 Approval Signal 尾行补定义「…does not block — anything else stays unresolved」无显式射程；同档 `:58` 又写「🟡/🔵 不阻断 approval」——「anything else」可被读成含 🟡，存在该回显 token 时误扣的风险。 | 为该尾句加显式射程（限 🔴），与 `:58` 口径对齐。 |
| 5 | Completeness（窗的残留） | 🔵 | 窗语义（`ADVISOR-CONVERGENCE.md:67`–`:71`）只覆盖「携理由的不修项」：`Dispatched`（在途未落地，`:333`）不在 `Status` 归宿集（`:69`）内，其行在轮 2/3 表内的归宿未写；评审者拒不执行接受句 / 反复虚报 `Fixed` 的路径亦无对照 `:71` 零理由出口的出口句——`:68`「相持循环必然终止」仍依赖提示词层遵从。 | 补残留说明（非「不修」形态的不收敛路径的处置与上报出口），并写明 `Dispatched` 行在验证表中的归宿。 |
| 6 | Acceptance criteria | 🔵 | `ADVISOR-CONVERGENCE.md:402`（A-AC12）「轮 1–2 可对不修理由出打回」中轮 1 无 prior（`:150`「窗语义不入」）——该半句不可成立；「表列 `Accepted` 形态可核」未给机判锚（对照 `:403` A-AC13 的「逐字在位」口径）。 | 把可打回轮次收实到实际成立的轮次（轮 2 起），并为「表列形态」给出可核面（提示词逐字 / 用例断言）。 |
| 7 | Consistency（双源口径） | 🔵 | 收尾句 CN `ADVISOR-CONVERGENCE.md:130` 射程为「预算用尽收尾时」，EN `:128` 为任意「wrap up with items not fully verified」——双源不同宽。 | CN 射程与 EN 对齐（不限预算用尽）。 |
| 8 | Doc hygiene（轻） | 🔵 | `ADVISOR-GUARDS.md` §3 规范句面保留沿革对照措辞：`:122`「（报告可判，替代单一 `file unreadable`）」、`:124`「省略号形不再报 mismatch」。 | 「替代 / 不再报」类对照句移入变更记录，规范面只留现行分类。 |
| 9 | Doc state | 🔵 | `ADVISOR-CONVERGENCE.md:37` 轮次表行标「Round 3–5」为撤 cap 前残留，与本档 `:41`（无机械上限）、`:47`（≥2 已完成 ⇒ ROUND3）、`:68`（轮 3+）不一致。 | 行标改为「Round 3+」。 |
| 10 | Consistency（轨射程） | 🔵 | `ADVISOR-CONVERGENCE.md:119`（轮 2/3 同片）把「any 🟡 the review marks as must-fix」列为 changes-required 触发项，而设计轨无 must-fix 🟡 类且 🟡/🔵 不阻断（`:58`；F33 边界「不改 must-fix ∥ optional 面语义」）。该句是否为现有提示词文本未核（unverified——提示词档不在评审范围）。 | 明写该条的轨射程（code 专有 / 设计轨惰性），与 `:58` 口径对齐。 |

范围外注记（无严重级）：① 批档材料（受影响文件表 / 行数标注与拆分规划 / 用例表）不在评审范围（两档变更记录指向 `docs/batches/2026-10-03-advisor-convergence.md`：`ADVISOR-CONVERGENCE.md:422` / `ADVISOR-GUARDS.md:407`）——本批将触及的源档（`thincoder-core/advisor/messages.mjs`、`thincoder-core/advisor/convergence.mjs` 等）的行数标注在此不可核。② 范围外实现事实（unverified）：`ADVISOR-CONVERGENCE.md:72` 依据①（轮 2/3 提示词两轨共用——`thincoder-core/advisor.mjs` 轮次选择）、`:133` 构建面（`messages.mjs`）、四份提示词档现文、`ADVISOR-GUARDS.md:135`–`:139` 的 `convergence.mjs` 示例。③ 无文档地图 / 无项目标准档：Document ownership 按三档自身单一权威声明与需求档归属边界核过（无新档、未见重述，新增内容各落归属节）；跨仓通则与方法学核查降级（如实）。

计数：🔴 0 / 🟡 3 / 🔵 7

VERDICT: pass

### 轮次 2（评审子代理）

复评（修复轮 #19 工程侧 9 项 + 父侧 2 项后 · 设计终态重评）——范围：`design/ADVISOR-CONVERGENCE.md`（§2.5 窗契约 + 修复轮收正）∥ `design/ADVISOR-GUARDS.md`（§3 四类 + 禁则 + 归宿面 + 修复轮收正）∥ `requirements/ADVISOR-CONVERGENCE.md`（§2.4 F32–F35）。

修复轮收正逐项复核（三档现文在位，未发现回归）：§2.5 判据随动句统一（ADVISOR-CONVERGENCE.md:71）· Approval Signal 尾行 🔴 射程（:141）· `Dispatched` 表内归宿（:70）· 非「不修」形态残余（:73）· A-AC12 打回轮次收实（轮 2）+ `Accepted` 词表（:406）· 收尾句 CN 射程对齐（:131-134）· §2.1「Round 3+」行标（:37）· must-fix 🟡 轨射程注（:127）· §5 失败分类四类（:284）· GUARDS §3 四类 + 沿革移入变更记录（ADVISOR-GUARDS.md:122-124 / :410）· 需求档 §4 边界行 + F34/F35（requirements/ADVISOR-CONVERGENCE.md:97 / :61-62）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | requirements §2.4 归属边界句「本节只承载**争议的裁决窗与收口语义**」（requirements/ADVISOR-CONVERGENCE.md:55）窄于本节现含内容：F34 引证形状面（:61）不属「裁决窗 / 收口语义」射程；且同档 §4（:97）已按「§2.4 明定的…引证写作禁则」立规——边界句未随 F34/F35 追加同步。 | 二选一保持单源：扩写归属边界句（覆盖引证形状面 + 归宿面），或将 F34 移入 §2.3（引文解析邻域）并同步 §4 指针。 |
| 2 | Consistency | 🟡 | 档头句「评审核查维度行为 = 本档 §8」（design/ADVISOR-CONVERGENCE.md:17）与 §9 自述「核查维度行为语义 = 本节」（:363）不一致：§8 = 需求契合度检查（:350），行数标注核查维度 = §9（:361）——疑为 off-by-one 指针。 | 将 :17 指针改指 §9；若「评审核查维度」另有实际所指，按所指澄清。 |
| 3 | Consistency | 🔵 | 需求档 F35 括注「评审收尾（预算用尽）时」（requirements/ADVISOR-CONVERGENCE.md:62）窄于设计侧射程：收尾句（design/ADVISOR-CONVERGENCE.md:131-133）与 GUARDS §3 归宿面（design/ADVISOR-GUARDS.md:141）均为不限预算用尽（GUARDS 变更记录 :407 明记该括注已收正）。 | 删除括注「（预算用尽）」（或改注为示例）——与设计侧收尾句同射程。 |
| 4 | Clarity | 🔵 | GUARDS §3 四类失败分类（design/ADVISOR-GUARDS.md:122-124）未明写「含省略号且不连续」引文同时满足 `content mismatch`（存在但内容不符）与 `not a contiguous citation` 两描述时的判定优先级；§3 为自述的逐字分类锚（A-AG5 :368），定论另在 A-AG16（:379「不再报 content mismatch」）与 F34 判定句①（requirements/ADVISOR-CONVERGENCE.md:61）。 | 在 §3 失败分类处补一句优先级（含省略号 ⇒ 专类、先于 mismatch 判定），或标注判据以 A-AG16 为准。 |
| 5 | Doc hygiene | 🔵 | 需求档 F16 边界「不改 cap 语义」（requirements/ADVISOR-CONVERGENCE.md:50）所指存疑：轮次 cap（F2/F3）已于 2026-09-18 撤项（同档 :239；设计档 design/ADVISOR-CONVERGENCE.md:158-168）——若指已撤轮次上限则为死句；若指 guard 推回上限（design/ADVISOR-CONVERGENCE.md:167 `MAX_ADVISOR_PUSHBACKS`）则缺限定词。 | 核对所指后收正：死句删除，或加限定词（如「不改 guard 推回上限语义」）。 |

out-of-scope note：本批「受影响文件表 / 用例表 / 上抛」按三档自述落批次档（docs/batches/2026-10-03-advisor-convergence.md）——不在本次范围，行数标注抽查未执行（unverified）。

计数：🔴 0 · 🟡 2 · 🔵 3
VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-10-03 23:14「都自动跑完」授权）**——三条件齐备：① **设计评审 pass** ✓（#16 · 🔴 0 ∥ 🟡 3 ∥ 🔵 7——全数采纳）；② **修复轮已落地并逐条核验** ✓（修复轮 #19 九号全落 + 父侧号 2 收正 + 另记 `:141` 就地拉平——实读复核：判据射程注／`Dispatched` 归宿／残余出口／尾行射程／轨射程注／四类计数全在位；doc-check 复跑 exit 0）；③ **token 已签发** ✓（凭据值不落档——沿纪律）。⇒ **实施轮派发**：eng-coder ×2 并飞（A = 代码面 4 档〔`citations.mjs` ∥ `messages.mjs` ∥ `convergence.mjs` + 批内件〕∥ B = 提示词面 12 档〔六档 EN 运行期 × 六档 CN 模板——落点 = §2 表 4–15〕）。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
