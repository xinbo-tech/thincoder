# 2026-09-29 · residuals-round2
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 台账在册小件残族（#585 · #586 · #587 · #590 · #578 码面部）+ 用户 2026-09-29 11:4x 令「把这些都处理了吧」。
> 台账 = #585–#590（核 ∕ 桌面 ∕ VSC · 归批）。前情 = 台账 #585 ∕ #586 ∕ #587 ∕ #590 ∕ #578（码面部 ∕ 上抛族在册）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 条目与来源（父侧 · 2026-09-29）

用户 11:4x 令「把这些都处理了吧」→ 在册小件残族 + 分诊轮放行：**#585**（ledger 盘符归一不等价）· **#586**（W8 判官重立）· **#587**（goal-panel 跨端一致）· **#590①**（process-probe 拆执行面）· **#578 残点**（届盘相抵复核 + `file-links.mjs:5` 死括注一行）· 顺笔 **#589**（B5 残引族）· **#593**（write-gate 注释行）。

### 1.2 授权与边界

- 设计件三腿（`…round2.test.mjs` ∕ `-vsc` ∕ `-desktop`；#545 立即形 = `.thincoder/tmp/` 先行 → 父侧 copy 收位）。
- 面划分：核面（`ledger.mjs` ∕ `process-probe`）∥ VSC 面（`panels.js` ∕ `status-bar.js` ∕ `state.js`）∥ 桌面面（`file-links.mjs` 一行）。
- 真机面（goal-panel 五点）= 父侧闭合；评审点火归父侧。
- **#578 = 已由 desktop-micros 落定 + 父侧核销（2026-09-29 12:11）——本批零改复核在册**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（评审轮次 1 ∕ 轮次 2 修正落定（1–6 全处置；#589 需求档项 = no-op））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（residuals-round2 · 2026-09-29 · eng-designer）**

> 任务书依据 = 派单（目标与理由 + 已知事实 + 设计要点与禁止范围）+ 台账 #585 ∕ #586 ∕ #587 ∕ #590 ∕ #578 逐行实读 + 届盘实读（2026-09-29 12:0x–12:3x；file:line 均为现盘）。
> 口径：本轮**零产品码 ∕ 零设计档笔**（随 §2『设计轮上抛处置』块修订——该块已落档面笔）——产出 = 五条设计行 + 三波划分 + 评审范围清单；实施归波（后轮）。
> 注（上抛 1）：本档 §1 = 空模板（模板占位行在盘）——本设计轮任务书依据 = 派单文本；§1 补文归主 agent。

**1. 本批条目（覆盖 ∕ 不纳入）**

| 台账 | 面 | 届盘实读 | 处置 |
|---|---|---|---|
| #585 | 核 | 仍真——`ledger.mjs:187-189` 内联归一在盘；单源面表（core-hygiene §2.2.1 ③）未列 | 本批设计 · 波 1 |
| #586 | 核 ∕ VSC ∕ 档 | 仍真——判官档全仓零命中；活面悬空引文 = 码 9 处 + 档 6 档 13 处 | 本批设计 · 波 1 主体 + 波 2 ∕ 3 引文 |
| #587 | VSC | 仍真——`panels.js:30-35` goal 到达即 `display:block`（有效默认 = 显） | 本批设计 · 波 2 |
| #590① | 核 | 仍真——`process-probe.mjs` 322 行 > 300；消解条件（下次实质改动）已触发 | 本批设计 · 波 1 |
| #578 | 桌面 | **相抵**——①③ 已由 desktop-micros 批落定并收口（其 §6 结算「已核销」）；同族残点 1 处在盘 | 复核零改 + 残点一行 · 波 3（上抛 2 ∕ 3） |
| 不纳入 | — | #528 ∕ #530 族遗留候选 = 无（派单裁 · 零扩面）；#590②–⑤ 留台账原行；#589 ∕ #593（task_book 指本档、派单五条未列）不纳入（上抛 6 ∕ 7） | — |

**2. 五条逐条设计行（现状 ⇒ 修法 ⇒ 判据 ⇒ 改动面 ⇒ 验收）**

**#585 · `notifyKey` 内联盘符归一 ⇒ 单源化**

- 现状：`thincoder-core/ledger.mjs:184-189` `notifyKey` = `resolve(ledger).replace(/\\/g,"/").replace(/^([a-z]):/, 大写)`——内联盘符归一（形与 `session-slots.mjs:73-75` `normalizeCwd` 不同）；core-hygiene §2.2.1 ③ 逐面表未列（批外观察在册 = `docs/batches/2026-09-29-core-hygiene.md:439`）。
- 等价判定（判据 = 与 `normalizeCwd` 同输入输出逐字一致）：**不等价**——同输入 `d:\x\y` ⇒ `normalizeCwd` = `D:\x\y`，`notifyKey` = `D:/x/y`（分隔符折叠 + `resolve` 绝对化属 notifyKey 独有）⇒ 走「改直调」支。
- 修法：`notifyKey = normalizeCwd(resolve(ledger).replace(/\\/g, "/"))` + `import { normalizeCwd } from "./session-slots.mjs"`（取法先例 = `ledger-db.mjs:23` 同向同形）。**输出逐字节不变**（与旧内联同正则 ∕ 同替换语义；持久去重键形零变——跨端共享键不破）。环面：`session-slots.mjs` 静态图不含 ledger（本设计轮 grep 实读）；且 `ledger.mjs` 经 `ledger-db.mjs:23` 已可达 session-slots ⇒ 新增直边零新增可达性。
- 判据：a) 输出回归（win32 平台守卫样本：小写盘符 ∕ 大写 ∕ 反斜杠 ∕ 混写 ⇒ 输出恒等于落定前形）；b) 单源：`ledger.mjs` 内 `^([a-z]):` 零命中（源码切片）；c) 消费面零改（`ledger-surface.mjs:15` import 面逐名在）。
- 改动面：`thincoder-core/ledger.mjs`（216；+1 import ∕ `:184-189` 注体收正；Δ≈+1~2）· `docs/core/design/LEDGER.md`（472；§2.1 `:59` ∕ `:62` 句收正——盘符步 = normalizeCwd 直调、分隔符折叠自持；变更记录一行）。
- 验收：波件腿 L1（平台守卫）+ b 源码切片；`node scripts/doc-check.mjs` 本批写域零新增红。零行为变（无真机面）。

**#586 · W8 契约②判官重立 + 引文清悬**

- 现状：`thincoder-vscode/test/engine-floor-guard.test.mjs` = 全仓零命中（判官缺盘）；不变量失守无自动拦（#112 ∕ #113 破链由偶发扫描捕获——在册）。测试面现行制（2026-09-28 全清令 + `thincoder-vscode/test/files.mjs` 重建规则行）：**单元档 = 批次本地件**（名随批次档 · 住批次目录 · 不进仓套件）。
- 修法（两件同笔）：
  1. **重立判官 = 批次件** `docs/batches/2026-09-29-residuals-round2.test.mjs`（#545 立即形：实施者写 `.thincoder/tmp/` → 父侧 copy 终位）。
     - 腿 A（主体 · W8 契约②）= 端壳入口静态闭包扫描（算法 = 注释先剥离 ∕ 静态 import ∕ export-from 入闭包 ∕ 动态 `import()` 不入闭包 ∕ `vscode` 宿主说明符豁免 ∕ 裸包经 createRequire 解析 ∕ 不可解析单列诊断；先例 = `.thincoder/tmp/p4ii-w8-scan.mjs` 同源算法）：① 现树绿（自 `thincoder-vscode/extension.mjs` 闭包零 `node:sqlite` ∕ unresolved 空）；② 破链夹具红（临时目录合成 `entry→mid→import "node:sqlite"` 链 ⇒ 必检出）；③ 反证腿（夹具动态 `import()` ⇒ 不入闭包 ⇒ 绿——防判据过宽）。
     - 腿 B（引文消悬所必需）= `panel-chat.mjs` 入口守卫同址案（源文本断言：`ensurePanelAgent(panel, turnSlot)` 后同档出现 `ensureMemoryHandle()`——原缺盘件 `:152-154` 案；判据在册 = `VSC-DEBT.md:353-354`）。【备选在册：腿 B 若不携 ⇒ 三码面 ∕ 两档面引文改述「约束在册 · 机检缺」；本设计取「携」。】
  2. **引文清悬（全量改指新载体 · 同笔）**：
     - 码面 9 处——核 `agent/family-tools.mjs:16` ∕ `agent/child-marks.mjs:6`；VSC `src/agent/setup-tooltable.mjs:12` ∕ `src/embed-config.mjs:11` ∕ `src/extension/ledger-surface.mjs:15` ∕ `src/extension/panel-chat.mjs:24` ∕ `src/extension/panel-turn-loop.mjs:9` ∕ `src/extension/panel-turn-stages.mjs:10` ∕ `src/extension/session-index-command.mjs:7`（旧坐标 `:129` ∕ `:152-154` 随改指去旧行号 ∕ 按新档实读重锚）。
     - 档面 6 档 13 处——`AGENT-LOOP-UPSTREAM.md:587 ∕ :753 ∕ :788` · `AGENT-LOOP.md:427 ∕ :429` · `MEMORY.md:284 ∕ :589` · `TURN-CAP-CONTINUE.md:104 ∕ :107` · `VSC-DEBT.md:351 ∕ :557 ∕ :690` · `SHELL.md:100`。
     - 改指形态 =「W8 契约②判据（现载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`；单测树重建时回迁端侧单测档）」。
  3. **余族登记**：缺盘件另载族（版本闸边界 ∕ sqlite 缺失分支 ∕ 底线三态 ∕ 接线机检〔挂点+顺序+值锁+入册〕∕ T5 核心身份行）覆盖现状 = 0 ⇒ 登记「单测树重建时恢复」（上抛 4）。
- 判据：腿 A①②③ + 腿 B 现树绿；清悬 = `engine-floor-guard` 零残余——**扫描域（可判定；实施 grep 同域）**：① 四包码（`thincoder-core` ∕ `thincoder-cli` ∕ `thincoder-vscode` ∕ `thincoder-desktop`，`*.mjs ∕ *.js ∕ *.cjs`，排 `.thincoder/tmp`）；② `docs/**/*.md` 活面（记录面两域除外——见下）。
  **记录面排除（冻结不动）**：`docs/batches/**`（批档）· `docs/core/design/MANIFEST.md` 受影响文件表批快照行（`:180`「（`engine-floor-guard` 零改）」即此面——as-of 快照非活引）。实施后残余 = 恰上述记录面两域（逐处入 §5）。
- 改动面：新批件（≈170–220 行）· 码引文 9 档（187 ∕ 24 ∕ 102 ∕ 182 ∕ 139 ∕ 260 ∕ 311 ∕ 250 ∕ 43——逐处一行级）· 档引文 6 档 13 处（逐处一行级）。
- 验收：`node --test docs/batches/2026-09-29-residuals-round2.test.mjs`（腿 A ∕ B 全绿 · cwd = 仓根）+ 清悬 grep 读数入 §5。

**#587 · VSC goal 面板默认显隐对齐**

- 现状：VSC `webview/panels.js:30-35` `renderGoalPanel()`——`goalPanelVisible(S._goalInfo)` 真 ⇒ `display:block`（HTML 初始 none = `webview/index.html:37`）⇒ **有效默认 = 显**、零开合态；桌面 = 本地开合 + 默认合（`renderer/views/goal.mjs:13-36 ∕ :47-56` · `mount-cards.mjs:105 ∕ :114`——#554② 落定）。裁定在册 = 残余族清账 §1.x「保持合不回翻」+ 本差已立 #587「归 VSC 面处置——不得登记保留」（`docs/batches/2026-09-29-desktop-residuals-sweep.md:25`）。
- 修法（VSC 面 · 桌面零动）：① `webview/state.js` S 字面增 `_goalPanelOpen: false`（该档自述规则 =「跨模块共享状态入 S」——本态消费面 = panels.js 渲染 + status-bar.js 开合出口，恰两模块）；② `renderGoalPanel()` 显隐改判 `goalPanelVisible(S._goalInfo) && S._goalPanelOpen`（`goalPanelVisible` 真时照常 `replaceChildren`——开时内容不陈旧；显隐只随态）；③ `status-bar.js` `wire("goal-badge", …)`（`:98`）goal 支改**翻态出口**（`S._goalPanelOpen = !S._goalPanelOpen` + 按态施用 display；task-badge 支零动）；④ 清空径（`clearPanels` ∕ 目标缺席）照旧隐、开合态**不重置**（= 桌面「构树重挂不丢态」同语义）。
- 判据（同 goal 态两端可见行为一致 · 五点）：① goal active 到达 + 未开合 ⇒ 两端隐；② 点按 🎯 ⇒ 两端显；③ 再点 ⇒ 两端隐；④ 开态下 goal 数据更新 ⇒ 两端保持开；⑤ 目标缺席 ∕ 清空 ⇒ 两端隐（实施以届盘实读为准）。
- 改动面：`thincoder-vscode/webview/panels.js`（125；≈±2）· `webview/status-bar.js`（128；≈±3）· `webview/state.js`（137；≈+1+注）· `docs/vsc/design/WEBVIEW.md`（728；§2 行面板区补「goal = 默认合 + 🎯 开合」一句 + 变更记录一行）。
- 验收：波件腿 L3（批次件 · 假 DOM 直驱）：默认合 ∕ 两态切换 ∕ 重渲保态 ∕ 缺席即隐 + 结构切片（status-bar 翻态写点在场）；真机面（父侧）：VSC 面板默认隐 + 🎯 两态。

**#590① · `process-probe.mjs` 拆分**

- 现状：`thincoder-core/process-probe.mjs` 322 行 > 300（硬限 500 内）；预案在册 = `CORE-UNIFICATION.md:1125`（行 10：抽探测执行面 ≈155 行外提 `process-probe-exec.mjs` 式；消解条件「该档下次实质改动时」——B1 收正轮 classifyEnd 三支化 + `DESKTOP_END_RE` 补族 = 实质改动已发生）。
- 修法（按预案 · 切点 as-of 现盘）：**迁入 exec**——`execFile` ∕ `execFileSync` import（前者执行面独用；后者主档同持——见「留主档」末）· `:26-27` 双超时常量 · `:48-61` 注入缝（`_testImpl` + 两 setter）· `:63-66` `uniqPids` · `:68-104` 解析族 · `:106-113` `execFileP` · `:115-143` `batchAlive` · `:145-165` `batchAliveAsync` · `:167-194` `probeCmdlines` · `:196-214` `probeCmdlinesAsync`；**留主档**——`:29-31` `SYNC_PROBE_MS` · `:33-46` 三标记族 · `:216-222` `isProductProc` · `:224-231` `classifyEnd` · `:233-250` `ownerState` · `:252-269` `probeOwnersSync` · `:271-283` `probeOwnersAsync` · `:285-306` `isProcessAlive` · `:308-322` `filterDeadOwners` + re-export 块；**主档自留** `import { execFileSync } from "node:child_process"`（`isProcessAlive`（`:289-306`）win32 分支 `:294` 直调——评审 #4 补漏；不做转口——执行面同 import 各持）。**主档取回账（评审轮次 2 发现 2 补漏）**：① 执行四名（`batchAlive` ∕ `batchAliveAsync` ∕ `probeCmdlines` ∕ `probeCmdlinesAsync`）**主档 import + re-export**——`export { … } from` 形**不绑定本地名**、主档自用（`probeOwnersSync` `:262 ∕ :266` ∕ `probeOwnersAsync` `:276 ∕ :280`）须本地名，故 import 与 re-export 分列、导出名面逐字保；② `uniqPids`（`:63-66`）取回 = **exec 导出该名 ∕ 主档 import**（选定——被留主档两束函数 `:260 ∕ :274` 与执行四函数双用；二择另项 = 主档自留粒，不取：执行面同用 ⇒ 双实现 ∕ 反向 import 成环）。**机械收正一处（对预案「注入缝留本档」句）**：缝随执行面外提——其唯一读取点 = 执行四函数（同档则免回引 ∕ 免环）；主档 re-export 缝名与执行四名 ⇒ **导入面逐字零改**（含 VSC `session-io.mjs:32` ∕ 核七消费档；`isProcessAlive` 经 import 取用 exec 的 `parseTasklistPids`）。
- 判据：a) 两档 ≤300（`wc -l`）；b) `node --check` 双档绿 + 双档可加载；c) 主档公开名逐名在场（14 名：`SYNC_PROBE_MS` ∕ `_setProcessProbeTestImpl` ∕ `_resetProcessProbeTestImpl` ∕ `batchAlive` ∕ `batchAliveAsync` ∕ `probeCmdlines` ∕ `probeCmdlinesAsync` ∕ `isProductProc` ∕ `classifyEnd` ∕ `ownerState` ∕ `probeOwnersSync` ∕ `probeOwnersAsync` ∕ `isProcessAlive` ∕ `filterDeadOwners`；去两测试缝 = 12 名）且 re-export 同值；d) 注入缝跨档有效（`_setProcessProbeTestImpl({aliveFn})` ⇒ `batchAlive([1])` 返回注入集）；e) 消费面烟测（加载 OK：核七档 = `ledger-executors.mjs` ∕ `peer-instances.mjs` ∕ `session-gc.mjs` ∕ `session-lifecycle.mjs` ∕ `session-slot-claims.mjs` ∕ `session-slots.mjs` ∕ `session-stale.mjs` + VSC `session-io.mjs`）；f) `isProcessAlive` 调用级烟测（win32：`isProcessAlive(process.pid)` = true（tasklist 真路——证 `execFileSync` 符号链齐）；非 win：守卫路同调不抛）；g) 主档调用级烟测（`probeOwnersSync` ∕ `probeOwnersAsync`：缝注入 `_setProcessProbeTestImpl({aliveFn})` ⇒ 束返回不抛——证 `uniqPids` 取回链齐）。
- 改动面：`thincoder-core/process-probe.mjs`（322 ⇒ ≈150–160；Δ≈−165）· 新 `thincoder-core/process-probe-exec.mjs`（≈170–180）· `docs/core/design/CORE-UNIFICATION.md`（1991；行 10 兑现收正（实测读数）+ 变更记录一行——实施后落）。
- 验收：波件腿 L4 + b–g 项；跨档边零新风险：两档均零 `node:sqlite`（W8 闭包腿 A 复跑同证——VSC 静态图的 `process-probe.mjs` 面新增 exec 边仍清洁）。

**#578 · 桌面面（复核 + 残点）**

- 现状（届盘实读 · 与派单事实相抵）：① `deleteSession` 失败径可见面**已落**——`renderer/mount-sessions.mjs:384 ∕ :392` 两径 `showToast(t("session.deleteFailed", …))` + `renderer/i18n-views.mjs:83 ∕ :225` 两语键（desktop-micros §5 在册——`:290 ∕ :291` 两行，2026-09-29）；② `notify.mjs:9` 自载句**已消解**——「设计档收正归设计面轮」在该档零命中（micros §5 在册——消解行 `:288` ∕ J-3 读数 `:322`；`:234` 复核 = 历史回溯句 ∕ 零失效工作令）；③ **同族残点在盘** = `src/main/file-links.mjs:5` 悬挂括注「（单源——原『多实现面各自落地』句随上提失效；**设计档收正归设计面轮**）」——而所指设计档收正**已落**（`PROJECT.md:79` KD-39 ∕ `UI.md:417` = 「只述实现形态」形；全活档「多实现面各自落地」零命中）⇒ 该括注 = 死工作令残句。
- 修法：①/② = **零改**（复核确认——实读证据入 §5）；③ = `file-links.mjs:5` 括注收正（删死指向，留「上提核件单源」事实句——一行级；先例 = micros `notify.mjs:9` 同形消解）。台账 #578 行 = 陈旧（仍「在途」）⇒ **请父侧收正核销**（上抛 2）。
- 判据：③ 后全仓四包码面「设计档收正归设计面轮」= 0 命中（扫域 = *.mjs ∕ *.js ∕ *.cjs，排除 `.thincoder/tmp` 与 `_archive`）；①/② 复核 = 两档键 ∕ 两径 ∕ 单句逐点实读在册。
- 改动面：`thincoder-desktop/src/main/file-links.mjs`（34；Δ≈±0~−1）。
- 验收：波件腿 L5（扫荡腿）+ 复核实读行。

**3. 关键决策（KD）**

- KD-1 #585 判定 = **不等价** ⇒ 改直调；输出逐字节不变（严禁改变持久去重键形 ∕ 跨端共享键形）。
- KD-2 #586 载体 = 批次件（全清令口径 ∕ `files.mjs` 重建规则；回迁 = 单测树重建时——在册消解条件）；引文全量改指同笔（漏一处 = 再悬空）。
- KD-3 #586 腿 B 随重立恢复（引文消悬所必需）；备选（不携 ⇒ 引文改述）在册不取。
- KD-4 #587 方向 = VSC 对齐桌面「默认合」（残余族清账 §1.x 裁定；不登记保留）；开合态载体 = `S`（跨模块共享状态入 S——state.js 自述规则）。
- KD-5 #590 注入缝随执行面外提（对预案句的机械收正）；主档 re-export 保导入面零改。
- KD-6 波 = 三波（核 ∕ VSC ∕ 桌面）文件域互斥 · 各自成件 · 可独立实施。
- KD-7 #578 = 复核零改 + 残点一行；零新语义 ∕ 零扩面。

**4. 上抛（findings）**

1. 本档 §1 = 空模板（笔权 = 主 agent）——任务书依据 = 派单文本。
2. #578 与派单事实相抵：①③ 已落 + 批已收口核销，而台账行仍「在途」（updated_at 09-28T20:58）⇒ 请父侧收正 ∕ 核销。
3. #578 同族残点（`file-links.mjs:5`）纳入波 3（micros 两次披露在册未落）；如父侧另裁 ⇒ 摘除该行。
4. #586 余族覆盖 = 0（版本闸 ∕ sqlite 缺失分支 ∕ 底线三态 ∕ 接线机检 ∕ T5 核心身份行）——登记「单测树重建时恢复」；如须一并重立 ⇒ 扩腿（本设计未含）。
5. #586 形 = 批次件而非即刻回迁 `thincoder-vscode/test/` 树（理由 = 全清令 + `files.mjs` 重建规则 + runner 清单自检）；如择即刻回迁 ⇒ 须同步 `test/files.mjs` 登记并披露与全清令关系。
6. #589 ∕ #593（台账 task_book 指本档、派单五条未列）——本设计未纳入；裁入则波 1 ∕ 2 顺笔（一行级 ×2 + 一件）。
7. #590②–⑤（打包件 exe 名 unverified ∕ 批档存档坐标 ∕ 核测试树空清单 ∕ 行数锁脆性）留台账原行——不在派单射程。
8. 只报（未裁）：`PROJECT.md:79` KD-39「语义同源 = `thincoder-vscode/src/extension/file-links.mjs`」——R2 ∕ parity-b4 上提后语义源 = 核件（`thincoder-core/file-links.mjs`，其档头自载「已随 parity-b4 迁移轮改指本档」），该指针或需按核单源复核。

**5. 波划分（一面一波 · 文件域互斥 · 可独立实施）**

| 波 | 面 | 条目 | 实施者 | 验收（机判优先） |
|---|---|---|---|---|
| 波 1 · 核面 | 核件 + 判官件 + 核档 | #585 · #590① · #586（判官件 + 核面引文） | eng-coder（码）+ eng-designer（档） | 腿 L1 ∕ L2（A–B） ∕ L4 绿；`node scripts/doc-check.mjs` 本批写域零新增红 |
| 波 2 · VSC 面 | vsc 码 + vsc 档 | #587 · #586（VSC 码引文 7 + VSC-DEBT 引文） | eng-coder（码）+ eng-designer（档） | 腿 L3 绿；真机面（父侧：默认隐 ∕ 🎯 两态） |
| 波 3 · 桌面面 | 桌面码 + 档引文 | #578（复核 + 残点）· #586（SHELL.md 引文） | eng-coder | 腿 L5 绿 + 复核实读行；`node scripts/doc-check.mjs` 本批写域零新增红 |

**6. 受影响文件表（现读 = as-of 2026-09-29 修正轮重读；口径 = 读具总行数；Δ = 预期）**

> 总注：现读 = as-of，实施轮届盘重读——行数 ∕ 坐标均以届盘实读为准；四档与现盘 ±1 = 已披露计法差（文末行计法）：`ledger.mjs` 216/217 · `MEMORY.md` 605/606（附录表 606 同）· `AGENT-LOOP-UPSTREAM.md` 1015/1016 · `AGENT-LOOP.md` 599/600。

波 1（核面）：

| 文件 | 现读 | 变更 | 实施者 |
|---|---|---|---|
| `thincoder-core/ledger.mjs` | 216 | #585：+1 import + `:184-189` 收正；Δ≈+1~2 | eng-coder |
| `thincoder-core/process-probe.mjs` | 322 | #590：拆分余量；Δ≈−165（⇒≈150–160） | eng-coder |
| `thincoder-core/process-probe-exec.mjs`（新） | — | #590：探测执行面（≈170–180） | eng-coder |
| `thincoder-core/agent/family-tools.mjs` | 187 | #586：`:16` 一行引文改指；Δ≈±0 | eng-coder |
| `thincoder-core/agent/child-marks.mjs` | 24 | #586：`:6` 一行引文改指；Δ≈±0 | eng-coder |
| `docs/batches/2026-09-29-residuals-round2.test.mjs`（新 · 批件） | — | 腿 A ∕ B ∕ L1 ∕ L4；≈170–220；#545 立即形（`.thincoder/tmp/` → 父侧 copy） | 实施者 |
| `docs/core/design/LEDGER.md` | 472 | #585：§2.1 `:59` ∕ `:62` 句收正 + 变更记录一行；Δ≈+2 | eng-designer |
| `docs/core/design/CORE-UNIFICATION.md` | 1991 | #590：`:1125` 行 10 兑现收正 + 变更记录一行；Δ≈+1 | eng-designer |
| `docs/core/design/AGENT-LOOP-UPSTREAM.md` | 1015 | #586：3 处引文改指；Δ≈±0 | eng-designer |
| `docs/core/design/AGENT-LOOP.md` | 599 | #586：2 处引文改指；Δ≈±0 | eng-designer |
| `docs/core/design/MEMORY.md` | 605 | #586：2 处引文改指；Δ≈±0 | eng-designer |
| `docs/core/design/TURN-CAP-CONTINUE.md` | 219 | #586：2 处引文收正（`:104` 先例坐标 ∕ `:107` T5 断言改登记）；Δ≈±0 | eng-designer |

波 2（VSC 面）：

| 文件 | 现读 | 变更 | 实施者 |
|---|---|---|---|
| `thincoder-vscode/webview/panels.js` | 125 | #587：显隐判据 + 态读；Δ≈±2 | eng-coder |
| `thincoder-vscode/webview/status-bar.js` | 128 | #587：goal 支翻态出口；Δ≈±3 | eng-coder |
| `thincoder-vscode/webview/state.js` | 137 | #587：`_goalPanelOpen` 槽 + 注；Δ≈+2 | eng-coder |
| `thincoder-vscode/src/agent/setup-tooltable.mjs` | 102 | #586：`:12` 引文改指（去旧 `:129`）；Δ≈±0 | eng-coder |
| `thincoder-vscode/src/embed-config.mjs` | 182 | #586：`:11` 引文改指；Δ≈±0 | eng-coder |
| `thincoder-vscode/src/extension/ledger-surface.mjs` | 139 | #586：`:15` 引文改指；Δ≈±0 | eng-coder |
| `thincoder-vscode/src/extension/panel-chat.mjs` | 260 | #586：`:24` 引文改指；Δ≈±0 | eng-coder |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 311 | #586：`:9` 引文改指；Δ≈±0（**>300 一行级注释触碰**；拆分登记 ∕ 计划无在册命中 ⇒ 登记待补——供父侧裁 ∕ 下轮） | eng-coder |
| `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 250 | #586：`:10` 引文改指；Δ≈±0 | eng-coder |
| `thincoder-vscode/src/extension/session-index-command.mjs` | 43 | #586：`:7` 引文改指；Δ≈±0 | eng-coder |
| `docs/batches/2026-09-29-residuals-round2-vsc.test.mjs`（新 · 批件） | — | 腿 L3；≈80–120 | 实施者 |
| `docs/vsc/design/WEBVIEW.md` | 728 | #587：§2 行面板区一句 + 变更记录一行；Δ≈+2 | eng-designer |
| `docs/vsc/design/VSC-DEBT.md` | 763 | #586：3 处引文改指；Δ≈±0 | eng-designer |

波 3（桌面面）：

| 文件 | 现读 | 变更 | 实施者 |
|---|---|---|---|
| `thincoder-desktop/src/main/file-links.mjs` | 34 | #578③：`:5` 括注收正；Δ≈±0~−1 | eng-coder |
| `docs/batches/2026-09-29-residuals-round2-desktop.test.mjs`（新 · 批件） | — | 腿 L5；≈30–50 | 实施者 |
| `docs/desktop/design/SHELL.md` | 215 | #586：`:100` 引文改指；Δ≈±0 | eng-designer |

**7. 测试面（批次件 · 全清令现行制）**

- 三件：`…round2.test.mjs`（波 1：腿 L1 ∕ L2-A ∕ L2-B ∕ L4）· `…round2-vsc.test.mjs`（波 2：腿 L3）· `…round2-desktop.test.mjs`（波 3：腿 L5）。
- 复跑 = 从仓根：`node --test docs/batches/<件名>`；不进仓套件（`thincoder-vscode/test` ∕ `thincoder-core/test` 清单零动——批件住 `docs/batches/`，不在 runner 扫描域）。
- 落位 = #545 立即形（子代理写门相抵在册）：实施者写 `.thincoder/tmp/` → 父侧 copy 终位。
- 腿清单：L1（#585 输出回归 + 源码切片）· L2-A（W8 闭包扫描：现树绿 ∕ 破链夹具红 ∕ 动态反证）· L2-B（`panel-chat.mjs` 入口守卫同址）· L3（#587 假 DOM：默认合 ∕ 两态 ∕ 保态 ∕ 缺席 + 结构切片）· L4（#590：双档 ≤300 ∕ 导出面 ∕ 缝跨档 ∕ `isProcessAlive` 调用级烟测 ∕ `probeOwnersSync` ∕ `probeOwnersAsync` 调用级烟测（缝注入 `_setProcessProbeTestImpl({aliveFn})` ⇒ 束返回不抛））· L5（#578：四包码面残句 = 0）。

**8. 评审范围清单（文件 + 节）**

1. **评审对象**：本档 §2（本三块 append）。§1 = 空模板（如父侧已补，以其为补充依据）。
2. **设计输入（抽核点 · file:line 全在册）**：`thincoder-core/ledger.mjs:184-189` · `session-slots.mjs:71-80` · `ledger-db.mjs:23` · `ledger-surface.mjs:15` · `process-probe.mjs`（全档）· `CORE-UNIFICATION.md:1125`（行 10）· `thincoder-vscode/extension.mjs` · `webview/panels.js:30-35` · `webview/status-bar.js:28 ∕ :98` · `webview/index.html:37` · `webview/state.js` · `thincoder-desktop/renderer/views/goal.mjs` · `mount-cards.mjs:104-115` · `renderer/views/statusline.mjs:37-39`（goal 开合接线）· `docs/batches/2026-09-29-desktop-residuals-sweep.md:25`（#554② 裁定）· `docs/batches/2026-09-29-desktop-micros.md:288–:291`（#578 落定）· `:346`（核销）· `mount-sessions.mjs:375-395` · `i18n-views.mjs:83 ∕ :225` · `src/main/file-links.mjs:5`（desk）· `VSC-DEBT.md:353-354`。
3. **判据可跑性面**：批件三件腿设计（L1–L5）；读数型机检 = `node --check` ∕ `wc -l` ∕ grep（UTF-8 感知形）。
4. **评审外**：产品码 ∕ 设计档零 diff（本轮）；需求档 ∕ 提示词零触；#589 ∕ #593 · #590②–⑤ · #528 ∕ #530 族不属本批。

**9. 边界（不做）**

- 产品码实施 ∕ 评审点火 ∕ 其它批射程 ∕ 新语义发明（派单禁则）。
- 桌面对齐面的反转（两端皆默认显）不取——在册裁定 = 保持合（残余族清账 §1.x）；如父侧改判 ⇒ 桌面 `goal.mjs:22` 一行翻转 + 本 #587 落点反转，两条同需重裁。
- #586 余族用例重立（见上抛 4）；#589 ∕ #593（上抛 6）。

**10. 写后核（D6）**

- read-back：本 §2 三块（append ×3）+ 状态行均已落盘并回读核（表头 ∕ 表体 ∕ 尾段齐）。

**设计轮上抛处置（父侧裁定 · 2026-09-29 · eng-designer）**

> 依据 = 派单「设计轮上抛处置（父侧裁定）」（三项）+ 台账 #589 ∕ #593 逐行实读 + 届盘逐坐标实读（2026-09-29 12:1x–12:5x；file:line 均为现盘）。处置：① #589 ∕ #593 裁入——设计行见本块 1；② 拆分登记——核查 + 已补，见 4；③ KD-39 复核——不真 + 已收正，见 5。前块上抛 6 ∕ 7 ∕ 8 随本块处置；#590②–⑤ ∕ #586 五族用例登记 ∕ 批件形 = 照已落零动。评审对象随动 = 本档 §2 全量（前块 + 本块）。

**1. 新增两条设计行（现状 ∕ 修法 ∕ 判据 ∕ 改动面 ∕ 波 ∕ 验收）**

**#589 · B5 残引收正族（desk 引注改指核件 + 文档坐标五处）**

- 现状（逐坐标实读）：① desk 码三处——`thincoder-desktop/src/main/index-status.mjs:16 ∕ :24` 引 `agent-assemble.mjs:67-71`（该档现 32 行——坐标不存在）；`thincoder-desktop/src/main/settings.mjs:177` 引 `agent-assemble.mjs:68`（同因）。② 活档五处——`docs/core/design/MEMORY.md:413`（引 `make-agent.mjs:51`）· `docs/core/design/CONTEXT-COMPACTION.md:594`（引 `make-agent.mjs:112-118` + VSC `setup.mjs:322-324`——该档现 298 行，坐标不存在）· `docs/cli/design/ACP-CLIENT.md:278`（引 `make-agent.mjs:15` + `:113`）· `docs/core/requirements/SETTINGS-TOOL.md:25`（引 `make-agent.mjs:150`）· `docs/core/design/SETTINGS-TOOL.md:138`（「make-agent.mjs（baseTools）」——baseTools 组装已随 B5 归核）。**同列续读所得**（F-ST4 读取器族）：`config.mjs:277` ∕ `subagent-spawn.mjs:92` ∕ `bash.mjs:131` 三坐标届盘不命中（现值 `:257` ∕ `:82` ∕ `:120`）。③ `.thincoder/tmp/r10-desktop-selfcheck.mjs:25`——届盘零命中（tmp 件已退场）。
- 修法（改指核现体；他因漂移三坐标同笔收正）：① `index-status.mjs:16 ∕ :24` ⇒ 核 `thincoder-core/agent/assemble.mjs:74-79`（`createMemory` + embedder 附装——`:76` = `embedding.apiKey` 判据）；`settings.mjs:177` ⇒ `assemble.mjs:76`。② `MEMORY.md:413` ⇒ 核 `assemble.mjs:84`（`memory.codeOrigin = cwd`）+ CLI 值源 `make-agent.mjs:32`；`CONTEXT-COMPACTION.md:594` ⇒ 核 `assemble.mjs:106`（`createAgent` 携 `cwd`）+ CLI `make-agent.mjs:32`；VSC ⇒ `setup.mjs:243`（`hydrateRun` 每轮 `agent.cwd = cwd`）；`ACP-CLIENT.md:278` ⇒ `make-agent.mjs:21`（导出）+ 施用点 = 核 `toolsFinalize` 缝（挂点 `:39` ∕ 施用 `:101`）；`SETTINGS-TOOL.md`（设计）`:138` 句改「核 `agent/assemble.mjs` 装配 + `make-agent.mjs` 留面（MCP ∕ 剔除经 `toolsFinalize` 缝）」；`:139` 三坐标 ⇒ `config.mjs:257` ∕ `subagent-spawn.mjs:82` ∕ `bash.mjs:120`（`assemble.mjs:31` 维持）；`SETTINGS-TOOL.md`（需求）`:25` = **复核零动作（no-op）**——修正轮现盘实读已载五坐标（`config.mjs:257` ∕ `assemble.mjs:31` ∕ `subagent-spawn.mjs:82` ∕ `bash.mjs:120` ∕ `model-ref.mjs:25-36`；`make-agent.mjs:150` 零命中）——读数入 §5。③ 零动作（件已退场；如他日复用——读项按 adapter 现形重写）。
- 判据：引注可解析——新锚逐处实读命中（读数入 §5）；码面三档 `node --check` 绿（实施以届盘实读为准）。
- 改动面：`thincoder-desktop/src/main/index-status.mjs`（68；±0）· `thincoder-desktop/src/main/settings.mjs`（324；±0）· `docs/core/design/MEMORY.md`（606；±0）· `docs/core/design/CONTEXT-COMPACTION.md`（794；±0）· `docs/cli/design/ACP-CLIENT.md`（647；±0）· `docs/core/design/SETTINGS-TOOL.md`（171；±0）· `docs/core/requirements/SETTINGS-TOOL.md`（91；#589 复核 = no-op 零动作——现盘已载收正坐标；读数入 §5，不入改动面）。
- 波：desk 码三处 = 波 3（桌面码面）；档面四处 = 波 1（核 ∕ CLI 档面——无 CLI 波，随核面顺笔）；需求档 = 复核 no-op（零波 ∕ 零动作）。
- 验收：逐处实读命中读数入 §5 + `node scripts/doc-check.mjs`（本批写域零新增红——引注字面机判；无新腿；先例 = #578③ 复核实读行）。

**#593 · write-gate 头注引已删档改指（一行级 ×2）**

- 现状：`thincoder-core/agent/write-gate.mjs:20 ∕ :24` 头注两处引 VSC `agent/tool-gates.mjs`（B1 退役五档族之一）；届盘 VSC 活树（`src/**`）`preGateBlocked ∕ batchRecordWriteConflict ∕ freezeWindowConflict` 零命中（`docs/_archive` 存档不计；本设计轮 grep）；实际取用 = 核 `agent/dispatch.mjs:15`（import）· `:129`（`batchRecordWriteConflict`）∕ `:135`（`freezeWindowConflict`）（Phase 1 两判据）。台账记 `:24` 一处——届盘实读两处（`:20` 同族）。
- 修法：`:20` 删「 ∕ VSC `tool-gates.mjs`」（留「`dispatch.mjs` 只 import 消费」）；`:24` 改「两端取用 = 核 `agent/dispatch.mjs` Phase 1（两端同径）」。
- 判据：档内 `tool-gates` 零命中（源码切片）+ `dispatch.mjs` 三坐标（`:15` ∕ `:129` ∕ `:135`）实读命中 + `node --check` 绿（实施以届盘实读为准）。
- 改动面：`thincoder-core/agent/write-gate.mjs`（157；±0）。
- 波：波 1（核面）。
- 验收：读数入 §5（切片 + 三坐标实读）。

**2. 波面追加（并入既有三波——面不复）**

| 波 | 追加条目 | 实施者 |
|---|---|---|
| 波 1 · 核面 | #593（码）+ #589 档面四处（核 ∕ CLI 档） | eng-coder（码）+ eng-designer（档） |
| 波 3 · 桌面面 | #589 desk 码三处 | eng-coder |

**3. 文件面追加（受影响文件表——前表之外；现读 = 读具总行数 as-of 2026-09-29，与前表个别 ±1 差 = 文末行计法；总注同 §6——现读 = as-of，实施轮届盘重读）**

波 1（核面）：

| 文件 | 现读 | 变更 | 实施者 |
|---|---|---|---|
| `thincoder-core/agent/write-gate.mjs` | 157 | #593：`:20 ∕ :24` 去 VSC 旧档引用；±0 | eng-coder |
| `docs/core/design/MEMORY.md` | 606 | #589：`:413` 引注收正；±0（同档已因 #586 入波 1） | eng-designer |
| `docs/core/design/CONTEXT-COMPACTION.md` | 794 | #589：`:594` 两引注收正；±0 | eng-designer |
| `docs/cli/design/ACP-CLIENT.md` | 647 | #589：`:278` 两引注收正；±0 | eng-designer |
| `docs/core/design/SETTINGS-TOOL.md` | 171 | #589：`:138` 句 + `:139` 三坐标收正；±0 | eng-designer |
| `docs/core/requirements/SETTINGS-TOOL.md` | 91 | #589：`:25` 复核 = 现盘已载五坐标 ⇒ **no-op 零动作**（读数入 §5） | — |

波 3（桌面面）：

| 文件 | 现读 | 变更 | 实施者 |
|---|---|---|---|
| `thincoder-desktop/src/main/index-status.mjs` | 68 | #589：`:16 ∕ :24` 引注收正；±0 | eng-coder |
| `thincoder-desktop/src/main/settings.mjs` | 324（现越 300 顾问线——登记 = `docs/desktop/design/PROJECT.md` §4.1 越层段；本批 ±0） | #589：`:177` 引注收正；±0 | eng-coder |

**4. 拆分登记（② · panel-turn-loop.mjs）**

- 核查：`docs/vsc/design/VSC-DEBT.md` §12.1 `:332` = >300 首登（含「无拆分义务 ∕ 触发」句）——**拆分登记在册命中核查 = 无命中**（首登句 ≠ 拆分登记：无拆分预案 ∕ 候选线；VSC 全 docs 同查零）。
- 处置（**本轮已落**）：`docs/vsc/design/VSC-DEBT.md:337` 新增**越线拆分登记**一行（届盘实读 311 行 = `find /c /v ""` 口径；同 desk ∕ CLI 在册式样 = 触发式（未预拆）+ 候选线〔循环外适配 ∕ 绑定族——`:35-143` ≈109 行出档〔新档名实施批定〕〕+ 消解窗口〔该档下次结构性触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）〕）+ 档尾变更记录一行（`:761`）。
- 随动：`docs/vsc/design/VSC-DEBT.md` 758 ⇒ 763（登记 +2 ∕ 变更记录 +2）；前块 #586 列示之 `:351 ∕ :557 ∕ :690` 三处引文随 +2 ⇒ **`:353 ∕ :559 ∕ :692`**（#586 实施以届盘实读为准）。

**5. KD-39 指针复核（③）**

- 复核结论 = **不真**（前块上抛 8 坐实）：R2 处理流批上提 + parity-b4 迁移轮后语义源 = 核件 `thincoder-core/file-links.mjs`（档头自载）；VSC ∕ 桌面两端档 = 探针注入薄壳（各自 `:2-6` 自注）。
- 收正（**本轮已落**——两处同笔，漏一处 = 再悬空）：`docs/desktop/design/PROJECT.md:79`（KD-39 句：「语义同源 = `thincoder-vscode/src/extension/file-links.mjs`；两端各自实现」⇒「语义同源 = `thincoder-core/file-links.mjs`——R2 处理流批上提后核单源；两端薄壳 = 探针注入」）+ 变更记录（`:1280`）；`docs/desktop/design/UI.md:417`（相抵②句同型收正）+ 变更记录（`:697`）。两档现读（修正轮次 2 重读）：PROJECT.md **1294** · UI.md **709**。
- 登记：核实讫 ∕ 收正讫。

**6. 读后核（D6）**

- 本轮落笔面三档已读回核：`docs/vsc/design/VSC-DEBT.md`（`:335-339` 登记入位 ∕ `:761` 变更记录）· `docs/desktop/design/PROJECT.md`（`:79` ∕ `:1280`）· `docs/desktop/design/UI.md`（`:417` ∕ `:697`）；本块 append 读回核（表 ∕ 波 ∕ 文件三段齐）。

**7. 边界（不做）**

- 产品码实施（#589 ∕ #593 的码面 ∕ 波内档面 = 波内执行）· 评审点火（归父侧）· §3 面零触 · 其它批射程 · #590②–⑤ ∕ #586 五族 ∕ 批件形照已落零动。

**读后核补正（D6 · 设计轮落笔后复读 ∕ 修正轮重读 · eng-designer）**：总数按现盘重读（口径 = 读具总行数）——`docs/vsc/design/VSC-DEBT.md` **763**（登记 ∕ 变更记录后落值）· `docs/desktop/design/PROJECT.md` **1294** · `docs/desktop/design/UI.md` **709**（两档经并发批续笔——实施以届盘实读为准）。三档引文行号复读在场（VSC-DEBT `:337` ∕ `:761`；PROJECT `:79` ∕ `:1280`；UI `:417` ∕ `:697`）。

**设计评审 #198 修正轮（eng-designer · 2026-09-29）**

> 依据 = §3 轮次 1（评审 #198 · pass · 🔴0 · 🟡4 · 🔵2）发现表逐条处置（1–6 全落；落笔前逐坐标按符号名现盘重读、行数按现盘重读，读数见各条）。改动 = 本 §2 就地收正（原行可由 git 历史逐字复核）+ 本记录；产品码 ∕ 测试件 ∕ 需求档 ∕ 设计档零笔（⑤ = 只读复核）。

1. 🟡 受影响文件表按现盘重读刷新 + 全表总注落位（口径 = 读具总行数）：`panels.js` **125** · `status-bar.js` **128** · `state.js` **137** · `settings.mjs` **258** · `PROJECT.md` **1259**（变更记录 `:1248`）· `UI.md` **692**（变更记录 `:684`）· `VSC-DEBT.md` **763**；与评审值差 = 3 档（status-bar 127→**128** · PROJECT 1255→**1259** · UI 690→**692**——评审后并发批续笔；按评审建议「届盘重读为准」落表，总注已覆盖）。
2. 🟡 坐标重锚（符号名重读命中）：#589 `assemble.mjs:88→84`（`memory.codeOrigin = cwd`）∕ `:110→106`（`createAgent` 携 `cwd`）；#593 `dispatch.mjs:127→129`（`batchRecordWriteConflict`）∕ `:133→135`（`freezeWindowConflict`）；#587 `wire("goal-badge")` `:74-83→98` ∕ 抽核点 `:24→28`；#586 腿 B `VSC-DEBT.md:351-352→353-354`；「实施以届盘实读为准」扩至 #587 ∕ #589 ∕ #593 各判据。
3. 🟡 清悬口径可判定化（择 B）——扫描域写明 = 四包码 + `docs/**/*.md` 活面；**记录面排除两域** = `docs/batches/**`（批档）· `docs/core/design/MANIFEST.md` 受影响文件表批快照行（`:180`「（`engine-floor-guard` 零改）」即此面）——判据 grep 域同步（见 #586 判据行；实施后残余 = 恰记录面两域）。
4. 🟡 #590 拆分清单补漏：**主档自留** `import { execFileSync } from "node:child_process"`（`isProcessAlive` win32 分支直调——不设转口；`execFile` 仅执行面用）；判据增 f) + 腿 L4 增 `isProcessAlive` 调用级烟测。
5. 🔵 #589 现状② = **no-op（零动作）**：`docs/core/requirements/SETTINGS-TOOL.md:25` 现盘实读已载 `config.mjs:257` ∕ `assemble.mjs:31` ∕ `subagent-spawn.mjs:82` ∕ `bash.mjs:120` ∕ `model-ref.mjs:25-36`（`make-agent.mjs:150` 零命中）⇒ 零改（报告项关闭；该档零触）。
6. 🔵 #589 验收机判腿：波 1 ∕ 波 3 验收 + #589 验收行已补 `node scripts/doc-check.mjs`（本批写域零新增红）。

**修正轮读回核（D6）**：① 总注 ∕ 7 值 ∕ 清悬域 ∕ #590 两处 ∕ no-op 三处 ∕ doc-check 三处均已落位并读回（残留扫描：§2 零旧值残留）；② 坐标三组逐处读回：#589 `assemble.mjs:84` ∕ `:106` · #593 `dispatch.mjs:129` ∕ `:135` · #587/#586 `status-bar.js:98` ∕ `:28` + `VSC-DEBT.md:353-354`——均命中；③ ⑤ 复核读数：需求档 `:25` 五坐标在场 ∕ `make-agent.mjs:150` 零命中。

**边界**：产品码 ∕ 测试件 ∕ 需求档 ∕ 设计档零笔（⑤ 只读）；§1 ∕ §3–§6 ∕ 其它批射程零触；零新语义（只落评审 1–6）。

**设计评审轮次 2 修正轮（eng-designer · 2026-09-29）**

> 依据 = §3 轮次 2 六条发现（🟡2 · 🔵4 · pass）逐条处置 + 宿主核验附注两引用实读复核。改动 = 本 §2 就地精细修正（靶句 ∕ 表值 ∕ 口径句；原行可由 git 历史逐字复核）+ 本记录；产品码 ∕ 测试件 ∕ 他档（含 §1 ∕ §3–§6）零笔。

1. 🟡 表值刷新（受影响文件表 ∕ 设计行 ∕ §8 按现盘重读；总注 as-of 口径保持）：`settings.mjs` **324**（现越 300 顾问线——登记 = `docs/desktop/design/PROJECT.md` §4.1 越层段；本批 ±0）· `SHELL.md` **215**（#586 靶句 `:97` ⇒ **`:100`**）· `CORE-UNIFICATION.md` **1991**（#590 预案行 `:1123` ⇒ **`:1125`**）· `PROJECT.md` **1294** · `UI.md` **709** · `WEBVIEW.md` **728**；±1 四档（`ledger.mjs` ∕ `MEMORY.md` ∕ `AGENT-LOOP-UPSTREAM.md` ∕ `AGENT-LOOP.md`）具名于受影响文件表总注（计法差，非内容漂移）。

2. 🟡 #590 符号账补漏：主档取回账落笔——执行四名 = **主档 import + re-export**（`export { … } from` 形不绑定本地名）；`uniqPids` = **exec 导出 ∕ 主档 import**（二择一并附选定与不取理由）；判据增 **g)** + 腿 L4 同增（`probeOwnersSync` ∕ `probeOwnersAsync` 调用级烟测）；#590 验收行随动（b–e ⇒ **b–g**）。

3. 🔵 引用坐标重锚：`renderer/i18n-views.mjs:80 ∕ :203` ⇒ **`:83 ∕ :225`**（现状 ∕ §8 两处）；§8 抽核点 `renderer/views/statusline.mjs:30-32` ⇒ **`:37-39`**（goal 开合接线）；「§1.y」⇒ **§1.x**（×3——实读 `docs/batches/2026-09-29-desktop-residuals-sweep.md:22 ∕ :25`）；修正轮读回核 ∕ 补正值 `:1248 ∕ :684` ⇒ **`:1280 ∕ :697`**（×3 处）+ 两档现读随新值（**1294 ∕ 709**）；宿主附注项 `desktop-micros.md:288` 实读复核 = #578① 行（可读 ∕ 与 §2② claim 一致）⇒ micros 引用按全名 + 行锚收正（`:288–:291` ∕ `:234` ∕ `:322` ∕ `:346`）。

4. 🔵 #590 判据口径：c) 逐名列 **14 名**（去两测试缝 = 12 名口径并载）；e) 核 **7 档列名** + VSC `session-io.mjs`；「核五消费档」⇒「核七消费档」（修法行同笔）。

5. 🔵 口径指针：§2 首块口径行补「（随 §2『设计轮上抛处置』块修订——该块已落档面笔）」。

6. 🔵 #593 措辞：「VSC 全树」⇒「**VSC 活树（`src/**`）零命中（`docs/_archive` 存档不计）**」——与 #578 扫域同排除口径。

**修正轮读回核（D6）**：① 表值 ∕ 靶句落位并回读——`settings.mjs` 324（`:204 ∕ :242`）· `SHELL.md` 215 ∕ `:100`（`:61 ∕ :167`）· `CORE-UNIFICATION.md` 1991 ∕ `:1125`（`:79 ∕ :82 ∕ :137 ∕ :179`）· `WEBVIEW.md` 728（`:74 ∕ :158`）· `PROJECT.md` 1294 ∕ `UI.md` 709（`:253 ∕ :264`）· ±1 总注（`:124`）；② #590 四处回读（取回账 `:80` · 判据 c ∕ e ∕ g `:81` · L4 `:174` · 验收 b–g `:83`）；③ 坐标组回读（`:83 ∕ :225` `:87 ∕ :179` · `:37-39` `:179` · `§1.x` `:71 ∕ :98 ∕ :186` · `:1280 ∕ :697` `:253 ∕ :258 ∕ :264`）；④ #593 措辞（`:210`）· 口径指针（`:27`）回读；⑤ 宿主附注项实读：`docs/batches/2026-09-29-desktop-micros.md:288` = `#578①` 行（消解余句 = 核件持有）· `:234`（复核句）· `:322`（J-3 读数）· `:346`（`#578` 已核销）——均在场。残留扫描 = §2 活动面零旧值（存原文两处 = 轮 1 记录块 `:270`（该轮落表读数：`258 ∕ 1259 ∕ 692 ∕ :1248 ∕ :684`）∥ §3 冻结面——记录面照冻不追改）。

**边界**：产品码 ∕ 测试件 ∕ 他档零笔；§1 ∕ §3–§6 零触；零新语义（只落评审 1–6 + 宿主附注）。

**文档面实施落地记录（residuals-round2 · 2026-09-29 · eng-designer）**

> 依据 = 派单（文档面实施舱：§2 受影响文件表档面行逐处落）+ 届盘逐坐标重读。范围 = 所列 15 档；他档零触。口径 = 引文改指 + 语义句收正，**零新语义**；各档变更记录一行同笔。段归属注：§5 = eng-coder 段——本席 §5 append 已试、被机制拒（回执：「§5 is not yours to write — this caller writes §2 only」）⇒ 实施记录落本段 §2；如父侧欲收位至 §5，归父侧在案。

**1. #585 · `docs/core/design/LEDGER.md`**：§2.1 `:59` ∕ `:62` 句收正——盘符步 = `normalizeCwd` 直调、分隔符折叠自持；级联面 `notifyKey` 句「路径归一保持自身单源」⇒「盘符步 = `normalizeCwd` 直调、分隔符折叠自持」。（码面届盘实读：`ledger.mjs` `normalizeCwd` import 在场、内联 `^([a-z]):` 零命中。）

**2. #590① · `docs/core/design/CORE-UNIFICATION.md`**：§2.8.1 子表行 10 兑现收正——`process-probe.mjs` **315 ⇒ 163** + 产物 `process-probe-exec.mjs` **187**（`wc -l` 实读 2026-09-29；主档 import + re-export 执行四名与缝名、`isProcessAlive` 自持 `execFileSync` 直调——实读在案）。

**3. #586 · 引文改指 13 处（六档）**：载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`（单测树重建时回迁端侧单测档）。`AGENT-LOOP-UPSTREAM.md` `:589 ∕ :755 ∕ :790` · `AGENT-LOOP.md` `:436 ∕ :438` · `MEMORY.md` `:284 ∕ :589` · `TURN-CAP-CONTINUE.md` `:105 ∕ :108`（两处 = 登记形——原载档随 2026-09-28 全清令退役、单测树重建时恢复）· `VSC-DEBT.md` `:353 ∕ :559 ∕ :692`（`:353 ∕ :559` = 腿 B 形）· `SHELL.md` `:100`。

**4. #587 · `docs/vsc/design/WEBVIEW.md`**：§2 行面板区补句——goal = 默认合 + 🎯 开合（开合态 `S._goalPanelOpen`；与桌面端默认合对齐）。

**5. #589 · 档面收正**：`MEMORY.md` `:413`（赋值点 ⇒ 核 `assemble.mjs:84` + CLI 值源 `make-agent.mjs:32`）· `CONTEXT-COMPACTION.md` `:595`（建链面 ⇒ 核 `assemble.mjs:106` + CLI `make-agent.mjs:32`；VSC `setup.mjs:244`）· `ACP-CLIENT.md` `:278 ∕ :279`（导出 `:21` + 施用 = 核 `toolsFinalize` 缝〔挂点 `:39` ∕ 施用 `:101`〕）· `SETTINGS-TOOL.md`（设计）`:138 ∕ :139`（装配句 + 三坐标 ⇒ `config.mjs:257` ∕ `subagent-spawn.mjs:82` ∕ `bash.mjs:120`）。复核 no-op：`PROJECT.md` `:79` ∕ `UI.md` `:417`（KD-39 收正已落）、`SETTINGS-TOOL.md`（需求）`:25`（五坐标已载）。

**6. 机检读数**：`node scripts/doc-check.mjs`（仓根）——本批写域 **零新增 ✗ / 零新增 >300 行**（对基线 log 逐行 diff：增 0 ∕ 删 0 ∕ 计数零变）；清悬 grep：四包码 `engine-floor-guard` **0 命中**；`docs/**/*.md` 残余 = 恰记录面两域（`docs/batches/**` + `MANIFEST.md:180` 快照行）。

**7. 披露**：① 批件三件现住 `.thincoder/tmp/`（`…round2.test.mjs` ∕ `-vsc` ∕ `-desktop`）——终位待父侧 copy；引注为记名形（机检对 `.test.mjs` 引注不判悬空——多扩展段跳过）。② 并发写：`LEDGER.md` 变更记录含他批（batch-mechanics）条目；`PROJECT.md:712` 新增拟新增行（非本席笔）。③ 坐标微差：`setup.mjs` 届盘实读 `:244`（设计记 `:243`——已按届盘落）。

**8. 读后核（D6）**：逐处 read-back 在案（各 edit 回读上下文）；三处变更记录行宽一度 >300，拆行后复扫归零。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 本档 §2 全量（前块 + 上抛处置块）。抽核面 = 设计 §8 自列的抽核点清单逐点实读（file:line 均按现盘，读具计数）。口径限制：本评审上下文未提供文档地图与项目标准档（Document ownership 按 Project Guide + 设计自述口径降级判定）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations（criterion 8） | 🟡 | 受影响文件表现读值与现盘不符：`webview/panels.js` 122→125 · `webview/status-bar.js` 112→127 · `webview/state.js` 133→137 · `desktop/src/main/settings.mjs` 223→258 · `docs/desktop/design/PROJECT.md` 1177→1255 · `docs/desktop/design/UI.md` 666→690 · `docs/vsc/design/VSC-DEBT.md` 761→763。抽核通过面：`ledger.mjs` 216 ∕ `process-probe.mjs` 322 ∕ `write-gate.mjs` 157 ∕ `index-status.mjs` 68 ∕ `child-marks.mjs` 24 ∕ `embed-config.mjs` 182 ∕ `ledger-surface.mjs` 139 ∕ `family-tools.mjs` 187。三件 webview 档 mtime = 2026-09-29 04:35（设计轮后被并发批动过）⇒ 属并发漂移而非必为笔误，但实施将以这些数为输入。 | 落笔前逐档按现盘重读刷新表（Δ 依重读值重算）；全表补一句「现读 = as-of，实施轮届盘重读」（现仅 #586 带此注）。 |
| 2 | Clarity（坐标） | 🟡 | 正文/判据坐标与现盘不符：**#589 新锚** `thincoder-core/agent/assemble.mjs:88`（`memory.codeOrigin = cwd`）→ 现盘 `:84`、`assemble.mjs:110`（`createAgent` 携 `cwd`）→ 现盘 `:106`（#589 其余新锚抽核命中 ✓：`:74-79 ∕ :76` · `make-agent.mjs:21 ∕ :32 ∕ :39` · `config.mjs:257` · `subagent-spawn.mjs:82` · `bash.mjs:120` · VSC `setup.mjs:243-244`）；#593 判据「`dispatch.mjs` 三坐标」`:127 ∕ :133` → 现盘两判据调用 = `:129`（`batchRecordWriteConflict`）∕ `:135`（`freezeWindowConflict`）（`:15` ✓）；#587 修法③ `wire("goal-badge")`（`:74-83`）→ 现盘 `:98`、§8 抽核点 `status-bar.js:24` → 现盘徽标判据 `:28`；#586 腿 B「`VSC-DEBT.md:351-352`」→ 现盘 `:353-354`（同块其余三处已随动 `:353 ∕ :559 ∕ :692`）。 | 落笔前以符号名重读重锚（`dispatch.mjs` Phase 1 两调用行 ∕ `assemble.mjs` 两赋值行）；把「实施以届盘实读为准」从 #586 扩到 #587 ∕ #589 ∕ #593 各判据。 |
| 3 | Requirements coverage | 🟡 | #586 清悬口径 =「全量改指（码 9 处 + 档 6 档 13 处）」，实测 live doc `docs/core/design/MANIFEST.md:180`（「（`engine-floor-guard` 零改）」）含该字面，既未入清单也未被排除（排除项 = 记录面批档）⇒ 执行后该处仍悬空，KD-2「漏一处 = 再悬空」不成立。实测 = 码 9 处 ✓ ∕ 档 14 处（清单 13 + MANIFEST 1）。 | 该处并入清悬清单，或把排除口径改成可判定的扫描域定义并写明该表属记录面——二者择一并同步判据 grep 域。 |
| 4 | Feasibility（拆分清单） | 🟡 | #590 迁移清单把「`execFile` ∕ `execFileSync` import」整体迁出，而留主档的 `isProcessAlive`（`process-probe.mjs:294`）直接调 `execFileSync`；清单只交代留档取 exec 的 `parseTasklistPids`，未交代 `execFileSync` ⇒ 按字面执行主档缺符号（win32 分支运行时 ReferenceError），判据 b–e（`node --check` ∕ 可加载 ∕ 名面在场 ∕ 缝 ∕ 消费面加载）不触该调用路径。 | 清单写明「主档自留 `import { execFileSync } from "node:child_process"`」（或 exec 转口供主档取用）；腿 L4 增 `isProcessAlive` 调用级烟测。 |
| 5 | Clarity（#589 现状） | 🔵 | #589 现状② `docs/core/requirements/SETTINGS-TOOL.md:25`（记「引 `make-agent.mjs:150`」）与现盘不符——现 `:25` 已载 `config.mjs:257 ∕ assemble.mjs:31 ∕ subagent-spawn.mjs:82 ∕ bash.mjs:120 ∕ model-ref.mjs:25-36`，`make-agent.mjs:150` 该档零命中 ⇒ 该项（报告项）当前为 no-op 风险（按描述直改会改到已正确的档）。 | 落笔前按现盘复核该行；若已正确 ⇒ 收作 no-op（零动作）+ §5 记读数关闭。 |
| 6 | Acceptance（#589） | 🔵 | #589 验收 = 纯人工读数（「逐处实读命中读数入 §5——无新腿」）；仓内 `scripts/doc-check.mjs` 已对「路径 ∕ 坐标」类引注机械报红（实证 = `.thincoder/tmp/doc-check-guard-scheduler.log:3429 ∕ :4126` 对 `SETTINGS-TOOL.md:139` ∕ 需求档 `:25` 报「路径/坐标」）。 | 波 1 ∕ 波 3 验收各补 `node scripts/doc-check.mjs`（本批写域零新增红），读数字面升机判。 |

计数：🔴 0 · 🟡 4 · 🔵 2

VERDICT: pass

### 轮次 2（评审子代理）

评审对象 = 本档 §2 全量（首块 + 设计轮上抛处置块 + 修正轮块）；抽核面 = §2 自列抽核点 + 改动靶 + 受影响文件表现读值逐处实读（file:line 均按现盘，仓根 = `D:\teamcode\thincoder`）。口径限制：本评审上下文未提供文档地图与项目标准档（Document ownership 按 Project Guide + 设计自述口径降级判定）。抽核通过面（无发现）：#585 语义（`normalizeCwd` 直调后输出逐字节不变——`session-slots.mjs:73-75` 仅盘符大写；`ledger-db.mjs:23` 先例在盘；`session-slots.mjs` 静态图不含 ledger（`ledger.mjs → ledger-db → session-slots` 既有可达 ⇒ 零新增可达性））· #586 码面 9 处引文（逐处行号精确命中）· 档面 13 处（AGENT-LOOP-UPSTREAM `:587 ∕ :753 ∕ :788` · AGENT-LOOP `:427 ∕ :429` · MEMORY `:284 ∕ :589` · TURN-CAP-CONTINUE `:104 ∕ :107` · VSC-DEBT `:353 ∕ :559 ∕ :692`）· 腿 B 案源在盘（`panel-chat.mjs:133` `ensurePanelAgent` ⇒ `:135` `ensureMemoryHandle`）· 腿 A 算法先例在盘（`.thincoder/tmp/p4ii-w8-scan.mjs` 六面逐条吻合）· #587 五点与两端现形（`panels.js:30-35` · `status-bar.js:98` · `index.html:37` · `state.js:82` · desk `goal.mjs:13-36 ∕ :47-56` · `mount-cards.mjs:105 ∕ :114`）· #590 迁移切点逐区间核（`:26-27 ∕ :48-61 ∕ :63-66 ∕ :68-104 ∕ :106-113 ∕ :115-143 ∕ :145-165 ∕ :167-194 ∕ :196-214`；留档区间 ∕ `execFileSync`（`:294`）自留 · 缝唯一读取点 = 执行四函数 · 预案行 `CORE-UNIFICATION.md` 行 10）· #593 两处头注 ∕ `dispatch.mjs:15 ∕ :129 ∕ :135` 全命中 · #589 新锚逐处命中（`assemble.mjs:74-79 ∕ :76 ∕ :84 ∕ :106` · `make-agent.mjs:21 ∕ :32 ∕ :39 ∕ :101` · `config.mjs:257` · `subagent-spawn.mjs:82` · `bash.mjs:120` · 需求档 `SETTINGS-TOOL.md:25` 五坐标 ⇒ no-op 成立）· #578② `notify.mjs:9` 零失效令 · VSC-DEBT `:337 ∕ :761` · PROJECT `:79` · UI `:417` 落笔在盘 · `scripts/doc-check.mjs` 在盘 · `thincoder-vscode/test/files.mjs` 重建规则行在盘。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations（criterion 8） | 🟡 | 受影响文件表现读值抽核与现盘不符（并发批续笔所致，非必为笔误，但实施以这些数为输入）：`desktop/src/main/settings.mjs` 表记 258、现盘 324（`PROJECT.md:181 ∕ :295` 已按「W6 届盘复读——parity-b10 W2 ∕ W3 +67」登记 324）且**已越 300 顾问线**——该行未带越层状态 ∕ 拆分预案指针（越层登记住 `docs/desktop/design/PROJECT.md` §4.1 越层段；本批改动 = 注释一行级 ±0）；`docs/desktop/design/SHELL.md` 210→现 **215**（#586 目标句 `:97`→现 **:100**）· `PROJECT.md` 1259→现 **1294** · `UI.md` 692→现 **709** · `docs/vsc/design/WEBVIEW.md` 711→现 **728** · `CORE-UNIFICATION.md` 1986→现 **1991**（#590 预案「行 10」`:1123`→现 **:1125**）；另 `ledger.mjs` 216/现 217 · `MEMORY.md` 前表 605/附录表 606（现 606）· `AGENT-LOOP-UPSTREAM.md` 1015/现 1016 · `AGENT-LOOP.md` 599/现 600 属已披露的 ±1 计法差。 | 波开工前按现盘重读全表（设计已带 as-of 总注）；`settings.mjs` 行补「现越 300 顾问线（登记在 `docs/desktop/design/PROJECT.md` §4.1 越层段）+ 本批 ±0」；#586 ∕ #590 靶句按现盘坐标重锚。 |
| 2 | Feasibility（#590 拆分清单） | 🟡 | 主档↔exec 符号账不完整：`uniqPids`（`:63-66` 迁出）仍被留主档的 `probeOwnersSync`（`process-probe.mjs:260`）∕ `probeOwnersAsync`（`:274`）调用，清单未交代主档取回路径（exec 未声明导出该名）；四个执行名同理——主档自身在 `:262 ∕ :266 ∕ :276 ∕ :280` 直调 `batchAlive` ∕ `probeCmdlines` ∕ `batchAliveAsync` ∕ `probeCmdlinesAsync`，而 `export { … } from` 形不绑定本地名（主档需 import）。按字面实施 ⇒ 该两函数运行时 `ReferenceError`；判据 b–f 不触该路径（e = 仅加载；`thincoder-core/test/` 2026-09-28 全清后零用例 ⇒ 无仓套件兜底）。同类先例 = 评审 #198 发现 4（`execFileSync`）已按同法补漏。 | 清单写明主档侧 import：`uniqPids`（exec 导出或主档自留粒）+ 四个执行名（import + re-export 保名面）；L4 增 `probeOwnersSync` ∕ `probeOwnersAsync` 调用级烟测（沿 `isProcessAlive` 烟测先例：`_setProcessProbeTestImpl({aliveFn})` ⇒ `probeOwnersSync([1])` 返回束）。 |
| 3 | Clarity（坐标） | 🔵 | 证据级坐标与现盘不符（零改复核项 ∕ 引用项，非改动靶）：`renderer/i18n-views.mjs:80 ∕ :203`（#578① 两语键）→ 现 `:83 ∕ :225`；§8 抽核点 `renderer/views/statusline.mjs:30-32`（#587 桌面对位）→ 现 goal 开合接线在 `:37-39`；#587 裁定引 `docs/batches/2026-09-29-desktop-residuals-sweep.md` 「§1.y」→ 该裁定实住 **§1.x**（`:25`）；修正轮读回核列 `PROJECT.md:1248` ∕ `UI.md:684` → 现变更记录在 `:1280` ∕ `:697`。 | 落 §5 复核时按现盘重读坐标（或改节锚），不逐处追改。 |
| 4 | Acceptance（#590 判据口径） | 🔵 | 判据 c)「主档公开名逐名在场（**11 名**）」与实际导出面不符——`process-probe.mjs` 现导出 **14** 名（去两测试缝为 **12**）；判据 e) 谓「核**五**消费档」——核静态引 `process-probe.mjs` 的档实为 **7**（`ledger-executors` ∕ `peer-instances` ∕ `session-gc` ∕ `session-lifecycle` ∕ `session-slot-claims` ∕ `session-slots` ∕ `session-stale`）+ VSC `session-io.mjs:32`。 | 判据 c 逐名列 14 名（或写明「去测试缝 12 名」口径）；e 按 7 + VSC 档列名（或统一改「全消费档加载」）。 |
| 5 | Methodology（§2 自述口径与后块相抵） | 🔵 | §2 首块口径行「本轮零产品码 ∕ 零设计档笔」与后块「设计轮上抛处置」的「**本轮已落**」三档笔（`VSC-DEBT.md:337 ∕ :761` · `PROJECT.md:79` · `UI.md:417`——现盘均在）相抵；单块读入者会把已落档面笔当未落笔。 | 首块口径行补一句「（随 §2『设计轮上抛处置』块修订——该块已落档面笔）」指针（勘误级，不改后块）。 |
| 6 | #593 判据措辞（清悬域） | 🔵 | 「届盘 VSC **全树** `preGateBlocked ∕ batchRecordWriteConflict ∕ freezeWindowConflict` 零命中」按字面不成立——命中在 `thincoder-vscode/docs/_archive/**`（6 档存档文档）；`src/**` 活树确为 0。 | 措辞对齐 #578 扫域写法：「VSC 活树（`src/**`）零命中（`docs/_archive` 存档不计）」——同一排除口径全批一致。 |

计数：🔴 0 · 🟡 2 · 🔵 4

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」（代点火 + 代批准授权——本批即经此授权点火评审 #198）。
- **三条件核检**：① **评审 pass**——#198（0🔴 · 4🟡 · 2🔵 · pass；§3 在册）② **修正轮落地并经父侧核验**——修正轮 #201 六条全落（§2 修正块在册）③ **凭证**——#198 凭证被会话档脱敏不可取回 ⇒ **重开取凭证**（同 B10 先例；点火 = 父侧代点火授权下达）→ 通过后签发即派实施。
- **批准射程** = 本批 §2 全量（波 1 ∕ 波 2 ∕ 波 3；受影响文件表逐行）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）

**状态行**：实施完成（波 1（核面）：终态 clean（分歧审计 1 轮 CLEAN；代码评审 2 轮：轮 1 3 🔵 全处置、轮 2 pass）；波 2（VSC）· 波 3（桌面）· #589 遗珠补落（fix 轮）记录在段——#589：分歧审计 1 轮 CLEAN、代码评审未发起（派单禁则——父侧门））

### 波 3（桌面面）实施记录（residuals-round2 · 2026-09-29 · eng-coder）

**范围** = 任务书 §2 #578 行（复核零改 + 残点一行）+ §6 波 3 文件表（批件 = 腿 L5）。产品码 diff = `thincoder-desktop/src/main/file-links.mjs` 一档（一行级）——其他文件零触。

**（1）落点与读数**

| # | 文件:行 | 改动 | Δ |
|---|---|---|---|
| #578③ | `thincoder-desktop/src/main/file-links.mjs:5` | 括注收正：删死指向「设计档收正归设计面轮」（所指设计档收正已落——`PROJECT.md:79` KD-39 ∕ `UI.md:417` = 「只述实现形态」形），留「上提核件单源」事实句（现文：「核件 `@thincoder/core/file-links.mjs`（单源——原「多实现面各自落地」句随上提失效）；本档只留端胶水：」）；先例 = `notify.mjs:9` 同形消解 | ±0（行级文本删；总行 34 不变） |
| 批件 | `.thincoder/tmp/2026-09-29-residuals-round2-desktop.test.mjs`（72 行；候选终位 = `docs/batches/2026-09-29-residuals-round2-desktop.test.mjs`——父侧 copy 收位） | 腿 L5（扫荡 + 锚）+ 防假绿守卫 | 新增 |

**（2）#578 复核实读（①/② 零改项——读数入册）**

- ①：`thincoder-desktop/renderer/mount-sessions.mjs:384` = `showToast(t("session.deleteFailed", { reason: reasonOf(receipt) })) // #578③：失败面可见（回执拒径）`；`:392` = `showToast(t("session.deleteFailed", { reason: String(error?.message ?? error) })) // #578③：调用抛同理可见`；`thincoder-desktop/renderer/i18n-views.mjs:83` = `"session.deleteFailed": "Could not delete the session (${reason})"` ∕ `:225` = `"session.deleteFailed": "会话删除失败（${reason}）"`（desktop-micros §5 在册行 = 该档 `:290 ∕ :291`）。
- ②：`thincoder-desktop/src/main/notify.mjs:9` = `原「词键持有面 = 主进程自持」句随上提改归属（核件持有）。`——残句零命中（micros §5 消解行 `:288` ∕ J-3 读数 `:322`）。
- ③ 前提坐实：`docs/desktop/design/PROJECT.md:79`（KD-39 = 「语义同源 = `thincoder-core/file-links.mjs`——R2 处理流批上提后核单源；两端薄壳 = 探针注入——只述实现形态」）∥ `docs/desktop/design/UI.md:417` 同形 ⇒ 死工作令确已失效。
- 上下文行（零动 ∕ 在册）：`UI.md:421`（端差登记——VSC 打开到行 ∕ 桌面行参不施加）· `UI.md:434`（open ∕ 上抛——行定位消解路在册）· `PROJECT.md:987`（BH 行）。

**（3）验证命令与读数（2026-09-29 17:0x–17:2x）**

- 腿 L5 复跑：`node --test .thincoder/tmp/2026-09-29-residuals-round2-desktop.test.mjs` ⇒ **2/2 pass**（扫荡腿 + 锚腿）。
- 扫荡读数（判据同域自跑）：修前 = 585 档 ∕ **1 命中**（`thincoder-desktop/src/main/file-links.mjs`）；修后 = 586 档 ∕ **0 命中**。+1 档归因 = 并发波 1 新件 `thincoder-core/process-probe-exec.mjs`（未跟踪新档，mtime 09:12Z 落两跑之间；排除粒度变更对现树文件集 = +0——四包 `.thincoder/**` 码件全在 `tmp/` 下，已逐档核实）。扫域 = 四包 `*.mjs ∕ *.js ∕ *.cjs`，排 `.thincoder/tmp` 与 `_archive`。
- `node --check thincoder-desktop/src/main/file-links.mjs` ⇒ 绿。
- `node scripts/doc-check.mjs`（两跑存 `.thincoder/tmp/wave3-doc-check-{before,after}.log`）：悬空 **163 ⇒ 163**（零变）· 行宽 **83 ⇒ 80**；两跑差集 = 并发他批 `docs/core/design/AGENT-LOOP-SUBAGENT.md`（行移 + 3 行宽减记）。**本批写域（file-links.mjs ∕ tmp 批件）两跑零出现 ⇒ 零新增红**（附：doc-check 扫描域 = `docs` · 152 档——本批写域结构性在其外）。
- **未跑仓级套件**（repo suite = 发布门——父侧收口一次跑；本链不跑）。

**（4）内审（explore 分歧审计）1 轮 ∕ 2 发现 ∕ fix round 1**

- 发现 1（🟡 · 时序）：审计时点批档 §5 空——本 §5 即补册（复核读数见（2））。
- 发现 2（🔵）：批件排除粒过宽（排整棵 `.thincoder`，判据字面 = 仅 `.thincoder/tmp`）⇒ **fix round 1 收正**：`SKIP_DIRS` 收为 `node_modules ∕ .git ∕ _archive` + 仅 `.thincoder/tmp` 段（`isExcludedDir(name, parentName)`）；同笔增防假绿守卫（`scanned >= 300`，空扫即红）。收正后复跑 2/2 绿。
- 审计限制（其自声明）：无执行面（未亲跑 git ∕ node --test）——以读核等价核证；其余各点（a–e）零发现。

**（5）评审（advisor · code）1 轮 = pass**

- 计数 0🔴 · 1🟡 · 3🔵。🟡 = §5 补册（本轮已落）；🔵 = ① 批件判据口径比设计多排 `node_modules ∕ .git`（`:21 ∕ :34`——建议 copy 时判据行注明，零逻辑改）；② 防假绿守卫粒度（建议可结构化为逐包断言——未做，留父侧裁）；③ 批件 72 行 vs 设计预估 ≈30–50（读数漂移——建议 copy 时刷表）。
- 评审独立复核（其侧实测）：①/② 读数 ∕ 残句零命中 ∕ 先例同形 ∕ 前提（设计档收正已落）——均判成立。

**（6）决策透明表（披露 ∕ 只报）**

| 类 | 项 | 处置 | 依据 |
|---|---|---|---|
| 披露 | 防假绿守卫（`scanned >= 300`）= 设计外一笔 | 随 fix round 1 落（理由 = 防空扫假绿） | 承评审 🔵②在册（未结构化——留裁） |
| 披露 | 批件落位 = `.thincoder/tmp/`（#545 立即形） | 待父侧 copy 终位 | §2 §7 落位行 |
| 只报 | `thincoder-desktop/src/main/at-complete.mjs:5` 含「多实现面各自落地」（正面陈述形 · 另机制自注） | 零触 | 非本波判据句；不在本波写域 |
| 只报 | 台账 #578 行仍「在途」 | 父侧收正 ∕ 核销 | 设计上抛 2 |
| 只报 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` 等并发他波在飞改动 | 零触 | 归各波 |

**（7）写后核（D6）**：`file-links.mjs:5` 读回核（事实句在 ∕ 死指向零）· 批件复读（两腿 + `isExcludedDir` 收正形）· 本 append 落盘后回读核。

**边界**：产品码 = file-links 一档（一行级）；他文件零触（#586 SHELL.md ∕ #589 desk 码 ∕ 波 1 ∕ 波 2 ∕ 并发各批 = 非本域）。

### 5.x 波 2（VSC 面）实施记录 · eng-coder · 2026-09-29

**波段**：#587（goal 面板默认合 + 🎯 开合——桌面 #554②对齐）+ #586（VSC 码面七处引文改指）+ 批件腿 L3。
**终态 = clean（converged）**：分歧审计 1 轮（1 偏差（L3-D 清空支锁不判别）→ 修复复跑；其余逐点吻合）；代码评审 round 1 = **pass**（🔴0 · 🟡4 · 🔵2——全非阻断；逐条处置见透明表）。fix round：① 审计项 = L3-D 改「态 true 穿越 clearPanels」强锁；② 评审 🔵#5 = 批件头注补注 1 行（逐字锁有意）。

**改动表（file:line · 行数口径 = `wc -l`（换行符数）· 现读 = 终态）**

| # | 文件 | 位置（现读） | 动作 | 内容 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/webview/state.js` | `:83-85`（136 → 139） | 改 | S 增 `_goalPanelOpen: false` 槽 + 注（默认合 ∕ 翻态写 ∕ 不重置） |
| 2 | `thincoder-vscode/webview/panels.js` | `:30-37`（124 → 126） | 改 | `renderGoalPanel()` 显隐判据 = `goalPanelVisible(S._goalInfo) && S._goalPanelOpen`（可见仍照常 `replaceChildren`——开时内容不陈旧；display 只随态） |
| 3 | `thincoder-vscode/webview/status-bar.js` | `:97-105`（127 → 134） | 改 | goal 支 = 翻态出口（`S._goalPanelOpen = !…` + 按态施用 display）；`wire("task-badge",…)` 支零动 |
| 4 | `thincoder-vscode/src/agent/setup-tooltable.mjs` | `:12-13`（103） | 改 | 引文改指（旧 `:129` 锚去） |
| 5 | `thincoder-vscode/src/embed-config.mjs` | `:11-12`（182） | 改 | 引文改指 |
| 6 | `thincoder-vscode/src/extension/ledger-surface.mjs` | `:15-16`（140） | 改 | 引文改指 |
| 7 | `thincoder-vscode/src/extension/panel-chat.mjs` | `:24`（260） | 改 | 引文改指（旧 `:152-154` 锚去） |
| 8 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | `:9`（309） | 改 | 引文改指（注释行级——>300 登记在册不计） |
| 9 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | `:10`（250） | 改 | 引文改指 |
| 10 | `thincoder-vscode/src/extension/session-index-command.mjs` | `:7`（43） | 改 | 引文改指 |
| 11 | `.thincoder/tmp/2026-09-29-residuals-round2-vsc.test.mjs` | `:1-245` | 新增（暂存） | 腿 L3 七用例（L3-A–E 行为面 ∕ L3-S 源面锁 ∕ L3-CIT 引文）；终位 = `docs/batches/2026-09-29-residuals-round2-vsc.test.mjs`（父侧 copy 已落） |

第 4–10 行统一：旧引 `engine-floor-guard.test.mjs`（含 `:129` ∕ `:152-154`）全数改指新载体 `docs/batches/2026-09-29-residuals-round2.test.mjs`，附「单测树重建时回迁端侧单测档」；**语义零变**（全在块注释内）。

**验证命令与读数（本机 · 2026-09-29；cwd = 仓根 `thincoder/`）**

| 命令 | 读数 |
|---|---|
| `node --test docs/batches/2026-09-29-residuals-round2-vsc.test.mjs` | **7/7 pass**（L3-A–E + L3-S + L3-CIT；tmp 位复跑同绿——两落位可跑） |
| `node --check`（10 码档 + 批件） | 全绿（11/11） |
| `node scripts/doc-check.mjs`（before ∕ after ∕ after2 三采） | 本波写域**零差异**（逐行差集扫描 = 零命中）；窗口内差集全属并发他波（desktop ∕ render-core 档、AGENT-LOOP-SUBAGENT.md）+ 引擎面（判据项 5→6 项 + 行数报告段——并发 doc-check-face 批） |
| `engine-floor-guard` VSC 活树扫（`*.mjs/js/cjs`，排 node_modules ∕ .thincoder ∕ docs） | 零残余（批件 L3-CIT 自持同扫） |
| 行数读数（终态 `wc -l`） | 见改动表；`panel-turn-loop.mjs` = **309**（>300 仍成立） |
| 仓套件 | 未跑——父侧收口跑 = 唯一仓套件跑点 |

**审计与评审轮次（内部）**

- 分歧审计（explore · 只读）：1 轮——偏差 1（🔵）= L3-D 清空支断言非判别（先点回合并断言 `false` ⇒ 重置型实现亦绿）→ fix：改「态 true 穿越 `clearPanels`」强锁（`:168-172`）→ 复跑 7/7 绿；其余（#587 四点 ∕ 七处引文 ∕ 无出列 ∕ task 支零动）全吻合；审计未复跑（其装配无 exec）——复跑读数由本席上表提供。
- 代码评审（advisor · round 1）：**pass**（🔴0 · 🟡4 · 🔵2——全非阻断）。逐条处置见透明表（无 must-fix；未再开 round 2）。

**交付透明表（决策与披露）**

| # | 事项 | 性质 | 处置 ∕ 去向 |
|---|---|---|---|
| 1 | 回合起点 `clearPanels`（`input.js:101`）抹 `_goalInfo` × goal 消息变更门控（`panel-turn-loop.mjs:130`）⇒ 🎯 入口回合后消失（五点判据之外 · **非本波引入** · 桌面侧无 clear 绑定） | 评审 🟡#1 · 报告项 | 零码改（本批改动面不含 `input.js` ∕ 重推点）；父侧裁：登记残余或另立小件 |
| 2 | 载体件落位：七处引文靶 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`；三件已由父侧 copy 至 `docs/batches/` | 评审 🟡#2 · 协同项 | 已消解；**终位 vsc 件较 tmp 现版差 1 行头注**（非语义面）——父侧收位可重 copy 一次（不重 copy 零行为差） |
| 3 | `panel-turn-loop.mjs` 309 > 300 顾问线 | 评审 🟡#3 · 档位 | 已登记（`VSC-DEBT.md:337` 触发式——本波注释行级不计）；不拆 |
| 4 | `S._llmCalls` 死计数（需求档 P2-2：写面 `status-bar.js:111` ∕ `input.js:99`，定义 `state.js:101`，零读）——登记「到期 = 相应档下次修改」本波**已触发**未清（零扩面边界） | 评审 🟡#4 · 报表 | 父侧裁：顺笔清 ∕ 改登记（二中取一） |
| 5 | L3-S 逐字锁 = 有意（防语义漂移换形） | 评审 🔵#5 | 头注补注 1 行（tmp 版已落；终位件待随 #2 re-copy） |
| 6 | `VSC-DEBT.md:337` 登记值 **311** vs 现盘 **309**（`\n` ∕ `find` ∕ `findstr` 三法同证；该档 `git status` 无本波外改动）；批档 Δ 预估与实落差（status-bar 实 +7；批件实 245 行 vs 估 80–120） | 评审 🔵#6 · R7c | 报告项——父侧 ∕ 设计面收位刷新（批档「as-of，届盘重读」总注已覆盖） |
| 7 | 批外残引（`panel-chat.mjs:93` `test/workspace-guard.test.mjs` ∕ `panel-turn-loop.mjs:12-13` `chat-panel-messages.test.mjs:24`——非 engine-floor-guard 族） | 域外注记 | 零改（#586 判据域 = engine-floor-guard 族；与「单测树重建时恢复」同族） |
| 8 | 真机面（VSC 面板默认隐 ∕ 🎯 两态） | 验收 ④ | **待父侧**（本席零真机面） |

### 波 1（核面）实施记录 · eng-coder · 2026-09-29

**波段**：#585（`ledger.mjs` notifyKey 单源化）+ #590①（`process-probe.mjs` 拆分 ∕ 新 `process-probe-exec.mjs`）+ #586（核面两处引文改指）+ #593（`write-gate.mjs` 头注两行——父侧核定纳入：派单漏列、非设计变更）+ 批件腿 L1 ∕ L2-A ∕ L2-B ∕ L4。
**终态 = clean（converged）**：分歧审计（explore · 只读）1 轮 = CLEAN（无分歧）；代码评审（advisor · code）轮 1 = pass（🔴0 · 🟡0 · 🔵3——全非阻断）+ 轮 2（只验修复声明）= pass（两 🔵 均 Fixed · 零新增）。

**（1）落点表（台账号 → 落点 → 读数；行数口径 = `wc -l`）**

| 台账号 | 落点（终态行数） | 改动 | 读数 |
|---|---|---|---|
| #585 | `thincoder-core/ledger.mjs:24-25`（import + 注）· `:186-192`（notifyKey）· 216 ⇒ **219**（+3） | 内联盘符归一 ⇒ `normalizeCwd(resolve(ledger).replace(/\\/g, "/"))` 直调（先例 = `ledger-db.mjs:23`；输出逐字节不变） | 档内 `^([a-z]):` 零命中；L1a 9 样本产出回归（含 win32 守卫 4 期望）∕ L1b 切片 ∕ L1c 导出面 45 名——腿全绿 |
| #590① | `thincoder-core/process-probe.mjs`（322 ⇒ **163**） | 保面：`SYNC_PROBE_MS` ∕ 三标记族 ∕ `isProductProc` ∕ `classifyEnd` ∕ `ownerState` ∕ `probeOwnersSync` ∕ `probeOwnersAsync` ∕ `isProcessAlive` ∕ `filterDeadOwners`；自留 `execFileSync` import（`:29`；win32 支 `:132` 直调） | 14 名逐名在场 + re-export 同值（L4bc 绿） |
| #590① | `thincoder-core/process-probe-exec.mjs`（**187** · 新） | 迁入：双超时常量 ∕ 注入缝（`_testImpl` + 两 setter） ∕ `uniqPids`（导出） ∕ 解析族（`parseTasklistPids` 导出） ∕ `execFileP` ∕ 四批量函数 | 逐字对照（vs `git show HEAD`）：迁出 9 区**逐字恒等**（仅 `uniqPids` ∕ `parseTasklistPids` 两处 `export` 增补）；留档 9 区逐字恒等 |
| #586 | `thincoder-core/agent/family-tools.mjs:16` ∕ `agent/child-marks.mjs:6-7` | 引文改指：「W8 契约②判据（现载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`；单测树重建时回迁端侧单测档）」 | 两处实读在盘；核面 `engine-floor-guard` 零命中 |
| #593 | `thincoder-core/agent/write-gate.mjs:20-21`（删「 ∕ VSC `tool-gates.mjs`」）· `:24`（「两端取用 = 核 `agent/dispatch.mjs` Phase 1（两端同径）」） | 头注两行改指 | 档内 `tool-gates` 零命中；`dispatch.mjs:15 ∕ :129 ∕ :135` 三坐标实读命中 |
| 批件 | `.thincoder/tmp/2026-09-29-residuals-round2.test.mjs`（**239**；终位 = `docs/batches/…`——**待父侧重 copy**，见透明表 #2） | 腿 L1（a–c） ∕ L2-A（①②③） ∕ L2-B ∕ L4（a–g） | `node --test` = **12/12 pass · 0 fail** |

**（2）验证命令与读数（cwd = 仓根；读数件住 `.thincoder/tmp/`）**

| 命令 | 读数 |
|---|---|
| `node --test .thincoder/tmp/2026-09-29-residuals-round2.test.mjs` | **12/12 pass · 0 fail · 0 skip**（887ms；`residuals-round2-legs.log`） |
| `node --check`（6 码档 + 批件） | 全绿（7/7） |
| W8 闭包扫（`.thincoder/tmp/p4ii-w8-scan.mjs` 同源算法 · 自 `thincoder-vscode/extension.mjs`） | 修前 **194 档** ⇒ 修后 **195 档**（+1 = 新 exec 档）· `sqlite` **false** · `unresolved` **[]**（`residuals-round2-w8-after.json`）；exec 单档闭包同零 |
| 环面（自 `session-slots.mjs` 闭包扫） | 45 档 · **零 `ledger.mjs`**（#585 新直边无环） |
| `node scripts/doc-check.mjs`（before ∕ after 两采） | 悬空 162 ⇒ 163（+1 = 并发他批 `desktop/PROJECT.md` 新行）、行宽 80 ⇒ 80；**本席写域（码 6 档 + 批件）两跑逐行零出现 ⇒ 零新增红**（`residuals-round2-doccheck-{before,after}.txt`） |
| `engine-floor-guard` 清悬扫（四包码，排 `.thincoder/tmp`；+ `docs/**/*.md` 活面） | 四包 **0 命中**（核 ∕ cli ∕ desk ∕ vsc-src）· docs 活面 **0**——残余 = 恰**记录面两域**（`docs/batches/**` + `MANIFEST.md:180` 快照行） |
| 行数读数（终态 `wc -l`） | `process-probe.mjs` 163 ∕ `-exec` 187 ∕ `ledger.mjs` 219 ∕ `write-gate.mjs` 156 ∕ `family-tools.mjs` 187 ∕ `child-marks.mjs` 24 ∕ 批件 239 |
| 仓级套件 | 未跑——父侧收口跑 = 唯一仓套件跑点 |

**（3）审计与评审轮次（内部）**

- 分歧审计（explore · 只读）1 轮 = **CLEAN**（逐项 A–G 命中；其未核项 = git 逐字 ∕ 运行时复跑——本席补证：`git show HEAD` 逐区逐字对照（迁出 9 区仅两处 `export` 增补；留档 9 区恒等）+ 复跑读数）。
- 代码评审（advisor · code）轮 1：**pass**（🔴0 · 🟡0 · 🔵3——全非阻断）；轮 2（只验修复声明）：**pass**（claim① ∕ claim② 均 Fixed · 零新增）。
- fix round（评审 🔵 逐条处置）：① L2-B 锚点「首命中」⇒「**调用形**」（跳过含 `function` 的声明行——调用迁出 ⇒ `at=-1` ⇒ 红；fail-closed 收正）；② L4d/g **两缝同注**（免真实 `probeCmdlines` 支；d ∕ g 判据面零变）；③ 数值预告落差 = 本记录（（1）∕（2）读数即落点）。

**（4）决策透明表（披露 ∕ 只报）**

| # | 事项 | 性质 | 处置 ∕ 去向 |
|---|---|---|---|
| 1 | `thincoder-core/agent/write-gate.mjs`（#593）= 派单枚举外文件 | 父侧核定（派单漏列、非设计变更；§2『波面追加』在册） | 已落；报告披露 |
| 2 | 批件落位 = `.thincoder/tmp/`（#545 立即形）；**终位副件现为修复前版**（旧首命中锚 `:165` ∕ 旧单缝 `:200`；231 行） | 评审轮 2 范围外注记 · 协同项 | **待父侧重 copy**（取 239 行 tmp 版）——否则终位复跑仍是修复前判据 |
| 3 | `ledger.mjs` Δ 实落 +3（表记 Δ≈+1~2）· 批件实落 239（表记 ≈170–220）；批档表值 = as-of 预告 | 评审 🔵③ · R7c 报告项 | 读数入本记录；表值刷新归设计面 ∕ 父侧收位 |
| 4 | 台账 #585 ∕ #586 ∕ #590 ∕ #593 行核销 | 父侧 | 待收口 |
| 5 | 他波在飞改动 ∕ doc-check 窗口内并发差集（`desktop/PROJECT.md` ∕ `AGENT-LOOP-SUBAGENT.md`） | 只报 | 零触 |

**（5）写后核（D6）**：`ledger.mjs` ∕ `process-probe.mjs` ∕ `process-probe-exec.mjs`（全档）· `family-tools.mjs:16` · `child-marks.mjs:6-7` · `write-gate.mjs:20-21 ∕ :24` · 批件（修复两处 + 复跑）——均读回核；本 append 落盘后回读核。

**边界**：产品码 = 核 6 档（5 改 + 1 新）；批件腿 L1 ∕ L2-A ∕ L2-B ∕ L4。VSC ∕ 桌面码面 ∕ 档面（LEDGER.md ∕ CORE-UNIFICATION.md ∕ 引文）零触（各归其波 ∕ eng-designer 域）。

### #589 遗珠补落（桌面码三处引注改指）实施记录 · eng-coder · 2026-09-29（fix 轮）

**波段**：三波实施后唯一未落项——desk 码三处悬空引注收正（旧引 `agent-assemble.mjs:67-71` ∕ `:68`——该档现 32 行，坐标不存在）。范围 = 两档三行；文档面 ∕ 需求档（已完成项）未重做；他档 ∕ `scripts/**` 零触；代码评审未发起（派单禁则——父侧门）。

**（1）逐处表（号 → 改动 file:line → 读数）**

| # | 文件:行（现读） | 改动（旧 ⇒ 新） | 读数 |
|---|---|---|---|
| #589① | `thincoder-desktop/src/main/index-status.mjs:16` | `agent-assemble.mjs:67-71` ⇒ `thincoder-core/agent/assemble.mjs:74-79` | 新锚实读命中（见（2））；旧引字面零残余 |
| #589① | 同档 `:24` | 同改指 | 同上 |
| #589② | `thincoder-desktop/src/main/settings.mjs:236`（设计记 `:177`——按符号名届盘重读实锚；漂移为口径内） | `agent-assemble.mjs:68` ⇒ `thincoder-core/agent/assemble.mjs:76` | 同上 |

**（2）新锚届盘实读（落笔后复读 · cwd = 仓根）**

- `thincoder-core/agent/assemble.mjs`（现读 112 行）：`:74` = `const memory = D.createMemory({ dbPath: config.memory.dbPath })` · `:75` = 注（Vector retrieval…）· `:76` = `if (config.embedding?.apiKey) {` · `:77` = `const { createEmbedder } = await import("../embedding.mjs")` · `:78` = `memory.embedder = createEmbedder(config.embedding)` · `:79` = `}` ⇒ `:74-79` = `createMemory` + embedder 附装段；`:76` = `embedding.apiKey` 判据——设计双锚逐点命中。
- 旧引零残余：`thincoder-desktop/src` 全树 `agent-assemble.mjs:<数字>` 零命中（`agent-host.mjs:18 ∕ :24 ∕ :47 ∕ :55` ∕ `exec-run.mjs:9` = 模块名 ∕ import ∕ export 路径形，非坐标引；零触）。
- 语义零变坐实：被指称装配形真身在核件在场（上述）；两档消费面同形实读——`index-status.mjs:26-27`（`openMemory`：`createMemory({ dbPath })` + `if (config.embedding?.apiKey) memory.embedder = …`）· `settings.mjs:244`（`hasEmbedder: Boolean(config.embedding?.apiKey)`）。

**（3）验证命令与读数（2026-09-29 17:4x–17:5x；cwd = 仓根）**

| 命令 | 读数 |
|---|---|
| `node --check`（两档） | 全绿（2/2） |
| `node scripts/doc-check.mjs`（before ∕ after 两采；存 `.thincoder/tmp/r2-589-doccheck-{before,after}.log`） | 逐行差集 = **零**（✗ 550 ⇒ 550 同集；悬空 163 ⇒ 163 · 行宽 80 ⇒ 80 · 行数面 26 ⇒ 26）——本批写域零新增红（覆盖域披露见（4）#3） |
| `node --test docs/batches/2026-09-29-residuals-round2-desktop.test.mjs`（波 3 既有腿回归） | **2/2 pass · 0 fail** |
| `git diff`（两档定格） | 恰 3 行（index-status +2 ∕ settings +1——行内替换；行数零变：68 ∕ 324） |
| 仓级套件 | 未跑——父侧收口跑 = 唯一仓套件跑点 |

**（4）决策透明表（披露 ∕ 只报）**

| # | 事项 | 性质 | 处置 ∕ 去向 |
|---|---|---|---|
| 1 | 引注形式 = 全路径 `thincoder-core/agent/assemble.mjs`（设计对 settings 处记简写 `assemble.mjs:76`——该句前置为核全路径） | 形式选择（可解析性 + 同档跨包引注惯例：`settings.mjs:14 ∕ :93 ∕ :167` 全路径形先例） | 已落；审计判「非简化 ∕ 非偏差」 |
| 2 | 设计锚行 `settings.mjs:177` ⇒ 届盘实锚 `:236`（漂移） | 口径内（派单「落笔前按符号名届盘重读，锚行以现盘为准」；§3 修正轮「实施以届盘实读为准」） | 已按现盘落；设计表值刷新 = 设计面 ∕ 父侧（本席不改设计档） |
| 3 | doc-check 覆盖披露（独立坐实）：`PROJECT-MANIFEST.json:25-35` `scanDirs=["docs"]` ∕ `anchors.exclude=["_archive","batches"]` ⇒ 桌面两码档结构性在机判域外——「本批写域零新增红」对该三行 = 结构性恒真（非该三行的机判腿；与设计「无新腿——纯人工读数」一致） | 验收口径披露 | 真实判据 = 逐处实读 + `node --check` + 审计 |
| 4 | `thincoder-desktop/.thincoder/tmp/r10-desktop-selfcheck.mjs`（09-28 scratch 件）含 `agent-assemble.mjs` 模块路径引用（`:12 ∕ :22`——非坐标形） | 只报（设计 ③ 裁「零动作」；scratch ∕ tmp 件非产品码） | 零触 |
| 5 | `docs/batches/**` 记录面历史坐标（B5 档 `:312` 悬空登记行 · 本批设计 `:201` 现状句 · `2026-09-28-desktop-feature-parity.md:1031` 等） | 只报（记录面冻结——非活引） | 零触 |
| 6 | 代码评审 = 未发起 | 流程披露（派单禁则「不发起评审（父侧门）」） | 父侧门接管 |

**（5）审计与评审轮次 · 终态**

- 分歧审计（explore · 只读）**1 轮**：码面四点（a 新锚可解析 ∕ b 零出列 ∕ c 全树零命中 ∕ d 语义零变）**全吻合**——唯一发现 = 记录面 🟡（§5 本小节未落）⇒ **随本 append 关闭**（fix round 0——无代码侧修复项）。
- 代码评审（advisor · code）：**未发起**（派单禁则——父侧门）。
- **终态 = clean**（码面审计 CLEAN；记录面项 = 本节落盘即关闭）。

**（6）写后核（D6）**：两档全文回读（`index-status.mjs` 全 68 行 ∕ `settings.mjs` 全档分段读迄）· 三处改动行读回核 · `assemble.mjs:74-79` 落笔后复读 · 本 append 落盘后回读核。

**边界**：产品码 = 两档三行（行级引注改指——零语义 ∕ 零行数面外改动）；文档面 ∕ 需求档 ∕ 他档 ∕ `scripts/**` 零触。

## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落（三波 + 遗珠）**：**波 1 核面**（#585 `ledger.mjs` 219 ∥ #590① `process-probe.mjs` 163 + 新档 `process-probe-exec.mjs` 187 ∥ #586 引文两处 ∥ #593 write-gate 头注）∥ **波 2 VSC**（#587 三档 ∥ #586 七处）∥ **波 3 桌面**（#578③ ∥ #586 `SHELL.md` ∥ `file-links.mjs` 一行）∥ **#589 遗珠补落**（desk 码三处：`index-status.mjs:16 ∕ :24` ∥ `settings.mjs:236`——fix 轮）；文档面（`LEDGER.md` ∕ `CORE-UNIFICATION.md` ∕ 六档 13 处引文 ∕ `WEBVIEW.md` ∕ `SHELL.md`）在册。
- **批内件（三件 · 归档）**：`docs/batches/2026-09-29-residuals-round2.test.mjs`（239 行 · 父侧收位 ✓）∥ `…-vsc.test.mjs`（245 行）∥ `…-desktop.test.mjs`——复跑 = 本收口跑（读数附下）。
- **验证**：各波腿读数在 §5；终态 clean（advisor 轮次全 pass）；三波各自「改前 ∕ 改后同绿集」口径在册；**写门相抵**处置 = 后续批同口径（tmp 副本 + 父侧收位）。
- **集成面**：**不新增**（批内件形；桌面 ∕ 核内部件无新增集成用例）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓ ④ 指针 ✓ ⑤ changelog ✓ ⑥ **台账勾销：#586 ∥ #587 ∥ #589 → 已核销**；**#590 留开**（① 已落 ∕ ②–⑤ 顺开档轮——在途保留）⑦ 前批遗留交叉核：`desktop-micros` 副本同步 = 本批前已收；无遗留。
- **遗留（显式）**：#590②–⑤ ∥ GUI 真机腿（VSC goal-panel 两态——无显示环境未跑，披露）∥ `settings.mjs` 锚漂（设计面表值刷新，零阻塞）。
- **收口结论**：本批终止。
