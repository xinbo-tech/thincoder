# 2026-09-21 · busy-injection
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 22:36 需求提出（busy 期截图被吞 + Ctrl+I 退役讨论）。
> 台账 = #213（TUI · 归批）。前情 = docs/batches/2026-09-21-exit-claim-release.md（在途——本批与其并行，无文件交集）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-22

**本批条目**（需求档 `docs/cli/requirements/TUI.md` F16 · 台账 #213 · 板块 TUI）：

| # | 面 | 一句话 |
|---|---|---|
| F16-A | busy 输入路径 | busy（processing 含 digest）Enter 提交不再吞——填 `pendingInput` 单槽 + queued 反馈 |
| F16-B | 送达链路 | 回合自然结束 → 既有回合尾 drain 续发新回合（`agent-turn.mjs`）——消息以 user 首条送达（挂起态既有语义） |
| F16-C | Ctrl+I 保留 | 打断注入与队列注入**两语义并存**（用户 2026-09-21 22:38 裁定）——本批零触碰 Ctrl+I 代码与文档 |

**起因与授权**：用户 22:28-22:31 会话中 busy 期发截图被 INPUT-LOCK 吞掉（`key-handler.mjs:283-285` busy 提交吞 + 斜杠同禁——2026-09-09 有意收窄，本批 = 有意识部分重开，形态改单槽非攒批）。用户 22:36「我觉得需要…ctrl+i inject 就不需要了」→ 父侧实勘呈卡（打断 vs 排队两语义不可互换 + 退役代价）→ **用户 22:38「那就还保留着 ctrl+i，同时把 busy 期注入做了」= 点火授权 + 保留裁定**。

**关键事实（父侧已勘 as-of 22:31）**：① 回合尾 drain 续发已存在（`agent-turn.mjs:334-341`，至多一条 R15 形）；挂起态 pendingInput 单槽交接已存在（`suspension-drive.mjs:305-308`）——**缺的只是 busy 输入路径**；② busy 门禁现值 = `key-handler.mjs:283-285`（提交吞 + 提示，文本保留输入框；斜杠同禁）+ `:413`（门禁先拦 pendingInput）；`index.mjs:367-384` submit 防御双保险（busy 拒不清输入框）；③ Ctrl+I 语义（保留面，零改）= `key-handler.mjs:176-183` interruptPrompt → `abort({interrupt:true,message})`；无 message Ctrl+C 首按 `:109-110` = 停回合不续跑（后台池保留）；④ 粘贴锁 `key-modes.mjs:151`（`_pasting` Enter 无效——与注入面正交，不在本批）。

**设计须裁**：① busy 二次提交行为（单槽满——覆盖 or 拒绝+提示，判定句设计钉死）；② queued 反馈形态（pushLine dim 行 or 状态栏——与 F13 attention 态豁免清单对齐：pendingInput 不出 attention）；③ digest 期提交与回合期提交是否同路径；④ VSC 对位面（busy submit 现状未核——若有等价面零改，若同吞则对称修 + 端差登记）。

**红线**：不引入多消息攒批（R15 撤销裁定不翻）；斜杠命令 busy 禁发不变；空闲/挂起 Enter 语义零改；不打断当前回合；R15 队列双源注释语义（`suspension-drive.mjs:244`）如实勘与单槽相容则零改。

**排除面**：截图粘贴问题（`_pasting` 锁时序嫌疑）不在本批；exit-claim-release 批并行在途（id=1 设计中）——本批与它无文件交集。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-22（实施悬空裁定轮——§5 两 🟡 并入本批：C-B2-6 细则① 扩 webview 守卫 + 新增细则⑥ 贴图降级对位 + 协议行 17 / §12 行 / §6.3 键 `input.slotFull`；源码修轮随后）；F16 三面全落档（INPUT-BOX §4.1 / TUI §7.5 / WEBVIEW-INPUT C-B2-6）；红线五项零触碰；用例 T-F16×7 + T-V16×4 + 本轮 +2（T-V16-5/6）钉宿主
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批任务与设计档落点（三链同源——批 §2 条目 = 设计验收条 = 需求 F16 判定句）**：

| # | 面 | 设计落点 |
|---|---|---|
| F16-A | busy 输入路径 | `docs/cli/design/TUI-INPUT-BOX.md` **§4.1 busy 期输入注入**（放行判据六条表 + 执行序 + 消费回执 + 送达零改声明 + VSC 对位 + 边界）；档 §6 模块表补行 |
| F16-B | 送达链路 | 零改声明（`thincoder-cli/src/tui/agent-turn.mjs:333-350` 兜底转正 + 队列续发 / `thincoder-cli/src/tui/suspension-drive.mjs:246-257` driver 输入优先消费——两条既有链路取数谓词零改）；消费回执行 `[sending queued message]` 两处落点钉死 |
| F16-C | Ctrl+I 保留 | 零触碰（`key-handler.mjs:176-183` / `key-modes.mjs handleInterruptMode` / INPUT-BOX 档 §2 表 / §8——全部原文零改）；两语义并存写进 §4.1 边界行 |

**四裁定面（结论 + 理由）**：

1. **放行条件**：`processing ∧ 非挂起（suspended/_suspPending 皆假）∧ 非模态（permission/question 皆空）∧ 非斜杠 ∧ 非空 ∧ 单槽空`。digest 期放行（processing 单一判据—— digest 是消化在途、用户输入优先 D-S5 既有规则）；**审批 / 提问卡挂起的 busy 提交不走本路径仍吞**（模态卡是回合阻塞面——用户意图 = 回应裁决，排队文本会串进裁决流；F16「回合运行中」的排除项）；挂起会话内 digest 期（suspended ∧ processing）仍吞——其消费点 `digestTurn` 正忙、VSC 同判端差最小化。
2. **二次提交**：**拒绝 + 提示 + 文本保留**（不覆盖）。理由：单槽至多一条 = 需求判定句钉死；覆盖 = busy 不可见窗口静默丢用户文本（违「不静默丢」纪律——`suspension-drive.mjs:306` 中止残余转正先例）；与既有挂起态槽满分支（`key-handler.mjs:417-422`）逐字同构零新机制。
3. **queued 反馈形态**：**两段式**——提交时状态栏 dim 段 ` │ 已排队 1 条消息`（`pendingInput.length` 现状派生，消费即消失，零簿记零定时器——F13 豁免对齐：零注意力色对非 chip）+ 消费时对话流 dim 行 `[sending queued message]`（`C.tool`，对位既有 `[continuing…]`）。清除时机 = 单槽被消费（两处消费点 shift 即派生消失）。否决提交时对话 dim 行（回合流式输出每帧刷新，queued 行瞬间被顶走不可见；落 `state.lines` 还需生命周期簿记）。
4. **VSC 对位**：**实勘 = 同吞**（`webview/send.js:26-31` 出口守卫拒发 + toast；`src/extension/panel-messages.mjs:111-113` `routeUserTurn` busy 拒收）⇒ 按需求授权句**对称修**：普通回合 busy 面（`running && !_suspended`）→ webview 本地气泡 + `queuedUserMessage` 消息 → host `panel._busyQueued` 单槽；挂起会话内 busy / 纯挂起等待面零改；送达 = 回合尾装载两分支（`enterSuspensionTurn` 预填 `susp.pendingInput` / idle 归位续发）。契约 = `docs/vsc/design/WEBVIEW-INPUT.md` §1 **C-B2-6** + §7 U-I8。

**受影响文件与测试面**：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| CLI·源 | `thincoder-cli/src/tui/key-handler.mjs` | 475 | `:282-296` busy 门禁改写（六判据分流 + 入槽）；挂起分支注释 `:411-414` 同步 | ~490 |
| CLI·源 | `thincoder-cli/src/tui/render-frame.mjs` | 413 | `:398-400` busy 提示段补 queued 分支 | ~416 |
| CLI·源 | `thincoder-cli/src/tui/agent-turn.mjs` | 375 | `:337-350` 队列 while shift 后补回执行（+2） | ~377 |
| CLI·源 | `thincoder-cli/src/tui/suspension-drive.mjs` | 334 | `:246-249` driver 消费 shift 后补回执行（+1） | ~335 |
| CLI·测 | `thincoder-cli/test/busy-injection.test.mjs`（拟新增） | — | T-F16-1…7 | ~120 |
| CLI·测 | `thincoder-cli/test/input-lock.test.mjs` | 386 | AC-1 断言翻转（busy 文本提交 → 入槽——AC-4 排除项新档） | ~390 |
| VSC·源 | `thincoder-vscode/webview/send.js` | 64 | 出口分流（本地气泡 + queuedUserMessage） | ~78 |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 305 | routeUserTurn busy 分支分流 + 入槽守卫 | ~318 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 189 | `enterSuspensionTurn` 装载两分支 | ~200 |
| VSC·源 | `thincoder-vscode/src/extension/chat-panel.mjs` | 487 | `_busyQueued` 初始化（+1） | ~488 |
| VSC·测 | `thincoder-vscode/test/busy-injection-vsc.test.mjs`（拟新增） | — | T-V16-1…4（webview-env DOM 载体 + host 单槽/装载/续发） | ~100 |

**跨文件限**：`chat-panel.mjs` 487（<500 但贴限）与 `key-handler.mjs` 475→~490——增量均为既有函数内分支 + 单行初始化，无新职责模块；`chat-panel.mjs` 若逼近 500 由实施轮微收（注释行压缩），不拆档。测试档全为新档（≤500）。

**用例表（T-F16-1…7 CLI / T-V16-1…4 VSC——宿主与断言钉死）**：

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-F16-1 | 正常 | `createKeyHandler` 驱 `processing: true, input: [..."msg"]` + Enter | `pendingInput === ["msg"]` ∧ `input` 清空 ∧ `history` 收录 ∧ 反馈段含 `已排队 1 条消息` | `test/busy-injection.test.mjs` |
| T-F16-2 | 正常 | T-F16-1 后模拟回合尾：`runAgentTurn`（`ctx.runAgent` stub）收尾且 `poolLive=false` | 队列续发新回合首条 user text = "msg" ∧ 回执行 `[sending queued message]` 在行 | 同上（`driveRig` 同法） |
| T-F16-3 | 边界 | 槽满（`pendingInput: ["first"]`）再 Enter | `pendingInput` 不变 ∧ 提示行 ∧ `input` 保留 | 同上 |
| T-F16-4 | 边界 | `permission: {...}`（busy+审批卡）/ `suspended+processing`（digest）/ `input: ["/exit"]` / 空 Enter 四形 | 四形全吞 + 文本保留（斜杠/模态带 busy 提示；空静默） | 同上 |
| T-F16-5 | 正常 | 挂起 driver（`suspensionSession`）+ digest 期（`suspended∧processing`）前入槽 + 池 settle | driver 消费单槽 → 用户回合首条 = 该文本 ∧ 回执行 | 同上（`suspensionSession` 驱法同 `input-lock.test.mjs` 既有 AC-5） |
| T-F16-6 | 机判 | `renderStatus` 纯函数：`processing+pendingInput:["x"]` / `pendingInput:[]` | strip-ANSI 含/不含 `已排队 1 条消息` ∧ 全程零 `\x1b[43m`（F13 豁免） | 同上 |
| T-F16-7 | 回归 | 既有 `input-lock.test.mjs` AC-2（挂起空闲）/ 释放窗口 / 槽满 / 斜杠 busy 吞 | 全绿（既有语义零回归；AC-1 busy 断言翻转至新档） | `test/input-lock.test.mjs` |
| T-V16-1 | 正常 | webview-env 驱 `send()` 于 `running && !_suspended` | 本地气泡存在 ∧ `capturedPosts` 含 `queuedUserMessage` | `test/busy-injection-vsc.test.mjs` |
| T-V16-2 | 正常 | host `routeUserTurn` busy + `panel._busyQueued` 空 | 入槽 ∧ 不续发 ∧ 提示 | 同上（vscode-mock 载体） |
| T-V16-3 | 边界 | `enterSuspensionTurn` 进会话（池 live）前 `_busyQueued: ["m"]` | `susp.pendingInput` 预填 → driver 消费开用户回合 | 同上 |
| T-V16-4 | 边界 | `running && _suspended`（digest 期）send + 纯挂起等待面 send | digest 期拒发零改；纯等待走既有 `susp.pendingInput`（零回归） | 同上 |

**验收对照（设计条 ↔ 需求判定句）**：AC-1 单槽填充+反馈可见 = T-F16-1（判定句①）；AC-2 送达新回合首条 = T-F16-2 / T-F16-5 / T-V16-3（判定句②）；AC-3 单槽语义 = T-F16-3（二次提交裁定）；AC-4 排除面 = T-F16-4 / T-V16-4（斜杠 busy 禁发 / 挂起零改）；AC-5 Ctrl+I 零触碰 = T-F16-7 全绿（无回归）+ 批档红线；AC-6 VSC 对称 = T-V16-1…4；AC-7 `npm test` 两端全绿（常规门）。

**红线对照（五项——全部未触碰）**：① Ctrl+I 代码与文档条目（INPUT-BOX §2 表/§8、TUI.md §4.2）零改——两语义并存；② 攒批不引入（单槽语义、R15 撤销不翻——队列结构零改）；③ 斜杠 busy 禁发不变（六判据之条件 4）；④ 空闲/挂起 Enter 语义零改（挂起分流原样——busy 分支在 `state.processing` 门内新增，不触 `:416` 挂起分支与 submit 主路径）；⑤ 不打断当前回合（入槽零 abort 零 interrupt——`agent-turn.mjs` 无消息注入口改动）。

**关键决策记录**：D-BI1 放行判据含「非模态」（审批/提问卡期仍吞——模态优先级在 key-handler 分派链最前，模态返回即消费 Enter，本路径物理不可达——设计如实陈述该结构保证）；D-BI2 二次提交拒绝+提示（非覆盖）；D-BI3 反馈两段式（状态栏派生段 + 消费回执行；否决提交时对话行与气泡改写）；D-BI4 VSC 对称修普通回合 busy 面（`_suspended` 区分——挂起会话内 digest 仍拒、纯等待既有单槽零改；`_busyQueued` 独立单槽，不动既有 `susp.pendingInput`）；D-BI5 需求档 F16 边界句「待设计勘定」改勘定结果（VSC 同吞实勘→对称修）——语义源 = 需求授权句本身，判定句零变。

**上抛项（主 agent 决策）**：无阻塞性上抛。观察项 ①：VSC `routeUserTurn` 拒收提示现为 host 级 `showWarningMessage`（`panel-messages.mjs:112`），普通对话流拒发提示为 webview toast——两级提示形态并存是现状，本批不统一（登记非阻塞）；观察项 ②：`panel._busyQueued` 与挂起中止残余的交互——挂起中止时 `_busyQueued` 若有残项（理论不可达：入槽仅发生在非挂起 running，而中止路径消费点先于 busy 期）按「无会话 → idle 归位续发」分支处理即可，无专门清槽分支。

**需求文档面（主 agent 笔，本批已按授权句落定）**：`docs/cli/requirements/TUI.md` F16 范围边界句 VSC 对位面「待设计勘定（…未核——若已有等价面零改，若同吞则对称修）」→ 勘定结果句（同吞实勘 → 对称修·digest 期与无挂起 running 拒发零改·契约 WEBVIEW-INPUT.md §1）+ 设计回指补节号——判定句与判定语义零变，需求侧无缺口上抛。

**协议登记补落（2026-09-22 · eng-designer——来源 = 实施轮上抛 + 父侧裁定）**：C-B2-6 细则⑤ 自陈的协议登记落档——
`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3.2 **行 16**（`queuedUserMessage` 新消息——webview → host 输入上行；D3：登记 **十五 → 十六项**，§7 D-P11 同改）+ **§13 行**（② `webview/send.js:44` · ③ `src/extension/panel-messages.mjs:174` · ④ `活`）；
`WEBVIEW-INPUT.md` C-B2-6 细则⑤ 登记指针补 §13 行；两档各一条变更记录。触发 = `test/protocol-coverage-reverse.test.mjs` W12-1（源码在位而 §13 无行 ⇒ `queuedUserMessage`）。**零新语义、源码零触碰**。

**要点④自查**：本批其他新增 / 改名协议消息 = **零**——发面提取集 51 = §13 表 51 行；收面提取集 52 = §12 表 52 行（两向机检全绿，7/7 用例）。

**观察（非本批登记面 · 报父侧）**：§13 / §12 ②③ 列坐标存量漂移（多批累积——如 §13 表原 50 行与 `--emit` 实测多不符：`abort` 行 `chat.js:44` 实为 `:62`、`userMessage` 行 host `:154` 实为 `:171`）。坐标列**不参与机检判据**（先例 = 2026-09-18 vsc-key-delete-confirm 批「不重出亦合规」）；本批未 sweep——建议收口轮或文档卫生轮按 `--emit` 全表重出。

**实施悬空裁定轮（fix round · eng-designer · 2026-09-22）——§5 两项 🟡 并入本批闭口（父侧裁定；本席 = 设计面落档，源码修轮随后）**

**裁定来源**：§5 决策透明表 #5 / #6「设计悬空（评审判 🟡 非阻塞 · 报父侧裁定）」——
① #6 webview 无单槽守卫（二次 busy 提交：气泡已上屏 + 输入框已清 + host 拒收 + 仅一条 VS Code 通知）；
② #5 排队项携贴图送达直呼 `runChat`，绕过 F-1 非视觉降级分支（`thincoder-vscode/src/extension/panel-messages.mjs:140`）。
**父侧裁定**（两项均并入本批闭口 · 同 F16 输入面家族）：① 端差默认 = 消 ⇒ VSC 守卫对位 CLI 形（`thincoder-cli/src/tui/key-handler.mjs:306-309` 槽满面：已有一条未消费排队 ⇒ 提交不出泡 / 不清框 / 给提示）；
② 送达路由对位 idle 同一降级判定。**设计落档** = `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6（细则① 扩写 + **新增细则⑥**）+ §7 U-I8 扩句 + 细则⑤ 落点面同步 + §9 用例面；
CLI 对位面 = `docs/cli/design/TUI-INPUT-BOX.md` §4.1 VSC 对位段补两行（+ 该档变更记录）；两档各一条变更记录。

**① webview 二次提交守卫（C-B2-6 细则① 扩写——判据 / 状态清除时机 / 提示形三面钉死）**：

| 面 | 钉死内容 |
|---|---|
| 判据 | `S._turnState === "running" && !S._suspended && S._busyQueuedPending` ⇒ 提交**不出泡 / 不清框** + toast |
| 判据源 | host 推送 `busyQueued { pending:boolean }`（权威 = host 单槽 `_busyQueued`——外部入口 Ask ThinCoder / retry 同面入槽，webview 不自持真值）；镜像 `S._busyQueuedPending`（`webview/state.js`）；提交受理时本地先行置位（host 推送权威收敛——防同 tick 二连 Enter 竞态） |
| 状态清除时机 | **消费即清**——装载两分支消费后（`panel-turn-stages.mjs:177` splice / `:208` shift）host 推 `pending:false`；忙分支每次判决后 host 推实际占用（受理 ⇒ true / 拒收 ⇒ 实际值）；`webviewReady` 握手重推（Reload 冷启重同步——对位 C-B2-5 `workspaceGuard` 先例） |
| 提示形 | toast（既有 `toast.js` 机制）+ **新键** `input.slotFull`（zh / en 逐字 = `WEBVIEW-PROTOCOL.md` §6.3 键表）；占位符零改（`input.busyPlaceholder` 文案面存量问题 = 观察 ①） |
| host 侧兜底 | 既有 `routeUserTurn` busy 槽满分支「拒收 + `showWarningMessage`」零改（外部入口兜底——webview 守卫第一层 / host 第二层） |

**② 送达路由贴图降级对位（C-B2-6 新增细则⑥）**：判决 = 与 idle 面同一（`images` 路径非空 ∧ `modelOverride` 在场 ∧ `specForModel(modelOverride).multimodal` 假 ⇒ 视觉渠道一次性子代理读图；
成功 ⇒ 描述注入 text + images 清空；失败 / 无渠道 / 超时 / 空返 ⇒ 原样兜底）。
判决函数 = 自 `panel-messages.mjs:140-157` **抽出**（住 `image-handler.mjs`；`visionReader` 注入缝随迁——缺省回落生产，per-call 参数形态同 idle 先例 `test/image-downgrade.test.mjs:162`）；
三调用点 = idle 面（原样——含 `_turnState !== "susp"` 门）/ 装载② `deliverBusyQueued`（`panel-turn-stages.mjs:206-210`——先置 running 再 await，同 F-1 idle 面忙锁不变量）/ 装载① `runTurn` 闭包（`:173-175`——入槽项带来源标记，仅该支降级；纯挂起既有路径零改）。
A12/Stop 语义随迁（`panel._visionAbort` 定向中止；`_abortRequested` 置位序 = 调 `runChat` 之后）。

**用例表 +2 行（宿主与断言钉死——补上表 T-V16-1…4）**：

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-V16-5 | 边界 | webview-env 驱 `send()`：`running && !_suspended` 且 `S._busyQueuedPending = true`（槽满镜像） | 零 `queuedUserMessage` 上行 ∧ 零新气泡 ∧ `inputEl.value` 保留 ∧ toast 可见（文案 = `t("input.slotFull")`）；另：host 推 `{type:"busyQueued", pending:false}` ⇒ 镜像复位 ⇒ 再 send 恢复排队 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` |
| T-V16-6 | 正常 / 边界 | 桩面板 `_busyQueued` 携 `{text, modelOverride:<非视觉>, images:[路径]}`：① 装载②（idle 归位）② 装载①（池 live 预填 → driver 消费）；`visionReader` mock 两形（返回描述 / 返回 null） | 两分支送达前均过同一降级判定：mock 成功 ⇒ 送达 text 含 `[图片 … 描述: …]` ∧ images 清空；mock null ⇒ text / images 原样兜底（不静默丢）；idle 面对照 = `test/image-downgrade.test.mjs` F-1 既有行 | 同上 |

**受影响文件表数值回填（实施轮实测）**：§2 表「预计后」列 minor 漂移——CLI `key-handler.mjs` ~490 → **496**；VSC `chat-panel.mjs` ~488 → **493**（收口轮按实回填的先行落档；两档均 ≤500）。
**新增 Δ 文件（本轮 fix round 源码面——待实施）**：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| VSC·源 | `thincoder-vscode/webview/send.js` | 85 | busy 队列分支前插守卫（判据 + toast + 本地先行置位） | ~95 |
| VSC·源 | `thincoder-vscode/webview/state.js` | 122 | `S._busyQueuedPending` 镜像字段（+ 注释） | ~125 |
| VSC·源 | `thincoder-vscode/webview/chat.js` | 451 | `case "busyQueued"`（镜像写入） | ~452 |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 316 | F-1 段抽出（迁 `image-handler.mjs`）+ `pushBusyQueued` 导出 + 调用点（入槽 / 忙分支判决 / `webviewReady` 握手） | ~330 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 210 | 消费两分支推 `pending:false`；装载② 降级接点（先置 running）；装载① `runTurn` 闭包降级支 + 来源标记 | ~235 |
| VSC·源 | `thincoder-vscode/src/extension/image-handler.mjs` | 90 | 降级判决函数（自 `panel-messages.mjs:140-157` 抽出——`visionReader` 缝随迁） | ~120 |
| VSC·文案 | `thincoder-vscode/locales/{zh,en}.json` | 266 / 266 | 各 +1 键 `input.slotFull`（逐字见协议档 §6.3） | 267 / 267 |
| VSC·测 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` | 232 | T-V16-5 / T-V16-6（+ webview-env 复位面补 `_busyQueuedPending`） | ~300 |

`chat-panel.mjs` 零改（`_busyQueued` 初始化已在位）；CLI 源 / 测零改（本裁定面纯 VSC 侧）。

**协议登记（`docs/vsc/design/WEBVIEW-PROTOCOL.md`）**：§3 增 `busyQueued` 行 + §3.2 **十六 → 十七项**（行 17 = `busyQueued { pending:boolean }`——host → webview 状态镜像；D3 计数与列表同改）
+ §7 D-P11 同改 + §6.3 键表 **19 → 20 键**（`input.slotFull`——端特有键 + 登记注）+ §12 新增 `busyQueued` 行。
**§13 零改**：父侧指令句以「§13 行」指代协议表落点——本信号方向 = **host → webview ⇒ 收面 §12**，发面表 §13 零行（口径 = 该档 §12 头注方向声明；如实报口径差）。
**已知时序（设计轮自陈）**：§12 行 ②③ 列 = **计划落点**（as-of 设计轮）；源码面落地前，`orphan` 类机检（表有行而源码零位）为已知紅，实施轮按 `--emit` 重出坐标即绿（先例 = §5 协议登记时序已知紅）。
**一致性面就地修**：`docs/vsc/design/PROJECT-SWITCHER.md` §4.1 行「§6.3 键表（19 键）」去携带总数（防表计数漂移——D3）。

**观察（报父侧 · 非本批登记面）**：① `input.busyPlaceholder` 文案「主会话处理中——Enter 提交禁用——可继续输入」与 C-B2-6 落地后普通回合 busy 面（Enter 可排队）不符——文案 = 产品面，本席不扩面；
② Reload Window 于挂起会话内 digest 期（`_turnState === "running"` ∧ host `_susp` 在场）：`S._suspended` 冷启无重推（`webview/panels.js:102` 仅由 `suspension` 消息置位）⇒ 提交走排队分支被 host 拒——同族冷启镜像缺口（建议后续轮补握手重推）；
③ §12 / §13 ②③ 列存量坐标漂移（多批累积 · 不参与机检判据——建议文档卫生轮按 `--emit` 全表重出）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审（busy-injection 设计：TUI-INPUT-BOX §4.1 + TUI §7.5 + WEBVIEW-INPUT C-B2-6）

评审范围 = 四档全读：`docs/cli/requirements/TUI.md` · `docs/cli/design/TUI-INPUT-BOX.md` · `docs/cli/design/TUI.md` · `docs/vsc/design/WEBVIEW-INPUT.md`。批次档本体不在 Documents 列表（见发现 #10 限定）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | VSC busy 队列面三档互相矛盾（同一机制两处异述——机制级）：C-B2-6（docs/vsc/design/WEBVIEW-INPUT.md:20）queue = `running && !S._suspended`（普通回合 busy）、reject = `running && _suspended`（:24 细则④自陈 digest ≡ `running && _suspended`）；TUI-INPUT-BOX.md:134-138 反写——queue =「挂起会话在场（S._suspended）且 running 非 digest」（:136）、reject =「digest 期与**无挂起 running** 拒发零改」（:138）。按两档自陈判别式，TUI-INPUT-BOX 的 queue 面 = 空集（自相矛盾）；其 reject 面「无挂起 running」恰为 C-B2-6 的 queue 面。且与自身 CLI 条件 3（TUI-INPUT-BOX.md:107：挂起期 busy 全吞，不分 digest/用户回合）不对称。requirements/TUI.md:37（F16 括注「digest 期与无挂起 running 拒发零改」+ 正面句「挂起会话非 digest 期同面送达」）与 TUI.md:609（§7.5 VSC 对位行）承同一反写并回指 C-B2-6 | 以 C-B2-6 ∪ CLI 条件 3 为准回写：queue = `running && !_suspended`、reject = `running && _suspended`、纯挂起等待零改；F16 VSC 句 / TUI-INPUT-BOX §4.1 VSC 段 / TUI §7.5 VSC 行对齐单表、他处只挂指针（D2）。取哪侧为准由父侧裁定 |
| 2 | Consistency | 🔴 | host 单槽字段名冲突：TUI-INPUT-BOX.md:136 = `panel._suspQueued`；宿主契约档四处 = `panel._busyQueued`（WEBVIEW-INPUT.md:20 C-B2-6 · :24 细则② · :27 细则⑤ · :145 U-I8） | TUI-INPUT-BOX §4.1 VSC 段符号收正为 `_busyQueued`（以宿主契约为准） |
| 3 | Doc contradiction | 🟡 | TUI-INPUT-BOX.md:98-99「本批零改链路，只开输入路径」与同节消费回执（:124-125——agent-turn.mjs / suspension-drive.mjs 两处新增 dim 行）相抵；:130-132「取数谓词零改」才是准确射程——按 :98 字面执行会漏两处回执落点 | :98 收窄为「取数谓词零改；消费回执两处新增 dim 行（见下）」 |
| 4 | Methodology（affected-file 注记） | 🟡 | 本批触达文件无受影响文件表（现况行数 / file:line 动作 / 预计后）：CLI `key-handler.mjs` · `index.mjs` · `agent-turn.mjs` · `suspension-drive.mjs` + 拟新增 `test/busy-injection.test.mjs`；VSC `webview/send.js` · `panel-messages.mjs` · `panel-turn-stages.mjs` · `chat-panel.mjs`——行数档位（≤500 硬限 / >300 审视）无法核（评审射程仅四档，源档不可读，注记缺失即无从抽查）；本仓先例形制 = TUI.md §6.8.3.4 | 补受影响文件表（现况 / 动作 / 预计后 + 跨文件限 + >300 审视结论），循 §6.8.3.4 形制 |
| 5 | Requirements 引文准确性 | 🟡 | TUI-INPUT-BOX.md:135 以引号引需求授权「F16「若同吞则对称修」」——F16（requirements/TUI.md:37）无此句（实勘结果已定稿、对称修为无条件射程项），引号暗示逐字 | 去伪引；改述 F16 实有对称修句，并与发现 1 一并收正 |
| 6 | Acceptance（VSC 半） | 🟡 | C-B2-6 契约无用例宿主 / 用例号；WEBVIEW-INPUT.md:157 §9 用例面四档未扩（CLI 半有 `test/busy-injection.test.mjs` T-F16-1…7——TUI-INPUT-BOX.md:192） | 指 VSC 用例宿主 + 覆盖面（queue 面 / 槽满 / digest 拒发 / 纯挂起零改 / 送达两分支） |
| 7 | Clarity（语义悬空 R7d） | 🟡 | C-B2-6 钉死本地气泡创建（`addUser`、不 setLoading 不清面板）但未钉送达时气泡生命周期（保留 ∥ 随 user-turn 回声去重——双气泡风险未决）；细则①「拒收 + 提示不覆盖」措辞歧义 | 补送达侧气泡生命周期一句（或明指与纯挂起既有路径同款） |
| 8 | Clarity | 🔵 | TUI-INPUT-BOX.md:42 §2 Enter 行无条件读「提交」；busy 覆盖面在 §4.1——键表无交叉引用 | §2 Enter 行补「busy 期 = §4.1」指针 |
| 9 | Doc hygiene | 🔵 | requirements/TUI.md 变更记录时序乱序（:92-93 后接 :96=09-16、:98=09-15、:103=09-17、:104=09-19、:105=09-21） | 恢复倒序排列 |
| 10 | Scope 限定声明 | 🔵 | 评审对象声明含「+ batch record」但 `docs/batches/2026-09-21-busy-injection.md` 不在 Documents 列表——T-F16-1…7 用例细则 / §2 授权面 / 受影响文件数值本轮不可核（limitation，不计严重度） | —— |

CLI 侧机制本身（放行判据六条 / 执行序 / 二次提交 / submit 双保险 / 送达两链 / 消费回执 / §7.5 反馈两段式 / F13-N9 豁免对齐 / Ctrl+I 零触碰）覆盖 F16 全部要求、可机判、射程克制——无补。阻塞项集中于 VSC 对称修面的跨档一致性（#1/#2）。

计数：🔴 2 · 🟡 5 · 🔵 3

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 · 修正面核验（busy-injection 设计 · round-2 verification · 评审对象状态 = 已实现）**

轮 1 修正声明核验（7 项声称修正，逐项对勘现档）：
1. TUI-INPUT-BOX §4.1 VSC 对位段三面判别式（queue = `running && !_suspended` / reject = `running && _suspended` 拒发 + toast / 纯挂起等待零改）——✅ 在位（TUI-INPUT-BOX.md:134-139），与 WEBVIEW-INPUT.md:20（C-B2-6）同构一致。
2. 槽名收正 `panel._busyQueued`——✅ 在位（TUI-INPUT-BOX.md:136；WEBVIEW-INPUT.md:20/24/27/145），无旧槽名残留。
3. 去 F16 伪引改述实句——✅ 在位（TUI-INPUT-BOX.md:135 述实句形态；需求档本体不在评审射程，内容未核）。
4. 射程句收窄（取数谓词零改 + 消费回执两处新增 dim 行）——✅ 在位（TUI-INPUT-BOX.md:98-99 / :130-132）。
5. §2 Enter 行补 §4.1 指针——✅ 在位（TUI-INPUT-BOX.md:43）。
6. TUI.md §7.5 VSC 对位行收正（普通回合 busy 面 + 机制单源回指 C-B2-6）——✅ 在位（TUI.md:609-610）。
7. WEBVIEW-INPUT C-B2-6 细则①②收正（拒收 + toast + 不覆盖 / 送达侧气泡生命周期同款）——✅ 在位（WEBVIEW-INPUT.md:23-24）。

小结：七项声称修正全部落位、彼此一致；但轮 1 修正文本自带的「挂起期全吞」断言（TUI-INPUT-BOX.md:138）与同档 §4 既有正文相抵——见发现 #1（🔴）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Consistency（机制矛盾） | 🔴 | 挂起会话 digest 期 Enter 两处相反契约：§4 Enter 条目「含 digest 运行中 → 入 pendingInput 排队续发」（TUI-INPUT-BOX.md:78-80）vs §4.1 条件 3「挂起会话内 digest 期（suspended && processing）仍吞」+ 执行序「条件 2/3 不满足 → 吞 + busy 提示（文本保留）」（:107/:113）+ 轮 1 修正句「挂起期全吞不分 digest / 用户回合」（:138）；TUI.md:129-130「挂起空闲（busy 之外）」站在吞侧。同一输入事件（挂起 digest 期 Enter）两种相反用户可见行为（清框入槽 vs 文本保留）；§4.1「挂起两态零改」的连续性声称被 §4 正文自身否定；对象已实现，档面须与落地对齐 | 以已落地实现为准对齐四处（§4 Enter 条目 / 条件 3 + 执行序 / TUI.md §4 挂起空闲 scoping / WEBVIEW-INPUT.md:20·:26 对称句）：若落地为「挂起期全吞」，收窄 §4 Enter 条目至非 busy 挂起面并删除 digest 排队续发句；若落地为「digest 期入槽排队续发」，改写条件 3 / 执行序 / 对称句（两端行为分叉时按端差纪律登记）；修正落变更记录 |
| 2 | Doc hygiene | 🟡 | §3 busy 行「Tab / 提交吞等其余 busy 门禁不变」（TUI-INPUT-BOX.md:69）——「提交吞…不变」为 §4.1 重开前的无限定残留（轮 1 修了 §2 Enter 行，§3 漏网）；在 §4.1 合格面上与执行序相反 | 将该短语限定到 §4.1 排除面（斜杠 / 空 / 模态 / 挂起 / 槽满照旧吞）或补 §4.1 指针，消除无限定的「提交吞…不变」 |
| 3 | Doc hygiene | 🟡 | WEBVIEW-INPUT C-B2-4「running → 拒发 + toast」（:18）与 U-I2（:139）保留被 C-B2-6 明示收窄前的无条件形态——C-B2-6 已声明「busy 拒发收窄为普通回合 busy 面」（:20），旧式未在原位限定（2026-09-18 用户裁定：失效表达须删除 / 原位收正） | C-B2-4 规则句限定到「running && _suspended（C-B2-6 收窄后仅此面拒发 + toast）」；U-I2 同步加收窄限定 |
| 4 | End-diff phrasing | 🔵 | TUI.md:610「与 CLI dim 行非同构，各端独立实现」——按本项目端差纪律（§6.8.2 / §8.2）「各端独立实现」✗ 不构成差异保留依据；该句读作保留依据时缺 A9 三件套（对比 §7.4:586 的登记式） | 改写为纯实现形态描述（去「非同构…各端独立实现」的保留口吻），或按 A9 登记（结构性不对称 + 证据 + 显式裁定） |
| 5 | Doc lag | 🔵 | TUI.md:539 §7.1 表「pendingInput（挂起期输入单槽）」——§4.1 后该槽有第二填充路径（busy 期），行标签口径窄于现实（「不计」裁决本身不受影响，§7.5:593 已对齐） | 行标签改为覆盖两填充面的中性表述（如「pendingInput 单槽（挂起 / busy 期）」） |
| 6 | Affected-file annotations | 🔵 | busy-injection 设计面（TUI-INPUT-BOX §4.1 / TUI.md §7.5 / WEBVIEW-INPUT C-B2-6）未见受影响文件行数 / 增量标注（key-handler / index / agent-turn / suspension-drive / render-frame / send.js / panel-messages.mjs / panel-turn-stages.mjs / chat-panel.mjs / 拟新增测试档）——源码不在评审射程无法抽查 | 确认批次档受影响文件表携行数 / 增量并做 >300 / >500 层级核对；实现已落地，行数可实测回填 |

限制说明：需求档（F16 对称句 / F13 判定句④ / F-W5）不在评审射程——需求覆盖度未核；源码未读——坐标与落地行为符合性未核；「2 项判非问题 / 1 项父侧完成」无档内 footprint 可验（预期如此）。

范围外注（不计严重度）：WEBVIEW-INPUT.md:5 头注「N-W1–N-W6」vs :152 引「N-W8」（存量悬空引用）；章节号 §7 → §9 跳号（无 §8）；:38 Ctrl+I「running 中」未限定挂起面（CLI 侧 digest-only——存量差）。

VERDICT: changes-required

计数：发现 6 条——🔴 1 / 🟡 2 / 🔵 3；轮 1 修正声明 7/7 落位核验通过。

### 轮次 3（评审子代理）

**核验范围**：§3 轮次 2 发现 1–5 + 采纳观察 #1（busy-injection 修正面；fix round id=11 = 发现 #1–#5，单点 fix id=14 = 观察 #1）。三档（TUI-INPUT-BOX.md / TUI.md / WEBVIEW-INPUT.md）全文 fresh read 逐项复核。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | R2#1 | docs/cli/design/TUI-INPUT-BOX.md §4 | 🔴 | Fixed | Enter 条目收正至真实触达窗——`:78`「**Enter（非 slash 文本）**：不入 `state.queue`、不打断后台——消息入 **`state.pendingInput` 队列**」（「含 digest 运行中」限定已删）；旧「digest 运行中排队续发」句已删；`:81` 补「**busy 期（`state.processing` 含 digest）提交先经 busy 门禁吞——本分支不触达**（触达窗 = 挂起空闲 / 释放窗口；§4.1 条件 3）。」——与 §4.1:108/:114、TUI.md:129-130、WEBVIEW-INPUT.md:20/:26 四面一致；变更记录 :320-323 在位 |
| 2 | R2#2 | docs/cli/design/TUI-INPUT-BOX.md:69 | 🟡 | Fixed | `:69`「（第 1 / 3 条的历史分支吞——不进入、不切换；Tab 吞等其余 busy 门禁不变；提交面 busy 期分流 = §4.1）。」——无限定「提交吞…不变」已去、分流指针已补 |
| 3 | R2#3 | docs/vsc/design/WEBVIEW-INPUT.md:18 / :139 | 🟡 | Fixed | `:18` C-B2-4「`S._turnState === "running" && S._suspended`（挂起会话内 busy——收窄见 C-B2-6）→ 拒发 + `showToast(…)`」；`:139` U-I2「收窄后仅存面 = 挂起会话内 busy（`running && _suspended`；普通回合 busy 面 = C-B2-6 排队）」；变更记录 :169-171 在位 |
| 4 | R2#4 | docs/cli/design/TUI.md:610 | 🔵 | Fixed | `:610`「webview 反馈 = 本地气泡（提交入槽即现 / 送达即 user 回声面——形态各端自落，语义同源）。」——「非同构…各端独立实现」保留口吻已去（取纯形态描述分支）；变更记录 :645-647 在位 |
| 5 | R2#5 | docs/cli/design/TUI.md:539 | 🔵 | Fixed | `:539`「| pendingInput 单槽（挂起 / busy 期） | 不计 | 是**用户自己的**待交接输入，非 agent 需要用户 |」——行标签覆盖两填充面；「不计」裁决与理由句零改 |
| 6 | Obs#1（id=14） | docs/cli/design/TUI-INPUT-BOX.md:82 | — | Fixed | `:82`「**斜杠命令**：挂起分流不拦截——走 submit 正常路径（纯挂起期直接执行）；busy 期（`state.processing` 含 digest）经 busy 门禁同吞——不直行 / 不排队 / 不入槽，文本保留在输入框（斜杠 busy 禁发不变——§4.1 条件 4）。」——旧 digest 期直行 / 入队排空句已删；变更记录 :325-328（轮 2 修正轮 2 · 观察 #1）在位 |
| 7 | R2#6 | 批档 §2（射程外，未读） | 🔵 | 裁不成立（维持） | 受影响文件表载体 = 批档 §2——合本仓「批次材料归批档、设计档不携行数」惯例 |

**计数**：核验 6 项（R2#1–#5 + Obs#1）＝ Fixed 6 / Unfixed 0 / 新增 🔴0 🟡0 🔵0；另 R2#6 维持裁不成立（1 项）。修正面全落、四面一致、无新 🔴。
**残留（非修正面，无严重度，不计入发现表）**：轮 2 范围外注三条未动——WEBVIEW-INPUT.md:5「N-W1–N-W6」vs §9:152 引「N-W8」；章节号 §7→§9（缺 §8）；:38 Ctrl+I 未限定挂起面。
**限制**：源码 / 需求档 / 批档不在射程——落地行为正证（测试锁 · 读码结论）与 F16 本体未复核（沿用父侧语义源声明）。
**主机引文警报复核**：轮 2「0/2」涉事引文经本轮 fresh read 比对吻合（检查器对反引号 / 跨行引用的归一化差异）——维持「误报」判定。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-21 23:36 父侧代签（用户 22:51 全自动授权射程内）**

依据 = 设计评审轮 1（§3 轮次 1 · 🔴2 🟡5 🔵3）→ 修正轮（eng-designer id=7）→ 轮 2（§3 轮次 2 · 🔴1 🟡2 🔵3）→ 修正轮 2（id=11 发现 1-5 + id=14 观察 #1）→ **轮 3（§3 轮次 3）· VERDICT: pass · 核验 6 项全 Fixed · 无剩余发现 · 修正未引入新问题**。token 已随 Approved 签发（运行态，不入档）。

**收敛表（两轮响应表 + 观察项 → 终态）**：

| 来源 | 项 | 终态 | 落点证据 |
|---|---|---|---|
| 轮 1 响应表 | #1/#2 🔴 · #3/#5/#7/#8 | ✅ Fixed | id=7 修正轮（VSC 段三面收正 / `_busyQueued` / 射程句 / 伪引改述 / 气泡生命周期 / §2 Enter 指针）——轮 2 核验 7/7 ✓ |
| 轮 1 响应表 | #4/#6 🟡 | Not an issue | 载体 = 批档 §2:47-61（受影响文件表）/ §2:59·74-77（VSC 用例宿主） |
| 轮 1 响应表 | #9 🔵 · #10 🔵 | Fixed / 限定 | #9 = 父侧直改（`requirements/TUI.md` 变更记录倒序）；#10 = 射程限定（无动作） |
| 轮 2 响应表 | #1 🔴 | ✅ Fixed | id=11——`TUI-INPUT-BOX.md:78-81`（§4 Enter 条目收正至真实触达窗；语义源 = 落地实现 + 测试锁「旧 D-S5 入队已废」） |
| 轮 2 响应表 | #2/#3 🟡 | ✅ Fixed | id=11——`:69`（提交面分流指针）/ `WEBVIEW-INPUT.md:18/:139`（C-B2-4 限定 + U-I2 注） |
| 轮 2 响应表 | #4/#5 🔵 | ✅ Fixed | id=11——`TUI.md:610`（纯形态描述）/ `:539`（行标签覆盖两填充面） |
| 轮 2 响应表 | #6 🔵 | Not an issue（维持） | 受影响文件表载体 = 批档 §2 |
| 观察 #1 | §4:82 斜杠条目 | ✅ Fixed | id=14 单点修正（digest 期经 busy 门禁同吞——旧「allowlist 直行 / 入队排空」句删除） |

**批准**：设计通过——eng-coder 实施轮放行（round=initial）；token 已签发（运行态）。红线五项：① Ctrl+I 零触碰 ② 攒批零引入（单槽语义） ③ 斜杠 busy 禁发不变 ④ 空闲/挂起 Enter 语义零改 ⑤ 不打断当前回合；送达链路取数谓词零改；F13 判据不破（零注意力色对）。实施面 = §2:47-61 受影响文件表，**另附 `index.mjs` submit busy 拒分支注释同步一行**（设计 §4.1「submit 双保险同步」——防御语义零变、纯注释）；T-F16-1…7 / T-V16-1…4 用例宿主 = §2:63-77 钉死。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-09-22——两端 F16 全落点；两端全量绿（CLI 785/785 · VSC 920/920）；审计零偏差 + 代码评审 pass（🟡2 设计悬空报父侧 · fix round 0）

**交付摘要（两端 F16 落点）**：
- CLI：`key-handler.mjs:288-318` busy 门禁改写（六判据分流三态：入槽 / 槽满拒+提示+文本保留 / 斜杠·模态·挂起吞+提示；入槽清理与挂起态分支同款）+ `:432-437` 挂起分支注释同步；`render-frame.mjs:398-403` 状态栏 queued 派生段 `已排队 1 条消息`（dim 段 · 零注意力色对 · 消费即消失）；`agent-turn.mjs:342-343`（队列 while shift 后）与 `suspension-drive.mjs:248`（driver shift 后）各补消费回执 `[sending queued message]`（C.tool）；`index.mjs:369-371` submit 防御注释净零行同步。
- VSC：`webview/send.js:27-53` 出口分流（`running && !_suspended` ⇒ 本地气泡 + `queuedUserMessage` 上行，不 setLoading 不清面板；`running && _suspended` 收窄为拒发 + toast）；`panel-messages.mjs:106-121` routeUserTurn 分流（挂起会内 busy 拒 / 普通回合 busy 入 `_busyQueued` 单槽 / 槽满拒不覆盖）+ `:174-178` `queuedUserMessage` case；`panel-turn-stages.mjs:162-210` `enterSuspensionTurn` 装载两分支（① 池 live 预填 `susp.pendingInput`；② 池空 idle 归位直接续发 `deliverBusyQueued`）；`suspension.mjs:251-256` 装载缝 `entry.pendingInput`（缺省空数组回落原行为）；`chat-panel.mjs:65-68` `_busyQueued` 初始化 + `:259-268` sendMessage 分流（细则③ 外部入口同判据同槽）。

**用例面（宿主与断言 = §2:63-77）**：T-F16-1…6 落新档 `thincoder-cli/test/busy-injection.test.mjs`（入槽 / 回合尾续发+回执 / 槽满 / 排除面四形 / driver 消费 / 状态栏机判）；T-F16-7 = `test/input-lock.test.mjs` AC-1 翻转（busy 文本提交 → 入槽）+ 既有 AC-2/释放窗口/槽满/斜杠吞零回归；T-V16-1…4 落新档 `thincoder-vscode/test/busy-injection-vsc.test.mjs`（另加 T-V16-3b = 细则② 第二分支「池空 idle 归位续发」测试锁——用例表未列，实现面同锁）。

**实测行数（实施轮读数）**：CLI `key-handler.mjs` 496 · `index.mjs` 499（净零——父侧边界补注）· `render-frame.mjs` 415 · `agent-turn.mjs` 376 · `suspension-drive.mjs` 334；VSC `chat-panel.mjs` 493 · `panel-messages.mjs` 316 · `panel-turn-stages.mjs` 210 · `suspension.mjs` 435 · `webview/send.js` 85；新测 219 / 232。全 ≤500（§2 受影响文件表「预计后」列 minor 漂移：key-handler ~490→496、chat-panel ~488→493——收口轮按实回填）。

**测试证据（命令 + 落盘日志 + 计数原文行）**：
- CLI：`cd thincoder-cli && npm test > .thincoder/tmp/bi-cli-full.log` ⇒ `ℹ tests 785 / ℹ pass 785 / ℹ fail 0`。
- VSC：`cd thincoder-vscode && npm test > .thincoder/tmp/bi-full3.log` ⇒ `ℹ tests 920 / ℹ pass 920 / ℹ fail 0`（协议登记行落档后的终态读数；落档前 `bi-full2.log` = 919/920，唯一红 = W12-1 反向机检缺 `queuedUserMessage` 登记）。

**决策透明表（实施轮裁定 / 表外改动）**：

| # | 事项 | 性质 | 理由 |
|---|---|---|---|
| 1 | `key-handler.mjs` 新增块就地压缩至 ≤500（自 506 → 496） | 纪律内微收（同档注释压缩 + `render(); return` 合行） | 该档 500 硬限（§2 跨文件限） |
| 2 | `suspension.mjs:256` 装载缝（`entry.pendingInput`；缺省零改） | 表外（§2 列表未含） | C-B2-6 细则②「预填 `susp.pendingInput`」使能——容器创建面在 `suspensionSession`，进入缝为该档既有文档化字段（`:227-228` 已载 `pendingInput?`） |
| 3 | `chat-panel.mjs:259-268` sendMessage 分流（非仅 `_busyQueued` 初始化） | 表外（§2 该行仅记 +1 初始化） | 细则③「外部入口（Ask ThinCoder 命令 / retry）经 routeUserTurn busy 分支同面分流」——原档早退会在 routeUserTurn 前拒掉，细则③落空 |
| 4 | 既有测档收正 6 处（VSC：`webview-input-enter` T-B2-5 收窄至 `running ∧ _suspended`；`webview-turnstate` ⑤⑥ + fixture 补 `paste-bar/badge`；`chat-panel-messages` ①⑦⑧；`chat-panel` ⑨；`async-parity` T-D10；`test/files.mjs` 新档登记） | 表外（语义变更连带） | C-B2-6 收窄 busy 拒发面 + 普通回合 busy 改排队 ⇒ 旧断言所锁 face 已不存在；不改即红 |
| 5 | 排队项图片走 `savePastedImages`（入槽时落盘）后随送达直发——不触发 F-1 非视觉降级分支 | 设计悬空（评审判 🟡 非阻塞） | 送达两分支直呼 `runChat`（绕 `routeUserTurn:140` 降级段）；设计 C-B2-6 未涉 images 面——如实报父侧裁定，不自行发明 |
| 6 | webview 无单槽守卫（二次 busy 提交：气泡已上屏 + host 拒收 + 输入框已清） | 设计悬空（评审判 🟡 非阻塞） | 细则① 只钉 host 侧「拒收 + toast；不覆盖」；webview 侧回滚/守卫未钉——如实报父侧裁定，不自行发明 |

**审计与代码评审（终态）**：① 内部 explore 偏差审计（read-only，对照三档设计 + §2 任务书 + 红线五项）＝**四类偏差零发现**（部分实施 / 静默简化 / 档漂移 / 表外未披露）。② 内部 advisor 代码评审（13 档射程 + 4 档验收源）＝**VERDICT: pass**；发现 = 🔴 0 · 🟡 2（均为「设计未钉面」的语义悬空——webview 单槽守卫 / 排队面视觉降级——评审判非阻塞、报父侧裁定）· 🔵 3（>300 行档位债 / §2 行数漂移 / 新测墙钟等待）。③ **fix round = 0**（无必修项；🟡 两项性质为设计悬空，不自行发明交互）。④ 协议登记时序：`queuedUserMessage` 由 eng-designer 补落（`WEBVIEW-PROTOCOL.md` §3.2 行 16 + §13 行）；补落前反向机检 W12-1 红为已知时序（父侧裁定：设计面登记，实施轮零触碰设计档）。

**fix 轮记录（2026-09-22 · 父侧裁定两项 🟡 并入闭口）**

**状态行**：fix 轮实施完成——两 🟡 全落点（webview 二次提交守卫 / 送达侧贴图降级对位）；VSC 全量绿 **923/923/0**（920 基线 + T-V16-5/6/5b）；审计 divergent（两 🟡 均记录面）→ 代码评审轮 1 pass（🟡2 非阻塞 + 🔵2）→ fix 轮 1 轮补收敛 → 评审轮 2 pass（🔵1 残余报父侧）；CLI 零改 · `chat-panel.mjs` 零改 · 五红线零触

**交付摘要（按 §2:97-153 八项 + 裁定 ⑨ 逐项 · file:line = 现态实测）**：
- ① `webview/send.js:30-38`：busy 队列分支前插守卫（判据 `running && !_suspended && S._busyQueuedPending` ⇒ 不出泡 / 不清框 + `showToast(t("input.slotFull"))`）+ `:38` 受理即本地先行置位（防同 tick 二连 Enter）。
- ② `webview/state.js:124`：`_busyQueuedPending` 镜像字段（注 `:121-123`）。
- ③ `webview/chat.js:200`：`case "busyQueued"` ⇒ `S._busyQueuedPending = m.pending === true`。
- ④ `src/extension/panel-messages.mjs`：`pushBusyQueued` 导出 `:100-102`；推送点 = 入槽 `:134` / 忙分支判决（拒收 ⇒ 实际占用）`:126` / `webviewReady` 握手重推 `:284` / **归位受理收敛 `:164`（fix 轮补——评审 🟡#1）**；F-1 段抽出（`:142-159` 改调 `downgradeNonVisionImages`；import `:25` 只余 `savePastedImages`/判决函数）；入槽项携 `fromBusyQueue` + `visionReader` per-call 缝 `:131-133`。
- ⑤ `src/extension/panel-turn-stages.mjs`：装载① splice 消费点推 `pending:false` `:195` + `runTurn` 闭包来源标记支降级 `:178-191`；装载② `deliverBusyQueued` shift 消费点推 `pending:false` `:229` + 降级接点 `:230`（「先置 running 再 await」由判决函数落实——`image-handler.mjs:111` 先于 `:122` await）。
- ⑥ `src/extension/image-handler.mjs:109-129`：`downgradeNonVisionImages`（自 `panel-messages.mjs:140-157` 抽出；`visionReader ?? runVisionReader` 缺省回落生产；`_turnState !== "susp"` 才置 running——装载① 窗内无 Stop 面；`panel._visionAbort` + `_abortRequested` 置位序 = 调 runChat 之后随迁）；imports `:28-29`。
- ⑦ `test/busy-injection-vsc.test.mjs`：T-V16-5 `:122-150` · T-V16-6 `:280-333` · **T-V16-5b `:335-350`（fix 轮补锁收敛）**；夹具复位面 `:62` 补镜像；夹具升级全量 index.html id 组 + 真 `chat.js` 模块图 `:31-35`（先例 `workspace-guard.test.mjs`）。
- ⑧ `locales/zh.json:13-14` · `en.json:13-14`：新增键 `input.slotFull`（逐字 = 协议 §6.3）+ `input.busyPlaceholder` 值级改（zh「主会话处理中——Enter 提交受限——可继续输入」/ en「Main session busy — Enter submit is restricted — you can keep typing」——父侧 E① 裁定并入；en 存量中文拷贝缺陷同笔收正）。
- ⑨（父侧裁定 · 并入本轮）`docs/vsc/design/WEBVIEW-PROTOCOL.md:365`：§12 `busyQueued` 行 ②③ 列按 `--emit` 收正（`src/extension/panel-messages.mjs:101` / `webview/chat.js:200`）+ 行内「计划落点 / 行号待实施轮重出」措辞原位收正；**其余行零动**。
- 表外随面收正（理由随行）：`test/chat-panel-messages.test.mjs:74`（① 行断言改 `busyQueued` 回执面——新可观测量，不改即红）· `test/webview-turnstate.test.mjs:72`（`resetBusy` 补镜像复位）。

**用例名 + 测试读数（日志落盘 `.thincoder/tmp/`）**：
- VSC 全量 `npm test`：`bi-fix-final.log` ⇒ `ℹ tests 923 / ℹ pass 923 / ℹ fail 0`；前序 `bi-fix-full2.log` = 922/922/0；首跑 `bi-fix-full.log` = 3 红（chat-panel-messages ① / session-boot ⑪ 握手序 / webview-turnstate ⑥ 夹具复位），全数收正后复跑转绿。
- 单档：`node --test test/busy-injection-vsc.test.mjs` ⇒ 10/10（T-V16-1/2/3/3b/4a/4b/4c/5/5b/6）；`test/image-downgrade.test.mjs` ⇒ 15/15（F-1 抽出零回归）；协议门两档 ⇒ 7/7；`--emit` 收面提取集 53（全 `活`）。
- ⑧ 读回（zh/en 逐字）：`input.slotFull` = 「主会话处理中——已有一条消息待发送，请等其处理完成后再发送」/「Task running — one message is already queued; wait for it to be sent before submitting again.」；`input.busyPlaceholder` = 「主会话处理中——Enter 提交受限——可继续输入」/「Main session busy — Enter submit is restricted — you can keep typing」（两档 265 键同集）。

**审计与代码评审（终态）**：① 内部 explore 偏差审计（只读）：部分实施 1 🟡（§5 fix 轮记录未落 = 本段补齐）· 静默简化零发现 · 档漂移 1 🟡（locale 值级改的设计/协议档面同步缺口——本席禁列域外，报父侧）· 表外未披露零发现 ⇒ `divergent`（两项均记录面）。② advisor 代码评审轮 1：`VERDICT: pass`——🟡2（归位路径镜像不收敛窄竞态 / `test/chat-panel-messages.test.mjs` 522 行 >500 存量债）+ 🔵2（>300 档位线 / 测档墙钟 settle）。③ fix 轮 1 轮（评审 🟡#1 建议：补收敛一行 + 锁测）→ 评审轮 2（核验修复声明）：`VERDICT: pass`——三项声明全核（源码行 / T-V16-5b / 923 读数 + `--emit` 坐标）；新增 🔵1 = 收敛点位于降级 await 之后的窄窗残余（非阻塞 · 报父侧）。④ **终态 = clean**（fix round = 1）。

**边界确认**：五红线零触碰（Ctrl+I 面 `webview/input.js` mtime 2026-09-13 / CLI `key-handler.mjs:176-183` 单侧登记零动；攒批零引入——单槽语义；斜杠 busy 禁发零动；空闲/挂起 Enter 语义零动；零 abort/interrupt 引入——入槽仅内存操作）。`chat-panel.mjs` 零改（mtime 16:01 < 本轮写盘窗 16:29–16:44）。CLI 源/测零改（`thincoder-cli/src/tui` 全目录 ≤ 15:58 < 本轮窗）。设计档 / 需求档 / 批档 §1–§4 零触碰（唯协议档单行 = 裁定 ⑨）。

**决策透明表（fix 轮）**：

| # | 事项 | 性质 | 理由 |
|---|---|---|---|
| 1 | `panel-messages.mjs:164` 归位受理路径补 `pushBusyQueued(panel)` | 表外（§2 未列第五推送点） | 评审轮 1 🟡#1：镜像本地先行置位后落归位路径零推送 ⇒ 黏滞 true 至 Reload（判据源不变式「host 推送权威收敛」不留死角）；幂等（推槽内实况），链测 T-V16-5b |
| 2 | 测档夹具升级（全量 index.html id + 真 `chat.js` 模块图） | 表外（夹具面） | T-V16-5 需真 `case "busyQueued"` 驱动（先例 `workspace-guard.test.mjs` 15/16 组）；全量夹具为小夹具超集——既有断言面零改 |
| 3 | 既有测档两处随面收正（`chat-panel-messages:74` / `webview-turnstate:72`） | 表外（语义变更连带） | 新推送点 + 新镜像字段 ⇒ 旧断言面已不存在；不改即红（首跑三红复现） |
| 4 | ⑧ locale 值级改的档面同步缺口（协议 §6.3 无 `input.busyPlaceholder` 行 / 批档 §2 观察 ① 仍引旧值） | 域外（设计/协议档 = eng-designer） | 本席禁列零触碰；报告面披露，父侧收口轮处置 |
| 5 | 收敛点位于降级 await 之后（带图消息落归位路径时镜像复位延迟 ≤60s 窗） | 残余（评审轮 2 🔵 · 非阻塞） | 建议（可选）：推送提至归位路径入口即连同 workspace 早退口一并覆盖；本轮按非阻塞不强制 |

## §6 验证与收口（父代理）

### 收口记录（主 agent · 2026-09-22）

**验收读数（父侧在盘复核——日志文件实读）**
- CLI 全量：`tests 785 / pass 785 / fail 0`（`thincoder-cli/.thincoder/tmp/bi-cli-full.log`）。
- VSC 全量：`tests 923 / pass 923 / fail 0`（`thincoder-vscode/.thincoder/tmp/bi-fix-final.log`）；演进链在档：9 红（登记 / 实现前）→ 1 红（待协议登记）→ `920/920/0`（登记后）→ 修轮窗 3 红 → `922/922/0` → `923/923/0`。
- 单档：`busy-injection.test.mjs` 13/13 · `busy-injection-vsc.test.mjs` 10/10 · `image-downgrade.test.mjs` 15/15 · 协议门两档 7/7。
- 红线五项（Ctrl+I · 攒批 · 斜杠 busy 禁发 · 空闲 / 挂起 Enter · 不打断）：零触碰——写盘窗对照证据在 §5 在档。

**裁决（逐条）**
- 实施轮 🟡①（webview 二次提交：气泡上屏 + 清框 + host 拒收）：**并入本批**——端差默认 = 消；设计修正（细则① 扩守卫 + `busyQueued` 握手信号）→ 修轮落地（判据 / 镜像 / 推送点 / 握手重推全落）。
- 实施轮 🟡②（排队项携贴图直呼旁路、绕非视觉降级）：**并入本批**——细则⑥（判决函数自成文抽出 + 三调用点对位；两分支用例 T-V16-6 锁定）。
- 协议登记轮（`queuedUserMessage` + `busyQueued` 两消息）：**收下**——§3.2 十六 / 十七项、§13 行、§12 行、§6.3 二十键；双向机检 7/7 绿（W12-1 转绿）。
- 设计修正观察 E①（占位符文案与本批新行为相抵）：**父侧裁定并入修轮**——`input.busyPlaceholder` 值级改（zh / en；en 存量中文拷贝缺陷同笔收正）；键不拆、代码零改、测试零 churn。
- 修轮链 🔵1（归位路径镜像复位延迟 ≤ 读图窗——窗内守卫短暂按槽满拒；文本保留 · 无损失 · 非黏滞）：**接受 + 入册台账 #221**（零残窗改法 = 收敛点前移至归位路径入口，随该面下次触碰）。
- 修轮残留 2（§6.3 键登记 / §2 旧值引用）：**本项为准**——§2「占位符零改」表述已被本批修轮覆盖（记录面历史性保留）；§6.3 表 = 对位冻结面（收录口径在档），本轮零新增对位键（`input.slotFull` 已同轮登记）⇒ `input.busyPlaceholder` 值级改**无登记义务**。
- 修轮残留 3（`chat-panel-messages.test.mjs` 522 行 > 500 硬限）：**已越限**——台账 #169 更新（下批触碰前必拆）。
- 实施轮表外改动四条（`suspension.mjs` 装载缝 / `chat-panel.mjs` 分流 / 6 既有测档收正 / `files.mjs` 登记）：**接受**（细则②③ 的必要面，披露在档）。
- §2 数值回填（`key-handler.mjs` 496 · `chat-panel.mjs` 493）+ T-V16-5b 补锁：在册。

**决议**
- 端差面：webview 守卫对位 CLI「文本保留」形（端差消）；`input.slotFull` 新键为端面成文（CLI 同判据提示 = 端内字面）。
- 坐标面：协议 §12 `busyQueued` 行 ②③ 列按 `--emit` 实测收正（其余行零动）；§13 `queuedUserMessage` 行 ② 列位移不入机检、归 #218 全表重出。
- 需求面 F16 判定句：二次提交行为交设计裁定 ⇒ 设计侧落定，需求档零缺口零改（设计修正轮 F 项在档）。

**遗留（各带处置）**
- E② 冷启缺口（Reload 于挂起会话内 digest 期 ⇒ `_suspended` 无重推、提交被 host 拒）⇒ 台账 #219（归批）。
- 协议 §12 / §13 ②③ 列存量漂移 ⇒ 台账 #218；`§17` 悬空族 ⇒ #220；`chat-panel-messages.test.mjs` 越限 ⇒ #169 更新。

**结算依据**：§5 两块（实施轮 + fix 轮）· §3（评审轮次在档）· §4（批准）· 提交 = 本批提交（推 `origin/main`）· 台账 #213。
