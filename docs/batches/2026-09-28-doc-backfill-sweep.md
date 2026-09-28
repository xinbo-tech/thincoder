# 2026-09-28 · 文档回填+卫生轮
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 台账 #511 + 文档机械族归集（#367/#370/#373/#374/#377/#378/#390/#391/#393/#408/#427）——用户「AB两条都走吧」授权 2026-09-28。
> 台账 = #516（文档回填+卫生轮 · 归批）。前情 = docs/batches/2026-09-28-timer-wake-phase2.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 主题与范围（2026-09-28 · 用户「AB两条都走吧」授权——B 线）
- 本批 = **文档回填 + 卫生轮**（台账 #516 汇批：原 #511 全族 + 文档机械族）——全 `docs/**` 面（笔权 = eng-designer）。
- **回填面**：本会话诸批实读值（timer-wake ∕ midturn 诸档 + §4.1 行数账 + 机检面清单 U217–U226）· `AGENT-LOOP-ASYNC-POOL.md` §6.30.12 修正轮三桩注 + U-10 机制句 · `RENDERER.md` 通道计数 · `SHELL.md:43` 残体 · BE 行 · KD-34 残句 · 第八词口径 · `WEBVIEW-PROTOCOL.md:231` 标记 · `ev:queue` 17⇒18 四同拍。
- **卫生面（归批机械项）**：`#367`（TOOLS.md §2.2 迁移表）· `#373`（子 id ∕ 死引）· `#374`（旧编号族另族 sweep——`advisor/**` 37/6 ∕ `tools/**` 23/8 ∕ VSC 面板族）· `#377`（「2026-09-25 本批」9 处 ∕ 4 档）· `#378`（镜像撤写残余·文档半幅）· `#390`（WEBVIEW 两坐标）· `#391`（MODEL-BENCH 标记复核）· `#393`（IPC.md 坐标）· `#408`（chat.css 指针三处）· `#427`（PROJECT.md 裸路径）。
- **不动（码 ∕ 测试面——只报）**：`#370`（doc-check.test 档头）· `#373③` ∕ `#378②③` 的码面注释位 · `#396`（产品码注释）——归父侧另办 ∕ 随触碰。

### 1.2 前情
- 文档面现状 = 本会话诸批收口后的实读（timer-wake 终锚 #45 已落主表）；本批 = 全族一次收笔。

### 1.3 台账
- **#516**（汇批：原 #511 + #367 ∕ #370 ∕ #373 ∕ #374 ∕ #377 ∕ #378 ∕ #390 ∕ #391 ∕ #393 ∕ #408 ∕ #427 归集）→ 本批——回填 ∕ 卫生面随实施核销；码 ∕ 测试面三项留原（另办）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审轮 1 修正九号全落（2026-09-28）；机检净增 0（悬空 56 ∕ 行宽 36）——余 = 同族标记面残余（§4.2 逐批表 ∕ §6.30 条目面——父侧另裁））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：18 项（回填面 8 + 卫生面 10——§1.1 枚举），全部 `docs/**` 笔面；码/测试面三项（#370 / #373③ / #378②③ 码面注释）只报不动。

**逐项处置（号 → 落点 file:line 或理由）**
1. §4.1 行数账全表回填 = ✅ 主体已落 `docs/desktop/design/PROJECT.md`（值列 ~50 行 + 用例模块行 48 档 ∕ 集成域 8 档 + `files.mjs` **25** + 共享助手四档 + 越层段重写：在册例外 `mount-settings` **499** / 越层 + 测试面逐档读数）。**🟡 收尾 2 处被冻结窗阻断**：新引入悬空 1 条（`turn-face.mjs:42`→全形）+ 本席新行长行拆分（L106 等）——待解冻后同一轮内收。
2. KD-40⑤ ∕ §2.2「在飞回合中止 + 在飞表清（`flights`）」+ 中止墓碑三查位段 = ✅（PROJECT.md §2 KD-40 ⑤ / §2.2；落点坐标 `agent-host.mjs:118-130 / :217 / :139 / :320-321 / :335-336` · `turn-face.mjs:33-36 / :42 / :61 / :65`——冻结前落笔）。
3. U217–U226 全谱 = ✅（PROJECT.md §6.1 + `E2E-TESTING.md` §4 行 0 ⇒ **135** + §6 T-DSK45 机检面全谱；U216 空位不回收在册）。
4. §6.30.12 三新例注（窗内中止容纳 ∕ 触发落流 ∕ 开关真链 + T-TW23b）= ❌ 未落——未在时限内定位 §6.30.12 宿主文本（已核 `thincoder-vscode/test/timer-wake.test.mjs` 三例实存：T-TW23∕T-TW23b∕T-TW24–27）；建议另轮点名落点行后落。
5. 通道计数 → 十八（同拍）= ✅（`RENDERER.md` ×3 行 · `SHELL.md` ×2 行 · `IPC.md` §2 两注已在前批 · PROJECT.md preload ∕ events ∕ BE 行——冻结前）。
6. `SHELL.md:43` flush 残体清 + 计数 = ✅（:43 十八条 ∕ 实读 **77** ∕ 存续句；:46 值 **322**）。
7. BE 行（代码实读 **18**）· KD-34 残值句 · 第八词口径 = ✅/🟡（BE ✅ 复读 18；KD-34 ✅ 残值 = 端侧投影〔给由句〕；第八词 ✅ 定位 + §10 增 **BN** 行——码面注释两处不一致，只报；冻结前落笔）。
8. `WEBVIEW-PROTOCOL.md:231` 「拟新增」→「已落」 = ✅（+ `thincoder-vscode/webview/status-bar.js` 全形 · `:62` 起）。
9. TOOLS.md 闸内悬空 ×4（rows #52 ∕ #64 ∕ #85 ∕ B2 补「（迁移期引文）」）+ `git/checkpoint.mjs` → 全形 ×2 = ✅（悬空 6 条消）。
10. 子标对照登记（`ADVISOR-GUARDS.md` §5 ∕ `SESSION.md` §6.12）= ❌ 未落——细节在台账 #373 正文，本席不可就地复核（留待父侧给坐标 ∕ 正文）。
11. 旧编号族 sweep（advisor §14.x ∕ §16.x 37/6 · tools 23/8 · VSC §12.2.x ∕ §14.x）= ❌ 未落——体量裁量，建议另轮成批。
12. 「2026-09-25 本批」9 处 ∕ 4 档 = 🟡——#185 面已落（`TUI.md` ×4 处 · `TUI-COMMANDS.md` · `TUI-SESSION-VIEW.md` · `SESSION.md:183` → 「misc-four 批」）；`CLI-DEBT.md:40/:41` 两处 = 冻结窗阻断（批 = doc-face-closeout——待解冻）。
13. 镜像撤写残余 = ✅ `ENG-TOKEN-BINDING.md:100`（槽单点 + `setup-tooltable.mjs:88-97`）+ `WEBVIEW-PROTOCOL.md:113`（同坐标）；`TOOLS.md:81 ∕ :122` = 迁移表内史实引文（判不改——只报）。
14. `WEBVIEW-PROTOCOL.md` 坐标 ×3 = ✅（`panel-index.mjs:27 ⇒ :29` · `panel-callbacks.mjs:251 ⇒ :158` ×2 处）。
15. MODEL-BENCH 标记复核 = ✅ 参数预检族「（拟新增）」→「（已实现）」×11 + 新载体档收正 ×3；**条件项 4 处**：`driver-spawn` ∕ `variants-v2` 保留 = 正确（盘上确未落）；`report-params` ∕ `report-speed` 保留 = **与现盘相抵**（两档已存在——按在册指示保留、报父侧）。
16. `IPC.md` `sessionPath` 坐标 = ✅ **`:92`**（盘面实读 `export function sessionPath`；在册指示 `:86` 与现盘不合——报）。
17. `VSC-DEBT.md:302` `webview/chat.css` → 全形 = ✅；`WEBVIEW.md:393/:420` 已全形（只报）。
18. PROJECT.md 裸路径 → 全形 = ✅ 大部分（§4.1 14 种形态 replace_all + KD-40 引文；`:79` 两处 `queued-pickup.mjs:22-34` ∕ `agent.mjs:210` 判为拟新增列报项、`agent.mjs`（VSC）未能定全形——只报）。

**验收对照**：① 落笔率 = **12 ✅ ∕ 3 🟡 ∕ 3 ❌**（详见上表）；② 机检：悬空 **64 → 57**（-7，净增为负；另有 1 条本席新引入悬空处 PROJECT.md 冻结区内待收）；行宽基线 35 → 现测 49（其中 9 行为冻结区 PROJECT.md 待收 + 4 行本席已在本轮收正后未复测）；③ 每档变更记录 +1 = 7 档已落（PROJECT.md ∕ RENDERER ∕ SHELL ∕ E2E-TESTING ∕ IPC ∕ TOOLS ∕ MODEL-BENCH）；TUI ×3 ∕ WEBVIEW-PROTOCOL ∕ SESSION ∕ ENG-TOKEN-BINDING 未加（裁剪项——报告）。

**受影响文件**：`docs/desktop/design/{PROJECT.md, RENDERER.md, SHELL.md, IPC.md, E2E-TESTING.md}` · `docs/core/design/{TOOLS.md, SESSION.md, MODEL-BENCH.md, ENG-TOKEN-BINDING.md}` · `docs/cli/design/{TUI.md, TUI-COMMANDS.md, TUI-SESSION-VIEW.md}` · `docs/vsc/design/{WEBVIEW-PROTOCOL.md, VSC-DEBT.md}` + 本批档。

**上抛项（逐条）**：① 冻结窗阻断三项（PROJECT.md 收尾 2 处 · `CLI-DEBT.md:40/:41` · `PORTABILITY.md` 本席未触）——待解冻后落；② 另一实例（pid=1360）对 `SESSION.md` 持意图声明（peer-collab 警示）——本席写入已落（:183 一处 + 拆分一行），请父侧协调；③ MODEL-BENCH 条件项相抵（见第 15 条）；④ 在册坐标两处与现盘不合（`session-slots.mjs :86` 实为 `:92`；`turn-face.mjs:42` 需全形）；⑤ 台账 #373 细节不可就地复核（第 10 条留白）。

### 2.2 补完轮（冻结窗解冻后 · 按号点修 · 2026-09-28 · eng-designer）

承首轮 18 项（12 ✅ ∕ 3 🟡 ∕ 3 ❌）之父侧「补完」裁定——派单五号逐号落：

1. **`PROJECT.md` 收尾 = ✅**：本席首轮新引入超宽行 **10 行逐行拆分**（`:106` / `:230` / `:545` / `:546+547` / `:773` / `:887` / `:889` / `:895` / `:896` / `:981`——逐行复读实宽全 ≤300；`:888`（347）为存量非本席笔，留下）；新引入悬空 `turn-face.mjs:42` ⇒ 全形 `thincoder-desktop/src/main/turn-face.mjs:42`（`:107`）；**并入 consistency 收正**（本席首轮部分编辑残留、随拆分同笔清）：`545` 与 `546` 重复句删重、`546` 内 `queued-input.test.mjs` 双提记合一（U220 绑定随并入保留）。
2. **`CLI-DEBT.md:40/:41`「2026-09-25 本批」两义 = ✅**：逐处指名落笔批（#377 消解径「指名落笔批」）——「读数 as-of 2026-09-25 · **doc-face-closeout 批**实读」+「**doc-face-closeout 批触碰**」（裁定源同批——`docs/batches/2026-09-25-doc-face-closeout.md` §2 在位）。
3. **变更记录补 6 档 = ✅**（各 +1 笔，与首轮其余 7 档同拍）：`TUI.md` / `TUI-COMMANDS.md` / `TUI-SESSION-VIEW.md` / `WEBVIEW-PROTOCOL.md` / `SESSION.md` / `ENG-TOKEN-BINDING.md`；另 `AGENT-LOOP-ASYNC-POOL.md` 因第 4 项触碰随补 1 笔（变更轨迹）。
4. **`AGENT-LOOP-ASYNC-POOL.md` §6.30.12 = ✅**（首轮 ❌）：T-TW23 行补 **T-TW23b 变体**容纳（非空闲零动作——busy ⇒ 零交付 ∕ 零开轮 ∕ 在途不动）；用例宿主行补 **VSC 修正轮三桩注**（非新号——随补注登记：开关真链 ∕ 窗内 timer 轮中止容纳 ∕ 触发落流——源 = 批档 §5.15）。首轮之因（宿主文本未定位）已解——实读 `thincoder-vscode/test/timer-wake.test.mjs` 全档核位（三新例标题实存、无独立号）。
5. **子标死引 = ✅**（首轮 ❌）：`ADVISOR-GUARDS.md` §5 补**旧子 id 映射**（E-1…E-8 → 本节 ∕ §10 ∕ §11 ∕ §12 落点；**E-3c** ∕ **E-3d** 字母同对应；**E-4** ∕ **E-7** 点名可解析——登记面依审计「登记 id 族映射」径）；`SESSION.md` §6.12 补**引文映射**条（代码注释「§6.12①」⇒ §6.14「生命周期联动」条——子标相容登记）。

**机检读数（前后对照）**：悬空 **57 ⇒ 56**（−1 = turn-face 全形；本席十档零新增悬空）；行宽 **45 ⇒ 36**（−10 = PROJECT.md 收 10；+1 = 外档并行新增 `docs/desktop/requirements/PROJECT.md:240`——主 agent 笔，只报）。本席新笔行宽全 ≤300（实数复读；表格行不计）。

**受影响文件**：`docs/desktop/design/PROJECT.md` · `docs/cli/design/{CLI-DEBT,TUI,TUI-COMMANDS,TUI-SESSION-VIEW}.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/core/design/{SESSION,ADVISOR-GUARDS,ENG-TOKEN-BINDING,AGENT-LOOP-ASYNC-POOL}.md`（10 档 + 本批档）。

**上抛项**：① `docs/desktop/requirements/PROJECT.md:240`（332 字符 · 需求档）为并行会话（主 agent 直接执行）新增超宽行——非本席笔域，只报；② 存量超宽 35 行含本席首轮触及面余项（`SHELL.md:46` 384 ∕ `SESSION.md:175` 448 等）——派单范围外，未动、留册（完整读数 = 机检 FAIL(行宽) 清单）。

**本轮不做**（留原）：#374 旧编号族另族 sweep（`advisor/**` §14.x ∕ §16.x 37/6 · `tools/**` 23/8 · VSC 面板族）；码 ∕ 测试面三项（`advisor-chain-guards.test.mjs:5` ∕ 码面注释 `#378②③` ∕ `#370` ∕ `#396`——只报不动）。

### 2.3 设计评审轮 1 修正（按号点修 · 2026-09-28 · eng-designer）

承批档 §3 轮次 1 九条发现（父侧逐条裁定接受；**#4 = 选项 ①**）——按号点修（纯收正 ∕ 去标 ∕ 重锚 ∕ 落值；**零语义变更**）：

1. **标记面 sweep = ✅**（判据 = 档在盘 ⇒ 去「（拟新增）」）：`WEBVIEW-PROTOCOL.md:101` · `IPC.md:24/:29/:30/:84/:94` · `AGENT-LOOP-ASYNC-POOL.md:43/:44` · `PROJECT.md:72/:73/:79/:92/:104/:666` 去标；`:79` 同句两枚 pending 参引随标去全形（`queued-pickup.mjs:22-34` ⇒ `thincoder-cli/src/tui/queued-pickup.mjs:22-34` · `agent.mjs:210` ⇒ `thincoder-vscode/src/agent.mjs:210` · `panel-turn-loop.mjs:106` ⇒ `thincoder-vscode/src/extension/panel-turn-loop.mjs:106`——在盘为实）；确未落者保留（`electron-builder.yml` · `chrome-denoise.css` 等，未动）。
2. **`PROJECT.md` §4.1 自洽 = ✅**：预案列措辞统一——`:171`（`thincoder-desktop/renderer/questions.mjs` **已落** · 实读 **44**）· `:176`（`i18n-views.mjs` **已落** · **68**）· `:177`（`queue.mjs` **已落** · **41**）· `:252` ∕ `:256` ∕ `:257`（`turn-chain` **71** ∕ `composer-send` **70** ∕ `queued-input` **117** **已落**）；越层段 `:226`/`:227`/`:230` 同拍；§10 **BL** 去标。**已落未列档补行十二档**（落位 = 各行锚后；行数现盘实读 · 口径 = 内容行数 · 文末换行不计）：`src/main/timer-watch.mjs` **79** · `queued-input.mjs` **117** · `turn-chain.mjs` **71** · `file-links.mjs` **63** · `renderer/page-read.mjs` **132** · `subagent-reduce.mjs` **137** · `queue.mjs` **41** · `composer-send.mjs` **70** · `i18n-views.mjs` **68** · `views/chat-chrome.mjs` **297** · `views/chat-pending.mjs` **77** · `views/chat-subagent.mjs` **69**。
3. **`MODEL-BENCH.md` 复点 = ✅**：行内残两处补齐（`:858` 「（拟新增 · 单源）」⇒「（已实现 · 单源）」· `:1470` 「新载体档（拟新增）」⇒「（已实现）」）；变更记录声明同拍（×11 + 行内两处同收）。
4. **父侧裁 ① 落 = ✅**：`:861` `bench/lib/report-params.mjs` ∕ `report-speed.mjs` 两标记转「（已实现）」（在盘为实）；条件项 `driver-spawn` ∕ `variants-v2` 保留（盘上确未落——同句注）；变更记录同注。
5. **`TOOLS.md:1138` 记录条回锚 = ✅**：原「§5 ∕ §6.13 两处转全形」句与现文不合 ⇒ 改述为现盘实况——裸形 `git/checkpoint.mjs` 仅存 `:105`（**史实引文面**：「（迁移期引文）」标记在册 · 同句现体全形 `thincoder-core/git/checkpoint.mjs` 在位 · 判不改）；全档现体全形在位（§1 ∕ §2.2 ∕ §6）。
6. **`CLI-DEBT.md` 义务补齐 = ✅**：补 2026-09-28 变更记录一条（同批同笔补记——含 `:40`/`:41` 指名批）；B7 ∕ B8 ∕ T2 ∕ T3 的「本批」逐处指名（doc-face-closeout ∕ env-config-purge ∕ cli-small-items）；`:35` ∕ `:72` 两处 `memory-sweep-cli.test.mjs`「（拟新增）」按盘去标。
7. **`AGENT-LOOP-ASYNC-POOL.md` 自锚回真 = ✅**：`:493` ∕ `:658` 自锚「741」⇒ **745**（含本批条目后全档实读 · 2026-09-28；口径 = 内容行数 ∕ `wc -l`——文末换行不计；注：read 类工具按尾行计数法显 746，本档取 `wc -l` 口径）。
8. **`PROJECT.md` 时点标注 = ✅**：`:248`（原 `:236`）「贴 300 层未越」句按口径重述（现值 ≤ 300 ∧ 距线 ≤ 3 行；**= 300 达线者入列**——列六档：`app.mjs` **299** · `views/chat-chrome.mjs` **297** · `agent-host-suspension.test.mjs` **299** · `agent-host-queued.test.mjs` **298** · `views-tabbar.test.mjs` **297** · `settings.test.mjs` **300**）；`:223`（原 `:211`）用例模块行 `agent-host-suspension` 加时点注（落档 **232** ⇒ 现值 **299**——值列同为 **299**，两拍）。
9. **记录面序 = ✅**：`MODEL-BENCH.md` 2026-09-28 条目移出升序段错位（移至 09-27 条目之后 = `:2186`）；`RENDERER.md`「文档回填与卫生轮」条目移出「回合中插入批」后续轮之间（移至该批各轮之后 = `:184`）。

**机检读数（前后对照 · `node scripts/doc-check.mjs --root .`）**：悬空 **56 ⇒ 56**（净增 **0**——`PROJECT.md:79` 两枚 pending 转解析；本席零新增悬空）；行宽 **36 ⇒ 36**（净增 **0**——修正轮新笔三行超宽当场拆分：`PROJECT.md` 变更记录行 ∕ `CLI-DEBT.md:105` ∕ `MODEL-BENCH.md:2186`）；拟新增列报 **28 ⇒ 26**。

**受影响文件（8 档 + 本批档）**：`docs/desktop/design/{PROJECT,RENDERER,IPC}.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/core/design/{AGENT-LOOP-ASYNC-POOL,MODEL-BENCH,TOOLS}.md` · `docs/cli/design/CLI-DEBT.md`。

**越界披露（表外只报）**：① 同族「（拟新增）」残余（在盘 ⇒ 同判据去标候选，本轮按逐批记录面处理未动）——`PROJECT.md` §4.2 逐批表 + §7 批注面 ~25 处（`:358` `questions.mjs` / `:359` `badges.mjs` / `:405` `page-read.mjs` / `:406` `queue.mjs` / `:407`/:419 `composer-send` ∕ `chat-pending` ∕ `chat-subagent` / `:452` `file-links.mjs` / `:475`/:547 `file-links.test.mjs` / `:483` `timer-watch.mjs` / `:492` `timer-wake.test.mjs` 等）· `AGENT-LOOP-ASYNC-POOL.md` §6.30 条目 ~12 处（`:406` `timers.mjs` / `:408`/:462/:465/:466 timer-watch 族 / `:474`/:480/:482/:488/:490/:491）；② `MODEL-BENCH.md:1029` `bench/toolcall.mjs`「（拟新增）」——盘上**在**（`bench/toolcall.mjs` 实存）⇒ 同类候选（未列入派单）；③ `PROJECT.md` 同形缺行候选 `renderer/badges.mjs`（**23** · 在盘未列 §4.1——未列入派单十二档）；④ `PROJECT.md:910`（347 字符）存量超宽 = 非本席笔承前留册。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：B 批 §2 交付（首轮 18 项 + 补完轮 5 项）——文档收笔正确性与回落面（设计评审）。
**评审面**：11 档（批档 + AGENT-LOOP-ASYNC-POOL / desktop PROJECT·RENDERER·SHELL·IPC / CLI-DEBT / TOOLS / SESSION / MODEL-BENCH / WEBVIEW-PROTOCOL）。文件存在性核验 = glob（路径面）；未跑 doc-check，机检读数未复核。

**已核实落位（抽样）**：通道十八同拍（IPC.md §1:40/:70/:73 · RENDERER.md:32/:35/:90 · SHELL.md:42/:43 · PROJECT.md §10 BE:750）· SHELL.md:43「存续句」+:46=322 位 · WEBVIEW-PROTOCOL.md:231「已落」· CLI-DEBT.md:40/:41 指名批 · IPC.md:192 `session-slots.mjs:92` · AGENT-LOOP §6.30.12 T-TW23b:614 + 宿主三桩注:622 · PROJECT.md §2 KD-40④⑤:79 + §2.2 三查位:105-108 · §6.1 U217–U226:550-553 · §10 BN:760 · SESSION.md:184 指名 + :250 引文映射条 · 七档变更记录（PROJECT:993 / RENDERER:182 / SHELL:172 / IPC:332 / TOOLS:1138 / MODEL-BENCH:2181 / SESSION:1060）在位。

## 发现表（本轮：0🔴 / 6🟡 / 3🔵）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（标记面回落） | 🟡 | 本批第 8 项修了 WEBVIEW-PROTOCOL.md:231 的「（拟新增）」→「（已落）」，但同类标记在同族档的规范面仍大面积留存，且所指档经 glob 核实在盘：WEBVIEW-PROTOCOL.md:101（`thincoder-vscode/src/extension/timer-watch.mjs`「（拟新增）」，同档 §12:421 已记其实发射点 `:83`）· IPC.md:24（`suspension-drive.mjs`）· :29（`timer-watch.mjs`）· :30（`queued-input.mjs`）· :84（`notify.mjs`）· :94（`file-links.mjs`）· AGENT-LOOP-ASYNC-POOL.md:44（`queued-input.mjs`）· PROJECT.md:79（KD-40①）· :104（§2.2）· :666（§7 批注） | 按「档在盘 ⇒ 去标」同一判据做一次标记面 sweep（本批已对 MODEL-BENCH 用同一判据；判据文字在 SHELL.md:127 / IPC.md:259 的在册先例）；对确不落者（如 `electron-builder.yml`——已核未落，标记正确）保留并注「未落」 |
| 2 | 文档一致性（§4.1 自洽 + 单源完整度） | 🟡 | 本批第 1 项自称「§4.1 全表按盘实读重锚 + 越层段重写」，但同一节内新旧两读并存自相矛盾：PROJECT.md:177（`renderer/queue.mjs`「（拟新增）」）∥ :226（同档「队列归约落 …`queue.mjs`（**已落**）」）· :176（`i18n-views.mjs`「（拟新增）」）∥ :227（「第二档 …**已落**」）· :171（`questions.mjs`「（拟新增）」——在盘）· :252（`turn-chain.mjs`「（拟新增）」）∥ :230（「已落」）∥ §10 BL:758（「拟新增」）。另：已落档缺 §4.1 行——`src/main/timer-watch.mjs`（AGENT-LOOP §6.30.13:648 = 新档 79 · 现盘实读）在 §4.1 无行，仅存 §4.2:483 的设计估 ≈95「（拟新增）」；同形缺行 = `queued-input.mjs` / `turn-chain.mjs` / `file-links.mjs` / `page-read.mjs` / `queue.mjs` / `composer-send.mjs` / `i18n-views.mjs` / `subagent-reduce.mjs` / `views/chat-{chrome,pending,subagent}.mjs`（SHELL.md:65 与 RENDERER.md 以 §4.1 为逐档预算单源 ⇒ 单源缺行） | 统一 §4.1 预案列措辞（已落 ⇒ 去「拟新增」并落现值；未落 ⇒ 留标）；已落而未列档补 §4.1 行（或明示「并入 §4.2 逐批行、不入 §4.1 清单」以保单源可判） |
| 3 | 文档一致性（交付声明 vs 现文） | 🟡 | MODEL-BENCH.md 交付声明与现文不符：变更记录 :2181 称「§2.13 ∕ §3 本批表 ∕ KD-34 ∕ §5 …「（拟新增）」→「（已实现）」**×11** + 新载体测试档收正**×3**」，但现文仍存两处同类标记而所指档已在盘（glob 核实）：:858 行内 `bench/lib/params.mjs`「（拟新增 · 单源）」· :1470「新载体档（拟新增）」（`thincoder-core/test/model-specs-bench.test.mjs` 在盘） | 复点该批 11/3 的落点计数（含行内引用面，非仅表首列），补齐残余两处或把声明改为「逐列收正 ×11 + 行内引用待收」 |
| 4 | 协调项（父侧裁） | 🟡 | MODEL-BENCH.md:861 拆分预案目标 `bench/lib/report-params.mjs` ∕ `bench/lib/report-speed.mjs` 标「（拟新增）」，两档经 glob 核实在盘 ⇒ 与现盘相抵；本批按在册指示保留并在批档 §2 首轮第 15 条报父侧（批档:42 / 变更记录:2182 在册） | 裁定二择一：①两标记转「（已实现）」（在盘为实）；②明确「拆分预案目标一律留「拟新增」直至该档被单独触碰」并写入口径句，免下一轮同判 |
| 5 | 文档一致性（记录面坐标） | 🟡 | TOOLS.md:1138 的批内条目称「**§5 ∕ §6.13** 两处 `git/checkpoint.mjs` 转全形」，但现文按节核：§5（:145-149）无该路径、§6.13（:368-453）只有 `git-checkpoint.mjs`（另一档）；裸形 `git/checkpoint.mjs` 仍在 :105（§2.3 映射表行，已带「（迁移期引文）」） | 记录面条目回锚实际落点（或补落缺失的一处），并注明该条 `git/checkpoint.mjs` 是否属判不改的史实引文面 |
| 6 | 完整性（变更记录义务） | 🟡 | CLI-DEBT.md 在补完轮第 2 项被实际改动（:40/:41 指名批），但本档变更记录无 2026-09-28 条目（末条 = :103，2026-09-27），补完轮「变更记录补 6 档」清单亦未含它（批档:59）⇒ 验收③「每档变更记录 +1」未覆盖全部受触档。同表内 #377 同族歧义仍存：:58 ∕ :59「（**本批**触碰）」· :71「= **本批**补」· :72「**本批**窄射程锁 …（本批 #350 三件）」（落笔批未指名）；:35 ∕ :72 对 `thincoder-cli/test/memory-sweep-cli.test.mjs` 标「（拟新增）」而该档在盘（glob 核实） | 补 CLI-DEBT 变更记录一条（同批同笔）；把 B7/B8/T2/T3 的「本批」逐处指名落笔批（判据同本批第 12 项）；两处「（拟新增）」按档在盘去标 |
| 7 | 数值漂移 | 🔵 | AGENT-LOOP-ASYNC-POOL.md 自锚「全档实读 **741**」两处（:493 §6.30.6 文档行 · :658 §6.30.13 文档行），而本轮实读该档 = 745 行（含本批自加条目 :697）⇒ 自锚失真（位数级，非机制面） | 重锚该两处（或改注「as-of = 收尾轮」以明口径） |
| 8 | 数值漂移 | 🔵 | PROJECT.md §4.1 数值面两处自洽存疑：:236「**贴 300 层未越** =（无）」与同节值列并列（:211 值列 `settings` **300** ∕ `agent-host-suspension` **299**）；且同格内 `agent-host-suspension` 行内叙述 = **232**（:211）而值列 = **299**（:441 ∕ 变更记录:978 亦 232） | 统一读数时点标注（时点值 vs 现值），并按口径重述「贴 300 层」句（含 = 300 者是否入列） |
| 9 | 记录面序 | 🔵 | 变更记录插入位与各档既有排序约定不一致：MODEL-BENCH.md:2181（2026-09-28）插在升序段的 2026-09-27 条目（:2183 / :2185）之前 · RENDERER.md:182 插在 09-28 同批后续轮（:183 / :184）之间 | 按各档既有排序（升序追加 / 倒序置首）就位，或在记录首写一条排序口径句免下轮误排 |

**越界（non-blocking）**：① 机检读数（悬空 64→57→56 · 行宽 35→49→45→36）与规则外档（E2E-TESTING.md · TUI ×3 · ADVISOR-GUARDS.md · ENG-TOKEN-BINDING.md · VSC-DEBT.md）不在本轮评审面，未复核——需 doc-check 复跑与对应档自身轮次；② 存量为超宽行（SHELL.md:46 ∕ SESSION.md:175 等，批档:67 已按派单范围外留册）不判、不重开；③ 码面项（#370 ∕ #396 ∕ #378②③）按声明只报不动。

**VERDICT: pass**（0🔴 · 6🟡 · 3🔵——🟡/🔵 皆「报而修」类，不阻断；无机制级描述相抵）。
**计数**：🔴 0 · 🟡 6 · 🔵 3 = 9 条（编号 1–9）。

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 19:0x）
- **三条件齐备**：① 评审轮 1 pass（§3 · 🔴0 · 🟡6 · 🔵3）；② 修正轮落地并逐条核验（§2.3 · 9/9 + 父侧抽验三处读回 ✓：`IPC.md:24/:29` 去标全形 ∕ `PROJECT.md` §4.1 `:150/:153/:154` 补行 79 ∕ 71 ∕ 117 ∕ `AGENT-LOOP` `:493/:658` 重锚 745）；③ 机检净 0/0（悬空 56 ∕ 行宽 36）。
- 本批为**文档面批次**——无实施舱、无 token 环节；代签在既有授权范围内（用户「AB两条都走吧」+ 总纲委托）。残余在册见 §6.3。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 19:0x · 父侧）
- `node scripts/doc-check.mjs --root .` = 悬空 **56** ∕ 行宽 **36**（净 0/0；批内新笔超宽三处已当场拆分）；拟新增列报 28 ⇒ 26（−2）。
- 抽验读回：`IPC.md:24/:29`（去标 + 全形）✓ · `PROJECT.md` §4.1 `:150/:153/:154`（补行 79 ∕ 71 ∕ 117）✓ · `AGENT-LOOP-ASYNC-POOL.md:493/:658`（重锚 745）✓。
- 链：首轮 18 项（12✅ ∕ 3⚠️ ∕ 3❌）→ 评审 §3（9 条）→ 补完轮 5 项 → 修正轮 9 条（§2.3）——全数收口。

### 6.2 验收对照
- 18+5+9 项逐项落（§2 ∕ §2.3 在册）；未落面 = 码 ∕ 测试面三项（`#370` ∕ `#396` ∕ `#378②③`）+ `#373③`（测试档死引）+ `#374` 另族 sweep（均另轮 ∕ 随触碰在册）。

### 6.3 未决 ∕ 移交（在册不丢）
- **记录面标记残余**（父侧裁 = **留册**；理由 = 逐批表 ∕ 变更记录 = as-of 历史面）：`PROJECT.md` §4.2 ∕ §7 面 ~25 处 · `AGENT-LOOP-ASYNC-POOL.md` §6.30 面 ~12 处 · `MODEL-BENCH.md:1029`（`bench/toolcall.mjs`，盘上在）。
- `PROJECT.md` §4.1 缺行候选：`renderer/badges.mjs`（**23** · 在盘未列——随该档下次触碰补）。
- `PROJECT.md:910` 存量超宽 347 字符（非本批笔）——留册。
- `#374` 旧编号族另族 sweep（`advisor/**` 37/6 ∕ `tools/**` 23/8 ∕ VSC 面板族）= 另轮。

### 6.4 收口同步清单（D7）
- 角色表 = 六段齐；指针（§1 ∕ §2 ∕ §2.3 ∕ §3 ∕ §4 ∕ §6）全解析；变更记录 = 受触各档 +1 笔（两轮合计）；台账 = `#516`（+ `#511` 并入 + 归集八项）随本收口核销。
- **前批遗留交叉核对**：align-3 等 = 已收口冻结 ✓；无「条目已结而锚批档未闭」项。
- **本批 = 交付完成 + 父侧亲验通过 ⇒ 已收口 2026-09-28（记录冻结）。**
