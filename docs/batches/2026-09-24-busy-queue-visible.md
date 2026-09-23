# 2026-09-24 · busy 排队注入的会话流可见性（queue UI 恢复 + 消费转正）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-24 · 来源 = 用户 2026-09-24 02:46「反正在会话流中我是看不到我插入的内容的」+ 02:48/02:50 细化与锁定 + 02:52「可以。你走设计链吧」（批准立批）。
> 台账 = #249（busy-queue-visible · 归批）。前情 = docs/batches/2026-09-21-busy-injection.md §6（已收口 2026-09-22——busy 排队机制已交付；本批 = 其可视性补全批）。
## §1 讨论（主 agent）
**状态行**：进行中（§4 父侧代签（03:48）→ 实施轮（eng-coder）已派发——三条件齐备（评审轮 2 pass · 修正 #16 核验 · token））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-24 02:46–02:52 · 需求锁定后立批）**

### 1.1 目标与理由

**现状落差**：busy 排队注入机制三层全链在位（入槽 / 送达 / 反馈——§1.3 实读证据），但**唯一的用户可见反馈藏在状态栏 dim 段一行小字里**；**会话流中**——**提交侧零痕迹**（只有清框），消费侧只有 `[sending queued message]` 系统回执。用户连续两次直觉（"似乎没实现" → "看不到我插入的内容"）都指向同一真缺陷：**排队期间不可见**。
**用户需求（02:48 / 02:50 锁定）**：① 队列机制**保留**（提交先挂队——"就像以前一样"）；② **排队期间在会话流可见**（"待发送"态消息，含用户原文——"原来队列不就是这样的吗"）；③ **消费时**：出队 + 排队态清除 + **消息转正**（成为正常用户消息继续会话）。

### 1.2 史实与线索（designer 调研起点）

- **"原来队列"** = INPUT-LOCK-ASYNC 时代（2026-09-09 之前）的 **queue UI**——该批把「排队机制（pendingInput / R15 攒批 / queue UI）」整体废弃（改 busy 禁输入）；**#213 busy-injection**（2026-09-21/22）恢复了排队机制与送达链路，**未恢复 queue UI** ⇒ 本需求 = **UI 补回**。
- 调研线索：`docs/cli/design/_archive/INPUT-LOCK-ASYNC.md`（废弃记录——含被废弃的 queue UI 形态线索）· `docs/batches/2026-09-21-busy-injection.md`（现机制整链 + 当时的「对话流提示行」否决记录与理由）· `docs/cli/requirements/TUI.md` F16 面 · TUI-INPUT-BOX 面（输入盒）。

### 1.3 现状实读（2026-09-24 父侧核查 · 逐处证据）

| 层 | 落点 | 行为 |
|---|---|---|
| 入槽 | `thincoder-cli/src/tui/key-handler-busy.mjs`（43 行） | busy（含 digest）Enter → 清框 + `state.pendingInput.push(text)` 单槽 + `_suspWake`；四吞面（模态 / 斜杠 / 空 / **槽满**）均吞+提示、文本保留 |
| 送达 | `thincoder-cli/src/tui/agent-turn.mjs:330-364` | 回合尾 drain（池空兜底 `:334-336`；`while (queue.length && !processing)` 逐条直发 `:341-353`——消费回执 `[sending queued message]` `:344`）；池 live → 挂起驱动 `:358-364` |
| 反馈 | `thincoder-cli/src/tui/render-frame.mjs:401-405` | 状态栏三态：单槽已填「已排队 1 条消息」（dim）/ 挂起态 / 普通 busy |
| VSC 对称面 | `thincoder-vscode`（send.js / panel-messages.mjs / `_busyQueued` 单槽） | 同判语义（#213 批） |

### 1.4 需求要点

1. **排队期可见（核心）**：提交后**会话流中出现一条"待发送"态消息**（渲染含用户原文；与正常用户消息的视觉区分 = 设计细化——排队态须可辨且不误导为"已发送"）。
2. **消费转正**：回合能处理时（消费时机**不变**——回合尾 drain / 挂起驱动）→ 该消息**转正**（排队态消失 → 成为正常用户消息；视觉切换须即时、无跳变错位）。
3. **队列语义保留**：单槽现状保留（槽满拒绝 + 提示不变）；**条宽（单槽 vs 多槽）= 设计裁定**（用户措辞"队列"未定条数——现状单槽；扩多槽须评估四吞面与 drain 面连带）。
4. **双端对称**：CLI（TUI）∥ VSC（webview）各自实现、语义同源。
5. **零丢失不回退**：现送达链路（#213 已验 785/785）**不改谓词**；本批 = 呈现层追加。

### 1.5 授权与边界

- 用户 02:52「可以。你走设计链吧」= 立批放行（设计 → 评审 → 批准 → 实施常规全链）。
- **边界**：不改消费链谓词（drain/挂起驱动零改）· 不改输入门禁四吞面行为（除设计裁定槽宽连带）· 不碰子代理排队可见性（`QUEUED-VISIBILITY` 另面——勿混）· 不改核（仅 CLI + VSC 两端呈现面）。

### 1.6 验收标准（需求层——设计细化）

| # | 判据 |
|---|---|
| AC-1 | 排队期间：会话流可见该消息（"待发送"态 + 原文）——CLI + VSC 双端 |
| AC-2 | 消费时：排队态清除 + 消息转正（成为正常用户消息；视觉切换即时） |
| AC-3 | 零丢失不回退（现送达链路行为零改——回归测试锁） |
| AC-4 | 排队态视觉不得误导为"已发送"（区分度 = 设计定） |
| AC-5 | 槽满 / 四吞面行为与现状一致（除槽宽裁定连带） |

### 1.7 关键裁定点（设计轮）

排队态渲染落位（流尾 / 输入区上方 / 其他）· 排队态视觉形态（样式/标记/与正常消息的区分）· 槽宽（单槽保留 vs 多槽）· 消费切换的渲染时序（排队态 → 正常态无闪烁）· 挂起态（suspension）下排队消息的呈现是否同构 · VSC 面等价物（webview 消息模型）。

### 1.8 用户实验记录（2026-09-24 02:57–02:59 · 一手体验证据）

**实验设置**：父侧开 100 秒 busy 窗口（execute 长轮询 02:57:44–02:59:24）——用户于窗口内提交（其消息经排队 → 回合尾消费送达父侧，闭环成立）。

**用户观察（原话）**：「现在还是在会话结束后才sending queued message，但是我输入的时候会话还没执行完。」

**解读（与 §1.3 实读逐条对上）**：① 输入时机 = 父侧确实 busy（processing）⇒ **排队路径成立**（本次实验为唯一一次确认走队列的实例）；② **排队期间会话流不可见**——再次实证；③ 可见信号只在**消费时**出现（`[sending queued message]` + 消息以新回合进场）——**正是本批要补的盲区**（提交侧可见性）。

**待补观察**：状态栏那行「已排队 1 条消息」在排队期间是否可见 / 是否被用户注意到（有 / 无 / 没注意——= §1.7-② 排队态视觉形态裁定的用户侧输入）。

### 1.9 用户实验记录 · 补全（2026-09-24 03:00）

**用户原话**：「状态栏我是看到有1条消息排队，第二条就发不出去了。」

**解读**：① **状态栏反馈可见性 = 有**（「已排队 1 条消息」被用户注意到——§1.8 待补观察项闭合；对照意义 = 现状反馈并非完全不可见，但位于**会话流主视野之外**的 dim 小字，且信息量仅"有 1 条"，不含内容本身）；② **单槽满行为观察**——第二条被拒（现状设计：拒收 + 提示 + 文本保留），用户以"发不出去"表述 ⇒ **多槽倾向的首次用户输入**（§1.4-3 裁定点的用户侧证据：与 02:48「挂在队列中」共同指向**多槽期望**——父亲待用户确认后注入设计轮）。

### 1.10 需求裁定 · 多槽 + 合并消费（2026-09-24 03:01 · 用户）

**用户原话**：「对呀，肯定是需要多条啊！我认为多条应该被合并成一条一次被消费。」

**裁定**：① **多槽**（≥2 条可排队——上限 = 设计裁定）；② **合并消费**——排队多条在消费时**合并为一条**、**一次消费**（一个回合处理；替代现状的逐条续发多回合）。

**史实对齐（关键）**：用户记忆的「以前队列」= **pendingInput + R15 攒批 + queue UI** 三件套（INPUT-LOCK-ASYNC 时期被整体废弃者）——本条确认 **R15 攒批（合并消费）也在需求内**（不只是 queue UI）；设计须一并恢复（旧形态可调研 INPUT-LOCK 档）。
**连带修订**：① §1.5 边界「不改消费链谓词」**按本裁定解除**（`agent-turn.mjs` drain 逐条循环 ⇒ 合并单发属本批范围）；② 合并格式（多条原文拼接形态 = 设计裁定）；③ 槽上限与满槽面（拒收阈值/提示 = 设计裁定）；④ VSC 对称面同受。

### 1.11 需求收正 · 消费时机 = 当前 turn（步）边界（2026-09-24 03:06 · 用户纠正）

**用户原话**：「不不不不，你这个是扭曲了我的意思，**排队不是等整个回合执行结束以后才消费，而是等当前 turn 结束以后就要消费**，跟 ctrl+i 的区别是 ctrl+i 会**中断当前回合后续跑**。」

**收正**：消费时机 = **当前 turn 结束**（**步边界**——agent loop 的当前一步做完即 pickup）**而非**整个回合（多步工具链跑完）。三语义对位：

| 通道 | 生效点 | 中断性 |
|---|---|---|
| **排队（本批）** | **当前 turn 结束**（步边界） | **不中断**（优雅 pickup，下一步生效） |
| Ctrl+I | 立即 | **中断当前回合** + 续跑（`[User interrupt:]`） |

**现状实证（父侧 grep 全仓 · 消费点全在回合级）**：`pendingInput` 读点 = `thincoder-cli/src/tui/agent-turn.mjs:333`（普通回合**尾**兜底转 queue）· `suspension-drive.mjs:236`（挂起 driver 唤醒级）——**无 turn / 步级 pickup**（核 loop 不读会话队列）⇒ 用户观察「几次都是执行完了才消费」= 现状确凿；历史测试亦以「**轮末**自动开新回合」为判据（`.thincoder/tmp/old-cli-susp-test.mjs` T-S9）。

**含义**：本批消费面 = **新增 turn 级 pickup 机制**（核 loop × 会话层的步边界检查——落法由设计轮评估：核暴露步回调 / CLI 侧包装 / 其他）；§1.5 边界再修订——**核面配合（step 钩子）属本批范围**。

### 1.12 对位模型确认（2026-09-24 03:09 · 用户）

**用户原话**：「其实我希望实现的是主 agent 向子 agent 执行中投送一样，让用户也能向主 agent 在执行中投送新指令。」

**对位（机制参照系 = 既有 `subagent action:'send'`）**：子代理投送的既有行为契约 = 「message **queues** and the child **consumes it at its next turn boundary** as an **ordinary user instruction**（**non-interrupting** — its current tool finishes first）」——本批 = **该机制的主体反置**：用户 → 主会话的同款通道（排队 + 下一 turn 边界消费 + 非中断）。实现参照 = 核内子代理投送机制（现有；主会话侧缺失）——设计轮调研其落点并给主会话接线方案（**优先复用核既有件**）。

### 1.13 用词收正（2026-09-24 03:11 · 父侧）——「主体反置」作废

父侧在 §1.12 以「主体反置」概括，属**用词错误**（用户当即质疑：「我什么时候说过…这个机制怎么叫反置？」）。**正确表述**：本批 = **新增「用户 → 主会话」投送通道**，其**行为契约**（不中断 / turn 边界消费 / 当普通用户指令生效）**参照**「主 agent → 子 agent」`send` 的既有语义。**「参照」≠「改造」**：**主 agent → 子 agent 的 send 机制零触碰**——本批不改其代码 / 文档 / 行为，它只是参照系。

### 1.14 上抛状态收正（父侧 · 2026-09-24 03:2x）

#12 设计轮上抛①所述「需求档未落 ⇒ 链不闭合」**已过时**：`docs/cli/requirements/TUI.md:37` F16 已按 03:01 / 03:06 两轮裁定改写（容量 8 / 步边界 pickup / 合并消费 / 四态）——**链已闭**；评审 #4（F16 四态枚举）父侧当场收正（「队满」→「队列非空」+ 队满面另述）。**余项**：需求档变更记录补登 = 父侧自办（评审 🔵 #10）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（含需求裁定升级轮（多槽容量 8 + 合并消费 R15 恢复）+ 步边界 pickup fix 轮 + 设计评审修正轮 1（13 项逐条落地；#4 / #10 = 需求档父侧自办））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批任务与设计档落点（三链同源——批 §2 条目 = 设计验收条 = 需求判定句）**：

| # | 面 | 设计落点（就地更新——零新档） |
|---|---|---|
| QV-A | 排队期会话流可见（CLI） | `docs/cli/design/TUI.md` **§7.5**（反馈面改三段式：提交时 / **排队期·待发送块** / 消费时——落位 / 形态逐字 / 上限 / 缓存键 / 跟随 / 消费转正 / 边界全条）+ `docs/cli/design/TUI-INPUT-BOX.md` **§4.1**（执行序入槽步补恢复跟随两行 + 新增「排队期呈现与消费转正」段） |
| QV-B | 双端对称（VSC） | `docs/vsc/design/WEBVIEW-INPUT.md` §1 **C-B2-6 细则⑦**（待发送态——锚定三支 / 消费即清 / 边界）+ §7 U-I8 + §9 用例面；协议面 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §3 `busyQueued` 行 + §3.2 行 17（**增字段 `text`**——计数零变）+ §6.3 键表 20 → 21 键（`queued.pending`）+ §12 行 ⑤ 备注 |
| QV-C | 零改声明（红线） | 消费链谓词 / 槽宽（单槽）/ 吞面四 / 子代理排队可见性（`QUEUED-VISIBILITY` 面）/ 核（`thincoder-core`）/ Ctrl+I / `_pasting` —— 全部零触碰（见下「零改对照」） |

**设计要点④：六裁定点逐条结论 + 被否候选**

1. **排队态渲染落位 = 会话流尾「待发送块」（渲染帧稳定尾插槽）**——派生行（`buildConvLines`，渲染序在 `state.streaming` 之后）。
   被否：① 原位写入 `state.lines`（提交点插入）——流式每帧增长把该行顶出视口 + 需生命周期簿记（两处消费编辑点 + 行 diff 键漂移）；② 输入区上方固定条（独立面板）——转正位置跳变（条内消失 / 流内出现，违 AC-2「无错位」）+ 新增面板入布局压缩链成本；③ 仅状态栏（现状）——不满足 AC-1「会话流可见 + 原文」。
2. **排队态视觉形态 = 标签行 `⏳ 待发送 · 回合结束后自动发送`（`C.warn`）+ 原文行（`C.dim`，≤5 行 + 超限尾标记）+ 块前空行**。
   被否：① `❯ You:` 标签变体（仅加注）——易读作已发送（违 AC-4）；② 无标签纯 dim 行（如 `[queued]`）——与既有 dim 系统行（`[sending queued message]` / `[continuing…]`）混淆、丢「用户原文」语义。
3. **槽宽 = 单槽保留（零改）**。
   被否：多槽（N 槽排队）——连带改输入门禁条件 5（槽满判据）+ 四吞面（槽满提示语义）+ 送达侧逐条消费语义 ⇒ 犯「消费链谓词零改」红线；R15 攒批撤销裁定不翻；用户本批未提容量诉求（措辞「队列」= 记忆中的旧 queue UI 形态，非容量）。**如需扩容 ⇒ 另开批次**（本设计的待发送块渲染天然可按条数扩展）。
4. **消费切换时序 = 单帧切换**——两消费点 shift 与「回执 + `❯ You:` + 原文」落 `state.lines` 在同一同步段（`agent-turn.mjs:84-87`）⇒ 渲染帧合并调度（`render-loop.mjs:38-56`——nextTick + 16ms 节流）只出**一帧**：标签行位置换为回执行、原文行 dim → 正文色（位置与文本零变——无空窗 / 无重复 / 无跳变）。
   被否：① 出队后延迟一帧落回声（合并调度已天然保证，多余）；② 保留排队块至回声落地（同文重复显示）。
5. **挂起态（suspension / digest）呈现 = 同构**——待发送块判据 = 单槽非空，与 `suspended` / `processing` 无关（busy 提交与挂起空闲提交**共槽** ⇒ 同块同界面；digest / 会话内回合期亦同）。
   被否：挂起态另起形态（同槽同语义，无理由；且另形态 = 端内两套渲染）。
6. **VSC 面等价物 = 既有 user 气泡 + `pending` 标记**（标签行换 `⏳ ${t("queued.pending")}`；气泡原文照常显示；类 `pending` 落 DOM = 机检把手；**零新 CSS**）。
   锚定三支（判据源 = host 单槽快照 `busyQueued { pending, text }`——`text` = 槽内项原文，`pending:true` 恒携）：① 本地提交出泡即标记；② 快照受理且本地无标记 ⇒ 按原文（`data-raw`）匹配最后一条同文气泡就地标记；③ 无同文气泡 ⇒ 流尾新建（覆盖 Reload 冷启 / retry 等无回显入口）。清除 = 四个消费点推 `pending:false`（driver 步骤 1 / 装载① splice / 装载② shift / **会话退出残余直发循环**——第四点本批补推）+ `webviewReady` 握手重推（幂等快照）。
   被否：① 新起「排队条」UI 区（与 webview 既有气泡载体重复、且与 CLI 形态分叉无据）；② 纯文本系统行（丢「这是用户消息」语义）。

**对流式共存方案的正面回应（旧否决理由的处置 · 设计要点②）**

旧否决对象 = 「**提交时把排队行写入 `state.lines`（原位插入）**」，其两条依据 = ① 流式输出每帧刷新把该行顶出视口；② 落 `state.lines` 需生命周期簿记。
本批选形（会话流尾**渲染帧插槽**）对两条依据的处置：
- ① **不成立**——派生块渲染在 `state.streaming` **之后**：流在块**上方**增长，块恒居会话区底；跟随开启时排队期全程可见（F1 / F4 语义）。「顶走」只对「原位插入」成立（原位插入的行会在后续流式增长中被推离视口），本批不取该形。
- ② **不成立**——载体 = 派生（判据 = 单槽非空，渲染期现算）：零 `state.lines` 写入 ⇒ 零编辑点、零行 diff 键、零字符账影响；消费 / 中止即随判据消失。
配套：`convCacheKey` 增排队签名（漏挂 ⇒ 缓存命中出陈旧帧）；原文行色选 `C.dim` 且**标签行（`C.warn`）置于块首**——dim 连跑上界 = 5 原文行 + 1 尾标记 = 6 ≤ 既有连 dim 折叠阈值（8）⇒ 永不被折进「tool output」折叠块（消掉「消息被折走不可见」的次生风险）。

**零改对照（红线五项）**

| 红线 | 状态 | 依据（设计档在档句） |
|---|---|---|
| 消费链谓词零改（drain / 挂起驱动） | ✅ 零触碰 | 两消费点 shift 取数语义零变（`TUI-INPUT-BOX.md` §4.1「送达链路（零改声明）」段零改）；本批只在消费**之后**的呈现面派生 |
| 四吞面行为不变（模态 / 斜杠 / 空 / 槽满） | ✅ 零触碰 | 槽宽 = 单槽；执行序吞判三步零改（`TUI-INPUT-BOX.md` §4.1 执行序段） |
| 子代理排队可见性（`QUEUED-VISIBILITY` 另面） | ✅ 零触碰 | 本批对象 = 主会话 `pendingInput` 单槽（子代理面板 / 块头 ⏹ 族零改） |
| 核（`thincoder-core`）零改 | ✅ 零触碰 | 无核侧文件入表；绑定链零接触 |
| Ctrl+I / `_pasting` / 非 busy Enter 语义零改 | ✅ 零触碰 | `TUI-INPUT-BOX.md` §4.1 边界段零改 |

**受影响文件表（含行数预算——实施轮按实回填）**

CLI：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| CLI·源 | `thincoder-cli/src/tui/render-conversation.mjs` | 425 | `buildConvLines` 尾插槽派生块（标签 + 原文 ≤5 + 尾标记；行置 `_kind` 防长消息折叠）+ cache key 排队签名 + 常量 `QUEUED_BLOCK_MAX_LINES` | ~455 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-busy.mjs` | 43 | 入槽分支 +2（恢复跟随两行） | ~45 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-edit.mjs` | 116 | 挂起态入槽分支 +2（同款两行） | ~118 |
| CLI·测 | `thincoder-cli/test/busy-injection.test.mjs` | 282 | 本批新增用例（排队块 / 上限 / 跟随 / 消费单帧 / 空槽负向锁） | ~360 |

VSC：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| VSC·源 | `thincoder-vscode/webview/queued-mark.js`（拟新增） | — | 待发送标记模块（锚定三支 / 消费即清 / 引用失效守卫 / 标签读写） | ~45 |
| VSC·源 | `thincoder-vscode/webview/send.js` | 87 | busy 分支出泡即标记（+2） | ~89 |
| VSC·源 | `thincoder-vscode/webview/ui.js` | 491 | `buildUserMessage` 写 `data-raw` / `data-ts`；`addUser` 返 el（+3——**保持 <500**） | ~494 |
| VSC·源 | `thincoder-vscode/webview/chat-messages.js` | 235 | `case "busyQueued"` 增锚定调用（+2） | ~237 |
| VSC·源 | `thincoder-vscode/webview/state.js` | 127 | `S._pendingEl` 字段（+1） | ~128 |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 338 | `pushBusyQueued` 携槽内项原文（两载体 head——+4） | ~342 |
| VSC·源 | `thincoder-vscode/src/extension/suspension.mjs` | 435 | 会话退出残余直发循环 shift 后补推 `pushBusyQueued`（+3——动态 import 同先例） | ~438 |
| VSC·文案 | `thincoder-vscode/locales/{zh,en}.json` | 268 / 268 | 各 +1 键 `queued.pending`（逐字见协议档 §6.3） | 269 / 269 |
| VSC·测 | `thincoder-vscode/test/queue-visible-vsc.test.mjs`（拟新增） | — | 细则⑦ 面用例（锚定三支 / 消费即清 / Reload 重放） | ~120 |
| VSC·测 | `thincoder-vscode/test/files.mjs` | 134 | 新档登记（+1） | ~135 |

**跨文件限**：全表 ≤500（最长 = `render-conversation.mjs` ~455）；`ui.js` 491 → ~494 贴限（增量 = 2 行 dataset 写 + 1 行 return——无新职责）；**`webview/chat.css` 零改**（标记不引入新 CSS——该档 514 行越 500 硬限为**既有债**，本批不加剧）；`test/busy-injection-vsc.test.mjs` **543 行越限（既有债）** ⇒ 本批 VSC 用例**落新档**（`queue-visible-vsc.test.mjs` + `files.mjs` 登记）。

**用例表（T-F16-10…14 CLI / T-V16-11…13 VSC——宿主与断言钉死）**

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-F16-10 | 正常 | `renderConversation` / `buildConvLines` 直驱：单槽 `["hello world"]` | strip-ANSI 会话区含 `⏳ 待发送 · 回合结束后自动发送` ∧ 含原文行 ∧ 块行序在 `state.streaming` 渲染行之后 | `test/busy-injection.test.mjs` |
| T-F16-11 | 边界（负向锁） | 单槽空 | 零该串 ∧ 逐字节等价（同 `renderStatus` 负向锁纪律） | 同上 |
| T-F16-12 | 边界 | 原文超 5 行 / 超宽 / 长单行 | 原文行 ≤5 + 尾标记行逐字；全程零 `\x1b[43m`（F13 豁免） | 同上 |
| T-F16-13 | 正常 | 驱真 `handleBusyEnter`（`processing: true`）入槽 | `pendingInput` 填充 ∧ `state.scroll === 0` ∧ `state._followTail === true` ∧ 框内清空 | 同上 |
| T-F16-14 | 正常 | 司队尾 drain 驱动（桩 `runAgent`）：入槽 → 回合尾 | 单帧读数（渲染直接调用）：块消失 ∧ 含 `[sending queued message]` ∧ 含 `❯ You:` + 原文（同文恰一次——无重复） | 同上 |
| T-V16-11 | 正常 | webview-env 驱真 `send()`（`running`） | 新气泡类含 `pending` ∧ 标签含 `queued.pending` 文案 ∧ `_pendingEl` 指向该气泡 | `test/queue-visible-vsc.test.mjs` |
| T-V16-12 | 正常 / 边界 | 快照三支：① 有本地标记 ② 无标记但存同文气泡 ③ 无同文气泡；再喂 `pending:false` | ① 不动 ② 同文气泡就地标记（**不新建**——DOM 气泡数不变）③ 流尾新建（原文 = `text`）；`pending:false` ⇒ 类去 `pending` ∧ 标签回 `❯ …` ∧ 气泡仍在（不删） | 同上 |
| T-V16-13 | 边界 / 回归 | ① 会话退出残余直发循环消费；② Reload 冷启握手重推 | ① 消费后推 `pending:false`（镜像与标记均清——无黏滞）② 无气泡时按快照新建（冷启重放准）；协议门两档（`protocol-coverage{,-reverse}`）零回归 | 同上（协议门 = 既有档） |

**验收对照（设计条 ↔ 批次档 §1.6 AC-1…AC-5）**

| AC | 设计条（落点） | 用例 / 读数 |
|---|---|---|
| AC-1 排队期会话流可见（双端） | `TUI.md` §7.5 待发送块（派生尾插槽——原文可见）· `WEBVIEW-INPUT.md` C-B2-6 细则⑦（气泡 `pending` 标记 + 原文） | T-F16-10 · T-V16-11 · T-V16-12③ |
| AC-2 消费时排队态清除 + 转正（即时） | §7.5 消费转正（单帧切换）· 细则⑦ 消费即清（四消费点 + 握手重推） | T-F16-14 · T-V16-12（清除支）· T-V16-13① |
| AC-3 零丢失不回退 | 消费链谓词零改声明（`TUI-INPUT-BOX.md` §4.1 送达链路段零改） | 既有 T-F16-1…3 / 5 全绿 + 两端 `npm test`（实施轮门） |
| AC-4 排队态不误导为「已发送」 | 标签文本（`⏳ 待发送 · …` ≠ `❯ You:`）+ 正文色（`C.dim` ≠ `C.text`）+ 状态栏 `已排队 1 条消息` 段保留 | T-F16-10（标签断言）· T-V16-11 |
| AC-5 槽满 / 四吞面与现状一致 | 槽宽 = 单槽（零改）· 执行序吞判三步零改 | 既有 T-F16-3 / 4 回归 + 批档「零改对照」表 |

**关键决策记录（含被否备选）**：D-QV1 载体 = 派生（零簿记——同族先例 = §7.5 状态栏段派生）· D-QV2 落位 = 流尾（streaming 之后——正面处置旧否决，见上）· D-QV3 上限 5 行 + 尾标记（与 `MAX_INPUT_LINES` 同口径）· D-QV4 入槽恢复跟随（F4 判定句——排队提交 = 「新提交消息」）· D-QV5 VSC 用 `busyQueued` **快照扩字段**（原地扩字段 ⇒ §3.2 计数零变——不新增消息族；`text` 恒携槽内项原文）· D-QV6 VSC 标记 = DOM 类 + 标签行（**零新 CSS**——避开 `chat.css` 越限债）· D-QV7 中止残余不渲染待发送块（措辞不符：残项在下一回合尾续发；既有提示行已明示去向——如用户要求该面可见 ⇒ 另开条目）。

**测试面与机检**：① 呈现层断言策略 = 纯函数直驱（`buildConvLines` / `renderConversation` 读 strip-ANSI 文本——不发快照、不引新断言族；先例 = §7.5 既有可机判句 + T-F16-6）；② VSC 面 = happy-dom（`webview-env` / `installFullIndexFixture` 真模块图）+ vscode-mock 桩面板（先例 = `busy-injection-vsc.test.mjs`）；③ 协议门 = `protocol-coverage.test.mjs` / `protocol-coverage-reverse.test.mjs` 双向对账集**零改**（原地扩字段不新增判别式）；④ **机检读数（设计轮自跑 as-of 2026-09-24）**：`node scripts/doc-check.mjs` ⇒ 本批面**零新增**（悬空 8 / 行宽 2 = 与改动前基线**逐条同**——8 悬空 + 2 行宽均为存量，住 `docs/core/design/**` 与 `BATCH-RECORD.md`；用例号悬空 0）；⑤ 两端 `npm test` = 实施轮门（本批预期：CLI 新增行入既有档、VSC 新档登记后同绿）。

**上抛项（主 agent 决策）**

1. **需求文档面补句（主 agent 笔——三链同源缺口，非阻塞设计）**：`docs/cli/requirements/TUI.md` **F16** 需补「排队期会话流可见」句方能闭链——建议：判定句补「**排队期 ⇒ 会话流尾「待发送」态块可见（含用户原文——设计档 `TUI.md` §7.5）**」；范围边界补「待发送块 = **派生插槽**（不入会话历史 / 不落盘 / 不进搜索面）」；回指句补 `TUI.md` §7.5；VSC 对位句补「待发送标记（`WEBVIEW-INPUT.md` §1 C-B2-6 细则⑦）」。设计侧已按批档 §1.6 AC-1 / AC-4 落定；**需求档未落 ⇒ 链不闭合**（本席无需求档笔）。
2. **VSC 既有缺口（本批发现——登记不改，超本批射程）**：外部入口（Ask ThinCoder 命令 / retry）于 busy + 槽满时，`sendMessage` **回显气泡先于路由**上屏 ⇒ 留一条永不送达的气泡（C-B2-6 ③「回显保留」语义的既有边界）；本批标记**只随受理走**（不为该气泡回填标记——否则反向误导）。建议另开条目裁定（回显延后 ∥ 拒收回滚）。
3. **既有债（登记，本批零加剧）**：`thincoder-vscode/webview/chat.css` **514 行**、`thincoder-vscode/test/busy-injection-vsc.test.mjs` **543 行**——均越 500 硬限（前批遗留）；本批以「零新 CSS + 新测档」规避。建议入册台账（如未在册）。
4. **中止残余面（边界登记）**：CLI 中止残余（槽项转 `state.queue` + 既有提示行）**不**渲染待发送块——如用户期望该面亦可见（「我的消息去哪了」延伸问），另开条目（需新增措辞与判据）。

**需求裁定升级轮（fix round · eng-designer · 2026-09-24）——承 §1.10（用户 03:01 裁定）**

**触发**：用户 03:01「对呀，肯定是需要多条啊！我认为多条应该被合并成一条一次被消费。」⇒ ① **多槽**（≥2 条可排——上限本席定）；② **合并消费**（排队多条合并为一条、一次回合——替代 drain 逐条续发）；③ §1.5 边界「不改消费链谓词」**解除**（drain 逐条 ⇒ 合并单发属本批）；④ 史实确认——用户记忆的「以前队列」= `pendingInput` + **R15 攒批** + queue UI 三件套 ⇒ **R15 攒批（合并消费）纳入本批恢复范围**；⑤ VSC 同受。

**旧形态实读（R15 调研——恢复依据）**：CLI 侧原实现住 `src/tui/suspension-drive.mjs`（git commit `3e1234b7` 树内 `:21-68`，报废于 `fe6d62db`）：常量 `MAX_MERGE_ITEMS = 8` / `MAX_MERGE_CHARS = 2000`（双端逐字一致）；`formatMergedMessages(items)` 逐字 = `` `你排队了 ${items.length} 条消息：\n${items.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n——一次处理` ``；`planQueuedInput(items)` = 动作序列（`/cmd` 逐条即时 ∥ 连续非 `/` 条目攒批：≤8 条 ∧ 合并文本 ≤2000 字符、超限截批先行、单条 >2000 字符直发）；归档机制档 = `thincoder-cli/docs/_archive/design/AGENT-LOOP.md` §11.3（机制 + 双端删除面清单）。**本批按此逐字恢复**（常量名 / 值 / 形态文案 / 批语义）。

**修订后的裁定点（覆盖上一轮块的 ①–⑥ 中 ③④⑥ 及「合并格式 / 满队 / 超批」三新增项）**：

1. **落位**（不变）= 会话流尾「待发送块」（渲染帧稳定尾插槽——派生行，`state.streaming` 之后；旧否决的处置同上一轮块）。
2. **视觉形态（多条版）**：标签行 N ≥ 2 = `⏳ 待发送 · N 条消息（回合结束后合并发送）`（`C.warn`）/ N = 1 = `⏳ 待发送 · 回合结束后自动发送`；正文 = **逐条**原文（`C.dim`，每条 ≤ `QUEUED_ITEM_MAX_LINES`（3）行 + 该条尾标记 `… [该条共 N 行——发送后完整显示]`；多条带 `i. ` 编号 + 续行 2 空格缩进——**编号 = 模型将看到的合并形态预览**；单条不加编号）。
3. **槽宽 = 容量 8 条**（`QUEUED_MAX_ITEMS = 8`——与合并批上限同数同名的耦合理由：⇒ 常规满队恰一批一次消费）；容量内连续入队逐条可见；**满队（第 9 条）= 拒 + 提示 + 文本保留**（形态同现状，阈值 1 → 8；提示字面 = `[主会话处理中 —— 已排队 8 条消息，请等其处理完成后再发送]`；VSC 键 `input.slotFull` 值同轮改）。
   （覆盖上一轮块 ③ 的「单槽保留」；被否候选仍为**无界队列**——无满队面 ⇒ 状态栏 / 气泡两处都缺「还要等多久」的收敛信号，且与既有「拒 + 文本保留」纪律分叉。）
4. **消费切换 = 合并成形 + 单帧**：消费点按同一计划取批 ⇒ N 条待发送块 → 回执行 + **一条合并用户消息**（同一同步段 + 渲染帧合并调度 ⇒ 一帧；零空窗 / 零重复）。
5. **挂起态同构**（不变——队列判据与 `suspended` / `processing` 无关）。
6. **VSC 等价物 = 逐条气泡标记 + 快照驱动 + 多批合泡**：判据源 = `busyQueued { pending, count, items, merged? }`（`count` = 剩余条数；`items` = 剩余项原文（Reload 重建源）；`merged` = 本批合并文本（仅消费推送——多条批「移除已标记气泡 + 追加一条合并气泡」；单条批 = 清标保留）；满队判据 = `S._busyQueuedCount >= 8`（本地先行自增 + host 快照收敛）。
7. **合并格式（新增裁定）= 逐字恢复 R15**（头 `你排队了 N 条消息：` + `1. …` + 尾 `——一次处理`；`N` = 本批条数）。
8. **超批语义（新增裁定）= 逐字恢复 R15**：>8 条 / 合并 >2000 字符 ⇒ 截批先行（余下留待下批——不丢，多回合）；单条 >2000 字符 ⇒ 直发（不进批）；`/cmd` ⇒ 逐条保序即时（不进合并缓冲）。
9. **未恢复项（显式登记——上抛②）**：旧 queue UI 的 `renderQueue` 面板 / queueHint / Ctrl+D / `❯ You: (from queue)` 标签**不恢复**——可见性由「流尾待发送块 + 状态栏条数段」承接（会话流内逐条原文可见）；Ctrl+D 语义无人要求。

**受影响文件表（本轮修订——覆盖上一轮块同名表）**：

CLI：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| CLI·源 | `thincoder-cli/src/tui/queued-merge.mjs`（拟新增） | — | 纯函数族：`MAX_MERGE_ITEMS`(8) / `MAX_MERGE_CHARS`(2000) / `QUEUED_MAX_ITEMS`(8) + `formatMergedMessages` + `planQueuedInput`（R15 逐字恢复） | ~70 |
| CLI·源 | `thincoder-cli/src/tui/render-conversation.mjs` | 425 | 尾插槽派生块（多槽版：标签含条数 + 逐条编号 + 每条 ≤3 行 + 该条尾标记）+ cache key 排队签名（条数 + 各条长度）+ 常量 `QUEUED_ITEM_MAX_LINES` | ~465 |
| CLI·源 | `thincoder-cli/src/tui/render-frame.mjs` | 418 | 状态段字面改 `已排队 N 条消息`（+ enterHint 判据句不变） | ~419 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-busy.mjs` | 43 | 条件 5 → 容量（`< QUEUED_MAX_ITEMS`）+ 满队提示字面 | ~45 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-edit.mjs` | 116 | 挂起态入队分支同款（容量 + 恢复跟随两行） | ~120 |
| CLI·源 | `thincoder-cli/src/tui/agent-turn.mjs` | 378 | 回合尾兜底：`planQueuedInput` 取批 → `state.queue`（替换逐条转正） | ~385 |
| CLI·源 | `thincoder-cli/src/tui/suspension-drive.mjs` | 335 | driver 步骤 1 + 中止残余：按计划取批（合并文本开回合 / 残余按计划转 queue） | ~350 |
| CLI·测 | `thincoder-cli/test/busy-injection.test.mjs` | 282 | 新增用例（多槽渲染 / 合并计划 / 容量 / 合并消费单帧） | ~400 |
| CLI·测 | `thincoder-cli/test/input-lock.test.mjs` | 396 | 既有槽满 / AC-1 断言随容量口径收正（阈 1 → 8） | ~400 |

VSC：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| VSC·源 | `thincoder-vscode/src/extension/queued-merge.mjs`（拟新增） | — | 同源纯函数（常量 / 文案 / 计划——**双端同名对拍**） | ~60 |
| VSC·源 | `thincoder-vscode/webview/queued-mark.js`（拟新增） | — | 逐条标记 / 清标 / 多批合并成形 / 引用失效守卫 / 标签读写 | ~80 |
| VSC·源 | `thincoder-vscode/webview/send.js` | 87 | busy 分支：出泡即标记 + 容量守卫 | ~90 |
| VSC·源 | `thincoder-vscode/webview/ui.js` | 491 | `data-raw` / `data-ts` + `addUser` 返 el（+3——**<500 保持**） | ~494 |
| VSC·源 | `thincoder-vscode/webview/chat-messages.js` | 235 | `case "busyQueued"` → 快照应用（count / items / merged） | ~240 |
| VSC·源 | `thincoder-vscode/webview/state.js` | 127 | `S._busyQueuedCount` 字段（+1；`_busyQueuedPending` 保留 = count > 0） | ~128 |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 338 | `pushBusyQueued` 携快照（count / items / merged）+ 满队判决 | ~350 |
| VSC·源 | `thincoder-vscode/src/extension/suspension.mjs` | 435 | driver 步骤 1 + 退出残余循环：按计划取批 + 快照推送 | ~455 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 234 | 装载② `deliverBusyQueued` 按计划取批 + 快照推送 | ~245 |
| VSC·文案 | `thincoder-vscode/locales/{zh,en}.json` | 268 / 268 | `input.slotFull` 值改（条数阈）+ `queued.pending` 新增 | 269 / 269 |
| VSC·测 | `thincoder-vscode/test/queue-visible-vsc.test.mjs`（拟新增） | — | 细则⑦ 面 + 合并字号 + 容量守卫 | ~150 |
| VSC·测 | `thincoder-vscode/test/files.mjs` | 134 | 新档登记（+1） | ~135 |

**跨文件限**：全表 ≤500（最长 = `suspension.mjs` ~455）；`ui.js` 491 → ~494 贴限（+3 = 2 dataset 写 + 1 return）；`chat.css` **零改**（标记零新 CSS——避 514 行既有债）；`busy-injection-vsc.test.mjs` 543 行既有债 ⇒ 新用例落新档。

**用例表（T-F16-10…17 CLI / T-V16-11…15 VSC——宿主与断言钉死；覆盖上一轮块同名表）**

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-F16-10 | 正常 | `buildConvLines` 直驱：队列 N = 1 | 标签 `⏳ 待发送 · 回合结束后自动发送` ∧ 原文行 ∧ **无编号**头 | `test/busy-injection.test.mjs` |
| T-F16-11 | 正常 | N = 2 | 标签含 `2 条消息（回合结束后合并发送）` ∧ `1. ` / `2. ` 编号行（顺序 = 入队序） | 同上 |
| T-F16-12 | 边界（负向锁） | 队列空 / 某条超 3 行 | 零该串 ∧ 逐字节等价；超长条 ⇒ 该条尾标记行逐字 | 同上 |
| T-F16-13 | 边界 | 连续入队至 8 条，再入第 9 条 | 前 8 条全入（`length === 8`）∧ 第 9 条拒 + 提示含 `已排队 8 条消息` + 文本保留 | 同上 |
| T-F16-14 | 正常 | `planQueuedInput` 纯函数：2 条短 / 9 条 / 单条 >2000 字符 / 混 `/cmd` | 2 条 ⇒ 单动作 `merged:true`（文本逐字 = R15 形态）；9 条 ⇒ 首动作 count ≤ 8；超长 ⇒ `merged:false` 直发；`/cmd` ⇒ 逐条动作（保序、不进合并） | 同上 |
| T-F16-15 | 正常 | 回合尾兜底（桩 `runAgent`）：入队 2 条 → 回合收尾 | `state.queue` 恰 1 项（合并文本）∧ 回执行 1 行 ∧ `❯ You:` 携合并文本（**一次回合**） | 同上 |
| T-F16-16 | 正常 / 边界 | driver 步骤 1 取批；中止残余 | 合并开一回合；残余按计划转 `state.queue`（零丢失）；块随判据消失 | 同上 |
| T-F16-17 | 机判 | `renderStatus`：队列非空 N = 2 | 含 `已排队 2 条消息` ∧ 全程零 `\x1b[43m` | 同上 |
| T-V16-11 | 正常 | webview 真 `send()` ×2（running） | 两气泡类含 `pending` ∧ 标签含 `queued.pending` 文案 ∧ `_busyQueuedCount` = 2 | `test/queue-visible-vsc.test.mjs` |
| T-V16-12 | 正常 / 边界 | 快照四面：items 标记 / count 守卫 / merged 多条批 / merged 单条批 | 逐条标记（无重复建泡）；`count >= 8` ⇒ 不出泡 + toast；多条批 ⇒ 已标记气泡移除 + 追加一条合并气泡（文本 = merged）；单条批 ⇒ 清标保留（气泡不删） | 同上 |
| T-V16-13 | 边界 | 消费后快照（剩余项）+ Reload 握手（items 重建） | 剩余项保持标记（无悬空）；Reload ⇒ 按 items 顺序重建 N 气泡 | 同上 |
| T-V16-14 | 正常 / 回归 | `queued-merge.mjs` 纯函数 vs CLI 同族 | 常量值 / 文案逐字 / 计划输出**双端同名同值**（对拍）；协议门两档 + 既有 `busy-injection-vsc` 族零回归 | 同上（协议门 = 既有档） |

**验收对照（含新增 AC-6…AC-8——编号续 §1.6 的 AC-1…AC-5）**

| AC | 判据 | 设计条 | 用例 |
|---|---|---|---|
| AC-1 排队期会话流可见（双端） | 排队期 ⇒ 逐条「待发送」态 + 原文可见 | `TUI.md` §7.5 待发送块 · C-B2-6 细则⑦ | T-F16-10 / 11 · T-V16-11 |
| AC-2 消费时清除 + 转正（即时） | 标记 / 块清 + 合并成形（单帧） | §7.5 消费转正 · 细则⑦ 清标与合并 | T-F16-15 / 16 · T-V16-12 |
| AC-3 零丢失不回退 | 超批 / 残余 / 中止三路零丢失 | §4.1 送达链路段 · 中止残余 | T-F16-14 / 16 · 两端 `npm test` |
| AC-4 不误导为「已发送」 | 标签文本 / 正文色 / 状态栏条数段 | §7.5 形态 · 细则⑦ | T-F16-10 · T-V16-11 |
| AC-5 满队 / 吞面与现状一致（阈值连带） | 吞面四形态不变、满队阈 1 → 8 | §4.1 判据表 / 执行序 | T-F16-13 · 既有 T-F16-4 回归 |
| **AC-6 多槽（新增）** | 容量 8 内连续入队逐条可见；第 9 条拒 + 提示 + 文本保留 | §4.1 条件 5 · §7.5 条数段 | T-F16-13 · T-V16-12 |
| **AC-7 合并消费（新增）** | 多条 ⇒ 一条一次回合（形态逐字）；超批截批先行（余下下批）；单条 >2000 直发；`/cmd` 保序 | §4.1 送达链路 · 合并消费条 | T-F16-14 / 15 · T-V16-12 |
| **AC-8 双端同源（新增）** | 容量 / 批上限 / 字符阈 / 文案双端同名同值（各自实现） | `AGENT-LOOP-ASYNC-POOL.md` §6.8 合并消费条 | T-V16-14（对拍） |

**关键决策记录（本轮新增 / 修订）**：D-QV3′ 容量 = 8（与批上限同数——满队恰一批；无界队列被否）· D-QV5′ VSC 快照扩字段 `count` / `items` / `merged`（只增不改——§3.2 计数零变）· D-QV8 合并格式 = R15 逐字恢复（`你排队了 N 条消息：` + 编号 + `——一次处理`）· D-QV9 超批 = R15 语义恢复（截批 / 超长直发 / `/cmd` 保序）· D-QV10 单条批清标保留 ∥ 多条批就地合泡（VSC——live 与历史 / 恢复形态三点一致）· D-QV11 旧 queue UI（面板 / queueHint / Ctrl+D / `(from queue)` 标签）不恢复（可见性已由流内块 + 状态栏承接）。

**本轮机检读数（as-of 2026-09-24 · 设计轮自跑）**：`node scripts/doc-check.mjs` ⇒ **本批面零新增**——本批五档（`TUI.md` / `TUI-INPUT-BOX.md` / `TUI-SESSION-VIEW.md` / `WEBVIEW-INPUT.md` / `WEBVIEW-PROTOCOL.md`）+ 核档（`AGENT-LOOP-ASYNC-POOL.md`）**零闸面失败**（0 悬空 ∧ 0 行宽）；全仓存量 = 悬空 8 / 行宽 4（他档：`MODEL-BENCH.md` 等，非本批引入）；拟新增锚 3 = 本批新档（`queued-merge.mjs` ×2 双端 + 载荷字段——「（拟新增」标记在档、列报不入闸）。

**上抛项（本轮更新）**

1. **需求文档面补句（主 agent 笔——三链同源缺口）**：`docs/cli/requirements/TUI.md` F16 需补三轮句——① 可见性（排队期 ⇒ 会话流尾「待发送」块 + 原文）；② **多槽**（容量 8；第 9 条拒 + 提示 + 文本保留）；③ **合并消费**（多条合并为一条、一次回合；形态 / 常量 = 设计档）；范围边界句去「不引入多消息攒批 / 单槽语义」（已被 03:01 裁定推翻）；VSC 对位句补待发送标记 + 合并。设计侧已按 §2 三链落定；**需求档未落 ⇒ 链不闭合**。
2. **旧 queue UI 未恢复项**（见 D-QV11）：如用户期望旧面板 / Ctrl+D 形态 ⇒ 另开条目（本批以「流内逐条 + 状态栏条数」承接可见性）。
3. **既有债（登记，本批零加剧）**：`thincoder-vscode/webview/chat.css` 514 行 · `thincoder-vscode/test/busy-injection-vsc.test.mjs` 543 行（均越 500 硬限——前批遗留）。
4. **VSC 外部入口队满回显气泡**（既有缺口——登记不改，超本批射程）：`sendMessage` 回显先于路由 ⇒ busy + 队满时上屏一条永不送达的气泡；本批标记只随受理走。
5. **中止残余面**：CLI / VSC 中止残余（转 `state.queue` / 残余直发）不渲染待发送块（按合并计划成形，既有提示行明示去向）——如用户要求该面亦可见 ⇒ 另开条目。

**步边界消费时机 · fix 轮（eng-designer · 2026-09-24）——承 §1.11（用户 03:06 收正）+ §1.12（参照模型）+ §1.13（「主体反置」作废）**

**触发与口径**：消费时机 = **当前 turn（步）边界**（一步 = 一次 LLM 调用 + 其工具执行段）——**不中断在飞工具**、**下一步生效**；与 **Ctrl+I**（立即中断当前回合 + 续跑）严格区分。本批 = **新增「用户 → 主会话」投送通道**，行为契约**参照**既有「主 agent → 子 agent」`subagent action:'send'`（**参照非改造——send 侧代码 / 文档 / 行为零触碰**，§1.13）。§1.5 边界再修订：**核面步钩子属本批范围**。

**选型结论（核侧落法）**：`runAgent` opts 增**投递回调** `consumeQueuedInput`——与 `consumeInjected`（`thincoder-core/agent.mjs:233`）**同址同族**（循环头），落 `drainChildUpstream(agent)`（`:235`）之后（真实用户消息恒为 history 尾）。
回调**自持语义**（取批 / `pushReal` / 呈现——核只给缝、不给策略；同 `drainInjectedQueue` 形态）；空队列 no-op、缺省 `null`（headless / 直连零开销）。
**复用面 = 核既有底层构件**：循环头回合边界缝 + `pushReal` 历史写原语 + 「非中断 / 下一边界 / 普通 user 消息」语义契约——**零新增基础件、零改造既有机制**。

**被否候选（六）**：
① 会话层包装（外层按步重入 `runAgent`）——run 级语义全破（mutation / guard 复位、turn 编号帧、Stop 钩子、续跑、压缩链、`_pendingDistill`）；
② 在 `callbacks.onTurnEnd` 内注入——通知通道承载隐藏写入（消费方 = 增量保存 / 流 flush），触发点分散（`completion.mjs` 六分支 + `post-turn.mjs`）且其一在「本轮即 return」路径（注入后消息滞留到下一回合）；
③ 核单源 drain 函数 + 载体字段（parent-channel 模式）——队列容器迁移 ⇒ 全部入队路径 / 容量判据 / UI 派生（待发送块 / 状态栏段 / VSC 快照源）连带改（超「只加消费时机」射程）；且合并格式 / 文案属端面 ⇒ 核 drain 须持端文案（域越界）；
④ 与 `send` 消费件合流（`drainInjectedQueue` 泛化）——**触碰 `send` 实现面 ⇒ 出本批范围**（上抛②）；
⑤ digest / 上行唤醒轮内步边界注入——见「分流」；
⑥ digest 轮步边界**让位**（run 在边界收束）——核新增退出语义 + 部分消化残面，超本批射程。

**分流（系统轮不参与步边界）**：digest / 上行唤醒轮（`autoTurn === true`）域文本 = 整理域，且手动档机械门禁（无权限 handler ⇒ 写被拒；`_inAutoTurn && !autoApprove` ⇒ spawn 拒）会把用户指令降格 ⇒ 该两轮**不传 pickup 回调**（端侧传参面自带分流）；系统轮消费点保持 driver 步骤 1（轮末，零改）。

**消费时机三时机（时间序）**：**① 步边界（主——本批新增）** / **② 回合尾兜底**（队列在末步填充 ⇒ 本 run 无后续边界——既有 `agent-turn.mjs` 队列续发，零改）/ **③ 驱动级**（挂起面无在飞用户回合——driver 步骤 1，零改）。

**文案收正（逐字——连带收正）**：
- **状态栏 `enterHint`（四态，`render-frame.mjs`）**：行 1 `已排队 N 条消息`（零改）；**行 2 普通 busy = `主会话处理中 — Enter 排队（当前步骤结束后自动发送）`**（收正）；**行 3 挂起内用户回合在飞（`agent._inAutoTurn !== true`）= `会话内回合处理中 — Enter 排队（当前步骤结束后自动发送）`**（新增行）；行 4 挂起内系统轮在飞（`agent._inAutoTurn === true`）= `会话内回合处理中 — Enter 排队（本轮结束后优先发送）`（零改）。
- **待发送块标签（面无关两形——时机承诺归状态栏）**：单条 = `⏳ 待发送 · 不打断当前执行，自动发送`；多条 = `⏳ 待发送 · N 条消息（不打断当前执行，合并发送）`。理由：标签无法廉价获知面（用户回合 / 系统轮），声明时机即会在任一面失真 ⇒ 只声明状态 + 非中断事实，精确时机由状态栏承载（缓存键参与句零改）。
- **VSC 键 `queued.pending` 值同轮改**（`待发送 · 不打断当前执行，自动发送` / EN `Queued — sent automatically, no interruption`）；`queued.pending` 键位 / 键数零变。

**设计档落点（五面就地 + 两核档，逐处 file:line）**：
1. `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8（`:24-48` 新增「步边界 pickup」块：通道语义 / 选型 + 被否六项 / 适用面 / 不中断 / Ctrl+I 区分 / 三时机 / 双端）+ 变更记录；
2. `docs/core/design/AGENT-LOOP.md` §6.2（`:213-215` 循环头注入族三成员句——机制单源回指 §6.8）+ 变更记录；
3. `docs/cli/design/TUI.md` §7.5（`:612` enterHint 四态表 · `:626-627` 标签两形 + 不声明时机句 · `:633-642` 消费时机三时机表 + 分流 + Ctrl+I 区分句 · `:643` 消费转正三时机 · `:648-651` 可机判四态 + 块面 + 步边界 pickup 面 · `:657` VSC 对位步边界句 + 变更记录）；
4. `docs/cli/design/TUI-INPUT-BOX.md` §4.1（`:102-103` 档头送达链路句 · `:134-135` 回执三处 · `:141-143` 呈现与转正段 · `:146-149` 送达链路四支 ⓪ + 变更记录）；
5. `docs/vsc/design/WEBVIEW-INPUT.md`（`:19` C-B2-6 正文步边界句 · `:26` 消费点五 · `:28-30` 细则② 四支 ⓪ · `:46` 推送点五 · `:165` U-I8 · `:180` §9 用例面 + 变更记录）+ `docs/vsc/design/WEBVIEW-PROTOCOL.md`（`:63` §3 行 · `:99` §3.2 行 17 · `:144` §4.1 四支 · `:270` §6.3 键值 · `:370` §12 行 + 变更记录）。

**受影响文件表（本轮增列——与上两轮块同名表并读）**：

| 档 | 文件 | 现况行 | 动作 | 预计后 |
|---|---|---|---|---|
| 核·源 | `thincoder-core/agent.mjs` | 436 | 循环头 +1 调用（`consumeQueuedInput?.(agent)`——`drainChildUpstream` 之后）+ opts 形参 +1 + 注 2 行 | ~439 |
| CLI·源 | `thincoder-cli/src/tui/queued-pickup.mjs`（拟新增） | — | `pickupQueuedAtStepBoundary`（按计划取批（首动作 merged 批；`/cmd` 首动作跳过）⇒ `pushReal` 一条 user 消息 + 回执行 + `❯ You:` + 合并文本 + `render()`；空队列 no-op） | ~45 |
| CLI·源 | `thincoder-cli/src/tui/agent-turn.mjs` | 378 | runAgent opts 增 `consumeQueuedInput`（`autoTurn ? null : …`；+2） | ~380 |
| CLI·源 | `thincoder-cli/src/tui/render-frame.mjs` | 418 | `enterHint` 四态（+2 行判据） | ~420 |
| CLI·源 | `thincoder-cli/src/tui/render-conversation.mjs` | 425 | 待发送块标签两形逐字改（结构零变） | ~427 |
| CLI·测 | `thincoder-cli/test/busy-injection.test.mjs` | 282 | + 步边界 pickup 用例（T-F16-18） | ~400 |
| VSC·源 | `thincoder-vscode/src/agent.mjs` | 495 | 端壳循环头 +1 调用（紧随 `opts.turnInput?.()`）+ 注 1 行 | **~497（<500 硬限保持）** |
| VSC·源 | `thincoder-vscode/src/extension/queued-pickup.mjs`（拟新增） | — | 双端同名 `pickupQueuedAtStepBoundary`（载体两态选择 + 计划取批 + `pushReal` + `pushBusyQueued`） | ~45 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 185 | `ro.consumeQueuedInput`（autoTurn 轮不传） | ~191 |
| VSC·测 | `thincoder-vscode/test/queue-visible-vsc.test.mjs`（拟新增） | — | + T-V16-15（端壳步边界——history 序 + 快照推送） | ~165 |

**跨文件限**：全表 ≤500（最长 = `suspension.mjs` ~455——上轮估）；`thincoder-vscode/src/agent.mjs` 495 → ~497 **贴限保持**（+2 = 1 调用 + 1 注——无新职责）。

**用例表（本轮新增行——补上一轮块同名表）**：

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-F16-18 | 正常 / 边界 | `pickupQueuedAtStepBoundary` 直驱：队列 2 条 / 队列空 | 2 条 ⇒ 按计划取批 ⇒ `agent.history` 尾恰 +1 条 user 消息（内容 = R15 合并文本）∧ `state.lines` 含 `[sending queued message]` + `❯ You:` + 合并文本 ∧ `pendingInput` 空 ∧ 零 `[User interrupt:]`（非中断锁）；空 ⇒ 逐字节等价（零推送） | `test/busy-injection.test.mjs` |
| T-V16-15 | 正常 | 端壳 `runAgent` 桩 LLM：首响应带 toolCalls → 次响应终答；run 中队列入 2 条 | 下轮 history 含合并 user 消息（序 = 首响应之后 = 步边界）∧ 快照推 `busyQueued { pending:false, count, items, merged }` ⇒ webview 消费成形（单条清标保留 / 多条就地合泡） | `test/queue-visible-vsc.test.mjs` |

**验收对照（AC-9 新增——编号续 AC-1…AC-8）**：

| AC | 判据 | 设计条 | 用例 |
|---|---|---|---|
| **AC-9 步边界消费（新增）** | 排队消息在**当前步末** pickup——在飞工具**不中断** ∧ **下一步生效** ∧ 双端同判据；与 Ctrl+I 区分（零 abort / 零 `[User interrupt:]`） | `AGENT-LOOP-ASYNC-POOL.md` §6.8 步边界 pickup（`consumeQueuedInput`）· `TUI.md` §7.5 消费时机表 · `WEBVIEW-INPUT.md` C-B2-6 细则② ⓪ | T-F16-18 · T-V16-15 |

**关键决策记录（本轮新增）**：D-QV12 步边界 pickup = 复用核「回合边界投递」缝（回调自持语义；被否六项见上）· D-QV13 **系统轮不参与步边界**（域 + 门禁降格的机械论证；消费点 = driver 步骤 1）· D-QV14 文案收正（状态栏四态面感知（`agent._inAutoTurn` 活读）+ 块标签面无关；时机承诺归状态栏）· D-QV15 兜底三时机零改（回合尾 / 驱动级照旧——仅新增步边界）。

**零改对照（本轮增补）**：`send` 机制族（`subagent-actions.mjs` / `subagent-run.mjs` / `entry._injected` / 工具描述）**零触碰**（参照系）；Ctrl+I 代码与文档条目零触碰（只写区分句）；多槽容量 8 / 合并消费 / 吞面四 / 待发送块结构（派生 / 落位 / 上限 / 缓存键 / 跟随）/ `_pasting` / 子代理排队可见性零变。

**机检读数（fix 轮自跑 · as-of 2026-09-24）**：`node scripts/doc-check.mjs` ⇒ **本批面零闸面新增**——行宽 4（逐条 = 基线同：`BATCH-RECORD.md:358` / `:365` · `MODEL-BENCH.md:431` / `:856`，均非本批）；路径/坐标悬空 8（逐条 = 基线同，全在他档 `docs/core/design/**`）；本批新档锚（`queued-pickup.mjs` ×4 处）携「（拟新增）」标记 ⇒ 列报不入闸（拟新增 11 → 15）；用例号悬空 0（T-F16-18 / T-V16-15 经本表在册）。

**上抛项（本轮增量）**：
1. **需求档 F16 补句（主 agent 笔——增量）**：F16 需再补三轮句——① **消费时机 = 当前步边界**（step pickup：在飞工具不中断 + 下一步生效）；② **参照模型** = 子代理 `send`（非中断 / 下一 turn 边界 / 普通用户指令）；③ 范围边界句收正——「不改核」改为「核面步钩子（`consumeQueuedInput`）属本批」。设计侧已按 §2 三链落定；**需求档未落 ⇒ 链不闭合**。
2. **`send` 合流候选出范围（§1.13 边界）**：把主会话 pickup 与 `send` 抽公共消费件 = 触碰 `send` 实现面 ⇒ 本批零触碰；如后续要统一，另开批次（须评估 `send` 侧回归面）。
3. **既有债 / 未恢复项 / 中止残余面**：上两轮块上抛 3 / 4 / 5 条**维持原状**（本轮零加剧、零改判）。

**fix 轮补记（eng-designer · 2026-09-24）**

1. **第六档就地收正（一致性面——同轮发现同轮修）**：`docs/cli/design/TUI-SESSION-VIEW.md` §4 第 6 条（`:81-83`）——「回合尾按批直发」句限定为**残项路径**并补主消费 = 步边界 pickup（机制单源回指 `AGENT-LOOP-ASYNC-POOL.md` §6.8）+ 变更记录。理由：该句与 §2 fix 块「消费时机三时机」相抵（读者会据其读成「回合尾 = 队列唯一消费点」）。
2. **机检读数（终态 · as-of 2026-09-24 · fix 轮自跑）**：`node scripts/doc-check.mjs` ⇒ **本批面零闸面新增**——行宽 **4**（逐条 = 基线同：`BATCH-RECORD.md:358` / `:365` · `MODEL-BENCH.md:431` / `:856`，均非本批）；路径/坐标悬空 **8**（逐条 = 基线同，全在他档 `docs/core/design/**`）；用例号悬空 **0**（= 基线）；拟新增 **11 → 15**（本批新档锚 ×4 携「（拟新增）」标记 ⇒ 列报不入闸）。
3. **上抛①补强（需求档 F16 现况实读——主 agent 笔）**：`docs/cli/requirements/TUI.md:37` 现况与 03:01 / 03:06 两轮裁定相抵的残留**逐条**：①「`pendingInput` **单槽**」与「**单槽语义**（至多一条待交接）」——容量已是 8；②「（普通回合 = **回合尾兜底转正** + 队列续发）」——缺步边界 pickup（且该表述会被读成回合级）；③「**回合结束后**新回合首条 user 消息 = 该文本」——判据需改**当前步末 pickup**（下一步生效）；④「状态栏提示**三态**逐字」——已四态；⑤「不引入多消息攒批（承 R15 撤销裁定）」——R15 攒批已随 03:01 恢复；⑥「VSC … 单槽」两处——已是容量 8 队列 + 步边界消费。设计侧三链已落；**需求档未落 ⇒ 链不闭合**（本席无需求档笔）。

**设计评审修正轮 1（eng-designer · 2026-09-24）——承 §3 轮次 1（13 项 · 🔴3 / 🟡5 / 🔵5）· 父侧逐条裁定「全部接受」**

**逐号处置（发现号 → 改动 file:line；#4 / #10 = 需求档笔（父侧自办）——本席零触碰）**

| # | 处置 | 改动落点（收正后实读行号） |
|---|---|---|
| 1 | 已收正（同族五处 + 变更记录登记） | `docs/core/design/AGENT-LOOP.md:93`（busy ⇒ **队列受理（容量 8）**）· `:127` · `:423`（并「中止残余单槽消息」→「中止残余消息」）· `:449` **D-AL9**（提交入队列（容量 8）+ 合并消费（R15 恢复）——单槽不变量条退场）· `:479`（R15 行括注改现行结论指向）· 变更记录 +1 轮 |
| 2 | 已收正（CLI 两档九处 + #11 并入） | `docs/cli/design/TUI-INPUT-BOX.md:42` · `:78-79`（**队列（容量 8）**——§4 与 §4.1 同口径）· `:207`；`docs/cli/design/TUI.md:33` · `:135` · `:138-139` · `:548` · `:655`；`:608`「三态分流」→「四态分流」（= #11）；同族补扫 `:35`（挂起空闲单槽 → 入队（容量 8））；两档变更记录各 +1 轮 |
| 3 | 已收正（VSC 两档六处） | `docs/vsc/design/WEBVIEW-PROTOCOL.md:98` · `:142-143`（**队列载体两态（容量 8）**；单槽满 → **满队（第 9 条）**）· `:460`；`docs/vsc/design/WEBVIEW-INPUT.md:33` · `:161`（U-I2）· `:173`（§9 行 1）；两档变更记录各 +1 轮 |
| 4 | 父侧自办（F16 四态枚举——父侧当场收正，见 §1.14）——本席零触碰 | — |
| 5 | 已收正（本条：§2 四处上抛句） | 见下「上抛状态收正（#5）」——落法 = 追加本块（批档 §2 段 append-only——四处原文按段机制不改写 / 不删除；其现行结论以本块为准） |
| 6 | 已收正（受影响文件表改**累计口径**） | 见下「受影响文件表（累计口径——三轮块并读）」 |
| 7 | 已收正（**300 线档位登记**栏补入） | 见下「300 线档位登记（只登记不执行）」 |
| 8 | 已收正（系统轮负向锁用例补入） | 见下用例表新增行 **T-F16-19** / **T-V16-16** |
| 9 | 已收正（常量单源表述） | `docs/cli/design/TUI.md:628`——`QUEUED_MAX_ITEMS`（8）**单源** = `thincoder-cli/src/tui/queued-merge.mjs`（拟新增）导出（显示面 / 输入门禁同源 import）；与 `MAX_MERGE_ITEMS`（8）**同值不同名** |
| 10 | 父侧自办（需求档变更记录补登）——本席零触碰 | — |
| 11 | 已收正（并入 #2） | `docs/cli/design/TUI.md:608`：「三态分流」→「**四态分流**」 |
| 12 | 已收正（实读收正为单坐标） | `AGENT-LOOP.md:216` / `:427`——VSC 端壳循环头统一为 `thincoder-vscode/src/agent.mjs:197`（`opts.turnInput?.()` 消费段；实读 = `drainChildUpstream` 调用在 `:207` 同段邻位） |
| 13 | 已收正（签名行补列） | `AGENT-LOOP.md:201`——`runAgent(…)` opts 补列 `consumeQueuedInput`（与 §6.2 注入族句同口径） |

**上抛状态收正（#5）**：§2 前块四个上抛①（设计轮 / 裁定升级轮增量 / 步边界 fix 轮增量 / fix 轮补记 3）所述「**需求档未落 ⇒ 链不闭合**」**全部收正**：**需求档已落（2026-09-24 F16 裁定升级轮）**——`docs/cli/requirements/TUI.md:37` F16 已按 03:01 / 03:06 / 四态三轮裁定改写（容量 8 / 合并消费 / 步边界 pickup / 四态）；**链已闭**；余项 = 需求档变更记录补登（评审 🔵 #10——父侧自办，见 §1.14）。

**受影响文件表（累计口径——覆盖前三块同名表并读口径；评审 #6）**

| 档 | 文件 | 现况行 | 累计净增（三轮块标注之和） | 预计终值 |
|---|---|---|---|---|
| 核·源 | `thincoder-core/agent.mjs` | 436 | +3 | ~439 |
| CLI·源 | `thincoder-cli/src/tui/queued-merge.mjs`（拟新增） | — | +70（新档） | ~70 |
| CLI·源 | `thincoder-cli/src/tui/queued-pickup.mjs`（拟新增） | — | +45（新档） | ~45 |
| CLI·源 | `thincoder-cli/src/tui/render-conversation.mjs` | 425 | +42（派生块 ~+40 ∧ fix 轮标签改 ~+2） | ~467 |
| CLI·源 | `thincoder-cli/src/tui/render-frame.mjs` | 418 | +3（字面 ~+1 ∧ 四态 ~+2） | ~421 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-busy.mjs` | 43 | +2 | ~45 |
| CLI·源 | `thincoder-cli/src/tui/key-handler-edit.mjs` | 116 | +4 | ~120 |
| CLI·源 | `thincoder-cli/src/tui/agent-turn.mjs` | 378 | +9（取批替换 ~+7 ∧ opts +2） | ~387 |
| CLI·源 | `thincoder-cli/src/tui/suspension-drive.mjs` | 335 | +15 | ~350 |
| CLI·测 | `thincoder-cli/test/busy-injection.test.mjs` | 282 | +118（含 T-F16-18 / 19） | ~400 |
| CLI·测 | `thincoder-cli/test/input-lock.test.mjs` | 396 | +4 | ~400 |
| VSC·源 | `thincoder-vscode/src/agent.mjs` | 495 | +2 | ~497（<500 保持） |
| VSC·源 | `thincoder-vscode/src/extension/queued-merge.mjs`（拟新增） | — | +60（新档） | ~60 |
| VSC·源 | `thincoder-vscode/src/extension/queued-pickup.mjs`（拟新增） | — | +45（新档） | ~45 |
| VSC·源 | `thincoder-vscode/webview/queued-mark.js`（拟新增） | — | +80（新档） | ~80 |
| VSC·源 | `thincoder-vscode/webview/send.js` | 87 | +3 | ~90 |
| VSC·源 | `thincoder-vscode/webview/ui.js` | 491 | +3 | ~494（<500 保持） |
| VSC·源 | `thincoder-vscode/webview/chat-messages.js` | 235 | +5 | ~240 |
| VSC·源 | `thincoder-vscode/webview/state.js` | 127 | +1 | ~128 |
| VSC·源 | `thincoder-vscode/src/extension/panel-messages.mjs` | 338 | +12 | ~350 |
| VSC·源 | `thincoder-vscode/src/extension/suspension.mjs` | 435 | +20 | ~455 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 234 | +11 | ~245 |
| VSC·源 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 185 | +6 | ~191 |
| VSC·文案 | `thincoder-vscode/locales/{zh,en}.json` | 268 / 268 | +1 / +1 | 269 / 269 |
| VSC·测 | `thincoder-vscode/test/queue-visible-vsc.test.mjs`（拟新增） | — | +165（含 T-V16-16） | ~165 |
| VSC·测 | `thincoder-vscode/test/files.mjs` | 134 | +1 | ~135 |

**口径注**：累计 = 现况行 + 三轮块标注净增之和（前三块各只记自身轮次增量 ⇒ 单块「预计后」≠ 终值——本表为准）；**现况行 = 前三轮块口径（as-of 设计日 · 未逐档复核）**。跨文件限：全表 ≤500；`ui.js` ~494 / `src/agent.mjs` ~497 贴限保持；`webview/chat.css` 514 / `test/busy-injection-vsc.test.mjs` 543 = 既有债（本批零加剧）。

**300 线档位登记（评审 #7——只登记不执行；先例 = `AGENT-LOOP-ASYNC-POOL.md` §6.20.4）**

| 档 | 预计终值 | 候选拆分面（评估项——本批不执行） |
|---|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | ~455 | driver 步骤 / 退出残余面抽档 |
| `thincoder-cli/src/tui/render-conversation.mjs` | ~467 | 待发送块派生面（排队块 + 缓存键签名）抽档 |
| `thincoder-core/agent.mjs` | ~439 | 循环头注入族 / 回合收尾面（既有拆分候选） |
| `thincoder-cli/src/tui/render-frame.mjs` | ~421 | §7 状态栏 / `enterHint` 面抽档 |
| `thincoder-cli/test/busy-injection.test.mjs` | ~400 | 用例按族分档（渲染块面 / 合并计划面 / 消费面） |
| `thincoder-cli/test/input-lock.test.mjs` | ~400 | busy 门禁族用例抽档 |
| `thincoder-cli/src/tui/agent-turn.mjs` | ~387 | 送达 / 兜底面抽档 |
| `thincoder-cli/src/tui/suspension-drive.mjs` | ~350 | driver 步骤面抽档 |
| `thincoder-vscode/src/extension/panel-messages.mjs` | ~350 | busy 队列面（快照 / 守卫）抽档 |

**本批只登记不执行**（搬迁 ≠ 本批范围——避免夹带）。

**用例表（本轮新增行——补前两轮块同名表；评审 #8）**

| # | 类 | 输入 | 期望输出 | 宿主 |
|---|---|---|---|---|
| T-F16-19 | 边界（负向锁——系统轮不参与步边界） | `autoTurn: true` 轮传参面：核 loop 桩 + 队列非空（2 条）+ `consumeQueuedInput` 缺省（端侧分流 = `autoTurn ? null : …`） | history 零写入（零合并消息）∧ `pendingInput` 保持 2 条（零消费）∧ 零 `[sending queued message]` ∧ 状态栏含 `已排队 2 条消息` ∧ 待发送块保持 | `thincoder-cli/test/busy-injection.test.mjs` |
| T-V16-16 | 边界（负向锁——系统轮不参与步边界） | 端壳 `runAgent` 桩 + `autoTurn` 轮 + 队列非空（`ro.consumeQueuedInput` 未传） | history 零写入 ∧ 零 `busyQueued` 消费推送（气泡标记保持——快照零变） | `thincoder-vscode/test/queue-visible-vsc.test.mjs` |

**同族扫描（域外同款残留——一致性面，就近收正并逐处列报）**：`docs/cli/design/TUI.md:35`（挂起空闲单槽 → 入队（容量 8）——#2 同句区）· `docs/core/design/SESSION.md:346` / `:349` / `:674`（VSC 标题期窗口「单槽受理 / 唯一拒面 = 单槽满 / 入单槽」→ **队列（容量 8）/ 满队（第 9 条）**；`:349` 送达支数三 → 四）+ 变更记录 +1 轮。

**另有发现（需求档笔——上抛，本席零触碰）**：`docs/core/requirements/PROMPT-SYSTEM.md:46` 边界句「busy 队列机制零动（单槽 / 边界送达 / 无中途 pickup）」= **失效表达**（容量 8 / 合并消费 / 步边界 pickup 已随本批落）——需求档 = 主 agent 笔，待其收正。

**机检读数（修正轮 1 · as-of 2026-09-24 · 本席自跑）**：`node scripts/doc-check.mjs` ⇒ **本批面零闸面新增**——悬空 **8**（逐条 = 基线同，全在他档：`CONSULTATION.md:59` / `MEMORY.md:47` / `SESSION.md:789` / `TOOLS.md:106` / `:114` / `:925` / `:931` ×2）；行宽 **2**（逐条 = 基线同：`BATCH-RECORD.md:358` / `:365`——注：前两轮块记录的「行宽 4（含 `MODEL-BENCH.md:431` / `:856`）」与现跑不符——该两行现已不入闸，非本批面）；用例号悬空 **0**（T-F16-19 / T-V16-16 经本表在册）；拟新增 **15 → 16**（`TUI.md:628` 常量单源句新增一处 `queued-merge.mjs`（拟新增）标记 ⇒ 列报不入闸）。

**收口前文档补述轮（父侧派单 · eng-designer · 2026-09-24）——承 §5 决策透明表 #1–#4 + 待办登记 1 / 2**

**触发与口径**：实施轮（eng-coder #21）交付时披露 4 处「设计档未述而实现必需」（§5 决策透明表 #1–#4）+ 3 档贴限未入 §2「300 线档位登记」（§5 待办登记 2 · 评审 🟡 登记面）。本微轮 = **只动文档**（两档补句各 ×2 + 两档变更记录各 +1 轮 + 本块）——零实现改动、**零新增语义**（逐处只追认已交付实现，对照 §5 登记逐处一致；实现读数照旧 = CLI 815/815 · VSC 951/951——本轮未复跑，实施轮读数在册）。本块 = §2 append-only 段机制下的收口补述（前块条文不改写；其现行增量以本块为准的范围仅限本块所列四处）。

**四处追认（补句 ↔ §5 登记对照——补句落点 = 收正后实读行号）**

| # | §5 登记（决策透明表） | 补句落点（收正后实读） | 补句要点（与实现同口径） |
|---|---|---|---|
| 1 | #1 块体行 `_skipDimFold`（连 dim 折叠豁免——设计只述意图「永不被折走」未点名机制） | `docs/cli/design/TUI.md:628`（§7.5 新增「体行折叠豁免（`_skipDimFold`——收口轮补述）」条） | 原文行 / 尾标记行携 `_skipDimFold`（`thincoder-cli/src/tui/render-conversation.mjs:380` / `:383`）——连 dim 折叠 pass（`FOLD_LINES` = 8）命中任一带标记行 ⇒ 整块不折（`:398`）；零新机制（复用既有豁免——先例 = 思考流 / advisor 收缩尾）。 |
| 2 | #2 块体 wrap 口径 = `cols - 1`（设计逐字；编号前缀未扣——遗留观察） | `docs/cli/design/TUI.md:629`（§7.5 新增「宽度口径（收口轮补述）」条） | 折行宽 `cols - 1` 作用于逐条原文、`i. ` 编号前缀**不预先扣除**（`thincoder-cli/src/tui/render-conversation.mjs:375`）；编号首行总显示宽可超至多 3 列（终端软折行——**登记**：如需扣前缀另轮评估）。 |
| 3 | #3 VSC 标记匹配第三支（末条同 `data-raw` 未标记气泡 ⇒ 就地标记，不新建） | `docs/vsc/design/WEBVIEW-INPUT.md:47`（§1 C-B2-6 细则⑦「标记」条收正为**三支判据序**） | ① 已标记（`data-raw` 相等）⇒ 保持；② 未标记但存同文气泡（取末条）⇒ 就地标记（不新建——`thincoder-vscode/webview/queued-mark.js:83-85`）；③ 无同文气泡 ⇒ 新建。原「两支」表述收正。 |
| 4 | #4 步边界对携 `images` 的批让位 + 载体面贴图批退化逐条 | `docs/vsc/design/WEBVIEW-INPUT.md:30`（细则② ⓪ 让位句）+ `:34`（载体面退化句） | 同步面无异步降级 ⇒ 携图批不消费（留既有送达路径——同过 F-1 判定，不静默丢图；`thincoder-vscode/src/extension/queued-pickup.mjs:36`）；载体面取批携图 ⇒ `count = 1` 逐条取（图片随条目元数据走 F-1 降级面；`:53`）。 |

**变更记录（涉及两档各 +1 轮——打标「收口前补述（父侧/设计侧）」）**：`docs/cli/design/TUI.md:694-696` · `docs/vsc/design/WEBVIEW-INPUT.md:222-224`。

**300 线档位登记（补 3 行——续前块九行表；只登记不执行）**

| 档 | 预计终值 | 候选拆分面（评估项——本批不执行） |
|---|---|---|
| `thincoder-vscode/webview/ui.js` | 494 | 消息 / 工具卡 DOM 构建面（`buildUserMessage` / `addUser` / `addTool` / `finishTool*` 族）抽档 |
| `thincoder-vscode/src/agent.mjs` | 496 | 主环体（`runAgent` 主环 + 无工具 / 工具分支）∥ 端差适配段（`:411` 起）分面抽档 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 495 | 薄委托族（`_*` 委托块——session / mcp / status / project 域）按域抽档 |

**三档行数复核（本席自跑——末尾换行不计）**：`webview/ui.js` **494** · `src/agent.mjs` **496** · `src/extension/chat-panel.mjs` **495**——与 §5 实测逐字一致。

**机检读数（补述轮终态 · as-of 2026-09-24 · 本席自跑）**：`node scripts/doc-check.mjs` ⇒ **本批面零闸面新增**——悬空 **8**（逐条 = 基线同，全在他档：`CONSULTATION.md:59` / `MEMORY.md:47` / `SESSION.md:789` / `TOOLS.md:106` / `:114` / `:925` / `:931` ×2）；行宽 **2**（逐条 = 基线同：`BATCH-RECORD.md:358` / `:365`）；用例号悬空 **0**；路径/坐标候选 8423 → **8428**（+5 = 本轮新坐标，全部解析在案）；符号·宽候选 12399 → 12404（报告面，不入闸）；拟新增 **8**（零变）。

**本轮边界（零改对照）**：实现代码零触碰；`WEBVIEW-PROTOCOL.md` / `TUI-INPUT-BOX.md` / 核档 / 需求档零触碰（需求档 = 主 agent 笔）；前块条文不改写（append-only——本块所列四处之外零改判）。

**收口前补述轮 2（协议档 `busyQueued.text` 语义收正 · 父侧派单 · eng-designer · 2026-09-24）——承 §5 决策透明表 #7 + 待办登记 5**

**触发与口径**：§5 决策透明表 #7 / 待办登记 5 记「协议档 `text` 语义待与实现逐字对账」（复核实读 = 两说仅受理时刻重合，其余推送点分叉）。本微轮 = **只动文档**：协议档两处描述收正 + 该档变更记录 +1 轮；实现零触碰；**零新增语义 / 零新增字段**（字段面零改——只收正「描述」）。

**逐处收正（改后句 ↔ 实现实读对照）**

| # | 落点（收正后实读行号） | 改后句（`text` 段逐字） | 实现依据（本席实读） |
|---|---|---|---|
| 1 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:63`（§3 表 `busyQueued` 行） | `text` = 队列末项原文（队列非空即携——受理 / 消费 / 忙判 / 握手各推送点同式；webview 不读） | `thincoder-vscode/src/extension/panel-messages.mjs:108`（`items[items.length - 1]?.text`）+ `:114`（`text !== undefined` 才携 ⇒ 队列非空即携）；推送点同式 = `:100-102` 注（受理 / 五消费点 / 忙判 / 握手） |
| 2 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:99`（§3.2 行 17） | 同上；原「（标记源）」归 `items`（退场） | 同上 + `thincoder-vscode/webview/queued-mark.js:78-85`（标记逐条读 `items`） |

**webview 消费方实读结论（复核前轮 #24 · 本席一手核）**：消费单点 = `case "busyQueued"`（`thincoder-vscode/webview/chat-messages.js:101-102`）→ `applyBusyQueued`（`thincoder-vscode/webview/queued-mark.js:63-88`）——读 `count` / `pending` / `merged` / `items` 四字段；**`text` 零读**（`queued-mark.js` 全档 `text` 命中 = 档头注释字段面清单一处，非消费）。结论 = **不读**（措辞 = 注册字段 / 未消费——与 §5 #7 同判）。

**`WEBVIEW-INPUT.md` 零触报告（派单 ② 实读）**：全档 `text` 命中 4 处——`:40`（贴图降级「描述注入 text」· 别语义）· `:80` / `:127`（textarea 折行面 · 别语义）· `:211`（变更记录引协议档 `text` 增字段 · 记录面零语义）；细则⑦ 判据源字段列 = `busyQueued { pending, count, items, merged? }`（`:46`——消费面清单，与本收正同口径）。**零触**。

**需求档复核（顺带 · 本席只读面）**：`docs/cli/requirements/**` 与 `docs/vsc/requirements/**` 全档 `busyQueued` / `text` **零命中** ⇒ §5 待办登记 5 的「需求 F16」项无实际收正面（零触）。

**同族扫描（全仓 `docs`）**：`text` 语义（busyQueued 面）规范性面 **仅协议档两处**（已收正）；其余命中全为记录面——本档 §2 前块 `:136`（锚定三支判据源 `{ pending, text }`）/ `:177`（「两载体 head」）/ `:208`（D-QV5「`text` 恒携槽内项原文」）+ 协议档 `:504`（设计轮变更记录「待发送气泡锚定 / 新建的原文源」句）——**append-only / 记录面不改写，只登记**；现行结论 = 本块（已收正两处 + 本节）。

**协议档变更记录**：新轮 = `docs/vsc/design/WEBVIEW-PROTOCOL.md:492-494`（打标「收口前补述 · 父侧/设计侧」）；原各轮顺移（修正轮 1 = `:496` · fix 轮 = `:498-500` · 裁定升级轮 = `:502-503` · 设计轮 = `:504-506`）。

**机检读数（本席自跑 · as-of 2026-09-24）**：`node scripts/doc-check.mjs`（根 = `thincoder`）⇒ 本批面**零新增闸面**——悬空 **8**（逐条 = 基线同：`CONSULTATION.md:59` / `MEMORY.md:47` / `SESSION.md:789` / `TOOLS.md:106` / `:114` / `:925` / `:931` ×2——全在他档 `docs/core/design/**`）；行宽 **5** = `BATCH-RECORD.md:358` / `:365`（基线同）+ `MODEL-BENCH.md:376` / `:483` / `:979`（**非本批面**——本席零触碰；该档工作树现为 M 态，与他批在飞改动并存）；用例号悬空 **0**；拟新增 **8**；路径/坐标候选 **8442**（上轮读数 8428——增量含他批在飞面；本批新坐标全部解析在案）。

协议门两档复跑**零回归**（工作树 = `thincoder-vscode`）：`node test/protocol-coverage.test.mjs` **4 pass / 0 fail** · `node test/protocol-coverage-reverse.test.mjs` **3 pass / 0 fail**。

**边界（零改对照）**：实现代码零触碰；`pending` / `count` / `items` / `merged` 四字段语义零改；零新增字段；`WEBVIEW-INPUT.md` / 需求档 / 核档 / CLI 面零触碰；批档前块零改写（append-only）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审 · busy-queue-visible 批（8 档就地更新面）· as-of 2026-09-24 · 发现 13 项（🔴 3 / 🟡 5 / 🔵 5）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 核母档同机制两处相反：`AGENT-LOOP.md:449`（D-AL9「busy 时**提交入单槽**…**单槽不变量（多槽排队 / 攒批不引入**——防 digest 后置意图污染）」）与 `AGENT-LOOP-ASYNC-POOL.md:17-22` / `:24-42`（容量 8 + 合并消费 R15 + 步边界 pickup）互斥；同族残留 `AGENT-LOOP.md:93`（`routeUserTurn` busy ⇒ 单槽受理）· `:127` · `:423` · `:479`（「结论（排队整批废弃、`pendingInput` 单槽）已入 §6.8」）亦未随本批收正（前批先例 = `AGENT-LOOP.md:506-507`「同族残留三处 + 决策一处收正」） | 同族逐处就地收正（D-AL9 改为「提交入队列（容量 8）+ 合并消费（R15 恢复）」；`:93` / `:127` / `:423` 的「单槽受理」改「队列受理（容量 8）」；`:479` 括注改现行结论指向），并在该档变更记录登记本批一轮 |
| 2 | Document ownership | 🔴 | CLI 两档同机制两处相反：`TUI-INPUT-BOX.md:78-79`（「消息入 **`state.pendingInput` 单槽**（**至多一条待交接——见 §4.1**）」）与**同档** `:113`（条件 5 = `length < QUEUED_MAX_ITEMS`（容量 8））互斥；同族活体残留 `TUI-INPUT-BOX.md:42` · `:207`（模块地图「busy 期**单槽**注入门禁」）· `TUI.md:33` · `:135` · `:138-139`（「`pendingInput` **单槽**（至多一条待交接）」）· `:548` · `:655`（§7.5 VSC 对位行「**单槽**载体两态」） | 上述行逐处收正为「队列（容量 8）/ 多槽」口径（`TUI-INPUT-BOX.md` 系自述「输入框唯一行为契约」——§4 与 §4.1 必须同口径）；`TUI.md:608`「三态分流」同轮改「四态」 |
| 3 | Document ownership | 🔴 | VSC 两档同机制两处相反：`WEBVIEW-PROTOCOL.md:142-143`（§4.1「**单槽**载体两态…**单槽满** ⇒ 提交不出泡 / 不清框 / toast」）与 `:63` / `:99`（容量 8 快照 + 守卫 `count >= 8`）、`WEBVIEW-INPUT.md:19` / `:22-27`（C-B2-6 正文与细则① 容量 8）互斥；同族活体残留 `WEBVIEW-PROTOCOL.md:98`（§3.2 行 16「host **单槽**载体两态」）· `:460`（§12 对表备注同句）· `WEBVIEW-INPUT.md:33`（细则③「会话在飞同入会话**单槽**」）· `:161`（U-I2「唯一 busy 拒面 = **单槽满**」）· `:173`（§9 行 1 同句） | 上述行逐处收正为「队列（容量 8）/ 满队（第 9 条）⇒ 不出泡 / 不清框 / toast」；§12 对表备注与 §3.2 行 16 同步（同一判据两处成文） |
| 4 | Requirements | 🟡 | 需求档 F16 四态枚举与设计表成员不一致：`docs/cli/requirements/TUI.md:37`「状态栏提示**四态**逐字（普通 busy / 挂起内用户回合 / 挂起内系统轮 / **队满**）」vs `TUI.md:616-619` 四态表（**队列非空** / 普通 busy / 挂起内用户回合 / 挂起内系统轮）；「队满」= 输入区提示行（`TUI-INPUT-BOX.md:120`），非状态栏态 | 需求档 F16 四态枚举收正为「队列非空（`已排队 N 条消息`）/ 普通 busy / 挂起内用户回合 / 挂起内系统轮」（R7b：设计层为准）；队满面另述为「第 9 条拒 + 提示 + 文本保留」 |
| 5 | Clarity | 🟡 | 批次档对需求档现状的描述已过时：`2026-09-24-busy-queue-visible.md:210` / `:305` / `:380` / `:388` 均称「**需求档未落 ⇒ 链不闭合**」，并在 `:388` 逐条列 F16:37 的六条「残留」（①单槽 ②回合尾兜底 ③回合结束后 ④三态 ⑤不引入攒批 ⑥VSC 单槽）——实读 `docs/cli/requirements/TUI.md:37` 已按 03:01 / 03:06 两轮裁定改写（容量 8 / 步边界 pickup / 合并消费 / 四态），该六条已不在档（该档唯一「单槽」= `:95` 变更记录内的历史句） | 该四条上抛句就地收正为「需求档已落（2026-09-24 F16 裁定升级轮）」，或改述为「链已闭、余项 = 需求档变更记录补登」 |
| 6 | Clarity | 🟡 | 受影响文件表口径混用（累计 / 本轮增量），同文件目标值互斥：`agent-turn.mjs` 378 → **~385**（批档 `:245`）vs 378 → **~380**（批档 `:349`）；`render-frame.mjs` 418 → **~419**（`:242`）vs 418 → **~420**（`:350`）；`busy-injection.test.mjs` 282 → **~400** 于 `:247` 与 `:352` 同时出现（未含 fix 轮新增用例） | 三张表改**累计口径**（每档给「预计终值」并注明相对上轮的净增），或表头显式标注「本轮增量 +N（与上轮并读）」——否则无法据表判定贴限 / 越限 |
| 7 | Affected-file size | 🟡 | 判据 8 的 >300 行档位缺**拆分评审**：本批推动 / 贴限的 300+ 档（`render-conversation.mjs` ~465 · `suspension.mjs` ~455 · `input-lock.test.mjs` ~400 · `busy-injection.test.mjs` ~400 · `agent-turn.mjs` ~385 · `suspension-drive.mjs` ~350 · `panel-messages.mjs` ~350 · `render-frame.mjs` ~420）在表中只有「全表 ≤500」跨文件限（批档 `:179` / `:267` / `:358`）与既有 >500 债登记，无 300 线档的拆分评审 / 候选拆分面登记（先例 = `AGENT-LOOP-ASYNC-POOL.md` §6.20.4「拆分计划（超档项）——只登记不执行」） | 补一栏「300 线档位登记」：逐档给候选拆分面 + 「本批只登记不执行」口径（或明示「本批净增 ≤N、无越线」） |
| 8 | Acceptance criteria | 🟡 | D-QV13（`batch:373`——系统轮不参与步边界：digest / 上行唤醒轮不传 pickup 回调）无锁定用例：用例表 `:269-284` / `:360-365` 中 T-F16-18（`:364`）只覆盖「用户回合 + 空队列」，VSC T-V16-15（`:365`）同为用户回合面 | 补一条负向锁用例（`autoTurn: true` 轮内队列非空 ⇒ history 零写入 / 零 `busyQueued` 消费推送 / 块保持），宿主同 T-F16-18 / T-V16-15 |
| 9 | Clarity | 🟡 | 合并常量单源口径歧义：`TUI.md:628`「队容量 = `QUEUED_MAX_ITEMS`（8——与合并批上限**同常量**；常量住 `render-conversation.mjs` / `queued-merge.mjs`）」——「同常量」与「住两档」并述；批档 `:240` 又把 `MAX_MERGE_ITEMS`(8) / `QUEUED_MAX_ITEMS`(8) 并列于 `queued-merge.mjs` | 改为单源表述（`queued-merge.mjs` 导出，`render-conversation.mjs` 同源 import；或明示两常量各自语义 + 相等关系），避免显示面 / 机制面各持一份常量 |
| 10 | Doc hygiene | 🔵 | 需求档 `docs/cli/requirements/TUI.md` 变更记录无 2026-09-24 条目（F16 裁定升级轮未登记；该档最近条目 = 2026-09-22 busy-extend） | 补一条变更记录（F16 三轮扩写：可见性 / 多槽 8 / 合并消费 / 步边界 pickup） |
| 11 | Doc hygiene | 🔵 | `TUI.md:608` 提交时行仍写「busy 提示段**三态分流**」，同节表已四态（fix 轮收正未及该行） | 该行「三态」→「四态」 |
| 12 | Clarity | 🔵 | VSC 端壳循环头坐标两说：`AGENT-LOOP.md:216`（`thincoder-vscode/src/agent.mjs:197` 邻位——`opts.turnInput?.()` 消费段之后）vs `AGENT-LOOP.md:427`（`drainChildUpstream` 于 `:179` 邻位——紧随 `opts.turnInput?.()` 消费段） | 实施轮以实读收正为单坐标（源档不在本评审计范围，未核） |
| 13 | Clarity | 🔵 | `AGENT-LOOP.md:201` 的 `runAgent(...)` 签名行未列新 opts `consumeQueuedInput`（同档 `:214` 已述该成员） | 签名行补列（与 §6.2 注入族句同口径） |

**范围与未核项**：① 受影响文件表内的一切**现况行数**（如 `render-conversation.mjs` 425 / `webview/ui.js` 491 / `chat.css` 514 / `busy-injection-vsc.test.mjs` 543 / `thincoder-vscode/src/agent.mjs` 495 等）**未抽查**——源档不在本次声明评审范围（评审只读声明面 9 档），判据 8 的「抽查」项标 **unverified**；② 批档自跑的 `doc-check.mjs` 读数（悬空 8 / 行宽 4 / 拟新增 15）与 R15 旧实现逐字（`formatMergedMessages` / `planQueuedInput` / 归档档）同样 **unverified**（不在评审范围，未复跑）；③ 无项目标准档与文档地图声明（判据 3 / 7 按 AGENTS.md 与档内自述口径判）。

**计数**：🔴 3 · 🟡 5 · 🔵 5（共 13）——🔴 = 1 / 2 / 3（同机制两处相反：核档 · CLI 档 · VSC 档）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**设计评审轮 2（修正验证轮）· busy-queue-visible 批 · as-of 2026-09-24 · 复核轮 1 十三项（全数逐处实读）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/AGENT-LOOP.md` | 🔴 | Fixed | `:449` 现文「busy 时**提交入队列**（`pendingInput`——**容量 8 条**；普通 / 会话内 busy 同判据；吞面收敛四 = 模态 / 斜杠 / 空 / **队满（第 9 条）**）（**2026-09-24 queue-visible 批修订**……）」——单槽不变量条退场；`:93`「`routeUserTurn` busy ⇒ 队列受理（容量 8……」· `:127` · `:423` · `:479`「**现行机制**（队列容量 8 + 合并消费（R15 形态恢复）+ 步边界 pickup）已入 `AGENT-LOOP-ASYNC-POOL.md` §6.8」同族四处全收；变更记录 `:504-506` 在册 |
| 2 | 2 | `docs/cli/design/TUI-INPUT-BOX.md` · `docs/cli/design/TUI.md` | 🔴 | Fixed | `TUI-INPUT-BOX.md:42`「提交（busy 期 = §4.1 入队受理——队列容量 8）」· `:78`「消息入 **`state.pendingInput` 队列**（**容量 8——见 §4.1**……」· `:207`「`pendingInput` 队列（容量 8）可达化」——与同档 `:113` 条件 5 同口径；`TUI.md:33` / `:135`「**Enter 提交 = busy 队列受理（容量 8）**」/ `:138-139`（满队（第 9 条）拒 + 提示 + 文本保留）/ `:548` / `:655`「队列载体两态（容量 8）」· `:35` 全收；变更记录 = `TUI-INPUT-BOX.md:383` · `TUI.md:692-694` |
| 3 | 3 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` · `docs/vsc/design/WEBVIEW-INPUT.md` | 🔴 | Fixed | `WEBVIEW-PROTOCOL.md:142-143`「队列载体两态（容量 8）……满队（第 9 条）⇒ 提交不出泡 / 不清框 / toast——二次提交守卫」· `:98`「host 队列载体两态（容量 8）」· `:460` 同收；`WEBVIEW-INPUT.md:33`「同入会话队列（容量 8）」· `:161`（U-I2「**唯一 busy 拒面 = 满队（第 9 条）**」）· `:173`；变更记录 = `:492` · `:218` |
| 4 | 4 | `docs/cli/requirements/TUI.md` | 🟡 | Fixed（父侧笔） | `:37`「状态栏提示**四态**逐字（**队列非空**（「已排队 N 条消息」）/ 普通 busy / 挂起内用户回合 / 挂起内系统轮……；队满面 = 第 9 条拒 + 输入区提示 + 文本保留）」——队满退出状态栏态枚举、队列非空补入 |
| 5 | 5 | `docs/batches/2026-09-24-busy-queue-visible.md` | 🟡 | Fixed | `:414`「**上抛状态收正（#5）**：§2 前块四个上抛①……**全部收正**：**需求档已落（2026-09-24 F16 裁定升级轮）**……**链已闭**」+ `:404`（append-only 段机制：原文不改写、现行结论以本块为准 = 记录面合规） |
| 6 | 6 | 同上（受影响文件表） | 🟡 | Fixed | `:416-447` 累计口径表（逐档「累计净增（三轮块标注之和）」+「预计终值」）+ `:447` 口径注；抽查核算自洽（`render-conversation` 425+42=467 · `agent-turn` 378+9=387 · `busy-injection.test` 282+118=400 · 核 `agent.mjs` 436+3=439 · VSC `agent.mjs` 495+2=497 · `suspension.mjs` 435+20=455） |
| 7 | 7 | 同上（300 线档位登记） | 🟡 | Fixed | `:449-463` 九档登记（预计终值 + 候选拆分面）+ `:463`「**本批只登记不执行**（搬迁 ≠ 本批范围）」 |
| 8 | 8 | 同上（用例表） | 🟡 | Fixed | `:469` T-F16-19 / `:470` T-V16-16 负向锁（`autoTurn` 轮传参面 ⇒ history 零写入 / `pendingInput` 保持 2 条 / 零消费推送 / 块保持） |
| 9 | 9 | `docs/cli/design/TUI.md` | 🟡 | Fixed | `:628`「**常量单源** = `thincoder-cli/src/tui/queued-merge.mjs`（拟新增）导出，显示面 / 输入门禁同源 import；与合并批上限 `MAX_MERGE_ITEMS`（8）**同值不同名**」 |
| 10 | 10 | `docs/cli/requirements/TUI.md` | 🔵 | **Unfixed（非阻塞）** | 变更记录（`:90-106`）最新条目仍 = 2026-09-22（无 2026-09-24 queue-visible 条目）；设计席无该档笔，批档 `:109` 自认「余项：需求档变更记录补登 = 父侧自办」⇒ 协调项（R5） |
| 11 | 11 | `docs/cli/design/TUI.md` | 🔵 | Fixed | `:608`「busy 提示段**四态分流**（逐字见下表）：队列非空 ⇒ ` │ 已排队 N 条消息`……」 |
| 12 | 12 | `docs/core/design/AGENT-LOOP.md` | 🔵 | Fixed | `:216` 与 `:427` 双处统一为 `thincoder-vscode/src/agent.mjs:197` 邻位（`opts.turnInput?.()` 消费段）——两说收正为单坐标 |
| 13 | 13 | `docs/core/design/AGENT-LOOP.md` | 🔵 | Fixed | `:201`「`runAgent(agent, input, callbacks, { depth, signal, maxTurns, resume, autoTurn, suspDriven, consumeQueuedInput })`」 |

**域外注（不属本次声明评审面，仅登记，不评severity）**：`docs/core/design/SESSION.md:346/:349/:674`（批档 `:472` 自报同族收正已落）· `docs/core/requirements/PROMPT-SYSTEM.md:46` 边界句「busy 队列机制零动（单槽 / 边界送达 / 无中途 pickup）」= 失效表达（批档 `:474` 已上抛、待父侧笔）。

**范围与未核项（沿轮 1）**：① 受影响文件表一切**现况行数**（源档不在本次只读声明面）**未抽查** ⇒ 判据 8 抽查项 **unverified**；② 批档自跑 `doc-check.mjs` 读数与 R15 旧实现逐字（`formatMergedMessages` / `planQueuedInput` / 归档档）**unverified**（未复跑 / 不在范围）；③ 修正轮新增「同族扫描」域外落点（SESSION.md 三处）不在本次评审面，未核。

**计数**：🔴 0（轮 1 三项全数落地）· 🟡 0 未决 · 🔵 1 未决（#10——父侧笔协调项）——本轮未引入新 🔴 / 新 🟡。

VERDICT: pass

（令牌与 designId 未在档内手写——工具机械剥离凭证值。）

## §4 用户批准（主 agent）

**2026-09-24 03:48 父侧代签**——依据用户 03:48 授权「**后续自动跑到排空**」（同 2026-09-20 先例：设计评审点火权 + §4 批准权均委托父侧，自缚三条件；新范围 / 用户口径裁决仍停下）。

**三条件核验**：① 设计评审 **pass（0🔴）**——轮 2（reviewId `5223050b` · 🔴 0 未决 / 🟡 0 未决 / 🔵 1）+ §3 双表在册；② **修正轮 #16 已落地并经父侧核验**——轮 2 逐项 13 项复核（12 项落地 + #10 需求档变更记录由父侧本轮补登 `TUI.md:92-94`）；③ **token 已签发**（值零落档——运行时凭证）。

**批准范围** = 本批全量实施（任务书 = 批档 §2 · 设计面 = 需求档 TUI + TUI 设计三档 + AGENT-LOOP 双档 + VSC 双档）——实施轮 = eng-coder（初轮）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（三端落地（核缝 + CLI + VSC）；偏离审计 1 轮 + 代码评审 1 轮（pass）；两仓门禁 815/951 全绿）


### 实施摘要（27 档 = 5 新档 + 22 改档）

- **核**：`thincoder-core/agent.mjs` —— `runAgent` opts 增 `consumeQueuedInput`（缺省 `null`，headless 零开销）+ 循环头第 3 成员（落 `drainChildUpstream` 之后，`pushReal` 语义由端侧闭包自持）。
- **CLI 源**：新 `thincoder-cli/src/tui/queued-merge.mjs`（常量 `MAX_MERGE_ITEMS` 8 / `MAX_MERGE_CHARS` 2000 / `QUEUED_MAX_ITEMS` 8 + `formatMergedMessages` + `planQueuedInput`——R15 逐字恢复）· 新 `thincoder-cli/src/tui/queued-pickup.mjs`（步边界 pickup）。
  改 `render-conversation.mjs`（流尾待发送块 + `convCacheKey` 排队签名 + `QUEUED_ITEM_MAX_LINES` 3）· `render-frame.mjs`（状态栏条数段 + `enterHint` 四态）· `key-handler-busy.mjs` / `key-handler-edit.mjs`（容量 8 + 满队字面 + F4 恢复跟随）· `agent-turn.mjs`（opts 传参 + 回合尾按计划取批）· `suspension-drive.mjs`（driver 步骤 1 取批 + 中止残余全量按计划转 queue）。
- **VSC 源**：新 `src/extension/queued-merge.mjs`（双端同名同值）· `src/extension/queued-pickup.mjs`（载体两态 + 计划取批 + 贴图批退化）· `webview/queued-mark.js`（待发送标记面：逐条标记 / 清标保留 / 多批合泡 / 防悬空 / 引用失效守卫）。
  改 `panel-messages.mjs`（快照 `{pending,count,items,text,merged?}` + 两载体合计满队判决）· `suspension.mjs`（driver 取批 + 退出残余取批 + 消费快照）· `panel-turn-stages.mjs`（装载①快照 / 装载②取批）· `panel-turn-loop.mjs`（`ro.consumeQueuedInput` = `autoTurn ? null : …`）· `src/agent.mjs`（端壳循环头同址调用）· `webview/{send,ui,chat-messages,state}.js`（守卫 `count >= 8` / `data-raw`+`data-ts` / 快照 case / `_busyQueuedCount`）· `locales/{zh,en}.json`（`queued.pending` 新增 + `input.slotFull` 值改）。
- **测试**：CLI `test/busy-injection.test.mjs`（+T-F16-10…19）· `test/input-lock.test.mjs`（容量阈收正）；VSC 新 `test/queue-visible-vsc.test.mjs` / `test/queue-visible-shell.test.mjs` + `test/files.mjs` 登记 + 既有两档容量阈收正。

### 测试读数（本席实跑——命令与读数逐条）

| 门 | 命令 | 读数 |
|---|---|---|
| CLI 门禁 | `cd thincoder-cli && npm test`（= `node test/run.mjs`） | **815 pass / 0 fail**（suites 14，duration ≈34.7s） |
| VSC 门禁 | `cd thincoder-vscode && npm test`（= `node test/run.mjs`） | **951 pass / 0 fail**（含协议门 `protocol-coverage{,-reverse}` 两档，duration ≈55.4s） |
| 语法 | `npm run lint`（两仓） | CLI `213 file(s) OK` · VSC `258 JS files OK` |
| 文档闸 | `cd thincoder-vscode && npm run doc:check` | 悬空 8 / 行宽 2 = 设计轮基线逐条同（全在他档 `docs/core/design|requirements/**`；本批零触碰文档） |

行数实测（≤500 硬限；末尾换行不计）：核 `agent.mjs` 440 · CLI 新 68 / 34 · `render-conversation` 460 · `render-frame` 423 · `key-handler-busy` 47 · `key-handler-edit` 119 · `agent-turn` 384 · `suspension-drive` 341 · CLI 测 474 / 403 · VSC `src/agent.mjs` 496 · VSC 新 64 / 57 / 88 · `send.js` 88 · `ui.js` 494 · `chat-messages` 236 · `state.js` 128 · `panel-messages` 357 · `suspension` 448 · `panel-turn-stages` 236 · `panel-turn-loop` 188 · `chat-panel` 495 · VSC 测 172 / 139 / 136 · locales 268 / 268。
（超 500 者仅既有债：`test/busy-injection-vsc.test.mjs` 546（设计日 543 ⇒ 本批 +3）· `webview/chat.css` 514（零改、零新 CSS 类）。）

### 决策透明表（设计档未述处的实现裁定——均已在代码注释内注明）

| # | 事项 | 裁定与依据 |
|---|---|---|
| 1 | CLI 待发送块体行 `_skipDimFold`（连 dim 折叠豁免） | 设计只述意图「永不被折走」（§7.5 形态锚）未点名机制；条数 ≥3 时 dim 连跑必超 `FOLD_LINES`(8) ⇒ 用既有豁免机制显式豁免（零新机制） |
| 2 | 块体 wrap 口径 = `cols - 1`（设计逐字） | 偏离审计指出我先前的 `cols - 1 - 3`（编号前缀扣除）为设计外改动 ⇒ **已按设计逐字收正**；遗留观察：多条态首行 `i. ` 前缀可使该行超宽 3 列（终端软折行）——设计侧如认为需扣前缀，请补句后另轮改 |
| 3 | VSC 标记匹配第三支（末条同 `data-raw` 未标记气泡 ⇒ 就地标记，不新建） | 依据 = 批档用例表 T-V16-12②（「同文气泡就地标记——不新建」）；与 `WEBVIEW-INPUT.md` 细则⑦「两支」表述相抵 ⇒ 设计侧待补句 |
| 4 | VSC 步边界对携 `images` 的批让位（不消费，留既有送达路径）+ 载体面取批贴图批退化 `count = 1` | 步边界回调是同步面，F-1 视觉降级（异步读图）不可达；照取批会静默丢图（违「不静默丢」纪律）⇒ 让位 / 退化；设计未述，待补句 |
| 5 | VSC webview 侧 `QUEUED_MAX_ITEMS` 副本（`webview/queued-mark.js` 导出） | 浏览器面不 import 扩展模块 ⇒ 双写登记（值对拍锁 = T-V16-14）；与 N3「页大小常量双端各自持有」先例同规 |
| 6 | VSC 消费推送 `merged` = 本批文本（单条批 = 原文 / 多条批 = R15 合并文本） | 单条批也发 `merged` 才能触发 webview「清标保留」支（细则⑦ 判据 = 与已标记气泡原文相等）；纯挂起面（无已标记气泡）零动作、防重复建泡 |
| 7 | `pushBusyQueued` 快照 `text` 字段 = 队列末项原文（非空即携） | 协议 §3.2 行 17 已注册 `text?`；快照语义（幂等重推），webview 不读它（字段集 ⊆ 注册集由 T-V16-15/15b 自锁） |

### 受影表外改动（逐项 + 理由——全部披露）

| # | 档 | 类型 | 理由 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/key-handler.mjs` | 注释 1 行 | 序 4 门禁措辞「单槽受理」→「队列受理（容量 8）」 |
| 2 | `thincoder-cli/src/tui/turn-face.mjs` | 注释 2 行 | submit 防御面措辞收正（设计 `TUI-INPUT-BOX.md` §4.1 预告「注释随判据收正同步更新」，受影表未列该档） |
| 3 | `thincoder-vscode/src/extension/chat-panel.mjs` | **行为 1 处** + 注释 5 处 | `_chat` 会话载体满队守卫 `> 0` → `>= QUEUED_MAX_ITEMS`（+ 单源 import）：容量 8 必须在第二守卫同源，否则会话载体第 2 条即被拒（routeUserTurn 前置守卫常态遮蔽本支——防御面）；注释为「单槽」口径收正 |
| 4 | `thincoder-vscode/test/busy-injection-vsc.test.mjs` | 断言收正 | T-V16-5 / T-V16-8 / T-V16-2 / T-V16-7 容量阈 1 → 8（对位 CLI `input-lock.test.mjs` 同款收正）；行数 543 → 546（既有债超限档 +3） |
| 5 | `thincoder-vscode/test/chat-panel-messages.test.mjs` | 断言收正 | ① / ⑪ 容量阈 1 → 8（并补满队拒收新格） |
| 6 | `thincoder-vscode/test/queue-visible-shell.test.mjs` | 新档（第二测档） | happy-dom 全局 `fetch` 劫持与 mock-llm 本地链路不可同进程 ⇒ 端壳面（T-V16-15 / 16 / 16b / 13b）分档；用例号与断言面零变 |

### 用例面增减（§2 用例表外——D3 计数登记）

§2 用例表 T-F16-10…19 / T-V16-11…16 全落地（16 行）；另加 3 个加测格：T-V16-13b（会话退出残余取批 + 消费快照）、T-V16-15b（受理面快照字段面）、T-V16-16b（端壳分流机检）；CLI 侧 T-F16-13 附加入队恢复跟随断言（F4）。加测格未入 §2 表——以本节为登记面。

### 审计与代码评审轮次（终态 clean）

1. **内部 explore 偏离审计（1 轮）**：结论 DEVIATIONS（3 实质 + 6 表外/登记面）。处置：① `wrapCols` 设计外扣减 ⇒ **自修收正为设计逐字**（决策表 #2）；② `_skipDimFold` / VSC 第三支 / 贴图让位 ⇒ 保留 + 披露（设计缺口登记，决策表 #1/#3/#4）；③ 表外面 ⇒ 逐项登记（受影表外改动 1–6）；④ 工作树内临时件（R15 旧件副本 + 测试长输出日志）⇒ 已删（零残留）。
2. **内部 advisor 代码评审（1 轮，全量 26 档）**：VERDICT **pass**（🔴 0 · 🟡 1（可选·登记面）· 🔵 4）。评审后应用收正：🔵「同批改动面注释仍写单槽」——`suspension.mjs` 2 处 + `chat-panel.mjs` 3 处措辞改「队列（容量 8）」（注释面，零行为）。
   评审未核项（如实登记）：两端门禁未由评审复跑（由本席实跑——读数见上）；VSC 协议档 `text` 字段语义未与协议原文逐字对账；设计档仅读点名段。
3. **自修轮次 = 2 轮**（审计后合规收正 1 处 + 线数收窄；评审后注释面收正 5 处）——每轮后重跑相关用例与两仓门禁（读数见上，末轮后全绿）。

### 待办登记（交父侧 / eng-designer；非本席笔）

1. **设计档 §7.5 待补句四处**：① 待发送块体行折叠豁免（`_skipDimFold`——把「永不被折走」写成机制句）；② 多条态 wrap 口径（`cols - 1` vs 编号前缀扣除）；③ 细则⑦ 标记第三支（同文未标记气泡就地标记）；④ C-B2-6 细则② ⓪ 贴图批让位 / 退化句。
2. **300 线档位登记补登**：`thincoder-vscode/webview/ui.js`（494）· `src/agent.mjs`（496）· `src/extension/chat-panel.mjs`（495）——本批均贴 500 硬限，均未入 §2 登记表（评审 🟡 可选·登记面）。
3. **既有债**：`thincoder-vscode/test/busy-injection-vsc.test.mjs` 546 行（超 500；本批 +3）· `webview/chat.css` 514 行（零改）——是否另批拆分由父侧裁定。
4. **用例档线数漂移**：CLI `test/busy-injection.test.mjs` 474 行（§2 累计表预计 ~400）——按登记「用例按族分档」下批执行（本批只登记不执行）。
5. **需求档 / 协议档**：需求 F16 与 `WEBVIEW-PROTOCOL.md` §3.2 行 17 的 `text` 字段语义（多槽口径）如与实现（队尾项原文）不一致，请父侧/设计侧同轮收正。

## §6 验证与收口（父代理）

### 6.1 实施记录（eng-coder #21 · 初轮 + 收口前文档两轮）

**改动面**：CLI（`queued-merge.mjs` / `queued-pickup.mjs` 新档 + 渲染 / 输入 / 驱动 8 档 + 测试 2 档）· VSC（`extension/queued-merge.mjs` / `queued-pickup.mjs` / `webview/queued-mark.js` 新档 + 面板 / webview 9 档 + 测试 3 档）· 核（`agent.mjs` 循环头第 3 成员 `consumeQueuedInput`）；**超受影响表 6 项全部披露接受**（`chat-panel.mjs` 满队守卫同源 `>=8` 行为 1 处 · 两个新测档 · 用例阈值收正等）。**流程**：内审 1 轮（DEVIATIONS → 1 处自修）→ advisor pass（🔴0 / 🟡1 / 🔵4 → 注释收正 5 处）。
**文档补述（收口前）**：#24 = 设计档 4 补句（`TUI.md:628-629` · `WEBVIEW-INPUT.md:47` / `:30` / `:34`）+ 300 线登记补 3 行；#25 = 协议档 `busyQueued.text` 语义收正（`:63` / `:99`——「队列末项原文 · 队列非空即携 · webview 不读」——与实现逐字对账）。

### 6.2 父侧验收

| 判据 | 结果 |
|---|---|
| CLI 门禁复跑 | `npm test` ⇒ **815/815 · fail 0**（35s）✓ |
| VSC 门禁复跑 | `npm test` ⇒ **951/951 · fail 0**（57.6s）✓ |
| 抽读 | `queued-merge.mjs`（常量单源 8 / 2000 · `formatMergedMessages` R15 逐字 · `planQueuedInput` 截批先行）✓ · 核 `agent.mjs` `consumeQueuedInput`（`:99` 签名 + `:239` 循环头，与 `consumeInjected` 同址）✓ |
| 协议门 | `protocol-coverage` 4 pass · reverse 3 pass（#25 复跑）✓ |

### 6.3 披露裁定 + 登记

- 超表 6 项：**接受**（交付必需 + 披露完整）；`busy-injection-vsc.test.mjs` 546（+3 超 500 既有债）→ 台账 #254（300 线 / 超限拆分轮）。
- 设计档追认 4 处 + 登记 3 行 + `text` 收正：**已落**（#24 / #25）。
- 观察项（记录面旧口径 3 条）：**登记不追改**（append-only）。
- C 段待办全处置：③ 拆分批 → #254；④ 用例档线数漂移 → 下批；⑤ 需求 F16 空靶 → #25 实读澄清。

### 6.4 收口

- **提交**：CLI / VSC / 核源码 + 测试 + 设计档 5 + 需求档 1 + 本批档（见提交记录）。
- **台账**：#249 → **已核销**。
- **未落项**：无（全量：实施 + 文档追认 + 协议收正 + 验收）。
