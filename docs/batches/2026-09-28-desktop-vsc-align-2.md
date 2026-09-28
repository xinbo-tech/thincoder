# 2026-09-28 · desktop-vsc-align-2
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 06:48–07:06 桌面端走查：对齐裁定（「长得像」「对齐」×3）+ 行为缺口五项（#494 推理钉底 / #495 排队流内可见 / #496 子 agent 面同款 / #497 说话人标识 / #498 终态块存留）+ 右列加宽一倍（#500）；前情 = 视觉对齐批（`2026-09-28-desktop-vsc-visual-parity.md` · 未收口 · 同族）——本批 = 桌面 ↔ VSC 对齐（第二批：形 + 行为）。
> 台账 = #494–#498 · #500（docs/desktop/requirements/PROJECT.md · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
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

### 1.15 评审轮 1 裁定表（父侧 · 依据 = 本档 §3 轮次 1 · changes-required 12 条）

| 号 | 级别 | 处置 | 说明 |
|---|---|---|---|
| 1 | 🔴 | Fixed（修正轮） | UI.md:355 同格两读收正（删「零内容回显」残留 · 「下回合起清终态」改「归档 = 入流」） |
| 2 | 🔴 | Fixed（修正轮） | RENDER-CORE KD-RC-6 随批收正（题名 / 理由列 + 被否候选「照 VSC 回显 tail-3」移入改判登记） |
| 3 | 🔴 | Fixed（修正轮） | T-DSK36 ①⑤ / T-DSK22 / §10 K / §6.1 D20 验证面收正（条目 `text` · 可见面 = 流内待发送气泡 · K 行转已消解） |
| 4 | 🔴 | Fixed（修正轮） | 块型集合收正（UI.md:19 + PROJECT.md:145 ⇒ 六型 ∥ 标「页读域五型 + 运行期 `subagent`」） |
| 5 | 🟡 | Fixed（修正轮） | `clearPending` 消费清单五处统一（「`markPending` / `paintLabel` 消费 · `planBusyQueued` / `clearPending` 不消费」） |
| 6 | 🟡 | Fixed（修正轮） | §5 构件族清单补三件（`refreshBlock` / `renderSubagentChunk` / `renderSubDesc`） |
| 7 | 🟡 | Fixed（修正轮） | RENDERER §1.1 补键控差分挂载判据（或指针） |
| 8 | 🟡 | **Fixed（父侧直接执行）** | 需求档 :52 / :59「不回显内容」两处删（与 D4 行同句） |
| 9 | 🔵 | Fixed（修正轮） | 行数账五组同 as-of 回填 |
| 10 | 🔵 | Fixed（修正轮） | 拆前 / 拆后算式二择一给数 |
| 11 | 🔵 | Fixed（修正轮） | 「新档 2」计数口径注明（拆分产出另计） |
| 12 | 🔵 | Fixed（修正轮） | 归档块 与 `data-hidden` / 摘要块关系补一句判据 |

**父侧口径**：12 条全数接受（无 Not-an-issue）；🔴 四条均为「同机制两处描述」的文档残留收正——设计方向零动。

### 1.16 实施轮内裁定（父侧 · 2026-09-28 · 承实施 D1〔#16〕上抛）

**上抛事实**：拆档实测 `events.mjs` 494 ⇒ **469**（设计 §4.2 预设 ≈380——漂移 +89：页读径实拆 96 行 < 估 120；本批归约增量 ≈70 行 > 估）⇒ 硬限余量仅 31 行；在途「桌面空闲唤醒」批自述基线 = 本批拆后档、增量 ≈36 行 ⇒ **将越 500 硬限**。

**裁定 = 执行**：即落设计已登记预案——子 agent 归约径拆 `thincoder-desktop/renderer/subagent-reduce.mjs`（events ⇒ ≈340 · 余量 ≈160）。依据：① 预案已随 §4.2 登记并过评审批准（档名 / 拆法原样）；② 「碰见错结构就修」——该档本批正被触碰 = 登记消解窗口已到；③ 同族纯结构拆零行为语义。**声明面**：D1 派单 files 表 15 档 ⇒ 实现含第 16 档（`subagent-reduce.mjs`）——父侧批准、披露在册。设计档数字回填归父侧结算（idle-wake 实施基线随之为「拆后档」实值）。

### 1.17 实施途中发现：主进程导入链 × `/rc/` 接线冲突（父侧诊断 · 2026-09-28 12:0x · 用户报弹窗）

**现象**：Electron 弹「A JavaScript error occurred in the main process — ERR_MODULE_NOT_FOUND: Cannot find module 'd:\rc\18n.mjs' imported from …renderer\i18n.mjs'」（用户「后台一直弹」）。

**根因（父侧实读）**：实施 D1（#16）按 KD-32 给 `renderer/i18n.mjs` 新增 `import { setStrings } from "/rc/i18n.mjs"`（浏览器面 = `app://` scheme 第二根，合法）——但**主进程链** `src/main/attachments.mjs:25` 静态导入 `../../renderer/i18n.mjs`，平 node 上下文把 `/rc/…` 解析为盘符绝对路径 ⇒ 每次 app ∥ E2E `_electron` 启动主进程即崩。测试面（`test/run.mjs` `--import test/rc-resolve.mjs` 钩子）与渲染面（scheme）均正常。

**处置**：① steer 已发 #16（必修）——`/rc/` 导入移出 `i18n.mjs`（保持平 node 可解析）、由浏览器专属入口 `renderer/app.mjs` 注入 `setStrings`（`initDict` 单点合并语义不变）；`app.mjs` = 声明外增档（父侧已批 · 披露）。② **沉淀项（结算随动建议）**：RENDER-CORE §1.3「桌面端加载形」宜补一句判据——「`/rc/` 导入仅许出现在**不被平 node 加载**的浏览器专属档；被子进程 ∥ 主进程加载的渲染档（`i18n.mjs`）须保持平 node 可解析」；`test/rc-resolve.mjs` 射程说明「现存子进程面均不加载渲染档」句已失准（app 主进程加载 i18n.mjs）随同批更正。

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

### 2.7 修正轮 1（设计评审 §3 轮次 1 点修 · eng-designer · 2026-09-28）

发现 1–7 / 9–12 共 11 条逐条点修（发现 8 = 需求档侧 · 父侧直接执行——本设计面零动）；**设计方向零动**。逐号落点：

- 发现 1 / 4 / 5 / 11 / 12（`docs/desktop/design/UI.md`）：§2 项 1 行两处残留句收正（条目内容回显 = 核件 tail-3 / 展开 · 子块归档 = 入流）· 对话流行「块五型 ⇒ 块六型」（+ 运行期块 `subagent`）· 项 2 导出清单收正（`clearPending` 移入不消费）· 计数行补拆分产出 2 · 项 5 边界补运行期块记账指针。
- 发现 2 / 5 / 6（`docs/render-core/design/RENDER-CORE.md`）：KD-RC-6 收正（题名「内容 chunk 四面分流 + 回显 tail-3」；理由列改「§3.6 对齐口径 + D4 内容回显」；被否候选「照 VSC 回显 tail-3」移入改判登记）· §4 行 16 carve-out 补 `clearPending` · §5 构件族补三件（`refreshBlock` / `renderSubagentChunk` / `renderSubDesc`）+ 消费面段 ② 收正为两导出。
- 发现 3 / 4 / 5 / 9 / 10 / 11（`docs/desktop/design/PROJECT.md`）：§7 T-DSK36 ①⑤ + T-DSK22（可见面 = 流内待发送气泡 · 条目 `text`）+ §10 K 行（转「已消解」）+ §6.1 D4 / D20 两行随动；§4.1 `events-subscribe` / `views/chat.mjs` 按盘回填（**69** / **280**）；§4.2 本批表「现行」列五处同 as-of 回填（events **494** · store **333** · chat.css **300**〔D24 后 ≈310 起算〕· 拆前 / 拆后算式收正 ⇒ 拆后 ≈380）+ 新档计数补拆分产出 2。
- 发现 7 / 12（`docs/desktop/design/RENDERER.md`）：§1.1 增「池面挂载（键控差分）」条 · §2 增「运行期块记账」条（退窗不计入 `data-hidden`；回填耗尽 ⇒ 零摘要块）。

**同族残留随修（评审未点名 · 随报告）**：`PROJECT.md:472`（T-DSK5）· `:420`（§6.1 D4 行）「内容回显」残留 + `UI.md:137`「块五型」——按已裁口径一并收正。

**机检**：`node scripts/doc-check.mjs --root .` = 悬空 **47** / 行宽 **36**（与基线持平——零净增；中途曾 +2 行宽〔新条两行超限〕，已拆行收回）。四档变更记录各补修正轮一行。

**报告父侧（非本批面 · 零触碰）**：① `docs/desktop/design/IPC.md:14`「块型 `reasoning` 已在桌面块五型内」= 同族残留句（落点在派单四档之外 · 「对齐重定位批」段落）——建议收正为「页读域五型」或随实施轮；② 盘上读数三处与文档估值差（`i18n.mjs` **425** · `styles.css` **492** · `chat.css` **315**——D24 批在途产物）——随该批结算回填。

### 2.8 修复轮（实施途中缺陷 · 主进程装载崩收正 · eng-designer · 2026-09-28）

**缺陷（一处 · 父侧亲跑全案 · 详见 §1.17「实施途中发现」）**：实施 D1（#16）按 KD-32 给 `thincoder-desktop/renderer/i18n.mjs` 新增 `import { setStrings } from "/rc/i18n.mjs"`（`/rc/` = `app://` 第二根别名——浏览器专属）；而**主进程 node 侧既有链**吃同一档——`thincoder-desktop/src/main/attachments.mjs:25` 静态导入 `../../renderer/i18n.mjs`（词面单源设计）⇒ 平 node 把 `/rc/i18n.mjs` 解析为盘符绝对路径 ⇒ `ERR_MODULE_NOT_FOUND` ⇒ **主进程装载即炸 · 窗口永不出**。损伤面（父侧亲跑）：`npx electron . --smoke` 原栈（`Cannot find module 'D:\rc\i18n.mjs'`）+ playwright 探针（进程存活 · 12s 零窗口）；`npm test` = 204 例 / 198 过 / **6 败**（T-DSK27 / T-DSK32 / T-DSK37 / T-DSK38 / T-DSK39 / T-DSK40 六真机例窗口超时——同症状）⇒ **仅此一处病根**。

**择形 = 候选 (c) 接线点外移**（三候选 = a 拆纯数据档 ∥ b `i18n.mjs` 内惰性导入 ∥ c 接线外移；择定判据 = 半径最小 × 单点语义保持 × 零动验收面）：

- **(c) 由**：① **半径最小**——实改两档（`renderer/i18n.mjs` / `renderer/app.mjs`）+ 一条测试面射程注收正，**零新档**；候选 (a) 须立纯数据档（入 `fresh` 臂 + `attachments.mjs` 改吃数据档），且 `i18n.mjs` 仍不可被 node 装载 ⇒ 陷阱本体留存（只挪不移）；② **单点语义保持**——合并式原样单点居 `initDict`，接线注册单点居 `app.mjs`（原「藏在 `initDict` 内的隐式接线」改显式注册——KD-32 取词单点意图不变）；③ **零动验收面**——无新增用例 / 无计数变动；候选 (b) 因 `initDict` 同步性涟漪（fire-and-forget ⇒ 时序竞态）落选（另：`/rc/` 字面仍居 node 装载档——潜在陷阱留存）。
- **形态**：`renderer/i18n.mjs` 回归「纯数据 + `t()`」= **node-safe 档**（零 `/rc/` 静态导入）；核件取词接线（核 `setStrings` 注入）= **浏览器专属面**单点（注册 = `renderer/app.mjs`）。

**逐处落点（file:line · 实施面）**：

1. `thincoder-desktop/renderer/i18n.mjs` — 删 `:32` 静态导入；模块态（`:413-416`）增 sink 槽 + 导出 `setStringsSink(fn)`；`initDict`（`:437`）`setStrings({ ... })` ⇒ `stringSink?.({ ...project, ...(hostTable ?? HOST_DICT[current] ?? {}) })`（**合并式原样**，缺 sink ⇒ 空操作 = 平 node / 用例面天然安全）；档头 ⑤（`:26-29`）· 词键注（`:94-95`）· `initDict` 注（`:428-432`）随动改述接线点。
2. `thincoder-desktop/renderer/app.mjs` — import 区（`:22-42`）增 `import { setStrings } from "/rc/i18n.mjs"`（浏览器专属档取核）+ `./i18n.mjs` 行补 `setStringsSink`；模块级一次注册 `setStringsSink(setStrings)`（模块求值先于 `DOMContentLoaded` ⇒ 先注册后 `initDict`——`app.mjs` 属声明外增档，父侧已批 · 披露 = §1.17）。
3. `thincoder-desktop/test/rc-resolve.mjs` — `:8-9` 射程说明收正：「现存子进程面均不加载渲染档」已失准 ⇒ 改述「app 主进程装载 `renderer/i18n.mjs`（node-safe 子集——零 `/rc/` 静态导入 ⇒ 不经本钩子）；本钩子射程 = 测试进程内渲染档取件」（判据单源指针 = `docs/desktop/design/SHELL.md` §1 node-safe 子集条）。
4. **零改档（保持）**：`thincoder-desktop/src/main/attachments.mjs`（词面单源照旧——`i18n.mjs` 现 node 可装载）· `thincoder-desktop/renderer/mount-settings.mjs:369`（语种切换 ⇒ `initDict` 重刷 ⇒ 同点经注册端出——核件词面同刷，零第二调用点）。
5. **doc 面（本修复轮落）**：`docs/desktop/design/SHELL.md` §1 增 **node-safe 子集**判据 + 变更记录一行（归 SHELL.md 之由：装载面 = 进程 / 目录形态面——`docs/desktop/design/RENDERER.md` 档头已把「渲染面目录与模块注」外指 SHELL.md §1；与既存「分层铁律」同节相邻 = 渲染面模块装载纪律单源）。

**前瞻注（D2 实施面 · 零计数影响）**：核模块级取词面（`subblocks/*` / `queued-mark` / `flow/block.mjs` 标签——无 `deps.t` 注入径者）如遇**用例**断言其词值 ⇒ 用例 setup 注册 sink（`setStringsSink(setStrings)`——测试进程内 `/rc/i18n.mjs` 经 `test/rc-resolve.mjs` 钩子解析）；现刻 198 单元零依赖（核件取词消费面 = `deps.t` 注入径——先例 = `thincoder-desktop/renderer/views/chat.mjs` 复制钮；哨兵断言一律经桌面 `t()`）——注册属 setup 面，**不改用例计数**。

**验收线**：① `npx electron . --smoke`（临时家）⇒ 窗口出 ∧ 零 `ERR_MODULE_NOT_FOUND`；② `npm test` = **204/204**（198 单元 + 六真机例回绿）；③ `node scripts/doc-check.mjs --root .` = 悬空 / 行宽 **净增 0/0**（本设计轮实测：47 / 37 前后持平）。

**判据面注**：本类缺陷**单测面结构性不可见**——`test/rc-resolve.mjs` 钩子把 `/rc/` 平 node 解析差按设计掩盖（单元 198 全绿 ∧ 真机 6 败同刻并存 = 其证明）⇒ **真机面 = 唯一判据面**；机检锁候选（平 node 子进程装载探针）如需入闸须动用例计数面（204 ⇒ 205）——本修复轮不落，请父侧裁。

**边界（本修复轮不动）**：词表键面 / 值（157 键 × 2 语）零动；KD-32 消费面（核构件族取词经注册端）语义零动；不动需求档 · 核档（`docs/render-core/design/RENDER-CORE.md` §1.3 互补判据 = 父侧沉淀项）· 他批面（idle-wake / align-3）；零点火。

### 2.9 复核轮收正轮（设计评审 §3 轮次 3 点修 · eng-designer · 2026-09-28）

承 §3 轮次 3（🔴 0 · 🟡 4 · 🔵 3 · pass）——父侧逐条裁定接受。本轮 = 发现 1 / 2 / 3 / 5 / 6 / 7 六项点修（语义零新立——已裁口径随动收正）；**发现 4（回归锁）= 父侧裁「不落」**（真机六例即本类判据面），未动。

**逐号落点**：

- **发现 1（🟡 落点滞后）**：`setStrings` 单点接线五处随动改述 = **注册单点** `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册；`initDict` 合并式经注册端出）+ 判据单源补指 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」条——`docs/desktop/design/PROJECT.md:70`（KD-32）· `UI.md:312` / `:317` · `docs/render-core/design/RENDER-CORE.md:212` / `§10 H`（`:372`）。**同族随修**：`PROJECT.md:369`（i18n 行接线口径随拍）+ `RENDER-CORE.md` §1.3 补**装载面分层**指针句（父侧沉淀项「同笔」落）。
- **发现 2（🟡）**：`IPC.md:14`「块五型」⇒「**页读域五型**（块总集 = 六型）」（对齐 `UI.md:19` / `PROJECT.md:145` / `RENDERER.md:33`）。
- **发现 3（🟡 规范面残体）**：失效表述残体就地删除（各格直书现行口径；历史归变更记录 / 本档）——`UI.md:310`「（零内容回显）」描述 · `UI.md:336`「桌面原口径…退场」句 · `UI.md:356`「收正：原「不回显内容 / 无工具位」口径撤销」句 · `PROJECT.md:71`（KD-33）「原「下回合起清出」退场」句 · `PROJECT.md:191`「（原「预案待定」）」 · `IPC.md:160`「原「agent 在场才供」…」句。
- **发现 5（🔵 文件面入账）**：`PROJECT.md:370`（app.mjs 行）并入修复轮增量（**254 ⇒ ≈259**）；`SHELL.md` §1 树两行补注——`app.mjs` 行（注册单点）/ `i18n.mjs` 行（sink 槽 + `setStringsSink` 注册面导出 · node-safe 档）。
- **发现 6（🔵 计数漂移）**：`IPC.md:150` / `:163`「十二通道」随 §1 现值收正 「**十五通道**」。
- **发现 7（🔵 计数漂移）**：**二择一取「在册登记」**——由：① 计数三值并存（渲染面现值 10 ∕ 现盘实读 **13**〔`thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` · `thincoder-desktop/renderer/events-subscribe.mjs` 订阅表——「对齐第二批」`ev:subchunk` 已入册〕∕ `IPC.md` §1 **十五**〔空闲唤醒批两通道未落地〕）；② 权威数待空闲唤醒批落地（该批修正轮 #19 已派「以盘面实读定权威数 + 三档同值收正 + 残句清」——单源 = `docs/batches/2026-09-28-desktop-idle-wake.md` §1.10 项 1）——即刻收正两向皆生假断言（写 15 = 断言未落地件 · 写 13 = 与 §1 相抵且落地即过期）⇒ 登记 **BE** 行（`PROJECT.md` §10 · 三档九处清单入册 + 结算轮 / 消解窗口点名）；计数族行零触碰（`RENDERER.md` 本组件未改，登记代之）。
- 各档变更记录 +1 笔（五档——`UI` / `PROJECT` / `IPC` / `SHELL` / `RENDER-CORE`）。

**机检**：`node scripts/doc-check.mjs --root .` = 悬空 **47** / 行宽 **37**（与基线持平——**零净增**；本组件新增 / 改动行皆 ≤300 或属表格行豁免）。

**同族观察（未动 · 报父侧）**：① `PROJECT.md:435`（D19 行「`setStrings` 接线」——有单源指针 = 核档 §5，留）；② `UI.md:342`「对拍旧口径」（回归锁测试句——非失效表述）· `PROJECT.md:71` 被否列「原清出之动因仍在」（KD 格式内）· `RENDER-CORE.md:71` KD-RC-6 改判登记（轮 1 处置面）——判「决策记录 / 非残体」未动；③ 实现面注释漂移（非本笔 · 另座）：`thincoder-desktop/test/host-floor.test.mjs:7`「十二条」· `thincoder-desktop/renderer/app.mjs` 档头「十二通道订阅」· `thincoder-desktop/src/preload/preload.cjs:29` 注「十通道 = …」。

**边界**：发现 4 未动（父侧裁）；实现码 / 需求档 / 核档本体（`AGENT-LOOP-ASYNC-POOL.md`）/ idle-wake 批面零触碰；§1.12 编号归父侧；零点火。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

评审对象 = 批档 §2（2.1–2.6）+ 设计落点（UI.md 本批注（对齐第二批 · 六件）· PROJECT.md KD-31–33 / §4.1–4.2 / §6.1 / §7 / §10 · IPC.md `ev:subchunk` · RENDERER.md §1.1 · RENDER-CORE.md 消费面 / 端差）。口径 = 机制级「同机制两处不同描述」判 🔴；纯数值/清单口径判 🟡/🔵。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `docs/desktop/design/UI.md:355`（§2 项 1 行）同一单元格并存两读：既有「块面 = 核件同款（…内容 tail-3 + 展开）——原「不回显内容」口径撤销」，又有活句「条目**零内容回显**（块头读数 + 状态词…）」；同格「子块归档 = 该会话下回合起清终态」亦与 `UI.md:335`/项 5「归档 = 入流；原「下回合起清出」退场」相抵——本批两处撤销（批档 §2.2 自述）只落注内，未清行内残留 | 就地收正该格两句：删/改「条目零内容回显」为「内容回显 = 核件 tail-3 / 展开（项 3）」；「子块归档 = 该会话下回合起清终态」改为「归档 = 入流（项 5）」 |
| 2 | Document ownership | 🔴 | `docs/render-core/design/RENDER-CORE.md:71`（KD-RC-6）仍题「…分流 = 工具名仅作分流判据 · **丢内容**」，理由列引需求「D4『不回显内容』」（该句已随本批收正——`docs/desktop/requirements/PROJECT.md:141`），被否候选含「照 VSC 回显 tail-3（违 D4 语义面）」——与同档 `:163`（§4 行 21「内容回显 = tail-3 / 展开」）/`:209`（§5 消费面 ③）及 UI 项 3 相抵；本批落点（批档 §2.2 / RENDER-CORE 变更记录）列 §4/§5/§9/§10 四处，未含 KD-RC-6 | KD-RC-6 随批收正：题名与理由列改「内容 chunk 四面分流 + 回显 tail-3（KD-RC-6 收正）」；「照 VSC 回显 tail-3」从被否列移入改判登记 |
| 3 | Acceptance criteria | 🔴 | `docs/desktop/design/PROJECT.md:503`（T-DSK36）①「零内容回显（text / think 不进流也不进块）」· ⑤「归档 = 下回合起已终态块不在场」；`:489`（T-DSK22）「池面『队列』族在场」两处 +「取文本面 = 条目 `title`」（设计已定 `{ text, ts }`——`UI.md:20`/`:297`）；`:578`（§10 K）仍记「已裁 = 归档 = 该会话下回合起清已终态」；§6.1 D20 验证面仍指 T-DSK36（`:436`）——验收/裁决表行与设计相抵 | 三行收正：T-DSK36 ①⑤ / T-DSK22（条目 `text` · 可见面 = 流内待发送气泡）/ §10 K（沿 S 行先例转「已消解」）；§6.1 D20 验证面随动（或登记收正随动项） |
| 4 | Document ownership | 🔴 | 块型集合两处不同描述：`UI.md:19`「**块五型**（user / assistant / reasoning / tool / error）**单序列**」（同族残留 `PROJECT.md:145` chat.mjs 行「块五型」）vs `RENDERER.md:33`「**块总集 = 六型**：+ `subagent`」及 `UI.md:336`（项 5 新增流内块型 `subagent`——入块序 / 计 `data-blocks`） | UI.md:19 与 PROJECT.md:145 收正为六型（或标「页读域五型 + 运行期块 `subagent`」并指项 5） |
| 5 | Clarity | 🟡 | `clearPending` 消费与否两处相反：`UI.md:294`「导出直消费（markPending / paintLabel / clearPending）」vs `UI.md:296`「不消费…clearPending」；`RENDER-CORE.md:158`（§4 行 16「接核标记原语（…clearPending）」——该行不消费 carve-out 仅列 `planBusyQueued`）+`:208`（§5 ②「三导出」）vs `:354`（§9 ②「`planBusyQueued` / `clearPending` 不消费」）；`PROJECT.md:69`（KD-31「三导出直消费」）/`:435`（D19「队列标记三导出」）vs `:615`（AZ）/ 批档 `2026-09-28-desktop-vsc-align-2.md:207` | 五处清单统一为「`markPending` / `paintLabel` 消费 · `planBusyQueued` / `clearPending` 不消费（登记）」；§4 行 16 的 carve-out 补 `clearPending` |
| 6 | Clarity | 🟡 | 核导出面清单与消费面段不咬合：`RENDER-CORE.md:201-203`（§5 构件族）仅列 `renderSubBlock(model)`；同档 `:209`（§5 桌面消费面 ③）另列 `refreshBlock` / `renderSubagentChunk` / `renderSubDesc` | §5 构件族清单补三件（或加注「导出面以消费面段为准」） |
| 7 | Document ownership | 🟡 | 键控差分挂载为池面挂载工艺改判（`UI.md:313`；`PROJECT.md:366` 同批行），渲染工艺单源 `RENDERER.md:29`（§1.1 薄挂载 = `clear` + `build` + `append`）未收正 / 无指针 | RENDERER.md §1.1 补一条（或指针）承载键控差分判据（同 key 元素复用 · 壳照帧刷 · 不重建） |
| 8 | Requirements | 🟡 | 需求档 `docs/desktop/requirements/PROJECT.md:52`（§3.1）· `:59`（§3.2 项 3）仍携「不回显内容」；D4 行已收正（`:141`），变更记录自述「『不回显内容』句退场」（`:234`）未覆盖该两处 | 两处删「不回显内容」（与 D4 行同句——「内容回显 = 核件 tail-3 / 展开」），或登记为收正随动项 |
| 9 | Affected-file annotations | 🔵 | 行数账 spot-check 五组互不一致：`PROJECT.md:361`（events.mjs **473**）vs `:138`/`:388`（**494**）；`:362`（store.mjs **331**）vs `:144`/`:339`（**333**）；`:364`（events-subscribe **69**）vs `:139`（**68**）；`:372`（chat.css **299**）vs `:135`/`:348`（**300 ⇒ ≈310**，D24 在途未计）；`:145`（chat.mjs **299**）vs `:365`/`:294`（**280**） | 五组按同一 as-of 回填统一（本批表「现行」列与 §4.1 / 各批行同源） |
| 10 | Affected-file annotations | 🔵 | `PROJECT.md:361` 拆前/拆后算式不自洽：「473 ⇒ 硬限 500 顶格 ⇒ …拆 ≈120 ⇒ 拆后 ≈415」⇒ 倒推增量 ≈ 62，与「500 顶格」相抵（按顶格拆后应 ≈380） | 拆前终值与拆后估值二择一给数（或改述为「拆前已近 / 触硬限 ⇒ 拆分必须」） |
| 11 | Affected-file annotations | 🔵 | `UI.md:349` / `PROJECT.md:375`「新档 **2**」未含本批执行的两件拆分产出（`:361` `page-read.mjs` · `:362` `queue.mjs`——均标「拟新增 · 本批执行」） | 计数补记两件（或注明口径 = 新功能档 · 拆分产出另计） |
| 12 | Acceptance criteria | 🔵 | 归档块（运行期块）入块序 / 计 `data-blocks`（`RENDERER.md:70`）后与窗口 / 回填账面（`data-hidden` = 未渲染更早块数 · 摘要块与回填判据——`RENDERER.md:88`）的关系仅一句「窗限 / 裁剪随既有窗口机制」（`UI.md:343`）；运行期块被计入「更早块」而不可回填复现的边界未给判据 | 补一句判据：运行期块是否计入 `data-hidden` / 摘要块（含回填耗尽后的表现） |

计数：🔴 4 · 🟡 4 · 🔵 4 · 合计 12。
VERDICT: changes-required（4 🔴——🔴 全清前不签发 token）

### 轮次 2（评审子代理）

轮次 2 复评（口径 = 只验前表：发现 1–12；只报修正引入的新问题）——六档全量重读（UI.md / PROJECT.md / IPC.md / RENDERER.md / RENDER-CORE.md / 需求档 PROJECT.md）+ 批档抽验项对照，逐条以本轮 read 为准。结论：前表 12 条全部落地（🔴 4 · 🟡 4 · 🔵 4 全清）；新问题 1 条（🔵，非阻断）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | thincoder/docs/desktop/design/UI.md | 🔴 | Fixed | §2 项 1 两处残留句已收正——`UI.md:355`「条目**内容回显 = 核件 tail-3 / 展开**（「对齐第二批 · 六件」项 3；块头读数 + 状态词——状态词出自 §1 闭枚举 **7 词**）」·「**窗限 / 归档** = 工具行摘除 · 子块**归档 = 入流**（本档 §1「本批注（对齐第二批 · 六件）」项 5）」；变更记录 `:458` 在册 |
| 2 | 2 | thincoder/docs/render-core/design/RENDER-CORE.md | 🔴 | Fixed | `RENDER-CORE.md:71` KD-RC-6 收正在位：「桌面**子 agent 面内容 chunk 四面分流 + 回显 tail-3**（KD-RC-6 收正——「对齐第二批」项 3）」+「**改判（2026-09-28 · 对齐第二批）**：原否「照 VSC 回显 tail-3（违 D4 语义面）」⇒ 随 D4 句收正**改采**」；变更记录 `:399` 在册 |
| 3 | 3 | thincoder/docs/desktop/design/PROJECT.md | 🔴 | Fixed | 四落点全清——`:503` T-DSK36 ①「且**内容回显 = 核件 tail-3 / 展开**（text / think 经 `ev:subchunk` 入块模型 `rows` ∧ 核件 `renderSubagentChunk` 落块面——「对齐第二批」项 3）」· ⑤「归档 = **入流**（池内退场 ∧ 流内尾追块留场——「对齐第二批」项 5）」；`:489` T-DSK22「（**可见面 = 流内待发送气泡**——输入区上方）」+「**取文本面 = 条目 `text` 逐字原样**（载荷 `text` = 条目 `text`——零显示串副本 / 零第二字段）」；`:578` §10 K「**已消解（「对齐第二批」——口径收正）**」（归档 = 入流）；`:436` D20 验证面「T-DSK36（①⑤ 随「对齐第二批」收正）」 |
| 4 | 4 | thincoder/docs/desktop/design/UI.md · PROJECT.md | 🔴 | Fixed | `UI.md:19`「**块六型**（`user` / `assistant` / `reasoning` / `tool` / `error` 五项页读域 + 运行期块 `subagent`——归档入流块，单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）单序列」；`PROJECT.md:145` chat.mjs 行同拍「对话流三态 + **块六型**（用户 / 助手 / 推理 / 工具 / 错误五项页读域 + 运行期块 `subagent`——「对齐第二批」项 5）」；`UI.md:137` 改「页读域五型」 |
| 5 | 5 | 六档清单面（UI / RENDER-CORE / PROJECT） | 🟡 | Fixed | 清单面全清——`UI.md:294`「导出直消费（`markPending` / `paintLabel`——`pending` 类与标签两形态字面单源；`planBusyQueued` / `clearPending` 不消费——见下行登记）」+ `:296` 不消费句；`RENDER-CORE.md:158`（§4 行 16 carve-out 补 `clearPending`）· `:209`「② `queued-mark` 两导出（…`planBusyQueued` / `clearPending` 不消费——登记 = 本档 §9 ②）」· `:354`；`PROJECT.md:69` KD-31（两导出）· `:435` D19「队列标记两导出（…`planBusyQueued` / `clearPending` 不消费，登记 = 本档 §10 AZ）」· `:615` AZ |
| 6 | 6 | thincoder/docs/render-core/design/RENDER-CORE.md | 🟡 | Fixed | `RENDER-CORE.md:203` §5 构件族补三件：「`renderSubBlock(model)` / `refreshBlock(block)` / `renderSubagentChunk` / `renderSubDesc`（子 agent 块面与归档块面——消费面段 ③）」 |
| 7 | 7 | thincoder/docs/desktop/design/RENDERER.md | 🟡 | Fixed | `RENDERER.md:71` 增「**池面挂载（键控差分 · 「对齐第二批」项 3）**：壳（三态 / 头读数 / 折叠）与待审批 / 队列族**照帧刷**…**子 agent 族按 key 复用元素**（`el._subMeta === model` 判据：同 key 跨帧同一元素——内容追加 / 折叠态 / ⏹ 全走核函数，**不重建**）」；变更记录 `:166` 在册 |
| 8 | 8 | thincoder/docs/desktop/requirements/PROJECT.md | 🟡 | Fixed | 两处「不回显内容」清零——`:52`「**内容回显 = 核件 tail-3 / 展开**〔2026-09-28 收正〕」· `:59`「…**内容回显 = 核件 tail-3 / 展开**）· 完成后**归档入流**（D3 / D20——2026-09-28 收正）」；变更记录 `:235`「「不回显内容」残留两处清零 · 主 agent 落笔〔父侧直接执行 · 可 revert〕」 |
| 9 | 9 | thincoder/docs/desktop/design/PROJECT.md | 🔵 | Fixed | 五组同 as-of 回填——`:138` / `:361` events **494**（「**494 ⇒ 硬限 500 顶格**」）· `:144` / `:362` store **333**（「**333 ⇒ ≈300**」）· `:139` / `:364` events-subscribe **69**（「**69 ⇒ ≈75**」）· `:135` / `:372` chat.css **300**（「**300 ⇒ ≈325**（D24 后 ≈310 起算」）· `:145` / `:365` chat.mjs **280**（「**280 ⇒ ≈310**」；`:145`「**280**（R3c 后实读——批 B 追加轮 299 ⇒ R3c 卡构树拆出 …**51** ⇒ 280）」）；同段残留一处 → 行 13 |
| 10 | 10 | thincoder/docs/desktop/design/PROJECT.md | 🔵 | Fixed | `:361` 拆前 / 拆后算式收正并自洽：「494 ⇒ 硬限 500 顶格 ⇒ 拆 ≈120 ⇒ 拆后 ≈380（仍越 300 ⇒ 续期 + 新预案 = 子 agent 归约径拆 `renderer/subagent-reduce.mjs`）」（500 − 120 = 380） |
| 11 | 11 | thincoder/docs/desktop/design/UI.md · PROJECT.md | 🔵 | Fixed | 计数补拆分产出——`UI.md:349`「新档 **2**（功能档——…）+ **拆分产出 2**（`renderer/page-read.mjs` · `renderer/queue.mjs`——结构拆分 · 本批执行，见 §4.2）」；`PROJECT.md:375`「新档 **2**（功能档）+ 拆分产出 **2**」（`page-read.mjs` ≈120 · `queue.mjs` ≈45） |
| 12 | 12 | thincoder/docs/desktop/design/UI.md · RENDERER.md | 🔵 | Fixed | `UI.md:343` 补指针「**运行期块记账** = 退出尾窗不计入 `data-hidden`——判据单源 = `docs/desktop/design/RENDERER.md` §2 运行期块记账条」；`RENDERER.md:91` 增「**运行期块记账（「对齐第二批」项 5 · 判据）**：…**退出尾窗 ⇒ 不计入 `data-hidden`**（该账面 = 页读域可回填块数——运行期块非落盘件，回填无源）；退窗运行期块**即弃**（不落摘要块 / 不成回填对象）；⇒ 摘要块判据（`hidden > 0`）与回填触发（`hasOlder`）不受运行期块扰动」 |
| 13 | (new) | thincoder/docs/desktop/design/PROJECT.md | 🔵 | New: 修正轮回填不完整 → §4.1 内部相抵 | `:145` 已回填 chat.mjs **280**，但同段 `:203` 仍书「**贴 300 层未越** = `thincoder-desktop/renderer/views/chat.mjs`（**299**——预案 = 卡构树拆出）」——值 299 与预案（R3c 已执行：`chat-cards.mjs` **51**）皆过期，与 `:145` / `:365` 回填值 280 相抵。修法 = 该行按 as-of 收正（改 280 或自贴层段除名）；非阻断 |

计数：🔴 新 0 · 🟡 新 0 · 🔵 新 1（行 13）· 合计 1——前表 12 条（🔴 4 · 🟡 4 · 🔵 4）全清，无修正引入的新 🔴。

VERDICT: pass

### 轮次 3（评审子代理）

**复核轮（桌面对齐第二批 · 六件 · 设计复核轮）** —— 评审对象 = 设计档六档全量重读（`docs/desktop/design/{UI,PROJECT,IPC,RENDERER,SHELL}.md` + `docs/render-core/design/RENDER-CORE.md`）+ 批档 §2 抽验（§2.7 / §2.8 / §1.12）；口径 = ① 轮 1 十二条修正逐条验证；② §2.8 修复设计复核（`/rc/` node 侧装载炸 · 择形 (c) 接线点外移 + sink 注册 · `SHELL.md` §1 边界规则句 · 落点五条）。

**轮 1 修正逐条验证（12 条 + 轮 2 新 13 条——全清）**：① `UI.md:355` 同格两读已清（内容回显 = 核件 tail-3 / 展开；归档 = 入流）· ② `RENDER-CORE.md:71` KD-RC-6 收正在位（题名 / 理由列 + 被否「照 VSC 回显 tail-3」入改判登记）· ③ `PROJECT.md:503` T-DSK36 ①⑤ / `:489` T-DSK22 / `:578` §10 K / `:436` §6.1 D20 四落点全清 · ④ `UI.md:19` / `PROJECT.md:145` 块六型（页读域五型 + 运行期 `subagent`）· ⑤ `clearPending` 不消费五处统一（`UI.md:294` / `:296` · `RENDER-CORE.md:158` / `:209` / `:354` · `PROJECT.md:69` / `:435` / `:615`）· ⑥ `RENDER-CORE.md:203` 构件族四件 · ⑦ `RENDERER.md:71` 键控差分条 · ⑨ 行数账五组同 as-of（**494 / 333 / 69 / 300 / 280**）· ⑩ `PROJECT.md:361` 拆前拆后算式自洽（500 − 120 = 380）· ⑪ 新档 **2** + 拆分产出 **2**（`UI.md:349` / `PROJECT.md:375`）· ⑫ 运行期块记账（`UI.md:343` ↔ `RENDERER.md:91`）· ⑬ `PROJECT.md:203` 按盘收正（299 ⇒ **280**）；⑧ = 需求档侧（复核射程外 · 未验）。
**§2.8 修复设计复核**：`SHELL.md` §1 node-safe 子集判据在位（`:69-72`；与同节分层铁律 / `RENDER-CORE.md:43` 前缀白名单注互补）；注册点 `renderer/app.mjs` 属浏览器专属档（`src/main/**` 静态闭包不含——判据自洽）· 注册先于 `initDict` 之时序断言成立 · point 3 射程注单源指针 = `SHELL.md` §1 · 验收三线可验（smoke / 204/204 / doc-check 0 净增）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🟡 | `setStrings` 单点接线**落点**两述：`SHELL.md:71`（新——注册单点 = `renderer/app.mjs`；`initDict` 合并式经注册端出）vs `PROJECT.md:70`（KD-32「渲染面 `initDict` 处 `setStrings(...)`」）/ `UI.md:312` / `UI.md:316` / `RENDER-CORE.md:211`（§5 ④）/ `RENDER-CORE.md:370`（§10 H「现状 = 桌面 `initDict` 处单点 `setStrings`」）——本修复轮收正未随动 / 无指针（同族先例 = 轮 1 发现 7 之处理面）；该句即实施 D1 落笔依据（重建 `/rc/` 导入的诱导面）。未判 🔴 之由：SHELL 保留 `initDict` 为合并点，四处非「两活读法相抵」而属落地句滞后 | 四处随动改述为「注册单点 = `renderer/app.mjs`；`initDict` 合并式经注册端出」，或补指 `docs/desktop/design/SHELL.md` §1 node-safe 子集条；`RENDER-CORE.md` §1.3 互补判据（父侧沉淀项）同笔或另立 |
| 2 | Document ownership | 🟡 | `IPC.md:14`「块型 `reasoning` 已在桌面**块五型**内」——与 `UI.md:19` / `PROJECT.md:145` / `RENDERER.md:33`「块六型（页读域五型 + 运行期 `subagent`）」同族残留（= 轮 1 发现 4 未清尽项；设计轮已报告父侧〔批档 §2.7 尾注〕，盘上未落） | 该句按已裁口径收正为「页读域五型」/「块六型」同族表述，或随下次触碰该档的批 |
| 3 | Doc hygiene | 🟡 | 规范面遗留修订式残体（失效句留痕）：`UI.md:355`「原「不回显内容 / 无工具位」口径撤销」· `PROJECT.md:71`「原「下回合起清出」（`archiveFrozen`）退场」等——按 2026-09-18 裁定，失效表述应删（历史归记录面），残留易被读作活工单 | 各格直书现行口径（撤销标记移入变更记录 / 批档）；同族表述横跨各批 ⇒ 口径面可一次性裁定 |
| 4 | Acceptance criteria | 🟡 | §2.8 验收线之**回归锁缺位系登记式 defer**：判据面注自述「本类缺陷单测面结构性不可见 ⇒ 真机面 = 唯一判据面」；机检锁候选（平 node 装载探针）「本修复轮不落，请父侧裁」（批档 `:291`）；② 之固定计数 **204/204** 对在途批（idle-wake 增档）脆 | 父侧裁定锁入闸与否（204 ⇒ 205）；② 措辞收为「全绿 + 六真机例回绿」（计数随盘） |
| 5 | Affected-file annotations | 🔵 | §2.8 实改文件面未入账：`renderer/app.mjs`（`/rc/` 导入 + `setStringsSink(setStrings)` 注册 ≈ +2 行）仍书「254 ⇒ ≈257（`CHAT_KEYS` 增 `pending`）」（`PROJECT.md:370`）· `i18n.mjs` sink 槽 / 导出未在 `SHELL.md` §1 树行（`:41` / `:53`）体现（数值回填归父侧结算——在册） | 结算回填时把本修复轮两档增量并入 §4.2 本批行 / 树行注 |
| 6 | Clarity（numeric drift） | 🔵 | `IPC.md:150` / `:163`「§1 **十二通道**计数」vs 同档 §1 现值「**十五通道**」（`:33` / `:58` / `:61`） | 两处计数随 §1 现值收正（或改「通道计数零动」不带数） |
| 7 | Clarity（numeric drift） | 🔵 | 渲染面「**十通道**」族（`RENDERER.md:32` / `:34` · `SHELL.md:42` / `:43` · `PROJECT.md:138` / `:139` / `:269`）vs `IPC.md` §1 十五通道——含「对齐重定位 / 对齐第二批 / 空闲唤醒」三批增面未随动 | 随下次触碰收正为与 `IPC.md` §1 同值，或在册登记「通道计数随动面」 |

计数：🔴 0 · 🟡 4 · 🔵 3 · 合计 7。
VERDICT: pass（无 🔴——🟡 4 / 🔵 3 均非阻断；轮 1 十二条修正全清 + §2.8 修复设计落地成立）

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-09-28 07:13 授权「剩下的你自动跑完吧」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 2 · 🔴 新 0 · 前表 12 条全清（🔴 4 · 🟡 4 · 🔵 4）· VERDICT: pass 全文在册；新 🔵 1 条〔行 13 · §4.1 贴层行残留〕非阻断）；② **修正轮已落地并逐条核验** ✓（§2.7 十一号点修 + 父侧六档抽验〔残留句 grep 清零 · KD-RC-6 收正在位 · §7 T-DSK5 / T-DSK22 / T-DSK36 三行随动〕）；③ **token 已签发** ✓（凭据值不落档——沿纪律）。

**依据**：评审（轮 1 = changes-required 12 条 → 父侧裁定表 §1.15 → 修正轮 1（#14）→ 轮 2 = pass）；行 13（新 🔵）= 父侧小收正（PROJECT.md:203 按 as-of，见变更记录）。

**批准范围** = §2 设计全文（六件 A1–A6 + 拆分执行两件 + KD-31–33）。**实施派发** = eng-coder ×2（按实施派单 ≤15 档调度门拆分）：**D1 = 数据/状态层**（agent-bridge · events + page-read 拆出 · store · queue 拆出 · mount-composer · events-subscribe · i18n + 测试族）→ **D2 = 视图/样式层**（依赖 D1；views ×6 · mount-pool · 三 CSS + 测试族）。依赖序 = D1 → D2（台账 #494–#500 随实施核销）。

**§4 父侧代签（用户 2026-09-28 12:29「后续自动跑完吧」全链授权 ✓）**

- **三条件齐备**：① **设计评审 pass**——轨迹 = 轮 1（4🔴 · 4🟡 · 4🔵 = 12 条）→ 修正轮（11 条设计师 + 1 条父侧直接执行）→ 轮 2 **pass**（12/12 成立 + 新 🔵 ×1）→ **复核轮**（父侧点火 · 12:3x · 0🔴 · 4🟡 · 3🔵——12 条写盘复验全清 + §2.8 修复设计复核在位，见 §3 轮次 3）；② **修正落地逐条核验** ✓（复核轮逐条写盘复验；§1.15 发现 8 = 需求档侧，父侧自述已执行）；③ **token 已签发**（凭据值不落档——沿纪律）。
- **批准范围**：六件设计（§2 全量）+ **§2.8 修复设计**（`/rc` 边界缺陷 · 择形 (c) 接线点外移 + sink 注册）+ 实施在途 WIP 的完成度收尾（另座；§5 由实施座落笔）。
- **自缚四条**：复评再出 🔴 即停 · 验证不过即停 · 新范围或口径裁决即停 · 代签仅三条件齐备。
- **注**：原会话中断后由父侧（本会话）接手续跑——用户 12:23 / 12:29 指令在册；复核轮 4🟡+3🔵 的裁定 = 收正轮（另派）+ 不落回归锁（真机六例即本类判据面）在案。

## §5 实施记录（eng-coder）
**状态行**：实施完成（（D2 收尾轮（§5.2）+ 交付评审修正轮（§5.3）· 四号点修 · 内部审计 r1 + 代码评审 r1 pass · 终态 clean））



### 5.1 修复轮（`/rc` 边界缺陷 · §2.8 落点 1–3 · 2026-09-28 · eng-coder）

**范围** = §2.8 落点 1 / 2 / 3（择形 (c) 接线点外移 + sink 注册）；落点 4（零改档）/ 5（doc 面）＝核实项，零触碰。工作根 `D:\teamcode` · 仓库 `thincoder/`。

**实改三档（as-built）**：

| # | 档 | 改法 |
|---|---|---|
| 1 | `thincoder-desktop/renderer/i18n.mjs` | 删静态 `import { setStrings } from "/rc/i18n.mjs"`；模块态增 `stringSink` 槽 + 导出 `setStringsSink(fn)`（非函数 ⇒ 清槽）；`initDict` 改 `stringSink?.({ ...project, ...(hostTable ?? HOST_DICT[current] ?? {}) })`（合并式原样 · 缺 sink ⇒ 空操作）；档头 ⑤ / 词键注 / `initDict` 注三处改述接线点 |
| 2 | `thincoder-desktop/renderer/app.mjs` | import 区增 `import { setStrings } from "/rc/i18n.mjs"` + `./i18n.mjs` 行补 `setStringsSink`；模块级一次注册 `setStringsSink(setStrings)`（先于一切 `initDict` 调用点）；档头补一行 |
| 3 | `thincoder-desktop/test/rc-resolve.mjs` | 射程注收正（app 主进程装载 node-safe 档 ⇒ 不经本钩子；单源指针 = `SHELL.md` §1）；钩子本体零改 |

**零改档核验**：`src/main/attachments.mjs` 词面单源原样（`FALLBACK_LOCALE` / `HOST_DICT` 仍在导出面）· `renderer/mount-settings.mjs` `initDict(receipt)` 原样即经注册端出（桌面 `setStrings` 调用点全仓仅 `app.mjs` 一处）。

**验证读数（命令 + 结果）**：
- 平 node 直载探针：`import('./renderer/i18n.mjs')` OK · `import('./src/main/attachments.mjs')` OK（workdir = `thincoder-desktop`）；
- `npx electron . --smoke`（临时家 HOME / USERPROFILE / APPDATA / XDG_CONFIG_HOME + 摘 `ELECTRON_RUN_AS_NODE`）⇒ exit 0 · stdout 单行 JSON `"window":true,"ok":true,"boot":"ok","errors":[]`（`served:57 · blocked:5`）；
- `cd thincoder-desktop && npm test` ⇒ `tests 204 / pass 204 / fail 0`（T-DSK27 / 32 / 37 / 38 / 39 / 40 六真机例回绿）；
- `node scripts/doc-check.mjs --root .` ⇒ 悬空 **47** / 行宽 **37**（与设计轮基线持平 = 净增 0/0）；
- `git diff --name-only`（全树 24 档）= 本修复轮三档 + 他座在途未提交 WIP（D1 实施 + 文档收正）——**本修复轮实改面 = 三档声明面，零越域**。

**审计与评审轮次**：
- 内部偏差审计（explore · 只读 · 对照 §2.8 + `SHELL.md` §1）＝ **clean**——四类偏差（部分实现 / 静默简化 / 越域 / 文档漂移）均未发现；验证用临时探针（`.thincoder/tmp/` · gitignored）判非交付面并已删。
- 内部代码评审（advisor · type=code · 三档 + 批档 §2.8 + `SHELL.md`）＝ **pass**——🔴 0；🟡 1 = `i18n.mjs` 471 行越 300 咨询线（在册越层债 · 明确非 must-fix · 归父侧结算轮处置）；🔵 1 = node-safe 回归锁缺位（设计已登记 · 父侧裁定不落 · 仅记录）。

**fix round**：0 轮（审计 / 评审均无必修项 ⇒ 无需修正轮）。**终态 = clean（converged）**。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| sink 签名 | `setStringsSink(fn)`；非函数 ⇒ 清槽（`null`） | §2.8 落点 1；缺 sink 空操作 = 平 node / 用例面天然安全 |
| 注册落点 | `renderer/app.mjs` 模块级（import 区之后 · `const host` 之前） | §2.8 落点 2；模块求值先于 `DOMContentLoaded` ⇒ 先注册后 `initDict` |
| 注释随动 | 档头 ⑤ / 词键注 / `initDict` 注 + `app.mjs` 档头 | §2.8 落点 1 明列 + 「注释与行为一致」纪律 |

**披露（临时产物）**：`thincoder-desktop/.thincoder/tmp/align2-smoke-probe.mjs`（冒烟探针 · 跑毕已删）· `.thincoder/tmp/align2-fix-test.log`（套件日志 · gitignored 临时区 · 非交付面）。

### 5.2 实施面收尾（D2 视图 / 样式层 · eng-coder · 2026-09-28）

**范围** = 原实施舱 D1（数据层）中断后由本座续跑收尾：六件（#494–#498 / #500）的**视图 / 样式 / 测试面（D2）**补齐 + 三处实现面注释滞后修平 + 落点外披露。工作根 `D:\teamcode` · 仓库 `thincoder/`。D1 数据层（`queue.mjs` / `page-read.mjs` / `subagent-reduce.mjs` 三拆分产出 + `events` / `store` / `mount-composer` / `events-subscribe` / `agent-bridge` / `preload` / `i18n` 增量）为在盘基线，本座零回改（除 `visibleWindow` 一处设计条回填 —— 见披露表 #2）。

**六件逐件核表（件 → 在盘 file:line → 结论）**：

| # | 件 | 在盘落点（file:line） | 结论 |
|---|---|---|---|
| A1 | 推理钉底（#494） | 分流：`renderer/views/chat-text.mjs:73`（`patchTextBlock` —— reasoning ⇒ 核 `paintReasoningTarget`〔`/rc/flow/stream.mjs:27-30` 含钉底〕∥ 余 ⇒ `paintStreamTarget`）；首帧落底：`:93` `pinReasoning` + `:100` `pinReasoningBlocks`（重挂径）+ `views/chat.mjs:184` `dressNode`（尾段 / 重建 / 前插三径，先于读数） | 在盘 |
| A2 | 排队流内 + 队列分键（#495） | 组：`views/chat-pending.mjs:19` `pendingOf` / `:37` `pendingGroupNode` / `:61` `syncPending`（在场 ⟺ 本会话队非空 · 项数 = 队长 · 内容等价零写）；落点：`views/chat.mjs:224` `syncChrome`（块后卡前）+ `:251` `blockAnchor`（首锚 = `[data-pending]` ⇒ 交接位置零跳）；标签 = 核 `markPending`（`views/chat-text.mjs:128`）；段 14 源：`views/statusline.mjs:170`（`pending[活动会话键]`）+ `mount-status.mjs:18`（`STATUS_KEYS`）；气泡形：`chat.css:162-171` | 在盘 |
| A3 | 子 agent 核件同款 + 内容回显（#496） | 核件四件直消费：`views/activity.mjs:24-25` · `:192` 块壳 · `:252` `syncSubBlocks`（键控差分 · 同 key 元素复用）· `:225` `updateSubBlock`（仅新代接管换元素）· `:284` `mountPool`（容器常驻 `root._poolSub`）；⏹ 委托：`mount-pool.mjs:60` `bindSubagentStop`（载荷读 `data-sub-id` / `data-sub-role`）；核类名映射：`core.css` ④ 族（`:242` 起）；内容回显 = `rows`（D1 归约面）+ 本档重放（`_rowsDone` 增量 · 冻结块历史重放设临时解冻闸） | 在盘 |
| A4 | 说话人标识（#497） | 容器：`views/chat-text.mjs:63` `labelNode`；落笔：`:109` `paintSpeakerLabels`（用户块 = 核 `paintLabel` ∥ 助手回合首块 = `t("msg.assistant")`；`_labelPainted` 幂等）；判据单源：`views/chat.mjs:95` `turnHeadOf`（`assistant` 族五项含 `tool` / 归档 `subagent`）；`data-ts` 载波：`views/chat.mjs` 块锚 + `page-read.mjs:60-66`（回放 `timestamp`）+ `mount-composer.mjs` 两径（活流 = 提交 / 入队现刻）；字形：`chat.css:137-153`；`chat-tool.mjs:128`（`toolCard` `withLabel` —— 落点外 · 披露） | 在盘 |
| A5 | 折叠 + 归档入流（#498） | 流内块壳：`views/chat-subagent.mjs:20` `subagentNode` · `:39-49` `echoOf`（核件 + `rows` 重放 + 冻结形）· `:53` `fillSubagentEcho` · `:61` `syncSubagentEcho`（重挂径）；`chat.mjs:184` `dressNode`（帧尾三径）；池内退场：`views/activity.mjs:57`（`region:"flow"` 墓碑过滤）；透传壳：`chat.css:174-181`；运行期块记账：`store.mjs:109` `visibleWindow`（退窗不计入 `data-hidden` —— RENDERER.md §2 条回填 · 披露） | 在盘 |
| A6 | 右列 ×2（#500） | `styles.css:18`（`--pool-w: 36rem` 单源）+ `:86` / `:343`（两处 `var(--pool-w)`）；值锁 `views-locks.test.mjs`（一处声明 / 36rem / 两引用 / 零 18rem 残留）；真机 576px（集成档） | 在盘 |

**五档行数读数（as-of 2026-09-28 · 本座实读）**：`renderer/events.mjs` **350** · `renderer/store.mjs` **308** · `renderer/i18n.mjs` **470** · `renderer/mount-composer.mjs` **372** · `src/main/agent-bridge.mjs` **210**。另册（本轮新增 / 触碰档）：`views/chat.mjs` **339**（越 300 咨询线 —— §2.5⑦ 预案续期在册）· `views/activity.mjs` **309** · `views/chat-text.mjs` **125** · `views/chat-pending.mjs` **78** · `views/chat-subagent.mjs` **69** · `mount-pool.mjs` **90** · `views/statusline.mjs` **271**。

**三处实现面注释滞后修平（本轮 · file:line）**：
1. `test/host-floor.test.mjs:7` —— 「十二条」⇒「十三条」（订阅面白名单说明 —— 现盘实值 13）；
2. `src/preload/preload.cjs:29` —— 「十通道 = 回调映射 + 宿主自产两条」⇒「**十三条** = 回调映射十一条 + 宿主自产两条（`ev:usage` / `ev:error`）—— 非回调映射」+ 计数族权威数指针（`PROJECT.md` §10 BE 行登记 · 结算 = 空闲唤醒批落地）；
3. `test/views-chrome-vocab.test.mjs:64-66` —— 核件取词接线句随 §2.9 收正（注册单点 = `renderer/app.mjs`；`initDict` 合并式经注册端出）。
**同族随修（披露）**：`renderer/app.mjs:17` / `:241`「十二通道订阅」⇒「十三通道订阅」（§2.9 在册漂移面）；`test/events-reduce.test.mjs:264` 标题「十二通道接线」⇒「十三通道接线」。

**测试面（原址补例 · 零新 `test()` 块 ⇒ 计数 204 保持）**：`views-activity`（U72 三态三族 + region 墓碑过滤 / U73 折叠 + 键控差分 / U168 核件面：块壳 · 头文形两态 · tail-3 `│ ` · ⏹ 判据 · 同 key 复用 + 内容增量 · `sub.desc` 一次性 / U169 停止出口 + ⏹ 委托）；`views-chat`（U59 标签判据 + `data-ts` + 归档块壳 + 待发送组纯树）；`views-chat-frame`（U71 ⑥⑦⑧：标签三形态落笔 · 待发送组 DOM + 交接同帧 · 归档回显静态）；`views-chat-text`（U173 ④：推理画笔分流 + assistant 对拍 + `pinReasoning`）；`views-statusline` / `views-chrome-vocab` / `views-chrome` / `views-locks`（段 14 三态 + 本键专取 / 键数链 156 / 标签容器 / `--pool-w` 值锁）· `store`（U29 运行期块记账）· `fake-dom.mjs`（补 `dataset` / `isConnected` / `lastElementChild` / `createTextNode` / `parentNode`）；**真机（D16）**：`test/integration/chat-render.test.mjs` 原址补两条结构读数（A6 右列实测 576px ∧ A4 标签结构 —— 零文案匹配）。

**验证读数（命令 + 结果）**：
- `cd thincoder-desktop && npm test` ⇒ **tests 204 / pass 204 / fail 0**（含六真机例；实跑两轮 —— 收尾轮末与审计修正后各一次，同值）；
- `node --import ./test/rc-resolve.mjs --test test/integration/chat-render.test.mjs` ⇒ 1/1（A6 = 576px 实测 · A4 三读数实读通过）；
- `node scripts/doc-check.mjs --root .` ⇒ 悬空 **47**（与设计轮基线持平；行宽读数同基线档 —— 本座零触碰 `docs/**`）。

**审计与终态**：内部偏差审计（explore · 只读 · 对照 §2 单源 + `UI.md` 六项 + `RENDERER.md` §1.1/§2）＝ **PASS（可核销）** —— 四类偏差命中：部分实现 1（🟡 A1 边界 = `mountChat` 重挂径未补钉底 ⇒ **当场修**：`pinReasoningBlocks` 一件 + 用例）、静默简化 **0**、越域 3（全为已披露落点外 —— 见披露表）、文档漂移 1（🔵 `chat-subagent.mjs` 注「挂载 / 帧尾两径共用」失准 ⇒ 当场收正）。**终态 = clean**（本轮审计项零遗留）。**顾问代码评审（advisor · type=code）未跑** —— 父侧 13:1x 收敛指令「停止扩面 · 不再追改」下按令收束，如实披露（审计面四类核已覆盖；如需补跑 ⇒ 另派轮）。

**落点外披露（表外零改 · 逐条报）**：

| # | 档 | 改动 | 缘由 |
|---|---|---|---|
| 1 | `renderer/views/chat-tool.mjs` | `toolCard(block, key, handlers, withLabel)`（首子标签容器） | 回合首块判据射程含 `tool`（UI.md 项 4）—— 不落则工具首回合面无标签 |
| 2 | `renderer/store.mjs` | `visibleWindow` `hidden` = 页读域计数（排除运行期块） | RENDERER.md §2「运行期块记账」判据条（评审轮 1 发现 12 落定）—— 不落则摘要块账面失真 |
| 3 | `renderer/mount-status.mjs` | `STATUS_KEYS`：`pool` ⇒ `pending` | 段 14 源改本会话队（项 2 落点只列 `statusline.mjs`）—— 不落则入队后状态行不随动 |
| 4 | `renderer/i18n.mjs` | **退场一键** `pool.stop`（两语） | 自建五段行块面退场 ⇒ ⏹ 词归核件 `sub.stopBtn`；旧键无消费者（词表「全量消费」锁不容孤儿）—— 键数链 157 ⇒ **156** 同笔收正 |
| 5 | `test/fake-dom.mjs` | 补 `dataset` / `isConnected` / `lastElementChild` / `createTextNode` / `parentNode` | 核件元素面机检所需（真 DOM 同义面 —— 载体不自证即假绿源） |
| 6 | `test/integration/chat-render.test.mjs` | 原址补 A6 / A4 真机两条 | D16 义务（凡改桌面可见面 ⇒ 验收含真 Electron 用例） |
| 7 | `renderer/app.mjs` · `test/events-reduce.test.mjs` | 通道计数注释 / 标题（12 ⇒ 13）+ `app.mjs` 两注 | 同族注释滞后（§2.9 在册面） |

**设计表回填（归父侧 · 本座不碰 `docs/**`）**：`PROJECT.md` §4.2「本批行」宜补 `views/chat-tool.mjs` / `mount-status.mjs` / `test/fake-dom.mjs` 三档记名 + `i18n.mjs` 退键一笔；`UI.md` 项 3 落点清单与 §4.2 同拍。

**未决（列入报告 · 不再追改）**：① A3 / A5 真机对照（与 VSC 同刻截图 / 子 agent 跑完留块）—— 集成域夹具无 subagent 活动，本座未跑（人工走查面）；② `views/chat.mjs` 339 越 300 咨询线（§2.5⑦ 预案续期在册，归后续批）；③ `views/chat-frame` 夹具 `state()` 的 `pending` 经 `over` 传（缺省键未加 —— 零碍）；④ BE 行通道计数三档同值收正归空闲唤醒批结算。

### 5.3 交付评审修正轮（eng-coder · 2026-09-28）

**范围** = 交付评审 4 条发现点修（评审 = changes-required · 2🟡 + 2🔵；父侧逐条裁定接受）。判据单源 = `docs/desktop/design/RENDERER.md` §1.1「键域与换代」句（会话内键域 + 换元素径挂载后末刷）。工作根 `D:\teamcode` · 仓库 `thincoder/`。

**逐号落点（号 → 改动 file:line）**：

| # | 级 | 改法 | file:line |
|---|---|---|---|
| 1 | 🟡 | 换元素径（新代接管）**挂载后末刷**：`subElementOf` ⇒ `element.replaceWith(next)` ⇒ `refreshBlock(next)`（⏹ 门控读 `isConnected` —— 核首刷发生在挂载前；与同档首见径 `createSubBlock` 同序、与 VSC `activity.js:65`「挂 DOM 后重刷」同形） | `thincoder-desktop/renderer/views/activity.mjs:230-235`（`refreshBlock(next)` = `:234`） |
| 2 | 🟡 | **按键域换代**（弃容器整族重建 —— 非元素级小补丁）：容器绑会话戳 `root._poolSubSession = model.key`（键源 = `poolModel` 的 `key`）；会话变更（含退至 none）⇒ `_poolSub = null` 弃旧容器（行账 / `.sub-desc` 判据复位） | `activity.mjs:294-299`（弃器）+ `:315`（绑戳） |
| 1·2 | — | 用例：U168 ④ 接管后 ⏹ 在场（running）+ ④(b) 队列接管态 ⏹ 在场 + ⑦ 跨会话换代（1→2→1 · 元素换代 + `_rowsDone` 复位 + 切回再换代） | `thincoder-desktop/test/views-activity.test.mjs:305` / `:306-313` / `:331-346` |
| 3 | 🔵 | 题面收正：「十一回调 → 十通道」⇒「**十一回调 → 十一通道**」（两数各有源：11 回调 = `src/main/agent-bridge.mjs:109-190` 实读 · 11 通道 = `docs/desktop/design/IPC.md:30` 本批口径「十一回调 ⇒ 十一通道」＝ `src/preload/preload.cjs:29`「回调映射十一条」同值） | `thincoder-desktop/test/agent-host.test.mjs:139-140` |
| 4 | 🔵 | 值对拍锁：`QUEUE_MAX`（`thincoder-desktop/renderer/queue.mjs:16`）⇄ 核 `QUEUED_MAX_ITEMS`（`thincoder-render-core/flow/queued-mark.mjs:28`）——两值同改同验 | `thincoder-desktop/test/store.test.mjs:22`（import）+ `:323-324`（断言） |

**验证读数（命令 + 结果）**：
- 四档面：`node --import ./test/rc-resolve.mjs --test test/views-activity.test.mjs test/agent-host.test.mjs test/store.test.mjs test/views-locks.test.mjs` ⇒ **tests 30 / pass 30 / fail 0**（含新断言题面）；
- 全量：`npm test` ⇒ **tests 217 / pass 217 / fail 0**（末次读数；施工中曾逢他座在途批（空闲唤醒）中间态四例红（U89 / T-DSK29 / U51 / U156 · `events-subscribe.mjs` 13⇒15 等，mtime 证据在册），该座落定后终读全绿——四档面自始零红；全量复核若需复现以父侧为锚）；
- 锁面负向探针（两条 · 临时改 · 跑毕还原 · 零残留）：① 撤 `refreshBlock(next)` ⇒ U168 红（`接管后挂载后末刷 ⇒ ⏹ 在场` false !== true）；② 撤会话戳守卫 ⇒ U168 红（`跨会话同键 ⇒ 弃旧容器重建` notStrictEqual）——两笔锁均咬；
- 实改面（`git status` 对照）= 四档：`renderer/views/activity.mjs` · `test/views-activity.test.mjs` · `test/agent-host.test.mjs` · `test/store.test.mjs`——表外零改。

**审计与代码评审轮次**：
- 内部偏差审计（explore · 只读 · 对照四号任务书 + `RENDERER.md` §1.1）＝ 1 条偏差 = **报告面 §5.3 未写（即本笔）**；代码面四类（部分实现 / 静默简化 / 越域 / 文档漂移）**零**——已随本节落笔消解；
- 内部代码评审（advisor · type=code · 四档 + 批档 / `RENDERER.md` / `IPC.md`）＝ **pass（0🔴）**；非阻断三项：🟡 `activity.mjs` 321 行 > 300 咨询线（在册债 · §2.5⑦ 预案续期 —— 明确非 must-fix）· 🔵 ⑦ 未锁「退至 none」支（建议补例）· 🔵 头文形断言墙钟量（既有形态，非本笔引入）。**处置 = 0 改动**（三项均非 must-fix：在册债不重开裁定；两项 🔵 供父侧 / 后续批取用）。

**fix round**：0 轮（审计 / 评审无必修项 · 实现零回改）。**终态 = clean（converged）**。

**决策透明表**：

| 决策 | 取值 | 依据 |
|---|---|---|
| #2 换代粒度 | **弃容器整族重建**（非元素级小补丁） | 父侧择定 + `docs/desktop/design/RENDERER.md:77`（同键重现于另一会话 ⇒ 元素账复位 ∕ 换代，禁沿用旧会话行账） |
| 会话戳载体 | `root._poolSubSession`（JS 属性，非宿主 attribute） | 沿 `_poolSub` 存量形；宿主属性面判据（`RENDERER.md` §1 退场口径）零扰 |
| #3 计数取值 | **11**（非 13） | 现场三源同值（`IPC.md:30` / `preload.cjs:29` / `test/host-floor.test.mjs:151`）；13 = 渲染面订阅表（`renderer/events-subscribe.mjs`）另一面——该面随空闲唤醒批现为 15，与桥面映射计数不同面 |
| #4 锁形 | 两值相等断言（同改同验） | 父侧择定「值对拍锁」；`/rc/` 取件沿测试钩子（`test/rc-resolve.mjs` + `test/run.mjs --import`） |

**越域披露**：无（四档皆在发现点名面内；另实读确认核件 `thincoder-render-core/lib.mjs` / `i18n.mjs` 零模块级 DOM ⇒ `store.test.mjs`「纯逻辑档」口径不破）。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-28（冻结）

### 6.1 验证结论（父侧亲跑 · as-of 2026-09-28 14:2x）
- **全量套件 = 220/220**（0 fail ∕ 0 cancelled——含本批六件面与同树后续增量；父侧独立复算，非子舱自报）；`npx electron . --smoke`（临时家 + `--user-data-dir`）= `lock:primary ∕ window:true ∕ boot:ok ∕ ok:true`。
- 链轨迹：轮 1（12 条 = 4🔴/4🟡/4🔵 · changes-required）→ 修正轮 → 轮 2 pass → §4 代签（12:2x）→ 实施 D1（六件 + 拆档三产）→ **崩修复**（§2.8 择形 (c) sink 注册 · 复核轮 pass · `--smoke` 窗口回绿 + 六真机例回绿）→ 收尾轮（六件在盘核 ∕ §5.2）→ 交付评审 #14（changes-required：2🟡 must-fix + 3🔵）→ 修正轮（§5.3 · 双反向探针锁咬）→ **复审轮 2 #21 = pass**（原 must-fix 解除）。
- 父侧直接执行在册（可 revert）：`activity.mjs:192` 注释收正 · `RENDERER.md` §1.1「键域与换代」判据句 + 变更记录 · `chat-render.test.mjs` hover 稳定器（期望值零改）+ 预算 6s（#506 消解面）。

### 6.2 结算随动
- 数字回填（§4.1 系统性滞后 + 本批行实读）＝ 父侧回填轮（在他批档面让档后随落——与本批冻结无涉）。
- 台账冻结锚 = 本档：#494 / #495 / #496 / #497 / #498 / #500 随本次收口核销（证据行 = 本 §6 + 批档链）；#506 同笔核销。
- **本档冻结**：后续一切（含回填笔）只动设计档 ∕ 记录面另档，不回改本档。
