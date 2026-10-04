# 桌面设计 · 活动池与消化面（ACTIVITY）

> **域**：右列活动池（子 agent / advisor / consult 块面 ∥ 队列族 ∥ 待审批族）· 池内跟滚与让位 · 右栏宽度 · 挂起窗键面路由与驱动 · 消化面（消化行族 ∥ 归档块 ∥ 留档记录 ∥ 复列重建）· 池 ∥ 状态位读数——本域设计单源档。
> **导航**：`docs/desktop/design/PROJECT.md`（总览 · 共享决策）∥ `IPC.md`（通道与载荷）∥ `SHELL.md`（壳与树）∥ `UI.md`（壳面形态）∥ `RENDERER.md`（渲染工艺）∥ `CHAT.md`（对话流）∥ `COMPOSER.md`（输入区）∥ `ACTIVITY.md`（本档）∥ `SESSIONS.md` ∥ `SETTINGS.md` ∥ `MENU.md` ∥ `PACKAGING.md` ∥ `E2E-TESTING.md`（端到端测试基建）∥ `WEB-QUICKCHECK.md`
> **来源**：自 `docs/desktop/design/PROJECT.md` §2（KD-26 ∕ KD-32 ∥ KD-33 ∥ KD-34 ∥ KD-35 ∥ KD-36 ∥ KD-47 ∥ KD-55 ∥ KD-58 ∥ KD-62）+ §2.2（挂起窗键面路由注）∥ `docs/desktop/design/UI.md` §1 / §2（本域批注块）迁入（as-of 2026-10-02）；原址各留一行指针。
> **迁移状态**：波 2a 迁入 = KD 行（十行）+ §2.2 整块 + UI 块（钉死表逐项）+ §4.1 族行四条（销项）；**未迁** = KD-60（行全文未在迁移轮上下文——原址保持单源）；**域内余项皆已迁入**（其余 §4.1 族行 ∥ §4.2 批块——切片 3；§5 / §6 / §7 域行——切片 4 终篇）——见 §4/§5/§6/§7（记录在册）。
> **需求侧**：需求分卷（`docs/desktop/requirements/`）行号以现文为准；本档 D 号引用 = 需求卷条目号（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；本域卷 = `docs/desktop/requirements/ACTIVITY.md`）。

## 1. 关键决策（迁移自 PROJECT.md §2）

| 号 | 决策 | 依据 | 被否候选 |
|---|---|---|---|
| KD-26 | **右列 = 子 agent 面板**（D20）：块 = 子 agent 实例（五类射程）；**工具调用行摘除**（工具面 = 对话流工具卡）；块态机 = 出生 / 终态折叠 / **归档 = 入流**（终态即归档 · `settled` ⇒ 等待消化后归档 · 旧代接管即归档——「对齐第二批」项 5 收正）；**内容回显** = 核件同款（头行 + 状态词 + 内容 tail-3 + 展开——`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` 直消费；「对齐第二批」项 3 收正） | 用户走查第 2 点逐字（「那里应该用于显示各类子agent，替代vsc端的live面板」）；D4「不回显内容」+ D20 块形（子 agent 实例——无工具位）；归档口径修既有池单调增长（PROJECT.md §10 K） | **保留工具行 + 另加子块**（右列双职——用户明否）；**子块全量常驻**（单调增长）；**终态即摘（无归档面）**——旧否因（看不见刚结束）随归档入流消解：终态块**入流留场**（非消失）；**回显 tail-3**〔2026-09-28 改采——D4「不回显内容」句随「对齐」口径收正归需求档〕 |
| KD-32 | **核件直消费 + `setStrings` 单点接线**（2026-09-28「对齐第二批」项 3 / 4）：右列子 agent 块 = 核 `renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc` 直消费（**键控差分挂载**——同 key 跨帧同一元素）；说话人标签 = 核 `queued-mark` 原语落笔（用户块两形态）∥ 端侧同字面落形（助手标签——核无原语，登记 + 上抛 PROJECT.md §10 **AY**）；核件取词接线 = **注册单点** `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册 · `initDict` 合并式经注册端出——判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」条） | 「对齐」= 同一核件 + 值对齐（需求 §3.6 · 07:06）；核件内取词走核 i18n ⇒ 不接线即出键名（`sub.async` 一族） | **描述符复刻核构件**（头词 / tail-3 / 状态词 = 第二实现——违单源）；**整件替换核 DOM**（桌面外壳 / 三锚 / 窗限全失）；**核件取词改端注入**（核件签名无 `deps.t`——须改核件，越本批边界） |
| KD-33 | **终态 = 折叠 + 归档入流**（2026-09-28「对齐第二批」项 5）：归档 ⇒ 池内退场 ∧ 流内归档块（新块型 `subagent`——壳 = 零边距透传容器 + 内嵌核件元素）；表项留存墓碑（`region: "flow"`——迟来事件按 `drop-frozen` 消化）；`atBoundary` **= 消费轮族后落位**（**随到达入流**——行族在流末时即「放族后」；迟到 ⇒ 随到入流；零存储；**键名 = 核件现行载荷键（`thincoder-render-core/subblocks/state.mjs` 核效果表 `archive` 标）——零动作，非座次机残名**）；**模型同拍 = 随到入模**（与 DOM 同判——当刻流末/常规块插入点；无锚 ∥ 无到达序标——`DOM ≡ visible` 零破）；单源 = `docs/desktop/design/RENDERER.md` §1.1「消化行入流与重放规则」条——#747 设施收正 ∥ #754 形翻转（2026-10-01）∥ **#765 座次机拆除 + 锚整删（F2 零存储——2026-10-01）**）；核 effects 表**不逐条执行**（端面动作由模型态幂等派生）；**留档批 · #719 收正**：块体入**人读线记录**（`kind: "subagent"` 快照）⇒ **页读域第六型**（六型全员页读；计 `data-hidden` ∥ 可回填 ∥ 退窗折摘要块——单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条） | 用户 07:01「刚才不是有个子agent在跑吗？…为啥没了？」+ VSC 同径（`archiveBlock` 入 `#messages`） | **保留「下回合清出」**（用户明否）；**归档块留池内**（右列单调增长——原清出之动因仍在） |
| KD-34 | **挂起驱动 = 消费核件 `startSuspension`（不移植第四份）**：入口 = 回合尾结算后（终局事件已出 · 在飞表已释）`poolLive(agent)` 判真 ⇒ `startSuspension({ carrier: agent, runTurn, abortSignal, hooks })`；**载体 = agent 对象**（CLI 同形——桌面装配实例跨回合 ∕ 跨会话键存活；核 `carrierField` 两形皆读；**核件实读坐标**：`thincoder-core/agent/suspension.mjs:154-155` 签名 ∕ `:72-84` `backgroundCounts` ∕ `:119-141` 等待面；`suspDriven` = 核 opts `thincoder-core/agent.mjs:85`（三拆前 `:102`）（`thincoder-core/agent/run-stages.mjs:151` / `:206` 解构消费）；`carrierField` = `thincoder-core/agent-tools/async-settle.mjs:52-56`）；驱动胶水出档 `thincoder-desktop/src/main/suspension-drive.mjs`：会话寄存器 + hooks（计数 ∕ 边界 ∕ 回收 ∕ 冻结——计数面 = 核 `backgroundCounts`，边界 = 消化轮起跑 ∕ 收尾（`onDigest`），**归档面 = 起跑窗**（消化起跑点（`ev:digest start` 发帧点）= 对本轮将消费驻留条目逐条补发 `ev:subagent { status: "done" }`——**主面**；`hooks.reclaim` = 兜底幂等——2026-10-01 复位；**三端同形（裁 A——两端随正）**：对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:182`（两端兜底面同形））∥ 冻结 = 退出兜底同型）+ 输入 ∕ 关闭路由；**单回合执行面 = 宿主既有三径结算提取**（`send` ∕ 驱动同源 · `suspDriven: true` ⇒ 已 settle 留池等消化，撤回合尾直注入兜底）；挂起空闲输入**开放**（`msg:send` ⇒ `pushInput` + `wake`——用户输入优先序沿核件；**含附件 ⇒ 同受理**（**载具层携图**——窗条目携 `images`，送达面 `prepareTurnAttachments` 判决；核件输入面 = 文本单形不变——图止步载具层）；**窗内受理回执 `{ ok: true, queued: true }`**（挂起窗径批增——受理入队、消费前不入流）· **窗队共排队镜面**（`ev:queue` 两源之一——窗内消费 ∕ 残续发时 `delivered` 入流恰一枚））；`msg:interrupt` = 回合级（digest 中止 ⇒ 核件 catch 重入循环，非会话停；空闲等待期无在飞回合 ⇒ `idle`）；`dispose(key)` = 会话中止（abort ⇒ 清池不注入——陈旧结果不回灌；**触发面 ∕ 键面路由 = §3**）；**残输入兜底 = 普通回合续发**（VSC 形——**残值来源 = 端侧投影**〔给由：核 `done` 在非 Abort 失败径拒绝 ⇒ 兑现值 `residualInput`（`thincoder-core/agent/suspension.mjs:230`）不物化；实现按「受理（`pushInput`）∕ 消费（`driveTurn`）」两点自持 `entry.pending`——实读 = 批档 §5.4〕⇒ 非空以普通回合续发〔不静默丢〕；两窄径 = 窗退出等待期中落槽 ∥ 消化轮非 Abort 失败；先例 = VSC 队列兜底——对位表 = 批档 §2.3「关闭」行） | 核件 = 两端现行驱动的同源移植（`thincoder-core/agent/suspension.mjs` 档头自注「两端同源」· 载体零预设）；「对齐」= 同一核件（需求 §3.6 · 用户 06:54）；desktop agent 字段形 = CLI 形载体（`_suspended` ∕ 双池 ∕ pending 单容器全在 agent 上）⇒ 消费即得全语义 | **同形移植（第四份驱动）**——四份实现漂移面 + 违单源；**不接（保兜底支）**——违本批要因（空闲不唤醒 = 用户 10:11 原话）；**改核件签名（补状态行文案面）**——核件零文案纪律（契约 5 ∕ 10），越本端边界 |
| KD-35 | **完成提示面 = 失焦系统通知（单触发档——D3（parity-b4）去档②）+ 既有位标 + 状态栏挂起句**：通知出档 `thincoder-desktop/src/main/notify.mjs`（策略面零 electron 依赖，`notify` ∕ 焦态判据注入 ⇒ 平 node 直测；electron 装配住 `thincoder-desktop/src/main/main.mjs`）；**门 = 窗口失焦**（VSC `thincoder-vscode/src/extension/notify.mjs` 「focused = no-op · never noise」同判据）；**触发 = 用户回合完成**（`!autoTurn`——VSC 逐字同判据；实读 = `thincoder-vscode/src/extension/panel-callbacks.mjs:236` ∥ CLI 零通知）；**纯 ask 唤醒轮 ∕ 后台消化轮均不弹**（**D3**：原档②「后台消化轮起跑（pending > 0）」随 parity-b4 去——`digestStart` ∕ `notify.subagents` ∕ 调用点已删）；形态 = `title` = 会话标题（不可得 ⇒ 零携）+ `body` = 句（词键 `notify.done`——值 = 原 VSC 逐字，键值单源 = 核 `notify-policy.mjs`）+ 点击 = 聚焦窗口（VSC reveal 语义——不切会话）；**位标 ∕ 状态栏两候选不动**：`done` 码既有面自然点亮（回合尾置码 · 开页清码）、状态栏告警码集保持 `{approval, running}`（`done` 非告警面——既有裁定） | 用户原话「子任务完成后…零完成提示面」+ VSC 有形（失焦通知）；**D3（parity-b4——需求卷批准）**：VSC 无档②（实读 `panel-callbacks.mjs:236` 仅 `!autoTurn` 单档）⇒ 裁「去」（桌面单侧功能消 = 端差消）；不逐条 settle 通知（噪声 ∕ 同批无合并点） | **每 settle 逐条通知**（噪声 + 无合并点）；**通知即全部**（失焦外零面）；**点击切会话**（须新主→渲染命令通道——另裁） |
| KD-36 | **挂起 ∕ 消化可见面 = `ev:susp` + `ev:digest` + 状态段态机**：`ev:susp`（计数面 = 核 `backgroundCounts` 直传 · 进出两态）⇒ 状态行**段 3 状态文本**第三态 = 挂起句（「后台 N 子代理运行中〔 · M 完成待消化〕」∥「后台子代理收尾…」——zh 值 = CLI 逐字 ∕ en 值 = VSC 逐字）；优先序 = 挂起句 > 零节点（`approval` 支）> 运行中 > 就绪（段 3 态机 / N-M 映射 / 三键取值单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3）；`ev:digest`（边界面 = start ∕ cap ∕ end，`n` ∕ `tier` ∕ `ok` ∕ `ms`）⇒ **流内消化行族**（VSC `.digest-status` 同形；**显示 = 自然形**——行出即留（起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场）；本批 2026-10-01 收正——单源 = 本档 §1 **KD-62**）；记录面全量照留（留档批 · #719）——机制明细单源 = `docs/desktop/design/RENDERER.md` §1.1；词键 = 核字典 `digest.*`（`t()` 投影面直取——值同源零复制））；块侧「待消化」面 = **起跑窗归档**（`settled` 待消化（**含非挂起态 settle——块到达时点归位批 · #746**）⇒ 起跑点（`ev:digest start`）逐条补发 `done`——**主面**；`hooks.reclaim` = 兜底幂等——本批 2026-10-01 复位）；**D4「挂起态与 digest」两落点 = 本行**（PROJECT.md §10 S 行随批消解） | 需求 D4（S 行零落点随批消解）；D22「屏面为准」——CLI 挂起期状态文本 = 同句（`thincoder-cli/src/tui/suspension-drive.mjs` `backgroundStatusText`）；VSC 流内 `.digest-status` 同形（`thincoder-vscode/webview/chat-status.js`）⇒ 双标尺各有落点；digest 无面 ⇒ 自唤醒轮在流内不可辨（B1 落 ⇒ 必有面） | **状态栏新立段**（段集 = CLI 17 段闭集——D17 零静默省略律）；**通知即 digest 面**（失焦外零面）；**不落 digest 边界**（S 行留白 + 自唤醒轮无标识） |

| KD-47 | **子 agent 块跟滚让位修复 = 链稳定 × 帧尾复核 × 手势门控 × 核件出口**（2026-09-29 · 批 `docs/batches/2026-09-29-subblock-follow-resume.md` · 台账 #603）：① **池壳原位领用**（子 agent 族祖先链（host → body → family → block）跨帧零摘离——滚动位保真由链稳定承担；头原位重建；审批 ∕ 队列族 = **键控差分**（同键条目跨帧身份存续——RF #606③ 落形；键 = `promptId` ∕ 队列标题））② **帧尾复核**（`mountPool` 尾逐块 `applySubBlockFollow`——任何位面被抹 ⇒ 下一帧自愈）③ **让位三律**（近底无条件翻真 ∕ 手势门（600ms）翻假 ∕ 非手势位移不改旗标——核 KD-RC-8 收正）④ **出口钮 `sub-follow-btn`**（核件自持——两态词键 ∕ 点击回底；让位期可见）；**⑤ 零块帧领用门放宽（#660 · 2026-09-29 设计轮——批 `docs/batches/2026-09-29-desktop-carryover.md`）**：领用门（① 径之③）撤 `blocks > 0` 一判——判据 = 壳在位 ∧ 会话账匹配（`_poolSubSession === model.key`）；零块帧（审批 ∕ 队列族在场）同走 `adoptPool`（两族键控差分对零块帧同样生效——审批钮身份 ∕ hover ∕ focus 跨帧保真）；零块帧弃容器账（`_poolSub = null`）但**保留会话账**；子 agent 族空 ⇒ 摘离（族空零节点律）——下次出生全新建元素（零块弃账语义保持——承接行 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2 表行④）。帧可达实证 = **首回合首个工具审批**（主回合 `ev:approval` 亦写 `pool.approvals`，零子 agent 块——原门 ⇒ 每帧全建 ⇒ 审批钮身份跨帧丢）。**实施实读（2026-09-29）——焦点保真射程限定 = 池键帧**（`subBlocks` 键——不入对话流面键集）：同帧帧尾对话流审批卡 F-置焦自动锚（`thincoder-desktop/renderer/app.mjs:195`）**夺焦为独立机制**（本批零干涉）⇒ 焦点判据按池面独帧采——探针腿 `aFocusKeptPoolOnly` 自陈射程（探针 = `docs/batches/2026-09-29-desktop-carryover-P10.probe.mjs` ∕ 读数 `docs/batches/2026-09-29-desktop-carryover-P10-readings.json`——23 判全 true · `verdict:true`） | 用户三次复报「子agent输出不滚动」+ 真机探针实锤（六环链：churn 复位 → 复钉掩盖 → 一滚踩翻 → 复位+零写＝停摆 → 恢复不可发现 → VSC 无 churn）；跨端默认消除——核件两原语两端共用 ⇒ ③④ 面两端同收，实现面 = 桌面三轴（A ∕ B ∕ E）+ 核两轴（C ∕ D）+ VSC 二落点（键 ∕ 样式） | **存位回填**（掩蔽非根因——摘离仍毁选区 ∕ 焦点 ∕ 嵌套位）；**只护族容器**（祖先链断 ⇒ 位仍失）；**全壳字段级 diff**（形分叉 · 维护面反增）；**让位单边翻真**（拖条让位丢失）；**事件溯源式非手势识别**（重机具 · 跨端不可移植）；**出口钮端侧各建**（双实现面）；**出口钮计数（↓ N 新行）**（行合并致 N 语义不闭合） |
| KD-55 | **消化面留档 = 人读线记录 + 页读重建（消化面留档批 · 2026-09-30 · 台账 #719）**：① **记录两族**（人读线 `history` 条目——`pushReal` 同面追加 ∥ **不入机器线**（不喂模型））：`digest`（三型：`start` ∕ `cap` ∕ `end`——与 `ev:digest` 一一映射；产生面 = 宿主发帧点**同点双动作**）∥ `subagent`（`{ meta, rows }` 归档快照——产生面 = 渲染面归档派生点经 `record:append` 通道落宿主，**含非活动键**）；② **边界重划**：`subagent` ⇒ **页读域第六型**（六型全员页读；「运行期块」术语退场）；消化痕 `[data-digest]` = **流内普通项**（零 `data-block-id` ∥ 不占块序 ∥ 不计 `data-blocks`——沿两端实形：VSC 裁集不含消化行 ∥ CLI 行非块）——**显示 = 自然形**（行出即留——全轮在流；2026-10-01 收正——单源 = 本档 §1 **KD-62**）；**页读重建** = 复列**全量（未结轮照现）**（记录位次复列——位次落于已渲染块区之外 ⇒ 零复列——窗口即窗口；归档块 = 普通块——记录位次原位出（零配对））；③ **读面** = 核 `historyWindow` opt-in `{ records: true }` 直通（**默认关 ⇒ CLI ∥ VSC 零破**）+ 桌面折叠重建（`digest` 记录 ⇒ **全量（未结轮照现）**（`onDigest` 同式复用；可证面 = 轮间 ∥ 末页（扫描结束仍 `open`——批档 §2 钉定同字）；位次门：`at` 不可得 ⇒ 零产；起跑未载的 `cap` ∥ `end` 记录零产——容差①）∥ `subagent` 记录 ⇒ 留档块（`blockOfMessage` 同形））；④ **落盘节律 = 与消息同节律**（人读线段即时 ∥ 槽文件回合尾投影——单写者零破）；重建径置位规则与活流同一套（随到入流 ∕ 记录序重放——零配对 ∥ `blockAnchor`（端面现行导出名——零动作，非座次机残名）——PROJECT.md §10 **CR** 消解）；⑤ **行级消费者容忍清单**（记录 = 非消息条目）：`messageCount` = `history.length` **逐元素计数口径 ⇒ 记录计入**（判据 = 与既有口径同源——非「用户消息数」；N msgs 门零改；需求 **D23** 面 = 不可得 ⇒ 段缺席判据不动）；标题源 ∥ `firstUserMessage`（`isRealUserMsg` 谓词——`role` 面）**⇒ 跳过**（记录 `kind` 面 ⇒ 零命中，天然过滤）；⑥ **页量口径 = 记录计入 200 条页量**（条 = 人读线条目数——含记录；`hasOlder` ∥ `next` 游标三式零改——与核窗同一数组索引空间同源；「零消息页」式覆盖「仅记录页」同走——游标按条目推进不粘滞；负控 = 默认关 ⇒ 现行行为逐字等价；落点 = `docs/desktop/design/IPC.md` §2「页游标注」项 4） | 【依据】用户 2026-09-30 14:42 ∥ 14:48 两则（#719）+ 父侧实证（重载后 `.block-subagent` 1→0）；机制 ∕ 逐点单源 = `docs/batches/2026-09-30-digest-persistence.md` §2 ∥ `docs/desktop/design/RENDERER.md` §1.1「留档记录」条；跨端对齐义务（CLI ∥ VSC 恢复呈现）= 另批承接（列报 = 批档 §2 U1） | 【被否】端侧私有 sidecar（新存储面）；写机器线（喂模型污染）；痕改块（破 #720 守卫与 `DOM ≡ visible`）；宿主重导 subagent 生命周期（第二份解释器）；默认直通（CLI ∥ VSC 读面破） |
| KD-58 | **右栏宽度拖动 = 单一权威链（用户值）**（右栏宽度拖动批 · 2026-09-30 · 台账 #742 · 需求 D30）：① **拖柄** = `.pool` 左缘竖条（骨架锚 `data-pool-resizer` · 6px · `cursor: col-resize` · 静息透明 ∕ hover `--line` ∕ 拖动 `--accent`；`aria-label` 词键 `pool.resize`）——形态单源 = 本档 §2「右栏宽度拖动批注」；② **交互三段** = 按下（记起始宽 + pointer capture）⇒ 拖动预览（相对算式写内联 `--pool-w`（**写径 = CSSOM**——`documentElement.style` 变量写 ∥ `style` 属性径禁） · rAF 合帧——即时生效）⇒ 松手落定（**落定前置（刷一拍）**：rAF 待写在场 ⇒ 撤帧 + 同步落值 ⇒ **读回实宽**——所见即所存 ⇒ 落存储 + 归一写回——落定后零迟到写）；③ **范围上下限**（单源 = `thincoder-desktop/renderer/chrome.css` 栅格行 `clamp`）= `[15rem, max(36rem, 100vw - 30rem)]`——下限 240px = 池面可用底 ∥ 上限 = 中列保底 480px 且**拖动不得比现状默认更压中列**（36rem 底线）；窗口 resize = CSS 随窗重算（零 JS · 存储值零改——放大回窗恢复用户值）；④ **持久化** = 渲染面 `localStorage`（键 `thincoder.desktop.poolWidth` · 整数 px）——**端自有 UI 态**类（先例 = VSC `modelPrefs` 住宿主面 `workspaceState`——`thincoder-vscode/src/extension/session-io.mjs:14 ∥ :239-248`「端侧自有 · 非会话文件」；桌面 `app://` standard+secure ⇒ Web Storage 可用——`thincoder-desktop/src/main/protocol.mjs:43-47`）；写 = 仅松手一刻 ∥ 读 = 装配期一次（引导层在场期——零跳变）；失败 fail-soft（读失败 ∕ 非法值 ⇒ 视同未拖过；写失败 ⇒ 会话内照常）；⑤ **实读裁定（前提收正）**：#115「空池自动收窄」已作废（`docs/batches/2026-09-28-desktop-flow-vsc-align.md` §1.12——用户直斥；未启动零残留）——现盘零自动宽度行为；本链无「自动」一侧，**不重建 ∥ 不复活**；⑥ 边界 = 键盘 ∥ 双击复位不做 · 未拖过态窄窗挤压零变（UI「open」行残留项）· 核 ∥ 主进程 ∥ 通道面零触。 | 需求 D30（父侧 2026-09-30 收正后现文：拖动即时生效 ∥ 持久化（重启恢复）∥ **单一权威 = 用户值**；范围上下限 = 设计定形——判由：下限 = 池面可用底（240px——头行 + 条目折行仍可读；更窄无收益，让位已有折叠机制）∥ 上限 = 中列保底 480px 且不劣于现状挤压）；先例 = VSC 端自有 UI 态住宿主面存储（`workspaceState`——「非会话文件」句在册）；实读 = `--pool-w` 单源（`thincoder-desktop/renderer/theme.css:19`）+ 单消费（`thincoder-desktop/renderer/chrome.css:11`）· 渲染面零动态宽度代码 ∥ 拖拽件零先例（仓内 grep） | **共享 config 新字段**（跨端共享面——KD-9 被否候选：违 A2「不增跨端共享可变字段」旨）· **新落盘档**（第二份存储 ∥ 另立格式——KD-9 ∕ KD-56 被否候选）· **槽面字段**（UI 几何非会话语义 ∥ 跨端可读面）· **JS 钳制 + resize 监听**（界 ∥ 窗口随动双实现——CSS `clamp` 单落点已足）· **空池 ∕ 有池自动宽度**（#115——已作废，不复活） |
| KD-62 | **消化行族 = 自然形（行出即留 ∥ 终态追加 ∥ 零清理）**（消化行自然形收正批 · 2026-10-01 · 台账 #768）：① **行 = 流内事件 · 出即留**——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：**不改 ∥ 不删 ∥ 不退场**（零清理机器：无终态标签退场 ∥ 无换代删旧 ∥ 无复列最新一条）；模型面 = **全轮累积**（`onDigest` `start` **追加本轮** ∥ `cap`·`end` 就末轮更新）；② **终态 = 追加一条新行**——`end` 帧于当刻流末追加终态行（锚 `data-digest-end`；词键 `digest.done` ∕ `digest.aborted` 直取——**零新键**）；**不动原 digesting 行**（**零就地换文**——计数行恒为起跑文 `digest.start`）；**`n = 0` 守句**——`n = 0`（ask-only）⇒ 零计数行 ∥ 零终态行（禁幻影行；三端同守）；③ **复列 = 全量（未结轮照现）**——`foldDigest` 逐轮产出（轮锚 = 起跑记录：起跑行 ∥ `n > 0` 计数行 ∥ cap 行随轮出 ∥ `end` 记录在位 ⇒ 终态行；**可证面** = 轮间 ∥ 末页（扫描结束仍 `open`——批档 §2 钉定同字）——跨页截断 ⇒ 起跑未载的 `cap` ∥ `end` 记录零产（容差①）；**位次门** = `at` 不可得 ⇒ 该轮零产——#773 防御）；`withFoldedDigest` 并入 = **折叠轮 + 现轮集**（并序 = 折叠轮居前 ∥ 现轮集随后；**双份面消解 = 结构性**——首屏径：运行期未结轮在场 ⇒ 折叠未结末轮不并入（活流侧优先——唯一副本 = 运行期轮；所失面 = 异轮 + 活轮记录未及投影窗）∥ 运行期未结轮缺 ⇒ 折叠未结末轮照并入（照现）∥ 回填径 = 旧段并入（与活段零叠）；**零跨侧去重键**——`at` 只随折叠轮侧（记录面位次）；现轮集零位置面保持）；④ **归档落位 = 消费轮族后**（**随到达入流**——行族在流末时即「放族后」；迟到 ⇒ 随到入流；零存储）；⑤ **记录面照留**（**面分列**：记录侧 = 形 ∥ 通道 ∥ 落盘节律 **零动**（全量在档）；复列 = 显示侧折叠（`foldDigest` ∥ `withFoldedDigest` ∥ `clearDigest`——③ 即其输出）**随本批改**）；⑥ **起跑窗复位保持**（`ev:digest start` 发帧点逐条补发 `done`；`hooks.reclaim` = 兜底幂等）；⑦ **座次机拆除（#765）保持**（行族出生点定格 ∥ 零搬移 ∥ 零存储——重挂径 = 树面重建（重建轮于其记录位次复列 ∥ 未结轮 = 流末）；迟到残项 = 随到入流）；**复入窗 = 整置径**（回填使位次轮入区 ⇒ 删档 + 新写——记录序复列；零位置机具；单源 = `docs/desktop/design/RENDERER.md` §1.1）；形面（**无轮容器** ∥ **cap 行 ∥ 终态行 = 到达序追加**——两径差异在册）保持；**边界（有意特征 · 登记）** = 全轮累积 ⇒ 行族随会话单调增长——不受块窗（150）约束（清点 = 全量在场——沿池切片先例）；复位 = 会话切换 ∥ 重建（记录复列）——**非缺陷 ∥ 非泄漏**（行出即留为准）。机制明细单源 = `docs/desktop/design/RENDERER.md` §1.1。明细 = 批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §2。 | 用户 2026-10-01 07:54 直斥（「画蛇添足…多此一举的自我感动」——行消失 ∥ 就地换文 ∥ 清理）∥ 07:58（转写失真认账——「只留当轮」**非行删除授权**）；框架纪律 = 用户 19:01「这不是历史！是你当前的工作」（行 = 当前工作现场）；**口径 = 批档 §1**（原话逐字在档——判据即规格）；被否 = 「只留当轮」恢复 ∥ 终态就地换文 ∥ 终态标签退场 ∥ 换代删旧 ∥ 复列最新一条 ∥ 行删除类清理机器 |

| KD-60 | **三端消化面统一 = 桌面按 VSC ∥ CLI 实形重写（非补丁）**（三端消化面统一批 · 2026-09-30 · 台账 #747；行族显示面经 #768 收正 2026-10-01——见 ①②⑥）：① **行族显示 = 自然形（本批 2026-10-01 收正——#768）**——`onDigest` `start` **追加本轮**（切片全轮累积；行出即留——零清理）；两端（CLI ∥ VSC）随正已落（#768 跨端跟正批——行出即留同形；跨端差异 = **消**；重放口径 = 消化重放口径批收口：未结轮照现——本档 §1 **KD-62**）；② **终态 = 追加一条新行**——`end` ⇒ 终态行（词键 `digest.done` ∕ `digest.aborted` 直取）；**零就地换文**（计数行恒起跑文 ∥ 标签行恒在）；③ **归档触发（本批 2026-10-01 再收——起跑窗）**：`ev:digest start` 发帧点逐条补发 `done` = 主面（用户 2026-09-30 18:49 ∥ 02:08；`hooks.reclaim` = 兜底幂等——**三端同形（2026-10-01 裁 A——两端随正）**：对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:182` → `freezeReclaimDigestedBlocks`（两端兜底面同形））；**与 #746 衔接** = 起跑点 = 消费同刻（run-start 注入）——「归档 ≡ 消费同刻 ∥ 对不拆 ∥ 零即时归档」正中（对序由本批翻为 [轮][块]——同对不拆保持）；④ **归档落位 = 消费轮族后（三端同形——2026-10-01 裁 A：两端随正）**（**随到达入流**——行族在流末时即「放族后」；迟到 ⇒ 随到入流；零存储）；**`digestBoundaryOf` 块序守卫链退场**（沿 #747）；**模型同拍（桌面宿主面——窗口模型所需）= 随到入模**（[.. 块][行族][归档块][行内后产块 ..]（起跑窗内成立）；帧径 = **流面结算步**承接（单源 = `docs/desktop/design/RENDERER.md` §1.1「流面结算步」条）；**#765 收正 = 座次机拆除 + 锚整删（F2 零存储）**——2026-10-01）；**复列镜式** = `subagent` 记录 = 普通块——记录位次原位出（**零配对**——重放序自洽：归档记录居起跑记录之后 ⇒ [行族][归档块]）；**复列 = 全量（未结轮照现）**（本批 2026-10-01 收正 ∥ 消化重放口径批收口——旧轮行原位即记录位次））；⑤ **宿主面保留（三件齐）** = ①记录/复列（#719——不对称 = 跨端记录读缝桌面侧 opt-in 承接；证据 = `thincoder-desktop/renderer/page-read.mjs` ∥ `thincoder-desktop/src/main/session-io.mjs`；裁定 = 留档批 #719 用户两则）∥ ②窗表（`thincoder-desktop/src/main/suspension-drive.mjs` `windows`——不对称 = 桌面多会话窗生命周期；证据 = 同档；裁定 = 桌面空闲唤醒批 KD-34 链）∥ ③终态文宿主行（`thincoder-desktop/src/main/turn-face.mjs` `emitDigestEnd`——不对称 = 落盘节律回读窗口；证据 = 同档 `:168-175`（现盘实读）；裁定 = 留档批修复轮 3）；⑥ **词表（本批 2026-10-01 收正）** = 行族语汇以本批口径为准——「**行出即留**」（起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场）∥「**终态行**」（追加——零就地换文；锚 `data-digest-end`）∥「**复列全量**」（未结轮照现）∥「**起跑窗**」（归档触发形名——#754 复位）；**保留 ∥ 定名**：① 轴名「退场」（通用生命周期轴名）；② 切片清点档「未结轮归属」（**活流侧优先**——运行期未结轮在场 ⇒ 折叠未结末轮不并入；修复轮 1 · 2026-10-01 收正；单源 = `docs/desktop/design/RENDERER.md` §1.1）；③ **块族态名 = 等待消化**（`awaitingDigest`——1:1 界面词 `done · awaiting digestion`；映射表 = `docs/vsc/design/WEBVIEW-PROTOCOL.md:265`）；**#738 修复轮衔接** = 窗下界（首枚已标块）∥ 未标块不作锚 **保留**（复列面）；**#746 判句 J1/J2/J3 保持**（本批以起跑窗兑现；J2 括号内「起跑窗形居消费行族之前」= 随本批翻转覆盖——判句本体（归档 ≡ 消费同刻 ∥ 对不拆 ∥ 零即时归档）保持）；**上抛** = 批档 §2（行族遗留差异两条——**已裁 ∥ 规范句已落：并入本批（对位 VSC 收正）**——**cap 行位置 = VSC 尾追形（本轮元素族末位）∥ 轮容器形态 = 无轮容器（行元素 = 流内并列兄弟）**（形面单源 = `docs/desktop/design/RENDERER.md` §1.1 流内消化行族条；宿主能力例外 = 不适用） ∥ #746 依赖序——**已派先行**（父侧 · 2026-09-30 22:0x）） | 用户 2026-09-30 21:40「desktop 在异步消化这一块的逻辑完全是错的」+ 21:47「抽象转一手就变样——墙就是这么产生的」；两端实码 = 学习报告逐段核（VSC ∥ CLI 形面为源——2026-09-28 总纲「VSC 已有的一律复用 ∕ 上提共享（默认）」）；工序 = 对位物并排（批档 §2 对位物表）；**【更正 2026-10-01】**#747 之「行族回累积 ∥ 零摘除」方向 = 父侧全链复查推断（**误冠**——非用户直令；该方向随 #754 退场） | **只打补丁**（用户明拒——「按两端实形重写」）；**两端向桌面收编**（方向收正已否——两端沿各自形面承载「只留当轮」语义（#754 收正）；非桌面实现收编）；**守卫链保留 + 边界物叠加**（两机制并存 = 漂移面）；**回收窗保留**（与用户 18:49 ∥ 02:08 直令相抵——#754 退场）；**测试设计入设计线**（2026-09-27 裁定——验证手段不走设计线） |

## 2. 界面形态与交互（迁移自 UI.md 本域批注块）

**本批注（子 agent 块内容区跟滚 · #518 收口 · 2026-09-29）**：本注补「本批注（对齐第二批 · 六件）」项 3（右列子 agent 面）的行为面收口——用户 2026-09-28 18:15 走查「子agent区块里面的内容都不滚动！」；批档 = `docs/batches/2026-09-28-desktop-subblock-follow.md`（台账 #518）；口径 = 需求档 §3.6「对齐」= VSC 的形 + 行为。**让位语义 2026-09-29 收正——见下「本批注（块跟滚让位修复 · 2026-09-29）」**。

1. **块内容区跟滚（行为对齐 VSC §5.5）**——机制 = 核件原语直消费（`initBlockFollow` ∕ `maybeScrollBlock`——`thincoder-render-core/subblocks/block.mjs`）；桌面四点接线 = ① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——落点 = `views/pool-subagents.mjs`。
   **不夺阅读位**（用户上滚 ⇒ `_pinFollow=false` ⇒ 零写）；折叠 ∕ 已移除 ⇒ no-op；VSC 先例 = `webview/activity.js:160-176` + 帧尾 `streaming.js:31-32`；桌面帧 = **store 变更排帧**（核帧合并件——触发源 = store 变更；单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 ∕ `docs/desktop/design/RENDERER.md` §1.2）。
2. **池区帧尾钉底**——`mountPool` 尾 `maybePinPool(root)`（`views/activity-new.mjs`；`_poolPin !== false` ⇒ 写 `scrollTop`）——R10 E6 出生径的帧尾补齐（VSC `streaming.js:32` `frameEnd` 对位）；旗标 ∕ 计数贴 ∕ 点击回底三路零改。
3. **值面两行（映射源范围外漏项——本批补）**——`.advisor-block.sub-block .advisor-content { max-height: 60px }` · `.advisor-block.sub-block > summary { opacity: 0.75 }`（值源 = `thincoder-vscode/webview/chat.css:466-467` 逐字；落点 = `renderer/core.css` ④ 段）。
4. **判据**——机检 = 单元测试档（核心原语四例 + 桌面接线例 + 区钉底例 + 值落点锁；复跑 = `node --test docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`）；真机 = 五行为（流式内容跟滚 ∕ 近底复跟 ∕ 上滚不抢 ∕ 换块默认跟底 ∕ 区近底保持）。
5. **边界**——会话流主跟滚面零触（R12 既落在册）；核件其余留端项（出生位 ∕ 说明行判重 ∕ 痕迹 ∕ 帧调度）不属本批（逐项对账表 = 批档 §2）。

**本批注（块跟滚让位修复 · 2026-09-29）**：本注定形「让位死开关」修复的界面面——用户三次复报「子agent输出不滚动」+ 真机探针实锤（六环链：churn 复位 → 复钉掩盖 → 一滚踩翻 → 复位+零写＝停摆 → 恢复不可发现 → VSC 无 churn）；批档 = `docs/batches/2026-09-29-subblock-follow-resume.md`（台账 #603）；
   机制 ∕ 工艺单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**（让位三律 + 出口钮）∥ `docs/desktop/design/RENDERER.md` §1.1（池壳原位领用）§3（块跟滚 ∕ 帧尾复核）。

1. **内容窗出口（主体 · 两态）**——让位期（`_pinFollow === false` ∧ 内容可滚 ∧ 块展开）⇒ 块内容窗**右下 overlay** 钮 `.sub-follow-btn`；两态文案：让位期间有新行到达 ⇒ `sub.follow.new`（zh `↓ 新内容` ∕ en `↓ New output`），否则 ⇒ `sub.follow.bottom`（zh `↓ 回到最新` ∕ en `↓ Back to latest`）；点击 ⇒ 回底 + 复跟 + 钮退场。
   清账三路 = 点击 ∕ 近底复跟 ∕ 元素重建（同池列计数钮 `.activity-new-btn` 三清账路对位）；折叠态钮不显（CSS 兜底）。
2. **让位收窄（行为面）**——让位仅凭**用户手势**（`wheel` ∕ `touchmove` ∕ `pointerdown`）；非手势位移（程序写入 ∕ 复位回波）不改旗标；近底（< 24px）无条件复跟（「回近底复跟」判据保持）。
3. **样式落点**——端侧各自定形（核类名映射口径）：桌面 `renderer/core.css` ④ 段（D24 交互态组）；VSC `webview/base.css`（`.activity-new-btn` 邻位）。
4. **判据**——机检 = 单元测试档 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（**本批须新增**：首落 `.thincoder/tmp/` ⇒ 父侧 copy 终位）；真机 = 探针三件 `docs/batches/2026-09-29-subblock-follow-resume-probe.mjs` ∕ `-probe2.mjs` ∕ `-probe3.mjs`（父侧三件扩面 · **验收必需腿**）。
   真机探针**计入 D16 义务**（「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」——探针 = 真 Electron + 真实交互驱动〔真滚轮〕+ 读数落盘 = 使用面用例；闭合 = 父侧真跑）；回退 = 探针不可跑 ⇒ 人工走查 + 父侧真跑闭合。
5. **边界**——池列计数钮 ∕ 会话流药丸 ∕ 主跟滚面零改；出口钮无计数、无快捷键（禁自造）；池折叠态切换的位面复位不消除（用户手势——登记）；**键盘径 = 残余**（键盘滚动不属手势集、亦非复位回波——不改旗标；可达性 unverified〔需真机核〕：若可达 ⇒ 钉底态键盘上滚随下一帧复钉夺回——消解路与过期条件 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8）。
6. **边界归属（留端清算 · 用户裁定）**——原语 ∕ 旗标 ∕ 出口钮 = 核；**应用时机契约 = 核**（应用点清单：追加后 ∕ 挂载后 ∕ 帧尾复核——端只在宿主时刻调用核应用器；端侧遗漏应用点 = 违约缺陷）；**触发源 = 端**（桌面 store 变更 ⇒ 核帧合并件 `mark`——帧合并 ∕ 更新纪律收核，2026-09-29 收正；单源 = 核档 §2 KD-RC-9）；滚动策略族契约同源（近底 24px + 旗标门 + 清账三路——端 = 适配器）。

**本域·对齐第三批 B 两项（活动区 ∥ 停止钮）**

5. **活动区·「等待审批」态**——现状：零消费（子代理等审批仍显「运行中」）。对齐形：接核 `onSubagentApproval({ id, role, model, tool })` ⇒ `ev:subagent` patch `{ status: "approval", …, tool }`（`tool: null` = 清态）；
   归约面 `SUB_STATUS` 增 `approval` · `SUB_KEYS` 增 `tool`；块面 ⏸ + `sub.awaitingApproval`（核件 `refreshBlock` 直出——零端侧词面）。落点 = `agent-bridge.mjs` + `thincoder-desktop/renderer/subagent-reduce.mjs`。
6. **停止钮角色门**——**已由「对齐第二批」核件直消费落地**（核 `subblocks/activity-view.mjs` `FAMILY_ROLES` 门在核件内——桌面 ⏹ 全走核件）；本批 = 机检补例（**consult ∕ escalate 停钮 = 修后在场**〔批 `docs/batches/2026-09-29-hatch-clearance-2.md` 补做——`CANCELABLE_ROLES`〕· explore ∕ coder 在飞路径不变）。

**本批注（活动池与状态位 · 需求档 §3.5 三项落定 · 迁自 UI.md §2）**

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | 归组键 = 核 relay 前缀（`role#id`——`@thincoder/core/agent/relay-prefix.mjs`，扩展端已消费）；池内三条目族 = **活动块**（子代理 / advisor / consult——块面 = 核件同款（头行 + 状态词 + 内容 tail-3 + 展开）——「对齐第二批 · 六件」项 3）· **队列**（排队中回合 / 工具批）· **待审批**（计数 + 操作区，置顶）；折叠态按会话记忆。**落形**（批 A）= 三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）· 有会话三族皆空 ⇒ `empty`（**区域退场**——与 `none` 一致零子节点 · 锚值保留）· 否则 `pool`；**族序 = 待审批 → 活动块 → 队列**（族空 ⇒ 该族零节点）；折叠头两读数 = `running` / `approval`（`pool` 切片出；**非数 ⇒ 零节点**——禁假造；`store` 缺省 `running: 0` / `approval: 0` ⇒ 落 `0` 读数）· 折叠态键 = `poolCollapsed`（按会话记忆）· 控件锚 `data-action="pool:toggle"`；条目**内容回显 = 核件 tail-3 / 展开**（「对齐第二批 · 六件」项 3；块头读数 + 状态词——状态词出自 §1 闭枚举 **8 词**；**对齐第三批**：等待审批态（`approval`——本档 §2「对齐第三批」B5））· **清点口径**（批 8 落）= 条目入池即在场（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status`）——**收束不摘除**（长会话池切片单调增长；**队列族例外**——出队即摘除〔该族「对齐第二批」后零写者 · 席位保留——见下「用户排队消息住待发送带」句〕）；**用户排队消息住输入区上方待发送带（非流内——对齐第二批 · 六件 · 项 2）** = 忙态发送入队（写者 = `ev:queue` 归约——**`pending` 切片按会话分键** · 条目 = 文本串（A9 收正）；「回合中插入」批收正：原 store 纯动作退场、权威 = 宿主）——**右列「队列」族不再承载用户排队消息**（席位**保留 · 零写者** ⇒ 族空零节点恒不在场）；出队 = 宿主消费两时刻（步边界注入 ∕ 回合尾续发——单源 = `docs/desktop/design/PROJECT.md` §2 KD-40；见本档「输入区」行）；**窗限 / 归档** = 工具行摘除 · 子块**归档 = 入流**（「对齐第二批 · 六件」项 5；**R10 收正**：出生即驻留 ∕ `settled` 终态留场 ∕ `done` 回收 ⇒ 归档入流 ∧ **池内退场**——区域回 `empty` 零子节点）；**可见面修复批修**：条目标签行文本段逐段包元素 → `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 四件）」项 4 · **重定位（对齐重定位批）**：工具调用行摘除、活动块族 = 子 agent 实例 → 同上「本批注（对齐重定位）」项 2 |
| 2 · 标签位集合与优先级 | **落定** | 取值 = 运行中 / 待审批 / 完成 / 空闲；优先级 **待审批 > 运行中 > 完成 > 空闲**（一个会话同时命中多值时显示最高者）；来源 = 本会话的挂起表 + 回合状态（`onToken` / `onToolCall` / `onToolResult` 驱动）；另两端已有同义状态语义（“waiting” 类状态位先例 `thincoder-vscode/src/extension/panel-callbacks.mjs:54`）⇒ 三端语义一致、呈现各自定形；**清码判据 = 两族皆清**（`approval` 码摘除判据 —— 本键审批项（起源键）∥ 提问项皆无项才清；跨族误清两向同闭 —— 谓词单源 = `thincoder-desktop/renderer/badges.mjs` `hasPendingFor`，两清径同引） |
| 3 · 会话行「来源端」标注 | **落定** | 读 `sessions:list` 条目的 `createdBy`（核 `listSlots` 投影，实读 `thincoder-core/session-slots.mjs:217`——SLOT-END-PARAM 批落地）⇒ 会话行标注**创建端**（CLI / 扩展端 / 桌面端）；**缺键（老槽）⇒ 不标注**（不猜测——**禁以「占用端」冒充**，见下旁证行）；通道面 = `docs/desktop/design/IPC.md` §2 会话族行（**行 3 面归 SESSIONS 域——本档仅存历史，随分片轮随动**） |

**旁证（不得混称）**：**占用端**（谁正持有该槽运行）可由核 peer 面观察（`thincoder-core/peer-instances.mjs` 的端字段）——那是另一事实，与「来源端」不同义，本端**不**以它冒充来源端。

**本批注（右栏宽度拖动 · D30 · 2026-09-30 · 台账 #742）**：本注定形右栏（活动池列）宽度拖动（用户 2026-09-30 19:54「我希望右栏宽度可以拖动。」+ 19:55 排期令；需求卷 **D30**——父侧 2026-09-30 收正后现文：拖动即时生效 ∥ 宽度持久化（重启恢复）∥ **单一权威 = 用户值**；范围上下限 = 设计定形）；
批档 = `docs/batches/2026-09-30-pool-width-drag.md`；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-58**——本注只述形态 ∥ 交互面，不重述决策。

**实读前提（本批第一裁定 · 前提收正）**：#115「空池自动收窄」提案（`docs/batches/2026-09-28-desktop-flow-vsc-align.md` §1.11）已于 2026-09-28 21:02 经用户直斥**作废（未启动、零残留）**（同档 §1.12）；现盘**无任何自动宽度行为**（实读 = `thincoder-desktop/renderer/theme.css:19` 恒 `36rem` · `chrome.css:11` 单引用 · 渲染面零动态宽度代码——#729 审计「右列自适应 ⇒ 已退役零残留」同证）。
故本注「仲裁」= **单一权威链**（无「自动」一侧可挂）：

1. **拖柄形态**：落点 = 右栏左缘（中 ∕ 右交界）竖条——骨架 = `thincoder-desktop/renderer/index.html` 的 `.pool` 首子 `div.pool-resizer`（锚 `data-pool-resizer` + `role="separator"` + `aria-orientation="vertical"`——静态骨架 · 零面向用户字符串，`aria-label` 运行期注入）；
  样式住 `chrome.css`：贴左缘（`inset-block: 0` · `inset-inline-start: 0` · 宽 **6px** · `.pool` 增 `position: relative`——唯一几何前提）、`cursor: col-resize`、`touch-action: none`（输入面收正——触控径手势不接管）、**静息透明**（零分割线——承扁平化裁）；hover 显形 `--line` ∥ 拖动态 `--accent`（2px 竖线）；拖动期 `body.pool-resizing`（全局 `col-resize` + 禁选）。
2. **交互三段**（pointer 事件族 · 判据单源 = 本注 · 实现工艺 = `docs/desktop/design/RENDERER.md` §1.3）：① **按下**——记起点（起始宽 = `getBoundingClientRect().width` 读回 ∥ 起始 x）、`setPointerCapture`、`preventDefault`；
  ② **拖动预览（即时生效）**——相对算式 `next = 起始宽 + (起始x − 当前x)`（px 取整）⇒ 写 `documentElement` 内联 `--pool-w`（**写径 = CSSOM**——`documentElement.style.setProperty("--pool-w", …)` 变量写；现盘先例 = `thincoder-desktop/renderer/views/chat-text-segments.mjs:179 ∥ :318`；**`style` 属性写径列禁径**——平台行为未核）；**rAF 合帧**（每帧至多一写，中间移动丢弃）；
  ③ **松手落定**——**落定前置（刷一拍）**：rAF 待写在场 ⇒ 撤帧（`cancelAnimationFrame`）+ 同步落待值（末次 move 位——不丢末位）；随后读回实宽（取整——**所见即所存**）⇒ 归一写回 + 落存储 + 撤类（落定后零迟到写）；`pointerup` ∥ `pointercancel` 同径；表外键 ∥ 双击 ∥ 键盘 ⇒ 零动作。
3. **范围上下限**（单源 = `chrome.css` 栅格行 `clamp(15rem, var(--pool-w), max(36rem, 100vw - 30rem))`）：下限 **15rem = 240px**（池面可用底——头行 + 条目折行仍可读；更窄无收益，「让位」已有折叠机制承担）；上限 **`max(36rem, 100vw - 30rem)`**（中列保底 480px ∧ **拖动不得比现状默认更压中列**——36rem 底线）；`--pool-w` 语义 = 用户值 ∕ 默认值单源，钳制在消费点执行。
  **窗口 resize 交互 = 零 JS**（CSS 随窗重算 ⇒ 显宽随窗钳制，**存储值零改**——放大回窗恢复用户值；未拖过态 36rem 恒落 `clamp` 恒等 ⇒ **逐窗零变**）。
4. **持久化载体**（实读裁定）= 渲染面 **`localStorage`**（键 `thincoder.desktop.poolWidth`——值 = 整数 px 串）：判由 = **端自有 UI 态**类（与另两端无共义）——先例 = VSC `modelPrefs` 住宿主面 `workspaceState`（`thincoder-vscode/src/extension/session-io.mjs:14 ∥ :239-248`「端侧自有 · 非会话文件」）；
  桌面宿主 = Electron（`app://` 注册 `standard + secure`——`thincoder-desktop/src/main/protocol.mjs:43-47` ⇒ 真 origin ⇒ Web Storage 持久）。
  **非**共享 config 新字段（跨端共享面——KD-9 被否候选）∥ **非**新落盘档（第二份存储 ∥ 另立格式）∥ **非**槽面（UI 几何非会话语义）。**写入时机 = 仅松手落定一刻**（拖动中零写）；**读回时机 = 渲染面装配期一次**（先于首绘可及面——引导层在场期完成，零可见跳变）；
  失败面 = 读 ∥ 写皆捕获 + `console.error` 一行（零静默）——读失败 ∥ 值非法（非正有限数）⇒ **视同未拖过**（降级 36rem）；写失败 ⇒ 本次会话内照常生效（fail-soft）。
5. **仲裁判句（写死）**：**右栏宽度唯一权威 = 用户值**——未拖过（无存储值）⇒ `--pool-w` ≡ 默认 36rem、**零内联写**（任何池 ∥ 会话状态变化都不写宽度——宽度模块零 `store` import，机检腿）；拖过（存储值在）⇒ 一切时刻（启动 ∥ 窗口 resize ∥ 池空 ∕ 有池 ∥ 会话切换）以用户值为唯一决策者；未来若引入任何宽度机制，本链即其仲裁基线（用户值恒优先）。
6. **边界**：键盘调整 ∥ 双击复位（均未入需求——不做）· 空池 ∕ 有池自动宽度（#115 已作废——**不重建 ∥ 不复活**）· 未拖过态窄窗挤压（默认 36rem 零变——「open」行残留项保持）· **输入面 = pointer 事件族**（鼠标 ∕ 笔 ∥ 触控——样式族 `touch-action: none` 使手势不被接管，触控零特判同径；判由 = 拖动本体即 pointer 事件族）· 左列 ∥ 中列 ∥ 池内容行为零改 · 核 ∥ 主进程 ∥ 通道面零触（纯渲染面面内设施）。

**本批注（右栏池极多实例可滚动 · D35 · 2026-10-02 · 台账 #801）**：本注定形「右栏子 agent 极多时须可滚动」的实读结论、现场复现判据与候选映射——用户 2026-10-01 18:13 走查原话「右栏子agent极多的时候需要能够滚动」；需求卷 **D35**（`docs/desktop/requirements/ACTIVITY.md`）；批 = `docs/batches/2026-10-02-desktop-ux-closeout.md` §2.2。

**实读结论（设计轮 · 隔离实例真跑探针 · 3–5 号正式）**：

1. **滚动容器链完好**：骨架 = `.app` 栅格 `minmax(0,1fr)` → `.pool`（flex 列 + `min-height:0` + `overflow:hidden`）→ `.pool-body`（`flex:1` + `min-height:0` + `overflow:auto`；`chrome.css`）；60 块夹具（内容超高 `max=1697`）下——真滚轮上滚 ∥ 程序化写位 ∥ `_poolPin` 随动翻假，**全数生效**。
2. **帧密期同绿**（20ms 帧泵模拟极多子 agent 活跃流）：帧尾 `maybePinPool` 未夺用户滚动位——钉底竞态类**未复现**。
3. **唯一确认行为面 = 内容区首拍截留**：滚轮落块内容区（`max-height:60px` 内滚层）时首拍被内层消化（约 61px 行程、列不动），次拍起达列；帧密同形。**该行为 = 让位三律既定语义**（#518 ∥ #603 用户直令「内容区可滚动」——不判缺陷、不改）。
4. **全屏层覆盖 ⇒ 滚轮全吞**（隔离首启态向导层误挡实证）：配置态不应在场——真机腿先排除。

**复现判据（实施轮先跑 · 两腿）**：

- **腿 A（合成 · 机检）**：60 块夹具（摘要形 ∥ 内容形两臂）⇒ 溢出成立（`scrollHeight > clientHeight`）∧ 上滚 ×3 ⇒ `scrollTop` 单调减（**三拍内必动**）∧ `_poolPin` 翻假 ∧ 程序化写位生效。
- **腿 B（真机 · 现场）**：活跃风暴期（≥6 并发子代理在飞）真机真滚轮上滚 **×3 拍**（CDP 真滚轮——同探针法）⇒ `scrollTop` 减 ∧ `_poolPin=false`；FAIL ⇒ 逐层分离定位（`elementFromPoint` 覆盖层 ∥ 内容区截留 ∥ 钉底三面）；闭合面 = 真机手跑读数 ∥ 证据固化 = 探针件两径入批内件（沿 CC ③ 先例）。
- **收口规则**：腿 A FAIL ⇒ 归因（回归域）后按映射修 + 重跑；腿 B FAIL ⇒ 按候选映射修（覆盖层 ⇒ 该层退场保证；钉底类 ⇒ 池 `createPinWatch` 手势门对齐 600ms 族——**复现面 = #563② ∥ BY 行 `docs/desktop/design/PROJECT.md:1174`：「再现 ⇒ 再立小修」触发**；其余 ⇒ 现场归因上抛）；腿 B PASS（现状可滚）⇒ 以两腿证据收口 + 用户面复验，**不造机制**。

**边界**：块内容区滚动语义（让位三律）零动；`.pool-body` 骨架值零动；VSC 侧零触。探针件 = `.thincoder/tmp/pool-scroll-probe{3,4,5}.mjs`（临时——PASS ∥ FAIL 两径证据随实施轮固化入批内件 ∕ 探针件）。

## 3. 挂起窗键面路由（迁自 PROJECT.md §2.2——本域单源）

**dispose 触发面对照表（VSC ∥ CLI → 桌面）**：

| 触发面 | VSC ∥ CLI 对位 | 桌面（定形） |
|---|---|---|
| 删会话（`session:delete` 成功） | VSC = 面板销毁 ⇒ abort（`thincoder-vscode/src/extension/suspension.mjs:237-239` 生命周期路径）∥ CLI = 会话 abort | **`dispose(key)` 已落**（`thincoder-desktop/src/main/ipc.mjs:124-126`）⇒ **级联中止窗**（驱动 `thincoder-desktop/src/main/suspension-drive.mjs` register 清 + `abortSignal` 中止——清池不注入 + `ev:susp {active:false}`） |
| 切走会话（会话控制面切换——`thincoder-desktop/renderer/session-wire.mjs:123`（`activateSession`）） | VSC = 面板切换；CLI 无会话控制面 | **窗存续**（窗归会话键——agent 跨会话存活，`thincoder-desktop/src/main/agent-host.mjs:66-67` 同键复用；切回即见）；**确认面零扩展**（窗 ≠ 阻塞面，切走不停窗） |
| 切项目（`project:open` 成功且 cwd 变更） | —（两端无挂起窗对位面） | **旧项目全键窗中止**——会话键面 = `String(slot)` 为项目内命名空间（跨项目同槽号撞键）+ 装配 ∕ 回合取值挂 `currentCwd()`（`thincoder-desktop/src/main/agent-host.mjs:107` / `:157` / `:194`）⇒ 跨项目续跑 = 键面 ∕ 取值面双错位 |
| 退出（应用 ∕ 窗口关闭） | VSC = 宿主进程亡 ∥ CLI = 进程退出 | **零额外机制**（进程终止 ⇒ 窗随进程亡；窗态零持久化——`ev:susp` 为运行期切片） |

**非同键输入 ∕ 事件处置**：窗属 A、用户在 B 发送 ⇒ B 走既有 `send` 单驱动径（`flights` 按键隔离）；A 的事件（`ev:susp` ∕ `ev:digest` ∕ `ev:subagent`）按 `key` 落各自切片——非同键帧对当前视图零可见面（**活态切回即见**（窗 ∕ 计数切片）；
   **行痕族**——显示 = 自然形（**digest 员行出即留——全轮在流**；**五清家族** = `stopMark` ∕ `timerNotice` ∕ `compress` ∕ `digest` ∕ `helpLines`——**首屏门单源** = `thincoder-desktop/renderer/page-read.mjs` `applyPage`；清点面分员见下句——两门 ∥ 单门）
   **清点两门（行痕族消失时机批 · 2026-10-04 · 台账 #919）**：`helpLines` ∕ `stopMark` 两员 = 首屏门 ∥ **回合起跑门**（`msg:send` 出站即清 + 晚到 `stopped` 丢弃闩——两门幂等并集；单源 = `docs/desktop/design/RENDERER.md` §1.6 **KD-74**）；
   `timerNotice` ∕ `compress` ∕ `digest` 三员 = 首屏门单门（未裁零动——`digest` 行出即留全轮在流，2026-10-01 口径维持）。
   **+ 复列 = 全量（未结轮照现；记录位次原位——零配对）**（留档批 · #719——单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条）；跨会话可见面维持标签位标既有口径）。

**唤醒 ∕ 消化轮的会话钉定（`_slot` 重钉）**：窗项持**入口键 + 入口 cwd**；每轮起跑（消化轮 ∥ 唤醒轮 ∥ 窗内用户回合）前按本窗键重装槽（`loadAgentSlot`——含 `_slot` 重钉 + 跨端槽改动随新读；先例 = 扩展端「每轮从槽新读」`thincoder-vscode/src/extension/suspension.mjs:242-243`）⇒ 回合落槽面 = 本窗键槽（非现刻 `activeSession`——切标签零影响）。
**timer 轮的重装先于投递**（`deliver` 面内——投递行须落重装后的机读线；`driveTurn` 对 timer 轮零重装（防二次重装吞行）；明细 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17）。

**跨键互斥**：同键至多一窗（窗表键唯一——重入 = 零动作）；**跨键各自独立**（各键 agent ∕ flights ∕ 切片互不相干——多窗并行 = 扩展端多面板同形；零跨键协调机制）。

**忙态排队面随动（回合中插入批 · 单源 = PROJECT.md §2 KD-40）**：窗面路由零改（窗内提交 ⇒ `pushInput` + `wake`；携附件 ⇒ 同受理——载具层携图，见 KD-34）；**两路由优先序** = **窗在场 ⇒ 窗面路由优先** ∕ **无窗在飞 ⇒ 忙态队**（含消化轮在飞——`autoTurn` 轮不传回调 ⇒ 该队待回合尾续发消费——机检例 = 「窗在场 ∧ 消化在飞」双臂）；
**忙态队（在飞回合中）= 宿主新面**——队列单源 = 宿主（`thincoder-desktop/src/main/queued-input.mjs`），消费两时刻 = 步边界 ∕ 回合尾，**队列先于接管**（回合尾队非空 ⇒ 先续发；队空 ⇒ `poolLive` 判真才进窗——用户输入优先）；
会话中止两面同源（`dispose` ∕ 切项目 ⇒ 窗中止 + **在飞回合中止 + 在飞表清**（`flights` 两径同清）+ **忙态队清**——零续发，消息随会话终止）。
**中止墓碑（回合代次 · 单源 = 本段）**：`dispose` ∕ `abortSuspensions`（切项目级联）两径按会话键落代次（`thincoder-desktop/src/main/turn-driver.mjs:49-57` `turnEpochs` ∕ `epochOf` ∥ `revokeTurns` ∕ `turnGate`）；
   **切项目径并释放旧 cwd 认领**（`releaseClaimsAll`——核单源 `thincoder-core/session-slot-claims.mjs:215`；桌面落点 = `thincoder-desktop/src/main/ipc.mjs` `openProjectChannel`，cwd 实变才触发）；
该刻前代次的回合尾在**四查位**同失效——① `takeOver` 零重注册（`:217` 首行查位）② 步边界缝零取批（`:139` 查位）③ 回合尾落盘零写（`thincoder-desktop/src/main/turn-face.mjs:33-36` ∕ `:61` ∕ `:65`）④ **边界轮 `end`/`cap` 帧 ∥ 记录零写**（`emitDigestEnd` ∥ cap 腿墓碑查位——已撤销 ∥ 已删会话零帧零记录）；
回合起跑在代理上落当代次（`thincoder-desktop/src/main/turn-face.mjs:42` 单点）⇒ 查位 = 代次比对——会话重开后新回合自动合法（**零清除面**：无「清墓碑」竞态窗口）；**终局帧不设门**（四查位不含终局帧面——口径澄清 · 实读 = 批档 §5）。

## 4. 文件账（本域）

### 4.1 本端文件清单与行数预算（本域族行 · 迁自 `PROJECT.md` §4.1）

| 文件 | 行数 | 职责 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs` | **308**（届盘实读收正——表载 305 ⇒ 308；波 2a 迁移销项） | 挂起驱动胶水（起跑 ∕ 注册 ∕ 关清 ∕ 输入路由 ∕ 窗内队——行全文随分片轮齐平） |
| `thincoder-desktop/src/main/suspension-timers.mjs` | **75**（届盘实读收正——表载 68 ⇒ 75；波 2a 迁移销项） | 窗内定时器面（自 `suspension-drive.mjs` 出档——行全文随分片轮齐平） |
| `thincoder-desktop/renderer/events-wake.mjs`（R5 拆档产出） | **102**（届盘实读收正——表载 101 ⇒ 102；波 2a 迁移销项） | 宿主唤醒面三切片归约（`ev:susp` ∕ `ev:digest` ∕ `ev:timer`——行全文随分片轮齐平） |
| `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | **292**（届盘实读收正——表载 239 ⇒ 292；波 2a 迁移销项） | 消化行族构树（自然形——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行；单源 = 本档 §1 **KD-62**——行全文随分片轮齐平） |
| `thincoder-desktop/src/main/suspension-guard.mjs`（队列取项边缘收正批新档） | **27**（实读 2026-09-29） | 降级窗占位守卫序列出档（自 `thincoder-desktop/src/main/suspension-drive.mjs` 拆出——越 300 预案落形：`guardedDeliver(key, hold, deliver)` = 起窗 ⇒ 送达面（信号直通）⇒ 窗后查位 ⇒ `release`（纯结构搬 ∕ 零行为变）；差异面（裁决回传后的 `return` ∕ `break` 与 `consumed` 用法）留调用点（`driveTurn` ∕ `resumeResidual`）；零宿主依赖 ⇒ 平 node 直测；单源 = 批档 `docs/batches/2026-09-29-queue-pickup-edge.md` §2.10 出档预案） |
| `thincoder-desktop/src/main/timer-watch.mjs`（timer-wake 阶段 2 新档） | **76**（实读 2026-09-29） | 空闲 deadline 闩（键面 · 注入缝 · `unref`；单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.13） |
| `thincoder-desktop/src/main/notify.mjs`（本批新档） | **11**（实读 2026-09-29——政策体上提核 `thincoder-core/notify-policy.mjs`；本档 = re-export） | 提示面策略（失焦门 + 单档句 + 点击聚焦；`notify` ∕ `focused` ∕ `reveal` 三件注入——零宿主依赖 ⇒ 平 node 直测；词键 = 核件持有〔值 = 核 `notify-policy.mjs` `NOTIFY_TEXTS`——zh ∕ en 常量对〕）（单源 = 本档 §1 KD-35） |
| `thincoder-desktop/renderer/pool.css` | **111**（实读 2026-10-01——扁平化随动收口批（#713）落盘后（112 ⇒ 111）；更前实读 2026-09-30——门回填；前读 113（实读 2026-09-29）） | 活动池与审批卡样式（零断点——R13 后单断点消解；形态单源 = `docs/desktop/design/UI.md` §1 审批呈现行 / §2 项 1 行——分档理由同上一行） |
| `thincoder-desktop/renderer/subagent-reduce.mjs`（对齐第二批拆分产出） | **258**（实读 2026-10-01——**#765 落盘后**（回线 ⇒ 越层除名 + 预案注销兑现 ✓）；前读 **301**（#747 落盘后（座次入模——`appendArchived` 两调用点（父侧 22:45 裁 = 准机制落；`PROJECT.md` §4.2 本批行 10）；**越 300 ⇒ 越层在册**——见 `PROJECT.md` §4.1 越层段；**#765 落盘 258 ⇒ 兑现（回线）**）；前读 = **250**·留档批（#719）：`emitRecords` 出站（含非活动键 ∥ fail-soft）∥ 快照 `rows` 保尾上界（500 + `boundedRows`）；**超 ≈205 估**——标记 ∥ 行计数两件 + 两出站点注释；更前 2026-09-29 = 191） | 子 agent 归约径出档（自 `thincoder-desktop/renderer/events.mjs`——越 300 拆分落形） |
| `thincoder-desktop/renderer/pool-width.mjs`（右栏宽度拖动批 · 已落） | **123**（实读 2026-09-30——实施落盘（≈100 ⇒ 123）；对账终值） | 右栏宽度面（chrome 级直写）：读 ∥ 写（`localStorage` 键 `thincoder.desktop.poolWidth`）· 值解析纯函数 · 内联 `--pool-w` 应用 · 拖柄三段接线（rAF 合帧 ∥ 落定读回）+ `refreshResizerLabel`；注入缝 `{ doc, win, storage, root }` ⇒ 平 node 直测——机制 ∕ 判据单源 = 本档 §1 **KD-58** ∥ `docs/desktop/design/RENDERER.md` §1.3 |
| `thincoder-desktop/renderer/views/activity.mjs` | **210**（实读 2026-10-01——复核扫面收正批实施后（194 ⇒ 210——M4 逐件就地差分）；更前实读 2026-09-29——桌面收尾批（#660 门放宽 + 空族支）后；内容行数口径；**未越 300**） | 活动池（本批落形：三态 `none` / `empty` / `pool` · 族序 = 待审批 → 活动块 → 队列 · 折叠头两读数 `running` / `approval`——禁假造 · 待审批族操作区 = 复用 `thincoder-desktop/renderer/views/approval.mjs` 导出描述符〔单一 owner · 零副本〕；形态单源 = `docs/desktop/design/UI.md` §2 项 1 行；**#518 批**：`mountPool` 尾一调 `maybePinPool`；**让位修复批**：`mountPool` **三径**（壳原位领用——子 agent 族祖先链零摘离）+ 帧尾复核扫——现行 ⇒ 预期 = 本档 §4.2 本批行） |
| `thincoder-desktop/renderer/views/pool-subagents.mjs`（R5 拆档产出） | **130**（实读 2026-10-01——复核扫面收正批实施后（132 ⇒ 130——M11 消费改引）；更前实读 2026-09-29——桌面收尾批（#660 空族守卫）后） | 池面子 agent 族键控差分族（元素构造 ∕ 行重放 ∕ 冻结着装 ∕ 同键更新 ∕ 出生 ∕ 键控差分）；**让位修复批**：+`applySubBlockFollow`（帧尾复核扫）——现行 ⇒ 预期 = 本档 §4.2 本批行 |
| `thincoder-desktop/renderer/views/activity-new.mjs`（R10 新档） | **113**（实读 2026-10-01——复核扫面收正批实施后（112 ⇒ 113——M4 注）；更前实读 2026-09-29——RF 波 3 后） | 池面出生计数贴（未跟底 ⇒ 计数 + 钮；帧尾 `maybePinPool`） |
| `thincoder-desktop/renderer/views/pool-tree.mjs`（让位修复批拆档产出） | **174**（实读 2026-09-29——desktop-residuals-round3 波 A 后） | 右列池面**纯构树族**（自 `thincoder-desktop/renderer/views/activity.mjs` 出档——沿「纯构树 ∕ 薄挂载」两层分家 · 越 300 预案落形；`poolModel` → `poolTree` + 节点族；零 DOM ⇒ 平 node 直测） |
| `thincoder-desktop/src/main/subagent-face.mjs`（R3b） | **81**（实读 2026-09-29） | 子 agent 停止出口 + 存活投影起 / 停 / 清点（自 `agent-host.mjs` 出档） |
| `thincoder-desktop/renderer/mount-pool.mjs`（切片 3 迁入——判域 = 活动池面接线；原址指针在册） | **101**（实读 2026-09-29——RF 波 2 后） | 活动池面接线（自 `app.mjs` 拆出——在册预案落形；`docs/desktop/design/SHELL.md` §1 树同源） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 4.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（桌面空闲唤醒）行「现行 ⇒ 预期」**（实读 2026-09-28；机制 ∕ 判据单源 = 本档 §1 KD-34–36；通道面 = `docs/desktop/design/IPC.md` §1）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/suspension-drive.mjs`（本批新档） | — ⇒ **157**（实读 2026-09-28——驱动胶水：会话寄存器 + 入口（核件装配 + 会话控制器 + 载体挂 `_sessionAbort` ∕ `_sessionSignal`）+ hooks 四件（计数 ∕ 边界 ∕ 回收 ∕ 冻结）+ 输入 ∕ 关闭路由 + 提示面触发两档；零宿主依赖 ⇒ 平 node 直测） | **本批** |
| `thincoder-desktop/src/main/notify.mjs`（本批新档） | — ⇒ **11**（现读 2026-09-29—— **R6 上提后**只留 re-export（策略体住核 `notify-policy.mjs`：失焦门 + 载荷成形 + 词键）；单档 `turnDone`（档②去—— parity-b4 D3）；`notify` ∕ `focused` ∕ `reveal` 三件注入留端 `main.mjs`） | **本批** |
| `thincoder-desktop/src/main/agent-host.mjs` | **254 ⇒ 285**（实读 2026-09-28——单回合执行面提取（`send` ∕ 驱动同源 · `suspDriven: true`）+ 挂起接管（成功 ∕ 失败两径同接管）+ `send` ∕ `interrupt` ∕ `dispose` 三路由 + 注入面扩；**越 300 顾问线预案 = 回合执行面再出档 ⇒ 已执行**（`turn-face.mjs` 出档——下行 · 285 ≤ 300）） | **本批** |
| `thincoder-desktop/src/main/turn-face.mjs`（本批新档 · 在册预案落形） | — ⇒ **52**（实读 2026-09-28——单回合执行面：在飞表占位 + `suspDriven: true`（撤回合尾直注入兜底）+ 三径结算（落盘 → 读数 → 终局事件）+ 释放在飞） | **本批** |
| `thincoder-desktop/src/main/main.mjs` | **93 ⇒ 104**（实读 2026-09-28——通知装配注入（Notification 构造 ∕ 焦态源 ∕ 聚焦——无窗口 ⇒ 门闭）） | **本批** |
| `thincoder-desktop/src/preload/preload.cjs` | **58 ⇒ 58**（实读 2026-09-28——`EVENT_CHANNELS` **13 ⇒ 15** 落形（+ `ev:susp` ∕ `ev:digest`，序随桥面表）；结构不变 ⇒ 行数净 0） | **本批** |
| `thincoder-desktop/renderer/events.mjs` | **494 ⇒ ≈530**（两通道归约（`ev:susp` 写计数切片 ∕ `ev:digest` 写消化行切片）+ 消化行游标；**与「对齐第二批」串行**（其拆 `page-read.mjs` 先落 ⇒ 本批基线 = 拆后档）） | **本批** |
| `thincoder-desktop/renderer/views/statusline.mjs` | **269 ⇒ ≈285**（段 3 态机四支：挂起句 ∕ 零节点 ∕ 运行中 ∕ 就绪——读 `susp` 切片；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3） | **本批** |
| `thincoder-desktop/renderer/views/chat.mjs` | **280 ⇒ ≈295**（消化状态行组 `[data-digest]`——非块节点，沿 `[data-pending]` 先例） | **本批** |
| `thincoder-desktop/renderer/mount-status.mjs` | **26 ⇒ ≈27**（`STATUS_KEYS` 增 `susp`） | **本批** |
| `thincoder-desktop/renderer/app.mjs` | **254 ⇒ ≈255**（`CHAT_KEYS` 增 `digest`） | **本批** |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **69 ⇒ ≈75**（订阅表 **13 ⇒ 15**——同源实读 = `thincoder-desktop/renderer/events-subscribe.mjs`） | **本批** |
| `thincoder-desktop/renderer/i18n.mjs` | **425 ⇒ ≈431**（词键 +3 × 2 语：`susp.*` 三键（zh = CLI 逐字 ∕ en = VSC 逐字）；**`digest.*` 零新键**——核字典经 `t()` 投影面直取（值同源零复制）；**`notify.*` 词键 = 核 `notify-policy.mjs` 持有（R6 上提后——非渲染面词表，本行不计）**；现行列基线随 align-2 结算回填） | **本批** |
| `thincoder-desktop/renderer/chat.css` | **≈325（「对齐第二批」后） ⇒ ≈340**（`.digest-*` 两规则——起跑 ∕ 终态两态） | **本批** |
| 测试面 | 原址补例：`agent-host`（挂起进出 ∕ 输入路由 ∕ digest 中止 ∕ dispose）· `events-reduce`（两通道归约 + 游标）· `views-statusline`（段 3 态机四支）· `views-chat`（消化行组）· `host-floor`（`EVENT_CHANNELS` 15 断言——**存量越线在册**：**313**（实读 2026-09-28）· 消解窗口已到 = `PROJECT.md` §4.1 越层段）· 新档 `thincoder-desktop/test/agent-host-suspension.test.mjs`（**232**（实读 2026-09-28）· 驱动族平 node 直测；两向自检在册）+ `thincoder-desktop/test/files.mjs` 登记行；真机面 = 人工走查 + 父侧真跑闭合（**D16 义务**——fixture 家无凭据 ⇒ 真跑子任务面不可离线复现）；测试档随修随加（2026-09-27 裁定 · 不进设计面条目） | **本批** |
| `docs/desktop/design/{PROJECT,IPC,RENDERER}.md` + `docs/render-core/design/RENDER-CORE.md` + `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 本批设计落定（本档 §1 KD-34–36 ∕ `PROJECT.md` §4.2 ∕ §6.1 ∕ §10 · IPC 两通道 + `msg:send` ∕ `msg:interrupt` 挂起口头 · RENDERER 消化行族与挂起切片 · 核档三处「桌面无挂起窗」收正） | **本批**（已落） |
| `docs/desktop/design/UI.md` | **门控解除**（外壳批设计评审轮 2 通过——2026-09-28）⇒ 本批 UI 面内容 = 批档 §2 定形 + UI.md 三处已随落（`:19` / `:21` / `:456-457`——本批批档 §1.7 已核验） | **本批** |

**本批（子 agent 块跟滚 · #518 · 设计轮 + 修复轮）行「现行 ⇒ 预期」**（实读 2026-09-29——内容行数口径；机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（子 agent 块内容区跟滚 · #518 收口 · 2026-09-29）」；决策 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/renderer/views/pool-subagents.mjs` | **108 ⇒ ≈118**（+import + 四点接线——核原语 `initBlockFollow` ∕ `maybeScrollBlock`） | 本批 |
| `thincoder-desktop/renderer/views/activity-new.mjs` | **100 ⇒ ≈109**（+`maybePinPool` + `notePoolBirth` 复用） | 本批 |
| `thincoder-desktop/renderer/views/activity.mjs` | **259 ⇒ ≈262**（`mountPool` 尾一调 + import） | 本批 |
| `thincoder-desktop/renderer/core.css` | **281 ⇒ ≈287**（+两值规则 + 值源行——值源 = `thincoder-vscode/webview/chat.css:466-467`） | 本批 |
| 测试面 | 单元测试档 `docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`（已建成 · 367 行 · 随批留存 · 不入仓套件；复跑 = `node --test`） | 本批 |
| `docs/desktop/design/{UI,PROJECT,RENDERER}.md` + `docs/render-core/design/RENDER-CORE.md` + `docs/vsc/design/WEBVIEW.md` | 本批设计落定（五档——机制面 = 核档 KD-RC-8 ∕ UI 本批注；明细 = 批档 §2） | 本批（已落） |

**本批（子 agent 块跟滚让位修复 · 2026-09-29）行「现行 ⇒ 预期」**（实读 2026-09-29——内容行数口径；机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**（让位三律 + 出口钮）· 本档 §1 **KD-47** ∥ `docs/desktop/design/RENDERER.md` §1.1（池壳原位领用）§3（块跟滚 ∕ 帧尾复核）；批档 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-render-core/subblocks/block.mjs` | **71 ⇒ ≈120**（+≤50：旗标手势门（600ms）+ 出口钮 `sub-follow-btn` 三件 + 档注） | 本批 |
| `thincoder-desktop/renderer/views/activity.mjs` | **262 ⇒ ≈292–312**（`mountPool` 三径领用对账 + 帧尾扫调用；**>300 ⇒ 预案 = 纯构树族出档 `renderer/views/pool-tree.mjs`**——沿「纯构树 ∕ 薄挂载」两层分家） | 本批 |
| `thincoder-desktop/renderer/views/pool-subagents.mjs` | **115 ⇒ ≈128**（+`applySubBlockFollow` 导出） | 本批 |
| `thincoder-desktop/renderer/views/chat-subagent.mjs` | **75 ⇒ ≈78**（归档径 `initBlockFollow` 接线） | 本批 |
| `thincoder-desktop/renderer/core.css` | **287 ⇒ ≈295**（+`.sub-follow-btn` 规则 + `:not([open])` ∕ `.sub-frozen` 两兜底——实现两行，§6 登记） | 本批 |
| `thincoder-desktop/renderer/i18n.mjs` | **480 ⇒ ≈488**（+两键 × 两语 + 链记录行；键数链 `HOST_DICT` **269 ⇒ 271**；越 300 在册——键行 = 非结构性触碰 ⇒ 续期） | 本批 |
| `thincoder-vscode/locales/en.json` ∕ `zh.json` | **270 ∕ 270 ⇒ ≈272 ∕ ≈272**（+两键，两语同拍） | 本批 |
| `thincoder-vscode/webview/base.css` | **476 ⇒ ≈483**（+`.sub-follow-btn` + 两兜底（折叠 ∕ 冻结）——`.activity-new-btn` 邻位）；**越 300 在册** ⇒ 处置 = **续期说明**——本批不拆依据 = ≈+7 行样式规则（非结构性触碰，不构成拆分窗口）；消解窗口 = 样式族下次结构性触碰的批（触碰时到期——拆分 ∕ 上抛二择）；**域外观察**：`chat.css` **511** 越 500 硬限 ⇒ 本批避让 + 上抛（§10 CC②） | 本批 |
| 测试面 ∕ 探针面 | 单元测试档 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（机检腿——**本批须新增**：首落 `.thincoder/tmp/` ⇒ 父侧 copy 终位）+ 探针三件 `docs/batches/2026-09-29-subblock-follow-resume-probe.mjs` ∕ `-probe2.mjs` ∕ `-probe3.mjs`（真机探针 · **验收必需腿**——父侧三件扩面） | 本批 |
| `docs/render-core/design/RENDER-CORE.md` + `docs/desktop/design/{UI,PROJECT,RENDERER}.md` + `docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL}.md` | 本批设计落定（六档——机制面 = 核档 KD-RC-8 收正 ∕ UI 新本批注；键登记 = `WEBVIEW-PROTOCOL.md` §6.3 **24 ⇒ 26**） | 本批（已落） |

**本批（timer-wake 阶段 2 · VSC + 桌面）行「现行 ⇒ 预期」**（实读 2026-09-28——内容行数口径；机制 ∕ 判据单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.10–§6.30.15；桌面面读数 = 核档 §6.30.13）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-core/agent/suspension.mjs` | **240 ⇒ ≈265**（`timerFace` opt-in 三注入项 + 等待第四态 + 兑现支——缺省零注册） | 本批 |
| `thincoder-desktop/src/main/timer-watch.mjs`（**已落** · 实读 **79**） | — ⇒ **≈95**（空闲 deadline 闩——会话键面 ∕ 注入缝 ∕ `unref`） | 本批 |
| `thincoder-desktop/src/main/agent-host.mjs` | **285 ⇒ ≈297**（装配 + 武装点 + `dispose` ∕ 级联撤闩） | 本批 |
| `thincoder-desktop/src/main/suspension-drive.mjs` | **196 ⇒ ≈214**（`timerFace` 装配 + 出窗重武装 + 交付落流 + `driveTurn` 转发） | 本批 |
| `thincoder-desktop/src/main/turn-face.mjs` | **52 ⇒ 54**（`timerTurn` 透传——核 opts 四件 ⇒ 五件） | 本批 |
| `thincoder-desktop/src/preload/preload.cjs` | **58 ⇒ 59**（`EVENT_CHANNELS` 16 ⇒ 17——基线含在途批 `ev:ledger`） | 本批 |
| `thincoder-desktop/renderer/events.mjs` | **393 ⇒ ≈403**（`ev:timer` 归约——`timerNotice` 切片） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | **439 ⇒ ≈447**（流内触发行——与消化行族同法） | 本批 |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **73 ⇒ 74**（订阅表 16 ⇒ 17） | 本批 |
| `thincoder-desktop/renderer/store.mjs` | **307 ⇒ 308**（`timerNotice` 初态） | 本批 |
| 测试面 | 原址补例 + 新档 `thincoder-desktop/test/timer-wake.test.mjs`（实读 **286** · **T-TW17–T-TW21**；同 #785 族（档已失））+ 集成域新档 `thincoder-desktop/test/integration/timer-wake-face.test.mjs`（拟新增 · 未落 · **T-DSK44**）+ `host-floor` 计数随动；测试档随修随加——不占设计条目（2026-09-27 裁定） | 本批 |
| `docs/desktop/design/{UI,IPC,RENDERER,PROJECT,E2E-TESTING}.md` + `docs/render-core/design/RENDER-CORE.md` + `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 本批档面落点（六加一——明细 = 核档 §6.30.13 末块；本收尾轮已落） | 本批（已落） |

**本批（右栏宽度拖动 · D30 · 2026-09-30 · 台账 #742 · 批 `docs/batches/2026-09-30-pool-width-drag.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/desktop/design/UI.md` §1「本批注（右栏宽度拖动 · D30 · 2026-09-30）」∥ `docs/desktop/design/RENDERER.md` §1.3 ∥ 本档 §1 **KD-58**；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/index.html` | **55 ⇒ 56**（`.pool` 首子拖柄节点一行——静态骨架；零面向用户字符串） | 骨架 |
| 2 | `thincoder-desktop/renderer/theme.css` | **95 ⇒ 96**（`--pool-w` 声明行补注——用户值可内联覆写 ∥ 界 = 消费点单源；值 36rem 零改） | 变量单源 |
| 3 | `thincoder-desktop/renderer/chrome.css` | **269 ⇒ ≈287**（栅格行改 `clamp(15rem, var(--pool-w), max(36rem, 100vw - 30rem))`——界常量单落点 + `.pool` 增 `position: relative` + `.pool-resizer` 规则族（贴左缘 ∥ cursor ∥ `touch-action: none`（触控径防接管） ∥ hover ∥ 拖动 ∥ `body.pool-resizing`）+ 注释） | 布局 ∥ 拖柄 |
| 4 | `thincoder-desktop/renderer/pool-width.mjs`（已落） | — ⇒ **123**（实施落盘 2026-09-30——实读值；读 ∥ 写 ∥ 值解析 ∥ 应用 ∥ 拖柄接线（三段 + rAF 合帧 + 落定读回）∥ 装配入口 ∥ 标签注入；注入缝 ⇒ 平 node 直测） | 宽面 |
| 5 | `thincoder-desktop/renderer/app.mjs` | **292 ⇒ ≈295**（装配期一次 `initPoolWidth()` + 帧分派 locale 支一调 `refreshResizerLabel()` + 注释） | 装配 |
| 6 | `thincoder-desktop/renderer/i18n.mjs` | **391 ⇒ 393**（词键 `pool.resize` 两语各一行——en「Resize activity panel」∥ zh「拖动调整活动栏宽度」；**键数链随动 = `HOST_DICT`（合并表）293 ⇒ 294**——`pool.*` 族属该表（链现值 293：`thincoder-desktop/renderer/i18n.mjs:44-71`）；链行续写 = **实施轮笔**） | 词面 |
| 7 | 批内件 | `docs/batches/2026-09-30-pool-width-drag.test.mjs`（已建成 · 242 行——五腿：拖柄在盘 ∕ 持久化写读 ∥ 未拖过零写 ∥ 落定读回 ∥ 仲裁负控（零 `store` 依赖 + 界单落点）；随批留存 · 不进仓套件） | 全批 |
| 8 | 设计档 | `docs/desktop/design/UI.md` §1（本批注 + 布局 ∕ open 两行行内指针）+ 变更记录 · `docs/desktop/design/RENDERER.md` §1 索引 + §1.3 + 变更记录 · 本档 §1 **KD-58** ∕ §4.1 新档行 ∕ §4.2 本块 · `docs/desktop/design/PROJECT.md` §6.1 表头 + 批注 ∥ §7 **T-DSK52** ∥ §8 ∥ §10 **CW** | 全批 |

零触面：核（`thincoder-core/**`）∥ `thincoder-render-core/**` ∥ 主进程（`thincoder-desktop/src/**`）∥ 通道表 ∥ preload ∥ 左列 ∥ 中列行为 ∥ 池内容面（`.pool` 内容零改——唯加拖柄兄弟节点与列盒两行）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（消化面留档批 · 设计轮 · 2026-09-30 · 台账 #719 · 批 `docs/batches/2026-09-30-digest-persistence.md`）行「现行 ⇒ 实读落值」**（回填轮终值——实读 2026-09-30；内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2；实施 = 两舱（批档 §5））：

| # | 档 | 现行 ⇒ 实读落值 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/suspension-drive.mjs` | **337 ⇒ 285**（拆档兑现——窗内时效面出档 `suspension-timers.mjs` **68**；digest `start` 记录追加（与发帧同点双动作）；`end` 追加随写点前移出档（修复轮 3）；**≤300 回线 ⇒ 越层除名**——同 `docs/desktop/design/PROJECT.md` §4.1 越层段；回填轮值 295 = 中间值） | 写面① |
| 2 | `thincoder-desktop/src/main/turn-face.mjs` | **173 ⇒ 197**（`cap` 记录与 cap 帧同点（`:142-143`）；import 面随动；修复轮 3——`end` 记录写点前移（`emitDigestEnd` `:169-176` ∥ 两径结算前 `:179` ∥ `:184`）；回填轮值 176 = 中间值） | 写面① |
| 3 | `thincoder-desktop/src/main/session-io.mjs` | **46 ⇒ 65**（`appendRecord(agent, record)` 薄壳（`:58-65`）——核 `pushReal` 直复用 + fail-soft） | 写面 |
| 4 | `thincoder-desktop/src/main/agent-host.mjs` | **277 ⇒ 291**（`recordAppend` 处理体（`:248-259`）∥ 装配表命中门 + 返回面一枚） | 写面① |
| 5 | `thincoder-desktop/src/main/ipc.mjs` ∥ `ipc-registry.mjs` | **265 ⇒ 270** ∥ **89 ⇒ 90**（`HANDLERS` 表 45 ⇒ 46 行项——`record:append` 注册） | 白名单 46 |
| 6 | `thincoder-desktop/src/preload/preload.cjs` | **78 ⇒ 80**（`CHANNELS` 末位 46 + 档头计数随动） | 白名单 46 |
| 7 | `thincoder-desktop/renderer/page-read.mjs` | **146 ⇒ 207**（记录折叠重建——`digest` 记录 ⇒ 终态轮（携位次）；`subagent` 记录 ⇒ 留档块；首屏 ∥ 回填两径；**超 ≈190 估**——折叠 ∥ 位次两面全注释 + 折叠算法成本） | 读面 |
| 8 | `chat-digest.mjs` | **208 ⇒ 298**（位次面四件（`roundAt` ∥ `shownDigestRounds` ∥ `pendingDigestSeats` ∥ `seatDigestRounds`）+ `adoptDigestRounds` ∥ `syncDigest` 位次对位重写；`digestBoundaryOf` 守卫零改；**超 ≈235 估**——位次面四件全注释 + 对位算法；<300 距线 2 行 ⇒ 贴层在册） | 痕面 |
| 9 | `thincoder-desktop/renderer/subagent-reduce.mjs` | **191 ⇒ 250**（归档派生点 `record:append` 出站（含非活动键 ∥ fail-soft）；快照 `rows` 保尾上界 + 明示标记；**超 ≈205 估**——标记 ∥ 行计数两件 + 两出站点注释） | 写面② |
| 10 | `thincoder-desktop/renderer/views/chat.mjs` ∥ `views/chat-tree.mjs` | **305 ⇒ 234** ∥ 新档 **127**（构树面出档——`chatTree` ∥ `blockNode` ∥ `pushFlow` 按记录位次复列；**≤300 回线 ⇒ 越层除名**——同 `docs/desktop/design/PROJECT.md` §4.1 越层段） | 重建径 |
| 11 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **217 ⇒ 221**（`syncDigest` 位次注记 ∥ 再出口保名注记——协议面零改） | 帧刷 |
| 12 | `thincoder-desktop/renderer/events-wake.mjs` | **88 ⇒ 88（净 0）**——`onDigest` 直复用于重建复列（记录形 = 事件形）；注释随动 | 归约面 |
| 13 | `thincoder-desktop/renderer/chat.css` | **348 ⇒ 350**（注释随动——「运行期块」表述 ⇒ 留档块两处；痕样式零改） | 注释 |
| 14 | `thincoder-core/history-window.mjs` | **179 ⇒ 194**（记录直通 opt-in ∥ `kindOf` 认 `kind` 键；默认径逐字等价——负控腿）；**核面例外登记 = `docs/desktop/design/PROJECT.md` §6.2 A4 ∥ §8** | 核缝 |
| 15 | `thincoder-core/context.mjs` | **440 ⇒ 440（零改）**——`pushReal` 直复用 | 核缝 |
| 16 | 测试面 | 批内件 = `docs/batches/2026-09-30-digest-persistence.test.mjs`（**九腿**（原五腿 + 复盘腿 6 + 修复轮 3 腿 7）· **9/9 绿**——父侧复跑 ✓）；原 digest 相关批内件（`docs/batches/2026-09-29-desktop-digest-parity.test.mjs` ∥ `docs/batches/2026-09-30-desktop-digest-instream.test.mjs`）随动 ∥ 退役二择归 #708；真机支 = 重载 ∥ 重挂 ∥ 切走切回走查（父侧 D16 义务——`docs/desktop/design/PROJECT.md` §7 **T-DSK49**）；仓套件 = 收口轮父侧跑 | 全批 |
| 17 | 设计档 | `docs/desktop/design/{RENDERER,UI,PROJECT,IPC}.md` 四档（本批顺落 + 回填轮终值收正）+ 变更记录 | 全批 |
| 18 | `thincoder-desktop/renderer/store.mjs`（**表外 —— 实施披露**） | **302 ⇒ 303**（`visibleWindow` 去 `subagent` 例外——留档块计 `data-hidden` ∥ 可回填；**触属性裁定 = 行级小修（非结构性）⇒ 消解窗口顺延**——同 `docs/desktop/design/PROJECT.md` §4.1 越层段） | 记账条 |
| 19 | `thincoder-desktop/src/main/session-slots.mjs`（**表外 —— 增派**） | **231 ⇒ 235**（`pageHistory` 开直通 `{ records: true }`——设计 §2 ② 已明 ∥ §四 表缺行，随批补登） | 读面 |
| 20 | `thincoder-desktop/renderer/views/chat-subagent.mjs`（**表外 —— 注释随动**） | **100 ⇒ 101**（留档块口径注释收正——「运行期块」表述退场） | 注释 |

**值列口径**（本块）：「现行」列 = as-of 2026-09-30 实读**修正值**（内容行数口径——文末换行不计；修正 = `split("\n").length` 口径 −1；交叉核两例：`ipc.mjs` **265** ∥ `views/chat.mjs` **305** 与 §4.1 既有值逐字同）；「实读落值」= 实施终值（两舱落定——2026-09-30 实读）。

**本批（消化回流归位 · #738 · 设计轮 · 2026-09-30 · 批 `docs/batches/2026-09-30-digest-reflow-anchor.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径；机制 ∕ 判据单源 = 批档 §2；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/suspension-drive.mjs` | **285 ⇒ ≈293**（起跑窗补发 `done`（`driveTurn` boundary 支）+ 注释收正） | 归档面 |
| 2 | `thincoder-desktop/renderer/events-wake.mjs` | **88 ⇒ +1..4**（`onDigest` `start` 支全替——切片 = [本轮]） | 归约面 |
| 3 | `thincoder-desktop/renderer/page-read.mjs` | **207 ⇒ +2..8**（`foldDigest` 最新一条 + 合并口径） | 读面 |
| 4 | `chat-digest.mjs` | **298 ⇒ ±40**（行集随 `status` + 行族定位重构；**贴 300 层**（距线 2 行）——净增致越 300 ⇒ **拆分预案 = 位次面（位次四件 ∥ 对位算法）续拆（新档名实施批定）**；消解窗口 = 本批（结构性触碰）） | 痕面 |
| 5 | 批内件 | `docs/batches/2026-09-30-digest-reflow-anchor.test.mjs`（已建成 · 647 行——机检腿六条（见 §7「消化回流归位批注」）；随批留存 · 不进仓套件） | 全批 |
| 6 | 设计档 | 本档 §1 **KD-36**（决策）∥ `docs/desktop/design/PROJECT.md` §6.1 **D4** 行 ∥ §7「三端消化面统一批注」（#747 取代原批注）· `docs/desktop/design/RENDERER.md` §1 ∕ §1.1 · `docs/desktop/design/UI.md` §1 · `docs/desktop/design/IPC.md` §1 + 四档变更记录 | 全批 |

**本批（三端消化面统一 · #747 · 2026-09-30 · 批 `docs/batches/2026-09-30-triple-end-digest-unify.md`）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-09-30（内容行数口径——文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ §5；**实施交付 2026-09-30（终态 clean）——值列实读回填**）：

| 1 | `thincoder-desktop/src/main/suspension-drive.mjs` | **292 ⇒ 294**（实施落盘 2026-09-30——实读值；起跑窗补发撤——`driveTurn` 支 `reemitDone` 调用删；`reclaim` 钩升**主面**（注文收正）；`freezeAll` 注文同拍） | #747 |
| 2 | `thincoder-desktop/renderer/events-wake.mjs` | **89 ⇒ 123**（实施落盘 2026-09-30——实读值；`onDigest` `start` 支改**追加**（累积）；注文收正） | #747 |
| 3 | `chat-digest.mjs` | **116 ⇒ 226**（实施落盘 2026-09-30——实读值；`syncDigest` 重写：累积同步 ∥ 座次 ∥ 边界物设 ∕ 清 ∥ ghost 摘除删；`digestBoundaryOf` 退场（导出面删）；`clearDigest` 口径随动；**仍不越层**——226 ≤ 300（净增超 ≤151 预估）） | #747 |
| 4 | `chat-digest-seat.mjs` | **232 ⇒ 275**（实施落盘 2026-09-30——实读值；**档去留 = 保留（改写——非删档）**；**轮容器撤（对位 VSC）** ⇒ 行族 = 流内并列兄弟（构树 ∥ 行集同步 ∥ 位次面按行族对位随形改）；`digestRows` 标签行恒在；`syncRound` 删标签增删支；座次标（`seat`）落地；位次面三判据随动——窗下界 ∥ 未标块不作锚保留 ∥ 出生即定随零摘除简化） | #747 |
| 5 | `thincoder-desktop/renderer/views/chat.mjs` | **234 ⇒ 244**（实施落盘 2026-09-30——实读值；`mountTail` 归档分支 ⇒ 边界物插入；`settleFrame` 落位随动） | #747 |
| 6 | `thincoder-desktop/renderer/views/chat-tree.mjs` | **128 ⇒ 151**（实施落盘 2026-09-30——实读值；`pushFlow` 座次复列 + 消费轮配对） | #747 |
| 7 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **221 ⇒ 221**（实施落盘 2026-09-30——实读值（净 0——5 增 5 删）；`digestBoundaryOf` 再出口删 ∥ `blockAnchor` 注文同拍） | #747 |
| 8 | `thincoder-desktop/renderer/page-read.mjs` | **213 ⇒ 281**（实施落盘 2026-09-30——实读值；`foldDigest` 全量轮 + 配对；`withFoldedDigest` 并入口径随动；**屏代归一**（`rebaseKeptSeats` ∥ `shiftKeptSeats`——设计外补强 · 实施披露）） | #747 |
| 9 | `thincoder-desktop/renderer/chat.css` | **350 ⇒ 354**（实施落盘 2026-09-30——实读值；轮间规则复归——**行元素面落（无轮容器）**：轮族相邻 ⇒ 轮间 0（#718 口径；累积后可达）；**越 300 在册**） | #747 |
| 10 | `thincoder-desktop/renderer/subagent-reduce.mjs`（**声明外面 · 父侧 22:45 裁 = 准机制落**） | **250 ⇒ 301**（实施落盘 2026-09-30——实读值；座次入模——`appendArchived` 两调用点（归档快照入 `state.blocks` 唯一路径）；**越 300 层在册**——见 `docs/desktop/design/PROJECT.md` §4.1 越层段） | #747 |
| 11 | `thincoder-desktop/renderer/views/chat-model.mjs`（**声明外面 · 注释级**） | **104 ⇒ 104**（实施落盘 2026-09-30——实读值（净 0）；注释 1 处（词表级）） | #747 |
| 12 | 批内件 | `docs/batches/2026-09-30-triple-end-digest-unify.test.mjs`（**已建成 · 580 行**——四腿：**行族累积**（`start` 逐轮追加 ∥ 旧轮零动 ∥ 零摘除；含 cap 尾追 ∥ 首轮族居轮内后产块之前）∥ **标签恒在**（`end` 只换计数行文）∥ **reclaim 归档落位**（3a 归约面座次入模 ∥ 3b/3b′ 归档块居消费行族之前（含头段换代径）∥ 3b″ 非跟滚补偿读数 ∥ 3c 驱动面「恰一发」+ consult 零补发）∥ **重载复列**（4a 全量完整轮 + `endAt` ∥ 4b/4c 消费轮配对 ∥ 4d/4e #738 保留面（窗下界 ∥ 未标块不作锚）∥ 4f/4g 屏代归一）；随批留存 · 不进仓套件） | 全批 |
| 13 | 设计档 | 本档 §1 **KD-60** ∥ `docs/desktop/design/PROJECT.md` §6.1 **D4** 行 ∥ §7「三端消化面统一批注」· `docs/desktop/design/RENDERER.md` §1 ∕ §1.1 · `docs/desktop/design/UI.md` §1 · `docs/desktop/design/IPC.md` §1 + 四档变更记录 | #747 |

零触面：核包 ∥ 协议 ∥ 记录面（形 ∥ 通道 ∥ 折叠单源）∥ `state.mjs`（单源 = 批档 §2；`subagent-reduce.mjs` ∥ `chat-tree.mjs` 两档已出零触面——见上表行 6 ∥ 10，父侧 22:45 裁）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（消化行只留当轮收正 · 2026-10-01 · 台账 #754 · 批 `docs/batches/2026-10-01-digest-row-current-only.md`）行「现行 ⇒ 预期」**（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ 本档 §1 **KD-62**；**设计轮——产品码零触**；**后续收正 = #768 消化行自然形收正批（行族显示 ∥ 复列口径按现行 = §1 KD-62）——本块值列按发生时点阅读**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/events-wake.mjs` | **123 ⇒ ≈125**（`onDigest` `start` 支 ⇒ **全替（切片 = [本轮]）**（旧轮**出模型**——真不留；三端通判一员）；`rid` 单调保续（替换前算）；注文收正） | 归约面 |
| 2 | `chat-digest.mjs` | **226 ⇒ ≈262**（`syncDigest` 增**行族摘除扫**（键 ∉ 模型轮集 ⇒ 摘；非 live 面零动作）；`boundaryRowOf` ⇒ **本族文档序末元素**（翻转——计数行＝状态行 ∥ 无 ⇒ 标签行）；`seatTarget` 取面随动（首同座次块）∥ `liveSeatPlan` 毕业收取面 + 算不中即静止 + 兜底带序；注文收正；**贴 300 层——仍不越**〔拆分预案在册 = `docs/desktop/design/PROJECT.md` §4.1〕） | 痕面 |
| 3 | `chat-digest-seat.mjs` | **275 ⇒ ≈292**（`digestRows` 行集随 `status`（终态非 ask ⇒ 无标签行）；`syncRound` 标签行增删支；注文收正） | 构树面 |
| 4 | `thincoder-desktop/renderer/page-read.mjs` | **281 ⇒ ≈286**（`foldDigest` ⇒ 复列最新一条（末条终态轮）；`withFoldedDigest` ⇒ **≤ 1 合并**；**毕业标随屏代清**（重基 ∥ 整置 ∥ 重挂）；注文收正） | 读面 |
| 5 | `thincoder-desktop/renderer/chat.css` | **354 ⇒ ≈352**（`.chat-digest + .chat-digest` 轮间规则不可达再临——清理 ∥ 标注 = 实施轮；**触属性 = 行级小修（非结构性 ⇒ 不触发本批拆分——消解窗口随下次触碰顺延）**；拆分 ∕ 越层预案在册 = `docs/desktop/design/PROJECT.md` §4.1 越层段） | 样式面 |
| 5a | `thincoder-desktop/renderer/views/chat.mjs` | **244 ⇒ ≈246**（`mountTail` 插点语义随动——归档块挂载 = 边界之后（`insertAfter` 语义：多枚到达序）） | 挂载面 |
| 5b | `thincoder-desktop/renderer/views/chat-tree.mjs` | **151 ⇒ ≈153**（**复列镜式翻转**——归档块出序居其消费轮族之后（原出零触面——本批翻转）） | 出序面 |
| 5c | `thincoder-desktop/renderer/subagent-reduce.mjs` | **301 ⇒ ≈301**（座次入模注文随「族之后」收正——零语义；**越层档**——拆分预案在册 = `docs/desktop/design/PROJECT.md` §4.1） | 归约注文 |
| 5d | `thincoder-desktop/src/main/suspension-drive.mjs` | **294 ⇒ ≈298**（**起跑窗复位**——`driveTurn` boundary 支逐条补发 `done`；`hooks.reclaim` ⇒ 兜底幂等；注文） | 宿主归档面 |
| 5e | `thincoder-cli/src/tui/suspension-drive.mjs` ∥ `thincoder-cli/src/tui/startup.mjs` ∥ `thincoder-cli/src/tui/conversation-writer.mjs` | **220 ⇒ ≈226**（起跑摘旧轮痕行——`digestTurn` 起跑点摘上轮行集）∥ **317 ⇒ ≈321**（重建复列末轮——`historyToLines` digest 支；**现值越 300 建议线**——触属性 = 行级小修（非结构性）⇒ 拆分窗口顺延；实施轮首步实读复核——越 300 即停手上抛）∥ **62 ⇒ ≈66**（行摘除切口——将改件补入） | CLI 显示面 |
| 5f | `thincoder-vscode/webview/chat-status.js` | **124 ⇒ ≈132**（起跑摘旧轮痕元素（标签 ∥ 计数 ∥ cap——上轮元素族）；重建末轮随 §5.7） | VSC 显示面 |
| 6 | 批内件 | `docs/batches/2026-10-01-digest-row-current-only.test.mjs`（已建成 · 664 行——八腿 + 两端臂（见 §7「消化行只留当轮收正批注」））· `docs/batches/2026-10-01-digest-ends-probe.mjs`（已落 · 107 行——探针收位——评审发现 10）；随批留存 · 不进仓套件 | 全批 |
| 7 | 设计档 | 本档 §1 **KD-62** ∥ **KD-33** ∥ KD-36 ∥ KD-55 ∥ KD-60 涉句 ∥ `docs/desktop/design/PROJECT.md` §6.1 D4 行 ∥ §7「消化行只留当轮收正批注」∥ 本档 §7 **DA** ① · `docs/desktop/design/RENDERER.md` §1.1 · `docs/desktop/design/UI.md` §1 ∕ 间距注 · `docs/desktop/design/IPC.md` §1 + 四档变更记录 + **`docs/cli/design/TUI.md` §6.9** + **`docs/vsc/design/WEBVIEW.md` §5.1** | 全批 |

零触面：核包 ∥ 协议 ∥ 记录面（**面分列**：记录侧 = 形 ∥ 通道 ∥ 落盘节律 ∥ `clearDigest`——**三端档全量照留**；复列 = 显示侧折叠随本批改——见上表行 4 ∥ 5b）∥ `renderer/views/chat-chrome.mjs` ∥ `store.mjs` ∥ `thincoder-cli/src/tui/lifecycle-records.mjs`（记录形 ∥ 文案零动）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（桌面消化痕彻底拆（座次机拆除 + 单体重建）· 设计轮 · 2026-10-01 · 台账 #765 · 批 `docs/batches/2026-10-01-desktop-digest-teardown.md`）行「**现行 ⇒ 实读（实施落盘 · 父侧回填）**」**
（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/desktop/design/RENDERER.md` §1.1「消化行入流与重放规则」条（修复轮 1 · F2 零存储）；**设计轮——产品码零触**；裁决 = 父侧 04:1x **B′「拆机不拆序」**——座次【机】删 ∥ 锚整删（用户 04:47——零存储）；**实施落盘（#89）· 父侧回填**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/events-wake.mjs` | **126 ⇒ 101**（实读；`seat`/`rid`/`nextRid` 删；`boundary`/`clearDigestBoundary` 同删——F2 零存储：无锚可维） | 归约面 |
| 2 | `chat-digest.mjs` | **268 ⇒ 删档**（座次机全链删（`liveRun` ∥ `isObstacle` ∥ `seatTarget` ∥ `placedBefore` ∥ `pendingLiveSeats` ∥ `seatLiveRounds` ∥ `liveSeatPlan`）∥ 族键 ∥ `adoptDigestRounds`/`pendingDigestSeats`/`seatDigestRounds`；同步重写 = 换代按轮对象引用变（F2 零存储——无行标）） | 痕面 |
| 3 | `chat-digest-seat.mjs` ⇒ **改名 `chat-digest-rows.mjs`**（seat 名随拆除） | **291 ⇒ 退场（改名兑现）⇒ `chat-digest-rows.mjs` 222**（实读；行构树 + `syncRound` 留；身份 ∕ 位次 ∕ 族键 ∥ 行标删——F2 零存储） | 构树面 |
| 4 | `thincoder-desktop/renderer/views/chat.mjs` | **245 ⇒ 228**（实读；`_blockSeat` 两写点 ∥ 预判 ∥ ④′ 双落位删；`mountTail` = 常规插点（归档随到）；`_digestArchivedAt` 同删——F2 零存储） | 挂载面 |
| 5 | `thincoder-desktop/renderer/views/chat-tree.mjs` | **151 ⇒ 143**（实读；运行期轮 = 流末——构树既有同序；零搬移；读数随实施轮对盘实读） | 出序面 |
| 6 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **221 ⇒ 252**（实读——#761 落盘后基数；本批净 0；陈句两处收正——`:165-166` ∥ `:194`） | 注文面 |
| 7 | `thincoder-desktop/renderer/page-read.mjs` | **282 ⇒ 228**（实读——#761 落盘后 293 ⇒ 本批 −65；`rebaseKeptSeats` ∥ `shiftKeptSeats` 均删——F2 零存储：无锚可维 ∥ 无算术；回填径零账） | 页读面 |
| 8 | `thincoder-desktop/renderer/subagent-reduce.mjs` | **301 ⇒ 258**（实读；**回线 ⇒ 越层除名 + 预案注销兑现 ✓**；`seats`/`reclaimedOf` ∥ `digestSeatOf` ∥ `seatIndexOf` ∥ `appendArchived` 座次支均删——F2 零存储：归档走 `appendBlock` 随到入流；**拆后回线 ⇒ 越层除名 + 预案注销**——随实施轮实读，见 `docs/desktop/design/PROJECT.md` §4.1） | 归约面 |
| 9 | `thincoder-desktop/renderer/chat.css` | **361 ⇒ 361**（实读——轻通道轮四后值；读通零改 ✓） | 样式面 |
| 10 | 批内件 | `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs`（**已建成 · 638 行 · 七腿（7/7 绿）**——腿集单源 = 批档 §2 基础重裁块「腿集单表」（重写版；本表为准））：腿 1 单元素生命周期 ∥ 腿 2 座次 ∥ 锚 代码痕 grep 零命中（射击面以重裁版表为准——原修复轮版此注作废）∥ 腿 3 重挂复列末条 + 重挂首帧后稳态序（行族居其归档块之前——记录位次复列）∥ 腿 4 归档居其后（起跑窗「放族后」成立——随到入流 + 多枚到达序 + 迟到退化）∥ 腿 5 记录面负向锁 ∥ 腿 6 零存储面（`shiftKept*` 零存 ∥ 无锚可维——收帧清 ∥ 屏代清 ∥ 前插后移全无；**懒加载径（前插一页）断言：块序仍 ⇔ 记录序 ∥ 行族与其归档块相对序不变 ∥ 行族零动——零算术**）∥ 腿 7 **全流序对账**（恢复序 ≡ 记录序——机检 = 记录序列 → `chatTree` 文档序块序 `at` 升序 ⇔ 记录 idx；白名单两档 = 族内压缩 ∥ 跨页丢轮；障碍面 = 页读域窗口化——上抛在册）；**真机一例** = 滚动到顶 ⇒ 加载更早一页 ⇒ 序不乱；随批留存 · 不进仓套件） | 全批 |
| 11 | 设计档 | `docs/desktop/design/RENDERER.md` §1.1（六处 + 「消化行入流与重放规则」条——修复轮 1：原「静态落位锚」条零存储收正（F2）+ 序判据句（F3）+ 变更记录）· 本档 §1 KD-33 ∥ KD-55④ ∥ KD-60①④ ∥ KD-62①④⑦ ∥ `docs/desktop/design/PROJECT.md` §6.1 D4 ∥ §7 批注 ∥ **§4.1（改名行 ∥ 越层处置 ∥ 读数随实施轮）** ∥ §4.2 本块（行 1–5 ∥ 7 ∥ 8 ∥ 10 ∥ 11 修复轮收正） ∥ 变更记录 · `docs/desktop/design/UI.md` §2 项 5 两处（「锚改静态」⇒「锚整删」收正）+ 变更记录（`:18`/`:122` 零触）· **`docs/desktop/design/IPC.md` = 零触**（规范面 `座次|seat` 零命中——实读） | 全批 |

零触面：记录面（形 ∥ 通道 ∥ 落盘节律 ∥ `clearDigest`——三端档全量照留）∥ 宿主面（`src/main/**`——起跑窗 ∕ reclaim ∕ reemitDone 零动）∥ 两端（CLI ∥ VSC——#754 已随正）∥ 核包 ∥ `renderer/store.mjs`。

**本批（消化行自然形收正批 · 2026-10-01 · 台账 #768 · 批 `docs/batches/2026-10-01-digest-rows-natural-form.md`）行「现行 ⇒ 实读（实施落盘）」**
（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ 本档 §1 **KD-62**；**父侧实施后读数回填（2026-10-01）**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/events-wake.mjs` | **101 ⇒ 101**（净 0）（`onDigest` `start` 支：全替 ⇒ **追加 `[...rounds, round]`**（全轮累积）；注文收正） | 归约面 |
| 2 | `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | **222 ⇒ 239**（+17——终态行 ∥ 末轮行账 ∥ 结构采纳径三面新码、估读偏低；三机拆除（终态摘标签闸 ∥ 计数行就地换文 ∥ 换代删旧 ∥ 位次出窗摘全行）⇒ **行出即留**；`digestRows` 增终态行（锚 `data-digest-end`）；`syncRound` ⇒ **唯追加**（零就地换文——行出生即定型）；`syncDigest` ⇒ 末轮行账（`_digestRows` ∕ `_digestRound`）+ 采纳径（重建后逐位对位——零重建）+ **零摘除**；注文重写） | 行族面 |
| 3 | `thincoder-desktop/renderer/page-read.mjs` | **235 ⇒ 237**（`foldDigest` ⇒ **全量完整轮**（不再截取末条）；`withFoldedDigest` ⇒ **并入**（折叠轮 + 现轮集——并序 = 折叠轮居前 ∥ 现轮集随后；双份消解 = 结构性（首屏 `clearDigest` 先行 ∥ 回填旧段并入——零跨侧去重键））；注文收正） | 读面 |
| 4 | `thincoder-desktop/renderer/views/chat-tree.mjs` | **143 ⇒ 147**（注文随动（复列 = 全量轮——恢复序 ≡ 记录序）；**逻辑零改**——`pushFlow` 元同式） | 构树面 |
| 5 | `thincoder-desktop/renderer/views/chat.mjs` | **204 ⇒ 205**（档头注随动；**逻辑零改**——`settleFrame` 步①引调不动） | 帧尾面 |
| 5a | `thincoder-desktop/renderer/views/chat-model.mjs` | **117 ⇒ 117**（净 0）（`digestOf` 注文随动（全轮累积）；逻辑零改） | 模型面 |
| 5b | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **252 ⇒ 252**（净 0）（档头注随动；`syncDigest` 引调不变） | 帧刷面 |
| 5c | `thincoder-desktop/renderer/chat.css` | **361 ⇒ 366**（+2）（轮间承接条（`.chat-digest + .chat-digest[data-digest-label]` ⇒ 8px）+ 注文随动——行出即留后轮间相邻常态；**触属性 = 行级小修（非结构性 ⇒ 不触发本批拆分——消解窗口随下次触碰顺延）**；拆分 ∕ 越层预案在册 = `docs/desktop/design/PROJECT.md` §4.1 越层段） | 样式面 |
| 6 | 批内件 | `docs/batches/2026-10-01-digest-rows-natural-form.test.mjs`（**已建成 · 700 行**（内容行数口径〔文末换行不计〕· as-of 2026-10-01——A1–A3 补丁后）· 八腿（见 §7「消化行自然形收正批注」）；**8/8 绿**）；随批留存 · 不进仓套件 | 全批 |
| 7 | 设计档 | 本档 §1 **KD-62**（整条重写）∥ KD-36 ∥ KD-55 ∥ KD-60 ①②⑥ ∥ §3（原 `docs/desktop/design/PROJECT.md` §2.2） ∥ `docs/desktop/design/PROJECT.md` §6.1 D4 行 ∥ §7（置换批注）∥ §10 DA ① ∥ CR 涉句 ∥ **§4.2 本块** · `docs/desktop/design/RENDERER.md` §1.1（八处）· `docs/desktop/design/UI.md` §1 对话流行 ∥ 间距注项 5 · `docs/desktop/design/IPC.md` §1 `ev:digest` 行 + 三档变更记录 | 全批 |

零触面：核包 ∥ 协议（**零新通道** ∥ 载荷零变）∥ 记录面（形 ∥ 通道 ∥ 落盘节律 ∥ `clearDigest`——零动）∥ 宿主面（`src/main/**`——起跑窗 ∥ reclaim 零动）∥ `renderer/events.mjs`（分派零改）∥ `renderer/app.mjs`（构造 ∥ 结算径引调零改）∥ `renderer/store.mjs`（切片形状零改）
∥ 两端（CLI ∥ VSC——**本批零触**；端差在册 = `docs/desktop/design/PROJECT.md` §10 **DA** ①）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（消化重放口径 · 2026-10-01 · 台账 #771 ∥ #773 · 批 `docs/batches/2026-10-01-digest-replay-choices.md`）行「现行 ⇒ 实读（实施落盘）」**（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ 本档 §1 **KD-62**；实施落盘 2026-10-01）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/page-read.mjs` | **237 ⇒ 258**（≈255 · +3）（`foldDigest`：未结轮开出（可证面 = 轮间 ∥ 末页——扫描结束仍 `open`）+ 位次门（#773）；`withFoldedDigest`：未结轮归属过滤（活流侧优先——运行期未结轮在场 ⇒ 折叠未结末轮不并入）；注文） | 复列面 |
| 2 | `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | **239 ⇒ 242**（`digestRows`：`n = 0` 零终态行守句；注文——`clearDigest` 维持现行「未结末轮保」，归属过滤住并入点） | 行族面 |
| 3 | `thincoder-vscode/webview/record-restore.js` | **116 ⇒ 130**（`scanPageRounds` 可证面扩面 + `restoreRecordEls` 起跑/cap 随轮出） | 重建面 |
| 4 | `thincoder-vscode/webview/history.js` | **103 ⇒ 104**（页级 pass 传参随动） | 页级 pass |
| 5 | 批内件 | `docs/batches/2026-10-01-digest-replay-choices.test.mjs`（**已建成 · 298 行 · 9/9 绿**（腿 1–7 + 6b + 6c）；随批留存 · 不进仓套件） | 全批 |
| 6 | 设计档 | 本档（§1 **KD-55** ∥ **KD-62** ∥ **KD-60** ∥ §3（原 `docs/desktop/design/PROJECT.md` §2.2） ∥ 本档 §7 **DA** ①）+ `docs/desktop/design/PROJECT.md`（§6.1 **D4** ∥ §7）+ `docs/desktop/design/RENDERER.md` ∥ `docs/desktop/design/UI.md` + core ∥ CLI ∥ VSC 三档（见批档 §2「十」） | 全批 |
| 7 | 零触面 | CLI 产品码（照现已在位）∥ 记录面（形 ∥ 通道 ∥ 落盘节律）∥ `history-window.mjs` ∥ 核件 ∥ 发帧点 | — |
| 8 | 实施轮随动（评审收正） | `thincoder-desktop/renderer/events-wake.mjs`：`onDigest` 无轮防守档注解收正（可达面钉定——起跑帧未及；归属规则（活流侧优先）保运行期未结轮跨首屏存续）；**102 ⇒ 102**（注解——零可执行语义） | 归约面注 |

**本批（块到达时点归位 · 2026-09-30 · 台账 #746 · 批 `docs/batches/2026-09-30-block-arrival-timing.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/async-settle.mjs` | **302 ⇒ ≈306**（非挂起支：`⟦ev⟧done` ⇒ `⟦ev⟧settled`（发射行自 if/else 提级——等待消化分流保留）+ 注文收正（`:180-183` ∥ `:268-270`）；**越 300 软线——拆分预案（候选拆分面 + 消解窗口）登记 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20.4 拆分计划行**） | 发射面 |
| 2 | 批内件 | `docs/batches/2026-09-30-block-arrival-timing.test.mjs`（已建成 · 325 行 · 5 用例——两形腿 + 幂等腿（腿详见 §7「块到达时点归位批注」）；随批留存 · 不进仓套件） | 全批 |
| 3 | 设计档 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8（结算语义收正）+ 变更记录 ∥ 本档 §1 **KD-36** ∕ `docs/desktop/design/PROJECT.md` §6.1 **D4** 行 ∥ §7「块到达时点归位批注」· `docs/desktop/design/RENDERER.md` §1 ∕ §1.1 + 变更记录 | 全批 |

零触面：桌面产品码（`thincoder-desktop/**`——`settled` 通路既有：relay 映射 ∥ 态机 ∥ 等待消化面零改）∥ `thincoder-render-core/**` ∥ 协议 ∥ 记录面（形 ∥ 通道 ∥ 折叠单源）∥ #738 已落机制（座次面——零回退；归档触发面 = 起跑窗形——单源 = §1 **KD-60**）；
跨端面（CLI ∥ VSC——事件面收敛：非挂起态 settle 亦 ⇒ 等待消化、冻结落其 reclaim ∥ freezeAll 点；产品码零触——上抛父侧；**核点登记 = 本档 §7 CZ**）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（timer 唤醒投递缺陷修复 · 2026-10-01 · 台账 #799 · 批 `docs/batches/2026-10-01-timer-wake-delivery.md`）行「现行 ⇒ 预期」**（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17 ∥ 批档 §2；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/suspension-timers.mjs` | **68 ⇒ ≈73**（`reloadSlot` 注入项（同源缝 = `createSuspensionDrive` 既有转口）+ `faceOf(key, agent, cwd)` 携 cwd + `deliver` 先重装后投递（投递行落重装后机读线）+ 注） | 时序面 |
| 2 | `thincoder-desktop/src/main/suspension-drive.mjs` | **305 ⇒ ≈309**（`driveTurn`：timer 轮零重装（重装已前移——`if (!timerTurn)`）+ 注；**已越 300 在册**——拆分候选 = 残输入续发族 `suspension-resume.mjs`） | 时序面 |
| 3 | 批内件 | `docs/batches/2026-10-01-timer-wake-delivery.test.mjs`（已建成 · 257 行——四用例 T-TW36–T-TW39（先红后绿）；随批留存 · 不进仓套件） | 全批 |
| 4 | 设计档 | 核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17（新增）+ §6.30.11 桌面块 bullet + 变更记录——**已落**；本档 §3 会话钉定段半句（原 `docs/desktop/design/PROJECT.md` §2.2） + 本档 §4.2 本块 + `docs/desktop/design/PROJECT.md` 变更记录 | 全批 |

零触面：核件 ∥ CLI ∥ VSC 产品码（零触碰——射程表逐端判据 = 核档 §6.30.17）∥ 其余轮（用户 ∕ 消化）重装时点零变 ∥ idle 径零变 ∥ 显示面（`ev:timer` 行 ∕ `⏰N`）零变；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（桌面 UX 收尾批 · 2026-10-02 · 台账 #801 ∥ #702 ∥ #697 · 批 `docs/batches/2026-10-02-desktop-ux-closeout.md`）行「现行 ⇒ 预期」**（实读 2026-10-02——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/desktop/design/PROJECT.md` §2 **KD-69** ∥ **KD-70** ∥ 本档 §2 本批注；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/agent-host.mjs` | **291 ⇒ ≈297**（装配尾 +MCP 警告消费（`_mcpWarnings` ⇒ `_pendingReminders`）；**贴 300 层——实施轮首步实读复核 ∥ 越层则同轮拆分**） | MCP 消费面 |
| 2 | `thincoder-desktop/src/main/index-status.mjs` | **67 ⇒ ≈72**（`readIndexCounts` 回执扩 `dbBytes` ∥ `origins` 透传） | P1 读数面 |
| 3 | `thincoder-vscode/src/extension/panel-index.mjs` | **242 ⇒ ≈248**（`pushIndexStatus` 载荷扩两键） | VSC 推送面 |
| 4 | `thincoder-vscode/webview/settings-tools.js` | **398 ⇒ ≈405**（指数段两读：库大小 ∥ 逐 origin 行数；阈值 450——余量 ≈45 行） | VSC 设置面 |
| 5 | 设计档面 | 本档 §2 本批注（#801）∥ `docs/desktop/design/PROJECT.md` §2 KD-69 ∥ KD-70 ∥ `docs/core/design/MCP.md` §6.4 ∥ `docs/vsc/design/SETTINGS.md` §2.5——**已落**；`docs/desktop/design/SETTINGS.md` 桌面详文候解冻触点回填（在册） | 全批 |

零触面：设置页面七段 ∥ `.mcp.json` ∥ 连接 ∥ 管理面语义 ∥ 状态行段集（零增）∥ 核出口（复用——端侧零 SQL）∥ CLI 面（同形既有）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**余量**：零（§5 / §6 / §7 域行已随切片 4（终篇）迁入——见 §5/§6/§7）。**§4.2 余块 = 零**（本域余块 11 枚已随「2c 前置步 · 文件账分片轮（切片 3）」迁入本档；判读在册 = 批档 §2）。

## 5. 验收回指（需求卷条目 → 本域面 · 判据全文——迁自 `PROJECT.md` §6.1 本域行 · as-of 2026-10-02）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| **D4** | 子代理活动块 = 子 agent 实例（块头读数〔role / model / 用时 / 回合 N/M〕+ 状态词；**无工具位** · **内容回显 = 核件 tail-3 / 展开**——D20 块形，单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2 + 「本批注（对齐第二批 · 六件）」项 3；状态词出自同档 §1 状态词行闭枚举，不得自造词）；advisor / consult / 队列 / 待审批四族各可呈现；批 A 落**队列面**（忙态发送入队——「回合中插入」批收正：队列单源 = 宿主（`pending` 切片 = `ev:queue` 镜面；原 store 三纯动作 ∕ `QUEUE_MAX` 随本地队列退场——单源 = `docs/desktop/design/COMPOSER.md` §1 **KD-40**；条目 = 文本串〔按会话分键——「对齐第二批」项 2；A9 收正〕）+ 满队提示〔按键判 · 回执 `queue-full`〕）**；**本批（桌面空闲唤醒）**：挂起态与 digest 两面落点 = 本档 §1 **KD-36**（状态行段 3 第三态挂起句 + 流内消化状态行 + `ev:susp` ∕ `ev:digest` 两事件面；块侧 `settled` ⇒ 等待消化 ⇒ `done` 归档 + 驱动回收）；**本批机检面 ∕ 真机面点名 = §7「桌面空闲唤醒批注」**（留 `docs/desktop/design/PROJECT.md` §7 原址）；**本批（消化面留档 · #719）**：恢复面判据 = 留档记录写入 ∥ 页读重建——消化痕**自然形（行出即留；重建 = 全量（未结轮照现）——2026-10-01 收正 ∥ 消化重放口径批收口）** ∥ 归档块**刷新 ∥ 重载 ∥ 切走切回均在**（单源 = 本档 §1 **KD-55**）；**本批（三端消化面统一 · #747）**：形面 = 桌面按 VSC ∥ CLI 实形（无轮容器 ∥ cap 行尾追）∥ 归档 = 起跑窗触发 + 消费轮**族后**落位（**随到达入流**——F2 零存储；对不拆保持；#747 形经 #754 收正 ∥ **#765 座次机拆除 + 锚整删（F2 零存储）**，2026-10-01）——单源 = 本档 §1 **KD-60** ∥ **KD-62**；**本批（消化行自然形收正 · 2026-10-01 · 台账 #768）**：行族显示 = **自然形（行出即留——全轮在流；终态 = 追加新行）** ∥ 复列 = **全量（未结轮照现）** ∥ **归档落位 = 族后（随到达入流——F2）** ∥ **起跑窗复位** ∥ **座次机拆除（#765）保持**——单源 = 本档 §1 **KD-62**；判据载体 = §7「消化行自然形收正批注」（留 `docs/desktop/design/PROJECT.md` §7 原址）；**本批（块到达时点归位 · #746）**：非挂起态 settle ⇒ `⟦ev⟧settled`（**零即时归档负判**——S 块不入运行中回合块列内部）∥ 归档随消费窗（[块][轮] 对不拆）——判据载体 = §7「块到达时点归位批注」（留 `docs/desktop/design/PROJECT.md` §7 原址） | T-DSK5 / T-DSK22 / T-DSK23 |
| **D20** | 右列 = 子 agent 面板：五类射程（sync / async / consult / escalate / advisor-async）块出场；块态机（出生 / 终态折叠 / **归档 = 入流**——「对齐第二批」项 5 收正）；**内容回显 = 核件 tail-3 / 展开**（「对齐第二批」项 3）；停止出口（`subagent:stop` 往返 · ⏹ 为核件钮——点击委托）；数据链含**出生自愈**（宿主存活投影 2s 再断言——丢首发出生 ⇒ 一拍内复现）；**零工具调用行残留**（`pool` 切片零 tool 条目）——本档 §1 **KD-26**；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3 / 5 + `docs/desktop/design/IPC.md` §1/§2；**本批（消化面留档 · #719）**：归档块 = **留档块**（页读域第六型——记录重建 ⇒ 重载 ∥ 切走切回均在；计 `data-hidden` ∥ 可回填；单源 = 本档 §1 **KD-55**）；真机 = 本档 §6 **T-DSK49** | T-DSK36（①⑤ 随「对齐第二批」收正） |
| **D30**（右栏宽度拖动） | KD-58（单一权威链）——机检五腿 + **T-DSK52**（验收面批块 = 下） | 本档 §6（T-DSK52） |
| **D28**（消化面留档） | KD-55 ∥ KD-62（记录两族 ∥ 复列口径）——验收 = 机检八腿 + 真机一条 + 收正面（单源 = `docs/desktop/design/PROJECT.md` §10 **CS**） | CS 行（本档 §7） |
| **D35**（右栏池可滚动） | 本档 §2 本批注——复现判据两腿（腿 A 合成 ∥ 腿 B 真机）∥ 候选映射 ∥ 收口规则（#801） | 实现形随复现收口（台账 #801） |

**右栏宽度拖动批（验收面 · 2026-09-30 · 台账 #742 · 全文迁入）**：需求回指 = **D30**（右栏宽度可拖动——① 拖动即时生效 ② 宽度持久化（重启恢复）③ **单一权威 = 用户值**；范围上下限 = 设计定形——落值 = 本档 §1 **KD-58** ③）；设计单源 = 本档 §1 **KD-58** ∥ 本档 §2（右栏宽度拖动批注）∥ `docs/desktop/design/RENDERER.md` §1.3；
机检面 = 批内件 `docs/batches/2026-09-30-pool-width-drag.test.mjs`（已建成 · 242 行——五腿：① **拖柄在盘**（骨架 + 样式 + 模块三处字面）② **持久化写读**（假 storage：读回应用 ∕ 落定写入 ∕ 非法值降级）③ **未拖过零写**（无存储 ⇒ 零内联写——36rem 恒等）
④ **落定读回**（假 rect ⇒ 存储值 = 读回值——所见即所存；**序臂**：rAF 待写在场 ⇒ 落定前置（撤帧 + 同步落值）先行 ∥ 落定后零迟到写）⑤ **仲裁负控**（模块零 `store` ∕ `events` import + 界仅 `chrome.css` 单落点）；随批留存 · 不进仓套件）；
真机面 = **T-DSK52**（拖 → 重启 → 宽度在 + 上下限两读数 + 未拖过负控）；**离线不可产面**（真拖动 ∥ 真重启 ∥ CSS 钳制）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**跨档条目（本域半边）**：**D10**（台账行——UI 域，单源 = `docs/desktop/design/PROJECT.md` §6.1 D10 行）· **D19**（经核呈现——CHAT 域，本档半边 = §2 跟滚 ∕ 让位注；单源 = `docs/desktop/design/CHAT.md` §4）· **D25 ∕ #543**（队列面——COMPOSER 域，本档半边 = §3 挂起窗键面路由；单源 = `docs/desktop/design/COMPOSER.md` §4）。

（§6.1 本域行迁讫（D4 ∥ D20 两条全文；D30 判据由批块承载——上）；跨档条目列上。）

## 6. 用例（本域 · 全文迁自 `PROJECT.md` §7 涉行 · as-of 2026-10-02）

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK5 | 边界 · 活动池粒度 | 触发一个子代理 + 一个并发子代理 | 活动池出现两个块，各含块头读数 + 状态词（**无工具位** · **内容回显 = 核件 tail-3 / 展开**——D20 块形）；折叠后对话流得全宽 | — |
| T-DSK36 | 正常 / 边界 · 右列 = 子 agent 面（D20） | ① 五类射程各一例投 `ev:subagent`；② 同实例 queued → started → turn → done；③ 停止钮点按；④ 旧工具行；⑤ 丢首发出生事件（模丢帧） | ① 各出块（头含 role / 用时 / 回合，状态词闭枚举）且**内容回显 = 核件 tail-3 / 展开**（text / think 经 `ev:subchunk` 入块模型 `rows` ∧ 核件 `renderSubagentChunk` 落块面——「对齐第二批」项 3）；② queued 态 / 终态折叠（终态词 + 用时）；③ `subagent:stop` 往返 `ok` ⇒ 实收 `cancelled`（源 = `⟦ev⟧stopped`——先例兼容映射）⇒ 块折叠；④ 右列**零工具行**（`pool` 切片零 tool 条目 · 树面零工具行节点）；⑤ **出生自愈**：丢首发 ⇒ 一拍（2s）内块复现；终态出表 ⇒ 零再断言（不复活）；归档 = **入流**（池内退场 ∧ 流内归档块留场——居消费轮族末（状态行）之后；「对齐第二批」项 5） | 新增用例族（`events-reduce` 归约 + 视图构树）+ `agent-bridge` 平 node 直测（映射表 + 存活投影拍体直驱） |
| T-DSK49 | 正常 · 消化面留档恢复（真 Electron） | fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕+ 会话槽族档〔`cwd` = `PROJ`；**槽内人读线携 `digest` 记录 ∥ `subagent` 留档记录**——形单源 = `docs/desktop/design/RENDERER.md` §1.1「留档记录」条；沿 T-DSK32 ∕ T-DSK39 夹具先例〕） | ① 真点**会话控制面项目钮**（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ 开页 ⇒ 流内**终态消化痕在场**（`[data-digest]`——页读重建）∧ **留档块在场**（`[data-block-kind="subagent"]`——计 `data-blocks`）② **重载**（`webContents.reload()`）⇒ 同断言（痕 + 块均在——零双份：一条记录恰一元素）③ **重挂径**（`locale` 键变 ⇒ 全量重挂）⇒ 同在 ④ **切走切回**（`session:switch` 往返）⇒ 同在 ⑤ 退窗腿：留档块越尾窗 ⇒ 计 `data-hidden` + 摘要块在场 | 机检面 = 单元测试档惯例（载体 = `docs/batches/2026-09-30-digest-persistence.test.mjs`——五腿）；**真机面 = 父侧真跑闭合**（D16 义务）；用例号自铸披露 = 本档 §7 **CS**（在册） |
| T-DSK52 | 正常 / 边界 · 右栏宽度拖动（D30 · 真 Electron · 两启程） | 程 1：fixture 家（`{"locale":"en"}`）⇒ 装配后 ① 拖动柄至约 300px 处松手；② 拖过下限（继续左拖）∥ 拖过上限（继续右拖）；③ 关窗退出；程 2 = 同一家再启动；负控臂 = 另家未拖动启动 | ① 拖动中即时随动（松手前右列实宽随指针变化——`--pool-w` 内联在场）；② 松手后存储键 `thincoder.desktop.poolWidth` = 读回实宽；③ **程 2 宽度在**（右列实宽 ≈ 程 1 落定值——`getComputedStyle` ∕ `getBoundingClientRect`）；④ 下限 = 240px（拖过 ⇒ 实宽停 240）∥ 上限 = `max(36rem, 100vw - 30rem)`（拖过 ⇒ 停于上限；中列 ≥ 480px）；⑤ 未拖过负控臂 = 右列 36rem ∧ 零内联 `--pool-w`；⑥ 全程零 `pageerror`；PNG 落 `thincoder-desktop/test/artifacts/pool-width-drag.png` | 机检面 = 单元测试档惯例（载体 = `docs/batches/2026-09-30-pool-width-drag.test.mjs`——五腿；随批留存 · 不进仓套件）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = 本档 §7 **CW**（在册） |

（本域用例全文迁讫（T-DSK5 ∥ 36 ∥ 49 ∥ 52）；T-DSK17–19（工艺侧）、T-DSK30 ∥ T-DSK43（混装）与 §7 注块族留 `docs/desktop/design/PROJECT.md` §7 原址。批内件（单元测试档）随批次档留存。）

## 7. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · 全文齐平 · as-of 2026-10-02）

| 行 | 内容 | 状态 |
|---|---|---|
| **CR** | **重建 ∕ 重挂径复聚（桌面消化行流内落位批 · 2026-09-30 · 台账 #706）**：**压缩行按模型序复聚流尾**（重建径无位置载体——压缩行半句留观）；**消化行族半句已消解（留档批 · #719——重建按记录位次复列，痕位次由人读线记录提供）**（活流按时点先后；根子序 = 压缩行在前、消化行族居其右——单源 = `docs/desktop/design/RENDERER.md` §1.1 根子序句）；暴露面按页读四清界定量（**压缩行半句**——终态痕已改记录重建（按记录位次复列（零配对）；复列全量（未结轮照现）——2026-10-01 收正 ∥ 消化重放口径批收口）· #719） | 登记（留观——压缩行半句；消化行族半句已消解 · #719） |
| **CS** | **消化面留档批 · 需求侧判据句已落 + `T-DSK49` 自铸披露**：需求卷 **D28**（消化面留档——现行验收 = **机检八腿 + 真机一条 + 收正面**（自然形（行出即留）∥ 落位 ∥ 无闪现））已落（父侧笔——2026-09-30 落 ∥ 2026-10-01 自然形收正；**设计面零触需求档**）；设计面同拍 = `docs/desktop/design/PROJECT.md` §6.1 **D4** ∥ **D20** 行恢复态判据句（已迁本档 §5）+ §7 **T-DSK49**（D16 义务；已迁本档 §6）；沿 T-DSK37–T-DSK48 先例——若实施批 ∕ 并行批占用同号 ⇒ 请父侧并号裁定 | 登记（父侧已落 · 自铸披露） |
| **CW** | **`T-DSK52` 用例号自铸披露 + 存储载体口径披露**（沿 T-DSK37–T-DSK51 先例——右栏宽度拖动批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **存储载体口径**：宽度持久化 = 渲染面 `localStorage`（端自有 UI 态类——先例 = VSC `modelPrefs`@`workspaceState`「非会话文件」；`thincoder-desktop/AGENTS.md:21`「桌面不持自有存储」句射程 = 会话 ∕ 配置持久化（共享格式）——UI 态不在该射程；如需产品档措辞收正 = 父侧笔）；③ **#115 作废事实在册**（`docs/batches/2026-09-28-desktop-flow-vsc-align.md` §1.12——用户直斥；本批不重建 ∥ 不复活；D30 父侧收正后现文 ③ = 单一权威 = 用户值） | 登记（自铸披露 + 口径披露） |
| **CZ** | **跨端验证点（CLI ∥ VSC——块到达时点归位批 · #746）**：非挂起态 settle 改发 `⟦ev⟧settled` 后，两端「等待消化 → 消费点冻结 ∥ 归档」链行为核——含 **CLI「无补发」下冻结触发面**核点：CLI 收 `settled` 设冻结锚（`thincoder-cli/src/tui/subagent-blocks.mjs:250`——`_freezeAt` = settle 时刻流位置），冻结落消费窗两钩（`thincoder-cli/src/tui/suspension-drive.mjs:173-174`：`reclaim` → `freezeReclaimDigestedBlocks`（`subagent-freeze.mjs:236`）∥ `freezeAll` → `freezeAllSubTasks`（`subagent-freeze.mjs:212`）——无 `done` 补发径）；VSC 对位 = 消化完成逐条补发 `done` 归档（`thincoder-vscode/src/extension/suspension.mjs:112-119`） | 登记（协调项——端侧断言待核；端档 ∥ 端码在本批三档评审面外 = `unverified`） |
| **DA** | **跨端统一待办（消化行族——块到达时点归位批对帐 · #746 · 2026-09-30）**：① **显示面轮数 ∥ 重放口径 = 跨端差异消除（已落）**：三端 = **自然形（行出即留——全轮在流）**（单源 = `docs/desktop/design/RENDERER.md` §1.1）∥ 复列 = **全量（未结轮照现——三端同判）**——CLI ∥ VSC 随正已落（#768 跨端跟正批；重放口径 = 消化重放口径批 · 2026-10-01 · 台账 #771 收口——本项闭）；两端设计面 = `docs/cli/design/TUI.md` §6.9 ∥ `docs/cli/design/TUI-SESSION-VIEW.md` §6 ∥ `docs/vsc/design/WEBVIEW.md` §5.1 ∥ §5.7；差异处置 = **消（统一已落）**；② **行族结构 = 已裁 ∥ 规范句已落（#747 修复轮）**：目标形 = 对位 VSC 实形——**无轮容器**（行元素 = 流内并列兄弟——`chat-status.js:72-89`）∥ **cap 行 = 尾追形**（本轮元素族末位——`chat-status.js:97-105`）；本端原「单轮容器 ∥ cap 行轮行组内」两差随 #747 收正（形面单源 = `docs/desktop/design/RENDERER.md` §1.1 流内消化行族条；CLI 对位 = 未核 · `unverified`——沿原注）；③ **归档时点 ∥ 落位 = 三端同形（2026-10-01 裁 A——两端随正）**：起跑窗（digest start 逐条补发）∥ 族末之后落位（桌面侧落形 = **随到达入流**——F2 零存储；起跑窗内 ≡ 族后）——两端设计面 = `docs/cli/design/TUI.md` §6.9 ∥ `docs/vsc/design/WEBVIEW.md` §5.1（本项闭） | ① 消（随正已落 + 重放口径收口——实测重现即重开）；② 已裁 ∥ 规范句已落（#747——形面）；③ 三端同形（起跑窗 ∥ 族末落位——本项闭） |
| **DD ②** | **核侧收正已裁（核面小修批 · 台账 #793）**——竞态窗根因 = 核环尾无 abort 前置（`thincoder-core/agent/turn-loop.mjs:243`）；核侧收正 = 环头 ∥ 环尾补 abort 前置（`abortError`——不落 ContinueError ∥ 不开启新轮）；端侧加门（#782）保留为兜底（核修后 = 主径外的防御面） | 已裁（核侧收正——实施随本批） |

（上列六行全文已齐平（CR ∥ CS ∥ CW ∥ CZ ∥ DA ∥ DD②——DD① 住 `docs/desktop/design/CHAT.md` §6）；§10 本域余行（BO 等已迁 ∥ 他域行）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

- 2026-10-04（**消化行回填落位批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-digest-reentry-order.md` §1 · 台账 #910）：KD-62 ⑦ 涉句收正——原「复入窗补建」登记句（位次轮入区 ⇒ 缺行者流末补建——登记例外）⇒ **复入窗 = 整置径**（回填 ⇒ 删档 + 新写——记录序复列；零位置机具）；单源 = `docs/desktop/design/RENDERER.md` §1.1（同拍）。**零新语义 · 产品码零触（设计轮）**。

- 2026-10-04（**核面小修批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-core-patch-batch.md` §2 · 台账 #793）：§7 **DD ②** 行收正——核侧观察 ⇒ **核侧收正已裁**（环头 ∥ 环尾 abort 前置；端侧墓碑门 #782 = 兜底保留）。**零产品码**（设计轮）。

- 2026-10-02：**建档（波 2a · 渲染族迁移）**——自 `docs/desktop/design/PROJECT.md` §2 迁入 **KD-26 ∥ KD-32 ∥ KD-33 ∥ KD-34 ∥ KD-35 ∥ KD-36 ∥ KD-47 ∥ KD-55 ∥ KD-58 ∥ KD-62**（十行逐字；原址各留一行指针；**KD-60 未迁**——行全文未在迁移轮上下文，原址保持单源）+ 自该档 §2.2 迁入**挂起窗键面路由注整块**（对照表 ∥ 非同键处置 ∥ 会话钉定 ∥ 跨键互斥 ∥ 忙态排队随动 ∥ 中止墓碑——逐字；原址留一行指针）+ 自 `docs/desktop/design/UI.md` 迁入本域批注块（子 agent 跟滚 · 让位修复 · 对齐第三批 B5/B6 · 「活动池与状态位」三项 · 右栏宽度拖动——逐字；原址各留一行指针）+ §4 文件账四条销项行（`suspension-drive.mjs` **308** ∥ `suspension-timers.mjs` **75** ∥ `events-wake.mjs` **102** ∥ `chat-digest-rows.mjs` **292**——届盘实读收正）+ §7 上抛六行（CR ∥ CS ∥ CW ∥ CZ ∥ DA ∥ DD②）。**余量未迁**（KD-60 ∥ §4 族行余量 ∥ §4.2 批块 ∥ §5/§6/§7 余行）——随「2c 前置步 · 文件账分片轮」承接（本批 §2 记录在册）。零新语义（搬迁 ∥ 值收正）。
- 2026-10-02（**波 2a 补轮 · eng-designer**）：**行宽回线**——本档 4 条超 300 字符行按语义边界折行（∥ 分隔处 ∥ 句读处）；零语义改。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（续 · #35）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4.1 扩行**（本域族行 **11** 行——自 `PROJECT.md` §4.1 逐字迁入；原址各改一行指针）∥ **§4.2 新立**：批块 **3 块**（桌面空闲唤醒 ∥ 子 agent 块跟滚 #518 ∥ 让位修复——迁自 §4.2；块内「本档」类回指按新落点改指）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4.2 收尾**——批块 **11 块**迁入（timer-wake 阶段 2 ∥ 右栏宽度拖动 ∥ 消化面留档 ∥ 消化回流归位 ∥ 三端消化面统一 ∥ 消化行只留当轮 ∥ 消化痕彻底拆 ∥ 消化行自然形 ∥ 消化重放口径 ∥ 块到达时点归位 ∥ timer 唤醒投递——迁自 `docs/desktop/design/PROJECT.md` §4.2；块内「本档」类回指按新落点改指）＋ **§4.1 补行 1**（`mount-pool.mjs`——判域在册）；§4.2 余块 = 零。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§5/§6/§7 域行全文迁讫**——§5 收 D4 ∥ D20 两行全文 + 右栏宽度拖动批批块（迁自 `docs/desktop/design/PROJECT.md` §6.1；原址各改一行指针）+ D30 ∥ D28 判据行收正 ∥ §6 收 T-DSK5 ∥ 36 ∥ 49 ∥ 52 四行全文（迁自 §7）∥ §7 收 CR ∥ CS ∥ CW ∥ CZ ∥ DA ∥ DD② 六行全文齐平（迁自 §10）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**文档清账批 · 直落轮 · eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2 · 台账 #797）：§4.2 测试面行 `agent-host-suspension.test.mjs` 档「**已落**——」陈标随档失降形（**232**（实读 2026-09-28）保留——文件已失），同 #785 族收正形。**零新语义**（陈标）。
- 2026-10-02（**文档清账轮 · 同族残项收正 · 主 agent**〔父侧直接执行 · 可 revert〕——承评审 #19 发现 5）：§4.2 测试面行 `timer-wake.test.mjs`（阶段 2 批）「**已落** ·」陈标同法去（实读 **286** 保留；**档已失**——2026-10-02 实核，同 #785 族）。**族定义** = 「陈标『已落』而档实失」行（`:177` ∥ `:221` 两行已收正；族判据 = 档在盘实核）。台账 #797 族 ∥ #806。
- 2026-10-02（**桌面 UX 收尾批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2 · 台账 #801 · 需求卷 D35）：§2 增「本批注（右栏池极多实例可滚动 · D35）」——实读结论（探针 3–5：容器链完好 ∥ 帧密同绿 ∥ 内容区首拍截留 = 既定语义 ∥ 覆盖层全吞）+ 复现判据两腿 + 候选映射 + 收口规则。**零新语义 · 产品码零触（设计轮）**。
- 2026-10-02（**文档清账轮 · 执行轮 4（render-core + 桌面轻段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：§4 行数账 8 处 R3 裸名化（`chat-digest.mjs` ×5 ∥ `chat-digest-seat.mjs` ×3——两档已删 ∕ 改名 `chat-digest-rows.mjs`，去目录段）。**零新语义**。
- 2026-10-04（**行痕族消失时机批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-row-traces-clear-at-turn.md` §2 · 台账 #919）：§3 行痕族句清点面收正——两员（`helpLines` ∥ `stopMark`）增回合起跑门、三员维持首屏门（单源 = `RENDERER.md` §1.6 KD-74）。**产品码零触（设计轮）**。明细 = 批档 §2。
