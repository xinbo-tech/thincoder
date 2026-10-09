# 2026-10-10 · doc-sync-tail
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:07「全自动」波尾文档随动（两批原档已收口冻结——其 sibling 文档随正轮的记录面转本档：Ⅹvsc-consistency 面 = eng-coder #100 已落；Ⅳpurge-residue 面 = eng-coder #102 在航）。
> 台账 = #1127（core · 归批）。前情 = docs/batches/2026-10-10-vsc-consistency.md（已收口 2026-10-10 · 其文档随动面转本档）∥ docs/batches/2026-10-10-purge-residue-sweep.md（已收口 2026-10-10 · 其文档随动面转本档）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-10 03:07「全自动」波尾——两批（`2026-10-10-vsc-consistency.md` ∥ `2026-10-10-purge-residue-sweep.md`）的**文档随动 sibling 轮**在其原档收口后仍须落笔（机制实证：已收口档拒回改——两轮的 §5 均被工具拒，记录面转本档）。**台账记法**：承 `#1127` 面尾项（无新增行——本档 = 记录面承档；#1127 已于 Ⅳ 收口时核销，其「doc 指针/计数随动」尾项即本档所载）。

**本档承载**：① Ⅹ 面（eng-coder #100）——**已落**：7 档随正（`AGENT-LOOP-ASYNC-POOL.md` §6.20 引用面 11 处 ∥ `WEBVIEW-PROTOCOL.md` 计数三处 ∥ `SETTINGS.md`(vsc) §2.16 ∥ **`PROJECT-SWITCHER.md` §3.1 新节** ∥ `API-CONTRACT.md` 生成区全量重生成 3336 ⇒ 3349）+ CORE-UNIFICATION 随批小收（§2.1 B9 旧址标）；其 §5 未写入（原档冻结）——落点与读数见 §6。② Ⅳ 面（eng-coder #102）——**在航**：设计档 9 档落点 + `#1127` 三处 doc 指针/计数随动 + 需求档回指 + **`MODEL-SPECS.md:115` 补列**（父侧令）；报告到后并录 §6。

**父侧补列与裁定**：`API-CONTRACT` 重生成 = **全量**（(a) 案——生成器唯一笔 + 逐行分类披露；悬空 5 ⇒ 4 为预期副效）∥ `MODEL-SPECS.md:115` = **补列**（Ⅳ 设计只列 `:179`/`:215`/`:2136`——`:115` 为已知陈旧、有意移出者）∥ `PROJECT-SWITCHER.md` = **补列**（`:30` 现形句与 #1101㈠ 相抵——随正 + 补 §3.1）。

**状态**：进行中（待 #102 交付 + doc-check 悬空 4 清账）。

**补正（2026-10-10 · 父侧 · #102 上抛·待裁回执）**：§1 所列「需求档回指」的执行归属 = **主 agent 笔**（Ⅳ 档 §2 边界行「需求档 = 主 agent 笔，本批只回指不写」+ D1 矩阵——两处同判）；eng-coder #102 **不写**需求档，交付报告附建议判据句 + 落点建议，由父侧落笔。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**交付物（两轮并录）**：**Ⅹ 面（eng-coder #100）**——7 档随正（`AGENT-LOOP-ASYNC-POOL.md` §6.20 引用面 11 处 + 协调项行删 ∥ `AGENT-LOOP-SUBAGENT.md` §6.25 边界句 ∥ `API-CONTRACT.md` 生成区全量重生成 3336 ⇒ 3349 ∥ `WEBVIEW-PROTOCOL.md` §13/§12 两行 + §3.2 计数三处 ∥ `SETTINGS.md`(vsc) §2.16 ① ∥ **`PROJECT-SWITCHER.md` §3.1 新节**（锚语义 + 边界句）∥ `CORE-UNIFICATION.md` §2.1 B9 旧址标）；审计 1 轮（1 🟡 实修——D-P11 计数未随 ⇒ 自修）+ 评审 pass（0🔴 ∥ 2🟡 越射程 ∥ 3🔵）。**Ⅳ 面（eng-coder #102）**——8 档落讫（PROVIDER §6.16/§6.18 落 B ∥ RENDER-CORE KD-RC-14/C14 ∥ COMPOSER KD-78/T-DSK64 ∥ IPC `session:prefs` 行 ∥ SETTINGS §2.20 + §3.1 两行 ∥ PROXY §4 写径归一注 ∥ MODEL-SPECS 八笔（`:115` 补列改指 + 消费点八 ⇒ 七）∥ CORE-UNIFICATION §2.5 去 vision-channel）；`API-CONTRACT` = 复核零改（改指条件已满足）；审计零命中 ∥ 评审 pass（🟡-1/🔵-3 收正）。**两轮 §5 均未写入**（原档收口冻结——机制拒；内容与读数随本档）。

**父侧验证读数**：`node scripts/doc-check.mjs` ⇒ **exit 0 · 闸内 0 悬空**（波内 5 ⇒ 0 全清）∥ 行宽 OK ∥ `node scripts/api-contract.mjs --check` = 骨架零漂移（3349 条 · 728 档）。**父侧落笔**：KD 索引两行（KD-77/KD-78——`docs/desktop/design/PROJECT.md` §2）∥ `API-CONTRACT.md` 变更记录补行（`:3460`）∥ `SETTINGS.md`（桌面）变更记录补行（`:569`）∥ 内层三处小形（ASYNC-POOL `:323` 自指档名 ∥ CORE-UNIFICATION `:364` 补〔已退役〕标 ∥ `:1197` 删失效例证）。

**上抛处置**：#100——1/2（CORE-UNIFICATION 两处）⇒ **已落**（见上）∥ 3（ASYNC-POOL 自指档名）⇒ **已落** ∥ 4（PROJECT-SWITCHER 两套 as-of 基准）⇒ 知会记录（勿混读；零动作）∥ 5（API-CONTRACT 变更条）⇒ **已落**。#102——§3.2 归属口径 ⇒ **裁②**（措辞收窄「§3.1 行数」；§3.2 无本批块 = 沿先例；原落点行在冻结档内 ⇒ 本档记明实况）∥ KD-78 索引 ⇒ **已落**；T-DSK64 **撞号**（2026-10-07 SETTINGS 面先占）⇒ 并号裁定（先占先得）入账 **#1197**（COMPOSER 面 ⇒ T-DSK67 等全映射在册）∥ PROVIDER `:576` 坐标 ⇒ 记录（as-of）∥ 行数滞读四条 ⇒ 入账 **#1196** ∥ i18n.mjs 键链 ⇒ #1190（在册）。

**待办**：波尾 scoped commits + 仓套件单跑（波内唯一跑点）。
