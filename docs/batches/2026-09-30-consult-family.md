# 2026-09-30 · consult 同族
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #748（consult 子块发射器——同族未覆盖；#746 核面已统一）；用户 2026-09-30 23:44 批次令「别的也不该等」。
> 台账 = #748（consult 同族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目（#748 · consult 子块同族收齐）**

- **来源**：台账 #748（consult 子块发射器——#746 核面统一后仍属同族未覆盖面）；用户 2026-09-30 23:44 批次令「别的也不该等」⇒ 全线点火。
- **关键判据**：① #746 已统一的核发送面语义（`settled` 查扣 ∥ `done` 消费 ∥ `stopped` 入墓）对 consult 子块「同族同判」；② 「consult 无渲染行——不回收」旧守卫所指 = 会话条目本体（无块）、非宿主能力缺失；③ 三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）。
- **授权口径**：批次点火令（用户令）= 全线自动驾驶；设计 → 评审 → 代签 → 实施。
- **上轮在盘**：五档设计已落（上轮）；本 §1 为父侧补落（评审发现 4 随修复轮对接——评审前占位，设计判据源已在档头与 §2 上抛⑤ 登记）。

**§1 追记（父侧 · 2026-10-01 · 承 §3 轮次 3 核验放行）**：上文「关键判据 ③ 三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）」句**已过时**——消费面现口径 = **起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形**（单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 `:76/:78` 重锚版 ∥ 本档 §2 修复轮 2 块）。实施判据以 §2 最新块为准；本追记即复锚。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（consult 同族收齐批 · §2 补写轮 + 修复轮（评审 9 号逐条落位；发现 4 = §1 已由父侧落；产品码零触））
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

**【修复轮（设计评审 §3 轮次 1 · 发现 1–9 逐号 · 2026-10-01 · 父侧裁 = 全采纳）· eng-designer】**（承批档 §3 轮次 1；**产品码零触**——设计面修复；本席写域 = §2 ∥ 池档 §6.8 点名句 ∥ `CONSULTATION.md` 点名句；§1 ∥ §3–§6 零触）

**原 §2 各点（受影响文件表 ∥ 验收对照 ∥ 上抛① 归族 ∥ 边界块）及其中个句凡与本块抵触者，以本块为准**（append-only 收正形态——原文不回改）。

- **#1（>300 审视——两档各一行 · 受行 = 本档 `:50` ∥ `:56`）**：
  - `thincoder-core/agent-tools/consult.mjs`（**461 ⇒ ≤+20**——估 +14）：改动 = per-child 发射点两态收正（`⟦ev⟧done` ⇒ `⟦ev⟧settled`——`consult.mjs:200` `settleChild` ∥ `:248-250` `settle` 闭包）+ `childIds` 收集随条目携带；**无新模块职责 ∥ 无新导出族**（测试缝最小导出见 #2c——词级，非职责面）⇒ **本批不拆**。>300 存量登记面 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 次优先列表（`consult.mjs` **471**〔as-of 2026-09-25〕——「登记、暂不逐档建计划；补登时点随各档下次实质改动 / S2 接线轮」）；消解窗口 = 按该登记面。
  - `thincoder-cli/src/tui/tool-events.mjs`（**454 ⇒ ±0**——注释面 ∥ 行数守恒）：改动 = `consult_stop` 注释随动（`:257-263` 按新形收正）；**零结构改** ⇒ **本批不拆**。>300 存量登记面 = `docs/cli/design/CLI-DEBT.md` §2 **A10** 行（**454**〔as-of 2026-09-29〕；候选拆分面 = 尾部回调族（`onCompressStart`–`onTurnEnd` ≈69 行 → `tool-events-signals.mjs`）；触发式（未预拆）——「注释改指 · 行数守恒 ⇒ 不拆」先例同判）。

- **#2（验收三补——受行 = 验收对照块 `:59-67`）**：
  - （a）**回归闸（机检）**：核 `node --test`（`thincoder-core`）· 三端 `npm test`（`thincoder-desktop` ∥ `thincoder-vscode` ∥ `thincoder-cli`——各包单入口 `node test/run.mjs`）· 仓根 `node scripts/doc-check.mjs`（对比开工基线——悬空 ∥ 行宽；本批文档零新增）。**跑点 = 收口轮（父侧）**——「仓套件不写 ∕ 不改 ∕ 不跑」（全清令现行；CI 同式 = `.github/workflows/test.yml`——桌面无 CI job〔本地跑〕）；实施链内只跑批内件。
  - （b）**腿 ↔ 用例宿主映射**：宿主 = **批内件 `docs/batches/2026-09-30-consult-family.test.mjs`**（单一宿主——跨包相对 import；先例 = `docs/batches/2026-09-30-triple-end-digest-unify.test.mjs`；复跑 = 仓根 `node --test docs/batches/2026-09-30-consult-family.test.mjs`）；断言粒度 = **行为面**（事件序列 ∥ 归约态 ∥ 序位——不做源码散文锚）：
    腿 A（核发射器）→ 事件序列（`⟦ev⟧settled` ∥ `⟦ev⟧stopped`）+ 条目字段（`childIds` 表形）；腿 B（桌面渲染）→ 驻留态（`done · awaiting digestion`）+ 归档入流序；腿 C（桌面驱动展开）→ `childIds` 逐子块补发序列（reclaim ∥ freezeAll 两径）；腿 D（CLI）→ consumed 展开冻结序列 + 判据（panel 判读同判据）；腿 E（VSC）→ `reclaimDigestedBlocks` 逐子块补发序列。宿主要求致不可裸 import 的面 ⇒ 沿解析钩 / 桩面先例处置 + 如实披露（不降级判据；降级先例 = 池档 `:362`）。
  - （c）**腿 A 驱动缝**：`settleChild` 直调桩——**会话桩**（假 session 对象）+ 捕获 `onToken`；**零真实模型 ∥ 零网络**。`settleChild` 现为模块内函数（`thincoder-core/agent-tools/consult.mjs:200`）⇒ 实施轮补**最小导出面**（词级）接桩——随批披露。

- **#3（`CONSULTATION.md:198` 收正——落盘已毕）**：§6.5 接线表 settle→digest 行按 §6.2 口径收正——落点容器 = `history._pendingConsultResults` ⇒ **单容器 `_pendingAsyncResults`（+role）**；注入点 = `agent.mjs` run-start（按现档保留）；同档两处同机制异述随本轮回消。

- **#4（§1）**：**§1 已由父侧落**（本档 `:5-14`——状态行 ∥ 本批条目 ∥ 关键判据 ∥ 授权口径 ∥ 上轮在盘）——**发现 4 消**；本席零动作（§1 归主 agent 笔）。

- **#5（`TUI.md:341` 归族复核——收正 · 受行 = 上抛① `:79`）**：实读 `TUI.md:341` = 冻结头动词句 + 「挂起期**已结算待消化中间态**」中间态句——**非「done = settle 时发」族断言**（该族 = `thincoder-cli/src/tui/subagent-blocks.mjs:37-39` ∥ `:205-206` + VSC 对位注释，~7 处——本批零触）；`TUI.md:341` **移出该族**、改列「**挂起期限定句**」（其「挂起期」限定在 #746 两态统一后不完整——中间态非挂起期专属）——在册待裁（**TUI.md 本体零触**）。⇒ 上抛① 归族坐标以本块为准。

- **#6（CLI 半句改述——消张力 · 池档落盘已毕）**：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md:78`：`CLI = 本端 reclaim（consumed 实参展开 `childIds`）∥ freezeAll` ⇒ **`CLI = reclaim 点直接冻结（consumed 实参展开 `childIds` 子块，无事件补发）∥ freezeAll`**——与同条 `:76`「无补发」口径对齐（CLI 无 `⟦ev⟧done` 事件——非补发句族）。**同句族随修（一致性面——未点名两处，披露）**：批档 `:43`（机制判句）：`CLI = consumed 展开 ∥ freezeAll` ⇒ `CLI = reclaim 点直接冻结（consumed 展开 `childIds` 子块，无事件补发）∥ freezeAll`；批档 `:25`（条目②）：`CLI = 本端 reclaim（consumed 实参展开 `childIds`）∥ freezeAll` ⇒ `CLI = reclaim 点直接冻结（consumed 实参展开 `childIds` 子块，无事件补发）∥ freezeAll`——**两处原句以本块为准**。

- **#7（表内增量改界形——受行 = 本档 `:50-56`）**：增量逐行改**上界形**（原「⇒ ≈N」点估退场）：`consult.mjs` **461 ⇒ ≤+20**（估 +14）· 桌面 `suspension-drive.mjs` **294 ⇒ ≤+8**（估 +4）· VSC `suspension.mjs` **290 ⇒ ≤+8**（估 +4）· CLI `subagent-freeze.mjs` **246 ⇒ ≤+14**（估 +10）· CLI `suspension-drive.mjs` **211 ⇒ ≤+4**（估 +1）· 核 `subagent-panel.mjs` **160 ⇒ ≤+12**（估 +8）· CLI `tool-events.mjs` **454 ⇒ ±0**（注释面）；批内件 ≈150–220 行（区间估）。**口径 = 估算上界 ∥ 实施轮以盘面实读重锚**；原表各增量以本块为准。

- **#8（`CONSULTATION.md:125` 形状字面补 `childIds`——落盘已毕）**：`{id, role:"consult", report, done:true}` ⇒ **`{id, role:"consult", report, done:true, childIds}`**——与会话条目「随 settle 携该表」对齐（字段面机制单源 = 池档 §6.8）。

- **#9（行数未核标注——受行 = 边界块 `:85`）**：边界块补一句——「**产品码行数 = 未核标注**（评审面之外——表内读数为设计师 as-of 实读，未获评审逐档核对）；**实施轮以盘面实读重锚**（含增量界与越线判定）」。本句与原边界块并以生效。

**落盘清单**：本档 §2（本块）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 条 CLI 半句 `:78` + 变更记录 `:843`）· `docs/core/design/CONSULTATION.md`（§6.2 `:125` ∥ §6.5 `:198` + 变更记录 `:260`）。**其余三档零触**（RENDERER ∥ WEBVIEW ∥ TUI）∥ 池档余面零触 ∥ 产品码零触。
**零新语义 ∥ 机制裁定零动（五档机制句仅 #3 ∥ #6 ∥ #8 点名句收正）∥ §1 ∥ §3–§6 零触；两档点名句 + 本块已逐处读回（D6）。**

**【修复轮（设计评审 §3 轮次 2 · 发现 1–4 逐号 · 2026-10-01 · 父侧裁 = 全采纳）· eng-designer】**（承批档 §3 轮次 2；**产品码零触**——设计面修复；本席写域 = §2 ∥ 池档 §6.8 点名句 ∥ `CONSULTATION.md` 点名句；§1 ∥ §3–§6 零触）

**原 §2 各点及各块中个句凡与本块抵触者，以本块为准**（append-only 收正形态——原文不回改）。产品码行数值重锚 = 沿修复轮 #9 句（实施轮以盘面实读重锚）。

- **#1（消费面重锚——🔴 · 受点 = 池档 §6.8 `:76` ∥ `:78` · `CONSULTATION.md:132` · 本档条目② ∥ 机制判句 ∥ 腿 B）**：消费面口径按三端现盘重锚 = **起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形**（consult 面：桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结）——落盘已毕：
  - 池档 `:76`（家族枚举）：旧「（桌面 = reclaim ∥ 退出 freeze；VSC = reclaim ∥ 退出 freeze；CLI = 本端 reclaim ∥ freezeAll 冻结，无补发）」⇒ 新「（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形）」。
  - 池档 `:78`（consult 条）：旧「（桌面 ∥ VSC = 会话条目回收实参按 `childIds` 逐子块补发；CLI = reclaim 点直接冻结（consumed 实参展开 `childIds` 子块，无事件补发）∥ freezeAll）」⇒ 新「（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结（`reclaim` 径 = consumed 实参展开 `childIds` 子块，无事件补发））」（修复轮 1 #6「无事件补发」句存续）。
  - `CONSULTATION.md:132`：旧「会话 digest 消费窗补发…（桌面 ∥ VSC = 会话条目 `childIds` 展开；CLI = reclaim 消费判据）」⇒ 新「会话消费面补发…（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结）」。
  - 本档条目②（`:25`，含修复轮 1 #6 的 CLI 半句改述）现形以本块为准：**② 消费面补发 `done`（三端同形）**：起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结（`reclaim` 径 = consumed 实参展开 `childIds` 子块，无事件补发）∥ `freezeAll` 兜底——冻结 ∥ 归档恒落消费时点（「S 不夹运行中回合」同判）。
  - 本档机制判句（`:43`，含修复轮 1 #6 改述）现形以本块为准：消费面补发 `⟦ev⟧done`：起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形（桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结）——冻结 ∥ 归档恒落消费时点。
  - 本档腿 B 序位句（`:62`）：旧「回收 `done` ⇒ 归档入流、居消费行族之前」⇒ 新「回收 `done` ⇒ 归档入流（随到达入流——当刻流末；起跑刻语义 = 行族之后）」（对 `RENDERER.md:49` ∥ 池档 `:78` ∥ `TUI.md:539` ∥ `WEBVIEW.md:226` 同形）。
  - 同族随修（披露）：本档 `:34` 落点①括注（`:76` 一致性收正「消费面枚举「起跑窗 ∥ reclaim」⇒「reclaim ∥ 退出 freeze」」）与本块抵触——以本块为准（`:76` 现形 = 起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形）。

- **#2（主面覆盖——🔴 · 受点 = 本档受影响文件表 + 验收腿 D ∥ 腿 E）**：
  - VSC 行（`:52`）补起跑支：`thincoder-vscode/src/extension/suspension.mjs` 起跑窗段——**本轮实读 `:169-178`**（逐条补发循环 `:174-178`；`WEBVIEW.md:219` 载 `:161-167` = as-of 坐标——该档处冻结窗内零写，随实施轮实读复锚）；改动 = consult 跳过守卫（`:176`）⇒ 按 `childIds` 逐子块展开（或抽单一展开件两径共用——与 `reclaimDigestedBlocks` `:112-119` 同拍；两守卫点 = `:116` ∥ `:176`）。
  - CLI 行（`:53` ∥ `:54`）补主面调用点 + `consumed` 实参来源：主面 = `digestTurn` 起跑窗（`thincoder-cli/src/tui/suspension-drive.mjs`——起跑行族落盘后 `freezeStartSnapshot`，**本轮实读 `:103-105`**，冻结件 `:124-140`）；`consumed` 实参来源 = **起跑快照**（起跑刻 `_pendingAsyncResults` 单容器——`freezeStartSnapshot` `:125` 直读）；会话条目 `childIds` 展开随同（现 `:129` consult 跳过守卫 ⇒ 展开）；`reclaim` 接线实读 = `:212`（设计 as-of `:173` 已漂）。
  - 腿 D（`:64`）补「起跑刻展开」断言：起跑窗径 ⇒ 起跑快照按 `childIds` 展开、逐子块**起跑刻冻结入流**（主面）；腿 E（`:65`）补：起跑窗径 ⇒ 起跑快照会话条目按 `childIds` 逐子块补发 `done`（主面）。

- **#3（桌面尺寸标注——🟡 · 受行 = 本档 `:51`）**：`thincoder-desktop/src/main/suspension-drive.mjs` 补 **>300 审视线**——改动性质 = `reemitDone` consult 跳过守卫（现 `:76`）⇒ 按 `childIds` 逐子块展开（三路径共用同件：起跑支 `:150` ∥ `reclaim` `:221` ∥ `freezeAll` `:222-226`）；**无新职责 ∥ 无新导出族**（闭包内小改）。**盘面实读（`\n` 计数，同表口径，本轮）= 300**（设计 as-of = 294——#754 ∥ #768 实施后增行）⇒ 软线在线上、任何正增量即越线；审视线在场，行数值随实施轮复锚（沿 #9 句）。拆分候选面 = **残输入续发族**（`resumeResidual` `:165-196` + `resuming` ∥ `abortTombstones` `:43-45` ≈35 行 → 拟 `suspension-resume.mjs`）；**消解窗口 = 触发式（未预拆）**——本批 = 守卫收正（小改不拆）；随该面下次实质改动 ∥ 桌面结构性债务轮处置。

- **#4（批档落点坐标重锚——🔵 · 受点 = 本档 `:36-38`）**：按现盘收正（本轮逐处实读命中：`RENDERER.md:49` 携 consult 子块句 ∥ `WEBVIEW.md:776` ∥ `TUI.md:895-896` 为 consult 批记录行）——`RENDERER.md:48 ⇒ :49`（块归档面现位；`:48` = 消化行入流与重放规则条）∥ 同档变更记录 `:316-317 ⇒ :320-321` ∥ `WEBVIEW.md` 变更记录 `:774 ⇒ :776` ∥ `TUI.md` 变更记录 `:893-894 ⇒ :895-896`。
  **延后项（禁面）**：`RENDERER.md:49` 内指 CLI reclaim `:182 ⇒ :212`（现盘实读 = `:212`；`:24` 同位内指 `:182` 同漂——实读两处均在）——RENDERER ∥ WEBVIEW 处 #4 评审冻结窗 ⇒ 零写，随父侧 #4 落定后收。

- **§1③ 注明（`:12`）**：「三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）」句已过时（现口径 = 起跑窗（主面）∥ `reclaim` ∥ 退出 freeze）——§1 归主 agent 笔，本席不代写，随父侧复锚。

**落盘清单**：本档 §2（本块）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 `:76` ∥ `:78` + 变更记录 `:844`）· `docs/core/design/CONSULTATION.md`（§6.2 `:132` + 变更记录 `:261`）。**其余三档零触**（RENDERER ∥ WEBVIEW ∥ TUI）∥ 产品码零触。
**零新语义**（只重锚 ∥ 补面 ∥ 补标 ∥ 坐标——机制单源不动）∥ §1 ∥ §3–§6 零触；两档点名句 + 本块已逐处读回（D6）。

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

### 轮次 2（评审子代理）

**评审面** = 批档 + 五档（六档全文实读）· 本轮 = 跨重启重验证（旧签 TTL 未证——放行实施前终审）。落点坐标实读：池档 `:77-80` ✓ ∥ `:76` ✓ ∥ 变更记录 `:841-843` ✓；`CONSULTATION.md:132` ✓ ∥ `:173` ✓ ∥ `:258-259` ✓（`:260` = fix 轮记录 ✓）；`RENDERER.md:24` ✓（含 consult 子块句）∥ `:48` ✗（块归档面现位 `:49`；`:48` = 消化行入流与重放规则条）∥ 变更记录 `:316-317` ✗（现位 `:320-321`）；`WEBVIEW.md:219-220` ✓ ∥ 变更记录 `:774` ✗（现位 `:776`）；`TUI.md:358` ✓ ∥ 变更记录 `:893-894` ✗（现位 `:895-896`）。产品码读数：VSC `suspension.mjs` 290 与池档 §6.30.11「现档 291 行」（2026-09-29 取核后）一致 ✓；余读数未核（设计已声明）。**评审面限制**：无 Project Standards 档 ∥ 无 Document Map ⇒ Document ownership / 方法学判据按 Project Guide + 档内自述判（降级声明同轮 1 #9）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership（机制级同机制异述） | 🔴 | 消费面口径（`⟦ev⟧done` 补发面 ∥ 块归档时点）现盘分叉：`AGENT-LOOP-ASYNC-POOL.md:76`「桌面 = reclaim ∥ 退出 freeze；VSC = reclaim ∥ 退出 freeze；CLI = 本端 reclaim ∥ freezeAll 冻结，无补发」+ `:78`「CLI = reclaim 点直接冻结…」+ `CONSULTATION.md:132`「CLI = reclaim 消费判据」——三处仍把 reclaim 作唯一消费面；而三端档已按 2026-10-01 用户裁 A（起跑窗复位 ∥ 两端随正）写成「起跑窗（主面）∥ reclaim ∥ 退出 freeze（兜底幂等）」：`RENDERER.md:24` ∥ `:49`（「起跑窗（本批 2026-10-01 复位）」+「`hooks.reclaim` = 兜底幂等」）、`WEBVIEW.md:219`（「起跑窗（host 侧——主面）」∥「消化回收（兜底幂等）」）、`TUI.md:358` ∥ `:539`（「起跑点逐条冻结（主面）∥ `reclaim` = 兜底幂等」）。批档侧同族：条目②（`:25`）与修复块 `:107` 以「回收实参 ∥ reclaim 点」为展开点；`§1:12` ③「三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）」同句；腿 B（`:62`）「回收 `done` ⇒ 归档入流、**居消费行族之前**」与三端现口径相反（`RENDERER.md:49` ∥ `:78` 文档序 [.. 块][行族][归档块]；`TUI.md:539`「恒居本族之后」；`WEBVIEW.md:226` 迟到面 = 族锚位）。池档自身 `:839`（#746 记录）载「桌面起跑窗 ∥ reclaim ∥ 退出 freeze」，与 `:76` 正文相抵；本批一致性收正的依据「#747 已撤」（`:842`）已被 2026-10-01 复位推翻。 | 消费面按现盘三端档重锚为「起跑窗（主面）∥ reclaim ∥ 退出 freeze（兜底幂等）· 三端同形」——池档 §6.8 `:76` 枚举 ∥ `:78` consult 条（桌面 ∥ VSC = 起跑刻 `childIds` 展开；CLI = 起跑刻直接冻结）∥ `CONSULTATION.md:132` 半句收正；批档条目② ∥ 机制判句 ∥ 腿 B 序位句同拍（重锚后「三端同形」判据才与三端档一致）。 |
| 2 | Requirements coverage ∥ Clarity（受影响面与验收） | 🔴 | 受影响文件表与验收腿只压到兜底面、未压现主面（起跑窗）：VSC 行（`:52`）只点名 `reclaimDigestedBlocks`（`:112-119`）+ 腿 E（`:65`）；CLI 行（`:53`/`:54`）只点名 `freezeReclaimDigestedBlocks` + reclaim 接线（`:173`）+ 腿 D（`:64`）。而现盘 VSC 起跑点 = 同档 `:161-167`（`WEBVIEW.md:219` 标「主面」，与标的「兜底」`:112-119` 分列）；CLI 起跑点 = 「主面」而 `reclaim` = 「兜底幂等」（`TUI.md:539` ∥ `:358`；`:539` 已把 consult 消费判据挂在起跑点）；桌面侧由 `reemitDone`（起跑支复用——`RENDERER.md:49`）覆盖，唯 VSC/CLI 主面未覆盖。consult 会话条目本体无渲染行（`WEBVIEW.md:220`）⇒ 主面不展开 `childIds` 时，起跑刻会对会话条目本体的 id 补发 `done`（`WEBVIEW.md:231` 补桩表 `done` 行 ⇒ 折叠桩 + 立即归档），子块在起跑刻不归档——腿 D/E 可绿而主面缺口仍在（同族收齐目标不达）。 | 受影响文件表与验收腿各补起跑点主面：VSC 起跑支（`suspension.mjs:161-167` 段）同源展开 `childIds`（或抽单一展开件两径共用）；CLI 写明主面调用点及其 `consumed` 实参来源（起跑快照）——腿 D/E 各补一条「起跑刻展开」断言。 |
| 3 | 受影响文件尺寸标注（criterion 8） | 🟡 | `thincoder-desktop/src/main/suspension-drive.mjs` **294 ⇒ ≤+8**（上界 302）会越 300 软线，但表内无 >300 审视 ∥ 拆分计划行（修复轮 #1 只对 `consult.mjs` 461 ∥ CLI `tool-events.mjs` 454 两档补行——同口径未同判）。 | 该行补 >300 审视（改动性质 ∥ 无新职责 ∥ 拆分候选面 ∥ 消解窗口），或把增量上界收到不越线（如 ≤+5）并注明口径。 |
| 4 | 引用坐标（文档卫生） | 🔵 | 设计落点坐标随 2026-10-01 批漂移（设计轮「落点坐标逐处实读命中」结论已不成立）：`批档:36` `RENDERER.md:48`（标「§1.1 块归档面」）现为 `:49`；同档变更记录 `:316-317` 现为 `:320-321`；`批档:37` `WEBVIEW.md` 变更记录 `:774` 现为 `:776`；`批档:38` `TUI.md` 变更记录 `:893-894` 现为 `:895-896`；另 `RENDERER.md:49` 内指 CLI reclaim 坐标 `:182` 落后于 `TUI.md` 现载 `:212`。 | 五处坐标按现盘重锚（内容均在：`RENDERER.md:49` 携 consult 子块句 · `WEBVIEW.md:776` ∥ `TUI.md:895-896` 为 consult 批记录行 · CLI reclaim 接线现位 = `:212`）。 |

**计数**：🔴 2 · 🟡 1 · 🔵 1 · 合计 4。

**面外注（无严重级）**：① 上抛③所依邻批件（`docs/batches/2026-09-30-triple-end-digest-unify.test.mjs:448 ∥ :477`——「consult 族零补发」措辞随动 + 「夹具无 `childIds` 不变 ⇒ 仍绿」前提）在评审面之外，2026-10-01 批（#754 ∥ #765 ∥ #764 ∥ #768）后未复核；② 产品码行数 ∥ 坐标（`consult.mjs:200 ∥ :211 ∥ :248-250`、桌面 `suspension-drive.mjs:74-80 ∥ :215 ∥ :216-220`、CLI `subagent-freeze.mjs:236-244`、CLI reclaim 接线 `:173`、VSC `suspension.mjs:112-119`、`subagent-panel.mjs:33-63 ∥ :150-156`、`tool-events.mjs:257-263`）不在本评审面——设计已以修复轮 #9 声明「未核标注 + 实施轮以盘面实读重锚」。

VERDICT: changes-required

### 轮次 3（评审子代理）

**评审面** = 批档 + 五档（核验 §3 轮次 2 发现 1–4 逐号修复；六档全文实读命中）。产品码读数在评审面之外（沿修复轮 #9 句——实施轮以盘面实读重锚）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `AGENT-LOOP-ASYNC-POOL.md` ∥ `CONSULTATION.md` ∥ 本档 | 🔴 | Fixed | 消费面重锚逐处实读命中：池档 `:76`「**`⟦ev⟧done` = 消费面补发**（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形）」∥ `:78`「`⟦ev⟧done` = 消费面补发（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结（`reclaim` 径 = consumed 实参展开 `childIds` 子块，无事件补发））」；`CONSULTATION.md:132`「会话消费面补发 `⟦ev⟧done` 折叠入流（起跑窗（主面）∥ `reclaim` ∥ 退出 freeze（兜底幂等）· 三端同形——桌面 ∥ VSC = 起跑刻 `childIds` 逐子块补发；CLI = 起跑刻直接冻结）」；本档修复轮 2 块（`:118-144`）条目② ∥ 机制判句 ∥ 腿 B 同拍（腿 B 新文：「回收 `done` ⇒ 归档入流（随到达入流——当刻流末；起跑刻语义 = 行族之后）」）；变更记录落 = 池档 `:844` ∥ `CONSULTATION.md:261`。原句 supersede 依 `:120`「以本块为准」声明（append-only 惯例）。 |
| 2 | 2 | 本档（受影响文件表 ∥ 验收腿 D/E） | 🔴 | Fixed | 主面覆盖补落：VSC 行补起跑支（起跑窗段本轮实读 `:169-178`，逐条补发循环 `:174-178`，consult 跳过守卫 `:176` ⇒ `childIds` 展开，或抽单一展开件两径共用；两守卫点 = `:116` ∥ `:176`）；CLI 行补主面调用点（`digestTurn` 起跑窗——`freezeStartSnapshot`，本轮实读 `:103-105`，冻结件 `:124-140`；`consumed` 实参来源 = 起跑快照（起跑刻 `_pendingAsyncResults` 单容器——`:125` 直读）；会话条目 `childIds` 展开随同（现 `:129` consult 跳过守卫 ⇒ 展开）；`reclaim` 接线实读 = `:212`）；腿 D ∥ 腿 E 各补「起跑刻展开」断言。 |
| 3 | 3 | 本档（`:51` 行 ∥ 修复轮 2 #3） | 🟡 | Fixed | >300 审视线落：改动性质 = `reemitDone` consult 跳过守卫（现 `:76`）⇒ `childIds` 逐子块展开（三路径共用同件：起跑支 `:150` ∥ `reclaim` `:221` ∥ `freezeAll` `:222-226`）∥ 无新职责 ∥ 无新导出族 ∥ 盘面实读（`\n` 同表口径）= 300（软线在线上）⇒ 拆分候选面 = 残输入续发族（`resumeResidual` `:165-196` + `resuming` ∥ `abortTombstones` `:43-45`）→ 拟 `suspension-resume.mjs` ∥ 消解窗口 = 触发式（未预拆）。 |
| 4 | 4 | 本档 `:36-38` ∥ `RENDERER.md` | 🔵 | Fixed | 五处重锚实读命中：`RENDERER.md:48 ⇒ :49`（`:49` 携 consult 子块句 ✓）∥ 同档变更记录 `:316-317 ⇒ :320-321`（`:320-321` = consult 设计轮记录 ✓）∥ `WEBVIEW.md:774 ⇒ :776`（✓）∥ `TUI.md:893-894 ⇒ :895-896`（✓）；延后项（CLI reclaim `:182 ⇒ :212`）已由父侧落——`RENDERER.md:341`（跨档坐标随动记录）∥ `:24` ∥ `:49` 现载 `thincoder-cli/src/tui/suspension-drive.mjs:212` ✓。 |
| 5 | （1 残） | 本档 `:12`（§1③） | 🟡 | New（在册 · 父侧协调项） | `:12` 现文仍载「③ 三端消费窗实读（桌面/VSC = 回收实参逐条补发 ∥ CLI = reclaim ∥ freezeAll）」——与重锚后口径不符；已在 `:141` 注明并移交父侧（§1 归主 agent 笔）——非阻塞（R5 协调项）。 |
| 6 | （2 残） | `WEBVIEW.md:219` ∥ 本档 `:132` | 🔵 | New（披露 · 复锚在册） | VSC 起跑点坐标双 vintage：`WEBVIEW.md:219` 载「`thincoder-vscode/src/extension/suspension.mjs:161-167`」，本档修复轮 2 #2 实读 = `:169-178`——设计已披露「随实施轮实读复锚」（沿 #9 句）；建议实施轮同拍收正。 |

**计数**：前表 4 项全 Fixed；新/残 = 🔴 0 · 🟡 1 · 🔵 1（非阻塞）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-01 00:2x · [代签 · 承用户令]**

用户 2026-09-30 23:42「实活都做了」∥ 23:44「别的也不该等」= 全线点火令。本批评审 **pass**（§3 轮次 1：🔴0 · 🟡4 · 🔵5）+ 修复轮九号全落（§2 修复块 `:87-116`，逐处读回 ✓；父侧抽核两处：`CONSULTATION.md:125` 形状字面携 `childIds` ✓ ∥ `AGENT-LOOP-ASYNC-POOL.md:78` CLI 半句改述 ✓）⇒ 按令**代签放行**——实施舱按 §2 受影表派出（`consult.mjs` + 桌面 ∥ VSC ∥ CLI 三端消费面）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（consult 同族对齐批（#748）：7 档产品码 + 批内件（8/8 绿 · 负控先红后绿实证）；审计 + 代码评审 pass · 终态 clean；归父侧 = 回归闸 + 真机一条）



**实施轮（2026-10-01 · eng-coder · 承 §2 修复轮 2 块 = 最新权威面；行数 = `\n` 计数（同表口径），届盘实读）**

**实施摘要（7 档产品码 + 批内件——零越表）**

- `thincoder-core/agent-tools/consult.mjs`（461 ⇒ **471**）：`settleChild` 两态发射收正（`:206` 导出签名；`:218` `kind = session.stopped ? "stopped" : "settled"`；`:219` 发射字面单点）；`childIds` 收集（`:305-307`——relay 建立后 push，无块子块不入表）+ 会话自持表（`:428` 会话字面）；条目随 settle 携表（`:160`——**拷贝**）；模块头 ∥ `sessionSettled` 文档面随动。**最小导出面（词级——修复轮 1 #2c 测试缝）**：`export function settleChild`（原模块内函数；随批披露）。
- `thincoder-desktop/src/main/suspension-drive.mjs`（300 ⇒ **305**）：`reemitDone` consult 支（`:77-81`）由「跳过」改「按 `childIds` 逐子块补发 `ev:subagent done`」；三路径共用同件（`:155` 起跑支 ∥ `:226` reclaim ∥ `:227-231` freezeAll）；头注随动。
- `thincoder-vscode/src/extension/suspension.mjs`（301 ⇒ **310**）：抽单一展开件 `remitConsultChildBlocks`（`:108-115`）两径共用（`:126` `reclaimDigestedBlocks` ∥ `:185` 起跑窗）；「仍在 pending」守卫同拍（`:125`）；webview 侧零改。
- `thincoder-cli/src/tui/suspension-drive.mjs`（250 ⇒ **254**）：起跑窗 `freezeStartSnapshot`（`:120-144`；调用点 `:103-105`）按 `childIds` 展开、起跑刻直接冻结（显式锚 `tail + frozen`——`:139`）；reclaim 接线（`:215-216`）= 核 consumed 实参直传；`allPendingEntries` 注释面随动（`:70`）。
- `thincoder-cli/src/tui/subagent-freeze.mjs`（256 ⇒ **265**）：`freezeReclaimDigestedBlocks(state, consumed)`（`:247-265`）改 consumed 驱动（KD-CF-D——原「pending 全表反查」退场）+ `childIds` 展开（`:252`）；freezeAll 兜底零改。
- `thincoder-core/agent-tools/subagent-panel.mjs`（160 ⇒ **189**）：`consultChildKey` ∥ `consultChildUndigested` 同判据件（`:23-42`）；门控（`:81-86`——consult 子块键跳过裸键比对，防会话条目键 `consult#<sessionId>` 数字撞键）+ 门控文档行（`:52`）；`digested` 注记（`:181-184`）。
- `thincoder-cli/src/tui/tool-events.mjs`（454 ⇒ **454**——注释面行数守恒）：consult_stop 注释 `:257-263` 按新形收正（stopped 即折 ∥ 子块驻留待消费窗）。
- 批内件（新档）：`docs/batches/2026-09-30-consult-family.test.mjs`——**370 行**（设计区间估 ≈150–220 失效，重锚）；腿 A `:64` ∥ 腿 B `:102` ∥ 腿 C `:124` ∥ 腿 D1 `:232` / D2 `:254` / D3 `:271` ∥ 腿 E `:309` ∥ 负控 `:350`。

**实跑读数（批内件——实施链内唯一跑点；仓套件零跑）**

- `node --test docs/batches/2026-09-30-consult-family.test.mjs`（cwd = 仓根）：**8/8 pass**（复跑多次同读）。
- 负控「先红后绿」（可复现实证）：产品形临时翻转（`consult.mjs` 发射 kind `settled` ⇒ `done`）⇒ 腿 A + 负控**双红**（`AssertionError: 'consult#3/⟦ev⟧done…' !== 'consult#3/⟦ev⟧settled…'`）；回滚 ⇒ 复绿。判别力在盘（`assertSettleToken` 拒旧形 ∥ 旧形 token 经真 TUI 路由复现冻结/夹流症状）。
- 残留扫描（7 档）：旧形发射（consult 面 `⟦ev⟧done`）零命中；旧守卫语义（「零渲染面 ⇒ 跳过」∥「无渲染行——不回收」∥ `role === "consult") continue`）零命中；新形锚点六处逐档在场。**扫描余类**（非残留）：`subagent-panel.mjs:99/:124` = 面板手冻机制（`⟦ev⟧done` 哨兵字面——本批保留，腿 D3 断言之）；`tool-events.mjs:208 ∥ :241` = subagent/escalate 注释句（陈旧注释族在册——本批零触）。

**决策透明表（实施级）**

| # | 决策 | 理由 | 披露/影响 |
|---|---|---|---|
| 1 | 发射字面单点收进 `settleChild`（relayPrefix + emit 两参传入） | 两态（settled/stopped）与字面同点单源；测试缝直调即捕获真字面（负控先红可复现） | `settle` 闭包（原字面点）改传参——与修复轮 1 #1「两发射点」同判 |
| 2 | `childIds` 存字符串（relay 号） | 块键形 `consult#<N>` 字符串键 ∥ 与会话条目字段逐字同形；三端字符串拼接命中（`render-core/subblocks/channel.mjs:34`） | 载荷 `id` 原样传——两端皆字符串拼接 |
| 3 | 条目携表 = **拷贝** | 会话对象 settle 后即弃；防可变共享面 | 测试断言拷贝性 |
| 4 | CLI reclaim = 核 consumed **差集实参**（非起跑快照） | KD-CF-D「收 consumed 实参」；差集另覆盖会话内用户回合径（快照仅 digest 径） | 批档 §2 #2 句「consumed 来源 = 起跑快照」按实读重锚（见下） |
| 5 | panel：consult 子块键跳过裸键比对、改判 childIds 判据 | 会话条目键与子块键可数字撞键（假拒/假过面） | 同判据（会话在跑 ∥ 条目在 pending）——与回收 ∥ 补发同源 |

**口径重锚记录（届盘实读 · 沿修复轮 #9 句）**

- 行数：consult 461⇒471（界 ≤+20 ✓）∥ 桌面 300⇒305（>300 审视线在册——修复轮 2 #3；数值重锚）∥ VSC 301⇒310（开工即 301 越线——本批 +9；**>300 审视线补于本段**：改动性质 = 起跑支 ∥ 兜底共用展开件（无新职责 ∥ 无新导出族）；拆分候选面 = 存活投影 ∥ 计数助手族（`poolCounts` `:64-72` ∥ `reassertLiveChildren` `:77-106` ≈45 行，拟外提 `suspension-project.mjs`）；消解窗口 = 触发式（未预拆））∥ CLI subagent-freeze 256⇒265（界 ≤+14 ✓）∥ CLI suspension-drive 250⇒254（界 ≤+4 ✓）∥ panel 160⇒189（估 ≤+12 超——+29；<300 无越线面）∥ tool-events 454⇒454（守恒 ✓）∥ 批内件 370（区间估失效）。
- 批档 §2 #2 句「`consumed` 实参来源 = 起跑快照」与实读不符（实读 = 核 `hooks.reclaim(consumed)` 差集实参，`thincoder-core/agent/suspension.mjs:225/:247/:271`；起跑快照只喂 `freezeStartSnapshot`）——机制零差、文本重锚（本段即复锚）。
- 陈旧注释族新增候选（在册 · 零触）：`thincoder-core/agent-tools/async-settle.mjs:271`「无 TUI 冻结事件——子块各自冻结」与 #748 新形抵触（该档本批裁定零触）。

**审计与代码评审轮次与终态**

- 分歧审计（read-only explore · 轮 1）：findings = 2 🟡（§5 空段 ∥ VSC 越线无落点）+ 建议腿 E 精度加严 ⇒ 已处置（§5 落本段 + 腿 E 加「起跑窗三发先于回合执行」断言 `:339`）；产品面结论 = 零漏做 ∥ 零静默简化 ∥ 零越表。
- 代码评审（advisor · 轮 1 · code）：**VERDICT: pass**（0🔴；1🟡 = VSC 310 越 300 软线无落点——本段消解；4🔵 = 桌面 305 数值重锚 ∥ consult/tool-events 存量登记 ∥ 批内件 370 区间估失效 ∥ consumed 来源句失准——均本段收正）。正向核验：腿 A–E + 负控与设计对位；三端消费面与池档 §6.8 `:76/:78` ∥ `CONSULTATION.md:132` 逐条同判。
- **终态：clean**（0🔴；🟡/🔵 全部随本段落盘/登记，代码面零遗留）。
- 归父侧（收口轮）：回归闸（核 `node --test` ∥ 三端 `npm test` ∥ `node scripts/doc-check.mjs`）+ 真机一条（任一可用端 ≥2 consultant 实跑——驻留 → 消费窗归档 ∥ 运行中回合零夹流）——实施链内零跑（全清令）。

**验证面限制**：审计 ∥ 评审皆静态实读（无执行面）；批内件 8/8 与先红实证读数 = 本席实跑报告（仓套件不可复跑面归父侧）。**越表项披露**：零（改动 = 7 档产品码 + 批内件，恰受影表 + 新测试档）。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**：① **父侧亲跑复验**：批内件独立复跑 = **8/8 绿**（腿 A ∥ B ∥ C ∥ D1–D3 ∥ E ∥ 负控——新形复绿；复刻实施舱读数）；② 实施面 = 7 档产品码 + 批内件 370 行（越表项零）；口径重锚五条（VSC 310 越线审视线在册 ∥ 桌面 305 ∥ panel 实增 +29 ∥ 批内件 370 ∥ `consumed` = 差集实参）随 §5 在册；③ 审计 1 轮 CLEAN ∥ 代码评审轮 1 pass（0🔴——🟡/🔵 全处置）；④ **真机一条（≥2 consultant：子卡驻留 → 消费窗归档 ∥ 运行中回合零夹流）= 候实跑时机**（父侧观察项——非阻塞）；⑤ 陈旧注释族新增候选（`async-settle.mjs:271`）= 已并入台账 #753 同族；⑥ 台账结算：`#748 → 已核销`；⑦ D7 对账：角色表 §1–§6 ✓ ∥ 状态行 ✓ ∥ 计数（7 档 + 批内件）✓ ∥ 指针（批档 ↔ 台账 ↔ 设计面）✓。**收口完成 ⇒ 冻结。**
