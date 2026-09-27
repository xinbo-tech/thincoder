# 2026-09-27 · render-core R2（核构件层 + VSC 换接）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 设计批 `docs/batches/2026-09-27-desktop-ui-alignment.md`（§4 已批准）· R1 已收口（`86cb4cb3`）——R2 = 核构件层（`flow/cards/subblocks`）+ VSC 换接；任务面 = `docs/render-core/design/RENDER-CORE.md` §8 R2 行。
> 台账 = #466–#468（归批 · 在途）。前情 = R1 批 `docs/batches/2026-09-27-render-core-r1.md`（已收口 2026-09-27 · 提交 `86cb4cb3`）——R2 = 核构件层 + VSC 换接。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27

### 1.1 本批口径（父侧 · 2026-09-27 22:4x ✓）

- **来源** ✓：设计批 `2026-09-27-desktop-ui-alignment.md` §4 已批准；R1 已收口（`86cb4cb3`——前情 = R1 档，已收口 2026-09-27）；本批 = **R2**（核构件层 + VSC 换接）——任务面 = `docs/render-core/design/RENDER-CORE.md` §8 R2 行。
- **拆舱**：**R2a**（核包构件层：`flow/cards/subblocks` + 三核档迁核〔activity-view / toast / tool-card-restore〕+ 核用例 + `prepublishOnly` 一行清）→ **R2b**（VSC 换接：八拆档 + 三核档 shim / 删 + DOM 用例宿主；dependsOn a）。
- **先行关系**（设计 §8）：R2 与 R3a 可并行（核包 / VSC ∥ 桌面）；先行于 R3b / R3c（核件依赖）。
- **边界**：CLI / 桌面零触碰 · `renderer/**`（R3 面）零触碰 · 需求档零触碰。
- **并行面**：设计面微轮（#8 · R1 结算随收）在跑——文件面 = 设计档，与本批零交叠。

### 1.2 随动账（父侧 · 2026-09-27 22:5x）

来源 = R1 结算微轮（#8 · 8/8 落）报告 F1–F5——**随 R2 结算收**：

- **F1 锚歧义**：R2a 在飞新建核包 `flow/tool-card-restore.mjs` 与 `thincoder-vscode/webview/tool-card-restore.mjs` 同名 ⇒ 三处 basename 锚悬空（`docs/render-core/design/RENDER-CORE.md:29`/`:67` · `docs/vsc/requirements/WEBVIEW.md:69`）——RENDER-CORE 两处改全路径消歧；requirements 处 = 父侧笔。
- **F2**：`RENDER-CORE.md:144`（§4 行 2）`highlight.js:165` 自 R1 删档起悬空 ⇒ 改 `highlight.mjs:165` ∥ 加迁移注。
- **F3**：`docs/desktop/design/PROJECT.md:107/:108` 说明列未注 R1 功能面（window 探针表 5→8 · protocol 双根）——可选收，随结算裁。
- **F4**：`PROJECT-MANIFEST.json` `docRoot.design` 缺 `docs/render-core/design` ⇒ **父侧已收**（直接执行〔例外②③〕 · 可 revert）。
- **F5**：微轮未写批档 §2（其登记 = R1 档 §6.2）——无需另笔。

### 1.3 R2a 核验 + 随动账（父侧 · 2026-09-27 23:0x ✓）

- **父侧亲跑**：核包 **92/92 · fail 0**（R1 54 + 新增 38）· 逐字性机械复核 = `toast.mjs` 字节全同 · `activity-view.mjs` 恰 1 处（`:10` import 行）· `tool-card-restore.mjs` 恰 3 处（`:12-14` 引用行）——与舱报逐值一致；`git status` 实核 = 本舱写入面全在 `thincoder-render-core/**`（VSC / 桌面 / CLI 三树零触碰 ✓）。
- **设计面随动（R2 结算随收）**：① `RENDER-CORE.md` §5 token→patch 表补 `role, id` + `isRelayToken` 消费判据；② §5 导出面按实件回填（`relayEventToSubPatch(token, scope, deps)` · `ensureSubBlock` · `subBlocksFreezeAll` · 判据族 `channel.mjs` · `showToast` / `linkifyPaths` / `renderGoalPanel`）；③ relay 文法**零依赖副本**登记（权威 = `thincoder-core/agent/relay-prefix.mjs`，两份逐字同构）+ **跨包对拍锁**取舍（R2b ∥ 结算裁——落点 = VSC `test/**` ∥ 核包 test）。
- **登记项**：`subblocks/state.mjs` **330 行**（>300 软线 · <500 硬限）——沿用既登记形；不拆（R2b 依赖其件头执行序约定）。
- **R2b 入口要点**（已向舱 b 传递）：接线契约以**实件**为准（`state.mjs` 件头「执行序约定」= 按序逐条 · `key → DOM` 即时解析）；`connectedOf` / `regionOf` 必注入（DOM 事实在端）。

### 1.4 queued-mark 语义差裁（父侧 · 2026-09-27 23:1x ✓）

- **舱 b 停报**（消费缺口）：核 `flow/queued-mark.mjs` `planBusyQueued` 对「多批残项」形（T-V16-13 同形）输出 `remove:[0,1,2] ∧ mark:[2]` ⇒ 剩余排队项 `c` 从视图消失（源档行为 = `c` 保持 ⏳）——**R2a 披露的「合并批前态快照面理论差 · 生产不可达」经实证为误**（可达链 = `panel-turn-stages.mjs:228-232` / `suspension.mjs:288-294` / `:417-421`；T-V16-13 现红）。
- **裁**：授权舱 b **直修核该一处**（选项 ①）——判据 = 与源档（`git show HEAD` 原迁移前档）**语义等价** + 核包用例补拍 + 双套件复跑（T-V16-13 转绿）；端补丁（②）**否决**（违单源）；另起舱（③）不必。
- **随动**：修正后随 R2 结算（核包写面披露 + R2a 披露勘误登记）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（R2 结算随收 · 设计 / 文档面收正微轮（逐条落笔 · 点修）；doc-check 悬空 53⇒48（新增 0）· 行宽 34⇒34（新增 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本微轮口径（R2 结算随收 · 设计 / 文档面收正微轮 · 父侧裁定）

- **来源**：R2 批（本档）§5.7 / §5.11 上抛的设计 / 文档面随动项 + §1.2 随动账（F1 / F2）——父侧逐条裁定，本舱 = 逐条落笔（点修；不触发重评）。
- **边界**：实现码（核包 / VSC / 桌面 / CLI）零触碰 · 需求档零触碰（含 `docs/vsc/requirements/WEBVIEW.md:69`——父侧笔）· 其他批面零触碰 · 测试面零触碰（纯文档面）。

### 2.2 条目（覆盖 · 逐条 → 落点）

| # | 条 | 落点（file:line · as-of 2026-09-27） |
|---|---|---|
| 1 | `RENDER-CORE.md` §5 按实件回填：状态机族三参签名（`relayEventToSubPatch(token, scope, deps?)`——scope 必给 fail-closed）· `subBlocksReduce(list, patch, deps?) → {list, effects}` · `ensureSubBlock` / `subBlocksFreezeAll` · 判据族 `channel.mjs`；token 表各行 patch 补 `role, id`；构件族名按实件（`showToast` / `linkifyPaths` / `renderTaskPanel(progress, deps?) → {el, visible}` / `renderGoalPanel` / `renderBatchApprovalCard` / `renderSubBlock(model)`）；端注入面补 R2 读取族 | `docs/render-core/design/RENDER-CORE.md:174-204` |
| 2 | §5 relay 文法零依赖副本登记：权威 = `thincoder-core/agent/relay-prefix.mjs`；副本 = `thincoder-render-core/subblocks/relay.mjs`（漂移登记在件头）；对拍锁 = `thincoder-vscode/test/render-core-relay-map.test.mjs` RM-3 / RM-4 | 同上 `:198-199` |
| 3 | §6 逐档行数 R2 实读回填（内容行数口径）：八拆档 = `ui.js` 221 · `streaming.js` 182 · `activity.js` 190 · `panels.js` 122 · `permission.js` 39 · `question.js` 25 · `queued-mark.js` 40 · `ledger-line.js` 13；三核档 = 核 200 / 22 / 82（「VSC 侧 = 2 行 shim」注）；`activity.js` / `ui.js` 拆分预案消解 | 同上 `:210` · `:226-236` |
| 4 | §3 拆 8 行行锚按 R2 迁核后实读重锚（拆面现住核件 + 端留守面）；核 9 / 端 34 行锚未动 | 同上 `:84` · `:99` · `:107-110` · `:127` · `:131` |
| 5 | §9 增「同文重项 + 盘面零气泡」端差登记行（父侧裁「接受并登记为在册端差」） | 同上 `:278-279` |
| 6 | §1.3 / §4 两处 basename 锚全路径消歧（`webview/tool-card-restore.mjs` ⇒ `thincoder-vscode/webview/tool-card-restore.mjs`；`highlight.js:165` ⇒ `highlight.mjs:165`）——F1 / F2 | 同上 `:29` · `:67` · `:144` |
| 7 | `WEBVIEW.md` 行坐标随动（§2 `:31` · §3 表 9 行 `:46/:47/:50/:51/:52/:54/:55/:56/:66` · §5.2 `:223/:234/:243` · §5.4 `:386` · §5.5 `:395-397` / `:400-401` · §5.6 `:414`）+ 表后补 **R2 迁核注**（`:71-72`）+ `chat.css` 两处全路径消歧 / 现盘收正（`:398` `:466` · `:425` `:337`） | `docs/vsc/design/WEBVIEW.md` |
| 8 | `thincoder-vscode/AGENTS.md` 模块图 `:59/:61/:62/:65` 按 R2 终态收正 + `:66`（md.js = 2 行 shim——R1 遗留）一并收；`highlight.js` 残留行实核 = 无 | `thincoder-vscode/AGENTS.md:59-66` |

### 2.3 验收对照（机器可检）

- **doc-check**（`cd thincoder && node scripts/doc-check.mjs --root .`）：悬空 **53 ⇒ 48**（净 −5——本两档 5 处既有悬空全消；**新增 0**）；行宽 **34 ⇒ 34**（**新增 0**）；本两档内 = 悬空 0 / 行宽 0。
- **三档变更记录**：`RENDER-CORE.md` / `WEBVIEW.md` 同笔新增条目；`AGENTS.md` 无变更记录节（该档无）。
- **逐条落点**：见 2.2 表。

### 2.4 勘误与上抛（记录面 · 报告项）

- **读数勘误**（父侧记录面笔）：批档 §5.6 表 / §6.1 引数 `ui.js` 219 · `activity.js` 189 = fix 轮 2 前读数；现盘实读（内容行数口径）= **221 / 190**（fix 轮 2 头注 +2 / 注释 +1）——设计档 §6 按现盘实读记（190 / 221）。
- **§5.7 坐标漂移**（父侧记录面笔）：`flow/queued-mark.mjs`「93 ⇒ 99」与行锚（`:89` / `:51-56` / `:93`）对现盘（**103 行**；`dropped` = `:93` · `lastIndexOfRaw` = `:55-60` · 调用点 = `:97`）有差——本舱未动（§5 记录面）。
- **未动项**：RENDER-CORE 核 9 / 端 34 行锚 · `WEBVIEW.md` §5.x 未逐处重锚的其余坐标（R2 迁核注已覆盖口径）· 需求档 `docs/vsc/requirements/WEBVIEW.md:69`（父侧笔）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：✅ 实施完成 2026-09-27（舱 a = 核构件层（flow/cards/subblocks + 三核档迁核 + 核用例 92/92）· 舱 b = VSC 换接（八拆档消费核件 + 三核档 shim + 核包授权一处修 + C2 映射差分锁；双门 = 核包 93/93 · VSC 1033/1033；内部审计 1 轮 + 内部代码评审 1 轮 pass + fix 2 轮 · 终态 clean；开放项 = 同文重项边角待裁 + 文档面随动待父侧笔））



### 5.1 交付摘要（舱 a = 核构件层 · eng-coder 2026-09-27）

范围 = 按设计单源 `docs/render-core/design/RENDER-CORE.md` §3 判定表（「核 9 / 拆 8」）· §4 对位表 · §5 接口契约 · §8 R2 行，把**会话流构件层**抽入核包；禁改面（VSC / 桌面 / CLI 三树 · 需求档）零触碰（R2b 换接不在本舱）。
注：本批档 §2 派发时为模板占位——本舱任务书实为派发简报 + 设计 §8 R2 行，已按此执行并在此如实登记。

落点 `thincoder-render-core/`（R1 六档之外新增 15 档 + 5 用例档 + 2 随动档；行数 = 终态实读）：

| 面 | 件（行数） | 来源 / 判据 |
|---|---|---|
| 核 9 剩余三档（逐字） | `toast.mjs` 22 · `subblocks/activity-view.mjs` 200 · `flow/tool-card-restore.mjs` 82 | §3 行 48 / 3 / 49 |
| flow（7 档） | `block.mjs` 145 · `tool-card.mjs` 180 · `reasoning.mjs` 24 · `stream.mjs` 113 · `ledger-line.mjs` 13 · `queued-mark.mjs` 93 · `tool-card-restore.mjs` 82 | ui.js / streaming.js / ledger-line.js / queued-mark.js 拆面（§3 行 19/30/47/51） |
| cards（3 档） | `permission.mjs` 129 · `question.mjs` 90 · `panel.mjs` 78 | permission.js / question.js / panels.js 拆面（§3 行 27/28/29） |
| subblocks（4 档） | `state.mjs` 330 · `channel.mjs` 72 · `relay.mjs` 140 · `activity-view.mjs` 200 | activity.js 态机拆面（§3 行 4）+ relay 映射（§5 状态机族先例 `panel-subagent-relay.mjs:101-147`）+ 块面 |
| 随动 | `package.json` 40（清 `prepublishOnly` + description 补 R2 面）· `test/run.mjs` 76（③ 递归化 + 新增 ④ 全档 `node --check`） | 任务书 ㈣ + 内部评审建议 |
| 用例 | `test/{relay 11 · state 14 · panel 3 · queued-mark 5 · stream 5}.test.mjs` = 新增 **38** 例（+R1 54 = **92**） | 平 node（纯函数层 + 态机层）；DOM 构件层用例宿主 = 消费端套件（§6 规则） |

### 5.2 逐字性与实跑读数（终态）

- **三核档逐字性**（逐行 diff，字节对账）：`toast.js → toast.mjs` **差异 0 行**（897B = 897B）· `activity-view.js → subblocks/activity-view.mjs` **差异 1 行**（`:10` 引用行 `./i18n.js` ⇒ `../i18n.mjs`，11091B ⇒ 11093B）· `tool-card-restore.mjs → flow/tool-card-restore.mjs` **差异 3 行**（`:12-14` 引用行 `./lib.js` / `./md.js` / `./i18n.js` ⇒ `../*.mjs`，3946B ⇒ 3952B）——无第四处漂移；头注旧档名保留（逐字纪律，R1 先例）。
- **门禁**：`node test/run.mjs`（cwd = `thincoder-render-core`）**92/92 · fail 0 · exit 0**；④ 段含全档 `node --check`（34 档）。
- **负探针（双向）**：③ 递归 import 面——`flow/` 内注入裸包 import ⇒ 红（"non-core import in flow/…"）+ 复原绿；④ 语法面——`cards/` 内注入语法破口 ⇒ 红（"node --check failed: cards/…" + SyntaxError）+ 复原绿（探针档已删、盘面零残留）。
- **导入冒烟**：核包 21 构件档 node 真 `import()` 全过（导出面齐整）。
- **包面**：`npm pack --dry-run` = **22 件**（`*.mjs` + `package.json`；R1 六档 + toast + flow 7 + cards 3 + subblocks 4 + package.json）；`test/` 不入包（合 §1.3 内嵌面收窄规则）；`dependencies` / `devDependencies` 皆空（C1 ✓）。
- **档位读数**：`state.mjs` 330 行（> 300 软线、< 500 硬限——判据族拆出后余量；登记项，见 5.3 #5）。

### 5.3 决策透明表

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | 三核档 = 逐字搬迁（头注旧档名不改，仅引用行改；`toast.mjs` 落核包根、块面落 `subblocks/`、恢复卡落 `flow/`） | §3 行 3/48/49 + KD-RC-7 + 任务书验收① | ✅ 已落（读数见 5.2） |
| 2 | 拆出件命名自定（任务书授权）并逐档披露：`flow/{block,tool-card,tool-card-restore,reasoning,stream,ledger-line,queued-mark}.mjs` · `cards/{permission,question,panel}.mjs` · `subblocks/{state,channel,relay,block,activity-view}.mjs` | 任务书「验收标准」（命名自定并逐档披露）+ §6 三目录 | ✅ 已披露 |
| 3 | 态机面 = **模型 + 效果表**（零 DOM 供端执行）：`subBlocksReduce(list, patch)` 出生/接管/折叠/归档 + 补桩/回收吞/approval 全族；`ensureSubBlock`（内容 chunk 出生闸，判据 ≠ reducer 出生闸）· `subBlocksFreezeAll`；端事实经 `connectedOf` / `regionOf` / `trace` 注入 | §3 行 4 迁移判据 + §5 状态机族；内部审计 must-fix（原缺 ensureBlock 等价件） | ✅ 已落（38 例含判据分化锁） |
| 4 | relay 映射 = 逐支承先例（`⟦ev⟧async` 入 pending / `[model]` pool+syncLive 端注 / queued 四项 + 缓存 / cancelled(was) / stopped⇒cancelled / settled / done / turn / 表外消费不泄漏 / 嵌套剥除 + `onStripped` 留痕），+ `isRelayToken` 供「null 双义」消费判据；`scope` 必给（fail-closed 抛错，不静默降级） | §5 token→patch 全表 + C2 映射差分锁 | ✅ 已落（11 例含闭集负向锁） |
| 5 | 卡面/面板输出形态 = **DOM 构件**（`renderApprovalCard` / `renderQuestionCard` / `renderTaskPanel`→`{el: DocumentFragment, visible}`）；HTML 串降为内部实现面（转义闸仍在核内）；显隐判据另导纯函数 | KD-RC-3（已否「HTML 字符串核」）+ §5 构件族；内部审计 B1 | ✅ 已落 |
| 6 | 出站一律 `deps.emit(type, payload)` 注入（retry / openDiff / permissionResponse / batchPermissionResponse / questionResponse）；`t` 缺省 = 核 i18n（端经 `setStrings` 注入口径）；`now?` 可注入（测试缝） | §5 端注入面 + 四不自持 | ✅ 已落 |
| 7 | `package.json` 清 `prepublishOnly` 一行 + description 补 R2 面 | 任务书 ㈣ + 内部审计 D2 | ✅ 已落 |
| 8 | `run.mjs` ③ 递归化（R1 交接项）+ 新增 ④ 全档 `node --check`（补 C1 机检面常驻化；内部评审建议） | R1 §5.5 交接 + §7 C1 | ✅ 已落（负探针双向） |
| 9 | 痕迹钩 once/always 分面成文于件头（`reassert-hit`/`drop-tombstone` ⇒ `traceSubOnce`；余 ⇒ `traceSub`） | 内部评审 #4（R2b 接线静默差风险） | ✅ 已落 |
| 10 | 档长：`state.mjs` 385 ⇒ 330（判据族拆出 `channel.mjs` 72）——仍超 300 软线 30 行，登记不阻塞 | AGENTS.md 档位规则（advisory）+ 内部评审 #5 | ⚠️ 登记在案 |

### 5.4 审计与代码评审轮次与终态

- **内部 explore 分歧审计（1 轮）· 终态 = clean**：四类偏差逐条实读——**1 must-fix**（`ensureBlock` 出生闸未随迁：核内无等价导出，且 reducer 出生闸判据不同 ⇒ R2b 必在端复刻 = 双源）· 1 形态分歧（面板返回 HTML 串 = KD-RC-3 已否构造）· 4 低危（§5 名/签名滞后、文法副本登记、trace 变体、description）。越界面 / 用例质量 / 三核档逐字性 = **零发现**。
- **fix 轮 1（10 处）**：① 新增 `ensureSubBlock`（内容出生闸，含 consult 键形态）+ 用例；② 面板改 DOM 片段输出 + 显隐纯函数另导；③ `permission` HTML 串 builder 收为内部（删 `permission.test.mjs` 5 例——DOM 面用例宿主 = 消费端套件）；④ relay `scope` fail-closed；⑤ `connOf` 归一 + 接线注；⑥ 件头补 once/always 注（row 4 前置）；⑦ description 收正；⑧ 件头登记两条非逐字点。复跑 = 92/92 绿。
- **内部 advisor 代码评审（1 轮）· verdict = pass**：0 🔴 · 6 🟡（皆为**报告/协调项**，无 must-fix：§5 patch 表缺 role/id · §5 导出面/签名滞后 · 文法副本未入设计登记 + 无跨包对拍锁 · trace 分面成文 · 档长软线 · 批档 §2/§5 空）· 4 🔵（C1 的 `node --check` 未常驻化 · tool-card 两处非逐字点 · queued-mark 快照面理论差 · 报告读数前后值 95⇒92）。
- **fix 轮 2（4 处）**：① `state.mjs` 判据族拆出 `channel.mjs`（385 ⇒ 330+72）；② `run.mjs` 增 ④ 全档 `node --check`（+ 语法破口负探针）；③ `tool-card.mjs` 非逐字点登记注；④ `queued-mark.mjs` 快照面注。复跑 = 92/92 绿 · gate exit 0。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 1 · fix 2）。

### 5.5 未动项与上抛（父侧 / 设计面）

- **未动**：VSC / 桌面 / CLI 三树零触碰（`git status` 实核：本舱写入面 = `thincoder-render-core/**`）· 需求档 / 提示词零触碰 · 六档 R1 逻辑零改 · 未提交（提交时机待父侧）。
- **设计面随动（父侧笔 · 内部评审 #1–#3）**：§5 patch 表补 `role, id`（+ `isRelayToken` 消费判据说明）；§5 导出面按实件回填（`relayEventToSubPatch(token, scope, deps)` · `ensureSubBlock` · `subBlocksFreezeAll` · `channel.mjs` 判据族 · `showToast` / `linkifyPaths` / `renderGoalPanel` 名）；relay 文法**零依赖副本**入设计登记（权威 = `thincoder-core/agent/relay-prefix.mjs`；当前两份逐字同构）。
- **R2b 入口项**：① 接线契约以**实件**为准（`state.mjs` 效果表 + `deps` 族；件头「执行序约定」= 按序逐条、key→DOM 即时解析）；② `connectedOf` / `regionOf` 必注入（DOM 事实在端，模型字段不自动随动）；③ 建议补一条 relay 文法**跨包对拍锁**（照 `queue-visible` T-V16-14 双写对拍形）。

### 5.6 交付摘要（舱 b = VSC 换接 · eng-coder 2026-09-27）

范围 = 任务书（八拆档消费核构件 · 三核档「shim ∥ 删」· VSC `test/**` 增补 · 门 = C2 零回归含映射差分锁）；设计单源 = `docs/render-core/design/RENDER-CORE.md` §3 判定表「拆 8」/ §5 接口契约 / §6 受影响文件与测试面 / §7 C2 / §8 R2 行。禁改面（桌面 / CLI / 需求档；核包除父侧授权一处）零触碰。

**八拆档换接 · 逐档行数（现行 ⇒ 实际，终态实读）**：

| 档 | 现行 | §6 预期 | 实际 | 迁出面 → 核单源 | 留守端面（实读核过） |
|---|---|---|---|---|---|
| `ui.js` | 469 | ≈200–250 | **219** | `flow/block.mjs`（块容器 / 用户气泡 / 恢复帧 / 错误横幅）+ `flow/tool-card.mjs`（建卡 / 结算 / 历史卡 / linkify） | `ctx` 装配面（`currentBlock` / `_toolRefs` / `_nextIdx` / `assistantLabeled`）· append 位 · 滚动族 · 150 窗裁剪 · 欢迎条与横幅 · `retry` 唯一出站 |
| `streaming.js` | 262 | ≈150–190 | **182** | `flow/stream.mjs`（rAF 缝合器 + 复制钮）+ `flow/reasoning.mjs`（推理块）+ `subblocks/block.mjs`（chunk 构图） | `ctx`/`S` 指针（帧内现取）· 子回合边界判据 · 回合尾装配（清扫 / `[stopped]` / 复位）· 跟滚脏集接线 |
| `activity.js` | 450 | ≈260–320 | **189** | `subblocks/state.mjs`（三迁全族 + 内容出生闸 + 会话退出兜底）+ `subblocks/channel.mjs`（键文法 / 补桩表）+ `subblocks/block.mjs`（块构件） | DOM 效果执行器（按序逐条 · `key→DOM` 即时解析）· 出生位 / 说明行 / 区 pin 与计数钮 / 块级跟滚 / 痕迹绑定 / 区复位 / 头词定时刷新 |
| `permission.js` | 122 | ≈80–95 | **39** | `cards/permission.mjs`（逐项卡 / 合并批卡构树 + 三出口） | 出站绑 `vscode.postMessage`（判别式字面量在发射位）· append / `scrollIntoView` / deny 聚焦 |
| `question.js` | 89 | ≈60–70 | **25** | `cards/question.mjs`（选项列 / 自由文本 / 取消三路） | 出站绑 · 作答回焦输入框 · append / `scrollIntoView` / 输入框初始聚焦 |
| `panels.js` | 142 | ≈90–110 | **122** | `cards/panel.mjs`（构树 + 显隐判据纯函数） | 挂起 / 回合态 / 目标消息分流 · DOM 写入（`replaceChildren` / `style.display`）· 2s `_panelTimer` |
| `ledger-line.js` | 18 | ≈10–12 | **13** | `flow/ledger-line.mjs`（行构造 + 类名） | append 位 + `maybeScrollDown` |
| `queued-mark.js` | 88 | ≈55–65 | **40** | `flow/queued-mark.mjs`（标记口径 / 标签行字面 / 计划纯逻辑 / 两 DOM 原语） | 气泡 DOM 查询（含引用失效守卫）· 快照镜像写入 · 动作表执行 |

**行数落带说明**：带内 = `ui.js` / `streaming.js` / `ledger-line.js`（+1）；低于带 = `activity.js`（189，预期 ≈260–320）/ `permission.js`（39）/ `question.js`（25）/ `queued-mark.js`（40）——实迁出量大于估值（核侧另承接了 `renderSubBlock` / 通道判据族 / 计划纯逻辑等原档内联段），**留守面零缺失**（逐档对照 §3「留端」列实读核过）；略高于带 = `panels.js`（122，端侧保 2s 定时器与五个消息分流，核侧只接构树与判据）。八档均 <300 软线 ⇒ §6 `activity.js` / `ui.js` 两处「拆分预案」自然消解（未误拆）。

**三核档处置（shim ∥ 删 · 逐档理由）**：

| 核档（§3「核 9」） | 判定 | 依据（消费面实读） | 终态 |
|---|---|---|---|
| `activity-view.js` | **shim**（有消费面） | 生产：`activity.js:23` 取 `refreshBlock` + `:28` 转口 `noteChunk`；测试：`activity-closure`（`refreshBlock`）/ `subagent-note-parity` / `sync-block-stop` / `child-permission` | 2 行（`export *` 自核 `subblocks/activity-view.mjs`——运行时导出面实核 = `FAMILY_ROLES` / `noteChunk` / `refreshBlock`） |
| `toast.js` | **shim**（有消费面） | 生产：`autocomplete.js:7` / `send.js:11` 取 `showToast`；测试：`busy-injection-vsc-webview` / `queue-visible-vsc` / `webview-input-enter` / `workspace-guard`（含静态 `_t` 计时器字段直读） | 2 行（`export *` 自核 `toast.mjs`；`showToast._t` 同一函数对象 ⇒ 测试缝零改） |
| `tool-card-restore.mjs` | **shim**（有消费面——**仅测试面**） | 生产消费已随 ui.js 换接入核（`flow/block.mjs` 内取核 `buildFinishedToolCard`）；在盘消费 = `tool-result-truncation` / `webview-tool-failure-signal` 两档测试（恢复卡回归锁，保持端路径形） | 2 行（`export *` 自核 `flow/tool-card-restore.mjs`） |

零悬空复核：八档 + 三核档 + 全树 grep（`takeoverBlock` / `FAMILY_ROLES` / 各 shim 导出名）——**零悬空引用**；`activity.js` 的 `takeoverBlock` 导出随迁撤除（核态机内部迁，全树零消费者，实核在案）。

### 5.7 核包写面（超原 files 声明的授权修点）与勘误登记（舱 b）

- **授权修点**（父侧裁定「选项 ①——授权直修核（这一处）」）：`thincoder-render-core/flow/queued-mark.mjs`（原属舱 a 文件面）——**已删集对 items 认领不可见**：新增 `dropped = new Set(remove)`（`:89`）+ `lastIndexOfRaw(..., removed)`（`:51-56` / 调用点 `:93`）。判据 = 与迁移前源档 `git show HEAD:thincoder-vscode/webview/queued-mark.js` 语义等价（源档 `applyBusyQueued` 先移除已标记泡、后逐条认领——`lastBubbleWithRaw` 只扫在连 DOM ⇒ 残项认领不到已删泡、须重建泡）。修点最小（单逻辑点，零顺带重构，实读核过）。
- **勘误登记（R2a 披露经实证为误）**：核件头原注「本批新建泡不入本批 items 匹配……生产不可达」**仅就 `merged ∈ items` 面成立**——「已删集」面为**生产可达**（宿主按批取：多批 = 多回合 ⇒ 推 `{items: 残项, merged: 本批}`，`panel-turn-stages.mjs:228-232` `deliverBusyQueued` / `suspension.mjs:288-294` 与 `:417-421` 消费点；现红形 = `queue-visible-vsc.test.mjs` T-V16-13）。件头注已按实改（`:11-15` 正面 + `:16-21` 残差面）。
- **待裁差异登记（本舱落点 · 裁在华）**：件头 `:18-21` 自述的第二处与源档差异（**同文重项 + 盘面零气泡**（Reload 冷启 / 清屏重推 `items: ["x","x"]`）⇒ 核按 items 逐条新建 N 泡，源档第二条经 `lastBubbleWithRaw` 复用首条 = 1 泡）**本舱未裁、未自行扩修**（父侧裁定「修点最小（单逻辑点，禁顺带重构）」）。仓外探针对读实跑：`oldApply` 出 1 泡 / 核 `planBusyQueued` 出 2 泡（`MISMATCH`）；两支读法见 `WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦ 三支判据序。**请父侧在结算登记裁**：接受并登记为在册端差（+理由），或另开舱处理。
- **核用例补拍**：`thincoder-render-core/test/queued-mark.test.mjs` 新增「合并批 + 残项（消费端 T-V16-13 同形 · 生产可达）」（`:55-67`）：`remove [0,1,2]` ∧ `mark []` ∧ `append [merged(不标记), c(标记)]` ∧ 镜像 `{count:1,pending:true}`——核包用例 92 ⇒ **93**。

### 5.8 门读数与用例面（终态实跑）

- **核包**：`cd thincoder-render-core && node test/run.mjs` = **93/93 · fail 0**（先例 92 + 新增 1）。
- **VSC**：`cd thincoder-vscode && npm test` = **1033/1033 · fail 0 · cancelled 0**（基线 1015 + 新增 18）。
- **lint**：`cd thincoder-vscode && npm run lint` = `check-syntax: 270 JS files OK`。
- **机制机检面随动**：`protocol-coverage-reverse`（§13 发面四形态 + 表 ↔ 源码对账）与 `protocol-coverage`（§12 收面）在两处发射壳整形后复跑绿——三壳的判别式字面量均留在发射位（`permission.js` 形态④局部箭头 / `question.js` 形态③局部对象绑定 / `ui.js` 形态①对象字面量）。
- **VSC 用例面增补（宿主 = 消费端套件——设计 §6「核包自身零 devDep」）**：
  - `test/render-core-components.test.mjs`（**14 例**，新增）：核构件 DOM 面直驱——`renderBlock` / `buildUserMessage`（raw·ts·idx + 转义闸）/ `buildAssistantRestore`（帧 + reasoning + 嵌套卡）/ `renderErrorBanner`（`retry` 出站）/ `renderToolCard`+`finishToolCard`（耗时·摘要·成功折叠·错误展开·截断旗标）/ `renderToolHistory`+`linkifyPaths` / `renderApprovalCard`（三出口载荷 + `openDiff` + owner）/ `renderBatchApprovalCard`（三 choice + promptId）/ `renderQuestionCard`（选项 + 自由文本 + 取消 + `onAnswered`）/ 面板构件（显隐判据 + 片段输出）/ `renderReasoning` / `createStreamRenderer`（注入 `raf`/`now`：一帧一渲 · ≥50ms 节流重排 · flush 尾帧 · 跟滚脏集）/ `attachCopyButtons`（幂等 + 剪贴板）/ `renderLedgerLine`+`renderSubBlock`（结构 + `_subMeta` 同一引用）。断言全为行为/结构契约面，零散文锚（全档零 `readFileSync`）。
  - `test/render-core-relay-map.test.mjs`（**4 例**，新增）= **C2 映射差分锁**：RM-1 核单源全表逐行（17 条 token ⇒ patch 逐字，含 `⟦ev⟧stopped` ⇒ `cancelled` 零 note / 零 `stopped` 值 + `isRelayToken` null 双义）；RM-2 状态值闭集负向（产值 ⊆ {started,queued,turn,done,settled,cancelled}，零 `stopped` / `error`；queued 缓存随终态作废；缺 scope fail-closed 报错）；RM-3 跨包对拍（扩展侧产者 `relaySubagentEventToken` ∥ 核单源逐 token 同产物——R2 交接项）；RM-4 relay 前缀文法零依赖副本对拍权威（`relayPathOf` ∥ `@thincoder/core/agent/relay-prefix.mjs` `parseRelayPath` + 正则 `.source` 逐字）。
  - `test/activity-closure.test.mjs` T-CL24 结构锁**改指核单源**（读 `node_modules/@thincoder/render-core/subblocks/activity-view.mjs`——端档已 shim 化，锁原文即空锁）；`test/files.mjs` 二新档**已登记**（未登记 = 永不执行的口子已闭）。

### 5.9 决策透明表（舱 b）

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | 八档换接形 = 直 import 核包（`../node_modules/@thincoder/render-core/**`）+ 端壳保留签名（`buildUserMessage(ctx,…)` / `buildToolHistory(ctx,…)` 等 `ctx` 透传形） | 设计 §1.3 接入形 + 消费档零改（`chat-messages.js` / `send.js` / `history.js` / 各测试直调面） | ✅ 已落 |
| 2 | `activity.js` 模型列表 = `S._subBlocks` **实时物化**（Map 值序 → 模型数组；模型 = 块 `_subMeta` 同一引用），效果表逐条执行且 `key→DOM` 即时解析 | 核件头「执行序约定」+ 既有测试面直读 `S._subBlocks`/`_subMeta` 的形（零测试改写） | ✅ 已落 |
| 3 | 三核档 = **全部 shim**（有消费面即 shim；含仅测试面消费的 `tool-card-restore.mjs`） | 任务书「shim（有消费面）∥ 删（零消费面）」+ 在盘消费面实读 | ✅ 已落（5.6 表） |
| 4 | 出站三壳整形：判别式字面量**留在发射位**（`permission` 形态④ / `question` 形态③ / `ui` 形态①） | §13 发面机检四形态登记（`protocol-coverage-reverse` fail-closed——`{type, ...payload}` 简写会使提取器点名失败） | ✅ 已落 |
| 5 | 核包一处修（已删集不可见）+ 核用例一条 + 件头注收正 | 父侧授权（选项 ①）+ 源档语义判据 | ✅ 已落（5.7） |
| 6 | C2 映射差分锁落 `thincoder-vscode/test/**`（含跨包对拍 + 文法副本对拍） | 设计 §7 C2 + 舱 a 交接项 ③（落点自选＝VSC 测试面） | ✅ 已落（5.8） |
| 7 | `activity.js` 的 `takeoverBlock` 导出撤除 | 核态机内部迁；全树零消费者（实核） | ✅ 已落（披露） |
| 8 | 同文重项边角差异 = 未裁、未自行扩修 | 父侧「修点最小（单逻辑点）」+ 两支读法两可 | ⚠️ 待父侧裁（5.7 登记） |

### 5.10 审计与代码评审轮次与终态

- **内部 explore 分歧审计（1 轮）**：五面逐条实读（八档换接面 / 三核档处置面 / 核包写面 / 用例面 / 文档漂移面）——① ② ③ ④ 面 **零发现**（无静默降级 / 无漏计消费者 / 无导出缺口 / 核包修点无超范围 / 无散文锚 / 二新档已登记）；文档漂移面出 **3 项**（`thincoder-vscode/AGENTS.md` 模块图 `:59/:61/:62/:65` 仍述迁移前角色；`docs/vsc/design/WEBVIEW.md` 活体坐标仍指迁移前行号且无 R2 迁核注；`RENDER-CORE.md` §3/§6/§8 未落 R2 实施注与实读回填）＋ 1 项待复核（同文重项边角，审计无 git/执行工具未能对源档）＋ 1 项流程登记缺口（批档 §5 无舱 b 记录——本节即其闭合）。
- **fix 轮 1（2 处）**：审计后自修——① 核心件头第二差异注收正为「两形分列 + 待裁登记」（原注把差异面说窄了）；② 同文重项边角实证（仓外探针对读：源档 1 泡 / 核 2 泡 ⇒ `MISMATCH` 记录在案，裁上抛）。
- **内部 advisor 代码评审（1 轮）· verdict = pass**：0 🔴 · 3 🟡（皆**报告/结算项**，无 must-fix：待裁差异未登记（→ 5.7 已登记）· 批档 §5 缺舱 b（→ 本节）· 设计 §5/§6 未按实件回填（父侧笔））· 3 🔵（设计 §6 行数未回填 · `activity.js:14` 注释把 `updateStopButton` 列为 shim 导出面 · `ui.js` `buildHistoryMessage` 核/端双份未登记）。
- **fix 轮 2（2 处）**：① `activity.js:14-15` 注释收正（shim `export *` 面 = `refreshBlock`/`noteChunk`；⏹ 控件 = 核件内部实现）；② `ui.js` `buildHistoryMessage` 头注登记「核/端双份分派壳（实件单源 = 核件各 builder，端只做 `ctx` 穿参 + kind→映射）」。复跑 = VSC **1033/1033** 绿。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 1 · fix 2；开放项 = 5.7 待裁差异 + 5.11 文档漂移面，均报告/父侧笔）。

### 5.11 未动项与上抛（父侧 / 设计面）

- **未动**：桌面 / CLI / 需求档零触碰；核包仅授权一处（5.7）；`renderer/**` 与 R3a–R3c 面零触碰；未提交（提交时机待父侧）。
- **设计 / 文档面随动（父侧笔，实读坐标在案）**：① `RENDER-CORE.md` §5 按实件回填（`:174` `relayEventToSubPatch(token) → patch | null` ⇒ 实件三参 `(token, scope, deps)`；`:196` 构件族名 `renderTaskPanel(items)` / `renderSubBlock(model, deps)` / `toast(text)` / `linkify(root)` ⇒ 实件 `renderTaskPanel(progress, deps)→{el,visible}` / `renderSubBlock(model)` / `showToast` / `linkifyPaths`；`:180` `[model]` 行缺 `role, id`）+ relay 文法零依赖副本入设计登记；② §6 逐档行数按 R2 实读回填（R1 先例「R1 实读」形；三核档行 `:220-222` 补「VSC 侧 = 2 行 shim」实施注；`activity.js` 实读 189 / `panels.js` 实读 122 与预期区间有别）+ §3 行锚收正（拆面行锚现住核件）；③ `docs/vsc/design/WEBVIEW.md` 两处行坐标随动 + 补 R2 迁核注（比照 `:69` R1 先例）；④ `thincoder-vscode/AGENTS.md` 模块图四行（`:59/:61/:62/:65`）按 R2 终态收正。
- **上抛（裁在父侧）**：5.7 的「同文重项 + 盘面零气泡」差异登记裁（接受并登记为在册端差 ∥ 另开舱）。

## §6 验证与收口（父代理）

### 6.1 实施核验（父侧亲跑 · 2026-09-27 23:3x ✓）

| 面 | 父侧读数（亲跑） |
|---|---|
| 核包 | **93/93 · fail 0**（R1 54 + R2a 38 + R2b 核用例 +1） |
| VSC | **1033/1033 · fail 0**（基线 1015 + 18）——含映射差分锁 + 跨包对拍（RM-3/RM-4） |
| 换接面 | 八拆档行数实读（`ui.js` 219 / `streaming.js` 182 / `activity.js` 189 / `panels.js` 122 / `permission.js` 39 / `question.js` 25 / `queued-mark.js` 40 / `ledger-line.js` 13）· 三核档 2 行 shim · 零悬空引用 |
| 核包授权修 | `flow/queued-mark.mjs` 93 ⇒ **99** + 用例 +1——判据 = 源档语义等价（「已删集对 items 认领不可见」）✓ |

### 6.2 待裁差异裁决（§5.7 第二处 · 父侧裁 = **接受并登记为在册端差**）

**理由**：① 「同文重项 + 盘面零气泡」形下，源档 1 泡 = `lastBubbleWithRaw` **文本查重副产物**；核逐项建泡（2 泡）与**队列计数镜像一致**（同形下计数镜像 = 2——源档自身视图 / 计数不自洽）；② C2 零回归面**无测试锁该形**（1033 全绿——无断言冲突）；③ 若今后要回到「1 泡」口径 = 新需求（设计改写），不属本批。
**登记**：设计面随动（`RENDER-CORE.md` §9 差异登记行）+ 本档在册；（用户知情：报告面披露——如需源档口径精确复刻，另起修正）。

### 6.3 随动与收口

- **设计 / 文档面微轮（在跑）**：`RENDER-CORE.md` §5 实件回填 / §6 R2 实读回填 / §3 行锚 / §9 差异登记；`docs/vsc/design/WEBVIEW.md` 坐标随动 + R2 迁核注；`thincoder-vscode/AGENTS.md` 模块图四行（R1 遗留 + R2 终态一次收）。
- **上抛已闭**：R2a §5 三件入微轮；relay 跨包对拍锁已由舱 b 落（RM-3/RM-4）；`state.mjs` 330 行 = 登记态。
- 台账 #466–#468 在途（R2 完 + R3 后续）；提交：R2 面路径限提交 + 双推（微轮落定后）。**R2 后接 R3a/b/c**。

### 6.4 勘误与记录面（父侧 · 2026-09-27 23:4x ✓）

- **行数表勘误**：§6.1 引 `ui.js` 219 / `activity.js` 189 = fix 轮 2 前读数；**现盘实读 = 221 / 190**（设计档 §6 已按现盘记；批档 §2.4 在册）——§6.1 表余值同源核过。
- **§5.7 坐标漂移（记录面）**：`flow/queued-mark.mjs`「93 ⇒ 99」及 `:89`/`:51-56`/`:93` 对现盘 = **103 行**（`dropped :93` · `lastIndexOfRaw :55-60` · 调用点 `:97`）；以现盘为准，§5 不回溯。
- **需求档悬空锚收正**（父侧笔）：`docs/vsc/requirements/WEBVIEW.md:69` P2-5 锚全路径消歧（→ `thincoder-render-core/flow/tool-card-restore.mjs:39-43` vs `flow/tool-card.mjs:95`）。
- **doc-check 终读数**：悬空 **53 ⇒ 47**（净 −6 = 微轮 −5 + 父侧 −1）· 行宽 **34 ⇒ 34**（新增 0）。
