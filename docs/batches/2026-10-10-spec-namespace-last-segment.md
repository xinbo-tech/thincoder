# 2026-10-10 · spec-namespace-last-segment
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 02:56/03:01/03:05——测试服务器 GLM-5.3 形 spec 查表误报（命名空间取末段）。
> 台账 = #1167（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源（用户逐字）**：02:56「thincoder匹配model_spec的时候应该忽略大小写。」+ 03:01「thincoder使用测试服务器提供的GLM-5.3系列的几个模型时会报model_spec没找到。」+ 03:05「只取最后一段就可以。」（修法裁定——取代主 agent 初报的「逐段迭代」形）。

**症状与复现（父侧实跑 · 2026-10-10 03:0x）**：测试服务器（ECS 10.0.0.5）清单内 `qwen/ZHIPU/GLM-5.3` ∥ `qwen/ZHIPU/GLM-5.3-FlashX` 两名 ⇒ `specMatch` = `matched:false` ⇒ 告警 + `DEFAULT_SPEC`（128K/32K）；抽测对照（裸名 `glm-5.3-flash` ∥ 单段 `ZHIPU/GLM-5.3` / `qwen/qwen3.7-max` / `deepseek/deepseek-flash`）全命中。

**根因**：`thincoder-core/model-specs.mjs` `lookupSpec`（`:262-276`）命名空间兜底 = **单跳**（`:268-274`：完整名未命中且含 `/` ⇒ 只剥**首个**段、重试一次）——服务端外标 = `provider/上游名` 且上游名自身含厂商前缀（`ZHIPU/GLM-5.3`）⇒ 双段，单跳后得 `zhipu/glm-5.3` 仍无行命中。

**大小写口径澄清（实跑钉证）**：查表双侧现行已 `.toLowerCase()`（`:263-265`）——`Qwen/ZHIPU/GLM-5.3` 与全小写同判（均未命中）⇒ 大小写非本障成因；不敏感口径保留，并要求不随本次改动回归。

**修法（用户裁）**：`lookupSpec` 兜底改**取末段**——完整名未命中且含 `/` ⇒ 取**最后一个** `/` 之后的段重试前缀匹配（`qwen/ZHIPU/GLM-5.3` ⇒ `glm-5.3` 命中）；单段名两法等价（零回归）；告警与 `DEFAULT_SPEC` 回落语义零变。

**射程**：`thincoder-core/model-specs.mjs`（`lookupSpec` 兜底支 + 档头/函数注 `:248-249` 机制句）∥ 设计档 `docs/core/design/MODEL-SPECS.md`（机制句 + 变更记录）∥ 批内件（R22 五条锚）。**设计轮待裁**：VSC 端差表 `thincoder-vscode/src/specs.mjs:55-57` 同形单跳兜底是否随正（同机制第二载体——建议同判；如否须写明差异理由并归登记）。

**边界（不做）**：不改规格表行值 ∥ 不改 `SORTED_SPECS` 排序 ∥ 不改告警文案与回落语义 ∥ 不动服务器侧外标形 ∥ 不引入别名映射表。

**判据指针对**：需求档 `docs/core/requirements/PROVIDER.md` §4.6（R22 ①–⑤）——本批验收 = 该行判定句。

**台账**：#1167（core · 快车道）。

**父裁（2026-10-10 03:2x · 承 #44 设计轮上抛）**：VSC 端差表（`thincoder-vscode/src/specs.mjs:55-57`）＝ **同判随正**（多实现面默认消除端差——同机制第二载体；用户机制裁定「取末段」适用于各载体）。需求档 §4.6 边界句已随正（父侧笔）。第三载体（server 快照 `thincoder-server/public/model-specs-snapshot.mjs:97` `specForDisplay`——手工同步快照，同单跳）＝ **本批零触**（「不动服务器侧」边界内），归批登记 = 台账 **#1169**。机制句实住 `docs/core/design/PROVIDER.md:171`（非 MODEL-SPECS.md）——设计档随正按设计轮实读为准。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮（eng-designer · 2026-10-10）**

**本批条目（覆盖 · 真源 = 需求档 `docs/core/requirements/PROVIDER.md` §4.6）：**

- R22 ① 双段外标 `qwen/ZHIPU/GLM-5.3` 查表命中 `glm-5.3` 行（不再 `DEFAULT_SPEC` 误报）；
- R22 ② `qwen/ZHIPU/GLM-5.3-FlashX` 命中 `glm-5.3-flashx` 行；
- R22 ③ 大小写变体（`Qwen/`）与 ① 同判；
- R22 ④ 既有命中面零回归（单段 `ZHIPU/GLM-5.3` · 裸名 · 既有对照）；
- R22 ⑤ 未知双段名仍兜底（`matched:false` + `DEFAULT_SPEC` + 告警一次）；
- R22 同判（VSC 载体 · 主 agent 2026-10-10 03:1x 裁定「同判随正」）：`thincoder-vscode/src/specs.mjs` 端差表同形收正（需求档边界句已同拍收正）；
- N13 形态不变（纯函数；完整名直扫 + 末段重试一次——不得逐段迭代）；
- N14 过匹配防回归（未知名仍兜底 + 既有命中面逐一回归）。

**本批不做（显式）：**

- 不改规格表行值 / `SORTED_SPECS` 排序 / 告警文案 / 回落语义 / 大小写口径（零改面）；
- 不引入别名映射表；不引入「逐段迭代」循环（用户 03:05 裁定 = 只取末段）；
- 不动服务器侧（外标形 `provider/model` 不变）。**发现项（披露 · 本批零触）**：`thincoder-server/public/model-specs-snapshot.mjs:97`（`specForDisplay`）= 同形第三载体（手工同步快照 · `indexOf` 单跳）——已由主 agent 登记归批（台账 #1169）。

**设计落点：**

- `docs/core/design/MODEL-SPECS.md` **§17**（方案与理由 / 机制改法逐字 / 影响文件清单 / R22 回指 / 待裁项结论 / 用例表 U-1..U-9 + `[vsc]` V-1..V-3 / 边界与披露 / UI 决策）；
- `docs/core/design/PROVIDER.md` §6.9 `:171` 机制句随正（承 §17；+ 变更记录 1 行）；`MODEL-SPECS.md` 变更记录 1 行。

**机制改法（摘要 · 逐字目标形见 `doc:MODEL-SPECS.md:§17.2`）：**

- 核：`thincoder-core/model-specs.mjs:268` `m.indexOf("/")` ⇒ `m.lastIndexOf("/")`（守卫 `slash > 0` 保持）——完整名未命中且含 `/` 时取**最后一个** `/` 之后的段重试前缀扫描一次；
- VSC：`thincoder-vscode/src/specs.mjs:56` 同 token 换位（守卫 `slash >= 0` = 该端现行形，保持）+ 注两处（`:20` / `:55`）改述「按末段重试」。

**受影响文件与测试面：**

- 产品码 2 档：`thincoder-core/model-specs.mjs`（357 行 · ±0）· `thincoder-vscode/src/specs.mjs`（100 行 · ±0）；
- 测试面：`docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs`（拟新增 · 批内件 · 12 用例 = U-1..U-9 + V-1..V-3；复跑 = 仓根 `node --test docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs`；形态循 2026-10-09 purge-vsc 批内件）；
- 设计档 3 面：`MODEL-SPECS.md` §17 · `PROVIDER.md` §6.9 · 本档；文档机检 = 仓根 `node scripts/doc-check.mjs`。

**验收对照**：R22 ①–⑤ 与 N13 / N14 逐条 → `doc:MODEL-SPECS.md:§17.4` 回指表（与需求档 §4.6、本段三分同源）；判定方式（机器核）= §17.4 第三列（含 VSC 同判锚）。

**关键决策：**

- KD-1 兜底「只取末段」（用户 2026-10-10 03:05 裁）——否决「逐段迭代」（扫描次数无界 · 违 N13 热路径形态；用例 U-6 钉）；
- KD-2 VSC 端差表同判随正（主 agent 03:1x 裁定）——多实现面纪律默认消除端差；同机制第二载体，跨端差异 = 同一缺陷；
- KD-3 服务器快照第三载体现状零触 + 归登记（#1169）——「不动服务器侧」边界内。

**上抛/披露**：无待裁项（VSC 项已裁结）；披露 = 第三载体（上行登记）+ 设计轮期间的文档机检读数（随交付报告）。

**设计评审轮 1 修正（fix 轮 · eng-designer · 2026-10-10）**

承 §3 轮次 1（发现表 🔴1 / 🟡1 / 🔵5 = 7 条；父侧裁定「采纳」）。逐号落位（号 → 改动 `file:line`，坐标 = 终形）：

- ①（🔴 U-7）`docs/core/design/MODEL-SPECS.md:1970`——期望改钉**真实读数**（用户 2026-10-10 03:28 口径 · 最简式）：`glm-5.3/` 直扫即中（`"glm-5.3/".startsWith("glm-5.3")`；在册行 `thincoder-core/model-specs.mjs:69`）⇒ `matched === true` ∧ spec = `glm-5.3` 行（context 1_000_000 / maxOutput 128_000）；「兜底支不可达」一行注。输入形不动；「尾斜杠 ⇒ 末段空串」支不写用例（对现实输入不可达）。实跑复核在案（`glm-5.3/` ⇒ `matched:true` ∧ spec = `glm-5.3` 行——设计轮 + 本 fix 轮两读）。
- ②（🟡 登记指针）`docs/core/design/MODEL-SPECS.md:1934`——拆分计划改指本档 §13.6「行数处置」段（拆点 / 落点 / 消解窗口住彼）；「已登记」时态收正：机检登记面（`SOFT_LINE_REGISTRY`）已随 2026-09-28 测试树全清退场（档不在盘）、`docs/core/design/CORE-UNIFICATION.md` §2.8.1 子表空壳（已随 2026-10-08 批清账）。
- ③（🔵 ±0 低于实笔）两行改净 **+1**——`MODEL-SPECS.md:1934`（`thincoder-core/model-specs.mjs`：档头注 7 行 ⇒ 8 行）∥ `:1937`（`docs/core/design/PROVIDER.md`：机制句 1 行改述 ±0 + 变更记录 1 行新增 = 704 ⇒ 705）。KD-4 复算（内容行数 · 文末换行不计）：现读 357 ∥ 705——与两行口径一致。
- ④（🔵 批档读数滞）`MODEL-SPECS.md:1939`——批档行去读数（现状列改 `—（纯 `.md` 免档位判定）`；先例 = `docs/core/design/CORE-UNIFICATION.md:1034-1035`）。
- ⑤（🔵 残余端差）`MODEL-SPECS.md` §17.2 `:1928` / §17.7 `:1980` 补注——守卫核 `slash > 0` ∥ VSC `slash >= 0`（首位斜杠形 `/glm-5.3`：核 miss ∥ VSC 命中 `glm-5` 默档 = `reasoningEffortDefault: "max"`——VSC 实跑复核在案）= 既有端差、本批不动显式认账（需求档 §4.6 同记）。
- ⑥（🔵 需求档措辞）**父侧笔 · 已落**——`docs/core/requirements/PROVIDER.md:160-161` 实读在案（VSC 句出「不做」清单独立成句 + 「同判（守卫 = 既有端差）」）；本段零触。
- ⑦（🔵 U-6 标签）`MODEL-SPECS.md` §17.1 `:1896` / §17.4 `:1950` 补半句——U-6 名类（≥2 斜杠 ∧ 倒数第二段为在册前缀）= 认账的行为变更（旧形命中 ⇒ 新形不命中），不在「零回归」口径内。

**设计档附笔**：`docs/core/design/MODEL-SPECS.md` 变更记录 +1 行（fix 轮条 `:2199`）。
**机检（fix 轮实跑）**：`node scripts/doc-check.mjs`（仓根）⇒ 锚 0 悬空 / 行宽 0 / 行数面差异 0 / **EXIT 0**（`$LASTEXITCODE` 实读）。
**零新语义**（全部为 §3 发现表的直接导出项）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（轮 1）· 发现表（计数 = 🔴1 · 🟡1 · 🔵5 = 7 条）**

| # | 类别 | 严重度 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 验收标准 | 🔴 | §17.6 U-7（`MODEL-SPECS.md:1968`）期望「`glm-5.3/` ⇒ `matched === false`」与查表本体相抵：完整名直扫为纯前缀匹配（`thincoder-core/model-specs.mjs:264-265`），而 `glm-5.3` 在册行（`thincoder-core/model-specs.mjs:69`）即命中「glm-5.3/」⇒ `specMatch("glm-5.3/")` = `{ matched: true, spec: glm-5.3 行 }`（批前 ∥ 批后同值）；「尾斜杠 ⇒ 末段为空串」的兜底支对本案不可达（直扫已返）。按 §17.6 逐字落测试 = 批内件出红用例（该行亦自相抵：既称「兜底语义零变」又断言只有兜底可达的结果）。 | 改输入为直扫不中的形（如 `glm-9.9/`）以真测兜底空段支，或把期望改钉实况（`matched === true` ∧ spec = `glm-5.3` 行 ∧ 零告警）。 |
| 2 | 文档归属 / 跨档滞留 | 🟡 | §17.3（`MODEL-SPECS.md:1932`）注「**>300 已登记**（拆分计划 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1）」指向的落点已不载该项：§2.8.1「在册超软线档拆分计划」子表现为空壳（`CORE-UNIFICATION.md:1108-1111` 仅表头），`CORE-UNIFICATION.md:1085` 自记「主表 15 行 + 子表空壳 + 次优先列表已随 2026-10-08 批清账」；机检登记面（`SOFT_LINE_REGISTRY`，`thincoder-core/test/core-hygiene.test.mjs`）亦随 2026-09-28 测试树全清退场（`thincoder-core/test/` 现仅 `run.mjs` / `slow.mjs`）——同档既有行（如 §16.7）均带「档不在盘」注，本行未带。 | 拆分计划改指本档 §13.6「行数处置」段（拆点 / 落点 / 消解窗口住彼）∥ 补同款「已随测试树全清退场」时态注，使「已登记」可核。 |
| 3 | 受影响档行数标注 | 🔵 | 两行「±0」低于实笔：① `thincoder-core/model-specs.mjs` 标「±0（注释改述 + 1 token）」，而 §17.2 目标档头注（`MODEL-SPECS.md:1916-1923`）为 8 行 vs 现文 7 行（`thincoder-core/model-specs.mjs:245-251`）⇒ 净 +1 行；② `docs/core/design/PROVIDER.md` 标「±0（机制句 1 行改述 + 变更记录 1 行）」，而变更记录行为新增（现文 `docs/core/design/PROVIDER.md:705`）⇒ 净 +1 行（现状 704 + 1 = 705 与实读一致）。 | 两行改记 ±1（或区间形）；两项均不触发档位判定（≤500）。 |
| 4 | 受影响档行数标注 | 🔵 | §17.3（`MODEL-SPECS.md:1937`）给批档 `docs/batches/2026-10-10-spec-namespace-last-segment.md` 记「现状 **35**」，该档实读 81 行（§2 段晚于读数落笔）。 | 该行标 as-of，或按「纯 `.md` 免档位判定」之例去掉读数。 |
| 5 | 清晰度 / 边界口径 | 🔵 | 守卫口径与 R22 字面「含 `/`」有差、且两端守卫不同形：核保持 `slash > 0`（`thincoder-core/model-specs.mjs:269`）⇒ 首位斜杠名（`/glm-5.3`）不走兜底（U-8 已钉）；VSC 保持 `slash >= 0`（`thincoder-vscode/src/specs.mjs:57`）⇒ 同形名该端命中 `glm-5` 端差默认档——即需求档 §4.6:160「与核同形」在首位斜杠形上不成立。 | §17.2 / §17.7 显式记该残余端差（首位斜杠形），或把载体句写成「同判（守卫 = 既有端差、本批不动）」。 |
| 6 | 清晰度（需求档措辞） | 🔵 | 需求档 §4.6:160 把在册交付项放进「**范围边界（不做）**」句内（… ∥ `不引入别名映射表` ∥ **VSC 端差表同判随正**…），「不做」清单同时宣告「要做」项。 | 该 VSC 句移出边界清单（并入 R22 行或独立句）。 |
| 7 | 验收标准（行为标签） | 🔵 | §17.6 U-6（`MODEL-SPECS.md:1967`）标为「逐段迭代形负控」，其实为**行为翻转**：现形单跳取「glm-5.3/zzz」为裸段候选，前缀命中 `glm-5.3` 在册行（`thincoder-core/model-specs.mjs:264-265` + `:69`）⇒ 批前 `matched === true`，目标形只扫末段 `zzz` ⇒ `false`；§17.1「零回归」与 §17.4 R22-④ 均未点该类（≥2 斜杠且倒数第二段为在册前缀）。 | 在 §17.1 / §17.4 明记该名类为认账的行为变更（或声明该类不在「零回归」口径内）。 |

**已核实的正向项（同一实读）**：机制改法逐字与现文一致（`thincoder-core/model-specs.mjs:262-276` / `:245-251` / `:268-269`；`thincoder-vscode/src/specs.mjs:20` / `:55-57`）· R22-①/② 期望值（`glm-5.3` 行 `:69` context 1_000_000 / maxOutput 128_000；`glm-5.3-flashx` 行 `:81` 1_000_000 / 131_072）· `DEFAULT_SPEC` `:243`（128_000 / 32_000）· 大小写口径 `:263` / `:265` / `:272` · U-1..U-6 / U-8 / U-9 与 V-1..V-3 其余各条期望值 · 受影响档清单齐备（两产品码 + 批内件 + 三 `.md`）· 第三载体披露（`thincoder-server/public/model-specs-snapshot.mjs:91` / `:97`）属实。

**VERDICT: changes-required**（🔴1 未决——U-7 期望值与查表本体相抵，逐字落盘即出红用例）

### 轮次 2（评审子代理）

**设计评审（轮 2 · fix 轮复核）· 发现表（逐号验证 §3 轮次 1 之 🔴1 / 🟡1 / 🔵5 = 7 条）**

复核面 = fix 轮落笔后本轮实读：`docs/core/design/MODEL-SPECS.md` · `docs/core/requirements/PROVIDER.md` · `docs/core/design/PROVIDER.md`（+ 旁证 `thincoder-core/model-specs.mjs` · `thincoder-vscode/src/specs.mjs` · `CORE-UNIFICATION.md` §2.8.1）。

| # | 原# | 文件 | 严重度 | 状态 | 证据/备注（本轮实读） |
|---|---|---|---|---|---|
| 1 | 1 | docs/core/design/MODEL-SPECS.md | 🔴 | Fixed | U-7 期望改钉实况（轮 1 建议第二径）：`matched === true` ∧ spec = `glm-5.3` 行（context 1_000_000 · maxOutput 128_000）——直扫即中；兜底支不可达声明成立；旁证 = `thincoder-core/model-specs.mjs:265` 直扫行 + `:69` 在册行。 |
| 2 | 2 | docs/core/design/MODEL-SPECS.md | 🟡 | Fixed | §17.3 拆分计划改指本档 §13.6「行数处置」段（附「档不在盘」+ §2.8.1 子表空壳时态注）；§13.6 实读在案、`thincoder-core/test/` 现仅 run/slow、`CORE-UNIFICATION.md:1085`「子表空壳」实读在案。 |
| 3 | 3 | docs/core/design/MODEL-SPECS.md | 🔵 | Fixed | 两行「±0」⇒ 净 +1：model-specs.mjs 行（档头注 7⇒8 行）∥ design/PROVIDER.md 行（704⇒705；现读 705，末行 = 本批变更记录）。 |
| 4 | 4 | docs/core/design/MODEL-SPECS.md | 🔵 | Fixed | 批档行读数「35」删除 ⇒「—（纯 `.md` 免档位判定）」。 |
| 5 | 5 | docs/core/design/MODEL-SPECS.md | 🔵 | Fixed | §17.2 + §17.7 补守卫端差注（核 `slash > 0` ∥ VSC `slash >= 0`；`/glm-5.3`：核 miss ∥ VSC 命中 `glm-5` 默档）；需求档 §4.6:161 同拍记。 |
| 6 | 6 | docs/core/requirements/PROVIDER.md | 🔵 | Fixed | VSC 句出「不做」清单（:160）独立成句（:161「VSC 同判随正（在册交付面）」+ 守卫端差认账）——父侧笔，已读回。 |
| 7 | 7 | docs/core/design/MODEL-SPECS.md | 🔵 | Fixed | §17.1 + §17.4 R22-④ 补 U-6 名类 = 认账的行为变更（≥2 斜杠 ∧ 倒数第二段为在册前缀；不在「零回归」口径内）。 |

**本轮实读锚（引文）**：`docs/core/design/MODEL-SPECS.md:1970: | U-7 | 边界 | \`glm-5.3/\`（尾斜杠形） | \`matched === true\` ∧ spec = \`glm-5.3\` 行（context 1_000_000 · maxOutput 128_000）——直扫即中（\`"glm-5.3/".startsWith("glm-5.3")\`；在册行 \`thincoder-core/model-specs.mjs:69\`）；兜底支不可达 |` · `docs/core/design/MODEL-SPECS.md:1934: 现读落点 = 本档 §13.6「行数处置」段（拆点 / 落点 / 消解窗口住彼）` · `docs/core/design/MODEL-SPECS.md:1937: **+1**（机制句 1 行改述 ±0 + 变更记录 1 行新增——704 ⇒ 705）` · `docs/core/design/MODEL-SPECS.md:1939: —（纯 \`.md\` 免档位判定）` · `docs/core/design/MODEL-SPECS.md:1928: **守卫端差（既有 · 本批不动 · 认账）**：核 \`slash > 0\` ∥ VSC \`slash >= 0\`` · `docs/core/design/MODEL-SPECS.md:1896: **认账的行为变更 = U-6 名类**（≥2 斜杠 ∧ 倒数第二段为在册前缀ーー旧形取 \`glm-5.3/zzz\` 为裸段候选` · `docs/core/requirements/PROVIDER.md:161: **VSC 同判随正（在册交付面）**：\`thincoder-vscode/src/specs.mjs:55-57\` 单跳 ⇒ 取末段，随本批落（父裁 2026-10-10 03:2x · #44 上抛）` · `docs/core/design/PROVIDER.md:171: **厂商前缀剥离**：完整名未命中且含 \`/\` 时取**最后一个** \`/\` 之后的段再匹配一次`（轮 1 host 注所指项复读在案——机制句随正、VSC 码零触属实施轮面）。

**计数**：轮 1 七条 = **Fixed 7 / Unfixed 0**；本轮新发现 **0**（🔴0 · 🟡0 · 🔵0）；无未决 🔴。
**VERDICT: pass**

## §4 用户批准（主 agent）

**状态行**：✅ 已批准（2026-10-10 · 全链自动授权下代签）

**批准记录（主 agent 代签）**：依据 = 会话级全自动授权（用户 2026-10-10 03:07「全自动」）+ 设计复审轮 2 pass（评审子代理 · 7 条全 Fixed ∥ Unfixed 0 ∥ New 0）+ token 签发；批准面 = §2 设计（`MODEL-SPECS.md` §17 取末段机制）；实施轮已随批完成（§5），批准与实施同窗（代签形沿 2026-10-10 轻通道轮先例）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（三档落盘 · 批内件 12/12 绿 · 审计 CLEAN ∥ 顾问评审 pass · fix round 0）

**实施（2026-10-10 · eng-coder · 承 §2 任务书 / §3 评审（pass）/ 台账 #1167 · 设计档 `docs/core/design/MODEL-SPECS.md` §17.2 逐字）**

**交付摘要（3 档 · 全部落盘；零触面逐项见末段）：**

1. `thincoder-core/model-specs.mjs`：档头注 7 行 ⇒ 设计 §17.2 所载 8 行目标形逐字（`:245-252`）；`lookupSpec` 内联注随目标形改述（`:268`）+ `:269` `m.indexOf("/")` ⇒ `m.lastIndexOf("/")`；守卫 `slash > 0`（`:270`）未动；行数 357 ⇒ **358**（KD-4 口径 `split("\n").length − 1`）。
2. `thincoder-vscode/src/specs.mjs`：`:20` 档头注 ∥ `:55` 行注中「按裸模型段重试」句 ⇒ 「按末段重试（链式网关可叠多段）」（设计原句逐字）；`:56` 同 token 换位 ⇒ `m.lastIndexOf("/")`；守卫 `slash >= 0` 未动（既有端差 · 认账）；行数 **100**（±0）。
3. 新建批内件 `docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs`（131 行 · 12 例 = §17.6 表 U-1..U-9 + `[vsc]` V-1..V-3 逐条对应；`test(` 计数 = 12）。断言面 = 业务可观察结果（`matched` / spec 字段值 / `reasoningEffortDefault`）；「命中行 = 哪一行」以同名裸名直扫（单段、无兜底）命中行的对象同一性为对照。

**读数（实跑 · 全部现读）：**

- `node --test docs/batches/2026-10-10-spec-namespace-last-segment.test.mjs`（仓根）⇒ **12/12 绿**（`# tests 12 / # pass 12 / # fail 0`）。
- `node --check` 三档（核产品码 ∥ VSC 产品码 ∥ 批内件）⇒ 全部 Syntax OK。
- `git diff --stat -- thincoder-core/model-specs.mjs thincoder-vscode/src/specs.mjs` ⇒ 核 15 changed（8+/7−，**净 +1**）∥ VSC 6 changed（3+/3−，**净 ±0**）。
- 单行实跑对照（核）：`specMatch("qwen/ZHIPU/GLM-5.3")` 改前 `matched:false`（128000/32000）⇒ 改后 `matched:true`（1000000/128000）；VSC 同形：`reasoningEffortDefault` 改前缺席 ⇒ 改后 `"max"`。
- `git status --short`（射程三档）⇒ 两产品档 `M` + 批内件 `??`（新档未跟踪——随父侧提交）。

**决策透明表：**

| # | 决策 | 依据 |
|---|---|---|
| 1 | 核侧 `:268` 内联注随 §17.2 目标形改述（±0 行）——非「唯一 token 改动」字面所列 | 设计 §17.2 核段 = 「目标形 · 实施轮照此落笔」，代码块含该注释行；「唯一 token 改动」定语只界 token 面；同行改写不影响行数口径 |
| 2 | VSC 两处注释按设计原句逐字嵌入（「按末段重试（链式网关可叠多段）」保原句形） | 设计 §17.2 VSC 段逐字（原句保真优先于行文润色） |
| 3 | 守卫端差（核 `slash > 0` ∥ VSC `slash >= 0`）零触 | §17.2 / §17.7 显式认账 · 本批零改面 |
| 4 | 批内件不写「旧形回归」断言；U-6 名类按新形钉 `false` | §17.1 / §17.4 认账口径（U-6 名类 = 认账的行为变更，不在零回归口径内） |
| 5 | 测试断言用「表行对象同一性」对照（同名裸名直扫） | 表行无 `name` 字段；同一性 = 可观察的「命中哪一行」判定，值断言（context / maxOutput）并行保留 |

**审计与代码评审轮次与终态：`clean`**

- 内部差异审计（只读 explore · 轮 1）：**CLEAN**（零偏离）——12 例 ↔ §17.6 逐条符合；两档 ↔ §17.2 目标形逐字符合（含内联注独立复核，判「与设计一致」）；行数 358 / 100 与预期一致；单据外改动 0；守卫 ∥ 表体 ∥ 文档面 ∥ 第三载体均零触。
- 内部顾问代码评审（轮 1 · 全量）：**pass**（无 🔴）——🟡1（**非阻断 · 既有面 · 非本批引入**：VSC `effortDefaultFor` 非串输入抛 TypeError，与核 `#638 查表全性` 不同源；建议父侧归批）+ 🔵2（VSC 腿 `node_modules/@thincoder/core` 解析前提注 · VSC 侧 U-6 名类无负控用例——均「可选、非本批偏差」）。
- **fix round = 0**（无待修项；审计与评审均无「须修」结论）。

**零触确认（本批零改面 · 逐项）：**表行值 ∥ `SORTED_SPECS` 排序 ∥ 告警文案（`warnUnknownModel`）∥ 回落语义（`DEFAULT_SPEC` · `specMatch` 返回形状）∥ 大小写口径 ∥ `EFFORT_DEFAULT_PREFIXES` 表体 ∥ 守卫取值（两端）∥ 文档面（§17 · 需求档 §4.6 · 设计档 PROVIDER.md）∥ 服务器快照第三载体（`thincoder-server/public/model-specs-snapshot.mjs:97` 仍 `indexOf` 单跳——实读在案）——全部零触。

**上抛（非阻断 · 供父侧收口处置）：**

1. [上抛·知会] 顾问评审 🟡（VSC 非串归一差）：建议登记归批或后续小轮——本批零改（超出 §17.2 逐字改法面）。
2. [上抛·知会] 记录面滞：批档 §2 `:64`「`thincoder-core/model-specs.mjs`（357 行 · ±0）」与设计档 §17.3（**+1**）及实读 358 不一致（§2 = eng-designer 面，本段未触动）；审计另记 §17.3 批内件行估「~45–60」⇒ 实读 131 行。
3. [上抛·知会] 既有断言交叉核：`docs/batches/2026-10-06-models-config.test.mjs:170`（`SNAPSHOT.specForDisplay("zhipu/glm-5.3")`）属射程外第三载体、单跳仍正确 ⇒ 零跨批红用例（实读在案）。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口（2026-10-10 · 主 agent）

**交付核验（父侧 · 内容级）**：
- 读回两落点：`thincoder-core/model-specs.mjs:268-275`（`m.lastIndexOf("/")` + 守卫 `slash > 0` 保持 + 「LAST segment」末段注）∥ `thincoder-vscode/src/specs.mjs:55-57`（同 token + 「按末段重试（链式网关可叠多段）」）——与 §17.2 目标形逐字符合；`git diff --stat` 净 = 核 +1 ∥ VSC ±0（与 §17.3 预测一致）。
- 批内件 12 例在盘（实施轮读数 12/12 绿；`--check` 三档 OK）；单行实跑锚（`qwen/ZHIPU/GLM-5.3`：改前 false ⇒ 改后 true）在案。

**审计与评审**：内部差异审计 CLEAN ∥ 顾问代码评审 pass（🟡1 = 既有面 → 已登记 `#1177`；🔵2 可选）∥ fix round = 0。

**上抛处置**：① VSC `specs.mjs:45` 非串 TypeError → 台账 `#1177`（归批）；② §2:64 读数滞（357·±0）以本节为准（实读 358·+1；批内件实读 131 行）；③ 服务器快照第三载体 = Ⅱ 批 `#1169` 射程（零跨批红）。

**仓套件**：未跑（not repo-suite verified——波尾父侧单跑为唯一跑点）。

**计数**：条目 1/1（`#1167`）全覆；产品档 2 ∥ 批内件 1 ∥ 文档面（§17 ∥ 需求档 §4.6 ∥ 设计档 PROVIDER.md:171）随批已落；台账 `#1167` 已核销。
