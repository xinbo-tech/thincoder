# 2026-09-29 · 桌面状态行 ⇒ CLI 补漏（上下文段 ∕ 台账计数段）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 13:07 桌面走查（状态行仍未对齐 CLI：上下文段缺令牌 ∕ 台账计数零常驻）+ 13:11「开」；父侧三方对账完成（台账 #600）。
> 台账 = #600（desktop · 归批）。前情 = docs/batches/2026-09-28-statusline-align.md §1（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

- 用户 2026-09-29 13:07 桌面走查（原话）：「状态栏说了无数次，最终还是没跟cli对齐……上下文那里只显示了个24%，cli显示很全，cli还有台账计数，desktop也没有。」
- 13:11：「**开**，我顺便测试一下完整功能。」——批点燃；实施期间用户继续走查（新发现另记，不入本批面）。

### 1.2 已核事实（父侧三方对账 · 2026-09-29 13:0x；台账 #600 同账）

**对账结论 = 17 段里仅两段未对齐**——余 15 段（段集 ∕ 段序 ∕ 字色 ∕ 分隔 ∕ 刷新拍）已由 R11 + 屏面为准批对齐，**不重开**。

| # | 缺口 | 桌面现址 | CLI 对位（逐字基准） |
|---|---|---|---|
| 1 | 上下文段缺「词 + 令牌数」——只渲裸百分比 `24%` | `thincoder-desktop/renderer/views/statusline-segments.mjs:162-172`（词表 `status.usage`=`${percent}%`，`renderer/i18n.mjs:234/:391`） | `thincoder-cli/src/tui/render-frame.mjs:413-416` = `context ${pct}%${tokens}`（令牌 = `estimateTokens(history)`；核 `token-window.mjs:17` 现成导出） |
| 2 | 台账段零常驻计数——仅超阈时渲「可开批」（CLI 状态段无此形） | `statusline-segments.mjs:175-186`（`ledgerSegment`） | 核 `ledger.mjs:145-147` `formatMarker` = `台账 ${pool}·${tech}`（`ledger-surface.mjs:52` 每 120s 刷；老化>0 ∕ 死执行者警示色） |

**数据面现状（修复可行性已证）**：

- 上下文令牌：桌面 host `src/main/agent-host.mjs:141-146` 已算 `percent`（载荷 `{key, percent, tokens, timers}`——`tokens` 为累计五键、**非**上下文令牌 ⇒ 需另补 `contextTokens` 字段；核现成导出可直接用）。
- 台账计数：桌面主进程每拍写 `LEDGER_STATE.ledger.marker`（`src/main/project-info.mjs:50-52` 自注「本端只作载体，不消费该标记」；拍面起于 `:129-136`）——**数据已在手、零消费**；`ledger:read` 计数 `{pool,tech,aged}`（`:38-48`）落 `projectInfo` 亦无消费面。

**根因（父侧）**：设计表行 11 把计数「旁置」到「项目级读数行 `[data-slot="info"]`」（`docs/desktop/design/UI.md:116`）——该行随左列裁撤退场（`renderer/mount-info.mjs` 档头自述「信息行视图随左列裁撤退场」），裁撤轮未重新指定消费面 ⇒ 计数成孤儿；行 9（`UI.md:114`）只写「上下文 %」，令牌数从未入账。

### 1.3 批面（授权口径）

- ① 上下文段 ⇒ CLI 形（en 逐字；zh 对应译形）——host 载荷补 `contextTokens` 字段 + 渲染面消费；
- ② 台账段 ⇒ 核 marker 转发 + 常驻渲（`台账 N·M`；老化>0 警示色）；现 tooltip 明细面保留；「可开批」信号按 CLI 现状口径处置（设计轮定）；
- ③ 文档随动：`UI.md` 行 9 ∕ 行 11 收正（重新指定消费面）+ IPC 载荷注 + i18n 计数链；
- 邻件（设计回执中明示并轨裁定）：#581（段 14 窗内提示态 · 同 `statusline.mjs`）· #598③（UI.md 段计数回填）；**并轨若超本批面须回用户**；
- **边界**：只动两段 + 必要载荷字段 + 文档随动；不重开已对齐段；核件（render-core）零改——若设计判必改须明示理由。

### 1.4 判据与验收

- 形式判据 = **屏面逐字**：en 与 CLI 同读数逐字一致（zh = 对位译形）；
- 验收 = 真机对照（父侧跑：隔离实例 + 用户实机两径读数与 CLI 并读）；
- 链：设计 → 评审（用户点）→ 批准（用户签）→ 实施 → 父侧真机复核。

### 1.5 父侧接手登记（2026-09-29 14:11）

- **来源确认**：本批 = 用户 13:07 桌面走查（状态行未对齐 CLI）+ 13:11「开」——原编制 = 桌面线会话（slot 33，其末次活动 13:32）；用户 14:11 指令「桌面那边走查开的新批你接过来」⇒ **本批及其链自即刻起归本会话（slot 48）全权承办**。
- **接手时实况**：设计轮已落（= 桌面线交付）→ 父侧已于 13:5x 代点火评审 **#194**（changes-required：🔴1 ∕ 🟡3 ∕ 🔵3——发现表在 §3）→ **修正轮 #199 已派**（排队：等 UI.md 串行列 #195 → 自动起跑）→ 修完父侧逐条核验 → **轮 2 复审** → §4 代签（用户 13:52 授权）→ 实施舱。
- **桌面线其余链核对（同刻）**：可见批次均已闭合或已在本会话队列（copy-vsc-align 已收口 · susp-queue 修正轮 #195 在我队列 · window-queue #564 已收口）；桌面线自 13:32 起零写——**无双头承办冲突**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审 #194 ∕ #212 修正轮逐号落定（§2.8 ∕ §2.9）· 打开态令牌 seed 扩面入在册消解项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

**覆盖 = 台账 #600（desktop · 归批）；段面收窄 = 两段（段 9 上下文 · 段 11 台账）+ 必要载荷字段 + 文档随动**（批档 §1.3 授权口径；余 15 段不重开）。

| # | 条目 | 落点 | 判据（对照 §1.4） |
|---|---|---|---|
| ① | 上下文段 ⇒ CLI 形（en 逐字 ∕ zh 对位译形；含上下文令牌数） | `thincoder-desktop/renderer/views/statusline-segments.mjs:162-173`（`contextSegment`）· 载荷补字段 = `thincoder-desktop/src/main/agent-host.mjs:145-149`（`postUsage`）· 词面 = `thincoder-desktop/renderer/i18n.mjs` `status.usage`（:234 ∕ :391） | en 与 CLI 同读数逐字一致（`context <pct>% <tokens>` 形）；令牌 = 0 ⇒ 尾段缺席（半态同 CLI） |
| ② | 台账段 ⇒ 常驻 `台账 N·M` + warn 位警示色（核 marker 转发） | `statusline-segments.mjs:177-186`（`ledgerSegment`）· `thincoder-desktop/src/main/project-info.mjs:104-128`（拍尾 `flush` 增 marker 出站）· 渲染面归约收纳 | 常驻（非仅超阈）；计数与 `ledger:read` 同源一致；warn 位 ⇒ 警示色 |
| ③ | 文档随动 | `docs/desktop/design/UI.md:114`（行 9）· `:116`（行 11）· `docs/desktop/design/IPC.md`（`ev:usage` ∕ `ev:ledger` 载荷注）· i18n 键数链（`thincoder-desktop/renderer/i18n.mjs` 档头 + 用例 U51 —— 实施面） | 设计档行 9/11 与新形态自洽、无悬空指针 |

### 2.2 设计档落点

- 形态面（本批设计正文）= `docs/desktop/design/UI.md` §1 状态行族：行 9 ∕ 行 11 收正（重新指定消费面）+ 本批注（两项定形）。
- 载荷面 = `docs/desktop/design/IPC.md` §1（`ev:usage` ∕ `ev:ledger` 两行载荷注随动）。

（机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项 —— 续笔。）

### 2.3 机制设计

**① 上下文段（段 9）⇒ CLI 形**

- **载荷**：`ev:usage` 增 `ctxTokens` = 核 `estimateTokens(agent.history)` 直读（`thincoder-core/token-window.mjs:17`；与 `ctxPct`（同档 `historyPercent:160-162`）同点同步产出——`agent-host.mjs` `postUsage:145-149`；字段名沿现名 `ctxPct` 对称——批档 §1「contextTokens」为指向义）。渲染面归约：新切片 `usageTokens[key]`（数字 ∧ > 0 ⇒ 写；否则零写——沿 `usage` 同门，禁假造）。
- **词面**：`status.usage` 两语值改形——en = `context ${percent}%${tokens}`（逐字基准 = `thincoder-cli/src/tui/render-frame.mjs:413-416`）；zh = `上下文 ${percent}%${tokens}`（对位译形）。`${tokens}` = 段侧合成串（令牌 > 0 ⇒ `" " + fmtK(n)`，否则空串 ⇒ 半态 `context 24%` 与 CLI 同——`ctxTokensHint` 同构）。
- **段判据**：百分门零改（数字 ∧ > 0；≥ 80 ⇒ warn——`USAGE_WARN` 不动）；令牌仅作尾串（0 ∕ 缺 ⇒ 尾串缺席——禁假造）；`fmtK` 复用本档 `:29-33`（与 CLI `:396` 同式）。

**② 台账段（段 11）⇒ 常驻计数（核 marker 转发）**

- **数据径裁定**（二择一已裁）：**核状态位转发** ∥ 被否 = `ledger:read` 装载读（由：① warn 语义 = 老化 > 0 ∨ 死执行者 > 0——counts 无「死执行者」面，不可复现；② 无 120s 拍，读数陈旧；③ marker 需端侧重排，违「端零构造」）。数据现成：`LEDGER_STATE.ledger = { marker, warn, scannedAt }`（核 `ledger-surface.mjs:52`——每拍写、判位在判活解析后）。
- **出站**：`project-info.mjs` 拍尾 `flush` 增 `marker` 键（`{ text, warn }` ∕ `null`）：首拍必携（含 null——清旧项目残影）· 同值零出站（text 逐字 + warn 真值同判）；两纯函数 `ledgerMarkerOf` ∕ `sameLedgerMarker` 出档（用例缝）。
- **段形**：`ledgerSegment(marker, detailLines)`——`marker.text` 非空串 ⇒ 在场（**常驻**——不再绑 `thresholdReached`）；`parts = [{ text }]`（核 `formatMarker` 逐字 `台账 N·M`）；`warn = marker.warn`（端零重算）；tooltip = `detailLines` 连接（零改）。
- **「可开批」处置**（设计轮定，口径 = 批档 §1.3 ②）：段形退场（CLI 状态段无此形）；信号保留于 tooltip（核 `formatDetailLine` 逐字已携「 — 可开批」——`thincoder-core/ledger.mjs:152`）；`info.threshold` 键两语退场（消费归零 ⇒ 零残键）；`thresholdReached` 段面消费退场（`mount-info` 复读面零改——R13 遗留面另账，见 2.7）。

**③ 计数链随动（D3）**：i18n 合并表退一键（`info.threshold`；`status.usage` 仅值改、零增退）——链值 269 ⇒ 268（实施时以实读续链）；两语键集相等恒保（增退两语同拍）。

### 2.4 受影响文件与测试面

| 文件 | 届盘实读 | 预期增量 |
|---|---|---|
| `thincoder-desktop/renderer/views/statusline-segments.mjs` | 215 | 段 9 ∕ 段 11 两构建器改写（+≈12） |
| `thincoder-desktop/renderer/views/statusline.mjs` | 177 | 两参 + 两调用 + `mountStatus` 两拉取 + 档头 R8 句收正（+≈7） |
| `thincoder-desktop/renderer/events-slices.mjs` | 130 | `onUsage` 第四槽 + `onLedger` `marker` 支（+≈14） |
| `thincoder-desktop/renderer/mount-status.mjs` | 33 | `STATUS_KEYS` 增 `usageTokens` ∕ `ledgerMarker`（+≈2） |
| `thincoder-desktop/src/main/agent-host.mjs` | 260 | `estimateTokens` import + `ctxTokens`（+≈2） |
| `thincoder-desktop/src/main/project-info.mjs` | 152 | `marker` 出站 + 两纯函数（+≈18） |
| `thincoder-desktop/renderer/i18n.mjs` | 483 | 两值改 + 一键退 + 链行（±0 行级） |
| `docs/desktop/design/UI.md` | 667 | 行 9 ∕ 11 收正 + 状态栏行指针 + 批 B 注项 3 收正 + 本批注 + 变更记录（**本设计轮落**） |
| `docs/desktop/design/IPC.md` | 382 | `ev:usage` ∕ `ev:ledger` 两行 + 载荷键集两行 + 变更记录（**本设计轮落**） |
| `docs/batches/2026-09-29-desktop-statusline-cli-gap.test.mjs` | 新 | 批次本地件（落位沿 #545 现行法：实施舱暂存 `.thincoder/tmp/` → 父侧 copy 终位） |

**零改面（明示）**：`renderer/events.mjs`（分派既有）· `renderer/app.mjs`（`STATUS_KEYS` 导入随动）· `src/preload/preload.cjs`（零新通道）· `renderer/store.mjs` ∕ `renderer/mount-info.mjs`（读数面保留）· 核件（`thincoder-core` ∕ `thincoder-render-core`）零改。

**测试面**：批次本地单元件（平 node 直测）——① 段 9：两语逐字（`context 24% 12k` ∕ `上下文 24% 12k`）· 半态（令牌 0 ∕ 缺 ⇒ `context 24%`）· ≥ 80 warn；② 段 11：`marker` 在场 ∕ 零节点 ∕ warn 开合 ∕ tooltip 载波；③ 归约：`onUsage` `usageTokens` 写 ∕ 清、`onLedger` `marker` 写 ∕ 清 ∕ 同值原引用；④ 主进程两纯函数；⑤ 键集相等机检（两语同拍）；
⑥ 零残留机检（沿「复制面对齐」批 D13 判例）：词键 `info.threshold` 零命中（两语键集 ∕ `renderer/**` 源档字面）· 段面零「可开批」形（段构建器产物不含——tooltip 载波 = 核明细行逐字，豁免）。**真机对照 = 父侧真跑（终验，D16）**。

### 2.5 验收对照（对 §1.4）

| # | 判据（§1.4） | 本设计覆盖 |
|---|---|---|
| ① | en 与 CLI 同读数逐字一致（`context <pct>% <tokens>` 形） | 2.3①（词面 + 载荷）；机检 = 测试面①；真机 = 父侧 |
| ② | zh = 对位译形 | 2.3①（`上下文 <pct>% <tokens>`）；机检 = 测试面① |
| ③ | 台账段常驻且计数与 `ledger:read` 同源一致 | 2.3②（同核 `buildScan` 计数单源——marker `pool·tech` ↔ `ledger:read` counts 逐值同源）；真机 = 父侧并读 |
| ④ | 老化 > 0 警示态 | 2.3②（核 `warn` 位）；机检 = 测试面② |
| ⑤ | 设计档行 9/11 自洽、无悬空指针 | 2.2 + 本设计轮 UI.md ∕ IPC.md 落笔；机检 = 行 9/11 逐句可回指本批注 |
| ⑥ | 可实施性齐备（文件清单 + 载荷定形 + 段形态 + 测试面） | 2.3 ∕ 2.4 |

### 2.6 关键决策

- **KD-1 数据径 = 核状态位转发**（被否：`ledger:read` 装载读——三条由见 2.3②）。
- **KD-2 载荷字段名 = `ctxTokens`**（沿现名 `ctxPct` 对称；批档 §1「contextTokens」为指向义——评审若坚持批档字面名，一行级可改）。
- **KD-3 「可开批」退段入 tooltip**（CLI 口径；零信息丢失——核明细行已携）。
- **KD-4 打开态播种面零改**（恢复读仅百分；令牌随首个回合尾 `ev:usage` 到场——seed 扩面须动核 `sessionReading`，超本批边界；真机对照口径 = 活跃回合后逐字）。
- **KD-5 载荷注字段名收正**（发现：IPC.md ∕ UI.md 记 `percent` ∕ `tokens?`，实盘 = `ctxPct` ∕ `usage`〔五键 snake → 渲染面归约 VSC 键面〕——本批载荷注笔随动收正，报告另列）。

### 2.7 上抛项（报父侧）

1. **邻件 #581（段 14 窗内提示态）判不并轨**——涉第三段（段 14），越「只动两段」面；宜随下一桌面码面轮（台账原文候选载体）。**若父侧欲并轨须回用户。**
2. **邻件 #598③（UI.md 段计数 16⇒17 回填）判不并轨**——超出本批文档面（行 9/11 + 载荷注 + 键链），涉行 122 ∕ 194-197 ∕ :315/:395 等面外行；#598⑤ 域外注释（`mount-status.mjs:6,15` ∕ `i18n.mjs:235,392`）同判。**若父侧欲并轨须回用户。**
3. **观察项（非阻塞）**：① i18n 链所引 `test/views-chrome-vocab.test.mjs` U51 悬空（测试树全清重置后实读 test/ 仅 `files.mjs` ∕ `rc-resolve.mjs` ∕ `run.mjs` 三基建档）——键集相等机检面本批由随批单元件承载；② R13 遗留：`projectInfo` 复读面（counts ∕ phase ∕ notice）现零消费——本批不动（面收窄），宜随信息行收尾另账。
4. **批档 §1 数据面两处随动提示**（收口时知悉）：`ev:usage` 实盘载荷键 = `ctxPct` ∕ `usage` ∕ `timers`（§1 记 `percent` ∕ `tokens`）；`formatMarker` 位 = 核 `thincoder-core/ledger.mjs:145-147`（§1 同——仅补核前缀）。

（校 · 2026-09-29 设计轮：① §2.4 表 `IPC.md` 届盘实读 = **393**（原记 382 系中途读数——以 393 为准）；除该格外，表内计数 as-of 本批首读（实施轮以实读为准）。② 备案：本设计轮 UI.md ∕ IPC.md 落笔期间有并行实例（cli pid=19952 · 模型菜单全渠批）同档持写意图声明并写入——本批全部落点与其实例行确认并存（UI.md：本批变更记录 `:685` ∕ 其 `:686`；IPC.md：本批 `:394` ∕ 其 `:393`），**父侧收口时复核两档无互覆**。③ 实盘收正随记：`ev:usage` 实盘载荷键 = `ctxPct` ∕ `usage`（原文档记 `percent` ∕ `tokens?`——本批载荷注笔已收正）。）

### 2.8 修正轮记录（评审 #194 · 🔴1 ∕ 🟡3 ∕ 🔵3 · 2026-09-29）

**承**：批档 §3 轮次 1（changes-required · 7 条）；父侧已逐条裁定接受 1–7。本修正轮 = 逐号点修（**零产品码 · 零语义变更——仅档面收正**；行号 = 届盘值）。

| # | 处置 → 落点（file:line） |
|---|---|
| 1 🔴 | 段 11 两说收正（同机制同源四处）——`UI.md:29`（「读面消费 = 状态行台账超阈段」⇒ **零消费**——R13 遗留〔信息行视图随左列裁撤退场〕；段 11 供给另路 = `ev:ledger` `marker` 重锚）· `UI.md:179`（不播种理由 ⇒ `ev:ledger` 拍面供给〔启动拍 + 周期拍 120s；首拍即到〕）· `UI.md:197`（「（超阈时）」⇒「（常驻）」）· `UI.md:536`（判据②「常驻（非仅超阈）」⇒ **常驻**——残句删） |
| 2 🟡 | 段集计数随动 ⇒ **17 段 ∕ 闭集 17 码**（与 `UI.md:21` ∕ `:526` ∕ `:537` 同值）：`UI.md:101` · `:122`（分项补「`quiet` = 1 段——§1「本批注（停滞轻显形 · 2026-09-29）」」）· `:123` · `:194` · `:197`；**同族追加一处**（随报）：`UI.md:192`（「收正为 16 段」⇒ 17） |
| 3 🟡 | 令牌格式单源点名——`UI.md:534`：`fmtK`（端 = `thincoder-desktop/renderer/views/statusline-segments.mjs:29-33`；CLI 同式 = `thincoder-cli/src/tui/render-frame.mjs:396`——≥ 10000 ⇒ 整数 k · ≥ 1000 ⇒ 一位小数 k · 否则裸数）；判据①「逐字一致」以此为凭 |
| 4 🟡 | 判据①态域限定——`UI.md:536`：「打开态 = 半态——令牌随首个回合尾 `ev:usage` 到场」；打开态令牌（seed 扩面）= 在册消解项（见下） |
| 5 🔵 | `IPC.md:71` 发门作用域明写——门 = `ctxPct` 单判；`ctxTokens` 0 ∕ 缺不抑事件、端侧落半态 |
| 6 🔵 | `IPC.md:42` 残句收正——`ev:ledger` 触发 ⇒ 启动拍 + 周期拍〔120s〕（与 `:28` 同值） |
| 7 🔵 | 命名对位——`UI.md:116` ∕ `:535`：`marker` 转发 ⇒ **归约切片 `ledgerMarker`** 点名；tooltip 载波合口（`ev:ledger` `detailLines`〔归约切片 `ledgerDetail`〕——载荷键单源 = `IPC.md` §1）；`UI.md:180`：`percent` ⇒ **`ctxPct`** |

**在册消解项（本次新增 · 非本批射程）**：

1. **打开态令牌（seed 扩面）**——`seed` 恢复读现仅百分；扩为「百分 + 令牌」须动核 `sessionReading`（`thincoder-core/session-lifecycle.mjs`）+ 端装配面（`thincoder-desktop/src/main/session-slots.mjs`）——宜随核会话读数轮另账。

**复查读数（父侧核验凭）**：① **`超阈` 段 11 语境零残留**——全域残留 6 处均非段 11 语境（`UI.md:22` 审批卡 ∕ `:25` 工具卡 ∕ `:414` 工具输出 ∕ `:562` 借用表 ∕ `:580` 记录面；`IPC.md:216` 附件上限）；② `node scripts/doc-check.mjs` 本域（UI ∕ IPC）**Δ = 0**：行宽 29 项 ∕ 锚 6 项（均与修正轮前同值——无新增）；③ 触及行宽读数（既有超宽行上的增补）：`UI.md:534` 454⇒645 ∕ `:535` 431⇒489 ∕ `:116` 347⇒403——超宽行数零增，如需收线（拆行）请示父侧；④ 两档变更记录同拍落（`UI.md:692` · `IPC.md:398`）。

### 2.9 修正轮记录（评审 #212 · 🔴0 ∕ 🟡1 ∕ 🔵4 · 2026-09-29）

**承**：批档 §3 轮次 2（pass · 5 条）；父侧全数接受 1–5。本修正轮 = 逐号点修（**零产品码 · 零语义变更——仅档面收正**；行号 = 届盘值）。

| # | 处置 → 落点（file:line） |
|---|---|
| 1 🟡 | 播种面计数随动——读数切片段 **12 ⇒ 13** ∕ 播种 2 ∕ 不播种 **10 ⇒ 11**（「承载 − banner」算式按 17 重算）：`UI.md:171`（「12 段」⇒ 13 段〔承载 17 段 − banner 四段〕）· `UI.md:178`（「不播种 10 段」⇒ 11 段 + `quiet` 补逐段裁定〔停滞段——回合域；时基 `lastOutputAt` 进程态；无在飞回合 ⇒ 天然缺席〕）· `UI.md:21`（行内「播种 2 / 不播种 10」⇒ **11**）· `IPC.md:191`（「承载 16 段」⇒ **17 段**；「读数切片段 12」⇒ **13 段**；「不播种 10」⇒ **11**）；与 `UI.md:122` ∕ `:526` ∕ `:537` 的 17 段基准同拍；`UI.md:177`（「播种 2 段」）值域不变——**零动作** |
| 2 🔵 | 测试面示例带内值（`批档:105`）：`12.3k` ⇒ **`12k`**（两语同拍）——沿 `UI.md:534` 格式规格（≥ 10000 ⇒ 整数 k） |
| 3 🔵 | 校注② 坐标按现盘重定位（`批档:134`）：本批 = `UI.md:685` ∕ `IPC.md:394`；模型菜单 = `UI.md:686` ∕ `IPC.md:393` |
| 4 🔵 | 受影响表**零动作**——差 −2–+1 在 as-of 口径内（据 = `批档:134` 校注①「表内计数 as-of 本批首读（实施轮以实读为准）」；评审建议「保持现注口径即可」同向） |
| 5 🔵 | 零残留机检项补入（测试面 ⑥——`批档:105-106`）：词键 `info.threshold` 零命中（两语键集 ∕ `renderer/**` 源档字面）· 段面零「可开批」形（段构建器产物不含——tooltip 载波 = 核明细行逐字，豁免）——沿「复制面对齐」批 D13 判例 |

**复查读数（父侧核验凭）**：① read-back 逐处（改后实读）：`UI.md:21`（播种 2 / 不播种 **11**）· `:171`（**13 段**〔承载 17 段 − banner 四段〕）· `:178`（**不播种 11 段** + `quiet` 逐段裁定）· `IPC.md:191`（**13 段**——承载 17 段中 · **不播种 11**）——逐处与落值一致；
② census（本批三档 live 面）：`承载 16 段` ∕ `读数切片段 12` ∕ `不播种 10` 三形零命中——残余均在记录面（`UI.md:623` ∕ `:630` ∕ `:657` ∕ `:682` · `IPC.md:353`）或 §3 发现文本；
③ 机检（`scripts/doc-check.mjs` · checkConfig 声明面）：行宽 UI.md **22** ∕ IPC.md **7**（与修正前同值——Δ = 0；`batches` 为 exclude——批档不入扫描域）· 锚 **6** 项（IPC.md:28——同值）；测试面段 ⑥ 增补折行（`批档:105`（257）∕ `:106`（146）——批档超宽行数零增）；两档变更记录同拍落（`UI.md:693` · `IPC.md:399`）。

**认定保留（同上口径）**：`UI.md:21` ∕ `:526` 的「承载 16 ⇒ 17」增量形（§3 轮次 1 ∕ 2 认定为 17 段基准侧）与 `:122` 分项算式「2–9 · 11–14 = 12 段」（非切片段值）未动——如父侧欲按字面归一，请另裁（本批不改）。

**另报（非本批面 · 报父侧）**：`docs/desktop/design/PROJECT.md` 播种面族同源残述仍在（`:64` KD-25 · `:75` KD-36 · `:703` ∕ `:708` 功能点行 · `:796` T-DSK33 · `:932` AR 行）——本批三档射程外未动；宜随 #598③ 同族回填轮。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：桌面状态行 ⇒ CLI 补漏设计（段 9 上下文段 + 段 11 台账段——两段终态形 ∕ 载荷字段 ∕ 文档随动）
**评审面**：`thincoder/docs/desktop/design/UI.md` · `thincoder/docs/desktop/design/IPC.md` · `thincoder/docs/desktop/requirements/PROJECT.md`（全文读毕）；行号按最新读取态（评审期间档面有并发随动落盘）。
**限定**：设计所引仓外坐标（`thincoder-cli` ∕ `thincoder-core` ∕ 批档）不在本次评审范围 ⇒ 未验证（unverified）；无文档地图 ⇒ document ownership 按三档内文本自洽性判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 段 11 台账段两说并存：`UI.md:197`「`ledger`（超阈时）」与 `UI.md:29`「读面消费 = 状态行台账超阈段」仍按旧机制（超阈门槛 ∕ 信息读数源）描述，与本批收正口径（`UI.md:116` ∕ `:534` ∕ `:535`「**常驻**（非仅超阈）· 核 `marker` 转发」）为同机制两说法——实现面（段在场判据 ∕ 数据源）与验收面（D22 打开态逐段对表按 `:197` 核）都会读错 | 同笔收正两处——`:197` 去「（超阈时）」改常驻口径；`:29`「读面消费」链按新源（`ev:ledger` `marker`）重锚或删；`:179` 不播种理由句一并复核 |
| 2 | Document ownership | 🟡 | 段集规模残述未随动：`UI.md:101`（「16 段定形」）· `:122-123`（「承载 16 段 ∕ 闭集（16 码）」）· `:194`（「打开态段集 = 16 段」）· `:197`（「值域 = 闭集 16 码」） vs `:21` ∕ `:525` ∕ `:536`（「承载 16 ⇒ 17 ∕ 17 段」）——`quiet` 段落（stall 批）后四处未随动，本批 `:536` 已按 17 记 | 计数面四处随动收正（`:101` ∕ `:122-123` ∕ `:194` ∕ `:197` ⇒ 17 段 ∕ 闭集 17 码），与本批 `:536` 同值 |
| 3 | Clarity | 🟡 | 读数令牌格式未定死：`UI.md:533`「`${tokens}` = 段侧合成串：令牌 > 0 ⇒ `␣<fmtK>`」——`fmtK` 在三档内无落点 ∕ 无格式规格（k 阈值 ∕ 小数位 ∕ 单位），而判据①（`:535`）以「en 与 CLI 逐字一致」为验收门 | 点名令牌格式单源（写死舍入口径 ∕ 阈值 ∕ 单位，或点名 CLI ∕ 端同式函数），使判据①的「逐字一致」有可执行单源 |
| 4 | Acceptance criteria | 🟡 | 判据①（`UI.md:535`「en 与 CLI 同读数逐字一致」）未限定适用态：打开态 seed 径仅百分（`:177` ∕ `:537`「恢复读仅百分——令牌随首个回合尾 `ev:usage` 到场」）⇒ 打开态段 9 落半态；D22 验收 = 打开态真机对照（逐段对表）——两读存在张力 | 判据①补态域限定（打开态 = 半态；令牌随首个回合尾 `ev:usage` 到场）；打开态令牌（seed 扩面）列为在册消解项（须动核 `sessionReading`——非本批射程） |
| 5 | Clarity | 🔵 | `IPC.md:71`「**有效读数（数字且 > 0）⇒ 发 · 否则不发**」在扩 `ctxTokens` 后作用域未明（含 ∕ 不含令牌；0 ∕ 缺有否抑事件），与 `UI.md:535`「令牌 0 ∕ 缺 ⇒ 尾段缺席」并读歧义 | 明写发门作用域：门只判 `ctxPct`（既有门）；`ctxTokens` 0 ∕ 缺不抑事件、端侧落半态 |
| 6 | Document ownership | 🔵 | `IPC.md:42`「`ev:ledger` 行（宿主自产——**开项目链一次**）」与 `:28`「触发 = **启动拍 + 周期拍**（`REFRESH_MS` = 120s——R8 落）」不符（R8 落时 `:42` 未随动）——本批「120s 拍 + 首拍即到」依赖 `:28` 口径 | `:42` 残句收正为「启动拍 + 周期拍（120s）」（与 `:28` 同值） |
| 7 | Clarity | 🔵 | 段 11 侧命名对位残项：新切片 `ledgerMarker` 仅见计数行（`UI.md:536`，表行 11 ∕ 注项 2 未点名）；tooltip 载波 UI 记 `ledgerDetail`（`:116` ∕ `:534`）vs IPC 载荷名 `detailLines`（`IPC.md:28` ∕ `:76`）；`UI.md:180` 仍用 `percent` 指代读数 | 段 11 侧命名点名对位（切片 `ledgerMarker` 落点；tooltip 载波 `ledgerDetail` ⟷ IPC `detailLines` 一物一名）；`:180` `percent` 随本批字段名收正（`ctxPct`） |

计数：🔴 1 · 🟡 3 · 🔵 3（共 7 条）
VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：桌面状态行 ⇒ CLI 补漏设计（段 9 上下文段 ∕ 段 11 台账段——修正轮 #199 后复验 · 严验修正表七条）
**复验（评审 #194 七条 · 逐条落定核查 · 对届盘行文）**：
1 🔴 ✔ 段 11 两说收正落定（`UI.md:29` 零消费 + 供给另路 · `:179` 拍面供给 · `:197`「常驻」· `:536` 判据②残句已删；「超阈」段 11 语境零残留——全域 6 处 = `UI.md:22 ∕ :25 ∕ :414 ∕ :562 ∕ :580` + `IPC.md:216`，均非该语境）。
2 🟡 ✔ 段集计数随动落定（`UI.md:101` 17 段定形 · `:122` 承载 17 段 + `quiet` 分项 · `:123` 17 码 · `:192` · `:194` · `:197`）——另见发现 1 残留面。
3 🟡 ✔ 令牌格式单源点名（`UI.md:534`）——端侧 `statusline-segments.mjs:29-33` 抽读与规格句同式（≥10000 ⇒ 整数带 ∕ ≥1000 ⇒ 一位小数带）。
4 🟡 ✔ 判据①态域限定（`UI.md:536` 打开态 = 半态）+ 在册消解项（批档 `:149-151`）已立。
5 🔵 ✔（`IPC.md:71` 门 = `ctxPct` 单判）。
6 🔵 ✔（`IPC.md:42` 启动拍 + 周期拍〔120s〕——与 `:28` 同值）。
7 🔵 ✔ 命名对位（`UI.md:116` ∕ `:535` `ledgerMarker` ∕ `ledgerDetail` 点名 · `:180` `ctxPct`）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 修正 #2 的段集计数随动未覆盖 D17 播种面：`IPC.md:191` 仍按 16 段基准表述（「承载 16 段中 banner 四段 = 非 seed 面」+「读数切片段 12 段」——与 `UI.md:122` ∕ `:526` ∕ `:537` 的 17 段现值不符）；`UI.md:171`「12 段」· `:177` ∕ `:178`「播种 2 段 ∕ 不播种 10 段」· `:21` 行内同值——`quiet` 段入集后该族计数未随动，且 `quiet` 在播种面列无逐段 seed 裁定（「逐段理由 · 零静默省略」纪律缺口） | 随动收正：读数切片段 12 ⇒ 13（「承载 − banner」算式按 17 重算）· 播种 2 ∕ 不播种 10 ⇒ 2 ∕ 11（`quiet` 补逐段裁定——落「不播种」或同拍给排除理由）；`IPC.md:191`「承载 16 段」⇒ 17 段 |
| 2 | Acceptance criteria | 🔵 | 批档 §2.4 测试面①（`:105`）示例 `context 24% 12.3k` 与格式规格互斥——`UI.md:534`「≥ 10000 ⇒ 整数 k」下 12.3k（≈12300）应渲 `12k`；`thincoder-desktop/renderer/views/statusline-segments.mjs:29-33` 实读与规格句一致 ⇒ 示例为不一致侧 | 示例改用带内值（≥1k 带如 `1.2k` ∕ ≥10k 带如 `12k`），使测试面①与格式规格自洽 |
| 3 | Clarity | 🔵 | 批档 §2 校注②（`:133`）互覆复核坐标与现盘不符（注记「UI.md：本批变更记录 L675 ∕ 其 L676；IPC.md：本批 :393 ∕ 其 :392」——现盘本批 = `UI.md:685` ∕ `IPC.md:394`；模型菜单 = `UI.md:686` ∕ `IPC.md:393`；两记录并存互不覆盖——已核） | 坐标按现盘重定位（本批 `UI.md:685` ∕ `IPC.md:394`；模型菜单 `UI.md:686` ∕ `IPC.md:393`），或复核径改以批名检索 |
| 4 | Affected-file annotations | 🔵 | 受影响表（批档 `:92-101`）抽读：7 个 `.mjs` 注记与现盘实读差 −2–+1（`i18n.mjs` 483⇒481；`statusline-segments` 215⇒216 · `statusline` 177⇒178 · `events-slices` 130⇒131 · `agent-host` 260⇒261 · `project-info` 152⇒153；`mount-status` 33=33）——在本批「as-of 本批首读 · 实施轮以实读为准」口径内；无文件跨 300 ∕ 500 层（拆分预案义务未触发） | 保持现注口径即可（如求更严可补 as-of 日期限定） |
| 5 | Acceptance criteria | 🔵 | 「可开批」段形 ∕ `info.threshold` 键之退场（`UI.md:535` ∕ 批档 §2.3②「零残键」纪律）在测试面无对应机检项——批档 §2.4 测试面② 现仅覆盖 `marker` 在场 ∕ 零节点 ∕ warn 开合 ∕ tooltip 载波 | 补一条零残留机检项（词键 `info.threshold` 零命中 ∕ 段面零「可开批」形——沿「复制面对齐」批 D13 零残留判例） |

**限定**：无文档地图 ⇒ document ownership 按三档内文本自洽性判；仓外坐标（`thincoder-cli` ∕ `thincoder-core`）未验（unverified）。
计数：🔴 0 · 🟡 1 · 🔵 4（共 5 条）
VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-29 13:52「别等我了，自己跑完」授权——自缚三条件核验）：**

① **评审 pass**：§3 轮次 2 = 通过（🔴0 · 🟡1 · 🔵4——评审 #212；轮 1 #194 在其上）；
② **修正轮落定**：两轮修正全落（§2.8 ∕ §2.9 在册；父侧抽验：`UI.md:171`（13 段〔承载 17 − banner 四〕算式）· `:178`（不播种 11 + `quiet` 逐段裁定）· `IPC.md:191`（13 段 ∕ 播种 2 ∕ 不播种 11）· 测试面⑥零残留机检项（`批档:105-106`）——逐处现读一致；doc-check 行宽 Δ=0 ✓）；
③ **token 在位**（评审 #212 签发——值不落档）。

**准予进入实施（§5）。** 七档码面 + 批内件（段 9 上下文段 ∕ 段 11 台账段两构建器 + 载荷两键 + 镜面键集 ∕ 切片两键 + 两值改一键退）；段集 17 不动 ∕ 通道与白名单零变。

## §5 实施记录（eng-coder）

**状态行**：实施完成（码面 7 档 + 批内件 17/17 绿；审计 1 轮 ∕ 代码评审 1 轮 = pass——终态 clean；真机腿归父侧）

### 5.1 交付摘要

按 §2.3 机制设计七档逐档落位（段 9 上下文段 ⇒ CLI 形 ∕ 段 11 台账段 ⇒ 常驻）；零新 IPC 通道 ∕ 零白名单项 ∕ 段集 17 不动 ∕ 核件 ∕ VSC 零改。

| # | 档 | 落位（file:line · 届盘实读） | 现行 ⇒ 实际 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/agent-host.mjs` | `estimateTokens` import `:37`；`ctxTokens` 载荷 `:150`；注释坐标收正 `:207`（banner ⇒ `render-frame.mjs:233-236`）· `:146`（核装配坐标 ⇒ `agent.mjs:54` ∕ `session-lifecycle.mjs:113`） | 260 ⇒ **263** |
| 2 | `thincoder-desktop/src/main/project-info.mjs` | `ledgerMarkerOf` `:64-70` ∕ `sameLedgerMarker` `:73-76`；拍尾 `marker` 出站 `:146-151`（首拍必携含 null ∕ 同值零出站） | 152 ⇒ **182** |
| 3 | `thincoder-desktop/renderer/events-slices.mjs` | `onUsage` 第四槽 `usageTokens` `:53-75`；`markerReading` `:117-121` + `onLedger` `marker` 支 `:153-160` | 130 ⇒ **163** |
| 4 | `thincoder-desktop/renderer/views/statusline-segments.mjs` | 段 9 `contextSegment(usage, tokens, key)` `:163-179`；段 11 `ledgerSegment(marker, detailLines)` `:181-195`；`fmtK` 注释坐标收正 `:30` | 216 ⇒ **225** |
| 5 | `thincoder-desktop/renderer/views/statusline.mjs` | 两参 `:59-61`；两调用 `:82-83`；`mountStatus` 两拉取 `:162 ∕ :174`；档头 R8 句收正 + 本批注 `:19-24`；`projectInfo` 保留面登记注 `:57` | 178 ⇒ **184** |
| 6 | `thincoder-desktop/renderer/mount-status.mjs` | `STATUS_KEYS` 增 `usageTokens` ∕ `ledgerMarker` `:26-27` | 33 ⇒ **35** |
| 7 | `thincoder-desktop/renderer/i18n.mjs` | `status.usage` 两语值改 `:247 ∕ :409`；退 `info.threshold` 两语 + 直属注释两处 + 档头 `info.*` 族句；键链行 `:62-63`（295 ⇒ 294） | 508 ⇒ **501**（内容行 **500**） |
| 8 | `docs/batches/2026-09-29-desktop-statusline-cli-gap.test.mjs`（新；暂存 `.thincoder/tmp/` 同件 · 两处可跑 · 两件逐字节相同） | T1–T17（段 9 两语逐字 ∕ fmtK 三带 ∕ 半态 ∕ warn；段 11 常驻 ∕ 零节点 ∕ warn ∕ tooltip；归约 `usageTokens` ∕ `ledgerMarker` 写∕清∕同值；两纯函数；键集相等；零残留；源面锁） | — ⇒ **230** |

**机制落点（§2.3 逐条）**：① 载荷 `ev:usage` 增 `ctxTokens` = 核 `estimateTokens(agent.history)` 直读（与 `ctxPct` 同点；发门 = `ctxPct` 单判——0 ∕ 缺不抑事件）；渲染面切片 `usageTokens[key]`（数字 ∧ > 0 ⇒ 写 · 同值原引用 · 0 ∕ 缺 ∕ 非数 ⇒ 清本键 = 半态——决策见 5.2-1）；词面 en = `context ${percent}%${tokens}`（逐字 = CLI `render-frame.mjs:414-416`）∕ zh = `上下文 ${percent}%${tokens}`；令牌尾串 = `␣<fmtK>`（`fmtK` 三带同式 = CLI `:396`；0 ∕ 缺 ⇒ 尾段缺席）；≥ 80 warn 零改。② `ev:ledger` 增 `marker`（`{ text, warn }` ∕ `null`）= 核状态位转发（`ledgerMarkerOf` ∕ `sameLedgerMarker` 两纯函数——`text` = 核 `formatMarker` 逐字 ∕ `warn` = 核判位，端零重算）；归约顶层切片 `ledgerMarker`（写 ∕ 清 ∕ 同值原引用 ∕ 形不合零写）；段 11 常驻（`text` 非空串在场）· 警示色 = 核 `warn` 位 · tooltip = `detailLines` 逐字（「 — 可开批」信号保留）；`info.threshold` 两语退场。③ 计数：词键 −1（两语 295 ⇒ 294 实读）· 新切片 +2 · 载荷扩 2 · 通道 0 · 白名单 0 · 段集 17 不动。

### 5.2 决策透明表（实现轮裁量 · 报告级）

| # | 项 | 裁量 | 依据 |
|---|---|---|---|
| 1 | 无效 `ctxTokens`（0 ∕ 缺 ∕ 非数）⇒ **清本键**（非保留旧值） | 取「清」 | §2.4③「写 ∕ 清」+ `IPC.md:71`「`ctxTokens` 0 ∕ 缺不抑事件、端侧落半态」+ `UI.md:536`「令牌 0 ∕ 缺 ⇒ 尾段缺席」三源同向；§2.3①「否则零写」按其字面（保留）读会与「端侧落半态」相抵——取三源同向；若父侧要「保旧」，`events-slices.mjs:57-64` 一行级可改 |
| 2 | i18n 表外随动：退场键直属注释两处 + 档头 `info.*` 族句随键同退（净 −7 行 vs 表估「±0 行级」） | 删 | §2.3②「消费归零 ⇒ 零残键」+ D13 零残留判例（源档字面零命中）——注释若留，其叙述对象（键）已亡 |
| 3 | i18n 链行**不携退场键字面** | 记「项目级读数族末键」 | §2.4⑥ 源档字面零命中——链行若携字面，机检自红 |
| 4 | 批内件**直接落终位** + 暂存同件留存 | 两处留（沿例） | §2.4 表末行「实施舱暂存 → 父侧 copy 终位」（终位已在 ⇒ 父侧无需再 copy）；暂存留存 = 既有惯例（tmp 内多批同名件与终位并存） |
| 5 | 注释坐标收正三处（`agent-host:207` = 父侧插入项；`:146` ∕ `statusline-segments:30` = 审计同指随修） | 改（届盘实读复核后） | 父侧 15:3x 插入项同族；三处皆先实读现盘核讫（`:233-236` ∕ `agent.mjs:54` + `session-lifecycle.mjs:113` ∕ `:396`） |

### 5.3 验证（机检 · 终态）

- 批内件 `node --test`（终位 ∕ 暂存两处同跑）：**17/17 pass**（T1–T17）。
- `node --check`：7 码档 + 批内件 **全 OK**（8/8）。
- 实读核验：两语键集 **294 ∕ 294** 相等 ∧ 退场键两语 ∕ `renderer/**` 源档零命中（源档全树扫描）；`STATUS_SEGMENTS` 17 不动；`STATUS_KEYS` 两新键在盘。
- **not repo-suite verified**（全清令：仓套件不写 ∕ 不改 ∕ 不跑——父侧收口跑为唯一套件跑）。

### 5.4 审计与代码评审（轮次与终态）

- **审计轮 1**（explore · 只读偏离审计）：部分实现 0 ∕ 静默简化 0 ∕ 表外改动 0；🔵 6（注释坐标三处 ∕ §2.3-§2.4 措辞张力 ∕ 设计档 `UI.md:106` 域外 ∕ §5 未落——本段即补）；除设计档面（零触）外随修 ∕ 报告。
- **评审轮 1**（advisor · code）：VERDICT **pass**（🔴0 · 🟡1 非阻塞〔i18n 内容行 500 = 在册硬限顶格协调项〕· 🔵3〔`mount-status:6,15` 计数——设计 §2.7③ 判不并轨故零动 ∕ `projectInfo` 死参——已补登记注 ∕ 批内件双副本——沿例〕）。
- **fix round**：1 轮（`statusline.mjs:57` 登记注一句；余为设计档面 ∕ 不并轨面 ∕ 沿例面——报告级）。终态 = **clean**（未触 5 轮上限）。

### 5.5 透明披露（上抛父侧）

1. **设计档面残留（零触 · 报父侧）**：`UI.md:106 ∕ :194` 仍引 CLI banner 坐标 `render-frame.mjs:227-230`（现盘四常量行 = `:233-236`——与用户 15:3x 插入项同族）；`mount-status.mjs:6,15`「承载 16 段」（现盘 17 段）——设计 §2.7③ 判不并轨，未动（若父侧欲并轨，两处均注释级）。
2. **判据域外残留字面**：`thincoder/tmp-head-statusline.mjs:145-146` ∕ `thincoder-desktop/.thincoder/tmp/*`（暂存副本 ∕ 日志）仍携退场键旧字面——非码面路径（机检半径 = `renderer/**`）；清 ∕ 留归父侧。
3. **真机腿（D16）**：段 9 读数逐字 ∕ 段 11 常驻与 warn ∕ tooltip——父侧真跑闭合（列「待父侧」）。
4. **在册消解项**（设计 §2.8 已立）：打开态令牌（seed 扩面）——本批零触，随核会话读数轮另账。

### 5.6 边界核对（未做 = list）

- 未做（按设计零触）：UI.md ∕ IPC.md ∕ 需求档 ∕ 核件（`thincoder-core` ∕ `thincoder-cli` ∕ `thincoder-render-core`）· VSC 树 · `store.mjs` ∕ `mount-info.mjs`（读数面保留）· 邻件 #581 ∕ #598（判不并轨）· 打开态 seed 扩面（在册消解项）。
- 零新 IPC 通道 ∕ 零白名单项 ∕ 段集 ∕ 段序零改（17 段）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**波面（全落）**：单实施舱 #222——七档（`agent-host.mjs` 260⇒**263** ∕ `project-info.mjs` 152⇒**182** ∕ `events-slices.mjs` 130⇒**163** ∕ `statusline-segments.mjs` 216⇒**225** ∕ `statusline.mjs` 178⇒**184** ∕ `mount-status.mjs` 33⇒**35** ∕ `i18n.mjs` ⇒内容 500）+ 批内件 17 例（`docs/batches/2026-09-29-desktop-statusline-cli-gap.test.mjs` · 230 行）+ 父侧随动四笔（披露①：`UI.md:106 ∕ :194` CLI banner 坐标 227-230 ⇒ **233-236** ∕ `mount-status.mjs:6 ∕ :15`「承载 16 段」⇒ **17 段**——父侧直接执行标记在册）。

**验证（父侧）**：① 批内件 **17/17 pass**（父侧亲跑）；② `node --check` 8/8（舱报）；③ 审计 clean ∕ 评审 pass（0🔴 · 1🟡 非阻塞 · 3🔵）· fix 1 轮 · 终态 clean；④ 键集 294 ∕ 294 相等 ∕ 退场键 `renderer/**` 零命中（T15 源档全树）；⑤ 段 9 两语逐字 = CLI（`context 24% 12k` ∕ `上下文 24% 12k`）· 段 11 常驻（不绑 `thresholdReached`）· warn ∕ tooltip 载波在册；⑥ 真机腿（段 9 ∕ 段 11 读数 ∕ tooltip 目视）= **待父侧真机走查**（D16 义务——列「待父侧」）；**not repo-suite verified**（终局轮）。

**披露处置**：① 已修（上方四笔）② `.thincoder/tmp/*` 旧字面（非码面）= 清留归终局轮 ③ `i18n.mjs` 内容行 **500 = 硬限顶格**（零余量——拆分批 #614 在册，下一键增前必拆）④ `ctxTokens` 无效 ⇒ 清本键 = **维持**（设计口径「不假造」——0 ∕ 缺 ⇒ 尾段缺席；裁 · 2026-09-29）。

**边界**：核件（core ∕ cli ∕ render-core）· VSC 树 · `store.mjs` ∕ `mount-info.mjs` · UI.md ∕ IPC.md（设计轮 ∕ W6 已落面）· 邻件 #581 ∕ #598 = 零触 ✓；段集 17 不动 ∕ IPC 通道 0 ∕ 白名单 0。

**结算（D7）**：**#600 → 已核销**（依据本节 + §5）。**状态行**：已收口 2026-09-29。
