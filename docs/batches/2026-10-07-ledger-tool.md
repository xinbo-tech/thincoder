# 2026-10-07 · ledger-tool
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 10:17「两批都应该做。」（= 工具面批组批放行——候选 = #997-6 四项 + 关联扫描并入 #927）。。
> 台账 = #998（core · 归批）。前情 = 无（独立批——同族在飞 = docs/batches/2026-10-07-ledger-merge-scan.md）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-07 10:14–10:17）**

**来源**：用户 10:14 起（治理优化讨论）→ 10:17「两批都应该做」= **工具面批组批放行**（治理面批 = `2026-10-07-ledger-governance.md` 另批）。

**本批条目（工具面 4 项 + 并入 1）**：
1. `close` 可携 evidence（一跳——免「核销后补记」两跳现状）。
2. `query` 按 `trigger` 过滤。
3. 批点火自动写 executor（会话归属——免手写）。
4. 查询面直出「老化」标记（>30 天行龄）。
5. 【并入 #927】design slot 积压清理：批量列表面 + 批量 consume（防复用漏洞；条件「工具面批时清点」命中——本批即此批）。

**关联扫描**：并入 = #927（条件命中）∥ #997-6（本批载体）。不并 = #931（bench 面）∥ #868（签发链可靠性——现象待复测，面不同）∥ #990–#992 族（server 面）∥ #996/治理面批（在飞/另批）。

**落点候选**（设计轮钉）：台账工具面（`thincoder-core`——`ledger-db.mjs` + 工具 schema/描述 + 装配面）+ 槽位面（design-token 族——#927 清点通道）；零新依赖；工具描述改动（若涉）= 四端同拍。

**先例**：#923 台账工具统一入口（工具面批）。
**授权**：用户 10:17 组批放行（设计 → 评审 → 批准 → 落笔——全链在案）。

**§1 补记（评审 #137 结果与裁定 · 2026-10-07 10:4x）**：设计评审 **#137 = pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 7——发现表 = §3 轮次 1；token 已签发）。父侧逐条裁定：**发现 1–9 = 修正**（fix 轮已派——执行人 = eng-designer：① §7.1 契约行随 §13 ∥ ② §11.3 表收正（`trigger` + 前身逐字注）∥ ③ 受影两件补标注 ∥ ④ AC-M2-7 补点火边 ∥ ⑤ 可见面口径明示 ∥ ⑥ `:858` 随正理由改写 ∥ ⑦ 规模读数收一 ∥ ⑧ ledger-cmd 行补 ③ ∥ ⑨ 结算档 §6.2① 到期处置明示）；**发现 10 = 接受现形**（`aged` 双义——§13.4 已界定，不改）。修正轮落地并核验 → §4 代签（三条件齐备）→ 实施轮（13 档：工具面 12 + 新批内件）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（5 条覆盖（四工具项 + #927 并入）∥ #137 修正轮 1 已落（发现 1–9——零新语义；两件批件核讫零改）∥ #998 实施后指针重锚轮已落（消费核迁出随迁——零语义改）；详 §2 补记）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-07）**

### 2.1 本批条目（覆盖）

- **① `close` 携 evidence（一跳核销）**——覆盖。设计 = `docs/core/design/LEDGER.md` §13.1（+ §3.2 字段判据表增行）。
- **② `query` 按 trigger 过滤**——覆盖。设计 = 同档 §13.2。
- **③ executor 点火入边自动写**——覆盖（**现状前提收正**，见 §2.7-1）。设计 = 同档 §13.3（+ §3.1 收正）。
- **④ 查询面 `aged` 逐行标记（>30 天行龄）**——覆盖。设计 = 同档 §13.4（+ §5 指针）。
- **⑤【并入 #927】design slot 批量列表面 + 批量 consume（防复用漏洞）**——覆盖。设计 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10（F-SL1 / F-SL2）。

**不在本批**：`#868`（签发链可靠性——现象待复测，面另论；本批只做清点 + consume 通道）∥ `#931`（bench 面）∥ `#990–#992` 族（server 面）∥ `#996` / 治理面批（在飞 / 另批）∥ 提示词面（零改——动作可发现性经 tool-docs 描述面）。

### 2.2 设计档落点（一份事实一处）

- 台账工具面 = `docs/core/design/LEDGER.md`：新增 **§13**（§13.1–13.8）+ §3.1 / §3.2 / §5 就地收正 + 变更记录 1 行。
- 槽位面 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`：新增 **§10** + §5 指针 + 变更记录 1 行。
- 动作面表随动 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2（七 ⇒ 九 + 两行随动——含存量漏登收正；见 §2.7-3）。

### 2.3 机制设计（一行一句；详文 = 设计档对应节，本段不重述）

- ①：`close` 增可选 `evidence`；事务内 `nextEvidence = evidence ?? 行值`；追认门判**结果值**；判序零变 → LEDGER §13.1。
- ②：`query` 增 `trigger` 等值过滤（三枚举；`NULL` 不过滤——边界在册） → §13.2。
- ③：进边集扩为 {`待讨论 → 待设计`（点火边）, `待设计 → 在途`} 两枚同式写本会话 → §13.3。
- ④：核 `ledgerQuery` 逐行 `aged = 未决四态 ∧ 行龄 > 30d`；`AGING_DAYS` 迁 `ledger-db.mjs` 单源 → §13.4。
- ⑤：新只读 action `design-slots`（槽文件 ∪ 内存并集；列 designId / live|expired / 时龄 / 批——批经 `_advisorRuns.docSetKey` 反查，零新存储）+ `consume-design` 选择器扩展（designId / designIds / expired / olderThanDays **恰一**；单 persist、整体回滚） → 结算档 §10。

### 2.4 受影响文件与测试面（读数 as-of 2026-10-07；Δ = 实施轮以实读为准）

| 文件 | 现行 | 预期 |
|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 252 | ≈258 |
| `thincoder-core/ledger-cmd.mjs` | 133 | ≈150 |
| `thincoder-core/ledger-db.mjs` | 168 | ≈171 |
| `thincoder-core/ledger.mjs` | 194 | ≈194 |
| `thincoder-core/tool-docs/ledger.md` | 6 | ≈8 |
| `thincoder-core/agent-tools/design-slots.mjs` | 新 | ≈90–120 |
| `thincoder-core/agent-tools/subagent.mjs` | 402 | ≈415 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 439 | ≈455（单面委托——拆面因 500 硬限） |
| `thincoder-core/agent/dispatch-gates.mjs` | 141 | ≈143 |
| `thincoder-core/agent/family-tools.mjs`（子面拒文清单） | 188 | ≈188 |
| `thincoder-core/tool-docs/subagent.md` | 41 | ≈44 |
| `thincoder-vscode/src/agent/tool-table.mjs` | 188 | ≈190 |
| 批内件 `docs/batches/2026-10-07-ledger-tool.test.mjs` | 新 | ≈200–260 |

- 批内件（工具层单测口径——随批归档、不进仓套件）：U-LT1–U-LT10 + U-SL1–U-SL9；复跑 = 仓根 `node --test docs/batches/2026-10-07-ledger-tool.test.mjs`。
- 受影批件随正（先例 = 批件随正）：`docs/batches/2026-09-29-tools-carryover-15.test.mjs`（subagent schema pin 含 action enum）∥ `docs/batches/2026-10-05-ledger-unification.test.mjs`（P2 参数清单文案）。
- 需求档 = 主 agent 笔（§2.7-2）；API-CONTRACT 生成区重跑 = 实施轮（§2.7-4）。

### 2.5 验收对照（三链同源）

| 批条目 | 判据 | 用例 |
|---|---|---|
| ① | A-LT1：一跳核销成立 ∧ 追认门零松 ∧ 向后兼容 | U-LT1–4 |
| ② | A-LT2：trigger 过滤成立 ∧ 非法值拒 ∧ 缺省不过滤 | U-LT5–6 |
| ③ | A-LT3：点火入边落 executor ∧ 既有进出边语义零变 | U-LT7–8 |
| ④ | A-LT4：`aged` 判真/判假全拍 ∧ 导出面零涉 | U-LT9–10 |
| ⑤ | A-SL：清点全列/批列派生/批量恰一/原子回滚/零复活/多槽隔离/门外拒（结算档 §10 用例面） | U-SL1–9 |
| 全批 | A-LT5 禁止面自检（六态/迁移表/写门/DDL/装配/命令行面零改 + 批内件全绿 + doc-check 绿） ∧ A-LT6 描述面单点 | — |

（判据全文 = 设计档 LEDGER §13.6 / 结算档 §10；需求侧编号候补 AC-M2-21…24 = §2.7-2。）

### 2.6 关键决策（详 = 设计档）

KD-LT1 点火边扩面（否决：只保单边 ∥ 改提示词改道）∥ KD-LT2 `close` 证据判结果值 ∥ KD-LT3 `aged` 住核 + 常量单源 ∥ KD-LT4 `trigger` 仅三枚举 ∥ KD-SL1 新只读 action ∥ KD-SL2 批列零新存储（docSetKey 反查）∥ KD-SL3 选择器恰一 fail-closed ∥ KD-SL4 单 persist / 整体回滚。

### 2.7 上抛项（非本席写域 / 需主 agent 处置）

1. **③ 现状前提与任务书不符（已按可行面落地，留痕）**：任务书「executor 手写」不实——F-LX1（2026-09-21）自动写**已在位**，但只覆盖 `待设计 → 在途` 单枚入边；实操点火 = 推「待设计」（行在飞行期 executor 恒 `null`——本仓 #992 等实读，#985–#987 在途步皆收口走账才落）⇒ 设计按「**扩点火入边**」落地（KD-LT1）。若本意是「让批行改骑『在途』」（实操 / 提示词面改道）= 另面另议。
2. **需求档面（主 agent 笔）**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` 补 §行 + AC-M2-21…24（20 已占用——连避）；`docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md` F-D6 邻位补 F-SL 行；`docs/cli/requirements/FEATURES.md:81` 动作清单补 `design-slots`。
3. **§6.7.2 存量漂移已就地收正（一致性面，逐条报告）**：`consume-design` 自 2026-09-07 上线未入动作表（节标题「七动作」vs 现盘八动作）——本批随动收正为九动作 + 两行（consume-design / design-slots），语义单源仍 = 结算档（本档不重述）。
4. **实施侧面随动**：`docs/core/design/API-CONTRACT.md` 生成区重跑（`scripts/api-contract.mjs --write`）；`scripts/tool-schema-size.mjs` 读数随动（若引）。
5. **禁止面自检（设计面已核）**：签发链行为零改（mint / settle / TTL / persist 存储形）∥ 零新依赖 ∥ 六态 / 迁移表 / DDL / 写门 / 装配面零改 ∥ #996 / 治理面批 / 提示词面零触 ∥ 四 + 一项外零增。

**§2 补记（设计评审 #137 修正轮 1 · 发现 1–9 逐号落地 · 2026-10-07 · eng-designer）**

修正面 = `docs/core/design/LEDGER.md`（§7.1 / §8 / §11.3 / §13.3 / §13.5 + 变更记录 1 行）∥ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（§6.2 ① + 变更记录 1 行）；其余档零触（产品码 / 提示词档 / `PROMPT-SYSTEM.md` 零笔）。**机制 / 参数语义零变**（仅文档面收正）；**发现 10 = 接受现形**（`aged` 双义——§13.4 已界定，不改）。

**逐号落地（号 → 改动 file:line——行号 = 修正后实读）**：
1. §7.1 两契约行随 §13 收正——`LEDGER.md:292`（`ledgerQuery` 签名 + `trigger` / `now` / 行集 `aged` 注）∥ `:296`（`ledgerClose` 签名 + 可选 `evidence` 注）。
2. §11.3——`LEDGER.md:585`（query 枚举字段补 `trigger`）∥ `:575` 新增「本批新增字段注」（close / query 声明 = 前身逐字 + 本批新增参（`evidence` ∥ `trigger`——皆可选）；§3.2 单源不动）。
3. 受影两件入 §13.5 表——`LEDGER.md:861`（unification：232 · ±0 核讫零改）∥ `:862`（carryover-15：262 · ±0 不编辑）；`§2.4` :78「受影批件随正」句按本补记读。
4. AC-M2-7 补点火边子句——`LEDGER.md:379`（正文 + 回指列）。
5. §13.3 可见面口径句——`LEDGER.md:840`（query 原始字段面 ∥ L1·L2 判活尾段不扩至点火期）。
6. 受影核验句改写（原 `:858` ⇒ 修正后 `:864`）——改为核验结论：两件均零改（详 :861 / :862）；旧「close 面增 `evidence` 后随正」理由删除（实读 = 无对应该断言）。
7. 批内件规模两读数收一 = **≈200–260**——`LEDGER.md:860` 随正（与 `§2.4` :75 一致）。
8. ledger-cmd 行补 ③——`LEDGER.md:856`（`resolveExecutorTarget` 点火入边——实读 `thincoder-core/ledger-cmd.mjs:79-87`）。
9. 结算档到期处置句——`DESIGN-TOKEN-SETTLEMENT.md:84`（本批按「槽为准」落 ∥ 两面对齐余项缓办 ∥ 到期条件照旧）。

**两件核验明细（发现 3 / 6 核实面——零改结论的证据）**：`docs/batches/2026-10-05-ledger-unification.test.mjs`（232 行）本刻复跑 **18/18 绿**——唯一 P2 参数清单断言在 add 面（T89——`:155` 文案）；add 清单本批零变、close / query 面无清单断言（T77–T82 = 核直调对拍，双侧同移）⇒ **无随正点**。`docs/batches/2026-09-29-tools-carryover-15.test.mjs`（262 行）= 退役档（`:3` 退役注「留档不再复跑 · 勿修」）+ 已登记「不回改」（`LEDGER.md` §11.6）——subagent schema pin 漂移随登记承接、**不编辑**（dated 终态基线）。

**机检读数（修正后）**：`node scripts/doc-check.mjs`（cwd = thincoder/）⇒ 悬空 **65**（基线持平——零新增）∥ 行宽 **OK**（0 超宽；本批触碰行最长 245 字符）。

**§2 补记（#998 实施后指针重锚轮 · fix 轮 · 2026-10-07 · eng-designer）**

父侧裁定 = 修正（本棒 = fix 轮——只做指针重锚 + §10 表两行估数随实读；机制 / 契约 / 迁移期引文零触；其余档零笔）。消费核迁出（`subagent-spawn.mjs` ⇒ `design-slots.mjs`；re-export 保 import 面）后两设计档活指针随迁收正（行号 = 收正后实读）：

1. `DESIGN-TOKEN-SETTLEMENT.md:45`（§5 修法行）——`subagent-spawn.mjs:165` / `:167` ⇒ `design-slots.mjs:150` / `:152`。
2. 同档 `:46`（§5 消耗语义行）——`subagent-spawn.mjs:140`–`:145` ⇒ `design-slots.mjs:110`–`:135`（消费核）。
3. 同档 `:72`（§6.1 consume 落盘对称行）——`subagent-spawn.mjs:177` · `:179` ⇒ `design-slots.mjs:150` · `:152`。
4. 同档 `:97`（§6.3 门禁读权威行）——内联验证 `:158-169` ⇒ `subagent-spawn.mjs:235-239`（四点复核位之一——删段在前漂移）。
5. 同档 `:101`（§6.3 消费落盘对称行）——`subagent-spawn.mjs:140` + 失败回滚 `:160-173` ⇒ `design-slots.mjs:110` + 失败回滚 `:153-156`。
6. 同档 `:192` / `:194`（§10 落点表两行）——估数 ⇒ 实读（`design-slots.mjs` **233** 行 ∥ `subagent-spawn.mjs` **399** 行——两读数机械复核）。
7. `ENG-TOKEN-BINDING.md:45` / `:172` / `:193`——门禁过期拒删槽 `:277` ⇒ `:237`（四点复核位之一——删段在前漂移）；`:193` 消费核 `:140` ⇒ `design-slots.mjs:110`。

两档变更记录各增 1 行（2026-10-07 重锚轮——零语义改）。

**两档 `subagent-spawn` 全命中复核（无消费核残留指向）**：四点复核位 = `:100`（`resolveDesignSlot`——在位未动）∥ `:115`（机械拒行——在位未动；两者居删段之前，坐标未漂）∥ `:158-169` ⇒ `:235-239`（已收正）∥ `:277` ⇒ `:237`（已收正）。有效在位余 = DTS `:31` / `:71` / `:97` / `:100` + ETB `:193`；迁移期引文 / 历史行（零触）= DTS `:220` / `:237` / `:241` + ETB `:183` / `:310`。

**两检**：`node scripts/doc-check.mjs`（cwd = thincoder/）⇒ 悬空 **65**（基线持平——零新增）∥ 行宽：本棒两档 0 超宽；全仓 1 处超宽 = `docs/core/design/PROMPT-SYSTEM.md:332`（444 字符——非本棒面，该档钉零笔；随报告转父侧处置）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 `docs/batches/2026-10-07-ledger-tool.md` §2 + `docs/core/design/LEDGER.md`（§13 ∥ §3.1 ∥ §3.2 ∥ §5——全文读过）+ `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` §10 + `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2（设计轮 · 对象状态 = 待评审）。

**抽验（准则 8 / 可行性）**：受影响表 12 档行数磁盘实读（252 / 133 / 168 / 194 / 6 / 402 / 439 / 141 / 188 / 41 / 188 全对）；机制面实读（`_advisorRuns.designId`/`docSetKey`、`readEngTokensFromSlot`、`removeDesignTokenSlot`、`persistEngTokens`、`effectiveTokenTtlMs`、`isSubagentReadonlyAction`、`AGING_DAYS` 现居 `ledger.mjs:26`、导出白名单 `DATA_COLUMNS`）——可行性无阻断；无行为断言未经实读。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（导出契约面） | 🟡 | `LEDGER.md:292` / `LEDGER.md:296` 导出契约行 `ledgerQuery({ cwd, status, kind, board })` ∥ `ledgerClose({ cwd, id, status })` 未随 §13.1 / §13.2 / §13.4 收正（新参 `evidence` / `trigger`、行集增 `aged`）——批档 §2.2 声明的就地收正面（§3.1 / §3.2 / §5）未含 §7.1 | 将 §7.1 两行随 §13 收正（或加指针注——新参 / 计算字段见 §13），保契约面与 §13 一致 |
| 2 | 文档一致性（守卫声明面） | 🟡 | `LEDGER.md:582` 查询行「枚举字段 = status · kind」缺 `trigger`；`LEDGER.md:571` / `LEDGER.md:572` 的「该 action 前身旧工具 `parameters` 逐字」在 close 增 `evidence`、query 增 `trigger` 后不再字面成立（前身声明实读无此两字段——`docs/batches/2026-09-29-tools-carryover-15.test.mjs:108` / `:110`） | §11.3 表随 §3.2 增行收正（query 枚举字段补 `trigger`；「前身逐字」句补本批新增字段注），防实现按「逐字」复制前身声明而把新参判为未知键 |
| 3 | 标注完备（受影响面） | 🟡 | 「受影批件随正」两件（批档:76 ∥ `LEDGER.md:858`）为将改测试档（`.test.mjs`），未入受影响文件表（无现行行数 / Δ 标注）——每改动源 / 测试档须标注未满足 | 两件补入受影响文件表（现行行数 + 预期 Δ），或在表下就地注明规模 |
| 4 | 验收面滞后 | 🔵 | `LEDGER.md:379` AC-M2-7 仍只述「进入「在途」的迁移带 `executor` = 会话 `sessionId`」，未含点火边（§3.1 ① / §13.3 新契约两枚入边）；本批验收以 A-LT3（§13.6）承载 | AC-M2-7 补点火边子句或加指针（需求侧候补 AC-M2-21…24 同位） |
| 5 | 清晰度（可见面范围） | 🔵 | `LEDGER.md:836`「设计段 ∥ 实施段同可见」：判活显示面收集限在途（`LEDGER.md:337`；`thincoder-core/ledger.mjs:136` 实读 `.filter((r) => r.status === "在途" && r.executor)`）——点火期（待设计）归属仅经 query 行集原始字段可见；显示面是否属「同可见」未界定 | 明示可见面口径（query 原始字段 ∥ L1·L2 判活尾段分述），或另登记显示面扩面项 |
| 6 | 受影面论证精度 | 🔵 | `LEDGER.md:858` 以「含参数清单的 P2 文案断言——close 面增 `evidence` 后随正」列 `docs/batches/2026-10-05-ledger-unification.test.mjs`；实读该档唯一参数清单 P2 断言在 add 面（`:155`），add 清单本批零变、close 面无清单断言（T77 / T82 为核直调对拍——双侧同移） | 核实并改写随正理由，或改列确需随正的断言点 |
| 7 | 数值漂移 | 🔵 | 批内件 `docs/batches/2026-10-07-ledger-tool.test.mjs` 规模两读数不一致：批档:73「≈200–260」∥ `LEDGER.md:856`「≈180–220」 | 收两位数为同一区间 |
| 8 | 受影响面说明 | 🔵 | `LEDGER.md:852` ledger-cmd.mjs 行「改动」列未列 ③（点火边核心 = `resolveExecutorTarget` 进边扩面——`thincoder-core/ledger-cmd.mjs:79-87`）——同批 §13.5 表唯一未标改动点 | 该行改动列补 ③（或与 §13.3 指针互指） |
| 9 | 待决项到期 | 🔵 | `DESIGN-TOKEN-SETTLEMENT.md:83`「同 id 冲突裁决」消解项到期 = 「token 结算 / 合并面下次触碰」；本批为结算档批次（新增 §10），设计未声明该待决项是否本批到期（F-SL1 已按「槽为准」落——与核现径一致） | 增一句明示（本批处置 ∥ 明确缓办），保待决项不悬 |
| 10 | 命名 | 🔵 | `aged` 一名两义：`LEDGER.md:842` 查询行布尔（未决四态 ∧ >30d）vs §7.3 行计数（`thincoder-core/ledger.mjs:123-127`：技术待办 ∧ 无触发 ∧ >30d）；§13.4 已如实界定差异 | 可选：查询行字段另名（如 `stale`）或确保两义互指不混 |

**计数**：🔴 0 · 🟡 3 · 🔵 7（共 10 条）。
VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签——用户 2026-10-07 09:54「自动跑完」授权）**

- **三条件齐备**：① 设计评审 **#137 = pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 7）；② 修正轮 **#138** 已落地并经父侧抽验核讫（发现 1–9 全中 ∥ 10 零触；抽验 = §7.1 两契约行 `:292`/`:296` ∥ §13.5 表尾两行零改结论 `:861`/`:862`/`:864` ∥ 结算档到期处置 `:84` ∥ §11.3 新增字段注 `:575`——四处实读坐实；受影两件 = 核讫零改，父侧接受〔「随正」主张被核验结论取代〕）；③ token 已签发（评审 Approved 回执在会话）。
- **批准范围** = #998 批全链实施（四项工具改造：close+evidence ∥ query --trigger ∥ executor 点火入边 ∥ 查询面 aged + #927 槽位清点/批量 consume）+ 收口核销。
- **授权依据**：用户 09:54「自动跑完」（全链自动——设计评审代点火 ∥ §4 代签 ∥ 实施派发 ∥ 收口 ∥ 核销 ∥ 提交推送）；自缚三条在案（代签三条件 ∥ 新范围即停 ∥ 破坏性即停）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（19/19 批内件绿 · 定向复跑 18/18 + W8 腿 1/1 · node --check 全绿 · core 域 doc-check 0 悬空/行宽 OK · 审计轮 1 + advisor 评审轮 2（pass）终态 converged(clean)）



**§5 实施记录（eng-coder · 2026-10-07）**

**交付摘要（五条全覆盖——语义单源 = `LEDGER.md` §13 ∥ `DESIGN-TOKEN-SETTLEMENT.md` §10；机制细节不复述）**

- ① `close` 携可选 `evidence`（一跳核销）：`ledgerClose` 事务内 `nextEvidence = evidence ?? 行值`，追认门判**结果值**（缺 / 全空白拒——文案逐字不变）；勾销 / 撤回同携（写值落行，内容不判）；工具面 `close` 声明 + 路由携参（守卫 P2 认该键）。
- ② `query` 按 `trigger` 过滤：核 WHERE 等值支（与 status / kind / board 同式）；`ACTION_SPECS.query.trigger` 入声明 ⇒ P5 拒面按声明自动生成（`ledger(query)：trigger 非法：…`）。
- ③ executor 点火入边：`resolveExecutorTarget` 进边集扩为 {`待讨论 → 待设计`, `待设计 → 在途`} 两枚同式；出边 / 撤回 NULL、核销两源零触碰零变（判序按 §3.1 对齐：迁移表判 → 本语义 → 写门 → UPDATE——零行为差）。
- ④ `aged` 逐行：`ledgerQuery` 逐行计算字段（未决四态 ∧ 行龄 > `AGING_DAYS`；行龄源 `updated_at ?? created_at`；缺 / 坏时间戳 ⇒ `false`；`now` 注入缝）；`AGING_DAYS` 迁 `ledger-db.mjs` 单源 + `ledger.mjs` re-export（公共面零变）；导出白名单零涉。
- ⑤ 槽位面：新档 `design-slots.mjs` = 清点面（只读；槽文件 ∪ 内存并集；批列 `_advisorRuns.docSetKey` 反查，不可得 ⇒ `—`）+ 消费核迁入（选择器恰一：designId / designIds / expired / olderThanDays；单 persist；快照回滚）；`subagent.mjs` 第九 action 分派 + 3 参数；`subagent-spawn.mjs` re-export 保 import 面；`dispatch-gates.mjs` readonly 分类；VSC `tool-table.mjs` 同拍；`tool-docs/` 两档描述随动。

**落点与实读行数（as-of 交付刻；设计预测数为对照）**

| 落点 | 实读 | 设计预测 | 锚 |
|---|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 254 | ≈258 | close 声明 ∥ query 声明 ∥ union 描述三句 |
| `thincoder-core/ledger-cmd.mjs` | 153 | ≈150 | `isRowAged` ∥ `ledgerQuery` 逐行 ∥ 进边集 ∥ `ledgerClose` evidence |
| `thincoder-core/ledger-db.mjs` | 174 | ≈171 | `AGING_DAYS` 单源迁入 |
| `thincoder-core/ledger.mjs` | 193 | ≈194 | import + re-export（公共面零变） |
| `thincoder-core/tool-docs/ledger.md` | 6 | ≈8 | update / close / query 三句随动 |
| `thincoder-core/agent-tools/design-slots.mjs`（新） | 233 | ≈90–120 | 清点 ∥ 消费入口 ∥ 单枚 ∥ 批量 |
| `thincoder-core/agent-tools/subagent.mjs` | 415 | ≈415 | action enum ∥ 3 新参 ∥ 分派 ∥ 拒文清单 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 399 | ≈455 | 消费核迁出 ⇒ re-export 保 import 面 |
| `thincoder-core/agent/dispatch-gates.mjs` | 144 | ≈143 | design-slots 只读分类 |
| `thincoder-core/tool-docs/subagent.md` | 42 | ≈44 | 九动作头 ∥ consume-design 选择器句 ∥ design-slots 条 |
| `thincoder-vscode/src/agent/tool-table.mjs` | 188 | ≈190 | readonly 谓词随动 |
| `docs/batches/2026-10-07-ledger-tool.test.mjs`（新批内件） | 347 | ≈200–260 | U-LT1–10 ∥ U-SL1–9 |

**决策透明（实施轮内定，逐条）**

1. **「龄升序——最老在前」取操作句**：旬内两半相左（ageDays 升序 ≠ 最老在前）——按「最老在前」落（ageDays 降序 = 剩余有效期升序；畸形串不可判龄 ⇒ 排尾）。U-SL1 断言龄序 `sc(9.0d) → sb(7.0d) → sa(1.0d)`。
2. **批量消费落盘前先经 D2 reconcile**（槽 = 权威）：未选中的**活**槽并入内存、随 persist 保住（多槽隔离不因文件独有而失守）；过期项随本次落盘一并出清（= §10「落盘携带（如实）」注的落地形）；内存快照在 reconcile **之前**取 ⇒ 失败回滚到调用前态。
3. **`designIds` 重复条目去重**（一行一 id——回执计数不虚增）。
4. **新选择器参数面守卫**（fail-closed 补全）：`expired` 须 `true`、`olderThanDays` 须非负数字、`designIds` 须非空串阵列——格式外拒。
5. **判序对齐（审计 O1 收口）**：`ledgerUpdate` 内 executor 目标值计算移至写门之前——与 §3.1 判序句一致；纯函数、零行为差（复跑对拍绿）。
6. **union schema 描述随动（审计 O3）**：`executor` 句三面同文（ACTION_SPECS / union / tool-docs）。

**审计与评审轮次与终态**

- 轮 1 = 内部 explore 偏离审计（读审）：0 部分实现 ∥ 0 静默简化 ∥ 0 清单外；2 文档面发现（API-CONTRACT 生成区 / 设计档两活指针——皆非本席写域，随报告上抛）+ 观测 O1–O6。fix（2 处，零行为差）：O1 判序对齐 ∥ O3 union 描述。
- 轮 2 = 内部 advisor code review（读审）：**pass**（0 🔴 ∥ 🟡 2（未标 must-fix）∥ 🔵 5）。逐条处置：🟡① 单枚 `designId` 与批量选择器不同源——设计明示「单枚形态语义零变」，**不改**（设计面问题，随报告上抛）；🟡② 批内件 347 行 > 300 顾问线——登记实读，不加拆（任务书命名单一档）；🔵③④ 规模漂移 / `subagent.mjs` 415 > 300 = 在册增长路径，登记；🔵⑤ A-LT5「doc-check exit 0」口径 = 存量悬空 65 使字面不可达（核域实读：锚 0 悬空 · 行宽 OK）——文档笔；🔵⑥ §5/§6 本档自填；🔵⑦ `advisorRuns` 惰性初始化（内存态，零落盘）如实留痕。
- **终态：converged（clean）**——无未决 must-fix（审计 / 评审发现全部处置或按设计约束登记上抛）。

**验证读数（本席实跑）**

- `node --test docs/batches/2026-10-07-ledger-tool.test.mjs` ⇒ **19/19 绿**（U-LT1–U-LT10 + U-SL1–U-SL9；含一跳核销向后兼容、trigger 三枚举、点火边两枚、aged 全拍、导出零涉、清点只读零写、批量恰一 / 幂等 / 回滚 / 不复活 / 隔离 / 门外拒）。
- `node --test docs/batches/2026-10-05-ledger-unification.test.mjs` ⇒ **18/18 绿**（定向零回归——含 P2/P5 文案与五 action 等价腿）。
- `node --test --test-name-pattern "L2-A①" docs/batches/2026-09-29-residuals-round2.test.mjs` ⇒ **1/1 绿**（W8 契约②：端壳静态闭包零 `node:sqlite`——新档未破）。
- `node --check` × 10 改件 + 新批内件 ⇒ 全 OK。
- `node scripts/doc-check.mjs --domain core` ⇒ 锚 **0 悬空** · 行宽 OK；全仓运行 exit 1 = 存量（悬空 65 基线持平——零新增；行数面 13 差异全在 `docs/desktop/*`，他批在飞面）。
- 禁面自检：DDL / 迁移表 / 写门 / `ledger-executors.mjs` / `ledger-read.mjs` / `ledger-migrate.mjs` / `agent/family-tools.mjs` / 命令行面零改（diff 核对 + 审计读审核讫）；描述面单点（tool-docs 两档；零端副本）。
- **不跑仓套件**——父侧收口为唯一仓套件运行面（`not repo-suite verified — the parent-side closeout run is the only repo-suite run.`）。

**上抛（随交付报告呈父侧裁定）**：① 单枚 `designId` / 批量选择器不同源（口径提请：接受「单枚零变」或立法著差异）；② `family-tools.mjs` 子面拒文枚举未含 design-slots（设计零改面 ⇒ 未动）；③ `DESIGN-TOKEN-SETTLEMENT.md` 活指针 + `ENG-TOKEN-BINDING.md` 锚随消费核迁移漂移（设计档笔）；④ API-CONTRACT 生成区重跑（§2.7-4）；⑤ `FEATURES.md` 动作清单补 `design-slots`（§2.7-2）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-07）**

**链条**：设计 #133（§2 在档）→ 设计评审 **#137 pass**（0🔴 ∥ 3🟡/7🔵 处置在档）→ 修正轮 **#138**（发现 1–9 落 ∥ 10 零触）→ **§4 代签**（`:151` 起）→ 实施 **#139**（审计 0 ∥ 顾问评 pass ∥ 终态 converged）→ 实施后指针重锚轮 **#145**（7 处活指针随迁收正 ∥ §10 两行实读 **233**/**399** ∥ 零残留复核）→ 父侧收口。

**父侧核验读数**：批内件 `2026-10-07-ledger-tool.test.mjs` **19/19**（父侧亲跑）∥ 联并件 `2026-10-05-ledger-unification.test.mjs` **18/18** ∥ 三包 `npm test` 清单门 3/3（core ∥ cli ∥ vscode——09-28 重置后制度态）∥ `api-contract.mjs --write` 生成区重跑（3155 条）∥ `§6.11` 预算表读数随动（100,349 → **101,813** / 0.983；`subagent` 12,963 → **14,239**——复测注记 + 变更记录在档）∥ `doc-check` 悬空 65 = 基线持平 ∥ 行宽：本批面 0 超宽。

**父侧笔（requirements 面）**：`SPEC-LEDGER` **AC-M2-21…24**（`:79`–`:82`）+ 变更记录 ∥ `requirements/DESIGN-TOKEN-SETTLEMENT.md` **F-SL1 / F-SL2**（`:27`/`:28`）+ F-D6 现体坐标收正 ∥ `FEATURES.md:81` 动作清单补 `design-slots`。**机制 / 签发链行为零改**（#868 面另论）。

**父侧直接执行（标注 · 可 revert）**：`PROMPT-SYSTEM.md` §6.11 读数随动笔 ∥ 同档 `:332` 超宽行折行（父侧他笔披露转办）。

**核销**：#998（→ 已核销）∥ **#927**（并入项 → 已核销）——台账随收口收正。**暂缓批复核**：无。**用户文档面**：无（引擎 / 工具面——READ 面零涉）。

**跨批注**：① 「跨批写闸」新制两舱首用（舱写 `.thincoder/tmp/<舱>-随正/` → 父侧文件级搬入 + 跑件——14 件全走此径）；② 受影两旧批件零改（核讫）；③ 行数越估如实登记（批内件 347 ≈ 估 200–260 ∥ `design-slots.mjs` **233** ≈ 估 90–120；余在估内）；④ `:46` 措辞以新核为锚（原契约注释留 `subagent-spawn.mjs:126-134`——import 面残留注，父侧接受现形）。

**提交**：随今日收敛波统一签入（路径限定——本批面：10 core + vscode tool-table + 设计/需求档 + 批档 + 批内件 + `design-slots.mjs`）。
