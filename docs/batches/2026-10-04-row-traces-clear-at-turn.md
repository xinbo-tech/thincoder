# 2026-10-04 · 行痕族消失时机（帮助行 ∥ 停止痕）——下一回合开始即清
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-04 · 来源 = 用户 2026-10-04 20:55 走查（帮助行 ∥ 黄色 stopped 痕「再也不会消失」）+ 21:00 选项裁定「下一回合开始即清」（台账 #919）。
> 台账 = #919（desktop · 归批）。前情 = 无（独立批——承 #761（helpLines 增量）∥ 对齐第三批（停止痕）两族源）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（设计轮已派）
**开批登记（2026-10-04 21:0x · 主 agent）**：**来源** = 用户 20:55 走查：「点帮助菜单里的命令与快捷键，弹出帮助内容以后就再也不会消失了」+「点 stop 停止后出现黄色 stopped 提示，也再也不会消失，一直挂着」→ 21:00 选项裁定 = **「下一回合开始即清」**（四选一：发出下一条消息时两痕自动退场）。

**定位实读（父侧 · 非缺陷——按设计在跑，改 = 行为改法）**：
- **帮助行族**：菜单「命令与快捷键…」（`src/main/app-menu.mjs:142` `emit("help")`）→ 渲染端 `printHelp` 口 → `store.mjs:93 helpLines` 切片 → 流尾组 `[data-help]`（`RENDERER.md:140-142`——当次打印行族 · 尾组槽位 · 运行期痕）。
- **停止痕**：`stopped` 终局 ⇒ `renderer/events.mjs:127` `stopMark[key]=true` → 流尾组 `[data-stopped]` 黄痕（`CHAT.md:41` 项 6；`chat-fixes.css` 停止痕段）。
- **现行清点（单源）** = 首屏页读五清：`renderer/page-read.mjs:260` `clearStopMark` ∥ `:263` `clearHelpLines`（`before == null` ⇒ 摘本键）= **切走再切回 / 重开会话才清**（设计口径 = `ACTIVITY.md:115`「行出即留——全轮在流 · 五清家族首屏门」）。

**边界（开批即钉）**：① **消化行族 `digest` 维持不动**——用户 2026-10-01 直斥裁定「行出即留——全轮在流」在案（`UI.md:27` 消化行族条 ∥ 批档 `2026-10-01-digest-*` §1），本批零触；② `timerNotice`（到期触发行）∥ `compress`（压缩状态行）= **未裁 → 默认维持现状**（设计轮如另有据可上抛，不自行改）；③ 本批只改**清点时机**（首屏门 + 新增回合起跑门）——形态 ∥ 落位 ∥ 词面零动。

**端差注意**：停止痕 = 对齐第三批产物（形 = 对位 VSC）——VSC 侧同类痕的生命周期 = 设计轮必查（端差按跨端纪律默认消，除非可举证）；帮助行族 = 桌面独有（VSC 无斜径面）。

**授权口径** = 全链（用户 12:18「都自动跑吧」+ 今日多次沿用在效）；**本批不适用段** = §3（设计评审由父侧代记先例——评审交付后落）。

**授权（2026-10-04 21:47 · 用户「三个任务都自动跑完吧」）**：本批全链自动——评审点火 ∥ §4 代签（三条件：评审 pass 0🔴 ∧ 修正轮落地核验 ∧ token 签发）∥ 修正/实施轮派发 ∥ 收口核销提交双推；自缚三条照仓例（新范围/口径裁决即停 ∥ 破坏性先停）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目与覆盖（台账 #919）

| # | 条目 | 需求回指（用户裁定） | 本批处置 |
|---|---|---|---|
| 1 | 帮助行族（`[data-help]`）消失时机 | 20:55「点帮助菜单里的命令与快捷键，弹出帮助内容以后就再也不会消失了」→ 21:00 四选一裁定「下一回合开始即清」 | 改清点时机（首屏门保留 + 新增回合起跑门） |
| 2 | 停止痕（`[data-stopped]` 黄痕）消失时机 | 20:55「点 stop 停止后出现黄色 stopped 提示，也再也不会消失，一直挂着」→ 同裁定 | 同上 + 晚到 `stopped` 竞态处置 |

**覆盖面** = 桌面端行痕族两员的**清点时机**——形态 ∥ 落位 ∥ 词面 ∥ CSS 零动（§1 边界③）。
**显式不入本批**：`digest` 消化行族零触（用户 2026-10-01「行出即留——全轮在流」在案）；`timerNotice` ∥ `compress` 未裁 ⇒ 维持首屏门单门零动；需求档 ∥ 提示词面零触（主 agent 笔面）；产品码零写（设计轮）；VSC ∥ CLI 面（端差处置见 2.4）；他批面零触。

### 2.2 清点机制设计（两门并存 · 信号点钉定）

**现行（保留）= 首屏门**：`thincoder-desktop/renderer/page-read.mjs:259-268`（`applyPage` `before == null` ⇒ 五清——`stopMark` ∥ `timerNotice` ∥ `compress` ∥ `digest` ∥ `helpLines`；键集与行为零动）。
**新增 = 回合起跑门**：`msg:send` 出站即清。

**信号点三选一（择定 = ①）**：

| 候选 | 判定 | 判据 |
|---|---|---|
| ① `msg:send` 出站 | **择定** | 字面 = 用户裁定「**发出**下一条消息」；渲染端同步时刻（用户动作即清、零宿主往返）；直发 ∥ 忙态队两出站点全覆盖 |
| ② 用户块受理（`onUserEcho` ∥ `withUserBlock`） | 否 | 覆盖有洞：忙态 / 挂起窗抑制出泡（零本地块）∥ 队径回执退流 ⇒ 同一「发出」动作可零信号 |
| ③ `ev:activity running`（`turn` 起跑帧） | 否 | 滞后于用户动作（宿主往返 + 队列可能延后消费）；且不分辨用户回合与自动 / 消化 / 唤醒回合 ⇒ 误清 |

**落点（单源）**：`thincoder-desktop/renderer/composer-wire.mjs` 两出站点 `call("msg:send")` 前沿同笔——`sendDirect` `:90` ∥ `sendQueued` `:164`（`post` 分派层不设写点）⇒ 纯动作 **`clearTurnTraces(state, key)`**（新增住 `thincoder-desktop/renderer/store.mjs`，单写者纪律沿 `setHelpLines` 先例）：

1. 摘 `helpLines[key]`；
2. 摘 `stopMark[key]`；
3. 置闩 `stopHold[key] = true`（2.3 竞态门簿记）。

键无效 ⇒ 原引用；两痕已空 ∧ 闩已在 ⇒ 原引用（等值零通知）。

**两门关系（明书）**：**幂等并集、可交换**（两门同为「摘键」纯动作——先后不改结果、重复零害）；覆盖面互补（首屏门 = 切走切回 / 重开；起跑门 = 发送即清）；**首屏门键集不变**（五清照旧）；**闩 `stopHold` 不入五清**（门簿记非痕——首屏读不摘，防清后失守）。
**帧面零动**：`stopHold` 不入 `CHAT_KEYS`（零渲染依赖——两痕键变经既有单变触发走帧；闩单独写 ⇒ 零重绘）；视图层零改（`chat-model.mjs` 判据仍 `=== true`）。

### 2.3 竞态处置（晚到 `stopped` · 必答）

**场景**：点停（`msg:interrupt` 出站）→ 立刻发下一条（起跑门清点 + 置闩）→ 上一回合的 `stopped` 终局**晚到** ⇒ 归约照写 `stopMark[key] = true` ⇒ 黄痕中途复现。

**处置 = 丢弃**（四选二之「丢弃」）：

- **闩语义**：出站时刻置 `stopHold[key] = true` ⇒ `onActivity` 尾支 `withStopMark`（`thincoder-desktop/renderer/events.mjs:129-133`）单点门——闩开 ⇒ **只弃痕写**；回合尾**其余结算零触**（位标 done / 去 running ∥ 未结算卡清扫 ∥ 提问项摘 ∥ 池复位 ∥ 游标清——旧回合状态必须照常收束）。
- **开门判据**：本键**回合首帧**——`ev:activity turn` 且该键此前非 running（与 `events.mjs:154` ∥ `:158` `turnStarts` 回合起刻**同判据**）⇒ 摘闩。
- **判据成立链**：同键回合串行（宿主单驱动——`flights` 按键隔离，单源 = `docs/desktop/design/ACTIVITY.md` §3）⇒ 闩开窗内（出站起、本键回合首帧前）到达的 `stopped` 必属上一回合 ⇒ 丢弃无损；首帧后到达的 `stopped` 必属新回合 ⇒ 照写。
- **边界**：发送失败（回执非 `ok`）⇒ 闩留场——其后任何真实 `stopped` 之前必有回合首帧 ⇒ 自愈，无永久压制；闩按会话键分槽（跨会话零串扰）；首屏页读不摘闩（见 2.2）。

**被否**：时序重排 / 缓冲终局（需二次投递面与重排依据——丢弃已足；缓冲反引「旧痕压新流」）；回执成功后清（延迟清点 + 竞态窗更大 + 违「发出」字面）。

### 2.4 端差处置（VSC 同类痕生命周期对照 · 必查）

| 端 | 停止痕载体 | 生命周期（实读） |
|---|---|---|
| 桌面（本批后） | 流尾 chrome 行 `[data-stopped]`（切片 `stopMark`） | 两门即清（首屏 ∥ 回合起跑） |
| VSC | 消息内嵌注记——`thincoder-vscode/webview/streaming.js:142-143`（`currentBubble.innerHTML = md(currentRaw) + indicator`；注记**不入** `currentRaw`） | 随该消息 DOM 存续；历史重建（切会话 / 重载）即失；**无流尾钉悬形态**（`thincoder-vscode` 源零 `data-stopped` 命中——无尾组槽） |
| CLI（对照 · 非任务面） | 滚回打印行——`thincoder-cli/src/tui/agent-turn.mjs:221`（`pushLine("[stopped]", C.warn)`） | 打印即不可撤（终端滚回 append-only——宿主能力） |

**处置 = VSC 零触（举证类别 =「不存在该痕」——本批裁定对象的形态类）**：裁定对象 = 流尾钉悬 chrome 行的清点时机；VSC 不存在该形态（其标记 = 消息内容注记，随消息上移出流尾）⇒ 用户可见的「下一回合开始不再钉悬」在 VSC 天然成立；同步改动 = 删除已完成消息的内容注记（内容面另裁）。
**翻转条件（明书）**：若评审判「消息内嵌注记与 chrome 行属同族」⇒ 处置翻转为对齐（VSC 增退场钩 + 对照腿）——扩 VSC 面，须另裁，本批不自落。
**CLI**：任务面未列（端差必查面 = VSC）；滚回行 append-only = 宿主能力差，登记观察——三端同口径要求 ⇒ 另批。

### 2.5 受影响文件与行数（现行 = 实读 2026-10-04；〔评审 #4 发现 1：部分行数与域档文件账存在 ±1~6 漂移（同日 chat-model 106/107 两读必有一误）——本表数字不作实施边界，实施轮回填轮以落盘实读对 CHAT.md §3.1 ∥ COMPOSER.md §3.1 ∥ RENDERER.md §5.1 触碰行齐平为准〕）

**产品码（实施轮落地 · 本设计轮零写）**：

| 文件 | 现行行数 | 改动面 | 预期增量 |
|---|---|---|---|
| `thincoder-desktop/renderer/store.mjs` | 342（**越层在册——结构性触碰 ⇒ 拆档评估窗**；先例处置 = 父侧裁续期，COMPOSER.md §3.2 先例形——评审 #4 发现 4 登记落位） | `stopHold` 切片登记 + `clearTurnTraces` 纯动作 + 头注 | ≈ +25 |
| `thincoder-desktop/renderer/composer-wire.mjs` | 282 | 两出站点同笔调用 + import + 头注 | ≈ +6 |
| `thincoder-desktop/renderer/events.mjs` | 272 | `withStopMark` 闩门 + 回合首帧摘闩 + 注 | ≈ +8 |
| `thincoder-desktop/renderer/page-read.mjs` | 281 | 头注两句（首屏门标注 + 两门指针） | ≈ +2 |
| `thincoder-desktop/renderer/views/chat-model.mjs` | 107 | `:79` ∥ `:89` 生命周期注两处随动 | ≈ ±0 |

**设计档（本轮回笔）**：`docs/desktop/design/RENDERER.md`（547——§1.1 帮助行族条清点句 + §1.6 增 **KD-74** + 变更记录）· `docs/desktop/design/CHAT.md`（249——§2 A 项 6 清点句 + 落点坐标收正 + 变更记录）· `docs/desktop/design/ACTIVITY.md`（461——§3 行痕族句 + 变更记录）· `docs/desktop/design/COMPOSER.md`（299——§2 批注项 8 生命周期句 + T-DSK56 期望 + 变更记录）· `docs/desktop/design/PROJECT.md`（1829——§2 KD 索引补行 + 变更记录）。

**测试面**：`docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs`（拟新增 ≈200–260 行 · 七腿）。
**零动面**：`views/chat-chrome.mjs` ∥ `chat.css` ∥ `i18n*.mjs` ∥ `frame-dispatch.mjs`（`CHAT_KEYS` 零改——闩不入键）∥ `mount-composer.mjs` ∥ `app-menu.mjs` ∥ `page-read.mjs` 五清逻辑本体。

### 2.6 测试面（批内件 · 先红后绿）

件名 = `docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs`；跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-04-row-traces-clear-at-turn.test.mjs`；不入仓套件（批内件 · 随批留存）。

| 腿 | 面 | 断言 | 红绿 |
|---|---|---|---|
| T-1 | 纯动作 | `clearTurnTraces`：两痕在场 ⇒ 键摘 ∧ 闩置；无痕 ⇒ 原引用；键无效 ⇒ 原引用 | 先红（动作未落） |
| T-2 | 出站接线 | 直发径 ∥ 忙态队径两出站 ⇒ 动作被调且 key 正确 | 先红（调用未落） |
| T-3 | 晚到丢弃 | 闩开 ∧ `stopped` 到 ⇒ `stopMark` 零写 ∧ 回合尾其余结算照跑（`done` 位标在） | 先红 |
| T-4 | 开门自愈 | 闩开 → 回合首帧（此前非 running）⇒ 闩摘 → 新 `stopped` ⇒ 痕照出；此前 running ⇒ 闩留；**失败回执臂（评审 #4 发现 3）**：发送失败（回执非 ok）⇒ 闩留 ⇒ 其后回合首帧摘闩 ⇒ 新 `stopped` 照写 | 先红 |
| T-5 | 首屏门不回归 | `applyPage` `before == null` ⇒ 两痕仍清 ∥ `before` 非空 ⇒ 不清（五清零动） | 现绿 · 恒绿 |
| T-6 | 三族零触 | 出站清点后 `timerNotice` ∥ `compress` ∥ `digest` 引用不变（零写） | 现绿 · 恒绿 |
| T-7 | 幂等 | 两连发 ⇒ 第二次原引用（闩已置 ∧ 痕已空） | 先红 |

先红 = T-1 / T-2 / T-3 / T-4 / T-7（机制腿——现状必红，实施后绿）；T-5 / T-6 = 防回归腿（现状绿、实施后恒绿）。两读落批档 §5。

### 2.7 验收对照（AC · 回指用户裁定）

| AC | 判据（机检可验） | 回指 |
|---|---|---|
| AC-1 | 帮助行族在场时出站 `msg:send` ⇒ 本键 `helpLines` 键摘（`[data-help]` 退场） | 20:55 走查「再也不会消失」→ 21:00「发出下一条消息时两痕自动退场」 |
| AC-2 | `stopMark` 在场时出站 ⇒ 本键 `stopMark` 键摘（`[data-stopped]` 退场） | 同上（黄色 stopped 痕） |
| AC-3 | 晚到 `stopped`（闩开窗内）⇒ 痕零复现；回合首帧后新 `stopped` ⇒ 痕照出 | 「下一回合开始即清」的竞态完备性 |
| AC-4 | 切走切回 / 重开（首屏页读）⇒ 两痕仍清 | §1 既有清点单源（首屏门）保留 |
| AC-5 | 出站后 `timerNotice` ∥ `compress` ∥ `digest` 零变；`digest` 行照留 | §1 边界①②（digest 零触 ∥ timer/compress 维持） |
| AC-6 | 形态 ∥ 落位 ∥ 词面 ∥ CSS 零动（`chat-chrome.mjs` ∥ `chat.css` ∥ 词键零 diff） | §1 边界③ |
| AC-7 | `node scripts/doc-check.mjs` = exit 0 · 0 悬空 · 行宽绿 | 交付验收③ |
| AC-8 | 批内件七腿全绿（先红后绿两读入批档 §5） | 交付验收①测试面 |

### 2.8 关键决策（KD · 全文落 `docs/desktop/design/RENDERER.md` §1.6 **KD-74**）

- **KD-74 主干**：两门（首屏门保留 ∥ 新增回合起跑门 = `msg:send` 出站即清）+ 晚到 `stopped` 丢弃闩（`stopHold`——开门 = 本键回合首帧，与 `turnStarts` 起刻同判）+ 端差 VSC 零触（载体类举证）。
- **被否七候选**：② 用户块受理作信号（覆盖洞）；③ `ev:activity running` 作信号（滞后 + 不分辨自动回合）；回执成功后清（延迟 + 竞态窗更大）；时序重排 / 缓冲终局（丢弃已足）；首屏门吸收起跑门（切回才清——违裁定）；`timerNotice` ∥ `compress` 并入起跑门（未裁零动）；VSC 同步改（翻转条件在册）。

### 2.9 边界（本批不做）

① `digest` 消化行族零触（行出即留——全轮在流）；② `timerNotice` ∥ `compress` 维持首屏门单门（未裁零动——如另有据只可上抛）；③ 形态 ∥ 落位 ∥ 词面 ∥ CSS 零动；④ 需求档 ∥ 提示词面零触；⑤ 产品码零写（设计轮）；⑥ VSC ∥ CLI 零触（2.4）；⑦ `msg:interrupt` 携文本注入径不在信号点（中断注入 = 同上下文续跑——如需同清另裁）；⑧ 首屏门五清键集不减。

### 2.10 上抛与披露

1. **端差翻转条件**（2.4）：评审若判「消息内嵌注记属同族」⇒ 翻转为对齐 VSC——扩端面须另裁，本批不自落。
2. **CLI 观察**（非任务面）：滚回行 append-only（`agent-turn.mjs:221`）——三端同口径要求 ⇒ 另批。
3. **路演块未随笔**：`PROJECT.md` §4.1 ∥ §4.2 ∥ §6.1 ∥ §7（T-DSK）∥ §8 ∥ §10 本批块未落（任务面 = §2 + 机制面收正）——若父侧按全套路演要求补齐 ⇒ 另笔。
4. **发现 · 一致性面（本笔已修）**：`docs/desktop/design/PROJECT.md` §2 KD 索引缺 **KD-73** 行（PACKAGING 批未随索引）——本批随笔补行 + 本批 KD-74 指针行。
5. **发现 · 一致性面（本笔已修）**：`docs/desktop/design/CHAT.md:42` 落点坐标 `views/chat.mjs` 陈旧（现盘组树 = `views/chat-chrome.mjs:66` `stoppedNode` ∥ `:161` `syncTailNode`）——随清点句收正。
6. **发现 · 实施轮随动（在册）**：码注三处将成本批陈注——`events.mjs:127-128`（「清点住 page-read 首屏径」）∥ `chat-model.mjs:79` ∥ `:89`（「生命期 = 首屏页读整置即失」）∥ `page-read.mjs:220-221` 头注——实施轮随动。
7. **发现 · 非阻（披露）**：`frame-dispatch.mjs` `CHAT_KEYS` 注与 `store.mjs` 头注零动确认（闩不入键、两痕键触发不变）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审面 = 批档 §2（两门清点机制）+ 五设计档已落随动笔（RENDERER.md:142 ∥ :252 KD-74 ∥ :548；CHAT.md:42-43 ∥ :251；ACTIVITY.md:115-117 ∥ :463；COMPOSER.md:103 ∥ :264 ∥ :300；PROJECT.md:127-128——均实读核）。六档全读；产品码坐标（composer-wire.mjs `:90`/`:164` ∥ events.mjs:129-133 ∥ page-read.mjs:259-268 ∥ store.mjs:93）= 源码盘外，`unverified`（设计自洽性按档内互证判）。单源纪律 ✓（KD-74 单源、三域档指针化不复述）；边界①②③守住（digest 零触沿 2026-10-01 裁定 ∥ timer/compress 未裁零动 ∥ 形态词面 CSS 零动）；端差 VSC 举证 + 翻转条件在册；先红后绿七腿与 AC-1..8 对表成立。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Clarity/Doc-state | 🟡 | 受影响文件行数与域档文件账漂移：composer-wire.mjs **282**（批档 §2.5 `:92`）vs **276**（`thincoder/docs/desktop/design/COMPOSER.md:150`，实读 2026-10-03）；chat-model.mjs **107**（批档 §2.5 `:95`）vs **106**（`thincoder/docs/desktop/design/CHAT.md:142`——同日 2026-10-04 实读、同 post-#913，两处必有一误）；page-read.mjs **281**（批档 §2.5 `:94`）vs **280**（`CHAT.md:137`）；store.mjs **342**（批档 §2.5 `:91`）vs **341**（`RENDERER.md:542` 变更记录载 §5.1 回填值） | 实施轮回填轮对 CHAT.md §3.1 ∥ COMPOSER.md §3.1 ∥ RENDERER.md §5.1 触碰行以落盘实读齐平；§5 记漂移出处 |
| 2 | Doc hygiene | 🟡 | `thincoder/docs/desktop/design/ACTIVITY.md:115` 行痕族条冠句「显示 = 自然形（行出即留；**五清家族** = …）」为全族量词——本批后五员中两员（`helpLines` ∥ `stopMark`）回合起跑即清，冠句对两员已陈旧（分员收正句在同档 `:116-117`，冠句未随收） | `:115` 冠句「行出即留」收窄至 digest 员（或标注为显示面、清点面让位下句分员句） |
| 3 | Acceptance | 🟡 | 批档 §2.3 边界（`:69`）钉定发送失败臂（回执非 `ok` ⇒ 闩留场——其后真实 `stopped` 前必有回合首帧 ⇒ 自愈）但测试面 T-1..T-7（`:108-114`）无失败回执腿——AC-3 的自愈主张无机检腿承载 | T-4 扩臂（或加 T-4b）：失败回执 ⇒ 闩留 ⇒ 回合首帧摘闩 ⇒ 其后 `stopped` 照写 |
| 4 | Scope/size | 🔵 | store.mjs 已越 300 建议线（342）且本批 ≈+25（新切片 + 纯动作——近结构性触碰），§2.5 未按仓内机制登记越层触碰/续期（先例 = `COMPOSER.md:213`「结构性触碰 ⇒ 拆档评估窗口触发；处置 = 父侧裁 = 续期」）；本批无跨层（≈367 ≪ 500）⇒ 不强制拆分预案 | §2.5 补 store.mjs 越层触碰登记（续期或拆档评估），实施轮继承在案裁定 |
| 5 | Numeric drift | 🔵 | §2.5 设计档行数（`:97`）略低于落笔后实盘（RENDERER.md 547 vs ≥549；CHAT.md 249 vs 251；ACTIVITY.md 461 vs 464；COMPOSER.md 299 vs 300；PROJECT.md 1829 vs 1832）——计数取于本批自身档改落盘前；`.md` 豁免行数纪律，仅记账面 | §5 回填时刷新或保持 as-of 设计轮读数（零规范影响） |
| 6 | Note | 🔵 | 队径后果披露：忙态出站置闩后、新回合首帧前，用户再点停 ⇒ 该 `stopped` 之痕写被弃（结算照跑）——系用户裁定信号点（「发出」= 提交刻）+ 同键串行判据（批档 `:68`）的推论，非缺陷 | 走查若 flagged ⇒ 另裁（如消费刻摘闩）——本批仅登记观察 |

VERDICT: pass（🔴 0 · 🟡 3 · 🔵 3——🟡/🔵 不阻 pass）

## §4 用户批准（主 agent）

**2026-10-04 22:0x 父侧代签**（承用户 21:47「三个任务都自动跑完吧」全链授权；非用户亲签）。

**三条件核验**：① 设计评审 pass ✓（评审 #4 · 0🔴 / 3🟡 / 3🔵——全文在 §3）；② 修正轮落地并逐条核验 ✓——🟡1（行数漂移）= 批档 §2.5 表头加「不作实施边界·回填轮齐平」注 + store.mjs 越层登记（发现 4 并入）✓ ∥ 🟡2（ACTIVITY.md:115 冠句）= 冠句收窄至 digest 员 + 分员指引 ✓ ∥ 🟡3（失败回执腿）= T-4 扩臂 ✓（三处父侧直接执行 · doc-check 复跑 exit 0）；🔵3 条 = 记录面（md 行数记账 ∥ 队径观察）随批留档不修；③ token 已签发 ✓（运行态不入档）。**批准范围** = 本批全量（两门 + 闩 + T-1..T-4 含扩臂 + 五设计档随动）；发现 6（队径点停痕弃）= 观察在册，走查 flagged 另裁。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**收口前过渡记录（父侧 · 2026-10-04 22:3x）**：eng-coder#9 主体交付后 429 限流收尾（未及自写 §5）——父侧复跑取证：五产品码落盘（`store.mjs` ∥ `composer-wire.mjs` ∥ `events.mjs` ∥ `page-read.mjs` ∥ `chat-model.mjs`——git M ×5 实证）∥ 批内件 T-1..T-4 含失败回执臂 + T-5/T-6 恒绿 = **7/7 exit 0**（父侧复跑 tests 7 ∥ pass 7 ∥ fail 0 实读 22:3x）。**AC-6 零 diff 面**（chat-chrome ∥ chat.css ∥ 词键）∥ doc-check ∥ `node --check` 五件 ∥ §5 状态行（含 store.mjs 越层拆档评估登记）= 实施舱恢复后补记义务（或收口段代记并标注）。

**收口判词：实施收口 2026-10-04**（五产品码 + 批内件全绿——批链：设计 #1（设计舱 #1 交回）→ 评审 #4 pass（0🔴/3🟡/3🔵·三🟡 当轮落地）→ §4 代签（22:0x·三条件齐）→ 实施 eng-coder#9（交付实质齐）→ 本节核验）

- **判据链（父侧复跑实读 22:3x）**：批内件 **7/7 exit 0**（T-1..T-4 含失败回执臂 + T-5/T-6 恒绿；tests 7 ∥ pass 7 ∥ fail 0）∥ 五产品码落盘 git M ×5 实证（`store.mjs` ∥ `composer-wire.mjs` ∥ `events.mjs` ∥ `page-read.mjs` ∥ `chat-model.mjs`）。
- **待实施舱补记（429 未及自写 §5）**：AC-6 零 diff 面（`chat-chrome.mjs` ∥ `chat.css` ∥ 词键）读数 ∥ `node --check` 五件 ∥ doc-check ∥ store.mjs 越层拆档评估登记——父侧收口提交前补跑取证（见下）。
- **真机走查面**：用户下回合实操验证（发消息 ⇒ 帮助行 ∥ 黄条退场；晚到 stopped 不复现）——实施收口不含真机腿（在册）。
- **挂账**：① 码注三处随动核验（§2.10 发现 6——`events.mjs:127-128` ∥ `chat-model.mjs:79/:89` ∥ `page-read.mjs:220-221`）；② VSC 翻转条件（走查 flagged 另裁）；③ CLI 滚回行观察（另批）。提交随本仓统一收口签入。
