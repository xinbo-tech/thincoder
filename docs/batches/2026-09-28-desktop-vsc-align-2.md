# 2026-09-28 · desktop-vsc-align-2
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 06:48–07:06 桌面端走查：对齐裁定（「长得像」「对齐」×3）+ 行为缺口五项（#494 推理钉底 / #495 排队流内可见 / #496 子 agent 面同款 / #497 说话人标识 / #498 终态块存留）+ 右列加宽一倍（#500）；前情 = 视觉对齐批（`2026-09-28-desktop-vsc-visual-parity.md` · 未收口 · 同族）——本批 = 桌面 ↔ VSC 对齐（第二批：形 + 行为）。
> 台账 = #494–#498 · #500（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（六件（#494–#498 · #500）· 勘察全表已并入 §1.9–§1.11 · 设计已派）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源（2026-09-28 06:48–07:06 走查实录）

- 06:48：「subagents那边显示的样子跟vsc真是没一点相似啊！那公共渲染核的作用呢？」；
- 06:50：「会话流里的行为也不一样，思考块为什么不会自动滚动呢？！」；
- 06:52：「queued跑到右边Activity区去了…哪个猪头想出来的？！」；
- 06:54：「我他妈的就是要你做成长得像，你才建议我做公共核的！做完了你跟我说跟长得像是两回事？！」（对齐口径裁定）；
- 06:58：「vsc那边好歹有You: / ThinCoder: 标识一下哪句话是谁说的，你这边啥都没有」；
- 07:01：「刚才不是有个子agent在跑吗？……为啥没了？」→ 07:02「是行为差异太大了，我根本看不明白了」；
- 07:06：「我的要求很简单，跟vsc对齐，记住是『对齐』『对齐』『对齐』！另外，右边栏太窄了，要放宽一倍，才够比较好的显示子agent的活动」。

### 1.2 对齐口径（本批总判据）

**「对齐」= VSC 的形 + 行为（观感与行为两端基本一致）**——凡以「对齐」为名的面，交付标准即此；核 = 手段（同一核件 + 值对齐），「语义非像素」不作豁免（需求档 §3.6「对齐口径」· 06:54 裁定 + 07:06 三重强调）。

### 1.3 本批条目（六件 · 台账 #494–#498 + #500）

| # | 条目 | 两端现状（父侧实读） | 判定 | 归向 |
|---|---|---|---|---|
| A1 | 推理块内容不自动跟底（#494） | 核 `thincoder-render-core/flow/stream.mjs:27-30` `paintReasoningTarget`（= 通用画笔 + `scrollTop = scrollHeight`）；VSC `webview/streaming.js:54` `markReasoning()` 走核缝合器；桌面 `renderer/views/chat-text.mjs:65` 统一用 `paintStreamTarget`（无 pin） | 核有件 · 桌面未接 | 推理面改走核专用画笔 |
| A2 | 排队消息仅右列可见（#495） | 核 `flow/queued-mark.mjs`（VSC 消费：气泡 `⏳ pending` 标记）；桌面 `store.mjs:204-235` 队列**全局未分键** + `views/activity.mjs:196-225` 只接右列队列族 | 核有件 · 桌面未接 + 口径相抵（busy-queue-visible 先例 = 流内可见；桌面 KD-23 否决「提前出泡」——理由①已随核化过期） | 走流内标记形（含队列按会话分键设计）；D4 / UI.md:87 / KD-23 口径收正 |
| A3 | 子 agent 面形态不似 VSC（#496） | 核 `subblocks/block.mjs` `renderSubBlock` + `subblocks/activity-view.mjs`（`[▶ role#id · …]` 行 + 内容 tail-3 + 展开 + 停止）；桌面自建 `views/activity.mjs`（五段行 · 零内容回显）——relay / 态机**已接**（`agent-bridge.mjs:21` / `events.mjs:34`） | 核有件 · 桌面未接（差视图叶 + 值） | 右列改用核件同款 + 值对齐；D4「（不回显内容）」句收正 |
| A4 | 会话流无说话人标识（#497） | 核 `flow/block.mjs:87`（`❯ You:` + 时间）/ `:98`·`:116`（`❯ ThinCoder:` 每回合）；桌面 `❯` / `msg-label` 全树零命中 | 核有件 · 桌面未接 | 接核 `buildUserMessage`（同笔带 `data-raw` 锚 = A2 前置） |
| A5 | 完成块存留口径（#498） | 核 / VSC = 折叠 + **归档入流**（`subblocks/state.mjs` archive 效果；冻结形 `[✓ … done 12s]` + tail-3 留场）；桌面 = **下回合清出**（`renderer/events.mjs:197-199` `archiveFrozen` / `:312-314`；动机注释「修既有池切片单调增长」） | 口径分家（桌面自裁） | 桌面改走「折叠 + 归档入流」（跟 VSC） |
| A6 | 右列加宽一倍（#500） | `--pool-w: 18rem`（`styles.css:18` · 栅格 `:86` / `:337`） | 直接指令 | `18rem ⇒ 36rem`（用户原话「才够比较好的显示子agent的活动」） |

### 1.4 边界（写死）

- 内容面（D21 已对齐值域）与外壳降噪批（D24 · 在途设计）射程**互不侵占**：本批 = 右列 / 会话流**机制与形态**对齐，皮肤增益随 A3 / A5 定形；与 D24 批同片文件面（`styles.css` / `pool.css`）⇒ **实施串行**；
- 零新依赖 · 零新机制（一律接核件）· 交互语义随 VSC。

### 1.5 勘察在跑（范围补全）

两路只读勘察（对话流面 ∥ 外围面 · explore #2 / #3）在跑——其缺口表回来后并入本批条目集（§1 增补 / 设计轮消纳），避免「一个个撞」。

### 1.6 排期与避让

实施排在在途批收口之后（`desktop-vsc-visual-parity`（§6 待收口）· `statusline-align`（修正轮）· `desktop-shell-denoise`（设计收尾））；同片文件面（`renderer/styles.css` / `chat.css` / `pool.css` / `views/*`）与他会话串行。

### 1.7 落点与下一步

- 需求档 = `docs/desktop/requirements/PROJECT.md`（D18 / D19 / D20 / D3 随批收正 + 新增条款——随设计轮落笔）；台账 = **#494–#498 · #500**（待设计 → 在途）；
- 下一步 = 勘察表落地 → 派 eng-designer（本批 §2 + `UI.md` / `RENDER-CORE.md` 相应节）→ 用户点火评审 → 批准 → 实施。

### 1.8 口径补充（07:08 用户走查 · 排队位置）

用户原话：「排队消息的显示位置也不行！排队中的时候要先是在输入区的上面，不是在右边！」⇒ **排队中消息 = 挂会话流尾（输入区上方）的 ⏳ 待发送气泡**（= VSC 形：气泡 + `pending` 标）；**右列「队列」族不再承载用户排队消息**（该族回归「排队中回合 / 工具批」本义）。并入 A2 / #495。

### 1.9 对话流面勘察（16 条 · explore #2 交付 · 2026-09-28 07:0x · 全表存档）

计数 = 新缺口 **16** = ①5 / ②6 / ③4 / ④1（已知四条不重复）。行 1·2·10·11 在设计档已有「不消费 / 非缺口 / 显式裁」登记——按「对齐」标尺仍为可见差异。

| 面 | VSC 现状 | 桌面现状 | 判定 | 说明 |
|---|---|---|---|---|
| 工具卡·结果摘要行 | 核 `flow/tool-card.mjs:117-127` + 恢复卡 `:158-163`；VSC `ui.js:120-139` | `views/chat-tool.mjs:84-92` 仅四段；全仓零 `formatToolSummary` | ① | 核件 `tool-summary.mjs` 未接（在册「非缺口」） |
| 工具卡·失败判据（红绿/展开） | 核 `lib.mjs:94-99` `isToolFailure` → `tool-card.mjs:106-116/:134-142` | 主 `agent-bridge.mjs:145` `ok: !startsWith("Error:")` → `chat-tool.mjs:78/:83-91` | ② | `(exit code 1)` / 全角 `Error：` ⇒ 同一次运行两端观感相反 |
| 工具卡·运行期实时输出 | VSC `chat-messages.js:70-89`（chunk 入卡体 + 强制展开） | `events.mjs:140-150` 只累积 + `chat-tool.mjs:117-121` | ② | 长命令 VSC 边跑边看，桌面全程折叠 |
| 工具卡·耗时格式 | 核 `tool-card.mjs:112` `done (1234ms)` | `chat-tool.mjs:88` + `i18n.mjs:79/237` `0.2s` | ④ | ms vs 秒 |
| 中止·未结算卡清扫 | VSC `streaming.js:90-115` `sweepUnsettledToolCards` + 词 `tool.interrupted` | `events.mjs:308-336` 零清扫 + `chat-tool.mjs:22-29` 无 interrupted | ② | 中止后桌面永停「执行中…」 |
| 中止·流内 `[stopped]` 痕 | VSC `streaming.js:128-143` + 核词 `i18n.mjs:65` | `events.mjs:329-336` 零消费 | ③ | 桌面点停止流内零痕 |
| 流式·子回合边界 turnBreak | VSC 宿主 `panel-callbacks.mjs:151` → `streaming.js:71-88` 起新块 | bridge 零该面；`events.mjs:119-129` 续写并块 | ③ | 续跑提醒下段界丢失（信号住 VSC 宿主层） |
| 恢复帧·推理/正文次序 | 核 `flow/block.mjs:97-105` reasoning → content | `events.mjs:448-463` text → reasoning | ② | 重开既有会话布局翻转 |
| 错误横幅（Details + Retry） | 核 `flow/block.mjs:133-145` + VSC `ui.js:164-169` | `events.mjs:341-346` + `views/chat.mjs:83-98` 纯文本 | ① | 桌面连重试出口都没有（未在任何登记表） |
| 审批卡·diff 预览 | 核 `cards/permission.mjs:23-56` + `diff.mjs`；VSC `permission.js:21-77` | `views/approval.mjs:126-139` 零 diff 节点；载荷无 diff 键 | ① | 在册「显式裁（不做 diff）」——按对齐标尺为最大可见差之一 |
| 文件链接（可点路径） | 核 `flow/tool-card.mjs:22-51` `linkifyPaths`；VSC `chat.js:71-79` | `views/chat-text.mjs:11-12` 明文不承载 | ① | 在册 KD-RC-5「不承载」（理由 = 文件打开暂缓） |
| 台账行 ledgerNotice | 核 `flow/ledger-line.mjs:8-13`；VSC `chat-messages.js:130` | 桌面零（仅状态行 `ledger` 段） | ① | 未登记 |
| 滚动·发送后回底 | VSC `ui.js:74-81` `_pinBottom = true` 强制贴底 | `store.mjs:91-95` + `chat-scroll.mjs:52-56` 原地不动 | ② | 停跟期间发消息桌面不回底 |
| 工具卡·advisor 轮次标签 | 核 `tool-card.mjs:70` `roundTag`；VSC `ui.js:104-116` | 载荷无 round（`agent-bridge.mjs:140`） | ② | 低频面 |
| 空态·欢迎条 | VSC `ui.js:25-38/:48-64`（抬头 / 快捷键行 / provider 横幅） | `views/chat-guide.mjs:32-42` 单行 hint | ③ | 空会话首屏 |
| 流内压缩 / 消化状态行 | VSC `chat-status.js:17-44/:69-122` | 桌面零（grep `compress|digest` 无） | ③ | 功能面差（宿主未接回调）——是否承载归缺面族 |

**已搜未得（零缺口面）**：代码块复制钮 · 推理块结构/折叠/尾缀 · 滚动跟滚主机制（各自在册等价）· 工具输出 64K 截断（同读核 `capText`）· 消息窗裁剪（各自在册）· 审批卡三出口/提问卡主体 · 模式位 banner（D17 面）· 启动加载（另见 1.10）。**限度**：纯只读、未运行时验证——「运行期实时输出」「turnBreak」两行的可见后果系读码推得，实施轮以真机复核。

### 1.10 外围面勘察（28 条 · explore #3 交付 · 2026-09-28 07:0x · 全表存档）

计数 = 新缺口 **28** = ①6 / ②13 / ③8 / ④1；另核出「在册 / 已裁」12 项（表后列）。

| 面 | VSC 现状 | 桌面现状 | 判定 | 说明 |
|---|---|---|---|---|
| 审批卡·child 归属 | 载荷 `permission-gate.mjs:73` + 核 `cards/permission.mjs:41-44`（`<owner> · <tool>`） | `主/suspensions.mjs:41-45` 无 owner；`views/approval.mjs:103-111` | ② | `coder#2/write` 原样显 vs 拆「归属 · 工具」 |
| 提问卡·Enter 提交 | 核 `cards/question.mjs:46-48` | `views/question.mjs:62-75` Enter=换行 | ② | 一键作答 vs 点按 |
| 提问卡·聚焦两态 | VSC `question.js:23-24/:19` | `mount-cards.mjs:102-120` 零聚焦 | ② | 挂载零聚焦 + 作答后不回焦 |
| 面板·goal 面 | VSC `index.html:37` + `panels.js:30-35/:118-122` + 状态栏 🎯 | 桌面零（槽投影只三键 `session-slots.mjs:115-130`） | ① | 核数据/核件在场（`cards/panel.mjs:74-77`）；⚠ RENDER-CORE §4 行 20 是否含 goal 待核 |
| 活动区·「等待审批」态 | 核 `child-permission.mjs:40-44` → `activity-view.mjs:55/:91`（⏸ + `awaitingApproval: <tool>`） | `events.mjs:51-54` SUB_KEYS 无 approval；`views/activity.mjs:36-38` 闭集无审批词 | ① | 子代理等审批：VSC「⏸」vs 桌面「running」 |
| 停止钮角色门 | VSC `activity-view.mjs:14/:152-160` `FAMILY_ROLES` | `views/activity.mjs:65/:167-177` 无角色门 | ② | 桌面可能给出 VSC 隐去的钮（consult / escalate） |
| 2s 心跳（走时） | VSC `panels.js:49-52` + `activity.js:149-153` | renderer 零定时器（grep 0 命中） | ② | 秒数冻结到下一事件 |
| 状态行·限流/过载/配额/索引段 | VSC `status-bar.js:27-30/:88-101` + 宿 `panel-callbacks.mjs:71-78` | 全树零命中（词表无键） | ① | 核相位链在场（`provider/rate.mjs:144` 等）；D22 段表不含 |
| 状态行·挂起会话句 | VSC `status-bar.js:51-61` | 桌面零通道 | ① | 「后台 N 子代理运行中」无处可读 |
| 对话流·压缩状态行 | VSC `chat-status.js:17-44` | 桌面零（grep `compress|compact` 无渲染命中） | ① | 核回调链在场（`context.mjs:304/:336`） |
| 对话流·消化轮可见面 | VSC `chat-status.js:69-122` | 桌面零通道 | ① | 核 `suspension.mjs:195-206` 在场 |
| 会话栏·末项删除门 | VSC `session-bar.js:43-45`（单会话不可删） | `views/sessions.mjs:166-168` 恒出；`session-actions.mjs:56-59` 无末项判据 | ② | 桌面可删到零会话 |
| 设置面·五族缺失 | VSC `settings-tools.js:51-80` + `settings-env.js:47-66` | `views/settings.mjs:22-27` 四段闭集；`ipc.mjs:66-95` 28 通道无 proxy / shell / 索引面 | ③ | 代理 / Shell 可读不可编；索引 / websearch 无入口 |
| 设置面·类型加工 | VSC `settings-agent.js:16-30` + 写前强转 `settings-panel-write.mjs:74-89` | `settings-sections.mjs:83-92` 全 `type:"text"` | ② | 布尔 / 数值键一个也写不进 |
| 设置面·agent 形态 | VSC 具名控件 + 即改即存（`settings-agent.js:139-157`） | 点分路径泛化表单 + 保存键 | ② | 「长得不像」显著项 |
| toast / 瞬态提示 | 核件 `render-core/toast.mjs:10-22`（VSC shim）；`send.js:24/:37` 等三处 | 桌面零（零引入） | ③ | 缺「一次失败 / 拒收即时浮出」通道 |
| 通知·回合完成系统通知 | VSC `notify.mjs:9-18`（失焦才发） | 桌面零（grep 0） | ③ | 窗口失焦时零提醒 |
| 加载·首屏加载面 | VSC `index.html:18-23` `#loading-screen` | 桌面直出骨架（防白闪有意，`window.mjs:60-66`） | ④ | 观感差小 |
| 键盘·↑/↓ 输入历史（+Ctrl+U） | VSC `input.js:86-110/:141-159/:69-74` | `mount-composer.mjs:295-306` 仅 Enter / Shift | ③ | D22 裁的键位组不含此项 |
| 键盘·@-引用补全 | VSC `autocomplete.js:19-120` + 宿 `atComplete` 通道 | 零模块零通道 | ③ | VSC 欢迎页明写「Type @ for file references」 |
| 附件·入口与发送键 | VSC file-input + Attach / Send 钮（`index.html:44/:46-47`） | `mount-composer.mjs:75-117` 无发送键、无附件键；仅 paste | ③ | 无法从磁盘选图；发送无鼠标路径 |
| 附件·非栅格拒绝时机 | VSC 粘贴即拒 + toast | 桌面发送后才提示（`attachments.mjs:38-44/:114` → `mount-composer.mjs:282-290`） | ② | 先显缩略图、发出才知被丢 |
| 模型/档位·忙态写门 | VSC `loading.js:40-59` `modelSwitchBlocked` | `views/chrome.mjs:99-113` + `mount-head.mjs:97-128` 无忙判据 | ② | 在飞回合照常可改 |
| 模式按钮·写面（AUTO/PLAN/ADVISOR/ENG） | VSC `mode-buttons.js:11-103` 四开关 | 桌面零开关（banner 只读；模式位住会话槽） | ③ | D22 = 显示面；本条 = 写面 |
| 错误·发送失败可见性 | VSC `send.js:23-26` toast + `ui.js:48-64` 横幅 | `mount-composer.mjs:157-176` 只 `console.error` | ② | `provider-invalid` / `busy` 零可见反馈 |
| 输入区·中断键两态 | VSC `loading.js:86-90`（Stop 仅 running 显） | `mount-composer.mjs:106-113` 恒在场可点（空闲点必败） | ② | 活控件 vs 可见性表达 |

（另有两条见 1.9：错误块出口 = 1.9 行 9；标签行 / 时间戳 = #497 已知。）

**在册 / 已裁 12 项（已核 · 未重复计）**：审批卡形态（RENDER-CORE §4 行 10/18）· 审批卡真置焦未落（UI.md §1 open 行）· 任务 / 计划面板外壳（§4 行 20）· 子 agent 块形态与归档（#496 / UI.md §2 项 1）· 状态栏段集（D22 在批）· 会话面板视觉（D18 在批）· 内容面 21 面（D21 已落）· 外壳降噪（D24 在批）· 搜索 Ctrl+F「本轮不承载」（§4 行 20 注）· 滚动 / 回填 / 裁剪 / 文件链接「各自」（§4 行 12–15）· 零 Esc 层（有意）· 附件条样式（UI.md §1 open 行）——**按「对齐」标尺多为一并翻案，归 1.11 分堆**。

**已搜未得**：i18n 覆盖（抽检两语齐备）· 复制 / 出口（桌面 3 件 ⊃ VSC 1 件）· renderer 零定时器 / 零 toast / 零 Notification（三处 grep 即上表证据面）。**未核面（明示）**：VSC 设置四档内部逐控件、model-menu 细节、chat-messages 52-case 全表、#scroll-bottom 细节。**邻接提醒（只报 · 归 D22 设计面）**：模式位供面桌面只有「页读 + 出站回执」两径，VSC 另有 `onPlanMode` / `onEngMode` 推送回调——代理自查翻转模式时桌面 banner 须等页读；是否补第三径归 D22 实施面裁量。

### 1.11 处置分堆（父侧拟）

- **小修族（照 VSC 补行为 / 形态 · 拟立第三批 `desktop-vsc-align-3`）**：1.9 行 1–3 / 5–9 / 12–15 + 1.10 行 1–3 / 5–7 / 12 / 14–15 / 22–23 / 26 / 28 —— 改法明确（接核件或照 VSC 形），逐条给判据；
- **缺整面族（= 新功能面 · 逐面分批）**：goal 面 · 压缩 / 消化可见行 · @-补全 · 附件入口与发送键 · 通知 · toast · 设置五族与形态 · 模式写面 · 限流 / 挂起状态段 · 加载面（低优）· ↑/↓ 输入历史；
- **旧「不做 / 各自」翻案（2 条 · 需用户确认）**：① 审批卡 diff 预览（原「不做 diff」）② 文件链接可点（原「文件打开暂缓」）——按「对齐」建议翻案；
- **不属本族**：D17 状态行对齐 CLI（显式裁）· 结构差（多标签等）· 启动骨架防白闪（有意）。

**计数（D3）**：两路合计 44 条原报 → 去重后 **≈ 40 条**：小修族 ≈ 25 · 缺整面族 ≈ 13 · 相抵 2 · 其余与在册合并。

### 1.12 出处收正（07:11 用户裁定 · 父侧）

用户原话：「哪有什么『旧的不做』啊！我说的从来都是对齐，是你自己自说自话不做。」**父侧出处核实**：①「不做 diff」= 建档期**流程自划**，且被直接写进需求档 §3.1:51 正文（设计档 `RENDER-CORE.md:152` 再引该行成「显式裁」——**循环引证**）；②「文件链接不承载」= KD-RC-5 由 §5.1 暂缓类推（设计档 §10-A 自注「若需求侧要求承载 ⇒ 须先解暂缓边界（另裁）」——即当时就知须回用户，却挂着未回）。⇒ **裁定：不存在「用户的不做」；流程自划的例外一律按对齐办，无须「翻案」程序。**

**已收正**：需求档 §3.1:51 / §5.1 / §3.4 + 变更记录（父侧直接执行 · 可 revert）。**审批卡 diff 预览 / 文件链接**两条随之入实现面（拟随 align-3 / 缺面族就近批落地）。

**重核面**：§1.10 勘察表「在册 / 已裁 12 项」逐条重核出处——凡无用户裁定出处者 ⇒ 按对齐办（归 align-3 设计轮）。

### 1.13 授权（用户 2026-09-28 07:13）

用户原话：「剩下的你自动跑完吧。」**射程** = 本批全链：设计评审点火 / §4 代签 / 修正轮与实施轮派发 / 收口核销提交推送——父侧全自动执行，不必逐次请点；**同授权下**父侧自推后续批（align-3 等）立批与全链。**自缚四条**：① 代签仅当三条件齐备（评审 pass 0🔴 ∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 每次代签在 §4 写明「父侧代签（用户 07:13 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需要**新范围**（射程外条目点火）或**用户口径裁决** ⇒ 停下等用户；④ 破坏性 / 不可逆动作照旧先停。

### 1.14 父侧对 §2 上抛的裁定（2026-09-28 · 自动跑授权射程内）

| 上抛（§2.5） | 裁定 |
|---|---|
| 1 核侧无助手标签原语 | **接受端侧同字面落形**（端差登记 = 核档 §10 G 维持）；核侧收拢 = 后续候选（不阻断本批） |
| 2 核件消费面两处不消费 | **接受登记**（AZ / H 维持） |
| 3 右列队列族零写者 · 席位保留 | **接受**（父侧 §1.8 口径 = 回归本义；摘除 = 另裁候选） |
| 4 窄窗效应 | **接受为 open**（第二断点 / 窄态 = 后续批候选；不阻断本批） |
| 5 运行期可见面页读即失 | **接受**（与 VSC 重载面同族——维持；持久化 = 新需求面（BA 行），须用户点名才立） |
| 6 `setStrings` 模块级注入 | **接受**（改核件签名 = 另裁候选；不阻断） |
| 7 拆分执行两件（`events.mjs` 页读径拆 `page-read.mjs` + `store.mjs` 队列面拆 `queue.mjs`） | **批准执行**（硬限 500 顶格 ⇒ 必须；在册预案本批执行——结构改动归本批实施面） |

**需求档收正（父侧笔权 · 评审后落）**：§2.1 回指句列 D4 / D19 / D20 / D21 四处随本批收正——待设计评审落地后由父侧落笔。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（六件（#494–#498 · #500）设计已交——单源 = UI.md §1「本批注（对齐第二批 · 六件）」/ PROJECT.md KD-31–33 · §4.2 / IPC.md（ev:subchunk）/ RENDERER.md §1.1 / RENDER-CORE.md §4 · §5 · §9 · §10；doc-check 本批零新增（悬空 / 行宽））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = 六件 · 台账 #494–#498 / #500）

口径 = 需求档 §3.6「对齐口径」（**「对齐」= VSC 的形 + 行为**——06:54 裁定 + 07:06 三重强调）；核 = 手段（同一核件 + 值对齐）。**逐件机制 / 落点 / 判据 / 边界单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」**（本段只列条目与验收对照，不复述机制）。

| # | 条目（台账） | 设计落点（单源） | 验收判据（回指需求） | 边界 |
|---|---|---|---|---|
| A1 | 推理面改接核专用画笔（#494） | `UI.md` 本批注项 1 | 机检：reasoning 块尾文档位变 ⇒ 内容区 `scrollTop === scrollHeight`（assistant 对拍零钉底）；真机：流式期 `scrollTop + clientHeight ≥ scrollHeight − 1` | 钉底无条件（随 VSC）；滚动容器 / 高度口径零改 |
| A2 | 排队消息走流内标记形 + 队列按会话分键（#495 · 07:08 补充） | `UI.md` 本批注项 2 · `PROJECT.md` KD-31 · `IPC.md` 零改 | 机检：`pending` 分键 / 满队按键 / 原引用 + 视图组在场 ⟺ 本会话队非空 · 项数 = 队长 · 交接同帧；真机：忙态发送 ⇒ 流尾 ⏳ 气泡（输入区上方）∧ 右列零队列条目 ⇒ 回合尾 ⇒ 标签转 `❯ You:` + 队空 | 队列仍住渲染面内存；附件不入队；错误径留队 + 气泡留场；非活动键交接随下次页读 |
| A3 | 右列子 agent 面改用核件同款 + 内容回显（#496） | `UI.md` 本批注项 3 · `IPC.md` §1 `ev:subchunk`（新通道）· `RENDER-CORE.md` §4 行 21 / §5 消费面 | 机检：`ev:subchunk` 四面载荷逐字段 + `rows` 入模型 + 块 = `details.advisor-block.sub-block` · 头文形 · tail-3 `│ ` · ⏹ 判据 · 同 key 元素跨帧同一 + 零工具行负向锁；真机：与 VSC 同刻截图逐段对表 | 2s 走时刷新不落（归小修族）；`sub.desc` 一次性说明行落；词键 `sub.*` / `msg.*` / `queued.pending` 值逐字同 VSC locales |
| A4 | 说话人标识（#497） | `UI.md` 本批注项 4 · `PROJECT.md` KD-32 | 机检：user 块 `.msg-label` 文形 = `❯ <msg.user>:` + 时间段（ts 缺 ⇒ 零时间段）· 回合首块有标签 / 同回合后续零标签 · 待发送项 `⏳ <queued.pending>`；真机：与 VSC 同刻对照 | `data-raw` 锚不变；标签为块内子节点（不入块序） |
| A5 | 终态折叠 + 归档入流（#498） | `UI.md` 本批注项 5 · `PROJECT.md` KD-33 · `RENDER-CORE.md` §4 行 21 | 机检：终态 ⇒ 表项 `region:"flow"` ∧ `blocks` 尾块 `kind:"subagent"` · `settled` 驻留 · 后到 `done` 归档 · **下回合起不清出**（对拍旧口径）；真机：子 agent 跑完 ⇒ 流内留 `[✓ …]` 块（右列退场） | 归档块 = 运行期块（页读整置即失）；`atBoundary` 恒尾追；冻结块不刷新 |
| A6 | 右列加宽一倍（#500） | `UI.md` 本批注项 6 | 机检：值落点锁（`--pool-w` = 36rem ∧ 两处引用同变量）；真机：右列实测 ≈ 576px ∧ < 900px 断点态同值；改前 / 改后同机位对照帧 | 窄窗效应登记（< ~1100px 中列受挤——第二断点 / 池面窄态另裁）；池内布局零动 |

**需求回指**：D3（对话流——待发送气泡 / 标签行 / 归档块入流）· D4（活动与后台——「不回显内容」句**收正**：内容回显 = 核件 tail-3 / 展开；「队列表」句**收正**：右列队列族不再承载用户排队消息）· D19（会话流经核——消费面扩充）· D20（右列 = 子 agent 面板——块面核件同款 / 归档入流 / 内容回显）· D21（内容面视觉——内核件类名映射值源续用）。**需求档笔权在父侧**：D4 / D19 / D20 相关句收正随本批落（本设计只报，不改需求档）。
**门（本批实施后应过）**：`node scripts/doc-check.mjs --root .` **零新增（悬空 / 行宽）**——本设计轮已实测：本批触碰五档（`UI.md` / `PROJECT.md` / `IPC.md` / `RENDERER.md` / `RENDER-CORE.md`）新增行零悬空（拟新增件皆带「（拟新增」标记）· 零行宽超限。

### 2.2 设计档落点（本批已落）

- `docs/desktop/design/UI.md`：§1 增**本批注（对齐第二批 · 六件）**（六件机制 / 落点 / 判据 / 边界 + 计数）；四处行内随动（对话流 / 输入区 / 状态栏段 14 源 / §2 项 1）；两处旧口径**就地撤销**（本批注（可见面修复）项 2 入队径出泡句 · 本批注（对齐重定位）项 2 内容零回显 / 归档清出句）；open 行登记池面窄窗态；变更记录一行。
- `docs/desktop/design/PROJECT.md`：§2 增 **KD-31**（排队可见面 + 队列分键）· **KD-32**（核件直消费 + `setStrings` 单点接线）· **KD-33**（终态 = 折叠 + 归档入流）；**KD-23 / KD-26 两处收正**（含被否候选改采登记）；§4.2 增本批行（code / main 十六行 + 新档 2 + 测试面 + 设计档）；§6.1 D19 / D20 两行补本批句；§10 增 **AY / AZ / BA** 三行。
- `docs/desktop/design/IPC.md`：§1 增 **`ev:subchunk`**（子 agent 内容增量 · 四面）行 + `ev:subagent` 行「内容不回显」口径就地撤销 + 载荷键集段 / 会话键面 / 订阅面 **十二 ⇒ 十三通道** + 事件映射段收正。
- `docs/desktop/design/RENDERER.md`：§1.1 块总集 **五型 ⇒ 六型**（+ `subagent` 归档块）· 回合尾窄口携 `key` · 帧尾态刷增待发送气泡组 · 增流内非块节点族条。
- `docs/render-core/design/RENDER-CORE.md`：§4 行 3 / 16 / 21 三行收正 + **判定四值**（+ 改判）与计数行随动；§5 增**桌面消费面段**（构件族四件 + 标记三导出 + `paintReasoningTarget` + `setStrings`）；§9 增「对齐第二批」端差 / 登记五条；§10 增 **G / H** 两行。

### 2.3 受影响文件与测试面（实施批）

逐档「现行 ⇒ 预期」单源 = `PROJECT.md` §4.2「本批（对齐第二批 · 六件）行」（**就地给数**——实读 2026-09-28）。要点：
- **宿主**：`src/main/agent-bridge.mjs`（`ev:subchunk` 四面分流——构造面同形 = VSC `panel-subagent-relay.mjs:172-191`）。
- **归约**：`renderer/events.mjs`（`rows` 归约 + 归档入流 − `archiveFrozen`；**硬限 500 顶格 ⇒ 在册拆分预案本批执行**：页读径拆 `renderer/page-read.mjs`〔拟新增〕）。
- **状态**：`renderer/store.mjs`（`pending` 分键 + 三动作带键；在册预案 `renderer/queue.mjs`〔拟新增〕**本批执行**）。
- **输入区**：`renderer/mount-composer.mjs`（带键入队 / flush 携键 / 出泡携 `ts`）· `renderer/events-subscribe.mjs`（窄口携 `key`）。
- **视图**：`renderer/views/chat.mjs`（尾组槽 + 标签后处理 + `subagent` 块引调）· `views/chat-text.mjs`（推理画笔分流 + 标签容器）· `views/activity.mjs`（**键控差分 + 核件直消费**）· `views/statusline.mjs`（段 14 源）· 新档 `views/chat-pending.mjs` / `views/chat-subagent.mjs`（拟新增）· `renderer/mount-pool.mjs`（⏹ 点击委托）。
- **样式 / 词表**：`renderer/core.css`（核类名映射 `advisor-block` / `sub-*` 族——值源 = VSC `chat.css:298-374` / `:328-371`）· `renderer/chat.css`（待发送气泡 + `.msg-label` / `.msg-time` + `.block-subagent`）· `renderer/styles.css`（`--pool-w` 一行）· `renderer/i18n.mjs`（核件词键 + `setStrings` 单点接线）。
- **测试面**：原址补例十一档（`store` / `views` / `views-chat` / `views-chat-text` / `views-activity` / `views-chrome` / `views-statusline` / `views-locks` / `agent-bridge-subagent` / `events-subagent` / `events-reduce`）+ 真机读数（集成域现有档原址补例——**D16 义务**：凡改桌面可见面 ⇒ 验收含真 Electron 使用面用例；用例行随测试档修加——不进设计面条目〔2026-09-27 裁定〕）。
- **同片避让（§1.6）**：`styles.css` / `chat.css` / `views/*` 与在途批（`desktop-shell-denoise` / `statusline-align` / `visual-parity`）**串行**实施——本设计零触碰在途批段落（增量编辑）。

### 2.4 关键决策（本批）

1. **队列按会话分键**（`pool.queue` 全局未分键 ⇒ `pending: { [会话键]: [{ text, ts }] }`）——理由：① 未受理气泡挂某会话流 ⇒ 队列须带键；② **flush 目标改回合尾事件键**（现取「现刻活动会话」有「切会话错发」缺陷面）。
2. **待发送气泡 = 流内非块节点组**（`[data-pending]`——不占块序 / 不动 `data-blocks` 不变式；落点 = 块序列之后、卡序列之前 = 与块插入点同侧 ⇒ 交接位置零跳）；**不作块入 `blocks`**（页读整置即漂 + 与 slice 双记账）。
3. **右列队列族 = 零写者 · 席位保留**（父侧 §1.8「回归『排队中回合 / 工具批』本义」口径；摘除候选被否——已在 KD-31 被否列登记）。
4. **核件直消费**（`queued-mark` 三导出 / 子 agent 构件族四件 / `paintReasoningTarget`）+ **`setStrings` 单点接线**（核件内取词走核 i18n）；**不逐条执行核 effects 表**（端面动作由模型态幂等派生——桌面无 DOM 区概念）。
5. **归档入流 = 流内新块型 `subagent`**（运行期块 · 壳 = 零边距透传容器 + 内嵌核件元素）+ 表项留存墓碑（`region:"flow"`）——迟来事件按 `drop-frozen` 消化（不复活 / 不重复补桩）。
6. **说话人标签**：用户块两形态 = 核 `queued-mark` 原语落笔；助手标签 = 端侧同字面落形（核无原语——端差登记 + 上抛 §10 **G**）；回合首块判据 = 「前一位块 = `user` ∨ 居块序首位」（活流 / 回放同判据，零第二判据）。

### 2.5 上抛项（实施 / 评审前请父侧知悉）

1. **核侧无「助手说话人标签」原语**（核档 §10 **G**）——本批端侧同字面落形；如须核侧收拢 ⇒ 另裁（补助手标签原语，与 `paintLabel` 同族）。
2. **核件消费面两处不消费登记**（核档 §10 H / 桌面 §10 AZ）：`planBusyQueued`（宿主快照对账面 = VSC 专有）· `clearPending`（桌面交接 = 节点换代）· 核 effects 表不逐条执行。
3. **右列「队列」族零写者 · 席位保留**——若父侧判「死面须摘除」⇒ 一致性小改（KD-31 被否列已登记口径来源）。
4. **窄窗效应**（A6 连带）：窗口 < ~1100px 中列受挤——第二断点 / 池面窄态**另裁**，不入本批（UI.md open 行已登记）。
5. **运行期可见面两件**（待发送气泡 / 归档子 agent 块——页读整置即失）：与 VSC 重载面同族；如需持久化 ⇒ 新需求面（桌面 §10 BA）。
6. **`setStrings` 接线面**（核档 §10 H）：核构件签名无 `deps.t` ⇒ 端侧模块级注入；备选 = 改核件签名（另裁）。
7. **拆分执行两件**（结构改动，归父侧裁）：`events.mjs` 硬限顶格 ⇒ 页读径拆档**必须执行**（不停则越 500 硬限）；`store.mjs` 队列面拆档（在册预案 · 本批执行）。其余越层档（`mount-composer` / `i18n` / `chat.css` / `views/chat` / `views/activity`）预案续期（消解窗口 = 各自下次被触碰的批）。

### 2.6 前提核对（父侧已知事实的复核结果）

- **A3 前提「relay / 态机已接」核实** ✓（`agent-bridge.mjs:21` 核 relay 映射 + `events.mjs:34` 核态机）——本批补 = 内容面（新通道）+ 视图叶（核件）+ 值（CSS）。
- **A2 前提「busy-queue-visible 先例 = 流内可见」核实** ✓（自动回复语、核 `queued-mark` 已含「待发送」两形态）——桌面此前未接（KD-23 曾以「无标记机制 + 队列未分键」两由否决 VSC 形，本批两前置消解 ⇒ 改采）。
- **A5 前提「桌面 = 下回合清出」核实** ✓（`events.mjs` `archiveFrozen` + `onActivity` turn 支）。
- **A6 前提「`--pool-w: 18rem` 单源」核实** ✓（`styles.css:18`；`:86` / `:339-342` 同变量引用——**栅格与窄断点零第二处数值**）。
- **A4 前提「`❯` / `msg-label` 全树零命中」核实** ✓（桌面 renderer 零命中——标签面全新；核心键 `msg.user` / `msg.assistant` / `queued.pending` 桌面词表未载 ⇒ 本批入宿主表）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
