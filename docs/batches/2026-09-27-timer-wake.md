# 2026-09-27 · timer-wake
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 用户 2026-09-27 15:34（发现）+ 15:36（「可以，而且……得琢磨个界面」= 立批 + 增点）；台账 #443 + #444。
> 台账 = #443 + #444（timer 空闲唤醒 + 可见面 · 在途）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批次目标**：timer 能力补全两面——① **空闲唤醒**：到期 timer 在会话**空闲期主动送达并自唤醒一个系统回合**（现况：仅回合边界轮询 ⇒ 空闲零送达）；② **timer 可见面**：在途 / 到期 / 触发三态在**前台可见**（用户 15:36：「有定时器在后台时前台是看不见的，这个得琢磨个界面」）。

**来源**：用户 15:34 发现（「异步定时器触发有点问题，只有主会话活的时候才能收到，等待期不会主动推进来」）+ 15:36 裁定「可以，而且……得琢磨个界面」（= **立批 + 增点②**）。

**机制取证（父侧实读 · 定性 = 能力缺失，非崩溃）**：

- `agent-tools/timer.mjs:41-42` = 设 timer 仅 `_pendingTimers.push({expiresAt, message})`——**零调度器**（无 setTimeout / 无事件 / 无唤醒）；
- `agent/post-turn.mjs:16-25` = 到期过滤与注入**只在 `injectPostTurn`**（头注「Must be called after every tool-execution turn within runAgent&apos;s loop」）；
- `agent.mjs:431` = **唯一调用点**（回合循环内）⇒ 到期注入 = **回合边界轮询**；空闲无回合 ⇒ 无人检查 ⇒ 零送达、零唤醒。
- 实证（今晚自然实验）：2026-09-27 14:21 设 1500s（到期 14:46）→ 空闲期零送达 → 15:32 用户消息起新 run 后才注入（迟到 ≈47 min）。

**范围（本批做）**：

- **① 空闲唤醒（核心面）**：到期 timer ⇒ 走**既有注入管线**主动投递 ⇒ 消费触发**系统回合**（自唤醒）。门 = ① 仅系统类消息可自唤醒（用户消息本就唤醒）② 成本闸 ③ 开关（形态与默认值由设计定）。载体 = busy 队列 / 挂起窗 / 会话槽（**设计轮实读定形**——三面均在仓内）。跨形态须定义：CLI 前台 / headless / 桌面（挂起窗存在面）。
- **② timer 可见面**：三态前台可见（已设 / 到期 / 触发）+ 触发事件的**会话流痕迹**；端面枚举由设计轮定（TUI 至少；桌面 / VSC 按各自既有渲染面裁定，若接则取最薄形态）。
- **③ 验证**：机制面测试（假钟 / 注入路径用例）+ 端面按各自既有测法；**空闲唤醒须有可复现验证形态**（设计轮定：如伪造到期 + 空转/挂起态用例）。

**边界（不做）**：timer 工具参数面零改（可见性所需字段除外）· 不做模型门控 / 不按模型设岗 · **不新增机械门**（承 2026-09-18 裁定）· #442 已收口面零触 · 压缩 / traces 等无关机制不扩面。

**台账**：#443（空闲唤醒）+ #444（可见面）→ 本批。

**补正（父侧 · 2026-09-27 评审轮后）**：§1 机制取证首条示例的形状漏记 `id`——`_pendingTimers` 条目实形 = `{ id, expiresAt, message }`（以设计 §6.30.1 为准；= 评审范围外注 ① 的钉死项，实施前以本节补正收口）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（载体=核到期件+CLI一次性deadline闩+挂起窗第三兑现态；门三件齐；端面枚举含不接+理由；机检零新增）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖 #443 + #444）**：

| # | 条目 | 判据（可机检） |
|---|---|---|
| ① | **空闲唤醒**（台账 #443）：到期 timer 在会话空闲期主动送达 + 自唤醒系统轮 | 载体 = 核到期件（三件纯函数）+ CLI 一次性 deadline 闩 + 挂起窗第三兑现态；门三件齐（仅系统类可自唤醒 / 成本闸 / 开关默认开）；假钟用例可复现（T-TW3 / T-TW4 / T-TW8） |
| ② | **可见面**（台账 #444）：三态（已设 / 到期 / 触发）前台可见 + 触发会话流痕迹 | 状态行 `⏰N` 派生标记（零在途零注入 · 负向锁逐字节等价）+ 触发落流一行 + `/timers` 只读列表（T-TW10 / T-TW11） |
| ③ | **验证形态**：机制面可复现 + 端面按既有测法 | 核 / CLI 两新用例档（T-TW1–T-TW12；假 timer / 假到期 / 空转态直驱——零真实等待）；仓根 `node scripts/doc-check.mjs` 本批三档零新增 |

**本批明确不含（边界）**：VSC / 桌面的自唤醒与可见面接线（端差对齐 = 另批登记 · 本批端树零写入）· `/timers` 取消面 · 模型门控 · 新增机械门 · timer 参数 schema 面（零改）· #442 已收口面 · 压缩 / traces 等无关机制。

**设计档落点（本批三档）**：

- **机制单源** = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` **§6.30**（新增；承载节列表同批登记）——问题陈述与现状坐标 / 载体定形（含四条否决）· 接口契约（投递形态 / 消费入口 / 门三件 / 描述面收正）· 关键决策 D-TW1–D-TW8 · 跨形态行为表 · 受影响文件 · 用例表 T-TW1–T-TW12 · 验收回指 A-TW1–A-TW7 · 边界。
- **CLI 显示形态单源** = `docs/cli/design/TUI.md` **§7.6**（新增）——三态定义 / 状态行 `⏰N` 派生标记（状态段簇尾：ledgerHint 后、titleHint 前）/ 触发落流一行 / `/timers` 只读列表 / 负向锁 / 可机判 / VSC·桌面对位。
- **工具契约面** = `docs/core/design/TOOLS.md` §6.7（timer 行补到期语义「在途跨 run 存活 + 到点自唤醒」+ 在途帽「≤ 8 · 超限显式拒」；参数 schema 零改）。

**机制设计（摘要）**：

1. **载体定形（实读三候选后裁定）**：busy 队列（`thincoder-core/agent.mjs:244` + `thincoder-cli/src/tui/queued-pickup.mjs`）语义 = 用户消息通道且空转期无人取队 ⇒ 否决；挂起窗（`thincoder-cli/src/tui/suspension-drive.mjs`；`waitForSettleOrWake` 三态单次兑现）只在池 live 时开 ⇒ 作**窗内**载体复用；会话槽（`thincoder-core/session-slots.mjs`）零步进能力 ⇒ 否决。
   **裁定** = 核到期件（`thincoder-core/agent/timers.mjs`（拟新增）：`pendingTimerDeadline` / `takeExpiredTimers` / `injectTimerReminders`——`post-turn.mjs` 同批改调，行为零变）+ CLI 空闲面**一次性 deadline 闩**（`thincoder-cli/src/tui/timer-watch.mjs`（拟新增）——到点自撤 / `unref()` / 单槽武装；形态先例 = `thincoder-cli/src/heap-watch.mjs:41-48`）+ 挂起窗 `waitForSettleOrWake` 第三兑现态 `timer`。
2. **投递形态** = `history.push({ role:"user", content:"[System reminder: ⏰ timer — <message>]" })`（逐字沿用既有注入单源；机器线独有）。
3. **消费入口** = auto-turn 第三变体 `timerTurn`（`runAgent` opts 新增，仅作域文本选择；域文本 = `TIMER_TURN_DOMAIN`（拟新增常量，`thincoder-core/agent/helpers.mjs`）——**逐字文本 = 父侧定稿（内容权威）**，设计给合同）；宿主传**普通回调**（权限 / 提问照常——digest 手动档剥处理器形态不沿用：timer 语义 = 动手取数据）。
4. **门三件**：① 仅系统类可自唤醒（唤醒源 = `_pendingTimers` 唯一写点；零通用「注入即唤醒」通道）· ② 成本闸（到期批合并一轮 / 到期即消费幂等 / 轮次帽沿用系统 `maxTurns` / 撞帽不自动续跑 / 在途帽 8 超限显式拒）· ③ 开关 `agent.timerWake`（布尔 · **默认 `true`**——工具描述面已承诺到点提醒；关键先例 = `diagnostics.heapWatch`；关 ⇒ 不武装闩，回既有回合边界投递）。
5. **跨形态行为表**（设计 §6.30.4）：CLI 前台 = ✅ 自唤醒 · CLI 挂起窗 = ✅ 窗内自唤醒 · CLI headless（`chat` / ACP / 直连 `runAgent`）= ❌ 不支持（空转面不存在）· 桌面 = ❌ 不支持 + 理由（无挂起窗 / 回合入口单一 / 主进程零轮询；可见面需新 `ev:*` 通道——白名单 10 条测试锁定）· VSC = ❌ 不支持（空转期无等待器 + 端内每 run 清 `_pendingTimers` 端差）。
6. **可见面三态**：已设 = `⏰N`（N = 主 agent 在途数；零在途零注入）；到期 = 同段警示色（任一在途项已过期未送达）；触发 = 会话流一行（逐字 = `[System reminder: ⏰ timer — …]`）+ timer 轮开跑。**派生式**（每帧活读 `agent._pendingTimers`——零缓存 / 零推送链 / 无空闲重绘定时器 / 无倒计时）；子代理 timer 不进本面（构造性零泄漏）。

**受影响文件全清单（行数标注制）**：

| 文件 | 现行行数 | 预计增量 | 说明 |
|---|---|---|---|
| `thincoder-core/agent/timers.mjs`（拟新增） | — | ~45 | 到期件三件纯函数 |
| `thincoder-core/agent/post-turn.mjs` | 70 | −6 | 改调到期件（行为零变） |
| `thincoder-core/agent.mjs` | 444 | +2 | opts `timerTurn` + 域文本三元 |
| `thincoder-core/agent/helpers.mjs` | 463 | +7 | `TIMER_TURN_DOMAIN` 常量 |
| `thincoder-core/agent-tools/timer.mjs` | 46 | +5 | 在途帽显式拒 + 描述面收正 |
| `thincoder-core/config.mjs` | 426 | +1 | `agent.timerWake: true` |
| `thincoder-core/test/timer-wake.test.mjs`（拟新增） | — | ~150 | 核侧用例族 |
| `thincoder-core/test/turn-domain-mode.test.mjs` | 57 | +6 | 三元 + 域文本断言 |
| `thincoder-cli/src/tui/timer-watch.mjs`（拟新增） | — | ~70 | 一次性 deadline 闩（注入缝） |
| `thincoder-cli/src/tui/agent-turn.mjs` | 379 | +3 | 链尾 `sync` 调用 |
| `thincoder-cli/src/tui/suspension-drive.mjs` | 341 | +28 | timer 轮 + 窗内 deadline + 等待第三态 |
| `thincoder-cli/src/tui/turn-face.mjs` | 64 | +2 | `turnCtx.timerWatch` 字段 |
| `thincoder-cli/src/tui/index.mjs` | 227 | +8 | 装配 + 惰性回填开轮入口 |
| `thincoder-cli/src/tui/render-frame.mjs` | 423 | +9 | `timerHint` 段（状态段簇尾） |
| `thincoder-cli/src/tui/cmd-timers.mjs`（拟新增） | — | ~40 | `/timers` 只读列表 |
| `thincoder-cli/src/tui/slash-commands.mjs` | 186 | +3 | 名单 + 分派 + import |
| `thincoder-cli/test/timer-wake.test.mjs`（拟新增） | — | ~160 | 端侧用例族 |
| `thincoder-cli/test/cmd-timers.test.mjs`（拟新增） | — | ~50 | T-TW11 |
| `thincoder-cli/README.md` | 535 | +1 | 配置键面示例 |
| `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 385 | +~80 | §6.30（本节） |
| `docs/cli/design/TUI.md` | 797 | +~35 | §7.6 |
| `docs/core/design/TOOLS.md` | 1131 | ±1 行 | §6.7 timer 行 |

**验证形态**：核 = 到期件 / post-turn 回归 / 在途帽 / 域文本（T-TW1 / T-TW2 / T-TW7 / T-TW9）；CLI = 空闲闩武装与自唤醒（T-TW3 / T-TW4，假 timer 直驱）、busy 期零动作（T-TW5）、开关关（T-TW6）、挂起窗第三兑现态（T-TW8，`suspensionSession` 直驱）、状态行标记与负向锁（T-TW10）、`/timers`（T-TW11）、子代理隔离（T-TW12）。全部零真实等待（假 timer 注入缝 + 纯函数直驱——先例 `thincoder-cli/test/heap-watch.test.mjs`）。

**机检读数**（as-of 2026-09-27 · 设计轮）：`node scripts/doc-check.mjs` —— 本批三档**零新增闸项**（命中仅「拟新增」列报 + 符号·宽报告面，均不入闸）；存量红在他档（悬空 48 · 行宽 22），本批零改（见上抛项 4）。

**上抛 / 报告项（供父侧处置）**：

1. **描述面前提订正**：`thincoder-core/tool-docs/timer.md` **不存在**（该目录 24 档 = 基础工具集；timer 属 agent-tools，描述**内联**于 `thincoder-core/agent-tools/timer.mjs:11-15`）——设计按内联描述面判收正形态（D-TW8：契约句保留 + 补投递形态 / 在途帽句；逐字 = 父侧定稿）。
2. **VSC 端差（发现项）**：VSC 端每 run 起点清空 `_pendingTimers`（`thincoder-vscode/src/agent/agent-state.mjs:30`，经 `thincoder-vscode/src/agent/setup.mjs:117` hydrateRun 路径）⇒ 跨 run 的 timer 静默丢弃，与核语义（不复位）相悖——建议另批对齐（本批 VSC 零写入）。
3. **桌面端自唤醒 + 可见面**：无既有钩子且成本高（新主进程调度器 + 新 `ev:*` 通道 + reducer / store / view / 两语词表）⇒ **不接 + 理由**（设计 §6.30.4 表）；建议台账登记后续项。
4. **存量机检红**：仓根 `node scripts/doc-check.mjs` 现态 FAIL（悬空 48 条 + 行宽 22 行——全部在他档；三档中 TUI.md / TOOLS.md / AGENT-LOOP-ASYNC-POOL.md 的既有宽行亦在其列）——本批只保证零新增，未清存量。
5. **需求档落点建议**（主 agent 笔）：唤醒语义条目（`docs/core/requirements/AGENT-LOOP.md` 或 `TOOLS.md` 的 timer 条目）+ 可见面 FR（`docs/cli/requirements/TUI.md`）——落点判定归主 agent。
6. **后续项建议登记**：`/timers` 取消面 · 桌面 / VSC 自唤醒接线 · VSC 端差对齐 · timer 描述面外置（`tool-docs/timer.md`）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**发现表（8 条：🟡 5 · 🔵 3 · 🔴 0）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria | 🟡 | A-TW7（`thincoder/docs/core/design/AGENT-LOOP-ASYNC-POOL.md:516`）判据 = 「仓根 `node scripts/doc-check.mjs` **exit 0**（锚 / 行宽）」——与同批自理读数相抵（`thincoder/docs/batches/2026-09-27-timer-wake.md:89` / `:96`：现态 FAIL＝悬空 48 + 行宽 22，「本批只保证零新增」）⇒ 该验收点按字面**不可达 / 不可判**。 | 判据改为「本批新增闸项 = 0（对比 as-of 2026-09-27 基线读数）」或把 exit 0 限定为「清存量后」；读数带字面（悬空 N / 行宽 M）以便复核。 |
| 2 | Requirements / 跨机制一致性 | 🟡 | `thincoder/docs/cli/design/TUI.md:667` 声明「§7.1 表零改」，但 §7.1 awaiting 行理由句「agent 已停、**无自动续跑**」（`TUI.md:548`）在「在途 timer + 闩已武装」态失效；置位谓词排除集（`TUI.md:567`）不含在途 timer ⇒ 空闲挂机会同时呈现「⚠ 等待你的输入」与「到点自唤醒」，而 §6.30 未定义抑制 / 优先级。 | 定在途 timer 是否抑制 awaiting（如纳入 `userNeededAtTurnEnd` 排除集），或改写 §7.1 理由行；二者择一并落条文 + 机判。 |
| 3 | Affected-file size annotations | 🟡 | §6.30.6 触及的 >300 档全数无档位审视 / 拆分结论、亦无债务簿指针：`thincoder-cli/src/tui/suspension-drive.mjs` 341 **+28**（`:476`）· `thincoder-core/agent/helpers.mjs` 463 +7（`:469`）· `thincoder-core/agent.mjs` 444 +2（`:468`）· `thincoder-core/config.mjs` 426 +1（`:471`）· `thincoder-cli/src/tui/render-frame.mjs` 423 +9（`:479`）· `thincoder-cli/src/tui/agent-turn.mjs` 379 +3（`:475`）。 | 补 >300 审视结论块（先例 = 同档 §6.20.4 拆分计划 / `TUI.md` §6.8.3.4）——至少为 +28 的 `suspension-drive.mjs` 给候选拆分面或「本批只登记不拆」。 |
| 4 | Completeness / Clarity | 🟡 | §6.30.3（`:435`）声明 `agent.timerWake` 键面派生「先例口径 = 派生消费面登记行，`docs/core/design/CONFIG.md`」，但 §6.30.6「受影响文件**全清单**」（`:462-487`）无 CONFIG.md 行 ⇒ 派生登记是否落笔 / 落哪一行未定。 | 明确 CONFIG.md 是否需要登记行；需要则补入全清单，不需要则注明零落笔理由（防下游按「全清单」漏项）。 |
| 5 | Document ownership / 一致性 | 🟡 | 工具契约行（`thincoder/docs/core/design/TOOLS.md:236`，本批改）与描述面收正句（`AGENT-LOOP-ASYNC-POOL.md:437`）以**无端限定**句写「在途跨 run 存活 + 到点自唤醒（空闲 / 挂起窗）」，与 §6.30.5（`:454-460`）「桌面 / VSC / headless = ❌ 不支持」及 VSC 在途清零发现项（`:390-391`）口径不一——核单源描述双端共享 ⇒ 在 VSC 侧形成新承诺（「空闲 = 自唤醒」）而实态不能兑现（端差已登记未对齐）。 | 契约行 / 描述句携带支持面限定或回指（如「支持面 = §6.30.5」），或与端差对齐批合并登记，使单读契约面不至全端承诺。 |
| 6 | Acceptance criteria（边界） | 🔵 | 三态之「到期」态可达性未定义：开关默认开 + 空闲 ⇒ 到期即被闩取件开轮（`:420` / `:456`）→「触发」直接覆盖「到期」（`TUI.md:674` 的可见窗口仅存在于有帧且未出列时段）；开关关的空闲面（T-TW6 `:498`）无闩、无空闲重绘（`TUI.md:680`）⇒ 警示色只等下一次偶发重绘。 | 注明「到期」态的可达条件（有帧窗口；以处理中 / 挂起期为主），或对开关关空转面给可见性一句（含判据、或明确不承诺）。 |
| 7 | Clarity | 🔵 | §6.30.7 用例表（`:491-504`）无「用例 → 宿主文件」落点行（先例 = 同档 §6.20.6 `:348-351`），且 T-TW9 同列两宿主（核新测档 `:472` ∥ `turn-domain-mode.test.mjs` `:473`）⇒ 落点歧义。 | 补落点行，或注明 T-TW9 断言在两档的分属（核新档＝选择面 / 既有档＝模式三元回归）。 |
| 8 | Numeric drift | 🔵 | 自档受影响文件行（`:485`）「385 + ~75（本节 §6.30）」——本节实落 ≈148 行（+变更记录 3 行），现档实测 ≈537 行 ⇒ 增量低估约 2 倍；TUI.md 行（`:486` 797 + ~30，实落 ≈34）与 TOOLS.md 行（`:487` 1131，现读 1133，±1 已由计法差异解释）无碍。纯 md 免罚，仅读数失真。 | 实施 / 收口轮把估读改实测值，或补「as-of 估」标注。 |

**计数**：🔴 0 · 🟡 5 · 🔵 3。

**范围外注（不计严重级）**：① 批档 §2（`thincoder/docs/batches/2026-09-27-timer-wake.md:15`）记 `_pendingTimers.push({expiresAt, message})`，设计 §6.30.1（`:385`）记 `{ id, expiresAt, message }`——两处条目形状不一，实施前需钉死。② `thincoder/docs/batches/2026-09-13-CORE-UNIFICATION.md:2081` 曾把 `_pendingTimers` 归入「run / 回合内生命周期 · 每次 run 起始复位 / 回合尾清空（VSC §11.2 A 类同口径）」——与本批 D-TW3「跨 run 存活 = 规范语义」的表面口径不同；VSC 端差对齐批宜一并裁定该分类（本批已登记端差、零写入端树）。

**VERDICT: pass**（无 🔴——设计可实施；🟡 / 🔵 不阻塞）

**评审范围限制（如实）**：无项目标准档申报（方法论合规按 AGENTS.md 判）；无文档地图（Document ownership 判据降级——按 Project Guide 与在批落点判）；代码坐标未逐一复读（评审范围外）——档内代码断言按「设计轮实读」采信，未复核。

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-27 15:36「可以，而且……得琢磨个界面」= 立批 + 全链授权：设计 → 评审 → 实施 → 验证）——三条件齐备：① 评审 #88 pass（0🔴 · 5🟡 / 3🔵——发现表在 §3）② 修正轮 #89 已落地并父侧逐条核验（8/8）③ designToken 已签发（值不入档）。**

- **核验明细（父侧实读 · 2026-09-27）**：1 → `AGENT-LOOP-ASYNC-POOL.md:540`（A-TW7 判据）✓ · 2 → `TUI.md:548` / `:566-568` / `:668` + `AGENT-LOOP-ASYNC-POOL.md:420` + T-TW13 `:524` + 宿主行 `:526-528` + A-TW6 `:539` ✓ · 3 → `AGENT-LOOP-ASYNC-POOL.md:492-506`（6 档审视块）✓ · 4 → `CONFIG.md:154` + `AGENT-LOOP-ASYNC-POOL.md:435-436` / `:490` ✓ · 5 → `TOOLS.md:236`（支持面指针）+ `AGENT-LOOP-ASYNC-POOL.md:439`（端限定合同形）✓ · 6 → `TUI.md:682-683` ✓ · 7 → `AGENT-LOOP-ASYNC-POOL.md:526-528` ✓ · 8 → `AGENT-LOOP-ASYNC-POOL.md:487-490`（实测订正）✓。
- **需求档面（父侧笔 · 同轮回补）**：`docs/core/requirements/AGENT-LOOP.md:279` N3 → T-TW1–T-TW13 ✓ · `docs/cli/requirements/TUI.md:34` F13 判定句 ④ 补「在途 timer〔唤醒会武装〕」✓。
- **§2 三处滞后以设计档为准**（修正轮按令未触 §2）：① 用例 = T-TW1–T-TW13 ② `agent-turn.mjs` = 379 → ≈384（+5）③ 设计面 = **四档**（三档 + `docs/core/design/CONFIG.md`）。
- **批准 = 实施轮**（eng-coder · 本设计槽）；实施边界 = 设计 §6.30.9 + 上述三处订正；两条逐字（`TIMER_TURN_DOMAIN` / timer 描述面）由父侧随派单定稿、逐字入码。

## §5 实施记录（eng-coder）
**状态行**：实施完成（T-TW1–T-TW13 全绿 · 三包实跑（706/846/944）· 内部审计 0 偏差 · 代码评审 pass（7×🔵 报告项）· fix round 1）



**交付摘要（批条目 ① 空闲唤醒 / ② 可见面 / ③ 验证形态——逐条落点 + 实测行数）**：

| # | 交付 | 落点（实测行数·wc -l 语义） | 用例 |
|---|---|---|---|
| ① | 到期件三件纯函数（`TIMER_MAX_PENDING` / `pendingTimerDeadline` / `takeExpiredTimers` / `injectTimerReminders`——单一权威读面） | 新 `thincoder-core/agent/timers.mjs`（50） | T-TW1 / 1b |
| ① | post-turn 块改调到期件（行为零变） | `thincoder-core/agent/post-turn.mjs`（70→**66**，−6 = 设计估） | T-TW2 |
| ① | 在途帽 8 显式拒 + 描述面逐字收正（父侧定稿） | `thincoder-core/agent-tools/timer.mjs`（46→63） | T-TW7 |
| ① | `timerTurn` 旗标（opts）+ 域文本三元 + `TIMER_TURN_DOMAIN` 常量 | `thincoder-core/agent.mjs`（444→447）· `thincoder-core/agent/helpers.mjs`（463→472） | T-TW9 |
| ① | 开关键 `agent.timerWake` 默认 `true` | `thincoder-core/config.mjs`（426→429） | T-TW6 / T-TW13 |
| ① | CLI 一次性 deadline 闩（单槽 · 到点自撤 · `unref()` · `timer`/`clear`/`now` 注入缝） | 新 `thincoder-cli/src/tui/timer-watch.mjs`（90） | T-TW3 / 4 / 4b / 4c / 5 / 6 |
| ① | 链尾武装 + `userNeededAtTurnEnd` 在途 timer 除外 + 旗标透传核 | `thincoder-cli/src/tui/agent-turn.mjs`（379→386） | T-TW13 |
| ① | 挂起窗第三兑现态 `timer` + 窗内 timer 轮 | `thincoder-cli/src/tui/suspension-drive.mjs`（341→362） | T-TW8 |
| ① | 装配 + 火面兜底 catch · `turnCtx.timerWatch` 字段 | `thincoder-cli/src/tui/index.mjs`（227→240）· `thincoder-cli/src/tui/turn-face.mjs`（64→67） | T-TW4c |
| ② | 状态行 `⏰N`（到期 warn 同 ledgerHint 口径 · 零在途零注入） | `thincoder-cli/src/tui/render-frame.mjs`（423→428） | T-TW10 / 12 |
| ② | 触发落流一行（逐字 = 系统提醒形态 + 三行 cap） | `thincoder-cli/src/tui/timer-watch.mjs`（同上，`deliverExpiredTimers`） | T-TW4 / 4c |
| ② | `/timers` 只读列表（逐条 + 空态） | 新 `thincoder-cli/src/tui/cmd-timers.mjs`（33）· `thincoder-cli/src/tui/slash-commands.mjs`（186→189） | T-TW11 / 11b / 11c |
| ③ | 两新用例档 + 模式三元回归 | `thincoder-core/test/timer-wake.test.mjs`（158）· `thincoder-cli/test/timer-wake.test.mjs`（274）· `thincoder-cli/test/cmd-timers.test.mjs`（42）· `thincoder-core/test/turn-domain-mode.test.mjs`（57→61） | T-TW1–T-TW13 |
| ③ | 配置键面示例 +1 行 | `thincoder-cli/README.md`（535→536） | — |

**决策透明表（实施轮自有裁定——设计未逐字处，逐条给依据）**：

| # | 决策点 | 裁定 | 依据 / 边界 |
|---|---|---|---|
| 1 | `TIMER_MAX_PENDING` 常量落点 | 落核 `thincoder-core/agent/timers.mjs`，工具 import 单源 | 设计只给「帽 = 8，与 `QUEUED_MAX_ITEMS` 同值同形」；消费面两处（工具拒 + 未来显示）共用 ⇒ 核单源 |
| 2 | `injectTimerReminders` 返回值 | 返回注入原文数组（显示面复用同一串——零第二份字面） | 设计给「历史注入单点」；返回值为附加面（签名零变、post-turn 行为零变） |
| 3 | 域文本三元分支序 | `upstreamTurn` → `timerTurn` → 模式两级 | 设计 T-TW9「`upstreamTurn` 优先不回归」；DOM-C2 正则同批收正 |
| 4 | 开关判据读点 | `thincoder-cli/src/tui/timer-watch.mjs` 内 `agent.config.agent.timerWake !== false`，每次 `sync()` 活读 | 设计门三件③「关 ⇒ 端侧不武装闩」；活读 ⇒ 运行期翻转于下个链尾生效（零缓存副本） |
| 5 | 挂起窗 deadline 注入缝 | `waitForSettleOrWake(agent, state, { deadline, timer, clear })`，driver 传 `ctx.timer` / `ctx.clear`（缺省真实现） | 设计给「等待第三兑现态」；注入缝先例 = heap-watch —— 用例零真实等待 |
| 6 | 火面异常兜底 | `index.mjs` onFire 挂 `.catch`（错误行 + 重同步闩）；先例 = key-handler `submit().catch(...)` | 内部审计 🟡（火面 Promise 丢弃 ⇒ 无人值守报错上传进程级 `unhandledRejection`）；修复轮 1 落地 |
| 7 | 枚举 `⏰<i>` 编号基 | 1 基（`⏰1 …`） | 设计只给 `<i>`；同族先例 = 排队待发送块 `i. ` 编号（1 基） |

**审计与代码评审轮次与终态（本会话内自含闭环）**：

- **内部 explore 分叉审计（1 轮 · 阻塞）**：**0 偏差**——四类（部分实现 / 静默简化 / 档漂移 / 表外改动）逐类为 0；T-TW1–T-TW13 覆盖表 **13/13** 且为行为断言（唯一结构断言 = T-TW9 模式回归档，与设计 §6.30.7 宿行分工一致）；两条父侧逐字串 byte-exact 复核通过；另报 1×🟡（火面 Promise 丢弃）+ 4×🔵（其中 1 项 = 落流 cap 无用例 ⇒ 本轮补例）。
- **修复轮 1（自修）**：🟡 修复 = `thincoder-cli/src/tui/index.mjs` 火面 `.catch`（错误行 + 重同步）；补例 = T-TW4c（多行 message ⇒ 三行 + 省略号 / 注入面仍全串 / 开轮抛错不逃逸 + 重武装）与 T-TW4b（同批合并一轮）；复跑 CLI 全量 = 846 ✔。**未发生设计面改动**（设计档 / 需求档零写）。
- **内部 advisor 代码评审（1 轮 · 同步）**：**VERDICT: pass**（0×🔴 / 0×🟡 / 7×🔵——6 项为报告或可选建议、1 项 = §5 未落笔〔本节即补正〕）；评审自承「三包读数 / doc-check 未独立复跑」= 其装配限制，读数面以本节实测为准。
- **fix round 计数**：1 轮（上限 5 未触）；终态 = **clean**。

**读数（本机实测 · 终态树 · cwd = 仓根 `D:\teamcode\thincoder`）**：

- 三包全量：`node --test "thincoder-core/test/*.test.mjs"` = **706 ✔ / 0 ✘**（基线 700 + 新 6）·
  `node --test "thincoder-cli/test/*.test.mjs"` = **846 ✔ / 0 ✘**（基线 833 + 新 13）· `node --test "thincoder-vscode/test/*.test.mjs"` = **944 ✔ / 0 ✘**（基线同值——端树零写入回归）。
- 新用例逐条：核 T-TW1 / 1b / 2 / 7 / 9 / 9b ✔；端 T-TW3 / 4 / 4b / 4c / 5 / 6 / 8 / 10 / 12 / 13 ✔ + T-TW11 / 11b / 11c ✔（全部零真实等待——假 timer / 假到期 / `ctx.runAgent` 桩）。
- 机检：`node scripts/doc-check.mjs` —— **悬空 48**（= 基线 48）· **行宽 24**（基线 22；+2 = `docs/desktop/design/IPC.md` 第 24 / 229 行，他批实施期改动，本批四档零命中）⇒ **本批新增闸项 = 0**。
- 逐字核验（脚本对拍，逐字节）：`TIMER_TURN_DOMAIN` = 374 字符 **byte-exact**（单行 · `[System reminder: ` 起 · `]` 收）· timer 工具描述串 = 725 字符 **byte-exact**（原契约句保留 + 投递形态 / 端限定 / 在途帽）。
- 其它机检：`npm run lint --prefix thincoder-cli` = 223 档 OK；本批新档 50 / 90 / 33 / 158 / 274 / 42 行（全 ≤300）· 触及 >300 档 6 档（`thincoder-core/agent.mjs` 447 / `thincoder-core/agent/helpers.mjs` 472 / `thincoder-core/config.mjs` 429 / `thincoder-cli/src/tui/agent-turn.mjs` 386 / `thincoder-cli/src/tui/suspension-drive.mjs` 362 / `thincoder-cli/src/tui/render-frame.mjs` 428）全 < 500 硬限，核侧三档已在册（`thincoder-core/test/core-hygiene.test.mjs` 的 `SOFT_LINE_REGISTRY`）。

**未落项 / 移交父侧**：无未落项。报告项三条 = ① 设计 §6.30.6 代码行估读与实测差（`timer.mjs` 46→63 / `regrender-frame` 计量见交付报告）② 在途帽为核工具面 ⇒ 全端共享（§6.30.9 边界 4「headless 零行为变化」宜加限定）③ 设计基线字面漂 2 行（悬空 48 不变 / 行宽 22→24）。设计档 / 需求档零写（落点修订归父侧）。

## §6 验证与收口（父代理）

**（甲）实施轮交付核验（父侧亲核 · 2026-09-27）**

- 交付：§5 在位（13 交付行全 ✅）；改动 = 核 8 档（含新 `agent/timers.mjs`）+ CLI 11 档（含新 3）+ `README.md` +1。
- **父侧独立复跑**：三包全量 = core **706/706** · cli **846/846** · vsc **944/944**（fail 0——父侧实跑 exit 0，29s / 36s / 52s）+ 新用例族四档单跑 exit 0。
- **逐字对拍（父侧直驱 import 比对）**：`TIMER_TURN_DOMAIN` = **374 字符 byte-exact** ✓ · timer 工具 `description` = **725 字符 byte-exact** ✓（含端限定句 / 帽句 / 跨 run 存活句）。
- **纯函数直驱（父侧）**：`takeExpiredTimers` 恰取到期 + 出列幂等 ✓ · `pendingTimerDeadline` 最近时点 / 空 → `null` ✓ · `injectTimerReminders` 逐字 `[System reminder: ⏰ timer — …]` + history 落位 ✓ · `TIMER_MAX_PENDING = 8` ✓。
- 机检：`node scripts/doc-check.mjs` = 悬空 **48**（= 开工基线，零新增闸项）；本批四档行宽**零命中**（行宽 22→35 漂移全来自他批在途文档）。
- 临时物：实施轮披露的 13 个 `_tw-*.log` 已删除 ✓。

**（乙）评审发现处置收敛**：§3 八条 → 评审轮修正（8/8 落位）→ 实施轮闭项三条（#91 实施后重锚：`AGENT-LOOP-ASYNC-POOL.md:466-508` 实测表 · `:549` 边界 4 端限定 · `:542` A-TW7 开工基线字面）——**全部收敛为 Fixed**。

**（丙）实施轮报告项处置（父侧裁定）**：内部 🔵#2 / #3（模态互斥未定义 · 异常路不重武装）= 登记台账 **#448**（条件触发——现态降级安全）；🔵#1 / #7 = 已随 #91 收正；🔵#3–#6 = 接受在册（§5 应答表）；范围外注 ②（`git-noninteractive` 偶发超时）= 存量 flake，非本批面。

**（丁）提交面裁定**：25 档入本批提交；**`docs/core/design/CONFIG.md` = 混合档**（env-config-purge 批 §6.2 全节在飞——:114-165 + :204-206）⇒ 不入本批提交（其本批笔迹 = `:154` 登记行扩面 + `:207` 变更记录，留盘随他批）；`thincoder-core/agent.mjs` / `config.mjs` = **运行必需**（含他批各 1 / 3 个小 hunk——`ADVISOR_DEBUG` 行删除 · `diagnostics` 键）⇒ 随本批提交并披露。另：escalation-canon 批探针产物两档（`bench/results/2026-09-27-probe-conflict-canon.{md,json}`）= #442 验收证据、上轮未随提交 ⇒ 本收口轮补一提交。

**（戊）收口核对清单（D7）**：角色表 ✓ · 状态行（§2 设计完成 / §5 实施完成 / §1 → 已收口）· 计数（T-TW1–T-TW13 · 19 test 块 · 706 / 846 / 944）· 指针（设计三档 + 需求两档 + CONFIG 登记行）· 变更记录（设计三档 + 需求两档 + CONFIG 一行）· 待办勾销（**#443 + #444 → 已核销**；#445 · #446 · #447 · #448 在册）· 前批遗留（#442 探针产物补提交）· 残留列报（CONFIG.md 混合档 · 他批 hunk 随提交 · 行宽漂移他批面）。

**收口结论**：全链闭环——设计（两档 + 一轮修正 + 一轮实施后重锚）→ 评审 #88（pass · 0🔴）→ §4 代签 → 实施 #90（三包全绿 + 逐字 byte-exact）→ 父侧独立验证（复跑 + 对拍 + 直驱）→ 提交双推 → 核销。**已收口 2026-09-27**。
