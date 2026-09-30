# 桌面端（DESKTOP）· 界面形态与交互

> 板块 = **桌面端界面形态与交互面**——布局 / 断点 / 会话控制面 / 状态词 / 交互键位 / 对话流 / 输入区 / 状态栏 / 审批呈现 / 提问呈现 / 计划面 / 工具卡呈现 / 空态 / 启动态 / **项目级读数 / 设置面 / 首启向导** / 主题 / 键盘可达 / i18n，以及本会话活动池与状态位。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D27 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：有界渲染窗口 / 回填与跟滚 / 流式增量等**实现工艺** = `docs/desktop/design/RENDERER.md` · 进程与目录形态 = `docs/desktop/design/SHELL.md` · 通道与载荷 = `docs/desktop/design/IPC.md` · 总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∕ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 界面形态落定（UI / 交互决策）

| 面 | 决策 |
|---|---|
| 布局 | **两列**：中区 = 会话（会话控制条 + 对话流 + 输入区）· 右栏 = 活动池（可折叠，折叠态按会话记忆）；骨架 = `thincoder-desktop/renderer/index.html`（状态栏 = 窗口级底行——见「状态栏」行）；**扁平化（2026-09-30）**：框架全铺满（区间距归零）——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」项 1 |
| 断点 | **零断点**——原单断点（900px 折叠，首版初值）随会话模型轮 R13 左列裁撤消解（余两列无折叠行为；单源 = `thincoder-desktop/renderer/chrome.css` 档头注）；池面窄窗态 = open 行另载 |
| 状态词 | **闭枚举 8 词**：排队中 · 运行中 · 待审批 · 完成 · 已停止 · **已中断** · 错误 · 就绪（前 6 词词形与核 i18n / 需求档同源；**已中断** = 工具卡中止形（词键 `tool.interrupted`——值逐字同 VSC locales；本档 §1「本批注（对齐第三批 · 小修族）」项 5）；**就绪**词形来源单列 = CLI 静息值 `Ready`——`thincoder-cli/src/tui/tui-state.mjs:43` 实读，核 i18n 无同源词，2026-09-28 重审判定入集）——界面各处（工具卡 / 活动块 / 回合 / 状态行）取词一律出自本集，不得自造词；与 §2 项 2 的标签位集合（位标面）分属两面，不得互相顶替 |
| 交互 | Enter 发送（**IME 组字中不发送**——`isComposing` 真 ∥ `keyCode === 229`（老 WebView 兜底臂）⇒ 键归输入法（两臂同径 · 判据单源 = `thincoder-desktop/renderer/mount-composer.mjs:41-43`）；先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`） · Shift+Enter 换行 · 会话控制面键面 = 选择器 Enter ∕ Space 开合（**改名形内让行**——单源 = 本档 §1「会话控制面」行） · **Ctrl+F 会话内搜索**（搜索条开合 · 命中高亮 ∕ 上下跳 ∕ Esc 关——键位注册住核件工厂 `thincoder-render-core/search.mjs`，两端同件单源） |
| 对话流 | **三态**（`data-state`）：无活动会话 ⇒ `none`（**零块节点** + 引导节点——**禁假数据**；引导面 = 本档 §1「批 B 追加注」项 1）· 有会话零块 ⇒ `empty`（词表提示）· 有块 ⇒ `flow`；**根锚全量**（四锚：`data-state` / `data-blocks` / `data-hidden` / `data-following`——语义 = 三态码 / **已渲染块数** / 未渲染更早块数（产出规则 = `docs/desktop/design/RENDERER.md` §2）/ 是否跟滚 `"1"` / `"0"`）；**块六型**（`user` / `assistant` / `reasoning` / `tool` / `error` / `subagent`——**六型全员入页读域**（留档批 · #719：`subagent` = **留档块**——恢复自人读线记录；前五型原样），单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）单序列、每块 `data-block-id` + `data-block-kind`，文本面 = **经共享渲染核呈现**（Markdown 单源 = 核 `md`——含全量转义闸；真代码块 / 推理块 / 复制面 = 本档 §1「本批注（对齐重定位）」项 3）；**错误卡** = 回合级错误块（工具级错误 = 工具块 `status="error"`——**不经 `ev:error`**：该通道单义 = 宿主回合结算〔错误径〕，单源 = `docs/desktop/design/IPC.md` §1 `ev:error` 行）；**挂载根 = 滚动容器 `[data-slot="flow"]` 自身**（clear + build + append 不清宿主 ⇒ 滚动位置存活）；**摘要块**（未渲染更早块 > 0 ⇒ 首子，词键 `chat.summary.older`）· **药丸**（`!following` ⇒ 尾随，词键 `chat.pill.new` / `chat.pill.bottom`）；窗口 / 回填 / 跟滚三事住 `docs/desktop/design/RENDERER.md` §2 / §3 ∕ 更新纪律（帧合并 · 收核）住 §1.2；**复制面 = 核件代码块 Copy 钮（唯一）**——自建两枚 ⧉ 控件退场（本档 §1「本批注（复制面对齐 VSC · 2026-09-29）」）；**真代码块（围栏切分 · 高亮 · 代码块级复制）随核落**（本档 §1「本批注（对齐重定位）」项 3）；**可见面修复批修（可见面五件）**：用户块受理即出 → 本档 §1「本批注（可见面修复 · 五件）」项 2 · 流式游标清点 → 项 3；**视觉对齐（D21）**：内容面值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（21 面 · 外壳零动）；**用户块 md 深度（D19 · 残余补齐）**：`user` ⇒ `mdInline` ∥ `assistant` / `reasoning` / `error` ⇒ 全量 `md`（端侧分流——本档 §1「本批注（D17 / D19 · 残余补齐）」项 2）；**对齐第二批**：说话人标签行 / 归档子 agent 块——本档 §1「本批注（对齐第二批 · 六件）」项 4 / 5；**桌面空闲唤醒批**：挂起窗消化轮 ⇒ **消化行族 `[data-digest]`——逐轮非块节点元素 · 流内就地**（沿 `[data-pending]` 先例：零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式）；**每轮三行**（起跑标签行 + `n > 0` 计数行 + cap 行）——**行入流（与内容同生态）**：无专门「摘 ∥ 留」处理（`start` 帧落流末、随流滚动；`end` 就本轮原地更新；`n = 0` 轮零计数行——沿 VSC `.digest-status` 规则）；**留档（留档批 · #719）**：重建按记录位次复列（自**人读线 `digest` 记录**——段界可辨；刷新 ∥ 重载 ∥ 切走切回均在）；未结末轮保（运行期切片承接）；**词面 = 核字典 `digest.*` 经 `t()` 投影直取**（**零新键** · 值同源零复制）；形态 / 落位 ∕ 归档锚单源 = `docs/desktop/design/RENDERER.md` §1.1 流内非块节点族条 ∥ 插入点纪律条；通道面 = `docs/desktop/design/IPC.md` §1 `ev:digest`；**对齐第三批**：恢复帧次序 / `[stopped]` 痕 / 错误横幅（详情 + 重试）/ 台账行 / 发送后回底 / 空态欢迎条 / **turnBreak 子回合边界**——本档 §1「本批注（对齐第三批 · 小修族）」项 8 / 6 / 9 / 12 / 13 / 15 / 7；**R12 会话流 ⇒ VSC 对齐（2026-09-29）**：块壳透明 ∕ 面宽 100% ∕ 块距 ∕ 件级外边距与首块上距 ∕ 扁平块模型——本档 §1「本批注（R12 会话流 ⇒ VSC 对齐）」；**间距现值 = 本档 §1「本批注（流内竖向间距 · 2026-09-30）」**；**扁平化（2026-09-30）**：块壳 ∕ 盒面圆角归零 ∥ 相邻零分割线——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」 |
| 输入区 | 中区底行（挂载根 = `index.html` 新增单容器 `[data-slot="composer"]`——`.session` 内、对话流之后）；**两态**（沿接线通则）= 有活动会话 ⇒ 可用 · 无 ⇒ `disabled: true`（锚恒在——**禁用判据恒 = 活动会话在场：需先选工作目录**（需求档首启链 = `docs/desktop/requirements/PROJECT.md` §3.3）；引导面在场**不解除**禁用——见本档 §1「批 B 追加注」项 3）；键位 = Enter 发送 / Shift+Enter 换行（键位单源 = 本档「交互」行）；**发送失败**（`msg:send` `ok` 假 ∥ 抛）⇒ **文本保留** + `console.error`（零静默丢字）；**附件条（批 B 落）**——形 / 锚 / 降级面 / 清条与保留判据 = 本档 §1「批 B 注」项 2；**忙态提交** = 回合在飞 ∕ **挂起窗** ⇒ **一律交宿主任判**（受理判据单源 = 宿主在飞表 ∕ 挂起窗在场；渲染面**不再本地判忙入队**）——受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **消费前流内零块**（待发送件住**输入区上方带**——派生；消费时刻才入流恰一枚——本档 §1「本批注（回合中插入 · 步边界 pickup）」项 1 ∕「本批注（挂起窗径 · 2026-09-29）」）；满队**三面**（各判据单源 · 通道范围分列）：① **提交守卫 toast**（词键 `input.slotFull`——核件面板提交守卫 `thincoder-render-core/composer/panel.mjs:304-306`：忙态 ∧ 镜像计数（宿主快照 + 本地先行增量）≥ 容量 8 ⇒ 不出泡 + 不清框 + toast——**`msg:send` 忙态径**）；② **回执失败行**（宿主回执 `{ ok: false, reason: "queue-full" }` ⇒ 失败行（词键 `composer.send.failed`）+ **本地块退流 + 稿留输入历史（`↑` 召回）**——**`msg:send` 忙态直发径**）；③ **cap 待答径 toast + 文本回注**（`msg:interrupt` 回执 `{ ok: false, reason: "queue-full" }` ⇒ 核件 toast `input.slotFull` + 文本回注输入框〔零丢失〕——**cap 询问待答径**；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-52**）；**队列单源 = 宿主**（快照镜面——**两源：忙态队 ∪ 挂起窗输入队**；消费时刻 ∕ 附件边界 = 同注项 1–3；窗径附件 = 载具层携图——见「本批注（窗队列 VSC 逐点对齐 · 2026-09-29）」）；中断键 = `data-action="msg:interrupt"`（零乐观写）；**可见面修复批修**：样式落点与关键尺寸 → 本档 §1「本批注（可见面修复 · 五件）」项 1 · 出泡时刻 → 项 2 · **外壳降噪（D24）**：`.composer` 顶线**显形保留**（现值——唯保留线）+ 输入面板控件静息无描边（单源 = 核件 `composer/composer.css`）——本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2；**扁平化（2026-09-30）**：输入区上线保留 ∥ 按钮族圆角恢复 ∥ 主输入框保持方 ∥ Attach ∕ Send（∥ 忙时 Stop）迁控件行右端——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」；**对齐第三批**：非栅格拒时机 / 发送失败可见性 / 中断键两态——本档 §1「本批注（对齐第三批 · 小修族）」P22 / P26 / P28；**复制面对齐 VSC 批（2026-09-29）**：输入区尾控件 ∕ `[data-composer-tail]` 尾锚退场——本档 §1「本批注（复制面对齐 VSC · 2026-09-29）」项 2；**模型菜单全渠批（2026-09-29）**：控件行「模型」钮（核件 `#model-btn`——`thincoder-render-core/composer/controls.mjs:45` + `model-menu.mjs` 两级菜单 · 核件零改）候选面一级 = **全渠**（= `model:catalog` 载荷 distinct provider 聚合——配置序）；**失败渠零行**（菜单内不造失败行——VSC 同行为）；触发六径（装配首跑 ∕ `ev:config` ∕ provider 写成功 ∕ 失败渠有界重探 ∕ 会话切换重推〔零取数〕 ∕ 无已配渠零推送）单源 = `docs/desktop/design/IPC.md` §2「模型清单注」；**@ 文件引用对齐批（2026-09-29）**：输入文本注入 ∕ 恢复面剥离 ∕ 标题剥离三面链 = 本档 §1「本批注（@ 文件引用对齐 · 2026-09-29）」（决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-51**）；**撤会话头随动（2026-09-29）**：**三值（provider / 模型 / 推理档位）唯一居所 = 本面控件行**（模型钮（两级：渠道 → 模型）∕ 推理钮——写路 `session:prefs`；语义单源 = `docs/desktop/design/IPC.md` §2「会话级偏好注」）；忙态写门 = 模型 ∕ 推理钮 `disabled`（**保位不隐藏**——门住核件面板，VSC 同件） |
| 状态栏 | **位置 = 窗口级底行**（`.app` 第 3 子元素 · 跨两列——两列框外一行；骨架 = `thincoder-desktop/renderer/index.html:39`；地面 = 需求档 §3.1 图 `:42`）+ 活动会话上下文占用（实时读数——**供给面 = `ev:usage` 事件**（批 B 落）；**≥ 80% 转警示色**）+ 非活动会话的待审批 / 运行提示（跨会话告警位）——两处皆**单点重建**（状态行唯一 writer）；**落形** = 告警位取值 = 非活动会话位标码（待审批 / 运行中——与会话控制条目位**同源同词**，优先序消费 = 位标切片单源，不由本面复制）；**读数供给（批 B 落）** = 活动键 `ev:usage` 读数（**未至 / 非正数 ⇒ 零读数节点**——禁假造）；读数按会话 `key` 归约、切标签随动（形 = 本档 §1「批 B 注」项 3）；**17 段逐项裁定表**（承载 / 旁置 / 不适用，零静默省略——裁定（对齐重定位批）= 本档 §1「本批注（对齐重定位）」项 1；**定形 = 17 段**——本档 §1「本批注（状态栏对齐 · 屏面为准）」＋「本批注（停滞轻显形 · 2026-09-29）」）；**恢复态播种（D17 · 残余补齐）**：打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（`tasks` 直取 ∥ `context` 打开态读数；播种 2 / 不播种 11 逐段理由——本档 §1「本批注（D17 / D19 · 残余补齐）」项 1）；**桌面空闲唤醒批**：段 3 状态文本**第三态 = 挂起句**——判据 = 挂起窗在场（`susp[<会话键>].active` 真）⇒ 段文按 `susp.*` 三键条件组装（N/M 映射 / 优先序 / 交叠角落单源 = 本档 §1「本批注（对齐重定位）」项 1 表行 3）；`active=false` ⇒ 回落两态词（**禁假造**）；值 = **zh 取 CLI 逐字 ∥ en 取 VSC 逐字**（键名 / 值 / 落表单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；源 = `ev:susp` 计数切片（通道行 = 同档 §1）；跨会话告警码集保持 `{approval, running}`（`done` 不入——「完成非告警面」既有裁定；跨会话可见靠会话控制条目位标）；**R11 状态行 ⇒ CLI 对齐（2026-09-28）**：段间分隔 ∕ base dim ∕ banner 四色（两新槽 ∕ 三规则）∕ 分隔两边缘面裁定——本档 §1「本批注（R11 状态行 ⇒ CLI 对齐）」· **停滞轻显形（2026-09-29）：新增 `quiet` 段（承载 17 段）**——序 = `elapsed` 之后；本档 §1「本批注（停滞轻显形 · 2026-09-29）」；**桌面状态行 ⇒ CLI 补漏（2026-09-29）**：段 9 上下文 ⇒ CLI 形（含上下文令牌）· 段 11 台账 ⇒ 常驻计数（核 marker）——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」 |
| 审批呈现 | 流内卡片（主）+ 本会话活动池计数 + 会话控制条目位（同一待决项三种视图）；**落形**（批 A）= 卡为流内**独立节点**（根锚 `data-card="approval"` + `data-prompt-id` + `data-shape`，值域 `single` / `batch`；根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]）；**两形键位**：逐项形 `1` / `2` / `3` ⇒ `once` / `always` / `reject`，批形 ⇒ `approveAll` / `deny` / `oneByOne`（表外键 ⇒ **零动作 · 不吞键**——实现 = 纯函数 `verdictOfKey`）；三出口锚 = `data-action="approval:<verdict>"` + `data-key="1\|2\|3"`；**初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）——落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）= 本批落**——帧尾对 `[data-autofocus="1"]` 执行 `focus()`（「对齐第三批 · 小修族」F-置焦）；**核卡直消费（处理流 R1 换接——端差清算批收正）**：卡体（首行 ∕ `.diff-preview` 全量渲染 ∕ 三出口） = 核件 `thincoder-render-core/cards/permission.mjs` 直取（端壳胶水 = 出站桥 ∕ 锚装饰 ∕ 键位胶水 ∕ 置焦锚 + 大 diff 钮处置——`thincoder-desktop/renderer/views/approval.mjs`）；`.view-diff`（核 `diffBig` 时在场）端处置 = 唯单径（`diff.path`）留钮走 `file:open`、`apply_patch` 形 ⇒ 钮退场（零死控）；出口点按 ⇒ 通道 `approval:respond`（载荷见 `docs/desktop/design/IPC.md` §2），**零乐观写**（待决项清除归事件面）；**对齐第三批**：owner 归属（子代理门）/ diff 预览 / 真置焦执行——本档 §1「本批注（对齐第三批 · 小修族）」P1 / 相抵① / F-置焦 |
| 提问呈现 | 流内卡片（`question` 工具）——**决策面**；**不入池三族**（池 = 本会话面 ⇒ 不添跨会话可见性）；**跨会话可见面 = 会话控制条目位**（需求档 §3.1「不静默等待」兑现面）——待作答 ⇒ 该会话位标含 `approval` 码（与审批门**同码同词**——显示词 / 优先级单源 = 本档 §2 项 2）· 出场 ⇒ 清码（判据同卡退场）——**码位两面（点名）**：置位面 = **归约面**（`thincoder-desktop/renderer/events.mjs` `onQuestion`——`ev:question` 写切片同处按**同码闭集**置位，**与 `onApproval` 同形**）· 清位面 = 出口面（`thincoder-desktop/renderer/mount-cards.mjs` 回执 `ok` 真）∥ 事件面（`stopped` 终局摘项同处）；同面缺口（置 / 清键源不同住一档——既有登记）**批 A 收正** = 置 / 清两面同住归约面（置位面 `onQuestion` = `thincoder-desktop/renderer/events.mjs:161`；清位面 `clearQuestion` = `:329` ∥ 审批径 `clearApproval` = `:316`；门名单单源 = `thincoder-desktop/src/main/suspensions.mjs:67` `denyGates`）——零新机制；**落形** = 卡根 `data-card="question"` + `data-prompt-id`（待决项身份 / 路由键，与 `ev:question` 同源同值）；子序 = 题干行 → [给答项操作区?] → 作答区；**给答项**（`options` 非空）逐项 = `data-action="question:<i>"`（i = 1 起）+ 词 = 选项串原样（**零构造**）；**自由作答** = 文本控件 + 提交键 `data-action="question:answer"`；取消 = `data-action="question:cancel"`；出口 = `question:respond`（`answer` = 选项串原样 ∥ 输入串 ∥ 取消 ⇒ `null`——挂起表按取消串 `(user cancelled)` 结算，串单源 = `thincoder-desktop/src/main/suspensions.mjs`；回执 `null` ∥ 工具结果串两域界限 = `docs/desktop/design/IPC.md` §2 `question:respond` 行）；**卡退场判据** = 回执 `ok` 真（非乐观写——失败 ⇒ 卡仍在场可重试 + `console.error`）；**中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清码（判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条）；**对齐第三批**：Enter 提交 / 聚焦两态——本档 §1「本批注（对齐第三批 · 小修族）」P2 / P3 |
| 计划面 | 流内**独立节点**（`ev:task` 面——工程模式 `task` 工具的事项表）· **落形** = 卡根 `data-card="task"` · 逐行 = 事项标题 + 状态词（`pending` ⇒ 排队中 / `in_progress` ⇒ 运行中 / `done` ⇒ 完成——出词本档 §1 闭枚举）；**同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）；**空列表 ⇒ 卡不在场**（`items` 空 ⇒ 零节点）；通道面 = `docs/desktop/design/IPC.md` §1 `ev:task`；**可见面修复批修**：行两段逐段包元素（`space-between` 生效）→ 本档 §1「本批注（可见面修复 · 五件）」项 4 |
| 工具卡 | 名称 + 参数摘要 + 状态（**词 = 状态词闭枚举**；锚 = `data-status`）+ **耗时**（`ev:tool-result` 载荷——`docs/desktop/design/IPC.md` §1；仅完成 / 错误态且数在时落）+ 可展开结果（**折叠默认态**：错误展开、其余折叠；显式 `expanded` 优先；无结果 ⇒ 头为纯展示行零控件）+ **改动摘要**（文件 + 增删行数，纯文本，不做 diff）；**大 patch 降级** = 超阈（**> 200 行 或 > 10 文件**）只给摘要 + 增删计数，**不启用外部查看器**（文件视图 / 编辑器本体 / 内置 diff 在本版边界外——`docs/desktop/design/PROJECT.md` §8）；**可见面修复批修**：头行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 五件）」项 4；**对齐第三批**：结果摘要行 / 失败判据红绿 / 运行期实时输出 / 中止清扫 / advisor 轮次标签——本档 §1「本批注（对齐第三批 · 小修族）」项 1 / 2 / 3 / 5 / 14；**轻通道轮二（2026-09-30）**：盒底 = **透明** ∥ hover 反馈 = 头行既有面（用户「不要背景了，只要hover上去有反应就行了」；台账 #722） |
| 空态 | 无会话 ⇒ 会话控制面新建钮 + **中区引导（三码分态 · `data-guide` 闭集）** = 无项目 ⇒ `no-project` · 有项目无会话 ⇒ `no-session` · 有会话零块 ⇒ `no-message`（该码 = 既有空态节点，文本 `chat.empty.hint` 不变）；无 provider ⇒ 引导向导；形 / 锚 / 动作 / 词 = 本档 §1「批 B 追加注」项 1 / 项 2 / 项 4；**对齐第三批**：`no-message` 帧欢迎条（抬头 / 文案 / 快捷键行）——本档 §1「本批注（对齐第三批 · 小修族）」项 15 |
| 启动态 | 无当前项目 ⇒ 打开目录入口 = 会话控制面**项目钮**（`project:open`——恒在场，词面经 `aria-label`；R13 后原左列入口面退场）· **中区引导面在场**（`data-guide="no-project"`——落点 = 对话流挂载根；见本档 §1「批 B 追加注」项 1）· **parity-b10-ui 增（首屏引导门 · R1）**：`data-boot ≠ "ok"` 期间引导层在场 ∕ `"error"` ⇒ 错误面（可读原因）∕ `"ok"` ⇒ 撤——形 / 锚 = 本档 §1「本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）」项 8 |
| 会话控制面（VSC 形 · 会话模型轮 R13） | 条体三件 = 项目钮（`project:open`——恒在场，词面经 `aria-label`）→ 下拉选择器（标签 = 活动会话题；`title` 空 ⇒ 词表缺省词；开合锚 = `aria-expanded` + 下拉 `data-open`；Enter ∕ Space 触发）· **改名形内键面让行**（形内 `[data-form="rename"]` 的 `Enter` ∕ `Space` 归文本控件——零开合零收形；源判，`stopPropagation` 径被否；批档 `docs/batches/2026-09-29-desktop-carryover.md` §2.6）→ 新建钮（`session:create`）；下拉（开时挂选择器子位）= 账本警示注记首行（`div.session-ledger-notice` · `data-ledger-notice` · 非可点）⇒ 条目 ⇒ 空态行（`session.empty`）；**条目** = 标题 + 元数据族（provider · N msgs · updated）+ 位标（码 `running` / `approval` / `done`——渲染面状态源 = `thincoder-desktop/renderer/events.mjs` 置 ∕ 清位；状态栏跨会话告警位同源同词）+ 行内 ✎ ∕ ✕（`>1` 才显 ✕）；活动判据 = 行 `isActive`；**三出口** = 切会话 `session:switch`（点条目 ⇒ 关下拉；**受占件（端差清算批增）**：目标槽受占 ⇒ 切换仍成立 + 警告 toast（词键 `session.occupied`——CLI 形「警告 + 继续」；回执增键 `occupied` 载波——单源 = `docs/desktop/design/IPC.md` §2 会话族行））· 改名 `session:rename`（✎ ⇒ 条目原位换形：文本控件 + 取消 ∕ 确认两键）· 删除 `session:delete`（✕ ⇒ 内联确认 popover——背板 + 两键 + 默认焦点取消）；**否** `window.prompt` / `window.confirm` / dialog / 超时自动消；**元数据族（对齐重定位批 · D18）** = provider · N msgs · updated（对位 VSC 会话栏——provider = 槽投影 `activeProvider` 补载）；**账本警示注记**（下拉首行 dim 注记 · 非可点——账本可靠批 · 桌面微轮）= 本档 §1「本批注（账本警示面）」；**视觉对齐（D21）**：行面值表 = 本档 §1「本批注（D21 · 视觉对齐）」项 2；**对齐第三批**：末项删除门——本档 §1「本批注（对齐第三批 · 小修族）」P12；单源 = `thincoder-desktop/renderer/views/session-control.mjs` ∕ 挂载与接线 = `thincoder-desktop/renderer/mount-sessions.mjs` |
| 项目级读数 | 复读面 = `thincoder-desktop/renderer/mount-info.mjs`（`ledger:read` + `batch:status` 两读数分键落——一读失败不遮蔽另一读；缺省 cwd = 当前项目；复读两径 = 装配时一次 ∕ 开项目成功链）；**读面消费 = 零消费**（R13 遗留——信息行视图随左列裁撤退场；段 11 供给另路 = `ev:ledger` `marker`）；**读数缺 ⇒ 零节点**（禁止假造）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注 |
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 输入区控件行出口（`openSettings`——`#settings-btn` 核件面板控制行（`thincoder-render-core/composer/controls.mjs:51`）；接线 = `thincoder-desktop/renderer/mount-composer.mjs:90` ∕ `:160`；否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——**七段**闭集不动；**Esc 关闭（对齐第三批 · 重核处置）**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；对位 = VSC Esc 关设置面；向导态不在本项——既有键盘面 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`）与会话控制面选择器（本档「会话控制面」行）两处）；面 = **七段**（渠道 / 模型与档位 / agent 参数 / MCP / env（proxy ∕ shell） / tools（embedding ∕ websearch 两 key + 索引状态行） / models（consult ≤5 ∕ advisor 两 picker）——R7 落）；**「模型与档位」段档位控件形（批 B 落）** = `select`（选项 = **Auto + off 族 + 逐模型档位枚举**——**off 在场判据 = 核 `thinkOffPath(spec)` 投影**〔判定对象 = 该段当前所选模型；真 ⇒ off 选项在场 · 假 ⇒ 缺席〕；枚举单源 = 核 `reasoningEffortEnum` 投影；**现值 = `provider:list` 行投影 `effort`**（离线——批 B 注项 5）· **表外现值 ⇒ 自成一选项**（不吞）· **现值恒在场（含不可选态）** · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点）；**该段写面 = 全局 config**（`settings:agent`——设置面默认值）；**会话级切换在输入区控件行**（本档「输入区」行）——两面不互相顶替（需求 §3.5 项 5 / 项 6），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——`docs/desktop/design/PROJECT.md` §2 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口）· **外壳降噪（D24）**：同规则带上（结构框归零 + 行升底 + 次级键四值族）——本档 §1「本批注（外壳视觉降噪 · D24）」项 5；**对齐第三批**：类型加工（三控型）/ agent 具名控件 + 即改即存 / Esc 关闭——本档 §1「本批注（对齐第三批 · 小修族）」P14 / P15 / F-Esc；**parity-b10-ui（设置面余面 · 2026-09-29）**：渠道行控件族（密钥设 ∕ 改 ∕ 删三路 · 渠级代理复选 · sub 行）· 删除确认门（四门）· MCP 编辑 ∕ 重连与结构化表单 · agent 段（子代理模型槽六件 ∕ advisor 档枚举 ∕ guard 开关）· index 空态（`no-key`）——形 / 锚 / 判据 = 本档 §1「本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）」；S3 端差（行标未携 `failure` 分档）= **消（补做三件）**——同注项 7 |
| 首启向导 | 闸 = `config:read` 回执 `configured` 假 ⇒ 冷启动进向导（已配 ⇒ 跳过）；**容器 = 同设置面**（`[data-slot="settings"]` 单容器——两树互斥 · `configured` 假 ⇒ 向导占槽）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）——**零终端可完成**；**退场 = 清空容器**（主 UI 可用）· **幂等可重入**（中途退出 / 配置仍缺 ⇒ 下次冷启动再进）；**档不可读（畸形）⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读**（错误串直传 · **不静默重置**——`docs/desktop/design/PROJECT.md` §2 KD-12；`data-boot` 保持 `error`）；表单出口**复用设置面导出面**（单一 owner · 零副本）；形态 = 纯描述符树 + 薄挂载（`docs/desktop/design/RENDERER.md` §1.1）；**步界 / 步体闭集**（单源）= `STEPS` 三步闭集（表外值回落步 1——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30`）· `stepBody` 三分支（步 1 / 2 / 其余 ⇒ 目录步——`:84`） （机检豁免——端侧语汇） |
| 主题 | 跟随系统深浅（`nativeTheme`），变量集中在 `thincoder-desktop/renderer/theme.css`（R13 四拆独立成档）；**外壳降噪（D24）**：滚动条皮肤（全局 · 零新变量）——本档 §1「本批注（外壳视觉降噪 · D24）」项 4 |
| 键盘可达 | 审批卡三出口可键盘触发（**两形键位**见「审批呈现」行：逐项形 1 / 2 / 3 = once / always / reject，批形 = approveAll / deny / oneByOne）；初始焦点**目标** = **最安全键**（逐项「拒绝」/ 批「全否」——落形 = 标记锚 `data-autofocus="1"`（恰一）；**置焦执行 = 本批落**——帧尾对锚执行 `focus()`：「对齐第三批 · 小修族」F-置焦）；焦点环与 Tab 序显式定义（会话控制条目控件自然序） |
| i18n | 承产品定性（英文默认面，含 zh）；词表与核 i18n 面同源——**供给面 = `config:read` 语言面下发**（`{ locale, dict }`，核 `projectDictionary` 投影；本端不另立词表源——通道面 = `docs/desktop/design/IPC.md` §2） |
| open | **附件条样式**（缩略图 / 移除键尺寸规则未落——现盘零 CSS 规则；见「批 B 注」项 2；处置 = 随附件面族批——出处重核表 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §2）· **池面窄窗态**（右列 36rem 后窗口 < ~1100px 中列受挤——第二断点 ∥ 池面窄态未定；本档 §1「本批注（对齐第二批 · 六件）」项 6） |

**长会话渲染窗口 · 回填与跟滚**两行属实现工艺面 ⇒ 住 `docs/desktop/design/RENDERER.md` §2 / §3（本档不保留其正文）。

**批 B 注（⑤–⑧ 四件 + 设置面档位一件 · 五项 · 形 / 锚 / 候选面 · 2026-09-27）**：本档 §1「对话流」/「输入区」/「状态栏」/「设置面」四行标注「（批 B 落）」的项，落形逐条如下——本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（「会话级偏好注」/「附件注」/「档位控件注」），不在此重述。

1. **三值（provider / 模型 / 推理档位）就地可改**——居所 = 本档 §1「输入区」行控件行（模型钮（两级：渠道 → 模型）∕ 推理钮——2026-09-29 会话头面退场后为唯一居所）；写盘 / 施加两面分属核（`applySession` 唯一施加面）——语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2「会话级偏好注」**。
2. **输入区附件条**——形 = 输入区上方条（根锚 `data-attachments`，住 `[data-slot="composer"]` 内）；逐项 = 缩略图（`dataURL`）+ 文件名 + 移除控件 `data-action="attach:remove"`（携 `data-attachment-id`）；**空 ⇒ 零节点**（禁假造）。
   采集 = 输入区 `paste` 事件取剪贴板图像（渲染面零 fs ⇒ `FileReader` 转 `dataURL`）；暂存 = 输入区内存态（与文本**同一出口**）；构树与采集为纯函数（可平 node 直测）。
   出口 = 随 `msg:send` 载荷 `images`（**dataURL 串数组**——严格串形，A1 收正）；**清条 / 保留判据与文本同判据**（`ok` 真 ⇒ 清条；`ok` 假 ∥ 抛 ⇒ 文本与附件条皆保留 + `console.error`）。
   降级面 = 回执携 `degraded` ⇒ 提示行明示（**不静默丢图**）：`"non-vision"` = 降级未成（降级失败 ∥ 落盘 0 件）、图未随发、用户消息文本尾已附说明行（词键 `composer.attach.nonvision`）· `"partial"` = 超限 / 落盘失败项被弃、其余照发（降级成功 ∧ 有弃项 ⇒ 注文 + 本码；词键 `composer.attach.partial`）；降级成功且零弃 ⇒ 回执零码、消息文本携描述注文（`[图片 … 描述: …]`）。
   端侧**前置门** = 核 spec `multimodal` 判据；上限数值与弃项判据**单源 = IPC「附件注」**（本档不重述）。
3. **状态栏读数**——形 = 状态栏内读数节点 `data-usage`（值 = `ev:usage` 的 `ctxPct`（百分）∥ `ctxTokens`（令牌）⇒ 读数串 = CLI 形——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」）；**未至 / 非正数 ⇒ 零读数节点**（禁假造）；**> 100 照显**（读数门 = 数字 ∧ > 0——**无上界夹值**）；≥ 80% ⇒ 警示色（class 切换 · 阈值数值单源 = 本档「状态栏」行）。
   归约 = 按会话 `key` 写切片（**归约面为唯一写者**——状态行单点重建，视图面不复算）；切标签 ⇒ 取活动键值随动。
4. **复制面**——复制出口 = **核件代码块 Copy 钮**（`attachCopyButtons`——`pre.code-block` 内 `.code-copy-btn`；词键 `msg.copy` / `msg.copied` = 端供给面，值同 VSC）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点——**零动**）；核件钮写径前提 = `app://` 注册为 secure ⇒ 安全上下文成立（单源 = `docs/desktop/design/PROJECT.md` §2 KD-2）；自建两枚 ⧉ 控件退场（2026-09-29 裁定 = 对齐 VSC；摘除物全清单与判据 = 本档 §1「本批注（复制面对齐 VSC · 2026-09-29）」项 2）。
5. **设置面档位控件（⑥ · 批 B 设计修订轮）**——「模型与档位」段档位 `select` 的现值 / 候选 / 写 / 回退四事（语义与载荷单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）：
   现值 = 该段当前所选模型（`settings.defaultModel` 复合串**模型段**）的渠道条目投影——取 `provider:list` 行 `effort`（**离线**，零探针）；**表外现值 ⇒ 自成一选项**（不吞 · 零改写；仅设置面——会话级读侧归 `null` ⇒ 无此态）；选项集 = `Auto` + `off`（`thinkOff` 真时在场）+ 逐模型枚举；`defaultModel` 缺 / 模型段空 ⇒ 档位控件**零节点**（禁假造）。
   写 = `settings:agent` 载荷 `{ tier: { provider, model, level } }`；`ok` 真 ⇒ 重取 `provider:list` 刷现值（不整页重挂 · 零乐观写）；`ok` 假 ∥ 抛 ⇒ 控件值回退回执前值 + `console.error`（零静默）。
   边界：本控件 = **渠道条目级默认**；逐模型精确控制 = 会话级档位（本档 §1 批 B 注项 1 /「输入区」行）——两面不互相顶替（需求 §3.5 项 6）。

**批 B 追加注（首启空白态引导 · 四项 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「空态」/「启动态」四行的**首启空白态面**（各行已就地指针）。缺口 = 新装首启（空家 · 无项目）⇒ 对话流 `none` 态无引导节点（零块节点）+ 输入区禁用 ⇒ 界面零引导，真机走查判「完全没法输入」。本注只述端侧形态与锚；语义与通道**单源** = `docs/desktop/design/IPC.md`（本批零新通道 · 零新 IPC）。

1. **引导面（`none` 态）** = 落点 = **对话流挂载根** `[data-slot="flow"]` 自身（无活动会话 ⇒ 根锚 `data-state="none"`）· 节点 = `div.chat-empty[data-guide]`，**流内非块节点**（零 `data-block-id` ⇒ 不入块序 · 块序插入点判据与 `data-blocks` 不变式不受其影响）；`empty` 态 = 首子 · `none` 态 = 根唯一子 · `flow` 态 = 不在场。
   `data-guide` 值域 = **闭集三码**：`no-project`（`cwd` 缺）· `no-session`（有 `cwd` · 无活动会话）· `no-message`（有活动会话 · 零块——即既有空态节点）。判据（纯函数 · 单源）= 对话流模型 `guide` 字段：无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
   承档 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落——流内非块节点构树：纯构树 · 零 `store.mjs` import）；`thincoder-desktop/renderer/views/chat.mjs` 只出判据 + 引调（空态节点构树移出 ⇒ 本档不越 300）。
2. **引导面动作控件** = 就地入口（免「去会话控制面找」）——子序 = 文案 → [控件?]；`no-project` ⇒ `button[data-action="project:open"]` 词 = `rail.action.openDir`（既有键）· `no-session` ⇒ `button[data-action="session:create"]` 词 = `rail.action.newSession`（既有键）· `no-message` ⇒ 零控件。
   **在场判据 = 句柄在场**（未给 `onOpenDir` / `onNewSession` ⇒ **整控件缺席**、退纯文案——比接线形通则更严：零假按钮）；接线 = 对话流 handlers 两枚（与会话控制面项目钮 ∕ 新建钮**同出口** = `project:open` / `session:create` 各单一实现，本面不另写一路）；连带 = 对话流重挂键集须含 `project`（项目变更 ⇒ 中区随动；键名单单源 = `thincoder-desktop/renderer/app.mjs` `CHAT_KEYS`）。
   匹配面提醒：同一 `data-action` **可多处在场**（会话控制面项目钮 + 引导面动作控件）⇒ 用例 / 选择器须按集合或过滤取值，不得唯一查找。
3. **输入区禁用判据不因引导而变**——`disabled` 判据恒 = **活动会话在场**（无 ⇒ `disabled: true` · 锚恒在）；`no-project` / `no-session` 引导面在场**不解除**禁用。依据 = 需求档首启链（选工作目录 ⇒ 可用 = `docs/desktop/requirements/PROJECT.md` §3.3）；本面作用 = 把「为何不能输入」与「下一步点哪」显式化，**不代行建会话**（建会话仍须经 `session:create` 出口）。
4. **词键（两语各两键 · 共 2 键）** = `chat.guide.noProject` / `chat.guide.noSession`（住 `thincoder-desktop/renderer/i18n.mjs` 对话流段 = `chat.empty.hint` 邻位）。文本形（zh）=「未打开项目——先打开一个项目目录即可开始」/「尚无会话——新建一个会话即可开始对话」；（en）=「No project open — open a folder to start」/「No session yet — create one to start chatting」。
   计数随动（同笔）：总键数 **122 ⇒ 124**（两语相等不变）· 对话流桶 **8 ⇒ 10**——单词表四处同笔为纪律（测试树 2026-09-28 全清重置后承载 = 随批单元证据）。

**本批注（可见面修复 · 五件 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「工具卡」/「审批呈现」/「计划面」/「项目级信息」六行与 §2 项 1 行标注「可见面修复批修」的项（各行已就地指针）。
口径 = **对齐 CLI / VSC 既有语义**（`docs/desktop/requirements/PROJECT.md` §3.5:78 用户原话），不新增功能面；缺陷五条 = 台账 #457–#461；批档 = `docs/batches/2026-09-27-desktop-visible-face-fix.md`。本注只述端侧形态与锚；裁决与理由 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-24。

1. **输入区样式（#457）**——落点 = `thincoder-desktop/renderer/chat.css`（**既有档 · 不新立档**：五类 + 两附属行增量 ≲45 行，该档 254 ⇒ 保持 ≲300；分档理由 = `docs/desktop/design/PROJECT.md` §4.1 分档先例句〔`styles.css` 实读 284 贴 300 层〕）。
   形（沿既有控件单形 = `.question-input` / `.chat-backfill` / `.approval-action` 家族，零新样式体系）：根 = `.composer#toolbar`（`thincoder-desktop/renderer/index.html:42`——挂载根）；顶线 = `#toolbar { border-top: 1px solid var(--border) }`（核件 `thincoder-render-core/composer/composer.css:16`）——**扁平化（2026-09-30）裁「输入区上线保留」**；
   输入框（核件面板 `#input`——`thincoder-render-core/composer/composer.css:87-100`） = `flex: 1`（**撑满中区余宽**）+ `min-width: 0`（**可缩**——窄窗不撑破栅格）+ `min-height` + 原生 `resize: vertical` + 既有文本控件面（边框 / 圆角 / `--bg` 底 / `font: inherit`）；
   控件族（同形通则）= 输入面板控件——单源 = 核件 `composer/composer.css`（自建三控件随换装 ∕ 复制面对齐两批全数退场；**静息描边 / hover / 按下 / 聚焦四态见**本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2）；
   提示行（`.composer-notice`）与附件条（`.composer-attachments`）= **整行**（`flex: 1 1 100%`）；附件条**内部**（缩略图 / 移除键尺寸）仍 open（沿 open 行既有登记）。
   判据（机检）：该档选择器各 ≥1 条规则（文本级）；真机 = 输入框宽撑满中区余宽 ∧ 静息无描边（D24 归零——见本档 §1「本批注（外壳视觉降噪 · D24）」项 1）。
2. **用户块出泡（#458）**——出泡时刻 = `msg:send` 回执 `ok` 真（**受理即出**——裁决 / 理由 / 边界 = `docs/desktop/design/PROJECT.md` §2 KD-23）；活流块形 = `{ kind: "user", text }`（**与回放块形同形**——无 `id` / 无 `status`）；文本 = 提交文本逐字；
   写者 = 输入区挂载档（`thincoder-desktop/renderer/mount-composer.mjs`）两径同源（直发 ∕ 排队消费回执——「回合中插入」批收正：原回合尾 flush 退场；单源 = `docs/desktop/design/PROJECT.md` §2 KD-40）；**键门** = 回执键 = 现刻 `activeSession`（非活动 ⇒ 零写；
   **在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场——页读 `loadSlotFile` = `thincoder-desktop/src/main/session-slots.mjs:123` / `:145` · 槽落盘在回合尾 = `thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）。
   入队径（忙态）：**受理 ⇒ 消费前流内零块**（待发送件住输入区上方带——非流内；消费时刻恰一枚入流）——单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 2。
   判据（机检）：`ok` 真 ∧ 键 = 活动会话 ⇒ `blocks` 尾块 = `{ kind: "user", text }`（恰一块）；键 ≠ 活动会话 ⇒ **零写** · `blocks` 引用不变；`ok` 假 ∥ 抛 ⇒ `blocks` 引用不变；树面 = `div.block[data-block-kind="user"]`；真机 = 发送后流内**尾块（= 本回合首个块）**为该用户块（文本逐字）。
   边界：非视觉降级径 ⇒ 入会话文本 = 提交文本 + 说明行（主进程 `appendLine` 附）——活流显示键入串（三端同义：VSC `addUser(ctx, text)` = 键入串），回放含该行；消解路 = 回执携入会话文本（须动 IPC 回执形——另裁）。
3. **流式游标清点（#459）**——游标语义 = **末块追加态**（`thincoder-desktop/renderer/chat.css` 自注）；清点两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`——判据单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）② **段界**（`ev:tool-call` 入场 ⇒ 助手文本段收束——裁决 = `docs/desktop/design/PROJECT.md` §2 KD-24）；
   清点落点 = 归约面块面（`thincoder-desktop/renderer/events.mjs`）。
   判据（机检）：带 `streaming` 尾块之态 + 三径任一 ⇒ 归约态零 `streaming` 真项；`ev:tool-call` ⇒ 前序助手段同零；真机 = 回合尾后流内零 `[data-streaming="1"]` 节点（锚摘除——经块面引用变更触发帧，条单源 = `docs/desktop/design/RENDERER.md` §1.1 流式游标清点条）。
4. **文本段间隔（#460）**——通则 = 行内 ≥2 文本段者**逐段包元素**（`span[data-seg="<段码>"]`），段缺席 ⇒ **零节点**（空段仍占 flex 项 = 假间隔）；禁裸串直作 flex 行子（相邻文本节点合为单一匿名项 ⇒ `gap` / `space-between` 静默失效——通则详述 = `docs/desktop/design/RENDERER.md` §1.1）。
   逐处（三处同取「逐段包元素」；被否候选 = 改分隔形，逐处理由如下）：
   · **工具卡头行**（`thincoder-desktop/renderer/views/chat-tool.mjs` `toolHead`）段码 = `name` / `args` / `status` / `time`——四段各有独立语义且各有缺省跳空判据；拼单串须自造分隔符字面（违「零构造」）且四段读数不可分。
   · **池条目标签行**（`thincoder-desktop/renderer/views/pool-tree.mjs:102` `labelNode`）段码 = `title` / `status`——「两片皆缺 ⇒ 空行」判据以段为单位；拼串会把状态词的独立读面并掉。
   · **计划行**（现 = 核件直消费——`thincoder-desktop/renderer/views/plan.mjs` 端壳 `planCardNode` 直取核 `thincoder-render-core/cards/panel.mjs` `renderTaskPanel`；端侧零行构树 ⇒ 逐段包元素面归核体）。
   判据（二分）：① 自动面（平 node）= 三处子节点全为 `[data-seg]` 元素 ∧ 段数 = 在场段数 ∧ 缺席段零节点；② 真机 = 三处相邻 `[data-seg]` 元素 rect 间隔 > 0（Range 读 x——沿项 1 同类测量记法）。
5. **信息行复读触发（#461）**——触发点 = 开项目成功链（`thincoder-desktop/renderer/app.mjs` `openDir`）：`project:open` 回执到 ⇒ `await refreshRail()` **之后**补一步复读；句柄 = 设置面挂载档（`thincoder-desktop/renderer/mount-settings.mjs`）把 `refreshInfo` 一并出（沿 `paintInfo` 同面导出面）；向导步 3 现有调用保留（幂等——同一 handle；判据不缩水）。
   判据（机检）：开项目后 `[data-slot="info"]` 不再是启动期 `no-project` 失败串（`data-state` ≠ `error` ∧ 读数节点 / 相位节点在场——有读数即刷）；真无读数面（读通道失败）⇒ 失败串 = 该读 reason（非 `no-project`——既有失败面不变）。

**本批注（对齐重定位 · 四项 · 2026-09-27）**：本注补本档 §1「状态栏」/「对话流」/「会话控制面」/§2 项 1 四行的对齐重定位（用户 2026-09-27 20:45 走查三点 + 20:48 共用口径改判；批档 = `docs/batches/2026-09-27-desktop-ui-alignment.md`）。核面（落点 / 加载形 / 边界 / 两表）单源 = `docs/render-core/design/RENDER-CORE.md`——本注不重述。

1. **状态行 17 段逐项裁定表（D17 · 零静默省略）**——CLI 段集 = `thincoder-cli/src/tui/render-frame.mjs:356` 起（`buildStatusLine`）+ banner（`:233-236`）+ 注意力 chip（`:240-243`）+ 键位组（`:446` 尾段）。裁定三值：**承载**（桌面状态行落节点）· **旁置**（同义判据住他处——点名落点）· **不适用**（本端无该面——给理由）。**2026-09-28 屏面为准重审** = 17 段定形（§1「本批注（状态栏对齐 · 屏面为准）」）。
   表列序 = **逐项裁定序**（本表枚举面——非段序；段序单源 = `STATUS_SEGMENTS`，判据句 = 同注项 1）。

| # | CLI 段 | 裁定 | 桌面落点 / 数据源（已有切片 vs 缺入站面） |
|---|---|---|---|
| 1 | banner（PLAN / AUTO / ADVISOR / ENG 四段） | 承载 | 状态行行首四段（本注项 2——段锚 `plan` / `auto` / `advisor` / `eng`）；源 = `flags` 投影（**活值优先口径**——在场直读活态 · 不在场槽投影（单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」）；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:233-236`〔2026-09-29 停滞批增行后重锚——父侧随动〕）；真 ⇒ 在场 · 假 / 缺 ⇒ 零节点 |
| 2 | 注意力 chip（⚠ 等待审批 / 等待回答 / 等待输入） | 承载 | blocked = 活动键位标含 `approval` 码（审批 / 提问两门同码——既有切片 `tabBadges`）；awaiting = 旁置（完成位标 + 输入区可用为同义判据） |
| 3 | 状态文本 | 承载 | **态机五支（优先序 = ① 挂起句 > ② 零节点 > 状态文本 > ③ 忙（running） > ④ 就绪；单源 = 本格）**：① **挂起句支（第三态）**——挂起窗在场（`susp[<会话键>].active` 真）⇒ 段文 = 挂起句（三键按 N/M 条件组装：N = `running + queued`（`susp.running`）· M = `pending + done`（`susp.digesting`）；取词链 = N > 0 ⇒ `susp.running`〔M > 0 ⇒ 附 `susp.digesting`〕· N = 0 ∧ M > 0 ⇒ `susp.digesting` · N = 0 ∧ M = 0 ⇒ `susp.winding`；值 zh = CLI 逐字 ∥ en = VSC 逐字；对位实读 = `thincoder-vscode/webview/status-bar.js:66-75`〔2026-09-29 按盘收正〕；词键 / 值单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；② **零节点支**——位标含 `approval` ∧ 位标不含 `running` ⇒ **段零节点**（承载 = 注意力 chip——不重复；承实施座推导 + 父侧确认）；**状态文本支（R4 增）**——`ev:statusText` 切片在场 ⇒ 段文 = 该 kind 句（五 kind = rateWait ∕ rateLimited ∕ overloaded ∕ quota ∕ index；句面单源 = 核 `waitStatusText`；`index` ∧ `phase:"done"` 即清键；载波 ∕ 在场 ∕ 清点 = `docs/desktop/design/IPC.md` §1 `ev:statusText` 行）；③ 忙（位标含 `running`）⇒ **运行中**；④ 其余 ⇒ **就绪**（词键 `status.ready`——词形来源 = CLI 静息值 `Ready`，`thincoder-cli/src/tui/tui-state.mjs:43` 实读；2026-09-28 重审判定入状态词闭枚举——本档「状态词」行）。**交叠角落**（`approval` ∧ ¬`running` ∧ 挂起窗在场）⇒ 取①（chip 照常承载审批——两事实不同面，零重复；零节点律 = 无窗时回落）；源 = 位标切片 + `susp` 切片 |
| 4 | 当前工具 | 承载 | 源 = 块面末位 `kind === "tool" ∧ status === "running"` 的 `name`（已有切片 `blocks`——零新通道） |
| 5 | 耗时 | 承载 | 源 = 归约面会话键「回合起刻」`turnStarts[key]`（**已落（R3a）**——回合起 = `ev:activity` `turn` 首帧现刻，`thincoder-desktop/renderer/events.mjs:155`） |
| 6 | 任务计数（✓n/m） | 承载 | 源 = `tasks[key]` 切片（已有——与计划卡同源） |
| 7 | 回合 N/M | 承载 | 源 = `ev:activity` `turn` 载荷 `{ turn, maxTurns }`（**已落（R3a）**——归约槽 `turns[key]`（槽内键 `{ n, max }` 不随动），`thincoder-desktop/renderer/events.mjs:152-153`） |
| 8 | 令牌（↑↓ ✦ hit%） | 承载 | 源 = 核 `onUsage` 回调（`thincoder-core/agent/turn-loop.mjs:154`）⇒ `ev:usage` 载荷 `usage`（五键 VSC 键面——A6 收正；归约入 `tokens` 切片——槽名不随动）（**已落（R3a）**——`thincoder-desktop/src/main/agent-host.mjs:148`；CLI 同源映射 = `thincoder-cli/src/tui/tool-events.mjs:405-411`） |
| 9 | 上下文 % | 承载 | 源 = `usage[key]` 切片（百分）+ `usageTokens[key]`（上下文令牌——`ev:usage` 载荷 `ctxPct` ∕ `ctxTokens` 投影；**本批收正**）；读数 = `context <pct>% <tokens>`（en 逐字 = CLI `thincoder-cli/src/tui/render-frame.mjs:413-416`；zh 对位译形）；≥ 80% 警示色（沿 `USAGE_WARN`）——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」 |
| 10 | 滚动位（scrolled N） | 旁置 | 滚动反馈 = 药丸 / 摘要块（判据单源 = `docs/desktop/design/RENDERER.md` §3）——**重审④坐实**（本注项 5）：偏离底部 ⇒ 药丸在场（同信息）；行数读数（HTML 渲染行 ≠ 终端行）无对位物 ⇒ 不搬；观感复核 = 真机对照（T-DSK39） |
| 11 | 台账标记 | 承载 | 源 = 核状态位（`state.ledger = { marker, warn }`——`thincoder-core/ledger-surface.mjs:52`）经 `ev:ledger` `marker` 键转发 ⇒ 归约切片 `ledgerMarker`（120s 拍 + 首拍即到）；**常驻** = 核 `formatMarker` 逐字 `台账 N·M` + `warn` 位（老化 > 0 ∨ 死执行者 > 0）警示色；tooltip 明细面保留（载波 = `ev:ledger` `detailLines`〔归约切片 `ledgerDetail`〕）；「可开批」段形退场——信息保留于 tooltip（核 `formatDetailLine` 逐字携「 — 可开批」）——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」 |
| 12 | 计时（⏰N） | 承载 | 源 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:73`——三拆后档面收窄）⇒ `ev:usage` 载荷 `timers`（**已落（R3a）**——`thincoder-desktop/src/main/agent-host.mjs:148`；刷新点 = 回合尾——新鲜度窗登记 = `docs/render-core/design/RENDER-CORE.md` §10 F 行）；触发落流 = `ev:timer`（timer-wake 阶段 2——`docs/desktop/design/IPC.md` §1） |
| 13 | 会话标题 | 承载 | 源 = 活动会话标题（与会话控制面下拉条目同源——号出 `sessions:list` 行） |
| 14 | 输入提示段（Enter: send / Enter 排队 / 已排队 N 条） | 承载 | **形态零改 · 判据四路 · 源并两源（挂起窗径批；判据扩路 = 重建保真 ∕ 留端清算族批 ∕ #581）**——**判据四路**：队 ≥ 1 ⇒ 条数句；忙（位标 `running`）⇒ Enter 排队句；**挂起窗在场（`suspActiveOf`）∧ 非忙 ⇒ Enter 排队句**（窗内 Enter = 入队——本批收正：现制该角落出 send 句）；静（非忙 ∧ 无窗 ∧ 队空）⇒ `Enter: send`（词键 `status.enter.send`——对位 CLI enterHint 静息值，本注项 4）；源 = **本会话待发送件快照镜面**（`pending[<会话键>]`——写者 = `ev:queue` 归约，权威 = 宿主（**两源：忙态队 ∪ 挂起窗输入队**）；「回合中插入」批收正：原「渲染面本地队」改镜面——分键既往；挂起窗径批并源） |
| 15 | 键位组（`/:` 命令 · wheel/PgUp/PgDn · Ctrl+I · Ctrl+C） | 不适用 | **逐件重审（本注项 4）**：`/:` = 需求 §3.5 边界（用户 2026-09-26 裁定「不是必须项」）；wheel/PgUp/PgDn = 原生滚动条 + 滚轮自述（无键位提示面）；Ctrl+I = 本端无 inject 功能（如需 = 新需求）；Ctrl+C = 退出住窗口级（本端该键属复制——同键异义，不照搬） |

计数（D3 · 2026-09-28 重审后）：**承载 17 段**（1 的四态 = 4 段；2–9 · 11–14 = 12 段；`quiet` = 1 段——§1「本批注（停滞轻显形 · 2026-09-29）」）· **旁置 1 段**（10）· **不适用 1 行**（15 行内四件）；承载四项（耗时 / 令牌 / 计时 / 回合 N/M）**已落（R3a）**——读数槽四（`turnStarts` / `tokens` / `timers` / `turns`）住 `thincoder-desktop/renderer/events.mjs`；
  载荷面 = `ev:usage` 两键扩 + `ev:activity` `turn`（单源 = `docs/desktop/design/IPC.md` §1）；段闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`（17 码）。

2. **右列 = 子 agent 面板（D20）**——语义重定位：活动块族 = **子 agent 实例**（射程五类 = sync spawn / async 池 / consult / escalate / advisor-async——VSC 对位 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）；**工具调用行摘除**（工具调用面 = 对话流工具卡，VSC 同义）。
   块形 = 头（role · model · 用时 · 回合 N/M）+ 状态词（出本档闭枚举）+ 停止钮（`data-action="subagent:stop"`）；**内容回显**：块面 = 核件同款（头行 + 状态词 + **内容 tail-3 + 展开**——`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` 直消费；单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 3）。
   态机 = **出生**（`started` / `queued`）→ **终态折叠**（`done` / `settled` / `cancelled` ⇒ 就地收敛为终态词 + 用时；`⟦ev⟧stopped` ⇒ `cancelled`（先例兼容）· `error` 不在 relay 谱——闭集与 token 全表 = `docs/render-core/design/RENDER-CORE.md` §5）
   → **归档 = 入流**（普通终态即时归档 ∥ `settled` 驻留待消化后归档 ∥ 旧代接管即归档——流内尾追块；单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）。
   **数据链 = 宿主 relay 分流 + 存活投影 2s 再断言**（出生自愈——只发在飞实例：丢首发出生 ⇒ 一拍（2s）内块复现 · 终态出表 ⇒ 零再断言不复活；会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清——旧会话块不随拍重投，沿 `thincoder-vscode/src/extension/panel-session.mjs:123-126` 清点语义）。
   族序与折叠（待审批 → 子 agent → 队列 · 折叠头两读数）沿 §2 项 1 存量口径；通道面 = `docs/desktop/design/IPC.md` §1 `ev:subagent` / §2 `subagent:stop`。

3. **会话流经共享渲染核（D19 · 含改判）**——文本面经核 Markdown 呈现（**「零 Markdown」口径改判**：理由 = 用户走查第 3 点 + D19；被否 = 保留纯文本 / 自写第二份 md / 助手块单侧渲染——裁决 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-4**）。
   真代码块（围栏切分 / 语法高亮 / 代码块复制）随核落（原「另裁」登记 = `docs/desktop/design/PROJECT.md` §10 Y，本批已裁）；**推理块** = 新接线（核回调 `onReasoning` + 活流推理块——块型 `reasoning` 已在**页读域（六型全员——留档批 · #719）**内；壳 = 核件结构同形）；**文件链接承载**（「对齐第三批」D19 收正——宿主验存链 + 核包裹 + `file:open`；单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39**）；
   块容器 / 工具卡 / 卡族（审批 / 提问 / 计划）**桌面外壳留存**（三锚 / 滚动 · 回填 · 裁剪 / 卡壳四段头 · 耗时 · 改动摘要不动）——「会话流经核」= **渲染逻辑单源**（核件分件消费：`md` / `attachCopyButtons` / `renderReasoning`〔结构同形〕/ `capText`），否「整件替换核 DOM」（逐机制对位表 22 行 = 核档 §4）。

4. **会话面板元数据族（D18 · 对齐 VSC 会话栏）**——对位面 = `thincoder-vscode/webview/session-bar.js:40-41`（行元数据 = `provider · N msgs · updated`）；桌面落形 = 会话控制面下拉条目元数据族**三值**：
   provider（槽投影 `activeProvider`——核 `listSlots` 条目 `thincoder-core/session-slots.mjs:212`；端壳投影 `thincoder-desktop/src/main/sessions.mjs:12-16` **已载（R3c 增）**）· `messageCount`（已载）· `updatedAt`（已载）。
   交互对位 = 点选 / 改名 / 删除（桌面行内换形**已在册**——本注不改形）；**多标签结构不削**（本端结构差异保留）；更新时间显示形 = 本地化短日期（沿 VSC `fmtDate`）。

**本批注（D21 · 会话流 / 会话面板视觉对齐 · 两项 · 2026-09-28）**：本注补本档 §1「对话流」/「会话控制面」两行的**视觉对齐**（用户 2026-09-28 04:42 桌面走查：①「样式与 VSC 区别很大」②「桌面端的会话面板与 vsc 端完全不同，我之前要求过对齐的」⇒ 裁定向 VSC 靠拢；批档 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` · 需求 §4 **D21**）。
**结构零动**——会话控制面（R13 换装后）行族 / 行内换形 / 元数据族 / 行控件皆沿在册（需求 D18「本端结构差异不削」）；本注只述视觉值面与边界，**值表分处单源**（内容面 = 核档 §5；会话面板面 = 下项 2）。

1. **内容面视觉（核产出件）**——落点 = `thincoder-desktop/renderer/core.css`（核类名 → 桌面值）+ 值变量 = 主题表 `thincoder-desktop/renderer/theme.css`；**逐面映射表 21 面 / 内容面新增变量 12 个 / 端差 2 项 = `docs/render-core/design/RENDER-CORE.md` §5 / §9**（本档不重述值面）。
   边界：**外壳零动**——块壳 / 卡族 / 标签条 / 池 / 输入区 / 状态行（`thincoder-desktop/renderer/chat.css` · 同档 `chrome.css` 外壳段 · `thincoder-desktop/renderer/pool.css` · `thincoder-desktop/renderer/settings.css`）零规则改动；推理块**壳层**（边框 / 底色 / 圆角 / 斜体 muted）沿 `.block-reasoning`；VSC 侧 `thincoder-vscode/webview/**` 零改（值源）。
   验收 = 逐面真机比对（走查面 = T-DSK21）+ 值面机检两处（值落点锁 ∕ 真 Electron computed style 读数——测试树 2026-09-28 全清重置后承载 = 随批单元证据；真机面 = 人工走查 + 父侧真跑闭合）。
2. **会话面板视觉（桌面会话控制面 ∕ 下拉列表 · 端壳面）**——对位 = VSC 会话列表（`.session-item` 族；值源 = `thincoder-vscode/webview/session.css` / `thincoder-vscode/webview/session-bar.js`）；落点 = `thincoder-desktop/renderer/chrome.css` 会话控制面段（选择器族 `.session-*`——R13 换装后值面沿 `renderer/theme.css` 调色板变量）；**结构零动**（R13 后形态 = VSC 形换装；本端结构差异不削）。

| # | 面 | VSC 实值（file:line） | 桌面落法（复用变量 ∥ 新增变量 ∥ 直接值） |
|---|---|---|---|
| 1 | 行容器（内边距 / 间距 / 分隔） | `thincoder-vscode/webview/session.css:61-71`（`padding: 8px 10px` · `gap: 8px` · `border-bottom: 1px solid var(--border)` · `:last-child` 无线） | `.session-item`：`padding: 6px 8px ⇒ 8px 10px` · `gap: 8px`（既有）· 新增 `border-bottom: 1px solid var(--line)`（**复用**）+ `:last-child { border-bottom: none }` |
| 2 | 行 hover 底色 | `thincoder-vscode/webview/session.css:73-75`（`background: var(--hover-bg)`） | `.session-item:hover { background: var(--hover-bg) }`（**新增变量**——现值 `var(--bg)`） |
| 3 | 活动行态 | `thincoder-vscode/webview/session.css:77-83`（`background: color-mix(in srgb, var(--accent) 10%, transparent)`；活动行标题 `color: var(--accent)`） | `.session-item.active`：`border-color: var(--accent) ⇒ background: color-mix(in srgb, var(--accent) 10%, transparent)`；`.session-item.active .session-item-title { color: var(--accent) }`（**直接值**） |
| 4 | 行标题 | `thincoder-vscode/webview/session.css:85-93`（`font-size: 13px` · `font-weight: 500` · 省略三件） | `.session-item-title { font-size: 13px; font-weight: 500 }`（省略三件既有 · **直接值**） |
| 5 | 元数据族 | `thincoder-vscode/webview/session.css:95-100`（`font-size: 11px` · `color: var(--fg)` · `opacity: 0.4`）；串形 = `thincoder-vscode/webview/session-bar.js:41`（`provider · Nmsgs · updated`） | `.session-item-meta { font-size: 12px ⇒ 11px; color: var(--fg-muted) ⇒ var(--fg); opacity: 0.4 }`；**分隔符机制差保留**（桌面 `[data-seg] + [data-seg]::before { content: "· " }` ≡ VSC 串内 ` · `——观感同） |
| 6 | 行内动作钮（改名 / 删除） | `thincoder-vscode/webview/session.css:102-151`（`22px` 方 · `border-radius: 4px` · `font-size: 12px` · 静息 `opacity: 0` · 行 hover ⇒ `0.5` · 自身 hover ⇒ `1` + 底色〔改名 = `--hover-bg-strong` + `--accent` ∥ 删除 = `--diff-del-bg` + `--error-fg`〕） | `.session-rename` / `.session-delete`：`width: 22px; height: 22px; padding: 0; border-radius: 4px; font-size: 12px` + 静息 `opacity: 0` · `.session-item:hover … { opacity: 0.5 }` · 自身 `:hover { opacity: 1 }` + 底色 / 色值照落（**新增变量 2**：`--diff-del-bg` · `--error-fg`；`--hover-bg-strong` 与内容面共用）+ **键盘可达臂** `:focus-visible { opacity: 1 }`（**两端一致**——VSC 侧同臂本批补落〔批 `docs/batches/2026-09-29-hatch-clearance-2.md`〕；核档 §9 处置句） |
| 7 | 字形面（两钮） | `thincoder-vscode/webview/session-bar.js:42` / `:44`（`✎` / `✕` 元素文本） | `.session-rename::before { content: "✎" }`（既有）· `.session-delete::before { content: "×" ⇒ "✕" }`（**字形仍住样式档**——「视图档零字形字面」律不变；标签条关闭控件的 `×` 不在本面射程 · 零动） |
| 8 | 空态行 | `thincoder-vscode/webview/session-bar.js:65-70`（空项 `opacity: 0.5`） | 左列空态 = `.session-empty`（节点类 · 无 CSS 规则——观感等价）⇒ **不改**（登记） |
| 9 | 行聚焦（键盘） | VSC 实有 `.session-item:focus-visible`（`thincoder-vscode/webview/base.css:449-457`：`outline: 2px solid var(--accent); outline-offset: -2px; background: var(--hover-bg-strong)`） | 桌面 `.session-item:focus-visible` **照落同三值** |

**计数（D3）**：**9 面**（1–9 = 行容器 ∥ 行 hover ∥ 活动行态 ∥ 行标题 ∥ 元数据族 ∥ 行内动作钮 ∥ 字形面 ∥ 空态行 ∥ 行聚焦）；本面新增变量 **2**（`--diff-del-bg` · `--error-fg`；与内容面共用者不重复计）；**桌面新增变量合计 = 14**（内容面 12 + 本面 2）。

**会话面板七条对位处置（2026-09-29 重审 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**——逐条四类：已消（①②）· 对位物退役（③）· 需求边界（④）· 说明（⑤–⑦）：
① **面板容器皮肤 = 已消**（R13 换装 + D21 后两端构同形——实读 `thincoder-vscode/webview/session.css:13-59` ⟷ `thincoder-desktop/renderer/session-list.css:8-46`）；
② **会话选择器 / 下拉交互 = 已消**（同上；落形 = 本档 §1 会话控制面行）；
③ **会话条对位句 = 已消（对位物退役）**——标签条 R13 裁撤 ∕ 会话头退场；对位 = VSC `#session-bar` 三件（`#session-selector` ∕ `#session-dropdown` ∕ `#new-session-btn`——新建入口 = 桌面会话控制面新建钮（`session:create`）+ 空态引导面动作），R13-A 形换装已落；
④ **`#project-btn`（多根切换钮）= 不适用**（需求边界——本端单项目模型，需求 §2「项目模型」行）；
⑤ **`.dropdown-section` = 说明**（VSC 会话列表不发射该节点——仅 `thincoder-vscode/webview/model-picker.js:73` 消费；桌面下拉零区标题面（R13 后）⇒ 零动）；
⑥ **行内换形三件 = 说明**（桌面行内换形形态有意不同（`.session-rename-input` ∕ `.session-cancel` ∕ `.session-confirm`）· 本批零动）；
⑦ **打开目录入口（项目钮）= 说明**（本端独有（D1 面——住会话控制面；VSC 无对位）⇒ 保留零动——R13 后原 `.rail-control` ∕ 来源端标面已退场）。

**本批注（D17 / D19 · 残余补齐 · 两项 · 2026-09-28）**：本注补本档 §1「状态栏」/「对话流」两行的**恢复态播种**与**用户块 md 深度**（两行已就地指针）。来源 = 需求 §4 D17 / D19 补句（`docs/desktop/requirements/PROJECT.md:146` / `:148`）；批档 = `docs/batches/2026-09-28-desktop-residuals.md`。
本注只述端侧形态与判据面；语义 / 契约单源 = `docs/core/design/SESSION.md` §6.24；载荷 / 在场 / 消费 / 降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」；**播种面裁定（读数切片段——13 段〔承载 17 段 − banner 四段〕；banner 四段 = 非 seed 面，供面 = `flags`——每次页读皆携）单源 = 本注项 1**（IPC 注留一行指针，不重述）。

1. **状态行恢复态播种（D17 · 台账 #479）**——打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（恢复态与 CLI 同见；CLI 对位语义 = `agent.tasks = data.tasks ?? []` 水合）：
   - 触发点 = `openPage`（`thincoder-desktop/renderer/mount-sessions.mjs` 私有）——三路开页同一路（`session:resume` / `session:switch` / `session:create`）+ 关页邻位接管 + 会话控制面下拉条目点选皆经此；不另立第二触发。
   - 载波 = `history:page` 回执新键 `seed = { tasks, usage? }`——**仅首屏读**（`before == null`）在场；回填读不携（防回填以盘上旧值覆盖活切片）；**时序**：本键在飞（回合未尾）⇒ 首屏种不落；**播种只填空白**：**切片键已在场（无论来源）⇒ 零写**（闭合回合尾窗口——实现读法 = 键在场即零写，限定词注销）；形态 / 缺席降级单源 = `docs/desktop/design/IPC.md` §2「打开态播种注」。
   - 落点 = 渲染面 `applyPage` 首屏支（`thincoder-desktop/renderer/events.mjs`）——同笔写 `tasks[key]` / `usage[key]` 两切片（与 `meta` 同一写点）；缺席 / 形不合 ⇒ 该槽**零写**（零节点——禁假造）；订阅键面零改（`STATUS_KEYS` 已含两键 ⇒ 帧随切片变自动重挂）。
   - **播种 2 段**：6 `tasks` = 槽数据直取（非数组 ⇒ `[]`）· 9 `context`（`usage`）= 核 `sessionReading` 打开态读数（数字 ∧ `> 0` 才落——同 `ev:usage` 有效门）。
   - **不播种 11 段（逐段理由）**：8 `tokens`（#475 链回合尾帧专属 · 打开态无累计源）· 12 `timer`（核 `_pendingTimers` 活读 = 进程态）· 5 `elapsed` / 7 `turn`（回合域——无在飞回合本应缺席）· `quiet`（停滞段——回合域；时基 `lastOutputAt` 进程态；无在飞回合 ⇒ 天然缺席）· 2 `attention` / 3 状态词（位标进程态）；
     4 `tool`（块面末位 running——页读整置后为零 = 真态）· 11 `ledger`（项目级——供给 = `ev:ledger` 拍面〔启动拍 + 周期拍 120s；首拍即到〕）· 13 `title`（`sessions` 切片随 `refreshRail` 刷）· 14 输入提示（进程态）。
   - 缺席降级：槽不可读 ⇒ 回执 `{ ok:false }`（零播种——既有失败面不变）；配置不可读 / 读数不可算 ⇒ `usage` 键缺席 + `console.error`（零静默）；`ctxPct ≤ 0` ⇒ 键缺席（同 `ev:usage` 有效门）。
   - 连带（有意）：`tasks[key]` 两消费面同源（状态行段 6 + 计划卡）——恢复态两者随亮；如须卡片不出 ⇒ 另裁（劈切片——不在本批）。
   - **模式四位（本批增 · 非 seed 面）**：行 1 四段由 `flags` 投影供给（`history:page` 回执键——**活值优先**：agent 在场 ⇒ 活值四布尔；不在场 ⇒ 槽字段投影（与 D17 `seed` 同源同形）；槽亦读不出 ⇒ 键缺席（该槽零写）；**每次页读皆携**——回填读同在场，与 `seed` 的首屏限定异）——与读数面异路（形态 / 在场 / 落点单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」）。
   - 核侧单源 = `sessionReading(data, { providers, fallback })`（`thincoder-core/session-lifecycle.mjs`；`thincoder-core/session.mjs` re-export 随动）——与 `applySession` 后读数**同源同式**；契约 = `docs/core/design/SESSION.md` §6.24。

2. **用户块 md 深度（D19 · 台账 #480）**——用户消息块 markdown 深度按 VSC 口径统一（核件 `mdInline`；助手块 = 全量 `md` 不变）：
   - 实现面 = **端侧渲染分流**：`thincoder-desktop/renderer/views/chat-text.mjs` `textFace` 按 `block.kind` 分流——`user` ⇒ `mdInline`；`assistant` / `reasoning` / `error` ⇒ `md`（全量——零回归）。
   - `mdInline` 与 `md` 同模块导出（`/rc/md.mjs`）⇒ 零新模块边（守卫闭包零改）；口径标尺 = 核件 `thincoder-render-core/flow/block.mjs:87`（user = `mdInline`）∥ `:100`（assistant = `md`）——核件 / VSC 侧零改。
   - `[data-raw]` 原文逐字锚不变（就地更新判据面——`patchTextBlock` 值变比较仍消费）；边界（登记）= 就地更新径（`patchTextBlock` → 核件 `paintStreamTarget` 恒 `md`）对 `user` 块**不触发**（块引用恒定 ⇒ `patch` 档不入）——若未来出现 user 尾块重渲径，深度分流须同判。
   - 判据（机检）：user 块块级构件零节点（围栏 / 标题）∥ assistant 同文本块级在场（对拍有牙）——用例面 = 随批单元证据 + T-DSK38（单源 = `docs/desktop/design/PROJECT.md` §7 残余批注）。

**本批注（状态栏对齐 · 屏面为准 · 2026-09-28）**：本注补本档 §1「状态栏」行的**屏面为准重审定形**（该行已就地指针；批档 = `docs/batches/2026-09-28-statusline-align.md` · 台账 #483 · 需求 §4 **D22**）。
标尺 = **屏面**（用户 2026-09-28 05:38 裁定：「对齐」以屏面可见行为准；「旁置 / 不适用 / 缺入站面」等账面打折项逐项重审，不得静默打折）——四项重审逐项给裁定 + 判据句；状态行段表（上注项 1）已就地收正为 **17 段**。

1. **打开态段集 = 17 段**（闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`）：段序 = CLI 段序——判据句 = 实读 `thincoder-cli/src/tui/render-frame.mjs`：注意力 chip 行首（`:240-243`）→ banner 四态（`:233-236`，PLAN → AUTO → ADVISOR → ENG）→ 状态段簇（`:391-446`——`buildStatusLine` 段族，尾段 = 键位组）。
   状态段簇内序 = 状态词 → 工具 → 耗时 → 任务 → 回合 → 令牌 → 上下文 → [滚动位] → 台账 → 计时 → 标题 → 输入提示。
   `STATUS_SEGMENTS` 序 = 本序（滚动位 / 键位组除外）；**17 段表**的表列序 = 逐项裁定序（表枚举面——与段序分属两面；同注项 1 表头）。
   打开态（静息 · 有活动会话）可亮 = `plan` / `auto` / `advisor` / `eng`（真态时）+ `state`（就绪）+ `tasks` + `context` + `ledger`（常驻）+ `title` + `enter`——与 CLI 打开态逐段对位（差表 = 批档 §2）；段锚 = `data-seg`（值域 = 闭集 17 码）；banner 四段词 = 代号字面（两语同形；词键 `status.banner.*`）。
2. **重审② banner（裁定 = 四态上状态行行首）**——实读钉定：「PLAN / ADVISOR 本端无该两态」旧裁定**不实**（两态随会话槽恢复可在本端为真：`thincoder-core/session-lifecycle.mjs:115` `planMode` / `:124-127` `engineering` / `:132-134` `advisor`）；
   四态判定 = **活值优先口径**（agent 在场 ⇒ 活值直读；不在场 ⇒ 槽字段投影——单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 3；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:233-236`〔2026-09-29 停滞批增行后重锚〕）：`planMode` ∨ `autoApprove` ∨ `advisor.guard === true` ∨ `agent.engineering === true`——真 ⇒ 该段在场 · 假 / 缺 ⇒ 零节点（负向锁）。
   供面 = `history:page` 回执新键 `flags`（四布尔——**活值优先**：agent 在场 ⇒ 活值直读；不在场 ⇒ 槽字段投影（与 D17 `seed` 同源同形）；槽亦读不出 ⇒ 键缺席（该槽零写）——「禁假造」边界收窄至此）；消费 = 渲染面切片（`sessionFlags`）→ 状态行四段；形态 / 在场 / 落点单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」。
3. **重审① 静息状态词（裁定 = 补）**——CLI 静息值实读 = `Ready`（`thincoder-cli/src/tui/tui-state.mjs:43`；回合尾回 `Ready` = `thincoder-cli/src/tui/agent-turn.mjs:301`）；处理 = 表行 3 两态词：位标含 `running` ⇒ 运行中（既有）· 位标集 ∩ {`running`, `approval`} = ∅ ⇒ **就绪**（词键 `status.ready`）——打开态（静息）恒在场。
   **零节点支**（`approval` 在挂 ∧ 回合非忙）⇒ **段零节点**（承载 = 注意力 chip——承实施座推导 + 父侧确认；与挂起句支的互斥序 / 完整态机 = 表行 3 单源）。
   **就绪入状态词闭枚举**（词形来源单列 = CLI 静息值 `Ready`；核 i18n 无同源词 ⇒ 例外注明 = 本档「状态词」行 / §3 借用项 9）。
4. **重审③ 键位尾（逐件）**——`Enter: send`（CLI enterHint 静息值）⇒ **补**：表行 14 输入提示判据（静 ⇒ `Enter: send` · 忙 ∧ 队空 ⇒ 排队句 · 队 ≥ 1 ⇒ 条数句；**2026-09-29 扩四路**——窗在 ∧ 非忙 ⇒ 排队句）；**其余四件维持不适用**（逐件理由 = 表行 15）——用户 2026-09-26 裁定只覆盖 `/:` 件，其余四件本端无对位面（非静默打折——给理由）。
5. **重审④ 滚动位（裁定 = 维持旁置）**——偏离底部（`!following`）⇒ 药丸在场（判据单源 = `docs/desktop/design/RENDERER.md` §3）· 回底 ⇒ 药丸退场——同信息（偏离底部状态可见）；行数读数（HTML 渲染行 ≠ 终端行）无对位物 ⇒ 不搬；观感复核 = 真机对照（T-DSK39）。
6. **计数随动（D3）**——状态行词键 10 ⇒ **16**（新增 `status.ready` / `status.enter.send` + 四态 `status.banner.plan` / `.auto` / `.advisor` / `.eng`）；宿主键总数 **139 ⇒ 145**；会话头字段 5 ⇒ **3**——承载 = 词表四处同笔（测试树 2026-09-28 全清重置后 = 随批单元证据）。
7. **桌内翻转刷新（并入本批——2026-09-28 评审轮 1 修正定形）**——桌内 AUTO 翻转（always 放行置位 = `thincoder-desktop/src/main/suspensions.mjs:103`）后 `flags` **即时刷新**，最小可落路径 = 置位通道回执携 `flags`：
   `approval:respond` 成功径回执叠加 `{ key, flags }`（宿主 `flagsOf(key)` 活值投影——与页读同一函数，零算法副本；提问门径 / 失败径零叠加）⇒ 渲染面以回执写 `sessionFlags[key]` 切片（写点 = 归约面纯动作，与页读同点）⇒ 状态行随切片重挂。
   零新通道 / 零新白名单项；契约面 = `docs/desktop/design/IPC.md` §2 `approval:respond` 行 + 「模式位投影注」项 5；用例面 = 回执两向 ∕ 成功径写切片 ∕ 失败零写 ∕ 切片 ⇒ `auto` 段在场（测试树 2026-09-28 全清重置后承载 = 随批单元证据）。

**本批注（账本警示面 · 2026-09-28）**：本注补本档 §1「会话控制面」行的**会话账本异常警示面**（该行已就地指针）；来源 = 核需求 `docs/core/requirements/SESSION.md` §4.6 **F-L4**「账本异常 ⇒ 用户可见信号」+ 批 `docs/batches/2026-09-28-ledger-reliability.md` §1.6 扩面裁定（三端齐——VSC 面同批落，桌面面本微轮落）。本注只述端侧形态与锚；契约 / 载荷 / 在场单源 = `docs/desktop/design/IPC.md` §2「会话族注」项 6。

1. **触发与在场**——触发 = `refused > 0 ∨ scene`（与 CLI / VSC 同口径，**脱离会话计数条件**）；判据单源 = 核 `ledgerHealth(cwd)`（`docs/core/design/SESSION.md` §6.25 判据句 4）。
   在场判据 = `sessions:list` 回执携 `ledger` 字段（缺席 = 正常——负断言）；`boot` 态（无项目）⇒ 不在场（无 cwd 判据对象）；`empty` 态（有项目无会话）⇒ **同样在场**（触发脱离会话计数）；**异常清 ⇒ 两腿**（单源 = 核 `ledgerHealth(cwd)`）：`scene` 腿 = 损坏现场档清 ⇒ 注记消失（零历史态）∥ `refused` 腿 = 核**本进程累计**（不清零）⇒ 进程内一旦拒写，注记持续在场**至重启**（有界）——随下一次列表刷新自见。
2. **形态与锚（最小形态 = dim 行 · 非可点）**——落点 = 会话控制面**下拉首行**（开时挂选择器子位——端既有面迁位）；节点 = `div.session-ledger-notice` + 机读锚 **`data-ledger-notice`**（裸标记——在场即异常；**非 `button`** · 零 `data-action` ⇒ 不可点、零控件语义）；
   样式 = `.session-ledger-notice` 单规则（`padding: 6px 10px` · `opacity: 0.7`——dim 观感；落点 = `thincoder-desktop/renderer/session-list.css:93`〔越线档结构轮 #536 迁出后现址〕）。
3. **词键（两语各两键 · 条件合成）**——主句键 `rail.ledger.notice` + 条件附句键 `rail.ledger.notice.scene`（住 `thincoder-desktop/renderer/i18n.mjs` `rail.*` 族；插值 = 核同形 `${reason}`）：
   zh 主句 =「会话账本异常（${reason}）——打开会话即自动补回」/ en 主句 =「Session ledger anomaly (${reason}) — opening a session self-heals it」；zh 附句 =「损坏现场档保留 30 天」/ en 附句 =「Corrupted-scene files kept 30 days」——**`ledger.scene === true` 时合成「主句 + 分隔符 + 附句」**（zh「；」/ en「; 」按当前 `locale()` 直取；缺 / false ⇒ 仅主句）；
   **与 VSC 两键 / CLI 同口径**（三端同一句话的条件附形态——2026-09-28 修正轮定形）；`${reason}` 值 = `ledger.reason` 逐字。
   计数随动：宿主键总数 **147 ⇒ 144**（147 = 实读 2026-09-28 修正轮落值〔两语同增〕；2026-09-29 撤会话头批退 `head.field.*` 3 键；键数门 = 四处同笔为纪律——测试树 2026-09-28 全清重置后承载 = 随批单元证据）。
4. **数据链**——`refreshRail`（`thincoder-desktop/renderer/mount-sessions.mjs`——**唯一写路径**）在 `sessions:list` 回执到后写 `ledger` 切片（重挂键面 `SESSION_KEYS` = `thincoder-desktop/renderer/app.mjs:64` 含 `ledger`）；构树读切片出注记节点（`thincoder-desktop/renderer/views/session-control.mjs`——`sessionModel` 携 `ledger` ⇒ 下拉首行出注记）。
   **不做推送**：可见刷新 = 端侧下一次列表渲染自见（沿核 §6.25「行级刷新不做推送」口径）。
5. **判据（机检）**——① 回执面：`ledger` 在场 ⇔ `refused > 0 ∨ scene`；缺席 = 正常（负断言）——用例面 = 随批单元证据；
   ② 构树面：`ledger` 在场 ⇒ 下拉首行 = `[data-ledger-notice]`（非 `button` · 零 `data-action`）∧ 文案含 `${reason}` 值；缺席 ⇒ 零节点；`empty` 态同样在场——用例面 = 随批单元证据；③ 真机面 = **`T-DSK40`**（单源 = `docs/desktop/design/E2E-TESTING.md` §3.6 / §6）。

**本批注（外壳视觉降噪 · D24 · 2026-09-28）**：本注补本档 §1 五行（标签条 / 会话头 / 输入区 / 设置面 / 主题）的**外壳视觉语言**（五行已就地指针）；来源 = 用户 2026-09-28 06:30 走查「桌面端页面上线条框框太多，显得非常杂乱」→ 06:36 裁定「先只做外壳」（内容面守 D21 值源不动）→ 06:43 选定 ② 整壳降噪（对照 mock「02 整壳」帧）；需求 §4 **D24**；批档 = `docs/batches/2026-09-28-desktop-shell-denoise.md`；台账 #493。
**两层值面**：① **静息面** = 定案规则集（批档 §1.3 R1–R6 · mock V2 值逐条照落——用户选定形）；② **交互态面** = mock 未覆盖 ⇒ **本注定形**（D24「交互态显形」）。
**总则**：去描边一律 `border-color: transparent`（**保位**——1px 边框留位 ⇒ 零几何位移）；层次靠**底色**（区间距归零——扁平化 2026-09-30）；**零新变量**（全用在册：`--bg` / `--bg-raised` / `--line` / `--accent` / `--fg` / `--fg-muted` / `--hover-bg` / `--hover-bg-strong` / `--radius`）；**零新依赖**。

1. **静息描边归零（R1–R4 · 四族）**
   - **容器族 3**（`.session` / `.pool` / `.status`）⇒ `border: 1px solid transparent`（保位）；层次 = `--bg-raised` 底（区间距归零——扁平化 2026-09-30）——落点 = `thincoder-desktop/renderer/chrome.css:19-27`。
   - **骨架线族（现值：唯输入区上线 · 显形保留）**：`.composer` 顶线 = `#toolbar { border-top: 1px solid var(--border) }`（核件 `thincoder-render-core/composer/composer.css:16`）——**扁平化（2026-09-30）裁「相邻零分割线，输入区上线保留」**。
   - **控件族 3 选择器**（各 `1px solid transparent` · 保位）：`.chat-backfill`（`thincoder-desktop/renderer/chat.css:201-208`）· `.chat-pill`（`thincoder-desktop/renderer/chat.css:211-223`）· `.pool-toggle`（`thincoder-desktop/renderer/pool.css:39-47`）。
   - **池条目**（`.pool-item` · `pool.css:86-95`）⇒ `border-color: transparent` + `background: var(--bg)`（嵌底——池卡 `--bg-raised` 内的下沉井）。

2. **交互态四值（本注定形 · 外壳控件族单源）**——语汇 = 叠加色（任意底上皆显）+ 聚焦环（accent 系）：
   - **静息**：`background: transparent`（`.chat-pill` 例外 = `var(--bg-raised)`——**实色支**：浮于内容上 ⇒ 恒不透明，不并族值〔半透明叠加会透出底层文字〕）；**`.chat-pill` 交互态** = hover / 按下 `var(--bg)`（实色降底——收齐由不触〔底 = `--bg-raised`〕；实色支无第二档 ⇒ 按下沿 hover）；聚焦底不随落（守实色——见下聚焦条）；
   - **hover**：`background: var(--hover-bg)`（由：浮于内容上的实色面下 `var(--bg)` hover 不可见；且 D21 行 hover 已用 `--hover-bg`）；
   - **按下**（`:not(:disabled):active`）：`background: var(--hover-bg-strong)`；
   - **聚焦**（`:focus-visible`）：`outline: 2px solid var(--accent); outline-offset: -2px` + `background: var(--hover-bg-strong)`（沿 `.session-item:focus-visible` 同三值——D21 先例；**`.chat-pill` 底不随落**——守实色）。
   - **命中面** = 控件族 3 选择器。

3. **标签活动态（R5）**——**不适用（R13 后）**：标签条随会话模型轮裁撤退场。

4. **滚动条皮肤（R6 · 全局）**——`thincoder-desktop/renderer/skin.css` 全局段（零变量）：`::-webkit-scrollbar { width: 10px; height: 10px }` · `::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent }`
   · `::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--fg) 22%, transparent); border: 2px solid transparent; border-radius: 0; background-clip: padding-box }`（圆角随扁平化归零——2026-09-30）· 同 thumb `:hover` ⇒ 35%。
   覆盖 = 各滚动容器（`.pool-body` / `.flow` / 设置面板）；两主题同式（`--fg` 混同）。

5. **设置面映射（同规则带上 · 用户未见 mock——父侧默认；本注 = 落形）**（落点 = `thincoder-desktop/renderer/settings.css`）：
   - 面头线（`.settings-head` / `.wizard-head` · `:44-51`）⇒ 底线 transparent（同骨架线族）。
   - 结构框归零 + 升底：`.settings-row`（`:141-157`）· `.settings-form`（`:173-180`）⇒ 边框 transparent + `background: var(--bg-raised)`（面板底 = `--bg` ⇒ 行 / 表单浮起——同主壳「卡在底上」语）；`.settings-notice` / `.wizard-notice`（`:105-117`）⇒ 边框 transparent（警示语义已由 `--accent` 字色承载）。
   - 活动 / 当前行：`.settings-row[data-active]` / `[data-current]` ⇒ **accent 描边改底色态**（同 R5 语）：`background: color-mix(in srgb, var(--accent) 14%, var(--bg-raised))`（不透明混同——行自持升底）。
   - 控件族 8：**次级 6**（`.settings-lang` / `.settings-close` / `.settings-submit` / `.wizard-dismiss` / `.wizard-submit` / `.info-entry` · `:60-81`）⇒ 描边归零 + 四值族；**强调 2 保留**（`.wizard-next` / `.wizard-finish` · `:82-86`——accent 框 = 主推进键语义强调，沿「强调框保留」律）。
   - **保留**：`.settings-field`（`:191-206` 输入控件）细边零动（D24 边界原文）；`.settings-mark`（`:159-165` accent 强调标）零动。

6. **保留面 + 本批不动（零动清单 · 逐条给由）**
   - 保留（D24 原文）：输入框细边（核件面板输入行 `#input-row` / `.question-input` / `.settings-field`）· 审批 / 提问 / 计划卡语义强调框（`thincoder-desktop/renderer/chat-cards.css`）。
   - 本批不动：卡片内控件族（`.approval-action` / `.question-option` / `.question-submit` / `.question-cancel`——住保留卡族内 · 不在 R 集）· D21 会话行面九面
     · `[data-slot="info"]` 行顶线——**死面**（骨架 ∥ live DOM 双无该槽 ⇒ 零在场规则；规则出清随码面余部 = 台账 #713）· `.tool-result` 顶线（内容面 · 守 D21）· 内容面全域（`thincoder-desktop/renderer/core.css` **零改**）。

7. **验收（D24 判据三件 → 用例面）**
   - **静息描边机检锁**（值落点锁——测试树 2026-09-28 全清重置后承载 = 随批单元证据）：描边归零族随本注现值（容器 3 · 骨架线（输入区上线——显形保留）· 控件族 3 选择器 · 池条目 1）+ 四值族 + 滚动条四规则 + 设置面映射 + **保留面负向锁** + 零新变量（主题变量块两套计数不变）。
     负向锁**两值列**（仍 1px 描边 · 未被归零）：**accent 值列** = `.permission-prompt` / `.question-card`；**`--line` 值列** = 核件面板输入行 `#input-row` / `.plan-card`。
   - **真机 hover · 聚焦读数**（真机面 = 人工走查 + 父侧真跑闭合；D16 义务）——静息四边 `rgba(0, 0, 0, 0)` ∧ 边宽仍 1px（保位）∥ hover 面 bg 非透明 ∧ 边框仍透明
     ∥ 键盘 Tab 命中 ⇒ `:focus-visible` 真 + outline 2px ∥ 滚动条占宽（**前提 = 夹具使 `[data-slot="flow"]` 溢出** · 两支形）：有滚动条 ⇒ `offsetWidth − clientWidth` = 10 ∥ 无滚动条 ⇒ 该支不适用（不自判红） ∥ 核件面板输入行 `#input-row` 边框非透明（保留面）。
   - **改前 / 改后对照**：改前 = 批档 §1.3 的「00 改前」帧（同夹具 / 同机位 / 同滚位 · as-of 2026-09-28）∥ 改后 = 实施后同夹具实拍 ⇒ 父侧 / 用户走查（探针 = 批档 §1.3 所列一次性物 · 非批产物——值面已在册 ⇒ 临时面清不阻塞）。
   - **零回归**：内容面零改 ⇒ 核 / CLI / VSC 面零波及（测试树 2026-09-28 全清重置后 = 随批单元证据 ∕ 真机面）。

8. **计数（D3）**：容器 **3** · 骨架线 **1 处**（输入区上线——显形保留） · 控件族 **3 选择器** · 池条目 **1** · 滚动条 **4 规则** · 设置面 **9 面**（6 改 + 3 保留）· 交互态 **4 值** · 保留面 **5** · 新增变量 **0**。

9. **open / 上抛（本批不改 · 消解路在册）**：① 线族残留面（`[data-slot="info"]` 顶线）= **死面**（骨架 ∥ live DOM 双无该槽 ⇒ 零在场规则；规则出清随码面余部 = 台账 #713）；② 设置面形（用户未见 mock——若剔除该面 ⇒ 本注项 5 整段回撤，主壳零波及）。

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

2. **排队消息住输入区上方待发送带 + 队列按会话分键（#495 · 07:08 补充）**——用户 06:52「queued跑到右边Activity区去了…」+ 07:08「排队中的时候要先是在输入区的上面，不是在右边！」：
   - 机制（**受理 ⇒ 待发送件住输入区上方带——非流内块**）：忙态提交 ⇒ 待发送件入**输入区上方待发送带**（消费前流内零块）；标记形单源 = 核 `thincoder-render-core/flow/queued-mark.mjs` 导出直消费（`markPending` / `paintLabel`——`pending` 类与标签两形态字面单源；`planBusyQueued` / `clearPending` 不消费——见下行登记）；
     消费（步边界注入 ∕ 回合尾送达两时刻）⇒ 带项退场 ∧ 同帧由流内用户块承接（**消费恰一枚**——零重复入流）——队列归属 ∕ 消费时序 = 本档 §1「本批注（回合中插入 · 步边界 pickup）」（该批收正：队列权威由渲染面本地改**宿主单源**）。
     - **不消费**（登记非缺口）：`planBusyQueued`（宿主快照对账面 = VSC 专有——桌面快照形 = `ev:queue` 的**文本串数组**显示镜面（A9 收正），无合并 / 去重语义）；`clearPending`（桌面交接 = 组项退场 + 块入场（节点换代），非原地清标）。
   - **队列按会话分键**：`pending: { [会话键]: string[] }`——**快照镜面**（条目 = 文本串——A9 收正）（写者 = `ev:queue` 归约；权威 = 宿主内存表按会话分键——「回合中插入」批收正：原三纯动作 `enqueue` / `dequeue` / `drainQueue` 随本地队列退场）。
     分键两由（不变）：① 待发送件按会话归属（带面随活动会话）⇒ 队列须带键（否则未受理件随切会话漂页）；② 消费目标 = **事件键**（切会话后不会把 A 的队发进 B）。
   - 落点：`thincoder-desktop/src/main/queued-input.mjs`（已落 · 实读 **78**（2026-09-29——队列取项边缘收正批后）· 队列单源）· `thincoder-desktop/renderer/queue.mjs`（快照应用纯动作）· `thincoder-desktop/renderer/events.mjs`（`ev:queue` 归约——镜面 + 用户块）· `thincoder-desktop/src/main/ipc.mjs`（`history:page` 回执 `queue` 键——冷启 ∕ 重载镜面重建）；
     `thincoder-desktop/renderer/views/chat-pending.mjs`（带面构树——形零改）· `thincoder-desktop/renderer/views/statusline.mjs`（段 14 读镜面）· `thincoder-desktop/renderer/app.mjs`（`CHAT_KEYS` 增 `pending`）· `thincoder-desktop/renderer/chat.css`（气泡形）。
   - **形态与落位**：`[data-pending]` 组 = **输入区上方待发送带**（**非流内**——零 `data-block-id` ⇒ 块序与 `data-blocks` 不变式不受影响）；落位 = 输入行上方带（贴输入框上沿——消费面 = `paintNotices` 每帧重挂整组）；
     项 = 待发送气泡（`.block.block-user` 形 · `.msg-label` 由核原语落笔 · 文本面 `mdInline`——与用户块同面）。
   - **右列「队列」族不再承载用户排队消息**（席位**保留 · 零写者** ⇒ 族空 ⇒ 零节点恒不在场——父侧 §1.8 口径「该族回归『排队中回合 / 工具批』本义」；摘除候选**被否**：口径句 + 未来写者接入座）。
   - 判据：**机检** = 归约用例（快照整置 / 消费回执 ⇒ 组退场 + 尾块 = `user` / 满队判据）+ 视图用例（组在场 ⟺ 本会话队非空 · 项数 = 队长 · 标签两形态 · **消费同帧恰一枚**）——承载 = 随批单元证据；
     **真机** = 忙态发送 ⇒ 输入区上方带 `⏳` 待发送件在场 ∧ 右列零队列条目 ⇒ 步边界注入（下一次可见）⇒ 标签转 `❯ You:` + 队读数随动。
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
   - 边界：**1s 走时刷新已落**（VSC `panels.js` 同点——原归第三批「小修族」）；`sub.desc` 说明行**落**（会话首个活动块 · 一次性）；
     **R10 消差落定（端差清算批）**：判据 = **挂载根级旗标**（`root._subDescShown`——置位不重置 ∕ 重建恒在）——与 VSC **面板级**同判（`thincoder-vscode/webview/state.js:42`）；**归档回显不带该行**（`.sub-desc` 与 `.advisor-content` 互为兄弟 ⇒ 不入 tail-3 射程——单源 = `docs/vsc/design/WEBVIEW-INPUT.md`）；宿主侧剥前缀（渲染面零析 `role#id/`）不变；consult ∕ escalate 族停钮 = **补做**（批 `docs/batches/2026-09-29-hatch-clearance-2.md`——核 `CANCELABLE_ROLES`；核档 §9 端差③ 收正）。
     **#518 跟滚收口** = 本档「本批注（子 agent 块内容区跟滚 · #518 收口）」（块内容区跟滚 + 区帧钉底 + 值面两条）。

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
   - 边界：`data-raw` 锚不变（就地更新判据面）；标签行为**块内子节点**（不入块序 / 不改 `data-blocks`）。

5. **终态折叠 + 归档入流（#498）**——用户 07:01「刚才不是有个子agent在跑吗？……为啥没了？」：
   - 机制：子 agent 终态 = **折叠 + 归档入流**（VSC 同径——核 `subblocks/state.mjs` 三迁：普通终态**即时归档** ∥ `settled` **驻留待消化**（`awaitingDigest`）后由后到 `done` 归档 ∥ 旧代接管即归档）。
   - 落形：归档 ⇒ ① 池内块退场（DOM 摘除）② **流内归档新增块**（块型 `subagent`——`data-block-kind="subagent"`；壳 = 零边距透传容器 `.block-subagent`，内嵌**核件元素**（冻结形 `[✓ … done Ns]` + tail-3 留场 + 可展开内容）；
     块序 = 归档序（与 VSC 的 append 序同形））③ 表项留存为**墓碑**（`region: "flow"`——迟来事件按 `drop-frozen` 消化：不复活 / 不重复补桩）；表项 `rows` 随归档交给流内快照（**内容单留存处**）。
   - **归档块锚 = 末轮元素之前——唯经块序守卫**（末轮元素即块序尾位〔其后无块节点〕⇒ 边界前插；否则退化 = 常规块插入点；无轮 ∕ 元素缺 = 守卫不过特例——两径皆落块序尾位；= VSC `archiveBlock` 边界径同形〔位差由块序不变式定——单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条〕；裁定 = `docs/desktop/design/PROJECT.md` §2 **KD-33**）；`clearAwaiting` 由核件清标志后刷新（端侧照模型态派生——核 effects 表**不逐条执行**，端面动作由模型态幂等派生；登记理由 = 桌面无 DOM 区概念，`connectedOf` / `regionOf` 由模型字段供给）。
   - 落点：`thincoder-desktop/renderer/events.mjs`（`region` 写 + 流内块快照追加；`archiveFrozen` 删）· `thincoder-desktop/renderer/views/chat.mjs` + **`thincoder-desktop/renderer/views/chat-subagent.mjs`**（已落 · 实读 **75**（2026-09-29）· 归档块构树）·
     `thincoder-desktop/renderer/views/activity.mjs`（表项 `region` 过滤）· `thincoder-desktop/renderer/chat.css`（`.block-subagent` 透传壳）。
   - 判据：**机检** = 归约用例（终态 ⇒ 表项 `region:"flow"` ∧ `blocks` 尾块 `kind:"subagent"`；`settled` ⇒ 驻留（池内）不归档；后到 `done` ⇒ 归档；**下回合起不清出**——对拍旧口径）+ 视图用例（流内冻结形在场 · 右列退场）；
     **真机** = 子 agent 跑完 ⇒ 流内留 `[✓ …]` 块（右列退场）。
   - 边界：归档块 = **留档块**（留档批 · #719——块体入人读线记录 ∥ 页读重建：刷新 ∥ 重载 ∥ 切走切回均在；页读域第六型）；窗限 / 裁剪随既有窗口机制（`MAX_RENDER_BLOCKS`；**留档块记账** = 计 `data-hidden` ∥ 退窗折摘要块 ∥ 可回填——判据单源 = `docs/desktop/design/RENDERER.md` §2 留档块记账条）；冻结块**不再刷新**（静态）。
6. **右列加宽一倍（#500）**——用户 07:06「右边栏太窄了，要放宽一倍，才够比较好的显示子agent的活动」：`--pool-w: 18rem ⇒ 36rem`（`thincoder-desktop/renderer/theme.css:19` **单源**；`:86` 主栅格与 `:339-342` 窄断点行**同变量引用** ⇒ 自动随动，零第二处数值）。
   判据：**机检** = 值落点锁（随批单元证据：变量值 = `36rem` ∧ 两处引用皆 `var(--pool-w)`）+ **真机读数**（右列实测宽 ≈ 576px；< 900px 断点态同值）+ 改前 / 改后同机位对照帧。
   边界：**窄窗效应登记**（窗口 < ~1100px 时中列受挤——断点面随 R13 消解（零断点——本档「断点」行）；池面窄态 / 第二断点 = **另裁**，不入本批）；池内布局 / 族序零动。

**计数（本批 · D3）**：六件 = **A1 推理钉底** · **A2 排队非流内 + 队列分键** · **A3 子 agent 核件同款** · **A4 说话人标识** · **A5 折叠 + 归档入流** · **A6 右列 ×2**；受触碰形态行 = 四行（对话流 / 输入区 / 状态栏 / §2 项 1）+ 布局 / 断点连带（项 6）；
新档 **2**（功能档——`views/chat-pending.mjs`（已落 · 实读 **69**（2026-09-29）） · `views/chat-subagent.mjs`（已落 · 实读 **75**（2026-09-29）· 归档块构树））+ **拆分产出 2**（`renderer/page-read.mjs` · `renderer/queue.mjs`——结构拆分 · 本批执行，见 §4.2）；新通道 **1**（`ev:subchunk`——单源 = `docs/desktop/design/IPC.md` §1）。

**本批注（对齐第三批 · 小修族 24 + 相抵 2 · 2026-09-28）**：本注定形「小修族 24 条 + 两条相抵」的**对齐形**（用户 07:11 裁定：**不存在「用户的不做」——流程自划的例外一律按对齐办**；需求档 §3.1:51 / §5.1 已收正）；用户 07:13「剩下的你自动跑完吧」授权下立批。口径 = 需求档 §3.6（**「对齐」= VSC 的形 + 行为**）；交底 = 逐条「现状 → 对齐形 → 落点 → 判据」；条目全文与出处 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1 / §2。
核面新消费件（`formatToolSummary` / `isToolFailure` / `diff.mjs` 三导出 / `linkifyPaths` / 核台账行产）单源 = `docs/render-core/design/RENDER-CORE.md` §4 / §5；本注只述端侧形态 / 落点 / 判据 / 边界；通道载荷增键与白名单收正 = `docs/desktop/design/IPC.md` §1 / §2。

**A. 对话流面（12 项）**

1. **工具卡·结果摘要行**——现状：头行四段、零摘要（核件 `tool-summary.mjs` 未接）。对齐形：头行增**摘要段**（`data-seg="summary"`）——字面 = `→ ` + 核 `formatToolSummary(name, result)` 直取（read / write / grep / glob / bash / advisor / 默认七分派）；
   判据 = 摘要非空才落（缺 ⇒ 零段）。落点 = `thincoder-desktop/renderer/views/chat-tool.mjs`（`toolHead`）。判据：机检 = 视图用例（`bash` 末行摘 / `read` N lines / 无摘要零段）；真机 = 与 VSC 同刻对照。
2. **工具卡·失败判据（红绿）**——现状：宿主 `ok: !startsWith("Error:")` ⇒ `(exit code 1)` / 全角 `Error：` 误判。对齐形：`ok = !isToolFailure(result)`（核 `lib.mjs` 判据单源——半 / 全角 `Error[:：]` 头 · 独立成行 `(exit code N≠0)` / `(killed: …)` / `(spawn failed)`）；
   头行色 = **VSC 逐值（#38 裁定 · 2026-09-29——本句为准）**：`name` 段 = `color: var(--accent)`（VSC `.tool-call-name` 600 + accent）· `args` 段 = `color: var(--fg)`；
   **两态色（`error` ⇒ `#f14c4c` ∥ `"done"` ⇒ `#4ec9b0`）归 `status` 段内联**（`[data-status]` 整行两态色退场——「整行两态」不保留：非 VSC 形，若保留须过真端差三件齐并成文）；耗时段一行（11px ∕ .6）与此一并落（#25 裁①）；
   **码面落法** = `thincoder-desktop/renderer/chat.css`：头行容器去 `[data-status]` 两态色规则 → `[data-seg="name"] { color: var(--accent) }` + `[data-seg="args"] { color: var(--fg) }` + `[data-status="error"] [data-seg="status"] ⇒ #f14c4c` ∕ `[data-status="done"] [data-seg="status"] ⇒ #4ec9b0`（值源 = VSC 内联色）；
   失败默认展开（既有 `isExpanded` 判据含之——零动）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/chat.css`。
3. **工具卡·运行期实时输出**——现状：`result` 只累不显（视图仅展开态落体）。对齐形：**运行期卡体在场 + 展开**——`result` 非空 ∧（显式 `expanded` ∨ `status === "running"` ∨ `"error"`）⇒ 体落；**chunk 到达清显式折叠旗**（运行期展开由增量驱动——与 VSC 同径）。
   落点 = `thincoder-desktop/renderer/events.mjs`（`onToolOutput`）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（`isExpanded`）。判据：机检 = 归约 + 构树两例；真机 = 长命令边跑边见。
5. **中止·未结算卡清扫**——现状：停止后运行中卡永停「执行中…」。对齐形：`stopped` 终局（本键）⇒ 未结算工具块（`status === "running"`）就地改 `status: "interrupted"`（体 / 折叠态不动——VSC 同）；
   状态词 = **已中断**（闭枚举 **8 词**——词键 `tool.interrupted`，值逐字同 VSC locales）。落点 = `thincoder-desktop/renderer/events.mjs`（`onActivity` 尾支）
   + `thincoder-desktop/renderer/views/chat-tool.mjs`（`STATUS_WORD`）+ `thincoder-desktop/renderer/i18n.mjs`。**摘要段（端差清算批收正）**：`status === "interrupted"` ⇒ 摘要槽值 = 逐字 `(interrupted)`（值源 = VSC `thincoder-vscode/webview/streaming.js:111`；`→ ` 前缀由既有摘要段格式自带；覆盖 `formatToolSummary` 派生）。
6. **中止·流内 `[stopped]` 痕**——现状：零消费。对齐形：`stopped` 终局（本键）⇒ 流内**非块节点**停止痕 `div.chat-stopped[data-stopped]`（落点 = 块序列之后、卡序列之前——尾段族同侧；沿 `[data-digest]` 先例），词 = `status.stopped`（**核键直取**——两语逐字）；
   样式 = 提示色 + 斜体（值源 = `thincoder-vscode/webview/streaming.js:141`）；清点 = 页读整置（运行期痕——非落盘件）。落点 = `thincoder-desktop/renderer/events.mjs`（切片 `stopMark`）+ `thincoder-desktop/renderer/views/chat.mjs`（非块节点组构树）+ `thincoder-desktop/renderer/chat.css`（组样式——提示色 / 斜体）。
7. **流式·子回合边界 turnBreak**——现状：桥零该面、续写并块（推回段界丢失）。对齐形：宿主接**核 `onSubTurnBreak`**（端差清算批收正——窄义钩子）⇒ 出站 `ev:activity { event: "turnBreak" }`（无 `fields`）⇒ 归约 = **清游标**（尾块追加态收束 ⇒ 下片文本起新块——VSC `streaming.js:71-88` 复位语义）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `thincoder-desktop/renderer/events.mjs`。**消解（端差清算批 · 2026-09-29）**：核补窄义钩子 `callbacks.onSubTurnBreak`（`thincoder-core/agent/completion.mjs` 六推回点——工具批尾 ∕ 中断注入两支零触）⇒ 桌面桥改挂 ⇒ 中断注入不再产 `turnBreak`（与 VSC 同「不断块」）。
8. **恢复帧·推理 / 正文次序**——现状：`blockOfMessage` 序 = `[text, reasoning, tools]`。对齐形 = `[reasoning, assistant, ...tools]`（核 `thincoder-render-core/flow/block.mjs:97-105` 序）。
   落点 = `thincoder-desktop/renderer/page-read.mjs`。连带 = `T-DSK37` 块序收正（`user / assistant / reasoning` ⇒ `user / reasoning / assistant`——E2E 档 + 集成用例随动）。
9. **错误横幅（详情 + 重试）**——现状：纯文本块、零出口。对齐形：错误块 = 横幅 = `.error-text`（原样）+ [`.error-details`（`techInfo` 在场才落——`details > summary` + `pre` 原生折叠）] + **重试钮**（词键 `error.retry`——值同 VSC）；
   重试出口 = **重发末 `user` 块文本**（经输入区既有直发径——单一实现零副本 · **零新通道**）；钮在场判据 = 末 `user` 块在场（否则零钮——诚实面）；`techInfo` 载波 = `ev:error` 载荷增键（宿主 `err.stack`——缺 ⇒ 键缺席）。
   落点 = `thincoder-desktop/src/main/agent-host.mjs` + `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs` + `thincoder-desktop/renderer/i18n.mjs`。边界：重试失败 ⇒ `console.error`（零乐观写）。
12. **台账行 ledgerNotice**——现状：零（仅状态行台账段）。对齐形：流内**台账行**——核行产 `{ text, warn }` 逐字（类名面 = 核 `ledger-line` / `.warn` 同形）；通道 = **`ev:ledger`（新）**（载荷 `{ key, lines }`）；
   触发 = **启动拍 + 周期拍**（`REFRESH_MS` = 120s——R8 落；对位 VSC startup + 周期两拍）；落点 = 流尾非块节点组 `[data-ledger-line]`（逐行）；数值面 = 核 `runLedgerScan` 直取（端侧零行构造）（单源 = `docs/desktop/design/IPC.md` §1 `ev:ledger` 行）。
   落点 = 主侧（`thincoder-desktop/src/main/project-info.mjs` 扩 + `ipc.mjs` / `preload.cjs`）+ `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/views/chat.mjs`（组构树）+ `thincoder-desktop/renderer/chat.css`（组样式）+ `core.css`（核行类名映射）。
13. **滚动·发送后回底**——现状：停跟期间发消息原地不动。对齐形：`msg:send` 受理（用户块入流）与回底**并笔**（`appendBlock` + `returnToBottom`——`following: true` / `pendingNew: 0` ⇒ 帧尾 `stick` 贴底）；直发 ∕ 排队消费回执两径同判（「回合中插入」批收正）。落点 = `thincoder-desktop/renderer/mount-composer.mjs`。边界：入队径（忙态）不回底（受理面才回底——与 VSC 同）。
14. **工具卡·advisor 轮次标签**——现状：载荷无 round。对齐形：`ev:tool-call` 载荷增 `round` / `model`（仅 `advisor` 名；值 = 核 `agent._advisorRound` 活读 +1 / `agent.provider?.model`——宿主只读采样面注入桥）；
   视图 = 头行段 `round` = `(round N · model)`（格式串 = VSC `ui.js:104-107` 同式；缺 ⇒ 零段）。落点 = `agent-bridge.mjs` + `agent-host.mjs`（采样面）+ `thincoder-desktop/renderer/views/chat-tool.mjs`。
15. **空态·欢迎条**——现状：`no-message` 单行 hint。对齐形：`no-message` 帧增**欢迎条**（三行）= 抬头（`welcome.heading`）+ 文案（已配 ⇒ `welcome.textConfigured` ∥ 未配 ⇒ `welcome.text`——值逐字同 VSC）
   + 快捷键行（`welcome.shortcuts` = 本端键位）；**端差消解（@ 文件引用对齐批 · 2026-09-29）**：VSC 行含 `@` 文件引用段——本端同段已落（词值 ∕ 链 = 本档 §1「本批注（@ 文件引用对齐 · 2026-09-29）」）。
   落点 = `thincoder-desktop/renderer/views/chat-guide.mjs` + `thincoder-desktop/renderer/i18n-views.mjs`。边界：`no-project` / `no-session` 两帧零动。

**B. 外围面（12 项）**

1. **审批卡·owner 归属**——现状：载荷无 owner。对齐形：载荷增 `owner`（核 `opts.owner.label` 原样——`coder#2` / `consult <model> #id` 形）；卡首行增段 `owner`（`<owner> · <tool>`——owner 在场才落）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs`（接核 `onPermissionRequired` 缝）+ `suspensions.mjs`（载荷）+ `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `owner`）+ `thincoder-desktop/renderer/views/approval.mjs`。前提：owner 只在**子代理门**在场（深度 0 ⇒ 缺席 = 既有形，零回归）。
2. **提问卡·Enter 提交**——现状：Enter = 换行。对齐形：Enter（非组字）∧ 输入非空白 ⇒ 提交（复用 `onAnswerDraft` 径——单一实现）；Shift+Enter ⇒ 换行；IME 组字期零动作（沿「交互」行判据）。
   落点 = `thincoder-desktop/renderer/views/question.mjs` + `mount-cards.mjs`。
3. **提问卡·聚焦两态**——对齐形：① 新卡插入入场 ⇒ `[data-input="answer"]` 聚焦；② 作答 / 取消回执 `ok` 真 ⇒ 回焦输入区 `[data-input="text"]`。落点 = `mount-cards.mjs`。边界：失败径零动（卡留场可重试）。
5. **活动区·「等待审批」态**——现状：零消费（子代理等审批仍显「运行中」）。对齐形：接核 `onSubagentApproval({ id, role, model, tool })` ⇒ `ev:subagent` patch `{ status: "approval", …, tool }`（`tool: null` = 清态）；
   归约面 `SUB_STATUS` 增 `approval` · `SUB_KEYS` 增 `tool`；块面 ⏸ + `sub.awaitingApproval`（核件 `refreshBlock` 直出——零端侧词面）。落点 = `agent-bridge.mjs` + `thincoder-desktop/renderer/subagent-reduce.mjs`。
6. **停止钮角色门**——**已由「对齐第二批」核件直消费落地**（核 `subblocks/activity-view.mjs` `FAMILY_ROLES` 门在核件内——桌面 ⏹ 全走核件）；本批 = 机检补例（**consult ∕ escalate 停钮 = 修后在场**〔批 `docs/batches/2026-09-29-hatch-clearance-2.md` 补做——`CANCELABLE_ROLES`〕· explore ∕ coder 在飞路径不变）。
7. **1s 心跳（走时）**——现状：渲染面零定时器（秒数冻结到下一事件）。对齐形：渲染面 **1s 拍**（首个渲染面定时器）= ① 池面在飞块逐块 `refreshBlock`（判据 `isConnected ∧ !frozen`——走时词面）② 本键位标含 `running` ⇒ 状态行重挂（耗时段走时）。落点 = `thincoder-desktop/renderer/app.mjs`（单点 `setInterval` + 卸载清点）。判据 = 机检（假钟 + 清点）+ 真机（秒数逐 1s 走）。
12. **会话栏·末项删除门**——现状：恒出（可删到零会话）。对齐形：**渲染面门** = 行常态删除控件在场判据 = 会话数 > 1（VSC `session-bar.js:57-59` 同判）
   + **主侧门** = `session:delete` 末项 ⇒ 拒（新 reason `last-session`——VSC 宿主同门先例）。落点 = `thincoder-desktop/renderer/views/session-control.mjs`（条目 ✕ 门——`>1` 才显） + `thincoder-desktop/src/main/session-actions.mjs`。
14. **设置面·类型加工**——现状：agent 段全 `type:"text"`（布尔 / 数值键写不进）。对齐形：控件型按 `field.kind` 三值（`string` ⇒ `text` ∥ `number` ⇒ `number` ∥ `boolean` ⇒ `checkbox`）；
    出值规范化 = 数值 ⇒ `Number(v)`（空 / 非数 ⇒ **零发送**——不写盘 · 零乐观改 · 控件回退现值）· 布尔 ⇒ `.checked`。落点 = `thincoder-desktop/renderer/views/settings-sections.mjs`（`agentFieldNode`）+ `mount-settings.mjs`（取值面）。
    真删键在 `patch` 链不可达（`docs/desktop/design/IPC.md` §2 档位控件注「`patch` 表达不了删键」· 核 `thincoder-core/agent-tools/settings.mjs:134-145` 类型表对 `null` 抛错——「显式清除」语义现只对形状表键族）⇒ 端差登记 = **VSC 删键（`Number(v) || undefined` 径）∕ 桌面零发送**（父侧裁定 2026-09-28；消解路 = 主侧写链 + 核清除形扩族——另批）。
15. **设置面·agent 形态**——现状：点分路径泛化表单 + 保存键。对齐形：**具名控件区**（十键 = `maxTurns` / `subagentTurns` / `poolLimits.{engCoder,other,advisor}` / `compactThreshold` / `verifyGuard` / `consultTurns` / `consultTimeoutMs` / `advisor.reasoningEffort`——词键标签 + 三控型 + 锚 `data-field-name`）
   + **即改即存**（`change` ⇒ 单键 patch 直发；回执 ⇒ 就地刷新；失败 ⇒ 回退 + 可见失败面——零保存键）；表外标量键 = 泛化行兜底（保留编辑 + 保存键——零能力削减）。
   落点 = `thincoder-desktop/renderer/views/settings-sections.mjs` + `mount-settings.mjs` + `i18n.mjs`。**端差（保留零动——端差清算批裁 · 2026-09-29）**：VSC 全具名（桌面保留泛化兜底行——反向差：对位令单向（VSC 有 ⇒ 桌面必有；反向未含）∥ 项目钮族先例）。
22. **附件·非栅格拒绝时机**——现状：先显缩略图、发出才知被丢（`partial`）。对齐形：**粘贴即拒**——栅格四型（png / jpeg / gif / webp）之外（含 `image/svg+xml` / `image/heic` / `image/bmp`）⇒ 不入条 + 提示行（词键 `paste.unsupportedFormat` 值逐字同 VSC——含 `${type}`）；
   提示行 = `composer-notice` 单形（`data-notice="attach-unsupported"`），下次成功采集 / 发送替换清。落点 = `thincoder-desktop/renderer/attach.mjs` + `mount-composer.mjs`。边界：主侧判据（`parseDataUrl`）零动（双闸——渲染面拒先达）。
26. **错误·发送失败可见性**——现状：只 `console.error`。对齐形：直发失败（`ok` 假 / 抛）⇒ 输入区提示行（`data-notice="send-failed"`；词键 `composer.send.failed` 带 `${reason}`）+ 文本保留；下次成功发送清。落点 = `mount-composer.mjs` + `i18n.mjs`。判据 = 机检（失败 ⇒ 提示行 ∧ 文本留）+ 真机（`provider-invalid` 可见）。
28. **输入区·中断键两态**——两态 = **显 ∕ 隐**——在飞（本会话位标含 `running`）⇒ 显；否则 ⇒ 隐（核件 `thincoder-render-core/composer/panel.mjs:404`——`running` ⇒ `display:flex` ∕ 否则 `none`；输入面板 = 核件工厂，两端同件同形）。**挂起窗在飞档**：消化 ∕ 唤醒轮在飞 ⇒ 该轮即普通回合面（`ev:activity` `turn` 帧 ⇒ 位标含 `running`）⇒ 显（中断 = 回合级——单源 = `docs/desktop/design/IPC.md` §2 `msg:interrupt` 窗内支）；窗空闲等待期（无在飞回合）⇒ 隐（通道级防线 = `{ok:false, reason:"idle"}`——键面零死控）——**判据单源 = 位标切片含 `running`**（`thincoder-desktop/renderer/views/chrome.mjs` `busyOf`——与输入区忙态同式；`suspActiveOf` = 出泡抑制面判据，非本键判据面）。落点 = `thincoder-desktop/renderer/mount-composer.mjs`（输入面板 = 核件工厂 `createComposerPanel`——两态住核件）。

**C. 相抵两条（需求档 07:11 已收正——本批实现面）**

1. **审批卡·diff 预览（原「不做 diff」）**——对齐形：载荷增 `diff`（核 `diffInfo` 原样——两形 `{ patch }` ∥ `{ old, new, path }`）+ 卡面 **diff 节点**（`.diff-preview`：header + 行级差）——行面 = 核三导出直取（`patchLineType` / `lineDiff` / `renderDiff`——值源单源）；
   超阈（patch > 20 行 ∥ 改动 > 12 行）⇒ **只出摘要 + 计数**（桌面零外部查看器——同工具卡降级判；VSC「view in editor」钮不采）。
   落点 = `thincoder-desktop/src/main/agent-bridge.mjs` + `suspensions.mjs` + `thincoder-desktop/renderer/events.mjs`（`APPROVAL_KEYS` 增 `diff`）+ `thincoder-desktop/renderer/views/approval.mjs`；
   样式 = `thincoder-desktop/renderer/chat.css`（diff 类名映射——值源 = VSC `base.css:405-432`；新增变量 `--diff-add-bg` / `--diff-add-fg` / `--diff-del-fg`，`--diff-del-bg` 在册）。
2. **文件链接点开（原「文件打开暂缓」）**——对齐形：工具结果区**可点文件链接**——线 = `ev:tool-result` 载荷增 `links`（`[{ raw, path, line? }]`——宿主计算：路径 token + **盘上存在闸** + 去重 + 封顶；语义同源 = `thincoder-core/file-links.mjs`（R2 处理流批上提后核单源），两端薄壳 = 探针注入——**只述实现形态**；
   行参面 = 探测径命中 ⇒ 含行；兜底径 = `shell.openPath`（无行参——宿主事实，单源 = `docs/desktop/design/PROJECT.md` KD-39））；
   视图 = 结果区挂核 `linkifyPaths`（`span.file-link` 核类名——帧尾着装幂等）＋ 着装面落 **`data-path` 锚**（值 = 该链接盘上绝对路径——核件不带 ⇒ 端侧着装时落；断言面 = T-DSK42 / T-DSK43）；出口 = 点按 / Enter 委托 ⇒ 通道 `file:open { path, line? }` ⇒ 主进程打开。
   落点 = 新档 `thincoder-desktop/src/main/file-links.mjs` + `agent-host.mjs` + `ipc.mjs` / `preload.cjs`（白名单）+ `thincoder-desktop/renderer/views/chat-tool.mjs`（着装）+ `mount-*.mjs`（委托单点）+ `core.css`（类名映射）。
   **消解（端差清算批 · 2026-09-29）**：桌面打开 = 外部编辑器 CLI 探测（`code` → `code-insiders` → `cursor` → `subl`——命中 ⇒ spawn 含行参 ⇒ 打开到行；未命中 ∕ spawn 败 ⇒ `shell.openPath` 兜底恰一次；实现 = `thincoder-desktop/src/main/editor-open.mjs`）。边界：历史卡（页读面）零链接（VSC 同径）；`file:open` 失败 ⇒ `console.error`。

**F. 出处重核输出（入本批两件 · 全表 = 批档 §2）**

- **审批卡·真置焦执行**（原 open 项：出处 = 流程自划「未落」）⇒ **入本批**：帧尾对 `[data-autofocus="1"]` 执行 `focus()`（VSC `permission.js:76` +50ms 先例——桌面取挂载后即焦）；落点 = `thincoder-desktop/renderer/views/chat.mjs` 帧尾着装 / `thincoder-desktop/renderer/views/approval.mjs`。
  判据：**机检** = 随批单元证据（卡内 `[data-autofocus="1"]` 恰一 ∧ 帧尾执行点——假 DOM 无焦点面 ⇒ 执行读数归真机）；**真机** = 人工走查 + 父侧真跑闭合（真 Electron：卡出现即 `document.activeElement` = 卡内焦点锚——T-DSK43 ⑥）。
- **设置面 / 向导·Esc 关闭**（原「零 Esc 绑定」：出处 = 流程自划「有意」；对位面 = VSC Esc 关设置面）⇒ **入本批**：`document` 级 `keydown` ⇒ Escape ⇒ 关闭（经既有 `settings:close` 出口——单一实现；向导态不在本项）；其余浮层族（下拉 / 菜单 / 中断模式）桌面零对位面 ⇒ 零动。
  判据：**机检** = 真 Electron 面（用例面 = 随批单元证据）——真点设置入口（输入区控件行出口）⇒ `keyboard.press("Escape")` ⇒ `[data-slot="settings"]` 清空（T-DSK43 ⑤）；**真机复核** = 人工走查。

**D. 计数（D3）**：小修族 = 对话流 **12** + 外围 **12** = **24** · 相抵 **2** · 出处重核 **12**（逐条处置表 = 批档 §2）；状态词闭枚举 **8 词**；新通道 **2**（`ev:ledger` 事件——§1 十五 ⇒ 十六通道；`file:open` 请求——白名单 **28 ⇒ 29 项**）·
   载荷增键五处（`ev:tool-call` `round` / `model` · `ev:approval` `owner` / `diff` · `ev:error` `techInfo` · `ev:tool-result` `links` · `ev:activity` `turnBreak`）；
词键增 **≈18 × 2 语**（`tool.interrupted` · `error.retry` · `welcome.*` 四 · `composer.send.failed` · `paste.unsupportedFormat` · 设置面具名十键 · 提示面一——实施轮按盘面实读计，不以计数为门）；新档 **1**（`file-links.mjs`）+ 拆分产出 **1**（`renderer/i18n-views.mjs`——已落 · 实读 **332**（2026-09-29）；单源 = `docs/desktop/design/PROJECT.md` §4.1）；渲染面**首个定时器**（1s 拍）。

**本批注（回合中插入 · 步边界 pickup · 2026-09-28）**：本注定形桌面端「回合进行中插入用户指令」（用户 2026-09-28 14:08 走查「会话中插入用户指令的功能在桌面端也丢了」）——B1 宿主接缝 ∕ B2 渲染面时序 ∕ B3 附件边界三面；条目 = `docs/batches/2026-09-28-desktop-midturn-input.md` §1；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**；台账 #509。

1. **队列单源 = 宿主（主进程）**——忙态提交 ⇒ `msg:send` **一律交宿主任判**（受理判据 = 宿主在飞表；渲染面**不再本地判忙入队**）：受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **消费前流内零块**（待发送件住输入区上方带——项 4 形态；消费时刻入流恰一枚）；满队（第 9 条，按键判）⇒ 回执 `{ ok: false, reason: "queue-full" }` + 失败行（词键 `composer.send.failed`）+ **本地块退流** + 稿留输入历史（`↑` 召回）。
   镜面：`pending: { [会话键]: string[] }` 切片 = **宿主快照镜像**（条目 = 文本串——A9 收正）（写者 = `ev:queue` 归约；权威 = 宿主队列）；冷启 ∕ 重载重建 = `history:page` 回执 `queue` 键（首屏读）。
   落点：`thincoder-desktop/src/main/queued-input.mjs`（已落 · 实读 **78**（2026-09-29——队列取项边缘收正批后）——队列 + 计划取批：合并常量 8 ∕ 2000 与合并形态同 CLI ∕ VSC 值）· `thincoder-desktop/src/main/agent-host.mjs`（受理路由 + 续发链）· `thincoder-desktop/src/main/turn-face.mjs`（`consumeQueuedInput` 传参）；
   `thincoder-desktop/renderer/queue.mjs`（快照应用）· `thincoder-desktop/renderer/events.mjs` + `thincoder-desktop/renderer/events-subscribe.mjs`（`ev:queue` 订阅与归约）。
   判据：**机检** = 宿主用例（在飞提交 ⇒ 入队 + 回执形；第 9 条 ⇒ `queue-full` 零入队）+ 归约用例（快照整置 ∕ 消费回执）+ 计划面值对拍锁（与 CLI 副本同值）；
   **真机** = 忙态提交 ⇒ 气泡在场 ∧ 段 14 读数 = 1（**零 `busy` 拒面**）。
2. **消费两时刻（步边界注入 ∥ 回合尾送达）**——步边界 = 核循环头缝（`consumeQueuedInput`——**缝只接不改**）：用户回合传回调（系统轮 ∕ 消化轮不传；**timer 轮（`timerTurn` 真）同按 `autoTurn` 分流**——`autoTurn` 真 ⇒ 与消化轮同、缝不传，队列留待该轮回合尾续发）、取批按计划（**统一语义 = 计划首动作即消费**——`slash` ⇒ 单条即消费〔见项 5〕）、注入 = `pushReal` 普通 user 消息（**不中断**：在飞工具 ∕ signal 零触碰 · 下一步生效）；
   回合尾 = 结算（三径同判据）后队非空 ⇒ 宿主**续发**（起跑前查在飞表——已有在飞 ⇒ 零续发；取批 ⇒ 普通回合送达，递归至队空）⇒ 队空才进既有挂起窗接管（**队列先于接管**）；会话中止（`dispose` ∕ 切项目）⇒ 队清 + 零续发。
   呈现（两时刻同形）：`ev:queue` 消费回执 ⇒ 待发送带该项退场 ∧ 同帧用户块入流（**消费恰一枚**——本径零本地块）；段 14 读数随镜面。
   **渲染面回合尾 flush 携行随本批退场（`onTurnTail` 窄口存续——标题刷新消费面不动）**（双写者会造同条重复投递）。
   判据：**机检** = 宿主用例（步边界注入 ⇒ 历史尾 = `user` ∧ 批 ≥2 合并一次消费；结算后续发 ∕ 队空接管 ∕ 中止零续发）+ 归约用例（回执 ⇒ 气泡摘 + 尾块 = `user`）；**真机** = 忙态发两条 ⇒ 首条于下一步边界后可见（用户块 + 气泡交接）∧ 末条随回合尾送达。
3. **附件边界 = 留队（条目携图 · 步边界让位 · 送达面判决）**——条目可携 `images`（**dataURL 串数组**原样——A1 收正）；**批内含图 ⇒ 步边界不消费**（同步缝不可落盘 ∕ 降级）⇒ 留队待回合尾送达面：`prepareTurnAttachments`（既有面——落盘 ∕ 非视觉降级 ∕ 弃项）判决，降级码随消费回执 `delivered.degraded` 浮出（零静默）；气泡显示文本（图随条目走——两端同形；`dataURL` 不回传渲染面）。
   理由 = 端差默认消灭（VSC 条目携图 = 同语义面）；拆行 ⟹「文本引用附件被分离投递」内容错配；拒 ⟹ 阻塞用户意图 + 与 VSC 分叉。被否：拆行 ∕ 拒 ∕ 入队即落盘（VSC `savePastedImages` 形——桌面落盘面现只在送达点；入队即落盘 = 新落盘面 + 队清 ∕ 中止清理面；**登记消解径 = `docs/desktop/design/PROJECT.md` §10 BM**）。
   判据：**机检** = 宿主用例（携图条目 ⇒ 步边界不消费 ∧ 结算续发送达 ⇒ 附件面被调 + `degraded` 随回执）；**真机** = 忙态携图提交 ⇒ 气泡在场（文本）⇒ 回合尾送达后模型侧得图指引。
4. **形态零改面**：待发送带 ∕ 段 14 ∕ 满队提示 ∕ 右列「队列」族席位——形态与既有判据零改，只换**来源**（镜面）；待发送带两形态（单条 ∕ 多条标签——词键 `chat.pending.*`；逐条原文 `[data-raw]` ∕ 尾标记）与交接纪律照旧（本档 §1「本批注（对齐第二批 · 六件）」项 2）。
5. **边界（不做）**：斜杠文本入队门禁零改（**统一语义 = 计划首动作即消费**——`slash` 首条步边界 ∥ 回合尾同判即消费（单条 · 保序 · 不合并 · 零静默丢）；桌面无斜杠面〔需求 §3.5〕⇒「两处皆零动作」造死结不采纳）；队条目零编辑 ∕ 零撤回（既有）；队列 = 宿主运行期内存（重启即失）；挂起窗队列（`pushInput`）与忙态队**不合并**（两态两缝——载体不合并；窗内提交径 = 本档「本批注（挂起窗径 · 2026-09-29）」）；通知面零扩档。

**D3 计数（本批）**：条目 = **B1–B3** 三条；形态行触碰 = 输入区行 + 表行 14 + 本档大批注项 2（机制句收正）；新通道 **1**（`ev:queue`——单源 = `docs/desktop/design/IPC.md` §1）；新档 **1** + 拆分产出 **1**（`composer-send.mjs`（已落 · 实读 **70**）——在册预案本批落形）。

**本批注（R11 状态行 ⇒ CLI 对齐 · 2026-09-28）**：本注补本档 §1「状态栏」行的 **R11 状态行 ⇒ CLI 对齐**（该行已就地指针）；基准 = CLI 状态行（`thincoder-cli/src/tui/render-frame.mjs` `buildStatusLine` + banner 四态）；批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R11 + R11 补轮）。

1. **段间分隔** = CLI 形「段 │ 段」——每段自携前导（`::before`——CLI「每段自携」同构）；banner 四位 ∕ banner→后段 = 竖线紧贴前词（`PLAN│ AUTO`）；相邻段选择器 ⇒ 缺席段不落空分隔。
2. **字色**：base = `--fg` 50% 强度（⟷ CLI `dim`——`thincoder-cli/src/tui/ansi.mjs:31`）；警示段 = `--warn`（⟷ CLI 黄——同档 `:46` `fg(3)`）。
3. **banner 四位字色（补轮落）**：`auto` **复用 `--warn`**（黄——CLI 同一常量，不裂双黄）· `plan` = `--mode-plan`（青）· `advisor` ∕ `eng` = `--mode-advisor`（亮绿——两段同常量）；段码 ⟷ 槽三规则住 CSS（`thincoder-desktop/renderer/chrome.css:257-260`——2026-09-29 按盘收正）；
   **两新槽**（亮 ∕ 暗两套值）住 `thincoder-desktop/renderer/theme.css`——亮色两值 = 同色相暗化（色相源 = VSC 终端 ANSI 同码默认；对比 ≥4.5:1）∥ 暗色两值 = ANSI 暗默认：`--mode-plan` = `#047990` ∕ `#11a8cd` · `--mode-advisor` = `#0a7b0a` ∕ `#23d18b`）。
4. **分隔两边缘面裁定**：① 换行时行首悬空 `│` —— **不采用**（由：段自携前导同构；修需 JS 测行 ∕ 改布局 ⇒ 越「段集 ∕ 段序 ∕ 段读数逻辑零改」边界；孤竖线与段间分隔同形同色、仅窄窗换行边缘可见——无误读风险）。② `.status-alert`（非段位）相邻条 —— **采用**（前邻（段 ∕ 告警位）在场才落条 · 行首零前导；落形 `thincoder-desktop/renderer/chrome.css:254-256`（2026-09-29 按盘收正）——两侧各 6px）。

**本批注（R12 会话流 ⇒ VSC 对齐 · 2026-09-29）**：本注补本档 §1「对话流」行的 **R12 会话流 ⇒ VSC 对齐**（该行已就地指针）；基准 = VSC `#messages` 消息面（`thincoder-vscode/webview/chat.css` + `thincoder-vscode/webview/history.js` 懒加载 ∕ `thincoder-vscode/webview/ui.js` 跟滚）；
批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R12 + R12 收口修复轮）；台账 #526。

1. **块壳 = 透明无卡壳**（无边框 ∕ 无底 ∕ 零内边距——原 1px 描边 ∕ 圆角退场）；D24 保留面 **`.block` 移出**（本档「本批注（外壳视觉降噪 · D24）」项 6 ∕ 项 7 同拍收正）。落点 = `thincoder-desktop/renderer/chat.css`。
2. **面宽 = 全型 100%**（有效值——VSC 基础行 90% 被 user ∕ assistant 两覆盖行落至 100%）· **块距**（现值 = 本档 §1「本批注（流内竖向间距 · 2026-09-30）」——块块相连 + 带签 16px ∕ 盒块 8px（三型）两例外）。
3. **件级外边距（扁平块模型）**：件级层（VSC 件型各自 `margin`）由**块级块距**承担——三覆写随扁平化（2026-09-30）退场（间距单源 = 本档 §1「本批注（流内竖向间距 · 2026-09-30）」）；助手文本内边距 `8px 0`（user `0`——VSC 同值）不变。落点 = `thincoder-desktop/renderer/chat.css`。
4. **首块上距 = 14px**（骨架承担——`.flow` `padding-top: 14px`；左右 ∕ 下沿 = `--gap` 12px——与 VSC 同值）。落点 = `thincoder-desktop/renderer/chrome.css`（R12 收口修复轮落值）。
5. **滚动 ∕ 回填行为**（阈值 ∕ 判定 ∕ 补偿）单源 = `docs/desktop/design/RENDERER.md` §3 ∕ §4——本注不重述；证据 = 真机探针 **22 ∕ 22**（亮色 · `pageerror` 0——R12 探针留证）。

**本批注（流内竖向间距 · 2026-09-30）**：本注定形会话流**竖向间距**现值——承扁平化（用户 2026-09-30 走查：块块相连 ∥ 零分割线；框架留白保持原样）+ 轻通道两笔（台账 #715 消息前留距 ∥ #716 盒块间呼吸）。

1. **块距 = 0**（默认）——块块相连；落点 = `thincoder-desktop/renderer/chat.css`（`.block + .block`）；**非块插层承接**——消化行（`.chat-digest`）流内就地插于两块之间时 `+` 相邻选择器不命中，由两条承接规则命中（带签 16 ∥ 盒块 8（三型）同值同义；落点 = 同档 `:44-51`）。
2. **带签消息块上距 = 16px**——凡带说话人标签的块（用户块恒带；助手族回合首块 = 推理 ∕ 工具 ∕ 文本 ∕ 错误 ∕ 归档任一型承载标签）；用户 2026-09-30「❯ You:/❯ ThinCoder: 前面留大一点间隔」；选择器 = `.block + .block:has(> .msg-label)`（按「凡带签」命中，不挑型）。
3. **盒块上距 = 8px（三型）**——思考 ∥ 错误 ∥ 归档（非带签者）间呼吸；**工具块零距相连**（轻通道轮二——用户「工具块之间的间距也没必要了」）；用户 2026-09-30 走查「工具和思考块之间都没间隔……你觉得呢」+ 父侧建议；CLI 参照 = `thincoder-cli/src/tui/render-conversation.mjs:375` 块前空行；选择器 = `.block + .block:is(.block-reasoning, .block-error, .block-subagent):not(:has(> .msg-label))`。
4. **首块上距 = 14px** 不变（`.flow` `padding-top`——R12 注项 4 同值）；**件级三覆写（工具 8 ∕ 错误 8 ∕ 推理 4）退场**——由本条 1–3 的块级模型通管。
5. **消化行上距 = 8px**（轮间 0）——用户 2026-09-30「前面希望留点间距，不要跟上面的内容挨在一起」；落点 = `thincoder-desktop/renderer/chat.css`（`.chat-digest` ∥ 轮间 = `.chat-digest + .chat-digest`）。
6. **验证**：真机 computed 实测（带签块 16 ∥ 盒块 8（三型）∥ 无签块 0）+ 用户走查通过（2026-09-30「看着舒服」）；测试面 = 桌面测试树空清单（2026-09-28 全清重置）——视觉面验证靠真机探针。

**本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）**：本注定形轻通道轮一三笔已落面（台账 #712；记录 = `docs/batches/2026-09-30-light-round-1.md` §1；原始裁定 = `docs/batches/2026-09-30-desktop-flat-seamless.md` §1——该批转轻通道、记录冻结）；间距两笔（#715 ∕ #716）住本档「本批注（流内竖向间距 · 2026-09-30）」——本注不重述。

1. **框架全铺满（区间距归零）**——`.app { gap: 0; padding: 0 }`（原列间 ∥ 窗周 12px 归零）⇒ 区块相连、全铺到边；各区底色维持 `--bg-raised`。落点 = `thincoder-desktop/renderer/chrome.css:9-16`。
2. **圆角零**——`--radius: 0`（`thincoder-desktop/renderer/theme.css:17`）∥ 直值处逐处归零（工具卡 ∥ 错误横幅 ∥ 推理 ∥ 归档 ∥ 消化 ∥ 卡族 ∥ 代码块族 ∥ 滚动条 thumb 等——逐条 = 批档 §2 清册）。
3. **相邻零分割线（输入区上线唯一保留）**——各区边界 = 1px transparent（D24 保位形）∥ 块壳去线（`border: 0`）；**保留线 = 输入区上线**：`#toolbar { border-top: 1px solid var(--border) }`（核件 `thincoder-render-core/composer/composer.css:16`）——用户 2026-09-30「相邻区域不要有分割线，现在有的输入区上面的那根保留，不要新增」。
4. **按钮族圆角恢复**——用户「按钮什么的的圆角没了，我觉得按钮的圆角还是要的，主输入框倒是方的好」：按钮族回圆角（值表 = 批档 §2 清册）；**主输入框保持方**（`.composer #input-row { border-radius: 0 }`——`thincoder-desktop/renderer/chat-composer.css:41`）。
5. **Attach ∥ Send（∥ 忙时 Stop）迁控件行**——装配期节点搬移（`thincoder-desktop/renderer/mount-composer.mjs:215-226` ∥ 调用点 `:242`）：三钮 `#input-row` ⇒ `#controls-row` 右端同排（`margin-left: auto` ∥ 同高 26px ∥ 圆角 14px 同族——`chat-composer.css:51-58`）；输入框右侧按钮位退场（左右对称内边距）；监听 ∥ 工厂引用随节点同行（零行为改）。
6. **判据（真机 computed · 测试面 = 桌面测试树空清单〔2026-09-28 全清重置〕）**——`.app` gap 0 ∥ 逐面 radius 0（按钮族例外）∥ thumb radius 0 ∥ `#toolbar` border-top 显形 ∥ 三钮父 = `#controls-row` ∧ `#input-row` 内零钮 ∥ 输入框 radius 0 ∥ 按钮族正向值检（代表钮 `#send-btn` radius ≠ 0）∥ 迁行行为腿（Stop 显隐 ∥ 发送可用）；逐条 = 批档 §2 验证腿 V1–V10。
7. **边界**——纯视觉 ∥ 结构面；通道 ∥ 词键 ∥ 核件（`thincoder-render-core/**`）零改；「终端风格」大改（#710）不在本批（已搁置）。

**本批注（子 agent 块内容区跟滚 · #518 收口 · 2026-09-29）**：本注补「本批注（对齐第二批 · 六件）」项 3（右列子 agent 面）的行为面收口——用户 2026-09-28 18:15 走查「子agent区块里面的内容都不滚动！」；批档 = `docs/batches/2026-09-28-desktop-subblock-follow.md`（台账 #518）；口径 = 需求档 §3.6「对齐」= VSC 的形 + 行为。**让位语义 2026-09-29 收正——见下「本批注（块跟滚让位修复 · 2026-09-29）」**。

1. **块内容区跟滚（行为对齐 VSC §5.5）**——机制 = 核件原语直消费（`initBlockFollow` ∕ `maybeScrollBlock`——`thincoder-render-core/subblocks/block.mjs`）；桌面四点接线 = ① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——落点 = `views/pool-subagents.mjs`。
   **不夺阅读位**（用户上滚 ⇒ `_pinFollow=false` ⇒ 零写）；折叠 ∕ 已移除 ⇒ no-op；VSC 先例 = `webview/activity.js:160-176` + 帧尾 `streaming.js:31-32`；桌面帧 = **store 变更排帧**（核帧合并件——触发源 = store 变更；单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 ∕ `docs/desktop/design/RENDERER.md` §1.2）。
2. **池区帧尾钉底**——`mountPool` 尾 `maybePinPool(root)`（`views/activity-new.mjs`；`_poolPin !== false` ⇒ 写 `scrollTop`）——R10 E6 出生径的帧尾补齐（VSC `streaming.js:32` `frameEnd` 对位）；旗标 ∕ 计数贴 ∕ 点击回底三路零改。
3. **值面两行（映射源范围外漏项——本批补）**——`.advisor-block.sub-block .advisor-content { max-height: 60px }` · `.advisor-block.sub-block > summary { opacity: 0.75 }`（值源 = `thincoder-vscode/webview/chat.css:466-467` 逐字；落点 = `renderer/core.css` ④ 段）。
4. **判据**——机检 = 批次本地件（核心原语四例 + 桌面接线例 + 区钉底例 + 值落点锁；复跑 = `node --test docs/batches/2026-09-28-desktop-subblock-follow.test.mjs`）；真机 = 五行为（流式内容跟滚 ∕ 近底复跟 ∕ 上滚不抢 ∕ 换块默认跟底 ∕ 区近底保持）。
5. **边界**——会话流主跟滚面零触（R12 既落在册）；核件其余留端项（出生位 ∕ 说明行判重 ∕ 痕迹 ∕ 帧调度）不属本批（逐项对账表 = 批档 §2）。

**本批注（块跟滚让位修复 · 2026-09-29）**：本注定形「让位死开关」修复的界面面——用户三次复报「子agent输出不滚动」+ 真机探针实锤（六环链：churn 复位 → 复钉掩盖 → 一记滚轮踩翻 → 复位+零写＝停摆 → 恢复不可发现 → VSC 无 churn）；批档 = `docs/batches/2026-09-29-subblock-follow-resume.md`（台账 #603）；机制 ∕ 工艺单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**（让位三律 + 出口钮）∥ `docs/desktop/design/RENDERER.md` §1.1（池壳原位领用）§3（块跟滚 ∕ 帧尾复核）。

1. **内容窗出口（主体 · 两态）**——让位期（`_pinFollow === false` ∧ 内容可滚 ∧ 块展开）⇒ 块内容窗**右下 overlay** 钮 `.sub-follow-btn`；两态文案：让位期间有新行到达 ⇒ `sub.follow.new`（zh `↓ 新内容` ∕ en `↓ New output`），否则 ⇒ `sub.follow.bottom`（zh `↓ 回到最新` ∕ en `↓ Back to latest`）；点击 ⇒ 回底 + 复跟 + 钮退场。清账三路 = 点击 ∕ 近底复跟 ∕ 元素重建（同池列计数钮 `.activity-new-btn` 三清账路对位）；折叠态钮不显（CSS 兜底）。
2. **让位收窄（行为面）**——让位仅凭**用户手势**（`wheel` ∕ `touchmove` ∕ `pointerdown`）；非手势位移（程序写入 ∕ 复位回波）不改旗标；近底（< 24px）无条件复跟（「回近底复跟」判据保持）。
3. **样式落点**——端侧各自定形（核类名映射口径）：桌面 `renderer/core.css` ④ 段（D24 交互态组）；VSC `webview/base.css`（`.activity-new-btn` 邻位）。
4. **判据**——机检 = 批次本地件 `docs/batches/2026-09-29-subblock-follow-resume.test.mjs`（**本批须新增**：首落 `.thincoder/tmp/` ⇒ 父侧 copy 终位）；真机 = 探针三件 `docs/batches/2026-09-29-subblock-follow-resume-probe.mjs` ∕ `-probe2.mjs` ∕ `-probe3.mjs`（父侧三件扩面 · **验收必需腿**）。
   真机探针**计入 D16 义务**（「凡改桌面可见面 ⇒ 验收须含一条真 Electron 使用面用例」——探针 = 真 Electron + 真实交互驱动〔真滚轮〕+ 读数落盘 = 使用面用例；闭合 = 父侧真跑）；回退 = 探针不可跑 ⇒ 人工走查 + 父侧真跑闭合。
5. **边界**——池列计数钮 ∕ 会话流药丸 ∕ 主跟滚面零改；出口钮无计数、无快捷键（禁自造）；池折叠态切换的位面复位不消除（用户手势——登记）；**键盘径 = 残余**（键盘滚动不属手势集、亦非复位回波——不改旗标；可达性 unverified〔需真机核〕：若可达 ⇒ 钉底态键盘上滚随下一帧复钉夺回——消解路与过期条件 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8）。
6. **边界归属（留端清算 · 用户裁定）**——原语 ∕ 旗标 ∕ 出口钮 = 核；**应用时机契约 = 核**（应用点清单：追加后 ∕ 挂载后 ∕ 帧尾复核——端只在宿主时刻调用核应用器；端侧遗漏应用点 = 违约缺陷）；**触发源 = 端**（桌面 store 变更 ⇒ 核帧合并件 `mark`——帧合并 ∕ 更新纪律收核，2026-09-29 收正；单源 = 核档 §2 KD-RC-9）；滚动策略族契约同源（近底 24px + 旗标门 + 清账三路——端 = 适配器）。

**本批注（复制面对齐 VSC · 2026-09-29）**：本注定形「右键编辑菜单补齐 + 自建复制面两控件摘除」（台账 #557 / #558；裁定 = 用户 2026-09-29 02:51–03:03 走查，口径「跟 vsc 对齐」）；需求 = §4 **D27**（新增）+ **D13**（收正）；批档 = `docs/batches/2026-09-29-desktop-copy-vsc-align.md`；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-43**（+ KD-22 收正）。

1. **右键编辑菜单（D27 · 宿主面）**——机制 = `win.webContents.on("context-menu", (event, params) => …)` 按 `params` 构模板 ⇒ `Menu.popup({ window })`（Electron 无默认右键菜单——零实现即零菜单）；**条目集**（纯函数 `contextMenuTemplate(params, labels)`；空 ⇒ 不 popup）：可编辑（`params.isEditable`）⇒ **剪切 ∕ 复制 ∕ 粘贴 ∕ 全选**（序 = cut → copy → paste → selectAll；`enabled` 取 `params.editFlags` 对应值——缺键不禁用）；非编辑 ∧ 选中（`selectionText` 非空）⇒ **复制 ∕ 全选**；非编辑 ∧ 空选 ⇒ **零菜单**（不出）。
   行为 = Chromium role 四件（`cut` / `copy` / `paste` / `selectAll`）；**沙箱判据句**：role 执行径 = 主进程 `webContents` 方法（实读 Electron v44.4.5 `lib/browser/api/menu-item-roles.ts` `webContentsMethod`）⇒ `contextIsolation:true · sandbox:true · nodeIntegration:false` 下可用性成立（与既有键盘面 Ctrl+C/V 同径——不经渲染面 Node ∕ 权限面）。
   **文案面** = **显式 `label` 取词表四键**（`menu.edit.cut` ∕ `menu.edit.copy` ∕ `menu.edit.paste` ∕ `menu.edit.selectAll`）——**持有面 = `thincoder-desktop/renderer/i18n.mjs` 宿主表 `HOST_DICT`**（两语；en = `Cut` / `Copy` / `Paste` / `Select All` ∥ zh = `剪切` / `复制` / `粘贴` / `全选`）；**读取径 = 主进程 `context-menu.mjs` `contextMenuLabels(locale)` 经 `HOST_DICT` 两语现读**（主进程引渲染面宿主表之既有先例 = `thincoder-desktop/src/main/attachments.mjs:27`；`locale` = `loadConfig().locale` 右键时刻现读——语言切换即时随动；读失败 ⇒ 回落 en + `console.error`；与 `notify.*` 主进程自持族的差异**有意**——勿统一）；**不采 role 默认文案**（同实读：默认文案 = 英文硬编码字面：`Copy` / `Cut` / `Paste` / `Select All` ⇒ 直采即 `#533` 式 en-only 债）。
   落点 = 新档 `thincoder-desktop/src/main/context-menu.mjs`（`contextMenuLabels(locale)` + `contextMenuTemplate(params, labels)` 两纯函数 · 零 `electron` ⇒ 平 node 直测）+ `thincoder-desktop/src/main/window.mjs`（`createWindow` 内落子 + `loadConfig` 现读）；与同档 `buildMenu()` **两事不混**（应用菜单 = `win.setMenu`；右键菜单 = 每弹独立模板；应用菜单 Edit 组 roles **零动**）。
   边界：零 IPC ∕ 零白名单项 ∕ 零新通道（主进程本地面）；链接 ∕ 图片类条目**不落**（D27 射程外——禁自造）。
2. **复制面两控件摘除（D13 收正）**——**当前复制面 = 核件代码块 Copy 钮（唯一）**：`pre.code-block` 内 `.code-copy-btn`（核件 `attachCopyButtons`；词键 `msg.copy` / `msg.copied` = 端供给面）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点——零动）。
   自建面摘除物（**零残留为判据**）：`chat-copy.mjs`（整档删——`blockTextOf` 迁 `thincoder-desktop/renderer/views/chat-text.mjs`）· 块尾 ∕ 推理块尾 ∕ 错误块尾 `chat:copy-block` 控件 · 输入区尾 `chat:last` 控件 · `[data-composer-tail]` 挂件锚（槽形三件 ⇒ 两件）· `thincoder-desktop/renderer/chat-composer.css` 两控件族与 `⧉` 字形规则 · i18n 两键（`chat.action.copy` ∕ `chat.action.copyLast`）· `thincoder-desktop/renderer/app.mjs` `writeText` 单点供给（消费者归零随退）；`data-raw` 锚**保留**（就地更新判据面）。
3. **判据**——① **D27 真机**：选中文本 ⇒ 右键 ⇒ 菜单出「复制」⇒ 剪贴板往返（粘回可见）∥ 输入框 ⇒ 四件在场（粘贴可用）；
   ② **D13 真机零残留**（**判据域 = 代码树**：`thincoder-desktop/**` ∕ `thincoder-render-core/**`——排除 `docs/`）：`⧉` 零命中 ∧ `chat:copy-block` ∕ `chat:last` ∕ `chat.action.copy` 零命中 ∧ 代码块 Copy 钮仍在且点按可复制；
   ③ 机检面 = 两纯函数平 node 直测口径（`contextMenuTemplate` 三语境 + `editFlags` 启用径 + 两语词值）——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑）；真机走查 = 父侧真跑闭合（D16 义务）。
4. **计数（D3）**：摘除档 **1**（`chat-copy.mjs`）· 新档 **1** = `thincoder-desktop/src/main/context-menu.mjs`（拟新增）· 词键退 **2** × 2 语 + 增 **4** × 2 语（净 +2 键）· 通道 **0** · 白名单 **0** 改。

**本批注（挂起窗径「消费前流内零块」· 2026-09-29）**：本注定形挂起窗（子代理在跑 ∕ 主回合已收）内插入的处置——「消费前流内零块」纪律**全输入径**落定（running 径已合规；本批补 susp 径 + queue-full 边角）；用户 2026-09-29 03:18 走查（「为什么现在还是我一回车直接就进流了」）；台账 #561；批档 = `docs/batches/2026-09-29-desktop-susp-queue.md`；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-40 ⑥**（+ KD-23 ∕ KD-34 收正）。

1. **窗内提交 = 消费前流内零块 ∧ 待发送带在场**——宿主窗内受理回执携 `queued: true`（受理入队、消费前不入流）；窗队入排队镜面（`ev:queue` **两源共镜**：忙态队 ∪ 挂起窗输入队——按键互斥）；渲染面窗内提交**零本地块**（`onUserEcho` 抑制面判据 = `busyOf ∨ suspActiveOf`——`suspActiveOf` = 本批判据单源）；滞后竞态径由回执**退流**兜底（终态恒零块）。
2. **消费时刻入流恰一枚**——窗内消费（`driveTurn` 用户回合）∥ 残输入续发 ⇒ `ev:queue` 消费回执（`delivered`）⇒ 用户块入流（`delivered` 单写者；本径零本地块 ⇒ 与本地块零重复）；带该项同帧退场；段 14 读数随镜面。
3. **queue-full 反径（`msg:send` 忙态直发径）**——在飞队满 + 直发径（判忙滞后）⇒ 回执 `queue-full` ⇒ **本地块退流**（零块）+ 失败行在场（`[data-notice="send-failed"]`）+ 稿留输入历史（`↑`）；重试成功恰一枚（判据 = KD-23 失败径原句）；cap 询问待答径（`msg:interrupt`）处置另立 = 本档 §1 输入区行第三面（决策 = `docs/desktop/design/PROJECT.md` §2 **KD-52** ③）。
4. **判据（真机 · 父侧闭合）**：窗内插话 ⇒ 流内零用户块 ∧ 待发送带在场 ∧ 窗落定消费 ⇒ 恰一枚入流；`queue-full` 径 ⇒ 零流内块 + 失败可见；**VSC 零回归** = 核件 `thincoder-render-core/**` 与 `thincoder-vscode/**` 零改（结构性判据）。
5. **边界**：窗内队容量不增 ∕ 载体不合并（两态两缝）∥ 满队 toast ∕ 词键零改 ∕ 通道零新 ∕ 测试面（全清令）——**仓套件不写 ∕ 不改 ∕ 不跑；批档本地用例随批留存**（不入仓套件）；段 14 = **形态零改 · 源并两源**（判据面 2026-09-29 扩四路——本档 §1「本批注（桌面重建保真 + 留端清算族 · 2026-09-29）」）。

**本批注（窗队列 VSC 逐点对齐 · 2026-09-29）**：本批 = 挂起窗输入队列的宿主面**逐点对齐 VSC 实盘**（规格本体 = `thincoder-vscode/src/extension/panel-messages.mjs:96-121` `pushBusyQueued`：两载体合计快照 ∕ 受理 + 五消费点 + 握手重推推送点）；台账 #564；批档 = `docs/batches/2026-09-29-desktop-window-queue-parity.md`（逐点对齐表 = 该档 §2.2）；承接 #561 批已定形的受理 ∕ 消费 ∕ 清标 ∕ 合泡语义——本批补携图面与逐点核账。

1. **窗内携图对齐（载具层携图）**——窗条目形 `{ text, ts, images? }`（与忙态队条目同形）；窗内提交携附件 ⇒ **同受理**（回执 `{ ok: true, queued: true }`）；送达面（窗内消费 ∕ 残输入续发）逐条过 `prepareTurnAttachments` 判决 ⇒ 降级码随 `delivered.degraded` 浮出（与忙态径同判据）；`busy` 档收窄为窗径竞态防御（窗已摘——实际不可达）。图不入快照（既有）。
2. **标记 ∕ 清标 ∕ 合泡语义（对齐 VSC）**——逐条标记 = 带面逐条（`[data-pending-item][data-raw]`）；清标 = 快照整置（消费 ∕ 中止清队即清）；合泡 = 消费回执 `delivered.text` 单写者入流恰一枚（= VSC `merged` 同义位）；窗径单条消费（批合并差登记驱动收口）。
3. **停滞显形（三端同查）**——在飞回合停滞 VSC ∕ CLI ∕ 桌面**均无**专门可见面（无看门狗 ∕ 无超时提示）；三端停滞期既有面同形（桌面 = loading + `ev:susp` 挂起句 + `ev:digest` 行 + 段 5 耗时）⇒ 停滞检测面登记为**跨端需求（另账）**，本端零发明。
4. **边界**——驱动语义（窗载具步边界取批 ∕ 消费批合并）零改（对位清单另账）；窗内队容量不增；核件 ∕ VSC ∕ `thincoder-render-core` 零改。
5. **判据（机检 ∕ 真机 · 父侧闭合）**——① **窗内携图受理**：窗内提交（携附件）⇒ 同受理回执 `{ ok: true, queued: true }` ∧ 待发送带在场（`[data-pending-item][data-raw]` = 提交文本逐字）∧ 图不入快照（快照 = 文本串数组——A9 收正）；② **送达面判决**：消费时刻（窗内消费 ∕ 残输入续发）图随回合送达——`prepareTurnAttachments` 判决 ⇒ 落盘 + 指针段（非视觉 ⇒ 说明行）；
   ③ **`degraded` 浮出**：判决降级 ⇒ 随消费回执 `delivered.degraded` 在场（零静默）；④ **窗内消费恰一枚**：带该项退场 ∧ 流内恰一枚用户块（本径零本地块——与本地块零重复）；**机检面** = 随批单元证据（**批档本地用例随批留存**——载体 = `docs/batches/2026-09-29-desktop-window-queue-parity.test.mjs`（T1–T9） · 不入仓套件；全清令：仓套件不写 ∕ 不改 ∕ 不跑）；**真机** = 人工走查 + 父侧真跑闭合（D16 义务）。

**本批注（停滞轻显形 · 2026-09-29）**：本注定形桌面端「在飞回合静默读数」（用户 2026-09-29 12:1x 裁定 #568 = B 轻显形——三端同口径；批档 = `docs/batches/2026-09-29-stall-indicator.md`）；语义单源 = `docs/cli/design/TUI.md` §7.7（本注不重述，只落桌面实现面）。

1. **承载段 17**——新段 `quiet`（`data-seg="quiet"`），序 = `elapsed` 之后（`thincoder-desktop/renderer/views/statusline.mjs:41-43` `STATUS_SEGMENTS`）；
   段构建器 = `statusline-segments.mjs` `quietSegment`（`QUIET_MS = 10000`——沿 `USAGE_WARN` 先例；数值单源 = `docs/cli/design/TUI.md` §7.7）；词面 = 核字典键 `status.quiet` 经 `t()` 投影直取（`HOST_DICT` 零新键）。
2. **起算 ∕ 重置（归约面单点）**——新切片 `lastOutputAt`（按会话键）；起算锚 = `events.mjs` `onActivity` turn 形（`turnStarts` 邻位同置）；重置 = `reduce()` 可见输出通道集单点（`ev:token` ∕ `ev:reasoning` ∕ `ev:subchunk` ∕ `ev:tool-call` ∕ `ev:tool-output` ∕ `ev:tool-result` ∕ `ev:subagent`）——「无变化 ⇒ 原引用」对时间戳切片自然不适用（逐事件恒变）；切片不入状态行订阅键组（显示走拍）。
3. **跳秒 = 1s 步进**——`heartbeat.mjs:16` `HEARTBEAT_MS` **1000**（落值）；拍体 = `app.mjs:269-276`——活动会话位标含 `running` ⇒ 状态行重挂；零新增定时器（单点 `setInterval` 纪律不变）。
4. **判据（机检 ∕ 真机 · 父侧闭合）**：① 位标含 `running` ∧ `now − lastOutputAt ≥ 10000` ⇒ 段在场（首显「已静默 10s」）；② 不足阈值 ∕ 非 running ∕ 回合终态（`done` ∕ `stopped` ∕ `error`）⇒ 段零节点（负向锁——状态行零该段）；③ 拍面：相邻两拍读数差 = 现实秒差（1s 步进）；**机检面** = 批档本地用例随批留存（**仓套件不写 ∕ 不改 ∕ 不跑**——全清令）；**真机** = 父侧真跑闭合（D16 义务）。
5. **边界**：纯读数——零控件 ∕ 零打断 ∕ 零警示色；零新通道 ∕ 零新载荷（本段纯渲染面自算）；`IPC.md` 零改；核件 ∕ `thincoder-render-core` 零改；「已提交未起跑（回执窗）」不在显示域（登记 = `docs/cli/design/TUI.md` §7.7 观察 ∥ 批档 §2 上抛）。

**本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）**：本注补本档 §1「状态栏」行的**段 9 ∕ 段 11 两段收正**（该行已就地指针；来源 = 用户 2026-09-29 13:07 桌面走查「上下文那里只显示了个24%，cli显示很全，cli还有台账计数，desktop也没有」）；批档 = `docs/batches/2026-09-29-desktop-statusline-cli-gap.md` · 台账 #600。口径 = 段面收窄 = **只动两段**（余 15 段不重开）；标尺 = en 与 CLI 逐字、zh 对位译形。

1. **上下文段（段 9）⇒ CLI 形**——读数 = `context <pct>% <tokens>`（en 逐字——`thincoder-cli/src/tui/render-frame.mjs:413-416`；zh 对位译形 `上下文 <pct>% <tokens>`）；词面 = `status.usage`（`thincoder-desktop/renderer/i18n.mjs`——`${tokens}` = 段侧合成串：令牌 > 0 ⇒ `␣<fmtK>`，否则空串 ⇒ 半态 `context <pct>%` 同 CLI）；`fmtK` 格式单源（端 = `thincoder-desktop/renderer/views/statusline-segments.mjs:29-33`；CLI 同式 = `thincoder-cli/src/tui/render-frame.mjs:396`——≥ 10000 ⇒ 整数 k · ≥ 1000 ⇒ 一位小数 k · 否则裸数；判据①「逐字一致」以此为凭）；令牌 = `ev:usage` 新键 `ctxTokens`（核 `estimateTokens(agent.history)` 直读——`thincoder-core/token-window.mjs:17`；与 `ctxPct` 同点产出）；渲染面 = 新切片 `usageTokens`（按会话键）；≥ 80% 警示色零改（`USAGE_WARN`）。
2. **台账段（段 11）⇒ 常驻计数**——在场判据 = 核状态位（`state.ledger = { marker, warn }`——`thincoder-core/ledger-surface.mjs:52`；120s 拍 + 首拍即到）经 `ev:ledger` `marker` 键转发 ⇒ 归约切片 `ledgerMarker`（首拍必携〔含 null 清残影〕· 同值零出站）；段文 = 核 `formatMarker` 逐字 `台账 N·M`（端零构造）；警示色 = 核 `warn` 位（老化 > 0 ∨ 死执行者 > 0——端零重算）；tooltip 明细面保留（载波 = `ev:ledger` `detailLines`〔归约切片 `ledgerDetail`〕——零改）。「可开批」段形退场（CLI 状态段无此形）；信号保留于 tooltip（核 `formatDetailLine` 逐字携「 — 可开批」——`thincoder-core/ledger.mjs:152`）；`info.threshold` 键两语退场（消费归零 ⇒ 零残键）。
3. **判据（机检 ∕ 真机 · 父侧闭合）**——① 上下文段：en 与 CLI 同读数逐字一致（`context <pct>% <tokens>`）；令牌 0 ∕ 缺 ⇒ 尾段缺席（**打开态 = 半态**——令牌随首个回合尾 `ev:usage` 到场）；② 台账段：常驻 ∧ 计数与 `ledger:read` 同源一致 ∧ `warn` 位 ⇒ 警示色；③ 机检面 = 批档本地用例随批留存（**仓套件不写 ∕ 不改 ∕ 不跑**——全清令）；真机 = 父侧真跑闭合（D16 义务）。
4. **计数（D3）**——词键退 **1**（`info.threshold`；`status.usage` 值改零增退）· 新切片 **2**（`usageTokens` ∕ `ledgerMarker`）· 载荷扩 **2**（`ev:usage` `ctxTokens` · `ev:ledger` `marker`）· 通道 **0** · 白名单 **0** · 段集 ∕ 段序零改（承载 17 段不动）。
5. **边界**——打开态播种面零改（恢复读仅百分——令牌随首个回合尾 `ev:usage` 到场；seed 扩面须动核 `sessionReading`，超本批边界）；`mount-info` 复读面零改（R13 遗留面另账）；核件（`thincoder-core` ∕ `thincoder-render-core`）零改；零新通道 ∕ 零白名单项；段间分隔 ∕ 字色族零改（R11 在册）。

**本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）**：本注补本档 §1「设置面」行与「启动态」行的 parity-b10-ui 落面（两行已就地指针；来源 = `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 修法表 S1–S14 ∕ R1 + §5 三舱实施记录）。本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（设置族与项目级信息族注 ∕ 白名单面），不在此重述。

1. **渠道行控件族（S1 ∕ S4 ∕ S5）**——行内三路：设 ∕ 改钥钮与删钥钮（**静止 ∕ 编辑两态**——编辑态 = 密码输入 + 存 ∕ 消）；渠级代理**行内复选**（行 `proxy` 投影随动）；**sub 段** = `model` ∕ `baseURL` 非空才显（空值 ⇒ 零节点——禁假造）。
2. **自定形「拉取模型」（S2）**——钮 + `datalist` 下拉候选（探回模型集）+ 状态行三态；**手输兜底**（模型框恒为文本输入——零阻断保存）；探针不落盘；探果重挂 ⇒ `draft` 快照回填未落盘输入。
3. **预设项标签形（S7）**——`name — desc (model)`（值直取核 `PROVIDER_PRESETS`——端侧零表；缺段不落空括号）。
4. **删除确认门（S6）**——不可复得类删除前置确认弹层：四门 = 渠移除 ∕ 删钥 ∕ 密钥行删除 ∕ MCP 移除；驳回（否 ∕ 背板 ∕ 框内 Escape）⇒ **零写**；构件 = **新档** `thincoder-desktop/renderer/settings-confirm.mjs`（`.auto-confirm` 族复用——**零新 CSS**；`onConfirm` = 开框时捕获闭包）；关面 ∕ 开面同清。
5. **MCP 段（S8 ∕ S9）**——行补**编辑**钮（表单预填 = 现值；名只读）与**重连**钮（先断后连——失败面在场）；增表单 = 结构化三型字段组 + token ∕ headers（对位 VSC 同族——JSON textarea 退场）。
6. **agent 段（S10 ∕ S11 ∕ S14b）**——子代理模型槽六件 = `select` + 复合候选 + 占位（清空 ⇒ 删键）；advisor 推理档 = 选项控件（Auto + off + 逐模型枚举）；guard 开关 = `session:flags` 槽写（值 = `sessionFlags` 投影；未知 ⇒ `disabled`——禁假造）；
   **slot 权威键泛化行 = 只读行（#617-CH · 波 C 已落）**——`agent.advisor.guard` ∕ `agent.engineering` 泛化行出值 + 提示词键 `settings.reason.slotAuthority` · 锚 `data-readonly` · **零控件**（段尾保存判据同排除——不入提交 patch）；写面归属 ∕ 拒码 = `docs/desktop/design/PROJECT.md` §2 **KD-49**。
7. **S3 端差处置（消——2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）**——行标面补 VSC `failure` 分档（hostBusy ⇒「宿主繁忙」+ 抑制失败句）：原「能力缺失」不成立（欠做）⇒ 补做三件 = ① 新档 `thincoder-desktop/src/main/loop-sampler.mjs`（port ≈45 行——源 = `thincoder-vscode/src/extension/loop-sampler.mjs:67-76`）② 行面 `failure` 键贯链（`providers.mjs:105-107` → 通道 → 渲染——渲染档点名 = `thincoder-desktop/renderer/views/settings-sections.mjs`）③ 词键（落 `renderer/i18n-settings.mjs`——#614 第四档，词面阻已除）；判据 = 同宿主忙态两端行面同词 + 同抑制形。上抛行 = `docs/desktop/design/PROJECT.md` §10 **CG**（同拍定形）。
8. **首屏引导门（R1）**——`data-boot` 补渲染消费：`≠ "ok"` 期间引导层在场；`"error"` ⇒ 错误面（可读原因）；`"ok"` ⇒ 撤（**零残留**）；写者单点零改（`thincoder-desktop/renderer/dom.mjs`）。
   **CJ 裁定落（#617-CJ · 波 C 已落）**：`error` 态 = **顶部横幅非模态**（载原因不覆盖交互——`inset: 0 0 auto` ∕ `pointer-events: none` ∕ z 序（9）低于设置面（10））⇒ 设置面可进可出 ∧ 原因可见；`ok` ∕ `loading` 两态零改；裁定行 = `docs/desktop/design/PROJECT.md` §10 **CJ**；真机复读 = 父侧（D16）。
9. **index 空态（S12）**——embedding key 缺 ⇒ `no-key` 态（提示词 + 构建钮禁用——对位 VSC `settings-tools.js:337-341` 同判）；有 key ⇒ 既有 built ∕ not-built 两态零变。
10. **计数（D3）**——通道 **0** 新（六出口 = 既有设置族）；段集七段零改；**新档 3**（`settings-confirm.mjs` ∕ `mount-settings-segments-providers.mjs` ∕ `mount-settings-segments-agent.mjs`）；判据 = 批内件 + 真机（父侧闭合）。

**本批注（@ 文件引用对齐 · 2026-09-29）**：本注定形桌面 @ 文件引用面对齐 VSC 形（注入 ∕ 剥离 ∕ 欢迎条词值 ∕ 判据 ∕ 计数——五项）；来源 = 缺面族批补批（`docs/batches/2026-09-29-missing-face-family.md` §2；台账 #632）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-51**（本注只述端侧形态与锚，不重述机制）。

1. **注入（模型输入面）**——用户回合起跑前单点 = `thincoder-desktop/src/main/turn-face.mjs` `executeTurn`（`:87`）：`body` 住续跑循环外 ⇒ resume 复用同一 body（**恰一次注入**）；`autoTurn` 系统轮不扫（timer ∕ 消化 ∕ 上行三径）。
   取值 = `projects.currentCwd()`（无根 ∥ 非串 ⇒ 原样返回——防御臂）；注入器 = 端薄壳 `thincoder-desktop/src/main/file-refs.mjs`（核单源 = `thincoder-core/file-refs.mjs`——探针注入）。
   活面气泡 ∕ 待发送带 ∕ 队镜面恒原文（注入只在 `run` 入参——三显示面零污染）。
2. **剥离（显示面）**——恢复面 = `thincoder-desktop/src/main/session-slots.mjs` `pageHistory`（user 消息文本过核件 `stripAtRefs`；首屏 ∕ 回填同门；assistant ∕ tool 零动）∥ 标题源 = 核 `thincoder-core/generate-title.mjs` 读源处剥离（标题不得由 `[File: …]` 正文生成）。
   盘面 ∕ 机读线零触碰（注入形 = 落盘形——只剥离显示面）；落点同位 = `thincoder-vscode/src/extension/panel-session.mjs:185`。
3. **欢迎条词值（U-A 核定 · 登记兑现）**——`welcome.shortcuts` 两语补 `@` 段：zh = 「输入 @ 引用文件 · Enter 发送 · Shift+Enter 换行」∥ en = 「Type @ for file references · Enter to send · Shift+Enter for newline」（plain-text 形；词条落点 = `thincoder-desktop/renderer/i18n-views.mjs`）。
4. **判据**——机检 = 批内件 **9/9 绿**（实件落点 = `.thincoder/tmp/2026-09-29-missing-face-family.test.mjs`；归档收位随父侧）；真机 = 五腿（注入哨兵复述 · 切回剥离形 · 负向零围栏 · VSC 回归复读 · 欢迎条首屏）= 父侧探针。
5. **计数（D3）**——词键 **0** 增退（`welcome.shortcuts` 值面收正）· 通道 **0** · 白名单 **0** · 段集零改；新档 **1**（`thincoder-desktop/src/main/file-refs.mjs` **19**）+ 核件 **1**（`thincoder-core/file-refs.mjs` **103**——上提单源，两端共享）。

**本批注（桌面重建保真 + 留端清算族 · 2026-09-29）**：本注定形「重建面位 ∕ 焦点保真族 + 设置 ∕ 向导草稿保真 + 滚动策略族工厂化 + 留端未接四项 + 段 14 判据扩路」的界面面（挂账族集中处置令；批档 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2；台账 #604–#608 + #581）。

1. **设置 ∕ 向导草稿保真（#604）**——任一 settings 切片写落地不得清未提交草稿：`paintSettings` 单闸（`thincoder-desktop/renderer/mount-settings.mjs:125-133`——两树唯一重绘点）捕获 ∕ 复填；捕获域 = 携 `[data-draft]` 申报控件；非申报控件取新模型值（负向锁）；真机 P1（设置 + 向导两径）。单源 = 批档 §2.2。
2. **重建保真二分（#606 · 六面）**——身份保真 = 键控差分（会话控制条条目 ∕ 池两族——同一元素跨帧复用）；位置 ∕ 状态保真 = 快照复填（`thincoder-desktop/renderer/view-state.mjs` `captureView` ∕ `restoreView`——滚位 ∕ 焦点 ∕ 光标 ∕ 展开集；池 ∕ 卡面滚位两处例外 = `docs/desktop/design/RENDERER.md` §1.1）；
  **对话流重挂径** = `following` 真 ⇒ 贴底 ∕ 假 ⇒ 复原 scrollTop + 展开集；弱项两件（归档块重放 ∕ 提示带行集等价零写门）。机制 ∕ 判据单源 = 批档 §2.4 ∕ `docs/desktop/design/RENDERER.md` §1.1。
3. **滚动策略族工厂化（#607）**——核 `thincoder-render-core/scroll.mjs`（拟新增）抽件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记四件单源）；桌面 = 工厂消费（`views/chat-scroll.mjs` ∕ `views/activity-new.mjs`——`_poolPin` 保持 ∕ `FOLLOW_PX` 再出口保名）；**零行为变更**；单源 = 核档 §2 KD-RC-8 ④ ∕ `docs/desktop/design/RENDERER.md` §3。
4. **留端未接族（#608）**——① 痕迹 ∕ 丢弃痕 = 端观测面（桌面无诊断上行面）⇒ 不接（给由——零行为差异）；② `resetActivity` = 已在位（桌面 `resetSubBlocks` 同义）；③ 说明行判重 = **挂载根旗标**（`root._subDescShown`——一次置位不重置，沿 #630 KD-EC-4，与 VSC 同判）；真机 P9。单源 = 批档 §2.6。
5. **段 14 判据四路（#581）**——窗在场 ∧ 队空 ∧ 非忙 ⇒ 排队句（窗内 Enter = 入队——现制该角落出 send 句 = 显示说谎残留）；形态 ∕ 其余 16 段零改；零键增（复用 `status.queue.enter`）；单源 = 表行 14。
6. **计数（D3）**——新档 **1**（`thincoder-desktop/renderer/view-state.mjs`（已落 · 实读 **299**））· 通道 **0** · 白名单 **0** · 词键 **0** 增退；判据载体 = 批内件两档（M-604 a–c ∕ M-606 a–c ∕ M-607 a–c ∕ M-608 a–c ∕ M-581 + P1–P9）；全清令（仓套件不写 ∕ 不改 ∕ 不跑）。

## 2. 活动池与状态位（需求档 §3.5 三项落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | 归组键 = 核 relay 前缀（`role#id`——`@thincoder/core/agent/relay-prefix.mjs`，扩展端已消费）；池内三条目族 = **活动块**（子代理 / advisor / consult——块面 = 核件同款（头行 + 状态词 + 内容 tail-3 + 展开）——「对齐第二批 · 六件」项 3）· **队列**（排队中回合 / 工具批）· **待审批**（计数 + 操作区，置顶）；折叠态按会话记忆。**落形**（批 A）= 三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）· 有会话三族皆空 ⇒ `empty`（**区域退场**——与 `none` 一致零子节点 · 锚值保留）· 否则 `pool`；**族序 = 待审批 → 活动块 → 队列**（族空 ⇒ 该族零节点）；折叠头两读数 = `running` / `approval`（`pool` 切片出；**非数 ⇒ 零节点**——禁假造；`store` 缺省 `running: 0` / `approval: 0` ⇒ 落 `0` 读数）· 折叠态键 = `poolCollapsed`（按会话记忆）· 控件锚 `data-action="pool:toggle"`；条目**内容回显 = 核件 tail-3 / 展开**（「对齐第二批 · 六件」项 3；块头读数 + 状态词——状态词出自 §1 闭枚举 **8 词**；**对齐第三批**：等待审批态（`approval`——本档 §1「本批注（对齐第三批 · 小修族）」P5））· **清点口径**（批 8 落）= 条目入池即在场（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status`）——**收束不摘除**（长会话池切片单调增长；**队列族例外**——出队即摘除〔该族「对齐第二批」后零写者 · 席位保留——见下「用户排队消息住待发送带」句〕）；**用户排队消息住输入区上方待发送带（非流内——对齐第二批 · 六件 · 项 2）** = 忙态发送入队（写者 = `ev:queue` 归约——**`pending` 切片按会话分键** · 条目 = 文本串（A9 收正）；「回合中插入」批收正：原 store 纯动作退场、权威 = 宿主）——**右列「队列」族不再承载用户排队消息**（席位**保留 · 零写者** ⇒ 族空零节点恒不在场）；出队 = 宿主消费两时刻（步边界注入 ∕ 回合尾续发——单源 = `docs/desktop/design/PROJECT.md` §2 KD-40；见本档「输入区」行）；**窗限 / 归档** = 工具行摘除 · 子块**归档 = 入流**（本档 §1「本批注（对齐第二批 · 六件）」项 5；**R10 收正**：出生即驻留 ∕ `settled` 终态留场 ∕ `done` 回收 ⇒ 归档入流 ∧ **池内退场**——区域回 `empty` 零子节点）；**可见面修复批修**：条目标签行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 五件）」项 4 · **重定位（对齐重定位批）**：工具调用行摘除、活动块族 = 子 agent 实例 → 本档 §1「本批注（对齐重定位）」项 2 |
| 2 · 标签位集合与优先级 | **落定** | 取值 = 运行中 / 待审批 / 完成 / 空闲；优先级 **待审批 > 运行中 > 完成 > 空闲**（一个会话同时命中多值时显示最高者）；来源 = 本会话的挂起表 + 回合状态（`onToken` / `onToolCall` / `onToolResult` 驱动）；另两端已有同义状态语义（“waiting” 类状态位先例 `thincoder-vscode/src/extension/panel-callbacks.mjs:54`）⇒ 三端语义一致、呈现各自定形 |
| 3 · 会话行「来源端」标注 | **落定** | 读 `sessions:list` 条目的 `createdBy`（核 `listSlots` 投影，实读 `thincoder-core/session-slots.mjs:217`——SLOT-END-PARAM 批落地）⇒ 会话行标注**创建端**（CLI / 扩展端 / 桌面端）；**缺键（老槽）⇒ 不标注**（不猜测——**禁以「占用端」冒充**，见下旁证行）；通道面 = `docs/desktop/design/IPC.md` §2 会话族行 |

**旁证（不得混称）**：**占用端**（谁正持有该槽运行）可由核 peer 面观察（`thincoder-core/peer-instances.mjs` 的端字段）——那是另一事实，与「来源端」不同义，本端**不**以它冒充来源端。

## 3. 范本借用清单（形态面 · UI 范式勘察落档）

清单前言（单源，住本档）：**本端落形列 = 单源**（本档 §1 规则行引用本表常量）；来源只作参照，不作承诺。
全部落形只用**浏览器原生能力**（`mask-image` / 原生滚动事件 / `tabindex` 焦点序）——**零框架零构建**（`docs/desktop/design/PROJECT.md` §2 KD-4）成立，逐项无框架依赖。
证据级别两档——**本仓实读**（本仓源档逐行读过）∥ **外部转引**（参考仓 kimi-web / opencode 的父侧实测读数；本端只复核坐标在位，未运行实测）。

| # | 借用项 | 本端落形（本档 §1 规则行） | 来源坐标 | 级别 |
|---|---|---|---|---|
| 7 | 标签条形态 | **不适用（R13 后）**——标签条随会话模型轮裁撤退场 | opencode `titlebar-tab-strip.tsx`（91 / 147 宽域 · 215 溢出横滚）；渐隐端 `text-reveal.css`（66-85） | 外部转引 |
| 8 | 左列壳折叠 | **不适用（R13 后）**——零断点（单源 = 本档「断点」行）；左列壳随会话模型轮裁撤退场 | opencode `sidebar-shell.tsx`（43-46 `inert` 开关） | 外部转引 |
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
- 2026-09-25（**实施后修正轮 2**——标记收正）：§1 `styles.css` 行的「（拟新增）」标记去标（已落档 · 同源发现）。
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
- 2026-09-28（**D21 批 · 实施期设计前提收正**——面 9 行聚焦）：§1 本批注项 2 表第 9 行收正——VSC 实有 `.session-item:focus-visible`（`thincoder-vscode/webview/base.css:449-457`：`outline: 2px solid var(--accent); outline-offset: -2px; background: var(--hover-bg-strong)`）⇒ 桌面 `.session-item:focus-visible` 照落同三值；
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
- 2026-09-28（**外壳视觉降噪批（D24）· 修正轮 1**——评审轮 1 发现 1–8 逐号点修〔发现 9 = 需求档侧 · 父侧已落〕）：本批注坐标重校准（`styles.css` **467 ⇒ ≈485** · 后半段 8 处 +4 换号）· 保留面负向锁拆**两值列**（accent = `.approval-card` / `.question-card` / `.session-rename-input`；`--line` = `.composer-input` / `.block` / `.plan-card` / `.session-item`）；
  `.chat-pill` 实色支补全（hover / 按下 = `var(--bg)` · 聚焦底不随落）+ 聚焦第三值 `background: var(--hover-bg-strong)` 补全（`.head-field` 特例随动）· `.session-rename-input` 入保留面（输入框细边族）· 设置面计数改记 **9 面（6 改 + 3 保留）**；
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
- 2026-09-29（**R12 设计面同步轮（fix · #26 · eng-designer）**——承 flow 批 R12 §5.15 未办 5）：§1 对话流行新增「**本批注（R12 会话流 ⇒ VSC 对齐）**」+ 行内指针；本批注（外壳视觉降噪 · D24）项 6 ∕ 项 7 保留面收正（`.block` 移出——R12 F1；`.session-item` ∕ `.session-rename-input` 清出——R13-A 退场对位）。明细 = 批档 §2。
- 2026-09-29（**桌面功能对位批 · R6 设计面收正轮（fix · #30）· eng-designer**——承批档 §1.13 处置① ∕ §3 修正 7 R6 行）：§1 交互行补 **Ctrl+F 会话内搜索**键位（搜索条开合 · 命中高亮 ∕ 上下跳 ∕ Esc 关——键位注册与检索逻辑单源 = 核件 `thincoder-render-core/search.mjs`，两端同件）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-subblock-follow.md` §1 · 台账 #518）：§1 增「**本批注（子 agent 块内容区跟滚 · #518 收口）**」五项（块内容区跟滚 ∕ 池区帧尾钉底 ∕ 值面两行 ∕ 判据 ∕ 边界）+「对齐第二批 · 六件」项 3 行内指针。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-copy-vsc-align.md` §1 · 台账 #557 / #558；需求 §4 **D27** 新行 + **D13** 收正）：§1 增「**本批注（复制面对齐 VSC · 2026-09-29）**」四项（右键编辑菜单（宿主面：条目集 ∕ role 行为 ∕ 词表文案四键 ∕ 沙箱判据句）+ 复制面两控件摘除清单 + 判据 + 计数）；反转句收正六处——「批 B 注」项 4（复制面 ⇒ 核件 Copy 钮唯一）· 对话流行 ∕ 输入区行行内指针 · 「批 B 追加注」项 1 死先例句 · 「可见面修复」项 1（控件族三枚 ⇒ 核件单源 ∕ ⧉ 字形句删）· 「D17 / D19」项 2 与「对齐第二批」项 4 的 `data-raw` 句（就地更新判据面）· 「外壳视觉降噪 · D24」项 1 控件族 11 ⇒ **8** 选择器 + 项 2 hover 理由句；档头 **D1–D27**。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 修复轮（评审轮 1 · 发现 4）· eng-designer**）：本批注项 1 四点接线枚举统一（① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——与 `docs/desktop/design/RENDERER.md` §3 同序号同指位）。明细 = 批档 §2 修复轮。
- 2026-09-29（**挂起窗径「消费前流内零块」批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-susp-queue.md` §2 · 台账 #561）：§1 增「**本批注（挂起窗径「消费前流内零块」· 2026-09-29）**」五项（窗内提交零块 ∕ 消费恰一枚 ∕ queue-full 反径 ∕ 判据 ∕ 边界）+ 输入区行收正（消费前零块 + 带面 + 两源镜面 + 失败两词键）+ 表行 14 并源 + 「回合中插入」注四项收正（入队即出泡 ⇒ 消费前流内零块等；项 1 ∕ 2 ∕ 4 ∕ 5——含死键 `composer.queue.full` 收正）。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 1（评审轮 1）· eng-designer**——发现 3 / 4 / 6 / 7 逐号点修）：D24 注计数行控件族 **11 ⇒ 8 选择器**（与 `docs/desktop/design/PROJECT.md` D24 行同笔收正）· 本批注项 3 判据域写死为**代码树**（`⧉` ∕ 键字面零命中域——排除 `docs/`）+ ③ 机检载体改述（零测试件现状载体 + 批次本地件留待）· 输入区行补行内指针（尾控件 ∕ 尾锚退场 → 本批注项 2）。明细 = 批档 §2 修正轮节。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 2（评审 #58 · §3 轮次 2 · 发现 1–8 逐号点修）· eng-designer**）：发现 1（🔴 账本警示面按盘同值收正——本批注项 2 改「下拉首行 ∕ `div.session-ledger-notice` ∕ `chrome.css:222`」+ 会话控制面行补类名同值；同机制同族 `IPC.md` ∖ `PROJECT.md` D23 ∕ T-DSK40 同笔）；
  发现 5（退场面残迹）：断点行 ⇒ **零断点**（R13 消解，去 `styles.css` 调参面句）· 启动态行 ⇒ 项目钮入口（去左列 ∕ 最近目录列表残句）· 主题行变量回锚 `theme.css` · D21 项 2 落点改 `chrome.css` 会话控制面段（`.session-*`）+ 不追面①②④⑤⑥⑦ 按 R13 后形态收正 · 账本警示面注头行锚收正（「左列会话行」⇒「会话控制面」）。明细 = 批档 §2.10。
- 2026-09-29（**挂起窗径批 · 修正轮（重派 · 评审轮 1 · 12 条）· eng-designer**——发现 1 ∕ 9 逐号点修）：发现 1 取「非流内」为真——本档同笔收正四处：本批注（可见面修复 · 五件）项 2 入队径句 · 本批注（对齐第二批 · 六件）项 2 全项（题名 ∕ 机制 ∕ 交接 ∕ 分键 ∕ 形态落位——「同一位置交接」句删）· §2 项 1 两处 · 本批注（对齐第三批 · 小修族）项 6 排序锚改 `[data-digest]` 族；发现 9 = 段 14 措辞归一（表行 14 ∕ 本批注（挂起窗径）项 5 = 形态 ∕ 三态零改 · 源并两源）——窗内提示态归登记（批档 §2.9「登记」节）。明细 = 批档 §2.9。
- 2026-09-29（**窗队列 VSC 逐点对齐批 · 修正轮（评审 #57 · 逐号）· eng-designer**）：发现 7 = 输入区行满队面**双面定义**（提交守卫 toast `input.slotFull`〔核件面板 `thincoder-render-core/composer/panel.mjs:304-306`〕∥ 回执失败行 `composer.send.failed` + 退流 + 稿留——判据各单源）；发现 8 = 「入队即出泡」残句复核零残留（已由挂起窗径批修正轮同向落地）；发现 6 = 本批注（复制面对齐）项 1 文案面持有面 ∕ 读取径点名（`HOST_DICT` 两语现读——先例 `thincoder-desktop/src/main/attachments.mjs:27`）+ 计数项净 +2 ⇒ **净 +2 键**；发现 10 = 状态词闭枚举计数三处收现值（**8 词**——delta 归记录面）；发现 5 = 本批注（窗队列）补**判据项 5**（携图受理 ∕ 送达判决 ∕ `degraded` 浮出 · 消费恰一枚）。明细 = 批档 §2.9。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 3（§3 轮次 3 · 评审 #76 · 发现 1–11 逐号点修）· eng-designer**）：发现 2（R13 退役面残引逐处收正——「批 B 追加注」项 2 ∕ 状态栏表行 11 ∕ 13 ∕「对齐重定位」注头 ∕「D21」注头与结构句 ∕「D17 / D19」项 1 触发点 ∕「对齐第二批」项 6 边界 ∕ 借用项 8 ∕ 设置面行开面锚点）+ 发现 4（「对齐第三批」项 12 周期刷新改记已落 · E 表 ① 销项重编）+ 发现 7（P28 补**挂起窗在飞档** + 判据单源点名 = 位标切片）+ 发现 8（`queued-input` **73** ∕ `i18n-views` **282** ∕ `chat-pending` **69** ∕ `chat-subagent` **75** 四处按盘回填）。明细 = 批档 §2.11。
- 2026-09-29（**批 parity-b4 · 实施收正轮 · eng-coder**——承 `docs/batches/2026-09-29-parity-b4-vsc-small.md` §2.7-W3）：§1「批 B 注」项 2 降级面行收正（两码语义 = 降级未成 ∕ 弃项；降级成功且零弃 ⇒ 回执零码 + 描述注文）。**零新语义**（实施随动）。
- 2026-09-29（**挂起窗径批 · 修正轮（重派 · 评审轮 2 · 5 条）· eng-designer**——发现 3 逐号点修）：计数行「A2 排队流内」⇒ **非流内** · 对话流行指针剔除「待发送气泡组」（非流内——落点住输入区上方带）。明细 = 批档 §2.10。
- 2026-09-29（**桌面两批 · 「全清令」措辞族终扫轮 · eng-designer**——#126 观察 1–2 收尾）：本批注（复制面对齐）项 3 ∕ 本批注（窗队列）判据项 5 机检载体按现况收正（批档本地件 + 标准限定语）+ 本批注（挂起窗径）项 5 边界句补限定语 + 判据项 5 分句断行（原行超宽——零语义）。明细 = 批档 §2.13。
- 2026-09-29（**micros 批 · 档面波（解冻后）· eng-designer**——承 `docs/batches/2026-09-29-desktop-micros.md` §2 档面笔清单 P1）：本批注（R11）项 3 两新槽值按届盘收正——`--mode-plan` = `#047990` ∕ `#11a8cd`（#578②）· `--mode-advisor` = `#0a7b0a` ∕ `#23d18b`（#534）；
  亮色 = 同色相暗化 ∕ 暗色 = ANSI 默认；坐标两行（#578④）已由残余族清账批同域落定（`docs/batches/2026-09-29-desktop-residuals-sweep.md` §2）——本笔零重复。
- 2026-09-29（**stall-indicator 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-stall-indicator.md` §1 · 台账 #568）：§1 增「**本批注（停滞轻显形 · 2026-09-29）**」五项（承载段 +1 = `quiet` 段〔序 `elapsed` 之后〕· 归约面单点 `lastOutputAt` · `HEARTBEAT_MS` 1000 · 判据三项 · 边界）+ 状态栏行行内指针（`quiet` 段——承载 16 ⇒ 17）；语义单源 = `docs/cli/design/TUI.md` §7.7。明细 = 批档 §2。

- 2026-09-29（**residuals-round2 批 · 设计轮上抛处置轮 · eng-designer**——承批档 `docs/batches/2026-09-29-residuals-round2.md`〔父侧裁③〕）：「对齐第三批」相抵②句「语义同源」指针按核单源收正——`thincoder-vscode/src/extension/file-links.mjs` ⇒ `thincoder-core/file-links.mjs`（R2 处理流批上提后核单源）；「端侧自有实现」⇒「两端薄壳 = 探针注入」。零新语义（指针收正）。
- 2026-09-29（**桌面状态行 ⇒ CLI 补漏批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-statusline-cli-gap.md` §2 · 台账 #600）：§1 增「**本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）**」五项（段 9 上下文 ⇒ CLI 形〔含令牌〕· 段 11 台账 ⇒ 常驻计数〔核 marker 转发〕· 判据 · 计数 · 边界）+ 表行 9 ∕ 11 收正 + 状态栏行行内指针 + 批 B 注项 3 字段名 ∕ 形收正；`docs/desktop/design/IPC.md` 载荷注同拍。明细 = 批档 §2。
- 2026-09-29（**模型菜单全渠批 · W3 文档轮 · eng-designer**——承 `docs/batches/2026-09-29-model-menu-parity.md` §2.6 W3 #12）：§1 输入区行增**模型钮候选面句**（一级 = 全渠 ∕ 失败渠零行 ∕ 触发指针——单源 = `docs/desktop/design/IPC.md` §2「模型清单注」）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-subblock-follow-resume.md` §1 · 台账 #603）：§1 增「**本批注（块跟滚让位修复 · 2026-09-29）**」六项（内容窗出口两态 ∕ 让位收窄 ∕ 样式落点 ∕ 判据 ∕ 边界 ∕ 边界归属〔留端清算——原语 ∕ 时机归属定死〕）+ #518 本批注头行补收正指针。明细 = 批档 §2。
- 2026-09-29（**parity-b8 批 · W4 文档收正轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b8-ipc.md` §2 W4）：输入区附件条出口 ∕ 窗队列判据项 3 条目形收正为 **dataURL 串数组**（A1）；
  状态行表行 5 ∕ 7 ∕ 8 ∕ 12 随拍（`ev:activity` turn `{turn, maxTurns}`（槽内 `{n, max}` 不随动）· `ev:usage` 载荷 `usage` · 产出方 ∕ 归约坐标收正 `:176 ⇒ :148` · `events.mjs:316 ∕ :314 ⇒ :155 ∕ :152-153` · 队列镜面切片形 `pending ⇒ string[]`（A9））。零新语义。
- 2026-09-29（**更新纪律收核批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-render-perf.md` §1 · 台账 #609）：对话流行行内指针补 §1.2（更新纪律 · 帧合并）+ 两处同句域收正（本批注（#518）项 1 尾句 ∕ 本批注（让位修复）项 6——「桌面帧 = store 变更帧（无 rAF）」⇒ **store 变更排帧**（帧合并收核））。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 修复轮（评审轮 1 · 发现 1 / 3 / 4 / 7）· eng-designer**——承批档 §3 轮次 1）：本批注（块跟滚让位修复）项 4 机检件改述「本批须新增（首落 `.thincoder/tmp/` ⇒ 父侧 copy 终位）」+ 探针件名收正为三件扩面形 + **D16 承载句**（探针计入 D16 义务）；项 5 边界补**键盘径 = 残余**句（消解路 = 真机核）。明细 = 批档 §3。
- 2026-09-29（**桌面状态行 ⇒ CLI 补漏批 · 修正轮（评审 #194 · 7 条逐号）· eng-designer**——承批档 §3 轮次 1）：段 11 两说收正（`:29` ∕ `:179` ∕ `:197` ∕ `:536`）· 段集计数随动（`:101` ∕ `:122-123` ∕ `:192` ∕ `:194` ∕ `:197` ⇒ 17 段）· 令牌格式单源点名（`:534`）· 判据①态域限定（`:536`）· 命名对位（`:116` ∕ `:535`）· 种子读数名收正（`:180`）。明细 = 批档 §2.8。
- 2026-09-29（**更新纪律收核批 · 修复轮（评审轮 1（#214）· 发现 4）· eng-designer**——承批档 §2.9）：本批注（停滞轻显形）项 3 按盘收正（`HEARTBEAT_MS` **1000** 落值——`heartbeat.mjs:16`；拍体坐标 = `app.mjs:269-276`）。
- 2026-09-29（**桌面状态行 ⇒ CLI 补漏批 · 修正轮 2（评审 #212 · 5 条逐号）· eng-designer**——承批档 §3 轮次 2）：播种面族计数随动（`:21` ∕ `:171` ∕ `:178` ⇒ 读数切片段 **13** ∕ 不播种 **11**——`quiet` 补逐段裁定）；明细 = 批档 §2.9。
- 2026-09-29（**parity-b10-ui 批 · W6 文档随动轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b10-ui.md` §2.7 文档随动表 + §5 三舱实施记录）：§1 增「**本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）**」十项（渠道行控件族 ∕ 拉取模型 ∕ 预设标签形 ∕ 删除确认门 ∕ MCP 编辑重连 ∕ agent 段三件 ∕ S3 已知端差登记 ∕ 首屏引导门 ∕ index 空态 ∕ 计数）+ 设置面行与启动态两行行内指针。明细 = 批档 §2。
- 2026-09-29（**队列取项边缘收正批 · 实施轮 · eng-coder**——承 `docs/batches/2026-09-29-queue-pickup-edge.md` §2 ∕ §2.10 · 台账 #624）：本批注项 5 **斜杠边界句收正**——「计划面 `slash` ⇒ 步边界零动作（防御面原样）∥ 回合尾逐条直发」⇒ **统一语义**（计划首动作即消费——slash 首条步边界 ∥ 回合尾同判即消费；单条 · 保序 · 不合并 · 零静默丢）。零新机制（核件收编）。明细 = 批档 §2 ∕ §5。
- 2026-09-29（**队列取项边缘收正批 · 修复轮（评审轮 1 · 发现 1 ∕ 4）· eng-coder**——承批档 §3 轮次 1）：本批注项 2 **同机制句收正**（「首动作 `slash` ⇒ 不消费〔防御面〕」⇒「统一语义 = 计划首动作即消费——`slash` ⇒ 单条即消费」——与项 5 收正句 ∥ 交付代码同判）+ 落点读数按盘收正（`queued-input.mjs` 实读 73 ⇒ **78**——两处：本批注项 1 ∥ 「对齐第二批」注项 2）。零码改。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 ∕ §2.13 发现 4 · 台账 #594 ∕ #598）：段计数面单一现值形收正——状态栏行（`:21` 格：17 段逐项裁定表 ∕ 定形 = 17 段 ∕ 承载 17 段）、本批注（对齐重定位）项 1 表名、本批注（状态栏对齐）收正句、本批注（停滞轻显形）项题；
  拍值三处收正（`:315` ∕ `:395` ∕ `:432`——2s ⇒ 1s）；措辞收正（「会话控制面条目」⇒「会话控制条目」——全档 5 处）。**零新语义**（计数 ∕ 值面 ∕ 措辞收正）。
- 2026-09-29（**端差清算批 · 批 C 文档随动轮 · eng-designer**——承 `docs/batches/2026-09-29-enddiff-clearance.md` §2）：逐靶收正——审批呈现行（核卡直消费 ∕ 超阈残句清）· 文本段间隔项（审批卡首行条退场）· R10 消差落定（#630）· 工具卡中止摘要段（#631）· turnBreak 钩子改挂（#628）· 中断键两态 ⇒ 显 ∕ 隐（#626）；
  相抵②行参数面（#627）· 「E. open / 上抛」全消解退场 · 会话控制面行补受占切换件（#637）· 设置面端差裁注（#635）；明细 = 批档 §2。**零新语义**（句级收正 ∕ 裁注）。
- 2026-09-29（**缺面族批补批 · 批 C 文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-missing-face-family.md` §2.2 ⑪ ∕ §2.4 · 台账 #632）：§1 增「**本批注（@ 文件引用对齐 · 2026-09-29）**」五项（注入 ∕ 剥离 ∕ 欢迎条词值 ∕ 判据 ∕ D3 计数）+ 输入区行行内指针；
  「对齐第三批 · 小修族」项 15 端差登记句收正（登记兑现退场——`@` 段已落）+ 项 15 落点串按盘收正（`i18n.mjs` ⇒ `renderer/i18n-views.mjs`——`welcome.*` 词条现住）；明细 = 批档 §2。**零新语义**。
- 2026-09-29（**desktop-rebuild-fidelity 批 · U2 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.1 ∕ §2.6 · 台账 #604–#608 + #581）：§1 增「**本批注（桌面重建保真 + 留端清算族 · 2026-09-29）**」六项；段 14 措辞收正三处（表行 14 ∕ 「屏面为准」注项 4 ∕ 「挂起窗径」注项 5——「三态」⇒ 判据四路）。明细 = 批档 §2 记录块。
- 2026-09-29（**desktop-residuals-round3 批 · 波 D 登记 + 实施后文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-round3.md` §2.13）：「本批注（parity-b10-ui · 设置面余面 + 首屏引导门）」项 6 补 **slot 权威键泛化行只读**（#617-CH 波 C 落）· 项 8 收正为 **CJ 裁定落**（`error` 态顶部横幅非模态——#617-CJ 波 C 落）。**零新语义**（实施随动）。
- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #646 ∕ #647 ∕ #648）：
  措辞族第三形收正（「会话控制面条体」⇒「会话控制面」——全档 5 处，沿「会话控制面项目钮」现役形）；文本段间隔项计划行条收正（核件直消费——`planCardNode`；端侧零行构树）；
  「对齐第三批」计数面 `i18n-views` 读数收正（**282 ⇒ 332**——与 `docs/desktop/design/PROJECT.md` §4.1 同值）。**零新语义**。明细 = 批档 §2。
- 2026-09-29（**desktop-carryover 批 · §3 轮次 1 九发现修正轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-carryover.md` §2 修正块 · 台账 #656 ∕ #659）：§1 输入区行满队面 **2 ⇒ 3**（第三面 = cap 待答径 `msg:interrupt` toast + 文本回注；①② 补通道范围）；
  会话控制面行补「改名形内键面让行」句（#659）·「本批注（挂起窗径…）」项 3 补通道范围（`msg:send` 直发径；cap 待答径另立）；`paintSettings` 坐标收正（`mount-settings.mjs:125-133`——届盘重锚）。**零新语义**（计数 ∕ 通道限定 ∕ 坐标收正）。
- 2026-09-29（**撤会话头 + 工具头色批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 · 台账 #668 ∕ #669）：§1 **会话头行退役**（整行含槽——用户 2026-09-29 21:35 走查裁定；三值唯一居所 = 输入区控件行——档头板块清单 ∕ 布局行 ∕ 输入区行 ∕ 设置面行随动）；批 B 注项 1 改写（三值居所句）+ 项 5 两处名收正；「对齐第三批」项 **23 删**（**小修族 25 ⇒ 24**——忙态门承接 = 输入区控件行）+ 项 28 指涉收正；D24 注六处（骨架线 4 ⇒ 3 · 控件族 8 ⇒ 7 · `.head-field` 特例 ∕ `.head-pick` 边界 ∕ 上抛 ① 三处销 · 计数·命中面随动）；状态栏对齐注（注头 ∕ 表行 1）· 重建保真注项 2 收正。明细 = 批档 §2。
- 2026-09-29（**口子清零二轮 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · 台账 #673）：坐标按盘收正——`:102` `status-bar.js:51-61 ⇒ :66-75` · `:193` `render-frame.mjs:227-230 ⇒ :233-236` · `:210` 账本注记落点 `chrome.css:222 ⇒ session-list.css:93` · `:450` banner 三规则 `chrome.css:414-416 ⇒ :257-260` · `:452` 告警位条 `:411-412 ⇒ :254-256`；本批注（parity-b10-ui）项 7 S3 = **消**（补做三件——原「能力缺失」不成立）。**零新语义**（坐标 ∕ 处置句收正）。明细 = 批档 §2。
- 2026-09-29（**撤会话头 + 工具头色批 · 修正轮（评审轮 1 · 发现 2 ∕ 3 ∕ 10 逐号）· eng-designer**——承批档 §3 轮次 1）：可见面修复注项 1 形句去 `.session-head` 底边线死参照 · 「对齐第三批」B 表头 **13 ⇒ 12 项** + D 计数句「外围 13 = 25」⇒ **外围 12 = 24**（实点：编号 1–3 ∕ 5–7 ∕ 12 ∕ 14–15 ∕ 22 ∕ 26 ∕ 28）· 账本警示面注计数行宿主键总数 **147 ⇒ 144**（退 `head.field.*` 3 键）。明细 = 批档 §2.10。
- 2026-09-29（**口子清零二轮 · 修正轮（评审轮 1 · 发现 2 ∕ 3 ∕ 4 ∕ 8 ∕ 9 逐号）· eng-designer**——承批档 §3 轮次 1）：工具卡边界句改「编辑器本体」（删「打开」）· S3 处置句（登记 ⇒ 消）· CLI 段集锚四值按盘重锚（`:356` ∕ `:233-236` ∕ `:240-243` ∕ `:446`）· 会话面板面七条重审（分类词退场——已消 ∕ 对位物退役 ∕ 需求边界 ∕ 说明四类）· 键盘臂句收正（两端一致）· consult ∕ escalate 停钮两句收正（`:308` ∕ `:387`）。**零新语义**（句面 ∕ 坐标收正）。明细 = 批档 §2.8。
- 2026-09-29（**口子清零二轮 · 修正轮 2（评审轮 2 · 10 条逐号 · 发现 4 ∕ 8）· eng-designer**——承批档 §3 轮次 2）：parity-b10-ui 注项 7 补点名 S3 渲染侧档（`thincoder-desktop/renderer/mount-settings-segments-providers.mjs`——行标渲染面）；「状态栏对齐 · 屏面为准」注项 1 判据句锚按盘收一（chip `:240-243` · 状态段簇 `:391-446`）。**零新语义**（点名 ∕ 坐标收正）。明细 = 批档 §2.9。
- 2026-09-30（**doc-sweep 批 · RF 收正族 · eng-designer**——承 `docs/batches/2026-09-30-doc-sweep.md` §2 · 台账 #661）：「本批注（桌面重建保真 + 留端清算族）」项 4-③ 说明行旗标句收正（挂载根旗标 `root._subDescShown` 一次置位不重置——沿 #630 KD-EC-4）；项 2 补两处滚位例外指针 + `view-state.mjs` 标记转正。**零新语义**。
- 2026-09-29（**口子清零二轮 · 实施随动收正轮（父侧裁）· eng-designer**——承批档 `docs/batches/2026-09-29-hatch-clearance-2.md` §4 ∕ §5.6）：parity-b10-ui 注项 7 S3 渲染档点名按实收正——`mount-settings-segments-providers.mjs`（该档 = 渠道面写出口族）⇒ **`thincoder-desktop/renderer/views/settings-sections.mjs`**（`rowSubNodes` 分档——现读 `:70-86`）。**零新语义**（点名 ∕ 坐标收正）。明细 = 批档 §2.10。
- 2026-09-30（**桌面消化行流内落位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 · 台账 #706）：§1 对话流行行 digest 句收正（**逐轮元素 · 流内就地**——原「非块节点组」形退场）；「本批注（对齐第二批）」项 5 的 atBoundary 句收正（**末轮元素前插**——KD-33 重裁；无轮 ⇒ 流末退化）。明细 = 批档 §2。
- 2026-09-30（**桌面消化行流内落位批 · 修正轮 1（评审轮 1 · 发现 1）· eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 修正轮块）：「本批注（对齐第二批）」项 5 归档块锚句补**块序守卫**（末轮元素即块序尾位 ⇒ 边界前插；否则退化 = 常规块插入点；无轮 ∕ 元素缺同退化——保 DOM ≡ `visible` 不变式）。明细 = 批档 §2 修正轮块。
- 2026-09-30（**轻通道轮一收尾全链 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-light-round-1.md` §1 · 台账 #712 ∕ #713）：§1 增「**本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）**」七项（框架全铺满 ∕ 圆角零 ∕ 相邻零分割线〔输入区上线唯一保留〕∕ 按钮族圆角恢复 ∕ 按钮迁行 ∕ 判据 ∕ 边界）+ 对话流 ∕ 输入区两行行内指针 +「**本批注（流内竖向间距 · 2026-09-30）**」入档（#715 ∥ #716）；
  随动收正四处（D24 注：总则「底色与间距」句 ∕ 容器族句〔间距归零 + 枚举现值〕∕ 骨架线族句〔输入区上线显形保留〕∕ 滚动条 thumb 圆角 6 ⇒ 0）+「可见面修复」注项 1 输入区根句按盘收正（根 = `.composer#toolbar` ∥ 顶线 = 核件 `#toolbar`）；
  R12 注项 2 ∕ 项 3 两处随动（块距 ∕ 件级外边距 ⇒ 间距注单源）+ 补笔 6（消化行上距 = 8px ∥ 轮间 0——#718）入注。明细 = 批档 §2。
- 2026-09-30（**轻通道轮一收尾全链 · 修复轮（批档 §3 轮次 1 · 发现 1–7 逐号）· eng-designer**——承 `docs/batches/2026-09-30-light-round-1.md` §3；#8 = 父侧 Deferred〔归 #713 文档层收口〕）：① 输入区行两说收一 + 扁平化指针补「输入区上线保留」；
  ② D24 注退役面残引清出（控件族 7 ⇒ 3 选择器 ∕ 命中面「同面收齐两组」清 ∕ R5 条转「不适用（R13 后）」∕ 滚动覆盖清 `.rail-body` ∕ `.tabbar`）+ 计数 ∕ 验收读项随动；③ `[data-slot="info"]` 线族残留面点名死面（上抛①收口）；
  ④ 变更记录补记（「流内竖向间距」入档 + R12 注两处随动——并入同轮条目）；⑤ 扁平化判据补两腿（按钮族正向值 ∥ 迁行行为）；⑥ 间距注补「非块插层承接」+ 消化行上距 8px 条；⑦ 布局行补框架指针。明细 = 批档 §2 修复轮块。
- 2026-09-30（**消化面留档批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 · 台账 #719）：§1 对话流行两处收正（**块六型 ⇒ 六型全员页读域**——`subagent` = 留档块 ∥ **留存 ⇒ 留存 ∥ 留档**——终态痕恢复自人读线 `digest` 记录）+ **携带项 （#713 ①）清**：`.rail-*` 残句全清（D21 表九行选择器名 ⇒ 现行 `.session-*` 族；`:235` 先例引用、`:257` 验收行措辞同拍——`.rail-*` 码面零命中实读）。明细 = 批档 §2 ∥ `docs/desktop/design/RENDERER.md` §1.1「留档记录」条。
- 2026-09-30（**轻通道轮二收尾 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-light-round-2.md` §1 · 台账 #722 ∕ #724）：工具卡行补「盒底 = 透明 ∥ hover = 头行面」半句；间距注项 3 收正（工具块出呼吸族——三型保留 8px）+ 承接条坐标随动（`:43-50` ⇒ `:44-51`）。明细 = 批档 §2。
- 2026-09-30（**消化面留档批 · 修复轮（评审轮 1 · 发现 1 ∕ 3 ∕ 7 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §3 轮次 1）：「对齐第二批」项 5 边界句收正（归档块 **运行期块 ⇒ 留档块**——记录重建 ∥ 计 `data-hidden` ∥ 可回填；死引用「运行期块记账条」⇒ 现名「留档块记账条」）·
  对齐重定位注项 3「页读域五型」⇒ **页读域（六型全员）** · D24 注计数行骨架线 **3 处 ⇒ 1 处**（输入区上线——显形保留）。明细 = 批档 §3。
- 2026-09-30（**轻通道轮二收尾 · 修复轮（小）（评审轮 1 · 发现 6）· eng-designer**——承 `docs/batches/2026-09-30-light-round-2.md` §3 轮次 1 · 台账 #723）：R12 注项 2 ∥ 间距注项 6 两处「盒块 8」补「（三型）」限定（工具块已出呼吸族——随项 3 三型定义）。**零新语义**（限定词补记）。明细 = 批档 §2 修复轮块。
- 2026-09-30（**消化痕口径收正（用户 2026-09-30 15:4x ∥ 15:53 走查裁定）· eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 增量注记）：§1 对话流行涉句收正——**行入流（与内容同生态）**：无专门「摘 ∥ 留」处理；重建按记录位次复列（段界可辨）；留存语境 VSC 引用收为形面。来路 / 纠偏 = 批档 §2 增量注记（R10 标签化 → #670 升格桌面目标；VSC 无「留存不摘」行为——残存现象非行为；无用户点名 ∥ 用户腿未跑即收口）。
