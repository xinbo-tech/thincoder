# 2026-09-25 · ledger-governance
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:52（#332 问）· 17:2x（#376 问）· 17:20「空继续」（立批放行）。
> 台账 = #332 / #376（台账治理 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次目标**：台账治理双件套——① `ledger_close` 追认直通（#332：免「未入在途」条目的三跳纯仪式）；② 台账治理纪律入提示词（#376：小形态项当场修 · 进池 = 真债 · 陈年面先 triage）。

**来源与裁定**：
- **#332** —— 用户 2026-09-25 12:52 问「为什么台账不直接更新到终态，非要形式主义的更新一串？有意义吗？」；父侧实核：追认场景（已落地未入在途的条目）中间三跳**零信息**（库无逐跳日志），正常流程链式价值在别处（在途 / executor 跨实例可见面 + 待核销两段结算）。**修形（父侧呈报稿）** = `ledger_close` 增追认口：**待讨论 / 待设计 → 已核销**（evidence 必填、缺则拒）；**在途 → 已核销 不可跳**（仍经 待核销）。
- **#376** —— 用户 2026-09-25 17:2x 问「你那条台账治理纪律是不是更应该进提示词啊？」；父侧实核 = 该条属**行为纪律**（处置时的「做还是记」判断），活面 = 提示词层（先例 = *Dispatch truthfully* / *No zero-text endings* 同层人格档）；记忆面（personal:82）退为备份。

**#376 内容（主 agent 内容权 · 逐字草案——落笔照此）**：
- CN 落点 = `docs/core/design/prompts/persona-engineering.md`「分发与收口纪律」区（*Debts go on the list* 邻位）；EN 落点 = `thincoder-core/prompts/persona-engineering.md` 对位段（双面各自自持语义一致）。
- 草案（CN）：「**能当场做的当场做**：评审 / 扫尾产出的一次性小形态项（措辞 / 坐标 / 索引 / 清理）当场修掉、不进池；**进池的才是真债**（需独立轮次 / 有条件 / 需设计）。处置前先对池面陈年条目 triage：已落地 ⇒ 追认核销；前提消失 / 重复 ⇒ 废弃。」
- 草案（EN）：「**Fix in place first**: one-off small-form items (wording / coordinates / indexes / cleanup) from reviews or sweeps get fixed on the spot — never booked. **Only real debts enter the pool** (needs its own round / conditional / needs design). Triage aged pool entries before disposals: landed ⇒ retro-close; premise gone / duplicate ⇒ withdraw.」
- 两界原则核：零文档引用 ✓（无档名 / 节号指路句）。

**边界（不做）**：ledger 其余命令面（scan / update / 其余 close 语义）零改；`ledger_update` 判据表零改（只动 `ledger_close`）；提示词其余段落零改；台账其余条目零触碰。

**验收要点（机器可验）**：
1. `ledger_close`：待讨论 / 待设计 → 已核销 **直通成功**（evidence 必填、缺 evidence 拒）；在途 → 已核销 **仍拒**（反证）；已核销 / 未知 id 幂等或明确报错。
2. 测试：core 全量绿 + 定向 ledger 用例（追认口三态 + 两反证）。
3. 提示词双面逐字落 + 机检（`prompts-dual-source` 族零红 + `prompt-refs-zero` 零命中——新句零文档引用）。

**台账**：#332 / #376 → 本批（收口后核销）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-09-25 · 轮次 initial · #332 / #376 全落 + 需求规格收正（父侧委托）+ 连带项裁定落地）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮次**：initial（设计轮，2026-09-25）· 实现轮 = 独立 spawn（eng-coder · 文件域 = 下表 #1 / #2 / #7 / #8）。

**本批条目（覆盖）**
- **#332** `ledger_close` 收口追认口——待讨论 / 待设计 → 已核销 **直通**（`evidence` 必填、缺则拒）；**在途 → 已核销 不可跳**（仍经 待核销）。
- **#376** 台账治理纪律入提示词——双面落点与布局设计（文本 = §1 逐字，零改）。

**不做（边界 · 承 §1）**：代码零改（设计轮）· 提示词文本零改 / 其余段落零触 · `ledger_update` 迁移表零改 · 不扩 ledger 其余命令面 · 不碰 §3 邻面。

**条目 ↔ 三账链（需求面已落 · 父侧明示委托本轮落——eng-designer 代执行 · 可 revert）**

| 条目 | 需求面（已落） | 设计面（已落） | 实现面（下轮） |
|---|---|---|---|
| #332 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` §②.2 + AC-M2-14 + 变更记录 | `docs/core/design/LEDGER.md` §3 / §3.1④ / §7.1 / §8 / 变更记录 | `thincoder-core/ledger-cmd.mjs`（`ledgerClose` 判据 + 工具描述）+ 新档测试 |
| #376 | `docs/core/requirements/PROMPT-SYSTEM.md` §2.2 增补块 + 变更记录 | `docs/core/design/PROMPT-SYSTEM.md` §6.8 + §7 D-PS9 + §6.1 实例 + 变更记录 | 双面 `persona-engineering.md` 各 +1 行（提示词落笔 = eng-coder） |

**机制设计 · #332（收口两源——`ledgerClose`）**

1. **判序**（同函数体内；与「目标集判 → 行取 → UPDATE」同层）：目标集判（`status ∉ {已核销, 已废弃}` ⇒ 拒——零改）→ 行取（不存在 ⇒ 拒——零改）→ **源态判**（target = 已核销 ∧ 源 ∉ {待讨论, 待设计, 待核销} ⇒ 拒）→ **`evidence` 门**（target = 已核销 ∧ 源 ∈ {待讨论, 待设计} ∧ 行 `evidence` 空 / 全空白 ⇒ 拒）→ UPDATE（事务包裹零改）。
2. **失败文案（逐字 · 机检断言面）**：`ledgerClose：核销仅限 待讨论 / 待设计 / 待核销（现态 <X>）` · `ledgerClose：追认核销须带 evidence（现态 <X>）`。既有两条文案零改（目标态 ∉ {…} / 行 N 不存在）。
3. **工具描述**（`ledger_close`）逐字更新为：「台账收口（写命令，仅主 agent）——勾销：待核销 → 已核销；追认核销：待讨论 / 待设计 → 已核销（须已有 evidence，缺则拒）；在途 → 已核销 不可跳（仍经 待核销）；撤回：任意态 → 已废弃。归档 = 软删除（写 closed_at，行保留）。」
4. **executor 语义**（闭 §3.1 射程）：追认路径**零触碰**（= 勾销同式——非在途出边，不属「离开在途自动清空」射程）；撤回路径零改。
5. **零改面**：`ledger_update` 迁移表（待讨论 → 已核销 经 update 仍拒）· `ledgerAdd` · DDL / schema · 查询面 · 其余 close 语义。

**机制设计 · #376（双面落点与形态）**

| 面 | 落点（实读坐标） | 插入位 | 形态 |
|---|---|---|---|
| CN 正本 | `docs/core/design/prompts/persona-engineering.md`（173 行） | `:76`（`- **欠账入清单**：…`）之后 · `:77`（排空优先）之前 | `- **能当场做的当场做**：…` 单行（逐字 = §1） |
| EN 运行面 | `thincoder-core/prompts/persona-engineering.md`（172 行） | `:77`（`- **Debts go on the list**: …`）之后 · `:78`（*Drain first*）之前 | `- **Fix in place first**: …` 单行（逐字 = §1） |

- 形态 = **既有节内增列**（零 `##` 块计数连带 ⇒ T-CL1 无涉）· 行数 CN 173 → 174 / EN 172 → 173。
- 草案自查（本席实跑 · 判据单源 = `thincoder-cli/test/prompt-refs-zero.test.mjs` 导出 `lineHits`）：两面命中 **0**（J1/J2/J3 全零）；行宽 CN **136** 字符 / EN **344** 字符（EN 面不在 doc-check 域——既有 EN 行 ~530 字符同体例）。
- 机检面：`prompt-refs-zero` T9 零命中 · `prompts-dual-source` T-CL1 = 14 守恒 + 维护者注反证绿；**不新增断言**（在场 = 一次性逐行比对，承设计档 §6.1 批次收尾核对）。

**受影响文件表**（`.md` 行两列按 `—` 口径；行数 = `wc -l` 口径 · 实读 2026-09-25）

| # | 文件 | 现况 | 预期 | 面 / 写手 |
|---|---|---|---|---|
| 1 | `thincoder-core/ledger-cmd.mjs` | 232 | ~+8（判据 + 门 + 两条文案 + 工具描述） | 源 · eng-coder |
| 2 | `thincoder-core/test/ledger-close.test.mjs` | 0（拟新增） | ~80–110（新档 ≤300） | 测试 · eng-coder |
| 3 | `docs/core/design/LEDGER.md` | —（.md） | — | 设计 · 已落（本席） |
| 4 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` | —（.md） | — | 需求 · 已落（父侧委托） |
| 5 | `docs/core/design/PROMPT-SYSTEM.md` | —（.md） | — | 设计 · 已落（本席） |
| 6 | `docs/core/requirements/PROMPT-SYSTEM.md` | —（.md） | — | 需求 · 已落（父侧委托） |
| 7 | `docs/core/design/prompts/persona-engineering.md` | 173 | 174（+1 行） | 提示词正本 · eng-coder |
| 8 | `thincoder-core/prompts/persona-engineering.md` | 172 | 173（+1 行） | 提示词运行面 · eng-coder |

**验收对照（回指 §1 三点 · 机器可验）**

| §1 | 判据 | 命令 / 读数 |
|---|---|---|
| 1 | 追认口三态 + 两反证 | `cd thincoder-core && node --test test/ledger-close.test.mjs` → 全绿（T33–T36：直通两源 / 缺 evidence 拒 / 在途拒 / 边界）；AC-M2-14 |
| 2 | core 全量绿 + 定向 | `cd thincoder-core && npm test` → fail 0（含新档） |
| 3 | 双面逐字 + 机检 | 逐行比对（本档 §1 ↔ 两面落地行）+ `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs test/prompts-dual-source.test.mjs` → 全绿 |
| 附 | 文档机检零新增 | `node scripts/doc-check.mjs` → 悬空 **4** / 行宽 **18**（= 基线；本席已复跑基线） |

**关键决策**

- **D1** 追认口落 `ledger_close`（不给 `ledger_update` 开表外迁移）——「撤回 / 追认」同属收口口语义；代价 = close 内多一条源态判（与既有目标集判同层）。否决：写开 update 迁移表（破 §1 边界 + 扩大迁移表语义面）。
- **D2** `evidence` 判据 = **行字段非空**（`null` / 空串 / 全空白 ⇒ 拒）——`ledger_close` **不加 `evidence` 入参**（零接口扩张）；缺证据 ⇒ 先 `ledger_update` 回写再收口（两跳，仍免三跳）。
- **D3** 追认路径 `executor` 零触碰（与勾销同式）——闭 §3.1 既有「离开在途清空」射程（待讨论 / 待设计 非在途出边）。
- **D4** #376 落点 = 「派发与收尾纪律」节 `欠账入清单` 邻位（父侧裁定）· 设计记录 = 设计档 §6.8 + D-PS9（否决：台账节 / 新增节 / 公共层 / 纪律层）。
- **D5** 新测试档 `thincoder-core/test/ledger-close.test.mjs`（拟新增）——族分档先例（执行者 / 写门 / 键归一 / 迁移各一档）；不并入他档（面不同）。

**上抛项**

- **① 提示词面陈旧句（需父侧裁定——已上行 `ask`）**：双面 `persona-engineering.md` 台账节生命周期 ② 含「`ledger_close` 只认现态「待核销」」（CN `:142`）/「`ledger_close` accepts only the current state 待核销」（EN `:144`）——#332 落地后该句**失真**（核销另认追认口）。§1 边界「提示词其余段落零改」未覆盖此句 ⇒ 本席零触碰、如实上抛。建议 = 实现轮同批定点收正（两处各半句——与 #376 同文件，且正合 #376 新句「能当场做的当场做」）；备选 = 当日入账（技术待办 + 到期条件 = #332 实现轮落定前）。
- **② 坐标实读更正**：派单记「规格 §2.8 邻面」——实读定位：收口语义面 = 规格 §②.2（六态状态机）+ §④ AC 表；§②.8 = F-LX1 执行者归属（非本件邻面）。本席已按实读落位。

**§2 追加（2026-09-25 · 父侧裁定落地——问题①「就地处置」）**

**裁定**（父侧回报 · 采纳本席倾向）：两处陈旧半句**随实现轮同批定点收正**——「#376 新句的首个实例（文件已在写集内，属实现连带、非扩面）」；§1 边界「提示词其余段落零改」按**连带项披露**处理（原上抛项① 撤，改记 = 就地处置）。约束：① 改后草案逐字写进 §2（本块 L1 / L2）——文本内容权 = 主 agent，核后再交实现轮落笔；② 收正形须与 #332 落定语义一致（追认口 = 待讨论 / 待设计 → 已核销；在途仍经 待核销）。

**连带项处置清单（改后草案逐字）**

| # | 文件 | 落点 | 改前（实读半句） | 改后草案（逐字 · 半句替换） |
|---|---|---|---|---|
| L1 | `docs/core/design/prompts/persona-engineering.md` | `:142` | `ledger_close` 只认现态「待核销」 | `ledger_close` 核销两源 = 待核销（勾销）· 待讨论 / 待设计（追认核销——须带 `evidence`）；在途不可跳 |
| L2 | `thincoder-core/prompts/persona-engineering.md` | `:144` | `ledger_close` accepts only the current state 待核销 | `ledger_close` closes from 待核销 (settlement) or 待讨论 / 待设计 (retro-close — `evidence` required); 在途 never skips 待核销 |

改后**完整行**（半句替换后 · 其余文字零改；本席已跑判据单源 `lineHits` = 0 命中 · 行宽 CN 149 / EN 308 字符——EN 面不在 doc-check 域）：

- L1：`2. **实施核验通过** ⇒ **在途 → 待核销 → 已核销**（两步迁移；`ledger_close` 核销两源 = 待核销（勾销）· 待讨论 / 待设计（追认核销——须带 `evidence`）；在途不可跳）；`evidence` 回写**结账依据**（落点坐标 / 提交号 / 批档节）。`
- L2：`2. **Implementation verification passed** ⇒ **在途 → 待核销 → 已核销** (two-step migration; `ledger_close` closes from 待核销 (settlement) or 待讨论 / 待设计 (retro-close — `evidence` required); 在途 never skips 待核销); write the **settlement basis** back into `evidence` (landing coordinates / commit id / batch-record section).`

**受影响文件表（增量行——承裁定）**

| # | 文件 | 现况 | 预期（+连带） | 面 / 写手 |
|---|---|---|---|---|
| 7′ | `docs/core/design/prompts/persona-engineering.md` | 173 | 174（+1 行新句 · 1 行定点收正〔L1〕） | 提示词正本 · eng-coder |
| 8′ | `thincoder-core/prompts/persona-engineering.md` | 172 | 173（+1 行新句 · 1 行定点收正〔L2〕） | 提示词运行面 · eng-coder |

**机检面（连带项同适用）**：`prompt-refs-zero` T9 零命中（改后草案已过 `lineHits` = 0）· T-CL1 守恒 · 逐行比对含连带两处（批档 §2 围栏块 ↔ 落地档）。**设计 / 需求面同步**：设计档 §6.8「连带项」段 + 需求档 §2.2 增补块 ② 已随本裁定落。

**§2 追加（2026-09-25 · 修正轮 1——评审 #69 裁定落地 · fix）**

**轮次**：fix（点修 6 条：1 / 2 / 3 / 5 / 6 / 7；发现 4 = Not an issue——零动作）。评审发现全文 = §3 轮次 1。

**逐条处置（号 → 改动 file:line）**

| # | 处置 | 落点 / 读数（实读后行号） |
|---|---|---|
| 1 | executor 字段格收正（清除条件按设计 §3.1 ②/④；「回退」删）+ 变更记录 +1 | `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:24`（+ 变更记录 :89-90） |
| 2 | §7 决策表接回——删 D-PS8 与 D-PS9 间空行（D-PS1–D-PS9 同表连续） | `docs/core/design/PROMPT-SYSTEM.md:265`（删后 :265 = D-PS9 行） |
| 3 | §5 归档行补注——与 §3.1 ④ 撤回 `executor = NULL` 对齐 + 变更记录 +1 | `docs/core/design/LEDGER.md:153`（+ 变更记录 :380） |
| 5 | 连带项 L3 / L4（双面括注整删——实现轮落笔） | 见下「连带项清单（续）」 |
| 6 | §6.8 边界补「「父侧不代笔」交界」句（设计面显式化——提示词文本零改）+ 变更记录 +1 | `docs/core/design/PROMPT-SYSTEM.md:251`（+ 变更记录 :369） |
| 7 | 同因扫描条（实现轮执行） | 见下「实施注意 · 同因扫描」 |

附：PROMPT-SYSTEM.md 变更记录 +1 行（发现 #2 / #6 合一条）——承档内「每处改动留痕」惯例（派单只点 1 / 3 号变更记录）；如判超派单 ⇒ 该行可单点 revert。

**连带项清单（续——L3 / L4 · 提示词面残项 · 实现轮 eng-coder 落笔）**

| # | 文件 | 落点 | 改前（实读半句） | 改后草案（逐字 · 整删） |
|---|---|---|---|---|
| L3 | `docs/core/design/prompts/persona-engineering.md` | `:143` | `（D7 收口行由「读数」升为「动作」）` | （整删——删后句义自足） |
| L4 | `thincoder-core/prompts/persona-engineering.md` | `:145` | `(the D7 row rises from "read-out" to "action")` | （整删——双面对位实读命中 ⇒ 同删） |

删因（评审发现 #5 · 父侧裁定整删）：括注「D7」= 外档行号指称（定义面 = `docs/core/design/LEDGER.md:7`）——按 §6.6 逐处处置复核，未裁 ⇒ 整删保语义。

改后**完整行**（逐字 · 其余文字零改）：

- L3：`3. **批收口** ⇒ **勾销核对**：核本批条目已核销、指针可解析；**前批遗留**（条目已完成而挂靠批档未收口）⇒ 走**兜底核销路径**。`
- L4：`3. **Batch closeout** ⇒ **settlement cross-check**: verify entries settled, pointers resolve; **prior-batch leftovers** (entry done, anchor batch record unclosed) ⇒ the **fallback settlement path**.`

**受影响文件表（增量行·续——承裁定）**

| # | 文件 | 现况 | 预期（+连带） | 面 / 写手 |
|---|---|---|---|---|
| 7″ | `docs/core/design/prompts/persona-engineering.md` | 173 | 174（+1 行新句 · 两处定点收正〔L1 · L3〕） | 提示词正本 · eng-coder |
| 8″ | `thincoder-core/prompts/persona-engineering.md` | 172 | 173（+1 行新句 · 两处定点收正〔L2 · L4〕） | 提示词运行面 · eng-coder |

**实施注意 · 同因扫描（发现 7——实现轮执行）**：`thincoder-core/tool-docs/**` 中 `ledger_close` 核销源态句（「只认现态 / 仅限 待核销」族）扫一次——**命中 ⇒ 同批收正；零命中 ⇒ 记读数**（读数落 §5）。本席预读（as-of 2026-09-25）：`tool-docs/` 24 档无 ledger 档（候选面零命中）；同类句实存处 = `thincoder-core/ledger-cmd.mjs:113`（拒文案）+ `:218`（工具描述）——两处已入本批机制设计 ② / ③ 收正射程；其余命中 = 记录 / 描述面（`docs/batches/2026-09-19-ledger-lifecycle.md` · `_archive` · 本批收正描述句）⇒ 不回改。

**机检读数（修正轮 · as-of 2026-09-25）**：`node scripts/doc-check.mjs` → 悬空 **4** / 行宽 **18**（= 基线；本批三档零新增行）。中途一次外部在途写（`docs/vsc/design/SETTINGS.md` · 他批在途）曾致瞬时 +1 悬空，其后由该写手收正——非本批面，如实登记。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 批 ledger-governance §2 设计（#332 `ledger_close` 追认口 + #376 提示词纪律句 + 连带项 L1/L2）；评审域 = `LEDGER.md` / `design/PROMPT-SYSTEM.md` / `requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` / `requirements/PROMPT-SYSTEM.md` / `design/prompts/persona-engineering.md` 五档。
**限制声明**：逐字文本（#376 新句 / L1 / L2 改后草案）住批档 §1/§2（域外）⇒ unverified；英文运行面 `thincoder-core/prompts/persona-engineering.md` 不在域 ⇒ *Debts go on the list* 邻位锚点 unverified；受影响文件行数标注域内不可见；无项目标准档 / 无文档地图 ⇒ 方法学与归属判据降级（按 AGENTS.md + 域内既有纪律判）。
**域内核对结论**：#332 = 需求档 §②.2 / AC-M2-14（:28 / :68）与设计 §3（:114-115）/ §3.1④（:140）/ §7.1（:211）/ §8（:299）+ T33–T36（:331-334）逐点对齐，迁移表零改与 AC-M2-9「`ledgerUpdate` 待讨论→已核销拒」分句无冲突；#376 = 需求档增补块（:50-57）与设计 §6.8（:238-251）+ D-PS9（:266）+ §6.1 第三例（:159）逐点对齐，落点锚实存（`persona-engineering.md:66` / `:76`）；连带项目标句实存（`persona-engineering.md:142`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc-state（需求⇄设计滞后） | 🟡 | `ENGINEERING-MODE-V2-SPEC-LEDGER.md:24` executor 字段格「核销 / 废弃 / 回退时清空」与追认语义互斥——追认核销为「核销路径两源同式零触碰」（`LEDGER.md:140` §3.1④；哨兵 `LEDGER.md:334` T36）；同批已改同档 §②.2 未收此格 | 该格清除条件按 §3.1 ②/④ 收正（离开在途 / 撤回清除；核销含追认零触碰）；「回退」一词同删（六态无回退边） |
| 2 | Clarity（表格断裂） | 🟡 | `PROMPT-SYSTEM.md:265` 空行截断 §7 决策表——D-PS9（:266）不在表内（渲染为孤立行）⇒ 新决策在规范面不可见 | 删 :265 空行，使 D-PS9 与 D-PS1–D-PS8 同表 |
| 3 | Doc-state（同档内部张力） | 🟡 | `LEDGER.md:153` §5 归档行「`ledgerClose` 只 UPDATE `status` + `closed_at`」与 `LEDGER.md:140` §3.1④（撤回路径 UPDATE 同步 `executor = NULL`）互斥 | §5 行补「（撤回路径另置 `executor = NULL`——§3.1 ④）」或去「只」 |
| 4 | Affected-file annotations（协调项） | 🟡 | 本批唯一源码落点 ≈ `thincoder-core/ledger-cmd.mjs`（§3.1 落点句）＋新测试档 `thincoder-core/test/ledger-close.test.mjs`（拟新增）——现行行数 / 预期增量域内不可见（as-of 快照归批档惯例 = `LEDGER.md:354`）⇒ 档位判据 unverified | 核批档 §2 受影响文件表：`ledger-cmd.mjs` 标现行行数 + 预期增量；新测试档标预计规模；越档位（>300 预警 / >500 必须拆）须带拆分计划 |
| 5 | Doc hygiene（两界残项 · 改动面外） | 🔵 | `design/prompts/persona-engineering.md:143`「（D7 收口行由「读数」升为「动作」）」——`D7` 指外部档清单行号（定义面 `LEDGER.md:7`）；§6.6 判据线三条件名下，括注亦近编写纪律 #15 维护者注 | 按 §6.6 逐处处置表复核：未裁 ⇒ 删 `D7` 或整括注（保语义）；已裁保留 ⇒ 注记 |
| 6 | Clarity（边界交界） | 🔵 | §6.8「当场修掉、不进池」（`PROMPT-SYSTEM.md:242`）与同节「父侧不代笔」三类例外 + 打标义务（`persona-engineering.md:73-74`）/「修正轮边界」的交界未在设计中显式收口（D-PS9 仅标并列） | §6.8 补一句交界（限自有写域 / 机械形态收正 / 小修改 + 打标），或确认批档 §1 逐字已含限定 |
| 7 | Coverage（核对项） | 🔵 | 本批只收提示词面陈旧句（L1/L2）；同类「勾销仅限待核销」句是否存于工具描述面（`thincoder-core/tool-docs/**`——同属 §6.6 域）域内不可见（unverified）；先例 = 2026-09-21 三处撞点同批收正（`requirements/PROMPT-SYSTEM.md:120-122`） | 随实现轮做一次同因扫描，命中 ⇒ 同批收正；零命中记读数 |

**计数**：🔴 × 0 · 🟡 × 4 · 🔵 × 3（无 🔴）。

VERDICT: pass

## §4 用户批准（主 agent）

**代执行口径**（承用户 2026-09-25 12:52/17:2x 问 + 17:20「空继续」立批放行 + 今日既定全链口径）：设计（§2 `:34-126` + 修正块 `:128-168`）→ 评审 pass（§3 轮 1 · 🔴0 / 🟡4 / 🔵3——父侧逐条裁定：4 = Not an issue〔受影响表实存 §2 `:70-79`〕；1 / 2 / 3 / 5 / 6 / 7 = 修正轮落）→ **修正轮 6 条落位**（`#70` · 含 L3 / L4 双面连带项）→ **父侧抽验通过**（`SPEC-LEDGER.md:24` executor 格收正 · `PROMPT-SYSTEM.md:251` 交界句 · `:265` D-PS9 归表 · `LEDGER.md:153` 补注——逐项实读）⇒ **批准进入实施**。**内容权备忘**：L1–L4 四段文本逐字经主 agent 批准（提示词内容权）。设计 token 已发（凭证不落档）；实施 = eng-coder 初始轮（`ledger-cmd.mjs` 判据 + 门 + 文案 + 工具描述 · 新档测试 T33–T36 · 双面提示词落笔〔新句 + L1 / L2 + L3 / L4〕· 同因扫描（#7））。

**补充（父侧裁定 · L5 · 随 fix 轮落 · 同 token · 链未闭）**：评审遗留 🔵（`ledger-cmd.mjs:229` `status` 参数描述「目标态（勾销 / 撤回）」）——**判值改**（非 Deferred）：收正为「目标态（勾销 / 追认核销 / 撤回）」（#332 后 已核销 两路；与主体描述 `:222` 已含两路对齐）。out-of-scope 注记（`TOOLS.md:786` 坐标漂移——非本批所致）随清账面处置。

## §5 实施记录（eng-coder）

**交付摘要**（2026-09-25 · 初始轮 · 设计单源 = §2 `:34-126` + 修正块 `:128-168`）
- **#332**：`ledgerClose` 收口两源落笔——判序（目标集判 → 行取 → 源态判 → `evidence` 门 → UPDATE 事务包裹零改）· 两失败文案逐字 · 工具描述逐字；`thincoder-core/ledger-cmd.mjs`（232 → 236 行）。
- **新档测试**：`thincoder-core/test/ledger-close.test.mjs`（0 → 153 行）· T33–T36 全绿（直通两源 / 缺 `evidence` 三形态 / 在途拒 + 两步反证 / 终态拒 · 未知 id · `executor` 哨兵 · 撤回含 `executor=NULL`）。
- **#376 + 连带**：双面新句 + L1 / L2 半句收正 + L3 / L4 括注整删——`docs/core/design/prompts/persona-engineering.md`（173 → 174 行）· `thincoder-core/prompts/persona-engineering.md`（172 → 173 行）。

**逐字落点对照**（判据单源 = §1 `:17-18` / §2 `:52-53` `:116-117` `:156-157`；比对方式 = 全行等值 + `lineHits` 0 命中）

| 项 | 落点 | 逐字源 |
|---|---|---|
| #376 新句 CN | `docs/core/design/prompts/persona-engineering.md:77`（`:76` 欠账入清单 之后 · `:78` 排空优先 之前） | §1 `:17` + `- ` |
| #376 新句 EN | `thincoder-core/prompts/persona-engineering.md:78`（`:77` Debts 之后 · `:79` Drain first 之前） | §1 `:18` + `- ` |
| L1（半句收正） | CN `:143` 全行等值 | §2 `:116` |
| L2（半句收正） | EN `:145` 全行等值 | §2 `:117` |
| L3（括注整删） | CN `:144`（`D7` 零命中） | §2 `:156` |
| L4（括注整删） | EN `:146`（`D7` 零命中） | §2 `:157` |
| 失败文案 1（源态判） | `thincoder-core/ledger-cmd.mjs:116` | §2 `:52` |
| 失败文案 2（`evidence` 门） | `thincoder-core/ledger-cmd.mjs:117` | §2 `:52` |
| 工具描述 | `thincoder-core/ledger-cmd.mjs:222` 全串等值 | §2 `:53` |

**决策透明表**

| # | 决策 / 判断 | 依据 |
|---|---|---|
| 1 | 旧文案 `勾销仅限待核销（现态 <X>）` 由 `核销仅限 待讨论 / 待设计 / 待核销（现态 <X>）` **取代**（非并列） | §2 `:52`「既有两条文案零改」= 目标集判 + 行 N 不存在；源态判文案 = 新列（`LEDGER.md:115` 同款） |
| 2 | `evidence` 门判据 = `row.evidence == null \|\| String(row.evidence).trim() === ""` | §2 `:51` 门条件 + D2（`null` / 空串 / 全空白 ⇒ 拒） |
| 3 | 源态判谓词 = `!["待讨论","待设计","待核销"].includes(row.status)`；UPDATE / 事务包裹 / executor 表达式**逐字零改**（仅函数 docstring 与行内注释措辞更新——零行为） | §2 `:51` `:54`（D3）+ `LEDGER.md` §3.1④ |
| 4 | `:229` `status` 参数描述（`目标态（勾销 / 撤回）`）**未扩**——不在设计逐字射程内（评审 🔵 #3）；如判值改由父侧单点落 | 边界「文案 / 描述零自创」 |
| 5 | 同因扫描「零命中」读数成立（见下） | §2 `:166` |

**同因扫描（#7）读数**（as-of 2026-09-25 · 落地后）
- 候选面 `thincoder-core/tool-docs/**`：**24 档 · 无 ledger 档 · 族句（`ledger|待核销|核销|现态`）零命中**。
- 全仓「只认现态 / 仅限 待核销 / accepts only the current state / 核销仅限 / 勾销仅限」族：**活面（`thincoder-core/` 源与双面提示词 · `tool-docs/` · 设计 / 需求档）零残留**；余命中四类且均非收正面 ⇒ **不回改**：① `.thincoder/tmp/**`（git-ignored 生成副本：`core-pkg` / `core-probe` / `enge-160/*.before.md` / `lc-mydiff.txt`）② 冻结批档（`2026-09-17-engine-mode-v2-specs.md` / `2026-09-19-ledger-lifecycle.md`）③ `docs/core/design/_archive/**` ④ 记载本批收正的描述句（`LEDGER.md:115` · `design/PROMPT-SYSTEM.md:248` · `requirements/PROMPT-SYSTEM.md:53`）。

**机器读数**（本席实跑）
- `cd thincoder-core && node --test test/ledger-close.test.mjs` → **4/4 pass**。
- `cd thincoder-core && npm test` → **679 pass / 0 fail**（含新档；≈37.8s）。
- `cd thincoder-cli && node --test test/prompt-refs-zero.test.mjs test/prompts-dual-source.test.mjs` → **13/13 pass**。
- `node scripts/doc-check.mjs` → 悬空 **4** / 行宽 **18**（= 基线，零新增）。
- 六处落字宽度：CN 新句 136 / L1 149 · EN 新句 344 / L2 308 字符（合设计预读数）；EN 面不在 doc-check 域。

**审计与代码评审轮次与终态**
- 偏差审计（explore · 只读）：SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST **零发现**；唯一 PARTIAL = §5 未落（本条即其落点）⇒ 已消解。
- 代码评审（advisor · code · 轮次 1）：🔴 × 0 · 🟡 × 1（§5 协调项——本条落定即消解）· 🔵 × 2（新档实测 153 行 ≠ 设计预估 ~80–110——已记上行数；`:229` 参数描述未扩——决策表 #4 判不落）· **VERDICT: pass**。
- fix round：no must-fix ⇒ **0 轮返工**（终态 clean）。

**§5 追加（2026-09-25 · fix 轮 L5——评审遗留 🔵 父侧判值改 · 依据 = §4 补充块）**

**改动（点修 1 条 · 零行为 · 纯描述字符串）**

| 项 | file:line | 旧 → 新（逐字） |
|---|---|---|
| `ledger_close` 的 `status` 参数描述 | `thincoder-core/ledger-cmd.mjs:229` | `目标态（勾销 / 撤回）` → `目标态（勾销 / 追认核销 / 撤回）` |

- 对齐依据：主体描述（同档 `:222`）已含「追认核销：待讨论 / 待设计 → 已核销」两路——参数描述收正后与 #332 语义（勾销 / 追认核销 / 撤回 三路）同式。
- 零触面：判据逻辑 / 失败文案 / enum 集 / 其余参数 / 测试——均零改（仅该单行描述）。

**机器读数（本席实跑 · as-of 2026-09-25）**
- `cd thincoder-core && node --test test/ledger-close.test.mjs` → **4/4 pass**（T33–T36）。
- `cd thincoder-core && npm test` → **679 pass / 0 fail**（≈36.1s）。
- `node scripts/doc-check.mjs` → 悬空 **4** / 行宽 **18**（= 基线，零新增）。
- 旧串残留实扫（`勾销 / 撤回`）：仅 `.thincoder/tmp/**`（git-ignored 生成副本 `core-pkg` / `core-probe`）与批档记载行（记录面）——不回改（承 §5 同因扫描口径）。

**决策透明表**

| # | 决策 / 判断 | 依据 |
|---|---|---|
| 1 | 三路列法用词 = 主体描述原词（勾销 / 追认核销 / 撤回），零新术语 | §4 补充块逐字 + 同档 `:222` 同词面 |
| 2 | 生成副本（`.thincoder/tmp/**`）与批档记载行零触碰 | 承 §5 同因扫描口径（git-ignored 生成物 / 记录面） |

**审计与代码评审轮次与终态（fix 轮 L5）**
- 偏差审计（explore · 只读 · 阻塞式）：四类（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**零发现** ⇒ 终态 **clean**。限制（如实登记）：该席无 bash/execute ⇒ 验收 ②③ 的机器读数仅结构性核验、未自跑复现。登记项：A1（`:197` `ledger_update` 描述——父侧已裁边界外，不改）· A2（`TOOLS.md:786` 坐标漂移——§4 已裁 out-of-scope）· A3（§5 初始块 `:77` 行名未实读——unverified，非 L5 域）。
- 代码评审（advisor · code · 同步）：🔴 × 0 · 🟡 × 0（无 must-fix）· 🔵 × 3 · **VERDICT: pass**。

**响应表（评审发现 → 处置）**

| # | 评审发现 | 处置 | 理由 |
|---|---|---|---|
| 1 | 🔵 L5 落位正确（记录读数） | 无需动作 | 记录面事实，与 §5 追加块一致 |
| 2 | 🔵 描述括注按「路径」列（勾销 / 追认核销 / 撤回）· `enum` 按「目标态」列（已核销 / 已废弃）——两轴不同 | 保持现文 | 文本权威 = 父侧裁定（§4 补充块逐字）；体例与同档 `:222` 同款——不自创改写 |
| 3 | 🔵 §5 决策表 #4「`:229` … **未扩**」行已被本追加块实际取代 | 免回改（承接） | append-only 六段形态：历史行不复写；本追加块即该行的显式后续 |

- fix round：无 must-fix ⇒ **0 轮返工**（终态 clean）。

## §6 验证与收口（父代理）

**验证与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#71`（initial · `ledgerClose` 判序 + `evidence` 门 + 两失败文案 + 工具描述 + 双面提示词六处 + T33–T36 新档 + 同因扫描）→ 评审遗留 L5 值改 = `#72`（fix · `:229` 标签三路）。两轮内部审计 + 代码评审 **pass**（0🔴；L5 轮 🔵3 = 信息项）；**0 轮返工**。
- **本席抽验（读盘实读）**：`ledger-cmd.mjs:229` = 「目标态（勾销 / 追认核销 / 撤回）」✓；双面提示词六处落位——CN `:77` 新句 / `:143` L1（核销两源）/ `:144` L3（D7 括注已删）；EN `:78` / `:145` L2 / `:146` L4 ✓（逐字等值）。
- 读数：core **679/679** · 定向 ledger-close **4/4** · cli **863/863** · vsc **997/997** · prompt 双档 13/13 · doc-check **悬空 4 / 行宽 18 = 基线零新增**。
- **同因扫描（#7）**：`thincoder-core/tool-docs/**` 24 档零命中；全仓族句余命中四类（`.thincoder/tmp` 生成副本 / 冻结批档 / `_archive` / 本批收正描述句）——记录面不回改，读数在 §5。
- 披露（认可）：`ledger-cmd.mjs` docstring / 注释两处措辞收正（零行为）；`TOOLS.md:786` 坐标漂移（非本批所致）→ 另册（台账）；他批 persona 头句改写 = 并发会话面零触碰。

**收口**：§1 置「已收口」· 记录冻结；台账 #332 / #376 → 待核销 → 已核销；designToken 消费（链终止）。
