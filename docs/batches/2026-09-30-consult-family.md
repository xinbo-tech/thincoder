# 2026-09-30 · consult 同族
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #748（consult 子块发射器——同族未覆盖；#746 核面已统一）；用户 2026-09-30 23:44 批次令「别的也不该等」。
> 台账 = #748（consult 同族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目（#748 · consult 子块同族收齐）**

- **来源**：台账 #748（consult 子块发射器——#746 核面统一后仍属同族未覆盖面）；用户 2026-09-30 23:44 批次令「别的也不该等」⇒ 全线点火。
- **关键判据**：① #746 已统一的核发送面语义（`settled` 查扣 ∥ `done` 消费 ∥ `stopped` 入墓）对 consult 子块「同族同判」；② 「consult 无渲染行——不回收」旧守卫所指 = 会话条目本体（无块）、非宿主能力缺失；③ 三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）。
- **授权口径**：批次点火令（用户令）= 全线自动驾驶；设计 → 评审 → 代签 → 实施。
- **上轮在盘**：五档设计已落（上轮）；本 §1 为父侧补落（评审发现 4 随修复轮对接——评审前占位，设计判据源已在档头与 §2 上抛⑤ 登记）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（consult 同族收齐批 · §2 补写轮（上轮五档已落盘 ∥ 产品码零触 ∥ 依赖 #746 已落））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

【§2 补写轮（fix · 单点——档头占位已填后直写；设计内容 = 上轮已落五档直读即取 · 零重设计 · 产品码零触）· eng-designer】

**本批条目（覆盖 · 台账 #748「consult 子块发射器——同族未覆盖」；用户 2026-09-30 23:44 批次令「别的也不该等」——不挂条件）**

① **子块 settle 对齐全族**：consult 子块 settle 与全族同发 `⟦ev⟧settled`（`consult.mjs` per-child 单点——区块驻留「done · awaiting digestion」；不再 settle 即折）。
② **消费窗补发 `done`（三端展开）**：桌面 ∥ VSC = 会话条目回收实参按 `childIds` 逐子块补发；CLI = 本端 reclaim（consumed 实参展开 `childIds`）∥ freezeAll——冻结 ∥ 归档恒落消费时点（「S 不夹运行中回合」同判）。
③ **取消径**：会话 stopped（consult_stop ∥ cleanup）⇒ 子块 settle 发 `⟦ev⟧stopped` 即折（消费永不来——与四族取消面同判）。
④ **`childIds` 映射**：会话自持 `childIds`（= 子块 relay 号——块键形 `consult#<N>` 的 N；无块子块不入表），会话条目随 settle 携该表——消费窗三端展开同源。
⑤ **panel 消费判读同判据**：`digested` 注记 ∥ `panelFreezeGate` 对 consult 子块按同判据（会话在跑 ∥ 会话条目在 pending ⇒ 未消化）——与回收 ∥ 补发判据同源。

**裁定（上轮）= 对齐形 · 无例外三件**：「consult 无渲染行——不回收」旧守卫所指 = 会话条目本体（无块）、非宿主能力缺失 ⇒ 子块按 `childIds` 展开收全族；宿主能力例外通道不适用（三端对位物齐全）。**依赖** = #746（核面 settle 两态统一）已落盘（`async-settle.mjs:279` 现态——本批只消费其成果）。

**设计档落点（五处 · 上轮已落盘 + 读回；本轮零改动）**

- ① `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`：§6.8 **consult 子块同族收齐**条 `:77-80` + `:76` 一致性收正（消费面枚举「起跑窗 ∥ reclaim」⇒「reclaim ∥ 退出 freeze」）+ 变更记录 `:841-842`。
- ② `docs/core/design/CONSULTATION.md`：`:132`（§6.2）· `:173`（§6.3）· 变更记录 `:258-259`。
- ③ `docs/desktop/design/RENDERER.md`：`:24`（§1 挂起窗行）· `:48`（§1.1 块归档面）· 变更记录 `:316-317`。
- ④ `docs/vsc/design/WEBVIEW.md`：`:219-220`（§5.1 消化回收条）· 变更记录 `:774`。
- ⑤ `docs/cli/design/TUI.md`：`:358-359`（§6.8.1 已结算待消化态条）· 变更记录 `:893-894`。

**机制判句**（单源 = `AGENT-LOOP-ASYNC-POOL.md` §6.8 consult 子块条——各档引用不重述）

- settle ⇒ `⟦ev⟧settled`（两态统一——与全族同）；区块驻留「done · awaiting digestion」。
- 消费窗补发 `⟦ev⟧done`：三端展开（桌面 ∥ VSC = `childIds` 逐子块补发；CLI = consumed 展开 ∥ freezeAll）——冻结 ∥ 归档恒落消费时点。
- 取消径 ⇒ `⟦ev⟧stopped` 即折（消费永不来）。
- `childIds` 映射 = 会话条目随 settle 携表（relay 号；无块子块不入表）。
- panel 消费判读同判据（会话在跑 ∥ 会话条目在 pending ⇒ 未消化）——回收 ∥ 补发 ∥ 判读三面同源。

**受影响文件与测试面（实施轮；内容行数口径 = 盘面字节实读〔`\n` 计数〕· 2026-09-30 实读）**

- `thincoder-core/agent-tools/consult.mjs`：**461** ⇒ ≈475（发射器两态：`settleChild` 发射点 `:211` ∥ `settle` 闭包 `:248-250`；`childIds` 收集 + 随条目携带）。
- `thincoder-desktop/src/main/suspension-drive.mjs`：**294** ⇒ ≈298（`reemitDone` `:74-80`——consult 跳过守卫 ⇒ 按 `childIds` 展开；`reclaim` `:215` ∥ `freezeAll` `:216-220` 两径同）。
- `thincoder-vscode/src/extension/suspension.mjs`：**290** ⇒ ≈294（`reclaimDigestedBlocks` `:112-119`——会话条目 ⇒ `childIds` 逐子块补发；「仍在 pending」守卫同拍）。
- `thincoder-cli/src/tui/subagent-freeze.mjs`：**246** ⇒ ≈256（`freezeReclaimDigestedBlocks` `:236-244`——consumed 形参 + 判据）。
- `thincoder-cli/src/tui/suspension-drive.mjs`：**211** ⇒ ≈212（reclaim 接线 `:173`——传 consumed 实参）。
- `thincoder-core/agent-tools/subagent-panel.mjs`：**160** ⇒ ≈168（判读随动——`panelFreezeGate` `:33-63` ∥ `digested` 注记 `:150-156` 补 consult 子块判据）。
- `thincoder-cli/src/tui/tool-events.mjs`：**454** ⇒ ≈454（注文随动——consult_stop 注释 `:257-263` 按新形收正〔done ⇒ stopped 即折〕）。
- 批内件（新档）：`docs/batches/2026-09-30-consult-family.test.mjs` ≈150–220 行（随批档归档 · 复核复跑用）。

**验收对照**

- 腿 A（核发射器）：per-child settle ⇒ `⟦ev⟧settled`（非 `done`）；会话 stopped ⇒ `⟦ev⟧stopped`；会话条目携 `childIds`（无块子块不入表）。
- 腿 B（桌面渲染）：子块 `settled` ⇒ 驻留「done · awaiting digestion」（不冻结）；回收 `done` ⇒ 归档入流、居消费行族之前。
- 腿 C（桌面驱动展开）：会话条目（reclaim ∥ freezeAll 两径）⇒ `childIds` 逐子块补发 `ev:subagent done`。
- 腿 D（CLI）：reclaim consumed 展开 + 判据（会话在跑 ⇒ 不冻）；panel 判读同判据。
- 腿 E（VSC）：`reclaimDigestedBlocks` 会话条目 ⇒ `childIds` 逐子块补发。
- 负控：settle 面零冻结 ∥ 零夹流（旧形〔settle 即 `done`〕先红 ⇒ 新形复绿）。
- 真机一条：任一可用端真跑一轮 consult（≥2 consultant）——子卡驻留至消化、回收点归档入流（居消费行族前）、运行中回合零夹流。

**关键决策（KD-CF-A–E · 含被否）**

- **KD-CF-A（对齐形 · 无例外）**：consult 子块收全族（settle ⇒ `settled`；消费窗补发；stopped ⇒ `stopped`）。**被否**：维持 settle 即折（旧 per-child `done`——违「S 不夹运行中回合」，即本批要消的冻 ∥ 夹症状）；**被否**：为 consult 另造事件型 ∥ 第二套判据（零新事件型 = 红线——同族同判）。
- **KD-CF-B（映射 = 会话自持 `childIds`）**：relay 号表随会话条目 settle 携带——三端展开同源。**被否**：三端各自反查（前缀扫描 ∥ 会话遍历——判据漂移面）；**被否**：改块键形（`consult#<N>` 既定键形不动）。
- **KD-CF-C（消费判据三面同源）**：回收 ∥ 补发 ∥ panel 判读同判据（会话在跑 ∥ 会话条目在 pending ⇒ 未消化）。**被否**：会话 settle 即批量全消（digest 文本未注入先折——序错）。
- **KD-CF-D（CLI 形 = consumed 展开）**：`freezeReclaimDigestedBlocks` 收 consumed 实参 + `childIds` 展开；freezeAll 兜底不变。**被否**：沿 `allPendingEntries` 全表反查（回收点判据与两端不同源）。
- **KD-CF-E（落点面 = 产品码七档）**：`consult.mjs` ∥ 桌面 `suspension-drive.mjs` ∥ VSC `suspension.mjs` ∥ CLI `subagent-freeze.mjs` + `suspension-drive.mjs` ∥ 核 `subagent-panel.mjs` ∥ CLI `tool-events.mjs`；**零触** = `async-settle.mjs` ∥ `thincoder-render-core/**` ∥ 记录/协议面 ∥ digest 文本 ∥ 生命周期/中止/设置面。**被否**：动 `async-settle.mjs`（核面 #746 已统一——本批只消费其成果）。

**上抛（在册）**

- ① 陈旧注释族（~7 处 + `TUI.md:341`）——「done = settle 时发」句族（例 `thincoder-cli/src/tui/subagent-blocks.mjs:37-39` ∥ `:205-206`；VSC 对位注释同族；`TUI.md:341` 族内档句）；本批零触、在册待裁。
- ② `finishSubTasksByRole` dead-export 候选（定义 `thincoder-cli/src/tui/subagent-freeze.mjs:187`；import ∥ re-export 面在场、现行零调用点）；本批零触、在册待裁。
- ③ 邻批件腿 3c 措辞随动（`docs/batches/2026-09-30-triple-end-digest-unify.test.mjs:448` ∥ `:477`——「consult 族零补发」⇒「会话条目本体零补发 · 子块按 `childIds` 展开」；夹具无 `childIds` 不变——**仍绿**）；本批不修。
- ④ 本批一致性收正 2 处（已随落盘）：消费面枚举收正（`AGENT-LOOP-ASYNC-POOL.md:76`——#747 已撤残句）；`async-settle.mjs` 坐标 `:272-278 ⇒ :279`（同档 `:842`）。
- ⑤ §1（讨论段）归主 agent 笔——现为占位；本 §2 条目 ∥ 判据源 = 台账 #748 ∥ 用户 2026-09-30 23:44 批次令 ∥ 上轮五档在盘设计。

**边界（本批不做）**：五档设计文档零改动（上轮已落）；产品码 = 实施轮（本设计轮零触）；零触面 = `async-settle.mjs` ∥ `thincoder-render-core/**` ∥ 记录/协议面 ∥ digest 文本 ∥ 生命周期/中止/设置面。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面** = 批档 + 五档设计（六档全文实读）。**落点坐标逐处实读命中**：`AGENT-LOOP-ASYNC-POOL.md:77-80` ∥ `:76` ∥ `:841-842`；`CONSULTATION.md:132` ∥ `:173` ∥ `:258-259`；`RENDERER.md:24` ∥ `:48` ∥ `:316-317`；`WEBVIEW.md:219-220` ∥ `:774`；`TUI.md:358-359` ∥ `:893-894`——四处一致。机制单源 = §6.8（余档指针化、无重述）✓；批条目 ①–⑤ ⇒ 验收腿 A–E 全覆盖 ✓；受影响文件集与五档「产品码随动」句自洽 ✓。产品码行数在评审面之外（未核）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件尺寸标注 | 🟡 | 受影响文件表（批档 `:42` ∥ `:48`）对两档已越 300 软线且本批触碰的档未给 >300 档审视∕拆分计划：`thincoder-core/agent-tools/consult.mjs`（461 ⇒ ≈475）、`thincoder-cli/src/tui/tool-events.mjs`（454 ⇒ ≈454）——同项目先例 = `AGENT-LOOP-ASYNC-POOL.md:507-521`（§6.30.6 审视块）∥ `:322-327`（§6.20.4 拆分计划）。两档均 <500 ⇒ 非硬限违规。 | 表内为该两档各补一行 >300 审视（改动性质 ∕ 无新职责 ∕ 拆分候选面 ∕ 消解窗口），或指向既有登记面（债务档 ∥ `CORE-UNIFICATION.md` §2.8.1）。 |
| 2 | 验收标准 | 🟡 | 验收对照（批档 `:51-59`）缺三面：① 回归∕机检闸（核 `node --test` + 三端 `npm test` + `doc-check` 零新增——同项目先例 = `AGENT-LOOP-ASYNC-POOL.md:375` A6 ∥ `:704` A-TW13）；② 腿 A–E ⇒ 用例宿主∕断言粒度映射（批内件已点名、腿未落点）；③ 腿 A 驱动缝未钉（会话桩 ∥ `settleChild` 直调——零真实模型）。 | 补三行：回归闸（逐端命令）· 腿↔用例映射表 · 腿 A 桩驱动缝（`settleChild` 直调，零真实模型）。 |
| 3 | 文档状态（R7a） | 🟡 | `CONSULTATION.md:198`（§6.5 端级接线表 settle→digest 行）仍写落点容器 = `history._pendingConsultResults`、注入点 = `agent.mjs` run-start——与同档 `:125`（§6.2「移入 pending 单容器 `_pendingAsyncResults`（+role——原独立族流退役）」）相抵；本批收正面只落 §6.2 ∥ §6.3（`:132` ∥ `:173`），未扫 §6.5（先于本批存在）。 | 同档 §6.5 该行按 §6.2 口径收正（或加「历史接线面」标）——同档两处同机制异述建议随本轮一并收。 |
| 4 | 协调项（R5） | 🟡 | 批次档 §1（讨论段）仍为模板占位（`:6-7`）——判据源（台账 #748 ∥ 用户 2026-09-30 23:44 批次令 ∥ 上轮在盘五档）已在档头与 §2 上抛⑤（`:75`）登记。 | 补落 §1（本批条目 ∥ 关键判据 ∥ 授权口径），或在 §1 注明「讨论面归台账 #748 ∥ 用户批次令」。 |
| 5 | 文档引用（登记面） | 🔵 | 上抛①（`:71`）把 `TUI.md:341` 列入「done = settle 时发」陈旧句族；实读该行为冻结头动词句（「挂起期**已结算待消化中间态**——等待消化，面板显示 `done · awaiting digestion`」——其「挂起期」限定在 #746 两态统一后已不完整，非该族断言）。 | 复核该族坐标（或按「挂起期限定句族」重述归族依据）。 |
| 6 | 措辞清晰度 | 🔵 | 「三端展开 ∕ 消费窗补发 `⟦ev⟧done`」句（`AGENT-LOOP-ASYNC-POOL.md:78` ∥ 批档 `:35`）把 CLI 列进 `done` 补发句族，与同档 `:76`「CLI = 本端 reclaim ∥ freezeAll 冻结，**无补发**」成张力（CLI 侧无 `done` 事件，为 reclaim 点直接冻结）。 | CLI 半句改述为「reclaim 点直接冻结（consumed 实参展开子块，无事件补发）」。 |
| 7 | 尺寸标注形（criterion 8） | 🔵 | 表内增量以「⇒ ≈N」点估落笔（`:42-48`），非 `≤±N` 界形（同项目先例 = `AGENT-LOOP-ASYNC-POOL.md:306-320` ∥ `:648-650` 的 `+N/−N` 形）。 | 改界形（如 `461 ⇒ ≤+20`）或行内注明「估算口径 ∕ 实施轮重锚」。 |
| 8 | 语义悬空（轻） | 🔵 | `childIds` 映射落点 = `AGENT-LOOP-ASYNC-POOL.md:79`「会话条目随 settle 携该表」，但条目形状声明句（`CONSULTATION.md:125` 字面 `{id, role:"consult", report, done:true}`）未同步携 `childIds`。 | 该字面补 `childIds` 字段（或加「字段面以 §6.8 条为准」半句）。 |
| 9 | 评审面限制 | 🔵 | 无 Project Standards 档 ∥ 无 Document Map ⇒ Document ownership 判据降级（按 Project Guide + 档内自述判）；受影响产品码 7 档在评审面之外，行数标注未逐档实读核对（表内读数为「未核」）。 | 实施轮以盘面实读重锚（沿同项目「实施后重锚」惯例）。 |

**计数**：🔴 0 · 🟡 4 · 🔵 5 · 合计 9。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
