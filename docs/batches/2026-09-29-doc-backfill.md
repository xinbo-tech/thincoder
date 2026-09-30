# 2026-09-29 · doc-backfill（文档锚位 ∕ 坐标 ∕ 键链回填族）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 挂账族集中处置（用户 2026-09-29 16:52「那台账里的挂的也都处理掉啊」）——文档回填族载体：台账 #378 ∕ #560 ∕ #594 ∕ #598（文档面）∥ #612 ∕ #381。
> 台账 = #378 ∕ #560 ∕ #594 ∕ #598（文档面部分）∥ #612 ∕ #381（归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 本批（父侧 · 2026-09-29 16:5x）

- **来源** = 挂账族集中处置令（用户 16:52「那台账里的挂的也都处理掉啊」）；授权 = 13:52 全权（代点火 + 代批准，自缚三条件）。
- **条目（六行）**：**#378**（镜像撤写措辞残余：`docs/core/design/TOOLS.md:81` ∕ `:122` + `ENG-TOKEN-BINDING.md:100` + `WEBVIEW-PROTOCOL.md:111`）· **#560**（render-core 发布档三处补落：`docs/RELEASE.md` 不入发布序列句 + `thincoder/README.md` 地图行 + `docs/core/design/ARCHITECTURE.md` 模块表行 + `WEBVIEW.md` ∕ VSC `AGENTS.md` 两指针复核）· **#594**（坐标漂移族残留——CORE-UNIFICATION 两微漂 ∕ #113 setup 坐标 ∕ #387 死测试锚 ∕ PROJECT.md:157 275⇒276 ∕ PROJECT.md:111-112 编号残留 ∕ 措辞两形 ∕ E2E-TESTING.md:102 骨架锚）· **#598**（stall-indicator 文档回填族：TUI §7.7 一致性表 ∕ §2.3 行数 ∕ WEBVIEW-PROTOCOL 键表 24⇒25 ∕ UI 段计数 16⇒17 + 拍值句 ∕ 拍值 2s 残留句 ∕ PROJECT.md 播种面族六处）· **#612**（MULTI-INSTANCE-COLLAB 四死档名 + 499⇒254 读数）· **#381**（VSC 需求档 advisor.provider ∕ model 缺席语义——**父侧裁定见 1.2**）。
- **边界**：#598 之码注释残余（`views/chrome.mjs:8` ∕ `renderer/i18n.mjs:235,392`——`mount-status.mjs:6,15` 已由父侧修毕）**不纳入**（码面另轮；`i18n.mjs` 现 500 顶格零余量）；#378 之 `mode-buttons.js:3-4` 行已随 B1 清（实核在场）。

### 1.2 #381 语义裁定（父侧 · 需求档笔权 · 2026-09-29）

- **裁定 = 缺席 ⇒ 保持现值（不改动）**：面板载荷不携 `advisor.provider` ∕ `advisor.model` 时，写面**不得**以缺席推断清空 ∕ 拒——理由 = 面板更新面「携则写、缺则不动」单则（保守不破坏面）。
- 设计轮按现行面板载荷实核并落 `docs/vsc/requirements/WEBVIEW.md`（P2-4 余项）；连带写面（`settings-panel-write.mjs`）若相抵 ⇒ **列实施面报父侧**（码面另配 token 轮，不在本批默认射程）。

### 1.3 授权口径

- doc 面 = eng-designer（本批主体：设计面收正零产品码）；实施 = eng-designer 直落（doc 面）——评审 ∕ 代签后。
- 验收 = 逐处 file:line 落点 + `node scripts/doc-check.mjs` 本批写域零新增红 + 读回核实。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（评审 #23 修正块已落（§2.13）· 波 1 实施记录已落（§2.15）；§2.12 #2 = 父侧自办 ∕ #4 = 已按主裁落位（可 revert））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与设计口径

- **覆盖** = 台账 #378 ∕ #560 ∕ #594 ∕ #598 ∕ #612 ∕ #381 六行全量；本批 = **纯 doc 面回填**（设计档 ∕ 需求档落点 ∕ 产品文本），产出 = 逐行修法表；**本轮零改动（除本档 §2）**。
- **坐标口径 = 届盘实读（2026-09-29 本设计轮亲读）**。台账 ∕ 批档所载 as-of 坐标作参考；漂移处按现盘重锚（不一致处逐处注明）。行数口径 = 内容行数（文末换行不计）。
- **判据口径** = 可机判优先（grep 词面 ∕ 行号实读对照）；不可机判者注明「读回」。
- **边界**（沿 §1.1 批令）：产品码 ∕ 测试件**零写**；`thincoder-desktop/renderer/i18n.mjs`（500 顶格）零触；`docs/batches/**` 除本档零写；语义收正只按各行裁定口径（不扩面）。码面残余单列 §2.10。
- **验收门** = 逐处 file:line 落点 + `node scripts/doc-check.mjs` 本批写域零新增红 + 读回核实。

### 2.2 #378 镜像撤写措辞残余（4 处）

| # | 处（届盘实读） | 现行 | 应然（最小改动） | 判据（可机判） | 落点 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/TOOLS.md:82`（#91 行） | 「以 CLI 为准（工程模式位只进会话）+ VSC 的**持久化镜像** / 面板提示按端注入（④ 段）｜分叉 ＝ VSC **双写**（会话槽 + `config.json` 的 `agent.engineering` `src/agent-tools/eng.mjs:92-104`）⇒ **跨端副作用**」（未标注退役的现役断言） | 按镜像撤写口径收正：镜像写标「已退役」（2026-09-25 config 镜像写收口批）+ 现体坐标（`thincoder-vscode/src/agent/setup-tooltable.mjs:84-93`——`configureEngMirror({onToggle})` = 槽写 + 结果尾提示串；注释逐字「no config mirror」居 `:91`）+ 跨端副作用句收正为已消除 | 该行不得含**未标注退役**的 config.json 镜像写断言（逐行读回） | TOOLS.md |
| 2 | `docs/core/design/TOOLS.md:123`（A6 行） | 「**双写**：会话槽 + `config.json` 的 `agent.engineering`（`src/agent-tools/eng.mjs:92-104`）」＋影响面「① **跨端副作用**（**现状**：在 VSC 开一次工程模式，会改变 CLI 下次启动的模式）」 | 同口径收正（双写 ⇒ 镜像写已退役 + 现体；「现状」句收正） | 同 #1 | TOOLS.md |
| 3 | `docs/core/design/ENG-TOKEN-BINDING.md:100` | 「（镜像双写已退役——现体 = `thincoder-vscode/src/agent/setup-tooltable.mjs:88-97`）」——**措辞已收正**（2026-09-28 文档回填与卫生轮）；余 = **坐标微漂** | 坐标收正 `:88-97` ⇒ `:84-93`（届盘实读：import `:84` + onToggle 体 `:85-93`） | 引域与现盘行域相符（读回对照） | ENG-TOKEN-BINDING.md |
| 4 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:113`（`eng` 工具行） | 「`configureEngMirror` 端侧实现只做槽写 + 结果尾提示串，**零 webview 推送**（`…setup-tooltable.mjs:88-97`；…）」——**措辞已收正**（2026-09-25 轮删「+ config 镜像」）；余 = **坐标微漂** | 坐标收正 `:88-97` ⇒ `:84-93` | 同 #3 | WEBVIEW-PROTOCOL.md |

补充：`thincoder-vscode/webview/mode-buttons.js:3-4`（码面）= 已随 B1 清（实核在场）——**零改**，不入本表。

### 2.3 #560 render-core 发布档与地图补落（3 档补行 + 2 指针复核）

| # | 处（届盘实读） | 现行 | 应然（最小改动） | 判据（可机判） | 落点 |
|---|---|---|---|---|---|
| 1 | `docs/RELEASE.md`（现读全档 `render-core` 零命中） | 无 render-core 语句 | §5.5 步 1（「物化核依赖」段）邻位**补段**：**render-core 不入发布序列（永不发布——`private: true`）**；两打包窗（VSC vsix ∕ 桌面产物）内嵌形 = **link 形 + `--follow-symlinks`**（`npm install --install-links` 物化对其不可执行——vsce 硬红；R1 打包窗实测 475 件）；内嵌面收窄 = 仅运行必需（`.mjs` + `package.json`）；`@thincoder/core` 发布前物化纪律不动——单源指针 = `docs/render-core/design/RENDER-CORE.md` §1.3 ∕ §10 B | RELEASE.md 全档含 `render-core` ∧ `不入发布序列`（现读零命中 ⇒ 补后 ≥1） | RELEASE.md |
| 2 | `README.md`（仓根 · Layout 表；现读零 render-core） | Layout 表四行（cli ∕ vsc ∕ CI ∕ dotfiles） | Layout 表**补行** `thincoder-render-core/`（What it is = 共享渲染核（浏览器原语；两端内嵌带发）；Release chain = —（永不发布）） | README.md 含 `thincoder-render-core` | README.md（仓根） |
| 3 | `docs/core/design/ARCHITECTURE.md`（现读零 render-core） | §3 模块地图树无该目录；§4 模块接口速览无该行 | §3 树**补块** `thincoder-render-core/`（共享包位——`thincoder-core/` 邻位）+ §4 表**补一行**（一句话 = 共享渲染核（DOM 构件 + 纯函数）；详细设计 = `docs/render-core/design/RENDER-CORE.md`） | ARCHITECTURE.md 含 `thincoder-render-core` ∧ `RENDER-CORE.md` | ARCHITECTURE.md |
| 4 | 指针复核：`docs/vsc/design/WEBVIEW.md`（R1 漂移点名处） | 模块表已按 R1 ∕ R2 收正（`:69` R1 迁核注含「`highlight.js` 删除」；`:50-66` 各行已含换接注） | **复核结论 = 已在位（零改）** | 该档无 `highlight.js` 现役行（现读仅 `:69` 一处带史实谓词的迁核注） | ——（零改） |
| 5 | 指针复核：`thincoder-vscode/AGENTS.md`（R1 漂移点名处） | 模块图已含 render-core 单源注（`:59-66`） | **复核结论 = 已在位（零改）** | 该档含 `@thincoder/render-core` 指向 ∧ `highlight` 零命中 | ——（零改） |

只报（不扩面）：仓根 README 的 Layout 表另缺 `thincoder-core/` ∕ `thincoder-desktop/` 行列——本批只补 render-core 行；其余缺行父侧另裁（见 §2.12）。

### 2.4 #594 坐标漂移族残留（7 项）

| # | 处（届盘实读） | 现行 | 应然（最小改动） | 判据（可机判） | 落点 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/CORE-UNIFICATION.md:1349` ∕ `:1350`（＋同族 `:1351`） | `:1349`「VSC `…setup-tooltable.mjs:88-89` 供值 `configureEngMirror`」；`:1350`「…`:80` 供值 `vscodeDiagnosticsSection`」；`:1351`「…`:86-87` 供值 `configureSkillLoader`」 | 逐处收正为届盘实读：`:1349` ⇒ `:84-85`；`:1350` ⇒ `:76`；`:1351` ⇒ `:82-83`（`:1351` = 同族第三处，本设计轮实扫发现追加——见 §2.12） | 三处引域行号与现盘读回对照相等 | CORE-UNIFICATION.md |
| 2 | `CORE-UNIFICATION.md:1326`（#113 行） | 「VSC 采集 ∕ 供给：`thincoder-vscode/src/extension/editor-context.mjs` + `thincoder-vscode/src/agent/setup.mjs:412/:418`」（随 parity-b1 重写失效） | 收正现体 = `thincoder-vscode/src/extension/panel-turn-loop.mjs:30`（采集接线——调用点 `:166`）+ `panel-session.mjs:18`（剥离接线——调用点 `:185`） | 引档 + 符号现盘可解析（读回对照） | CORE-UNIFICATION.md |
| 3 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:89` ∕ `:91` | `:89` 测试档行含 `thincoder-vscode/test/zero-sync-exec.test.mjs`（零同步 exec 扫描——端半）；`:91`「名册机检 = 同档」 | **退场标注**：该档已随 2026-09-28 测试树全清重置退场（VSC `test/` 仅 5 档）⇒ 两处补「（随 2026-09-28 测试树全清重置退场——重建时恢复）」形标注（沿 #586 恢复条件口径） | 两处引用均带退场标注（无未标注死引用）；doc-check 悬空零新增 | MULTI-INSTANCE-COLLAB.md |
| 4 | `docs/desktop/design/PROJECT.md:617`（§4.2「实读落值」行）∔ `:164`（§4.1 行） | `:617` turn-driver = **275**（与 `:164` 的 276 不一致，皆陈旧） | 两处统一收正为**届盘实读 287**（本设计轮亲数；内容行数口径；与台账所载 276 的差 = 04:16 后他批净增——实施轮落笔前复读为准） | 两处引值同值 ∧ 与现盘实读相等 | PROJECT.md |
| 5 | `PROJECT.md` §2.2 邻区（台账 as-of `:111-112`；现址未届盘定位） | 「R3 ∕ #517 前编号残留」（台账注记） | **复核待做**：届盘全档 `#517` 命中三处（`:81` KD-41 登记 ∕ `:168` 行内 ∕ `:970` §10 BB 行——皆现役并载）；`R3` 命中皆「轮号 + 台账号并载」形。实施轮按「届盘映射候选」逐处首读复核：判「前编号」⇒ 改指；判现役 ⇒ 零改（防双执行） | 逐处复读清单 + 结论落 §5 | PROJECT.md |
| 6 | 措辞两形「会话控制条目」∥「会话控制面条目」 | 两形并存；「会话控制面条目」余 **8 处**：`SHELL.md:33` ∕ `IPC.md:87 ∕ :165 ∕ :166` ∕ `UI.md:21 ∕ :22 ∕ :23 ∕ :33`（台账据 as-of 仅记 SHELL:33——余 7 处为本轮实扫追加） | 统一为「会话控制条目」（现役形 = 码面 + `PROJECT.md:179`；术语裁定单源 = `docs/batches/2026-09-29-parity-b9-session.md` §2.8） | 全仓文档面 grep `会话控制面条目` = 0 | SHELL.md ∕ IPC.md ∕ UI.md |
| 7 | `docs/desktop/design/E2E-TESTING.md:102`（§3.5 步 2） | 骨架三锚含 `[data-slot="projects"]`（左列 · `thincoder-desktop/renderer/app.mjs:48`）——槽集零该锚（R13 原「左列」面裁撤） | 收正为现行锚：`[data-slot="session-control"]`（会话控制条——骨架 `thincoder-desktop/renderer/index.html:39`；常量 = `mount-sessions.mjs:44`）；三锚 = session-control ∕ flow ∕ composer | 该句锚 ∈ 骨架槽集（`index.html` `data-slot` 集）∧ 档内无 `projects` 锚残引 | E2E-TESTING.md |

### 2.5 #598 stall-indicator 文档回填族（六族）

**① TUI.md §7.7 一致性表坐标刷新**（`docs/cli/design/TUI.md:724-728`；括号内 = 届盘实读对照）：

| 表行 | 行号 | 现行 | 应然 |
|---|---|---|---|
| 显示位 | :724 | `render-frame.mjs:396` | `:409`（`statusText` 定义行） |
| 起算锚 | :725 | `agent-turn.mjs:141` | `:144`（`state.lastOutputAt` 写点） |
| 重置点①流式 | :726 | `:103` ∕ `:111` | `:104` ∕ `:113` |
| 重置点②工具 | :727 | `:129` ∕ `:181` | `:132` ∕ `:185`（＋补第三坐标 `:333`——`onToolOutput` 输出流写点） |
| 重置点③子代理 | :728 | `:97-112` | 单点 `:114`（`ensureSubTaskKey` 写点）+ 块状态两处 `:175` ∕ `:197` + **压缩面板四填充点 `:417` ∕ `:428` ∕ `:448` ∕ `:461`**（`subagent-blocks.mjs`；判据 = 逐坐标读回对照） |

**①-b 行数随动（六档）**：i18n（core）107 ⇒ **108** ∕ render-frame 435 ⇒ **447** ∕ agent-turn 416 ⇒ **418** ∕ tool-events 补临读 = **454** ∕ subagent-blocks 补临读 = **462** ∕ tui-state 补行 = **66**（净 +1 后）。落点：四 CLI 档 → `docs/cli/design/CLI-DEBT.md` §2.1 表 A（A9 453⇒462 ∕ A10 449⇒454 ∕ A12 434⇒447 ∕ A16 407⇒418——该册自载「单一活面 · 本档不复读读数」）；i18n → `CORE-UNIFICATION.md` §2.8.1 行 11（106⇒108）。tui-state 无适格登记册（CLI-DEBT 表 A 门槛 ≥400 ∕ 表 B 无在册裁定 ∕ §1-4 <300 不补）⇒ **补行落点 = §7.7 起算锚行补字段声明坐标 `tui-state.mjs:43`（待父侧确认，见 §2.12）**。

**② WEBVIEW-PROTOCOL §6.3 键表**：`:251` 头「26 键」（现表无 `status.quiet`；同批两键 `sub.follow.*` 已在）⇒ **27 键**（+`status.quiet`：zh「已静默 ${s}s」∕ en「Quiet ${s}s」——**核容器键**；登记注 + 消费面 = 静默段——样式沿 `status.timer` 行）。判据 = 表含该键 ∧ 头计数 = 表行数（27）。（台账口径「24⇒25」为 09-29 04:53 快照；`sub.follow.*` 两键随让位修复批已入 ⇒ 现基 26。）

**③ UI.md**（`docs/desktop/design/UI.md`）：`:21`「＝ **16 段**」⇒ **17 段**（含 `quiet`——沿本档 `:526` 已载句单源）；`:315`「**2s 走时刷新不落**」⇒ 1s 形（走时刷新已落）；`:395`「**2s 心跳** ∕ **2s 拍** ∕ 秒数逐 **2s** 走」⇒ **1s**（单源 = TUI.md §7.7 ∕ 本档 `:528-529`）。判据 = UI.md 无 2s 现役拍值断言（历史变更记录行除外）∧ 段计数断言 = 17。

**④ 拍值 2s 残留（vsc `docs/vsc/design/WEBVIEW.md`）**：`:52`（「`_panelTimer`（2s）」）∕ `:243`（「事件驱动 + 2 s 同点刷」）∕ `:246`（「2 s 同点刷 live 块头」）⇒ **1s**。判据 = 三处无 2s 现役拍值（台账 as-of 坐标 :161 ∕ :178 ∕ :246——现址按届盘重锚）。

**④-b 码面同族（不纳入——另轮）**：`thincoder-vscode/webview/activity.js:146`（注释「既有 2s」）· `thincoder-desktop/renderer/subagent-reduce.mjs:88`（注释「2 s 拍残刷」——届盘核讫 = 同族）· `:161` ∕ `src/main/*`（宿主存活投影——**另机制勿混**）。

**⑤ 域外注释残留（不纳入——码面另轮）**：`mount-status.mjs:6,15`（已由父侧修毕）· `renderer/views/chrome.mjs:8`（「承载 16 段」残述）· `renderer/i18n.mjs:235,392`（D22 历史句残述；该档 500 顶格零余量）。

**⑥ PROJECT.md 播种面族同源残述（六处 + 本设计轮实扫追加 1 处）**：`:64`（KD-25「承载 16」⇒ **17**）· `:75`（KD-36「CLI 16 段闭集」⇒ **17**）· `:731`（D17 行「16 段逐项裁定表 ∕ 承载 16」⇒ **17**）· `:736`（D22 行「16 段」⇒ **17**）· `:824`（T-DSK33「十六段 ∕ 承载 16 段 ∕ 段集 16 计数锁」⇒ **17**）· `:960`（AR 行「播种 2 ∕ 不播种 10」⇒「**播种 2 ∕ 不播种 11**」——沿 UI.md `:171` 单源：13 段 = 17−4）＋**追加 `:909`**（「`tokens` ∕ `timers` 等 10 段不属播种面」⇒ **11 段**——同源残述）。判据 = 各处词面与单源逐字相符。

### 2.6 #612 MULTI-INSTANCE-COLLAB 同族残件

| # | 处 | 现行 | 应然 | 判据 |
|---|---|---|---|---|
| 1 | `docs/core/design/MULTI-INSTANCE-COLLAB.md:225` ∕ `:258` ∕ `:299` ∕ `:301`（四文件级引用） | 钩点 ∕ 门均引 `thincoder-core/agent/dispatch.mjs` | 收正现体 = `thincoder-core/agent/dispatch-run.mjs`（2026-09-28 拆分：写前 `:52` ∕ 写后 `:65` ∕ `:115`；对照 = 同档 `:222` ∕ `:229` 已用现体形） | 全档 `agent/dispatch.mjs` 引用 = 0（`dispatch-gates.mjs` ∕ `dispatch-run.mjs` 形保留） |
| 2 | `:257`（钩点行读数） | 「（写前 ∕ 写后两处——既有钩子内接线，只换调用行 + 3 行；该档 **499** 行贴硬限——距 500 余 1 行）」 | 读数收正：**2026-09-28 拆分后** `dispatch.mjs` = **254** ∕ `dispatch-run.mjs` = **167**（原 498/499 贴硬限面已消解） | 引值 = 届盘实读（254 ∕ 167，内容行数口径） |

### 2.7 #381 缺席语义落（需求档）

| # | 处 | 现行 | 应然 | 判据 | 落点 |
|---|---|---|---|---|---|
| 1 | `docs/vsc/requirements/WEBVIEW.md:80-81`（P2-4 余项行） | `:81`「余项（advisor `provider` / `model` 等字段）在册」——语义未定 | 记入父侧裁定（§1.2）：**缺席 ⇒ 保持现值（不改动）**——面板载荷不携该两键时，写面不得以缺席推断清空 ∕ 拒（保守不破坏面；写面 merge =「携则写、缺则不动」单则） | 该档含裁定句（词面「保持现值」∧「缺席」） | WEBVIEW.md（需求档——**笔权 = 主 agent**；落地人待父侧确认，见 §2.12） |

**写面实核（设计轮 · 与裁定对照）**：`thincoder-vscode/src/extension/settings-panel-write.mjs:108-131` 现体 = **缺键从盘回填（保持现值）∧ 显式 `null` ⇒ 删键**——**与裁定相符（零码面项）**。载荷侧只报：`webview/settings-agent.js:122-126` 中 advisor `provider` ∕ `model` **现恒携**（slot 缺席 ⇒ `null` 形 =「显式清空」语义形）——裁定覆盖的是「不携」形；slot 缺席形是否收正 = 另面（不扩面）。

### 2.8 受影响文件总表 + 实施序（分批）

**受影响文件（16 档设计面 + 1 档需求面）**：① `docs/core/design/TOOLS.md` · ② `docs/core/design/ENG-TOKEN-BINDING.md` · ③ `docs/vsc/design/WEBVIEW-PROTOCOL.md` · ④ `docs/RELEASE.md` · ⑤ `README.md`（仓根）· ⑥ `docs/core/design/ARCHITECTURE.md` · ⑦ `docs/desktop/design/PROJECT.md` · ⑧ `docs/desktop/design/UI.md` · ⑨ `docs/desktop/design/SHELL.md` · ⑩ `docs/desktop/design/IPC.md` · ⑪ `docs/desktop/design/E2E-TESTING.md` · ⑫ `docs/cli/design/TUI.md` · ⑬ `docs/cli/design/CLI-DEBT.md` · ⑭ `docs/core/design/MULTI-INSTANCE-COLLAB.md` · ⑮ `docs/vsc/design/WEBVIEW.md` · ⑯ `docs/core/design/CORE-UNIFICATION.md`（波 2）。

**实施序（>15 档 ⇒ 分批报父侧 · 按冲突面切）**：

- **波 1（15 档 · 无冲突 · 一轮可落）**：①–⑮ 全数（② ∕ ③ ∕ ④ ∕ ⑦ ∕ ⑧ ∕ ⑨ ∕ ⑩ ∕ ⑪ ∕ ⑫ ∕ ⑬ ∕ ⑭ ∕ ⑮ ＋ ① ∕ ⑤ ∕ ⑥）。逐档改动点 = 上表；同批收变更记录行。
- **波 2（冲突面 · 排序 = 父侧）**：⑯ `docs/core/design/CORE-UNIFICATION.md`——另有在途批（residuals-round2 的 `:1123` 行面）；与本批 `:1326` ∕ `:1349-1351` ∕ §2.8.1 的改动同档 ⇒ **按文件串行**（他批落定后本批落地，或父侧定序）。
- **波 3（笔权面）**：`docs/vsc/requirements/WEBVIEW.md`（§2.7）——需求档笔权 = 主 agent；落地人待确认（§2.12）。

### 2.9 验收对照（回指）

| # | 本批验收（批令） | 落点 |
|---|---|---|
| ① | §2 修法表覆盖六行全量（每行 file:line 逐处、无空值） | §2.2–§2.7（#594⑤ ∕ tui-state 两处为「复核 ∕ 落点待确认」形，非空值——已给复核口径与候选） |
| ② | 受影响文件总表 + 实施序 | §2.8（16 档 + 1 需求档；三波） |
| ③ | 每处判据可机判（或注明读回） | 逐表判据列；「读回」项 = §2.2#1/#2 行级读回 · §2.4#5 复读 · §2.7 |
| ④ | 零产品码改动（本轮） | 除本档 §2 外零写；码面清单 = §2.10 |

### 2.10 不纳入（码面另轮——本批零写）

| 项 | 处 | 状态 |
|---|---|---|
| #378 `mode-buttons.js:3-4` | `thincoder-vscode/webview/` | 已随 B1 清（实核在场）——零改 |
| #598 ④-b 拍值注释 | `webview/activity.js:146` · `desktop/renderer/subagent-reduce.mjs:88` | 码面（另轮）；`:161` ∕ `src/main/*` = 宿主存活投影另机制（勿混） |
| #598 ⑤ 域外注释 | `views/chrome.mjs:8` · `renderer/i18n.mjs:235,392`（`mount-status.mjs:6,15` 已修） | 码面（另轮）；`i18n.mjs` 500 顶格零余量 |
| #381 载荷侧 slot 缺席形 | `webview/settings-agent.js:122-126` | 只报（裁定未覆盖面） |

### 2.11 关键决策记录

| # | 决策 | 理由 ∕ 备选 |
|---|---|---|
| KD-1 | #378 四处应然定形 = 两处「措辞收正（标退役 + 现体坐标）」+ 两处「坐标微漂收正」 | 沿 2026-09-25 ∕ 2026-09-28 两轮已收正口径续行；核定 = 届盘实读（TOOLS.md 两处仍为未标退役的现役断言；ENG-TB ∕ WV-PROTOCOL 两处措辞已清、余坐标） |
| KD-2 | 措辞两形统一方向 = 「会话控制条目」 | 现役形 = 码面 + `PROJECT.md:179`（B9 §2.8 术语裁定）；备选「会话控制面条目」被否（仅 8 处文档面残形） |
| KD-3 | 行数随动落点 = CLI-DEBT §2.1（四行）+ CORE-UNIFICATION §2.8.1（一行） | 两册自载「单一活面」（TUI.md `:487` 明示「本档不复读读数」）；备选「落 TUI.md」被否（违背其自载口径） |
| KD-4 | #381 写面 = 相符零改（不列码面项） | `settings-panel-write.mjs` 缺键回填 = 即裁定语义；载荷侧 slot 缺席形只报 |
| KD-5 | E2E 骨架锚改指 `session-control` | 槽集实读（`index.html:39`）；`projects` 槽已随 R13 退场 |
| KD-6 | 不扩面清单 = README 另缺两行（core ∕ desktop）· 载荷侧 null 形 · #594⑤ 现址未定位 | 只报不改；处置归父侧（§2.12） |

### 2.12 上抛 ∕ 未决项

1. **冲突注**：`CORE-UNIFICATION.md` 另有在途批（residuals-round2 `:1123` 面）——与本批三处 + §2.8.1 同档 ⇒ 实施排序 = 父侧（波 2）。
2. **#381 需求档落笔人**：需求档笔权 = 主 agent；本批 §2.7 裁定内容由谁落 `docs/vsc/requirements/WEBVIEW.md`——待父侧确认（若委派 eng-designer，实施轮照落）。
3. **#594⑤ 现址未定位**：台账 as-of `:111-112` 已漂移；届盘疑似面 = §4.1 turn-face 行（`:168`「R3 撞帽三径 + 会话标题接线（#517）」形）——实施轮逐处首读复核，或父侧指认目标。
4. **tui-state 补行落点**：无适格登记册（门槛 ∕ 裁定均不满足）——本设计轮裁 = §7.7 起算锚行补声明坐标；备选 = CLI-DEBT 特例行 —— 待父侧确认。
5. **发现追加（本设计轮实扫）**：CORE-UNIFICATION `:1351` 同族第三处 · 措辞族 8 处（台账仅记 1） · PROJECT.md `:909` 播种面第 7 处 · turn-driver 现读 **287**（台账口径 276 已陈旧）。
6. **README 另缺行**：`thincoder-core/` ∕ `thincoder-desktop/` 行列缺失（本批只补 render-core 行）——另裁。
7. **#378 ∕ #598 码面残余**（§2.10）——另轮载体（不占本批）。

### 2.13 修正块（评审 #23 · 六条全数受理 · 2026-09-29）

来源 = 本档 §3 轮次 1（评审 #23：pass · 🔴0 · 🟡4 · 🔵2）；父侧裁定全数受理（发现 1 ∕ 3 ∕ 4 处置细化）。本块 = §2 就地修正（发现 1..6 逐号）；**本修正轮写面 = 本档 §2 单写**（产品码 ∕ 他档零写）。本块全部坐标 = 2026-09-29 17:2x 届盘实读。

**发现 1 → §2.3#3 改「已落复核」形**
- 届盘实读：`docs/core/design/ARCHITECTURE.md:131`（§4 模块接口速览表尾 render-core 行——desktop-residuals-sweep 批 · 波 D · 台账 #560 落位）+ `:217`（该批变更记录行）——**均在盘**。
- 应然收窄 = **仅 §3 树补块**（`thincoder-render-core/`；树块 `:37–:87` 现读零该目录；补位 = `thincoder-core/` 邻位）。**§4 行零改**（防同账双执行）。
- 判据（改）：`ARCHITECTURE.md` §3 树含 `thincoder-render-core/`。（§2.3#3 原「应然 ∕ 判据」两格以本块为准。）
- §2.8 受影响文件（⑥）不变——改动点收窄为 §3 树补块 + 本批变更记录行。

**发现 2 → PROJECT.md 行锚重锚（词面首读 · 本轮实读）**
- 口径：父侧所转 `:741 ∕ :746 ∕ :834 ∕ :970 ∕ :919 ∕ :615` 系评审轮值；盘面自评审轮后再行移（§2.5⑥ 族 +15、§2.4#4 两处 +1）⇒ **以本轮实读为准**；实施轮落笔前复读。
- §2.5⑥ 七处（重出）：`:64`（KD-25「承载 16 / 旁置 1 / 不适用 1 行」⇒ 承载 17）· `:75`（KD-36「CLI 16 段闭集」⇒ 17）· `:756`（D17 行「16 段逐项裁定表 ∕ 承载 16」⇒ 17）· `:761`（D22 行「16 段」⇒ 17）· `:849`（T-DSK33「状态行十六段 ∕ 承载 16 段 ∕ 段集 16 计数锁」⇒ 17）· `:985`（AR 行「播种 2 / 不播种 10」⇒「播种 2 / 不播种 11」——沿 UI.md `:171` 单源：13 段 = 17−4）＋ `:934`（「`tokens` / `timers` 等 10 段不属播种面」⇒ 11 段）。判据不变（各处词面与单源逐字相符）。
- §2.4#4：行锚 `:616`（§4.2「实读落值」行——turn-driver **275**）∔ `:165`（§4.1 行——**276**）；两处统一收正 **287** 不变（实施落笔前复读为准）。
- §2.4#5：#517 复核清单重列 = `:81`（KD-41 行）· `:169`（turn-face §4.1 行——回合尾结算 `settleTurn` 段）· `:1268`（变更记录行）——皆现役并载；原记「§10 BB 行」删（该行实载 #505，非 #517）。R3 句「轮号 + 台账号并载」形 = 评审轮核讫，不变。

**发现 3 → §2.5④ 扩族 + 另机制显式排除**
- 五处逐处实读（评审所点；现盘 +1）：`:162`（「2 s 同点刷与覆盖式重建均不改…」）· `:169`（「消息驱动与 2 s 拍同值」）· `:179`（「`usage` 消息驱动 + 2 s 拍（`running` 门内）」）· `:250`（「两刷新路径（2 s 拍 / 覆盖式重建）」）· `:255`（「2 s 拍与覆盖式重建同源」）——**均属同机制族**（`_panelTimer` 同点刷 ∕ 覆盖式重建两路径）⇒ **全数扩入修法表**（2 s ⇒ 1 s；单源 = `docs/vsc/design/WEBVIEW.md:187` 已载 1s 句 ∕ `docs/cli/design/TUI.md` §7.7 跳秒行）。
- 族表全量（九处 · 收正后）：`WEBVIEW.md` `:53`（`panels` 表行「`_panelTimer`（2s）」⇒（1s））· `:162` · `:169` · `:179` · `:247`（「① 2 s 同点刷 live 块头」）· `:250` · `:255`；`docs/vsc/design/WEBVIEW-PROTOCOL.md` `:243`（计时行「事件驱动 + 2 s 同点刷」⇒ 1 s——原记误归 `WEBVIEW.md:243`，现址实读在协议档；只收值面、引坐标不动）＋ `:357`（U-P6 行「elapsed 刷新节拍（复用 2s）」⇒ 1s——本轮实扫追加、同族）。
- 另机制显式排除（档名 + 机制名全形——禁裸坐标；零改）——**宿主存活投影（出生自愈心跳）**：① VSC 侧 = `docs/vsc/design/WEBVIEW.md:309`（＋同段 `:314` ∕ `:315` · 用例表 `:363-:366` · 决策 `:473` ∕ `:477`）；② 桌面侧 = `thincoder-desktop/src/main/subagent-face.mjs`（拍体宿主）· `thincoder-desktop/src/main/agent-bridge.mjs`（挂点）· `thincoder-desktop/src/main/ipc.mjs` · `thincoder-desktop/src/main/turn-driver.mjs`（清点面）· `thincoder-desktop/renderer/events.mjs:242` · `thincoder-desktop/renderer/subagent-reduce.mjs:161`。2 s = 核件单源正确现役值（`thincoder-core/agent/live-beat.mjs:20` `LIVE_HEARTBEAT_MS = 2000`）。修订 §2.5④-b ∕ §2.10 两处裸坐标（`:161` ⇒ 全形；`src/main/*` ⇒ 全形）。
- 判据（改）：两档（`WEBVIEW.md` ∕ `WEBVIEW-PROTOCOL.md`）全档 grep「2 s 拍 ∕ 2 s 同点刷」⇒ 现役命中零（排除 = 变更记录行 ∥ 另机制已注行）；族表九处逐处读回 = 1s 形。

**发现 4 → §2.5③ · UI.md:21 该格计数面单一「17 段」形**
- 应然（三件）：①「**15 段逐项裁定表**」⇒「**17 段逐项裁定表**」；②「**屏面为准重审定形（本批）= 16 段**」⇒「**定形 = 17 段**」（单源标注 = 本档 §1「本批注（状态栏对齐 · 屏面为准）」＋「本批注（停滞轻显形 · 2026-09-29）」）；③「**（承载 16 ⇒ 17）**」订正形退场（⇒「（承载 17 段）」形；「⇒」不入格面，变更史归 UI.md 变更记录行）。
- 同格并落：§2.4#6 措辞收正（「会话控制面条目」⇒「会话控制条目」）。
- 判据（改）：**该格仅存 17**（15 ∕ 16 词面与「⇒」订正形零残留——读回）；§2.5③ 其余项（`:315` ∕ `:395` 拍值收正 ∧ 无 2s 现役拍值断言）不变。
- 同族只报（不扩面——归父侧裁）：UI.md `:101` ∕ `:192` ∕ `:196`（「15 段表 ∕ 15 段逐项裁定表」表名沿用——`:192` 载「已就地收正为 17 段」句）· `:526`（项题「承载段 16 ⇒ 17」——批注面）；`PROJECT.md:270`（「`STATUS_SEGMENTS` 段闭集（16 码）」——现盘 = 17 码，实读 `thincoder-desktop/renderer/views/statusline.mjs:46-50`）· `:69`（KD-30「段集 12 ⇒ 16」订正形）。

**发现 5 → §2.5①-b i18n 自值统一**
- 概览句「i18n（core）**107** ⇒ 108」收正为「i18n（core）**106 ⇒ 108**」（登记册自值 = `docs/core/design/CORE-UNIFICATION.md:1099`（§2.8.1 行 11）实读 **106**）；落点句「§2.8.1 行 11（106⇒108）」不变。

**发现 6 → §2.2 as-of → 现址对照注（取「补注」侧）**
- §2.2 行 1 ∕ 2 ∕ 4 补注（读回）：`TOOLS.md` as-of `:81` ⇒ 现址 `:82`（#91 行）；as-of `:122` ⇒ 现址 `:123`（A6 行）；`WEBVIEW-PROTOCOL.md` as-of `:111` ⇒ 现址 `:113`（eng 行）；`ENG-TOKEN-BINDING.md:100` 无漂移（无注）。
- 给由：撤「逐处注明」承诺将弱化本批坐标口径（as-of ↔ 现盘对照 = 实施轮复读基线）；补注与 #598② ∕ ④ ∕ 措辞族现例同形。

**本块验收对照**：① 六条逐号落位（本块）· ② 读回核实（撰写后读回）· ③ 产品码 ∕ 他档零写（本档 §2 单写）。

### 2.14 波 2 实施记录（2026-09-29 · eng-designer——doc 面直落）

**段注**：§5 append 被段白名单拒（eng-designer → §2）⇒ 本实施记录落 §2。

**逐处落值**（落笔前逐处复读；读回核实 D6）：

| # | 处 | 落值 | 复读核对 |
|---|---|---|---|
| 1 | §2.13.4 ④ 表 #91 行（原 `setup-tooltable.mjs:88-89`） | `:85-86` | :85 = import ∕ :86 = 调用 ✓ |
| 2 | 同表 #96 行（原 `:80`） | `:77` | :77 = `configureVerifyDiagnostics` 调用 ✓ |
| 3 | 同表 #170 行（原 `:86-87`） | `:83-84` | :83 = import ∕ :84 = 调用 ✓ |
| 4 | #113 行（原 `editor-context.mjs` + `setup.mjs:412/:418`） | `panel-turn-loop.mjs:30`（调用点 `:166`）+ `panel-session.mjs:18`（调用点 `:185`） | 现盘逐处读回一致（无漂移） |
| 5 | §2.8.1 行 11 | **106 ⇒ 108** | `thincoder-core/i18n.mjs` `wc -l` 实读 = 108 ✓ |
| 6 | 变更记录 | 追加一行（落本档变更记录尾部追加区） | 读回 ✓（首落误置顶部——按当日六笔均在尾部区惯例移至末尾，净零行数） |

**+1 漂移注**（§2.1 口径「漂移处按现盘重锚」）：`thincoder-vscode/src/agent/setup-tooltable.mjs` 于设计轮实读后 +1 行（工作树未提交头注 W8 契约② 段 1 ⇒ 2 行——git diff 证；residuals-round2 批落形）⇒ **§2.4#1 三坐标落值 = 设计表值 +1**（`:85-86` ∕ `:77` ∕ `:83-84`）。**连带复读义务**：§2.4#3（ENG-TOKEN-BINDING）与 §2.2#4（WEBVIEW-PROTOCOL）引同档同区 `:84-93` ⇒ 波 1 落笔前须复读（+1 ⇒ `:85-94`）。

**验收**（`node scripts/doc-check.mjs` 基线 ∕ 落笔后对跑）：**本档红集零新增**——悬空（全仓）162 ⇒ 161（−1 系他档并发窗口收正，本档零贡献）；本档 ✗ 行集合逐条一致（仅既存 :817 ∕ :880 两条）；本档候选净 +5（新增 token 全可解析——零悬空新增）；行宽 80 ⇒ 80。**读回核实（D6）**：六处落值逐处实读 ✓。产品码 ∕ 他档零写。

### 2.15 波 1 实施记录（2026-09-29 · eng-designer——doc 面直落）

**段注**：§5 append 被段白名单拒（「§5 is not yours to write — this caller writes §2 only」；同 §2.14 先例）⇒ 本实施记录落 §2。

**逐档落值**（落笔前逐处复读；D6 读回核实；15 档全落）：

| # | 档 | 落值 | 复读 |
|---|---|---|---|
| 1 | `docs/core/design/TOOLS.md` | §2.2 #91 行（现 `:82`）与 §3.1 A6 行（现 `:123`）镜像撤写收正：标退役（2026-09-25 config 镜像写收口批）+ 现体 `thincoder-vscode/src/agent/setup-tooltable.mjs:85-94`（+1 漂移复读）；跨端副作用句收正「已消除」；+变更记录行 | ✓ |
| 2 | `docs/core/design/ENG-TOKEN-BINDING.md` | §6.3 ① 行（`:100`）坐标 `:88-97` ⇒ `:85-94`；+变更记录行 | ✓ |
| 3 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | eng 行（`:113`）坐标 ⇒ `:85-94`；§6.2 计时行 ∕ U-P6「2 s ⇒ 1 s」（值面，引坐标不动）；§6.3 键表 26 ⇒ **27 键**（+ `status.quiet` 行 + 登记注——核容器键；机检：表数据行 = 27）；+变更记录行 | ✓ |
| 4 | `docs/RELEASE.md` | §5.5 步 1 邻位补段（render-core 不入发布序列——`private: true`；内嵌形 = link + `--follow-symlinks`；单源 = RENDER-CORE §1.3 ∕ §10 B）×3 行；+变更记录行 | ✓ |
| 5 | `README.md`（仓根） | Layout 表补 `thincoder-render-core/` 行 | ✓ |
| 6 | `docs/core/design/ARCHITECTURE.md` | §3 树补 `thincoder-render-core/` 块（`thincoder-core/` 邻位；§4 行零改——防同账双执行）；+变更记录行 | ✓ |
| 7 | `docs/desktop/design/PROJECT.md` | 计数族：KD-25 ∕ KD-36 ∕ D17 ∕ D22 ∕ T-DSK33（×3）∥ §8 边界 ∕ §10 AR ∕ §4.1 `statusline.mjs` 行（17 码）⇒ 17 ∕ 11；KD-30「段集 12 ⇒ 16」订正形退场 ⇒ **17**；§4.2 挂起窗径批块 turn-driver 行 **275 ⇒ 291**（= §4.1 同值；现盘实读 291 复读）；+变更记录行 | ✓ |
| 8 | `docs/desktop/design/UI.md` | `:21` 格三件（17 段逐项裁定表 ∕ 定形 = 17 段 ∕ 承载 17 段）；`:101` ∕ `:192` ∕ `:196` 表名收正；`:526` 项题订正形退场；拍值三处（`:315` ∕ `:395` ∕ `:432`）2s ⇒ 1s；措辞 5 处「会话控制面条目」⇒「会话控制条目」；+变更记录行 | ✓ |
| 9 | `docs/desktop/design/SHELL.md` | `:33` 措辞收正；+变更记录行 | ✓ |
| 10 | `docs/desktop/design/IPC.md` | 措辞三处（`:87` ∕ `:165` ∕ `:166`）；+变更记录行 | ✓ |
| 11 | `docs/desktop/design/E2E-TESTING.md` | §3.5 步 2 首锚 `[data-slot="projects"]` ⇒ `[data-slot="session-control"]`（骨架 `index.html:40`；常量 `mount-sessions.mjs:37`；折行）；+变更记录行 | ✓ |
| 12 | `docs/cli/design/TUI.md` | §7.7 表 CLI 列 5 行重锚（`:409` ∕ `:144`+`tui-state.mjs:43` ∕ `:104 ∕ :113` ∕ `:132 ∕ :185 ∕ :333` ∕ `:114 + :175 ∕ :197 + :417–:461`）；+变更记录行 | ✓ |
| 13 | `docs/cli/design/CLI-DEBT.md` | 表 A 四行读数（A9 **462** ∕ A10 **454** ∕ A12 **447** ∕ A16 **418** + 余量 38 ∕ 46 ∕ 53 ∕ 82）；+变更记录行 | ✓ |
| 14 | `docs/core/design/MULTI-INSTANCE-COLLAB.md` | `agent/dispatch.mjs` 引用六处 ⇒ `dispatch-run.mjs`（含 `:257` 行读数收正 254 ∕ 167）；`:89` ∕ `:91` 端半档退场标注；+变更记录行 | ✓ |
| 15 | `docs/vsc/design/WEBVIEW.md` | `_panelTimer` 类七处 2 s ⇒ 1 s；+变更记录行 | ✓ |

**零写**：产品码 ∕ 他档 ∕ `CORE-UNIFICATION.md` ∕ `docs/vsc/requirements/WEBVIEW.md`（父侧自办）零触；doc-check 临时捕获件三枚已清。

**验收（doc-check 基线 ∕ 终跑对跑）**：本批写域**零新增红**——悬空 160 ⇒ 160（本批零贡献：本批触发行号漂移五对（+5 ∕ −5）；另 −3 = 他批在途（`live-md` 拟新增行销记））；行宽 80 ⇒ **79**（本批净 −1：`UI.md:526` 存量超宽随本笔折行消除；本批首落引入 11 行超宽已全数折行——零新增）；行数面 26 ⇒ 28（净 +2 = 他批源档并发实读变动四行（`i18n-views.mjs` ∕ `chat-tool.mjs` ∕ `pool-subagents.mjs` ∕ `mount-settings-segments-agent.mjs`）——本批零源码写，只报不修）。判据 grep：全仓规范面「会话控制面条目」= 0（余 = 批档修正表 3 + 三档变更记录行 3）；两 VSC 档「2 s 拍 ∕ 2 s 同点刷」现役 = 0（余 = 另机制已注行（出生自愈心跳）∥ 变更记录行）；`MULTI` 规范面 `agent/dispatch.mjs` = 0（余 = 变更记录行二）。

**披露 ∕ 上抛**：① §2.12#4 按设计主裁落位（`tui-state.mjs:43` 字段声明坐标——§7.7 起算锚行）；父侧未另裁，如否可单点 revert。② §2.12#5（#517 复核）实施轮复核 = 三处皆**现役并载**（`:81` KD-41 ∕ `:170` turn-face 行 ∕ `:1294` 变更记录行）⇒ 零改（防双执行）。③ §2.13 发现 3 之「修订 §2.5④-b ∕ §2.10 裸坐标」以块内全形枚举声明形满足，未就地改写原文（append 段机制——如须就地改写请裁）。④ 同族观察（只报）：`UI.md:168`「会话控制面条体」第三形 1 处；`PROJECT.md:458` 记录面行「15 段表就地收正」（历史行）；仓根 `README.md:4`「their only shared runtime code is the first-party `@thincoder/core`」句与 render-core 并存（intro 面收正未入批）。⑤ 变更记录行内保留旧形引用（记录面口径——历史归变更记录面）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围与限界**：无项目标准档 ∕ 无文档地图（方法学与 Document ownership 判据降级——按 Project Guide + 逐处实读目标档核对）；台账（SQLite）不在仓内 ⇒ #378 ∕ #560 ∕ #594 ∕ #598 ∕ #612 ∕ #381 六行原文未读（unverified），覆盖性按本档 §1.1 逐行枚举对照（六行枚举在 §2 均有对应表）。受影响文件全为纯 `.md` ⇒ 判据 8（行数注记）适用豁免；设计内代码档读数抽样实读相符（render-frame 447 ∕ agent-turn 418 ∕ tool-events 454 ∕ subagent-blocks 462 ∕ tui-state 66 ∕ i18n 108 ∕ dispatch 254 ∕ dispatch-run 167-168），TUI 族应然坐标 :409 ∕ :144 ∕ :104/:113 ∕ :333 ∕ :114 ∕ :175 ∕ :197 与 CORE-UNIFICATION 修法坐标 :84-85 ∕ :76 ∕ :82-83 ∕ panel-turn-loop:30/:166 ∕ panel-session:18/:185 逐处实读属实。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership ∕ 坐标 | 🟡 | `docs/core/design/ARCHITECTURE.md` 的 render-core 行已落：`:131`（§4 模块接口速览表尾行）+ `:217` 变更记录（desktop-residuals-sweep 批 · 波 D · 台账 #560——「§4 模块接口速览表尾补 render-core 行」）。§2.3#3 的「现读零 render-core」不实，「§4 表补一行」按原样执行 = 同表补出第二行（重复）；该项判据「含 `thincoder-render-core` ∧ `RENDER-CORE.md`」现已完成 = 空判据。§3 树（`:47`–`:87`）确无该目录 ⇒ §3 补块仍有效。 | 改法：该项按「已落」复核——§4 行不动（防同账双执行），仅保留 §3 树补块；判据改「§3 树含 `thincoder-render-core/`」。 |
| 2 | Clarity（坐标） | 🟡 | PROJECT.md 行锚整族与「届盘实读（本设计轮亲读）」相抵：实盘 `:741`（D17「16 段逐项裁定表」，记 :731）· `:746`（D22「16 段」，记 :736）· `:834`（T-DSK33「十六段 ∕ 承载 16 ∕ 段集 16 计数锁」，记 :824）· `:970`（AR「播种 2 ∕ 不播种 10」，记 :960）· `:919`（「`tokens` ∕ `timers` 等 10 段不属播种面」，记 :909）；§2.4#4 实盘 `:615`（turn-driver **275**，记 :617；`:164` = 276 ✓）；§2.4#5 #517 定位不实（全档命中 = `:81` ∕ `:168` ∕ `:1252`；所记「`:970` §10 BB 行」实为 `:980` 且载 #505 非 #517）。词面 ∕ 值面（16⇒17、「10⇒11」、275 ∕ 276⇒287）核对属实。 | 改法：行锚以词面首读为准、不按表号直改；全表落笔前逐处重读重锚（含 §2.4#5 复核面）；#517 清单按 `:81` ∕ `:168` ∕ `:1252` 重列。 |
| 3 | Coverage | 🟡 | §2.5④ 只收 `docs/vsc/design/WEBVIEW.md` 三处（`:52` ∕ `:243` ∕ `:246`——实读属实），同机制两刷新路径族尚有 ≥5 处现役「2 s」句未列入且未明示排除：`:161`（「2 s 同点刷与覆盖式重建均不改…」）· `:168`（「消息驱动与 2 s 拍同值」）· `:178`（「`usage` 消息驱动 + 2 s 拍」）· `:249`（「两刷新路径（2 s 拍 / 覆盖式重建）」）· `:254`（「2 s 拍与覆盖式重建同源」）；§2.5④-b「`:161`（宿主存活投影——另机制勿混）」为裸坐标、未指档名，无法判其是否豁免。判据「三处无 2s 现役拍值」全绿后档内仍留 2s 现役句（与 TUI.md §7.7 的 1s 落值相抵）。 | 改法：扩至同机制全族，或逐处明示「另机制」并给出档名 ∕ 机制名；判据改为机制族全文 grep（「2 s 拍 ∕ 2 s 同点刷」零现役，历史行除外）。 |
| 4 | Doc hygiene ∕ Coverage | 🟡 | §2.5③ 对 `docs/desktop/design/UI.md:21` 的最小改法只动「= 16 段」⇒17，但同格另存「**15 段逐项裁定表**」与句尾「（承载 16 ⇒ 17）」（订正形表达在 §2 规范行上）；改后同格 15 ∕ 16 ∕ 17 三数并存，设计自身判据「段计数断言 = 17」不成立。 | 改法：该格计数面一并以单一「17 段」形收正（16 值 ∕ 「⇒」形退场或移入变更记录面）；判据改「该格仅存 17」。 |
| 5 | Clarity | 🔵 | §2.5①-b 同项两个「自」值：概览句「i18n（core）**107** ⇒ 108」vs 落点句「§2.8.1 行 11（**106**⇒108）」不一致（实读登记册 = **106**——`CORE-UNIFICATION.md:1099`）。 | 改法：统一为「106 ⇒ 108」，或分别标注口径（登记册自值 ∕ 前批落值）。 |
| 6 | Clarity | 🔵 | §2.1 承诺「（不一致处逐处注明）」未贯彻：§2.2 现址（`TOOLS.md:82` ∕ `:123`）与批令 as-of（`:81` ∕ `:122`）、`WEBVIEW-PROTOCOL.md:113` 与 §1.1 的 `:111` 均未注明（同类差异在 #598② ∕ ④ ∕ 措辞族已注明）。 | 改法：补 as-of → 现址对照注，或撤回「逐处注明」承诺口径。 |

**计数**：发现 6 条 = 🔴 0 · 🟡 4 · 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准（父侧代签 · 2026-09-29）**

- **依据** = 用户 2026-09-29 13:52「别等我了，自己跑完」+ 17:02「尽可能消除」令（代点火 + 代批准授权——本批经此授权点火评审 #23）。
- **三条件核检**：① **评审 pass**——#23（§3 在册）② **修正轮落地并经父侧核验**——#36 逐号 1..6 全落（§2.13 修正块在册）；实施面 = 波 1（#49 在队）∥ 波 2（#50 ✓）∥ 文档面（#57 在队）③ **凭证**——评审 #23 已通过（token 在手）。
- **批准射程** = 本批 §2 全量（族：文书回填三波 + 同族追加）；**不扩面**。
- 〔父侧代签 · 记录在案 · 可 revert〕

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

### 6.1 收口（父侧 · 2026-09-29）

- **交付物全落（三波）**：**波 1**（15 档——`TOOLS.md` ∕ `ENG-TOKEN-BINDING.md` ∕ `WEBVIEW-PROTOCOL.md` ∕ `RELEASE.md` ∕ 仓根 `README.md` ∕ `ARCHITECTURE.md` ∕ `PROJECT.md` ∕ `UI.md` ∕ `SHELL.md` ∕ `IPC.md` ∕ `E2E-TESTING.md` ∕ `TUI.md` ∕ `CLI-DEBT.md` ∕ `MULTI-INSTANCE-COLLAB.md` ∕ `WEBVIEW.md`——#49 在册）∥ **波 2**（`CORE-UNIFICATION.md` 六处——#50 在册）∥ **波 3**（需求档 #381 裁定一句——**父侧自办 ✓**，`docs/vsc/requirements/WEBVIEW.md:82`）。
- **批内件**：本批 = 文档面（零 `.test.mjs`——判据 = doc-check 对跑 + grep 判据三族）。
- **验证**：doc-check 本批写域零新增红（悬空 160 ∕ 行宽 79（净 −1——`UI.md:526` 存量超宽随本笔消除））；判据 grep 全绿（规范面三族零残留——余 = 批档 ∕ 变更记录面存量）。
- **集成面**：**不新增**（纯文档）。
- **结算同步清单**：① 角色表 ✓ ② 状态行 ✓ ③ 计数 ✓ ④ 指针 ✓ ⑤ changelog ✓（15 档各一行 + `CORE-UNIFICATION.md`）⑥ **台账勾销：#378 ∥ #560 ∥ #594 ∥ #598 ∥ #612 ∥ #381 → 已核销**（两步）⑦ 前批遗留交叉核：无（族批自身）。
- **遗留（显式）**：**#646**（只报两项：`UI.md:168` 第三形 ∕ `README.md:4` 句——随下笔）∥ `setup-tooltable.mjs` +1 漂移复读义务（波 1 已按现盘落 ✓）。
- **收口结论**：本批终止。
