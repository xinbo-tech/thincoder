# 2026-09-30 · VSC 清扫
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族）；用户 2026-09-30 23:42 批次点火令「实活都做了」。。
> 台账 = #695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**【#705-④ 落笔（父侧直执行 · 2026-10-01 00:1x · 可 revert）】**注册面按 C39 源（`crossline-clearance.md:151`）+ 协议 §3.2 行 15–21 实读落定：**① 补 6 条实况消息**——`queuedUserMessage` ∥ `busyQueued` ∥ `workspaceGuard` ∥ `usage`（含 `timers` ∥ `ctxTokens` 两增字段注）∥ `timer` ∥ `providerError`（增于 `thincoder-vscode/AGENTS.md` 协议表末段）；**② `providerInfo` 行处置 = 退役行替换为 `providerStatus`**（`{ keyOk, status }`——实读：现码 `src/extension/panel-settings-push.mjs:21` ∥ `settings.mjs:69`，发射 `settings.mjs:317`；归档实锤「`providerInfo` 已退场——现体 = `providerStatus`」`_archive/design/WEBVIEW.md:400`）——**旧名不携残句**（沿尸句删净纪律）。计数归一 = **增 6 + 换 1**（「7 字段」实指落定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五条分项齐（判据 ∥ 落点 ∥ 验收腿）；#698 ∕ SETTINGS.md §2.4 两笔已落并回读；上抛一件待父侧（C39 枚举补列））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

（设计轮 · eng-designer · 2026-09-30 · initial——五条分项齐（判据 ∥ 落点 ∥ 验收腿）；产品码零触；文档面两笔已落并读回（§2.4 ∕ §2.5）；上抛一件（C39 枚举补列——§2.9）。）

### 2.1 本批条目（覆盖 · 三链同源）

| 号 | 条目 | 面 | 承接 |
|---|---|---|---|
| #695 | VSC 失败面站点扫：fromPanel 写路径返回契约全验（shell `:190` 已证 + 补员两径 + 同族四处） | 码面（VSC 扩展） | 本批实施轮——设计 = §2.2 |
| #696 | 三档 >300 字符单行（六处 + PROTOCOL 13 处）——判面口径 | 文档面 | **本轮裁定 = 闸外非缺陷**（父裁回执 23:5x；§2.3） |
| #698 | SETTINGS-TOOL.md 退役测试档指称三处——收正 ∥ 重建时回迁口径 | 设计档面 | **本轮已落**（§2.4） |
| #701 | VSC 第三面 `.mcp.json` 未并——跨端差默认消解 | 码面（VSC 扩展） | 本批实施轮——设计 = §2.5 |
| #705 | 跨线批需求笔随动四件 | 需求 ∕ 文本面 | 父侧笔——拟文 = §2.6（本档零落笔） |

**三链同源**：#705 四件落笔权 = 主 agent（需求档 ∕ 产品文本面笔权）——本档只出逐处拟文；#696 判面口径由本轮核毕（原挂「表行是否在射程」未核项）——父裁回执已至（准：闸外非缺陷、不收形；收束 = 「未核 ⇒ 已核毕、零动作」，批档收口时核销）；#698 = 设计档面（eng-designer 笔域——已直落）。

### 2.2 #695 设计（fromPanel 写路径失败面站点扫——两面收口）

**目标（两失败面）**：面① = 返回契约（mtime 冲突串）逐站接入 `postProviderError` 闭集；面② = 畸形档 throw 穿透（核 `writeConfigAtomic`「config file not parseable」`thincoder-core/config-io.mjs:70` ∥ `loadRaw` `:124` → handler → 分发表 → `chat-panel.mjs:196` `.catch(console.error)`）单点收口为面板可见。

**现状清点（实读 as-of 2026-09-30 23:5x）**：

| 类 | 站点（file:line） | 契约现状 | 判 |
|---|---|---|---|
| 已发射 9 | `panel-messages-settings.mjs:59 ∕ :71 ∕ :84`（providers）· `:144`（agent）· `:198`（env）· `panel-mcp.mjs:129 ∕ :140 ∕ :151 ∕ :165`（mcp） | err 捕获 + 发射 | 不动（负控基线） |
| 接线缺 1 | `panel-messages-settings.mjs:190`（shell） | `saveShellSettingsFromPanel` 返回 `conflictError(r)`（`settings-panel-write.mjs:183`）到位、被丢 | 接发射（env） |
| 契约缺 + 接线缺 9 | ① websearch `:107 ∕ :110`（`settings.mjs:178-185 ∕ :188-194` 无返回）② provider-proxy `:92`（`settings.mjs:110-118` 恒返 `null`）③ embed `:101 ∕ :104`（`panel-index.mjs:102-118` 丢 `embed-config.mjs:131` 返回）④ provider-key `:29 ∕ :32`（`presets.mjs:43-51` 丢核返回）⑤ mcp save ∕ delete `:35 ∕ :38`（返回串到位、调用点丢弃） | 补契约 + 接线 | 逐站改法 = 下表 |
| throw 穿透（全站点同形） | 分发表 `chat-panel.mjs:195-197` | 单点 | 面②（下节） |

**面① 逐站改法（号 → 落点 → 改法 · scope）**：

| # | 落点 | 改法 | scope |
|---|---|---|---|
| 1 | `panel-messages-settings.mjs:190-193` | `const err = saveShellSettingsFromPanel(msg.value); if (err) postProviderError(panel, "env", err)` + 原回推行 | env |
| 2 | `settings.mjs:178-185`（函数尾）+ 站点 `:107` | 函数 `return conflictError(vscPersistRaw(…))`（现无返回）；站点捕获 + 发射 | tools |
| 3 | `settings.mjs:188-194` + 站点 `:110` | 同上 | tools |
| 4 | `settings.mjs:110-118` + 站点 `:92` | `return conflictError(vscPersistRaw(…))`（现恒 `null`）；站点捕获 + 发射 | providers |
| 5 ∕ 6 | `panel-index.mjs:102-118`（两分支捕获 `saveEmbeddingConfigToFile(…)` 返回并 `return`）+ 站点 `:101 ∕ :104` | 站点捕获 + 发射 | tools |
| 7 | `presets.mjs:43-46` → `settings.mjs:268-274` → `panel-settings-push.mjs:25-28` → 站点 `:29` | `storeProviderKey` 返回核串；`saveProviderKey` 穿透返回（探针后）；站点捕获 + 发射 | providers |
| 8 | `presets.mjs:49-51` → `settings.mjs:276-287` → `panel-settings-push.mjs:30-33` → 站点 `:32` | 同链（自定义渠道清理 = 次级写——不进发射面） | providers |
| 9 ∕ 10 | `panel-messages-settings.mjs:35 ∕ :38` | `const err = await panel._saveMcpServer(…)`（delete 同形）`if (err) postProviderError(panel, "mcp", err)` + 原回推行 | mcp |

**scope 归属（闭集 = 六段 + `panel`——`SETTINGS.md` §2.15）**：shell ∕ proxy → `env`；websearch ∕ embed → `tools`（行位 = tools 卡 `settings-tools.js`——websearchRow ∕ embedRow）；provider-proxy ∕ provider-key → `providers`；mcp save ∕ delete → `mcp`。

**面② 单点收口**：`chat-panel.mjs:195-197`——抽薄函数 `reportHandlerError(panel, e)`（`console.error` 保留 + `postProviderError(panel, "panel", 首行（`e?.message ?? String(e)`）））；分发表 `.catch((e) => reportHandlerError(this, e))`。panel scope = 设计内「零段标」形——畸形档原样串直传。

**边界（不做 · 显式）**：① 交互流三件（`addProviderFlow ∕ removeProviderFlow ∕ setKeyFlow`——`panel-messages-settings.mjs:76 ∕ :87 ∕ :98`）——失败面 = `host.error`（`provider-flows.mjs:24` 弹窗）已可视 ⇒ 不进面板失败面（防双面）；② 槽写三件（`setAdvisorGuard ∕ setEngineeringEnabled ∕ setPlanMode`——`:161-183`）try/catch{} 静默 = 既有具名裁定（「a slot write failure blocks nothing else」）⇒ 零改；`selectModel` 槽写（`panel-messages.mjs:231-235`）同类零改；③ 代理面「`!uri` 零落盘 ∕ 徽标照亮」观感面（`SETTINGS.md` §3 `:453-455`）同族已单列 ⇒ 不并。

**验收腿（批内件 `docs/batches/2026-09-30-vsc-cleanup.test.mjs`——随批留存 · 仓套件不收集）**：
- T1（面① · 逐站）：10 新站点 × 冲突注入 ⇒ 各恰一条 `{type:"providerError", scope:<上表>, reason:"mtime-conflict"}`（注入建议 = #675 先例窗内外部写（Proxy 按各站写入体选位）；不可窗触站以模块短接（`registerHooks` 假 `config-io`——`{ok:false, reason:"mtime-conflict"}`）等价注入）。
- T2（负控 · 逐站）：正常写真 ⇒ 零 `providerError` ∧ 盘面落写。
- T3（面②）：`reportHandlerError` 直驱（多行消息）⇒ `{scope:"panel", reason:首行}`；结构锁 = 分发表调用点在位。
- T4（负控 · 面②）：正常处理链 ⇒ 零发射。
- 真机腿（父侧）：面板开时外部改 config.json（制造冲突）⇒ 对应段标 + 词句驻留；畸形 config ⇒ panel 面原样串可见。

**重锚腿（实施轮落盘后 · 设计者终态实读——含现盘漂移收正）**：① `thincoder-vscode/src/extension/settings.mjs:306-308` 注释「8 站点统一经此」⇒ 终值（**现盘已漂**：实读发射点 = 9（含 crossline P2-5 所加 `:198`）——与「8 站点」字面不符，一并收正）；② `docs/vsc/design/SETTINGS.md` §2.15 extension 面句 + 站点表（`:435-436`）；③ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 20（`:102`）+ §12 `providerError` 行（`:417`）。

### 2.3 #696 判面口径（裁定：闸外非缺陷、不收形——父裁已回）

**实读（设计轮自跑）**：三档 20 处 >300 单行中 **19 处 = markdown 表行**（谓词 `^\s*\|.*\|\s*$` 逐处命中）——`WEBVIEW-INPUT.md:15 ∕ :16 ∕ :18 ∕ :19 ∕ :171`（323 ∕ 333 ∕ 485 ∕ 768 ∕ 420 字符）· `SETTINGS.md:387`（348）· `WEBVIEW-PROTOCOL.md:49 ∕ :50 ∕ :52 ∕ :62 ∕ :63 ∕ :97 ∕ :98 ∕ :99 ∕ :102 ∕ :229 ∕ :235 ∕ :252 ∕ :427`（**台账所列 `:227 ∕ :233 ∕ :250 ∕ :425` ⇒ 现盘 `:229 ∕ :235 ∕ :252 ∕ :427`——+2 位移、同四行**）；第 20 处 = `WEBVIEW-PROTOCOL.md:518`（367——**非表行**）。

**判**：19 处按**表行豁免**——机制 = `scripts/doc-check-width.mjs:62`（`!isTableRow(l)`——实跑对 19 处零报告）；规范 = `DOC-DISCIPLINE.md` §3.1「表格行豁免（规范 + 机制双层）」；先例群 = 2026-09-14-doc-migration（「非同型 ⇒ 不折行」）· 2026-09-16-engine-debt（「折行会破坏 markdown 表行」）· 2026-09-16-vsc-debt（「长表行形态合规」）。⇒ **非缺陷、不入行宽闸、不收形**（表行结构性不可折行；原「零语义断行」前提不成立）。

**父裁回执（2026-09-30 23:5x）**：准——按倾向成稿；#696 收束 = 「未核 ⇒ 已核毕、零动作」（批档收口时核销）；`:518` = 归跨端消化批（#726）收口面——**本批零动作**（不触）。

**机检腿**：① 谓词复跑 = 19 处全表行；② `node scripts/doc-check.mjs` 对三档行宽命中 = 0（除 `:518`——#726 面）；③ 本批对该三档零落笔（收形零动作）。

### 2.4 #698 设计档收正（SETTINGS-TOOL.md 退役测试档指称三处——本轮已落）

**处置**：三处统一按「**退役事实收正 + 单测树重建时回迁**」口径（承 crossline 既有措辞「单测树重建时回迁 …」；测试树全清 2026-09-28 = #657 同族）。

**落点（已落 · D6 读回在册）**：
- `docs/core/design/SETTINGS-TOOL.md:82`（§2.8 VSC 测试坐标）——补「该档已随测试树全清退役（2026-09-28）；单测树重建时回迁」。
- 同档 `:111`（§3 D-ST15）——「拟新增」收正为「已随 #677 落批内件（`docs/batches/2026-09-30-crossline-clearance.test.mjs` 遮蔽面格）；单测树重建时回迁该档形」；引档加「已退役」注。
- 同档 `:138`（§5 测试档行）——三档（CLI `settings.test.mjs` ∕ `settings-mask` ∕ VSC `settings-tool.test.mjs`）退役 + 回迁注。
- 同档变更记录 +1 行（`:176`）。

**机检腿**：三处均含「退役」+「回迁」字样；「拟新增」裸标零残留；`doc-check` 对同档零新增红。

### 2.5 #701 设计（VSC 装配面并项目根 `.mcp.json`——对齐 CLI ∕ 桌面）

**三裁定（沿已裁形态——机制单源 = `docs/core/design/MCP.md` §6.4 `:86`；对齐基准 = CLI `make-agent.mjs:61-79` ∥ 桌面 `agent-assemble.mjs:58-79`）**：① 发现面 = 项目根单层（`join(cwd, ".mcp.json")`——零上溯）；② 信任面 = 零交互（同信任域——不设首次信任 ∕ 端别门）；③ 合并 = config 同名优先 ∕ 异名追加（config 先）；`mcpServers` 对象形（数组形 ⇒ 跳过 + 记录）；条目 = `{name, ...server}`（非对象 ∕ 数组 ⇒ 跳过）；读 ∕ 解析失败非致命；非变异（不回写 config）。

**落点**：
- `thincoder-vscode/src/config-mcp.mjs`（现 72 行——**新增** `assemblyMcpServers(cwd)` ≈ 28 行：`loadMcpServers()` + 项目根文件并入；既有导出零改）。
- `thincoder-vscode/src/extension/panel-turn-loop.mjs:165`——`mcpServers: getMcpServers()` ⇒ `mcpServers: await assemblyMcpServers(cwd)`（`cwd` = 会话当前项目根；**ro 载荷 = 全树唯一 MCP 供给点**——`setup.mjs:84/:194 → tool-table.mjs:150-156` 消费链实读在册）。
- 管理面（`panel-mcp.mjs` 列表 ∕ 重连 ∕ 探活；`settings.mjs:289-304` 读写）**零改**——config 单源（沿 CLI `/mcp` 口径）。

**判据腿（批内件）**：T1 含 ∕ 并入（项目单条目 ⇒ 装配连接集含之）；T2 同名优先（config `A` ∥ 文件 `A` ⇒ 连接 config 片、文件片零调用）；T3 异名追加序（config 先 ∕ 文件后）；T4 数组形 ∕ 坏 JSON ∕ 无文件 ⇒ 非致命（零中断、零并入）；T5 非变异（config 对象 ∕ 盘面零增）；T6（负控）管理面列表不含文件源条目（`loadMcpServers` 零改锁）；T7 `cwd` 空 ∕ 非串 ⇒ 零读零并入。

**真机腿（父侧）**：项目含 `.mcp.json`（真 ∕ 假 server）⇒ 会话内工具可达；移除 ⇒ 下次装配消失。

**重锚腿（实施后 · 设计者）**：`MCP.md:86` 括注（「VSC 端第三面未并」⇒ 三面同判）；`docs/vsc/design/SETTINGS.md` §2.4（**本轮已落**第二源句——实施后按终态复核）。

### 2.6 #705 拟文（父侧笔——逐处改法（文件:节 + 成文）；本档零落笔）

#### ① `docs/vsc/requirements/WEBVIEW.md`（§4 全表 ∕ `:79-85` 五条 ∕ `:111-137` 段 ∕ F-W15 ∕ F-W16）

**A. `:111` 端差口径段（重写——设计侧类判据已退场 #677）**，拟文：

> **端差口径（2026-09-30 收正 · #677）**：端差默认 = **消**（对齐）；保留例外的唯一凭据 = **宿主能力面证据 ∥ 行为证据**——逐条落行，不设类级判据（机制单源 = `design/WEBVIEW-PROTOCOL.md` §6.1 首句）。行结论词表 = **实证例外**（附证据）· **消（已落）** · **等价 ∕ 对齐 ∕ 采用**（无端差）· **非端差**（无对位物 ∕ 范围决定）。

**B. §4 表逐行**——「**已裁保留**（类判据 = `design/WEBVIEW-PROTOCOL.md` §6.1 首）」全数退场、逐行替换（依据 = 设计侧 `WEBVIEW-PROTOCOL.md` §6.1 ∕ §6.2 + `WEBVIEW.md` §4.3 ∕ §4.4 现结论）：

| 行（现 `:115-137`） | 替换后结论 |
|---|---|
| `:115` F-W2 | **实证例外（宿主 + 行为证据）**——滚动状态两端可见：CLI `scrolled N` 文本 ∥ 本端回底钮；锚定补偿 = 历史 prepend 不位移视口 |
| `:117` F-W3 | **实证例外（宿主证据）**——分页指示：CLI「N more」计数行 ∥ 本端加载指示器 + `hasOlder` 门 |
| `:118` F-W1 | **实证例外（宿主证据）**——活动区承接：终端面板行 ∥ webview 活动区块 |
| `:119` F9 | **实证例外（宿主证据）**——选择面：全屏 picker ∥ 下拉部件 |
| `:120` F10 | **非端差（各端组件面自持——交互契约各自登记）** |
| `:122` F12 | **实证例外（宿主证据）**——入口形态：TUI 子菜单 ∥ 面板表单 |
| `:123` F13 | **非端差（范围决定——attention chip 不做）** + 不做项在册（U-P5） |
| `:124` N1–N2 | **实证例外（宿主证据）**——渲染载体：终端缓存 ∥ DOM 窗口化 + 离屏跳过 |
| `:127` N5–N6 | **实证例外（宿主证据）**——截断标记：CLI「省略 N 行」体系 ∥ 本端无计数截断标记 |
| `:128` F-W15 | **消（已落——CLI 恢复渲染同款剥离；#677 · I1；端面 = VSC + 桌面）** |
| `:129` F-W16 | 卡态语义 **实证例外（宿主 + 行为证据）**；成功面 `(exit code 0)` = **消（已落——#677 · I16b）** |
| `:130` N7 | **非端差（无对位物——本端无 cols 固定宽面）** |
| `:132` N9 | **非端差（随 F13——attention chip 不做）** |
| `:133` N10 | **实证例外（宿主证据）**——载体：字符额度族 ∥ 块窗 150 + 卡体 64K + 离屏跳过 |
| `:134` TTO FR1–FR3 | **实证例外（宿主证据）**——呈现载体：行间区块 ∥ 卡片 |
| `:137` TTO NFR2 | **实证例外（宿主证据）**——接口形态：宿主回调 ∥ postMessage 消息族 |
| `:121 ∕ :125 ∕ :126 ∕ :131 ∕ :135 ∕ :136` | 已为等价 ∕ 无端差句——本次零改 |

（逐行证据句 = 设计侧现文；落笔前父侧逐行实读为准。）

**C. `:79-85` 五条（P2-3…P2-7）状态收正**：P2-3 →「**已消（已落——差异提交（只发被编辑字段）；#677 · I15-P2-3）**」；P2-4 →「**advisor-effort 半已消（已落——select 未渲染 ⇒ 不发字段）；余项消解 = 面板写面缺席字段不发——到期 = 面板写面下次触碰（#381 裁定在案）**」；P2-5 →「**已消（已落——URI 形态校验前置；#677 · I15-P2-5）**」；P2-6 →「**已消（已落——重建前保留在编输入；#677 · I15-P2-6）**」；P2-7 →「**已结清（已落——单槽待显；2026-09-29 vsc-carryover）**」。

#### ② `docs/core/requirements/TESTING.md` 三处（设计侧已改写——「待重做」句退场）

- `:183` →「**终端程序自动验证面无第二设计档**（2026-09-30 · #677 收正——原「设计面 = 待重做（另轮）」句退场：无承接对象）；本节验收依据 = 本节内联判据（§6.2）+ 能力面判定句（`TOOLS.md` §4.7）。」
- `:238` →「…其验收标准与用例表随档作废（**设计面 = 无第二设计档**——2026-09-30 #677 收正），本节验收依据 = 本节内联判据。」
- `:282`（变更记录行——记录面）→ **不回改**；处置 = 变更记录尾部 +1 条（2026-09-30：「设计面 = 无第二设计档」收正——`:183 ∕ :238` 两处改毕，旧句退场）。

#### ③ `docs/core/requirements/PORTABILITY.md` `:19 ∕ :54 ∕ :81`（随 C34——归位裁决已定；同族句 `:47` 同扫）

- `:19` →「范围边界：本档 §2–§3 承载本仓（VSC 面）需求；**需求组 FR10–FR15 的正文已归位本档 §5.4**（2026-09-30 裁决落定——正文自 v1 需求档 `ENGINEERING-MODE.md`（`_archive/`）迁入）；其**接受方向与 FR14 落实文本** = 本档 §5。」
- `:54` →「FR10–FR15 正文已归位本档 §5.4（2026-09-30 裁决；其一览）：FR10 …（余同现文）」
- `:81` →「本节不重述 FR10–FR15 正文（D2——正文见 §5.4，归位已落 2026-09-30）。」
- `:47`（§4 边界行——同句）→ 同式收正（「不重述 FR10–FR15 正文（正文见 §5.4——归位已落）…」）。
- **配套（父侧落笔项）**：§5 新增「5.4 FR10–FR15 正文（自 v1 需求档归位）」节——正文逐字迁自 `docs/core/requirements/_archive/ENGINEERING-MODE.md` §2（搬运 + 节号引用改指；D2 单源迁入）。

#### ④ `thincoder-vscode/AGENTS.md` 寄存器表（C39——产品文本面）

- **补 `providerError` 行**（extension → webview）：`{ scope, reason }`——scope = 段名（六段闭集 + `panel`；闭集外 ⇒ 零段标）；reason = 码 ∕ 原样串。发射 = `src/extension/settings.mjs` `postProviderError`（站点汇聚——终值随 #695）；消费 = `webview/settings.js` `showSettingsError`（单槽驻留——机制单源 = `../docs/vsc/design/SETTINGS.md` §2.15）。
- **`providerInfo` 行处置 = 删**（实读：`thincoder-vscode/src/**` + `webview/**` 全树零命中 = 死消息；`WEBVIEW-PROTOCOL.md` §12 表亦无该行）。
- **「7 字段」补登记**：C39 裁定「7 字段 + `providerError` 补」——**该 7 项原始枚举未在在册记录**（crossline §1–§3 全文 + 台账扫零命中）⇒ **上抛（§2.9②）**：请父侧按源发现补列；候选域（本席可枚举 = 协议 §3.2 增量表行 15–21 中 AGENTS.md 表未列者）：`workspaceGuard` ∕ `queuedUserMessage` ∕ `busyQueued` ∕ `usage.timers` ∕ `timer` ∕ `usage.ctxTokens` ∕ `providerError`（七项）——父侧取并 ∕ 校正后落笔。

### 2.7 受影响文件与测试面（现行 ⇒ 预期——内容行数口径 · 实读 2026-09-30）

| # | 档 | 现行 | Δ | 面 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 206 | +≈16（10 站点接线） | #695 |
| 2 | `thincoder-vscode/src/extension/settings.mjs` | 368 | +≈8（三函数返回契约） | #695 |
| 3 | `thincoder-vscode/src/extension/settings-panel-write.mjs` | 184 | ±0（契约已在） | #695 |
| 4 | `thincoder-vscode/src/extension/panel-index.mjs` | 240 | +≈3 | #695 |
| 5 | `thincoder-vscode/src/extension/presets.mjs` | 197 | +≈2 | #695 |
| 6 | `thincoder-vscode/src/extension/panel-settings-push.mjs` | 119 | +≈2 | #695 |
| 7 | `thincoder-vscode/src/extension/chat-panel.mjs` | 432 | +≈6（reportHandlerError + 调用点） | #695 |
| 8 | `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 | ±0 | #695 |
| 9 | `thincoder-vscode/src/config-mcp.mjs` | 72 | +≈28（assemblyMcpServers） | #701 |
| 10 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 303 | +≈2（**已越 300 建议线（存量 303）**——审视 = 不拆（增量小）；触发 = 触碰后重评） | #701 |
| 11 | `docs/core/design/SETTINGS-TOOL.md` | 175 | **已落**（**176**——三处 + 变更记录行；落盘实测） | #698 |
| 12 | `docs/vsc/design/SETTINGS.md` | 628 | **已落**（+3——§2.4 第二源句 + 变更记录行 + 空行） | #701 |
| 13 | 批内件 `docs/batches/2026-09-30-vsc-cleanup.test.mjs` | — | 拟新增（#695 T1–T4 + #701 T1–T7——随批留存 · 不入仓套件） | #695 ∕ #701 |
| 14 | 需求档 ∕ 产品文本面（#705 四件） | — | 父侧笔（拟文 = §2.6） | #705 |
| — | 核 ∕ CLI ∕ 桌面 ∕ IPC ∕ preload ∕ 数据面 ∕ #696 三档（零落笔） | — | **零触**（显式） | 边界 |

### 2.8 关键决策记录（含被否候选）

| # | 决策 | 被否候选（+否由） |
|---|---|---|
| KD-VC-1 | #695 两面收口：面① 逐站接线（沿 7⇒8 形态）+ 面② dispatch 单点 | 面②逐站 try/catch（重复面、漏非写抛点） |
| KD-VC-2 | scope 按面板卡位实读归属（websearch ∕ embed = tools 等） | 全挂 env ∕ 新增段名（闭集 ∕ 零新段名纪律） |
| KD-VC-3 | 交互流 ∕ 槽写面不进闭集 | 全量收编（双面 ∕ 既有具名裁定） |
| KD-VC-4 | #696 = 闸外非缺陷、不收形（父裁已回） | 表下补充重排（正文重构、偏离先例——未采）；`:518` 归 #726（不触） |
| KD-VC-5 | #698 = 「退役收正 + 回迁注」并取 | 纯改指现载体（重建后二次改）∕ 只在册（现状指称失实） |
| KD-VC-6 | #701 = 端本地实现（核零改）· 装配面单入口 · 管理面 config 单源 | 核上提（改 CLI 消费点——越射程）∕ 管理面并入（越 CLI `/mcp` 口径） |
| KD-VC-7 | #705 = 拟文不改笔权；TESTING `:282` 记录面不回改（补变更记录条） | 直改需求档（越笔权） |

### 2.9 上抛项与边界 + 自检读数

**上抛①（已回）**：#696 口径裁定——父裁 2026-09-30 23:5x「准——按倾向成稿」（闸外非缺陷、不收形；`:518` 归 #726）⇒ 已按裁成稿，无残留。

**上抛②（待父侧）**：#705-④ C39「7 字段」源枚举未在册——请按源发现补列（候选域 = §2.6④；`providerInfo` 退役 = 零命中实锤）。

**观察（非上抛 · 随腿收正）**：站点计数漂移（实读 9 vs 三处「8 站点」字面）⇒ 并入 §2.2 重锚腿；代理 `!uri` 零落盘观感面（`SETTINGS.md` §3 `:453-455`）⇒ 已单列在册（不并）。

**边界（本批不做）**：产品码 ∕ 需求档 ∕ 产品文本面本轮零触（实施另轮 ∕ 父侧笔）；`docs/vsc/design/**` 本轮仅 SETTINGS.md §2.4（#701）；#696 三档零落笔；跨端消化批在飞面（#726）零触。

**过程披露（可 revert）**：① 档头 `:4` 死占位（编号 ∕ 板块占位符）机械回填为「#695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族 · 归批）」——父侧代号已在档头 `:3` 载明（未回填前 append ∕ status 全拒）；② 本披露行初版携死占位字样自触 status fail-closed ⇒ 机械重写（零他义）；③ §2.7 行 11 读数收正：`SETTINGS-TOOL.md` 落盘后实测 = **176 行**（+1——变更记录行；原 `≈184` 为落笔前估值）；④ §2 本段写入前无其他作者触碰。

**自检读数（D6 · 设计轮末）**：① 两笔落盘回读在位（`SETTINGS-TOOL.md:82 ∕ :111 ∕ :138 ∕ :176`；`SETTINGS.md:51 ∕ :631`）；② `node scripts/doc-check.mjs` 实跑——本批触及面零新增红（行宽面对 #696 三档零报告 ∕ 同 SETTINGS-TOOL.md 零报告）；③ 行数账 = §2.7（两项已落实读；余为预期，实施后实测回填）；④ 三链同源 = §2.1 表 ⇄ §2.6 拟文 ⇄ 台账五条（#695 ∥ #696 ∥ #698 ∥ #701 ∥ #705）逐号对应。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
