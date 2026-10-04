# 2026-10-05 · ledger-tool-unification
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 00:25 「可以」——台账工具分散问题根治（5个 → 1个统一入口）。
> 台账 = #923（core · 需求池）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**目标与理由（缺陷现状 · 证据见代码面）**：台账操作拆为五个独立 tool 名（`ledger_add` ∥ `ledger_close` ∥ `ledger_query` ∥ `ledger_count` ∥ `ledger_update`——全住 `thincoder-core/ledger-tools.mjs` 单档五对象）⇒ 提示词面碎片化、模型需记五条指令。**修法目标** = 合并为单一入口 `ledger(action=add|update|close|query|count)`，内部路由既有实现（`ledger-cmd.mjs` 五函数），外部行为零变（除错误消息前缀面）。

**授权口径** = 用户 00:22「那我说个任务：台账工具现在分成了几个，我希望合并成一个用操作分。」+ 00:25「可以」（全链自动，沿用本夜各批自缚三条件）。

**关键判据**：① 终值模型面 = 恰一名 `ledger`（用户字面「合并成一个」）；② 五 action 对旧行为等价；③ 旧名兼容面（code 级）处置 = 设计裁；④ 产品码面 = `ledger-tools.mjs` + 两装配点（`tools/index.mjs` ∥ `agent/family-tools.mjs`）+ tool-docs + 双提示词面。

**台账**：#923（requirement · core）——本档 = 其任务书。

**父侧核验记录（00:37）**：设计轮首稿（#22）**六组问题** → 修正轮 #24 在跑（要点 = 装配终值钉死 ∥ 守卫按 action 适配 ∥ 双提示词面补全（先例 = ledger-governance 批 L1/L2）∥ 测试面补缺 ∥ tool-docs 处置 ∥ API-CONTRACT 核实）——明细 = §2 修正块。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 #24 七组 + 评审轮次 1（发现 1–10）收正 + 实施中裁定（评审轮次 2 后）已落；doc-check exit 0）

### 本批条目（覆盖）

| # | kind | 标题 | board |
|---|---|---|---|
| 1 | tech_todo | 台账工具分散问题根治（5个 → 1个统一入口） | — |

**非本批覆盖**：无。

### 设计档落点

`docs/core/design/LEDGER.md` §11（新建节 + changelog 一行）；其余 `docs/**` 零触。

### 机制设计要点

- **新工具名**：`ledger`
- **action 枚举**：add ∥ update ∥ close ∥ query ∥ count（五值，逐一对应旧五工具）
- **其余参数完全不变**：每个 action 的参数域 = 对应旧工具的 `parameters` 定义
- **旧工具留壳**：五个旧名 export 保留，execute body 改为抛弃用警告 → 指向新用法
- **路由内部模块**：`ledger-cmd.mjs` 零改动；差异仅在错误消息前缀
- **CLI 装配层**：`tools/index.mjs` + `agent/family-tools.mjs` 各一处聚合替换（~10 行）
- **提示词面全仓引用改写**：`common.md` L158、`persona-engineering.md` L167、`TOOLS.md` L282
- **tool-docs 五合一**：新 `ledger.md`（五 action 描述）+ 旧五 md 标记废弃
- **API CONTRACT**：不改动人工维护区——生成区由工具自身 `parameters` 决定

**禁止范围**：业务逻辑零改∥产品码零触∥`docs/**` 除 TOOLS.md / LEDGER.md 外零触。

### 受影响文件与测试面

| 文件 | 行数 | Δ | 改动摘要 |
|---|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 189 | +140 | 新 `ledgerTool` + 路由分发逻辑 + 旧工具 wrap 为弃用壳 |
| `thincoder-core/tools/index.mjs` | 80 | +5 | 导入 `ledgerTool`，`assembleBuiltinTools` 追加两条（query/count） |
| `thincoder-core/agent/family-tools.mjs` | 188 | +4 | 导入 `ledgerTool`，depth-0 段追加三条（add/update/close） |
| `thincoder-core/tool-docs/ledger.md` | 新 | — | 新档：五 action 统一描述 |
| `thincoder-core/tool-docs/ledger_add.md` | 1 | →0 | 标记废弃 |
| `thincoder-core/tool-docs/ledger_close.md` | 1 | →0 | 同上 |
| `thincoder-core/tool-docs/ledger_count.md` | 1 | →0 | 同上 |
| `thincoder-core/tool-docs/ledger_query.md` | 1 | →0 | 同上 |
| `thincoder-core/tool-docs/ledger_update.md` | 1 | →0 | 同上 |
| `thincoder-core/prompts/common.md` | 418 | ~1 | L158 引用改写 |
| `thincoder-core/prompts/persona-engineering.md` | ~196 | ~1 | L167 引用改写 |
| `docs/core/design/TOOLS.md` | ~1350 | ~1 | L282 引用改写 |
| `docs/core/design/LEDGER.md` | 516 | +60 | §11 新节 + changelog 一行 |

**跨文件极限**：`ledger-tools.mjs` (+140) = 329 行 < 500 hard limit，合规。

### 验收对照

| AC# | 来源 | 检查方式 |
|---|---|---|
| AC1 | 批任务 | 五枚举值全覆盖（query/count/add/update/close 各有一分支） |
| AC2 | 批任务 | 旧工具仍导出且 execute 抛弃用警告 + 指向新用法 |
| AC3 | 批任务 | 提示词引用改写无遗漏（common.md L158、persona-engineering.md L167、TOOLS.md L282 引用从旧名改为 `ledger(action=...)`；旧五名保留为壳不触发 prompt 引用检测） |
| AC4 | 批任务 | `node scripts/doc-check.mjs` exit 0 |
| AC5 | 批任务 | 最大单文件 ≤ 500 行 |

### 关键决策

| KD | 决策 | 否决方案 |
|---|---|---|
| KD-unif-1 | action = add/update/close/query/count | 过去式 / 数字代号 |
| KD-unif-2 | 旧名保留壳 → 抛弃用警告 | 立即移除 / 双份完整实现 |
| KD-unif-3 | 路由内部、`.cmd` 零改 | 改 `ledger-cmd.mjs` 签名 |
| KD-unif-4 | 提示词本轮改写 | 延迟到实施轮 |
| KD-unif-5 | tool-docs 五合一 | 旧文件不变 / 逐个注释 |

### 上抛项

无。设计已覆盖用户给出的全部 9 条设计要点（①–⑨），无需额外裁定。

### 修正块（#24 · 七组收正——2026-10-05 · eng-designer）

**承**：§1 父侧核验记录（六组）+ 追加第七组（机检面）。逐组 = 终值语句 + 落点（`docs/core/design/LEDGER.md`——行号 = 落地后实读；「现文」= 修正前形）。

**组 1 · 装配面终值钉死**
- 现文：§11.1「五旧一新并行架构」+ §11.3「追加两条/三条」+ §11.6「VSC 不需单独改装」——自相矛盾且漏 VSC 自持装配点。
- 终值：§11.1 重写 = [装配点 × 前 → 后] 三行——① `thincoder-core/tools/index.mjs`（读二移除）② `thincoder-core/agent/family-tools.mjs`（depth-0 `ledger` 全量 + depth>0 读变体）③ `thincoder-vscode/src/agent/tool-table.mjs`（端侧自持读二移除——**第三装配点，首稿漏**）；**模型面终值清单 = 恰一名 `ledger`**（depth-0 五 action / depth>0 读二；机械判据 = 名集断言）；旧五名 = code 面壳、**不入任何装配面**（已写明）；AC2/AC3 终值重述见本块尾。
- 落点：L522（§11 全节）· L530-533（装配对照）· L539-540（终值清单）· L649（§11.10 KD-unif-6）。

**组 2 · 守卫适配**
- 现文：T8/T9 文案 `ledger(add)：…` 与守卫实现（前缀 = tool.name）对不上；并集 schema 无 per-action 必填。
- 终值：§11.3（L550）——按 action 判据表（add→kind·title ∥ update→id ∥ close→id·status；声明源 = 前身工具 `parameters` 逐字——L560-564）+ 实现形 = **伪工具对象**（`{name:"ledger(<action>)", parameters}` 喂 `assertToolArgs` 零改）+ **文案前缀规则（逐字）**：入口级 `ledger：` ∥ 动作级 `ledger(<action>)：`（L566）；与 §3.2/§8 关系 = 判据本体零改、单源仍在 §3.2（L567）。
- 落点（§3.2 全组随批收正）：收正点 L156 ∥ 判据句 L153 ∥ 落点 L158-159 ∥ 机制 L163 ∥ 文案模板头 L168 ∥ P6 L177 ∥ 字段判据表 L183-197（前缀全改 `ledger(<action>)：`）∥ 拒面① L199 ∥ 射程 L213。§8：AC-M2-15 L383 ∥ AC-M2-16 L384 ∥ T37-T44 L426-433。§6.1 函数名前缀制度保留（L245 ∥ L260）。

**组 3 · 文档/提示词面清单补全**
- 终值：§11.7 逐面裁定表（L602）——更新 = 四提示词档**双面同拍**（`thincoder-core/prompts/common.md` ∥ `persona-engineering.md` ＋ `docs/core/design/prompts/` 两副本——L1/L2 先例）∥ 需求档（SPEC-LEDGER L29/L69/L70）∥ `docs/core/design/TOOLS.md`（§6.11 计数 + 接线句）∥ `docs/core/design/CORE-UNIFICATION.md`（接线行 + 计数簇）；**保留为历史** = PROMPT-SYSTEM ×2（2026-09-25 裁定注记——记录面；给由在表）。
- 落点：§11.7 L602-614 ∥ §11.8 表 L616-641（受影响面全清单——含 `thincoder-core/ledger.mjs` re-export ∥ VSC tool-table ∥ check-vsix ∥ tool-schema-size ∥ 计数簇文档）。

**组 4 · 测试面补缺**
- 终值：§11.6（L590）——批内件 = `docs/batches/2026-10-05-ledger-unification.test.mjs`（拟新增；五腿：等价 ∥ 弃用壳 ∥ 守卫逐 action 文案 ∥ 未知 action ∥ 装配名集——L592-597）；现役五端套件扫描零命中（L598）；旧批件登记（carryover-15 失效面 ∥ residuals-round2 超集判不受触——L599）。
- 落点：§11.6 全节（L590-600）。

**组 5 · tool-docs 处置钉死**
- 终值：§11.5（L579）——五档**删档**（`ledger_add/close/count/query/update.md` 退场——L580；DESC 加载面：壳 description 静态化 L569 ⇒ 不触）；新 `thincoder-core/tool-docs/ledger.md`（拟新增；预算面 ≤ 499 字符——L582）；计数随动 52 ⇒ 48（check-vsix EXPECT + 文档计数簇 L585-587）。
- 落点：§11.5 L579-588 ∥ §11.8 两新档行 L627/L640。

**组 6 · API-CONTRACT 核实 + 小项**
- 读数：工具对象导出**在册**——生成区五行 + `thincoder-core/ledger.mjs` re-export 命名组一行（语义区未列）；处置 = 实施轮重跑 `node scripts/api-contract.mjs --write`（先例 = bash 批导出行组随动/行号随动）。
- 落点：§11.9 L644-647。小项：批档 §5 = eng-coder 段——本段零触（现状 = 空段）；§2 状态行以 batch 工具收口 = 设计完成。

**组 7 · 机检面闭合（父侧追加）**
- 现文：`:526` ∥ `:527`（裸路径 `tools/index.mjs` 双命中不唯一）∥ `:549`（新档未落盘）——入闸悬空 3（doc-check exit 1）。
- 终值：§11.1 唯一路径形（`thincoder-core/tools/index.mjs`——L531 起）；新档/批内件/两表行按仓例「（拟新增——本批实施轮落盘）」（L582 ∥ L592 ∥ L627 ∥ L640）；五旧档行「退场（迁移期引文——…）」（L580）。
- 读数（落地后实跑）：入闸悬空 **3 ⇒ 0**；行宽 3 处自纠（L158/L585/L592 折行）；**doc-check exit 0**（`_doccheck_post2.log`）。

**AC2 / AC3 终值重述**
- AC2：五个旧名 export 保留为**弃用壳**（execute 抛 + 指向新用法——L569-577）∧ **不入任何装配面**（L539-540 名集断言）；re-export 面增 `ledgerTool`（§11.2 L542）。
- AC3：提示词/文档面引用改写无遗漏——面清单 = §11.7（四提示词档双面同拍 + TOOLS.md + 需求档 + CORE-UNIFICATION.md；LEDGER.md 自身已收正）；引用改 `ledger`（action=…）形；旧五名以壳留存——prompt-refs-check 三式（J1/J2/J3）不匹配工具名（零登记）。
- AC1 / AC4 / AC5 维持：五 action 全覆盖（L550-568）∥ doc-check exit 0（组 7 读数）∥ 行数 ≤500（L642 跨文件极限——估 ≈250）。

### 修正块（评审轮次 1 · 发现 1–10 · 父裁 = 十条全采纳——2026-10-05 · eng-designer）

**承**：§3 轮次 1 发现表（1–10）+ 父侧裁定「十条全采纳」。逐条 = 终值 + 落点（`docs/core/design/LEDGER.md`——行号 = 落地后实读；「现文」= 修正前形）。**§2 正文行收正**（发现 #3 / #7——初稿读数作废 / 替代；行数 / Δ / 处置终值以 `LEDGER.md` §11.8 为权威；§2 表体 append-only 零回改——本块 = 唯一修正面）。

1. 🔴 **`action` 键缝（#1）**：终值 = 守卫入参形态钉死——`action` 在入口级判序②**已消费**（`const { action, ...rest } = args` 形），喂伪工具守卫 = **余键**（`action` 键不入 P2 域）；伪声明「前身逐字」零改（否决「并入单值 `action` 属性」——KD-unif-8）。三处同文 = §3.2（收正块 / 落点句 / 判序②）· §11.3（入参形态 + 判序③）· §11.11 锚行（T80 / T84 / T89）。
   落点：`:156` ∥ `:158` ∥ `:166`（§3.2）· `:559-560`（§11.3）· `:669`（§11.10 KD-unif-8）· `:675-691`（§11.11）。
2. 🟡 **增量读数收敛（#2）**：终值 = `thincoder-core/ledger-tools.mjs` 增量 **+≈75（估 ≈265）**（设计档 / 批档两处同文）；批档判句按 ≤300 顾问线明写：估 ≈265 ≤ 300 ⇒ 零拆分义务（越线预案 = §11.8 尾句「统一入口出档」）。
   落点：`LEDGER.md` `:627` ∥ `:651`；本档 §2 `:52` / `:66` / `:130`（作废 / 替代见 #3）。
3. 🟡 **批档 §2 正文行收正（#3）**——初稿读数**作废 / 替代**：
   - `:43`「旧五 md **标记废弃**」作废 ⇒ **五档删档 / 退场**（要点并入新 `ledger.md`——`LEDGER.md` §11.5；计数 52 ⇒ 48）；`:56-60` 五档行「标记废弃」同作废 ⇒ **退场（删档）**；
   - `:52` Δ `+140` 作废 ⇒ **+≈75（估 ≈265）**；`:66`「(+140) = 329 …合规」作废 ⇒ **估 ≈265 ≤ 300 顾问线（零拆分义务；越线预案 = §11.8 尾句）**；`:130`「估 ≈250」⇒ **估 ≈265**；
   - `:53`「追加两条（query/count）」作废 ⇒ **读二注册移除**（Δ −3——ledger 面迁家族段，§11.1）；`:54`「追加三条（add/update/close）」作废 ⇒ **depth-0 换 `ledger` 全量 ∥ depth>0 挂只读变体**（Δ +≈6——§11.1）；
   - `:61` `common.md` 读数 `418` 作废 ⇒ **170**（实读）；`:62` `persona-engineering.md` `~196` ⇒ **195**（实读）；`:63` `TOOLS.md` 读数以 §11.8 行为准；`:64` `LEDGER.md` `516` ⇒ **592**（终值 = §11.8 本档行）；
   - `:26` 覆盖表 kind `tech_todo` 作废 ⇒ **`requirement`**（board = `core`——与 `:15` 对齐；台账实读 #923 kind = requirement）。
4. 🟡 **§8 在树引用退役标记（#4）**：终值 = `:393` / `:402` 表头补「已随 2026-09-28 测试树全清退场（档不在盘）」（与 `:417` / `:424` 同款）；§11.6「零用例」句维持（与现盘一致——core/test 仅 run.mjs ∥ slow.mjs）。
   落点：`LEDGER.md` `:393` ∥ `:402`。
5. 🟡 **§11.11 用例改号（#5）**：终值 = **T1–T12 ⇒ T77–T88** + 增 **T89–T91**（P2 / P4 / P6）。**「T57 起」前提实破**（实核 2026-10-05）：T56 ∥ T57 ∥ T58 已占（`docs/core/design/MANIFEST.md:683-685`——conventions-retire 批 T56–T58 族；T59 / T60 同表 `:686-687`）∥ T59–T76 零散占用（无连续空段）⇒ 依「未占用号段」取**首用未占用连续段 T77–T91**（未选「独立前缀」案——数值段优先）。
   落点：`LEDGER.md` `:675-691` ∥ §8 登记块 `:451-453` ∥ changelog `:524`。
6. 🟡 **需求侧 PROMPT-SYSTEM 计数串（#6）**：实载**成立**（`:12` ∥ `:194` ∥ `:210`——「24 档工具描述」）⇒ 已补入 §11.5 计数簇（`:591-594`）与 §11.8 行（`:645`——终值 48；需求档笔 = 主 agent）。附：簇内 design/PROMPT-SYSTEM 枚举行漏 `:23`（第 5 处「52」）——随补（`:592`）。
7. 🔵 **覆盖表 kind（#7）**：终值 = `requirement`（board = `core`——§1 `:15` 对齐；台账实读一致）。落点：本块 #3 末项（§2 表体零回改）。
8. 🔵 **§11.8 自指行刷新（#8）**：终值 = `前 592 ⇒ 落档 702（修正轮收正后实读——末行号法）`（取法 = read 全文实读末行号；wc 行数 = 701——尾空行差 1）。
   落点：`:648`。
9. 🔵 **批内件规模估 + API-CONTRACT 入表（#9）**：终值 = 批内件行补 `估 ≈260`（15 用例 + 夹具）；`docs/core/design/API-CONTRACT.md` 补入 §11.8 表（生成区随动——§11.9 重跑）。
   落点：`:649` ∥ `:647`。
10. 🔵 **守卫回归补 P2 / P4 / P6（#10）**：终值 = §11.6 腿 3 扩（P2 `action` 不入未知列 ∥ P4 错型 ∥ P6 `title` 空）+ §11.11 增 **T89–T91**（P2 用例钉 #1 键语义——未知列零 `action`）。
    落点：`:602`（§11.6）∥ `:687-689`（§11.11）。

**读数（落地后实跑）**：`node scripts/doc-check.mjs` = **exit 0**（入闸悬空 **0**；行宽 0 超宽；拟新增 / 迁移期引文 = 列报非闸态）；`docs/core/design/LEDGER.md` = 702 行（末行号法；wc 701）。**验收自查（父侧三条）**：① 十条逐条落 = 本块 1–10；② doc-check exit 0 = 上行读数；③ §11.3 缝句与 §3.2 / §11.11 三处同文 = #1 落点行。

**旁注（列报——不在十项射程）**：① §11.2 `:552`「动态 import `ledger-cmd.mjs` 对应函数」措辞与现盘静态 import（`thincoder-core/ledger-tools.mjs:10`）存歧义——实施面以「携自原工具 execute 逐字保留」句为准（本修正轮未改）；② `thincoder-vscode/scripts/check-vsix.mjs:11` 头注「16 / 24」陈旧——§11.5「档数注记同随」已覆盖（实施轮随动）。

### 修正块（评审轮次 2 后 · 实施中裁定——2026-10-05 · eng-designer）

**承**：§3 轮次 2（VERDICT pass）→ §4 批准 → 实施舱 #29 探测上报（统一入口动作级只读分类 = §11 未钉死缝）→ 父侧 01:2x 裁定。**本块 = 该裁定的设计档落记**（不改判据本体、零其他语义）。

**裁定（逐字承父侧）**：全量变体 `readonly: false` + `isReadonlyAction(args)`（`action ∈ {query, count}` ⇒ true）；只读变体 `readonly: true`。依据 = §11 目标「外部行为零变」（旧 `ledger_query` / `ledger_count` = `readonly: true`——`dispatch.mjs:58` / `:156` 经 `readonlyActionOf` 消费） + 仓内既定模式（先例 = `git` / `memory` / `subagent`；`dispatch-gates.mjs:121-123` 钩子优先）。

**落点（`docs/core/design/LEDGER.md`——行号 = 落地后实读）**：
1. §11.2（L552-554）增两条——**只读分类**句（两变体 readonly 形 + 钩子名 + 依据 ∥ 消费点）+ **残留两条**登记（① Phase-2 读调用转串行 ∥ ② `record-results` verify 失效记账对读调用生效——钩子覆盖不到的工具级 `readonly` 消费点；不改他档无法消；终值以实施轮交付登记为准）；
2. §11.10 增 **KD-unif-9**（L674——否决 = 一刀切 `readonly: true`（写被当读放行）∥ 一刀切 `readonly: false` 无钩子（读二旧行为不保））；
3. 变更记录 +1 行（L525——实施中裁定；本档体例 = 每设计事件一行，先例 523 / 524）。

**禁面核**：产品码零触 ∥ §11 其余面零触 ∥ 判据本体零改 ∥ 批档 §1/§3/§4/§5/§6 零触 ∥ 他批面零触 ✓。

**读数（落地后实跑）**：`node scripts/doc-check.mjs` = **exit 0**（入闸悬空 **0**——汇总「候选 47973 · 悬空 0」；行宽 0 超宽）；`LEDGER.md` = 707 行（+5）。**旁注**：本笔 +5 行 ⇒ §11.8 本档自指行读数（「落档 702——as-of 轮次 1」）随动未落（禁面）；随收口同步。

### 微块（实施后同步——2026-10-05 · eng-designer）

**承**：§5（#29 产品面交付登记 ∥ #30 随动面）+ 父侧核验读数（三门亲跑全绿：api-contract 2878 条 · doc-check 悬空 0 · 批内件 18/18）。**本块 = 实施后设计档同步（微轮）**——三处收正 + 变更行；零其他语义。

1. §11.2「re-export 面」行（L559）⇒ 补第二名——`ledgerTool` + `ledgerReadTool`（实读 `thincoder-core/ledger.mjs:191`；前仅书 `ledgerTool`）；
2. §11.2 残留条（L554-556）⇒ 口径改「行为影响面两条 + 同判据两处零影响」（四行号俱列——`thincoder-core/agent/dispatch.mjs:244-245` ∥ `thincoder-core/agent/record-results.mjs:89` ∥ `thincoder-core/agent/dispatch-run.mjs:69` ∥ `thincoder-core/agent/helpers.mjs:369`）；末句改「实施轮登记 = 批档 §5（#29）」；
3. §11.8 自指行（L655）⇒ 落档值 702 ⇒ 710（实施后同步实读——末行号法；+5 = 实施中裁定轮，本笔 +3）；
4. 变更记录 +1 行（L526——实施后同步；体例沿 523–525 先例）。

**禁面核**：产品码零触 ∥ §11 其余面零触 ∥ §3.2 / §8 等既有面零触 ∥ 批档 §1/§3/§4/§5/§6 零触 ∥ 他批面零触 ✓。

**读数（落地后实跑）**：`node scripts/doc-check.mjs` = **exit 0**（OK(锚): 0 条悬空——候选 48202 · 悬空 0 · 声明源缺位 0；OK(行宽): 无 >300 字符单行）；`LEDGER.md` = 710 行（末行号法）。

**随注（落点行号 · 落档后实读）**：re-export 面行 = **L560** ∥ 残留条 = **L555-557** ∥ 自指行 = **L655** ∥ 变更记录行 = **L526**（上块 1 / 2 两条行号未计变更行 +1 平移——以本条为准；本档全文 710 行）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**审查对象**：`thincoder/docs/core/design/LEDGER.md`（全文已读，含本批新增 §11）＋ `thincoder/docs/batches/2026-10-05-ledger-unification.md`（全文已读，含 §2 修正块）。范围外文件未读 ⇒ 档外读数与「零命中」类断言按 unverified 处理；spot-check 限两档内部与互指面。文档地图 / 项目标准档未声明 ⇒ 文档归属按 Project Guide 判定（本批落 §11 于既有归属档、未另起新档、判据单源仍指 §3.2——无违规）；方法学按 Project Guide ＋ 批档体例判定。

**无问题面（记）**：需求覆盖（用户字面「合并成一个用操作分」⇒ 单入口 `ledger` ＋ action，旧五名不入任何装配面）；范围（§11.12 边界齐、无越界）；计数算术（52 − 5 + 1 = 48 自洽）；可实施性（路由 / 动态 import / 伪工具对象机制可落，除 #1 缝外无阻塞）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🔴 | §11.3 伪工具对象**声明源 = 前身工具 `parameters` 逐字**（`LEDGER.md:553`；判据表 `LEDGER.md:560`「前身 `ledger_add` 的 `parameters`」），而守卫对入参全键判未知键（`LEDGER.md:166`「② 未知键 ⇒ 拒（P2——列未知键 + 可用参数集）」）、前身声明又是闭合声明（`LEDGER.md:164`「**五 action 声明条目** `parameters` 补 `additionalProperties: false`（闭合声明——与「未知键拒」同源宣告；读命令二具同拍——2026-09-28）」）。统一入口入参携路由键 `action`——该键不在任何前身声明 `properties` 内 ⇒ 按 §11.3 判序 ③（`LEDGER.md:554`「③ 分派后按该 action 伪工具对象走 P2–P6」）字面实现，每次调用先撞「未知键 `action`」被拒，与 T4 / T8 等正常径期望（`LEDGER.md:668`「`{action:"add", kind:"requirement", title:"test"}`」⇒ 成功）自相矛盾——设计未写 `action` 键在分派后的处置。 | 在 §11.3 钉死该缝（二择其一：分派后以「已消费 `action`」的余键喂守卫 ∥ 伪声明并入单值 `action` 属性），并使 §3.2 判序 / P2 语义、§11.3 判序、§11.11 期望三处同文。 |
| 2 | File-size 标注 | 🟡 | `thincoder-core/ledger-tools.mjs` 增量两档互斥：设计档（`LEDGER.md:620`）= `189` → `+≈60（估 ≈250）`；批档（`2026-10-05-ledger-unification.md:52`）= `189` → `+140`，判句（`:66`）「**跨文件极限**：`ledger-tools.mjs` (+140) = 329 行 < 500 hard limit，合规。」。两值横跨 300 顾问线（250 ∥ 329）⇒ 拆分义务在设计时点不可判；批档判句只对 500 硬线，设计档另携条件式拆分预案（`LEDGER.md:642`）。 | 把两处增量读数收敛为一个数；批档判句按 ≤300 顾问线明写结论（越线时指名拆分预案），与设计档 §11.8 及其尾句同文。 |
| 3 | Doc-state | 🟡 | 批档 §2 正文行未随修正块收正：tool-docs 行仍作「旧五 md 标记废弃」（`2026-10-05-ledger-unification.md:43`、`:56`），而终值（`LEDGER.md:657` KD-unif-5 ＋ `LEDGER.md:581` §11.5）为五档**删档/退场**、计数 ⇒ 48；装配两行仍作「追加两条」「追加三条」（`:53`、`:54`），而终值为移除 / 替换（`LEDGER.md:531-532`）；`thincoder-core/prompts/common.md` 读数 `418`（`:61`）与设计档 `171`（`LEDGER.md:629`）互斥。只读 §2 表的实施面会落到被否决形态。 | 在 §2 追加一行作废 / 替代声明（或在表头加权威指针），把受影响面终值指到 `LEDGER.md` §11.8，并同步被收正的三个数字与 tool-docs 处置。 |
| 4 | Doc-state | 🟡 | §11.6 断言「core 测试树现为零用例（2026-09-28 全清重置——零用例即绿）」（`LEDGER.md:598`），而 §8 两处用例表头仍以「新档」列 `thincoder-core/test/ledger-executor.test.mjs`（`LEDGER.md:393`）与 `ledger-key-normalize.test.mjs` / `ledger-migrate.test.mjs`（`LEDGER.md:402`）、无退役标记；另两档已标「已随 2026-09-28 测试树全清退场（档不在盘）」（`LEDGER.md:417`、`LEDGER.md:424`）。两句不能同真。 | 二择其一收正：给残留的在树测试档引用补同款退役 / 在盘标记，或改叙「零用例」句使其与 §8 清单一致。 |
| 5 | Acceptance criteria | 🟡 | §11.11 新用例表沿用 T1–T12（`LEDGER.md:665-676`），与 §8 既有模块级用例 T1–T12（`LEDGER.md:389`）撞号；本项目对同类撞号有先例收正（`LEDGER.md:515`「§8 用例改号 **T47 ⇒ T55**（消 #882 批 T47–T54 撞号）」）。 | 给 §11.11 用例改用未占用号段（如 T56 起）或独立前缀，并在 §8 登记映射。 |
| 6 | Completeness | 🟡 | §11.7 裁定两 PROMPT-SYSTEM 副本「计数簇随 §11.5」（`LEDGER.md:613`），但 §11.5 计数簇枚举只列 `docs/core/design/PROMPT-SYSTEM.md`（`LEDGER.md:585-586`）、§11.8 表同样只列设计侧一份（`LEDGER.md:636`）——§11.7 行点名的 `docs/core/requirements/PROMPT-SYSTEM.md` 两处皆缺（该档是否实载计数字符串 = unverified，范围外）。 | 二择其一收正：把需求侧 PROMPT-SYSTEM.md 补进计数簇清单与 §11.8 表行，或收窄 §11.7 行的指称（若其无计数面）。 |
| 7 | Doc-state | 🔵 | 批档 §1 记「**台账**：#923（requirement · core）」（`:15`），§2 覆盖表同行记 `tech_todo`（`:26`）——条目 kind 两处互斥。 | 与台账行实际 kind 对齐后收敛其中一处。 |
| 8 | File-size 标注 | 🔵 | §11.8 给本档自身标 `现行 592`（`LEDGER.md:639`），本次全文读取末行 = `:687`——纯 .md 免标义务，属读数滞后。 | 刷新该行读数或删去本档自身的数字。 |
| 9 | File-size 标注 | 🔵 | 新档批内件行 Δ 记 `—`、无规模估（`LEDGER.md:640`），同类先例带显式估读；§11.8 表亦未列 `docs/core/design/API-CONTRACT.md`（其生成区随本批重跑，`LEDGER.md:646`）。 | 补新档测试件的规模估读，并把 API-CONTRACT.md 补入受影响表（或注明归 §11.9）。 |
| 10 | Acceptance criteria | 🔵 | 统一入口的守卫回归只配到 P3 / P5 面（腿 3，`LEDGER.md:595`）；P2（未知键）/ P4（错型）/ P6（`title` 空）在统一入口下无任何用例（§11.6 ∥ §11.11 皆无），而原覆盖档已退役（`LEDGER.md:424`）⇒ 该三面在新入口上无回归网。 | 补统一入口的 P2 / P4 / P6 用例（P2 用例同时把 #1 的 `action` 键语义钉死）。 |

**计数**：🔴 ×1 · 🟡 ×5 · 🔵 ×4

**VERDICT: changes-required**

### 轮次 2（评审子代理）

**轮次 2 复核（前轮 10 项 · 本轮全文重读两档——非快照判定）**：`docs/core/design/LEDGER.md`（702 行 · 含 §11 ∥ §3.2 / §8 随动面）＋ `docs/batches/2026-10-05-ledger-unification.md`（含 §2 双修正块）。档外断言（MANIFEST.md T56–T60 ∥ 磁盘读数）按 unverified 处理。崩溃 / 数据丢失 / 逻辑错误类新引入问题扫描：未见。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | LEDGER.md | 🔴 | Fixed | 缝已钉死且三处同文：`:559`「**入参形态（分派后——缝钉死）**：`action` 键在判序②**已消费**（`const { action, ...rest } = args` 形）」· `:560`「③ 分派后以**已消费 `action` 的余键**喂该 action 伪工具对象走 P2–P6（§3.2 同文——P2 域 = 余键）」· §3.2 `:156`「**入参形态 = 已消费 `action` 的余键**」∥ `:166`「统一入口面域 = 余键——`action` 已消费，§11.3」· `:669` KD-unif-8 · §11.11 锚行 T80 `:678` / T84 `:682` / T89 `:687`。 |
| 2 | 2 | LEDGER.md ＋ 批档 | 🟡 | Fixed | 单值收敛 + 顾问线明写：`:627`「| `thincoder-core/ledger-tools.mjs` | 189 | +≈75（估 ≈265） |」· `:651`「估 ≈265 行 ≤300 顾问线（零拆分义务）；若实施轮实装越线 ⇒ 拆分预案 = 统一入口出档」；批档 `:142`「`:52` Δ `+140` 作废 ⇒ **+≈75（估 ≈265）**；`:66`「(+140) = 329 …合规」作废 ⇒ **估 ≈265 ≤ 300 顾问线**」。 |
| 3 | 3 | 批档 | 🟡 | Fixed | 作废 / 替代块 + 权威源指定：`:134`「行数 / Δ / 处置终值以 `LEDGER.md` §11.8 为权威；§2 表体 append-only 零回改——本块 = 唯一修正面」· `:141`「「旧五 md **标记废弃**」作废 ⇒ **五档删档 / 退场**」· `:143`「`:53`「追加两条（query/count）」作废」· `:144`「`:61` `common.md` 读数 `418` 作废 ⇒ **170**（实读）」。 |
| 4 | 4 | LEDGER.md | 🟡 | Fixed | 两处表头补退役标记：`:393` / `:402` 均含「**已随 2026-09-28 测试树全清退场（档不在盘）**」；§11.6 `:605` 零用例句与之一致。同族残留 = #11。 |
| 5 | 5 | LEDGER.md | 🟡 | Fixed | 改号至未占用段并登记：§11.11 = T77–T91（`:675` T77 … `:689` T91）+ `:691`「（号段 = 首用未占用连续段 **T77 起**——实核 2026-10-05…）」+ §8 `:453`「T77–T91：统一入口五 action 等价…（号段首用未占用连续段 T77 起——旧 T1–T12 撞号已消）」。 |
| 6 | 6 | LEDGER.md | 🟡 | Fixed | 需求侧补入 + design 侧补 `:23`：`:593`「· `docs/core/requirements/CORE-UNIFICATION.md`（`:19` · `:117`）· `docs/core/requirements/PROMPT-SYSTEM.md`（`:12` · `:194` · `:210`——「24 档工具描述」陈旧读数随本批收正 48）」· `:592` 含 `:23` · §11.8 `:645` 行在表。 |
| 7 | 7 | 批档 | 🔵 | Fixed | `:145`「`:26` 覆盖表 kind `tech_todo` 作废 ⇒ **`requirement`**（board = `core`——与 `:15` 对齐；台账实读 #923 kind = requirement）」；表体按 append-only 零回改。 |
| 8 | 8 | LEDGER.md | 🔵 | Fixed | `:648`「| `docs/core/design/LEDGER.md` | 前 592 ⇒ 落档 702（修正轮收正后实读——末行号法） | 本档 |」；本轮全文重读末行 = `:702`——相符。 |
| 9 | 9 | LEDGER.md | 🔵 | Fixed | `:649`「| `docs/batches/2026-10-05-ledger-unification.test.mjs` | 新（拟新增） | 估 ≈260 | 批内件（§11.6——五腿） |」· `:647`「| `docs/core/design/API-CONTRACT.md` | 2980 | 生成区随动 | 重跑生成器（§11.9——生成区唯一笔） |」。 |
| 10 | 10 | LEDGER.md | 🔵 | Fixed | 腿 3 扩三面：`:602`「P2 未知键（`action` 不入未知列——已消费，§11.3）/ P4 错型 / P6 `title` 空——三面补齐」；T89 `:687`（P2）· T90 `:688`（P4）· T91 `:689`（P6）。 |
| 11 | (new) | LEDGER.md | 🟡 | New | #4 同族残留（前轮未列；非本轮修正新引入）：三处验证 / 指针槽仍指向已退场用例而未带退役框架——`:71`「T22 = **间接守卫**（级联面同契约下游回归：`findProject` 同键——非各 `===` 点的直测）」· `:109`「**指针**：验收 = §8 AC-M2-12 / AC-M2-13 · 用例 T24–T32；」· `:382`「②.2（2026-09-25 本批 · 用例 T33–T36） |」——宿主档已在 `:402` / `:417` 标「已随 2026-09-28 测试树全清退场（档不在盘）」。建议一次同族扫描，把这三处指针同步为退场框架（先例 = #95「同族枚举一致性收正」）。非阻、随批可选。 |

**计数**：未决 🔴 ×0；前轮 10 项 = Fixed ×10（🔴 1 ∥ 🟡 5 ∥ 🔵 4）；本轮新列 🟡 ×1（非阻）。

**VERDICT: pass**

## §4 用户批准（主 agent）

**2026-10-05 01:2x 父侧代签**（承用户 00:25「可以」立批全链授权——设计 → 评审 → 批准 → 实施（全链自动，本夜批系沿例）；**非用户亲签**）。

**三条件核验**：① **设计评审 pass ✓**——#28 · 轮次 2 · **VERDICT pass**（对前轮 10 项逐项实读：Fixed ×10；本轮新列 🟡 ×1 非阻——#4 同族指针残留，随批可选）；② **修正落地并逐条核验 ✓**——#26 十条全落 + 父侧逐处实读复核 + 两处列报小项就地修（`:551` 措辞对实现文 ∥ `:387` 改号——父侧直接执行·可 revert）；`node scripts/doc-check.mjs` 亲跑 **exit 0**（悬空 0）；③ **token 已签发 ✓**（运行态不入档）。

**批准范围** = 本批全量（§11 设计终值 ∥ §11.8 受影响面 ∥ 批内件五腿 ∥ §11.7 文档面清单）。

**实施派单** = 双舱（一面一舱）：**#29 产品面**（12 档：`ledger-tools.mjs` ∥ `tools/index.mjs` ∥ `agent/family-tools.mjs` ∥ `ledger.mjs` ∥ VSC `tool-table.mjs` ∥ tool-docs 五退一增 ∥ 批内件）∥ **#30 随动面**（10 档：四提示词档 ∥ 设计 / 需求计数簇 ∥ `API-CONTRACT.md`——dependsOn #29）。**工程工具面**（`check-vsix.mjs` ∥ `tool-schema-size.mjs`）+ **需求档**（`ENGINEERING-MODE-V2-SPEC-LEDGER.md`）＝ 父侧直接执行（机械笔·可 revert）。

**骑缝注**：回执附 host 引文自检异常（0/23 相符——10 条列报）；父侧抽核（`:559` ∥ `:560` ∥ `:156` ∥ `:166` ∥ `:627` ∥ `:651` ∥ `:648`）逐字与现盘相符 ⇒ 按检查器口径处理（疑似比对修订面偏差），不阻本签。

## §5 实施记录（eng-coder）
**状态行**：实施完成



**完成面**（产品面舱 #29 · 12 档全落 · 2026-10-05）：统一入口 `ledger` 两变体（全量五 action ∥ 只读 query/count）落 `thincoder-core/ledger-tools.mjs`——execute 判序 = ① 归一 → ② 入口级 action 判（`ledger：`）→ ③ 已消费 `action` 的余键喂伪工具 `{name:"ledger(<action>)", parameters: 前身逐字}` 走 P2–P6（`ledger(<action>)：`）→ ④ 路由五核函数（`.cmd` 零改，出参逐字携自原工具）；五旧名降 code 面弃用壳（execute 抛 + description 静态化不经 DESC + 零库动作）。装配三点 = `thincoder-core/tools/index.mjs` 读二移除 ∥ `thincoder-core/agent/family-tools.mjs` depth-0 全量 + 全 depth>0 段（含 consult ∕ 兜底）只读变体 ∥ `thincoder-vscode/src/agent/tool-table.mjs` 端侧读二移除。`thincoder-core/ledger.mjs` re-export 增 `ledgerTool` + `ledgerReadTool`（五旧名保留——residuals-round2 超集判不受触）。tool-docs 五档删档 + 新 `ledger.md`（496 字符 ≤ 499 预算）。批内件 `docs/batches/2026-10-05-ledger-unification.test.mjs`（五腿 T77–T91；18 用例）。

**决策透明表**

| # | 决策 | 依据 |
|---|------|------|
| 1 | 只读变体导出名 = `ledgerReadTool`（设计档仅钉 `ledgerTool`；family-tools 消费所需） | §11.2 两变体；名称 = 实施轮落定项（建议设计档 ∕ 交付登记补名） |
| 2 | 动作级只读分类 = 全量变体 `readonly:false` + `isReadonlyAction`（query/count ⇒ true）∥ 只读变体 `readonly:true` | 父侧 2026-10-05 回执裁定（承 §11 目标「外部行为零变」——旧读二 `readonly:true` 同行为：planMode 放行 ∕ 免审批；先例 = git/memory/subagent 钩子） |
| 3 | 变体形态显式参数 `writeFace`（删长度启发式）+ switch 尾 `default` fail-loud | 内部代码评审 #5 加固；行为等价复核后全门复跑绿 |
| 4 | 批内件腿 3 增 1 用例（update 缺 id ∥ close 缺 id·status ∥ query kind 外值 ∥ 入口级 P1 非对象/数组） | §11.6 腿 3 散文面补齐（内部偏差审计观察） |

**行数 ∕ 预算实读（wc-l 口径；前 = HEAD 实读）**

| 文件 | 前 → 后 | Δ |
|---|---|---|
| `thincoder-core/ledger-tools.mjs` | 188 → 251 | +63（≤300 ✓；设计估 ≈265） |
| `thincoder-core/tools/index.mjs` | 79 → 76 | −3 |
| `thincoder-core/agent/family-tools.mjs` | 187 → 187 | 0 |
| `thincoder-core/ledger.mjs` | 193 → 193 | 0 |
| `thincoder-vscode/src/agent/tool-table.mjs` | 190 → 187 | −3 |
| `docs/batches/2026-10-05-ledger-unification.test.mjs` | 新（拟新增） | 231 行（18 用例） |
| `thincoder-core/tool-docs/ledger.md` | 新（拟新增） | 496 字符 ≤ 499 |

**门读数**：`node --check` 六档全 exit 0 ∥ 批内件**红读 17/17 fail → 绿读 18/18 pass**（红读负控含「装配名集」「弃用壳」两腿）∥ `node scripts/prompt-refs-check.mjs` exit 0（J1/J2/J3 零命中）∥ `node scripts/doc-check.mjs` exit 0 ∥ `docs/batches/2026-09-29-residuals-round2.test.mjs` 12/12 pass（导出面超集判不受触）∥ 装配名集断言 = depth-0 与 depth>0 两形（恰一名 `ledger` ∧ 五旧名零交 ∧ 面内零重名 + 两变体枚举窄化）。

**审计与代码评审轮次与终态**：内部偏差审计（explore · read-only）**四类偏差零发现**（10 轮读盘 ①–⑨ 逐条 PASS；观察 = bench fixture 旧名（范围外）∥ §11.6 腿 3 散文缺口（已补））；内部代码评审（advisor · type=code）**轮次 1 = pass**（1 🟡 协调 + 4 🔵）→ fix 轮（预算机械复核 496 ≤ 499 ∥ 显式 `writeFace` + `default` 兜底）→ **轮次 2 = pass**（0 🔴、零新问题）。**终态 = clean**。

**fix round（2 轮 · 自修）**：① 批内件腿 3 补 1 用例 → 18/18 pass；② 变体形态显式化 + `default` fail-loud → 等价复核 + 全门复跑绿。

**偏差登记（如实）**：① 只读变体导出名 `ledgerReadTool` = 实施轮落定（设计档 §11.2 仅提名 `ledgerTool`——建议设计档 ∕ 交付登记补名）；② 动作级 readonly 钩子 = 父侧裁定落地（设计档将由设计者补小笔记）；③ **残留（钩子覆盖不到的工具级 `readonly` 读点）**：Phase-2 读调用转串行（`thincoder-core/agent/dispatch.mjs:244-245`）∥ `record-results` verify 失效记账对读调用生效（`thincoder-core/agent/record-results.mjs:89`）；**同判据另两处（影响零——已核）**：写前快照 `thincoder-core/agent/dispatch-run.mjs:69`（ledger 入参无 `path`/`file` ⇒ `undo-stack.mjs` 即返 ∥ 只读子代由 depth>0 家族段重挂只读变体 ⇒ 能力等价：`thincoder-core/agent/helpers.mjs:369`）；④ 范围外见闻：`bench/toolcall/fixture.mjs:67` 五旧名列表未随（§11.6 扫描未含 bench/——待父侧裁）；⑤ `scripts/tool-schema-size.mjs` ∥ `thincoder-vscode/scripts/check-vsix.mjs` ∥ 四提示词档 ∥ 需求档 = 父侧机械笔 ∕ #30 随动面舱（本舱零触，按派单）。

**随动面舱（#30）· eng-coder 实施记录（2026-10-05）**

舱位 = 随动面舱（承批档 §2 · §4 派单；10 档 = 4 提示词档 ∥ 5 文档计数/接线档 ∥ `API-CONTRACT.md` 生成区重跑）；设计权威 = `docs/core/design/LEDGER.md` §11.5 ∥ §11.7 ∥ §11.8 ∥ §11.9。

**逐面落点表（终态实读）**

| 面 | 落点 | 改动 |
|---|---|---|
| `thincoder-core/prompts/common.md` | `:158` | 读面引用 ⇒ 统一入口 `ledger` (action=query/count)（EN 部署面） |
| `thincoder-core/prompts/persona-engineering.md` | `:167` | 核销引用 ⇒ `ledger` (action=close)（EN 部署面） |
| `docs/core/design/prompts/common.md` | `:116` | 双面同拍（CN：`ledger`（action=query/count）） |
| `docs/core/design/prompts/persona-engineering.md` | `:167` | 双面同拍（CN：`ledger`（action=close）） |
| `docs/core/design/CORE-UNIFICATION.md` | 计数 **16 处**（`:65` ∥ `:80` ∥ `:86` ∥ `:96` ∥ `:164` ∥ `:166` ∥ `:410` ∥ `:645` ∥ `:1011` ∥ `:1016` ∥ `:1018` ∥ `:1039` ∥ `:1061` ∥ `:1197` ∥ `:1556` ∥ `:1557`）+ `:1375` 接线行（名称面 + 坐标收正：旧 `setup.mjs` ⇒ 现 `thincoder-vscode/src/agent/tool-table.mjs`）+ 变更记录（`:2065-2067`） |
| `docs/RELEASE.md` | `:23` ∥ `:33` ∥ `:95` ∥ `:225`（52 ⇒ **48**）+ 变更记录一行（`:422`） |
| `docs/core/design/TOOLS.md` | `:280`（计数 48）∥ `:282`（接线②终值 = 统一入口 `ledger` 随核家族段 + VSC 端侧自持退场）∥ `:1088`（§9 名称面）+ 变更记录（`:1233-1234`） |
| `docs/core/design/PROMPT-SYSTEM.md` | 计数 5 处（`:21` ∥ `:23` ∥ `:164` ∥ `:203` ∥ `:312`）+ 变更记录一行（`:530`——父侧裁定③口径「仅计数簇随 #923 收正 52 ⇒ 48；正文保留为历史」） |
| `docs/core/requirements/CORE-UNIFICATION.md` | `:19` ∥ `:117`（52 ⇒ 48）∥ `:118`（工具描述 24 ⇒ 48） |
| `docs/core/design/API-CONTRACT.md` | 生成区重跑（`--write`——2878 条 · 638 档；`ledgerTool` / `ledgerReadTool` 行 + 行号随动） |

**门读数（命令 + 结果）**

- `node scripts/api-contract.mjs --check`（重跑前）= **exit 1 · DRIFT**（盘 2872 行 ∕ 生成 2880 行——预期漂移）→ `--write`（exit 0 · 2878 条写盘）→ `--check` = **exit 0 · OK（骨架零漂移 · 2878 条 · 638 档）**
- `node scripts/doc-check.mjs` = **exit 0**（汇总：候选 48194 · **悬空 0** · 声明源缺位 0；OK(锚) 0 悬空；OK(行宽) 源域无 >300 非表格行——末次于补行后复跑）
- `node scripts/prompt-refs-check.mjs` = **exit 0**（提示词面 80 档 · 代码面 417 档 · **命中 0**）
- 批内件 `docs/batches/2026-10-05-ledger-unification.test.mjs`（`node --test`）= **18/18 绿**（旁证：五 action 对旧核函数等价 ∥ 弃用壳行为 ∥ 逐 action 守卫文案 ∥ 装配名集两形 ∥ VSC 自持点清零）
- 残渣 grep：旧五名 @ 两提示词面目录 = **0 命中**；@ 本舱 4 文档 = **0 命中**；「52」余留 = 仅变更记录/历史面与行号/议题号（逐档列报）；现盘 `thincoder-core/tool-docs/*.md` = **48 档**（glob 实测）

**决策透明表**

| # | 决策 | 依据 / 披露 |
|---|---|---|
| 1 | §11.5 枚举外另修 **8 处计数**（CORE-UNIFICATION `:164` ∥ `:166` ∥ `:410` ∥ `:645` ∥ `:1197` ∥ requirements-CORE-UNIFICATION `:118` ∥ RELEASE `:23` ∥ `:225`）+ TOOLS `:1088` §9 名称面 | D3 同拍（计数与列表同改、不留两说）——父侧裁定①④＝全采纳、不回改 |
| 2 | TOOLS `:282` 接线②行改终值形（统一入口 + VSC 自持退场 + 写三 action 可达） | §11.7「接线句改统一入口终值（VSC 坐标随现档）」 |
| 3 | design/PROMPT-SYSTEM.md 补变更记录一行（`:530`） | 父侧裁定③（扩为四档）；初读 §11.7「保留为历史（除计数簇外）」曾拟不补——父侧裁定后补，口径随裁定 |
| 4 | requirements/CORE-UNIFICATION.md **不补**变更记录行 | 该档留痕先例 = 「主 agent——需求档笔权」（`:200` ∥ `:202`）⇒ 归父侧；本行上抛（父侧随需求侧一并核） |
| 5 | 部署面 `persona-engineering.md:167`（317 字符）不折行 | 行宽闸域 = `scanDirs`（`docs`）——部署提示词档域外；该档 >300 行既存 30 行（最长 660 字符）⇒ 折单行 = 反不一致；本改动 +9 字符（前值 308）——披露不行使 |
| 6 | RELEASE `:33`（373）∥ `:95`（320）不折行 | 表格行——`isTableRow` 谓词豁免（`scripts/doc-check-width.mjs:42`）；交换 52 ⇒ 48 长度零增 |

**审计与评审轮次（终态 = clean）**

1. 内部 explore 分歧审计（1 轮 · 阻塞）：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越界）**均未发现**（✗ = 0）；6 项列报已逐条并入本段 / 终报。
2. 独立代码评审 `advisor`（type=code · 1 轮）：**VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 1）。逐发现响应：design/PROMPT-SYSTEM.md 缺留痕 ⇒ **已修**（父侧裁定③ · 复跑 doc-check exit 0）∥ requirements/CORE-UNIFICATION.md 缺留痕 ⇒ **不上修**（笔位归父侧——见决策表 #4）∥ PROMPT-SYSTEM.md §6.11 预算表读数为 as-of 2026-09-29 **不上修**（设计 §11.7「保留为历史」射程 · 报告态读数不入闸 · 下次触碰回填）。

**fix round 计数 = 1（补行）；终态 = clean。**

**披露（未触 / 上抛）**

- 未触（正确）：产品代码（#29 域）· `check-vsix.mjs` ∥ `tool-schema-size.mjs`（父侧机械笔，现盘已随动）· `requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`（父侧，现盘已随动）· 批次档 §2/§3。
- 本舱更正来源 = 父侧裁定 ①②③④（2026-10-05 线程；②＝需求侧三处归父侧核办——现盘 requirements/PROMPT-SYSTEM.md `:12` ∥ `:194` ∥ `:210` 已收正 48 ✓）。
- 域外既存「24 档」残留（`ARCHITECTURE.md` 等）＝ 2026-09-29 批已报备存量，§11.7 面清单未含 ⇒ 未触。

## §6 验证与收口（父代理）

**2026-10-05 02:2x · 验证通过 · 收口**

**交付验证（实施轮 = #29 产品面 ∥ #30 随动面 ∥ #31 实施中裁定落记 ∥ #34 实施后同步）**：

| 面 | 交回 | 父侧核验读数 |
|---|---|---|
| 产品（#29 · 12 档） | `ledger-tools.mjs` 188 ⇒ **251**（两变体 ∥ 判序 ∥ 五弃壳）∥ `tools/index.mjs` 79 ⇒ **76**（读二移除）∥ `family-tools.mjs` 187 ⇒ 187（depth-0 全量 + 全 depth>0 只读）∥ `ledger.mjs` 193 ⇒ 193（两名导出行）∥ VSC `tool-table.mjs` 190 ⇒ **187** ∥ tool-docs 五退一增（新房 **496 字符** ≤499）∥ 批内件 **231 行 / 18 用例** | 批内件 **18/18 亲跑**（含 T80/T84/T89 缝锚 ∥ 腿 5 名集断言）∥ `node --check` 六档 exit 0 ∥ 行数 251 ≤300 ✓ |
| 随动（#30 · 10 档） | 四提示词档双面 ∥ 计数簇 **52 ⇒ 48**（§11.5 列点 + D3 扩扫 8 处）∥ CU 接线行 ∥ TOOLS §6.11 / §9 ∥ 变更记录四档 ∥ `API-CONTRACT` 重跑 | `api-contract --check` **exit 0**（2878 条 · 638 档）∥ `doc-check` **悬空 0** ∥ `prompt-refs-check` **0 命中** ∥ glob 实测 tool-docs = **48 档** |
| 同步（#31 ∥ #34） | readonly 裁定落记（§11.2 / KD-unif-9）∥ 实施后同步（re-export 两名 ∥ 残留四条口径 ∥ §11.8 自指行 710 ∥ 变更行） | 逐处实读相符 ∥ `doc-check` 复跑 exit 0 |
| 仓套件 | CLI ∥ VSC `npm test` | 双绿（空清单制度态——2026-09-28 全清重置） |

**内部质控（舱内）**：两舱 explore 分歧审计 = 四类零发现；advisor 代码评审 = pass（#30：🔴0 · 🟡2——留痕已修 ∥ 笔位归父侧已办 · 🔵1——「保留为历史」射程）。

**偏差与残量登记**：① **动作级只读分类 = 实施中裁定**（#29 上报 → 父侧裁 → #31 落记 → KD-unif-9）——全量变体 `readonly:false` + `isReadonlyAction`（query / count）∥ 只读变体 `readonly:true`；② readonly 残留四条（两行为影响 ∥ 两零影响——设计档 §11.2 `:555-557` + §5）；③ bench 载荷外名单滞后 → 入账 **#931**（套件 6/6 绿——纯覆盖缺口）；④ §11.8 表体 = 设计估读（实读在 §5——表头委托句在册）；⑤ doc-check 行数面报告态差异（桌面域——非本批）。**零未登记偏差。**

**收口结算同步清单（D7）**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（52 ⇒ 48 全落）∥ 指针（§11.7 面清单全落）∥ 变更记录（CU / TOOLS / RELEASE / PS 四档 + LEDGER 五笔 523-526）∥ 待办勾销 = 台账 **#923** ∥ 前批遗留跨核 = **无** ∥ 台账面 = 核销行（settlement line）。

**提交与推送**：提交 = `a3f9e090`（产品 · 15 档）∥ `1192e77b`（文档 · 13 档）∥ 冻结笔 = 本记录（随落）；推送 = **双远端**（gitee ∥ github）。**凭证** = 本批 designId 槽位**终消费**（链终——槽值不入档）。
