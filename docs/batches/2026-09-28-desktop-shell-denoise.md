# 2026-09-28 · desktop-shell-denoise
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 走查反馈「桌面端页面上线条框框太多，显得非常杂乱」→ 06:36 裁定「先只做外壳」→ 06:43 选定 ② 整壳降噪（对照 mock `denoise-02-chrome.png`）→ 06:44「开工」；落点 = 需求档 §4 D24 · 台账 #493。
> 台账 = #493（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

- 用户 2026-09-28 06:30 桌面端走查反馈（原文）：「桌面端页面上线条框框太多，显得非常杂乱，」；
- 06:36 父侧三选项（① 仅外壳 ② 外壳+内容块 ③ 点名几处）⇒ 用户裁定：「**先只做外壳**」——内容面守 D21「值以 VSC 为准」不动；
- 06:43 选定（对照 mock 四态实拍）：「**02那张图更符合我预期**」（= 整壳降噪 V2）；
- 06:44：「**开工**」。

### 1.2 现状家底（父侧实读 · 06:3x）

外壳面从未入任何批射程（在途批 `2026-09-28-desktop-vsc-visual-parity.md` 明文「外壳零动」）。现状描边族：

- 容器四卡：`.rail / .session / .pool / .status`（`renderer/styles.css:93-102` · 1px `--line` + `--radius`）；
- 骨架分隔线：`.rail-head` 底线（`styles.css:116`）· `.session-head` 底线（`:131`）· `.tabbar` 底线（`:354`）· `.composer` 顶线（`renderer/chat.css:267`）；
- 控件族：`.head-field` chips（`styles.css:435-441`）· `.rail-cancel / .rail-confirm`（`:296-306`）· `.tabbar-cancel / .tabbar-confirm`（`:407-415`）· `.pool-toggle`（`renderer/pool.css:31`）· `.pool-item`（`pool.css:63`）· `.chat-backfill / .chat-pill`（`chat.css:99/112`）· `.composer-interrupt / .chat-copy-block / .chat-copy-last`（`chat.css:282-291`）；
- 滚动条：零样式（浏览器默认皮肤）；
- 设置面板（`renderer/settings.css`）：同款满框。

### 1.3 定案（V2 整壳降噪 · 对照 mock）

- 探针 = `thincoder/.thincoder/tmp/desktop-denoise-probe.mjs`（CSSOM 注入式模拟 · 产品文件零改 · 页错误 0 · 注入/回退有机读读数：chip/rail 边框 `rgb(223,227,232)` → `rgba(0,0,0,0)` → 回退复原）；
- 四态截图 = `thincoder/.thincoder/tmp/denoise-00-before / 01-controls / 02-chrome / 03-blocks.png`（同机位同滚位）；
- 选定 = **02-chrome（V2）**。规则集（mock 原文，设计轮据此定形逐值表）：

| # | 规则 | mock 选择器 |
|---|---|---|
| R1 | 控件静息去描边（保布局位） | `.head-field` · `.chat-backfill` · `.chat-pill` · `.pool-toggle` · `.rail-cancel/.rail-confirm` · `.tabbar-cancel/.tabbar-confirm` · `.composer-interrupt` · `.chat-copy-block` · `.chat-copy-last` |
| R2 | 容器去框 | `.rail · .session · .pool · .status` → `border-color: transparent` |
| R3 | 骨架去线 | `.rail-head / .session-head / .tabbar` 底线 + `.composer` 顶线 |
| R4 | 池条目去框改底色 | `.pool-item` → `background: var(--bg)` |
| R5 | 活动标签改底色态 | `.tabbar-item[data-active="1"]` → accent 14% 底 + accent 字色 |
| R6 | 滚动条细化 | 10px / 圆角 thumb / 半透明退让色 / 透明轨道 |

- 未采 = **03-blocks**（块壳去框）——消息块壳保留；
- **交互态**（hover / 聚焦）mock 未覆盖 ⇒ 归设计轮逐控件定形（D24 要求「交互态显形」）。

### 1.4 边界（写死）

- **内容面零动**（守 D21 值源：代码块花框 / 表格格线 / 行内码底等）；**布局与信息层级零动**（纯视觉皮肤）；交互语义零动；
- 保留 = 输入框细边（可交互面）· 审批 / 提问 / 计划卡语义强调框（`chat.css:133-255`）· 消息块壳 `.block`（`chat.css:13-19`）；
- 设置面板**同规则带上**（用户未见 mock 图；父侧默认——用户后续剔除此面则另裁）。

### 1.5 排期与在途避让

- 设计先走；**实施排期 = 两在途批收口之后**——`2026-09-28-desktop-vsc-visual-parity.md`（视觉对齐 · §6 待收口）与 `2026-09-28-statusline-align.md`（状态栏 · 修正轮中）均在另一会话（executor `15884-…`）手里；同片文件面（`styles.css` / `UI.md`）避让；
- 交叉注：状态栏批会把模式四位移住状态行行首、会话头回三值 ⇒ 本批头区设计以其实施后形态为准。

### 1.6 落点与下一步

- 需求档 = `docs/desktop/requirements/PROJECT.md` §4 **D24**（已落 L154）+ 变更记录（L223）；台账 = **#493**（在途）；
- 下一步 = 设计（eng-designer：本批 §2 + `docs/desktop/design/UI.md` 外壳视觉语言）→ 用户点火评审 → 批准 → 实施。

### 1.7 授权（用户 2026-09-28 07:13）

用户原话：「剩下的你自动跑完吧。」**射程** = 本批全链：设计评审点火 / §4 代签 / 修正轮与实施轮派发 / 收口核销提交推送——父侧全自动执行，不必逐次请点。**自缚四条**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 每次代签在 §4 写明「父侧代签（用户 07:13 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需要**新范围**（射程外条目点火）或**用户口径裁决** ⇒ 停下等用户；④ 破坏性 / 不可逆动作照旧先停。

### 1.8 评审轮 1 裁定表（父侧 · 依据 = 本档 §3 轮次 1 · changes-required 9 条）

| 号 | 级别 | 处置 | 说明 |
|---|---|---|---|
| 1 | 🔴 | **Fixed**（修正轮） | 保留面负向锁值面收正——`.approval-card` / `.question-card` = `var(--accent)`（语义强调框）；负向锁拆两值列 |
| 2 | 🟡 | **Fixed**（修正轮） | `styles.css` 现行行数 463 ⇒ **实读 467**（`.rail-ledger-notice` 已插 :173-176——他批已落）；后半段坐标整体 +4；改后预期 ≈481 ⇒ **≈485** |
| 3 | 🟡 | **Fixed**（修正轮） | 补两条拆分评估：① `styles.css` 467 ⇒ ≈485（< 500 硬限 ⇒ 就地改 · 破限预案在册）② `views-locks` 280 ⇒ ≈320 处置结论 |
| 4 | 🟡 | **Fixed**（修正轮） | `.chat-pill` hover / 按下取值补全；聚焦句第三值（`--hover-bg-strong`）补齐或明示不随落 |
| 5 | 🟡 | **Fixed**（修正轮） | UI.md 旧批注（可见面修复 :78/:80/:83）加取代指针（免实施 / 复核据旧判据反判） |
| 6 | 🔵 | **Fixed**（修正轮） | `.rail-rename-input` 保留面点名（是否入负向锁 = 修正轮定） |
| 7 | 🔵 | **Fixed**（修正轮） | 设置面计数改记「9 面（6 改 + 3 保留）」 |
| 8 | 🔵 | **Fixed**（修正轮） | 滚动条判据补前提 / 两支形 |
| 9 | 🔵 | **Fixed（父侧直接执行 · 已落）** | 需求档 §3.5 同号 ⇒ §3.5b（L77 收正 + 变更记录 L233） |

**上抛处置（父侧裁）**：① UA select 皮肤化 = **维持选定形**（暂不皮肤化；后续点名再立）；② `[data-slot="info"]` 顶线 = 本批不动维持；③ 设置面 = 保留（用户未剔）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 + 修正轮 1（评审轮 1 九条：发现 1–8 逐号点修已落 · 发现 9 = 需求档侧父侧已落）· 值表单源 = UI.md §1「本批注（外壳视觉降噪 · D24）」· 上抛 3 + 登记 1 · doc-check 净增 0（悬空 47 / 行宽 36 = 基线））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

需求 §4 **D24**（外壳视觉降噪 · 台账 #493）——本批覆盖六件：① **静息描边归零**（四族 = 容器 4 / 骨架线 4 处 / 控件族 **11 选择器** / 池条目 1）② **交互态定形**（mock 未覆盖 ⇒ 本注定形：hover / 按下 / 聚焦 + 活动态）③ **滚动条皮肤**（全局 · 4 规则）④ **设置面映射**（同规则带上 · 9 面 = 8 改 + 1 零动）⑤ **保留面 + 本批不动**（逐条给由）⑥ **验收三件**（静息描边锁 / 真机 hover·聚焦读数 / 改前改后对照）。
**值表单源** = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」（本节只给决策 / 文件 / 用例面，不复述值表 —— D2）。
**边界（不改）**：内容面（守 D21 值源 = `docs/render-core/design/RENDER-CORE.md` §5 · `thincoder-desktop/renderer/core.css` 零改）· 消息块壳 `.block` · 审批 / 提问 / 计划卡 · 输入框细边 · 布局与信息层级（去描边一律 `border-color: transparent` **保位** ⇒ 零几何位移）· 交互语义零动 · 零新变量 / 零新依赖 / 零新文件（分档预案见「尺度」）。

### 值面骨架（值表住 UI.md 本批注 · 本表只给族架）

| 族 | 规模 | 静息 | 交互态（本注定形） | 落点 |
|---|---|---|---|---|
| 容器族 | 4 | `1px solid transparent`（保位） | —（非交互面） | `renderer/styles.css:93-102` |
| 骨架线族 | 4 处 | 同上（保位） | — | `styles.css:111-117` / `:128-132` / `:349-357` · `renderer/chat.css:261-268` |
| 控件族 | 11 选择器 | `1px solid transparent`（保位） | hover `--hover-bg` · 按下 `--hover-bg-strong` · 聚焦 `outline: 2px solid var(--accent)` + offset `-2px` | `styles.css` / `chat.css` / `renderer/pool.css` 各该控件段（逐一 = UI.md 本批注项 1 / 项 2） |
| 池条目 | 1 | border transparent + 底 `var(--bg)` | — | `pool.css:57-65` |
| 标签活动态 | 1 处二值 | — | 底 `color-mix(in srgb, var(--accent) 14%, transparent)` + 题字 `var(--accent)` | `styles.css:368` |
| 滚动条 | 4 规则 | 10px · 轨 / 角透明 · thumb `--fg` 22%（2px 透明边 · clip padding-box · 圆角 6px） | thumb hover ⇒ 35% | `styles.css` 全局段（新增） |
| 设置面 | 9 面（8 改 + 1 零动） | 结构框归零 + 行 / 表单升底 `--bg-raised`；输入控件 / 强调标保留 | 活动行 = accent 14% 混 `--bg-raised`；次级键四值族；主推进 2 键强调框保留 | `renderer/settings.css` 各该段 |

### 关键决策记录（含被否）

- **KD-D24-1 保位式去描边**（`border-color: transparent` 而非 `border: 0` / 改内边距）：保 1px 占位 ⇒ 零几何位移（「布局零动」为硬边界），且 hover / 聚焦只改色。**被否**：`border: 0`（几何位移）· 常驻 outline（与聚焦环撞面）。
- **KD-D24-2 hover 值收齐 `--hover-bg`**（由 `var(--bg)`）：`.chat-copy-block` 落 `.block-user`（底 = `var(--bg)`）⇒ `var(--bg)` hover 不可见；静息去框后 hover = 唯一可点提示 ⇒ 不可失效；且 D21 行 hover 已用该变量。**被否**：逐处保留 `var(--bg)`（用户块内失效）· hover 恢复边框（复现「框框」）。
- **KD-D24-3 描边两分（结构框归零 ∥ 强调框保留）**：颜色即判据——`--line` = 结构 ⇒ 归零；`--accent` = 语义强调 ⇒ 保留（卡族 / 设置面主推进 2 键 / `.settings-mark`）；**状态类 accent 描边**（标签活动项 · 设置活动行）⇒ 改底色态（同 R5 语）。三条例外在册（防实施一刀切）。
- **KD-D24-4 就地改（值随控件档）而非新立覆盖档**：级联序 = `styles → chat → core → pool → settings`（`renderer/index.html:11-15`）⇒ 覆盖档须排末，且同选择器两处写值（违 D2）。分档预案 = 破 500 硬限时新立 `renderer/chrome-denoise.css` 排末（本批不落）。
- **KD-D24-5 滚动条 = 全局皮肤 + 零变量**：`::-webkit-scrollbar` 族住 `styles.css` 全局段（覆盖设置面板 —— 兑现「同规则带上」）；色 = `--fg` 混同 ⇒ 亮暗两套自动成立。
- **KD-D24-6 设置面映射**：面板底 = `--bg` ⇒ 行 / 表单升底 `--bg-raised`（同主壳「卡在底上」语）；活动行 = 不透明混同 `color-mix(in srgb, var(--accent) 14%, var(--bg-raised))`（行自持升底）；警示面结构框归零（警示语义已由 `--accent` 字色承载）。**被否**：纯间距无升底（行族失分组）· 活动行保留 accent 描边（与「活动态 = 底色态」语不合）。
- **KD-D24-7 原生 UA 控形不动**：`.head-pick`（出树面 = `renderer/views/chrome.mjs:106`）现值**零 CSS 规则** ⇒ 自持平台控形；chip 外框归零后其可见框来自 UA——**用户选定 mock 帧即含此形**（父侧读数：`.head-field` 边色已 `rgba(0,0,0,0)` 而帧内仍有框 ⇒ 框 = UA select）。本批不皮肤化（布局零动 + mock 选定形）⇒ 上抛 ①。

### 用例面（验收）

- **静息描边机检锁**（D24 判据第 1 件）：`thincoder-desktop/test/views-locks.test.mjs` 原址补例（沿 U 序编号）——四族归零 + 四值族 + 滚动条 4 规则 + 设置面映射 + **保留面负向锁**（`.composer-input` / `.block` / `.approval-card` / `.question-card` / `.plan-card` / `.rail-row` 仍 `var(--line)`）+ 零新变量。
- **真机 hover · 聚焦读数**（判据第 2 件 · D16 义务）：`thincoder-desktop/test/integration/chat-render.test.mjs` 原址补例——静息四边 `rgba(0, 0, 0, 0)` ∧ 边宽仍 1px（保位）∥ hover bg 非透明 ∧ 边框仍透明 ∥ 键盘 Tab 命中 ⇒ `:focus-visible` 真 + outline 2px ∥ 活动标签底非透明 ∥ 滚动条占宽（`[data-slot="flow"]` 的 `offsetWidth − clientWidth`）= 10 ∥ `.composer-input` 边框非透明（保留面）。
- **改前 / 改后对照**（判据第 3 件）：改前 = §1.3「00 改前」帧（同夹具 / 同机位 / 同滚位 · as-of 2026-09-28）∥ 改后 = 实施后同夹具实拍 ⇒ 父侧 / 用户走查。
- **零回归**：`thincoder-desktop` `npm test`（= `node test/run.mjs`，清单两向自检）全绿——含 U174（D21 值锁）/ T-DSK37 等既有用例；内容面零改 ⇒ 核 / CLI / VSC 零波及。

### 尺度（受影响文件与行数 · 实施面）

| 文件 | 现行 ⇒ 预期 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/styles.css` | **463 ⇒ ≈481** | 容器 4（:93-102）· 骨架线 3（:111-117 / :128-132 / :349-357）· 控件族（:296-306 / :395-405 / :407-415 / :418-425 / :435-441）· 活动标签（:368 就地改 + 1 新行）· `.rail-control` hover 收齐（:199-202）· 滚动条 4 规则 + 交互态组（新增 · 全局段） |
| `thincoder-desktop/renderer/chat.css` | **300 ⇒ ≈310** | `.composer` 顶线（:261-268）· 回填 / 药丸（:97-104 / :106-118）· 三控件（:282-291）· hover 收齐（:119-123 / :293-298）· 交互态组（新增）——**超 300 建议线**（< 500 硬限）；预案 = 新立 `renderer/chrome-denoise.css`（排末 · 零搬移） |
| `thincoder-desktop/renderer/pool.css` | **78 ⇒ ≈84** | `.pool-toggle`（:28-45）· `.pool-item`（:57-65）+ 交互态组（新增） |
| `thincoder-desktop/renderer/settings.css` | **273 ⇒ ≈289** | 面头线（:44-51）· 键 8（:60-86）· 警示面（:105-117）· 行（:141-157）· 强调标（:159-165）· 表单（:173-180）+ 升底 / 活动态 / 交互态组（新增） |
| `thincoder-desktop/test/views-locks.test.mjs` | **280 ⇒ ≈320** | D24 值落点锁（新用例 · 沿 U 序） |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | **176 ⇒ ≈212** | 真机静息 / hover / 聚焦 / 滚动条读数（原址补例） |
| 设计档 `docs/desktop/design/UI.md` | **已落**（本批设计轮） | 本批注 9 项 + 5 行指针 + 档头 D 表 `D1–D24` + 变更记录一行 |

计数（D3）：受影响产品档 **4**（CSS 四档 · 新文件 0 · 预案 1）· 测试档 **2** · 设计档 **1**；新增变量 **0** · 新增依赖 **0**。

### 设计档落点（已落）

- `docs/desktop/design/UI.md`：§1 增「**本批注（外壳视觉降噪 · D24）**」九项（静息描边归零四族 / 交互态四值族 / 标签活动态 / 滚动条皮肤 / 设置面映射 / 保留面与本批不动 / 验收三件 / 计数 / open·上抛）；标签条 / 会话头 / 输入区 / 设置面 / 主题五行补行内指针；档头需求侧行 **D1–D23 ⇒ D1–D24** + 变更记录一行。**他批段落零改**（增量落笔 · 同片在途见「并发观察」）。

### 上抛项 / 登记

- **上抛 ①**：原生 `select`（`.head-pick`）皮肤化（`appearance: none` + 自绘 caret）——本批不落（布局零动 + mock 选定形即含 UA 框）；机检锁面（CSS 描边）不受影响。需用户 / 父侧另裁。
- **上抛 ②**：`[data-slot="info"]` 行顶线（`settings.css:243-247`）不在 R 集、mock 未覆盖 ⇒ 本批不动；若用户并批再降噪则另裁。
- **上抛 ③**：设置面形——用户未见 mock（§1.4 父侧默认带上）；若用户剔除该面 ⇒ UI.md 本批注项 5 整段回撤（主壳零波及）。
- **登记（不在本批交付面 · 需父侧指派）**：`docs/desktop/design/PROJECT.md` §4.1 / §4.2 行预算随动 · §6.1 **D24 行** · §7 用例行（`T-DSK41` 拟 · 沿自铸披露惯例）+ §10 自铸披露 · `docs/desktop/design/E2E-TESTING.md` §4 / §6 用例行 —— 本批交付面 = 本档 §2 + `UI.md`（派单口径）；测试档随修随加（用户 2026-09-27 裁定）⇒ 本批不落。
- **并发观察（报告 · 不阻断）**：`UI.md` 同片在途（另一实例 pid 15884 于落笔前 5 分钟内写同一档 —— peer 提示）；本批落笔前后各重读一次，他批行（如「第三态判据补句」）未受影响；值面已入册 ⇒ 他批若同档重写，本批注可原样保留。
- **doc-check 读数（落笔后实跑 `node scripts/doc-check.mjs --root .`）**：悬空 **47**（= 基线 · **净增 0** —— 落笔时本批 5 条裸 `chat.css:NN` 歧义坐标〔同仓两枚 `chat.css`〕⇒ 同轮改全文路径清零）· 行宽 **32**（落笔时本批 6 行超 300 字符 ⇒ 同轮分句断行清零；余 +1 非本批面）· 拟新增 30（不增）。

### 修正轮 1（评审轮 1 发现 1–8 逐号点修 · 裁决 = 本档 §1.8 裁定表）

**范围**：评审轮 1（本档 §3 轮次 1 · changes-required 9 条）归本座的 8 条（发现 1–8）；发现 9 = 需求档编号收正（§3.5 ⇒ §3.5b · `docs/desktop/requirements/PROJECT.md:77` + 变更记录 `:233`）——**父侧直接执行已落，本座零动**。

落笔面 = `docs/desktop/design/UI.md`（本批注 + 旧批注三处 + 变更记录一行）· 本档 §2（本块）；产品码 / 测试档 / 他批段落零触碰。

**被取代条目覆盖声明**（本块对 §2 前块的取代；旧行保留不改）：

- 「本批条目 ④ 设置面映射（9 面 = 8 改 + 1 零动）」与「值面骨架表 · 设置面行（同文）」⇒ **9 面（6 改 + 3 保留）**——分解：改 = 面头线 / `.settings-row` / `.settings-form` / 警示面 / 活动行 / 次级键 6；保留 = 强调 2 键 / `.settings-field` / `.settings-mark`（发现 7）。
- 「用例面 · 静息描边机检锁」负向锁括注（六项仍 `var(--line)`）⇒ **两值列**：
  accent 值列 = `.approval-card`（`thincoder-desktop/renderer/chat.css:136`）/ `.question-card`（`:186` 覆 `:181`）/ `.rail-rename-input`（`thincoder-desktop/renderer/styles.css:294` · 新入锁）；
  `--line` 值列 = `.composer-input`（`:274`）/ `.block`（`:15`）/ `.plan-card`（`:181`）/ `.rail-row`（`styles.css:198`）（发现 1 + 发现 6）。
- 「用例面 · 真机 hover · 聚焦读数」滚动条句 ⇒ 补前提 / 两支形（前提 = 夹具使 `[data-slot="flow"]` 溢出；溢出 ⇒ 占宽 = 10 ∥ 未溢出 ⇒ 该支不适用）（发现 8）。
- 「尺度表 · `thincoder-desktop/renderer/styles.css` 行」现行 / 预期（463 ⇒ ≈481）与后半段坐标 ⇒ **467 ⇒ ≈485** + 逐处 +4：
  `:349-357 ⇒ :353-361` · `:296-306 ⇒ :300-310` · `:395-405 ⇒ :399-409` · `:407-415 ⇒ :411-421` · `:418-425 ⇒ :422-428` · `:435-441 ⇒ :439-445` · `:368 ⇒ :372` · `:199-202 ⇒ :203-206`（发现 2）；余五档对读相符不动（chat.css 300 · pool.css 78 · settings.css 273 · views-locks 280 · chat-render 176）。

**分档评估（承发现 3 · 两行）**：

- `thincoder-desktop/renderer/styles.css` **467 ⇒ ≈485**（< 500 硬限 · 余量 15）：**就地改 · 不拆**——本批全为值改（`border-color` / `background` 就地改值），零搬移不触他批面；破限预案 KD-D24-4 维持（破 500 ⇒ 新立 `thincoder-desktop/renderer/chrome-denoise.css` 排末 · 本批不落）。
- `thincoder-desktop/test/views-locks.test.mjs` **280 ⇒ ≈320**（越 300 建议线〔先例句 = 该档 `:5`〕· < 500 硬限）：**本批接受 · 登记**——拆位会散值锁单源；拆位预案 = 破 500 硬限时按 D 面（D21 / D24）分档（本批不落）。

**设计档落点（UI.md · 逐号）**：

- 发现 1：项 7 负向锁两值列（见上）；发现 2：项 1 / 项 2 / 项 3 八处坐标换号（见上）。
- 发现 4：项 2 补 `.chat-pill` 实色支（hover / 按下 = `var(--bg)` · 聚焦底不随落）+ 聚焦第三值 `background: var(--hover-bg-strong)` 补全（`.head-field` 特例句随动 = 聚焦三值落 chip）。
- 发现 5：旧批注（可见面修复 · 五件）项 1 / 项 2 / 项 3 三处收正 + 取代指针（边框面随 D24 归零——项 1 / 项 2）。
- 发现 6：`.rail-rename-input` 入保留面（输入框细边族）+ 入负向锁 accent 值列（**决策 = 纳入**——输入面细边，防实施 / 复核一刀切归零）。
- 发现 7 / 发现 8：见上覆盖声明。

**doc-check 读数**（实跑 `node scripts/doc-check.mjs --root .`）：悬空 **47**（= 基线 · 净增 0）· 行宽 **36**（= 基线 · 净增 0）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」九项（:228-277）+ 批档 §2（决策 / 文件 / 用例面）；对照 = `docs/desktop/requirements/PROJECT.md` §4 D24（:161）。读数面为实读核验（styles.css / chat.css / pool.css / settings.css / 两个用例档 / 探测帧在盘）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据 | 🔴 | 保留面负向锁值面不实：`docs/desktop/design/UI.md:269`（批档 §2 `:98` 同文）要求机检锁断言 `.approval-card` / `.question-card` 仍 `var(--line)`，实盘 `.approval-card` = `border: 1px solid var(--accent)`（`thincoder-desktop/renderer/chat.css:136`）、`.question-card` = 基规则 `--line`（`:181`）再被 `border-color: var(--accent)`（`:186`）覆盖 ⇒ 按文面写出的锁必红（`.approval-card` 侧文本级必然失败）或被静默弱化（R2）。 | 收正该括注为「仍 1px 描边、未被归零——`.approval-card` / `.question-card` = `var(--accent)`（语义强调框 · 同项 6），`.composer-input` / `.block` / `.plan-card` / `.rail-row` = `var(--line)`」。 |
| 2 | 尺寸标注 / 坐标（标准 8） | 🟡 | `styles.css` 现行行数标注 **463** 与现盘不符（实读 **467**——本批落笔前 4 行 `.rail-ledger-notice` 已插于 `thincoder-desktop/renderer/styles.css:173-176`），且本批注项 1 / 项 2 / 项 3 同档**后半段行号整体偏 -4**：`.rail-control` 标 `:199-202` ⇒ 现 `:203-206` · `.rail-cancel` / `.rail-confirm` 标 `:296-306` ⇒ 现 `:300-310` · `.tabbar` 底线标 `:349-357` ⇒ 现 `:353-361` · `.tabbar-item[data-active="1"]` 标 `:368` ⇒ 现 `:372` · `.tabbar-close` / `.tabbar-new` 标 `:395-405` ⇒ 现 `:399-409` · `.tabbar-cancel` / `.tabbar-confirm` 标 `:407-415` ⇒ 现 `:411-421` · `.head-field` 标 `:435-441` ⇒ 现 `:439-445` · 批档 §2 同表 `:418-425` ⇒ 现 `:422-428`；改后预期亦随（≈481 ⇒ ≈485）。其余五档标注与实读相符（chat.css 300 · pool.css 78 · settings.css 273 · views-locks 280 · chat-render 176）。 | 按当前盘面重校准该档现行行数与后半段行号（或就地注明「该档坐标 as-of 落笔时点 · 实施以选择器为准」）。 |
| 3 | 分档 / 尺度 | 🟡 | 主动拆分评估缺口：`styles.css` **467 ⇒ ≈485**（占 500 硬限 97%，远过 300 建议线——本仓先例「300 行 = 主动拆分层」= `thincoder-desktop/test/views-locks.test.mjs:5`）而设计只给「破 500 时新立 `renderer/chrome-denoise.css`」预案（KD-D24-4），未记「本批不拆是否可」的评估；同表对 chat.css（300 ⇒ ≈310）却标了「超 300 建议线 + 预案」⇒ 口径不一。另：`thincoder-desktop/test/views-locks.test.mjs`（280 ⇒ ≈320）将越 300 层且无预案（该档自身即因 300 行预算自 `views-chrome.test.mjs` 拆出）。 | 补两行：① `styles.css` 的主动拆分评估结论与理由（就地改 / 零搬移 / 破 500 才新立档是否仍成立）；② `views-locks.test.mjs` 过 300 层的处置（本批接受并登记，或给拆位预案）。 |
| 4 | 清晰性（交互态值面） | 🟡 | 两处交互态值未定 / 不实：① 项 2 对 `.chat-pill` 只给静息例外并称「hover 亦走实色」（`docs/desktop/design/UI.md:240`），未给该控件的 hover / 按下值——若按族值 `--hover-bg`（半透明叠加）落，与「恒不透明」相抵；② 项 2 称聚焦「沿 `.rail-row:focus-visible` 同三值」（`:243`）但只列 outline / offset 两值，第三值 `background: var(--hover-bg-strong)` 未纳入（先例三值 = `thincoder-desktop/renderer/styles.css:214-218`）。 | 补 `.chat-pill` 的 hover / 按下取值（或明示「沿用族值，恒不透明由底 `--bg-raised` 保证」）；聚焦句补全值集或说明第三值不随落。 |
| 5 | 文档一致性（同档残留） | 🟡 | D24 归零与本档旧批注残留相冲：可见面修复批注项 1 仍写 `.composer` 根 = `border-top: 1px solid var(--line)`（`docs/desktop/design/UI.md:78`）· 三控件 = 有边框的同一控件单形（`:80`）· 真机判据「三控件**有边框**」（`:83`），而 D24 项 1 归零该顶线（`:234`）· 项 2 归零三控件静息描边（`:240`）⇒ 同档两处对同一面给相反值，旧句未标取代。 | 在旧句就地加取代指针（「边框面随 D24 归零——见本档 §1 本批注（D24）项 1 / 项 2」）或收正该三句，免实施 / 复核据旧判据反判。 |
| 6 | 保留面完整度 | 🔵 | `.rail-rename-input`（行内改名输入框 · `thincoder-desktop/renderer/styles.css:290-299` · `border: 1px solid var(--accent)`）未在保留面点名（项 6 只点 `.composer-input` / `.question-input` / `.settings-field`），亦不在 R 集 / 本批不动清单——按类归「输入框细边保留」，但实施与负向锁均可能漏判（其 accent 边尚可能被误当 R5 类状态描边而归零）。 | 在保留面或本批不动清单点名该控件，并决定是否纳入负向锁。 |
| 7 | 计数（D3） | 🔵 | 项 8 计数「设置面 **9 面**（8 改 + 1 零动）」（`docs/desktop/design/UI.md:275` · 批档 §2 同文）与项 5 实列不符：实列归零 6 组（面头线 / `.settings-row` / `.settings-form` / 警示面 / 活动行 / 次级键 6）+ 保留 3 组（强调 2 键 / `.settings-field` / `.settings-mark`）= 6 + 3 = 9。 | 改记「9 面（6 改 + 3 保留）」或给出「8 改 + 1 零动」的分解口径。 |
| 8 | 真机判据鲁棒性 | 🔵 | 判据第 2 件的滚动条读数「`[data-slot="flow"]` 的 `offsetWidth − clientWidth` = 10」依赖两件未声明前提：夹具须使该容器真出滚动条 ∧ 平台 / 缩放走经典（非 overlay）滚动条——否则读数为 0 或非 10（跨平台 = 需求 A3）。 | 判据补前提（夹具须溢出）或改两支形（有滚动条 ⇒ = 10 · 无 ⇒ 判据不适用）。 |
| 9 | 文档卫生（需求档） | 🔵 | 需求档 `docs/desktop/requirements/PROJECT.md` 两节同号：`:71`「### 3.5 待设计形（本轮不锁）」与 `:77`「### 3.5 会话面板补齐」——设计面多处引「需求 §3.5 项 5 / 项 6」（`docs/desktop/design/UI.md:30` · 批 B 注项 5）时指向可歧义。 | 需求档编号收正（后节改 3.5b / 3.7 之类）或引用处带节名限定。 |

计数：🔴 1 · 🟡 4 · 🔵 4（共 9；排除面 = 无）。

VERDICT: changes-required

### 轮次 2（评审子代理）

复评（轮 2 · 只验前表 · 不铺新面）——对象 = §3 轮次 1 九条之逐条主张（发现 1–8 = 修正轮 1 落地项 · 发现 9 = 父侧直接执行）；读数面 = 本轮实读全量（`docs/desktop/design/UI.md` · `docs/desktop/requirements/PROJECT.md` · `thincoder-desktop/renderer/styles.css`〔467 行〕· `chat.css`〔300 行〕· `pool.css`〔78 行〕· `settings.css`〔273 行〕· `test/views-locks.test.mjs`〔280 行〕· `test/integration/chat-render.test.mjs`〔176 行〕）。

| # | 原号 | File | Severity | Status | Notes |
|---|------|------|----------|--------|-------|
| 1 | 1 | `docs/desktop/design/UI.md:270-271`（对照 `chat.css:136` / `:181` / `:186` · `styles.css:294` / `:198`） | 🔴 | Fixed | 负向锁已拆两值列：accent = `.approval-card` / `.question-card` / `.rail-rename-input`；`--line` = `.composer-input` / `.block` / `.plan-card` / `.rail-row`。与实盘逐项核对全中：`chat.css:136` = `border: 1px solid var(--accent)`；`:181` `--line` → `:186` `border-color: var(--accent)`；`styles.css:294` = `border: 1px solid var(--accent)`；`chat.css:274` / `:15` / `:181` 与 `styles.css:198` = `--line`。批档 §2 前块旧行（`:98` / `:114`）保留，但已被修正块 `:155-157` 显式覆盖 → 无活矛盾。 |
| 2 | 2 | `docs/desktop/design/UI.md:235-248` + 批档 §2 `:159-160` | 🟡 | Fixed | `styles.css` 实读 **467**（修正注「467 ⇒ ≈485」相符）；八处 +4 换号逐处复读全中：`:353-361`（底线行 = `:358`）· `:300-310` · `:399-409` · `:411-421` · `:422-428` · `:439-445` · `:372` · `:203-206`（另 `:373-385` · `:290-299`；`.rail-ledger-notice` `:173-176` 在位）；余五档复读相符（chat.css 300 · pool.css 78 · settings.css 273 · views-locks 280 · chat-render 176）。 |
| 3 | 3 | 批档 §2 `:162-165` | 🟡 | Fixed | 两行评估在位：① `styles.css` 467 ⇒ ≈485（< 500 · 余量 15）⇒ 就地改 · 不拆 + 由（值改零搬移）；② `views-locks` 280 ⇒ ≈320（越 300 建议线 · 先例句 `views-locks.test.mjs:5` 实读在位）⇒ 本批接受 · 登记 + 破 500 拆位预案。 |
| 4 | 4 | `docs/desktop/design/UI.md:241` · `:244` | 🟡 | Fixed | `.chat-pill` 实色支补全（hover / 按下 = `var(--bg)` · 聚焦底不随落）；聚焦句补第三值 `background: var(--hover-bg-strong)`（`.head-field` 特例随动）；先例三值 = `styles.css:214-218` 实读全中。 |
| 5 | 5 | `docs/desktop/design/UI.md:78` · `:80` · `:83` | 🟡 | Fixed | 旧批注三处收正 + 取代指针：`:78` 顶线 = `1px solid transparent`（D24 归零 · 保位）；`:80` 四态见 D24 项 1 / 项 2；`:83` 真机判据改「静息无描边」。 |
| 6 | 6 | `docs/desktop/design/UI.md:263` · `:271` | 🔵 | Fixed | `.rail-rename-input` 入保留面（`styles.css:290-299`——边 = `var(--accent)`）并列入负向锁 accent 值列；实读 `styles.css:294` 相符。 |
| 7 | 7 | `docs/desktop/design/UI.md:277` + 批档 §2 `:154` | 🔵 | Fixed | 计数改记「设置面 **9 面**（6 改 + 3 保留）」；分解与 `settings.css` 实读相符。 |
| 8 | 8 | `docs/desktop/design/UI.md:273` + 批档 §2 `:158` | 🔵 | Fixed | 滚动条判据补前提（夹具使 `[data-slot="flow"]` 溢出）+ 两支形（有 ⇒ = 10 ∥ 无 ⇒ 该支不适用）。 |
| 9 | 9 | `docs/desktop/requirements/PROJECT.md:77` · `:233` | 🔵 | Fixed | 后节改 `### 3.5b 会话面板补齐（批 A / B · 2026-09-26 用户裁定；原与上节同号 3.5 ⇒ 2026-09-28 收正）`；变更记录 `:233` 在册（父侧直接执行）。 |
| 10 | (new) | `docs/desktop/design/UI.md:30` · `:60` · `:75` · `:124` | 🟡 | New（承发现 9 连带 · 已登记延后 · 非阻断） | 编号收正后 UI.md 引点未随收：`:30`「两面不互相顶替（需求 §3.5 项 5 / 项 6）」· `:60`「两面不互相顶替（需求 §3.5 项 6）」· `:75`「（`docs/desktop/requirements/PROJECT.md` §3.5:78 用户原话）」· `:124`「`/:` = 需求 §3.5 边界（用户 2026-09-26 裁定「不是必须项」）」——目标内容现住 §3.5b（`PROJECT.md:77`），§3.5 本体无「项 5 / 项 6」；父侧已登记（`PROJECT.md:233`「引用处节名限定归后续触碰随收」）。建议：后续触碰时四处限定为「§3.5b」（`:75` 行锚「:78」同笔或改符号引用）。 |

计数：🔴 0 · 🟡 1（新 · 非阻断）· 🔵 0；前表九条全部 Fixed（逐条复读在位）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-09-28 07:13 授权「剩下的你自动跑完吧」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 2 · 🔴 0 · 前表九条全 Fixed 逐条复读在位 · VERDICT: pass 全文在册）；② **修正轮已落地并逐条核验** ✓（修正轮 1 落地 = §2 修正块 · 父侧抽验 7 处键点 + 轮 2 全量复读逐条「Fixed」）；③ **token 已签发** ✓（凭据值不落档——沿纪律）。

**依据**：评审（轮 1 = changes-required 9 条 → 父侧裁定表 §1.8（全 Fixed）→ 修正轮 1 → 轮 2 = pass）；§3 轮次 2 新发现 1 条（🟡 非阻断 · UI.md 引点编号随触收）——已登记延后，不阻断批准。

**批准范围** = §2 设计全文（D24 值表九项 + 验收三件 + 决策 KD-D24-1…7）；**实施派发** = eng-coder（初始轮 · 按 §2 受影响文件与测试面）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（初始轮 · 六档落齐（四 CSS + 两测试档）· npm test 203/203 · 内部审计 1 轮（1 PARTIAL 自修）+ 代码评审 1 轮（0🔴 · 1🟡 非阻断 · 5🔵）· fix round 1 = 2 项 · 终态 clean · doc-check 悬空 47 / 行宽 36 零净增）



### 5.1 交付摘要

**改动面 = 六档**（产品四 + 测试二；新文件 0 · 新变量 0 · 新依赖 0）：`thincoder-desktop/renderer/styles.css` · `thincoder-desktop/renderer/chat.css` · `thincoder-desktop/renderer/pool.css` · `thincoder-desktop/renderer/settings.css` · `thincoder-desktop/test/views-locks.test.mjs` · `thincoder-desktop/test/integration/chat-render.test.mjs`。
`thincoder-desktop/renderer/core.css`（内容面）零改；值表单源 = 设计 §1「本批注（D24）」九项，逐值照落——去描边一律保位式（`1px solid transparent` / `*-color: transparent`），保 1px 占位 ⇒ 零几何位移。

**行数实读（对设计 §2 尺度表预估）**：styles.css 467 ⇒ **492**（≈485）· chat.css 300 ⇒ **315**（≈310）· pool.css 78 ⇒ **84**（≈84）· settings.css 273 ⇒ **294**（≈289）· views-locks.test.mjs 280 ⇒ **377**（≈320 ⇒ **+57 披露**）· chat-render.test.mjs 176 ⇒ **224**（≈212）。

**值面落点（逐族 · 全名路径）**：
- 容器族 4 = `thincoder-desktop/renderer/styles.css:101`；骨架线 4 处 = `styles.css:117` · `:132` · `:360` · `thincoder-desktop/renderer/chat.css:271`；
- 控件族 11 = `styles.css:449` ∥ `chat.css:99` · `:113` ∥ `thincoder-desktop/renderer/pool.css:31` ∥ `styles.css:306` · `:422` ∥ `chat.css:290`；
- 池条目 = `pool.css:64` + `:66`（描边透 + 底 `var(--bg)`）；标签活动态 = `styles.css:376-379`（描边归零 + accent 14% 底 + 题字 accent）；滚动条 4 规则 = `styles.css:477-481`；
- 交互态组 = `styles.css:483-492`（四键按下 / 聚焦 + chip 三态）· `chat.css:307-315` · `pool.css:82-84` · `thincoder-desktop/renderer/settings.css:281-294`；
- 设置面 6 改 = `settings.css:50` · `:71` · `:111` · `:141-156` · `:183-185`；3 保留 = `settings.css:83-87`（强调 2 键 accent 框）· `:199`（`.settings-field`）· `:166`（`.settings-mark`）。

**验收三件**：① 值落点锁 = U182（`thincoder-desktop/test/views-locks.test.mjs:283` 起 —— 表项 56〔① 16 / ② 20 / ③ 4 / ④ 9 / ⑤ 7〕+ 计数两式 + `.chat-pill` 聚焦底负向一锁）；② 真机读数 = T-DSK37 第 ⑨ 块（`thincoder-desktop/test/integration/chat-render.test.mjs:175-222`）；③ 改前 / 改后对照 = `.thincoder/tmp/denoise-00-before.png` ∥ `.thincoder/tmp/denoise-04-after.png`（同夹具 / 同机位 / 同滚位；改后帧探针 = `.thincoder/tmp/desktop-denoise-after.mjs` 一次性物 · 非批产物 · 零注入）。

### 5.2 决策透明表（实施层形 —— 设计外的落地选择）

| # | 选择 | 依据 / 被否 |
|---|---|---|
| 1 | `.head-field` 三态单列成规则（hover / 按下 / `:focus-within`），不入四键组 | 设计项 2 特例句 + 值面骨架「11 选择器 × 四值」；按下支 = 内部审计 ① 命中后补齐（族值 4 缺 1） |
| 2 | 设置面 8 选择器共用基规则描边归零；`.wizard-next` / `.wizard-finish` 由后序 `border-color: var(--accent)` 保留 | 与设计「次级 6 归零 + 强调 2 保留」等价；不复制声明（D2 单源）· 级联后序可读 |
| 3 | 滚动条 thumb `:hover` 用 `background-color`（非 `background` 简写） | 简写会重置基规则的 `background-clip: padding-box`（hover 期 2px 边被填 ⇒ 视觉变粗）；语义等价 |
| 4 | `.chat-pill` 三例外（hover / 按下 `var(--bg)` · 聚焦底不随落）写独立规则 | 设计项 2 明文实色支例外（半透明叠加会透底层文字）；不并入族组 |
| 5 | 滚动条 / 交互态组住 `styles.css` 文末全局段 | 设计项 4 落点「全局段（新增）」；末位层序 · 增量改不触他批段落 |
| 6 | E2E 滚动条两支形分支键 = 实测占宽（> 0），非「是否溢出」 | 设计原文「有滚动条 ⇒ 10 ∥ 无 ⇒ 不适用」；键在溢出时，overlay 滚动条平台会假红（评审 🔵③ 采纳） |

### 5.3 命令读数

- `cd thincoder-desktop && npm test` = **203 例 / 203 pass / 0 fail**（含新增 U182 + T-DSK37 ⑨；fix 前 `d24-npm-test.log` · fix 后 `d24-npm-test-2.log` 双绿）。
- 单档 = `node --import thincoder-desktop/test/rc-resolve.mjs --test test/views-locks.test.mjs` ⇒ 4 / 4 绿；`… --test test/integration/chat-render.test.mjs` ⇒ 1 / 1 绿。
- E2E D24 真机读数（实跑输出）：静息 `.rail` 四边 `rgba(0, 0, 0, 0)` ∧ 边宽 1px · `.rail-head` 底线 / `.composer` 顶线透明 · chip 透明 ∧ 1px · hover 底 = `rgba(0, 0, 0, 0.06)` ∧ 边框透明 · Tab 8 步 ⇒ `:focus-visible` 真 ∧ outline 2px / offset -2px / `rgb(47, 111, 235)` · 活动标签底 = `color(srgb 0.184314 0.435294 0.921569 / 0.14)` · 滚动条占宽 = **10** · `.composer-input` 边框非透明。

### 5.4 尺度与破限预案

- `styles.css` **492** 行（< 500 硬限 · 余量 ≈8）：预案 KD-D24-4 维持（破 500 ⇒ 新立 `thincoder-desktop/renderer/chrome-denoise.css` 排末 · 本批不落）；评审 🟡① 建议 = 下一触碰该档的批先落分档。
- `views-locks.test.mjs` **377** 行（越 300 建议线 · < 500 硬限）：越层在册（设计 §2 修正块已裁「本批接受 · 登记」）；实读对预估 +57 = 断言逐项展开所致 —— 披露。

### 5.5 审计与代码评审轮次与终态

- **内部探索审计（只读子代理 · 1 轮）** = DEVIATIONS 1 条（PARTIAL 🟡）：`.head-field` 缺按下支（命中面 11 控件族值面 4 只落 3）⇒ **fix round 1 采纳**；另报歧义 1 条（`.rail-control` / 标签条三控无按下 · 聚焦 —— 设计项 2 只要求 hover 收齐 ⇒ 按「该句为完整口径」读法不计偏离）。
- **代码评审（advisor · 1 轮 · 同步）= pass**：**0 🔴 / 1 🟡 / 5 🔵** —— 🟡① = 文件尺度账实不符（views-locks 377 > 300 建议线 · styles.css 余量 ≈8）⇒ 登记不阻断（归 5.4）；🔵② = 尺度表数值漂移 ⇒ 归父侧文档层；🔵③ = E2E 滚动条分支键 ⇒ **已采纳**；🔵④ = 锁组内成员不可判 ⇒ **已采纳**（改逐成员序列断言 + 补设置面 hover 一锁）；🔵⑤ = 聚焦第三值在 hover 并存时被层序压（沿 D21 `.rail-row` 先例）⇒ 报告项；🔵⑥ = 需求句「聚焦逐控件定形」对标签条三控 / `.rail-control` 无本端定形（设计项 2 明文只要求 hover · 设计 > 需求）⇒ 报告项。
- **fix round 1（2 项）**：① `.head-field:not(:disabled):active` 按下支（`styles.css:491`）+ 锁（`views-locks.test.mjs:328`）；② 锁组内成员逐名序列（② 段全改 · 9 组）+ E2E 滚动条分支键（`chat-render.test.mjs:217`）。复跑 = 单档 + 全量 203 / 203 双绿。
- **终态 = clean**（审计 1 轮 + 评审 1 轮 + fix 1 轮；0 未闭阻断项）。

### 5.6 未闭报告项（只报 · 归父侧 / 设计席）

① 评审 🔵⑤：聚焦三值第三值在 hover 并存时被层序压（同 D21 `.rail-row` 先例）——若意图「聚焦恒胜」需设计补层序口径；
② 评审 🔵⑥：标签条三控 / `.rail-control` 聚焦态无本端定形（UA 默认焦点环在 · 非可达性缺口）——归设计席（用户走查判不足则补值）；
③ 尺度表六档「预期」对实读的漂移 + 本档 §6 段 ⇒ 归父侧收口面；
④ 设计 §2 在册上抛三项（原生 select 皮肤化 · `[data-slot="info"]` 顶线 · 设置面形）—— 本批零动照旧。

**§5 落笔清账（doc-check 实跑）**：落笔后 `node scripts/doc-check.mjs --root .` ⇒ **悬空 47 / 行宽 36 = 基线原值（净增 0 ✓）**；新规则读数 = 悬空 47 · 行宽 36（对照落笔前 `d24-doccheck-before5.log` ∥ `d24-doccheck-after5.log` 逐行集合差 = **本批零新增悬空行**）。旁注（外部漂移 · 非本批）：拟新增 45 ⇒ 49（+4）——新增行住 `docs/desktop/design/PROJECT.md:375` 与 `docs/desktop/design/UI.md:349`（两档引用 `renderer/page-read.mjs` / `renderer/queue.mjs` 的「拟新增」前向引，两文件盘上缺席；本批零触碰该两档与两文件）⇒ 归并发在途批的文档面（拟新增列报 · 不入闸）。

## §6 验证与收口（父代理）

### 6.1 验证结论（父侧亲跑 · 2026-09-28）

**改动核验**：六档 diff 实读逐处对 §2 值表（容器四卡 / 骨架线 4 / 控件族 11 / 池条目 / 标签活动态 / 滚动条 4 规则 / 设置面 6 改 + 3 保留 / 交互态组 / 保留面两值列）——照落；保位式去描边（1px 透明）零几何位移；内容面 `core.css` 零改。

**读数（父侧实跑）**：`thincoder-desktop` `node test/run.mjs` ⇒ **203/203 绿 ×2**（另 1 跑红 = 既有断言 `test/integration/chat-render.test.mjs:136`〔面板面 6 · 钮自身 hover 时序〕偶发——**非本批面**（D24 diff 不触该链 · 5 跑 1 红 = 脆性）；**稳定性债已登记归批**）；子代理双跑日志亦 203/203（`d24-npm-test.log` / `-2`）。`doc-check` 悬空 47 / 行宽 36 = 基线（净增 0）。改前 / 改后对照帧在盘（`.thincoder/tmp/denoise-00-before.png` ∥ `denoise-04-after.png`）。

**尺度披露**：`styles.css` 467 ⇒ **492**（预估 ≈485）· `chat.css` 300 ⇒ **315**（≈310）· `pool.css` 78 ⇒ **84** ✓ · `settings.css` 273 ⇒ **294**（≈289）· `views-locks.test.mjs` 280 ⇒ **377**（≈320 · +57 披露）· `chat-render.test.mjs` 176 ⇒ **224**（≈212）——漂移全部在案（§5.1 / §5.4）。

**核销**：台账 **#493** ⇒ 已核销（证据 = 本节 + 提交 `a0aa11e5`）。**签入**：产品面 = `a0aa11e5`（双远端随推）；本档随 §6 收口笔一并签入。

### 6.2 残留报告项处置（承 §5.6）

① 聚焦 / hover 层序（🔵⑤）+ ② 标签条三控聚焦定形（🔵⑥）——登记（用户走查判不足再补值）；③ 尺度表漂移 = 本节披露在册；④ 上抛三项（原生 select 皮肤化 / `[data-slot="info"]` 顶线 / 设置面形）——照旧在册。
