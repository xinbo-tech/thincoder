# 2026-09-30 · 跨端消化面恢复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #726（#719 设计轮 U1 承接：跨端对齐义务——CLI ∥ VSC 的消化生命周期面（痕 ∥ 归档块）恢复呈现；用户可见端差默认消灭）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」+ 18:28「自动跑完」。侦察（explore id=4 · 2026-09-30 18:30）= VSC：live 归档既有（`webview/activity.js:99-110`），但会话数据面无记录写入/读取（`record:append` 仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（重建只认 user/assistant/tool——`webview/ui.js:159-165`）；CLI：痕 = `pushLine` 瞬态、块 = 冻结载体行（内存）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`startup.mjs:22-116`）。共享面 = 核读缝 `historyWindow {records:true}` + `pushReal` 半载体写 + 记录存储绑定；端侧重建器 = 各端自做。。
> 台账 = #726（SESSION · 归批）。前情 = docs/batches/2026-09-30-digest-persistence.md §2.七 U1（已收口 2026-09-30）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #726（#719 · U1 承接）+ 用户 2026-09-30 18:24 ∥ 18:28 令。

**侦察落定（explore id=4 · 18:30）**：**VSC** = live 归档既有（`thincoder-vscode/webview/activity.js:99-110`），但会话数据面**无记录写入 ∥ 无读取**（`record:append` 全仓仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（恢复重建只认 user/assistant/tool——`webview/ui.js:159-165`）；**CLI** = 痕 `pushLine` 瞬态（`src/tui/suspension-drive.mjs:85-101`）、块 = 内存载体行（`src/tui/subagent-freeze.mjs:82-97`）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`src/tui/startup.mjs:22-116`；正文消息本身在）。**共享面** = 核读缝 `historyWindow {records:true}`（`thincoder-core/history-window.mjs:117/175-178`）+ `pushReal` 半载体写（`thincoder-core/context.mjs:93-103`）+ 记录存储绑定（`session-store.mjs:361`——CLI 已绑 ∥ VSC 未绑）；**端侧重建器 = 各端自做**（桌面 `page-read.mjs` 折叠/位次算法是否上提 render-core = 设计第一分叉）。

**需求已落三档（父侧笔）**：core `docs/core/requirements/SESSION.md` §4.4 **F-S7**（记录两族入存储 + 读面 opt-in + 默认关负控）∥ VSC `docs/vsc/requirements/WEBVIEW.md` **F-W1 扩展** + **I-7 收窄**（未归档块口径）∥ CLI `docs/cli/requirements/TUI.md` **F18** + 变更记录。

**范围（本批）**：两端**写面 + 读面 + 重建器**（机制承接 #719 语义）；**机制单源位置 = 设计轮裁定**（现单源住桌面设计档 `docs/desktop/design/RENDERER.md` §1.1）。**边界**：桌面零触；呈现语义零改（形态既有）；两条在册容差（跨页截断轮 ∥ 归档快照晚一拍）承接后沿用 ∥ 收正 = 设计裁。

**下一手**：设计轮（本档 §2）→ 评审 → 批准 → 实施（两端舱）。

**【父裁 · 2026-10-01（承 records-docs-reconcile 批上抛 U3）】**树中遗留面去向 = **维持现状待复核**（不预回退 ∥ 不另清）：CLI 舱中途取消之树中间态（`lifecycle-records.mjs` 新档 ∥ `suspension-drive` ∥ `agent-turn` ∥ `subagent-freeze` 三档编辑 ∥ 批内件）以**届期 §2 终版设计**为准逐件复核——合规留 ∥ 不合规重做；复核 = 实施舱任务面内（父侧在实施派单中列明，逐件披露去向）。

**【父侧笔 · 2026-10-01】U1/U2 收正落讫**：U1 = `docs/vsc/requirements/WEBVIEW.md` 五处（F-A1 ∥ F-A5 边界句与 §2「明确不做」第三句按 I-7 同口径收正（未归档块不恢复 ∥ 已归档块经记录重建存续）∥「不改 CLI TUI 块机制」限「本体」∥ F-W1 证据补 `design/WEBVIEW.md` §5.7 回指 ∥ 变更记录 +1）；U2 = CLI 需求档 F18 设计回指 ⇒ `TUI-SESSION-VIEW.md` **§6**（+变更记录）∥ core 需求档 §4.5⑤ 补注（写缝 = `pushRecord` 注入面；承载 = 端面）∥ §4.4 边界句 ∥ N-S3 逐字复核**保持成立**（零改）。U3 按原登记维持。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审轮 1 · 十一条）+ 收正轮（评审轮次 3 · 八条）+ 定点修复轮（评审轮次 4 · 发现 1–2）+ 随落笔轮（VSC 舱交付 · 三处收正）+ 收尾轮（#27 报备之未及项 · 六处）逐号落位并读回（2026-10-01）；机制单源 = SESSION §6.26；上抛②④闭合 ∥ ①③⑤维持；读面 delta 三腿归属父裁已落（VSC 舱批内件补——见收正轮块 #6））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**一、本批条目（覆盖）**
- 台账 **#726**（requirement · SESSION · 归批）：**跨端消化面恢复**——CLI ∥ VSC 承接 #719 语义：消化生命周期两族（`digest` 痕三型 ∥ `subagent` 归档快照）经**记录条目**在重启 ∥ 重开面板 ∥ reload 后重建存续（用户可见端差默认消灭——#719 U1 承接）。
- 需求三档（父侧已落）：core `docs/core/requirements/SESSION.md` §4.4 **F-S7** ∥ VSC `docs/vsc/requirements/WEBVIEW.md` **F-W1**（扩展）+ **I-7**（收窄）∥ CLI `docs/cli/requirements/TUI.md` **F18**。
- 不在本批：桌面产品码（零触——桌面设计档仅一处指针化随动）；产品码整体零触（设计轮）；批档 §5 = 实施舱。

**二、设计档落点（已落 + 读回核验 D6——行号 = 读回时点值）**

| # | 档 | 落点 | 内容 |
|---|---|---|---|
| 1 | `docs/core/design/SESSION.md` | **§6.26**（:961-984）+ 变更记录（:1095） | **机制单源上提**：两族记录形 ∥ 写缝 ∥ 读缝 ∥ 重建义务 ∥ 容差登记（跨端单源；含 VSC 不绑裁定 ∥ 兼容红线保持句） |
| 2 | `docs/cli/design/TUI-SESSION-VIEW.md` | **§6**（:178-196；原 §6 顺延 §7 ∥ 7.1/7.2）+ 变更记录（:227） | CLI 承接细则：写点三处 ∥ 恢复重建（`n` 回扫）∥ 翻页 ∥ 容差 |
| 3 | `docs/vsc/design/WEBVIEW.md` | **§5.7**（:457-471）+ §10 行 17（:604）+ 变更记录（:635） | VSC 承接细则：写面两产生面 ∥ 读面 opt-in ∥ 重建（完整轮 ∥ 块活形）∥ 容差 |
| 4 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | §13 `recordAppend` 行（:489）+ §3.2 行 22（:104）+ 变更记录（:519） | 出站协议登记（webview → host——subagent 快照） |
| 5 | `docs/desktop/design/RENDERER.md` | §1.1「留档记录」条通用句指针化（:83-86）+ 变更记录（:274） | 单源上提的机械随动（桌面侧呈现细节留档；零语义） |

**三、机制设计（要点——细则 ∥ 判据单源 = core §6.26）**
0. **单源位置裁定 = 上提核**：记录形 ∥ 写缝 ∥ 读缝契约 ∥ 重建义务 ∥ 容差登记 → `docs/core/design/SESSION.md` §6.26（本批落）；桌面 RENDERER §1.1 通用句指针化（随动一处）；判由 = §六 D1。
1. **写缝** = 核新入口 `thincoder-core/context.mjs` `pushRecord(agent, record)`（`pushReal` 双胞：`ts` 打点 ∥ `_recordStore?.append` ∥ 尾窗驱逐；`history` 弃数组承接 ⇒ **机器线零触**；尽力面）。桌面现存 `session-io.appendRecord` = 等价内联（**消解路径** = 桌面档下次触碰改调核口——行为等价，已登记）。
2. **CLI 写点三处**（进程内同点追加）：`suspension-drive.mjs` `digestTurn`（start/end——与行同值单算式）· `agent-turn.mjs:226-232`（cap）· `subagent-freeze.mjs` `freezeSubTaskLines`（快照——meta/rows 自 `sub.blocks` + `dropped` 省略标记）。**承载件** = 新档 `lifecycle-records.mjs`（形构建 ∥ 痕行文本 live∥重建 同调 ∥ rows 保尾 ∥ 终态行回扫）。
3. **CLI 读面/重建**：`startup.mjs` `historyToLines` 增记录分支（渲染面零改）；痕行文案与活流同算式；终态行 `n` 跨页缺席 ⇒ **存储回扫**（跨页零损）；`subagent` ⇒ `_frozenSubTask` 合成件。
4. **VSC 写面**：digest 三型 = 宿主同点追加（`suspension.mjs:167/:178` ∥ `postDigestCap` 定义点全收）；subagent 快照 = webview 归档派生点出站 `appendRecord`（幂等守卫内恰一次）⇒ 宿主处理体取活行载体（`panel._liveLines ?? panel._susp?.lines`）经 `pushRecord` 追加。**不绑记录存储**（判由 = §六 D3）。
5. **VSC 读面/重建**：`panel-session.mjs:150/:176` 开 `{ records: true }`；重建 = `history.js` 页级 pass + 新件（`record-restore.js`）：痕元素（**页内只产完整轮**）+ 归档块（活形同构 ∥ 落点镜式）；`chat-status.js` 构形件化（live∥重建 单一实现）；元素携 `data-idx`。
6. **容差**（在册两 + 新增一）：① 跨页分裂——CLI **消** ∥ VSC 沿用（与桌面同构）② 归档快照晚一拍——CLI **消** ∥ VSC 沿用（下一落盘承接）③ CLI 复活径双记录——**在册**（低频异常修复径；重开条件 = 实测命中 ⇒ 另批）。
7. **第一分叉裁定**：render-core 上提 = **否**（判由与对比 = §六 D4）。

**四、受影响文件与测试面（现行 ⇒ 预期；内容行数口径 ∥ as-of 2026-09-30 实读；预期 ≈ = 设计预估——实施批校准）**

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | **440 ⇒ ≈455** | 写缝（`pushRecord`） |
| 2 | `thincoder-core/history-window.mjs` | **194 ⇒ 194（零改——读缝已备）** | 读缝 |
| 3 | `thincoder-cli/src/tui/suspension-drive.mjs` | **211 ⇒ ≈228** | 写点（start/end） |
| 4 | `thincoder-cli/src/tui/agent-turn.mjs` | **417 ⇒ ≈426** | 写点（cap） |
| 5 | `thincoder-cli/src/tui/subagent-freeze.mjs` | **246 ⇒ ≈272** | 写点（快照） |
| 6 | `thincoder-cli/src/tui/startup.mjs` | **303 ⇒ ≈324**（越 300 顾问线——现状即越；拆分预案 = 恢复族出档，触发 = 该档下次实质改动） | 重建分支 |
| 7 | `thincoder-cli/src/tui/lifecycle-records.mjs` | **新档 ≈120** | 承载件 |
| 8 | `thincoder-vscode/src/extension/suspension.mjs` | **290 ⇒ ≈302** | 写点（start/end） |
| 9 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | **317 ⇒ ≈325** | 写点（cap） |
| 10 | `thincoder-vscode/src/extension/panel-messages.mjs` | **354 ⇒ ≈375** | 出站分派 + 处理体 |
| 11 | `thincoder-vscode/src/extension/panel-session.mjs` | **325 ⇒ ≈330** | 读面 opt-in ×2 |
| 12 | `thincoder-vscode/webview/activity.js` | **173 ⇒ ≈205** | 出站（快照构建） |
| 13 | `thincoder-vscode/webview/history.js` | **88 ⇒ ≈150** | 页级 pass（路由） |
| 14 | `thincoder-vscode/webview/chat-status.js` | **124 ⇒ ≈140** | 构形件化 |
| 15 | `thincoder-vscode/webview/record-restore.js` | **新档 ≈150** | 重建件（痕 ∥ 块） |
| 16 | 测试面 | **批内件** `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（拟新增——核 ∥ CLI ∥ VSC 三面腿）；VSC 事件面 = happy-dom 驱真 webview 模块 + 桩面板驱真 extension 模块（NFR-A3 同式）；真机项 = 两端走查（父侧/用户）；仓套件 = 收口轮父侧跑（唯一一次） | 全批 |
| 17 | 设计档 | 五处（见 §二）+ 变更记录 | 全批 |

**五、验收对照（判据腿——机检）**
- **核腿**：`pushRecord` 语义（`ts` ∥ store 追加 ∥ 机器线零触负控 ∥ 未绑零抛）；读缝默认关 ⇒ 逐字等价（负控——承 #719 既有腿）。
- **CLI 腿**：① 写——digest 三型 ∥ 冻结 ⇒ 记录入存储（形/序/`ts`）+ 机器线零新增；② 重建——伪槽混序 ⇒ `restoreLines` 含痕行族（文案逐字：tier 两档 ∥ count ∥ cap ∥ done/aborted）与冻结载体（合成件渲染不崩）；③ 跨页分裂——end 页缺 start ⇒ 终态行在且 `n` 正确（回扫）；④ 负控——记录缺 ⇒ 与改前基线逐字等价 ∥ 未绑 ⇒ 零存储追加；⑤ 复活双记录（在册容差——如实断言）。
- **VSC 腿**：① 写——三发点 ⇒ 活行载体含记录（同点 ∥ 形）+ 机器线零触；出站 `appendRecord` 全链（伪 webview → 宿主处理体 → 追加）+ 幂等守卫内恰一次；② 重建——伪槽混序 ⇒ `historyPage` 携记录（opt-in）→ 痕元素（tier 两档 ∥ `dataset.n` ∥ done/failed 态逐字）∥ 归档块（活形）+ `data-idx` 在位；③ 负控——不带 opts 逐字等价 ∥ 半轮零元素（容差①）∥ 未归档块不重建（I-7）；④ 容差②——save 前/后可见性断言（下一落盘承接）。
- **真机项**：CLI = 真 TUI 走一轮 digest + 归档块 → 重启 ∥ `/session` 切回 ⇒ 痕 + 块在；VSC = dev host 面板重开 ∥ reload ⇒ 痕 + 块在。

**六、关键决策**
- **D1 机制单源上提核**（否：留桌面档——跨端契约住模块档 = 层级倒挂 + 三方跨层引；机械随动 = 桌面档一处指针化）。
- **D2 写缝 = 核 `pushRecord` 新入口**（否：半载体惯用法三端复制——隐式契约 ×3；桌面现存内联留消解路径）。
- **D3 VSC 不绑记录存储**——记录走槽 JSON 投影（判由：全量绑定 ⇒ `_historyWindow` 窗口驱逐伤 VSC 全量人读线 + 保存面重构 = 超批；槽 JSON 径用户面目标全达 ∥ 跨端连续性由核既有对账（JSON⇄store）保证 ∥ core §6.14 兼容红线逐字保持）。
- **D4 render-core 上提 = 否（第一分叉裁定）**——对比：上提收益 = 折叠件单源（VSC + 未来桌面）；成本 = 单消费（桌面零触不采用 ⇒ 零去重）+ VSC 逐件位次形 ≠ 桌面轮单元形（抽象层代价）＋语义单源已由核 §6.26 承载（多实现面纪律标准形）；**重开条件** = 桌面折叠面下次触碰时三端对位再评估。
- **D5 CLI 终态行 `n` = 存储回扫**（否：页内折叠容忍——CLI 页 20 条 + 轮跨正文 ⇒ 跨页非低频，容忍不可取）。
- **D6 VSC 痕重建 = 页内完整轮 + 位次复列**（否：逐条复列——半轮「在跑」幻影态误导）。

**七、上抛（3）**
- **U1（需求侧收正——父侧笔）**：VSC 需求档三句与「已归档块存续」相抵——**F-A1** 边界「不做跨 reload 恢复已死任务的块」· **F-A5** 边界「不重推已消化历史块」· §2「明确不做」第三句「不做『已 settle 且已 digest』任务回填（呈现面 = digest 文本）」；建议按 I-7 同口径收正（未归档块不恢复 ∥ 已归档块经记录重建存续）。复核候选：「不改 CLI TUI 块机制」（作用域 = F-A1–A5 集——本批 CLI 块机制本体零改、记录承接为增量 ⇒ 建议维持或限「本体」）。
- **U2（需求侧复核——父侧笔）**：本设计裁定 VSC **不绑记录存储** ⇒ core §4.4 边界句「不做记录存储的跨端读取协议（VSC 读 sidecar——另案）」与 N-S3「sidecar 对 VSC 不可见」**逐字保持成立**（无需改）；§4.5⑤「记录存储形态 = 端面事实（本端零该机制）」请复核（记录承接后是否补注）；**F18 设计回指占位**「（本批设计定形后补节号）」⇒ 补 `docs/cli/design/TUI-SESSION-VIEW.md` §6；VSC F-W1 建议补设计回指 `docs/vsc/design/WEBVIEW.md` §5.7。
- **U3（范围外登记——不改）**：① CLI ∥ VSC 测试清单现为空（大清理后）——本批机检腿全落批内件（既有形态）；② VSC `panel-messages.mjs` 前缀约定所倚 reverse 机检件现树不存在（协议登记暂无机检兜底——随测试树重建归口）；③ 桌面 `session-io.appendRecord` 内联消解路径已登记（RENDERER §1.1）——执行时机 = 桌面档下次触碰。

### 收正轮（评审轮次 1 · 十一条逐号 · 2026-09-30）

评审原文 = 本档 §3 轮次 1（changes-required · 🔴1 ∥ 🟡6 ∥ 🔵4 = 十一条）；逐号落位（行号 = 收正后读回时点值）；**机制本体零改（除 ① 取一字面 = 评审裁定的收正）**。评审引用核警告（0/6 match）——按现盘实读逐条核对：**十一条所述与现盘无实质出入**（行号漂移随本轮改动自然发生 ±1 量级）；五档变更记录各补「修正轮」行（同拍）。

| # | Severity | 处置 | 落点（收正后） |
|---|---|---|---|
| 1 | 🔴 | 字面统一 = **`recordAppend`**（协议登记面 = 命名权威；与桌面通道 `record:append` 同词序）；§13 行按 3 移出（字面面随之收窄）；§13 行④ 判值面随行退场 | `SESSION.md:973` ∥ `WEBVIEW.md:464-465` ∥ `WEBVIEW.md:605` ∥ `WEBVIEW-PROTOCOL.md:104`（留案字面） |
| 2 | 🟡 | §6.26 补「读面 delta 登记」条（read_history 行形 ∥ 索引面行 ∥ 两道护栏计数 ∥ `cwd:` 发现行 + 判据三腿——核腿 +1 = 伪存储混录负控/空壳行/两面相等） | `SESSION.md:981-986` |
| 3 | 🟡 | §13 行**移出本表**（实施轮补行——两表只收实测在位行，先例 :667/:669/:684）；§3.2 行 22 在案（拟增标记保持） | `WEBVIEW-PROTOCOL.md`（原 :489 行删除；修正记录 = :518） |
| 4 | 🟡 | §6.26 产生面补「入参对象 ∥ 载体对应（钉定）+ 失败面」（VSC 载体 = 活行载体对象 `fullHistory` 同引用；桌面薄壳在册） | `SESSION.md:975-979` ∥ `WEBVIEW.md:465` |
| 5 | 🟡 | RENDERER 容差（2）副本收敛为指针（保留桌面特异半句） | `RENDERER.md:86`（修正行 = :276） |
| 6 | 🟡 | TUI 模块地图补 `lifecycle-records.mjs` 行（拟新增） | `TUI-SESSION-VIEW.md:23` |
| 7 | 🟡 | 归档块锚面按径分述（live 不补锚 ∥ 重建携锚）+ 防双渲染判据（同位去重 ∥ live 不回溯补锚） | `WEBVIEW.md:406-407` |
| 8 | 🔵 | D-P11 计数同拍 二十 ⇒ **二十二项** | `WEBVIEW-PROTOCOL.md:328` |
| 9 | 🔵 | cap 帧点坐标对盘统一 **`:83`**（发射行口径——定义 `:82-84` 注记） | `WEBVIEW-PROTOCOL.md:211` ∥ `WEBVIEW.md:464` ∥ `SESSION.md:973`（§12 行 `:83` 原样） |
| 10 | 🔵 | §5 批次指针清单补本批行（先例形） | `SESSION.md:73` |
| 11 | 🔵 | 负控措辞收正（无 sidecar 存储腿——记录入人读线、落盘随既有保存链） | `TUI-SESSION-VIEW.md:194` |

**读回（D6）**：十一条逐处复读 ✓（edit 上下文 + 定点 read + grep 残留扫：规范面 `appendRecord` 零残留——余存 = 桌面函数名 ∥ 记录面历史；`recordAppend` 登记/文面六处到位；`:82-83` 三处对盘零余；D-P11 与 §3.2 标题同值）。
**残留（2，均非阻塞）**：① 产品码注释 `thincoder-core/history-window.mjs:15/176` 仍引「单源 = RENDERER §1.1」——机制单源已上提 §6.26；产品码零触（本轮），随核座下次触碰同拍。② 本档 §2 上文与 §3 评审原文存 `appendRecord` 字样 = 记录面历史（不回改；以本块为准）。

### 收正轮（评审轮次 3 · 八条逐号 · 2026-10-01）

评审原文 = 本档 §3 轮次 3（changes-required · 🔴1 ∥ 🟡5 ∥ 🔵2 = 八条；父侧裁 = 全采纳）；逐号落位（行号 = 收正后读回时点值）；**机制本体零改**（只重锚 ∥ 收正 ∥ 登记）；本块 = 八处点修，不扩面。

**坐标注（#2 前提 · 按盘实读）**：评审表所载 `suspension.mjs` 起跑 `:168` ∥ 收尾 `:189` = 该档 301 行时点值——**现盘 310 行**（该档 2026-10-01 近时又经邻批落笔 +9）⇒ 本轮按「内容定位 + 现盘实读」收正 = **起跑 `:177`（`postMessage` 起跑发射行）∥ 收尾 `:198`（`status:"end"` 发射行）**；`WEBVIEW-PROTOCOL.md` 侧 §5/§12 坐标同为漂移前值（该档经邻批断行 +18）——同按现盘收正。

| # | Severity | 处置 | 落点（收正后） |
|---|---|---|---|
| 1 | 🔴 | 落位句收正为现行规则：重建 = **记录位次原位（零配对）**（页内无本轮〔跨页〕⇒ **页段尾追加**）；live = **到达序当刻流末**；**两径并存**。§5.1 裁 A 句复核（`WEBVIEW.md:226`）= 已为现行规则（零改）。 | `SESSION.md:989` ∥ `WEBVIEW.md:409`；变更记录同拍（两档） |
| 2 | 🟡 | 坐标按盘收正 = **起跑 `:177` ∥ 收尾 `:198`**（发射行口径）；§5.7 明写「同点双动作 = 与 `postMessage` 同行」（消行号依赖）。 | `SESSION.md:973` ∥ `WEBVIEW.md:467` ∥ `WEBVIEW-PROTOCOL.md:223`（§5）∥ `:416`（§12 行） |
| 3 | 🟡 | 表 VSC 行**显式校准**（实读重取 2026-10-01 · 内容行数口径）= 下表；`record-restore.js` 行随动复核（现盘不存在——拟新增保持）。 | 本表 §四（VSC 行——以下表为准） |
| 4 | 🟡 | 档位注记（形态沿同表 `startup.mjs` 行先例）= 下表「档位注记」列；`panel-callbacks` ∥ `panel-messages` ∥ `panel-session` 三行同拍登记。 | 本表 §四（四行注记） |
| 5 | 🟡 | **择法 = 字面收正**（非就地标注）：§三.4 ∥ §五 VSC 腿① 之 `appendRecord` 自本块起以协议登记字面 **`recordAppend`** 为准（命名权威 = `WEBVIEW-PROTOCOL.md` §3.2 行 22）；§三.4 同拍坐标 `:167/:178` ⇒ `:177/:198`；上文两处 = 记录面历史（append-only 不回改）。 | 本档 §三.4 ∥ §五 VSC 腿①（以本块为准） |
| 6 | 🟡 | **父侧裁决（入）**：`SESSION.md:986` 三条读面 delta 判据腿归属 = **VSC 舱批内件补**（编号承接核舱 K1–K4 序）。腿落清单 = ① 伪存储混录负控（`role` ∥ `keyword` ∥ `tool` 检索与消息-only 基线逐字等价）② 空壳行在场（无滤 ∥ since-until ⇒ `{ts, role:null, content:""}`）③ JSON 面 ∥ 索引面逐条相等。 | 批内件 `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（VSC 舱） |
| 7 | 🔵 | **择法 = 登记为在册行为**（不钉最小词表——避新语义）：`rows` 补「跨端退化为文本行」条（未命中本端行模型 ⇒ 按文本行，零丢失）。 | `SESSION.md:970`；变更记录同拍 |
| 8 | 🔵 | `cap` 重建句按记录 `mode` 分档 + 「本端现无 auto 产者」限定（与 CLI 侧注记同形）。 | `WEBVIEW.md:471`；变更记录同拍 |

**表 §四 VSC 行（重定 —— #3 ∥ #4 落点；口径 = 内容行数 · 实读 2026-10-01；「预期」= 起点平移、原增量保持）**

| 档 | 现行 ⇒ 预期（重定） | 档位注记 |
|---|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | **310 ⇒ ≈322** | 越 300 顾问线——现状即越；拆分预案 = driver 步骤 ∥ 退出残余面抽档（先例 = `docs/batches/2026-09-24-busy-queue-visible.md` §2 表）；触发 = 该档下次实质改动 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | **317 ⇒ ≈325**（复读吻合——维持） | >300 注记；拆分审查 = `docs/vsc/design/VSC-DEBT.md` §12 单源（本批不执行） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | **354 ⇒ ≈375**（复读吻合——维持） | 同上 |
| `thincoder-vscode/src/extension/panel-session.mjs` | **325 ⇒ ≈330**（复读吻合——维持） | 同上 |
| `thincoder-vscode/webview/activity.js` | **188 ⇒ ≈220**（更新——原 173 ⇒ ≈205，漂移 +15） | — |
| `thincoder-vscode/webview/history.js` | **88 ⇒ ≈150**（复读吻合——维持） | — |
| `thincoder-vscode/webview/chat-status.js` | **126 ⇒ ≈142**（更新——原 124 ⇒ ≈140，漂移 +2） | — |
| `thincoder-vscode/webview/record-restore.js` | **新档 ≈150**（复核：现盘不存在——拟新增保持；无起点可校，校准归实施舱） | — |

口径注：评审「全文行数」读数与表值多数差 1 = 计法差（含尾行）；本表口径 = 内容行数（表头在案；`history-window.mjs` 行 194 = 194 可校）。

**读回（D6）**：八处逐处复读 ✓（edit 上下文回显 + 定点 read + grep 残留扫）——规范面 `落点镜式` 零残留（余存 = `WEBVIEW.md:472` 现行句自带定义 ∥ 各档变更记录 = 记录面历史）；规范面 `suspension.mjs:167/:178` 零残留（余存 = 变更记录历史行 ∥ 他档坐标）；三档变更记录同拍落行（`SESSION.md:1107` ∥ `WEBVIEW.md:781` ∥ `WEBVIEW-PROTOCOL.md:535`）。

**随见（非本轮清单——未动 · 报父侧）**：① `WEBVIEW.md:219`（§5.1 起跑窗条）载 `suspension.mjs:161-167` = 漂移前坐标（同族滞后，建议同波处理）；② `docs/vsc/design/VSC-DEBT.md` §12.1 `suspension.mjs` 块载「483 ⇒ 290（越线登记关闭）」——现读 310（越线成立；登记重开随该档触碰）；③ 表 CLI 行现盘已随本批 CLI 舱（树中未审计面）漂移——`suspension-drive.mjs` **254** ∥ `agent-turn.mjs` **422** ∥ `subagent-freeze.mjs` **265** ∥ `startup.mjs` **321** ∥ `lifecycle-records.mjs` 已落 **190** 行——归 CLI 舱结算时校准。

### 定点修复轮（评审轮次 4 · 发现 1–2 逐号 · 2026-10-01）

评审原文 = 本档 §3 轮次 4（pass · 🔴0 ∥ 🟡3 ∥ 🔵3）；父侧裁 = 发现 1–2 本轮落定（实施舱放行前收口）；本块 = 两处点修，不扩面；机制本体零改；发现 3–6 零动（各归其位）。

| # | Severity | 处置 | 落点（修复后读回值） |
|---|---|---|---|
| 1 | 🟡 | §三.5（`:46`）之裸词「落点镜式」列入「以本块为准」清单（append-only 不回改——承 `:124` 先例形）：读作 = **记录位次原位（零配对）**（重建径落位——页内无本轮〔跨页〕⇒ 页段尾追加；与 live `archiveBlock` 到达序**两径并存**）；定义单源 = `docs/vsc/design/WEBVIEW.md` §5.4/§5.7（as-of 2026-10-01 读回 `:409`/`:472`）∥ 机制单源 = `docs/core/design/SESSION.md` §6.26（`:989`）。 | 本档 §2：`:46` 行零改 + 本块定读；`:144` 枚举收全 = 见下 |
| 2 | 🟡 | `WEBVIEW.md:219`（§5.1 起跑窗条）坐标对盘收正（as-of 2026-10-01 实读）+ 锚消行号依赖：`suspension.mjs:161-167` ⇒ `:183-187`（起跑快照逐条补发循环；锚 = 与起跑 `postMessage({type:"digest",status:"start"})` 发射行同段）；同行相邻坐标 `:112-119` ⇒ `:122-128`（`reclaimDigestedBlocks` 定义——评审未列之同族滞后，实读命中 ⇒ 同拍收正，如实报备）。变更记录同拍（`:782`）。 | `docs/vsc/design/WEBVIEW.md:219` ∥ `:782` |

**`落点镜式` 余存枚举（承 #1——`:144` 收全；全树 grep as-of 2026-10-01）**：① `WEBVIEW.md:472`（现行句自带定义）∥ ② 本档 §2 `:46`（本块定读）∥ ③ 记录面 = `WEBVIEW.md:778` 变更记录 ∥ 本档 `:144` 原读回宣示行 ∥ 本档 §3 评审原文（轮次 3 发现 1 表 ∥ 轮次 4 发现 1 表）∥ 他批档 `docs/batches/2026-09-30-triple-end-digest-unify.md:72`/`:90` ∥ `docs/batches/2026-10-01-digest-row-current-only.md:259` ∥ ④ 本块（定读载体与枚举行——不计余存）。规范面裸词零残留保持。

**读回（D6）**：① `WEBVIEW.md:219` 复读 ✓（edit 回显 + 定点 read——`:183-187` ∥ `:122-128` 与 `suspension.mjs` 实读逐字相符）；② `WEBVIEW.md` 变更记录尾行落位（`:782`）+ 本块落位复读 ✓；③ `落点镜式` 全树复扫 = 命中逐项归枚举 ①–④，枚举外零命中（本块自身引用归 ④）。

### 随落笔轮（VSC 舱交付 · 三处逐号 · 2026-10-01）

承本档 §5 VSC 舱（上抛② ∥ ④）+ 父侧派单：两舱实施落定 ⇒ 设计面三处随落笔收正（协议登记补行 ∥ 坐标对盘 ∥ 无效子句裁），使本批设计面与实施终态一致（收口前置）。**只修三处、不扩面**；产品码零触；机制本体零改；三档之外零写。

| # | 处置 | 落点（读回值——as-of 2026-10-01） |
|---|---|---|
| 1 | 协议登记**补行**：§13 增 `recordAppend` 行（实施已落——实测在位：② `webview/activity.js:124`（归档派生点调用，幂等守卫内恰一次；载荷字面量构造 `:190`）∥ ③ `panel-messages.mjs:287`（`case` → `handleRecordAppend` `:123-134`）；行位 = 英序 `reconnectMcp`/`removeProvider` 之间）；§3.2 行 22「（拟增）」标去（两处落位坐标实读）。 | `WEBVIEW-PROTOCOL.md:506`（新行——`:505`/`:507` 夹位）∥ `:116` |
| 2 | **坐标校准**（届盘自核实读）：起止发射行 `:177/:198` ⇒ **`:190/:214`**——四处同拍：`SESSION.md:973` ∥ `WEBVIEW.md:467` ∥ `WEBVIEW-PROTOCOL.md:223`（§5）∥ `:416`（§12 `digest` 行）；`WEBVIEW.md:219` boundary 支随动 ⇒ 同拍（`:183-187 ⇒ :198-202`——起跑快照逐条补发循环）+ 同行 `reclaimDigestedBlocks` 随动实读命中 ⇒ 同拍（`:122-128 ⇒ :124-131`——同族滞后；承轮 4 先例，如实报备）。 | 四处 ∥ `WEBVIEW.md:219`（两处） |
| 3 | **子句裁 ＝ 删**：「页内无本轮〔跨页〕⇒ 页段尾追加」子句（§6.26 VSC 重建落位句 ∥ §5.7 同句）——「零配对 + 半轮零元素」约束下无可构造路径 ⇒ **无效子句删除**（判由 = 下）。 | `SESSION.md:989` ∥ `WEBVIEW.md:472` |

**#3 判由（删——逐面核）**：① 痕元素面——「半轮零元素」已定（跨页分裂轮页内零产；`record-restore.js` `scanPageRounds` 配对闸）；② 归档块面——落位 = **记录位次原位（零配对）**，与本轮边界 ∥ 配对无关 ⇒ 「页内无本轮」判据不存在（`history.js` 页级 pass 按记录序入元素——零尾追路径）；③ 实现零对应路径（VSC 舱复核）；④ 留存 = 死子句驻规范面（诱导读者构造不存在路径——本舱上抛④即其证）；⑤ 对位桌面句已随其批同判（记录面 = `docs/batches/2026-10-01-desktop-digest-teardown.md` §2——「记录位次原位出（零配对）」）。⇒ 两处删除（史实归本块与三档变更记录；规范面零残留）。

**变更记录同拍（三档各 +1 行——读回值）**：`SESSION.md:1107` ∥ `WEBVIEW.md:783` ∥ `WEBVIEW-PROTOCOL.md:536`。

**随见（非本轮清单——未动 · 报父侧）**：① `WEBVIEW.md:469` 读面坐标（载 `panel-session.mjs:150/:176`；现读两 `historyWindow(…, { records: true })` 调用 = `:152` ∥ `:179`）；② `WEBVIEW.md:468`「——§13 行实施轮落」注（本轮已落——pending 措辞待收）；③ `WEBVIEW.md:470`「（`webview/record-restore.js` **拟新增**）」标（文件已交付 116 行；同族 = `TUI-SESSION-VIEW.md:23`——三档之外零写）；④ `WEBVIEW-PROTOCOL.md:447` §12 `suspension` 行 ② 列（载 `:125/:134`；现读 `:137` ∥ `:146`——承轮 4 发现 3）∥ `:445` §12 `subagent` 行 ② 列（载 `suspension.mjs:89/:96`；现读 `:91` ∥ `:97`——同族 +2 位移）。上抛② ∥ ④ 本块闭合；① ∥ ③ ∥ ⑤ 各归其位（本轮零动）。

**读回（D6）**：三档 13 处逐处复读 ✓（edit 回显 + 定点 read + 残留扫）——规范面 `页段尾追加` 零残留（余存 = 三档变更记录历史行）∥ 规范面 `:177/:198` 零残留（余存 = 变更记录历史行）∥ `WEBVIEW-PROTOCOL.md` 规范面「拟增」零残留；`recordAppend` 面（§13 行 ∥ §3.2 行 22 ∥ §5.7 ∥ §10 行 17）字面一致。

### 收尾轮（#27 报备之未及项 · 六处逐号 · 2026-10-01）

承本档 §2 随落笔轮随见 ①②③④（六处）+ 父侧派单：设计面与实施终态零落差收尾（收口前置）。**只修这六处、不扩面**；产品码零触；机制本体零改；本档 §1/§4/§6 零触；三档之外零写。行号 = 读回时点值（as-of 2026-10-01 届盘实读）。

| # | 处置 | 落点（读回值） |
|---|---|---|
| 1 | 读面坐标对盘收正：`panel-session.mjs:150/:176` ⇒ **`:152/:179`**（两处 `historyWindow(…, { records: true })` opt-in 调用行）。 | `docs/vsc/design/WEBVIEW.md:469` |
| 2 | pending 措辞 ⇒ 现态：「——§13 行实施轮落」⇒「；§13 行已落」（协议 `recordAppend` 行在盘——`WEBVIEW-PROTOCOL.md:506`）。 | `docs/vsc/design/WEBVIEW.md:468` |
| 3 | 陈标去：重建件 `webview/record-restore.js`「**拟新增**」标去（文件在盘——116 行）。 | `docs/vsc/design/WEBVIEW.md:470` |
| 4 | 届盘实核 = 同族「拟新增」标**已于他批撤除**（`2026-10-01-digest-rows-natural-form-cli-vsc` 批修复轮——该档变更记录 :231 在案）⇒ **零改动**（未及项如实报备；派单路径 `docs/vsc/design/TUI-SESSION-VIEW.md` 该路径无此档——实体档 = `docs/cli/design/TUI-SESSION-VIEW.md`，已按实体档实核）。 | `docs/cli/design/TUI-SESSION-VIEW.md:23`（零动） |
| 5 | §12 `suspension` 行 ② 列坐标对盘收正：`suspension.mjs:125/:134` ⇒ **`:137/:146`**（`postSuspension` ∥ `postSuspensionEnd` 两发射行实读）。 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:447` |
| 6 | §12 `subagent` 行 ② 列坐标对盘收正：`suspension.mjs:89/:96` ⇒ **`:91/:97`**（`reassertLiveChildren` started ∥ queued 两发射行实读）。 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:445` |

**变更记录同拍**：`WEBVIEW.md` +1（新尾行 :784）∥ `WEBVIEW-PROTOCOL.md` +1（新首行 :536——该档变更记录为新先序）∥ `TUI-SESSION-VIEW.md` +0（处 4 零改动——无改动可记；如实报备）。

**读回（D6）**：六处逐处复读 ✓（edit 回显 + 定点 read + 残留扫）——规范面 `:150/:176` ∥ `:125/:134` ∥ `:89/:96` 零残留（余存 = 变更记录历史行 ∥ 本轮新记录行）；`§13 行实施轮落` pending 措辞本体零残留（余存 = 「实施轮落盘后」别构 ∥ 本轮新记录行）；`record-restore.js`「拟新增」零残留。

**随见（非本轮清单——未动 · 报父侧）**：① `WEBVIEW-PROTOCOL.md:447` 同格 `panel-messages.mjs:314` 载值失效（现读 = 注记行；该 `suspension` 冷启补推发射现位 = `:331`）；② `:445` / `:446` 两行 ② 列 relay 载值 `panel-subagent-relay.mjs:217/:253` 失效（`:217` 现读 = 空行；`:253` 越界——该档全文止于 :223；两转口发射现位 = `:215`（`subagent`）∥ `:221`（`subagentApproval`）——候选实读，未落）。均属在册坐标族滞后（协议登记现无机检兜底——U3② 在册），处置归父侧/下波校准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = #726 跨端消化记录恢复设计（设计轮）· 范围 = SESSION.md §6.26 ∥ TUI-SESSION-VIEW.md §6 ∥ WEBVIEW.md §5.7 ∥ WEBVIEW-PROTOCOL.md §3.2 行 22 / §13 ∥ RENDERER.md §1.1。范围限制：文档地图 / 需求档 / 批档 §2 不在评审范围 ⇒ 需求覆盖与 file 级行数标注未核（设计自述委批档 §2——SESSION.md:984）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属 / 跨档一致性（机制级） | 🔴 | 同一协议消息两个不同字面：webview 侧记 `appendRecord`（SESSION.md:972、WEBVIEW.md:464、WEBVIEW.md:604、WEBVIEW.md:635）∥ 协议登记表记 `recordAppend`（WEBVIEW-PROTOCOL.md:104 §3.2 行 22、:489 §13 行、:519 变更记录）；§13 行③列（:489）与机检（:458 首列 ↔ 源码提取集双向对账、以源码字面为权威）均以字面为匹配键——按文字实施将 webview 发 `{type:"appendRecord"}`、宿主注册 `case "recordAppend"` ⇒ 消息落空、记录不落盘（本批核心面失效）；且 §3.2「表外增量不入」（:106）意味未入表字面即违规。 | 统一为一个字面（§3.2 行 22 / §13 行 / §5.7 / §10 行 17 / 两档变更记录同拍），并核 §13 行④判值。 |
| 2 | 需求覆盖 / 设计完整性（邻面） | 🟡 | 记录条目进入既有读面未登记：写缝把记录追加进同一人读线存储（SESSION.md:970），而 read_history 本会话走 store.iterate、其契约断言「输出构造 / 字段 / limit 默认值与上限逐字不变」（SESSION.md:283）、会话索引按「一行 = 一条消息」建模（SESSION.md:590）、两道检索护栏按消息计数（SESSION.md:261）——记录在这三面的处置（过滤 ∥ 行形 ∥ 计数）全文未述；§6.26 又自述「读缝（单点）」（:974），变更记录断言「邻面语义零改」（:1095），与该两处契约相抵风险。 | 在 §6.26 补「读面 delta 登记」条（read_history 输出行形 ∥ 索引面行 ∥ 两道护栏计数 ∥ cwd: 发现行），或明裁「记录对上述面不可见」并给可机检判据。 |
| 3 | 方法论（档面纪律 / 机检面） | 🟡 | §13 在实施前落行：`recordAppend` 行坐标自标「拟增」（WEBVIEW-PROTOCOL.md:489——②「拟增：archiveBlock 同点」、③「拟增」），④ 却判 `活`；与本档既有纪律「两表只收实测在位的行——新消息未实现，实现轮落位后补行」（:667 / :669 / :684）相抵，且 §13 机检待对账（:458）——实施前该行无源可对账。 | 按先例移至实施轮补行（或行内明载实施前豁免口径并修正 ④ 判值——`活` 对计划行不成立）。 |
| 4 | 清晰性（写缝落点） | 🟡 | VSC 写面处理体的 append 目标未钉：WEBVIEW.md:464 记「处理体取当前会话活行载体（panel._liveLines ?? panel._susp?.lines）经核 pushRecord 追加（fail-soft——agent 缺位 ⇒ 零动作）」，而核写缝签名 = pushRecord(agent, record)、字段面 = _fullHistory ∥ _recordStore ∥ _historyWindow（SESSION.md:970）——载体对象与入参对象对应关系未述（若记录落不进 saveLines 所写数组，VSC 侧记录随落盘丢失）。另：桌面现行薄壳（RENDERER.md:86 复刻 pushReal 半提取、不经 pushRecord）在核单源 §6.26 未载（仅桌面档在册 + 消解路径）。 | §6.26 端侧产生面处钉定各端入参对象 / 载体对应与失败面；同处注明桌面薄壳在册（或于 §5.7 明写载体→pushRecord 入参映射）。 |
| 5 | 文档归属（重复描述） | 🟡 | RENDERER 仍携桌面侧「容差（2）」全文副本（RENDERER.md:86：① 跨页截断轮页内不产…② 归档快照族落盘晚一拍…），而本批已裁「容差登记」单源上提（RENDERER.md:274；SESSION.md:979-982 已逐端载两态）——同一容差两处同述、措辞不同，漂移风险。 | 桌面档该两容差收敛为指针（保留桌面特异半句如「渲染面异步出站」）或以「同 §6.26 ①/②」限定。 |
| 6 | 一致性（模块地图回写） | 🟡 | TUI 档 §1 模块地图自载「新增 / 改名 / 删除文件时同批回写」（TUI-SESSION-VIEW.md:14），本批新档 thincoder-cli/src/tui/lifecycle-records.mjs（:188）未入表（表仅 5 行 :16-22）。 | 补行（可携「拟新增」标记）。 |
| 7 | 档面一致（跨节） | 🟡 | WEBVIEW.md:406 归档块登记项「不补 data-idx（不出现在历史回填中——登记项）」与 :466 重建「元素携 data-idx（位次锚——分页游标 ∥ 防双渲染）」并存——同一锚面两说（live 径 ∥ 重建径未分述），且重建径恰经页（回填）落块，「不出现在历史回填中」按字面已被本批推翻。 | 收正为按径分述（live 归档块 ∥ 重建块），并补「防双渲染」判据（live 块无锚时是否补锚）。 |
| 8 | 档面卫生（计数） | 🔵 | WEBVIEW-PROTOCOL.md:328 D-P11 记「二十项」，§3.2 标题已为「二十二项」（:79）——本批（21→22）与上批（20→21）均未同改；先例 = D3「计数与列表同改 · §7 D-P11 同改」。 | 计数同拍（二十二项）或注明 D-P11 计数射程。 |
| 9 | 坐标记法 | 🔵 | cap 帧点档内记法不一：WEBVIEW-PROTOCOL.md:211「panel-callbacks.mjs:84」∥ :401 §12 行「:83」∥ WEBVIEW.md:463「:82-83」。 | 对盘统一；若为定义 / 发射两位请注记口径。 |
| 10 | 档面卫生（索引） | 🔵 | SESSION.md §5 批次指针清单（:63-72）未补本批行（先例 = 每新增 §6.x 批均补「本批（…）落点表 = …；本档 §6.NN 承载…」）；信息未失（:984 已载批档指针），但索引缺行。 | 补行。 |
| 11 | 表述精确 | 🔵 | TUI-SESSION-VIEW.md:193 负控括注「未绑（模式 F）⇒ 既有径零改（记录仅内存形——无存储腿）」与 SESSION.md:970「未绑定 ⇒ 人读线追加照常 ∥ 存储腿空转」+ :973 落盘节律（随既有保存链落槽投影）并存——「仅内存形」易被读作「模式 F 记录不落盘」。 | 收正措辞（如「无 sidecar 存储腿；落盘随既有保存链」）。 |

VERDICT: changes-required

计数：🔴×1 · 🟡×6 · 🔵×4（合计 11）。

### 轮次 2（评审子代理）

**复核（修正轮落地后 · 逐号核 11 条）**——对象 = #726 跨端消化记录恢复设计；范围（五档全文已读）= `SESSION.md` §6.26 ∥ `TUI-SESSION-VIEW.md` §1/§6 ∥ `WEBVIEW.md` §5.4/§5.7/§10 ∥ `WEBVIEW-PROTOCOL.md` §3.2/§5/§7/§11/§13 ∥ `RENDERER.md` §1.1。修复声明面 = 五档修正轮变更记录行（SESSION :1107 ∥ TUI :228 ∥ WEBVIEW :636 ∥ PROTOCOL :518 ∥ RENDERER :276）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | WEBVIEW-PROTOCOL.md / WEBVIEW.md / SESSION.md | 🔴 | Fixed | 字面统一 `recordAppend` 五处到位：PROTOCOL:104「| 22 | `recordAppend`（**新消息**——webview → host 留档记录出站）」· WEBVIEW:465「⇒ `vscode.postMessage({type:"recordAppend", record})`」· WEBVIEW:605 · SESSION:973「webview 归档派生点经 `recordAppend` 出站」；规范面 `appendRecord` 零残留（余存 = 桌面函数名 `session-io.appendRecord` ∥ 记录面历史） |
| 2 | 2 | SESSION.md | 🟡 | Fixed | §6.26 新增「**读面 delta 登记**（:981）」四消费面 + 判据：read_history 行形（:982 `{ts, role:null, content:""}` 空壳）∥ 索引面行（:983）∥ 两道护栏计数（:984）∥ `cwd:` 发现行（:985）+ 机检判据（:986） |
| 3 | 3 | WEBVIEW-PROTOCOL.md | 🟡 | Fixed | §13 `recordAppend` 行已移出（:518「§13 `recordAppend` 行**移出本表**（移至实施轮补行——两表只收实测在位行，先例 = 本档 :667/:669/:684）」）；§13 表体（:461-513）核无该行；§3.2 行 22 留案（拟增标记） |
| 4 | 4 | SESSION.md / WEBVIEW.md / RENDERER.md | 🟡 | Fixed | 载体对应钉定：SESSION:975「**入参对象 ∥ 载体对应（端侧钉定——…）**」+ :977 VSC 活行载体对象（`fullHistory` 同引用）∥ :978 桌面薄壳在册 + 消解路径；WEBVIEW:465「经核 `pushRecord` 追加（…fail-soft——载体缺位 ⇒ 零动作 + 日志）」 |
| 5 | 5 | RENDERER.md | 🟡 | Fixed | :86 容差副本收敛为指针：「**容差（2 · 桌面侧状态）** = 同 `docs/core/design/SESSION.md` §6.26 容差登记 ①/②（桌面侧特异半句 = …）」 |
| 6 | 6 | TUI-SESSION-VIEW.md | 🟡 | Fixed | §1 模块地图补行（:23「| `thincoder-cli/src/tui/lifecycle-records.mjs` | …（**拟新增** · #726）」） |
| 7 | 7 | WEBVIEW.md | 🟡 | Fixed | §5.4 锚面按径分述（:406「**重建块携 `data-idx`**…」）+ 防双渲染判据（:407 同位去重 ∥ live 不回溯补锚 ∥ 两径不相交） |
| 8 | 8 | WEBVIEW-PROTOCOL.md | 🔵 | Fixed | D-P11（:328）「**二十二项**」与 §3.2 标题（:79「（二十二项——只增不改）」）同值 |
| 9 | 9 | WEBVIEW-PROTOCOL.md / WEBVIEW.md / SESSION.md | 🔵 | Fixed | cap 帧点统一 `:83`：PROTOCOL:211「`panel-callbacks.mjs:83`（cap 两档——`postDigestCap` 发射行；定义 `:82-84`）」· :401 §12 行 `:83` · WEBVIEW:464 `:83` · SESSION:973 `:83` |
| 10 | 10 | SESSION.md | 🔵 | Fixed | §5 补本批指针（:73「**本批（跨端消化面恢复 · 2026-09-30）落点表** = `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2…」） |
| 11 | 11 | TUI-SESSION-VIEW.md | 🔵 | Fixed | 负控措辞收正（:194「未绑（模式 F）⇒ 既有径零改（无 sidecar 存储腿——记录入人读线、落盘随既有保存链）」） |
| 12 | (new) | WEBVIEW.md | 🔵 | New（非阻塞） | 记录面历史残留：:638 设计轮变更记录行仍书「`WEBVIEW-PROTOCOL.md` §13 补 `appendRecord` 行（同批）」——规范面已统一（同档 :636 修正轮行在案）；按「变更记录 = 历史叙述」惯例不回改，不影响实施面 |

**新 🔴：零**。边界注（无严重度）：本轮提示词 review surface 所列四文件（`image-handler.mjs` / `2026-09-30-vsc-paste-cleanup.test.mjs` / `PROVIDER.md` / `attachments.mjs`）与评审声明（#726 设计复核）不符，未纳入；按声明与 Documents to Review 五档核。

计数：🔴×0 · 🟡×0 · 🔵×1（+ 前轮 11/11 收正）。
VERDICT: pass

### 轮次 3（评审子代理）

### 轮次 3（跨重启重签 · 评审子代理）

评审对象 = #726 跨端恢复呈现设计（VSC 舱续跑面）。范围（六档全文已读）= `docs/batches/2026-09-30-cross-end-digest-recovery.md` ∥ `docs/core/design/SESSION.md` §6.26 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §1/§6 ∥ `docs/vsc/design/WEBVIEW.md` §5.1/§5.4/§5.7/§10 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2/§5/§12/§13 ∥ `docs/desktop/design/RENDERER.md` §1.1。范围限制：需求档三处（core §4.4 F-S7 ∥ VSC F-W1/I-7 ∥ CLI F18）与文档地图不在评审面 ⇒ 需求覆盖只按设计自述回指核（未读需求原文）；file 级行数对盘按盘实测抽查。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属 / 跨档一致（机制级） | 🔴 | 同一机制（VSC 归档块落位）两说并存：`SESSION.md:989`（机制单源）与 `WEBVIEW.md:409`（§5.4 锚面·活流落点）记「落点镜式（**当前轮首之前**——与 live `archiveBlock` 同规则）」；`WEBVIEW.md:472`（§5.7 重建径）与 `WEBVIEW.md:226`（§5.1 裁 A 落位句）记「**记录位次原位（零配对）**——重建径；与 live `archiveBlock` 到达序两径并存为设计」；实码 = `thincoder-vscode/webview/activity.js:99-118`（live = 起跑刻当刻流末／族后；旧「族首之前 insertBefore(块, 边界)」注明「随裁 A 退场——其对象已废」）。批档 §三.5（`:44`）只书「落点镜式」不定形 ⇒ 按 §6.26 读法实施重建块即落轮首而非记录位次，与 §5.7 相抵（本批 VSC 舱正落该点）。 | 收正 §6.26:989 与 §5.4:409 的落位句为现行规则（重建 = 记录位次原位／跨页页段尾追加；live = 到达序当刻流末；两径并存），同拍核 §5.1 裁 A 句与批档 §三.5「落点镜式」指向；五档变更记录同拍。 |
| 2 | 坐标 / 跨档滞后 | 🟡 | VSC digest 写点坐标三处同载 `suspension.mjs:167/:178`（`SESSION.md:973` ∥ `WEBVIEW.md:467` ∥ `WEBVIEW-PROTOCOL.md:211`，§12 行 `:401` 同值）；实码 = 起跑 `:168`（`:167` 为紧邻的 `ask` 计算行，±1 量级）／收尾 `:189`——`:178` 现落于 2026-10-01 起跑窗补发循环内（`…:174-178`），按字面落点即插错代码块。 | 对盘收正三处/四处（起跑／收尾发射行），并在 §5.7 明写「同点双动作 = 与 `postMessage` 同行」以消行号依赖。 |
| 3 | 受影响文件行数标注 | 🟡 | 表内 VSC 行「现行」值随邻批（2026-10-01）实施漂移，实测（读回口径 = 全文行数）：`activity.js` **189**（表 `:63` 记 173；同档 `WEBVIEW.md:337` 又记 190）· `suspension.mjs` **302**（`:59` 记 290）· `chat-status.js` **127**（`:65` 记 124）· `history.js` **89**（`:64` 记 88）· `panel-messages.mjs` **355**（`:61` 记 354）· `panel-callbacks.mjs` **318**（`:60` 记 317）· `panel-session.mjs` **326**（`:62` 记 325）——「预期」列同误（如 activity.js 起点 +16 ⇒ 末值 ≈221 非 ≈205）。 | 实施批开工前按盘重取「现行」并同步「预期」（本档自带「实施批校准」条款——落为显式一次校准步）。 |
| 4 | 档位（>300 顾问线） | 🟡 | `thincoder-vscode/src/extension/suspension.mjs` 按表 = 290 ⇒ ≈302（实测现 302）——**跨 300 顾问线**且行内无拆分预案／登记；对照同表 CLI `startup.mjs` 行（`:57`）越线时携「拆分预案 = 恢复族出档，触发 = 该档下次实质改动」。同表 `panel-callbacks.mjs` 318／`panel-messages.mjs` 355／`panel-session.mjs` 326 同属 >300 无登记（均在 500 硬限内）。 | 该行补档位注记 + 拆分／登记处置（形态沿同表 `startup.mjs` 行先例）；另三档同拍登记。 |
| 5 | 档面卫生（字面残留） | 🟡 | 批档验收面仍书已退休字面：`:73`（§五 VSC 腿①「出站 `appendRecord` 全链」）∥ `:43`（§三.4 同字面）——协议登记面（`WEBVIEW-PROTOCOL.md:104` 行 22 = `recordAppend`）与承接细则（`WEBVIEW.md:468`）均已统一；`:108` 残留注记判其为「记录面历史」，但 §五 是本舱验收对照页（执行面）。 | 将该两行字面收正为协议登记字面，或在该两行明标「字面以 §3.2 行 22 为准」。 |
| 6 | 范围协调（父侧） | 🟡 | 批档 §5 待裁 1：`SESSION.md:986` 登记的三条读面 delta 判据腿（伪存储混录负控 ∥ 空壳行 ∥ JSON⇄索引两面相等；§2 收正表「核腿 +1」）实施舱未落、归属未定（本舱批内件补 ∥ 另舱 ∥ 收口轮）。 | 父侧定归属后再放该腿（协调项，非设计缺陷）。 |
| 7 | 清晰性（rows 词表） | 🔵 | `rows` 的 `kind` 词表只钉「string + 未知按文本行」（`SESSION.md:970`），各端自自有行模型取值（VSC = `.advisor-content` 行派生——`WEBVIEW.md:468`）⇒ 跨端读他端写的快照可退化为纯文本行；设计未登记该退化面。 | 或在契约内钉最小 kind 词表，或把「跨端退化为文本行」登记为在册行为。 |
| 8 | 档面一致（cap 档类） | 🔵 | 重建径 cap 记「`.digest-cap`（**stop 档类**）」（`WEBVIEW.md:471`）而 live 面 = 两档（`mode:"auto"` dim ∥ `mode:"stop"` warn——`WEBVIEW-PROTOCOL.md:206`）；今日各端仅 stop 产者（`panel-callbacks.mjs:82` 定义 · 单调用点 `panel-turn-loop.mjs:249`）故无行为差，然记录形携 `mode`（`SESSION.md:968`）。 | 表述按记录 `mode` 分档（或以「本端无 auto 产者」限定该假设），与 CLI 侧注记同形。 |

VERDICT: changes-required

计数：🔴×1 · 🟡×5 · 🔵×2（合计 8）。

### 轮次 4（评审子代理）

评审对象 = #726 跨端恢复批 · **轮 3 八条修复核验（轮 4）**。范围（五档全文已读）= `docs/batches/2026-09-30-cross-end-digest-recovery.md` ∥ `docs/core/design/SESSION.md` §5/§6.26/§7/变更记录 ∥ `docs/vsc/design/WEBVIEW.md` §5.1/§5.4/§5.7/§10/变更记录 ∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2/§5/§6.1/§12/§13/变更记录 ∥ `docs/desktop/design/RENDERER.md` §1.1/§2/§3。范围限制：需求档三档与文档地图不在评审面（需求覆盖只按设计自述回指核，未读需求原文）；`TUI-SESSION-VIEW.md` 不在本轮五档清单 ⇒ 其 §6 未核；对盘抽查 = 只读实读（坐标 + 行数口径），非扩面。

**逐号核验（八条：全部落位）**

| # | 原 Severity | 落位核 |
|---|---|---|
| 1 | 🔴 | **落**——`SESSION.md:989`（重建 = 记录位次原位（零配对）∥ 跨页页段尾追加；live = 到达序当刻流末；两径并存）∥ `WEBVIEW.md:409`（live 落点句同值）∥ `WEBVIEW.md:472`/`RENDERER.md:92` 同值（无两说）；变更记录两档（`SESSION.md:1107` ∥ `WEBVIEW.md:781`）；`WEBVIEW.md:226`（裁 A）复核 = 与 live 规则一致（零改）。残项见发现 1。 |
| 2 | 🟡 | **落**——四处同值 `:177/:198`（`SESSION.md:973` ∥ `WEBVIEW.md:467` ∥ `WEBVIEW-PROTOCOL.md:223` ∥ `:416`）+ 变更记录（`WEBVIEW-PROTOCOL.md:535`）；对盘实读：`suspension.mjs:177` = `postMessage({type:"digest",status:"start",…})` 发射行 ✓ ∥ `:198` = `status:"end"` 发射行 ✓；「同点双动作 = 与 `postMessage` 同行」句在 §5.7 ✓；cap 帧点 `panel-callbacks.mjs:83` ✓（定义 `:82-84` 吻合）。 |
| 3 | 🟡 | **落**——表 §四 VSC 行重定（`:129-140`）八行齐；对盘抽验（口径 = 内容行数 = 全文 − 1 含尾行）：`suspension.mjs` 311/310 ✓ ∥ `panel-callbacks.mjs` 318/317 ✓ ∥ `panel-messages.mjs` 355/354 ✓ ∥ `panel-session.mjs` 326/325 ✓ ∥ `activity.js` 189/188 ✓ ∥ `history.js` 89/88 ✓ ∥ `chat-status.js` 127/126 ✓ ∥ `record-restore.js` 现盘不存在 ✓；「预期」列逐行复算 = 起点平移 + 原增量保持（吻合）。 |
| 4 | 🟡 | **落**——四行档位注记齐（`suspension.mjs` 携拆分预案 + 触发；`panel-callbacks`/`panel-messages`/`panel-session` 三行 >300 注记 + 拆分审查单源指针）；四档均 < 500 硬限。 |
| 5 | 🟡 | **落（处置形 = 块级声明）**——`:124`「自本块起以协议登记字面 `recordAppend` 为准 ∥ §三.4 坐标同拍 `:177/:198`」在位；§三.4（`:45`）/§五（`:75`）仍载退休字面（append-only 不回改）——盘点见发现 5。 |
| 6 | 🟡 | **落**——裁决入档（`:125`）= VSC 舱批内件补（编号承接核舱 K1–K4）+ 腿落清单三条与 `SESSION.md:986` 判据 ①②③ 逐条同值。 |
| 7 | 🔵 | **落**——`SESSION.md:970`「跨端退化在册」+ 变更记录（`:1107`）。 |
| 8 | 🔵 | **落**——`WEBVIEW.md:471` cap 重建按记录 `mode` 分档 +「本端现无 auto 产者」限定（`panel-callbacks.mjs:82` 定义 ∥ 单调用点 `panel-turn-loop.mjs:249` 实读吻合）+ 变更记录（`:781`）。 |

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属 / 档面卫生（#1 残项） | 🟡 | `docs/batches/2026-09-30-cross-end-digest-recovery.md:46`（§三.5 VSC 重建要点）仍以裸词「落点镜式」表述重建落位——无定义 ∥ 无指向；#1 的逐号复核只落到 `WEBVIEW.md:226`（裁 A 句），未及该行；同档 `:144`（读回 D6）宣「规范面 `落点镜式` 零残留（余存 = `WEBVIEW.md:472` ∥ 各档变更记录）」——grep 实证 `:46` 命中，残留枚举与盘面不符（余存还应含本档 §2 该行）。 | 该行补一句指向（「落点镜式 = 记录位次原位——定义单源 §5.4/§5.7」）或列入「以本块为准」清单；读回残留枚举同拍收全。 |
| 2 | 档面卫生（坐标族 · 披露面随见①） | 🟡 | `WEBVIEW.md:219`（§5.1 起跑窗条）载 `suspension.mjs:161-167`（「`driveTurn` boundary 支」）；对盘实读（该档现 311 行）：该区间现覆盖 = 分支头（`:163` boundary ∥ `:164` 早返）+ `upstreamAskFn` 起（`:167`）——**未覆盖其所述「起跑快照逐条补发」实体（现 `:183-187`）** ⇒ 同族滞后（±9 = 该档近期增量）；披露面（`:146` 随见①）已如实在册（未动）。 | 同波收正该坐标或标 as-of；#2 已在写点引入「与 `postMessage` 同行」消行号依赖句式，可同式处理。 |
| 3 | 档面卫生（坐标族 · 相邻实测） | 🔵 | `WEBVIEW-PROTOCOL.md:416` §12 `suspension` 行 ② 列载 `suspension.mjs:125/:134`；实读该档两发射点 = `:135`（`active:true`）∥ `:144`（`active:false`）——载值落于 `:125`（`reclaimDigestedBlocks` 内 `continue` 行）∥ `:134`（`postSuspension` 定义行）⇒ 与两发射点均不相接（差 9–10 = 同族滞后量级；该行现无机检兜底——U3② 在册）。 | 与随见① 同波对盘，或标 as-of 收口。 |
| 4 | 范围协调（披露面随见③ · 非缺陷） | 🟡 | 表 §四 CLI 五行现盘漂移（抽验与随见读数一致：`suspension-drive.mjs` 255/254 ∥ `startup.mjs` 322/321 ∥ `lifecycle-records.mjs` 191/190）；「归 CLI 舱结算时校准」为已披露待办。 | 协调项 = 按盘重取「现行」列并在同笔同步「预期」列（与 #3 同式），免以漂移基线判档位。 |
| 5 | 档面卫生（字面收正 #5 处置形） | 🔵 | `:45`（§三.4）∥ `:75`（§五 VSC 腿①）仍载退休字面 `appendRecord`；#5 以块级声明处置（`:124`——append-only 下就地改不可行）——盘点 = 声明在位、指向明确；残余 = 读者只读 §五 而不下读 §2 尾块时的误引可能。 | 维持现状；实现面三处（发出 ∥ 接收 ∥ 协议登记）字面直接采用 `recordAppend`（唯一权威）以防误引。 |
| 6 | 档面卫生（状态面 ∥ 标题面） | 🔵 | ① `:6`（§1 状态行）仍书「评审轮 3（重签）修复轮在跑」而 `:22`（§2）已书「逐号收正落位并读回」——状态面对读（§1 括注携时点「13:1x」）；② `:196` 存同名空标题「轮次 3（评审子代理）」（无内容）+ `:198` 重签标题——空标题易被读作「轮次 3 无发现」。 | ① 状态行随本轮落定刷新；② 两同名标题收并。 |

VERDICT: pass

计数：🔴×0 · 🟡×3 · 🔵×3（合计 6）。

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + **设计评审通过**（轮次 1 = changes-required〔11 条：🔴 协议字面统一 `recordAppend` ∥ 🟡×6 ∥ 🔵×4〕→ 修复轮落定 → **轮次 2 = pass**〔0🔴；新 🔵 一条 = 记录面历史残留，非阻塞〕）。

**实施舱**：eng-coder（设计Token 已签发——值不入档）。**实施面 = 三面**（核缝 ∥ CLI ∥ VSC）——按派发纪律**按面拆舱**（互不跨面；核缝先行，端随其后）。

**实施范围** = §2 落点表：记录形（`digest` 三型 ∥ `subagent` `{meta, rows}`——呈核单源 `SESSION.md` §6.26）∥ 写缝 `pushRecord`（`thincoder-core/context.mjs`——新导出）∥ 读缝 opt-in `historyWindow(…, { records: true })`（默认关——CLI ∥ VSC 读面零改）∥ 两端重建（CLI `historyToLines` 记录分支 + `lifecycle-records.mjs` 新档 ∥ VSC 宿主同点追加 + `recordAppend` 出站 + 页级重建）∥ 容差三则。

**验收** = §2 §五：核/CLI/VSC 三面机检腿（批内件）+ 真机项（父侧闭合）。

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权（代签 ∥ 代点火 ∥ 代派）+ **设计评审轮 4 pass**（0🔴——轮 3 八条修复全落经盘上核讫）+ 定点修复轮（评审发现 1–2）落定。**批准范围** = §二/§三 机制面（0–7）∥ §四 受影响文件面（重定表——VSC 行 as-of 2026-10-01）∥ §五 验收腿。**实施 = 两舱**：核+CLI 舱（`context.mjs` ∥ CLI 四档 + 承载件）∥ VSC 舱（extension 四档 + webview 四档）——同一设计令牌；批内件为三面共件（文件级串行）。**树中遗留面**（09-30 CLI 舱未提交中间态）= 父裁「维持现状待复核」（§1 追记在册）——逐件复核随实施披露。U1/U2（需求侧父侧笔）= 候落（收口前）；U3 ①③ 登记维持 ∥ ② 随测试树重建归口。

## §5 实施记录（eng-coder）
**状态行**：实施完成（VSC 舱 2026-10-01 落讫（九档 ∥ 批内件 20/20 绿 ∥ 审计 1 轮 deviation-found→闭合 ∥ 代码评审 1 轮 pass ∥ fix=0）；上抛 5 项见「七」）



**核缝面先行舱（eng-coder · 2026-09-30）—— 实施记录**

**一、落改（file:line = 交付时点值）**

- `thincoder-core/context.mjs` **440 ⇒ 455 行**：新增导出 `pushRecord(agent, record)`（`:105-117`）——`pushReal` 双胞（直复用 = 零算法副本）：`ts` 打点 ∥ `_recordStore?.append`（尽力面）∥ 尾窗驱逐三面同源；**机器线零触** = 半提取载体形 `{ _fullHistory, _recordStore, _historyWindow, history: [] }`（`history` 弃数组承接——沿桌面先例 `thincoder-desktop/src/main/session-io.mjs:58-65`）；载体缺位（null ∥ 非对象）⇒ 零动作、零抛。
- 批内件 `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（**新档**）：核面腿 K1–K4——K1 写缝（两族记录 ⇒ 人读线形/序/`ts` + 存储同点追加 + 尾窗驱逐；既有 `ts` 不覆写）∥ K2 机器线零触负控（`pushReal` 正控对照——判据可判别）∥ K3 尽力面（未绑 ∥ 存储失败 ⇒ 零抛；载体缺位零动作；载体最小形零驱逐）∥ K4 读缝默认关逐字等价（三径同值 + spacer 全页径等价 + 冻结字面 + `turnStart` 跨记录回扫）+ `{records:true}` opt-in 在位核验。
- `thincoder-core/history-window.mjs` **零改**（读缝已备——`{ records: true }` opt-in `:117/:175-178` 在位核对）；CLI ∥ VSC ∥ 桌面产品码零触（产品树 `pushRecord` 调用点 = 0）。记录形零改（透传——K1 断言形零改名）。

**二、验证读数（定向件）**

- `node --check`：`thincoder-core/context.mjs` ✓ ∥ 批内件 ✓。
- `node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（仓根 `thincoder/`）⇒ **4/4 绿**（K1–K4，~328ms）。仓套件未跑（收口轮父侧 = 唯一一次）。

**三、审计与代码评审（轮次与终态）**

- 内部探索审计（explore · 只读）= **clean**——四类偏差零命中（部分实现 ∥ 静默降级 ∥ 文档漂移 ∥ 清单外改动）；范围注记 2 条 = ① §5 本段（作于其后，本段即落）② `API-CONTRACT.md` 生成区滞后（生成器唯一笔——收口轮机械重跑）。
- 内部代码评审（advisor · code）= **pass**（🔴×0 · 🟡×2 · 🔵×3）——🟡① `context.mjs` 455 行越 300 顾问线（既有债 ∥ 500 硬限内；拆分预案建议 = 下次实质触碰登记）；🟡② 批档 §2 内部不一致：§五 核腿列 2 项 vs 收正表「核腿 +1」（读面 delta 三腿——归属未落定，见「五」）；🔵① 核口无外层 try/catch（桌面薄壳有 ∥ §6.26:978「行为等价」仅非抛出径——规格零抛面已达标）∥ 🔵② 载体 `_fullHistory` 非数组 ⇒ 记录静默落一次性载体（未锁——建议 VSC 舱承接时按 §6.26:977 保证进场）∥ 🔵③ 跑法守卫句式（沿先例——诊断体验）。
- **fix round = 0**（无 must-fix：🟡×2 非阻塞 ∥ 🔵×3 维持现状）。终态 = `clean`。

**四、决策透明表（实现形裁定 —— 3 条）**

- ① `pushRecord` 实现形 = **直复用 `pushReal` + 内部半提取载体**（`history: []` 弃数组承接）——判由：§6.26:971「`pushReal` 双胞 + `history` 以一次性弃数组承接」逐字落位 ∥ 桌面先例同形 ∥ §6.26:978 桌面改调核口「行为等价」保证 ∥ 零算法副本；CLI 传活 agent（§6.26:973/976）⇒ 弃数组必内置于核口，否则机器线受触。
- ② 核口载体缺位守卫（null ∥ 非对象 ⇒ 零动作、零抛）——判由：§6.26:979 失败面；「日志一行」归端侧（VSC 宿主侧明载 `WEBVIEW.md:465` ∥ CLI `TUI-SESSION-VIEW.md:188` 零动作）。
- ③ 批内件腿数 = K1–K4（调用者任务书判据：pushRecord 四项 + 读缝默认关负控——全覆盖）；读面 delta 三腿未实施——归属未落定，见下「五」。

**五、上抛/待裁（1）**

- **读面 delta 三腿**（伪存储混录负控 ∥ 空壳行 ∥ JSON⇄索引两面相等——登记 `SESSION.md:986` + §2 收正表「核腿 +1」）本舱未实施：调用者任务书判据列举 = pushRecord 四项 + 读缝默认关负控（已全绿）；该三腿落点（本舱批内件补 K ∥ 另舱 ∥ 收口轮）待父侧裁定。

**核+CLI 舱（eng-coder · 2026-10-01 · 复核留用式）—— 实施记录**

**一、交付摘要**：#726 核+CLI 舱落定——交付形 = **复核留用**（父裁：树中 09-30 CLI 舱遗留面以届期 §2 终版为准逐件复核——合规留 ∥ 不合规重做）。核口 `pushRecord`（`thincoder-core/context.mjs:112-117`）∥ CLI 五档 = `thincoder-cli/src/tui/lifecycle-records.mjs`（190 行）∥ `suspension-drive.mjs`（254）∥ `agent-turn.mjs`（422）∥ `subagent-freeze.mjs`（248）∥ `startup.mjs`（321）∥ 批内件 `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs`（K1–K7 ∥ C1a–C5 = 15 腿）。**唯一写入 = 批内件头注刷新**（旧标「⚠ 断代…复跑红…勿复跑 ∥ 红不为回归」与实测 15/15 相抵 ⇒ 删旧标、书现行状态；史实归本段）；产品码零写。

**二、遗留面逐件复核去向（判据 = 批档 §2 §三 0–7 / §五 + 修复轮块 + 现盘设计档（后批收正入册）三面合读）**

| # | 件 | 去向 | 复核依据（届盘实读） |
|---|---|---|---|
| ① | `lifecycle-records.mjs`（09-30 舱新档） | **合规 ⇒ 留** | 形构建（三型 + 快照；meta 字段面逐字——`:27-55`）∥ 痕行 live∥重建同调（`digestTraceLines` 单实现——`:101-116`）∥ rows 保尾 ≤500 + 前置省略标记（`boundRows` `:77-95`；`_trimMarker` 行随行集、内部字段不外泄）∥ 终态行回扫（`scanStoreForStartN` / `resolveSplitTerminalNs`——`:163-190`）∥ 合成件 `_frozenSubTask`（渲染端零改消费——`:122-142`） |
| ② | `suspension-drive.mjs`（中间编辑） | **合规 ⇒ 留** | 写点① `:100-102` / `:114-117`（与行同点双动作；`ms` 与 `seconds` 同值单算式——记录携 `ms` ⇒ `digestTraceLines` 单源派生）；自然形（#768 用户裁定）与起跑窗（#754/#748）沿现盘设计档一致 |
| ③ | `agent-turn.mjs`（中间编辑） | **合规 ⇒ 留** | 写点② `:233-235`（cap 三型形 `mode:"stop"` ∥ `turns`；与 cap 可见行同点）；注释面与现盘语义一致（零语义清账批收正） |
| ④ | `subagent-freeze.mjs`（中间编辑） | **合规 ⇒ 留** | 写点③ `:104`（与冻结载体行插入同点）；`freezeReclaimDigestedBlocks` consumed 驱动（#748）完整；dead-export 删除（零语义批次）未伤写点 |
| ⑤ | 批内件（09-30 舱在写） | **复核 + 头注刷新** | 15/15 绿（本舱复跑——读数见三）；断代标与读数相抵 ⇒ 刷新 |
| ⑥ | 核 `context.mjs`（先行舱） | **合规 ⇒ 留** | `pushRecord` 三段面（`ts` ∥ 存储追加 ∥ 尾窗驱逐）+ 机器线弃数组 + 载体缺位守卫（K1–K3 覆盖） |

**三、实跑命令与读数（cwd = `thincoder/`）**

- `node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` ⇒ **15/15 pass ∥ fail 0**（~0.41s；K1–K7 ∥ C1a ∥ C1b ∥ C1c ∥ C2 ∥ C3 ∥ C3b ∥ C4 ∥ C5）。
- 邻批回归（锁串复核）：`node --test docs/batches/2026-10-01-digest-rows-natural-form-cli-vsc.test.mjs` ⇒ **11/11 绿** ∥ `node --test docs/batches/2026-09-30-consult-family.test.mjs` ⇒ **8/8 绿**——共享三档经各舱串行落笔后互不破面。
- 仓套件未跑（父侧收口唯一一次——沿批档口径）。

**四、行数对账（重定表 ∥ 届盘实读——内容行数口径（文末换行不计））**

| 档 | §四 原表（as-of 09-30） | 修复轮 4 随见③（as-of 10-01 中段） | 届盘实读 | 后批归因 |
|---|---|---|---|---|
| `context.mjs` | 440 ⇒ ≈455 | — | **454**（raw 455） | 核缝舱落（+15 在设计预估内；批档「455」= 含尾行口径） |
| `history-window.mjs` | 194 ⇒ 194（零改） | — | **194** | 零改 ✓（读缝已备） |
| `lifecycle-records.mjs` | 新档 ≈120 | 190 | **190** | 舱落（估 ≈120 偏低——设计值已在册） |
| `suspension-drive.mjs` | 211 ⇒ ≈228 | 254 | **254** | #754 ∥ #768 ∥ #748（+4） |
| `agent-turn.mjs` | 417 ⇒ ≈426 | 422 | **422** | 本批 +5；零语义批 δ0 |
| `subagent-freeze.mjs` | 246 ⇒ ≈272 | 265 | **248** | #748（+9）→ 零语义批（−17） |
| `startup.mjs` | 303 ⇒ ≈324 | 321 | **321** | #768 净删 |
| 批内件 | 拟新增（行数未标注） | — | **604**（内容）/ 605（raw） | 核+CLI 段 15 腿 |

**五、决策透明表（实施级）**

| # | 决策 | 判由 |
|---|---|---|
| 1 | 遗留面判据 = 批档 §2 §三/§五 + 修复轮块 + **现盘设计档**三面合读；后批用户裁定（自然形 #768 ∥ 起跑窗 #754 ∥ consult 展开 #748）以设计档现盘为准、不算漂移 | 指令优先级（用户后令＞旧任务书）；批档 `:146` 自陈「归 CLI 舱结算时校准」 |
| 2 | 批内件头注刷新（删「断代/勿复跑/红不为回归」旧标） | 验收要求腿全绿 + 实测 15/15 ⇒ 旧标与事实相抵；史实归本段（记录面） |
| 3 | 产品码零写 | 四件 + 核口全数合规 ⇒ 按父裁「合规留」；改 = 越权 |
| 4 | 读面 delta 三腿（K5–K7）在件且绿 ⇒ 披露 | 修复轮 3 #6 判归 VSC 舱批内件补；实况 = 已在盘 ⇒ VSC 舱勿重复落（撞号风险） |

**六、审计与代码评审轮次与终态**

- **内部探索审计（explore · 轮 1 · 只读）**：**deviation-found（2 项，均为交付步本身）**——① §5 本舱段未落（作于其后，本段即落）② 行数对账未落（本段四）；产品面 + 批内件四类偏差（部分实现 ∥ 静默降级 ∥ 文档漂移 ∥ 清单外改动）**零命中**；六件「合规留用」判定逐件成立。
- **内部代码评审（advisor · 轮 1 · code）**：**VERDICT = pass**（🔴 0 ∥ 🟡 5 ∥ 🔵 5）——逐条处置 = 七；fix round = **0**（无 must-fix）。
- **终态 = clean**（审计 2 项随本段闭合；评审 0 must-fix）。

**七、评审发现逐条处置（响应表）**

| # | Severity | 发现（摘要） | 处置 | 去向 |
|---|---|---|---|---|
| 1 | 🟡 | 重建面丢失 `async`/`queued` 事实 ⇒ 恢复块头恒书 ` · sync`（活流 async 块；`meta` 字段表无该字段——设计面缺口，实现忠实设计） | 报告（跨端记录形契约——非本舱权限） | 设计轮（VSC/桌面同契约面） |
| 2 | 🟡 | 批内件 604/605 行 > 500 硬限（F3-1 无例外 ∥ TESTING.md:49 零维护面 ∥ 先例普遍越线） | 报告（父侧二择：批内件豁免登记 ∥ 按面拆档） | 父侧裁定（拆窗 = VSC 舱追加前） |
| 3 | 🟡 | §6.26「+ 日志一行」未落（核口零日志；CLI 承接句只书零动作） | 报告（设计档面——本舱零触；核缝舱 §5 决策② 已部分披露） | 设计档收正 ∥ 端侧日志 |
| 4 | 🟡 | 批档 §四 CLI 五行「现行 ⇒ 预期」残留漂移（实读 254/422/248/321/190） | 报告（批档 §2 面——designer/父侧笔） | 父侧 ∥ designer（先例 = 本档 VSC 行重定表） |
| 5 | 🟡 | >300 顾问线：`context.mjs` 454 ∥ `agent-turn.mjs` 423 ∥ `startup.mjs` 321（既有债；均 ≤500 硬限内） | 登记（R3 不升级；本批不拆） | 各档下次实质触碰 |
| 6 | 🔵 | TUI §6`:186` cap 坐标滞后（载 `226-232`/`:230`；实盘 `:233-235`） | 报告（设计档面——本舱零触） | 设计档收正（或消行号式） |
| 7 | 🔵 | 回扫注记 `_startN` 写记录对象本体（批内件 C3 需显式剥注记才可复跑——脆弱夹具成因） | 登记（语义等价、存储面未触；改进随下次触碰） | `lifecycle-records.mjs` 触碰面 |
| 8 | 🔵 | TUI §6`:193`「跨页零损（容差①于 CLI 不成立）」缺模式 F 限定 | 报告（设计档面——本舱零触） | 设计档收正 |
| 9 | 🔵 | 合成件 `_charCount` 计入省略标记文本（活流账不含——微差；无功能影响） | 登记 | 下次触碰收正 |
| 10 | 🔵 | 批内件头注腿族枚举 vs 细名（C1b/C1c/C3b）对账可读性 | 维持（范围记法 + 组 bullet 两读 = 15；「15/15」数为机检面） | 可选改进随 VSC 舱追加同笔 |

**八、锁串/注释面届盘复核（与清账批写域重叠三档——开工步）**

- 写点/调用点：`pushRecord` 四调用（`suspension-drive.mjs:102`/`:117` ∥ `agent-turn.mjs:235` ∥ `subagent-freeze.mjs:104`）全在位；
- 零语义清账批（#753 面）：`finishSubTasksByRole` 产品码零命中 ✓；「消费窗」新注族在位（`agent-turn.mjs:299`/`:301` 等）∥ 旧串（`完成即冻结` ∥ `settle 时发` ∥ EN 三串）CLI src 零残留 ✓；
- consult 同族批（#748 面）：`freezeStartSnapshot`（`:120-144`）∥ `reclaim` consumed（`:215-216`）在位；三档互不破面（读数 = 三）。

**九、披露 / 上抛**

- 遗留面去向：见二（四件 + 核口 + 批内件全数留用；唯一写入 = 头注刷新）。
- 越表项：**零**（写入面 = 批内件头注（§四 行 16 在表）+ §5 本段）。
- 设计档漂移（本舱零触——报父侧/designer）：`TUI-SESSION-VIEW.md:186`（cap 坐标）∥ `:193`（模式 F 限定）∥ 同源批档 §2 §三.2 坐标。
- 待裁/上抛：① 评审发现 1（`meta.async?`/`queued?` 记录形提案——跨端）；② 评审发现 2（批内件 >500 判定——豁免 ∥ 拆）；③ 读面 delta 三腿归属与实况（K5–K7 已在档——VSC 舱勿重复落）。

**VSC 舱（eng-coder · 2026-10-01）—— 实施记录**

**一、交付摘要**：#726 VSC 舱落定——**九档**（extension 四件 ∥ webview 四件 ∥ 批内件 VSC 段），按批档 §二/§三（含收正轮 1 / 收正轮 3 / 定点修复轮 4 三块——凡抵触处从收正块：`recordAppend` 字面 ∥ 记录位次原位 ∥ 坐标 `:177/:198` 锚化）+ §四 重定表 + §五 VSC 腿①–④。**批内件 20/20 绿**（K1–K7 ∥ C1a–C5 ∥ **V1–V5**——VSC 段本舱追加：`:613-889`，**零撞号**（K/C 段一行未改，腿号续 V 序）；头注同拍刷新为 20/20 态）。产品码**零越表**：写入面 = §四 表内 8 档 + 批内件；核 ∥ CLI ∥ 桌面 ∥ 设计档零触。

**二、落点表（file:line = 交付时点值）**

| # | 件 | 落点 | 内容 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/suspension.mjs` | `:33`（import）∥ `:149-157`（私有 `pushLiveRecord`）∥ `:192`（start 同点）∥ `:213-216`（end：`ms` 单算式与帧共用） | 写点①/②（digest 起止——与 `postMessage` 同行） |
| 2 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | `:23`（import）∥ `:84-92`（`postDigestCap` 同点） | 写点③（cap——全调用面同收） |
| 3 | `thincoder-vscode/src/extension/panel-messages.mjs` | `:30`（import）∥ `:123-134`（`handleRecordAppend`）∥ `:286-287`（case `recordAppend`） | 出站接收面（fail-soft + 日志） |
| 4 | `thincoder-vscode/src/extension/panel-session.mjs` | `:148-152` ∥ `:177-179` | 读面 opt-in `{ records: true }` ×2（`loadSession` ∥ `loadOlder`） |
| 5 | `thincoder-vscode/webview/activity.js` | `:121-190`（`RECORD_ROWS_MAX_LINES` ∥ `rowLines` ∥ `rowsOf` ∥ `boundRows` ∥ `subagentSnapshotOf` ∥ `emitRecordAppend`）∥ `:123-124`（归档派生点调用——幂等守卫内恰一次） | 出站（快照构建 + `recordAppend` 上行） |
| 6 | `thincoder-vscode/webview/chat-status.js` | `:70-114`（四构形件 `digestTurnEl`/`digestCountEl`/`digestCapEl`/`digestTerminalEl`；`showDigestStatus` 改消费构形件） | 构形件化（live∥重建单一实现） |
| 7 | `thincoder-vscode/webview/history.js` | `:17`（import）∥ `:49-65`（页级 pass：预扫 + 逐记录入元素） | 页级重建入口（记录 ⇒ 元素） |
| 8 | `thincoder-vscode/webview/record-restore.js`（**新档 116 行**） | `:25-41`（`scanPageRounds`——完整轮配对/半轮零元素）∥ `:44-66`（`restoreRecordEls`——同位去重 + 两类元素面）∥ `:70-80`（`buildRestoreSubBlock`——活形同构 + 冻结 + tail-3）∥ `:92-116`（`synthSubModel`/`subStatusOf`） | 重建件（痕 ∥ 归档块；`data-idx`） |
| 9 | `docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` | `:613-690`（装载面：vscode 解析桩 ∥ happy-dom ∥ 真模块）∥ `:697/727/765/829/865`（腿 V1–V5） | 批内件 VSC 段（+286 行） |

**三、实跑命令与读数（cwd = `thincoder/`）**

- `node --test docs/batches/2026-09-30-cross-end-digest-recovery.test.mjs` ⇒ **20/20 pass ∥ fail 0**（K1–K7 ∥ C1a–C5 ∥ V1–V5）。
- 邻批回归（锁串复核——定向集）：`2026-10-01-digest-rows-natural-form-cli-vsc` **11/11 绿**（chat-status 构形件化零行为变）∥ `2026-10-01-digest-rows-natural-form` **8/8** ∥ `2026-09-30-consult-family` **8/8**（真 suspensionSession 装配）∥ `2026-10-01-light-round-4` **10/10** ∥ `2026-09-29-queue-pickup-edge` **8/8** ∥ `2026-09-29-enddiff-clearance` **11/11** ∥ `2026-10-01-audit-remediation` **39/39** ∥ `2026-10-01-zero-semantic-sweep` **9/9** ∥ `2026-09-30-vsc-cleanup-695/701` **23/23 ∥ 7/7** ∥ `2026-09-29-residuals-round2` **12/12** ∥ `2026-09-29-stall-indicator-b` **20/20**。

**邻批红点裁定（不代改邻件——报父侧）**

| 件 | 读数 | 归因 |
|---|---|---|
| `2026-09-29-parity-b1-vsc-core` | 17/22（G2c ∥ G5a ∥ G5b ∥ G6 ∥ G7 红） | **非本舱**：G5a 行 :692 失败 = 模块双实例（`loadSuspensionCore` 经 junction realpath vs 测试 repo 路径——**盘符大小写/双键在册类**，与本舱同批内件夹具收正注（`:43`）同源）；本舱曾引入的 **G5a 导出面表断言已通过重构消除**（`suspension.mjs` 导出面**保持五名**——宿主分派侧同式内联）；G2c/G5b/G6 = 他批在途（桌面/manifest/双键）；G7 行数表 = **先于本舱即红**（表载 `suspension.mjs` 291 vs 设计期实读 310）。 |
| `2026-09-30-digest-persistence` | 3/9（腿 2/3/4/6 = **文件自载「⚠ 断代…勿复跑」**；腿 7 = 桌面面；**腿 5b = 本批设计明文推翻之旧钉**） | 腿 5b「VSC 读面未开直通」= #719 期负向锁，被本批 §5.7「读面 opt-in」**明文推翻**（同锁 CLI 半与桌面半仍绿）；邻件属**已冻结批档**（committed）⇒ **不代改**，报父侧/designer 裁定（刷新钉面 ∥ 登记断代）。 |
| `2026-09-30-crossline-clearance-vsc` | 9/11（T-XL15a/b = 设置写面）∥ `2026-09-30-vsc-residuals` 1/3（provider/config 面）∥ `2026-09-29-desktop-residuals-sweep-wave-a/waveB` ∥ `2026-09-28-desktop-subblock-follow` ∥ `2026-09-29-missing-face-family` ∥ `2026-10-01-digest-row-current-only` ∥ `2026-09-30-triple-end-digest-unify` ∥ `2026-09-30-block-arrival-timing` | **全数非本舱**：失败点分别落在设置/配置写面、桌面面、rc 面、或启动即编译失败（他批删档 `chat-digest-seat.mjs` / `/rc/` 钩缺失 / 双键）——本舱 diff 零触。 |
| 仓套件 | **未跑** | 沿批档口径（收口轮父侧唯一一次）。 |

**四、行数对账（重定表 ∥ 届盘实读；口径 = 内容行数（文末换行不计））**

| 档 | §四 重定表（现行 ⇒ 预期） | 届盘实读 | 判读 |
|---|---|---|---|
| `suspension.mjs` | 310 ⇒ ≈322 | **328** | +6（写点 + 私有写出件；>300 承在册注记 + 拆分触发条件） |
| `panel-callbacks.mjs` | 317 ⇒ ≈325 | **325** | 吻合 |
| `panel-messages.mjs` | 354 ⇒ ≈375 | **371** | −4 |
| `panel-session.mjs` | 325 ⇒ ≈330 | **328** | −2 |
| `webview/activity.js` | 188 ⇒ ≈220 | **261** | **+41**（快照件族为契约必需量；另含邻批 #746/#768 增量——设计预估偏低） |
| `webview/history.js` | 88 ⇒ ≈150 | **103** | −47（页级 pass 简净） |
| `webview/chat-status.js` | 126 ⇒ ≈142 | **151** | +9 |
| `webview/record-restore.js` | 新档 ≈150 | **116** | −34（≤300 达成） |
| 批内件 | —（VSC 段未估） | **890**（604 ⇒ +286） | **>500 硬限**——前舱在册二择（豁免登记 ∥ 按面拆档）**未裁**，本舱按任务书「串接为法」追加；触发点见「七、上抛①」 |

**五、决策透明表（实现级裁定 —— 6 条）**

| # | 决策 | 判由 |
|---|---|---|
| 1 | **写点=宿主同点 + 私有写出件**（`suspension.mjs` `pushLiveRecord` 不导出；`panel-callbacks`/`panel-messages` 同式内联） | 该档导出面 = **W8 修单装载面（五名）契约**（`2026-09-29-parity-b1-vsc-core` G5a 钉法）——本舱不扩契约；§6.26:977 端侧钉定表达式在三点复述（单源=设计档） |
| 2 | 记录 `meta.status` = **本端块模型词原样**（done/cancelled/error）；重建侧**容读并收**（stopped/terminated/failed） | §6.26:969 `status?` 未钉词表（留白）；不发明映射（写侧忠实块头事实）；容读 = 跨端读面退化容差（同「未知 kind 按文本行」精神） |
| 3 | `meta.key` = **本端块键原样**（`sub:<role>#<id>`——与桌面同形） | §6.26:969「块头事实」；重建侧 `parseChannel` 直解；CLI 形（`<role>#<id>`）退化在册（见七、上抛③） |
| 4 | rows 省略标记行 `kind:"meta"` | §6.26:970 未钉 kind；同批 CLI 先例同值（C1c 断言）；重放面按文本行消费 |
| 5 | 半轮判定 = **页内 start/end 配对**（`cap` 只随其打开轮产）；复列 = **逐记录位次**（非整轮聚簇） | §5.7:471「复列 = 全量完整轮…半轮零元素」；§6.26:989/§5.7:472「记录位次原位（零配对）」+ 记录序≡恢复序 |
| 6 | 批内件追加 = **串接为法**（文件级串行） | 任务书明文；前舱「撞号风险」判承接（K/C 段零改）；>500 与二择待裁——如实入表（见四/七） |

**六、审计与代码评审轮次与终态**

- **内部探索审计（explore · 轮 1 · 只读）**：**deviation-found（3 项）**——D1 §5 本舱段 + 行数对账未落（作于其后，本段即落 + 头注同拍刷新）∥ D2 协议登记面未同拍（`WEBVIEW-PROTOCOL.md:116` 仍「拟增」+ §13 行待补——**设计档零触**，报父侧/designer，见七、上抛②）∥ D3 `postDigestCap` 载体缺位支缺「日志一行」（§6.26:979）⇒ **本舱修复**（`:90` 补 `logEvent`，三点同式）。其余四类面（部分实现 ∥ 静默降级 ∥ 文档漂移 ∥ 清单外改动）**主体零命中**；两「待判」= 设计面残余（见七、上抛③④）。
- **内部代码评审（advisor · 轮 1 · code）**：**VERDICT = pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 4）。逐条 = 🟡① 批内件 890 行 >500（父侧二择触发点——非 must-fix，裁决权在父侧）∥ 🟡② 记录 meta 子集缺 `pool` ⇒ 重建块头恒缺「· async/sync」段（设计面缺口——同 CLI 舱评审发现 1 家族；报告设计轮）∥ 🟡③ 跨端 `meta.key` 文法未钉 ⇒「CLI 写、VSC 读」时重建块 `id=null`（设计面缺口；报告设计轮）∥ 🔵① carrier 就位判据宜 `Array.isArray`（前舱 🔵② 承接项）∥ 🔵② 入站 record 无形状门（桌面同族在册）∥ 🔵③ aborted 插值面待统一（现行零行为差）∥ 🔵④ 四件 >300 已在册。均标「非 must-fix」。
- **fix round = 0**（评审后零修：无 must-fix；🔵/非阻塞 🟡 维持登记）。**终态 = clean**。

**七、披露 / 上抛**

- **越表项**：**零**（产品写入面 = §四 表内 8 档；批内件 = §四 行 16 在表；另 +§5 本段与头注刷新）。
- **共件追加**：批内件 VSC 段（`:613-889`，+286 行；**与现盘 K/C 段零撞号**——腿号 V 序、K/C 行零改，grep 核讫）。
- **邻件两钉失效（均不代改——报父侧）**：① `digest-persistence` 腿 5b「VSC 读面未开直通」= 本批设计明文推翻（同锁 CLI/桌面半未动）；② `parity-b1-vsc-core` G5a 之**导出面表**曾因本舱短暂失效——已重构消除（导出面保持五名）；该件现红点在 :692 双实例（在册环境类）。
- **上抛**：① **批内件 >500 二择**（豁免登记 ∥ 按面拆档——拆窗已过，本舱按『串接为法』落，裁决权在父侧）；② **设计档面待笔**（协议 §13 `recordAppend` 行 + 行 22「拟增」去标 ∥ §5.7/§6.26 坐标随本舱落笔校准（起止发射行现 `:190/:214`）；批档 §四 行数对账入段 = 本段四；designer/父侧笔——本舱零触）；③ **设计缺口两条**（`meta` 缺 `pool` 模式词事实 ∥ 跨端 `key` 文法未钉——评审 🟡②③）；④ **「页段尾追加」子句**（§6.26:989 ∥ §5.7:472）：在「零配对 + 半轮零元素」下无可构造案例（实现零对应路径）——请设计面核（残余措辞 ∥ 面缺）；⑤ 容差② 边界如实：归档快照随**下一次** `saveLines` 落槽（会话最后一次落盘之后到达者不落盘——V5 腿已断言「重载可见性 = 至最后一次落盘」）。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**：① **两舱交付**：核+CLI 舱（产品码**零新写**——09-30 树中遗留面逐件复核 = 合规留用；本舱写入 = 批内件头注刷新 + §5）∥ VSC 舱（8 档 + 新件 `record-restore.js` 116 行）。② **父侧亲跑**：批内件 = **20/20 绿**（K1–K7 ∥ C1a–C5 ∥ V1–V5）；邻批定向回归 15 件全绿（digest-rows 11/11 ∥ consult 8/8 ∥ audit-remediation 39/39 等）。③ **设计面随落笔三轮**：#27（协议 §13 `recordAppend` 行补行 ∥「拟增」去标 ∥ 四坐标 `:190/:214` 校准 ∥ 无效子句删）∥ #30（六处收尾——五改一核：`panel-session :152/:179` ∥ §12 两行 `:137/:146` ∥ `:91/:97` ∥ 陈标二去）。④ **仓套件读数（据实）**：五包 `npm test` = **空清单零测**（2026-09-28 全清重置设计态——`test/run.mjs` 空清单守卫，零用例即绿；`thincoder/` 根无 package.json——AGENTS.md 命令面陈旧）——本批验证实据 = 批内件 + 定向回归（非套件）；套件重建二择 = 台账 **#792** 待裁。⑤ 披露/上抛处置：批内件 >500 = 裁**豁免登记**（890 行——批内件惯例，625 行先例在册）∥ 记录形三缺（`async`/`queued`/`pool` + `key` 文法）= **#790**（归批）∥ 设计档坐标残余族 = **#791** 扩账（条件）∥ K5–K7 防重转告闭环（V 序零撞号自证在册）∥ 邻件两钉 = 报备在册（`digest-persistence` 腿 5b 断代件 ∥ `parity-b1-vsc-core` G5a 已重构消除）∥ U1/U2 需求侧笔已落（§1 追记）。⑥ **台账结算**：`#726 → 已核销`。⑦ D7 对账：角色表 §1–§6 ✓ ∥ 状态行 ✓ ∥ 计数（核 1 + CLI 4 + VSC 8 + 新件 1 + 批内件）✓ ∥ 指针（批档 ↔ 台账 ↔ core `SESSION.md` §4.4 F-S7）✓。**收口完成 ⇒ 冻结。**
