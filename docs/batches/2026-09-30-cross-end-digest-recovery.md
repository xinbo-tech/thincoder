# 2026-09-30 · 跨端消化面恢复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #726（#719 设计轮 U1 承接：跨端对齐义务——CLI ∥ VSC 的消化生命周期面（痕 ∥ 归档块）恢复呈现；用户可见端差默认消灭）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」+ 18:28「自动跑完」。侦察（explore id=4 · 2026-09-30 18:30）= VSC：live 归档既有（`webview/activity.js:99-110`），但会话数据面无记录写入/读取（`record:append` 仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（重建只认 user/assistant/tool——`webview/ui.js:159-165`）；CLI：痕 = `pushLine` 瞬态、块 = 冻结载体行（内存）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`startup.mjs:22-116`）。共享面 = 核读缝 `historyWindow {records:true}` + `pushReal` 半载体写 + 记录存储绑定；端侧重建器 = 各端自做。。
> 台账 = #726（SESSION · 归批）。前情 = docs/batches/2026-09-30-digest-persistence.md §2.七 U1（已收口 2026-09-30）。
## §1 讨论（主 agent）
**状态行**：进行中（需求三档落 ✓（core F-S7 ∥ VSC F-W1/I-7 ∥ CLI F18）· 设计轮派发（eng-designer #8））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #726（#719 · U1 承接）+ 用户 2026-09-30 18:24 ∥ 18:28 令。

**侦察落定（explore id=4 · 18:30）**：**VSC** = live 归档既有（`thincoder-vscode/webview/activity.js:99-110`），但会话数据面**无记录写入 ∥ 无读取**（`record:append` 全仓仅桌面）⇒ 面板重开 ∥ reload 后痕与归档块全失（恢复重建只认 user/assistant/tool——`webview/ui.js:159-165`）；**CLI** = 痕 `pushLine` 瞬态（`src/tui/suspension-drive.mjs:85-101`）、块 = 内存载体行（`src/tui/subagent-freeze.mjs:82-97`）⇒ 重启 ∥ `/session` 后全失（`historyToLines` 无 records 分支——`src/tui/startup.mjs:22-116`；正文消息本身在）。**共享面** = 核读缝 `historyWindow {records:true}`（`thincoder-core/history-window.mjs:117/175-178`）+ `pushReal` 半载体写（`thincoder-core/context.mjs:93-103`）+ 记录存储绑定（`session-store.mjs:361`——CLI 已绑 ∥ VSC 未绑）；**端侧重建器 = 各端自做**（桌面 `page-read.mjs` 折叠/位次算法是否上提 render-core = 设计第一分叉）。

**需求已落三档（父侧笔）**：core `docs/core/requirements/SESSION.md` §4.4 **F-S7**（记录两族入存储 + 读面 opt-in + 默认关负控）∥ VSC `docs/vsc/requirements/WEBVIEW.md` **F-W1 扩展** + **I-7 收窄**（未归档块口径）∥ CLI `docs/cli/requirements/TUI.md` **F18** + 变更记录。

**范围（本批）**：两端**写面 + 读面 + 重建器**（机制承接 #719 语义）；**机制单源位置 = 设计轮裁定**（现单源住桌面设计档 `docs/desktop/design/RENDERER.md` §1.1）。**边界**：桌面零触；呈现语义零改（形态既有）；两条在册容差（跨页截断轮 ∥ 归档快照晚一拍）承接后沿用 ∥ 收正 = 设计裁。

**下一手**：设计轮（本档 §2）→ 评审 → 批准 → 实施（两端舱）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮（评审轮 1）十一条逐号收正落位并读回（2026-09-30）；机制单源 = SESSION §6.26；上抛 3 维持）
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

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-30）**：依据 = 用户 18:28「自动跑完」授权 + **设计评审通过**（轮次 1 = changes-required〔11 条：🔴 协议字面统一 `recordAppend` ∥ 🟡×6 ∥ 🔵×4〕→ 修复轮落定 → **轮次 2 = pass**〔0🔴；新 🔵 一条 = 记录面历史残留，非阻塞〕）。

**实施舱**：eng-coder（设计Token 已签发——值不入档）。**实施面 = 三面**（核缝 ∥ CLI ∥ VSC）——按派发纪律**按面拆舱**（互不跨面；核缝先行，端随其后）。

**实施范围** = §2 落点表：记录形（`digest` 三型 ∥ `subagent` `{meta, rows}`——呈核单源 `SESSION.md` §6.26）∥ 写缝 `pushRecord`（`thincoder-core/context.mjs`——新导出）∥ 读缝 opt-in `historyWindow(…, { records: true })`（默认关——CLI ∥ VSC 读面零改）∥ 两端重建（CLI `historyToLines` 记录分支 + `lifecycle-records.mjs` 新档 ∥ VSC 宿主同点追加 + `recordAppend` 出站 + 页级重建）∥ 容差三则。

**验收** = §2 §五：核/CLI/VSC 三面机检腿（批内件）+ 真机项（父侧闭合）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-30 · 核缝面先行舱 · K1–K4 全绿（4/4）· 审计 clean ∥ advisor pass · fix round = 0 · 待裁 1（读面 delta 三腿归属））



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

## §6 验证与收口（父代理）
