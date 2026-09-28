# 桌面端（DESKTOP）· 界面形态与交互

> 板块 = **桌面端界面形态与交互面**——布局 / 断点 / 会话控制面 / 状态词 / 交互键位 / 会话头 / 对话流 / 输入区 / 状态栏 / 审批呈现 / 提问呈现 / 计划面 / 工具卡呈现 / 空态 / 启动态 / **项目级读数 / 设置面 / 首启向导** / 主题 / 键盘可达 / i18n，以及本会话活动池与状态位。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D26 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：有界渲染窗口 / 回填与跟滚 / 流式增量等**实现工艺** = `docs/desktop/design/RENDERER.md` · 进程与目录形态 = `docs/desktop/design/SHELL.md` · 通道与载荷 = `docs/desktop/design/IPC.md` · 总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 界面形态落定（UI / 交互决策）

| 面 | 决策 |
|---|---|
| 布局 | **两列**：中区 = 会话（会话控制条 + 会话头 + 对话流 + 输入区）· 右栏 = 活动池（可折叠，折叠态按会话记忆）；骨架 = `thincoder-desktop/renderer/index.html`（状态栏 = 窗口级底行——见「状态栏」行） |
| 断点 | 窗口宽 < **900px**——原左列折叠面随会话模型轮 R13 退场，现行折叠行为待收正（随轮）；900px = 首版初值（**单断点常量**，调参面 = `thincoder-desktop/renderer/styles.css` 一处；**数值保 open**，实施批实测调） |
| 状态词 | **闭枚举 8 词**：排队中 · 运行中 · 待审批 · 完成 · 已停止 · **已中断** · 错误 · 就绪（前 6 词词形与核 i18n / 需求档同源；**已中断** = 工具卡中止形（词键 `tool.interrupted`——值逐字同 VSC locales；本档 §1「本批注（对齐第三批 · 小修族）」项 5）；**就绪**词形来源单列 = CLI 静息值 `Ready`——`thincoder-cli/src/tui/tui-state.mjs:43` 实读，核 i18n 无同源词，2026-09-28 重审判定入集）——界面各处（工具卡 / 活动块 / 回合 / 状态行）取词一律出自本集，不得自造词；与 §2 项 2 的标签位集合（位标面）分属两面，不得互相顶替 |
| 交互 | Enter 发送（**IME 组字中不发送**——`isComposing` 真 ∥ `keyCode === 229`（老 WebView 兜底臂）⇒ 键归输入法（两臂同径 · 判据单源 = `thincoder-desktop/renderer/mount-composer.mjs:41-43`）；先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`） · Shift+Enter 换行 · 会话控制面键面 = 选择器 Enter ∕ Space 开合（单源 = 本档 §1「会话控制面」行） |
| 会话头 | provider / 模型 / 推理档位——**会话级**，切会话随之切换；**模式四位（AUTO / PLAN / ADVISOR / ENG）住状态行行首**（同一事实只出现一处——「屏面为准」重审，2026-09-28：本档 §1「本批注（状态栏对齐 · 屏面为准）」）；**落形** = 字段值由供给面出串（视图只落结构 + `data-field` 锚，不造词、不猜形）；**供给未落 ⇒ 零字段节点**（禁假数据）；**三值就地可改（批 B 落）** = `provider` / `model` / `effort` 各一控件 → 通道 `session:prefs` ⇒ 回执 `meta` 就地刷本行（不整页重挂 · 零乐观写）——控形 / 锚 / 候选面 = 本档 §1「批 B 注」项 1 · **外壳降噪（D24）**：字段 chip 静息无描边 + 交互态四值（原生 `select` 平台控形边界同注项 6）——本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2；**对齐第三批**：忙态写门（在飞 ⇒ 三值控件 `disabled`）——本档 §1「本批注（对齐第三批 · 小修族）」P23 |
| 对话流 | **三态**（`data-state`）：无活动会话 ⇒ `none`（**零块节点** + 引导节点——**禁假数据**；引导面 = 本档 §1「批 B 追加注」项 1）· 有会话零块 ⇒ `empty`（词表提示）· 有块 ⇒ `flow`；**根锚全量**（四锚：`data-state` / `data-blocks` / `data-hidden` / `data-following`——语义 = 三态码 / **已渲染块数** / 未渲染更早块数（产出规则 = `docs/desktop/design/RENDERER.md` §2）/ 是否跟滚 `"1"` / `"0"`）；**块六型**（`user` / `assistant` / `reasoning` / `tool` / `error` 五项页读域 + 运行期块 `subagent`——归档入流块，单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）单序列、每块 `data-block-id` + `data-block-kind`，文本面 = **经共享渲染核呈现**（Markdown 单源 = 核 `md`——含全量转义闸；真代码块 / 推理块 / 复制面 = 本档 §1「本批注（对齐重定位）」项 3）；**错误卡** = 回合级错误块（工具级错误 = 工具块 `status="error"`——**不经 `ev:error`**：该通道单义 = 宿主回合结算〔错误径〕，单源 = `docs/desktop/design/IPC.md` §1 `ev:error` 行）；**挂载根 = 滚动容器 `[data-slot="flow"]` 自身**（clear + build + append 不清宿主 ⇒ 滚动位置存活）；**摘要块**（未渲染更早块 > 0 ⇒ 首子，词键 `chat.summary.older`）· **药丸**（`!following` ⇒ 尾随，词键 `chat.pill.new` / `chat.pill.bottom`）；窗口 / 回填 / 跟滚三事住 `docs/desktop/design/RENDERER.md` §2 / §3；**复制面（批 B 落）** = 逐块复制控件——形 / 锚 / 文本面 = 本档 §1「批 B 注」项 4；**真代码块（围栏切分 · 高亮 · 代码块级复制）随核落**（本档 §1「本批注（对齐重定位）」项 3）；**可见面修复批修（可见面五件）**：用户块受理即出 → 本档 §1「本批注（可见面修复 · 五件）」项 2 · 流式游标清点 → 项 3；**视觉对齐（D21）**：内容面值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（21 面 · 外壳零动）；**用户块 md 深度（D19 · 残余补齐）**：`user` ⇒ `mdInline` ∥ `assistant` / `reasoning` / `error` ⇒ 全量 `md`（端侧分流——本档 §1「本批注（D17 / D19 · 残余补齐）」项 2）；**对齐第二批**：待发送气泡组 / 说话人标签行 / 归档子 agent 块——本档 §1「本批注（对齐第二批 · 六件）」项 2 / 4 / 5；**桌面空闲唤醒批**：挂起窗消化轮 ⇒ 流内**消化状态行**（**消化行族 `[data-digest]`**）——**非块节点组**（沿 `[data-pending]` 先例：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）；两行：起跑标签行 + `n > 0` 计数行（`end` 原地更新；`n = 0` 轮零计数行——沿 VSC `.digest-status` 规则）；**词面 = 核字典 `digest.*` 经 `t()` 投影直取**（**零新键** · 值同源零复制）；形态 / 落点单源 = `docs/desktop/design/RENDERER.md` §1.1 流内消化行族条；通道面 = `docs/desktop/design/IPC.md` §1 `ev:digest`；**对齐第三批**：恢复帧次序 / `[stopped]` 痕 / 错误横幅（详情 + 重试）/ 台账行 / 发送后回底 / 空态欢迎条 / **turnBreak 子回合边界**——本档 §1「本批注（对齐第三批 · 小修族）」项 8 / 6 / 9 / 12 / 13 / 15 / 7；**R12 会话流 ⇒ VSC 对齐（2026-09-29）**：块壳透明 ∕ 面宽 100% ∕ 块距 14px ∕ 件级外边距与首块上距 ∕ 扁平块模型——本档 §1「本批注（R12 会话流 ⇒ VSC 对齐）」 |
| 输入区 | 中区底行（挂载根 = `index.html` 新增单容器 `[data-slot="composer"]`——`.session` 内、对话流之后）；**两态**（沿接线通则）= 有活动会话 ⇒ 可用 · 无 ⇒ `disabled: true`（锚恒在——**禁用判据恒 = 活动会话在场：需先选工作目录**（需求档首启链 = `docs/desktop/requirements/PROJECT.md` §3.3）；引导面在场**不解除**禁用——见本档 §1「批 B 追加注」项 3）；键位 = Enter 发送 / Shift+Enter 换行（键位单源 = 本档「交互」行）；**发送失败**（`msg:send` `ok` 假 ∥ 抛）⇒ **文本保留** + `console.error`（零静默丢字）；**附件条 + 末条复制控件（批 B 落）**——形 / 锚 / 降级面 / 清条与保留判据 = 本档 §1「批 B 注」项 2 / 项 4；**忙态提交** = 回合在飞 ⇒ **一律交宿主任判**（受理判据单源 = 宿主在飞表；渲染面**不再本地判忙入队**）——受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **入队即出泡**（流尾待发送气泡——本档 §1「本批注（回合中插入 · 步边界 pickup）」项 1）；满队 ⇒ 回执 `{ ok: false, reason: "queue-full" }` + 提示行（词键 `composer.queue.full`）+ **文本保留**；**队列单源 = 宿主**（快照镜面——消费两时刻 ∕ 附件边界 = 同注项 1–3；**渲染面回合尾 flush 随本批退场**）；中断键 = `data-action="msg:interrupt"`（零乐观写）；**可见面修复批修**：样式落点与关键尺寸 → 本档 §1「本批注（可见面修复 · 五件）」项 1 · 出泡时刻 → 项 2 · **外壳降噪（D24）**：`.composer` 顶线去线 + 三控件静息无描边——本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2；**对齐第三批**：非栅格拒时机 / 发送失败可见性 / 中断键两态——本档 §1「本批注（对齐第三批 · 小修族）」P22 / P26 / P28 |
| 状态栏 | **位置 = 窗口级底行**（`.app` 第 3 子元素 · 跨两列——两列框外一行；骨架 = `thincoder-desktop/renderer/index.html:39`；地面 = 需求档 §3.1 图 `:42`）+ 活动会话上下文占用（实时读数——**供给面 = `ev:usage` 事件**（批 B 落）；**≥ 80% 转警示色**）+ 非活动会话的待审批 / 运行提示（跨会话告警位）——两处皆**单点重建**（状态行唯一 writer）；**落形** = 告警位取值 = 非活动会话位标码（待审批 / 运行中——与会话控制面条目位**同源同词**，优先序消费 = 位标切片单源，不由本面复制）；**读数供给（批 B 落）** = 活动键 `ev:usage` 读数（**未至 / 非正数 ⇒ 零读数节点**——禁假造）；读数按会话 `key` 归约、切标签随动（形 = 本档 §1「批 B 注」项 3）；**15 段逐项裁定表**（承载 / 旁置 / 不适用，零静默省略——裁定（对齐重定位批）= 本档 §1「本批注（对齐重定位）」项 1；**屏面为准重审定形（本批）= 16 段**——本档 §1「本批注（状态栏对齐 · 屏面为准）」）；**恢复态播种（D17 · 残余补齐）**：打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（`tasks` 直取 ∥ `context` 打开态读数；播种 2 / 不播种 10 逐段理由——本档 §1「本批注（D17 / D19 · 残余补齐）」项 1）；**桌面空闲唤醒批**：段 3 状态文本**第三态 = 挂起句**——判据 = 挂起窗在场（`susp[<会话键>].active` 真）⇒ 段文按 `susp.*` 三键条件组装（N/M 映射 / 优先序 / 交叠角落单源 = 本档 §1「本批注（对齐重定位）」项 1 表行 3）；`active=false` ⇒ 回落两态词（**禁假造**）；值 = **zh 取 CLI 逐字 ∥ en 取 VSC 逐字**（键名 / 值 / 落表单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；源 = `ev:susp` 计数切片（通道行 = 同档 §1）；跨会话告警码集保持 `{approval, running}`（`done` 不入——「完成非告警面」既有裁定；跨会话可见靠会话控制面条目位标）；**R11 状态行 ⇒ CLI 对齐（2026-09-28）**：段间分隔 ∕ base dim ∕ banner 四色（两新槽 ∕ 三规则）∕ 分隔两边缘面裁定——本档 §1「本批注（R11 状态行 ⇒ CLI 对齐）」 |
| 审批呈现 | 流内卡片（主）+ 本会话活动池计数 + 会话控制面条目位（同一待决项三种视图）；**落形**（批 A）= 卡为流内**独立节点**（根锚 `data-card="approval"` + `data-prompt-id` + `data-shape`，值域 `single` / `batch`；根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]）；**两形键位**：逐项形 `1` / `2` / `3` ⇒ `once` / `always` / `reject`，批形 ⇒ `approveAll` / `deny` / `oneByOne`（表外键 ⇒ **零动作 · 不吞键**——实现 = 纯函数 `verdictOfKey`）；三出口锚 = `data-action="approval:<verdict>"` + `data-key="1\|2\|3"`；**初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）——落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）= 本批落**——帧尾对 `[data-autofocus="1"]` 执行 `focus()`（「对齐第三批 · 小修族」F-置焦）；`changes` 超阈 ⇒ 卡面只摘要行 + 增删计数（判据与形与工具卡**同源** = `thincoder-desktop/renderer/views/chat-tool.mjs`）；出口点按 ⇒ 通道 `approval:respond`（载荷见 `docs/desktop/design/IPC.md` §2），**零乐观写**（待决项清除归事件面）；**可见面修复批修**：首行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 五件）」项 4；**对齐第三批**：owner 归属（子代理门）/ diff 预览 / 真置焦执行——本档 §1「本批注（对齐第三批 · 小修族）」P1 / 相抵① / F-置焦 |
| 提问呈现 | 流内卡片（`question` 工具）——**决策面**；**不入池三族**（池 = 本会话面 ⇒ 不添跨会话可见性）；**跨会话可见面 = 会话控制面条目位**（需求档 §3.1「不静默等待」兑现面）——待作答 ⇒ 该会话位标含 `approval` 码（与审批门**同码同词**——显示词 / 优先级单源 = 本档 §2 项 2）· 出场 ⇒ 清码（判据同卡退场）——**码位两面（点名）**：置位面 = **归约面**（`thincoder-desktop/renderer/events.mjs` `onQuestion`——`ev:question` 写切片同处按**同码闭集**置位，**与 `onApproval` 同形**）· 清位面 = 出口面（`thincoder-desktop/renderer/mount-cards.mjs` 回执 `ok` 真）∥ 事件面（`stopped` 终局摘项同处）；同面缺口（置 / 清键源不同住一档——既有登记）**批 A 收正** = 置 / 清两面同住归约面（置位面 `onQuestion` = `thincoder-desktop/renderer/events.mjs:161`；清位面 `clearQuestion` = `:329` ∥ 审批径 `clearApproval` = `:316`；门名单单源 = `thincoder-desktop/src/main/suspensions.mjs:67` `denyGates`）——零新机制；**落形** = 卡根 `data-card="question"` + `data-prompt-id`（待决项身份 / 路由键，与 `ev:question` 同源同值）；子序 = 题干行 → [给答项操作区?] → 作答区；**给答项**（`options` 非空）逐项 = `data-action="question:<i>"`（i = 1 起）+ 词 = 选项串原样（**零构造**）；**自由作答** = 文本控件 + 提交键 `data-action="question:answer"`；取消 = `data-action="question:cancel"`；出口 = `question:respond`（`answer` = 选项串原样 ∥ 输入串 ∥ 取消 ⇒ `null`——挂起表按取消串 `(user cancelled)` 结算，串单源 = `thincoder-desktop/src/main/suspensions.mjs`；回执 `null` ∥ 工具结果串两域界限 = `docs/desktop/design/IPC.md` §2 `question:respond` 行）；**卡退场判据** = 回执 `ok` 真（非乐观写——失败 ⇒ 卡仍在场可重试 + `console.error`）；**中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清码（判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条）；**对齐第三批**：Enter 提交 / 聚焦两态——本档 §1「本批注（对齐第三批 · 小修族）」P2 / P3 |
| 计划面 | 流内**独立节点**（`ev:task` 面——工程模式 `task` 工具的事项表）· **落形** = 卡根 `data-card="task"` · 逐行 = 事项标题 + 状态词（`pending` ⇒ 排队中 / `in_progress` ⇒ 运行中 / `done` ⇒ 完成——出词本档 §1 闭枚举）；**同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）；**空列表 ⇒ 卡不在场**（`items` 空 ⇒ 零节点）；通道面 = `docs/desktop/design/IPC.md` §1 `ev:task`；**可见面修复批修**：行两段逐段包元素（`space-between` 生效）→ 本档 §1「本批注（可见面修复 · 五件）」项 4 |
| 工具卡 | 名称 + 参数摘要 + 状态（**词 = 状态词闭枚举**；锚 = `data-status`）+ **耗时**（`ev:tool-result` 载荷——`docs/desktop/design/IPC.md` §1；仅完成 / 错误态且数在时落）+ 可展开结果（**折叠默认态**：错误展开、其余折叠；显式 `expanded` 优先；无结果 ⇒ 头为纯展示行零控件）+ **改动摘要**（文件 + 增删行数，纯文本，不做 diff）；**大 patch 降级** = 超阈（**> 200 行 或 > 10 文件**）只给摘要 + 增删计数，**不启用外部查看器**（文件视图 / 打开 / 内置 diff 在本版边界外——`docs/desktop/design/PROJECT.md` §8）；**可见面修复批修**：头行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 五件）」项 4；**对齐第三批**：结果摘要行 / 失败判据红绿 / 运行期实时输出 / 中止清扫 / advisor 轮次标签——本档 §1「本批注（对齐第三批 · 小修族）」项 1 / 2 / 3 / 5 / 14 |
| 空态 | 无会话 ⇒ 会话控制面新建钮 + **中区引导（三码分态 · `data-guide` 闭集）** = 无项目 ⇒ `no-project` · 有项目无会话 ⇒ `no-session` · 有会话零块 ⇒ `no-message`（该码 = 既有空态节点，文本 `chat.empty.hint` 不变）；无 provider ⇒ 引导向导；形 / 锚 / 动作 / 词 = 本档 §1「批 B 追加注」项 1 / 项 2 / 项 4；**对齐第三批**：`no-message` 帧欢迎条（抬头 / 文案 / 快捷键行）——本档 §1「本批注（对齐第三批 · 小修族）」项 15 |
| 启动态 | 无当前项目 ⇒ **左列** = 打开目录入口 + 最近目录列表（读面 = `docs/desktop/design/IPC.md` §2 项目面注；点最近项**直接进入**，不再弹目录选择）· **中区引导面在场**（`data-guide="no-project"`——落点 = 对话流挂载根；见本档 §1「批 B 追加注」项 1） |
| 会话控制面（VSC 形 · 会话模型轮 R13） | 条体三件 = 项目钮（`project:open`——恒在场，词面经 `aria-label`）→ 下拉选择器（标签 = 活动会话题；`title` 空 ⇒ 词表缺省词；开合锚 = `aria-expanded` + 下拉 `data-open`；Enter ∕ Space 触发）→ 新建钮（`session:create`）；下拉（开时挂选择器子位）= 账本警示注记首行（`data-ledger-notice` · 非可点）⇒ 条目 ⇒ 空态行（`session.empty`）；**条目** = 标题 + 元数据族（provider · N msgs · updated）+ 位标（码 `running` / `approval` / `done`——渲染面状态源 = `thincoder-desktop/renderer/events.mjs` 置 ∕ 清位；状态栏跨会话告警位同源同词）+ 行内 ✎ ∕ ✕（`>1` 才显 ✕）；活动判据 = 行 `isActive`；**三出口** = 切会话 `session:switch`（点条目 ⇒ 关下拉）· 改名 `session:rename`（✎ ⇒ 条目原位换形：文本控件 + 取消 ∕ 确认两键）· 删除 `session:delete`（✕ ⇒ 内联确认 popover——背板 + 两键 + 默认焦点取消）；**否** `window.prompt` / `window.confirm` / dialog / 超时自动消；**元数据族（对齐重定位批 · D18）** = provider · N msgs · updated（对位 VSC 会话栏——provider = 槽投影 `activeProvider` 补载）；**账本警示注记**（下拉首行 dim 注记 · 非可点——账本可靠批 · 桌面微轮）= 本档 §1「本批注（账本警示面）」；**视觉对齐（D21）**：行面值表 = 本档 §1「本批注（D21 · 视觉对齐）」项 2；**对齐第三批**：末项删除门——本档 §1「本批注（对齐第三批 · 小修族）」P12；单源 = `thincoder-desktop/renderer/views/session-control.mjs` ∕ 挂载与接线 = `thincoder-desktop/renderer/mount-sessions.mjs` |
| 项目级读数 | 复读面 = `thincoder-desktop/renderer/mount-info.mjs`（`ledger:read` + `batch:status` 两读数分键落——一读失败不遮蔽另一读；缺省 cwd = 当前项目；复读两径 = 装配时一次 ∕ 开项目成功链）；**读面消费 = 状态行台账超阈段**（`thincoder-desktop/renderer/views/statusline.mjs`）；**读数缺 ⇒ 零节点**（禁止假造）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注 |
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 输入区控件行出口（`openSettings`——`thincoder-desktop/renderer/mount-composer.mjs:15`；否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——四段闭集不动；**Esc 关闭（对齐第三批 · 重核处置）**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；对位 = VSC Esc 关设置面；向导态不在本项——既有键盘面 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`）与会话控制面选择器（本档「会话控制面」行）两处）；面 = 四段（渠道 / 模型与档位 / agent 参数 / MCP）；**「模型与档位」段档位控件形（批 B 落）** = `select`（选项 = **Auto + off 族 + 逐模型档位枚举**——**off 在场判据 = 核 `thinkOffPath(spec)` 投影**〔判定对象 = 该段当前所选模型；真 ⇒ off 选项在场 · 假 ⇒ 缺席〕；枚举单源 = 核 `reasoningEffortEnum` 投影；**现值 = `provider:list` 行投影 `effort`**（离线——批 B 注项 5）· **表外现值 ⇒ 自成一选项**（不吞）· **现值恒在场（含不可选态）** · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点）；**该段写面 = 全局 config**（`settings:agent`——设置面默认值）；**会话级切换在会话头**（本档「会话头」行）——两面不互相顶替（需求 §3.5 项 5 / 项 6），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——`docs/desktop/design/PROJECT.md` §2 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口）· **外壳降噪（D24）**：同规则带上（结构框归零 + 行升底 + 次级键四值族）——本档 §1「本批注（外壳视觉降噪 · D24）」项 5；**对齐第三批**：类型加工（三控型）/ agent 具名控件 + 即改即存 / Esc 关闭——本档 §1「本批注（对齐第三批 · 小修族）」P14 / P15 / F-Esc |
| 首启向导 | 闸 = `config:read` 回执 `configured` 假 ⇒ 冷启动进向导（已配 ⇒ 跳过）；**容器 = 同设置面**（`[data-slot="settings"]` 单容器——两树互斥 · `configured` 假 ⇒ 向导占槽）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）——**零终端可完成**；**退场 = 清空容器**（主 UI 可用）· **幂等可重入**（中途退出 / 配置仍缺 ⇒ 下次冷启动再进）；**档不可读（畸形）⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读**（错误串直传 · **不静默重置**——`docs/desktop/design/PROJECT.md` §2 KD-12；`data-boot` 保持 `error`）；表单出口**复用设置面导出面**（单一 owner · 零副本）；形态 = 纯描述符树 + 薄挂载（`docs/desktop/design/RENDERER.md` §1.1）；**步界 / 步体闭集**（单源）= `STEPS` 三步闭集（表外值回落步 1——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30`）· `stepBody` 三分支（步 1 / 2 / 其余 ⇒ 目录步——`:84`） （机检豁免——端侧语汇） |
| 主题 | 跟随系统深浅（`nativeTheme`），变量集中在 `styles.css`；**外壳降噪（D24）**：滚动条皮肤（全局 · 零新变量）——本档 §1「本批注（外壳视觉降噪 · D24）」项 4 |
| 键盘可达 | 审批卡三出口可键盘触发（**两形键位**见「审批呈现」行：逐项形 1 / 2 / 3 = once / always / reject，批形 = approveAll / deny / oneByOne）；初始焦点**目标** = **最安全键**（逐项「拒绝」/ 批「全否」——落形 = 标记锚 `data-autofocus="1"`（恰一）；**置焦执行 = 本批落**——帧尾对锚执行 `focus()`：「对齐第三批 · 小修族」F-置焦）；焦点环与 Tab 序显式定义（会话控制面条目控件自然序） |
| i18n | 承产品定性（英文默认面，含 zh）；词表与核 i18n 面同源——**供给面 = `config:read` 语言面下发**（`{ locale, dict }`，核 `projectDictionary` 投影；本端不另立词表源——通道面 = `docs/desktop/design/IPC.md` §2） |
| open | **台账行周期刷新**（VSC `REFRESH_MS`——本批只落开项目链一次；消解路 = 与项目级读数复读面并笔，`thincoder-desktop/renderer/mount-info.mjs`）· **附件条样式**（缩略图 / 移除键尺寸规则未落——现盘零 CSS 规则；见「批 B 注」项 2；处置 = 随附件面族批——出处重核表 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §2）· **池面窄窗态**（右列 36rem 后窗口 < ~1100px 中列受挤——第二断点 ∥ 池面窄态未定；本档 §1「本批注（对齐第二批 · 六件）」项 6） |

**长会话渲染窗口 · 回填与跟滚**两行属实现工艺面 ⇒ 住 `docs/desktop/design/RENDERER.md` §2 / §3（本档不保留其正文）。

**批 B 注（⑤–⑧ 四件 + 设置面档位一件 · 五项 · 形 / 锚 / 候选面 · 2026-09-27）**：本档 §1「会话头」/「对话流」/「输入区」/「状态栏」/「设置面」五行标注「（批 B 落）」的项，落形逐条如下——本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（「会话级偏好注」/「附件注」/「档位控件注」），不在此重述。

1. **会话头三值就地可改**——控形 = `select`（原生控件 · 零框架）；锚 = `data-field` 字段节点内嵌控件（`data-field="provider"` / `"model"` / `"effort"` 三值——工程模式 / AUTO 两位不在本项；两态呈现面单源 = 状态行段（本档 §1「本批注（状态栏对齐 · 屏面为准）」项 2））。
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
   文本面 = **块文本逐字**（不经渲染面解析——真代码块取文面另立控件，= 核档 §4 行 11）；出口 = `navigator.clipboard.writeText`（`app://` 注册为 secure ⇒ 安全上下文成立——`docs/desktop/design/PROJECT.md` §2 KD-2）。
   成功 / 失败**零布局变化**（不引提示条机制）；失败 ⇒ `console.error`（零静默）。
   **真代码块**（围栏切分 · 语法高亮 · 代码块级复制）**随共享渲染核落**（核档 §2 KD-RC-4 / §4 行 1 / 11——实施 R3c）；长文本复制面 = **块级 + 末条**（D13 能力语义的忠实实现——批次档 §1.2 B 裁定）。
5. **设置面档位控件（⑥ · 批 B 设计修订轮）**——「模型与档位」段档位 `select` 的现值 / 候选 / 写 / 回退四事（语义与载荷单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）：
   现值 = 该段当前所选模型（`settings.defaultModel` 复合串**模型段**）的渠道条目投影——取 `provider:list` 行 `effort`（**离线**，零探针）；**表外现值 ⇒ 自成一选项**（不吞 · 零改写；仅设置面——会话头读侧归 `null` ⇒ 无此态）；选项集 = `Auto` + `off`（`thinkOff` 真时在场）+ 逐模型枚举；`defaultModel` 缺 / 模型段空 ⇒ 档位控件**零节点**（禁假造）。
   写 = `settings:agent` 载荷 `{ tier: { provider, model, level } }`；`ok` 真 ⇒ 重取 `provider:list` 刷现值（不整页重挂 · 零乐观写）；`ok` 假 ∥ 抛 ⇒ 控件值回退回执前值 + `console.error`（零静默）。
   边界：本控件 = **渠道条目级默认**；逐模型精确控制 = 会话级档位（本档 §1 批 B 注项 1 /「会话头」行）——两面不互相顶替（需求 §3.5 项 6）。

**批 B 追加注（首启空白态引导 · 四项 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「空态」/「启动态」四行的**首启空白态面**（各行已就地指针）。缺口 = 新装首启（空家 · 无项目）⇒ 对话流 `none` 态无引导节点（零块节点）+ 输入区禁用 ⇒ 界面零引导，真机走查判「完全没法输入」。本注只述端侧形态与锚；语义与通道**单源** = `docs/desktop/design/IPC.md`（本批零新通道 · 零新 IPC）。

1. **引导面（`none` 态）** = 落点 = **对话流挂载根** `[data-slot="flow"]` 自身（无活动会话 ⇒ 根锚 `data-state="none"`）· 节点 = `div.chat-empty[data-guide]`，**流内非块节点**（零 `data-block-id` ⇒ 不入块序 · 块序插入点判据与 `data-blocks` 不变式不受其影响）；`empty` 态 = 首子 · `none` 态 = 根唯一子 · `flow` 态 = 不在场。
   `data-guide` 值域 = **闭集三码**：`no-project`（`cwd` 缺）· `no-session`（有 `cwd` · 无活动会话）· `no-message`（有活动会话 · 零块——即既有空态节点）。判据（纯函数 · 单源）= 对话流模型 `guide` 字段：无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
   承档 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落 · 实读 **54**——沿流内非块节点构树先例 = `thincoder-desktop/renderer/views/chat-copy.mjs`：纯构树 · 零 `store.mjs` import）；`thincoder-desktop/renderer/views/chat.mjs` 只出判据 + 引调（空态节点构树移出 ⇒ 本档不越 300）。
2. **引导面动作控件** = 就地入口（免「去左列找」）——子序 = 文案 → [控件?]；`no-project` ⇒ `button[data-action="project:open"]` 词 = `rail.action.openDir`（既有键）· `no-session` ⇒ `button[data-action="session:create"]` 词 = `rail.action.newSession`（既有键）· `no-message` ⇒ 零控件。
   **在场判据 = 句柄在场**（未给 `onOpenDir` / `onNewSession` ⇒ **整控件缺席**、退纯文案——比接线形通则更严：零假按钮）；接线 = 对话流 handlers 两枚（与左列**同出口** = `project:open` / `session:create` 各单一实现，本面不另写一路）；连带 = 对话流重挂键集须含 `project`（项目变更 ⇒ 中区随动；键名单单源 = `thincoder-desktop/renderer/app.mjs` `CHAT_KEYS`）。
   匹配面提醒：同一 `data-action` **可多处在场**（rail 启动态已有多枚 `project:open`）⇒ 用例 / 选择器须按集合或过滤取值，不得唯一查找。
3. **输入区禁用判据不因引导而变**——`disabled` 判据恒 = **活动会话在场**（无 ⇒ `disabled: true` · 锚恒在）；`no-project` / `no-session` 引导面在场**不解除**禁用。依据 = 需求档首启链（选工作目录 ⇒ 可用 = `docs/desktop/requirements/PROJECT.md` §3.3）；本面作用 = 把「为何不能输入」与「下一步点哪」显式化，**不代行建会话**（建会话仍须经 `session:create` 出口）。
4. **词键（两语各两键 · 共 2 键）** = `chat.guide.noProject` / `chat.guide.noSession`（住 `thincoder-desktop/renderer/i18n.mjs` 对话流段 = `chat.empty.hint` 邻位）。文本形（zh）=「未打开项目——先打开一个项目目录即可开始」/「尚无会话——新建一个会话即可开始对话」；（en）=「No project open — open a folder to start」/「No session yet — create one to start chatting」。
   计数随动（同笔）：总键数 **122 ⇒ 124**（两语相等不变）· 对话流桶 **8 ⇒ 10**——单词表四处同笔为纪律（测试树 2026-09-28 全清重置后承载 = 随批单元证据）。

**本批注（可见面修复 · 五件 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「工具卡」/「审批呈现」/「计划面」/「项目级信息」六行与 §2 项 1 行标注「可见面修复批修」的项（各行已就地指针）。
口径 = **对齐 CLI / VSC 既有语义**（`docs/desktop/requirements/PROJECT.md` §3.5:78 用户原话），不新增功能面；缺陷五条 = 台账 #457–#461；批档 = `docs/batches/2026-09-27-desktop-visible-face-fix.md`。本注只述端侧形态与锚；裁决与理由 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-24。

1. **输入区样式（#457）**——落点 = `thincoder-desktop/renderer/chat.css`（**既有档 · 不新立档**：五类 + 两附属行增量 ≲45 行，该档 254 ⇒ 保持 ≲300；分档理由 = `docs/desktop/design/PROJECT.md` §4.1 分档先例句〔`styles.css` 实读 284 贴 300 层〕）。
   形（沿既有控件单形 = `.question-input` / `.chat-backfill` / `.approval-action` 家族，零新样式体系）：根 `.composer` = 单行 flex（`flex-wrap: wrap` · `gap: 8px` · `padding: 10px 12px` · 顶线 `1px solid transparent`（**D24 归零** · 保位——见本档 §1「本批注（外壳视觉降噪 · D24）」项 1）——与 `.session-head` 底边线同语）；
   输入框 `.composer-input` = `flex: 1`（**撑满中区余宽**）+ `min-width: 0`（**可缩**——窄窗不撑破栅格）+ `min-height` + 原生 `resize: vertical` + 既有文本控件面（边框 / 圆角 / `--bg` 底 / `font: inherit`）；
   控件三枚（`.composer-interrupt` · `.chat-copy-block` · `.chat-copy-last`）= 同一控件单形（圆角 / `font: inherit` / `:not(:disabled)` 手型——**未接线 `disabled` 与可点态同形**沿既有律；**静息描边 / hover / 按下 / 聚焦四态见**本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2）；
   字形面：两复制控件**零文本子**（词面住 `aria-label`——既有）⇒ 字形住 CSS `content`（`.chat-copy-block::before` / `.chat-copy-last::before` = `"⧉"`——沿「视图档零字形字面」律）；
   提示行（`.composer-notice`）与附件条（`.composer-attachments`）= **整行**（`flex: 1 1 100%`）；附件条**内部**（缩略图 / 移除键尺寸）仍 open（沿 open 行既有登记）。
   判据（机检）：五选择器在该档各 ≥1 条规则（文本级）；真机 = 输入框宽撑满中区余宽 ∧ 三控件非空形态（**静息无描边**〔D24 归零——见本档 §1「本批注（外壳视觉降噪 · D24）」项 1〕+ 有可见字形 / 词——如 Stop 词、复制面 `⧉`）。
2. **用户块出泡（#458）**——出泡时刻 = `msg:send` 回执 `ok` 真（**受理即出**——裁决 / 理由 / 边界 = `docs/desktop/design/PROJECT.md` §2 KD-23）；活流块形 = `{ kind: "user", text }`（**与回放块形同形**——无 `id` / 无 `status`）；文本 = 提交文本逐字；
   写者 = 输入区挂载档（`thincoder-desktop/renderer/mount-composer.mjs`）两径同源（直发 ∕ 排队消费回执——「回合中插入」批收正：原回合尾 flush 退场；单源 = `docs/desktop/design/PROJECT.md` §2 KD-40）；**键门** = 回执键 = 现刻 `activeSession`（非活动 ⇒ 零写；
   **在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场——页读 `loadSlotFile` = `thincoder-desktop/src/main/session-slots.mjs:123` / `:145` · 槽落盘在回合尾 = `thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）。
   入队径（忙态）：**入队即出泡 + 待发送气泡（待发送标记）**——单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 2。
   判据（机检）：`ok` 真 ∧ 键 = 活动会话 ⇒ `blocks` 尾块 = `{ kind: "user", text }`（恰一块）；键 ≠ 活动会话 ⇒ **零写** · `blocks` 引用不变；`ok` 假 ∥ 抛 ⇒ `blocks` 引用不变；树面 = `div.block[data-block-kind="user"]`；真机 = 发送后流内**尾块（= 本回合首个块）**为该用户块（文本逐字）。
   边界：非视觉降级径 ⇒ 入会话文本 = 提交文本 + 说明行（主进程 `appendLine` 附）——活流显示键入串（三端同义：VSC `addUser(ctx, text)` = 键入串），回放含该行；消解路 = 回执携入会话文本（须动 IPC 回执形——另裁）。
3. **流式游标清点（#459）**——游标语义 = **末块追加态**（`thincoder-desktop/renderer/chat.css` 自注）；清点两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`——判据单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）② **段界**（`ev:tool-call` 入场 ⇒ 助手文本段收束——裁决 = `docs/desktop/design/PROJECT.md` §2 KD-24）；
   清点落点 = 归约面块面（`thincoder-desktop/renderer/events.mjs`）。
   判据（机检）：带 `streaming` 尾块之态 + 三径任一 ⇒ 归约态零 `streaming` 真项；`ev:tool-call` ⇒ 前序助手段同零；真机 = 回合尾后流内零 `[data-streaming="1"]` 节点（锚摘除——经块面引用变更触发帧，条单源 = `docs/desktop/design/RENDERER.md` §1.1 流式游标清点条）。
4. **文本段间隔（#460）**——通则 = 行内 ≥2 文本段者**逐段包元素**（`span[data-seg="<段码>"]`），段缺席 ⇒ **零节点**（空段仍占 flex 项 = 假间隔）；禁裸串直作 flex 行子（相邻文本节点合为单一匿名项 ⇒ `gap` / `space-between` 静默失效——通则详述 = `docs/desktop/design/RENDERER.md` §1.1）。
   逐处（四处同取「逐段包元素」；被否候选 = 改分隔形，逐处理由如下）：
   · **工具卡头行**（`thincoder-desktop/renderer/views/chat-tool.mjs` `toolHead`）段码 = `name` / `args` / `status` / `time`——四段各有独立语义且各有缺省跳空判据；拼单串须自造分隔符字面（违「零构造」）且四段读数不可分。
   · **池条目标签行**（`thincoder-desktop/renderer/views/activity.mjs` `labelNode`）段码 = `title` / `status`——「两片皆缺 ⇒ 空行」判据以段为单位；拼串会把状态词的独立读面并掉。
   · **审批卡首行**（`thincoder-desktop/renderer/views/approval.mjs` `headNode`）段码 = 逐项形 `name` / `args` / `status`，批形 `count` / 逐工具名 `name`——批形段集**不定长** ⇒ 拼串必自造分隔符（既有注明写「零分隔符字面——间距归 `chat.css`」）。
   · **计划行**（`thincoder-desktop/renderer/views/plan.mjs` `rowNode`）段码 = `title` / `status`——该行 `justify-content: space-between` 的语义即两段对置，裸文本子下**数学上不可达**（单一匿名项）⇒ 不改则既有 CSS 规则恒死。
   判据（二分）：① 自动面（平 node）= 四处子节点全为 `[data-seg]` 元素 ∧ 段数 = 在场段数 ∧ 缺席段零节点；② 真机 = 四处相邻 `[data-seg]` 元素 rect 间隔 > 0（Range 读 x——沿项 1 同类测量记法）。
5. **信息行复读触发（#461）**——触发点 = 开项目成功链（`thincoder-desktop/renderer/app.mjs` `openDir`）：`project:open` 回执到 ⇒ `await refreshRail()` **之后**补一步复读；句柄 = 设置面挂载档（`thincoder-desktop/renderer/mount-settings.mjs`）把 `refreshInfo` 一并出（沿 `paintInfo` 同面导出面）；向导步 3 现有调用保留（幂等——同一 handle；判据不缩水）。
   判据（机检）：开项目后 `[data-slot="info"]` 不再是启动期 `no-project` 失败串（`data-state` ≠ `error` ∧ 读数节点 / 相位节点在场——有读数即刷）；真无读数面（读通道失败）⇒ 失败串 = 该读 reason（非 `no-project`——既有失败面不变）。

**本批注（对齐重定位 · 四项 · 2026-09-27）**：本注补本档 §1「状态栏」/「对话流」/「左列会话行」/§2 项 1 四行的对齐重定位（用户 2026-09-27 20:45 走查三点 + 20:48 共用口径改判；批档 = `docs/batches/2026-09-27-desktop-ui-alignment.md`）。核面（落点 / 加载形 / 边界 / 两表）单源 = `docs/render-core/design/RENDER-CORE.md`——本注不重述。

1. **状态行 15 段逐项裁定表（D17 · 零静默省略）**——CLI 段集 = `thincoder-cli/src/tui/render-frame.mjs:344` 起（`buildStatusLine`）+ banner（`:221-225`）+ 注意力 chip（`:229-230`）+ 键位组（`:427` 尾段）。裁定三值：**承载**（桌面状态行落节点）· **旁置**（同义判据住他处——点名落点）· **不适用**（本端无该面——给理由）。**2026-09-28 屏面为准重审** = 16 段定形（§1「本批注（状态栏对齐 · 屏面为准）」）。
   表列序 = **逐项裁定序**（本表枚举面——非段序；段序单源 = `STATUS_SEGMENTS`，判据句 = 同注项 1）。

| # | CLI 段 | 裁定 | 桌面落点 / 数据源（已有切片 vs 缺入站面） |
|---|---|---|---|
| 1 | banner（PLAN / AUTO / ADVISOR / ENG 四段） | 承载 | 状态行行首四段（本注项 2——段锚 `plan` / `auto` / `advisor` / `eng`）；源 = `flags` 投影（**活值优先口径**——在场直读活态 · 不在场槽投影（单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」）；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:221-225`）；真 ⇒ 在场 · 假 / 缺 ⇒ 零节点；**会话头回三值**（撤 `engineering` / `autoApprove` 两显示位） |
| 2 | 注意力 chip（⚠ 等待审批 / 等待回答 / 等待输入） | 承载 | blocked = 活动键位标含 `approval` 码（审批 / 提问两门同码——既有切片 `tabBadges`）；awaiting = 旁置（完成位标 + 输入区可用为同义判据） |
| 3 | 状态文本 | 承载 | **态机四支（优先序 = ① > ② > ③ > ④；单源 = 本格）**：① **挂起句支（第三态）**——挂起窗在场（`susp[<会话键>].active` 真）⇒ 段文 = 挂起句（三键按 N/M 条件组装：N = `running + queued`（`susp.running`）· M = `pending + done`（`susp.digesting`）；取词链 = N > 0 ⇒ `susp.running`〔M > 0 ⇒ 附 `susp.digesting`〕· N = 0 ∧ M > 0 ⇒ `susp.digesting` · N = 0 ∧ M = 0 ⇒ `susp.winding`；值 zh = CLI 逐字 ∥ en = VSC 逐字；对位实读 = `thincoder-vscode/webview/status-bar.js:51-61`；词键 / 值单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；② **零节点支**——位标含 `approval` ∧ 位标不含 `running` ⇒ **段零节点**（承载 = 注意力 chip——不重复；承实施座推导 + 父侧确认）；③ 忙（位标含 `running`）⇒ **运行中**；④ 其余 ⇒ **就绪**（词键 `status.ready`——词形来源 = CLI 静息值 `Ready`，`thincoder-cli/src/tui/tui-state.mjs:43` 实读；2026-09-28 重审判定入状态词闭枚举——本档「状态词」行）。**交叠角落**（`approval` ∧ ¬`running` ∧ 挂起窗在场）⇒ 取①（chip 照常承载审批——两事实不同面，零重复；零节点律 = 无窗时回落）；源 = 位标切片 + `susp` 切片 |
| 4 | 当前工具 | 承载 | 源 = 块面末位 `kind === "tool" ∧ status === "running"` 的 `name`（已有切片 `blocks`——零新通道） |
| 5 | 耗时 | 承载 | 源 = 归约面会话键「回合起刻」`turnStarts[key]`（**已落（R3a）**——回合起 = `ev:activity` `turn` 首帧现刻，`thincoder-desktop/renderer/events.mjs:316`） |
| 6 | 任务计数（✓n/m） | 承载 | 源 = `tasks[key]` 切片（已有——与计划卡同源） |
| 7 | 回合 N/M | 承载 | 源 = `ev:activity` `turn` 载荷 `{ n, max }`（**已落（R3a）**——归约槽 `turns[key]`，`thincoder-desktop/renderer/events.mjs:314`） |
| 8 | 令牌（↑↓ ✦ hit%） | 承载 | 源 = 核 `onUsage` 回调（`thincoder-core/agent.mjs:353`）⇒ `ev:usage` 载荷 `tokens`（**已落（R3a）**——`thincoder-desktop/src/main/agent-host.mjs:176`；CLI 同源映射 = `thincoder-cli/src/tui/tool-events.mjs:400-405`） |
| 9 | 上下文 % | 承载 | 源 = `usage[key]` 切片（**已落**——D15 / KD-20） |
| 10 | 滚动位（scrolled N） | 旁置 | 滚动反馈 = 药丸 / 摘要块（判据单源 = `docs/desktop/design/RENDERER.md` §3）——**重审④坐实**（本注项 5）：偏离底部 ⇒ 药丸在场（同信息）；行数读数（HTML 渲染行 ≠ 终端行）无对位物 ⇒ 不搬；观感复核 = 真机对照（T-DSK39） |
| 11 | 台账标记 | 承载 | 源 = `projectInfo` 切片（`ledger:read` 回执 `thresholdReached`——**已落**）；**只承超阈警示位**，计数仍住左列信息行（不重复读数） |
| 12 | 计时（⏰N） | 承载 | 源 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:84`）⇒ `ev:usage` 载荷 `timers`（**已落（R3a）**——`thincoder-desktop/src/main/agent-host.mjs:176`；刷新点 = 回合尾——新鲜度窗登记 = `docs/render-core/design/RENDER-CORE.md` §10 F 行）；触发落流 = `ev:timer`（timer-wake 阶段 2——`docs/desktop/design/IPC.md` §1） |
| 13 | 会话标题 | 承载 | 源 = 活动会话标题（与标签条 / 左列同源——号出 `sessions:list` 行） |
| 14 | 输入提示段（Enter: send / Enter 排队 / 已排队 N 条） | 承载 | **三态**：静（非忙）⇒ `Enter: send`（词键 `status.enter.send`——对位 CLI enterHint 静息值，本注项 4）；忙 ∧ 队空 ⇒ Enter 排队句；队 ≥ 1 ⇒ 条数句；源 = **本会话队快照镜面**（`pending[<会话键>]`——写者 = `ev:queue` 归约，权威 = 宿主队列；「回合中插入」批收正：原「渲染面本地队」改镜面——分键既往） |
| 15 | 键位组（`/:` 命令 · wheel/PgUp/PgDn · Ctrl+I · Ctrl+C） | 不适用 | **逐件重审（本注项 4）**：`/:` = 需求 §3.5 边界（用户 2026-09-26 裁定「不是必须项」）；wheel/PgUp/PgDn = 原生滚动条 + 滚轮自述（无键位提示面）；Ctrl+I = 本端无 inject 功能（如需 = 新需求）；Ctrl+C = 退出住窗口级（本端该键属复制——同键异义，不照搬） |

计数（D3 · 2026-09-28 重审后）：**承载 16 段**（1 的四态 = 4 段；2–9 · 11–14 = 12 段）· **旁置 1 段**（10）· **不适用 1 行**（15 行内四件）；承载四项（耗时 / 令牌 / 计时 / 回合 N/M）**已落（R3a）**——读数槽四（`turnStarts` / `tokens` / `timers` / `turns`）住 `thincoder-desktop/renderer/events.mjs`；
  载荷面 = `ev:usage` 两键扩 + `ev:activity` `turn`（单源 = `docs/desktop/design/IPC.md` §1）；段闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`（16 码）。

2. **右列 = 子 agent 面板（D20）**——语义重定位：活动块族 = **子 agent 实例**（射程五类 = sync spawn / async 池 / consult / escalate / advisor-async——VSC 对位 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）；**工具调用行摘除**（工具调用面 = 对话流工具卡，VSC 同义）。
   块形 = 头（role · model · 用时 · 回合 N/M）+ 状态词（出本档闭枚举）+ 停止钮（`data-action="subagent:stop"`）；**内容回显**：块面 = 核件同款（头行 + 状态词 + **内容 tail-3 + 展开**——`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` 直消费；单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 3）。
   态机 = **出生**（`started` / `queued`）→ **终态折叠**（`done` / `settled` / `cancelled` ⇒ 就地收敛为终态词 + 用时；`⟦ev⟧stopped` ⇒ `cancelled`（先例兼容）· `error` 不在 relay 谱——闭集与 token 全表 = `docs/render-core/design/RENDER-CORE.md` §5）
   → **归档 = 入流**（普通终态即时归档 ∥ `settled` 驻留待消化后归档 ∥ 旧代接管即归档——流内尾追块；单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）。
   **数据链 = 宿主 relay 分流 + 存活投影 2s 再断言**（出生自愈——只发在飞实例：丢首发出生 ⇒ 一拍（2s）内块复现 · 终态出表 ⇒ 零再断言不复活；会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清——旧会话块不随拍重投，沿 `thincoder-vscode/src/extension/panel-session.mjs:123-126` 清点语义）。
   族序与折叠（待审批 → 子 agent → 队列 · 折叠头两读数）沿 §2 项 1 存量口径；通道面 = `docs/desktop/design/IPC.md` §1 `ev:subagent` / §2 `subagent:stop`。

3. **会话流经共享渲染核（D19 · 含改判）**——文本面经核 Markdown 呈现（**「零 Markdown」口径改判**：理由 = 用户走查第 3 点 + D19；被否 = 保留纯文本 / 自写第二份 md / 助手块单侧渲染——裁决 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-4**）。
   真代码块（围栏切分 / 语法高亮 / 代码块复制）随核落（原「另裁」登记 = `docs/desktop/design/PROJECT.md` §10 Y，本批已裁）；**推理块** = 新接线（核回调 `onReasoning` + 活流推理块——块型 `reasoning` 已在**页读域五型**内；壳 = 核件结构同形）；**文件链接承载**（「对齐第三批」D19 收正——宿主验存链 + 核包裹 + `file:open`；单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39**）；
   块容器 / 工具卡 / 卡族（审批 / 提问 / 计划）**桌面外壳留存**（三锚 / 滚动 · 回填 · 裁剪 / 卡壳四段头 · 耗时 · 改动摘要不动）——「会话流经核」= **渲染逻辑单源**（核件分件消费：`md` / `attachCopyButtons` / `renderReasoning`〔结构同形〕/ `capText`），否「整件替换核 DOM」（逐机制对位表 22 行 = 核档 §4）。

4. **会话面板元数据族（D18 · 对齐 VSC 会话栏）**——对位面 = `thincoder-vscode/webview/session-bar.js:40-41`（行元数据 = `provider · N msgs · updated`）；桌面落形 = 左列会话行元数据族**三值**：
   provider（槽投影 `activeProvider`——核 `listSlots` 条目 `thincoder-core/session-slots.mjs:212`；端壳投影 `thincoder-desktop/src/main/sessions.mjs:14-16` 现不载 ⇒ **补载一行**）· `messageCount`（已载）· `updatedAt`（已载）。
   交互对位 = 点选 / 改名 / 删除（桌面行内换形**已在册**——本注不改形）；**多标签结构不削**（本端结构差异保留）；更新时间显示形 = 本地化短日期（沿 VSC `fmtDate`）。

**本批注（D21 · 会话流 / 会话面板视觉对齐 · 两项 · 2026-09-28）**：本注补本档 §1「对话流」/「左列会话行」两行的**视觉对齐**（用户 2026-09-28 04:42 桌面走查：①「样式与 VSC 区别很大」②「桌面端的会话面板与 vsc 端完全不同，我之前要求过对齐的」⇒ 裁定向 VSC 靠拢；批档 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` · 需求 §4 **D21**）。
**结构零动**——左列 + 标签条 + 行内换形 / 元数据族 / 行控件三面皆沿在册（需求 D18「本端结构差异不削」）；本注只述视觉值面与边界，**值表分处单源**（内容面 = 核档 §5；会话面板面 = 下项 2）。

1. **内容面视觉（核产出件）**——落点 = `thincoder-desktop/renderer/core.css`（核类名 → 桌面值）+ 值变量 = 主题表 `thincoder-desktop/renderer/styles.css`；**逐面映射表 21 面 / 内容面新增变量 12 个 / 端差 2 项 = `docs/render-core/design/RENDER-CORE.md` §5 / §9**（本档不重述值面）。
   边界：**外壳零动**——块壳 / 卡族 / 会话头 / 标签条 / 池 / 输入区 / 状态行（`thincoder-desktop/renderer/chat.css` · 同档 `styles.css` 外壳段 · `thincoder-desktop/renderer/pool.css` · `thincoder-desktop/renderer/settings.css`）零规则改动；推理块**壳层**（边框 / 底色 / 圆角 / 斜体 muted）沿 `.block-reasoning`；VSC 侧 `thincoder-vscode/webview/**` 零改（值源）。
   验收 = 逐面真机比对（走查面 = T-DSK21）+ 值面机检两处（值落点锁 ∕ 真 Electron computed style 读数——测试树 2026-09-28 全清重置后承载 = 随批单元证据；真机面 = 人工走查 + 父侧真跑闭合）。
2. **会话面板视觉（桌面左列会话列表 · 端壳面）**——对位 = VSC 会话列表（`.session-item` 族；值源 = `thincoder-vscode/webview/session.css` / `thincoder-vscode/webview/session-bar.js`）；落点 = `thincoder-desktop/renderer/styles.css` 左列段（`.rail-*`）；**结构零动**（标签条无 VSC 对应 ⇒ 不追）。

| # | 面 | VSC 实值（file:line） | 桌面落法（复用变量 ∥ 新增变量 ∥ 直接值） |
|---|---|---|---|
| 1 | 行容器（内边距 / 间距 / 分隔） | `thincoder-vscode/webview/session.css:61-71`（`padding: 8px 10px` · `gap: 8px` · `border-bottom: 1px solid var(--border)` · `:last-child` 无线） | `.rail-row`：`padding: 6px 8px ⇒ 8px 10px` · `gap: 8px`（既有）· 新增 `border-bottom: 1px solid var(--line)`（**复用**）+ `:last-child { border-bottom: none }` |
| 2 | 行 hover 底色 | `thincoder-vscode/webview/session.css:73-75`（`background: var(--hover-bg)`） | `.rail-row:not(:disabled):hover { background: var(--hover-bg) }`（**新增变量**——现值 `var(--bg)`） |
| 3 | 活动行态 | `thincoder-vscode/webview/session.css:77-83`（`background: color-mix(in srgb, var(--accent) 10%, transparent)`；活动行标题 `color: var(--accent)`） | `.rail-row[data-active="1"]`：`border-color: var(--accent) ⇒ background: color-mix(in srgb, var(--accent) 10%, transparent)`；`.rail-row[data-active="1"] .rail-row-title { color: var(--accent) }`（**直接值**） |
| 4 | 行标题 | `thincoder-vscode/webview/session.css:85-93`（`font-size: 13px` · `font-weight: 500` · 省略三件） | `.rail-row-title { font-size: 13px; font-weight: 500 }`（省略三件既有 · **直接值**） |
| 5 | 元数据族 | `thincoder-vscode/webview/session.css:95-100`（`font-size: 11px` · `color: var(--fg)` · `opacity: 0.4`）；串形 = `thincoder-vscode/webview/session-bar.js:41`（`provider · Nmsgs · updated`） | `.rail-row-meta { font-size: 12px ⇒ 11px; color: var(--fg-muted) ⇒ var(--fg); opacity: 0.4 }`；**分隔符机制差保留**（桌面 `[data-seg] + [data-seg]::before { content: "· " }` ≡ VSC 串内 ` · `——观感同） |
| 6 | 行内动作钮（改名 / 删除） | `thincoder-vscode/webview/session.css:102-151`（`22px` 方 · `border-radius: 4px` · `font-size: 12px` · 静息 `opacity: 0` · 行 hover ⇒ `0.5` · 自身 hover ⇒ `1` + 底色〔改名 = `--hover-bg-strong` + `--accent` ∥ 删除 = `--diff-del-bg` + `--error-fg`〕） | `.rail-rename` / `.rail-delete`：`width: 22px; height: 22px; padding: 0; border-radius: 4px; font-size: 12px` + 静息 `opacity: 0` · `.rail-row:hover … { opacity: 0.5 }` · 自身 `:hover { opacity: 1 }` + 底色 / 色值照落（**新增变量 2**：`--diff-del-bg` · `--error-fg`；`--hover-bg-strong` 与内容面共用）+ **本端加一臂** `:focus-visible { opacity: 1 }`（键盘可达——端差登记 = 核档 §9） |
| 7 | 字形面（两钮） | `thincoder-vscode/webview/session-bar.js:42` / `:44`（`✎` / `✕` 元素文本） | `.rail-rename::before { content: "✎" }`（既有）· `.rail-delete::before { content: "×" ⇒ "✕" }`（**字形仍住样式档**——「视图档零字形字面」律不变；标签条关闭控件的 `×` 不在本面射程 · 零动） |
| 8 | 空态行 | `thincoder-vscode/webview/session-bar.js:65-70`（空项 `opacity: 0.5`） | 左列空态 = `.rail-hint`（`--fg-muted`——观感等价）⇒ **不改**（登记） |
| 9 | 行聚焦（键盘） | VSC 实有 `.session-item:focus-visible`（`thincoder-vscode/webview/base.css:449-457`：`outline: 2px solid var(--accent); outline-offset: -2px; background: var(--hover-bg-strong)`） | 桌面 `.rail-row:focus-visible` **照落同三值** |

**计数（D3）**：**9 面**（1–9 = 行容器 ∥ 行 hover ∥ 活动行态 ∥ 行标题 ∥ 元数据族 ∥ 行内动作钮 ∥ 字形面 ∥ 空态行 ∥ 行聚焦）；本面新增变量 **2**（`--diff-del-bg` · `--error-fg`；与内容面共用者不重复计）；**桌面新增变量合计 = 14**（内容面 12 + 本面 2）。

**不追面（零对应 / 结构差异 · 逐条理由）**：① **面板容器皮肤**——VSC = 浮层 dropdown（`thincoder-vscode/webview/session.css:46-59`：`--shadow` / `max-height: 280px`）；桌面 = 三列布局的左列卡片（`--bg-raised` / `--line` / `--radius` 在册）⇒ 位置与形态不同面（需求 §2 定位）· 不改；
② **会话选择器 / 下拉交互**（`#session-selector` / `#session-dropdown` / `#session-bar`——`thincoder-vscode/webview/session.css:3-28`）——桌面无「点开下拉」形态（列表常显 + 标签条）⇒ 零对应；
③ **`#project-btn`（多根切换钮）**（`thincoder-vscode/webview/session.css:179-206`）——桌面单项目模型（需求 §2「项目模型」行）⇒ 不适用；
④ **`#new-session-btn`**（`thincoder-vscode/webview/session.css:153-176`）——桌面新建入口 = 左列空态入口 + 标签条 `+`（标签条 = 端结构差异 ⇒ 零动）；
⑤ **`.dropdown-section`**（`thincoder-vscode/webview/session.css:208-215`）——VSC 会话列表不发射该节点（仅 `thincoder-vscode/webview/model-picker.js:73` 消费）；桌面区标题（`.rail-title`）无对位 ⇒ 零动；
⑥ **行内换形三件**（`.rail-rename-input` / `.rail-cancel` / `.rail-confirm`）——VSC 的改名走宿主输入框 / 删除走浮层（`thincoder-vscode/webview/session-bar.js:75-107`）⇒ 形态不追（桌面行内换形已在册 · 本批零动）；
⑦ **`.rail-origin`（来源端标）· `.rail-control`（打开目录 / 最近项）**——本端独有（D2 / D1 面）⇒ 保留零动。

**本批注（D17 / D19 · 残余补齐 · 两项 · 2026-09-28）**：本注补本档 §1「状态栏」/「对话流」两行的**恢复态播种**与**用户块 md 深度**（两行已就地指针）。来源 = 需求 §4 D17 / D19 补句（`docs/desktop/requirements/PROJECT.md:146` / `:148`）；批档 = `docs/batches/2026-09-28-desktop-residuals.md`。
本注只述端侧形态与判据面；语义 / 契约单源 = `docs/core/design/SESSION.md` §6.24；载荷 / 在场 / 消费 / 降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」；**播种面裁定（读数切片段——2026-09-28 重审后 12 段；banner 四段 = 非 seed 面，供面 = `flags`——每次页读皆携）单源 = 本注项 1**（IPC 注留一行指针，不重述）。

1. **状态行恢复态播种（D17 · 台账 #479）**——打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（恢复态与 CLI 同见；CLI 对位语义 = `agent.tasks = data.tasks ?? []` 水合）：
   - 触发点 = `openPage`（`thincoder-desktop/renderer/mount-sessions.mjs` 私有）——三路开标签同一路（`session:resume` / `session:switch` / `session:create`）+ 关标签邻位接管 + 左列点行 / 标签激活皆经此；不另立第二触发。
   - 载波 = `history:page` 回执新键 `seed = { tasks, usage? }`——**仅首屏读**（`before == null`）在场；回填读不携（防回填以盘上旧值覆盖活切片）；**时序**：本键在飞（回合未尾）⇒ 首屏种不落；**播种只填空白**：**切片键已在场（无论来源）⇒ 零写**（闭合回合尾窗口——实现读法 = 键在场即零写，限定词注销）；形态 / 缺席降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」。
   - 落点 = 渲染面 `applyPage` 首屏支（`thincoder-desktop/renderer/events.mjs`）——同笔写 `tasks[key]` / `usage[key]` 两切片（与 `meta` 同一写点）；缺席 / 形不合 ⇒ 该槽**零写**（零节点——禁假造）；订阅键面零改（`STATUS_KEYS` 已含两键 ⇒ 帧随切片变自动重挂）。
   - **播种 2 段**：6 `tasks` = 槽数据直取（非数组 ⇒ `[]`）· 9 `context`（`usage`）= 核 `sessionReading` 打开态读数（数字 ∧ `> 0` 才落——同 `ev:usage` 有效门）。
   - **不播种 10 段（逐段理由）**：8 `tokens`（#475 链回合尾帧专属 · 打开态无累计源）· 12 `timer`（核 `_pendingTimers` 活读 = 进程态）· 5 `elapsed` / 7 `turn`（回合域——无在飞回合本应缺席）· 2 `attention` / 3 状态词（位标进程态）；
     4 `tool`（块面末位 running——页读整置后为零 = 真态）· 11 `ledger`（项目级——开项目链复读已落 #461）· 13 `title`（`sessions` 切片随 `refreshRail` 刷）· 14 输入提示（进程态）。
   - 缺席降级：槽不可读 ⇒ 回执 `{ ok:false }`（零播种——既有失败面不变）；配置不可读 / 读数不可算 ⇒ `usage` 键缺席 + `console.error`（零静默）；`percent ≤ 0` ⇒ 键缺席（同 `ev:usage` 有效门）。
   - 连带（有意）：`tasks[key]` 两消费面同源（状态行段 6 + 计划卡）——恢复态两者随亮；如须卡片不出 ⇒ 另裁（劈切片——不在本批）。
   - **模式四位（本批增 · 非 seed 面）**：行 1 四段由 `flags` 投影供给（`history:page` 回执键——**活值优先**：agent 在场 ⇒ 活值四布尔；不在场 ⇒ 槽字段投影（与 D17 `seed` 同源同形）；槽亦读不出 ⇒ 键缺席（该槽零写）；**每次页读皆携**——回填读同在场，与 `seed` 的首屏限定异）——与读数面异路（形态 / 在场 / 落点单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」）。
   - 核侧单源 = `sessionReading(data, { providers, fallback })`（`thincoder-core/session-lifecycle.mjs`；`thincoder-core/session.mjs` re-export 随动）——与 `applySession` 后读数**同源同式**；契约 = `docs/core/design/SESSION.md` §6.24。

2. **用户块 md 深度（D19 · 台账 #480）**——用户消息块 markdown 深度按 VSC 口径统一（核件 `mdInline`；助手块 = 全量 `md` 不变）：
   - 实现面 = **端侧渲染分流**：`thincoder-desktop/renderer/views/chat-text.mjs` `textFace` 按 `block.kind` 分流——`user` ⇒ `mdInline`；`assistant` / `reasoning` / `error` ⇒ `md`（全量——零回归）。
   - `mdInline` 与 `md` 同模块导出（`/rc/md.mjs`）⇒ 零新模块边（守卫闭包零改）；口径标尺 = 核件 `thincoder-render-core/flow/block.mjs:87`（user = `mdInline`）∥ `:100`（assistant = `md`）——核件 / VSC 侧零改。
   - `[data-raw]` 原文逐字锚不变（复制面零回归）；边界（登记）= 就地更新径（`patchTextBlock` → 核件 `paintStreamTarget` 恒 `md`）对 `user` 块**不触发**（块引用恒定 ⇒ `patch` 档不入）——若未来出现 user 尾块重渲径，深度分流须同判。
   - 判据（机检）：user 块块级构件零节点（围栏 / 标题）∥ assistant 同文本块级在场（对拍有牙）——用例面 = 随批单元证据 + T-DSK38（单源 = `docs/desktop/design/PROJECT.md` §7 残余批注）。

**本批注（状态栏对齐 · 屏面为准 · 2026-09-28）**：本注补本档 §1「状态栏」/「会话头」两行的**屏面为准重审定形**（两行已就地指针；批档 = `docs/batches/2026-09-28-statusline-align.md` · 台账 #483 · 需求 §4 **D22**）。
标尺 = **屏面**（用户 2026-09-28 05:38 裁定：「对齐」以屏面可见行为准；「旁置 / 不适用 / 缺入站面」等账面打折项逐项重审，不得静默打折）——四项重审逐项给裁定 + 判据句；15 段表（上注项 1）已就地收正为 **16 段**。

1. **打开态段集 = 16 段**（闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`）：段序 = CLI 段序——判据句 = 实读 `thincoder-cli/src/tui/render-frame.mjs`：注意力 chip 行首（`:229-230`）→ banner 四态（`:221-225`，PLAN → AUTO → ADVISOR → ENG）→ 状态段簇（`:427`）。
   状态段簇内序 = 状态词 → 工具 → 耗时 → 任务 → 回合 → 令牌 → 上下文 → [滚动位] → 台账 → 计时 → 标题 → 输入提示。
   `STATUS_SEGMENTS` 序 = 本序（滚动位 / 键位组除外）；**15 段表表列序 = 逐项裁定序**（表枚举面——与段序分属两面；同注项 1 表头）。
   打开态（静息 · 有活动会话）可亮 = `plan` / `auto` / `advisor` / `eng`（真态时）+ `state`（就绪）+ `tasks` + `context` + `ledger`（超阈时）+ `title` + `enter`——与 CLI 打开态逐段对位（差表 = 批档 §2）；段锚 = `data-seg`（值域 = 闭集 16 码）；banner 四段词 = 代号字面（两语同形；词键 `status.banner.*`）。
2. **重审② banner（裁定 = 四态上状态行行首）**——实读钉定：「PLAN / ADVISOR 本端无该两态」旧裁定**不实**（两态随会话槽恢复可在本端为真：`thincoder-core/session-lifecycle.mjs:115` `planMode` / `:124-127` `engineering` / `:132-134` `advisor`）；
   四态判定 = **活值优先口径**（agent 在场 ⇒ 活值直读；不在场 ⇒ 槽字段投影——单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 3；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:221-225`）：`planMode` ∨ `autoApprove` ∨ `advisor.guard === true` ∨ `agent.engineering === true`——真 ⇒ 该段在场 · 假 / 缺 ⇒ 零节点（负向锁）。
   供面 = `history:page` 回执新键 `flags`（四布尔——**活值优先**：agent 在场 ⇒ 活值直读；不在场 ⇒ 槽字段投影（与 D17 `seed` 同源同形）；槽亦读不出 ⇒ 键缺席（该槽零写）——「禁假造」边界收窄至此）；消费 = 渲染面切片（`sessionFlags`）→ 状态行四段；**会话头回三值**（撤 `engineering` / `autoApprove` 两显示位——「同一事实一处」不破：两态只住状态行一处，CLI 同理）；形态 / 在场 / 落点单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」。
3. **重审① 静息状态词（裁定 = 补）**——CLI 静息值实读 = `Ready`（`thincoder-cli/src/tui/tui-state.mjs:43`；回合尾回 `Ready` = `thincoder-cli/src/tui/agent-turn.mjs:301`）；处理 = 表行 3 两态词：位标含 `running` ⇒ 运行中（既有）· 位标集 ∩ {`running`, `approval`} = ∅ ⇒ **就绪**（词键 `status.ready`）——打开态（静息）恒在场。
   **零节点支**（`approval` 在挂 ∧ 回合非忙）⇒ **段零节点**（承载 = 注意力 chip——承实施座推导 + 父侧确认；与挂起句支的互斥序 / 完整态机 = 表行 3 单源）。
   **就绪入状态词闭枚举**（6 词 ⇒ 7 词——词形来源单列 = CLI 静息值 `Ready`；核 i18n 无同源词 ⇒ 例外注明 = 本档「状态词」行 / §3 借用项 9）。
4. **重审③ 键位尾（逐件）**——`Enter: send`（CLI enterHint 静息值）⇒ **补**：表行 14 三态（静 ⇒ `Enter: send` · 忙 ∧ 队空 ⇒ 排队句 · 队 ≥ 1 ⇒ 条数句）；**其余四件维持不适用**（逐件理由 = 表行 15）——用户 2026-09-26 裁定只覆盖 `/:` 件，其余四件本端无对位面（非静默打折——给理由）。
5. **重审④ 滚动位（裁定 = 维持旁置）**——偏离底部（`!following`）⇒ 药丸在场（判据单源 = `docs/desktop/design/RENDERER.md` §3）· 回底 ⇒ 药丸退场——同信息（偏离底部状态可见）；行数读数（HTML 渲染行 ≠ 终端行）无对位物 ⇒ 不搬；观感复核 = 真机对照（T-DSK39）。
6. **计数随动（D3）**——状态行词键 10 ⇒ **16**（新增 `status.ready` / `status.enter.send` + 四态 `status.banner.plan` / `.auto` / `.advisor` / `.eng`）；宿主键总数 **139 ⇒ 145**；会话头字段 5 ⇒ **3**——承载 = 词表四处同笔（测试树 2026-09-28 全清重置后 = 随批单元证据）。
7. **桌内翻转刷新（并入本批——2026-09-28 评审轮 1 修正定形）**——桌内 AUTO 翻转（always 放行置位 = `thincoder-desktop/src/main/suspensions.mjs:103`）后 `flags` **即时刷新**，最小可落路径 = 置位通道回执携 `flags`：
   `approval:respond` 成功径回执叠加 `{ key, flags }`（宿主 `flagsOf(key)` 活值投影——与页读同一函数，零算法副本；提问门径 / 失败径零叠加）⇒ 渲染面以回执写 `sessionFlags[key]` 切片（写点 = 归约面纯动作，与页读同点）⇒ 状态行随切片重挂。
   零新通道 / 零新白名单项；契约面 = `docs/desktop/design/IPC.md` §2 `approval:respond` 行 + 「模式位投影注」项 5；用例面 = 回执两向 ∕ 成功径写切片 ∕ 失败零写 ∕ 切片 ⇒ `auto` 段在场（测试树 2026-09-28 全清重置后承载 = 随批单元证据）。

**本批注（账本警示面 · 2026-09-28）**：本注补本档 §1「左列会话行」行的**会话账本异常警示面**（该行已就地指针）；来源 = 核需求 `docs/core/requirements/SESSION.md` §4.6 **F-L4**「账本异常 ⇒ 用户可见信号」+ 批 `docs/batches/2026-09-28-ledger-reliability.md` §1.6 扩面裁定（三端齐——VSC 面同批落，桌面面本微轮落）。本注只述端侧形态与锚；契约 / 载荷 / 在场单源 = `docs/desktop/design/IPC.md` §2「会话族注」项 6。

1. **触发与在场**——触发 = `refused > 0 ∨ scene`（与 CLI / VSC 同口径，**脱离会话计数条件**）；判据单源 = 核 `ledgerHealth(cwd)`（`docs/core/design/SESSION.md` §6.25 判据句 4）。
   在场判据 = `sessions:list` 回执携 `ledger` 字段（缺席 = 正常——负断言）；`boot` 态（无项目）⇒ 不在场（无 cwd 判据对象）；`empty` 态（有项目无会话）⇒ **同样在场**（触发脱离会话计数）；**异常清 ⇒ 两腿**（单源 = 核 `ledgerHealth(cwd)`）：`scene` 腿 = 损坏现场档清 ⇒ 注记消失（零历史态）∥ `refused` 腿 = 核**本进程累计**（不清零）⇒ 进程内一旦拒写，注记持续在场**至重启**（有界）——随下一次列表刷新自见。
2. **形态与锚（最小形态 = dim 行 · 非可点）**——落点 = 会话区**末子节点**（行列表 / 空态件之后——「列表底部」落法；`[data-section="sessions"]` 内）；节点 = `div.rail-ledger-notice` + 机读锚 **`data-ledger-notice`**（裸标记——在场即异常；**非 `button`** · 零 `data-action` ⇒ 不可点、零控件语义）；
   样式 = `.rail-ledger-notice` 单规则（`color: var(--fg-muted)`——dim 观感，沿 `.rail-hint` 同语；落点 = `thincoder-desktop/renderer/styles.css` 左列段）。
3. **词键（两语各两键 · 条件合成）**——主句键 `rail.ledger.notice` + 条件附句键 `rail.ledger.notice.scene`（住 `thincoder-desktop/renderer/i18n.mjs` `rail.*` 族；插值 = 核同形 `${reason}`）：
   zh 主句 =「会话账本异常（${reason}）——打开会话即自动补回」/ en 主句 =「Session ledger anomaly (${reason}) — opening a session self-heals it」；zh 附句 =「损坏现场档保留 30 天」/ en 附句 =「Corrupted-scene files kept 30 days」——**`ledger.scene === true` 时合成「主句 + 分隔符 + 附句」**（zh「；」/ en「; 」按当前 `locale()` 直取；缺 / false ⇒ 仅主句）；
   **与 VSC 两键 / CLI 同口径**（三端同一句话的条件附形态——2026-09-28 修正轮定形）；`${reason}` 值 = `ledger.reason` 逐字。
   计数随动：宿主键总数 **147**（两语同增——实读 2026-09-28 修正轮落值；键数门 = 四处同笔为纪律——测试树 2026-09-28 全清重置后承载 = 随批单元证据）。
4. **数据链**——`refreshRail`（`thincoder-desktop/renderer/mount-sessions.mjs`——**唯一写路径**）在 `sessions:list` 回执到后写 `ledger` 切片（重挂键面 `SESSION_KEYS` = `thincoder-desktop/renderer/app.mjs:64` 含 `ledger`）；构树读切片出注记节点（`thincoder-desktop/renderer/views/session-control.mjs`——`sessionModel` 携 `ledger` ⇒ 下拉首行出注记）。
   **不做推送**：可见刷新 = 端侧下一次列表渲染自见（沿核 §6.25「行级刷新不做推送」口径）。
5. **判据（机检）**——① 回执面：`ledger` 在场 ⇔ `refused > 0 ∨ scene`；缺席 = 正常（负断言）——用例面 = 随批单元证据；
   ② 构树面：`ledger` 在场 ⇒ 下拉首行 = `[data-ledger-notice]`（非 `button` · 零 `data-action`）∧ 文案含 `${reason}` 值；缺席 ⇒ 零节点；`empty` 态同样在场——用例面 = 随批单元证据；③ 真机面 = **`T-DSK40`**（单源 = `docs/desktop/design/E2E-TESTING.md` §3.6 / §6）。

**本批注（外壳视觉降噪 · D24 · 2026-09-28）**：本注补本档 §1 五行（标签条 / 会话头 / 输入区 / 设置面 / 主题）的**外壳视觉语言**（五行已就地指针）；来源 = 用户 2026-09-28 06:30 走查「桌面端页面上线条框框太多，显得非常杂乱」→ 06:36 裁定「先只做外壳」（内容面守 D21 值源不动）→ 06:43 选定 ② 整壳降噪（对照 mock「02 整壳」帧）；需求 §4 **D24**；批档 = `docs/batches/2026-09-28-desktop-shell-denoise.md`；台账 #493。
**两层值面**：① **静息面** = 定案规则集（批档 §1.3 R1–R6 · mock V2 值逐条照落——用户选定形）；② **交互态面** = mock 未覆盖 ⇒ **本注定形**（D24「交互态显形」）。
**总则**：去描边一律 `border-color: transparent`（**保位**——1px 边框留位 ⇒ 零几何位移）；层次靠**底色与间距**；**零新变量**（全用在册：`--bg` / `--bg-raised` / `--line` / `--accent` / `--fg` / `--fg-muted` / `--hover-bg` / `--hover-bg-strong` / `--radius`）；**零新依赖**。

1. **静息描边归零（R1–R4 · 四族）**
   - **容器族 4**（`.rail` / `.session` / `.pool` / `.status`）⇒ `border: 1px solid transparent`（原 `var(--line)`）；层次 = `--bg-raised` 底 + `--gap` 间距——落点 = `thincoder-desktop/renderer/styles.css:93-102`。
   - **骨架线族 4 处**（各 `1px solid transparent` · 保位）：`.rail-head` 底线（`styles.css:111-117`）· `.session-head` 底线（`styles.css:128-132`）· `.tabbar` 底线（`styles.css:353-361`）· `.composer` 顶线（`thincoder-desktop/renderer/chat.css:261-268`）。
   - **控件族 11 选择器**（R1 原文逐一 · 各 `1px solid transparent` · 保位）：`.head-field`（`styles.css:439-445`）· `.chat-backfill`（`thincoder-desktop/renderer/chat.css:97-104`）· `.chat-pill`（`thincoder-desktop/renderer/chat.css:106-118`）· `.pool-toggle`（`thincoder-desktop/renderer/pool.css:28-45`）
     · `.rail-cancel` / `.rail-confirm`（`styles.css:300-310`）· `.tabbar-cancel` / `.tabbar-confirm`（`styles.css:411-421`）· `.composer-interrupt` / `.chat-copy-block` / `.chat-copy-last`（`thincoder-desktop/renderer/chat.css:282-291`）。
   - **池条目**（`.pool-item` · `pool.css:57-65`）⇒ `border-color: transparent` + `background: var(--bg)`（嵌底——池卡 `--bg-raised` 内的下沉井）。

2. **交互态四值（本注定形 · 外壳控件族单源）**——语汇 = 叠加色（任意底上皆显）+ 聚焦环（accent 系）：
   - **静息**：`background: transparent`（`.chat-pill` 例外 = `var(--bg-raised)`——**实色支**：浮于内容上 ⇒ 恒不透明，不并族值〔半透明叠加会透出底层文字〕）；**`.chat-pill` 交互态** = hover / 按下 `var(--bg)`（实色降底——收齐由不触〔底 = `--bg-raised`〕；实色支无第二档 ⇒ 按下沿 hover）；聚焦底不随落（守实色——见下聚焦条）；
   - **hover**：`background: var(--hover-bg)`（**由 `var(--bg)` 收齐**——由：`.chat-copy-block` 落 `.block-user`（底 = `var(--bg)`）⇒ `var(--bg)` hover 不可见；且 D21 行 hover 已用 `--hover-bg`）；
   - **按下**（`:not(:disabled):active`）：`background: var(--hover-bg-strong)`；
   - **聚焦**（`:focus-visible`）：`outline: 2px solid var(--accent); outline-offset: -2px` + `background: var(--hover-bg-strong)`（沿 `.rail-row:focus-visible` 同三值——D21 先例；**`.chat-pill` 底不随落**——守实色）。
   - **命中面** = 控件族 11 + **同面收齐两组**：标签条三控（`.tabbar-tab` / `.tabbar-close` / `.tabbar-new` · `styles.css:373-385` / `:399-409`）与 `.rail-control`（`:203-206`）——两组静息零改（原已无描边）、hover 收齐为 `--hover-bg`（同面一致）。
   - **`.head-field` 特例**：聚焦三值落 **chip**（`:focus-within`）——可聚焦面 = 内嵌 `.head-pick`；未接线态与可点态同形（沿既有「诚实非死控」律）。

3. **标签活动态（R5）**——`.tabbar-item[data-active="1"]`：`border-color: var(--accent)` ⇒ `transparent` + `background: color-mix(in srgb, var(--accent) 14%, transparent)`；`.tabbar-item[data-active="1"] .tabbar-title { color: var(--accent) }`（落点 = `styles.css:372` 就地改 + 新行）。
   注：左列活动行态（`.rail-row[data-active="1"]` · D21 面 3 · 10% 值源 = VSC）**零动**——两处混同值不同 = 各面值源分处在册（标签条 = 本端独有面 ⇒ 取 mock 14%）。

4. **滚动条皮肤（R6 · 全局）**——`styles.css` 全局段新增（零变量）：`::-webkit-scrollbar { width: 10px; height: 10px }` · `::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent }`
   · `::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--fg) 22%, transparent); border: 2px solid transparent; border-radius: 6px; background-clip: padding-box }` · 同 thumb `:hover` ⇒ 35%。
   覆盖 = 各滚动容器（`.rail-body` / `.pool-body` / `.flow` / `.tabbar` / 设置面板）；两主题同式（`--fg` 混同）。

5. **设置面映射（同规则带上 · 用户未见 mock——父侧默认；本注 = 落形）**（落点 = `thincoder-desktop/renderer/settings.css`）：
   - 面头线（`.settings-head` / `.wizard-head` · `:44-51`）⇒ 底线 transparent（同骨架线族）。
   - 结构框归零 + 升底：`.settings-row`（`:141-157`）· `.settings-form`（`:173-180`）⇒ 边框 transparent + `background: var(--bg-raised)`（面板底 = `--bg` ⇒ 行 / 表单浮起——同主壳「卡在底上」语）；`.settings-notice` / `.wizard-notice`（`:105-117`）⇒ 边框 transparent（警示语义已由 `--accent` 字色承载）。
   - 活动 / 当前行：`.settings-row[data-active]` / `[data-current]` ⇒ **accent 描边改底色态**（同 R5 语）：`background: color-mix(in srgb, var(--accent) 14%, var(--bg-raised))`（不透明混同——行自持升底）。
   - 控件族 8：**次级 6**（`.settings-lang` / `.settings-close` / `.settings-submit` / `.wizard-dismiss` / `.wizard-submit` / `.info-entry` · `:60-81`）⇒ 描边归零 + 四值族；**强调 2 保留**（`.wizard-next` / `.wizard-finish` · `:82-86`——accent 框 = 主推进键语义强调，沿「强调框保留」律）。
   - **保留**：`.settings-field`（`:191-206` 输入控件）细边零动（D24 边界原文）；`.settings-mark`（`:159-165` accent 强调标）零动。

6. **保留面 + 本批不动（零动清单 · 逐条给由）**
   - 保留（D24 原文）：输入框细边（`.composer-input` / `.question-input` / `.settings-field`）· 审批 / 提问 / 计划卡语义强调框（`thincoder-desktop/renderer/chat-cards.css`）。
   - 本批不动：卡片内控件族（`.approval-action` / `.question-option` / `.question-submit` / `.question-cancel`——住保留卡族内 · 不在 R 集）· D21 会话行面九面（含 `.rail-row` 行分隔线——mock V2 未动 · 用户选定形即此）
     · `[data-slot="info"]` 行顶线（`:243-247`——不在 R 集）· `.tool-result` 顶线（内容面 · 守 D21）· 内容面全域（`thincoder-desktop/renderer/core.css` **零改**）。
   - **原生 UA 控形边界**：`.head-pick`（原生 `select` · 出树面 = `thincoder-desktop/renderer/views/chrome.mjs:106`；现值零 CSS 规则 ⇒ 自持平台控形）——chip 外框归零后其可见框来自 UA，**本批不皮肤化**（mock 选定形即含此形 · 布局零动边界）⇒ 上抛（见项 9）。

7. **验收（D24 判据三件 → 用例面）**
   - **静息描边机检锁**（值落点锁——测试树 2026-09-28 全清重置后承载 = 随批单元证据）：四族归零 + 四值族 + 滚动条四规则 + 设置面映射 + **保留面负向锁** + 零新变量（主题变量块两套计数不变）。
     负向锁**两值列**（仍 1px 描边 · 未被归零）：**accent 值列** = `.approval-card` / `.question-card`；**`--line` 值列** = `.composer-input` / `.plan-card`。
   - **真机 hover · 聚焦读数**（真机面 = 人工走查 + 父侧真跑闭合；D16 义务）——静息四边 `rgba(0, 0, 0, 0)` ∧ 边宽仍 1px（保位）∥ hover 面 bg 非透明 ∧ 边框仍透明
     ∥ 键盘 Tab 命中 ⇒ `:focus-visible` 真 + outline 2px ∥ 活动标签底非透明 ∥ 滚动条占宽（**前提 = 夹具使 `[data-slot="flow"]` 溢出** · 两支形）：有滚动条 ⇒ `offsetWidth − clientWidth` = 10 ∥ 无滚动条 ⇒ 该支不适用（不自判红） ∥ `.composer-input` 边框非透明（保留面）。
   - **改前 / 改后对照**：改前 = 批档 §1.3 的「00 改前」帧（同夹具 / 同机位 / 同滚位 · as-of 2026-09-28）∥ 改后 = 实施后同夹具实拍 ⇒ 父侧 / 用户走查（探针 = 批档 §1.3 所列一次性物 · 非批产物——值面已在册 ⇒ 临时面清不阻塞）。
   - **零回归**：内容面零改 ⇒ 核 / CLI / VSC 面零波及（测试树 2026-09-28 全清重置后 = 随批单元证据 ∕ 真机面）。

8. **计数（D3）**：容器 **4** · 骨架线 **4 处** · 控件族 **11 选择器** · 池条目 **1** · 标签活动态 **1 处二值** · 滚动条 **4 规则** · 设置面 **9 面**（6 改 + 3 保留）· 交互态 **4 值** + 同面收齐 **2 组** · 保留面 **5** · 新增变量 **0**。

9. **open / 上抛（本批不改 · 消解路在册）**：① 原生 `select`（`.head-pick`）皮肤化（项 6 边界——需用户 / 父侧另裁）；② 线族残留面（`[data-slot="info"]` 顶线——不在 R 集 · mock 未覆盖 ⇒ 若用户后续并批再降噪则另裁）；③ 设置面形（用户未见 mock——若剔除该面 ⇒ 本注项 5 整段回撤，主壳零波及）。

**本批注（对齐第二批 · 六件 · 2026-09-28）**：本注补本档 §1「对话流」/「输入区」/「状态栏」三行与 §2 项 1 行的**「对齐」第二批**，并定形 §1「布局」/「断点」两行所涉的右列宽面（项 6，行内零改）——用户 2026-09-28 06:48–07:08 走查六件 · 台账 #494–#498 / #500）。
口径 = 需求档 §3.6「对齐口径」（**「对齐」= VSC 的形 + 行为**——2026-09-28 06:54 裁定 + 07:06 三重强调）；核 = 手段（同一核件 + 值对齐）；批档 = `docs/batches/2026-09-28-desktop-vsc-align-2.md`。
核面消费（**本批新增消费面**）单源 = `docs/render-core/design/RENDER-CORE.md` §4 / §5；本注只述端侧形态 / 落点 / 判据 / 边界。

1. **推理面改接核专用画笔（#494）**——用户 06:50「思考块为什么不会自动滚动呢？！」：
   - 机制：推理块内容区（`.reasoning-content`——`max-height: 200px` + `overflow-y: auto`，`thincoder-desktop/renderer/core.css:216-226`）的**内容重渲走核专用画笔** `paintReasoningTarget`
     （`thincoder-render-core/flow/stream.mjs:27-30` = 通用画笔 + `el.scrollTop = el.scrollHeight` 钉底；VSC 同径 = `thincoder-vscode/webview/streaming.js:54` `markReasoning()`）；桌面现走通用 `paintStreamTarget`（无钉底）⇒ **改接**。
   - 落点：`thincoder-desktop/renderer/views/chat-text.mjs` `patchTextBlock`（按 `block.kind === "reasoning"` 分流画笔——`textFace` / `patchTextBlock` 结构不动）+ `thincoder-desktop/renderer/views/chat.mjs` 尾段挂载后对 reasoning 尾块补一次钉底（新建即落底——与 VSC 首帧同形）。
   - 判据：**机检** = 随批单元证据（假 root：reasoning 块尾文档位变 ⇒ 内容区 `scrollTop === scrollHeight`；assistant 块同径 ⇒ 零钉底赋值——**对拍有牙**）；
     **真机** = 流式期读数 `scrollTop + clientHeight ≥ scrollHeight − 1` 恒真（用例号随测试档修加）。
   - 边界：钉底**无条件**（随 VSC——推理框内上滚亦回底；**不做**「尊重上滚」分叉）；滚动容器与高度口径零改。

2. **排队消息走流内标记形 + 队列按会话分键（#495 · 07:08 补充）**——用户 06:52「queued跑到右边Activity区去了…」+ 07:08「排队中的时候要先是在输入区的上面，不是在右边！」：
   - 机制（**入队即出泡**）：忙态提交 ⇒ 流尾（**输入区上方**）落**待发送气泡**——标记形单源 = 核 `thincoder-render-core/flow/queued-mark.mjs` 导出直消费（`markPending` / `paintLabel`——`pending` 类与标签两形态字面单源；`planBusyQueued` / `clearPending` 不消费——见下行登记）；
     消费（步边界注入 ∕ 回合尾送达两时刻）⇒ 气泡退场 ∧ 同帧由流内用户块承接（**同一位置交接**——零二次出泡）——队列归属 ∕ 消费时序 = 本档 §1「本批注（回合中插入 · 步边界 pickup）」（该批收正：队列权威由渲染面本地改**宿主单源**）。
     - **不消费**（登记非缺口）：`planBusyQueued`（宿主快照对账面 = VSC 专有——桌面快照形 = `ev:queue` 的 `{ text, ts }` 显示镜面，无合并 / 去重语义）；`clearPending`（桌面交接 = 组项退场 + 块入场（节点换代），非原地清标）。
   - **队列按会话分键**：`pending: { [会话键]: [{ text, ts }] }`——**快照镜面**（写者 = `ev:queue` 归约；权威 = 宿主内存表按会话分键——「回合中插入」批收正：原三纯动作 `enqueue` / `dequeue` / `drainQueue` 随本地队列退场）。
     分键两由（不变）：① 待发送气泡挂某会话流 ⇒ 队列须带键（否则未受理气泡随切会话漂页）；② 消费目标 = **事件键**（切会话后不会把 A 的队发进 B）。
   - 落点：`thincoder-desktop/src/main/queued-input.mjs`（已落 · 实读 **117** · 队列单源）· `thincoder-desktop/renderer/queue.mjs`（快照应用纯动作）· `thincoder-desktop/renderer/events.mjs`（`ev:queue` 归约——镜面 + 用户块）· `thincoder-desktop/src/main/ipc.mjs`（`history:page` 回执 `queue` 键——冷启 ∕ 重载镜面重建）；
     `thincoder-desktop/renderer/views/chat-pending.mjs`（尾组构树——形零改）· `thincoder-desktop/renderer/views/statusline.mjs`（段 14 读镜面）· `thincoder-desktop/renderer/app.mjs`（`CHAT_KEYS` 增 `pending`）· `thincoder-desktop/renderer/chat.css`（气泡形）。
   - **尾组形态**：`[data-pending]` 组 = **流内非块节点**（沿摘要块 / 卡族 / 药丸先例——零 `data-block-id` ⇒ 块序与 `data-blocks` 不变式不受影响）；落点 = 块序列之后、卡序列之前（**= 块插入点同侧** ⇒ 交接位置零跳）；
     项 = 待发送气泡（`.block.block-user` 形 · `.msg-label` 由核原语落笔 · 文本面 `mdInline`——与用户块同面）；**零复制控件**（未受理 —— 诚实面）。
   - **右列「队列」族不再承载用户排队消息**（席位**保留 · 零写者** ⇒ 族空 ⇒ 零节点恒不在场——父侧 §1.8 口径「该族回归『排队中回合 / 工具批』本义」；摘除候选**被否**：口径句 + 未来写者接入座）。
   - 判据：**机检** = 归约用例（快照整置 / 消费回执 ⇒ 组退场 + 尾块 = `user` / 满队判据）+ 视图用例（组在场 ⟺ 本会话队非空 · 项数 = 队长 · 标签两形态 · **交接同帧**）——承载 = 随批单元证据；
     **真机** = 忙态发送 ⇒ 流尾 `⏳` 气泡（输入区上方）∧ 右列零队列条目 ⇒ 步边界注入（下一次可见）⇒ 标签转 `❯ You:` + 队读数随动。
   - 边界：队列 = 宿主**运行期内存**（重启即失——既有）；附件边界（条目携图 · 步边界让位 · 送达面判决）= 本档 §1「本批注（回合中插入 · 步边界 pickup）」项 3；`⏳` 文案 = 核键 `queued.pending` 值（**两语逐字同 VSC**）；失败径（`ok` 假 / 抛）⇒ 文本 + 附件保留 + 气泡不出现（受理判据 = 回执）；非活动键交接 ⇒ 用户块随下次页读在场（沿 #458 键门既有口径）。

3. **右列子 agent 面改用核件同款（#496）**——用户 06:48「subagents那边显示的样子跟vsc真是没一点相似啊！那公共渲染核的作用呢？」：
   - 机制：右列子 agent 块面 = **核构件直消费**（`renderSubBlock`（块壳 + data 面 + toggle + 首刷）· `refreshBlock`（头词 / 状态词 / tail-3）· `renderSubagentChunk`（内容行 + 状态词写点）· `renderSubDesc`（会话首个活动块说明行））——块面形 = VSC 同件（`[▶ role#id · async · model · 12s · turn N/M]` 行 + 状态词 + 内容 tail-3 + 展开 + ⏹）；
     桌面自建五段行块面**退场**。
   - **内容回显（D4 句收正）**：relay 前缀内容 chunk（四面 = text / think / 工具调用行 / 工具输出行）不再丢弃 ⇒ 桥面出站**新通道 `ev:subchunk`**（载荷 / 在场单源 = `docs/desktop/design/IPC.md` §1 该行）⇒ 归约面入块模型 `rows`（**重挂重放单源**）∧ 视图面即帧 `renderSubagentChunk` 落 DOM（**内容渲染单源 = 核件**）。
   - **词键面 / 核件取词**：核件内取词走核 i18n ⇒ 渲染面**核件取词接线 = 注册单点**（宿主表 ∪ 核投影——注册单点 = `thincoder-desktop/renderer/app.mjs`（`setStringsSink(setStrings)` 一次注册）；`initDict` 合并式经注册端出——
     判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」）；核件所需 VSC 侧键（`sub.*` 族 / `msg.*` / `queued.pending`）入宿主表，**值逐字同 VSC locales**（沿 `msg.copy` / `msg.copied` 先例）。
   - **挂载面（键控差分）**：池面挂载由「整树重挂」改**分面更新**——壳（三态 / 头读数 / 折叠）与待审批 / 队列族照帧刷；**子 agent 族按 key 复用元素**（`el._subMeta === model` 判据：同 key 跨帧同一元素——内容追加 / 折叠态 / ⏹ 全走核函数，**不重建**）。
   - 落点：`thincoder-desktop/src/main/agent-bridge.mjs`（四面分流 ⇒ `ev:subchunk`——构造面同形 = VSC `panel-subagent-relay.mjs:172-191`）· `thincoder-desktop/renderer/events.mjs`（`rows` 归约）·
     `thincoder-desktop/renderer/views/activity.mjs`（改键控差分 + 核件）· `thincoder-desktop/renderer/mount-pool.mjs`（⏹ 点击委托 ⇒ `subagent:stop`——载荷读 `data-sub-id` / `data-sub-role`）·
     `thincoder-desktop/renderer/core.css`（核类名映射：`advisor-block` 族 / `sub-*` 族——值源 = `thincoder-vscode/webview/chat.css:298-374` / `:328-371`）· `thincoder-desktop/renderer/i18n.mjs`（键 + `setStringsSink` 注册面——注册单点 = `thincoder-desktop/renderer/app.mjs`）。
   - 判据：**机检** = 桥用例（四面 chunk ⇒ `ev:subchunk` 载荷逐字段——承载 = 随批单元证据）+ 归约用例（`rows` 入模型）+ 视图用例（块 = `details.advisor-block.sub-block` · 头文形 · tail-3 `│ ` 前缀 · ⏹ 在场判据 · **同 key 元素跨帧同一**）+ **零工具行负向锁**（右列条目型闭集不含 tool）；
     **真机** = 与 VSC 同刻截图逐段对表（D21 同径）。
   - 边界：**2s 走时刷新不落**（VSC `panels.js` 同点——归第三批「小修族」）；`sub.desc` 说明行**落**（会话首个活动块 · 一次性）；
     **R10 存差登记（待裁——消差 ∕ 保留）**：判据**会话级**（桌面）⟷ VSC = **面板级**旗标（`thincoder-vscode/webview/state.js:42`）；**归档回显不带该行**（`.sub-desc` 与 `.advisor-content` 互为兄弟 ⇒ 不入 tail-3 射程——单源 = `docs/vsc/design/WEBVIEW-INPUT.md`）；宿主侧剥前缀（渲染面零析 `role#id/`）不变；consult 族零停止径（核档 §9 端差③）不变。

4. **说话人标识（#497）**——用户 06:58「vsc那边好歹有You: / ThinCoder: 标识一下哪句话是谁说的，你这边啥都没有」：
   - 机制：用户块与助手回合首块各出**标签行**（`❯` + 说话人词 + `:` +〔时间?〕——VSC 形）：
     - **用户块两形态**（常态 `❯ <msg.user>: <ts>` ∥ 待发送 `⏳ <queued.pending>`）= 核 `queued-mark` 原语落笔（`paintLabel` / `markPending`——字面含 `❯` 字形与时间 span；A2 同笔）；
     - **助手标签** = 核**无**独立原语（核内为 `renderBlock` / `buildAssistantRestore` 内联字面）⇒ 端侧按**同字面**落形（词键 `msg.assistant` 两语值同 VSC；`❯` 与 `:` 住样式档 `content`——沿「视图档零字形字面」律）——**端差登记 + 上抛**（核侧补助手标签原语 ⇒ 另裁；见核档 §10）。
   - 时间面：`ts` **在场才落**（「无 ts 不显示」纪律同源——核 `paintLabel` 同判据）。载波：回放 = 核 message `timestamp` ⇒ 块 `ts`（`blockOfMessage` 携）；活流 = 提交 / 入队现刻；块 `ts` 落 `data-ts` 锚（核原语供料面）。
   - **回合首块判据（单源）**：`assistant` 族块（`assistant` / `reasoning` / `tool` / `error` / 归档 `subagent`）**前一位块 = `user` 块 ∨ 本块居块序首位** ⇒ 出标签；其余零标签——**活流与回放同判据**（回放的核 `turnStart` 语义由块序自然复现，端侧零第二判据）。
   - 落点：`thincoder-desktop/renderer/views/chat-text.mjs`（user / assistant 块加 `.msg-label` 容器 + 后处理落笔）· `thincoder-desktop/renderer/views/chat.mjs`（帧尾后处理：用户块 `paintLabel` / 待发送项 `markPending`）·
     `thincoder-desktop/renderer/events.mjs`（块 `ts` 载波）· `thincoder-desktop/renderer/mount-composer.mjs`（出泡携 `ts`）·
     `thincoder-desktop/renderer/i18n.mjs`（`msg.user` / `msg.assistant` / `queued.pending` 三键）· `thincoder-desktop/renderer/chat.css`（`.msg-label` / `.msg-time`——值源 = `thincoder-vscode/webview/chat.css:3-18`）。
   - 判据：**机检** = 视图用例（user 块 `.msg-label` 文形 = `❯ <msg.user>:` + 时间段（ts 缺 ⇒ 零时间段）；回合首块有标签 / 同回合后续块零标签；待发送项 = `⏳ ` + `queued.pending` 值）——承载 = 随批单元证据；
     **真机** = 与 VSC 同刻对照（标签行在场与文形）。
   - 边界：`data-raw` 锚不变（复制面零回归）；标签行为**块内子节点**（不入块序 / 不改 `data-blocks`）。

5. **终态折叠 + 归档入流（#498）**——用户 07:01「刚才不是有个子agent在跑吗？……为啥没了？」：
   - 机制：子 agent 终态 = **折叠 + 归档入流**（VSC 同径——核 `subblocks/state.mjs` 三迁：普通终态**即时归档** ∥ `settled` **驻留待消化**（`awaitingDigest`）后由后到 `done` 归档 ∥ 旧代接管即归档）。
   - 落形：归档 ⇒ ① 池内块退场（DOM 摘除）② **流内尾追新增块**（块型 `subagent`——`data-block-kind="subagent"`；壳 = 零边距透传容器 `.block-subagent`，内嵌**核件元素**（冻结形 `[✓ … done Ns]` + tail-3 留场 + 可展开内容）；
     块序 = 归档序（与 VSC 的 append 序同形））③ 表项留存为**墓碑**（`region: "flow"`——迟来事件按 `drop-frozen` 消化：不复活 / 不重复补桩）；表项 `rows` 随归档交给流内快照（**内容单留存处**）。
   - **无 digest 边界物** ⇒ `atBoundary` 效果**恒按尾追**执行（= VSC 边界失效退化径同形）；`clearAwaiting` 由核件清标志后刷新（端侧照模型态派生——核 effects 表**不逐条执行**，端面动作由模型态幂等派生；登记理由 = 桌面无 DOM 区概念，`connectedOf` / `regionOf` 由模型字段供给）。
   - 落点：`thincoder-desktop/renderer/events.mjs`（`region` 写 + 流内块快照追加；`archiveFrozen` 删）· `thincoder-desktop/renderer/views/chat.mjs` + **`thincoder-desktop/renderer/views/chat-subagent.mjs`**（已落 · 实读 **69** · 归档块构树）·
     `thincoder-desktop/renderer/views/activity.mjs`（表项 `region` 过滤）· `thincoder-desktop/renderer/chat.css`（`.block-subagent` 透传壳）。
   - 判据：**机检** = 归约用例（终态 ⇒ 表项 `region:"flow"` ∧ `blocks` 尾块 `kind:"subagent"`；`settled` ⇒ 驻留（池内）不归档；后到 `done` ⇒ 归档；**下回合起不清出**——对拍旧口径）+ 视图用例（流内冻结形在场 · 右列退场）；
     **真机** = 子 agent 跑完 ⇒ 流内留 `[✓ …]` 块（右列退场）。
   - 边界：归档块 = **运行期块**（页读整置即失——非落盘件；与 VSC 重载面同族）；窗限 / 裁剪随既有窗口机制（`MAX_RENDER_BLOCKS`；**运行期块记账** = 退出尾窗不计入 `data-hidden`——判据单源 = `docs/desktop/design/RENDERER.md` §2 运行期块记账条）；冻结块**不再刷新**（静态）。
6. **右列加宽一倍（#500）**——用户 07:06「右边栏太窄了，要放宽一倍，才够比较好的显示子agent的活动」：`--pool-w: 18rem ⇒ 36rem`（`thincoder-desktop/renderer/styles.css:18` **单源**；`:86` 主栅格与 `:339-342` 窄断点行**同变量引用** ⇒ 自动随动，零第二处数值）。
   判据：**机检** = 值落点锁（随批单元证据：变量值 = `36rem` ∧ 两处引用皆 `var(--pool-w)`）+ **真机读数**（右列实测宽 ≈ 576px；< 900px 断点态同值）+ 改前 / 改后同机位对照帧。
   边界：**窄窗效应登记**（窗口 < ~1100px 时中列受挤——既有单断点只折叠左列；池面窄态 / 第二断点 = **另裁**，不入本批）；池内布局 / 族序零动。

**计数（本批 · D3）**：六件 = **A1 推理钉底** · **A2 排队流内 + 队列分键** · **A3 子 agent 核件同款** · **A4 说话人标识** · **A5 折叠 + 归档入流** · **A6 右列 ×2**；受触碰形态行 = 四行（对话流 / 输入区 / 状态栏 / §2 项 1）+ 布局 / 断点连带（项 6）；
新档 **2**（功能档——`views/chat-pending.mjs`（已落 · 实读 **77**） · `views/chat-subagent.mjs`（已落 · 实读 **69** · 归档块构树））+ **拆分产出 2**（`renderer/page-read.mjs` · `renderer/queue.mjs`——结构拆分 · 本批执行，见 §4.2）；新通道 **1**（`ev:subchunk`——单源 = `docs/desktop/design/IPC.md` §1）。

**本批注（对齐第三批 · 小修族 25 + 相抵 2 · 2026-09-28）**：本注定形「小修族 25 条 + 两条相抵」的**对齐形**（用户 07:11 裁定：**不存在「用户的不做」——流程自划的例外一律按对齐办**；需求档 §3.1:51 / §5.1 已收正）；用户 07:13「剩下的你自动跑完吧」授权下立批。口径 = 需求档 §3.6（**「对齐」= VSC 的形 + 行为**）；交底 = 逐条「现状 → 对齐形 → 落点 → 判据」；条目全文与出处 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1 / §2。
核面新消费件（`formatToolSummary` / `isToolFailure` / `diff.mjs` 三导出 / `linkifyPaths` / 核台账行产）单源 = `docs/render-core/design/RENDER-CORE.md` §4 / §5；本注只述端侧形态 / 落点 / 判据 / 边界；通道载荷增键与白名单收正 = `docs/desktop/design/IPC.md` §1 / §2。

**A. 对话流面（12 项）**

1. **工具卡·结果摘要行**——现状：头行四段、零摘要（核件 `tool-summary.mjs` 未接）。对齐形：头行增**摘要段**（`data-seg="summary"`）——字面 = `→ ` + 核 `formatToolSummary(name, result)` 直取（read / write / grep / glob / bash / advisor / 默认七分派）；
   判据 = 摘要非空才落（缺 ⇒ 零段）。落点 = `thincoder-desktop/renderer/views/chat-tool.mjs`（`toolHead`）。判据：机检 = 视图用例（`bash` 末行摘 / `read` N lines / 无摘要零段）；真机 = 与 VSC 同刻对照。
2. **工具卡·失败判据（红绿）**——现状：宿主 `ok: !startsWith("Error:")` ⇒ `(exit code 1)` / 全角 `Error：` 误判。对齐形：`ok = !isToolFailure(result)`（核 `lib.mjs` 判据单源——半 / 全角 `Error[:：]` 头 · 独立成行 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`）；
   头行色 = `thincoder-desktop/renderer/chat.css` 两值（`[data-status="error"]` ⇒ `#f14c4c` ∥ `"done"` ⇒ `#4ec9b0`——值源 = VSC 内联色）；失败默认展开（既有 `isExpanded` 判据含之——零动）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/chat.css`。
3. **工具卡·运行期实时输出**——现状：`result` 只累不显（视图仅展开态落体）。对齐形：**运行期卡体在场 + 展开**——`result` 非空 ∧（显式 `expanded` ∨ `status === "running"` ∨ `"error"`）⇒ 体落；**chunk 到达清显式折叠旗**（运行期展开由增量驱动——与 VSC 同径）。
   落点 = `thincoder-desktop/renderer/events.mjs`（`onToolOutput`）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（`isExpanded`）。判据：机检 = 归约 + 构树两例；真机 = 长命令边跑边见。
5. **中止·未结算卡清扫**——现状：停止后运行中卡永停「执行中…」。对齐形：`stopped` 终局（本键）⇒ 未结算工具块（`status === "running"`）就地改 `status: "interrupted"`（体 / 折叠态不动——VSC 同）；
   状态词 = **已中断**（闭枚举 7 ⇒ 8 词——词键 `tool.interrupted`，值逐字同 VSC locales）。落点 = `thincoder-desktop/renderer/events.mjs`（`onActivity` 尾支）
   + `thincoder-desktop/renderer/views/chat-tool.mjs`（`STATUS_WORD`）+ `thincoder-desktop/renderer/i18n.mjs`。**端差登记**：VSC 另置硬编码摘要 `→ (interrupted)`——桌面由状态词承载同信息（零新英文串）。
6. **中止·流内 `[stopped]` 痕**——现状：零消费。对齐形：`stopped` 终局（本键）⇒ 流内**非块节点**停止痕 `div.chat-stopped[data-stopped]`（落点 = 块序列之后、待发送组之前——沿 `[data-pending]` 先例），词 = `status.stopped`（**核键直取**——两语逐字）；
   样式 = 提示色 + 斜体（值源 = `thincoder-vscode/webview/streaming.js:141`）；清点 = 页读整置（运行期痕——非落盘件）。落点 = `thincoder-desktop/renderer/events.mjs`（切片 `stopMark`）+ `thincoder-desktop/renderer/views/chat.mjs`（非块节点组构树）+ `thincoder-desktop/renderer/chat.css`（组样式——提示色 / 斜体）。
7. **流式·子回合边界 turnBreak**——现状：桥零该面、续写并块（推回段界丢失）。对齐形：宿主接**核 `onTurnEnd`** ⇒ 出站 `ev:activity { event: "turnBreak" }`（无 `fields`）⇒ 归约 = **清游标**（尾块追加态收束 ⇒ 下片文本起新块——VSC `streaming.js:71-88` 复位语义）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/events.mjs`。**端差登记（前提差）**：核 `onTurnEnd` ⊃ VSC `onSubTurnBreak` 两支——工具批尾 = 桌面零效果（游标已由 `onToolCall` 清）；中断注入 ⇒ 收尾文本另起块（VSC 不断）——消解路 = 核侧补窄义钩子（另裁）。
8. **恢复帧·推理 / 正文次序**——现状：`blockOfMessage` 序 = `[text, reasoning, tools]`。对齐形 = `[reasoning, assistant, ...tools]`（核 `thincoder-render-core/flow/block.mjs:97-105` 序）。
   落点 = `thincoder-desktop/renderer/page-read.mjs`。连带 = `T-DSK37` 块序收正（`user / assistant / reasoning` ⇒ `user / reasoning / assistant`——E2E 档 + 集成用例随动）。
9. **错误横幅（详情 + 重试）**——现状：纯文本块、零出口。对齐形：错误块 = 横幅 = `.error-text`（原样）+ [`.error-details`（`techInfo` 在场才落——`details > summary` + `pre` 原生折叠）] + **重试钮**（词键 `error.retry`——值同 VSC）；
   重试出口 = **重发末 `user` 块文本**（经输入区既有直发径——单一实现零副本 · **零新通道**）；钮在场判据 = 末 `user` 块在场（否则零钮——诚实面）；`techInfo` 载波 = `ev:error` 载荷增键（宿主 `err.stack`——缺 ⇒ 键缺席）。
   落点 = `thincoder-desktop/src/main/agent-host.mjs` + `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs` + `thincoder-desktop/renderer/i18n.mjs`。边界：重试失败 ⇒ `console.error`（零乐观写）。
12. **台账行 ledgerNotice**——现状：零（仅状态行台账段）。对齐形：流内**台账行**——核行产 `{ text, warn }` 逐字（类名面 = 核 `ledger-line` / `.warn` 同形）；通道 = **`ev:ledger`（新）**（载荷 `{ key, lines }`）；
   触发 = **开项目成功链一次**（对位 VSC startup 拍 = 变化行 + 明细行）；落点 = 流尾非块节点组 `[data-ledger-line]`（逐行）；数值面 = 核 `runLedgerScan` 直取（端侧零行构造）。周期刷新（VSC `REFRESH_MS`）**不在本批**（open 行登记）。
   落点 = 主侧（`thincoder-desktop/src/main/project-info.mjs` 扩 + `ipc.mjs` / `preload.cjs`）+ `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs`（组构树）+ `thincoder-desktop/renderer/chat.css`（组样式）+ `core.css`（核行类名映射）。
13. **滚动·发送后回底**——现状：停跟期间发消息原地不动。对齐形：`msg:send` 受理（用户块入流）与回底**并笔**（`appendBlock` + `returnToBottom`——`following: true` / `pendingNew: 0` ⇒ 帧尾 `stick` 贴底）；直发 ∕ 排队消费回执两径同判（「回合中插入」批收正）。落点 = `thincoder-desktop/renderer/mount-composer.mjs`。边界：入队径（忙态）不回底（受理面才回底——与 VSC 同）。
14. **工具卡·advisor 轮次标签**——现状：载荷无 round。对齐形：`ev:tool-call` 载荷增 `round` / `model`（仅 `advisor` 名；值 = 核 `agent._advisorRound` 活读 +1 / `agent.provider?.model`——宿主只读采样面注入桥）；
   视图 = 头行段 `round` = `(round N · model)`（格式串 = VSC `ui.js:104-107` 同式；缺 ⇒ 零段）。落点 = `agent-bridge.mjs` + `agent-host.mjs`（采样面）+ `thincoder-desktop/renderer/views/chat-tool.mjs`。
15. **空态·欢迎条**——现状：`no-message` 单行 hint。对齐形：`no-message` 帧增**欢迎条**（三行）= 抬头（`welcome.heading`）+ 文案（已配 ⇒ `welcome.textConfigured` ∥ 未配 ⇒ `welcome.text`——值逐字同 VSC）
   + 快捷键行（`welcome.shortcuts` = 本端键位）；**端差登记**：VSC 行含 `@` 文件引用段（桌面 @-补全 = 缺整面族 ⇒ 该段随缺面族批补）。落点 = `thincoder-desktop/renderer/views/chat-guide.mjs` + `i18n.mjs`。边界：`no-project` / `no-session` 两帧零动。

**B. 外围面（13 项）**

1. **审批卡·owner 归属**——现状：载荷无 owner。对齐形：载荷增 `owner`（核 `opts.owner.label` 原样——`coder#2` / `consult <model> #id` 形）；卡首行增段 `owner`（`<owner> · <tool>`——owner 在场才落）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs`（接核 `onPermissionRequired` 缝）+ `suspensions.mjs`（载荷）+ `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `owner`）+ `thincoder-desktop/renderer/views/approval.mjs`。前提：owner 只在**子代理门**在场（深度 0 ⇒ 缺席 = 既有形，零回归）。
2. **提问卡·Enter 提交**——现状：Enter = 换行。对齐形：Enter（非组字）∧ 输入非空白 ⇒ 提交（复用 `onAnswerDraft` 径——单一实现）；Shift+Enter ⇒ 换行；IME 组字期零动作（沿「交互」行判据）。
   落点 = `thincoder-desktop/renderer/views/question.mjs` + `mount-cards.mjs`。
3. **提问卡·聚焦两态**——对齐形：① 新卡插入入场 ⇒ `[data-input="answer"]` 聚焦；② 作答 / 取消回执 `ok` 真 ⇒ 回焦输入区 `[data-input="text"]`。落点 = `mount-cards.mjs`。边界：失败径零动（卡留场可重试）。
5. **活动区·「等待审批」态**——现状：零消费（子代理等审批仍显「运行中」）。对齐形：接核 `onSubagentApproval({ id, role, model, tool })` ⇒ `ev:subagent` patch `{ status: "approval", …, tool }`（`tool: null` = 清态）；
   归约面 `SUB_STATUS` 增 `approval` · `SUB_KEYS` 增 `tool`；块面 ⏸ + `sub.awaitingApproval`（核件 `refreshBlock` 直出——零端侧词面）。落点 = `agent-bridge.mjs` + `thincoder-desktop/renderer/subagent-reduce.mjs`。
6. **停止钮角色门**——**已由「对齐第二批」核件直消费落地**（核 `subblocks/activity-view.mjs` `FAMILY_ROLES` 门在核件内——桌面 ⏹ 全走核件）；本批 = 机检补例（consult / escalate 族零 ⏹ · explore / coder 在飞有 ⏹）。
7. **2s 心跳（走时）**——现状：渲染面零定时器（秒数冻结到下一事件）。对齐形：渲染面 **2s 拍**（首个渲染面定时器）= ① 池面在飞块逐块 `refreshBlock`（判据 `isConnected ∧ !frozen`——走时词面）② 本键位标含 `running` ⇒ 状态行重挂（耗时段走时）。落点 = `thincoder-desktop/renderer/app.mjs`（单点 `setInterval` + 卸载清点）。判据 = 机检（假钟 + 清点）+ 真机（秒数逐 2s 走）。
12. **会话栏·末项删除门**——现状：恒出（可删到零会话）。对齐形：**渲染面门** = 行常态删除控件在场判据 = 会话数 > 1（VSC `session-bar.js:57-59` 同判）
   + **主侧门** = `session:delete` 末项 ⇒ 拒（新 reason `last-session`——VSC 宿主同门先例）。落点 = `thincoder-desktop/renderer/views/session-control.mjs`（条目 ✕ 门——`>1` 才显） + `thincoder-desktop/src/main/session-actions.mjs`。
14. **设置面·类型加工**——现状：agent 段全 `type:"text"`（布尔 / 数值键写不进）。对齐形：控件型按 `field.kind` 三值（`string` ⇒ `text` ∥ `number` ⇒ `number` ∥ `boolean` ⇒ `checkbox`）；
    出值规范化 = 数值 ⇒ `Number(v)`（空 / 非数 ⇒ **零发送**——不写盘 · 零乐观改 · 控件回退现值）· 布尔 ⇒ `.checked`。落点 = `thincoder-desktop/renderer/views/settings-sections.mjs`（`agentFieldNode`）+ `mount-settings.mjs`（取值面）。
    真删键在 `patch` 链不可达（`docs/desktop/design/IPC.md` §2 档位控件注「`patch` 表达不了删键」· 核 `thincoder-core/agent-tools/settings.mjs:134-145` 类型表对 `null` 抛错——「显式清除」语义现只对形状表键族）⇒ 端差登记 = **VSC 删键（`Number(v) || undefined` 径）∕ 桌面零发送**（父侧裁定 2026-09-28；消解路 = 主侧写链 + 核清除形扩族——另批）。
15. **设置面·agent 形态**——现状：点分路径泛化表单 + 保存键。对齐形：**具名控件区**（十键 = `maxTurns` / `subagentTurns` / `poolLimits.{engCoder,other,advisor}` / `compactThreshold` / `verifyGuard` / `consultTurns` / `consultTimeoutMs` / `advisor.reasoningEffort`——词键标签 + 三控型 + 锚 `data-field-name`）
   + **即改即存**（`change` ⇒ 单键 patch 直发；回执 ⇒ 就地刷新；失败 ⇒ 回退 + 可见失败面——零保存键）；表外标量键 = 泛化行兜底（保留编辑 + 保存键——零能力削减）。
   落点 = `thincoder-desktop/renderer/views/settings-sections.mjs` + `mount-settings.mjs` + `i18n.mjs`。**端差登记**：VSC 全具名（桌面保留泛化兜底行）。
22. **附件·非栅格拒绝时机**——现状：先显缩略图、发出才知被丢（`partial`）。对齐形：**粘贴即拒**——栅格四型（png / jpeg / gif / webp）之外（含 `image/svg+xml` / `image/heic` / `image/bmp`）⇒ 不入条 + 提示行（词键 `paste.unsupportedFormat` 值逐字同 VSC——含 `${type}`）；
   提示行 = `composer-notice` 单形（`data-notice="attach-unsupported"`），下次成功采集 / 发送替换清。落点 = `thincoder-desktop/renderer/attach.mjs` + `mount-composer.mjs`。边界：主侧判据（`parseDataUrl`）零动（双闸——渲染面拒先达）。
23. **模型 / 档位·忙态写门**——现状：在飞可改。对齐形：本会话位标含 `running` ⇒ 会话头三值控件 `disabled` + `aria-disabled`（原生 `select` 无菜单面 ⇒ VSC `closeModelMenu` 零对位；控件**保位**——信息面不撤）。
   判据单源 = 位标切片（与输入区忙态同式）。落点 = `thincoder-desktop/renderer/views/chrome.mjs`（`headModel` / `pickNode`）+ `mount-head.mjs`（写路入口忙判）。
26. **错误·发送失败可见性**——现状：只 `console.error`。对齐形：直发失败（`ok` 假 / 抛）⇒ 输入区提示行（`data-notice="send-failed"`；词键 `composer.send.failed` 带 `${reason}`）+ 文本保留；下次成功发送清。落点 = `mount-composer.mjs` + `i18n.mjs`。判据 = 机检（失败 ⇒ 提示行 ∧ 文本留）+ 真机（`provider-invalid` 可见）。
28. **输入区·中断键两态**——现状：恒在场可点（空闲点必败）。对齐形：在飞（本会话位标含 `running`）⇒ 可点；否则 `disabled: true`（锚恒在——沿接线两态通则「诚实非死控」；**端差登记**：VSC 隐去）。落点 = `mount-composer.mjs`（`composerTree` / `composerModel` 增 `busy`）。

**C. 相抵两条（需求档 07:11 已收正——本批实现面）**

1. **审批卡·diff 预览（原「不做 diff」）**——对齐形：载荷增 `diff`（核 `diffInfo` 原样——两形 `{ patch }` ∥ `{ old, new, path }`）+ 卡面 **diff 节点**（`.diff-preview`：header + 行级差）——行面 = 核三导出直取（`patchLineType` / `lineDiff` / `renderDiff`——值源单源）；
   超阈（patch > 20 行 ∥ 改动 > 12 行）⇒ **只出摘要 + 计数**（桌面零外部查看器——同工具卡降级判；VSC「view in editor」钮不采）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `suspensions.mjs` + `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `diff`）+ `thincoder-desktop/renderer/views/approval.mjs`；
   样式 = `thincoder-desktop/renderer/chat.css`（diff 类名映射——值源 = VSC `base.css:405-432`；新增变量 `--diff-add-bg` / `--diff-add-fg` / `--diff-del-fg`，`--diff-del-bg` 在册）。
2. **文件链接点开（原「文件打开暂缓」）**——对齐形：工具结果区**可点文件链接**——线 = `ev:tool-result` 载荷增 `links`（`[{ raw, path, line? }]`——宿主计算：路径 token + **盘上存在闸** + 去重 + 封顶；语义同源 = `thincoder-vscode/src/extension/file-links.mjs`，端侧自有实现——**只述实现形态**；
   行参差异 = **宿主能力面**（`shell.openPath` 无行参——单源 = `docs/desktop/design/PROJECT.md` KD-39））；
   视图 = 结果区挂核 `linkifyPaths`（`span.file-link` 核类名——帧尾着装幂等）＋ 着装面落 **`data-path` 锚**（值 = 该链接盘上绝对路径——核件不带 ⇒ 端侧着装时落；断言面 = T-DSK42 / T-DSK43）；出口 = 点按 / Enter 委托 ⇒ 通道 `file:open { path, line? }` ⇒ 主进程打开。
   落点 = 新档 `thincoder-desktop/src/main/file-links.mjs` + `agent-host.mjs` + `ipc.mjs` / `preload.cjs`（白名单）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（着装）+ `mount-*.mjs`（委托单点）+ `core.css`（类名映射）。
   **端差登记**：VSC 打开到行；桌面打开能力 = 系统默认程序（行参不施加——载荷携 `line` 备用；消解路 = 外部编辑器 CLI 探测——open 行）。边界：历史卡（页读面）零链接（VSC 同径）；`file:open` 失败 ⇒ `console.error`。

**F. 出处重核输出（入本批两件 · 全表 = 批档 §2）**

- **审批卡·真置焦执行**（原 open 项：出处 = 流程自划「未落」）⇒ **入本批**：帧尾对 `[data-autofocus="1"]` 执行 `focus()`（VSC `permission.js:76` +50ms 先例——桌面取挂载后即焦）；落点 = `thincoder-desktop/renderer/views/chat.mjs` 帧尾着装 / `thincoder-desktop/renderer/views/approval.mjs`。
  判据：**机检** = 随批单元证据（卡内 `[data-autofocus="1"]` 恰一 ∧ 帧尾执行点——假 DOM 无焦点面 ⇒ 执行读数归真机）；**真机** = 人工走查 + 父侧真跑闭合（真 Electron：卡出现即 `document.activeElement` = 卡内焦点锚——T-DSK43 ⑥）。
- **设置面 / 向导·Esc 关闭**（原「零 Esc 绑定」：出处 = 流程自划「有意」；对位面 = VSC Esc 关设置面）⇒ **入本批**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；向导态不在本项）；其余浮层族（下拉 / 菜单 / 搜索 / 中断模式）桌面零对位面 ⇒ 零动。
  判据：**机检** = 真 Electron 面（用例面 = 随批单元证据）——真点设置入口（输入区控件行出口）⇒ `keyboard.press("Escape")` ⇒ `[data-slot="settings"]` 清空（T-DSK43 ⑤）；**真机复核** = 人工走查。

**D. 计数（D3）**：小修族 = 对话流 **12** + 外围 **13** = **25** · 相抵 **2** · 出处重核 **12**（逐条处置表 = 批档 §2）；状态词闭枚举 **7 ⇒ 8 词**；新通道 **2**（`ev:ledger` 事件——§1 十五 ⇒ 十六通道；`file:open` 请求——白名单 **28 ⇒ 29 项**）·
   载荷增键五处（`ev:tool-call` `round` / `model` · `ev:approval` `owner` / `diff` · `ev:error` `techInfo` · `ev:tool-result` `links` · `ev:activity` `turnBreak`）；
词键增 **≈18 × 2 语**（`tool.interrupted` · `error.retry` · `welcome.*` 四 · `composer.send.failed` · `paste.unsupportedFormat` · 设置面具名十键 · 提示面一——实施轮按盘面实读计，不以计数为门）；新档 **1**（`file-links.mjs`）+ 拆分产出 **1**（`renderer/i18n-views.mjs`（已落 · 实读 68）——单源 = `docs/desktop/design/PROJECT.md` §4.2）；渲染面**首个定时器**（2s 拍）。

**E. open / 上抛（本批不改 · 消解路在册）**：① 台账行周期刷新（VSC `REFRESH_MS`）——消解路 = 与左列信息行复读面并笔；② 桌面打开文件的**行定位**（C2 端差）——消解路 = 外部编辑器 CLI 探测；③ 核 `onTurnEnd` ⊃ VSC `onSubTurnBreak` 的「中断注入」支端差（A7）——消解路 = 核侧补窄义钩子；④ **审批卡形态整面**（卡壳 / 类名 / 操作区与核件卡的差）——本批只落 owner / diff / 置焦三增量；形态整面 = 就近批（键盘面 / 锚面取舍需裁定）。

**本批注（回合中插入 · 步边界 pickup · 2026-09-28）**：本注定形桌面端「回合进行中插入用户指令」（用户 2026-09-28 14:08 走查「会话中插入用户指令的功能在桌面端也丢了」）——B1 宿主接缝 ∕ B2 渲染面时序 ∕ B3 附件边界三面；条目 = `docs/batches/2026-09-28-desktop-midturn-input.md` §1；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**；台账 #509。

1. **队列单源 = 宿主（主进程）**——忙态提交 ⇒ `msg:send` **一律交宿主任判**（受理判据 = 宿主在飞表；渲染面**不再本地判忙入队**）：受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **入队即出泡**（流尾待发送气泡——项 4 形态）；满队（第 9 条，按键判）⇒ 回执 `{ ok: false, reason: "queue-full" }` + 提示行（词键 `composer.queue.full`——既有键续用）+ 文本保留。
   镜面：`pending: { [会话键]: [{ text, ts }] }` 切片 = **宿主快照镜像**（写者 = `ev:queue` 归约；权威 = 宿主队列）；冷启 ∕ 重载重建 = `history:page` 回执 `queue` 键（首屏读）。
   落点：`thincoder-desktop/src/main/queued-input.mjs`（已落 · 实读 **117**——队列 + 计划取批：合并常量 8 ∕ 2000 与合并形态同 CLI ∕ VSC 值）· `thincoder-desktop/src/main/agent-host.mjs`（受理路由 + 续发链）· `thincoder-desktop/src/main/turn-face.mjs`（`consumeQueuedInput` 传参）；
   `thincoder-desktop/renderer/queue.mjs`（快照应用）· `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/events-subscribe.mjs`（`ev:queue` 订阅与归约）。
   判据：**机检** = 宿主用例（在飞提交 ⇒ 入队 + 回执形；第 9 条 ⇒ `queue-full` 零入队）+ 归约用例（快照整置 ∕ 消费回执）+ 计划面值对拍锁（与 CLI 副本同值）；
   **真机** = 忙态提交 ⇒ 气泡在场 ∧ 段 14 读数 = 1（**零 `busy` 拒面**）。
2. **消费两时刻（步边界注入 ∥ 回合尾送达）**——步边界 = 核循环头缝（`consumeQueuedInput`——**缝只接不改**）：用户回合传回调（系统轮 ∕ 消化轮不传；**timer 轮（`timerTurn` 真）同按 `autoTurn` 分流**——`autoTurn` 真 ⇒ 与消化轮同、缝不传，队列留待该轮回合尾续发）、取批按计划（首动作 `slash` ⇒ 不消费〔防御面〕）、注入 = `pushReal` 普通 user 消息（**不中断**：在飞工具 ∕ signal 零触碰 · 下一步生效）；
   回合尾 = 结算（三径同判据）后队非空 ⇒ 宿主**续发**（起跑前查在飞表——已有在飞 ⇒ 零续发；取批 ⇒ 普通回合送达，递归至队空）⇒ 队空才进既有挂起窗接管（**队列先于接管**）；会话中止（`dispose` ∕ 切项目）⇒ 队清 + 零续发。
   呈现（两时刻同形）：`ev:queue` 消费回执 ⇒ 待发送气泡退场 ∧ 同帧用户块入流（**同一位置交接**——标签由核原语回正常形）；段 14 读数随镜面。
   **渲染面回合尾 flush 携行随本批退场（`onTurnTail` 窄口存续——标题刷新消费面不动）**（双写者会造同条重复投递）。
   判据：**机检** = 宿主用例（步边界注入 ⇒ 历史尾 = `user` ∧ 批 ≥2 合并一次消费；结算后续发 ∕ 队空接管 ∕ 中止零续发）+ 归约用例（回执 ⇒ 气泡摘 + 尾块 = `user`）；**真机** = 忙态发两条 ⇒ 首条于下一步边界后可见（用户块 + 气泡交接）∧ 末条随回合尾送达。
3. **附件边界 = 留队（条目携图 · 步边界让位 · 送达面判决）**——条目可携 `images`（`{name,mime,dataURL}` 原样）；**批内含图 ⇒ 步边界不消费**（同步缝不可落盘 ∕ 降级）⇒ 留队待回合尾送达面：`prepareTurnAttachments`（既有面——落盘 ∕ 非视觉降级 ∕ 弃项）判决，降级码随消费回执 `delivered.degraded` 浮出（零静默）；气泡显示文本（图随条目走——两端同形；`dataURL` 不回传渲染面）。
   理由 = 端差默认消灭（VSC 条目携图 = 同语义面）；拆行 ⟹「文本引用附件被分离投递」内容错配；拒 ⟹ 阻塞用户意图 + 与 VSC 分叉。被否：拆行 ∕ 拒 ∕ 入队即落盘（VSC `savePastedImages` 形——桌面落盘面现只在送达点；入队即落盘 = 新落盘面 + 队清 ∕ 中止清理面；**登记消解径 = `docs/desktop/design/PROJECT.md` §10 BM**）。
   判据：**机检** = 宿主用例（携图条目 ⇒ 步边界不消费 ∧ 结算续发送达 ⇒ 附件面被调 + `degraded` 随回执）；**真机** = 忙态携图提交 ⇒ 气泡在场（文本）⇒ 回合尾送达后模型侧得图指引。
4. **形态零改面**：待发送气泡组 ∕ 段 14 ∕ 满队提示 ∕ 右列「队列」族席位——形态与既有判据零改，只换**来源**（镜面）；气泡标签两形态（`⏳` ∕ `❯ You:`）与交接同帧纪律照旧（本档 §1「本批注（对齐第二批 · 六件）」项 2）。
5. **边界（不做）**：斜杠文本入队门禁零改（计划面 `slash` ⇒ **步边界零动作**〔防御面原样〕）；**slash 首条尾径 = 回合尾「逐条直发」消费**（单条 · 保序 · 不合并 · 零静默丢——与桌面闲态同文本同语义；桌面无斜杠面〔需求 §3.5〕⇒「两处皆零动作」造死结不采纳）；队条目零编辑 ∕ 零撤回（既有）；队列 = 宿主运行期内存（重启即失）；挂起窗队列（`pushInput`）与忙态队**不合并**（两态两缝——窗内提交径零改）；通知面零扩档。

**D3 计数（本批）**：条目 = **B1–B3** 三条；形态行触碰 = 输入区行 + 表行 14 + 本档大批注项 2（机制句收正）；新通道 **1**（`ev:queue`——单源 = `docs/desktop/design/IPC.md` §1）；新档 **1** + 拆分产出 **1**（`thincoder-desktop/renderer/composer-send.mjs`（已落 · 实读 **70**）——在册预案本批落形）。

**本批注（R11 状态行 ⇒ CLI 对齐 · 2026-09-28）**：本注补本档 §1「状态栏」行的 **R11 状态行 ⇒ CLI 对齐**（该行已就地指针）；基准 = CLI 状态行（`thincoder-cli/src/tui/render-frame.mjs` `buildStatusLine` + banner 四态）；批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R11 + R11 补轮）。

1. **段间分隔** = CLI 形「段 │ 段」——每段自携前导（`::before`——CLI「每段自携」同构）；banner 四位 ∕ banner→后段 = 竖线紧贴前词（`PLAN│ AUTO`）；相邻段选择器 ⇒ 缺席段不落空分隔。
2. **字色**：base = `--fg` 50% 强度（⟷ CLI `dim`——`thincoder-cli/src/tui/ansi.mjs:31`）；警示段 = `--warn`（⟷ CLI 黄——同档 `:46` `fg(3)`）。
3. **banner 四位字色（补轮落）**：`auto` **复用 `--warn`**（黄——CLI 同一常量，不裂双黄）· `plan` = `--mode-plan`（青）· `advisor` ∕ `eng` = `--mode-advisor`（亮绿——两段同常量）；段码 ⟷ 槽三规则住 CSS（`thincoder-desktop/renderer/chrome.css:414-416`）；
   **两新槽**（亮 ∕ 暗两套值）住 `thincoder-desktop/renderer/theme.css`——值 = VSC 终端 ANSI 同码默认（`--mode-plan` = `#0598bc` ∕ `#11a8cd` · `--mode-advisor` = `#14ce14` ∕ `#23d18b`）。
4. **分隔两边缘面裁定**：① 换行时行首悬空 `│` —— **不采用**（由：段自携前导同构；修需 JS 测行 ∕ 改布局 ⇒ 越「段集 ∕ 段序 ∕ 段读数逻辑零改」边界；孤竖线与段间分隔同形同色、仅窄窗换行边缘可见——无误读风险）。② `.status-alert`（非段位）相邻条 —— **采用**（前邻（段 ∕ 告警位）在场才落条 · 行首零前导；落形 `thincoder-desktop/renderer/chrome.css:411-412`——两侧各 6px）。

**本批注（R12 会话流 ⇒ VSC 对齐 · 2026-09-29）**：本注补本档 §1「对话流」行的 **R12 会话流 ⇒ VSC 对齐**（该行已就地指针）；基准 = VSC `#messages` 消息面（`thincoder-vscode/webview/chat.css` + `thincoder-vscode/webview/history.js` 懒加载 ∕ `thincoder-vscode/webview/ui.js` 跟滚）；
批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R12 + R12 收口修复轮）；台账 #526。

1. **块壳 = 透明无卡壳**（无边框 ∕ 无底 ∕ 零内边距——原 1px 描边 ∕ 圆角退场）；D24 保留面 **`.block` 移出**（本档「本批注（外壳视觉降噪 · D24）」项 6 ∕ 项 7 同拍收正）。落点 = `thincoder-desktop/renderer/chat.css`。
2. **面宽 = 全型 100%**（有效值——VSC 基础行 90% 被 user ∕ assistant 两覆盖行落至 100%）· **块距 = 14px**（VSC `.message { margin-top: 14px }` 逐值——原 8px）。
3. **件级外边距（扁平块模型）**：件级层（VSC 件型各自 `margin`）在桌面扁平块模型下由**块级块距**承担 ⇒ 三覆写 = 工具 ∕ 错误 **8px** · 推理 **4px**（余型 14px）；助手文本内边距 `8px 0`（user `0`——VSC 同值）。落点 = `thincoder-desktop/renderer/chat.css`（R12 收口修复轮落值）。
4. **首块上距 = 14px**（骨架承担——`.flow` `padding-top: 14px`；左右 ∕ 下沿 = `--gap` 12px——与 VSC 同值）。落点 = `thincoder-desktop/renderer/chrome.css`（R12 收口修复轮落值）。
5. **滚动 ∕ 回填行为**（阈值 ∕ 判定 ∕ 补偿）单源 = `docs/desktop/design/RENDERER.md` §3 ∕ §4——本注不重述；证据 = 真机探针 **22 ∕ 22**（亮色 · `pageerror` 0——R12 探针留证）。

## 2. 活动池与状态位（需求档 §3.5 三项落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | 归组键 = 核 relay 前缀（`role#id`——`@thincoder/core/agent/relay-prefix.mjs`，扩展端已消费）；池内三条目族 = **活动块**（子代理 / advisor / consult——块面 = 核件同款（头行 + 状态词 + 内容 tail-3 + 展开）——「对齐第二批 · 六件」项 3）· **队列**（排队中回合 / 工具批）· **待审批**（计数 + 操作区，置顶）；折叠态按会话记忆。**落形**（批 A）= 三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）· 有会话三族皆空 ⇒ `empty`（**区域退场**——与 `none` 一致零子节点 · 锚值保留）· 否则 `pool`；**族序 = 待审批 → 活动块 → 队列**（族空 ⇒ 该族零节点）；折叠头两读数 = `running` / `approval`（`pool` 切片出；**非数 ⇒ 零节点**——禁假造；`store` 缺省 `running: 0` / `approval: 0` ⇒ 落 `0` 读数）· 折叠态键 = `poolCollapsed`（按会话记忆）· 控件锚 `data-action="pool:toggle"`；条目**内容回显 = 核件 tail-3 / 展开**（「对齐第二批 · 六件」项 3；块头读数 + 状态词——状态词出自 §1 闭枚举 **8 词**；**对齐第三批**：等待审批态（`approval`——本档 §1「本批注（对齐第三批 · 小修族）」P5））· **清点口径**（批 8 落）= 条目入池即在场（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status`）——**收束不摘除**（长会话池切片单调增长；**队列族例外**——出队即摘除〔该族「对齐第二批」后零写者 · 席位保留——见下「用户排队消息改住流内」句〕）；**用户排队消息改住流内（对齐第二批 · 六件 · 项 2）** = 忙态发送入队（写者 = `ev:queue` 归约——**`pending` 切片按会话分键** · 条目 `{ text, ts }`；「回合中插入」批收正：原 store 纯动作退场、权威 = 宿主）——**右列「队列」族不再承载用户排队消息**（席位**保留 · 零写者** ⇒ 族空零节点恒不在场）；出队 = 宿主消费两时刻（步边界注入 ∕ 回合尾续发——单源 = `docs/desktop/design/PROJECT.md` §2 KD-40；见本档「输入区」行）；**窗限 / 归档** = 工具行摘除 · 子块**归档 = 入流**（本档 §1「本批注（对齐第二批 · 六件）」项 5；**R10 收正**：出生即驻留 ∕ `settled` 终态留场 ∕ `done` 回收 ⇒ 归档入流 ∧ **池内退场**——区域回 `empty` 零子节点）；**可见面修复批修**：条目标签行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 五件）」项 4 · **重定位（对齐重定位批）**：工具调用行摘除、活动块族 = 子 agent 实例 → 本档 §1「本批注（对齐重定位）」项 2 |
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
| 9 | 状态词闭枚举 | **8 词**闭集（排队中 / 运行中 / 待审批 / 完成 / 已停止 / **已中断** / 错误 / 就绪——已中断 = 工具卡中止形（「对齐第三批」项 5）；就绪 2026-09-28 重审判定入集） | `thincoder-core/i18n.mjs:50-54`（运行中 / 排队中 / 已停止 / 完成 / 错误）· 需求档 §3.5（待审批位）· `thincoder-cli/src/tui/tui-state.mjs:43`（就绪——CLI 静息值 `Ready`，词形来源单列） | 本仓实读 |
| 10 | 用量警示 + 单点重建 | 上下文 ≥ 80% 转警示色；状态行单点重建（唯一 writer） | `thincoder-vscode/webview/status-bar.js:37`（≥ 80%）· `:62`（单点重建） | 本仓实读 |
| 11 | 审批卡形态 | 键 1 / 2 / 3 + **初始焦点目标** = 「拒绝」（标记锚 + `chat.css` 高亮；置焦执行 = 本批落——「对齐第三批」F-置焦）；大 patch 超阈 ⇒ 摘要 + 增删计数（**不采**外部查看器） | `thincoder-vscode/webview/permission.js:33` / `:37`（超阈先例）· `:50`（先例 = 外部查看器——本端**不采**）· `:76`（焦点 deny）；外部 = kimi-web `ApprovalCard.vue` | 本仓实读 + 外部转引 |

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
- 2026-09-27（**批 B 追加轮 · 首启空白态引导**——真机走查缺口）：§1 增「**批 B 追加注**」四项（引导面 · 动作控件 · 禁用判据不因引导而变 · 词键与计数）· 对话流行「`none` 态零节点」⇒「**零块节点** + 引导节点」· 输入区行禁用判据补「引导在场不解除」· 空态行改**三码分态**（`no-project` / `no-session` / `no-message`）· 启动态行「中区引导面延后」⇒「**在场**」。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2.12。
- 2026-09-27（**批 B 追加轮 · 修正轮**——设计评审 §3 轮次 1 逐号点修）：批 B 追加注前言「对话流 `none` 态零节点」旧记法收正为「**无引导节点**（零块节点）」；形态面判据不动（单源 = 本档 §1 批 B 追加注项 1）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.10。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**）：§1 批 B 追加注项 1 承档位「（拟新增）」⇒「**已落** · 实读 **54**」。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
- 2026-09-27（**可见面修复批 · 设计轮**）：§1 七处行补「**本批修**」指针（对话流 / 输入区 / 工具卡 / 审批呈现 / 计划面 / 项目级信息 + §2 项 1）+ 增**本批注**五项（#457 输入区样式落点与关键尺寸 · #458 用户块出泡 · #459 游标清点 · #460 文本段逐处形 · #461 信息行复读触发）。
  裁决 / 理由 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-24；明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2。
- 2026-09-27（**对齐重定位批 · 设计轮**）：§1 增**本批注（对齐重定位）四项**（状态行 15 段逐项裁定表 · 右列 = 子 agent 面板 · 会话流经核（含「零 Markdown」改判指针）· 会话面板元数据族）；四处行内指针（状态栏 / 对话流 / 左列会话行 / §2 项 1）· open 行摘「活动池窗限 / 归档」项（已裁）；核面单源 = `docs/render-core/design/RENDER-CORE.md`。明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2。
- 2026-09-27（**可见面修复批 · 修正轮 1**——设计评审 §3 轮次 1 逐号点修）：本批注项 1 分档理由改指 `docs/desktop/design/PROJECT.md` §4.1 分档先例句（原 KD-13 误指）·
  项 2 补非活动键径判据（零写 · `blocks` 引用不变）+「切回整置」收正为限定形（在飞回合内切回 ⇒ 随回合尾落盘后、于下次页读在场）+ 块位措辞统一「尾块（= 本回合首个块）」· 项 4 判据面二分（自动面 ∥ rect 测量归真机）；明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2.9。
- 2026-09-27（**对齐重定位批 · 设计评审轮 1 点修**）：本批注项 2 收正——终态折叠去 `stopped`（`⟦ev⟧stopped` ⇒ `cancelled` 先例兼容）· `error` 不载；补**数据链（宿主存活投影 2s 再断言——出生自愈）**。明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2.11。
- 2026-09-28（**R3 结算随动 · 设计面收正微轮**——承 `docs/batches/2026-09-27-render-core-r3.md` §1.3 / §1.4）：本批注项 2 内容分流口径收正（工具名仅作分流判据 · 块面无工具位——D20 单源）；项 3「换接核构件」⇒ 渲染逻辑单源（核件分件消费 · 桌面外壳留存）；§2 项 1 活动块粒度口径同笔。零新语义。
- 2026-09-28（**D21 会话流 / 会话面板视觉对齐批 · 设计轮**）：§1 增「**本批注（D21 · 视觉对齐）**」两项（内容面值表指针〔核档 §5〕· 会话面板映射表 **9 面** + 不追面七条）；对话流 / 左列会话行两行补「视觉对齐（D21）」行内指针；档头需求侧行 **D1–D16 ⇒ D1–D21**（同族书证随动）。
  值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（内容面 21 面）/ 本档 §1 本批注项 2（会话面板 9 面）；明细 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` §2。
- 2026-09-28（**SESSION-LIST-DISK 批 · 修正轮 1 收尾**——位标面收口随动）：左列会话行「运行 / 待审批位标面随对话流批」待落口径 ⇒ **实况两分句**（已落面逐项 ∥ 未落面 = 左列会话行位标；位标面注 = `docs/desktop/design/IPC.md` §2 会话族注项 4）。明细 = `docs/batches/2026-09-28-session-list-disk.md` §2。
- 2026-09-28（**桌面残余批（desktop-residuals）· 设计补写轮**——冻结解除后补落）：§1 增**本批注（D17 / D19 · 残余补齐）两项**（① 状态行恢复态播种——播种 2 / 不播种 10 逐段理由 + 触发点 / 载波 / 缺席降级；② 用户块 md 深度——端侧分流 `textFace` 按 `block.kind`）；
  状态栏 / 对话流两行补行内指针。明细 = `docs/batches/2026-09-28-desktop-residuals.md` §2。
- 2026-09-28（**D21 批 · 实施期设计前提收正**——面 9 行聚焦）：§1 本批注项 2 表第 9 行收正——VSC 实有 `.session-item:focus-visible`（`thincoder-vscode/webview/base.css:449-457`：`outline: 2px solid var(--accent); outline-offset: -2px; background: var(--hover-bg-strong)`）⇒ 桌面 `.rail-row:focus-visible` 照落同三值；
  实施期发现设计前提不实（原记 VSC 行无行聚焦样式 ⇒ 零新规则）· 父侧裁定收正 · 值源 = `thincoder-vscode/webview/base.css` 实读。明细 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` §2。
- 2026-09-28（**桌面残余批 · 设计评审轮 1 修正**——发现 1 / 3 / 4 逐号点修）：本批注单源句对齐（语义 / 契约 = `docs/core/design/SESSION.md` §6.24；载荷 / 在场 / 消费 / 降级 = `docs/desktop/design/IPC.md` §2；播种面裁定 = 本注项 1）· 项 1 补时序半句 · §1 各行「本批修」⇒「可见面修复批修」+「本批注项 N」补批名限定。明细 = `docs/batches/2026-09-28-desktop-residuals.md` §3。
- 2026-09-28（**状态栏对齐批 · 设计轮**——「屏面为准」重审）：§1 增**本批注（状态栏对齐 · 屏面为准）**（打开态段集 16 · 四项重审裁定 + 判据句 · 计数随动）；15 段表就地收正（行 1 旁置 ⇒ **承载**（四态上状态行）· 行 3 两态词 · 行 10 坐实 · 行 14 三态（含 `Enter: send`）· 行 15 逐件 · 计数行 12 ⇒ **16**）；会话头行回**三值**；状态栏行 / 残余注行内指针与段名随动。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**状态栏对齐批 · 设计评审轮 1 修正**——发现 1 / 3 / 4 / 7 / 8 逐号点修）：状态词行 6 词 ⇒ **7 词**（就绪入集——词形来源单列 = CLI 静息值 `Ready`；表行 3 / 本批注项 3 / §2 项 1 / §3 借用项 9 同笔）· 表行 5 / 7 / 8 / 12 四项改记**已落（R3a）** + 计数行同拍 · 段序定谳（CLI 判据句 + `STATUS_SEGMENTS` 单源；表列序 = 逐项裁定序）；
  播种面口径收正（**读数切片段 12**；banner 四段 = 非 seed 面——供面 = `flags`，每次页读皆携）· 本批注项 7 桌内翻转刷新改**并入本批**（`approval:respond` 成功径回执携 `{ key, flags }`；契约面单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 5）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**状态栏对齐批 · 收尾微轮**——评审轮 2 发现 2 + #490 逐项点修）：批 B 注项 1 残留括注收正 ⇒ **两态呈现面单源 = 状态行段**（指针 = 本档 §1「本批注（状态栏对齐 · 屏面为准）」项 2）；本批注（D17 / D19）项 1 补**播种只填空白**判据（切片已有活数据（非播种来源）⇒ 零写）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**第三态判据补句 · 父侧直接执行〔可 revert〕**——承实施座 view 面 #36 推导 + 父侧确认）：表行 3 / 本批注项 3 补「`approval` 在挂 ∧ 回合非忙 ⇒ **段零节点**（承载 = 注意力 chip）」——既有判据句两态外唯一的自洽读法（零新机制）。
- 2026-09-28（**账本可靠批 · 桌面微轮 · 设计轮**——F-L4 桌面端落点）：§1「左列会话行」行补**账本警示行**行内指针 + 增**本批注（账本警示面）五项**（触发与在场 · 形态与锚 `data-ledger-notice` · 词键 `rail.ledger.notice` zh / en 逐字 · 数据链 · 判据）；明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2 微轮块。
- 2026-09-28（**外壳视觉降噪批（D24）· 设计轮**）：§1 增「**本批注（外壳视觉降噪 · D24）**」九项（静息描边归零四族 · 交互态四值族 · 标签活动态 · 滚动条皮肤 · 设置面映射 · 保留面与本批不动 · 验收三件 · 计数 · open / 上抛）；
  标签条 / 会话头 / 输入区 / 设置面 / 主题五行补行内指针；档头需求侧行 **D1–D23 ⇒ D1–D24**。值面两层 = 静息（批档 §1.3 R1–R6 = mock V2）∥ 交互态（本注定形）；明细 = `docs/batches/2026-09-28-desktop-shell-denoise.md` §2。
- 2026-09-28（**状态栏对齐批 · flags 供面口径修订轮**——实施座实测上抛 + 父侧裁定）：本批注（状态栏对齐 · 屏面为准）项 2 供面句 + 判定句收正 = **活值优先 / 槽投影**（agent 不在场 ⇒ 槽字段投影〔与 D17 `seed` 同源同形〕；槽亦读不出 ⇒ 键缺席）；
  同拍 = 表行 1「活值口径」标签 · 本批注（D17 / D19）项 1「模式四位」bullet；项 3 行折行（329 字符 ⇒ ≤300）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**对齐第二批 · 六件 · 设计轮 · eng-designer**）：§1 增「**本批注（对齐第二批 · 六件）**」（A1 推理钉底 · A2 排队流内 + 队列按会话分键 · A3 子 agent 核件同款（内容回显）· A4 说话人标识 · A5 折叠 + 归档入流 · A6 右列 18rem ⇒ 36rem）；
  四处行内随动 = 对话流（指针）· 输入区（入队即出泡 / 分键 / 取文本面 / 可见失败面）· 状态栏段 14 源（本会话队）· §2 项 1（队列族席位 + 用户排队消息改住流内）；
  本批注（可见面修复）项 2 与（对齐重定位）项 2 的口径**就地撤销**（入队径出泡 / 内容零回显 / 归档清出三句）；open 行登记池面窄窗态。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**账本可靠批 · 报告面收正轮 · eng-designer**）：本批注（账本警示面）项 1 收正——「异常清 ⇒ 注记消失」⇒ **两腿**（`scene` 腿 = 现场清 ⇒ 消失（零历史态）∥ `refused` 腿 = 核本进程累计 ⇒ 在场至重启（有界）；单源 = 核 `ledgerHealth(cwd)`）· 本批注（D17 / D19）项 1 载波句「播种只填空白」判据收正为**切片键已在场（无论来源）⇒ 零写**。明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2.12。
- 2026-09-28（**外壳视觉降噪批（D24）· 修正轮 1**——评审轮 1 发现 1–8 逐号点修〔发现 9 = 需求档侧 · 父侧已落〕）：本批注坐标重校准（`styles.css` **467 ⇒ ≈485** · 后半段 8 处 +4 换号）· 保留面负向锁拆**两值列**（accent = `.approval-card` / `.question-card` / `.rail-rename-input`；`--line` = `.composer-input` / `.block` / `.plan-card` / `.rail-row`）；
  `.chat-pill` 实色支补全（hover / 按下 = `var(--bg)` · 聚焦底不随落）+ 聚焦第三值 `background: var(--hover-bg-strong)` 补全（`.head-field` 特例随动）· `.rail-rename-input` 入保留面（输入框细边族）· 设置面计数改记 **9 面（6 改 + 3 保留）**；
  滚动条真机判据补前提 / 两支形 · 旧批注（可见面修复）三处收正 + 取代指针。明细 = `docs/batches/2026-09-28-desktop-shell-denoise.md` §2 修正轮 1 块。
- 2026-09-28（**桌面空闲唤醒批 · 门控解除随落 · eng-designer**）：§1 状态栏行补**段 3 第三态 = 挂起句**（值 zh = CLI 逐字 ∥ en = VSC 逐字；词键 / 值单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；
   §1 对话流行补**流内消化行族**（`[data-digest]` 非块节点组 · 词面直取核字典 `digest.*`）；明细 = `docs/batches/2026-09-28-desktop-idle-wake.md` §2。
- 2026-09-28（**桌面功能对位批 · 设计面收正轮（fix · #129）· eng-designer**——承 flow 批 R11 补轮 ∕ R10 两单交付）：§1 状态栏行 + 新增「**本批注（R11 状态行 ⇒ CLI 对齐）**」（段间分隔 ∕ 字色 ∕ banner 四色 + 两新槽 ∕ 分隔两边缘面裁定——规格原只住 CSS 注释）；
  §2 项 1 收正两处（`empty` = **区域退场**——与 `none` 一致零子节点 · 锚值保留〔R10 E2〕· 生命期 = 出生驻留 ∕ `settled` 留场 ∕ `done` 归档入流 ∧ 池内退场〔R10 E4〕）；「对齐第二批」项 3 `.sub-desc` 判据改**存差登记（待裁——消差 ∕ 保留）**（会话级 ⟷ VSC 面板级；归档回显不带该行）。明细 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2。
- 2026-09-28（**对齐第二批 · 修正轮 1**——设计评审 §3 轮次 1 发现 1 / 4 / 5 / 11 / 12 逐号点修）：§1 对话流行「**块五型** ⇒ **块六型**」（+ 运行期块 `subagent`）· 项 2 导出清单收正（`clearPending` 移入不消费）；§2 项 1 行两处残留句收正（内容回显 = 核件 tail-3 / 展开 · 归档 = 入流）；
  项 5 边界补**运行期块记账**指针 · 计数行补**拆分产出 2**。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**对齐第二批 · 复核轮收正轮 · eng-designer**——承批档 §3 轮次 3）：失效表述残体清（§1 项 3「（零内容回显）」描述 / 项 5「原口径…退场」句 / §2 项 1「收正：原…撤销」句——历史归本记录面 / 批档）；核件取词接线改述 = **注册单点** `thincoder-desktop/renderer/app.mjs`（判据单源 = `docs/desktop/design/SHELL.md` §1）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**桌面空闲唤醒批 · 评审轮 1 修正 · eng-designer**——发现 3 / 8 逐号点修）：表行 3 收为**段 3 完整态机**（挂起句 ∕ 零节点 ∕ 运行中 ∕ 就绪 + 优先序 + 交叠角落 + N/M 映射——单源）；「第三态」命名收正（挂起句支 vs 零节点支）；§1 状态栏行判据收正（`active ∧ n>0` ⇒ `active` 真 + 三键条件组装）· 本批注项 3 指针随动。明细 = `docs/batches/2026-09-28-desktop-idle-wake.md` §2。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 设计轮 · eng-designer**）：§1 增「**本批注（对齐第三批 · 小修族 25 + 相抵 2）**」（对话流 12 项 / 外围 13 项 / 相抵 2 项 / 重核入本批 2 件 / 计数 / open）
  + 行内指针随动九行（对话流 / 工具卡 / 会话头 / 输入区 / 审批呈现 / 提问呈现 / 设置面 / 左列会话行 / 空态）；状态词行 **7 ⇒ 8 词**（+ 已中断）· 借用项 9 同拍 · open 行摘「审批卡置焦执行」（入本批落地）补「台账行周期刷新」· 设置面行「零 Esc 绑定」⇒ Esc 关闭（重核处置）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §2。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 修正轮 1 · eng-designer**——评审轮 1 逐号点修〔1–15〕）：置焦状态句 ⇒ **本批落**（审批呈现行 / 键盘可达行同源）· §2 项 1 状态词 **7 ⇒ 8 词** + P5 指针 · 项 6 / 项 12 两处「视图两档」点名（`views/chat.mjs` + `chat.css`）· C2 补 `data-path` 锚 · F 块两件补判据（F-置焦 / F-Esc）。明细 = 批档 §2 修正轮 1 块。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 微收正轮 · eng-designer**——承批档 §3 轮次 2 新发现 **#18**）：§1 本批注 D.计数收正——「新档 **1**」⇒「新档 **1** + 拆分产出 **1**」（第二档 `renderer/i18n-views.mjs`（拟新增）入计；单源 = `docs/desktop/design/PROJECT.md` §4.2）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §3 轮次 2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2）：§1 本批注项 1 表行 12（计时）补**触发落流 `ev:timer`**（单源 = `docs/desktop/design/IPC.md` §1）；新鲜度指针随动（`docs/render-core/design/RENDER-CORE.md` §10 F 行——到期不滞留）。**段集 / 计数零变**（承载 16 段不动）。
- 2026-09-28（**回合中插入批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-midturn-input.md` §2 · 台账 #509）：§1 增「**本批注（回合中插入 · 步边界 pickup）**」五项（队列单源 = 宿主 ∕ 消费两时刻 ∕ 附件留队 ∕ 形态零改 ∕ 边界）+ D3 计数；
  行内随动三处：输入区行（忙态交宿主任判 + flush 退场 → 指针指向本注）· 表行 14（源 = 镜面）· 「对齐第二批」项 2（机制句与队列归属收正——原「三纯动作 + 回合尾 flush」段随本地队列退场）；决策单源 = `docs/desktop/design/PROJECT.md` §2 KD-40。
- 2026-09-28（**回合中插入批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #29 发现 #2）：「对齐第二批」项 2 **旧版重复段清除**（原 `:307–318`——上一笔声称已随本地队列退场而实际残留；本次删净，历史归本记录面）；四处语义已对齐 KD-40 与项 3。明细 = `docs/batches/2026-09-28-desktop-midturn-input.md` §4。
- 2026-09-28（**回合中插入批 · 评审轮 2 修正（父侧直接执行 · 可 revert）**——承评审 #31 发现 #2 ∕ #3 同族扫）：档头 D1–D24 ⇒ **D1–D25**；`onTurnTail` 窄口语义对齐（只退 flush 携行——RENDERER 单源）；同族 flush 残体三处（`:85` ∕ `:379` ∕ `:459`）收正。明细 = 批档 §4。
- 2026-09-28（**对齐第三批 · 实施途中裁定（父侧直接执行 · 可 revert）**——舱 C ask 裁决）：P14 行「空 / 非数 ⇒ 删键」⇒ **零发送**（真删键在 `patch` 链不可达——`docs/desktop/design/IPC.md` §2 + 核类型表；端差登记 = VSC 删键 ∕ 桌面零发送；消解路 = 另批）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1.17。
- 2026-09-28（**对齐第三批 · 实施后收正（父侧直接执行 · 可 revert）**——承舱 C §5③④ 披露）：P15 第十键 `advisor.effort` ⇒ **`advisor.reasoningEffort`**（依据 = 核 `config.mjs:49` ∕ VSC 写面死键注）；设置面行 ∕ F-Esc 项两处绑定宿主「面板根 `keydown`」⇒「`document` 级 `keydown`」（实落形 + E2E 为证）。明细 = 批档 §1.18-3。
- 2026-09-29（**退役面本体收正轮（fix · eng-designer）**）：§1 标签条行退役；左列会话行 ⇒ **会话控制面**行重写；项目级信息 ⇒ **项目级读数**；布局 ∕ 断点 ∕ 交互 ∕ 状态栏 ∕ 设置面 ∕ open 行随盘收正；测试承载残引逐处退役；档头 **D1–D26**。明细 = 批档 §2。
- 2026-09-29（**R12 设计面同步轮（fix · #26 · eng-designer）**——承 flow 批 R12 §5.15 未办 5）：§1 对话流行新增「**本批注（R12 会话流 ⇒ VSC 对齐）**」+ 行内指针；本批注（外壳视觉降噪 · D24）项 6 ∕ 项 7 保留面收正（`.block` 移出——R12 F1；`.rail-row` ∕ `.rail-rename-input` 清出——R13-A 退场对位）。明细 = 批档 §2。
