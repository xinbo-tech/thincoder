# 2026-09-28 · 桌面功能对位
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 19:39 直令（功能全量对位：「我不想再出现什么 vsc 端有的功能 desktop 没实现的——一次处理」）· 需求档 §3.6「功能面全量对位」块 + 台账 #530 · 双路侦察 #82 ∕ #83 在飞。
> 台账 = #530（桌面功能对位 · 归批）。前情 = 无（独立批——姊妹批进行中：docs/batches/2026-09-28-desktop-input-vsc-align.md ∕ 2026-09-28-desktop-flow-vsc-align.md）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 直令与授权（2026-09-28 19:39 · 主 agent）
- 用户直令（连发两条 · 去重）：「功能上，你也好好查查，我不想再出现什么 vsc 端有的功能 desktop 没实现的。——一次处理」。
- 判据（沿对齐总纲）：VSC 已有用户可见功能 ⇒ 桌面必须有——复用 ∕ 上提默认；缺项 = 缺陷；真端差须实证（需求档 `docs/desktop/requirements/PROJECT.md` §3.6「功能面全量对位」块在册）。
- 授权口径：点火 ∕ 评审 ∕ 批准沿本线委托；设计 → 评审 → 实施（eng-coder）。

### 1.2 吸收条目（本批队列 —— 台账迁「待设计」16 条 + 批本体 #530）
- 缺口族：`#505`（turn-cap 续跑）· `#406`（会话 GC 启动径）· `#410`（question 作答通道）· `#412`（memory:status）· `#519`（promptInjections 供值）· `#520`（onDistilled）· `#521`（child-marks）· `#522`（subblocks 态机三面）· `#523`（五项未接·待裁）· `#525`（改名内存标题）；
- 桌面侧余项：`#389`（骨架批残余）· `#398`（坏配置 fail-loud 判据）· `#436`（队列 Enter 行为）· `#453`（start 脚本）· `#486`（失败面可见性）；
- 方法面（设计必采）：`#524`——对齐审计**强制输入清单**（核档头「留端」清单 + 核注入缝登记表 22 项；align-2:79 误判先例）。

### 1.3 序
- 侦察双路在飞（`#82` VSC 功能注册表自上而下 ∕ `#83` 核件能力三端消费自下而上）→ 回件出**缺项总表**（含未核清单）→ 设计轮（eng-designer）→ 评审 → 实施一次补齐。

### 1.4 双路侦察回件（2026-09-28 19:4x —— 融合缺项清单 · 设计强制输入）
**#82（VSC 功能注册表自上而下）**：74 面清点（注册表 12 ∕ 面板 33 ∕ 宿主面 29）= 有 31 ∕ 部分 17 ∕ 无 26；「无」中 12 条 = 宿主壳面端差（非缺项）。**未排批真缺项**：A5 会话 GC 命令 ∕ A6 索引重建命令 ∕ A7 语义索引构建入口 ∕ A9 stopTrace ∕ B4 会话内搜索 ∕ B10 goal 面板 ∕ B13 状态行限流配额段 ∕ B14 压缩状态行 ∕ C3 config 写盘感知 ∕ C5 GC 启动拍 ∕ C6 索引启动拍 ∕ C8 多实例 L3 ∕ C9 `.cursor/rules` ∕ C21 探针忙闸；**「部分」缺口**：B16 台账周期刷新+L2 明细 ∕ B29 设置五族（proxy ∕ shell ∕ 索引 ∕ websearch ∕ embedding ∕ consult ∕ advisor 控件）∥ C7 peer L2 提醒注入 ∕ C11 索引嵌入 UI ∕ C12 MCP 工具清单。**在册四项复核**：skills = **非缺项**（桌面走核默认路径同表可用；仅同步 loader 形态差）；会话 GC ∕ 索引 ∕ 多实例 = 真缺（接线欠账 · 核件出口齐）。
**#83（核件能力 × 三端消费自下而上）**：27 族 = VSC 消费∥桌面未接 **16 族**（扣在飞 2 族 ⇒ 未排批 **14 族**）：宿主配置缝 9 条全空（`configure*`）· **提示锚硬缺**（锚字面进模型工具描述——与 `#519` 同源）· 顾问面 ∕ 记忆索引构建维护 ∕ 认领 ∕ peer ∕ 会话 GC&索引 ∕ 检查点回退&团队同步 ∕ config 热更 ∕ skills 列表 ∕ auto-think ∕ 回声合并 ∕ 日志遥测 ∕ render-core toast ∕ flow 四档（block ∕ reasoning ∕ tool-card-restore ∕ ledger-line）；CLI 参考面 4 项（wait-status ∕ closeAllMcp ∕ ledger-migrate ∕ traces）。
**融合口径**：两表去重后 = 本批缺项总表——设计轮以 §1.2 吸收条目 + 本清单为**强制输入**（并采 `#524` 的「留端 ∕ 注入缝」两清单逐项对账）。**未核清单**（两路自陈）：运行期全未跑（静态读码）· 桌面 MCP 逐控件 ∕ 状态行逐段值 ∕ VSC `chat-messages` 全表 ∕ `code-index` 构建入口（标「疑」）等——设计轮可补勘。**侦察原文** = 会话存档（#82 ∕ #83 digest 全文；逐行证据可再实读盘面复核）。

### 1.5 评审轮 1 号外裁定（主 agent · 2026-09-28 20:2x —— 承修正轮交付）
- ① `ipc.mjs` 越线处置 = **条件裁定**：届盘读数 ≥300 ⇒ 按「通道注册表族出档」拆点执行；<300 ⇒ 零触（两径在册）。
- ② `PROJECT.md` §4.1 表值复核（`preload.cjs` 59 之差非 ±1 口径）= **归本批文档收正面**（实施轮随落；按届盘 node 口径收正——现读 61）。
- ③ `styles.css` 触档归属收正（R4 ∕ R5）= **确认**（实读为准；R7 零触）。

### 1.x R1 交付核收（父侧 · 2026-09-28 23:4x）
- **核收读数**：七档行数与报告逐项相符（session-maintenance 112 ∕ session-slots 226 ∕ ipc 296 ∕ main 114 ∕ window 177 ∕ agent-host 400 ∕ preload 62——read 口径）；`session-maintenance.mjs` **零 electron** 实核 ✓；`npm test` 空清单绿 ✓。已提交 `2ab95850`。
- **全清令执行**：#102 测试面四条（#9–#12）随令取消、`test/**` 零触 ✓。
- **遗留转出处置**：① IPC.md 通道行 ∕ 计数 + ② agent-host 越层处置行 + ③ 行数账 → **派设计轮 #129 收**（fix 轮定点）；④ 维护文案 zh/en（内容权 = 主 agent）→ **台账 #533**（触发 = 归批）；⑤ `%TEMP%/tc-maint-*` 自查沙箱 = 临时文件，不追。
- **审计与评审**：内审 clean · 代码评审两轮 pass（fix 1 轮 = 菜单 GC 驳回径对齐）——父侧只核数，不重审。

### 1.6 重发点火 + 评审 #2 处置（父侧 · 2026-09-29 00:0x）
- 评审 #2（后续轮重发复核）**VERDICT: pass**（🔴0 ∕ 🟡6 ∕ 🔵2——报告与 §3 落档）；令牌已签发（值 = 运行态，不落档）；**九轮全部重发**：R2 #7 ∕ R3 #8 ∕ R4 #9 ∕ R5 #10 ∕ R6 #11 ∕ R7 #12 ∕ R8 #13 ∕ R9 #14 ∕ R10 #15（按文件冲突自动排队——R7 待 R2、R9 待 R2 ∕ R7、R10 待 R3 等）。
- **逐条处置**：① 验收失据（全清令）→ 各舱任务书已带覆盖令（测试行跳过 + 报告注明「随全清令取消」）；正文 overlay 入微轮 #16；② `memory:status` 预留行 → 微轮 #16（收正靶补行）；③ R9 mount-sessions 重锚 → 微轮 #16 + 舱内按届盘 387 重勘；④ R3 agent-host 重锚 + 先拆后改（`turn-driver` 出档）→ 微轮 #16 + 舱内执行；⑤ ipc 条件裁定句改「轮起手 + Δ」判 → 微轮 #16；⑥ 「会话模型轮」失据行 → 微轮 #16（§2.0 面清单 + 收正靶）；⑦ §4.1 记录面两笔 → 微轮 #16；⑧ 数值漂移 → 微轮 #16（§2.5 头「届盘重锚」既定口径句）+ 各舱起手实读。
- 微轮 = eng-designer #16（fix · 定点 ①–⑧）——边界 = 只收上述项、零语义。

### 1.7 临场裁 · R2 ∕ R7 设置段相抵（父侧 · 2026-09-29 00:1x）
- **上抛**（R2 舱 eng-coder#7）：R2 #7（`:195`）「索引段出档 `settings-sections-index.mjs`」与 R7 #1（`:280`）段闭集「4 ⇒ 7（tools{embedding ∕ websearch ∕ 索引状态}）」相抵；且 R2 文件表未列注册表 `renderer/views/settings.mjs`。
- **裁定**：R2 直接起 **tools 段**——注册进 `views/settings.mjs`（SECTIONS + 分派），段体 = 索引族行，落 **`settings-sections-tools.mjs`**（按 R7 终态枚举 + 既有拆点命名；先建同名档 ⇒ R7 零改名搬迁）；R2 写域补列 `views/settings.mjs` ∕ `mount-settings.mjs`；R7 基线改述「**5 ⇒ 7**」（R7 仅增行 ∕ 增 env ∕ models 两新段）。
- **落档**：裁定已 send 给 R2 舱（照落）与设计微轮 #16（并入定点 #9 ∕ #10 收正 §2 两行）。

### 1.8 临场裁 · R6 桌面临时词族缺口（父侧 · 2026-09-29 00:1x）
- **上抛**（R6 舱 eng-coder#11）：核件取词键族 `search.*`（5 键——placeholder ∕ prev ∕ next ∕ close ∕ noMatch；VSC `locales/{en,zh}.json:254-258` 已有）桌面无供给面；落点 = `renderer/i18n-views.mjs`（HOST_DICT），R6 文件表未列。
- **裁定**：**本舱直落（授权）**——增 5 键 × 两语、值逐字同 VSC；要求写前重读（合并他舱键块）、局部增键、报告列行号。理由：交付自含 + 调度时序（#9 ∕ #10 ∕ #12 均排其后，并发窗极小）。
- **写域记录**：R6 实际写面 += `renderer/i18n-views.mjs`（表外扩张——照实披露）。
- **收口复核项**：本批收口核 5 键在盘（防跨舱覆写丢失）。

### 1.9 微轮 #16 交付收下 + 本体同步轮派单（父侧 · 2026-09-29 00:2x）
- **#16 交付**：10/10 逐号落位（§2 :593-673 overlay——① 全清令后验收面行规则 + 点名清单；②–⑧ 各靶行重锚 ∕ 补行；⑨⑩ 设置段裁定收正）+ 状态行更新；本舱笔迹 Δ = 0（doc-check 前 175 ∕ 后 175；行宽 0）。
- **并发笔迹核对**：现刻悬空 177（+2）∥ 行宽 1（`PROJECT.md:1027` = 303 字符）——**非 #16 笔迹**，归会话标题批正文收正轮（#18，在跑）⇒ 已 send #18 定点收正（折行 + T-DSK41 悬空消解 + Δ ≤ 0）。
- **#16 观察① 处置**：设计档本体行（②⑥⑦ 对应本体）分两路——「已落事实类」（会话模型六失据行 ∕ 测试残引）⇒ **本刻派本体同步轮**（eng-designer #21 · fix · 排队等 #18 让出 `PROJECT.md`）；「实现依赖类」（白名单计数 ∕ §4.1:141/:153/:177-178）⇒ 随对应轮落地后收（窗口在册 §2）。
- **#16 观察③** 并入 #21 射程（§4.1 测试面越层段 ∕ §10 U 行残引）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（初始轮 + 评审轮 1 修正（1–14 逐号）+ R1 设计面收正轮（#129 ∕ #131 · 六档八笔；flow 批档三处归父侧）+ 评审轮 3（重发复核）修正 · 微轮 #16（1–10 逐号）在册）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 交付形态 · 判据 · 计量口径 · 跨批序（去重）

**交付物** = 本 §2（逐轮实施任务书）+ 设计档随落（`docs/desktop/design/PROJECT.md` 新增 **KD-42**「对齐审计强制输入清单」= 台账 #524 方法注记）+ 本 §2.3 对账节在册；**不另立设计档**（沿 `docs/batches/2026-09-28-desktop-flow-vsc-align.md` §2.0 先例）。各轮随轮收正设计档（`docs/desktop/design/{UI,RENDERER,IPC,PROJECT,SHELL,E2E-TESTING}.md`）——随轮「文档收正」行。

**判据（三态 · 用户 2026-09-28 19:39 直令 + 需求档 §3.6「功能面全量对位」块）**：
① **复用**（VSC ∕ `thincoder-render-core` ∕ 核件已有 ⇒ 桌面直接消费）；② **上提**（实现为源 ⇒ 上提核件 ⇒ 两端消费；**纯搬 + 转口，零语义改**）；③ **真端差**（宿主面，**三件齐**〔结构性不对称 + 证据 + 裁定〕才留）。**举证不足 ⇒ ① 消除**；**不重设计 ∕ 不优化 ∕ 不现代化**。

**计量口径**（沿 `docs/batches/2026-09-28-split-batch.md` 先例）：每轮行动表 **原档 ≤ 15**（新档 = 上提产物 ∕ 结果档、随动档另列，不计入）；行数 = **实读总行数**（`read` 工具「N lines total」同源）。硬限纪律：凡触碰档 ≤ 500 硬限；越 300 顾问线者按「先拆后改」或「续期」，逐档在 §2.5 表列明。

**跨批序（去重 · 「归先落者」——在飞三批）**：
- 在飞面 = ① 输入面板批 `docs/batches/2026-09-28-desktop-input-vsc-align.md`（P0 · R1 在飞）② 流程批 `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R1–R13 · §4 已签）③ 子代理块跟滚批 `docs/batches/2026-09-28-desktop-subblock-follow.md`。
- ① `renderer/events.mjs`（**498**）· `renderer/i18n.mjs`（**490**）**拆分归先落者**（输入批 R1 已承接 `events-flags.mjs`；本批 R4 ∕ R5 只消费其拆分后形）。
- ② 卡三面（`views/approval.mjs` ∕ `views/question.mjs` ∕ `views/plan.mjs`）· `queue.mjs` ∕ `chat-pending.mjs` · `timer-watch.mjs` ∕ `attachments.mjs` ∕ `file-links.mjs` ∕ `subagent-face.mjs` ∕ `notify.mjs` ∕ `agent-assemble.mjs` ∕ `providers.mjs` ∕ `suspension-drive.mjs` = **流程批面**（本批零触；本批 R3 只在其 `agent-assemble.mjs` 改动之后追加 ExecRun 缝行，序沿先落者）。
- ③ 子 agent 块**内容区跟滚**（`initBlockFollow` ∕ `maybeScrollActivity` ∕ 区钉底）= **块跟滚批面**（本批 R5 零触跟滚，只做 marks ∕ 态机三面 ∕ goal 面板）。
- ④ `composer/**` = 输入批面（本批零触；#436 判定见 §2.1）。
- ⑤ `renderer/styles.css`（**499** 距硬限 1）· `renderer/mount-settings.mjs`（**500** 顶格）· `renderer/views/settings-sections.mjs`（357 越顾问线）——本批 R7 触碰前三者：**先拆后改**（拆点沿流程批 §2.1 硬限邻档拆档定稿；拆档执行归先落者，本批消费）。

### 2.1 本批条目覆盖（§1.2 十六条 → 逐条落点映射）

| 号 | 条目 | 盘面判定（证据 as-of 2026-09-28 晚 · 本轮实读） | 态 | 轮 |
|---|---|---|---|---|
| #505 | turn-cap 续跑 | 桌面 src ∕ test 全树零 `ContinueError` ⇒ 撞帽 = 失败径；核类在位（`thincoder-core/agent/helpers.mjs:237` · 抛出 `thincoder-core/agent.mjs:437`）；先例 CLI `thincoder-cli/src/tui/agent-turn.mjs:196-227`（Continue 询问 ⇒ 重建 controller 重入）· VSC `thincoder-vscode/src/extension/panel-turn-loop.mjs:130-155`（`askInPanel` 两出口；`autoTurn` 支 = cap 即收口） | ① 复用 | R3 |
| #406 | 会话 GC 启动径 | 桌面恢复径走核**裸版**（`thincoder-desktop/src/main/session-slots.mjs:41/:93`；`session-io.mjs:19/:22-28` 取 `loadSlotFile`）⇒ 残留槽无人清；核出口 `thincoder-core/session-gc.mjs:195`（`scheduleSessionGC`）∕`:212` ∕ `:261` ∕ `:289`；VSC 先例 `thincoder-vscode/src/extension/session-gc-command.mjs:29-70` + 自动径 `thincoder-vscode/src/extension/session-io.mjs:92` | ① 复用 | R1 |
| #410 | question 作答通道 | **前提不成立（陈旧条目）**：盘面已接——`thincoder-desktop/src/main/ipc.mjs:106`（`question:respond`）+ 处理体 `:199-202` + 白名单 `preload.cjs` + 渲染面 `renderer/questions.mjs:18` ∕ `views/question.mjs:100-109` + `mount-cards.mjs:60-71`；设计档在册 `docs/desktop/design/IPC.md:99` | —（零动作） | — |
| #412 | memory:status | 核 `thincoder-core/memory/*` 导出面全动作型（**无状态读出口**）；现读数 = CLI ∕ VSC **直读核表**（`thincoder-cli/src/tui/cmd-reindex.mjs:9-11` ∕ `thincoder-vscode/src/extension/panel-index.mjs:36-41`）；父侧已裁（`docs/desktop/design/PROJECT.md:725` N 行）：端侧不直读 ⇒ **核加只读出口** + 桌面通道随落 | ① 复用（核新增出口） | R2 |
| #519 | promptInjections 供值 | 桌面全树零命中 ⇒ 两锚字面**原样进模型工具描述**（锚位 `thincoder-core/tool-docs/bash.md:15` · `question.md:11`；应用点 `thincoder-core/tools/shared.mjs:174`）；缝三态 `thincoder-core/prompt-files.mjs:92-113`（**缺键 ⇒ 抛**）；两端取值表 = `thincoder-cli/src/prompt-injections.mjs:15-20` ∕ `thincoder-vscode/src/prompt-injections.mjs:16-21` | ① 复用 | R4 |
| #520 | onDistilled | 桌面零命中 ⇒ 蒸馏落位晚于回合尾 save（盘面留未压缩版）；发射点 `thincoder-core/explore-distill.mjs:150`；先例 CLI `thincoder-cli/src/tui/tool-events.mjs:397` ∕ VSC `thincoder-vscode/src/extension/panel-callbacks.mjs:242`；桌面 save 单点 = `thincoder-desktop/src/main/turn-face.mjs:61/:65` | ① 复用 | R3 |
| #521 | child-marks | 桌面 main + renderer 零命中 ⇒ 撞帽 ∕ 定向中止子代理块头无「work may be partial」；锚单源 `thincoder-core/agent/child-marks.mjs:19`（`TURN_CAP_MARK`）∕`:24`（`STOPPED_MARK`）；载体 = 核件 `thincoder-render-core/subblocks/activity-view.mjs:39-75`；先例 CLI `tool-events.mjs:217` ∕ VSC `panel-callbacks.mjs:102-103` | ① 复用 | R5 |
| #522 | subblocks 态机三面 | 静态实读：① `resetActivity` 桌面零调用（VSC `webview/activity.js:180-189`）② `subBlocksFreezeAll` 零命中（VSC `:141-144`）③ `ensureSubBlock` 出生闸形差（桌面 `renderer/subagent-reduce.mjs:122` 注释自述「同律」与 `:128-132` 实现不符） | ① 复用（＋运行期复核） | R5 |
| #523 | 五项未接 | 拆分五面：① `onCompress*` ∕ `onWait` **真缺**（发射点 `thincoder-core/context.mjs:304` ∕ `agent/run-stages.mjs:89/:98/:106` ∕ `agent.mjs:274`）→ R4；② `configureExecRun` **真缺**（VSC 接 `thincoder-vscode/src/tools/shared.mjs:191`；CLI 未接）→ R3；③ 会话 GC 启动径 → R1（并入 #406）；④ trace 登记面 → R10 判定；⑤ 休眠缝两项（`configureEditReceipt` `tools/edit-diff.mjs:398` ∕ `configureGitApproval` `tools/git.mjs:64`）**三端零消费者** ⇒ 核侧裁 · **非本批**（登记） | ① 复用 ∕ 判定 | R4/R3/R1/R10 |
| #525 | 改名内存标题 | 桌面改名成功径只写盘（`ipc.mjs:141` ⇒ `session-actions.mjs:51-56` 纯转口核 `renameSlot`）⇒ 已装配实例 `agent.title` 不随动（装配表 `agent-host.mjs:198-208` 同键复用；装载刷 `session-lifecycle.mjs:114` 不重入）⇒ 下一回合尾 `saveSession` 全量覆盖可回退；CLI 对照 `thincoder-cli/src/tui/cmd-session.mjs:35` | ① 复用（小改） | R1 |
| #389 | 骨架批残余 | ① 门①（`src/main/protocol.mjs:54` 逃逸门）运行期零正读数（三负探针全命门② `:56`）② 守卫闭包「≥3 档」增长条款 ③ `will-navigate` 未拦窗口自身导航 ④ U11（下限不足路径）= unverified-until-host | — | R9 |
| #398 | 坏配置 fail-loud | `ipc.mjs:72-77`（`readConfig`）直用核 `loadConfig`，**无注入缝** ⇒ 坏配置路径无用例承载 | — | R9 |
| #436 | 队列 Enter 行为 | 归先落者 = 输入批 R1（其面含 `mount-composer` 提交径 ∕ B12 ∕ B14）；本批给**判定句**在 §2.7 KD-T6（判定 = 「队长 > 0 ∧ 键位空闲 ⇒ 先发队首」——与 VSC 「队列由回合尾消费」同向；留给先落者执行） | 归先落者 | — |
| #453 | start 脚本 | `thincoder-desktop/package.json:8-12` scripts = `{test, package, postpackage}`，**无 `start`**；实际起法 = `npx electron .` | — | R9 |
| #486 | 失败面可见性 | `renderer/mount-sessions.mjs:79-84`（`openResult` 失败仅 `console.error`）· `:55-60`（`history:page` 失败同）· `:100-107`；VSC 对位 = `thincoder-vscode/src/extension/panel-messages-session.mjs:43/:53/:66`（三档 `showWarningMessage`）；载体 = 核 `thincoder-render-core/toast.mjs:10`（**已在盘**） | ① 复用 | R9 |
| #524 | 强制输入清单 | 方法注记落 `docs/desktop/design/PROJECT.md` **KD-42**；两清单逐项对账节 = 本 §2.3 在册 | — | 本设计轮 |

### 2.2 融合缺项清单逐项映射（§1.4 双路侦察 → 落点）

**#82（VSC 功能注册表自上而下）· 「未排批真缺项」12 条**：

| 项 | 判定（本轮实读坐标） | 态 | 轮 |
|---|---|---|---|
| A5 会话 GC 命令 | VSC = 命令面板项（`session-gc-command.mjs:29` + 注册 `extension.mjs:163-165`）；桌面无命令面板 ⇒ **机制复用 + 桌面入口 = 主进程菜单项**（`src/main/window.mjs:54` 菜单族）；「命令面板」本身 = 端差登记（宿主能力） | ① 复用 | R1 |
| A6 索引重建命令 | VSC `src/extension/session-index-command.mjs:16` + 注册 `extension.mjs:168-170`；桌面入口同 A5（菜单项） | ① 复用 | R1 |
| A7 语义索引构建入口 | VSC `src/extension/panel-index.mjs:146`（`buildIndex`）` :180`（gitSync）`:186-187`（codeSync + docSync）；核出口 `memory/code-sync.mjs:192` ∕ `memory/docs.mjs:25` | ① 复用 | R2 |
| A9 stopTrace | VSC 侧诊断链路（`src/extension/stop-trace.mjs:18-28/:37-45`；开关 `package.json:112-116`）——**非用户可见功能面**（开发者诊断）⇒ 判定「不做」+ 端差登记（见 §2.9 上抛 4 复核） | 判定 | R10 |
| B4 会话内搜索 | VSC `webview/search.js:56-80`（`performSearch`——纯 webview，零宿主通道）+ 入口 `:159-165`（Ctrl+F 唯一入口）；核无同件 ⇒ **上提 `render-core`** + 两端消费 | ② 上提 | R6 |
| B10 goal 面板 | 核件 `thincoder-render-core/cards/panel.mjs:26`（`goalPanelVisible`）`:74`（`renderGoalPanel`）；VSC 壳 = `webview/panels.js:16/:30-35/:118-122` + 宿主产点 `panel-callbacks.mjs:184`；桌面零 goal 面 | ① 复用 | R5 |
| B13 状态行限流配额段 | VSC `webview/status-bar.js:27-30` 段 + kind 五值表 `:101-112`（`rateWait` ∕ `rateLimited` ∕ `overloaded` ∕ `quota` ∕ `index`）；数据源 = `onWait`（宿主 `panel-callbacks.mjs:71-78/:169`）；桌面 `views/statusline.mjs:33-35` 16 段闭集**无此段** + 数据源缺 | ① 复用 | R4 |
| B14 压缩状态行 | VSC `webview/chat-status.js:17-44`（流内单元素四态 `start` ∕ `done` ∕ `fallback` ∕ `failed`）；产点 `panel-callbacks.mjs:175-183`；桌面缺 | ① 复用 | R4 |
| C3 config 写盘感知 | VSC 接法 `extension.mjs:12/:128`（`startConfigWatch`）；核订阅面已在 `thincoder-core/config-io.mjs:107`（`onConfigSelfWrite`）；桌面零命中 | ② 上提（去抖 ∕ 元组比对纯逻辑） | R8 |
| C5 GC 启动拍 | = #406 同面 | ① 复用 | R1 |
| C6 索引启动拍 | 核 `session-index-pass.mjs:81`（`scheduleSessionIndexPass`）；VSC 启动拍 `extension.mjs:175`；桌面零命中 | ① 复用 | R1 |
| C8 多实例 L3 | **反证（本轮实读）**：桌面经**核径**已得三层——L1 提醒 `thincoder-core/agent/setup.mjs:136-139`（`depth === 0 ⇒ pushPeerReminder`，桌面跑核 `runAgent` ⇒ 在射程）· L2 工具 `thincoder-core/tools/index.mjs:73`（`peerInstancesTool` ∈ `assembleBuiltinTools`，桌面 `agent-assemble.mjs:84` 直调）· L3 钩（`agent/dispatch-run.mjs` ∕ `run-stages.mjs`——核管线内）⇒ 判「**非缺项（经核径）**」；VSC 端侧附加面（`thincoder-vscode/src/extension/setup-reminders.mjs:88-102` · `panel-session.mjs:322-324`）**运行期未证** ⇒ 落 R10 复核（缺则补，不缺则销） | 复核 | R10 |
| C9 `.cursor/rules` | VSC 单读面 `src/extension/rules.mjs:29-58` + 消费 `src/agent/rules-face.mjs:40/:58/:70` ∕ `setup.mjs:293` ∕ `execute-tools.mjs:28/:79`；**核全树无 `.cursor`**（CLI 同零）⇒ 上提（并入核 `rules.mjs` 面） | ② 上提 | R10 |
| C21 探针忙闸 | VSC 闸面 = `src/extension/loop-sampler.mjs:36-49/:59-62` + 应用 `provider-probe-window.mjs:112`（宿主忙 ⇒ 让位）——**闸源 = VS Code 宿主响应性采样**（宿主能力）⇒ 端差登记（三件：结构性不对称 = 桌面无宿主忙判据；证据 = 该两档；裁定 = 留） | ③ 真端差（登记） | R10 |

**#82「部分」缺口 5 条**：B16 台账周期刷新 + L2 明细 → **R8**（VSC 源 `ledger-surface.mjs:115/:129` ∕ `ledger.mjs:32` `REFRESH_MS = 120000`；核 `ledger-surface.mjs:21` ∕ `:60` ∕ `:73`）；B29 设置五族 → **R7**；C7 peer L2 提醒注入 → **R10**（与 C8 同族复核）；C11 索引嵌入 UI → **R2**；C12 MCP 工具清单 → **R7**。

**#82 在册四项复核**：skills = **非缺项**（核默认路径同表可用；`configureSkillLoader` = 端差登记，见 §2.3）；会话 GC ∕ 索引 = **真缺** ✅（R1）；多实例 = **降级为复核**（C8 反证）。

**#83（核件能力 × 三端消费）· 未排批 14 族**：宿主配置缝 9 条 → **§2.3 缝对账节**（逐条判定）；提示锚 → R4；顾问面 → **复核**（桌面桥已枚举 `_asyncAdvisors`：`agent-bridge.mjs:147`；`advisorOf` 采样 `:184`）→ R10 复核清单；记忆索引构建维护 → R2；认领 ∕ peer → R10 复核；会话 GC & 索引 → R1；**检查点回退** → R10 复核（`thincoder-core` 检查点出口面未证，VSC 对位面未证——上抛）；团队同步 → **非缺项**（`agent-assemble.mjs:78-83` `ensureClone` + `syncDir` 已在）；config 热更 → R8；skills 列表 → 非缺项；auto-think → R7（设置族内）；回声合并 → R10 复核；日志遥测 → 登记（非用户可见）；render-core toast → **已在盘**（`thincoder-render-core/toast.mjs:10`）+ 消费 = R9（#486）；flow 四档（block ∕ reasoning ∕ tool-card-restore ∕ ledger-line）→ R10 复核（逐档比对核件消费面；已证消费 = `flow/block.mjs` 经 `views/chat-text.mjs`）。

**「CLI 参考面」4 项**：`wait-status` = 核件（`thincoder-core/provider/wait-status.mjs`——R4 经 `onWait` 消费即得）；`closeAllMcp` ∕ `ledger-migrate` = CLI 命令面（桌面无命令面；退出清理 ∕ 迁移面）⇒ 登记（非用户可见面）；`traces` = 同 A9 判定（R10）。

### 2.3 对账节（强制输入逐项 · 台账 #524 —— 源 = 核档头「留端」清单 + 核注入缝登记表；**每次审计现读，本表不复制副本**）

#### A. 核档头「留端」清单逐项对账（现读 14 档 / 18 项 —— 项级一行，缺一项即红）

| # | 留端项（核档:行） | 桌面现状（file:line · 本轮实读） | 处置 |
|---|---|---|---|
| 1 | `subblocks/block.mjs:5` 出生位（活动区区尾 append） | 已接：`renderer/views/activity.mjs:191-196`（建块 + 区尾挂载） | ✓ 已接 |
| 2 | `subblocks/block.mjs:5` 说明行判重（`S._subDescShown`）与插入点 | `renderSubDesc` 已消费（`views/activity.mjs:25` 导入面）；判重面 = 桌面自持 | ✓ 已接（判重面复核归 R5） |
| 3 | `subblocks/block.mjs:5-6` 区钉底（`maybeScrollActivity`）∕ 块级跟滚（`initBlockFollow`） | **零接线**（renderer 全树零命中） | 归先落者 = 块跟滚批 `docs/batches/2026-09-28-desktop-subblock-follow.md` |
| 4 | `subblocks/block.mjs:6` 痕迹 ∕ 帧调度 | 痕迹 **缺**（`subBlocksReduce` 调用未传 trace dep：`renderer/subagent-reduce.mjs:112`）；帧调度 = 桌面自持（`renderer/app.mjs:273` 心跳族） | R5（痕迹）＋ 帧调度登记 |
| 5 | `subblocks/block.mjs:30` 插入点（summary 之后 ∕ `.advisor-content` 之前） | 未逐项核 | R5 核 · 缺则补 |
| 6 | `subblocks/block.mjs:39` 出生闸调用序 ∕ 丢弃痕迹 ∕ 跟滚脏集 ∕ 帧调度 | 调用序 = 桌面自建状态机；丢弃痕 **缺**；脏集 = 块跟滚批；帧调度 = 自持 | R5（痕）＋ 归先落者（脏集） |
| 7 | `subblocks/state.mjs:10-12` 出生位 ∕ 归档入流 ∕ DOM 属性效果 ∕ 痕迹 ∕ 2s 定时刷新 ∕ `resetActivity` | 归档入流 ✓（KD-33 · `docs/desktop/design/PROJECT.md:71`）；DOM 属性效果 = 端幂等派生（同档 §10 AZ）；2s 刷 = 自持（`src/main/subagent-face.mjs:42`）；`resetActivity` **缺**；痕迹 **缺** | R5 |
| 8 | `flow/block.mjs:4` `ctx` ∕ `S` 装配 ∕ 滚动族 ∕ 欢迎条与横幅 | ctx 装配 ∕ 滚动 = 自持（`views/chat-scroll.mjs`）；欢迎条 ∕ 横幅 ✓（`views/chat-guide.mjs` ∕ `views/statusline-banner.mjs`） | 登记（KD-27 外壳留存） |
| 9 | `flow/block.mjs:110` ∕ `:132` `_nextIdx` ∕ `assistantLabeled` ∕ append ∕ 窗口裁剪 ∕ `scrollDown` | 桌面自持（块树 `views/chat-text.mjs`） | 登记 |
| 10 | `flow/tool-card.mjs:10-11` `ctx` 装配面（`_toolRefs` ∕ appendChild ∕ `finishTool` ∕ `hadToolResult` ∕ scrollDown） | 桌面 `views/chat-tool.mjs` 自持 | 登记（复核归 R10） |
| 11 | `flow/stream.mjs:7-8` `ctx` ∕ `S` 指针与帧尾滚动 pin（deps 回调） | `views/chat-stream.mjs` 自持；帧尾 pin 两处：推理 pin ✓（#494 已修）∕ 块 pin = 块跟滚批 | 归先落者 ＋ 登记 |
| 12 | `flow/reasoning.mjs:3` ctx 指针 ∕ 子回合边界判据 ∕ rAF 调度 | 桌面流式面自持（#494 已补 pin） | 登记 |
| 13 | `flow/ledger-line.mjs:4` append 与跟滚 | append ✓（`views/chat.mjs:132-137/:219`）；跟滚面待核 | R8 随轮核 |
| 14 | `flow/queued-mark.mjs:8-9` 气泡 DOM 查询与快照来源 | 归先落者（流程批 R1 #7/#8 ＋ 输入批 B12） | 归先落者 |
| 15 | `cards/permission.mjs:7` append ∕ `scrollIntoView` ∕ deny 聚焦 | 端壳已裁（流程批 §2.2 R1 端壳适配 c 条） | 归先落者 |
| 16 | `cards/question.mjs:5` append ∕ `scrollIntoView` ∕ 输入框初始聚焦 | 同上（流程批 R1 e 条） | 归先落者 |
| 17 | `cards/panel.mjs:4` DOM 写入留端 | 计划卡 ✓（`views/plan.mjs`）；**goal 面板缺**（桌面零 goal 面） | R5 |
| 18 | `composer/model-menu.mjs:20` 会话下拉两段留端 | 输入批面 | 归先落者 |

补充两处（核侧，非 render-core）：`thincoder-core/agent/helpers.mjs:260`「载体留端」（guard 快照载体）＝ 桌面单驱动器无端载体需求 ⇒ 登记；`thincoder-core/config-io.mjs:21`「QuickPick ∕ TUI picker 留端侧」＝ 桌面无同面（表单）⇒ 登记。

#### B. 核注入缝登记表逐档对账（源 = `thincoder-core/test/tool-seams.test.mjs:255-268`）

**计数收正（与台账 #524 记法差 1 —— 已核）**：登记表实读 = **23 行**（11 对 `configure*` ∕ `reset*` = **22 个函数** ＋ 1 命名例外 `setWaitForConditionSource`）；台账记「22 项」= 按 22 个 configure ∕ reset 函数计 ⇒ 两记法并存、**以本行 23 行为对账基数**（防漏检）。

| # | 缝（核档:行） | VSC | CLI | 桌面（本轮实读） | 处置 |
|---|---|---|---|---|---|
| 1 | `configureBatchSegment` ∕ `reset`（`agent-tools/batch.mjs:56/:60`） | ✓ `src/agent/setup-tooltable.mjs:32` | 零 | 零 | 登记（VSC 端壳记账面；CLI 同零 ⇒ 核缺省即全量行为） |
| 2 | `configureEditReceipt` ∕ `reset`（`tools/edit-diff.mjs:398/:402`） | 零 | 零 | 零 | **休眠缝**（三端零消费者）⇒ 核侧裁 · 非本批 |
| 3 | `configureEngMirror` ∕ `reset`（`agent-tools/eng.mjs:30/:34`） | ✓ `setup-tooltable.mjs:89` | 零 | 零 | 端差登记（宿主镜像面：桌面无 mirror 消费面） |
| 4 | `configureExecRun` ∕ `reset`（`tools/exec-run.mjs:25/:30`） | ✓ `src/tools/shared.mjs:191` | 零 | 零 | **本批 R3**（上提可中断执行面入核 ⇒ 两端消费） |
| 5 | `configureGitApproval` ∕ `reset`（`tools/git.mjs:64/:68`） | 零 | 零 | 零 | **休眠缝** ⇒ 核侧裁 |
| 6 | `configureLspHost` ∕ `reset`（`tools/lsp.mjs:30/:34`） | ✓ `src/tools/index.mjs:157` | 零 | 零 | 端差登记（宿主能力：桌面无 LSP 宿主面） |
| 7 | `configureProcessTreeKill` ∕ `reset`（`tools/execute.mjs:74/:78`） | ✓ `src/tools/shared.mjs:192` | 零 | 零 | **R3**（与 #4 同轮） |
| 8 | `configureSkillLoader` ∕ `reset`（`agent-tools/skill.mjs:12/:16`） | ✓ `setup-tooltable.mjs:87` | 零 | 零 | 非缺项（在册复核：桌面走核默认路径同表可用）；loader 形态 = 端差登记 |
| 9 | `configureTreeResolve` ∕ `reset`（`tools/tree.mjs:24/:28`） | ✓ `src/tools/shared.mjs:193` | 零 | 零 | 待复核（R10——CLI 同零 ⇒ 疑非用户可见面；缺则补） |
| 10 | `configureVerifyDiagnostics` ∕ `reset`（`agent-tools/verify.mjs:30/:34`） | ✓ `setup-tooltable.mjs:80` | 零 | 零 | 端差登记（宿主能力：VS Code diagnostics 面） |
| 11 | `configureWritePath` ∕ `reset`（`tools/write-path.mjs:66/:71`） | ✓ `src/tools/shared.mjs:186` | 零 | 零 | 端差登记（宿主能力：编辑器径 vs 直写盘——桌面无编辑器 ⇒ 核缺省正确） |
| E | `setWaitForConditionSource`（`tools/ops.mjs:129`） | 零 | 零 | 零 | 命名例外 ⇒ 休眠（登记） |

**扫域补遗（登记表只扫 `tools/` ∕ `agent-tools/` 两根 ⇒ 根外缝须并行对账）**：根外实测缝 = `configurePromptInjections` ∕ `resetPromptInjections`（`thincoder-core/prompt-files.mjs:92/:97`）——**两端皆接、桌面零** ⇒ **本批 R4**（#519）；KD-42 已把「两清单 + 扫域补遗」定为强制输入（防同类漏检）。

### 2.4 逐轮行动表（R1–R10 · 每轮 = 一份实施契约）

#### R1 · 会话维护线（GC ∕ 索引 ∕ 改名内存标题）

**目标**：桌面补「会话生命周期维护」——启动拍两枚（GC ∕ 索引）+ 用户可见入口（主进程菜单），核出口全在、端侧零算法副本。

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | 新 `src/main/session-maintenance.mjs` | 核 `session-gc.mjs:195/:212/:261` ∕ `session-index-pass.mjs:81/:49/:65` ∕ `session-index-cmd.mjs:35`；VSC `session-gc-command.mjs:29-70` ∕ `session-index-command.mjs:16-43` | 三面：① GC 处理体（候选列举 ⇒ 计数 ⇒ 确认 ⇒ 逐组 `deleteColdCwd` ⇒ 汇总）② 索引重建处理体（`runSessionIndex` 形）③ 启动拍供面（`scheduleSessionGC` + `scheduleSessionIndexPass`；dir = 端侧派生 `sessionsDir()`——VSC 纪律①同款）；零 electron 依赖 ⇒ 平 node 直测 | 新档 ≈140 |
| 2 | `src/main/session-slots.mjs`（196） | 同 #1 | +转口五名（`listColdCwds` ∕ `deleteColdCwd` ∕ `listStaleCwds` ∕ `scheduleSessionGC` ∕ `scheduleSessionIndexPass`） | 196 ⇒ ≈205 |
| 3 | `src/main/ipc.mjs`（262） | `docs/desktop/design/IPC.md` §1 | +2 通道 `session:gc` ∕ `session:index`（处理体出档 #1） | 262 ⇒ ≈276 |
| 4 | `src/preload/preload.cjs` | 同 #3 | 白名单 **31 ⇒ 33** | ≈+2 |
| 5 | `src/main/main.mjs`（109） | VSC `extension.mjs:175` | 启动拍点火（窗口 ready 后两枚；`scheduledPrefixes` 语义天然去重） | 109 ⇒ ≈120 |
| 6 | `src/main/window.mjs`（137） | VSC 命令 = 命令面板项 | 菜单「维护」两项（GC ∕ 索引重建）——桌面可见入口（命令面板本体 = 端差登记） | 137 ⇒ ≈152 |
| 7 | `src/main/agent-host.mjs`（375） | CLI `src/tui/cmd-session.mjs:35` | #525：+`syncTitle(slot, title)`（装配表命中 ⇒ 写 `agent.title`；不在场 ⇒ 零动作） | 375 ⇒ ≈385 |
| 8 | `src/main/ipc.mjs`（同 #3） | 同 #7 | `sessionRename` 成功径 ⇒ `agentHost?.syncTitle(...)` | 同 #3 |
| 9 | 新 `test/session-maintenance.test.mjs` | — | GC 三态（无候选 ∕ 拒确认零删除 ∕ 逐组回收）+ 索引重建回执 + 启动拍去重 + dir 注入沙箱 | 新档 ≈120 |
| 10 | `test/session-contract.test.mjs`（332）随动 | — | 白名单 ∕ 通道面断言 | ±≤5 |
| 11 | `test/agent-host.test.mjs`（490 · 距硬限 10） | #525 | +1 例（改名后内存标题）；**先拆后改**（拆点 = 流程批 §2.1 定稿 `test/agent-host-lifecycle.test.mjs`） | 490 ⇒ ≤500（拆后 ≈270） |

**验收（机检）**：桌面套件绿（≥263 + 新例）；GC 用例三态断言 + `deleteColdCwd` 拒绝径（零删除）；`session:index` 回执面。**真机**：菜单两项可达 + 启动拍无红。
**边界**：命令面板 ∕ VSC ∕ CLI 命令注册面零动；核零改（出口全在）。

#### R2 · 索引数据面（语义索引构建 ∕ memory:status 核出口 ∕ 索引状态 UI）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | 新核档 `thincoder-core/memory-status.mjs` | 父侧裁 `docs/desktop/design/PROJECT.md:725`（N 行）；现读数 = CLI ∕ VSC 直读表 | **只读出口** `memoryStatus()`（三表计数单点）；零动作面 ∕ 零端名 | 新档 ≈70 |
| 2 | `thincoder-core/memory.mjs` | `:18/:21` 汇总先例 | re-export 出口（面名归汇总档） | +2 |
| 3 | 新 `src/main/index-status.mjs` | VSC `panel-index.mjs:146/:180/:186-187`；核 `memory/code-sync.mjs:192` ∕ `memory/docs.mjs:25` | 构建入口处理体（`codeSync` + `docSync` + `gitSync`；句柄 ∕ embedder 装配面已有 = `agent-assemble.mjs:62-65`）+ 状态读数 | 新档 ≈120 |
| 4 | `src/main/ipc.mjs` | — | +2 通道 `index:build` ∕ `index:status` | ⇒ ≈290 |
| 5 | `src/preload/preload.cjs` | — | 白名单 +2 | +2 |
| 6 | `src/main/settings.mjs`（254） | VSC `readIndexCounts` 对位（本批改走核出口） | 状态读数装配 | 254 ⇒ ≈272 |
| 7 | `renderer/views/settings-sections.mjs`（357 · 越顾问线） | VSC `settings-tools.js:199-207` 族行 | 索引族行（状态 + 构建钮 + 状态行）；**先拆后改**（索引段出档 `settings-sections-index.mjs`） | 357 ⇒ ≈300（+新档 ≈80） |
| 8 | `renderer/mount-settings.mjs`（500 顶格） | 同上 | 接线随动（**先拆后改**——拆点归先落者） | ≤500 |
| 9 | `renderer/i18n-views.mjs`（69） | — | +键 ≈6 | ⇒ ≈80 |
| 10 | 新核 `test/memory-status.test.mjs` | — | 出口读数（零写面断言） | 新档 ≈60 |
| 11 | `test/settings.test.mjs`（301）随动 + 新例 | — | 两通道回执 ∕ 状态行 | ±≤10 |

**验收（机检）**：核套件绿（新档）；桌面两通道回执 + 族行在场；**零端侧直读核表**（负控：桌面树 grep 无 SQL ∕ 表名）。**真机**：构建钮真跑一次（小仓库）+ 状态刷新。
**边界**：CLI ∕ VSC 现有直读面**不改指**（登记 = §2.9 上抛 3）；embedding key 配置写面 = R7。

#### R3 · 回合引擎线（turn-cap 续跑 ∕ onDistilled 落盘 ∕ 可中断执行缝）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `src/main/turn-face.mjs`（78） | 核 `agent/helpers.mjs:237`（`ContinueError`）；CLI `agent-turn.mjs:196-227`；VSC `panel-turn-loop.mjs:130-155` | 撞帽支：`autoTurn`（消化轮）⇒ cap 即收口（核 D-TC15 同支，零自续）；用户回合 ⇒ **「继续？」询问面**（载体 = 复用既有待决门 —— 薄形）⇒ 同意 ⇒ 重建 controller + 重入同回合（历史已在 ⇒ 不重推用户消息）；拒绝 ⇒ `stopped` 结算 | 78 ⇒ ≈125 |
| 2 | `src/main/agent-host.mjs`（375） | 同 #1 | 续跑装配（controller 重建 + 在飞表守卫 + 墓碑查位同判） | 375 ⇒ ≈395 |
| 3 | `src/main/session-io.mjs`（38） | CLI `tool-events.mjs:397`；VSC `panel-callbacks.mjs:242` | #520：`saveAgentSlot` 追加蒸馏落位调用点（落盘即时 ⇒ 盘面不留未压缩版） | 38 ⇒ ≈50 |
| 4 | `src/main/agent-bridge.mjs`（249） | 核 `explore-distill.mjs:150` | +`onDistilled` 回调用（落盘动作经注入面 —— 桥零宿主依赖律不破） | 249 ⇒ ≈262 |
| 5 | 核 `thincoder-core/tools/exec-run.mjs`（40） ∕ `tools/execute.mjs` | VSC `src/tools/shared.mjs:102`（`runInterruptible`）∥ `:192` 邻面（`killProcessTree`） | **上提**（纯搬 + 转口，零语义改）：可中断执行 + 进程树 kill 落核 | 核 +≈70 |
| 6 | 新 `src/main/exec-run.mjs` | 同 #5 | 桌面实现面（`child_process` 适配 + kill 树） | 新档 ≈80 |
| 7 | `src/main/agent-assemble.mjs`（96） | VSC `tools/shared.mjs:191-192` | 装配期两缝注册（`configureExecRun` + `configureProcessTreeKill`）——**序沿流程批先落者** | 96 ⇒ ≈112 |
| 8 | `thincoder-vscode/src/tools/shared.mjs:186-193` 邻面 | 同 #5 | 改指核件（VSC 侧零行为变） | 改指 |
| 9 | 新 `test/turn-continue.test.mjs` | — | 撞帽三径（续 ∕ 拒 ∕ autoTurn 收口） | 新档 ≈110 |
| 10 | 新 `test/exec-run.test.mjs` | — | 可中断（abort ⇒ 进程死）+ kill 树 | 新档 ≈90 |
| 11 | `test/agent-host.test.mjs` 随动 + 核 `test/tool-seams.test.mjs` 随动 | — | 缝行 ∕ 新例 | ±≤10 |

**验收（机检）**：核缝登记表仍等值（`tool-seams` ① 自检绿）；桌面续跑三径断言 + exec 中断断言。**真机**：长回合撞帽 ⇒ 询问面可见 ∕ 继续可跑；长 bash ⇒ Stop 真停（子进程死）。
**边界**：核循环语义零改（只接缝）；VSC 侧仅改指。

#### R4 · 提示锚 + 状态面（promptInjections ∕ onWait ∕ onCompress* ∕ 压缩状态行 ∕ 限流配额段）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | 新 `src/main/prompt-injections.mjs` | CLI `src/prompt-injections.mjs:15-20` ∕ VSC `:16-21`；核 `prompt-files.mjs:92-113`（缺键 ⇒ 抛） | 桌面取值表（两锚）——**语义要件**：`bash-terminal-face` = 桌面无可见终端（类 CLI 语义）· `question-ui-face` = 有流内问题卡（类 VSC 语义）；**字面定稿权 = 主 agent**（§2.9 上抛 1） | 新档 ≈30 |
| 2 | `src/main/main.mjs`（109） | 同 #1 | 装配**之前**一次性注册（进程入口；先例 = CLI `bin/thincoder.mjs:32` ∕ VSC `extension.mjs:92`） | 109 ⇒ ≈116 |
| 3 | `src/main/agent-bridge.mjs`（249） | 核 `agent.mjs:274`（`onWait`）∥ `context.mjs:304` ∕ `run-stages.mjs:89/:98/:106` | +四回调（`onWait` ∕ `onCompressStart` ∕ `onCompress` ∕ `onCompressFail`）⇒ 出站 `ev:statusText` ∕ `ev:compress` | 249 ⇒ ≈290 |
| 4 | `src/main/agent-host.mjs`（375） | — | 回调注入（桥取键 ⇒ 本档供） | ±≤8 |
| 5 | `src/preload/preload.cjs` + `renderer/events-subscribe.mjs`（78） | — | 事件通道 +2 ⇒ **渲染面通道计数 18 ⇒ 20**（随轮收正 `docs/desktop/design/IPC.md` §1 与 §10 BE 行） | +2 ∕ +2 |
| 6 | `renderer/events.mjs`（498） | — | 归约 +2 切片（**拆分归先落者**——输入批 R1 `events-flags.mjs` 落地后加片） | ≤500（拆后 ≈480） |
| 7 | `renderer/views/statusline.mjs`（293） | VSC `status-bar.js:27-30` + `:101-112` | +状态文本段（五 kind）；词面单源 = 核 `provider/wait-status.mjs`（本批零自铸词） | 293 ⇒ ≈335 |
| 8 | 新 `renderer/views/compress-status.mjs` | VSC `webview/chat-status.js:17-44` | 流内压缩状态行（单元素四态；挂载 = `views/chat.mjs`） | 新档 ≈70 |
| 9 | `renderer/i18n-views.mjs`（69） | — | +键 ≈10（五 kind + 四态） | ⇒ ≈90 |
| 10 | 新 `test/compress-status.test.mjs` | — | 四态断言 | 新档 ≈80 |
| 11 | `test/views-statusline.test.mjs`（329） ∕ `test/events-reduce.test.mjs`（465）随动 | — | 段 ∕ 切片断言 | ±≤10 |

**验收（机检）**：两锚替换生效（用例：注册后工具描述无 `{{inject:` 残留；缺键抛面）；状态段五 kind 取值表；压缩行四态。**真机**：限流 ∕ 配额段真机可见（假 provider 造 429）；压缩真跑一次见流内行。
**边界**：核锚文法 ∕ 三态零改；词面零自铸。

#### R5 · 子代理面（child-marks ∕ subblocks 态机三面 ∕ goal 面板）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `src/main/agent-bridge.mjs`（249） | 核 `agent/child-marks.mjs:19/:24`；CLI `tool-events.mjs:217` ∕ VSC `panel-callbacks.mjs:102-103` | `onToolResult` 检出两锚 ⇒ 块头注记载荷（注记文案 = **核件** `subblocks/activity-view.mjs:39-75` 载体） | ⇒ ≈275 |
| 2 | `renderer/subagent-reduce.mjs`（138） | VSC `webview/activity.js:141-144/:180-189`；核 `subblocks/state.mjs:10-12` | 三面：① `resetActivity` 语义接（会话中止 ∕ 清屏 ⇒ 池面 + 表复位）② `subBlocksFreezeAll`（退出兜底）③ 出生闸形差收正（与核 `ensureSubBlock` 同律；「内容先到」可达性 = 运行期复核） | 138 ⇒ ≈175 |
| 3 | `renderer/views/activity.mjs`（322） | 核件 | 三执行面随动 + 块头注记呈现（核件直出 —— 端零文案） | ±≤15 |
| 4 | 新 `renderer/views/goal.mjs` | 核 `cards/panel.mjs:26/:74`；VSC `panels.js:30-35` | goal 面（`renderGoalPanel` + `goalPanelVisible` 直取） | 新档 ≈60 |
| 5 | `renderer/mount-cards.mjs`（185） | VSC `index.html:37` | goal 挂载 + 状态行 🎯 徽标 | ⇒ ≈200 |
| 6 | `renderer/events.mjs`（498） | VSC `chat-messages.js:230` | goal 消息归约切片 | ±≤8 |
| 7 | `renderer/views/statusline.mjs`（293） | VSC `status-bar.js:24/:83` | 🎯 段（在场判据随核件） | ⇒ ≈300 |
| 8 | `renderer/i18n-views.mjs`（69） | — | +键 ≈5 | ⇒ ≈78 |
| 9 | 新 `test/views-goal.test.mjs` | — | goal 显隐两态 + 挂载 | 新档 ≈90 |
| 10 | `test/events-subagent.test.mjs`（171） ∕ `test/views-activity.test.mjs`（391）随动 | — | 三面断言 | ±≤12 |

**验收（机检）**：三面各自用例（reset 后零 running 态残留 ∕ 退出兜底冻结 ∕ 出生闸三态）+ marks 注记在场断言（注入含锚的 tool result ⇒ 块头注记）。**真机**：撞帽子代理块头见注记；中止会话 ⇒ 池面净。
**边界**：**块内容区跟滚 ∕ 区钉底零触**（归先落者 = 块跟滚批）；池面描述符族零改。

#### R6 · 会话内搜索（上提 + 两端）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | 新 `thincoder-render-core/search.mjs` | VSC `thincoder-vscode/webview/search.js:56-80`（`performSearch`——TreeWalker 文本扫描 + `mark.search-hit` 高亮；**纯 webview 零宿主通道**）+ `:103-137`（`#search-bar` UI）+ `:159-165`（Ctrl+F 入口） | 整件上提（工厂化 + 注入面：`root` 元素供面；纯搬零语义改） | 新档 ≈200 |
| 2 | `thincoder-render-core/search.css`（或并入既有核 css —— 实施择） | 同 #1 样式段 | 样式随核件（**桌面 css 零新增**——经 `/rc/` 供给） | 新档 ≈60 |
| 3 | `thincoder-vscode/webview/search.js` | 同 #1 | 改指核件（端壳：`root` 绑定 + 既有宿主键位） | ⇒ ≈30 |
| 4 | 桌面 新 `renderer/search.mjs` | 同 #1 | 端壳（核件直取 + Ctrl+F 绑定 + 消息容器供面） | 新档 ≈40 |
| 5 | `renderer/app.mjs`（300） | 同 #1 | 接线一行（挂载面随帧出口） | ±≤5 |
| 6 | `renderer/index.html` | 同 #1 | 核件 css 链入 | ±≤2 |
| 7 | 核 新 `thincoder-render-core/test/search.test.mjs` | — | 扫描 ∕ 高亮 ∕ 上下跳 ∕ Esc 关 | 新档 ≈120 |
| 8 | `thincoder-vscode/test/*`（search 面）随动 + 桌面 `test/views-chat-frame.test.mjs`（418）随动 | — | 改指后零行为变 | ±≤10 |

**验收（机检）**：核件用例（含 `mark` 类名 ∕ 命中计数）+ 两端改指后各自套件绿。**真机**：桌面 Ctrl+F 真搜（命中高亮 + 上下跳 + Esc 关）。
**边界**：VSC 侧零行为变；桌面零样式新增。

#### R7 · 设置五族 + MCP 工具清单

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `renderer/views/settings.mjs`（297） | VSC `settings-env.js`（204）· `settings-tools.js`（399）· `settings-agent.js`（184）· `settings-models.js`（218） | 族闭集 **4 ⇒ 7 段**（providers ∕ model ∕ agent ∕ mcp ＋ env〔proxy + shell〕＋ tools〔embedding ∕ websearch ∕ 索引状态〕＋ models〔consult ∕ advisor 行〕） | 297 ⇒ ≈340 |
| 2 | `renderer/views/settings-sections.mjs`（357 · R2 已拆索引段） | 同 #1 | env ∕ tools ∕ models 三段体先拆后改（拆点 = 新 `settings-sections-env.mjs` ∕ `-tools.mjs`） | 357 ⇒ ≈300（+新档） |
| 3 | `renderer/mount-settings.mjs`（500 顶格） | — | 接线随动（**先拆后改**——拆点归先落者；本批只加挂载行） | ≤500 |
| 4 | `src/main/settings.mjs`（254） | VSC `panel-messages.mjs:22`（Shell ∕ Proxy ∕ TestProxy ∕ BuildIndex ∕ EmbedKey ∕ WebsearchKey 全在册） | +处理体：env 读写（proxy ∕ shell；写经核 `writeConfigAtomic`）· embedding ∕ websearch key · consult ∕ advisor 行 · auto-think 档（`agent` 族扩） | 254 ⇒ ≈340 |
| 5 | `src/main/providers.mjs`（151） | VSC TestProxy 对位 | `TestProxy` 出口（复用既有探针面——零第二探针） | ±≤15 |
| 6 | `src/main/mcp-servers.mjs`（120） | VSC `settings-tools.js:199-207/:244-263` + `panel-messages-settings.mjs:126-138` + `panel-mcp.mjs:145-152` | +`mcp:tools`（连接列举 ⇒ 逐工具 name ∕ description ∕ params）+ Test 探活（`probeMcpServer` 一次） | 120 ⇒ ≈190 |
| 7 | `src/main/ipc.mjs` ∕ `src/preload/preload.cjs` | — | +3 通道（`settings:env` ∕ `settings:tools` ∕ `mcp:tools`）；白名单 +3 | ±≤20 |
| 8 | `renderer/i18n-views.mjs`（69） | — | +键 ≈30 | ⇒ ≈110 |
| 9 | `test/settings.test.mjs`（301）· `test/views-settings.test.mjs`（447）· `test/mcp-servers.test.mjs`（158）随动 + 新例 | — | 三通道回执 + 工具清单逐行 + 探活失败径 | ±≤20 |

**验收（机检）**：七段全在场断言 + 三通道回执 + MCP 工具清单行数 = 探活回执长；**负控**：proxy ∕ shell 写径经核原子写（端侧自写盘零命中）。**真机**：五族逐项可编可存 + MCP Test 真探一次。
**边界**：VSC 端壳档零改（只对位族面）；设置面越层档先拆后改。

#### R8 · 台账周期刷新 + L2 明细 + config 热更

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `src/main/project-info.mjs`（97） | 核 `ledger-surface.mjs:21`（`runLedgerScan`）`:60`（`startLedgerSurface`）`:73`；`ledger.mjs:32`（`REFRESH_MS = 120000`）；VSC `ledger-surface.mjs:115/:129` | 周期刷新（消费核拍面——**推解** `docs/desktop/design/UI.md:35` open 行）+ L2 明细行（状态栏 tooltip 面：VSC `:69` `detailScans` ∕ `formatDetailLine`） | 97 ⇒ ≈150 |
| 2 | 新核档 `thincoder-core/config-watch.mjs` | VSC `src/extension/config-watch.mjs:35-77`（去抖 300ms ∕ stat 元组比对 ∕ 自写抑制；核 `config-io.mjs:107` `onConfigSelfWrite` 已在） | **上提**纯逻辑（fs 事件源 ∕ 定时器经注入） | 新档 ≈90 |
| 3 | `thincoder-vscode/src/extension/config-watch.mjs` | 同 #2 | 改指核件（`createFileSystemWatcher` 源保留 = 平台落子） | ⇒ ≈50 |
| 4 | 新 `src/main/config-watch.mjs` | 同 #2 | 桌面消费（`node:fs.watch` 源 = 平台落子；生命周期随窗口） | 新档 ≈60 |
| 5 | `src/main/main.mjs`（109） | 同 #4 | 起 watch（就绪后；自写抑制入参） | ±≤10 |
| 6 | `renderer/views/statusline.mjs`（293） | VSC `status-bar.js` 明细行 | L2 明细呈现（tooltip ∕ 行） | ±≤15 |
| 7 | 核 新 `test/config-watch.test.mjs` + VSC `test/`（watch 面）随动 | — | 去抖 ∕ 自写抑制 ∕ 元组比对 | 新档 ≈90 |
| 8 | 桌面 `test/project-info.test.mjs`（172）随动 + 新例 | — | 周期刷新（时钟注入）+ 明细行 | ±≤15 |

**验收（机检）**：周期拍（假时钟）真触发 + 明细行取值；watch 三态（外写 ∕ 自写 ∕ 无变更）。**真机**：手改 `config.json` ⇒ 设置面随动；台账行周期真刷。
**边界**：核扫描语义零改（只接拍面）；桌面无第二份扫描实现。

#### R9 · 宿主人格小修族（骨架残余 ∕ 坏配置 ∕ start ∕ 失败面可见性）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | `src/main/protocol.mjs`（89） | #389① / ③ | ① 门①正读数探针（`../styles.css` 形态 ⇒ 命中逃逸门）+ ③ `will-navigate` 拦窗口自身导航（外部 URL ⇒ 拒） | 89 ⇒ ≈105 |
| 2 | `src/main/window.mjs`（137） | 同 #1 | `will-navigate` 钩点（`webContents` 面） | ±≤10 |
| 3 | `test/guard-closure.test.mjs`（115） | #389① / ② | ① 两门各一正控探针（门① 读数 > 0）；② 增长条款判据（渲染面 JS 档计数 ≥3 时的闭包臂） | 115 ⇒ ≈140 |
| 4 | `test/host-floor.test.mjs`（364） | #389④ | U11 unverified-until-host ⇒ 真机可判面收正（宿主在场 ⇒ 判真） | ±≤20 |
| 5 | `src/main/ipc.mjs`（262） | #398 | `config:read` 的 `loadConfig` 注入缝（沿核 `_setSessionsDirForTest` 先例） | ±≤8 |
| 6 | 新 `test/config-fail-loud.test.mjs` | #398 | 坏 JSON ⇒ 期望读数（抛出 ∕ fail-loud 面）；缺文件 ⇒ 缺省 | 新档 ≈80 |
| 7 | `thincoder-desktop/package.json` | #453 | `"start": "electron ."`（1 行；**产品文本面 ⇒ 走正常流程**） | +1 |
| 8 | `thincoder-desktop/AGENTS.md` | 同 #7 | 起实例命令行 | +1 |
| 9 | `renderer/mount-sessions.mjs`（199） | #486；VSC `panel-messages-session.mjs:43/:53/:66` | 失败三径 ⇒ 可见提示（载体 = 核 `toast.mjs:10`；词面 = 端词表） | 199 ⇒ ≈215 |
| 10 | `test/session-open.test.mjs`（138）· `test/history-page.test.mjs`（173）随动 | — | 失败径提示断言 | ±≤12 |

**验收（机检）**：门①/门② 各正控读数；坏配置两态用例；失败径提示在场（渲染面断言）。**真机**：`npm start` 起实例；切坏槽 ⇒ 见提示。
**边界**：骨架批既有断言零删（只增读数）；协议判定序零改。

#### R10 · 判定与复核族（`.cursor/rules` 上提 ∕ 探针忙闸 ∕ traces ∕ #436 ∕ 复核清单）

| # | 档（现读） | 源（出处） | 改动要点 | 预期 |
|---|---|---|---|---|
| 1 | 核 `thincoder-core/rules.mjs` | VSC `src/extension/rules.mjs:29-58`（单读 `.cursor/rules`——`:33` 目录 ∕ `:50` source 标记） | **上提**（`.cursor/rules` 读取并入核规则面；纯搬零语义改） | 核 +≈50 |
| 2 | `thincoder-vscode/src/extension/rules.mjs` ∕ `src/agent/rules-face.mjs:40/:58/:70` ∕ `src/agent/setup.mjs:293` ∕ `src/agent/execute-tools.mjs:28/:79` | 同 #1 | 改指核件（端壳零行为变） | 改指 |
| 3 | 桌面 `src/main/agent-assemble.mjs`（96） | 同 #1 | **零改**（`discoverRules` 已在 ⇒ 上提即得）——用例证明 | +0 |
| 4 | 核 新 `test/rules-cursor.test.mjs` + VSC `test/scoped-rules.test.mjs`（154）随动 | — | `.cursor/rules` 发现 ∕ 作用域 ∕ 常驻集尾块 | 新档 ≈90 |
| 5 | **复核清单（零码 · 运行期或补勘 ⇒ 缺则立轮）** | — | ① C8/C7 多实例端侧附加面（peer L2 提醒 ∕ panel 展示）② 顾问面 ∕ 认领 ③ 检查点回退（VSC 对位面未证）④ 回声合并 ⑤ flow 四档逐档消费面 ⑥ `configureTreeResolve` ⑦ #522「内容先到」可达性 ⑧ `flow/ledger-line` 跟滚 | 复核表 |
| 6 | **判定登记（零码）** | — | ① 探针忙闸 = 端差登记（三件见 §2.2 C21）② `traces` ∕ `stopTrace` = 非用户可见面 ⇒ 不做（上抛 4）③ #436 = 归先落者 + 判定句（KD-T6）④ 命令面板 = 端差登记 ⑤ 核休眠缝三项 = 核侧裁 | 登记行 |

**验收（机检）**：核 ∕ VSC 规则面套件绿 + 桌面随动零回归；复核清单产出书面结论（在册于 §5）。
**边界**：核侧休眠缝零动；CLI ∕ VSC 现有直读面（memory 表）零动。

### 2.5 受影响文件总表（现读 = 本轮实读；Δ = 估算）

**新档（本批产物 · 不计入每轮 15 档计量）**：核 `memory-status.mjs`（≈70）· 核 `config-watch.mjs`（≈90）· 核 `tools/exec-run.mjs` 扩（+≈70）；render-core `search.mjs`（≈200）+ `search.css`（≈60）；桌面 `session-maintenance.mjs`（≈140）· `index-status.mjs`（≈120）· `exec-run.mjs`（≈80）· `prompt-injections.mjs`（≈30）· `config-watch.mjs`（≈60）；渲染面 `views/compress-status.mjs`（≈70）· `views/goal.mjs`（≈60）· `search.mjs`（≈40）。

**改档（按轮 · 现读 ⇒ Δ）**：
- R1：`session-slots.mjs`（196 ⇒ 205）· `ipc.mjs`（262 ⇒ 276）· `preload.cjs`（⇒ +2）· `main.mjs`（109 ⇒ 120）· `window.mjs`（137 ⇒ 152）· `agent-host.mjs`（375 ⇒ 395）
- R2：`settings.mjs`（254 ⇒ 272）· `views/settings-sections.mjs`（357 ⇒ 300 + 新档）· `mount-settings.mjs`（500 ⇒ ≤500）· `i18n-views.mjs`（69 ⇒ 80）
- R3：`turn-face.mjs`（78 ⇒ 125）· `session-io.mjs`（38 ⇒ 50）· `agent-bridge.mjs`（249 ⇒ 262）· `agent-assemble.mjs`（96 ⇒ 112）· 核 `tools/execute.mjs` ∕ `tools/exec-run.mjs`
- R4：`agent-bridge.mjs`（⇒ 290）· `events.mjs`（498 ⇒ ≤500·拆后 ≈480）· `views/statusline.mjs`（293 ⇒ 335）· `i18n-views.mjs`（⇒ 90）· `preload.cjs` ∕ `events-subscribe.mjs`（⇒ +2）
- R5：`subagent-reduce.mjs`（138 ⇒ 175）· `views/activity.mjs`（322 ⇒ 337）· `mount-cards.mjs`（185 ⇒ 200）· `views/statusline.mjs`（⇒ 300）· `i18n-views.mjs`
- R6：VSC `webview/search.js`（⇒ ≈30）· 桌面 `app.mjs`（300 ⇒ 305）· `index.html`
- R7：`views/settings.mjs`（297 ⇒ 340）· `mount-settings.mjs`（≤500）· `src/main/settings.mjs`（⇒ 340）· `providers.mjs`（151 ⇒ 166）· `mcp-servers.mjs`（120 ⇒ 190）· `ipc.mjs` ∕ `preload.cjs`
- R8：`project-info.mjs`（97 ⇒ 150）· `main.mjs` · VSC `config-watch.mjs`（⇒ 50）· `views/statusline.mjs`
- R9：`protocol.mjs`（89 ⇒ 105）· `window.mjs`（⇒ 147）· `ipc.mjs`（⇒ 270）· `mount-sessions.mjs`（199 ⇒ 215）· `package.json`（+1）· `AGENTS.md`（+1）
- R10：核 `rules.mjs`（+≈50）· VSC 四档改指

**越层档处置（逐档）**：`mount-settings.mjs` **500**（顶格）· `styles.css` **499** · `i18n.mjs` **490** · `events.mjs` **498** · `test/agent-host.test.mjs` **490** —— **一律「先拆后改」**（拆点 = 流程批 §2.1 硬限邻档拆档定稿；拆档执行归先落者，本批消费）；`views/settings-sections.mjs` **357** · `subagent-reduce.mjs`（⇒175）· `views/compress-status.mjs`（新）—— 本批 R2 ∕ R5 自持拆点（说明在册）。

### 2.6 验收（批级 · 机检化）

| 面 | 判据（机检 ⇒ 可绿） |
|---|---|
| 桌面套件 | `cd thincoder-desktop && npm test` 全绿（现基线 ≥263 例 + 本批新例 ≈28）；逐轮用例行见各轮验收 |
| 核套件 | `cd thincoder-core && npm test` 全绿（含 **`tool-seams.test.mjs` 结构机检 ①/②** —— 新增缝必登记；本批扩核件后登记表须同步） |
| VSC/CLI / render-core | 各自套件全绿（改指面：R3 ∕ R6 ∕ R8 ∕ R10；VSC 零行为变由既有用例锁） |
| **三态面机检** | ① 桌面树 grep 零 `configure*` 未接缝（登记表 23 行逐行判据化：接 ∕ 登记 ∕ 核侧裁）② 桌面树零 `{{inject:` 字面残留（R4 后）③ 桌面树零 SQL ∕ 表名直读（memory 面负控）④ 通道计数三处同值（`preload.cjs` ∕ `IPC.md` §1 ∕ `events-subscribe.mjs`） |
| 真机（父侧走查） | R1 菜单两项 + 启动拍 · R3 撞帽续跑 + 长 bash 停止 · R4 限流段 + 压缩行 · R5 goal 面板 + 撞帽注记 · R6 Ctrl+F 搜索 · R7 五族 + MCP 清单 · R8 台账周期 + config 手改 · R9 `npm start` + 失败提示 |
| 收口 | 批档 §6（父侧）；各轮设计档收正行逐轮核 |

### 2.7 关键决策（KD-T1–KD-T8）

- **KD-T1 三态判据 + 举证不足即 ① 消除**（用户 19:39 直令 + §3.6；沿流程批 §2.0 口径）——本批 10 轮全部按此裁。
- **KD-T2 上提面四处**（`runInterruptible` ∕ `killProcessTree` · `config-watch` 去抖纯逻辑 · `.cursor/rules` 读取 · `webview/search.js` 全件）——**上提 = 纯搬 + 转口零语义改**，VSC 同轮改指；被否：端侧复刻（第二实现 = 漂移面，且 #518 已证同类必漏）。
- **KD-T3 端差登记四处**（命令面板本体 · 宿主能力缝 7 类〔LSP ∕ diagnostics ∕ 编辑器写径 ∕ mirror ∕ skill loader ∕ tree resolve 复核 ∕ 宿主忙采样〕· 通知平台落子与 diff 查看器沿流程批 · 探针忙闸）——三件齐才留（结构性不对称 + 证据 + 裁定），逐条在 §2.3 缝表与 §2.2 C21 行。
- **KD-T4 会话维护入口与点火形**（台账 #406 三择一）：**采 ②「端层显式点火」**——桌面恢复径有意走 `loadSlotFile`（`src/main/session-io.mjs:13-17` 明示：`resumeSlot` 含认领写 ∕ marker 写 ∕ GC 调度，桌面槽号已知不得另起认领竞争）⇒ **否决 ① 改走包装版**（引入认领竞争）· **否决 ③「GC 归 CLI 单点」**（违对齐判据）；入口 = 主进程菜单两项（命令面板本体 = 端差）。
- **KD-T5 条目性质更正两处**：#410 盘面已在（零动作，建议核销）· `memory:status` 正解 = 核只读出口（`memory-status.mjs`）+ 桌面消费（端侧零直读）。
- **KD-T6 #436 判定句**（归先落者 = 输入批 R1）：「**队长 > 0 ∧ 键位空闲 ⇒ Enter 先发队首**（不新发）」——与 VSC 队列由回合尾消费同向；若先落者采「新发优先」，须在 `docs/desktop/design/UI.md` §1 输入区行**明写为有意口径**（不得静默留）。
- **KD-T7 越层档一律先拆后改 + 归先落者**（§2.5 表逐档）——被否：续期（500 顶格档再增即越硬限）。
- **KD-T8 turn-cap 续跑形态**：**复用既有待决门**（`suspensions` 三门户面）承载「继续？」——被否：新造确认 UI（第二交互面）；被否：自动续（核 D-TC15 已否无人值守自续）。

### 2.8 边界（不做）

1. **非用户可见面不做**：`traces` ∕ `stopTrace`（VSC 开发者诊断）· CLI `closeAllMcp` ∕ `ledger-migrate`（CLI 命令面）——登记 + 上抛（§2.9 上抛 4）。
2. **核侧休眠缝三项零动**：`configureEditReceipt` ∕ `configureGitApproval` ∕ `setWaitForConditionSource`（三端零消费者）⇒ 核侧裁。
3. **CLI ∕ VSC 现有 memory 表直读面零动**（改指 = 另裁；本批只保证桌面零直读）。
4. **在飞三批面零触**（§2.0 跨批序五项）——含 `composer/**` · 卡三面 · 队列 ∕ 待发送面 · 块内容区跟滚 · `styles.css` ∕ `mount-settings.mjs` 拆档执行（归先落者）。
5. **需求档零改**（笔权在父侧）；**命令面板 ∕ 编辑器 ∕ LSP 等宿主面不新造**。
6. **不做「登记后保留」通道**（用户 2026-09-28 18:57 判据：用户可见端差 = 缺陷一律消除；唯一例外 = 宿主能力面且不得引入用户可见差异，须实证）。

### 2.9 上抛与发现项

**上抛（9 项）**：
1. **#519 两锚字面定稿权**：`bash-terminal-face` ∕ `question-ui-face` 的桌面取值**措辞属提示词面内容**（主 agent 内容权）——本设计只给语义要件（无可见终端 ∕ 有流内问题卡）；实施前须父侧定稿（否则 R4 停在该项）。
2. **需求档 §3.6「功能面全量对位」块无机检化验收条目**（无 D 号 ∕ 无 AC 行）——建议父侧补一行（D27 或 AC），使「缺项一次补齐」可核销（本设计不改需求档）。
3. **C8/C7 多实例「真缺」判词存疑（反证在册）**：桌面经核径已得 L1/L2/L3（`agent/setup.mjs:136-139` · `tools/index.mjs:73` · 核 dispatch ∕ run-stages 钩）；VSC 端侧附加面未证 ⇒ 请父侧裁「销 ∕ 复核」。
4. **`traces` ∕ `stopTrace` 判定「非用户可见 · 不做」**——请确认（若判须做 ⇒ 另立轮，含 VSC 侧上提）。
5. **端差登记五处请确认留项**（命令面板 · 宿主能力缝 7 类 · 探针忙闸 · 通知平台落子 ∕ diff 查看器〔沿流程批〕）。
6. **#410 建议核销**（盘面已在）；`docs/desktop/design/IPC.md` 无需收正（§2 ∕ §1 已载作答通道）。
7. **复核清单（8 项）**（R10 表列）——含「检查点回退」：**VSC 对位面本轮未证**（核出口 ∕ VSC 消费面均未实读）⇒ 补勘后定。
8. **计数收正两处**：核缝登记表 22（台账记法）vs 23（实读行数，含命名例外）——本表以 23 为对账基数；渲染面通道 **18 ⇒ 20**（R4 随轮收正三处同值）。
9. **#436 归先落者 → 请知会输入批**（判定句 KD-T6）。

**发现项（本轮实读 · 逐条报告）**：① **#410 前提不成立**（作答通道盘面已在——证据链见 §2.1）② **C8 反证**（同§2.2）③ **§1.4 记「CLI 参考面 4 项…traces」与盘面不符**：CLI 全树**无 `/traces` 命令**（slash 注册表 26 命令逐条在册、literal `/traces` 零命中；traces 相关面仅启动清理 `bin/thincoder.mjs:19-20` + `/config` 开关 `cmd-config.mjs:355-356`）——请父侧收正 §1.4 该表述 ④ **缝登记表扫域仅 `tools/` ∕ `agent-tools/` 两根**（根外缝须并行对账——已入 KD-42 方法注记）⑤ **`#523⑤` 休眠缝两项**与 `setWaitForConditionSource` **同族**（三端零消费者）——建议合并为一条核侧裁议题。

### 评审轮 1 修正（fix · 1–14 逐号 · eng-designer · 2026-09-28）

**缘由** = §3 轮次 1（14 发现：🔴1 ∕ 🟡8 ∕ 🔵5 · `VERDICT: changes-required`）——父侧逐条裁定**全部接受**。本块 = append-only 修正 overlay：**原表错值以本块覆盖说明（原文不删）**；实施 ∕ 评审轮 2 复核**以本块为最新口径**。处置 = 点修（零新语义）；采法 = 本轮实读 ＋ 父侧已核值照录。

#### 修正 1（🔴）· R5 #7「🎯 段」定形 = ①（非段位元素）

- **定形 = ①「非段位元素」**（二择一已选）：🎯 沿 `data-alert` 先例（`renderer/views/statusline.mjs:20`——「非 16 段之一」）落**非段位元素**（锚候选 `data-goal`），**不入 `STATUS_SEGMENTS`**（`:33-35` 闭集 16）——**段集闭集 16 零破**。
- 盘核（本轮实读）：计数锁 `test/views-statusline.test.mjs:82`（`=== 16`）＋ 告警位面断言 `:84-85`（「非 16 段之一」先例同笔）——① 可行。
- 连带：D17 ∕ D22 段表 ∕ `UI.md` §1 段表 **零改**（无需「16 ⇒ 17」登记与三处同笔）。
- **② 不采**（登记段集 16 ⇒ 17 ＋ D17 ∕ D22 表 ＋ `UI.md` §1 单源 ＋ 计数锁同笔 ＋ §2.9 上抛补条——无必要破闭集：🎯 非段语义）。
- R5 受影响档补行：`test/views-statusline.test.mjs`（:82 计数锁档——R5 用例：🎯 在场 ∕ 缺席两态 ＋ **锁 16 不破**）。
- 覆盖：R5 #7 行（原「🎯 段⋯⇒ ≈300」）与 R5 #5 行「状态行 🎯 徽标」按本定形施行。

#### 修正 2 · 四越层档处置行（逐档）＋ statusline 单值

**statusline 单值链**（收 R4 ∕ R5 两说——原「293 ⇒ ≈335」∥「⇒ ≈300」相抵）：档面总量 = **293（现读）⇒ R4 后 ≈335 ⇒ R5 后 ≈342**（两轮增量 +42 ∕ +7 相加）；拆档后落点见下表（增量由拆后档承接）。

**四越层档处置（一律「先拆后改」· 沿 KD-T7 口径；拆档执行 = 本批对应轮起手；消费面零改）**：

| 档 | 现读 ⇒ 批末 | 拆分点（出档） | 拆后预测 |
|---|---|---|---|
| `renderer/views/statusline.mjs` | 293 ⇒ ≈342 | 段构建器族（`:43-194`——`numOf` … `enterSegment`）出 `renderer/views/statusline-segments.mjs` | ≈141 ⇒ ≈183（R4）⇒ ≈190（R5） |
| `renderer/views/settings.mjs` | 297 ⇒ ≈340 | 两导出面（`fieldPair` ∕ `channelFormTree` ∕ `verifyControl`，`:133-200`）出 `renderer/views/settings-controls.mjs`（同名再出口） | ≈229 ⇒ ≈272（R7） |
| `src/main/settings.mjs` | 254 ⇒ ≈340 | 值面 ∕ 遮罩族（`MASK` … `deepEqual`，`:32-112`）出 `src/main/settings-values.mjs`（同名再出口） | ≈173 ⇒ ≈259（R7） |
| `renderer/views/activity.mjs` | 322 ⇒ ≤337 | 子 agent 族键控差分段（`:189-284`——`subElementOf` … `bindFamilyLabel`）出 `renderer/views/pool-subagents.mjs` | ≈226 ⇒ ≤241（R5） |

#### 修正 3 · 缺注行补现读值（逐行 · `read` 总行数口径 · 本轮实读）

| 行 | 档 | 现读 | 注 |
|---|---|---|---|
| R1 #4 ∕ R2 #5 ∕ R4 #5 ∕ R7 #7 | `src/preload/preload.cjs` | **62** | §4.1 在册 59（差异非 ±1 口径——见号外 2）；以现读为准；逐轮 +2 ∕ +2 ∕ +2 ∕ +3 |
| R7 #7 | `src/main/ipc.mjs` | **278** | 见修正 4 |
| R6 #6 | `renderer/index.html` | **48** | §4.1 在册 47——±1 口径差；±≤2 |
| R10 #1 | 核 `rules.mjs` | **54** | 上提 +≈50 ⇒ ≈104 |
| R3 #5 | 核 `tools/execute.mjs` | **236** | 邻面（缝所在） |
| R3 #8 | VSC `src/tools/shared.mjs` | **194** | 改指 |
| R6 #3 | VSC `webview/search.js` | **165** | 改指 ⇒ ≈30 |
| R8 #3 | VSC `src/extension/config-watch.mjs` | **78** | 改指 ⇒ ≈50 |
| R6 #8 | 桌面 `test/views-chat-frame.test.mjs` | **418** ✓ | **VSC 侧 = 零 search 测试档**（`performSearch` ∕ `search-bar` ∕ `searchHit` 实读零命中）⇒ 该行收正：「改指由既有套件锁（零行为变）；search 新例落核侧（R6 #7）」 |
| R8 #7 | VSC `test/config-watch.test.mjs` | **166** | 随动；核侧新档随列 |
| R3 #11 | 核 `test/tool-seams.test.mjs` | **315** | 随动 ±≤10；桌面 `test/agent-host.test.mjs` 490（在册） |

#### 修正 4 · 盘面重锚（四值）＋ R5 #6 护栏 ＋ §2.6 ④ 目标值

| 项 | 原值 | 盘面现读 | 批末目标 |
|---|---|---|---|
| `renderer/events.mjs` | 498 | **482**（输入批拆分 `events-flags.mjs` 已落） | R4 ∕ R5 后 ≤490（**≤500 硬限护栏同持**） |
| `renderer/i18n.mjs` | 490 | **495** | （归先落者——本批只消费拆后形） |
| `src/main/ipc.mjs` | 262 | **278** | 见「连带」 |
| 事件通道计数（三处同值） | 18 | **19**（`preload.cjs:31-36` 实读 19 条 ∕ `events-subscribe.mjs:27` 注「13 ⇒ 19」） | R4 +2 ⇒ **21** |
| 白名单 | 31 | 31 ✓（盘面一致——不动） | 31 ⇒ 33（R1）⇒ +2（R2）⇒ +3（R7） |

- **连带平移**（凡原表以旧基线书写之值）：R1 #3「262 ⇒ ≈276」重锚 = **278 ⇒ ≈292**；R2 #4「⇒ ≈290」重锚 = **≈306**；§2.0 跨批序（:42）「events.mjs（498）· i18n.mjs（490）」= **482 ∕ 495**；§2.5 越层档处置段（events.mjs 498 · i18n.mjs 490）同拍重锚。
- **R5 #6 补护栏句**：`renderer/events.mjs`（**482** ⇒ +≤8）——「**拆后 ≤500 护栏同持**」。
- **§2.6 机检 ④ 目标值收正**：通道计数三处同值（`preload.cjs` ∕ `IPC.md` §1 ∕ `events-subscribe.mjs`）——**目标值 = 21**（现盘 19 ＋ R4 ×2）。
- **连带报告项**：ipc.mjs 重锚后批末估 ≈306–334（≈292 ∕ ≈306 ∕ ±≤20 ∕ ±≤8）⇒ **越顾问线 300**——未入本轮四档射程（评审 #2 只列四档）；处置候选 = 通道注册表族出档——**请父侧裁**（纳入 ⇒ 拆点随落；不纳 ⇒ 续期登记）。

#### 修正 5 · R3 射程收正（#5 ∕ #6）

- R3 #5：**上提射程 = `runInterruptible` 单件**（落核 `tools/exec-run.mjs` 扩）；`killProcessTree` **已在核**（`@thincoder/core/tools/process-tree.mjs`——VSC `src/tools/shared.mjs:25` 导入 ∕ `:192` 注入）⇒ 非上提项、非本档新增。
- R3 #6：桌面面 = `child_process` 适配 ＋ 中止；**进程树 kill = 消费核 `killProcessTree`（转口，零第二实现）**（消费缝 = R3 #7 `configureProcessTreeKill` 注册）。
- 覆盖：R3 #5 行「可中断执行 ＋ 进程树 kill 落核」句 ∕ R3 #6 行「＋ kill 树」句。

#### 修正 6 · 样式面收正（§2.0 ⑤ ∕ R4 ∕ R5 ∕ R7）

- 实读（本轮）：状态行样式族住 `renderer/styles.css`（`.status-alert` :406 ＋ `.status-bar` 族 :461-480）；设置面样式 owner = `renderer/settings.css`（现读 **295**——「设置面 / 首启向导 / 项目级信息行三面样式」）。
- **§2.0 ⑤ 收正**：「`renderer/styles.css`（499 距硬限 1）——**本批 R4 ∕ R5 触碰**（状态行段 ∕ 徽标样式）⇒ 先拆后改（**拆点 = 状态行样式族出 `renderer/statusline.css`**；`index.html` 链入 +1）；**R7 零触**（原「R7 触碰前三者」句撤——#6 处置取 a 变形：归属按实读）；`mount-settings.mjs` ∕ `settings-sections.mjs` 维持先拆后改」。
- **R4 ∕ R5 表补样式落点行**：`renderer/styles.css`（**499**——先拆后改：状态行族出档后落改；两轮若纯复用既有类 ⇒ 零新增明注、零拆）。
- **R7 表补样式落点行**：`renderer/settings.css`（**295**——三段族样式落点；复用既有类为主；新增越顾问线 ⇒ 先拆后改〔新族样式出 `renderer/settings-env.css`〕；零新增则明注）。

#### 修正 7 · 逐轮「文档收正」行（R1–R10 · 靶行点名）

| 轮 | 文档收正（靶行） |
|---|---|
| R1 | `IPC.md` §1 ∕ §2（+2 通道行 `session:gc` ∕ `session:index`） |
| R2 | `PROJECT.md` §10 N（:726）· §6.1 D8（:543）· `IPC.md` §1 ∕ §2（+2 通道行 `index:build` ∕ `index:status`） |
| R3 | `PROJECT.md` §10 BB（:763） |
| R4 | `UI.md` §1 状态行表行 3（五 kind）· `IPC.md` §1 ＋ `PROJECT.md` §10 BE（:766）——事件通道计数 ⇒ **21** |
| R5 | `UI.md` §1（状态栏行 :21 补 🎯 非段位元素注；goal 面板行新补） |
| R6 | `UI.md` §1 交互行（:17——补 Ctrl+F 会话内搜索键位）· `index.html`（核件 css 链入——R6 #6 同笔） |
| R7 | `IPC.md` §1 ∕ §2（+3 通道行）· `UI.md` §1 设置面行（七段闭集） |
| R8 | `PROJECT.md` §10 BI（:771）· `UI.md` open 行（:35——台账行周期刷新销） |
| R9 | `thincoder-desktop/AGENTS.md`（起命令行——#8 同笔）；其余零在册靶行 |
| R10 | `PROJECT.md` §10（端差登记 ∕ 判定结论随落——行号届盘核）· KD-42 补句（修正 12） |

- 口径：文档收正 = 实施轮随落（各轮起手收正该靶行）；**本修正轮零落设计档**（只落 §2）。

#### 修正 8 · 父侧闭合（设计零改）

- 上抛 2：**已落**——需求档 §3.6「功能面全量对位」验收条目在册（父侧口径 = `PROJECT.md:140`）。
- 上抛 1：#519 两锚字面 = **父侧承诺 R4 前交付**（定稿权在父侧——本块照录）。
- ⇒ §2.9 上抛 1 ∕ 2 两门闭合；设计零改。

#### 修正 9 · R10 复核清单补判据（8 项 · 逐项）

| # | 项 | 最小补勘判据 | 判死线 |
|---|---|---|---|
| 1 | C8 ∕ C7 多实例端侧附加面 | 静态实读 VSC `setup-reminders.mjs:88-102` ∕ `panel-session.mjs:322-324` ＋ 核径桌面射程（`agent/setup.mjs:136-139`）比对 ⇒「缺 ⇒ 补 ∨ 非缺 ⇒ 销」 | R10 实施前（静态） |
| 2 | 顾问面 ∕ 认领 | 桌面桥枚举面（`agent-bridge.mjs:147/:184`）逐回调对位 VSC 消费点实读 ⇒ 逐回调判有 ∕ 缺 | R10 实施前（静态） |
| 3 | 检查点回退 | 核出口面 ＋ VSC 消费面双实读 ⇒ 核无出口 ⇒ 销 | R10 实施前（静态） |
| 4 | 回声合并 | VSC 实现点单点实读（在核 ⇒ 桌面经核径在 ⇒ 销） | R10 实施前（静态） |
| 5 | flow 四档 | 逐档桌面消费点实读（已证 `flow/block.mjs` 经 `views/chat-text.mjs`；余三档各一读） | R10 实施前（静态） |
| 6 | `configureTreeResolve` | VSC `src/tools/shared.mjs:193` 用途实读 ＋ CLI 同零对照 ⇒ 端差登记 ∨ 缺则补 | R10 实施前（静态） |
| 7 | #522「内容先到」可达性 | **运行期**——乱序 fixture（内容先于出生）＋ 真机 | R5 用例落盘（#2 ③ 同笔） |
| 8 | `flow/ledger-line` 跟滚 | `views/chat.mjs` 跟滚面实读（append 已证 `:132-137/:219`） | R8 随轮（在册） |

- 先证序：①–⑥ ∕ ⑧ 静态可证 ⇒ **R10 起手单轮打包先证**；⑦ 运行期项。未决 ⇒ 挂起 ＋ 报父侧（不静默）。

#### 修正 10 · 计数折算句（12 ∕ 14）

§1.4 之「12」与 §2.2 表 14 行：**12 =「无 26」中宿主壳面端差数**（非缺项——12 ＋ 14 = 26 自洽）；**14 行 = 未排批真缺项表列**，其中 **C5**（= #406 同面，R1 并轨）与 **C8**（反证，判非缺项）为**并轨 ∕ 标注行**——照列防漏检、不以独立缺项计。

#### 修正 11 · 行数口径换算注（±1）

本设计行数 = `read` 总行数口径；`PROJECT.md` §4.1 = 内容行数口径（文末换行不计）⇒ 同档系统差 **±1**（例：`mount-settings.mjs` 500 ∕ 499 · `agent-host.test.mjs` 490 ∕ 489 · `session-slots.mjs` 196 ∕ 195 · `statusline.mjs` 293 ∕ 292）。引用 §4.1 值时按 **+1** 折算至本口径。

#### 修正 12 · KD-42 补句（域外对账保持人工）

KD-42（`PROJECT.md:81`）补句：**「域外对账保持人工」**——理由在册：机械并扫命名族 `(configure|reset|set)[A-Z]` 撞功能性 setter（`setSlotPrefs` ∕ `setSlotAutoApprove` ∕ `setSessionEnd` ∕ `setProviderKey` ∕ `resetSessionState` 实读）⇒ 机检恒红。落点 = 设计档收正随落（R10 文档收正行承接；**本修正轮零落档**）。

#### 修正 13 · R6 #2 定形（search.css）

**定形 = 新档 `thincoder-render-core/search.css`**；登记面（随核包清单）：① `thincoder-render-core/package.json` `files`（现读 `["*.mjs","flow/","cards/","subblocks/","composer/"]`——顶层 css 不在册）**补列该档**；② 两端引入面 = 桌面 `index.html`（`/rc/search.css`——R6 #6 同笔）∥ VSC `@import`（沿 `webview/controls.css:5` 先例）。

#### 修正 14 · 父侧收正项（记录面）

`PROJECT.md` 变更记录补「本设计轮」行（落点 = KD-42 ＋ §10 BQ–BS）——**归父侧**（记录面；本修正轮零落档）。

#### 号外发现（承本轮重锚 ∕ 实读——报告项 · 请父侧裁）

1. **ipc.mjs 越顾问线**：重锚后批末估 ≈306–334（见修正 4 连带）⇒ 处置请父侧裁（纳入 ⇒ 拆点随落；不纳 ⇒ 续期登记）。
2. **`preload.cjs` ∕ `index.html` 现读与 §4.1 在册差**：62 vs 59 ∕ 48 vs 47（见修正 3）——请复核 §4.1 表值（59 之差不属 ±1 口径）。
3. **styles.css 触档归属收正**（修正 6——按实读归 R4 ∕ R5）——请复核该归属。

**收束**：本块 = 评审轮 1 全 14 项处置（1–14 逐号在册）；原 §2 表值凡与本块抵触者**以本块为准**；剩余裁决点 = 号外 1 ∕ 2 ∕ 3（父侧）。

### R1 设计面收正轮（fix · #129 ∕ #131 合并 · eng-designer · 2026-09-28 23:5x）

**缘由** = §1.x 核收遗留（①②③）+ 追加两批（承 flow 批 R11 补轮 ∕ R10 交付 · 同面一并收）。采法 = 定点实读（盘面 as-of 23:4x–24:0x）；**零新语义**；变更记录历史行 ∕ 代码 ∕ 需求档 ∕ 提示词零触；flow 批档零触（跨批机械门——见下）。

**① IPC.md 通道面收正（已落）**

- §1 增 `ev:flags` 行（R1 输入面板移植——宿主自产）+ 事件映射一条自产注；载荷键集 ∕ 会话键面 ∕ 订阅面计数 **十八 ⇒ 十九通道**（`EVENT_CHANNELS` = 19）。
- §2 增 `session:gc` ∕ `session:index` 行（会话维护线——白名单末位 32 ∕ 33；载荷 ∕ 回执 = 处理体实读）；同轮回填 `session:flags` ∕ `at:complete` 行（输入面板移植批——其批档 :426 自陈待收 · 非其舱笔权）。
- 白名单面 **29 ⇒ 33 项**（枚举按盘面 `CHANNELS` 定序补齐——含对齐第三批 `file:open` 补行）；两注项计数同拍；changelog 一行（两行拆分）。
- 盘面复核：`preload.cjs` `CHANNELS` = 33 ∧ `ipc.mjs` `HANDLERS` 同集同序 = 33；事件 19——三处同值。

**② agent-host 越层处置行（已落）**

- `agent-host.mjs` **375 ⇒ 400**（`read` 口径；>300 顾问线 · ≤500 硬限内）。
- 处置 = **续期在册** + 拆点候选 = 回合驱动族出档 `turn-driver.mjs`（拟新增 · 档名实施批定——`send` ∕ `interrupt` ∕ `drive` ∕ `takeOver` ∕ `dispose` ∕ `abortSuspensions` + 在飞表 ∕ 中止墓碑；拆后本档 ≈290 ≤300）；消解窗口 = 该档下次被触碰的批。
- 落点 = PROJECT.md §4.1 越层段（:246）+ §10 **BL**（:776——参照既有 BL 形态）。

**③ 行数账收正（PROJECT.md §4.1 · 实读）**

`session-maintenance.mjs` **112**（新档入册 ∕ :161）+ `session-slots` **226**（:160）∕ `ipc` **296**（:148）∕ `main` **114**（:144）∕ `window` **177**（:146）∕ `agent-host` **400**（:149）∕ `preload` **62**（:171）；§10 **BE** 计数随正（事件 **19** ∕ 请求 **33**——:768）。

**追加一（flow 批 R11 补轮 · 3 项）**

- ① 已落：UI.md 状态栏行（:21）+ 新增「本批注（R11 状态行 ⇒ CLI 对齐）」（:459-464：段间分隔 ∕ 字色 ∕ banner 四色两新槽 ∕ 分隔两边缘面裁定）；RENDERER.md §1.1 新增「状态行面」条（:82）。
- ② ③ **未落——机械门拒**：flow 批档（`2026-09-28-desktop-flow-vsc-align.md`）`:43` 两测试项标注 ∕ `:601` ∕ `:603` `styles.css` 悬空指针重锚——本舱写入被拒（「cross-batch batch-record write」——本舱绑定本批批档）；**父侧已回执 = 由父侧以批档勘误 append 形态落**（记录面 append-only）。

**追加二（flow 批 R10 交付 · 4 项）**

- ① 已落：UI.md §2 项 1 两处（`empty` ⇒ **区域退场**（零子节点 · 锚值保留——R10 E2）；生命期（出生驻留 ∕ `settled` 留场 ∕ `done` 归档入流 ∧ 池内退场——R10 E4））+「对齐第二批」项 3 `.sub-desc` 判据 ⇒ **存差登记（待裁——消差 ∕ 保留）**（会话级 ⟷ VSC 面板级 + 归档回显不带该行——:321-322）。
- ② 已落：RENDERER.md §1.1 池面挂载条补 **R10 帧触发判据**（触碰块换对象引用）+ 新增**拍面条**（2s 拍判据三件同序——:78-79 ∕ :81）。
- ③ 已落：`docs/render-core/design/RENDER-CORE.md:83` 失效句**直改**（「桌面右列常驻不需该钮（端差登记）」⇒ **同面补装**（R10 落）——不留「已废」注）。
- ④ 已落：`docs/desktop/design/E2E-TESTING.md` §6 按批读注补「R10 · 子代理面板 ∕ live 面」行（真机面 = 右列子代理全族——人工走查 + 父侧真跑闭合——:197）。

**机检读数（`node scripts/doc-check.mjs`）**

- 前（基线 as-of 23:41）：悬空 **171**（用例号 100 ∕ 路径坐标 71）· 行宽超限 **1**（`docs/core/design/TESTING.md:261`）。
- 后（as-of 24:0x）：悬空 **175**（用例号 **100** ∕ 路径坐标 **75**）· 行宽超限 **0**。
- **Δ 归因**：+4 = **非本舱笔迹**——`docs/core/requirements/TESTING.md` 四处 `E2E-HARNESS.md` 引用（他批在途改写致「迁移期引文——列报 · 不入闸」标记丢失——:152 ∕ :208 ∕ :232 ∕ :233；本舱从未写该档）；**本舱 authored 行零悬空**（逐条核过：新引用件在盘——`session-maintenance` ∕ `session-flags` ∕ `events-flags` ∕ `heartbeat` ∕ `activity-new` ∕ `state.js` ∕ `activity.js` ∕ `chrome.css` ∕ `theme.css` 皆实读在盘；`turn-driver.mjs` = **拟新增**列报豁免 ×3）。Δ 现象归因沿 `docs/batches/2026-09-28-manifest-write-guard.md:94` 先例（他批在途笔迹漂移——不猜因、不改数）。行宽 −1 = 原 `TESTING.md:261` 由他批收 + 本舱三处超宽行（IPC :345 ∕ RENDERER :78 ∕ UI :321）已拆行。

**收束**：六档八笔落点（IPC.md ∕ PROJECT.md ∕ UI.md×2 ∕ RENDERER.md×2 ∕ RENDER-CORE.md ∕ E2E-TESTING.md）+ 各档 changelog 一行；flow 批档三处归父侧（已回执）。

### 评审轮 3（重发复核）修正 · 微轮 #16（fix · 1–10 逐号 · eng-designer · 2026-09-29）

**缘由** = §3 轮次 3（重发复核 · 8 发现：🟡6 ∕ 🔵2 · `VERDICT: pass`）+ 父侧临场裁 2 项（§1.7 · R2 ∕ R7 设置段相抵——号 9 ∕ 10）；处置口径 = §1.6「逐条处置」行。
本块 = append-only 修正 overlay：**原表错值以本块覆盖说明（原文不删）**；实施 ∕ 复核以本块为最新口径（沿评审轮 1 修正块先例）。采法 = 定点实读（as-of 2026-09-29 00:1x）；零语义 ∕ 零新条目；产品码 ∕ 测试面 ∕ §1 其它行 ∕ §5 已交付段零触。

#### 1（🟡 验收失据 · 全清令后验收面）

- **盘面事实**（本轮实读）：五仓存量测试已全清（重建基线 = `docs/core/requirements/TESTING.md` §2.1「重建基线（2026-09-28）」）；桌面 `test/files.mjs` = 空清单、核 ∕ VSC ∕ render-core ∕ CLI 四仓 `test/` 仅余运行器 ∕ 烟测档。
- **行规则**：① 套件档（test 树）构件形 = **退役**；② 行内「新档 ∕ 新例」意图 = **改写：随批单元证据**（住 `docs/batches/`、名随批次档、不入套件、可按需复跑——`TESTING.md` §1.2 寿命轴 ∕ F6）；③ 行内「随动」对象随全清不在盘 ⇒ **退役**（R3 #11「先拆后改」条同取消）；④ 各轮「真机」行照载。
- **点名行清单**（评审 #3）：R2 #10 ∕ #11 · R3 #9 ∕ #10 ∕ #11 · R4 #10 ∕ #11 · R5 #9 ∕ #10 · R6 #7 ∕ #8（补列——同承载同律）· R7 #9 · R8 #7 ∕ #8 · R9 #3 ∕ #4 ∕ #6 ∕ #10 · R10 #4。
- **修正 1 连带**（`test/views-statusline.test.mjs:82` 计数锁）：退役——「锁 16 不破」改由设计面闭集判据承载（`STATUS_SEGMENTS` 16 零破）；R5 用例面改写 = 随批单元（🎯 在场 ∕ 缺席两态）＋真机面（🎯 在场）。
- **§2.6 基线行收正**：
  - 「桌面套件」行：原「现基线 ≥263 例 + 本批新例 ≈28」**作废**——重建期 `npm test` = 空清单零用例绿（`TESTING.md` §2.1 判定句）；**「空清单绿」不得计作轮验收**；轮验收面 = 随批单元证据 ＋ 真机 ＋ 轮内机检。
  - 「核套件」行：`tool-seams.test.mjs` 结构机检随全清退役（核 `test/` 现盘 = 运行器 ∕ 慢档——本轮实读）；缝登记对账面改「设计面记录 ＋ 届盘复核」。
  - 「VSC/CLI / render-core」行：同五仓全清 ⇒ 照上口径。
  - 类句：凡以退役测试档为载体的验收行（含「三态面机检」① 登记表 23 行 ∕ R3「核缝登记表仍等值」类）同按本口径读（不逐行改写；实施舱已带覆盖令——§1.6）。

#### 2（🟡 `memory:status` 收正靶补行）

- 修正 7「R2」靶行补正：+= `IPC.md` §2 `memory:status` 行（届盘 :106）——处置 = **退役 ∕ 更名 ⇒ `index:status`**（R2 落名 `index:build` ∕ `index:status`；与 §10 N ∕ §6.1 D8 同笔）；收正后文档零「仍待落」死承诺。
- 白名单计数同拍：**33 ⇒ 35**（R2 +2）；收正后不变式 = `preload.cjs` ∕ `IPC.md` 白名单面 ∕ §10 BE 三处同值（R2 后 = 35）。
- 口径：笔 = R2 轮（实施随落）；本项 = 靶行点名补全。

#### 3（🟡 R9 · mount-sessions 届盘重锚 + §2.5 处置行）

- R9 #9 行重锚：`renderer/mount-sessions.mjs` **199 ⇒ 387**（届盘；会话模型轮 R13-B 后——`PROJECT.md:184` 同值）⇒ **387 ⇒ ≈403**（原 Δ +16 不变）。
- 三处失败径重勘（本轮定点实读）：列表刷新 `:253` ∕ `:258` · 页读 `:276` · 开页受理 `:299-300`（评审 #3 抽验 `:276` ∕ `:297-301` 同指）。
- §2.5 越层段补该档处置行：`mount-sessions.mjs` **387**（越 300 顾问线 · ≤500 硬限内）——**续期在册**（R9 增量小 ≈+16）；拆点候选承会话模型轮在册「再拆两手」（执行归先落者）；消解窗口 = 该档下次被触碰的批（本批 R9 起手按届盘复核）。
- §2.5 R9 行同拍重锚：`mount-sessions.mjs`（199 ⇒ 215）⇒ **387 ⇒ ≈403**。

#### 4（🟡 R3 · agent-host 两处相抵 + 先拆后改载入）

- §2.4 R3 #2 行重锚：`agent-host.mjs` 现读 **375 ⇒ 401**（届盘）、批末估 **≈395 ⇒ ≈421**（Δ ≈+20 照载）。
- 并载 **先拆后改**：R3 起手按 R1 收正轮 ② 拆点执行——回合驱动族出档 `turn-driver.mjs`（消解窗口 = 该档下次被触碰的批 = **本批 R3**）；拆后 agent-host ≈290，续跑装配落拆后命中档（回合驱动族面）。
- §2.5 R1 行收正：`agent-host.mjs`（375 ⇒ **401**——R1 交付 400 ＋ 届盘余 1；原「⇒ 395」覆盖）；§2.5 R3 行补 `agent-host.mjs`（401 ⇒ ≈421；先拆后改见上）。

#### 5（🟡 ipc · 条件裁定读法 + §2.5 两分支行）

- 条件裁定（§1.5①）执法读法收正：触发判据 = **「轮起手读数 + 本轮 Δ」≥ 300**（原「届盘读数」读法恒不触发——起手常 <300、越线在轮内发生）。
- 按此读：R2 起手 ≈297（届盘）＋ 本轮 Δ ⇒ **轮内越线**（修正 4 连带估 ≈306）。
- §2.5 越层段补 `ipc.mjs` 两分支行：① **拆点执行** = 通道注册表族出档（档名实施批定；触发 = 上判据）∥ ② **续期在册**（消解窗口 = 该档下次被触碰的批）；预估区间 = 批末 ≈306–334。
- 执行择一权 = 父侧（号外 1 两径在册——本行即其落表）。

#### 6（🟡 会话模型轮面清单 + 失据行收正靶）

- §2.0 跨批序：② 流程批条目补记「**含会话模型轮 R13**」（承用户 2026-09-28 19:04 裁——需求档 `docs/desktop/requirements/PROJECT.md:31`〔多会话标签模型裁撤 ⇒ VSC 单面板〕＋ `:49`〔会话控制（面板内 · VSC 形）〕；轮序注 = 流程批 §2.9）。
- 面（本轮实读）：`renderer/store.mjs:4-6`（标签族三切片 ∕ 关闭确认四纯动作 ∕ `railForm` 两纯动作裁撤退场——活动会话单源 = `activeSession`）。
- 面（续）：`renderer/mount-sessions.mjs:2-8`（原标签条 ∕ 左列两面裁撤退场 ⇒「VSC 形会话控制面 + 接线」；纯构树三件出档 `renderer/views/session-control.mjs`）。
- 面（续）：`tabbar.mjs` ∕ `views/sessions.mjs` ∕ `views/info-row.mjs` **不在盘**（`renderer/views/` glob 实读）· `needsCloseConfirm` renderer 树零命中（grep 实读）；读数复读留 `renderer/mount-info.mjs`。
- 失据行收正靶（in-scope · 窗口 = 该轮收口随落；兜底 = 本批批末文档同步）：
  - `IPC.md` 会话族注项 4 消费面行（届盘 :138；评审记 :139）· `IPC.md:72`（键面坐标 `mount-sessions.mjs:63/:100/:109`）；
  - `PROJECT.md:94`（关标签行整行前提）· `:198`（sessions 行）· `:199`（tabbar 行）· `:205`（info-row 行）；
  - 处置 = 按替代面重锚（`views/session-control.mjs` ∕ `mount-sessions.mjs` ∕ `mount-info.mjs`）或明写裁撤；使在册引用与盘面同值。

#### 7（🔵 §4.1 记录面两笔 · 收正靶补行）

- 修正 7「R4」行补正：+= `PROJECT.md` §4.1 **:177 ∕ :178**（事件通道计数：十八条 ⇒ **21**；现盘 19——收正轮直写终值）。
- 修正 7「R9」行补正：+= `PROJECT.md` §4.1 **:141**（script 三条 ⇒ **四条**）＋ §5 脚本清单 **:527**（三条 ⇒ 四条——`start` 同笔）；原「其余零在册靶行」句以本行覆盖。
- 口径：笔 = R4 ∕ R9 轮（实施随落）；本项 = 靶行点名补全。

#### 8（🔵 §2.5 头 · 「届盘重锚」既定口径句）

- 口径句（本块落地 · 效力同 §2.5 头注）：**「各轮起手按届盘重锚」**——本节所列「现读 ∕ Δ」= 2026-09-28 设计轮基线；实施起手按届盘实读重锚（沿 §4 授权口径句）；护栏句按重锚后余量复核。
- 届盘锚（评审 #3 抽验 as-of 00:0x——实施起手前最新锚）：`events.mjs` **483**（:446 记 482）· `views/statusline.mjs` **295**（:421 记 293）· `subagent-reduce.mjs` **147**（:242 记 138；「同律」注现 `:131`）· `preload.cjs` **63** ∕ `ipc.mjs` **297** ∕ `agent-host.mjs` **401** ∕ `session-maintenance.mjs` **113**。
- 核侧漂移：`agent.mjs` `ContinueError` 抛出点现 **:451**（:63 记 :437）。
- R4 ∕ R5 护栏句复核：`events.mjs` **483** ≪ 500 硬限（硬限护栏同持）；「R4 ∕ R5 后 ≤490」目标句按重锚后余量复核（基线以 483 记）。

#### 9（父侧临场裁 · R2 ∕ R7 设置段相抵 · 承 §1.7）

- R2 #7 行收正：拆点改述 = **起 tools 段**（注册 = `renderer/views/settings.mjs` SECTIONS + 分派；段体 = 索引族行，落 `settings-sections-tools.mjs`）——按 R7 终态枚举与既有拆点命名（先建同名档 ⇒ R7 零改名搬迁）。
- R2 写域补列：`renderer/views/settings.mjs`（SECTIONS 注册 + 分派）· `renderer/mount-settings.mjs`（接线随动——§2.5 R2 行同拍读法：`views/settings.mjs` 补列，`mount-settings.mjs` 已列）。
- 源 = §1.7（父侧 2026-09-29 00:1x 裁定；已 send R2 舱照落）。

#### 10（父侧临场裁 · 同上）

- R7 #1 行收正：族闭集「4 ⇒ 7」⇒ **「5 ⇒ 7」（R2 已立 tools 段）**。
- R7 三段体句读法（#2 行同拍）：**tools = 增行至既有档**（`settings-sections-tools.mjs`——不重拆）· **env ∕ models = 两新段**；#2 行括注「R2 已拆索引段」⇒ 读「R2 已立 tools 段」。
- 源 = §1.7 同笔。

**收束**：本块 = 评审轮 3 八发现 ＋ 父侧临场裁两项（1–10 逐号在册）；原 §2 表值凡与本块抵触者**以本块为准**；实施舱起手按届盘重锚（第 8 项）。九轮重发在飞（R2–R10 · §1.6）——本块为其实施口径面最新版。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 桌面功能对位批 §2（R1–R10 全量设计 + §2.3 强制输入对账节 + 上抛 9 项 ∕ 发现 5 条）；设计档随落 = `docs/desktop/design/PROJECT.md` **KD-42**（:81）与 §10 **BQ–BS**（:779-781）——已核实落。

**限界声明**：① 无项目标准档声明 ⇒ 方法面沿 AGENTS.md 判；② 无文档地图 ⇒ 「文档归属」维度降级（以 PROJECT.md §2 KD 登记 + §10 表为既有归属位判）；③ 抽验含盘面实读（仅用于准 §8 数值核对，未扩评审靶面）：`tool-seams` REGISTERED 23 行 ∕ 扫域 = `tools/`+`agent-tools/` 双根 ∕ `session-gc` 三出口 ∕ `session-index-pass` 三出口 ∕ `child-marks` 两锚（:19/:24） ∕ VSC `shared.mjs:102/:191/:192` 两缝 + `process-tree.mjs` ∕ 桌面 `probeMcpServer` 复用 ∕ VSC 四先例档在场 ∕ 桌面零命中四断言（`{{inject:` ∕ `ContinueError` ∕ `onDistilled|child-marks|TURN_CAP_MARK` ∕ `initBlockFollow|maybeScrollActivity`） ∕ `activity.mjs:25` `renderSubDesc` 导入面 ∕ 桌面零 goal 面 —— 均与设计断言一致。

**发现表（14 项：🔴1 ∕ 🟡8 ∕ 🔵5）**

| # | 类别 | 级别 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属（机制级相抵） | 🔴 | R5 #7（批档:236）给状态行加「**🎯 段**」；而在册判据 = 段集**闭集 16**（`thinncoder-desktop/renderer/views/statusline.mjs:33-35` 实读 16 码，无 goal；`:8` 注释「承载 16 = `STATUS_SEGMENTS`」；`views-statusline.test.mjs` 既有「段集 16 计数锁」——PROJECT.md:634）· D17 ∕ D22（PROJECT.md:552 ∕ :557）——且 KD-36（PROJECT.md:74）已以「段集 = CLI 16 段闭集——D17 零静默省略律」明确**否决**「状态栏新立段」候选。R5 未映射既有段 ∕ 未登记段集改动 ∕ 未入 §2.9 上抛；R5 受影响档亦未列 `test/views-statusline.test.mjs`（计数锁承载档） | 二择一并写明：① 🎯 落既有段内件（沿 `data-alert`「非 16 段之一」先例）并在表内给映射；② 若确为新段 ⇒ 与 D17 ∕ D22 段表 + UI.md §1 单源 + 计数锁用例同笔登记，并在 §2.9 上抛清单补「段集 16 ⇒ 17」一条 |
| 2 | 受影响档（准 §8 越层处置） | 🟡 | 四档越 ∕ 触 300 无处置：`views/statusline.mjs`（R4 #7 :217 = 293 ⇒ ≈335；R5 #7 :236 同档写 ⇒ ≈300——两行目标值相抵）· `views/settings.mjs`（R7 #1 :264 = 297 ⇒ ≈340）· `src/main/settings.mjs`（R7 #4 :267 = 254 ⇒ ≈340）· `views/activity.mjs`（R5 #3 :232 = 322 ⇒ ≤337，已越线）——§2.5「越层档处置」（:341）只列 5 顶格档 + `settings-sections` 357 与两档**未越线**者（`subagent-reduce` ⇒175 ∕ `compress-status` 新档），与 §2.0 自述「越 300 顾问线者按『先拆后改』或『续期』，逐档在 §2.5 表列明」（:38）不符 | 逐档补处置行（拆分点或续期窗口），并把 statusline 两轮目标值收为单值 |
| 3 | 受影响档（现读行数缺注） | 🟡 | 多处行动表未给「现读行数」（仅给 Δ）：`src/preload/preload.cjs`（R1 #4 :157 ∕ R2 #5 :177 ∕ R4 #5 :215 ∕ R7 #7 :270）· `src/main/ipc.mjs`（R7 #7 :270）· `renderer/index.html`（R6 #6 :253）· 核 `rules.mjs`（R10 #1 :315）· 核 `tools/execute.mjs`（R3 #5 :196）· VSC `src/tools/shared.mjs`（R3 #8 :199）· VSC `webview/search.js`（R6 #3 :250）· VSC `config-watch.mjs`（R8 #3 :283）· VSC ∕ 核测试随动行（R6 #8 :255 ∕ R8 #7 :287 ∕ R3 #11 :202） | 补现读值（多数已在 PROJECT.md §4.1 在册）或逐行注「结构不变（±N）」 |
| 4 | 数值基线（混合快照） | 🟡 | 盘面实读复核：`renderer/events.mjs` 注 498 ⇒ 盘面 **482**（输入批拆分 `events-flags.mjs` 已落）；`i18n.mjs` 490 ⇒ **495**；`src/main/ipc.mjs` 262 ⇒ **278**；事件通道「18 ⇒ 20」（R4 #5 :215）⇒ 盘面 **19**（`preload.cjs:31-36` 实读 19 条 ∕ `events-subscribe.mjs:27` 注「13 ⇒ 19」；PROJECT.md §10 BE :766 亦记 18）。白名单「31 ⇒ 33」与盘面一致 ✓。R5 #6 :235 在 498 基线给 ±≤8 无拆后 ≤500 护栏句 | 以盘面重锚现读列（或逐值标「先落者消耗窗口」），并收正 §2.6 机检 ④ 目标值（19 ⇒ 21） |
| 5 | 机制表述（第二实现风险） | 🟡 | R3 #5（:196）「上提：可中断执行 **+ 进程树 kill 落核**」与盘面不符——`killProcessTree` **已在核**（VSC `src/tools/shared.mjs:25` 从 `@thincoder/core/tools/process-tree.mjs` 导入 ∕ `:192` 注入），VSC 侧仅 `runInterruptible` 为端侧实现；R3 #6（:197）桌面档「`child_process` 适配 + kill 树」字面读作第二份树杀实现 | 收正 #5 上提射程 = `runInterruptible` 单件；#6 明写消费核 `killProcessTree`（转口，零第二实现） |
| 6 | 受影响档（轮表 ∕ 清单不一致） | 🟡 | §2.0 ⑤（:46）称「本批 **R7** 触碰前三者」（含 `renderer/styles.css` ▲499，先拆后改），但 R7 行动表（:264-272）与 §2.5 R7 行均无 `styles.css` 行；R7 七段面新增亦未列样式落点 `renderer/settings.css` | 收正 §2.0 ⑤ 或补 R7 样式档行（现读 + Δ + 硬限余量；零新增则明注） |
| 7 | 文档收正靶未列明 | 🟡 | 设计自述「各轮随轮收正设计档——随轮『文档收正』行」（:33），但 R1–R10 行动表无「文档收正」行；本批取代 ∕ 须改的在册行未点名：PROJECT.md §10 **N**（:726「本端不设该通道…随核面批落」——R2 承接）· §6.1 **D8**（:543「读数面 = 另批」——R2）· §10 **BB**（:763「消解 = 另批对齐续跑面」——R3）· §10 **BI**（:771「台账行周期刷新不在本批…后续批」——R8）；须改单源：UI.md §1 状态行表行 3（R4 五 kind）· IPC.md §1/§2 通道行 | 逐轮补「文档收正」行（靶行点名），或在 §2.9 列收正清单 |
| 8 | 协调项（非缺陷） | 🟡 | 上游决策门未闭合：§2.9 上抛 1（#519 两锚字面 ⇒ R4 停在该项）· 上抛 2（需求档 §3.6 无机检 AC ⇒「缺项一次补齐」无核销面） | §4 前把两处置为「已定稿 ∕ 已补」，或明示 R4 前置条件与挂起序 |
| 9 | 协调项（覆盖条件） | 🟡 | R10 复核清单 8 项（含「检查点回退」自陈 VSC 对位面未证）为零码收束（「缺则立轮」——:319）⇒ 本批「一次处理」达成面带条件（上抛 7 同项） | 列每项最小补勘判据与判死线，或把可静态证者先证 |
| 10 | 计数（文内） | 🔵 | §1.4（:23）记「未排批真缺项 **12** 条」，§2.2 表（:73-88）并列 **14** 行（A5–C21）——差 2（C5 = #406 同面 · C8 = 反证）未在文内说明 | 补折算句或改表头计数 |
| 11 | 计量口径（双口径） | 🔵 | 行数计量双口径：本设计 = `read` 总行数（:38）∥ PROJECT.md §4.1 = 内容行数（文末换行不计）⇒ 同档系统差 1（mount-settings 500 ∕ 499 · agent-host.test 490 ∕ 489 · session-slots 196 ∕ 195 · statusline 293 ∕ 292）——「顶格 ∕ 距硬限 N」读法两档不一致 | 钉一口径或加换算注（±1） |
| 12 | 方法注记（KD-42 补扫） | 🔵 | KD-42「补扫域外缝」若被机械并入 `tool-seams` 扫域，命名族 `(configure|reset|set)[A-Z]` 会撞功能性 setter（实读：`setSlotPrefs` ∕ `setSlotAutoApprove` ∕ `setSessionEnd` ∕ `setProviderKey` ∕ `resetSessionState`）⇒ 机检恒红 | KD-42 内注「域外对账保持人工」，或另立命名族再机械并扫 |
| 13 | 清晰度（结构择一） | 🔵 | R6 #2（:249）`render-core/search.css` =「新档 ∕ 并入既有核 css——实施择」——新档选择影响核包产物登记（两端供给面 ∕ 核测试清单） | 定一形；若新档 ⇒ 登记面随核包清单一并给 |
| 14 | 记录面（惯例） | 🔵 | PROJECT.md 变更记录无本设计轮条目（KD-42 + §10 BQ–BS 已落，但无对应「设计轮」行——本档惯例为每设计轮一行） | 补变更记录行（落点 = KD-42 + BQ–BS） |

**计数**：🔴 1 ∕ 🟡 8 ∕ 🔵 5（总 14）。🔴 项 = 机制级相抵（须先解再实施）。
**VERDICT: changes-required**

### 轮次 2（评审子代理）

**评审轮 2（复审 · 只核 §3 轮次 1 十四发现 ∕ 修正块 claims）**——评审对象 = §2「评审轮 1 修正（fix · 1–14 逐号）」块（届盘重锚：**现盘 :394-528**——声明 :389-523，漂移 ±5 行）。限界：无标准档 ∕ 无文档地图（沿前轮同限）；未重核初版 §2 全表 · 未触实施面（§5 未启）· 未触在飞别批面；抽验 = 盘面实读（仅核 claims 数值，未扩评审靶面）。

**抽验（与修正块断言一致 · 节录）**：`thincoder-desktop/renderer/views/statusline.mjs` 293 ∕ `:20` `data-alert`（「非 16 段之一」）∥ `:33-35` 段闭集 16 ∥ `:189-194` `enterSegment`；`thincoder-desktop/test/views-statusline.test.mjs:82` 计数锁 ∕ `:84-85` 告警位面；`preload.cjs` 62 ∕ 白名单 31 ∕ `EVENT_CHANNELS:31-36` 19 条；`renderer/events-subscribe.mjs:27`「13 ⇒ 19」；`renderer/events-flags.mjs` 在盘；`src/main/ipc.mjs` 278；`renderer/index.html` 48；`renderer/i18n.mjs` 495；`renderer/styles.css` 499 ∕ `.status-alert:406` ∕ `.status-bar:461-480`；`renderer/settings.css` 295；四拆点档 293 ∕ 297 ∕ 254 ∕ 322（拆后算术自洽）；`thincoder-core/tools/process-tree.mjs:13` `killProcessTree` ∥ VSC `src/tools/shared.mjs:25/:102/:135/:191-192`；需求档 `:138` ∕ `:140` ∕ `:252`；设计档 `:81` KD-42 ∕ `:543` D8 ∕ `:726` N ∕ `:763` BB ∕ `:766` BE ∕ `:771` BI ∕ `:779-781` BQ–BS；`UI.md` `:17/:21/:35`；`IPC.md` §1(:9) ∕ §2(:87)；`thincoder-render-core/package.json` files 五条；VSC `webview/controls.css:5` `@import`；`data-goal` 桌面渲染面零命中——**十四项处置逐号在册 ∕ claims 基本与盘一致**。

**发现表（轮 2 · 6 项：🔴 0 ∕ 🟡 2 ∕ 🔵 4）**

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | 数值基线（届盘重锚） | 🟡 | 修正 4 的 `renderer/events.mjs` 重锚值 482 与届盘现读不符——现读 **492**（read 总行数；该档在飞 ∕ 修正轮读点后被写）；连带 §2.0 跨批序（:42）与 §2.5 越层段同锚值同漂；「R4 ∕ R5 后 ≤490」目标 ∕ 「拆后 ≤500 护栏同持」句按现盘余量为 0–8 行 | 实施起手按届盘重锚该档（482 ⇒ 492），§2.0 ∕ §2.5 同值行一并随锚；护栏句按新基线复检（R4 ∕ R5 增量与 ≤500 硬限余量表） |
| 2 | 协调项（非缺陷） | 🟡 | 号外 1（ipc.mjs 重锚后批末估 ≈306–334 越 300 顾问线）已给候选（通道注册表族出档），但 §2.5 越层段未落该档行 ⇒ §2.0 自述「越 300 者按先拆后改 ∕ 续期，逐档在 §2.5 表列明」在该档未闭环（两分支待择一） | 在 §2.5 越层段补 ipc.mjs 行：拆点候选（通道注册表族出档）与续期窗口两分支并列 + 预估区间与判据 |
| 3 | 记录面（收正靶点名） | 🔵 | 通道计数收正靶（修正 7 · R4）已列 `IPC.md` §1 与 §10 BE（:766），未列 §4.1 登记行——`docs/desktop/design/PROJECT.md:170` 现仍记「`EVENT_CHANNELS` = 18 位 ∕ 白名单 29 项」（现盘实值 19 ∕ 31；「三处同值」现盘实为 19 ∕ 19 ∕ 18） | 把 §4.1 preload 行（:170-171）并入 R4 收正靶行点名（与 §1.5 ② §4.1 收正口径同笔），并注明「三处同值」为收正后不变式 |
| 4 | 记录面（随落项核对） | 🔵 | 修正 12 ∕ 14 为「随落」项（本修正轮零落档）——届盘核对：KD-42（`:81`）现文无「域外对账保持人工」补句；变更记录无本设计轮行 ⇒ 与声明一致（非缺陷），但两处均处「落点已定 ∕ 届盘未落」态 | 两承载行（R10 文档收正行 ∕ 记录面）各补一句落点判据（届盘存在性判据），防随落项静默脱靶 |
| 5 | 引注精度 | 🔵 | 修正 8「（父侧口径 = `PROJECT.md:140`）」未标档名——需求档 ∕ 设计档两同名档并存（届盘实读：`docs/desktop/requirements/PROJECT.md:140` = 机检验收条目 ✓；`docs/desktop/design/PROJECT.md:140` = §4.1 表头）⇒ 指针需上下文消歧 | 该处括注全名 `docs/desktop/requirements/PROJECT.md:140`（沿本档他处全名引注惯例） |
| 6 | 记录面（裁定来源） | 🔵 | 修正块缘由句「父侧逐条裁定全部接受」在本档无对应落笔（§1.5 只载号外三项裁定；「全部接受」全文仅 :396 一处命中）⇒ 十四项处置的授权来源不可核 | 在该句后补裁定来源指针（§1 行 ∕ 会话），或改述为可核形 |

**计数**：🔴 0 ∕ 🟡 2 ∕ 🔵 4（总 6）。十四项处置逐号在册且与盘面基本一致；残余 = 两届盘重锚 ∕ 协调项 + 四条记录面 ∕ 引注项。
**VERDICT: pass**

### 轮次 3（评审子代理）

**评审对象** = 桌面对位批 §2 实施任务书（重发复核 · 后续轮 R2–R10 面）+ 设计档随落 `docs/desktop/design/PROJECT.md` ∕ `docs/desktop/design/IPC.md`；触发 = 进程崩溃 · 设计令牌重签发。
**限界声明**：① 无项目标准档声明 ⇒ 方法面沿 AGENTS.md 判；② 无文档地图 ⇒ 「文档归属」维度降级（以 PROJECT.md §2 KD / §10 表 + IPC.md 为既有归属位判）；③ 抽验含盘面实读（仅准 §8 数值与在册引用核对，未扩评审靶面；第三方在途批「会话模型轮」不入审查，仅记其对本范围文档引用的影响）。

**抽验节录**：`agent-host.mjs` 401 ∕ `ipc.mjs` 297 ∕ `preload.cjs` 63（`CHANNELS` 33 ∕ `EVENT_CHANNELS` 19）· `events.mjs` 483 · `statusline.mjs` 295（`STATUS_SEGMENTS:34` 段闭集 ∕ `:21` `data-alert` 先例）· `session-maintenance.mjs` 113 · `window.mjs` 177 · `protocol.mjs` 89 · `mount-sessions.mjs` 387（失效径 `:276` ∕ `:297-301`；`closeTail` 零命中）· `subagent-reduce.mjs` 147（「同律」注现 `:131`）· `test/files.mjs` 清单 = `[]`（全清重置）· renderer 树 `needsCloseConfirm` 零命中 ∕ `views/tabbar*.mjs` 零命中 ∕ `renderer/views/session-control.mjs` 在盘 · 桌面树零 `{{inject:` ∕ 零 `ContinueError|onDistilled|child-marks|TURN_CAP_MARK|runInterruptible|configureExecRun|configureProcessTreeKill` · 核 `prompt-files.mjs:92` 缝 ∕ `helpers.mjs:237` `ContinueError` 在盘（抛出点现 `agent.mjs:451`）。

**发现表（8 项：🔴 0 ∕ 🟡 6 ∕ 🔵 2）**

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | 验收（全清令后失据） | 🟡 | §2.6:358 批级验收「桌面套件全绿（现基线 ≥263 例 + 本批新例 ≈28）」与 R2–R10 各轮 test 行（R2 #10/#11 · R3 #9–#11 · R4 #10/#11 · R5 #9/#10 · R7 #9 · R8 #7/#8 · R9 #3/#4/#6/#10 · R10 #4；修正 1 另指 `test/views-statusline.test.mjs:82` 计数锁）以已退役的桌面测试档为承载——盘面实读：`test/files.mjs:1-3` 显式清单 = `export default []`（「2026-09-28 全清重置（用户令）：存量测试全部退役——清单清空」），§5:654 自陈 `run.mjs` 空清单绿；§1.x:34 仅处置 R1 #9–#12 ⇒ 后续轮 test 行未见叠加处置 | 以 §2 append-only overlay（沿修正块先例）补「全清令后验收面」口径：逐轮 test 行标「退役 ∕ 按 `requirements/TESTING.md` 重建规则改写」或转人工真机面；§2.6 基线行同拍收正；明示「空清单绿」不得计作轮验收 |
| 2 | 文档归属（同面两名 · 收正靶缺行） | 🟡 | `IPC.md:106` `memory:status` 行在册承诺「核加只读出口（`memoryStatus()` 一类）随核面批落，届时本通道 + 设置面状态行随落」，而 R2 落法（:187）通道名 = `index:build` ∕ `index:status`；修正 7 的 R2 收正靶（:475）只写「+2 通道行」，未含该行的退役 ∕ 更名 ⇒ 落成后文档存一行「仍待落」死承诺（可被再读为活工单） | R2 收正靶补 `IPC.md` §2 `memory:status` 行（与 §10 N:728 ∕ §6.1 D8 同笔）：明写更名 ∕ 退役（或改指 `index:status`），白名单计数 33 ⇒ 35 同拍 |
| 3 | 受影响档（R9 · mount-sessions） | 🟡 | R9 #9（:316）作 `renderer/mount-sessions.mjs`（**199** ⇒ ≈215）并列坐标 `:79-84` ∕ `:55-60` ∕ `:100-107`；盘面实读该档 = **387**（`PROJECT.md:184` 亦记 387——R13-B 拆分后），失效径实存于 `:276` ∕ `:297-301` ⇒ 基线差 188 行、行内坐标全失据；该档已越 300 而 §2.5 越层段（:352）无其处置行（§2.0:49 自述「越 300 者逐档在 §2.5 表列明」未闭环） | R9 行按届盘重锚（387 ⇒ Δ）并重勘三处失败径；§2.5 补该档处置行（先拆后改拆分点或续期窗口） |
| 4 | 受影响档（R3 · agent-host） | 🟡 | §2.4 R3 #2（:204）与 §2.5 R1 行（:341）两处同值「375 ⇒ 395」相抵（§2.4 R1 #7 原为 ≈385），且 §2.5 **R3 行无** agent-host（§2.4 R3 #2 列之）；盘面实读 = **401**（`PROJECT.md:149` 记 400）；收正轮 ②（:549-550）定「消解窗口 = 该档下次被触碰的批」——该窗口即 R3 本身，而 R3 行动表未载「先拆后改（`turn-driver.mjs` 出档）」 | R3 行按届盘重锚（401 ⇒ Δ）、§2.5 R3 行补档；并补先拆后改行（`turn-driver` 出档）或明写再续期与其窗口 |
| 5 | 受影响档（ipc.mjs 条件裁定触发错位） | 🟡 | §1.5①（:28）条件裁定 = 「届盘读数 ≥300 ⇒ 拆点执行；<300 ⇒ 零触」，而 R2 落成后该档按设计自估已 ≈306（连带报告项 :455；号外 1 :530）⇒ 轮起手读数口径恒 <300、条件恒不触发，越线在轮内发生；轮 2 发现 2（:618）所请的 §2.5 该档行仍缺 | 把触发条件改按「轮起手读数 + 本轮 Δ」判，或在 §2.5 越层段补该档两分支行（通道注册表族出档 ∕ 续期窗口 + 预估区间） |
| 6 | 文档状态 ∕ 跨批协调（会话模型轮面） | 🟡 | 盘面自注「会话模型轮 R13」已重塑本 scope 文档所引用之面：`store.mjs:4-6`（标签族三切片 + 关闭确认四纯动作 ∕ `railForm` 两纯动作**裁撤退场**）· `mount-sessions.mjs:2-8`（改「VSC 形会话控制面」，`closeTail` ∕ 关标签径零命中）· `views/tabbar.mjs` **不在盘**（glob 零命中）· renderer 树 `needsCloseConfirm` 零命中；引用随之失据：`IPC.md:139`（会话族注项 4 消费面列 tabbar.mjs + `needsCloseConfirm`）· `IPC.md:72`（键面坐标 `mount-sessions.mjs:63/:100/:109`）· `PROJECT.md:94`（关标签行整行前提）· `:199`（tabbar 行 200；同类 `:198` ∕ `:205`）；§2.0（:52）跨批序三批未含该轮 | 补 §2.0 跨批序面清单（该轮 ∕ 其面），并把上列 in-scope 行列入后续轮收正靶（或明写裁撤与替代面）——使在册引用与盘面同值 |
| 7 | 记录面（§4.1 行未挂收正靶） | 🔵 | ① `PROJECT.md:177` ∕ `:178` 仍记「十八条通道」（现盘 19：`preload.cjs:32-37` ∕ `IPC.md` §1 ∕ §10 BE:768 三处同值）；② R9 #7（:314）加 `"start"` ⇒ `PROJECT.md:141`「script 三条（单源 = §5）」失据，而 R9 收正行（:482）自述「其余零在册靶行」 | R4 收正靶（19 ⇒ 21）并入 §4.1 两行；R9 收正靶补 `:141` + §5 脚本清单（三条 ⇒ 四条） |
| 8 | 数值基线（届盘漂移 · 重锚口径已覆盖） | 🔵 | 抽验与修正值有漂移：`events.mjs` 483（:446 记 482）· `statusline.mjs` 295（:421 记 293）· `subagent-reduce.mjs` 147（:242 记 138；「同律」注现 `:131` vs :70 记 `:122`）· `preload.cjs` 63（:430 记 62）· `ipc.mjs` 297（记 296）· `agent-host.mjs` 401（:549 记 400）· `session-maintenance.mjs` 113（:645 记 112）；核 `agent.mjs` ContinueError 抛出点现 `:451`（:63 记 `:437`） | 无（「各轮起手按届盘重锚」为既定口径）；R4 ∕ R5 护栏句按重锚后余量复核（`events.mjs` 483 ≪ 500，硬限护栏同持） |

**计数**：🔴 0 ∕ 🟡 6 ∕ 🔵 2（总 8）。
**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 20:3x）
- **三条件**：① 设计评审 **pass**（§3 轮次 2——十四项逐号核过；残余 🔴0 ∕ 🟡2 ∕ 🔵4 均非阻断）；② 修正轮落地并核验（§2 修正块 :394-528 + 轮 2 复审在册）；③ 凭据面按纪律处置（值不落档）。
- 授权口径 = 委托（批准代签）；**实施序 = R1–R10 逐轮派单**（每轮 ≤10 档）；各轮起手按**届盘重锚**读数（含 `events.mjs` 482 ⇒ 492 ∕ `ipc.mjs` 条件拆点承 §1.5①）。
- 残余六项处置：操作性 2 项（`events.mjs` 重锚 ∕ `ipc.mjs` 越层行）**随轮派单携带**；记录面 4 项（`PROJECT.md` §4.1:170 收正靶 ∕ KD-42 补句 ∕ 变更记录随落核对 ∕ 引注 ∕ 裁定来源指针）入**批末文档同步清单**。

## §5 实施记录（eng-coder）
**状态行**：实施完成（R1 会话维护线（7 档 + 新档 1）；测试面随全清令取消；审计 clean ∕ 评审轮 2 pass（fix 1 轮））



### R1 · 会话维护线（eng-coder · 2026-09-28 · initial 轮）

**交付摘要（逐档 · 实读行数 = `read` 总行数口径）**

| 档 | 现读 | 落点 |
|---|---|---|
| 新 `thincoder-desktop/src/main/session-maintenance.mjs` | 112 | 三面：① GC 处理体（候选并集去重 ⇒ 计数 ⇒ 确认注入缝 ⇒ 逐组 `deleteColdCwd`〔带 entries 快照〕⇒ 汇总）② 索引重建处理体（清四表 → 全量重扫 → 摘要；核索引面**惰性 import**）③ 启动拍供面（GC + 索引两枚；`cwd` 缺 ⇒ GC 拍零动作、索引拍恒点火） |
| `thincoder-desktop/src/main/session-slots.mjs` | 196 ⇒ 226 | +会话维护族转口五名（`listColdCwds` ∕ `deleteColdCwd` ∕ `listStaleCwds` ∕ `scheduleSessionGC` ∕ `scheduleSessionIndexPass`〔惰性包装〕）+ 档头 ⑧ 行 |
| `thincoder-desktop/src/main/ipc.mjs` | 278 ⇒ 296 | +2 通道 `session:gc` ∕ `session:index`（定序末位）+ `sessionRename` 成功径 `syncTitle` + `sessionResume` 成功径 GC 点火（越表项，见决策表） |
| `thincoder-desktop/src/preload/preload.cjs` | 62 | 白名单 31 ⇒ 33（+2）；档头计数与定序行同拍（EVENT_CHANNELS 19 未动） |
| `thincoder-desktop/src/main/main.mjs` | 109 ⇒ 114 | 窗口起后启动拍点火：`void scheduleSessionMaintenancePasses({ cwd: currentCwd() })` |
| `thincoder-desktop/src/main/window.mjs` | 137 ⇒ 177 | 菜单「Maintenance」两项（GC ∕ 索引重建）+ `confirmRecycle` 原生模态 + 结果面三径（VSC 同形） |
| `thincoder-desktop/src/main/agent-host.mjs` | 375 ⇒ 400 | +`syncTitle(slot, title)`（装配表命中 ⇒ 写 `agent.title`；不在场零动作）+ 返回面 + 档头一行 |

**机检读数（命令 + 结果）**
- `cd thincoder-desktop && node test/run.mjs` → exit 0 · `ℹ test manifest is empty — zero tests = green (2026-09-28 full reset).` ⇒ **验收① 0 红**（全清令后现态：空清单绿）。
- `node --check` × 7 档（本舱触碰面）→ 全 `Syntax OK`。
- 白名单 ∕ 通道面：`CHANNELS` = **33** 条 ∧ `HANDLERS` 键 = 33 ∧ 同集同序（注册期 fail-closed 判据满足）。
- 产品代码运行自查（平 node 内联脚本，**非测试档**）：GC 六态实跑 = 无候选 ⇒ 零动作；拒确认 ∕ 确认面缺失 ⇒ `confirmed:false` 零删除（文件在盘）；TOCTOU 拒绝径（确认回调触新 manifest）⇒ `skipped:1` 零删除；逐组回收 ⇒ `deleted:1 files:2`（入 `sessions-trash/<批次>`）；索引重建 ⇒ `{ok:true,sessions:0,changed:0,…}`；启动拍 ⇒ 首调度 `true` ∕ 二次 `false`（去重）+ 索引库真落盘。
- 零 electron 自证：`session-maintenance.mjs` 导入面 = `node:fs/promises` + `./session-slots.mjs`（`from "electron"` grep 零命中）；平 node 直 import 成功。

**决策透明表（越出行动表的额外改动 · 逐条）**

| # | 改动 | 为何必要 | 披露 |
|---|---|---|---|
| 1 | `sessionResume` 成功径 + `scheduleSessionGC(receipt.cwd)`（ipc.mjs） | 桌面冷启无项目 ⇒ `currentCwd()` = null ⇒ 启动拍 GC 结构上零动作（核 `scheduleSessionGC` 须 cwd）；桌面恢复径有意走核**裸版** `resumeSlot`（避认领竞争）⇒ 不补点火则残留 GC 永不触发。补点 = VSC 自动径同款（`session-io.mjs:92`）；重复点火由核内每进程每前缀去重承担。 | 本段 + 代码注释 |
| 2 | `session:gc` 通道确认面 = 原生模态 `confirmRecycle`（ipc.mjs ↔ window.mjs 同源单实现） | 设计 R1 #1① 的「确认」步骤需宿主落子；VSC 先例 = 模态警告；两入口同源。 | 本段 + 代码注释 |
| 3 | 菜单结果对话框 + 汇总词面 formatter（window.mjs ∕ session-maintenance.mjs） | 设计 R1 #1① 的「汇总」步骤可见面；VSC `showInformationMessage` 对位。 | 本段 + 代码注释 |

**全清令处置（用户 2026-09-28 23:18 · 父侧传达）**：桌面测试树全量删除 ⇒ 本舱测试面任务**全部作废**——R1 #9（新 `test/session-maintenance.test.mjs`）· #10（`test/session-contract.test.mjs` 随动）· #11（`test/agent-host.test.mjs` 先拆后改 + 改名例）· #12（`test/files.mjs` 注册）**随全清令取消**（未写测试档 ∕ 未改 `test/**` ∕ 未跑测试套件；`test/` 现盘 = 0 文件）。验收②「GC 三态断言 ∕ 拒绝径 ∕ 回执面在册」随之取消，以产品代码运行自查替代（读数见上）。

**审计与代码评审（轮次与终态 = `clean`）**
- 内部偏审（explore · 只读）：判定 **`clean`** —— 四类偏差（部分实现 ∕ 静默简化 ∕ 文档漂移 ∕ 越表改动）均无；行动表 8 行逐行对上；GC 五步与驳回零删除、索引惰性载入、启动拍、菜单接线、`syncTitle` 语义逐项与设计 ∕ VSC 先例一致。
- 代码评审轮 1（advisor · code）：`VERDICT: pass`（🔴0 ∕ 🟡2 ∕ 🔵5）。处置：🔵#3（菜单 GC 驳回径多一枚结果框 —— 与 VSC 静默返回分叉）**已修**（fix round 1：`window.mjs:89` 驳回径 `return`；结果面三径对齐 `session-gc-command.mjs:36-46/:66-68`）；其余 6 条推回并说明——🟡#1 设计档收正（本舱任务书明令「设计面另轮 · 零触文档面」）· 🟡#2 `agent-host.mjs` 400 行越顾问线与拆点（在册 §10 BL；处置行归父侧 ∕ 设计面）· 🔵#4 `clearIndex → rebuild` 同序（VSC ∕ 核命令面同形，核侧候选）· 🔵#5 `ipc.mjs` 296 行（<300 合规；拆点随轮派单）· 🔵#6 维护文案单语（端词面定稿权 = 主 agent 内容权）· 🔵#7 §5（本段即落）。
- 代码评审轮 2（fix 复核）：`VERDICT: pass` —— 三径（无候选 ∕ 真回收 ∕ 驳回）逐径对齐实读在册；修复未引入新面（守卫前置 `action === "gc"`；GC 三处返回恒 `ok:true` ⇒ 不吞错误框；`session:gc` 回执面零影响）。注：轮 2 宿主引注校验报 2 条未匹配（评审侧路径解析 artifact）——本人已复核 `window.mjs:89` 行内容在盘。

**遗留 ∕ 转出**（不属本舱授权面，供父侧）
1. 设计档收正未落：`IPC.md` §1 ∕ §2 无 `session:gc` ∕ `session:index` 行、通道计数未随（现盘 = 请求 33 ∕ 事件 19）；`PROJECT.md` §4.1 相关行待批末同步（本舱零触文档面）。
2. `agent-host.mjs` 400 行 > 300 顾问线（本批触碰）而 §2.5 越层处置行缺席 —— 请父侧补行（拆点 ∕ 续期窗口）。
3. 维护面文案单语（en）——与主进程既有词面（zh ∕ en 双值 + locale 取词）口径待裁（内容权在主 agent）。
4. 产品代码运行自查 = 内联脚本（非测试档）；沙箱目录留在 `%TEMP%/tc-maint-*`（未删，留现场）。

### R2 · 索引数据面（eng-coder · 2026-09-29 · initial 轮）

**交付摘要（逐档 · 后 = node `split("\n").length` 实读；前 = 届盘 ∕ 设计表读数，逐行标注来源）**

| # | 档（前） | 后 | 落点 |
|---|---|---|---|
| 1 | 新核 `thincoder-core/memory-status.mjs`（设计 ≈70） | **47** | 只读出口 `memoryStatus(memory, { origin })`：三表计数单点（`files` 表 ∕ `code_chunks` ∕ `doc_chunks`）+ `totals`（code+doc，端侧既有读数同口径）+ `indexed`；`origin` 经核 `normalizeOrigin` 归一（写缝归一 ⇒ 读面同键）；零写面 ∕ 零动作面 ∕ 零端名 |
| 2 | 核 `thincoder-core/memory.mjs`（21） | **25** | +汇总档 re-export（`export { memoryStatus } from "./memory-status.mjs"` —— 面名归汇总档，消费面 `@thincoder/core/memory.mjs` 直取） |
| 3 | 新 `thincoder-desktop/src/main/index-status.mjs`（设计 ≈120） | **68** | ① `runIndexBuild({dir})`：`gitSync`（增径）⇒ `null` 落全量 `codeSync` ∥ `docSync`（allSettled；有失败项 ⇒ 失败句并不吞）⇒ 核出口复读计数；② `readIndexCounts({dir})`：核出口单点（端侧零 SQL ∕ 零表名）；句柄装配形沿 `agent-assemble.mjs:62-65`（`openMemory` 单点） |
| 4 | `thincoder-desktop/src/main/ipc.mjs`（**297** 父侧届盘） | **308** | +2 通道 `index:build` ∕ `index:status`（定序末位）+ 两处理体转口（`dir` = `currentCwd()`）+ 档头计数 33 ⇒ 35 同拍 |
| 5 | `thincoder-desktop/src/preload/preload.cjs`（**63** 评审核读） | **65** | 白名单 33 ⇒ 35（`index:build` ∕ `index:status` 末位）+ 档头计数 ∕ 定序行同拍 |
| 6 | `thincoder-desktop/src/main/settings.mjs`（254 设计表） | **272** | +`indexStatus({dir})`（状态读数**装配**：核出口计数 + `built` + `hasEmbedder` = `embedding.apiKey` 在场，同装配判据） |
| 7 | 新 `thincoder-desktop/renderer/views/settings-sections-tools.mjs`（设计 ≈80；档名承父侧裁定 = **tools**） | **71** | 「工具与服务」段体 = 索引族行（名 ∕ 状态词 ∕ 构建钮）；四态判据序 = VSC `renderIndexStatus` 同序（`building` ∥ `no-key` ∥ `built` ∕ `not-built`）；`data-index-state` 锚供机检 |
| 8 | `renderer/views/settings-sections.mjs`（264 我届盘 read） | **267** | +re-export `toolsBody`（沿 `settings-agent.mjs` 先例 —— 导出面零改）+ 档头一句 |
| 9 | `renderer/views/settings.mjs`（297 设计表；**设计表漏列 ∕ 父侧裁定②追加**） | **305** | `SECTIONS` 4 ⇒ 5（`tools`）+ `settingsModel.tools` 切片 + 段体分派 + 档头 |
| 10 | `renderer/mount-settings-reads.mjs`（99） | **119** | +`loadIndex()`（`index:status` 读数；回执无 `status` 载体 ⇒ 段 `none` + 失败面） |
| 11 | `renderer/mount-settings-exits.mjs`（≈297） | **316** | +`buildIndex()` 出口（构建期 `building` ⇒ 钮禁用；成功复读；失败零乐观写 + 段级失败面）+ `openSettings` 随动 + handlers 一键 + 档头 |
| 12 | `renderer/mount-settings.mjs`（135；**父侧裁定②追加**） | **136** | `SCOPES` +`tools`（失败面段标域与视图 `SECTIONS` 同域） |
| 13 | `renderer/i18n-views.mjs`（124 我届盘 read） | **146** | +键 **8** × 两语（段名 ∕ 索引族名 ∕ 态词四 ∕ 钮标二）—— 值逐字同 VSC `locales/{en,zh}.json`（段名键 = 端侧键名 `settings.section.tools`，值取 VSC `settings.toolsSection`） |

**测试面**：随全清令（2026-09-28 用户令）**跳过 R2 表 #10 ∕ #11 两行**（核 `test/memory-status.test.mjs` ∕ `test/settings.test.mjs` 随动）——盘面 `test/files.mjs` 清单 = `[]`（存量测试全部退役）；**本舱未写测试 ∕ 未跑套件**。核 ∕ 桌面 ∕ VSC ∕ CLI ∕ render-core 套件均未跑（**not repo-suite verified — the parent-side closeout run is the only repo-suite run.**）。

**决策透明表（逐条 · 依据）**

| # | 决策 | 依据 |
|---|---|---|
| D1 | **段名 = `tools`、档名 = `settings-sections-tools.mjs`** | 父侧裁定（两处相抵的上抛回执）：R7 终态枚举明写「tools{embedding ∕ websearch ∕ 索引状态}」且既有拆点命名已定 ⇒ 先建同名档，R7 只增行零改名搬迁；R7 基线按届盘重锚为「5 ⇒ 7」 |
| D2 | 写域追加 `renderer/views/settings.mjs` ∕ `renderer/mount-settings.mjs` | 父侧裁定②（设计表漏列，照实现补）；另 `mount-settings-reads.mjs` ∕ `mount-settings-exits.mjs` = R2 #8「接线随动（先拆后改——拆点归先落者，本批消费）」的**拆分后落点**（拆档已由先落者执行，本舱消费其形） |
| D3 | 读数面**不建库**：库不在盘 ⇒ 零计数直接回 | 读面零副作用（`index:status` 在设置面每次开合可触发；`createMemory` 会建库 ⇒ 读径加 `existsSync` 闸）；构建径无闸（构建本就写） |
| D4 | 无本项目 ⇒ 读数零计数 ∕ 构建 `no-project` | 禁假造（不跨项目读全库：`origin=null` 会落**全库**计数）；`no-project` 码已在端词表 `REASON_WORD`（`settings.reason.noProject`） |
| D5 | `i18n` 键落 `renderer/i18n-views.mjs`（非 `i18n.mjs`） | R2 #9 行定点（+键 ≈6 ⇒ ≈80）；实落 8 键（段名 1 ∕ 索引族名 1 ∕ 态词 4 ∕ 钮标 2）—— 比 ≈6 多 2，因段名与族名各一键（VSC 三段视觉件 = 族名 + 状态行 + 钮，逐件有词） |
| D6 | 构建回执携计数 + 渲染面另复读状态 | VSC `buildIndex` 尾 `pushIndexStatus` 同律（回执计数供调用面，UI 状态独立复读 ⇒ 两处同源不漂） |
| D7 | `ipc.mjs` **零拆点**（未出「通道注册表族」） | §1.5① 条件裁定 = 按**届盘读数**判（父侧届盘 297 < 300 ⇒ 零触）；本舱照办。**披露**：本轮 Δ 后该档 = **308**（越顾问线 300）——条件裁定「轮起手口径」与「轮内越线」的错位已由评审轮 3 发现 #5 在册（§3），处置请示父侧（拆点 or 续期） |

**越线档披露（新增 2 · 请父侧处置）**：`renderer/views/settings.mjs` 297 ⇒ **305**（设计 R7 #1 行已含该档 297 ⇒ ≈340 的增长预案；评审轮 3 发现 #2 已请 §2.5 补处置行）· `renderer/mount-settings-exits.mjs` ≈297 ⇒ **316**（设计表未列该档——R8 拆分产物；本舱建议拆点 = 「索引 ∕ 工具段出口族」出档，或 §2.5 记续期窗口）。两档均 ≤500 硬限；本舱未自行拆（拆点归设计面 ∕ 先落者，沿 KD-T7）。

## §6 验证与收口（父代理）
