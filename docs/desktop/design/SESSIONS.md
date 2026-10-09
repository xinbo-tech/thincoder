# 桌面端（DESKTOP）· 会话域（SESSIONS）

> 板块 = **桌面端会话域**——会话端标识 / 会话控制面 / 会话列表读面 / 会话族动作 / 删除随动 / 标题链 / 重启自动重开——本域设计单源档。
> 需求侧 = 需求分卷（本域卷 = `docs/desktop/requirements/SESSIONS.md`；查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；功能点 ∥ 验收面 ∥ 依赖面——**范围数随需求卷现文**；本域回指 = **D1** ∥ **D2** ∥ **D18** ∥ **D23** ∥ **D26**）。
> 同部分相关档：总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md` · 宿主适配层 = `docs/desktop/design/SHELL.md` · 主 ↔ 渲染通道契约 = `docs/desktop/design/IPC.md` · 界面形态与交互 = `docs/desktop/design/UI.md` · 渲染面实现工艺 = `docs/desktop/design/RENDERER.md`。
> 域档：活动池与消化面域 = `docs/desktop/design/ACTIVITY.md` · 输入区域 = `docs/desktop/design/COMPOSER.md` · 对话流域 = `docs/desktop/design/CHAT.md` · 设置域 = `docs/desktop/design/SETTINGS.md`。
> 域档续：菜单体系 = `docs/desktop/design/MENU.md` · 打包与发行 = `docs/desktop/design/PACKAGING.md` · 端到端测试基建 = `docs/desktop/design/E2E-TESTING.md` · web 快筛 = `docs/desktop/design/WEB-QUICKCHECK.md`。
> 核机制面（会话 / 配置 / 记忆 / 工具）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> **迁移状态（波 2b）**：本档 = 文档体系重组批（DOC-MIGRATION）· 波 2b 迁入——来源 = `docs/desktop/design/PROJECT.md` §2（**KD-5** ∥ **KD-9** ∥ **KD-15** ∥ **KD-16** ∥ **KD-28** ∥ **KD-41** ∥ **KD-56**）∥ `docs/desktop/design/UI.md` §1（会话控制面行 + 会话面板族行与批注块）∥ `docs/desktop/design/PROJECT.md` §4.1（会话族行）；
> 迁入 = 逐字（长行按语义边界折行；迁入文本内「本档 §x」回指按新落点改指）；原址各留一行指针。
> 本档余量：零（§6.1 ∥ §7 ∥ §10 涉行已随切片 4（终篇）迁入——见 §4/§5/§6）；§4.1 会话族行 ∥ §4.2 本域三块已迁入（2c 前置步 · 文件账分片轮 · 2026-10-02——见 §3）。
> 波 2b 记录在册 = 批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2。
> 建档：2026-10-02（域拆分 · 波 2b）；本档坐标 = as-of 2026-10-02 届盘实核（仓根 = `thincoder/`）。
> **行数纪律（500 建议 ∕ 800 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∥ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。

## 1. 关键决策记录（迁自 `PROJECT.md` §2——本域行）

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-5 | 会话端标识 = 本端**声明端名**（`END = "desktop"` + 一次 `setSessionEnd(END)` + 转口八项：端参绑定 6〔marker 三项 + `resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`〕· 纯 re-export 1〔`renameSlot`〕） | 核 marker 家族已**端参数化**（实读 `thincoder-core/session-slots.mjs:105` `END` 初值 · `:113` `setSessionEnd` · `:115` `sessionEnd`；marker 三式与写 marker 入口逐函数缺省取**进程端名**——SLOT-END-PARAM 批落地）⇒ 端侧零算法副本（先例 = 扩展端端壳 `thincoder-vscode/src/extension/session-slots.mjs:46` / `:51` / `:63` / `:68` / `:72` / `:76`） | **自持端侧算法副本**（第二份实现 = 漂移面；扩展端副本已注销归核）· **不声明端名直消费核**（缺省 = `"cli"` ⇒ 以 CLI 身份写 marker = 跨端互写） |
| KD-9 | **最近项目目录零新存储**：读面 = 核会话槽面回读（族分组 + 组最新 mtime 序）；当前项目 = 主进程**内存态**（不落盘——启动种子 = 本端记录面回读，见 **KD-56**；本条零新存储面不变） | 守需求档 §2「不得另立存储格式」与 A2（不增跨端共享可变字段）；判据单源 = 核 `thincoder-core/session-stale.mjs:46` · `:56`（纯函数导出可复核）；机制细节 = `docs/desktop/design/IPC.md` §2 项目面注 | **端自建列表文件**（第二份存储）· **端 marker 面当最近列表读面用**（本端记录 = 各端「最后认领的槽」〔`thincoder-core/session-slots.mjs:101` · `:117-120` · `:122-125`〕，非项目清单 ∥ 覆盖不足：只含本端认领过的项目；另一用途 = **KD-56**「上次打开」单值）· **共享 config 新字段**（跨端共享可变字段——违 A2 / 核 NF1） |
| KD-15 | 标签条非活动项收 Tab 序的手段 = **两控件各 `tabindex="-1"`**，**不用 `inert`**；确认态（`data-confirm="1"`）**免** `-1` | 原落形（`inert`）**同行自相抵**：`inert` 使子树对**全部**用户输入失效（含指针）⇒ 杀死同行「标签点击激活」（批档 §1.7 / §1.8 走查定位）；真意图 = **键盘 Tab 序排除**（T-DSK20 判据**保留**）⇒ 换只收键盘序的原生属性 | **保留 `inert`**（点击激活不可达 = 需求「点按切换」失守）· **不收 Tab 序**（T-DSK20 判据不许）· **`inert` + `pointer-events` 叠加**（两机制互抵仍并存 = 无谓面） |
| KD-16 | 删会话 ⇒ **页随动**：邻位接管（会话列表形——同位置行，越界取末行；列表空 ⇒ 关页）；删非活动 ∕ 拒收（末项门 ∕ 槽缺）⇒ **零动作**（`ok:false` ⇒ 零动作 + 记错） | 实据：`thincoder-desktop/renderer/session-wire.mjs`（会话族接线面——删会话 `ok` ⇒ 列表刷新 + 邻位接管；`deleteSession` ∕ `takeover`）· `activeSession` **唯一写者** = `thincoder-desktop/renderer/events.mjs` `openSession`（调用面 = `session-wire.mjs`）· 页随动住接线面、**不进 store**（防第二写者 ∕ 成环） | **尾内联进 store**（store 成 `activeSession` 第二写者 + 成环）· **`paintChat` 从状态派生页键**（帧出口成第二判据源） |
| KD-28 | **会话面板 = 对位 VSC 会话栏元数据族**（D18）：行元数据三值 = provider（端壳行投影补 `activeProvider`——`thincoder-desktop/src/main/sessions.mjs:14-16`）· N msgs · updated（两值已载） | 用户走查第 1 点「会话面板与 vsc 基本对齐」+ D18；VSC 对位 = `thincoder-vscode/webview/session-bar.js:40-41` | **改用 VSC 单栏下拉**（多标签结构不削——需求定）；**元数据逐字镜像**（本端行结构差异保留——基本对齐 = 元数据族 + 交互语义） |
| KD-41 | **桌面标题链 = 回合尾结算单实现（标题先于落盘）+ await 同形 + 存量仅自然补**（会话标题接线批 · 2026-09-28 · 台账 #517）：① 落点 = `thincoder-desktop/src/main/turn-face.mjs` 的 `settleTurn(key, agent)` 单实现（两 `saveAgentSlot` 结算行 ⇒ 两调用点——取位按符号；核件零改——只接不改）；结算序 = **标题 → 落盘 → 读数 → 终局事件**；中止墓碑两查位（入位 ∕ 落盘前）——U-7「零复活」不因新增 await 破口；② await 语义 = 阻塞（界 = 核件 10s `AbortSignal.timeout`）——**await 时点同形**；**窗期受理面 = VSC 同形 ∕ CLI 并发受理**（CLI 窗期 `state.controller = null` + `Ready`——`thincoder-cli/src/tui/agent-turn.mjs:300-311` ∕ `:316-319`）（链单源 = `docs/core/design/SESSION.md` §6.7：时点 = 回合尾、整档 save 之前；写形 = 单写——标题值随整档 save 落盘）；等待期 = 在飞未释 ⇒ 忙态受理（KD-40 入队）零丢失；③ 覆盖四类回合尾（`send` ∕ 消化轮 ∕ timer 轮 ∕ 残输入续发——自守卫短路，零重复成本）；④ 首条消息两态可得（绑定态 = 记录存储 `firstUserMessage()`——`thincoder-desktop/src/main/session-io.mjs:25` 恒传槽；新建态 = `pushReal` 后的内存人读线——`thincoder-core/context.mjs:94-100`；端层零新增判据）；⑤ **存量未命名会话 = 仅自然补**（下一回合后补生成；**每个未成功生成标题的回合均重试**——核自守卫以 `agent.title` 在场短路；列表侧回填被否——读面生写 + 无准入节流 + 新机制面；用户出路 = 既有手动改名面；登记 = `docs/desktop/design/PROJECT.md` §10 **BO**） | 用户 2026-09-28 18:10 走查「为啥desktop的开的会话永远是untitled session？还缺什么没接线吗？」；核件自守卫 + 非致命现成（`thincoder-core/generate-title.mjs:123-139`——自守卫 `:124` · 10s `:105`）；CLI ∕ VSC 已接同链（`thincoder-cli/src/tui/agent-turn.mjs:311` ∕ `thincoder-vscode/src/extension/panel-turn-stages.mjs:130`）；桌面零调用 ⇒ `agent.title` 恒空 ⇒ 槽 `title:""`（核 `thincoder-core/session.mjs:128`）⇒ 左列行回退词（`thincoder-desktop/renderer/views/session-control.mjs:56`）；通知面现读恒空（读面 = `thincoder-core/notify-policy.mjs:44-45`——端 `thincoder-desktop/src/main/notify.mjs` = 11 行 re-export），接线后随动零改（触点晚于结算——`thincoder-desktop/src/main/agent-host.mjs` `drive` `.then`） | **后台化（fire-and-forget）**——破「标题先于落盘」（首回合槽 `title` 仍空）或另开第二写面 + 竞态窗；**两径各自内联调用**——实现分叉面；**标题独立第二写（`setSlotTitle` 形）**——违单写纪律；**列表侧群发回填**——读面生写 + 每次 `sessions:list` 向全存量槽发网络调用（无准入 ∕ 节流）+ 并发闸 ∕ 重试 ∕ provider 装配持有皆新机制（越本批边界）；**跳过标题等 save 后补写**——同第二写面 |
| KD-56 | **重启自动重开 = 本端记录面回读（零新存储）**（桌面重启自动重开批 · 2026-09-30 · 台账 #734 · 需求 D1 判据扩展）：① 读面 = 本端记录面（`{族前缀}.manifest.desktop` 全家）取 mtime 最新一条（**并列定序 = 同级按族哈希升序**——沿「最近目录」先例 `thincoder-desktop/src/main/projects.mjs:85-87`，两次调用等值）→ 其族数据文件回读 `cwd`（与「最近目录」同族机制——机制细节 = `docs/desktop/design/IPC.md` §2 项目面注项 7）→ `isDirectory` 门 → 主进程当前项目落位；② **写面 = 零新增**（记录写点 = 既有认领写：打开链成功 ⇒ 渲染面自动一次 `session:resume` ⇒ 核 `resumeSlot` 写本端记录〔`thincoder-core/session-slots.mjs:324`〕⇒ **「上次打开」判据 = 本端认领时点**，与「最近活跃」（数据文件 mtime ∥ 组最新 mtime 序）分面）；③ **启动接线** = `thincoder-desktop/src/main/main.mjs` 窗口创建前一次恢复（单实例锁分支后）⇒ `project:recent` 的 `cwd` 非空 ⇒ 渲染面 boot 既有接续门（`thincoder-desktop/renderer/app.mjs:230`）自动接上本端会话——**一条链**（项目 + 会话），渲染面零改；④ **降级三档同归冷态**（无记录 ∕ 族无可读 `cwd` ∕ 目录不在盘）= 不恢复（冷态照旧）；**日志分档** = 无记录（首启常态）零日志，仅「族无可读 `cwd`」∥「目录不在盘」两档真降级各记 `console.error` 一行（零静默），记录零触碰（自愈 = 下次成功打开改写最新）；**恢复面纯读**（盘面零改动）；⑤ 边界 = 首启 ∕ 无记录 ⇒ 冷态照旧 · 多实例 = 单实例锁既有（非主实例零恢复动作）· 端分离 = 只读 `.desktop`（`.cli` ∕ `.vscode` 零可见零写——NF1）· 老版本档零迁移（标记面自既有恢复链写入；从未被桌面打开过的项目 ⇒ 无记录 ⇒ 冷态） | 需求 D1 扩展句逐字（进程全退再启 ⇒ 自动打开本端上次打开的项目目录 ⇒ 随之恢复该项目下本端会话）+ D1 已明「上次打开 ≠ 最近活跃」⇒ 取数面必须 = 本端打开 ∕ 认领时点而非活跃序；本端记录 = 本端单写者文件（NF1）⇒ 端分离天然成立（桌面记录不许劫持 CLI ∕ VSC 本端恢复——F1）；零新存储守需求 §5.2「另立会话 ∕ 配置存储格式」不做与 KD-9 旨 | **族最新 mtime 序（`recentDirs()` 首位）**（= 最近活跃：数据文件 ∥ 另两端记录写入即变——实反例：桌面开 A、CLI 在 B 聊天 ⇒ 首位 B ≠ 上次打开）· **共享 manifest 的 `active` 族**（跨端共享可变字段——CLI ∕ VSC 活动改写 ⇒ 劫持桌面重开目标，违端分离 ∕ A2）· **新落盘文件**（端自建 `last-project` 档——第二份存储 ∥ 另立格式；相对记录面的增量精度 = 「打开成功但接续未达」窄窗 ⇒ 不值一个新存储面——窄窗 fail-soft 自愈）· **打开时写记录**（本端记录 = 认领记录：未认领时写任何槽值都失真；`slot:null` 写更会改恢复语义〔跳过一次性继承〕——会话侧零改约束下不可行） |

## 2. 界面形态与交互（迁自 `UI.md` §1——本域行与批注块）

### 2.1 会话控制面（行）

| 面 | 形态 |
|---|---|
| 会话控制面（VSC 形 · 会话模型轮 R13） | 条体三件 = 项目钮（`project:open`——恒在场，词面经 `aria-label`）→ 下拉选择器（标签 = 活动会话题；`title` 空 ⇒ 词表缺省词；开合锚 = `aria-expanded` + 下拉 `data-open`；Enter ∕ Space 触发）· **改名形内键面让行**（形内 `[data-form="rename"]` 的 `Enter` ∕ `Space` 归文本控件——零开合零收形；源判，`stopPropagation` 径被否；批档 `docs/batches/2026-09-29-desktop-carryover.md` §2.6）→ 新建钮（`session:create`）；下拉（开时挂选择器子位）= 账本警示注记首行（`div.session-ledger-notice` · `data-ledger-notice` · 非可点）⇒ 条目 ⇒ 空态行（`session.empty`）；**条目** = 标题 + 元数据族（provider · N msgs · updated）+ 位标（码 `running` / `approval` / `done`——渲染面状态源 = `thincoder-desktop/renderer/events.mjs` 置 ∕ 清位；状态栏跨会话告警位同源同词）+ 行内 ✎ ∕ ✕（`>1` 才显 ✕）；活动判据 = 行 `isActive`；**三出口** = 切会话 `session:switch`（点条目 ⇒ 关下拉；**受占件（端差清算批增）**：目标槽受占 ⇒ 切换仍成立 + 警告 toast（词键 `session.occupied`——CLI 形「警告 + 继续」；回执增键 `occupied` 载波——单源 = `docs/desktop/design/IPC.md` §2 会话族行））· 改名 `session:rename`（✎ ⇒ 条目原位换形：文本控件 + 取消 ∕ 确认两键）· 删除 `session:delete`（✕ ⇒ 内联确认 popover——背板 + 两键 + 默认焦点取消）；**否** `window.prompt` / `window.confirm` / dialog / 超时自动消；**元数据族（对齐重定位批 · D18）** = provider · N msgs · updated（对位 VSC 会话栏——provider = 槽投影 `activeProvider` 补载）；**账本警示注记**（下拉首行 dim 注记 · 非可点——账本可靠批 · 桌面微轮）= 本档 §2.5；**视觉对齐（D21）**：行面值表 = 本档 §2.3；**对齐第三批**：末项删除门——本档 §2.6；单源 = `thincoder-desktop/renderer/views/session-control.mjs` ∕ 挂载与接线 = `thincoder-desktop/renderer/mount-sessions.mjs` |

### 2.2 会话面板元数据族（对齐重定位批 · 项 4）

4. **会话面板元数据族（D18 · 对齐 VSC 会话栏）**——对位面 = `thincoder-vscode/webview/session-bar.js:40-41`（行元数据 = `provider · N msgs · updated`）；
   桌面落形 = 会话控制面下拉条目元数据族**三值**：
   provider（槽投影 `activeProvider`——核 `listSlots` 条目 `thincoder-core/session-slots.mjs:212`；端壳投影 `thincoder-desktop/src/main/sessions.mjs:12-16` **已载（R3c 增）**）· `messageCount`（已载）· `updatedAt`（已载）。
   交互对位 = 点选 / 改名 / 删除（桌面行内换形**已在册**——本注不改形）；**多标签结构不削**（本端结构差异保留）；更新时间显示形 = 本地化短日期（沿 VSC `fmtDate`）。

### 2.3 会话面板视觉（D21 项 2 · 9 面表）

**本批注（D21 · 会话流 / 会话面板视觉对齐 · 两项 · 2026-09-28）· 项 2**：本项补本档 §2.1「会话控制面」行的**视觉对齐**（用户 2026-09-28 04:42 桌面走查：②「桌面端的会话面板与 vsc 端完全不同，我之前要求过对齐的」⇒ 裁定向 VSC 靠拢；批档 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` · 需求卷 **D21**）。
**结构零动**——会话控制面（R13 换装后）行族 / 行内换形 / 元数据族 / 行控件皆沿在册（需求 D18「本端结构差异不削」）；本项只述视觉值面与边界，**值表单源 = 本项表**（内容面 = 核档 §5）。

2. **会话面板视觉（桌面会话控制面 ∕ 下拉列表 · 端壳面）**——对位 = VSC 会话列表（`.session-item` 族；值源 = `thincoder-vscode/webview/session.css` / `thincoder-vscode/webview/session-bar.js`）；
   落点 = `thincoder-desktop/renderer/chrome.css` 会话控制面段（选择器族 `.session-*`——R13 换装后值面沿 `renderer/theme.css` 调色板变量）；**结构零动**（R13 后形态 = VSC 形换装；本端结构差异不削）。

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

**排版统一（D29）收正指针（2026-09-30）**：本表行 4 ∥ 5 ∥ 6（行标题 ∥ 元数据族 ∥ 行内动作钮）桌面落法栏的**字号 ∥ 字重值被排版基线接管**——13px ∥ 500 ∥ 11px ∥ 12px 族 ⇒ `var(--fs)`（14px——轻通道轮五）∥ 400（盒值 ∥ 色 ∥ 结构零动）；
单源 = `docs/desktop/design/UI.md` §1「本批注（排版统一 · D29 · 2026-09-30）」项 1 ∥ 项 5。

**计数（D3）**：**9 面**（1–9 = 行容器 ∥ 行 hover ∥ 活动行态 ∥ 行标题 ∥ 元数据族 ∥ 行内动作钮 ∥ 字形面 ∥ 空态行 ∥ 行聚焦）；本面新增变量 **2**（`--diff-del-bg` · `--error-fg`；与内容面共用者不重复计）；**桌面新增变量合计 = 14**（内容面 12 + 本面 2）。

### 2.4 会话面板七条对位处置（2026-09-29 重审 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` · #673）

**会话面板七条对位处置**——逐条四类：已消（①②）· 对位物退役（③）· 需求边界（④）· 说明（⑤–⑦）：
① **面板容器皮肤 = 已消**（R13 换装 + D21 后两端构同形——实读 `thincoder-vscode/webview/session.css:13-59` ⟷ `thincoder-desktop/renderer/session-list.css:8-46`）；
② **会话选择器 / 下拉交互 = 已消**（同上；落形 = 本档 §2.1 会话控制面行）；
③ **会话条对位句 = 已消（对位物退役）**——标签条 R13 裁撤 ∕ 会话头退场；对位 = VSC `#session-bar` 三件（`#session-selector` ∕ `#session-dropdown` ∕ `#new-session-btn`——新建入口 = 桌面会话控制面新建钮（`session:create`）+ 空态引导面动作），R13-A 形换装已落；
④ **`#project-btn`（多根切换钮）= 不适用**（需求边界——本端单项目模型，需求 §2「项目模型」行）；
⑤ **`.dropdown-section` = 说明**（VSC 会话列表不发射该节点——仅 `thincoder-vscode/webview/model-picker.js:73` 消费；桌面下拉零区标题面（R13 后）⇒ 零动）；
⑥ **行内换形三件 = 说明**（桌面行内换形形态有意不同（`.session-rename-input` ∕ `.session-cancel` ∕ `.session-confirm`）· 本批零动）；
⑦ **打开目录入口（项目钮）= 说明**（本端独有（D1 面——住会话控制面；VSC 无对位）⇒ 保留零动）。

### 2.5 账本警示面注（会话账本异常警示面 · 2026-09-28）

**本批注（账本警示面 · 2026-09-28）**：本注补本档 §2.1「会话控制面」行的**会话账本异常警示面**；来源 = 核需求 `docs/core/requirements/SESSION.md` §4.6 **F-L4**「账本异常 ⇒ 用户可见信号」+ 批 `docs/batches/2026-09-28-ledger-reliability.md` §1.6 扩面裁定（三端齐——VSC 面同批落，桌面面本微轮落）。本注只述端侧形态与锚；契约 / 载荷 / 在场单源 = `docs/desktop/design/IPC.md` §2「会话族注」项 6。

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

### 2.6 对齐第三批 · 会话栏末项删除门（P12）

12. **会话栏·末项删除门**——现状：恒出（可删到零会话）。对齐形：**渲染面门** = 行常态删除控件在场判据 = 会话数 > 1（VSC `session-bar.js:57-59` 同判）
    + **主侧门** = `session:delete` 末项 ⇒ 拒（新 reason `last-session`——VSC 宿主同门先例）。落点 = `thincoder-desktop/renderer/views/session-control.mjs`（条目 ✕ 门——`>1` 才显） + `thincoder-desktop/src/main/session-actions.mjs`。

### 2.7 会话行「来源端」标注（需求档 §3.5 项 3 · 已落定）

| 项 | 处置 | 内容 |
|---|---|---|
| 3 · 会话行「来源端」标注 | **落定** | 读 `sessions:list` 条目的 `createdBy`（核 `listSlots` 投影，实读 `thincoder-core/session-slots.mjs:217`——SLOT-END-PARAM 批落地）⇒ 会话行标注**创建端**（CLI / 扩展端 / 桌面端）；**缺键（老槽）⇒ 不标注**（不猜测——**禁以「占用端」冒充**，见下旁证行）；通道面 = `docs/desktop/design/IPC.md` §2 会话族行 |

**旁证（不得混称）**：**占用端**（谁正持有该槽运行）可由核 peer 面观察（`thincoder-core/peer-instances.mjs` 的端字段）——那是另一事实，与「来源端」不同义，本端**不**以它冒充来源端。

### 2.8 半行指针（本域半边在其本档）

- **空态行「新建钮」半**：空态面主条 = `docs/desktop/design/CHAT.md` §2（该档已收编）；其中「会话控制面新建钮」半边 = 本档 §2.1（按钮面）+ §2.6（末项门）。
- **启动态「项目钮」半**：启动态主条 = `docs/desktop/design/SETTINGS.md` §2（该档已收编）；其中「打开目录入口 = 会话控制面项目钮」半边 = 本档 §2.1（项目钮恒在场）+ `docs/desktop/design/IPC.md` §2 `project:open` ∕ `project:recent` 行。
- **主题 ↔ 设置面头控件半 / 会话 ↔ CHAT · ACTIVITY 半**：按各档单源指针引用，本档不复制。

## 3. 文件账（迁自 `PROJECT.md` §4.1——会话族行）
### 3.1 本端文件清单与行数预算（会话族行）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/session-list.css`（越线档结构轮实施产出） | **169**（实读 2026-09-30——前读 170；自 `thincoder-desktop/renderer/chrome.css` 出档：头注 6 + 迁出块 127 ∕ 37 逐字〔原 `:136-262` ∕ `:287-323`〕；批档 `docs/batches/2026-09-29-structure-split-round.md` §2.2-A） | 会话列表面（下拉 + 条目全族 + 空态 + 账本注记 + 行内动作两钮 + 条目内改名形；链序 = chrome 后 ∕ skin 前） |
| `thincoder-desktop/src/main/session-io.mjs` | **77**（实读 2026-10-08——届盘实读收正（表载 65 ⇒ 77；文档卫生批行数面回填）；前读 **65**（实读 2026-09-30——留档批（#719）`appendRecord` 薄壳（`:58-65`——核 `pushReal` 直复用 ∥ fail-soft）；前读 2026-09-29 = 46（R3 后）） | 会话槽 I-O 出档（自 `agent-host.mjs` 拆出——批 8 §1.14 ①②）：装载 `loadAgentSlot`（槽缺 ⇒ false；命中 ⇒ 应用槽值 + 重钉 `agent._slot`——防切会话 / 跨端切槽后落错槽）+ 回合尾落盘 `saveAgentSlot`（**不抛**——写盘失败不掀回合）· 零算法副本（`docs/desktop/design/SHELL.md` §4 项 1 / 项 4）；**R3 增**：`saveDistilledSlot`（#520 蒸馏落位）+ `saveAgentSlot(agent, label)` 单实现 + **留档批**：`appendRecord(agent, record)`（人读线记录入档薄壳——载体形半提取 ∥ 机器线零触） |
| `thincoder-desktop/src/main/session-slots.mjs` | **271**（实读 2026-10-09——清除批 fix 轮（270 ⇒ 271——`openingSeed` 链第二档入参 `defaultModel: config.defaultModel` 补入；批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §1）；前读 **270**（实读 2026-10-08——届盘实读收正（表载 259 ⇒ 270；文档卫生批行数面回填）；前读 **259**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（235 ⇒ 259——`providerStateOf` 三回执族同形载荷单源 ∥ `pageHistory` 回执携 `providerState`）；前读 **235**（实读 2026-09-30——留档批（#719）`pageHistory` 开直通（`{ records: true }`——增派义务，设计 §2 ② 已明）；前读 2026-09-29 = 231（@ 文件引用对齐批后）；R1 会话维护线族转口五名；前史 = 残余批 180 ⇒ 194 ⇒ 195；批 B 末实读 154）） | 端壳：端名声明（`END = "desktop"` + `setSessionEnd(END)`）+ **转口八项**（marker 三项〔端参绑定〕+ 会话族五项：端参绑定 3〔`resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`〕· 纯 re-export 1〔`renameSlot`〕）——零算法副本（先例 = 扩展端端壳 77 行）+ `history:page` 薄处理体（核 `loadSlotFile` + `historyWindow` 转口——零算法副本；**留档批**：`{ records: true }` 直通——记录随页入回执）；**批 B**：`effort` 槽字段落地 ⇒ `slotMeta` 的配置回落支（`?? str(loadConfig()?.provider?.reasoningEffort)`）删除 + 陈旧注释（「`effort` 槽无字段」）收正 ⇒ 槽值优先（KD-17；`loadConfig` 若成未用导入随删）；**R1**：会话维护族转口五名（`listColdCwds` ∕ `deleteColdCwd` ∕ `listStaleCwds` ∕ `scheduleSessionGC` ∕ `scheduleSessionIndexPass`——惰性包装） |
| `thincoder-desktop/src/main/session-maintenance.mjs`（R1 会话维护线新档） | **112**（实读 2026-09-28） | 会话生命周期维护处理体三面：① `runSessionGcMaintenance`（候选并集去重 ⇒ 确认缝 ⇒ 逐组 `deleteColdCwd`〔TOCTOU 重校验〕⇒ 汇总）② `runSessionIndexMaintenance`（清四表 → 全量重扫 → 摘要；核索引面惰性载入）③ `scheduleSessionMaintenancePasses`（启动拍两枚）；**零 `electron` 依赖** ⇒ 平 node 直测；核零改（出口全在——转口经 `thincoder-desktop/src/main/session-slots.mjs` 五名） |
| `thincoder-desktop/src/main/session-actions.mjs` | **79**（实读 2026-10-02——前读 73〔实读 2026-09-28〕） | 会话族动作层：五通道（create / switch / rename / delete / resume）+ 回执信封 `{ ok, reason: null|string, cwd, slot }`（`docs/desktop/design/IPC.md` §2 会话族注） |
| `thincoder-desktop/src/main/sessions.mjs` | **45**（实读 2026-09-28——R3c 37 ⇒ 45〔账本警示面回执 `ledger` 投影〕） | 会话族读面：`sessions:list` 载荷投影（核 `listSlots` 条目 → 会话控制条目）——零新增算法（`docs/desktop/design/IPC.md` §2 会话族注） |
| `thincoder-desktop/src/main/projects.mjs` | **175**（实读 2026-09-30——桌面重启自动重开批（#734）落盘后；前读 120（批 B 末）） | 当前项目（内存态）+ 最近目录面 + **重启自动重开**（本端记录面回读 ∥ 启动恢复导出——本批；**KD-56**）——读面 = 核会话槽面回读、零新存储（`docs/desktop/design/IPC.md` §2 项目面注 · KD-9） |
| `thincoder-desktop/renderer/mount-sessions.mjs` | **299**（实读 2026-09-29——越线档结构轮拆后（原 **406**；会话族接线面全量迁出 `thincoder-desktop/renderer/session-wire.mjs`——**已落** · **194**）＋ RF 波 2 增量；未越 300；缝 = 同名再出口七名——`app.mjs` 零改 · 批档 §2.2-B） | 会话控制面**挂载与交互**（VSC 形；自 `app.mjs` 拆出——批 A 拆分落形；**R13-B 硬限拆分**纯构树三件出档 `thincoder-desktop/renderer/views/session-control.mjs`；**本批拆**接线面出档〔同上行〕）：`FACE` WeakMap ∕ `wireFace` ∕ 打开外关 ∕ 草稿两助手 ∕ `submitRename` ∕ 确认 popover；刷新面单源 = `docs/desktop/design/RENDERER.md` §1.1 |
| `thincoder-desktop/renderer/session-wire.mjs`（越线档结构轮实施产出） | **202**（实读 2026-10-01——**#764 落盘后**（关页 `build` 作业点 `withFlowOp` 同笔）；前读 **199**（实读 2026-09-29——自 `thincoder-desktop/renderer/mount-sessions.mjs` 出档：头注 + 五源 import 面 + 窄桥 + 迁出块 163 逐字〔原 `:244-406`〕；缝 = 同名再出口——`app.mjs` 零改；批档 §2.2-B） | 会话族接线面：`refreshRail`（唯一写路径）· 开页链（`openPage` + `loadPage`）· 会话路三出口（`activateSession` ∕ `createSession` ∕ `resumeOpened`）· `confirmRename` · `deleteSession` + `takeover` · 归一助手（`isProject` ∕ `slotOf` ∕ `reasonOf`）；自持 `host` 窄桥 |
| `thincoder-desktop/renderer/views/session-control.mjs` | **238**（实读 2026-09-29——桌面收尾批（#659 形内判源）后；R13-B 新档 ∕ RF 波 2 后） | 会话控制面纯构树三件：`sessionModel` ∕ `sessionBarTree` ∕ `sessionDropdownTree`（+ 节点助手族；import = `../i18n.mjs` ∕ `../store.mjs` ∕ `./chrome.mjs`——零 `node:` ∕ 零裸包） |
| `thincoder-desktop/src/main/session-flags.mjs`（R1 输入面板移植新档） | **96**（实读 2026-09-29） | 模式位四写面（`session:flags`——核 `setSlot*` 四写 + 活代理重施 + `flagsOf` 回执 + ENG×PLAN 互斥） |

**行数面机检**：`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`，运行根单读）**逐条声明节域——本表为其一**（本域值行单源）；后续本域新档由落盘批在本表补值行，`docs/desktop/design/PROJECT.md` §4.1 同拍补指针行（沿 §4.1 纪律）。

### 3.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（会话标题接线）行「现行 ⇒ 预期」**（实读 2026-09-28——内容行数口径；机制 ∕ 判据单源 = 本档 §1 **KD-41**；链单源 = `docs/core/design/SESSION.md` §6.7）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/turn-face.mjs` | **129 ⇒ ≈139**（Δ ≈ +10 = `settleTurn` ≈8 行 + 核件导入 1 行 − 2 + 档头注 ≈3；组成 = 回合尾结算单实现（标题 → 落盘；中止墓碑两查位——U-7 原样）+ 两 `saveAgentSlot` 结算行改两调用——取位按符号） | 本批 |
| `thincoder-desktop/test/files.mjs` | **3 ⇒ 3**（本批零新登记——空清单 `export default []` 原样；单元件 = 单元测试档不登记；集成件登记 = 基建重建落盘时 +1 行） | 本批 |
| 测试面 | **单元测试档** `docs/batches/2026-09-28-desktop-session-title.test.mjs`（已建成 · 284 行——链路 ∕ 时序 ∕ 短路 ∕ 失败 + 窗内受理 E5 ∕ 窗内中止 E6 六例；零真实网络 = `globalThis.fetch` 换桩；随批留存 · 不入仓套件）+ 集成域 `thincoder-desktop/test/integration/session-title-face.test.mjs`（**T-DSK46**——本轮不重建 E2E 基建：转父侧真机冒烟闭合，集成登记待基建重建）；测试档随修随加——不占设计条目（2026-09-27 裁定） | 本批 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `docs/desktop/design/PROJECT.md` · `docs/core/design/SESSION.md` | 本批设计落定（本档 §1 **KD-41** ∥ `PROJECT.md` §6.1 ∕ §7 ∕ §10 ∕ 变更记录 · 核档 §6.7 第三端；§4.2 本块已迁本档 §3.2）；联动面三档（`IPC.md` ∕ `UI.md` ∕ `RENDERER.md`）零触碰 | 本批（已落） |

**本批（structure-split-round · 越线档结构轮〔台账 #536〕· 实施轮 · 实读落值）拆分落形**（切点 ∕ 缝 / 行数 = 批档 `docs/batches/2026-09-29-structure-split-round.md` §2；值 = 实施轮实读 2026-09-29——设计预估值 288 ∕ 170 ∕ 245 ∕ 185 已按盘收正）：

| 文件 | 改动（原 ⇒ 实读） | 归属 |
|---|---|---|
| `thincoder-desktop/renderer/chrome.css` | **450 ⇒ 287**（会话列表面出档——原 `:136-262` ∕ `:287-323` 共 164 行全量逐字迁出；保位注一行落原切点位 `:136`） | 本批 |
| `thincoder-desktop/renderer/session-list.css` | **— ⇒ 170**（新档：头注 6 + 迁出块 164 逐字；链序 = chrome 后 ∕ skin 前） | 本批 |
| `thincoder-desktop/renderer/index.html` | **55 ⇒ 56**（增 `session-list.css` link——位次 = chrome.css 之后 ∕ skin.css 之前） | 本批 |
| `thincoder-desktop/renderer/mount-sessions.mjs` | **406 ⇒ 235**（接线面全量出档——原 `:244-406` 共 163 行逐字迁出 + import 面收 ∕ 头注收 ∕ 窄桥随迁；尾空行清理） | 本批 |
| `thincoder-desktop/renderer/session-wire.mjs` | **— ⇒ 194**（新档：头注 + 五源 import 面 + 窄桥 + 迁出块 163 逐字；缝 = 同名再出口七名） | 本批 |
| `thincoder-desktop/renderer/app.mjs` | **零改**（缝 = 同名再出口——import 面解析零变；批内件 C 腿同引用实证） | 本批 |
| `docs/desktop/design/PROJECT.md` | 本批随动实读回填（§4.1 两新档行——`session-list.css` ∥ `session-wire.mjs` 已迁本档 §3.1；chrome ∕ mount ∕ index.html 三行收正；越层段二档除名；§4.2 本块已迁本档 §3.2 + 变更记录行） | 本批 |

**本批（桌面重启自动重开 · #734 · 设计轮 · 2026-09-30 · 批 `docs/batches/2026-09-30-desktop-reopen-last-project.md`）行「现行 ⇒ 预期」**（实读 2026-09-30——内容行数口径；机制 ∕ 判据单源 = 批档 §2 ∥ `docs/desktop/design/IPC.md` §2 项目面注项 7）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/projects.mjs` | **120 ⇒ ≈175**（记录面读 `lastOpenedCwd`（族标记最新 → 族数据文件 `cwd`）+ 启动恢复导出 `restoreLastProject`（纯读 ∥ `isDirectory` 门 ∥ 落位）+ 落位动作与 `openProject` 共用提取） | #734 |
| 2 | `thincoder-desktop/src/main/main.mjs` | **183 ⇒ ≈187**（窗口创建前一次恢复调用 + 注释——单实例锁分支后、`createWindow()` 前） | #734 |
| 3 | 批内件 | `docs/batches/2026-09-30-desktop-reopen-last-project.test.mjs`（已建成 · 215 行——五腿：命中（上次打开 ≠ 最近活跃）∕ 端分离（`.cli` ∕ `.vscode` 零影响）∕ 降级·目录已删（⇒ 冷态 + 零抛）∕ 降级·族无可读 `cwd`（标记在盘而族数据文件缺 ∕ 坏 ⇒ 冷态 + 零抛 + 不误落次新族）∕ 零记录（零写 + 冷态）；**测试腿以显式 mtime 落盘**（免粒度依赖）；随批留存 · 不进仓套件） | #734 |
| 4 | 设计档随动 | `docs/desktop/design/IPC.md` §2 项目面注项 7（机制单源）+ 项 4 收正 · `docs/desktop/design/SHELL.md` §1 树两行 · 本档 §1 **KD-56** ∕ **KD-9** 两处收正 ∕ `PROJECT.md` §4.1 两行说明（`main.mjs` → `docs/desktop/design/SHELL.md` §5.1；`projects.mjs` → 本档 §3.1）∥ §6.1 **D1** ∕ §7 **T-DSK50** ∕ §8 本批边界行 ∕ §10 **CT** ∥ **CU**；§4.2 本块已迁本档 §3.2 | #734 |

**值列口径**（本块）：「现行」= as-of 2026-09-30 实读（内容行数口径——文末换行不计）；「预期」= 设计预估（实施批后对账回填——与文件账行值列同源：本档 §3.1 ∥ `docs/desktop/design/SHELL.md` §5.1）。

## 4. 验收回指（本域需求条目 · 判据全文——迁自 `PROJECT.md` §6.1 本域行 · as-of 2026-10-02）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| **D1** | 打开目录后按 cwd 哈希取会话路径（点名「同一状态文件」= `sessions/<sha1>.json`，核 `sessionPath`）；重启后该 cwd 的 `project:recent` 读数仍在（**通道面——最近目录列表面无渲染消费面（保留）**，R13 后；**`cwd` 面仍消费**——会话控制面项目钮读数；读面 = 槽面回读、零新存储——`docs/desktop/design/IPC.md` §2 项目面注 · 本档 §1 **KD-9**）；**重启自动重开（2026-09-30 需求扩展）**：进程全退再启 ⇒ 自动打开本端上次打开的项目目录（判据 = 本端记录面 mtime 最新——**「上次打开」≠「最近活跃」**）⇒ 随之恢复该项目下本端会话（渲染面 boot 接续门同链——`thincoder-desktop/renderer/app.mjs:230`）——单源 = 本档 §1 **KD-56**；判据面 = 批内件五腿（命中 ∕ 端分离 ∕ 降级·目录已删 ∕ 降级·族无可读 `cwd` ∕ 零记录）+ 真机 **T-DSK50**（两启程，本档 §5） | T-DSK1 / **T-DSK50** |
| **D2** | 新建 / 列表 / 切换 / 删除 / 重命名 / 接续六操作各有往返读数；跨端接续 = 与另两端读写同一 sessions 目录（A2）；列表条目 `createdBy` 读面 = 会话行来源端标注（缺键 ⇒ 不标注——本档 §2.7） | T-DSK3 / T-DSK12 / T-DSK20 |
| **D18** | 会话面板对齐 VSC：元数据族**三值**（provider · N msgs · updated）逐项裁定在册（provider = 槽投影 `activeProvider` 补载——本档 §1 **KD-28**）；**多标签保留**（本端结构差异不削）；单源 = 本档 §2.2 | T-DSK34 |
| **D23** | 列表计数不撒谎：count 不可得 ⇒ **显示不可得**——桌面 = **段缺席**（既有 `Number.isFinite` 门零改——`thincoder-desktop/renderer/views/sessions.mjs`）∥ CLI / VSC / `read_history` = 「—」；设计面单源 = `docs/core/design/SESSION.md` §6.25 判据句 4（台账可靠批）；计数面本端零改（既有 `Number.isFinite` 门）；**账本异常警示面（账本可靠批 · 桌面微轮）** = 会话控制面下拉首行 dim 注记（`div.session-ledger-notice` · `data-ledger-notice` · 非可点；触发 = `refused > 0 ∨ scene`——单源 = 本档 §2.5 / `docs/desktop/design/IPC.md` §2「会话族注」项 6） | T-DSK40 + 既有门（计数段缺席零改） |
| **D26** | 会话标题链：标题生成 ⇒ 落盘 ⇒ 左列行 ∕ 标签条 ∕ 状态行 `title` 段三面随动（标题先于落盘 · 结算单实现）——单源 = 本档 §1 **KD-41** ∕ 核档 `docs/core/design/SESSION.md` §6.7（第三端） | T-DSK46 + 单元测试档（`docs/batches/2026-09-28-desktop-session-title.test.mjs`——已建成 · 284 行 · 随批留存） |

**会话标题接线批（验收面 · 2026-09-28）**：需求回指 = **D26**「会话标题链接线」（已落——`docs/desktop/requirements/PROJECT.md:171`；同族 = **D17** 状态行 `title` 段 ∕ **D18** 会话面板）；设计单源 = 本档 §1 **KD-41** ∕ 核档 `docs/core/design/SESSION.md` §6.7（链单源——第三端）；
机检面 = **单元测试档** `docs/batches/2026-09-28-desktop-session-title.test.mjs`（已建成 · 284 行——链路 ∕ 时序 ∕ 短路 ∕ 失败 + **E5** 窗内受理零丢失 ∕ **E6** 窗内中止零标题零写——六例；零真实网络 = `globalThis.fetch` 换桩；随批留存 · 不入仓套件）；
真机面 = **T-DSK46**——**本轮不重建 E2E 基建**（测试面全清重置后集成域空）：转**父侧真机冒烟**闭合，集成用例（`thincoder-desktop/test/integration/session-title-face.test.mjs`）登记待基建重建；**离线不可产面**（真 provider 回合 ⇒ 标题生成 ⇒ 落盘 ⇒ 左列 ∕ 标签条 ∥ 状态行三面随动 + 失焦通知携标题）= 人工走查 + 父侧真跑闭合（D16 义务）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  测试档随修随加——不占设计条目（2026-09-27 裁定）。

（§6.1 本域行全五条已迁讫；批块一条已迁讫（上）——本域无余量。）

## 5. 用例（本域 · 全文迁自 `PROJECT.md` §7 涉行 · as-of 2026-10-02）

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK1 | 正常 · 项目入口 | 打开目录 A（无既有会话） | 生成 / 命中 A 的会话路径；主界面就绪，会话控制面下拉出现 A 条目 | — |
| T-DSK2 | 边界 · 最近目录（退场——R13 后无该面） | — | ❌ 不做（会话模型轮 R13：最近目录列表 UI 退场——开项目入口 = 会话控制面项目钮 + 主进程原生对话框；「打开即物化」由 T-DSK1 承载、「点开即续」由 T-DSK32 序列承载；通道 `project:recent` 保留（**最近目录列表面**无渲染消费面——单源 = `docs/desktop/design/IPC.md` §2 该行）） | — |
| T-DSK3 | 正常 · 会话族 | 新建 3 个会话 → 重命名 1 个 → 删除 1 个 | 会话控制面下拉 = 2 项（`session-item`）且名称为改后值；会话行按 `createdBy` 标注来源端（老槽缺键 ⇒ 不标注） | — |
| T-DSK12 | 正常 · 跨端接续 | 另端起一个会话 → 本端打开同一 cwd → 接续 | 历史完整载入并可继续对话；另两端读数不变（无互写） | — |
| T-DSK20 | 边界 · 会话控制面下拉溢出 | 项目内会话数超单屏容量 | 下拉（`.session-dropdown`）可滚动（`overflow-y: auto`——`thincoder-desktop/renderer/session-list.css:16`）∧ 条目数 = 会话数；条目标题 / 元数据超宽 ⇒ 省略三件（`text-overflow: ellipsis`——同档 `:59-60` ∕ `:74-75`） | — |
| T-DSK25 | 正常 · 会话控制面下拉点按 | ① 点非活动条目；② 点活动条目 | ① 条目激活 ⇒ 切换会话（`session:switch`——点条目同一路；点条目 ⇒ 关下拉）② 界面不变（零重复开页） | — |
| T-DSK26 | 正常 · 删会话的页随动 | ① 删活动会话（另有邻位）② 删唯一会话 ③ 删非活动会话 ④ 确认 popover 按取消；⑤ 已删会话迟到的回执（删后到达） | ① 邻位接管：`activeSession` = 邻位 · 屏面转邻位页（删前会话块零残留）② 末项删除门：会话数 ≤ 1 ⇒ 拒 `last-session`（零动作）③ 两键皆不动 · 零 IPC ④ 零动作（页不动）；⑤ **零写**——页切片与 `sessionMeta` 零动（`sessionMeta` / `tabBadges` 仍写已删键 = 既有登记观察——`docs/desktop/design/RENDERER.md` §1.1） | — |
| T-DSK34 | 正常 · 会话面板元数据（D18） | 项目内 ≥2 会话 | 行元数据三值在场（provider = 槽 `activeProvider` 投影；`messageCount` / `updatedAt`）；多标签结构不动（既有标签用例不缩水） | 机检面 = 单元测试档惯例（原两档随 2026-09-28 全清重置退场——行三值构树 ∕ 行投影 `activeProvider` 两向） |
| T-DSK40 | 正常 · 账本警示面（真 Electron） | fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕+ 会话槽族档〔`cwd` = `PROJ`——沿 T-DSK32 / T-DSK39 夹具先例〕+ **损坏现场档** `{manifest}.corrupted` 一枚〔= `<临时家>/.thincoder/sessions/<cwd 哈希>.json.manifest.corrupted`——命名单源 = `docs/core/design/SESSION.md` §6.1 后缀族〕；清理 = 两枚临时目录） | ① 真点**会话控制面项目钮**（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ 等 `[data-guide="no-message"]`（resume 开页两况同落）② 点开会话控制面下拉 ⇒ 下拉首行 = `div.session-ledger-notice[data-ledger-notice]`（**非 `button`** ∧ 零 `data-action`——非可点）∧ `.session-item` 条目数 = 夹具族数（不打断列表）③ PNG 落 `thincoder-desktop/test/artifacts/ledger-notice.png`（存在 + magic）④ 全程零 `pageerror` | 机检面 = 单元测试档惯例（原集成档 `ledger-notice.test.mjs` 随 2026-09-28 全清重置退场）；判据载体 = 本档 §2.5 项 5；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §3.6 / §6；用例号自铸披露 = §6 **AU** |
| T-DSK46 | 正常 · 会话标题链（真 Electron） | fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕+ 会话槽族档〔`cwd` = `PROJ`；槽 `title` 在场——沿 T-DSK32 / T-DSK39 夹具先例〕） | ① 真点**会话控制面项目钮**（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ 开页 ② 会话控制面下拉条目标题 = 槽 `title` 值 ∧ `rail.session.untitled` **零节点**（负断言）③ 下拉选择器标签 = 同值 ④ 状态行 `title` 段词 = 同值 ⑤ PNG 落 `thincoder-desktop/test/artifacts/session-title.png`（存在 + magic） | 机检面 = 集成域 `thincoder-desktop/test/integration/session-title-face.test.mjs`（拟新增）——**本轮不重建 E2E 基建**（集成登记待基建重建；本批 = 父侧真机冒烟闭合）；**离线不可产面**（真 provider 回合 ⇒ 生成 ⇒ 落盘 ⇒ 三面随动 + 通知携标题）= 人工走查 + 父侧真跑闭合；用例号自铸披露 = §6 **BP**（留原址未迁） |
| T-DSK50 | 正常 · 重启自动重开（真 Electron · 两启程 · D16） | 程 1：fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕——空会话族）⇒ 真点**会话控制面项目钮**（`button.session-project`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步）⇒ 开页 ⇒ **关窗退出**；程 2 = 同一临时家**再启动**（不点任何钮）；负控臂 = 另一临时家（从未开过项目）同法启动 | 程 1 = 既有「点开即续」面（照 T-DSK32 ∕ T-DSK39）；程 2 ① 项目已自动重开：`[data-guide="no-project"]` **零节点**（负断言）∧ 会话控制面项目读数非空 ∧ 输入框非 `disabled`；② 会话自动接上：开页在场（`[data-guide="no-message"]` 或块节点——按族内容；用户可感 = 项目 + 会话一条链）；③ 负控臂 = `[data-guide="no-project"]` 在场（无记录 ⇒ 冷态照旧）；④ 全程零 `pageerror`；PNG 落 `thincoder-desktop/test/artifacts/reopen-last-project.png` | 机检面 = 单元测试档惯例（载体 = `docs/batches/2026-09-30-desktop-reopen-last-project.test.mjs`——五腿；随批留存 · 不进仓套件）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = §6 **CT**（留原址未迁）；判据载体 = 本档 §1 KD-56 |

（本域用例全文迁讫（T-DSK1 ∥ 2 ∥ 3 ∥ 12 ∥ 20 ∥ 25 ∥ 26 ∥ 34 ∥ 40 ∥ 46 ∥ 50）；批内件（单元测试档）随批次档留存。T-DSK17–19（长会话渲染/回填跟滚 → `docs/desktop/design/RENDERER.md`）∥ T-DSK32（提交序——SETTINGS ∥ 夹具先例）为跨档引用，不在本表。）

## 6. 上抛（本域 · 迁自 `PROJECT.md` §10 涉行 · as-of 2026-10-02）

| 行 | 项 | 类型 | 处置建议 |
|---|---|---|---|
| **CU** | **「多实例」条文张力（存量登记 · 非本批引入）**：需求档 §2 项目模型与 §5.1「多项目并行以多实例满足」vs 桌面单实例锁实况（`thincoder-desktop/src/main/main.mjs:92`——第二实例零窗口（**明示原因框**——非静默；`--smoke` 零弹框）∥ **唤醒既有窗口**（主实例收 `second-instance`）⇒ 同端同时只此一实例；多项目并行在本端现制下不可达）——本批「多实例（同项目双开）语义」边界即按实况落（锁内单实例 ∥ 跨端同 cwd 并存 = 既有认领互斥语义零改）；是否收正需求档措辞 ∥ 另立多实例面 = 需求侧笔权 | 上抛（需求档面 · 归主 agent） | 单源 = 本档 §1 KD-56 ⑤（多实例 = 单实例锁既有）；本设计不改需求档 |
| **BO** | **存量未命名会话面**（既有槽多已 `title:""` 落盘）：接线只保证「该会话下一回合后补生成」（核自守卫 ⇒ 一次性）；恒不重开的旧会话保持「未命名」 | 登记（裁读 = **仅自然补**——KD-41 ⑤；列表侧回填被否给由） | 用户出路 = 会话控制面**手动改名**（条目 ✎ ⇒ `session:rename` ⇒ 核 `renameSlot`——`thincoder-desktop/renderer/views/session-control.mjs`）；若须群发回填 ⇒ 另批（须立机制面：触发 ∕ 节流 ∥ 并发 ∥ 失败语义） |
| **AU** | **`T-DSK40` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 / T-DSK39 先例——本微轮自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §5 用例表行；并号裁定权 = 父侧 |

（§10 本域涉行（CU ∥ BO ∥ AU）已迁讫；余（AA ∥ AP ∥ AS ∥ CT 等全局 ∥ 他域行）留 `docs/desktop/design/PROJECT.md` §10 原址。）

## 变更记录

- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2b · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：建档——本域单源档。迁入清单 = `PROJECT.md` §2（**KD-5 ∥ KD-9 ∥ KD-15 ∥ KD-16 ∥ KD-28 ∥ KD-41 ∥ KD-56**——逐字，表行形态）∥ `UI.md` §1（会话控制面行 ∥ 对齐重定位项 4 ∥ D21 项 2 + 9 面表 ∥ 七条对位处置 ∥ 账本警示面注 5 项 ∥ 对齐第三批 P12 ∥ §2 项 3 + 旁证——逐字，语义边界折行）∥ `PROJECT.md` §4.1（会话族行 **10** 行——逐字）；原址各留一行指针（`PROJECT.md` §2 ∥ §4.1 · `UI.md` §1）。
  迁入文本内「本档 §x」回指按新落点改指（如「本档 §1「本批注（账本警示面）」」⇒「本档 §2.5」；「本批注（D21）项 2」⇒「本档 §2.3」）；域内余量（§4.2 批块 ∥ §6.1 ∥ §7 ∥ §10 涉行）未迁——随 2c 承接（批档 §2 同拍）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：本域文件账续迁——§3.1 增 `session-flags.mjs` 行（自 `docs/desktop/design/PROJECT.md` §4.1；原址改一行指针）∥ **§3.2 新立**：批块 **3 块**（会话标题接线 ∥ 越线档结构轮 ∥ 桌面重启自动重开——迁自 §4.2）；迁文内「本档 §x」回指按新落点改指（KD-41 ∕ KD-56 ∕ KD-9 = 本档 §1；§4.2 本块 = 本档 §3.2）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 4 · 终篇）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4/§5/§6 域行全文迁讫**——§4 收 D1 ∥ D2 ∥ D18 ∥ D23 ∥ D26 五行全文 + 会话标题接线批批块（迁自 `docs/desktop/design/PROJECT.md` §6.1；原址各改一行指针）∥ §5 收 T-DSK1 ∥ 2 ∥ 3 ∥ 12 ∥ 20 ∥ 25 ∥ 26 ∥ 34 ∥ 40 ∥ 46 ∥ 50 十一行全文（迁自 §7；行内回指按本档落点改指）∥ §6 收 CU ∥ BO ∥ AU 三行全文（迁自 §10）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**文档清账轮 · 值+形同拍收正 · 主 agent**〔父侧直接执行 · 可 revert〕——承批档 `docs/batches/2026-10-02-doc-settlement-round.md` §2.2 ④ ∥ §2.6 U-2：§3.1 `session-actions.mjs` 行 **73** ⇒ `**79**（实读 2026-10-02——前读 73〔实读 2026-09-28〕）`（KD-4 实读 `countContentLines` = 79——末项删除门 P12 落笔之增）。台账 #806。）
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：§3.1 `session-slots.mjs` 行走读齐平（**235 ⇒ 259**——`providerStateOf` 三回执族载荷单源 ∥ `pageHistory` 回执携 `providerState`）。**零新语义**（读数）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**桌面第二实例提示轮 · 跨档随正轮 · eng-designer**——承批档 `docs/batches/2026-10-03-desktop-second-instance-notice.md` §1 · 台账 #838）：§6 **CU** 行按现行为随正（`thincoder-desktop/src/main/main.mjs:76` ⇒ **`:92`**；「第二实例零窗口静默退出」⇒「零窗口明示原因框（非静默；`--smoke` 零弹框）∥ 唤醒既有窗口」——单实例结论零改）。**零新语义**（随正）。明细 = 批档 §2 形式化块。
