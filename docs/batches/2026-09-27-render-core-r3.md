# 2026-09-27 · render-core R3（桌面状态行 / 右列 / 会话流）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 设计批 `docs/batches/2026-09-27-desktop-ui-alignment.md`（§4 已批准 · R1–R3c 分批）；R1 已收口（86cb4cb3）· R2 已收口（d353ca53）——R3 = 桌面三舱（状态行 D17 / 右列 D20 / 会话流+会话面板 D19·D18，严格串行）；任务面 = `docs/render-core/design/RENDER-CORE.md` §8 R3a–R3c 行。
> 台账 = #466–#468（归批 · 在途）。前情 = R2 批 `docs/batches/2026-09-27-render-core-r2.md`（已收口 2026-09-27 · 提交 `d353ca53`）——R3 = 桌面三舱（严格串行 R3a ⇒ R3b ⇒ R3c）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28

### 1.1 本批口径（父侧 · 2026-09-27 23:4x ✓）

- **来源** ✓：设计批 §4 已批准；R1（`86cb4cb3`）· R2（`d353ca53`）已收口；本批 = **R3**（桌面三舱）——任务面 = `docs/render-core/design/RENDER-CORE.md` §8 R3a–R3c 行。
- **串行条**（设计 §8 硬条）：`agent-bridge.mjs` / `events.mjs` / `IPC.md` 三档共触 ⇒ **R3a ⇒ R3b ⇒ R3c 严格串行**（同档并行须先按批序串行落定）。
- **三舱面**：**R3a** = 状态行 D17（15 段裁定表 + 四项缺入站面补齐 = `ev:usage` 载荷扩接线 / 回合 N/M 归约槽）；**R3b** = 右列 D20（子 agent 块面 + 存活投影 2s 出生自愈 + `subagent:stop`）；**R3c** = 会话流经核 + 会话面板 D18/D19（`chat*.mjs` 换核构件 + 元数据族 + 核类名映射样式）。
- **边界**：VSC / CLI / 核包零触碰（核件只消费）· 需求档零触碰 · IPC.md 设计面已落（实施发现缺口 ⇒ 停报）。
- **判据面**：D17 十五段逐行 / D20 四判据 + 出生自愈 / C7 + D18·D19；门 = 桌面套件全绿（基线 171 + 新增 · 自铸用例号 U152 起）。

### 1.2 舱 a 核验 + 上抛裁定（父侧 · 2026-09-28 00:0x ✓）

- **父侧亲跑**：桌面套件 **179/179 · fail 0**（基线 171 + U154–U161）；新档 `views/statusline.mjs` 256 · `mount-status.mjs` 24 · `chrome.mjs` 239 ⇒ 163（三段同名再出口）· `events.mjs` 431 · `styles.css` 356。
- **上抛 1 裁（`currentTool`）**：**采舱 a 读法**——当前工具段 = 块面末位 running 工具块的 `name`（`blocks` 派生 · 零新槽 · 免双源）；`UI.md` 项 1 表行 4 = D17 单源（`PROJECT.md` §6.1 明示）。**设计面随动**：`RENDER-CORE.md` §8 R3a 行该词项回填（结算随收）。
- **上抛 2 裁（`ev:usage` 帧门）**：**登记为端差**（非阻塞）——帧门 `percent > 0` 使 percent 取整 0 的回合 `tokens` / `timers` 一并不达（段 8 / 12 前段不显；CLI 的 ↑↓ 与百分比不同门）；数据随 percent ≥ 1 自显（自愈）。设计面端差登记行（结算随收）；如需解耦（门外仍发两键）另起裁。
- **数值回填**：`PROJECT.md` §4.2 本批行按实读（163 / 256 + `mount-status.mjs` 24 / `styles.css` 356 / `events.mjs` 431）——设计面随动（结算随收）。
- **行号披露**：U152 / U153 已被占用 ⇒ 实用 U154 起（在册）；U50 随族档迁宿主（面与判据不变）。

### 1.3 舱 b 核验 + 交接（父侧 · 2026-09-28 00:3x ✓）

- **父侧亲跑**：桌面套件 **187/187 · fail 0**（基线 179 + U162–U169）；`tmp-probe/` **零残留** ✓；越清单披露在案（`events-subscribe.mjs` 新档 · `app.mjs` 仅注释 · `ipc.mjs` `session:delete ⇒ dispose`）。
- **上抛裁定**：① KD-RC-6「取工具名 · 丢内容」+ `IPC.md:16` 括注 ↔ D20 块形无工具位 ⇒ **采 D20 单源**（工具名仅作分流判据）——设计面随动（结算随收）；② **R3c 面 +2 点名**（`preload.cjs` `EVENT_CHANNELS` 11 ⇒ 12 · `events-subscribe.mjs` 订阅 11 ⇒ 12）——已向舱 c 补面通告；③ 「会话关闭」无端面（标签关闭 = 渲染面动作 · 主侧无该通道）⇒ **端差登记**（结算随收）；④ consult 无停止径（诚实零钮）· `events.mjs` 493 / `i18n.mjs` 392 / `store.mjs` 328 / `ipc.mjs` 214——在册登记态。
- **数值回填**（`PROJECT.md` §4.2 本批行 + 新档 `subagent-face.mjs` 行）：结算随收。

### 1.4 舱 c 粒度裁（父侧 · 2026-09-28 00:3x ✓）

- **裁 = ②「核件分件消费 · 桌面外壳留存」**（否 ①「整件替换核 DOM」）：判据 = 设计内部自洽（`UI.md:19/:25` 锚系 + 工具卡四段 = 形态单源；保留面 = 滚动 / 回填 / 窗口裁剪按 `[data-block-kind]` 查询；`PROJECT.md` §4.2 行预算以「外壳留存」为前提）· 「会话流经核」实义 = **渲染逻辑单源**（`md` / `attachCopyButtons` / `renderReasoning` / `capText` / `formatToolSummary` / `isToolFailure` 纯件消费），非 DOM 形态复制 · ① 若为真意 = 设计改写（另起）。
- 核类名映射样式档 = ② 的桥（覆盖 md 输出 / 推理块 / 复制钮）；设计与 UI.md 措辞若需收正 ⇒ 结算随收。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（舱 b（桌面右列 D20）· 2026-09-28）



### 5.1 交付摘要（舱 a = 桌面状态行 D17 · eng-coder 2026-09-27）

范围 = 设计单源 `docs/desktop/design/UI.md` §1 状态栏行 + §1「本批注（对齐重定位）」项 1（**15 段逐项裁定表**）· `docs/desktop/design/IPC.md` §1 `ev:usage` 行（载荷扩 `tokens?` / `timers?`——**设计面已落，本舱零触碰**）· `docs/render-core/design/RENDER-CORE.md` §8 R3a 行 + §10 F 行 · `docs/desktop/design/PROJECT.md` §4.2 本批行 / §6.1 D17 / §7 T-DSK33。禁改面（VSC / CLI / 核包 / `render-core` / `IPC.md` / R3b·R3c 面及其挂载）零触碰。
注：本批档 §2 派发时为模板占位（沿 R2 批先例）——本舱任务书实为派发简报 + 上述设计单源，已按此执行并在此如实登记。

**落点（行数 = 终态实读 · 内容行数口径）**：

| 面 | 件 | 判据 / 说明 |
|---|---|---|
| 状态行族档（新） | `renderer/views/statusline.mjs`（256） | 承载 12 段构树单源 + `STATUS_SEGMENTS` 段闭集 + `mountStatus` 薄挂载（自 `chrome.mjs` 拆出 —— §4.2「越 300 即拆」预案落形） |
| 状态行出档（新） | `renderer/mount-status.mjs`（24） | 槽锚 `STATUS_SLOT` + 订阅切片键面 `STATUS_KEYS` + `attachStatus()`（沿 `mount-pool.mjs` 先例） |
| 会话头留守 | `renderer/views/chrome.mjs`（239 ⇒ 163） | 会话头三段 + `sessionMetaOf`；状态行三段**同名再出口**（消费面零改） |
| 归约面 | `renderer/events.mjs`（369 ⇒ 431） | `onUsage` 三槽同笔（`usage` / `tokens` / `timers`）+ `onActivity` turn 分支（`turns` 槽 + `turnStarts` 回合起刻）+ `withReading` / `sameRecord` |
| 初态槽位 | `renderer/store.mjs`（313 ⇒ 321） | 增四槽 `turns` / `turnStarts` / `tokens` / `timers`（D17 读数面） |
| 词表 | `renderer/i18n.mjs`（363 ⇒ 388） | 增十键 ×2 语（134 键齐）；段 3「运行中」与段 7 回合 N/M **复用核 i18n 键**（`sub.running` / `status.turn`） |
| 接线 | `renderer/app.mjs`（251 ⇒ 253） | `attachStatus()` 装配 + `STATUS_KEYS` 订阅派发（`mountStatus(` 不再落 app.mjs） |
| 样式 | `renderer/styles.css`（340 ⇒ 356） | 段面 `span[data-seg]` / 警示色两 class + `--warn` 变量（亮暗两套） |
| 宿主（回调桥） | `src/main/agent-bridge.mjs`（77 ⇒ 94） | 十回调（增 `onUsage`——**非独立通道**）+ `accumulateTokens` 纯函数（CLI 同源映射） |
| 宿主（装配桥） | `src/main/agent-host.mjs`（271 ⇒ 288） | 会话累计令牌表 `usageTally` + `tokensOf` + `pendingTimers` 活读 + `postUsage` 载荷扩 + `dispose` 随清 |
| 测试面 | `test/views-statusline.test.mjs`（新 · 285）· `test/views-chrome.test.mjs`（300 ⇒ 283）· `test/views-chrome-vocab.test.mjs`（298 ⇒ 300）· `test/views-head.test.mjs`（299）· `test/events-reduce.test.mjs`（300）· `test/agent-host.test.mjs`（299）· `test/agent-host-usage.test.mjs`（183 ⇒ 240）· `test/views-locks.test.mjs`（160 ⇒ 174）· `test/host-floor.test.mjs`（294 ⇒ 297）· `test/store.test.mjs`（334 ⇒ 336）· `test/files.mjs`（19 ⇒ 20） | 用例 U154–U161（自铸续号 —— 派发简报「U152 起」为旧读数，U152/U153 已被可见面批占用，故自 U154 起，如实披露）+ U50 随族档迁宿主 |

**四项缺入站面（逐项落点）**：① **耗时** = 归约面回合起刻（`events.mjs` `onActivity` turn 首帧落 `turnStarts[key]` —— 设计给「`ev:activity` `turn` 或 `msg:send` 受理时刻」二择，取前者：`msg:send` 受理时刻在归约面不可达）→ 段 5 = 现刻 − 起刻（忙态门）；② **令牌** = 核回调用量 ⇒ 桥 `onUsage` 逐响应累入会话级令牌表 ⇒ 宿主回合尾 `ev:usage` 载荷 `tokens`（五键 `{prompt, completion, reasoningTokens, cacheHit, cacheMiss}`）⇒ 段 8（`↑/↓` + `✦` + `hit%`）；③ **计时** = 核 `_pendingTimers` 活读 ⇒ 载荷 `timers` `{count, expired}` ⇒ 段 12（`⏰N`，到期未送达 ⇒ 警示）；④ **回合 N/M** = `ev:activity` turn 载荷 `{ n, max }` 落归约槽 `turns[key]`（**有意取代** `events.mjs:215`「`n` / `max` 不落」旧态）⇒ 段 7。

**D17 十五段逐行判据表**（裁定单源 = `UI.md` §1 本批注项 1；机检 = `test/views-statusline.test.mjs` U154 / U155 / U161）：

| # | CLI 段 | 裁定 | 节点判据（桌面） | 数据源 | 断言位置 |
|---|---|---|---|---|---|
| 1 | banner（PLAN/AUTO/ADVISOR/ENG） | **旁置** | 零节点（本档零字段）；AUTO / ENG 住会话头 · PLAN / ADVISOR 本端无 | 会话头字段面（`views/chrome.mjs` `headTree`） | U154（旁置段点名）+ U154 末臂（会话头两字段） |
| 2 | 注意力 chip | **承载** | 活动键位标含 `approval` 码（审批 / 提问同码）⇒ `status-seg-warn` | `tabBadges[activeTab]` | U154 / U155（无码 ⇒ 零节点） |
| 3 | 状态文本 | **承载** | 位标含 `running` ⇒ 词 = 状态词闭枚举「运行中」 | `tabBadges` + 核键 `sub.running` | U154 / U155 + U161（词形锁） |
| 4 | 当前工具 | **承载** | 块面末位 running 工具块有 `name`（无名块跳过） | `blocks`（零新通道 —— 未落 `currentTool` 槽，见 §5.4） | U154 / U155（四臂零节点） |
| 5 | 耗时 | **承载** | 忙态 ∧ 起刻有效 ⇒ `${seconds}s`（负差夹 0） | `turnStarts[key]`（**缺入站面 ← 本舱补**） | U154（5s）/ U155（三臂）/ U157 |
| 6 | 任务计数 | **承载** | `tasks[key]` 非空数组 ⇒ `✓done/total` | `tasks[key]`（与计划卡同源） | U154 / U155 |
| 7 | 回合 N/M | **承载** | 槽两值皆正整数 ⇒ `turn ${n}/${m}`（词形单源 = 核键） | `turns[key]`（**缺归约槽 ← 本舱补**） | U154 / U155 / U161 / U88（归约槽） |
| 8 | 令牌 | **承载** | `prompt > 0` ⇒ `↑up ↓down`（+`✦` 与 `hit%` 各自非正判据） | `tokens[key]`（**缺入站面 ← 本舱补**） | U154（三件）/ U155（四臂 + 件级）/ U157 / U159 |
| 9 | 上下文 % | **承载** | 数字 ∧ `> 0` ⇒ 读数节点（≥ 80 警示 class） | `usage[key]`（已落 —— D15 / KD-20） | U154 / U155 / U150（原址） |
| 10 | 滚动位 | **旁置** | 零节点（滚动反馈 = 药丸 / 摘要块 —— `RENDERER.md` §3） | —— | U154（旁置段点名） |
| 11 | 台账标记 | **承载** | `projectInfo.thresholdReached` 严格真 ⇒ 超阈警示位（**只承警示位**，计数住左列） | `projectInfo`（已落） | U154 / U155（非严格真四臂） |
| 12 | 计时 | **承载** | `count > 0` ⇒ `⏰N`（`expired > 0` ⇒ 警示） | `timers[key]`（**缺入站面 ← 本舱补**） | U154 / U155 / U157 / U160 |
| 13 | 会话标题 | **承载** | 活动会话行命中 ⇒ 标题原样（空 ⇒ 词表缺省词） | `sessions` 行（与标签条 / 左列同源） | U154 / U155（无行 / 他键行） |
| 14 | 排队句 | **承载** | 忙态 ∨ 队非空 ⇒ 条数句 / Enter 排队句（两无 ⇒ 零节点） | `pool.queue` 队长 + 忙态（批 A 已落） | U154 / U155（三臂） |
| 15 | 键位组（`/:` · wheel · Ctrl+I · Ctrl+C） | **不适用** | 零节点（键位面由输入区 / 标签条自述） | —— | U154（不适用段点名） |

计数（D3）：**承载 12**（2–9 · 11–14）· **旁置 2**（1 · 10）· **不适用 1**（15）——与 `UI.md:125` 计数行逐值一致；段闭集 = `STATUS_SEGMENTS`（12 码，冻结）· 段锚 = `data-seg` · 段内件锚 = `data-part`（令牌三件）· 跨会话告警位（非活动标签两码）沿既有 `data-alert` 面（非 15 段之一）。

**门读数（终态实跑）**：`cd thincoder-desktop && npm test` = **179/179 · fail 0 · cancelled 0**（基线 171 + 新增 8：U154–U161；U50 迁宿主不增数）。逐例：U154 15 段逐行判据 · U155 零节点面 · U156 挂载 / 出档 / 接线 · U157 端到端（归约 ⇒ 状态行）· U158 出档面（`views-chrome.test.mjs` 原址补例）· U159 令牌累计 · U160 计时活读 · U161 核域词形锁。
**负探针（双向）**：U161 词形锁 —— 旧参名 `{n, max}`（核模板占位 = `${n}/${m}`）⇒ 桌面 `t()` 缺参原样保留 ⇒ 文本 `turn 2/${m}`、`/\$\{\w+\}/` 判红；改 `{n, m}` ⇒ `turn 2/8` 判绿（探针证毕，两向实跑）。

### 5.2 决策透明表（舱 a）

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | 状态行族**整体拆档**（`views/statusline.mjs` 256 + 出档 `mount-status.mjs` 24；`chrome.mjs` 239 ⇒ 163）——未走 §4.2 预估的「chrome ≈250 引调」形 | §4.2 该行同句「若并入 `chrome.mjs` ⇒ 越 300 即拆（预案 = 状态行族拆出）」；12 段构树 + 会话头同档必越 300 | ✅ 已落（数值越预估，见 §5.4 上抛） |
| 2 | D17 读数四槽落 `store.mjs` 初态（`turns` / `turnStarts` / `tokens` / `timers`），**不改**既有 `usage` 槽形（保留「`usage[key]` = percent 数」） | UI.md 行 9「源 = `usage[key]` 切片（已落）」= D15 / KD-20 锁面；四新槽逐段独立 ⇒ 缺片判据互不连坐 | ✅ 已落 |
| 3 | 段锚 = `data-seg`（闭集 12 码）· 段内件锚 = `data-part`；`context` 段 class 沿用既有 `status-usage`（第 14 段族 `status-seg`） | 沿「逐段包元素」先例（`data-seg` 段码记法）+ U150 既有锁（class 逐字）——零锁面改写 | ✅ 已落 |
| 4 | 状态词 / 回合两段**复用核 i18n 键**（`sub.running` / `status.turn`），端侧不另立同义键；核键占位名逐字（`${n}/${m}`） | 状态词闭枚举「词形与核 i18n / 需求档同源」（UI.md 状态词行）+ 单一权威源纪律 | ✅ 已落（U161 锁；**fix 轮 1 修点**） |
| 5 | 令牌累计住**宿主**（`usageTally` 键表 + 桥面纯函数 `accumulateTokens`）；桥按 `tokensOf(key)` 注入写、宿主按同表读 | 「会话累计」跨回合不清（CLI `state.tokens` 同口径）；桥 = 回调面单源、宿主 = 生命周期（`dispose` 随清） | ✅ 已落（U159 跨回合臂） |
| 6 | 载荷两键**常在场**（空值 = 零值：`tokens` 五键全 0 / `timers` `{0,0}`），显示门各自「非正 ⇒ 零节点」 | IPC.md「两键缺省 ⇒ 状态行对应段零节点」的**零值等价形**（零值 ≠ 缺键 —— 不假造、不空帧） | ✅ 已落（U132 零值臂） |
| 7 | 归约面：载荷缺 `tokens` / `timers` 键 ⇒ **清槽**；同槽同值 ⇒ 原引用（零重绘） | IPC.md 同行「两键缺省 ⇒ 零节点」字面 + 归约面既有「同值原引用」纪律 | ✅ 已落（U157） |
| 8 | 回合起刻 = turn **首帧**（本键此前非 running 时落）——不取 `msg:send` 受理时刻 | UI.md 行 5 二择一；`msg:send` 受理时刻归约面不可达（归约只吃事件） | ✅ 已落（披露） |
| 9 | `currentTool` **不落槽**，段 4 由 `blocks` 派生（末位 running 工具块名） | UI.md 行 4「已有切片 `blocks` —— 零新通道」（D17 单源）；`PROJECT.md` §6.1 D17 行「四项缺入站面」不含 currentTool | ✅ 已落（RENDER-CORE §8 词项对位差 → §5.4 上抛） |
| 10 | CSS：段面 + 警示色落 `styles.css`（+`--warn` 亮暗两值） | 段面需可见形（警示色为设计在册项）；`styles.css` 越 300 = 既有在册例外面（批 B 收口轮「styles 340」，预案 = 三段拆档） | ✅ 已落（+16 行 ⇒ 356） |

### 5.3 审计与代码评审轮次与终态

- **内部 explore 分歧审计（1 轮）**：A 15 段零静默省略 / B 零假造 / C 四项缺入站面端到端 / D 禁改面 / E 测试面 / F 文档漂移 —— 六面逐条实读。**出 1 🔴 + 1 🟡 + 1 🔵**：🔴 = 段 7 复用核键占位名不符（`max` vs 核 `${m}`）⇒ 生产字面残缺 `turn 2/${m}`，而测试缝自铸模板遮蔽（178/178 全绿仍带缺陷）；🟡 = RENDER-CORE §8 R3a 行含 `currentTool` 归约项 ↔ UI.md 表行 4（D17 单源）相抵（设计档间措辞分歧 → 上抛）；🔵 = 自跑日志落仓根（已清）。
- **fix 轮 1（2 处）**：① `statusline.mjs` turn 段改传 `{ n, m }`（核模板占位逐字）+ 测试缝模板同步 `${n}/${m}`（缝与生产同构）；② **新增 U161 核域词形锁**（以真 `CORE_MESSAGES` 渲染全段 ⇒ 零残留 `${…}` 才绿）+ 负探针双向实跑（旧参名 ⇒ 判红 `turn 2/${m}`；新参名 ⇒ 判绿 `turn 2/8`）。复跑 = **179/179 绿**。
- **内部 advisor 代码评审（1 轮）· verdict = pass**：0 🔴 · 3 🟡 + 1 🔵，全为**设计面 / 在册项报告**（无 must-fix）：① 令牌 / 计时段与 `percent > 0` 帧门同门 ⇒ 新会话前段（`historyPercent` 取整为 0 期间）两段不显，而 CLI 的 ↑↓ 只认 `tk.prompt > 0`（`render-frame.mjs:386`）—— 设计面耦合缺口（IPC.md 把两键定为帧扩，实施照契）；② 段 4 无忙态门 ⇒ 中断径后陈旧 running 工具名常驻（读数取自设计单源「块面末位 running」）；③ `events.mjs` 431 / `i18n.mjs` 388 / `store.mjs` 321 三档 >300（皆**已在册**：U95 例外面 / PROJECT.md §4.2）；④ `styles.css` 356 >300（反驳：该档**已在册**（PROJECT.md:125 / :175「styles 340」），+16 在既有例外内；仅建议结算面更新读数）。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 1 · fix 1；开放项 = §5.4 上抛两项 + 评审两观察项，均报告面）。

### 5.4 未动项与上抛

- **未动**：`thincoder-vscode/**` / `thincoder-cli/**` / `thincoder-core/**` / `thincoder-render-core/**` 零触碰 · `docs/**`（含 `IPC.md` —— 设计面已落，实施零缺口）零触碰 · R3b / R3c 面（`views/activity.mjs` / `views/chat*.mjs` / `views/sessions.mjs` / `preload.cjs` / `ipc.mjs`）零触碰（`git status` 实核 = 本舱写入面全在 `thincoder-desktop/**`）· 未提交（提交时机待父侧）。
- **上抛 1（设计档间措辞分歧 · 请父侧裁/回填）**：`RENDER-CORE.md` §8 R3a 行把 `currentTool` 列入「`events.mjs` 归约」；`UI.md` 表行 4（D17 单源，`PROJECT.md` §6.1 明示）为「块面末位 running 工具块的 `name`（已有切片 `blocks` —— 零新通道）」，且 D17「四项缺入站面」不含 currentTool。本舱按 UI.md 实现（不落 `currentTool` 槽 ⇒ 不与 `blocks` 双源）；请裁：RENDER-CORE §8 词项回填为「currentTool 由状态行段自 `blocks` 派生」或另裁。
- **上抛 2（设计面耦合缺口 · 非阻塞）**：`ev:usage` 帧门 = `percent > 0`（`agent-host.mjs:169`）⇒ percent 取整为 0 的回合（大窗 / 短会话）零帧，`tokens` / `timers` 两键一并不达 ⇒ 段 8 / 段 12 前段不显；CLI 的 ↑↓ 段与上下文百分比**不同门**（`render-frame.mjs:386`）。二选一交父侧：① 解耦（门外仍发两键或在「任一读数有效」时发 —— 端侧 percent 槽仍守 D15 门）；② 维持同门，设计档登记该端差。
- **观察项（评审 🔵）**：段 4 无忙态门（中断径后陈旧工具名常驻至下一回合）——读数取自设计单源，未自行扩判据；如需可加与段 3 同源忙态门（零新通道）。
- **数值回填（父侧笔）**：`PROJECT.md` §4.2 本批行 —— `chrome.mjs` 239 ⇒~250 / 新档 ≈150–220 两项按实读改（163 / 256 / +`mount-status.mjs` 24）；R2 已落读数（R3a 三项实读：`agent-bridge` 94 · `agent-host` 288 · `events` 431 · `store` 321 · `i18n` 388 · `styles` 356）；U95 `fresh` 清单已含 R3a 三新档。
- **未裁决项**：`RENDER-CORE.md` §10 F 行（计时新鲜度窗）本舱按「回合尾活读」落；空闲期到期不即时刷新 = 设计已登记项，未扩。

### 5.5 交付摘要（舱 b = 桌面右列 D20 · eng-coder 2026-09-28）

范围 = 设计单源 `docs/render-core/design/RENDER-CORE.md` §8 R3b 行 / §5 token→patch 全表（10 行 —— `⟦ev⟧stopped` ⇒ `cancelled` 先例兼容 · `error` 有意不载）/ §5「存活投影变体」行 / §4 行 21（出生自愈）· `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2（块形 / 态机 / 数据链 / 族序）+ §2 项 1 存量口径 · `docs/desktop/design/IPC.md` §1 `ev:subagent` 行 + §2 `subagent:stop` 行 + 白名单面（27 ⇒ 28）· `docs/desktop/design/PROJECT.md` §4.2 本批行 / §6.1 D20 / §7 T-DSK36（四判据 + ⑤）。禁改面（R3c 面 `chat*.mjs` / `views/sessions.mjs` / `styles` / `src/main/sessions.mjs` · VSC / CLI / 核包 · `docs/**` 含 `IPC.md`）零触碰。
注：本批档 §2 派发时为模板占位（沿 R3a 先例）——本舱任务书实为派发简报 + 上述设计单源，已按此执行并在此如实登记。

**门读数（终态实跑 2026-09-28）**：`cd thincoder-desktop && npm test` = **187/187 · fail 0 · cancelled 0**（R3a 末态基线 179 + 新增 8 例：U162–U169）；含真 Electron 两例 E2E —— 实跑读数 `[e2e] T-DSK27 ok` / `[e2e] T-DSK32 ok`。

**落点（行数 = 终态实读 · 内容行数口径 = 文末换行不计）**：

| 面 | 件 | 现行 ⇒ 实际 | 判据 / 说明 |
|---|---|---|---|
| 宿主（回调桥） | `src/main/agent-bridge.mjs` | 94 ⇒ **165** | relay 分流（`ev:subagent`，映射单源 = 核 `relayEventToSubPatch`）+ 前缀内容 chunk 消费（不入流 —— KD-RC-6）+ 存活投影挂点 `reassertLive` + per-键 relay scope |
| 宿主（子 agent 面 · 新） | `src/main/subagent-face.mjs` | — ⇒ **86** | `subagent:stop`（转核 `executeCancelAction` / `cancelSyncChild`）+ 存活投影**起 / 停 / 清点**（2s 拍体 · 档名实施批定） |
| 宿主（装配桥） | `src/main/agent-host.mjs` | 288 ⇒ **300** | 出档挂载 + `dispose` 清点面（含 relay scope 回收）；行数 = 恰 300（≤300 合规） |
| IPC 白名单 | `src/main/ipc.mjs` | 201 ⇒ **214** | 白名单 27 ⇒ **28**（`subagent:stop` 末位）+ 处理体 + `session:delete` 成功链 ⇒ `dispose`（清点生产触发点） |
| 预载 | `src/preload/preload.cjs` | 58 ⇒ **58** | `CHANNELS` +1（`subagent:stop`）· `EVENT_CHANNELS` 10 ⇒ **11**（`ev:subagent`）——两项均落既有行 |
| 归约 | `renderer/events.mjs` | 431 ⇒ **493** | 新切片 `subBlocks`（按会话键分槽）+ 核态机接入（`/rc/subblocks/state.mjs`）+ 归档（回合起清终态）+ **摘工具行** + `openSession` 读数重算 |
| 订阅 | `renderer/events-subscribe.mjs` | 68 ⇒ **69** | 十一通道订阅（+`ev:subagent`） |
| 状态树 | `renderer/store.mjs` | 321 ⇒ **328** | 增 `subBlocks` 槽；`pool` 形去 `blocks`（摘工具行） |
| 右列视图 | `renderer/views/activity.mjs` | 177 ⇒ **248** | 重写 = 子 agent 块面（块头四段 `role`/`model`/`elapsed`/`turn` + 状态词闭枚举 + 停止钮；零工具行） |
| 右列接线 | `renderer/mount-pool.mjs` | 36 ⇒ **57** | 停止出口 `stopSubagent`（零乐观写）+ `POOL_KEYS` 两键（`activeSession` / `subBlocks`） |
| 词表 | `renderer/i18n.mjs` | 388 ⇒ **392** | 族标 `pool.family.blocks` ⇒ **`pool.family.subagents`**（旧键退场）+ `pool.stop`；134 ⇒ **135** 键 ×2 语 |
| 接线（注） | `renderer/app.mjs` | 253 ⇒ **253** | 仅注释随动（十 ⇒ 十一通道）；零结构改 |
| 测试面（新三档） | `test/agent-bridge-subagent.test.mjs`（**150**）· `test/agent-host-subagent.test.mjs`（**143**）· `test/events-subagent.test.mjs`（**121**） | — ⇒ 新 | U162–U167（桥面 / 宿主 / 归约三面） |
| 测试面（随动） | `test/views-activity.test.mjs` 229 ⇒ **339** · `test/events-reduce.test.mjs` 300 ⇒ **301** · `test/store.test.mjs` 336 ⇒ **337** · `test/host-floor.test.mjs` 297 ⇒ **302** · `test/agent-host.test.mjs` 299 ⇒ **300** · `test/projects.test.mjs` ⇒ **204** · `test/session-contract.test.mjs` ⇒ **284** · `test/views-chrome-vocab.test.mjs` 300 ⇒ **309** · `test/views-locks.test.mjs` 174 ⇒ **176** · `test/files.mjs` 20 ⇒ **21** · `test/run.mjs` ⇒ **43** | | U168/U169（块面 / 停止出口）+ 各族判据随动（白名单 28 · 通道 11 · 键 135 · 摘工具行 · 池面块面） |
| 测试基建（新） | `test/rc-resolve.mjs`（**24**） | — ⇒ 新 | `/rc/` 平 node 解析钩子（`registerHooks` + `run.mjs --import`；渲染档测试/生产同取核件） |

**D20 判据表（四判据 + 出生自愈 —— 断言位置）**：

| # | 判据 | 断言位置 |
|---|---|---|
| ① | 五类射程各出块 + 零内容回显 | `test/events-subagent.test.mjs` U166（五类同径写入 · 键白名单 ⇒ 内容字段零入块）· `test/views-activity.test.mjs` U168（五类同形块 · 零工具行 · 零内容回显哨兵）· `test/agent-bridge-subagent.test.mjs` U162（relay 表逐 token 映射） |
| ② | 块态机（出生 / 终态折叠 / 归档） | `test/events-subagent.test.mjs` U167（queued → started → turn → done 全链 · settled / cancelled 两终态 · 回合起清终态 · 非活动键零清） |
| ③ | 停止往返（实收 `cancelled`） | `test/agent-host-subagent.test.mjs` U165（异步 running ⇒ abort + settle token 经桥面 ⇒ `ev:subagent cancelled` · queued ⇒ 核当场 `⟦ev⟧cancelled` · 同步族 registry 命中 · 拒态闭集）· `test/views-activity.test.mjs` U169（出口薄壳：载荷逐字 / `ok` 真 ⇒ `true` ∧ 零切片写 / 失败与抛 ⇒ 诊断 + `false`） |
| ④ | 右列零工具行 | `test/events-subagent.test.mjs` U167（工具三事件 ⇒ `pool` / `subBlocks` 引用零动）· `test/events-reduce.test.mjs` U87（`pool.blocks === undefined`）· `test/views-activity.test.mjs` U168（树面条目型闭集 = 子 agent） |
| ⑤ | 出生自愈（丢首发出生 ⇒ 一拍内复现 · 终态零再断言 · 清点） | `test/agent-host-subagent.test.mjs` U164（单拍只发在飞 · 摘表出拍 · 起拍幂等 / 停拍可重起 · **2s 真拍体出帧** · 停拍后零新帧）· `test/agent-bridge-subagent.test.mjs` U163（投影两态载荷 · `syncLive` 恒 false · queued 四字段同形 · 终态零投 · 载体双面） |
| + | 折叠头读数 = 体单源（评审 fix） | `test/events-subagent.test.mjs` U166（读数随块面 + `openSession` 重算三臂） |

### 5.6 决策透明表（舱 b）

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | 子 agent 面**出档** `src/main/subagent-face.mjs`（停止出口 + 存活投影起 / 停 / 清点），不走「附 `agent-host.mjs`」 | 设计明写「档名实施批定 ∥ 附 `agent-host.mjs`」；`agent-host.mjs` R3a 末态 288 行 ⇒ 同档必越 300 触发线 | ✅ 已落（实读 86 / agent-host 300） |
| 2 | relay scope **per-键**（`Map<会话键, scope>`），非全局一件 | 核 `createRelayScope` 的 `pendingAsync` / `queued` 以 `role#id` 为键 ⇒ 多会话同名（各会话都有 `coder#1`）时全局 scope 会串味；U162 第 ⑩/⑪ 臂锁 | ✅ 已落 |
| 3 | 前缀内容 chunk 分流 = **全消费不落任何面**（text / think / 工具调用行 / 工具输出行 ⇒ 零投）；工具名仅作分流判据，**不作第二展示面** | KD-RC-6「取工具名 · 丢内容」在 D20 块形（无工具位）与 `ev:subagent` 载荷字段集（无 tool 键）下无物化面；T-DSK36 ①④ 只判「零内容回显 / 零工具行」。**设计侧措辞分歧 ⇒ §5.8 上抛 1**（审计 + 代码评审双确认） | ✅ 已落（披露） |
| 4 | 停止钮**闸门** = 可中止事实（未终态 ∧〔`queued` ∨ `running` ∧（`pool` ∨ `syncLive`）〕）；不可中止者零钮 | 设计只给钮形未给闸门；沿「诚实非死控」律（`RENDERER.md:43`）+ VSC 门控先例（`activity-view.js` `updateStopButton`）——consult（无池 / 无 registry）⇒ 零钮 | ✅ 已落（U168 锁） |
| 5 | `subBlocks` **按会话键分槽**（`{ [key]: 块模型[] }`）+ 归档按 `ev.key` | 设计字面「**该会话**下一次回合起清出已终态块」「**该键**投影清」；键控另得：非活动会话事件不落显示面（面板随 `activeSession`） | ✅ 已落（U166/U167） |
| 6 | 每笔 `ev:subagent` 皆换切片数组引用（同值短路**不成立**） | 核态机模型**原地变更**（`block.status = …`）⇒ 数组引用即帧触发唯一判据；已在 `events.mjs` 档内登记 | ✅ 已落（登记） |
| 7 | 折叠头 `running` 读数**改源**（子 agent 在飞块数）+ `openSession` 处重算 | 摘工具行后读数无旧源；评审 #3（跨会话残留）⇒ 头（读数）与体（族）单源 | ✅ 已落（fix 轮 1 · U166 锁） |
| 8 | 测试侧 `/rc/` 取核 = `test/rc-resolve.mjs`（`registerHooks`）+ `run.mjs --import` | 平 node 无 `app://` origin；裸包名被判红（`guard-closure`）⇒ 前缀解析钩子是唯一合规形；与生产 `protocol.mjs` `CORE_ROOT` 同址同法（包名解析） | ✅ 已落（U5 闭包零回归） |
| 9 | `session:delete` 成功链 ⇒ `agentHost.dispose(key)`（清点生产触发点） | 审计 #1（🔴）：设计「会话删除 ⇒ 该键投影清」原无生产调用点；`ipc.mjs` 在册文件面内（越设计行只述白名单 —— 如实披露） | ✅ 已落（源面锁 + U165 尾） |
| 10 | `dispose` 顺带 `bridge.dropScope(key)`（relay scope 回收） | 评审 #8（🔵）：scope 懒建后随键长存 ⇒ 同键重开继承陈旧 `pendingAsync` / `queued` 缓存 | ✅ 已落（fix 轮 1 · U162 ⑪ + U165 源面锁） |

### 5.7 审计与代码评审轮次与终态（舱 b）

- **内部 explore 分歧审计（1 轮）**：7 项（1 🔴 + 4 🟡 + 2 🔵）——A 设计逐条对照 / B 越清单 / C 文档漂移 / D 判据缺口四面实读。**🔴 = 清点面「会话删除」无生产触发点**（`dispose` 只有定义 + 用例调用）⇒ 已修（`session:delete` 成功链 ⇒ `dispose`）；**🟡×4** = ①`events-subscribe.mjs` 越清单（如实披露）②设计档 §4.2 无 `subagent-face.mjs` 行 + 四档读数越估（父侧结算回填）③`PROJECT.md` D4 行 / T-DSK5 行 / `IPC.md:16` 括注与 D20 相抵（设计侧收正 —— 上抛 1）④§5 未落（本段落定）；**🔵×2** = consult 无停止径（诚实零钮 · 端差）/ `rc-resolve` 档头「派生子进程」措辞过宽（已收正）。
- **内部 advisor 代码评审（1 轮）· verdict = pass**：0 🔴 · 6 🟡 + 2 🔵，全为报告 / 在册项（无 must-fix）。其中两项行内修复（评审 #3 读数重算 · #8 scope 回收）；余为设计面 / 协调项（KD-RC-6 措辞 · consult 射程 · 「会话关闭」端面 · R3c 需 `preload.cjs` 通道 +1 · 行数在册面 · 墙钟测试臂 · 已在册）。
- **fix 轮 1（4 处）**：① `openSession` 重算 `pool.running`（读数跨会话残留）；② `dispose` ⇒ `bridge.dropScope`；③ `session:delete` ⇒ `dispose`（清点触发点）；④ `rc-resolve` 档头措辞收正 + 两处测试加固。复跑 = **187/187 绿**。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 1 · fix 1；开放项 = §5.8 上抛三项 + 观察项两项，均报告面）。

### 5.8 未动项与上抛（舱 b）

- **未动**：`thincoder-vscode/**` / `thincoder-cli/**` / `thincoder-core/**` / `thincoder-render-core/**` 零触碰（核件只消费）· `docs/**` 零触碰（含 `IPC.md` —— 设计面已落，实施零缺口）· R3a / R3c 面零触碰（`git status` 实核 = 本舱写入面全在 `thincoder-desktop/**`；`chat*.mjs` / `views/sessions.mjs` / `styles.css` / `src/main/sessions.mjs` 未触）· 未提交（提交时机待父侧）。
- **上抛 1（设计档间措辞分歧 · 请设计侧收正）**：KD-RC-6「分流 = 取工具名 · 丢内容」+ `IPC.md:16` 括注「toolCall 只取工具名」 ↔ D20 单源（`UI.md` 项 2 块形无工具位）+ T-DSK36 ①④（只判零内容回显 / 零工具行）。本舱按 D20 单源实现（工具名仅作分流判据）。二择：①（建议）设计面删 / 收正该子句 + 把「工具名不作第二展示面」登记为端差；② 若视为硬条款 ⇒ 须先补 `ev:subagent` 载荷字段 + 块位（另裁）。
- **上抛 2（协调项 · R3c 面）**：`IPC.md` §1「十二通道」按 R3 终态成文，而 `preload.cjs` `EVENT_CHANNELS` 现盘 = 11；R3c 订阅 `ev:reasoning` 前须 +1，而 `RENDER-CORE.md` §8 R3c 行文件面**未列** `thincoder-desktop/src/preload/preload.cjs` ⇒ 请派发简报点名（否则下舱漏改即订阅期 throw）。
- **上抛 3（设计清点三例之一无端面落点）**：设计「会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清」——已落 **删除**（`session:delete` ⇒ `dispose`）+ **宿主退出**（进程退出 / `unref` 定时器）；**「会话关闭」（关标签）= 渲染面动作，IPC.md §2 请求通道表无该通道** ⇒ 未落（登记端差；关标签不释放装配实例为既有复用设计）。如需覆盖须另裁主侧通道（越本舱边界）。
- **观察项 1（端差）**：存活投影射程 = 两池（`_asyncSubagents` / `_asyncAdvisors` —— 核档 §5「投影只枚举池条目」+ VSC 先例同形）⇒ ① sync 族不在拍体（`syncLive` 恒 false —— 设计既定）；② consult 族（核 `_consultSessions`）既不在拍体亦无停止径 ⇒ 块面无钮（诚实非死控，非死钮）；其「用时」亦不随 2s 拍刷新。
- **观察项 2（在册例外面 / 数值随动）**：`events.mjs` 493 / `i18n.mjs` 392 / `store.mjs` 328 三档 >300（皆在册 —— U95 例外面 / `PROJECT.md` §4.2）；`ipc.mjs` 214 >200（在册预案不变）；`agent-host.mjs` 恰 300（≤300 合规，贴层预警）。
- **数值回填（父侧笔 · 建议）**：`PROJECT.md` §4.2 本批行按 §5.5 落点表实读回填（含**新档一行** `src/main/subagent-face.mjs` 86 + `preload.cjs` 58 ⇒ 58 / `ipc.mjs` 201 ⇒ 214 / `agent-host` 288 ⇒ 300 / `agent-bridge` 94 ⇒ 165 / `events` 431 ⇒ 493 / `activity` 177 ⇒ 248 / `mount-pool` 36 ⇒ 57 / `store` 321 ⇒ 328 / `i18n` 388 ⇒ 392）；`PROJECT.md` §6.1 D4 行 / §7 T-DSK5 行 与 D20 相抵（与上抛 1 同笔收正）；`IPC.md` §1「十二通道」= R3c 界（上抛 2）。

### 5.9 交付摘要（舱 c = 会话流经核 + 会话面板 · D19 / D18 / C7 · eng-coder 2026-09-28）

范围 = 设计单源 `docs/render-core/design/RENDER-CORE.md` §8 R3c 行 / §7 C7 / §4 行 1·3·4·5·6·11·12 / §5 接口契约（`callbacks.onReasoning` · `md` · `attachCopyButtons` · `renderReasoning` · `capText`）· `docs/desktop/design/UI.md` §1 项 3·4（+ 行 19 / 25）· `docs/desktop/design/IPC.md` §1（`ev:reasoning` 行 —— **零触碰**）· `docs/desktop/design/PROJECT.md` §4.2 R3c 行 / §6.1 D18·D19 / §7 T-DSK34·T-DSK35。
注：本批档 §2 派发时为模板占位（沿 R3a / R3b 先例）—— 本舱任务书实为派发简报 + 上述设计单源，已按此执行并在此如实登记。

**父侧三裁登记（本舱执行口径）**：

① **粒度裁 = ②（核件分件消费 · 桌面外壳留存）**：核件消费四点 = `/rc/md.mjs`（文本面 + 推理内容）· `/rc/flow/stream.mjs`（`paintStreamTarget` 就地重渲 ∧ `attachCopyButtons` 代码块复制钮）· `/rc/lib.mjs`（`capText` 工具结果面）· `/rc/subblocks/state.mjs`（R3b 既落）。**整件换形（① 核 DOM 形）被拒** —— 桌面三锚 `data-block-kind` / `data-block-id` / `data-seg` 与卡壳四段头 / 耗时 / 改动摘要不动。
② **`formatToolSummary` / `isToolFailure` 不消费（非缺口）**：卡面单源 = `UI.md:25`（四段头 + 改动摘要，无结果摘要段）· 成败判据单源 = `IPC.md:40`（载荷 `ok`，与核工具出口同源）⇒ 不增设摘要段、不换判据源（另起方为设计面变更）。`capText` 已落 = 足。
③ **补面披露（父侧点名授权）**：`src/preload/preload.cjs` `EVENT_CHANNELS` 11 ⇒ **12**（+`ev:reasoning`）· `renderer/events-subscribe.mjs` 订阅表 11 ⇒ **12**（同键）—— 两处同笔 ⇒ 白名单 ≡ 订阅面两向（host-floor U76 臂 + `agent-host` U82 十一回调断言同随）。

**门读数（终态实跑 2026-09-28）**：`cd thincoder-desktop && npm test` = **191/191 · fail 0 · cancelled 0**（R3b 末态基线 187 + 新增 4 例：U170 · U172 · U173 · T-DSK37；U171 折入既有 U38 臂）；含真 Electron **三例** E2E —— 新例读数 `[e2e] T-DSK37 ok —— 块序 = user/assistant/reasoning/user · 剪贴板 = "const a = 1 < 2" · 元数据 = "p1:m1 · 3 msgs · 9月28日 00:47"`。

**落点（行数 = 终态实读 · 内容行数口径 = 文末换行不计）**：

| 面 | 件 | 现行 ⇒ 实际 | 判据 / 说明 |
|---|---|---|---|
| 宿主（回调桥） | `src/main/agent-bridge.mjs` | 165 ⇒ **174** | 十一回调 +`onReasoning`（载荷 `{ key, text }` —— IPC.md §1 同形）；**relay 前缀分流与 `onToken` 同律**（KD-RC-6：子代理 / advisor think chunk 消费不入主流） |
| 宿主（槽投影） | `src/main/sessions.mjs` | 34 ⇒ **37** | `ROW_FIELDS` +`provider`（= 核槽投影 `activeProvider` 逐字；复合串 `p:m` 核已拼） |
| 预载 | `src/preload/preload.cjs` | 58 ⇒ **58** | `EVENT_CHANNELS` 11 ⇒ 12（`ev:reasoning` 落既有行） |
| 归约 | `renderer/events.mjs` | 493 ⇒ **500** | `onReasoning` 归约（续写判据 = 尾块 `kind === "reasoning"`；空串 / 非活动键零写）· **恰 500 = 硬限顶格（余量 0）** |
| 订阅 | `renderer/events-subscribe.mjs` | 68 ⇒ **69** | 订阅表 11 ⇒ 12（同键） |
| 文本面（新） | `renderer/views/chat-text.mjs` | — ⇒ **70** | `textFace`（`div.block-text[data-raw]` + `html: md(raw)`）· `reasoningNode`（核件结构同形 `details.reasoning-block[open] > summary + div.reasoning-content`；摘要词 = 核键 `status.thinking`）· `patchTextBlock`（值变才写 + 核 `paintStreamTarget` 重渲） |
| 卡面态刷（新） | `renderer/views/chat-cards.mjs` | — ⇒ **51** | 在册拆档预案「卡构树拆出」落形（`syncCards` / `cardAnchor` —— 面 / 判据不变，只换宿主档） |
| 对话流 | `renderer/views/chat.mjs` | 299 ⇒ **280** | 换接文本面 / 推理块 + 挂点 `attachCodeCopies`（挂载 + 帧尾两径 · 幂等）+ `data-raw` 锚 + 卡构树拆出（越层触发） |
| 复制面 | `renderer/views/chat-copy.mjs` | 113 ⇒ **113** | 取文源改 `[data-raw]`（原文逐字 —— 渲染面 markdown 后 DOM 文本非原文）；就地更新面出档住 `chat-text.mjs` |
| 工具卡结果面 | `renderer/views/chat-tool.mjs` | 135 ⇒ **138** | 结果面改核 `capText`（渲染单源）；卡壳四段头 / 改动摘要 / 锚不动（裁 ②） |
| 左列 | `renderer/views/sessions.mjs` | 256 ⇒ **286** | 行元数据族 `rowMeta`（`span[data-row-meta]` + 逐值 `data-seg` = provider / msgs / updated；逐值缺席 ⇒ 零节点） |
| 词表 | `renderer/i18n.mjs` | 363 ⇒ **407** | +4 键（`rail.session.msgs` / `rail.session.updated` / `msg.copy` / `msg.copied` —— 核件复制钮两键 = **端供给面**，词值同 VSC 同键）⇒ 139 键 × 2 语 |
| 样式（新） | `renderer/core.css` | — ⇒ **133** | 核类名 → 桌面变量映射（md 产出 / 推理块 / 复制钮三族 + `task-check`）；`renderer/index.html` 一行链入 |
| 外壳随动 | `renderer/{chat.css, app.mjs, dom.mjs, styles.css}` | — | `html` prop（渲染面唯一 `innerHTML` 字面）· 核产出隔离 · 行元数据分隔符（CSS）· 仅注释随动 |
| 用例（新） | `test/views-chat-text.test.mjs` · `test/views-rail-actions.test.mjs` · `test/integration/chat-render.test.mjs` | — ⇒ **139 / 150 / 146** | U172 + U173 · U53（拆档换宿主）· T-DSK37（真 Electron） |
| 用例随动 | `test/{views, session-contract, agent-host, events-reduce, views-chrome, views-chrome-vocab, views-locks, host-floor, fake-dom, files, agent-bridge-subagent}.test.mjs` | — | U170 元数据族 · U38 臂内 provider 两向 · U82 十一回调 · T-DSK29 十二通道 · 计数随动（135⇒137⇒139）· 核类名规则读 · `fresh` 清单三新档 |

**拆档落形（本舱两处 · 先例 = 批 A / 批 7 / 批 B / R3a）**：

- `renderer/views/chat.mjs` 299 ⇒ **280** + 新档 `renderer/views/chat-cards.mjs` **51**（在册预案 = 卡构树拆出；本舱换接核文本面 +17 行 ⇒ 越 300 ⇒ 触发）。
- `test/views.test.mjs` 292 ⇒ **217** + 新档 `test/views-rail-actions.test.mjs` **150**（原址补例 U170 后越层 ⇒ 拆 U53「行控件与换形」族；面 / 判据不变，只换宿主档）。

**自铸号披露**：用例 U170 / U172 / U173（U171 = 折入既有 U38 臂，不占新号）· E2E 用例号 **T-DSK37**（`E2E-TESTING.md` §6 表未含 —— 请父侧回填）· 新档名 `chat-text.mjs` / `chat-cards.mjs` / `core.css`（`PROJECT.md` §4.2 收正随父侧）。

### 5.10 审计与代码评审轮次与终态

- **内部 explore 分歧审计（1 轮）**：八判据（C1 `ev:reasoning` 全链 / C2 核 md 转义闸 / C3 复制钮两径 / C4 推理块结构 / C5 D18 两向 / C6 文件链接零承载 / C7 保留面 / C8 禁区零触）逐条实读。**出 1 🔴 + 3 🟡 + 3 🔵**：🔴 = `onReasoning` 缺 relay 前缀分流（子代理 / advisor think chunk 会原文入主流 —— 与 KD-RC-6 字面冲突；核对 `onReasoning` **无**流式门 ⇒ 前缀必达）⇒ **已修**（桥面与 `onToken` 同律消费 + `agent-bridge-subagent` U162 ⑧ 臂补「带前缀 think chunk ⇒ 零投」与「无前缀 ⇒ `ev:reasoning` 零回归」两断言）；🟡 = `chat.mjs` 越 300（⇒ 触发在册拆档）· 设计档数值面滞后 · 新用例未入 `E2E-TESTING.md`；🔵 = `core.css` 头注覆盖面措辞 · 推理摘要尾缀 · 「唯一注入点」表述。
- **fix 轮 1（4 处）**：① 上项 🔴；② `chat.mjs` 越层 ⇒ 执行在册拆档（`chat-cards.mjs`）；③ `core.css` 头注收正（作用域容器 = 文本面两类，非「零桌面面规则」）；④ 推理摘要尾缀（核件同形 `…`）落样式档 `::after`（视图档零字形字面）。
- **内部 advisor 代码评审（1 轮）· verdict = pass**：0 🔴 · 3 🟡 + 3 🔵（含「本舱实施记录缺失」一项 —— 本 §5.9 即其处置）；**must-fix 三项全落**（死导入 `withKey` 删 · 行夹具补 `provider` 使注释与实件一致 · `core.css` 补 `task-check` 规则）；报告项（设计档措辞 / 数值面 / 在册债）见 §5.11。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 1 · fix 2；开放项 = §5.11 上抛三项，均报告面）。

### 5.11 未动项与上抛

- **未动**：`thincoder-vscode/**` / `thincoder-cli/**` / `thincoder-core/**` / `thincoder-render-core/**` 零触碰（核件只经 `/rc/` 只读消费）· `docs/**` 零触碰（**`IPC.md` 亦零触碰** —— 载荷行字段集与桥面同形，无缺口）· R3a / R3b 面（`statusline.mjs` / `subagent-face.mjs` / `subBlocks` 切片）零回归。
- **上抛 1（设计档措辞 / 数值面 · 请父侧结算随收）**：`PROJECT.md` §4.2 三行仍按「换接核构件」给缩容预算（`views/chat-tool.mjs` 135 ⇒ ~100 · `views/chat-stream.mjs` 77 ⇒ ~55 · `chat.mjs` 299 ⇒ ±40），而交付按裁 ② = **外壳留存**（`chat-tool.mjs` 未缩容 · `chat-stream.mjs` 未接核 rAF 缝合件 ⇒ 机制 3「需补面」在裁 ② 下不成立）⇒ 三行 + 新档两行（`chat-text.mjs` / `chat-cards.mjs`）+ 样式档名（`core.css` = 已落，非「拟新增」）待收正；`RENDER-CORE.md` §4 行 3/5/6 与 §5 样式契约同笔。各档实读（agent-bridge 174 / events 500 / i18n 407 / chat.mjs 280 / sessions.mjs 286 / core.css 133）随父侧回填。
- **上抛 2（E2E 用例登记）**：`docs/desktop/design/E2E-TESTING.md` §6 集成档表未含新例 `test/integration/chat-render.test.mjs`（用例号自铸 T-DSK37）⇒ 请父侧回填集成档表与 T-DSK 表。
- **上抛 3（行数贴限 · 在册债）**：`renderer/events.mjs` 恰 **500**（硬限顶格 · 余量 0 —— 在册拆分预案 `questions.mjs` 未执行，下次触碰必须执行）；`renderer/i18n.mjs` **408**（在册预案 = 词族按视图面拆第二档）；`test/host-floor.test.mjs` **301**（R3b 末态 302 ⇒ 本舱净 -1，仍越；在册例外）。三者皆未越各自硬限 / 在册，非本舱新触发。
- **观察项（评审 🔵 · 无动作）**：`renderer/core.css` 覆盖面声明现含 `task-check`（已补规则）—— 核 md 后续新类名须同笔随动。

## §6 验证与收口（父代理）

### 6.1 三舱核验（父侧亲跑 · 2026-09-28 01:0x ✓）

| 面 | 父侧读数（亲跑） |
|---|---|
| R3a | **179/179**（基线 171 + U154–U161）· 12 段单源（`views/statusline.mjs` 256 · `mount-status.mjs` 24）· `onUsage` CLI 同源映射实读 |
| R3b | **187/187**（+U162–U169）· 块态机 / 出生自愈 / `subagent:stop` 三径实收 cancelled · `tmp-probe` 零残留 |
| R3c | **191/191**（+U170–U173 · 含真 Electron E2E T-DSK37——剪贴板回读 / 元数据族）· `events.mjs` 顶格 500 在盘 |

### 6.2 裁定与披露清点（全在册）

- **裁 ②**（核件分件消费 · 外壳留存）：R3c 落地 + 设计面收正（§4 行 3/5/6 + §5 + `UI.md` 项 3 + 卡族行 18/19/20「按 ② 同判」）；`formatToolSummary` / `isToolFailure` 不消费（设计登记句）。
- 上抛裁定：`currentTool`（采 D20 单源）· `ev:usage` 帧门（端差登记）· 「会话关闭」无端面（端差登记）· consult 无停止径（登记）· KD-RC-6 收正（仅分流判据）。
- **父侧直接执行**（〔例外②③〕· 可 revert）：需求档 §3.1 / D4 粒度收正（「工具名 + 状态」⇒「角色 · 模型 · 用时 · 回合 + 状态词」）+ 示意图随动 + 变更记录行；`RENDER-CORE.md` §8 档名回填 ×2 · §4.2「拟新增」清形 · 卡族行全路径消歧（首笔曾致悬空 +2 ⇒ 已归零）。
- **doc-check**：悬空 **47 ⇒ 47**（净 0）· 行宽 **34 ⇒ 34**（净 0）。

### 6.3 在册债 / 收口

- 贴限在册：`events.mjs` **500 顶格**（下次触碰执行在册拆分 `questions.mjs`）· `i18n.mjs` 407 · `test/host-floor.test.mjs` 301 · `ipc.mjs` 214。
- E2E 登记：`E2E-TESTING.md` §6 + `PROJECT.md` §7 T-DSK37（已落）。
- 台账：**#466–#468 核销**（R1–R3 全收口）；提交：R3 面路径限提交 + 双推。
- **批收口** ⇒ R1 / R2 / R3 三批全收口 —— 桌面 UI 对齐批（设计批 §4 批准范围内 R1–R3c）**整体闭环**。
