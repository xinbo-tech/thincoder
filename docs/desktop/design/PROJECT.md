# 桌面端（DESKTOP）· 设计

> 板块 = **桌面端设计总览档（索引 ∥ 跨域 ∥ 历史段）**——索引（§1 ∥ §2 ∥ §3 ∥ §5 ∥ §8 ∥ §9 ∥ §11）· 跨域 ∥ 总表面（§4 文件账残面 ∥ §6 验收总表 ∥ §7 用例总表 ∥ §10 上抛总表）· 历史段（变更记录）；分档详情见 §3 / §9 / §11 的指针。
> 本部分 = **十四档**：本档 · `docs/desktop/design/SHELL.md`（宿主适配层——进程与目录形态 · 宿主面职责 · 与核的接口面 · 壳装配第三份）· `docs/desktop/design/IPC.md`（主 ↔ 渲染通道契约）。
> 另四档 = `docs/desktop/design/UI.md`（界面形态与交互 · 活动池与状态位）· `docs/desktop/design/RENDERER.md`（渲染面实现工艺——有界渲染窗口 / 回填与跟滚）· `docs/desktop/design/E2E-TESTING.md`（端到端测试基建——真 Electron 驱动 · 家目录隔离 · 固定落点截图；并入单入口）· `docs/desktop/design/WEB-QUICKCHECK.md`（渲染面 web 快筛——开发期回路；不作验收判据）。
> 域拆分七档（文档体系重组批 · 波 1 / 波 2 · 2026-10-02 增）= `docs/desktop/design/MENU.md`（菜单体系——应用菜单五组双语 ∥ 菜单 ↔ 渲染面窄通道）· `docs/desktop/design/PACKAGING.md`（打包与发行——打包链 ∥ Windows 安装包 ∥ 官网托管）。
> 域档续：`docs/desktop/design/ACTIVITY.md`（活动池与消化面域）· `docs/desktop/design/COMPOSER.md`（输入区域）· `docs/desktop/design/CHAT.md`（对话流域）· `docs/desktop/design/SESSIONS.md`（会话域——会话端标识 ∥ 控制面 ∥ 列表读面 ∥ 标题链 ∥ 重启自动重开）· `docs/desktop/design/SETTINGS.md`（设置域——设置面板七段 ∥ 首启向导 ∥ 样式收正 D37）。
> 需求侧 = 需求分卷（`docs/desktop/requirements/`——查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；功能点 = 九域卷 + 总览 D14 ∥ 验收 ∥ 依赖面 = 总览 §7 ∥ §8——**范围数随需求卷现文**）；产品族三端关系与跨产品共享契约 = `docs/core/requirements/PROJECT.md` §3。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 文档体系落点（第四部分）判别与命名 = `docs/core/design/DOC-SYSTEM.md`；全仓模块地图与硬约束 = `docs/core/design/ARCHITECTURE.md`。
> 建档：2026-09-25（桌面端设计批 1）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。
> **行数纪律（300 建议 ∕ 500 硬限）只对代码档**（`.mjs` ∕ `.cjs` ∕ `.css` 等）；纯 `.md` 设计档不受限（档长按内容需要；设计档读者面 = 人）。
> 本批 = **只设计**：无产品代码、无打包动作——`thincoder-desktop/` 实体目录与产物留实施批。

## 一、索引（导航 · 地图 · 总览）

> 本节区 = 总览与导航面（§1 ∥ §2 ∥ §3 ∥ §5 ∥ §8 ∥ §9 ∥ §11）；跨域 ∥ 总表面 = 次节区（§4 ∥ §6 ∥ §7 ∥ §10）；历史段 = 变更记录。

## 1. 方案与理由

### 1.1 模块目标

给不想 / 不能用 VS Code 的人一个**独立桌面入口**：同一个 agent、同一份配置与会话、比终端更宽的会话与活动视图。本设计（本部分十四档）回答三件事：

- **怎么接核**（接口面）= `docs/desktop/design/SHELL.md` §3 · `docs/desktop/design/IPC.md`；
- **怎么长**（前端与壳装配形态）= `docs/desktop/design/SHELL.md` §1 / §4 · `docs/desktop/design/UI.md` · `docs/desktop/design/RENDERER.md`；
- **怎么发**（三平台发行链）= `docs/desktop/design/PACKAGING.md` §2。

### 1.2 总体形态（三条）

1. **进程内第四壳，不是新核**——机制面全部经 `@thincoder/core` 引用，桌面端只持接入面（宿主适配 + 前端 + 壳装配第三份）。
2. **三层进程分工**——主进程（Node / ESM：核 · 会话 · 配置 · 进程树）∥ 预载（窄桥）∥ 渲染（无 Node，纯 DOM 前端）。渲染面能力面 = 浏览器原生，能力缺口一律经 IPC 回主进程。
3. **发行 = 宿主随产物分发**——Electron 作为宿主平台随安装包走；体积 / 供应链 / 三平台打包链成本落本端发行面（需求档 §2 已定性）。

### 1.3 与另两端的对位（一句话差）

CLI = 裸 ANSI 终端 + 单会话前台；扩展端 = VS Code 宿主内的 Webview 面板；桌面端 = 自带宿主的窗口应用 + **会话标签页**（多会话并行可见）+ 随会话的活动池。三端机制同源，接入面各自独立（不镜像、不互引代码）。

## 2. 关键决策记录

| # | 决策 | 理由 | 被否候选与何故否 |
|---|---|---|---|
| KD-1 | 宿主 = Electron（需求档已定，本条记工程含义） | 宿主自带 Node ⇒ 核可在同进程内直用，无侧车进程、无 IPC 协议自研；窗口 / 菜单 / 系统主题面齐全 | **Tauri**（需 Rust 工具链 + 系统 WebView 版本面 = 三平台差异源；宿主不带 Node ⇒ 核须另起侧车）· **纯 Node 自绘窗口**（无成熟跨平台窗口面）· **复用扩展端 Webview 前端**（用户 2026-09-25 同日撤销） |
| KD-2 | 渲染资源经**自定义标准协议**（`app://`）供给，不直载 `file://` | 官方 API 实读：`protocol.registerSchemesAsPrivileged`（**ready 前 · 仅一次**）+ `protocol.handle`（ready 后）；注册为 standard + secure + supportFetchAPI ⇒ 相对 URL 可解析、web storage 可用（官方档明记：非标准 scheme 二者皆不可）、渲染面获**真实 origin**（CSP 与同源判据可用） | **`file://` 直载**（模块脚本同源面存疑 + 无可用 origin）· **`webSecurity: false`**（绝不——渲染面孤岛化）· **起本地 http 服务**（多一个监听端口 + 生命周期面） |
| KD-3 | 预载 = **沙箱 CJS 窄桥**（`contextBridge`），渲染面零 Node | 官方 ESM 档实读：**沙箱预载不支持 ESM import**（`require("electron")` 可用）；预载脚本忽略 `type: module` ⇒ 取 `.cjs` 扩展名；`contextIsolation: true` 为官方前置 | **`nodeIntegration: true`**（渲染面直持 Node = 逃逸面）· **关 `contextIsolation`**（动态 import 走 Chromium 载入器、桥面失守） |
| KD-4 | 前端**零构建**：原生 ESM + 手写 DOM，不引打包器 | 与仓内「无构建步骤」硬约束同支；官方档明记渲染器 ESM 不接 Node 内置与 `node_modules` ——本端正好都不需要 | **webpack / Vite**（引入构建步与 devDep 链，违「无构建」）· **引框架（React/Vue 等）**（违「零框架」裁定） |
| KD-5 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |
| KD-6 | → `docs/desktop/design/PACKAGING.md` §1（as-of 2026-10-02） | — | — |
| KD-7 | 宿主下限 = **Electron ≥ 44.x**，且以**启动自检**为准 | 核依赖 `node:sqlite`（免 flag 需 Node ≥ 22.13）⇒ 宿主须带够版本的内置 Node（Electron 44 内置 Node **24.21.0**；本端下限取 **Node 24 主版本底线**——需求面 = 需求档 §8 P1）。设计**不把下限压在外部档上**：启动时断言 `process.versions.node` 与 `node:sqlite` 可加载，不满足 ⇒ 显式报错退出（自检本身 = 判据） | **运行期降级路径（无 sqlite 的记忆实现）**——拒：两套记忆逻辑再现（`docs/core/requirements/MEMORY.md` §2.1 的 A12/A13 已归一，不留降级）· **保留 Electron 37 面**（内置 Node 22 · 已 EOL） |
| KD-8 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |

| KD-9 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |

| KD-10 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-11 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-12 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-13 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-14 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-15 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |
| KD-16 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |

| KD-17 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-18 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-19 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-20 | **状态栏占用读数 = 回合尾事件推**（`ev:usage` 载荷 `{ key, ctxPct }`）；**未至 / 非正数 ⇒ 零节点**（禁假造）；归约面按会话 `key` 写切片（**唯一写者**），切标签取活动键值随动 | 需求档 §3.1:52「活动会话的上下文占用（实时读数）」+ §3.2 项 4「回合收尾：状态栏上下文占用更新」——两处皆指回合尾为更新时点；渲染面不复算（第二判据源 = 与真实用量分叉）；载荷与显示门判据单源 = `docs/desktop/design/IPC.md` §1 `ev:usage` 行 | 渲染面按历史长度自算（与真实用量分叉）· 占位读数（`0%` / `—`——禁假造，沿池面两读数先例）· 轮询通道（无消费面） |
| KD-21 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-22 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-23 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-24 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-25 | **状态行 = 对齐 CLI 口径**：段集逐项裁定（**2026-09-28 屏面为准重审后 = 承载 17 / 旁置 1 / 不适用 1 行**——重审定形 = KD-30；表住 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1）；承载四项（耗时 / 令牌 / 计时 / 回合 N/M）**已落（R3a）**——读数槽四住 `thincoder-desktop/renderer/events.mjs`，载荷扩 = `ev:usage` 两键（单源 = `docs/desktop/design/IPC.md` §1） | 用户走查第 1 点 + D17（零静默省略）；键位组不适用 = **提示不入段**（`/:` 命令面已在册——可发现性入口另议；单源 = `docs/desktop/design/UI.md` §1 表行 15） | **照搬 CLI 键位组**（违「提示不入段」裁定——可发现性入口另议）；**并 VSC 状态栏**（用户口径 = 对齐 CLI）；**只给占用 + 告警**（现状——D17 失守） |
| KD-26 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-27 | → `docs/desktop/design/RENDERER.md` §1.6（关键决策 · 渲染核 · as-of 2026-10-02） | — | — |
| KD-28 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |
| KD-29 | **内容面 / 会话面板视觉对齐 VSC（D21）**：值以 VSC webview 实值为源（三律 = 宿主主题色角色对位 · 语义常量值照搬 · 盒层单层律）；值表分处单源——内容面 **21 面** 住 `docs/render-core/design/RENDER-CORE.md` §5 · 会话面板面 **9 面** 住 `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2；**结构零动**（外壳 / 主题体系 / 左列 + 标签条结构 / 行族结构不动）；新增变量 **14**（内容面 12 + 会话面板面 2——单源 = 主题表 `thincoder-desktop/renderer/theme.css`）；端差 **3** 项已全部处置（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`：① 盒层单层 已落 ∕ ② 推理内代码块同形 消 ∕ ③ 会话面板 消——核档 §9 同拍） | 用户 2026-09-28 04:42 走查（① 会话流「样式与 VSC 区别很大」② 会话面板「与 vsc 端完全不同，我之前要求过对齐的」）+ 需求卷 **D21**；核产出件两端同形优先（推理内代码块——核档 §9 端差②） | **保持现制**（用户明否）；**逐像素复刻 VSC**（宿主主题变量在桌面不存在——取值即自铸；且 VSC 侧作用域副产物不宜复刻）；**只改配色不改排版**（差异大头在字族 / 盒模型 / 高亮——浅改不解）；**另立第二张主题表**（值变量单源 = `theme.css`） |
| KD-30 | **状态栏对齐 = 「屏面为准」重审（2026-09-28）**：标尺 = 屏面可见行为——**banner 四态（PLAN / AUTO / ADVISOR / ENG）上状态行行首**（与 CLI 同段位 / 同语义；「PLAN / ADVISOR 本端无该两态」旧裁不实——两态随会话槽恢复可为真）+ 静息状态词（就绪——**入状态词闭枚举**；词形来源 = CLI 静息值 `Ready`，`thincoder-cli/src/tui/tui-state.mjs:43` 实读，核 i18n 无同源词）与输入提示段（Enter: send）补落 + 键位尾四件逐件坐实；段集 **17** | 用户 2026-09-28 05:34 / 05:38 走查裁定（「对齐」= 屏面为准；「旁置 / 不适用」等账面打折项逐项重审）；两态可为真实证 = `thincoder-core/session-lifecycle.mjs:111-134`（槽恢复）+ 桌面无该两态呈现面；「同一事实一处」在四态上状态行后落成（两态只住状态行一处——CLI 同理） | **四态全留会话头**（状态行与 CLI 不一致——D22 主句失守）；**四态双呈现**（会话头 + 状态行——违「同一事实一处」）；**维持旧账**（旁置 / 不适用不改——用户明否） |
| KD-31 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-32 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-33 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-34 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-35 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-36 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |

| KD-37 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-38 | **台账读数出站 = 启动拍 + 周期拍（`ev:ledger`；`REFRESH_MS` = 120s）** | VSC 两拍（端自持周期注册——间隔常数 = 核 `REFRESH_MS`）对位 = 桌面**启动拍 + 周期拍**（120s；直消费核 `startLedgerSurface`——单源 = `docs/desktop/design/IPC.md` §1 `ev:ledger` 行；项目级读数复读同点 = 开项目成功链）；被否候选 = 挂 2s 拍（频率与核扫描语义不合——登记） |
| KD-39 | → `docs/desktop/design/CHAT.md` §1（as-of 2026-10-02） | — | — |
| KD-40 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-41 | → `docs/desktop/design/SESSIONS.md` §1（as-of 2026-10-02） | — | — |
| KD-42 | **对齐审计强制输入 = 核档头「留端」清单 + 核注入缝登记表（两清单逐项对账 · 缺一项即红）**（2026-09-28 · 台账 #524）：此后任何以「对齐 ∕ 端差 ∕ 缺口清点」为名的审计（设计轮 ∕ 评审轮 ∕ 走查）**开审前**须以两份权威输入逐项对账——① 核档头 `留端：` 头注（全仓现读：`thincoder-render-core/**` 与核内相关档；**项级一行**）；② 核注入缝登记表（**每审现读原档**；设计面单源 = `docs/core/design/CORE-UNIFICATION.md` §2.13.3（函数面注入位表）＋ §2.13.4（④裁决行对照）；**对账面 = 设计面记录 ＋ 届盘复核**——机检自检面随 2026-09-28 核测试树全清退役，测试树重建后回填）**并补扫域外缝**（登记表未列者并行对账；**对账保持人工**——机械并扫命名族 `(configure|reset|set)[A-Z]` 会撞功能性 setter ⇒ 假阳性；先例 = `thincoder-core/prompt-files.mjs:92` 的 `configurePromptInjections`（根外缝——曾漏检；桌面已补接））。**判定三态**：复用 ∕ 上提 ∕ 真端差（三件齐 = 结构性不对称 + 证据 + 裁定）；**举证不足 ⇒ 消除**。**根因（先例）**：`docs/batches/2026-09-28-desktop-vsc-align-2.md:79` 把「滚动跟滚主机制」判「已搜未得（零缺口面）」——根因即未把留端清单当对账输入（后果实证 = 台账 #518 子代理块内容区跟滚漏项）。**对账节载体**：每批设计内「对账节」在册（先例 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2.3）。 | **被否：只搜「已实现面」的审计**（漏「留端登记面」——本先例的成因）；**被否：把两清单副本抄进设计档**（副本即陈旧源——单源纪律：每次现读原档）；**被否：以「已搜未得 / 各自在册等价」结案**（判据不足即按消除办） |

| KD-43 | **右键编辑菜单 = 宿主面职责（Chromium role + 词表显式文案）**（复制面对齐批 · 2026-09-29 · 台账 #557 · 需求 **D27**）：① 机制 = `win.webContents.on("context-menu", …)` ⇒ 按 `params`（`isEditable` / `selectionText` / `editFlags`）构模板 ⇒ `Menu.popup({ window })`；条目集 = 可编辑 ⇒ 剪切 ∕ 复制 ∕ 粘贴 ∕ 全选（`enabled` 取 `editFlags`——缺键不禁用）· 非编辑 ∧ 选中 ⇒ 复制 ∕ 全选 · 非编辑 ∧ 空选 ⇒ **零菜单**；② 行为 = Chromium role 四件（执行径 = 主进程 `webContents` 方法——`contextIsolation` / `sandbox` 下成立）；③ 文案 = **显式 `label` 取词表**（`menu.edit.*` 四键两语；主进程 `loadConfig().locale` **现读**——`thincoder-desktop/src/main/attachments.mjs` 先例）——**不采 role 默认文案**（实读 Electron v44.4.5 `lib/browser/api/menu-item-roles.ts`：默认文案 = 英文硬编码字面 ⇒ 直采即 `#533` 式 en-only 债）；④ 落点 = 新档 `thincoder-desktop/src/main/context-menu.mjs`（已落 · 两纯函数 · 零 `electron`）+ `window.mjs` 落子 | 用户 02:59 走查（「vsc是可以选中文字然后用鼠标右键复制的……desktop端……不能用右键复制粘贴」）+ 需求 D27；VSC 侧右键 = VS Code 宿主自带（扩展零代码）⇒ 对齐面 = 本端宿主层 | **role 默认文案**（en-only 债复刻）· **渲染面自建 HTML 菜单**（非宿主原生 ∕ 渲染面零 Node）· **非编辑空选给菜单**（无可用动作 ⇒ 噪声——差异登记 = §10 **BU**）· **链接 ∕ 图片类条目**（D27 射程外——禁自造） |

| KD-44 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-45 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-46 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-47 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-48 | → `docs/desktop/design/RENDERER.md` §1.6（关键决策 · 渲染核 · as-of 2026-10-02） | — | — |
| KD-49 | → `docs/desktop/design/SETTINGS.md` §1（as-of 2026-10-02） | — | — |
| KD-50 | → `docs/desktop/design/RENDERER.md` §1.6（关键决策 · 渲染核 · as-of 2026-10-02） | — | — |
| KD-51 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |

| KD-52 | → `docs/desktop/design/COMPOSER.md` §1（as-of 2026-10-02） | — | — |
| KD-53 | **桌面堆遥测与冻结取证（桌面堆取证修复批 · 2026-09-30 · 台账 #694 · 批 `docs/batches/2026-09-30-desktop-heap-freeze.md`）**：① 遥测武装 = 新档 `thincoder-desktop/src/main/heap-watch.mjs`（本批新档）——**隔离形 = 策略面零 `electron` 顶层 import（禁令）**：electron 原语全经注入缝（点名 = `sample` ∕ `snapshot` ∕ `log` 三缝 + 冻结 ∕ 恢复动作原语）；装配住 `thincoder-desktop/src/main/main.mjs`（先例 = KD-35 `notify.mjs`）——60s 采样（注入缝 ⇒ 平 node 直测；先例 = CLI `thincoder-cli/src/heap-watch.mjs:41-79`）+ 双档阈值 70% ∕ 85%（与 CLI 同值）+ warn 行**带进程标签**（主进程自读 `process.memoryUsage()` ∕ `v8.getHeapStatistics()`；子进程读数 = `app.getAppMetrics()`——逐进程 type ∕ pid ∕ workingSet ∕ cpu）；② 快照双径 = 主进程 `v8.setHeapSnapshotNearHeapLimit(1)`（近上限自动落盘；CLI 先例 `thincoder-cli/src/crash-reports.mjs:87-89`）+ 渲染进程按需 `webContents.takeHeapSnapshot(path)`（**触发 = 健康期阈值（主进程自读堆比 `heapUsed ∕ heap_size_limit` ≥ 85% ∨ 渲染面 `workingSet` ≥ 800MB〔定值 = 两冻结案实测下沿 933MB × 0.85 ≈ 793 ⇒ 圆整；另一案读 = 2,926MB〕∧ ping 正常）∥ 冻结自复（`responsive` ≤ 宽限）——冻结阻塞期不可得（渲染主线程不可达，实测）**；once + 体积门 + native `Notification` 预告——零新 IPC；收正单源 = §2.11 D8）；③ 冻结门族 = `win.webContents` `unresponsive`（+ `responsive` 恢复记；主侧 ping 兜底——**定值 = 间隔 15s ∕ 超时 8s ∕ 连超 2**（父裁 2026-09-30 收紧：30s ⇒ 15s；收正单源 = 批档 §2.14）——**ping 径同序**：连续 2 次超时 ⇒ 落现场 ⇒ 宽限 ⇒ 恢复动作；grace ∕ once ∕ 5min 三守卫同施）∥ `render-process-gone` ⇒ 落 `~/.thincoder/crash-reports/`（与 CLI 同目录契约：现场 JSON〔双进程读数 + CPU + 动作序〕+ stderr 可见行）；**恢复动作（两径同）= 宽限 15s 持续不响应（`unresponsive` 未复 ∨ ping 续超时）⇒ `forcefullyCrashRenderer()` + `reload()`（换新渲染进程——官方恢复序；once ∕ 5min 节流；先落现场；在飞显示段暂缺至收尾重读——取舍在册 = §2.11 D9）**；**重载后补（D9 修订单——父裁 2026-09-30）= 活跃会话自动接续**（渲染侧 boot 补启：`project.cwd` 非空 ⇒ 自动一次 `session:resume`——既有单路 ∕ 零新通道 ∕ 主进程零改；收正单源 = 批档 §2.14a）；④ 配置键 = `diagnostics.heapWatch` ∕ `diagnostics.heapSnapshot`（核 DEFAULTS 已在——`thincoder-core/config.mjs:90`；桌面此前**零消费** = 键面缺口，本批补） | 【依据】批档 §1 全链取证（282s 冻结 · PID 15184 2,926MB ∕ 会话文件 4.8MB ≈600× 放大 · 「app 自警 heapUsed 3.0∕4.2GB」出处不可判 = 进程标签缺失）；桌面堆诊断能力**零存量**（grep 实读：desktop 树零 heap-watch ∕ 零 crash-reports ∕ 零快照武装）；CLI 现成件可 port（`thincoder-cli/src/{heap-watch,crash-reports}.mjs`）；**第二次冻结（2026-09-30 00:2x · 批档 §1.3）呈渲染侧 CPU >100% 计算风暴签名（堆 <1GB 即冻——触发条件不止堆大小）** ⇒ 读数面须含 CPU（承批档 §2.10）；不武装 ⇒ 下次冻结仍无现场 | 【被否】仅调大 Node 堆上限（改崩溃时机——CLI 批先例已否）；依赖外置实时 CDP ∕ 人工观察（不可自动复现 ∕ 非产品能力）；新配置键（核已有两键——复用为单源） |
| KD-54 | → `docs/desktop/design/RENDERER.md` §1.6（关键决策 · 渲染半边 · as-of 2026-10-02） | — | — |
| KD-55 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-56 | → `docs/desktop/design/SESSIONS.md` §1（关键决策 · 会话域 · as-of 2026-10-02） | — | — |
| KD-57 | **桌面排版基线（D29）= 一种字体 ∥ 一个字号 ∥ 行高 1.3 ∥ 字距 `normal` ∥ 自有文字零粗体**（排版统一批 · 2026-09-30 · 台账 #736 · 需求 D29）：① **统一值**（建议值——用户 ∥ 批准面裁）：字族 = `--mono` 等宽栈（`--font: var(--mono)` 一处切换——全栈同族：外壳 ∥ 内容面 ∥ 工具卡 ∥ 状态行 ∥ 面板 ∥ 核件消费面）；字号 = **14px**（`--fs`——= 现值 body ∥ 内容面同值；轻通道轮四 笔 11–12 收窄定档〔2026-10-01：14 ⇒ 13 ⇒ 12〕、轮五 定版〔2026-10-01：12 ⇒ 14〕；除基值外另见 8 ∥ 10 ∥ 11 ∥ 12 ∥ 13 ∥ 15 ∥ 16 ∥ 18px 八级全数归基线）；行高 = **1.3**（`--lh`——轻通道轮四 收窄定档〔2026-10-01：1.5 ⇒ 1.4 ⇒ 1.3〕；撤 1 ∥ 1.4 ∥ 1.45 ∥ 1.55 ∥ 1.6 ∥ 1.7 六值）；字距 = **`normal`**（`--ls`——撤 0.3px ∥ 0.5px ∥ 0.04em 三处 tracking；落位 = `theme.css` body 面 `letter-spacing: var(--ls)` 独立一行〔`font` 简写不载字距〕——全栈唯一声明点 ∥ 与验收判据同字）；变量单源 = `thincoder-desktop/renderer/theme.css`。② **自有文字零粗体**——自有三面 `font-weight` 全归 400（撤 500 ∥ 600 ∥ 700 三档——逐处 = 批档 §2 清册）；强调改**颜色通道**（既有色位承担——逐项 = `docs/desktop/design/UI.md` §1「本批注（排版统一 · D29）」项 2）；**markdown 标记豁免**（`strong` 700 ∥ `h1–h6` ∥ `th`——用户「除了 markdown 里标了的」）。③ **markdown = 基线 + 修饰层**（不得自成独立体系）：正文族 ∥ 号 ∥ 行高 = 基线；修饰只许**相对（em）或非尺度通道**（粗体 ∥ 斜体 ∥ 色 ∥ 底 ∥ 边框）；**绝对 px 岛清零**（语言条 10px ∥ 复制钮 11px ∥ 推理族 12px ⇒ 基线）；值表单源 = `docs/render-core/design/RENDER-CORE.md` §5「排版统一覆盖」块（内容面）∥ `docs/desktop/design/UI.md` §1 本批注表（外壳面）。④ **D21 关系**：排版通道（族 ∥ 号 ∥ 行高 ∥ 字距 ∥ 字重强调通道）以 D29 为准（D21「值以 VSC 实值为源」在排版通道被覆盖）；**结构 ∥ 盒值 ∥ 色面仍随 VSC**（D21 三律余域零改）。⑤ **核件零触**：`thincoder-render-core/**`（含 `composer/composer.css` 逐字锁）∥ VSC 侧零改；核件消费面（输入面板 ∥ 模型菜单 ∥ 搜索条）经**桌面覆盖段**（`thincoder-desktop/renderer/chat-composer.css`——特征度提升选择器）收敛。⑥ **回退配方**（用户否决统一值时）：`--font` 值复原系统 UI 栈 + 内容面族声明改指 `var(--font)`（逐点 = 批档 §2）。⑦ **边界**：功能 ∥ 布局零动；块外边距（含件级内边距）非本批射程——现值随轻通道轮四间距归一（单源 = `docs/desktop/design/UI.md` §1「本批注（流内竖向间距 · 2026-09-30）」）；markdown 语义保留（只动「自成体系」部分）；零通道 ∥ 零词键 ∥ 零 JS。 | 需求卷 **D29**（用户 2026-09-30 18:18 ∥ 18:20 走查两条：「一种字体，一个字号，行间距字间距也都一样」∥「markdown…基于我们系统选定的字体和字号，再在这个基础上做格式修饰，不要弄出一个完全跟系统没关系的独立体系」）；现盘清点（15 档 CSS · 208 条 font 声明：族 2 ∥ 字号 9 级 ∥ 字重 4 级 ∥ 行高 8 值——「大大小小参差不齐」成句）；既有在案 = `--mono` 正文等宽族（★上抛① ∥ 本档 **AM** 行——用户未否）+ 主阅读面现值 14px（「系统选定字号」最简解） | **案 A：统一系统 UI 栈（免等宽）**——markdown ∥ 代码 ∥ 对齐面失等宽（内容面反损）+ 须竖「代码例外」第二族（违「一种字体」）；**案 B：只统一内容面**——违 D29「射程 = 桌面自有排版面」；**案 C：字号 13px**（VSC webview 默认）——主阅读面须缩小（与「基于系统选定字号」相反）；**案 D：只统一字号、保留粗体**——用户明句「不要有粗体，只用颜色区分足够了」 |
| KD-58 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |

| KD-59 | **窗口重启最大化 = 启动序「隐建 → maximize → show」（「永远」语义——零窗口态记忆）**（窗口重启最大化批 · 2026-09-30 · 台账 #745 · 需求 **D31**）：① **落点** = `thincoder-desktop/src/main/window.mjs` `createWindow()`（窗口创建面单点——全仓唯一 `new BrowserWindow`）：`show: true ⇒ false` 隐建 ⇒ `win.maximize()` ⇒ `win.show()`（插点 = 构造函数后 ∥ `setMenu` 前）；② **时机判由（先 maximize 后 show）** = `maximize()` 官方语义「Maximizes the window. This will also show (but not focus) the window if it isn't being displayed already.」（`electron.d.ts:3105-3108` ∥ `:5897-5900`——宿主 = Electron 44.4.5）⇒ 隐藏窗上调用 ⇒ **首次显形即最大化态**（结构性防「默认尺寸闪一帧」）——**推论待真机证**：官方文本未声明「显形即最大化 ∥ 无中间尺寸帧」、本仓无 Electron 原生实现可读面 ⇒ 判径 = §7 **T-DSK53** 首帧腿（`show()` 当刻读 `isMaximized()` ∥ 首帧录屏 ∕ 截图走查）；实测否 ⇒ 序收正（候选 = `show()` 后补 `maximize()`；判据腿随动）；`show()` 官方语义「Shows and gives focus to the window.」（`:3620-3622`）⇒ 补「显形 + 聚焦」（maximize 顺带 show **不聚焦**——不补则启动窗首显不聚焦）；③ **「永远」语义** = 每次启动无条件 maximize——**零窗口态读写**（不读 `isMaximized` ∥ 不落存储 ∥ 不判上次态）：手动缩小 ∥ 最大化 ∥ 最小化后退出皆同归启动最大化（用户 2026-09-30 20:45 字面确认）；**运行期零干预**（用户手动缩放不回夺——射程 = 「重启 ⇒ 打开即最大化」）；④ **平台面**（三平台皆取原生最大化语义）：Windows = 最大化（占满工作区）· macOS = 原生 zoom（`zoomToPageWidth` 默认 false ⇒ 到屏宽——非全屏；如欲全屏 = `setFullScreen`——另裁——登记 = §10 **CY**）· Linux = WM 最大化；⑤ **既有窗口逻辑交互（全零改）**：尺寸常量（1200×800 · 下限 800×600）退为**还原尺寸**（un-maximize 回原尺寸；min 约束不变）· 单实例（非主实例零窗口——零 maximize 面）· 记忆面（本端零窗口态存储既有——保持零）· `--smoke`（同经 `createWindow` ⇒ 冒烟窗同最大化——探针 ∥ 引导位读数零影响；冒烟 JSON 字段闭集零改） · **fail-open 档**（平台忽略 maximize ⇒ `show()` 兜底 ⇒ 窗口仍显形、不最大化；不悬窗 ∥ 零告警 ∥ 零重试——可接受降级）；⑥ **边界** = 窗口态记忆（位置 ∥ 尺寸 ∥ 最大化态）不做 · 最小化 ∥ 全屏 ∥ 置顶不做 · 核 ∥ `thincoder-render-core` ∥ 渲染面 ∥ 通道 ∥ preload ∥ `thincoder-desktop/src/main/main.mjs` 零触 | 需求 D31 逐字（「重启 ⇒ 打开即最大化」+「永远」字面确认）；实读 = 现盘 `show: true`（`thincoder-desktop/src/main/window.mjs:130`——默认尺寸开窗）∥ 全档零 `maximize` ∥ 零窗口态读写（grep 实读）= 「未最大化」现因；判由 = **首帧序须结构性防闪**——「隐建 → maximize → show」序由官方 API 语义直接支持；「保留 `show: true` + 后补 maximize」（含 show 后 maximize）之别：开窗即可见 ⇒ 尺寸切换的可视帧无契约保证（平台 ∥ 时序相关——概率面非结构面） | **保留 `show: true` + 后补 maximize**（默认尺寸先显形——闪序无结构保证）· **`ready-to-show` 时点**（`win.once("ready-to-show", …)`——窗口首显推后到首帧渲染：改现行「即时显形 + 画布色防白闪」既定口径，非本批射程）· **窗口态记忆**（记录上次最大化 ∥ 尺寸重启复原——「永远」语义明否〔手动缩小亦取最大化〕；且 = 第二份存储面——违 KD-9 ∥ KD-56 零新存储旨） |

| KD-60 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-61 | **主题三态 = 渲染面 `data-theme` 状态（用户值）覆写系统缺省**（主题切换批 · 2026-09-30 · 台账 #743 · 需求 **D33**）：① **状态载体** = `data-theme` 属性——闭集 `system` ∥ `light` ∥ `dark`（缺省 `system`）；**单写者 = `thincoder-desktop/renderer/theme.mjs`**（`initTheme` / `setTheme`——`documentElement.dataset.theme` 唯一写径）；「跟随系统」= 状态值一枚（非零态）：媒体缺省 + `light-dark()` 随系统解析（系统翻转零 JS）；② **值面**（`thincoder-desktop/renderer/theme.css`）= 原「亮缺省块 + `@media` 暗块」收敛为**单块 `light-dark(亮, 暗)` 值对**（色值对 24——暗值逐字保原；`--error-fg` 同值单列）+ `color-scheme` 三态覆写；`@media (prefers-color-scheme: dark)` 退场；**D29 基线四值零动**；③ **切换面** = 设置面板头三态钮族（`data-action="settings:theme"` + `data-theme` 目标值 + `data-active` / `aria-pressed` 当前态；序 = 跟随系统 ∥ 亮色 ∥ 暗色）；④ **持久化** = 渲染面 `localStorage`（键 `thincoder.desktop.theme`——三值闭集串）——端自有 UI 态类（先例 = `poolWidth` ∥ VSC `modelPrefs`@`workspaceState`「非会话文件」；`app://` standard+secure ⇒ Web Storage 持久）；读 = 装配期一次 ∥ 写 = 点按即刻；读 ∥ 写皆捕获 + `console.error`，读失败 ∥ 表外值 ⇒ `system`（降级），写失败 ⇒ 会话内照常（fail-soft）；⑤ **store 镜像** = 顶层切片 `theme`（装配播种 ∥ 出口写；`SETTINGS_KEYS` 增 `theme`——设置面重绘径；`dataset.theme` 应用仍在 `theme.mjs`——同步不经帧）；⑥ **边界** = 窗口画布色 ∥ 原生面（菜单 ∥ 对话框 ∥ 标题栏）仍随系统（主进程不以用户值驱动原生面——`resolveTheme()` 零改；唯菜单勾选态显示缓存一枚——**KD-65** ②）· 主题换肤（色板 ∥ 自定义）不做 · 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触 · 通道 ∥ preload 零新面（除 `window.mjs` 注释两处随正） | D33 逐字（亮 ∥ 暗 ∥ 跟随系统 + 记住（重启恢复））+ D30 同族（用户偏好持久化——`localStorage` 先例）；实读 = 现盘唯一主题消费点 `thincoder-desktop/renderer/theme.css:48`（`@media` 双块）∥ 切换面零存在 ∥ 主进程持系统事实（`window.mjs` `resolveTheme()`——画布色）+ 唯菜单勾选态显示缓存一枚（**KD-65** ②）；宿主实读 = Electron 44.4.5 ∕ Chromium 152.0.7977.130（`light-dark()` 支持面 = Chromium 123+——`releases.electronjs.org` 2026-09-30） | **`nativeTheme.themeSource` 径**（① 跨进程载波：渲染面存储值 ⇒ 主进程 ⇒ 媒体回灌——新通道 ∥ preload ∥ 主进程状态面；② 首帧窗结构性劣化：值到达必在渲染面 boot 之后 ⇒ 首绘以系统态完成 + 置位后二次重绘；③ 媒体回灌 = 隐式耦合——CSS 消费面不可读用户值）· **共享 config 新字段**（跨端共享面——KD-9 被否候选）· **新落盘档**（第二份存储——KD-9 ∕ KD-56 被否候选）· **纯 JS 媒体监听**（system 态交 JS——冷启首绘窗 ∥ 声明式缺省退场）· **菜单项切换面**（主进程面 + 跨进程状态同步——同前两劣） |
| KD-62 | → `docs/desktop/design/ACTIVITY.md` §1（as-of 2026-10-02） | — | — |
| KD-63 | → `docs/desktop/design/RENDERER.md` §1.6（关键决策 · 渲染核 · as-of 2026-10-02） | — | — |
| KD-64 | → `docs/desktop/design/PACKAGING.md` §1（as-of 2026-10-02） | — | — |
| KD-65 | → `docs/desktop/design/MENU.md` §1（as-of 2026-10-02） | — | — |
| KD-66 | → `docs/desktop/design/SETTINGS.md` §1（关键决策 · 设置域 · as-of 2026-10-02） | — | — |
| KD-67 | → `docs/desktop/design/MENU.md` §1（as-of 2026-10-02） | — | — |
| KD-68 | → `docs/desktop/design/SETTINGS.md` §1（关键决策 · 设置域 · as-of 2026-10-02） | — | — |

| KD-69 | **P1 读数端面消费 = `dbBytes` + 逐 origin 行数上屏（桌面索引段 ∥ VSC 设置面）**（桌面 UX 收尾批 · 2026-10-02 · 台账 #697）：① **数据面已就绪**——核只读出口 `memoryStatus()` 回执携 `dbBytes`（库文件 `statSync`）∥ `origins`（逐 origin code ∥ doc 行数、按名排序；`thincoder-core/memory-status.mjs:48-49`）；② **桌面** = `readIndexCounts` 回执扩两键（`dbBytes` ∥ `origins` 透传——端侧零 SQL 纪律保持；`thincoder-desktop/src/main/index-status.mjs:31-44`）+ 设置面「工具与服务」段增两读（库大小行 + 逐 origin 行数行；词键 ∥ 形 = 实施轮定）；③ **VSC** = `pushIndexStatus` 载荷扩两键（`thincoder-vscode/src/extension/panel-index.mjs:43-56`——取值 = 核出口透传，不另造 SQL）+ `#index-status` 区增两读（`thincoder-vscode/webview/settings-tools.js` `renderIndexStatus` 族）；④ **刷新拍** = 与既有索引读数同拍（设置面加载 ∥ 构建后推送——零新通道、零新计时器）；⑤ **呈现位边界** = 不做常驻状态栏段（状态行 = CLI 对齐段集闭集——零增）；**入档 = 桌面侧详文已回填 `docs/desktop/design/SETTINGS.md` §2.13（2026-10-02 · 台账 #697）；VSC 侧已落 `docs/vsc/design/SETTINGS.md` §2.5**；设计全文 = 批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2.4 | 台账 #697（memory-db 家族批上抛①——父裁：端面消费须 UX 面设计）；核出口回执档头实读（`memory-status.mjs:11-20`）；端侧零 SQL 纪律（本档 §10 N 行） | 【被否】端侧直读核内表（不授权——既有裁定）；新通道 ∥ 新计时器（零需求）；状态栏常驻段（段集闭集） |

| KD-70 | **桌面 MCP 警告消费 = 装配后入 `_pendingReminders`（会话内提醒 · CLI 同形）**（桌面 UX 收尾批 · 2026-10-02 · 台账 #702 · 三径裁定）：① **裁定 = 补消费**（备选②收窄句 ∥ ③认账不排期 = 否，见被否列）；② **落点** = 桌面装配尾（`thincoder-desktop/src/main/agent-host.mjs` `assembleAndLoad`；**写点 = `agent-assemble.mjs:121`——定义档 ∥ 转口档（同名 re-export）关系沿本档 §4 装配面行；实施轮首步现读钉定**）——`agent._mcpWarnings` 非空 ⇒ 构造提醒入 `agent._pendingReminders`（核消费点 = 下一条 user 消息注入——`thincoder-core/agent/setup.mjs:170-174`；装配一次推送一次，同 key 复用不重推——CLI 同形）；③ **词面** = 首两段逐字同 CLI（计数 + 逐条；单源 = `thincoder-cli/src/command-interactive.mjs:151-155`），末行指路 = **桌面可达出口**（设置面 MCP 段重连——CLI 的 `/mcp connect` 桌面不存在，逐字照搬即误导；语义 = 指路可达出口；词面 ∥ 载体（既有键拼装 ∥ 字面串 ∥ 新键）∥ 语言口径 = 实施轮落词前现读钉定——若需新键 ⇒ ④ 随正）；④ **可见面** = 会话内系统提醒（与 CLI 同面——零新 UI ∥ 零新词键）；⑤ **边界** = VSC 第三面未并（端差在册——列报）；`.mcp.json` ∥ 连接 ∥ 管理面语义零触；核档 `docs/core/design/MCP.md` §6.4 消费面句同拍（已落）；设计全文 = 批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2.3 | 台账 #702（`mcp-json-source` 批上抛 U2——父裁三径归批）；实读：写点 `thincoder-desktop/src/main/agent-assemble.mjs:121`、全仓消费点仅 CLI；核档 `docs/core/design/MCP.md` §6.4 句对桌面原不成立（#673 面既有缺口） | 【被否】② 收窄 `MCP.md` 句（把桌面用户不可见固化为条文——用户可见端差 = 缺陷（F7-3 收窄律），无宿主能力例外实证）；③ 认账不排期（同上——静默失败面不认账；无豁免依据） |

| KD-71 | → `docs/desktop/design/PACKAGING.md` §1（as-of 2026-10-02） | — | — |
| KD-72 | → `docs/desktop/design/PACKAGING.md` §1（as-of 2026-10-02） | — | — |
| KD-73 | → `docs/desktop/design/PACKAGING.md` §1（as-of 2026-10-03） | — | — |
| KD-74 | → `docs/desktop/design/RENDERER.md` §1.6（行痕族清点两门 · as-of 2026-10-04） | — | — |

### 2.1 实测读数（实施批回填）

- 宿主下限的**具体版本号**——**已实测**：Electron 内置 Node = `"24.21.0"`（Electron 44.4.5 面 · 父侧实测；读数落于本批档 §5）；阈值面 = `thincoder-desktop/src/main/host-floor.mjs:9`（`MIN_NODE = "24.0.0"`）⇒ KD-7 下限（Electron ≥ 44.x）成立。

### 2.2 挂起窗键面路由注（迁出）

→ 见 `docs/desktop/design/ACTIVITY.md` §3（挂起窗键面路由——本域单源：dispose 触发面对照表 ∥ 非同键 ∥ 会话钉定 ∥ 跨键互斥 ∥ 忙态排队 ∥ 中止墓碑；as-of 2026-10-02）。

## 3. 架构与接口契约（分档导航）

各面按板块分档落定（单一权威源——本节每面只留一行指针，不留正文副本）：

### 3.1 进程与目录形态

→ 见 `docs/desktop/design/SHELL.md` §1（三层进程 · 目录树 · 分层铁律）。

### 3.2 主 ↔ 渲染 IPC 契约（窄面）

→ 见 `docs/desktop/design/IPC.md` §1（主 → 渲染事件表）· §2（渲染 → 主请求表）。

### 3.3 与核的接口面逐项点名（七面）

→ 见 `docs/desktop/design/SHELL.md` §3（七面表 + 「不改核」行）。

### 3.4 壳装配第三份

→ 见 `docs/desktop/design/SHELL.md` §4（`agent-host.mjs` 五项职责 + 装配序上提核件与余端差行）。

### 3.5 活动池与状态位（需求档 §3.5 三项落定）

→ 见 `docs/desktop/design/UI.md` §2（三项处置表 + 旁证行）。

## 5. 打包链与发行面（需求卷 D12 ∕ D32）

→ 见 `docs/desktop/design/PACKAGING.md` §2（打包链与发行面——配置契约 ∥ 构建序列 ∥ 签名就绪 ∥ 图标资产 ∥ 产物校验 ∥ 失败面 ∥ 其余面 ∥ **自动更新（§2.8）** ∥ **官网桌面面（§2.9）** ∥ 发布窗承接（§2.10）；as-of 2026-10-02）。

## 8. 边界（不做）

- **本批（设置面样式收正 · D37 · 2026-10-02）不做**：交互语义 ∥ 功能增删（渠道四动作 ∥ masked 钥 ∥ 当前标全保留——无新增动作）· 七段信息架构（段集 ∥ 段序）· 布局面（48rem 居中列——2026-10-02 实证正确）· 圆角（非卡余域）∥ 600 字重 ∥ 标上行表单（端差登记——沿 D24 ∥ D29 ∥ 扁平化基线）· 主题变量表 ∥ 断点（零新变量 ∥ 零新断点）· 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触。

- **不做**需求档 §5 所列：文件视图 / 编辑器本体 / 内置 diff（暂缓三件——「打开」已由 D19 ∕ KD-39 解） · 常驻多项目面板 / 项目切换器 · 云服务 / 工作流引擎 · 复制核机制 · 另立存储格式 · ACP 面之外的新协议面 · 通用编辑器 / IDE。
- **贯穿不做**：改核**机制语义**（批 B 纯加法三处，授权在案——批次档 §1.2 A；**留档批例外（在案）**：`thincoder-core/history-window.mjs` 记录直通 opt-in 一条——纯加法 ∥ 默认径逐字等价）· 需求档与提示词面。
- **本轮不做**（设计面明确排除）：更新通道扩展（beta/alpha ∥ 回滚 ∥ 降级安装——自动更新 = **桌面发布·阶段二批落**（`docs/desktop/design/PACKAGING.md` §2.8））· **公证执行**（mac 面——阶段二；**代码签名 = 就绪形已落**——证书在位即实签、未签版 = 明示测试形——单源 = `docs/desktop/design/PACKAGING.md` §2.3）· 多窗口 · 全局快捷键。
- **本批（装配桥批）不做**：`msg:*` 的 UI 输入区与中断键（视图批）· MCP 连接（设置批）· 工程模式 manifest 附着（`docs/desktop/design/SHELL.md` §4 端差注）· 审批卡 `changes` 摘要供给（核侧缺该键 ⇒ 卡面无摘要行——`docs/desktop/design/IPC.md` §1）· 多实例协作面。
- **本批（设置面批）不做**：`memory:status` 通道与索引状态面板（**已落——R2**：`index:build` ∕ `index:status`）· 端侧直读核内表（不授权）· 打包与发行（批 10）· 主题切换面（**已落——D33**）。
- **本批（批 B · 会话级偏好 / 档位枚举化 / 占用读数 / 附件与复制）不做**：斜杠命令（需求档 §3.5 边界裁定——**已转正落批**：2026-10-01 §3.5 转正 + 需求卷 **D34**；批 `docs/batches/2026-10-01-desktop-slash-commands.md`）·
  真代码块面（围栏切分 / 语言高亮 / 代码块级出口——**另裁已落**：`docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 11）· 端侧自建落盘与图片指针格式（落盘径 = 核）· 主题 / 通知面 · 用量面板（状态栏读数以外）· CI 接线（随三平台 CI 批）。
- **本批（批 B · 追加轮）不做**：真实模型回路下的发送成功面（空 fixture 家 ⇒ 无凭据 ⇒ 断言只覆盖失败可见面：文本保留 + `console.error`）· 引导面另立样式档（沿现盘 `.chat-empty`）· 需求档补条目 ⇒ **已落**（需求档 **D16** = 首启空态引导；本档 §6.1 D16 行 / §10 Z 行同源）。
- **本批（批 A · 对话面板）不做**：斜杠命令 · 模型 / provider 切换 · 推理档位 · 上下文占用读数 · 附件与导出 · 文件树 / diff / 终端（需求档 §5）——后四项中前四者 = 批 B 面，附件 / 导出同归批 B。
- **本批（桌面端 E2E 基建批）不做**：web 快筛与 Electron 一致性核（判据④——Electron = 唯一权威面）（**状态注（web 快筛批 · 2026-10-01）**：web 快筛工具已落形——`docs/desktop/design/WEB-QUICKCHECK.md`（开发期回路 ∥ 不作验收判据）；一致性核维持不做）· CI 接线（随三平台 CI 批）· 第二 runner / 测试框架（`@playwright/test` 等——`node --test` 单入口不变）· 视觉 / 像素回归（只断言 PNG 存在 + magic）
  · 错误 / 边界用例三条（`T-DSK27b` / `T-DSK27c` / `T-DSK27d`）· 产品码改动（`thincoder-desktop/src/**` / `thincoder-desktop/renderer/**` 零改）——单源 = `docs/desktop/design/E2E-TESTING.md` §6 / §7 / §8。
- **本批（可见面修复批）不做**：#426 窄窗左列折叠**交互**（**R13 后无对象**——左列裁撤退场；窄窗残留 = 池面窄窗态（本档 §1「open」行））· #440 真代码块面（围栏切分 / 语言高亮——**另裁已落**：`docs/render-core/design/RENDER-CORE.md` §4 行 11）· 核（`thincoder-core/**`）零触碰。
- **本批（对齐重定位批）不做**：CLI 代码面（D17 = 语义对位——零触碰）· 核化滚动 / 回填 / 窗口裁剪（各端在册机制不动——核档 §4 行 13–15）· 提示词面与需求档（笔权在父侧）。
- **本批（残余批 · D17 / D19）不做**：状态行段集 / 段判据（R3a 在册）· 视觉面（#477 批在途）· VSC 侧零改 · 核机制语义（除 §6.24 只读出口一处）——`tokens` / `timers` 等 11 段不属播种面（单源 = `docs/desktop/design/UI.md` §1「本批注（D17 / D19 · 残余补齐）」项 1）。
- **本批（重启自动重开 · #734）不做**：会话恢复逻辑改动（核 ∥ 渲染面零改——渲染面 boot 接续门既有）· 最近目录列表 UI（R13 已退场）· 「打开成功但接续未达」窄窗的显式写点（须新存储面——KD-56 被否列；窄窗 fail-soft 自愈）· 多项目并行面（需求 §5.1——另议）· 另两端记录（`.cli` ∕ `.vscode`）零读写 · 多实例协作机制本体（单实例锁既有——§10 **CU** 登记）。
- **本批（右栏宽度拖动 · D30）不做**：键盘调整 ∥ 双击复位（均未入需求）· 空池 ∕ 有池自动宽度（#115 已作废——不重建 ∥ 不复活；单一权威 = 用户值）· 未拖过态窄窗挤压（默认 36rem 零变——UI「open」行残留项保持）· 核 ∥ `thincoder-render-core` ∥ 主进程 ∥ 通道面 ∥ preload 零触（纯渲染面面内设施）· 左列 ∥ 中列 ∥ 池内容行为零改。
- **本批（窗口重启最大化 · D31）不做**：窗口态记忆（位置 ∥ 尺寸 ∥ 最大化态——「永远」语义已裁：每次启动恒最大化 ∥ 零读写）· 运行期窗口干预（用户手动缩放不回夺——射程 = 重启 ⇒ 打开即最大化）· 最小化 ∥ 全屏 ∥ 置顶 · 核 ∥ `thincoder-render-core` ∥ 渲染面 ∥ 通道 ∥ preload ∥ `thincoder-desktop/src/main/main.mjs` 零触。
- **本批（主题切换 · D33）不做**：窗口画布色 ∥ 原生面（菜单 ∥ 对话框 ∥ 标题栏）随系统（主进程不以用户值驱动原生面——需跨进程载波；`nativeTheme.themeSource` 径被否，见 §2 **KD-61**；唯菜单勾选态显示缓存一枚——**KD-65** ②）· 主题换肤（色板 ∥ 自定义主题 ∥ 导入导出）·
  跟随系统的 OS 级联动面（`themeSource`）· markdown 排版基线（D29——零动）·
  CLI ∥ VSC 两端零触 · 核 ∥ `thincoder-render-core` ∥ 通道表 ∥ preload 零改（`thincoder-desktop/src/main/window.mjs` 注释两处随正——零行为改）。
- **本批（斜径命令面 · D34 · 台账 #761）不做**：补全（Tab——Web 焦点键）· 携参直切（`slash.args` 拒）· CLI 27 条中未落者（另批 13 ∥ 不做 9——逐条处置 = 批档 `docs/batches/2026-10-01-desktop-slash-commands.md` §2.4）· VSC 命令面（零接缝——如需另批）；**命令表归端** ∥ 核共享层缝 = **纯加法可选**（不传 `deps.slash` ⇒ 现行为零变——VSC 零接缝）∥ CLI ∥ VSC ∥ `thincoder-core` 零触。
- **本批（桌面打包发布 · 阶段一）不做**：自动更新（升级 = 手动下载覆盖——**桌面发布·阶段二批落** · `docs/desktop/design/PACKAGING.md` §2.8）· 免安装包 ∥ macOS ∥ Linux 产物 ∥ 应用商店（Windows 商店 ∥ Snap）∥ 公证 = 阶段二 · `src/**` ∥ `renderer/**` 产品码零改（打包链 = 构建期面）· 站点仓零写（规格在批档——执行 = 主 agent 轮）· 未签版不阻断测试形（签名跳过 = 明示非失败——发布版须已签）。
- **本批（菜单体系 · D36 · 2026-10-02）不做**：托盘区 ∥ 自绘菜单 ∥ 全量快捷键体系 ∥ 检查更新（归 #810——**桌面发布·阶段二批落** · `docs/desktop/design/PACKAGING.md` §2.8）∥ 语言切换进菜单（设置面单源）∥ **菜单项选中态 = 唯主题▸带勾**（命令下行 + 状态回读 `theme:state`——限度 = 报告缓存（零直读）；其余条目零选中态）
  ∥ 窗口组回复（minimize/zoom——按五组枚举退场；如需保留 = 加一组即可）· `context-menu.mjs`（D27）∥ `projects.mjs` ∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触。
- **本批（设置菜单升级 · D38 ∥ D39 · 2026-10-02）不做**：独立设置窗口（B 案——用户明令）∥ 帮助组改动（零动——「关于与快捷键」= 第二入口）∥ 设置页撤除（**保留并存**——验收 OK 后再议撤）∥ 七段值面语义（读写 ∥ 确认 ∥ 失败链全复用）∥ 全量快捷键 ∥ 托盘 ∥ 自绘菜单 · 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触。

- **本批（桌面发布 · 阶段二 · 自动更新 ∥ 官网桌面面 · 2026-10-02）不做**：beta/alpha 通道 ∥ 回滚 ∥ 降级安装 ∥ 周期拍 ∥ 应用内更新进度 UI ∥ 渲染面更新面（须新 IPC 通道）· macOS ∥ Linux ∥ 应用商店 ∥ 免安装包 = 阶段二余片 · 站点仓零写（规格 = `docs/desktop/design/PACKAGING.md` §2.9——实现 = 父侧轮）· 核 ∥ CLI ∥ VSC ∥ `thincoder-render-core` 零触（更新面全主进程）。

## 9. 界面形态落定（UI / 交互决策）

→ 见 `docs/desktop/design/UI.md` §1（形态与交互面 **21 行**——实点 2026-09-29；计法 = §1 表行条目数）· `docs/desktop/design/RENDERER.md` §2 / §3（工艺面 2 行：有界渲染窗口 / 回填与跟滚）——合计 **23 行**。本句 = 现值句（实点为准）；以下各批落形句 = 各自时点读数（历史面，不追改）。
批 B 四件（会话头三值就地可改 · 附件条 · 状态栏读数 · 复制面）落形 = `docs/desktop/design/UI.md` §1 存量行内「（批 B 落）」标注 + §1 批 B 注——**形态行 / 工艺行数不变**（合计 **25 行**）；批 B 追加轮（首启引导面）落形同径（§1 **批 B 追加注**）——**行数不变**（合计 **25 行**）。
对齐重定位批落形同径（`docs/desktop/design/UI.md` §1「本批注（对齐重定位）」四项）——**行数不变**（合计 **25 行**）。
D21 视觉对齐批落形同径（`docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」两项：内容面值表指针 + 会话面板映射表）——**行数不变**（合计 **25 行**）。
残余批（D17 / D19）落形同径（`docs/desktop/design/UI.md` §1「本批注（D17 / D19 · 残余补齐）」两项）——**行数不变**（合计 **25 行**）。
复制面对齐 VSC 批落形同径（`docs/desktop/design/UI.md` §1「本批注（复制面对齐 VSC · 2026-09-29）」四项：右键编辑菜单（宿主面）+ 复制面两控件摘除 + 判据 + 计数）——**行数不变**（合计 **25 行**）。

## 11. 范本借用清单（UI 范式勘察落档）

→ 见 `docs/desktop/design/UI.md` §3（形态面 5 行 · 第 7–11 项 · 清单前言单源）· `docs/desktop/design/RENDERER.md` §4（实现工艺面 6 行 · 第 1–6 项）。

## 二、跨域段

> 本节区 = 各域迁出后的跨域 ∥ 总表面——§4 受影响文件清单（域档分持后的残面：指针表 ∥ 越层段 ∥ 测试面三分 ∥ 判不决块留原址）· §6 验收总表 · §7 用例总表 · §10 上抛总表；判不决块 ∥ 越层段 ∥ 测试面三分 ∥ 留驻行 = 跨域内容（原址保留——域内容已迁者 = 一行指针）。

## 4. 受影响文件清单

### 4.1 本端文件清单与行数预算

本表 = 逐文件行数预算**单源**（`docs/desktop/design/SHELL.md` §1 树不复制预算列）；**新档落盘随批登记**（此后新档由落盘批在本表补行）——行数口径 = 内容行数（文末换行不计）；**行数面机检 = `checkConfig.lineCounts` 声明（`PROJECT-MANIFEST.json`）——doc-check 行数族**。

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/package.json` | → `docs/desktop/design/PACKAGING.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/electron-builder.yml`（本批落） | → `docs/desktop/design/PACKAGING.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/.gitignore` | → `docs/desktop/design/E2E-TESTING.md` §9.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/main.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/host-floor.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/window.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/context-menu.mjs`（复制面对齐批 · 已落） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/menu-words.mjs`（残余族清账批 · 新档；菜单体系批扩键） | → `docs/desktop/design/MENU.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/app-menu.mjs`（菜单体系批 · 已落） | → `docs/desktop/design/MENU.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/menu-actions.mjs`（菜单体系批 · 已落） | → `docs/desktop/design/MENU.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/protocol.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/ipc.mjs` | → `docs/desktop/design/IPC.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/ipc-relays.mjs`（桌面残债批 #685 拆档产出） | → `docs/desktop/design/IPC.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/agent-host.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/turn-driver.mjs`（R3 拆点落形 · 新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/suspension-drive.mjs` | → `docs/desktop/design/ACTIVITY.md` §4（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/suspension-guard.mjs`（队列取项边缘收正批新档） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/suspension-timers.mjs`（消化面留档批拆分产 · 新档） | → `docs/desktop/design/ACTIVITY.md` §4（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/timer-watch.mjs`（timer-wake 阶段 2 新档） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/notify.mjs`（本批新档） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/turn-face.mjs`（在册预案落形档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/turn-chain.mjs`（在册预案落形） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/queued-input.mjs`（「回合中插入」批新档） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/window-queue.mjs`（在册预案落形 · 合并实施轮新档） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/agent-assemble.mjs`（状态栏对齐批新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/agent-bridge.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/suspensions.mjs` | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| 会话族六行（`session-io.mjs` ∥ `session-slots.mjs` ∥ `session-maintenance.mjs` ∥ `session-actions.mjs` ∥ `sessions.mjs` ∥ `projects.mjs`） | → `docs/desktop/design/SESSIONS.md` §3（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/settings.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/providers.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/mcp-servers.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/project-info.mjs` | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/attachments.mjs`（批 B） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/file-links.mjs`（对齐第三批新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/file-refs.mjs`（@ 文件引用对齐批新档） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/at-complete.mjs`（R1 输入面板移植新档） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/exec-run.mjs`（R3 新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/prompt-injections.mjs`（R4 新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/loop-sampler.mjs`（口子清零二轮新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/heap-watch.mjs`（桌面堆取证修复批 · 新档） | → `docs/desktop/design/SHELL.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/settings-values.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/config-watch.mjs`（R8 落子壳） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/index-status.mjs`（R2 新档） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/session-flags.mjs`（R1 输入面板移植新档） | → `docs/desktop/design/SESSIONS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/settings-env.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/settings-tools.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/preload/preload.cjs` | → `docs/desktop/design/IPC.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/index.html` | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/theme.css`（R13 四拆分产） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/chrome.css`（R13 四拆分产） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/session-list.css` | → `docs/desktop/design/SESSIONS.md` §3（as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/skin.css`（R13 四拆分产） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/chat.css` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/pool.css` | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/app.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-blocks.mjs`（#510 拆档产出） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-slices.mjs`（#510 拆档产出） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-status.mjs`（R4 拆档产出） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-wake.mjs`（R5 拆档产出） | → `docs/desktop/design/ACTIVITY.md` §4（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-flags.mjs`（输入面板移植拆档产出） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/questions.mjs`（残余批拆档产出） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/events-subscribe.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/page-read.mjs`（对齐第二批拆分产出） | → `docs/desktop/design/CHAT.md` §3（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/subagent-reduce.mjs`（对齐第二批拆分产出） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/queue.mjs`（对齐第二批拆分产出） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/badges.mjs`（残余批拆分产出） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-pool.mjs` | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/pool-width.mjs`（右栏宽度拖动批 · 已落） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/theme.mjs`（主题切换批 · 已落） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/search.mjs`（R6 落） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/heartbeat.mjs`（R10 落） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| 会话族三行（`mount-sessions.mjs` ∥ `session-wire.mjs` ∥ `views/session-control.mjs`） | → `docs/desktop/design/SESSIONS.md` §3（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/dom.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/view-state.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/i18n.mjs` | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/i18n-views.mjs`（对齐第三批拆分产出） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/i18n-composer.mjs`（输入面板上提批拆档产出） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/i18n-settings.mjs`（i18n 拆分批产出） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/store.mjs` | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-tree.mjs`（消化面留档批拆分产 · 新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-model.mjs`（更新纪律收核批 · 拆分产出） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/frame-dispatch.mjs`（更新纪律收核批） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-chrome.mjs`（对齐第三批拆分产出） | → `docs/desktop/design/CHAT.md` §3（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-digest-rows.mjs`（#738 拆分产 · **#765 落盘改名兑现**） | → `docs/desktop/design/ACTIVITY.md` §4（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-pending.mjs`（对齐第二批新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-subagent.mjs`（对齐第二批新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/approval.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chrome.mjs` | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/activity.mjs` | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/pool-subagents.mjs`（R5 拆档产出） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/activity-new.mjs`（R10 新档） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/pool-tree.mjs`（让位修复批拆档产出） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/settings-modal.mjs`（设置体系升级批（#817）新档 · 已落） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/settings-modal.css`（设置体系升级批（#817）新档 · 已落） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-agent.mjs`（R8 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-controls.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections-env.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections-mcp.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections-models.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections-providers.mjs`（D37 拆档产出 · 已落） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs`（R2 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/onboarding.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/question.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/plan.mjs` | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/goal.mjs`（R5 新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings.mjs` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-reads.mjs`（R8 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-exits.mjs`（R8 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-segments.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-segments-models.mjs`（R7 拆档产出） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs`（parity-b10 W2 拆出档） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-settings-segments-agent.mjs`（parity-b10 W3 拆出档） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/settings-confirm.mjs`（parity-b10 W2 新档 · S6） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-onboarding.mjs`（批 B · ⑥ 拆档） | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-composer.mjs` | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/composer-wire.mjs`（输入逻辑收正轮拆分产出） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/composer-sync.mjs`（#510 留守拆档产出） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/attach.mjs`（批 B） | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/statusline.mjs`（R3a · 批档见 `docs/desktop/design/ACTIVITY.md` §4.2） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/statusline-segments.mjs`（R4 拆档产出） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/statusline-banner.mjs`（状态栏对齐批新档） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/mount-status.mjs`（R3a） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/src/main/subagent-face.mjs`（R3b） | → `docs/desktop/design/ACTIVITY.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-text.mjs`（R3c） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-text-segments.mjs`（E4-JS 支） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/chat-cards.mjs`（R3c） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/views/compress-status.mjs`（R4 新档） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/core.css`（R3c） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/chat-cards.css`（「桌面处理流 · VSC 对齐」批拆档产出） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/chat-fixes.css`（同批拆档产出） | → `docs/desktop/design/CHAT.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/core-markdown.css`（#510 拆档产出） | → `docs/desktop/design/UI.md` §4.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/settings.css` | → `docs/desktop/design/SETTINGS.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/renderer/chat-composer.css` | → `docs/desktop/design/COMPOSER.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-render-core/flow/block.mjs`（核共享面 · E2 实测命中档） | → `docs/desktop/design/RENDERER.md` §5.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/scripts/check-dist.mjs` | → `docs/desktop/design/PACKAGING.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/scripts/materialize-deps.mjs`（本批新档） | → `docs/desktop/design/PACKAGING.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/scripts/win-sign.mjs`（本批新档） | → `docs/desktop/design/PACKAGING.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/scripts/make-icon.mjs`（本批新档） | → `docs/desktop/design/PACKAGING.md` §3.1（as-of 2026-10-02） | — |
| `thincoder-desktop/build/icon.ico`（本批新档 · 二进制） | → `docs/desktop/design/PACKAGING.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/CHANGELOG.md`（发布窗首建 · 已落） | → `docs/desktop/design/PACKAGING.md` §3.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/tools/web-quickcheck/serve.mjs`（已落 · web 快筛批） | → `docs/desktop/design/WEB-QUICKCHECK.md` §9.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/tools/web-quickcheck/host-shim.mjs`（已落 · web 快筛批） | → `docs/desktop/design/WEB-QUICKCHECK.md` §9.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/tools/web-quickcheck/run.mjs`（已落 · web 快筛批） | → `docs/desktop/design/WEB-QUICKCHECK.md` §9.1（文件账 · as-of 2026-10-02） | — |
| `thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs` | → `docs/desktop/design/E2E-TESTING.md` §9.1（文件账 · as-of 2026-10-02） | — |
| 用例模块（原 48 档） | → `docs/desktop/design/E2E-TESTING.md` §9.1（文件账 · as-of 2026-10-02） | — |

**批 3 收口 · 行数回填**（内容行数口径——文末换行不计）：`thincoder-desktop/renderer/i18n.mjs` **93** · `styles.css` **180** · 两档超批 3 实施前预估界（89 / 162）但 ≪ 500 硬限 ⇒ **无拆分案**（上界系预估、以实读为准；明细 = `docs/batches/2026-09-25-desktop-impl-3.md` §5 D1）。

行宽上限 = 500 行（仓级硬限）；**在册例外：无**（`thincoder-desktop/renderer/i18n.mjs` **500 ⇒ 393**——i18n 拆分批落地，2026-09-29 届盘实读）——**距硬限最近 = `thincoder-desktop/renderer/views/chat-text-segments.mjs` **497**（余 **3** 行——见下行越层段）**；
  次大两档 = `thincoder-desktop/renderer/views/settings.mjs` **364** ∕ `thincoder-desktop/renderer/mount-settings-segments.mjs` **364**（实读 2026-10-01）；
**越 300 层在册（十四档——实读 2026-10-04（渠道档位退役批（#902）回线除名一档：`thincoder-desktop/src/main/settings.mjs` 331 ⇒ 300——十五 ⇒ 十四）；前读 十五档（实读 2026-10-04（泛化编辑器退役批（#903）回线除名一档：`settings.css` 304 ⇒ 296——十六 ⇒ 十五））；更前 十六档（实读 2026-10-03（首跑渠道提示修复批（#840）新入册一档＋四档读数随正；轻通道轮八三档读数随正））；再前 十五档（实读 2026-10-01）；
  `subagent-reduce.mjs` = #765 回线除名（301 ⇒ 258 · 十四 ⇒ 十三）——实读兑现； · 越线档结构轮逐档复读 + 逐个裁定〔批档 `docs/batches/2026-09-29-structure-split-round.md` §2〕；`thincoder-desktop/renderer/i18n.mjs` = i18n 拆分批落地入册；`renderer/store.mjs` = desktop-residuals-round3 波 A–C 后新入册；
  `views/chat-chrome.mjs` ∥ `src/main/turn-driver.mjs` 两档 = structure-split-2 拆分兑现（2026-09-29）⇒ 除名；
  `src/main/ipc.mjs` = 桌面残债批（#685 · 2026-09-30）拆档兑现（265 ≤300）⇒ 除名；
  `thincoder-desktop/src/main/suspension-drive.mjs` ∥ `renderer/views/chat.mjs` 两档 = 消化面留档批（#719 · 2026-09-30）拆档兑现（**285** ∥ **234** ≤300）⇒ 除名；
  `renderer/composer-sync.mjs` ∥ `renderer/core.css` ∥ `src/main/providers.mjs` 三档 = 口子清零二轮（#673 · 2026-09-29）后新入册；
  `views/chat.mjs` ∥ `views/chat-text-segments.mjs` 两档 = E4-JS 波（2026-09-30）后新入册；`subagent-reduce.mjs` = 三端消化面统一批（#747）后新入册（座次入模）；
  各带拆分预案 + 消解窗口 = 各自下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））**：
  `thincoder-desktop/src/main/suspension-drive.mjs` **305**（**再入册**——consult 同族收齐批（#748）落盘后（300 ⇒ 305——`reemitDone` consult 支展开）；拆分候选 = 残输入续发族（拟 `suspension-resume.mjs`）；窗口 = 触发式）·
  `thincoder-desktop/renderer/i18n.mjs` **415**（实读 2026-10-03——轻通道轮八（412 ⇒ 415——键数链注续链（`VIEWS_DICT` 138 ⇒ 139 ∥ `HOST_DICT` 313 ⇒ 314）；非结构性触碰 ⇒ **续期**）；
  前读 **412**（续期——由 = i18n 拆分批落地（500 ⇒ 393）后仍越 300；实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（408 ⇒ 412——键数链注续链（`VIEWS_DICT` 137 ⇒ 138 ∥ `HOST_DICT` 312 ⇒ 313）；非结构性触碰 ⇒ **续期**）；前读 **408**（实读 2026-10-02——**桌面 UX 收尾批（#697）实施落盘**（404 ⇒ 408——键数链注续链（`HOST_DICT` 308 ⇒ 312）））；
  前读 **404**（实读 2026-10-01——#761 落盘后（394 ⇒ 404——`/help` 键 + 链回填））；预案 = 余族按消费族续拆；**第五档备案 = `thincoder-desktop/renderer/i18n-status.mjs`（拟新增——`status.*` 16 键 + `susp.*` 3 键 · 消费面 = `views/statusline*.mjs`）· 启动条件 = 本档加键致 >450**）·
  `thincoder-desktop/renderer/mount-settings-segments.mjs` **364**（续期——由 = 设置面族在飞两批避让〔`docs/batches/2026-09-29-desktop-rebuild-fidelity.md` ∕ `docs/batches/2026-09-29-desktop-residuals-round3.md`〕；桌面残债批（#679）后（实读 2026-09-30）；预案 = MCP 族再出一档）·
  `thincoder-desktop/renderer/views/settings.mjs` **398**（实读 2026-10-02——设置体系升级批（#817）实施落盘（364 ⇒ 398：+`settingsModalTree` 单组树——**触属性复核 = 非结构性维持**（组合既有私有面、零既有结构变更 ⇒ 拆档评估不触发）；前读 **364**（实读 2026-10-01）；预案 = 段体续拆；**渠道档位退役批（#902）后 398（实读 2026-10-04——399 ⇒ 398）**）·
  `thincoder-desktop/renderer/i18n-views.mjs` **386**（实读 2026-10-03——轻通道轮八（380 ⇒ 386——`composer.send.noDefaultModelFallback` 两语键值 + 两语类注（4 行）；非结构性触碰 ⇒ **续期**）；前读 **380**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（374 ⇒ 380——`composer.send.noDefaultModel` 两语键值 + 两语类注；非结构性触碰 ⇒ **续期**）；续期——由 = 口子清零二轮随动后；
  前读 **374**（实读 2026-10-02——**桌面 UX 收尾批（#697）实施落盘**（362 ⇒ 374——P1 两键（`settings.indexDbSizeLabel` ∥ `settings.indexOriginCounts`）两语键值 + 组注 ∕ 键面注））；前读 **362**（#761 落盘实读（2026-10-01）——336 ⇒ 348 ⇒ 362——+9 键 × 2 语）；预案 = 词族按视图面续拆）·
  `thincoder-desktop/src/main/settings.mjs` **331 ⇒ 300（渠道档位退役批（#902）实施落盘——回线 ⇒ 除名兑现，2026-10-04；十五 ⇒ 十四）**（原入册——由 = 无效渠道态逻辑归一批（#841）实施落盘（325 ⇒ 331——`settings:agent` 两写径成功回执携 `providerState`（第三刷新点主侧半）；非结构性触碰 ⇒ **续期**）；
  前读 **325**（实读 2026-10-02——**桌面 UX 收尾批（#697）实施落盘**（320 ⇒ 325——`indexStatus()` 回执 +2 键透传（`dbBytes` ∥ `origins`）；非结构性触碰 ⇒ **续期**）；前读 **320**（续期——由 = desktop-residuals-round3 波 C（S14a 随迁）后）；预案 = 按族续拆评估——**退役批落盘 300（实读兑现）**——预案注销））·
  `thincoder-desktop/src/main/agent-bridge.mjs` **325**（续期——由 = desktop-residuals-round3 波 B（#599）后；预案 = 协议行解析 ∕ 事件映射族出档（新档名实施批定））·
  `thincoder-desktop/renderer/chat.css` **366**（续期——由 = desktop-residuals-round3 波 B 后；轻通道轮四后（354 ⇒ 361）⇒ 消化行自然形收正批（#768）后（361 ⇒ 366）——实读 2026-10-01；#761 ∕ #765 ∥ #764 三批零触）；预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 未落 · 排末））·
  `thincoder-desktop/renderer/store.mjs` **341**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（331 ⇒ 341——`providerState` 切片 + `setProviderState` 纯动作；非结构性触碰 ⇒ **续期**）；
  前读 **331**（实读 2026-10-02——设置体系升级批（#817）实施落盘（330 ⇒ 331：`settings.modal` +1 键——**非结构性**（无新切片）⇒ 消解窗口顺延）；预案 = 续拆评估（切片族）· 消解窗口 = 该档下次**结构性**触碰的批；前史：**#761 ∥ #764 落盘 = 两度结构性触碰**（`helpLines` 切片 ∥ `flowOps` 切片——有新增面）**⇒ 拆档评估窗口触发；父侧裁 = 续期**（实读 330））·
  （`store.mjs` 拆点 = 初始字面段出档 `thincoder-desktop/renderer/store-initial.mjs`（拟新增）· 触发 = 届盘实读 > 500）·
  `thincoder-desktop/renderer/views/settings-sections.mjs` **309 ⇒ 164（D37 拆档兑现（渠道族出档）；回线 ⇒ 除名兑现，2026-10-02；十五 ⇒ 十四）**（原入册——由 = 桌面收尾批（#652 钥行补 `[data-draft]` 标记 · 属性级）后越线〔批档 `docs/batches/2026-09-29-desktop-carryover.md` §5-c1——舱 1 实施〕 + 口子清零二轮续增（S3 行标分档渲染）；预案 = 段体续拆——**D37 落盘 164**——预案注销）·
  `thincoder-desktop/renderer/settings.css` **304 ⇒ 296（泛化编辑器退役批（#903）实施落盘——回线 ⇒ 除名兑现，2026-10-04；十六 ⇒ 十五）**（原入册——由 = D37 实施落盘（268 ⇒ 304——行族通则 ∥ 两行卡 ∥ 拨杆 ∥ MCP 展开面 ∥ ①④ 补则）；拆分预案 = 控件族出档评估（拟新增 `settings-controls.css`）——**泛化批落盘 296（实读兑现）**——预案注销；父裁 2026-10-02「在册越线不拆」随回线失效）·
  `thincoder-desktop/renderer/composer-sync.mjs` **324**（实读 2026-10-03——轻通道轮八（322 ⇒ 324——`providerNotice` 词路由换新键（`composer.send.noDefaultModelFallback` 澄清半句）+ 注释随正；非结构性触碰 ⇒ **续期**）；
  前读 **322**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（306 ⇒ 322——`providerNotice` 态明示行（`fallback` ∧ 非 invalid 类 ⇒ 带尾行）+ 清位面；非结构性触碰 ⇒ **续期**）；
  前读 **306**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（302 ⇒ 306——`providerKind` 类路由（词面-only——`failedNotice` 按类出词）+ 载体 `{ reason, kind }` 消费；非结构性触碰 ⇒ **续期**））；前读 **302**（新入册——由 = 口子清零二轮（引导形路由 + 注释收正）后越线；预案 = 续拆评估 · 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）））·
  `thincoder-desktop/renderer/core.css` **333**（新入册——由 = 口子清零二轮（面 20 段覆盖）后越线；实读 2026-09-30——门回填；预案 = 推理盒族出档 `thincoder-desktop/renderer/core-reasoning.css`（拟新增）· 消解窗口 = 下个**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））·
  `thincoder-desktop/src/main/providers.mjs` **339 ⇒ 317**（实读 2026-10-04——渠道档位退役批实施落盘（339 ⇒ 317——`effortOf` 整件 ∥ 行 `effort` ∥ 四引用离导入面；**仍越 300** ⇒ **续期**）；前读 **339**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（335 ⇒ 339——`provider:save` 成功回执携 `providerState`（第三刷新点主侧半）；非结构性触碰 ⇒ **续期**）；
  前读 **335**（实读 2026-10-03——首跑渠道提示修复批（#840）实施落盘（315 ⇒ 335——B① 保存补写支 + `backfillDefaultModel`（仅缺失 ∥ 既有非空零覆盖 ∥ 排他 `active:true`）+ 注面；非结构性触碰 ⇒ **续期**））；
  前读 **315**（新入册——由 = 口子清零二轮（S3 `failure` 键贯链）后越线；预案 = 验证 ∕ 探针族出档 `thincoder-desktop/src/main/provider-verify.mjs`（拟新增）· 消解窗口 = 下个**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）））·
  `thincoder-desktop/src/main/agent-host.mjs` **333**（实读 2026-10-04——模型切换解锁批实施落盘（327 ⇒ 333）；前读 **327**（306 ⇒ 327——修正轮收正）；前读 **306**（**新入册**——由 = 首跑渠道提示修复批（#840）实施落盘（298 ⇒ 306——C 无效装配不入表 ∥ KD-8 槽装载后复验；十五 ⇒ 十六））；预案 = 装配表维护面出档评估（新档名实施批定——装配表维护 ∥ 无效态判定族）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））·
  `thincoder-desktop/renderer/views/chat-text-segments.mjs` **497**（新入册——由 = E4-JS 波新档首登（设计 ≈200 预估失准，实落 497）＋ 本批 = 收正轮（产品码零触 ⇒ 不立即执行）；
  拆分评审结论 = 单一机制内聚（函数级面零越线——最大单函数 ≈54 行）∥ 单刀不回线（余 ≈385 仍越）⇒ **两刀预案** = ① 纯算式族（段界 ∥ 窗 ∥ 预算 ∥ 补偿读数——≈112 行）出档 `thincoder-desktop/renderer/views/chat-text-segments-plan.mjs`（拟新增）② DOM 面续拆（分区分割族 ∥ 窗与帧步族——新档名实施批定）；
  **500 硬限余量 = 3 行（497 ⇒ 500）——净增越 3 行即先执行拆分**；
  消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））·
  `thincoder-desktop/renderer/subagent-reduce.mjs` **301 ⇒ 258（#765 落盘——回线 ⇒ 除名兑现，2026-10-01；十四 ⇒ 十三）**（原入册——由 = **三端消化面统一批（#747）**：座次入模（`appendArchived` 两调用点——父侧 22:45 裁 = 准机制落）；预案 = 续拆评估（座次 ∥ 归约面族）——**#765 落盘 258（实读兑现）**——预案注销）；
  `thincoder-desktop/renderer/app.mjs` **328**（实读 2026-10-04——子代理面板批未回填项随正（321 ⇒ 328——`panel-readout` 接线 = import ∥ 上报器构造 ∥ `applyFrame` 尾报；非结构性）；
  前读 **321**（实读 2026-10-02——设置体系升级批（#817）实施落盘（319 ⇒ 321：deps 注入二口——装配接线（非结构性））；前史：菜单体系批落盘 319；更前 = 复核扫面收正批（299 ⇒ 305））；预案 = 帧门段整段出档 `thincoder-desktop/renderer/frame-gate.mjs`（拟新增）；触发 = 届盘 > 500 · 消解窗口 = 任一后续批择机）·
  **菜单体系批（#811）触属性 = 装配接线（非结构性）**〔新增行全为接线点——`import` ∥ face 捕获 ∥ 通道接线；无段级结构变更〕⇒ 沿「任一后续批择机」顺延（不随拆）·
  **贴 300 层未越（口径 = 现值 ≤ 300 ∧ 距线 ≤ 3 行；实读 2026-09-30）**：`thincoder-desktop/renderer/views/chat-tool.mjs` **300** ∥ `chat-digest.mjs` **298 ⇒ 116 ⇒ 226**（#738 拆分兑现 ⇒ 贴层解消；#747 后仍离线）；**app.mjs ⇒ 越层在册（**328**——实读 2026-10-04（子代理面板批随正；#817 后 321）；见上行越层段）**；
  `thincoder-desktop/renderer/mount-composer.mjs` **299**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（297 ⇒ 299——`COMPOSER_KEYS` 补 `providerState`（第三刷新点重派生闭环）；装配接线（非结构性）——+1 行即越线）；
  预案 = 各自下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）。
**本批（主题切换 · D33 · 2026-09-30）触碰贴层两档 ⇒ 越 300 咨询线**：`thincoder-desktop/renderer/app.mjs` **300 ⇒ 305**（实读 2026-10-01——主题切换批落盘；其后 #764 ⇒ **299** 回线 ✓）∥ `thincoder-desktop/renderer/settings.css` **298 ⇒ ≈301**（主题钮族带上）——逐档「现行 ⇒ 预期」= §4.2 本批行；
  **拆分预案** = app 装配段 ∥ settings 控件族出档评估（拟新增 `thincoder-desktop/renderer/settings-controls.css`——**settings 侧 = 泛化编辑器退役批回线（296）⇒ 注销，2026-10-04**）；
  **消解窗口** = 各自下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）。
**本批（口子清零二轮 · #673 · 2026-09-29）触碰贴层两档 ⇒ 越 300**（`thincoder-desktop/src/main/providers.mjs` **300 ⇒ 315**（S3 `failure` 键贯链）∥ `thincoder-desktop/renderer/core.css` **299 ⇒ 332**（面 20 段覆盖））——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）；
  **拆分预案 = 验证 ∕ 探针族出档 `thincoder-desktop/src/main/provider-verify.mjs`（拟新增）· 推理盒族出档 `thincoder-desktop/renderer/core-reasoning.css`（拟新增）· 消解窗口 = 下个结构性触碰的批**；
  **已按盘回填越层入册（2026-09-29）**。
**合并实施轮落值（挂起窗径批 ∥ 窗队列批 · 2026-09-29）**：`thincoder-desktop/src/main/suspension-drive.mjs` **279 ⇒ 326**（#119 落值——**越 300 顾问线**（≤500 硬限内；时序面 +27 = 派单强制面）；拆分已执行 ⇒ 新档 = `thincoder-desktop/src/main/window-queue.mjs` **91**·实读 2026-09-29——仍未回线 ⇒ 越层在册 + 拆分预案 = 窗内时效 ∕ 时序守卫面出档（≈30 行）·
  **消解窗口** = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））。
**本批（对齐重定位 · 设计轮）触碰越层三档 + 贴层一档**（`thincoder-desktop/renderer/events.mjs` · `thincoder-desktop/renderer/i18n.mjs` · `thincoder-desktop/renderer/store.mjs`——越层事实与预案承前；`thincoder-desktop/renderer/views/chat.mjs` 贴层）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）；消解窗口 = 各自下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）。
**本批（状态栏对齐 · 两座落）触碰四档**（实读 2026-09-28——落值）：`thincoder-desktop/renderer/views/statusline.mjs` **269**（banner 段组拆出 `thincoder-desktop/renderer/views/statusline-banner.mjs` **25**——拆后 ≤300）·
  `thincoder-desktop/src/main/agent-host.mjs` **254**（装配面出档 `thincoder-desktop/src/main/agent-assemble.mjs` **95**——原路径同名 re-export）·
  `thincoder-desktop/renderer/events.mjs` **494** · `thincoder-desktop/renderer/mount-pool.mjs` **60**；新越层三档补登见上行（`agent-host.test` / `session-contract.test` / `events-reduce.test`）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）。
**本批（账本警示面 · 账本可靠批微轮）触碰六档 + 随动两档**（实读 2026-09-28——落值）：`thincoder-desktop/src/main/sessions.mjs` **45**（回执 `ledger` 投影——经端壳转口引核 `ledgerHealth`）·
   `thincoder-desktop/src/main/session-slots.mjs` **195**（两座合计：状态栏 wiring `slotFlags` + 本座转口一行）· `thincoder-desktop/renderer/views/session-control.mjs`（R13-B 拆分产——下拉首行注记 + `sessionModel` 携 `ledger` 字段 + 条件附句合成）· `thincoder-desktop/renderer/app.mjs` **254**（`SESSION_KEYS` 含 `ledger`）；
  测试面两档（原址补例）——随 2026-09-28 测试树全清重置不在册（单元 = 单元测试档）；
  表外四档（落而必报）= `thincoder-desktop/renderer/mount-sessions.mjs` **197**（净 0——`refreshRail` 同行加 `ledger` 写）· `thincoder-desktop/test/views-chrome-vocab.test.mjs` **320**（+4——键数门 145 ⇒ 146）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  `thincoder-desktop/renderer/store.mjs` **333**（+2——`ledger` 槽位注册）· store 初态定形锁（+2——原档随 2026-09-28 测试树全清重置不在册）；
  随动 = `styles.css` **466** · `thincoder-desktop/renderer/i18n.mjs` **423**）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）。
**本批（外壳视觉降噪 · 设计轮）触碰四档 + 测试面两档**（`styles.css` **463 ⇒ ≈481**——容器 / 骨架线 / 控件族 / 标签活动态 / 滚动条 4 规则与交互态组；越 300 在册——拆档预案 = §10 **AL**）·
  `thincoder-desktop/renderer/chat.css` **300 ⇒ ≈310**（**新越层档** ⇒ 预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 未落 · 排末 · 零搬移 · 本批不落）——消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））·
  `thincoder-desktop/renderer/pool.css` **78 ⇒ ≈84** · `thincoder-desktop/renderer/settings.css` **273 ⇒ ≈289**（设置面映射 9 面）；
  测试面两档（原址补例——随 2026-09-28 测试树全清重置不在册））——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）；测试档随修随加——不占设计条目（2026-09-27 裁定）。
**本批（回合中插入 · 步边界 pickup · 设计轮）触碰档（就地给数 · 越层在册事实承前）**：`thincoder-desktop/src/main/agent-host.mjs` **285 ⇒ ≈330**（受理路由分岔 + 续发链；**越 300** ⇒ 预案 = 续发链提取 `thincoder-desktop/src/main/turn-chain.mjs`（**已落** · 实读 **71**——拆后仍越 300 ⇒ 续拆评估在册——**2026-09-29 父侧复核：agent-host 现值 260 ≤300，评估消解**）·
  **消解窗口** = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））·
  `thincoder-desktop/src/main/turn-face.mjs` **52 ⇒ ≈60** · `thincoder-desktop/src/main/ipc.mjs` **224 ⇒ ≈228**（`history:page` 回执 `queue` 叠加）· `thincoder-desktop/src/preload/preload.cjs` **58 ⇒ ≈59**（`EVENT_CHANNELS` +1）；
  `thincoder-desktop/renderer/events.mjs` **456 ⇒ ≈466**（实读 2026-09-28——align-2 拆档（`page-read.mjs`）已落；对齐第三批在途增量以该批落定实读为准；`ev:queue` 归约 +≈10；越 300 在册——预案见越层段）· `thincoder-desktop/renderer/events-subscribe.mjs` **69 ⇒ ≈64**（flush 携行退役 ∕ 窄口存续）· `thincoder-desktop/renderer/queue.mjs` **45 ⇒ ≈35**（快照应用）；
  `thincoder-desktop/renderer/store.mjs` **333 ⇒ ≈300**（原三纯动作退场 + `pending` 改镜面——越 300 在册承前）· `thincoder-desktop/renderer/views/statusline.mjs` **269 ⇒ ≈270**（段 14 源改镜面）；
  `thincoder-desktop/renderer/mount-composer.mjs` **362 ⇒ ≈300**（忙态交宿主任判 + flush 退役——**在册预案「发送面拆出」本批落形**：拆出 `composer-send.mjs`（**已落** · 实读 **70**）；拆后本档实读 **322**（越 300 承前））· `thincoder-desktop/renderer/app.mjs` **254 ⇒ ≈250**；
  **新档** = `thincoder-desktop/src/main/queued-input.mjs`（**已落** · 实读 **78**（2026-09-29——队列取项边缘收正批后）——队列 + 计划取批）· `composer-send.mjs`（**已落** · 实读 **70**——拆分产出）· 登记面 = `thincoder-desktop/test/files.mjs`（新集成档名打包入既有行——净 0 行/批）。测试面随修随加——不占设计条目（2026-09-27 裁定）；机检 ∕ 真机面 = §6.1 本批注。

**本批（回合中插入）漂移注（实施实读 · 2026-09-28 · 归回填轮）**：实施实读 ≠ 本块预估——**新增四档**（`thincoder-desktop/src/main/turn-chain.mjs`（在册预案「续发链提取」落形）·
  `thincoder-desktop/test/agent-host-queued.test.mjs`（U217–U219——原 `thincoder-desktop/test/agent-host.test.mjs` 触 500 硬限按在册预案拆出）· `agent-host-harness.mjs`（装配假面共享 · 零用例）· `thincoder-desktop/test/integration/midturn-input.test.mjs`）+（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  **表外必需随动一处**（`thincoder-desktop/renderer/page-read.mjs`——首屏读 `queue` 键重建镜面）；本块数值 = as-of 设计轮基线（as-of 政策同 §4.1）——行数实读与全面回填 = 回填轮（勿就地抢做）；实读台账 = 批档 §5。

**300 行 = 主动拆分层**（>300 即须拆分评审）：`thincoder-desktop/test/views.test.mjs`（实读 **242**——2026-09-28）两轮拆分均已落档——（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  U45–U48 标签条面 → `thincoder-desktop/test/views-tabbar.test.mjs`、（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  U49–U52 中区外壳 / 词表面 → `thincoder-desktop/test/views-chrome.test.mjs`（实读 **283**——2026-09-28；批 7 拆出 U52 零回归面 ⇒ `thincoder-desktop/test/views-locks.test.mjs` 实读 **279**（2026-09-28）；批 B 拆出词表面 ⇒ `thincoder-desktop/test/views-chrome-vocab.test.mjs` 实读 **320**）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
**拆分落形（批 A）**：`thincoder-desktop/test/views-tabbar.test.mjs`（实读 **329**〔拆前〕· >300）中确认面族（U55）拆 `thincoder-desktop/test/views-tabbar-close.test.mjs` ⇒ 本档落 **297** ∕ 新档 **317**（新档越 300 ⇒ 预案 = 页随动例拆出 · 消解窗口 = 下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  **拆分落形（批 B）** = 词表面族拆 `thincoder-desktop/test/views-chrome-vocab.test.mjs`（本档 **437 ⇒ 258** ∕ 新档 **291**）·（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  用量族补例单列 `thincoder-desktop/test/agent-host-usage.test.mjs`（`thincoder-desktop/test/agent-host.test.mjs` 落 **299**）；清单**三十五档**同步 = `thincoder-desktop/test/files.mjs`（**批 B 末值**；R3 后 **44 档**——见 §4.1 用例模块行）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
**拆分落形（批 A）**：标签条面族（`tabbarModel` / `tabbarTree` / `mountTabbar` 及其子构树 + 加速键面）自会话族视图拆出——**该两档随会话模型轮 R13 退场**（现状 = `thincoder-desktop/renderer/views/session-control.mjs` + `thincoder-desktop/renderer/mount-sessions.mjs`）；
同批 `thincoder-desktop/renderer/app.mjs` 会话族接线拆 `thincoder-desktop/renderer/mount-sessions.mjs` ⇒ 本档落 **222** ∕ 新档 **197**（皆实读）；
**拆分预案（批 7 在册 · 批 8 落形）**：`thincoder-desktop/renderer/app.mjs` 实读 **297**——批 7 池面接线落地后贴 300 层；批 8 叠加装配桥接线面（事件订阅 + 池面同刻接线）⇒ **预案触发**：池面接线拆 `thincoder-desktop/renderer/mount-pool.mjs`（实读 **36**）（沿批 6 `chat-*` 拆分先例）；
**拆分落形（批 9）**：设置面 / 向导接线再拆出 `thincoder-desktop/renderer/mount-settings.mjs`（实读 **458**——在册例外 / 预案见下行）⇒ `thincoder-desktop/renderer/app.mjs` **299**；
**在册例外（批 9 修正轮 #9 · 批 B 续期）**：`thincoder-desktop/renderer/mount-settings.mjs` 实读 **426**（批 B 末实读——>300）——**拆分落形（批 B · ⑥）** = 向导接线族拆 `thincoder-desktop/renderer/mount-onboarding.mjs`（本档 **90**——#667 批后）⇒ 本档落 **426**（仍 >300 ⇒ 例外续期；距 500 硬限 **74** 行）；**再拆预案** = 信息行接线族 + 读数供给族拆出（档名实施批定）；
  **消解窗口** = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）；
**随动面** = `docs/desktop/design/SHELL.md` §1 树 + 词表面扫描清单（U51 零 CJK 扫描 / U52 导出面锁——承载随 2026-09-28 测试树全清重置不在册）+ 本档 §4.1 行预算；
  **批 A 修正轮随动**（零语义）：原 `sessions.mjs` ∕ `tabbar.mjs` 两档随会话模型轮 R13 退场——其随动项（导入源 / 零字形扫描名单 / 关闭确认面扫描靶）随档一并退场。

**本批（parity-b10-ui · W6 届盘复读）行「实读落值」**（实读 2026-09-29 · W6 收口波——内容行数口径；三舱分片 ∕ 波面 = `docs/batches/2026-09-29-parity-b10-ui.md` §2.7 ∕ §5；逐档新旧值见上表行内注）：
`thincoder-desktop/src/main/ipc.mjs` **322** · `ipc-registry.mjs` **86** · `preload.cjs` **78** · `settings.mjs` **324** · `providers.mjs` **300** · `mcp-servers.mjs` **262** · `settings-values.mjs` **109** · `settings-env.mjs` **95** ·
`renderer/app.mjs` **293** · `thincoder-desktop/renderer/index.html` **55** · `renderer/skin.css` **18** · `renderer/chrome.css` **450** · `thincoder-desktop/renderer/i18n.mjs` **500** · `renderer/i18n-views.mjs` **328** · `renderer/store.mjs` **300** ·
  `renderer/mount-settings-exits.mjs` **224** · `renderer/mount-settings-segments.mjs` **356** ·
**新档三件** = `renderer/settings-confirm.mjs` **80** · `renderer/mount-settings-segments-providers.mjs` **134** · `renderer/mount-settings-segments-agent.mjs` **154**（新档落盘随批登记——本表 + 上表行）；
`thincoder-desktop/renderer/views/settings.mjs` **334** · `views/settings-agent.mjs` **227** · `views/settings-sections.mjs` **297** · `views/settings-controls.mjs` **130** ·
  `views/settings-sections-tools.mjs` **161** · `views/settings-sections-mcp.mjs` **178** · `views/statusline-segments.mjs` **224**；
**零改** = `renderer/mount-settings-reads.mjs` **189**（S10 候选改由 `model:list` 切片派生——设计 +≤8 预算未用）；
  **越层新入册四档**（`mount-settings-segments.mjs` ∕ `thincoder-desktop/renderer/views/settings.mjs` ∕ `thincoder-desktop/src/main/settings.mjs` ∕ `i18n-views.mjs`）+ 续越两档（`ipc.mjs` ∕ `i18n.mjs`）——
  各带预案 / 消解窗口见上行越层段；
  **W6 届盘复读与 §5 记录差**（`i18n.mjs` 500 vs 507 · VSC `settings.mjs` 350 vs 351 ·
  `statusline-segments.mjs` 224 vs 215 · `panel-subagent-relay.mjs` 222 vs 223——以盘为准）登记 = 批档 §2.16。

**本批（消化面留档批 · #719 · 2026-09-30）触碰档（回填轮终值 —— 实读 2026-09-30；内容行数口径；面 ∕ 机制单源 = 批档 `docs/batches/2026-09-30-digest-persistence.md` §2 ∥ §5）**：
  `thincoder-desktop/src/main/suspension-drive.mjs` **285**（+ 新档 `suspension-timers.mjs` **68**——拆档兑现 ⇒ 越层除名；修复轮 3 后——`end` 写点前移出档）·
  `thincoder-desktop/src/main/turn-face.mjs` **197**（修复轮 3 后——`end` 记录移入：`emitDigestEnd` ∥ 两径结算前） ·
  `thincoder-desktop/src/main/session-io.mjs` **65** · `thincoder-desktop/src/main/agent-host.mjs` **291** ·
  `thincoder-desktop/src/main/ipc.mjs` **270** + `ipc-registry.mjs` **90**（`HANDLERS` 46 行项）· `thincoder-desktop/src/preload/preload.cjs` **80**（白名单 **46**）· `thincoder-desktop/renderer/page-read.mjs` **207**（超 ≈190 估——折叠 ∥ 位次两面全注释）·
  `chat-digest.mjs` **298**（超 ≈235 估——位次面四件全注释 + 对位算法；<300 距线 2 行 ⇒ 贴层在册）·
  `thincoder-desktop/renderer/subagent-reduce.mjs` **250**（超 ≈205 估——标记 ∥ 行计数两件 + 两出站点注释）·
  `thincoder-desktop/renderer/views/chat.mjs` **234**（+ 新档 `views/chat-tree.mjs` **127**——构树面出档 ⇒ 越层除名）· `thincoder-desktop/renderer/views/chat-chrome.mjs` **221** · `thincoder-desktop/renderer/events-wake.mjs` **88**（净 0——直复用）· `thincoder-desktop/renderer/chat.css` **350**（注释随动）·
  **表外三档（实施披露 · 随批补行）**：`thincoder-desktop/renderer/store.mjs` **303**（`visibleWindow` 例外摘除——越 300 在册，触属性 = 行级小修 ⇒ 窗口顺延）∥ `thincoder-desktop/src/main/session-slots.mjs` **235**（`pageHistory` 直通——增派）∥ `thincoder-desktop/renderer/views/chat-subagent.mjs` **101**（留档块口径注释随动）·
  **核两档** = `thincoder-core/history-window.mjs` **194**（记录直通 opt-in——核面例外登记 = §6.2 A4 ∥ §8）∥ `thincoder-core/context.mjs` **440（零改）**；
  测试面 = 批内件 `docs/batches/2026-09-30-digest-persistence.test.mjs`（**九腿**（原五腿 + 复盘腿 6 + 修复轮 3 腿 7）· **9/9 绿**——父侧复跑 ✓）+ 原两 digest 批内件随动 ∥ 退役二择归 #708；逐行「现行 ⇒ 实读落值」表 = §4.2 本批块。

**本批（桌面发布·阶段二批 · #810 · 2026-10-02）触碰越层一档 ⇒ 越 300 咨询线**：`thincoder-desktop/src/main/window.mjs` **288 ⇒ 336**（实施落盘实读 2026-10-03——`onNative` +`update` 转口 ∥ 更新对话框族（确认 ∥ 结果两态）——逐档「现行 ⇒ 实读」= `docs/desktop/design/PACKAGING.md` §3.3 行 7 ∥ `docs/desktop/design/MENU.md` §3.5 行 3）；
  **拆分预案** = 冒烟读数族出档评估（拟新增 `thincoder-desktop/src/main/smoke.mjs`——`PROBES` ∥ `runSmoke` ∥ `probesSatisfied` 族；消费面 = `main.mjs` 冒烟链）；
  **消解窗口** = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∥ 词值 ∥ 行级小修不计）。

**测试面三分落点**（对回上表用例模块行）：

- **自动**（本端单入口 `thincoder-desktop/test/run.mjs`）：`host-floor` 启动下限自检 T-DSK15 · `guard-closure` 渲染面静态闭包守卫 T-DSK16 · `session-contract` 会话族与跨端接续 T-DSK3 / T-DSK12 · `store` 状态树与增量渲染 T-DSK17–T-DSK20 · `views` 左列三态与词表（T-DSK1 / T-DSK2 / T-DSK3 的渲染面 + 中区外壳结构面 T-DSK20 / T-DSK3 标签条语义行——U45–U52）。
  - 批 6 补两档：`views-chat` 对话流三态与工具卡（U58–U62）· `views-chat-scroll` 滚动面三事纯函数（U63–U67）。
  - 批 7 补两档：`views-approval` 审批卡面两形与降级（U68–U70）· `views-activity` 池面三态与折叠两读数（U72–U73）；`views-chat` / `store` / `host-floor` 三档**原址补例**（U75 / U74）；实施期拆档两档：`views-chat-frame`（U71 帧面自 `views-chat`）· `views-locks`（U52 零回归面自 `views-chrome`）。
  - 批 8 补**五档**：`agent-host` 主侧面（装配 / 桥九映射 / 挂起表 / 回合驱动——U76–U86）· `events-reduce` 归约面与值面写者（U87–U89）· `events-page` 页回执与订阅面（U90–U92）· `history-page` 页转口与元（U93–U94）· `session-io` 槽装载与回合尾落盘（U96–U97）；`host-floor` 原址补例（U74 计数随动 10 → 13 · U95 显形）。
  - 批 9 补**六档**：`settings`（设置族——U98–U102）· `providers`（渠道族——U103–U107（含 U107b））· `mcp-servers`（MCP 族——U108–U110）· `project-info`（项目级信息族——U111–U113）；
    视图两档 `views-settings` / `views-onboarding` **零 U 号**（档名面入 U51 零 CJK 扫描清单——落 `thincoder-desktop/test/views-chrome.test.mjs`）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
    - **U95 臂（`host-floor`）口径**：判据 `≤300` **含线上**（实读 **284**）——依据 = 规则线本身（「无文件 >300 行」），非余量口径；
      **覆盖面** = `fresh` 清单十八档（批 8 十二 + 批 9 六用例档）+ 在册例外面（`mount-settings.mjs`）+ `renderer/app.mjs` + 宿主档源面零 `electron`；
      批 9 其余新档（主进程四源档 · `settings.css` · 视图三档 · `views-harness.mjs`）行数面 = §4.1 值列表（臂清单随动 = 码面池）；
      批 A 新档七档（`thincoder-desktop/renderer/views/{tabbar,question,plan}.mjs` · `thincoder-desktop/renderer/mount-composer.mjs` · `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮） ·
      `thincoder-desktop/test/{views-question,views-tabbar-close}.test.mjs`）行数面 = 同路（§4.1 值列表 / 臂清单随动 = 码面池）。
    - **`fresh` 清单口径**：`host-floor` 的 `fresh` 清单只收目录文件名读数——**越层档不入清单**（`mount-settings.mjs` **426** 不入）；批 9 六档补入 = 码面池（父侧臂清单随动项）。
    - **覆盖缺口两件（登记）**：① 设置面 **Esc 键**明示不覆盖（零 Esc 绑定 = 裁定项——`docs/desktop/design/UI.md` §1 设置面行）；② `settings:agent` **保存出口判据**挂 T-DSK7 / T-DSK8（§7 批 9 注）——真面缺口（保存出口端侧路径判据未单列）已登记。
  - 批 A 拆档一档 + 增档一档：`thincoder-desktop/test/views-tabbar-close.test.mjs`（确认面族 U55 自 `views-tabbar` 拆出）· `thincoder-desktop/test/views-question.test.mjs`（U 号面 = §7 批 A 注）；`views-tabbar` 原址**改例**（⑤ 换机制——既有 `inert` 断言件改「两控件 `tabindex` 两态」+ 点按两向——T-DSK20 / T-DSK25）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
    **T-DSK26（关标签页随动）= 第 ⑥ 件机检面** = `thincoder-desktop/test/views-tabbar-close.test.mjs`（页随动**五例**：关活动 ⇒ 邻位页 ∕ 关唯一 ⇒ 关页 `none` 态（零块节点 + 引导节点 `data-guide="no-session"`）∕ 关非活动 ⇒ 零动作 ∕ 待确认按取消 ⇒ 零动作 ∕ 已关会话迟到回执零写）（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
    + `thincoder-desktop/test/views-locks.test.mjs` 原址补例（关闭尾接线锚 ⇒ 值列实施后回填）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  - 中区外壳面读作 **静态树面 + 常量驻留**（常量机检折进 U48）；运行时横滚 / 渐隐 / **标签点按切换与加速键**归人工走查。
- **自动 · 项目面**：`projects` = T-DSK1 / T-DSK2（核 `_setSessionsDirForTest` 指临时目录 + 手写 `<40hex>.json` 族——零新核缝）。
- **CI 冒烟**：产物与启动 = T-DSK14（矩阵见 §4.2 / `docs/desktop/design/PACKAGING.md` §2）。
- **人工交互面**（人工走查）：键位 / 焦点 / 拖拽类 = T-DSK21（含本批卡面「同 `prompt-id` 重挂不夺焦」幂等条）；实机交互类（宿主内实跑 + 真实后端回路）= T-DSK4 / T-DSK5 / T-DSK6 / T-DSK7 / T-DSK8 / T-DSK9 / T-DSK10 / T-DSK11 / T-DSK13。

### 4.2 现有文件改动（实施批）

**拆档链登记（2026-09-29 同步 · 设计面轮）**：本批与并行拆档批的**拆档新档**（逐档读数 / 缝制式 = `docs/batches/2026-09-28-desktop-feature-parity.md` §5 各轮「拆档产物」行）：R4 ∕ R5 ∕ R7 ∕ R8 四轮产物
+ **#28 `thincoder-desktop/src/main/ipc-registry.mjs`（77**——`HANDLERS` 表 + 注册序；`ipc.mjs` 333 ⇒ **293**）+ 核侧 `thincoder-core/config-watch.mjs`（R8 上提——VSC 壳 `thincoder-vscode/src/extension/config-watch.mjs` 78 ⇒ **36**）。消费面零改（缝 = 同名再出口 ∕ 表位注册）。

**（structure-split-2 批块——迁出）** → 见 `docs/desktop/design/SHELL.md` §5.2（批块「现行 ⇒ 实读落值」行；as-of 2026-10-02）。

**（desktop-digest-parity 批块——迁出）** → 见 `docs/desktop/design/CHAT.md` §3.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（设置体系升级批（#817）批块——2026-10-02 · 已落）**（承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md`；设计 = `docs/desktop/design/MENU.md` §1 **KD-67** ∥ `docs/desktop/design/SETTINGS.md` §1 **KD-68**；明细 = 批档 §5）：

| 文件 | 改动 | 归属 |
|---|---|---|
| `thincoder-desktop/src/main/menu-words.mjs` | 86 ⇒ **115**（+3 键（键集 29 ⇒ 32）+ `settingsSectionLabels` 读器） | 本批（已落） |
| `thincoder-desktop/src/main/app-menu.mjs` | 111 ⇒ **143**（设置组重组（「维护」⇒「设置」+ 入口 + 七组项 + 两子组）+ `SETTINGS_GROUPS` 镜像闭集同导出） | 本批（已落） |
| `thincoder-desktop/src/main/window.mjs` | 283 ⇒ **288**（`buildMenu` 读 `settingsSectionLabels` + `sections` 注入） | 本批（已落） |
| `thincoder-desktop/renderer/menu-actions.mjs` | 37 ⇒ **44**（+`openSettings` 分支——六动作闭集） | 本批（已落） |
| `thincoder-desktop/renderer/app.mjs` | 319 ⇒ **321**（deps 注入二口） | 本批（已落） |
| `thincoder-desktop/renderer/settings-modal.mjs`（新档） | 无 ⇒ **63**（弹窗宿主——单例弹层 + 建 ∕ 刷 ∕ 关三件） | 本批（已落） |
| `thincoder-desktop/renderer/settings-modal.css`（新档） | 无 ⇒ **41**（背板 z-20 ∥ 居中卡 z-21） | 本批（已落） |
| `thincoder-desktop/renderer/views/settings.mjs` | 364 ⇒ **398**（+`settingsModalTree` 导出；越 300 在册——触属性复核（#817 收口）= 非结构性维持） | 本批（已落） |
| `thincoder-desktop/renderer/mount-settings.mjs` | 181 ⇒ **249**（第二闸 + 开 ∕ 关装配 + 本组复位复用） | 本批（已落） |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | 248 ⇒ **264**（F-Esc 闸守卫 + `closeSettings` 同清 `modal`） | 本批（已落） |
| `thincoder-desktop/renderer/store.mjs` | 330 ⇒ **331**（`settings.modal` +1 键——非结构性） | 本批（已落） |
| `thincoder-desktop/renderer/index.html` | 56 ⇒ **57**（+`settings-modal.css` 链行） | 本批（已落） |
| `docs/desktop/design/{MENU,SETTINGS,IPC,PROJECT,SHELL,UI}.md` | 设计落定（KD-67 ∥ KD-68 ∥ 六动作 ∥ 六腿；落盘批补 = 本节 + §4.1） | 本批（已落） |
| `docs/batches/2026-10-02-desktop-settings-menu-upgrade.test.mjs`（批内件 · 新档） | 无 ⇒ **531**（六腿 · 8 用例——随批留存 · 不进仓套件） | 本批（已落） |

零改面：七段段体 ∥ 读取族 ∥ 出口族 ∥ 既有确认族（`settings-confirm.mjs` 只读复用）∥ 现有设置页（双入口并存）∥ 核 ∥ `thincoder-render-core` ∥ CLI ∥ VSC 零触；零新通道（事件 24 ∥ 白名单 47 不动）。

| 文件 | 改动 | 归属 |
|---|---|---|
| `PROJECT-MANIFEST.json` | `checkConfig` 域内：`docRoot` 扩 `docs/desktop/{requirements,design}`（**已落**——as-of 2026-09-30 实读：docRoot 五根含 desktop 两树） | **父侧**（写门专权——批次档 §1.3 已裁定） |
| `.github/workflows/test.yml` | 新增三平台矩阵（win / mac / linux）+ 本端测试 job（需求档 §8 P4：现仅 ubuntu） | 实施批 |
| `docs/core/design/DOC-SYSTEM.md` | 三部分 → 四部分（本批已落） | 本批 |
| `docs/core/design/ARCHITECTURE.md` | 补第四端（本批已落） | 本批 |
| `thincoder-core/session-slot-write.mjs` | 增 `setSlotPrefs(cwd, slot, patch)`（沿 `setSlotAutoApprove:140` 同形 · 复用 `writeFlag:131`）+ `resolveEffortPatch(level, model)` 纯函数（档位归一——含 off 族）· `newSlotData:46` 产 `effort: null` | **本批**（授权 = 批次档 §1.2） |
| `thincoder-core/session.mjs` | `saveSession` 字段表携 `effort`（实读 `:120-138` 现表无该键——缺之 ⇒ 下一次保存整对象抹除） | **本批**（同上） |
| `thincoder-core/session-lifecycle.mjs` | `applySession:81`（档位支 `:176-:190`）在模型合并支之后应用 `data.effort`（`null` / 缺键 ⇒ 不动）——施加面唯一 | **本批**（同上） |
| `docs/core/design/SESSION.md` | 增 §6.21（核面单源——判据句 1–5 + 立/破表 + 验收回指 + 不做 + 端侧契约指针）；收口轮随动：写面坐标按实读重指 + 施加面口径收正（含 VSC 自有面） | **本批**（已落） |
| `docs/desktop/design/IPC.md` | 批 B 契约落定（`ev:usage` · `session:prefs` · 会话级偏好注 · 附件注 · 白名单 **27** · `model:list` 补 `effortEnum` / `thinkOff` 元素投影 · 需求侧行 `D1–D16`） | **本批**（已落） |
| `docs/desktop/design/UI.md` | 批 B 形态落定（§1 存量行内「（批 B 落）」标注 + §1 批 B 注**五项**——行数不变）+ **批 B 追加注**（首启引导四项——追加轮） | **本批**（已落） |
| `docs/desktop/design/SHELL.md` | 批 B 形态与收口轮随动（§1 树补五新行 + 值收正（`events-subscribe` / `mount-settings` / `mount-composer`）· `views/` 行补两档 · 十三通道口径） | **本批**（已落） |
| `docs/desktop/design/RENDERER.md` | 批 B 形态落定（§1 单状态树行补 `usage` 切片 · §1.1 事件归约面条补 `ev:usage` 归约——KD-20 指针）+ **批 B 追加轮**（§1.1 引导节点条 + 关标签页随动条收正） | **本批**（已落） |
| `docs/desktop/design/E2E-TESTING.md` | 批 B 追加轮落定（§3.5 T-DSK32 十二序〔批时值——序数现读单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 = **十序**〕+ §4 新档行 + §6 用例行 + §7 按批限定） | **本批**（已落） |
| `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 主表行 13 `session-slot-write.mjs` 读数收正 **168 → 222**（批 B 核面增量入账——口径 = 内容行数） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 批 B 全程随动（§4.1 行预算按末实读回填 · 越层表重写 · §6.1 / §7 用例面 · §9 落形指针；明细 = 批次档 §2）+ **批 B 追加轮**（首启引导：§4.1 值列 / 新档两行 + 集成行 · §6.1 D11 / D14 · §7 T-DSK32 · §8 · §9 · §10 Z） | **本批**（已落） |
| `docs/README.md` | 地图补第四部分行 + 各「三部分」口径改四（**本批不动**——报告面上报，§10） | 父侧 |
| `docs/desktop/design/UI.md` | 本批形态落定（§1 七处「可见面修复批修」指针 + **本批注**五项：输入区样式 / 用户块出泡 / 游标清点 / 文本段逐处形 / 信息行复读） | **本批**（已落） |
| `docs/desktop/design/RENDERER.md` | 本批工艺落定（§1.1 三条：用户块 · 游标清点 · 文本段行形态通则） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§2 KD-23 / KD-24 · §4.1 值列九行 + 越层段 · §4.2 三行 · §6.1 D3 / D10 · §7 T-DSK22 · §10 AB / AC / AD） | **本批**（已落） |
| `docs/render-core/design/RENDER-CORE.md`（新档） | 核落点 / 加载形 / 边界 / 逐模块判定表（51 档）/ 逐机制对位表（22 行）/ 分期 R1–R3c（本批主交付） | **本批**（已落） |
| `docs/desktop/design/UI.md` | 对齐重定位四项（状态行 15 段裁定表 · 右列 = 子 agent 面 · 会话流经核（含「零 Markdown」改判）· 元数据族）——§1「本批注（对齐重定位）」 | **本批**（已落） |
| `docs/desktop/design/IPC.md` | `ev:reasoning` / `ev:subagent` 两通道 + `ev:usage` 载荷扩（`tokens?` / `timers?`）+ `subagent:stop`（白名单 27 ⇒ 28） | **本批**（已落） |
| `thincoder-render-core/**`（已落） | 共享渲染核包（落点 / 加载形 / 边界 = `docs/render-core/design/RENDER-CORE.md`）；两端接入面 = `thincoder-vscode/package.json` + `.vscodeignore` + `scripts/check-vsix.mjs` ∥ `thincoder-desktop/package.json` + `src/main/protocol.mjs` + `test/guard-closure.test.mjs` + `scripts/check-dist.mjs`；逐档「现行 ⇒ 预期」= 核档 §6 | 实施批 R1–R3（核档 §8）  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/src/main/agent-bridge.mjs` | **77 ⇒ 174**（R3a `onUsage` 回调 · R3b relay 分流 + 存活投影挂点 · R3c `onReasoning`——十一回调；结构不变）+ relay 分流转 `ev:subagent`（前缀剥除——KD-RC-6） | R3a–R3c（**串行**——共享档） |
| `thincoder-desktop/src/main/agent-host.mjs` | **271 ⇒ 300**（R3a 回合尾结算携 `tokens?` / `timers?` · R3b 出档挂载 + `dispose` 清点面——恰 300 ≤ 300 合规 · 贴层预警） | R3a / R3b |
| `thincoder-desktop/src/main/subagent-face.mjs`（新） | — ⇒ **86**（`subagent:stop` 出口 + 存活投影起 / 停 / 清点——2s 拍体） | R3b |
| `thincoder-desktop/src/main/ipc.mjs` · `src/preload/preload.cjs` | 白名单 **27 ⇒ 28**（`subagent:stop`）；**201 ⇒ 214** ∕ **58 ⇒ 58**（ipc 越 200——在册预案不变；preload 结构不变——`EVENT_CHANNELS` 10 ⇒ 12 两项落既有行） | R3b / R3c |
| `thincoder-desktop/src/main/sessions.mjs` | **34 ⇒ 37**（行投影补 `provider`——核 `activeProvider` · D18；结构不变） | R3c |
| `thincoder-desktop/renderer/events.mjs` | **369 ⇒ 500**（R3a turn 槽 / 计时归约 · R3b 子 agent 切片 + 摘工具行 · R3c 推理归约——恰 500 = 硬限顶格：在册拆分预案 `questions.mjs` 下次触碰必须执行）+ 三面重定位 | R3a–R3c（**串行**——共享档） |
| `thincoder-desktop/renderer/store.mjs` | **313 ⇒ 328**（R3a 状态行读数槽随动 · R3b 子 agent 切片 `subBlocks`；越 300——在册预案承前） | R3a / R3b |
| `thincoder-desktop/renderer/i18n.mjs` | **363 ⇒ 407**（R3a 状态行词键 · R3b 子 agent 族 · R3c 元数据族与复制钮两键——139 键 × 2 语；越 300——在册预案承前） | R3a–R3c（**串行**——共享档） |
| `thincoder-desktop/renderer/views/chrome.mjs` | **239 ⇒ 163**（会话头三段 + `sessionMetaOf`——状态行三段**同名再出口** · 消费面零改） | R3a |
| `thincoder-desktop/renderer/views/statusline.mjs`（新） | — ⇒ **256**（12 段构树单源 + `STATUS_SEGMENTS` 段闭集 + `mountStatus` 薄挂载——自 `chrome.mjs` 拆出） | R3a |
| `thincoder-desktop/renderer/mount-status.mjs`（新） | — ⇒ **24**（槽锚 `STATUS_SLOT` + 订阅切片键面 `STATUS_KEYS` + `attachStatus()`） | R3a |
| `thincoder-desktop/renderer/views/activity.mjs` | **177 ⇒ 248**（右列重写为子 agent 块面——工具行摘除 + 块头 / 停止钮；形态单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2） | R3b |
| `thincoder-desktop/renderer/views/chat.mjs` | **299 ⇒ 280**（**渲染逻辑单源**——核件分件消费 + 桌面外壳留存（三锚 / 滚动 · 回填 · 裁剪）；越层触发在册拆档落形 = 卡构树拆出 `thincoder-desktop/renderer/views/chat-cards.mjs` **51**） | R3c |
| `thincoder-desktop/renderer/views/chat-stream.mjs` · `thincoder-desktop/renderer/views/chat-tool.mjs` | **77 ⇒ 77**（流式外壳留存——零改；不接核 rAF 缝合件——桌面流式纪律 = 核帧合并件，单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9）· **135 ⇒ 138**（工具结果面经核 `capText`；卡壳四段头 / 折叠 / 耗时 / 改动摘要留存；`formatToolSummary` / `isToolFailure` 不消费——非缺口） | R3c |
| `thincoder-desktop/renderer/views/chat-text.mjs`（新） | — ⇒ **70**（文本面经核 `md` + 推理块壳〔核件结构同形〕+ 帧尾就地更新〔核 `paintStreamTarget`〕） | R3c |
| `thincoder-desktop/renderer/views/chat-cards.mjs`（新） | — ⇒ **51**（卡构树拆出——在册拆档预案落形） | R3c |
| `thincoder-desktop/renderer/views/sessions.mjs` | **256 ⇒ 286**（行元数据族三值——provider / N msgs / updated；贴 300 预警不变） | R3c |
| `thincoder-desktop/renderer/mount-*.mjs` 族 | 随动挂载（右列）：`mount-pool.mjs` **36 ⇒ 57**（停止出口 `stopSubagent` + `POOL_KEYS` 两键）——结构不变 | R3b |
| `thincoder-desktop/renderer/core.css`（新） | — ⇒ **140**（核类名 → 桌面变量映射——md 产出 / 推理块 / 复制钮三族 + `task-check`；映射不并入存量 `styles.css` / `chat.css`） | R3c |
| `styles.css`（本批随动） | **340 ⇒ 374**（R3a 段面 / 警示色两 class + `--warn`；R3c 随动——R3a 末实读 356） | R3a / R3c |
| `thincoder-desktop/test/**` | guard 前缀白名单（`/rc/`）（R1）+ 新用例族（状态行 / 右列 / 会话流 / 元数据；R3——D20 面含**出生自愈直测**；自铸用例号 **U154 起**（U152 / U153 已被占用——在册；U50 随族档迁宿主）+ E2E 用例号 **T-DSK37**） | R1 / R3 |
| `thincoder-desktop/renderer/core.css` | **140 ⇒ ~240**（D21 内容面视觉收正——逐面映射表 = `docs/render-core/design/RENDER-CORE.md` §5；本批首要缺口 = `tk-*` 高亮 9 规则现零 ⇒ 高亮不可见） | **本批（D21）** |
| `styles.css` | **374 ⇒ ~420**（D21 主题表 +14 变量〔亮暗两套〕· 左列会话行 9 面收正——会话面板映射表 = `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2；越 300 在册——拆档窗口 = §10 **AL**） | **本批（D21）** |
| `thincoder-desktop/test/views-locks.test.mjs` | **190 ⇒ ~210**（D21 值落点锁原址补例——新增变量两模式齐备 · `tk-*` 9 规则在场 · 关键值串；补例量自估 ≤ ±20；沿 §7 D21 注「测试档随修随加——不占设计条目」既裁） | **本批（D21）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | **146 ⇒ ~160**（D21 真机读数原址补例——真 Electron `getComputedStyle` 四值：代码块底 / 行内码底 / 表头底 / 关键词色；补例量自估 ≤ ±15） | **本批（D21）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `docs/render-core/design/RENDER-CORE.md` | §5 样式契约句收正（内容面视觉对齐 VSC）+ 视觉映射口径三律 + 主题表新增变量 **12** + 逐面映射表 **21 面**；§9 增 D21 端差两项 + 会话面板端差一项 + 不追面核心四条（全清单七条 = `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2） | **本批（已落）** |
| `docs/desktop/design/UI.md` | §1 增**本批注（D21 · 视觉对齐）两项**（内容面值表指针 · 会话面板映射表 **9 面** + 不追面七条）+ 对话流 / 左列会话行两行行内指针 + 档头 `D1–D21` | **本批（已落）** |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§2 **KD-29** · §4.1 `styles.css` 值列 + 越层段 · §4.2 五行 · §6.1 **D21 行** + 表头 · §7 **D21 注** · §9 · §10 **AL–AN**） | **本批（已落）** |
| `thincoder-core/session-lifecycle.mjs` | **352 ⇒ ≈386**（新出口 `sessionReading`——打开态读数；尾部追加 · 500 硬线内） | **本批（残余批）** |
| `thincoder-core/session.mjs` | **254 ⇒ 255**（`sessionReading` re-export 一行随动） | **本批（残余批）** |
| `thincoder-desktop/src/main/session-slots.mjs` | **154 ⇒ ≈195**（`pageHistory` 出 `seed` + `openingSeed` 投影；**实施后实读 180**） | **本批（残余批）** |
| `thincoder-desktop/renderer/events.mjs` | **500 ⇒ ≈470**（**在册拆分预案执行**——问题 / 任务切片拆出 `questions.mjs` + `badgeStamps` 随迁 `badges.mjs`；首屏播种支 +14；**拆后处置 = ≈470 仍越 300 ⇒ 续期 + 新预案**〔页读径拆出——见 §4.1 越层段〕） | **本批（残余批）** |
| `thincoder-desktop/renderer/questions.mjs`（**已落** · 实读 **44**） | — ⇒ **≈45**（`QUESTION_KEYS` / `onQuestion` / `onTask` / `clearQuestion`——events 原址 re-export 保名面） | **本批（残余批）** |
| `thincoder-desktop/renderer/badges.mjs`（**已落** · 实读 **23**） | — ⇒ **≈20**（`BADGES` / `badgeStamps`——events / questions 共用单一实现） | **本批（残余批）** |
| `thincoder-desktop/renderer/views/chat-text.mjs` | **70 ⇒ ≈82**（`textFace` 深度分流——`user` ⇒ `mdInline`；`assistant` / `reasoning` / `error` ⇒ `md`） | **本批（残余批）** |
| `thincoder-core/test/session-reading.test.mjs`（**已落** · 实读 **89**） | — ⇒ **≈90**（同源对拍 / 老槽回退 / 边界三组） | **本批（残余批）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/history-page.test.mjs` | **105 ⇒ ≈150**（seed 三例：`tasks` 直取 / `usage` 有效门 / 回填不携） | **本批（残余批）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/events-page.test.mjs` | **172 ⇒ ≈200**（首屏播种例：写入 / 缺席零写） | **本批（残余批）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/views-chat-text.test.mjs` | **139 ⇒ ≈160**（`user` ∥ `assistant` 深度对拍——纯构树） | **本批（残余批）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/integration/session-open.test.mjs`（**已落** · 实读 **137** · 集成域） | — ⇒ **≈120**（**T-DSK38**——探针式真 Electron：resume 后 `tasks` / `context` 段在场 + md 深度断言） | **本批（残余批）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/files.mjs` | **21 ⇒ 22**（新集成档登记）——**现盘 3**（随 2026-09-28 测试树全清重置；实读 2026-09-29） | **本批（残余批）** |
| `docs/core/design/SESSION.md` | 增 §6.24（`sessionReading` 契约——打开态读数判据句 + 验收回指）+ §5 指针 + §7 **D-SE61** | **本批**（已落） |
| `docs/desktop/design/IPC.md` | §2 `history:page` 行 + **「打开态播种注」**（新——`seed` 形态 / 缺席降级单源） | **本批**（已落） |
| `docs/desktop/design/UI.md` | §1 增**本批注（D17 / D19 · 残余补齐）两项** + 状态栏 / 对话流两行行内指针 | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§4.2 本批行 · §7 **T-DSK38** 行 + 残余批注 · §10 **AP–AR** 三行） | **本批**（已落） |
| `thincoder-desktop/renderer/views/statusline.mjs` | **256 ⇒ 269**（实读 2026-09-28——banner 四段 + 状态词两态 + 输入提示三态 + 段闭集 12 ⇒ **16**；越 300 建议线解除：banner 段组已拆出〔下行〕） | **本批（状态栏对齐）** |
| `thincoder-desktop/renderer/views/statusline-banner.mjs`（新） | — ⇒ **25**（实读 2026-09-28——`BANNER_CODES` + `bannerSegments`；拆后两档皆 ≤300） | **本批（状态栏对齐）· 拆档落形** |
| `thincoder-desktop/renderer/views/chrome.mjs` · `thincoder-desktop/renderer/i18n.mjs` · `thincoder-desktop/renderer/events.mjs` · `thincoder-desktop/renderer/mount-status.mjs` · `thincoder-desktop/renderer/mount-pool.mjs` · `thincoder-desktop/renderer/store.mjs` | chrome **163 ⇒ 164**（会话头回三值——`FIELD_ORDER` 撤两键）· i18n **407 ⇒ 423**（词键 +6〔两语同形〕——两座后合计；实读 2026-09-28）· events **473 ⇒ 494**（`META_FIELDS` 三键 + `flags` 切片写 + `applyFlags` 纯动作导出〔页读 / 出站回执两径同点——桌内翻转即时刷新面〕）· mount-status **24 ⇒ 26**（`STATUS_KEYS` 增键）· mount-pool **57 ⇒ 60**（`submitVerdict` 成功径以回执写 `flags` 切片）· store **328 ⇒ 333**（`sessionFlags` 初形；账本槽位同笔） | **本批（状态栏对齐）** |
| `thincoder-desktop/src/main/ipc.mjs` · `thincoder-desktop/src/main/agent-host.mjs` · `thincoder-desktop/src/main/session-slots.mjs` | ipc **214 ⇒ 221**（`history:page` 转口叠加 `flags`——`approval:respond` 回执直传零改）· agent-host **300 ⇒ 254**（拆分已落——`flagsOf(key)` 活值投影 + `respond` 回执叠加 `{ key, flags }`）· session-slots **180 ⇒ 195**（`slotMeta` 三值收正 + 两座合计增量——实读 2026-09-28） | **本批（状态栏对齐）** |
| `thincoder-desktop/src/main/agent-assemble.mjs`（新） | — ⇒ **95**（实读 2026-09-28——装配面逐字搬运；原路径同名 re-export 保名面） | **本批（状态栏对齐）· 拆档落形** |
| `thincoder-desktop/test/**` | 随动面（`views-statusline` / `views-chrome` / `views-chrome-vocab`〔键数 139 ⇒ 145 ⇒ **320**〕/ `views-head` / `history-page` / `session-contract` / `agent-host`〔`respond` 回执两向〕/ `events-page`〔`submitVerdict` 写切片两向〕/ `events-reduce` / `host-floor` 原址补例 + 集成新档 `thincoder-desktop/test/integration/statusline-align.test.mjs`（**T-DSK39**））——随 2026-09-28 测试树全清重置不在册（单元 = 单元测试档）+ `thincoder-desktop/test/files.mjs` **22 ⇒ 22**（净 0——**现盘 3**〔随 2026-09-28 测试树全清重置；实读 2026-09-29〕）；测试档随修随加——不占设计条目（沿 §7 D21 注既裁） | **本批（状态栏对齐）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `docs/desktop/design/UI.md` · `docs/desktop/design/IPC.md` | UI.md §1 增**本批注（状态栏对齐 · 屏面为准）** + 15 段表就地收正 + 会话头 / 状态栏两行指针；IPC.md §2 `history:page` 行补 `flags` + `meta` 三值收正 + 增**「模式位投影注」** | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） · `docs/desktop/design/E2E-TESTING.md` | 本档随动（§2 **KD-25 收正 + KD-30** · §6.1 **D22 行** + 表头 · §7 **T-DSK39** · §10 **AS / AT**）；E2E-TESTING.md §4 / §6 补 `statusline-align` 用例行 | **本批**（已落） |
| `thincoder-desktop/src/main/sessions.mjs` | **37 ⇒ 45**（实读 2026-09-28——回执增 `ledger` 投影；异常才携；经端壳转口引核 `ledgerHealth`，零算法副本） | **本批（账本警示面）** |
| `thincoder-desktop/src/main/session-slots.mjs` | **180 ⇒ 195**（两座合计——状态栏 wiring `slotFlags` + 本座核出口 `ledgerHealth` 转口一行；实读 2026-09-28） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/views/session-control.mjs` | **225**（R13-B 拆分产——账本注记迁位：下拉首行 + `sessionModel` 携 `ledger` 字段 + 条件附句合成） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/app.mjs` | **253 ⇒ 254**（实读 2026-09-28——`SESSION_KEYS` 含 `ledger`；切片变即重挂） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/session-list.css`（承批；越线档结构轮后自 `chrome.css` 迁出——原述 `styles.css` 行） | 账本警示注记单规则 **`.session-ledger-notice`**（`padding: 6px 10px` · `opacity: 0.7`——实读 2026-09-29 现值；落点 `session-list.css:93`） | **本批（账本警示面）· 修正轮 2 按盘收正** |
| `thincoder-desktop/renderer/i18n.mjs` | **407 ⇒ 423**（两座合计；本座 = 键 `rail.ledger.notice` 两语各一行；实读 2026-09-28——键增协调 = §10 **AW** 收口依据） | **本批（账本警示面）** |
| `thincoder-desktop/test/session-contract.test.mjs`（随 2026-09-28 测试树全清重置不在册） | —（单元 = 单元测试档） | **本批（账本警示面）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/views.test.mjs` | **217 ⇒ 242**（实读 2026-09-28——原址补例：注记构树三例：在场〔含 `empty` 态〕/ 缺席零节点 / 非可点） | **本批（账本警示面）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/integration/ledger-notice.test.mjs`（集成域） | — ⇒ **121**（实读 2026-09-28——**T-DSK40**：真 Electron 账本警示面；损坏现场档夹具 ⇒ 注记在场 + PNG） | **本批（账本警示面）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/files.mjs` | **22 ⇒ 22**（新集成档名打包入既有行——净 0）——**现盘 3**（随 2026-09-28 测试树全清重置；实读 2026-09-29） | **本批（账本警示面）** |
| 随动四档（表外披露——落而必报） | `thincoder-desktop/renderer/mount-sessions.mjs` **197**（净 0——`refreshRail` 同行加 `ledger` 写）· `thincoder-desktop/test/views-chrome-vocab.test.mjs` **320**（+4——键数门 145 ⇒ 146 + 注记树入消费面）· `thincoder-desktop/renderer/store.mjs` **333**（+2——`ledger` 槽位注册）· `thincoder-desktop/test/store.test.mjs` **339**（+2——初态定形锁同拍） | **本批（账本警示面）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `docs/desktop/design/IPC.md` · `docs/desktop/design/UI.md` · `docs/desktop/design/E2E-TESTING.md` · `docs/desktop/design/PROJECT.md`（本档） | 四档落点（回执 / 渲染 / 用例 / 行数账——明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2 微轮块） | **本批**（已落） |
| `styles.css` | **463 ⇒ ≈481**（容器 4（:93-102）· 骨架线 3 处（:111-117 / :128-132 / :349-357）· 控件族（:296-306 / :395-405 / :407-415 / :418-425 / :435-441）· 活动标签（:368 就地改 + 1 新行）· `.rail-control` hover 收齐（:199-202）· 滚动条 4 规则 + 交互态组（新增 · 全局段）；越 300 在册——拆档窗口 = §10 **AL**） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/chat.css` | **300 ⇒ ≈310**（`.composer` 顶线（:261-268）· 回填 / 药丸（:97-104 / :106-118）· 三控件（:282-291）· hover 收齐（:119-123 / :293-298）· 交互态组（新增）；**超 300 建议线**（< 500 硬限）⇒ 预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 未落 · 排末 · 零搬移 · 本批不落）） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/pool.css` | **78 ⇒ ≈84**（`.pool-toggle`（:28-45）· `.pool-item`（:57-65）+ 交互态组） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/settings.css` | **273 ⇒ ≈289**（面头线（:44-51）· 键 8（:60-86）· 警示面（:105-117）· 行（:141-157）· 强调标（:159-165）· 表单（:173-180）+ 升底 / 活动态 / 交互态组——设置面映射 9 面） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/test/views-locks.test.mjs` | **280 ⇒ ≈320**（D24 值落点锁原址补例——四族归零 ∧ 四值族 ∧ 滚动条 4 规则 ∧ 设置面映射 ∧ 保留面负向锁 ∧ 零新变量；测试档随修随加——不占设计条目〔2026-09-27 裁定〕） | **本批（外壳视觉降噪）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | **176 ⇒ ≈212**（真机读数原址补例——静息四边透明 ∧ 1px 保位 ∥ hover 底非透明 ∥ `:focus-visible` outline 2px ∥ 活动标签底 ∥ 滚动条占宽 10 ∥ 核件面板输入行 `#input-row` 保留面） | **本批（外壳视觉降噪）**  （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| `docs/desktop/design/UI.md` | 外壳视觉降噪批落定（§1 增「本批注（外壳视觉降噪 · D24）」九项 + 标签条 / 会话头 / 输入区 / 设置面 / 主题五行行内指针 + 档头需求侧行 **D1–D23 ⇒ D1–D24** + 变更记录一行） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§4.1 触碰段 + §4.2 本批行 · §6.1 **D24 行** + 表头 · §10 **AX** 行 + **AN** 行随收 · 变更记录一行） | **本批**（已落） |

**本批（对齐第二批 · 六件）行「现行 ⇒ 预期」**（实读 2026-09-28——内容行数口径；机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」；核面 = `docs/render-core/design/RENDER-CORE.md`）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/agent-bridge.mjs` | **174 ⇒ ≈205**（`ev:subchunk` 四面分流——text / think / 工具调用行 / 工具输出行 ⇒ 出站；构造面同形 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:172-191`） | **本批** |
| `thincoder-desktop/renderer/events.mjs` | **494 ⇒ 硬限 500 顶格**（本批增量 = `ev:subchunk` 归约（`rows`）+ 归档入流（`region` + `blocks` 尾追）− `archiveFrozen`）**⇒ 在册拆分预案本批执行**——页读径（`applyPage` / `blockOfMessage` / `seedPatch` / `metaOf`）拆 `thincoder-desktop/renderer/page-read.mjs`（**已落** · 实读 **132**）⇒ 拆后 ≈380（仍越 300 ⇒ 续期 + 新预案 = 子 agent 归约径拆 `renderer/subagent-reduce.mjs`） | **本批** |
| `thincoder-desktop/renderer/store.mjs` | **333 ⇒ ≈300**（`pending` 切片 + 三动作带键 + 满队按键判；在册预案 = 队列面拆 `thincoder-desktop/renderer/queue.mjs`（**已落** · 实读 **41**）——**本批执行**） | **本批** |
| `thincoder-desktop/renderer/mount-composer.mjs` | **362 ⇒ ≈380**（带键入队 / flush 携键 / 出泡携 `ts`；越 300 在册——预案 = 发送面拆 `composer-send.mjs`（**已落** · 实读 **70**）——拆档 = 结构改动，归父侧裁〔沿 §10 **AD** 先例〕） | **本批** |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **69 ⇒ ≈75**（回合尾窄口携 `key`——`onTurnTail(key)`） | **本批** |
| `thincoder-desktop/renderer/views/chat.mjs` | **280 ⇒ ≈310**（尾组槽 + 标签后处理 + `subagent` 块引调；越 300 建议线 ⇒ 预案 = 帧尾态刷拆 `thincoder-desktop/renderer/views/chat-chrome.mjs`（**已落** · 实读 **297**）） | **本批** |
| `thincoder-desktop/renderer/views/activity.mjs` | **248 ⇒ ≈300**（键控差分 + 核件直消费 + 停止钮读锚；预案 = 核件挂载面拆出——超线则执行 · 档名实施批定） | **本批** |
| `thincoder-desktop/renderer/views/chat-text.mjs` | **73 ⇒ ≈95**（推理画笔分流 `paintReasoningTarget` + 用户块 `.msg-label` 容器 + 标签后处理） | **本批** |
| `thincoder-desktop/renderer/views/statusline.mjs` | **269 ⇒ ≈272**（段 14 源改**本会话队**——`pending[<会话键>]`） | **本批** |
| `thincoder-desktop/renderer/i18n.mjs` | **423 ⇒ ≈470**（核件词键 +~12 × 2 语 + `setStrings` 接线（注册单点 = `thincoder-desktop/renderer/app.mjs`——修复轮）；越 300 在册——预案续期〔词族按视图面拆第二档〕） | **本批** |
| `thincoder-desktop/renderer/app.mjs` | **254 ⇒ ≈259**（`CHAT_KEYS` 增 `pending` + 修复轮：`/rc/` 导入 + `setStringsSink(setStrings)` 注册 ≈ +2） | **本批** |
| `thincoder-desktop/renderer/mount-pool.mjs` | **60 ⇒ ≈75**（⏹ 点击委托 ⇒ `subagent:stop`） | **本批** |
| `thincoder-desktop/renderer/chat.css` | **300 ⇒ ≈325**（D24 后 ≈310 起算——待发送气泡 + `.msg-label` / `.msg-time`（值源 = `thincoder-vscode/webview/chat.css:3-18`）+ `.block-subagent` 透传壳；超 300 建议线 ⇒ 在册预案续期〔`chrome-denoise.css`〕） | **本批** |
| `thincoder-desktop/renderer/core.css` | **259 ⇒ ≈300**（核类名映射 `advisor-block` / `sub-*` 族——值源 = `thincoder-vscode/webview/chat.css:298-374` / `:328-371`） | **本批** |
| `styles.css` | **466 ⇒ ≈468**（`--pool-w: 18rem ⇒ 36rem` 一行 + 注释；越 300 在册——拆档窗口 = §10 **AL**） | **本批** |
| 新档 **2**（功能档）+ 拆分产出 **2** | 功能档 = `thincoder-desktop/renderer/views/chat-pending.mjs`（**已落** · 实读 **69**（2026-09-29）——带面构树（输入区上方带——非流内））· `thincoder-desktop/renderer/views/chat-subagent.mjs`（**已落** · 实读 **75**（2026-09-29）——归档块构树）；拆分产出（本批执行）= `thincoder-desktop/renderer/page-read.mjs`（≈120）· `thincoder-desktop/renderer/queue.mjs`（≈45）——见上两行 | **本批** |
| 测试面 | 原址补例：`store` / `views` / `views-chat` / `views-chat-text` / `views-activity` / `views-chrome` / `views-statusline` / `views-locks` / `agent-bridge-subagent` / `events-subagent` / `events-reduce`；真机读数 = 集成域现有档原址补例（D16 义务）——测试档随修随加（2026-09-27 裁定） | **本批** |
| `docs/desktop/design/{UI,PROJECT,IPC,RENDERER}.md` + `docs/render-core/design/RENDER-CORE.md` | 本批设计落定（UI 本批注六件 · 本档 KD / §4.2 / §6.1 / §10 · IPC `ev:subchunk` · RENDERER 块六型与尾组 · 核档 §4 / §5 / §9 / §10） | **本批**（已落） |

**（桌面空闲唤醒批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**本批（对齐第三批 · 小修族 25 + 相抵 2）行「现行 ⇒ 预期」**（实读 2026-09-28——内容行数口径；机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」；KD-37–39 = 本档 §2）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/agent-bridge.mjs` | **210 ⇒ ≈228**（`onToolResult` 判据改核 `!isToolFailure` · 核 `onPermissionRequired` 四参缝（`owner` / `diff`）· `onSubagentApproval` 接缝（approval patch）· `onSubTurnBreak` ⇒ `turnBreak`（#628 窄义改挂） · `onToolCall` 携 `round` / `model`（advisor 轮次标签）） | 本批 |
| `thincoder-desktop/src/main/suspensions.mjs` | **113 ⇒ ≈118**（`ev:approval` 载荷增 `owner` / `diff` 两键（核 `onPermissionRequired` 四参缝载荷面——`askSingle` / `askBatch` 出站形随动）） | 本批 |
| `thincoder-desktop/src/main/agent-host.mjs` | **285 ⇒ ≈290**（advisor 只读采样面注入（`_advisorRound` / `provider.model`）· `ev:error` 携 `techInfo`（`err.stack`）；**台账行出站不在此档**——落 `project-info.mjs` 行〔开项目成功链持有面〕） | 本批 |
| `thincoder-desktop/src/main/file-links.mjs`（**已落** · 实读 **63**） | — ⇒ **≈60**（`extractFileLinks(cwd, text)` 同源实现——路径 token + 盘上存在闸 + 去重 + 封顶；零 electron ⇒ 平 node 直测） | 本批 |
| `thincoder-desktop/src/main/project-info.mjs` | **49 ⇒ ≈75**（台账行产直取核 `runLedgerScan`——`{ text, warn }` 行集供 `ev:ledger`；**触发 = 开项目成功链一次**——`project:open` 处理体调用 ⇒ 出站（开项目成功链持有面；UI.md 项 12 同源）） | 本批 |
| `thincoder-desktop/src/main/ipc.mjs` · `src/preload/preload.cjs` | ipc **225 ⇒ ≈235**（`file:open` 转口 + `shell.openPath` 出口 · `project:open` 成功支挂台账行出站调用）· preload **59 ⇒ ≈61**（请求白名单 **28 ⇒ 29**（`file:open`）· `EVENT_CHANNELS` **13 ⇒ 14**（`ev:ledger`——空闲唤醒批两通道落地时 15）） | 本批 |
| `thincoder-desktop/src/main/session-actions.mjs` | **68 ⇒ ≈76**（`session:delete` 末项门——拒 `last-session`） | 本批 |
| `thincoder-desktop/renderer/events.mjs` | **350 ⇒ ≈378**（`interrupted` 清扫 · `stopMark` 切片 + 清点 · `turnBreak` 游标 · `ev:error` 携 `techInfo` · `ev:ledger` 归约 · `APPROVAL_KEYS` 增 `owner` / `diff`） | 本批 |
| `thincoder-desktop/renderer/subagent-reduce.mjs` | **138 ⇒ ≈142**（`SUB_STATUS` 增 `approval` · `SUB_KEYS` 增 `tool`） | 本批 |
| `thincoder-desktop/renderer/page-read.mjs` | **103 ⇒ ≈104**（`blockOfMessage` 序 = `[reasoning, assistant, …tools]`） | 本批 |
| `thincoder-desktop/renderer/mount-composer.mjs` | **372 ⇒ ≈392**（回底并笔 · 非栅格提示行 · 发送失败提示行 · 中断键两态（`composerModel` 增 `busy`）） | 本批 |
| `thincoder-desktop/renderer/mount-cards.mjs` | **150 ⇒ ≈165**（Enter 键径 + 聚焦两态） | 本批 |
| `thincoder-desktop/renderer/attach.mjs` | **147 ⇒ ≈162**（粘贴即拒栅格四型之外 + 提示行构树） | 本批 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | **142 ⇒ ≈168**（摘要段 / `round` 段 / `interrupted` 词 / 运行期展开 / 结果区链接着装） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | **341 ⇒ ≈362**（错误横幅（详情 + 重试）· 停止痕组 · 台账行组 · 置焦执行；**越 300 在册** ⇒ 预案 = 帧尾态刷拆 `thincoder-desktop/renderer/views/chat-chrome.mjs`（**已落** · 实读 **297**）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）〔本批触碰 ⇒ 执行 ∕ 续期归父侧裁〕） | 本批 |
| `thincoder-desktop/renderer/views/chat-guide.mjs` | **55 ⇒ ≈75**（`no-message` 欢迎条三行） | 本批 |
| `thincoder-desktop/renderer/views/approval.mjs` | **155 ⇒ ≈178**（owner 段 · diff 节点） | 本批 |
| `thincoder-desktop/renderer/views/question.mjs` | **107 ⇒ ≈115**（Enter 键径描述符） | 本批 |
| `thincoder-desktop/renderer/views/chrome.mjs` | **165 ⇒ ≈176**（忙态门——`busy` 入模型 + `pickNode`） | 本批 |
| `thincoder-desktop/renderer/views/sessions.mjs` | **302 ⇒ ≈306**（末项删除门——行控件在场判据；越 300 在册——注记构树外提案在） | 本批 |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **291 ⇒ ≈312**（agent 段：三控型 + 具名控件十 + 泛化兜底行；**越 300 在册** ⇒ 预案 = agent 段拆分出档（拟新增 · 未落 · 档名实施批定）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）〔本批触碰 ⇒ 执行 ∕ 续期归父侧裁〕） | 本批 |
| `thincoder-desktop/renderer/mount-settings.mjs` | **427 ⇒ ≈452**（agent 段写路：即改即存 + 出值规范化 + Esc 关闭） | 本批 |
| `mount-head.mjs` | **148 ⇒ ≈155**（忙态入口拒写） | 本批 |
| `thincoder-desktop/renderer/mount-pool.mjs` · `renderer/app.mjs` | mount-pool **90 ⇒ ≈92**（拍体句柄出）· app **262 ⇒ ≈285**（**2s 拍单点**（首个渲染面定时器）+ 清点 · `onRetry` 句柄 · `file:open` 点击委托注册点） | 本批 |
| `thincoder-desktop/renderer/i18n.mjs` · `renderer/i18n-views.mjs`（**已落** · 实读 **282**（2026-09-29）） | i18n **470 ⇒ ≈475**（合并式一行〔import + 两语展开〕——**本批落拆：新增词族出第二档**）· i18n-views — ⇒ **≈50**（词键 ≈18 × 2 语——`tool.interrupted` / `error.retry` / `welcome.*` 四 / `composer.send.failed` / `paste.unsupportedFormat` / 设置面具名十 / 提示一；**按视图面分组**；合并点 = `initDict` 装配（单一装配点）；**硬限 500 消解** = 两档 ≪500；实施轮以盘面实读计，不以计数为门） | 本批 |
| `thincoder-desktop/renderer/chat.css` · `core.css` · `styles.css` | chat.css **364 ⇒ ≈398**（工具头三态色 · 错误横幅 / 详情 · 停止痕 · 台账行 · diff 预览 · 文件链接）· core.css **336 ⇒ ≈350**（`ledger-line` / `.warn` / `.file-link` 核类名映射；**越 300 在册** ⇒ 预案 = 核类名映射按面拆第二档（拟新增 · 未落 · 档名实施批定）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）〔本批触碰 ⇒ 执行 ∕ 续期归父侧裁〕）· styles.css **493 ⇒ ≈499**（diff 三变量 × 亮暗两套 = +6〔单变量两套两行〕；距 500 硬限 1 行 ⇒ **越 500 须先拆档**（预案 = §10 **AL**）；实施实读越 500 ⇒ 停手上抛） | 本批 |
| 测试面 | 原址补例：`views-chat` / `views` / `store` / `views-chrome` / `views-chrome-vocab`（键数链随动） / `views-question` / `events-reduce` / `views-statusline` / `agent-host` / `views-chat-text` / `views-activity` / `views-settings` / `settings` / `agent-bridge-subagent` / `events-subagent` / `events-page` / `session-contract` / `views-attach` / `views-locks` / `host-floor`（`fresh` 臂随动） + 新档 `thincoder-desktop/test/file-links.test.mjs`（**已落** · 实读 **78** · 验存链平 node 直测）+ 集成域新档 `thincoder-desktop/test/integration/align3-face.test.mjs`（**已落** · 实读 **209** · **T-DSK42 / T-DSK43**）+ `thincoder-desktop/test/files.mjs` 登记行；**测试档随修随加——不占设计条目**（2026-09-27 裁定） | 本批 |
| `docs/desktop/design/{UI,PROJECT,IPC,E2E-TESTING}.md` | 本批设计落定（UI 本批注（对齐第三批）· 本档 KD-37–39 / §4.2 / §6.1 / §7 / §10 · IPC `ev:ledger` / `file:open` / 五处载荷增键 · E2E 两用例行） | 本批（已落） |
| `thincoder-desktop/renderer/search.mjs`（R6 补登） | **26**（实读 2026-09-29——内容行数口径；端壳 = `/rc/search.mjs` 直取 + `[data-slot="flow"]` 根绑定；Ctrl+F 键位注册随核件工厂） | R6（补登） |

**（timer-wake 阶段 2 批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（会话标题接线批块——迁出）** → 见 `docs/desktop/design/SESSIONS.md` §3.2（批块行；as-of 2026-10-02）。

**（复制面对齐 VSC 批块——迁出）** → 见 `docs/desktop/design/CHAT.md` §3.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（子 agent 块跟滚 · #518 批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（挂起窗径批 ∥ 窗队列批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §3.2（批块「实读落值」行；as-of 2026-10-02）。

**（队列取项边缘收正批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §3.2（批块「实读落值」行；as-of 2026-10-02）。

**本批（桌面残余族清账批 · 2026-09-29）行「实际落值」**（实读 2026-09-29——内容行数口径；两舱落值 = `docs/batches/2026-09-29-desktop-residuals-sweep.md` §5 波 A ∕ 波 B 改动表——机制 ∕ 判据单源 = 同档 §2）：

| 文件 | 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/menu-words.mjs`（新档）· `thincoder-desktop/src/main/window.mjs` | **30** ∕ **223**（#533 维护面词表 + `buildMenu` 词面接线——zh = 语义直译值 ∕ en = 回归面现值） | 本批 |
| `thincoder-desktop/renderer/theme.css` · `thincoder-desktop/renderer/views/statusline-banner.mjs` · `thincoder-desktop/src/main/agent-host.mjs` | **89** ∕ **25** ∕ **260**（#534 亮色值收正；#535 码面两处坐标收正） | 本批 |
| `thincoder-desktop/renderer/i18n-views.mjs` · `thincoder-desktop/renderer/mount-sessions.mjs` | **288** ∕ **406**（#556 增键 `session.renameFailed` ×2 语 + 失败两径 toast） | 本批 |
| `thincoder-desktop/src/main/suspension-drive.mjs` · `thincoder-desktop/renderer/events-wake.mjs` · `thincoder-desktop/renderer/subagent-reduce.mjs` | **326**（#554① 出窗帧 `interrupted` 恒在场；后两档相邻注释同笔） | 本批 |
| `thincoder-desktop/renderer/views/goal.mjs` · `thincoder-desktop/renderer/views/statusline.mjs` · `thincoder-desktop/renderer/mount-cards.mjs` | **63** ∕ **172** ∕ **157**（#554② 目标卡本地开合——默认合 + 点击面接线） | 本批 |
| `thincoder-desktop/renderer/chrome.css` | **445**（#554② `cursor: pointer` 一笔——越表披露在案） | 本批 |
| `thincoder-vscode/src/agent/setup.mjs` · `thincoder-vscode/src/extension/panel-callbacks.mjs` · `thincoder-vscode/src/extension/panel-subagent-relay.mjs` · `thincoder-render-core/subblocks/block.mjs` | VSC 三档（#555 五处注释坐标——结构不变）· 核档 **71**（#563① 监听集 + `scroll`——三事件） | 本批 |
| 测试面 | 单元测试档三档 = `docs/batches/2026-09-29-desktop-residuals-sweep-wave-a.test.mjs` ∕ `-waveB.test.mjs` ∕ `-533-zh.test.mjs`（候选终位 ∕ 并入 = 父侧处置）；仓套件不写 ∕ 不改 ∕ 不跑（全清令） | 本批 |
| `docs/desktop/design/{PROJECT,UI,SHELL,RENDERER,IPC}.md` | 本批设计面落定（冻结五档解冻后落：本波——#540 余锚 ∕ #535 冻结 5 处 ∕ #548 ∕ #550 ∕ #551 残余 ∕ #518③ + 口径句 ∕ chrome.css 案 ∕ menu-words 登记 ∕ #563② 登记） | 本波（eng-designer） |

**（模型菜单全渠批块——迁出）** → 见 `docs/desktop/design/SETTINGS.md` §3.2（批块「实读落值」行 + 测试面句；as-of 2026-10-02）。

**（子 agent 块跟滚让位修复批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（更新纪律收核批块——迁出）** → 见 `docs/desktop/design/RENDERER.md` §5.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（parity-b10-ui 批块——迁出）** → 见 `docs/desktop/design/SETTINGS.md` §3.2（批块「实读落值」行；as-of 2026-10-02）。

**（越线档结构轮批块——迁出）** → 见 `docs/desktop/design/SESSIONS.md` §3.2（拆分落形批块行；as-of 2026-10-02）。

**（性能尾账批块——迁出）** → 见 `docs/desktop/design/RENDERER.md` §5.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（i18n 拆分批块——迁出）** → 见 `docs/desktop/design/UI.md` §4.2（批块「实读落值」行；as-of 2026-10-02）。

**本批（desktop-rebuild-fidelity · 重建保真 ∕ 留端清算族 · 2026-09-29 · 台账 #604–#608 + #581）行「现行 ⇒ 实读落值」**（实读 2026-09-29——内容行数口径；机制 ∕ 判据单源 = 批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2；**已实施（2026-09-29 收口）——行值按 RF 批 §5 实读重钉**；跨批避让在册）：

| 文件 | 现行 ⇒ 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/renderer/view-state.mjs` | — ⇒ **290**（快照族：`captureView` ∕ `restoreView`——滚位 ∕ 草稿 ∕ 焦点；#652 后 299——见下行） | 本批 |
| `thincoder-desktop/renderer/mount-settings.mjs` | 153 ⇒ **172**（`paintSettings` 单闸两树——捕获 ∕ 复填；`thincoder-desktop/renderer/views/settings.mjs` ∕ `thincoder-desktop/renderer/views/onboarding.mjs` 零改） | 本批 |
| `thincoder-desktop/renderer/views/settings-controls.mjs` | 131 ⇒ **134**（标记面四组：`fieldPair` + 自定形 `name` + 两 `select` + `active` 复选） | 本批 |
| `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | 179 ⇒ **183**（表单字段组标记） | 本批 |
| `thincoder-desktop/renderer/views/settings-sections-tools.mjs` | 162 ⇒ **163**（工具 key 输入标记） | 本批 |
| `thincoder-desktop/renderer/views/settings-sections-env.mjs` | 135 ⇒ **137**（env shell 输入标记） | 本批 |
| `thincoder-desktop/renderer/mount-sessions.mjs` | 407 ⇒ **299**（条目键控差分 + 快照；**跨批避让兑现**——`structure-split-round` 拆分先落 ⇒ 届盘重钉 **299**） | 本批 |
| `thincoder-desktop/renderer/views/session-control.mjs` | 225 ⇒ **235**（差分辅助 ∕ 条目构建） | 本批 |
| `thincoder-desktop/renderer/views/chrome.mjs` | 199 ⇒ **252**（会话头就地更新） | 本批 |
| `thincoder-desktop/renderer/views/activity.mjs` | ≈154 ⇒ **181**（两族差分） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | 284 ⇒ **299**（重挂径位 ∕ 展开集复填） | 本批 |
| `thincoder-desktop/renderer/views/chat-subagent.mjs` | ≈78 ⇒ **100**（展开集协作） | 本批 |
| `thincoder-desktop/renderer/composer-sync.mjs` | 283 ⇒ **297**（提示带签名门） | 本批 |
| `thincoder-desktop/renderer/views/activity-new.mjs` | ≈109 ⇒ **112**（改工厂消费） | 本批 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | ≈103 ⇒ **110**（改工厂消费 ∕ 再出口保名） | 本批 |
| `thincoder-desktop/renderer/views/pool-subagents.mjs` | ≈127 ⇒ **130**（说明行旗标——零码改） | 本批 |
| `thincoder-desktop/renderer/views/statusline-segments.mjs` | ≈225 ⇒ ≈228（`enterSegment` 判据扩四路） | 本批 |
| `thincoder-desktop/renderer/views/statusline.mjs` | 205 ⇒ ≈208（装配传 `suspend`；零新切片） | 本批 |
| 核 `thincoder-render-core/scroll.mjs` | — ⇒ **122**（滚动策略族四件——判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记） | 本批 |
| 核 `thincoder-render-core/subblocks/block.mjs` | 121 ⇒ **114**（改薄包 + `NEAR_BOTTOM_PX` 再出口保名；出口钮自持面保留） | 本批 |
| 核 `thincoder-render-core/subblocks/state.mjs` | **330** ⇒ 零码改（档头留端句收正 ×2——痕迹给由 ∕ 端复位面） | 本批 |
| VSC `thincoder-vscode/webview/ui.js` | 221 ⇒ **222**（四函数改工厂调用——旗标宿主 `ctx`；零行为变更） | 本批 |
| 测试 ∕ 探针面 | 批内件两族（已落）= `docs/batches/2026-09-29-desktop-rebuild-fidelity.{test,probe}.mjs`（M-604 a–c ∕ M-606 a–c ∕ M-607 a–c ∕ M-608 a–c ∕ M-581 + 真机 P1–P9）；仓套件不写 ∕ 不改 ∕ 不跑（全清令） | 本批 |
| `docs/render-core/design/RENDER-CORE.md` + `docs/desktop/design/{RENDERER,UI,PROJECT}.md` + `docs/vsc/design/WEBVIEW.md` | 本批设计档随动（U2 全波共同门——五档已落 ∕ 核两档档头随代码波） | 本批（已落） |

**本批（desktop-carryover · 桌面收尾族 · 2026-09-29 · 台账 #406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660）行「现行 ⇒ 实读落值」**（实读 2026-09-29——内容行数口径；机制 ∕ 判据单源 = 批档 `docs/batches/2026-09-29-desktop-carryover.md` §2；**三舱实施完成（#659+#652 ∥ #660 ∥ #656）——本块按现盘实读回填**；
  三舱文件集互斥——同档 §2.9；`thincoder-desktop/src/main/turn-driver.mjs` 行终值 ∥ 越层段除名 ∥ 越层段计数已由 structure-split-2 收口轮统一回填（2026-09-29——**252** ∥ 除名 ∥ **十一档**；随动至实读 2026-09-30 = **十四档**（#747 落盘后随动）——单源 = §4.1 越层段））：

| 文件 | 现行 ⇒ 实读落值（构成） | 批 |
|---|---|---|
| `thincoder-desktop/renderer/views/session-control.mjs` | **235 ⇒ 238**（#659 形内判源一处——改名形 `Enter` ∕ `Space` 让行；结构不变） | #659 |
| `thincoder-desktop/renderer/mount-settings.mjs` | **172 ⇒ 184**（#652 `paintSettings` 失效集注入 ∕ 捕获后过滤 + 残件并合同滤） | #652 |
| `thincoder-desktop/renderer/mount-settings-exits.mjs` | **224 ⇒ 227**（#652 `invalidateDrafts` 注入 + 两形提交成功径声明缝） | #652 |
| `thincoder-desktop/renderer/mount-settings-segments-providers.mjs` | **138 ⇒ 147**（#652 钥存 ∕ 两形提交 ∕ 取消径三处声明——取消径 = 评审轮 1 🟡#1 采纳随修） | #652 |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **300 ⇒ 302**（#652 渠道钥编辑行补 `[data-draft]` 标记——属性级；**已越线 ⇒ 入越层段**——预案 = 段体续拆 · 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）） | #652 |
| `thincoder-desktop/renderer/views/settings-controls.mjs` | **134 ⇒ 137**（#652 两形 `data-draft-scope` 作用域取值面——失效集按作用域键控的瞄准面；**在列五档外第六档**〔舱 1 实施披露 · 父侧补登记〕） | #652 |
| `thincoder-desktop/renderer/view-state.mjs` | **290 ⇒ 299**（#652 失效集相消过滤纯函数 `dropDrafts`；RF 落形后实读） | #652 |
| `thincoder-desktop/renderer/views/activity.mjs` | **181 ⇒ 194**（#660 门撤 `blocks > 0` 一判 + 弃账收窄 + `adoptPool` 空族支；未越 300；实增超估 = 档注预算） | #660 |
| `thincoder-desktop/renderer/views/pool-subagents.mjs` | **130 ⇒ 132**（#660 空族守卫——调用面 ∥ 池件防御两案并落〔实施定形〕） | #660 |
| `thincoder-desktop/src/main/turn-driver.mjs` | **310 ⇒ 347 ⇒ 252**（#656 入口预检 + cap 态登记 + `interrupt` 回执第三 reason——落笔后 **347**；structure-split-2 拆后 **252**（msg 双通道族 ⇒ `thincoder-desktop/src/main/turn-input.mjs` **120**）；实读 2026-09-29 · ≤300 回线内） | #656 ∥ structure-split-2 |
| `thincoder-desktop/src/main/turn-face.mjs` | **165 ⇒ 173**（#656 注入面 + 注面——原估「净减」实为 +8） | #656 |
| `thincoder-desktop/renderer/composer-wire.mjs` | **242 ⇒ 254**（#656 `queue-full` 可见形单点消费缝 + 文本回注调用） | #656 |
| `thincoder-desktop/renderer/mount-composer.mjs` | **244 ⇒ 261**（#656 回注缝 `slotFullNotice`——toast 词键复用 + 文本回注（空框直置 ∕ 非空尾并换行）；实施轮定形） | #656 |
| `thincoder-desktop/src/main/queued-input.mjs` | **78 ⇒ 90 ⇒ 78**（#656 **越声明（父侧授权）**——摘回原语 ∥ 幂等 + 档头注；**#769 删面回 78**） | #656 |
| `thincoder-desktop/src/main/ipc.mjs` | **330 ⇒ 331**（#656 **越声明（父裁「纯注释、零行为」）**——`msg:interrupt` 文档注补第三 reason `queue-full`；函数体零改） | #656 |
| 核 `thincoder-render-core/flow/live-md.mjs` ∕ `thincoder-render-core/flow/live-scan.mjs`（#649 诊断分支候选——届盘定形） | **179 ∕ 351 ⇒ 命中分支才增量**（`live-scan` **越 300**——件出批给由在册〔`docs/batches/2026-09-29-perf-residuals.md` §5〕；本轮只增量、结构不变——拆分窗口 = 下次结构性触碰的批） | #649 |
| `docs/batches/2026-09-29-perf-residuals.probe.mjs`（扩 R-7d 腿） | 现状 **361** ⇒ ≈380（探针扩面——批件随批） | #649 |
| `docs/render-core/design/RENDER-CORE.md` | §7 C10 行（阈值收正提案——父侧裁后落；不裁即零改） | #649 |
| 测试 ∕ 探针面 | 批内件三档 = `docs/batches/2026-09-29-desktop-carryover-{c1,c2,c3}.test.mjs`（**661 ∕ 313 ∕ 257**——舱 1 9 测 ∕ 舱 2 6 测 ∕ 舱 3 6 测）+ 探针件 `docs/batches/2026-09-29-desktop-carryover-P10.probe.mjs`（**228**——#660 真机两腿 23 判全 true · `verdict:true`）+ 读数档 `docs/batches/2026-09-29-desktop-carryover-P10-readings.json`（23 判自述）+ #649 探针扩 R-7d（下个性能面轮）；仓套件不写 ∕ 不改 ∕ 不跑（全清令） | 三舱 |
| 零实施面 | #406（判②已落——零文件；建议核销）· #649 产品码（诊断先行——实施 = 下个性能面轮） | — |
| `docs/desktop/design/{PROJECT,UI}.md` | 本批设计落定（KD-47 ⑤ ∕ KD-52 + 本块；UI §1 输入区第三面 + 会话控制面让行句） | 本批（已落） |

**（撤会话头 + 工具头色批块——迁出）** → 见 `docs/desktop/design/UI.md` §4.2（批块「现行 ⇒ 实读落值」行；as-of 2026-10-02）。

**本批（口子清零二轮 · #673 · 2026-09-29）行「现行 ⇒ 实读落值」**（实读 2026-09-30——内容行数口径；**已实施（2026-09-29——E10 方向裁已落）——行值按现盘实读回填**；机制 ∕ 判据单源 = `docs/batches/2026-09-29-hatch-clearance-2.md` §2）：

| # | 档 | 现行 ⇒ 实读落值 | 面 |
|---|---|---|---|
| 1 | 核 `thincoder-render-core/flow/queued-mark.mjs` | **103 ⇒ 105**（`planBusyQueued` 补「本批新建泡」匹配——已落） | 同文重项（§2.1 行 2） |
| 2 | 核 `thincoder-render-core/subblocks/activity-view.mjs` | **200 ⇒ 205**（`CANCELABLE_ROLES` = 六员 ∪ consult ∕ escalate——停钮族集；`FAMILY_ROLES` 本体零改——已落） | R3③（§2.1 行 6） |
| 3 | `thincoder-desktop/renderer/core.css` | **299 ⇒ 332**（面 20 段覆盖——推理内代码块同形消；**越 300 ⇒ 拆分预案 = 推理盒族出档 `renderer/core-reasoning.css`（拟新增）· 消解窗口 = 下个结构性触碰的批**） | D21②（§2.1 行 3） |
| 4 | `thincoder-desktop/renderer/core-markdown.css` | **191 ⇒ 190**（容器臂收窄 `> :last-child` ⇒ `p:last-child` 单条） | §2.7 行 4 |
| 5 | `thincoder-desktop/src/main/providers.mjs` | **300 ⇒ 315**（S3 `failure` 键贯链 `:105-107` 邻域；**越 300 ⇒ 拆分预案 = 验证 ∕ 探针族出档 `src/main/provider-verify.mjs`（拟新增）· 消解窗口 = 下个结构性触碰的批**） | S3（§2.1 行 6） |
| 6 | `thincoder-desktop/src/main/loop-sampler.mjs` | **（拟新增 · ≈45）⇒ 77**（实读 2026-09-30——port 源 = VSC `src/extension/loop-sampler.mjs:67-76`） | S3① |
| 7 | `thincoder-desktop/src/main/agent-host.mjs` | **262 ⇒ 277**（`ev:usage` 帧门判据修点——实读 2026-09-30） | N1① |
| 8 | `thincoder-desktop/src/main/agent-assemble.mjs` | **32 ⇒ 102**（MCP 合入 `toolsFinalize` 缝体 + `attachManifest` 附着——落点级设计 = 批档 §2.8⑥） | §1.9-1∕2 |
| 9 | `thincoder-desktop/src/main/turn-driver.mjs` | **252 ⇒ 252**（validateProvider 回执面——差 ⇒ 桌面补引导形；零行差） | §1.9-3 |
| 10 | `thincoder-desktop/renderer/i18n-settings.mjs` | **137 ⇒ 141**（S3 词键 +1 × 两语） | S3③ |
| 11 | `thincoder-desktop/renderer/views/chat-scroll.mjs` ∥ VSC `thincoder-vscode/webview/ui.js` | **109 ⇒ 112** ∥ **222 ⇒ 222**（E10 常量落点——方向裁后单点改） | E10（§2.1 行 1） |
| 12 | VSC `thincoder-vscode/webview/session.css` | **215 ⇒ 223**（两钮 `:focus-visible { opacity: 1 }` 两臂——实读 2026-09-30） | E-④（§2.1 行 4） |
| 13 | `thincoder-desktop/src/main/ipc.mjs` | **331 ⇒ 265**（#673 零触——延后序 #667；后续 = 桌面残债批 #685 拆档落形） | §2.7 行 1 ∕ §1.8 |
| 14 | 文档面（`UI.md` ∕ `PROJECT.md` ∕ `RENDER-CORE.md` + `IPC.md` S3 载荷两处） | 本批设计落定（已落——收正 §2.3 + 修正轮 §2.8） | 全批 |
| 15 | 测试 ∕ 探针面 | 批内件 = `docs/batches/2026-09-29-hatch-clearance-2.test.mjs`（**实读 325 行**——已落终位）；仓套件不写 ∕ 不改 ∕ 不跑（全清令） | 全批 |
**（桌面堆取证修复批块——迁出）** → 见 `docs/desktop/design/SHELL.md` §5.2（批块「现行 ⇒ 实读」行；as-of 2026-10-02）。


**（桌面 MCP 装配批块——迁出）** → 见 `docs/desktop/design/SHELL.md` §5.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**本批（桌面残债清付 · #685 ∕ #686 ∕ #671 ∕ #679 ∕ #683 ∕ #687 ∕ #692 · 2026-09-30）行「现行 ⇒ 实读落值」**（实读 2026-09-30——内容行数口径；**码面实施完成（2026-09-30 · 批档 §5）——本块按现盘实读回填**；机制 ∕ 判据单源 = `docs/batches/2026-09-30-desktop-residuals.md` §2；批内件不计线 = KD-4）：

| # | 档 | 现行 ⇒ 实读落值（构成） | 项 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/ipc.mjs` | **331 ⇒ 265**（转口群 24 项出档 `ipc-relays.mjs` + #686 拒绝面接线） | #685 ∕ #686 |
| 2 | `thincoder-desktop/src/main/ipc-relays.mjs`（新档） | — ⇒ **70**（24 纯转口 + `liveAgents` 单向取用——零环） | #685 |
| 3 | `thincoder-desktop/src/main/ipc-registry.mjs` | **86 ⇒ 89**（import 拆两源；`HANDLERS` ∕ 注册序 ∕ 白名单零改） | #685 |
| 4 | `thincoder-desktop/src/main/project-info.mjs` | **181 ⇒ 181**（两注句随动——Δ0） | #686 |
| 5 | `thincoder-desktop/renderer/mount-settings-reads.mjs` | **189 ⇒ 192**（#671 读面三写并持） | #671 |
| 6 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | **356 ⇒ 364**（#679 三径声明 + 删钥同族随修；越 300 属在册——行级小修 ⇒ 消解窗口顺延） | #679 |
| 7 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **227 ⇒ 227**（`invalidateDrafts` 注入补传——Δ0） | #679 |
| 8 | `thincoder-desktop/renderer/views/settings-sections-tools.mjs` | **163 ⇒ 163**（作用域面 `tools:<kind>`——Δ0） | #679 |
| 9 | `thincoder-desktop/renderer/views/settings-sections-env.mjs` | **137 ⇒ 137**（作用域面 `env:shell`——Δ0） | #679 |
| 10 | `thincoder-desktop/renderer/views/chat-chrome.mjs` | **213 ⇒ 215**（#689① 注面收正） | #689① |
| 11 | `thincoder-desktop/renderer/views/chat.mjs` | **299 ⇒ 299**（#689② 注面收正——零行差） | #689② |
| 12 | `docs/batches/2026-09-30-desktop-residuals.test.mjs`（批内件） | — ⇒ **468**（实读；M-671 ∕ M-679 ∕ M-685 ∕ M-686 腿——**批内件不计线（KD-4）**） | 全批 |
| 13 | `docs/batches/2026-09-29-desktop-ledger-emit-fix.test.mjs` | **149 ⇒ 149**（R1 替身 Promise 形——Δ0） | #686 |
| 13a | `docs/batches/2026-09-29-model-menu-parity.test.mjs` | **300 ⇒ 302**（处理体在场检查拆两源——条件改动已定形） | #685 |
| 13b | `docs/batches/2026-09-29-enddiff-clearance.test.mjs` | — ⇒ **456**（真 import 面零破——复跑 11/11 绿） | #685 |
| 14 | 档面档（本档 + `docs/desktop/design/IPC.md` ∕ `SHELL.md`） | 本批设计落定（§4.1 行随动 + 本块 + 越层段除名 + §10 CO③ 补录 + 变更记录；IPC 档头计数 ∕ SHELL 树节点同拍） | #683 ∕ #687 ∕ #692 + 随动 |
| 15 | 越表披露（1 项） | `docs/core/design/API-CONTRACT.md` 生成区机械重生（M-685e——生成器唯一笔 ∕ 零人工语义；2695 条 · 604 档） | #685 |

**（消化面留档批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 实读落值」行 + 值列口径句；as-of 2026-10-02）。

**（桌面重启自动重开批块——迁出）** → 见 `docs/desktop/design/SESSIONS.md` §3.2（批块行 + 值列口径句；as-of 2026-10-02）。

**（排版统一批块——迁出）** → 见 `docs/desktop/design/UI.md` §4.2（批块「现行 ⇒ 预期」行 + 值列口径句；as-of 2026-10-02）。

**（消化回流归位批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（三端消化面统一批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 实读（实施落盘）」行 + 零触面句；as-of 2026-10-02）。

**（右栏宽度拖动批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（窗口重启最大化批块——迁出）** → 见 `docs/desktop/design/SHELL.md` §5.2（批块行 + 零触面句；as-of 2026-10-02）。

**（块到达时点归位批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（主题切换批块——迁出）** → 见 `docs/desktop/design/UI.md` §4.2（批块「现行 ⇒ 预期」行；as-of 2026-10-02）。

**（消化行只留当轮收正批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（web 快筛批块——迁出）** → 见 `docs/desktop/design/WEB-QUICKCHECK.md` §9.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（桌面 slash 命令批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §3.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（桌面 slash 命令 · `/help` 增量批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §3.2（批块「现行 ⇒ 实读（实施落盘 · 父侧回填）」行 + 零触面句；as-of 2026-10-02）。

**（桌面消化痕彻底拆批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 实读（实施落盘 · 父侧回填）」行 + 零触面句；as-of 2026-10-02）。

**（桌面流面对账面重写批块——迁出）** → 见 `docs/desktop/design/RENDERER.md` §5.2（批块「现行 ⇒ 实读（实施落盘 · 父侧回填）」行 + 零触面句；as-of 2026-10-02）。

**（消化行自然形收正批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 实读（实施落盘）」行 + 零触面句；as-of 2026-10-02）。

**（消化重放口径批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 实读（实施落盘）」行；as-of 2026-10-02）。

**本批（桌面二择裁定批 · 2026-10-01 · 台账 #780 ∥ #782 · 批 `docs/batches/2026-10-01-desktop-pair-decisions.md`）行「现行 ⇒ 实读（实施落盘）」**
（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2；**实施轮同笔**）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/badges.mjs` | **30 ⇒ 41**（+11）（增共享谓词 `hasPendingFor`（「本键任一族尚有项」——两清径同引）+ 首条 import 边（→ `subagent-reduce.mjs` `poolOf`——单向无环）+ 注面） | 位标面 |
| 2 | `thincoder-desktop/renderer/events.mjs` | **269 ⇒ 271**（+2）（`clearApproval` 清位判据过共享谓词（跨族零误清两向同闭）+ 注面） | 归约面 |
| 3 | `thincoder-desktop/renderer/questions.mjs` | **44 ⇒ 47**（+3）（`clearQuestion` 清位判据过共享谓词（清码 = 两族皆清）+ 注面） | 归约面 |
| 4 | `thincoder-desktop/src/main/turn-face.mjs` | **194 ⇒ 196**（+2）（cap 腿门增 `!revokedTurn(key, agent)`——帧 ∥ 记录同抑制；`return "stopped"` 零改） | 宿主面 |
| 5 | `thincoder-desktop/src/main/turn-driver.mjs` | **236 ⇒ 236**（净 0）（④ 句形 `end`/`cap`——「四查位」计数不变） | 宿主面 |
| 6 | 批内件 | `docs/batches/2026-10-01-desktop-pair-decisions.test.mjs`（**已建成 · 193 行 · 7/7 绿**——七腿 = M1–M4 ∥ N1–N3；随批留存 · 不进仓套件） | 全批 |
| 7 | 设计档 | `docs/desktop/design/UI.md` `:22` 清码判据句 + `:623` 判据新增（+ 坐标族按符号收正）· §2.2 ④ 句形（→ `docs/desktop/design/ACTIVITY.md` §3）∥ T-DSK24 与 §10 O 行引用随动 ∥ §6.1 本批块 ∥ §7 批注 ∥ §10 **DD** ∥ 变更记录 | 全批 |

零触面：核包（`thincoder-core/**`——#782 门为端侧兜底；核侧竞态窗另裁 = §10 DD ②）∥ CLI ∥ VSC ∥ 记录面 ∥ 协议（零新通道 ∕ 载荷零变）∥ `renderer/badges.mjs` 码闭集与 `running`/`done` 两码 ∥ `clearRunning`（#597）∥ 词面（「待审批」同码同词 = 已声明有意形——归需求面另裁 = §10 DD ①）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（首跑渠道提示修复批 · 台账 #840 · 2026-10-03 · 批 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md`）行「现行 ⇒ 实读（实施落盘）」**
（实读 2026-10-03——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2（终读本 = §2 更正块）；**实施轮已落盘（批档 §5）——本块按现盘实读回填**；批内件不计线 = KD-4）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-input.mjs` | **119 ⇒ 141**（+22）（A 真因分类 `providerKindOf`（闭集二值 · 结构判定）+ `send` 回执携 `providerKind`；`reason` 裸码零改） | A 真因透传 |
| 2 | `thincoder-desktop/src/main/providers.mjs` | **315 ⇒ 335**（+20）（B① 保存补写支 + `backfillDefaultModel`（仅缺失 ∥ 既有非空零覆盖 ∥ 排他 `active:true`）——越层在册（续期）） | B 首跑补全 |
| 3 | `thincoder-desktop/src/main/agent-host.mjs` | **298 ⇒ 306**（+8）（C 无效装配不入表 + KD-8 槽装载后复验——**越 300 ⇒ 越层新入册**） | C ∥ KD-8 |
| 4 | `thincoder-desktop/src/main/ipc.mjs` | **276 ⇒ 277**（+1）（`msg:send` 注面随动（`providerKind` 注）） | A 注面 |
| 5 | `thincoder-desktop/renderer/composer-wire.mjs` | **262 ⇒ 266**（+4）（失败载体 `{ reason, kind }`（`providerKind` 透传 ∥ `failure()` 单消费点）；console 行逐字保持） | A 载体面 |
| 6 | `thincoder-desktop/renderer/composer-sync.mjs` | **302 ⇒ 306**（+4）（`providerKind` 类路由（词面-only——`failedNotice` 按类出词）；越层在册（续期）） | A 词路由面 |
| 7 | `thincoder-desktop/renderer/i18n-views.mjs` | **374 ⇒ 380**（+6）（`composer.send.noDefaultModel` 两语键值 + 两语类注；越层在册（续期）） | A 词面 |
| 8 | `thincoder-desktop/renderer/i18n.mjs` | **408 ⇒ 412**（+4）（键数链注续链（`VIEWS_DICT` 137 ⇒ 138 ∥ `HOST_DICT` 312 ⇒ 313）；越层在册（续期）） | A 词面 |
| 9 | `thincoder-desktop/renderer/mount-onboarding.mjs` | **89 ⇒ 95**（+6）（B③ 模型步「采用」接线（`useModel` 注入消费——缺 ⇒ 不落键）+ 注） | B③ 面 |
| 10 | `thincoder-desktop/renderer/mount-settings.mjs` | **249 ⇒ 251**（+2）（B③ `createWizard` 注入 `useModel`（同一引用）） | B③ 注入面 |
| 11 | 测试面（本批） | 批内件 = `docs/batches/2026-10-03-desktop-firstrun-provider-notice.test.mjs`（**已建成 · 433 行 · T1–T7 · 7/7 绿**（父侧核验）——**批内件不计线（KD-4）**；随批留存 · 不进仓套件）；跨批随动 = 两旧批件改钉**转正**（`docs/batches/2026-09-29-send-busy-timing.test.mjs` **325 行 · 13/13 绿** ∥ `docs/batches/2026-09-29-hatch-clearance-2.test.mjs` **327 行 · L10 绿**——存量红两腿（L4 ∥ L7）非本批面） | 全批 |
| 12 | 设计档 | 本档（§4.1 越层段 + §4.2 本块 + 变更记录）· `docs/desktop/design/IPC.md`（§2 ∥ §3.1 值行 ∥ 变更记录）· `docs/desktop/design/COMPOSER.md` ∥ `docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/SHELL.md` ∥ `docs/desktop/design/UI.md`（§X.1 值行 + 变更记录——本回填轮） | 全批 |

零触面：核包（`thincoder-core/**`）∥ CLI ∥ VSC ∥ `thincoder-render-core/**` 零触；词面-only（零新增控件 ∥ `chat-composer.css` 零触）；通道集 ∥ 载荷 ∥ 白名单计数零变；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（渠道档位退役 · 台账 #902 · 2026-10-04 · 批 `docs/batches/2026-10-04-desktop-channel-tier-retire.md`）行「现行 ⇒ 预期」**
（as-of 2026-10-04——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2；**实施落盘后按实读回填（已回填 2026-10-04）**；批内件不计线 = KD-4）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/settings.mjs` | **360 ⇒ 300**（**实施落盘 2026-10-04——实读**；`tierAgent` ∥ `VANISHED` ∥ `hasTier` 支净删 + 载荷顶层有效键闭集收窄（表外 ⇒ `invalid-patch` 零写）） | 写径退役 |
| 2 | `thincoder-desktop/src/main/providers.mjs` | **339 ⇒ 317**（**实施落盘 2026-10-04——实读**；`effortOf` 整件 + 行 `effort` 键 + 四引用（`parseModelRef` ∕ `thinkOffShape` ∕ `specForModel` ∕ `deepEqual`）离导入面） | 读投影退役 |
| 3 | `thincoder-desktop/src/main/settings-values.mjs` | **118 ⇒ 106**（**实施落盘 2026-10-04——实读**；`deepEqual` 随净删——判据面唯一消费 = 退役两面） | 值面随净删 |
| 4 | `thincoder-desktop/renderer/views/settings-sections.mjs` | **169 ⇒ 93**（**实施落盘 2026-10-04——实读**；`tierFace` ∥ `tierOptions` ∥ `acceptTier` ∥ `tierRowNode` ∥ `EFFORT_NONE` 净删；`modelBody` ⇒ 当前读数 + 候选两段） | 控件整行退役 |
| 5 | `thincoder-desktop/renderer/views/settings.mjs` | **399 ⇒ 398**（**实施落盘 2026-10-04——实读**；`tierFace` 导入面 + `tier:` 装配键去） | 装配面去 |
| 6 | `thincoder-desktop/renderer/mount-settings-exits.mjs` | **270 ⇒ 254**（**实施落盘 2026-10-04——实读**；`setTier` 出口 + `onTier` 接线净删） | 出口退役 |
| 7 | `thincoder-desktop/renderer/mount-settings-reads.mjs` | **204 ⇒ 204（±0）**（**实施落盘 2026-10-04——实读**；两处注释随正——`{ models:false }` 复读理由改述渠行面） | 注随正 |
| 8 | `thincoder-desktop/renderer/i18n-settings.mjs` | **156 ⇒ 150**（**实施落盘 2026-10-04——实读**——经泛化批 156 ⇒ 152 + 本批 152 ⇒ 150；键面 **62 ⇒ 59**——泛化批 ⇒ 60 + 本批 −`settings.model.tier` ⇒ 59；档头键数注随正） | 词面 |
| 9 | `thincoder-desktop/renderer/i18n.mjs` | **415 ⇒ 413**（**实施落盘 2026-10-04——实读**——链尾 312 ⇒ 309）（`effort.auto` ∥ `effort.off` 两语删 + `effort.*` 档头注收正） | 词面 |
| 10 | 测试面（本批） | 批内件 `docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs`（**已落 · ~189 行**——退役六腿（先红 **2/6** ⇒ 后绿 **8/8**）；随批留存 · 不进仓套件 · 批内件不计线 = KD-4） | 全批 |
| 11 | 设计档 | 本档（§2 两行 + §4.2 本块 + §7 行删 + §9 句收 + 变更记录）· `docs/desktop/design/COMPOSER.md` §1 KD-18 + §4 D6 + 变更记录 · `docs/desktop/design/IPC.md` §2 两行 + 设置族注项 9 删 + 变更记录 · `docs/desktop/design/SETTINGS.md` §2.1 ∥ §2.2 ∥ §2.7 删 ∥ §2.9 ∥ §3.1 四行 ∥ §5 行删 + 变更记录 · `docs/desktop/design/UI.md` §1 批 B 注 + 变更记录 · `docs/desktop/design/MENU.md` ∥ `docs/desktop/design/PACKAGING.md` ∥ `docs/desktop/design/RENDERER.md` 段名收正（U1）+ 变更记录 | 全批 |

零触面：核包（`thincoder-core/**`）∥ CLI ∥ VSC ∥ `thincoder-render-core/**` ∥ 会话级档位族（输入区控件行 ∥ `session:prefs` ∥ 槽 `effort` ∥ `model:list` 逐模型投影）∥ advisor effort 族 ∥ 通道集 ∥ 白名单计数；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**本批（消化账务 · 台账 #930 · 2026-10-05 · 批 `docs/batches/2026-10-05-digest-accounting.md`）行「现行 ⇒ 实读（实施落盘）」**
（as-of 2026-10-05——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = 批档 §2 ∥ 核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31；批内件不计线 = KD-4）：

| # | 档 | 现行 ⇒ 实读（实施落盘） | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/src/main/turn-face.mjs` | **200 ⇒ 206**（+6；`emitDigestEnd` 携 `unsettled`——非上行轮且 > 0 才携（帧 ∥ 记录同源同点）；判据单源 = 核 `unsettledCount`） | 边界帧 ∥ 记录载荷 |
| 2 | `thincoder-desktop/renderer/events-wake.mjs` | **102 ⇒ 104**（+2；`onDigest` end 归一 `unsettled` 入轮记录——复列直复用同源） | 归约面 |
| 3 | `thincoder-desktop/renderer/views/chat-digest-rows.mjs` | **273 ⇒ 288**（+15；残余行（锚 `data-digest-residue`——`digest.residue` 核字典直取；`= 0` ⇒ 零行）+ 行型闭集 +1） | 行族构树 |
| 4 | `thincoder-desktop/renderer/page-read.mjs` | **281 ⇒ 285**（+4；折叠轮投影携 `unsettled`——复列承接（设计表外随落补入）；`= 0` / 缺 ⇒ 零行） | 页读折叠 |
| 5 | 测试面（本批） | 批内件 `docs/batches/2026-10-05-digest-accounting-desktop.test.mjs`（**已建成 · 134 行 · DSK-1–DSK-6 · 6/6 绿**）；同批端腿三件（CLI **169 行** · VSC **178 行**）——随批留存 · 不进仓套件 · 批内件不计线 = KD-4 | 全批 |
| 6 | 设计档 | `docs/desktop/design/RENDERER.md` §1.1 ∥ `docs/desktop/design/IPC.md` §1（设计轮已落——本批随落 = 本档 §4.2 行数账） | 全批 |

零触面：核包（`thincoder-core/**`）∥ CLI ∥ VSC ∥ `thincoder-render-core/**` 零触；通道集 ∥ 既有载荷字段 ∥ 白名单计数零变（`ev:digest` 增字段）；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**（timer 唤醒投递批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §4.2（批块「现行 ⇒ 预期」行 + 零触面句；as-of 2026-10-02）。

**（桌面打包发布批块——迁出）** → 见 `docs/desktop/design/PACKAGING.md` §3.2（批块「现行 ⇒ 实读（实施落盘）」行 + 零触面句；as-of 2026-10-02）。

**（菜单体系批块——迁出）** → 见 `docs/desktop/design/MENU.md` §3.2（批块「现行 ⇒ 实读（实施落盘）」行 + 零触面句；as-of 2026-10-02）。

**（设置面样式收正批块——迁出）** → 见 `docs/desktop/design/SETTINGS.md` §3.2（批块「现行 ⇒ 实读（实施落盘）」行 + 零触面句；as-of 2026-10-02）。

## 6. 验收判据回指需求

### 6.1 功能点 D1–D41

（**D35 设计面 = `docs/desktop/design/ACTIVITY.md` §2「本批注（右栏池极多实例可滚动 · D35）」**（2026-10-02 建——实读结论 ∥ 复现判据两腿 ∥ 候选映射 ∥ 收口规则）；实现形随复现收口（台账 #801）。）

| 需求 | 机检判据（点回需求卷） | 验证面 |
|---|---|---|
| D1 | → `docs/desktop/design/SESSIONS.md` §4（as-of 2026-10-02） | — |
| D2 | → `docs/desktop/design/SESSIONS.md` §4（as-of 2026-10-02） | — |
| D3 | → `docs/desktop/design/CHAT.md` §4（as-of 2026-10-02） | — |
| D4 | → `docs/desktop/design/ACTIVITY.md` §5（as-of 2026-10-02） | — |
| D5 | → `docs/desktop/design/CHAT.md` §4（as-of 2026-10-02） | — |
| D6 | → `docs/desktop/design/COMPOSER.md` §4（as-of 2026-10-02） | — |
| D7 | → `docs/desktop/design/SETTINGS.md` §4（as-of 2026-10-02） | — |
| D8 | → `docs/desktop/design/SETTINGS.md` §4（as-of 2026-10-02） | — |
| D9 | → `docs/desktop/design/SETTINGS.md` §4（as-of 2026-10-02） | — |
| D10 | **台账读数与批次相位读数出现**（项目级信息，不随会话走——批 9 落：`ledger:read` / `batch:status` 载荷不携会话 `key`；用例面 = 随批单元证据；**流尾行组退役批（2026-10-04）口径随正——台账可见载体 = 状态行段 11 常驻标记 ∥ tooltip（行面去）**） | T-DSK11 |
| D11 | → `docs/desktop/design/SETTINGS.md` §4（as-of 2026-10-02） | — |
| D12 | → `docs/desktop/design/PACKAGING.md` §4（as-of 2026-10-02） | — |
| D13 | → `docs/desktop/design/COMPOSER.md` §4（as-of 2026-10-02） | — |
| D14 | 真 Electron 启停 + 交互驱动 + 固定落点截图（批 E2E 落 = T-DSK27；单入口 · 每用例隔离临时家 · devDep `playwright-core`——单源 = `docs/desktop/design/E2E-TESTING.md` §3.3 / §6） | T-DSK27 / T-DSK32 |
| **D15**（§3.1:52 · 需求 §3.5 项 7） | 状态栏上下文占用读数（活动会话 · 回合尾更新）：`ev:usage` 有效读数 ⇒ 读数节点在场；未至 / 非正数 ⇒ 零节点（禁假造）——KD-20 | T-DSK29 |
| D16 | → `docs/desktop/design/SETTINGS.md` §4（as-of 2026-10-02） | — |
| **D17**（需求卷 D17） | 状态行对齐 CLI：**17 段逐项裁定表**在册（2026-09-28 屏面为准重审后——承载 17 / 旁置 1 / 不适用 1 行；零静默省略）；承载段逐段有节点判据与数据源（承载四项〔耗时 / 令牌 / 计时 / 回合 N/M〕**已落（R3a）**——读数槽四住 `thincoder-desktop/renderer/events.mjs`）；未至 / 非正 ⇒ 零节点（禁假造）——KD-25 / KD-30；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 + 「本批注（状态栏对齐 · 屏面为准）」 | T-DSK33 / T-DSK38 |
| D18 | → `docs/desktop/design/SESSIONS.md` §4（as-of 2026-10-02） | — |
| D19 | → `docs/desktop/design/CHAT.md` §4（as-of 2026-10-02） | — |
| D20 | → `docs/desktop/design/ACTIVITY.md` §5（as-of 2026-10-02） | — |
| **D21**（需求卷 D21） | 会话流**内容面** + **会话面板**（桌面会话控制面）视觉对齐 VSC：内容面 **21 面** / 会话面板面 **9 面** **逐面映射表在册**（VSC 实值带 `file:line` × 桌面落法——单源 = `docs/render-core/design/RENDER-CORE.md` §5 ∥ `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2）；**结构零动**（外壳 / 主题体系 / 左列 + 标签条结构不改）；端差 **3** 项已全部处置（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`——核档 §9 同拍）；值面落点 = `thincoder-desktop/renderer/core.css` + 主题表 `thincoder-desktop/renderer/theme.css`（新增变量 **14**）——KD-29 | T-DSK21 / T-DSK37（原址补例） |
| **D22**（需求卷 D22） | 状态栏对齐（屏面为准 · 2026-09-28 走查裁定）：**17 段**逐项裁定表在册（banner 四态承载 / 静息词 / 输入提示段 / 键位尾逐件——单源 = `docs/desktop/design/UI.md` §1「本批注（状态栏对齐 · 屏面为准）」）；四项重审判据句在册；模式位供面 = `history:page` 回执 `flags`（单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」） | T-DSK39 |
| D23 | → `docs/desktop/design/SESSIONS.md` §4（as-of 2026-10-02） | — |
| **D24**（需求卷 D24） | 外壳视觉降噪（对照 mock 选定帧 02-chrome）：**静息描边归零**（容器 3 · 骨架线（现值唯输入区上线——显形保留）· 控件族 3 选择器 · 池条目 1——保位式 `border-color: transparent` ⇒ 零几何位移）+ **交互态显形**（hover / 按下 / 聚焦 + 设置活动行）+ 滚动条皮肤 4 规则 + **设置面映射** 9 面（6 改 + 3 保留）；**保留面负向锁**（两值列——accent 值列 = `.permission-prompt` / `.question-card`；`--line` 值列 = 核件面板输入行 `#input-row` / `.plan-card`；`.block` 消息块壳移出——R12 F1 ① 消除径）+ 零新变量 / 零新依赖 / 零新文件；内容面零动 · 布局与信息层级零动（守 D21 值源）；单源 = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」 | 验收三件：① 静息描边机检锁（随批单元证据）② 真机 hover · 聚焦读数（真机面 = 人工走查 + 父侧真跑闭合）③ 改前 / 改后对照（走查） |
| D25 | → `docs/desktop/design/COMPOSER.md` §4（as-of 2026-10-02） | — |
| D26 | → `docs/desktop/design/SESSIONS.md` §4（as-of 2026-10-02） | — |
| **D27**（需求卷 D27） | 右键编辑菜单（宿主面）：可编辑 ⇒ 剪切 ∕ 复制 ∕ 粘贴 ∕ 全选四件（`enabled` 随 `editFlags`）；非编辑 ∧ 选中 ⇒ 复制 ∕ 全选；非编辑 ∧ 空选 ⇒ 零菜单；文案 = `HOST_DICT` 两语现读（`locale` 现读即随动）——单源 = 本档 §2 **KD-43** ∕ `docs/desktop/design/UI.md` §1「本批注（复制面对齐 VSC · 2026-09-29）」 | T-DSK47 + 两纯函数平 node 直测口径（`context-menu.mjs`——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑）） |

**对齐第三批 · 小修族 25 + 相抵 2 注（验收面 · 2026-09-28）**：需求回指 = D3 / D5 / D6 / **D10** / D13 / D19 **六**行已随注（上表）；机检面 = 随批单元证据（原档随 2026-09-28 测试树全清重置不在册）；
真机面 = **T-DSK42 / T-DSK43**（集成域——用例面随 2026-09-28 测试树全清重置不在册）+ **离线不可产面**（停止痕 / 文件链接 / 子代理门审批卡 / 提问卡键焦 / 忙态两钮可点 / 审批卡真置焦）= 人工走查 + 父侧真跑闭合（D16 义务）；
  逐项「现状 → 对齐形 → 落点 → 判据」单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**（回合中插入批批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 自铸披露句；as-of 2026-10-02）。

**（会话标题接线批批块——迁出）** → 见 `docs/desktop/design/SESSIONS.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**复制面对齐 VSC 批（验收面 · 2026-09-29）**：需求回指 = **D27**「右键编辑菜单」（新增——`docs/desktop/requirements/PROJECT.md:172`）+ **D13**「代码块复制」（收正——`:158`）；设计单源 = 本档 §2 **KD-43**（+ KD-22 收正）∥ `docs/desktop/design/UI.md` §1「本批注（复制面对齐 VSC · 2026-09-29）」；
机检面 = 两纯函数平 node 直测口径（`context-menu.mjs`：三语境条目集 + `editFlags` 启用径 + 两语词值）；**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑）；
**测试件已落 = 单元测试档惯例**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs`——名随批次档 · 住 `docs/batches/` · 不登记 · 随批留存——单源 = `docs/batches/2026-09-28-test-layer-prompts.md` §1.15–§1.23）；
真机面 = **T-DSK47**（D27——菜单弹出 + 剪贴板往返）+ **T-DSK30 收正面**（D13——⧉ 零残留 + 代码块 Copy 钮仍在）；**离线不可产面**（真机右键 ⇒ 原生菜单 ∕ 剪贴板）= 人工走查 + 父侧真跑闭合（D16 义务）。

**（窗队列 VSC 逐点对齐批批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**排版统一批（验收面 · 2026-09-30 · 台账 #736）**：需求回指 = **D29**（排版统一——一种字体 ∥ 一个字号 ∥ 行距字距全一致 ∥ 自有文字零粗体（颜色区分）；markdown = 同基线 + 修饰层，不得自成独立字体/字号体系）；设计单源 = 本档 §2 **KD-57**（值表分处：内容面 = `docs/render-core/design/RENDER-CORE.md` §5「排版统一覆盖」块；外壳面 = `docs/desktop/design/UI.md` §1「本批注（排版统一 · D29）」）；
机检面 = ① **源扫描腿**（平 node · 批内件 `docs/batches/2026-09-30-desktop-typography-unify.test.mjs`——白名单外零绝对值 `font-size` ∥ 白名单外零 `font-weight > 400` ∥ `--font` 指 `--mono` ∥ 三变量在位 ∥ 覆盖段选择器在位）；
② **真机 computed 全栈扫描腿**（`docs/batches/2026-09-30-desktop-typography-unify-probe.mjs`——真 Electron · 亮 ∥ 暗两模式：
   文本元素 `font-size = 14px` ∥ `font-weight ≤ 400` ∥ 族 = mono 栈 ∥ `line-height = 18.2px`（= 14 × 1.3——轻通道轮五 2026-10-01 定版；**`select` 本体除外**——Blink 固定其 computed `normal`，CSS 不可达）∥ `letter-spacing = normal`——修饰白名单除外（白名单与期望值 = 批档 §2）；
真机面 = **T-DSK51**（逐面走查：会话流〔含 md 修饰〕∥ 工具卡 ∥ 状态行 ∥ 池 ∥ 设置 ∥ 向导 ∥ 输入区 ∥ 搜索条 ∥ 模型菜单；亮 ∥ 暗两模式）；**离线不可产面**（真渲染视觉 ∥ 修饰层观感）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**（右栏宽度拖动批批块——迁出）** → 见 `docs/desktop/design/ACTIVITY.md` §5（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**窗口重启最大化批（验收面 · 2026-09-30 · 台账 #745）**：需求回指 = **D31**（重启 ⇒ 打开即最大化——「永远」语义：每次重启都最大化；手动缩小过的情形亦取）；设计单源 = 本档 §2 **KD-59**；
机检面 = 批内件 `docs/batches/2026-09-30-window-maximize.test.mjs`（已建成 · 83 行——三腿：① **启动径含 maximize**（`createWindow` 内 `show: false` → `win.maximize()` → `win.show()` 有序断言 ∥ `show: true` 零残留）
  ② **判由在句**（`win.maximize()` 紧邻注携 `D31` ∥ 「永远」锚）③ **「永远」零记忆负控**（**扫描面 = `window.mjs`**：全档零窗口态符号族 ∥ `maximize` 调用恰 1 处）；随批留存 · 不进仓套件）；
真机面 = **T-DSK53**（两启程：启动即最大化 ∥ 手动缩小 ⇒ 退出 ⇒ 再启动仍最大化；**+ 首帧腿**：「首帧无默认尺寸帧」——`show()` 当刻读 `isMaximized()` ∥ 首帧录屏 ∕ 截图走查（KD-59 ② 推论真机证面））；**离线不可产面**（真窗口最大化 ∥ 系统窗口态）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**主题切换批（验收面 · 2026-09-30 · 台账 #743）**：需求回指 = **D33**（亮 ∥ 暗 ∥ 跟随系统三态切换 + 记住（重启恢复））；设计单源 = 本档 §2 **KD-61** ∥ `docs/desktop/design/UI.md` §1「本批注（主题切换 · D33 · 2026-09-30）」∥ `docs/desktop/design/RENDERER.md` §1.4；
机检面 = 批内件 `docs/batches/2026-09-30-theme-switch.test.mjs`（已建成 · 267 行——六腿：① **存储读回 ∥ 缺省**（假 storage：无值 ∥ `dark` ∥ 表外 ∥ 读抛 ⇒ `system` 降级 + `console.error`）② **落写 ∥ fail-soft**（`setItem` 抛 ⇒ 属性仍落 + `console.error`）③ **表外值拒绝**（`setTheme("blue")` ⇒ `null` + 零写 + 零改 + `console.error`）
  ④ **单写者负控**（**扫描面 ⊇ 属性写径**——`documentElement.dataset.theme` 写径 ∪ `documentElement.setAttribute("data-theme", …)` 形：两形合计写径仅 `theme.mjs` 一处字面）
  ⑤ **CSS 结构**（`theme.css`：零 `prefers-color-scheme` ∥ `light-dark(` 恰 24 ∥ 两枚 `:root[data-theme]` 规则 ∥ 基线四值逐字零动）
  ⑥ **设置面头**（三钮 ∥ 锚 ∥ 当前态恰一 ∥ 缺 handlers ⇒ 三钮 `disabled`——描述符树平 node 直测）；随批留存 · 不进仓套件）；
真机面 = **T-DSK54**（两启程：切暗 ⇒ 重启仍在 ∥ 切亮 ∥ 切回跟随系统；负控 = 未切过家 = `system`）；**离线不可产面**（真重启 ∥ 计算样式 ∥ 视觉）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**桌面二择裁定批（验收面 · 2026-10-01 · 台账 #780 ∥ #782）**：需求回指 = **D4**（跨会话可见面「不静默等待」——提问门位标；本批 = 清码判据收正）+ #782（工艺面——宿主记录腿墓碑查位，无需求点）；设计单源 = `docs/desktop/design/UI.md` §2 项 2（**清码判据 = 两族皆清**——位标面单源）∥ `docs/desktop/design/ACTIVITY.md` §3 中止墓碑段（四查位 ④ = 边界轮 `end`/`cap` 帧 ∥ 记录零写）；
机检面 = 批内件 `docs/batches/2026-10-01-desktop-pair-decisions.test.mjs`（**已建成 · 193 行 · 7/7 绿**——七腿逐条 = §7「桌面二择裁定批注」；随批留存 · 不进仓套件）；
真机面 = **无新面**（#780 = 归约面纯函数 ∥ #782 = 宿主记录腿替身面——平 node 直测即行为面）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**桌面 UX 收尾批（验收面 · 2026-10-02 · 台账 #801 ∥ #702 ∥ #697）**：需求回指 = **D35**（右栏池可滚动——复现先行）+ #702（MCP 警告消费——本档 §2 **KD-70**）+ #697（P1 读数端面——本档 §2 **KD-69**）；设计单源 = 本档 §2 **KD-69** ∥ **KD-70** ∥ `docs/desktop/design/ACTIVITY.md` §2 本批注 ∥ `docs/core/design/MCP.md` §6.4 ∥ `docs/vsc/design/SETTINGS.md` §2.5；
机检面 = 批内件（实施轮建——#801 腿 A 合成（60 块夹具）+ #697 词面/形复跑）+ 源档复跑读数；
真机面 = #801 腿 B（真机活跃风暴——CDP 真滚轮）∥ #702 ∥ #697 上屏面（人工走查）；**离线不可产面**（真滚动 ∥ 真上屏）= 人工走查 + 父侧真跑闭合（D16 义务）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**（桌面打包发布批批块——迁出）** → 见 `docs/desktop/design/PACKAGING.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 官网面 ∥ 离线不可产面句；as-of 2026-10-02）。

**（斜径命令面批批块——迁出）** → 见 `docs/desktop/design/COMPOSER.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**（菜单体系批批块——迁出）** → 见 `docs/desktop/design/MENU.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**（设置面样式收正批批块——迁出）** → 见 `docs/desktop/design/SETTINGS.md` §4（验收面批块——需求回指 ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**（设置菜单升级批批块——迁出）** → 见 `docs/desktop/design/MENU.md` §4（菜单半）∥ `docs/desktop/design/SETTINGS.md` §4（设置半）（验收面批块——需求回指 **D38 ∥ D39** ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

**（桌面发布·阶段二批批块——迁出）** → 见 `docs/desktop/design/PACKAGING.md` §4.3（验收面批块——需求回指 **D40 ∥ D41** ∥ 设计单源 ∥ 机检面 ∥ 真机面 ∥ 离线不可产面句；as-of 2026-10-02）。

### 6.2 验收 A1–A4 与依赖面 P1–P4

| 项 | 本设计与它的关系 |
|---|---|
| A1 | §6.1 每行皆机检判据（用例号登记于 §7） |
| A2 | 三端共享契约零回归：配置 / 会话面全部经核入口（`docs/desktop/design/SHELL.md` §3），端侧只加 `END = "desktop"` 单写者文件（不增跨端共享可变字段——照核 NF1 语义）；`locale`（批 9 首写者）= **端无关偏好键**（任一端写、他端读，非属主型状态 ⇒ 不属本条禁增范围——§2 KD-13） |
| A3 | 三平台 CI 矩阵 = `docs/desktop/design/PACKAGING.md` §2 CI 行；本机 Windows 实跑 + 另两平台 CI——**分期（2026-10-01 D32 阶段令）：阶段一 = 本机 Windows 实跑；另两平台 CI 随阶段二**（同源 = `docs/desktop/design/PACKAGING.md` §2.7「目标（分期）」行） |
| A4 | 核 / CLI / 扩展三包测试零回归：本端**不改核机制语义**、不触另两端源码（批 B 纯加法三处，授权在案——批次档 §1.2 A；`docs/desktop/design/SHELL.md` §3「不改核」行 + §8 边界）；**对齐重定位批例外（在案）**：`thincoder-vscode/webview/**` 接核改造 + 核包新增（净 = 换实现不换行为——`docs/render-core/design/RENDER-CORE.md` §8 / §9）；**残余批**：核只读出口（`docs/core/design/SESSION.md` §6.24）；**留档批例外（在案）**：核 `thincoder-core/history-window.mjs` 记录直通 opt-in（`{ records: true }` ∥ `kindOf` 认 `kind` 键——纯加法一条；默认径逐字等价——负控腿） |
| P1 | 落判 = KD-7（下限取 Electron ≥ 44.x，判据 = 启动自检实测）；**Node 24 专属 API 使用面** = 实施批逐点核（本端新增代码不主动用高于宿主内置版本的 API） |
| P2 | 落定 = §1.2 第 2 条 + KD-3 / KD-4 + `docs/desktop/design/SHELL.md` §1 前端目录形态 + `docs/desktop/design/UI.md` §1 交互决策全落（长会话渲染与回填本批落定——`docs/desktop/design/RENDERER.md` §2 / §3） |
| P3 | 落定 = `docs/desktop/design/SHELL.md` §4（序 + 团队层取值已上提核件；余端差在册） |
| P4 | 落定 = `docs/desktop/design/PACKAGING.md` §2 CI 行（待实施，随 A3） |

### 6.3 批级判据（批次档 §1.6）

| # | 判据 | 落点 |
|---|---|---|
| ① | 四部分落点与命名规则可机检 | `docs/core/design/DOC-SYSTEM.md` §4 部分表 + §8 射程行（本批已落；本档即在 `docs/` 域内被机检覆盖） |
| ② | 本档给出可验证验收 | §6.1 / §6.2 / §7 |
| ③ | 三平台打包链明确形态 | `docs/desktop/design/PACKAGING.md` §2（工具 / 产物 / 验证面 / CI 矩阵） |
| ④ | 与核接口面逐项点名、不改核机制语义（批 B 纯加法三处——授权在案） | `docs/desktop/design/SHELL.md` §3 七面表 + 「不改核」行 |

## 7. 用例表

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK1 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK2 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK3 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK4 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK5 | → `docs/desktop/design/ACTIVITY.md` §6（as-of 2026-10-02） | — | — | — |
| T-DSK6 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK7 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK8 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK9 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK10 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK11 | 正常 · 项目级信息 | 打开有台账 / 批次的目录 | 段 11 台账标记（开项目成功链——核 `marker`）出现；切会话时**不随会话变** |
| T-DSK12 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK13 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK14 | → `docs/desktop/design/PACKAGING.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK15 | 错误 · 宿主下限不满足 | 以低于下限的宿主运行 | 启动自检报错并显式退出（不静默降级、不崩栈） |
| T-DSK16 | 错误 · 渲染面越界 | 渲染面试图 import `node:` 内置或 `@thincoder/core` | 静态闭包守卫测试红（照扩展端守卫先例） |
| T-DSK17 | 边界 · 长会话渲染窗口 | 单会话累计块数 > 150 | DOM 只保留尾部 150 块；更早部分呈「摘要块」且可一键回填；块数有界（不做虚拟化） |
| T-DSK18 | 正常 · 历史回填 | 于流顶附近上滚（scrollTop ≤ 40px） | 取更早一页（页量按核 `historyWindow` 缺省 200 条——条 ≠ 块）且插入后视口不跳（scrollTop 按 scrollHeight 增量修正）；有在途请求时不重入 |
| T-DSK19 | 正常 · 跟滚与药丸 | 先上滚停跟 → 期间到达新块 → 点药丸 | 新块到达时视口不动（停跟）；出现药丸；点击回底并复跟；平滑滚动 420ms 窗内不抢占 |
| T-DSK20 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK21 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK22 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK23 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK24 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK25 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK26 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK27 | 正常 · E2E 设置面（真 Electron） | 空 fixture 家（唯一预置 `<临时家>/.thincoder/config.json` = `{"locale":"en"}`）· 无项目 | boot `ok`；入口在；点按后面板 `open`；段序 `providers,model,agent,mcp,env,tools,models`（七段——R7 终态）；态 `ready,none,ready,ready`（前四段夹具定形；后三段随 E2E 重跑补记）；PNG 落固定落点（存在 + magic）；关闭后 `closed` 且子节点 0；机检面 = 单元测试档惯例（原集成档 `settings-panel.test.mjs` 随 2026-09-28 全清重置退场——重建时按 §4.1 登记）；形态与九步断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.3 / §6 |
| T-DSK28 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK29 | 正常 · 状态栏占用读数 | ① 活动会话跑完一回合（核发有效 `ev:usage`）② 核不发 / `ctxPct` ≤ 0 ③ 切标签 | ① 状态栏读数节点在场且值 = 活动会话读数 ② **零读数节点**（禁假造）③ 随活动键取值换读数（非活动会话读数不串场） |
| T-DSK30 | 正常 · 附件与复制（D13） | ① 输入区粘贴一张图 ⇒ 发送（视觉模型）② 同例换非视觉模型 ③ 清空附件条 ④ 点含围栏代码块内的 Copy 钮 ⑤ 消息块尾 ∕ 输入区尾查控件 | ① 附件条出现缩略图 + 文件名 + 移除控件；`msg:send` 载荷携 `images`（**dataURL 串数组**——A1 收正）；`ok` 真 ⇒ 清条 ② 先落盘 + 降级跑者（parity-b4）：降级成功 ⇒ 用户消息文本携描述注文（`[图片 … 描述: …]`，回执零码）；降级未成（失败 ∥ 落盘 0 件）⇒ 回执携 `degraded:"non-vision"` ⇒ 提示行在场 + 文本尾说明行（不静默丢图）；超限 / 落盘失败项 ⇒ `"partial"` ③ 附件条**零节点** ④ 剪贴板收代码文本逐字（核件 Copy 钮；词两态 `msg.copy` → `msg.copied`；超时自动复位）⑤ **零复制控件**（`chat:copy-block` ∕ `chat:last` 零节点——2026-09-29 收正） |
| T-DSK32 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK33 | 正常 · 状态行十七段（D17） | 活动会话（另有非活动标签）逐态：忙态（含工具在跑）· 任务有项 · `ev:activity` turn（turn ∕ maxTurns）· 有效 `ev:usage`（`ctxPct` + `usage`）· 计时在途 · 台账超阈 · 队列 ≥1 · 位标含 `approval` | 承载 17 段各节点在场且源正确：banner 四态 / 状态词（两态）/ 当前工具 / 耗时 / ✓n/m / turn N/M / 令牌 / context% / 台账超阈位 / ⏰N / 会话标题 / 输入提示段 / 注意力提示；旁置 1 段（滚动位零节点）· 键位组零节点；未至 / 非正数 ⇒ 对应段零节点（禁假造） | 机检面 = 单元测试档惯例（原两档随 2026-09-28 全清重置退场——段集 17 计数锁 ∕ banner 四段两态 ∕ `state` 两态 ∕ `enter` 三态 ∕ 会话头回三值） |
| T-DSK34 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK35 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK36 | → `docs/desktop/design/ACTIVITY.md` §6（as-of 2026-10-02） | — | — | — |
| T-DSK37 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK38 | 正常 · 恢复态播种 + 用户块 md 深度（真 Electron） | 探针式 fixture 家（既有会话槽：`tasks` 2 条在场 · 读数可算）——resume 该会话 | ① resume 后状态行段 6（`tasks`）在场——槽数据直取（非空时）；空 / 缺 ⇒ 零节点 ② 段 9（`context`）在场——打开态读数 `> 0`；未至 / ≤ 0 ⇒ 零节点 ③ 用户块块级构件零节点（围栏 / 标题）∥ assistant 同文本块级在场 | 机检面 = 单元测试档惯例（原集成档 `session-open.test.mjs` 随 2026-09-28 全清重置退场）；用例号自铸披露 = §10 **AP** |
| T-DSK39 | 正常 · 状态栏对齐（真 Electron · 打开态对表） | fixture 家（`{"locale":"en"}` + **另建第二枚临时目录作项目根**（记 `PROJ`）+ 会话槽族档〔`cwd` = `PROJ`；形单源 = 核写面物化形——沿 T-DSK32 夹具先例〕——**两臂**（夹具按可达态）：主臂槽档 = `autoApprove: true` / `advisor: { guard: true }` / `engineering: true` / `planMode: false`（四真不可达——`engineering: true` ⇒ 核恢复点 `clearPlanMode` 令 `planMode` 恒 false，实读 `thincoder-core/session-lifecycle.mjs:126-133`）；第二臂槽档 = `planMode: true` / `engineering: false` + `autoApprove: true` / `advisor: { guard: true }` 同值（另盖 `plan` 点亮）；两臂皆 `tasks` 2 条 + `title` 一条 + 读数可算；清理 = 两枚临时目录） | ① 真点**会话控制面项目钮**（`button.session-project[data-action="project:open"]`——对话框夹具 `PROJ`，照 `docs/desktop/design/E2E-TESTING.md` §3.5 第 6 步；与 T-DSK32 同一产品路）⇒ `openDir` 成功链 ⇒ 自动一次 `session:resume` 开页（点开即续——`docs/desktop/design/IPC.md` §2 项目面注项 3）；主路未开页（续失败）⇒ 备路 = 点会话控制面选择器开下拉 ⇒ 点条目〔`.session-item[data-slot]`——`session:switch` 同一开页尾〕 ② 状态行在场段 ⊆ 16 码闭集 ∧ 相对序 = 闭集序 ∧ 假 / 缺 ⇒ 零节点（**主臂**亮点三段 = `auto` / `advisor` / `eng` 在场 + **`plan` 零节点**（负断言）；**第二臂** = `plan` 在场 + `eng` 零节点；两臂保留在场 = `state` / `tasks` / `context` / `title` / `enter`）③ `state` 段词 = `Ready`（locale = en）④ `enter` 段词 = `Enter: send` ⑤ `tasks` 段词 = `✓0/2` ⑥ 截图 PNG 落 `thincoder-desktop/test/artifacts/statusline-align.png`（父侧 CLI 同刻对照面）；机检面 = 单元测试档惯例（原集成档 `statusline-align.test.mjs` 随 2026-09-28 全清重置退场）；用例号自铸披露 = §10 **AS** |
| T-DSK40 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK42 | → `docs/desktop/design/CHAT.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK43 | 正常 · 小修族（外围面 · 对齐第三批） | fixture 家（同上）——**离线可产断言**：设置面类型加工 / Esc 关闭 · **离线不可产**（真回合面）：审批卡两增量 / 提问卡键焦 / 忙态两钮可点 / 中断键两态 | ① 子代理门审批卡首行含 owner 段（`<owner> · <tool>`）∧ diff 节点在场（`apply_patch` 门——`diff-preview` 类名）——**离线不可产**；② 提问卡填入 ⇒ Enter ⇒ 卡退场 ∧ 回焦 `[data-input="text"]`——**离线不可产**；③ 回合在飞 ⇒ 输入区模型 ∕ 推理钮**可点** ∧ 中断键可点（**非在飞 ⇒ 键隐**——核件两态 = 显 ∕ 隐）——**离线不可产**；④ 设置面 agent 段 = 具名控件 ∧ `change` ⇒ 即改即存（回执后回读同值）——离线可产；⑤ 设置面开 ⇒ `Escape` ⇒ 关闭（`[data-slot="settings"]` 清空）——离线可产（**F-Esc 判据**）；⑥ 审批卡出现即 `document.activeElement` = 卡内 `[data-autofocus="1"]`——**离线不可产**（**F-置焦 判据**）；**离线不可产面 = 人工走查 + 父侧真跑闭合**；机检面 = 单元测试档惯例（原集成档 `align3-face.test.mjs` 随 2026-09-28 全清重置退场——离线可产断言）；用例号自铸披露 = §10 **BG** | ✅ 做（对齐第三批 · 拟新增） |

| T-DSK46 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK47 | 正常 / 边界 · 右键编辑菜单（D27） | 真 Electron：① 流内选中一段文本 ⇒ 右键 ⇒ 点「复制」② 输入框右键（空输入 ∕ 有内容两况）③ 非编辑区空选右键 ④ 输入框粘回验证往返 ⑤ `locale` = zh 重跑 ① | ① 菜单弹出（原生 Menu）且含「复制」项 ⇒ 点按后剪贴板 = 选中文本逐字（**往返** = 粘回输入框可见）② 四件在场（剪切 ∕ 复制 ∕ 粘贴 ∕ 全选；`enabled` 随 `editFlags`——空输入 ⇒ 剪切 ∕ 复制禁用 · 粘贴可用）③ **零菜单**（不弹）④ 往返成立 ⑤ 文案 = zh 四字（`locale` 现读随动）；机检面 = 随批单元证据（`context-menu.mjs` 两纯函数三语境 + 两语词值——**批档本地用例随批留存**（载体 = `docs/batches/2026-09-29-desktop-copy-vsc-align.test.mjs` · 不入仓套件——全清令：仓套件不写 ∕ 不改 ∕ 不跑））；真机面 = 父侧真跑闭合（D16 义务） |
| T-DSK48 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK49 | → `docs/desktop/design/ACTIVITY.md` §6（as-of 2026-10-02） | — | — | — |
| T-DSK50 | → `docs/desktop/design/SESSIONS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK51 | 正常 / 边界 · 排版统一（D29 · 真 Electron） | 真 Electron 启动 ⇒ 逐面走查（对话流〔含 md 修饰：粗体 ∥ 标题 ∥ 代码块 ∥ 引用 ∥ 表格〕· 工具卡 · 状态行 · 活动池 · 设置面 · 首启向导 · 输入区 · 搜索条 · 模型菜单）+ 亮 ∥ 暗两模式切换 | ① 文本元素 computed `font-size` = 14px（轻通道轮五 2026-10-01 定版；修饰白名单除外——白名单与期望值 = 批档 §2）② `font-weight <= 400`（markdown 标记除外：`strong` ∥ `h1–h6` ∥ `th`）③ 全栈族 = mono 栈（`ui-monospace…`）④ `line-height` = 18.2px（= 14 × 1.3——轻通道轮五 2026-10-01 定版；**`select` 本体除外**——Blink 固定其 computed `normal`，CSS 不可达）∧ `letter-spacing` = `normal` ⑤ md 修饰层语义可辨（粗 ∥ 标题 ∥ 码 ∥ 引用 ∥ 表）⑥ 亮 ∥ 暗同值；机检面 = 批内件两档（源扫描 + 真机 computed 扫描——载体 = `docs/batches/2026-09-30-desktop-typography-unify.{test,probe}.mjs`；随批留存 · 不进仓套件——全清令）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = §10 **CV** |
| T-DSK52 | → `docs/desktop/design/ACTIVITY.md` §6（as-of 2026-10-02） | — | — | — |
| T-DSK53 | 正常 · 窗口重启最大化（D31 · 真 Electron · 两启程） | 程 1：正常启动（`npm start` ∥ 打包产物）⇒ 观察窗口态；随后**手动缩小**（取消最大化 ∥ 拖动改尺寸）⇒ 关窗退出；程 2 = 再启动 | ① 程 1 启动后窗口 = **最大化态**（**判据主面 = 目视 ∥ PNG**——目视 = 占满工作区；机读径 = 主进程 `isMaximized()` = true——**载体 = 父侧走查即时读数**（走查当刻读，辅助提示 ∥ 零新增探针档）；**不采 `--smoke` 字段**（给由 = 冒烟字段闭集契约零动——KD-59 ⑤））；② 程 2 启动后**仍最大化**（「永远」语义——零窗口态记忆：手动缩小过的情形亦取）；③ **首帧腿**（KD-59 ② 推论真机证面）= `show()` 当刻 `isMaximized()` = true ∥ 首帧录屏 ∕ 截图无「默认尺寸帧」；④ 全程零 `pageerror`；PNG 落 `thincoder-desktop/test/artifacts/window-maximize.png`；机检面 = 单元测试档惯例（载体 = `docs/batches/2026-09-30-window-maximize.test.mjs`（已建成 · 83 行）——三腿；随批留存 · 不进仓套件）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = §10 **CX** |
| T-DSK54 | 正常 / 边界 · 主题切换（D33 · 真 Electron · 两启程） | 程 1：fixture 家（`{"locale":"en"}`——`isConfigured` = 档存在）⇒ 启动 ⇒ 开设置面 ⇒ 点「Dark」（`[data-slot="settings"] [data-action="settings:theme"][data-theme="dark"]`）⇒ 关窗退出；程 2 = 同一家再启动；负控臂 = 另家（未切过）启动 | ① 点「Dark」后 `document.documentElement.dataset.theme === "dark"` ∧ `getComputedStyle(document.body).backgroundColor` = `rgb(21, 23, 28)`（#15171c）∧ 根 `color-scheme` computed = `dark` ∧ `localStorage["thincoder.desktop.theme"] === "dark"` ∧ 面上「Dark」钮 `data-active` 在场（恰一）；② **程 2 主题在**（重启恢复——`dataset.theme === "dark"` + 同底色读数）；③ 点「Light」⇒ 强制亮（底色 `rgb(247, 248, 250)`）；④ 点「System」⇒ `dataset.theme === "system"` ∧ 底色 = 媒体态值（`matchMedia("(prefers-color-scheme: dark)").matches` 两值对判）；⑤ 负控臂 = `dataset.theme === "system"` ∧ 存储键零写入；⑥ 全程零 `pageerror`；PNG 落 `thincoder-desktop/test/artifacts/theme-switch.png`；机检面 = 单元测试档惯例（载体 = `docs/batches/2026-09-30-theme-switch.test.mjs`（已建成 · 267 行）——六腿；随批留存 · 不进仓套件）；真机面 = 父侧真跑闭合（D16 义务）；用例号自铸披露 = §10 **DB** |
| T-DSK55 | → `docs/desktop/design/PACKAGING.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK56 | → `docs/desktop/design/COMPOSER.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK57 | → `docs/desktop/design/MENU.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK58 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| T-DSK59 | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **T-DSK60** | → `docs/desktop/design/PACKAGING.md` §5（as-of 2026-10-02） | — | — | — |
| **R1** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R2** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R3** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R4** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R5** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R6** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |
| **R7** | → `docs/desktop/design/SETTINGS.md` §5（as-of 2026-10-02） | — | — | — |

**桌面二择裁定批注（验收面 · 2026-10-01 · 台账 #780 ∥ #782）**：需求回指 = **D4**（跨会话可见面「不静默等待」——提问门位标；本批 = 清码判据收正）+ #782（工艺面——宿主记录腿墓碑查位，无需求点）；设计单源 = `docs/desktop/design/UI.md` §2 项 2（清码 = 两族皆清）∥ `docs/desktop/design/ACTIVITY.md` §3 中止墓碑段（四查位 ④ = 边界轮 `end`/`cap` 帧 ∥ 记录零写）；
机检面 = 批内件 `docs/batches/2026-10-01-desktop-pair-decisions.test.mjs`（**已建成 · 193 行** · **7/7 绿**——七腿：#780 M1 同键两族共存 → 清提问 ⇒ 码留 ∥ M2 → 清审批 ⇒ 码留 ∥ M3 单族清 ⇒ 码灭（正控两臂）∥
  M4 起源键 `null` ∥ 跨键 ⇒ 零误写（保位）+ 源面锁；#782 N1 墓碑真 ⇒ 零 cap 帧零记录 ∥ N2 非墓碑 ⇒ cap 帧 ∥ 记录恰一次（正控）∥ N3 timer 轮 ⇒ 零帧零记录（负控）；
  `ContinueError` 同 realpath 取；随批留存 · 不进仓套件）；
真机面 = **无新面**（两案 = 归约面 ∥ 宿主记录腿面——平 node 直测即行为面）；**离线不可产面** = 无。

**消化行自然形收正批注（验收面 · 2026-10-01 · 台账 #768）**：需求回指 = **D4**（挂起态与 digest）+ D28 痕侧（需求侧口径随正 = 主 agent 笔）；
  设计单源 = 本档 §2 **KD-62** ∥ §6.1 D4 行 ∥ `docs/desktop/design/RENDERER.md` §1.1（归约面条 ∥ 流内消化行族条 ∥ 在场 ∥ 出现 ∥ 更新 ∥ 退场条 ∥ 入流与重放规则条 ∥ 根子序句 ∥ 留档记录条）∥ `docs/desktop/design/IPC.md` §1 `ev:digest` 行 ∥ `docs/desktop/design/UI.md` §1 对话流行；
现行口径（自然形收正批定稿 · 2026-10-01 · 台账 #768）= 行族**自然形 · 行出即留**（起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场；零清理机器：无终态标签退场 ∥ 无换代删旧 ∥ 无复列最新一条）∥
  **终态 = 追加一条新行**（锚 `data-digest-end`——不动原 digesting 行；零就地换文）∥
  **模型面 = 全轮累积**（`onDigest` `start` 追加本轮）∥ 归档 = **起跑窗**触发 + 消费轮**族后**落位 —— **随到达入流**（行族在流末时即「放族后」；迟到 ⇒ 随到入流）∥
  **零存储（座次机拆除 · #765 保持）**——行族出生点定格 ∥ 零搬移 ∥ 重挂 = 树面重建（重建轮于其记录位次复列 ∥ 未结轮 = 流末）∥ 行族形态 = **无轮容器** ∥ **cap 行 ∥ 终态行 = 到达序追加**（两径差异在册——#747 形面保持）∥
  **复列 = 全量（未结轮照现）**（记录位次原位——零配对）∥ 记录面全量（三端档照留）；**#746 判句** = 保持（起跑窗兑现；J2 形式附注随翻转覆盖）；**口径 = 批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §1**（用户 07:54 ∥ 07:58 原话逐字——判据即规格）。
**判据载体（机检腿 ∥ 真机闭合面）**：机检面 = 批内件 `docs/batches/2026-10-01-digest-rows-natural-form.test.mjs`（**已建成 · 700 行**（内容行数口径〔文末换行不计〕· as-of 2026-10-01——A1–A3 补丁后）· **8/8 绿**——八腿：
  **① 行出即留**（多轮串行：各行元素恒转续（`parentNode !== null`）∥ 文 ∥ class 逐值不变；换代零摘除）∥ **② 终态追加**（`end` ⇒ 终态行（锚 `data-digest-end`——词 = `digest.done` ∕ `digest.aborted`）追加；原 digesting 行在场且文不变（`digest.start` 逐字）；`n = 0` 轮零计数行）∥ **③ 零就地换文负向锁**（全流程零文本改写已建行 ∥ 零行摘除调用）∥
  **④ 复列全量**（`foldDigest` 多轮产出 + 截断闸 + 末轮无 `end` 不产；`withFoldedDigest` 并入——折叠轮居前 ∥ 现轮集随后（双份消解 = 结构性——零跨侧去重键））∥
  **⑤ 重载复列**（假 DOM 重建径：全轮行组于其记录位次复列（恢复序 ≡ 记录序）∥ 窗下界之外零复列）∥
  **⑥ 帧刷幂等**（同帧双跑（`settleFrame` 步① + `syncChrome`）零增零改 ∥ 重建后采纳径零重建）∥ **⑦ 记录面零动负向锁**（三型轮记录逐条全量出帧不变 ∥ `clearDigest` 未结末轮保逐字）∥
  **⑧ 追加径单式**（`start` ∥ `cap` ∥ `end` 三帧皆于当刻流末落位——锚 = `blockAnchor`（尾组 ∥ 卡 ∥ 药丸之前））；随批留存 · 不进仓套件；**收正面映射（需求 D28 三件——逐件对账）** = 自然形（行出即留）⇒ 腿 ① ∥ 落位 ⇒ 腿 ⑧ ∥ **无闪现 ⇒ 腿 ① + ⑥**（活流零摘除 ∥ 零就地换文 + 帧刷幂等——无「先出后撤 ∥ 双出」类闪现构造））；
  真机面 = **一条**——同场景多轮串行（父侧真跑闭合 · D16）：终态后原「正在消化」行在场 ∥ 新「已消化」行出现（流末）∥ 新轮起跑旧轮行仍在上方（上滚可见）∥ 重载后各轮行组复列（**实施落盘 2026-10-01**——机检八腿 **8/8 绿**；真机面 ⇒ **用户侧观察**——随下次桌面使用自查）；
  **前批件处置在册** = `docs/batches/2026-10-01-desktop-digest-teardown.test.mjs` 腿 1（终态就地换文 ∥ 标签退场 ∥ 换代摘除）∥ 腿 3（折出轮 ≤1）∥ 腿 4 ∥ 腿 6——已退场语义，实施轮处置（改 ∥ 标注）；`docs/batches/2026-10-01-digest-row-current-only.test.mjs`（断代件——已标注勿复跑）保持；**余腿按新口径随实施轮全件复核**。

**块到达时点归位批注（验收面 · 2026-09-30 · 台账 #746）**：需求回指 = 用户 2026-09-30 20:48 判据（**块与轮同刻同邻——绝不长进「别人正在跑的话」里**；源 = 批档 §1）；设计单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8「settle 延迟冻结（两态统一）」条 ∥ 本档 §2 **KD-36** ∥ `docs/desktop/design/RENDERER.md` §1.1 块归档面 ∥ 插入点纪律条；
机检面 = 批内件 `docs/batches/2026-09-30-block-arrival-timing.test.mjs`（已建成——两形腿：**S 不夹运行中回合**（发射器级：非挂起态 settle ⇒ `⟦ev⟧settled`、不发 `⟦ev⟧done`；渲染级：`settled` patch ⇒ `blocks` 零 `kind:"subagent"` 增项 + 等待消化态 `awaitingDigest`）∥ **[块][轮] 对不拆**（消费窗 `done` ⇒ 归档入流、位次居运行中回合块之后；配座次面假 DOM 文档序 [块][行族]）；随批留存 · 不进仓套件）；
真机面 = **一条**——结件于回合运行中 ⇒ 块**待轮**（等待消化——活动区留场、`done · awaiting digestion`）、回合止后随**起跑窗**归档、**居消费轮族末（状态行）之后**；DOM 序 = 无 S 块夹于运行中回合块列内部（父侧真跑闭合——D16 义务）。

**模型菜单全渠批注（验收面 · 2026-09-29）** → 见 `docs/desktop/design/SETTINGS.md` §5（机检面 ∥ 真机面 R1–R7 ∥ 离线不可产面句；as-of 2026-10-02）。

**§7 号序注（会话标题接线批收正）**：
- `T-DSK41` ∕ `T-DSK44` ∕ `T-DSK45` = **无行**（登记 = §10 自铸行 **AX** ∕ **BJ** ∕ **BK**——用例行随测试档修加，不进设计面条目〔2026-09-27 裁定〕）；故 `T-DSK46` 号序不连续系登记口径而非缺行。

**T-DSK3 注**：场景中「重命名 1 个 → 删除 1 个」的**通道面**（机检 = 单元测试档惯例——原 `session-contract.test.mjs` 五通道往返用例随 2026-09-28 全清重置退场）与 **UI 入口**（批 A **已落**——会话控制面下拉条目行内控件，形态单源 = `docs/desktop/design/UI.md` §1 会话控制面行；构树机检 = 单元测试档惯例 · 实机走查 = T-DSK21）分属两面、两层。

**D21 注（视觉对齐 · 值面验收）**：三面 = ① **值落点锁**（`thincoder-desktop/test/views-locks.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——新增变量两模式齐备 · `tk-*` 9 规则在场 · 关键值串；沿 U152 同式）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
② **真机读数**（`thincoder-desktop/test/integration/chat-render.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——真 Electron `getComputedStyle` 读代码块底 / 行内码底 / 表头底 / 关键词色四值；需求 D16 条「改可见面 ⇒ 真 Electron 使用面用例」由本条承担）；③ **人工走查** = 逐面与 VSC 并比（T-DSK21 面）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（内容面 21 面）/ `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2（会话面板 9 面）；**测试档随修随加——不占设计条目**（用户 2026-09-27 裁定）。

**残余批注（D17 / D19 · 验收面 · 2026-09-28）**：机检面 = ① **值落点锁**（`thincoder-desktop/test/history-page.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——seed 三例：`tasks` 直取 / `usage` 有效门 / 回填不携；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
`thincoder-desktop/test/events-page.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——首屏播种：写入 / 缺席零写）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
② **同源对拍**（`thincoder-core/test/session-reading.test.mjs`（实读 **89**；随 2026-09-28 测试树全清重置不在盘）——`sessionReading` × 同 data ⇒ === `applySession` 后同式读数 / 老槽回退 / 边界三组）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
③ **深度对拍**（`thincoder-desktop/test/views-chat-text.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——`user` ⇒ `mdInline` ∥ `assistant` ⇒ `md`）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
④ **真机使用面**（**T-DSK38**——D16 义务：resume 后 `tasks` / `context` 段在场 + md 深度断言；`thincoder-desktop/test/integration/session-open.test.mjs`（实读 **137** · 集成域；随 2026-09-28 测试树全清重置不在盘））；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  ⑤ **时序例**（首屏种 × 在飞键）：本键在飞（回合未尾）⇒ 首屏种零写（活切片为准）——`thincoder-desktop/test/events-page.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例；测试档随修随加——不占设计条目（沿本档 §7 D21 注既裁）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**批 9 注**：T-DSK7 / T-DSK8 / T-DSK10 的机检面 = 单元测试档惯例（原主侧三档 `settings.test.mjs` / `providers.test.mjs` / `mcp-servers.test.mjs` + 视图面 `views-settings.test.mjs`（表单构树与通道接线）——随 2026-09-28 测试树全清重置不在盘）；
T-DSK11 = 单元测试档惯例（原 `project-info.test.mjs`（台账读数与相位两向）同因不在盘）；T-DSK13 = 单元测试档惯例（原 `views-onboarding.test.mjs`（闸两向 + 三步可走完）同因不在盘）；T-DSK9 读数面 = **已落**（R2——`index:status` ∕ `index:build`；单源 = §10 **N** 行）；T-DSK8 的「切换语言」机检 = 单元测试档惯例（原 `settings` 档（键往返）∥ `views-settings` 档（词表重刷）——同因不在盘）。

**批 9 用例号归属（修正轮 #9）**：设置族 `thincoder-desktop/test/settings.test.mjs` = **U98–U102**；渠道族 `thincoder-desktop/test/providers.test.mjs` = **U103–U107**（含 **U107b**）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  MCP 族 `thincoder-desktop/test/mcp-servers.test.mjs` = **U108–U110**；项目级信息族 `thincoder-desktop/test/project-info.test.mjs` = **U111–U113**（U98–U113 全数在册）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  视图面 `thincoder-desktop/test/views-settings.test.mjs` / `views-onboarding.test.mjs` = 零 U 号（档名面入 U51 扫描清单）；所列测试档随 2026-09-28 测试树全清重置不在盘。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**批 B 用例号归属**：本批自铸段 = **U127–U150**——会话级偏好族 `thincoder-desktop/test/session-prefs.test.mjs` = **U127–U131**；用量族 `thincoder-desktop/test/agent-host-usage.test.mjs` = **U132–U137**；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  附件视图族 `thincoder-desktop/test/views-attach.test.mjs` = **U138–U141**；附件落盘族 `thincoder-desktop/test/attachments.test.mjs` = **U142–U145**；档位写径 `thincoder-desktop/test/settings.test.mjs` = **U146**（原址补例）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  会话头与状态栏 `thincoder-desktop/test/views-head.test.mjs` = **U147–U150**（U127–U150 全数在册——所列测试档随 2026-09-28 测试树全清重置不在盘；自铸披露 = 批次档 §5）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**批 B 追加轮用例号归属**：本批自铸段 = **U151**——引导面用例族 `thincoder-desktop/test/views-chat-guide.test.mjs` = **U151**（自铸披露 = 批次档 §2.12 / §5；所列测试档随 2026-09-28 测试树全清重置不在盘）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**批 A 注**：T-DSK22 / T-DSK23 的机检面 = 队列面（**「回合中插入」批收正**——宿主受理 ∕ 步边界注入 ∕ 续发；机检档 = `thincoder-desktop/test/queued-input.test.mjs`（实读 **87**；随 2026-09-28 测试树全清重置不在盘）+ `agent-host.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  与两切片归约（`thincoder-desktop/test/store.test.mjs`（随 2026-09-28 测试树全清重置不在盘）/ `thincoder-desktop/test/events-reduce.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——**含回合终局三径**：错误径清本键 `running` + 位落 `done`〔T-DSK22〕）+ **输入区构树与两态锚**（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  （`thincoder-desktop/test/views-chrome.test.mjs`（随 2026-09-28 测试树全清重置不在盘）原址补例——中区外壳面同档，新词键随入「全量词表键齐」）；实键位（Enter / Shift+Enter 真事件）· **两失败径**（提交失败 ⇒ 文本保留 ∥ 消费失败 ⇒ 留队——判据在 T-DSK22 / T-DSK23）归人工走查（T-DSK21 面）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
T-DSK24 ① 的机检面 = `thincoder-desktop/test/agent-host.test.mjs`（随 2026-09-28 测试树全清重置不在盘；`question:respond` 往返 + 三 reason 不 resolve + **中断径**〔`msg:interrupt` ⇒ `stopped` ⇒ 本键提问项随清——归约面判据〕——原址补例）（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
+ `thincoder-desktop/test/events-reduce.test.mjs`（随 2026-09-28 测试树全清重置不在盘；`stopped` 面清本键 `questions`——原址补例）（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
  + `thincoder-desktop/test/views-question.test.mjs`（随 2026-09-28 测试树全清重置不在盘；卡构树与三出口锚）；② 的机检面 = 同档（`ev:task` 归约 + 卡构树——**事件驱动**：核 `task` 工具在工程模式下机械停用，故不以「真跑出帧」为判据，见 §10 P 行）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
T-DSK25 的机检面 = `thincoder-desktop/test/views-tabbar.test.mjs`（随 2026-09-28 测试树全清重置不在盘；两控件 `tabindex` 两态 + 接线两向：非活动项点按 ⇒ `onActivate` 携本键 + 加速键**纯函数判定**：**键 ∈ 1..9 ∧ 第 N 档存在** ⇒ 第 N 档激活；第 N 档不存在 ∥ 表外键 ⇒ 零动作不吞键）· 加速键真事件面与点按真视觉切换 = 人工走查（T-DSK21 面）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**批 B 注**：T-DSK28 的机检面 = `thincoder-desktop/test/session-prefs.test.mjs`（通道往返 / 键闭集 / 在飞受理（写盘 + 回执携 `meta`）/ 表外档位字面串归一 `null` / 老槽零回填 / 失败径三档：`model-required` / `slot-missing` / `bad-key`）（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
+ `thincoder-desktop/test/settings.test.mjs`（原址补例——`model:list` 回执形两向：元素形 `{ id, effortEnum, thinkOff }` 逐项在场）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
T-DSK29 的机检面 = `thincoder-desktop/test/events-reduce.test.mjs`（原址补例——`ev:usage` 归约：按会话 `key` 写切片 · 未至 / 非正数 ⇒ 零节点）+ `thincoder-desktop/test/views-chrome.test.mjs`（原址补例——读数节点两态 + 会话头三 `select` 与回执刷行）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
T-DSK30 的机检面 = `thincoder-desktop/test/views-attach.test.mjs`（附件条目构树 / 空条零节点 / 两 `degraded` 提示行）；真粘贴事件 · 真剪贴板写 · 真落盘后的图片指针 = 人工走查（T-DSK21 面）；所列测试档随 2026-09-28 测试树全清重置不在盘。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
`host-floor` U95 臂清单随动 = 码面池（批 B 新档三档：`attach.mjs` / `mount-head.mjs` / `mount-onboarding.mjs`——实读面 = §4.1 值列；`chat-copy.mjs` 随复制面对齐批删档；`mount-head.mjs` 随撤会话头批退场〔**删档**〕）；批 B 新档**不越 300**（`attach.mjs` ∕ `mount-onboarding.mjs`——实读 = §4.1 值列单源）。

**桌面空闲唤醒批注（验收面 · 2026-09-28）**：机检面 = ① 驱动族新档 `thincoder-desktop/test/agent-host-suspension.test.mjs`（实读 **299**——挂起进出 ∕ 空闲 settle ⇒ 自唤醒 ∥ 窗内输入优先 ∥ digest 中止重入 ∥ `dispose` 中止 ∥ 池空退出）；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
② 原址补例（五档）= `thincoder-desktop/test/agent-host.test.mjs`（三路由）· `thincoder-desktop/test/events-reduce.test.mjs`（两通道归约 + 消化行游标）· `thincoder-desktop/test/views-statusline.test.mjs`（段 3 态机四支）·（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
   `thincoder-desktop/test/views-chat.test.mjs`（消化行组）· `thincoder-desktop/test/host-floor.test.mjs`（`EVENT_CHANNELS` 15 断言）；所列测试档随 2026-09-28 测试树全清重置不在盘。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
**真机面 = 人工走查 + 父侧真跑闭合**（D16 义务——fixture 家无凭据 ⇒ 真跑子任务面不可离线复现，沿既有「真实模型回路下的发送成功面」边界）：走查判据 = 真跑后台子任务 ⇒ 空闲等待 ⇒ 段 3 挂起句在场 ∥ 流内 `[data-digest]` 消化行 ∥ 失焦通知一条（聚焦零条）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**ask 交接项（复核轮 2 · 🟡 · 在册）**：「ask 入队 ⇒ 唤醒轮（`upstreamTurn` 旗标 + 回合头 drain）」用例 + 通知三判（纯 ask 不弹 ∕ 合并轮弹 ∕ 用户回合弹）钉入实施任务书（处置链 = `docs/batches/2026-09-28-desktop-idle-wake.md` §1.9② / §1.10 / §1.11②）。

**菜单体系批注（验收面 · 2026-10-02 · 台账 #811）** → 见 `docs/desktop/design/MENU.md` §5（用例行 ∥ 批注；as-of 2026-10-02）。

**设置面样式收正批注（验收面 · 2026-10-02 · 台账 #812）** → 见 `docs/desktop/design/SETTINGS.md` §5（用例行 ∥ 批注；as-of 2026-10-02）。

## 10. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| B | `PROJECT-MANIFEST.json` 的 `docRoot` 需扩第四端 | **已落**（as-of 2026-09-30 实读：docRoot 五根含 desktop 两树） | 无（父侧已落笔——批次档 §1.3 裁） |
| C | `docs/README.md` 多处「三部分」口径（`:12` · `:16` · `:25` · `:63` · `:91`）与桌面端「三端发布」表述（`docs/RELEASE.md` 档头） | **已落**（地图五部分口径先前已改；**发布档四端口径 = 桌面打包发布批（2026-10-01）并线**——档头 ∥ §1 ∥ §4 ∥ §5（+§5.6）∥ §6 全链同拍；地图行同批收正为四发布单元） | 无（父侧早期跟进已闭；余「三端」表述 = 时点历史面（§4.3 快照 ∥ §2 P2 实列举面）） |
| D | 壳装配第三份是否抽共享层 | 序 + 团队层取值已上提核件（本批） | 余端差（MCP ∕ `attachManifest`）= 已裁消（2026-09-29 · 批 #673——补做在册） |
| F | 需求档 §6 明写「留设计轮」而本档无专表落点的两项——「启动可接受」（阈值与测法）·「平台差异面逐项定形」（路径与大小写 / 行尾 / 进程与信号 / 窗口壳与原生菜单） | 需求侧留白 · 本档覆盖缺口 | 评审裁定：本档补专表（下批）或需求侧收正措辞——本批 fix 射程外，登记不改 |
| H | 两项端差：MCP 连接 · `attachManifest` 工程模式钩子 | **已裁 = 消（补做——2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）** | 落点 = `docs/desktop/design/SHELL.md` §4（同拍收正）；实施 = 该批（装配面接入 MCP 连接 + M1 钩子附着） |
| I | 活 / 页两面块形一致性（同一会话在活动池与页内呈现的块形同源） | 实机走查面 | 随 T-DSK17 / T-DSK18 实机走查记录；不一致 ⇒ 归并到归约面单源 |
| J | `sessionMeta` 五值字段名（`effort` / `autoApprove` 等是否槽字段） | **已订正** | `effort` = 槽字段（批 B 立——KD-17 ⇒ 槽值优先，配置回落支删除）· `provider` / `model` 映射既有 `activeProvider` / `activeModel` · `autoApprove` / `engineering` = 布尔槽（`ON` / `OFF` 词形）⇒ 槽值优先；报明 = 批次档 §5.8 / §2 |
| K | 活动池切片**窗限 / 归档口径** | **已消解（「对齐第二批」——口径收正）** | 工具行摘除（工具面入流）；子 agent 块 = 出生 / 终态折叠 / **归档 = 入流**（KD-26 / KD-33；形态 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 5）；`UI.md` open 行同笔摘项 |
| L | `ev:tool-result` 载荷 `subKey` **值面在场 · 消费未落**（宿主透传 + 键定形已落；渲染面归约不按 `subKey` 归并——子代理工具结果与顶层同片） | 设计留白（渲染面消费未落） | 视图批或归约面下次触碰时定形；同项登记 = `docs/desktop/design/IPC.md` §1 载荷键集段 |
| N | 索引状态读数面（需求 D8 判据含「索引状态」） | **已落——桌面功能对位批 R2**（核只读出口 `memoryStatus()` + 桌面两通道 `index:build` ∕ `index:status`，白名单末位 34 ∕ 35） | 本端不直读核内表（第二消费面 ⇒ 核表结构成无主公共契约）；能力面（memory / code_search / doc_search）本身经 agent 工具面可达、不缺；单源 = `docs/desktop/design/IPC.md` §2 该两行 |
| O | 提问挂起（`ev:question` 待作答）的呈现面：需求 D4 所列「挂起态」措辞 vs 本端池族枚举 | **已裁定（父侧 2026-09-26）** | 裁定 = **需求 D4 措辞不改**（问题卡走流内 = 审批卡先例）；**「不静默等待」兑现面 = 跨会话可见面**——待作答 ⇒ 该会话位标含 `approval` 码（⚠ 待审批 · 状态栏告警位同源同词）· 出场 ⇒ 清码（**清码判据 = 两族皆清** —— 单源 = `docs/desktop/design/UI.md` §2 项 2）；**池三族不动**（池 = 本会话面 ⇒ 不添跨会话可见性；流内已有决策面 ⇒ 池行零增益）；落形 = `docs/desktop/design/UI.md` §1 提问呈现行 |
| P | 核 `task` 工具在**工程模式下机械停用**（实读 `thincoder-core/agent-tools/task.mjs:64-66`）⇒ `ev:task` 帧只在普通模式会话出现 | 环境事实（登记） | 计划面消费路已落（`docs/desktop/design/UI.md` §1 计划面行）——验收按**事件驱动**（投 `ev:task` ⇒ 卡可见），不写「必现」；启用面 = 工程模式择绪另议 |
| Q | **页窗暂留**：页键变更至 `history:page` 回执落之间，屏上暂留前页块（关活动 / 切标签同源 —— 既有口径），非「状态转了页没转」 | 设计登记（既有行为 · 非本批新增） | 消解 = 第三态「载入中」= 新词键 / 新形态 ⇒ 新需求面——本批不落；若裁定须消解 ⇒ 另批（`docs/desktop/design/RENDERER.md` §1.1 页生命周期行） |
| R | 桌面端 E2E 面续件：判据④（web 快筛与 Electron 一致性）归属 · 边界 / 错误用例三条 · CI 接线 | **已收正（web 快筛批 · 2026-10-01）**——判据④：快筛工具落形（`docs/desktop/design/WEB-QUICKCHECK.md`）∥ 一致性核仍不做 | 用例补面 = 后续批；CI 接线 = 随三平台 CI 批——单源 = `docs/desktop/design/E2E-TESTING.md` §6 / §7 / §8 |
| S | 需求 D4「挂起态与 **digest**」的 `digest` 面（需求卷 D4 行——`docs/desktop/requirements/ACTIVITY.md`）在设计五档零落点（评审扫全档仅需求档一处命中） | **已消解（本批——桌面空闲唤醒）** | 两落点已定形（单源 = 本档 **KD-36**）：挂起态 = 状态行段 3 第三态（挂起句 · `ev:susp` 计数面）· digest = 流内消化状态行（`ev:digest` 边界面）+ 块侧 `settled` ⇒ 等待消化 ⇒ `done` 归档；需求档 D4 措辞不改（原句覆盖两落点——需求侧零动作） |
| T | **§4.1 行数账按盘全量回填**（实读 2026-09-27）：§5 披露差三档收正（`app.mjs` **222** / `i18n.mjs` **317** / `views-chrome.test.mjs` **392**）· `agent-bridge.mjs` 实读 **77** | 实施后随动收正（登记） | 值列 = 本档 §4.1；存量估值几项（只报）见该段 |
| U | **批 A 拆档产物**：`mount-sessions.mjs`（会话控制面接线——R13-B 后再拆出纯构树档 `thincoder-desktop/renderer/views/session-control.mjs`；现读 **387**）；测试面两档随 2026-09-28 测试树全清重置不在册 | 登记（拆分落形） | 越层档预案 = 本档 §4.1 越 300 段（`mount-sessions` 再拆两手在册） |
| V | 会话控制面换形态态（开合 ∕ 换形——面内 DOM 记账）**无外部消解窗口**（切项目 / 行集整置留场 · 槽号复用 ⇒ 陈旧确认面指向新槽——批档 §5 响应表 4） | 设计缺口（登记） | 消解 = 设新需求面（另批立项）；落点 = `docs/desktop/design/UI.md` §1 会话控制面行 |
| W | **行形态两件**：D2 / D3 收正已落（删除形保留行控件 · 改名形撤行控件 · 确认键词 = 动作词）；**改名出口无行为例**（与删除出口用例不对称——批档 §5 响应表 5） | 收正落地 ∥ 用例缺口待补 | 用例补面 = 后续批（随批单元证据） |
| X | **输入面两件**：① IME 组字保护（`isComposing`——先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`；**实施未落**）· ② 附件面（批 B 立 = KD-21 + IPC 附件注） | 登记（① 规则入册 · 实施待安排；② 设计已落 · 实施随批 B） | ① = `docs/desktop/design/UI.md` §1 交互行 / open 行；② = 同档 §1 批 B 注项 2 |
| Y | **真代码块面**（围栏切分 / 语言高亮 / 代码块级复制） | **已裁（对齐重定位批）· 复制面收正（复制面对齐批）** | 随共享渲染核落（`docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 1 / 11）；实施随 R3c；代码块级复制 = 核件 Copy 钮单源（自建两控件退场——单源 = 本档 §2 **KD-22**（收正）） |
| Z | **D14（可测性 E2E）的批 B 覆盖**：批 B 四件走查面不补 E2E；**批 B 追加轮**补落一条（T-DSK32 首启空态引导冒烟） | 覆盖登记（追加轮已增一例） | 追加轮裁定 = 首启引导走 E2E（判据 = 无项目 ⇒ 无会话 ⇒ 建会话 ⇒ 键入不丢）；批 B 四件的实机面仍归人工走查（T-DSK21）；单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 / §6 |
| AA | 需求档两处随动（**已随动**）：① §3.1:47 槽字段列举补 `effort`；② §3.5 项 7（状态栏占用读数）= 需求档 **D15** | 已随动（需求侧 2026-09-27 落） | 收口 ✓（本档 §6.1 同源 **D15 行**） |
| AB | **活流用户块与入会话文本在非视觉降级径有一行差**（#458 边界）：入会话文本 = 提交文本 + 说明行（主进程 `appendLine`），活流块 = 提交文本 | 登记（边界 · 三端同义：VSC 回显 = 键入串——本档 §2 KD-23） | 消解路 = `msg:send` 回执携入会话文本（须动 IPC 回执形 + 主进程——另裁）；触发条件 = 用户裁定「活流与回放须逐字等同」 |
| AC | **需求侧建议（已随动）**：需求卷 D3 判据列补「发送后用户消息在对话流在场（与回放块序一致，对齐 CLI / VSC）」 | 已随动（需求侧 2026-09-27 落——`docs/desktop/requirements/PROJECT.md:111` D3 判据 + `:179` 变更记录） | 收口 ✓（本档 §2 KD-23 同源） |
| AD | **两越层档被本批触碰**（`thincoder-desktop/renderer/events.mjs` **351 ⇒ 369** · `thincoder-desktop/renderer/mount-composer.mjs` **348 ⇒ 362**）——拆档 = 结构改动 | 上抛（归父侧裁——§4.1 该两行） | 预案补登 = 见 §4.1 越层段；父侧裁：本批实施批执行 ∕ 续期至下批（消解窗口 = 该两档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计）） |
| AE | **在飞回合内切回 ⇒ 本回合用户块不在页读**（#458 键门径窄窗——页复读只含已落盘态） | 登记观察（窄窗 · 无数据丢失） | 槽落盘在回合尾（`thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）· 页读 `loadSlotFile`（`thincoder-desktop/src/main/session-slots.mjs:123` / `:145`）⇒ 随回合尾落盘后、于下次页读在场；消解路 = 无；若须消除 ⇒ 另裁（须触页数据整置口径） |
| AG | **新核包入发布序列**：`@thincoder/render-core`（R1 随发布单元登记 + `docs/RELEASE.md` §5.5 三端物化窗口同源） | 记录面随动（父侧 / 发布轮） | 随 R1 实施批；指针 = `docs/render-core/design/RENDER-CORE.md` §10 B / C |
| AH | **D17 承载四项（耗时 / 令牌 / 计时 / 回合 N/M）** | **已落（R3a）**（2026-09-28 坐实：读数槽四住 `thincoder-desktop/renderer/events.mjs`；载荷面 = `ev:usage` 两键扩 + `ev:activity` `turn`） | 收口 ✓——单源 = `docs/desktop/design/IPC.md` §1 `ev:usage` 行 |
| AI | **两条加载形探针**（VSC dev junction 下 `node_modules` 相对路径 webview 取核 · 桌面 `/rc/` 双根与逃逸门）——任一失败 ⇒ 回核档改加载形（备选 = 物化后 `localResourceRoots` 显式扩面） | 实施前置实证 | R1 首跑即测（`docs/render-core/design/RENDER-CORE.md` §10 E） |
| AL | **`styles.css` 拆档窗口已到**（**374 ⇒ 本批 ~420**；在册预案 = 按「主题变量 / 布局 / 折叠态」三段拆档） | 上抛（归父侧裁——§4.1 该行） | **已消解（R13 四拆分产）**——拆形 = `theme.css` ∕ `chrome.css` ∕ `skin.css`；越层余留 = 承继档 `thincoder-desktop/renderer/chrome.css`（预案 / 消解窗口 = §4.1 越层段在册） |
| AM | **★上抛① 正文面字族**：随 VSC = 编辑器等宽栈（新增变量 `--mono`）——观感变化最大一项 | 上抛（用户裁定面 · 设计已按「值以 VSC 实值为源」落） | **已收正（2026-09-30 · 排版统一批（D29））**：等宽族 = 全端排版基线（`--font: var(--mono)`——建议值 · 批准面裁）；否决 ⇒ 回退配方 = 本档 §2 **KD-57** ⑥；登记 = 核档 §5 排版统一覆盖块 |
| AN | **D 号口径同族书证**（本档档头 `:6` · `docs/desktop/design/IPC.md:4` · `docs/desktop/design/RENDERER.md:4` · `docs/desktop/design/SHELL.md:4` · `docs/desktop/design/UI.md:4`） | **已收口**（父侧直接执行〔可 revert〕· 2026-09-28；D22 / D23 ⇒ D24 ⇒ D25 ⇒ **D26**（会话标题批）逐轮再收） | **同族书证五处（本档 + `IPC.md` ∕ `RENDERER.md` ∕ `UI.md` ∕ `SHELL.md`）随复制面对齐批收正为 D1–D27**（2026-09-29——`docs/desktop/design/SHELL.md:4` 待收项同批销）；口径 = 「D 号诸处同改」（本档先例） |
| AO | **需求档 2026-09-28 补两句的落点（登记）**：D17「恢复态播种」（`docs/desktop/requirements/PROJECT.md:146`）· D19「用户块 md 深度两端统一」（`:148`）——落点 = 批 `docs/batches/2026-09-28-desktop-residuals.md` | 协调项（落点归批 · 零双记——本档不另立条目） | **设计已落**（UI.md 本批注 + 该批 §2 在册）；实现随该批实施轮 |
| AP | **`T-DSK38` 用例号自铸披露**（沿 T-DSK37 先例——本批自铸；若 #477 实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §7 用例表行；并号裁定权 = 父侧 |
| AQ | **`session:create` 径播种 = 空种**（新槽 `tasks: []` / 读数 0 ⇒ 零节点——无可见变化） | 登记（有意行为） | 沿 D17 播种判据的自然结果；无动作 |
| AR | **D17 补句措辞与「播种 2 / 不播种 11」清单的一致性**（`docs/desktop/requirements/PROJECT.md:146`——`tokens` / `timer` 不属播种面；如需在需求档显式列出不播种面 ⇒ 归父侧裁定） | 上抛（需求档面 · 归主 agent） | 本设计不改需求档（笔权在父侧） |
| AS | **`T-DSK39` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 先例——本批自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §7 用例表行；并号裁定权 = 父侧 |
| AT | **模式位桌内翻转刷新**（桌内 AUTO 翻转〔always 放行置位 = `thincoder-desktop/src/main/suspensions.mjs:103`〕后 `flags` 即时刷新） | **已裁（2026-09-28 评审轮 1 修正——并入本批定形）** | 落形 = `approval:respond` 成功径回执叠加 `{ key, flags }` ⇒ 渲染面写 `sessionFlags` 切片（最小可落路径——零新通道 / 零算法副本）；单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 5 |
| AU | → `docs/desktop/design/SESSIONS.md` §6（as-of 2026-10-02） | — | — |
| AV | **桌面需求档 D23 句面与账本警示面的关系**（`docs/desktop/requirements/PROJECT.md:153`：主句 = 计数显示；「同批落会话账本摘要可靠化…失效可见」为归批句——桌面警示面判据锚 = 核需求 §4.6 **F-L4** + 批档 §1.6 扩面裁定；需求档如需桌面专句 ⇒ 归父侧裁） | 上抛（需求档面 · 归主 agent） | 本微轮不改需求档（笔权在父侧）；设计面落点已齐（IPC / UI / E2E 三档 + 本档） |
| AW | **词表键计数在途协调**（`thincoder-desktop/renderer/i18n.mjs` = 139 键 as-of 2026-09-28 实读；状态栏对齐批另有键增 139 ⇒ 145 设计在册且该档在途） | 登记（协调项） | `rail.ledger.notice` 两语必增（判据 = 键名在位，不以计数为门）；实施轮以对盘计数为准 |
| AX | **`T-DSK41` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 / T-DSK39 / T-DSK40 先例——本批自铸〔外壳视觉降噪〕；**机检豁免**——用例行随测试档修加〔2026-09-27 裁定〕；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| AY | **核侧无「助手说话人标签」原语**（核内为 `renderBlock` / `buildAssistantRestore` 内联字面；桌面助手标签 = 端侧同字面落形——词键同源 / 字形住样式档） | **已裁 = 撤项（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）** | 判定 = 非端差（两端同键同字面 ⇒ 零可见差；核侧收拢 = 无用户面收益的纯重构）——不再悬挂；核件零改 |
| AZ | → `docs/desktop/design/COMPOSER.md` §6（as-of 2026-10-02） | — | — |
| BA | **运行期可见面两件**：待发送气泡 / 归档子 agent 块——页读整置即失（非落盘件） | **归档子 agent 块半件已消解（消化面留档批 · #719 · 2026-09-30）**——块体入人读线记录 ∥ 页读重建（`docs/desktop/design/RENDERER.md` §1.1「留档记录」条）；**待发送气泡半件保持登记**（有意行为） | 与 VSC 重载面同族；如需持久化 ⇒ 新需求面（另裁）——块体半件已裁落（用户 2026-09-30 两则原话 · #719） |
| BB | → `docs/desktop/design/COMPOSER.md` §6（as-of 2026-10-02） | — | — |
| BC | **核件输入面 = 文本单形**（`pushInput` 存串——`thincoder-core/agent/suspension.mjs`）——挂起窗内含附件提交经**载具层携图**受理（窗条目 `{ text, ts, images? }`；送达面 `prepareTurnAttachments` 判决；核零改） | **已消解（2026-09-29——窗队列 VSC 逐点对齐批）** | 消解路取「端侧投影」支（原登记「端侧侧表跟踪」同族——实现 = 既有 `entry.pending` 投影携图，零侧表）；上限 ∕ 落盘 ∕ 快照面 = 既有 **BM** 行 ∕ `docs/desktop/design/IPC.md` 附件注同判 |
| BD | **`docs/desktop/design/UI.md` 门控停笔**（外壳批设计评审轮 2 冻结）⇒ 本批 UI 面内容（状态行段 3 第三态 ∥ 消化行族 ∥ 提示面三候选）以批档 §2 定形 | **已消解（2026-09-28——外壳批复评通过解冻）** | UI.md 三处已随落（`:19` / `:21` / `:456-457`——本批批档 §1.7 已核验）；无新裁定需求 |
| BE | 渲染面**通道计数随动面**：残句已清（修正轮 #19）；**复读（2026-09-30 · 留档批回填轮）= 事件 23 位 · 请求面 46 项（已落）**（`thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` = 23 位 · `CHANNELS` = **46 项**（末位 `record:append`）∧ `thincoder-desktop/renderer/events-subscribe.mjs` 二十三通道表）；`docs/desktop/design/IPC.md` §1 = **23** ∕ §2 白名单 = **46**（留档批落定——2026-09-30 实读）；**菜单体系批（#811）随动 = 事件 23 ⇒ 24 ∥ 请求面 46 ⇒ 47——已落**（`ev:menu` ∥ `theme:state`） | 登记（复核轮发现 7——本轮回填复读收正 ∕ W6 再收正 ∕ 留档批同拍 ∕ 菜单体系批随动已落） | 结算 = **已复核（2026-09-30 实读：45 ⇒ 46 落定）**；**菜单体系批随动已落（2026-10-02 实读：23 ⇒ 24 ∥ 46 ⇒ 47）** |

| BF | **`T-DSK42` / `T-DSK43` 用例号自铸披露**（沿 T-DSK37–T-DSK40 先例——对齐第三批自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BG | **核 `onTurnEnd` ⊃ VSC `onSubTurnBreak`**（对齐第三批 A7 端差）：核钩子含「工具批尾」与「中断注入」两支——工具批尾桌面零效果（游标已由 `onToolCall` 清）；**中断注入 ⇒ 收尾文本另起块**（VSC 不断） | **已消解**（端差清算批——2026-09-29） | 消解形 = 核增窄义钩子 `callbacks.onSubTurnBreak`（`thincoder-core/agent/completion.mjs` 六推回点——工具批尾 ∕ 中断注入两支零触）——桌面桥改挂该钩子（中断注入不再产 `turnBreak`）；VSC 死面同修复；`docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」项 7 同拍 |
| BH | **桌面打开文件无行定位**（`shell.openPath` 无行参——相抵②端差）：`file:open` 载荷携 `line` 备用 | **已消解**（端差清算批——2026-09-29） | 消解形 = 外部编辑器 CLI 探测（`code` → `code-insiders` → `cursor` → `subl`——命中 ⇒ spawn 含行参 ⇒ 打开到行；未命中 ∕ spawn 败 ⇒ `shell.openPath` 兜底恰一次）——实现 = `thincoder-desktop/src/main/editor-open.mjs`；`docs/desktop/design/UI.md` §1 相抵②句同拍 |
| BI | **台账行周期刷新**（VSC `REFRESH_MS` 面） | **已落（R8——2026-09-29）** | 启动拍 + 周期拍 **120s**（直消费核 `startLedgerSurface`；L2 明细行集 = `ev:ledger` `detailLines`）；UI.md open 行销、`docs/desktop/design/IPC.md` §1 `ev:ledger` 行同拍 |
| BJ | **`T-DSK44` 用例号自铸披露**（沿 T-DSK37–T-DSK43 先例——timer-wake 阶段 2 自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BK | **`T-DSK45` 用例号自铸披露**（沿 T-DSK37–T-DSK44 先例——回合中插入批自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BL | **`thincoder-desktop/src/main/agent-host.mjs` 拆点已执行（400 ⇒ 248——R3 落形）** | **已消解**（R3——2026-09-29） | 拆点 = 回合驱动族出档 `thincoder-desktop/src/main/turn-driver.mjs`（**已落** · 实读 **214**）；续发链提取 `thincoder-desktop/src/main/turn-chain.mjs`（已落 · 71）；本档 **248 ≤ 300** 回线内 |
| BM | → `docs/desktop/design/COMPOSER.md` §6（as-of 2026-10-02） | — | — |
| BN | **状态词计数注释面残留**：`thincoder-desktop/renderer/views/chat-tool.mjs:13` 注「**七词闭枚举**」 ∥ `thincoder-desktop/renderer/events.mjs:332` 注「状态词闭枚举**第八词**」——同批增词后两处注释计数不一致 | 登记（回填轮发现——码面注释） | 单源 = `docs/desktop/design/UI.md` §1 状态词行 = **8 词**；归码面批次收正（本舱零码改——只报） |
| BO | → `docs/desktop/design/SESSIONS.md` §6（as-of 2026-10-02） | — | — |
| BP | **`T-DSK46` 用例号自铸披露**（沿 T-DSK37–T-DSK45 先例——会话标题接线批自铸；若实施批 ∕ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BQ | **对齐审计强制输入清单**（台账 #524——核档头「留端」清单 + 核注入缝登记表；扫域补遗 = 根外缝并行对账） | **已落**（本档 §2 **KD-42** 方法注记 + 批档 §2.3 对账节先例） | 此后任何「对齐 ∕ 端差 ∕ 缺口清点」审计按 KD-42 执行；两清单每次现读原档（不抄副本） |
| BR | **桌面功能对位批端差登记集合**（命令面板本体 · 宿主能力缝〔LSP ∕ diagnostics ∕ 编辑器写径 ∕ eng mirror ∕ skill loader ∕ tree resolve〕· 探针忙闸 · 宿主忙采样） | **复核定形（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md`）**：宿主忙采样 ∕ 探针忙闸 = **消**（随 S3 补做——本档 §10 **CG**）；命令面板本体 = **非端差**（VSC 工作台面——扩展面外且需求零列）；余六项宿主缝 = **须逐项实证**（每项二值：消 ∥ 宿主能力面实证 + 明条件；证据不足 ⇒ 判消——不得再整体悬挂） | 单源 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2.2 ∕ §2.3 ∕ §2.9 + 本批批档 §2 |
| BS | **桌面功能对位批上抛 9 项 ∕ 复核清单 8 项 ∕ 发现项 5 条**（含 #410 盘面已在建议核销 · C8 多实例反证 · §1.4「CLI traces」表述与盘面不符 · 缝登记表计数 23 行收正） | 上抛（归父侧 ∕ 用户裁定） | 单源 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2.9；复核清单归该批 R10 轮 |
| BT | **子 agent 块跟滚批（#518）三件**：① VSC 本地块级跟滚原语改指核件（提核随动——机械改指 · 行为零变；先例 = R2 换接；居父侧「核 ∕ 桌面两树」定界外一笔，请裁）② 需求档判据句（建议文本：「子 agent 块内容区流式跟滚 · 上滚不抢 · 近底复跟」——供父侧落笔）③ 值面两条（`.advisor-block.sub-block .advisor-content` 60px ∕ `.sub-block > summary` 0.75——R10 映射源范围外漏项，本批补） | 上抛（①归父侧裁；②需求档笔权归父侧；③已并入本批设计） | ① 若维持两树边界 ⇒ 摘除批档 §2 P2 并转出；② 判据句落点建议 = 需求卷 D20 ∕ D4（`docs/desktop/requirements/ACTIVITY.md`）；③ 单源 = `docs/desktop/design/UI.md` §1「本批注（子 agent 块内容区跟滚 · #518 收口）」 |
| BU | **右键菜单条目集 ∕ 空选面 vs VSC webview 实况差异**（本机 VS Code 构建实读：`WebviewContext` 菜单注册 = 剪切 ∕ 复制 ∕ 粘贴三件（`workbench.desktop.main.js`——`appendMenuItem(A.WebviewContext, …)` 三处 · group `5_cutcopypaste`）、**无「全选」**；门 = `preventDefaultContextMenuItems`）——桌面按 **D27 逐字**落语境化集合（可编辑四件 ∕ 选中两件 ∕ 空选零菜单） | **保留零动**（已裁——端差清算批 · 2026-09-29——宿主面固有差；KD-43 逐字不动） | 由 = ①两端菜单各由**宿主**渲染（VS Code 工作台 ∕ Electron 原生）——「消」在 VSC 侧不可达（扩展改不了工作台菜单）；②「全选」 = 反向差（桌面独有，D27 需求位）⇒ 保留零动先例；③空选零菜单 = Chromium 原生约定（无可用动作 ≠ 列灰件）。差异面在册 = ①「全选」项 ②空选非编辑；走查如另有口径 ⇒ 按需求档笔权（主 agent）收正 |
| BV | **`T-DSK47` 用例号自铸披露**（沿 T-DSK37–T-DSK46 先例——复制面对齐批自铸；若实施批 ∕ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BW | **主进程原生菜单文案族**（右键菜单四键 = `menu.edit.*` 经 `HOST_DICT` 两语现读；应用菜单 Maintenance 两项 ∕ `confirmRecycle` 文案仍 en-only——台账 **#533**） | 登记（同族 · #533 触发 = 归批） | 本批只保新面不复制该债（右键菜单两语随 `locale`）；维护面文案 zh/en = #533 另行处理 |
| BX | **`T-DSK48` 用例号自铸披露**（沿 T-DSK37–T-DSK47 先例——窗队列 VSC 逐点对齐批自铸；若实施批 ∕ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| BY | **池区旗标窗口登记（#563② 评估 · 残余族清账批）**：`_poolPin` 三写者（点击 ∕ `scroll` ∕ 世代重置）+ 帧尾写守 `_poolPin !== false` 早退 ⇒ 极端窗口可夺回一次上滚 = **有界自纠**（非持续失效）——裁 = 维持现态 + 登记；若真机走查再现夺回 ⇒ 再立小修 | 登记（#563② 评估结论 · 无动作） | 工艺面落点 = `docs/desktop/design/RENDERER.md` §3 |

| BZ | **`model:list` 探针径对齐（代理 + 落账）作为同批附带件**（设计 U1——批档 `docs/batches/2026-09-29-model-menu-parity.md` §2.8） | **已裁（父侧 §4 = 受理）** | 落形 = `thincoder-desktop/src/main/settings.mjs` `modelList` 同径（`probeChannelModels` + `probeTargetOf`——过代理 ∕ 落账）；**回执行逐字零变**（判据 = 批档 §5.2 AC7）；单源 = `docs/desktop/design/IPC.md` §2「设置族与项目级信息族注」表 `model:list` 行 |
| CA | **失败渠可见面时序**（设计 U2——批档 §2.8）：本批落账（`unavailable` + 核落账）与可见行标（B10 S3）之间，失败渠于菜单静默缺席 | **已裁（父侧 §4 = 维持设计——不提前）** | 菜单零失败行 = VSC 同行为（不造反向端差）；可见行标面归 B10 S3（读核落账 `admissionOf`）；判据全式 = `docs/desktop/design/IPC.md` §2「模型清单注」 |
| CB | **判据「一级 = 全部配置渠道」是否在需求档明文化**（设计 U3——批档 §2.8） | **已裁（父侧 §4 = 需求档明文化——父侧笔）** | 判据全式（有 key ∧ 探通 ⇒ 行 ∕ 探不通 ⇒ 零行 + `unavailable` ∕ 零 key ⇒ 零行）落点 = `docs/desktop/design/IPC.md` §2「模型清单注」；需求档笔权 = 主 agent（随父侧收尾落） |
| CC | **子 agent 块跟滚让位修复批上抛（2026-09-29 · 台账 #603）三件**：① 需求档出口判据句（建议文本：「停跟态有**可见出路**（↓ 新内容 ∕ 回到最新）」——落点建议 = 需求卷 D4 ∕ D20（`docs/desktop/requirements/ACTIVITY.md`）；VSC 面 `docs/vsc/requirements/WEBVIEW.md` F-W2 同族）② VSC `chat.css` 越 500 硬限（实读 **511** · 2026-09-29——本批样式避让 `base.css`；该档拆分 ∕ 例外处置）③ 探针件收位（`.thincoder/tmp/scroll-probe{,2,3}.mjs` ⇒ 批内件终位三件 `docs/batches/2026-09-29-subblock-follow-resume-probe.mjs` ∕ `-probe2.mjs` ∕ `-probe3.mjs`） | 上抛（①需求档笔权 = 主 agent；②③归父侧） | 单源 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2.10 |
| CD | **块跟滚机制边界裁定（留端清算 · 2026-09-29 用户裁定）**：原语 ∕ 旗标语义 ∕ 出口钮 = 核；**应用时机契约 = 核**（应用点清单：追加后 ∕ 挂载后 ∕ 帧尾复核——端只在宿主时刻调用核应用器；端侧遗漏 = **违约缺陷**）；**触发源 = 端**（VSC 流式装配 ∕ 桌面 store 变更 ⇒ 调核帧合并件 `mark`——帧合并 ∕ 更新纪律收核，2026-09-29 收正；单源 = 核档 §2 KD-RC-9）；**滚动策略族契约同源**（块内容区 ∕ 活动区 ∕ 池列 ∕ 对话流四载体一句契约：近底 24px + 旗标门 + 清账三路——端 = 适配器 + 对拍腿；判据漂移 = 缺陷）——判据 = 全档面不得再出现同机制两半分立而无人统一 | **裁定落（设计面 · 用户裁定 · 档面同笔）** | 单源 = 本档 §2 **KD-47** ∕ `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**；批档 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2.13 |
| CE | **更新纪律收核批上抛（2026-09-29 · 台账 #609）**：① 需求档性能行阈值与测法——**已落**（`docs/desktop/requirements/PROJECT.md` §6 性能行 + 变更行，2026-09-29）② #190 会诊 C2 两腿（单位时间输出可见延迟 ∕ Stop 可响应）+ 探针扩面件 ⇒ **已挂台账 #592** ③ #603 批档句不同步——**已消解**（#603 修正轮 #216 按 KD-RC-9 收正批档 §2.13 ∕ §2.4 ∕ 实施义务——2026-09-29） | **三件全闭**（①已落 · ②#592 · ③已消解）〔父侧直接执行 · 2026-09-29 · 可 revert〕 | 单源 = `docs/batches/2026-09-29-render-perf.md` §2.8（①含建议文本） |
| CF | **`chat-chrome.mjs` 贴层登记**（更新纪律收核批：292 ⇒ ≈298——锚引用直取增量）——消解窗口 = 下次结构性触碰 | 登记（贴层） | 单源 = 本档 §4.2 本批行 |
| CG | → `docs/desktop/design/SETTINGS.md` §6（as-of 2026-10-02） | — | — |
| CH | → `docs/desktop/design/SETTINGS.md` §6（as-of 2026-10-02） | — | — |
| CI | **`i18n.mjs` = 硬限顶格**（W3 记 507 越 500 硬限） | **已消解（i18n 拆分批落地——2026-09-29 · 台账 #614：500 ⇒ 393；§4.1 在册例外归零）** | 单源 = §4.1（已消解）；本批（#673）登记位闭环 |
| CJ | **R1 `error` 面全窗呈现 vs 首启向导「畸形档 ⇒ 设置面可进」口径**（W1 报告级发现③：两口径关系待裁） | **裁：保留设置可进出路**（错误面非模态 ∕ 携入口——档面口径以 UI.md:31 为准；已落（desktop-residuals-round3 波 C——2026-09-29；台账 #617））〔父侧 · 2026-09-29 · 可 revert〕 | 单源 = `docs/desktop/design/UI.md` §1「本批注（parity-b10-ui · 设置面余面 + 首屏引导门 · 2026-09-29）」项 8；真机复读 = 父侧 |
| CK | **`traces` ∕ `stopTrace` = 不做（#523④ trace 支 · 裁定）**：非用户可见面（VSC = 开发者诊断链路；CLI 侧无 `/traces` 命令——仅启动清理 + `/config` 开关）⇒ 对齐义不要求桌面造；「丢弃痕」支 = 子块 drop 痕迹（核留端清单项）——归 **#608**（在途批）处置（非本批） | 登记（裁定 · 不做） | 单源 = `docs/batches/2026-09-29-desktop-extension-engine-face.md` §2 裁定表行 5；先例判定 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2.9 上抛 4（R10）；消解路 = 用户显式要求桌面诊断面时另立轮 |
| CL | **核休眠缝两项（`configureEditReceipt` ∕ `configureGitApproval`）转单核侧裁（#523⑤）**：三端零消费者 + 端审批在工具执行前（`docs/core/design/TOOLS.md` §6.11 既有口径）⇒ 桌面零接；处置两选项（保留重分类 ∕ 退场）与核侧落点清单 = 转单在册 | 上抛（核侧裁） | 单源 = `docs/batches/2026-09-29-desktop-extension-engine-face.md` §2 转单节；核侧落点 = `docs/core/design/CORE-UNIFICATION.md` §2.13.3（族余项）∕ §2.13.4（#59 ∕ #69 行）+ `docs/core/design/TOOLS.md` §6.11；同族第三缝 `setWaitForConditionSource`（`thincoder-core/tools/ops.mjs:159`）建议并单——待父侧裁 |
| CM | **性能尾账批上抛（2026-09-29 · 台账 #619）**：① **需求档性能行收正**——阈值改「帧 p95 ≤8ms@80KB（基线 ∕ 密文两段同判）+ 帧成本平坦比 ≤2」+ 测法指针改本批内件；现行为 = ≤16ms 收正句 + 增量 md「另议挂账」句（本批机制落定后为过期形）——**父侧落笔**（需求档笔权；建议文本 = 批档 §2.9）② 批内件两档收位（`…perf-residuals.{test,probe}.mjs`——首落 `.thincoder/tmp/` 沿先例）③ **VSC 复证坐标登记**：修前副本 = git `cf48ba12~1:thincoder-vscode/webview/chat-messages.js`（可得实证——对拍参照 = 逐字提取；记录面随父侧） | 上抛（①需求档笔权 = 主 agent；②③归父侧） | 单源 = `docs/batches/2026-09-29-perf-residuals.md` §2；复证形态 = 核档 §7 C11 |
| CN | **重建保真 ∕ 留端清算族批上抛（2026-09-29 · 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md`）**：① **U1 手势门收编裁定**——#607 工厂化后其余三载体是否随收 KD-RC-8 让位三律（手势门 600ms——工厂已参数化）；前置 = 键盘径残余真机核；建议 = 随该残余一并裁（另小修）② **U3 台账闭档建议**——#605（复核闭档）· #608①②③（给由收正即闭）随 §6 收口核销；#604 ∕ #606 ∕ #607 ∕ #581 待实施核销 ③ **U4 双写者定序（已裁）**——`thincoder-desktop/renderer/mount-sessions.mjs` = `structure-split-round` 批（拆先落）∥ 本批 #606① 串行；拆分先落 ⇒ 本批行基与差分区段届盘重钉 ④ 报告——归因订正（#605 所指 `appendToolOutput` = #609 批落地件）· 需求档零改判定（条目 = 台账在册缺陷修复面）· 存量两专用草稿快照保留（非阻塞观察） | 上抛（①裁定 = 父侧；②③④登记） | 单源 = 批档 §2.8；U2（设计档随动 = 实施前硬前置）= 五档已落（2026-09-29）· 核两档档头随代码波 |
| CO | **撤会话头 + 工具头色批上抛（2026-09-29 · 台账 #668 ∕ #669）**：① **需求档 §3.1 修订已落（父侧落笔 · 2026-09-29）**（会话头行撤 ∕ 三值归属句 ⇒ 输入区控件行；图 ∕ 状态栏去重句同笔；需求档 `:269` 变更记录同笔）② 派单坐标外三面随批收正（`skin.css` 会话头交互态行 ∕ `RENDERER.md` 面数句 ∕ `IPC.md` 面名句——实读所得，已随批落）③ 档案观察（批内件五件含会话头面用例——随面退场成档案件，不重跑 · 零动作；逐件登记 = 批档 §2.10；**补：`docs/batches/2026-09-29-structure-split-round.baseline.json` 内 `.session-head` 第二处**（注释句条——同「不重跑 · 零动作」口径）） | **①已落（父侧落笔 · 需求档 `:269`）**；②已处置；③登记无动作 | 单源 = `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 ∕ §2.10 |
| CP | **桌面堆取证修复批上抛（2026-09-30 · 台账 #694）**：① **读数点名（父侧 CDP 观察实验转达——加速件 ∕ 非依赖）**：现行渲染进程堆快照——按构造器分组 top ∕ detached DOM 计数 ∕ 保留者链摘要；重放「子代理终报消化」负载后二次快照 → diff（修前基准 = 快照差判据）② **冻结现场归属补证**：PID 15184 进程类型（`--type=renderer` 与否）+「app 自警 heapUsed 3.0∕4.2GB」原文出处——影响 KD-54 首候选定序（不阻塞——设计自足：KD-53 武装读数兜底） | 【上抛】①父侧 ∕ 用户侧执行；②父侧回证 | 单源 = `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.8 |
| CQ | **桌面装配表无驱逐（堆取证批实读发现——登记）**：`agents` Map（`thincoder-desktop/src/main/agent-host.mjs:105`）清点仅两径——`session:delete`（`thincoder-desktop/src/main/ipc.mjs:168`）∥ 切项目（`thincoder-desktop/src/main/turn-driver.mjs:243`）；切会话 ∕ 新建 ∕ 恢复**零处置** ⇒ 多开会话全部 agent（含全量 history）常驻；另 `turnEpochs`（`src/main/turn-driver.mjs:55`）无清除面、核 `_advisorRuns` 无 delete | 【登记】本批候选 C——按 KD-54 钉点分支决定是否收敛；未命中 = 保留在册（不盲修） | 单源 = 批档 §2.2 ∕ §2.3-2；命中 ⇒ 收敛面入 §4.2 块 |

| CR | → `docs/desktop/design/ACTIVITY.md` §7（as-of 2026-10-02） | — | — |
| CS | → `docs/desktop/design/ACTIVITY.md` §7（as-of 2026-10-02） | — | — |
| CT | **`T-DSK50` 用例号自铸披露**（沿 T-DSK37–T-DSK49 先例——重启自动重开批自铸；若实施批 ∕ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| CU | → `docs/desktop/design/SESSIONS.md` §6（as-of 2026-10-02） | — | — |
| CV | **`T-DSK51` 用例号自铸披露 + 排版统一批（#736）三件**（沿 T-DSK37–T-DSK50 先例——排版统一批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **AM 行回退口径随 D29 收正**——★上抛①（正文面族）原回退配方（删 `font-family: var(--mono)` 一行）已被 D29 基线制覆盖 ⇒ 现行撤回配方 = 本档 §2 **KD-57** ⑥；**D21 排版通道被 D29 覆盖**（结构 ∥ 盒值 ∥ 色面仍在 D21 域内）；③ **上抛②（markdown 相对修饰读法）待核准在册**——设计建议 = 相对 em 修饰保留（`docs/render-core/design/RENDER-CORE.md` §5 块现行形同此）；备选 = 全压平至基线（白名单与期望值同拍改基线）；裁定面 = 批准（用户）——指针 = 批档 §2 五·上抛② | 登记（自铸披露 + 口径随动） | 单源 = 本档 §2 **KD-57** ∥ `docs/batches/2026-09-30-desktop-typography-unify.md` §2 |
| CW | → `docs/desktop/design/ACTIVITY.md` §7（as-of 2026-10-02） | — | — |
| CX | **`T-DSK53` 用例号自铸披露**（沿 T-DSK37–T-DSK52 先例——窗口重启最大化批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| CY | **macOS 最大化语义待裁（窗口重启最大化批 · 2026-09-30 · 台账 #745）**：KD-59 ④ 内嵌待裁项——macOS `maximize()` = 原生 zoom（`zoomToPageWidth` 默认 false ⇒ 到屏宽——非全屏）；若用户期望 = 全屏（`setFullScreen`）⇒ 另裁（改动面 = darwin 专支一行） | 上抛（供批准面裁） | 单源 = 本档 §2 **KD-59** ④（同拍 = 批档 `docs/batches/2026-09-30-window-maximize.md` §2 上抛 1） |
| CZ | → `docs/desktop/design/ACTIVITY.md` §7（as-of 2026-10-02） | — | — |
| DA | → `docs/desktop/design/ACTIVITY.md` §7（as-of 2026-10-02） | — | — |
| DB | **`T-DSK54` 用例号自铸披露 + 主题切换批（#743）两披露**（沿 T-DSK37–T-DSK53 先例——主题切换批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定）：① 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；② **画布色 ∥ 原生面随系统**（主进程不以用户值驱动原生面——`nativeTheme.themeSource` 径被否 = KD-61 被否列；唯菜单勾选态显示缓存一枚——**KD-65** ②；强制态下首帧前窗底 ∥ 原生对话框 = 系统态——边界非缺陷）；③ **CSS 基底披露**：值对函数 `light-dark()` = Chromium 123+（宿主 = Electron 44.4.5 ∕ Chromium **152**.0.7977.130——`releases.electronjs.org` 实读 2026-09-30；devDep `^44.4.5`） | 登记（自铸披露 + 两披露） | 单源 = 本档 §2 **KD-61** ∥ `docs/batches/2026-09-30-theme-switch.md` §2 |
| DC | **web 快筛批（#434）上抛三件（U1–U3 登记）**：① `E2E-TESTING.md` 状态随动两处 ② 同档 §3.5 步 4 判据疑陈旧 ③ 需求档笔（web 快筛 = 开发工具面） | 登记（设计档 §8 单源 ∥ 批档 §2.5） | ① 请裁：随本批修 ∥ 另立微轮；② 另裁（建议随 E2E 重建轮）；③ 需求笔权 = 主 agent——单源 = `docs/desktop/design/WEB-QUICKCHECK.md` §8 ∥ `docs/batches/2026-09-30-web-quickcheck.md` §2.5 |
| DD | → `docs/desktop/design/CHAT.md` §6（项①）∥ `docs/desktop/design/ACTIVITY.md` §7（项②）（as-of 2026-10-02） | — | — |
| DE | → `docs/desktop/design/PACKAGING.md` §6（as-of 2026-10-02） | — | — |
| DF | **`T-DSK56` 用例号自铸披露**（沿 T-DSK37–T-DSK55 先例——斜径命令面批自铸；若实施批 ∥ 并行批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| DG | → `docs/desktop/design/MENU.md` §6（as-of 2026-10-02） | — | — |
| DH | → `docs/desktop/design/SETTINGS.md` §6（as-of 2026-10-02） | — | — |
| DI | → `docs/desktop/design/MENU.md` §6 ∥ `docs/desktop/design/SETTINGS.md` §6（as-of 2026-10-02） | — | — |
| DK | → `docs/desktop/design/PACKAGING.md` §6（as-of 2026-10-02） | — | — |

## 三、历史段

## 变更记录

> **迁移前（≤ 2026-10-02）**：本段为迁移前历史记录（整块原样保留、不逐条改写）；迁移日后的变更记于各域档（新档自迁移日起记）。

- 2026-09-25：建档（桌面端设计批 1）——模块目标与总体方案（§1）· 关键决策 8 条含被否候选（§2）· 架构与接口契约（§3：进程形态 / IPC 通道 / 六面接口 / 壳装配第三份 / 需求档 §3.5 三项落定）· 受影响文件清单（§4）· 三平台打包链（§5）· 验收回指（§6）· 用例表 16 条（§7）· 边界（§8）· 界面形态落定（§9）· 上抛项 5 条（§10）。
  与需求档的对齐：需求 §3.1 布局收正（**活动池 = 会话视图内靠右**）已按本批新形态落于 §9 与 §3.5；需求 §3.5 项 3（会话行来源端）标 open 并上抛（§10 A）。
- 2026-09-25（修正轮）：§9 补落 6 行（标签条 · 长会话渲染窗口（200 块 + 摘要块）· 回填与跟滚 · 状态词闭枚举 · 状态栏警示与单点重建 · 工具卡大 patch 降级）；§9 open 行收窄为「左列折叠阈值数值」。
  新增 §11 范本借用清单（11 行 = 10 项 + 首屏补行，带来源坐标与证据级别）；随动 = §3.1 树 · §3.2 `history:page` · §4.1 拆档（`chat-stream.mjs` / `chat-scroll.mjs`）· §6.1 D2–D5 · §6.2 P2 · §7 用例 T-DSK17–21 · §10 F 行。
- 2026-09-25（分档轮）：按板块切五档（判据 = 多面 + 会被并行写的面，非篇幅）。映射：
  - §3.1 → `docs/desktop/design/SHELL.md` §1（树注另归该档 §2 职责索引）；§3.2 → `docs/desktop/design/IPC.md` §1 / §2；§3.3 → `docs/desktop/design/SHELL.md` §3；
  - §3.4 → `docs/desktop/design/SHELL.md` §4；§3.5 → `docs/desktop/design/UI.md` §2；§9 → `docs/desktop/design/UI.md` §1（形态 14 行）+ `docs/desktop/design/RENDERER.md` §2 / §3（工艺 2 行）；
  - §11 → `docs/desktop/design/UI.md` §3（形态面 5 行）+ `docs/desktop/design/RENDERER.md` §4（工艺面 6 行）。
  搬迁节在原档只留一行指针（不留正文副本）；本档 §4 / §6 / §8 / §10 内被搬节的 `§` 回指随动改为带路径指针；档头补五档导航。
- 2026-09-25（**修正轮**——设计评审 §3 轮次 1 发现 1 / 2 / 3 / 4 / 7）：§2 增 **KD-9**（最近项目目录零新存储）· §4.1 增 `thincoder-desktop/src/main/projects.mjs`（拟新增）/ `thincoder-desktop/renderer/i18n.mjs`（拟新增）/ 用例模块五档行 + 测试面三分落点注 ·
  §4.1 注行改「≲300」并补 `styles.css` 拆分预案 · §5 script 三条收正为**单源**（`test` / `package` / `postpackage`）· §6.1 D1 判据点名状态文件。
- 2026-09-25（**修正轮 2**——设计评审 §3 轮次 2 发现 14 / 16）：§4.1 `thincoder-desktop/src/main/projects.mjs` 行与 §6.1 D1 判据行的 KD-9 指针改**带路径全名**（消指代歧义）· §9 指针行计数同步（UI §1 形态行 15 行 / 合计 17 行）。
- 2026-09-25（**修正轮 3**——收尾两件：设计评审 §3 轮次 2 发现 15 的 H1 角落 · 发现 4 残余）：§7 T-DSK2 前置写明「A 已有会话写入（族最新 mtime 居前 10）∥ A 无数据文件（首次打开即物化——位次由打开写定）」——对回批次档 §1.12 裁定「最近 = 最近写入」（打开既有族不刷新位次）· §4.1 人工面补实机交互类 9 条（T-DSK4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 13——T-DSK6 由「键位项」收口为整项）⇒ §7 用例 21 条逐条有落面。
- 2026-09-25（**实施后修正轮**——SLOT-END-PARAM 落地同步 · R-5 / R-2 回填）：KD-5 改端名声明形态（核 marker 端参数化 ⇒ 端侧零算法副本）· KD-9 被否候选坐标收正 · §2.1 改实测读数（宿主内置 Node = 22.21.1）· §4.1 增 `host-floor.mjs` 行（42）· `session-slots.mjs` 行改端壳口径 · §6.1 D2 / §7 T-DSK3 补 `createdBy` 判据 · §8 撤「不承诺来源端」行 · §10 销 A / E。
- 2026-09-25（**宿主底线轮** · 批 2026-09-25-host-node24）：KD-7 下限改 **Electron ≥ 44.x** · 理由链改「Electron 44 内置 Node 24.21.0；本端取 Node 24 主版本底线」· §2.1 实测读数改 Electron 44 面（`24.21.0`）· §6.2 P1 下限指针随动。实施面（`electron` `^37.3.1` → `^44.4.5` · `MIN_NODE` `"22.13.0"` → `"24.0.0"`）由实施舱落。
- 2026-09-25（**批 3 视图面首段 · 左列**）：§4.1 增 `sessions.mjs` 行（会话族读面：`sessions:list` 载荷投影）· 用例模块行增 `views`（~90 行）+ 自动面落点补 T-DSK1 / T-DSK2 / T-DSK3 渲染面 · `thincoder-desktop/renderer/views/sessions.mjs`（拟新增）行补左列先行口径。
- 2026-09-25（**宿主底线轮 · 实施后修正轮**）：KD-7 被否候选「保留 Electron 37 面」删括注「与 core / CLI 的单条底线分叉」（A 裁定 ⇒ 双轨底线保留 · 该括注失据）。
- 2026-09-25（**批 4 中区外壳面**）：§4.1 增 `thincoder-desktop/renderer/views/chrome.mjs`（拟新增）行（会话头 + 状态栏）· `thincoder-desktop/renderer/views/sessions.mjs` 行预算 180 → ~240 · `styles.css` 行预算 300 → ~280（注行「居顶」随动）· `i18n.mjs` 行预算 60 → ~100（皆据实读行数）· 自动面 `views` 落点补中区外壳结构面（T-DSK20 / T-DSK3）。
- 2026-09-25（**实施后修正轮 2**——行数回填）：表下补「批 3 收口 · 行数回填」注（内容行数口径——文末换行不计）：`thincoder-desktop/renderer/i18n.mjs` 93 · `styles.css` 180 · `桌面 views 用例档` 174——三档超批 3 实施前预估界（89 / 162 / ≤150）但 ≪ 500 硬限 ⇒ 无拆分案。
- 2026-09-25（**实施后修正轮 2**——标记与路径收正）：§4.1「（拟新增）」按盘上实态逐行收正（已落档 19 行去标 · 未落档 10 行保留）· 节标题改「本端文件清单与行数预算」· `test/` 两行的相对路径 token 改带路径全名（`thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs`）。
- 2026-09-25（**批 4 修复轮 #55**——设计评审 §3 轮次 1 发现 1–9 全收）：§4.1 用例模块行 `~90` ⇒ `~300（实读 175）` · 表下补 **300 行主动拆分层**段（`views 用例档` 拆分预案 = U45–U48 拆 `views-tabbar.test.mjs` + `thincoder-desktop/test/files.mjs` 清单随动）· 「自动」行下补中区外壳面读法（静态树面 + 常量驻留；运行时横滚 / 渐隐 / `inert` 归人工走查）。
- 2026-09-25（**批 4 修后收正轮 #57**——数值 / 标记收正）：§4.1 `styles.css` / `thincoder-desktop/renderer/i18n.mjs` / `thincoder-desktop/renderer/views/sessions.mjs` 三行实读值回填（**270 / 97 / 250**——内容行数口径）· `thincoder-desktop/renderer/views/chrome.mjs` 行撤「（拟新增）」标记（已落档 · 不写数）。
- 2026-09-25（**批 4 修后收正轮 #57**——档数 / 300 层收正）：§4.1 用例模块行补第七档 `views-tabbar`（`~300（实读 228）`）且 `views.test.mjs` 实读 175 → **322** · 表下「300 行主动拆分层」段改写（首轮拆分已落档）+ 紧接登记 **在册例外**（`桌面 views 用例档` 322 · 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））。
- 2026-09-26（**批 5 会话族批**）：§4.1 增 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行 · `thincoder-desktop/src/main/session-slots.mjs` 行改**七项绑定转口**（marker 三项 + 会话族四项）+ `renameSlot` 纯 re-export。
- 2026-09-26（**批 5 会话族批 · 预算与档数**）：`thincoder-desktop/renderer/app.mjs` 预算 ~120 → ~150 · `thincoder-desktop/renderer/views/sessions.mjs` 预算 ~240 → ~290（贴 300 拆分层——标签条面拆分预案在册）· 用例模块行七 → **八档**（补 `桌面 views-chrome 用例档`）+ 各档预算重估。
- 2026-09-26（**批 5 会话族批 · 续**）：「300 行 = 主动拆分层」段改写（首轮 / 二次拆分均落档；在册例外段撤）· §7 补 T-DSK3 注（重命名 / 删除零 UI 入口 ⇒ 走查口径）· 拆分预案行 `tabbar.mjs` 补「（拟新增）」标记（锚收正）。
- 2026-09-26（**批 5 修复轮 #60**——设计评审 §3 轮次 1 发现 9 / 10 / 11 · 转口措辞）：KD-5 与 §4.1 `thincoder-desktop/src/main/session-slots.mjs` 行**转口措辞分层**（转口八项 = 端参绑定 6 · 同形转口 1 · 纯 re-export 1）。
- 2026-09-26（**批 5 修复轮 #60**——信封记法 / 拆分预案随动面）：§4.1 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行信封记法统一（`reason: null|string`）· 300 层段二次拆分改**条件式**（「随本批落地」）· 拆分预案行补**随动面**（`docs/desktop/design/SHELL.md` §1 树 + U51 扫描清单 / U52 导出锁 + 本档 §4.1）。
- 2026-09-26（**批 5 实施后修正轮 #62**——全表实读回填 · 逐号 1 · 依据 = 批次档 §1.8 / §1.9）：§4.1 产品 / 测试面实读收正（17 档 · 交付档列值 = 实读裸值 · 未交付档保 `~`）· 新档两行入表（`thincoder-desktop/src/main/session-actions.mjs` 67 · `桌面 views-chrome 用例档` 213）· 用例模块行八档实读 `99 / 101 / 280 / 200 / 227 / 200 / 213 / 329`。
- 2026-09-26（**批 5 实施后修正轮 #62**——300 层段 · 逐号 2）：段改写（两轮拆分均落档——`桌面 views 用例档` 200）· 在册例外换防：旧 `桌面 views 用例档` 322 消解 ⇒ 新 `桌面 views-tabbar 用例档` 329（候选 = 确认面 U55 面拆出 · 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））。
- 2026-09-26（**批 5 实施后修正轮 #62**——记录面判 · 逐号 3）：变更记录内历史行（批 4 旧例 322 · 批 5「（拟新增）」/「七项绑定转口」/`reason?` 旧记法）按**记录面留档**不改（dated 历史 · 不追改）。
- 2026-09-26（**批 6 对话流 + 工具卡（视图面）**）：§4.1 产品面增 `thincoder-desktop/renderer/chat.css`（拟新增 · ~55——分档理由 = `styles.css` 实读 284 贴 300 层）· `chat.mjs` / `chat-stream.mjs` / `app.mjs` 三行说明随动（块五型与单源指针 / `streamDelta` 四档 / 对话流槽接线）。
- 2026-09-26（**批 6 · 档数与注行**）：用例模块行八 → **十档**（补 `views-chat` / `views-chat-scroll`）· 自动面落点补 U58–U67 · 注行「居产品面顶」收正（`styles.css` 实读 284 ≠ 顶——`sessions.mjs` 292）· 在册例外行「清单八档同步」→ 十档。
- 2026-09-26（**批 6 · 续**）：§4.1 三新档行预算沿在册（`chat.mjs` 260 / `chat-stream.mjs` 110 / `chat-scroll.mjs` 150）——交付后按实读回填。
- 2026-09-26（**批 6 修复轮 #65**——设计评审 §3 轮次 1 发现 8）：§9 指针行计数同步（`docs/desktop/design/UI.md` §1 形态与交互面 15 → **17 行** · 合计 17 → **19 行**——批 3 增「左列会话行」后滞后 1 随动）。
- 2026-09-26（**批 6 实施后修正轮 #69**——实读回填）：§4.1 各行按实读回填（`index.html` 37 · `chat.css` 127 · `app.mjs` 271 · `i18n.mjs` 115 · `chat.mjs` 228 · `chat-stream.mjs` 77 · `chat-scroll.mjs` 90）· 四行去「（拟新增）」标记 · `test/` 行 `files.mjs` 6 → 7 + 用例模块行 256 / 245 / 278 · 300 层段 `views-chrome.test.mjs` 实读 213 → 256。
- 2026-09-26（**批 6 实施后修正轮 #69**——新档行 / 拆分落形 / U-4 消解）：§4.1 产品面增 `thincoder-desktop/renderer/views/chat-tool.mjs` 行（123 · 工具卡面）· `chat.mjs` 行括注改三面分档 · 注行拆分预案段补**拆分落形**（351 > 300 ⇒ 越层触发）。
- 2026-09-26（**批 7 审批与活动池视图面**）：§4.1 增 `thincoder-desktop/renderer/views/approval.mjs`（拟新增 · ~150）与 `thincoder-desktop/renderer/pool.css`（拟新增 · ~40）两行 · `activity.mjs` 行补池落形 / `chat.mjs` 行改卡入流口径 · 用例模块行十 → **十二档** + 自动面落点补两档 · 300 层段补 `app.mjs` 拆分预案（条件触发）。
- 2026-09-26（**批 7 修复轮 #72**——设计评审 §3 轮次 1 发现 5 / 6 / 7）：§4.1 `chat-tool.mjs` 行补**共享导出面**（阈值常量 / `changeTotals` / 降级摘要行构造）· `approval.mjs` 行补**操作区描述符导出**（单一 owner）+ `activity.mjs` 行记复用面 · `dom.mjs` `~120` ⇒ **64** / `chrome.mjs` `~130` ⇒ **101**（实读回填）。
- 2026-09-26（**批 7 修复轮 #72**——设计评审 §3 轮次 1 发现 10 / 11）：在册例外行「清单十档」⇒ **十二档** · 人工走查行 T-DSK21 补卡面「同 `prompt-id` 重挂不夺焦」幂等条。
- 2026-09-26（**批 7 实施后修正轮 #76**——逐号 1 · 档数与落点收正）：§4.1 用例模块行**十二 → 十四档**（名集与 `thincoder-desktop/test/files.mjs` 同序同值；两拆档 `views-locks` / `views-chat-frame` 入枚举）·「300 行 = 主动拆分层」段与「随动面」行两处 U52 落点收正（`桌面 views-locks 用例档`）· 自动面落点补两拆档。
- 2026-09-26（**批 7 实施后修正轮 #76**——逐号 2 · 表格实读回填）：§4.1 产品面十二行按实读回填（`ipc.mjs` / `preload.cjs` / `index.html` / `chat.css` / `pool.css` **77** / `app.mjs` / `i18n.mjs` / `store.mjs` / `chat.mjs` / `chat-tool.mjs` / `approval.mjs` / `activity.mjs`）+ `test/` 行 `files.mjs` **7 → 9**。
- 2026-09-26（**批 7 实施后修正轮 #76**——逐号 2 续 · 标记 / 预案）：三处去「（拟新增）」标记（`pool.css` · `approval.mjs`（含 `chat.mjs` 行内注） · `activity.mjs`）· `:119` 拆档算式加「拆档时」限定 · `app.mjs` 拆分预案段改结（297 未超 300 ⇒ 未触发）。
- 2026-09-26（**批 7 实施后修正轮 #76**——一致性面补遗 · 置焦表述对齐）：§4.1 审批卡面行与 T-DSK21 行「置焦」表述收正为**初始焦点目标** = 最安全键（真置焦执行未落——单源 = `docs/desktop/design/UI.md` §1 审批呈现行）。
- 2026-09-26（**批 8 装配桥批**）：§4.1 增 `thincoder-desktop/renderer/events.mjs` / `thincoder-desktop/renderer/mount-pool.mjs` 两行（拟新增）·
  `thincoder-desktop/src/main/agent-host.mjs` 行职责扩（挂起表 / 回合驱动——「（拟新增）」标记按盘上实态保留）· `ipc.mjs` / `preload.cjs` / `session-slots.mjs` / `chat-scroll.mjs` / `app.mjs` 五行预算与说明随动（白名单 13 项 · 订阅面 · 页处理体 · `guards` 接线 · 池面拆分落形）·
  用例模块行十四 → **十七档** + `files.mjs` 9 → 12 + 自动面落点补批 8 三档 · `app.mjs` 拆分预案改**落形** · §8 本批不做行入册（旧批 1 射程行内失效三项删去）· §10 增 G / H / I / J 四行。
- 2026-09-26（**批 8 修复轮 #79**——设计评审 §3 轮次 1 发现 ⑬ / ⑮）：§4.1 `thincoder-desktop/src/main/main.mjs` 行预算 = **~128**（83 + ~45 接线）；用例模块行三新档预算 = `agent-host` ~200 · `events-reduce` ~180 · `history-page` ~120（单源 = 批次档 §2.3）。
- 2026-09-26（**批 8 doc-check 清项轮**）：本档变更记录批 8 行**行宽收正**（478 → 三行 ≤300）——零语义变更。
- 2026-09-26（**批 8 修正轮 #91**——逐号定点）：§4.1 增四行（`agent-bridge.mjs` **79** / `suspensions.mjs` **76** / `session-io.mjs` **37**——三档自 `agent-host.mjs` 拆出；`events-subscribe.mjs` **61**——自 `events.mjs` 拆出）+ `agent-host.mjs` 行去「（拟新增）」改实读 **203** 并记三出档；
  实测回填（`app.mjs` **297** / `events.mjs` **295** / `mount-pool.mjs` **36** / `thincoder-desktop/test/run.mjs` **41** / `thincoder-desktop/test/files.mjs` **10**）+ `test/` 行补两共享助手注（`fake-dom.mjs` **217** / `slot-sandbox.mjs` **25**——非清单档）+ 两 `test/` 相对路径补全前缀（指针可解析）；
  用例模块行十七 → **十九档**（名序与值列 = `thincoder-desktop/test/files.mjs` 现值同序同值——补 `session-io` / `events-page`）+ 自动面落点行三档 → 五档（U87–U89 / U90–U92 / U96–U97）· 在册例外行「清单十七档」→ 十九档 · `views-locks` 实读 107 → **110** · 拆分预案行 `mount-pool.mjs` 去「（拟新增）」补实读 · §10 增 K / L / M 三行（池窗限 / `subKey` 消费 / `ev:question` 作答通道）。
- 2026-09-26（**批 8 修正轮 #91**——J 行订正）：§10 J 行「实施首步实读订正」→ **已订正**：`effort` 无槽字段 ⇒ 回退配置 `provider.reasoningEffort`（`thincoder-desktop/src/main/session-slots.mjs:112`）· `autoApprove` / `engineering` = 布尔槽 ⇒ 槽值优先（报明 = 批次档 §5.8）。
- 2026-09-26（**批 9 设置面 + 首启向导批**）：§2 增 **KD-10 / KD-11 / KD-12 / KD-13**（写路径 = 核唯一执行体 · 探活口径有意分歧 · 向导闸与表单出口复用 · `locale` = 端无关偏好键）· §3.3 六面 → **七面**（增项目级信息面——`ledger:read` / `batch:status`）·
  §4.1 `settings.mjs` 行拆**四主侧档**（`settings.mjs` ~150 / `providers.mjs` ~140 / `mcp-servers.mjs` ~120 / `project-info.mjs` ~90——否决单档）· 白名单面 **13 → 25**（`ipc.mjs` **130** → ~180 · `preload.cjs` **50** → ~62）· `app.mjs` `store.mjs` `i18n.mjs` `index.html` 四行预算随动 ·
  新档**两**行（`thincoder-desktop/renderer/mount-settings.mjs`（拟新增）~70 · `thincoder-desktop/renderer/settings.css`（拟新增）~120——分档理由 = `styles.css` 实读 284 贴 300 层；`thincoder-desktop/renderer/views/settings.mjs`（拟新增） / `thincoder-desktop/renderer/views/onboarding.mjs`（拟新增）两行系批 7 已在）· 用例模块 **十九 → 二十五档**；
  §6.1 D6–D11 回填批 9 落点（D8 加限定注「读数面 = 另批」）· §6.2 A2 补 `locale` 口径 · §7 增批 9 注 · §8 增本批不做行 · §9 形态行 17 → **20 行**（合计 22）· §10 增 N 行（`memory:status` 归另批）。
- 2026-09-26（**批 9 收正轮**——坐标实核后定点）：§2 KD-12 闸改读数口径（`config:read` 回执 `configured` = 核 `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`；CLI `isConfigured` 口径差**有意、勿统一**）· §4.1 `project-info.mjs` 行相位改**回执形**（`manifest.phase`——无顶层 `phase`）·
  `sessions.mjs` 计数收正 **292 → 291**（§4.1 行与拆分预案行同值）· `thincoder-desktop/renderer/views/onboarding.mjs`（拟新增）行闸同收 · 用例模块行**两段分组**（批 8 五档 ∥ 批 9 六档——19 + 6 = 25）· §6.1 D11 闸 + 入口同收 · §9 形态行 17 → **20**（合计 22）。
- 2026-09-26（**批 9 修复轮 #94**——设计评审 §3 十条逐号 + doc-check 清项）：§7 批 9 注与变更记录批 9 两行**行宽收正**（≤300——零语义）+ 三处前向引用补「（拟新增）」标记（`thincoder-desktop/renderer/mount-settings.mjs` / `thincoder-desktop/renderer/settings.css` / `renderer/views/*.mjs`——盘上未落；与 §4.1 行标记面一致）。
  KD-13 刷新链措辞**随动收正**（「重调 `config:read` + 重刷词表」⇒ 写成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷——**免二跳重调**；单源 = `docs/desktop/design/IPC.md:110` / `docs/desktop/design/RENDERER.md:45`）。
- 2026-09-26（**批 9 闸面自清轮 #96**）：`:49` 行行尾加注记标记「（机检豁免——端侧语汇）」——`configured` / `isConfigured` / `verify` / `project` / `open` 五条符号·窄误锚清零（回执字段名 / CLI 口径名 / 通道名切段·非宿主档符号；零语义、字段名未动）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.12。
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮 · 表十八行逐号落）：§4.1 回填五实读（`thincoder-desktop/renderer/app.mjs` **299** · `thincoder-desktop/renderer/mount-settings.mjs` **458**——在册例外 + 拆分预案；
  `thincoder-desktop/renderer/index.html` **45** · `thincoder-desktop/renderer/i18n.mjs` **293** · `thincoder-desktop/renderer/settings.css` **272**）+ 用例模块行**值列二十五值全换**（实读；批 9 六档 = 213 / 244 / 157 / 124 / 279 / 160）+
  `thincoder-desktop/test/run.mjs` · `files.mjs` **41 / 12** + 共享助手两档 → **三档**（补 `views-harness.mjs` **160**）；
  `views-chrome.test.mjs` 实读 232 → **296** / `views-locks.test.mjs` 110 → **116** · 「唯一越层」→ **两处越层**（+ `mount-settings.mjs` 458）· 六档「（拟新增）」标记清除（`src/main/` 四行 + 视图两档）· §4.1 增批 9 六档 U 号归属与三条注（U95 臂含线上 · `fresh` 清单口径 · 覆盖缺口两件）· §7 增批 9 用例号归属；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
- 2026-09-26（**批 9 修正轮 #9 续**——表补项 21 · §4.1 值列九处回填实读）：`thincoder-desktop/src/main/ipc.mjs` **184** · `thincoder-desktop/src/preload/preload.cjs` **56** · `thincoder-desktop/src/main/settings.mjs` **156** · `thincoder-desktop/src/main/providers.mjs` **128** ·
  `thincoder-desktop/src/main/mcp-servers.mjs` **119** · `thincoder-desktop/src/main/project-info.mjs` **48** · `thincoder-desktop/renderer/store.mjs` **259** · `thincoder-desktop/renderer/views/settings.mjs` **292** · `thincoder-desktop/renderer/views/onboarding.mjs` **160**；
  **口径** = 内容行数（文末换行不计）——三处箭头形（`ipc.mjs` / `preload.cjs` / `store.mjs`）收为单实读值（沿批 9 先例）；`thincoder-desktop/renderer/views/sessions.mjs` **291 ⇒ 292**（§4.1 行与拆分预案行同收；差值 1 = 末空行是否计入）；`:131` 用例模块行尾句改述（值列 = 各档实读现值）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.17。
  **as-of**：`thincoder-desktop/renderer/views/settings.mjs` **292** · 用例模块 `host-floor` **282** · U95 注（`:152`）三处 = as-of 2026-09-26 19:38 现读（#24 在途已改 ⇒ 落定后由父侧机械刷新 = 表补项 22；依据 = 批档 §1.40裁定）；明细同 §2.17。
- 2026-09-26（**批 9 收尾轮 · 表补项 22**——四值刷新 + 缺口一行补）：§4.1 四值实读刷新（`thincoder-desktop/renderer/views/settings.mjs` **292 ⇒ 295** · `thincoder-desktop/renderer/views/onboarding.mjs` **160 ⇒ 161** · 用例模块 `host-floor` **282 ⇒ 284**——`:131` 值列与 `:152` U95 注两落点）；三处 as-of/#24 暂挂注随 #24 落定消解（现为实读值）；
  **补行** `info-row.mjs` **135**（项目级信息行落册）+ `:127` 自述随动（视图构树三档列举）；
  `docs/desktop/design/RENDERER.md` §1 退场口径（属性面）行收正：回路已落（`thincoder-desktop/renderer/views/settings.mjs` `syncHostProps`——三挂载共用）+ `removeAttribute` 两命中实况 + 长驻两面归码面池；该行两行化（≤300）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.18。
- 2026-09-26（**批 A · 对话面板批**——增量落形）：白名单面 **25 → 26**（`thincoder-desktop/src/main/ipc.mjs` / `thincoder-desktop/src/preload/preload.cjs` 同改——`question:respond` 末位）·
  §4.1 `thincoder-desktop/src/main/agent-bridge.mjs` 注入第 4 键 `askQuestion` + `thincoder-desktop/src/main/suspensions.mjs` 四操作 → **五操作** + `kind` 两值（`approval` / `question`）·
  §4.1 新档**三**行 = `thincoder-desktop/renderer/views/question.mjs`（拟新增） / `thincoder-desktop/renderer/views/plan.mjs`（拟新增） / `thincoder-desktop/renderer/mount-composer.mjs`（拟新增）+
  `thincoder-desktop/renderer/index.html` 增 `[data-slot="composer"]` · `thincoder-desktop/renderer/app.mjs` 续拆落形 ⇒ 落回 ~250 ·
  五行随动 = `thincoder-desktop/renderer/events.mjs` / `thincoder-desktop/renderer/store.mjs` / `thincoder-desktop/renderer/i18n.mjs` / `thincoder-desktop/renderer/views/chat.mjs` /
  `thincoder-desktop/renderer/views/sessions.mjs`
  + §4.1 预算贴 / 越 300 层**四面**登记（含 `thincoder-desktop/renderer/views/sessions.mjs` 预案**触发**）· 用例模块 **二十五 → 二十六档**（`views-question`（拟新增））+ `thincoder-desktop/test/files.mjs` **12 → 13**；
  §6.1 D3 / D4 回填批 A 落点（输入区 / 队列写者）· §7 增 **T-DSK22 / T-DSK23 / T-DSK24** 三行 + T-DSK3 注收正（UI 入口已落）+ 批 A 注 · §8 设置面批行删「会话管理 UI 入口」（已落——防读者当活工单）+ 增批 A 不做行 · §9 形态行 20 → **23**（合计 25）·
  §10 删 **G / M** 两行（`msg:*` 视图面 / `ev:question` 只出站——皆已落，防读者当活工单）+ 增 **O / P** 两行（提问挂起池族口径差 / 工程模式 `task` 停用）。
- 2026-09-26（**批 A · ⑤ 标签点按修复轮**——设计先行）：§7 T-DSK20 判据保留「不收 Tab 序」+ 落形指认（两控件 `tabindex="-1"` · 确认态例外 · **零 `inert`**）· 增 **T-DSK25**（标签条点按与加速键——三输入）· 批 A 注补 T-DSK25 机检面 ·
  §4.1 两档消解：`thincoder-desktop/test/views-tabbar.test.mjs` **329 ⇒ ~273**（确认面族 U55 拆 `thincoder-desktop/test/views-tabbar-close.test.mjs`（拟新增 · ~75）——原在册例外消解）+ `thincoder-desktop/renderer/views/sessions.mjs` **292 ⇒ ~200**（标签条面拆 `thincoder-desktop/renderer/views/tabbar.mjs`（拟新增 · ~120——含加速键面））；
  用例模块 **二十六 → 二十七档** + `thincoder-desktop/test/files.mjs` **13 → 14** · 越层计数 **两处 → 一处** · §5 中区外壳面读法与批 A 注收正（走查项含点按切换与加速键）。
- 2026-09-26（**批 A · ⑥ 关标签页随动落形轮**——设计先行）：`docs/desktop/design/RENDERER.md` §1.1 增**页生命周期**四条（页键写者单源 = `openSession` · 关标签 ⇒ 页随动〔关活动走激活同一尾 ∕ 关唯一 ⇒ 关页 `none` ∕ 关非活动 · 拒收 · 待确认 ⇒ 零动作〕· 删除会话 ⇒ 同源出口 · 幽灵更新既覆盖 · 页窗暂留登记）+ §1 索引行 `接线形通则` 补半句；
  `docs/desktop/design/UI.md` 标签条行 / 交互行**只引单源不述**；`docs/desktop/design/PROJECT.md`：`:110` app.mjs 行记关闭尾（`~250 ⇒ ~255`）· `:136` / `:146` 拆档值 `~75 ⇒ ~100`（确认面族 + 页随动四例）；
  §4.1 U95 臂覆盖面拆行 + 批 A 新档**六档**列举补全 · 自动面落点行补 T-DSK26 机检面 · §7 增 **T-DSK26** · §10 增 **Q** 行（页窗暂留 = 既有口径，消解须新需求面）。
- 2026-09-26（**批 A · 关键决策落档**）：§2 增 **KD-14 / KD-15 / KD-16**（`question` 工具 = 同回合内真作答〔新通道 + 桥异步 + 核外待决表〕· 收 Tab 序用两控件 `tabindex="-1"`、**不用 `inert`**〔批档 §1.7 / §1.8〕· 关标签 ⇒ 页随动**尾落接线面** `thincoder-desktop/renderer/app.mjs`〔批档 §1.9〕）。
- 2026-09-26（**批 A · 层别标注**）：§7 **T-DSK3 注**分层——通道面**已落**（批 5）∥ UI 入口 = 批 A **落形 · 待实施**（原句两件事同用「已落」= 混层，读者易把待实施项当已完工单）。
- 2026-09-26（**批 A · 机检面收正**）：§7 批 A 注——T-DSK22 / T-DSK23 机检面补**输入区构树与两态锚**（`桌面 views-chrome 用例档` 原址补例——中区外壳面同档，新词键随入「全量词表键齐」）+ 删误挂的「左列行控件构树」（单源 = §7 T-DSK3 注）· T-DSK25 机检面补**加速键纯函数判定**（原仅登记走查面）。
- 2026-09-26（**批 A · U2 裁定落形**）：`docs/desktop/design/UI.md` **提问呈现行** = 跨会话可见面 ⇒ **标签位含 `approval` 码**（与审批门**同码同词** · 不入池三族）；`docs/desktop/design/PROJECT.md` §10 **O** 行转「已裁定」· §7 **T-DSK24** 判据补徽标行为 · `UI.md` 计划面行删失效表述「本批唯一呈现面」。（**父侧直接执行** · ③ 小改 · 可单独回退 ✓）
- 2026-09-26（**批 E2E · 放行落笔轮** · 次序 = 批 A 后）：`docs/desktop/design/E2E-TESTING.md` 入册（档头 `五档 ⇒ 六档`「另两档 ⇒ 另三档」· §1.1 同收）；需求侧行 `D1–D12 ⇒ D1–D14`
  §4.1 值收正（`thincoder-desktop/package.json` `~45 ⇒ 20 ⇒ 21`——`playwright-core` devDep〔测试面驱动·`dependencies` 零第三方不变〕· `thincoder-desktop/test/files.mjs` `14 ⇒ 15`）
  + §4.1 增两行（`thincoder-desktop/.gitignore`〔新增〕/ `桌面 integration/settings-panel 用例档`〔拟新增 · 集成域〕）· §7 增 **T-DSK27**（E2E 设置面）· §8 增本批不做行 · §10 增 **R** 行 · §4.1 批 A 注长行折行（行宽收正）。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：§4.1 逐号收正——`app.mjs` 落点 `299 ⇒ ~330` + 拆分预案（`mount-sessions.mjs`（拟新增））· 三测试档补登越层 + 拆分预案（`agent-host` ~322 ∕ `views-chrome` ~321 ∕ `store` ~304）· 预算贴「四面」⇒ **八面** ·
  挂起表表项 `{ kind, shape?, key, resolve }`（verdict discriminator = `shape`）· 新档 `mount-cards.mjs` + 换形态态 `railForm` 入册 · `files.mjs` 值 `41 / 12 ⇒ 15` · 行内动作「原址改例」记法 · 随动面七处（`inert` 死注释四 + 换靶三面）；
  §7 判据补（T-DSK22 两失败径 + 错误终局 ∕ T-DSK23 flush 失败留队 ∕ T-DSK24 中断径 ∕ T-DSK25 命中判据 ∕ T-DSK26 五例）· §10 增 **S** 行；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2 修正块。
- 2026-09-26（**批 A 二轮点修**——设计评审 §3 轮次 2 发现 2–6 逐号点修）：§4.1 逐号收正——`thincoder-desktop/src/main/ipc.mjs` `184 ⇒ ~190`（余量按批后重算 ~10 行）· `thincoder-desktop/renderer/store.mjs` `259 ⇒ ~300` + 拆分预案（`thincoder-desktop/renderer/queue.mjs`（拟新增））⇒ 贴 / 越 300 层段 **八面 ⇒ 九面** ·
  另五档补增量（`agent-bridge.mjs` ~85 ∕ `preload.cjs` 57 ∕ `index.html` ~46 ∕ `views.test.mjs` ~215 ∕ `events-reduce.test.mjs` ~190）· `isTurnTail` 判据**吃两通道形**点名 ∕ 提问位标**置位面 = 归约面**点名；
  §7 T-DSK22 补**取文本面**（条目 `title` 逐字原样）+ flush 三码与重触发 · 行宽重排（两行超 300 ⇒ 分句断行，零语义）+ D3 收正（「另四档」列举 5 条路径 ⇒ **另五档**）；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2 二轮点修块。
- 2026-09-27（**批 E2E · 实施后对账轮**）：§4.1 集成用例行去「（拟新增）」+ 值回填 **137** 内容行（已落 · 实读 2026-09-27）· §7 T-DSK27 行态序收正为实证序 `ready,none,ready,ready`（位序 = `providers,model,agent,mcp`）+ 机检面去「（拟新增）」标记（已落）；明细 = `docs/batches/2026-09-26-desktop-e2e-infra.md` §2.11。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§4.1 行数账按盘全量回填（实读 2026-09-27——§5 披露差三档收正：`app.mjs` **222** / `i18n.mjs` **317** / `views-chrome.test.mjs` **392**）· 越 300 段重写（**九档** = 在册例外 `mount-settings` **458** + 本批越层八档，各带拆分预案 / 消解窗口；贴层 `chat.mjs` **289**）·
  新行两处（`mount-sessions.mjs` **197** · `thincoder-desktop/renderer/views/settings-sections.mjs` **206**〔补登〕）· 用例模块 **二十八档** · KD-16 宿主收正（关闭尾住 `mount-sessions.mjs`）· §10 增 **T–X** 五行；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 A 收口尾轮**——只报不写清单落地）：§4.1 行数账两值回填——`thincoder-desktop/renderer/mount-composer.mjs` **251 ⇒ 262**〔实读 2026-09-27〕·
  `桌面 views-chrome 用例档` **392 ⇒ 437**（越 300 软线 ⇒ 补拆分点登记——新档须动 `thincoder-desktop/test/files.mjs` / `thincoder-desktop/test/run.mjs`、只登记不建新档）；
  明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.14。
- 2026-09-27（**批 B · 会话级偏好 / 档位枚举化 / 占用读数 / 附件与复制**——设计落笔轮）：§2 增 **KD-17 … KD-22**（`effort` 入槽顶层字段 + `saveSession` 须携带 · 档位枚举双面 + `model:list` 补逐模型 `effortEnum` 投影 · 施加径 = 写盘 → 重施〔在飞拒 `busy` 零写〕·
  占用读数 = 回合尾 `ev:usage` 推〔未至 ⇒ 零节点〕· 附件 = 渲染面零 fs〔`dataURL` → 主进程落盘 + 核 `appendImagePointer`〕· 复制 = 块级 + 末条）；
  §4.1 值列随动十二处（`ipc.mjs` **195 ⇒ ~197**〔余量 3 行〕· `agent-host.mjs` **204 ⇒ ~219** · `session-slots.mjs` `~120 ⇒ **135** ⇒ ~137`〔估值收正〕· `settings.mjs` **156 ⇒ ~160** · `preload.cjs` **57 ⇒ 58** · `events.mjs` **338 ⇒ ~344** ·
  `store.mjs` **310 ⇒ ~313** · `thincoder-desktop/renderer/views/chat.mjs` **289 ⇒ ~291** · `thincoder-desktop/renderer/views/chrome.mjs` **101 ⇒ ~129** · `thincoder-desktop/renderer/views/settings-sections.mjs` **206 ⇒ ~215** · `mount-composer.mjs` **262 ⇒ ~282** · `i18n.mjs` **317 ⇒ ~327**）
  + 新档**四**（拟新增：`thincoder-desktop/renderer/attach.mjs` ~90 · `chat-copy.mjs` ~40 · `thincoder-desktop/test/session-prefs.test.mjs` ~140 · `thincoder-desktop/test/views-attach.test.mjs` ~160）+ `thincoder-desktop/test/files.mjs` `15 ⇒ 17`
  + 用例模块 **二十八 ⇒ 三十档**（§4.1 两处计数同改——D3）；
  §4.2 补核面三档（`thincoder-core/session.mjs` · `session-slot-write.mjs` · `session-lifecycle.mjs`——授权 = 批次档 §1.2）+ 三文档行（`docs/core/design/SESSION.md` §6.21 · `docs/desktop/design/IPC.md` · `docs/desktop/design/UI.md`）；
  §6.1 表头 `D1–D12 ⇒ D1–D14` + 补 **D13 / D14** 两行 + 表外一项（需求 §3.5 项 7 未编 D 号）+ D6 行补批 B 落点 · §7 增 **T-DSK28 / T-DSK29 / T-DSK30** 三行 + 批 B 注（机检面逐条点名）· §8 增本批不做行 · §9 补批 B 四项落形指针（行数不变）· §10 **J** 行再订（`effort` 入槽 ⇒ 槽值优先）· **X** 行 ② 转「设计已落」· 增 **Y / Z / AA** 三行；
  单源 = `docs/core/design/SESSION.md` §6.21（核面判据句 1–5）· `docs/desktop/design/IPC.md` §2（契约）· `docs/desktop/design/UI.md` §1 批 B 注（形态）；明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：需求侧 D 号 `D1–D14 ⇒ D1–D15`（档头 / §4.2 `IPC.md` 行 / §6.1 表头三处同收；表外一项 ⇒ **D15 行**——说明行删）· §2 KD-18 收正（逐模型元素投影 `{ id, effortEnum, thinkOff }` · `thinkOffPath` 单源 · 表外档位字面串归一 `null`——被否候选补「候选面恒含 off」）；
  §4.1 收正——`events.mjs` / `events-subscribe.mjs` 两行九 ⇒ **十通道** · `events-subscribe.mjs` **68 ⇒ ~70**（补登随动档）· `thincoder-desktop/renderer/views/settings.mjs` **295 ⇒ ~296**（批 B 值列十二 ⇒ **十三处**）·
  消费面点名（`thincoder-desktop/renderer/views/settings-sections.mjs` 补 off 在场判据 · `thincoder-desktop/renderer/views/chrome.mjs` / `store.mjs` 候选取逐项 `.id`）· 三测试档估增（`settings` +~4 / `events-reduce` +~4 / `views-chrome` +~6——贴层判据）；
  §6.1 D6 行收正（元素投影 + `thinkOff` + 归一 `null`）· §7 T-DSK7 补候选随动 / T-DSK28 补四例（不可 `off` 模型 · 只送 `provider` / `slot-missing` / `bad-key` / 归一 `null`）· T-DSK30 ④ 补取文源（末 `assistant` 块）·
  批 B 注同步 · §10 AA 转**已随动** · §8 贯穿不做行与 A4 / 批级判据 ④ 补「不改核**机制语义**（批 B 纯加法三处，授权在案）」。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 设计修订轮 · ⑥ 设置面档位控件**）：§2 KD-18 增设置面半（写面意图级载荷 `{ tier }` · 键协议统一式 · 现值 `provider:list` 行投影 · 表外现值自成一选项 · 控件零节点判据 · 两拒绝码——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）；
  §4.1 收正（`settings.mjs` **174** 实读 ⇒ ~205 · `providers.mjs` ⇒ ~140 · `thincoder-desktop/renderer/views/settings-sections.mjs` ⇒ ~235 · `mount-settings.mjs` 458 ⇒ ~430 + 拆档落形〔向导族拆 `mount-onboarding.mjs`〕+ 例外续期）；§6.1 D6 补 ⑥ 判据 · §7 增 T-DSK31（机检豁免——用例退场登记） · §9 批 B 落形扩 ⑥ ·
  `docs/desktop/design/UI.md` §1 设置面行 + 批 B 注项 5 · `docs/desktop/design/IPC.md` §2 两行 + 项 9「档位控件注」。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮 · 续**——实施后随动收正 · 数值对盘）：§4.1 全表按批 B 末实读回填（含新登行五：`mount-head.mjs` **147** / `attach.mjs` **146** / `chat-copy.mjs` **133** / `views-chrome-vocab.test.mjs` **291** / `agent-host-usage.test.mjs` **183**）·
  越 300 段重写（**十档** = 例外一 `mount-settings` **426**〔距硬限 74〕+ 越层九：`styles` 340 / `events` 351 / `i18n` 356 / `store` 313 / `mount-composer` 348 / `views-settings.test` 446 / `views-question.test` 359 / `store.test` 334 / `views-tabbar-close.test` 317——`views-chrome.test` 拆档后 **258** 除名）·
  贴层 = `thincoder-desktop/renderer/views/chat.mjs` **292** ·
  §4.2 补登四行（`SHELL.md` / `RENDERER.md` / `CORE-UNIFICATION.md` / 本档）· §6.1 坐标收正（`session-slot-write.mjs` `:134`/`:125`/`:40` ⇒ `:140`/`:131`/`:46` · `session-lifecycle.mjs` `:77` ⇒ `:81`〔档位支 `:176-:190`〕）·
  §7 补**批 B 用例号归属 U127–U150** + 去「拟新增」与估值残留（实读 **146** / **133** / **147** / **88**）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 追加轮 · 首启引导与冒烟**）：§4.1 值列收正（`app.mjs` **243 ⇒ 247** · `i18n.mjs` **356 ⇒ 360** · `thincoder-desktop/renderer/views/chat.mjs` **292 ⇒ 290** · `thincoder-desktop/test/files.mjs` **19 ⇒ 21**）+
  新档**两**行（拟新增 · `renderer/views/chat-guide.mjs` **~50** · `test/views-chat-guide.test.mjs` **~70**）；
  + 集成行**一**（`integration/first-run-smoke 用例档` **~140**）+ 用例模块 **三十四 ⇒ 三十五档**；§6.1 D11 / D14 验证面补 T-DSK32 · §7 增 **T-DSK32** + T-DSK26 ② 收正（`none` 态 = 零块节点 + 引导节点）· §8 增本批不做行 · §9 落形指针（行数不变）· §10 **Z** 行转「追加轮增一例」；
  §4.2 补 `docs/desktop/design/E2E-TESTING.md` 行 + 三行随动；单源 = `docs/desktop/design/UI.md` §1 批 B 追加注 · `docs/desktop/design/E2E-TESTING.md` §3.5。
- 2026-09-27（**批 B 追加轮 · 回指锚补**——父侧裁定）：§6.1 补 **D16 行**（首启空态引导）+ 表头 **`D1–D15 ⇒ D1–D16`**；**同族书证随动**（D 号口径「诸处同改」）：档头 `:6` / §4.2 `IPC.md` 行 `:218` /
  另四档档头（`docs/desktop/design/IPC.md` / `RENDERER.md` / `SHELL.md` / `UI.md`）；依据 = `docs/desktop/requirements/PROJECT.md` §4 **D16**（同刻落地 ⇒ 三链同源补中环）。
- 2026-09-27（**批 B 追加轮 · 修正轮**——设计评审 §3 轮次 1 逐号点修）：§6.1 **D16 行**收正（`none` 态记法 ⇒「零块节点 + 引导节点」+ 机检面）· §7 **T-DSK32** 行重写（**十二序**：向导退场 / 族档夹具 / 真点最近目录项 / 关唯一标签 / 引导面真点）
  · §4.1 收正（`thincoder-desktop/renderer/views/chat.mjs` **292** 实读 + 方向断言删；`views-chat-guide.test.mjs` 归末位〔名序与 `thincoder-desktop/test/files.mjs` 同序〕；`views-chrome-vocab.test.mjs` 实读 **291**；用例模块行补随动两笔〔vocab / host-floor〕）·
  §8 行收正（需求档 **D16** 已落）· 集成行「十一序 ⇒ 十二序」· 明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.10。
- 2026-09-27（**批 B 追加轮 · 注记修正轮 #106**——设计评审 §3 轮次 2 注记 N1 / N2 落）：§4.1 集成行 + §4.2 `E2E-TESTING.md` 行序数记法收正为**十二序**（单源 = `docs/desktop/design/E2E-TESTING.md` §3.5）；
  §4.1 贴 300 层行数值收正 **292**（`thincoder-desktop/renderer/views/chat.mjs` · 批 B 末实读）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.11。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**——数值按盘回填）：§4.1 值列收正（`app.mjs` **247** · `i18n.mjs` **363** · `thincoder-desktop/renderer/views/chat.mjs` **299**〔批 B 末 292〕 · 集成行 `first-run-smoke.test.mjs` **171**）· 新档两行去「拟新增」（**54** / **110**）· `thincoder-desktop/test/files.mjs` **19**（两新档名打包入既有行 ⇒ 净 0）· 另触碰三档入表；
  越 300 段标题 ⇒「批 B 追加轮实读（未触碰者承批 B 末实读）」· 段内 `i18n.mjs` **363** · 贴 300 层行 **299** · 随动两笔实读（`views-chrome-vocab.test.mjs` **298** · `host-floor.test.mjs` **294**）；
  §6.1 **D16** 行机检面两档去「拟新增 / 待实施」· §7 **T-DSK32** 机检面「待实施」⇒「已落」（**171**）· §7 **T-DSK3 注**「落形 · 待实施」⇒「已落」· §7 U 账补**批 B 追加轮用例号归属 U151** · U 账段行拆三行（480 ⇒ ≤300，零语义）；明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
- 2026-09-27（**可见面修复批 · 设计轮**）：§2 增 **KD-23 / KD-24**（用户块出泡时刻 = `msg:send` 回执 `ok` 真〔受理即出〕——含失败边界与三被否候选 · 流式游标清点两族 + 块面引用刷新径）；
  §4.1 值列九行随动（`chat.css` **254 ⇒ ~296** · `events.mjs` **351 ⇒ ~363** · `mount-composer.mjs` **348 ⇒ ~362** · `app.mjs` **247 ⇒ ~251** · `mount-settings.mjs` **426 ⇒ ~427**）；
  另四档（`thincoder-desktop/renderer/views/chat-tool.mjs` ~131 · `thincoder-desktop/renderer/views/activity.mjs` ~176 · `thincoder-desktop/renderer/views/approval.mjs` ~155 · `thincoder-desktop/renderer/views/plan.mjs` ~45）+ 越层段补**预案补登**（两档——`questions.mjs` ∕ `composer-send.mjs`，归父侧裁）；
  §4.2 补三行（本档 + `docs/desktop/design/UI.md` + `docs/desktop/design/RENDERER.md`）· §6.1 D3 / D10 补本批修判据 · §7 T-DSK22 补用户块 clause（T-DSK32 ⑩⑪ **原形不动**——零缩水）· §10 增 **AB / AC / AD** 三行（降级径一行差 · 需求侧建议·只报 · 两越层档拆档）；
  单源 = `docs/desktop/design/UI.md` §1 本批注（形态逐处）· `docs/desktop/design/RENDERER.md` §1.1 三条（工艺）；明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2。
- 2026-09-27（**可见面修复批 · 修正轮 1**——设计评审 §3 轮次 1 逐号点修）：§10 **AC** 行转**已随动**（需求档 D3 判据补句——`docs/desktop/requirements/PROJECT.md:111` + `:179`）· 增 **AE** 行（在飞回合内切回 ⇒ 本回合用户块不在页读——窄窗登记，消解路 = 无 ∕ 另裁）·
  §7 T-DSK22 块位措辞统一「尾块 = 本回合首个块」· §8 增本批不做行（#426 ∕ #440 ∕ 核零触碰）。明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2.9。
- 2026-09-27（**可见面修复批 · 实施后对账 · 父侧直接执行〔例外②③〕 · 可 revert**）：§4.1 三行按盘回填（`events.mjs` **369** · `thincoder-desktop/renderer/views/chat-tool.mjs` **135** · `thincoder-desktop/renderer/views/activity.mjs` **177**——±~ 估值转实读）；§10 **AD** 行同判；零语义。
- 2026-09-27（**对齐重定位批 · 设计轮**）：§2 增 **KD-25…KD-28**（状态行对齐 CLI 口径 · 右列 = 子 agent 面板 · 会话流经共享渲染核（含「零 Markdown」改判）· 元数据族）；§4.2 增十行（核包 / 两端接入面 / 桌面实施面）；
  §6.1 表头 `D1–D16 ⇒ D1–D20` + 补 **D17–D20** 四行；§7 增 **T-DSK33–T-DSK36**；§8 增本批不做行；§9 落形指针（行数不变）；§10 **K / Y** 两行转「已裁」+ 增 **AG / AH / AI** 三行；§6.2 A4 补接核例外句；
  核面单源 = `docs/render-core/design/RENDER-CORE.md`（本档 §2 KD-27 指针）；明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2。
- 2026-09-27（**对齐重定位批 · 设计评审轮 1 点修**）：§4.1 越层段补**本批触碰登记**（越层三档 + 贴层一档——数值 = §4.2 本批行，单源）；§4.2 本批行补**逐档「现行 ⇒ 预期」**（新增 agent-host / renderer 六档 / 样式档等行；指针不再悬空——§6 ↔ §4.1 环解）；
  §6.1 D20 行补出生自愈句；§7 **T-DSK34** 机检档名收正（`sessions.test.mjs` ⇒ `session-contract.test.mjs` 原址补例——盘上不存前名，实读收正）· **T-DSK36** 补⑤出生自愈判据 + ③实收值收正（`cancelled`）。明细 = `docs/batches/2026-09-27-desktop-ui-alignment.md` §2.11。
- 2026-09-27（**R1 结算随动 · 设计面收正微轮**）：§4.1 两行按盘回填（`thincoder-desktop/src/main/window.mjs` **130 ⇒ 136** · `thincoder-desktop/src/main/protocol.mjs` **68 ⇒ 88**——render-core R1 末实读）；零语义。
- 2026-09-28（**R3 结算随动 · 设计面收正微轮**——承 `docs/batches/2026-09-27-render-core-r3.md` §1.2–§1.4 / §5）：§4.2 本批各行按实读回填（agent-bridge 174 · agent-host 300 · ipc 214 · preload 58 · sessions 37 · events 500 · store 328 · i18n 407）；
  chrome 163 · activity 248 · chat.mjs 280 · chat-stream 77 · chat-tool 138 · views/sessions 286 · mount-pool 57；新档行六（statusline 256 / mount-status 24 / subagent-face 86 / chat-text 70 / chat-cards 51 / core.css 140）+ `styles.css` 随动行（374）；
  KD-26 / KD-27 与 §6.1 D4 / §7 T-DSK5 措辞收正（工具名仅作分流判据 · 块面无工具位——D20 单源；「换接核件」= 渲染逻辑单源）；§7 补 T-DSK37 行；自铸用例号口径 `U152 起 ⇒ U154 起`。零语义（数值与措辞随实读 / 裁定）。
- 2026-09-28（**D21 会话流 / 会话面板视觉对齐批 · 设计轮**）：§2 增 **KD-29**（内容面 / 会话面板视觉对齐 VSC——值源与三律 · 结构零动 · 端差 3 项）；
  §4.1 `styles.css` 行值收正（**340 ⇒ 374**（R3c 末实读）⇒ 本批 **~420**——在册越层 · 拆档窗口到 = §10 **AL**）+ 越层段同笔；§4.2 增五行（`core.css` **141 ⇒ ~240** · `styles.css` **374 ⇒ ~420** · 核档 §5 · `UI.md` · 本档）；
  §6.1 表头 `D1–D20 ⇒ D1–D21` + 补 **D21 行**；§7 增 **D21 注**（值落点锁 / 真机读数 / 人工走查三面——测试档随修随加 · 不占条目）；§9 落形指针（行数不变）；§10 增 **AL / AM / AN** 三行；
  值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（内容面 21 面）/ `docs/desktop/design/UI.md` §1 本批注项 2（会话面板 9 面）；明细 = `docs/batches/2026-09-28-desktop-vsc-visual-parity.md` §2。
- 2026-09-28（**D21 视觉批 · 设计评审轮 1 点修**——逐号）：§4.1 `events.mjs` 值收正 **351 ⇒ 369 ⇒ 500**（= 硬限顶格——R3a–R3c 后实读）+ 越层段同笔；
  §4.1 用例模块行 ⇒ **四十一档**（补六新档 + 值列——`agent-host-subagent` / `events-subagent` / `agent-bridge-subagent` / `views-rail-actions` / `views-chat-text` / `views-statusline`；`views-locks` 收正 **190**）；
  §4.1 集成域补 `chat-render.test.mjs`（**146**）一行 + `run.mjs` / `files.mjs` 值按盘刷新 **43 / 21**；§4.2 补两行测试档（`views-locks` **190 ⇒ ~210** · `chat-render` **146 ⇒ ~160**——D21 原址补例）；
  §4.2 `core.css` 基线 141 ⇒ 收正 **140**（口径 = 内容行数 · 文末换行不计）；§10 增 **AO** 行（需求档 D17 / D19 两句落点 = 残余批）。零新语义。
- 2026-09-28（**桌面残余批（desktop-residuals）· 设计补写轮**——冻结解除后补落）：§4.2 增本批行 **17**（code / test 13 + 设计档 4——`session-lifecycle.mjs` 352 ⇒ ≈386 · `session.mjs` 254 ⇒ 255 · `session-slots.mjs` 154 ⇒ ≈195 · `events.mjs` 500 ⇒ ≈470〔在册拆分预案执行〕· `chat-text.mjs` 70 ⇒ ≈82 · 新档四〔拟新增〕· `files.mjs` 21 ⇒ 22）；
  §7 增 **T-DSK38** 行 + **残余批注（D17 / D19 · 验收面）**（值落点锁 / 同源对拍 / 深度对拍 / 真机四面）；§10 增 **AP–AR** 三行（用例号自铸 / `session:create` 空种 / D17 补句措辞上抛）；明细 = `docs/batches/2026-09-28-desktop-residuals.md` §2。
- 2026-09-28（**桌面残余批 · 设计评审轮 1 修正**——发现 3 / 4 / 6 / 7 逐号点修）：§4.1 越层段 + §4.2 `events.mjs` 行补**拆后处置**（≈470 仍越 300 ⇒ 续期 + 新预案 = 页读径拆出）· §6.1 D17 / D19 补 T-DSK38 · §6.2 A4 补残余批句 · §7 残余批注增 ⑤ 时序例 · §8 / §9 补本批随动 · 指针批名限定。明细 = `docs/batches/2026-09-28-desktop-residuals.md` §3。
- 2026-09-28（**状态栏对齐批 · 设计轮**——「屏面为准」重审）：§2 增 **KD-30**（屏面为准重审：banner 四态上状态行 + 会话头回三值）+ **KD-25 收正**（16 段 / 键位组逐件）；
  §4.2 增本批行（code / main 九档 + 测试面 + 设计档行）；§6.1 表头 `D1–D21 ⇒ D1–D22` + 补 **D22 行**；§7 增 **T-DSK39** 行；§10 增 **AS / AT** 两行（用例号自铸 / 桌内翻转刷新 open）；
  需求档 §3.1:47 / :52 收正 = **父侧同笔**；明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**状态栏对齐批 · 设计评审轮 1 修正**——发现 2 / 3 / 5 / 6 / 8 / 9 / 10 逐号点修）：§2 KD-25 四项改记**已落（R3a）**（读数槽四·载荷扩）· KD-30 补**就绪入闭枚举**（6 词 ⇒ 7 词——词形来源 = CLI 静息值 `Ready`）；
  §4.1 增 **R3 期六档行**（`statusline` / `mount-status` / `subagent-face` / `chat-text` / `chat-cards` / `core.css`）+ `agent-host` 行收正（**300 ⇒ 拆分执行后 ≈210**——装配面拆 `agent-assemble.mjs`（拟新增 · **消解窗口 = 本批实施轮**））+ 越层段补本批四档行 + 三值按盘收正（`ipc` **214** / `run.mjs`·`files.mjs` **43 / 22** / `session-slots` **180**）；
  §6.1 **D17 行**改记已落 · §7 **T-DSK33** 机检面改指已落 `views-statusline.test.mjs` + **T-DSK39** ① 步点名真点路径与夹具前置 · §10 **AH** 转已落（收口）· **AN** 收正五处 ⇒ `D1–D23` · **AT** 转已裁（并入本批——桌内翻转即时刷新）；档头需求侧行 `D1–D21 ⇒ D1–D23`。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**§4.1 按盘回填 · 父侧直接执行〔可 revert〕**——承修正轮 #30 登记「批间未回填」）：七行旧值按盘收正（`agent-bridge` 77 ⇒ **174** · `sessions` 34 ⇒ **37** · `events` 500 ⇒ **473** · `i18n` 363 ⇒ **407** · `store` 313 ⇒ **328** · `chrome` 239 ⇒ **163** · `activity` 177 ⇒ **248**）+ 越层段两行（`:185` / `:186`）同拍。**零语义**（纯读数）。
- 2026-09-28（**评审轮 2 收尾 · 父侧直接执行〔可 revert〕**——承评审 #32 轮 2 发现 1 / 4）：§4.1 `session-slots` 行 = **180**（实读 2026-09-28——残余批落）+ §4.2 残余批行同笔注实施后实读 · §6.1 表头 `D1–D23` + **D23 行**补落（列表计数不撒谎——桌面 = 段缺席 / CLI·VSC = 「—」；映射面由此闭合，注销「归台账可靠批」延时项）。**零新语义**（读数与映射转写）。
- 2026-09-28（**view 座实施后随动 · 父侧直接执行〔可 revert〕**——承实施座 #36 上抛）：§4.1 用例模块行注按盘回填（`host-floor` **301** · `views-chrome-vocab` **318** · `views-statusline` **298**）+ 越层段补两档行（>300 登记 + 预案）；**零语义**（纯读数）。
- 2026-09-28（**账本可靠批 · 桌面微轮 · 设计轮**——F-L4 桌面端落点，承 `docs/batches/2026-09-28-ledger-reliability.md` §1.6 + §2 微轮块）：§4.1 越层段补**本批六档 + 随动两档行** · §4.2 增本批行（code 四档 + 测试面三档 + `files.mjs` + 设计档一行）· §6.1 **D23 行**补账本警示面 · §7 增 **`T-DSK40`** 行 · §10 增 **AU / AV / AW** 三行；明细 = 批档 §2 微轮块。
- 2026-09-28（**状态栏对齐批 · flags 供面口径修订轮**——实施座实测上抛 + 父侧裁定）：§7 **`T-DSK39` 行**夹具按**可达态**改**两臂**（主臂 = `engineering:true ∧ planMode:false`〔四真不可达——实读 `thincoder-core/session-lifecycle.mjs:126-133`〕· 第二臂 = `planMode:true ∧ engineering:false`）+ ② 断言随臂收正 + 夹具补 `title` 一条；
  口径面（`flags` 活值优先 / 槽投影）单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 3（本档零复述）。明细 = `docs/batches/2026-09-28-statusline-align.md` §2。
- 2026-09-28（**外壳视觉降噪批 · 登记面收尾轮**——设计面点修）：§6.1 表头 `D1–D23 ⇒ D1–D24` + 补 **D24 行**（回指需求 §4 D24 · 单源 = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」· 验收三件）；档头需求侧行同收 **D1–D24**（同族书证随动：`docs/desktop/design/IPC.md` / `RENDERER.md` / `SHELL.md` 三档 `:4` 同拍）；
  §4.1 本批触碰段 + 四档 CSS 行值收正（**463 / 300 / 78 / 273 ⇒ ≈481 / ≈310 / ≈84 / ≈289**）；`chat-render` 行值按盘收正（**146 ⇒ 176 ⇒ ≈212**）；§4.2 本批行八（CSS 四 + 测试两 + `docs/desktop/design/UI.md` + 本档）；
  §10 增 **AX** 行（自铸用例号披露——用例行随测试档修加）+ **AN** 行随收 **D1–D24**；测试档随修随加——不进设计面条目（2026-09-27 裁定）。明细 = `docs/batches/2026-09-28-desktop-shell-denoise.md` §2。
- 2026-09-28（**对齐第二批 · 六件 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-align-2.md` §1）：§2 增 **KD-31 / KD-32 / KD-33**（排队可见面 + 队列分键 · 核件直消费 + `setStrings` · 折叠 + 归档入流）+ **KD-23 / KD-26 两处收正**（入队径出泡 / 内容回显 / 归档口径）；
  §4.2 增本批行（code / main 十六行——含在册拆分预案本批执行一件）；§6.1 **D19 / D20 两行补本批句**；§10 增 **AY / AZ / BA** 三行；
  单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」· `docs/desktop/design/IPC.md` §1（`ev:subchunk`）· `docs/render-core/design/RENDER-CORE.md` §4 / §5 / §9 / §10。
- 2026-09-28（**账本可靠批 · 报告面收正轮 · eng-designer**——承三座报告面父侧处置项：状态栏 wiring / 端座 / 桌面警示面）：
  §4.1 按盘实读刷新（实读 2026-09-28——两座落）：`ipc` **221** · `agent-host` **254** + 新档 `agent-assemble` **95** · `session-slots` **195** · `sessions` **45** · `styles.css` **466**；
  续：`app.mjs` **254** · `events` **494** · `mount-pool` **60** · `i18n` **423** · `store` **333** · `views/sessions` **295** · `chrome` **164** · `statusline` **269** + 新档 `statusline-banner` **25** · `mount-status` **26**；
  §4.1 用例模块值列受触档刷新 + 集成域补两行（`statusline-align` **142** / `ledger-notice` **121**）；越 300 层段刷新 + 补登三档（`agent-host.test` **338** · `session-contract.test` **319** · `events-reduce.test` **312**——各带预案）；
  §4.2 两座行按盘收正（含新档两行 + 表外四档）· §7 机检面三处去「拟新增」/ 值收正；明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2.12。
- 2026-09-28（**桌面空闲唤醒批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-idle-wake.md` §1）：§2 增 **KD-34 / KD-35 / KD-36**（挂起驱动 = 消费核件 · 完成提示面 = 失焦通知两档 · 挂起 ∕ 消化可见面 = 两通道 + 段 3 三态）；
  §4.2 增本批行（main 五档 + renderer 八档 + 测试面 + 设计档 + UI.md 门控行）；§6.1 **D4 行补本批句** · **§10 S 行转已消解**（D4「挂起态与 digest」两落点定形）· 增 **BB / BC / BD** 三行（turn-cap 缺口 ∕ 附件输入边界 ∕ UI.md 门控）；核档三处「桌面无挂起窗」收正随批（`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`）。
- 2026-09-28（**对齐第二批 · 修正轮 1**——设计评审 §3 轮次 1 发现 3 / 4 / 5 / 9 / 10 / 11 逐号点修）：§2 KD-31 消费面清单收正（两导出——`planBusyQueued` / `clearPending` 不消费）；§4.1 `events-subscribe` / `thincoder-desktop/renderer/views/chat.mjs` 两行按盘回填（**69** / **280**）+ `chat.mjs` 行「块五型」⇒「**块六型**」；
   §4.2 本批表「现行」列五处同 as-of 回填（events **494** · store **333** · chat.css **300** · 拆前 / 拆后算式收正 ⇒ 拆后 ≈380）+ 新档计数补**拆分产出 2**；§6.1 **D4 / D20 两行** + §7 **T-DSK5 / T-DSK22 / T-DSK36** 三行收正（内容回显 / 归档入流 / 条目 `text` / 可见面）+ §10 **K 行**转已消解。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**§4.1 贴层行按盘收正 · 主 agent 落笔**〔父侧直接执行 · 可 revert〕——承对齐第二批评审批次轮 2 发现 13〔新 🔵 · 非阻断〕）：`:203` `thincoder-desktop/renderer/views/chat.mjs` **299 ⇒ 280**（R3c 卡构树已拆出 `thincoder-desktop/renderer/views/chat-cards.mjs` **51**）+ 预案句收正（预案已执行 ⇒ 改「已拆出」）。
- 2026-09-28（**对齐第二批 · 复核轮收正轮 · eng-designer**——承批档 §3 轮次 3）：KD-32 取词接线改述（**注册单点** = `thincoder-desktop/renderer/app.mjs`——`setStringsSink` 一次注册；`initDict` 合并式经注册端出）；KD-33 失效句删（「原「下回合起清出」退场」）；
  §4.1 越层段删「（原「预案待定」）」· §4.2 本批表 `i18n` / `app.mjs` 两行接线口径随拍 + `app.mjs` 行并入修复轮增量（**254 ⇒ ≈259**）；§10 增 **BE** 行（通道计数随动面——发现 7 二择一取在册登记）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**桌面空闲唤醒批 · 评审轮 1 修正 · eng-designer**——§3 轮次 1 发现 1–12 逐号点修〔裁定 = 批档 §1.10〕）：通道计数以盘面实读定权威数（**13**——`thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` ∧ 订阅表；本批 = **13 ⇒ 15**）+ 残句清九处 · 本批表三行计数 + 测试面断言数收正；
  §2 增 **§2.2 挂起窗键面路由注**（dispose 触发面对照表 / 非同键处置 / 会话钉定 / 跨键互斥）· KD-34 补核侧实读坐标 ∥ KD-36 优先序随态机单源；§4.2 `i18n` 行计账随主进程自持（+3 键）· §7 增**桌面空闲唤醒批注**（机器面点名 + 真机面 = 人工走查 + 父侧真跑闭合）；
  §10 **BE** 行随正；发现 2 = **Deferred**（align-2 结算后回填——盘面实读已备：`events.mjs` 349 / `page-read.mjs` 96 / `i18n.mjs` 470 / `thincoder-desktop/renderer/views/chat.mjs` 280 / `statusline.mjs` 269 / `chat.css` 315）。明细 = `docs/batches/2026-09-28-desktop-idle-wake.md` §2。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-align-3.md` §1）：§2 增 **KD-37 / KD-38 / KD-39**（错误横幅重试 = 端侧重发末 `user` 块 · 台账行 = 开项目链一次 · 文件链接 = 宿主验存链 + `file:open`）；
  §4.2 增本批行（main 六档 + 新档一 + renderer 拾余档 + 测试面 + 设计档）；§6.1 五行随注（D3 / D5 / D6 / D13 / D19——含 **D19「文件链接不承载」收正为「承载」**）+ 批注段；§7 增 **T-DSK42 / T-DSK43** 两行 + T-DSK37 块序收正；§10 增 **BF–BI** 四行。明细 = 批档 §2。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 修正轮 1 · eng-designer**——评审轮 1 逐号点修〔1–15〕）：§4.1 四行现值按盘收正 + 越层段补登三档（`chat.mjs` **341** / `core.css` **336** / `settings-sections` **291**——各带预案与消解窗口）；
  §4.2 本批行收正（i18n 落拆——第二档 `renderer/i18n-views.mjs`（拟新增）· styles.css **≈499** + 硬限余量句 · `suspensions.mjs` 行补登 · 台账行出站落 `project-info.mjs`）；§6.1 **D10 行**与批注段随注（六行）；§7 **T-DSK42 / T-DSK43** 两行断言面二分；失效表述残体清三处（D19 / T-DSK35）。明细 = 批档 §2 修正轮 1 块。
- 2026-09-28（**桌面空闲唤醒批 · 收尾微轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-idle-wake.md` §5 舱 A 上抛 ①②）：① KD-34 补**残输入兜底 = 普通回合续发**（VSC 形——两窄径 = 窗退出等待期中落槽 ∥ 消化轮非 Abort 失败）；
-   ② §4.1 三新档入册（`suspension-drive` **157** · `notify` **47** · `turn-face` **52**）+ 四档按盘收正（`agent-host` **285** · `main` **104** · `ipc` **224** · `preload` **58**）+ 用例模块行 **四十二档**（新档 **232**——两向自检在册）· 越层段 `host-floor` **313**（消解窗口已到——二择一给由在册）；§4.2 本批表三行落值 + 三档收正 + 测试面两注。明细 = 批档 §2.11。
- 2026-09-28（**对齐第三批 · 小修族 25 + 相抵 2 · 微收正轮 · eng-designer**——承批档 §3 轮次 2 新发现 **#17**）：§6.1 批注段与 §7 `T-DSK42` 行断言面同拍收正——「文件链接」由**离线可产**改标**离线不可产**（并入「人工走查 + 父侧真跑闭合」组）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-3.md` §3 轮次 2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2 · 台账 #446 + #445）：§4.2 增本批行（桌面面「现行 ⇒ 预期」十行 + 测试面——读数 = 核档 §6.30.13）；
  §10 BE 行随动（计数现值 **15 / 17** 两档分立）+ 增 **BJ** 行（`T-DSK44` 自铸披露）；设计档面六加一已落（明细 = 核档 §6.30.13 末块）。明细 = 批档 §2。
- 2026-09-28（**回合中插入批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-midturn-input.md` §2 · 台账 #509）：§2 增 **KD-40**（忙态入队 = 宿主单源 + 步边界取批注入 + 回合尾续发；含被否候选五条）+ §2.2 忙态排队面随动句（队列先于接管）；
  §4.1 本批触碰档（就地给数——含新档 `thincoder-desktop/src/main/queued-input.mjs`（拟新增） + 拆分产出 `thincoder-desktop/renderer/composer-send.mjs`（拟新增））+ §6.1 「回合中插入批」验收注（拟 D25 + T-DSK45 + 机检面）；§10 增 **BK–BM** 三行。
  通道面（`ev:queue` + `msg:send` 忙态受理）落 `docs/desktop/design/IPC.md` §1 / §2；归约与用户块条落 `docs/desktop/design/RENDERER.md` §1.1；形态面落 `docs/desktop/design/UI.md` §1 本批注。明细 = 批档 §2。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #28 发现 #3）：§10 BE 行计数重锚（IPC.md §1 = **18**——含在途 `ev:queue`；同值链 15 ⇒ 16 ⇒ 17 ⇒ 18）。明细 = `docs/batches/2026-09-28-timer-wake-phase2.md` §3。
- 2026-09-28（**回合中插入批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #29 发现 #1–#12 处置）：KD-31 / §4.1 store ∕ mount-composer 行 / §6.1 D3 ∕ D4 行 / §7 T-DSK22 ∕ T-DSK23 ∕ 批 A 注——**退役句清（本地队列三纯动作 ∕ 回合尾 flush）逐处对齐 KD-40**；
  §6.1 增 **D25 行** + 表头 **D1–D25** + 档头五处同拍 + §10 **AN** 行随收；§4.1 本批行**按盘重锚**（`events.mjs` **456 ⇒ ≈466**——align-2 拆档已落；补 `store.mjs` / `views/statusline.mjs` 两行）+ 越层段补 `events.mjs` 条目；
  §2.2 补「两路由优先序」句 + KD-40 ⑤ 补「整批让位 · 不拆批」批界句。明细 = `docs/batches/2026-09-28-desktop-midturn-input.md` §4。
- 2026-09-28（**回合中插入批 · 设计评审轮 2 修正（父侧直接执行 · 可 revert）**——承评审 #31 发现 #1–#6 · 两项认账）：§6.1 **D3 ∕ D4 行**退役句补落（轮 1 清单声称而实未落——认账）· 清单靶面名收正（「§10 批 A 注」⇒ **§7 批 A 注**）；**窄口「退 ∕ 存」跨档对齐**（UI.md:445 ∕ KD-40 ④ ∕ §4.1:253 ⇒ 只退 flush 携行、`onTurnTail` 窄口存续）；
  UI.md:4 收 **D1–D25** + AN 行主句同收；T-DSK23 补 `queue-full`；同族残体一并扫（UI.md:85 ∕ :379 ∕ :459 · SHELL.md:46 ∕ :54 · IPC.md:166 ∕ :179 十七 ⇒ 十八通道）；数值漂移（events.mjs 兄弟批表 as-of 原样——现值以 §4.1 本批行为准）。明细 = `docs/batches/2026-09-28-desktop-midturn-input.md` §4。
- 2026-09-28（**回合中插入批 · 设计收尾微轮（父侧直接裁决 · 在飞收口）· eng-designer**——承批档 §1.19 两条设计缺口 + §5 U-5 存量漂移）：KD-40 ② 补 **timer 轮路由句**（同按 `autoTurn` 分流——缝不传；队列留待该轮回合尾续发 ∕ 裁决 = 父侧回执 ①）+ KD-40 尾补 **slash 尾径边界句**（步边界零动作 ∥ 回合尾「逐条直发」）；
  §6.1 本批注机检面落点随正（`agent-host-queued.test.mjs`——U217–U219 拆分产出）+ §4.1 本批块补**实施实读漂移注**（新增四档 + `page-read.mjs` 表外随动——归回填轮）。明细 = 批档 §2。
- 2026-09-28（**文档回填与卫生轮**（台账 #516 · 18 项）· eng-designer）：§4.1 全表按盘实读重锚（值列 ~50 行 + 用例模块行 **四十八档** ∕ 集成域 **八档** + `thincoder-desktop/test/files.mjs` **25** + 共享助手四档）+ 越层段重写（在册例外 = `mount-settings` **499**；越层 + 测试面清单逐档读数）；
  §2 KD-40 ⑤ 补「在飞回合中止 + 在飞表清」+ §2.2 补「中止墓碑（回合代次）三查位」段；KD-34 残值句收正（残值 = 端侧投影）；§6.1 U 族补 U217–U226 全谱；§10 BE 行复读 18 + 增 **BN** 行（状态词计数注释面残留——只报）；裸路径转全形（§4.1 ~14 种形态）。明细 = 批档 §2。
- 2026-09-28（**会话标题接线批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-session-title.md` §1 · 台账 #517 · 用户 18:10 走查）：§2 增 **KD-41**（桌面标题链 = 回合尾结算单实现（标题先于落盘）+ await 同形 + 存量仅自然补；含被否候选五条）；
  §4.2 增本批行（`turn-face.mjs` + 测试面两新档 + 设计档）+ §6.1 增「会话标题接线批」验收注 + §7 增 **T-DSK46** 行 + §10 增 **BO / BP** 两行；核档 `docs/core/design/SESSION.md` §6.7 收「三端」+ 桌面端壳行（本批 §4.1 两值收正诉求已由并行回填轮落——`turn-face.mjs` **77** ∕ `thincoder-desktop/test/files.mjs` **25** 现值在册，本舱零重落）。明细 = 批档 §2。
- 2026-09-28（**文档回填与卫生轮 · 设计评审轮 1 修正 · eng-designer**——承批档 §3 轮次 1 发现 1 / 2 / 8）：标记面 sweep（§2 **KD-34** ∕ **KD-35** ∕ **KD-40** ∕ §2.2 三处去「（拟新增）」）；
  §4.1 补行**十二档**（`timer-watch` **79** ∕ `queued-input` **117** ∕ `turn-chain` **71** ∕ `file-links` **63** ∕ `page-read` **132** ∕ `queue` **41** ∕ `composer-send` **70** ∕ `i18n-views` **68** ∕ `subagent-reduce` **137** ∕
  `views/chat-chrome` **297** ∕ `views/chat-pending` **77** ∕ `views/chat-subagent` **69**——实读 2026-09-28）+ 四档去标落值 + §10 **BL** 去标；
  「贴 300 层」句按口径重述（现值 ≤ 300 ∧ 距线 ≤ 3 行；= 300 入列）+ 用例模块行 `agent-host-suspension` 时点注（落档 **232** ⇒ 现值 **299**）。**零新语义**。
- 2026-09-28（**桌面功能对位批 · R1 设计面收正轮（fix · #129）· eng-designer**——承批档 §1.5① ∕ §5 遗留②③）：§4.1 行数账按盘收正（`session-maintenance.mjs` 新档 **112** 入册 + `session-slots` **226** ∕ `ipc` **296** ∕ `main` **114** ∕ `window` **177** ∕ `agent-host` **400** ∕ `preload` **62**——R1 会话维护线后）；
  越层段 + §10 **BL** 落 R1 越层处置行（拆点候选 = 回合驱动族出档 `thincoder-desktop/src/main/turn-driver.mjs`（拟新增）· 在册）；§10 **BE** 计数随正（事件 **19** ∕ 请求 **33**）。明细 = 批档 §2。
- 2026-09-29（**会话标题接线批 · 正文收正轮（fix · 实施前复核发现 1–8）· eng-designer**——按现盘实读对齐，明细 = 批档 §2.10）：
  KD-41 引证重锚（`thincoder-core/generate-title.mjs:123-139` ∕ `thincoder-core/session.mjs:128` ∕ `thincoder-core/context.mjs:94-100`——落位按符号）+ ② 同形句限定 + ⑤ 措辞收正（每个未成功生成标题的回合均重试）；
  §4.1 三行按盘收正（`turn-face.mjs` **129** ∕ `thincoder-desktop/test/run.mjs` · `files.mjs` **49 ∕ 3** ∕ `notify.mjs` **11**——共享助手四档死引证删；全清重置后空清单）+ §4.2 本批行重锚（**129 ⇒ ≈139**；`files.mjs` **3 ⇒ 3**）；
  测试面 = 单元测试档 `docs/batches/2026-09-28-desktop-session-title.test.mjs` + **T-DSK46 裁定 = 本轮不重建 E2E 基建**；§6.1 批注（**D26 已落** + **E5 ∕ E6** 补例 + 真机面转父侧真机冒烟）+ §7 T-DSK46 行 ∕ 号序注（`T-DSK41` ∕ `44` ∕ `45` 无行 = §10 自铸行 **AX** ∕ **BJ** ∕ **BK**）。
- 2026-09-29（**退役面本体收正轮（fix · eng-designer）**）：① 会话模型轮退场失据行收正（KD-16 ∕ §2.2 切走会话行 ∕ §4.1–§4.2 行 ∕ §10 O ∕ U ∕ V ∕ W ∕ BO）；② 测试树全清重置残引退役 ∕ 改述（§4.1 用例模块与集成域 ∕ 越层段 ∕ §6.1–§7 ∕ §10）；③ D 号口径同族书证 **D1–D26**（`SHELL.md:4` 射程外列报）；零语义新增。明细 = 批档 §2。
- 2026-09-29（**桌面功能对位批 · R2 设计面收正轮 · eng-designer**——承批档 §1.11 舱列 6 项）：§6.1 **D8** ∕ §10 **N** 读数面承诺句按落地收正（已落 = `index:build` ∕ `index:status`）；§7 批 9 注 T-DSK9 行 ∕ §8 边界括注同拍；§4.1 `ipc.mjs` ∕ `preload.cjs` 两行白名单 33 ⇒ **35**；§10 **BE** 请求半收正。明细 = 批档 §2。
- 2026-09-29（**桌面功能对位批 · R3 设计面收正轮（fix · #30）· eng-designer**——承批档 §1.12 裁① ∕ §5 R3 遗留）：§10 **BB** turn-cap 续跑转**已落**（R3 撞帽三径 + 换代重入）；§10 **BL** 拆点**已消解**（agent-host **248** ≤300）；
  §4.1 行数账收正——`agent-host` **248** ∕ `turn-driver` 新行 **214** ∕ `turn-face` **141** ∕ `session-io` **47** ∕ `agent-bridge` **257** ∕ `agent-assemble` **104**（届盘实读 2026-09-29）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-subblock-follow.md` §1 · 台账 #518）：§10 增 **BT** 行（VSC 改指边界请裁 ∕ 需求档判据句上抛 ∕ 值面两条登记）。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-copy-vsc-align.md` §1 · 台账 #557 / #558）：**KD-22 收正**（复制面 = 核件代码块 Copy 钮唯一——自建两控件退场）+ 新增 **KD-43**（右键编辑菜单 = 宿主面职责 ∕ 条目集 ∕ 词表显式文案——实读 Electron role 默认文案 = 英文硬编码 ⇒ 不采）；§4.1 增 `context-menu.mjs` 行 + 去 `chat-copy.mjs` 行（删档）+ `chat-guide.mjs` 行去死先例；§4.2 增本批「现行 ⇒ 预期」块（十档 + 测试面零改 + 设计档行）；§6.1 表头 **D1–D27** + D13 行收正 + 本批注（验收面）；§7 T-DSK30 收正（④⑤ 步）+ 增 **T-DSK47**；§9 落形指针；§10 **AN** 收正（同族书证五处 D1–D27·SHELL 待收项销）+ 增 **BU / BV / BW**；档头 D1–D27。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 修复轮（评审轮 1 · 发现 1–7）· eng-designer**）：§4.1 四档行数账按盘收正（`thincoder-desktop/renderer/views/activity.mjs` **321 ⇒ 259** · `thincoder-desktop/renderer/core.css` **345 ⇒ 281**——**未越 300**，越层段两档除名）+ 补行两（`search.mjs` **26** · `heartbeat.mjs` **47**）；
  §4.2 增本批「现行 ⇒ 预期」块（四档 + 测试面 + 设计档）+ R6 `search.mjs` 补登行；§7 **T-DSK18** 收正（40px · 页量按核缺省条口径）；§4.1/§4.2 search 档行同笔。明细 = 批档 §2 修复轮。
- 2026-09-29（**挂起窗径「消费前流内零块」批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-susp-queue.md` §2 · 台账 #561）：**KD-23 收正**（写者两径句 ∕ 入队径 = 消费前流内零块 + 输入区上方带 ∕ 失败径 = 回执退流；收正轮 B12 终态口径落字——承输入批 §1.11「设计面收正」在册面）+ **KD-34 补**（窗内受理回执 `queued` + 窗队共排队镜面）+ **KD-40 增 ⑥**（挂起窗输入队共镜——两源按键互斥 ∕ 并源单点 `queueView` ∕ 载体不合并）+ 被否行注注。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 1（评审轮 1 · 发现 1–7 逐号点修）· eng-designer**）：§4.1 六行按盘收正（实读 2026-09-29）——`thincoder-desktop/src/main/window.mjs` **191** ·
  `thincoder-desktop/renderer/views/chat.mjs` **365** · `thincoder-desktop/renderer/mount-composer.mjs` **238** · `thincoder-desktop/renderer/app.mjs` **276** ·
  `thincoder-desktop/renderer/i18n.mjs` **473** · `thincoder-desktop/renderer/views/chat-text.mjs` **126**——另补行两（`thincoder-desktop/renderer/composer-sync.mjs` **210** ∕ `thincoder-desktop/renderer/chat-composer.css` **71**）；
  越层段两值收正（`i18n` ∕ `chat.mjs`）与两档除名（`mount-composer` 越层 ∕ `app.mjs` 贴层——按盘实测已回落 ≤300）；
  §4.2 两行补越层处置句（`thincoder-desktop/renderer/views/chat.mjs` ∕ `thincoder-desktop/renderer/i18n.mjs`——续期说明）+ §6.1 **D24 行**控件族 **11 ⇒ 8** + 本批验收注（机检载体改述 = 零测试件现状载体 + 单元测试档留待）；零测试件实建。明细 = 批档 §2 修正轮节。
- 2026-09-29（**窗队列 VSC 逐点对齐批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-window-queue-parity.md` §2 · 台账 #564）：**KD-34 收正**（窗内携附件：`busy` 留队重试 ⇒ 载具层携图——窗条目携 `images`、送达面判决；核零改）+ §2.2 忙态排队面随动句同笔 + §10 **BC 行转已消解**（端侧投影支）。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 2（评审 #58 · §3 轮次 2 · 发现 1–8 逐号点修）· eng-designer**）：发现 1（🔴 账本警示面四坐标按盘同值收正——`div.session-ledger-notice` ∕ 下拉首行 ∕ `chrome.css`：UI.md 本批注项 2 ∕ IPC.md `:170` ∕ 本档 D23 行 ∕ 同机制同族 `T-DSK40` 行 + `E2E-TESTING.md` 同笔）；
  §4.1 全表按盘实读回填（实读 2026-09-29）+ 补行 **38**（发现 3 清单 28 + 同族漏登 10——`events-flags` ∕ `questions` ∕ `activity-new` ∕ `pool-subagents` ∕ `compress-status` ∕ `src/main/{config-watch,index-status,session-flags,settings-env,settings-tools}`）——`styles.css` 行拆为 `theme.css` ∕ `chrome.css` ∕ `skin.css` 三行；`composer-send.mjs` 行 ⇒ `composer-wire.mjs`；越层段 ∕ 在册例外全段按盘重写（越 300 六档各带预案；在册例外归零；贴层 `store.mjs` 298）；`chrome.css` ∕ `agent-bridge.mjs` 两档预案入册（发现 4）；
  §5 script 四条（补 `start`——发现 6①）+ §6.1 表头 D26 ∕ D27 承载注（发现 7）+ `T-DSK27` 段序七段（发现 5）+ `IPC.md` `ev:config` 复读七段（发现 6②）；发现 8 = 零动作（用户 04:37 已裁「全选保留」——§4.2 在册）。明细 = 批档 §2.10。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 3（§3 轮次 3 · 评审 #76 · 发现 1–11 逐号点修）· eng-designer**）：发现 1（🔴 开项目驱动路径按 R13 后形态重锚——§7 四行（T-DSK32 / 39 / 40 / 46）① 步与夹具描述：会话控制面项目钮 `button.session-project` + 主进程对话框测试侧替换（返回 `PROJ`）；备路 = 下拉条目）+ 发现 2（R13 退役面残引——D11 ∕ T-DSK1 / 3 / 11 / 20 / 25 / 26 ∕ §8 #426 行）+ 发现 4（KD-38 改记已落：启动拍 + 周期拍 120s）+ 发现 5（测试层：§7 机检面改述单元测试档惯例 ∕ T-DSK27 收正）+ 发现 6（`project:recent` = 无渲染消费面（保留）；T-DSK2 退场给由 + D1 验证面随动）+ 发现 8（`agent-bridge` **十九回调**按盘回填——`SHELL.md` ∕ `IPC.md` 同拍）。明细 = 批档 §2.11。
- 2026-09-29（**挂起窗径批 · 修正轮（重派 · 评审轮 1 · 12 条）· eng-designer**——发现 1 ∕ 10 逐号点修）：发现 1 取「非流内」——**KD-31 题名与正文收正**（排队可见面 = 输入区上方待发送带；「入队即出泡 ∕ 流尾 `[data-pending]`」旧述删净）；发现 10 = §4.1 按盘复核同值（`turn-driver` **221** ∕ `suspension-drive` **279** ∕ `chrome` **191** ∕ `composer-wire` **167** ∕ `composer-sync` **210** ∕ `mount-composer` **238** ∕ `turn-chain` **75**——两档登记行在册）+ `suspension-drive.mjs` 拆分预案预登（在途两批合并上界 ≈311 ⇒ 窗队 ∕ 帧构造面出档）。明细 = 批档 §2.9。
- 2026-09-29（**窗队列 VSC 逐点对齐批 · 修正轮（评审 #57 · 十条逐号）· eng-designer**）：发现 1 = §6.1 补 **D26 ∕ D27 两行**（承载注退场；与 #58 发现 7 同向取「补行」侧）；发现 3 = §4.1 越 300 段按盘复核（「agent-host 400」∕「turn-driver（拟新增）」∕「BL 在册」三类残句零残留——已由并行修正轮同向消解）；发现 4 = §4.2 增「挂起窗径批 ∥ 窗队列批」合并行（**279** ∕ **221** 实读起算 + 预期增量；越 300 预案承 §4.1 预登）；发现 5 = 增「窗队列批」验收注 + §7 **T-DSK48** + D25 行回指；发现 6 = §4.2 i18n 行构成式收正（**473 ⇒ ≈477** = −4 +8 行；净 +2 键）；发现 9 = `events.mjs` ∕ `events-subscribe.mjs` 两行计数 **十八条 ⇒ 二十三条**；发现 10 = KD-30 行期数 delta 清。明细 = 批档 §2.9。
- 2026-09-29（**批 parity-b4 · 实施收正轮 · eng-coder**——承 `docs/batches/2026-09-29-parity-b4-vsc-small.md` §2.7-W3 · §4 D3 批准）：**KD-35 随 D3 收正**（单触发档——档②「后台消化轮起跑」去：`digestStart` ∕ `notify.subagents` ∕ 调用点已删）+ **KD-21 收正**（非视觉面 = 先落盘 + 降级跑者）+ §7 **T-DSK30 ② 收正**（降级成功 ∕ 未成两态）+ §4.1 `notify.mjs` 行同笔随动（两档 ⇒ 单档 · 词键持有面 ⇒ 核件）。**零新语义**（实施随动）。
- 2026-09-29（**复制面对齐 VSC 批 · 修正轮 4（§3 轮次 4 · 评审 #107 · 发现 1–5 逐号点修）· eng-designer**）：发现 2 ∕ 5（§4.2 `i18n.mjs` 行收正 **≈482**（实落——以盘为准；净量复算 477 + 注块 ∕ 链记录 +5）+ `views/chat.mjs` ∕ `i18n.mjs` 两行续期口径收正 = 不拆依据 + 消解窗口改指下批触碰批）+ 发现 1（§4.2 三处 `files.mjs`「22」补**现盘 3** 注——随全清重置）+ 发现 3（§7 `T-DSK32` 行 ③④ 裁退——`no-session` 面无可达路；十序）+ 发现 4（状态词 8 词复核坐标在册）。明细 = 批档 §2.12。
- 2026-09-29（**桌面两批 · 「全清令」措辞族终扫轮 · eng-designer**——#126 观察 1–2 收尾）：D27 行 ∕ T-DSK48 机检面 ∕ D27 验收注载体按现况收正（批档本地件 + 标准限定语；「留待 ⇒ 已落」）+ 窗队列载体计数收正（T1–T8 ⇒ **T1–T9**——件实读）；同笔 `docs/desktop/design/UI.md` 本批注两处。明细 = 批档 §2.13。
- 2026-09-29（**合并实施收尾轮 · 账面收正 · eng-designer**——承 #125 披露 ⓐⓑ）：§4.1 `suspension-drive.mjs` **299 ⇒ 326**（越 300——越层段补登 + 在途预登行收正）+ `turn-driver.mjs` **274 ⇒ 275**；§4.2 两行落值同笔（拆分预案 = 窗内时效 ∕ 时序守卫面出档（≈30 行）· 消解窗口 = 该档下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））。明细 = 批档 §2。
- 2026-09-29（**parity-b9（会话尾账）· 文档面随动轮 · eng-designer**——承批档 `docs/batches/2026-09-29-parity-b9-session.md` §2.8）：§2.2 ∕ §4.1 三处随动——`:110` 级联枚举补「切项目径释放旧 cwd 认领」元素（核 `releaseClaimsAll`——G-2 同源）+ 引坐标收正（`agent-host.mjs:118-130` ⇒ `turn-driver.mjs:49-57`）；
  `sessions.mjs` 行措辞收正（「→ 左列行」⇒「→ 会话控制条目」）· `ipc.mjs` 行数回填 **293 ⇒ 298**（G-2 释放补线后实读）。零新语义。

- 2026-09-29（**residuals-round2 批 · 设计轮上抛处置轮 · eng-designer**——承批档 `docs/batches/2026-09-29-residuals-round2.md`〔父侧裁③〕）：KD-39 句「语义同源」指针按核单源收正——`thincoder-vscode/src/extension/file-links.mjs` ⇒ `thincoder-core/file-links.mjs`（R2 处理流批上提后核单源）；「两端各自实现」⇒「两端薄壳 = 探针注入」。零新语义（指针收正）。
- 2026-09-29（**模型菜单全渠批 · W3 文档轮 · eng-designer**——承 `docs/batches/2026-09-29-model-menu-parity.md` §2.6 W3 表 + §2.12）：§4.1 越层 ∕ 贴层登记随动（`ipc.mjs` **新越层 303** + 预案引在册「按面拆分」句 ∕ `store.mjs` 贴层消解窗口 = 本批）+ 行数随动十档 · §2 增 **KD-44–KD-46** · §6.1 **D6** 行随拍（一级 = 全渠 ∕ 失败渠零行 ∕ 会话切换随动）· §7 增 **R1–R7** 真机条目行 + 本批注 · §10 增 **BZ–CB**（U1–U3 裁定落点）+ **BE** 请求面计数收正（38 ⇒ 39）· §4.2 本批行。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-subblock-follow-resume.md` §1 · 台账 #603）：§2 增 **KD-47**（链稳定 × 帧尾复核 × 手势门控 × 核件出口 + 七被否候选在册）；
  §4.1 五行收正（四行补指针：`views/activity.mjs` ∕ `renderer/core.css` ∕ `views/chat-subagent.mjs` ∕ `views/pool-subagents.mjs`；`thincoder-desktop/renderer/i18n.mjs` 行值按盘收正 **473 ⇒ 482**——复制面对齐批落值）；
  §4.2 增本批「现行 ⇒ 预期」块（八档 + 测试 ∕ 探针面 + 设计档六档）；§10 增 **CC** 行（上抛三件——需求档出口句 ∕ VSC `chat.css` 越限观察 ∕ 探针件收位）+ **CD** 行（**留端清算**——块跟滚机制两半归属定死：应用时机契约 = 核 ∕ 宿主帧模型 = 端 ∕ 滚动策略族契约同源）。明细 = 批档 §2（含 §2.13 边界裁定）。
- 2026-09-29（**更新纪律收核批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-render-perf.md` §1 · 台账 #609 + #190 会诊终报）：§2 增 **KD-48**（桌面接装更新契约——帧合并件 + 每帧每面至多一次 + 帧内增量；五被否候选在册）；
  §4.1 增两新档行（`chat-model.mjs` ∕ `frame-dispatch.mjs`）+ `views/chat.mjs` 行随动；§4.2 增本批「现行 ⇒ 预期」块（十二档 + 测试 ∕ 探针面 + 设计档四档）；§10 **CD 行收正**（触发源 = 端——帧合并 ∕ 更新纪律收核）+ 增 **CE**（上抛三件）∕ **CF**（贴层登记）两行。明细 = 批档 §2。
- 2026-09-29（**parity-b8 批 · W4 文档收正轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b8-ipc.md` §2 W4）：KD-20 载荷键 `percent ⇒ ctxPct` · KD-21 附件元素形 ⇒ 严格 dataURL 串数组（A1）· §4.1 `events.mjs` 行 `ev:error` 键面 `text`（A4）；
  用例表 T-DSK29 `percent ⇒ ctxPct` · T-DSK30 附件载荷形 ∕ T-DSK33 键名随正（`ev:activity` turn `{turn, maxTurns}` · `ev:usage` `ctxPct` + `usage`）· §6.1 D4 行队列条目形 ⇒ 文本串（A9）。零新语义。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 修复轮（评审轮 1 · 发现 2 / 3 / 4）· eng-designer**——承批档 §3 轮次 1）：§4.2 本批表 `base.css` 行补**越 300 在册 + 续期说明**（域外观察句分列）+ 测试 ∕ 探针面行改述「本批须新增」+ 探针件名收正为三件扩面形；§10 **CC③** 同拍。明细 = 批档 §3。
- 2026-09-29（**更新纪律收核批 · 修复轮（评审轮 1（#214）· 发现 4 ∕ 7 ∕ 8 ∕ 9）· eng-designer**——承批档 §2.9）：§2 KD-48 ① flush 消费点补符号限定（`returnToLatest` = app 侧回底入口——`app.mjs:152`）；§4.1 三行按盘收正（`heartbeat.mjs` **47 ⇒ 48** + 1s 拍面收正 ∕ `chat.mjs` **361 ⇒ 362** ∕ `statusline.mjs` **172 ⇒ 177**）；
  §4.2 R3c 行 `chat-stream.mjs` 残句收正（零改——桌面流式纪律 = 核帧合并件）；§4.2 本批行三处收正（测试 ∕ 探针面「全清令」补射程句 · `thincoder-render-core/test/run.mjs` **零改** · `chat.mjs` 现行 **362**）。明细 = 批档 §2.9。
- 2026-09-29（**parity-b10-ui 批 · W6 文档随动轮 · eng-designer**——承 `docs/batches/2026-09-29-parity-b10-ui.md` §2.7 文档随动表 + §5 三舱实施记录）：§2 增 **KD-49**（patch 显式清除面 + slot 权威键拒写）；§4.1 二十四行按盘收正（W6 届盘复读）+ 新档三行 + 越层段（新入册四档 ∕ 续越两档 ∕ 在册例外 **Ⅰ**）+ 本批块；§4.2 增三舱实读落值块；§10 增 **CG–CJ** 四行。明细 = 批档 §2。
- 2026-09-29（**越线档结构轮（structure-split-round）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-round.md` §1 · 台账 #536）：届盘全量越线档（桌面全树 + 他端查得）逐档重读 + 逐个裁定——**两台拆**（`renderer/chrome.css` **450 ⇒ ≈288** 出 `renderer/session-list.css` ≈170〔3.4 案落形〕· `renderer/mount-sessions.mjs` **406 ⇒ ≈245** 出 `renderer/session-wire.mjs` ≈185〔缝 = 同名再出口——`app.mjs` 零改〕）+ 余档续期（各带由 ∕ 窗口——设置面族在飞避让）；越层段按盘重写（`renderer/views/chat.mjs` 越层消解除名〔届盘 **284**〕· `src/main/agent-bridge.mjs` 读数收正 **318** · 贴层六档：`store` 300 ∕ `providers` 300 ∕ `app.mjs` 299 ∕ `core.css` 299 ∕ `views/chat-tool.mjs` 299 ∕ `views/settings-sections.mjs` 297）；§4.1 两行预案改「本批拆」+ §4.2 本批预登块。明细 = 批档 §2。
- 2026-09-29（**桌面补线 · 引擎面批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-extension-engine-face.md` §1 · 台账 #523 ∕ #524）：**KD-42 收正**（② 锚改设计面单源 = `docs/core/design/CORE-UNIFICATION.md` §2.13.3 ∕ §2.13.4——原机检自检档随核测试树全清退役 ⇒ 对账面 = 设计面记录 ＋ 届盘复核；补「域外对账保持人工」句；先例句现状收正）+ §10 增 **CK**（`traces` ∕ `stopTrace` 不做——#523④ 裁定）∕ **CL**（核休眠缝两项转单核侧裁——#523⑤）两行。明细 = 批档 §2。
- 2026-09-29（**性能尾账批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-perf-residuals.md` §1 · 台账 #619）：§2 增 **KD-50**（尾块增量 md + 帧内组合（就地改 + 追加）——`patch-append` 档；机制单源 = 核档 §2 KD-RC-10）；KD-48 被否列「全文增量 md」口径随动（另议 ⇒ KD-50 落定）；
  §4.2 增本批「现行 ⇒ 预期」块（六档 + 零触面 + 测试 ∕ 探针面 + 设计档三档）；§10 增 **CM** 行（上抛三件——需求档性能行 ∕ 批内件收位 ∕ VSC 复证坐标登记）。明细 = 批档 §2。
- 2026-09-29（**i18n 拆分批 · 文档面登记轮 · eng-designer**——承 `docs/batches/2026-09-29-i18n-split.md` §2.8（父侧裁 H1–H3）· 台账 #614）：§4.1 `thincoder-desktop/renderer/i18n.mjs` 行按盘收正（**500 ⇒ 393**——`settings.*` 族 55 键出档）+ 增新档行（`thincoder-desktop/renderer/i18n-settings.mjs` **137** · 第四档）；
  越层段——硬限在册例外消解（**在册例外：无**）+ 越 300 在册补登 `thincoder-desktop/renderer/i18n.mjs` **393**（十档 ⇒ **十一档**）；§4.2 增本批实读落值块；`docs/desktop/design/SHELL.md` §1 树增两节点行（`i18n-settings.mjs` ∕ `i18n-views.mjs`——消既有不对称）。明细 = 批档 §2。
- 2026-09-29（**性能尾账批 · 修正轮（评审 #41 · 发现 8）· eng-designer**——承批档 §3 轮次 1）：§2 KD-50 被否列补**「组合档用『尾块整节点重建』」**（节点身份失（选区 ∕ 滚位）+ 全量 md 重渲照旧——就地 path 已在；被否注册 ∕ 单源声明一致化）。明细 = 批档 §2 修正块。
- 2026-09-29（**越线档结构轮（structure-split-round）· 实施轮 · eng-coder**——承批档 `docs/batches/2026-09-29-structure-split-round.md` §2〔设计评审 #18 pass · 修正五条全落〕）：两台拆落盘实读——
  `thincoder-desktop/renderer/chrome.css` **450 ⇒ 287** 出 `thincoder-desktop/renderer/session-list.css` **170**（原 `:136-262` ∕ `:287-323` 共 164 行逐字迁 · 保位注一行落 `:136`；迁出块逐字 ∕ 级联序由批内件 B ∕ E 腿实证）·
  `thincoder-desktop/renderer/mount-sessions.mjs` **406 ⇒ 235** 出 `thincoder-desktop/renderer/session-wire.mjs` **194**（原 `:244-406` 共 163 行逐字迁；缝 = 同名再出口七名——`app.mjs` 零改，批内件 C 腿同引用实证）·
  `thincoder-desktop/renderer/index.html` **55 ⇒ 56**（link 位次 = chrome 后 ∕ skin 前）；改指表全落（注释指针十档十一处 · micros 存档件 MOUNT 改指〔tmp 副本已落；docs 副本受跨批次写门 ⇒ 父侧收位〕）；
  §4.1 两新档补行 + 三行收正（chrome ∕ mount ∕ index.html）+ 越层段二档除名（十一 ⇒ 九）+ §4.2 实读回填。批内件 = `.thincoder/tmp/2026-09-29-structure-split-round.test.mjs`（7 腿绿）+ 基线件同址。明细 = 批档 §5。
- 2026-09-29（**队列取项边缘收正批 · 实施轮（#621–#625 + N1 出档）· eng-coder**——承 `docs/batches/2026-09-29-queue-pickup-edge.md` §2 ∕ §2.10 · 台账 #621–#625）：KD-40 ①（slash 尾径）∕ ⑤（步边界整批让位 + 送达径携图退化逐条）∕ ⑥（步边界消费并入窗面（窗优先）+ 窗消费按核计划取批）三句收正；
  §4.1 五档按盘落值（`suspension-drive.mjs` **326 ⇒ 337** ∕ 新档 `suspension-guard.mjs` **27** ∕ `queued-input.mjs` **73 ⇒ 78** ∕ `window-queue.mjs` **91 ⇒ 103** ∕ `turn-chain.mjs` **99** ∕ `turn-driver.mjs` **287 ⇒ 291**）+ 越层段预案更新（窗内时效面出档）+ 本批落值块。明细 = 批档 §2 ∕ §5。

- 2026-09-29（**doc-backfill 批 · 波 1 · eng-designer**——承 `docs/batches/2026-09-29-doc-backfill.md` §2 ∕ §2.13 · 台账 #594 ∕ #598）：播种面族七处计数收正（KD-25 ∕ KD-36 ∕ D17 ∕ D22 ∕ T-DSK33 ∕ 残余批边界行 ∕ §10 AR——承载 16 ⇒ 17 ∕ 不播种 10 ⇒ 11；
  单源 = `docs/desktop/design/UI.md` §1「本批注（停滞轻显形 · 2026-09-29）」项 1）+ KD-30 段集订正形退场（现读 **17**）+ §4.1 `statusline.mjs` 行段闭集 **17 码**；§4.2 挂起窗径批块 `turn-driver.mjs` 行读数按届盘收正（**275 ⇒ 291**——与 §4.1 行同值）。明细 = 批档 §2。**零新语义**（计数 ∕ 读数收正）。

- 2026-09-29（**队列取项边缘收正批 · 文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-queue-pickup-edge.md` §2.6 ∕ §2.10（随实施轮同窗口落笔之届盘复核）+ 越层段 ∕ 行数账族按届盘实读）：KD-40 ①⑤⑥ 句 ∕ §4.1 落值行 ∕ 实读落值块 ∕ UI.md 项 5 ∕ WEBVIEW-INPUT 细则⑧——**届盘复核在盘（零改）**；
  **行数账族四档按届盘收正**——`renderer/i18n-views.mjs` **328 ⇒ 332** · `src/main/ipc.mjs` **322 ⇒ 330** · `src/main/agent-bridge.mjs` **318 ⇒ 319** · `renderer/views/chat-tool.mjs` **299 ⇒ 300**（收后与 §4.1 行 ∕ 现盘实读同值）。零新语义。
- 2026-09-29（**端差清算批 · 批 C 文档随动轮 · eng-designer**——承 `docs/batches/2026-09-29-enddiff-clearance.md` §2）：§10 BH ∕ BG 收正为**已消解**（#627 ∕ #628）· BM ∕ BU 补裁注（保留零动——#633 ∕ #636）· §7 T-DSK43 ③ 判据收正（非在飞 ⇒ 键隐——#626）；明细 = 批档 §2。**零新语义**。
- 2026-09-29（**缺面族批补批 · 批 C 文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-missing-face-family.md` §2.2 ⑪ ∕ §2.10 · 台账 #632）：§2 增 **KD-51**（@ 文件引用 = 核单源 + 两端薄壳 + 注入 ∕ 剥离位 + 有意分歧给据——形式沿 KD-39 收正先例）；
  §4.1 行数账族按盘收正——`thincoder-desktop/src/main/file-refs.mjs` 增行 **19** ∕ `turn-driver.mjs` **291 ⇒ 299**（read 总行 300 · 触线入列贴层） ∕ `turn-face.mjs` **140 ⇒ 145** ∕ `session-slots.mjs` **226 ⇒ 231** ∕ `views/chat-guide.mjs` **80 ⇒ 81**（`renderer/i18n-views.mjs` **332** 不变——值面收正）；明细 = 批档 §2。**零新语义**。
- 2026-09-29（**desktop-rebuild-fidelity 批 · U2 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.1 ∕ §2.8–§2.10）：§4.2 增本批「现行 ⇒ 预期」块（二十四行——桌 ∕ 核 ∕ VSC 档 + 测试 ∕ 探针面 + 设计档脚注；跨批避让注在册）；§10 增 **CN** 行（上抛四件——U1 手势门 ∕ U3 台账闭档建议 ∕ U4 双写者定序 ∕ 报告三项）。明细 = 批档 §2 记录块。
- 2026-09-29（**性能尾账批 · 实施后文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-perf-residuals.md` §5）：§4.1 两行按盘收正（`thincoder-desktop/renderer/views/chat.mjs` **290**〔注句 ≈265 ⇒ **284** 同拍〕· `thincoder-desktop/renderer/views/chat-stream.mjs` **101**——`streamDelta` 四档 ⇒ **五档**枚举同拍）；
  §4.2 本批块转终读（新增 `thincoder-render-core/flow/live-scan.mjs` **351** ∕ `thincoder-render-core/flow/live-md.mjs` **179** ∕ `thincoder-render-core/flow/stream.mjs` **135** ∕ `views/chat.mjs` **290** ∕ `views/chat-stream.mjs` **101**）。**零新语义**。明细 = 批档 §2。
- 2026-09-29（**desktop-residuals-round3 批 · 波 D 登记 + 实施后文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-round3.md` §2.13）：§4.1 行数账族按届盘实读收正（波 A–C 触档 **17 行**值收正 + `renderer/frame-dispatch.mjs` 落档去标 +
  `renderer/views/pool-tree.mjs` **174** 新登行 + 越层段 `renderer/store.mjs` ∕ `renderer/views/chat-chrome.mjs` 两档新入册（九 ⇒ **十一档**）+ 贴层段 ∕ 次大句随动）；**零新语义**（读数 ∕ 登记）。

- 2026-09-29（**doc-sync-carryover 批 · 文档随动族收正轮 · eng-designer**——承 `docs/batches/2026-09-29-doc-sync-carryover.md` §1 · 台账 #639 ∕ #644 ∕ #646 ∕ #647 ∕ #648 ∕ #650）：
  §4.1 行数账族 **17 行**按届盘实读收正（含 `views/chat-scroll.mjs` **109** ∕ `views/activity-new.mjs` **112**——RF 波 3 后；`views/activity.mjs` 行留待 RF 波 4 收口）+ `views/chat-model.mjs` 出档注 **≈95 ⇒ 104**；
  KD-16 实据指针收正（接线面 ⇒ `session-wire.mjs`）· KD-39 打开能力句收正（#627 消解——外部编辑器 CLI 探测）· §2.2 切走会话坐标收正 ·
  §4.2 `agent-bridge` 行钩子句收正（`onSubTurnBreak`——#628）· §4.2 账本警示面行落点收正（`session-list.css:93`）· §7 **T-DSK20** 坐标收正（`session-list.css`）·
  **T-DSK21** 大 patch 句收正（#629 核卡）· §10 **CH ∕ CJ** 转**已落**（desktop-residuals-round3 波 C）。**零新语义**（坐标 ∕ 计数 ∕ 措辞收正）。明细 = 批档 §2。

- 2026-09-29（**structure-split-2 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §1 · 台账 #651）：§4.1 两档拆分预案收正（`renderer/views/chat-chrome.mjs` ∥ `src/main/turn-driver.mjs`——「待裁」⇒ **本批拆**：
  digest 族出档 `chat-digest.mjs`（≈122）· msg 双通道族出档 `src/main/turn-input.mjs`（≈113）；拆后 ≈226 ∕ ≈222）+ 越层段两句同拍 + §4.2 增本批「现行 ⇒ 预期」块（含批件锁改指两项）。明细 = 批档 §2。**零新语义**（拆分方案落位 ∕ 登记）。
- 2026-09-29（**desktop-carryover 批 · §3 轮次 1 九发现修正轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-carryover.md` §2 修正块 · 台账 #406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660）：§4.2 增本批「现行 ⇒ 预期」块（含越线两档处置句）；
  §4.1 `thincoder-desktop/renderer/views/activity.mjs` 值按届盘实读收正（**181**）；KD-47 ⑤ 弃账语义句改全名引用 · KD-52 ③「无工作区」先例补落点指针 · §10 **BB** 行补队满限定句。**零新语义**（计数 ∕ 指针 ∕ 限定句收正）。明细 = 批档 §2。
- 2026-09-29（**撤会话头 + 工具头色批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2 · 台账 #668 ∕ #669）：§4.1 八行随动（`index.html` ∕ `chrome.css` ∕ `skin.css` ∕ `app.mjs` ∕ `i18n.mjs` ∕ `chat.css` ∕ `frame-dispatch.mjs` ∕ `views/chrome.mjs`——头面退场 + 工具头色落码）+ `mount-head.mjs` 行去（**删档**）+ 越层段 i18n 值随动；**KD-17 ∕ KD-18 ∕ KD-30 ∕ KD-48** 面名句收正；**D6 / D22** 与 **T-DSK7 / T-DSK43** 四行随动（三值居所 ⇒ 输入区控件行）；§4.2 增本批「现行 ⇒ 预期」块；§10 增 **CO** 行（上抛）。**零新语义**（面名 ∕ 读数 ∕ 判据句随动）。明细 = 批档 §2。
- 2026-09-29（**desktop-digest-parity 批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-digest-parity.md` §1 · 台账 #670）：§2.2 非同键事件句收正（**活态切回即见 ∕ 行痕族首屏四清**——`ev:digest` 终端轮「切回即失」）+ KD-36 句同拍（多轮累积 · 终态留存）；
  §4.1 行数账六行（`events-wake.mjs` ∕ `views/chat-model.mjs` ∕ `views/chat-chrome.mjs` ∕ `views/chat.mjs` ∕ `page-read.mjs` ∕ `chat.css`——「现行 ⇒ 预期」）+ 越层段 chat-chrome 行并注（与 structure-split-2 同面**串行**）+ §4.2 增本批「现行 ⇒ 预期」块。机制单源 = 批档 §2（E9 两差消解径定形——对齐 VSC `chat-status.js:69-122` 逐值）。
- 2026-09-29（**desktop-carryover 批 · 文档面回填轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-carryover.md` §5 ∕ §5-c1 ∕ §5.#660（三舱实读）· 台账 #406 ∕ #649 ∕ #652 ∕ #656 ∕ #659 ∕ #660）：
  §4.1 行数账族**十四行**按现盘实读收正——`thincoder-desktop/renderer/views/session-control.mjs` **238** ∕ `mount-settings.mjs` **184** ∕ `mount-settings-exits.mjs` **227** ∕
  `mount-settings-segments-providers.mjs` **147** ∕ `views/settings-controls.mjs` **137**〔第六档补登记〕∕ `view-state.mjs` **299** ∕ `views/activity.mjs` **194** ∕ `views/pool-subagents.mjs` **132**；
  `thincoder-desktop/src/main/turn-face.mjs` **173** ∕ `src/main/queued-input.mjs` **90** ∕ `renderer/composer-wire.mjs` **254** ∕ `renderer/mount-composer.mjs` **261** ∕ `src/main/ipc.mjs` **331** ∕ `views/settings-sections.mjs` **302**；
  越层段新入册一档（`views/settings-sections.mjs`——由 = #652 钥行补标记）+ 贴层段同拍除名（余四档）；§4.2 本批块转「实读落值」（新增 `queued-input.mjs` ∕ `ipc.mjs` ∕ `views/settings-controls.mjs` 三行 + 批内件三档 ∕ P10 探针 ∕ 读数档件名）；
  KD-47 ① 句收正（审批 ∕ 队列族 = **键控差分**——RF #606③）+ KD-47 ⑤ 补焦点保真射程限定（池键帧 · 探针腿 `aFocusKeptPoolOnly` 自陈射程）；
  **留待 = `thincoder-desktop/src/main/turn-driver.mjs` 行**（§4.1 行 ∥ 越层段条目 ∥ 越层段计数 ∥ §4.2 行 = structure-split-2 收口轮统一定——父裁 2026-09-29 · 避双写）。**零新语义**（读数 ∕ 登记 ∕ 射程限定）。明细 = 批档 §2 修正块。
- 2026-09-29（**口子清零二轮 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · 台账 #673）：KD-29 端差计数收正（3 项全处置）；§10 H ∕ AY ∕ BR ∕ CG ∕ CI 五行定形（H = 消〔补做〕· AY = 撤项〔零可见差〕· BR = 复核定形〔宿主忙采样随 S3 消 ∕ 余六项须逐项实证〕· CG = 消〔补做三件〕· CI = 已消解〔#614〕）+ D 行同拍；§4.1 ipc.mjs 两处预案句收正（转口族出档 `ipc-relays.mjs`——序 = 延后 #667）+ 值随盘（331）。**零新语义**（处置落档 ∕ 预案落位）。明细 = 批档 §2。

- 2026-09-29（**structure-split-2 批 · 收口轮（文档面回填）· eng-designer**——承批档 `docs/batches/2026-09-29-structure-split-2.md` §5 ∥ 四舱实读 · 台账 #651）：
  §4.1 两档终值回填（`renderer/views/chat-chrome.mjs` **213** ∥ 新档 `chat-digest.mjs` **133**；`src/main/turn-driver.mjs` **252** ∥ 新档 `src/main/turn-input.mjs` **120**）+ 越层段两行除名（计数 **十一档**）；
  §4.2 本批块转「实读落值」（批件锁改指 **3 处已落**；批内件未落 = 父侧收位）+ desktop-carryover 块 `turn-driver` 行终值统一（留待项收口）。**零新语义**（读数 ∕ 登记）。明细 = 批档 §2 收口块。
- 2026-09-29（**撤会话头 + 工具头色批 · 修正轮（评审轮 1 · 发现 1 ∕ 2 ∕ 9 ∕ 10 逐号）· eng-designer**——承批档 §3 轮次 1）：KD-45 消费者列 **3 ⇒ 2**（`mount-head.mjs` 删档）；§4.2 行 12 与 §10 CO① 状态句收为**已落**（父侧落笔——需求档 `:269` 变更记录同笔）；§4.2 测试面行补批内件规模预期（≈130 行 · 5 用例）；§9 现值句收正（形态行 **21** ∕ 合计 **23**——实点 2026-09-29 + 计法；后继各批落形句转标时点读数）。明细 = 批档 §2.10。
- 2026-09-29（**口子清零二轮 · 修正轮（评审轮 1 · 发现 1 ∕ 4 ∕ 8 逐号）· eng-designer**——承批档 §3 轮次 1）：§8 边界句收正（「编辑器」⇒「编辑器本体」· 删「打开」·「保存」——余暂缓三件 = 文件视图 ∕ 编辑器本体 ∕ 内置 diff）；§4.1 增 `loop-sampler.mjs` 行（拟新增 · ≈45）+ 越层段 i18n 行补第五档备案（`renderer/i18n-status.mjs` ∕ 启动条件 >450）+ 贴层段补本批触碰两档（`providers.mjs` ∕ `core.css` ⇒ 越 300——拆分预案 ∕ 消解窗口）；§4.2 增本批「现行 ⇒ 预期」块（十五行）。**零新语义**（登记 ∕ 句面收正）。明细 = 批档 §2.8。

- 2026-09-29（**口子清零二轮 · 修正轮 2（评审轮 2 · 10 条逐号 · 发现 1 ∕ 10）· eng-designer**——承批档 §3 轮次 2）：KD-46 理由列收正（`hostBusy` 档 = 消（补做——欠做，非能力缺失）；宿主忙采样器 = 新档 `loop-sampler.mjs` + `failure` 键贯链）；§6.1 D21 行两处同拍（「端差 3 项已全部处置」+「桌面会话控制面」）。**零新语义**（处置句 ∕ 词面收正）。明细 = 批档 §2.9。
- 2026-09-29（**口子清零二轮 · 实施随动收正轮（父侧裁）· eng-designer**——承批档 `docs/batches/2026-09-29-hatch-clearance-2.md` §4 ∕ §5.6）：KD-48 虚拟化否决由句收正（窗口 200 ⇒ **150**——E10 落定同拍）· T-DSK17 行两值同拍（`> 200` ∕ 尾部 200 块 ⇒ **150**）；§4.1 行数账族按现盘实读收正（`views/settings-sections.mjs` **309** ∕ `renderer/composer-sync.mjs` **302** ∕ `renderer/i18n-views.mjs` **336** ∕ `src/main/providers.mjs` **315** ∕ `renderer/core.css` **332**；`renderer/store.mjs` 复读同值零改）+ 越层段三档新入册（**十一 ⇒ 十四档**）+ 贴层段两档转出 + 本批块按盘回填（`providers.mjs` **315** ∥ `core.css` **332**）。**零新语义**（值 ∕ 登记 ∕ 读数收正）。明细 = 批档 §2.10。
- 2026-09-30（**桌面堆取证修复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-heap-freeze.md` §1（282s 冻结全链取证）· 台账 #694）：§2 增 **KD-53**（桌面堆遥测与冻结取证——`heap-watch.mjs` 新档 ∕ 快照双径 ∕ 冻结现场门 ∕ `diagnostics.*` 键消费）· **KD-54**（堆累积收敛 = 诊断先行 + 对靶两腿；候选面实读在册；呈现语义零改硬边界）；§4.1 增 `thincoder-desktop/src/main/heap-watch.mjs` 行（拟新增 · ≈120）；§4.2 增本批「现行 ⇒ 预期」块（七行）；§10 增 **CP**（读数点名 + 现场归属补证）· **CQ**（装配表无驱逐登记）。
  本轮设计新面 = KD-53 ∕ KD-54（新增机制——待评审 ∕ 用户批准）；**产品码零触**。明细 = 批档 §2。

- 2026-09-30（**桌面堆取证修复批 · 设计轮 · 追记 2（承 §1.3a ∕ §1.3b 父侧追加实锤）· eng-designer**——承 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.11）：KD-53 ② 快照触发句收正（健康期阈值 ∥ 冻结自复——阻塞期不可得）+ ③ 冻结门族扩（`responsive` ∥ ping 兜底 + 恢复动作 `forcefullyCrashRenderer()` + `reload()`——once ∕ 5min 节流）；KD-54 ③ 增 H1 节流缺口支（归档回放 ∕ 心跳两径候选）；§4.2 行 1–3 钩面随动。**产品码零触**（约束收正 + 决策 D7–D9 落档）。明细 = 批档 §2.11。

- 2026-09-30（**桌面堆取证修复批 · 设计轮修正块（设计评审 #162 · 发现 1–11 逐号）· eng-designer**——承批档 §3 轮次 1 ∕ 批档 §2.12）：KD-53 ① 补**隔离形**句（策略面零 `electron`（顶层 import 面禁令）· 注入键点名 = `sample` ∕ `snapshot` ∕ `log` · 装配住 `main.mjs`——沿 KD-35 先例）；KD-53 ② 快照触发**判据式 + 定值**（主进程自读堆比 ≥ 85% ∨ 渲染面 `workingSet` ≥ 800MB〔= 两冻结案实测下沿 933MB × 0.85 ≈ 793 ⇒ 圆整〕∧ ping 正常）；KD-53 ③ **ping 径同序**（父裁——落现场 ⇒ 宽限 ⇒ 恢复动作；grace ∕ once ∕ 5min 三守卫同施）；KD-54 ③ **CSS 夹层属性表点名**（`contain: layout style paint` 不含 `size`；`content-visibility: auto` 须携 `contain-intrinsic-size` 且过腿）· ④ 判据补**回填 ∕ 跟滚不跳**腿；§4.1 三行盘上复读（`heap-watch.mjs` **≈160** · `chat-scroll.mjs` **112** · `main.mjs` **136**）；§4.2 行 1 ∕ 2 ∕ 4 ∕ 5 ∕ 6 ∕ 7 随动（越层预案 ∕ 规模预期 ∕ 随动面点名到条）。**零新语义**（同拍 ∕ 登记 ∕ 判据收正）。明细 = 批档 §2.12。
- 2026-09-30（**桌面堆取证修复批 · E2 命中分支落档轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-heap-freeze.md` §1.3c ∕ §2.13 · 台账 #694）：**KD-54 ①** 候选面补记核共享面一行（`thincoder-render-core/flow/block.mjs` 逐 chunk 文本节点追加——实测命中）；
  §4.1 增命中档行（**145** 实读）；§4.2 本批块增行 8（**145 ⇒ ≈150**）+ 行 7 随动（`docs/render-core/design/RENDER-CORE.md` **KD-RC-11** + §6 随动段）。**零新语义**（实测命中登记 + 语义等价修设计）。明细 = 批档 §2.13。

- 2026-09-30（**桌面堆取证修复批 · 前置收正轮（E4 二轮前置 + #164 交付随动）· eng-designer**——承批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.14 ∥ §5.5 · 台账 #694）：KD-53 ③ ping 定值点名（**间隔 15s** ∕ 超时 8s ∕ 连超 2——父裁收紧 30s ⇒ 15s；收正单源 = 批档 §2.14）+ KD-53 ① 状态位收正（拟新增 ⇒ 本批新档）+ **KD-53 ③ 补 D9 修订单**（重载后活跃会话自动接续——渲染侧 boot 补启；收正单源 = 批档 §2.14a）；
  §4.1 两行回针（`thincoder-desktop/src/main/heap-watch.mjs` **299** ∥ `thincoder-desktop/src/main/main.mjs` **183**——实读 2026-09-30）+ §4.2 本批块行 1–3 随动（**299** ∥ **136 ⇒ 183** ∥ `window.mjs` **零改句**）+ 行 6 批内件实读（**312 行 · 8 用例** ∥ **311 行**——批内件不计线（KD-4））。**零新语义**（读数 ∕ 登记 ∕ 父裁值 ∕ 父裁点修 ④ 机制条文——非本席新拟）。明细 = 批档 §2.14 ∕ §2.14a。

- 2026-09-30（**doc-sweep 批 · RF 收正族 · eng-designer**——承 `docs/batches/2026-09-30-doc-sweep.md` §2 · 台账 #661 ∕ #672）：§4.2 RF 块表头改**已实施（2026-09-29 收口）** + 行「现行 ⇒ 实读落值」+ 全行（二十处）按 RF 批 §5 实读重钉（`view-state` **290** ∕ `mount-sessions` **299** 等——四档「（拟新增）」标记随落盘转正）；
  §4.1 补 `view-state.mjs` 登记行（**299**）；§10 CL 行第三缝坐标 `ops.mjs:129 ⇒ :159`。**零新语义**（读数 ∕ 时态 ∕ 坐标收正）。
- 2026-09-30（**桌面 MCP 装配补 `.mcp.json` 项目文件源批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-mcp-json-source.md` §2 · 台账 #691）：§4.1 `agent-assemble.mjs` 行值按届盘实读收正（**32 ⇒ 102**——口子清零二轮（#673）后）+ 行职责列补本批（MCP 合入缝补第二源——项目根 `.mcp.json`）；
  §4.2 增本批「现行 ⇒ 预期」块（五行）；核档 `docs/core/design/MCP.md` §6.4 同拍（发现 ∕ 信任两裁定）· `docs/desktop/design/SHELL.md` §4 补双源句。**零新语义**（裁定落档 ∕ 值收正）。
- 2026-09-30（**桌面残债清付批 · 实施后档面轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-residuals.md` §2.12）：§4.1 行随动——本批 11 码档 + 新档 `ipc-relays.mjs`（**70**）+ 撤会话头批八档实读回填（`index.html` **55** · `views/chrome.mjs` **35** · `chrome.css` **268** · `skin.css` **13** · `app.mjs` **289** · `i18n.mjs` **391** · `chat.css` **329** · `frame-dispatch.mjs` **52**）+ `mount-onboarding.mjs` **90** 单值收形 + 越层段 `ipc.mjs` 除名（**十四 ⇒ 十三档**）· 贴层段 `app.mjs` 解消；
  §4.2——本批「现行 ⇒ 实读落值」块新增（十五行）+ 撤会话头块 ∕ 口子清零二轮块按现盘实读回填（两表头翻「实读落值」）；§7 注随动（`mount-head.mjs` 删档 ∕ 余值对 §4.1 单源）；§10 **CO③** 补录（`…structure-split-round.baseline.json` 内 `.session-head` 第二处）；`docs/desktop/design/{IPC,SHELL}.md` 同拍（档头分发面计数 **331 ⇒ 265** + 树节点）。**零新语义**（读数 ∕ 登记 ∕ 值回填）。明细 = 批档 §2.12。
- 2026-09-30（**桌面堆取证修复批 · E4-JS 支定形轮（父裁点火）· eng-designer**——承批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.15 ∥ §5.7 · 台账 #694）：KD-54 ③ 候选 ② 升**实施径**（CSS 支受控 A/B 实测不可及 ⇒ 分段挂载定形：段 = 12K 渲染字符 ∕ 窗 = 视口段 ±1 ∕ `display:none` 切换（文本恒在 DOM）∥ `patchTextBlock` 调用点零改 ∥ 回滚 = 常量开关）；§4.1 增新档行（`chat-text-segments.mjs` **拟新增 · ≈200**）+ `chat-text.mjs` 行零改注；§4.2 行 5 转「CSS 支已落」+ 增行 5b（JS 支五档落点）；`RENDERER.md` §1.1 ∥ §2 ∥ §3 同拍（段窗条 + 段窗滚动作条）。**零新语义**（父裁 ∥ 设计定形落档）。
- 2026-09-30（**桌面消化行流内落位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 · 台账 #706）：**KD-33 重裁**（`atBoundary` 恒按尾追 ⇒ **末轮元素前插**；无轮 ⇒ 流末退化——消化行族改逐轮元素 · 流内就地后「无边界物」前提消失）+ §4.1 ∕ §4.2 值列归回填轮（本批基线 = 批档 §2）。明细 = 批档 §2。
- 2026-09-30（**桌面消化行流内落位批 · 修正轮 1（评审轮 1 · 发现 1 ∕ 4）· eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 修正轮块）：**KD-33 归档锚句补块序守卫**（末轮元素即块序尾位 ⇒ 前插；否则退化 = 常规块插入点）；§10 增 **CR** 行（重建 ∕ 重挂径复聚登记——复聚含压缩行 ∕ 消化行族相对序翻转）。明细 = 批档 §2 修正轮块。
- 2026-09-30（**doc-sweep 转实施清单随动 · #662 父侧执行**）：§4.2 `:425` ∥ §10 `:1156` 两行 `docRoot` 前提句按现盘收正（**已落**——docRoot 五根含 desktop 两树）；随动 = 码注族（`agent-bridge.mjs` ∕ `chat-guide.mjs` ∕ render-core `thincoder-render-core/composer/panel.mjs` ×3 ∕ `git-run.mjs` ∕ `responses.mjs`）+ 五 CSS 头链序补 `core-markdown`（实序 = `thincoder-desktop/renderer/index.html:19`）
  ——详见台账 #662。**零新语义**（坐标 ∕ 时态收正）。
- 2026-09-30（**消化面留档批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 · 台账 #719）：§2 增 **KD-55**（消化面留档 = 人读线记录 + 页读重建——记录两族 ∥ 边界重划 ∥ 读面 opt-in 直通 ∥ 落盘节律）+ **KD-33 两格收正**（块体 ⇒ 页读域第六型；原「归档块入盘」前提句由留档面取代）；§10 **BA 行半消解**（块体半件——待发送气泡半件保持）· **CR 行半消解**（消化行族半句——压缩行半句留观）；D24 行计数镜像收正（容器 3 · 骨架线（输入区上线）· 控件族 3 · 池条目 1——携带项 #713 ②）；§4.1 `views/chat.mjs` 行页读域句收正（六型全员）；§4.1 ∕ §4.2 值列归回填轮（as-of 政策——本批基线 = 批档 §2 §四）。明细 = 批档 §2。
- 2026-09-30（**桌面堆取证修复批 · E4-JS 收正轮（设计评审 #172 · 发现 1–6 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-desktop-heap-freeze-e4js.md` §3 轮次 1 · 台账 #709）：§4.1 六行实读收正（`views/chat-text-segments.mjs` **497**（拟新增去标 ∥ 距 500 余 3 行）· `views/chat.mjs` **305** · `views/chat-scroll.mjs` **115** · `app.mjs` **292** · `frame-dispatch.mjs` **53** · `views/chat-text.mjs` **126 零改复核**）+ 越层段两档新入册（**十三 ⇒ 十五档**——拆分评审结论 ∥ 预案 ∥ 窗口）+ 硬限余量句；§4.2 行 5b 转实读落值（行 4 ∕ 6 随动）；KD-54 ④ 射程收正（对账 §2.15-B⑤ ∥ E② 三面受损）。**零新语义**（读数 ∥ 处置 ∥ 对账）。明细 = 批档 §2。
- 2026-09-30（**消化面留档批 · 修复轮（评审轮 1 · 发现 1–10 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §3 轮次 1）：
  #1 ∕ #2 ∥ #3 ∥ #6 ∥ #7 ∥ #10 句面 ∕ 镜像 ∕ 计数同拍（KD-33 被否列清「留档面」尸条；KD-36 留存句 ∥ §2.2 行痕句 ∥ §10 CR 行 ⇒ 「切片清点不变 + 记录重建 ⇒ 跨页读存续」；D24 行标签活动态清 ∕ 设置面映射 6 改 + 3 保留 ∕ 负向锁两值列；白名单 45 ⇒ 46 三处同拍 + `record:append` 末位 46 入册）；
  #4 ∥ #5 ∥ #8 ∥ #9 补面（**D4** ∥ **D20** 行恢复态判据句 + §7 **T-DSK49** + §10 **CS**（需求 **D28** 已落——父侧笔）；§4.1 本批触碰块 + §4.2 本批「现行 ⇒ 预期」块十七行（含核两档 `history-window.mjs` ∥ `context.mjs`）+ **A4** ∥ **§8** 核面例外句登记 + `views/chat.mjs` **结构性触碰裁定**（构树面出档随本批实施批执行——越层段同拍）；
  **KD-55 补 ⑤ 消费者容忍清单 ∥ ⑥ 页量计入裁决**；`IPC.md` `record:append` 行补通道族面 ∥ 页游标注项 4）。明细 = 批档 §3。
- 2026-09-30（**消化面留档批 · 修复轮 2（评审轮 2 · 发现 1 ∕ 3 ∕ 5 ∕ 6 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §3 轮次 2）：
  #1 计数时态三处同拍（`ipc.mjs` 行 ∥ `preload.cjs` 行 ∥ §10 **BE** 行——「现行 45 项 ⇒ 本批设计目标 46 项（实施批落）」；BE 行「落地后同值 ∕ 现盘 46」自相抵收一）；#3 §10 **CS** 行腿数收正（机检四腿 ⇒ **五腿**——与需求 **D28** 同值）；
  #5 §4.1 补 `chat-digest.mjs` 登记行（**208** 实读——「新档落盘随批登记」缺口收正；#708 值列族点名承前）；#6 `suspension-drive.mjs` **触属性裁定**（**结构性触碰**——记录追加 = 增逻辑；⇒ 拆分 = 窗内时效面出档随本批实施批执行——主行 ∥ 越层段 ∥ §4.2 行 1 ∥ 本批触碰块四处同拍）。**零新语义**（时态 ∕ 登记 ∕ 裁定）。明细 = 批档 §3 轮次 2。
- 2026-09-30（**消化痕口径收正（用户 2026-09-30 15:4x ∥ 15:53 走查裁定）· eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 增量注记）：**KD-36** ∥ **KD-55** ∥ §2.2 ∥ §4.1 ∥ §4.2 值列 ∥ §10 **CR** 涉句收正——**行入流（与内容同生态）**：无专门「摘 ∥ 留」处理；重建按记录位次复列（段界可辨）；「多轮累积 · 终态留档」「跨页读存续」「随窗摘除」「记录序复列 ∕ 回放」类表述同拍。来路 = R10 标签化 → #670 升格桌面目标（无用户点名 ∥ 用户腿未跑即收口——台账 #728 实查 v2 在册）；对位基准纠偏 = VSC 无「留存不摘」行为（残存现象非行为）。
- 2026-09-30（**消化面留档批 · 回填轮（实施 A+B 落定）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §5 ∥ §2 回填轮注记）：§4.1 本批触碰块转**终值**（含两新档登记 `suspension-timers.mjs` **68** ∥ `views/chat-tree.mjs` **127** + 表外三档随批补行 `store.mjs` **303** ∥ `session-slots.mjs` **235** ∥ `chat-subagent.mjs` **101**）· 越层段两档除名（十五 ⇒ **十三档**——`suspension-drive.mjs` **295** ∥ `views/chat.mjs` **234**）+ `store.mjs` 触属性裁定（行级小修 ⇒ 窗口顺延）+ 次大句 ∥ 贴层段随动（`chat-digest.mjs` **298** 入贴层）；§4.2 本批块转**实读落值**（十七行 + 表外三行）；§10 **BE** 行计数落定（46 项——已落）；白名单同拍（`ipc.mjs` 行 ∥ `preload.cjs` 行 ∥ **BE** 行）。**零新语义**（计数 ∥ 读数 ∥ 登记 ∥ 裁定落档）。明细 = 批档 §2 回填轮注记。
- 2026-09-30（**桌面重启自动重开批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-reopen-last-project.md` §1 · 台账 #734 · 需求 D1 判据扩展）：§2 增 **KD-56**（重启自动重开 = 本端记录面回读——读 ∕ 写（零新增）∕ 启动接线 ∕ 降级三档 ∕ 边界五则 + 被否四候选）· **KD-9 两处收正**（启动种子指针 + 被否候选限定「当最近列表读面用」）；
  §4.1 两行说明随动（值列不动——实施批回填）；§4.2 增本批「现行 ⇒ 预期」块（四行）；§6.1 **D1** 行补重启自动重开判据句 + §7 增 **T-DSK50**（真 Electron 两启程）+ §8 本批边界行 + §10 增 **CT**（自铸披露）· **CU**（多实例条文张力——存量登记）；**产品码零触**。明细 = 批档 §2。
- 2026-09-30（**排版统一批（D29）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-typography-unify.md` §1 · 台账 #736 · 需求 D29）：§2 增 **KD-57**（桌面排版基线——统一值 ∥ 零粗体与颜色通道 ∥ markdown 修饰层口径 ∥ D21 关系 ∥ 核件零触 ∥ 回退配方 ∥ 边界 + 被否四候选）；§4.2 增本批「现行 ⇒ 预期」块（十四行）；§6.1 增「排版统一批（验收面）」块（需求回指 D29 + 机检两腿 + 真机面）；§7 增 **T-DSK51**；§10 增 **CV**（自铸披露 + AM 行回退口径随动）。**产品码零触**。明细 = 批档 §2。
- 2026-09-30（**扁平化随动收口批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-flat-followups.md` §2 · 台账 #713）：§4.1 值列回填十一处（门行数面现读 10 差异 + 1 行式异常——逐档实读终值；13 ⇒ 10 对账在册）+ UI.md 残句补遗一处（`:163` 死引清）+ D24 注「本批不动」清单 `.tool-result` 顶线残句删。**零新语义**（读数 ∕ 残句收形）。明细 = 批档 §2。
- 2026-09-30（**桌面重启自动重开批 · 修复轮（评审轮次 1 · §3 · 发现 1–5 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-desktop-reopen-last-project.md` §3）：D1 行通道面括注限定「最近目录列表面」+ 补「`cwd` 面仍消费」（按 `docs/desktop/design/IPC.md` 项「`project:recent`」行既有口径）；批内件腿清单四 ⇒ **五腿**（补「族无可读 `cwd`」降级腿——`:975` ∥ `:1019` ∥ `:1148` 三处同拍）；
  四处坐标按现盘重锚（KD-5 `:105` ∥ `:113` ∥ `:115` · KD-9 `:101` ∥ `:117-120` ∥ `:122-125`）；KD-56 ① 补并列定序（同级族哈希升序——沿「最近目录」先例）+ 批内件显式 mtime 口径；KD-56 ④ 降级日志分档（无记录零日志——`IPC.md:241` 同拍）。**零新语义**（口径 ∥ 计数 ∥ 坐标 ∥ 定序 ∥ 日志分档收正）。明细 = 批档 §2 修复块。
- 2026-09-30（**消化回流归位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-reflow-anchor.md` §2 · 台账 #738）：**KD-36** ∥ **KD-55** ∥ §2.2 ∥ §6.1 D4 行 ∥ §10 **CR** 涉句收正——**显示面 = 只留当前消化的这一轮**（新轮起跑清旧终态行；重载复列最新一条）；块侧 = **消化起跑窗归档**（`ev:digest start` 点补发 `done`；`reclaim` 兜底幂等）；记录面全量照留。**口径收正 = 用户 2026-09-30 15:4x ∥ 18:53 字面**（15:53 误译面清）。明细 = 批档 §2。
- 2026-09-30（**消化回流归位批 · 修复轮（评审轮 1 · 发现 1–8 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-reflow-anchor.md` §3 轮次 1）：**KD-34** 归档句 ∥ §4.1 `suspension-drive.mjs` 行**同拍起跑窗口径**（归档面 = `ev:digest start` 点补发 `done`；`reclaim` 兜底幂等——与 `docs/desktop/design/RENDERER.md` §1.1 块归档面同字）；
  §6.1 **D4** 行补本批判据（旧轮终态行零节点负判 ∥ 标签行两态 ∥ 归档块 ∥ 消费行族文档序）+ §7 增「消化回流归位批注」+ §4.2 增本批「现行 ⇒ 预期」块（四档 + 批内件 + 设计档；`chat-digest.mjs` 贴层 ∥ 越 300 拆分预案在册）；变更记录**指位收正**（「§7 D4 行」⇒「§6.1 D4 行」——发现 8）。明细 = 批档 §2 收正轮块。
- 2026-09-30（**右栏宽度拖动批（D30 · 台账 #742）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-pool-width-drag.md` §1 ∥ 需求 D30 父侧收正后现文）：§2 增 **KD-58**（右栏宽度拖动 = 单一权威链（用户值）——拖柄 ∥ 交互三段 ∥ 范围上下限 ∥ 持久化 = `localStorage`（端自有 UI 态）∥ 前提收正（#115 作废在册——不重建 ∥ 不复活）∥ 边界 + 被否五候选）；
  §4.1 增 `thincoder-desktop/renderer/pool-width.mjs` 行（拟新增 · ≈100）；§4.2 增本批「现行 ⇒ 预期」块（八行）；§6.1 表头 **D1–D29 ⇒ D1–D30** + 「右栏宽度拖动批」块（机检五腿 + T-DSK52 + 离线不可产面）；§7 增 **T-DSK52**（两启程）；§8 本批边界行；§10 增 **CW**（自铸披露 + 存储载体口径 + #115 作废事实）；
  `docs/desktop/design/UI.md` §1 本批注六项 + 布局 ∥ open 两行 + 变更记录；`docs/desktop/design/RENDERER.md` §1 索引 + §1.3 + 变更记录。**产品码零触**。明细 = 批档 §2。
- 2026-09-30（**右栏宽度拖动批 · 修复轮（评审轮 1 · §3 · 发现 1–6 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-pool-width-drag.md` §3 轮次 1）：**KD-58 ②** ∥ §6.1 批块腿④ ∥ §4.2 `chrome.css` 行与 `docs/desktop/design/UI.md` §1 本批注 ∥ `docs/desktop/design/RENDERER.md` §1.3 同拍——
  **落定前置**（rAF 待写取「刷」一拍——撤帧 + 同步落值；末位不丢 ∥ 落定后零迟到写）· **写径 = CSSOM**（`style` 属性径禁——平台行为未核）· 触控径 `touch-action: none`；档头行 **D1–D29 ⇒ D1–D30** 补漏；
  §4.1 `theme.css` 行 **89 ⇒ 95** 回填（现盘实读——D29 落盘后值）；§4.2 词面行补**键数链随动**（`HOST_DICT` 293 ⇒ 294——链行续写 = 实施轮笔）。**产品码零触 · 零新语义**。明细 = 批档 §2 修复轮块。
- 2026-09-30（**窗口重启最大化批（D31 · 台账 #745）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-window-maximize.md` §1 ∥ 需求 D31）：§2 增 **KD-59**（窗口重启最大化 = 启动序「隐建 → maximize → show」（「永远」语义——零窗口态记忆）——时机判由 ∥ 平台语义 ∥ 既有窗口逻辑交互 ∥ 边界 + 被否三候选）；
  §4.1 `window.mjs` 行说明随动（值列不动——实施批回填）；§4.2 增本批「现行 ⇒ 预期」块（三行）；§6.1 表头 **D1–D30 ⇒ D1–D31** + 「窗口重启最大化批（验收面）」块；§7 增 **T-DSK53**（两启程）；§8 本批边界行；§10 增 **CX**（自铸披露）；
  档头 D 号随动 + `docs/desktop/design/SHELL.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/desktop/design/UI.md` ∥ `docs/desktop/design/RENDERER.md` 四档档头同拍。**产品码零触**。明细 = 批档 §2。
- 2026-09-30（**窗口重启最大化批 · 修复轮（评审轮 1 · §3 · 发现 1–4 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-window-maximize.md` §3 轮次 1（pass · 🟡1 ∥ 🔵3 · 父侧裁 = 全采纳））：
  **KD-59 ②** 判由前提标「推论待真机证」（首帧判径 = `show()` 当刻读 `isMaximized()` ∥ 首帧录屏 ∕ 截图走查）；**⑤** 补 fail-open 档（平台忽略 maximize ⇒ `show()` 兜底 ⇒ 显形不最大化 · 零告警 · 零重试）；**④** 补登记指针（§10 **CY**）；
  §6.1 批块真机面 ∥ §7 **T-DSK53** 补首帧腿 + ① 载体点名（父侧走查即时读数——不采冒烟字段）；机检腿③两处（§4.2 块 ∥ §6.1 批块）补「扫描面 = `window.mjs`」；§4.1 `main.mjs` 行重钉 **203**（实读——采集收网批面后对盘；说明句补该批面）；§10 增 **CY**（macOS 语义待裁）。**产品码零触 · 零新语义**。明细 = 批档 §2 修复轮块。
- 2026-09-30（**块到达时点归位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-block-arrival-timing.md` §1 · 台账 #746）：**KD-36** ∥ §6.1 **D4** 行 ∥ §4.2 涉句收正——非挂起态 settle 亦发 `⟦ev⟧settled`（`⟦ev⟧done` = 消费面补发——桌面起跑窗 ∥ reclaim ∥ 退出 freeze）：块**零即时归档**（S 块不入运行中回合块列内部）、归档随消费窗（[块][轮] 对不拆）；§7 增「块到达时点归位批注」（两形腿 + 真机一条）；§4.2 增本批「现行 ⇒ 预期」块（核心一档 + 批内件 + 设计档；**桌面产品码零触**）。核件单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8 同拍。明细 = 批档 §2。
- 2026-09-30（**块到达时点归位批 · 修复轮（评审轮 1 · 发现 1–4 逐号 · 父侧裁 = 全采纳）· eng-designer**——承 `docs/batches/2026-09-30-block-arrival-timing.md` §3）：§4.2 行 1 补越线登记指针（核档 §6.20.4——**302 ⇒ ≈306** 拆分预案在册）∥ 行 2 补批内件规模预期（≈120–160 行 · 用例 = 两形腿 + 幂等腿）∥ 零触面句补核点指针（§10 **CZ**）；§10 增 **CZ**（跨端验证点——CLI「无补发」下冻结触发面 ∥ VSC reclaim 对位）。**产品码零触 · 零新语义**。明细 = 批档 §2 修复轮块。
- 2026-09-30（**块到达时点归位批 · 对帐后收正轮（④）· eng-designer**——承批档 `docs/batches/2026-09-30-block-arrival-timing.md` §2 收正块 · 用户口径修正〔差异出路 = 消除；「登记保留」通道撤销〕）：§10 增 **DA**（跨端**统一待办**——① 显示面轮数〔只留当轮 vs 两端全量累加〕∥ ② 行族结构〔无轮容器 ∥ cap 行位置〕；逐条 = 三端现状坐标 + **统一方向待裁**）。**零新语义 · 产品码零触**。明细 = 批档 §2 收正块。

- 2026-09-30（**三端消化面统一批 · 重写设计轮 · eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §1 ∥ §2 · 台账 #747）：§2 增 **KD-60**（三端消化面统一 = 桌面按 VSC ∥ CLI 实形重写——行族回累积 ∥ 撤标签退场 ∥ 归档触发回 reclaim 形（#746 衔接 ∥ 依赖先行）∥ 归档落位改 VSC 边界物形（座次入模 ∥ 守卫链退场 ∥ 复列镜式）∥ 宿主面三件保留 ∥ 词表清扫 + #738 修复轮逐条衔接）；**KD-33 ∥ KD-34 ∥ KD-36 ∥ KD-55 ∥ §6.1 D4 行 ∥ §10 DA ∥ CR 涉句同拍** + §7 增「三端消化面统一批注」+ §4.2 增本批「现行 ⇒ 预期」块（十行）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 预评审收正轮 · eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §2 收正块）：§10 **DA** ② 随裁（保持待裁 ⇒ 已裁：并入 #747——对位 VSC 收正）∥ **KD-60** 上抛栏同拍（行族遗留差异两条——已裁并入本批；#746 依赖序——已派先行）。**零新语义 · 产品码零触**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 修复轮（评审轮 1 · 发现 1–7 逐号 + ① 落形裁 + 范围增补〔块族态名〕· 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §3 轮次 1 ∥ 用户 22:26 裁定）：
  ① 裁落形 = **行族形态规范句**（**无轮容器** ∥ **cap 行 = 尾追形**——对位 VSC 实形；形面单源 = `docs/desktop/design/RENDERER.md` §1.1）+ 同裁副本收正（`docs/desktop/design/IPC.md` §1 ∥ §10 **DA** ② ∥ **KD-60** 上抛栏 ∥ `docs/desktop/design/UI.md` §1 对话流行 ∥ 间距注）+ §4.2 seat 档行「保留改写」；
  ② **KD-55 ③**「最新一条」⇒「页内全量轮」；③ `docs/desktop/design/UI.md` 项 5 归档锚句 ∥ 块序句 ∥ 归档句（＋ T-DSK36 同句）收正；④ §4.1 五档实读收正（**292** ∥ **89** ∥ **213** ∥ **128** ∥ **116**）+ 新档行 `chat-digest-seat.mjs` **232** + 贴层段随动 + §4.2 行 3 补「净增不致越层」；
  ⑤ §7 批注补判据载体（机检四腿 + 真机一条——§6.1 D4 指针可达）；⑥ 残句删净（`docs/desktop/design/RENDERER.md` ∥ 本档 KD-34 ∥ KD-36 ∥ KD-60 ③∥④∥⑥ ∥ §4.1 行涉句——「已撤 ∥ 被替代」类）；⑦ **KD-60 ⑥ 重写**（清扫面三面 ∥ 保留词 ∥ 定名四件）；⑧（范围增补）**块族态名 = 等待消化**（`awaitingDigest`）——KD-60 ⑥ 落定 + 态名语义「驻留」逐处收正（KD-26 ∥ KD-36 ∥ KD-55 涉句 ∥ §6.1 ∥ §7 ∥ §10；非态名语义保留在册）。**产品码零触 · 零新语义**（裁定落形 ∥ 读数 ∥ 残句收形 ∥ 态名收正）。明细 = 批档 §2 修复轮块。
- 2026-09-30（**三端消化面统一批 · 实施后收正轮（#747 实施交付）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §5 ∥ §2）：
  §4.1 十档读数按盘面实读收正（内容行数口径 = 文末换行不计）：`thincoder-desktop/src/main/suspension-drive.mjs` **294** ∥ `renderer/events-wake.mjs` **123** ∥ `chat-digest.mjs` **226** ∥ `chat-digest-seat.mjs` **275** ∥ `views/chat.mjs` **244** ∥ `views/chat-tree.mjs` **151** ∥ `views/chat-chrome.mjs` **221** ∥ `renderer/page-read.mjs` **281** ∥ `thincoder-desktop/renderer/chat.css` **354** ∥ `renderer/subagent-reduce.mjs` **301**——§5 自报值五档 +1 ∥ 一档估读差（read 面末空行计入面 ∥ 估读——均按盘面收正；逐档差在册 = 批档 §2）；越层段 **十三 ⇒ 十四档**（`subagent-reduce.mjs` 新入册 + 拆分预案）+ `chat.css` 条目 **350 ⇒ 354** + 贴层段随动；
  §4.2 本批块「现行 ⇒ 预期」⇒ **「现行 ⇒ 实读（实施落盘）」**（九产品行实读回填：**292 ⇒ 294** ∥ **89 ⇒ 123** ∥ **116 ⇒ 226** ∥ **232 ⇒ 275** ∥ **234 ⇒ 244** ∥ **128 ⇒ 151** ∥ **221 ⇒ 221**（净 0）∥ **213 ⇒ 281** ∥ **350 ⇒ 354**）+ **声明外两档登记**（`subagent-reduce.mjs` **250 ⇒ 301**（父侧 22:45 裁 = 准机制落）∥ `views/chat-model.mjs` 注释 1 处（**104 ⇒ 104** 净 0））+ **「批内件」行补**（`docs/batches/2026-09-30-triple-end-digest-unify.test.mjs`——**已建成 · 580 行** · 四腿）+ 零触面残句收正（`subagent-reduce.mjs` ∥ `chat-tree.mjs` 出零触面——父侧 22:45 裁）；
  §7 批注「（拟新增）」转正（**已建成 · 580 行**）∥ 真机面注 ⇒ **用户侧观察（随下次桌面重启）**。**产品码零触 · 零新语义**（读数 ∥ 登记 ∥ 转正）。明细 = 批档 §2 实施后收正轮块。
- 2026-09-30（**主题切换批（D33 · 台账 #743）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §1 骨架 + 需求 D33）：§2 增 **KD-61**（主题三态 = 渲染面 `data-theme` 状态——状态载体 ∥ 值面 ∥ 切换面 ∥ 持久化 ∥ store 镜像 ∥ 边界 + 被否五候选）；§4.1 增 `renderer/theme.mjs` 行（拟新增）+ 三行实读收正（`theme.css` **96** ∥ `app.mjs` **300** ∥ `settings.css` **298**）+ `i18n-settings.mjs` 键收回填（56）+ 越层段贴层两档新入册；§4.2 增本批「现行 ⇒ 预期」块（十二行）；§6.1 增「主题切换批（验收面）」块 + 表头 **D1–D31 ⇒ D1–D33**；§7 增 **T-DSK54**；§8 增本批边界行；§10 增 **DB**（自铸披露 + 两披露）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-09-30（**文档清账批 · 值列回填轮 · eng-designer**——承台账 #703 ∥ #713（门回填族））：§4.1 九处值列按盘实读回填（`projects.mjs` **175** ∥ `heap-watch.mjs` **315** ∥ `index.html` **56** ∥
  `chrome.css` **281** ∥ `pool.css` **112** ∥ `i18n.mjs` **394** ∥ `core.css` **333** ∥ `chat-cards.css` **155** ∥ `chat-composer.css` **138**）+ `pool-width.mjs` 行对账终值（拟新增 ⇒ 已落 ∥ **≈100 ⇒ 123**）+
  越层段两档读数随动（`i18n.mjs` ∥ `core.css`）+ §4.2 pool-width 行「实读落值」。**零新语义**（读数 ∥ 登记收正）。明细 = 批档 §2。
- 2026-10-01（**消化行只留当轮收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 ∥ §2 · 台账 #754）：§2 增 **KD-62**（消化行族 = 只留当轮收正——显示面换代退场 ∥ 终态非 ask 标签退场 ∥ 复列最新一条 ∥ 边界行取面首元素 ∥ 记录面照留 ∥ 两端零动（实读 = 逐轮累积）；被否 = 两端向桌面收编 ∥ 标签恒在保留 ∥ 起跑窗挂块恢复 ∥ 记录面改形）；**KD-36 ∥ KD-55 ∥ KD-60 ①②④⑥ ∥ §2.2 涉句 ∥ §6.1 D4 行 ∥ §10 DA ① ∥ CR 涉句同拍**；§7 置换「三端消化面统一批注」⇒「消化行只留当轮收正批注」；§4.2 增本批「现行 ⇒ 预期」块（七行）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**web 快筛批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-09-30-web-quickcheck.md` §1 ∥ §2 · 台账 #434）：新建设计档 `docs/desktop/design/WEB-QUICKCHECK.md`（静态服务 ∥ host shim ∥ 真浏览器冒烟——W 系列 KD 七条；权威面 = Electron 裁定）；
  §4.1 增工具三行（拟新增）+ `package.json` 值列随动（**23 ⇒ 24**——scripts +1）；§4.2 增本批「现行 ⇒ 预期」块（四行）；§5 script 行 **四条 ⇒ 五条**（增 `quickcheck`——非套件）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**主题切换批（D33 · 台账 #743）· 修复轮（评审轮 1 · 发现 1 ∥ 4 ∥ 5 ∥ 7）· eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §2 修复轮块）：§4.2 行 1 变更列补「档头注 ∥ 暗块互引注随正」（同批 `window.mjs` 行点名式同形）+ 非色变量（`--mono`）随块消解半句；§6.1 验收块腿 ④ 扫描面补范围句（⊇ 属性写径——`setAttribute("data-theme", …)` 形入扫）；§8「设置面批」边界句「主题切换面（未在需求档）」⇒「（**已落——D33**）」（同行 `memory:status` 先例同形）。**零新语义**（点名 ∥ 判据扫描面 ∥ 状态标记）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**web 快筛批 · 修复轮（评审轮 1 · 发现 1–5）· eng-designer**——承批档 `docs/batches/2026-09-30-web-quickcheck.md` §3 轮次 1（pass · 0🔴/3🟡/2🔵））：档头 **六 ⇒ 七档** + `WEB-QUICKCHECK.md` 入枚举（§1.1 同拍）；§10 增 **DC** 行（U1–U3 登记）+ 行 **R** 状态收正（判据④：快筛工具落形 ∥ 一致性核仍不做）；§8 E2E 行补状态注。**零新语义 · 产品码零触**。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 + 扩展设计轮（评审轮 1 · 十发现逐号 + 用户 01:48–02:08 定稿）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 ∥ §3 轮次 1 · 台账 #754）：§2 **KD-62 全条款扩展**（三端通判（旧轮出模型 ∥ CLI 行退场 ∥ VSC 元素退场）∥ 落位翻转（族末之后——边界取面 = 文档序末元素）∥ 起跑窗复位 ∥ 闪现三修）；**KD-60 ①②③④⑥ + 更正确认**（两端同批收正 ∥ 归档触发起跑窗 ∥ 落位翻转 ∥ 词表（起跑窗）+ 误冠更正）；**KD-33 ∥ KD-36 ∥ KD-55 涉句同拍**；§6.1 D4 行 ∥ §7 批注（九腿 + 两端臂）∥ §10 **DA ① 收正（差异消除）** ∥ §4.2 本批块扩列（两档翻转 + 五档新入 + 两端两行 + 批内件两件 + 零触面收正）；变更记录一行。**产品码零触（设计轮）· 记录面零动**。明细 = 批档 §2 修复轮 + 扩展轮块。
- 2026-10-01（**消化行只留当轮收正批 · 增量轮（用户 02:21 裁 A——两端随正）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 第六条 · 台账 #754）：KD-34 ∥ KD-60 ③④ ∥ KD-62 ④⑥ ∥ §10 DA（增③）**三端同形**句落——归档时点 = 起跑窗、落位 = 族末之后（两端随正）；CLI 坐标收正 `thincoder-cli/src/tui/suspension-drive.mjs:173 ⇒ :182`。明细 = 批档 §2 增量轮块。
- 2026-10-01（**轻通道轮四收尾 · §2 增量（笔 6–12 + 上抛遗留清）· eng-designer**——承 `docs/batches/2026-10-01-light-round-4.md` §1 ∥ §2 · 台账 #759）：§2 **KD-57** 标题 ∥ ① 值面随轮四收窄收正（行高 **1.3** ∥ 字号 **12px**；撤列 1.3 退列 ⇒ 六值）；§6.1 排版统一批（验收面）② 腿 ∥ §7 **T-DSK51** ① ④ 两条随动（12px ∥ 15.6px = 12 × 1.3）。**产品码零触（设计轮）**。明细 = 批档 §2 增量块。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 2（评审轮 2 · 八发现逐号）· eng-designer**——承批档 §3 轮次 2 · 台账 #754）：**三副本落位收正**（§7 T-DSK36 用例行 ∥ #746 批注真机面——归档 = 起跑窗 ∥ 居消费轮族末（状态行）之后）；**KD-62 ⑤ 面分列**（记录侧零动 ∥ 复列随本批改）+ §4.2 零触面句同拍；
  **触发形残句清**（§4.2 #746 块零触面——回收窗形 ⇒ 起跑窗）；**KD-62 ⑥ 失效形名句清**（+ §7 批注同式同笔）；§4.2 行 5e **CLI 三档现值落数**（220 ∥ 317 ∥ 62——含将改件 `conversation-writer.mjs` 补入）。**零新语义**（收正 ∥ 清形 ∥ 读数）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 修复轮 1（评审轮 1 · 七发现逐号）· eng-designer**——承 `docs/batches/2026-10-01-desktop-slash-commands.md` §3 轮次 1 · 台账 #761 · 明细 = 批档 §2 修复轮块）：§2 **KD-25** 键位组句依据重锚（需求 §3.5 斜杠边界 ⇒ **提示不入段**）+ 同行被否句同拍；**KD-40** 边界（slash 尾径）句重锚（**斜杠提交面拦截、不进队**——队列侧 = 防御语义保留）；§4.1 越层在册行 `i18n-views.mjs` 补本批随动（+3 键 × 2 语 ⇒ 续期）；§4.2 本批块行 3 ∥ 行 4 补越层处置句（i18n-views = 续期 ∥ model-menu = 续期 + 拆分预案 + 消解窗口）。**零新语义**（依据重锚 ∥ 处置句补登）。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 3（评审轮 3 · 二发现逐号）· eng-designer**——承批档 §3 轮次 3 · 台账 #754）：§7 批注「前批件处置在册」清单扩全——补腿 3b/3b′（归档块居消费行族之前——含头段换代径）∥ 腿 4a（全量完整轮 + `endAt`）= 已退场语义 + 「余腿按新口径随实施轮全件复核」句。**零新语义**（清单点名 ∥ 兜底句）。明细 = 批档 §2 修复轮 3 块。
- 2026-10-01（**桌面消化痕彻底拆批（座次机拆除 + 单体重建）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §1 ∥ §2 · 台账 #765）：§2 **KD 涉句收正**（KD-33 ∥ KD-55 ④ ∥ KD-60 ④ ∥ KD-62 ⑦——座次机拆除 ∥ 静态落位锚（族尾锚）；裁决 = 父侧 **B′「拆机不拆序」** + 证伪轮（正常链「晚到」不可达——锚的实证服务面 = 重挂径 ∥ 中止残项径））；§6.1 D4 ∥ §7 批注同拍；§4.2 增本批「现行 ⇒ 预期」块（十一行）；`docs/desktop/design/RENDERER.md` §1.1 六处 + 新「静态落位锚」条。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 增量块（`/help`）· initial 轮 · eng-designer**——承本批 §1 增量（用户 04:15 ∥ 04:18 直斥 + 派单）· 台账 #761 · 明细 = 批档 §2.10）：§4.2 增本批增量「现行 ⇒ 预期」块（十五行）；§4.1 越层段两处随动（`store.mjs` = 结构性触碰 ⇒ 拆档评估窗口触发（处置待父侧裁）；`i18n-views.mjs` = 续期随动）。**产品码零触（设计轮）**。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 1（评审轮 1 · 1..11 + F2 + F3）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §3 轮次 1 + 父侧 F2/F3（含 04:46 ∥ 04:47 ∥ 04:55 ∥ 04:56 各收正）· 台账 #765）：**F2 零存储收正**——锚整删（「静态落位锚」⇒「消化面落位与重挂规则」；`shiftKept*` ∥ 边界清点 ∥ 到达序标全无；懒加载径 = 行族零动 ∥ 零算术）；**F3 全流层升格**——「恢复序 ≡ 记录序」判据句 + 腿 7 机检形 + 页读域窗口化障碍面（上抛在册）；KD-33 ∥ KD-55④ ∥ KD-60①④ ∥ KD-62①④⑦ ∥ §6.1 D4 ∥ §7 批注 ∥ §4.2 块（行 1–5/7/8/10/11）涉句同拍；§4.1 八档随动（`:231` 语义注随 #754 收正 ∥ `:260` 改名行 ∥ `:236` + 越层段 `:342` 越层处置 ∥ 读数回填标记——随实施轮）；**KD-60① ∥ KD-62① `rid` 语删**。**产品码零触（设计轮）· 裁落形（用户 04:47 零存储 ∥ 04:55 全流层 ∥ 04:56 懒加载径）**。明细 = 批档 §2 修复轮 1 块。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 2 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §3 轮次 2 · 台账 #765）：KD-33 `atBoundary`（`:72`）∥ KD-55 ④ `blockAnchor`（`:98`）两处**归属注落**（核件现行载荷键 ∥ 端面现行导出名——零动作，非座次机残名）。**零新语义**（语汇归属注）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面消化痕彻底拆批 · 副本面清面轮（基础重裁对齐）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §2 基础重裁块上抛① · 台账 #765）：**KD-33 ∥ KD-55②④ ∥ KD-60④ ∥ KD-62⑦ ∥ §2 非同键事件处置段（`:124`）∥ §7 批注 ∥ §4.2 本块（行 2 ∥ 5 ∥ 10 ∥ 11）∥ §10 CR 涉句**逐处对齐新单源（条名指针 ⇒ 「消化行入流与重放规则」条；消化痕 = **流内普通项**——「非块节点」物种措辞退场；不占块序 / 不计 `data-blocks` 事实句保留（沿两端实形）；复列 = 记录位次（零配对）；重挂 = 树面重建（族位快照删）；换代 = 轮对象引用变；白名单两档——配对落尾作废）。**零新语义**（副本随单源对齐）。明细 = 批档 §2 清面轮块。
- 2026-10-01（**桌面流面对账面重写（幻影机拔除）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §1 · 台账 #764 ∥ 用户 05:37–05:59 六斥）：§2 增 **KD-63**（作业单 ∥ 结算步 ∥ 建 ∥ 承载件 ∥ 禁词）+ KD-48③ ∥ KD-50② 涉句收正；§4.1 `views/chat-stream.mjs` 行重写（预估 ≈55）；§4.2 增本批「现行 ⇒ 预期」块（九行）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 1（评审 #90 · 七号逐条）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §3 轮次 1）：**KD-63 ①** 补清账 = 两径同清；§4.2 本批块行 3/4/5 **基数口径逐行明标**（#761 ∥ #765 落盘后）+ 行 8 批内件规模预期（≈300–400 行 · 五腿）。**零新语义**。明细 = 批档 §2 修复轮 1 块。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 2 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §1 父侧残留裁定（#92））：**KD-63 ①** build 触发枚举 **+关页**（`session-wire.mjs:194` 同笔 `withFlowOp`）；§4.2 本块**补行 7b**（`session-wire.mjs` **199 ⇒ ≈200**）+ 行 8 腿 1 八例 ∥ 白名单五作业点。**零新语义**。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 3（缺口-1 设计面同拍）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §5 缺口-1 · 父裁 **Option A**）：**KD-63 ①** build 触发枚举 **+退流清空**（本地先行回声摘空 ⇒ 空态引导面复现——退流点同笔带 `{ kind: "build" }` 作业）；`RENDERER.md` §1.1 两处同拍。明细 = 批档 §2 修正轮 3 块。
- 2026-10-01（**三批读数回填（#761 ∥ #765 ∥ #764 实施落盘）· 父侧**——口径 = 内容行数（`wc-l`）三锚钉定（`view-state` **299** ∥ `frame-dispatch` **53** ∥ `chat.css` **361** 同值）：§4.1 行账全量按盘收正（~30 处）∥ §4.2 三块（15 + 11 + 10 行）「现行 ⇒ 实读」翻档 ∥
  越层段收正（**十四 ⇒ 十三**——`subagent-reduce.mjs` 回线除名兑现 ∥ `store.mjs` 续期裁落 ∥ `app.mjs` 回线 ✓）；行数面复查五处）
- 2026-10-01（**消化行自然形收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §1 ∥ §2 · 台账 #768）：**KD-62 整条重写**（消化行族 = 自然形——行出即留 ∥ 终态追加（锚 `data-digest-end`）∥ 零清理 ∥ 全轮累积 ∥ 复列全量完整轮；被否 = 「只留当轮」恢复等六项）；**KD-36 ∥ KD-55 ∥ KD-60 ①②⑥ ∥ §2.2 涉句 ∥ §6.1 D4 行 ∥ §10 CR 涉句同拍**；§7 置换「消化行只留当轮收正批注」⇒ **「消化行自然形收正批注（台账 #768）」**（八腿 + 真机一条 + 前批件处置在册）；§10 **DA ① 重开登记**（桌面自然形 ∥ 两端只留当轮——本批零触，处置待裁）；§4.2 增本批「现行 ⇒ 预期」块（八行 + 零触面）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**消化行自然形收正批 · 修复轮（评审轮 1 · 八条逐号处置）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §3 轮次 1）：① §10 **CS** 行 D28 验收面按现行文收正（机检八腿 + 真机一条 + 收正面）；② **KD-62 ③ ∥ §4.2 行 3 ∥ §7 腿 ④ 去重键面闭合**（`withFoldedDigest` 并入 = 折叠轮 + 现轮集——并序 + 结构性双份消解；零跨侧去重键——`at` 只随折叠轮侧）；③ 档头需求侧行 **D1–D33 ⇒ D1–D34**（同拍 `RENDERER.md` ∥ `UI.md` ∥ `IPC.md` ∥ `SHELL.md`）；④ §4.1 `events-wake.mjs` 行注加时点限定 + 改指（#768 收正 = 追加）；⑤ §4.2 行 5c 补**触属性 = 行级小修**（不触发拆分）；⑥ §7 判据载体补**收正面映射**（无闪现 ⇒ 腿 ① + ⑥）；⑦ KD-60 ④「旧轮块」⇒「旧轮行」；⑧ KD-62 增**边界（有意特征 · 登记）**（全轮累积 ⇒ 单调增长）。**零新语义**（收正 ∥ 闭合 ∥ 登记）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化行自然形收正批 · 实施后读数回填（父侧直接执行〔机械值面〕 · 可 revert）**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §5 ∥ 父侧复跑）：§4.2 本批块「现行 ⇒ 预期」⇒ **「现行 ⇒ 实读（实施落盘）」**（八产品行实读回填：**101** ∥ **239**〔+17——终态行 ∥ 末轮行账 ∥ 结构采纳径〕∥ **237** ∥ **147** ∥ **205** ∥ **117** ∥ **252** ∥ **366**）+ 批内件行转正（**已建成 · 688 行** · **8/8 绿**）+ §7 批注转正同笔 + 真机面注 ⇒ **用户侧观察**（随下次桌面使用自查）。**零新语义**（读数 ∥ 转正 ∥ 观察形）。明细 = 批档 §5。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇落地轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：M22 五清家族句 ∥ M10 四查位（补 ④）∥ M6 撤回臂描述成分三处收正 ∥ M7 `mount-info.mjs` 行整行退场。明细 = 批档 §2。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇补收轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：§6.1 **D10 行** #461 从句退场（信息行复读链随 M7 删——跨档悬指消解）。明细 = 批档 §2。
- 2026-10-01（**复核扫面收正批 · T-DSK11 死面腿清（父侧直接执行〔③ 类小笔〕 · 可 revert）**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：§7 **T-DSK11** 期望句去「项目级读数行（`[data-slot="info"]`）」死面腿（留流内台账行 + 不随会话变——随 M7 退场）。**零新语义**。
- 2026-10-01（**复核扫面收正批（M1–M22）· 实施后文档随动轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §5 · 台账 #769）：§4.1 值列 **23 处**按届盘实读回填（A–D 四派触档 + 三档 #768 尾账）；`chat-digest.mjs` 删档行去 + 越层段 **十三 ⇒ 十四档**（`app.mjs` ∥ `store.mjs` 拆点登记）+ `queued-input` 残述两处收正。**零新语义**。明细 = 批档 §2。
- 2026-10-01（**记录清账批 · 文档面收正轮 · eng-designer**——承 `docs/batches/2026-10-01-records-docs-reconcile.md` §2 · 台账 #778）：§7「批 9 注」引档收正——六测试档（`settings` ∥ `providers` ∥ `mcp-servers` ∥ `views-settings` ∥ `project-info` ∥ `views-onboarding`）标「随 2026-09-28 测试树全清重置不在盘」（机检面 ⇒ 单元测试档惯例）。**零新语义**。明细 = 批档 §2。
- 2026-10-01（**零语义清账批 #2 · 文档面轮 · eng-designer**——承批档 `docs/batches/2026-10-01-zero-semantic-cleanup-2.md` §2 · 台账 #785）：§7 同族残引收正——D21 注 ∥ 残余批注 ∥ 批 9 用例号归属 ∥ 批 B 用例号归属 ∥ 批 B 追加轮 ∥ 批 A 注引档标「随 2026-09-28 测试树全清重置不在盘」（沿 #778 收正形；#778 已修「批 9 注」零再动）；三处「**已落** · 实读 N」陈标随档失降形（实读数保留）。**零新语义**（陈标 ∥ 不在盘标收正）。明细 = 批档 §2。
- 2026-10-01（**消化重放口径批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §1 ∥ §2 · 台账 #771 ∥ #773）：**KD-62 ③⑤ 收正**（复列 = 全量（未结轮照现——可证面）+ 位次门 + 归属规则）+ **② 补 `n = 0` 守句**；KD-55 ③ ∥ KD-60 ①④⑥ ∥ §2.2 涉句 ∥ §6.1 D4 行 ∥ §7「现行口径」∥ §10 **DA ① 收口**（跨端差异消除）同拍；§4.2 增本批「现行 ⇒ 预期」块（七行）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**零语义清账批 #2 · 修复轮（评审轮 1 · 发现 1 ∕ 6）· eng-designer**——承批档 `docs/batches/2026-10-01-zero-semantic-cleanup-2.md` §3 轮次 1 · 台账 #785）：§7 尾部同族全扫——批 B 注 ∥ 桌面空闲唤醒批注 补块级覆盖句「所列测试档随 2026-09-28 测试树全清重置不在盘」（射程依据 = 台账 #785 原文含「批 A/B 注」）+ `agent-host-suspension` 档「**已落** · 实读 **299**」陈标随档失降形（实读数保留）；计数口径注（行 ∥ 标）。**零新语义**（射程 ∥ 标形 ∥ 陈标）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**桌面二择裁定批（#780 ∥ #782）· 实施轮（产品码 + 设计档同笔）· eng-coder**——承批档 `docs/batches/2026-10-01-desktop-pair-decisions.md` §2 ∥ §4 · 台账 #780 ∥ #782）：#780 = 共享谓词（`renderer/badges.mjs` `hasPendingFor` —— 两清径同引）+ `events.mjs` ∥ `questions.mjs` 两清径判据收正（清码 = 两族皆清）；#782 = cap 腿墓碑同源门（`src/main/turn-face.mjs` —— `opts.timerTurn !== true && !revokedTurn(key, agent)`：帧 ∥ 记录同抑制；`return "stopped"` 零改）；
  §2.2 中止墓碑段 ④ 句形 `end`/`cap`（四查位计数不变）+ §4.2 本批「现行 ⇒ 实读（实施落盘）」块 + §6.1 本批验收块 + §7 增「桌面二择裁定批注」+ §10 增 **DD**（上抛两项）+ `docs/desktop/design/UI.md` `:22` ∥ `:623` 落点同笔。**零新机制 ∥ 核零触 ∥ 协议零变**。明细 = 批档 §5。
- 2026-10-01（**消化重放口径批 · 修复轮（评审轮 1 · 发现 1 ∥ 9）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §3 轮次 1 · 台账 #771 ∥ #773）：KD-60 ⑥ ∥ KD-62 ③ 归属副本随单源收正（**活流侧优先**——运行期未结轮在场 ⇒ 折叠未结末轮不并入）∥ 名义随动（「复列口径统一批」∥「复列口径批」⇒「消化重放口径批」——KD-60 ∥ D4 ∥ CR ∥ DA 涉行）。**零新语义**（副本 ∥ 名随动）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化残余批 · 设计档给句落笔轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-residue-pair.md` §2 修正块 #6（§4 批准）· 台账 #767）：**KD-62 ⑦ 增登记一句**（**复入窗补建**（位次轮入区 ⇒ 缺行者流末补建——到达序；登记例外——单源 = `docs/desktop/design/RENDERER.md` §1.1）——余两句零改）；同批 `docs/desktop/design/RENDERER.md` §1.1 白名单三档落地（该档变更记录同拍）。**产品码零触 · 零新语义（纯落笔）**。明细 = 批档 §2 修正块 #6。
- 2026-10-01（**timer 唤醒投递缺陷修复批（#799）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-timer-wake-delivery.md` §2 · 台账 #799）：§2.2 会话钉定段补「**timer 轮的重装先于投递**」半句（`deliver` 面内——投递行须落重装后机读线；`driveTurn` 对 timer 轮零重装）；§4.2 增本批「现行 ⇒ 预期」块（两档 + 批内件 + 设计档）。**产品码零触（设计轮）· 零新语义**（缺陷修复——核档 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17 已落）。明细 = 批档 §2。
- 2026-10-01（**消化重放批收口随动扫（父侧直接执行〔机械值面 ∥ 副本对盘〕 · 可 revert）**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §6（复审 #38 挂账四条——窗口 = #48 落定后同笔）：① §4.2 本批块转「实读（实施落盘）」（237 ⇒ **258**（≈255 · +3）∥ 239 ⇒ **242** ∥ 116 ⇒ **130** ∥ 103 ⇒ **104**；批内件转正 **298 行 · 9/9 绿**）+ 行 1/2 归属落点对盘单源（`clearDigest` 维持现行 ∥ 归属过滤住并入点——活流侧优先）+ 补行 8（`events-wake.mjs` 实施轮随动）；② KD-60 ⑤ 证据坐标对盘（`:169-176` ⇒ `:168-175`——现盘实读）；③ 688/689 归一 ⇒ **697 行**（内容行数口径〔文末换行不计〕——P1–P5 后 688 + 9 = 697；前载两读之歧随本笔明示口径消解）；④ **KD-55 ③ ∥ KD-62 ③** 可证面副本补钉定半句（「扫描结束仍 `open`」——批档 §2 钉定同字；`RENDERER.md` 副本两处随其档解冻另笔）。**零新语义**（读数 ∥ 坐标 ∥ 副本同拍）。
- 2026-10-01（**消化残余批收口随动（父侧直接执行〔机械值面〕 · 可 revert）**——承批档 `docs/batches/2026-10-01-digest-residue-pair.md` §5/§6 · 台账 #767：① 跨批红两处补丁落（`natural-form` A1–A3 ∥ teardown B）——复跑 **8/8 绿**；② 批内件读数 **697 ⇒ 700**（内容行数口径——A1–A3 净 +3；§4.2 块行 6 ∥ §7 批注两处同拍）；③ 生成区重生成（`api-contract --write` ⇒ **2772 条**（−1 = `digestPresent` 销件随动）∥ `--check` 零漂移）。**零新语义**（补丁 ∥ 读数 ∥ 重生成）。）
- 2026-10-01（**桌面打包发布批 · 阶段一 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-packaging-release.md` §2 · 台账 #807 ∥ 需求 D32 分期令 + 用户签名补正）：§2 增 **KD-64**（桌面打包分发——作用域 ∥ 配置契约 ∥ 两核包物化（源树实拷——electron-builder 无 follow 面实读）∥ 构建序列 ∥ 签名就绪（GlobalSign EV · 两态同管线）∥ 图标 ∥ 版本源 ∥ check-dist 续填 ∥ 官网托管（独立小件 + prune 豁免）∥ 发布线并线）；§4.1 新行五 + 三行收正；§4.2 增本批「现行 ⇒ 预期」块（十一行 + 零触面）；**§5 重写**（打包链与发行面——5.1 配置契约 ∥ 5.2 构建序列 ∥ 5.3 签名就绪 ∥ 5.4 图标资产 ∥ 5.5 产物校验 ∥ 5.6 失败面 ∥ 5.7 其余面——三平台行并入分期）；§6.1 增批块 + §7 增 **T-DSK55** + §8 本批边界行 + §10 增 **DE**。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**桌面打包发布批 · 阶段一 · 修复轮 1（评审轮 1 · 发现 1–7 逐号 + #8 父侧预检 · 父侧裁 = 全采纳）· eng-designer**——承本批档 §3 轮次 1）：① §6.1 **D12** 行 ∥ §6.2 **A3** ∥ §7 **T-DSK14** 三处分期限定（阶段一 = Windows 产物 + 本平台冒烟；macOS ∥ Linux 产物与三平台 CI 随阶段二）；② §6.1 增「斜径命令面批（验收面 · 2026-10-01 · 台账 #761）」块 + §7 增 **T-DSK56** + §10 增 **DF**（自铸披露）+ §8 增本批边界行（命令表归端）；③ `docs/RELEASE.md` §5.6 步骤 3 补仓根坐标；④ 档头需求侧行 ∥ §6.1 表头计数 **D1–D35**（D35 尚无设计面注）；⑤ §10 **DE ④** 措辞收正（点名站点仓生成器 `gen-changelog.mjs`——RELEASE.md 档面已落）；⑥ §7 **T-DSK55 ③** 括注改指 §5.1 行；⑦ §4.2 批内件行补规模预估；⑧（#8 · 父侧预检）§5.3 签名载体二择收正（① PowerShell `Set-AuthenticodeSignature` 主 ∥ ② `signtool` 备）+ §5.6 失败面补「`signtool` 缺席」行 + **KD-64 ⑤** 载体句随动。**零新语义**（收正 ∥ 计数 ∥ 映射补齐）。明细 = 批档 §2 修复块。
- 2026-10-01（**桌面打包发布批 · 阶段一 · 实施后收正轮（实施落盘）· eng-designer**——承批档 §5 未决项 ①（双重调用）∥ ⑤（设计档漂移回填））：§5.1 增行 `win.signtoolOptions.signingHashAlgorithms` = `["sha256"]`（消双重调用——v26 缺省 `["sha1","sha256"]` ⇒ hook 每文件两轮；运行面单轮；yml 落行随修复轮——docs-first 本行先落）；§4.1 八行 + §4.2 本批块十行值列翻「**现行 ⇒ 实读（实施落盘）**」（**37** ∥ **25** ∥ **143** ∥ **163** ∥ **171** ∥ **4 151 B** ∥ **188** ∥ **13** ∥ **25** ∥ 批内件 **372 行 · 20 用例**）；批档 §2.3 值列同拍收正（§2.10）。**零新语义**（读数 ∥ 收正）。
- 2026-10-01（**轻通道轮五收尾 · §2（字号 12 ⇒ 14 定版形式化）· eng-designer**——承 `docs/batches/2026-10-01-light-round-5.md` §1 ∥ §2 · 台账 #808）：§2 **KD-57** ① 字号面随轮五定版收正（**14px**——轻通道轮五 2026-10-01 定版〔12 ⇒ 14〕；级列 12px 回入 ⇒ **八级**）+ 依据列「主阅读面现值」随动；§6.1 排版统一批（验收面）② 腿 ∥ §7 **T-DSK51** ① ④ 两条随动（14px ∥ 18.2px = 14 × 1.3）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-01（**桌面打包发布批 · 阶段一 · 文档面回填轮（#9 修复轮核讫后）· eng-designer**——承批档 §5 定点修复轮 ∥ §6 核讫 ∥ §2.10 自记窗口（yml 修复轮已落行 ⇒ 触发））：§4.1 两行值回填——`thincoder-desktop/electron-builder.yml` **39**（37 ⇒ 39：修复轮 +2〔注释 ∥ `signingHashAlgorithms` 行〕）∥ `thincoder-desktop/.gitignore` **8**（5 ⇒ 8：修复轮 +3〔注释 ∥ `dist/` 条目〕）；§4.2 本批块随动（行 1 yml **无 ⇒ 39**——「终值随实施回归」兑现；行 10 批内件 **373 行 · 20 用例**；表头括注补 `.gitignore` **5 ⇒ 8**）；§5 六处「（拟新增）」转正（根注 ∥ §5.1 档头 ∥ §5.1 sign 行 ∥ §5.3 ∥ §5.4 ∥ §5.7——按现盘落实状态删标）；批档 §2.11 同拍。**零新语义**（读数 ∥ 转正）。明细 = 批档 §2.11。
- 2026-10-02（**桌面打包发布批 · 阶段一 · 构建窗缺陷修复轮（设计面先落——docs-first）· eng-designer**——承实测构建（2026-10-01 深夜 · `npm run package`）NSIS 尾段 `channel` null 崩溃（v26 update-info 路径——无 `publish` 配置触发）⇒ 整链非零退出、`postpackage` 闸被截断；裁定 = **显式 `publish: null`**（v26.15.3 源注释「if explicitly set to null - do not publish」；官网托管独立通道——不走 electron-builder 发布通道）；§5.1 增 `publish` 行 ∥ §5.2 ∥ §5.6 补注（缘由 + 闸完整性）；yml 落行 = 随后 coder 修复轮（本舱设计面先落）。**零新语义**（实测修复落档）。明细 = 批档 §2.12。）
- 2026-10-02（**桌面打包发布批 · 阶段一 · 值列回填 + 镜像行实测选定轮（构建窗实跑后）· eng-designer**——承构建窗 2026-10-02 深夜实跑（electron-builder exit 0 ∥ 全件签名 ∥ check-dist 绿 ∥ 收窗 0）：§4.1 `electron-builder.yml` 值 **39 ⇒ 42**（构建窗修复轮 +3——注释 ∥ `publish: null` 键 ∥ 块间空行）∥ §4.2 本批块两行随动（行 1 yml **无 ⇒ 42**；行 10 批内件 **373 ⇒ 376**——父侧工具面修正 +2〔check-dist 读面 ∕ L3 夹具〕∥ 构建窗修复轮 +1〔L5 `publish` 断言〕——父侧核讫）；§5.7 镜像行 `ELECTRON_BUILDER_BINARIES_MIRROR`「候选」⇒「**实测选定**」（构建窗实测：NSIS 工具下载必需——无镜像时 `read ECONNRESET`；值 = `https://npmmirror.com/mirrors/electron-builder-binaries/`）。**零新语义**（读数 ∥ 实测选定落档）。明细 = 批档 §2.13。）
- 2026-10-02（**菜单体系批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §1 ∥ §2 · 台账 #811 · 需求 D36）：§2 增 **KD-65**（五组双语菜单 + `ev:menu` 窄通道——菜单树 ∥ 通道契约（五动作闭集）∥ 词表单源 ∥ 最近读取时机 ∥ 键位 ∥ 关于面 ∥ 边界 + 被否四候选）；§4.1 新行二（`app-menu.mjs` ∥ `menu-actions.mjs`）+ `menu-words.mjs` 行随动；§4.2 增本批「现行 ⇒ 预期」块（十二行 + 零触面）；§6.1 增本批块 + 表头 **D1–D35 ⇒ D1–D36**；§7 增「菜单体系批注」+ **T-DSK57**；§8 增本批边界行；§10 增 **DG**（自铸披露 + 上抛四项）；`docs/desktop/design/SHELL.md` ∥ `docs/desktop/design/UI.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/desktop/design/RENDERER.md`（机制面零触——计数随动）四档同拍（档头 **D1–D34 ⇒ D1–D36**）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**菜单体系批 · 修复轮（设计评审轮次 1 · 七条逐号 · 父侧裁 = 采纳 7 ∥ 第 8 条〔菜单项选中态 ∥ 勾选态〕零动——用户待裁）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §3 轮次 1）：① §10 **DG** 状态句「②③④待裁；⑤披露」⇒「已裁（引需求档 `:181` ∥ 变更行 `:298`）」+ **KD-65 ②** 删「D36 现文记四动作」句 ⇒「五动作——已收正」；② §7 补 **T-DSK57** 表行 + §6.1 本批块走查补边界项（空最近表 ⇒ 单枚禁用占位 ∥ 未配 locale ⇒ en 回落）——「走查十项」两处齐平（`:1637` ∥ `:1486`；十项 = 九主 + 边界一项（两查））；③ **KD-65 ④** 重建点 **三处 ⇒ 四处**（+语言写径 = `config:write` 成功径 ⇒ `refreshMenu()`——`ipc-relays.mjs` `configWriteChannel`，与 `project:open` 径同形）+ §4.2 增行 4b（`ipc-relays.mjs` **70 ⇒ ≈75**）；④ §4.2 行 12 ∥ 本行补 `docs/desktop/design/RENDERER.md` 计数随动（机制面零触——档头 **D1–D34 ⇒ D1–D36** ∥ 变更行 `:369`）；⑤ §4.1 `window.mjs` 值 **227 ⇒ 229**（实读 2026-10-02）；⑥ app.mjs 越层条目 ∥ §4.2 行 8 补**本批触属性 = 装配接线（非结构性）**——沿「任一后续批择机」顺延；⑦ `docs/desktop/design/UI.md` `:623` ∥ §6.1 `:1486` 加注「macOS = Cmd（`CmdOrCtrl`）」——需求档字面 `Ctrl` 不动。**零新语义**（收正 ∥ 计数 ∥ 登记 ∥ 重建点补入）。明细 = 批档 §2 修复轮附记。
- 2026-10-02（**设置面样式收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §1 · 台账 #812 · 需求 D37）：§2 增 **KD-66**（全七段按 VSC 形态收正——渠道两行卡锚 ∥ 行族通则 ∥ 拨杆形 ∥ 卡界 = 升底 ∥ 拆档 ∥ 端差五条 + 被否四候选）；§4.1 新行一（`thincoder-desktop/renderer/views/settings-sections-providers.mjs`（拟新增）——D37 拆档产出）+ `settings-sections.mjs` 行随动 + 越层段窗口兑现句；§4.2 增本批「现行 ⇒ 预期」块（七行 + 零触面）；§6.1 增本批块 + 表头 **D1–D36 ⇒ D1–D37**；§7 增「设置面样式收正批注」+ **T-DSK58**；§8 增本批边界行；§10 增 **DH**（自铸披露 + 两项待裁）；`docs/desktop/design/{UI,RENDERER,IPC,SHELL}.md` 四档档头 **D1–D36 ⇒ D1–D37**（机制面零触）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**菜单体系批 · 修复轮 2（评审第 8 条 · 主题▸勾选态落地——用户 10:18 裁定 ②「带勾」）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §2.7 ∥ §3 轮次 1）：**KD-65 ①②④⑦ 收正**（① 主题▸带勾（`checkbox` + `checked` 判等——单源 = 回读缓存）；② 菜单 ↔ 渲染面 = 两条窄通道——命令下行 `ev:menu` + **勾选态回读 `theme:state`**（渲染→主单向——新 invoke 白名单项 46 ⇒ 47）；④ 重建点 四处 ⇒ **五处**（+主题态报告径）；⑦ 边界句收「带勾」口径（限度 = 报告缓存 ∥ 报告未达 = 全零勾））+ §4.1 三行随动（`app-menu.mjs` ∥ `ipc.mjs` ∥ `preload.cjs`）+ §4.2 随动（行 1 ∥ 3 ∥ 4 ∥ 5 ∥ 8 + 新行 4c（`ipc-registry.mjs`）∥ 10b（`mount-settings-exits.mjs`）+ 行 12）+ §6.1 走查十项 ⇒ **十一项** + 机检腿 ①⑤ 扩 + §7 **T-DSK57** 同拍 + §8 边界句 + §10 **BE** 同拍；`docs/desktop/design/UI.md` ∥ `docs/desktop/design/IPC.md`（§2 增 `theme:state` 行 + 白名单 46 ⇒ 47）∥ `docs/desktop/design/SHELL.md` 三档同拍。**产品码零触（设计轮）**。明细 = 批档 §2.8。
- 2026-10-02（**设置面样式收正批 · 修复轮（用户 2026-10-02 10:27 两项裁定落地）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §1 ∥ §2 · 台账 #812）：**KD-66 ⑤ 收正**（卡界 = VSC 实形——1px 描边（`--line`）+ 圆角 6px（实读 `thincoder-vscode/webview/settings.css:155-159`）；卡底零独立填充；D24 描边归零基线全局零动——仅本卡界让位）· 被否列清「照搬 VSC 边框 ∥ 圆角」尸条 · §8 边界行同拍（去「VSC 边框」——圆角（非卡余域）留）· §10 **DH** ②③ 转**已裁** + 原则句落（跨端差异项后续变更两端保持同步——本裁定 = 首例）· `docs/desktop/design/UI.md` §1 本批注项 1 ③ ∥ 项 2 ∥ 项 5（端差 **5 ⇒ 4**——① 卡界条消退 ∥ 圆角条收窄为余域）∥ 项 8 + D24 注两处残句清。**零新语义 · 产品码零触**。明细 = 批档 §2.12。
- 2026-10-02（**菜单体系批 · 修复轮 3（设计评审轮次 2 · 发现 1–5 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §3 轮次 2 · 台账 #811）：**KD-61 ⑥ ∥ §8 D33 行 ∥ §10 DB ②** 三处「主进程不持用户值」绝对句补显示缓存限定（不以用户值驱动原生面——唯菜单勾选态显示缓存一枚（**KD-65** ②）；与 `docs/desktop/design/SHELL.md` §2「显示面，不改系统事实面」同口径）+ §10 **DG** 变更行指位收正（`:298` ⇒ `:299`——携「D36 动作集收正」条目名）+ §6.1 本批块设计单源并点 `docs/desktop/design/IPC.md` §2 `theme:state` 行（与 SHELL §2「§1 ∥ §2」同形）。**零新语义**（限定 ∥ 指位 ∥ 指针收正）。明细 = 批档 §2.9。
- 2026-10-02（**菜单体系批 · 修复轮 3 随动（父侧直接执行〔单行限定小笔 · 可 revert〕）**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §2.9 同族第 5 处）：KD-61 **依据列**「主进程只持系统事实（`window.mjs` `resolveTheme()`——画布色）」⇒「主进程持系统事实（同上）+ 唯菜单勾选态显示缓存一枚（**KD-65** ②）」——与修复轮 3 四处（KD-61 ⑥ ∥ §8 ∥ DB ② ∥ UI 项 6）同口径。**零新语义**（措辞收正）。
- 2026-10-02（**设置面样式收正批 · 修复轮 1（设计评审轮次 1 · 发现 1–6 ∥ 8 ∥ 9 逐号 · 父侧裁 = 全采纳；第 7 号 = 需求档面归父侧笔）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §3 轮次 1 · 台账 #812）：
  §2 **KD-66 ②** 动作簇序收正 = **现盘序保持**（修改 ∥ ✕ ∥ 校验 ∥ 移除名——VSC 对位 = 前两件同序）；§6.1 本批块机检面 **四腿 ⇒ 五腿**（+卡界源扫）+ 真机清单随动（六面）；§7 批注 **五面 ⇒ 六面**；§4.2 本批块行 6 腿集同拍（五腿）· 行 5 `mount-settings*.mjs` **四 ⇒ 七档**；§10 **DH ③**「零改」限定对象（值面 ∥ 现盘两面）；
  `docs/desktop/design/UI.md` 同拍（设置面行 ∥ 本批注项 ∥ D24 注——明细 = 批档 §2.13）。**零新语义**（收正 ∥ 计数 ∥ 点名）。
- 2026-10-02（**菜单体系批 · 文档回填轮（实施后 · `onNative` 补注 + 行数实读齐平）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §6 开放项 ① ∥ §5.1 · 台账 #811）：**`onNative` 补注四处**（§2 **KD-65** ① ∥ §4.1 `app-menu.mjs` 行 ∥ §4.2 本批块行 3 ∥ `docs/desktop/design/SHELL.md` §1 树行——`onNative(action)` = 宿主自办三项 `gc` ∥ `index` ∥ `about`——不经 `ev:menu`）；**§4.1 menu 行实读齐平**（`window.mjs` **283** ∥ `menu-words.mjs` **86** ∥ `app-menu.mjs` **已落 · 111** ∥ `menu-actions.mjs` **已落 · 37** ∥ `ipc.mjs` **276** ∥ `ipc-relays.mjs` **77** ∥ `ipc-registry.mjs` **92**（行内注）∥ `preload.cjs` **83** ∥ `events-subscribe.mjs` **101** ∥ `app.mjs` **319**〔越 300 在册句保持〕∥ `mount-composer.mjs` **297** ∥ `mount-settings.mjs` **181** ∥ `mount-settings-exits.mjs` **248**）+ 计数时序标记收正（白名单 47 ∥ 事件 24——已落）；**§4.2 本批块翻「现行 ⇒ 实读（实施落盘）」**（十三产品行实读回填 + 批内件行转正——**300 行 · 五腿 · 8/8 绿**）。**零新语义**（读数 ∥ 补注 ∥ 转正）。明细 = 批档 §2.10。
- 2026-10-02（**菜单体系批 · 时态末笔轮（时序残标翻已落形——§10 BE 行三段）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-menu-system.md` §6.1 ∥ §2.11 · 台账 #811）：§10 **BE** 行收正三段——括注「`ev:menu` ∥ `theme:state`——已落」∥ 状态列「菜单体系批随动已落」∥ 结算列「**菜单体系批随动已落（2026-10-02 实读：23 ⇒ 24 ∥ 46 ⇒ 47）**」。**零新语义**（时态 ∥ 计数收正）。明细 = 批档 §2.11。
- 2026-10-02（**设置面样式收正批 · 代码评审两裁设计面收正轮（①④ 定形 + ⓐⓑ 收正——docs-first）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §5 五①⑤⑥ ∥ §6.1 · 台账 #812）：**KD-66 ③ 补则两件**（只读字段行收束——`.settings-field-readonly` 补缩省略四件 ∥ 提示词面 `.settings-readonly-hint` `flex: 0 0 auto` 不缩；MCP 展开面 = 全显豁免——`.settings-mcp-detail` 域值面 `white-space: normal` + `overflow-wrap: anywhere`；行族通则本体零动）+ §6.1 机检腿 ② 扫描面扩（两则入扫）+ 原因句豁免置位坐标收正（`thincoder-desktop/renderer/views/settings-sections-providers.mjs:81`）+ §7 **T-DSK58 ③** 撤单括注收齐三件（代理 ∥ 移除 ∥ 校验暂撤）；`docs/desktop/design/UI.md` §1 本批注项 1① 同拍。**零新语义 · 产品码零触**。明细 = 批档 §2.14。
- 2026-10-02（**设置面样式收正批 · 文档回填轮（实施后 · §4.1 ∥ §4.2 实读齐平 + settings.css 在册收记）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-layout.md` §2.14 预算观察 ∥ §5 ∥ §6.1 · 台账 #812）：**§4.1 四行实读齐平**（`thincoder-desktop/renderer/views/settings-sections.mjs` **164**（309 ⇒ 164）∥ `thincoder-desktop/renderer/views/settings-sections-providers.mjs` **已落 · 182**（「（拟新增）」转正）∥ `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` **185**（183 ⇒ 185）∥ `thincoder-desktop/renderer/settings.css` **304**（268 ⇒ 304——**在册越线不拆**（可读性优先）· 预案 = 控件族出档评估（拟新增 `renderer/settings-controls.css`）· 窗口 = 下次结构性触碰））+ **越层段收记**（`views/settings-sections.mjs` 拆档兑现 ⇒ 除名 ∥ `settings.css` 新入册——净十五）；**§4.2 本批块翻「现行 ⇒ 实读（实施落盘）」**（四产品行实读 + 批内件行转正——**已建成 · 219 行 · 五腿 · 9 用例**）；§6.1 机检面「（拟新增）」转正；`docs/desktop/design/UI.md` §1 本批注项 6 同拍。**零新语义**（读数 ∥ 在册 ∥ 转正）。明细 = 批档 §2.15。
- 2026-10-02（**菜单 ∥ 设置两批 · 批内件「（拟新增）」陈标末笔（父侧直接执行〔机械标面 · 可 revert〕）**）：六处——§6.1 菜单块机检面 ∥ §7 **T-DSK57** ∥ **T-DSK58** 两行与两批批注 ∥ §2 **KD-66 ⑦**——批内件两档已建成（**300 行 · 8/8 绿** ∥ **219 行 · 9 用例**）⇒ 标转「已建成」；渠道档转「D37 拆档产出 · 已落」；`docs/desktop/design/UI.md` 菜单本批注判据面同笔。**零新语义**（陈标 ∥ 状态形）。
- 2026-10-02（**跨批陈标族余量翻正（父侧直接执行〔机械值面 · 可 revert〕）**）：① `context-menu.mjs` 三处（§2 **KD-43** ④ ∥ §4.1 行 ∥ §4.2 块行——「拟新增 ∥ ≈65 预估」⇒ **已落 · 60**（实读 2026-10-02））；② web 快筛工具族五处（§4.1 三行 + §4.2 两行——「拟新增 ∥ 预估」⇒ **已落 · 144 ∥ 42 ∥ 191**（目录合计 377）∥ 批内件 **已建成 · 137 行**）；`docs/desktop/design/WEB-QUICKCHECK.md` 四行同笔。**零新语义**（陈标 ∥ 读数）。
- 2026-10-02（**跨批批内件陈标族余量翻正（父侧直接执行〔机械值面 · 可 revert〕）**）：十五档批内件（digest-parity **306** ∥ session-title **284** ∥ subblock-follow **367** ∥ reopen **215** ∥ typography **278 + 389** ∥ reflow-anchor **647** ∥ pool-width **242** ∥ window-maximize **83** ∥ block-arrival **325** ∥ theme-switch **267** ∥ digest-row **664 + 107** ∥ slash **425** ∥ timer-wake **257**）——「（拟新增」⇒「已建成 ∕ 已落 · 实读 2026-10-02」；涉行 = §4.2 各批块 ∥ §7 各批注机检面 ∥ §7 **T-DSK53** ∥ **T-DSK54** ∥ §6.1 D26 行 ∥ KD-41 区；另两码件（`theme.mjs` **85** ∥ `slash-commands.mjs` **65**——§4.2 两批块行）同笔。**零新语义**（陈标 ∥ 读数）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2b · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**抽出两域档**——新建 `docs/desktop/design/SESSIONS.md`（会话域）∥ `docs/desktop/design/SETTINGS.md`（设置域）（本部分 **十二 ⇒ 十四档**；档头两行同拍 ∥ §1.1 计数随动）。**迁入（本档原址留指针）**：§2 十六行——**KD-5 ∥ KD-9 ∥ KD-15 ∥ KD-16 ∥ KD-28 ∥ KD-41 ∥ KD-56**（⇒ `docs/desktop/design/SESSIONS.md` §1）· **KD-10 ∥ KD-11 ∥ KD-12 ∥ KD-13 ∥ KD-44 ∥ KD-45 ∥ KD-46 ∥ KD-49 ∥ KD-66**（⇒ `docs/desktop/design/SETTINGS.md` §1）；§4.1 会话族**十行**（⇒ `docs/desktop/design/SESSIONS.md` §3——三枚指针行保位）。`docs/desktop/design/UI.md` 同拍（本域行/块**十五处**（行四 + 块十一）⇒ 指针；明细 = 其变更记录）。**零新语义**（拆分迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§4.2 余块 26 收尾**——**18 块迁出**（SHELL §5.2 **1** ∥ ACTIVITY §4.2 **11** ∥ RENDERER §5.2 **1** ∥ UI §4.2 **4** ∥ WEB-QUICKCHECK §9.2 **1**——原址各留一行指针）＋ **8 块跨域留原址**（对齐第二批 ∥ 对齐第三批 ∥ 残余族清账 ∥ 重建保真 ∥ carryover ∥ 口子清零二轮 ∥ 残债清付 ∥ 二择——判读在册：无单一主导域）；**§4.1 余 31 行迁出**（UI §4.1 **18** ∥ PACKAGING §3.1 **3** ∥ E2E-TESTING §9.1 **3** ∥ WEB-QUICKCHECK §9.1 **3** ∥ RENDERER §5.1 **2** ∥ CHAT §3.1 **1** ∥ ACTIVITY §4.1 **1**——原址全改一行指针）。**零新语义**（迁移 ∥ 指针 ∥ 判域在册）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 2c（降格收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §1 ∥ §2 · 台账 #813）：**本档降格 = 索引 ∥ 跨域段 ∥ 历史段**——档头板块句收正；三分区标题落（`## 一、索引`（§1 ∥ §2 ∥ §3 ∥ §5 ∥ §8 ∥ §9 ∥ §11——四节自原位上移至 §3 后）∥ `## 二、跨域段`（§4 ∥ §6 ∥ §7 ∥ §10）∥ `## 三、历史段`（变更记录——「迁移前（≤ 2026-10-02）」标记落））；**§2.2 剪枝补落**（整块 ⇒ 一行指针——单源 = `docs/desktop/design/ACTIVITY.md` §3；三处自引同笔直指化）。**零新语义**（重排 ∥ 定界 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**设置菜单升级批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-settings-menu-upgrade.md` §1 ∥ §2 · 台账 #817 · 需求 D38 ∥ D39）：§2 增登记行二（**KD-67** ⇒ `docs/desktop/design/MENU.md` §1 ∥ **KD-68** ⇒ `docs/desktop/design/SETTINGS.md` §1）；§6.1 表头 **D1–D37 ⇒ D1–D39** + 本批批块指针行；§7 增 **T-DSK59** 指针行；§8 增本批边界行；§10 增 **DI** 指针行；`docs/desktop/design/{MENU,SETTINGS,IPC}.md` 三档同拍（KD-67 ∥ KD-68 ∥ `ev:menu` 五 ⇒ 六）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**桌面 UX 收尾批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §2 · 台账 #801 ∥ #702 ∥ #697）：§2 登记行二（**KD-69**——P1 读数端面消费（桌面 ∥ VSC 双面；桌面侧详文入档待 `SETTINGS.md` 解冻回填）∥ **KD-70**——桌面 MCP 警告消费 = 装配后入 `_pendingReminders`（三径裁 = 补消费））；`docs/core/design/MCP.md` §6.4 消费面句同拍（CLI ∥ 桌面）；`docs/vsc/design/SETTINGS.md` §2.5 同拍（P1 读数扩面）；`docs/desktop/design/ACTIVITY.md` §2 同拍（#801 右栏可滚动——复现判据 + 候选映射）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-02（**桌面 UX 收尾批 · 收口补充轮（#31）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-ux-closeout.md` §1 · 台账 #697）：§4.1 越层段三档读数随正（`thincoder-desktop/renderer/i18n.mjs` **404 ⇒ 408**——键数链注续链（同笔按语义边界折行——消超宽）∥ `thincoder-desktop/renderer/i18n-views.mjs` **362 ⇒ 374**（P1 两键两语 + 组注 ∕ 键面注）∥ `thincoder-desktop/src/main/settings.mjs` **320 ⇒ 325**（`indexStatus()` 回执 +2 键透传）——各携前读链）。**零新语义**（读数随正）。明细 = 批档 §2。
- 2026-10-02（**文档清账轮 · 执行轮 5（桌面重段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 25 处处置（R1 改指 13 处——承接全路径：`thincoder-desktop/` ×11 ∥ `thincoder-render-core/` ×1 ∥ `thincoder-cli/src/tui/` ×1；R3 裸名化 12 处——`chat-digest.mjs` ×9 ∥ `chat-digest-seat.mjs` ×2 ∥ `mount-head.mjs` ×1，已删 ∕ 改名档去目录段）；宽面销项 17 行 + 1 行改指越线同轮折（182 ∥ 370 ∥ 372 ∥ 390 ∥ 396 ∥ 397 ∥ 443 ∥ 446 ∥ 449 ∥ 450 ∥ 453 ∥ 930 ∥ 1043 ∥ 1046 ∥ 1047 ∥ 1048 ∥ 1067 ∥ 445——语义零改）。**零新语义**。
- 2026-10-02（**桌面发布·阶段二批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §1 · 台账 #810 ∥ #826）：§2 KD 索引增两行（**KD-71** ∥ **KD-72** ⇒ `docs/desktop/design/PACKAGING.md` §1）；§5 指针收正（发行业两面补列——自动更新 §2.8 ∥ 官网桌面面 §2.9 ∥ 承接 §2.10）；§8 边界三处翻正（本轮排除列表 ∥ 两批行「检查更新 ∥ 自动更新」——桌面发布·阶段二批落标）+ 本批边界行新立；§7 增 **T-DSK60** 指针行；§10 增 **DK** 指针行。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-03（**桌面发布·阶段二批 · 修复轮（评审轮 1 · 发现 1 ∥ 3 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §3 轮次 1 · 台账 #810 ∥ #826）：§6.1 表头 **D1–D39 ⇒ D1–D41** + 本批批块指针行（→ `docs/desktop/design/PACKAGING.md` §4.3）；§4.1 越层段新立本批行（`thincoder-desktop/src/main/window.mjs` **288 ⇒ ≈305**——新越层档 ⇒ 预案 = 冒烟读数族出档评估（拟新增 `thincoder-desktop/src/main/smoke.mjs`）· 消解窗口 = 下次结构性触碰的批）。**零新语义**（收正 ∥ 登记）。明细 = 批档 §2 修复轮块。
- 2026-10-03（**桌面发布·阶段二批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §2 ∥ §5 · 台账 #810）：§4.1 越层段本批行册值收正（`thincoder-desktop/src/main/window.mjs` **288 ⇒ ≈305** ⇒ **288 ⇒ 336**——实施落盘实读 2026-10-03；逐档「现行 ⇒ 实读」= `docs/desktop/design/PACKAGING.md` §3.3 行 7 ∥ `docs/desktop/design/MENU.md` §3.5 行 3）。**零新语义**（回填）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮（越层段四档续期 + 贴层段入册）· eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：§4.1 越层段四档读数随正（`composer-sync.mjs` **322** ∥ `store.mjs` **341** ∥ `settings.mjs` **331** ∥ `providers.mjs` **339**——各携前读链；均非结构性触碰 ⇒ **续期**）∥ 贴层段新入册一档（`renderer/mount-composer.mjs` **299**——+1 行即越线）。**零新语义**（读数 ∥ 登记）。明细 = 批档 §2 回填轮块。
- 2026-10-03（**首跑渠道提示修复批 · 实施后文档面回填轮（值列齐平 + 越层段入册 ∥ 随正 + §4.2 块 + IPC 坐标重锚）· eng-designer**——承批档 `docs/batches/2026-10-03-desktop-firstrun-provider-notice.md` §2 ∥ §5 · 台账 #840）：**§4.1 越层段**新入册一档（`thincoder-desktop/src/main/agent-host.mjs` **306**——十五 ⇒ 十六）+ 四档读数随正（`providers.mjs` **335** ∥ `composer-sync.mjs` **306** ∥ `i18n-views.mjs` **380** ∥ `i18n.mjs` **412**——各携前读链）；**§4.2 增本批「现行 ⇒ 实读（实施落盘）」块**（十产品行 + 测试面（批内件 **433 行** ∥ 两旧批件改钉转正）+ 设计档）；`docs/desktop/design/{UI,SHELL,SETTINGS,COMPOSER,IPC}.md` 值行走读齐平 + 变更记录同笔；**`IPC.md` 设置族注 8 坐标重锚 8 枚**（明细 = 其变更行）。**零新语义**（读数 ∥ 登记 ∥ 坐标）。明细 = 批档 §5。
- 2026-10-03（**轻通道轮八 · 收口链评审判定处置轮（评审轮 1 · 发现 1–4 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-03-light-round-8.md` §3 轮次 1 ∥ §2 上抛 U-2 处置 · 台账 #879）：§4.1 越层段三档读数续读——`thincoder-desktop/renderer/i18n.mjs` **415** ∥ `thincoder-desktop/renderer/i18n-views.mjs` **386** ∥ `thincoder-desktop/renderer/composer-sync.mjs` **324**（各携前读链；非结构性触碰 ⇒ 续期）；越层段名册头行括注同笔续记（「轻通道轮八三档读数随正」）。**零新语义**（读数 ∥ 登记）。明细 = 批档 §2 上抛处置块。
- 2026-10-04（**渠道档位退役批（desktop-channel-tier-retire）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 · 台账 #902）：KD-18 设置面半全消（主条 = `docs/desktop/design/COMPOSER.md` §1——会话级半保留）+ §4.2 增本批「现行 ⇒ 预期」块（产品码九行 + 测试面（批内件拟新增）+ 设计档行）+ §7 T-DSK31 行删（行内注记随正；机检豁免——用例退场登记）+ §9 批 B 落形句收正 + 变更记录（本行）；`docs/desktop/design/COMPOSER.md` ∥ `docs/desktop/design/IPC.md` ∥ `docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/UI.md` 四档同拍（明细另见各档变更行）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**渠道档位退役批 · 实施后回填轮 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §5 · 台账 #902）：§4.2 本批块翻「实读」（产品码九行实值：**300 ∥ 317 ∥ 106 ∥ 93 ∥ 398 ∥ 254 ∥ 204（±0）∥ 150（键 59）∥ 413（链尾 309）**）+ 测试面行转正（**已落 · ~189 行**——六腿先红 2/6 ⇒ 后绿 8/8）；§4.1 越层段 `settings.mjs` 回线除名（300 ≤300——十五 ⇒ 十四）；`thincoder-desktop/src/main/providers.mjs` 读数随正（339 ⇒ 317——仍越续期）；`thincoder-desktop/renderer/views/settings.mjs` 读数随正（399 ⇒ 398）。**零新语义**（读数）。
- 2026-10-04（**消化行回填落位批 · 设计修正轮随动 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-digest-reentry-order.md` §2 修正块 十·③④）：§4.1 越层段 `app.mjs` 册值随正（**321 ⇒ 328**——子代理面板批未回填项，同 `docs/desktop/design/RENDERER.md:321` 修正轮笔）+ 贴层段同值随正。**零新语义**（读数）。
- 2026-10-04（**流尾台账行组退役批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-stream-ledger-lines-retire.md` §2 · 台账 #913）：§2 **KD-38 收正**（台账读数出站两拍——行面去）∥ §6.1 **D10 行**去「对齐第三批」退役从句 ∥ §7 **T-DSK11** 期望改指段 11 常驻标记（原流内台账行腿随退役）∥ §7 机检面注「台账行与相位两向」⇒「台账读数与相位两向」。**零新语义**。明细 = 批档 §2。
- 2026-10-04（**模型切换解锁批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` §2 · 台账 #918）：§7 **T-DSK43 ③** 句收正（「两钮 `disabled`」⇒ **可点**——落盘保护 ∥ 回写门 = 解锁批批内件）。**零新语义**。明细 = 批档 §2。
- 2026-10-04（**模型切换解锁批 · 修正轮（评审 #53 · 发现 1 ∥ 6 ∥ 7 逐号 · 父侧裁 = 全采纳）· eng-designer**——承批档 `docs/batches/2026-10-04-desktop-model-switch-unlock.md` §3 轮次 1 · 台账 #918）：§7 **T-DSK43 ③** 判据行去沿革从句（新态直陈——沿革载本档变更记录）+ 输入列面名收正（忙态写门 ⇒ 忙态两钮可点）∥ 对齐第三批小修族注（「离线不可产面」串）同笔 ∥ **批 B 注**（T-DSK28 机检面）「在飞拒 `busy` 零写」⇒「在飞受理（写盘 + 回执携 `meta`）」∥ §4.1 越层段 `agent-host.mjs` 册值按盘收正（**306 ⇒ 327**）。**零新语义**。明细 = 批档 §2 修正块。
- 2026-10-04（**模型切换解锁批 · 实施后实读回填（父侧直接执行〔机械值面〕 · 可 revert）**——承批档 §5 A3：§4.1 `agent-host.mjs` 册值按盘收正（327 ⇒ **333**）。**零新语义**（读数）。
- 2026-10-04（**行痕族消失时机批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-row-traces-clear-at-turn.md` §1 ∥ §2 · 台账 #919）：§2 KD 索引**补 KD-73 行**（PACKAGING 批未随索引——一致性面同笔）+ 增 **KD-74** 指针行（⇒ `RENDERER.md` §1.6——行痕族清点两门）；机制面同拍 = `RENDERER.md` ∥ `CHAT.md` ∥ `ACTIVITY.md` ∥ `COMPOSER.md` 四档。**产品码零触（设计轮）**。明细 = 批档 §2。
