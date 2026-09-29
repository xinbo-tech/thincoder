# 2026-09-29 · desktop-residuals-sweep
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 04:39「又有不祥预感」+ 父侧盘账——桌面残余族清账批（台账 #533–#563 区间「随下一桌面轮」族约 20 条 + #518 复审残项）。
> 台账 = #575（desktop · 归批）。前情 = 台账 #533–#563 区间「随下一桌面设计面轮」族 + #518 复审残项（本批 = 清账载体本体）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源与口径（父侧 · 2026-09-29 04:4x）
- **来源**：用户 04:39「在飞数量…不祥预感」+ 父侧盘账发现——台账 `#533–#563` 区间约 **20 条**触发词「随下一桌面设计面轮 ∕ 归批」，而**那个「下一轮」从未立出**（与同日 annex 清账同型：登记无载体）。
- **射程**：清单全文（~21 条，含 #518 复审残项）见派单 + 台账逐行（ledger_query 可读）。
- **口径**：逐条**实读复核**（已消解 ⇒ 父侧核销）→ **三分类**：当场落 ∕ 设计落 ∕ 归他批；**五冻结档零写**（#58 窗内：UI ∕ PROJECT ∕ SHELL ∕ RENDERER ∕ IPC）。
- **台账**：#575。

### 1.2 父侧裁定（2026-09-29 04:5x · 逐条）
- **D ∕ E 组双头**：`doc-sync-residuals` §1.1「D 组（#540 ∕ #548）· E 组（#551）待解冻后另派」**以本批承接为准**（本批即其解冻后派；该声明在已收口档 = 历史句，不回溯改）——本批 §6 收口时勾销该指针。
- **#543 默认 = A（携文入队列）**——现状「静默丢弃」判缺陷；设计 3.6 按 A 定形（用户一句话可翻转）。
- **笔权分置（#560）确认**：`RELEASE.md` ∕ `README.md` ⇒ 主 agent 笔；`ARCHITECTURE.md` ⇒ 设计席笔。
- **#533 zh 词值**：按 en 项语义直译（与 VSC ∕ 系统惯例一致），随修复轮核。
- **实施前置**：开工前确认四冻结档基线（他轮未提交 diff）——基线报告入 §5。

### 1.x 波 A 裁定（父侧 · 2026-09-29 06:1x · #101 交付提请）

- **`#533` zh 词值**：裁定 = **按 §1.2「语义直译」落 zh 值**（`menu-words.mjs:21-25` 值级更新 ∕ 零结构改）——en 现值 = 占位非终态；#101 已结算未及 ⇒ **另派微单落值**（在册，不挂账）。
- **`#554②` 默认显隐**：裁定 = **保持「合」不回翻**——桌面档注自载「#554② 核定：原『非空即显』无开合面 —— 随 VSC 改默认不显」⇒ 本批已定「默认显」为待改旧态；VSC 侧「goal 到达即 block」（`webview/panels.js:30-35`）与桌面「默认合」= **跨端差异实体** ⇒ 已立 **#587**（归 VSC 面处置——不得登记保留）。
- `#556` 增键 ⇒ `i18n.mjs:49` 键数链待 **#544** 同拍续链（在册）；新档 §4.1 登记随解冻轮。

### 1.y 波 A 登记承接（父侧 · 2026-09-29 06:1x · #101 结算报告）

- `#556` 增键 ⇒ `i18n.mjs:49` 键数链 = 待 **#544** 同拍续链（在飞批让先 · 在册）。
- 新档 `menu-words.mjs` 的 §4.1 登记 = 随**解冻轮**（在册）。
- 🔵 三条（🎯 `:focus-visible` 三值 ∕ 菜单 locale 创建时一次性 ∕ 批件腿① zh 改述点）= §5 在册（建议级；🎯 a11y 项随下批同面收）。
- **设计侧 `suspension.mjs:477-482` 坐标不成立（实读 `:112-116`）= 归波 D（#103）∕ 收尾波同笔**收正。
- **越表三笔受理**（`chrome.css:441` ∕ `events-wake.mjs:25` ∕ `subagent-reduce.mjs:171-173`——均直接描述被改帧/面，不随改即失效；①③ 我裁定原文见 §1.x）。

### 1.z `#533` 台账对账（父侧 · 2026-09-29 06:3x）

- 台账 #533 范围实读 = **维护菜单两项补 zh/en**（`window.mjs` 维护菜单 en-only）⇒ 本批已落（`menu-words.mjs` zh 直译值 + #114 微单）——**§6 结算面**。
- 连带两笔**别账**：① `window.mjs:6` 陈旧句 = 微单在办（零逻辑改）；② `PROJECT.md:881` 半句（冻结 gated ⇒ 解冻轮同笔）+ Edit 组 roles en-only（copy 批档 `:45` 另记）= 对账时定是否独立条目。
- 结算动作延 §6（两段式核销照台账纪律）。

### 波 D 落定与结转（父侧 · 2026-09-29 07:1x · #103 交付）

- 波 D：8 处全清（两档悬空 8 ⇒ 0 · doc-check 全量 **233 ⇒ 225**）；行宽 +1 = 父侧并发笔（`AGENT-LOOP-ASYNC-POOL.md:576`——**已折行修复**，现净 0）。
- 结转三项：① `:33` 的「设计侧 `suspension.mjs:477-482`」= **#103 未及 ⇒ 归收尾波**（实读 `:112-116`）；② `ENGINEERING-MODE-V2.md:93 ∕ :454` 的 `tool-gates.mjs:73` 悬空 = **归 #588 悬空清账轮**（B1 删档族）；③ `RENDER-CORE.md:73` 裸式 `styles.css` · `RC:275` 预算数字 · `RC:364` 标签条 · `E2E:111` 步骤本体 `tab:close` = 列报（出锚射程）——§6 收口核。
- 冻结五档 gated 项（#540 余锚 ∕ #535 冻结 5 处 ∕ #548/#550/#551/#518①③）= 零触在册。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 · 2026-09-29（修正轮 1 逐号落定 · 评审 #73 · 11/11 · §4.1 重读重分类在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**设计轮交付（desktop-residuals-sweep · 2026-09-29 · eng-designer）**

> 任务书依据 = 派单（用户 2026-09-29 04:39 目标与理由 + 已知事实清单）+ 台账 #575 逐条详情（`ledger_query` 实读）。**注**：本记录 §1 仍为模板占位（未填）——射程以派单 + #575 为准，已按此执行。
> 口径（逐条实读 as-of 2026-09-29 04:5x）：每条先验现状（仍真 ∕ 已消解 ∕ 转出）再定修法。三分类 = **当场落**（一行级：注释 ∕ 文案 ∕ 坐标 ∕ 死指针 ∕ 键数链）∥ **设计落**（须定形，本批给方案）∥ **归他批**（真属他类）。
> 冻结令：`UI.md` ∕ `PROJECT.md` ∕ `SHELL.md` ∕ `RENDERER.md` ∕ `IPC.md` 五档在他轮评审冻结窗内 ⇒ 本轮零写；**本设计轮只出方案，文档笔落 = 实施轮**（冻结档笔落以解冻为前置，见「实施序」）。

**1. 逐条处置表（全 23 行 = 台账 20 条 + #518 复审残项 1 行 + 派单点名归他批 2 条）**

| # | 台账 | 状态 | 实读证据（as-of 2026-09-29 04:5x） | 修法 | 落点 | 分类 |
|---|---|---|---|---|---|---|
| 1 | #533 | 仍真 | `window.mjs:70-73` 维护菜单两项 = en-only（`"Clean up session data…"` ∕ `"Rebuild session index"`）；组名 `Maintenance` 同 | 菜单词面改 zh/en 双值（主进程自持常量对；先例形 = 复制面对齐批拟新增 `src/main/context-menu.mjs` 的 `contextMenuLabels(locale)`；locale 取 `loadConfig()?.locale`） | `src/main/window.mjs`（`buildMenu`）+ 新档 `src/main/menu-words.mjs`（拟） | 当场落（zh 词值上抛） |
| 2 | #534 | 仍真 | `theme.css:16` 亮色 `--mode-advisor: #14ce14` ⇒ 对 `--bg #f7f8fa` 对比 **2.00:1**（白底 2.13） | 亮色暗化（同色相 hue120）：`#14ce14 ⇒ #0a7b0a`（对 bg **5.13:1** ∕ 白 5.45）；暗色 `#23d18b` 零动（CLI 忠实值）；注释按新出处收正 | `renderer/theme.css:16` | 当场落 |
| 3 | #535 | 仍真 | 引 `render-frame.mjs:221-225` 的站点 12 处，目标现读 `:227-230`（`bannerPrefix` `:231`）——码面 2：`statusline-banner.mjs:5` · `agent-host.mjs:205`（台账记 `:313` 已越 EOF=陈旧）｜冻结档 5：`UI.md:105` `:193` `:198` + 同族短式 `:100` · `IPC.md:198`（台账记 `:171` 现不载引文）｜非冻结档 5：`TUI.md:582` · `ENGINEERING-MODE-V2.md:394` `:454` · `AGENT-LOOP-UPSTREAM.md:885` · `WEBVIEW-PROTOCOL.md:116`（台账记 `UI.md:110` `:203` 现亦不载引文） | 逐处坐标收正：`221-225 ⇒ 227-230` · `220-224 ⇒ 226-230` · `221 ⇒ 227` · `222,225 ⇒ 228,231` | 码面 2 = eng-coder；档面 10 = eng-designer（冻结 5 处 gated） | 当场落（坐标） |
| 4 | #536 | 仍真（家族扩大） | 越 300 家族现读 6 档：`chrome.css` **444** · `i18n.mjs` **473** · `mount-sessions.mjs` **400** · `views/chat.mjs` **365** · `agent-bridge.mjs` **333** · `chat.css` **312**（台账记 chrome.css 425 已陈旧） | 拆点定形（chrome.css 两拆方案见第 3.4 节）+ 越层段与 #551 同笔重锚；拆分实施 = 逐档触碰轮 | `PROJECT.md` §4.1 越层段（冻结 gated） | 设计落（续期在册） |
| 5 | #537 | 仍真（未办） | 真机走查（右列子代理全族）= 父侧亲手跑（冒烟纪律，不走设计轮） | — | — | **归他批**（用户账） |
| 6 | #538 | 三件：① 已消解（记录面冻结）② 仍真 ③ 部分已落 | ① flow 批档「待收」句在 `2026-09-28-desktop-flow-vsc-align.md:43`，同档 `:117` 已载处置（随全清令取消）；该档 `:6` = 已收口 2026-09-29 + `:1379`「收口冻结（后续变更 = 新批）」⇒ 记录面**不可回改** ② R13 四拆旧引用成锚 49 行（`styles.css` 31 + `tabbar.mjs` 5 + `info-row.mjs` 4 + `composer-send.mjs` 9）③ flow §4.2 行部分已在册（`PROJECT.md:389` ∕ `:485` ∕ `:766`） | ① 核销（以设计档侧落定代替勘误；记录面不回改）② 并入 #540 同 sweep ③ 并入 #551 全表重锚 | ① 零触 ②③ 见 8 ∕ 16 行 | 设计落（②③） |
| 7 | #539 | 仍真 | 逐处实读 6 处死指针：`chat-composer.css:61`（`沿 .rail-row:focus-visible 先例`——该族随 R13-A 退场）· `views/chat.mjs:32` + `chat-tool.mjs:46` + `chat-copy.mjs:12`（`renderer/views/sessions.mjs:161` 通则——档已退场）· `views/settings.mjs:15` + `:276`（`info-row.mjs`）· `settings.css:9` ∕ `:10`（`info-row.mjs` · `styles.css` 活指针） | 逐处改锚活面：`.rail-row:focus-visible ⇒ .session-item:focus-visible`（`chrome.css:171-175` 同三值先例）· `views/sessions.mjs:161 通则 ⇒ views/chat-tool.mjs`（`wire` ∕ `withKey` 两态原语单源）· `info-row.mjs ⇒ renderer/mount-info.mjs` · `styles.css（变量单源）⇒ theme.css` | 6 处码面注释 | 当场落 |
| 8 | #540 | 仍真（已量化） | `node scripts/doc-check.mjs`（2026-09-29 04:5x）：**悬空 166** · 候选 31852 · 行宽 18；**桌面相关 66 条**（其中 14 条带「拟新增——列报 · 不入闸」）；退役名成锚：`styles.css` 31 行（PROJECT 15 ∕ UI 12 ∕ RENDER-CORE 4）· `composer-send.mjs` 9 · `tabbar.mjs` 5 · `info-row.mjs` 4 · test 三助手 | 逐档逐处重锚到现盘继任（映射表见第 3.3 节）：`styles.css ⇒ theme.css ∕ chrome.css ∕ skin.css` · `composer-send ⇒ composer-wire ∕ composer-sync ∕ mount-composer` · `info-row ⇒ mount-info` · `tabbar` 无继任（删锚 ∕ 标退场）· test 三助手随全清令删锚；验收 = 桌面相关悬空 66 ⇒ 0（拟新增列报项除外） | `PROJECT.md` ∕ `UI.md` ∕ `SHELL.md`（冻结 gated）· `E2E-TESTING.md` ∕ `RENDER-CORE.md`（可落） | 设计落（doc-face sweep） |
| 9 | #541 | 仍真（面缺 · 四层同缺） | VSC 有件：`panel-turn-loop.mjs:135` `postDigestCap(panel,"stop",e.turn)` + 归约/节点/类（`base.css:237-247`）；桌面四层实读同缺：无发射（`suspension-drive.mjs:135/:146` 只 start/end）· 归约无 cap 支（`events-wake.mjs:43-59`）· 无节点（`chat-chrome.mjs:51-55`）· 无类（`chat.css` 零 `digest-cap`） | 对位 VSC 四层方案（第 3.5 节）：端发射（digest 撞帽 ⇒ `status:"cap"`）· 归约 cap 支 · `digestGroupNode` cap 行（`data-digest-cap`）· `.digest-cap` 两态类（值对位 `base.css:237-247`）· 词键零新（核 `digest.capAuto/capStop` 经 `t()` 投影） | `suspension-drive.mjs` · `events-wake.mjs` · `views/chat-chrome.mjs` · `chat.css` | 设计落（方案本批定形；**实施 = 另轮**） |
| 10 | #543 | 仍真（未定形） | `turn-driver.mjs:169-181`：`interrupt` 携 `message` 仅 resume 支消费（`turn-face.mjs:103-107`）；撞帽待答期停在 `await consentOf`（`:112`，在 try 外）⇒ 文本**零队列 ∕ 零历史 ∕ 零落盘**；`denyGates` 把询问解为 `(user cancelled)` ⇒ `"stopped"`；输入框被清空 | 二择（第 3.6 节）：**A（推荐）**= 撞帽待答期 ↑Ctrl+I 携文 ⇒ 入宿主队列（复用 `queued-input`）+ 回合判 `stopped`（消息不丢）；**B** = 保留现语义 + 加可见提示（文本退回草稿） | A = `turn-driver.mjs` ∕ `turn-face.mjs` ∕ `queued-input.mjs`；B = 同两档 + 端侧提示 | 设计落（**上抛：用户口径待裁**；未裁 ⇒ 实施轮零行为变更，仅落现状文档句） |
| 11 | #544 | 部分已消解（残余一行） | `i18n.mjs:42-50` 已落 R7 键链复核实读 + R9 二键续链；本次 import 实读 = `HOST_DICT` **267** ∕ `VIEWS_DICT` **106** ∕ `COMPOSER_DICT` **28**（`HOST_DICT` 为合并表 ⊇ 后两档；两语键集相等）= 与链末值相符；残余 = `:45`「合计 **397**」未随 R9 同拍（读数歧义） | 一行续链：合计句按 R9 后同拍收正 + 注明口径（合并表）+ 预告在飞批（复制面对齐：两键退场 ⇒ 实施后实读续链） | `renderer/i18n.mjs:44-50` | 当场落（一行级） |
| 12 | #545 | 仍真 | `thincoder-core/agent/write-gate.mjs` 判据「cross-batch batch-record write」fail-closed 拒 `docs/batches/*.test.mjs` | — | — | **归他批**（core 面 · 写门判据语义 ⇒ 须设计轮） |
| 13 | #546 | 仍真 | `scripts/doc-check.mjs` 无行数面（grep 零命中）；`checkConfig` 五键（`PROJECT-MANIFEST.json:24-37`）；main 无 checks 列表（两串行硬调用 `:62/:64`）⇒ 需 checkConfig 新键 + manifest 写面 + 新模块 + main 集成 | — | — | **归他批**（工程工具面 · 判据语义 ⇒ 父侧直改专轮） |
| 14 | #548 | 仍真（坐标漂移 + 两死类） | 全树 grep：`.approval-card` **零命中** · `.composer-input` 1 命中（`chat-composer.css:6` 退场注释）；D24 注位现坐标 = `PROJECT.md:582`（记 `:543`）· `UI.md:241` `:247-249` `:251-256` `:260-261`（记 `:245` `:248-249` `:251-253` `:264`）；审批卡现值类 = 核 `.permission-prompt*`（`chat-cards.css:5/38/47/52/59/63/69`） | 两死类疑点裁 **死类**（码面零生产）⇒ 注列类名改现值类（`.permission-prompt` ∕ 核件输入框类）+ 删 `.rail-row` 残句；坐标按现盘收正 | `PROJECT.md:582`（D24 行）· `UI.md` §1 D24 注位（两档冻结 gated） | 设计落（裁死类 + 注位收正） |
| 15 | #550 | 仍真（裁已定：保留 + 登记） | 五 kind 表在 `views/statusline-segments.mjs:57-73`（`index` 支在场）；桌面 `ev:statusText` 唯一发射 = `agent-bridge.mjs:296-301`（`waitStatusOf` 四 kind）⇒ `index` **零产出方**；VSC 有生产（`panel-index.mjs:29`） | 保留支 + 登记句（产出方 = 索引族后续自然接点；零消费面改） | `IPC.md` §2 `ev:statusText` 注（冻结 gated） | 设计落（登记 · 一行级） |
| 16 | #551 | 仍真（已量化） | §4.1 表实测：解析 88 行；**41 档盘上有而表无行**（含 #518 残项两档：`views/pool-subagents.mjs` **115** ∕ `views/activity-new.mjs` **109**）；4 行指向已退役 ∕ 拟新增档（`styles.css` ∕ `composer-send.mjs` = 退役；`electron-builder.yml` ∕ `context-menu.mjs` = 拟新增）；多行值大幅陈旧（`agent-bridge` 表 257 ∕ 实 **333**；`i18n-views` 68 ∕ **282**；`events.mjs` 497 ∕ **246**；`mount-settings` 499 ∕ **151**；`attach` 179 ∕ **57**；`ipc` 293 ∕ 293 ✓） | 全表重锚：口径 = 内容行数（`split('\n').length − 1`——沿在册口径）；值列 = 届盘实读 + as-of；退役行删除 ∕ 继任行补登；41 缺行档补登；越 300 段与贴 300 段重写；§4.2 补本批行 | `PROJECT.md` §4.1 ∕ §4.2（冻结 gated） | 设计落（方法 + 数据见第 3.2 节） |
| 17 | #553 | 仍真 | 核 `setup-reminders.mjs:40-42` `envStateLine` 取**模块常量** `END`（`session-slots.mjs:105` = `"cli"`）而非 `sessionEnd()`；桌面 `session-slots.mjs:69/:72`（`END="desktop"` + `setSessionEnd`）；VSC 先例 = 端侧自持行（`vscode/src/agent/setup-reminders.mjs:58-63`；核 `END` 参数化 = 核内笔未落） | **核行参数化**（择一；「端自持行」= 第三份副本，违单源）：`envStateLine` 端名取 `sessionEnd()`（1 行 + 注释）⇒ CLI 零变 · 桌面得 `desktop` · VSC 自持行不动（退役 = 另轮）；**连带上抛** = 提示词面 `persona-normal.md:39` ∕ `persona-engineering.md:171` 的 `cli|vscode` ⇒ +`desktop` | `thincoder-core/agent/setup-reminders.mjs:40-42`（+核用例） | 设计落（定形 + 1 行核改） |
| 18 | #554 | 仍真（两处） | ① `interrupted` 注记链路桌面已在（`agent-bridge.mjs:249-257` → `subagent-reduce.mjs:33-37/:184` → 核 `activity-view.mjs:60-63`），**发射点缺**：`suspension-drive.mjs:80-81` `ev:susp` 端帧无 `interrupted`（VSC 有：`suspension.mjs:480-482`）② 🎯 = 惰性 span（`statusline.mjs:116-125` 零 handler；零 `goal:*` 通道）；VSC = 本地 DOM 开合（`status-bar.js:74-83` 切 `#goal-panel`，默认 `display:none`） | ① 端帧补 `interrupted` 键（对位 VSC）② 🎯 补点击面 = 本地开合（零新通道；VSC 同为本地 DOM 态）——**open**：桌面目标卡现默认显隐须实施轮实读核定（若默认显 ⇒ 随 VSC 改默认合） | ① `src/main/suspension-drive.mjs` ② `renderer/views/goal.mjs` ∕ `statusline.mjs` ∕ `mount-cards.mjs` | 设计落（两处小件 · 本批实施） |
| 19 | #555 | 仍真（五处逐条核） | ① `agent/setup.mjs:236` 四坐标全漂（`subagent.mjs:258⇒271` · `:184⇒194` · `subagent-spawn.mjs:305⇒304` · `subagent-async.mjs:272⇒291`）② `panel-callbacks.mjs:205` 文件错位（`dispatch.mjs:441 ⇒ dispatch-run.mjs:137`）③ `:265`（`subagent-spawn.mjs:319⇒318`）④ `:272`（`:308-309⇒:308`）⑤ `panel-subagent-relay.mjs:36` 六类 token 全漂（`subagent-run.mjs:143⇒163` · `subagent-scheduler.mjs:337⇒356` · `subagent-async.mjs:262⇒281` · `async-settle.mjs:228/262/264⇒239/273/275` · `agent.mjs:207⇒242`） | 逐处改坐标（零语义） | 五处 VSC 码面注释 | 当场落 |
| 20 | #556 | 仍真 | 桌面改名失败径零可见面（`mount-sessions.mjs:353-366` 仅 `console.error`）；既有 toast 载体在盘（`/rc/toast.mjs`；R9 先例 = `:311` `session.openFailed`）；VSC 对位（`panel-messages-session.mjs:96` warning） | 失败径补 toast（`showToast(t("session.renameFailed", { reason }))`）+ 端词表补键（zh/en，沿 `session.openFailed` 同组同形） | `renderer/mount-sessions.mjs:356-364` + `renderer/i18n-views.mjs`（⑤ 组） | 当场落（一行级 + 一键） |
| 21 | #560 | 仍真（三处零命中） | `docs/RELEASE.md` grep `render-core` ∕ `发布序列` = 0；`README.md`（仓根）0；`docs/core/design/ARCHITECTURE.md` 0；权威句在 `RENDER-CORE.md:374` §10 B + `:67` KD-RC-1 + §1.3 | 三档各补行：RELEASE.md §2 F5 邻位（不入发布序列 + 两打包窗前置换核物化）；README Layout 表补行；ARCHITECTURE §4 表尾补行；两指针（`WEBVIEW.md` ∕ VSC `AGENTS.md`）已有命中 ⇒ 零动 | `docs/RELEASE.md` ∕ `README.md`（产品文本面 = 主 agent 笔）· `ARCHITECTURE.md`（设计面 = 本席笔） | 设计落（笔权分置） |
| 22 | #563 | 仍真（两则） | ① 核 `subblocks/block.mjs:53-59` `initBlockFollow` 监听集 = `wheel` + `touchmove`（无 `scroll`）——三端共用同件（桌面 `pool-subagents.mjs:29` ∕ VSC `activity.js:64`）⇒ 拖条 ∕ 键盘滚动不写旗标 ② 桌面 `_poolPin` 写者三处（`activity-new.mjs:101` 点击 ∕ `:105` `scroll` ∕ `activity.mjs:223` 世代重置）+ 帧尾写（`activity.mjs:258-260`，每 POOL_KEYS 通知一次） | ① 核原语监听集补 `scroll`（单源修 ⇒ 三端同收；沿 VSC `ui.js:217` 三事件先例）② 评估 = 帧尾写守 `_poolPin === false` 早退（本批零改）；维持现态 + 登记（极端窗口夺回一次上滚 = 有界自纠） | ① `thincoder-render-core/subblocks/block.mjs:53-59`（+核用例）② 登记 = `RENDERER.md` ∕ `PROJECT.md` | 设计落（① 1 文件 ② 登记） |
| 23 | #518 残项 | 仍真（三件） | ① §4.1 两行缺（`pool-subagents.mjs` ∕ `activity-new.mjs` 仅 §4.2 `:534-535` 命中）② `WEBVIEW.md:453` D-W13 括注仍作「`activity.js` 持旗标 + wheel/touch 让位 + rAF 帧应用」，与同档 §5.5（`:399-401`）及核 `block.mjs` 单源相抵 ③ 批次期语句两处：`PROJECT.md:734`「搜索面（暂缓面——KD-RC-5）」（记 `:732`）· `UI.md:427`「其余浮层族（…搜索…）桌面零对位面 ⇒ 零动」——R6 搜索已落（`renderer/search.mjs` 26）⇒ 两句失效 | ① 并入 #551 补行 ② 括注改「原语入核 · 本端留调用点 ∕ 帧驱动」③ 两句按现态收正（搜索移出暂缓 ∕ 零对位句） | ① `PROJECT.md`（gated）② `docs/vsc/design/WEBVIEW.md:453`（非冻结）③ `PROJECT.md:734` ∕ `UI.md:427`（gated） | ②当场落；①③设计落（gated） |

**2. 「立即落」清单（实施轮可落 · 码面 ∕ 非冻结档面 · 13 行）**

| 序 | 条目 | 落点 | 变更形 | 笔 |
|---|---|---|---|---|
| L1 | #534 | `renderer/theme.css:16` | 亮色值 `#14ce14 ⇒ #0a7b0a` + 注释按新出处收正（暗色 `#23d18b` 零动） | eng-coder |
| L2 | #539 | 6 处码面注释（`chat-composer.css:61` · `views/chat.mjs:32` · `chat-tool.mjs:46` · `chat-copy.mjs:12` · `views/settings.mjs:15`/`:276` · `settings.css:9`/`:10`） | 死指针改锚活面（`.session-item:focus-visible` ∕ `chat-tool.mjs` 两态原语 ∕ `mount-info.mjs` ∕ `theme.css`） | eng-coder |
| L3 | #544 | `renderer/i18n.mjs:44-50` | 合计句按 R9 后同拍收正（注明合并表口径）+ 在飞批退键预告 | eng-coder |
| L4 | #535（码面 2） | `views/statusline-banner.mjs:5` · `src/main/agent-host.mjs:205` | 坐标 `221-225 ⇒ 227-230` | eng-coder |
| L5 | #555 | 五处 VSC 码面注释 | 坐标逐处改（含 `dispatch.mjs:441 ⇒ dispatch-run.mjs:137` 文件错位） | eng-coder |
| L6 | #556 | `renderer/mount-sessions.mjs:356-364` + `renderer/i18n-views.mjs` | 失败径补 toast + 新键 `session.renameFailed`（zh/en，沿 `session.openFailed` 同组同形） | eng-coder |
| L7 | #554①② | `src/main/suspension-drive.mjs` · `renderer/views/goal.mjs` ∕ `statusline.mjs` ∕ `mount-cards.mjs` | 端帧补 `interrupted` 键；🎯 补点击面（本地开合，零新通道） | eng-coder |
| L8 | #533 | `src/main/window.mjs`（`buildMenu`）+ 新档 `src/main/menu-words.mjs` | 两项词面 zh/en 双值（`menuLabels(locale)` 纯函数 + `loadConfig()?.locale`） | eng-coder |
| L9 | #563① | `thincoder-render-core/subblocks/block.mjs:53-59` | 监听集补 `scroll`（单源修 ⇒ 三端同收）+ 机检腿一条 | eng-coder |
| L10 | #553 | `thincoder-core/agent/setup-reminders.mjs:40-42` | 端名取 `sessionEnd()`（1 行 + 注释）+ 机检腿一条 | eng-coder |
| L11 | #518② | `docs/vsc/design/WEBVIEW.md:453` | D-W13 括注改「原语入核 · 本端留调用点 ∕ 帧驱动」 | eng-designer |
| L12 | #535（档面 5） | `TUI.md:582` · `ENGINEERING-MODE-V2.md:394`/`:454` · `AGENT-LOOP-UPSTREAM.md:885` · `WEBVIEW-PROTOCOL.md:116` | 坐标逐处收正 | eng-designer |
| L13 | #560（一档）+ #540（非冻结两档） | `docs/core/design/ARCHITECTURE.md` §4 表尾 · `E2E-TESTING.md` · `RENDER-CORE.md` | §4 补 render-core 行（值源 = `RENDER-CORE.md` §10 B ∕ KD-RC-1）；两档悬空逐处重锚 | eng-designer |

**3. 「设计落」方案（逐条定形 · 10 条）**

**3.1 #548 · D24 残留族（判断 + 注位收正）**
- 判决：`.approval-card` 与 `.composer-input` 均判 **死类**——码面零生产（前者全树零命中；后者仅存 `chat-composer.css:6` 退场注释）。
- 活面替代：审批卡 = 核 `.permission-prompt*`；输入框 = 核件面板类（值面单源 = 核 `composer/composer.css`）。
- 注位收正（冻结档）：`PROJECT.md:582`（D24 行）保留面清单三类名换代 + `.rail-row` 残句删（族随 R13-A 退场）；`UI.md` §1 D24 注位（`:241` · `:247-249` · `:251-256` · `:260-261`）逐处实读 —— 标签条三控 ∕ `.rail-control` 句与 `.rail-row` 句随退场删 ∕ 改，坐标按现盘收正。
- 反例面（不复活）：D24 的「保留面负向锁」语义不变——换的是类名引用，非规则。

**3.2 #551 · §4.1 ∕ §4.2 全表重锚（方法 + 数据）**
- 口径：内容行数 = 文件文本 `split('\n').length − 1`（文末换行不计——沿在册口径，实读校验：`i18n.mjs` 473 与档载一致）。
- 结构：行 = 文件 ｜ 值（实读 + as-of 日期）｜ 说明（保留原说明；删批次期语句 ∕ 招标式括注）。
- 退役行处置：`styles.css` ∕ `composer-send.mjs` 两行删除；继任档另立行（`theme.css` 89 ∕ `chrome.css` 444 ∕ `skin.css` 13 ∕ `composer-wire.mjs` 167 ∕ `composer-sync.mjs` 210）。
- 缺行补登 **36 档** = renderer 26（`chat-cards.css` 152 · `chat-fixes.css` 118 · `chrome.css` 444 · `composer-wire.mjs` 167 · `core-markdown.css` 191 · `events-blocks.mjs` 135 · `events-flags.mjs` 48 · `events-slices.mjs` 130 · `events-status.mjs` 87 · `events-wake.mjs` 71 · `i18n-composer.mjs` 92 · `mount-settings-exits.mjs` 274 · `mount-settings-reads.mjs` 189 · `mount-settings-segments.mjs` 233 · `mount-settings-segments-models.mjs` 169 · `skin.css` 13 · `theme.css` 89 · `views/compress-status.mjs` 74 · `views/goal.mjs` 34 · `views/settings-agent.mjs` 120 · `views/settings-controls.mjs` 83 · `views/settings-sections-env.mjs` 134 · `views/settings-sections-mcp.mjs` 126 · `views/settings-sections-models.mjs` 164 · `views/settings-sections-tools.mjs` 154 · `views/statusline-segments.mjs` 198）+ src/main 8（`at-complete.mjs` 74 · `config-watch.mjs` 41 · `exec-run.mjs` 22 · `prompt-injections.mjs` 22 · `session-flags.mjs` 96 · `settings-env.mjs` 138 · `settings-tools.mjs` 79 · `settings-values.mjs` 97）+ **#518 残项两档**（`views/pool-subagents.mjs` 115 · `views/activity-new.mjs` 109）。
- 陈旧值例（重锚靶）：`agent-bridge` 257 ⇒ 333 · `i18n-views` 68 ⇒ 282 · `events.mjs` 497 ⇒ 246 · `mount-settings` 499 ⇒ 151 · `attach` 179 ⇒ 57 · `chat.css` 479 ⇒ 312 · `pool.css` 84 ⇒ 113 · `core.css` 281 ⇒ 287。
- 越 300 段与贴 300 段重写（与 3.4 同源）；§4.2 按批补登（含本批行）。
- 值口径纪律：实施轮**重跑读数**（本表 = 设计轮快照，可能再漂；以实施轮读数为落盘值）。

**3.3 #540 · 存量悬空重锚（映射表 + 验收）**

| 退役锚 | 现盘继任 | 处置 |
|---|---|---|
| `thincoder-desktop/renderer/styles.css` | `theme.css`（变量 ∕ 基座）· `chrome.css`（骨架 ∕ 状态行）· `skin.css`（滚动条 ∕ 焦点） | 31 行重锚（逐处按语义择一；批档既有先例 = `2026-09-28-desktop-flow-vsc-align.md:1186` 已锚 `chrome.css:400-417`） |
| `renderer/views/sessions.mjs` | `views/session-control.mjs`（纯构树）+ `mount-sessions.mjs`（接线） | 18 行重锚（引擎按 basename 唯一性暂放行——仍应重锚） |
| `renderer/views/tabbar.mjs` | 无继任（R13 裁撤） | 删锚 ∕ 标退场（记录面行不动） |
| `renderer/views/info-row.mjs` | `renderer/mount-info.mjs` | 4 行重锚 |
| `renderer/composer-send.mjs` | `composer-wire.mjs`（写面）+ `composer-sync.mjs`（随动） | 9 行重锚 |
| test 三助手（`fake-dom.mjs` ∕ `slot-sandbox.mjs` ∕ `views-harness.mjs`） | 无继任（测试树全清重置） | 删锚 |
| 拟新增列报项 14 条（`context-menu.mjs` ∕ `electron-builder.yml` ∕ `chrome-denoise.css`） | — | 零动（列报 · 不入闸） |

- 验收：桌面相关悬空 66 条 = 可动面 52 + 列报 14；52 条逐条处置（重锚 ∕ 删锚 ∕ 列报三态，零遗漏），`doc-check` 悬空读数净降（实测入 §5）；行宽零净增。

**3.4 #536 · 拆点定形（chrome.css 两拆 + 家族续期）**
- 现读：`chrome.css` **444**（越 300；距 500 硬限 56）。
- 拆点方案（零搬移 ∕ 零规则改）：会话列表条目面 `:155-323`（169 行）⇒ 新档 `renderer/session-list.css`（拟）；本档落 **275**（≤300）；新档 ≈177（≤300）。
- 随动：链序注释（`theme → chrome → session-list → skin → …`）· `renderer/index.html` 链接行 +1 · §4.1/§4.2 行数账同拍（与 #551 同笔）。
- 家族其余 5 档（`i18n.mjs` 473 ∕ `mount-sessions.mjs` 400 ∕ `views/chat.mjs` 365 ∕ `agent-bridge.mjs` 333 ∕ `chat.css` 312）逐档拆点续期在册（消解窗口 = 各自下次被触碰的批）。
- 本批不实施拆分（结构轮 = 真债大件；本批为清账 sweep）——实施归另批或逐档触碰轮。

**3.5 #541 · digest-cap 面（对位 VSC 四层方案）**
- 发射：`suspension-drive.mjs` digest 起止两发射点邻位 —— digest 轮撞帽（ContinueError）⇒ `post("ev:digest", { status:"cap", mode:"stop", turns })`；判定点 = digest 轮执行面（实施轮实读定锚）。
- 归约：`events-wake.mjs` `onDigest` 加 `cap` 支（记 `{ status:"cap", mode, turns }`；`end` 清）。
- 节点：`views/chat-chrome.mjs` `digestGroupNode` 加 cap 行（锚 `data-digest-cap`）。
- 类：`chat.css` 补 `.digest-cap` ∕ `.digest-cap-stop`（值对位 `thincoder-vscode/webview/base.css:237-247`）。
- 词键零新（核 `digest.capAuto` ∕ `digest.capStop` 经 `t()` 投影——与 VSC 同键）。
- 实施 = **另轮**（面新增非一行级；本批只定形）。判据 = 撞帽后流内出现 cap 行（真机）+ 归约臂（批次件）。

**3.6 #543 · 撞帽待答期 ↑Ctrl+I（二择 + 上抛）**
- A（推荐）：携文 ⇒ 入宿主队列（复用 `queued-input` 现机制；消费 = 下一回合）+ 询问判取消 + 回合判 `stopped` —— 与忙态径同律（用户输入零丢失）。
- B：保留现语义（文本丢弃）+ 可见提示（「已取消询问」，文本退回草稿）。
- 未裁 ⇒ 实施轮零行为变更 + 落现状文档句（撞帽待答期 ↑Ctrl+I = 取消 + 消息不入队 ∕ 不落历史）。

**3.7 #560 · 笔权分置**
- `docs/RELEASE.md`（§2 F5 邻位补「render-core 不入发布序列 + 两打包窗前置换核物化」）· `README.md`（Layout 表补行）= **产品文本面 → 主 agent**（上抛）。
- `docs/core/design/ARCHITECTURE.md` §4 表尾补行 = 设计面（本席）——值源 = `RENDER-CORE.md` §10 B ∕ KD-RC-1。
- 两指针（`WEBVIEW.md` ∕ VSC `AGENTS.md`）已有 render-core 命中 ⇒ 零动。

**3.8 #550 · statusText `index` 支登记**
- 保留支（值表零改）+ 登记句：产出方 = 索引族后续自然接点（桌面 `ev:statusText` 现唯一发射 = `agent-bridge.mjs:296-301`，四 kind）。
- 落点 = `IPC.md` §2 `ev:statusText` 注（冻结 gated）；一行级。

**3.9 #538 · 三件处置**
- ① flow 批档「待收 ∕ 在册」句：记录面已收口冻结（`:6` + `:1379`）⇒ **不回改**；处置 = 以设计档侧落定代替勘误，本条核销依据在册。
- ② R13 四拆旧引用（49 行）⇒ 并入 3.3 同 sweep。
- ③ flow §4.2 本批行（部分已落 `:389` ∕ `:485` ∕ `:766`）⇒ 并入 3.2 全表重锚。

**3.10 #563② · 池区 `_poolPin` 评估**
- 三写者（点击 ∕ `scroll` ∕ 世代重置）+ 帧尾写；帧尾写守 `_poolPin === false` 早退 ⇒ 极端窗口可夺回一次上滚 = **有界自纠**（非持续失效）。
- 裁：维持现态 + 登记（`RENDERER.md` ∕ `PROJECT.md` 越层 ∕ 交互注位，冻结 gated）；若真机走查再现夺回 ⇒ 再立小修。

**4. 受影响文件表（实施轮）**

| 文件 | 现读 | 变更 | 归属 |
|---|---|---|---|
| `thincoder-desktop/src/main/window.mjs` | 191 | 菜单词面接线（`buildMenu` 两行 + 引新档） | 本批 |
| `thincoder-desktop/src/main/menu-words.mjs`（拟新增） | — | ≈30（zh/en 常量对 + `menuLabels(locale)` 纯函数；零 electron ⇒ 平 node 直测） | 本批 |
| `thincoder-desktop/renderer/theme.css` | 89 | 1 值 + 1 注释（#534） | 本批 |
| `thincoder-desktop/renderer/chat-composer.css` | 71 | 1 注释（#539） | 本批（让先：复制面对齐批将删同档两族） |
| `thincoder-desktop/renderer/views/chat.mjs` ∕ `views/chat-tool.mjs` ∕ `views/chat-copy.mjs` ∕ `views/settings.mjs` ∕ `renderer/settings.css` | 365 ∕ 217 ∕ — ∕ 296 ∕ 294 | 各 1–2 注释（#539） | 本批 |
| `thincoder-desktop/renderer/i18n.mjs` | 473 | 1 段注释（#544） | 本批（让先：在飞批键面同档） |
| `thincoder-desktop/renderer/i18n-views.mjs` | 282 | +1 键 ×2 语（#556） | 本批 |
| `thincoder-desktop/renderer/mount-sessions.mjs` | 400 | 失败径 toast（#556） | 本批 |
| `thincoder-desktop/renderer/views/statusline-banner.mjs` ∕ `src/main/agent-host.mjs` | 25 ∕ 260 | 1 注释坐标（#535 码面） | 本批 |
| `thincoder-desktop/src/main/suspension-drive.mjs` | 279 | 端帧 +`interrupted`（#554①） | 本批 |
| `thincoder-desktop/renderer/views/goal.mjs` ∕ `views/statusline.mjs` ∕ `mount-cards.mjs` | 34 ∕ 161 ∕ 156 | 🎯 点击面（#554②） | 本批 |
| `thincoder-render-core/subblocks/block.mjs` | — | 监听集 +`scroll`（#563①） | 本批（核面） |
| `thincoder-core/agent/setup-reminders.mjs` | — | 端名取 `sessionEnd()`（#553） | 本批（核面） |
| `thincoder-vscode/src/agent/setup.mjs` ∕ `src/extension/panel-callbacks.mjs` ∕ `panel-subagent-relay.mjs` | — | 五处注释坐标（#555） | 本批 |
| `docs/cli/design/TUI.md` ∕ `docs/core/design/{ENGINEERING-MODE-V2,AGENT-LOOP-UPSTREAM}.md` ∕ `docs/vsc/design/WEBVIEW-PROTOCOL.md` | — | 坐标收正（#535 档面 5 处） | 本批 · eng-designer |
| `docs/vsc/design/WEBVIEW.md` | — | D-W13 括注（#518②） | 本批 · eng-designer |
| `docs/core/design/ARCHITECTURE.md` | — | §4 表尾一行（#560） | 本批 · eng-designer |
| `docs/desktop/design/E2E-TESTING.md` ∕ `docs/render-core/design/RENDER-CORE.md` | — | 悬空重锚（#540 非冻结部分） | 本批 · eng-designer |
| `docs/desktop/design/{PROJECT,UI,SHELL,RENDERER,IPC}.md` | — | #548 注位 · #551 全表 · #550 登记 · #518①③ · #536 越层段 | **gated（解冻后）** · eng-designer |
| `docs/RELEASE.md` ∕ `README.md` | — | 各补一行（#560） | **上抛**（主 agent 笔） |
| `thincoder-core/prompts/persona-normal.md` ∕ `persona-engineering.md` | — | env 行端名枚举 +`desktop`（#553 连带） | **上抛**（主 agent 笔） |
| 批次本地件 `docs/batches/2026-09-29-desktop-residuals-sweep.test.mjs` | — | 机检腿：env 端名 · 监听集 · toast 径 · 归约（如涉） | 本批（写门相抵 = #545 ⇒ 潜行形 `.thincoder/tmp/` 后父侧收位） |

**5. 实施序（本批实施轮）**
0. 前置核：① 冻结五档仍冻结？⇒ 冻结部分仅出「待落清单」（不写、不静默降级）；② 在飞批（复制面对齐 ∕ #561 ∕ #564）窗口——同档者让先。
1. **核面小件**（单源收益，先落）：#553（1 行 + 腿）⇒ #563①（1 文件 + 腿）。
2. **桌面码面一行级**：#534 ⇒ #539 ⇒ #544 ⇒ #535（码面 2）⇒ #555 ⇒ #556。
3. **桌面小件**：#554①② ⇒ #533（词值待上抛核定，未定则落 en 现值 + 结构就位）。
4. **非冻结档面**：#518② ⇒ #535（档面 5）⇒ #560（ARCHITECTURE 一档）⇒ #540（`E2E-TESTING.md` ∕ `RENDER-CORE.md` 两档）。
5. **冻结档面**（解冻后）：#548 ⇒ #550 ⇒ #551（含 #538②③ · #518①③ · #536 越层段）——一笔一 read-back。
6. **收尾**：`node scripts/doc-check.mjs` 复跑（读数入 §5）· 批次件亲跑 · 逐条处置表状态回填（转 §5）。
- 冲突让先句：与在飞批同档者（`chat-composer.css` ∕ `i18n.mjs` ∕ `mount-composer` 邻位）⇒ 待该批实施落定后落（随本批实施轮末笔，不拖过夜）。

**6. 验收对照（回指派单验收 ①–④ + 附加）**

| 派单验收 | 落点 | 判据（机检 ∕ 实读） |
|---|---|---|
| ① 逐条处置表（全 ~21 条零遗漏：id ∕ 状态 ∕ 实读证据 ∕ 修法 ∕ 落点 ∕ 分类） | 第 1 节表（23 行） | 表行数 = 23（台账 #533–#563 区间 20 条 + #518 残项 1 行 + 派单点名归他批 2 条 #537 ∕ #545）；每行六列齐；id 集合 = {533,534,535,536,537,538,539,540,541,543,544,545,546,548,550,551,553,554,555,556,560,563,518} |
| ② 「立即落」清单与「设计落」方案分立 | 第 2 ∕ 3 节 | 立即落 13 行（L1–L13）、设计落 10 条（3.1–3.10）——两表 id 并集 = 处置表 id 集合按「分类」列切分（归他批 3 条 = #537 ∕ #545 ∕ #546 不入两表，理由在册） |
| ③ 受影响文件表 + 实施序 | 第 4 ∕ 5 节 | 文件表 ⊇ 立即落清单全部落点；实施序含前置核 ∕ 让先句 ∕ 收尾读数 |
| ④ §2 落盘 | 本 append 三连 | `batch append` ×3 + 状态行 = 设计完成（read-back 核） |
| 附加 A：本轮零写冻结五档 | — | 冻结五档零 diff（设计轮）；实施轮以解冻为前置（KD-1） |
| 附加 B：doc-check 读数 | — | 实施轮复跑：桌面相关悬空 52 条可动面逐条处置（重锚 ∕ 删锚 ∕ 列报三态）· 行宽零净增（读数入 §5） |

**7. 关键决策（KD）**
- **KD-1 冻结窗 = 硬前置**：五档笔落以解冻（#58 窗）为前置；解冻未至 ⇒ 只落非冻结面 + 逐条列「待落清单」——**不静默降级、不越窗写**。
- **KD-2 #553 取「核行参数化」**：`envStateLine` 端名改取 `sessionEnd()`（单源）；另一择「端自持行」= 第三份副本（VSC 已有一份）⇒ 违单源纪律，不取。
- **KD-3 #548 两死类判「死」**：码面零生产 ⇒ 注列改现值类名（不复活 ∕ 不保留双名）。
- **KD-4 #541 只定形不实施**：面缺（四层）非一行级 ⇒ 方案在册，实施随桌面流面轮。
- **KD-5 #543 二择上抛**：行为定形权 = 用户；未裁 ⇒ 零行为变更（仅落现状文档句）。
- **KD-6 #536 家族续期在册**：拆点方案在册（chrome.css 两拆已定形），本批不实施结构轮（真债大件）。
- **KD-7 #560 笔权分置**：产品文本面（RELEASE ∕ README）= 主 agent；设计面（ARCHITECTURE）= 本席。
- **KD-8 #540 重锚以「现盘继任」为准**：逐处按语义择一（先例 = 批档 `:1186`）；无继任者删锚不硬指。
- **KD-9 记录面不回改**：已收口批档（flow ∕ subblock-follow 等）冻结——#538① 以设计档侧落定代替勘误。
- **KD-10 台账坐标当参考、实读为准**：台账多条坐标已漂（`#548` `:543⇒:582` · `#535` 4 处 · `#518③` `:732⇒:734` · `#546` 引坐标）——本表一律以实现读为准并逐条披露。

**8. 上抛项**
1. **#533 zh 词值**（内容权 = 主 agent）：本批默认提案 —— 两项 zh = 「清理会话数据…」∕「重建会话索引」；组名 `Maintenance` 是否随译待裁（`File ∕ Edit ∕ View ∕ Window` 四组现为系统 role 自带词，拟零动）。
2. **#553 连带**：提示词面两档 `cli|vscode` ⇒ +`desktop`（`thincoder-core/prompts/persona-normal.md:39` ∕ `persona-engineering.md:171`）——笔权 = 主 agent。
3. **#543 语义二择**（A 队列 ∕ B 现状+提示）——用户口径待裁。
4. **#560 两档产品文本面**（`docs/RELEASE.md` ∕ `README.md`）——笔权 = 主 agent（或父侧直落）。
5. **#534 同族观察**（只报，不扩面）：亮色另两槽同低于 4.5:1 —— `--mode-plan` `#0598bc`（**3.18:1**；候选 `#047990` = 4.77:1）· `--warn` `#bf8803`（**2.93:1**，候选待算）。台账裁仅及 advisor ∕ eng；此两槽待裁。
6. **#556 同族观察**（只报）：`deleteSession` 失败径同为仅记错（`mount-sessions.mjs:378-380`）——VSC 对位面有可见面 ⇒ 同族缺口候选（本批不扩面）。
7. **#535 同族连带**（只报，建议同笔）：`UI.md:100` ∕ `:193` 两处短式引文同族陈旧（注意力 chip `:229-230` ⇒ 现读 `:235-236`；键位组 `:427`）——冻结档内，解冻后同笔收正。
8. **#546 ∕ #545 归他批**（理由在册：判据语义面）；**#537** = 用户账（父侧真机走查）。

**9. 范围外（只报不动）**
- `thincoder-desktop/.thincoder/tmp/**` 探针 21 档（含 `repro-input-dead.mjs` 201 · `r1-probe.mjs` 224）——临时件，不入 §4.1 账。
- 全仓悬空 166 中非桌面 100 条（他批面）；桌面相关中 5 条指非桌面路径（如 `PROJECT.md:307` `extension/config-watch.mjs`）随同 sweep 判定。
- 在飞批面零触（复制面对齐 ∕ #561 ∕ #564 ∕ parity B1–B10）。
- VSC 自持行退役（#553 后续，另轮）· `configureExecRun` 等休眠缝（#523，另批）。

**10. 前置核与边界**
- **前置核**：① 冻结五档状态 = 解冻判定（实施轮开工前实读）；② 在飞批同档让先；③ 本设计轮零产品码 ∕ 零冻结档写（实核）。
- **边界（本轮不做）**：拆分实施（#536）· 面新增实施（#541）· 行为变更（#543）· 需求档 ∕ 提示词 ∕ 产品文本笔落（上抛）· 归他批 3 条（#537 ∕ #545 ∕ #546）。
- **量级**：立即落 13 行（其中码面 9 ∕ 档面 4）· 设计落 10 条（其中本批实施 3 条：#548 方案 gated 笔 ∕ #554 两小件 ∕ #553 核一行为另算 L10；纯方案 4 条：#536 ∕ #541 ∕ #543 ∕ 3.10）。

**11. 写后核（D6 read-back）与更正**
- read-back：`append` ×3 + 状态行（设计完成）均已落盘并逐段回读核（表头 ∕ 表体 ∕ 尾段齐）。
- **更正（对本节开头的「§1 仍为模板占位」句）**：本节写入期间父侧补填了 §1.1（来源与口径 · 04:4x）——现读 = 来源（用户 04:39 + 父侧盘账）· 射程（~21 条，含 #518 残项）· 口径（逐条实读 + 三分类 + 五冻结档零写）· 台账 #575，与本设计轮实际执行**逐项一致**；开头那句以本行为准（任务书依据 = §1.1 + 派单 + #575 逐行）。

### 修正轮 1（评审 #73 · §3 轮次 1 · 发现 1–11 逐号处置 · eng-designer · 2026-09-29）

**输入** = 本档 §3 轮次 1（VERDICT: pass · 🔴0 ∕ 🟡5 ∕ 🔵6 = 11 条）+ 父侧逐条裁定（11 条全收——处置执行 = 本舱）；**零新语义**（= 重分类 ∕ 判据句 ∕ 表注补全 ∕ 计数收正 ∕ 口径明示）；产品码 ∕ 测试件 ∕ 核件 ∕ 五冻结档 ∕ §5/§6 ∕ 其它批射程零触。**行数口径** = 内容行数（文末换行不计）；一切值按盘实读 2026-09-29（同一次按盘）；坐标 = 本轮 read-back 实读（并发写者在动——按内容复核）。

**§1 逐号收口表（1–11）**

| 号 | 处置（摘要） | 落点位 |
|---|---|---|
| 1 | §4.1 现盘重读 + 重分类（#551 ∕ #518① = 已由他批消解、核销依据在册；#540 基线复读收正）+ 补行清单 38 档对账（零重复 ∕ 零缺行） | 本节 §2 |
| 2 | AC② 改述 = 并集覆盖 + 交叉列项明列（含按表体补列两处）；原「按分类列切分」句作废 | 本节 §3 |
| 3 | #533 ∕ #554① ∕ #554② 各补判据句（含缺席径）；批次件机检腿清单同拍扩 | 本节 §4 |
| 4 | 六档现读 + 增量形（结构不变 · `≤+N`）+ 两 VSC 越层档续期结论 | 本节 §5 |
| 5 | 让先句补 `window.mjs` ∕ `chat-copy.mjs`（后者改 **撤回注释修**）；两词表关系写明 | 本节 §6 |
| 6 | 触碰口径 = 结构性（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）+ 本批触碰各档显式续期；`chrome.css` 两案以 3.4 案为准 | 本节 §7 |
| 7 | §10 量级句计数收正 = 码面 **10**（L1–L10）∕ 档面 **3**（L11–L13） | 本节 §8 |
| 8 | 冻结档统一为 **五**（§1.2「四」以本登记句为准） | 本节 §8 |
| 9 | 失效句残体卫生项登记（append-only 不可删）；起笔一律现行口径 | 本节 §8 |
| 10 | #543 零行为变更支承载档位点名 = `IPC.md` §2 `msg:send` ∕ `msg:interrupt` 行「挂起窗口头」（gated） | 本节 §8 |
| 11 | doc-map 限制项登记 + 落点复核（维持现落点） | 本节 §8 |

**§2 发现 1 展开 · §4.1 重读 ∕ 重分类 ∕ 对账**

- **现盘重读**：§4.1 = `docs/desktop/design/PROJECT.md:145-270` **126 行**（表头 `:143` · 分隔 `:144` · 末行 = 用例模块行 `:270`）= 88 + 他批「补行 38」——与复制面对齐批修正轮 2 落定逐数相符（同批档 `:140` 全表数值回填 · `:141` 补行 38 = 发现清单 28 + 同族漏登 10 · `PROJECT.md:141` 表头纪律行「新档落盘随批登记」）。
- **对账（38 档逐名 + 防重复行）**：38 档全部在册；**重复行 = 0**（逐行首格路径去重）；值抽验 8 档 = 盘上实读同口径（`chrome.css` **444** · `theme.css` **89** · `skin.css` **13** · `agent-bridge.mjs` **333** · `i18n-views.mjs` **282** · `pool-subagents.mjs` **115** · `activity-new.mjs` **109** · `composer-wire.mjs` **167**）。
- **命中行号逐名**（§4.1）：`chat-cards.css :263` · `chat-fixes.css :264` · `chrome.css :189` · `composer-wire.mjs :248` · `core-markdown.css :265` · `events-blocks.mjs :195` · `events-flags.mjs :199` · `events-slices.mjs :196` · `events-status.mjs :197` · `events-wake.mjs :198` · `i18n-composer.mjs :214` · `mount-settings-exits.mjs :243` · `mount-settings-reads.mjs :242` · `mount-settings-segments.mjs :244` · `mount-settings-segments-models.mjs :245` · `skin.css :190` · `theme.css :188` ·
  `views/compress-status.mjs :261` · `views/goal.mjs :240` · `views/settings-agent.mjs :230` · `views/settings-controls.mjs :231` · `views/settings-sections-env.mjs :232` · `views/settings-sections-mcp.mjs :233` · `views/settings-sections-models.mjs :234` · `views/settings-sections-tools.mjs :235` · `views/statusline-segments.mjs :255` · `src/main/at-complete.mjs :177` · `src/main/config-watch.mjs :181` · `src/main/exec-run.mjs :178` · `src/main/prompt-injections.mjs :179` · `src/main/session-flags.mjs :183` · `src/main/settings-env.mjs :184` · `src/main/settings-tools.mjs :185` · `src/main/settings-values.mjs :180` · `views/pool-subagents.mjs :226` · `views/activity-new.mjs :227` ·
  `questions.mjs :200` · `index-status.mjs :182`。
- **三数对账**（「41 缺行」∕「36 清单」∕「38 补行」）：41 = 设计轮读数（已越）；36 = 设计清单（renderer 26 + `src/main` 8 + #518 两档——含于 38）；38 = 他批补登实数（28 + 10——含 `questions.mjs` ∕ `index-status.mjs` 两档 = 超出设计 36 的差集）；**现盘源码档零缺行**（`package-lock.json` 除外——lockfile 不入册判定；`test/rc-resolve.mjs` = `:269` 行文本内覆盖、无独立行）。
- **分类重定**：#551 = **已由他批消解**（核销依据 = 修正轮 2 三件已落：数值全表回填 ∕ 补行 38 ∕ 越层段按盘重写六档 + 预案 + 消解窗口（`PROJECT.md:275-281`）——「§4.1 全表重锚」不再重复作业；真残余 = §4.2 补本批行，随实施轮）；#518① = **已由他批消解**（两行在册 `:226` ∕ `:227`）；#540 = **仍真（基线复读收正）**（下条）。
- **#540 基线复读**（`node scripts/doc-check.mjs` 复跑 · 本修正轮）：候选 **31929** · 悬空 **158**（闸态）· 行宽 **25** · 拟新增 **31** · 迁移期引文 **230**（列报）。桌面相关 = 悬空 **41 条可动**（`styles.css` 26〔`PROJECT.md` 11 ∕ `UI.md` 11 ∕ `RENDER-CORE.md` 4〕· `composer-send.mjs` 4 · `agent-host-harness.mjs` 4 · `info-row.mjs` 3 · `tabbar.mjs` 2 · `fake-dom.mjs` 1 · `extension/config-watch.mjs` 1〔非桌面路径——他域〕）+ 拟新增列报 **17** + 行宽 **25**（限宽面——非悬空锚）。3.3 验收句按现读收正：**桌悬空 41 ⇒ 0**（拟新增列报除外；行宽零净增另计）；3.3 映射表方法不变、实施轮逐条落。

**§3 发现 2 展开 · AC② 改述（收正句）**

- **②（改述）并集覆盖 + 交叉列项明列**：「立即落」13 行（L1–L13）∪「设计落」10 条（3.1–3.10）覆盖处置表 23 行（归他批 3 条 = `#537` ∕ `#545` ∕ `#546` 不入两表——理由在册）；交叉列项显式在册 = `#540` ∕ `#560`（分类 = 设计落 ∧ L13 落笔）· `#554`（分类 = 设计落 ∧ L7 直落——无独立 3.x 节）· `#553`（分类 = 设计落 ∧ L10）· `#563①`（分类 = 设计落 ∧ L9）· `#518`（单行内分列：②当场落 ∕ ①③设计落）。**补列披露**：交叉实读比评审枚举多两处（`#553` ∕ `#563①`——按表体补列，非新语义）。原句「两表 id 并集 = 处置表 id 集合按『分类』列切分」**作废**（append-only ⇒ 本句 = 收正依据）。

**§4 发现 3 展开 · 三行为变更判据句（含缺席径）**

- **#533（菜单词面）**：机检腿（批次件——`menu-words.mjs` 零 electron ⇒ 平 node 直测）= `menuLabels("zh")` ∕ `menuLabels("en")` 两值 + 未知 ∕ 缺失 locale ⇒ 回落 en；实读 = zh 下维护两项 + 组名词面 = zh 值（值随上抛核定——未裁前键形就位 ∕ en 现值）；**缺席径 = locale = en（或配置缺失）⇒ 词面与现值逐字一致（en 现值零变——回归面）**。
- **#554①（端帧 `interrupted`）**：机检腿（批次件——`suspension-drive.mjs` 零宿主依赖 ⇒ 平 node 直测；注入 `post` 捕获收尾帧）= 中止径帧 `interrupted === true`；**缺席径 = 自然退出径帧 `interrupted === false`（键恒在场 · 布尔形不伪造——单源 = `thincoder-vscode/src/extension/suspension.mjs:477-482` ∕ 协议在册 `docs/vsc/design/WEBVIEW-PROTOCOL.md:95`）**；实读 = 真机中止后收尾帧读数。
- **#554②（🎯 点击开合）**：实读 = 点按 ⇒ 目标卡开合两态可切（零新通道——本地 DOM 态；VSC 同形 = `thincoder-vscode/webview/status-bar.js:74-83` 切 `#goal-panel`）；**缺席径 = 默认显隐按实施轮实读定——现默认显 ⇒ 随 VSC 改默认不显 ∕ 现默认不显 ⇒ 零改（两径实读在册，不静默）**；徽标在场判据（`views/goal.mjs:32-33`）零改。
- **批次件机检腿清单同拍扩**：env 端名 · 监听集 · toast 径 · **菜单词表（两值 + 回落）** · **`ev:susp` 帧 `interrupted`（两径）** · 归约（如涉）。

**§5 发现 4 展开 · 六档现读 + 增量形 + 两 VSC 越层**

| 文件 | 现读（2026-09-29 实读） | 变更形 | 越层处置 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/chat-copy.mjs` | **113** | **撤回**（零触——他批整档删在飞，注释修随删档退场） | — |
| `thincoder-render-core/subblocks/block.mjs` | **69** | 结构不变 · `≤+3`（监听集 +`scroll` 1 行 + 注释） | 未越 |
| `thincoder-core/agent/setup-reminders.mjs` | **255** | 结构不变 · `≤+3`（端名取 `sessionEnd()` 1 行 + 注释） | 未越 |
| `thincoder-vscode/src/agent/setup.mjs` | **428** | 结构不变 · `≤+3`（四坐标注释级） | **续期**——注释坐标级不触发拆分义务（口径 = §7）；消解窗口 = 该档下次结构性触碰的批 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | **316** | 结构不变 · `≤+5`（两处坐标） | **续期**（同上） |
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | **270** | 结构不变 · `≤+3`（一处坐标） | 未越 |

（VSC 两越层档 = 显式续期裁定（不静默）；VSC 域越档在册 = `docs/vsc/design/VSC-DEBT.md` §12——读数补登归其域轮，本批不触。）

**§6 发现 5 展开 · 让先句补 + 两词表关系**

- **让先句补**：`thincoder-desktop/src/main/window.mjs`（L8——复制面对齐批实施面在飞〔同批档 `:68`：191 ⇒ ≈214；`PROJECT.md:150` 已载〕）⇒ **本批 L8 让先——该批实施落定后落**（基线 = 该批后读数；零静默交叉）；`thincoder-desktop/renderer/views/chat-copy.mjs` ⇒ **撤回注释修**（该批 `:59` ∕ `:69` 判整档删——注释修零价值；L2 六处 ⇒ **五处**）。
- **两词表关系（单源声明）**：`src/main/menu-words.mjs`（拟 · 本批）= **应用菜单维护面词表**（两项 zh ∕ en 常量对 + `menuLabels(locale)` 纯函数）｜`src/main/context-menu.mjs`（他批拟）= **右键编辑菜单**两纯函数（`contextMenuLabels(locale)` 经渲染面宿主表四键 `menu.edit.*` 取值）。**分档理由** = ①菜单面不同（应用菜单 ∕ 右键菜单——沿他批「两菜单两事不混」句）②落子批次不同（零互依 ∕ 不互引）③值源形不同（主进程自持常量对〔先例 = `notify.mjs`〕∕ 宿主表词键投影〔先例 = `attachments.mjs:37-41`〕）。**单源** = 维护面词值只住 `menu-words.mjs`、编辑面词值只住 i18n 宿主表——词面零交集；后续若新增第三张主进程菜单词表 ⇒ 合并为单一 owner（预判登记，届批裁定）。
- **附报（零动）**：`PROJECT.md` views/chat.mjs 行（现读 `:216`）「复制面对齐批已删档」表述 vs 盘上在档（113 行）——口径归父侧裁（他批在册）；本批零动。

**§7 发现 6 展开 · 触碰口径 + `chrome.css` 两案**

- **口径裁定（消解窗口之「触碰」）= 结构性触碰**（承担拆分可行性的改动面：增删逻辑 ∕ 搬移段面 ∕ 贴线增厚）；**注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计**（不触发拆分义务——但须显式续期登记，防窗口虚化）。据此：本批触碰档（`i18n.mjs` 1 段注释 · `mount-sessions.mjs` 失败径 toast 行级 · `views/chat.mjs` 注释）+ 核件 `block.mjs` + VSC 两档 ⇒ **显式续期在册**（消解窗口 = 各自下次结构性触碰的批）。
- **在册口径句收正**（「各自下次被触碰的批」⇒「各自下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）」）= `PROJECT.md` `:163` ∕ `:189` ∕ `:275` ∕ `:282`——**冻结 gated**（解冻后随 #536 同笔落——限定词收正，零语义变更）。
- **`chrome.css` 两案** 以 **3.4 案为准**（会话列表条目面 `:155-323` ⇒ 新档 `renderer/session-list.css`；本档落 275 ∕ 新档 ≈177——两档 ≤300 已验）；文档句（`:189` ∕ `:277`）「按面拆档〔会话控制面条段 ∕ 状态行段 ∕ 骨架段——首拆档名实施批定〕」⇒ 收正为 3.4 案（首拆 = 会话列表条目面 · 档名 `session-list.css`）——gated（解冻后同笔）。

**§8 发现 7–11（短条）**

- **7 · §10 计数收正**：「立即落 13 行」按表体 = **码面 10（L1–L10）∕ 档面 3（L11–L13）**；原「码面 9 ∕ 档面 4」作废（本句 = 收正依据）。
- **8 · 冻结档统一**：冻结档 = **五**（`UI.md` ∕ `PROJECT.md` ∕ `SHELL.md` ∕ `RENDERER.md` ∕ `IPC.md`——§1.1 ∕ §2 首节 ∕ §6 附加 A 同值）；§1.2「四冻结档」（本档 `:20`）以五为准（§1 append-only 零回改 ⇒ 本句 = 收正依据；主 agent §4 可注记）。
- **9 · 卫生项登记**：§2 起笔失效句残体（`:28`「§1 仍为模板占位」）六段机制内不可删（append-only）⇒ 登记为卫生项；本修正块起笔 = 现行口径直述（不复述失效句）；后续段落同制。
- **10 · #543 承载档位点名**：零行为变更支的现状文档句承载 = **`IPC.md` §2 `msg:send` ∕ `msg:interrupt` 行「挂起窗口头」段**（`:111`；冻结 gated）——句形：「撞帽待答期 ↑Ctrl+I = 取消询问（`denyGates` ⇒ `(user cancelled)` ⇒ 回合判 `stopped`）+ 所携消息不入队 ∕ 不落历史（现状）」；A 裁定后另轮改述（B 裁定 ⇒ 提示句同落此段）。
- **11 · doc-map 限制登记**：归属判据复检载体在册 = `docs/README.md`（§1 五部分落点表 · §2）→ `docs/core/design/DOC-SYSTEM.md`（落点与归属判据单源）；评审轮上下文未含两档 ⇒ **降级为限制项（登记）**。落点复核 = 本批实读落点（`docs/desktop/design/*` ∕ `docs/render-core/design/*` ∕ `docs/cli/design/TUI.md` ∕ `docs/core/design/*` ∕ `docs/vsc/design/*`）均属既有 owner 档（产品面 ⇒ 产品目录；统一面 ⇒ `core/`）⇒ **维持现落点**（Suggestion 原样）。

**§9 边界与零触声明（本轮）**

- 产品码 ∕ 测试件 ∕ 核件 ∕ §5/§6 ∕ 其它批射程 = **零触**；五冻结档 = **零写**（修正轮 = 登记面；在飞批避让——复制面对齐批面）。
- gated 待落（解冻后随实施轮）：口径句收正（`PROJECT.md` 4 处）· `chrome.css` 案收正（`:189` ∕ `:277`）· #543 承载句（`IPC.md` §2）· #548 注位 · #550 登记 · #518③ · #536 越层段 · #551 残余（§4.2 本批行）。
- 上抛零新增（#533 zh 词值 ∕ #553 连带 ∕ #543 二择 ∕ #560 两档——原案在册、零变更）。

**§10 写后核（D6 read-back · 本修正块）**

- 本修正块 append 落盘（`§2:232-311`）后逐段回读：收口表 11 行齐 ∕ §2 对账清单（38 档命中行号）∕ §3–§9 全段在位、行号引用与现盘一致；关键值写前按盘实读（`PROJECT.md` §4.1 = **126 行** ∕ 抽验 8 档行数 ∕ `doc-check` 汇总 = 悬空 158 ∕ 行宽 25），写后按文本复核一致。
- 状态行同步 = 设计完成（修正轮 1 后）；本轮零产品码 ∕ 零测试件 ∕ 零核件 ∕ 零冻结档写（实核）。

### 波 D（非冻结档面）实施记录 · eng-designer · 2026-09-29

**落位说明**：本波按 §2 实施序第 4 节执行；`batch append §5` 经段白名单拒绝（eng-designer → §2，工具回执逐字在案）——记录落本段代载，父侧可转位 §5。

**交付摘要**：非冻结档面 4 条——`#518②`（`WEBVIEW.md:453` D-W13 括注残句删）· `#535`（档面 5 处坐标「`221-225 ⇒ 227-230`」族）· `#560`（`ARCHITECTURE.md` §4 表尾补 render-core 行）· `#540`（非冻结两档悬空重锚——`E2E-TESTING.md` ∕ `RENDER-CORE.md`）。八档各加变更记录一行。

**逐处改动表**（file:line = 落笔后现盘 as-of 2026-09-29 07:2x）

| # | 落点（file:line） | 变更 | 依据 |
|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW.md:453` | D-W13 括注提核前残句删除（「`activity.js` 持旗标 + wheel/touch 让位 + rAF 帧应用」）——载体句「原语入核 · 本端留调用点 ∕ 帧驱动」已在位（块跟滚批修复轮落）；与 §5.5 ∕ KD-RC-8 自洽 | §2 #518② · L11 |
| 2 | `docs/cli/design/TUI.md:582` | 位置行 `render-frame.mjs:220-224 ⇒ 226-230` | §2 #535 · L12 |
| 3 | `docs/core/design/ENGINEERING-MODE-V2.md:394` | 判据链图 `render-frame.mjs:222,225 ⇒ 228,231` | 同上 |
| 4 | `docs/core/design/ENGINEERING-MODE-V2.md:454` | §2.4 依赖表 M11 行同值收正 | 同上 |
| 5 | `docs/core/design/AGENT-LOOP-UPSTREAM.md:884` | D-SL1 行 `render-frame.mjs:221 ⇒ 227` | 同上 |
| 6 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:116` | §3.3 表 CLI 行 `220-224 ⇒ 226-230` | 同上 |
| 7 | `docs/core/design/ARCHITECTURE.md:131` | §4 表尾补 **render-core** 行（扩展端 / 桌面端共用宿主无关渲染核；**不入发布序列**——`private: true` 永不发布、两端内嵌带发、零 registry 端消费者）；值源 = `RENDER-CORE.md` §10 B ∕ KD-RC-1 | §2 #560 · L13 |
| 8 | `docs/render-core/design/RENDER-CORE.md:23` | `renderer/styles.css` ⇒ `thincoder-desktop/renderer/theme.css`（变量面） | §2 #540 · L13 |
| 9 | `docs/render-core/design/RENDER-CORE.md:218` | 样式契约行同值（主题表 ⇒ `theme.css`） | 同上 |
| 10 | `docs/render-core/design/RENDER-CORE.md:228` | 变量表头同值 | 同上 |
| 11 | `docs/render-core/design/RENDER-CORE.md:275` | 预算行同值（预算数字为落笔期口径——未随四拆回填，列报父侧） | 同上 |
| 12 | `docs/render-core/design/RENDER-CORE.md:284` | `fake-dom.mjs` 全路径锚删（留档名 + 标退场——测试树全清重置） | 同上 |
| 13 | `docs/render-core/design/RENDER-CORE.md:363` | 面板容器皮肤 ⇒ `chrome.css` 的会话控制条原位下拉〔非浮层〕（按语义择一；单源 = `UI.md` §1 R13 后形态） | 同上 |
| 14 | `docs/desktop/design/E2E-TESTING.md:111` | §3.5 步 8 `tabbar.mjs` 出处括注删（R13 裁撤无继任——删锚） | 同上 |
| 15 | `docs/desktop/design/E2E-TESTING.md:261` | 2026-09-28 行 `agent-host-harness.mjs` 加「（迁移期引文——测试档已退场）」标记（列报） | 同上 |
| 16 | 八档变更记录各一行 | `TUI.md:734` · `ENGINEERING-MODE-V2.md:532` · `AGENT-LOOP-UPSTREAM.md:1015` · `WEBVIEW-PROTOCOL.md:507` · `WEBVIEW.md:711` · `ARCHITECTURE.md:217` · `RENDER-CORE.md:420` · `E2E-TESTING.md:268` | 变更轨迹 |

**验证（命令与读数）**

- `node scripts/doc-check.mjs`（仓根 · 复跑）⇒ 候选 32138 · **悬空 225**（前 233，Δ −8）· 注记豁免 107 · 拟新增 30 · **迁移期引文 234**（前 233，+1 = `E2E-TESTING.md:261` 转列报）；行宽 **41**（前 40——+1 = `AGENT-LOOP-ASYNC-POOL.md:576`（327 字符）并发笔迹，非本波；本波触碰行逐行 ≤300，净 Δ0）。
- 逐处 read-back：16 处落点逐条回读在案（工具回执）；新增行宽审计 = 全部 ≤300（含 `E2E-TESTING.md:261` = 297）。
- 未跑仓级套件（文档笔迹——无产品码 ∕ 测试件 ∕ 冻结五档触碰）。

**边界声明**：产品码 ∕ 测试件 ∕ 冻结五档（`PROJECT.md` ∕ `UI.md` ∕ `SHELL.md` ∕ `RENDERER.md` ∕ `IPC.md`）∕ 父侧笔档（`RELEASE.md` ∕ `README.md` ∕ 提示词）∕ 其它批射程 = 零触。

## 设计面清账轮（fix · eng-designer · 2026-09-29）——冻结五档 gated 面落定回执

**授权**：父侧裁决「六项在册全落 + 四项零语义 gated 同笔落；#543 承载句不落（A/B 未裁）」。**改动面 = 纯 doc（零代码）**：`docs/desktop/design/{PROJECT,UI,SHELL,RENDERER,IPC}.md` 五档。

### 一、在册项逐条（号 → 改动）

**① #540 五档余锚全清**（PROJECT.md 26 处 ∕ UI.md 20 处 ∕ SHELL.md 1 处 ∕ RENDERER.md 1 处 ∕ IPC.md 1 处）——法 = live 指针→全路径继任档；历史行→去目录前缀（裸档名不成锚，机制已验证）；退役锚→删。逐档：
- PROJECT.md：`styles.css` 死锚 8 处（:68/:274/:296/:297/:396/:399/:442/:469 → 裸名或改锚 `theme.css`；AL 行 :845 同步）；`composer-send.mjs` 死锚 4 处（:305/:306/:458 + 追加 1）→ 裸名；`chat-copy.mjs` 5 处（:218/:562/:777/:1016 + 追加 :1022）→ 裸名（:218 句改「构树原住」）；`agent-host-harness.mjs` 2 处（:309/:651）→ 裸名；`sessions.mjs`/`tabbar.mjs` 前缀剥离（:324）；`config-watch.mjs` 重锚为 `thincoder-vscode/src/extension/config-watch.mjs`（:350）；`info-row.mjs` → 裸名（:963）。
- UI.md：`styles.css` 族 13 处（:143→theme.css · :144→chrome.css · :231 落点→`chrome.css:17-26` · :232 `.session-head` 底线→`chrome.css:49-53`（`.rail-head`/`.tabbar` 退役锚删）· :233 `.head-field`→`chrome.css:388-390` · :234 两退役控件锚删 · :242/:245 注销坐标 · :248→`skin.css` · :343→`theme.css:19` · :456 `composer-send` 裸名 · :492 `chat-copy` 裸名）+ 追加 :495/:549/:268 清。
- SHELL.md :196 ∕ RENDERER.md :199 ∕ IPC.md :199 同法（裸名 / 重锚）。
**② #535 冻结 5 处 + 同族短式收正**（届盘实读重校）：UI.md :101/:194/:106/:199 + IPC.md :199——`thincoder-cli/src/tui/render-frame.mjs` 坐标：banner `:221-225 ⇒ :227-230`（consts 四行实读）· 注意力 chip `:229-230 ⇒ :235-236` · `buildStatusLine :344 ⇒ :350` · 键位组 `:427 ⇒ :433`（实读 = 尾 return 行）· 状态段簇 `:427 ⇒ :385-433`（构建区）。
**③ #548 类名/残句收正**：`.approval-card ⇒ .permission-prompt`、`.composer-input ⇒ 核件面板输入行 `#input-row``（核件 `composer/composer.css:20-33` 边框真源）+ `.composer-input` 追加两处（UI :268 ∕ PROJECT :451）同清；`.rail-row` 残句删（UI :261 括注 + D24 注 :246 整行 ∪；PROJECT :640 D24 行 `.rail-row 随 R13-A 退场` 句删）。**遗留（出单面）**：UI D21 九面表（:150-158）`.rail-*` 类名族 + 裸坐标族（`:93-102` 等）未收——非锚、零坐标，列报待批。
**④ #550**：`IPC.md` §1 `ev:statusText` 行（:33）载荷格补 **`index` 支保留登记**（零产出方 ∕ 产出方 = 索引族后续自然接点）。注：设计文本记「§2」，实盘 = §1 行（§2 无 statusText 行）——按实盘落 §1。
**⑤ #551 残余 = §4.2 补本批行**（PROJECT.md :603-615 新块「实际落值」9 行：menu-words ∕ window ∕ theme.css ∕ statusline-banner ∕ agent-host ∕ i18n-views ∕ mount-sessions ∕ suspension-drive 邻三 ∕ goal ∕ statusline ∕ mount-cards ∕ chrome.css ∕ VSC 三档 + 核 block.mjs ∕ 测试面 ∕ 设计档行）+ **§4.1 行数账同步**（9 值实读：window 191⇒**223** · chrome.css 444⇒**445** · mount-sessions 400⇒**406** · i18n-views 282⇒**288** · goal 34⇒**63** · mount-cards 156⇒**157** · statusline 161⇒**172** · 越层段 i18n 473⇒**482** ∕ chat.mjs 365⇒**362**；「最大两档」行 482∕445）+ **越层段复读注**收正。
**⑥ #518①③**：① 已在册（pool-subagents **115** ∕ activity-new **109** 两行实读在场）✓ 零改；③ 两句收正——`PROJECT.md:799`「搜索面（暂缓面——KD-RC-5）」句删（R6 已落）· `UI.md:428`「其余浮层族（…搜索…）」剔「搜索」。

### 二、四项零语义（gated 同笔落）
1. **口径句收正**：「下次被触碰的批 ⇒ 下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）」——**现盘实读 21 处全量统一**（修正轮记 4 处；含 3 处行宽触顶行分句断行——零语义）。changelog 内同族 3 处随收（同口径，避免分叉）。
2. **chrome.css 案收正**（:192 ∕ :280）：「按面拆档〔…〕」⇒ **3.4 案**（首拆 = 会话列表条目面 ⇒ 新档 `thincoder-desktop/renderer/session-list.css`（拟新增）——本档落 ≈276 ∕ 新档 ≈177，两档 ≤300 已验 · 零搬移）。
3. **`menu-words.mjs` §4.1 登记**：新行（**30** · 实读 2026-09-29——#533 微单产出）。
4. **#563② 登记**：`RENDERER.md` §3 邻位新条（`_poolPin` 三写者窗口评估——维持现态 ∕ 真机再现夺回再立小修）+ `PROJECT.md` §10 **BY** 行。

### 三、同笔收正（派生自本批落地 ∕ 评审裁定，逐项列报）
- **AL 行（§10）**：死指针 + 状态收正——`styles.css` 拆档**已消解（R13 四拆分产）**，越层余留 = 承继档 `chrome.css`（在册）。
- **RENDERER.md :124** 事件集补 `scroll`（#563① 落地事实——`wheel ∕ touchmove ∕ scroll` 三事件）。
- 追加余锚清（锚扫描后新暴露）：`PROJECT.md:932`（旧全路径 styles.css 去前缀）· `:1022`（chat-copy 去前缀）· `UI.md:76`（输入框行改核件 `#input` 指位）· `:268`/`PROJECT.md:451`（负向锁读数行类名换代）· `:495`（`views/chat-copy.mjs` 去前缀）。

### 四、验收（本波自检 · 机检读数）
- **`node scripts/doc-check.mjs`（thincoder/ 根）**：悬空 **225 ⇒ 133**（全仓）；**冻结五档实悬空 = 0**（余项 = 「拟新增」列报 · 不入闸——沿既有先例：chrome-denoise.css ∕ electron-builder.yml ∕ session-list.css ×2 等）；**行宽 41 ⇒ 41（不增）**。后读数全文存 `.thincoder/tmp/doccheck-after.txt`（前读数 = `doccheck-before.txt`）。
- 读回 = 逐笔 receipt（改动上下文实读）；**零代码改动**（不动 src ∕ test ∕ scripts）。

### 五、待父侧
- **#543 承载句**：不落（按裁决列报）。
- **测试件并入**：现盘三档 = `docs/batches/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs` ∕ `-waveB.test.mjs` ∕ `-533-zh.test.mjs`（候选终位 ∕ 合并 = 父侧处置）。
- **出单面残留（列报）**：UI D21 九面表 `.rail-*` 类名族与裸坐标族；PROJECT 表内「（拟新增）」历史行（context-menu.mjs 等——他批账）。
- **口径句 21 处 > 修正轮记 4 处**——同一零语义口径统一应用，逐处已列；如与父侧账目口径不符请示下。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核验方式**：审阅对象 = 本档 §2（设计轮交付，审阅范围仅本档）。行数口径按在册内容行数（工具读数 − 1，与 §4.1「文末换行不计」同口径）；实读抽验 §2 证据列 8 处锚 + 受影响表 13 处行数，并复算 #534 对比度。未复现（标 unverified）：`node scripts/doc-check.mjs` 读数（166 ∕ 66 ∕ 18）、设计轮「五冻结档零写 ∕ 零产品码」claim（无 git 面可核）、VSC 侧对位坐标（`suspension.mjs:480-482` 等）与三处冻结档注位坐标（`PROJECT.md:582` · `UI.md:241` 等）。

**发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 需求覆盖 ∕ 文档状态 | 🟡 | #551（§2:51 行 16）与 #518①（§2:58 行 23）的证据已被盘上状态超越：现盘 §4.1 表体 = `PROJECT.md:145-270`（126 行），与设计所述「解析 88 行」之差 = 38 = 他批已落「补行 **38**」；`views/pool-subagents.mjs` **115**（`PROJECT.md:226`）∕ `views/activity-new.mjs` **109**（`:227`）两行**已在册**；退役行已换为 `theme.css` 89（`:188`）∕ `chrome.css` 444（`:189`）∕ `skin.css` 13（`:190`）∕ `composer-wire.mjs` 167（`:248`）；设计列为「陈旧」之值现盘已是 333 ∕ 282 ∕ 246 ∕ 151 ∕ 57 ∕ 312 ∕ 113 ∕ 287（`:163` ∕ `:213` ∕ `:194` ∕ `:241` ∕ `:252` ∕ `:191` ∕ `:192` ∕ `:262`）；越层段抬头自载「复制面对齐批修正轮 2 逐档按盘实读；各带拆分预案 + 消解窗口」（`:275-281`）；同源批档已把同组读数 + 补行 38 标「落定」（`2026-09-29-desktop-copy-vsc-align.md:140-141`）⇒ 3.2「§4.1 全表重锚」与 #518① 属重复作业、状态列「仍真」不成立；「41 档缺行」与「缺行补登 36 档」两数亦未对账（含 #518 残项两档口径差） | 以现盘重读 §4.1，把 #551 ∕ #518①（连带 #540 基线）按修正轮 2 之后的状态重新分类、只留真残余，并在逐条处置表登记「已由他批消解」的核销依据；3.2 补行清单与现盘 126 行对账后再落笔（防重复行） |
| 2 | 验收判据 | 🟡 | §6 验收 ②（§2:189）「两表 id 并集 = 处置表 id 集合按『分类』列切分」不成立于现表：#540（分类 = 设计落，§2:43）与 #560（§2:56）同时列在「立即落」L13（§2:76）；#554 分类 = 设计落（§2:53）却无 3.x 节、只出现在 L7（§2:70）；#518 单行内再分「②当场落 ∕ ①③设计落」 | ② 改述为「并集覆盖 + 交叉列项明列」（或把交叉行只留一处），并与 §10 量级句口径同步 |
| 3 | 验收判据 | 🟡 | 三处行为变更无验收载体：#533（菜单 zh/en 词值）、#554①（`ev:susp` 帧补 `interrupted`）、#554②（🎯 点击开合）——批次件机检腿仅列「env 端名 · 监听集 · toast 径 · 归约（如涉）」（§2:172），§6 无对应判据句 | 为三项各补机检腿或实读判据句（含缺席径：en 现值零变 ∕ 帧内键在场 ∕ 开合两态 + 默认显隐按实读定） |
| 4 | 受影响文件表注解 | 🟡 | 六个源码档现读栏为「—」（§2:155 `views/chat-copy.mjs`、§2:162 `subblocks/block.mjs`、§2:163 `setup-reminders.mjs`、§2:164 三 VSC 档）；变更列无 `≤±N` ∕ 「结构不变」形。实读：VSC `setup.mjs` **428** ∕ `panel-callbacks.mjs` **316** ∕ `panel-subagent-relay.mjs` 270，另 `chat-copy.mjs` 113 ∕ `block.mjs` 69 ∕ `setup-reminders.mjs` 255（内容行数）——前两档 **>300 属越层**，设计无其拆分评审结论 | 六档补现读值 + 预期增量（`≤±N` ∕ 「结构不变」）；`setup.mjs` 428 ∕ `panel-callbacks.mjs` 316 两档补越层处置（拆分预案或续期 + 消解窗口） |
| 5 | 范围协调 | 🟡 | 与在飞「复制面对齐批」同档冲突未全部入让先句（§2:182 只列 `chat-composer.css` ∕ `i18n.mjs` ∕ `mount-composer` 邻位）：① `src/main/window.mjs`——该批实施面含本档落子（`2026-09-29-desktop-copy-vsc-align.md:68` 191 ⇒ ≈214；`PROJECT.md:150` 已载），本批 L8 同档改 `buildMenu`；② `renderer/views/chat-copy.mjs`——该批判「整档删」（同批档 `:59` `:69` 113 ⇒ 删档；`PROJECT.md:216`），本批仍在 `:12` 改死指针注释（L2）；③ 新档 `menu-words.mjs`（`menuLabels(locale)`）与该批新档 `context-menu.mjs` 的 `contextMenuLabels(locale)` 为两张并列主进程菜单词表，关系未述 | 让先句补 `window.mjs` 与 `chat-copy.mjs`（或撤回该处注释修，随删档退场）；`menu-words.mjs` 与 `context-menu.mjs` 的词表单源关系（共档 ∕ 分档理由）写明 |
| 6 | 越层窗口一致性 | 🔵 | 在册消解窗口 = 「各自下次被触碰的批」（`PROJECT.md:275`），本批恰触碰 `i18n.mjs` 473（`:276`）∕ `mount-sessions.mjs` 400（`:278`）∕ `views/chat.mjs` 365（`:279`），而 3.4（§2:113）对同五档仍以同一句续期；另 `chrome.css` 两案并存：文档三面拆（`:189` ∕ `:277`）vs 3.4 会话列表条目面拆 `session-list.css`（§2:111） | 明确「注释级触碰是否算触碰」并据此登记（算 ⇒ 续期落为显式裁定；不算 ⇒ 收正文档口径）；`chrome.css` 两案注明以哪案为准（3.4 称同笔重锚，方向已对） |
| 7 | 计数自洽 | 🔵 | §10 量级句「立即落 13 行（其中码面 9 ∕ 档面 4）」（§2:226）与表体不符：L1–L10 = 10 行码面、L11–L13 = 3 行档面 | 按表体收正计数（或改「码面 10 ∕ 档面 3」） |
| 8 | 文档状态 | 🔵 | §1.2「开工前确认**四**冻结档基线」（§2:20）与 §1 ∕ §2 各处「五冻结档（UI ∕ PROJECT ∕ SHELL ∕ RENDERER ∕ IPC）」（`:12` ∕ `:30`）及 §6 附加 A 不一致 | 统一为五档 |
| 9 | 文档卫生 | 🔵 | §2 开头「本记录 §1 仍为模板占位（未填）」（`:28`）为失效句，仅在本节末 `:230` 以「更正」句收正——规范面上留「前句 ⇒ 更正」残体（六段 append-only 不可改行 ⇒ 机制内可接受形，登记为卫生项） | 后续段落起笔处直接以现行口径表述，避免读者先读到失效句 |
| 10 | 清晰性 | 🔵 | #543 未裁时的落点（3.6「落现状文档句」，`:127`）未点明承载档位（A ∕ B 择一路径均有落点，唯「零行为变更」支无） | 点明该句承载档位（如 `IPC.md` `msg:interrupt` 注或 `PROJECT.md` KD-40 邻位） |
| 11 | 文档归属（判据降级说明） | 🔵 | 本仓无 document map 声明（评审上下文亦未提供）⇒ 归属判据按 Project Guide 降级执行；实读落点（`PROJECT.md` §4.1 值表 ∕ §4.2 · `IPC.md` §2 · `UI.md` §1 · `RENDERER.md` · `E2E-TESTING.md` ∕ `RENDER-CORE.md`）均落在既有 owner 档，未见「为既有节新建档」式分片 | 保持现落点；补 document map 后按全判据复检 |

**正向抽查（一致）**：受影响表 13 处行数实读全部与注解一致（`theme.css` 89 ∕ `chrome.css` 444 ∕ `i18n.mjs` 473 ∕ `mount-sessions.mjs` 400 ∕ `views/chat.mjs` 365 ∕ `agent-bridge.mjs` 333 ∕ `chat.css` 312 ∕ `i18n-views.mjs` 282 ∕ `views/settings.mjs` 296 ∕ `settings.css` 294 ∕ `suspension-drive.mjs` 279 ∕ `chat-composer.css` 71 ∕ `window.mjs` 191）；证据锚抽查一致 8 处（`window.mjs:70-73` en-only 维护两项 ✓ · `theme.css:16` `#14ce14` ✓ · `suspension-drive.mjs:80-81` `ev:susp` 帧无 `interrupted` ✓ · `mount-sessions.mjs:353-366` 仅 `console.error` + `:311` `session.openFailed` 先例 ✓ · `i18n.mjs:44-50`「合计 397」残句 ✓ · `chat-tool.mjs:46` 引 `views/sessions.mjs:161` ✓ · `subblocks/block.mjs:53-59` wheel+touchmove（无 `scroll`）✓ · `setup-reminders.mjs:32` 引 `END` 常量 ✓）；#534 数值复算一致（`#14ce14` 对 `--bg` 2.00:1 ∕ 白 2.13:1；`#0a7b0a` 5.13:1 ∕ 5.45:1——WCAG 相对亮度式）；`thincoder-desktop` 全树 grep `.approval-card` 零命中 ∕ `.composer-input` 唯一命中 = `chat-composer.css:6` 退场注释 ✓。

**计数**：🔴 0 · 🟡 5 · 🔵 6（共 11 条）。

**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 批准（父侧代执行 · 2026-09-29 05:0x）

- **依据** = 十批全修令 + 排空授权执行口径（三条件：评审 pass ∧ 修正落地核验 ∧ token 在位）——评审 **#73 pass**（0🔴 · 5🟡 ∕ 6🔵）；修正轮 **#82 落地已核**（11/11 · 零不成立）。
- 修正轮披露**受理**：① 交叉列项补列 2 处（`#553` ∕ `#563①`——按表体）；② `chat-copy.mjs` 注释修**撤回**（他批整档删在飞 ⇒ L2 六处 ⇒ 五处）；③ 三数对账（41 ∕ 36 ∕ 38——差集 = `questions.mjs` ∕ `index-status.mjs`）。
- **§4.1 重读重分类已落**：#551 ∕ #518① = 已由他批消解（核销依据在册）；#540 = 仍真（基线复读：悬空 158 ∕ 桌悬空 41 可动 + 17 列报 + 25 行宽）。
- **实施 = 按 §2 实施序**（立即落 13 + 设计落 10；文档笔落待五档冻结窗解除——gated 清单在 §2:310）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-29 · 波 A ∕ 波 B 均落定（各 7/7 腿绿 · 评审 pass）· #533 微单落值（2/2 腿绿 · 评审 pass）· `window.mjs:6` 陈旧句收正微单（零逻辑改 · 读回 + node --check 过））



### 波 B（跨树码面 · eng-coder · 2026-09-29）

**交付摘要**：① `#563①` 核 `subblocks/block.mjs` `initBlockFollow` 监听集补 `scroll`（单源修——三端同收；沿 VSC `webview/ui.js:217` 三事件先例）+ 档注随改；② `#555` 五处 VSC 注释坐标收正（`agent/setup.mjs` 四坐标 ∕ `extension/panel-callbacks.mjs` 三处 ∕ `extension/panel-subagent-relay.mjs` 一处五档引用）；③ 波 B 机检腿（潜行形 `.thincoder/tmp/2026-09-29-desktop-residuals-sweep-waveB.test.mjs`——7/7 通过；候选终位 = `docs/batches/2026-09-29-desktop-residuals-sweep.test.mjs`，父侧收位时并入）。

**逐处改动表**（file:line = 现盘行号 as-of 2026-09-29 05:5x）

| # | 落点（file:line） | 变更 | 依据 |
|---|---|---|---|
| 1 | `thincoder-render-core/subblocks/block.mjs:60` | 监听集 +`content.addEventListener("scroll", onScroll, { passive: true })`（wheel ∕ touchmove 之后） | §2 处置表 #563① 行 · 沿 `ui.js:217` 三事件先例 |
| 2 | `thincoder-render-core/subblocks/block.mjs:50-53` | 档注随改（三事件监听集 + 出处 `ui.js:217`） | 同上 |
| 3 | `thincoder-vscode/src/agent/setup.mjs:199-200` | 四坐标回写：`subagent.mjs:271` ∕ `:194` ∕ `subagent-spawn.mjs:304` · 读点族 `subagent-async.mjs:291` | §2 #555① · 父侧裁定 (a)（披露①见下） |
| 4 | `thincoder-vscode/src/extension/panel-callbacks.mjs:204` | `dispatch.mjs:441` ⇒ `dispatch-run.mjs:137`（文件错位收正） | §2 #555② |
| 5 | `thincoder-vscode/src/extension/panel-callbacks.mjs:265` | `subagent-spawn.mjs:319` ⇒ `:318` | §2 #555③ |
| 6 | `thincoder-vscode/src/extension/panel-callbacks.mjs:272` | `subagent-spawn.mjs:308-309` ⇒ `:308` | §2 #555④ |
| 7 | `thincoder-vscode/src/extension/panel-subagent-relay.mjs:35-37` | 五档引用收正：`subagent-run.mjs:163` · `subagent-scheduler.mjs:356` · `subagent-async.mjs:281` · `async-settle.mjs:239/273/275` · `agent.mjs:245`（披露②见下） | §2 #555⑤ |

**届盘口径披露（两处与设计轮值不同——均在案）**：

- ① `setup.mjs` 四坐标：设计轮证据「四坐标全漂」之前提已被在飞批 B1-P4-I 推翻（其重写将该四坐标**整组移除**、无裁定）；经父侧裁定 **(a) 按本批设计意图回写届盘值**。四目标值逐处届盘核验：`subagent.mjs:271` = spawn 门 ∕ `:194` = escalate 门 ∕ `subagent-spawn.mjs:304` = 子代权限继承 ∕ `subagent-async.mjs:291` = 读点族。
- ② `agent.mjs` 坐标：设计轮值 242；B1-P4-I 于 `agent.mjs:182` 区 +3 行后，该文件 `⟦ev⟧turn` 发射行届盘 = **245** ⇒ 按 245 落（「坐标届盘重读」纪律；242 现指向注释行）。

**前置核·边界声明**：① 本波射程不含冻结五档（零触）；② `setup.mjs` 在飞批 B1-P4-I 重写已落——届盘重读后在其终态上落笔（非并发）；③ 本波落笔 = 上表四档 + 临时件；桌面树（波 A 域）· 核 `agent/setup-reminders.mjs`（B1 核端名缝小件承接）· 其它批射程 = 零触（核面零写，除 `block.mjs` 一笔）。

**验证（命令与读数）**：

- `node --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-waveB.test.mjs` ⇒ **tests 7 ∕ pass 7 ∕ fail 0**（#563① 监听集动态实调 = `["wheel","touchmove","scroll"]` 顺序 + handler 真接线两态；#555 五处坐标双侧比对全绿）。
- `node --check` 四档全过（ALL-CHECKS-OK）：`block.mjs` ∕ `setup.mjs` ∕ `panel-callbacks.mjs` ∕ `panel-subagent-relay.mjs`。
- 读数（内容行数 · 届盘）：`block.mjs` **71**（本笔 +2）· `setup.mjs` **298**（本笔 +1）· `panel-callbacks.mjs` 316 · `panel-subagent-relay.mjs` 270；目标档 `subagent.mjs` 419 ∕ `subagent-spawn.mjs` 438 ∕ `subagent-async.mjs` 456 ∕ `subagent-run.mjs` 223 ∕ `subagent-scheduler.mjs` 445 ∕ `async-settle.mjs` 299 ∕ `dispatch-run.mjs` 167 ∕ `agent.mjs` 466。
- 未跑仓级套件（repo suite = 发布门，父侧收口一次跑；本波 = 定向机检腿 + 语法门）。

**决策透明表**（决断 — 依据 — 结果）

| # | 决策 | 依据 | 结果 |
|---|---|---|---|
| 1 | ① 按 (a) 回写四坐标（而非记「已由他批消解」零触） | 设计意图未被裁定推翻 + 坐标注释 = 本仓惯例；前提失效已上抛（notify_parent）并获父侧裁定 (a) | 已落（四值届盘核验）；披露 = 原坐标由 B1-P4-I 整组移除（无裁定） |
| 2 | ⑤ `agent.mjs` 用届盘 245（非设计轮 242） | 「坐标届盘重读」纪律；242 已指向注释行而非发射行 | 已落；机检断 245 行携 `⟦ev⟧turn` |
| 3 | `scroll` 加在监听集尾（wheel ∕ touchmove 后） | 沿 `ui.js:217` 三事件序 `["wheel","touchmove","scroll"]` | 已落；机检断全量 + 顺序 |
| 4 | 临时件以波标记名落 `.thincoder/tmp/`（非聚合名） | 防他波同批聚合件命名冲突；父侧收位时并入 | 已落（候选终位在册） |
| 5 | 在飞批交互 = 届盘重读后落笔（`setup.mjs`） | 派单「自动排队串行 · 届盘重读为准」；B1-P4-I 终态核验（删五档 + 重写四档 = 工作树实读） | 已落；本波在其终态上增量，零并发写 |

**审计与评审轮次记录 + fix round 1（本波收敛块 · eng-coder · 2026-09-29）**

- **内部发散审计（explore · 只读 · 轮 1）**：VERDICT = **CLEAN**（5/5 PASS；越界 ∕ 静默简化 ∕ 未披露偏差三类零发现；限制披露 = 审计装配无执行面（未亲跑腿件）· 无 git 语境（零触以 mtime 窗 + 内容实读为证））。
- **内部代码评审（advisor · code · 轮 1 · full）**：**VERDICT: pass**（0🔴 · 🟡3 · 🔵5）。
- **fix round 1**：采纳 🟡2 ∕ 🔵4 ∕ 🔵6（三件，均注释/腿件级；复跑 7/7 不变 + `node --check` POST-FIX-CHECKS-OK）。

**评审响应表（轮 1 发现 → 处置）**

| # | 发现（轮 1） | 处置 | 落位 / 说明 |
|---|---|---|---|
| 1 | 🟡1：既有在册机检腿 `docs/batches/2026-09-28-desktop-subblock-follow.test.mjs:182` 断言监听集精确 = `["wheel","touchmove"]` ⇒ 本波 +`scroll` 后该腿必红；本波原未同拍 ∕ 未披露 | **披露（零收改）** | 该腿属 2026-09-28 批——记录面已冻（KD-9 不回改）；且跨批批档写面按在册 = 写门 fail-closed 拒（#545 实证）⇒ 子代理不可收正。取代判据 = 本波腿 `#563① 监听集` 断言（三事件 + 顺序 + handler 实接线）。收口若复跑该旧腿：预期读数 = 恰一处红（`:182`）= 预期取代，非回归缺陷（.thincoder/tmp/ 同名副本 `:182` 同款） |
| 2 | 🟡2：`panel-subagent-relay.mjs:136` 同族坐标死指针——`agent-tools/subagent.mjs:364` 实读 = 注释行，同形发射在 `:374` | **采纳 · 同笔收正** | `:136` `subagent.mjs:364 ⇒ :374`（一行级；届盘核 = `:374` 行携 `⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`）。越设计五处清单一步（同族坐标收正类），披露在案 |
| 3 | 🟡3：`panel-callbacks.mjs` 316 内容行 > 300（advisory） | **零动作（说明）** | 设计已显式续期（`§2:282` + §7「注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计，不触发拆分义务」）⇒ 依 R3 不升级、不重审该裁定 |
| 4 | 🔵4：`block.mjs:50` ∕ `:63` 「逐字」出处坐标死指针（`activity.js:160-166` ∕ `:171-176` 现指无关代码） | **采纳 · 同笔收正** | 两处改与同档节头（`:48`）同形的**免行号** provenance：`自 VSC \`webview/activity.js\` 逐字搬移`（去死指针、零行数增减；同族卫生项，披露在案） |
| 5 | 🔵5：转口面消费坐标 + 符号集漂移（`panel-callbacks.mjs:33-34` ∕ `panel-subagent-relay.mjs:24`；先于本波） | **报告（清单外）** | 属他批转口迁移遗留（`panel-messages.mjs:28⇒:35` · `suspension.mjs:27⇒:38` 且 `WV_OUTBOX_MAX` 已不在该 import；`panel-messages-turn.mjs:25⇒:24`）；本波不擅动，建议父侧同笔或台账登记 |
| 6 | 🔵6：腿第二例零断言 + 行锚快照脆弱 | **采纳（前半）** | 第二例改 `assert.doesNotThrow(...)`（显式判据）；行锚 as-of 句已在档头（`:9-10`），保留 |
| 7 | 🔵7：「三端同收」claim 精度（消费面实读 = 两端 + 腿件） | **收正句（append）** | `#563①`「三端同收」按消费面实读 = 桌面（`pool-subagents.mjs:29`）∕ VSC（`activity.js:64`）两端 + 本波腿；沿设计行（`§2:57`）措辞，判据面以本句为准 |
| 8 | 🔵8：批档状态漂移（`:281` 记 428 已失标——现读 298；`:282` 括注「两处」实为三处） | **报告 + 本段收正句** | `setup.mjs` 越层续期随 B1-P4-I 重写（298 ≤ 300）**失标**；`panel-callbacks.mjs` #555 坐标处 = **三处**（`:204` ∕ `:265` ∕ `:272`）——append-only，§2 不回改，以本句为准 |

**fix round 1 落位**：`thincoder-render-core/subblocks/block.mjs:50` ∕ `:63`（免行号 provenance）· `thincoder-vscode/src/extension/panel-subagent-relay.mjs:136`（`364⇒374`）· `.thincoder/tmp/2026-09-29-desktop-residuals-sweep-waveB.test.mjs:46`（`assert.doesNotThrow`）。

**fix round 1 复跑读数**：`node --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-waveB.test.mjs` ⇒ **7/7 pass**（不变）；`node --check block.mjs ∕ panel-subagent-relay.mjs` ⇒ POST-FIX-CHECKS-OK；`block.mjs` 内容行 71（免行号改 = 零行数增减）。

### 波 A（桌面码面 · eng-coder · 2026-09-29）

**交付摘要**：本波按 §2 实施序第 2∕3 节落桌面码面 7 条：#534（theme.css 亮色值收正）· #535 码面 2（两处注释坐标）· **#555（五处 VSC 坐标——已由本批波 B 落定，本波零写核验）**· #556（改名失败径 toast + 一键）· #554①（`ev:susp` 出窗帧补 `interrupted`）· #554②（🎯 本地开合——默认合）· #533（`menu-words.mjs` 词表出档 + `window.mjs` 接线；zh 词值上抛未定 ⇒ 落 en 现值 + 结构就位）。批次件（潜行形）= `thincoder-desktop/.thincoder/tmp/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs`（**7/7 通过**；候选终位 = `docs/batches/2026-09-29-desktop-residuals-sweep.test.mjs`，父侧收位时与波 B 件并入）。

**逐处改动表**（file:line = 现盘行号 as-of 2026-09-29 06:0x）

| # | 落点（file:line） | 变更 | 依据 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/theme.css:16` | 亮色 `--mode-advisor: #14ce14 ⇒ #0a7b0a`（同色相暗化：对 `--bg` 2.00:1 ⇒ **5.13:1** ∕ 白底 5.45:1）+ 注释按新出处收正（暗色 `:52` `#23d18b` 零动） | §2 #534 · L1 |
| 2 | `thincoder-desktop/renderer/views/statusline-banner.mjs:5` | 注释坐标 `render-frame.mjs:221-225 ⇒ :227-230` | §2 #535 码面 2 · L4 |
| 3 | `thincoder-desktop/src/main/agent-host.mjs:205` | 同上（判定同源句） | 同上 |
| 4 | `thincoder-desktop/renderer/i18n-views.mjs:78` ∕ `:200` | 两语 +1 键 `session.renameFailed`（en `Could not rename the session (${reason})` ∕ zh `会话改名失败（${reason}）`）+ 组注「二键 ⇒ 三键」+ 档头 ⑤ 组句随改 | §2 #556 · L6（沿 `session.openFailed` 同组同形） |
| 5 | `thincoder-desktop/renderer/mount-sessions.mjs:354-369` | `confirmRename` 失败两径（回执拒 ∕ 抛）各补一次 `showToast(t("session.renameFailed", …))`（零写零收形不变）+ 函数注 ∕ 档头纪律句随改 | 同上（VSC 对位 `panel-messages-session.mjs:96`） |
| 6 | `thincoder-desktop/src/main/suspension-drive.mjs:83-86` | 新出窗帧发射器 `postSuspEnd`（`interrupted` 键恒在场 · 布尔化 `interrupted === true`） | §2 #554① ① |
| 7 | `thincoder-desktop/src/main/suspension-drive.mjs:221` | 出窗帧调用点 `postSusp(…, false) ⇒ postSuspEnd(…, controller.signal.aborted)`（+ 结算注一句） | 同上 |
| 8 | `thincoder-desktop/renderer/events-wake.mjs:23-25` | `onSusp` 载荷注 + 出窗帧 `interrupted` 句（**相邻注释协调**，披露①） | #554① 消费链注 |
| 9 | `thincoder-desktop/renderer/subagent-reduce.mjs:170-173` | `subBlocksFreezeAll` 注「本端出窗载荷无该键 ⇒ 恒零注记」⇒ 今携该键（**相邻注释协调**，披露①） | 同上 |
| 10 | `thincoder-desktop/renderer/views/goal.mjs:21-56` | 本地开合态（`panelOpen` 默认 `false`）+ `goalPanelOpen` ∕ `toggleGoalPanel`（翻态 + 就地施用活卡）+ `goalCardNode(goal, { open })`（非真 ⇒ `hidden`）+ 档头 ②/④ 句随改 | §2 #554② ② · L7 |
| 11 | `thincoder-desktop/renderer/views/statusline.mjs:117-136` | `goalNode` 点击面接线（`role="button"` ∕ `tabindex="0"` + onClick + onKeydown Enter∕Space）+ 注随改 | 同上 |
| 12 | `thincoder-desktop/renderer/mount-cards.mjs:22` ∕ `:102-105` ∕ `:114` | 挂载面传入 `{ open: goalPanelOpen() }` + 注随改 | 同上 |
| 13 | `thincoder-desktop/renderer/chrome.css:441` | `.status-goal` + `cursor: pointer`（**越表一笔**，披露①） | VSC `status-bar.js:24` inline 同形 |
| 14 | `thincoder-desktop/src/main/menu-words.mjs:1-31`（**新档**） | 维护面词表（zh/en 常量对 + `menuLabels(locale)` 纯函数；zh = 未裁前 en 现值；归一沿核 `normalizeLocale`） | §2 #533 · L8 |
| 15 | `thincoder-desktop/src/main/window.mjs:19-22` ∕ `:66-92` | 词表 import + `buildMenu` 词面接线（`loadConfig()?.locale` 现读；读失败 ⇒ en + 记错）+ 档头句 | 同上 |

**届盘口径披露（三处）**：
- ① **越表三笔**：`chrome.css:441`（cursor，+1 属性行）· `events-wake.mjs:25` ∕ `subagent-reduce.mjs:171-173`（各 +1 注释句）——设计 L7 落点四点未列其三；判 = 与设计意图同向（VSC inline `cursor:pointer` 对位 ∕ 该两注直接描述被改的 `ev:susp` 帧、不随改即成失效句），逐笔披露在案（评审轮 1 🟡2 亦点名 cursor 一笔）。
- ② **#554② 默认显隐实读核定**：届盘实读 = 原「非空即显」无开合面（**现默认显**）⇒ 按设计判据句「现默认显 ⇒ 随 VSC 改默认不显」落**默认合**。**附读（只报 · 父侧可一行翻转）**：VSC `webview/panels.js:30-35` 在 goal 消息到达时 `display:block`（HTML 初始 `none`）⇒ VSC 有效默认 = 显；若判「有效默认对齐」优先于设计句面 ⇒ `goal.mjs:22` 初值一行翻转。
- ③ **#533 zh 词值**：§1.2（`:19`）裁「按 en 项语义直译」∥ §2 实施序（`:178`）「未定则落 en 现值 + 结构就位」——两口径相抵；本波按派单明示（落 en 现值 + 结构就位）执行，**上抛（§8 上抛 1 提案两值）仍开**；裁定后 = `menu-words.mjs:21-25` 值级更新（结构 ∕ 接线零改）。

**前置核·边界声明**：① 开工时点冻结五档零写（KD-1）；② 与在飞批同档者（`chat-composer.css` ∕ `i18n.mjs` ∕ `mount-composer` 邻位 ∕ `window.mjs`）届盘重读后落笔——`window.mjs` 在复制面对齐批落定态上增量（`context-menu.mjs` 接线在盘），零并发写；③ 本波落笔 = 上表 15 笔（含新档 1 + 越表 3 + 核验零写 1）；`#539` ∕ `#544` ∕ `#553` ∕ `#563①` ∕ 档面 L11–L13 = 零触（派单外）；**#555 五处 = 波 B 已落，本波零写核验**（十处引文↔目标行实名全 ✓——机检腿 ⑤c）。

**验证（命令与读数）**：
- `cd thincoder-desktop && node --import ./test/rc-resolve.mjs --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs` ⇒ **tests 7 ∕ pass 7 ∕ fail 0**（腿：① 菜单词表两值 + zh-CN ∕ 未知 ∕ 缺失回落；② `ev:susp` 出窗帧两径 `interrupted` true ∕ false + 键恒在场；③ toast 两径 + 词面两语；④ 目标卡开合（默认合 + 点按两态 + 键径 + 徽标判据零改）；⑤a 亮色值 + 对比重算 5.13:1；⑤b #535 坐标双侧 + 目标行实名；⑤c #555 十处引文↔目标行实名）。
- 读数（届盘）：`theme.css:16` = `#0a7b0a` ∕ `:52` = `#23d18b`（零动）；`render-frame.mjs:227-230` = 四 banner 行（逐行含 `Banner = `）· `:231` = `bannerPrefix`；#555 十处全 ✓（`subagent.mjs:271/194` · `subagent-spawn.mjs:304/318/308` · `subagent-async.mjs:291/281` · `dispatch-run.mjs:137` · `subagent-run.mjs:163` · `subagent-scheduler.mjs:356` · `async-settle.mjs:239/273/275` · `agent.mjs:245`）。
- `cd thincoder-desktop && npm test` ⇒ 空清单绿（2026-09-28 全清重置；测试树零档，非本波面）。
- `node scripts/doc-check.mjs`（仓根 · 波 A 时点复跑读数）⇒ 候选 **32022** · 悬空 **223** · 注记豁免 107 · 拟新增 30 · 迁移期引文 233；行宽 **37** 行（含在飞批面；本波零文档面 ⇒ 净增判据不适用本波，终读数以父侧收口为准）。
- 全档 `node --check` 过（含新档 `menu-words.mjs` ∕ 批次件）。
- 未跑仓级套件（repo suite = 发布门 · 父侧收口一次跑；本波 = 定向机检腿 + 语法门）。

**决策透明表**（决断 — 依据 — 结果）

| # | 决策 | 依据 | 结果 |
|---|---|---|---|
| 1 | #554② 落「默认合」 | 实读 = 现默认显（非空即挂、零开合面）⇒ 设计判据句「现默认显 ⇒ 随 VSC 改默认不显」 | 已落；`hidden` 载体（`.goal-card` 无 `display` 规则 ⇒ UA `[hidden]` 生效）；VSC 有效默认附读见披露② |
| 2 | `interrupted` 布尔化 + 键恒在场（非仅真值才携） | VSC `postSuspensionEnd` 同形（`interrupted === true`）+ 设计判据句「键恒在场 · 布尔形不伪造」 | 已落；两径腿断 true ∕ false |
| 3 | toast 两径（回执拒 ∕ 抛）皆补 | 沿 `openResult` 先例（三失败面）与设计 L6 句 | 已落；腿断两径文本 |
| 4 | #533 zh 落 en 现值 + 结构就位（非直译） | 派单明示「上抛未定 ⇒ 落 en 现值 + 结构就位」；§2 实施序同句 | 已落；与 §1.2 口径相抵 = 披露③（上抛仍开，待裁） |
| 5 | 相邻注释随改 2 处 + cursor 1 笔（越表） | 不随改即成失效句 ∕ VSC inline 对位 | 已落（最小句级 ∕ 单行）；披露① |
| 6 | 批次件用波标记名（`…-wave-a.test.mjs`） | 沿波 B 先例（防父侧收位命名冲突） | 已落；候选终位在册 |

**审计与评审轮次记录 + fix round（本波收敛块 · eng-coder · 2026-09-29）**

- **内部发散审计（explore · 只读 · 轮 1）**：VERDICT = **DEVIATIONS**（7 项验收 6 项符合；1 项 = §5 载体缺〔本轮写前时点，本段即补〕；另 2 项文档侧挂账：`menu-words.mjs` §4.1 登记〔冻结 gated〕· 设计侧引 `suspension.mjs:477-482` 不成立〔实读 `:112-116`，只报不改〕）。**代码面零偏差**（无静默降级 ∕ 无注释不符 ∕ 无未披露越界）。
- **内部代码评审（advisor · code · 轮 1 · full）**：**VERDICT: pass**（0🔴 · 🟡4 · 🔵4）。
- **fix round 1**：**零收改**（无 must-fix 项；🟡4 全为「报告 ∕ 登记」类——本段执行；🔵4 全为非阻塞建议 ∕ 登记）。件复跑 **7/7 不变**。

**评审响应表（轮 1 发现 → 处置）**

| # | 发现（轮 1） | 处置 | 落位 / 说明 |
|---|---|---|---|
| 1 | 🟡1：#533 可见面未闭合 + 档内两口径相抵（§1.2 vs §2） | **上抛（父侧裁）** | 见披露③；裁定后值级更新（`menu-words.mjs:21-25`），本波按派单落 en 现值 |
| 2 | 🟡2：`chrome.css:441` 越表一笔未披露 | **披露（零收改）** | 见披露①；§4.1 登记随解冻轮（#551 ∕ #540 口径） |
| 3 | 🟡3：#556 增键 ⇒ `i18n.mjs:49` 键数链落后 1（届盘实读 VIEWS_DICT **107** vs 链句 106） | **登记（零收改）** | 链承接项 = #544（本波排除面）；#544 落笔时按届盘续链（口径 = 合并表）。本波不动 `i18n.mjs`（在飞批让先） |
| 4 | 🟡4：本波触碰两档越 300（`mount-sessions.mjs` 404 行 ∕ `chrome.css` >300） | **零动作（说明）** | 两档已在册续期（#536；§2 修正轮 §7 口径 = 行级 ∕ 注释级不计结构性触碰）⇒ 依 R3 不升级、不重审 |
| 5 | 🔵5：🎯 键盘可达（role/tabindex/Enter/Space）但无 `:focus-visible` 三值 | **登记（零收改）** | 同族可点节点皆落三值（`chrome.css:115/171/259/318/372` 等）；建议随下次触碰（或 #539 同笔）补——本波不扩面 |
| 6 | 🔵6：应用菜单 locale 为创建时一次性（切语言不随动）∥ 同档右键菜单每弹现读 | **登记（零收改）** | 沿设计 L8「locale 取 `loadConfig()?.locale`」（无随动要求）；差异登记待裁 |
| 7 | 🔵7：新档 `menu-words.mjs` 未入 §4.1（冻结 gated） | **登记** | 解冻后随 #536 ∕ #548 同笔补行；本波零改 |
| 8 | 🔵8：批次件腿 ① 把「zh 未裁 ⇒ en 现值」写死 | **登记（零收改）** | zh 词值裁定并落盘后该腿须同拍改述（防绿转红）——随发现 1 同步 |

**限制披露**：① 审计 ∕ 评审两舱的引用机械核验块报「引文无法比对（路径形态）」——相关事实已由本波亲读 + 批次件断言双向复核（见上「验证」节），引文以本波实读为准；② 真机走查面（#537）归父侧冒烟纪律，不在本波；③ §5 段骨架无「**状态行**」行位（波 B 先例同）——本波未写该行；如需设位请父侧裁。

**评审轮 2（fix-claim 验证）· fix round 2 · 终态（本波收敛块 · eng-coder · 2026-09-29）**

- **advisor 代码评审（轮 2 · fix-claim 验证）**：**VERDICT: pass**。fix round 1 四条声明逐条实读验证全落地：① `panel-subagent-relay.mjs:136` `:364 ⇒ :374`（目标行携 `⟦ev⟧stopped\x1e0\x1e0\x1estopped\x1e`）；② `block.mjs:50` ∕ `:63` 免行号 provenance（与同档 `:48` 同形；死指针串零出现）；③ 腿 `:46` 显式 `assert.doesNotThrow`；④ 披露句 ∕ 零动作说明（响应表在册）且事实正确（旧腿双副本 `:182` 逐字同、「恰一处红」成立）。轮 1 八项逐项三态（Fixed ∕ Recorded ∕ Disposed），零未决 must-fix。
- **轮 2 新增 🔵（同族死指针余项 · 报告项）**：`block.mjs:2` ∕ `:39` 出处坐标 `activity.js:75-115` ∕ `streaming.js:244`（`subagentChunk:244`）仍为带行号死指针（本波实读自证：`activity.js` 现无 `buildBlock` 符号（`buildBlock\b` 零命中）、`:75` 落 `applyEffects` 体内；`streaming.js` 正文止于 `:182`、`subagentChunk` 定义于 `:169`）。advisor 路由 = 「父侧同笔或台账登记」。
- **fix round 2（同笔承接 · 披露在案）**：本波按同族口径承接『同笔』项——`block.mjs:2-3` ∕ `:39` 改与 `:48/:50/:63` 同形的免行号 provenance（`自 VSC \`webview/activity.js\` \`buildBlock\` 的 DOM 面` ∕ `自 VSC \`webview/streaming.js\` \`subagentChunk\` 的块侧两面`）；注释级 · 零行数增减 · 未再起第三轮（若父侧判属台账项可另裁）。
- **fix round 2 复跑读数**：`node --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-waveB.test.mjs` ⇒ **7/7 pass**（不变）；`node --check subblocks/block.mjs` ⇒ OK；死指针串 `activity.js:\d` ∕ `streaming.js:\d` ∕ `subagentChunk:\d` 全文 grep = 零命中；`block.mjs` 内容行 71（不变）。
- **终态：clean**——本波未决 must-fix = 0；未决面 = 报告项 1（🔵5 转口面漂移——他批遗留，建议同笔 ∕ 台账）+ 限制项 2（测试执行读数 = 本波自跑、评审面只读未复现；评审面外档未复读——依赖轮 1 读数）。审计（explore 轮 1 · CLEAN）+ 代码评审（advisor 轮 1 ∕ 轮 2 · 均 pass）+ fix round 1 ∕ 2 全数落纸。

### #533 zh 值级更新微单（波 A 残余落值 · eng-coder · 2026-09-29）

**交付摘要**：① `menu-words.mjs` zh 表三值按 §1.x 波 A 裁定（`:22-24`）逐字落值——`maintenance: "维护"` ∕ `cleanUp: "清理会话数据…"` ∕ `rebuildIndex: "重建会话索引"`（提案逐字；组名随译 = 是）；② 档头 `:8-10`「上抛未定」段收正为已裁句（`:8-9`，三行 ⇒ 两行）；③ 波 A 件腿①（`…-wave-a.test.mjs:103-115`）同拍改述（防绿转红；依据 = §5 波 A fix round 响应表第 8 项登记句 `:504`）；④ 本单验证件 `…-533-zh.test.mjs`（新档 · 潜行形 · 2/2 绿）。**en 表 ∕ 结构 ∕ `normalizeLocale` 归一 ∕ en 回落 = 零动**（实读核）。

**逐处改动表**（file:line = 现盘行号 as-of 2026-09-29 06:2x；桌面树前缀 `thincoder-desktop/`）

| # | 落点（file:line） | 变更 | 依据 |
|---|---|---|---|
| 1 | `src/main/menu-words.mjs:21-23` | zh 三值落位（提案逐字；组名随译） | §1.x 波 A 裁定（`:22-24`） |
| 2 | `src/main/menu-words.mjs:8-9` | 档头「上抛未定」段 ⇒ 已裁句：裁定要点 + 值级更新已落（结构 ∕ 接线零改）+ en 回归面保留 | 同上 |
| 3 | `src/main/menu-words.mjs:13` | WORDS 直述句随改（「zh = 未裁前同 en」⇒「zh = 语义直译值（#533 裁定）」）——同步失效句随改（披露①） | #2 派生（不随改即成失效句） |
| 4 | `src/main/menu-words.mjs:9` | 评审轮 1 🔵4 采纳：「四组」措辞按消费面实读收正（组名 = `window.mjs` 字面 ∕ 组内条目 = 系统 role） | fix round 1 |
| 5 | `.thincoder/tmp/2026-09-29-desktop-residuals-sweep-533-zh.test.mjs`（新档） | 本单验证件：`zh-CN` 归一命中 zh 三值 ∕ `fr` ∕ 空 ∕ 缺失 ⇒ en 回落 ∕ en 表逐字对拍；档头含运行命令行（评审轮 1 🔵3 采纳） | 派单 ② |
| 6 | `.thincoder/tmp/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs:104-115` | 波 A 件腿①同拍改述：zh 断言 ⇒ zh 值命中 + 标题 ∕ 注释 ∕ 读数句随改 + 补「空 ⇒ en」一行（防绿转红） | §5 波 A 🔵8（`:504`）登记句 |

**验证（命令与读数）**

- `node --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-533-zh.test.mjs`（cwd = `thincoder-desktop`）⇒ **tests 2 ∕ pass 2 ∕ fail 0**；读数 = `menuLabels("zh-CN")` → `{"maintenance":"维护","cleanUp":"清理会话数据…","rebuildIndex":"重建会话索引"}`；`fr` ∕ 空 ∕ 缺失 ∕ `en` 全 → en 现值。
- `node --import ./test/rc-resolve.mjs --test .thincoder/tmp/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs` ⇒ **7/7**（改述前基线亦 7/7）。
- `node --check` × 3（`menu-words.mjs` ∕ 两测试件）全过。
- 未跑仓级套件（repo suite = 发布门 · 父侧收口一次跑）。

**审计与评审轮次 + 终态**

- 内部发散审计（explore · 只读 · 轮 1）：**CLEAN**（越界 ∕ 静默简化 ∕ 未披露偏差三类零发现；观察项 3 条转父侧 ∕ 收口面）。
- 内部代码评审（advisor · code · 轮 1）：**pass**（0🔴 · 🟡1 · 🔵3）。
- fix round 1：采纳 🔵3（补运行命令行）· 🔵4（四组措辞收正）——两笔注释级；复跑 2/2 ∕ 7/7 不变。
- 评审轮 2（fix-claim 验证）：**pass**（两条 fix 声明逐字核到落点；🟡1 ∕ 🔵2 = 收口面登记项）。
- **终态：clean**（未决 must-fix = 0；开放登记 2 条均属父侧收口面：§5 波 A 段承接句 ∕ 批档坐标漂移收正）。

**决策透明表**（决断 — 依据 — 结果）

| # | 决策 | 依据 | 结果 |
|---|---|---|---|
| 1 | 波 A 件腿①同拍改述（越单一笔，披露） | §5 波 A 🔵8 `:504`：「zh 词值裁定并落盘后该腿须同拍改述（防绿转红）」 | 已落；7/7 绿 |
| 2 | `:13` 直述句随改（越单一笔，披露） | 不随改即成失效句（zh 落值后「未裁前同 en」为假） | 已落 |
| 3 | 临时件独立命名（`…-533-zh.test.mjs`） | 沿波 A ∕ 波 B 潜行形先例；父侧收位并入批次件 | 已落 |
| 4 | `window.mjs:6` 失效句零写（列报） | 派单禁止名单（消费面）；同族失效句，建议父侧另笔一行收正 | 列报在案（本段 ∕ 交付报告） |

### 微单 · `window.mjs:6` 陈旧句收正（#533 连带 · eng-coder · 2026-09-29）

**交付摘要**：`src/main/window.mjs:6` 档头陈旧句一行收正（零逻辑改）——原句「`menuLabels(locale)` 消费，zh 词值上抛未定 ⇒ 未裁前 en 现值」已失实（zh 直译值已裁定并落 `menu-words.mjs:21-23`）⇒ 收正为「`menuLabels(locale)` 消费——zh = 语义直译值（#533 裁定）；en 表 = 回归面现值」。

**改动表**（file:line = 现盘行号 as-of 2026-09-29 06:3x；桌面树前缀 = `thincoder-desktop/`）

| # | 落点（file:line） | 变更 | 依据 |
|---|---|---|---|
| 1 | `src/main/window.mjs:6` | 档头注释一行收正（行前缀 ` * ——#533：` ∕ 尾符 `）` 保留；其余行零动） | 批次档 §1.z「`window.mjs:6` 陈旧句 = 微单在办（零逻辑改）」· 派单 |

**验证（命令与读数）**

- 读回（D6）：`:6` 现文逐字 = 「 * ——#533：`menuLabels(locale)` 消费——zh = 语义直译值（#533 裁定）；en 表 = 回归面现值）」。
- `node --check src/main/window.mjs` ⇒ 零输出（通过）。
- 边界：其余行 ∕ 其余档 ∕ 其它批射程零触（单行替换——工具回执「replaced 1 line(s) at L6」）。

**审计与评审轮次 + fix round · 终态（微单 · `window.mjs:6` 收正 · eng-coder · 2026-09-29）**

- **内部发散审计（explore · 只读 · 轮 1）**：VERDICT = **CLEAN** —— 逐项 3/3 PASS（① 收正句落位逐字一致；② `node --check` 过；③ §5 微单块在册）；三类偏差（越界 ∕ 静默简化 ∕ 未披露偏差）零发现；盘上事实对照（`menu-words.mjs:8-9` ∕ `:20-23`）双向一致。
- **内部代码评审（advisor · code · 轮 1）**：**pass**（无 must-fix）——残余 🔵 两条：㈠ `:6` 头部可读性建议（零事实影响）；㈡ 批次档 §5 状态行未含本微单（报告项）。另附：范围外备注（`PROJECT.md:881` ∕ `confirmRecycle` en-only——别账）+ 限制项（只读面未复现 `node --check` ∕ 无 git 面）+ host 引用机械核验块 1 处不符（`menu-words.mjs:8` 引文）——亲读复核 = 该行现文与所称事实一致（仅差 comment 前缀），系引用形态 artifact。
- **fix round 1**：㈡ 采纳——§5 状态行同步（已落；本节笔权面）；㈠ 零收改——目标句 = 任务书逐字规定，收改即偏离（保留原文；父侧可另裁）。
- **评审轮 2（fix-claim 验证）**：三条 fix 声明逐条核到落点——① §5 状态行已含本微单；② §5 微单块在位；③ `window.mjs:6` 终态零漂移（与 D6 读回句逐字一致）；未出 must-fix。
- **终态：clean**（未决 must-fix = 0；其余开放项均属可选 ∕ 报告 ∕ 限制类，见上）。

## §6 验证与收口（父代理）

**收口记录（父代理 · 2026-09-29）**

**收口读数（父侧亲跑 · 冻结版）**：
- 批内件终位三腿（`docs/batches/2026-09-29-desktop-residuals-sweep-{wave-a,waveB,533-zh}.test.mjs`）= **16/16 pass**（533-zh 2 ∕ wave-a 7 ∕ waveB 7；父侧亲跑；相对路径按终位深度收正 = 父侧直执行 · 可 revert）。
- doc-check 终读数 = 悬空 **133**（本批三方波合计：波 D 233⇒225 · 清账轮 225⇒148 · 五档收尾 148⇒133；**五档实悬空 38 ⇒ 0**）· 行宽 41（不增）。
- 波 A ∕ B ∕ D 读数各 §5 段在册（机检腿 7/7 ∕ 7/7；终态 clean）。

**波面（全落）**：波 A（桌面码面 15 笔）· 波 B（跨树 9 笔）· 波 D（档面 8 处）· 清账轮（#540 五档余锚 38⇒0 + #535 冻结 5 + #548/#550/#551/#518①③ + 零语义四项：口径句 21 ∕ chrome.css 案 ∕ menu-words 登记 ∕ #563②）· 批内件三腿归位（合并件形态按父侧裁决改三腿——20 槽 designId 映射暂不可得，后续如需合并件再开轮）。

**结算面（D7）**：#575（伞条目）→ **已核销**（覆盖族逐条处置在册）；余量另册：**#543**（承载句——A ∕ B 未裁·另轮）· **#536 ∕ #541 ∕ #544 ∕ #546 ∕ #560** 等（归下一桌面轮在册）。
**真机面（父侧义务 · D16）**：桌面全族走查 = 汇总行（#592）同席。
**状态行**：已收口 2026-09-29。
