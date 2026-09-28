# 2026-09-28 · 桌面 · 回合中插入用户指令（步边界 pickup 接线）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 14:08 走查发现（桌面端「会话中插入用户指令」缺失）；父侧三端实读定性 = 核缝在位（agent.mjs:244）· CLI/VSC 已接 · 桌面未接；台账 = 同刻登记。
> 台账 = #509（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 来源（用户 2026-09-28 14:08 走查）

用户原话：「还发现会话中插入用户指令的功能在桌面端也丢了。」

### 1.2 实读定性（父侧 · 三端对照）

| 端 | 步边界 pickup（回合中插入） | 证据 |
|---|---|---|
| 核（缝） | 缝在位 · 策略不给（缺省 null） | `thincoder-core/agent.mjs:244-247` `consumeQueuedInput?.(agent)` |
| CLI | ✅ 已接 | `thincoder-cli/src/tui/queued-pickup.mjs:22-34` + 入队面 `key-handler-busy.mjs:19-44` |
| VSC | ✅ 已接 | `thincoder-vscode/src/agent.mjs:210` + `extension/panel-turn-loop.mjs:106` |
| 桌面 | ❌ 未接 | 宿主在飞拒 `busy`（`agent-host.mjs:170`）· 执行面四参无缝（`turn-face.mjs:30-35`）· 渲染面仅回合尾 flush（`mount-composer.mjs` ③④ / `flushTurnTail`） |

⇒ 桌面忙态消息 = 当前回合结束后的新回合（回合尾投递）；正在跑的回合**零注入**——用户指令「下一步生效」体验缺失。

### 1.3 本批条目（拟 · 设计轮定形）

- **B1 宿主接缝**：忙态 `msg:send` 受理（按会话键入队）+ 单回合执行面传 `consumeQueuedInput`（步边界取批注入——形 = CLI/VSC 同源：`pushReal` 普通 user 消息落历史 · 不中断）；
- **B2 渲染面时序**：入队 / 注入 / 回合尾兜底的呈现与队列读数对齐（预期形 = 步边界注入可见 + pending 呈现；设计定形）；
- **B3 边界**：附件项——核 pickup 面 = 文本单形（VSC 队列条目携 `images` = 端差）；桌面队条目形 `{ text, ts }` 载不了图（「宁留不丢」在册）⇒ 设计轮裁定处置（留队 / 拒 / 拆行）。

### 1.4 边界与串行

核件零改（缝已存在——只接不改）；不新增机械门；桌面文件面（`src/main/**` + `renderer/**`）与在途批（align-2 / idle-wake 收口 / align-3 实施）**同片 ⇒ 串行**；设计排「timer-wake 阶段 2」设计之后（防两设计师同档并发写 `docs/desktop/design/`）。

### 1.5 落点

台账 = **#509**（待设计 → 在途）；需求档 D 点随落 = 父侧（设计定形后）；同族 = #495（排队可见性 · 显示面）/ #494 系；本批 = 插入时机（机制面）。

### 1.19 在飞裁定登记（2026-09-28 17:0x · 承 #39 两条设计缺口 ask）
1. **slash 尾径**（父侧裁定）：步边界零动作（防御面原样）∥ **回合尾对 slash 首条按「逐条直发」消费**（单条 · 保序 · 不合并 · 零静默丢——与桌面闲态同文本同语义；桌面无斜杠面〔需求 §3.5〕⇒「两处皆零动作」造死结不采纳）。设计句由设计档收尾轮落（在途）。
2. **步边界缝 timer 轮归属**：缝按 `autoTurn` 分流（用户回合传 ∕ 消化轮不传）+ **timer 轮（`timerTurn` 真 ∥ `autoTurn` 假）= 普通回合（接缝消费）**。设计句随落（在途）。
3. 另：#39 审计项「`history:page` 未装配径补 `queue: []`（键恒在场）」已修（在案）。

### 1.20 §1.19-2 更正（父侧 · 2026-09-28 17:1x——经设计收尾轮 #44 在盘核读）
- 在盘实读：timer 轮实形 = `{ autoTurn: true, timerTurn: true }`（三端同形——`timer-watch.mjs` 桌面 :77 ∕ CLI :88 ∕ VSC :98；T-TW18/T-TW21 锁形）；缝判据 `turn-face.mjs:44` = `opts.autoTurn === true ⇒ null` ⇒ **timer 轮在盘 = 缝不传（不消费）**；核档 `:37-38`「用户回合（`autoTurn === false`）；系统轮不参与」同向。
- **归属句按 ① 落**（设计收尾轮）：timer 轮同按 `autoTurn` 分流——`autoTurn` 真 ⇒ 与消化轮同、缝不传；队列留待该轮回合尾续发。
- §1.19-2 原措辞（「`timerTurn` 真 ∥ `autoTurn` 假」组合）系据 #39 报告转述失准（其在盘实现 = `autoTurn` 单判据，与 ① 已符）——作废，以本行为准（记录面更正）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（B1–B3 全落 · 落点五档（IPC / PROJECT / RENDERER / UI / E2E）· 需求档零笔 · doc-check 净 0（悬空 64 · 行宽 35）2026-09-28）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>


### 2.1 本批条目（覆盖 = B1–B3 · 台账 #509）

| # | 条目 | 设计裁定（一句话） |
|---|---|---|
| B1 | 宿主接缝：忙态 `msg:send` 受理（按会话键入队）+ 单回合执行面传 `consumeQueuedInput` | **队列单源 = 宿主**（`thincoder-desktop/src/main/queued-input.mjs`（拟新增）——容量 8 按键判 · 计划取批与 CLI / VSC 同值）；在飞 ⇒ 入队（回执 `{ ok: true, queued: true }`；满 ⇒ `queue-full`）；`turn-face.mjs` 传 `consumeQueuedInput`（用户回合传 ∕ 消化轮不传）= `pushReal` 普通 user 消息（不中断 · 下一步生效） |
| B2 | 渲染面时序：入队 / 步边界注入 / 回合尾兜底三时刻呈现 + 队列读数对齐 | **镜面 + 消费回执**：`pending` 切片 = 宿主快照镜像（写者 = `ev:queue` 归约；`history:page` 回执 `queue` 键重建）；三时刻同形呈现（气泡 → 用户块同位置交接；段 14 读数随镜面）；**渲染面回合尾 flush + `onTurnTail` 窄口退役**；回合尾兜底 = **宿主续发**（结算后队非空 ⇒ 取批送达，递归至队空 ⇒ 队空才进挂起窗接管） |
| B3 | 附件边界：队条目载不了图 | **留队**（VSC 形 · 端差消灭）：条目携 `images`；批内含图 ⇒ 步边界让位（同步缝不可落盘 ∕ 降级）；送达面 `prepareTurnAttachments` 判决 · `degraded` 随消费回执浮出；气泡显示文本（图随条目走） |

### 2.2 设计档落点（本批已落）

| 档 | 落点 |
|---|---|
| `docs/desktop/design/PROJECT.md` | §2 **KD-40**（决策 + 被否候选五条）· §2.2 忙态排队面随动句（队列先于接管）· §4.1 本批触碰档（就地给数）· §6.1 「回合中插入批」验收注 · §10 **BK–BM** 三行 · 变更记录 |
| `docs/desktop/design/IPC.md` | §1 增 **`ev:queue`** 行（排队面两形）+ 载荷键集 ∕ 会话键面 ∕ 订阅面计数 **十七 ⇒ 十八通道**；§2 `msg:send` 行（忙态受理 + reason 增 `queue-full` · `busy` 收窄至挂起窗附件面）· `history:page` 回执增 `queue` 键 · 变更记录 |
| `docs/desktop/design/RENDERER.md` | §1.1 回合尾三径条（消费面两处 + flush ∕ 窄口退场 + `ev:queue` 归约两形）· 帧尾态刷（待发送气泡组写者）· 用户块条（写者扩「排队消费回执」径）· 变更记录 |
| `docs/desktop/design/UI.md` | §1 增「本批注（回合中插入 · 步边界 pickup）」五项 + D3 计数；输入区行 ∕ 表行 14 ∕ 「对齐第二批」项 2 就地随动 · 变更记录 |
| 需求档 | **本设计不改**（笔权在父侧）——需求面提案见 §2.7（拟 D25） |
| 核件 / CLI / VSC | **零改**（缝已存在 = `thincoder-core/agent.mjs:244-247`；他只读参照） |

### 2.3 机制设计指要（勿复述——单源在档）

- 队列 ∕ 受理 ∕ 消费 ∕ 附件四面 = `docs/desktop/design/PROJECT.md` §2 **KD-40**；
- 通道形（`ev:queue` 两形 · `msg:send` 回执与 reason 面 · `history:page` `queue` 键）= `docs/desktop/design/IPC.md` §1 ∕ §2；
- 形态面（三时刻呈现 ∕ 读数 ∕ 边界）= `docs/desktop/design/UI.md` §1 本批注；归约面 = `docs/desktop/design/RENDERER.md` §1.1。

### 2.4 受影响文件与测试面（预估——实施轮实读回填）

| 面 | 文件 | 现行 ⇒ 预期 |
|---|---|---|
| 宿主 | `thincoder-desktop/src/main/queued-input.mjs`（拟新增） | — ⇒ ≈90（队列 + 计划取批） |
| 宿主 | `thincoder-desktop/src/main/agent-host.mjs` | 285 ⇒ ≈330（受理路由 + 续发链；越 300 ⇒ 预案 = 续发链提取 `turn-chain.mjs`（拟新增）——上抛 §2.7②） |
| 宿主 | `thincoder-desktop/src/main/turn-face.mjs` | 52 ⇒ ≈60（`consumeQueuedInput` 传参） |
| 宿主 | `thincoder-desktop/src/main/ipc.mjs` | 224 ⇒ ≈228（`history:page` 回执 `queue` 叠加） |
| 宿主 | `thincoder-desktop/src/preload/preload.cjs` | 58 ⇒ ≈59（`EVENT_CHANNELS` +1） |
| 渲染 | `thincoder-desktop/renderer/queue.mjs` | 45 ⇒ ≈35（三纯动作 ⇒ 快照应用） |
| 渲染 | `thincoder-desktop/renderer/events.mjs` · `events-subscribe.mjs` | 494 ⇒ ≈510 · 69 ⇒ ≈64（`ev:queue` 归约；窄口退役） |
| 渲染 | `thincoder-desktop/renderer/mount-composer.mjs` · `app.mjs` | 362 ⇒ ≈300 · 254 ⇒ ≈250（忙态交宿主任判 + flush 退役；**在册预案「发送面拆 `composer-send.mjs`」本批落形**） |
| 测试面（随修随加——不占设计条目，2026-09-27 裁定） | `test/queued-input.test.mjs`（拟新增）· `test/agent-host.test.mjs` · `test/events-reduce.test.mjs` · `test/store.test.mjs` · 集成域真机新档 | 计划面平 node 直测 + 与 CLI 副本值对拍 ∕ 宿主四例（入队 ∕ 注入 ∕ 续发 ∕ 中止清队）∕ `ev:queue` 归约两形 ∕ 切片锁随动 ∕ **T-DSK45** |

### 2.5 验收对照（机检 ∕ 真机面点名——D16 义务）

| # | 判据（机检） | 真机面 |
|---|---|---|
| AC-1（B1） | 在飞 `msg:send` ⇒ 回执 `{ ok: true, queued: true }` ∧ 条目入宿主队（快照在场）；第 9 条 ⇒ `{ ok: false, reason: "queue-full" }` ∧ 零入队 | 忙态提交 ⇒ 气泡在场 ∧ 段 14 读数 = 1（零 `busy` 拒面） |
| AC-2（B1） | 核循环头回调在场（用户回合非 null / 消化轮 null）∧ 注入 = `pushReal` 普通 user 消息（signal ∕ 在飞工具零触碰——不中断）；批 ≥2 ⇒ 合并一次消费（值同 CLI ∕ VSC 计划面） | 忙态发两条 ⇒ 首条于下一步边界后可见（用户块） |
| AC-3（B1） | 结算后队非空 ⇒ 宿主续发（递归至队空）；队空 ⇒ 既有 `takeOver` 接管；会话中止 ⇒ 队清 + 零续发 | 末条随回合尾送达（无需用户再按 Enter） |
| AC-4（B2） | 归约：状态形 ⇒ 镜面整置；消费回执形 ⇒ 镜面整置 + 用户块（键门 = 活动会话）∧ 尾块 = `user`；`history:page` 回执 `queue` 重建镜面 | 气泡退场 ∧ 用户块同位置交接（标签回 `❯ You:`）∧ 段 14 随动 |
| AC-5（B3） | 携图条目 ⇒ 步边界不消费（让位）；结算续发 ⇒ 附件面被调 + `degraded` 随回执 | 忙态携图提交 ⇒ 气泡在场（文本）⇒ 送达后模型侧得图指引 |
| AC-6（D16） | — | **T-DSK45**（真 Electron：忙态发两条 ⇒ 首条步边界注入可见 + 气泡交接 + 段 14 读数）——集成域新档，父侧真跑闭合 |
| AC-7（零改面） | 核件零改（缝只接）· CLI ∕ VSC 零改 · 挂起窗输入面（`pushInput`）零改 · 附件落盘面零改（送达面复用）· KD-23 出泡判据零改（除本批明列两句） | — |

### 2.6 关键决策（本批）

- **KD-40**（已落 `docs/desktop/design/PROJECT.md` §2）——忙态入队 = 宿主单源 + 步边界取批注入 + 回合尾续发（渲染面镜面）；被否候选五条（队列仍住渲染面 ∕ flush 与续发并存 ∕ 拆行 ∕ 拒 ∕ 入队即落盘 ∕ 窗队与忙态队合并——各带否因）。
- **队列先于接管**（回合尾序）：队非空 ⇒ 先续发；队空 ⇒ `poolLive` 才进窗——用户输入优先（D-S5 桌面落形）+ 闭「图条目不可入核件窗队列」错位面。
- **`busy` 码收窄**：普通在飞不再拒（入队）；仅挂起窗 + 附件面保留（核件输入面 = 文本单形——既有）。
- **渲染面 flush 退场**（非并存）：双写者 ⇒ 同条重复投递（同一消息被渲染面 flush 与宿主续发各投一次）。

### 2.7 上抛项（实施 ∕ 评审前请父侧知悉）

① **需求面提案（笔权在父侧）**：需求档 §4 拟增 **D25「回合中插入（步边界 pickup）」**——「忙态提交 ⇒ 按会话键入队；步边界取批注入（不中断 · 下一步生效）；回合尾续发兜底；队列＝宿主单源 + 渲染面镜面；附件条目携图（步边界让位 · 送达面判决）」；落点 = `docs/desktop/requirements/PROJECT.md`（D 表续号；本设计随落）。
② **越层档上抛**：`thincoder-desktop/src/main/agent-host.mjs` **285 ⇒ ≈330**（越 300）——预案 = 续发链提取（档名实施批定）；执行 ∕ 续期 = 父侧裁（§4.1 本批行 + §10 BL）。
③ **登记三项**（§10 BM）：队条目携图 = 宿主内存（量级同提交前）· 气泡显示文本（图不入快照——两端同形）· 队列 = 运行期切片（重启即失）。
④ **端差说明（有意保留）**：合并注入形态（`你排队了 N 条消息：…`）为 zh 字面（CLI ∕ VSC 同值）——渲染面仅透传显示，零 CJK 字面入渲染面码（机检面不受影响）。

### 2.8 设计收尾微轮（2026-09-28 · eng-designer——承 §1.19 两条设计缺口 + §5 转报）

**落笔三处**：

① **slash 尾径句（两档同拍）**——`docs/desktop/design/PROJECT.md` §2 KD-40 尾补「**边界（slash 尾径）**：步边界零动作（防御面原样——斜杠文本入队门禁零改）∥ 回合尾对 slash 首条按「逐条直发」消费（单条 · 保序 · 不合并 · 零静默丢——与桌面闲态同文本同语义；「两处皆零动作」造死结不采纳）」+ `docs/desktop/design/UI.md` §1 本批注项 5 同拍收正；
② **timer 轮路由句（两档同拍）**——KD-40 ② + UI 本批注项 2 补「timer 轮（`timerTurn` 真）同按 `autoTurn` 分流——`autoTurn` 真 ⇒ 与消化轮同、缝不传；队列留待该轮回合尾续发」。
   **裁决 = 父侧回执 ①**（2026-09-28）：§1.19-2 措辞据 #39 报告转述失准，父侧更正入记录面 §1.20；在盘实现单判据（`thincoder-desktop/src/main/turn-face.mjs:44`）= ①，零代码改；
③ **用户块 `ts` 载波（存量漂移 · §5 U-5）**——`docs/desktop/design/RENDERER.md` §1.1 用户块条块形句 ⇒ `{ kind: "user", text, ts? }`（「对齐第二批」项 4 产出；非有限数 ⇒ 键缺席）。

**落点随正（父侧补令）**：`docs/desktop/design/PROJECT.md` §6.1 本批注机检面 ∥ `docs/desktop/design/E2E-TESTING.md` §6 `T-DSK45` 行 ⇒ **`thincoder-desktop/test/agent-host-queued.test.mjs`**（U217–U219——原 `thincoder-desktop/test/agent-host.test.mjs` 触 500 硬限按在册预案拆出；假面共享 = `thincoder-desktop/test/agent-host-harness.mjs`）；
PROJECT.md §4.1 本批块补**实施实读漂移注**（新增四档 + `thincoder-desktop/renderer/page-read.mjs` 表外随动——归回填轮，未就地回填）。

**机检读数**：`node scripts/doc-check.mjs --root .` = **悬空 65 · 行宽 36（净 0 / 0——本微轮开跑前基线即 65 / 36）**；§4.3 ∕ §4.4 前记 64 ∕ 35 与本刻之差 = 在途他批写面所增（非本微轮）。行文过程两条 >300 行（PROJECT.md §6.1 机检面行 · RENDERER.md §1.1 用户块条）已就地折行清零。

**变更记录 +1 笔 ×4 档**：PROJECT.md ∕ UI.md ∕ RENDERER.md ∕ E2E-TESTING.md。越域披露：E2E-TESTING.md = 父侧补令加入的可动档。**零新语义**（全部句子 = §1.19 裁定 + 在盘实读）；产品码 ∕ 核 ∕ CLI ∕ VSC ∕ 其余档零触碰。

**表外观察（只报未改）**：① `docs/vsc/design/VSC-DEBT.md` 行号 +4 漂移（他批在飞写面——本刻宽度行 `:656` ∕ `:717` ⇒ `:660` ∕ `:721`）；② `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:696` 曾现 372 字符行（他批在飞 · 瞬态——复跑已消）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审 · 回合中插入批（步边界 pickup）——对象 = 批档 `docs/batches/2026-09-28-desktop-midturn-input.md` §2 + 设计档五档落点 + 需求 D25（KD-40）；发现 12 条（🔴 3 / 🟡 6 / 🔵 3）。
**口径声明（限制）**：评审上下文未给文档地图与工程标准档 ⇒ 归属判据按各档自报板块 ∕ 单源指针 + AGENTS.md 判（降级）；实现码在射程外（声明明列「设计轮未触」）⇒ 行数标注未逐档按盘复核，仅就档内自证（含其内部不一致处）判定。

| # | 类 | 严重度 | 发现 | 改法 |
|---|----|--------|------|------|
| 1 | Document ownership | 🔴 | `thincoder/docs/desktop/design/PROJECT.md` 内「同机制两处不同描述」——已退役的「渲染面本地队（三纯动作 + `QUEUE_MAX`）+ 回合尾 flush」仍作规范句在场：KD-31 `:69`（「队列 = `pending`…（三纯动作带键 · 满队按键判）· flush 目标 = 回合尾事件键」）与 KD-40 `:79`（宿主单源 + 镜面 + flush 退役）相反；§7 验收行 `:583`（T-DSK22「回合尾发队首一条…先发后出队…`busy` 三 reason」）· `:584`（T-DSK23「flush 失败 ⇒ 该条留队」）；§6.1 `:506`（D3「回合尾 flush」）· `:507`（D4「写者 = `store.mjs` 纯动作…`QUEUE_MAX`」）；§4.1 行述 `:172` / `:190`；`thincoder/docs/desktop/design/RENDERER.md:19`（索引行仍列「队列纯动作 enqueue/dequeue/drainQueue」） | 逐处收正（退役句删 ∕ 改指 KD-40）；T-DSK22 ∕ T-DSK23 判据按新两时刻 + 回执形（`queued` ∕ `queue-full`）重写；§6.1 D3 ∕ D4 行改指本批注 |
| 2 | Document ownership | 🔴 | `thincoder/docs/desktop/design/UI.md`「本批注（对齐第二批 · 六件）」项 2 存**残留重复段** `:307–318`，与同注新句 `:294–307` 及项 3 `:459` 四处相反：队列权威（`:308`「桌面队列权威住渲染面 store」· `:309`「三纯动作带键」 vs `:297`「权威 = 宿主内存表」）· flush 目标（`:310`–`:311` vs `:295`）· 真机时序（`:317`「回合尾」 vs `:305`「步边界注入」）· 附件（`:318`「附件不入队（条目载不了图 —— 既有律）」 vs `:459`「条目可携 `images`」）；变更记录 `:584` 声称「原『三纯动作 + 回合尾 flush』段随本地队列退场」与盘面不符 | 删残留段（历史归变更记录 ∕ 批档）；四处语义逐句对齐 KD-40 与项 3 |
| 3 | Affected-file size | 🔴 | `thincoder-desktop/renderer/events.mjs` 标注 **494 ⇒ ≈510**（`PROJECT.md:251`；批档 §2.4）**越 500 硬限**而本设计未携带拆分（仅「越层在册承前」）；承前预案注册指针悬空——`PROJECT.md:349`「新预案〔页读径拆出——见 §4.1 越层段〕」，§4.1 越层段 `:221–233` 无 events.mjs 条目；同档 `:397`（对齐第二批）∕ `:425`（空闲唤醒）记该档拆后 ≈380（本批基线本应为拆后档） | 二择一落明：① 按盘实读重锚基线并写明与 align-2 `page-read.mjs` 拆档的先后；或 ② 本批携带拆分（`ev:queue` 归约落 `renderer/queue.mjs` ∕ 续拆页读面）；并补 §4.1 越层段条目 |
| 4 | Affected-file annotations | 🟡 | 本批落点面点名的档未入标注：`renderer/views/statusline.mjs`（`UI.md:300`「段 14 读镜面」；现值 = `PROJECT.md:196`）· `renderer/store.mjs`（`UI.md:297` `pending` 切片；现值 = `PROJECT.md:172`）——批档 §2.4（`:70–80`）与 `PROJECT.md:249–253` 无「现行 ⇒ 预期」行；机检面亦含 `store.test.mjs`「队列切片锁随动」（`PROJECT.md:533`）；新集成档登记面 `test/files.mjs` 同缺（`E2E-TESTING.md:145`） | 补三处「现行 ⇒ 预期」行（无改者明写「零改」） |
| 5 | Clarity | 🟡 | 窗面路由 ∕ 忙态队**优先序未定**：`PROJECT.md:102`「窗面路由零改（窗内提交 ⇒ `pushInput` + `wake`）」+ KD-40 ③「在飞 ⇒ 入队」（`:79`）+ `IPC.md:96` —— 窗在场 ∧ digest（自动轮）在飞时同一提交两读法落点不同（`pushInput` vs 忙态队），且消化轮不传 `consumeQueuedInput` ⇒ 消费时刻随之不同 | 补一句优先序（例：窗在场 ⇒ 窗面路由优先，忙态队只在无窗在飞期产生）+ 一例机检 |
| 6 | Clarity | 🟡 | 「批内含图 ⇒ 步边界让位」（KD-40 ⑤ `:79` · `UI.md:459`）**未定批界**：携图条目与相邻纯文本条目若同批 ⇒ 文本条目连带延至回合尾，与「下一步生效」承诺张力 | 定取批边界（例：遇携图条目即断批——沿「首动作 `slash` ⇒ 不消费」同族），或明示「整批让位」为有意行为 + 机检一例 |
| 7 | Doc-state（D 号） | 🟡 | 需求 **D25 已落**（`docs/desktop/requirements/PROJECT.md:162` / `:237`）而设计档 D 号面未随：`PROJECT.md:500`（§6.1 标题 D1–D24）· `:527`（表行止 D24，无 D25 行）· `:532`（仍写「拟 **D25**」）· `:6` · `IPC.md:4` · `RENDERER.md:4` · `UI.md:4`（四处仍 D1–D24）——违本档「D 号诸处同改」口径（`PROJECT.md:706` AN 行） | 补 D25 行 + 区间随落 + 去「拟」（需求档笔权在父侧） |
| 8 | Doc-state（跨档） | 🟡 | 核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md:43` 仍写「**双端**：CLI = …；VSC = …」；本批桌面进为第三端（宿主单源队列 + 步边界注入 + 回合尾续发；附件留队端差）——同档 `:17` 已有「三端全接」随落先例 | 该行补第三端 + 端差一句（报告项；落笔归核档 owner） |
| 9 | 批档状态面 | 🟡 | 批档 §1 状态行仍「进行中（设计待派（…））」（`:6`）而 §2 = 设计完成（`:39`）；§1 ∕ §2 模板占位行（`:7` / `:40`）残留 | §1 状态行随实况更新 + 占位行清（或注明保留口径） |
| 10 | 批档落点表 | 🔵 | §2.2（`:53–60`）未列 `E2E-TESTING.md`，而本批实落该档（`:144` / `:184` / `:196` / `:256–258`）且 AC-6 以其为真机面（`:91`） | 表补一行 |
| 11 | Clarity | 🔵 | 「`onTurnTail` 窄口退役」（KD-40 ④ `:79` · `RENDERER.md:47` · `UI.md:457`）与同档仍活的「回合尾标题刷新」消费面（`RENDERER.md:35` / `:47` · `PROJECT.md:167`）同句在场 ⇒ 易被读成整键摘除 | 写明只退 flush 携行、标题刷新消费面存续（一句） |
| 12 | 测试档标注 | 🔵 | 测试档无「现行 ⇒ 预期」（批档 §2.4 `:80`；`PROJECT.md:534` 引 2026-09-27 裁定）；`test/queued-input.test.mjs`（拟新增）无估数 | 按既有体例补估数或明引裁定 |

**计数**：🔴 3 · 🟡 6 · 🔵 3（共 12）。
**VERDICT: changes-required**

### 轮次 2（评审子代理）

回合 2（复核）· 设计评审——对象 = 批档 §4.1 修正清单逐条对读（轮次 1 发现 #1–#12 的落地声明）；范围 = 窄（轮次 1 引证面 + §4.1 清单）；实现码在射程外；文档地图 ∕ 工程标准档未给 ⇒ 归属判据按各档自报板块 ∕ 单源指针 + AGENTS.md 判（降级）。

**逐条对读（十二项）**：#1 **部分落**（KD-31 ∕ §7 T-DSK22-23 ∕ §4.1 store·mount-composer ∕ RENDERER.md:19 诸处落；**§6.1 D3 ∕ D4 行未落**）· #2 落（残留段 `:307–318` 删净 · 四处语义对齐 · 变更记录）· #3 落（PROJECT.md **456 ⇒ ≈466** + 越层段条目；批档 §2.4 未随锚）· #4 落（store ∕ statusline ∕ files 三面齐）· #5 落（§2.2:102 优先序句 + 机检例）· #6 落（KD-40 ⑤ 整批让位 · 不拆批；AC-5 在）· #7 **部分落**（D25 行 ∕ 表头 ∕ 注 ∕ 四档头；**UI.md:4 仍 D1–D24** · AN 行半落）· #8 落（核档 §6.8 三端 + 变更记录）· #9 落（§1 状态行；占位行口径 = §4.2）· #10 处置 = §4.2 补记（表未补行——在案）· #11 **部分落**（RENDERER 限定句落；UI.md:445 ∕ KD-40:79 仍「退役」）· #12 处置 = 明引裁定。

| # | 类 | 严重度 | 发现 | 改法 |
|---|----|--------|------|------|
| 1 | Document ownership | 🔴 | 修正清单声明「§6.1 **D3 ∕ D4 行**——退役句清（本地队列三纯动作 ∕ 回合尾 flush）逐处对齐 KD-40」未落地：`thincoder/docs/desktop/design/PROJECT.md:509`（D3 行仍书「忙态入队 · **回合尾 flush**」，且指向的 UI.md §1 输入区行已书「flush 随本批退场」）· `:510`（D4 行仍书「写者 = `thincoder-desktop/renderer/store.mjs` **纯动作** … + 满队提示（`QUEUE_MAX`）」）——与本档 KD-40 ③④（`:79`：消费两时刻 = 步边界注入 ∕ 回合尾**续发**、渲染面 flush 退役、写者 = `ev:queue` 归约）相反（同机制两处不同描述）；变更记录（`:955`）同句声称已逐处清——盘面不符 | §6.1 D3 ∕ D4 两行退役句逐处收正：D3 改指 KD-40 两消费时刻（或 D25 判据）；D4 改指宿主单源 + `ev:queue` 镜面，或加「随『回合中插入』批收正」限定句——口径同 :955 变更记录句 |
| 2 | Doc-state（D 号） | 🟡 | 修正清单「档头五处同拍」半落：`docs/desktop/design/UI.md:4` 仍 `D1–D24`（另四处 `PROJECT.md:6` ∕ `IPC.md:4` ∕ `RENDERER.md:4` ∕ `SHELL.md:4` 已 `D1–D25`）；AN 行（`PROJECT.md:711`）主句仍「**五处已全收正为 D1–D24**」（D25 随收为括注）——与实况（D25 已落 · 需求档 `:162`）不符 | UI.md:4 收 `D1–D25`；AN 行主句收「五处已全收正为 D1–D25」（历史归记录面） |
| 3 | Clarity（跨档两读法） | 🟡 | #11 的限定句只落 RENDERER.md（`:35` ∕ `:47`「`onTurnTail` 窄口**存续**——标题刷新消费面不动」）；`UI.md:445` 仍书「渲染面回合尾 flush 与 `onTurnTail` 窄口**随本批退场**」，KD-40（`PROJECT.md:79` ④）与 §4.1（`:253`「（窄口退役）」）同侧——同一符号「退 ∕ 存」两读法跨档并存（标题刷新消费面实存，见 `PROJECT.md:168`） | 三处随 RENDERER 单源对齐（写明只退 flush 携行、标题刷新消费面存续），或于三处加指向 RENDERER §1.1 的单源限定句 |
| 4 | 落点声明（靶面） | 🔵 | 修正清单末项「**§10 批 A 注**」按盘不可定位——§10 无同名项；盘面唯一「批 A 注」 = `PROJECT.md:632`（§7 · 已收正「宿主受理 ∕ 步边界注入 ∕ 续发」） | 点明靶面，或按盘收正清单措辞（同名面唯 §7 批 A 注）——零语义 |
| 5 | 数值漂移 | 🔵 | #3 的数重锚只落 PROJECT.md §4.1 本批行 ∕ 越层段（`:227` ∕ `:253` = **456 ⇒ ≈466**）；同档并存它值：`:167` 值列链末 **494** · `:400`（对齐第二批）拆后 **≈380** · `:451`（对齐第三批）**350** · `:483`（timer-wake）**393**；批档 §2.4（`:78`）仍 **494 ⇒ ≈510**（未随锚——按账会误读为越 500 硬限） | §4.1 值列行与兄弟批表基线随重锚同拍（或逐行注明 as-of 批次）；批档 §2.4 预估表加「随锚」注——或明示不改 |
| 6 | 验收判据 | 🔵 | #1 建议面之一未随：T-DSK23（`PROJECT.md:588`）未点名回执码 `queue-full`（T-DSK22 `:587` 已携 `queued`；`queue-full` 单源在 KD-40 ② ∕ `IPC.md:96` ∕ `UI.md:20`） | T-DSK23 补点名 `queue-full`（一行，零新语义）或注明码单源 |

**外范围观察（依对象声明排除——轮次 1 引证面与 §4.1 清单之外 · **无严重度** · 只读参照）**：
- 同族退役句残体（未在轮次 1 引证面 / align-2 ∕ align-3 批面 ∕ 树行）：`UI.md:85`（可见面修复批注项 2「写者两径 = 直发 ∕ 回合尾 flush」）· `UI.md:379`（对齐第三批项 13「直发 ∕ 回合尾 flush 两径同判」）· `UI.md:459`（§2 项 1「写者 = `store.mjs` 纯动作」+「出队 = 回合尾三径经 `msg:send` 发出（先发后出队）」）· `SHELL.md:46`（mount-composer 树行「回合尾三径 flush 队首（先发后出队）」）。
- 计数随动：`IPC.md:166` ∕ `:179` 两注仍「§1 **十七通道**计数」vs §1 载荷键集 ∕ 会话键面 ∕ 订阅面现值 **十八通道**（本批 `ev:queue` 面）。

**计数**：🔴 1 · 🟡 2 · 🔵 3（共 6）。

**VERDICT: changes-required**

### 轮次 3（评审子代理）

**复核轮 3（窄范围：轮次 2 发现 #1–#6 修正落地 · 批档 §4.3 清单逐条对读）**——对象 = 批档 §4.3（`:169`–`:174`）+ 设计档五档；范围声明 = 仅验轮 2 表，不新开问题面；实现码在射程外；文档地图 ∕ 工程标准档未给 ⇒ 归属判据按各档自报板块 ∕ 单源指针 + AGENTS.md 判（降级）；只读。

**逐条对读（六项）**：

| # | 轮 2 发现（severity） | 落地 | 盘面证据（本刻实读） |
|---|----|----|----|
| 1 | §6.1 D3 ∕ D4 行退役句未落（🔴） | **落** | `PROJECT.md:509`（D3：「回合中插入」批收正——受理交宿主任判 · 两消费时刻 = 步边界注入 ∕ 回合尾续发 · 本地判忙与回合尾 flush 退场——单源 = KD-40）· `:510`（D4：队列单源 = 宿主 · `pending` = `ev:queue` 镜面 · 原 store 三纯动作 ∕ `QUEUE_MAX` 随本地队列退场——单源 = KD-40 · 满队 `queue-full`）——与 `:79` KD-40 ③④ 同向；变更记录 `:958` 载「轮 1 清单声称而实未落——认账」 |
| 2 | UI.md:4 ∕ AN 行 D 号（🟡） | **落** | `UI.md:4` = `D1–D25`（五档头全验：`PROJECT.md:6` · `IPC.md:4` · `RENDERER.md:4` · `SHELL.md:4` · `UI.md:4`）；`PROJECT.md:711` AN 行主句 = 「五处已全收正为 D1–D25」（残余括注 = 发现 #1） |
| 3 | 窄口「退 ∕ 存」跨档两读法（🟡） | **落** | 三处同向 = 「只退 flush 携行 · `onTurnTail` 窄口存续——标题刷新消费面不动」：`UI.md:445` ∥ `PROJECT.md:79`（KD-40 ④）∥ `PROJECT.md:253`；单源 `RENDERER.md:35` ∕ `:47` 同句；同族残体逐句验（`UI.md:85` ∕ `:379` ∕ `:459` 收正） |
| 4 | 清单靶面名「§10 批 A 注」（🔵） | **落**（认账路） | 批档 §4.3（`:170`）认账「实为 §7 批 A 注——已收正」；`PROJECT.md:958` 载靶面名收正；靶面实存 = `PROJECT.md:632`（§7 批 A 注）；§4.1 原始清单行仍载旧名（记录面，认账已点明——零语义） |
| 5 | 数值漂移（🔵） | **落**（处置 = 明示不回改） | 批档 §4.3（`:172`）：兄弟批表 ∥ 批档 §2.4 = as-of 各批基线；现值以 §4.1 本批行为准（`PROJECT.md:251`–`:253` 就地给数）；实施轮按盘重锚（本刻实读 461 ∕ 308 ∕ 292 ∕ 74）——轮 2 改法二择一（随锚 ∕ 明示不改）取后者 |
| 6 | T-DSK23 未点名 `queue-full`（🔵） | **落** | `PROJECT.md:588`（T-DSK23 = 「回执 `queue-full`；队长不增、输入文本保留」+ 消费 ∕ 续发失败留队） |
| — | 轮 2 外范围同族扫（§4.3 一并扫） | **落** | `SHELL.md:46` ∕ `:54` 树两行收正（变更记录 `:171`）· `IPC.md:166` ∕ `:179`「十七通道 ⇒ 十八通道」（变更记录 `:331`） |

**发现（1 条 · 属轮 2 #2 修正面之残余）**：

| # | 类 | 严重度 | 发现 | 改法 |
|---|----|----|----|----|
| 1 | Doc hygiene（残余） | 🔵 | `PROJECT.md:711` AN 行括注「（D24 ⇒ D25 随「回合中插入」批——2026-09-28）」为修订式溯源表述（主句已收 D1–D25）；轮 2 改法括注「（历史归记录面）」未落 | 括注删（史归变更记录 ∕ 批档）——零语义；若判属登记行 as-of 体例 ⇒ 明示不动 |

**外范围观察（依对象声明排除——轮 1 ∕ 轮 2 已核验面之外 · 无严重度 · 只读参照）**：
- `SHELL.md:43`（`events-subscribe.mjs` 树行「回合尾标题刷新 + 输入区 flush 窄口」）——同族退役句残体（`onTurnTail` 的「输入区 flush」用途随本批退场），未入轮 2 引证面 ∕ §4.3 同族扫清单。
- `QUEUE_MAX` 符号对位：`PROJECT.md:588`（T-DSK23 夹具「投满条数 > `QUEUE_MAX`」）vs `PROJECT.md:510`（原 `QUEUE_MAX` 随本地队列退场）+ `PROJECT.md:79` KD-40 ①（容量 8 按键判——新宿主模块常数名未点名）——夹具面符号引用与新单源命名面未对位（`UI.md:507` 系变更记录行——史面，不计）。
- 未复核面（unverified）：§4.3 机检读数（悬空 64 ∕ 行宽 35）本评审无执行面，未重跑；「核件侧无改」无 diff 面，未验。

**计数**：🔴 0 · 🟡 0 · 🔵 1（共 1）。
**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 评审与修正落定
- 设计评审轮 1 = **changes-required**（🔴 3 · 🟡 6 · 🔵 3——§3 轮次 1 全文在案；宿主引证机械校验 0/5 命中 ⇒ 父侧逐条**按盘验靶**后裁决，两处评审分句核实收窄）。
- 修正落定（**父侧直接执行 · 可 revert**——十二项处置）：`docs/desktop/design/PROJECT.md`（KD-31 · §2.2 优先序句 · §4.1 store ∕ mount-composer 行 · §4.1 本批行按盘重锚（`events.mjs` **456 ⇒ ≈466**）+ 补 store ∕ statusline ∕ files 面 · 越层段补 `events.mjs` 条目 · §6.1 **D25 行** + 表头 + `:532` 注 · D3 ∕ D4 行 · §7 T-DSK22 ∕ T-DSK23 · §10 批 A 注 · AN 行 · 变更记录）；`docs/desktop/design/UI.md`（「对齐第二批」项 2 旧版重复段 `:307–318` 删除 + 变更记录）；`docs/desktop/design/RENDERER.md`（§1 索引行 + §1.1 三处 + 窄口限定句 + 变更记录）；`docs/desktop/design/IPC.md` ∕ `docs/desktop/design/SHELL.md`（档头 D1–D25）；`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（§6.8 双端 ⇒ **三端** + 变更记录）。
- 裁读两则：① 发现 #3——按盘实读 `events.mjs` = **456**（align-2 拆档已落）⇒ 原「494 ⇒ ≈510 越 500 硬限」不成立，处置 = **数重锚（🟡 级）**；② 发现 #2 的「变更记录声称与盘面不符」分句 = 成立（旧段确未删）——随删除消解。
- 机检复核（`node scripts/doc-check.mjs --root .`）= 悬空 64 · 行宽 35（净 **0 / 0**）。

### 4.2 处置补记与代签位
- 发现 #10 补记：§2.2 落点表未列 `E2E-TESTING.md`（本批实落该档 `:144` / `:184` / `:196` / `:256`–`258`）——本注为准。
- 发现 #12：测试档估数沿 2026-09-27 裁定（随修随加）；发现 #9 的 §1 ∕ §2 模板占位行 = 骨架合法行（工具面明文承认）——保留不删。
- **§4 代签位 = 复核轮 2 通过后落**（修正落定 → 复核 → 批准；顺序在案）。实施口径 = 设计凭证在册（本会话持有）；**实施排期 = align-3 三舱 + timer-wake 阶段 2 之后**（同片文件串行）。

### 4.3 复核轮 2 处置与修正（轮 2 · 2026-09-28）
- **复核轮 2 = changes-required**（🔴 1 · 🟡 2 · 🔵 3——§3 轮次 2 全文在案）。**认账两项**：① 4.1 清单「§6.1 D3 ∕ D4 行」声称已落而实未落（本轮补落）；② 清单末项靶面名误（「§10 批 A 注」⇒ 实为 §7 批 A 注——已收正）。
- 修正落定（**父侧直接执行 · 可 revert**——六条 + 外范围同族扫）：`PROJECT.md`（§6.1 **D3 ∕ D4 行**退役句补落 · KD-40 ④ 与 §4.1 窄口句随齐 · AN 行主句 ⇒ D1–D25 · T-DSK23 补 `queue-full` · 变更记录靶面名收正 + 轮 2 条目）；`UI.md`（档头 **D1–D25** · `:445` 窄口语义对齐 · 同族残体 `:85` ∕ `:379` ∕ `:459` 收正 + 变更记录）；`SHELL.md`（树 `mount-composer.mjs` ∕ `store.mjs` 两行收正 + 变更记录）；`IPC.md`（两注计数 **十七 ⇒ 十八通道** + 变更记录）；核件侧无改。
- 数值漂移（🔵 #5 · 处置 = 明示不回改）：兄弟批表 ∥ 批档 §2.4 = as-of 各批基线（§2 = 设计者笔）；**现值以 §4.1 本批行为准**；实施轮按盘重锚（本刻实读：`events.mjs` **461** ∥ `store.mjs` **308** ∥ `views/statusline.mjs` **292** ∥ `events-subscribe.mjs` **74**——他舱在途，随落随漂）。
- 机检复核（`node scripts/doc-check.mjs --root .`）= 悬空 64 · 行宽 35（净 **0 / 0**）。
- **§4 代签位 = 复核轮 3（窄范围：仅验本轮修正）通过后落。**

### 4.4 代签（2026-09-28 · 复核轮 3 通过）
- **复核轮 3 = pass**（🔴 0 · 🟡 0 · 🔵 1——§3 轮次 3 在案；轮 2 六项全落，§4.3 同族扫亦验落）。**评审通过 · 设计定稿**。
- 🔵 #1 处置 = **明示不动**（`docs/desktop/design/PROJECT.md:711` AN 行括注「（D24 ⇒ D25 随「回合中插入」批——2026-09-28）」）：该行 = D 号传播登记账——括注即账目本体（哪一批把范围推到 D25），与同格链式体例（「随 D22 ∕ D23 收 ⇒ D1–D23；…随 D24 再收」）一致；非失效表述、不属删面 ⇒ 零改（裁决依据在案）。
- 外范围观察两条 = 登记在案（不阻断）：① `docs/desktop/design/SHELL.md:43` 同族残体（`events-subscribe.mjs` 行「输入区 flush 窄口」）⇒ 随回填轮收正；② `QUEUE_MAX` 符号对位（`docs/desktop/design/PROJECT.md:588` 夹具面引用 vs 新宿主模块常数名）⇒ 实施轮点·随派发任务书明记。
- **用户批准（代签）**——授权 = 2026-09-28 12:23 ∕ 12:29「后续自动跑完吧」（全链自动：点火 ∕ 代签 ∕ 派发 ∕ 收口 ∕ 提交）。
- 实施轮 = 待排（与 timer-wake 阶段 2 同列——align-3 三舱落定后按序派发；任务书 = 本档 §2 + §2.5 AC；设计单源 = `docs/desktop/design/PROJECT.md` §2 KD-40 链）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（点修两轮收口（U-4 ∕ U-3 · U-6 ∕ U-7）：全量 263 ∕ 263 绿 · smoke = window:true ∧ ok:true ∧ errors:[] · 审计 2 轮 + 评审 1 轮（pass）· fix round 1 · 终态 clean · 2026-09-28）



### 实施摘要（eng-coder · 2026-09-28）

任务书 = 本档 §2（KD-40 ①–⑤ · UI 本批注五项 · `IPC.md` `ev:queue` ∕ `msg:send` ∕ `history:page` 三行）；设计单源 = `docs/desktop/design/PROJECT.md` §2 KD-40 链 + §2.5 AC-1–AC-7。
全链落定：队列单源 = 宿主（`src/main/queued-input.mjs`）⇒ 受理分岔（忙态按键判入队 ∕ 第 9 条 `queue-full` 零入队）⇒ 两消费时刻（步边界合并注入 `pushReal` ∕ 回合尾续发兜底）⇒ 出站 `ev:queue`（两形）⇒ 渲染面快照镜面（归约两形 + `history:page` 首屏重建）⇒ 可见面（流尾待发送气泡组 ∕ 段 14 读数 ∕ 降级提示行切片）。

**逐档落点与实读行数**（实施轮实读；基线 = `git show HEAD`）：

| 档 | 基线 | 实读 | 要点 |
|---|---|---|---|
| `src/main/queued-input.mjs` | 新档 | 117 | 队列表（键 → `{text,ts,images?}`）· 容量 8 按键判 · 计划取批（合并 ≤8 条 ∧ ≤2000 字符 · slash 单条）· 快照投影 `{text,ts}`（图零回传） |
| `src/main/turn-chain.mjs` | 新档 | 71 | `postQueue` 出站（两形）· `stepBoundaryPickup`（空队 ∥ slash ∥ 携图批 ⇒ 零消费）· `continueTurn`（起跑前查在飞表 · 整批不拆 · `prepare` 抛 ⇒ 留队 + 一行 `console.error`） |
| `src/main/agent-host.mjs` | 298 | 341 | 受理分岔（忙态入队）· 续发链接线 · `dispose` ∕ 切项目清队 · `queueSnapshot` 供面（**越 300 —— 见「上抛」**） |
| `src/main/turn-face.mjs` | 62 | 70 | `consumeQueuedInput` 传参：用户回合传 ∕ `autoTurn`（消化轮）不传 |
| `src/main/ipc.mjs` | 256 | 260 | `history:page` 回执 `queue` 键（恒在场 · 空队 `[]`；宿主未装配径同出空键）；切项目径清队接线 |
| `src/preload/preload.cjs` | 58 | 59 | `EVENT_CHANNELS` 十七 ⇒ **十八**（`ev:queue` 末位） |
| `renderer/queue.mjs` | 45 | 41 | `applyQueue`（快照整置 · 幂等 · 形不合零写）+ `QUEUE_MAX`（值 8 —— 与 `QUEUED_MAX_ITEMS` 对拍锁）；原三纯动作随本地队列退场 |
| `renderer/events.mjs` | 460 | 497 | `ev:queue` 归约两形 + 分派（**距 500 硬限 3 行** —— 见「上抛」） |
| `renderer/store.mjs` | 307 | 328 | `attachDegraded` 切片 + `setAttachDegraded`（降级提示行单一载波） |
| `renderer/composer-send.mjs` | 新档 | 70 | 发送面三件拆出（`ask` ∕ `withUserBlock` ∕ `submitDraft`：判据 `sent ∕ queued ∕ full ∥ kept ∕ empty ∕ no-session`） |
| `renderer/mount-composer.mjs` | 407 | 322 | flush 携行退役 · 忙态交宿主任判 · 降级码读切片 |
| `renderer/events-subscribe.mjs` | 74 | 77 | +`ev:queue` 订阅；`onTurnTail` 窄口**存续**（只退 flush 携行） |
| `renderer/page-read.mjs` | 116 | 132 | **表外（披露）**：首屏读 `queue` 键重建镜面（回填读不重建 —— 防在途快照覆盖活镜面） |
| `renderer/app.mjs` | 297 | 299 | 去 flush 接线 · `submitDraft` 改引 `composer-send` |
| `renderer/views/statusline.mjs` | 291 | 292 | 仅注释（段 14 读 `pending` 原已在位） |
| `test/agent-host.test.mjs` | 472 | 431 | 拆分产出（触 500 硬限 ⇒ 在册预案「门面用例拆出 + 装配假面 harness 共享」本批执行：U217–U219 出档 + 假面出档 `agent-host-harness.mjs`）；余量仍 >300 在册 |
| 测试面新增 5 档 | 新档 | 87 ∕ 151 ∕ 84 ∕ 135 ∕ — | `test/queued-input.test.mjs`（U214–U215）· `test/agent-host-queued.test.mjs`（U217–U219）· `test/agent-host-harness.mjs`（共享假面 · 零用例）· `test/integration/midturn-input.test.mjs`（T-DSK45） |
| 测试面改动 6 档 | — | — | `test/events-reduce.test.mjs`（+U220）· `test/store.test.mjs`（U117 重写 + U75 键锁）· `test/views-chrome.test.mjs` · `test/views-attach.test.mjs` · `test/views-locks.test.mjs` · `test/host-floor.test.mjs` · `test/files.mjs`（三新档打包入既有行 · 净 0 行） |

**验证读数**：
- `node test/run.mjs`（`thincoder-desktop/`）= **257 ∕ 257 pass · 0 fail**（含本批新档与既有八集成档）。
- `npx electron . --smoke` = `{"smoke":1,"lock":"primary","window":true,"node":"24.21.0","sqlite":true,"floorMet":true,"boot":"ok","errors":[],"ok":true}`。
- 本批新档单跑：`test/queued-input.test.mjs`（计划面与 CLI ∕ VSC 值对拍 ∕ 队列表语义）· `test/agent-host-queued.test.mjs`（忙态入队 ∕ 步边界取批 ∕ 续发链）· `test/integration/midturn-input.test.mjs`（`ev:queue` 两形注入 ⇒ 气泡组 ∕ 段 14 ∕ 交接三态）——全绿。
- 用例号：**自铸 U214–U220**（实落 U214 ∕ U215 ∕ U217 ∕ U218 ∕ U219 ∕ U220；U216 空位不回收）——设计用例号归属表无本舱段，沿 A-3b `U120/U121` 先例；T-DSK45 = 设计在册号。

**AC 对照（§2.5 · 机检面）**：AC-1 U217（回执两形 + 第 9 条 `queue-full` 零入队 + 快照恰形 + `dataURL` 负向锁）· AC-2 U218①（缝在场 + `pushReal` 普通 user 消息 + 合并一次消费）+ `test/agent-host.test.mjs`（用户回合缝在场）· AC-3 U219①–③（递归至队空 ∕ 队列先于接管 ∕ `dispose` ∕ 切项目清队零续发）· AC-4 U220（归约两形 + 尾块 user + 首屏重建）+ U117（镜面应用）+ `test/integration/midturn-input.test.mjs`（真链两态）· AC-5 U218③（携图整批让位）+ U219④（送达面 `degraded` 随回执）· AC-6 = T-DSK45 离线可产面落档（真机面待父侧真跑闭合）· AC-7 = 核件 ∕ CLI ∕ VSC 零改（本批触碰面全在桌面舱）。

### 决策透明表（实施轮）

| # | 决策 | 依据 ∕ 口径 | 落点 |
|---|---|---|---|
| D-1 | 队列单源 = 宿主内存表；渲染面零本地队（`pending` = 宿主快照镜面） | KD-40 ①（§2.6） | `src/main/queued-input.mjs` · `renderer/queue.mjs` |
| D-2 | `slash` 首动作：步边界零消费 ∕ 回合尾**逐条直发**（单条 · 保序 · 不合并） | **父侧 2026-09-28 裁定**（设计档未载 —— 见 U-1） | `turn-chain.mjs` · `queued-input.mjs`（U218② 只锁步边界） |
| D-3 | 携图条目 ⇒ **整批**让位（批界 = 合并跨度 · 不拆批） | 设计评审轮 1 #6 落定（「整批让位为有意行为 + 机检一例」） | `turn-chain.mjs`（U218③） |
| D-4 | 入队 ∕ 满队受理 ⇒ 清输入 + 清附件条（队条目携图 ⇒ 图形随条目走） | KD-40 ⑤ · UI 本批注清条判据 | `renderer/mount-composer.mjs`（U141⑦） |
| D-5 | `degraded` 载波 = `attachDegraded` 切片单点（写者两处 = 直发回执 ∕ 消费回执） | UI 本批注（提示行载波） | `store.mjs` · `events.mjs` · `mount-composer.mjs`（U220） |
| D-6 | 空文本门：渲染面拒空白串；**宿主受理不判空**（窄桥面责任归调用侧 —— 披露） | 沿既有渲染面门（advisor 🔵 #10 在案） | `agent-host.mjs` · `composer-send.mjs` |
| D-7 | `QUEUE_MAX`（渲染面）= 8 与宿主 `QUEUED_MAX_ITEMS` = 8 两名两处（跨进程不可 import；两处各有值锁） | §4.4 外范围② 处置 = 符号随 `queue.mjs` 保留 ⇒ `PROJECT.md:588`（T-DSK23 夹具引用）可解；满队判据已归宿主按键判（advisor 🔵 #9 在案） | `renderer/queue.mjs` |

### 审计与代码评审轮次与终态

- **内部分歧审计（explore · 只读 · 轮 1）**：判 **DEVIATIONS 1 条（低）**——`history:page` 回执 `queue` 键在「宿主未装配径」缺席，与 `IPC.md` 定形句「键恒在场（空队 ⇒ `[]`）」字面不符；其余四类（AC 覆盖 ∕ 静默简化 ∕ 表外改动 ∕ 设计漂移 ∕ 残留）**零发现**。**已修**（`ipc.mjs`：`queue: agentHost ? agentHost.queueSnapshot(key) : []` + 档注随齐）；复跑相关三档 16 ∕ 16 绿。
- **内部代码评审（advisor · 轮 1 = 全量）**：**VERDICT: pass**（🔴 0 · 🟡 7 · 🔵 5 · 共 12）。口径声明（限制）= 未给工程标准档 ⇒ 判据按 AGENTS.md + 各档自报单源判（降级）；评审为只读面 ⇒ 评审后未再改动被评面（冻结守）。
- **终态 = clean**（审计 1 轮 · 自修 2 轮 · 评审 1 轮 pass · 零 🔴）；advisor 12 条均 🟡 ∕ 🔵 咨询项，逐条处置在案（下）。**fix round 计数 = 2**：① 自测轮（U86② ∕ U217–U219 断言修正 · 六测试档随动 · `queued-input.mjs` 档头去 `electron` 字面〔源面零宿主依赖正则误命中〕）；② 审计轮（`ipc.mjs` 键恒在场）。
- **advisor 12 条处置**：🟡 #1 `events.mjs` 497（距 500 硬限 3 行）· #2 `agent-host.mjs` 341 · #3 `store.mjs` 328 · #4 `mount-composer.mjs` 322 ⇒ **接受现状 + 上抛 U-2**（四档注册预案均已执行、均未越硬限）；🟡 #5 缺「消化轮 ⇒ 缝缺席」负向锁 ⇒ **接受**（实现按 `turn-face.mjs` 分流在盘，只缺用例 —— U-3）；🟡 #6 机检面落点跨档滞后（`PROJECT.md:537` ∕ `E2E-TESTING.md:184` 仍指 `agent-host.test.mjs`，实落拆分档）⇒ **接受**（归父侧文档面）；🟡 #7 本档 §5 ∕ §6 缺位 ⇒ **本段即 §5 落笔**（§6 ∕ §1 状态行归父侧）；🟡 #8 `dispose` 不清 `flights`（忙态队把可见拒换成静默迟到投递）⇒ **接受 + 上抛 U-4**；🔵 #9 ∕ #10 ∕ #11 ∕ #12 ⇒ 接受（D-7 ∕ D-6 在案 · §4.1 回填与「拟新增」去标归父侧文档面）。

### 上抛（请父侧裁）

- **U-1（设计档缺口 · slash）**：回合尾对 `slash` 首动作条按父侧 2026-09-28 裁定「逐条直发」实现，该句未落设计档 ⇒ 建议父侧补一句；机检面只锁步边界不消费，尾径 slash 零机检。
- **U-2（越层续期）**：`agent-host.mjs` 341 ∥ `events.mjs` 497 ∥ `store.mjs` 328 ∥ `mount-composer.mjs` 322 ⇒ 请裁「续期登记」或「下批再拆」（`host-floor.test.mjs` 已按四档登记例外面 + 档内注明）。
- **U-3（用例补齐）**：桌面「消化轮 ⇒ 缝缺席」负向例（advisor 🟡 #5）——建议下批随 `test/agent-host-queued.test.mjs` 补（值取 CLI ∕ VSC 同形）。
- **U-4（边界收口）**：`dispose` 与在飞回合交互（advisor 🟡 #8）——建议 ① `dispose` 中止并清 `flights`（与「会话中止 ⇒ 队清 + 零续发」同向）。
- **U-5（存量观察 · 非本批漂移）**：`RENDERER.md:88` 用户块定形句未含既有 `ts` 载波（`ts` 属「对齐第二批」项 4 产出 —— `git show HEAD:thincoder-desktop/renderer/mount-composer.mjs` 可证）· `SHELL.md:43`「输入区 flush 窄口」同族残体（设计轮 2 外范围观察已登记 · 归回填轮）。
- **行数勘误（本段更正上段表）**：测试面新增 **4 档**（非 5）= `test/queued-input.test.mjs` ∕ `test/agent-host-queued.test.mjs` ∕ `test/agent-host-harness.mjs` ∕ `test/integration/midturn-input.test.mjs`；测试面改动 **8 档**（非 6）= `test/agent-host.test.mjs` ∕ `events-reduce` ∕ `store` ∕ `views-chrome` ∕ `views-attach` ∕ `views-locks` ∕ `host-floor` ∕ `files.mjs` —— 合计测试面 **12 档**（产品面 15 档）。

### 点修轮 —— U-4 ∕ U-3 收口（eng-coder · 2026-09-28）

**交付摘要**：承上段上抛 U-4 ∕ U-3（父侧裁：修），两件落定 —— ① `dispose` ∕ 切项目径补「**在飞回合中止 + 在飞表清**」（`flights`），与既有「队清 + 空快照 + 零续发」同族收口；② 补「**消化轮（`autoTurn`）⇒ 步边界缝缺席**」负向锁 + 队零动 ∕ 接线面单点锁 + U-4 两臂用例。

**逐号落点**（file:line = 现盘实读）：

| 号 | 改动 | 落点（file:line） | 说明 |
|---|---|---|---|
| 1 | ① 在飞中止 + 清 `flights` | `src/main/agent-host.mjs:320-321`（`dispose`：`const flight = flights.get(key)` / `if (flight) { flight.abort(); flights.delete(key) }`）· `:335-336`（`abortSuspensions`：全键 `controller.abort()` + `flights.clear()`）· 档头 `:10-11` + 两处文档注释随齐 | `turn-chain.mjs` **零改**（清单两落点之二 —— 判定见 D-1） |
| 2 | ② 负向锁 | `test/agent-host-queued.test.mjs:169-206`（U221） | 真链（宿主 → 挂起窗 → `turn-face`）捕 `opts`：`autoTurn === true` ∧ `"consumeQueuedInput" in opts === false` + 核循环头同址调用零副作用断言 + `turn-face.mjs` 源面单接线点三锁 |
| 3 | ③ 用例随补（U-4 两臂） | `test/agent-host-queued.test.mjs:208-252`（U222） | ①「dispose 中」：signal 收 ∕ `interrupt` ⇒ idle ∕ 同键再发 ⇒ 起新回合（重装配）∕ 队零条目；②「dispose 后」：陈旧回合结算 ⇒ 零续发 ∕ 零迟到投递 ∕ 零复活窗（池空配置面）；③ 切项目臂同判 |
| — | 假面（测试面随宜） | `test/agent-host-harness.mjs:45-55` | 假 `createAgent` 镜像装配入参 provider + 两旗标回位（D-3） |

**逐档实读行数**：`src/main/agent-host.mjs` 341 ⇒ **349**（在册例外 ≤500）· `test/agent-host-queued.test.mjs` 151 ⇒ **252**（≤300）· `test/agent-host-harness.mjs` 87 ⇒ **95**（≤300）· `src/main/turn-face.mjs` **71 零改**。

### 决策透明表（点修轮）

| # | 决策 | 依据 ∕ 口径 | 落点 |
|---|---|---|---|
| D-1 | 只改 `agent-host.mjs`；`turn-chain.mjs` 零改 | 链侧已有两守卫（`busyOf` 起跑前查在飞 ∕ `plan === null` 空队 ⇒ 零续发），任务书口径「中止 + 清 `flights`」落在在飞表所有者侧；改链 = 越裁定机制 | `agent-host.mjs` |
| D-2 | 中止序 = 在飞中止 ∕ 清表 先于 `suspension.abort` ∕ 摘表 | 沿既有「先于摘表 —— 窗仍持 agent 引用」同族序；`abort` 幂等（窗内回合随会话信号已中止者同判） | `dispose` `:320-322` |
| D-3 | 假面 `createAgent` 镜像装配入参 provider + 两旗标回位（**表外改动 · 已披露**） | 实测踩中：前序用例数轮 `saveSession` 落槽 ⇒ 槽装载（`applySession`）污染共享假 agent 的 provider（缺 `baseURL`）⇒ 第二次装配 `validateProvider` 误判 incomplete ⇒ U222① 假 provider-invalid；核 `createAgent` 逐次**新建对象**（无跨装配残留）⇒ 镜像 + 回位 = 同形保真；回位在校验前（`agent-assemble.mjs:88` ⇒ `:93`）⇒ invalid 配置仍每装配重判 | `test/agent-host-harness.mjs` |
| D-4 | U221「队零动」三断言为**恒真面**（自陈在案，不改断言） | 内审 R2：队项在回合尾即取批送达 ⇒ 窗开启时宿主队必空；鉴别力主承「缝缺席」断言 + 源面单接线点锁 ⇒ 注释明写口径，不以恒真断言冒充证据 | `test/agent-host-queued.test.mjs:189-192` |

### 审计与代码评审轮次与终态

- **内部分歧审计（explore · 只读 · 轮 1）**：判 **DEVIATIONS 4 条（无 🔴）** —— R1 装配在飞窗残径（🟡 · AC 字面外 ∕ 同族残留）· R2 U221 尾部三断言恒真（🔵 · 自陈面）· R3 U222②「零复活窗」为池空配置面（🔵 · 自陈）· R4 档面滞后（🟡 · `docs/**` 本轮零改 ⇒ 父侧）。其余（AC 部分实现 ∕ 表外改动 ∕ 设计漂移 ∕ 残留四类）**零发现**；反证抽查 = U222 在预修行为下至少四处独立判红（鉴别力成立）。
- **内部代码评审（advisor · 轮 1 = 全量）**：**VERDICT: pass**（🔴 0 · 🟡 3 · 🔵 2）—— 🟡① 回合尾接管链未阻断（池活 ⇒ 复活窗 ∕ 池空 + 在途 timer ⇒ 空闲闩重武装 ⇒ 亡键 timer 轮 ∕ 与新队竞态 ⇒ 旧代理迟到投递；切项目臂另带 cwd 取值面）⇒ **报告面（父侧裁 · U-6）**；🟡② 中止径仍「三路同序落盘」⇒ 删会话被落盘复活（预修版同类落盘更晚，本收口使其即时化）⇒ **报告面（父侧裁 · U-7）**；🟡③ 349 行 > 300（在册例外续期面 · U-8）；🔵①=U221 恒真面（自陈 · D-4）· 🔵②=假面旗标回位（已修 · D-3）。
- **内部代码评审（advisor · 轮 2 = 窄复核：仅验修复声明）**：**VERDICT: pass** —— 三点核验：两行回位在盘 ∕ 装配序（`createAgent` ⇒ `validateProvider`）⇒ 回位在校验前（不洗白 invalid 用例）∕ 旗标全集闭合（全域唯 `agent-assemble.mjs:47-48` 置位 · `agent-host.mjs:238` 消费）且 95 行 ≤ 300。
- **终态 = clean**（审计 1 轮 · 评审 2 轮 pass · 零 🔴）；**fix round 计数 = 1**（① 审计 R2 ∕ R3 口径披露注释随落 + 评审 🔵② 假面旗标回位；零行为面改动）。

### 验证读数（点修轮）

- `cd thincoder-desktop && node test/run.mjs` = **259 ∕ 259 pass · 0 fail**（点修前 257 ⇒ +2 = U221 ∕ U222）。
- `npx electron . --smoke` = `{"smoke":1,"lock":"primary","window":true,"node":"24.21.0","sqlite":true,"floorMet":true,"boot":"ok","errors":[],"ok":true}` —— `window:true ∧ ok:true ∧ errors:[]`。
- 单档：`node --test test/agent-host-queued.test.mjs` = **5 ∕ 5 pass**。
- **负控（鉴别力实证 · 临时改后已还原，`CONTROL` 痕零残留）**：① 预修行（dispose 不中止 ∕ 不清）⇒ U222 首断言判红；② 中止但不清表 ⇒ 「在飞表已清」断言判红；③ 幽灵在飞保留 + 陈旧回合结算 ⇒ 迟到投递可复现（回执 `{ok:true,queued:true}` · `runs` 发送刻 1 → 结算后 2 · 消费回执 `{text:"新会话消息"}`）；④ `turn-face` 去 `autoTurn` 分流 ⇒ U221「缝缺席」断言判红。

### 上抛（请父侧裁 · 点修轮新增）

- **U-6（回合尾接管残径 · 新）**：两条中止径只中止 + 清表，**不阻断回合尾接管链**（`agent-host.mjs:188` `.then(… takeOver)` ⇒ `:199` `suspension.start(key, agent, { cwd: projects?.currentCwd() ?? null })`）⇒ 已亡键仍可达重注册：池活 ⇒ 复活窗（含消化轮）；池空 + 在途 timer ⇒ 空闲闩重武装 ⇒ 亡键起 timer 轮；与新会话忙态队竞态 ⇒ 旧代理消费新队（迟到投递同族）；切项目臂另带 cwd（新）vs agent（旧）取值面。建议：中止墓碑（两径按键落墓碑，回合尾链 ∕ `takeOver` 起跑前查位）或中止径不调 `takeOver`；机检补池活 ∕ 在途 timer 两臂。
- **U-7（中止径落盘 × 删会话 · 新）**：会话中止后回合尾仍 `saveAgentSlot`（`turn-face.mjs:58`）⇒ 核 `saveSession` 按 `agent._slot` 重建槽文件 + manifest 条目 ⇒ 已删会话复活（带中止时点历史）。建议：中止径跳过落盘（或落盘面查中止标记）+ 设计句；否则「消息随会话终止」在盘面被自身落盘面部分推翻。
- **U-8（行数续期 · 承 U-2）**：`agent-host.mjs` 341 ⇒ **349**——本点修即「该档下次被触碰的批」（`host-floor.test.mjs:346-348` 在册例外注的消解窗口已到）⇒ 裁「拆（受理路由 ∕ 清队 ∕ 中止三面出档）」或「续期登记」。
- **U-9（档面滞后 · 承内审 R4）**：`docs/desktop/design/PROJECT.md:79`（KD-40 ⑤）∕ `:104`（§2.2）未载「在飞中止 + 在飞表清」；§4.1 `:144` 行数读数 285 vs 盘面 349；`PROJECT.md:537` ∕ `docs/desktop/design/E2E-TESTING.md:184` 机检面未列 U221 ∕ U222（自铸号披露 = 本段）——均归父侧文档面（本轮 `docs/**` 零改）。
- 表外发现（只报未改）：`turn-chain.mjs` 零改判定理由 = D-1（供核）。

### 点修轮 2 —— U-6 ∕ U-7 收口（eng-coder · 2026-09-28）

**交付摘要**：承上段上抛 U-6 ∕ U-7（父侧裁：**修**，实现先行），两件落定 + 一条同族补齐：① **中止墓碑**（回合代次 —— `dispose` ∕ `abortSuspensions` 两径同落）⇒ 该刻前代次的回合尾在**三查位**同失效：`takeOver` 零重注册（零续发 ∕ 零窗 ∕ 零闩重武装 ∕ 零新队消费）· **步边界缝零取批**（旧代理不消费新会话队 —— 复审轮补口）· 回合尾落盘零写（U-7：已删会话不得被落盘复活）；② 回合起跑在代理上落当代次（`turn-face.mjs` 单点），查位 = 代次比对 ⇒ 会话重开后新回合自动合法（**零清除面** —— 无「清墓碑」竞态窗）；③ 机检四例（U223–U226，自铸号披露见下）。

**逐号落点**（file:line = 现盘实读）：

| 号 | 改动 | 落点（file:line） | 说明 |
|---|---|---|---|
| 1 | 中止墓碑 + 三查位 | `src/main/agent-host.mjs:118-130`（`turnEpochs` ∕ `epochOf` ∕ `revokeTurns` ∕ `turnGate`）· `:217`（`takeOver` 首行查位）· `:341`（`dispose` 无条件落）· `:357-358`（切项目在飞键逐一落）· `:139`（步边界缝查位） | `turn-chain.mjs` **零改**（判定 = 链侧取批唯一生产调用点在本档闭包 —— 判据单点，无第二查位面） |
| 2 | 中止径落盘零写（U-7） | `src/main/turn-face.mjs:33-36`（`revokedTurn` 判据）· `:42`（起跑落代次）· `:61` ∕ `:65`（成功 ∕ catch 两 save 点前查位） | 择一取「**落盘面查中止标记**」（非「中止径跳过」）：理由 = 落盘唯一站点在 turn-face 且 key 在手；`session-io.mjs` 只收 agent（无 key ⟹ 需第二注入面）⇒ 该档零改；「中断（`interrupt`）仍留现场」语义不动（interrupt 不落墓碑） |
| 3 | 机检四例 | `test/agent-host-queued.test.mjs:258`（U223）· `:282`（U226）· `test/agent-host.test.mjs:438`（U224）· `:461`（U225）；假面 `test/agent-host-harness.mjs:60-80`（`makeHost` 增可选 `assemble` + `freshAgent`） | 三例 = 任务书点名（①②③）+ 缝臂一例（U226 —— 复审轮发现补口）；用例号 **自铸 U223–U226**（设计号表无本舱段，沿 U214–U222 先例） |

**逐档实读行数**：`src/main/agent-host.mjs` 349 ⇒ **374**（在册例外 ≤500）· `src/main/turn-face.mjs` 71 ⇒ **77** · `test/agent-host.test.mjs` 431 ⇒ **489**（距 500 硬限 11 行 —— 见上抛）· `test/agent-host-queued.test.mjs` 252 ⇒ **298**（≤300 臂内）· `test/agent-host-harness.mjs` 95 ⇒ **101** · `turn-chain.mjs` ∕ `session-io.mjs` 零改。

**验证读数**（命令 + 结果）：

- `cd thincoder-desktop && node test/run.mjs` = **263 ∕ 263 pass · 0 fail**（本轮前 259 ⇒ +4 = U223–U226）。
- `npx electron . --smoke` = `{"smoke":1,"lock":"primary","window":true,"node":"24.21.0","sqlite":true,"floorMet":true,"boot":"ok","errors":[],"ok":true}` —— `window:true ∧ ok:true ∧ errors:[]`。
- 单档：`node --import ./test/rc-resolve.mjs --test test/agent-host-queued.test.mjs test/agent-host.test.mjs` = **23 ∕ 23 pass**。
- **负控（四桩 · 预修行为判红，临时改后已还原；源面零残留）**：① U223（去 `takeOver` 查位）⇒ 判红（「零复活窗」断言：实际现 `ev:susp {active:true}` 帧）；② U224（同）⇒ 判红（`runs` 实际 `['旧回合','']` = 亡键 timer 轮）；③ U225（去落盘查位）⇒ 判红（「dispose 臂：槽零写」：槽文件现）；④ U226（去缝查位）⇒ 判红（「陈旧代理零注入」：实际 = 读数 +1，旧代理消费新队）。

### 决策透明表（点修轮 2）

| # | 决策 | 依据 ∕ 口径 | 落点 |
|---|---|---|---|
| D-1 | 墓碑 = per-key **代次计数**（非键集 ∕ 非代理布尔标记） | 任务书「两径落墓碑 · `takeOver` 前查位」；代次制天然「零清除面」（新回合自动合法，无「清墓碑」竞态窗） | `agent-host.mjs:118-130` |
| D-2 | 落盘 gate 放 turn-face（择一取「落盘面查中止标记」） | 父侧「择一 · 报告理由」；判据需 key + 代次面，turn-face 两件皆在手（`session-io.mjs` 仅收 agent） | `turn-face.mjs:33-36 ∕ :61 ∕ :65` |
| D-3 | 步边界缝补闸（内审轮 1 🟡 驱动） | 核循环头缝前无中止闸（`thincoder-core/agent.mjs:247`）；该面 = 任务书 harm 清单第三臂「旧代理消费新队」—— 闭路由同判据短路（`queuedPickup` 闭包） | `agent-host.mjs:139` |
| D-4 | `turn-chain.mjs` ∕ `session-io.mjs` 零改 | 判据单点住宿主；链侧无需第二查位（`continueTurn` 只在 `takeOver` 之后可达） | — |
| D-5 | 假面 `makeHost` 增可选 `assemble` + 新导出 `freshAgent`（**表内** —— 假面在任务书落点清单） | U226 需「逐次新建代理」（陈旧 ∕ 新代两对象可辨 —— 假面共享对象面下不可测）；缺省路径不变（条件展开，缺省 = 真 `assembleFor`） | `agent-host-harness.mjs:60-80` |

### 审计与代码评审轮次与终态

- **内部分歧审计（explore · 只读 · 轮 1）**：判 **DEVIATIONS 2 条（无 🔴）** —— 🟡 缝径未闭（任务书 harm 第三臂只在接管链径闭合；核 `agent.mjs:244-247` 缝前无中止闸）+ 🔵 档面滞后（`docs/**` 本轮禁触 ⇒ 归父侧回填）；两条表外发现**确认属实**（⓵ `send` 装配 `await` 期跨中止仍起跑且结算落盘 · ⓶ 空闲闩已点火恰逢中止仍交付 + 起 timer 轮 —— **均只报未改**）。AC ∕ 静默简化 ∕ 表外改动 ∕ 残留四类零发现；实触 ⊆ 清单。
- **自修（fix round 1）**：按审计 🟡 补缝闸（`agent-host.mjs:139`）+ U226 机检例 + 假面 `assemble` ∕ `freshAgent`（负控判红取证）。
- **内部分歧审计（轮 2 · 窄复核）**：**四类偏差零发现（无 🔴）** —— 缝闸静态核证「revoked ⇒ 零 `queue.take` ∕ 零 `pushReal` ∕ 零 `postQueue`」✓ · 缺省面零回归 ✓ · U226 鉴别力成立 ✓ · `assemble` 注入兼容（既有调用面零改）✓ · 新残留零；附一条**条件性残余**（切项目臂 —— 转报父侧，见 U-12）。
- **内部代码评审（advisor · 轮 1 = 全量）**：**VERDICT: pass**（🔴 0 · 🟡 3 · 🔵 3 · 共 6）。逐条处置（**全部接受 ∕ 报父侧 —— 评审后零代码改动，冻结守**）：🟡① = 切项目臂代次洗白（= 内审条件性残余同面 —— 归 U-12 父侧裁）· 🟡② = `test/agent-host.test.mjs` 489 行（距 500 硬限 11 行 ⇒ 建议下轮迁出本轮两例；归 U-11）· 🟡③ = `agent-host.mjs` 374 行（在册例外 · 承 U-8 待裁；归 U-11）；🔵① = U224 固定 15ms 墙钟观察窗（**接受**：0 延迟闩在定时器相位内必达，15ms ≈ 十余倍余量；根治需宿主补时钟缝 —— 归裁）· 🔵② = queued 档头 `:13` 用例号清单未随（一句话级，随回填轮收口）· 🔵③ = 三查位不含**终局帧面**（口径澄清非缺陷 —— 建议设计句明写「终局帧不设门」）。
- **终态 = clean**（审计 2 轮 · 自修 1 轮 · 评审 1 轮 pass · 零 🔴）；**fix round 计数 = 1**（审计 🟡 缝径 → 补闸 + 新例）。
- **过程临时物清零**：调试脚本 ∕ 输出转存 ∕ `session-io.mjs` 临时插桩行**均已还原**（git 面该档零差异；盘上零临时档残留）—— 披露：插桩曾短暂落在清单内档、未出清单。

### 本轮不做（父侧口径在案）

不拆 `agent-host`（行数续期面归 U-8 ∕ U-11 裁）· 不碰清单外档（`renderer/**` ∕ `docs/**` ∕ 核件 ∕ CLI ∕ VSC 零触）· 不做全量探索（点修）· 不重构。

### 上抛（请父侧裁 · 点修轮 2 新增）

- **U-10（设计句 ∕ 文档面）**：U-6 ∕ U-7 机制句回填（KD-40 链 ∕ §2.2 + 「三查位」措辞）+ 本轮记录 —— `docs/**` 本轮零触碰（任务书禁），归回填轮 ∕ 父侧。
- **U-11（行数续期 · 承 U-8）**：`agent-host.mjs` 349 ⇒ **374**（在册例外 ≤500）· `test/agent-host.test.mjs` **431 ⇒ 489**（距 500 硬限 11 行 —— 复审建议下轮迁出 U224 ∕ U225）—— 请裁「拆 ∕ 续期」。
- **U-12（残余 · 复审 🟡① ∕ 内审条件性残余同面）**：**切项目臂代次洗白** —— `abortSuspensions` 不动装配表 + `ensure` 复用同一代理对象 + 起跑就地覆写代次 ⇒ 陈旧回合尾可被「洗白」（四环可达条件在案：切项目时在飞 ∧ 旧回合活过新回合起跑 ∧ 同键同槽号再发 ∧ 队非空）；`dispose` 臂不受影响（装配表清 ⇒ 核 `createAgent` 逐次新建）。收口方向二择一（回合域代次 ∕ 级联清装配），请裁。
- **U-13（用例号自铸披露）**：U223–U226（设计用例号归属表无本舱段 —— 沿 U214–U222 先例）。
- **表外发现（只报未改 · 内审两轮确认属实）**：⓵ `send` 装配 `await` 期被 `dispose` ∕ 切项目（占位在飞被清）⇒ 该 send 仍起跑一回合（跨中止的回合 —— 非陈旧尾、墓碑拦不住；结算径亦落盘）—— 收口需 send 侧闸 + 新 reason 码（设计面）；⓶ 空闲闩**已点火**（回调已在队列）恰逢中止 ⇒ `fireIdle` 的 busy ∕ inWindow 读点在中止后 ⇒ 仍交付 + 起 timer 轮（`suspension-drive.mjs` ∕ `timer-watch.mjs` —— 非本档落点）。

## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 17:5x · 父侧独立复跑——与 timer-wake 批同刻）
- 桌面 `node test/run.mjs` = **263/263 pass · fail 0**（本批新档与集成域真 Electron 全绿）；冒烟 = `window:true ∧ boot:"ok" ∧ errors:[] ∧ ok:true`；核 772/772 · VSC 1052/1052（跨批共享读数）。
- 机检 = 悬空 64 · 行宽 35（净 0/0）。
- 实施链 = 实施舱（#39）→ 设计收尾（#44）→ 点修（#46：U-4/U-3）→ 修正 2（#47：U-6/U-7）；全舱 converged（修正 2 终态 clean · 负控四桩判红取证在案）。

### 6.2 验收对照（AC-1–AC-7）
- 机检 ∕ 离线可产面全绿（AC-1–AC-7 逐条在 §5 在案；AC-6 = T-DSK45 离线可产面落档）。
- **人工走查登记（非阻断）**：真回合面（忙态气泡 × 步边界注入观感 ∕ 附件让位 ∕ 续发链）——待真机走查（父侧 ∕ 用户）。

### 6.3 未决 ∕ 移交（在册不丢）
- **U-12（切项目臂代次洗白 · 四环条件）+ 表外两发现（`send` 装配 await 跨中止起跑 ∕ 空闲闩已点火逢中止）** = 入册（台账新条——各需设计面决策）。
- **回填轮 #511**：U-9（KD-40 ⑤ ∕ §2.2 补句 · §4.1 读数 ∕ 机检面清单）· U-10（墓碑 ∕ 代次 ∕ 落盘闸机制句）· `RENDERER.md:88`「十三通道」计数。
- **拆档批 #510**：`agent-host.mjs` 374 ∕ `agent-host.test.mjs` **489（距硬限 11 行——下轮迁两例）**。
- 在册小项：`test/agent-host-queued.test.mjs:13` 档头用例号清单（一句级）。

### 6.4 收口同步清单（D7）
- 角色表 = 六段齐；状态行随本收口置；指针（§1.19–§1.20 ∕ §2.8 ∕ §5 各轮）全解析；变更记录 = 五档以上各 +1 笔；台账 = #509 待核销（随提交核销）。
- **前批遗留交叉核对**：align-3 等 = 已收口冻结 ✓；无「条目已结而锚批档未闭」项。
- **本批 = 实施完成 + 亲验通过 ⇒ 已收口 2026-09-28（记录冻结）。**
