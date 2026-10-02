# 2026-10-02 · desktop-ux-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-02 · 来源 = 用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #801（D35 右栏滚动）∥ #702（_mcpWarnings 消费）∥ #697（P1 读数端面消费）。
> 台账 = #801 ∥ #702 ∥ #697（桌面 UX 收尾 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-02 17:44「需求和待办赶紧开批」+ 台账 #801（D35 右栏滚动）∥ #702（`_mcpWarnings` 消费）∥ #697（P1 读数端面消费）。

**设计轮落定核读 + 上抛处置（2026-10-02 18:1x · 父侧）**：三件定形 ✓——**#801 = 复现先行**（四探针未复现硬失效：60 块溢出夹具 `max=1697` 下真滚轮 ∥ 程序化 ∥ 旗标全绿、帧密同绿；唯一确认 = 内容区首拍截留 = 让位三律既定语义——**不判缺陷**；设计 = 腿 A 合成机检 + 腿 B 真机活跃风暴；FAIL ⇒ 按映射修 ∥ PASS ⇒ 证据收口不造机制）；**#702 = 建议①补消费**（装配尾入 `_pendingReminders`，CLI 同形；否②③——F7-3 与无豁免依据；桌面临时详文在批档 §2——SETTINGS.md 冻结中，解冻后回填）；**#697 = 双面定形**（桌面 `readIndexCounts` +2 键 ∥ VSC `pushIndexStatus` +2；刷新拍 = 既有索引读数拍；KD-69）。落点读回 ✓（`ACTIVITY.md:86-99` + `:441` ∥ `PROJECT.md:121/:123/:1700` ∥ `MCP.md:85/:213` ∥ VSC `SETTINGS.md:58/:551`）；**#820 冻结面零触** ✓。**上抛处置**：① 需求侧回指收正（`requirements/ACTIVITY.md` D35 行）＝ 父侧笔（即落）；② SETTINGS.md 回填 = 候 #820 解冻（在册）；③ VSC `_mcpWarnings` 端差 = **在册新行**（端差面）；④ KD-69/70 已占取（后续取 71+）；⑤ §1 = 本段。**候用户点火评审**。

**授权（2026-10-02 19:30 · 用户「全自动」）**：本批转**全链自动**（代点火 ∥ 修正派发 ∥ §4 代签 ∥ 实施派发 ∥ 收口核销——自缚三条：① 代签仅当三条件齐备；② 新范围 ∥ 口径裁决 ⇒ 停；③ 破坏性/不可逆 ⇒ 停）。**设计评审代点火中**（报告到达 ⇒ 裁定 → 修正（如有）→ 代签 → 实施 → 核验 → 收口；#801 真机腿 = 候用户走查读数）。

**评审 #21（轮 1）= pass**（🔴0 ∥ 🟡3 ∥ 🔵4——§3 在册）；**全修于本轮（父侧笔 · 可 revert）**：① 🟡 `PROJECT.md:868` D35 状态句收正（设计面 = 本批注）+ `ACTIVITY.md` §5 补 D35 行；② 🟡 §6.1 本批块（`:936-938`——需求/台账回指 ∥ 机检/真机面 ∥ 离线不可产面句）；③ 🟡 `ACTIVITY.md` §4.2 本批块（四源档「现行 ⇒ 预期」291/67/242/398 + 贴层注）；④ 🔵 复现判据三处钉定（腿 B ×3 拍 ∥ 闭合面/证据坐标 ∥ 腿 A FAIL 支）；⑤⑥ 🔵 KD-70 两坐标注 + 词面载体/语言口径注；⑦ 🔵 BY 互指（`:99`——#563②）。**§4 代签 + 实施派发（eng-coder——#702/#697/#801）。**

**实施轮核读（父侧 · 2026-10-02 20:1x）**：三件落笔实读——`agent-host.mjs` = **298**（装载后入队）∥ `agent-assemble.mjs` = **142**（KD-70 词面构造——**agent-host 贴 300 零余量 ⇒ 同轮拆分窗兑现**，装配尾入队语义不变）∥ `index-status.mjs` = **72**（`dbBytes`/`origins` 透传——注释/返回形双证）；批内件 **6/6 绿**（父侧复跑）；**腿 B 真机 PASS**（24 块风暴 ∥ `scrollTop` 404 ⇒ 0 ∥ `_poolPin=false`——**不造机制、产品码零改**）；门 = 本批面 added **0**（净减为他批并行）。**证据固化** = 腿 B 读数（`legB-readings.json`）+ 探针件已拷入 `docs/batches/`（父侧笔 · 可 revert）。**受理**：探针首版真库误触 = 已核无损（`user_version=10` 零迁移——受理在案）。**回填/随动轮已派发**（`#29`——四族设计漂移 + §2.5 补三档）；**§6 = 回填轮核验后**。

**回填轮（#29）核讫 + 收口补充轮派发（#31）**：四族全落（`IPC.md:136` 键集 ∥ `MCP.md:85` 已落形 ∥ 行数表 7 行 ∥ `vsc SETTINGS.md:58` 坐标）——**行数面机检 8 ⇒ 0**；§2.5 补记在册（三档 + 越 300 判定句）；变更行 6/6。**报备三开放项 = 收口补充轮派发**（① `PROJECT.md` §4.1 三值随正 ∥ ② 桌面 `SETTINGS.md` KD-69 详文回填（解冻兑付）∥ ③ `vsc SETTINGS.md` §2.5 句回填）；**§6 = 补充轮核验后**。

**收口补充轮（#31）核讫（2026-10-02 20:3x）**：三处全落——`PROJECT.md` §4.1 三值随正（i18n **408** ∥ i18n-views **374** ∥ settings.mjs **325** ✓）∥ 桌面 `SETTINGS.md` §2.13「P1 读数端面消费批注」（KD-69 详文回填——两读 spec 四件齐）∥ `vsc SETTINGS.md` §2.5 定形值（两键两语同值）；**追加小修** = `SETTINGS.md:349` 三枚短形齐收（实核与报备差已明——三枚皆悬空）；变更行 3/3。**上抛处置**：① `SETTINGS.md:216` 族 5 枚 = 归清账轮 4–6 面（在册）；② **dist 树 walk 疑云 = 本刻取证**（SKIP 面 ∥ 构建产物树——若证实引擎扫进构建副本 ⇒ 工程面随正，挂本轮）；③ KD-69 ⑤ 未来式 = **已随正**（父侧笔 · 可 revert——「随解冻触点回填」⇒「已回填 §2.13」）。**§6 = 取证毕即落**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-10-02 · 三件定形（#801 复现判据 ∥ #702 补消费裁定 = KD-70 ∥ #697 双面 = KD-69）；设计落点 = PROJECT.md §2 ∥ ACTIVITY.md §2 ∥ core MCP.md §6.4 ∥ vsc SETTINGS.md §2.5）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次**：桌面 UX 收尾批（三件并批 · 轮 = initial）· 设计完成 2026-10-02
**依据**：派发简报（本批三件 + 要点 ∥ 禁止范围）∥ 台账 #801 ∥ #702 ∥ #697（三行 evidence 届盘实读）∥ 需求卷 D35（`docs/desktop/requirements/ACTIVITY.md`——#801 需求侧回指核对：**在**）。**注**：§1 现为模板占位（讨论文本未落）——本段按派发简报 + 台账执行；§1 补记归主 agent。

### 2.1 本批条目（覆盖 · 三件）

| 项 | 来源 | 本批做 | 不做（边界） |
|---|---|---|---|
| A · #801 右栏池极多实例可滚动 | 需求 D35（用户 2026-10-01 18:13） | 实读结论（探针 3–5）∥ 复现判据（腿 A 合成 · 腿 B 真机）∥ 候选映射 ∥ 收口规则 | 块内容区滚动语义（让位三律）零动 ∥ VSC 零触 ∥ **无复现不新增机制** |
| B · #702 `_mcpWarnings` 桌面消费 | 台账 #702（三径待裁） | **裁定 = ① 补消费**（最小形 = 装配后入 `_pendingReminders`；CLI 同形；指路桌面可达出口） | VSC 第三面（列报）∥ `.mcp.json` ∥ 连接 ∥ 管理面零触 ∥ 不收窄 MCP.md 句 |
| C · #697 P1 读数端面消费 | 台账 #697（双面） | 桌面 ∥ VSC 双面（`dbBytes` + 逐 origin 行数上屏；刷新拍 = 既有索引读数拍） | 常驻状态栏段（段集闭集）∥ 端侧直读核内表（不授权）∥ 新通道 ∥ 新计时器 |

### 2.2 #801 设计——定形 = `docs/desktop/design/ACTIVITY.md` §2「本批注（右栏池极多实例可滚动 · D35）」

**实读结论（设计轮 · 隔离实例真跑探针）**：① 滚动容器链完好——60 块溢出夹具（`max=1697`）下真滚轮 ∥ 程序化写位 ∥ `_poolPin` 随动全数生效；② 帧密（20ms 帧泵）同绿——钉底竞态类未复现；③ 唯一确认行为面 = 内容区首拍截留（= 让位三律既定语义——不判缺陷、不改）；④ 全屏层覆盖 ⇒ 滚轮全吞（配置态不应在场）。**⇒ 本批第一动作 = 复现（腿 A/B），非改码。**

**复现判据**：腿 A（合成 · 机检）= 60 块两臂 ⇒ 溢出成立 ∧ 上滚 ×3 三拍内必动 ∧ `_poolPin` 翻假 ∧ 程序化写位；腿 B（真机 · 活跃风暴 ≥6 在飞）真滚轮上滚 N 拍 ⇒ `scrollTop` 减 ∧ `_poolPin=false`。**收口规则**：腿 B FAIL ⇒ 按映射修（覆盖层 ⇒ 该层退场保证；钉底类 ⇒ 池 `createPinWatch` 手势门对齐 600ms 族；其余 ⇒ 现场归因上抛）；腿 B PASS ⇒ 两腿证据收口 + 用户面复验，不造机制。
**验收（对照 D35）**：腿 A 全绿（机检）+ 腿 B 读数落档 + 两径证据固化；探针件 = `.thincoder/tmp/pool-scroll-probe{3,4,5}.mjs`（PASS ∥ FAIL 两径随实施轮固化入批内件 ∕ 探针件）。

### 2.3 #702 设计——决策 = `docs/desktop/design/PROJECT.md` §2 **KD-70**（核句同拍 = `docs/core/design/MCP.md` §6.4——已落）

**三径裁定（含理由）**：**① 补消费**——落点 = `thincoder-desktop/src/main/agent-host.mjs` `assembleAndLoad`（装配尾）：`agent._mcpWarnings` 非空 ⇒ 按 CLI 同形构造提醒入 `agent._pendingReminders`（核消费 = `thincoder-core/agent/setup.mjs:170-174` 下一条 user 消息注入；装配一次推送一次——同 key 复用不重推）。词面 = 首两段逐字同 CLI（`thincoder-cli/src/command-interactive.mjs:151-155`）+ 末行指路 = 桌面可达出口（设置面 MCP 段重连——`/mcp connect` 桌面不存在，逐字照搬即误导）。
**否 ② 收窄 MCP.md 句**：把桌面用户不可见固化成条文——用户可见端差 = 缺陷（F7-3 收窄律），无宿主能力例外实证。**否 ③ 认账不排期**：静默失败面不认账（无豁免依据；#691 批评审第 3 条同判）。
**验收**：批内件——假装配（`_mcpWarnings` 非空）⇒ `_pendingReminders` 含提醒（首行逐字断言）+ 零警告负控（零写）；真机腿 = 配假 server 开项目 ⇒ 会话内提醒在场（D16 义务）。

### 2.4 #697 设计——决策 = PROJECT.md §2 **KD-69**；VSC 落点 = `docs/vsc/design/SETTINGS.md` §2.5（已落）；桌面详文 = 批档本段（入档待 `SETTINGS.md` 解冻回填）

**桌面**：`readIndexCounts` 回执扩 `dbBytes` ∥ `origins`（`thincoder-desktop/src/main/index-status.mjs:31-44`——核出口透传，端侧零 SQL 保持）+ 设置面「工具与服务」段增两读（库大小行 ∥ 逐 origin 行数行）。
**VSC**：`pushIndexStatus` 载荷 +2 键（`panel-index.mjs:43-56`）+ `#index-status` 区增两读（`settings-tools.js` `renderIndexStatus` 族）。
**刷新拍** = 与既有索引读数同拍（设置面加载 ∥ 构建后推送——零新通道 ∥ 零新计时器）；**形 ∥ 词键 = 实施轮定形**。
**验收**：桌面机检两腿——`readIndexCounts` 夹具 ⇒ 两键同值（`dbBytes` = `statSync` ∧ `origins` 逐条同值——沿核 L-③-1 口径）；渲染腿 ⇒ 回执携两键 ⇒ 两读行在场（缺位 ⇒ 零节点）；VSC 机检两腿——载荷断言 + `renderIndexStatus` 两读在场。

### 2.5 受影响文件与测试面（行数 = 设计轮实读 2026-10-02；越线档随实施轮按在册规则处置）

| 项 | 文件 | 现读 | 预期增量 | 备注 |
|---|---|---|---|---|
| B | `thincoder-desktop/src/main/agent-host.mjs` | 292 | ≤ +10 | 装配尾推送（`assembleAndLoad`） |
| C | `thincoder-desktop/src/main/index-status.mjs` | 68 | ≤ +8 | 回执 +2 键（透传） |
| C | `thincoder-desktop/renderer/mount-settings-reads.mjs` | 193 | ≤ +10 | 两键入段态 |
| C | `thincoder-desktop/renderer/views/settings-sections*.mjs`（族——落点实施轮定） | 164 ∥ 185 ∥ 182 | ≤ +30 | 两读行呈现（词键两语同增） |
| C | `thincoder-vscode/src/extension/panel-index.mjs` | 243 | ≤ +10 | 载荷 +2 键 |
| C | `thincoder-vscode/webview/settings-tools.js` | 399 | ≤ +15 | 两读行渲染 |
| C | VSC 词表 `locales/{en,zh}.json` | — | ≤ +4 | 两语同增 |
| A | 复现后按映射（候选集：`src/main/agent-host.mjs` ∥ `renderer/views/activity.mjs` 211 ∥ `views/activity-new.mjs` 114 ∥ `thincoder-render-core/scroll.mjs` 127 ∥ `renderer/{chrome,pool,core}.css`） | — | 待复现定 | **未复现 ⇒ 零改动**（探针固化即可） |
| — | 批内件（新增）= `docs/batches/2026-10-02-desktop-ux-closeout.test.mjs` | — | 新档 | B ∥ C 机检 + A 腿 A 固化 |

**测试面**：批内件 = 单元测试档（随批留存 · 不进仓套件 ∥ 不占 `test/`）；真机腿 = CDP 探针法（`reload-probe.mjs` 口径；D16 义务）；集成场景 = **无新增**（沿 50–100 预算纪律）。**文档面**：`PROJECT.md` §2（KD-69 ∥ KD-70）+ `ACTIVITY.md` §2 + `docs/core/design/MCP.md` §6.4 + `docs/vsc/design/SETTINGS.md` §2.5（四处已落）；`docs/desktop/design/SETTINGS.md`（桌面详文）——**入档待解冻回填**（#820 冻结窗）。

### 2.6 验收对照（三链同源）

| 条目 | 需求侧 | 设计面判据 | 批内件腿 |
|---|---|---|---|
| #801 | 需求卷 ACTIVITY.md **D35**「内容超高须可滚动」 | ACTIVITY.md §2 本批注（腿 A ∥ 腿 B ∥ 收口规则） | 腿 A（机检）；腿 B = 真机读数落档 |
| #702 | 台账 #702（三径待裁——本批裁定 = ①） | KD-70 + MCP.md §6.4 句 | 假装配 ∥ 零警告负控（2 腿） |
| #697 | 台账 #697（双面） | KD-69 + vsc SETTINGS §2.5 | 桌面 2 腿 ∥ VSC 2 腿 |

### 2.7 关键决策（含被否）

- **KD-69**（P1 读数端面消费——桌面 ∥ VSC）∥ **KD-70**（MCP 警告消费 = 装配后入 `_pendingReminders`）——全文 = `PROJECT.md` §2 登记行；被否候选见行内。
- #801：**复现先行**——被否：「直接改骨架 ∥ 改 flag 语义」（无复现证据 = 发明）；「内容区截留当缺陷修」（违 #518 ∥ #603 既定语义）。

### 2.8 上抛与开放项

1. **需求侧回指收正（主 agent 笔）**：需求卷 `docs/desktop/requirements/ACTIVITY.md` D35 行尾「实现形待设计（台账 #801）」⇒「实现形 = 批（设计已落——ACTIVITY.md §2 本批注）」，建议随本批收口同拍。
2. **#801 真机复现结果** = 实施轮先跑腿 B 后回填（§5）；FAIL ⇒ 按映射修 + 现场归因上抛。
3. **文档面冻结交错**：桌面 `SETTINGS.md` 在 #820 冻结窗内 ⇒ KD-69 桌面侧详文暂由本段承载，解冻后随触点回填（已登记）。
4. **VSC `_mcpWarnings` 未并**（#702 面第三端）——端差在册；是否立行 = 主 agent 裁。
5. **#801 探针件**在 `.thincoder/tmp/`（临时）——两径证据随实施轮固化；本轮探针 = 设计证据，用后由父侧清理。

### 2.5 补记（回填/随动轮 · 2026-10-02——行数 = 实施届盘实读 · 内容行数口径）

**据** = §5 逐档读数 + 行数面机检差异清单（`node scripts/doc-check.mjs`——本批 7 条）逐条对盘；**落笔后行数面差异 8 ⇒ 0**（本批 7 条全清）。**表外三档补登**（实施轮同轮落盘——各携越 300 判定句）：

| 档（表外） | 实读 | 越 300 判定 | 面 |
|---|---|---|---|
| `thincoder-desktop/src/main/settings.mjs` | **325**（320 ⇒ +5——`indexStatus()` 回执 +2 键透传） | **越 300 ⇒ 续期**（在册——`docs/desktop/design/PROJECT.md` §4.1 越层段；≤500 ✓） | #697 回执面 |
| `thincoder-desktop/renderer/i18n-views.mjs` | **374**（362 ⇒ +12——P1 两键两语 + 组注 ∕ 键面注） | **越 300 ⇒ 续期**（在册——同越层段；≤500 ✓） | #697 词面 |
| `thincoder-desktop/renderer/i18n.mjs` | **408**（404 ⇒ +4——键数链注续链（`HOST_DICT` 308 ⇒ 312）） | **越 300 ⇒ 续期**（在册——同越层段；≤500 ✓） | #697 词面 |

**B 行随正**：`thincoder-desktop/src/main/agent-host.mjs` **291 ⇒ 298**（表行 292 随正——§5 实读口径；+7 = KD-70 装配尾入队；**贴 300 层**——距线 2 行）；**同轮拆分已落**——`mcpWarningReminder` 词面构造移 `thincoder-desktop/src/main/agent-assemble.mjs`（**142**——表外档随登）。其余行实读（`index-status.mjs` 72 ∥ `settings-sections-tools.mjs` 208 ∥ `panel-index.mjs` 247 ∥ `settings-tools.js` 433 ∥ `locales` 276×2 ∥ `mount-settings-reads.mjs` 零改）= §5 逐档读数（不重录——D2）；设计表「预期增量」列由本补记齐平。

**文档面随动**（回填/随动轮）：`IPC.md` §2（`index:status` 键集收正——+`dbBytes` ∥ `origins`）· `MCP.md` §6.4（「已落」形）· `UI.md` §4.1 两行（实读对盘 + 越 300 判定句收正 + 死指针收正 + 尾括号配平）∥ `SHELL.md` §5.1 两行（实读对盘 + `recordAppend` 坐标随动 `:255-266`）∥ `docs/desktop/design/SETTINGS.md` §3.1 三行（实读对盘——判定句随正）+ `docs/vsc/design/SETTINGS.md` §2.5（坐标 `:47-61`）——逐档变更记录行在册。

### 收口补充轮补记（#31 · 2026-10-02——三处落笔 ∥ 逐处读回）

**据** = §1「回填轮（#29）核讫 + 收口补充轮派发（#31）」三开放项逐条落；逐处读回（D6）在案。**三处落笔**：

| # | 处 | 落形 | 读回 |
|---|---|---|---|
| ① | `docs/desktop/design/PROJECT.md` §4.1 越层段 | 三档读数随正——`i18n.mjs` **404 ⇒ 408** ∥ `i18n-views.mjs` **362 ⇒ 374** ∥ `src/main/settings.mjs` **320 ⇒ 325**（各携 #697 由句 + 前读链；i18n 行同笔按语义边界折行——消原 313 超宽） | 三值对盘 ✓ |
| ② | `docs/desktop/design/SETTINGS.md` | §2 增 **§2.13**（KD-69 桌面侧详文回填——解冻兑付；两读 spec = 词键 ∥ 形 ∥ 缺位零节点 ∥ 刷新拍；实施读数 = §3.1 同源不重录） | 在位 ✓ |
| ③ | `docs/vsc/design/SETTINGS.md` §2.5 | 定形值回填（词键 = `settings.indexDbSize` 整行模板 ∥ `settings.indexOriginCounts` 计数片段——两语两面同值；形 = `#index-db-size` ∥ `#index-origins` 两读——缺位隐藏；同笔折行——原 442 超宽） | 句值 = 实施定形 ✓ |

**同轮小修**（父侧追加）：桌面 `SETTINGS.md` 记录行锚收正——**实核该行三枚短形路径引用皆不可解析**（`settings.mjs` ∥ `index-status.mjs` ∥ `settings-sections-tools.mjs`——basename 多义；报备仅点名一枚）⇒ 三枚全形限定（解析形；零语义）。第二处同锚（在册——原报 `:205`）未动。

**观察（归父侧裁）**：机检锚面 basename 多义之一源 = 构建产物目录（`thincoder-desktop/dist-r3` ∥ `dist-r4`——不在引擎 SKIP 面）——本回三枚悬空之根因；扫描面是否收窄 = 工程面裁。

**变更行**：三档各 1 行。**零新语义**；产品码零触。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：桌面 UX 收尾批（#801 ∥ #702 ∥ #697）· 设计轮——评审面 = `docs/desktop/design/ACTIVITY.md` ∥ `docs/desktop/design/PROJECT.md` ∥ `docs/core/design/MCP.md` ∥ `docs/vsc/design/SETTINGS.md`（四档全读）。
**限制声明**：无文档地图 ∥ 无项目标准档 ⇒ 文档归属与方法学按 Project Guide + 档内惯例降级判；批次档（`docs/batches/2026-10-02-desktop-ux-closeout.md`）∥ 桌面 SHELL/SETTINGS 域档在评审面外——相关断言标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档状态（跨档相抵） | 🟡 | `PROJECT.md:868` 仍写「**D35 尚无设计面**——需求自注「实现形待设计」（台账 #801）；非本档缺项」，而本批已在 `ACTIVITY.md:86-101` 为 D35 建「本批注（右栏池极多实例可滚动 · D35）」设计面（实读结论 ∥ 复现判据两腿 ∥ 候选映射 ∥ 收口规则）；同批变更记录（`PROJECT.md:1700` ∥ `ACTIVITY.md:441`）亦未记此句收正——状态句与现文相抵（状态面偏差，非机制描述冲突）。 | 按现文收正 `PROJECT.md:868` 状态句（D35 设计面 = `ACTIVITY.md` §2 本批注；实现形随复现收口）∥ 于 §6.1 或 `ACTIVITY.md` §5 补 D35 判据行（机检腿 A ∥ 真机腿 B ∥ 收口规则——沿 D30 行先例）。 |
| 2 | 验收面登记 | 🟡 | 评审面内三件（#801 ∥ #702 ∥ #697）均无验收面登记：`PROJECT.md` §6.1 无本批块（先例 = 桌面二择裁定批 §6.1 块 `PROJECT.md:932-934`）、未铸用例号（最高 T-DSK59，`PROJECT.md:1028`）、#702 可见面（会话内提醒）∥ #697 设置面两读未点名机检面/真机面、亦无「离线不可产面」句（D16 义务表述先例 = `ACTIVITY.md:415`）；`ACTIVITY.md` §5/§6 无 D35 行。 | 补 §6.1 本批块（台账/D 号回指 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句 ∥ 用例号自铸披露——若铸号）；本项不涉测试档入设计线（沿「测试档随修随加」裁定——只指判据句落点）；若已随批档 §2.3/§2.4 承载 ⇒ 在设计线补指针。 |
| 3 | 文件账注解 | 🟡 | 实施轮将触碰的源档在评审面内无「现行行数 ∥ 预期增量」注解，两桌面档亦未建本批 §4.2「现行 ⇒ 预期」块（沿惯例——先例 = `ACTIVITY.md:377-386` timer 批块）：`thincoder-desktop/src/main/agent-host.mjs`（评审面最近实读 291——`ACTIVITY.md:246`，贴 300 层）∥ `thincoder-desktop/src/main/index-status.mjs` ∥ `thincoder-vscode/src/extension/panel-index.mjs` ∥ `thincoder-vscode/webview/settings-tools.js`（`docs/vsc/design/SETTINGS.md:472-475` 登记 395 行 ∥ 阈值 450 ∥ 拆分计划在册——§2.5 未给增量与阈值判定句）。 | 建本批 §4.2 块（逐档「现行 ⇒ 预期」+ 触属性 ∥ 贴层/越层判定）；`SETTINGS.md` §2.5 补 `settings-tools.js` 增量与阈值口径（触发面 = ①/② MCP ∥ provider 面——是否在射程内宜明示）；若注解随批档 ∥ 域档承载（评审面外）⇒ 在设计线补载体指针。 |
| 4 | 清晰度（复现协议） | 🔵 | #801 复现判据三处未钉：腿 B「上滚 N 拍」N 未定值（`ACTIVITY.md:98`）；腿 B 前置「≥6 并发子代理在飞」依赖真跑（评审面记录 = 「fixture 家无凭据 ⇒ 真跑子任务面不可离线复现」`ACTIVITY.md:177`）而闭合面 ∥ 证据固化坐标未明；收口规则仅挂腿 B 两径（`ACTIVITY.md:99`）——腿 A FAIL 处置未定。 | 补：N 定值 ∥ 腿 B 环境与证据落盘坐标（沿探针件固化先例 `ACTIVITY.md:101`）∥ 腿 A FAIL 支一条（归因 ∥ 上抛）。 |
| 5 | 清晰度（坐标） | 🔵 | KD-70 落点 `thincoder-desktop/src/main/agent-host.mjs` `assembleAndLoad` 与依据「写点 = `agent-assemble.mjs:121`」（`PROJECT.md:123`）双档并存；评审面内另有「装配面出档 `agent-assemble.mjs`——原路径同名 re-export」句（`PROJECT.md:401`）⇒ 实施点归属（定义档 ∥ 转口档）未明（两源档在评审面外 = unverified）。 | 首步现读钉定单点（定义档为准），并在 KD 行内标注「写点 ∥ 落点」两坐标关系。 |
| 6 | 清晰度（词面） | 🔵 | KD-70 ③（末行指路「词面实施轮定」）与 ④（「零新词键」，`PROJECT.md:123`）关系未明——末行文案载体（既有键拼装 ∥ 字面串 ∥ 新键）未定；③ 的「桌面可达出口 = 设置面 MCP 段重连」前提在评审面内无证（桌面设置域档在评审面外 = unverified）——出口不可达则本 KD 立论（避误导）反成误导。 | 落词前现读该段动作集并明示载体与语言口径（若新增键 ⇒ ④ 措辞收正；若字面串 ⇒ 沿 #533 债先例 `PROJECT.md:1172` 标注）。 |
| 7 | 跨档互指 | 🔵 | #801 候选映射「钉底类 ⇒ 池 `createPinWatch` 手势门对齐 600ms 族」（`ACTIVITY.md:99`）与既有登记（`PROJECT.md:1174` **BY** 行——#563②「极端窗口可夺回一次上滚 = 有界自纠…裁 = 维持现态 + 登记；若真机走查再现夺回 ⇒ 再立小修」）同域，两处未互指。 | 在 #801 本批注补 BY 行 ∥ #563② 指针（腿 B = 该「再现」的复现面——判据单源）。 |

**out-of-scope note（无严重度）**：① KD-69「桌面侧详文随 `docs/desktop/design/SETTINGS.md` 解冻触点回填」——该档冻结态 ∥ 「解冻」判据在评审面外（unverified）；② 批次档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2.2–§2.4（声明「设计全文」所在）在评审面外——本表对其实载内容（探针读数 ∥ 用例 ∥ 文件账）未核；③ 核 ∥ VSC ∥ 桌面源档坐标（`memory-status.mjs` ∥ `agent-assemble.mjs` ∥ `panel-index.mjs` ∥ `settings-tools.js` 等）在评审面外——未逐条现读核。

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 4。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**：**代签成立（2026-10-02 19:5x · 自动链授权内——用户 19:30「全自动」）**——三条件核：① **设计评审 pass** ✓（评审 #21 · 轮次 1：🔴0 ∥ 🟡3 ∥ 🔵4——§3 逐字在册）；② **修正落地并逐条核验** ✓（七条全修——见 §1；读回在案）；③ **token 已签发** ✓（凭据值不落档）。**实施派发** = eng-coder（#702 补消费 ∥ #697 双面两键 + 上屏 ∥ #801 复现两腿）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-10-02 · 审计 1 轮 ∥ 评审 1 轮 pass（🔴0/🟡3/🔵7 零 must-fix）∥ fix 2 轮 · 终态 clean）

**交付摘要（实施轮 · eng-coder · 三件 + 批内件 + 两腿读数）**：

- **#702（KD-70 补消费）**：`thincoder-desktop/src/main/agent-assemble.mjs` 新导出 `mcpWarningReminder(warnings)`（词面构造：首两段逐字同 CLI `thincoder-cli/src/command-interactive.mjs:154-155`；末行 = 桌面可达出口「设置面 MCP 段重连」（出口实证 = `renderer/views/settings-sections-mcp.mjs:54` 重连钮 ∥ `mcp:reconnect` 通道））∥ `agent-host.mjs` `assembleAndLoad` **装配尾入队**（装载后——`applySession` 重设 `_pendingReminders`；装配一次推送一次；零警告 ⇒ `null` 零写）。
- **#697 桌面（KD-69）**：`src/main/index-status.mjs` `readIndexCounts` +`dbBytes`/`origins`（核 `memoryStatus()` 透传，端侧零 SQL；零径同零形 `{dbBytes:null, origins:[]}`）∥ `src/main/settings.mjs` `indexStatus()` 回执透传两键 ∥ `renderer/views/settings-sections-tools.mjs` 两读行（`data-index="db"` ∥ `"origin"`；`formatBytes` 归一；缺位 ⇒ 零节点）∥ `renderer/i18n-views.mjs` + `renderer/i18n.mjs` 两键两语同增 + 键数链随动。
- **#697 VSC（KD-69）**：`src/extension/panel-index.mjs` `pushIndexStatus` 载荷 +两键（`loadMemoryFace().memoryStatus()` 透传；改 async = 守卫契约动态 import 同拍取出口，调用点零改）∥ `webview/settings-tools.js` `#index-status` 区 +两读（缺位隐藏；`textContent` 零注入面）∥ `locales/{en,zh}.json` 两键两语同增。
- **#801**：**产品码零改**（复现先行 → 两腿 PASS ⇒ 证据收口、不造机制——设计收口规则原样执行）。
- **批内件（新）**：`docs/batches/2026-10-02-desktop-ux-closeout.test.mjs`（6 用例：B1 ∥ C1–C4 ∥ 腿 A；HOME ∥ 会话根 ∥ 库 ∥ 实例 userData 全沙箱）。

**逐档读数（内容行数 · 实施后实读）**：`agent-host.mjs` **298**（291 ⇒ +7；≤300 ✓）· `agent-assemble.mjs` **142**（130 ⇒ +12）· `index-status.mjs` **72**（67 ⇒ +5）· `src/main/settings.mjs` **325**（320 ⇒ +5）· `views/settings-sections-tools.mjs` **208**（163 ⇒ +45；超设计 ≤+30 估值 15 行，≤300）· `renderer/i18n-views.mjs` **374** · `renderer/i18n.mjs` **408** · `panel-index.mjs` **247** · `webview/settings-tools.js` **433**（398 ⇒ +35；超 ≤+15 估值，<450 在册阈值）· `locales/{en,zh}.json` **276**（274 ⇒ +2）· 批内件 **362**（新）。`mount-settings-reads.mjs` **零改**（披露：设计表「两键入段态」经实读 = `status` 整体透传即达）。

**决策透明（含表外披露）**：

1. `agent-assemble.mjs` = **表外档（+12）**：KD-70 词面构造邻写点（`_mcpWarnings` 生产点 `:121`）——`agent-host.mjs` 贴 300 层（291+9=300 零余量）⇒ 依设计表「越层同轮拆分」窗口同轮拆分；装配尾入队语义不变。
2. `src/main/settings.mjs` = **表外档（+5）**：回执透传必经单点（`index:status` 装配面）；>300 沿 `PROJECT.md:379` 在册续期（320 ⇒ 325，≤500）。
3. `pushIndexStatus` 改 async——核记忆面**动态 import 守卫契约**（`embed-config.mjs` 档头：静态引 `node:sqlite` ⇒ 低宿主加载即败）；调用面零改。
4. 键名：桌面 `settings.indexDbSizeLabel`（名/值分列）≠ VSC `settings.indexDbSize`（整行模板）——组成式差异注释在案；`settings.indexOriginCounts` 两语两面同值。
5. 腿 B 装置 = 真 Electron + 本地 mock provider（真 `runAgent` 回路 ∥ 真 `subagent` 派发 ∥ 24 真子代理在飞；零外网 ∥ 零真 key ∥ 零真数据）。
6. **真库误触披露**：腿 B 探针首版因模块双实例（URL 盘符大小写）经默认路径开真库一次——读 + 开库卫生（`user_version=10` = 当前 ⇒ 零迁移，数据零改）；已改双保险（大写盘符 URL 单实例 + HOME 沙箱），批内件全程沙箱。

**验收读数（§2.6 对照）**：B1 = 首两段逐字 ∧ 末行出口 ∧ **装载后**入队（槽携 `pendingReminders` 不覆盖）∧ 零警告两形零写 ∧ 同 key 不重推（装配恰一次）；

C1 = `dbBytes` = `statSync` ∧ `origins` 逐条同值（与 `memoryStatus` 直读对拍）∧ 零径两腿（不建库直断言）；C2 = 回执携两键 ⇒ 两读行在场（"Database size | 128.0 KB" ∥ "D:/fxt/alpha | code 2 · doc 1"）∧ 缺位零节点；C3 = 载荷两键同值（沙箱句柄落点断言防真库误触）；C4 = 两读在场 ∧ 缺位/空隐藏；

A = 摘要形（sh 2647 / ch 950，1697 ⇒ 1097 ⇒ 497 ⇒ 0）∥ 内容形（sh 5490 / ch 950，4536 ⇒ 4536 ⇒ 3936 ⇒ 3336——首拍截留 = 让位三律既定语义）∧ `_poolPin` 翻假 ∧ 程序化写位（两臂 prog=200）。

**腿 B 读数（真机 · 活跃风暴 · 两跑同果）**：`scroll.ticks` = **404 ⇒ 0**（真滚轮上滚 ×3）∧ `_poolPin=false` ∧ 风暴持续（读数时 **24 块 ∥ running 24** ≥6 在飞）∧ 溢出（sh 1127 > ch 950）；读数档 = `.thincoder/tmp/2026-10-02-desktop-ux-closeout-legB-readings.json`（`verdict: true`）；探针件 = `.thincoder/tmp/legb-real-storm.probe.mjs`（**转收口**：现住 gitignored 临时位——建议固化 `docs/batches/` 或把三读数落 §6）。

**门复跑（`node scripts/doc-check.mjs` · 仓根 cwd）**：锚 **374** 悬空 ∥ 行宽 **79**（对比改动前基线 408 / 106——净减；他批并行编辑致两跑间 9 行漂移；**本批零新增**——docs/batches 与产品码不在闸面，锚面现存的 `agent-assemble.mjs` 等引文行 = 设计轮既有笔，非本批引入）；行数面 = **差异 8 条（报告态 ∥ 回填工单）**——本批 7 条（i18n.mjs 408 ∥ i18n-views.mjs 374 ∥ agent-host.mjs 298 ∥ agent-assemble.mjs 142 ∥ settings.mjs 325 ∥ index-status.mjs 72 ∥ settings-sections-tools.mjs 208）+ 他批 1 条（page-read.mjs）——随收口回填 §4.x 表。

**审计与评审（链内自跑）**：① 内部 explore 分歧审计 **1 轮**——四类（设计 vs 实现 ∥ 验收覆盖 ∥ 文件面 ∥ 文档漂移）逐项零分歧；吸收 1 条精度备注 ⇒ **fix 1** = C1 补「不建库」直断言；② 独立代码评审（advisor · code）**1 轮**——**VERDICT: pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 7，零 must-fix；🟡 = 腿 B 证据固化位 ∥ §2.5 表补三档 ∥ 越 300 档判定句——皆转收口侧）⇒ **fix 2** = 批内件头注腿号对齐实档（B1 含三子组）。**终态 = clean**；批内件复跑 6/6 绿（fix 2 后）。

## §6 验证与收口（父代理）

**§6 验证与收口（2026-10-02 20:4x · 父侧）**

**核读**：#702（`agent-host.mjs` **298** 装载后入队 ∥ `agent-assemble.mjs` **142** 词面构造——**贴 300 同轮拆分兑现**）∥ #697（`index-status.mjs` **72** ∥ `settings.mjs` **325** ∥ `settings-sections-tools.mjs` **208** ∥ `i18n`/`i18n-views` **408/374** ∥ VSC `panel-index` **247** ∥ `settings-tools.js` **433**）∥ #801（腿 A 批内件 ∥ **腿 B 真机 PASS**——24 块风暴 ∥ `scrollTop` 404 ⇒ 0 ∥ `_poolPin=false`——不造机制、产品码零改）；设计档回填（`IPC.md:136` ∥ `MCP.md:85` ∥ 行数表 7 行 ∥ `vsc SETTINGS.md:58-61` ∥ `SETTINGS.md` §2.13 KD-69 详文 ∥ `PROJECT.md` §4.1 三值 ∥ KD-69 ⑤ 随正）——逐处实读 ✓。

**复跑**：批内件 **6/6**（父侧亲跑）；**行数面 8 ⇒ 0**；门（引擎 SKIP 面随正后·稳定读数）：**悬空 70 ∥ 行宽 75**——本批面无 ✗。

**上抛处置**：① `SETTINGS.md:216` 族 5 枚 = 归清账轮 4–6（在册）；② **引擎 SKIP 面随正已落**（`doc-check-{anchors,targets,width}`——`dist-*` 前缀排除 ∥ width 补 `.thincoder`；父侧直改 · 可 revert——复跑两次同位 70/75）；③ KD-69 ⑤ 未来式已随正（父侧笔）。

**事件受理**：探针首版真库误触 = 已核无损（`user_version=10` 零迁移——受理在案）。

**结算**：**收口（2026-10-02）**——记录冻结；台账 **#801 ∥ #702 ∥ #697 核销**；**凭证链终态消费 ✓**（designId 值不落档）。真机面 = #801 腿 B 已 PASS ∥ #697 上屏 ∥ #702 会话内提醒 = 候用户走查自然视检。
