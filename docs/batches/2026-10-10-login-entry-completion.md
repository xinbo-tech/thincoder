# 2026-10-10 · login-entry-completion
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 14:33–14:46 连续四提（① 首启向导增「登录团队服务器」入口 ② CLI TUI 会话内怎么登录 ③ 主界面登录态看不见不行 ④ 「桌面端和vsc要用户进设置界面不合理，应该有更简洁的登录退出方式」）+ 14:48「这样差不多，可以开批了」⇒ 点火。四台账行（#1229 ∥ #1230 ∥ #1231 ∥ #1232）合并本批。。
> 台账 = #1229（三端登录面（桌面 ∥ VSC ∥ CLI） · 归批）。前情 = docs/batches/2026-10-10-team-login-client-access.md（**在途**——本批为其登录面补全续批：B1 收口条件之一 = 本批交付；用户 14:39「当然不能收口啊！没干完呢！」）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 批件（点火 2026-10-10 14:48）

**交付目标**：把「登录」这件事在三端做成**能进门、看得见、退得出**——四处登录面补全（首启 ∥ 会话内 ∥ 常显 ∥ 直达）。

**依据（用户逐句裁定——需求已成文）**：

| 时点 | 用户原话 | 落点（需求档） |
|---|---|---|
| 14:33 | 「我在想啊，初始化界面是不是也应该有个直接登录到thincoder server的选择，就不用再配模型了。」 | 桌面 D11（两路）∥ CLI **F19** ∥ VSC **F-W20**（#1229） |
| 14:34 | 「三端当然要同批啊！」 | 三端同批口径（本批贯穿） |
| 14:37 | 「你说cli端好了，那我在tui里怎么登录？」 | CLI **F20**/新条（会话内入口——#1230） |
| 14:39 | 「当然不能收口啊！没干完呢！」 | B1 收口暂缓（B1 档 §6——本批为收口条件） |
| 14:42 | 「主界面上看不见能行吗？」 | 桌面 §3 状态栏条 ∥ CLI **F20** ∥ VSC **F-W21**（#1231） |
| 14:46 | 「桌面端和vsc要用户进设置界面不合理，应该有更简洁的登录退出方式。」 | 三端同拍收正（#1232——登/退主界面直达） |
| 14:48 | 「这样差不多，可以开批了。」 | **点火** |

**本批四行（条目↔需求↔判据三方一致——设计席按此表落 §2）**：

| # | 条目 | 需求指针 | 现状（父侧实读） |
|---|---|---|---|
| L1 | **三端首启向导增「登录团队服务器」入口** | 桌面 `SETTINGS.md` D11 ∥ CLI `TUI.md` F19 ∥ VSC `WEBVIEW.md` F-W20（#1229） | 桌面向导 `renderer/views/onboarding.mjs` 只走 preset→key；CLI 向导 `src/tui/wizard.mjs`；VSC 首启板 `webview/onboarding.js` |
| L2 | **CLI 会话内登录入口**（`/team` 命令族） | `TUI.md` F20 边界句（#1230） | 全 CLI 仓唯一 team 命中 = `src/command-table.mjs:16`（argv 表）——TUI 内零入口 |
| L3 | **三端常显登录态** | 桌面 §3 状态栏条 ∥ CLI F20 ∥ VSC F-W21（#1231） | 桌面状态行 11 段（`statusline-segments.mjs`）无团队段；VSC 状态栏 = 台账面（`ledger-surface.mjs`）；CLI 状态行状态段簇尾（F15/F17 位例） |
| L4 | **登/退主界面直达**（不经设置） | 桌面 §3 ∥ VSC F-W21 判据句（#1232） | 现状两端唯一入口 = 设置面（桌面 `mount-settings-team.mjs` ∥ VSC `webview/settings-team.js`——本会话均已实跑） |

**授权口径**：设计 → 评审（用户点火）→ 批准 → 实施；文档面 = 需求档（主 agent ∥ 已落）∥ 设计档（eng-designer）∥ 本档 §1/§4/§6（主 agent）。

**不并批（点火前台账扫描）**：沙盒族（#1224——独立批，在途）∥ #1215/#1216（第二步——顺序未变）∥ B1（#1212——本批为其收口条件，不并入其档）。**同族合并** = #1229–1232 四行（同一张脸：登录面）——本批一次设计一次评审。

**父侧已备证据（设计轮直接取用，勿重跑）**：B1 三端实跑读数（`docs/batches/2026-10-10-team-login-client-access.md` §6——CLI 九步 ∥ 桌面两端态截图 ∥ VSC happy-dom 全链）+ 四句失败文案（network ∥ credentials ∥ rate_limited ∥ write_failed——B1 单源）+ 核实读：桌面状态行段族 `renderer/views/statusline-segments.mjs`（11 段闭集）∥ 桌面团队卡 `mount-settings-team.mjs`（`team:status` 读 + 登录/退出两出口）∥ VSC 团队卡 `webview/settings-team.js`（两态闭集 + 上行两条）∥ CLI `command-table.mjs:16`。

**父侧建议口径（设计轮可细化，不偏离）**：① 首启首屏 = **两路并列**（非隐藏在下拉）；② 状态段 = **成员名**（服务器名进悬停/就地面板）；③ CLI 命令名 = **`/team`**（附子命令：`login` ∥ `logout` ∥ 状态——与 argv 命令族同名同序，一词一事）；④ **token 被吊销**（服务端）⇒ 状态段需有「已失效 + 引导重登」态（现三端零处理——父侧实读确认）。

### 全链授权（2026-10-10 15:04）

**用户原话：「那后续自动跑吧。」**——批级全链授权（沿本仓先例：「自动跑完」= 设计评审点火 ∥ §4 代签 ∥ 修正/实施派发 ∥ 收口核销与提交推送，射程内自动沿用）。

**父侧自缚停条件（四条——命中即停并报）**：① 复评再出新 🔴 即停；② 验证不过即停；③ 需新范围即停；④ §4 代签仅在三条件齐备时进行（评审 pass + 修正落地并逐条核验 + token 签发；凭据值不落档）。

**本批排程**：设计席 #134 在飞（L1 首启 ∥ L2 `/team` ∥ L3 常显 ∥ L4 直达——四条目 + 14:49 形态裁定）⇒ 交卷 ⇒ 父侧核验 ⇒ 评审点火 ⇒ 裁决与修正闭环 ⇒ §4 代签 ⇒ 实施派发（eng-coder）⇒ 收口。

**联动**：B1（`docs/batches/2026-10-10-team-login-client-access.md`）的收口条件 = 本批交付并经用户验收——本批收口后**随链核销 #1212 + 收 B1 §6 + consume-design**（同一授权射程内）。

### 交付核验 + 评审点火（2026-10-10 15:0x——父侧 · 承 15:04 全链授权）

**① 设计席 #134 交卷核验（内容级）**：四条目设计面实读在位——桌面 `SETTINGS.md` §2.22（两卡 + 团队表单 + 预算）∥ `UI.md` §1 本批注（常显段 + 就地面板）∥ `IPC.md` §2（`team:verify` 位次 52——白名单 52）∥ CLI `TUI-COMMANDS.md` §3.1/§5.5（`cmd-team.mjs` ∥ `ask-steps.mjs` 拟新增）∥ `TUI.md` §7.8 ∥ VSC `WEBVIEW.md` §4.11/§4.12 + `SETTINGS.md` §2.20 ∥ core `TEAM.md` §2.5/§2.6（`teamVerify` 三值 ∥ D-TM7 吊销感知=显式活校验+触发点制）。三端形态差异 5 条逐条登记在批档 §2（非默差——含 CLI 未登录零注入负控 ∥ 皮差 = 用户 14:49 裁定 ∥ 宿主面差）。

**② 上抛处置**：㈠「轮换」无端侧可达机制 ⇒ 裁定**本批零控件**（两卡位已预留）+ 挂号 **#1238**（候选②新端点为正确形——① 重登式因「重登不吊销旧 token」存疑）；㈡ doc-check 行宽 2 行（`server/requirements/PROJECT.md:292/301`）= **父侧笔域** ⇒ **已当场拆行收正**（余 FAIL 属 #136 在飞写入面——非本批）；㈢ VSC 命令注册坐标订正（包根 `extension.mjs`）⇒ 设计席已按实核落。

**③ 评审点火**：`advisor(type=design)` = **#137**（在飞；对象 = 本批设计八档 + 需求四档；`batchDoc` 已挂 ⇒ 发现表 + VERDICT 由评审席逐字写入本档 §3）。

### 评审轮次 1 裁决 + 修复轮点火（2026-10-10 15:1x——父侧 · 承 15:04 全链授权）

**评审 #137 = changes-required**（🔴3 ∥ 🟡7 ∥ 🔵3 = 13；发现表 + VERDICT 由评审席逐字入 §3 轮次 1 ✓）。

**父侧逐条裁决（13 条）**：**12 条采纳**（走修复轮 **#139**——点修，含三处 🔴 的方向裁定：号 1 = 收正为 `loadModels` 链 ∥ 号 2 = 「零新通道」⇒「+1（51 ⇒ 52）」∥ **号 3 裁决 = ①**：团队段不入「零会话 ⇒ 零段」通则——团队态非会话面，无会话亦在场，明示通则例外，保「登录路仍可达」成立）；**发现 7 = 父侧当场 Fixed**（需求面收正：`docs/desktop/requirements/PROJECT.md:58` ∥ `docs/vsc/requirements/WEBVIEW.md:43` 的「轮换」标**待立端点**（另裁 + 台账 #1238）+ 两档变更记录各一行——均标〔父侧直接执行 · 可 revert〕）。

**修复轮 #139**（八档：桌面 SETTINGS/UI/IPC ∥ core TEAM ∥ CLI TUI-COMMANDS/TUI ∥ VSC WEBVIEW/SETTINGS）在飞 ⇒ 交卷 ⇒ 父侧核验 ⇒ **评审轮次 2**（只核前表）⇒ pass ⇒ 代签 §4 ⇒ 实施派发。

### 收正（2026-10-10 15:17）：授权范围无「先例」依据

本节「全链授权」条中「**沿本仓先例**：…」句**作废**（用户 15:16 追问「哪个先例？」⇒ 父侧自纠）——授权范围**只由两件构成**：① 用户原话（「那后续自动跑吧。」）；② 父侧自缚四条停条件。**无先例依据**——本仓铁律 = 先例 ∥ 存量 ∥ 已落形态**不构成依据**，例外唯一依据 = 可机判判据句。此后本档不得再引「先例」作准绳（描述性引用仅限在册决策，且须标 = 在册决策）。

### 父侧注（2026-10-10 16:05）：待办——净删档的引用收正轮（实施落定后）

- **事实**：按设计**净删** `thincoder-desktop/renderer/mount-settings-team.mjs`（并入 `mount-team.mjs`）⇒ 他档旧路径引用现悬空。机检已定位 **5 处**：`docs/core/design/API-CONTRACT.md:2011` ∥ `docs/core/design/TEAM.md:130` ∥ `docs/desktop/design/SETTINGS.md:491` ∥ `:504` ∥ `docs/desktop/design/UI.md:602`（#{148 报——父侧实读机检闸态确认}）。
- **处置（裁）**：归本批**实施落定后**的小收正轮（eng-designer）——逐处判形态：**现值句 ⇒ 收正为新路径**（`mount-team.mjs`）∥ **史实句 ⇒ 加「迁移期引文」标记**。执行面实施中收集的**全量引用清单**（#149 交付报告里给的）+ 上述 5 处并单一次收齐。
- **口径依据**：#148 判「现值 vs 时点」同法（该轮已落：设计面 11 处计数收正 ∥ 需求档 `desktop/requirements/UI.md:14` D17 行 17 ⇒ 18 = 父侧笔）。

### 轻通道笔（2026-10-10 16:16 · 主 agent）

- **披露**：**此笔 = 轻通道**（交互细节面——键位 ∥ 提示文案；撞三项之一 ⇒ 走轻通道）。
- **来源** = #150 上抛（设计缺口：CLI 首启向导「← 换一种方式」键盘激活未点名——改其下一步）。
- **改动**：`docs/cli/design/TUI-COMMANDS.md:74`（§3.1 该行补键盘激活口径：provider 步 = 列表末行 ↑↓+Enter ∥ 团队三问步 = ↑ 聚焦 + Enter，Enter=提交 ∥ Esc=取消 语义零改；行须含可见提示）+ 同档变更记录一行（L238）。**零新语义**。
- **可达 / 回滚**：**可 revert**（两处行级改动，单笔可逆）。
- **走查**：裁答已发 #150（采其倾向 (a)；否掉专属键 ∥ 仅显示不可激活——后者等于给用户一个谎）；#150 照此实施。
- **冻结**：本笔生效；随本批收口（§6）一并核销。

### 轻通道笔（2026-10-10 16:20 · 主 agent）

- **披露**：**此笔 = 轻通道**（交互细节面——提示**位置/时段**；撞三项之一 ⇒ 走轻通道）。
- **来源** = #149 上抛（两口径相抵：同名冲突「表单区就地提示」vs「登成即进步 2」——可见窗仅一帧，等于静默丢失）。
- **改动**：`docs/desktop/design/SETTINGS.md:322`（§2.22 项 2 补：成功径同拍进步 ⇒ 该提示**并入步 2 载面**——步 2 头行渲染同一 `team.notice`，消费即清）+ 同档变更记录一行（L664）。**零新语义**（位置/时段级裁决）。
- **可达 / 回滚**：**可 revert**（两处行级改动，单笔可逆）。
- **走查**：裁答已发 #149（采其倾向——两口径同保：就绪 + 提示不静默；批内件补「冲突 ⇒ 进步后仍可见」断言）；另 #149 的 advisor 首轮 🔴（回退/换路保真）修法**接受**（「向导步切换残件并持」——不驳回、不改走 `providers.draft` state 片载体）。
- **冻结**：本笔生效；随本批收口（§6）一并核销。

### 父侧复跑发现（2026-10-10 16:38 · 主 agent）

- **发现**：CLI 面交卷件 `…-cli.test.mjs`（#150）**文件级 FAIL**——父侧复跑（仓库根、干净 shell）`ℹ tests 1 ‖ pass 0 ‖ fail 1`，与 #150 报告「18/18 绿」不符。
- **根因（父侧实证，非推断）**：该件夹具自检（`:59`）以 **junction 路径直导**（`:39-40 coreMod`）与**直路**（`:58`）比对**对象同一性**——Node ESM 对**文件 URL 直导不做 realpath**（junction 侧 = 独立实例），而 CLI 源码走**包解析**（`@thincoder/core/*` ⇒ realpath 实例）。探针读数：两侧 `configDir` 同值、各 19 键、`===` = false。
- **处置**：**fix 轮已派 #152**（同设计 token、round=fix、只动该件）——`cfgIo` 改取 realpath 侧 + 自检改断 **realpath 等价**（对象同一性 → 路径等价）+ 复跑必绿。
- **旁的读数**：`…-ends.test.mjs` 两红仍 = VSC 腿 8a/8b（#151 在途，随正待其落定）；本批其余件未见新红。

### 父侧注（2026-10-10 16:48）：16:38 发现的根因收正（实证）

- **收正**：该件（`…-cli.test.mjs`）的 16:38 文件级 FAIL **根因收窄为「路径盘符大小写」**——同件同机实测：**小写盘符 cwd（`d:\…`）⇒ 文件级 FAIL 复现**（tests 1 ∥ pass 0 ∥ fail 1）；**大写盘符 cwd（`D:\…`）⇒ 18/18 绿**。机制：文件 URL 直导时 Node 模块缓存按 **URL 串**键（junction 直导 URL 与直路/realpath 串在大小写不一致时 = 两实例）——**非文件缺陷本身**，亦非 `--preserve-symlinks`／`NODE_OPTIONS`（两级探针皆 null，实测排除）。
- **处置不变**：#152 落法照旧（取件保持 junction 面——两态皆中；自检由对象同一性 ⇒ **行为面守卫 + realpath 等价**），并加验收 = **两态双复跑**（缺省 ∥ 旗标）双读数。
- **教训入册**：父侧复跑命令应统一用**大写盘符绝对路径**（本仓所有 `node --test` 复跑同理），免此假红。

### 收正（2026-10-10 17:01 · 主 agent）——16:48 机制句（据 #153 实测）

- 16:48 那条的机制叙述**收正**：实红 = 自检②里 `realpathSync` 串上**盘符大小写差异**（`D:\…` ≠ `d:\…`——普通 `realpathSync` 保留输入盘符形），**不是**「行为面守卫脱缝」（实测：缺省加载器会把 junction ∥ 直路 ∥ 大小写变体归并为单实例，守卫全组合命中）。修法 = 两侧同取 **`realpathSync.native`**（句柄派生、盘符恒规范形）⇒ 大小写无关。
- 父侧三态复跑（大写 ∥ 小写 ∥ 小写+`--preserve-symlinks`）皆 **18/18 · EXIT 0** ✓。
- 「复跑统一用大写盘符」教训随之**下调**（该件已大小写无关）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（设计面八件 + 评审轮 1（13 条）∥ 评审轮 2（5+1 条）修正逐号落定 + 计数族残值收齐（#148）逐处落定；本笔四档零新增悬空 ∥ 行宽 OK；机检悬空 5 = 登录批实施落点（mount-settings-team.mjs 旧路径——非本笔）；行数面 = 报告态（2026-10-10））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次**：登录面补全（login-entry-completion）· 2026-10-10 · 台账 #1229–#1232 · 来源 = §1（用户 2026-10-10 14:33–14:48 裁定链：四提 + 点火）。**设计轮** = eng-designer。

### 本批覆盖条目（4）

| # | 需求条目（坐标 = 判据单源） | 设计落点 | 判据载体 |
|---|---|---|---|
| L1 首启两路 | 桌面 `docs/desktop/requirements/PROJECT.md:57-58` ∥ `docs/desktop/requirements/SETTINGS.md:15`（D11）∥ CLI `docs/cli/requirements/TUI.md:40-41`（F19）∥ VSC `docs/vsc/requirements/WEBVIEW.md:42-43`（F-W20） | 桌面 `docs/desktop/design/SETTINGS.md` §2.6（行）+ §2.22 ∥ CLI `docs/cli/design/TUI-COMMANDS.md` §3.1 ∥ VSC `docs/vsc/design/WEBVIEW.md` §4.11 | 批内件（三端各面）+ 收口轮三端实走 |
| L2 CLI 会话内入口 | CLI `docs/cli/requirements/TUI.md:40-41`（F20 范围边界：入口 = `/team` 命令族） | `docs/cli/design/TUI-COMMANDS.md` §5.5（+ §1 模块地图两行） | 批内件（注册面 ∥ 子命令行为 ∥ 掩码）+ 收口轮 |
| L3 常显 | 桌面 `PROJECT.md:57-58` ∥ CLI `TUI.md:41`（F20 判定句）∥ VSC `WEBVIEW.md:43`（F-W21） | `docs/core/design/TEAM.md` §2.5「常显面」行 + §2.6 ∥ `docs/desktop/design/UI.md` §1「本批注（团队登录态段 · 2026-10-10）」∥ `docs/cli/design/TUI.md` §7.8 ∥ `docs/vsc/design/WEBVIEW.md` §4.12 | 批内件（段/行/item 三态 ∥ 未登录负控）+ 收口轮 |
| L4 直达登/退 | 桌面 `PROJECT.md:57-58` ∥ `SETTINGS.md:15` ∥ CLI `TUI.md:41`（F20）∥ VSC `WEBVIEW.md:43`（F-W21） | 桌面 = `docs/desktop/design/UI.md` §1 本批注项 2（就地面板）∥ VSC = `docs/vsc/design/WEBVIEW.md` §4.12（命令 `thincoder.team`）∥ CLI = `/team`（§5.5）；卡降管理面 = 桌面 `docs/desktop/design/SETTINGS.md` §2.22 项 5 ∥ VSC `docs/vsc/design/SETTINGS.md` §2.20 条 6 | 批内件（零设置面锚 ∥ 面板/流树）+ 收口轮 |

### 不在本批（范围边界）

- **token 轮换**（桌面 `SETTINGS.md:15` D11「轮换」）——无端侧可达机制（服务端仅 login/logout/me 端点）；本批卡面零控件；另裁（未裁点见下）。
- 服务端面：端点 ∥ 协议零改（`docs/server/design/client/CLIENT.md` 零触）；webui 面零触。
- token 管理面（清单/吊销）= 控制台 key 页 ∥ CLI `key` 命令（既有面，零触）。
- CLI argv `team` 命令面（B1 已落）零改；桌面/VSC 设置面其余段零触；prompts ∥ 核 agent 面零触。

### 三端形态对照表（差异逐条登记）

| 面 | 桌面 | VSC | CLI | 差异登记 |
|---|---|---|---|---|
| L1 首启形态 | 两卡并排（图形卡） | 两卡并排（图形卡） | 列表形 | 皮差（宿主面——用户 14:49 裁：终端 = 列表）；语义逐字同源 |
| L1 换取 | 同屏换团队表单 + 「← 换一种方式」 | 同屏换团队表单 + 「← 换一种方式」 | 同屏换问句步 + 「← 换一种方式」行 | 同上 |
| L1 保真 | 已填保留 ∥ 密码恒清 | 同左 | 同左 | 无差异（判据统一） |
| L1 以后再说 | dismiss（会话内幂等） | `_welcomeDismissed`（webview 生存期） | `cancelWizard`（Skipped 行） | 各端既有语义保留；判据 = 登录路仍可达 |
| L3 未登录 | 入口段「登录团队服务器」 | item「登录团队服务器」 | **零注入**（F20 判定句负控） | **登记差异**：CLI 按需求判定句零注入；图形端按需求「直达登入口」选项（CLI 直达面 = `/team` 恒可达） |
| L3 服务器呈现 | 悬停（title） | tooltip | 行内 `<成员>@<主机>` | **登记差异**：CLI 行内含主机（F20 判定句点名）∥ 图形端悬停（F-W21「不搬 URL 全串」） |
| L3 已失效 | 段「已失效——重新登录」+ warn | item 同词 + 警示底色 | 段同词 + 警示色 | 无差异（词逐字同源 = 核字典键） |
| L4 登/退面 | 段点击 ⇒ 就地浮动面板 | item 点击 ⇒ 命令流（QuickPick/InputBox） | `/team` 命令族 | **登记差异**（宿主交互面：DOM ∥ 原生件 ∥ 终端命令） |
| 设置卡 | 管理面（label ∥ 详情；零登/退） | 管理面（同左） | 无设置卡（命令族即管理面） | 图形端齐平；CLI 无此面（登记） |

### 关键决策（本批新增）

1. **吊销感知 = 显式活校验 + 触发点制**：核 `teamVerify()` 三值（`valid` ∥ `invalid` ∥ `unreachable`——401 单判）；触发 = 启动 ∥ 面开合 ∥ `/team status`；**零周期轮询**；`unreachable` 不判失效（离线容忍）。单源 = `docs/core/design/TEAM.md` §2.6 ∥ D-TM7。
2. **登/退入口移出设置面**：设置卡/段 = 管理面（label ∥ 详情）；登/退 = 状态段面板 ∥ item 流 ∥ `/team`。单源 = `TEAM.md` D-TM8。
3. **状态段三态闭集**：未登录（图形端入口 ∥ CLI 零注入）∥ 已登录（成员名）∥ 已失效（「已失效——重新登录」+ 警示）。
4. **团队面接线单实现**：桌面新档 `mount-team.mjs`（`mount-settings-team.mjs` 净删）∥ VSC 复用 `src/extension/team.mjs` + `pushTeamStatus` ∥ CLI 新档 `cmd-team.mjs` + 共享问句步进件 `ask-steps.mjs`（wizard 文本步 + `/team login` 两消费方）。
5. **文案纪律**：四句失败句 ∥ 未登录句 ∥ 两条一次性提示逐字沿用（零再造）；新增 = 卡片两句（用户 14:49 给定逐字）∥「以后再说」∥「← 换一种方式」∥ 状态段两词（核字典键 `status.team.invalid` 等）。

### 受影响文件清单（现行 ⇒ 预期 · 内容行数口径 · 2026-10-10 实读）

**core**：`thincoder-core/team.mjs` **196 ⇒ ≈240**（+`teamVerify`）∥ `thincoder-core/i18n.mjs` **113 ⇒ ≈120**（+`status.team.invalid` 两语）。

**CLI**：`src/tui/wizard.mjs` **246 ⇒ ≈360**（route 屏 ∥ 团队三问步 ∥ 掩码）∥ `src/tui/cmd-team.mjs` **新 ≈150** ∥ `src/tui/ask-steps.mjs`（拟新）**≈90** ∥ `src/tui/slash-commands.mjs` **190 ⇒ ≈196** ∥ `src/tui/render-frame.mjs` **461 ⇒ ≈472**（+`teamHint`）∥ `src/tui/tui-state.mjs` **67 ⇒ ≈72** ∥ `src/tui/index.mjs` **265 ⇒ ≈285**。

**桌面**：`renderer/views/onboarding.mjs` **161 ⇒ ≈250** ∥ `renderer/mount-onboarding.mjs` **96 ⇒ ≈130** ∥ `renderer/views/statusline.mjs` **204 ⇒ ≈222** ∥ `renderer/views/statusline-segments.mjs` **227 ⇒ ≈254** ∥ `renderer/mount-team.mjs` **新 ≈150** ∥ `renderer/mount-settings-team.mjs` **131 ⇒ 净删** ∥ `renderer/views/settings-sections-team.mjs` **118 ⇒ ≈150** ∥ `renderer/mount-settings.mjs` **292 ⇒ ≈295** ∥ `renderer/app.mjs` **338 ⇒ ≈360** ∥ `renderer/i18n.mjs` **436 ⇒ ≈444** ∥ `renderer/i18n-settings.mjs` **190 ⇒ ≈206** ∥ `src/main/team.mjs` **35 ⇒ ≈45** ∥ `src/main/ipc-registry.mjs` **99 ⇒ ≈100** ∥ `src/preload/preload.cjs` **87 ⇒ ≈88**。

**VSC**：`webview/onboarding.js` **84 ⇒ ≈180** ∥ `webview/index.html` **96 ⇒ ≈135** ∥ `webview/settings.css` **413 ⇒ ≈465** ∥ `webview/state.js` **140 ⇒ ≈155** ∥ `webview/chat-messages.js` **279 ⇒ ≈285** ∥ `webview/settings-team.js` **142 ⇒ ≈100**（管理面瘦身）∥ `webview/settings.js` **204 ⇒ ≈206** ∥ `src/extension/team-surface.mjs` **新 ≈120** ∥ `extension.mjs`（包根）**204 ⇒ ≈220** ∥ `package.json`（contributes.commands +1）∥ `locales/en.json ∥ zh.json` **311 ⇒ ≈325**。

### 验收对照（指向需求条目）

| # | 判据 | 指向 | 载体 |
|---|---|---|---|
| ① | 首启两路（图形端两卡 ∥ CLI 列表；零预选；同屏换取；「← 换一种方式」；「以后再说」在场） | L1（F19 ∥ D11 ∥ F-W20 ∥ 桌面 PROJ §3） | 批内件三端 + 收口轮 |
| ② | 登录成即用（模型面就绪；失败四句逐字就地；密码不保真） | L1 | 批内件 + 收口轮 |
| ③ | 常显三态（未登录图形端入口 ∥ CLI 零注入负控；已登录成员名；服务器 = 悬停/行内；已失效句） | L3（F20 判定句 ∥ F-W21 ∥ 桌面 §3） | 批内件 + 收口轮 |
| ④ | 直达登/退（不经设置面；设置卡 = 管理面零控件） | L4 | 批内件 + 收口轮 |
| ⑤ | `/team` 命令族（login ∥ logout ∥ status；与 argv 同名同序；掩码；活校验） | L2（F20 边界） | 批内件 + 收口轮 |
| ⑥ | 吊销态三端同词「已失效——重新登录」+ 引导重登；`unreachable` 不判失效 | L3 ∥ 核 §2.6 | 批内件（HTTP 桩）+ 收口轮 |
| ⑦ | 零新协议（VSC）∥ 桌面通道 +1（`team:verify`，白名单 52）∥ 两卡降管理面 | L1 ∥ L3 ∥ L4 | 批内件结构面 |

### 批内件（拟——落盘由实施轮定）

`docs/batches/2026-10-10-login-entry-completion-core.test.mjs`（`teamVerify` 三值 + 核词键）∥ `...-cli.test.mjs`（wizard 两路 ∥ 掩码 ∥ `/team` 三子命令 + 注册面 ∥ 状态段三态）∥ `...-desktop.test.mjs`（段三态 ∥ 面板树 ∥ 闭集 18 ∥ 路由屏/团队表单树 ∥ 通道件结构）∥ `...-vsc.test.mjs`（首启板两路 ∥ item 三态 ∥ 命令流 ∥ 卡降）。随批留存 · 不进仓套件。

### 收口轮实走清单（父侧）

1. 桌面真 Electron（空 fixture 家）：首启两卡 → 团队登录 → 模型步 → 目录步 → 收尾 ⇒ 状态段成员名；点段 ⇒ 面板 ⇒ 退出；吊销桩 ⇒ 「已失效——重新登录」；设置面团队段 = 管理面零控件。
2. VSC（真扩展宿主）：首启板两卡 → 团队登录 → item 变名；命令面板 `thincoder.team` → 退出 ⇒ item 回入口；吊销桩 ⇒ item 转「已失效」。
3. CLI（真终端）：首启两路（选团队 → 三问 → 登录成 → 模型 picker；「← 换一种方式」；以后再说）→ `/team login ∥ status ∥ logout` → 状态行段三态（含吊销桩）。
4. 失败面：错凭据三端四句逐字（各自就地）+ 密码掩码/清空核点。

### 未裁点 / 上抛

1. **[上抛·待裁] 设置面团队卡「轮换」**：无端侧可达机制（服务端仅 login/logout/me——`docs/server/design/client/CLIENT.md:26-28`）。候选 = ① 重登式轮换（服务端无 revoked-on-relogin 语义 ⇒ 旧 token 留存——与「轮换」语义不符）② 服务端新端点（跨板——server 面另批）。建议 = 本批零控件、另裁/另批；两卡位置已在设计内预留（未落控件）。

### 披露项（不静默）

1. B1 AC-31① 的入口映射随本批收正（`docs/core/design/TEAM.md` §2.5 入口行——B1 档不触，按 D1/D2 落 TEAM.md）；B1 收口条件含本批（`docs/batches/2026-10-10-team-login-client-access.md` §1）。
2. VSC 命令注册**实际坐标 = 包根 `thincoder-vscode/extension.mjs`**（父侧原坐标 `src/extension/extension.mjs` 不存在——实核订正，落 `docs/vsc/design/WEBVIEW.md` §4.12）。
3. F20 判定句「含服务器标识」与「状态段 = 成员名（服务器进悬停）」：按需求档落 CLI 行内主机、图形端悬停——两处需求各自点名，登记为差异（对照表已列）。
4. 「以后再说」三端各守既有语义（dismiss ∥ `_welcomeDismissed` ∥ `cancelWizard`）；判据 = 登录路仍可达（图形端入口段/item 恒在；CLI `/team` 恒在）。
5. CLI 掩码 = 显示层变换（每字符 `•`；提交值原样）；共享问句步进件 `ask-steps.mjs` 为设计取向——实施落点由实施轮按现盘定（若提取成本过高可平行小机复刻语义，披露于 §5）。
6. 桌面 `mount-settings-team.mjs` 净删（并入 `mount-team.mjs`）；相关机检件/脚注引旧档名 ⇒ 实施轮随正。
7. 设计轮零产品码触碰（本段全部为文档面）。

### 三链路一致性（自检）

批档 §2 覆盖条目表 = 设计档回指条目 = 需求条目（L1–L4 四行）——同源，自检通过。

### 设计评审轮 2 修正（fix 轮 · 2026-10-10 · eng-designer）

**对象** = §3 轮次 2 五条 🟡（1–5）+ 附项一条（范围外残值）。**零新语义**（全部为评审发现的直接导出项）；**产品码零触**。

| # | 落定 | 改动（file:line） |
|---|---|---|
| 1 | 样式落点补齐（取「补落点行」径——`wizard-routes` ∥ `team-pop` 全仓零命中，无既有类族可复用） | `docs/desktop/design/SETTINGS.md` §3.2 本批块 +`settings.css` 行（**306 ⇒ ≈340**——路由屏两卡族 ∥ 就地面板族；**越 300 咨询线在册** ∥ ≤500 ✓）+ §2.22 项 8 边界 +样式落点句；`docs/desktop/design/UI.md` §1 本批注项 2 +**样式落点指针**（单源登记 = SETTINGS.md §3.2 本批块——不重复计数） |
| 2 | VSC 转口行补登记 | `docs/core/design/TEAM.md` §4 VSC 行 **34 ⇒ ≈44**（+`teamVerify` 转口——转口四件；前读 34 保留） |
| 3 | 段计数面单一现值形 | `docs/desktop/design/UI.md` 十处（评审点名四 + 同族六）：状态栏行（表名 ∥ 定形尾句 ∥ `quiet` 段注 **17 ⇒ 18** ∥ 播种 2 / 不播种 **12**）∥ 项 1（表名 ∥ 定形句 ∥ 打开态段集 **18 段** ∥ **18 段表** ∥ 闭集 **18 码**）∥ 播种面括注 **14 段**〔承载 18 − banner 四〕+ `team` 不入 seed 面句（评审点名）∥ 不播种 **12 段** + `team` 逐段理由 ∥ 收正句现值 ∥ 停滞轻显形项题 **17 ⇒ 18** |
| 4 | T-DSK65 面随本批改制 | `docs/desktop/design/SETTINGS.md` §5 T-DSK65（输入面 = 段面板两态 ∥ 设置面 = 管理面零登/退；保 config 写面断言——token ∥ 派生条目 ∥ 零写盘） |
| 5 | 节号收正 | `docs/desktop/design/UI.md` §4.2 设计档行（`IPC.md` §6 ⇒ **§3** 行数面） |
| 附 | WEB-QUICKCHECK 残值 | `docs/desktop/design/WEB-QUICKCHECK.md` 两处（`:79` ∥ `:82`）消费改指 `mount-team.mjs`（**拟新增**注记——段/面板读面；`mount-settings-team.mjs` 净删） |

**doc-check**（`node scripts/doc-check.mjs` · 仓根 `thincoder/`）：**EXIT 0**——锚悬空 **0** ∥ 行宽 OK；行数面报告项 = 存量（非闸态）。**本批笔致两处越线当场收正**（① WEB-QUICKCHECK 两处前向引用缺「（拟新增」注记 ⇒ 补（列报·不入闸）；② `UI.md:149` 加句越 300 ⇒ 折行——语义零改）。

**残值披露（未动——报告父侧）**：① `docs/desktop/design/IPC.md:227` 打开态播种指针内残值（13 段 ∥ 承载 17 ∥ 播种 2 ∥ 不播种 11——与 UI.md 现值相抵；受「本轮不触 IPC.md 正文」约束未动）；② 计数族同点未入评审单：`docs/desktop/design/PROJECT.md` 四处（KD-25 行 ∥ D17 行 ∥ D22 行 ∥ T-DSK33 行）∥ `docs/desktop/design/ACTIVITY.md:18`（KD-36）∥ `docs/desktop/design/UI.md:386`（补漏批计数记录句）——保留待裁。

**变更记录行同拍**：四档各 +1 行（`UI.md` ∥ `SETTINGS.md` ∥ `TEAM.md` ∥ `WEB-QUICKCHECK.md`——`## 变更记录` 尾）。

### 计数族残值收齐（#148 · fix 轮 2 · 2026-10-10 · eng-designer）

**对象** = 本 §2「设计评审轮 2 修正」残值披露 ①（`IPC.md:227`）+ ②（PROJECT 四处 ∥ `ACTIVITY.md:18` ∥ `UI.md:386`〔实址 `:387`〕）+ **四档全族扫描所得四处**（「收齐」口径 = 同族现值唯一——列外所得逐处判落，若判越界请裁）。**零新语义 ∥ 机制句零动 ∥ 产品码零触 ∥ 不触登录面批实施写域**。

**逐处判落（处 → 判 → 落）**：

| # | 处（`file:line`） | 判 | 落 |
|---|---|---|---|
| 1 | `docs/desktop/design/IPC.md:227` | 活面（现值指针——「打开态播种注」项 1） | 读数切片段 13 ⇒ **14 段** ∥ 承载 17 ⇒ **18 段** ∥ 不播种 11 ⇒ **12**（播种 2 不动） |
| 2 | `docs/desktop/design/PROJECT.md:70`（KD-25） | 活面（裁定计数——doc-backfill 维护对象） | 承载 17 ⇒ **18**（旁置 1 ∕ 不适用 1 行不动） |
| 3 | `docs/desktop/design/PROJECT.md:948`（D17 行） | 活面 | 段表 17 ⇒ **18 段**；承载 17 ⇒ **18** |
| 4 | `docs/desktop/design/PROJECT.md:953`（D22 行） | 活面 | 段表 17 ⇒ **18 段** |
| 5 | `docs/desktop/design/PROJECT.md:1072`（T-DSK33） | 活面（用例行题 ∥ 期望句） | 十七段 ⇒ **十八段**；承载 17 ⇒ **18 段** |
| 6 | `docs/desktop/design/ACTIVITY.md:18`（KD-36） | 活面（被否理由计数——族维护对象） | CLI 17 段闭集 ⇒ **18 段闭集** |
| 7 | `docs/desktop/design/UI.md:387`（补漏批计数记录句） | 时点记录——**过渡形**消两读 | 「承载 17 段不动——登录面补全批 **17 ⇒ 18**」 |
| 8 | `docs/desktop/design/PROJECT.md:75`（KD-30 · 扫描所得） | 活面（族维护对象——「现读 17」槽） | 段集 17 ⇒ **18** |
| 9 | `docs/desktop/design/PROJECT.md:187`（残余批边界行 · 扫描所得） | 活面（播种面分类句） | 11 ⇒ **12 段** |
| 10 | `docs/desktop/design/PROJECT.md:1078`（T-DSK39 · 扫描所得） | 活面（用例闭集句——漏随 17 更新） | 16 码 ⇒ **18 码** |
| 11 | `docs/desktop/design/PROJECT.md:1228`（§10 AR · 扫描所得） | 活面（开出项指针值） | 「播种 2 / 不播种 11」⇒ **12** |

**不落（时点记录——零追改）**：① `PROJECT.md:546`（R3a 批块「12 段构树单源」＝批内记录句）；② `PROJECT.md:582`（状态栏对齐批块「段闭集 12 ⇒ 16」＝批内记录句）；③ `PROJECT.md:1072` 机检面括注「段集 17 计数锁」（退场档描述——非现值声称；族「实读随档保留」惯例）。

**报告项（非本笔域）**：① `docs/desktop/requirements/UI.md:14`——D17 行「CLI 状态行 **17 段**（15 ⇒ 17）」与设计面现值 18 段相抵；需求档 = 主 agent 笔域（报告不落）；② `docs/desktop/requirements/PROJECT.md:137`——「CLI 状态行 15 段」＝ 2026-09-27 勘察时点记录（不落）；③ `UI.md:29`——`quiet` 段注「承载 **17 段 ⇒ 18 段**」与 quiet 批实增量（**16 ⇒ 17**——证据 = `UI.md:735` ∥ `PROJECT.md:1603`）相抵，且与同行登录批「定形 = 17 段 ⇒ 18 段」并置两读；#146 已裁件（其 fix 表列「`quiet` 段注 17 ⇒ 18」）——报告不动，留父侧裁。

**doc-check 读数**（`node scripts/doc-check.mjs` · 仓根 `thincoder/` · 2026-10-10T08:02Z）：**EXIT 1**——悬空 **5** 条，**全 = `thincoder-desktop/renderer/mount-settings-team.mjs` 旧路径引用**（`docs/core/design/API-CONTRACT.md:2011` ∥ `TEAM.md:130` ∥ `docs/desktop/design/SETTINGS.md:491` ∥ `:504` ∥ `UI.md:602`）＝登录批「净删（并入 `mount-team.mjs`）」实施已发生的落点（`mount-team.mjs` 已在盘、旧档已删）——**非本笔因果**（本笔四档零新增悬空）。行宽 **OK**（无 >300 行）；行数面差异 8 条 = 报告态。**处置建议**：5 处归该批实施后回填轮（旧路径 ⇒ 新路径 ∥ 史实句加「迁移期引文」标记——逐处判形态）；收定后重跑取 EXIT 0 终读。跑读 1（07:53Z）另见 `docs/core/design/MODEL-BENCH.md:2208` 一条，二次读已消（父侧在途「锚悬空收正」面推进——非本笔）。

**变更记录**：四档各 +1 行（`ACTIVITY.md:478` ∥ `IPC.md:578` ∥ `UI.md:870` ∥ `PROJECT.md:1815-1816`——2026-10-10 · #148）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（登录面补全批 · 设计面 = TEAM §2.5/§2.6 ∥ 桌面 SETTINGS §2.22 + UI §1 + IPC §2 ∥ CLI TUI-COMMANDS §3.1/§5.5 + TUI §7.8 ∥ VSC WEBVIEW §4.11/§4.12 + SETTINGS §2.20）**——已核通过面：三端文案同构句 ∥ 段位（簇尾末位 ∥ title 后 enter 前）∥ 判据⑥⑦⑧ ∥ `teamVerify` 三值 ∥ 零轮询口径四档一致；行数抽查 30 档实读全对（±1 内，含 core `team.mjs` **196** ∥ 桌面 `views/settings.mjs` **448** ∥ VSC `chat-messages.js` **279**）；CLI/VSC 行数账按仓例住批档 §2（CLI 模块地图声明「行数列不并」——`TUI-COMMANDS.md:14`）；无越 500 档、无 300+ 行单函数面。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 桌面设计 §2.22 项 2 与 §2.14/§2.15 同机制相抵：向导模型步候选源写「候选 = `provider:models` 探针」（`SETTINGS.md:322`），而 §2.15 钉死「向导步 2 复用 `modelChoicesTree`（单一 owner），且候选复读 = **同一注入引用** `loadModels`（注入点 = `mount-settings.mjs:214`；调用点 = `mount-onboarding.mjs:59-62` 步入步 2）」（`SETTINGS.md:189`）；`provider:models` 单源定义 = 表单暂存值「**不落盘 ∥ 不入账**……收为渠道校验，**不选模型**」（`IPC.md:303`）。实读旁证：`mount-onboarding.mjs:60-63` 步入步 2 调 `loadModels`。 | 该句收正为 `loadModels` 链（激活渠 = `model:list`；缺渠 = `model:catalog`）——与 §2.14/§2.15 ∥ `IPC.md` §2 同拍；勿新立第二取数链。 |
| 2 | Document ownership | 🔴 | 桌面设计 §2.22 项 7 ∥ 项 8 两处谓「**零新通道**」（`SETTINGS.md:327` ∥ `:328`），与通道单源相抵：`IPC.md:178`「**登录面补全批一新**（追加末位 · 位次 52）：`team:verify`」∥ `IPC.md:154`「白名单 = **48 项 ⇒ 51 项 ⇒ 52 项**」∥ `UI.md:446`「活校验 = `team:verify`（**新通道**——`docs/desktop/design/IPC.md` §2 团队族行）」；同档 §3.2 行 7 亦自谓「+`team:verify` 转口」（`SETTINGS.md:504`）。 | 两处收正为「通道 **+1**（`team:verify`——白名单 **51 ⇒ 52**；单源 = `IPC.md` §2）」，与 UI ∥ 批档验收⑦ 同拍。 |
| 3 | Acceptance criteria | 🔴 | 「以后再说」后登录路可达性两说相抵：`UI.md:442`「**零会话 ⇒ 零段**（沿状态行通则）」（实读旁证 = `thincoder-desktop/renderer/views/statusline.mjs:72` `active === null ⇒ segments = []`）vs `SETTINGS.md:324`「状态段团队入口（未登录态）在场 ⇒ **空态下登录路仍可达**」；首启「空态」恒无会话 ⇒ 段落不存在，且登/退已移出设置面 ⇒ 该态无登录入口（批档判据「登录路仍可达」不成立）。 | 二择一并写死：① 团队段不入「零会话 ⇒ 零段」通则（无会话也在场——明示状态行通则例外）；② 改判据（登录路 = 冷启动重进向导 ∥ 打开项目后段在场），§2.22 项 4 句同拍收正。 |
| 4 | Requirements coverage | 🟡 | 本批新增登面未点明「同名冲突」一次性提示落点（`TEAM.md:42`「端侧收 `notice` ⇒ **登录当刻就地提示**…（三端逐字同句——§2.5）」）：CLI 向导团队路（`TUI-COMMANDS.md:72`）∥ `/team login`（`:193`）∥ VSC 首启板团队表单（`WEBVIEW.md:235`——成即板退场）∥ VSC `thincoder.team` 流（`:247`——只列吊销未达）∥ 桌面向导团队表单（`SETTINGS.md:322`——只列失败四句）。 | 逐面补一句提示落点（或明示由「结果行（argv 同形）」/共享结果渲染承载）；VSC 命令流建议点名 `showWarningMessage` 落点。 |
| 5 | Clarity | 🟡 | `WEBVIEW.md:235` 引「既有 `_closeWelcome` 径」——全仓零命中（该符号不存在）；实读机制 = `maybeShowWelcome(status, keyOk)` ⇒ `hideWelcomePanel()`（`thincoder-vscode/webview/onboarding.js:47-53`）。 | 悬空锚收正为 `maybeShowWelcome`（`providerStatus` ⇒ `keyOk` 真 ⇒ 板退场）。 |
| 6 | Clarity | 🟡 | `WEBVIEW.md:233`「跳过钮 = 既有 skip（词「以后再说」）」——既有键值非该词：`locales/zh.json:217`（`"welcome.skip": "暂时跳过"`）∥ `en.json:217`（`"Skip for now"`）。 | 二择一：值改 `welcome.skip`（两语——登记为值改）∥ 引现值 + 登记与桌面/CLI 新键「以后再说」的端差。 |
| 7 | Requirements coverage | 🟡 | 需求面「轮换」滞后于设计裁定：`docs/desktop/requirements/PROJECT.md:58`「团队卡 = 设置面**管理面**（label ∥ 轮换 ∥ 详情）」∥ `docs/vsc/requirements/WEBVIEW.md:43`「管理面（label ∥ 详情 ∥ 轮换）」vs 设计「另裁项」（`SETTINGS.md:325` ∥ `WEBVIEW.md:248`——本批零控件）。 | 需求面同拍收正（轮换 = 另裁/挂号 #1238）或于设计档明示需求待收正。 |
| 8 | Document ownership | 🟡 | `UI.md:602` 桌面词表行谓 +2 键「（`status.team.entry` ∥ `status.team.invalid`）」——`status.team.invalid` 已定为**核字典键**（`TEAM.md:87`「**词形**（核字典键）：`status.team.invalid` = zh「已失效——重新登录」…」），桌面主表零核键副本（实读：`renderer/i18n.mjs` 无 `status.quiet` 等核键；解析序 = 宿主 ⇒ 核投影）。 | 桌面只 +1 宿主键（`status.team.entry`）；`status.team.invalid` 走核投影（如确需兜底副本须明示 + 登记漂移面）。 |
| 9 | Affected-file annotations | 🟡 | 受影响面缺两行（「卡降管理面」落地必触）：`thincoder-desktop/renderer/views/settings.mjs`（实读 **448**；分派位 `:289` 现渲 `teamBody`）∥ `thincoder-desktop/renderer/views/settings-sections.mjs`（实读 **100**；hub `:37` 现 re-export `teamBody`）——`SETTINGS.md` §3.2 本批块 ∥ `UI.md` §4.2 本批块皆无。 | 两表补行（现行 ⇒ 预期 ±N）或点名绕行（直 import）——沿本档「设计表缺行，补登」先例。 |
| 10 | Clarity | 🟡 | `verify` 态边界未闭合：`TEAM.md:86`「已失效（`verify === invalid`——**不论本地 token 在否**）」vs 三端表首判未登录（`TUI.md:750` ∥ `UI.md:441`）；清位仅定「重登成 ⇒ `verify` 清」（`TEAM.md:88`）——logout ∥ 复读清位与「token 缺席 ∧ invalid」优先级未写死；`IPC.md:145` 未登录径回执 `{ ok:false }` 无 `reason` 键的端侧落切片口径未定。 | 写死优先级与 `verify` 清位点（logout ⇒ 清 ∥ invalid 优先，二择一）+ 未登录径端侧切片口径。 |
| 11 | Clarity | 🔵 | `SETTINGS.md:322` 谓 `fieldPair` 经「单一 owner：`settings-sections-team.mjs` 导出面」复用——实读该件 `fieldPair` **非导出**（`settings-sections-team.mjs:53`）。 | 明示导出面新增（或改经 `teamBody` 复用）。 |
| 12 | Clarity | 🔵 | 就地面板「关三路 = 段再点 ∥ Esc ∥ 面板外点击」（`UI.md:444`）未点明 Esc 与既有 document 级 Esc 面（F-Esc 关页 ∥ 弹窗专指 ∥ 会话控制选择器）的优先序 / `stopPropagation`。 | 沿 KD-68 ⑥ 先例写法点明（面板内 Esc 拦截手势）。 |
| 13 | Clarity | 🔵 | VSC `teamVerify` 端壳落点未点明：`WEBVIEW.md:250` 只列「复用 `thincoder-vscode/src/extension/team.mjs`（teamStatus ∥ teamLogin ∥ teamLogout）」，该转口现仅三件（实读 **34** 行）；新档 `team-surface.mjs` 是否直取核未写。 | 点名 `teamVerify` 转口（与桌面 `src/main/team.mjs` 同拍）或明示直取核。 |

计数：🔴 **3** · 🟡 **7** · 🔵 **3**（共 **13**）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审（登录面补全批 · 复核轮 · 轮次 1 发现逐号复核）**——复核面 = 桌面 SETTINGS/UI/IPC ∥ core TEAM ∥ CLI TUI-COMMANDS/TUI ∥ VSC WEBVIEW/SETTINGS 八档（fix 轮 #139 交付面）。
**逐号复核结论（12 条修复 + 1 条父侧 Fixed）= 全部落地**：① 候选源 = `loadModels` 链（`SETTINGS.md:323`）；② 通道 +1（`SETTINGS.md:328` ∥ `:329`「白名单 **51 ⇒ 52**」，与 `IPC.md:178` 同拍）；③ 零会话例外明示（`UI.md:443` ∥ `SETTINGS.md:325` ∥ `T-DSK66` ⑨ `:574`）；④ 五面 notice 落点齐（`TUI-COMMANDS.md:72` ∥ `:193` ∥ `WEBVIEW.md:236` ∥ `:248` ∥ `SETTINGS.md:322`）；⑤ 悬空锚收正（`WEBVIEW.md:235`「`maybeShowWelcome(status, keyOk)`」）；⑥ 值改登记（`WEBVIEW.md:233`「值改：`welcome.skip`」）；⑦ 需求面（父侧）∥ 设计侧「另裁项」三口一致；⑧ 桌面 +1 宿主键（`UI.md:519` ∥ `:605`；`status.team.invalid` 走核投影）；⑨ 两表补行（`SETTINGS.md:502-503` ∥ `UI.md:602-603`）；⑩ 判序写死 + 清位（`TEAM.md:86-88`）+ 未登录径切片口径（`IPC.md:145`）；⑪ `fieldPair` 入导出面（`SETTINGS.md:322`）；⑫ Esc 优先序写死（`UI.md:445`）；⑬ `teamVerify` 转口点名（`WEBVIEW.md:251`）。行数抽校 5 档一致（内容行数口径）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file annotations | 🟡 | 桌面本批两处新可见形无样式落点行：路由屏两卡（`SETTINGS.md:320`「`div.wizard-routes`（两卡并排）」）∥ 就地面板（`UI.md:444`「面板 = `div.team-pop`（`position: fixed`·状态行上方·就地」）——`SETTINGS.md:329` 只声明「零新变量 ∥ 零新断点」、无「零新 CSS ∥ 复用既有类」句；§3.2 本批块 ∥ `UI.md` §4.2 本批块皆无样式档行（对位 VSC 同批列 `webview/settings.css` 413 ⇒ ≈465）。在册相关档：`SETTINGS.md:367`「**306**（实读 2026-10-10」∥「**越 300 咨询线在册**」。 | 补样式落点行（现行 ⇒ 预期 ±N）或明示「零新 CSS——复用既有类族」；若触 `settings.css` 随带「越 300 在册」登记。 |
| 2 | Affected-file annotations | 🟡 | VSC 转口档随本批改而无「现行 ⇒ 预期」登记：`WEBVIEW.md:251`「**`teamVerify` 转口**——转口四件」（`thincoder-vscode/src/extension/team.mjs`）；`TEAM.md:121` 该行仍为「**34**（实施落盘——核转口三件」；本批表内新增行仅 core 两行（`TEAM.md:137-138`）；桌面对位行已带增量（`SETTINGS.md:371`「**35 ⇒ ≈45**」）。 | 该行补 34 ⇒ ≈N（+转口一件）或于本批 VSC 文件账补行。 |
| 3 | Clarity | 🟡 | UI.md 段集计数两值并存：新值 = `UI.md:124`「（**18 码**——登录面补全批 +`team`）」∥ 老注 live 句仍 17——`UI.md:172`「**打开态段集 = 17 段**」∥ `UI.md:175`「（值域 = 闭集 17 码）」∥ `UI.md:174`「**17 段表**的表列序」∥ `UI.md:149`「13 段〔承载 17 段 − banner 四段〕」（`UI.md:100` ∥ `:29` 表名同族）。先例 = `UI.md:744`「段集计数随动」。 | 四处随 18 段重推；`:149` 括注并明示 `team` 段是否入播种面（数据源 = `settings.team` 切片 ≠ page-read seed）。 |
| 4 | Acceptance criteria | 🟡 | `T-DSK65` 用例行未随本批收正：`SETTINGS.md:573`「真 Electron（未登录态）⇒ 设置面「团队」段：① 填地址/账号/密码 ⇒ 登录」与本批「**零登/退控件**（登/退 = 状态段面板 ∥ 首启两路）」（`:326`）∥ `T-DSK66` ⑦「设置面团队段 = 管理面（label ∥ 详情；**零登/退控件**）」（`:574`）相抵——该面上此流程已不可达；VSC 对位行已同拍收正（`docs/vsc/design/SETTINGS.md:752`「**登录入口补全批收正**：卡内登/退退场 ⇒ 首启板团队卡 ∥ 状态栏 item 流」）。 | T-DSK65 输入面 ∥ 入口改指段面板（或标面随本批改制），保 config 写面断言（token ∥ 派生条目）与 §2.22 项 5 同拍。 |
| 5 | Clarity | 🟡 | `UI.md:614` 设计档行引「`docs/desktop/design/IPC.md`（§2 团队族行 + 白名单 +§6 行数面）」——IPC.md 无 §6（节头 = `IPC.md:11` §1 ∥ `:112` §2 ∥ `:354` §3）；本批触行数面 = §3.1（`IPC.md:362`「**87 ⇒ 88**（登录面补全批设计目标态——+1 CHANNEL（`team:verify`））」）。 | 节号收正（§6 ⇒ §3）。 |

**范围外（登记 · 不判分）**：`docs/desktop/design/WEB-QUICKCHECK.md:79` 仍指「消费 = `thincoder-desktop/renderer/mount-settings-team.mjs`」——该档随本批「**131 ⇒ 净删**」（`SETTINGS.md:370`）失实，属八档外，未判分。

计数：🔴 **0** · 🟡 **5** · 🔵 **0**（共 **5**）。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-10 15:04「那后续自动跑吧。」全链授权（自缚四条在 §1）。

- **三条件齐备** ✓：① 评审 **pass**（§3 轮次 2——🔴 0 ∥ 🟡 5；轮次 1 = changes-required ⇒ 修复轮 #139 落地 + 复核全清 ✓）；② 修正落地并逐条核验 ✓（轮 2 五条 + 附项 = #146 落定 + 父侧实读抽查命中 ✓；`doc-check` EXIT 0 亲跑 ✓）；③ **token 已签发** ✓（凭据值不落档——沿纪律）。
- **依据**：轮 1 十二条全清；轮 2 五条 🟡（**非阻断**）全部 Dispatched 并落定（样式落点行 ∥ VSC 转口行 34 ⇒ ≈44 ∥ 段计数单一现值形（九处）∥ T-DSK65 改制 ∥ 节号收正 + WEB-QUICKCHECK 残值）。余计数族（IPC.md:227 现值 ∥ PROJECT/ACTIVITY 同族）另单点修（#148）。
- **实施**：桌面 + core 面 = eng-coder（本档 §5 记录其落点）；CLI ∥ VSC 面 = 后续单。**T-DSK66 真机腿**（Electron 实跑）= 收口/真机轮（不假装通过——挂 §6）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-10-10（桌面+core 21 件 ∥ VSC 15 件落定；批内件 9/9 ∥ VSC 批内件 15/15 ∥ B1 桌面件 10/10 绿；两席终态 clean；CLI 件 fix 轮续（盘符大小写归一）三态双验全绿 ∥ 审计 CLEAN ∥ advisor pass；待父侧：B1 件腿8a/8b 随正 ∥ 设计档回填 3 项））



### 交付摘要（eng-coder · 桌面 + core 两面 · 2026-10-10）

**范围** = 本批桌面 + core 两面（CLI ∥ VSC 两面 = 后续单；`thincoder-cli/**` ∥ `thincoder-vscode/**` ∥ server ∥ 设计档**零触**）。

**落地面（21 件；行数 = 实读内容行）**
- **core**：`thincoder-core/team.mjs` **223**（+`teamVerify()` 三值闭集：200 ⇒ `valid` ∥ 401 ⇒ `invalid` ∥ 其余含网络 ⇒ `unreachable`；token ∥ 地址缺 ⇒ `unreachable` 零请求；只读零写盘）∥ `thincoder-core/i18n.mjs` **115**（+核字典键 `status.team.invalid`）。
- **桌面主侧**：`src/main/team.mjs` **46**（+`teamVerifyChannel`）∥ `src/main/ipc-registry.mjs` **100**（+1 HANDLERS：`team:verify`）∥ `src/main/ipc.mjs` **299**（头注计数同拍）∥ `src/preload/preload.cjs` **88**（+1 CHANNELS）。
- **桌面渲染**：`renderer/views/statusline-segments.mjs` **259**（+`teamSegment`）∥ `renderer/views/statusline.mjs` **264**（段 16 `team`，序 = `title` 后 `enter` 前；面板开合四导出 + segNode 接线）∥ `renderer/mount-team.mjs` **324**（**新档** —— 面板宿主：建件 ∥ 锚位 ∥ 关三路 ∥ 差分门 ∥ `createTeam`（自 `mount-settings-team.mjs` 迁入，单实现））∥ `renderer/mount-status.mjs` **45**（+`settings` 订阅切片）∥ `renderer/views/settings.mjs` **454**（段分派降管理面 + 段体投影 +`verify`）∥ `renderer/views/settings-sections-team.mjs` **142**（`teamBody` ∥ `teamAdminBody` 两分）∥ `renderer/views/settings-sections.mjs` **101**（hub re-export 改 `teamAdminBody`）∥ `renderer/mount-settings.mjs` **306**（团队面装配 +「向导步切换残件并持」）∥ `renderer/mount-onboarding.mjs` **188**（向导两路 + 提示随步收束）∥ `renderer/views/onboarding.mjs` **264**（四屏）∥ `renderer/store.mjs` **374**（步闭集初值 + 加宽 setter）∥ `renderer/app.mjs` **342**（启动读）∥ `renderer/i18n.mjs` **441** ∥ `renderer/i18n-settings.mjs` **206** ∥ `renderer/settings.css` **348**。
- **净删**：`renderer/mount-settings-team.mjs`（并入 `mount-team.mjs`）。
- **批内件（新）**：`docs/batches/2026-10-10-login-entry-completion.test.mjs` **599**（9 用例：K1 · K2 · D1–D5b + D5c）。

**验证读数（原文）**
- 批内件：`node --test docs/batches/2026-10-10-login-entry-completion.test.mjs` ⇒ `ℹ tests 9 | ℹ pass 9 | ℹ fail 0`（EXIT 0）。
- B1 桌面定向件：`node --test docs/batches/2026-10-10-team-login-client-access-desktop.test.mjs` ⇒ `ℹ tests 10 | ℹ pass 10 | ℹ fail 0`（EXIT 0）。
- B1 跨端件：`…-ends.test.mjs` ⇒ `ℹ tests 19 | ℹ pass 17 | ℹ fail 2` —— 两红均属 **VSC 腿**（腿8a：`thincoder-vscode/webview/settings.js` 现无 `bindTeamControls()`；腿8b：`webview/chat-messages.js:167` 现为 `case "teamLoginResult": onTeamLoginResult(m); onWelcomeTeamLogin(m); break`，断言串 `case "teamLoginResult": onTeamLoginResult(m); break` 不再命中）；VSC 三档 mtime `2026-10-10T08:19:42–08:20:00Z`（≈ 本笔收尾前 ≤3 分钟）＝ **VSC 面在途改动**所致，本单零触该面 ⇒ 非本单因果（上抛父侧路由）。
- `node --check` × 21 件 ⇒ 全 OK。
- `node scripts/doc-check.mjs`（仓根）⇒ **EXIT 1**：悬空 **5**（全 = 已删档旧路径引用：`docs/core/design/API-CONTRACT.md:2011` ∥ `docs/core/design/TEAM.md:130` ∥ `docs/desktop/design/SETTINGS.md:491` ∥ `:504` ∥ `docs/desktop/design/UI.md:602` —— 父侧已登记收正轮）∥ **行宽 FAIL 2 行**：`docs/desktop/design/SETTINGS.md:322`（**416 字符** —— 16:20 轻通道笔同行）∥ `docs/server/requirements/PROJECT.md:310`（259）∥ **行数面差异 9 条**（报告态 ⇒ 回填轮清单）：`UI.md:515` `mount-team.mjs` 表 150 ⇒ 实读 **324**（差 174）∥ `UI.md:517` `mount-status.mjs` 43 ⇒ 45 ∥ `SETTINGS.md:345` `views/settings.mjs` 448 ⇒ **454** ∥ `:346` `settings-sections.mjs` 100 ⇒ 101 ∥ `:355` `mount-settings.mjs` 292 ⇒ **306** ∥ `:367` `settings.css` 306 ⇒ 348 ∥ `:370` `mount-settings-team.mjs` 盘无档（净删 ✓）∥ `RENDERER.md:328` `app.mjs` 338 ⇒ **342** ∥ `:338` `store.mjs` 369 ⇒ **374**。

**验收判据 ⇒ 落点台账（逐条在盘）**

| 判据 | 落点 | 件 |
|---|---|---|
| 段 16 三态 ∥ 序 ∥ 18 码 ∥ 零会话例外 ∥ 悬停 host | `views/statusline.mjs:89-91`（18 段）∥ `:118`（零会话例外）∥ `views/statusline-segments.mjs:238-245` | D2 |
| 活校验三值 ∥ 只读 ∥ 未登录零调核 ∥ 清位两处 | `thincoder-core/team.mjs:87-105` ∥ `src/main/team.mjs:42-46` ∥ `mount-team.mjs:87/144` | K1 · D1 · D4 |
| 面板三态 ∥ 关三路（Esc 捕获相）∥ 在途读 ∥ 差分门 ∥ 草稿保真 | `mount-team.mjs:194-206` ∥ `:254-263` ∥ `:266-308` ∥ `settings.css:314-332` | D4 |
| 通道 51 ⇒ 52（`team:verify` 末位）∥ `HANDLERS` 闭集 ∥ 头注同拍 | `preload.cjs:7/51` ∥ `ipc-registry.mjs:2/87` ∥ `ipc.mjs:2` | D1 |
| 卡降管理面（零登/退控件）∥ hub re-export ∥ 段态门归分派 | `settings-sections-team.mjs:119-125` ∥ `settings-sections.mjs:38` ∥ `views/settings.mjs:295` | D3 |
| 首启两路（两卡零预选 ∥ 同屏换取 ∥ 步闭集回落 ∥ 密码不申报 ∥ `[data-wizard-later]`） | `views/onboarding.mjs:48/76-142` ∥ `mount-onboarding.mjs:91-106/117-144` ∥ `store.mjs:306-312` | D5 · D5b |
| 回退 / 换路保真（已填保留 ∥ 密码恒清） | `mount-settings.mjs:243-248` ∥ `mount-onboarding.mjs:104` ∥ `views/onboarding.mjs:125-127` | **D5c** |
| 同名冲突提示并入步 2 头行（消费即清） | `views/onboarding.mjs:157-161` ∥ `mount-onboarding.mjs:63-76/164-165/176-179` | D5b |
| 词面（宿主 +1 键 ∥ 核字典投影零副本 ∥ +7 键 ×2 语） | `renderer/i18n.mjs:258/363` ∥ `core/i18n.mjs:74` ∥ `i18n-settings.mjs:109-115/198-204` | A 系 · K2 |

### 决策透明表

| # | 决策 | 依据 / 理由 | 形态 |
|---|---|---|---|
| 1 | 回退保真载体 = **残件并持**（非新增 state 片） | 设计句自带「沿 #604」⇒ 载体 = `[data-draft]` 残件；`inFlight` 门在非在途切换即弃 ⇒ 加窄例外「向导步切换（`wasWizard ∧ occupies`）⇒ 仅草稿面并持」（非向导径零改）。父侧 16:20 裁定：接受本实现，不改走 `providers.draft` 片 | 已披露 · 父侧批准 |
| 2 | 同名冲突「消费即清」操作化 = **离步 2 ∥ 退场 ⇒ 清** | 设计句只定「步 2 头行渲染同一 `team.notice`；消费即清」；若按「渲染即清」则下一次重绘（`loadModels` 落）即抹除 ⇒ 复归静默 ⇒ 取「该屏消费（离屏 / 退场）即清」（可见 ∥ 零陈值两全） | 已披露 · 待父侧复核措辞 |
| 3 | 卡锚 = 卡身 `[data-route-card]` + 行动钮 `[data-route]` | 设计句「卡锚 = `[data-route="team"]`」；VSC 同物 = `button[data-route="team"]` ⇒ 钮承锚（点击语义），卡身另给 `[data-route-card]`（选择面）；两锚俱在 | 已披露 |
| 4 | 已失效面**提示行退场**（单一状态行） | 若与失效行同屏 = 「未登录」与「已失效」两句相抵 ⇒ 取失效行单行 | 已披露（审计判非偏离） |
| 5 | `WIZARD_STEPS` 表住 `store.mjs` | 单源 + 零环（两消费方：`views/onboarding.mjs` · `mount-onboarding.mjs`） | 已披露 |
| 6 | 自铸文案 2 处 | `wizard.route.*` en 值（5 键）∥ `wizard.route.localAction`（zh「开始配置」/ en "Set up"）—— 设计句给 zh 词面，en 值自铸 | 已披露 |
| 7 | 件名 = `2026-10-10-login-entry-completion.test.mjs` | 沿「件名随批档」纪律（设计拟名带端别；本批 core + 桌面合一件 ⇒ 名随批档） | 已披露（父侧对账） |
| 8 | `app.mjs:14` 段计数 17 ⇒ 18 | advisor 复核轮 🔵 New（fix 轮扫面漏项）—— 已随轮 5 收正（单行注释） | 已修 |

**越声明面披露**：① `thincoder-desktop/renderer/views/onboarding.mjs` —— 我在 explore 审计的 FILES 枚举中漏列（**设计表内在册**：`SETTINGS.md` §3.2 ∥ `UI.md` §4.1 ∥ 批档 §2 受影响文件表 ⇒ 授权内、属枚举漏行，非越面）；② 两处非原估改动：`mount-settings.mjs` 的「向导步切换残件并持」窄例外（判据面实测必要——见决策 1）∥ `views/onboarding.mjs` 步 2 头行 + `mount-onboarding.mjs` `settleTeamNotice`（父侧 16:20 裁定后落）；③ `mount-team.mjs` 加「`resize` 重锚」（一行级鲁棒收正，advisor 🔵 建议内）。

### 审计与代码评审轮次与终态

| 轮 | 形式 | 范围 | 结论 |
|---|---|---|---|
| 1 | explore 偏离审计（只读子代） | 23 件 touched ∪ 四设计档指定章 | **CLEAN**（四类偏离零命中）+ 四条知会（`views/onboarding.mjs` 枚举漏列 ∥ 执行面未复跑 ∥ 件名差异 ∥ 锚形观察） |
| 2 | advisor 代码评审 · 首轮（全量） | 19 路径 ∪ 5 设计档 | **changes-required**：🔴 回退 / 换路保真未落 ∥ 🟡 同名冲突提示进步后不可见 ∥ 🔵×5（段计数残值 ∥ import 自述失实 ∥ 行数估漂移 ∥ 面板单径锚 ∥ 件时序脆性） |
| 3 | fix 轮（本席） | — | 🔴：`mount-settings.mjs`「向导步切换残件并持」+ 件 **D5c** 回路断言；🔵：段计数 3 处 ∥ import 自述 ∥ 面板两径同锚 + `resize` 重锚 ∥ `settle()` 三拍冲刷 |
| 4 | advisor 代码评审 · 复核轮 | fix 面 7 路径 | **changes-required**：唯「同名冲突并入步 2 载面」未落（🔴 —— 设计笔已生效而码 ∥ 件面未落）+ `app.mjs:14` 计数漏项（🔵 New）+ 行数回填归 §5（报告项）；其余 5 项已验 **Fixed** |
| 5 | fix 轮（本席 · 父侧 16:22 裁定后） | — | 同名冲突提示并入步 2 头行（渲染 ∥ 消费即清 ∥ 件断言「进步后词面在场」+「离步 2 清」）∥ `app.mjs:14` 计数收正 ⟹ 全项闭合 |

**终态 = clean**（本席射程内：两 🔴 ∥ 一 🟡 ∥ 六 🔵 全项 Fixed；报告项 = 设计档行数回填 ∥ 悬空 5（旧档名）∥ 行宽 2 行 —— 皆父侧面）。
**披露（非静默）**：advisor 复核第 3 轮**未跑** —— 轮 5 两项 fix 的判据面 = 父侧裁定原文（渲染点 + 消费时序 + 断言内容逐条指定）+ 本席机读（批内件 9/9 ∥ `node --check` × 21 全 OK）；如父侧要求独立复核，请派一轮。

**fix round 台账**（≤5 轮上限内）
- fix 1（轮 3）：`mount-settings.mjs` 向导步切换残件并持 ∥ `mount-onboarding.mjs` 档头自述 ∥ `mount-status.mjs:17` ∥ `app.mjs:74` ∥ `views/statusline.mjs:21/:32` ∥ `mount-team.mjs` 两径同锚 + `resize` 重锚 ∥ 件 `settle()` 三拍。
- fix 2（轮 5）：`views/onboarding.mjs` 步 2 头行 ∥ `mount-onboarding.mjs` `settleTeamNotice`（`setStep` / `finishWizard` / `onDismiss` 三径收束）∥ 件 D5b 两断言 ∥ `app.mjs:14`。

**上抛项（父侧路由）**
1. `…-ends.test.mjs` 两红（**VSC 腿**）：腿8a `bindTeamControls()` ∥ 腿8b `case "teamLoginResult": … break` 断言串 —— VSC 面在途改动（三档 mtime 08:19–08:20Z）所致；本单零触；请路由 VSC 面随正（或由 VSC 单收口轮随正断言串）。
2. **doc 面**：`SETTINGS.md:322` 416 字符（行宽 FAIL —— 16:20 笔同行断行）∥ 行数回填 9 条 ∥ 悬空 5（旧档名）—— 皆设计档 / 父侧笔面。
3. **一件待父侧复核措辞**：决策 2（「消费即清」操作化 = 离步 2 ∥ 退场 ⇒ 清）—— 若设计句须逐字锚定「渲染即清」，请回裁（当前实现取可见优先）。

### 交付摘要（eng-coder · CLI 面 · 2026-10-10）

**范围** = 本批 CLI 面（首启向导两路 ∥ `/team` 命令族 ∥ 状态段 teamHint）。`thincoder-desktop/**` ∥ `thincoder-vscode/**` ∥ `thincoder-core/**` ∥ server ∥ 设计档**零触**。

**落地面（13 件；行数 = 本轮实读·物理行）**
- **新增**：`thincoder-cli/src/tui/ask-steps.mjs` **61**（问句步进小件——步定义 ∥ 推进 ∥ 问句行构造 ∥ 掩码位；向导文本步与 `/team login` 两消费方共用）∥ `thincoder-cli/src/tui/cmd-team.mjs` **235**（`/team` 三子命令 + 会话内问句面 ∥ 登录成收尾三件转口：`completeTeamLogin` ∥ `syncProvidersFromDisk` ∥ `refreshTeamState`）。
- **改动**：`src/tui/wizard.mjs` **405**（route 首屏三行 + 说明行随光标 ∥ 团队三问步 ∥ 回退行 ∥ 保真）∥ `src/tui/render-frame.mjs` **487**（+`teamSegmentHint` 三态 ∥ 问句面标题/状态行分支）∥ `src/tui/index.mjs` **275**（装配：启动读 + 异步回填 ∥ 键面转口 ∥ 模型选定转口）∥ `src/tui/layout.mjs` **242**（overlay 第三支 ∥ 掩码输入框）∥ `src/tui/key-handler.mjs` **134**（分派守卫序 2/2b）∥ `src/tui/key-handler-modals.mjs` **130**（`handleTeamAskKeys` ∥ wizard route/团队步）∥ `src/tui/tui-state.mjs` **68**（`state.team` 切片 ∥ `state.teamAsk`）∥ `src/tui/timer-watch.mjs` **65**（`modalOpen` 第三支）∥ `src/tui/slash-commands.mjs` **192**（两表登记）∥ `src/cli/team-command.mjs` **246**（词面导出面——argv 行为零变）。
- **批内件（新）**：`docs/batches/2026-10-10-login-entry-completion-cli.test.mjs` **634**（18 用例：腿1 向导两路 7 ∥ 腿2 `/team` 8 ∥ 腿3 状态段三态 1 ∥ 腿4 模态族第三支 2）。

**验证读数（原文）**
- 批内件：`node --test docs/batches/2026-10-10-login-entry-completion-cli.test.mjs` ⇒ `ℹ tests 18 | ℹ pass 18 | ℹ fail 0`（EXIT 0）。
- 语法面：`node scripts/check-syntax.mjs`（`thincoder-cli/`）⇒ `check-syntax: 124 file(s) OK`；批内件 `node --check` ⇒ OK。
- 既有权威面：`node --test docs/batches/2026-10-10-team-login-client-access-ends.test.mjs` ⇒ 19 用例 ∕ 17 pass ∕ 2 fail —— 两红均 = **VSC 腿**（腿8a `bindTeamControls()` 未落 ∥ 腿8b `case "teamLoginResult"` 断言串），与桌面单 §5 同读数同因（VSC 面在途改动、本单零触该面）；**CLI 腿 1/5/7 全绿 ⇒ 既有 CLI 定向件不破**（两 red 非本单因果——上抛父侧路由）。
- 仓套件：`npm test`（`node test/run.mjs`）⇒ `test manifest is empty — zero tests = green`（2026-09-28 全清重置态——**非本单零跑**；收口轮仓套件全跑以父侧为准）。

**验收判据 ⇒ 落点台账（逐条在盘）**

| 判据（批档 §2 验收对照） | 落点（`thincoder-cli/` 起） | 批内件腿 |
|---|---|---|
| ① 首启两路（CLI 列表形 ∥ 零预选 ∥ 同屏换取 ∥ 「← 换一种方式」∥ 「以后再说」） | `src/tui/wizard.mjs`（route 屏 `27-34 ∥ 114-127`；回退行 `186-189 ∥ 262-272`；以后再说 = `cancelWizard`） | 腿1a · 1d · 1e · 1f |
| ② 登录成即用（失败四句逐字就地 ∥ 密码不保真） | `wizard.mjs`（`288-316`）∥ `cmd-team.mjs`（`124-131` ∥ `182-198`） | 腿1c · 1c2 · 2c · 2d |
| ③ 常显三态（未登录零注入负控 ∥ 已登录成员名+主机 ∥ 已失效句） | `render-frame.mjs`（`465-487`） | 腿3 |
| ④ 直达登/退（不经设置面） | `slash-commands.mjs`（`54 ∥ 97`）∥ `cmd-team.mjs`（`37-48`） | 腿2a · 腿4b |
| ⑤ `/team` 族（login ∥ logout ∥ status ∥ 掩码 ∥ 活校验） | `cmd-team.mjs`（`53-172`）∥ `ask-steps.mjs`（`20-48`） | 腿2b · 2c · 2e · 2f · 2g |
| ⑥ 吊销态词逐字 + `unreachable` 不判失效 | `render-frame.mjs:476` ∥ `cmd-team.mjs:65` | 腿2b · 腿3 |
| ⑦ 零新协议（CLI 面不涉通道 ∥ 不碰 server） | 本单零触 `thincoder-server/**` | — |
| 披露项 5（掩码 = 显示层变换·每字符 •｜提交值原样 ∥ `ask-steps.mjs` 单源达成） | `ask-steps.mjs`（`37-39`）∥ `layout.mjs`（`58-59`） | 腿1b · 腿2c · 腿4 |

**决策透明表**

| # | 决策 | 依据 / 理由 | 形态 |
|---|---|---|---|
| 1 | 键路由落 `key-handler*.mjs`（设计清单未列行） | 「模态族第三支」= 分派器 + 族体两处（仓内单一路由面）；必需 | 已披露 · 审计判必需 |
| 2 | 掩码落 `layout.mjs` 输入框 buf（设计清单未列行） | 回显 = 显示层变换；输入框渲染唯一所在（判据/变换消费 `ask-steps.mjs`——单源） | 已披露 · 审计判必需 |
| 3 | `timer-watch.mjs` `modalOpen` 计入 `state.teamAsk`（设计清单未列行） | #448① 同谓词（火面抑制 ∥ 关闭后补评估两消费点）；不加则模态期 timer 可送达开轮 | 已披露 · 审计判必需 |
| 4 | `src/cli/team-command.mjs` 仅加导出面（设计清单未列行 ∥ 边界句「argv 零变」） | 词面单源（判据「CLI = 单语直出同句」）：四失败句 ∥ 未登录句 ∥ 两一次性提示 ∥ 结果行首句 ∥ `renderState` 一处定义、TUI 面 import 逐字消费；argv 行为零变（出词 ∥ 退出码 ∥ 旗标逐字不动） | 已披露 |
| 5 | 团队步/问句面输入框预填留存值（地址 ∥ 账号；密码零预填） | `TEAM.md` §2.1「member…表单预填」（图形端表单同款）+ §3.1 保真判据在步进面的落法 | 已披露 |
| 6 | 回退把未提交的输入框内容收入字段（非掩码步）；掩码步即弃 | §3.1 保真判据「已填保留 ∥ 密码恒不保留」 | 已披露 |
| 7 | 败 ⇒ 停留于当前步（= 密码步）就地出词 + 输入框清空 | §3.1「就地出 + 停留可重试」字面；改地址/账号经回退再入（留存值在场） | 已披露 |
| 8 | provider 步回退行无行内键提示（团队步有） | 该行 = 标准列表行（键面在状态行图例 `render-frame.mjs:392`）等价同列表全行；「行文本须含可见提示」句靶 = 团队步的非标 ↑ 聚焦激活 | 已披露（评审 🔵3 同判非缺陷） |
| 9 | 批内件单档承载四腿 | 设计 §2「批内件（拟）」点名 `...-cli.test.mjs` 单档；同族桌面件 599 行同例；≤800 硬限 ✓ | 已披露（评审 🟡2 advisory） |

**审计与代码评审轮次与终态**

| 轮 | 形式 | 范围 | 结论 |
|---|---|---|---|
| 1 | explore 偏离审计（只读子代） | 13 件 touched ∪ 五档判据源 | **CLEAN**（四类盘点：部分实现 0 ∥ 静默简化 0 ∥ 文档漂移 1 低 ∥ 越声明面 5 件逐件判必需）+ 覆盖微隙 1（失败四句仅断两句） |
| 2 | fix 轮（本席） | 批内件 | 补 `腿1c2`（网络不可达 ∥ 本机配置写入失败两句）+ 腿2b `unreachable` 命令级断言 |
| 3 | advisor 代码评审 · 首轮（全量） | 13 路径 ∪ 5 档 | **pass**：🔴 0 ∥ 🟡 2（均非 must-fix）∥ 🔵 4；+1 范围外报告（`FEATURES.md` §2.9） |
| 4 | fix 轮（本席） | 批内件 | 🔵4 修（腿3 负控改真缺键态——原夹具同构 ⇒ 断言空转）∥ 🟡1 裁定不改（据下）∥ 余项报告 |

**终态 = clean（本席射程内）**：🔴 0；🔵4 已修（`cli.test.mjs:539-543`）；余为报告项。

**fix round 台账**
- fix 1（审计轮后）：`cli.test.mjs` 补 `腿1c2` + 腿2b unreachable 支（四句闭集与活校验三值全覆盖）。
- fix 2（评审轮后）：`cli.test.mjs` 腿3 负控改 `delete preBatchState.team` 真缺键态（原 `mk(undefined)` 与缺省切片同值 ⇒ 空转断言）。

**评审项裁定（不改者逐条给据）**
- 🟡1（Enter 拼形只收 `key.name === "return"`）：裁定**不改**——本单新面属「文本步族」（可打印键回落编辑族），最近先例 = 既有 wizard 文本步（`handleWizardKeys` 同只收 `return` + 同形守卫）；收三形者为列表步族/编辑族（守卫吞全键）。改之将与文本步族分道（Ctrl+J 由「换行」翻为「提交」）。主 Enter 径（`\r` ⇒ `return`）不受影响。
- 🟡2（批内件 634 行 > 500 advisory）：裁定**不改**——拆档与设计点名单档相抵；记批内约定 = 单元档随批次本地 ∥ 不进仓套件 ∥ 单档承载全腿。
- 🔵5（设计 §1 括注「校验」与实现「交核分类」错位）∥ 🔵6（设计档「（拟新增）」标记与批档 CLI 行数估未回填）：**文档笔域**（设计/父侧），归实施记录同拍回填。
- 范围外注（请父侧路由）：`docs/cli/requirements/FEATURES.md` §2.9——命令清点 27 ⇒ 28（System 行补 `/team`）+ 登记面指针行号位移（`TUI-COMMANDS.md` §5.1 声明「当前清点 = FEATURES.md §2.9」）。

---

### 交付摘要（eng-coder · VSC 面 · 2026-10-10）

**范围** = 本批 VSC 面（`thincoder-vscode/**`；桌面 ∥ CLI ∥ core ∥ server ∥ 设计档零触——`team.mjs` 转口按设计 +一件）。

**落地面（15 件 + 批内件；行数 = 实读内容行）**
- 宿主：`src/extension/team-surface.mjs` **189**（**新档**——item 三态 ∥ 命令 `thincoder.team` 登/退流 ∥ 成拍复读+双推送 ∥ 失败四句 ∥ `refreshTeamSurface` 随动出口）∥ `src/extension/team.mjs` **45**（+`teamVerify` 转口 = 四件）∥ `extension.mjs` **211**（`registerCommand` + activate init ∥ deactivate dispose）∥ `package.json` **161**（+1 contributes.commands：`thincoder.team`）∥ `src/extension/panel-messages-settings.mjs` **285**（成拍径 +`refreshTeamSurface()`——设计清单外接线，已披露）∥ `locales/zh.json` **317** ∥ `locales/en.json` **317**（+9 键 ×2 语 ∥ `welcome.skip` 值改「以后再说」/「Later」∥ 死键 `settings.team.status` 净删）。
- webview：`webview/index.html` **132**（路由屏两卡 + 同屏换取区；本地表单原样迁入）∥ `webview/onboarding.js` **194**（路由机 ∥ 三字段表单 ∥ 回退保真 ∥ 板面钩）∥ `webview/state.js` **159**（+19 ctx 件——新件全 `?.`/空判，旧夹具零抛）∥ `webview/chat-messages.js` **279**（`teamLoginResult` 双消费）∥ `webview/settings-team.js` **133**（卡降管理面：三读数 + 未登录句；零控件）∥ `webview/settings.js` **203**（`bindTeamControls` 净删）∥ `webview/settings.css` **485**（路由/换取值 ∥ 管理面读数行三段）。
- 批内件（新）：`docs/batches/2026-10-10-login-entry-completion-vsc.test.mjs` **470**（**15 用例**：W1–W8 板面/词面 ∥ E1–E7 宿主 item/命令流——真链：vscode 模块桩 + 临时 config 缝 `_setConfigPathForTest` + 127.0.0.1 HTTP 桩）。

**验证读数（原文）**
- 批内件：`node --test docs/batches/2026-10-10-login-entry-completion-vsc.test.mjs` ⇒ `ℹ tests 15 | ℹ pass 15 | ℹ fail 0`（EXIT 0）。
- 既有件（全跑）：`2026-10-10-login-entry-completion.test.mjs` 9/9 ∥ `2026-10-10-desktop-behavior-residues.test.mjs` 10/10 ∥ `2026-10-10-vsc-consistency.test.mjs` 13/13 ∥ `thincoder-vscode/test/smoke-settings.mjs` PASS ∥ `thincoder-vscode/test/run.mjs` 空清单绿。
- **先存红（撤离对照验证：`git stash push` 我的 13 件后同红 ⇒ 与本席零因果）**：`2026-10-09-provider-default-model-purge-vsc.test.mjs` T6 ∥ `2026-10-07-provider-config-parity-vsc.test.mjs` V6 ∥ `2026-09-29-perf-residuals.test.mjs` ∥ `2026-09-29-render-perf.test.mjs` ∥ `2026-10-01-audit-remediation.test.mjs` ∥ `2026-10-02-record-shape-residuals.test.mjs`。另 `2026-09-29-stall-indicator-b.test.mjs` B4（17 ⇒ 18） = 桌面面 08:25:02Z 刚落 `statusline.mjs` 的 `team` 段所致（实读档面 + mtime 对照——非本席）。
- `node --check` × 13 件 + `JSON.parse` × 3 件（两语 locales ∥ package.json）⇒ 全 OK。

**验收判据 ⇒ 落点台账（逐条在盘）**

| 判据（`WEBVIEW.md` §4.11/§4.12 · `TEAM.md` §2.5/§2.6 · `SETTINGS.md` §2.20 条 6） | 落点 | 腿 |
|---|---|---|
| 首启板两路：两卡锚 `button[data-route=…]` ∥ 零预选 ∥ 同屏换取 ∥ 回退保 server/username ∧ 密码清 | `webview/index.html:78-124` ∥ `webview/onboarding.js:41-88` | W1–W3 |
| 本地路既有表单逐字等价（preset 直发 ∥ custom 交棒） | `webview/onboarding.js:151-166` | W4（负控） |
| 团队提交 `teamLogin` 三字段（server/username trim ∥ 密码零加工）+ 失败四句/同名冲突就地 + 板退场闸 | `webview/onboarding.js:88-96/186-194` ∥ `chat-messages.js:167` | W5 · W6 |
| item 三态（未登录入口 ∥ 成员名 ∥ 已失效 + warning 底）∥ tooltip = host + 端标签 ∥ priority 98 ∥ 点击 ⇒ 命令 | `src/extension/team-surface.mjs:56-91/166-171` | E1 |
| 命令流：起手活校验 ⇒ 未登录/已失效 ⇒ 三问（预填）⇒ `teamLogin`；已登录 ⇒ QuickPick ⇒ `teamLogout`；成 ⇒ 复读 + item + 双推送 | `team-surface.mjs:104-160` | E2–E4 |
| `verify` 清位（token 缺席 ⇒ 即清 ∥ 重登成 ⇒ 清）——两出口（命令径 ∥ webview 成拍径） | `team-surface.mjs:96/132/175-181` | E4 · E7 |
| 失败四句 ∥ 两提示句逐字（码不携文） | `team-surface.mjs:28-38` ∥ `locales/zh.json:306-312` | E5 |
| 卡降管理面（端标签 + 详情三读数 + 未登录句；零登/退控件）∥ 两回执消费位保留 | `webview/settings-team.js:51-72/116-132` ∥ `webview/settings.js:199-201` | W7 |
| 零新协议（无新端点 ∥ 无新消息类型）∥ 转口四件 ∥ 词面两语齐 + 值改登记 | `team.mjs:18-45` ∥ `extension.mjs:21-22/115-116/176-178/202` ∥ `package.json:85-88` | E6 · W8 |

### 决策透明表（VSC 席）

| # | 决策 | 依据 / 理由 | 形态 |
|---|---|---|---|
| 1 | VSC 词键自域 `welcome.route.*` / `welcome.backToRoute`（桌面用 `wizard.route.*`） | 设计 §4.11 只钉字面、未钉键名；键名归各端 i18n 域（单端单例）——字面两语逐字同源（`.test.mjs` 以 zh/en 实件对拍） | 已披露 |
| 2 | 团队卡行动钮词 = `settings.team.login`（「登录」） | 设计未点名卡钮词；批内复用既有键（零新键） | 已披露 |
| 3 | 板面团队表单**零预填** | 设计 §4.11 未要求板面预填；留存值预填 = 登/退流径（`TEAM.md` §2.6「点击即登录面…预填自留存值」——item 面已实装）；板面 = 首启面（无留存值）。原残留的两行惰性预填（读 `providerStatus` 载荷的 `server`/`member`——载荷实无该两键）经评审 🔵 后净删 | 已修（评审轮 2 复核） |
| 4 | 卡内 `#team-notice` + 两回执消费位保留 | §2.20 只裁「登录表单与退出钮退场」，未撤「回执形与一次性提示」；协议表行 29/31 消费位不在本批死 | 已披露 |
| 5 | `panel-messages-settings.mjs` 成拍径 +`refreshTeamSurface()` | 设计接线清单未列该档：webview 登/退成拍后 item 须随动（第二写径），否则常显面滞后一拍。零新协议 ∥ 零写盘（仅读 `teamStatus()` 渲染） | 已披露（父侧任务书载明「已披露」） |
| 6 | 死键 `settings.team.status` 两语净删 | 本席改动杀死其唯一消费点（卡内状态行退场）——死键随实现净删（沿 2026-10-09 清除批先例） | 已披露 |
| 7 | 命令标题 = `ThinCoder: Team Login / Logout` | 设计未点名；沿 `contributes.commands` 既有 `ThinCoder: …` 命名面 | 已披露 |
| 8 | `memberText` 两脸取设计字面 `??` | 设计逐字 = `member.name ?? member.username`；评审 🔵 后卡侧由 `\|\|` 归一为 `??`（两脸同源） | 已修（评审轮 2 复核） |

### 审计与代码评审轮次与终态（VSC 席）

| 轮 | 形式 | 范围 | 结论 |
|---|---|---|---|
| 1 | explore 偏离审计（只读子代） | VSC 触档 15 件 ∪ 四设计面 + 批档 §2 | **DEVIATIONS**（3 条低危）：① `memberText` 用 `\|\|` 非设计字面 `??`；② 设计档 `WEBVIEW.md:236` 括注 `settings.team.reason.*` = 死指针（实件族 `settings.team.fail.*`）；③ `refreshTeamSurface` 三行 = 设计/批档清单外（已披露面，复核零新协议 ∥ 零写盘） |
| 2 | fix 轮（本席） | — | ① `??` 归一（`team-surface.mjs:59`）；④ 板面惰性预填 + `_teamVisited` 净删 + 注释收正（`onboarding.js:27/63`）；⑤ 批内件死 helper `waitFor` 净删；⑥ 卡侧 `memberText` 归一 `??`（`settings-team.js:54`）；+ 回归腿 **E7**（`refreshTeamSurface` 清位） |
| 3 | advisor 代码评审 · 首轮（全量） | 15 件 ∪ 四档 | **changes-required**：🔴×1（`SETTINGS.md` §1 行与 §2.20 条 6 相抵——**文档层**，设计/父侧笔域）∥ 🟡×2（`team-surface.mjs` webview 径 `verify` 清位缺口 = **代码**（must fix）∥ `TEAM.md:118-119` 旧卡面两行 = 文档层）∥ 🔵×4 |
| 4 | fix 轮（本席） | — | 🟡（代码）：`refreshTeamSurface()` 内 `_verify = null`（`team-surface.mjs:179`）+ 回归腿 E7（防「已失效」残显）∥ 🔵：惰性预填净删 ∥ `waitFor` 净删 ∥ 两脸 `??` 归一。🔴/🟡（文档两项）不在本席射程（设计档笔域） |
| 5 | advisor 代码评审 · 复核轮 | fix 四件 | **pass**：4 项全 **Fixed**（逐项 `file:line` 复核 + 调用点机检「仅成拍调用、败拍零误清」）∥ 🔵 New ×1（件头 E 腿枚举漏 E7）⇒ 当场收（件头 `:16` 补 E7） |

**终态 = clean**（本席射程内：🟡×1 代码项 + 🔵×5 全项 Fixed/净删；射程外 = 设计档笔域 2 项 + 桌面条件红，见下）
**披露（非静默）**：评审轮数上限内用了 2 轮 advisor（首轮全量 + 复核轮），无未复核 fix。

**fix round 台账（≤5 轮上限内）**
- fix 1（轮 2，审计驱动）：4 项（见上表轮 2）。
- fix 2（轮 4，评审驱动）：清位 + E7 ∥ 预填/死码/算子三 🔵。

**上抛项（父侧路由）**
1. **B1 跨端件 `docs/batches/2026-10-10-team-login-client-access-ends.test.mjs` 腿8a/8b 随正**（父侧代改——写闸拒跨批）：精确目标形态见交付报告（下附报单）。
2. **设计档回填 3 项**（VSC 面残值）：`docs/vsc/design/SETTINGS.md:20`（§1 行与 §2.20 条 6 相抵——登录表单/两钮已退场但 §1 仍载）∥ `docs/core/design/TEAM.md:118-119`（`settings-team.js`/`settings.js` 两行仍载 B1 期形态 `bindTeamControls`）∥ `docs/vsc/design/WEBVIEW.md:236` 括注死指针（`settings.team.reason.*` ⇒ 实件族 `settings.team.fail.*`）。
3. **登记（🔵 非阻断）**：`webview/settings.css` 485 行（距 500 建议线 15 行）——下次触碰该样式族者处置（本批不动）。

**VSC 侧动止声明**：本席至此**不再改 VSC 面任何文件**（父侧 8a/8b 报单条件下可落）。

### fix 轮（问题号 1 · 父侧复跑与 §5 读数不一致 · 2026-10-10 · eng-coder · 单件定修）

**对象** = `docs/batches/2026-10-10-login-entry-completion-cli.test.mjs`（夹具自检实例判定）。**产品码零触**（`thincoder-cli/**` ∥ `thincoder-core/**` ∥ `thincoder-vscode/**`）；零腿断言改动；设计/需求档零动。

**根因（实证 · 父侧已裁：全收本席 ③，其「取 realpath 侧」配方收回）**：
- 旧自检 `assert.equal(cfgIo, direct)`（对象同一性 · `:59`）**仅缺省加载器下成立**：缺省 realpath 归并 ⇒ junction ∥ 直路 ∥ 包解析 = 单实例；`--preserve-symlinks` 下两面分体、且 **CLI 源码（包解析）读的正是 junction 面**（探针：缝设 junction 面 ⇒ CLI 链读到；直路 = 另实例）⇒ 该断言在旗标态必红。
- 父侧首轮读数（`tests 1 ∥ pass 0 ∥ fail 1` @`:59`）为**旗标环境**读数（本席逐字复现——旧件同环境同读数）；缺省环境旧件 18/18 ⇒ 差异归因加载器旗标，非文件缺陷。
- 落法：缝**保持 junction 面取件**（两态皆中；realpath 配方旗标态脱缝——会读写真实用户配置，故撤）。

**改动（file:line）**：① `:28` import +`realpathSync`；② `:20-23` ∥ `:40-41` 注释随正（解析面机制两态说明）；③ `:58-74` 自检重写 = **行为面守卫**（缝设 `cfgIo` ⇒ CLI 链 `team.refreshTeamState({})` 须读到探针值——只读 ∥ 零网络 ∥ 临档自清）+ **realpath 等价**（`realpathSync(junction)` === `realpathSync(thincoder-core)`）；对象同一性断言退场（环境敏感）。

**双态复跑读数（原文 · 冻结件上 · 仓根）**：
- 态A 缺省（clean shell）：`node --test docs/batches/2026-10-10-login-entry-completion-cli.test.mjs` ⇒ `ℹ tests 18 ∥ ℹ pass 18 ∥ ℹ fail 0`（EXIT 0）。
- 态B `NODE_OPTIONS=--preserve-symlinks` 同命令 ⇒ `ℹ tests 18 ∥ ℹ pass 18 ∥ ℹ fail 0`（EXIT 0）。
- `node --check` 同件 ⇒ OK（exit 0）。

**终态 = clean**（单件 ∥ 双态全绿；审计/advisor 轮未跑——父侧本轮定点修复口径，判据 = 双态实跑）。
**披露**：诊断用临时探针件 `.thincoder/tmp/instance-probe.mjs` 已删（零残留）。

### fix 轮（问题号 1 · 续 · 大小写无关 · 2026-10-10 · eng-coder · 单件定修）

**对象** = `docs/batches/2026-10-10-login-entry-completion-cli.test.mjs`（单件）。产品码零触（`thincoder-cli/**` ∥ `thincoder-core/**` ∥ `thincoder-vscode/**`）；18 腿断言 ∥ 行为面守卫判据零改；设计/需求档零动。

**根因（实证 · 与本轮任务书所述机制有别——以实测为准）**：
- 小写盘符缺省态的红**不在行为面守卫**：自检①（缝 ⇒ CLI 链行为判）实测命中（探针全组合 HIT）——缺省加载器把 junction ∥ 直路 ∥ 各大小写变体归并为单实例。
- 红 = 自检②（realpath 等价）的**串面**：普通 `realpathSync` 对真档保留输入盘符大小写——junction 侧返回目标形 `D:\…`，直路侧保留输入 `d:\…` ⇒ 小写盘符调用时两串相异、断言假红（实测差异：`D:\teamcode\thincoder\thincoder-core` ≠ `d:\teamcode\thincoder\thincoder-core`）。
- `--preserve-symlinks` 面：串即键（不 realpath）——同档大小写不同 = 两实例（探针：`jraw ≠ jcan`）；夹具一贯取 junction 面 ⇒ 守卫两态皆中，但既以串为键即以大小写归一为稳。
- 落法：ROOT 取 `realpathSync.native`（句柄派生——盘符恒规范形）⇒ 全部派生导入 URL 与 CLI 图两侧同串；自检②两侧同取 `.native`（普通 `realpathSync` 不足以归一——已证）。

**改动（file:line）**：① `:34-37` 定位逻辑改 `ROOT_RAW`；② `:38-42` 新增归一注 + `ROOT = realpathSync.native(ROOT_RAW)`；③ `:70-81` 自检①探针块包 `try/finally`（复位 ∥ 清档进 finally——评审 🔵3）；④ `:84` 注释措辞收正（「两串相异 = 假红」——评审 🔵4）；⑤ `:85` 自检②两侧同取 `.native`（核心）；⑥ `:593` 腿4 标题错字「描码」⇒「掩码」（评审 🔵2）；⑦ `:23-24` ∥ `:46-48` 注释随正。

**三态双验读数（原文 · 冻结件 · 仓根 `thincoder/`）**：
- ① 大写盘符缺省：`cd /d D:\teamcode\thincoder && node --test docs/batches/2026-10-10-login-entry-completion-cli.test.mjs` ⇒ `ℹ tests 18 ∥ ℹ pass 18 ∥ ℹ fail 0`（EXIT 0）。
- ② 小写盘符缺省：`cd /d d:\teamcode\thincoder && …` ⇒ `ℹ tests 18 ∥ ℹ pass 18 ∥ ℹ fail 0`（EXIT 0）。
- ③ 小写盘符 + `NODE_OPTIONS=--preserve-symlinks` ⇒ `ℹ tests 18 ∥ ℹ pass 18 ∥ ℹ fail 0`（EXIT 0）。
- 每态复跑两遍（双验）全绿；`node --check` 同件 ⇒ OK。

**审计与代码评审轮次与终态**

| 轮 | 形式 | 范围 | 结论 |
|---|---|---|---|
| 1 | explore 偏离审计（只读子代） | 该件 ∪ 批档 §2/§5 | **CLEAN**（四类零命中；其无执行/git 面自述限界——三态读数由本席实跑） |
| 2 | advisor 代码评审（首轮 = 全量） | 该件 ∪ 批档 + 两档 CLI 设计 | **pass**：🔴 0 ∥ 🟡 1（行数——在册裁定、非 must-fix）∥ 🔵 4 |
| 3 | fix 轮（本席 · 应评审） | 该件 | 🔵2/3/4 三项落（标题错字 ∥ try/finally ∥ 注释措辞）；🔵5 = 报告项（即本条记录）；🟡1 维持（已裁不重开） |
| 4 | 复跑（fix 后 · 双验） | 三态 | 全绿（终态读数如上） |

**终态 = clean**（🔴 0；🔵×3 已修 ∥ 🔵×1 报告项 ∥ 🟡×1 已裁）。
**披露（非静默）**：① 诊断探针 `.thincoder/tmp/probe-casing.mjs` 已删（零残留）；② 任务书所述「行为面守卫脱缝」与实测不符——实红为自检②串面（根因条详）；③ 评审席无运行面——三态读数为本席实跑原文。

**fix round 台账**（≤5 轮上限内）
- fix 1（核心）：ROOT `.native` 归一 ∥ 自检②两侧同取 `.native`。
- fix 2（应评审）：探针 try/finally ∥ 注释措辞 ∥ 腿4 标题错字。

**上抛（父侧）**
1. `[上抛·知会]` §1 机制句建议收正：「行为面守卫脱缝」不成立（守卫命中）——实测红 = 自检②串面（普通 `realpathSync` 对真档保输入盘符大小写）；同节「复跑统一用大写盘符」教训可随本轮降级为可选——该件已大小写无关（小写调用不再假红）。
2. `[上抛·知会]` §5 上一轮 fix 条（`:518-522`）为时点记录（append-only）；本轮记录 = 本条（含三态读数）——§6 收口时以本条为准。

## §6 验证与收口（父代理）

### 6.1 验证读数（父侧实跑 · 大写盘符绝对路径）

| 件 | 读数 |
|---|---|
| `…-login-entry-completion.test.mjs`（桌面板件） | **9/9 ✓** |
| `…-desktop-behavior-residues.test.mjs` | **10/10 ✓** |
| `…-team-login-client-access-ends.test.mjs`（B1 跨端件） | **19/19 ✓**（父侧随正 8a/8b 后复跑） |
| `…-login-entry-completion-cli.test.mjs` | **18/18 × 三态**（大写 ∥ 小写 ∥ 小写+`--preserve-symlinks`——父侧复跑，#153 修后） |
| `…-login-entry-completion-vsc.test.mjs` | **15/15 ✓** |
| 通道计数随动 4 件（本批因果——新增通道 `team:verify`） | 3 件全绿 ∥ `parity-b10-ui-w3` = 18/19（余红 S11 → 归 #1245） |
| 仓套件（三仓：cli ∥ desktop ∥ vscode） | `npm test` ⇒ **空清单（零用例 = 绿）**（2026-09-28 全量 reset 口径）——本批验证以批内件为准 |

### 6.2 集成面

本批 = 登录入口 ∥ 状态显示 ∥ 团队转口（无集成长链改动）；集成场景：**不新增**，既有场景不受影响的判据 = 上表读数 + 三仓套件空清单口径（如实）。

### 6.3 结算清单

- 段齐 ✓：§1（含 16:38/16:48/17:01 父侧注）∥ §2 设计 ∥ §3 评审 ∥ §4 批准 ∥ §5 实施（三舱 + 三 fix 轮）∥ §6 本块。
- 状态行：§1 ⇒ 已收口 2026-10-10（随 close 落）。
- 计数：三端交卷（桌面+core ∥ CLI ∥ VSC）∥ 批内件 4 件（桌面 ∥ 跨端 ∥ CLI ∥ VSC）∥ 随正件逐处见 §5。
- 指针：需求档 §5 成员面块 ✓ ∥ CLI `FEATURES.md` §2.9（27 ⇒ 28 ✓ 已收正）∥ 设计档回填 = #155 轮（在飞）。
- 变更记录：`FEATURES.md` ✓ ∥ 需求档 ✓ ∥ 设计档（#155）。
- **未清项（如实）**：① #1212 台账行 = **在途**（交付齐；余「用户验收」一条——用户 14:39「不能收口」条件）；② #1240/#1241/#1245 = 面-wide 红清理轮（本批因果 4 件已随本收口，余项入轮）；③ **T-DSK66 真机走查 = 归用户**。

### 6.4 台账

- #1229–#1232：逐态实查（待讨论 ∥ 待设计 ∥ 在途 ∥ 待核销 × 各 board）**零命中** ⇒ 此前已收口（无待办残留）。
- **#1212**：待设计 ⇒ **在途**（交付齐——余「用户验收」；验收后走 待核销 ⇒ 已核销）。
- 本批新挂：**#1245**（红面清理轮）✓ ∥ #1242（设计档回填，= #155 轮）✓。

### 6.5 结算行（ledger query 面）

本批：「登录面补全」= 三端交卷 ∥ 批内件全绿 ∥ 待办 = **用户验收** + 清理轮（#1245）+ 回填轮（#155）+ 真机走查（T-DSK66，归用户）。
