# 2026-09-30 · VSC 清扫
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族）；用户 2026-09-30 23:42 批次点火令「实活都做了」。。
> 台账 = #695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**【#705-④ 落笔（父侧直执行 · 2026-10-01 00:1x · 可 revert）】**注册面按 C39 源（`crossline-clearance.md:151`）+ 协议 §3.2 行 15–21 实读落定：**① 补 6 条实况消息**——`queuedUserMessage` ∥ `busyQueued` ∥ `workspaceGuard` ∥ `usage`（含 `timers` ∥ `ctxTokens` 两增字段注）∥ `timer` ∥ `providerError`（增于 `thincoder-vscode/AGENTS.md` 协议表末段）；**② `providerInfo` 行处置 = 退役行替换为 `providerStatus`**（`{ keyOk, status }`——实读：现码 `src/extension/panel-settings-push.mjs:21` ∥ `settings.mjs:69`，发射 `settings.mjs:317`；归档实锤「`providerInfo` 已退场——现体 = `providerStatus`」`_archive/design/WEBVIEW.md:400`）——**旧名不携残句**（沿尸句删净纪律）。计数归一 = **增 6 + 换 1**（「7 字段」实指落定）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-01（修复轮 1 收正毕——§3 十一条逐处（号 → 处置 → file:line，见 §2.10）；上抛两件均回；待父侧复审）
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
| 8 | `presets.mjs:49-51` → `settings.mjs:276-287` → `panel-settings-push.mjs:30-33` → 站点 `:32` | 同链（`removeProviderKey` 返回核串；`deleteProviderKey` 穿透返回（清理后））；站点捕获 + 发射；自定义渠道清理 = 次级写 | providers |
| 9 ∕ 10 | `panel-messages-settings.mjs:35 ∕ :38` | `const err = await panel._saveMcpServer(…)`（delete 同形）`if (err) postProviderError(panel, "mcp", err)` + 原回推行 | mcp |

**scope 归属（闭集 = 六段 + `panel`——`SETTINGS.md` §2.15）**：shell（本批新站 `:190`）→ `env`；「proxy」= 既有 env 站 `:198`（proxy 写面——P2-5 已接，非本批新站）→ `env`；websearch（新站 `:107 ∕ :110`）∥ embed（新站 `:101 ∕ :104`）→ `tools`（行位 = tools 卡 `settings-tools.js`——websearchRow ∕ embedRow）；provider-proxy（新站 `:92`）∥ provider-key（新站 `:29 ∕ :32`）→ `providers`；mcp save ∕ delete（新站 `:35 ∕ :38`）→ `mcp`。

**面② 单点收口**：`chat-panel.mjs:195-197`——抽薄函数 `reportHandlerError(panel, e)`（`console.error` 保留 + `postProviderError(panel, "panel", 首行（`e?.message ?? String(e)`）））；分发表 `.catch((e) => reportHandlerError(this, e))`。panel scope = 设计内「零段标」形——畸形档原样串直传。

**边界（不做 · 显式）**：① 交互流三件（`addProviderFlow ∕ removeProviderFlow ∕ setKeyFlow`——`panel-messages-settings.mjs:76 ∕ :87 ∕ :98`）——失败面 = `host.error`（`provider-flows.mjs:24` 弹窗）已可视 ⇒ 不进面板失败面（防双面）；② 槽写三件（`setAdvisorGuard ∕ setEngineeringEnabled ∕ setPlanMode`——`:161-183`）try/catch{} 静默 = 既有具名裁定（「a slot write failure blocks nothing else」）⇒ 零改；`selectModel` 槽写（`panel-messages.mjs:231-235`）同类零改；③ 代理面「`!uri` 零落盘 ∕ 徽标照亮」观感面（`SETTINGS.md` §3 `:455-457`）同族已单列 ⇒ 不并。

**验收腿（批内件 `docs/batches/2026-09-30-vsc-cleanup.test.mjs`——随批留存 · 仓套件不收集）**：
- T1（面① · 逐站）：10 新站点 × 冲突注入 ⇒ 各恰一条 `{type:"providerError", scope:<上表>, reason:"mtime-conflict"}`（注入建议 = #675 先例窗内外部写（Proxy 按各站写入体选位）；不可窗触站以模块短接（`registerHooks` 假 `config-io`——`{ok:false, reason:"mtime-conflict"}`）等价注入）。
- T2（负控 · 逐站）：正常写真 ⇒ 零 `providerError` ∧ 盘面落写。
- T3（面②）：`reportHandlerError` 直驱（多行消息）⇒ `{scope:"panel", reason:首行}`；结构锁 = 分发表调用点在位。
- T4（负控 · 面②）：正常处理链 ⇒ 零发射。
- 真机腿（父侧）：面板开时外部改 config.json（制造冲突）⇒ 对应段标 + 词句驻留；畸形 config ⇒ panel 面原样串可见。

**重锚腿（实施轮落盘后 · 设计者终态实读——含现盘漂移收正）**：① `thincoder-vscode/src/extension/settings.mjs:306-308` 注释「8 站点统一经此」⇒ 终值（**现盘已漂**：实读发射点 = 9（含 crossline P2-5 所加 `:198`）——与「8 站点」字面不符，一并收正）；② `docs/vsc/design/SETTINGS.md` §2.15 extension 面句 + 站点表（`:437-438`——计数句已随修复轮 1 收正为「既有 9 + 本批 10 ⇒ 19」；实施后按终态复核坐标）；③ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 行 20（`:102`）+ §12 `providerError` 行（`:417`）——两处现盘亦携「8 站点」字面与旧坐标（如 `:302` ∕ `:358`），实施后按终态一并收正。

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

**机检腿**：三处均含「退役」+「回迁」字样；「拟新增」标记零残留（修复轮 1 实读：`:111 ∕ :138` 已删、同族 `:43` 随修；余 = `:128` 基准注读法引述 + 记录面 `:173 ∕ :176 ∕ :177`）；`doc-check` 对同档零新增红。

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
| `:116 ∕ :121 ∕ :125 ∕ :126 ∕ :131 ∕ :135 ∕ :136` | 已为等价 ∕ 无端差句——本次零改（`:116` 为修复轮 1 逐行实读补入——F6 行无保留标记） |

（逐行证据句 = 设计侧现文；落笔前父侧逐行实读为准。）

**C. `:79-85` 五条（P2-3…P2-7）状态收正**：P2-3 →「**已消（已落——差异提交（只发被编辑字段）；#677 · I15-P2-3）**」；P2-4 →「**advisor-effort 半已消（已落——select 未渲染 ⇒ 不发字段）；余项消解 = 面板写面缺席字段不发——到期 = 面板写面下次触碰（#381 裁定在案）**」；P2-5 →「**已消（已落——URI 形态校验前置；#677 · I15-P2-5）**」；P2-6 →「**已消（已落——重建前保留在编输入；#677 · I15-P2-6）**」；P2-7 →「**已结清（已落——单槽待显；2026-09-29 vsc-carryover）**」。

#### ② `docs/core/requirements/TESTING.md` 三处（设计侧已改写——「待重做」句退场）

- `:183` →「**终端程序自动验证面无第二设计档**（2026-09-30 · #677 收正）；本节验收依据 = 本节内联判据（§6.2）+ 能力面判定句（`TOOLS.md` §4.7）。」
- `:238` →「…其验收标准与用例表随档作废（**设计面 = 无第二设计档**——2026-09-30 #677 收正），本节验收依据 = 本节内联判据。」
- `:282`（变更记录行——记录面）→ **不回改**；处置 = 变更记录尾部 +1 条（2026-09-30：「设计面 = 无第二设计档」收正——`:183 ∕ :238` 两处改毕，旧句退场）。

#### ③ `docs/core/requirements/PORTABILITY.md` `:19 ∕ :54 ∕ :81`（随 C34——归位裁决已定；同族句 `:47` 同扫）

- `:19` →「范围边界：本档 §2–§3 承载本仓（VSC 面）需求；**需求组 FR10–FR15 的正文已归位本档 §5.4**（2026-09-30 裁决落定——正文自 v1 需求档 `ENGINEERING-MODE.md`（`_archive/`）迁入）；其**接受方向与 FR14 落实文本** = 本档 §5。」
- `:54` →「FR10–FR15 正文已归位本档 §5.4（2026-09-30 裁决；其一览）：FR10 …（余同现文）」
- `:81` →「本节不重述 FR10–FR15 正文（D2——正文见 §5.4，归位已落 2026-09-30）。」
- `:47`（§4 边界行——同句）→ 同式收正（「不重述 FR10–FR15 正文（正文见 §5.4——归位已落）…」）。
- **配套（父侧落笔项）**：§5 新增「5.4 FR10–FR15 正文（自 v1 需求档归位）」节——正文逐字迁自 `docs/core/requirements/_archive/ENGINEERING-MODE.md` §2（搬运 + 节号引用改指；D2 单源迁入）。

#### ④ `thincoder-vscode/AGENTS.md` 寄存器表（C39——产品文本面）

- **补 `providerError` 行**（extension → webview——已落 · §1）：`{ scope, reason }`——scope = 段名（六段闭集 + `panel`；闭集外 ⇒ 零段标）；reason = 码 ∕ 原样串。发射 = `src/extension/settings.mjs` `postProviderError`（站点汇聚——终值随 #695）；消费 = `webview/settings.js` `showSettingsError`（单槽驻留——机制单源 = `../docs/vsc/design/SETTINGS.md` §2.15）。
- **`providerInfo` 行处置 = 退役行替换为 `providerStatus`**（已落 · §1——换 1；`{ keyOk, status }` = 现体消息，发射 `settings.mjs:317`；实读：`providerInfo` 在 `thincoder-vscode/src/**` + `webview/**` 全树零命中 = 死消息——旧名不携残句；`WEBVIEW-PROTOCOL.md` §12 表亦无 `providerInfo` 行）。
- **「7 字段」口径 = 已落定（增 6 + 换 1）**：C39「7 字段 + `providerError` 补」实指随父侧落笔归一（§1 · 2026-10-01 00:1x）——**增 6**（`queuedUserMessage` ∕ `busyQueued` ∕ `workspaceGuard` ∕ `usage`（含 `timers` ∕ `ctxTokens` 两增字段注）∕ `timer` ∕ `providerError`）+ **换 1**（`providerInfo` ⇒ `providerStatus`）；上抛②随之落定（§2.9）。

### 2.7 受影响文件与测试面（现行 ⇒ 预期——内容行数口径 · 实读 2026-09-30）

| # | 档 | 现行 | Δ | 面 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 206 | +≈16（10 站点接线） | #695 |
| 2 | `thincoder-vscode/src/extension/settings.mjs` | 368 | +≈8（三函数返回契约；**已越 300 建议线**——复核结论 = 不拆（+≈8 仅返回穿透，**不触「结构改动」**）；在册拆分计划 = `docs/vsc/design/SETTINGS.md:485-488`（阈值 450 ∕ 结构改动——先到即拆）；到期条件 = 触发阈值到达时） | #695 |
| 3 | `thincoder-vscode/src/extension/settings-panel-write.mjs` | 184 | ±0（契约已在） | #695 |
| 4 | `thincoder-vscode/src/extension/panel-index.mjs` | 240 | +≈3 | #695 |
| 5 | `thincoder-vscode/src/extension/presets.mjs` | 197 | +≈2 | #695 |
| 6 | `thincoder-vscode/src/extension/panel-settings-push.mjs` | 119 | +≈2 | #695 |
| 7 | `thincoder-vscode/src/extension/chat-panel.mjs` | 432 | +≈6（reportHandlerError + 调用点；**已越 300 建议线（存量 432——全批最大）**——复核结论 = 不拆（+≈6 不改结构）；触发 = 触碰时复核（`docs/vsc/design/VSC-DEBT.md` §12.1 单源——本批已复核）＋阈值 450 行 ∕ 该档下次结构改动（先到即拆）；到期条件 = 触发阈值到达时） | #695 |
| 8 | `thincoder-vscode/src/extension/panel-mcp.mjs` | 167 | ±0 | #695 |
| 9 | `thincoder-vscode/src/config-mcp.mjs` | 72 | +≈28（assemblyMcpServers） | #701 |
| 10 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 303 | +≈2（**已越 300 建议线（存量 303）**——审视 = 不拆（增量小）；触发 = 触碰后重评） | #701 |
| 11 | `docs/core/design/SETTINGS-TOOL.md` | 175 | **已落**（**176**——三处 + 变更记录行；落盘实测） | #698 |
| 12 | `docs/vsc/design/SETTINGS.md` | 628 | **已落**（+3——§2.4 第二源句 + 变更记录行 + 空行） | #701 |
| 13 | 批内件 `docs/batches/2026-09-30-vsc-cleanup.test.mjs` | — | 拟新增（#695 T1–T4 + #701 T1–T7——随批留存 · 不入仓套件；**体量预估 ≈250–350 行**；组界 = #695 组（T1–T4）∥ #701 组（T1–T7）——**超 300 即按组拆两档**） | #695 ∕ #701 |
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

**上抛②（已回 · 2026-10-01 00:1x）**：#705-④ C39「7 字段」口径落定 = **增 6 + 换 1**（父侧落笔在册——§1；候选域七项随取并）；§2.6④ 已随对齐。

**观察（非上抛 · 随腿收正）**：站点计数漂移（实读 9 vs「8 站点」字面——`:437` 面已随修复轮 1 收正；余 ① ∥ ③）⇒ 并入 §2.2 重锚腿；代理 `!uri` 零落盘观感面（`SETTINGS.md` §3 `:455-457`）⇒ 已单列在册（不并）。

**边界（本批不做）**：产品码 ∕ 需求档 ∕ 产品文本面本轮零触（实施另轮 ∕ 父侧笔）；`docs/vsc/design/**` 本轮仅 SETTINGS.md §2.4（#701）；#696 三档零落笔；跨端消化批在飞面（#726）零触。

**过程披露（可 revert）**：① 档头 `:4` 死占位（编号 ∕ 板块占位符）机械回填为「#695 ∥ #696 ∥ #698 ∥ #701 ∥ #705（VSC 清扫族 · 归批）」——父侧代号已在档头 `:3` 载明（未回填前 append ∕ status 全拒）；② 本披露行初版携死占位字样自触 status fail-closed ⇒ 机械重写（零他义）；③ §2.7 行 11 读数收正：`SETTINGS-TOOL.md` 落盘后实测 = **176 行**（+1——变更记录行；原 `≈184` 为落笔前估值）；④ §2 本段写入前无其他作者触碰。

**自检读数（D6 · 设计轮末）**：① 两笔落盘回读在位（`SETTINGS-TOOL.md:82 ∕ :111 ∕ :138 ∕ :176`；`SETTINGS.md:51 ∕ :631`）；② `node scripts/doc-check.mjs` 实跑——本批触及面零新增红（行宽面对 #696 三档零报告 ∕ 同 SETTINGS-TOOL.md 零报告）；③ 行数账 = §2.7（两项已落实读；余为预期，实施后实测回填）；④ 三链同源 = §2.1 表 ⇄ §2.6 拟文 ⇄ 台账五条（#695 ∥ #696 ∥ #698 ∥ #701 ∥ #705）逐号对应。

### 2.10 修复轮 1（§3 轮次 1 · 十一条逐处收正）

（修复轮 · eng-designer · 2026-10-01 · fix——定点收正：批档 §2 内 15 处 + `SETTINGS-TOOL.md` 4 处 + `SETTINGS.md` 6 处；产品码零触（代码面仅实读）；逐处读回 = 文末。）

| 号 | 处置 | 落点（file:line） |
|---|---|---|
| 1 | `:32` 站定形 = **接入发射**（实读 `settings.mjs:276-287` = `deleteProviderKey` 链：主写 `removeProviderKey` → 核 `removeProviderKeyFromConfig`（`config-io.mjs:211-217` 已返核串）＋ custom 清理 = 次级写）⇒ 删「不进发射面」括注、保留「次级写」；行 8 ∥ T1（10 站）∥ §2.7 行 1 ∥ 现状表 ④ 全表对齐（后三处复核已一致——零改） | 批档 `:52` |
| 2 | scope 句逐名标站——shell（新站 `:190`）∥「proxy」= 既有 `:198`（非本批站）∥ provider-proxy（新站 `:92`）∥ provider-key（新站 `:29 ∕ :32`）；env 归属只指既有 `:198` | 批档 `:55` |
| 3 | §2.7 行 2 ∕ 行 7 补拆分复核（结论 + 触发阈值 + 到期条件）；行 2 引在册计划（`SETTINGS.md:485-488`）并判「+≈8 不触结构改动」；行 7 引触发单源（`VSC-DEBT.md` §12.1——本批已复核） | 批档 `:166 ∕ :171` |
| 4 | `SETTINGS-TOOL.md:111 ∕ :138` 删「拟新增」残标 + 载体区分（树内两档退役 ∥ 遮蔽面档 = 已落批内件 #677）；同族残标 `:43` 随修；机检腿措辞按实况收正；同档变更记录 +1 行 | `docs/core/design/SETTINGS-TOOL.md:43 ∕ :111 ∕ :138 ∕ :177`；批档 `:90` |
| 5 | §2.6② `:183` 拟文改纯现行句（删「原…句退场」对照语——沿革留 `:282` 记录面） | 批档 `:143` |
| 6 | §2.6④ 三 bullet + §2.9② 对齐落定事实（**增 6 + 换 1**；「= 删」⇒「= 退役行替换为 `providerStatus`」；上抛②随之落定） | 批档 `:157-159 ∕ :197` |
| 7 | `SETTINGS.md:437-438` 计数收正——「8 站点」⇒「19 站点 = 既有 9 ＋本批接入 10」（`:198` 补列 + 本批 10 新站枚举）；助手坐标收正（`:300-303`⇒`:309-312`） | `docs/vsc/design/SETTINGS.md:437-438` |
| 8 | 批档指针按现盘复核：边界③ ∕ §2.9 观察 `:453-455`⇒`:455-457`；重锚腿② `:435-436`⇒`:437-438`（+ ③ 注记「8 站点」∕ 旧坐标随终态收正） | 批档 `:59 ∕ :199 ∥ :68` |
| 9 | §2.7 行 13 补体量预估（≈250–350 行）+ 组界（#695 ∥ #701——超 300 即拆） | 批档 `:177` |
| 10 | `settings.mjs:276-287` 归属实读 = `deleteProviderKey`（自定义渠道清理）；代理「空 uri ⇒ 删键」实位 = `settings.mjs:231`；逐处收正（原 `:276-287` ∕ `:279-280`） | `docs/vsc/design/SETTINGS.md:130 ∕ :133 ∕ :456` |
| 11 | `WEBVIEW.md:116` 实读 = 表行（TUI F6 → F-W3——无保留标记）⇒ 补入零改名单 | 批档 `:135` |

**读回（D6 · 修复轮末）**：① 上列落点逐处读回在位（行宽：`SETTINGS.md:437`=273 ∕ `:438`=289 ∕ 变更记录=295——均 <300）；② 残量复查：批档「不进发射面 ∕ `:453-455` ∕ `435-436`」仅余 §3 评审原文（不改）；`SETTINGS.md`「8 站点 ∕ `:276-287` ∕ `:279-280` ∕ `:300-303`」仅余记录面（`:599` 沿革 + `:632` 本次变更记录）；`SETTINGS-TOOL.md`「拟新增」仅余 `:128` 基准注引述 + 记录面 `:173 ∕ :176 ∕ :177`；③ `node scripts/doc-check.mjs` 复跑（after 日志 = `.thincoder/tmp/vsc-cleanup-doccheck-after.txt`）：悬空 88⇒88 ∕ 拟新增 44⇒44 ∕ 迁移期引文 297⇒297 ∕ 本批两设计档零新增红（行宽总 198⇒203——+5 全在 `docs/desktop/design/PROJECT.md` ∥ `RENDERER.md` = 他批并发写入面，非本波肇因）。

**随修上报（非本批射程——只报）**：① `thincoder-vscode/AGENTS.md:109`「八站点汇聚」携 finding 7 同款计数（现盘 9、本批后终值 19）——产品文本面（父侧笔）；② `WEBVIEW-PROTOCOL.md:102 ∕ :417` 携「8 站点」字面与旧坐标（`:302` ∕ `:358`）——重锚腿 ③ 面（已注记，随终态收正）；③ `docs/vsc/design/VSC-DEBT.md:654` file-tier-sweep 登记块 `settings.mjs` 区间坐标与现盘不符（代理段现位 `:219-238`）——域外档只报；④ `SETTINGS.md:485` 登记读数 359（as-of 09-29）vs 现盘 368——批间漂移（阈值判定不受影响；随该档下次触碰刷新）；⑤ `SETTINGS-TOOL.md:128` 基准注「标「拟新增」者 = …」——标记面清空后读法引述悬空，随该档下次触碰收正。

**边界（本轮）**：产品码零触（仅实读）；§1 ∕ §4 ∕ §5 ∕ §6 零动；五设计裁定不动；验收腿 ∕ 重锚腿 ∕ 边界三条结构零改（定点改写）；无新语义（= §3 十一发现 + 父侧裁定的直接导出；同族残标 `:43` ∕ 指针复核 = 一致性面当场修、逐处上报）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（首轮）· 发现表**

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 一致性（判据 ∕ 验收） | 🔴 | 同一站的发射行为两处相斥：改法行 8 规定 `:32` 站「自定义渠道清理 = 次级写——**不进发射面**」（`thincoder/docs/batches/2026-09-30-vsc-cleanup.md:49`），而 T1 要求「**10 新站点** × 冲突注入 ⇒ **各恰一条** `providerError`」（同档 `:59`）、§2.7 行 1 记「10 站点接线」（`:162`）、现状表 ④ 把 `:29 ∕ :32` 同列「补契约 + 接线」（`:36`）——按行 8 实施则 T1 对 `:32` 格必红，按 T1 实施则行 8 括注失实（同机制两写，不降级）。 | 二选一并全表对齐：`:32` 接入发射 ⇒ 删「不进发射面」括注（保留「次级写」说明）；`:32` 不发射 ⇒ 站点计数与 T1 期望改 9（或写明显式豁免格），并同步 §2.7 行 1 措辞。 |
| 2 | 清晰性 | 🟡 | scope 归属句与改法表相抵 ∕ 指代不明：`:52`「shell ∕ proxy → `env`」与 `:46`（proxy 站 `:92`）「providers」并存，且「proxy」与「provider-proxy」两名同段未指认各自对应站——十站表内无 env 归属的新 proxy 站（既有 env 发射点 = `:198`，见 `:34`）。 | 逐项标注每个名字指向的站（或注明「proxy」指既有 `:198` 站、非本批站），使 scope 句与改法行 4 单义一致。 |
| 3 | 受影响文件尺寸注记 | 🟡 | 越线档缺拆分复核注记：§2.7 行 2（`settings.mjs` 368→≈376）与行 7（`chat-panel.mjs` 432→≈438）均越 300 行建议线而无复核行，同表行 10 对 303 行的 `panel-turn-loop.mjs` 则有「审视 = 不拆（增量小）；触发 = 触碰后重评」（`:163 ∕ :168 ∕ :171`）；`settings.mjs` 的在册计划（`docs/vsc/design/SETTINGS.md:485-488`：阈值 450 ∕ 下次结构改动）未被本表引用。 | 两行各补拆分复核（结论 + 触发阈值 + 到期条件）；`settings.mjs` 行引在册计划并说明 +≈8 是否触「结构改动」；`chat-panel.mjs`（全批最大、逼近 450 阈）同式登记。 |
| 4 | 文档卫生 | 🟡 | 失效标记留规范面：`docs/core/design/SETTINGS-TOOL.md:111`（D-ST15 决策行）与 `:138`（§5 测试档行）仍携「拟新增」——与本案自述「「拟新增」收正为『已随 #677 落批内件』」（`:83`）及机检腿「「拟新增」裸标零残留」（`:87`）不符；`:138` 又把该档并入「三档均随测试树全清退役」，与「已落批内件」并存未区分载体（树内档 ∕ 批内件）。 | 删失效标记（`:111` 去「拟新增——」；`:138` 改「已落批内件（#677）；单测树重建时回迁」并区分载体）；沿革留变更记录（`SETTINGS-TOOL.md:176` 已载）；机检腿措辞按实况收正。 |
| 5 | 文档卫生 | 🟡 | 拟文携旧句尸骸：§2.6② 对 `TESTING.md:183` 的拟文含「原「设计面 = 待重做（另轮）」句退场」（`…vsc-cleanup.md:140`）——修订式对照语若逐字落笔即留规范面，而沿革已由同段自设的 `:282` 变更记录条（`:142`）承载。 | 拟文改为纯现行句（「…无第二设计档；本节验收依据 = 本节内联判据…」），删「原…句退场」括语；沿革留 `:282` 变更记录。 |
| 6 | 协调项 | 🟡 | C39「7 字段 + `providerError` 补」的源枚举未在册（`…vsc-cleanup.md:156 ∕ :194`），且候选域七项内含 `providerError`、与 ④ 另立「补 `providerError` 行」并存 ⇒ 口径（含 ∕ 不含）未定，④ 的落笔依赖该清单。 | 先定 7 字段口径与清单（或明示 = 候选七项 ∕ 七项之外另加 `providerError`），④ 拟文随清单定稿同笔。 |
| 7 | 文档状态 | 🟡 | 跨档计数滞后：`docs/vsc/design/SETTINGS.md:437`「（8 站点统一助手）」与本案实读「发射点 = 9（含 `:198`）」（`…vsc-cleanup.md:34 ∕ :65`）不符——已并入重锚腿但尚未收正。 | 重锚腿落地时把 §2.15 extension 面句与站点表按「既有 9 + 本批 10」的终值一并收正，勿留「8」字面。 |
| 8 | 数值漂移 | 🔵 | 指针偏差：`:65` ②引「`SETTINGS.md` §2.15 extension 面句 + 站点表（`:435-436`）」，现盘该句在 `SETTINGS.md:437-438`；`:56` ③引「`SETTINGS.md` §3 `:453-455`」，现盘该条为 `:455-457`（含 §2.4 自笔 +3 行造成的下移）。 | 重锚腿落地前按现盘复核本批全部指针。 |
| 9 | 注记 | 🔵 | 批内件体量未估：§2.7 行 13（`:174`）仅「拟新增」——#695（十站 × 冲突 + 负控）+ #701（T1–T7）合一档，逼近 300 行建议线的可能不低。 | 拟增时给出预估行数与组边界（如按 #695 ∕ #701 两组分档、超线即拆）。 |
| 10 | 一致性（未核） | 🔵 | 坐标重叠待核（unverified——本轮未读码）：行 8 链把 `settings.mjs:276-287` 用作自定义渠道清理链（`:49`），而 `SETTINGS.md:130` 把同区段记为代理「空 uri ⇒ 删键」语义落点——同区段两机制名并存，未证其实。 | 实施轮实读该区段函数归属后逐处收正坐标（或确认两机制同函数）。 |
| 11 | 覆盖面（未核） | 🔵 | §2.6①B 行枚举不全（unverified——`WEBVIEW.md` 本轮读取范围外）：替换表（`:116-131`）+「零改」名单（`:132`）合计覆盖 `:115-137` 中 22 行，`:116` 两边均未列——「§4 全表」的声称与枚举差一格。 | 落笔前逐行实读确认 `:116` 是否行（若为行，补入替换表 ∕ 零改名单）。 |

计数：🔴 1 · 🟡 6 · 🔵 4（共 11 条）。
限界：未声明项目标准档与文档地图 ⇒ 方法论合规与文档归属两项按 `AGENTS.md` 与在阅三档判定；`WEBVIEW.md` ∕ `TESTING.md` ∕ `PORTABILITY.md` ∕ `thincoder-vscode/AGENTS.md` ∕ 代码面文件均在本轮读取范围外——涉及其的读数为本案自述、未独立复核（表中标 unverified 者按此）。
已核两项：`SETTINGS-TOOL.md` 读回 176 行 ∕ `SETTINGS.md` 读回 631 行（与 §2.7 行 11 ∕ 行 12 读数相符）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审（修复轮后复核 · 轮 2）· 逐条核验表（§3 轮次 1 十一条 ⇄ 现盘）＋新问题**

（口径：认领表为历史快照——现盘实况 = 修复轮 1 全落（§2.10 `:207-229` 逐处读回 ＋ §4 放行在案）；逐条按现盘判定。）

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | thincoder/docs/batches/2026-09-30-vsc-cleanup.md | 🔴 | Fixed | 改法行 8（`:52`）定形 = 接入发射：「站点捕获 + 发射；自定义渠道清理 = 次级写」（「不进发射面」已删）；与 T1（`:62`「10 新站点 × 冲突注入 ⇒ 各恰一条」）∥ §2.7 行 1（`:165`「+≈16（10 站点接线）」）∥ 现状表 ④（`:39`）全表一致 ⇒ 🔴 消解。 |
| 2 | 2 | 同上 | 🟡 | Fixed | `:55` 逐名标站：「「proxy」= 既有 env 站 `:198`（proxy 写面——P2-5 已接，非本批新站）→ `env`」；provider-proxy（新站 `:92`）∥ provider-key（新站 `:29 ∕ :32`）→ `providers`——与改法行 4 单义、无相抵。 |
| 3 | 3 | 同上 | 🟡 | Fixed | `:166`（行 2）：复核结论 = 不拆 +「在册拆分计划 = `docs/vsc/design/SETTINGS.md:485-488`（阈值 450 ∕ 结构改动——先到即拆）」+ 到期条件；`:171`（行 7）：复核结论 = 不拆 +「触发 = 触碰时复核（`docs/vsc/design/VSC-DEBT.md` §12.1 单源——本批已复核）＋阈值 450 行 ∕ 该档下次结构改动（先到即拆）」+ 到期条件——与行 10 同式。 |
| 4 | 4 | thincoder/docs/core/design/SETTINGS-TOOL.md | 🟡 | Fixed | `:111` ∕ `:138` 残标实删（`:111` 现「已落批内件（#677）：`docs/batches/2026-09-30-crossline-clearance.test.mjs` 遮蔽面格；单测树重建时回迁该档形」；`:138` 现「树内两档随测试树全清退役（2026-09-28）＋遮蔽面档 = 批内件（树内零落）；单测树重建时回迁」）；同族 `:43` 随修；批档机检腿（`:90`）按实况收正（余 = `:128` 基准注引述 + 记录面 `:173 ∕ :176 ∕ :177`）；沿革落 `:177` 变更记录行。 |
| 5 | 5 | thincoder/docs/batches/2026-09-30-vsc-cleanup.md | 🟡 | Fixed | `:143` 拟文成纯现行句：「终端程序自动验证面无第二设计档（2026-09-30 · #677 收正）；本节验收依据 = 本节内联判据（§6.2）+ 能力面判定句（`TOOLS.md` §4.7）。」——「原「设计面 = 待重做（另轮）」句退场」对照语已删；沿革留 `:145` 记录面条。 |
| 6 | 6 | 同上 | 🟡 | Fixed | 口径落定并三处对齐：§1 `:9`「计数归一 = 增 6 + 换 1（「7 字段」实指落定）」＋「`providerInfo` 行处置 = 退役行替换为 `providerStatus`」；§2.6④ `:157-159` 三 bullet 随对齐；§2.9② `:197`「上抛②（已回 · 2026-10-01 00:1x）：#705-④ C39「7 字段」口径落定 = 增 6 + 换 1」——协调项闭合（AGENTS.md 实笔在档外，未独立复核）。 |
| 7 | 7 | thincoder/docs/vsc/design/SETTINGS.md | 🟡 | Fixed | `:437` 现「**19 站点**统一助手——既有 9（含 P2-5 `:198`）＋本批接入 10」；`:438` 站点表补齐（既有 9 ∕ 本批 10 逐站枚举）；变更记录 `:632`「§2.15 计数收正（「8 站点」⇒ 19 = 既有 9 ＋本批接入 10）」——设计面「8 站点」字面零残留。 |
| 8 | 8 | thincoder/docs/batches/2026-09-30-vsc-cleanup.md | 🔵 | Fixed | 重锚腿②（`:68`）已作「`:437-438`」（+ 注「计数句已随修复轮 1 收正为「既有 9 + 本批 10 ⇒ 19」」）；边界③（`:59`）与 §2.9 观察（`:199`）已作「`:455-457`」——与现盘一致。 |
| 9 | 9 | 同上 | 🔵 | Fixed | `:177`（行 13）补「体量预估 ≈250–350 行；组界 = #695 组（T1–T4）∥ #701 组（T1–T7）——超 300 即按组拆两档」。 |
| 10 | 10 | thincoder/docs/vsc/design/SETTINGS.md | 🔵 | Fixed | `:130` ∕ `:133` ∕ `:456` 删除语义坐标统一重锚至 `settings.mjs:231`（代理「空 uri ⇒ 删键」）；批档行 8 链 `settings.mjs:276-287` 归 `deleteProviderKey`（§2.10 ⑩ 实读）——两处机制名不再叠指同区段（代码面读数未独立复核）。 |
| 11 | 11 | thincoder/docs/batches/2026-09-30-vsc-cleanup.md | 🔵 | Fixed | `:135` 零改名单补入 `:116`：「（`:116` 为修复轮 1 逐行实读补入——F6 行无保留标记）」——`:115-137` 全 23 行闭合（16 替换 + 7 零改）。 |
| 12 | (new) | 同上 | 🔵 | New（数值漂移 · 非阻塞） | §2.7 行数账滞一：`:175`「\| 11 \| `docs/core/design/SETTINGS-TOOL.md` \| 175 \| **已落**（**176**——三处 + 变更记录行；落盘实测） \| #698 \|」vs 现盘 SETTINGS-TOOL.md 读回至 `:177`（新变更记录行——§2.10 ⑷ 亦已引 `:177`）；`:176`「\| 12 \| `docs/vsc/design/SETTINGS.md` \| 628 \| **已落**（+3——§2.4 第二源句 + 变更记录行 + 空行） \| #701 \|」vs 现盘 SETTINGS.md 读回至 `:632`（§4 抽核亦引「变更记录 `:632` ✓」）——修复轮两档各 +1 行未回填行数账（修法 = Δ 收正为 177 ∕ +4）。 |

计数：🔴 0 · 🟡 0 · 🔵 1（新——非阻塞）；旧 11 条全数核销（11 ∕ 11 Fixed）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-01 00:2x · [代签 · 承用户令]**

用户 2026-09-30 23:42「实活都做了」∥ 23:44「别的也不该等」= 全线点火令。本批评审 = **changes-required**（§3 轮次 1：🔴1 · 🟡6 · 🔵4 = 11 条）+ 修复轮十一条全落（§2.10 `:207-229`，逐处读回 ✓；父侧抽核两处：`SETTINGS.md:437-438` 计数终值「**19 站点 = 既有 9 + 本批 10**」✓ ∥ 变更记录 `:632` ✓）⇒ 🔴 消解确认（`:32` 定形 = 接入发射 ∥ 全表对齐）⇒ 按令**代签放行**——实施舱按 §2 受影表派出（10 新站点 + #701 两件）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（批内件 30/30 绿（先红后绿）· 偏离审计 1 轮 + 代码评审 1 轮 pass · fix 轮 1 · 终态 clean）

（实施轮 · eng-coder · 2026-10-01 · 按 §2 + §2.10 修复块直做——实读即取；受影面 = §2.7 行 1 ∕ 2 ∕ 4 ∕ 5 ∕ 6 ∕ 7 ∕ 9 ∕ 10 + 批内件（行 13，按组拆档）；行 3 ∕ 行 8 ±0 零触。）

### 实施摘要（8 改档 + 2 新档 = 批内件）

- **#695 面①（10 站接入发射）**：`thincoder-vscode/src/extension/panel-messages-settings.mjs` 十站——`:219-223` shell（`env`）· `:128-132 ∕ :135-138` websearch save ∕ delete（`tools`）· `:106-110` provider-proxy（`providers`）· `:116-119 ∕ :122-125` embed save ∕ delete（`tools`）· `:29-32 ∕ :35-38` provider-key save ∕ delete（`providers`）· `:41-45 ∕ :48-52` mcp save ∕ delete（`mcp`）；各站 = `const err = …; if (err) postProviderError(panel, <scope>, err)` + 原回推行保留。
  契约链穿透（逐环）：`settings.mjs:109-118`（`handleSetProviderProxy` 返 `conflictError`）· `:177-194`（websearch 两函数）· `:268-275 ∕ :277-289`（provider-key——主写穿透 ∕ custom 清理次级写不叠回）· `presets.mjs:42-52`（`storeProviderKey` ∕ `removeProviderKey` 返核串）· `panel-settings-push.mjs:25-35`（穿透返回）· `panel-index.mjs:102-120`（`saveEmbeddingConfig` 两分支捕获——失败早返、不触运行态缓存）。
- **#695 面②（单点收口）**：`thincoder-vscode/src/extension/chat-panel.mjs:35-42` 新 `reportHandlerError(panel, e)`（`console.error` 保留 + `{scope:"panel", reason:首行}`）+ `:205` 分发表 `.catch((e) => reportHandlerError(this, e))`。
- **#701（装配面第二源）**：`thincoder-vscode/src/config-mcp.mjs:76-104` 新 `assemblyMcpServers(cwd)`（单层发现（零上溯）· config 同名优先 ∕ 异名追加 · `mcpServers` 数组形跳过+记录 · 条目 `{name, ...server}` · 读 ∕ 解析失败非致命 · 非变异（零回写）· `cwd` 空 ∕ 非串零读零并入）；`thincoder-vscode/src/extension/panel-turn-loop.mjs:29 ∕ :165` ro 载荷改接。管理面（`panel-mcp.mjs` ∕ `settings.getMcpServers`）零改。
- **批内件（两档——§2.7 行 13「超 300 即按组拆两档」授权落形）**：`docs/batches/2026-09-30-vsc-cleanup-695.test.mjs`（279 行 · 23 用例 = T1 十站 + ⑧b 次级写负控 + T2 十站负控 + T3 ∕ T4）· `docs/batches/2026-09-30-vsc-cleanup-701.test.mjs`（161 行 · 7 用例 = T1–T7）。

### 测试读数（本席实跑——先红后绿 · 命令与读数逐条）

| 门 | 命令 | 读数 |
|---|---|---|
| 批内件 #695 | `node --test docs/batches/2026-09-30-vsc-cleanup-695.test.mjs` | 红态 = T1 十一腿 + T3 全红（实读「0 ≠ 1」= 零发射）；实现后 **23 pass / 0 fail** |
| 批内件 #701 | `node --test docs/batches/2026-09-30-vsc-cleanup-701.test.mjs` | 红态 = 7 ∕ 7 红（新导出缺席）；实现后 **7 pass / 0 fail** |
| 语法 | `node --check`（8 产品档 + 2 批内件） | 全过 |
| 仓套件 | **未跑**（任务书：收口轮父侧恰跑一次） | — |

行数实测（内容行口径）：`panel-messages-settings.mjs` 237（§2.7 行 1 估 +≈16 → 实测 +31——差由逐站多行形 + 注记行）· `settings.mjs` 371（估 +≈8 → 实测 +3）· `panel-index.mjs` 242 · `presets.mjs` 198 · `panel-settings-push.mjs` 121 · `chat-panel.mjs` 441（估 +≈6 → 实测 +9）· `config-mcp.mjs` 104（估 +≈28 → 实测 +32）· `panel-turn-loop.mjs` 303（估 +≈2 → 实测 ±0）；批内件 279 ∕ 161（单档均 <300）。

### 决策透明表（设计未述处的实现裁定——均已在代码注释 ∕ 件内注明）

| # | 事项 | 裁定与依据 |
|---|---|---|
| 1 | 站⑨ T1 冲突注入位（add→update 回退链） | `settings.saveMcpServer` 新条目分支：add 冲突串被 update 回退替换为 not-found 串（链既有形态、非本批引入）⇒ 按 §2.2「Proxy 按各站写入体选位」注入到链内可达冲突的写（既有条目 ⇒ update 分支）；档头显式披露，残项上报（待办 1） |
| 2 | embed 两站冲突早返不触回推 | §2.2「两分支捕获 `saveEmbeddingConfigToFile(…)` 返回并 `return`」逐字 ⇒ 失败不触 `resetEmbedder` ∕ `setVSCodeEmbedder` ∕ `_pushSettings`（防盘 ∕ 内存分叉） |
| 3 | 冲突注入两式（批内件） | vscPersistRaw 各站 = **窗内外部写**（#675 先例：`persistRaw` 边界包装，armed 时在真实写窗口落对端写——走核真 mtime 检测）；核内直持执行体两站（`setProviderKey` ∕ `removeProviderKeyFromConfig`，模块边界不可达）= **模块短接**（`conflictError({ok:false,reason:"mtime-conflict"})`——核真冲突返回值等价形）；对站点可观察面等价 |
| 4 | #695 件不设探针缝（实测收正） | 身份检查实测：裸符链解析到 realpath 身份（双实例），测试侧 `_setProbeImplForTest` 不绑定 ⇒ 撤回该缝，件内注记真实零网机制（探针链读重定向 HOME ⇒ 无渠道 ⇒ `probeProviderAdmission` 早退）；断言零依赖探针 |
| 5 | `settings.mjs:308` 注释「8 站点统一经此」未动 | 重锚腿① 已指派为实施后设计者终态收正 ⇒ 本席不触（已过面）+ 上报（待办 3） |

**受影表外改动**：无（受触 10 档逐一映射 §2.7 行 1 ∕ 2 ∕ 4 ∕ 5 ∕ 6 ∕ 7 ∕ 9 ∕ 10 ∕ 13；行 3 ∕ 行 8 未触、既有 9 站点与五裁定零触、webview ∕ 核 ∕ CLI ∕ 桌面零触）。

### 审计与代码评审轮次（终态 clean）

1. **内部 explore 偏离审计（1 轮）**：四类偏差（partial ∕ silent-simplification ∕ doc-drift ∕ out-of-list）**全 0**；十站 scope 逐站核对 ∥ 契约链逐环核对 ∥ #701 逐裁定核对 ∥ 既有 9 站点与五裁定零触 ∥ 拆档合规（281 ∕ 162 行、组界 = #695 ∥ #701）。上抛两件：§5 未写（本段消解）· 计数终态读数（面① 19 站 + 面② 1 = 20 调用点——重锚腿判，待办 3）。
2. **内部 advisor 代码评审（1 轮）**：VERDICT **pass**（🔴 0 · 🟡 3（全 optional）· 🔵 2）。🟡 = ① §5 记录空缺（本段消解）· ② 站⑨ 新条目冲突面提示串失实（设计 ∕ 验收口径缺口，非实现偏离——待办 1）· ③ 三档越 300 建议线（在册裁定不拆——待办 2）。🔵 = ① `settings.mjs:308`「8 站点」计数（重锚腿①）· ② #695 件探针缝保真（已实测收正——决策表 #4）。
3. **fix 轮 = 1**：评审 🔵② 处置（先加裸符归一 → 实测证明对探针链不绑定 → 撤回该缝并改写注记说明真实零网机制）；处置后两件复跑全绿。

### 待办登记（交父侧 ∕ 设计者；非本席笔）

1. **站⑨ 新条目冲突面残项**：新增 MCP 服务器时 mtime 冲突 ⇒ 面板显示 `No MCP server named "…"`（add 冲突串被 update 回退替换——`settings.mjs:298-302` 链既有形态）。处置二选一：登记另轮 ∕ 收窄 §2.2 T1 声称（站⑨ 限 update 分支）。建议随该链下次触碰统一裁定。
2. **300 线档位补记**：`settings.mjs` 371 · `chat-panel.mjs` 441（贴 450 触发阈）· `panel-turn-loop.mjs` 303——本批均不拆（在册阈值 450 ∕ 下次结构改动先到即拆）；panel-turn-loop 的「触碰后重评」结论 = 不拆（增量 = 单行改接 + import 换指）。
3. **重锚腿（设计者面）**：`settings.mjs:308` 注释「8 站点」⇒ 终值（全调用点读数 = 20；面① 枚举口径 = 19）；`docs/vsc/design/WEBVIEW-PROTOCOL.md:102 ∕ :417` ∥ `thincoder-vscode/AGENTS.md:109`「8 站点 ∕ 八站点」字面随终态一并收正。

## §6 验证与收口（父代理）

**交付核验（逐面）**：#695 面① = 10 新站点接入（闭集终值 **19 = 既有 9 + 本批 10**；批内件 `docs/batches/2026-09-30-vsc-cleanup-695.test.mjs` **23/0** 先红后绿）✓ ∥ 面② = `chat-panel.mjs:38-42 ∥ :205` 分发单点 ✓ ∥ #701 = `assemblyMcpServers` + `panel-turn-loop.mjs:165` 改接（批内件 `-701.test.mjs` **7/7** 先红后绿）✓ ∥ 受影表外改动 = 无（舱自核）✓。父侧抽核：站点实点读数 = **19**（`panel-mcp.mjs` ×4 + `panel-messages-settings.mjs` ×15——`grep` 实读）✓。

**收口轮随办（就地落 · 父侧直接执行）**：重锚腿三处字面随终值收正——`thincoder-vscode/src/extension/settings.mjs:308`（「8 站点」⇒ **19**）∥ `docs/vsc/design/WEBVIEW-PROTOCOL.md:102 ∥ :417`（「8 站点」⇒ 19 + 坐标 `:302 ⇒ :311` + 分布 ×4/×15）∥ `thincoder-vscode/AGENTS.md:109`（同）。

**台账/移交**：站⑨ MCP 新增冲突面残项（add 冲突串被 update 回退替换 ⇒ 显示 `No MCP server named …`——链既有形态、非本批引入）⇒ 入台账（技术待办）；300 线三档（`settings.mjs` 371 ∥ `chat-panel.mjs` 441 ∥ `panel-turn-loop.mjs` 303）= 在册裁定不拆（舱「触碰后重评」结论在册）；受影表行数账（+31 ∥ +9 ∥ +32）= §5 实测行在册。

**暂缓批复核：无**。
