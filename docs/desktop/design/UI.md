# 桌面端（DESKTOP）· 界面形态与交互

> 板块 = **桌面端界面形态与交互面**——布局 / 断点 / 标签条 / 左列会话行 / 状态词 / 交互键位 / 会话头 / 对话流 / 状态栏 / 审批与工具卡呈现 / 空态 / 启动态 / **项目级信息 / 设置面 / 首启向导** / 主题 / 键盘可达 / i18n，以及本会话活动池与状态位。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D12 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：有界渲染窗口 / 回填与跟滚 / 流式增量等**实现工艺** = `docs/desktop/design/RENDERER.md` · 进程与目录形态 = `docs/desktop/design/SHELL.md` · 通道与载荷 = `docs/desktop/design/IPC.md` · 总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 界面形态落定（UI / 交互决策）

| 面 | 决策 |
|---|---|
| 布局 | 三列：左（项目与会话）· 中（会话标签页 = 会话头 + 对话流）· 会话视图内右栏（本会话活动池，可折叠，折叠态按会话记忆） |
| 断点 | 窗口宽 < **900px** 时左列折叠为图标条——900px = 首版初值（**单断点常量**，调参面 = `thincoder-desktop/renderer/styles.css` 一处；**数值保 open**，实施批实测调） |
| 标签条 | 标签宽 ∈ **[1.75rem, 14rem]**（`min-w` / `max-w`——防挤没与防独占）；溢出 = 横向滚动 + 两端渐隐（`mask-image`）；**非活动标签置 `inert`**（不收 Tab 序、不响应焦点）；**落形** = 位标为标签子节点（文本取词 + `data-badge` 码，**空闲不落节点**——本档 §2 项 2）；关闭 / 新建控件字形住 `styles.css`（`content`）、词面经 `aria-label`（**视图档零字形字面**）；**接线**（批 5 落）= 标签点击激活（与左列点行**同一路**——激活即切换会话）· 关闭控件经确认面（本档 §1 交互行）· 新建控件 = `session:create` |
| 状态词 | **闭枚举 6 词**：排队中 · 运行中 · 待审批 · 完成 · 已停止 · 错误（词形与核 i18n / 需求档同源）——界面各处（工具卡 / 活动块 / 回合）取词一律出自本集，不得自造词；与 §2 项 2 的标签位集合（位标面）分属两面，不得互相顶替 |
| 交互 | Enter 发送 · Shift+Enter 换行 · Ctrl/Cmd+1..9 切标签 · **关闭确认面**：标签状态码集 ∩ {待审批, 运行中} ≠ ∅ ⇒ 需确认（判据单源 = `needsCloseConfirm`——消费面 = `thincoder-desktop/renderer/store.mjs`；不含者**直接关**）；**落形** = 树面关闭控件**原位换两键**（DOM 序 = 取消 → 确认；标签项 `data-confirm="1"`；词键 `tab.action.close.cancel` / `tab.action.close.confirm`；两键锚 = `data-action` `tab:close-cancel` / `tab:close-confirm` + class `tabbar-cancel` / `tabbar-confirm`）——否 dialog / `window.confirm` / 超时自动消 / 图标字形 |
| 会话头 | provider / 模型 / 推理档位 / 工程模式 / AUTO——**会话级**，切标签随之切换；状态栏不重复呈现（同一事实只出现一处）；**落形** = 字段值由供给面出串（视图只落结构 + `data-field` 锚，不造词、不猜形）；**供给未落 ⇒ 零字段节点**（禁假数据） |
| 对话流 | **三态**（`data-state`）：无活动会话 ⇒ `none`（零节点——**禁假数据**）· 有会话零块 ⇒ `empty`（词表提示）· 有块 ⇒ `flow`；**根锚全量**（四锚：`data-state` / `data-blocks` / `data-hidden` / `data-following`——语义 = 三态码 / **已渲染块数** / 未渲染更早块数（产出规则 = `docs/desktop/design/RENDERER.md` §2）/ 是否跟滚 `"1"` / `"0"`）；**块五型**（`user` / `assistant` / `reasoning` / `tool` / `error`）单序列、每块 `data-block-id` + `data-block-kind`，文本为纯文本（`pre-wrap`，零 Markdown / 零 HTML 注入）；**错误卡** = 回合级错误块（工具级错误 = 工具块 `status="error"`——`docs/desktop/design/IPC.md` §1 `ev:error` 双支）；**挂载根 = 滚动容器 `[data-slot="flow"]` 自身**（clear + build + append 不清宿主 ⇒ 滚动位置存活）；**摘要块**（未渲染更早块 > 0 ⇒ 首子，词键 `chat.summary.older`）· **药丸**（`!following` ⇒ 尾随，词键 `chat.pill.new` / `chat.pill.bottom`）；窗口 / 回填 / 跟滚三事住 `docs/desktop/design/RENDERER.md` §2 / §3 |
| 状态栏 | **位置 = 窗口级底行**（`.app` 第 4 子元素 · 跨三列——三列框外一行；地面 = 需求档 §3.1 图 `:42` + 实施批档 §5.5 项 1 落形）+ 活动会话上下文占用（实时读数；**≥ 80% 转警示色**）+ 非活动标签的待审批 / 运行提示（跨会话告警位）——两处皆**单点重建**（状态行唯一 writer）；**落形** = 告警位取值 = 非活动标签位标码（待审批 / 运行中——与标签位**同源同词**，优先序消费 = 标签切片单源，不由本面复制）；上下文读数**供给未落 ⇒ 零读数节点**（禁假数据） |
| 审批呈现 | 流内卡片（主）+ 本会话活动池计数 + 标签位（同一待决项三种视图）；**落形**（本批）= 卡为流内**独立节点**（根锚 `data-card="approval"` + `data-prompt-id` + `data-shape`，值域 `single` / `batch`；根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]）；**两形键位**：逐项形 `1` / `2` / `3` ⇒ `once` / `always` / `reject`，批形 ⇒ `approveAll` / `deny` / `oneByOne`（表外键 ⇒ **零动作 · 不吞键**——实现 = 纯函数 `verdictOfKey`）；三出口锚 = `data-action="approval:<verdict>"` + `data-key="1\|2\|3"`；**初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）——落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）未落**（登记 open 行）；`changes` 超阈 ⇒ 卡面只摘要行 + 增删计数（判据与形与工具卡**同源** = `thincoder-desktop/renderer/views/chat-tool.mjs`）；出口点按 ⇒ 通道 `approval:respond`（载荷见 `docs/desktop/design/IPC.md` §2），**零乐观写**（待决项清除归事件面） |
| 工具卡 | 名称 + 参数摘要 + 状态（**词 = 状态词闭枚举**；锚 = `data-status`）+ **耗时**（`ev:tool-result` 载荷——`docs/desktop/design/IPC.md` §1；仅完成 / 错误态且数在时落）+ 可展开结果（**折叠默认态**：错误展开、其余折叠；显式 `expanded` 优先；无结果 ⇒ 头为纯展示行零控件）+ **改动摘要**（文件 + 增删行数，纯文本，不做 diff）；**大 patch 降级** = 超阈（**> 200 行 或 > 10 文件**）只给摘要 + 增删计数，**不启用外部查看器**（文件视图 / 打开 / 内置 diff 在本版边界外——`docs/desktop/design/PROJECT.md` §8） |
| 空态 | 无会话 → 左列新建入口 + 中区引导；无 provider → 引导向导 |
| 启动态 | 无当前项目 ⇒ **左列** = 打开目录入口 + 最近目录列表（读面 = `docs/desktop/design/IPC.md` §2 项目面注；点最近项**直接进入**，不再弹目录选择）· **中区引导面延后**（落点档未裁——视图族落点 = `docs/desktop/design/PROJECT.md` §4.1） |
| 左列会话行 | 行 = 标题（`title` 空 ⇒ 词表缺省词）+ 来源端标（`createdBy` 三值 ⇒ CLI / 扩展端 / 桌面端；缺键 ⇒ **无标**——本档 §2 项 3）+ 当前活动槽标（`isActive`，非状态位）；**接线**（批 5 落）= 点行 `session:switch` ⇒ 开标签 ∧ 标签条**同一路** · 空态新建入口与标签条新建控件 = `session:create` · 行 `data-action` = `session:switch`；运行 / 待审批位标面随对话流批（`docs/desktop/design/IPC.md` §2 会话族注） |
| 项目级信息 | 左列底行（挂载根 = `[data-slot="info"]`——常量源 `thincoder-desktop/renderer/mount-settings.mjs:29`；左列会话行之后——**项目一份、不随会话走**）· **只读**（零写入口）；落形 = 三读数节点（台账计数 `counts.pool` / `counts.tech` / `counts.aged` · 超阈标 `thresholdReached` · 相位 `phase`）；**读数供给未落 ⇒ 零节点**（禁止假造）；行右端 = 设置入口控件（`data-action="settings:open"`——见下行）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注 |
| 设置面 | **形态 = 窗口级覆盖层面**（挂载根 = `index.html` 单容器 `[data-slot="settings"]`）· **开** = 左列底「项目级信息」行右端 `data-action="settings:open"`（否决「会话头部」位）· **关** = 面板内控件 `data-action="settings:close"`（退场 = 清空容器 ⇒ 主 UI 可用）；**面头语言控件** = 面板头内、`settings:close` 左侧（en ↔ zh 切换按钮 · 锚 `data-action="settings:lang"`——沿开 / 关锚命名；**否决「状态栏」位**（语言非状态量））；点按 ⇒ `config:write`（`locale`）⇒ **同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷（**免二跳**）；标签 = 词表键（两语各一键 · 随当前语言出串）；**语言非新段**——四段闭集不动；**零 Esc 绑定**（不新增键盘层——既有键盘面唯一 = 审批卡根 `keydown`（`thincoder-desktop/renderer/views/approval.mjs`），键闭集不含 Escape）；面 = 四段（渠道 / 模型与档位 / agent 参数 / MCP），各段**三态**（未配 / 载入中 / 已配），供给未落 ⇒ 零节点（禁止假造）；写面全经核唯一执行体 `writeConfigAtomic`（端侧零自写盘——`docs/desktop/design/PROJECT.md` §2 KD-10）；失败面可见（零静默）；通道面 = `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注（项 8——`FORMATS` 端侧枚举判定 · `defaultModel` 两写口） |
| 首启向导 | 闸 = `config:read` 回执 `configured` 假 ⇒ 冷启动进向导（已配 ⇒ 跳过）；**容器 = 同设置面**（`[data-slot="settings"]` 单容器——两树互斥 · `configured` 假 ⇒ 向导占槽）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）——**零终端可完成**；**退场 = 清空容器**（主 UI 可用）· **幂等可重入**（中途退出 / 配置仍缺 ⇒ 下次冷启动再进）；**档不可读（畸形）⇒ 向导不进 · 容器空 + 设置面可进 + 明示不可读**（错误串直传 · **不静默重置**——`docs/desktop/design/PROJECT.md` §2 KD-12；`data-boot` 保持 `error`）；表单出口**复用设置面导出面**（单一 owner · 零副本）；形态 = 纯描述符树 + 薄挂载（`docs/desktop/design/RENDERER.md` §1.1）；**步界 / 步体闭集**（单源）= `STEPS` 三步闭集（表外值回落步 1——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30`）· `stepBody` 三分支（步 1 / 2 / 其余 ⇒ 目录步——`:84`） |
| 主题 | 跟随系统深浅（`nativeTheme`），变量集中在 `styles.css` |
| 键盘可达 | 审批卡三出口可键盘触发（**两形键位**见「审批呈现」行：逐项形 1 / 2 / 3 = once / always / reject，批形 = approveAll / deny / oneByOne）；初始焦点**目标** = **最安全键**（逐项「拒绝」/ 批「全否」——落形 = 标记锚 `data-autofocus="1"`（恰一）；**置焦执行未落**——见「审批呈现」行）；焦点环与 Tab 序显式定义 |
| i18n | 承产品定性（英文默认面，含 zh）；词表与核 i18n 面同源——**供给面 = `config:read` 语言面下发**（`{ locale, dict }`，核 `projectDictionary` 投影；本端不另立词表源——通道面 = `docs/desktop/design/IPC.md` §2） |
| open | 左列折叠阈值**数值**（初值 900px + 调参面单常量已给——见「断点」行）· 会话头 / 状态栏数据供给（会话族载荷扩充）· 审批卡**置焦执行**（行为面 = 真 DOM `focus()`；制品面 = 标记锚 + `chat.css` 高亮——见「审批呈现」行）· 活动池**窗限 / 归档口径**（清点 = 全量在场已落；窗限 / 归档未定——见 §2 项 1 行） |

**长会话渲染窗口 · 回填与跟滚**两行属实现工艺面 ⇒ 住 `docs/desktop/design/RENDERER.md` §2 / §3（本档不保留其正文）。

## 2. 活动池与状态位（需求档 §3.5 三项落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 1 · 池 / 队列分层形态 | **落定** | 归组键 = 核 relay 前缀（`role#id`——`@thincoder/core/agent/relay-prefix.mjs`，扩展端已消费）；池内三条目族 = **活动块**（子代理 / advisor / consult，粒度 = 工具名 + 状态，不回显内容）· **队列**（排队中回合 / 工具批）· **待审批**（计数 + 操作区，置顶）；折叠态按会话记忆。**落形**（本批）= 三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）· 有会话三族皆空 ⇒ `empty`（词表提示）· 否则 `pool`；**族序 = 待审批 → 活动块 → 队列**（族空 ⇒ 该族零节点）；折叠头两读数 = `running` / `approval`（`pool` 切片出；**非数 ⇒ 零节点**——禁假造；`store` 缺省 `running: 0` / `approval: 0` ⇒ 落 `0` 读数）· 折叠态键 = `poolCollapsed`（按会话记忆）· 控件锚 `data-action="pool:toggle"`；条目**零内容回显**（工具名 + 状态词——状态词出自 §1 闭枚举 6 词）· **清点口径**（批 8 落）= 条目入池即在场（`ev:tool-call` 入 / `ev:tool-result` 只收束 `status`）——**收束不摘除**（长会话池切片单调增长）；**窗限 / 归档未定**（见 open 行） |
| 2 · 标签位集合与优先级 | **落定** | 取值 = 运行中 / 待审批 / 完成 / 空闲；优先级 **待审批 > 运行中 > 完成 > 空闲**（一个会话同时命中多值时显示最高者）；来源 = 本会话的挂起表 + 回合状态（`onToken` / `onToolCall` / `onToolResult` 驱动）；另两端已有同义状态语义（“waiting” 类状态位先例 `thincoder-vscode/src/extension/panel-callbacks.mjs:54`）⇒ 三端语义一致、呈现各自定形 |
| 3 · 会话行「来源端」标注 | **落定** | 读 `sessions:list` 条目的 `createdBy`（核 `listSlots` 投影，实读 `thincoder-core/session-slots.mjs:217`——SLOT-END-PARAM 批落地）⇒ 会话行标注**创建端**（CLI / 扩展端 / 桌面端）；**缺键（老槽）⇒ 不标注**（不猜测——**禁以「占用端」冒充**，见下旁证行）；通道面 = `docs/desktop/design/IPC.md` §2 会话族行 |

**旁证（不得混称）**：**占用端**（谁正持有该槽运行）可由核 peer 面观察（`thincoder-core/peer-instances.mjs` 的端字段）——那是另一事实，与「来源端」不同义，本端**不**以它冒充来源端。

## 3. 范本借用清单（形态面 · UI 范式勘察落档）

清单前言（单源，住本档）：**本端落形列 = 单源**（本档 §1 规则行引用本表常量）；来源只作参照，不作承诺。
全部落形只用**浏览器原生能力**（`inert` / `mask-image` / 原生滚动事件）——**零框架零构建**（`docs/desktop/design/PROJECT.md` §2 KD-4）成立，逐项无框架依赖。
证据级别两档——**本仓实读**（本仓源档逐行读过）∥ **外部转引**（参考仓 kimi-web / opencode 的父侧实测读数；本端只复核坐标在位，未运行实测）。

| # | 借用项 | 本端落形（本档 §1 规则行） | 来源坐标 | 级别 |
|---|---|---|---|---|
| 7 | 标签条形态 | 标签宽 ∈ [1.75rem, 14rem]；溢出横滚 + 端点渐隐；非活动标签 `inert` | opencode `titlebar-tab-strip.tsx`（91 / 147 宽域 · 215 溢出横滚）；渐隐端 `text-reveal.css`（66-85）；`inert` 面 `session-side-panel.tsx`（300） | 外部转引 |
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
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮）：§1 三行补锚——项目级信息行补挂载根 `[data-slot="info"]`（常量源 = `thincoder-desktop/renderer/mount-settings.mjs:29`）；设置面行通道指针补项 8（`FORMATS` 端侧枚举判定 / `defaultModel` 两写口）；首启向导行补**步界 / 步体闭集**（`STEPS` 三步 · `stepBody` 三分支——`thincoder-desktop/renderer/views/onboarding.mjs:20` / `:30` / `:84`）；
  明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
