# 2026-09-28 · desktop-residuals
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 04:55 裁定「为什么这么喜欢挂账不修」——台账 #479（D17 恢复态播种）+ #480（D19 用户块 md 深度）直接立链（桌面会话面残余缺口）。
> 台账 = #479 + #480（桌面端 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-28 04:55 裁定 + 走查实证——直接立链，不再挂账）**：桌面会话面两处残余缺口——

① **D17 恢复态播种**（台账 #479）：打开 / 切换既有会话后状态行 `tasks`（及 `usage` / `context` / `tokens` 同族）段不亮——**探针实证**（`.thincoder/tmp/statusline-probe.mjs`：resume 后 12 段只亮 `title`，槽内 seeded tasks 2 条在场）；CLI 对位 = `thincoder-core/session-lifecycle.mjs:110` `agent.tasks = data.tasks ?? []`（恢复即水合）∥ 桌面切片 `tasks[key]` 仅由 `ev:task` 写（`renderer/events.mjs:205`）⇒ 恢复态零播种。

② **D19 用户块 md 深度**（台账 #480）：VSC 用户块 = `mdInline`（`thincoder-vscode/webview/flow/block.mjs:87`）∥ 桌面两型同经全量 md ⇒ 两端结构不同；按 VSC 口径统一（需求 §4 D19 已补句）。

**边界**：不动状态行段集 / 判据（R3a 在册）；不动视觉面（#477 批在途）；VSC 侧零改；核侧除 usage / context 打开态读数方案（设计定形）外零语义变更。

**链**：§2 设计 → §3 评审（用户点火）→ §4 批准 → §5 实施 → §6 收口。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（D17 恢复态播种 + D19 用户块 md 深度两缺口定形；UI.md / PROJECT.md 补写已落（2026-09-28））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

| # | 条目 | 需求侧 | 判据载体 |
|---|---|---|---|
| 1 | **D17 恢复态播种**（台账 #479）——打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（`tasks` 直取 ∥ `usage` / `context` 打开态读数）；恢复态与 CLI 同见 | 需求 §4 D17 补句 | 本文 §2.2.1 / §2.4；核面单源 = `docs/core/design/SESSION.md` §6.24 |
| 2 | **D19 用户块 md 深度**（台账 #480）——用户消息块 markdown 深度按 VSC 口径统一（核件 `mdInline`；助手块 = 全量 md 不变） | 需求 §4 D19 补句 | 本文 §2.2.2 / §2.4 |

**不入本批（禁止范围复核）**：状态行段集 / 段判据零动（R3a 在册）· `tokens` / `timers` 链零触（#475 链语义 / 判据零动——本批核面只**追加**只读出口，`#475`（SESSION-LIST-DISK）文件面交叠仅 `session-lifecycle.mjs` 同档不同面：可达性扩展行 ∥ 尾部新增出口）· 视觉面零动（#477 在途；其写域 `core.css` / `styles.css` / `views-locks.test.mjs` / `chat-render.test.mjs` 与本批**零交叠**——本批 E2E 另立新档）· VSC 侧零改 · 核机制语义零改（除 §6.24 只读出口一处）。

**设计档落点**：`docs/core/design/SESSION.md` §6.24（新——打开态读数判据句 + 验收回指）+ §5 指针 + §7 D-SE61 · `docs/desktop/design/IPC.md` §2 `history:page` 行 + 「打开态播种注」（新）· `docs/desktop/design/UI.md` §1「本批注（残余缺口 D17 / D19）」+ 状态栏 / 对话流两行就地指针（**写入留末位**——#477 冻结窗口；被拒 ⇒ 待解除补写）· `docs/desktop/design/PROJECT.md` §4.2 本批行 + §7 T-DSK38 + §10 行。

### 2.2 机制设计

#### 2.2.1 D17 恢复态播种（两件）

**① 播种面清单（12 承载段逐段裁定——零静默省略）**

| 段（切片） | 裁定 | 数据源 / 理由 |
|---|---|---|
| 6 `tasks` | **播种** | 槽数据 `tasks` 直取（非数组 ⇒ `[]`——沿核水合口径 `data.tasks ?? []`） |
| 9 `context`（`usage`） | **播种** | 核 `sessionReading` 打开态读数（本批新出口——见 ②） |
| 8 `tokens` | 不播种 | #475 链（回合尾帧专属）；打开态无累计源（累计表 = 宿主生命周期内存，槽内无该面——CLI 同判） |
| 12 `timer` | 不播种 | 核 `_pendingTimers` 活读 = 进程态，槽无该面 |
| 5 `elapsed` / 7 `turn` | 不播种 | 回合域：无在飞回合 ⇒ 段本应缺席（回合起后自然亮） |
| 2 `attention` / 3 `busy` | 不播种 | 位标 = 进程态（无挂起 / 无在飞 = 真态） |
| 4 `tool` | 不播种 | 块面末位 running 工具——页读整置后为零 = 真态 |
| 11 `ledger` | 不播种 | 项目级——开项目链复读已落（#461） |
| 13 `title` | 不播种 | `sessions` 切片——随开页 `refreshRail` 刷 |
| 14 `queue` | 不播种 | 进程态（空队 = 真态） |

**触发点**（单点）：`openPage`（`thincoder-desktop/renderer/mount-sessions.mjs` 私有）——三路开标签**同一路**（`session:resume` / `session:switch` / `session:create`）+ 关标签邻位接管 + 左列点行 / 标签激活皆经此；不在动作层 / `openResult` 另立第二触发。

**载波**（择一 = 页读回执；见 §2.5 决策 2）：`history:page` 回执新键 `seed = { tasks, usage? }`——**仅首屏读**（`before == null`）输出；回填读不携（防回填以盘上旧值覆盖活切片）。形态 / 缺席降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」。

**落点**：渲染面 `applyPage` 首屏支（`thincoder-desktop/renderer/events.mjs`）——同笔写 `tasks[key]` / `usage[key]` 两切片（与 `meta` 同一写点）；缺席 / 形不合 ⇒ 该槽零写（零节点——禁假造）。订阅键面零改（`STATUS_KEYS` 已含两键 ⇒ 帧随切片变自动重挂）。

**缺席降级**：槽不可读 ⇒ 回执 `{ ok:false }`（零播种——既有失败面不变）；配置不可读 / 读数不可算 ⇒ `usage` 键缺席 + `console.error`（零静默；页读面保持 fail-soft）；`percent ≤ 0` ⇒ 键缺席（同 `ev:usage` 有效门）。

**连带面（有意）**：`tasks[key]` 为两消费面同源（状态行段 6 + 计划卡）——恢复态两者随亮，与 CLI 恢复后 `agent.tasks` 在场同义；如须卡片不出，须另裁（劈切片——不在本批）。

**② `usage` / `context` 打开态读数 = 核侧出口**（择一；见 §2.5 决策 1）：核新出口 `sessionReading(data, { providers, fallback })`（住 `thincoder-core/session-lifecycle.mjs`；`thincoder-core/session.mjs` re-export 随动）——与 `applySession` 后的 `historyPercent(agent.history, agent.provider)` **同源同式**：线选（`contextHistory` 非空取之，否则 `history` 经剥截断回退——同 `applySession:101`）· 回声归并（`mergeAdjacentAssistantEchoes`——同 `:105`）· 渠道合并（槽 provider 命中 ⇒ `activeModel || entry.model`（支 ① 同判）；未命中 ⇒ `fallback`（支 ② 装配口径 = `loadConfig().provider`））· 公式（`historyPercent`——与 CLI / VSC 状态行同式）。端壳只做出参装配 + 有效门（数字 ∧ `> 0`）+ 缺席降级。

#### 2.2.2 D19 用户块 md 深度（一件）

**实现面 = 端侧渲染分流**（择一；见 §2.5 决策 4）：`thincoder-desktop/renderer/views/chat-text.mjs` `textFace` 按 `block.kind` 分流——`user` ⇒ `mdInline`；`assistant` / `reasoning` / `error` ⇒ `md`（全量——零回归）。`mdInline` 与 `md` 同模块导出（`/rc/md.mjs`）⇒ 零新模块边（守卫闭包零改）。口径标尺 = 核件 `thincoder-render-core/flow/block.mjs:87`（user = `mdInline`）∥ `:100`（assistant = `md`）——**核件 / VSC 侧零改**。`[data-raw]` 原文逐字锚不变（复制面零回归）；边界（登记）= 就地更新径（`patchTextBlock` → 核件 `paintStreamTarget` 恒 `md`）对 `user` 块**不触发**（块引用恒定 ⇒ `patch` 档不入）——若未来出现 user 尾块重渲径，深度分流须同判。

### 2.3 受影响文件与测试面（现行 ⇒ 预期；口径 = 内容行数）

| 文件 | 现行 | 预期 | 面 |
|---|---|---|---|
| `thincoder-core/session-lifecycle.mjs` | 352 | ≈386（+34） | 新出口 `sessionReading`（尾部追加——500 硬线内） |
| `thincoder-core/session.mjs` | 254 | 255（+1） | re-export 一行随动 |
| `thincoder-desktop/src/main/session-slots.mjs` | 154 | ≈195（+41） | `pageHistory` 出 `seed` + `openingSeed` 投影 |
| `thincoder-desktop/renderer/events.mjs` | **500（硬限顶格）** | ≈470（−45 +14） | **在册拆分预案执行**（问题 / 任务切片拆出）+ 首屏播种支 |
| `thincoder-desktop/renderer/questions.mjs`（新） | — | ≈45 | `QUESTION_KEYS` / `onQuestion` / `onTask` / `clearQuestion`（events 原址 re-export 保名面） |
| `thincoder-desktop/renderer/badges.mjs`（新） | — | ≈20 | `BADGES` / `badgeStamps`（events / questions 共用——单一实现） |
| `thincoder-desktop/renderer/views/chat-text.mjs` | 70 | ≈82（+12） | `textFace` 深度分流 |
| `thincoder-core/test/session-reading.test.mjs`（新） | — | ≈90 | 同源对拍 / 老槽回退 / 边界三组（登记面随核测试惯例核实） |
| `thincoder-desktop/test/history-page.test.mjs` | 105 | ≈150 | seed 三例（tasks 直取 / usage 有效门 / 回填不携） |
| `thincoder-desktop/test/events-page.test.mjs` | 172 | ≈200 | 首屏播种例（写入 / 缺席零写） |
| `thincoder-desktop/test/views-chat-text.test.mjs` | 139 | ≈160 | user ∥ assistant 深度对拍（纯构树） |
| `thincoder-desktop/test/integration/session-open.test.mjs`（新 · 集成域） | — | ≈120 | **T-DSK38**（探针式真 Electron：resume 后 `tasks` / `context` 段在场 + md 深度断言） |
| `thincoder-desktop/test/files.mjs` | 21 | 22（+1） | 新集成档登记 |

### 2.4 验收对照（回指需求 D17 / D19）

- **D17-1**：打开 / 切换 ⇒ `tasks[key]` = 槽数据直取（逐字）⇒ 段 6 在场（非空时）；空 / 缺 ⇒ 零节点。用例 = history-page seed 例 + events-page 播种例 + T-DSK38 ①。
- **D17-2**：同笔 `usage[key]` = 打开态读数（`> 0`）⇒ 段 9 在场；≤ 0 / 不可算 ⇒ 零节点。用例 = history-page + T-DSK38 ②。
- **D17-3**：回填读不携种 / 不消费（回执无 `seed` 键 ∧ 活切片零覆盖）。用例 = history-page 回填例。
- **D17-4**：同源同式（核 `sessionReading` × 同 data ⇒ === `applySession` 后同式读数）。用例 = 核 session-reading 对拍例。
- **D17-5**：零新通道 / 零新白名单项 / 订阅键面零改（既有计数例零动）。用例 = 既有通道计数例。
- **D19-1**：user 块块级构件零节点（围栏 / 标题）∥ assistant 同文本块级在场（对拍有牙）。用例 = views-chat-text + T-DSK38 ③。
- **D19-2**：VSC 侧 / 核件零改 ∧ `[data-raw]` 原文逐字（复制面零回归）。用例 = 既有复制例零动。
- **尺度**：两缺口皆含真 Electron 使用面用例（D16 义务——T-DSK38）；机检读数 = `node --test` 全绿 + `scripts/doc-check.mjs` 净增 0 悬空 / 0 行宽。

### 2.5 关键决策

1. **`usage` 读数 = 核侧出口**（`sessionReading`）。被否 = 端侧现算（线选 / 渠道合并 = `applySession` 语义；端侧复刻 = 第二口径〔违零算法副本〕；老槽回退径的剥截断件核内私有、端侧不可达 ⇒ 必漂移）。判据 = 单一权威源 + 逐字同源 + 无漂移面（免 VSC 式跨端对拍机制）。
2. **载波 = `history:page` 回执 `seed`**。被否 = 会话族统一信封载种（破「四键齐备」契约 + `create` 路无槽数据 + 与页读两笔竞态）；被否 = 打开态事件帧（`ev:usage` 形状三槽同笔：缺 `tokens` 键会清令牌槽 ⇒ 触 #475 链；且须把 emit 面接进会话动作层并与页读竞态）。
3. **播种触发 = `openPage` 单一触发点**（三路开标签同一路已收口；不另立第二触发）。
4. **D19 = 端侧渲染分流**。被否 = 核按角色深度选项（VSC 结构面零改约束下核内 dispatcher 无人消费 = 名义单源实际第二实现；核件 `flow/block.mjs` 为口径标尺不可动）。
5. **`events.mjs` 拆分执行**（在册预案 = 问题 / 任务两切片归约拆 `questions.mjs`——本批触碰必执行；`badgeStamps` 随迁共用件 `badges.mjs` 保单一实现）。

### 2.6 上抛项 / 报告项

1. **用例号自铸披露**：T-DSK38（沿 T-DSK37 先例）——若 #477 实施批占用同号，请父侧并号裁定。
2. **UI.md 冻结应对**：本批注落笔排末位；被拒 ⇒ 待 #477 冻结解除补写（报告明说）。
3. **`session:create` 径播种 = 空种**（新槽 `tasks: []` / 读数 0 ⇒ 零节点）——无可见变化（登记）。
4. **上抛（需求档面 · 归主 agent）**：D17 补句的措辞与本文「播种 2 / 不播种 10」清单一致（tokens / timers 不属播种面）——如需在需求档显式列出不播种面，请主 agent 裁定（本设计不改需求档）。

**落笔补记（同轮 · 05:1x）**：设计档四处落点实况——① `docs/core/design/SESSION.md` §6.24 + §5 指针 + §7 D-SE61 + 变更记录 **已落** ✓；② `docs/desktop/design/IPC.md` §2 `history:page` 行 + 「打开态播种注」 + 变更记录 **已落** ✓；③ `docs/desktop/design/UI.md` **未落**——#477 冻结窗口内（实测该档正被并发修改：开盘读取基准为 254 行收束行号 253，落笔时同内容行号已漂至 263；写入原子中止）⇒ 按父侧预案「待冻结解除补写」（本批注两项 + 状态栏 / 对话流两行就地指针）；④ `docs/desktop/design/PROJECT.md` §4.2 / §7 / §10 **未落**——同受 #477 评审冻结（台账 #449 实证在案）⇒ 与 UI.md 同批待解除补写。**零语义影响**：两档未落内容 = 形态面复述 + 行数账 + 用例号登记（判据本体已全在 §2 / IPC.md / SESSION.md 三处）。

**补写落定（同轮 · 05:2x）**：冻结解除后两档补写**已落** ✓——① `docs/desktop/design/UI.md`：§1 增「**本批注（D17 / D19 · 残余补齐 · 两项 · 2026-09-28）**」（项 1 恢复态播种——播种 2 / 不播种 10 逐段理由 + 触发点 / 载波 / 缺席降级；项 2 用户块 md 深度——端侧分流 `textFace`）+「状态栏」/「对话流」两行就地指针 + 变更记录一行；
② `docs/desktop/design/PROJECT.md`：§4.2 增本批行 **17**（code / test 13 + 设计档 4——行数按 §2.3 预算）· §7 增 **T-DSK38** 行 + **残余批注（D17 / D19 · 验收面）** · §10 增 **AP–AR** 三行 + 变更记录一行。
**机检读数** = `node scripts/doc-check.mjs --root .`：悬空 **47** / 行宽 **32**（与修前逐字同——净增 0；新档四处已按「（拟新增）」列报）。零语义（= §2 定形内容的形态面复述 + 行数账 + 用例号登记）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

口径说明：无项目标准档 / 无文档地图（方法论与归属按 AGENTS.md + 四档自述单源口径判）；需求档（D17 / D19 补句坐标 = `docs/desktop/requirements/PROJECT.md:146` / `:148`）不在本次评审范围 ⇒ 需求覆盖按设计自述引用判、未复核。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | 「播种 2 / 不播种 10」全量清单在 `docs/desktop/design/IPC.md:124-125` 与 `docs/desktop/design/UI.md:178-180` 两处逐段复述；两档互指对方为单源（IPC.md:125「形态单源 = UI.md …」∥ UI.md:172「不在此重述」），与 UI.md:178-182 实述相抵 | 清单择一处保留、另处收为指针（或明定该面单一 owner） |
| 2 | Clarity（指针可解析） | 🟡 | `docs/desktop/design/IPC.md:125` 引 `docs/desktop/design/UI.md` 节名「本批注（残余缺口 D17 / D19）」——盘上无此节名（实为 UI.md:171「本批注（D17 / D19 · 残余补齐 · 两项 · 2026-09-28）」） | 按盘上节名收正指针 |
| 3 | Clarity（批注指针记法） | 🟡 | 未限定「本批注项 N」同行异指：`docs/desktop/design/PROJECT.md:313`（该项 2 = 可见面修复注项 2）∥ `:314`（同短语 = 对齐重定位注项 2）∥ `:331`（= D21 注项 2）；`docs/desktop/design/UI.md:20` / `:22` / `:24` / `:25` / `:29` / `:195` 同为未限定形（UI.md:195 同一行另半句已用限定形）；相对批记法残留 = UI.md:21「对齐重定位（本批）」· IPC.md:65「本批增（D17）」（先期批次未限定指针未随动） | 指针补批名限定；「本批」式记法按既有「批号收正」惯例收正 |
| 4 | Acceptance（判据完备性） | 🟡 | 首屏播种与同键活写无时序判据：「防盘上旧值覆盖活切片」只覆盖回填径（UI.md:176 · IPC.md:128）；首屏径（IPC.md:129「同笔写 `tasks[key]` / `usage[key]`」）在在飞回合内切回（同族窄窗已在册 = PROJECT.md:484 AE）无判据 ⇒ 首屏种可按盘上旧值回写活切片 | 补时序 / 覆盖判据，或按 AE 先例登记该窄窗 |
| 5 | Consistency（数值） | 🟡 | 同批同档净增量二值：`docs/core/design/SESSION.md:850`「净增量 ≤ +20」∥ `docs/desktop/design/PROJECT.md:278`「154 ⇒ ≈195（+41）」 | 两处对盘收正（或写明两数各自口径） |
| 6 | Traceability（随动面） | 🔵 | §6.1 D17（PROJECT.md:327）/ D19（`:329`）· §6.2 A4（`:340`）· §8 · §9 无本批随动句（既有惯例 = 逐批补：前批「§6.1 D11 / D14 补 T-DSK32」·「§6.2 A4 补接核例外句」·「§8 增本批不做行」）；本批新判据仅住 §7 残余批注（`:404-406`）+ §10 AO（`:491`） | 按惯例补随动（或明裁免登） |
| 7 | 受影响文件（>300 层） | 🔵 | `thincoder-desktop/renderer/events.mjs` 拆后 ≈470 仍越 300（PROJECT.md:279 · §4.1 越层段 `:177`「下次触碰必须执行」本批已执行），设计未给拆后档的续期 / 新预案 | 在 §4.2 行 / §4.1 越层段补拆后处置（新预案 ∥ 续期） |

VERDICT: pass

计数：🔴 0 · 🟡 5 · 🔵 2（合计 7）

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-28 05:12「都自动跑吧」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass**：轮 1 = 0🔴 / 5🟡 / 2🔵（评审 21）——D17 恢复态播种 / D19 用户块 md 深度两缺口本体过审；
- ② **修正落地核验** ✓：修正轮 #24 七条（五档——指针收口 / 记法限定 / 时序判据 / 净增量对盘 / 随动补齐 / 拆后处置）+ 父侧抽验（`IPC.md:124`/`:127` · `SESSION.md:850` · `PROJECT.md:178`）· doc-check 净增 0/0；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（`sessionReading` 核出口 + `seed` 载荷 + 端侧分流 + events 拆档）；实施写域 = 核两档（`session-lifecycle.mjs` / `session.mjs`）+ 桌面八档（`src/main/session-slots.mjs` · `renderer/events.mjs` · 新 `questions.mjs` / `badges.mjs` · `views/chat-text.mjs` · 测试四档）+ `test/files.mjs`（登记）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（核 750/750 全绿（含新档）· 桌面 196/196 全绿（含 T-DSK38）· 变更 ⊆ 13 档 · 行数达标；审计 1 轮（1×🔵 已删临时件）+ 代码评审 1 轮（pass，0🔴）· fix round 0）



**实施轮（eng-coder · 2026-09-28）**——三件全落（D17 恢复态播种 / D19 用户块 md 深度 / `events.mjs` 拆档）；两套件全绿；0🔴 · 0 必修。

### 5.1 交付摘要（逐条 = 任务书条目）

| # | 条目 | 落点（实测） | 读数 |
|---|---|---|---|
| 1 | **D17 恢复态播种** | 核出口 `sessionReading`（`thincoder-core/session-lifecycle.mjs:368`，尾部追加；`thincoder-core/session.mjs:52` re-export 随动）；端壳 `openingSeed` + 首屏回执 `seed`（`thincoder-desktop/src/main/session-slots.mjs:130-144` / `:163`）；渲染面 `seedPatch` 同笔写两切片（`thincoder-desktop/renderer/events.mjs:399-409`，首屏支 `:394`） | 核 `thincoder-core/test/session-reading.test.mjs` 3 例（同源对拍 / 老槽回退 / 边界）· 桌面 U175（seed 三例 + 坏配置降级）· U176（首屏播种 × 时序 × 零写）· T-DSK38（真 Electron：段 6 读数 `1/2` · 段 9 读数 36%）全绿 |
| 2 | **D19 用户块 md 深度** | `thincoder-desktop/renderer/views/chat-text.mjs:28`：`user ⇒ mdInline` ∥ `assistant` / `reasoning` / `error` ⇒ `md`（口径标尺 = 核件 `thincoder-render-core/flow/block.mjs:87` / `:100`——核件 / VSC 侧零改） | U177（纯构树对拍）+ T-DSK38 ③（真解析面：用户块围栏 0 / 标题 0 ∥ 助手块围栏 1 / 标题 1；`[data-raw]` 原文逐字）全绿 |
| 3 | **`events.mjs` 拆档**（500 硬限顶格） | 新 `thincoder-desktop/renderer/questions.mjs`（44 行：`QUESTION_KEYS` / `onQuestion` / `onTask` / `clearQuestion`）+ 新 `thincoder-desktop/renderer/badges.mjs`（23 行：`BADGES` / `badgeStamps`——单一实现）；`events.mjs` 原址 `export { clearQuestion }`（`:29`）保导出名面七不变 | `events.mjs` 500 ⇒ **473**（≤480 ✓）；既有 `events-reduce` / `views-question` / `events-page` 等档零改全绿 |

### 5.2 命令读数（本机实测）

- `cd thincoder-core && node test/run.mjs` ⇒ `ℹ tests 750 · pass 750 · fail 0`（含新档 3 例）。
- `cd thincoder-desktop && npm test` ⇒ `ℹ tests 196 · pass 196 · fail 0`（含 U175 / U176 / U177 / T-DSK38；`test/files.mjs` 已登记新集成档）。
- `git diff --name-only`（本批写域）⊆ **13 档**：核 3（`session-lifecycle.mjs` / `session.mjs` / 新 `test/session-reading.test.mjs`）+ 桌面 10（`src/main/session-slots.mjs` · `renderer/events.mjs` · 新 `renderer/questions.mjs` · 新 `renderer/badges.mjs` · `renderer/views/chat-text.mjs` · `test/history-page.test.mjs` · `test/events-page.test.mjs` · `test/views-chat-text.test.mjs` · 新 `test/integration/session-open.test.mjs` · `test/files.mjs`）——**表外零改**。
- 行数（内容行）：`events.mjs` **473** ≤ 480 · `questions.mjs` **44** / `badges.mjs` **23** ≤ 100；旁证：`session-lifecycle.mjs` 377 · `session.mjs` 254 · `session-slots.mjs` 180 · `chat-text.mjs` 73 · 用例 89 / 163 / 214 / 172 / 137（设计表「≈」预算同量级）。
- `node scripts/doc-check.mjs --root .`：本批 **零 docs 改动** ⇒ 净贡献 0；读数在本轮期间由 47/31 漂为 51/34（同工作树内他批在途写 docs；悬空行经核**不指本批四档坐标**——命中的三行为他档内相对路径形）。
- 反向对照（有牙自证）：临时停用首屏播种 ⇒ T-DSK38 红（超时等段 6）；复原 ⇒ 绿。

### 5.3 决策透明表（实施期）

| # | 决策 | 理由 / 备选 |
|---|---|---|
| 1 | 核出口追加在档尾 + import 两行（不重排既有面） | `session-lifecycle.mjs` 与 #475 同档不同面（#475 已提交 `620846d0`）——只动尾部与 import 区，零交叠（`git diff HEAD` = 两处 hunk） |
| 2 | 拆档 = **纯搬移 + 原址 re-export**（含诊断串 `[events] badge code outside closed set` 逐字保留） | 沿本仓拆分先例（`events-subscribe.mjs` 拆出后仍持 `[events]` 前缀）；前缀收正 = 报告项，不属纯搬移 |
| 3 | 时序判据落码 = `tabBadges[key]` 含 `running` | 现存唯一「回合在飞」位标（`onActivity` 置 / 回合尾三径清）；不新增位标位 |
| 4 | 端壳 `openingSeed` 每次首屏读调 `loadConfig()` | 设计定形（§6.24 判据句 3 明写 `loadConfig()` → `providersList` / `provider`）；备选（进程内缓存）须另裁 |
| 5 | 新用例号自铸：U175 / U176 / U177（桌面）+ T-DSK38 | 沿 T-DSK37 / U172–U174 先例；与在途 #477 批可能撞号 ⇒ 并号归父侧（§2.6 已披露 T-DSK38，本表补三条 U 号） |

### 5.4 审计与代码评审轮次与终态

- **内部自查（explore 只读审计 · 1 轮）**：结论 `DEVIATIONS` = 1×🔵（`thincoder-desktop/.thincoder/tmp/smoke-seed.mjs`——实施期临时冒烟脚本，审计时已删；`.gitignore` 忽略面内 ⇒ 不入 `git diff`，验收③不受影响）；PARTIAL / 静默简化 / 文档漂移三类 **零发现**；逐项判据给出 `file:line` 证据。
- **代码评审（advisor · type=code · 1 轮）**：**VERDICT = pass**（🔴 0 · 🟡 3（两在册 + 一报告项）· 🔵 2）。评审未执行测试（只读面）⇒ 其表「套件全绿未复核」已如实标注；本侧以本轮实测读数为准。
- **fix round = 0**（无必修项）。

评审响应表（逐条）：

| # | 发现 | 处置 |
|---|---|---|
| 1 | 🟡 `events.mjs` 473 行 > 300 建议线（在册） | 不修 —— 在册裁定（`PROJECT.md` §4.1：续期 + 新预案「页读径拆出」，消解窗口 = 该档下次被触碰的批） |
| 2 | 🟡 `session-lifecycle.mjs` 377 行 > 300（在册） | 不修 —— `SESSION.md` §6.24 尺度结论「拆档审视：承既有形态（既有裁定）」 |
| 3 | 🟡 首屏播种窄窗（回合尾后再开页 ⇒ 盘上旧值回写活切片；设计已按评审发现 4 定形「在飞零写」，本实现与其逐字一致） | 不修（**非偏离**）—— 建议按 AE 先例登记窄窗 ∕ 或另裁「零覆盖语义」（归父侧） |
| 4 | 🔵 `badges.mjs:13` 诊断前缀仍 `[events]` | 不修 —— 纯搬移纪律 + 本仓先例（`events-subscribe.mjs` 同持 `[events]`）；收正登记（下次触碰本档一笔） |
| 5 | 🔵 首屏读路径每次调 `loadConfig()`（同步配置读 + 可能迁移回写） | 不修 —— 设计定形（§6.24 判据句 3）；信息面登记 |

### 5.5 上抛 / 登记项（归父侧）

1. **窄窗登记（评审 #3）**：回合尾→保存完成窗内再开页 ⇒ `tasks` / `usage` 种可能覆盖活切片（AE 家族）；处置权 = 设计侧 / 父侧（登记 ∥ 零覆盖语义另裁）。
2. **越域旁注（不属本批，仅登记）**：`thincoder-desktop/test/events-reduce.test.mjs:21` 存有测试侧 `BADGES` 闭集字面副本（先于本批、未触碰）——与 `badges.mjs` 单源构成漂移风险。
3. **他批指针滞后**：`docs/desktop/design/UI.md:23` 仍把 `onQuestion` 指向 `events.mjs:161`（拆后住 `questions.mjs:18`）；名面零改（`clearQuestion` re-export 在），仅坐标滞后 —— 归该档维护批。
4. **与在途 #477 的协调**：其拟在 `history:page` 回执叠加 `flags`（`docs/desktop/design/PROJECT.md:297`）；若由 `pageHistory` 本体增键（而非 `ipc.mjs` 转口），U175 的「首屏回执键集」锁例将转红 —— 并号 / 口径归父侧。
5. **临时件披露**：实施期写 `.thincoder/tmp/smoke-seed.mjs`（冒烟自检），已删除；该目录在 `.gitignore` 面内。

## §6 验证与收口（父代理）

**验证（父侧亲跑 · 2026-09-28 06:0x）**：① `cd thincoder-core && node --test test/session-reading.test.mjs` = **R1–R3 全过 3/3**（核读数四支——与 `applySession` 后同式对拍）；② **T-DSK38 真 Electron 父跑**：`cd thincoder-desktop && node --test test/integration/session-open.test.mjs` = **1/1 pass**（1189 ms——恢复态播种两段在场 + 用户块 md 深度）；③ 全仓读数（实施侧）：核 750/750 · 桌面 196/196。

**上报处置（五项）**：① 首屏播种**窄窗**（回合尾后开页 ⇒ 盘上旧值可能回写活切片——实现与设计「在飞零写」逐字一致，**非偏离**）⇒ **记账 #490**（「零覆盖语义」另裁）；② 与在途**状态栏批**的协调（`flags` 键若由 `pageHistory` 本体增键 ⇒ U175 首屏回执键集锁例会转红）⇒ **记账 #491**（状态栏批实施时随动）；③ `UI.md:23` 指针滞后 = **文档波**（该档正处评审 #28 冻结窗——父侧在 #28 落定后同笔）；④ `events-reduce.test.mjs` BADGES 字面副本（先于本批）= **记账 #489**（测试面杂物族）；⑤ 新用例句自铸三条（U175/U176/U177，T-DSK38 已由 §2 披露）= 受理。

**提交与推送**：`b9634220`（feat: restore-state seeding + user-block md depth + events split——13 档）· 双远端已推 · 推送后核验 = `rev-list --count` 双零。

**结算（D7）**：台账 #479 / #480 → 待核销 → 已核销（evidence = 本 §6 + 提交号）· 设计槽已消费（链终态）。
