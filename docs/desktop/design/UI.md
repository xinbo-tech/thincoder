# 桌面端（DESKTOP）· 界面形态与交互

> 板块 = **桌面端界面形态与交互面**——布局 / 断点 / 标签条 / 左列会话行 / 状态词 / 交互键位 / 会话头 / 对话流 / 输入区 / 状态栏 / 审批呈现 / 提问呈现 / 计划面 / 工具卡呈现 / 空态 / 启动态 / **项目级信息 / 设置面 / 首启向导** / 主题 / 键盘可达 / i18n，以及本会话活动池与状态位。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D15 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：有界渲染窗口 / 回填与跟滚 / 流式增量等**实现工艺** = `docs/desktop/design/RENDERER.md` · 进程与目录形态 = `docs/desktop/design/SHELL.md` · 通道与载荷 = `docs/desktop/design/IPC.md` · 总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 界面形态落定（UI / 交互决策）

| 面 | 决策 |
|---|---|
| 布局 | 三列：左（项目与会话）· 中（会话标签页 = 会话头 + 对话流）· 会话视图内右栏（本会话活动池，可折叠，折叠态按会话记忆） |
| 断点 | 窗口宽 < **900px** 时左列折叠为图标条——900px = 首版初值（**单断点常量**，调参面 = `thincoder-desktop/renderer/styles.css` 一处；**数值保 open**，实施批实测调） |
| 标签条 | 标签宽 ∈ **[1.75rem, 14rem]**（`min-w` / `max-w`——防挤没与防独占）；溢出 = 横向滚动 + 两端渐隐（`mask-image`）；**非活动标签控件收 Tab 序** = 其标签控件与关闭控件各落 `tabindex="-1"`（活动项**零** `tabindex` ⇒ 自然序）；**零 `inert`**（`inert` 使子树对**全部**用户输入失效——含指针 ⇒ 与同行「标签点击激活」相抵）；**确认态例外** = 标签项 `data-confirm="1"`（本档「交互」行关闭确认面）⇒ 标签控件与两键**免** `-1`（决策面须键盘可达）；**落形** = 位标为标签子节点（文本取词 + `data-badge` 码，**空闲不落节点**——本档 §2 项 2）；关闭 / 新建控件字形住 `styles.css`（`content`）、词面经 `aria-label`（**视图档零字形字面**）；**接线**（批 5 落）= 标签点击激活（与左列点行**同一路**——激活即切换会话）· 关闭控件经确认面（本档 §1 交互行）· **关标签 ⇒ 页随动**（接线单源 = `docs/desktop/design/RENDERER.md` §1.1 页生命周期行）· 新建控件 = `session:create` |
| 状态词 | **闭枚举 6 词**：排队中 · 运行中 · 待审批 · 完成 · 已停止 · 错误（词形与核 i18n / 需求档同源）——界面各处（工具卡 / 活动块 / 回合）取词一律出自本集，不得自造词；与 §2 项 2 的标签位集合（位标面）分属两面，不得互相顶替 |
| 交互 | Enter 发送（**IME 组字中不发送**——`isComposing` 真 ∥ `keyCode === 229`（老 WebView 兜底臂）⇒ 键归输入法（两臂同径 · 判据单源 = `thincoder-desktop/renderer/mount-composer.mjs:41-43`）；先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`） · Shift+Enter 换行 · Ctrl/Cmd+1..9 切标签（**键 ∈ 1..9 ∧ 第 N 档存在** ⇒ 第 N 档激活；第 N 档不存在 ∥ 表外键 ⇒ 零动作不吞键；**批 A 落形** = 挂载面自挂 `keydown`，单源 = `docs/desktop/design/RENDERER.md` §1.1 键盘面） · **关闭确认面**：标签状态码集 ∩ {待审批, 运行中} ≠ ∅ ⇒ 需确认（判据单源 = `needsCloseConfirm`——消费面 = `thincoder-desktop/renderer/store.mjs`；不含者**直接关**）；**关后页随动**（接线单源 = `docs/desktop/design/RENDERER.md` §1.1 页生命周期行）；**落形** = 树面关闭控件**原位换两键**（DOM 序 = 取消 → 确认；标签项 `data-confirm="1"`；词键 `tab.action.close.cancel` / `tab.action.close.confirm`；两键锚 = `data-action` `tab:close-cancel` / `tab:close-confirm` + class `tabbar-cancel` / `tabbar-confirm`）——否 dialog / `window.confirm` / 超时自动消 / 图标字形 |
| 会话头 | provider / 模型 / 推理档位 / 工程模式 / AUTO——**会话级**，切标签随之切换；状态栏不重复呈现（同一事实只出现一处）；**落形** = 字段值由供给面出串（视图只落结构 + `data-field` 锚，不造词、不猜形）；**供给未落 ⇒ 零字段节点**（禁假数据）；**三值就地可改（批 B 落）** = `provider` / `model` / `effort` 各一控件 → 通道 `session:prefs` ⇒ 回执 `meta` 就地刷本行（不整页重挂 · 零乐观写）——控形 / 锚 / 候选面 = 本档 §1「批 B 注」项 1 |
| 对话流 | **三态**（`data-state`）：无活动会话 ⇒ `none`（零节点——**禁假数据**）· 有会话零块 ⇒ `empty`（词表提示）· 有块 ⇒ `flow`；**根锚全量**（四锚：`data-state` / `data-blocks` / `data-hidden` / `data-following`——语义 = 三态码 / **已渲染块数** / 未渲染更早块数（产出规则 = `docs/desktop/design/RENDERER.md` §2）/ 是否跟滚 `"1"` / `"0"`）；**块五型**（`user` / `assistant` / `reasoning` / `tool` / `error`）单序列、每块 `data-block-id` + `data-block-kind`，文本为纯文本（`pre-wrap`，零 Markdown / 零 HTML 注入）；**错误卡** = 回合级错误块（工具级错误 = 工具块 `status="error"`——**不经 `ev:error`**：该通道单义 = 宿主回合结算〔错误径〕，单源 = `docs/desktop/design/IPC.md` §1 `ev:error` 行）；**挂载根 = 滚动容器 `[data-slot="flow"]` 自身**（clear + build + append 不清宿主 ⇒ 滚动位置存活）；**摘要块**（未渲染更早块 > 0 ⇒ 首子，词键 `chat.summary.older`）· **药丸**（`!following` ⇒ 尾随，词键 `chat.pill.new` / `chat.pill.bottom`）；窗口 / 回填 / 跟滚三事住 `docs/desktop/design/RENDERER.md` §2 / §3；**复制面（批 B 落）** = 逐块复制控件——形 / 锚 / 文本面 = 本档 §1「批 B 注」项 4；**真代码块（围栏切分 · 高亮）不做** = 另裁（新渲染设计面——登记 `docs/desktop/design/PROJECT.md` §10） |
| 输入区 | 中区底行（挂载根 = `index.html` 新增单容器 `[data-slot="composer"]`——`.session` 内、对话流之后）；**两态**（沿接线通则）= 有活动会话 ⇒ 可用 · 无 ⇒ `disabled: true`（锚恒在）；键位 = Enter 发送 / Shift+Enter 换行（键位单源 = 本档「交互」行）；**发送失败**（`msg:send` `ok` 假 ∥ 抛）⇒ **文本保留** + `console.error`（零静默丢字）；**附件条 + 末条复制控件（批 B 落）**——形 / 锚 / 降级面 / 清条与保留判据 = 本档 §1「批 B 注」项 2 / 项 4；**忙态入队** = 回合在飞（判据 = 本会话位标含 `running`）⇒ Enter 不发，文本落 `pool.queue`（条目 `{ title, status: "queued" }`——条目形单源 = 池面队列条目消费集 `thincoder-desktop/renderer/views/activity.mjs:119-125`；池面「队列」族随之在场）+ 输入区清空；**flush** = 回合尾三径（`done` / `stopped` ∨ `ev:error`——同判据，单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）⇒ 队首**先发后出队**（**取文本面 = 条目 `title` 逐字原样**——载荷 `text` = `title`，零显示串副本 / 零第二字段〔屏面截断归样式面，不改值〕；`msg:send` 回执 `ok` 真 ⇒ 出队；`ok` 假（`busy` / `bad-key` / `provider-invalid`）∥ 抛 ⇒ **留队** + `console.error`；**可见失败面** = 池面「队列」族条目仍在场 · **重触发 = 下一次回合尾**（同一条重试，零新定时器）；同键序 `busy` 不可达佐证（`busy` ⇐ 在飞，而终局事件 post 先于 `release()`——`thincoder-desktop/src/main/agent-host.mjs:170-181`）；一次一条，余者同待下一回合尾——零静默丢条；`ev:error` 径另清本键 `running` + 位落 `done`）——**满队** = 队长 ≥ `QUEUE_MAX`（常量住 `thincoder-desktop/renderer/store.mjs`）⇒ 提示行落地（词键 `composer.queue.full`）且**该条不入队**（队长不增 · 输入文本保留）；中断键 = `data-action="msg:interrupt"`（零乐观写） |
| 状态栏 | **位置 = 窗口级底行**（`.app` 第 4 子元素 · 跨三列——三列框外一行；地面 = 需求档 §3.1 图 `:42` + 实施批档 §5.5 项 1 落形）+ 活动会话上下文占用（实时读数——**供给面 = `ev:usage` 事件**（批 B 落）；**≥ 80% 转警示色**）+ 非活动标签的待审批 / 运行提示（跨会话告警位）——两处皆**单点重建**（状态行唯一 writer）；**落形** = 告警位取值 = 非活动标签位标码（待审批 / 运行中——与标签位**同源同词**，优先序消费 = 标签切片单源，不由本面复制）；**读数供给（批 B 落）** = 活动键 `ev:usage` 读数（**未至 / 非正数 ⇒ 零读数节点**——禁假造）；读数按会话 `key` 归约、切标签随动（形 = 本档 §1「批 B 注」项 3） |
| 审批呈现 | 流内卡片（主）+ 本会话活动池计数 + 标签位（同一待决项三种视图）；**落形**（批 A）= 卡为流内**独立节点**（根锚 `data-card="approval"` + `data-prompt-id` + `data-shape`，值域 `single` / `batch`；根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]）；**两形键位**：逐项形 `1` / `2` / `3` ⇒ `once` / `always` / `reject`，批形 ⇒ `approveAll` / `deny` / `oneByOne`（表外键 ⇒ **零动作 · 不吞键**——实现 = 纯函数 `verdictOfKey`）；三出口锚 = `data-action="approval:<verdict>"` + `data-key="1\|2\|3"`；**初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）——落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）未落**（登记 open 行）；`changes` 超阈 ⇒ 卡面只摘要行 + 增删计数（判据与形与工具卡**同源** = `thincoder-desktop/renderer/views/chat-tool.mjs`）；出口点按 ⇒ 通道 `approval:respond`（载荷见 `docs/desktop/design/IPC.md` §2），**零乐观写**（待决项清除归事件面） |
| 提问呈现 | 流内卡片（`question` 工具）——**决策面**；**不入池三族**（池 = 本会话面 ⇒ 不添跨会话可见性）；**跨会话可见面 = 标签位**（需求档 §3.1「不静默等待」兑现面）——待作答 ⇒ 该会话位标含 `approval` 码（与审批门**同码同词**——显示词 / 优先级单源 = 本档 §2 项 2）· 出场 ⇒ 清码（判据同卡退场）——**码位两面（点名）**：置位面 = **归约面**（`thincoder-desktop/renderer/events.mjs` `onQuestion`——`ev:question` 写切片同处按**同码闭集**置位，**与 `onApproval` 同形**）· 清位面 = 出口面（`thincoder-desktop/renderer/mount-cards.mjs` 回执 `ok` 真）∥ 事件面（`stopped` 终局摘项同处）；同面缺口（置 / 清键源不同住一档——既有登记）**批 A 收正** = 置 / 清两面同住归约面（置位面 `onQuestion` = `thincoder-desktop/renderer/events.mjs:161`；清位面 `clearQuestion` = `:329` ∥ 审批径 `clearApproval` = `:316`；门名单单源 = `thincoder-desktop/src/main/suspensions.mjs:67` `denyGates`）——零新机制——连带：该态下关标签走确认面（判据单源 = 本档「交互」行）；**落形** = 卡根 `data-card="question"` + `data-prompt-id`（待决项身份 / 路由键，与 `ev:question` 同源同值）；子序 = 题干行 → [给答项操作区?] → 作答区；**给答项**（`options` 非空）逐项 = `data-action="question:<i>"`（i = 1 起）+ 词 = 选项串原样（**零构造**）；**自由作答** = 文本控件 + 提交键 `data-action="question:answer"`；取消 = `data-action="question:cancel"`；出口 = `question:respond`（`answer` = 选项串原样 ∥ 输入串 ∥ 取消 ⇒ `null`——挂起表按取消串 `(user cancelled)` 结算，串单源 = `thincoder-desktop/src/main/suspensions.mjs`；回执 `null` ∥ 工具结果串两域界限 = `docs/desktop/design/IPC.md` §2 `question:respond` 行）；**卡退场判据** = 回执 `ok` 真（非乐观写——失败 ⇒ 卡仍在场可重试 + `console.error`）；**中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清码（判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条） |
| 计划面 | 流内**独立节点**（`ev:task` 面——工程模式 `task` 工具的事项表）· **落形** = 卡根 `data-card="task"` · 逐行 = 事项标题 + 状态词（`pending` ⇒ 排队中 / `in_progress` ⇒ 运行中 / `done` ⇒ 完成——出词本档 §1 闭枚举）；**同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）；**空列表 ⇒ 卡不在场**（`items` 空 ⇒ 零节点）；通道面 = `docs/desktop/design/IPC.md` §1 `ev:task` |
| 工具卡 | 名称 + 参数摘要 + 状态（**词 = 状态词闭枚举**；锚 = `data-status`）+ **耗时**（`ev:tool-result` 载荷——`docs/desktop/design/IPC.md` §1；仅完成 / 错误态且数在时落）+ 可展开结果（**折叠默认态**：错误展开、其余折叠；显式 `expanded` 优先；无结果 ⇒ 头为纯展示行零控件）+ **改动摘要**（文件 + 增删行数，纯文本，不做 diff）；**大 patch 降级** = 超阈（**> 200 行 或 > 10 文件**）只给摘要 + 增删计数，**不启用外部查看器**（文件视图 / 打开 / 内置 diff 在本版边界外——`docs/desktop/design/PROJECT.md` §8） |
| 空态 | 无会话 → 左列新建入口 + 中区引导；无 provider → 引导向导 |
| 启动态 | 无当前项目 ⇒ **左列** = 打开目录入口 + 最近目录列表（读面 = `docs/desktop/design/IPC.md` §2 项目面注；点最近项**直接进入**，不再弹目录选择）· **中区引导面延后**（落点档未裁——视图族落点 = `docs/desktop/design/PROJECT.md` §4.1） |
| 左列会话行 | 行 = 标题（`title` 空 ⇒ 词表缺省词）+ 来源端标（`createdBy` 三值 ⇒ CLI / 扩展端 / 桌面端；缺键 ⇒ **无标**——本档 §2 项 3）+ 当前活动槽标（`isActive`，非状态位）；**接线**（批 5 落）= 点行 `session:switch` ⇒ 开标签 ∧ 标签条**同一路** · 空态新建入口与标签条新建控件 = `session:create` · 行 `data-action` = `session:switch`；**行动作（批 A 落）** = 行内两控件：改名 `data-action="session:rename"` / 删除 `data-action="session:delete"`——**行原位换形**（改名 ⇒ 文本控件 + 两键〔取消 / 改名〕——行控件撤 · 删除 ⇒ 两键〔取消 / 删除〕——**保留行控件**；DOM 序 = 取消 → 动作键；**确认键词 = 动作词**〔取消 / 改名 · 取消 / 删除——测试固化 = `thincoder-desktop/test/views.test.mjs:269-274`〕；锚 `session:rename-cancel` / `session:rename-confirm` / `session:delete-cancel` / `session:delete-confirm`）——**换形态态单源** = `thincoder-desktop/renderer/store.mjs`（`railForm{ key, mode }`——纯动作 `openRailForm` / `closeRailForm`，沿 `pendingClose` 先例）；沿「交互」行关闭确认面同形；**否** `window.prompt` / `window.confirm` / dialog / 超时自动消；运行 / 待审批位标面随对话流批（`docs/desktop/design/IPC.md` §2 会话族注） |
| 项目级信息 | 左列底行（挂载根 = `[data-slot="info"]`——常量源 `thincoder-desktop/renderer/mount-settings.mjs:29`；左列会话行之后——**项目一份、不随会话走**）· **只读**（零写入口）；落形 = 三读数节点（台账计数 `counts.pool` / `counts.tech` / `counts.aged` · 超阈标 `thresholdReached` · 相位 `phase`）；**读数供给未落 ⇒ 零节点**（禁止假造）；行右端 = 设置入口控件（`data-action="settings:open"`——见下行）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注 |
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 左列底「项目级信息」行右端 `data-action="settings:open"`（否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——四段闭集不动；**零 Esc 绑定**（不新增键盘层——既有键盘面 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`）与标签条加速键（本档「交互」行）两处，键闭集皆不含 Escape）；面 = 四段（渠道 / 模型与档位 / agent 参数 / MCP）；**「模型与档位」段档位控件形（批 B 落）** = `select`（选项 = **Auto + off 族 + 逐模型档位枚举**——**off 在场判据 = 核 `thinkOffPath(spec)` 投影**〔判定对象 = 该段当前所选模型；真 ⇒ off 选项在场 · 假 ⇒ 缺席〕；枚举单源 = 核 `reasoningEffortEnum` 投影；**现值 = `provider:list` 行投影 `effort`**（离线——批 B 注项 5）· **表外现值 ⇒ 自成一选项**（不吞）· **现值恒在场（含不可选态）** · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点）；**该段写面 = 全局 config**（`settings:agent`——设置面默认值）；**会话级切换在会话头**（本档「会话头」行）——两面不互相顶替（需求 §3.5 项 5 / 项 6），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——`docs/desktop/design/PROJECT.md` §2 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口） |
| 首启向导 | 闸 = `config:read` 回执 `configured` 假 ⇒ 冷启动进向导（已配 ⇒ 跳过）；**容器 = 同设置面**（`[data-slot="settings"]` 单容器——两树互斥 · `configured` 假 ⇒ 向导占槽）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）——**零终端可完成**；**退场 = 清空容器**（主 UI 可用）· **幂等可重入**（中途退出 / 配置仍缺 ⇒ 下次冷启动再进）；**档不可读（畸形）⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读**（错误串直传 · **不静默重置**——`docs/desktop/design/PROJECT.md` §2 KD-12；`data-boot` 保持 `error`）；表单出口**复用设置面导出面**（单一 owner · 零副本）；形态 = 纯描述符树 + 薄挂载（`docs/desktop/design/RENDERER.md` §1.1）；**步界 / 步体闭集**（单源）= `STEPS` 三步闭集（表外值回落步 1——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30`）· `stepBody` 三分支（步 1 / 2 / 其余 ⇒ 目录步——`:84`） （机检豁免——端侧语汇） |
| 主题 | 跟随系统深浅（`nativeTheme`），变量集中在 `styles.css` |
| 键盘可达 | 审批卡三出口可键盘触发（**两形键位**见「审批呈现」行：逐项形 1 / 2 / 3 = once / always / reject，批形 = approveAll / deny / oneByOne）；初始焦点**目标** = **最安全键**（逐项「拒绝」/ 批「全否」——落形 = 标记锚 `data-autofocus="1"`（恰一）；**置焦执行未落**——见「审批呈现」行）；焦点环与 Tab 序显式定义（标签条项 Tab 序 = 「标签条」行单源） |
| i18n | 承产品定性（英文默认面，含 zh）；词表与核 i18n 面同源——**供给面 = `config:read` 语言面下发**（`{ locale, dict }`，核 `projectDictionary` 投影；本端不另立词表源——通道面 = `docs/desktop/design/IPC.md` §2） |
| open | 左列折叠阈值**数值**（初值 900px + 调参面单常量已给——见「断点」行）· 审批卡**置焦执行**（行为面 = 真 DOM `focus()`；制品面 = 标记锚 + `chat.css` 高亮——见「审批呈现」行）· 活动池**窗限 / 归档口径**（清点 = 全量在场已落；窗限 / 归档未定——见 §2 项 1 行）· 标签条**九档以上**键盘面（加速键 `Ctrl/Cmd+1..9` 覆盖 1–9——超出无键盘路径）· **附件条样式**（缩略图 / 移除键尺寸规则未落——现盘零 CSS 规则；见「批 B 注」项 2） |

**长会话渲染窗口 · 回填与跟滚**两行属实现工艺面 ⇒ 住 `docs/desktop/design/RENDERER.md` §2 / §3（本档不保留其正文）。

**批 B 注（⑤–⑧ 四件 + 设置面档位一件 · 五项 · 形 / 锚 / 候选面 · 2026-09-27）**：本档 §1「会话头」/「对话流」/「输入区」/「状态栏」/「设置面」五行标注「（批 B 落）」的项，落形逐条如下——本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（「会话级偏好注」/「附件注」/「档位控件注」），不在此重述。

1. **会话头三值就地可改**——控形 = `select`（原生控件 · 零框架）；锚 = `data-field` 字段节点内嵌控件（`data-field="provider"` / `"model"` / `"effort"` 三值——工程模式 / AUTO 两位不在本项，沿其既有点按出口）。
   候选面 = `provider` / `model` 取 `model:list` 回执投影（渠道候选 = `provider:list`）；`effort` 选项 = **Auto + off 族 + 逐模型档位枚举**（与「设置面」行同集——枚举单源 = 核 `reasoningEffortEnum` 投影）。
   候选口径（细目）：改 `provider` ⇒ **逐 provider 重取** `model:list`（模型与档位候选随新回执——旧值不保）；模型候选 = 回执逐项 `.id` 逐字；**off 在场判据 = 该模型 `thinkOff`**（假 ⇒ off 选项缺席——不可 `off` 者不占位；**现值恒在场（含不可选态）**）。
   写面 = 通道 `session:prefs`（载荷 `{ key, patch }`——键闭集与「至少一键」判据单源 = IPC 同注；**`provider` 变更须同送 `model`**——否则拒 `model-required` 零写）；回执 `meta` ⇒ **就地刷本行**（不整页重挂 · 零乐观写）；`ok` 假 ∥ 抛 ⇒ 控件值回退为回执前值 + `console.error`（零静默）。
   本行只对**活动会话**在场（会话头 = 活动会话面）；写盘 / 施加两面分属核（`applySession` 唯一施加面）——单源 = IPC 同注项 4。
2. **输入区附件条**——形 = 输入区上方条（根锚 `data-attachments`，住 `[data-slot="composer"]` 内）；逐项 = 缩略图（`dataURL`）+ 文件名 + 移除控件 `data-action="attach:remove"`（携 `data-attachment-id`）；**空 ⇒ 零节点**（禁假造）。
   采集 = 输入区 `paste` 事件取剪贴板图像（渲染面零 fs ⇒ `FileReader` 转 `dataURL`）；暂存 = 输入区内存态（与文本**同一出口**）；构树与采集为纯函数（可平 node 直测）。
   出口 = 随 `msg:send` 载荷 `images`（逐项 `{ name, mime, dataURL }`）；**清条 / 保留判据与文本同判据**（`ok` 真 ⇒ 清条；`ok` 假 ∥ 抛 ⇒ 文本与附件条皆保留 + `console.error`）。
   降级面 = 回执携 `degraded` ⇒ 提示行明示（**不静默丢图**）：`"non-vision"` = 图未随发、用户消息文本尾已附说明行（词键 `composer.attach.nonvision`）· `"partial"` = 超限 / 落盘失败项被弃、其余照发（词键 `composer.attach.partial`）。
   端侧**前置门** = 核 spec `multimodal` 判据；上限数值与弃项判据**单源 = IPC「附件注」**（本档不重述）。
3. **状态栏读数**——形 = 状态栏内读数节点 `data-usage`（值 = `ev:usage` 的 `percent` ⇒ 读数串）；**未至 / 非正数 ⇒ 零读数节点**（禁假造）；**> 100 照显**（读数门 = 数字 ∧ > 0——**无上界夹值**）；≥ 80% ⇒ 警示色（class 切换 · 阈值数值单源 = 本档「状态栏」行）。
   归约 = 按会话 `key` 写切片（**归约面为唯一写者**——状态行单点重建，视图面不复算）；切标签 ⇒ 取活动键值随动。
4. **复制面**——逐块控件 = 每块尾 `data-action="chat:copy-block"`（携 `data-block-id`；块文本空 ⇒ 零控件）；末条控件 = 输入区尾 `data-action="chat:last"`（**取文源 = 末 `assistant` 块**——无 `assistant` 块 ⇒ 零控件 · 取定块文本空 ⇒ 零控件〔`null`，**不回退更早块**〕）。
   文本面 = **纯文本取块文本逐字**（对话流本就 `pre-wrap` 零 Markdown ⇒ 复制面不加解析）；出口 = `navigator.clipboard.writeText`（`app://` 注册为 secure ⇒ 安全上下文成立——`docs/desktop/design/PROJECT.md` §2 KD-2）。
   成功 / 失败**零布局变化**（不引提示条机制）；失败 ⇒ `console.error`（零静默）。
   **真代码块**（围栏切分 · 语法高亮 · 代码块级复制）= 另裁新渲染设计面 ⇒ 登记 `docs/desktop/design/PROJECT.md` §10；本批复制面 = **块级 + 末条**（D13 能力语义的忠实实现——批次档 §1.2 B 裁定）。
5. **设置面档位控件（⑥ · 批 B 设计修订轮）**——「模型与档位」段档位 `select` 的现值 / 候选 / 写 / 回退四事（语义与载荷单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）：
   现值 = 该段当前所选模型（`settings.defaultModel` 复合串**模型段**）的渠道条目投影——取 `provider:list` 行 `effort`（**离线**，零探针）；**表外现值 ⇒ 自成一选项**（不吞 · 零改写；仅设置面——会话头读侧归 `null` ⇒ 无此态）；选项集 = `Auto` + `off`（`thinkOff` 真时在场）+ 逐模型枚举；`defaultModel` 缺 / 模型段空 ⇒ 档位控件**零节点**（禁假造）。
   写 = `settings:agent` 载荷 `{ tier: { provider, model, level } }`；`ok` 真 ⇒ 重取 `provider:list` 刷现值（不整页重挂 · 零乐观写）；`ok` 假 ∥ 抛 ⇒ 控件值回退回执前值 + `console.error`（零静默）。
   边界：本控件 = **渠道条目级默认**；逐模型精确控制 = 会话级档位（本档 §1 批 B 注项 1 /「会话头」行）——两面不互相顶替（需求 §3.5 项 6）。

## 2. 活动池与状态位（需求档 §3.5 三项落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | 归组键 = 核 relay 前缀（`role#id`——`@thincoder/core/agent/relay-prefix.mjs`，扩展端已消费）；池内三条目族 = **活动块**（子代理 / advisor / consult，粒度 = 工具名 + 状态，不回显内容）· **队列**（排队中回合 / 工具批）· **待审批**（计数 + 操作区，置顶）；折叠态按会话记忆。**落形**（批 A）= 三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）· 有会话三族皆空 ⇒ `empty`（词表提示）· 否则 `pool`；**族序 = 待审批 → 活动块 → 队列**（族空 ⇒ 该族零节点）；折叠头两读数 = `running` / `approval`（`pool` 切片出；**非数 ⇒ 零节点**——禁假造；`store` 缺省 `running: 0` / `approval: 0` ⇒ 落 `0` 读数）· 折叠态键 = `poolCollapsed`（按会话记忆）· 控件锚 `data-action="pool:toggle"`；条目**零内容回显**（工具名 + 状态词——状态词出自 §1 闭枚举 6 词）· **清点口径**（批 8 落）= 条目入池即在场（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status`）——**收束不摘除**（长会话池切片单调增长；**队列族例外**——出队即摘除）；**队列入池（批 A 落）** = 忙态发送入队（写者 = `thincoder-desktop/renderer/store.mjs` 纯动作 · 条目 `{ title, status: "queued" }`——形单源 = 池面队列条目消费集 `thincoder-desktop/renderer/views/activity.mjs:119-125`）；出队 = 回合尾三径经 `msg:send` 发出（**先发后出队**——`ok` 假 ∥ 抛 ⇒ 留队；见本档「输入区」行）；**窗限 / 归档未定**（见 open 行） |
| 2 · 标签位集合与优先级 | **落定** | 取值 = 运行中 / 待审批 / 完成 / 空闲；优先级 **待审批 > 运行中 > 完成 > 空闲**（一个会话同时命中多值时显示最高者）；来源 = 本会话的挂起表 + 回合状态（`onToken` / `onToolCall` / `onToolResult` 驱动）；另两端已有同义状态语义（“waiting” 类状态位先例 `thincoder-vscode/src/extension/panel-callbacks.mjs:54`）⇒ 三端语义一致、呈现各自定形 |
| 3 · 会话行「来源端」标注 | **落定** | 读 `sessions:list` 条目的 `createdBy`（核 `listSlots` 投影，实读 `thincoder-core/session-slots.mjs:217`——SLOT-END-PARAM 批落地）⇒ 会话行标注**创建端**（CLI / 扩展端 / 桌面端）；**缺键（老槽）⇒ 不标注**（不猜测——**禁以「占用端」冒充**，见下旁证行）；通道面 = `docs/desktop/design/IPC.md` §2 会话族行 |

**旁证（不得混称）**：**占用端**（谁正持有该槽运行）可由核 peer 面观察（`thincoder-core/peer-instances.mjs` 的端字段）——那是另一事实，与「来源端」不同义，本端**不**以它冒充来源端。

## 3. 范本借用清单（形态面 · UI 范式勘察落档）

清单前言（单源，住本档）：**本端落形列 = 单源**（本档 §1 规则行引用本表常量）；来源只作参照，不作承诺。
全部落形只用**浏览器原生能力**（`mask-image` / 原生滚动事件 / `tabindex` 焦点序）——**零框架零构建**（`docs/desktop/design/PROJECT.md` §2 KD-4）成立，逐项无框架依赖。
证据级别两档——**本仓实读**（本仓源档逐行读过）∥ **外部转引**（参考仓 kimi-web / opencode 的父侧实测读数；本端只复核坐标在位，未运行实测）。

| # | 借用项 | 本端落形（本档 §1 规则行） | 来源坐标 | 级别 |
|---|---|---|---|---|
| 7 | 标签条形态 | 标签宽 ∈ [1.75rem, 14rem]；溢出横滚 + 端点渐隐；非活动标签控件收 Tab 序（`tabindex="-1"`——本档 §1 标签条行） | opencode `titlebar-tab-strip.tsx`（91 / 147 宽域 · 215 溢出横滚）；渐隐端 `text-reveal.css`（66-85） | 外部转引 |
| 8 | 左列壳折叠 | 单断点常量（初值 900px）；保 open 只对数值 | opencode `sidebar-shell.tsx`（43-46 `inert` 开关） | 外部转引 |
| 9 | 状态词闭枚举 | 6 词闭集（排队中 / 运行中 / 待审批 / 完成 / 已停止 / 错误） | `thincoder-core/i18n.mjs:50-54`（运行中 / 排队中 / 已停止 / 完成 / 错误）· 需求档 §3.5（待审批位） | 本仓实读 |
| 10 | 用量警示 + 单点重建 | 上下文 ≥ 80% 转警示色；状态行单点重建（唯一 writer） | `thincoder-vscode/webview/status-bar.js:37`（≥ 80%）· `:62`（单点重建） | 本仓实读 |
| 11 | 审批卡形态 | 键 1 / 2 / 3 + **初始焦点目标** = 「拒绝」（标记锚 + `chat.css` 高亮；真置焦执行未落）；大 patch 超阈 ⇒ 摘要 + 增删计数（**不采**外部查看器） | `thincoder-vscode/webview/permission.js:33` / `:37`（超阈先例）· `:50`（先例 = 外部查看器——本端**不采**）· `:76`（焦点 deny）；外部 = kimi-web `ApprovalCard.vue` | 本仓实读 + 外部转引 |

计数：**形态面 5 行（第 7–11 项）**；实现工艺面 6 行（第 1–6 项，其中第 4 行 = 首屏面补行）住 `docs/desktop/design/RENDERER.md` §4——合 **11 行 = 10 项借用 + 1 补行**；外部档引用 = 参考仓文件名 + 行号（参考仓非本仓，不展开路径）。

## 变更记录

- 2026-09-25：建档（桌面端设计批 1 · 分档轮）——由 `docs/desktop/design/PROJECT.md` 分出界面面：§1 = 该档 §9 的 14 条形态行逐字（工艺面两行「长会话渲染」「回填与跟滚」住 `docs/desktop/design/RENDERER.md` §2 / §3）；§2 = 该档 §3.5 逐字；§3 = 该档 §11 的形态面 5 行（第 7–11 项）+ 清单前言（单源）。该档 §9 / §3.5 / §11 位置改留一行指针。
- 2026-09-25（**修正轮**——设计评审 §3 轮次 1 发现 2 / 12）：i18n 行补**供给面**表述（`config:read` 语言面下发——核 `projectDictionary` 投影）；open 行收窄为「左列折叠阈值**数值**」（原句内已落定项收尾句删除——长会话渲染指路仍在本档 §1 末行）。
- 2026-09-25（**修正轮 2**——设计评审 §3 轮次 2 发现 16）：§1 增**启动态**行（无当前项目 ⇒ 中区 = 最近目录列表 + 打开目录入口；点最近项直接进入不再选目录——用例 T-DSK2）+ 档头面清单同步。
- 2026-09-25（**实施后修正轮**——状态栏位置 · U3）：§1 状态栏行补位置（窗口级底行 · `.app` 第 4 子元素 · 跨三列——地面 = 需求档 §3.1 图）；§2 项 3 由 open 转**落定**（读 `createdBy`，缺键 ⇒ 不标注）。
- 2026-09-25（**批 3 视图面首段 · 左列**）：§1 增「左列会话行」行（行形态三件 = 标题 / 来源端标 / 当前活动槽标；点行与位标面的随批口径）+ 档头面清单同步。
- 2026-09-25（**批 3 修复轮 1**——设计评审 §3 轮次 1 发现 4）：§1 启动态行收正为**左列面落点**（打开目录入口 + 最近目录列表）；中区引导面标记延后（落点档未裁——视图族落点 = `docs/desktop/design/PROJECT.md` §4.1）。
- 2026-09-25（**批 4 中区外壳面**）：§1 标签条 / 会话头 / 状态栏三行补**落形**（位标节点形态 · 字段供给出串 · 告警位与标签位同源 · 字形住 `styles.css`）与供给面措辞（会话头字段 / 状态栏读数 = 会话族载荷扩充，未落 ⇒ 零节点）；open 行增会话头 / 状态栏供给项。
- 2026-09-25（**实施后修正轮 2**——标记收正）：§1 `thincoder-desktop/renderer/styles.css` 行的「（拟新增）」标记去标（已落档 · 同源发现）。
- 2026-09-26（**批 5 会话族批**）：§1 交互行补**关闭确认面**（判据单源 = `needsCloseConfirm` · 树面原位换两键 · 词键 · 否 dialog / 自动消 / 字形）；标签条行与左列会话行补**接线**（标签激活 / 关闭 / 新建 · 左列点行与空态入口——激活即切换会话，行与标签同一路）。
- 2026-09-26（**批 5 修复轮 #60**——设计评审 §3 轮次 1 发现 7 / 8）：§1 交互行补**确认面两键锚**（`data-action` `tab:close-cancel` / `tab:close-confirm` + class `tabbar-cancel` / `tabbar-confirm`）；启动态行删「退回启动态 = 左列项目区入口」句（含菜单附注——现形无落点；菜单面口径单源 = `docs/desktop/design/SHELL.md` §2 · `docs/desktop/design/IPC.md` §1）。
- 2026-09-26（**批 6 对话流 + 工具卡（视图面）**）：§1 增**对话流**行（三态 `data-state` · 块五型与块锚 · 错误卡双支 · 挂载根 = 滚动容器 `[data-slot="flow"]` 自身 · 摘要块与药丸词键 · 窗口 / 回填 / 跟滚指路 `docs/desktop/design/RENDERER.md` §2 / §3）+ 档头面清单同步；工具卡行改写（**补耗时**（`ev:tool-result` 载荷）· 折叠默认态（错误展开 / 显式优先 / 无结果 ⇒ 纯展示行）· 状态锚 `data-status`）。
- 2026-09-26（**批 6 修复轮 #65**——设计评审 §3 轮次 1 发现 9）：§1 对话流行补**根锚全量**（四锚语义：`data-state` / `data-blocks` = **已渲染块数** / `data-hidden` / `data-following`——`data-hidden` 产出规则仍单源在 `docs/desktop/design/RENDERER.md` §2）。
- 2026-09-26（**批 7 审批与活动池视图面**）：§1 审批呈现行与键盘可达行补**落形**（卡 = 流内独立节点三锚 · 两形键位 `verdictOfKey` 表外零动作 · 三出口锚 · 初始焦点 = 最安全键 · 超阈只摘要）；§2 项 1 行补**池落形**（三态 `data-state` · 族序 = 待审批 → 活动块 → 队列 · 族空零节点 · 折叠头两读数禁假造 · 折叠控件锚）。
- 2026-09-26（**批 7 修复轮 #72**——设计评审 §3 轮次 1 发现 4）：§2 项 1 行收正 `none` 态承载节点——三态 `data-state` 锚 = 宿主 `.pool-body[data-slot="pool"]` 自身（根描述符恒在 · 零子节点；沿对话流挂载根口径）。
- 2026-09-26（**批 7 实施后修正轮 #76**——两条 🟡 设计面处置 · 收正 + 登记）：§1 审批呈现行与键盘可达行收正——**初始焦点目标** = 最安全键（落形 = 标记锚 + `chat.css` 高亮；**真置焦执行（DOM `focus()`）未落**）；§2 项 1 折叠头两读数收正「**非数 ⇒ 零节点**」（`store` 缺省 `0`（数）⇒ 落 `0` 读数）；§1 open 行登记「审批卡置焦执行」。
- 2026-09-26（**批 7 实施后修正轮 #76**——一致性面补遗 · 置焦表述对齐）：§3 项 11 行「焦点落『拒绝』」收正为**初始焦点目标** = 「拒绝」（标记锚 + `chat.css` 高亮；真置焦执行未落——主述 = §1 审批呈现行）。
- 2026-09-26（**批 8 修正轮 #91**——逐号定点）：§2 项 1 行补**清点口径**（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status` ⇒ 全量在场 · 收束不摘除）；§1 open 行登记**活动池窗限 / 归档口径**未定（`docs/desktop/design/PROJECT.md` §10 同项）。
- 2026-09-26（**批 9 设置面 + 首启向导批**）：§1 增三行（**项目级信息** / **设置面** / **首启向导**——入口锚 `settings:open` 落左列底 · 四段三态面 · 向导闸 = `configured`）+ 档头板块清单同步（形态行 17 → **20**）。
- 2026-09-26（**批 9 修正轮 #4**——渲染面形态收正）：§1 设置面行补**形态**（窗口级覆盖层面 · 挂载根 = `index.html` 单容器 `[data-slot="settings"]` · 开 / 关锚 `settings:open` / `settings:close` · **零 Esc 绑定**）；首启向导行补**容器**（同槽互斥 · 退场清容器 · 幂等可重入 · 畸形档容器空 + 错误串直传 · `data-boot` 保持 `error`）。
- 2026-09-26（**批 9 修正轮 #8**——T9 语言控件落点 · 形态面落形）：§1 设置面行补**面头语言控件**（面板头内 `settings:close` 左侧 · 锚 `data-action="settings:lang"` · **否决「状态栏」位**）；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷——免二跳 · 标签 = 词表键（两语各一键）；**语言非新段**——四段闭集不动。
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮）：§1 三行补锚——项目级信息行补挂载根 `[data-slot="info"]`（常量源 = `thincoder-desktop/renderer/mount-settings.mjs:29`）；设置面行通道指针补项 8（`FORMATS` 端侧枚举判定 / `defaultModel` 两写口）（`STEPS` 三步 · `stepBody` 三分支——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30` / `:84`）；
  明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
- 2026-09-26（**批 A 对话面板批**）：§1 增**输入区**行（挂载根 `[data-slot="composer"]` · 忙态入队 `pool.queue` · 回合尾 flush · 中断键）与**提问呈现**行（`question` 工具流内卡 · 两作答路 + 取消 · 退场判据 = 回执）；
  左列会话行补**行动作**（行内改名 / 删除 · 行原位换形 · 否 `window.prompt` / `window.confirm`）；§2 项 1 补**队列入池**（写者 = 渲染面纯动作 · 条目形单源 = 池面消费集 · 队列族例外非单调）；
  **计划面**行（`ev:task` 流内卡 · 逐行状态词出闭枚举 · 同 key 就地替换 · 空列表 ⇒ 卡不在场）与**满队** clause（队长 ≥ `QUEUE_MAX` ⇒ 提示行 + 不入队——词键 `composer.queue.full`）；open 行登记**输入区附件面**；档头板块清单同步（形态行 20 → **23**）。
- 2026-09-26（**批 A · ⑤ 标签点按修复轮**——设计先行 · 落形收正）：§1 标签条行落形由 `inert` 改**标签控件与关闭控件 `tabindex="-1"`**（确认态 `data-confirm="1"` 项例外）——`inert` 使子树对**全部**用户输入失效（含指针）⇒ 与同行「标签点击激活」相抵（实读 `thincoder-desktop/renderer/views/sessions.mjs:242`）；
  交互行补加速键落形（`Ctrl/Cmd+1..9`——挂载面自挂 `keydown`，接线单源 = `docs/desktop/design/RENDERER.md` §1.1 键盘面）· 键盘可达行补 Tab 序单源指引 · §3 原生能力行与借用项 7（落形 + 来源坐标）去 `inert` · open 行增「标签条九档以上无键盘路径」。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：交互行加速键补命中判据（**键 ∈ 1..9 ∧ 第 N 档存在**）· 输入区行 flush 与两失败径收正——
  **回合尾三径**（`done` / `stopped` ∨ `ev:error`——单源 = `docs/desktop/design/RENDERER.md` §1.1；**先发后出队**：`ok` 假 ⇒ 留队 + `console.error`；发送失败 ⇒ 文本保留；`ev:error` 径清 `running` + 位落 `done`）·
  提问呈现行补**中断径**（终局 `stopped` ⇒ 事件面摘提问项——判据非回执）与取消结算串（`(user cancelled)`——单源 = `thincoder-desktop/src/main/suspensions.mjs`）· 左列会话行补换形态态单源（`railForm{ key, mode }`）· §2 项 1 出队口径随三径收正。
- 2026-09-26（**批 A 二轮点修**——设计评审 §3 轮次 2 发现 2 / 3 / 6）：对话流行错误卡去「双支」（`ev:error` 单义 = 宿主回合结算〔错误径〕）· 输入区行 flush 补**取文本面**（条目 `title` 逐字原样——载荷 `text` = `title`）+ 失败码三值 + 可见失败面 / 重触发（同键序 `busy` 不可达佐证附源坐标）· 提问呈现行补**码位两面点名**（置位面 = 归约面 `onQuestion`〔与 `onApproval` 同形〕· 清位面 = 出口面 ∥ 事件面）。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§1 交互行补 **IME 组字规则**（`isComposing` 真 ⇒ Enter 不发送——先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`）· 三处「本批」⇒「批 A」·
  提问呈现行码位两面收正（`onQuestion` = `thincoder-desktop/renderer/events.mjs:161` · `clearQuestion` = `:329` ∥ `clearApproval` = `:316`；门名单单源 = `thincoder-desktop/src/main/suspensions.mjs:67`——原「同面缺口」收正）·
  左列会话行行形态收正（删除形**保留行控件** / 改名形**撤行控件**；确认键词 = **动作词**——测试固化 = `thincoder-desktop/test/views.test.mjs:269-274`）。明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 A 收口尾轮**——只报不写清单落地）：交互行补 **229 兜底臂**点名（`isComposing` 真 ∥ `keyCode === 229`——老 WebView 兜底臂；判据单源 = `thincoder-desktop/renderer/mount-composer.mjs:41-43`）·
  交互行删「**实施未落**——登记 open 行」陈旧标记 · open 行摘 **IME 组字保护**条（实施已落）。明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.14。
- 2026-09-27（**批 B · 会话面板对齐四件**——⑤⑥⑦⑧ 落形轮）：§1 增「**批 B 注**」四项（会话头三值控件 · 输入区附件条 · 状态栏读数 · 复制面——各给形 / 锚 / 候选面 / 清条与降级判据；语义单源 = `docs/desktop/design/IPC.md` §2）；
  会话头 · 对话流 · 输入区 · 状态栏（两处）· 设置面五行的**六处**「（本批落）」⇒ **（批 B 落）**（零语义 · 一致性小改）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：批 B 注项 1 补候选口径细目（改 `provider` ⇒ 逐 provider 重取 · 模型候选取回执 `.id` · off 在场判据 = 该模型 `thinkOff`）+ 写面同送约束（`provider` 变更须同送 `model`——否则拒 `model-required`）；设置面行补 off 在场判据；批 B 注项 4 补末条取文源（末 `assistant` 块——无 ⇒ 零控件）。
- 2026-09-27（**批 B 设计修订轮 · ⑥ 设置面档位控件**）：设置面行「模型与档位」段档位控件形补**现值 / 选项集 / 零节点三判**（现值 = `provider:list` 行投影〔离线〕· 表外现值自成一选项〔不吞〕· `defaultModel` 缺 / 模型段空 ⇒ 控件零节点）；
  §1 批 B 注前言「档位控件注」入语义单源列 + 增**项 5「设置面档位控件」**（现值 / 候选 / 写 / 回退四事 · 边界句 = 渠道条目级 ∥ 会话级——不互相顶替）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮**——实施后随动收正）：批 B 注项 1 与设置面行同补**现值恒在场（含不可选态）** · 状态栏读数补 > 100 照显（读数门 = 数字 ∧ > 0——无上界夹值）· 批 B 注项 4 末条取文补「取定块文本空 ⇒ 零控件（不回退更早块）」· open 行登记**附件条样式未落**。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
