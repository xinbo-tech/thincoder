# 桌面端（DESKTOP）· 界面形态与交互

> 板块 = **界面总则 · 状态行 · 视觉基线**（文档体系重组批 · 2c 降格——域面行按域分持）——面群分区 = §1 导读：① 总则 ∥ ② 状态行 ∥ ③ 视觉基线 ∥ ④ 域面行（已迁指针）；活动池与状态位 = §2（指针）；文件账（本域迁移面）= §4；历史段 = 变更记录。
> 需求侧 = 需求分卷（本域卷 = `docs/desktop/requirements/UI.md`；查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；功能点 ∥ 验收面 ∥ 依赖面——**范围数随需求卷现文**）。
> 同部分相关档：有界渲染窗口 / 回填与跟滚 / 流式增量等**实现工艺** = `docs/desktop/design/RENDERER.md` · 进程与目录形态 = `docs/desktop/design/SHELL.md` · 通道与载荷 = `docs/desktop/design/IPC.md` · 总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 域档（文档体系重组批 · 2026-10-02 增）：会话域 = `docs/desktop/design/SESSIONS.md` · 设置域 = `docs/desktop/design/SETTINGS.md` · 菜单体系 = `docs/desktop/design/MENU.md` · 对话流 = `docs/desktop/design/CHAT.md` · 输入区 = `docs/desktop/design/COMPOSER.md`；
> 续：活动池与消化面 = `docs/desktop/design/ACTIVITY.md` · 打包与发行 = `docs/desktop/design/PACKAGING.md` · 端到端测试基建 = `docs/desktop/design/E2E-TESTING.md` · web 快筛 = `docs/desktop/design/WEB-QUICKCHECK.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∕ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 界面形态落定（UI / 交互决策）

**面群（降格后分区）：本档自持三面 + 域面行**：

- **① 总则** = 布局 ∥ 断点 ∥ 状态词 ∥ 交互 ∥ 键盘可达 ∥ i18n ∥ open。
- **② 状态行** = 状态栏行 + 状态行族注（对齐重定位注项 1 ∥ 状态栏对齐注 ∥ R11 注 ∥ 停滞轻显形注 ∥ 状态行 ⇒ CLI 补漏注 ∥ D17 / D19 注项 1）。
- **③ 视觉基线** = 主题行 + 视觉族注（D24 注 ∥ 扁平化注 ∥ 排版统一注 ∥ 主题切换注）。
- **④ 域面行（按域分持 · 已迁指针）** = 对话流 ∥ 输入区 ∥ 审批呈现 ∥ 提问呈现 ∥ 计划面 ∥ 目标面板 ∥ 工具卡 ∥ 空态 ∥ 启动态 ∥ 会话控制面 ∥ 设置面 ∥ 首启向导——单源 = 各域档 §2；域面族注（批 B 注 ∥ 批 B 追加注 ∥ 可见面修复注 ∥ 对齐第二批 ∥ 对齐第三批 ∥ D17 / D19 项 2 ∥ 重建保真）按批落序见下。

| 面 | 决策 |
|---|---|
| 布局 | **两列**：中区 = 会话（会话控制条 + 对话流 + 输入区）· 右栏 = 活动池（可折叠，折叠态按会话记忆）；骨架 = `thincoder-desktop/renderer/index.html`（状态栏 = 窗口级底行——见「状态栏」行）；**扁平化（2026-09-30）**：框架全铺满（区间距归零）——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」项 1；**右栏宽度可拖动（D30 · 2026-09-30）**：中 ∕ 右交界拖动柄——拖动即时生效 ∥ 宽度持久化（重启恢复）∥ 单一权威 = 用户值；形态 ∕ 上下限 ∕ 载体单源 = `docs/desktop/design/ACTIVITY.md` §2「本批注（右栏宽度拖动 · D30 · 2026-09-30）」 |
| 断点 | **零断点**——原单断点（900px 折叠，首版初值）随会话模型轮 R13 左列裁撤消解（余两列无折叠行为；单源 = `thincoder-desktop/renderer/chrome.css` 档头注）；池面窄窗态 = open 行另载 |
| 状态词 | **闭枚举 8 词**：排队中 · 运行中 · 待审批 · 完成 · 已停止 · **已中断** · 错误 · 就绪（前 6 词词形与核 i18n / 需求档同源；**已中断** = 工具卡中止形（词键 `tool.interrupted`——值逐字同 VSC locales；`docs/desktop/design/CHAT.md` §2「A. 对话流面」项 5）；**就绪**词形来源单列 = CLI 静息值 `Ready`——`thincoder-cli/src/tui/tui-state.mjs:43` 实读，核 i18n 无同源词，2026-09-28 重审判定入集）——界面各处（工具卡 / 活动块 / 回合 / 状态行）取词一律出自本集，不得自造词；与 §2 项 2 的标签位集合（位标面）分属两面，不得互相顶替 |
| 交互 | Enter 发送（**IME 组字中不发送**——`isComposing` 真 ∥ `keyCode === 229`（老 WebView 兜底臂）⇒ 键归输入法（两臂同径 · 判据单源 = `thincoder-desktop/renderer/mount-composer.mjs:41-43`）；先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`） · Shift+Enter 换行 · 会话控制面键面 = 选择器 Enter ∕ Space 开合（**改名形内让行**——单源 = 本档 §1「会话控制面」行） · **Ctrl+F 会话内搜索**（搜索条开合 · 命中高亮 ∕ 上下跳 ∕ Esc 关——键位注册住核件工厂 `thincoder-render-core/search.mjs`，两端同件单源） |
| 对话流 | **三态**（`data-state`）：无活动会话 ⇒ `none`（**零块节点** + 引导节点——**禁假数据**；引导面 = 本档 §1「批 B 追加注」项 1）· 有会话零块 ⇒ `empty`（词表提示）· 有块 ⇒ `flow`；**根锚全量**（四锚：`data-state` / `data-blocks` / `data-hidden` / `data-following`——语义 = 三态码 / **已渲染块数** / 未渲染更早块数（产出规则 = `docs/desktop/design/RENDERER.md` §2）/ 是否跟滚 `"1"` / `"0"`）；**块六型**（`user` / `assistant` / `reasoning` / `tool` / `error` / `subagent`——**六型全员入页读域**（留档批 · #719：`subagent` = **留档块**——恢复自人读线记录；前五型原样），单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 5）单序列、每块 `data-block-id` + `data-block-kind`，文本面 = **经共享渲染核呈现**（Markdown 单源 = 核 `md`——含全量转义闸；真代码块 / 推理块 / 复制面 = 本档 §1「本批注（对齐重定位）」项 3）；**错误卡** = 回合级错误块（工具级错误 = 工具块 `status="error"`——**不经 `ev:error`**：该通道单义 = 宿主回合结算〔错误径〕，单源 = `docs/desktop/design/IPC.md` §1 `ev:error` 行）；**挂载根 = 滚动容器 `[data-slot="flow"]` 自身**（clear + build + append 不清宿主 ⇒ 滚动位置存活）；**摘要块**（未渲染更早块 > 0 ⇒ 首子，词键 `chat.summary.older`）· **药丸**（`!following` ⇒ 尾随，词键 `chat.pill.new` / `chat.pill.bottom`）；窗口 / 回填 / 跟滚三事住 `docs/desktop/design/RENDERER.md` §2 / §3 ∕ 更新纪律（帧合并 · 收核）住 §1.2；**复制面 = 核件代码块 Copy 钮（唯一）**——自建两枚 ⧉ 控件退场（`docs/desktop/design/CHAT.md` §2「本批注（复制面对齐 VSC · 2026-09-29）」）；**真代码块（围栏切分 · 高亮 · 代码块级复制）随核落**（本档 §1「本批注（对齐重定位）」项 3）；**可见面修复批修（可见面四件）**：用户块受理即出 → 本档 §1「本批注（可见面修复 · 四件）」项 2 · 流式游标清点 → 项 3；**视觉对齐（D21）**：内容面值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（21 面 · 外壳零动）；**用户块 md 深度（D19 · 残余补齐）**：`user` ⇒ `mdInline` ∥ `assistant` / `reasoning` / `error` ⇒ 全量 `md`（端侧分流——本档 §1「本批注（D17 / D19 · 残余补齐）」项 2）；**对齐第二批**：说话人标签行 / 归档子 agent 块——本档 §1「本批注（对齐第二批 · 六件）」项 4 / 5；**桌面空闲唤醒批**：挂起窗消化轮 ⇒ **消化行族 `[data-digest]`——行元素（流内普通项）· 流内就地（行出即留——全轮在流：起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行，不改 ∥ 不删 ∥ 不退场；无轮容器——行元素互为并列兄弟；cap 行 ∥ 终态行到达序追加）**（零 `data-block-id` ⇒ 不占块序 / 不动 `data-blocks` 不变式——沿两端实形：VSC 裁集不含消化行 ∥ CLI 行非块）；**行集 = 全轮**（每轮：起跑标签行（ask 档行文 `digest.turnLabelAsk`——本轮独有信息）+ `n > 0` 计数行（**起跑文 = `digest.start`**——**终态不换文**）+ cap 行 + **终态行（锚 `data-digest-end`）——`end` ⇒ 追加一条新行（`digest.done` ∕ `digest.aborted` 直取；**不动原 digesting 行**）**；`n = 0` 轮零计数行 ∥ 零终态行（守句——三端同守））；**显示 = 自然形**（行出即留——新轮起跑 ⇒ 旧轮行留置；用户 2026-10-01 07:54 ∥ 07:58 直斥；本批 2026-10-01 收正——口径 = 批档 §1）；**记录面（留档批 · #719）**：轮记录全量入**人读线 `digest` 记录**；重载 ∥ 切走切回 ⇒ 复列**全量（未结轮照现）**（记录位次复列——零配对）；未结轮归属 = **活流侧优先**（运行期未结轮在场 ⇒ 折叠未结末轮不并入；单源 = `docs/desktop/design/RENDERER.md` §1.1；修复轮 1 · 2026-10-01 收正）；**词面 = 核字典 `digest.*` 经 `t()` 投影直取**（**零新键** · 值同源零复制）；形态 / 落位（含**归档落位**——随到达入流；端面旧锚面函数随实施轮清）单源 = `docs/desktop/design/RENDERER.md` §1.1「流内消化行族」条 ∥ 插入点纪律条；通道面 = `docs/desktop/design/IPC.md` §1 `ev:digest`；**对齐第三批**：恢复帧次序 / `[stopped]` 痕 / 错误横幅（详情 + 重试）/ 台账行 / 发送后回底 / 空态欢迎条 / **turnBreak 子回合边界**——`docs/desktop/design/CHAT.md` §2「A. 对话流面」项 8 / 6 / 9 / 12 / 13 / 15 ∥ 本档「本批注（对齐第三批 · 小修族）」项 7（存留）；**R12 会话流 ⇒ VSC 对齐（2026-09-29）**：块壳透明 ∕ 面宽 100% ∕ 块距 ∕ 件级外边距与首块上距 ∕ 扁平块模型——`docs/desktop/design/CHAT.md` §2「本批注（R12 会话流 ⇒ VSC 对齐）」；**间距现值 = `docs/desktop/design/CHAT.md` §2「本批注（流内竖向间距 · 2026-09-30）」**；**扁平化（2026-09-30）**：块壳 ∕ 盒面圆角归零 ∥ 相邻零分割线——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」；**排版统一（D29 · 2026-09-30）**：文本面与全栈同基线（字号 ∥ 行高 ∥ 字距 ∥ 字重通道——md 修饰层保留）——本档 §1「本批注（排版统一 · D29 · 2026-09-30）」；**轻通道轮四（2026-10-01）**：流形三件（工具头前导箭头 ∥ 展开体左流线 ∥ 思考块底色撤）——`docs/desktop/design/CHAT.md` §2「本批注（流内竖向间距 · 2026-09-30）」项 7；**帮助行族（slash 面增量 · 2026-10-01）：流内非块行族 `[data-help]`（标签 ∥ 组 ∥ 命令行逐行）——单源 = `docs/desktop/design/COMPOSER.md` §2「本批注（slash 命令面 · 2026-10-01）」项 8 ∥ `docs/desktop/design/RENDERER.md` §1.1** |
| 输入区 | 中区底行（挂载根 = `index.html` 新增单容器 `[data-slot="composer"]`——`.session` 内、对话流之后）；**两态**（沿接线通则）= 有活动会话 ⇒ 可用 · 无 ⇒ `disabled: true`（锚恒在——**禁用判据恒 = 活动会话在场：需先选工作目录**（需求档首启链 = `docs/desktop/requirements/PROJECT.md` §3.3）；引导面在场**不解除**禁用——见本档 §1「批 B 追加注」项 3）；键位 = Enter 发送 / Shift+Enter 换行（键位单源 = 本档「交互」行）；**发送失败**（`msg:send` `ok` 假 ∥ 抛）⇒ **文本保留** + `console.error`（零静默丢字）；**附件条（批 B 落）**——形 / 锚 / 降级面 / 清条与保留判据 = 本档 §1「批 B 注」项 2；**忙态提交** = 回合在飞 ∕ **挂起窗** ⇒ **一律交宿主任判**（受理判据单源 = 宿主在飞表 ∕ 挂起窗在场；渲染面**不再本地判忙入队**）——受理 ⇒ 回执 `{ ok: true, queued: true }` ⇒ **消费前流内零块**（待发送件住**输入区上方带**——派生；消费时刻才入流恰一枚——`docs/desktop/design/COMPOSER.md` §2「本批注（回合中插入 · 步边界 pickup）」项 1 ∥ `docs/desktop/design/COMPOSER.md` §2「本批注（挂起窗径 · 2026-09-29）」）；满队**三面**（各判据单源 · 通道范围分列）：① **提交守卫 toast**（词键 `input.slotFull`——核件面板提交守卫 `thincoder-render-core/composer/panel.mjs` `send()` 满队门：忙态 ∧ 宿主镜像计数 ≥ 容量 8（如实直读——端侧零增量；同 tick 空窗以宿主权威兜底——宿主满队拒收 + 回执失败行）⇒ 不出泡 + 不清框 + toast——**`msg:send` 忙态径**）；② **回执失败行**（宿主回执 `{ ok: false, reason: "queue-full" }` ⇒ 失败行（词键 `composer.send.failed`）+ **本地块退流 + 稿留输入历史（`↑` 召回）**——**`msg:send` 忙态直发径**）；③ **cap 待答径 toast + 文本回注**（`msg:interrupt` 回执 `{ ok: false, reason: "queue-full" }` ⇒ 核件 toast `input.slotFull` + 文本回注输入框〔零丢失〕——**cap 询问待答径**；决策 = `docs/desktop/design/PROJECT.md` §2 **KD-52**）；**队列单源 = 宿主**（快照镜面——**两源：忙态队 ∪ 挂起窗输入队**；消费时刻 ∕ 附件边界 = 同注项 1–3；窗径附件 = 载具层携图——见 `docs/desktop/design/COMPOSER.md` §2「本批注（窗队列 VSC 逐点对齐 · 2026-09-29）」）；中断键 = `data-action="msg:interrupt"`（零乐观写）；**可见面修复批修**：样式落点与关键尺寸 → 本档 §1「本批注（可见面修复 · 四件）」项 1 · 出泡时刻 → 项 2 · **外壳降噪（D24）**：`.composer` 顶线**显形保留**（现值——唯保留线）+ 输入面板控件静息无描边（单源 = 核件 `composer/composer.css`）——本档 §1「本批注（外壳视觉降噪 · D24）」项 1 / 项 2；**扁平化（2026-09-30）**：输入区上线保留 ∥ 按钮族圆角恢复 ∥ 主输入框保持方 ∥ Attach ∕ Send（∥ 忙时 Stop）迁控件行右端——本档 §1「本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）」；**排版统一（D29 · 2026-09-30）**：输入面板 ∥ 模型菜单 ∥ 搜索条（核件消费面）经覆盖段收基线——本档 §1「本批注（排版统一 · D29 · 2026-09-30）」；**对齐第三批**：非栅格拒时机 / 发送失败可见性 / 中断键两态——`docs/desktop/design/COMPOSER.md` §2（P22 ∥ P26 ∥ P28）；**复制面对齐 VSC 批（2026-09-29）**：输入区尾控件 ∕ `[data-composer-tail]` 尾锚退场——`docs/desktop/design/CHAT.md` §2「本批注（复制面对齐 VSC · 2026-09-29）」项 2；**模型菜单全渠批（2026-09-29）**：控件行「模型」钮（核件 `#model-btn`——`thincoder-render-core/composer/controls.mjs:45` + `model-menu.mjs` 两级菜单 · 核件零改）候选面一级 = **全渠**（= `model:catalog` 载荷 distinct provider 聚合——配置序）；**失败渠零行**（菜单内不造失败行——VSC 同行为）；触发六径（装配首跑 ∕ `ev:config` ∕ provider 写成功 ∕ 失败渠有界重探 ∕ 会话切换重推〔零取数〕 ∕ 无已配渠零推送）单源 = `docs/desktop/design/IPC.md` §2「模型清单注」；**@ 文件引用对齐批（2026-09-29）**：输入文本注入 ∕ 恢复面剥离 ∕ 标题剥离三面链 = `docs/desktop/design/COMPOSER.md` §2「本批注（@ 文件引用对齐 · 2026-09-29）」（决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-51**）；**撤会话头随动（2026-09-29）**：**三值（provider / 模型 / 推理档位）唯一居所 = 本面控件行**（模型钮（两级：渠道 → 模型）∕ 推理钮——写路 `session:prefs`；语义单源 = `docs/desktop/design/IPC.md` §2「会话级偏好注」）；忙态写门 = 模型 ∕ 推理钮 `disabled`（**保位不隐藏**——门住核件面板，VSC 同件）；**斜径命令（2026-10-01）** = 输入文本 `trim()` 后以 `/` 起头 ⇒ **命令径**（在册 5 条 + 别名 3——含 `/help`）；命中 ⇒ 本地面执行、不进消息径；未命中 ⇒ toast **携 `/help` 指引** + 文本保留；忙态同钮门——逐面 = `docs/desktop/design/COMPOSER.md` §2「本批注（slash 命令面 · 2026-10-01）」 |
| 状态栏 | **位置 = 窗口级底行**（`.app` 第 3 子元素 · 跨两列——两列框外一行；骨架 = `thincoder-desktop/renderer/index.html:39`；地面 = 需求档 §3.1 图 `:42`）+ 活动会话上下文占用（实时读数——**供给面 = `ev:usage` 事件**（批 B 落）；**≥ 80% 转警示色**）+ 非活动会话的待审批 / 运行提示（跨会话告警位）——两处皆**单点重建**（状态行唯一 writer）；**落形** = 告警位取值 = 非活动会话位标码（待审批 / 运行中——与会话控制条目位**同源同词**，优先序消费 = 位标切片单源，不由本面复制）；**读数供给（批 B 落）** = 活动键 `ev:usage` 读数（**未至 / 非正数 ⇒ 零读数节点**——禁假造）；读数按会话 `key` 归约、切标签随动（形 = 本档 §1「批 B 注」项 3）；**17 段逐项裁定表**（承载 / 旁置 / 不适用，零静默省略——裁定（对齐重定位批）= 本档 §1「本批注（对齐重定位）」项 1；**定形 = 17 段**——本档 §1「本批注（状态栏对齐 · 屏面为准）」＋「本批注（停滞轻显形 · 2026-09-29）」）；**恢复态播种（D17 · 残余补齐）**：打开 / 切换既有会话 ⇒ 以槽数据播种读数切片（`tasks` 直取 ∥ `context` 打开态读数；播种 2 / 不播种 11 逐段理由——本档 §1「本批注（D17 / D19 · 残余补齐）」项 1）；**桌面空闲唤醒批**：段 3 状态文本**第三态 = 挂起句**——判据 = 挂起窗在场（`susp[<会话键>].active` 真）⇒ 段文按 `susp.*` 三键条件组装（N/M 映射 / 优先序 / 交叠角落单源 = 本档 §1「本批注（对齐重定位）」项 1 表行 3）；`active=false` ⇒ 回落两态词（**禁假造**）；值 = **zh 取 CLI 逐字 ∥ en 取 VSC 逐字**（键名 / 值 / 落表单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」）；源 = `ev:susp` 计数切片（通道行 = 同档 §1）；跨会话告警码集保持 `{approval, running}`（`done` 不入——「完成非告警面」既有裁定；跨会话可见靠会话控制条目位标）；**R11 状态行 ⇒ CLI 对齐（2026-09-28）**：段间分隔 ∕ base dim ∕ banner 四色（两新槽 ∕ 三规则）∕ 分隔两边缘面裁定——本档 §1「本批注（R11 状态行 ⇒ CLI 对齐）」· **停滞轻显形（2026-09-29）：新增 `quiet` 段（承载 17 段）**——序 = `elapsed` 之后；本档 §1「本批注（停滞轻显形 · 2026-09-29）」；**桌面状态行 ⇒ CLI 补漏（2026-09-29）**：段 9 上下文 ⇒ CLI 形（含上下文令牌）· 段 11 台账 ⇒ 常驻计数（核 marker）——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」 |
| 审批呈现 | 流内卡片（主）+ 本会话活动池计数 + 会话控制条目位（同一待决项三种视图）；**落形**（批 A）= 卡为流内**独立节点**（根锚 `data-card="approval"` + `data-prompt-id` + `data-shape`，值域 `single` / `batch`；根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]）；**两形键位**：逐项形 `1` / `2` / `3` ⇒ `once` / `always` / `reject`，批形 ⇒ `approveAll` / `deny` / `oneByOne`（表外键 ⇒ **零动作 · 不吞键**——实现 = 纯函数 `verdictOfKey`）；三出口锚 = `data-action="approval:<verdict>"` + `data-key="1\|2\|3"`；**初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）——落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）= 本批落**——帧尾对 `[data-autofocus="1"]` 执行 `focus()`（「对齐第三批 · 小修族」F-置焦）；**核卡直消费（处理流 R1 换接——端差清算批收正）**：卡体（首行 ∕ `.diff-preview` 全量渲染 ∕ 三出口） = 核件 `thincoder-render-core/cards/permission.mjs` 直取（端壳胶水 = 出站桥 ∕ 锚装饰 ∕ 键位胶水 ∕ 置焦锚 + 大 diff 钮处置——`thincoder-desktop/renderer/views/approval.mjs`）；`.view-diff`（核 `diffBig` 时在场）端处置 = 唯单径（`diff.path`）留钮走 `file:open`、`apply_patch` 形 ⇒ 钮退场（零死控）；出口点按 ⇒ 通道 `approval:respond`（载荷见 `docs/desktop/design/IPC.md` §2），**零乐观写**（待决项清除归事件面）；**对齐第三批**：owner 归属（子代理门）/ diff 预览 / 真置焦执行——`docs/desktop/design/CHAT.md` §2（B1 ∥ C1 ∥ F-置焦） |
| 提问呈现 | 流内卡片（`question` 工具）——**决策面**；**不入池三族**（池 = 本会话面 ⇒ 不添跨会话可见性）；**跨会话可见面 = 会话控制条目位**（需求档 §3.1「不静默等待」兑现面）——待作答 ⇒ 该会话位标含 `approval` 码（与审批门**同码同词**——显示词 / 优先级单源 = 本档 §2 项 2）· 出场 ⇒ 清码（**清码判据 = 两族皆清**——本键审批 ∥ 提问皆无项才清；单源 = 本档 §2 项 2）——**码位两面（点名）**：置位面 = **归约面**（`thincoder-desktop/renderer/questions.mjs` `onQuestion`——`ev:question` 写切片同处按**同码闭集**置位，**与 `onApproval` 同形**）· 清位面 = 出口面（`thincoder-desktop/renderer/mount-cards.mjs` 回执 `ok` 真）∥ 事件面（`stopped` 终局摘项同处）；同面缺口（置 / 清键源不同住一档——既有登记）**批 A 收正** = 置 / 清两面同住归约面（置位面 `onQuestion` = `thincoder-desktop/renderer/questions.mjs:18`；清位面 `clearQuestion` = `thincoder-desktop/renderer/questions.mjs:36` ∥ 审批径 `clearApproval` = `thincoder-desktop/renderer/events.mjs:260`；门名单单源 = `thincoder-desktop/src/main/suspensions.mjs:82` `denyGates`）——零新机制；**落形** = 卡根 `data-card="question"` + `data-prompt-id`（待决项身份 / 路由键，与 `ev:question` 同源同值）；子序 = 题干行 → [给答项操作区?] → 作答区；**给答项**（`options` 非空）逐项 = `data-action="question:<i>"`（i = 1 起）+ 词 = 选项串原样（**零构造**）；**自由作答** = 文本控件 + 提交键 `data-action="question:answer"`；取消 = `data-action="question:cancel"`；出口 = `question:respond`（`answer` = 选项串原样 ∥ 输入串 ∥ 取消 ⇒ `null`——挂起表按取消串 `(user cancelled)` 结算，串单源 = `thincoder-desktop/src/main/suspensions.mjs`；回执 `null` ∥ 工具结果串两域界限 = `docs/desktop/design/IPC.md` §2 `question:respond` 行）；**卡退场判据** = 回执 `ok` 真（非乐观写——失败 ⇒ 卡仍在场可重试 + `console.error`）；**中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清码（判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条）；**对齐第三批**：Enter 提交 / 聚焦两态——`docs/desktop/design/CHAT.md` §2（B2 ∥ B3） |
| 计划面 | 流内**独立节点**（`ev:task` 面——工程模式 `task` 工具的事项表）· **落形** = 卡根 `data-card="task"` · 逐行 = 事项标题 + 状态词（`pending` ⇒ 排队中 / `in_progress` ⇒ 运行中 / `done` ⇒ 完成——出词本档 §1 闭枚举）；**同 key 就地替换**（同回合同 key 新载荷整卡替换，不叠卡）；**空列表 ⇒ 卡不在场**（`items` 空 ⇒ 零节点）；通道面 = `docs/desktop/design/IPC.md` §1 `ev:task`；**可见面修复批修**：行两段逐段包元素（`space-between` 生效）→ 本档 §1「本批注（可见面修复 · 四件）」项 4 |
| 目标面板 | 流内卡片（R5 · `goal` 切片——写者 = 归约面 `ev:goal`）；**核件直消费**（`renderGoalPanel`——端壳 = `thincoder-desktop/renderer/views/goal.mjs`：卡根 `div.goal-card[data-card="goal"]` = 端壳装饰，核体 = `DocumentFragment`）；**默认合**（`hidden`——#554②）；开合 = 状态行 🎯 徽标点按 ⇒ 本地开合翻转 + 就地施用活卡（`toggleGoalPanel`——零新通道 ∥ 零 store 切片 ∥ 零重挂）；🎯 徽标 = 状态行**非段位元素**（不入 `STATUS_SEGMENTS`）——在场判据 = 核 `goalPanelVisible` ∧ `status === "active"`（非载体 ∥ 他态 ⇒ 零节点——禁假造）；卡序 = 尾位（待审批 → 提问 → 计划 → 目标——单源 = `thincoder-desktop/renderer/mount-cards.mjs` `CARD_ORDER`）；**开合态 = 视图档模块级单值**（构树重挂换节点不丢态——不随会话键 ∥ 不入 store——在册口径） |
| 工具卡 | 名称 + 参数摘要 + 状态（**词 = 状态词闭枚举**；锚 = `data-status`）+ **耗时**（`ev:tool-result` 载荷——`docs/desktop/design/IPC.md` §1；仅完成 / 错误态且数在时落）+ 可展开结果（**折叠默认态**：错误展开、其余折叠；显式 `expanded` 优先；无结果 ⇒ 头为纯展示行零控件）+ **改动摘要**（文件 + 增删行数，纯文本，不做 diff）；**大 patch 降级** = 超阈（**> 200 行 或 > 10 文件**）只给摘要 + 增删计数，**不启用外部查看器**（文件视图 / 编辑器本体 / 内置 diff 在本版边界外——`docs/desktop/design/PROJECT.md` §8）；**可见面修复批修**：头行文本段逐段包元素 → 本档 §1「本批注（可见面修复 · 四件）」项 4；**对齐第三批**：结果摘要行 / 失败判据红绿 / 运行期实时输出 / 中止清扫 / advisor 轮次标签——`docs/desktop/design/CHAT.md` §2「A. 对话流面」项 1 / 2 / 3 / 5 / 14；**轻通道轮二（2026-09-30）**：盒底 = **透明** ∥ hover 反馈 = 头行既有面（用户「不要背景了，只要hover上去有反应就行了」；台账 #722）；**轻通道轮四（2026-10-01）**：工具头前导箭头（`▸` ∥ `▼` 两态）∥ 展开体左流线——`docs/desktop/design/CHAT.md` §2「本批注（流内竖向间距 · 2026-09-30）」项 7 |
| 空态 | 无会话 ⇒ 会话控制面新建钮 + **中区引导（三码分态 · `data-guide` 闭集）** = 无项目 ⇒ `no-project` · 有项目无会话 ⇒ `no-session` · 有会话零块 ⇒ `no-message`（该码 = 既有空态节点，文本 `chat.empty.hint` 不变）；无 provider ⇒ 引导向导；形 / 锚 / 动作 / 词 = 本档 §1「批 B 追加注」项 1 / 项 2 / 项 4；**对齐第三批**：`no-message` 帧欢迎条（抬头 / 文案 / 快捷键行）——`docs/desktop/design/CHAT.md` §2「A. 对话流面」项 15 |
| 启动态 | **→ 迁 `docs/desktop/design/SETTINGS.md` §2.6**（as-of 2026-10-02）。 |
| 会话控制面（VSC 形 · 会话模型轮 R13） | **→ 迁 `docs/desktop/design/SESSIONS.md` §2.1**（as-of 2026-10-02）。 |
| 设置面 | **→ 迁 `docs/desktop/design/SETTINGS.md` §2.1**（as-of 2026-10-02）。 |
| 首启向导 | **→ 迁 `docs/desktop/design/SETTINGS.md` §2.6**（as-of 2026-10-02）。 |
| 主题 | **三态（跟随系统 ∥ 亮色 ∥ 暗色 · D33）**：状态载体 = `data-theme`（闭集 `system` ∥ `light` ∥ `dark`——缺省 `system`；单写者 = `thincoder-desktop/renderer/theme.mjs`）· 值面 = `thincoder-desktop/renderer/theme.css` 单块 `light-dark()` 值对 · 持久化 = `localStorage`；切换控件 = 设置面头三态钮族；**形态 ∥ 载体 ∥ 边界单源 = 本档 §1「本批注（主题切换 · D33 · 2026-09-30）」**；**外壳降噪（D24）**：滚动条皮肤（全局 · 零新变量）——本档 §1「本批注（外壳视觉降噪 · D24）」项 4；**排版统一（D29 · 2026-09-30）**：基线四值（字族 ∥ 字号 ∥ 行高 ∥ 字距）单源住 `theme.css`——本档 §1「本批注（排版统一 · D29 · 2026-09-30）」 |
| 键盘可达 | 审批卡三出口可键盘触发（**两形键位**见「审批呈现」行：逐项形 1 / 2 / 3 = once / always / reject，批形 = approveAll / deny / oneByOne）；初始焦点**目标** = **最安全键**（逐项「拒绝」/ 批「全否」——落形 = 标记锚 `data-autofocus="1"`（恰一）；**置焦执行 = 本批落**——帧尾对锚执行 `focus()`：「对齐第三批 · 小修族」F-置焦）；焦点环与 Tab 序显式定义（会话控制条目控件自然序） |
| i18n | 承产品定性（英文默认面，含 zh）；词表与核 i18n 面同源——**供给面 = `config:read` 语言面下发**（`{ locale, dict }`，核 `projectDictionary` 投影；本端不另立词表源——通道面 = `docs/desktop/design/IPC.md` §2） |
| open | **附件条样式**（缩略图 / 移除键尺寸规则未落——现盘零 CSS 规则；见「批 B 注」项 2；处置 = 随附件面族批——出处重核表 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §2）· **池面窄窗态**（右列 36rem 后窗口 < ~1100px 中列受挤——第二断点 ∥ 池面窄态未定；本档 §1「本批注（对齐第二批 · 六件）」项 6；**拖动侧上限已定形**——用户值 ≤ `max(36rem, 100vw - 30rem)`：`docs/desktop/design/ACTIVITY.md` §2「本批注（右栏宽度拖动 · D30 · 2026-09-30）」；**未拖过态挤压仍 open**——默认 36rem 零变） |

**长会话渲染窗口 · 回填与跟滚**两行属实现工艺面 ⇒ 住 `docs/desktop/design/RENDERER.md` §2 / §3（本档不保留其正文）。

**批 B 注（⑤–⑧ 四件 · 形 / 锚 / 候选面 · 2026-09-27）**：本档 §1「对话流」/「输入区」/「状态栏」/「设置面」四行标注「（批 B 落）」的项，落形逐条如下——本注只述端侧形态与锚；语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2**（「会话级偏好注」/「附件注」），不在此重述。

1. **三值（provider / 模型 / 推理档位）就地可改**——居所 = 本档 §1「输入区」行控件行（模型钮（两级：渠道 → 模型）∕ 推理钮——2026-09-29 会话头面退场后为唯一居所）；写盘 / 施加两面分属核（`applySession` 唯一施加面）——语义、载荷与回执**单源 = `docs/desktop/design/IPC.md` §2「会话级偏好注」**。
2. **输入区附件条**——形 = 输入区上方条（根锚 `data-attachments`，住 `[data-slot="composer"]` 内）；逐项 = 缩略图（`dataURL`）+ 文件名 + 移除控件 `data-action="attach:remove"`（携 `data-attachment-id`）；**空 ⇒ 零节点**（禁假造）。
   采集 = 输入区 `paste` 事件取剪贴板图像（渲染面零 fs ⇒ `FileReader` 转 `dataURL`）；暂存 = 输入区内存态（与文本**同一出口**）；构树与采集为纯函数（可平 node 直测）。
   出口 = 随 `msg:send` 载荷 `images`（**dataURL 串数组**——严格串形，A1 收正）；**清条 / 保留判据与文本同判据**（`ok` 真 ⇒ 清条；`ok` 假 ∥ 抛 ⇒ 文本与附件条皆保留 + `console.error`）。
   降级面 = 回执携 `degraded` ⇒ 提示行明示（**不静默丢图**）：`"non-vision"` = 降级未成（降级失败 ∥ 落盘 0 件）、图未随发、用户消息文本尾已附说明行（词键 `composer.attach.nonvision`）· `"partial"` = 超限 / 落盘失败项被弃、其余照发（降级成功 ∧ 有弃项 ⇒ 注文 + 本码；词键 `composer.attach.partial`）；降级成功且零弃 ⇒ 回执零码、消息文本携描述注文（`[图片 … 描述: …]`）。
   端侧**前置门** = 核 spec `multimodal` 判据；上限数值与弃项判据**单源 = IPC「附件注」**（本档不重述）。
3. **状态栏读数**——形 = 状态栏内读数节点 `data-usage`（值 = `ev:usage` 的 `ctxPct`（百分）∥ `ctxTokens`（令牌）⇒ 读数串 = CLI 形——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」）；**未至 / 非正数 ⇒ 零读数节点**（禁假造）；**> 100 照显**（读数门 = 数字 ∧ > 0——**无上界夹值**）；≥ 80% ⇒ 警示色（class 切换 · 阈值数值单源 = 本档「状态栏」行）。
   归约 = 按会话 `key` 写切片（**归约面为唯一写者**——状态行单点重建，视图面不复算）；切标签 ⇒ 取活动键值随动。
4. **复制面**——复制出口 = **核件代码块 Copy 钮**（`attachCopyButtons`——`pre.code-block` 内 `.code-copy-btn`；词键 `msg.copy` / `msg.copied` = 端供给面，值同 VSC）；桌面挂点 = `thincoder-desktop/renderer/views/chat.mjs` `attachCodeCopies`（重挂 / 帧尾两调用点——**零动**）；
  核件钮写径前提 = `app://` 注册为 secure ⇒ 安全上下文成立（单源 = `docs/desktop/design/PROJECT.md` §2 KD-2）；自建两枚 ⧉ 控件退场（2026-09-29 裁定 = 对齐 VSC；摘除物全清单与判据 = `docs/desktop/design/CHAT.md` §2「本批注（复制面对齐 VSC · 2026-09-29）」项 2）。
**批 B 追加注（首启空白态引导 · 四项 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「空态」/「启动态」四行的**首启空白态面**（各行已就地指针）。缺口 = 新装首启（空家 · 无项目）⇒ 对话流 `none` 态无引导节点（零块节点）+ 输入区禁用 ⇒ 界面零引导，真机走查判「完全没法输入」。本注只述端侧形态与锚；语义与通道**单源** = `docs/desktop/design/IPC.md`（本批零新通道 · 零新 IPC）。

1. **引导面（`none` 态）** = 落点 = **对话流挂载根** `[data-slot="flow"]` 自身（无活动会话 ⇒ 根锚 `data-state="none"`）· 节点 = `div.chat-empty[data-guide]`，**流内非块节点**（零 `data-block-id` ⇒ 不入块序 · 块序插入点判据与 `data-blocks` 不变式不受其影响）；`empty` 态 = 首子 · `none` 态 = 根唯一子 · `flow` 态 = 不在场。
   `data-guide` 值域 = **闭集三码**：`no-project`（`cwd` 缺）· `no-session`（有 `cwd` · 无活动会话）· `no-message`（有活动会话 · 零块——即既有空态节点）。判据（纯函数 · 单源）= 对话流模型 `guide` 字段：无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
   承档 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落——流内非块节点构树：纯构树 · 零 `store.mjs` import）；`thincoder-desktop/renderer/views/chat.mjs` 只出判据 + 引调（空态节点构树移出 ⇒ 本档不越 300）。
2. **引导面动作控件** = 就地入口（免「去会话控制面找」）——子序 = 文案 → [控件?]；`no-project` ⇒ `button[data-action="project:open"]` 词 = `rail.action.openDir`（既有键）· `no-session` ⇒ `button[data-action="session:create"]` 词 = `rail.action.newSession`（既有键）· `no-message` ⇒ 零控件。
   **在场判据 = 句柄在场**（未给 `onOpenDir` / `onNewSession` ⇒ **整控件缺席**、退纯文案——比接线形通则更严：零假按钮）；接线 = 对话流 handlers 两枚（与会话控制面项目钮 ∕ 新建钮**同出口** = `project:open` / `session:create` 各单一实现，本面不另写一路）；
  连带 = 对话流帧触发键集须含 `project`（项目变更 ⇒ 中区随动——`project` 键承接 = 刷面（`syncGuide` 原位换），零重挂；单源 = `docs/desktop/design/RENDERER.md` §1.1「建」条；键名单单源 = `thincoder-desktop/renderer/frame-dispatch.mjs` `CHAT_KEYS`）。
   匹配面提醒：同一 `data-action` **可多处在场**（会话控制面项目钮 + 引导面动作控件）⇒ 用例 / 选择器须按集合或过滤取值，不得唯一查找。
3. **输入区禁用判据不因引导而变**——`disabled` 判据恒 = **活动会话在场**（无 ⇒ `disabled: true` · 锚恒在）；`no-project` / `no-session` 引导面在场**不解除**禁用。依据 = 需求档首启链（选工作目录 ⇒ 可用 = `docs/desktop/requirements/PROJECT.md` §3.3）；本面作用 = 把「为何不能输入」与「下一步点哪」显式化，**不代行建会话**（建会话仍须经 `session:create` 出口）。
4. **词键（两语各两键 · 共 2 键）** = `chat.guide.noProject` / `chat.guide.noSession`（住 `thincoder-desktop/renderer/i18n.mjs` 对话流段 = `chat.empty.hint` 邻位）。
   文本形（zh）=「未打开工作目录——先打开一个目录即可开始」/「尚无会话——新建一个会话即可开始对话」；（en）=「No working directory open — open a folder to start」/「No session yet — create one to start chatting」。
   计数随动（同笔）：总键数 **122 ⇒ 124**（两语相等不变）· 对话流桶 **8 ⇒ 10**——单词表四处同笔为纪律（测试树 2026-09-28 全清重置后承载 = 随批单元证据）。

**本批注（可见面修复 · 四件 · 2026-09-27）**：本注补本档 §1「对话流」/「输入区」/「工具卡」/「计划面」四行与 §2 项 1 行标注「可见面修复批修」的项（各行已就地指针）。
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
| 11 | 台账标记 | 承载 | 源 = 核状态位（`state.ledger = { marker, warn }`——`thincoder-core/ledger-surface.mjs:54`）经 `ev:ledger` `marker` 键转发 ⇒ 归约切片 `ledgerMarker`（120s 拍 + 首拍即到）；**常驻** = 核 `formatMarker` 逐字 `台账 N·M`（= **当前打开范围合计**——范围判据单源 = `docs/core/design/LEDGER.md` §7.2）+ `warn` 位（范围内老化 > 0 ∨ 死执行者 > 0——端零重算）警示色；tooltip 明细面保留（载波 = `ev:ledger` `detailLines`〔归约切片 `ledgerDetail`〕）；「可开批」段形退场——信息保留于 tooltip（核 `formatDetailLine` 逐字携「 — 可开批」）——本档 §1「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」 |
| 12 | 计时（⏰N） | 承载 | 源 = 核 `_pendingTimers`（`thincoder-core/agent.mjs:73`——三拆后档面收窄）⇒ `ev:usage` 载荷 `timers`（**已落（R3a）**——`thincoder-desktop/src/main/agent-host.mjs:148`；刷新点 = 回合尾——新鲜度窗登记 = `docs/render-core/design/RENDER-CORE.md` §10 F 行）；触发落流 = `ev:timer`（timer-wake 阶段 2——`docs/desktop/design/IPC.md` §1） |
| 13 | 会话标题 | 承载 | 源 = 活动会话标题（与会话控制面下拉条目同源——号出 `sessions:list` 行） |
| 14 | 输入提示段（Enter: send / Enter 排队 / 已排队 N 条） | 承载 | **形态零改 · 判据四路 · 源并两源（挂起窗径批；判据扩路 = 重建保真 ∕ 留端清算族批 ∕ #581）**——**判据四路**：队 ≥ 1 ⇒ 条数句；忙（位标 `running`）⇒ Enter 排队句；**挂起窗在场（`suspActiveOf`）∧ 非忙 ⇒ Enter 排队句**（窗内 Enter = 入队——本批收正：现制该角落出 send 句）；静（非忙 ∧ 无窗 ∧ 队空）⇒ `Enter: send`（词键 `status.enter.send`——对位 CLI enterHint 静息值，本注项 4）；源 = **本会话待发送件快照镜面**（`pending[<会话键>]`——写者 = `ev:queue` 归约，权威 = 宿主（**两源：忙态队 ∪ 挂起窗输入队**）；「回合中插入」批收正：原「渲染面本地队」改镜面——分键既往；挂起窗径批并源） |
| 15 | 键位组（`/:` 命令 · wheel/PgUp/PgDn · Ctrl+I · Ctrl+C） | 不适用 | **逐件重审（本注项 4）**：`/:` = 状态行键位提示面——**命令面已在册**（§1「本批注（slash 命令面 · 2026-10-01）」）；**提示不入段**（可发现性入口 = `/help` 命令面——2026-10-01 增量已落；状态行键位提示仍不入段）；wheel/PgUp/PgDn = 原生滚动条 + 滚轮自述（无键位提示面）；Ctrl+I = 本端无 inject 功能（如需 = 新需求）；Ctrl+C = 退出住窗口级（本端该键属复制——同键异义，不照搬） |

计数（D3 · 2026-09-28 重审后）：**承载 17 段**（1 的四态 = 4 段；2–9 · 11–14 = 12 段；`quiet` = 1 段——§1「本批注（停滞轻显形 · 2026-09-29）」）· **旁置 1 段**（10）· **不适用 1 行**（15 行内四件）；承载四项（耗时 / 令牌 / 计时 / 回合 N/M）**已落（R3a）**——读数槽四（`turnStarts` / `tokens` / `timers` / `turns`）住 `thincoder-desktop/renderer/events.mjs`；
  载荷面 = `ev:usage` 两键扩 + `ev:activity` `turn`（单源 = `docs/desktop/design/IPC.md` §1）；段闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`（17 码）。

2. **右列 = 子 agent 面板（D20）**——语义重定位：活动块族 = **子 agent 实例**（射程五类 = sync spawn / async 池 / consult / escalate / advisor-async——VSC 对位 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`）；**工具调用行摘除**（工具调用面 = 对话流工具卡，VSC 同义）。
   块形 = 头（role · model · 用时 · 回合 N/M）+ 状态词（出本档闭枚举）+ 停止钮（`data-action="subagent:stop"`）；**内容回显**：块面 = 核件同款（头行 + 状态词 + **内容 tail-3 + 展开**——`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` 直消费；单源 = 本档 §1「本批注（对齐第二批 · 六件）」项 3）。
   态机 = **出生**（`started` / `queued`）→ **终态折叠**（`done` / `settled` / `cancelled` ⇒ 就地收敛为终态词 + 用时；`⟦ev⟧stopped` ⇒ `cancelled`（先例兼容）· `error` 不在 relay 谱——闭集与 token 全表 = `docs/render-core/design/RENDER-CORE.md` §5）
   → **归档 = 入流**（普通终态即时归档 ∥ `settled` ⇒ 等待消化后归档 ∥ 旧代接管即归档——归档块随到达入流（当刻流末——行族在流末时即「放族后」；迟到 ⇒ 随到入流）；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条 ∥ 本档 §1「本批注（对齐第二批 · 六件）」项 5）。
   **数据链 = 宿主 relay 分流 + 存活投影 2s 再断言**（出生自愈——只发在飞实例：丢首发出生 ⇒ 一拍（2s）内块复现 · 终态出表 ⇒ 零再断言不复活；会话关闭 / 删除 / 宿主退出 ⇒ 该键投影清——旧会话块不随拍重投，沿 `thincoder-vscode/src/extension/panel-session.mjs:123-126` 清点语义）。
   族序与折叠（待审批 → 子 agent → 队列 · 折叠头两读数）沿 §2 项 1 存量口径；通道面 = `docs/desktop/design/IPC.md` §1 `ev:subagent` / §2 `subagent:stop`。

3. **会话流经共享渲染核（D19 · 含改判）**——文本面经核 Markdown 呈现（**「零 Markdown」口径改判**：理由 = 用户走查第 3 点 + D19；被否 = 保留纯文本 / 自写第二份 md / 助手块单侧渲染——裁决 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-4**）。
   真代码块（围栏切分 / 语法高亮 / 代码块复制）随核落（原「另裁」登记 = `docs/desktop/design/PROJECT.md` §10 Y，本批已裁）；**推理块** = 新接线（核回调 `onReasoning` + 活流推理块——块型 `reasoning` 已在**页读域（六型全员——留档批 · #719）**内；壳 = 核件结构同形）；**文件链接承载**（「对齐第三批」D19 收正——宿主验存链 + 核包裹 + `file:open`；单源 = `docs/desktop/design/PROJECT.md` §2 **KD-39**）；
   块容器 / 工具卡 / 卡族（审批 / 提问 / 计划）**桌面外壳留存**（三锚 / 滚动 · 回填 · 裁剪 / 卡壳四段头 · 耗时 · 改动摘要不动）——「会话流经核」= **渲染逻辑单源**（核件分件消费：`md` / `attachCopyButtons` / `renderReasoning`〔结构同形〕/ `capText`），否「整件替换核 DOM」（逐机制对位表 22 行 = 核档 §4）。

4. **会话面板元数据族（D18 · 对齐 VSC 会话栏）**：→ 迁 `docs/desktop/design/SESSIONS.md` §2.2（as-of 2026-10-02）。
**本批注（D21 · 会话流 / 会话面板视觉对齐 · 两项 · 2026-09-28）**：本注补本档 §1「对话流」/「会话控制面」两行的**视觉对齐**（用户 2026-09-28 04:42 桌面走查：①「样式与 VSC 区别很大」②「桌面端的会话面板与 vsc 端完全不同，我之前要求过对齐的」⇒ 裁定向 VSC 靠拢；批档 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` · 需求卷 **D21**）。
**结构零动**——会话控制面（R13 换装后）行族 / 行内换形 / 元数据族 / 行控件皆沿在册（需求 D18「本端结构差异不削」）；本注只述视觉值面与边界，**值表分处单源**（内容面 = 核档 §5；会话面板面 = 下项 2）。

1. **内容面视觉（核产出件）**——落点 = `thincoder-desktop/renderer/core.css`（核类名 → 桌面值）+ 值变量 = 主题表 `thincoder-desktop/renderer/theme.css`；**逐面映射表 21 面 / 内容面新增变量 12 个 / 端差 2 项 = `docs/render-core/design/RENDER-CORE.md` §5 / §9**（本档不重述值面）。
   边界：**外壳零动**——块壳 / 卡族 / 标签条 / 池 / 输入区 / 状态行（`thincoder-desktop/renderer/chat.css` · 同档 `chrome.css` 外壳段 · `thincoder-desktop/renderer/pool.css` · `thincoder-desktop/renderer/settings.css`）零规则改动；推理块**壳层**（边框 / 底色 / 圆角 / 斜体 muted）沿 `.block-reasoning`；VSC 侧 `thincoder-vscode/webview/**` 零改（值源）。
   验收 = 逐面真机比对（走查面 = T-DSK21）+ 值面机检两处（值落点锁 ∕ 真 Electron computed style 读数——测试树 2026-09-28 全清重置后承载 = 随批单元证据；真机面 = 人工走查 + 父侧真跑闭合）。
2. **会话面板视觉（桌面会话控制面 ∕ 下拉列表 · 端壳面）**：→ 迁 `docs/desktop/design/SESSIONS.md` §2.3（9 面表 ∥ 排版统一收正指针 ∥ 计数；as-of 2026-10-02）。

**会话面板七条对位处置（2026-09-29 重审 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）**：→ 迁 `docs/desktop/design/SESSIONS.md` §2.4（七条逐条；as-of 2026-10-02）。

**本批注（D17 / D19 · 残余补齐 · 两项 · 2026-09-28）**：本注补本档 §1「状态栏」/「对话流」两行的**恢复态播种**与**用户块 md 深度**（两行已就地指针）。来源 = 需求卷 D17 / D19 补句（`docs/desktop/requirements/PROJECT.md:146` / `:148`）；批档 = `docs/batches/2026-09-28-desktop-residuals.md`。
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

**本批注（状态栏对齐 · 屏面为准 · 2026-09-28）**：本注补本档 §1「状态栏」行的**屏面为准重审定形**（该行已就地指针；批档 = `docs/batches/2026-09-28-statusline-align.md` · 台账 #483 · 需求卷 **D22**）。
标尺 = **屏面**（用户 2026-09-28 05:38 裁定：「对齐」以屏面可见行为准；「旁置 / 不适用 / 缺入站面」等账面打折项逐项重审，不得静默打折）——四项重审逐项给裁定 + 判据句；状态行段表（上注项 1）已就地收正为 **17 段**。

1. **打开态段集 = 17 段**（闭集 = `thincoder-desktop/renderer/views/statusline.mjs` `STATUS_SEGMENTS`）：段序 = CLI 段序——判据句 = 实读 `thincoder-cli/src/tui/render-frame.mjs`：注意力 chip 行首（`:240-243`）→ banner 四态（`:233-236`，PLAN → AUTO → ADVISOR → ENG）→ 状态段簇（`:391-446`——`buildStatusLine` 段族，尾段 = 键位组）。
   状态段簇内序 = 状态词 → 工具 → 耗时 → 任务 → 回合 → 令牌 → 上下文 → [滚动位] → 台账 → 计时 → 标题 → 输入提示。
   `STATUS_SEGMENTS` 序 = 本序（滚动位 / 键位组除外）；**17 段表**的表列序 = 逐项裁定序（表枚举面——与段序分属两面；同注项 1 表头）。
   打开态（静息 · 有活动会话）可亮 = `plan` / `auto` / `advisor` / `eng`（真态时）+ `state`（就绪）+ `tasks` + `context` + `ledger`（常驻）+ `title` + `enter`——与 CLI 打开态逐段对位（差表 = 批档 §2）；段锚 = `data-seg`（值域 = 闭集 17 码）；banner 四段词 = 代号字面（两语同形；词键 `status.banner.*`）。
2. **重审② banner（裁定 = 四态上状态行行首）**——实读钉定：两态随会话槽恢复可在本端为真（`thincoder-core/session-lifecycle.mjs:115` `planMode` / `:124-127` `engineering` / `:132-134` `advisor`）；
   四态判定 = **活值优先口径**（agent 在场 ⇒ 活值直读；不在场 ⇒ 槽字段投影——单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 3；与 CLI banner 判定同源 = `thincoder-cli/src/tui/render-frame.mjs:233-236`〔2026-09-29 停滞批增行后重锚〕）：
  `planMode` ∨ `autoApprove` ∨ `advisor.guard === true` ∨ `agent.engineering === true`——真 ⇒ 该段在场 · 假 / 缺 ⇒ 零节点（负向锁）。
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

**本批注（账本警示面 · 2026-09-28）**：→ 迁 `docs/desktop/design/SESSIONS.md` §2.5（界面形态与交互——5 项；as-of 2026-10-02）。

**本批注（外壳视觉降噪 · D24 · 2026-09-28）**：本注补本档 §1 五行（标签条 / 会话头 / 输入区 / 设置面 / 主题）的**外壳视觉语言**（五行已就地指针）；来源 = 用户 2026-09-28 06:30 走查「桌面端页面上线条框框太多，显得非常杂乱」→ 06:36 裁定「先只做外壳」（内容面守 D21 值源不动）→ 06:43 选定 ② 整壳降噪（对照 mock「02 整壳」帧）；需求卷 **D24**；批档 = `docs/batches/2026-09-28-desktop-shell-denoise.md`；台账 #493。
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
   - 结构框归零 + 升底：`.settings-form`（`:173-180`）⇒ 边框 transparent + `background: var(--bg-raised)`（面板底 = `--bg` ⇒ 表单浮起——同主壳「卡在底上」语）；`.settings-notice` / `.wizard-notice`（`:105-117`）⇒ 边框 transparent（警示语义已由 `--accent` 字色承载）。
   - 卡界（`.settings-row` · `:141-157`）⇒ 1px 描边 + 圆角 6px（**VSC 实形**——用户 2026-10-02 10:27 裁定；单源 = `docs/desktop/design/SETTINGS.md` §2.5「本批注（设置面样式收正 · D37 · 2026-10-02）」项 1 ③）。
   - 活动 / 当前行：`.settings-row[data-active]` / `[data-current]` ⇒ **accent 描边改底色态**（同 R5 语）：`background: color-mix(in srgb, var(--accent) 14%, var(--bg))`（不透明混同；**基色随行域静息底**——卡底让位后 = `--bg`）。
   - 控件族 **8**：**次级 6**（`.settings-lang` / `.settings-close` / `.settings-submit` / `.wizard-dismiss` / `.wizard-submit` / **`.settings-theme-opt`**〔主题切换批 · D33——同族带上〕 · `:60-81`）⇒ 描边归零 + 四值族；**强调 2 保留**（`.wizard-next` / `.wizard-finish` · `:82-86`——accent 框 = 主推进键语义强调，沿「强调框保留」律）。
   - **保留**：`.settings-field`（`:191-206` 输入控件）细边零动（D24 边界原文）；`.settings-mark`（`:159-165` accent 强调标）零动。

6. **保留面 + 本批不动（零动清单 · 逐条给由）**
   - 保留（D24 原文）：输入框细边（核件面板输入行 `#input-row` / `.question-input` / `.settings-field`）· 审批 / 提问 / 计划卡语义强调框（`thincoder-desktop/renderer/chat-cards.css`）。
   - 本批不动：卡片内控件族（`.approval-action` / `.question-option` / `.question-submit` / `.question-cancel`——住保留卡族内 · 不在 R 集）· D21 会话行面九面
     · 内容面全域（`thincoder-desktop/renderer/core.css` **零改**）。

7. **验收（D24 判据三件 → 用例面）**
   - **静息描边机检锁**（值落点锁——测试树 2026-09-28 全清重置后承载 = 随批单元证据）：描边归零族随本注现值（容器 3 · 骨架线（输入区上线——显形保留）· 控件族 3 选择器 · 池条目 1）+ 四值族 + 滚动条四规则 + 设置面映射 + **保留面负向锁** + 零新变量（主题变量块 = 单块 `light-dark()` 值对——变量计数不变〔主题切换批 · D33 收正〕）。
     负向锁**两值列**（仍 1px 描边 · 未被归零）：**accent 值列** = `.permission-prompt` / `.question-card`；**`--line` 值列** = 核件面板输入行 `#input-row` / `.plan-card` / `.settings-row`（设置面行族卡界——D37 收正例外，1px `--line` 在位）。
   - **真机 hover · 聚焦读数**（真机面 = 人工走查 + 父侧真跑闭合；D16 义务）——静息四边 `rgba(0, 0, 0, 0)`（**设置面行族卡界例外**——D37 收正：1px `--line` 在位 ∥ 底填充让位；单源 = `docs/desktop/design/SETTINGS.md` §2.5「本批注（设置面样式收正 · D37 · 2026-10-02）」项 1 ③）∧ 边宽仍 1px（保位）∥ hover 面 bg 非透明 ∧ 边框仍透明
     ∥ 键盘 Tab 命中 ⇒ `:focus-visible` 真 + outline 2px ∥ 滚动条占宽（**前提 = 夹具使 `[data-slot="flow"]` 溢出** · 两支形）：有滚动条 ⇒ `offsetWidth − clientWidth` = 10 ∥ 无滚动条 ⇒ 该支不适用（不自判红） ∥ 核件面板输入行 `#input-row` 边框非透明（保留面）。
   - **改前 / 改后对照**：改前 = 批档 §1.3 的「00 改前」帧（同夹具 / 同机位 / 同滚位 · as-of 2026-09-28）∥ 改后 = 实施后同夹具实拍 ⇒ 父侧 / 用户走查（探针 = 批档 §1.3 所列一次性物 · 非批产物——值面已在册 ⇒ 临时面清不阻塞）。
   - **零回归**：内容面零改 ⇒ 核 / CLI / VSC 面零波及（测试树 2026-09-28 全清重置后 = 随批单元证据 ∕ 真机面）。

8. **计数（D3）**：容器 **3** · 骨架线 **1 处**（输入区上线——显形保留） · 控件族 **3 选择器** · 池条目 **1** · 滚动条 **4 规则** · 设置面 **9 面**（6 改 + 3 保留）· 交互态 **4 值** · 保留面 **5**（= 输入框细边三具名 `#input-row` ∕ `.question-input` ∕ `.settings-field` + 卡语义强调框 + 卡片内控件族；「本批不动」其余两项不入计）· 新增变量 **0**。

9. **open / 上抛（本批不改 · 消解路在册）**：设置面形（用户未见 mock——若剔除该面 ⇒ 本注项 5 整段回撤，主壳零波及）。

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
     消费（步边界注入 ∕ 回合尾送达两时刻）⇒ 带项退场 ∧ 同帧由流内用户块承接（**消费恰一枚**——零重复入流）——队列归属 ∕ 消费时序 = `docs/desktop/design/COMPOSER.md` §2「本批注（回合中插入 · 步边界 pickup）」（该批收正：队列权威由渲染面本地改**宿主单源**）。
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
   - 边界：队列 = 宿主**运行期内存**（重启即失——既有）；附件边界（条目携图 · 步边界让位 · 送达面判决）= `docs/desktop/design/COMPOSER.md` §2「本批注（回合中插入 · 步边界 pickup）」项 3；`⏳` 文案 = 核键 `queued.pending` 值（**两语逐字同 VSC**）；失败径（`ok` 假 / 抛）⇒ 文本 + 附件保留 + 气泡不出现（受理判据 = 回执）；非活动键交接 ⇒ 用户块随下次页读在场（沿 #458 键门既有口径）。

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
     **R10 消差落定（端差清算批）**：判据 = **挂载根级旗标**（`root._subDescShown`——置位不重置 ∕ 重建恒在）——与 VSC **面板级**同判（`thincoder-vscode/webview/state.js:42`）；
  **归档回显不带该行**（`.sub-desc` 与 `.advisor-content` 互为兄弟 ⇒ 不入 tail-3 射程——单源 = `docs/vsc/design/WEBVIEW-INPUT.md`）；宿主侧剥前缀（渲染面零析 `role#id/`）不变；consult ∕ escalate 族停钮 = **补做**（批 `docs/batches/2026-09-29-hatch-clearance-2.md`——核 `CANCELABLE_ROLES`；核档 §9 端差③ 收正）。
     **#518 跟滚收口** = `docs/desktop/design/ACTIVITY.md` §2「本批注（子 agent 块内容区跟滚 · #518 收口）」（块内容区跟滚 + 区帧钉底 + 值面两条）。

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
   - 机制：子 agent 终态 = **折叠 + 归档入流**（VSC 同径——核 `subblocks/state.mjs` 三迁：普通终态**即时归档** ∥ `settled` **等待消化**（`awaitingDigest`）后由后到 `done` 归档 ∥ 旧代接管即归档）。
   - 落形：归档 ⇒ ① 池内块退场（DOM 摘除）② **流内归档新增块**（块型 `subagent`——`data-block-kind="subagent"`；壳 = 零边距透传容器 `.block-subagent`，内嵌**核件元素**（冻结形 `[✓ … done Ns]` + tail-3 留场 + 可展开内容）；
     块序 = 消费轮**族后**（归档块居其消费轮行族**之后**——本批 2026-10-01 翻转；**#765 座次机拆除 + 锚整删（F2 零存储）**；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条））③ 表项留存为**墓碑**（`region: "flow"`——迟来事件按 `drop-frozen` 消化：不复活 / 不重复补桩）；表项 `rows` 随归档交给流内快照（**内容单留存处**）。
   - **归档块落位 = 消费轮族后（随到达入流）**（**零存储**——无边界标 ∥ 无边界行取面 ∥ 无挂载算术；行族在流末时即「放族后」——起跑窗为常型；迟到 ⇒ 随到入流——单源 = `docs/desktop/design/RENDERER.md` §1.1「消化行入流与重放规则」条；裁定 = `docs/desktop/design/PROJECT.md` §2 **KD-33** ∥ **KD-62**——本批 2026-10-01 翻转 ∥ **#765 锚整删（F2 零存储）**（座次机拆除——2026-10-01））；
  `clearAwaiting` 由核件清标志后刷新（端侧照模型态派生——核 effects 表**不逐条执行**，端面动作由模型态幂等派生；登记理由 = 桌面无 DOM 区概念，`connectedOf` / `regionOf` 由模型字段供给）。
   - 落点：`thincoder-desktop/renderer/events.mjs`（`region` 写 + 流内块快照追加；`archiveFrozen` 删）· `thincoder-desktop/renderer/views/chat.mjs` + **`thincoder-desktop/renderer/views/chat-subagent.mjs`**（已落 · 实读 **75**（2026-09-29）· 归档块构树）·
     `thincoder-desktop/renderer/views/activity.mjs`（表项 `region` 过滤）· `thincoder-desktop/renderer/chat.css`（`.block-subagent` 透传壳）。
   - 判据：**机检** = 归约用例（终态 ⇒ 表项 `region:"flow"` ∧ `blocks` 尾块 `kind:"subagent"`；`settled` ⇒ 等待消化（池内）不归档；后到 `done` ⇒ 归档；**下回合起不清出**——对拍旧口径）+ 视图用例（流内冻结形在场 · 右列退场）；
     **真机** = 子 agent 跑完 ⇒ 流内留 `[✓ …]` 块（右列退场）。
   - 边界：归档块 = **留档块**（留档批 · #719——块体入人读线记录 ∥ 页读重建：刷新 ∥ 重载 ∥ 切走切回均在；页读域第六型）；窗限 / 裁剪随既有窗口机制（`MAX_RENDER_BLOCKS`；**留档块记账** = 计 `data-hidden` ∥ 退窗折摘要块 ∥ 可回填——判据单源 = `docs/desktop/design/RENDERER.md` §2 留档块记账条）；冻结块**不再刷新**（静态）。
6. **右列加宽一倍（#500）**——用户 07:06「右边栏太窄了，要放宽一倍，才够比较好的显示子agent的活动」：`--pool-w: 18rem ⇒ 36rem`（`thincoder-desktop/renderer/theme.css:19` **单源**；`:86` 主栅格与 `:339-342` 窄断点行**同变量引用** ⇒ 自动随动，零第二处数值）。
   判据：**机检** = 值落点锁（随批单元证据：变量值 = `36rem` ∧ 两处引用皆 `var(--pool-w)`）+ **真机读数**（右列实测宽 ≈ 576px；< 900px 断点态同值）+ 改前 / 改后同机位对照帧。
   边界：**窄窗效应登记**（窗口 < ~1100px 时中列受挤——断点面随 R13 消解（零断点——本档「断点」行）；池面窄态 / 第二断点 = **另裁**，不入本批）；池内布局 / 族序零动。

**计数（本批 · D3）**：六件 = **A1 推理钉底** · **A2 排队非流内 + 队列分键** · **A3 子 agent 核件同款** · **A4 说话人标识** · **A5 折叠 + 归档入流** · **A6 右列 ×2**；受触碰形态行 = 四行（对话流 / 输入区 / 状态栏 / §2 项 1）+ 布局 / 断点连带（项 6）；
新档 **2**（功能档——`views/chat-pending.mjs`（已落 · 实读 **69**（2026-09-29）） · `views/chat-subagent.mjs`（已落 · 实读 **75**（2026-09-29）· 归档块构树））+ **拆分产出 2**（`renderer/page-read.mjs` · `renderer/queue.mjs`——结构拆分 · 本批执行，见 §4.2）；新通道 **1**（`ev:subchunk`——单源 = `docs/desktop/design/IPC.md` §1）。

**本批注（对齐第三批 · 小修族 24 + 相抵 2 · 2026-09-28）**：本注定形「小修族 24 条 + 两条相抵」的**对齐形**（用户 07:11 裁定：**不存在「用户的不做」——流程自划的例外一律按对齐办**；需求档 §3.1:51 / §5.1 已收正）；用户 07:13「剩下的你自动跑完吧」授权下立批。口径 = 需求档 §3.6（**「对齐」= VSC 的形 + 行为**）；交底 = 逐条「现状 → 对齐形 → 落点 → 判据」；条目全文与出处 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1 / §2。
核面新消费件（`formatToolSummary` / `isToolFailure` / `diff.mjs` 三导出 / `linkifyPaths` / 核台账行产）单源 = `docs/render-core/design/RENDER-CORE.md` §4 / §5；本注只述端侧形态 / 落点 / 判据 / 边界；通道载荷增键与白名单收正 = `docs/desktop/design/IPC.md` §1 / §2。

**A. 对话流面（12 项）**：→ 全项迁 `docs/desktop/design/CHAT.md` §2（A1 ∥ A2 ∥ A3 ∥ A5 ∥ A6 ∥ A7 ∥ A8 ∥ A9 ∥ A12 ∥ A13 ∥ A14 ∥ A15——十二项逐字；as-of 2026-10-02）。

**B. 外围面**：
- 1 ∥ 2 ∥ 3（审批卡 owner ∥ 提问卡 Enter ∥ 提问卡聚焦）→ 迁 `docs/desktop/design/CHAT.md` §2（B1 ∥ B2 ∥ B3）；5 ∥ 6（活动区等待审批态 ∥ 停止钮角色门）→ 迁 `docs/desktop/design/ACTIVITY.md` §2；
- 12 ∥ 14 ∥ 15（会话栏末项删除门 ∥ 设置面类型加工 ∥ 设置面 agent 形态）→ 迁 `docs/desktop/design/SESSIONS.md` §2.6 ∥ `docs/desktop/design/SETTINGS.md` §2.3；22 ∥ 26 ∥ 28（非栅格拒 ∥ 发送失败可见性 ∥ 中断键两态）→ 迁 `docs/desktop/design/COMPOSER.md` §2；**7 = 本档存留（下）**。

7. **1s 心跳（走时）**——现状：渲染面零定时器（秒数冻结到下一事件）。对齐形：渲染面 **1s 拍**（首个渲染面定时器）= ① 池面在飞块逐块 `refreshBlock`（判据 `isConnected ∧ !frozen`——走时词面）② 本键位标含 `running` ⇒ 状态行重挂（耗时段走时）。落点 = `thincoder-desktop/renderer/app.mjs`（单点 `setInterval` + 卸载清点）。判据 = 机检（假钟 + 清点）+ 真机（秒数逐 1s 走）。

**C. 相抵两条**：→ 全项迁 `docs/desktop/design/CHAT.md` §2（C1 ∥ C2——相抵① diff 预览 ∥ 相抵② 文件链接点开；as-of 2026-10-02）。

**F. 出处重核输出**：**审批卡·真置焦执行** → 迁 `docs/desktop/design/CHAT.md` §2（F-置焦；as-of 2026-10-02）。

**D. 计数（D3）**：小修族 **24**（对话流 12 ∥ 外围 12）· 相抵 **2** · 出处重核 **12**——逐条处置表 = 批档 `docs/batches/2026-09-28-desktop-vsc-align-3.md` §2；本域存留面计数 = 渲染面**首个定时器**（1s 拍——上项 7）。**逐项计数分载** = `docs/desktop/design/CHAT.md` §2（D · 本域分项）。

**本批注（回合中插入 · 步边界 pickup · 2026-09-28）**：→ 迁 `docs/desktop/design/COMPOSER.md` §2（as-of 2026-10-02）。

**本批注（R11 状态行 ⇒ CLI 对齐 · 2026-09-28）**：本注补本档 §1「状态栏」行的 **R11 状态行 ⇒ CLI 对齐**（该行已就地指针）；基准 = CLI 状态行（`thincoder-cli/src/tui/render-frame.mjs` `buildStatusLine` + banner 四态）；批档 = `docs/batches/2026-09-28-desktop-flow-vsc-align.md`（R11 + R11 补轮）。

1. **段间分隔** = CLI 形「段 │ 段」——每段自携前导（`::before`——CLI「每段自携」同构）；banner 四位 ∕ banner→后段 = 竖线紧贴前词（`PLAN│ AUTO`）；相邻段选择器 ⇒ 缺席段不落空分隔。
2. **字色**：base = `--fg` 50% 强度（⟷ CLI `dim`——`thincoder-cli/src/tui/ansi.mjs:31`）；警示段 = `--warn`（⟷ CLI 黄——同档 `:46` `fg(3)`）。
3. **banner 四位字色（补轮落）**：`auto` **复用 `--warn`**（黄——CLI 同一常量，不裂双黄）· `plan` = `--mode-plan`（青）· `advisor` ∕ `eng` = `--mode-advisor`（亮绿——两段同常量）；段码 ⟷ 槽三规则住 CSS（`thincoder-desktop/renderer/chrome.css:257-260`——2026-09-29 按盘收正）；
   **两新槽**（亮 ∕ 暗两套值）住 `thincoder-desktop/renderer/theme.css`——亮色两值 = 同色相暗化（色相源 = VSC 终端 ANSI 同码默认；对比 ≥4.5:1）∥ 暗色两值 = ANSI 暗默认：`--mode-plan` = `#047990` ∕ `#11a8cd` · `--mode-advisor` = `#0a7b0a` ∕ `#23d18b`）。
4. **分隔两边缘面裁定**：① 换行时行首悬空 `│` —— **不采用**（由：段自携前导同构；修需 JS 测行 ∕ 改布局 ⇒ 越「段集 ∕ 段序 ∕ 段读数逻辑零改」边界；孤竖线与段间分隔同形同色、仅窄窗换行边缘可见——无误读风险）。② `.status-alert`（非段位）相邻条 —— **采用**（前邻（段 ∕ 告警位）在场才落条 · 行首零前导；落形 `thincoder-desktop/renderer/chrome.css:254-256`（2026-09-29 按盘收正）——两侧各 6px）。

**本批注（R12 会话流 ⇒ VSC 对齐 · 2026-09-29）**：→ 迁 `docs/desktop/design/CHAT.md` §2（as-of 2026-10-02）。

**本批注（流内竖向间距 · 2026-09-30）**：→ 迁 `docs/desktop/design/CHAT.md` §2（as-of 2026-10-02）。

**本批注（扁平化 ∥ 按钮族圆角恢复 ∥ 按钮迁行 · 2026-09-30）**：本注定形轻通道轮一三笔已落面（台账 #712；记录 = `docs/batches/2026-09-30-light-round-1.md` §1；原始裁定 = `docs/batches/2026-09-30-desktop-flat-seamless.md` §1——该批转轻通道、记录冻结）；间距两笔（#715 ∕ #716）住`docs/desktop/design/CHAT.md` §2「本批注（流内竖向间距 · 2026-09-30）」——本注不重述。

1. **框架全铺满（区间距归零）**——`.app { gap: 0; padding: 0 }`（原列间 ∥ 窗周 12px 归零）⇒ 区块相连、全铺到边；各区底色维持 `--bg-raised`。落点 = `thincoder-desktop/renderer/chrome.css:9-16`。
2. **圆角零**——`--radius: 0`（`thincoder-desktop/renderer/theme.css:17`）∥ 直值处逐处归零（工具卡 ∥ 错误横幅 ∥ 推理 ∥ 归档 ∥ 消化 ∥ 卡族 ∥ 代码块族 ∥ 滚动条 thumb 等——逐条 = 批档 §2 清册）。
3. **相邻零分割线（输入区上线唯一保留）**——各区边界 = 1px transparent（D24 保位形）∥ 块壳去线（`border: 0`）；**保留线 = 输入区上线**：`#toolbar { border-top: 1px solid var(--border) }`（核件 `thincoder-render-core/composer/composer.css:16`）——用户 2026-09-30「相邻区域不要有分割线，现在有的输入区上面的那根保留，不要新增」。
4. **按钮族圆角恢复**——用户「按钮什么的的圆角没了，我觉得按钮的圆角还是要的，主输入框倒是方的好」：按钮族回圆角（值表 = 批档 §2 清册）；**主输入框保持方**（`.composer #input-row { border-radius: 0 }`——`thincoder-desktop/renderer/chat-composer.css:41`）。
5. **Attach ∥ Send（∥ 忙时 Stop）迁控件行**——装配期节点搬移（`thincoder-desktop/renderer/mount-composer.mjs:215-226` ∥ 调用点 `:242`）：三钮 `#input-row` ⇒ `#controls-row` 右端同排（`margin-left: auto` ∥ 同高 26px ∥ 圆角 14px 同族——`chat-composer.css:51-58`）；输入框右侧按钮位退场（左右对称内边距）；监听 ∥ 工厂引用随节点同行（零行为改）。
6. **判据（真机 computed · 测试面 = 桌面测试树空清单〔2026-09-28 全清重置〕）**——`.app` gap 0 ∥ 逐面 radius 0（按钮族例外）∥ thumb radius 0 ∥ `#toolbar` border-top 显形 ∥ 三钮父 = `#controls-row` ∧ `#input-row` 内零钮 ∥ 输入框 radius 0 ∥ 按钮族正向值检（代表钮 `#send-btn` radius ≠ 0）∥ 迁行行为腿（Stop 显隐 ∥ 发送可用）；逐条 = 批档 §2 验证腿 V1–V10。
7. **边界**——纯视觉 ∥ 结构面；通道 ∥ 词键 ∥ 核件（`thincoder-render-core/**`）零改；「终端风格」大改（#710）不在本批（已搁置）。

**本批注（子 agent 块内容区跟滚 · #518 收口 · 2026-09-29）**：→ 迁 `docs/desktop/design/ACTIVITY.md` §2（as-of 2026-10-02）。

**本批注（块跟滚让位修复 · 2026-09-29）**：→ 迁 `docs/desktop/design/ACTIVITY.md` §2（as-of 2026-10-02）。

**本批注（复制面对齐 VSC · 2026-09-29）**：→ 迁 `docs/desktop/design/CHAT.md` §2（as-of 2026-10-02）。

**本批注（挂起窗径「消费前流内零块」· 2026-09-29）**：→ 迁 `docs/desktop/design/COMPOSER.md` §2（as-of 2026-10-02）。

**本批注（窗队列 VSC 逐点对齐 · 2026-09-29）**：→ 迁 `docs/desktop/design/COMPOSER.md` §2（as-of 2026-10-02）。

**本批注（停滞轻显形 · 2026-09-29）**：本注定形桌面端「在飞回合静默读数」（用户 2026-09-29 12:1x 裁定 #568 = B 轻显形——三端同口径；批档 = `docs/batches/2026-09-29-stall-indicator.md`）；语义单源 = `docs/cli/design/TUI.md` §7.7（本注不重述，只落桌面实现面）。

1. **承载段 17**——新段 `quiet`（`data-seg="quiet"`），序 = `elapsed` 之后（`thincoder-desktop/renderer/views/statusline.mjs:41-43` `STATUS_SEGMENTS`）；
   段构建器 = `statusline-segments.mjs` `quietSegment`（`QUIET_MS = 10000`——沿 `USAGE_WARN` 先例；数值单源 = `docs/cli/design/TUI.md` §7.7）；词面 = 核字典键 `status.quiet` 经 `t()` 投影直取（`HOST_DICT` 零新键）。
2. **起算 ∕ 重置（归约面单点）**——新切片 `lastOutputAt`（按会话键）；起算锚 = `events.mjs` `onActivity` turn 形（`turnStarts` 邻位同置）；重置 = `reduce()` 可见输出通道集单点（`ev:token` ∕ `ev:reasoning` ∕ `ev:subchunk` ∕ `ev:tool-call` ∕ `ev:tool-output` ∕ `ev:tool-result` ∕ `ev:subagent`）——「无变化 ⇒ 原引用」对时间戳切片自然不适用（逐事件恒变）；切片不入状态行订阅键组（显示走拍）。
3. **跳秒 = 1s 步进**——`heartbeat.mjs:16` `HEARTBEAT_MS` **1000**（落值）；拍体 = `app.mjs:269-276`——活动会话位标含 `running` ⇒ 状态行重挂；零新增定时器（单点 `setInterval` 纪律不变）。
4. **判据（机检 ∕ 真机 · 父侧闭合）**：① 位标含 `running` ∧ `now − lastOutputAt ≥ 10000` ⇒ 段在场（首显「已静默 10s」）；② 不足阈值 ∕ 非 running ∕ 回合终态（`done` ∕ `stopped` ∕ `error`）⇒ 段零节点（负向锁——状态行零该段）；③ 拍面：相邻两拍读数差 = 现实秒差（1s 步进）；**机检面** = 批档本地用例随批留存（**仓套件不写 ∕ 不改 ∕ 不跑**——全清令）；**真机** = 父侧真跑闭合（D16 义务）。
5. **边界**：纯读数——零控件 ∕ 零打断 ∕ 零警示色；零新通道 ∕ 零新载荷（本段纯渲染面自算）；`IPC.md` 零改；核件 ∕ `thincoder-render-core` 零改；「已提交未起跑（回执窗）」不在显示域（登记 = `docs/cli/design/TUI.md` §7.7 观察 ∥ 批档 §2 上抛）。

**本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）**：本注补本档 §1「状态栏」行的**段 9 ∕ 段 11 两段收正**（该行已就地指针；来源 = 用户 2026-09-29 13:07 桌面走查「上下文那里只显示了个24%，cli显示很全，cli还有台账计数，desktop也没有」）；批档 = `docs/batches/2026-09-29-desktop-statusline-cli-gap.md` · 台账 #600。口径 = 段面收窄 = **只动两段**（余 15 段不重开）；标尺 = en 与 CLI 逐字、zh 对位译形。

1. **上下文段（段 9）⇒ CLI 形**——读数 = `context <pct>% <tokens>`（en 逐字——`thincoder-cli/src/tui/render-frame.mjs:413-416`；zh 对位译形 `上下文 <pct>% <tokens>`）；
  词面 = `status.usage`（`thincoder-desktop/renderer/i18n.mjs`——`${tokens}` = 段侧合成串：令牌 > 0 ⇒ `␣<fmtK>`，否则空串 ⇒ 半态 `context <pct>%` 同 CLI）；
  `fmtK` 格式单源（端 = `thincoder-desktop/renderer/views/statusline-segments.mjs:29-33`；CLI 同式 = `thincoder-cli/src/tui/render-frame.mjs:396`——≥ 10000 ⇒ 整数 k · ≥ 1000 ⇒ 一位小数 k · 否则裸数；判据①「逐字一致」以此为凭）；
  令牌 = `ev:usage` 新键 `ctxTokens`（核 `estimateTokens(agent.history)` 直读——`thincoder-core/token-window.mjs:17`；与 `ctxPct` 同点产出）；
  渲染面 = 新切片 `usageTokens`（按会话键）；≥ 80% 警示色零改（`USAGE_WARN`）。
2. **台账段（段 11）⇒ 常驻计数**——在场判据 = 核状态位（`state.ledger = { marker, warn }`——`thincoder-core/ledger-surface.mjs:54`；120s 拍 + 首拍即到）经 `ev:ledger` `marker` 键转发 ⇒ 归约切片 `ledgerMarker`（首拍必携〔含 null 清残影〕· 同值零出站）；
  段文 = 核 `formatMarker` 逐字 `台账 N·M`（= **当前打开范围合计**；端零构造）；警示色 = 核 `warn` 位（范围内老化 > 0 ∨ 死执行者 > 0——端零重算）；
  tooltip 明细面保留（载波 = `ev:ledger` `detailLines`〔归约切片 `ledgerDetail`〕——零改）。「可开批」段形退场（CLI 状态段无此形）；信号保留于 tooltip（核 `formatDetailLine` 逐字携「 — 可开批」——`thincoder-core/ledger.mjs:152`）；`info.threshold` 键两语退场（消费归零 ⇒ 零残键）。
3. **判据（机检 ∕ 真机 · 父侧闭合）**——① 上下文段：en 与 CLI 同读数逐字一致（`context <pct>% <tokens>`）；令牌 0 ∕ 缺 ⇒ 尾段缺席（**打开态 = 半态**——令牌随首个回合尾 `ev:usage` 到场）；② 台账段：常驻 ∧ 计数与 `ledger:read` 同源一致 ∧ `warn` 位 ⇒ 警示色；③ 机检面 = 批档本地用例随批留存（**仓套件不写 ∕ 不改 ∕ 不跑**——全清令）；真机 = 父侧真跑闭合（D16 义务）。
4. **计数（D3）**——词键退 **1**（`info.threshold`；`status.usage` 值改零增退）· 新切片 **2**（`usageTokens` ∕ `ledgerMarker`）· 载荷扩 **2**（`ev:usage` `ctxTokens` · `ev:ledger` `marker`）· 通道 **0** · 白名单 **0** · 段集 ∕ 段序零改（承载 17 段不动）。
5. **边界**——打开态播种面零改（恢复读仅百分——令牌随首个回合尾 `ev:usage` 到场；seed 扩面须动核 `sessionReading`，超本批边界）；核件（`thincoder-core` ∕ `thincoder-render-core`）零改；零新通道 ∕ 零白名单项；段间分隔 ∕ 字色族零改（R11 在册）。

**本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）**：→ 迁 `docs/desktop/design/SETTINGS.md` §2.2（界面形态与交互——10 项；as-of 2026-10-02）。

**本批注（@ 文件引用对齐 · 2026-09-29）**：→ 迁 `docs/desktop/design/COMPOSER.md` §2（as-of 2026-10-02）。

**本批注（桌面重建保真 + 留端清算族 · 2026-09-29）**：本注定形「重建面位 ∕ 焦点保真族 + 设置 ∕ 向导草稿保真 + 滚动策略族工厂化 + 留端未接四项 + 段 14 判据扩路」的界面面（挂账族集中处置令；批档 = `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2；台账 #604–#608 + #581）。

1. **设置 ∕ 向导草稿保真（#604）**：→ 迁 `docs/desktop/design/SETTINGS.md` §2.8（as-of 2026-10-02）。
2. **重建保真二分（#606 · 六面）**：→ 见 `docs/desktop/design/RENDERER.md` §1.1（重建保真族条 ∥ 两处滚位例外；as-of 2026-10-02）。
3. **滚动策略族工厂化（#607）**：→ 见 `docs/desktop/design/RENDERER.md` §3（滚动策略族工厂化条）；核档单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8 ④（as-of 2026-10-02）。
4. **留端未接族（#608）**——① 痕迹 ∕ 丢弃痕 = 端观测面（桌面无诊断上行面）⇒ 不接（给由——零行为差异）；② `resetActivity` = 已在位（桌面 `resetSubBlocks` 同义）；③ 说明行判重 = **挂载根旗标**（`root._subDescShown`——一次置位不重置，沿 #630 KD-EC-4，与 VSC 同判）；真机 P9。单源 = 批档 §2.6。
5. **段 14 判据四路（#581）**——窗在场 ∧ 队空 ∧ 非忙 ⇒ 排队句（窗内 Enter = 入队——现制该角落出 send 句 = 显示说谎残留）；形态 ∕ 其余 16 段零改；零键增（复用 `status.queue.enter`）；单源 = 表行 14。
6. **计数（D3）**——新档 **1**（`thincoder-desktop/renderer/view-state.mjs`（已落 · 实读 **299**））· 通道 **0** · 白名单 **0** · 词键 **0** 增退；判据载体 = 批内件两档（M-604 a–c ∕ M-606 a–c ∕ M-607 a–c ∕ M-608 a–c ∕ M-581 + P1–P9）；全清令（仓套件不写 ∕ 不改 ∕ 不跑）。

**本批注（排版统一 · D29 · 2026-09-30）**：本注定形桌面排版统一（用户 2026-09-30 18:18 ∥ 18:20 走查两条 + 18:23「开」；需求卷 **D29**；台账 #736；批档 = `docs/batches/2026-09-30-desktop-typography-unify.md`）；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-57**（本注只述外壳面值面与判据，不重述决策）。

1. **基线四值（单源 = `thincoder-desktop/renderer/theme.css`）**——字族 = `--mono` 栈——**Cascadia Mono 首字 + 中文雅黑入栈**（`--font: var(--mono)`——一处切换）；字号 = `--fs`（**14px**——轮五）；行高 = `--lh`（**1.3**——轻通道轮四收窄）；字距 = `--ls`（**`normal`**——与验收判据同字）；`body` 基面 ∥ `[data-slot="settings"]` 两处 `font` 简写取 `--fs`/`--lh`/`--font`。
   **系统依赖在册**——Cascadia 用户级安装（两档 + 两注册）；未装回落 Consolas——仓内零资产（轻通道轮三 · 2026-10-01）。
   **`--ls` 落位** = `body` 面 `letter-spacing: var(--ls)` 独立一行（`font` 简写不载字距——全栈唯一声明点，余档零 tracking）。
   **全栈单一**：会话流 ∥ 工具卡 ∥ 状态行 ∥ 活动池 ∥ 设置 ∥ 向导 ∥ 会话面板 ∥ 核件消费面——无第二字号 ∥ 无第二行高 ∥ 无 tracking（撤 0.3px ∥ 0.5px ∥ 0.04em 三处）。
2. **自有文字零粗体（颜色通道）**——`font-weight` 全归 400（撤 500 ∥ 600 ∥ 700 三档——逐处 = 批档 §2 清册）；原字重承担的强调由**既有色位**承担（说话人标签 ∥ 工具名 = accent · 待发送标签 = `--warn` · 审批 ∥ 提问卡 = 绿 ∥ 红 ∥ accent · 会话标题 ∥ 池头 ∥ 行名 = fg ∥ muted 灰阶 · 当前向导步 = fg vs muted——零新色槽）；**markdown 标记豁免**（见项 3）。
3. **markdown 修饰层（内容面）**——正文 ∥ 段 ∥ 列表 ∥ 引用 ∥ 表格 = 同基线；修饰 = `strong`（700）· 标题（em 相对）· 代码（相对）· 引用 · 表格 · 分隔线 · 勾选框——**语义保留**；**绝对 px 岛清零**（语言条 10px ∥ 复制钮 11px ∥ 推理族 12px ⇒ 基线）；**值表单源 = `docs/render-core/design/RENDER-CORE.md` §5「排版统一覆盖」块**（本注不重述）。
4. **核件消费面收敛（覆盖段）**——输入面板 ∥ 模型菜单 ∥ 搜索条（核件静态档——含其 `auto-confirm` 同位族）：经 `thincoder-desktop/renderer/chat-composer.css` **覆盖段**（特征度提升选择器——沿扁平化覆盖先例）收基线（字号 ∥ 字重；盒值 ∥ 描边 ∥ 布局零动）；**核件（`thincoder-render-core/**`）∥ VSC 侧零改**（`composer/composer.css` 逐字锁保持）。
5. **外壳面收敛表**（逐选择器全表 = 批档 §2 清册；本表 = 逐档现值 ⇒ 收正）：

| 档 | 现值 | 收正 |
|---|---|---|
| `theme.css` | `--font` 系统 UI 栈；body `14px/1.5` | `--font: var(--mono)` + `--fs` ∥ `--lh` ∥ `--ls` |
| `chrome.css` | 12 ∥ 13 ∥ 8 ∥ 18px + 500 + `lh:1` | 全 ⇒ `var(--fs)`；500 ⇒ 400；`lh` ⇒ `var(--lh)` |
| `session-list.css` | 13 ∥ 11 ∥ 12px + 500 | 全 ⇒ `var(--fs)`；500 ⇒ 400 |
| `chat.css` | 12 ∥ 11 ∥ 14px + 600 ∥ 700；`lh:1.45` | 全 ⇒ `var(--fs)`；600 ∥ 700 ⇒ 400；`lh` ⇒ `var(--lh)` |
| `chat-cards.css` | 12 ∥ 14px（var）+ 700 | 全 ⇒ `var(--fs)`；700 ⇒ 400 |
| `chat-fixes.css` | 15 ∥ 12 ∥ 11px + 600；`lh:1.7` | 全 ⇒ `var(--fs)`；600 ⇒ 400；`lh` ⇒ `var(--lh)` |
| `core-markdown.css` | 10px（语言条） ∥ 14px 正文 | 语言条 ⇒ `var(--fs)`；正文取变量；修饰层保留 |
| `core.css` | 12 ∥ 11 ∥ 10px + 600 ∥ 500 | 全 ⇒ `var(--fs)`；600 ∥ 500 ⇒ 400；tracking 撤（随基线） |
| `pool.css` | 12 ∥ 11px + 600；tracking | 全 ⇒ `var(--fs)`；600 ⇒ 400；tracking 撤（随基线） |
| `settings.css` | 16 ∥ 12px + 600；`lh:1` | 全 ⇒ `var(--fs)`；600 ⇒ 400；`lh` ⇒ `var(--lh)`；tracking 撤（随基线） |
| `chat-composer.css` | （新增覆盖段） | 核件消费面 ⇒ 基线（覆盖层） |

6. **判据（机检 ∥ 真机）**——① 源扫描腿（批内件 `docs/batches/2026-09-30-desktop-typography-unify.test.mjs`——平 node · 11 档 CSS + `index.html` 骨架源判据）；② 真机 computed 全栈扫描腿（`…-probe.mjs`——真 Electron · 亮 ∥ 暗；判据清单 = 批档 §2——`select` 本体行高豁免在册〔Blink 固定其 computed `normal`，CSS 不可达；读数 `selectExemption`〕）；
   ③ 真机走查（逐面 + md 修饰 + 两模式——父侧闭合，D16 义务）；与 `docs/desktop/design/PROJECT.md` §6.1「排版统一批（验收面）」同源。
7. **边界**——功能 ∥ 布局零动；块外边距（含内边距）非本批射程——现值随轻通道轮四间距归一（单源 = `docs/desktop/design/CHAT.md` §2「本批注（流内竖向间距 · 2026-09-30）」）；markdown 语义保留（只动「自成体系」部分）；零通道 ∥ 零词键 ∥ 零 JS ∥ 核件零触；「终端风格」大改（#710）仍在搁置（本批 = 排版一刀）。

**本批注（菜单体系 · D36 · 2026-10-02）**：→ 迁 `docs/desktop/design/MENU.md` §2（界面形态与交互——菜单树 ∥ 交互落径 ∥ 键盘可达 ∥ 判据 ∥ 边界；as-of 2026-10-02）。

**本批注（设置面样式收正 · D37 · 2026-10-02 · 台账 #812）**：→ 迁 `docs/desktop/design/SETTINGS.md` §2.5（界面形态与交互——收正四则 ∥ 渠道两行卡 ∥ 六段点清 ∥ 拨杆形 ∥ 端差登记 ∥ 判据 ∥ 边界 ∥ 计数；8 项；as-of 2026-10-02）。

**本批注（设置菜单升级 · D38 ∥ D39 · 2026-10-02 · 台账 #817）**：→ 迁 `docs/desktop/design/MENU.md` §2 ∥ `docs/desktop/design/SETTINGS.md` §2.10（界面形态与交互——设置组树 ∥ 组弹窗体 ∥ 判据 ∥ 边界；as-of 2026-10-02）。

## 2. 活动池与状态位（需求档 §3.5 三项落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | → 迁 `docs/desktop/design/ACTIVITY.md` §2（as-of 2026-10-02） |
| 2 · 标签位集合与优先级 | **落定** | → 迁 `docs/desktop/design/ACTIVITY.md` §2（as-of 2026-10-02） |
| 3 · 会话行「来源端」标注 | **落定** | → 迁 `docs/desktop/design/SESSIONS.md` §2.7（as-of 2026-10-02）。 |

**旁证（不得混称）**：→ 迁 `docs/desktop/design/SESSIONS.md` §2.7（旁证段；as-of 2026-10-02）。

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

**本批注（右栏宽度拖动 · D30 · 2026-09-30 · 台账 #742）**：→ 迁 `docs/desktop/design/ACTIVITY.md` §2（as-of 2026-10-02）。

**本批注（主题切换 · D33 · 2026-09-30 · 台账 #743）**：本注定形桌面主题三态（用户 2026-09-30 20:17 走查「我看到过你测试时有暗色的主题，但是并不知道怎么切换主题。」+ 23:40 批次点火令；需求卷 **D33**——亮 ∥ 暗 ∥ 跟随系统三态切换 + 记住（重启恢复）；落面二择一 = 实读裁定取**渲染面覆盖径**——判由与被否列 = `docs/desktop/design/PROJECT.md` §2 **KD-61**）；
批档 = `docs/batches/2026-09-30-theme-switch.md`；本注只述形态 ∥ 交互面，不重述决策。

1. **三态语义与状态载体**：状态 = `document.documentElement` 的 `data-theme` 属性——值域**闭集三码** `system` ∥ `light` ∥ `dark`（缺省 ∥ 存储缺 ∥ 表外值 ⇒ `system`）；**单写者 = `thincoder-desktop/renderer/theme.mjs`**（`initTheme` 装配期一次 ∥ `setTheme` 出口径——`dataset.theme` 写径全仓仅此一处）。
2. **值面结构（`thincoder-desktop/renderer/theme.css`）**：原「亮缺省块 + `@media (prefers-color-scheme: dark)` 暗块」两段收敛为**单块 `light-dark(亮, 暗)` 值对**（色值对 **24** 枚——逐值逐字保原（亮值第一 ∥ 暗值第二）；`--error-fg` 两态同值 ⇒ 单值直书；非色变量（`--mono`）暗块同值重声明随块消解——单块单留；不入 `light-dark()`）；
  `@media (prefers-color-scheme: dark)` 本体退场（全仓唯一消费点即本档）；`system` 态「跟随系统」= `:root { color-scheme: light dark }` 媒体缺省（`light-dark()` 随系统解析——系统深浅翻转零 JS）；`light` / `dark` 强制态 = `:root[data-theme]` 覆写 `color-scheme`。
  **基线四值（`--font` ∥ `--fs` ∥ `--lh` ∥ `--ls`）与非色变量（`--radius` ∥ `--gap` ∥ `--pool-w` ∥ `--mono`）零动**（D29 守界——本重构逐字保原；`--mono` 字栈后经轻通道轮三收正 ∥ `--lh` 行高后经轻通道轮四收窄——均见 `:591`）。
3. **切换控件（设置面头 · 三态钮族）**：落点 = 设置面板头（`thincoder-desktop/renderer/views/settings.mjs` `headNode`）——语言控件（`.settings-lang`）**左侧**；容器 = `div.settings-theme`（`role="group"` + `aria-label` = `t("settings.theme")`）；
  三钮 = `button.settings-theme-opt`（`data-action="settings:theme"` + `data-theme` = 目标值 `system` ∥ `light` ∥ `dark`）；**当前态** = `data-active`（存在）+ `aria-pressed="true"`（三钮恰一）；序 = **跟随系统 ∥ 亮色 ∥ 暗色**（缺省态居首）；同值点按 ⇒ 幂等（零通知）；
  缺 handlers ⇒ 三钮 `disabled`（沿 `wire` 两态通则）；样式（`settings.css`）：并入**次级键族**（描边归零 + 四值族——D24 带上；当前态 = `--fg` 字色 + `--hover-bg` 底）。
4. **持久化（记住 = 重启恢复）**：载体 = 渲染面 `localStorage`（键 `thincoder.desktop.theme`——三值闭集串）；**读 = 装配期一次**（`thincoder-desktop/renderer/app.mjs` 装配期 `initTheme()`——先于首绘可及面，同 `poolWidth` 装配径）；**写 = 每次点按即刻**（同刻应用 + 落存储）；
  读 ∥ 写皆捕获 + `console.error`（零静默）——读失败 ∥ 存储缺 ∥ 表外值 ⇒ 视同 `system`（降级）；写失败 ⇒ 本次会话内照常生效（fail-soft）。
5. **判据（机检 ∥ 真机）**：机检 = 批内件 `docs/batches/2026-09-30-theme-switch.test.mjs`（六腿——存储读回 ∥ 落写 fail-soft ∥ 表外拒绝 ∥ 单写者负控 ∥ CSS 结构 ∥ 面头三钮）；真机 = `docs/desktop/design/PROJECT.md` §7 **T-DSK54**（两启程——切暗 ⇒ 重启仍在 ∥ 切亮 ∥ 切回跟随系统）；同源 = 同档 §6.1「主题切换批（验收面）」。
6. **边界**：窗口画布色 ∥ 原生面（菜单 ∥ 对话框 ∥ 标题栏）仍随系统（主进程不以用户值驱动原生面——`nativeTheme.themeSource` 径被否，见 `docs/desktop/design/PROJECT.md` §2 **KD-61**；唯菜单勾选态显示缓存一枚——**KD-65** ②）；主题换肤（色板 ∥ 自定义）不做；CLI ∥ VSC 两端零触 · 核 ∥ `thincoder-render-core` 零触 · 通道 ∥ preload 零新面（`thincoder-desktop/src/main/window.mjs` 注释两处随正——零行为改）。

**本批注（slash 命令面 · 2026-10-01 · 台账 #761）**：→ 迁 `docs/desktop/design/COMPOSER.md` §2（as-of 2026-10-02）。

## 4. 文件账（本域 · 迁自 `PROJECT.md` §4.1 ∥ §4.2——as-of 2026-10-02）

### 4.1 本端文件清单与行数预算（本域族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/index.html` | **57**（实读 2026-10-02——设置体系升级批（#817）实施落盘（56 ⇒ 57：+`settings-modal.css` 链行——settings.css 后））；前读 **56**（实读 2026-09-30——右栏宽度拖动批（#742）后（`.pool` 首子拖柄节点一行）；前读 55（撤会话头批落形：槽行删 ∕ 注释随动）；越线档结构轮实施读 56——增 `session-list.css` link 一行（位次 = chrome.css 后 ∕ skin.css 前）） | 骨架 + CSP（经 `app://` 的真实 origin 方可收紧）+ 设置面板容器与入口位（批 9）+ 输入区单容器 `[data-slot="composer"]`（批 A）+ **R1 静态引导层**（`data-boot` 消费面；写者单点零改） |
| `thincoder-desktop/renderer/theme.css`（R13 四拆分产） | **70**（实读 2026-10-01——主题切换批实施后（96 ⇒ 70：双块收敛单块 + `@media` 退场）；前读 96（设计轮实读——D29 排版统一批落盘后值 + 右栏宽度拖动批（+1））；更前 95（实读 2026-09-29——滞后）） | 主题变量段 + 基面（**三态（D33）**：单块 `light-dark()` 值对 + `color-scheme` 三态——变量唯一集中处；主题事实源 = 渲染面 `data-theme` 状态（单写者 `renderer/theme.mjs`）） |
| `thincoder-desktop/renderer/chrome.css`（R13 四拆分产） | **281**（实读 2026-09-30——右栏宽度拖动批（#742）后（栅格行改 `clamp(15rem, var(--pool-w), …)` + `.pool-resizer` 规则族；269 ⇒ 281）；前读 269（门复读值）；更前 268 ∕ 撤会话头批落形：`.session-head` 槽行与 `.head-fields` / `.head-field` 字段族删（291 ⇒ 268）；前史：原 **450** 拆后落值——会话列表面全量迁出 `thincoder-desktop/renderer/session-list.css`（**已落** · **170**）（desktop-residuals-round3 波 C（#617-CJ）后）；越 300 消解；保位注一行落原切点位 `:136`） | 中区外壳面（两列栅格 + 会话控制条〔VSC 形换装〕+ 状态栏；窄窗断点随左列裁撤消解——零断点） |
| `thincoder-desktop/renderer/skin.css`（R13 四拆分产） | **13**（实读 2026-09-30——撤会话头批落形：`.head-field` 交互态三值行删；前读 18（W6 届盘复读——parity-b10 R1 +5）） | 皮肤与交互态尾段（滚动条皮肤 + R1 引导层样式；会话头 chip 交互态两族随撤会话头退场） |
| `thincoder-desktop/renderer/theme.mjs`（主题切换批 · 已落） | **85**（实读 2026-10-01——实施后对账终值；前读 86；设计轮预估 ≈70） | 主题三态面（chrome 级状态）：键 `thincoder.desktop.theme` ∥ `THEMES` 闭集 ∥ `initTheme`（读存储 ⇒ 应用 `dataset.theme`）∥ `setTheme`（校验 ⇒ 应用 + 落存储）；注入缝 `{ doc, storage }` ⇒ 平 node 直测——机制 ∕ 判据单源 = `docs/desktop/design/PROJECT.md` §2 **KD-61**（未迁行） ∥ `docs/desktop/design/RENDERER.md` §1.4 |
| `thincoder-desktop/renderer/search.mjs`（R6 落） | **26**（实读 2026-09-29——内容行数口径） | 会话内搜索端壳（`/rc/search.mjs` 直取 + `[data-slot="flow"]` 根绑定；Ctrl+F 键位注册随核件工厂——R6 上提；单源 = `docs/render-core/design/RENDER-CORE.md` §3 行 32） |
| `thincoder-desktop/renderer/views/chrome.mjs` | **35**（实读 2026-09-30——撤会话头批落形：头族全段退场（`headModel` ∕ `headTree` ∕ `mountHead` ∕ 控件原语族 ∕ `sessionMetaOf` ∕ 两常量表；252 ⇒ 35）；前史：#119 合并实施轮 ∕ RF 波 2 后） | 中区外壳共用件（会话头面退场后）：位标词键表 `BADGE_WORD` + `busyOf` / `suspActiveOf`（同源判据） + 状态行三同名再出口（`mountStatus` / `statusModel` / `statusTree`——消费面零改）；形态单源 = 本档 §1（会话头行已退役） |
| `thincoder-desktop/renderer/views/statusline.mjs`（R3a · 批档见 `PROJECT.md` §4.2） | **204**（实读 2026-10-01——复核扫面收正批实施后（206 ⇒ 204——M7 透传去）；更前实读 2026-09-29——RF 波 5 后） | 状态行族档：承载段构树单源 + `STATUS_SEGMENTS` 段闭集（17 码）+ `mountStatus` 薄挂载（自 `chrome.mjs` 拆出；同名再出口 —— 消费面零改）；拆档落形 = banner 段组出档（下行） |
| `thincoder-desktop/renderer/views/statusline-segments.mjs`（R4 拆档产出） | **227**（实读 2026-09-29——parity-b10 I2 ∕ I3 ＋ RF 波 5 后） | 状态行段构建器族（切片 → 段模型；`STATUS_SEGMENTS` 闭集序归主档） |
| `thincoder-desktop/renderer/views/statusline-banner.mjs`（状态栏对齐批新档） | **25**（实读 2026-09-28——≤300） | banner 段组（`BANNER_CODES` + `bannerSegments`——四态段构树自 `statusline.mjs` 拆出；严格真 ⇒ 在场 · 假 / 缺 / 非布尔 ⇒ 零节点） |
| `thincoder-desktop/renderer/mount-status.mjs`（R3a） | **43**（实读 2026-09-29——RF 波 2 后） | 状态行挂载：槽锚 `STATUS_SLOT` + 订阅切片键面 `STATUS_KEYS` + `attachStatus()` |
| `thincoder-desktop/renderer/core.css`（R3c） | **338**（实读 2026-10-01——扁平化随动收口批（#713）落盘后（339 ⇒ 338）；更前实读 2026-10-01——轻通道轮四码面笔后（333 ⇒ 339〔门实读〕）；前读 **333**〔实读 2026-09-30——门回填〕；更前 331；前史 332（口子清零二轮（面 20 段覆盖）后）；**越 300** ⇒ 越层在册——见 `PROJECT.md` §4.1 越层段） | 核类名 → 桌面变量映射（md 产出 / 推理块 / 复制钮 / `tk-*` 高亮族；**#518 批**：+两值规则（子块内容高 60px ∕ 表头 0.75——值源 = `thincoder-vscode/webview/chat.css:466-467`；**让位修复批**：+出口钮规则（`sub-follow-btn`）——现行 ⇒ 预期 = `docs/desktop/design/ACTIVITY.md` §4.2 本批行）） |
| `thincoder-desktop/renderer/core-markdown.css`（#510 拆档产出） | **191**（实读 2026-09-29） | 核 Markdown 产出 → 桌面变量映射（面 1–17；自 `core.css` 拆出） |
| `thincoder-desktop/renderer/i18n.mjs` | **415**（实读 2026-10-03——轻通道轮八（412 ⇒ 415——键数链注续链（`VIEWS_DICT` 138 ⇒ 139 ∥ `HOST_DICT` 313 ⇒ 314）——fallback 澄清键两语 + 链注三行）；非结构性触碰 ⇒ **续期**；**仍越 300 ⇒ 越层在册（`docs/desktop/design/PROJECT.md` §4.1 越层段——续期；≤500 ✓）**））；前读 **412**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（408 ⇒ 412——键数链注续链（`VIEWS_DICT` 137 ⇒ 138 ∥ `HOST_DICT` 312 ⇒ 313）；非结构性触碰 ⇒ **续期**）；前读 **408**（实读 2026-10-02——**桌面 UX 收尾批（#697）实施落盘**（404 ⇒ 408——键数链注续链（`HOST_DICT` 308 ⇒ 312——届盘实读））；前读 **404**（实读 2026-10-01——**#761 落盘后**（394 ⇒ 404——键数链回填：`HOST_DICT` ⇒ 308）；前读 **394**（实读 2026-09-30——门回填（池宽拖动等近批词键随动）；前读 391（撤会话头批后）；前史：i18n 拆分批落值 500 ⇒ 393（`settings.*` 族 55 键出档 ⇒ 新档 `thincoder-desktop/renderer/i18n-settings.mjs`）））） | 词表面：核域键取 `config:read` 语言面下发投影（`docs/desktop/design/IPC.md` §2）+ 宿主 UI 专有键（两语——批 9 补设置面 / 向导两族；批 A 补输入区 / 提问卡 / 计划卡 / 队列满四族）+ `t()`；**批 B 补四族**：会话头三值 / 附件（含 `nonvision` / `partial` 两降级提示）/ 复制 / 状态栏读数；批 A 后**越 300**：拆分预案 = 词族按视图面拆第二档（**本批落形**——新档 `thincoder-desktop/renderer/i18n-views.mjs`（**已落**）承本批新增词族）；**批 B 追加轮**：增引导面两键（`chat.guide.noProject` / `chat.guide.noSession`——zh / en 各一）；**i18n 拆分批（2026-09-29 · 台账 #614）**：设置面词族（`settings.*` 55 键）出档第四档 `thincoder-desktop/renderer/i18n-settings.mjs` ⇒ 本档自有 142 ⇒ 87 键（合并表 `HOST_DICT` **294** 值零动）；**撤会话头批**：`head.field.*` 三键两语退场（`head.*` 段注收正） |
| `thincoder-desktop/renderer/i18n-views.mjs`（对齐第三批拆分产出） | **386**（实读 2026-10-03——轻通道轮八（380 ⇒ 386——fallback 澄清键 `composer.send.noDefaultModelFallback` 两语键值 + 两语类注（4 行）；非结构性触碰 ⇒ **续期**；**越 300 ⇒ 越层在册（`docs/desktop/design/PROJECT.md` §4.1 越层段——续期；≤500 ✓）**））；前读 **380**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（374 ⇒ 380——`composer.send.noDefaultModel` 两语键值 + 两语类注；非结构性触碰 ⇒ **续期**）；前读 **374**（实读 2026-10-02——**桌面 UX 收尾批（#697）实施落盘**（362 ⇒ 374——P1 两键（`settings.indexDbSizeLabel` ∥ `settings.indexOriginCounts`）两语键值 + 组注 ∕ 键面注）；前读 **362**（实读 2026-10-01——**#761 落盘后**（336 ⇒ 348 ⇒ 362——+9 键 × 2 语）；前读 **336**（实读 2026-09-29——口子清零二轮随动后（`composer.send.noProvider` 两语）））） | 词族第二档（按视图面分组；合并点 = `initDict` 装配——自 `thincoder-desktop/renderer/i18n.mjs`） |
| `thincoder-desktop/renderer/i18n-composer.mjs`（输入面板上提批拆档产出） | **92**（实读 2026-09-29） | 输入面板词族第三档（两语 VSC 逐字——核件 composer 组取词面） |
| `thincoder-desktop/renderer/i18n-settings.mjs`（i18n 拆分批产出） | **152**（实读 2026-10-04——泛化编辑器退役批实施落盘（156 ⇒ 152：`settings.agent.readonly` ∥ `.save` 两键两语净删）；前读 **156**（实读 2026-10-02——轻通道轮六（152 ⇒ 156：`verify.okShort` ∥ `verify.failShort` 两键两语））） | 设置面词族第四档（`SETTINGS_DICT` 两语各 **60** 键（实读 2026-10-04——泛化批净删两键 ⇒ 62 ⇒ 60；T 批在飞：−`settings.model.tier` ⇒ 59（届盘为准）；键集相等且同序）——自 `thincoder-desktop/renderer/i18n.mjs` 整族出档（纯搬 + 原位展开）；合并点 = `HOST_DICT` 两语展开——单一装配点仍 = `initDict`） |
| `thincoder-desktop/src/main/project-info.mjs` | **181**（实读 2026-09-30——桌面残债批 #686 拒绝面两注句随动后；Δ0——前读 2026-09-29 同值） | 项目级信息族（`ledger:read` / `batch:status`——台账经核动态 import；相位 = `readManifest(cwd)` **回执 `manifest.phase`**（无顶层 `phase`；非 ENOENT 读错上抛直传））——**判域在册（切片 3）：归本域**（台账行 = KD-38 ∥ 开项目成功链持有面；备选 = SESSIONS ∥ IPC——判读披露 = 批档 §2） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 4.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（i18n 拆分批 · 2026-09-29 · 台账 #614）行「实读落值」**（实读 2026-09-29 · 实施后届盘——内容行数口径；机制 ∕ 判据单源 = 批档 `docs/batches/2026-09-29-i18n-split.md` §2）：

| 文件 | 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/renderer/i18n.mjs` | **393**（500 ⇒ 393——`settings.*` 族 55 键出档（M1–M5 五处改点）；Δ = −107 · 护栏 ≤400 ✓ · 余量 107 ≥ 100；**仍越 300** ⇒ 越层在册见 `docs/desktop/design/PROJECT.md` §4.1） | i18n 拆分批 |
| `thincoder-desktop/renderer/i18n-settings.mjs`（新档） | **137**（第四档——`SETTINGS_DICT` 两语各 55 键 · 键集相等同序；合并点 = `HOST_DICT` 两语展开） | i18n 拆分批 |
| 测试面 | 批内件 `docs/batches/2026-09-29-i18n-split.test.mjs`（**129** 行 · A1–A6 5/5 pass）+ 基线件 `docs/batches/2026-09-29-i18n-split.baseline.json`（**595** 行——搬前 294×2 键序 ∕ 键值冻结） | i18n 拆分批 |
| `docs/desktop/design/PROJECT.md` + `docs/desktop/design/SHELL.md` | 文档面登记轮（§4.1 两行 + 越层段 + §4.2 本块；SHELL §1 树两节点行；本档词面指涉复核 = 零需改） | 本批（已落） |

**本批（撤会话头 + 工具头色批 · 2026-09-29 · 台账 #668 ∕ #669）行「现行 ⇒ 实读落值」**（实读 2026-09-30——内容行数口径；**已实施（2026-09-29 收口）——行值按现盘实读回填**；机制 ∕ 判据单源 = `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 ∕ 本档 §1 输入区行）：

| # | 档 | 现行 ⇒ 实读落值 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/index.html` | **56 ⇒ 55**（会话头槽行删 ∕ 骨架注释随动） | 撤会话头 |
| 2 | `mount-head.mjs` | **155 ⇒ 0**（**退役 · 删档——已落**（2026-09-29）；纯会话头接线（候选面 ∕ 写路 ∕ 回执刷行）退场；状态栏面住 `mount-status.mjs`，不动） | 撤会话头 |
| 3 | `thincoder-desktop/renderer/views/chrome.mjs` | **252 ⇒ 35**（头族全段退场；余 = `busyOf` ∕ `suspActiveOf` ∕ `BADGE_WORD` + 状态行三再出口） | 撤会话头 |
| 4 | `thincoder-desktop/renderer/app.mjs` | **299 ⇒ 289**（头接线八处退场：文档行 ∕ 两导入 ∕ 槽锚 ∕ 实例 ∕ `paintHead` ∕ 候选首取 ∕ 面表键） | 撤会话头 |
| 5 | `thincoder-desktop/renderer/frame-dispatch.mjs` | **55 ⇒ 52**（`HEAD_KEYS` + 头面行删；六面 ⇒ 五面） | 撤会话头 |
| 6 | `thincoder-desktop/renderer/chrome.css` | **291 ⇒ 268**（`.session-head` ∕ `.head-fields` ∕ `.head-field` 族删） | 撤会话头 |
| 7 | `thincoder-desktop/renderer/skin.css` | **18 ⇒ 13**（`.head-field` 交互态三值行删） | 撤会话头 |
| 8 | `thincoder-desktop/renderer/i18n.mjs` | **393 ⇒ 391**（`head.field.*` 三键两语退场 + 段注收正） | 撤会话头 |
| 9 | `thincoder-desktop/renderer/chat.css` | **327 ⇒ 329**（整行两态三规则退场 ∕ 段级四规则 + `time` 段落 ∕ 注释收正——净值近零） | 工具头色 |
| 10 | 设计档（`UI.md` ∕ `SHELL.md` ∕ `RENDERER.md` ∕ `IPC.md`） | 面名 ∕ 面数 ∕ 行族随动（逐处 = 各档变更记录行） | 两目 |
| 11 | 测试面 | 批内件 `docs/batches/2026-09-29-desktop-head-toolcolor.test.mjs`（单元测试档 · 不登记 · **实读 135 行 · 5 用例**〔T1–T5 · 复跑 5/5 绿〕）；仓套件（`thincoder-desktop/test/files.mjs` 空清单）零动 | 两目 |
| 12 | `docs/desktop/requirements/PROJECT.md` | §3.1 修订（**已落——父侧落笔 · 2026-09-29**：会话头行撤 ∕ 三值归属句 ⇒ 输入区控件行；图 ∕ 状态栏去重句同笔；需求档 `:269` 变更记录同笔） | 撤会话头 |

**本批（主题切换 · D33 · 2026-09-30 · 台账 #743 · 批 `docs/batches/2026-09-30-theme-switch.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/desktop/design/PROJECT.md` §2 **KD-61**（未迁行） ∥ 本档 §1「本批注（主题切换 · D33 · 2026-09-30）」∥ `docs/desktop/design/RENDERER.md` §1.4；**设计轮——产品码零触**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/theme.css` | **96 ⇒ ≈65**（双块收敛为单块 `light-dark()` 值对——24 对 + `--error-fg` 单值 + `color-scheme` 三态；`@media` 退场；基线四值逐字保原；非色变量（`--mono`）暗块同值重声明随块消解——单块单留；不入 `light-dark()`；档头注 ∥ 暗块互引注随正） | 值面单源 |
| 2 | `thincoder-desktop/renderer/theme.mjs`（已落） | — ⇒ **85**（实读 2026-10-02；三态面模块：键 ∥ `THEMES` 闭集 ∥ `initTheme` ∥ `setTheme`；注入缝 `{ doc, storage }` ⇒ 平 node 直测） | 状态单写者 |
| 3 | `thincoder-desktop/renderer/app.mjs` | **300 ⇒ ≈303**（装配期 `initTheme()` + 切片播种 + 注释——**越 300 咨询线，越层段在册**） | 装配 |
| 4 | `thincoder-desktop/renderer/store.mjs` | **303 ⇒ 304**（顶层切片 `theme` 初态 `"system"`——行级小修（越层在册；消解窗口顺延）） | 状态树 |
| 5 | `thincoder-desktop/renderer/mount-settings.mjs` | **184 ⇒ 185**（`SETTINGS_KEYS` 增 `theme`——设置面重绘触发键） | 重绘接线 |
| 6 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **227 ⇒ ≈240**（主题出口：`onSetTheme` ⇒ `setTheme` + 切片写 + 注释） | 出口族 |
| 7 | `thincoder-desktop/renderer/views/settings.mjs` | **336 ⇒ ≈357**（面头三态钮族 + 面模型 `theme` 读数 + 注释——越层在册，拆分预案保持） | 视图面 |
| 8 | `thincoder-desktop/renderer/settings.css` | **298 ⇒ ≈301**（主题钮族带上：容器 ∥ 当前态两规则 + 同族六组并入——**越 300 咨询线，越层段在册**） | 样式面 |
| 9 | `thincoder-desktop/renderer/i18n-settings.mjs` | **141 ⇒ ≈151**（四键 × 两语：`settings.theme` ∥ `.system` ∥ `.light` ∥ `.dark`——键链 `SETTINGS_DICT` **56 ⇒ 60** ∥ `HOST_DICT`（合并表）**295 ⇒ 299**；链行续写 = 实施轮） | 词面 |
| 10 | `thincoder-desktop/src/main/window.mjs` | **227 ⇒ 227**（注释两处随正——主题句 ⇒ 渲染面 `data-theme` 消费；`resolveTheme` 注释补系统事实面——**零行为改**） | 宿主注释 |
| 11 | 批内件 | `docs/batches/2026-09-30-theme-switch.test.mjs`（已建成 · 267 行——六腿（见 `docs/desktop/design/PROJECT.md` §6.1 本批块）；随批留存 · 不进仓套件） | 全批 |
| 12 | 设计档 | `docs/desktop/design/PROJECT.md` §2 **KD-61**（未迁行） ∕ §4.1 行（新档 + 三行实读收正 + 越层段）∥ §6.1 块 ∥ §7 **T-DSK54** ∥ §8 ∥ §10 **DB** ∥ 变更记录（原址）· 本档（§1 本批注 + §4.2 本块 + 变更记录）· `docs/desktop/design/{IPC,SHELL}.md` 档头 + 变更记录 | 全批 |

**本批（排版统一 · D29 · 2026-09-30 · 台账 #736 · 批 `docs/batches/2026-09-30-desktop-typography-unify.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2；**值改类档预期 = 估算**——实施批回填）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/theme.css` | **89 ⇒ ≈95**（`--font` 改指 `var(--mono)` + `--fs` ∥ `--lh` ∥ `--ls` 三变量（`--ls: normal`）+ body `font` 简写取 `--fs`/`--lh`/`--font` ∥ `letter-spacing: var(--ls)` 独立一行——基面单源） | 变量单源 |
| 2 | `thincoder-desktop/renderer/core-markdown.css` | **191 ⇒ 191**（值改零增行——正文族 ∥ 号 ∥ 行高改变量引用；`.code-lang` 10px ⇒ `var(--fs)`；标题 ∥ 码 ∥ 表相对修饰**不动**） | 内容面 |
| 3 | `thincoder-desktop/renderer/core.css` | **331 ⇒ 331**（值改零增行——推理 ∥ 复制钮 ∥ 子块 ∥ 卡族 10–12px ⇒ 基线；`font-weight` 去粗 ∥ tracking 撤（随基线）；**越 300 在册 ⇒ 本批触碰 = 行级小修（非结构性）⇒ 消解窗口顺延**） | 内容面 |
| 4 | `thincoder-desktop/renderer/chat.css` | **350 ⇒ 350**（值改零增行——工具卡 ∥ 结果区 ∥ 摘要 ∥ 消化 ∥ 待发送带 11 ∥ 12px 族 ⇒ 基线；`msg-label` 700 ∥ `chat-pending-label` 600 ⇒ 400；行高两处 ⇒ `var(--lh)`；**越 300 在册 ⇒ 本批触碰 = 行级小修（非结构性）⇒ 消解窗口顺延**） | 对话流 |
| 5 | `thincoder-desktop/renderer/chat-fixes.css` | **118 ⇒ 118**（值改零增行——错误详情 ∥ 台账行 ∥ 压缩行 ∥ diff 族 ∥ 欢迎条归基线；`welcome-heading` 600 ⇒ 400 ∥ 行高 ⇒ `var(--lh)`） | 小修族 |
| 6 | `thincoder-desktop/renderer/chrome.css` | **269 ⇒ 269**（值改零增行——状态行三段 ∥ 会话控制 ∥ 确认面 ∥ 引导行归基线；`.session-title` 500 ⇒ 400；8px ∥ 18px 两字形 ⇒ 基线；`line-height: 1` 两处 ⇒ `var(--lh)`） | 外壳 |
| 7 | `thincoder-desktop/renderer/session-list.css` | **169 ⇒ 169**（值改零增行——标题 13px ∥ 500 ⇒ 基线 ∥ 400；元数据 ∥ 位标 ∥ 两钮 ∥ 改名形归基线） | 会话面 |
| 8 | `thincoder-desktop/renderer/chat-cards.css` | **152 ⇒ 152**（值改零增行——审批 ∥ 提问 ∥ 计划 ∥ 目标卡族归基线；`question-mark` 700 ⇒ 400（accent 色位已有）） | 卡族 |
| 9 | `thincoder-desktop/renderer/pool.css` | **113 ⇒ 113**（值改零增行——池头 ∥ 读数 ∥ 族标 ∥ 计数钮归基线；`pool-title` 600 ⇒ 400 ∥ tracking 归零） | 池面 |
| 10 | `thincoder-desktop/renderer/settings.css` | **294 ⇒ 294**（值改零增行——标题 ∥ 段标 ∥ 标记 ∥ 提示 ∥ 向导步 ∥ 信息行归基线；两处 600 ⇒ 400；tracking 归零；关闭字形 `line-height: 1` ⇒ `var(--lh)`） | 设置面 |
| 11 | `thincoder-desktop/renderer/chat-composer.css` | **70 ⇒ ≈100**（**核件消费面覆盖段（新增）**——输入面板 ∥ 模型菜单 ∥ 搜索条 ∥ `auto-confirm` 同位族：特征度提升选择器 ⇒ 字号 ∥ 字重归基线（盒值 ∥ 描边零动）） | 核件消费面 |
| 12 | `thincoder-desktop/renderer/index.html` | **55 ⇒ 55（零改）** | 骨架 |
| 13 | 测试面 | 批内件两档——源扫描腿 `docs/batches/2026-09-30-desktop-typography-unify.test.mjs`（已建成 · 278 行 · 平 node：11 档 CSS + `index.html` 骨架源判据）+ 真机 computed 扫描腿 `docs/batches/2026-09-30-desktop-typography-unify-probe.mjs`（已建成 · 389 行 · 真 Electron 全栈扫描）；随批留存 · 不进仓套件（全清令）；真机走查 = 父侧闭合（D16 义务） | 全批 |
| 14 | 设计档 | `docs/desktop/design/PROJECT.md` §2 **KD-57**（未迁行）（决策）∥ §6.1 批注 ∥ §7 **T-DSK51** ∥ §10 **CV** · 本档（§1 本批注 + §4.2 本块 + 变更记录）· `docs/render-core/design/RENDER-CORE.md` §5 块 + 变更记录 | 全批 |

**值列口径**（本块）：「现行」= as-of 2026-09-30 实读（内容行数口径）；「预期」= 设计估算（值改类档 = 净 ±0；新段档 = 估增）——实施批回填终值。

## 变更记录

> **迁移前（≤ 2026-10-02）**：本段为迁移前历史记录（整块原样保留、不逐条改写）；迁移日后的变更记于各域档（新档自迁移日起记）。

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
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 1（评审轮 1）· eng-designer**——发现 3 / 4 / 6 / 7 逐号点修）：D24 注计数行控件族 **11 ⇒ 8 选择器**（与 `docs/desktop/design/PROJECT.md` D24 行同笔收正）· 本批注项 3 判据域写死为**代码树**（`⧉` ∕ 键字面零命中域——排除 `docs/`）+ ③ 机检载体改述（零测试件现状载体 + 单元测试档留待）· 输入区行补行内指针（尾控件 ∕ 尾锚退场 → 本批注项 2）。明细 = 批档 §2 修正轮节。
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
- 2026-09-30（**排版统一批（D29）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-typography-unify.md` §1 · 台账 #736 · 需求 D29）：§1 增「**本批注（排版统一 · D29 · 2026-09-30）**」七项（基线四值 ∥ 零粗体与颜色通道 ∥ markdown 修饰层 ∥ 核件消费面覆盖段 ∥ 外壳面收敛表 ∥ 判据 ∥ 边界）+ 主题 ∥ 对话流 ∥ 输入区三行行内指针；明细 = 批档 §2。
- 2026-09-30（**扁平化随动收口批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-flat-followups.md` §2 · 台账 #713）：残句补遗一处（§1「会话面板七条对位处置」⑦ 死引清）；D24 注「本批不动」清单 `.tool-result` 顶线残句删（线已随扁平化退场——零残留）。明细 = 批档 §2。
- 2026-09-30（**消化回流归位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-reflow-anchor.md` §2 · 台账 #738）：§1 对话流行 digest 句收正（**只留当前消化的这一轮**——新轮起跑清旧终态行；重载 ∥ 切走切回复列最新一条；行集 = 当轮〔终态非 ask 标签行退场〕；记录面全量照留）。**口径收正 = 用户 2026-09-30 15:4x ∥ 18:53 字面**。明细 = 批档 §2。
- 2026-09-30（**扁平化随动收口批 · 修复轮（评审轮 1 · 十号逐号）· eng-designer**——承 `docs/batches/2026-09-30-flat-followups.md` §3 轮次 1）：残体子句删两处（`:195` 旧裁定句 ∥ `:459` 原描边句）；计数行 `:266` 补「保留面 5」计数单位；「实施后待落」列单增订五处（`:250` 控件族 8 ⇒ 7 ∥ `:256` ∥ `:268①` 同清 ∥ `PROJECT.md:1111` T-DSK11 改指 ∥ U1 两档同拍）；
  「设置面 9 面」面级计数裁定句 + 实施后负向验收腿三入册。评审引用按现盘收正（UI.md 引用 −2 偏移在册）。明细 = 批档 §2 收正轮块。
- 2026-09-30（**消化回流归位批 · 修复轮（评审轮 1 · 发现 4 ∕ 7 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-reflow-anchor.md` §3 轮次 1）：「流内竖向间距」注项 5 **轮间死句收正**（`.chat-digest + .chat-digest` 不可达 ⇒ 单元素在场口径）；
  §1 对话流行 digest 句**同拍**（ask 档终态保留给由 + 行文取值 ∥ `digest.done` ∕ `digest.aborted` 可达面 = 计数行）。**零新语义**（收正）。明细 = 批档 §2 收正轮块。
- 2026-09-30（**右栏宽度拖动批（D30 · 台账 #742）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-pool-width-drag.md` §1）：§1 增「**本批注（右栏宽度拖动 · D30 · 2026-09-30）**」六项（拖柄形态 ∥ 交互三段 ∥ 范围上下限 ∥ 持久化载体 ∥ 仲裁判句 ∥ 边界）+ 布局行行内指针 + open 行池面窄窗态补「拖动侧已定形 ∕ 未拖过态仍 open」；
  档头需求侧行 **D1–D29 ⇒ D1–D30**；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-58**。明细 = 批档 §2。
- 2026-09-30（**右栏宽度拖动批 · 修复轮（评审轮 1 · §3 · 发现 1 ∥ 5 ∥ 6 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-pool-width-drag.md` §3 轮次 1）：本批注**项 2** ③ 补**落定前置（刷一拍）**（rAF 待写在场 ⇒ 撤帧 + 同步落待值——末位不丢 ∥ 落定后零迟到写）∥
  **项 2** ② 点名**写径 = CSSOM**（`style` 属性径禁——平台行为未核）∥ **项 1** 样式族补 `touch-action: none` ∥ **项 6** 边界点明**输入面 = pointer 事件族**（触控同径）。**零新语义**（序 ∥ 写径 ∥ 输入面收正）。明细 = 批档 §2 修复轮块。
- 2026-09-30（**窗口重启最大化批 · 随修（一致性收扫）· eng-designer**）：档头需求侧行 **D1–D30 ⇒ D1–D31**——零语义枚举随动。明细 = 批档 §2。

- 2026-09-30（**三端消化面统一批 · 重写设计轮 · eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §1 ∥ §2 · 台账 #747）：§1 对话流行 digest 句收正——**逐轮累积（零摘除）∥ 标签行恒在 ∥ 归档 = 回收窗触发 + 消费轮边界物落位（座次入模）∥ 复列 = 页内全量轮 + 消费轮配对**；间距注项 5 轮间句收正（累积后可达——规则复归）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 修复轮（评审轮 1 · 发现 1 ∥ 3 + 范围增补〔块族态名〕· 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §3 轮次 1 ∥ 用户 22:26 裁定）：§1 对话流行 digest 句随「**无轮容器**」裁收正；「对齐第二批 · 六件」项 5 归档锚句按 `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条收正（唯边界物——删「唯经块序守卫 ∕ 两径皆落块序尾位」）∥ 块序句收正（座次序）∥ 归档句（`:122`）同拍；间距注项 1 ∥ 5 容器类 ⇒ 行元素面；**块族态名 = 等待消化**（`awaitingDigest`）——`:122` ∥ `:327` ∥ `:333` 态名语义「驻留」收正（非态名语义保留）。**零新语义**（裁定落形 ∥ 收正）。明细 = 批档 §2 修复轮块。
- 2026-09-30（**三端消化面统一批 · 实施后收正轮（#747 实施交付）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §5 ∥ §2）：本档**零内容改**（收正落于 `docs/desktop/design/PROJECT.md` §4.1 ∕ §4.2 ∥ §7 与 `docs/desktop/design/RENDERER.md` §1.1——本行 = 登记面随动）。**零新语义**。明细 = 批档 §2 实施后收正轮块。
- 2026-09-30（**主题切换批（D33 · 台账 #743）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §1 骨架 + 需求 D33）：§1 增「**本批注（主题切换 · D33 · 2026-09-30 · 台账 #743）**」六项（三态语义与状态载体 ∥ 值面结构 ∥ 切换控件 ∥ 持久化 ∥ 判据 ∥ 边界）+ 主题 ∥ 设置面两行行内指针；
  D24 注两处计数镜像收正（控件族 8 ⇒ 9 ∕ 次级 6 ⇒ 7——主题族同带；「主题变量块两套计数不变」⇒ 单块 `light-dark()` 值对）；档头需求侧行 **D1–D31 ⇒ D1–D33**；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-61**。明细 = 批档 §2。
- 2026-10-01（**消化行只留当轮收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 ∥ §2 · 台账 #754）：§1 对话流行 digest 句收正——**只留当轮（新轮起跑 ⇒ 旧轮行族退场）∥ 终态非 ask 标签行退场（ask 档保留）∥ 复列 = 最新一条**；间距注项 5 轮间句收正（在场 ≤ 1 ⇒ 相邻选择器不可达）。**口径 = 用户 2026-09-30 18:53 ∥ 19:01 字面（#747 之累积 ∥ 标签恒在随本批退场）· 产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**主题切换批（D33 · 台账 #743）· 修复轮（评审轮 1 · 发现 5）· eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §2 修复轮块）：§1 本批注项 2 值面结构补半句（非色变量（`--mono`）暗块同值重声明随块消解——单块单留；不入 `light-dark()`）；计数账三档同拍 = `docs/desktop/design/PROJECT.md` §4.2 ∥ `docs/desktop/design/RENDERER.md` §1.4。**零新语义**（结构收正——零值改）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**轻通道轮三收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-3.md` §1 · 台账 #758）：§1 本批注（排版统一 · D29）项 1 字族条收正——`--mono` 栈 = **Cascadia Mono 首字 + 中文雅黑入栈**；系统依赖在册（Cascadia 用户级安装〔两档 + 两注册〕；未装回落 Consolas——仓内零资产）。**零新语义**（表述收正——值面定版在盘）。明细 = 批档 §2。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 + 扩展设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §3 轮次 1 + 用户 01:48–02:08 · 台账 #754）：§1 对话流行 digest 句补**三端通判 ∥ 真不留**（02:03 ∥ 02:05）；§2 项 5 **块序句 ∥ 归档锚句翻转**（归档块居其消费轮行族**之后**——族末之后；旧「标签行之前——唯边界物」句不留——评审发现 1 副本收正）。**产品码零触（设计轮）**。明细 = 批档 §2 修复轮 + 扩展轮块。
- 2026-10-01（**轻通道轮四收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-4.md` §1 · 台账 #759）：间距注随全族归一收正（注头 + 项 1 ∥ 2 ∥ 6——16 ∥ 8 ⇒ **8px 单值**；承接条落点随动 `:47-52`）；本批注（排版统一 · D29）项 1 行高条收正（`--lh` **1.3**）；本批注（主题切换 · D33）项 2 ∥（R12）项 2 两处指针随动。**零新语义**（值面收正——定版在盘）。明细 = 批档 §2。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 设计轮 · eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §1 ∥ §2 · 台账 #761）：
  §1 增「**本批注（slash 命令面 · 2026-10-01 · 台账 #761）**」七项（触发 ∥ 在册命令 4+别名 2 ∥ 执行与消费面 ∥ 忙态同钮门 ∥ 词键三键 ∥ 判据 ∥ 边界）+ 输入区行行内指针 + 表行 15（`/:` 键位组）依据重锚（命令面已在册；「提示不入段」裁定保留）；机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-12**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**轻通道轮四收尾 · §2 增量（笔 6–12）· eng-designer**——承 `docs/batches/2026-10-01-light-round-4.md` §1 ∥ §2 · 台账 #759）：本批注（排版统一 · D29）项 1 字号条收正（`--fs` **12px**——笔 11–12）；间距注项 6 验证行改**行律随字号联动**（12 × 1.3 = 15.6px）+ **增项 7（轮四流形三件：工具头箭头 ∥ 展开体左流线 ∥ 思考块底色撤）**。**零新语义**（值面收正）。明细 = 批档 §2 增量块。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 2（评审轮 2 · 八发现逐号）· eng-designer**——承批档 §3 轮次 2 · 台账 #754）：§2 项 5 **归档句收正**（归档块居消费轮族末（状态行）之后——旧「居消费行族之前」句清；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。**零新语义**（副本收正）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 修复轮 1（评审轮 1 · 七发现逐号）· eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §3 轮次 1 · 台账 #761 · 明细 = 批档 §2 修复轮块）：本批注项 3 收正——「零消息径上行」口径 + 补注（模式三钮动作照走 `session:flags`——同钮径不变）∥ `run` 返值改述（**已受理**/未受理——`/auto` popover 径同判）；本批注项 6 腿集补两腿（`/auto` popover ∧ 忙态 `/plan`）+ 全表指针；「回合中插入」注项 5 依据重锚（**斜杠提交面拦截、不进队**——队列侧防御语义保留）。**零新语义**（口径收一 ∥ 枚举对齐 ∥ 依据重锚）。
- 2026-10-01（**桌面消化痕彻底拆批（座次机拆除 + 单体重建）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §2 · 台账 #765）：§2 项 5 **块序句 ∥ 归档锚句随 #765 收正**（消费轮**族尾锚**——座次机拆除 ∥ 锚改静态；单源 = `docs/desktop/design/RENDERER.md` §1.1 插入点纪律条）。**零新语义**（副本随单源收正）。明细 = 批档 §2。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 增量块（`/help`）· initial 轮 · eng-designer**——承本批 §1 增量（用户 04:15 ∥ 04:18 直斥 + 派单）· 台账 #761 · 明细 = 批档 §2.10）：本批注增**项 8**（`/help` = 流内打印形——标签 ∥ 组序 ∥ 命令行逐行；行族 `[data-help]` 非块 · 尾组槽位 ∥ 运行期痕 ∥ 受理 + 回底；禁浮层 ∥ 禁 toast 主体 ∥ 禁交互式列表）；项 2 收正（**5 条 + 别名 3**——+`/help` `/h`）∥ 项 5 收正（+6 键 ∥ `slash.unknown` 携指引）∥ 项 6 收正（+`/help` 腿）∥ 项 7 **边界句「`/help`（需列表面）」删除**（其余 22 条）；输入区行 ∥ 对话流行指针随动。**零新语义**（增量落形 ∥ 条目随动）。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 1 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §2 修复轮块 · 台账 #765）：§2 项 5 两处随 F2 零存储收正（「锚改静态」⇒「**锚整删（F2 零存储）**」——归档随到入流 ∥ 重挂捕位复列；单源 = `docs/desktop/design/RENDERER.md` §1.1「消化面落位与重挂规则」条）。**零新语义**（裁落形）。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 2 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §3 轮次 2 · 台账 #765）：§1 对话流行「归档锚」标 ⇒ 「**归档落位**」（随到达入流——端面旧锚面函数随实施轮清；单源 = `docs/desktop/design/RENDERER.md` §1.1）。**零新语义**（残标收正）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面消化痕彻底拆批 · 副本面清面轮（基础重裁对齐）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §2 基础重裁块上抛① · 台账 #765）：§1 对话流行 digest 句 ∥ §2 项 5 归档句逐处对齐新单源（条名指针 ⇒ 「流内消化行族」条 ∥ 「消化行入流与重放规则」条；消化痕 = **流内普通项**——「非块节点」物种措辞与 `[data-pending]` 先例引退场（不占块序 / 不动 `data-blocks` 事实句保留——沿两端实形）；复列 = 记录位次复列（零配对）；归档 = 随到达入流（当刻流末））。**零新语义**（副本随单源对齐）。明细 = 批档 §2 清面轮块。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 2 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §2 修复轮 2 块）：§1「批 B 追加注」项 2 连带句**措辞收正**——「对话流重挂键集」⇒「对话流帧触发键集」（`project` 键承接 = 刷面，零重挂；单源 = `docs/desktop/design/RENDERER.md` §1.1「建」条）；`CHAT_KEYS` 键名单事实句零动。**零新语义**。
- 2026-10-01（**消化行自然形收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §1 ∥ §2 · 台账 #768）：§1 对话流行 digest 句收正——**自然形（行出即留——全轮在流；终态 = 追加新行（锚 `data-digest-end`）；零清理机器）∥ 复列 = 全量完整轮**；间距注项 5 收正（轮间相邻可达——补「轮间 = 基规则 8px」条 ∥ 族内相邻 0 保留）。口径 = 批档 §1（用户 2026-10-01 07:54 ∥ 07:58 直斥）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**消化行自然形收正批 · 修复轮（评审轮 1 · 发现 3）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §3 轮次 1）：档头需求侧行 **D1–D33 ⇒ D1–D34**——零语义枚举随动。明细 = 批档 §2 修复轮块。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇落地轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：M19 补「目标面板」行（计划面邻后——`goal.mjs` 悬空引用自解）∥ M7 项目级读数行整行退场。明细 = 批档 §2。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇补收轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：#461 批注项 5 整项退场（信息行复读链随 M7 删——对象已删不留修订式痕迹）∥ 状态行补漏注边界句 `mount-info` 复读面残引去。明细 = 批档 §2。
- 2026-10-01（**复核扫面收正批 · M7 派生残引清（父侧直接执行〔③ 类小笔〕 · 可 revert）**）：档头板块列去「项目级读数」∥ 可见面修复注首句去「项目级信息」+ 计数六行 ⇒ 五行 ∥ 排版统一「全栈单一」列去「信息行」。**零新语义**（残引 ∥ 计数收正——明细 = 批档 `docs/batches/2026-10-01-audit-remediation.md` §2 尾）。
- 2026-10-01（**记录清账批 · 文档面收正轮 · eng-designer**——承 `docs/batches/2026-10-01-records-docs-reconcile.md` §2 · 台账 #778）：可见面修复注引言映射收正——行列去「审批呈现」（端侧面已归核——无该针；沿 M7 派生残引清「六行 ⇒ 五行」同式）+ 题头 ∥ 引句「五件 ⇒ 四件」（#461 项 5 已退场——计数收正；引句五处同拍）。**零新语义**（映射 ∥ 计数收正）。明细 = 批档 §2。
- 2026-10-01（**消化重放口径批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §1 ∥ §2 · 台账 #771 ∥ #773）：§1 对话流行 digest 句随动——复列**全量（未结轮照现）** ∥ `n = 0` 零终态行守句；未结轮归属（折叠侧承接 ∥ 运行期兜底）。**零新语义**（副本随单源对齐）。明细 = 批档 §2。
- 2026-10-01（**桌面二择裁定批（#780 ∥ #782）· 实施轮（产品码 + 设计档同笔）· eng-coder**——承批档 `docs/batches/2026-10-01-desktop-pair-decisions.md` §2 ∥ §4 · 台账 #780 ∥ #782）：§1 提问呈现行**清码判据句收正**（清码 = 两族皆清 —— 跨族零误清两向同闭）+ 码位两面坐标族按符号收正（`onQuestion` ⇒ `renderer/questions.mjs` ∥ `clearQuestion` ⇒ `questions.mjs` ∥ `clearApproval` ⇒ `events.mjs` ∥ `denyGates` ⇒ `suspensions.mjs:82`——死指针清）；§2 项 2 增**清码判据**（位标面单源 = `badges.mjs` `hasPendingFor`）。**零新语义**（判据单源收正）。明细 = 批档 §5。
- 2026-10-01（**消化重放口径批 · 修复轮（评审轮 1 · 发现 1）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §3 轮次 1 · 台账 #771 ∥ #773）：§1 对话流行「未结轮归属」副本随单源收正（**活流侧优先**——运行期未结轮在场 ⇒ 折叠未结末轮不并入）。**零新语义**（副本随单源对齐）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**轻通道轮五收尾 · 设计形式化 · eng-designer**——承 `docs/batches/2026-10-01-light-round-5.md` §1 · 台账 #808）：本批注（排版统一 · D29）项 1 字号条收正（`--fs` **14px**——轮五定版）∥ 间距注项 6 验证行随动（14 × 1.3 = 18.2px）∥ 会话面板收正指针对照值随动（`var(--fs)` 14px——轻通道轮五）∥ 主题切换注项 2 指针行锚按盘核对（`:593` ⇒ `:591`）。**零新语义**（值面收正——定版在盘）。明细 = 批档 §2。
- 2026-10-02（**菜单体系批 · 设计轮 · eng-designer**——承 `docs/batches/2026-10-02-desktop-menu-system.md` §2 · 台账 #811 · 需求 D36）：§1 增「本批注（菜单体系 · D36 · 2026-10-02 · 台账 #811）」五项（菜单树 ∥ 交互落径 ∥ 键盘可达 ∥ 判据 ∥ 边界）；档头需求侧行 **D1–D34 ⇒ D1–D36**；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-65**。明细 = 批档 §2。
- 2026-10-02（**设置面样式收正批 · 设计轮 · eng-designer**——承 `docs/batches/2026-10-02-desktop-settings-layout.md` §2 · 台账 #812 · 需求 D37）：§1 增「**本批注（设置面样式收正 · D37 · 2026-10-02 · 台账 #812）**」八项（收正四则 ∥ 渠道两行卡 ∥ 六段带上 ∥ 拨杆形 ∥ 端差五 ∥ 判据 ∥ 边界 ∥ 计数）+ 设置面行尾行内指针；档头需求侧行 **D1–D36 ⇒ D1–D37**。明细 = 批档 §2。
- 2026-10-02（**菜单体系批 · 修复轮 2（第 8 条 · 主题▸勾选态落地——用户 10:18 裁 ②「带勾」）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §2.7 ∥ §3 轮次 1）：本批注项 1 主题▸补**当前生效主题带勾** ∥ 项 2 主题落径补**落地值回读主进程**（`theme:state` ⇒ 菜单勾随动）∥ 项 4 判据随动（树形含带勾态 ∥ 通道双表含 `theme:state` ∥ 真机 + 主题勾随动）∥ 项 5 边界句收正（勾选态在——限度 = 报告缓存；其余条目零选中态）。**零新语义**。明细 = 批档 §2.8。
- 2026-10-02（**设置面样式收正批 · 修复轮（用户 2026-10-02 10:27 两项裁定落地）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2 · 台账 #812）：本批注项 1 ③ 收正（**卡界 = VSC 实形**——1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`）；卡底零独立填充）· 项 2 去「卡界描边」不采用条 · 项 5 端差 **5 ⇒ 4**（① 卡界条消退；圆角条收窄为余域——卡例同形）· 项 8 计数同拍；设置面行 ∥ D24 注同族残句清（`.settings-row` 行去升底 ∥ 活动行注去「行自持升底」）。**零新语义**。明细 = 批档 §2.12。
- 2026-10-02（**菜单体系批 · 修复轮 3（设计评审轮次 2 · 发现 1–5 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §3 轮次 2 · 台账 #811）：本批注前言通道面并点 `docs/desktop/design/IPC.md` §2 `theme:state` 行 ∥ 项 1 主题▸序补**需求档字面序保持**注（实现序 = `THEMES` 闭集序——沿项 3 记法注先例）∥ D33 本批注项 6「主进程不持用户值」补显示缓存限定（不以用户值驱动原生面——唯菜单勾选态显示缓存一枚（**KD-65** ②））+ 两处按行宽拆行。**零新语义**（指针 ∥ 注 ∥ 限定收正）。明细 = 批档 §2.9。
- 2026-10-02（**设置面样式收正批 · 修复轮 1（设计评审轮次 1 · 发现 1–6 ∥ 8 ∥ 9 逐号 · 父侧裁 = 全采纳；第 7 号 = 需求档面归父侧笔）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §3 轮次 1 · 台账 #812）：
  设置面行「行升底」残句收正（**卡界让位**——升底让位 ∥ 1px 描边 + 圆角 6px）· 本批注项 1① 豁免锚点名（`[data-unavailable-reason]`——既有锚）· 项 2 动作簇序明示（**现盘序保持**）· 项 6 判据 **四腿 ⇒ 五腿**（+卡界源扫）；D24 注项 5 活动 / 当前行 mix 基色收正（`--bg-raised` ⇒ `--bg`——行域静息底一致）· 项 7 负向锁纳 `.settings-row` + 真机腿补豁免注。**零新语义**（收正 ∥ 计数 ∥ 点名）。明细 = 批档 §2.13。
- 2026-10-02（**设置面样式收正批 · 代码评审两裁设计面收正轮（①④ 定形）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §5 五⑤⑥ ∥ §6.1 · 台账 #812）：本批注项 1① 补则两件（**只读字段行收束**——`.settings-field-readonly` 补缩省略四件 + 提示词面 `.settings-readonly-hint` `flex: 0 0 auto` 不缩；**MCP 展开面 = 全显豁免**——`.settings-mcp-detail` 域值面 `white-space: normal` + `overflow-wrap: anywhere`；行族通则本体零动）；投影单源 = `docs/desktop/design/PROJECT.md` §2 **KD-66** ③ 补则。**零新语义 · 产品码零触**。明细 = 批档 §2.14。
- 2026-10-02（**设置面样式收正批 · 文档回填轮（实施后 · 判据面批内件转正）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2.15 · 台账 #812）：本批注项 6 机检面批内件「（拟新增）」⇒「**已建成 · 219 行 · 五腿 · 9 用例**」（行数 ∥ 腿集实读 = `docs/desktop/design/PROJECT.md` §4.2 本批块 ∥ §6.1 本批块）。**零新语义**（转正 ∥ 读数）。明细 = 批档 §2.15。
- 2026-10-02（**菜单体系批 · 判据面批内件「（拟新增）」陈标末笔（父侧直接执行〔机械标面 · 可 revert〕）**）：本批注项 4 机检面 ⇒「已建成 · 300 行 · 8/8 绿」；随 `docs/desktop/design/PROJECT.md` 同名族同笔。**零新语义**。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2b · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：本域**行四 + 块十一** ⇒ 指针——行四（启动态 ∥ 会话控制面 ∥ 设置面 ∥ 首启向导）∥ 块十一（批 B 注项 5 ∥ 对齐重定位项 4 ∥ D21 项 2 + 9 面表 ∥ 会话面板七条 ∥ 账本警示注 ∥ 对齐第三批 P12 ∥ P14 ∥ P15 ∥ F-Esc ∥ parity-b10-ui 注 ∥ 重建保真项 1 ∥ D37 注）——落点 = `docs/desktop/design/SESSIONS.md` §2 各节 ∥ `docs/desktop/design/SETTINGS.md` §2 各节；原址各留一行指针。**零新语义**（拆分迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4 新立**（文件账）——§4.1 本域族行 **18** 行（自 `docs/desktop/design/PROJECT.md` §4.1 逐字迁入——`index.html` ∥ `theme.css` ∥ `chrome.css` ∥ `skin.css` ∥ `theme.mjs` ∥ `search.mjs` ∥ `views/chrome.mjs` ∥ `statusline` 四件 ∥ `core.css` ∥ `core-markdown.css` ∥ i18n 四件 ∥ `project-info.mjs`；原址各改一行指针）＋ §4.2 批块 **4 块**（i18n 拆分批 ∥ 撤会话头 + 工具头色 ∥ 主题切换 ∥ 排版统一——迁自 §4.2；块内「本档」类回指按新落点改指）。**零新语义**（迁移 ∥ 指针 ∥ 判域在册）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**2a 遗留四项收口 + 档头余项**——① 「对齐第三批」混合块逐项剪枝（A 12 项 → `docs/desktop/design/CHAT.md` §2；B1–B3 → 同档；B5/B6 → `docs/desktop/design/ACTIVITY.md` §2；B12/14/15 → `docs/desktop/design/SESSIONS.md` §2.6 ∥ `docs/desktop/design/SETTINGS.md` §2.3；B22/26/28 → `docs/desktop/design/COMPOSER.md` §2；C 两条 ∥ F-置焦 → CHAT §2；**B7 心跳 = 本档存留**；D 计数 → 紧凑行）② 「重建保真」②③ → `docs/desktop/design/RENDERER.md` §1.1/§3 指针化（核实现位在 RENDERER——零再迁）③ §2 项 3 + 旁证 → `docs/desktop/design/SESSIONS.md` §2.7 指针 ④ RENDERER「UI 半」= 核实现位在 RENDERER §1.1——UI 侧指针化；档头补「域档」导航行。**切割报回**：内部回指全量重扫 = 以门为证（悬空 Δ 零新增）；逐条直指化未做——列报为余量。**零新语义**（剪枝 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2c（降格收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §1 ∥ §2 · 台账 #813）：**本档降格 = 总则 ∥ 状态行 ∥ 视觉基线**——档头定位句收正 + §1 面群分区导读落（① 总则 ∥ ② 状态行 ∥ ③ 视觉基线 ∥ ④ 域面行）＋ **内部回指直指化**（已迁注块引用逐条 ⇒ 域档直指：CHAT ∥ COMPOSER ∥ ACTIVITY ∥ SETTINGS §2）；变更记录「迁移前（≤ 2026-10-02）」标记落。**零新语义**（重排 ∥ 指针 ∥ 定界）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**设置菜单升级批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §2 · 台账 #817 · 需求 D38 ∥ D39）：§1 增「本批注（设置菜单升级 · D38 ∥ D39 · 2026-10-02 · 台账 #817）」指针行（→ `docs/desktop/design/MENU.md` §2 ∥ `docs/desktop/design/SETTINGS.md` §2.10——界面形态与交互；沿本档迁移后指针形）。**零新语义**（指针）。明细 = 批档 §2。
- 2026-10-02（**轻通道轮六收尾 · 计数随动 · eng-designer**——承批档 `docs/batches/2026-10-02-light-round-6.md` §1 ∥ §2 · 台账 #819）：§4.1 `i18n-settings.mjs` 行随动（**152 ⇒ 156**；`SETTINGS_DICT` 两语各 **60 ⇒ 62** 键——轮六 两键）。**零新语义**（计数）。明细 = 批档 §2。
- 2026-10-02（**桌面 UX 收尾批 · 回填/随动轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §5 · 台账 #697）：§4.1 两行实读对盘（`i18n.mjs` **404 ⇒ 408** ∥ `i18n-views.mjs` **362 ⇒ 374**——P1 两键实施落盘）；越 300 判定句收正（续期——引 `docs/desktop/design/PROJECT.md` §4.1 越层段）+ 两行「见下行」相对指针收正（改显式引越层段）+ 陈旧「护栏 ≤400 ✓」删（i18n 拆分批批内护栏——#761 起已失实）+ 两行尾括号闭合配平（489 含旧缺 1）。**零新语义**（读数 ∕ 判定句 ∕ 指针 ∕ 行式）。明细 = 批档 §2。
- 2026-10-02（**文档清账轮 · 执行轮 5（桌面重段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 2 处处置（R3 裸名化 1——`mount-head.mjs` 已删档去目录段；R1 改指 1——`thincoder-desktop/test/files.mjs` 补前缀）；宽面 7 行折行（57 ∥ 66 ∥ 174 ∥ 276 ∥ 296 ∥ 371 ∥ 372——语义零改）。**零新语义**。
- 2026-10-03（**首跑渠道提示修复批 · 实施后文档面回填轮（§4.1 两行走读齐平）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 ∥ §5 · 台账 #840）：§4.1 两行实读对盘（`i18n.mjs` **408 ⇒ 412**——键数链注续链（`VIEWS_DICT` 137 ⇒ 138 ∥ `HOST_DICT` 312 ⇒ 313）∥ `i18n-views.mjs` **374 ⇒ 380**——`composer.send.noDefaultModel` 两语键值 + 两语类注）；越 300 判定句随正（续期——引 `docs/desktop/design/PROJECT.md` §4.1 越层段）。**零新语义**（读数）。明细 = 批档 §5。
- 2026-10-03（**轻通道轮八 · 收口形式化轮（§4.1 两行走读齐平）· eng-designer**——承批档 `docs/batches/2026-10-03-light-round-8.md` §2 · 台账 #879）：§4.1 两行实读对盘（`i18n.mjs` **412 ⇒ 415**——键数链注续链（`VIEWS_DICT` 138 ⇒ 139 ∥ `HOST_DICT` 313 ⇒ 314）∥ `i18n-views.mjs` **380 ⇒ 386**——fallback 澄清键 `composer.send.noDefaultModelFallback` 两语键值 + 两语类注）；越 300 判定句随正（续期——引 `docs/desktop/design/PROJECT.md` §4.1 越层段）。**零新语义**（读数）。明细 = 批档 §2。
- 2026-10-03（**ledger-family-aggregate 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-10-03-ledger-family-aggregate.md` §1 · 台账 #882）：§1 表行 11 ∥「本批注（状态行 ⇒ CLI 补漏 · 2026-09-29）」项 2 两处随动——段 11 台账读数 = **当前打开范围合计**（范围判据单源 = `docs/core/design/LEDGER.md` §7.2）；桌面消费链零改（纯透传——端零重算）。明细 = 批档 §2。
- 2026-10-04（**渠道档位退役批（desktop-channel-tier-retire）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 · 台账 #902）：§1 批 B 注项 5 删（计数随正——四件）· 批 B 注前言语义单源列去「档位控件注」· 主题切换注「Auto 居首」先例引随删（缺省态居首直陈）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**泛化编辑器退役批 · 实施后面回填轮 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-desktop-generic-editor-retire.md` §5 · 台账 #903）：§4.1 `thincoder-desktop/renderer/i18n-settings.mjs` 行走读齐平（**156 ⇒ 152**——`settings.agent.readonly` ∥ `.save` 两键两语净删；`SETTINGS_DICT` 两语各 **62 ⇒ 60** 键；T 批在飞：−`settings.model.tier` ⇒ 59）。**零新语义**（读数）。
- 2026-10-04（**排队守卫假满队修复批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-composer-queue-gate-stick.md` §1 ∥ §2 · 用户 13:09 直裁 · 台账 #911）：§1 输入区行满队面① 收正——提交守卫判据句「镜像计数（宿主快照 + 本地先行增量）」⇒ **宿主镜像计数如实直读（端侧零增量；同 tick 空窗以宿主权威兜底）**；陈旧坐标 `:304-306` 去号（函数锚 `send()`）。**零新语义**（实现收正 ∥ 指针）。明细 = 批档 §2。
