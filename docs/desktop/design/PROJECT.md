# 桌面端（DESKTOP）· 设计

> 板块 = **桌面端设计总览档**——模块目标与总体形态 · 关键决策 · 受影响文件 · 三平台发行 · 验收回指 · 用例 · 边界 · 上抛；分档详情见 §3 / §9 / §11 的指针。
> 本部分 = **六档**：本档 · `docs/desktop/design/SHELL.md`（宿主适配层——进程与目录形态 · 宿主面职责 · 与核的接口面 · 壳装配第三份）· `docs/desktop/design/IPC.md`（主 ↔ 渲染通道契约）。
> 另三档 = `docs/desktop/design/UI.md`（界面形态与交互 · 活动池与状态位）· `docs/desktop/design/RENDERER.md`（渲染面实现工艺——有界渲染窗口 / 回填与跟滚）· `docs/desktop/design/E2E-TESTING.md`（端到端测试基建——真 Electron 驱动 · 家目录隔离 · 固定落点截图；并入单入口）。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D24 · §7 验收 A1–A4 · §8 依赖面 P1–P4）；产品族三端关系与跨产品共享契约 = `docs/core/requirements/PROJECT.md` §3。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 文档体系落点（第四部分）判别与命名 = `docs/core/design/DOC-SYSTEM.md`；全仓模块地图与硬约束 = `docs/core/design/ARCHITECTURE.md`。
> 建档：2026-09-25（桌面端设计批 1）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。
> 本批 = **只设计**：无产品代码、无打包动作——`thincoder-desktop/` 实体目录与产物留实施批。

## 1. 方案与理由

### 1.1 模块目标

给不想 / 不能用 VS Code 的人一个**独立桌面入口**：同一个 agent、同一份配置与会话、比终端更宽的会话与活动视图。本设计（本部分六档）回答三件事：

- **怎么接核**（接口面）= `docs/desktop/design/SHELL.md` §3 · `docs/desktop/design/IPC.md`；
- **怎么长**（前端与壳装配形态）= `docs/desktop/design/SHELL.md` §1 / §4 · `docs/desktop/design/UI.md` · `docs/desktop/design/RENDERER.md`；
- **怎么发**（三平台发行链）= 本档 §5。

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
| KD-5 | 会话端标识 = 本端**声明端名**（`END = "desktop"` + 一次 `setSessionEnd(END)` + 转口八项：端参绑定 6〔marker 三项 + `resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`〕· 纯 re-export 1〔`renameSlot`〕） | 核 marker 家族已**端参数化**（实读 `thincoder-core/session-slots.mjs:99` `END` 初值 · `:107` `setSessionEnd` · `:109` `sessionEnd`；marker 三式与写 marker 入口逐函数缺省取**进程端名**——SLOT-END-PARAM 批落地）⇒ 端侧零算法副本（先例 = 扩展端端壳 `thincoder-vscode/src/extension/session-slots.mjs:46` / `:51` / `:63` / `:68` / `:72` / `:76`） | **自持端侧算法副本**（第二份实现 = 漂移面；扩展端副本已注销归核）· **不声明端名直消费核**（缺省 = `"cli"` ⇒ 以 CLI 身份写 marker = 跨端互写） |
| KD-6 | 打包工具 = **`electron-builder`**（**构建期 devDep**，非运行期依赖） | 三目标（win / mac / linux）一套声明 + 产物类型齐全（NSIS / dmg / AppImage / deb）；校验与分发脚本可挂——照扩展端 `package` → `postpackage` → `publish:all` 三段先例（`thincoder-vscode/package.json:124-134`） | **`@electron/packager` + 手写安装器**（安装器自研 = 三平台各自踩坑）· **`electron-forge`**（插件面与模板产物更宽，配置面大于需要）· **仅 zip 免安装**（需求 D12 要求「可安装可启动」） |
| KD-7 | 宿主下限 = **Electron ≥ 44.x**，且以**启动自检**为准 | 核依赖 `node:sqlite`（免 flag 需 Node ≥ 22.13）⇒ 宿主须带够版本的内置 Node（Electron 44 内置 Node **24.21.0**；本端下限取 **Node 24 主版本底线**——需求面 = 需求档 §8 P1）。设计**不把下限压在外部档上**：启动时断言 `process.versions.node` 与 `node:sqlite` 可加载，不满足 ⇒ 显式报错退出（自检本身 = 判据） | **运行期降级路径（无 sqlite 的记忆实现）**——拒：两套记忆逻辑再现（`docs/core/requirements/MEMORY.md` §2.1 的 A12/A13 已归一，不留降级）· **保留 Electron 37 面**（内置 Node 22 · 已 EOL） |
| KD-8 | 审批面 = **流内卡片 + 本会话活动池计数 + 标签位**三处呈现，语义单一（同一待决项的三种视图） | 需求档 §3.2 时序裁定；核侧审批通道本就分两条（`onBatchPermissionRequest` 批审批门 ∥ `onPermissionRequest` 逐项门，实读 `thincoder-core/agent/dispatch.mjs:281-303`）⇒ 本端**两条都接**，批审批映射为「全部允许 / 全部拒绝 / 逐项」三按钮 | **只接逐项通道**（批审批退回逐项 = 与另两端行为分叉）· **只接批通道**（单工具待决无出口） |

| KD-9 | **最近项目目录零新存储**：读面 = 核会话槽面回读（族分组 + 组最新 mtime 序）；当前项目 = 主进程**内存态**（不落盘） | 守需求档 §2「不得另立存储格式」与 A2（不增跨端共享可变字段）；判据单源 = 核 `thincoder-core/session-stale.mjs:46` · `:56`（纯函数导出可复核）；机制细节 = `docs/desktop/design/IPC.md` §2 项目面注 | **端自建列表文件**（第二份存储）· **端 marker 面**（本端记录 = 各端「最后认领的槽」〔`thincoder-core/session-slots.mjs:114`〕，非项目）· **共享 config 新字段**（跨端共享可变字段——违 A2 / 核 NF1） |

| KD-10 | 设置面写路径 = **核唯一执行体**（`writeConfigAtomic`——`stat → read → mutate → 原子写`四步住核）；端侧零自写盘、零 provider 形状构造 | 原子性 / mtime 冲突 / `.bak` 留现场与 CLI 同源一处；值面（preset 展开 · key 落位 · 激活渠道保护）全在核变更子，端侧只给 `mutate` | **端侧自写盘**（read-modify-write 第二份实现 = 漂移 + 竞态）· **端侧 provider 形状表**（第二份协议形 = 双源）· **`saveConfig`**（核无此导出——全仓 grep 零命中） |
| KD-11 | **探活口径有意分歧**：`provider:verify` 探不通**仍可保存**（只出读数，`reason` 闭集 `timeout` / `malformed` / `unavailable`）∥ `mcp:save` 探活失败 ⇒ **零写盘** | 渠道 key 的可用性不只在探测当下（离线 / 代理不得阻断首启）；MCP 服务器配错必连不上（先例 = `thincoder-cli/src/tui/cmd-mcp.mjs`）——卡面须明示「未校验通过」 | **统一为「探不通零保存」**（渠道面会阻断离线首启）· **统一为「只出读数」**（会把连不上的服务器写进配置） |
| KD-12 | 首启向导：闸 = **配置档存在性**（读数 = `config:read` 回执 `configured`——`thincoder-core/config-io.mjs:39`；口径差有意：CLI `isConfigured` = key 可解析、更严，**勿统一**）；三步 = 选 preset → 填 key（`provider:verify` 真调一次）→ 选目录（`project:open`）；表单出口**复用设置面导出面**（单一 owner）；配置坏 ⇒ 不静默重置（设置面可进 + 明示不可读） | 需求 §3.3 逐字（已配 ⇒ 跳过）；零副本 ⇒ 向导与设置面同源同形（沿批 7 操作区描述符先例） | **自拟判据「有渠道 + key 才算已配」**（与需求字面冲突）· **向导自带第二份渠道表单**（双源）· **坏配置静默重置**（抹用户数据） （机检豁免——端侧语汇） |
| KD-13 | `locale` = **端无关偏好键**（任一端写、他端读；非属主型状态）⇒ 本端 `config:write` 为**首写者**；切换即时生效（`config:write` 成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷词表——**免二跳重调**，**零新事件通道**） | 核无 locale 持久化写点（实读 `thincoder-core/i18n.mjs` 全档）；§6.2 A2「不增跨端共享可变字段」针对属主型状态——本键无写竞争 | **按属主字段禁写**（语言偏好本就跨端共享）· **新增 `ev:settings` 推送**（无首个必需消费面） |
| KD-14 | `question` 工具 = **同回合内真作答**（新通道 `question:respond`〔出站 + 回执 · 白名单末位〕+ 桥面 `onQuestion` 改**异步返 Promise** + **核外待决表**〔沿审批门挂起表先例 · `promptId` 同源同值〕+ 流内问题卡） | 需求 §3.5 验收句逐字「跑完一个**带提问的任务**」要求工具**真可用**（批档 §1.6 裁定 (a)）；卡退场判据 = **回执 `ok` 真**（零乐观写——失败 ⇒ 卡留在场可重试） | **可视化路**（只显示问题、工具不可真用 = 需求形状缩水）· **保持同步返信号串**（工具仍不可真用——`thincoder-desktop/src/main/agent-bridge.mjs:72-75` 现形）· **改核侧 `question` 工具为真异步**（改核机制——越本端边界） |
| KD-15 | 标签条非活动项收 Tab 序的手段 = **两控件各 `tabindex="-1"`**，**不用 `inert`**；确认态（`data-confirm="1"`）**免** `-1` | 原落形（`inert`）**同行自相抵**：`inert` 使子树对**全部**用户输入失效（含指针）⇒ 杀死同行「标签点击激活」（批档 §1.7 / §1.8 走查定位）；真意图 = **键盘 Tab 序排除**（T-DSK20 判据**保留**）⇒ 换只收键盘序的原生属性 | **保留 `inert`**（点击激活不可达 = 需求「点按切换」失守）· **不收 Tab 序**（T-DSK20 判据不许）· **`inert` + `pointer-events` 叠加**（两机制互抵仍并存 = 无谓面） |
| KD-16 | 关标签 ⇒ **页随动**：关闭尾落**接线面** `thincoder-desktop/renderer/mount-sessions.mjs`（`closeTail(before)`——关活动 ⇒ `void activateSession(邻位键)`〔与激活**同一尾**〕· 关唯一 ⇒ `store.set(openSession(现态, null))` 关页 · 关非活动 / 拒收 / 待确认 ⇒ **零动作**），**不进 store** | 实据：`thincoder-desktop/renderer/store.mjs:113-119` `closeTab` 只改 `tabs` / `activeTab`（**不触页**）· `thincoder-desktop/renderer/mount-sessions.mjs:121-126` `closeTail`（三调用点 `:133` / `:140` / `:192`——三出口只 `store.set(纯动作)`） · `activeSession` **唯一写者** = `thincoder-desktop/renderer/events.mjs:274-281` `openSession`（调用面 = `thincoder-desktop/renderer/mount-sessions.mjs:64` / `:124`）· `thincoder-desktop/renderer/app.mjs:9` 帧出口重挂键 = `activeSession` / `locale` ⇒ 改页键即重挂页；`thincoder-desktop/renderer/store.mjs` **零 import**（`openSession` 不住 store ⇒ 尾写 store 即引 import 且与 `events.mjs` 成环） | **尾内联进 `closeTab`**（store 成 `activeSession` 第二写者 + 成环）· **`paintChat` 从状态派生页键**（帧出口成第二判据源）· **关闭路径显式发 `session:switch` 空键**（关唯一时无邻位可切 · 白增一次主进程往返） |

| KD-17 | **`effort` 的会话级载体 = 槽数据文件顶层字段**（`null` = 未设 ⇒ 回落渠道默认）；`provider` / `model` 两键入参**不新增字段**——映射既有 `activeProvider` / `activeModel`；`newSlotData` 产 `effort: null`；`saveSession` 字段表**须携 `effort`**（缺之 ⇒ 下一次回合保存把槽写面结果整对象抹除——实读 `thincoder-core/session.mjs:120-138` 现表无该键）；老槽无键 ⇒ 按 `null` 容忍（**禁回填**——沿 `createdBy` 先例） | 需求档 §3.1:47（会话头三值 = **会话级**状态 · D6）——须随槽持久化、且与 CLI / 扩展端**同一份**槽；核现无该键的槽写出口（既有四钥 = `autoApprove` / `planMode` / `engineering` / `advisor.guard`）⇒ 端侧只剩两条错路：落 config（全局态——切一处波及全部会话）∥ 自建副本（跨端互写失守）；判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 1 / 5 | 落 config 全局态（需求明写「会话级」）· 端自建槽副本（第二份存储）· 老槽回填（违批 A 已裁的禁回填先例） |
| KD-18 | **档位枚举化 = 双面**：设置面 = 全局默认（`模型与档位`段 `select`，写 `settings:agent`）∥ 会话头 = 会话级（写槽）；枚举**单源** = 核 `specForModel(model).reasoningEffortEnum`（**逐模型取**——不落全局一份表）；端侧候选面 = `model:list` 回执**逐模型元素投影 `{ id, effortEnum, thinkOff }`** + `provider:list`（`thinkOff` = off 可达判据——单源 = 核 `thinkOffPath`）；表外档位字面串 ⇒ **归一 `null`**（未设——写面不预校验）；`null` 仅允许 `effort` 一键；`provider` 变更须**同送 `model`**（槽双字段恒非空）；**⑥ 设置面半（批 B 设计修订轮）**：写面 = `settings:agent` **意图级载荷** `{ tier: { provider, model, level } }`（**非键级 `patch`**——表不了删键 + 渲染面零键名）；键协议 = 统一式（先清不相容记号〔`thinking` 值 deep-equal `thinkOffShape(spec)` 时删〕再按档落形——判据单源 = 核 `thinkOffShape` / `thinkOffPath`）；`"none"` 不作独立档（由 `off` 承载）；现值 = `provider:list` 行投影 `effort`（离线 · 零探针）；**表外现值 ⇒ 自成一选项**（不吞）；`defaultModel` 缺 / 模型段空 ⇒ 控件零节点；拒绝面两码 `bad-level` / `unknown-provider`（零写）——**单源 = `docs/desktop/design/IPC.md` §2「档位控件注」** | 需求档 §3.5 项 6 逐字「自由文本 ⇒ 枚举选项」；枚举值域逐模型不同 ⇒ 端侧自持一份表必错（第二值域 = 漂移面）；候选面须离线可用（先例 = `thincoder-vscode/src/extension/settings.mjs:207-213`）；**缺口闭合** = 端 `model:list` 现仅回 `{ ok, models }`（实读 `thincoder-desktop/src/main/settings.mjs:118-129`）⇒ 补逐模型 `effortEnum` / `thinkOff` 投影（主进程引核函数 = 零副本，沿 `listModels` 转口先例）；⑥ = 设置面档位属**渠道条目级默认**（逐模型精确控制 = 会话级档位）；写后投影恒等为编辑器面硬要求（deep-equal 清记号判据之由——与 CLI 的差有意：CLI 只清 `null` 字面，范围由其评审 #1 圈定） | 端侧自持族别表（第二份值域）· 自由文本保留（需求明写收枚举）· 渲染面直引核（渲染面零 Node ⇒ 守卫 T-DSK16 红）· 全档共用一份 effort 表（逐模型值域不同）· 不补 `model:list` 投影 · 候选面恒含 off（不可达模型写后归一 `null`——两族在候选面不可区分）· tier 载荷走键级 `patch`（删键不可表达 · 渲染面须知键机制）· `"none"` 列独立候选（与 `off` 同义重复——`off` 族判据正看它）· 表外现值归一 `Auto`（吞值 · 写面回读不恒等）· 现值另开探针读（离线面可破——行投影即可） |
| KD-19 | **施加径 = 写盘 → 重施**（`loadAgentSlot`）单点；**在飞**（`flights.has(key)`）⇒ 拒 `busy`、**零写** | 施加面唯一 = 核 `applySession`（判据单源 = `docs/core/design/SESSION.md` §6.21 判据句 4——三端共用）；端侧内存态不手改（第二施加面 = 漂移）；回合在飞时改 provider / 模型 ⇒ 同会话前后分属两模型（回合一致性失守）；写盘后不重施 ⇒ 活动会话读数与内存态分叉 | 端侧直改内存态（第二施加面）· 在飞静默接受（回合内混模型）· 写盘后不重施 |
| KD-20 | **状态栏占用读数 = 回合尾事件推**（`ev:usage` 载荷 `{ key, percent }`）；**未至 / 非正数 ⇒ 零节点**（禁假造）；归约面按会话 `key` 写切片（**唯一写者**），切标签取活动键值随动 | 需求档 §3.1:52「活动会话的上下文占用（实时读数）」+ §3.2 项 4「回合收尾：状态栏上下文占用更新」——两处皆指回合尾为更新时点；渲染面不复算（第二判据源 = 与真实用量分叉）；载荷与显示门判据单源 = `docs/desktop/design/IPC.md` §1 `ev:usage` 行 | 渲染面按历史长度自算（与真实用量分叉）· 占位读数（`0%` / `—`——禁假造，沿池面两读数先例）· 轮询通道（无消费面） |
| KD-21 | **附件 = 渲染面零 fs**：`paste` 取剪贴板图像 → `FileReader` 转 `dataURL` ⇒ 随 `msg:send` 载荷 `images`（逐项 `{ name, mime, dataURL }`）→ 主进程落盘 + 核 `appendImagePointer` 深 import（**核零改**）；**非视觉模型前置门**（核 spec `multimodal` 判据）⇒ 回执携 `degraded`；单图上限 **15MB** | 沙箱渲染面零 Node ⇒ 无 fs（KD-3）；落盘与指针段住核（先例 = CLI / VSC 同径）⇒ 端侧零第二份实现；上限与弃项判据单源 = `docs/desktop/design/IPC.md` §2「附件注」（本档不重述） | 渲染面直写文件（越 KD-3）· 端侧自建落盘 + 指针格式（第二份实现 / 跨端不可读）· 静默丢图（须出 `degraded` 提示行） |
| KD-22 | **复制 = 块级 + 末条（长文本出口）**：每块尾控件取**块文本逐字**（`data-block-id`）+ 输入区尾末条控件；出口 = `navigator.clipboard.writeText`；块文本空 ⇒ **零控件**；成败**零布局变化**（失败 ⇒ `console.error`——零静默） | D13「代码块 / 末条消息复制」的忠实实现面（裁定 = 批次档 §1.2 B：「本批复制面 = 块级 + 末条」）；`app://` 注册为 secure ⇒ 安全上下文成立（KD-2）；**块级取文不经渲染面解析**（码块取文面另立控件——KD-RC-4 / 核档 §4 行 11） | 引剪贴板库（违仓级零第三方约）· 加提示条机制（成败零布局变化）· 真代码块面用块级控件顶替（两控并存——KD-RC-4） |
| KD-23 | **用户块出泡时刻 = `msg:send` 回执 `ok` 真（受理即出）**（#458）：块文本 = 提交文本逐字；块形 = 回放同形 `{ kind: "user", text }`；写者 = 发送面两径同源（直发 / flush）；键门 = 回执键 = 现刻 `activeSession`；入队径 = **入队即出泡 + 待发送标记**（2026-09-28「对齐第二批」项 2 收正——核 `queued-mark` 接入 + 队列按会话分键两前置已落；直达径「受理即出」不变） | 受理判据 = `msg:send` 回执（`bad-key` / `provider-invalid` ⇒ 回合未启 ⇒ 会话里没有该条——实读 `thincoder-desktop/src/main/agent-host.mjs:186-205`）⇒「活流块 ⟺ 该条已受理」使活流与 `history:page` 回放同源（#458 缺陷类 = 两面不一致）；有序性 = 回执先于该回合首个带块事件（`run(...)` 非 await 起跑后立即 `return { ok: true }`——同档 `:212-228`；带块事件必晚于一次 provider 往返）；**既有判据零缩水**：失败径仍「稿逐字留 + 零块」（T-DSK32 ⑩⑪ **原形不动**——无乐观态 ⇒ 无回滚语义）。**边界**：非视觉降级径 ⇒ 入会话文本 = 提交文本 + 说明行（主进程 `appendLine`）——活流显示键入串（三端同义：VSC `addUser(ctx, text)` = 键入串），回放含该行；消解路 = 回执携入会话文本（须动 IPC 回执形——另裁，登记 §10 AB） | **提交即出（VSC 形）——2026-09-28 改采（入队径）**：原否两条理由（无尽标记机制 / 队列未分键）已随「对齐第二批」项 2 消解；**被否：提交即出 + 回执假回滚**——回滚 = 新「撤回」语义 + 块面双写路径，且「活流块 ⟺ 已受理」收口面不成立；**被否：提交即出 + 失败留块**——违 T-DSK32 ⑪ 且造活流 / 回放不一致（本批正是修这一类） |
| KD-24 | **流式游标清点 = 两族**（#459）：① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② 段界（`ev:tool-call` 入场）；清点落点 = 归约面块面（须产生块面引用变更 ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚） | 游标语义 = **末块追加态**（`thincoder-desktop/renderer/chat.css:33-37` 自注）；只清回合尾会留下「工具运行期游标常驻于已收束文本段」同族缺陷；清点走块面引用 = 唯一既有刷新径（旁路态不触发帧 ⇒ DOM 锚无刷新路径——缺陷成因面） | **被否：只清回合尾**（半量——段界窗口期同病）· **被否：帧尾扫描 DOM 摘锚**（DOM 面旁路 ⇒ 与「模型 → 树」单源相抵） |
| KD-25 | **状态行 = 对齐 CLI 口径**：段集逐项裁定（**2026-09-28 屏面为准重审后 = 承载 16 / 旁置 1 / 不适用 1 行**——重审定形 = KD-30；表住 `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1）；承载四项（耗时 / 令牌 / 计时 / 回合 N/M）**已落（R3a）**——读数槽四住 `thincoder-desktop/renderer/events.mjs`，载荷扩 = `ev:usage` 两键（单源 = `docs/desktop/design/IPC.md` §1） | 用户走查第 1 点 + D17（零静默省略）；键位组不适用 = 需求 §3.5 斜杠命令边界（2026-09-28 逐件重审坐实） | **照搬 CLI 键位组**（违 §3.5 斜杠边界）；**并 VSC 状态栏**（用户口径 = 对齐 CLI）；**只给占用 + 告警**（现状——D17 失守） |
| KD-26 | **右列 = 子 agent 面板**（D20）：块 = 子 agent 实例（五类射程）；**工具调用行摘除**（工具面 = 对话流工具卡）；块态机 = 出生 / 终态折叠 / **归档 = 入流**（终态即归档 · `settled` 驻留后归档 · 旧代接管即归档——「对齐第二批」项 5 收正）；**内容回显** = 核件同款（头行 + 状态词 + 内容 tail-3 + 展开——`renderSubBlock` / `refreshBlock` / `renderSubagentChunk` 直消费；「对齐第二批」项 3 收正） | 用户走查第 2 点逐字（「那里应该用于显示各类子agent，替代vsc端的live面板」）；D4「不回显内容」+ D20 块形（子 agent 实例——无工具位）；归档口径修既有池单调增长（§10 K） | **保留工具行 + 另加子块**（右列双职——用户明否）；**子块全量常驻**（单调增长）；**终态即摘（无归档面）**——旧否因（看不见刚结束）随归档入流消解：终态块**入流留场**（非消失）；**回显 tail-3**〔2026-09-28 改采——D4「不回显内容」句随「对齐」口径收正归需求档〕 |
| KD-27 | **会话流经共享渲染核**（D19）：文本面 = 核 Markdown（**「零 Markdown」改判**）；真代码块 / 复制 / 推理块 = 核件分件消费（渲染逻辑单源：`md` / `attachCopyButtons` / `renderReasoning`〔结构同形〕）；帧容器 / 工具卡族 / 卡族 = 桌面外壳留存（否「整件替换核 DOM」）；**文件链接不承载**（暂缓面）；核落点 / 加载形 = `docs/render-core/design/RENDER-CORE.md` | 用户走查第 3 点 + D19「经共享渲染核」；同核 ⇒ 「基本对齐」结构性成立 | **保留纯文本**（违走查原话）；**桌面自写渲染面**（第二实现——用户 20:48 改判之由）；**落文件链接无出口**（假控件——KD-RC-5） |
| KD-28 | **会话面板 = 对位 VSC 会话栏元数据族**（D18）：行元数据三值 = provider（端壳行投影补 `activeProvider`——`thincoder-desktop/src/main/sessions.mjs:14-16`）· N msgs · updated（两值已载） | 用户走查第 1 点「会话面板与 vsc 基本对齐」+ D18；VSC 对位 = `thincoder-vscode/webview/session-bar.js:40-41` | **改用 VSC 单栏下拉**（多标签结构不削——需求定）；**元数据逐字镜像**（本端行结构差异保留——基本对齐 = 元数据族 + 交互语义） |
| KD-29 | **内容面 / 会话面板视觉对齐 VSC（D21）**：值以 VSC webview 实值为源（三律 = 宿主主题色角色对位 · 语义常量值照搬 · 盒层单层律）；值表分处单源——内容面 **21 面** 住 `docs/render-core/design/RENDER-CORE.md` §5 · 会话面板面 **9 面** 住 `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2；**结构零动**（外壳 / 主题体系 / 左列 + 标签条结构 / 行族结构不动）；新增变量 **14**（内容面 12 + 会话面板面 2——单源 = 主题表 `thincoder-desktop/renderer/styles.css`）；端差 **3** 项在册（核档 §9） | 用户 2026-09-28 04:42 走查（① 会话流「样式与 VSC 区别很大」② 会话面板「与 vsc 端完全不同，我之前要求过对齐的」）+ 需求 §4 **D21**；核产出件两端同形优先（推理内代码块——核档 §9 端差②） | **保持现制**（用户明否）；**逐像素复刻 VSC**（宿主主题变量在桌面不存在——取值即自铸；且 VSC 侧作用域副产物不宜复刻）；**只改配色不改排版**（差异大头在字族 / 盒模型 / 高亮——浅改不解）；**另立第二张主题表**（值变量单源 = `styles.css`） |
| KD-30 | **状态栏对齐 = 「屏面为准」重审（2026-09-28）**：标尺 = 屏面可见行为——**banner 四态（PLAN / AUTO / ADVISOR / ENG）上状态行行首**（与 CLI 同段位 / 同语义；「PLAN / ADVISOR 本端无该两态」旧裁不实——两态随会话槽恢复可为真）+ **会话头回三值**（provider / 模型 / 档位——撤 `engineering` / `autoApprove` 两显示位；需求 §3.1:47 / :52 父侧同笔）+ 静息状态词（就绪——**入状态词闭枚举**（6 词 ⇒ 7 词）；词形来源 = CLI 静息值 `Ready`，`thincoder-cli/src/tui/tui-state.mjs:43` 实读，核 i18n 无同源词）与输入提示段（Enter: send）补落 + 键位尾四件逐件坐实；段集 12 ⇒ **16** | 用户 2026-09-28 05:34 / 05:38 走查裁定（「对齐」= 屏面为准；「旁置 / 不适用」等账面打折项逐项重审）；两态可为真实证 = `thincoder-core/session-lifecycle.mjs:111-134`（槽恢复）+ 桌面无该两态呈现面；「同一事实一处」在四态上状态行后落成（两态只住状态行一处——CLI 同理） | **四态全留会话头**（状态行与 CLI 不一致——D22 主句失守）；**四态双呈现**（会话头 + 状态行——违「同一事实一处」）；**维持旧账**（旁置 / 不适用不改——用户明否） |
| KD-31 | **排队可见面 = 流内待发送气泡 + 队列按会话分键**（2026-09-28「对齐第二批」项 2）：忙态提交 ⇒ **入队即出泡**（流尾 `[data-pending]` 非块节点组——节点换代交接给流内用户块）；队列 = `pending: { [会话键]: [{ text, ts }] }`（三纯动作带键 · 满队按键判）；**flush 目标 = 回合尾事件键**；右列「队列」族**零写者 · 席位保留** | 用户 06:52「queued跑到右边Activity区去了」+ 07:08「排队中的时候要先是在输入区的上面，不是在右边」；未受理气泡挂某会话流 ⇒ 队列须带键（兼修「切会话错发」缺陷面）；核 `queued-mark` 三导出直消费 = 标记形与标签两形态单源 | **队列保全局未分键**（切会话漂页 + flush 错发他键）；**待发送气泡作块入 `blocks`**（页读整置即漂——与 slice 双记账）；**右列队列族继续承载**（违 07:08 原话）；**右列队列族摘除**（父侧 §1.8「回归本义」口径 = 席位不撤——摘除候选被否） |
| KD-32 | **核件直消费 + `setStrings` 单点接线**（2026-09-28「对齐第二批」项 3 / 4）：右列子 agent 块 = 核 `renderSubBlock` / `refreshBlock` / `renderSubagentChunk` / `renderSubDesc` 直消费（**键控差分挂载**——同 key 跨帧同一元素）；说话人标签 = 核 `queued-mark` 原语落笔（用户块两形态）∥ 端侧同字面落形（助手标签——核无原语，登记 + 上抛 §10 **AY**）；渲染面 `initDict` 处 `setStrings(宿主表 ∪ 核投影)` | 「对齐」= 同一核件 + 值对齐（需求 §3.6 · 07:06）；核件内取词走核 i18n ⇒ 不接线即出键名（`sub.async` 一族） | **描述符复刻核构件**（头词 / tail-3 / 状态词 = 第二实现——违单源）；**整件替换核 DOM**（桌面外壳 / 三锚 / 窗限全失）；**核件取词改端注入**（核件签名无 `deps.t`——须改核件，越本批边界） |
| KD-33 | **终态 = 折叠 + 归档入流**（2026-09-28「对齐第二批」项 5）：归档 ⇒ 池内退场 ∧ 流内尾追块（新块型 `subagent`——壳 = 零边距透传容器 + 内嵌核件元素）；表项留存墓碑（`region: "flow"`——迟来事件按 `drop-frozen` 消化）；`atBoundary` **恒按尾追**（桌面无 digest 边界物）；核 effects 表**不逐条执行**（端面动作由模型态幂等派生） | 用户 07:01「刚才不是有个子agent在跑吗？…为啥没了？」+ VSC 同径（`archiveBlock` 入 `#messages`）；原「下回合起清出」（`archiveFrozen`）退场 | **保留「下回合清出」**（用户明否）；**归档块留池内**（右列单调增长——原清出之动因仍在）；**归档块入盘**（非落盘件——运行期面，页读整置即失登记 = §10 **BA**） |

### 2.1 实测读数（实施批回填）

- 宿主下限的**具体版本号**——**已实测**：Electron 内置 Node = `"24.21.0"`（Electron 44.4.5 面 · 父侧实测；读数落于本批档 §5）；阈值面 = `thincoder-desktop/src/main/host-floor.mjs:9`（`MIN_NODE = "24.0.0"`）⇒ KD-7 下限（Electron ≥ 44.x）成立。

## 3. 架构与接口契约（分档导航）

各面按板块分档落定（单一权威源——本节每面只留一行指针，不留正文副本）：

### 3.1 进程与目录形态

→ 见 `docs/desktop/design/SHELL.md` §1（三层进程 · 目录树 · 分层铁律）。

### 3.2 主 ↔ 渲染 IPC 契约（窄面）

→ 见 `docs/desktop/design/IPC.md` §1（主 → 渲染事件表）· §2（渲染 → 主请求表）。

### 3.3 与核的接口面逐项点名（七面）

→ 见 `docs/desktop/design/SHELL.md` §3（七面表 + 「不改核」行）。

### 3.4 壳装配第三份

→ 见 `docs/desktop/design/SHELL.md` §4（`agent-host.mjs` 五项职责 + 共享化议题行）。

### 3.5 活动池与状态位（需求档 §3.5 三项落定）

→ 见 `docs/desktop/design/UI.md` §2（三项处置表 + 旁证行）。

## 4. 受影响文件清单

### 4.1 本端文件清单与行数预算

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/package.json` | **20 ⇒ 21** | 包定性：`main` 入口 + script 三条（`test` / `package` / `postpackage`——**单源 = §5**）；devDeps = `electron` + `electron-builder`（构建期·非运行期）+ **`playwright-core`**（E2E 驱动·测试面——本批；`dependencies` 零第三方不变） |
| `thincoder-desktop/electron-builder.yml`（拟新增） | ~40 | 三平台目标与产物类型（§5） |
| `thincoder-desktop/.gitignore`（新增） | ~5 | 忽略 `thincoder-desktop/test/artifacts/`（运行期产物不进 git——KD 单源 = `docs/desktop/design/E2E-TESTING.md` KD-10） |
| `thincoder-desktop/src/main/main.mjs` | **93**（批 B 末实读） | 入口：单实例锁 · 协议注册 · 窗口 · 启动自检（KD-7）——ready 前初始化一律 await |
| `thincoder-desktop/src/main/host-floor.mjs` | 42 | `main.mjs` 同面拆分 · 零 `electron` 导入的叶子（宿主下限谓词 + `node:sqlite` 探针——实施批 1 已落） |
| `thincoder-desktop/src/main/window.mjs` | **136**（R1 末实读） | BrowserWindow · 菜单 · 系统主题 · 窗口态 |
| `thincoder-desktop/src/main/protocol.mjs` | **88**（R1 末实读） | `app://` 供给 + 路径逃逸防护（照官方示例判据） |
| `thincoder-desktop/src/main/ipc.mjs` | **221**（实读 2026-09-28——两座落：R3 末 214 ⇒ 状态栏 wiring 221） | 通道注册与分发（白名单 R3 后 **28 项**——批 B 增 `session:prefs` + 对齐重定位批增 `subagent:stop`；`docs/desktop/design/IPC.md` §2「白名单面」）；超 200 行按面拆分（批 9 贴层 ⇒ 在册预案）；**越 200 ⇒ 在册预案触发**（在册预案承前） |
| `thincoder-desktop/src/main/agent-host.mjs` | **254**（实读 2026-09-28——拆分已落：R3 末 300 ⇒ 装配面出档后 254） |
| `thincoder-desktop/src/main/agent-assemble.mjs`（状态栏对齐批新档） | **95**（实读 2026-09-28——≤300） | 装配面出档（自 `agent-host.mjs` 逐字搬运：`assembleFor` + `DEFAULT_DEPS` / `teamConfig` / `gitAuthor` / `validateProvider`；原路径同名 re-export 保名面——`docs/desktop/design/SHELL.md` §4） | 壳装配第三份 + 回合驱动（`docs/desktop/design/SHELL.md` §4）——**在册拆档落形**：回调桥 / 待决门 / 槽 I-O 三面已成出档（下三行）；**批 B 增**：会话级偏好施加径 `setPrefs`（写盘 → `loadAgentSlot` 重施单点 · 在飞 `flights.has(key)` ⇒ 拒 `busy` 零写——KD-19）；**本批增**：`flagsOf(key)` 活值投影四布尔 + `respond` 成功径回执叠加 `{ key, flags }`（桌内翻转即时刷新面） |
| `thincoder-desktop/src/main/agent-bridge.mjs` | **174**（实读 2026-09-28——R3a–R3c 三笔后；批 A 末实读 77） | 回调桥出档（自 `agent-host.mjs` 拆出——批 8 §1.14 ③）：活动名闭集八名 + 协议行解析（`⟦ev⟧`）+ 九回调 ⇒ `ev:*` 映射 + 工具参数摘要（与待决门共用口径）——注入 `post` / `askSingle` / `askBatch` / `askQuestion`（批 A 增第 4 键——自挂起门出 `ev:question`，桥零文案），零宿主依赖 ⇒ 平 node 直测（映射单源 = `docs/desktop/design/IPC.md` §1）；批 A 增量 = 第 4 键 + `ev:question` 映射（~6 行，结构不变） |
| `thincoder-desktop/src/main/suspensions.mjs` | **113**（批 A 末实读） | 待决门出档（自 `agent-host.mjs` 拆出——批 8 §1.14 ③）：两门 verdict 闭集（逐项 3 值 / 批门 3 值——核 `dispatch.mjs:281-289`）+ 待决表（挂起表 · **唯一持有点**：`promptId → { kind, shape?, key, resolve }`——`kind` = `approval` / `question` · `shape` = `single` / `batch`（verdict 闭集选择 discriminator；批 A 修正轮收正，码面随动 = `thincoder-desktop/src/main/suspensions.mjs:51` / `:60` / `:63` 由 `kind` 改 `shape`，零行增减）+ 五操作（`askSingle` / `askBatch` / `askQuestion` / `denyGates` / `respond`——批 A 增 `askQuestion`：登记后自 post `ev:question`）——表清两时点 = 出站 respond ∨ 门 resolve（`docs/desktop/design/SHELL.md` §4 项 5）；批 A 补：`kind` 两值（`approval` / `question`）+ 回执**四 reason** 不 resolve（`unknown-prompt` / `bad-kind` / `bad-verdict` / `bad-answer`——单源 = `thincoder-desktop/src/main/suspensions.mjs:85-87`；`docs/desktop/design/IPC.md` §2） |
| `thincoder-desktop/src/main/session-io.mjs` | **37** | 会话槽 I-O 出档（自 `agent-host.mjs` 拆出——批 8 §1.14 ①②）：装载 `loadAgentSlot`（槽缺 ⇒ false；命中 ⇒ 应用槽值 + 重钉 `agent._slot`——防多标签 / 跨端切槽后落错槽）+ 回合尾落盘 `saveAgentSlot`（**不抛**——写盘失败不掀回合）· 零算法副本（`docs/desktop/design/SHELL.md` §4 项 1 / 项 4） |
| `thincoder-desktop/src/main/session-slots.mjs` | **195**（实读 2026-09-28——两座落：残余批 180 ⇒ 194〔状态栏 wiring `slotFlags`〕⇒ 195〔账本 `ledgerHealth` 转口一行〕；批 B 末实读 154） | 端壳：端名声明（`END = "desktop"` + `setSessionEnd(END)`）+ **转口八项**（marker 三项〔端参绑定〕+ 会话族五项：端参绑定 3〔`resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`〕· 纯 re-export 1〔`renameSlot`〕）——零算法副本（先例 = 扩展端端壳 77 行）+ `history:page` 薄处理体（核 `loadSlotFile` + `historyWindow` 转口——零算法副本）；**批 B**：`effort` 槽字段落地 ⇒ `slotMeta` 的配置回落支（`?? str(loadConfig()?.provider?.reasoningEffort)`）删除 + 陈旧注释（「`effort` 槽无字段」）收正 ⇒ 槽值优先（KD-17；`loadConfig` 若成未用导入随删） |
| `thincoder-desktop/src/main/session-actions.mjs` | 67 | 会话族动作层：五通道（create / switch / rename / delete / resume）+ 回执信封 `{ ok, reason: null|string, cwd, slot }`（`docs/desktop/design/IPC.md` §2 会话族注） |
| `thincoder-desktop/src/main/sessions.mjs` | **45**（实读 2026-09-28——R3c 37 ⇒ 45〔账本警示面回执 `ledger` 投影〕） | 会话族读面：`sessions:list` 载荷投影（核 `listSlots` 条目 → 左列行）——零新增算法（`docs/desktop/design/IPC.md` §2 会话族注） |
| `thincoder-desktop/src/main/projects.mjs` | **120**（批 B 末实读） | 当前项目（内存态）与最近目录面——读面 = 核会话槽面回读、零新存储（`docs/desktop/design/IPC.md` §2 项目面注 · `docs/desktop/design/PROJECT.md` §2 KD-9） |
| `thincoder-desktop/src/main/settings.mjs` | **253**（批 B 末实读——内容行数口径；⑥ 档位写面增量入账） | 设置写面（`config:write`——键白名单仅 `locale`）+ 模型面（`model:list`——**批 B 补逐模型元素投影 `{ id, effortEnum, thinkOff }`**：主进程引核 `specForModel(model).reasoningEffortEnum` / `thinkOffPath(spec)` = 零副本，KD-18）+ agent 参数面板（`settings:agent`）——三面共用核 `loadConfig` / `writeConfigAtomic`（零自写盘）；**批 B · ⑥**：`settings:agent` 增 `{ tier }` 写径（主进程局部 `deleteKeyPath`（镜像 `setKeyPath`）+ 核 `thinkOffShape` / `thinkOffPath` 判据——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」） |
| `thincoder-desktop/src/main/providers.mjs` | **150**（批 B 末实读） | provider 族四通道（`provider:list` / `save` / `remove` / `verify`——值面住核，端侧零形状构造）；**批 B · ⑥ 增**：`provider:list` 逐行 `effort` 档位现值投影（离线——引核 `thinkOffShape` / `specForModel`，零副本） |
| `thincoder-desktop/src/main/mcp-servers.mjs` | **119** | MCP 族三通道（`mcp:list` / `save` / `remove`——探活失败 ⇒ 零写盘） |
| `thincoder-desktop/src/main/project-info.mjs` | **48** | 项目级信息族（`ledger:read` / `batch:status`——台账经核动态 import；相位 = `readManifest(cwd)` **回执 `manifest.phase`**（无顶层 `phase`；非 ENOENT 读错上抛直传）） |
| `thincoder-desktop/src/main/attachments.mjs`（批 B） | **125**（批 B 末实读） | 附件落盘面（批 B 新档——渲染面 `dataURL` → 主进程落文件 + 核 `appendImagePointer` 锚点）；语义 / 上限 / 清理时点单源 = `docs/desktop/design/IPC.md` §2「附件注」 |
| `thincoder-desktop/src/preload/preload.cjs` | **58**（批 B 末实读） | 窄桥：白名单通道（**26 ⇒ 27 项**——批 B 增 `session:prefs`）+ `contextBridge` + **事件订阅面** `on(name, cb)`（白名单十通道 · 表外 throw · 返回退订）；批 A 增量 = 白名单项 1 行（结构不变） |
| `thincoder-desktop/renderer/index.html` | **46**（批 A 末实读） | 骨架 + CSP（经 `app://` 的真实 origin 方可收紧）+ 设置面板容器与入口位（批 9）+ 输入区单容器 `[data-slot="composer"]`（批 A——`.session` 内、对话流之后；+1 行，结构其余不变） |
| `thincoder-desktop/renderer/styles.css` | **466**（实读 2026-09-28——账本警示面 `.rail-ledger-notice` 单规则落；越 300 在册——拆档预案 = §10 **AL**） | 三列布局 + 主题变量 + 折叠态 + 标签条 / 会话头 / 状态栏样式与字形面（`content`）——**批 A 修正轮入本批面**：`thincoder-desktop/renderer/styles.css:184` 注释含 `inert` 死项（⑤ 换 `tabindex` 后失效）⇒ 随 ⑤ 收正（零语义）；**本批（D21）**：主题表 **+14 变量**（亮暗两套）+ 左列会话行面 **9 面** 收正（会话面板映射表 = `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2） |
| `thincoder-desktop/renderer/chat.css` | **300 ⇒ ≈310**（本批（外壳视觉降噪）——批前实读；**超 300 建议线**（< 500 硬限）⇒ 预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 排末 · 零搬移 · 本批不落）） | 对话流块 / 工具卡 / 摘要块 / 药丸样式（形态单源 = `docs/desktop/design/UI.md` §1 对话流 / 工具卡行——分档理由 = `styles.css` 实读 284 贴 300 层） |
| `thincoder-desktop/renderer/pool.css` | **78 ⇒ ≈84**（本批（外壳视觉降噪）——批前实读） | 活动池与审批卡样式（零断点——单断点常量仍单源 = `styles.css`；形态单源 = `docs/desktop/design/UI.md` §1 审批呈现行 / §2 项 1 行——分档理由同上一行） |
| `thincoder-desktop/renderer/app.mjs` | **254**（实读 2026-09-28——账本警示面 `RAIL_KEYS` 增 `ledger` 后；批 B 追加轮末 247） | 引导与会话 / 对话流接线（会话族接线与刷新 · 对话流槽接线与流式拉取——`paintChat`）——**在册预案落形**：池面接线拆出（`mount-pool.mjs`）；**批 9 续拆落形**：设置面 / 向导接线拆出（`mount-settings.mjs`——实读 **458**，在册例外见下行）；**批 A 续拆落形**：输入区接线拆出（`thincoder-desktop/renderer/mount-composer.mjs`——批 A 新档）；**批 A 关闭尾（第 ⑥ 件）**：关标签 ⇒ **页随动**（关活动 ⇒ 走激活同一尾 / 关唯一 ⇒ 关页；判据 = `activeTab` 前后差；~5 行）· **批 A 修正轮补登行动作接线**：`session:rename` / `session:delete` 两通道出口（invoke + 回执 `ok` 真 ⇒ 左列刷新；删除 ⇒ 后随 `closeTab` 关闭尾）· 提问卡出口引调（出站与清切片住 `thincoder-desktop/renderer/mount-cards.mjs`——计划卡零出口）· 两新档引调（`mount-composer.mjs` / `mount-cards.mjs`）⇒ **拆分落形**（批 A）：会话族接线拆 `thincoder-desktop/renderer/mount-sessions.mjs`（实读 **197**）⇒ 本档落 **222**（批 A 末实读——预案消解）；**批 B 追加轮**：对话流构树引调增 `onOpenDir` / `onNewSession` 两接线 + `CHAT_KEYS` 增 `"project"`（首启引导面动作出口——单源 = `docs/desktop/design/UI.md` §1 批 B 追加注） |
| `thincoder-desktop/renderer/events.mjs` | **351 ⇒ 369 ⇒ 500 ⇒ 473 ⇒ 494**（实读 2026-09-28——两座落：残余批拆 `questions.mjs` / `badges.mjs` 后 473 ⇒ 494〔状态栏 wiring `flags` 写 + `applyFlags`〕；越 300，预案见下行） | 事件归约面：`ev:*` 十通道 → 切片写者单源（`reduce` 纯函数 · `applyPage` 回执两径 · `blockOfMessage` 页→块归约 · **批 A**：`ev:question` / `ev:task` 由直返改**写切片** `questions` / `tasks`——零 DOM ⇒ 平 node 直测（`ev:question` 同处按**同码闭集**置本键 `approval` 位标——与 `onApproval` 同形；置位面点名 = `docs/desktop/design/UI.md` §1 提问呈现行）；形态单源 = `docs/desktop/design/RENDERER.md` §1.1）；批 A 后**贴 300 层**：拆分预案 = 两新切片归约拆 `renderer/questions.mjs`（拟新增）；**批 A 修正轮收正**：回合终局三径（`ev:activity`〔无 `fields`〕`done` / `stopped` ∨ **`ev:error`**——`isTurnTail` **吃两通道形**（`ev:activity`〔无 `fields`〕∧ `event ∈ {done, stopped}` ∥ `ev:error` 单形载荷 `{ key, message }`——两通道同调此谓词；实施落点 = 现谓词体只吃 `ev:activity` 形），错误径清本键 `running` + 位落 `done`（`onError`）；单源 = `docs/desktop/design/RENDERER.md` §1.1 回合尾三径条）；**批 B 增**：`ev:usage` 归约（按会话 `key` 写切片——唯一写者 · 未至 / 非正数 ⇒ 零节点——KD-20） |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **68**（批 B 末实读） | 订阅接线出档（自 `events.mjs` 拆出——300 行拆分层落形）：十通道表 + `attachEvents({ on, store, invoke, onTurnTail })`（退订句柄 · 回合尾标题刷新——`sessions:list` 复用零新通道）；单向依赖归约档（无环——形态单源 = `docs/desktop/design/RENDERER.md` §1.1） |
| `thincoder-desktop/renderer/mount-pool.mjs` | **60**（实读 2026-09-28——R3b 57 ⇒ 状态栏 wiring `submitVerdict` 写 `flags` 切片） | 活动池面接线（自 `app.mjs` 拆出——在册预案落形；`docs/desktop/design/SHELL.md` §1 树同源） |
| `thincoder-desktop/renderer/mount-sessions.mjs` | **197** | 会话族接线出档（自 `app.mjs` 拆出——批 A 拆分落形）：开页三路（`thincoder-desktop/renderer/mount-sessions.mjs:63` / `:100` / `:109`——键面成身处）· 关闭尾 `closeTail`（`:121-126`——关活动 ⇒ 邻位 / 关唯一 ⇒ 关页 · 零动作三径；三调用点 `:133` / `:140` / `:192`）· 行控件两件出口（`session:rename` / `session:delete` 接线）· 刷新面（页随动单源 = `docs/desktop/design/RENDERER.md` §1.1；通道面 = `docs/desktop/design/IPC.md` §2 会话族注） |
| `thincoder-desktop/renderer/dom.mjs` | 64 | DOM 工具 |
| `thincoder-desktop/renderer/i18n.mjs` | **423**（实读 2026-09-28——两座落：R3 末 407 ⇒ 423〔状态栏对齐 +6 键 + 账本两键〕；越 300，预案见下行） | 词表面：核域键取 `config:read` 语言面下发投影（`docs/desktop/design/IPC.md` §2）+ 宿主 UI 专有键（两语——批 9 补设置面 / 向导两族；批 A 补输入区 / 提问卡 / 计划卡 / 队列满四族）+ `t()`；**批 B 补四族**：会话头三值 / 附件（含 `nonvision` / `partial` 两降级提示）/ 复制 / 状态栏读数；批 A 后**越 300**：拆分预案 = 词族按视图面拆第二档；**批 B 追加轮**：增引导面两键（`chat.guide.noProject` / `chat.guide.noSession`——zh / en 各一） |
| `thincoder-desktop/renderer/store.mjs` | **333**（实读 2026-09-28——两座落：R3a / R3b 后 328 ⇒ 333〔`sessionFlags` 初形 + `ledger` 槽位注册〕；越 300，预案见下行） | 单状态树 + 订阅（批 9 增两切片：`settings`〔渠道 / 模型 / 参数 / MCP 四组 + 三态〕· `projectInfo`〔台账计数 + 相位〕；批 A 增两切片 `questions` / `tasks` + 队列三纯动作 `enqueue` / `dequeue` / `drainQueue`——`pool.queue` 唯一写面 · 满队常量 `QUEUE_MAX` 单源（超限 ⇒ `enqueue` 不收）；**批 A 修正轮增**换形态态 `railForm{ key, mode }`（`mode` ∈ `rename` / `delete`）+ 两纯动作 `openRailForm` / `closeRailForm`（沿 `pendingClose` 先例））；**批 A 预算构成** = 两切片 + 三队列纯动作 + `QUEUE_MAX` + `railForm` 两纯动作 + 注释面（~40 行）⇒ 批后实读 **310**（越 300 ⇒ **拆分预案** = 队列面（三纯动作 + `QUEUE_MAX`）拆 `thincoder-desktop/renderer/queue.mjs`（拟新增）——消解窗口 = 下次被触碰的批）；**批 B 增**：`usage` 切片（回合尾读数按会话 `key`）· `settings` 切片模型候选随 `model:list` 元素形（逐项 `.id`） |
| `thincoder-desktop/renderer/views/chat.mjs` | **299**（批 B 追加轮实读——批 B 末 292 · 仍不越 300） | 对话流三态 + 块五型（用户 / 助手 / 推理 / 工具 / 错误）（形态单源 = `docs/desktop/design/UI.md` §1 对话流行）；审批卡**入流**（本批——卡面住 `thincoder-desktop/renderer/views/approval.mjs` 行，本档落槽位与帧尾随动）（流式 / 滚动 / 工具卡三面已分档——`chat-stream.mjs` / `chat-scroll.mjs` / `chat-tool.mjs` 三行）；批 A：卡三类入流序（待审批 → 提问 → 计划）+ 贴 300 层（拆分预案 = 卡构树拆出——卡面两档已单立）；**批 B**：逐块复制控件引调（构树住 `thincoder-desktop/renderer/views/chat-copy.mjs`（**批 B 已落**——实读 **133**）——本档只增引调两行，防越 300）；**批 B 追加轮**：`chatModel` 增 `guide` 判据（`no-project` / `no-session` / `no-message` / `null`）+ 构树引调 `thincoder-desktop/renderer/views/chat-guide.mjs`（已落 · 实读 **54**——空态构树外提 ⇒ 本档仍不越 300） |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | 77 | 流式增量渲染（token / 推理块 / 工具卡增量——`streamDelta` 四档 none / append / patch / reset；按块更新，不整段重画） |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | **91**（批 A 末实读） | 滚动面三事——渲染窗口 / 回填 / 跟滚与药丸（常量与阈值单源 = `docs/desktop/design/RENDERER.md` §2 / §3）+ `guards{ hasOlder, inFlight }` 与 `onBackfill` 接线 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 126 ⇒ **135**（本批实施后实读；**可见面修复批修（#460）**：头行四段逐段包元素） | 工具卡面：工具块构树三件（头行 / 改动摘要 / 结果区）+ 折叠纯函数 `toggleExpanded` + 接线两态原语（`wire` / `withKey`）+ **共享导出面**（批 7 追加：阈值常量 `DIFF_FILE_FLOOR` / `DIFF_LINE_FLOOR` · `changeTotals` · 改动摘要行构造〔越阈降级 = 只摘要行 ∧ 零 `[data-file]`〕——审批卡面复用零副本，阈值 / 摘要形单源）——拆分落形（`chat.mjs` 228 + 123 = 351 > 300 ⇒ 越层拆出；形态单源 = `docs/desktop/design/UI.md` §1 工具卡行） |
| `thincoder-desktop/renderer/views/approval.mjs` | 150 ⇒ **~155**（**可见面修复批修（#460）**：首行段逐段包元素） | 审批卡面：两形键位（`verdictOfKey` 纯函数 ⇒ 表外零动作）+ **初始焦点目标** = 最安全键（标记锚 `data-autofocus="1"` + `chat.css` 高亮；真置焦执行未落）+ 出口动作 `respondApproval` + **操作区描述符导出**（三出口锚 / 值映射 / 词键 = 单一 owner——池面待审批族消费零副本）（零 `store.mjs` import——出口经注入句柄；形态单源 = `docs/desktop/design/UI.md` §1 审批呈现行 · 通道 = `docs/desktop/design/IPC.md` §2） |
| `thincoder-desktop/renderer/views/sessions.mjs` | **301**（实读 2026-09-28——R3c 行元数据族 256 ⇒ 286 ⇒ 账本注记节点 295 ⇒ 条件附句合成 **301**；**越 300 顾问线**——预案 = 注记构树外提〔档名实施批定〕） | 左列 + 状态位（形态单源 = `docs/desktop/design/UI.md` §1 左列会话行）；批 A 增**行控件两件**（改名 / 删除——行原位换形）⇒ **标签条面拆出**（下行）；后续两笔 = R3c 行元数据族三值（provider / N msgs / updated）+ 账本警示面注记（本档 §4.2 同笔） |
| `thincoder-desktop/renderer/views/tabbar.mjs` | **200**（批 A 末实读） | 标签条面（自 `thincoder-desktop/renderer/views/sessions.mjs` 拆出——批 A）：`tabbarModel` / `tabbarTree` / `mountTabbar` + **加速键面**（`Ctrl/Cmd+1..9` 文档级 `keydown`——第 N 档激活 · 表外键零动作不吞键）；非活动项两控件 `tabindex="-1"`（确认态 `data-confirm="1"` 项例外——零 `inert`）；形态单源 = `docs/desktop/design/UI.md` §1 标签条行 / 交互行；接线单源 = `docs/desktop/design/RENDERER.md` §1.1 键盘面 |
| `thincoder-desktop/renderer/views/chrome.mjs` | **164**（实读 2026-09-28——状态栏对齐批落：`FIELD_ORDER` 撤两键后；R3a 末 163） | 会话头 + 状态栏；**批 B**：会话头三值就地可改（`data-field` 内嵌 `select` · 候选 = `model:list` / `provider:list` 投影（模型候选取回执逐项 `.id`）· 回执 `meta` ⇒ 就地刷本行）+ 状态栏读数节点（`data-usage` · 未至 / 非正数 ⇒ 零节点）——KD-20 / KD-18，形态单源 = `docs/desktop/design/UI.md` §1 会话头 / 状态栏行（批 B 注项 1 / 3） |
| `thincoder-desktop/renderer/views/activity.mjs` | **177 ⇒ 248**（实读 2026-09-28——R3b 右列重写为子 agent 块面后；**可见面修复批修（#460）**：标签行两段逐段包元素） | 活动池（本批落形：三态 `none` / `empty` / `pool` · 族序 = 待审批 → 活动块 → 队列 · 折叠头两读数 `running` / `approval`——禁假造 · 待审批族操作区 = 复用 `thincoder-desktop/renderer/views/approval.mjs` 导出描述符〔单一 owner · 零副本〕；形态单源 = `docs/desktop/design/UI.md` §2 项 1 行） |
| `thincoder-desktop/renderer/views/settings.mjs` | **296**（批 B 末实读） | 设置 / provider / MCP / agent 参数（四段体住 `thincoder-desktop/renderer/views/settings-sections.mjs`；**批 B**：模型候选消费随 `model:list` 元素形——逐项 `.id`，随动一行） |
| `thincoder-desktop/renderer/views/settings-sections.mjs` | **290**（批 B 末实读——⑥ 增量入账） | 设置面四段体（渠道 / 模型与档位 / agent 参数 / MCP——自 `thincoder-desktop/renderer/views/settings.mjs` 拆出〔批 9 拆分落形 · 300 行层 · 零语义变化〕；导出 `modelHeadNode` / `modelChoicesTree` 供首启向导第二步复用（单一 owner）——零 import 反向〔无环〕；本批补登）；**批 B**：`模型与档位`段 `effort` 改 `select`（候选 = Auto + off 族 + 逐模型档位枚举——枚举单源 = 核 `reasoningEffortEnum` 投影；**off 在场判据 = 逐模型 `thinkOff`**；写面 `settings:agent` = 全局默认）；**⑥ 增**：现值取 `provider:list` 行投影（离线）· 表外现值自成一选项 · 失败回退（零静默）——单源 = `docs/desktop/design/UI.md` §1 批 B 注项 5 |
| `thincoder-desktop/renderer/views/onboarding.mjs` | **161** | 首启向导（无终端可完成；闸 = `config:read` 回执 `configured`（配置档存在性）——形态单源 = `docs/desktop/design/UI.md` §1 首启向导行） |
| `thincoder-desktop/renderer/views/info-row.mjs` | **135** | 项目级信息行（左列底行——三读数〔池 / 技术待办 / 陈旧〕+ 超阈标 + 相位 + 右端设置入口 `settings:open`；读数缺 ⇒ 该读数零节点 · 禁假造；形态单源 = `docs/desktop/design/UI.md` §1 项目级信息行） |
| `thincoder-desktop/renderer/views/question.mjs` | **106**（批 A 末实读） | 提问卡面（`question` 工具流内卡——纯描述符 + 薄挂载；子序 = 题干行 → [给答项操作区?] → 作答区；三出口锚 `question:<i>` / `question:answer` / `question:cancel`——零 `store.mjs` import；形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行） |
| `thincoder-desktop/renderer/views/plan.mjs` | **41 ⇒ ~45**（批 A 末实读；**可见面修复批修（#460）**：行两段逐段包元素） | 计划卡面（`ev:task` 消费——纯描述符；行 = 事项标题 + 状态词；空列表 ⇒ 卡不在场；形态单源 = `docs/desktop/design/UI.md` §1 计划面行） |
| `thincoder-desktop/renderer/mount-settings.mjs` | **426 ⇒ ~427**（批 B 末实读 · ⑥ 拆档：向导接线族拆出 + 档位写接线入账；**可见面修复批修（#461）**：`refreshInfo` 入导出句柄面——在册例外续期不变） | 设置面 / 向导 / 信息行接线出档（自 `app.mjs` 拆出——批 9 拆分落形；通道接线与表单装配，视图构树住 `thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs` / `thincoder-desktop/renderer/views/info-row.mjs`）——**越层在册例外续期**（拆分落形 + 再拆预案见下行） |
| `thincoder-desktop/renderer/mount-onboarding.mjs`（批 B · ⑥ 拆档） | **88**（批 B 末实读） | 向导接线族（自 `thincoder-desktop/renderer/mount-settings.mjs` 拆出——`presetValue` / `pickDir` / `nextStep` / `finishWizard` / `wizardHandlers`；共享项 `submitChannel` / `verifyChannel` / `loadModels` 留原档 ⇒ deps 注入）；通道面 = `docs/desktop/design/IPC.md` §2 设置族注；形态单源 = `docs/desktop/design/UI.md` §1 首启向导行 |
| `thincoder-desktop/renderer/mount-composer.mjs` | **348 ⇒ ~362**（批 B 末实读——越 300，预案见下行；**可见面修复批修（#458）**：用户块两径出泡 ≈14 行） | 输入区挂载出档（自 `thincoder-desktop/renderer/app.mjs` 拆出——批 A）：两态落形 · Enter / Shift+Enter 键位 · 忙态入队 + 满队提示（常量 `QUEUE_MAX` 单源 = 本档 §4.1 `thincoder-desktop/renderer/store.mjs` 行）· 回合尾 flush 队首一条；**批 B**：附件条挂载（根锚 `data-attachments`——构树 / 采集住 `thincoder-desktop/renderer/attach.mjs`）+ 附件随 `msg:send` 载荷 `images` 出口 + `degraded` 提示行 + 末条复制控件（`data-action="chat:last"`）；形态单源 = `docs/desktop/design/UI.md` §1 输入区行（批 B 注项 2 / 4） |
| `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮） | **149**（批 A 末实读） | 卡族挂载与出站（批 A 修正轮新档——提问卡出口落点点名）：`question:respond` 出站（作答 / 取消两向）+ 回执 `ok` 真 ⇒ 清本键 `questions` 切片（纯动作 `clearQuestion` 增导出 = `thincoder-desktop/renderer/events.mjs`）+ 清位标 + 卡挂载（计划卡零出口——纯呈现）；先例 = 审批出口 `respondApproval` 住 `thincoder-desktop/renderer/views/approval.mjs` ∥ 接线住 `thincoder-desktop/renderer/mount-pool.mjs`；形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行 |
| `thincoder-desktop/renderer/mount-head.mjs`（批 B） | **147**（批 B 末实读） | 会话头 / 状态栏面接线（批 B 新档）：三值就地可改出站（`session:prefs`）与回执 `meta` 刷新 + 状态栏读数节点（`data-usage`——KD-20）；形态单源 = `docs/desktop/design/UI.md` §1 会话头 / 状态栏行；通道面 = `docs/desktop/design/IPC.md` §2 会话级偏好注 |
| `thincoder-desktop/renderer/attach.mjs`（批 B） | **146**（批 B 末实读） | 附件采集与构树纯函数（输入区 `paste` → `FileReader` → `dataURL` 条目集 + 移除控件；**零 fs** ⇒ 平 node 直测）；形态单源 = `docs/desktop/design/UI.md` §1 输入区行（批 B 注项 2） |
| `thincoder-desktop/renderer/views/chat-copy.mjs`（批 B） | **133**（批 B 末实读） | 逐块复制控件构树与取文面（纯文本取块文本逐字 · 块文本空 ⇒ 零控件）；`thincoder-desktop/renderer/views/chat.mjs` 只引调（+2 行——防越 300）；形态单源 = `docs/desktop/design/UI.md` §1 批 B 注项 4 |
| `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮） | **54**（批 B 追加轮实读——内容行数） | 首启引导节点构树（三值 `data-guide`：`no-project` / `no-session` / `no-message`——判据单源 = `thincoder-desktop/renderer/views/chat.mjs` 的 `chatModel.guide`）；**非块节点**（零 `data-block-id` · 不入块序）· 零 `store.mjs` import（句柄注入 `onOpenDir` / `onNewSession`）——先例 = `thincoder-desktop/renderer/views/chat-copy.mjs`；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注 |
| `thincoder-desktop/renderer/views/statusline.mjs`（R3a · 批档见 §4.2） | **269**（实读 2026-09-28——16 段落；banner 段组已拆出 ⇒ 拆后 ≤300） | 状态行族档：承载段构树单源 + `STATUS_SEGMENTS` 段闭集（16 码）+ `mountStatus` 薄挂载（自 `chrome.mjs` 拆出；同名再出口 —— 消费面零改）；拆档落形 = banner 段组出档（下行） |
| `thincoder-desktop/renderer/views/statusline-banner.mjs`（状态栏对齐批新档） | **25**（实读 2026-09-28——≤300） | banner 段组（`BANNER_CODES` + `bannerSegments`——四态段构树自 `statusline.mjs` 拆出；严格真 ⇒ 在场 · 假 / 缺 / 非布尔 ⇒ 零节点） |
| `thincoder-desktop/renderer/mount-status.mjs`（R3a） | **26**（实读 2026-09-28——`STATUS_KEYS` 增 `sessionFlags`） | 状态行挂载：槽锚 `STATUS_SLOT` + 订阅切片键面 `STATUS_KEYS` + `attachStatus()` |
| `thincoder-desktop/src/main/subagent-face.mjs`（R3b） | **86**（R3 末实读） | 子 agent 停止出口 + 存活投影起 / 停 / 清点（自 `agent-host.mjs` 出档） |
| `thincoder-desktop/renderer/views/chat-text.mjs`（R3c） | **73**（实读 2026-09-28——含残余批 `textFace` 分流） | 文本面经核 `md` + 推理块壳 + 帧尾就地更新（`user` ⇒ `mdInline` ∥ 余型 ⇒ `md`） |
| `thincoder-desktop/renderer/views/chat-cards.mjs`（R3c） | **51**（R3 末实读） | 卡构树拆出（在册拆档预案落形——`views/chat.mjs` 出档） |
| `thincoder-desktop/renderer/core.css`（R3c） | **259**（实读 2026-09-28——D21 视觉收正后） | 核类名 → 桌面变量映射（md 产出 / 推理块 / 复制钮 / `tk-*` 高亮族） |
| `thincoder-desktop/renderer/settings.css` | **273 ⇒ ≈289**（本批（外壳视觉降噪）——批前实读 · 设置面映射 9 面） | 设置面板 / 向导样式（分档理由 = `styles.css` 实读 284 贴 300 层——沿 `chat.css` / `pool.css` 先例） |
| `thincoder-desktop/scripts/check-dist.mjs` | **27**（批 B 末实读） | 产物校验（照扩展端 `check-vsix` 先例） |
| `thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs` | **43 / 22**（实读 2026-09-28——按盘刷新） | 单入口 + 显式清单（清单↔盘上两向自检——照 `docs/core/design/TESTING.md` §10 形态；`files.mjs` 值口径 = 内容行数——批 B 末实读 **19**；批 B 追加轮两新档入册 ⇒ 名打包入既有行 · 行数净 0（仍 **19**；**实读 43 / 22**——按盘刷新〔R3 档：`files.mjs` 20 ⇒ 21 ⇒ 残余批 22〕））；另三共享助手（非清单档）= `thincoder-desktop/test/fake-dom.mjs` **217** · `thincoder-desktop/test/slot-sandbox.mjs` **25** · `thincoder-desktop/test/views-harness.mjs` **161**（**按盘回填 2026-09-28 · 父侧直接执行〔可 revert〕**：`host-floor` **301** · `views-chrome-vocab` **318** · `views-statusline` **298**——余值承前） |
| `thincoder-desktop/test/{host-floor,guard-closure,agent-host,agent-host-question,agent-host-subagent,events-reduce,events-subagent,agent-bridge-subagent,history-page,session-io,session-prefs,agent-host-usage,session-contract,projects,store,views,views-rail-actions,views-tabbar,views-tabbar-close,views-chrome,views-chrome-vocab,views-head,views-locks,views-chat,views-chat-text,views-chat-frame,views-chat-scroll,views-chat-guide,views-statusline,views-approval,views-activity,events-page,views-question,settings,providers,mcp-servers,project-info,views-settings,views-onboarding,views-attach,attachments}.test.mjs` | 303 / 103 / 338 / 116 / 143 / 312 / 121 / 155 / 172 / 110 / 209 / 183 / 319 / 204 / 339 / 242 / 150 / 297 / 317 / 283 / 320 / 299 / 190 / 265 / 139 / 185 / 278 / 110 / 298 / 295 / 221 / 252 / 359 / 300 / 263 / 157 / 124 / 446 / 160 / 283 / 247 | 用例模块——**四十一档**（名序 = `thincoder-desktop/test/files.mjs` 现值同序；值列 = 各档实读现值〔批 B 追加轮实读 2026-09-27——未触碰者承批 B 末实读；**R3 后刷新**实读 2026-09-28；**两座落后受触档刷新**（状态栏 wiring / 账本警示面——实读 2026-09-28）· 口径 = 内容行数（文末换行不计）〕；批 7 增两档 + 实施期拆档两档 + **批 8 增五档**：`agent-host` / `events-reduce` / `history-page` / `session-io` / `events-page` + **批 9 增六档**：`settings` / `providers` / `mcp-servers` / `project-info` / `views-settings` / `views-onboarding`（19 + 6 = 25）+ **批 A 增三档**：`views-question` / `views-tabbar-close` / `agent-host-question` = 28 ✓；批 9 六档入册位次以 `thincoder-desktop/test/files.mjs` 两向自检为准；**批 A 补例落值** = `thincoder-desktop/test/views.test.mjs` **292**（行控件两件补例）· `thincoder-desktop/test/events-reduce.test.mjs` **249**（两切片归约 + 回合尾三径补例）；**批 B 增两档** = `thincoder-desktop/test/session-prefs.test.mjs`（会话级偏好通道 / 键闭集 / 施加径 / 在飞拒 `busy`）· `thincoder-desktop/test/views-attach.test.mjs`（附件采集与构树 + 复制控件与取文面）· **批 B 实施期档面四增** = `thincoder-desktop/test/views-chrome-vocab.test.mjs`（自 `views-chrome.test.mjs` 拆出——批 B 末实读 **291**）· `thincoder-desktop/test/agent-host-usage.test.mjs`（用量族补例单列——`agent-host.test.mjs` 落 **299**）· `thincoder-desktop/test/views-head.test.mjs`（会话头面用例）· `thincoder-desktop/test/attachments.test.mjs`（附件落盘面用例）⇒ **三十四档** ✓；**批 B 追加轮增一档** = `thincoder-desktop/test/views-chat-guide.test.mjs`（引导节点构树 + 动作控件在场判据——已落 · 实读 **110**）⇒ **三十五档** ✓；**此后各批实施期增六档** = `agent-host-subagent` / `events-subagent` / `agent-bridge-subagent` / `views-rail-actions` / `views-chat-text` / `views-statusline` ⇒ **四十一档** ✓（全清单 = `thincoder-desktop/test/files.mjs` **44** 档——本行 41 + 集成域三档另列下行）；**批 B 原址补例落值** = `thincoder-desktop/test/settings.test.mjs` **300**（`model:list` 元素形两向 + ⑥ tier 三径与两 reason）· `thincoder-desktop/test/events-reduce.test.mjs` **285**（`ev:usage` 归约）· `thincoder-desktop/test/views-chrome.test.mjs` **258**（拆档后——会话头三 `select` + 状态栏读数两态）· `thincoder-desktop/test/providers.test.mjs` **263**（`provider:list` 行 `effort` 投影两向）· `thincoder-desktop/test/views-settings.test.mjs` **446**（⑥ 现值投影 / 选项集 / 表外自成一选项；越 300 层 ⇒ 拆分预案 = 用例面拆出〔档名实施批定〕——只登记、不建新档）；**批 B 追加轮 · 修正轮**随动两笔：`thincoder-desktop/test/views-chrome-vocab.test.mjs` **291 ⇒ 298**（零 CJK 扫描名单增 `thincoder-desktop/renderer/views/chat-guide.mjs` · 用例名档数同笔 · 夹具补 `chatModel` 两码态树入量）· `thincoder-desktop/test/host-floor.test.mjs` **292 ⇒ 294**（`fresh` ≤300 臂清单增 `thincoder-desktop/renderer/views/chat-guide.mjs` 一项——新增码面档入臂惯例）；**批 B 追加轮另触碰三档实读** = `thincoder-desktop/test/views-chat.test.mjs` **265**（`chatModel.guide` 判据单源断言）· `thincoder-desktop/test/views-chat-frame.test.mjs` **185**（子序 `[引导?]` + `none` / `empty` 两帧断言）· `thincoder-desktop/test/views-tabbar-close.test.mjs` **317**（U120 页随动：关唯一 ⇒ 零块节点 + 引导节点——越层在册） |
| `thincoder-desktop/test/integration/settings-panel.test.mjs`（集成域） | ~120 ⇒ **137**（内容行数——已落实读 2026-09-27） | E2E 用例 = **T-DSK27**（真 Electron：开设置面 ⇒ 断言 ⇒ 关；固定落点 PNG）；域界 = 目录界 · 登记同 `thincoder-desktop/test/files.mjs`（清单口径 = `docs/core/design/TESTING.md` §10）；形态与九步断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.3 / §6 |
| `thincoder-desktop/test/integration/first-run-smoke.test.mjs`（批 B 追加轮 · 集成域） | 0 ⇒ **171**（内容行数——批 B 追加轮实读 2026-09-27） | E2E 用例 = **T-DSK32**（首启空态引导冒烟：无项目 ⇒ 无会话 ⇒ 建会话 ⇒ 键入不丢）；域界 / 登记同上一行；形态与十二序断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 / §6 |
| `thincoder-desktop/test/integration/chat-render.test.mjs`（R3c · 集成域） | **176 ⇒ ≈212**（本批（外壳视觉降噪）——批前实读；原址补例：真机静息 / hover / 聚焦 / 滚动条读数） | E2E 用例 = **T-DSK37**（会话流经核 + 会话面板元数据；**本批（D21）**：真机读数原址补例面——§7 D21 注 ②）；域界 / 登记同上一行 · 断言序单源 = `docs/desktop/design/E2E-TESTING.md` §6 |
| `thincoder-desktop/test/integration/statusline-align.test.mjs`（状态栏对齐批 · 集成域） | **142**（实读 2026-09-28——内容行数） | E2E 用例 = **T-DSK39**（状态栏对齐——真 Electron 打开态对表 · 两臂可达态夹具）；域界 = 目录界 · 登记同 `thincoder-desktop/test/files.mjs`；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 / §6 |
| `thincoder-desktop/test/integration/ledger-notice.test.mjs`（账本警示面 · 集成域） | **121**（实读 2026-09-28——内容行数） | E2E 用例 = **T-DSK40**（账本警示面——真 Electron：损坏现场档 ⇒ 注记在场 + PNG）；域界 / 登记同上一行；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §3.6 / §6 |

**批 3 收口 · 行数回填**（内容行数口径——文末换行不计）：`thincoder-desktop/renderer/i18n.mjs` **93** · `thincoder-desktop/renderer/styles.css` **180** · `thincoder-desktop/test/views.test.mjs` **174**——三档超批 3 实施前预估界（89 / 162 / ≤150）但 ≪ 500 硬限 ⇒ **无拆分案**（上界系预估、以实读为准；明细 = `docs/batches/2026-09-25-desktop-impl-3.md` §5 D1）。

行宽上限 = 500 行（仓级硬限）；上表单档行宽除在册例外**均 ≲300**——**在册例外（一档）**：`thincoder-desktop/renderer/mount-settings.mjs` **426**（批 B 末实读——批 9 拆出 12 通道出口的正当体量；批 B 拆出向导族后落 **426**；距 500 硬限 **74** 行——续期，见下行）；
**例外拆分预案（批 B 落形）** = 向导接线族拆 `thincoder-desktop/renderer/mount-onboarding.mjs`（**批 B 已落**——本档实读 **88**）；**例外续期（批 B）**：拆后本档 **426** **仍越 300**（≪500 硬限——距硬限 **74** 行）⇒ 例外不消解、续期；
**再拆预案** = 信息行接线族 + 读数供给族拆出（档名实施批定——消解窗口 = 该档下次被触碰的批）；**越 300 层段（实读 2026-09-28 两座落后刷新）** = 在册例外一（`mount-settings.mjs` **426**）＋ 越层各行（下行）——本批两档候选**拆后消解**（`statusline` **269** / `agent-host` **254** 皆落线下），并**本轮补登三档**（`agent-host.test` / `session-contract.test` / `events-reduce.test`）；
**本批（可见面五件）触碰两越层档**（`thincoder-desktop/renderer/events.mjs` / `mount-composer.mjs`——增量各 ≈12 / ≈14 行，越层事实不变）⇒ **预案补登（归父侧裁——§10 AD）**：
  `thincoder-desktop/renderer/events.mjs` = 问题 / 任务两切片归约拆 `thincoder-desktop/renderer/questions.mjs`（拟新增，承前）· `thincoder-desktop/renderer/mount-composer.mjs`（原「预案待定」）= 发送面（`submitDraft` / `flushTurnTail` + 本批用户块写者）拆 `thincoder-desktop/renderer/composer-send.mjs`（拟新增）；
  父侧裁：本批实施批执行 ∕ 续期至下批（消解窗口 = 该两档下次被触碰的批）；
**越 300 层在册（实读 2026-09-28 两座落后刷新——受触档读数刷新 + 本轮补登三档；各带拆分预案 + 消解窗口）**：
  `thincoder-desktop/renderer/styles.css`（**466**（实读 2026-09-28——D21 后；账本注记单规则入账）——预案 = 按「主题变量 / 布局 / 折叠态」三段拆档；**消解窗口已到** ⇒ 拆档归父侧裁 = §10 **AL**）·
  `thincoder-desktop/renderer/views/sessions.mjs`（**301**——条件附句合成后越 300；预案 = 注记构树外提〔档名实施批定〕；消解窗口 = 该档下次被触碰的批）·
  `thincoder-desktop/test/views-activity.test.mjs`（**339**——存量越线补登（实读 2026-09-28）；预案 = 池面用例拆分〔档名实施批定〕；消解窗口 = 该档下次被触碰的批）·
  `thincoder-desktop/renderer/i18n.mjs`（**423**（实读 2026-09-28——两座落后）——预案 = 词族按视图面拆第二档）· `thincoder-desktop/renderer/store.mjs`（**333**（实读 2026-09-28——两座落后）——预案 = 队列面拆 `thincoder-desktop/renderer/queue.mjs`（拟新增））·
  `thincoder-desktop/renderer/mount-composer.mjs`（**362**（实读 2026-09-28）——预案 = **待定**〔在册——越线随批补登；拆档 = 结构改动，归父侧裁〕）·
  `thincoder-desktop/test/views-settings.test.mjs`（**446**——预案 = 用例面拆出〔档名实施批定〕；新档须动 `thincoder-desktop/test/files.mjs` / `thincoder-desktop/test/run.mjs`——只登记、不建新档）· `thincoder-desktop/test/views-question.test.mjs`（**364**（实读 2026-09-28）——预案 = 提问面用例拆出〔档名实施批定〕）·
  `thincoder-desktop/test/store.test.mjs`（**339**（实读 2026-09-28——两座落后）——预案 = 拆 `thincoder-desktop/test/store-queue.test.mjs`（拟新增））· `thincoder-desktop/test/views-tabbar-close.test.mjs`（**317**——预案 = 页随动例拆出〔档名实施批定〕）；
  `thincoder-desktop/test/views-chrome-vocab.test.mjs`（**320**（实读 2026-09-28——账本警示面 +4）——预案 = 词表面用例拆分〔档名实施批定〕）· `thincoder-desktop/test/host-floor.test.mjs`（**303**（实读 2026-09-28）——预案 = 臂清单族拆分〔档名实施批定〕）；
  **本轮补登三档**（两座落受触档——越线在册 + 预案）：`thincoder-desktop/test/agent-host.test.mjs`（**338**——预案 = 门面用例拆出〔档名实施批定〕）· `thincoder-desktop/test/session-contract.test.mjs`（**319**——预案 = 注记用例拆出〔档名实施批定〕）· `thincoder-desktop/test/events-reduce.test.mjs`（**312**——预案 = 用例面拆分〔档名实施批定〕）；
  ——**消解窗口 = 各自下次被触碰的批**；**贴 300 层未越** = `thincoder-desktop/renderer/views/chat.mjs`（**299**——预案 = 卡构树拆出）；批 A 拆档四件 + 批 B 拆档一件（`thincoder-desktop/test/views-chrome-vocab.test.mjs`）= §10 **U** 行 · 清单同步 = `thincoder-desktop/test/files.mjs`（两向自检）。
**本批（对齐重定位 · 设计轮）触碰越层三档 + 贴层一档**（`thincoder-desktop/renderer/events.mjs` · `thincoder-desktop/renderer/i18n.mjs` · `thincoder-desktop/renderer/store.mjs`——越层事实与预案承前；`thincoder-desktop/renderer/views/chat.mjs` 贴层）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）；消解窗口 = 各自下次被触碰的批。
**本批（状态栏对齐 · 两座落）触碰四档**（实读 2026-09-28——落值）：`thincoder-desktop/renderer/views/statusline.mjs` **269**（banner 段组拆出 `thincoder-desktop/renderer/views/statusline-banner.mjs` **25**——拆后 ≤300）·
  `thincoder-desktop/src/main/agent-host.mjs` **254**（装配面出档 `thincoder-desktop/src/main/agent-assemble.mjs` **95**——原路径同名 re-export）·
  `thincoder-desktop/renderer/events.mjs` **494** · `thincoder-desktop/renderer/mount-pool.mjs` **60**；新越层三档补登见上行（`agent-host.test` / `session-contract.test` / `events-reduce.test`）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）。
**本批（账本警示面 · 账本可靠批微轮）触碰六档 + 随动两档**（实读 2026-09-28——落值）：`thincoder-desktop/src/main/sessions.mjs` **45**（回执 `ledger` 投影——经端壳转口引核 `ledgerHealth`）·
   `thincoder-desktop/src/main/session-slots.mjs` **195**（两座合计：状态栏 wiring `slotFlags` + 本座转口一行）· `thincoder-desktop/renderer/views/sessions.mjs` **301**（注记节点 + `railModel` 增字段 + 条件附句合成——**越 300 顾问线**，预案 = 注记构树外提〔档名实施批定〕）· `thincoder-desktop/renderer/app.mjs` **254**（`RAIL_KEYS` 增 `ledger`）；
  测试面 `thincoder-desktop/test/session-contract.test.mjs` **319**（**新越层档**——预案 = 注记用例拆出〔档名实施批定〕· 消解窗口 = 该档下次被触碰的批）· `thincoder-desktop/test/views.test.mjs` **242**；
  表外四档（落而必报）= `thincoder-desktop/renderer/mount-sessions.mjs` **197**（净 0——`refreshRail` 同行加 `ledger` 写）· `thincoder-desktop/test/views-chrome-vocab.test.mjs` **320**（+4——键数门 145 ⇒ 146）；
  `thincoder-desktop/renderer/store.mjs` **333**（+2——`ledger` 槽位注册）· `thincoder-desktop/test/store.test.mjs` **339**（+2——初态定形锁同拍）；
  随动 = `thincoder-desktop/renderer/styles.css` **466** · `thincoder-desktop/renderer/i18n.mjs` **423**）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）。
**本批（外壳视觉降噪 · 设计轮）触碰四档 + 测试面两档**（`thincoder-desktop/renderer/styles.css` **463 ⇒ ≈481**——容器 / 骨架线 / 控件族 / 标签活动态 / 滚动条 4 规则与交互态组；越 300 在册——拆档预案 = §10 **AL**）·
  `thincoder-desktop/renderer/chat.css` **300 ⇒ ≈310**（**新越层档** ⇒ 预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 排末 · 零搬移 · 本批不落）——消解窗口 = 该档下次被触碰的批）·
  `thincoder-desktop/renderer/pool.css` **78 ⇒ ≈84** · `thincoder-desktop/renderer/settings.css` **273 ⇒ ≈289**（设置面映射 9 面）；
  测试面 = `thincoder-desktop/test/views-locks.test.mjs` **280 ⇒ ≈320** · `thincoder-desktop/test/integration/chat-render.test.mjs` **176 ⇒ ≈212**）——逐档「现行 ⇒ 预期」= §4.2 本批行（**就地给数**）；测试档随修随加——不占设计条目（2026-09-27 裁定）。

**300 行 = 主动拆分层**（>300 即须拆分评审）：`thincoder-desktop/test/views.test.mjs`（实读 **242**——2026-09-28）两轮拆分均已落档——
  U45–U48 标签条面 → `thincoder-desktop/test/views-tabbar.test.mjs`、
  U49–U52 中区外壳 / 词表面 → `thincoder-desktop/test/views-chrome.test.mjs`（实读 **283**——2026-09-28；批 7 拆出 U52 零回归面 ⇒ `thincoder-desktop/test/views-locks.test.mjs` 实读 **279**（2026-09-28）；批 B 拆出词表面 ⇒ `thincoder-desktop/test/views-chrome-vocab.test.mjs` 实读 **320**）。
**拆分落形（批 A）**：`thincoder-desktop/test/views-tabbar.test.mjs`（实读 **329**〔拆前〕· >300）中确认面族（U55）拆 `thincoder-desktop/test/views-tabbar-close.test.mjs` ⇒ 本档落 **297** ∕ 新档 **317**（新档越 300 ⇒ 预案 = 页随动例拆出 · 消解窗口 = 下次被触碰的批）；
  **拆分落形（批 B）** = 词表面族拆 `thincoder-desktop/test/views-chrome-vocab.test.mjs`（本档 **437 ⇒ 258** ∕ 新档 **291**）·
  用量族补例单列 `thincoder-desktop/test/agent-host-usage.test.mjs`（`thincoder-desktop/test/agent-host.test.mjs` 落 **299**）；清单**三十五档**同步 = `thincoder-desktop/test/files.mjs`（**批 B 末值**；R3 后 **44 档**——见 §4.1 用例模块行）。
**拆分落形（批 A）**：`thincoder-desktop/renderer/views/sessions.mjs` 实读 **292**（拆前——贴 300 层）+ 行控件两件入册 ⇒ 标签条面（`tabbarModel` / `tabbarTree` / `mountTabbar` 及其子构树 + 加速键面）拆 `thincoder-desktop/renderer/views/tabbar.mjs` ⇒ 本档落 **256** ∕ 新档 **200**（皆实读）；
同批 `thincoder-desktop/renderer/app.mjs` 会话族接线拆 `thincoder-desktop/renderer/mount-sessions.mjs` ⇒ 本档落 **222** ∕ 新档 **197**（皆实读）；
**拆分预案（批 7 在册 · 批 8 落形）**：`thincoder-desktop/renderer/app.mjs` 实读 **297**——批 7 池面接线落地后贴 300 层；批 8 叠加装配桥接线面（事件订阅 + 池面同刻接线）⇒ **预案触发**：池面接线拆 `thincoder-desktop/renderer/mount-pool.mjs`（实读 **36**）（沿批 6 `chat-*` 拆分先例）；
**拆分落形（批 9）**：设置面 / 向导接线再拆出 `thincoder-desktop/renderer/mount-settings.mjs`（实读 **458**——在册例外 / 预案见下行）⇒ `thincoder-desktop/renderer/app.mjs` **299**；
**在册例外（批 9 修正轮 #9 · 批 B 续期）**：`thincoder-desktop/renderer/mount-settings.mjs` 实读 **426**（批 B 末实读——>300）——**拆分落形（批 B · ⑥）** = 向导接线族拆 `thincoder-desktop/renderer/mount-onboarding.mjs`（本档 **88**）⇒ 本档落 **426**（仍 >300 ⇒ 例外续期；距 500 硬限 **74** 行）；**再拆预案** = 信息行接线族 + 读数供给族拆出（档名实施批定）；**消解窗口** = 该档下次被触碰的批；
**随动面** = `docs/desktop/design/SHELL.md` §1 树 + 测试档名硬编码面（U51 零 CJK 扫描清单——落 `thincoder-desktop/test/views-chrome.test.mjs` · U52 导出面锁——落 `thincoder-desktop/test/views-locks.test.mjs`）+ 本档 §4.1 行预算；
  **批 A 修正轮随动**（零语义）：`thincoder-desktop/renderer/styles.css:184` · `thincoder-desktop/renderer/views/sessions.mjs:18` / `:237` · `thincoder-desktop/test/views-tabbar.test.mjs:6`（⑤ 换 `tabindex` 后含 `inert` 的死注释收正）+ `thincoder-desktop/test/views-tabbar.test.mjs` 三面随标签条拆档**换靶**
  （`:15` 导入源 ⇒ `thincoder-desktop/renderer/views/tabbar.mjs` · `:235` 零字形扫描名单补 `tabbar.mjs` · `:325-328` 关闭确认面四禁扫描靶 ⇒ `tabbar.mjs`）。

**测试面三分落点**（对回上表用例模块行）：

- **自动**（本端单入口 `thincoder-desktop/test/run.mjs`）：`host-floor` 启动下限自检 T-DSK15 · `guard-closure` 渲染面静态闭包守卫 T-DSK16 · `session-contract` 会话族与跨端接续 T-DSK3 / T-DSK12 · `store` 状态树与增量渲染 T-DSK17–T-DSK20 · `views` 左列三态与词表（T-DSK1 / T-DSK2 / T-DSK3 的渲染面 + 中区外壳结构面 T-DSK20 / T-DSK3 标签条语义行——U45–U52）。
  - 批 6 补两档：`views-chat` 对话流三态与工具卡（U58–U62）· `views-chat-scroll` 滚动面三事纯函数（U63–U67）。
  - 批 7 补两档：`views-approval` 审批卡面两形与降级（U68–U70）· `views-activity` 池面三态与折叠两读数（U72–U73）；`views-chat` / `store` / `host-floor` 三档**原址补例**（U75 / U74）；实施期拆档两档：`views-chat-frame`（U71 帧面自 `views-chat`）· `views-locks`（U52 零回归面自 `views-chrome`）。
  - 批 8 补**五档**：`agent-host` 主侧面（装配 / 桥九映射 / 挂起表 / 回合驱动——U76–U86）· `events-reduce` 归约面与值面写者（U87–U89）· `events-page` 页回执与订阅面（U90–U92）· `history-page` 页转口与元（U93–U94）· `session-io` 槽装载与回合尾落盘（U96–U97）；`host-floor` 原址补例（U74 计数随动 10 → 13 · U95 显形）。
  - 批 9 补**六档**：`settings`（设置族——U98–U102）· `providers`（渠道族——U103–U107（含 U107b））· `mcp-servers`（MCP 族——U108–U110）· `project-info`（项目级信息族——U111–U113）；视图两档 `views-settings` / `views-onboarding` **零 U 号**（档名面入 U51 零 CJK 扫描清单——落 `thincoder-desktop/test/views-chrome.test.mjs`）。
    - **U95 臂（`host-floor`）口径**：判据 `≤300` **含线上**（实读 **284**）——依据 = 规则线本身（「无文件 >300 行」），非余量口径；
      **覆盖面** = `fresh` 清单十八档（批 8 十二 + 批 9 六用例档）+ 在册例外面（`mount-settings.mjs`）+ `renderer/app.mjs` + 宿主档源面零 `electron`；
      批 9 其余新档（主进程四源档 · `settings.css` · 视图三档 · `views-harness.mjs`）行数面 = §4.1 值列表（臂清单随动 = 码面池）；
      批 A 新档七档（`thincoder-desktop/renderer/views/{tabbar,question,plan}.mjs` · `thincoder-desktop/renderer/mount-composer.mjs` · `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮） ·
      `thincoder-desktop/test/{views-question,views-tabbar-close}.test.mjs`）行数面 = 同路（§4.1 值列表 / 臂清单随动 = 码面池）。
    - **`fresh` 清单口径**：`host-floor` 的 `fresh` 清单只收目录文件名读数——**越层档不入清单**（`mount-settings.mjs` **426** 不入）；批 9 六档补入 = 码面池（父侧臂清单随动项）。
    - **覆盖缺口两件（登记）**：① 设置面 **Esc 键**明示不覆盖（零 Esc 绑定 = 裁定项——`docs/desktop/design/UI.md` §1 设置面行）；② `settings:agent` **保存出口判据**挂 T-DSK7 / T-DSK8（§7 批 9 注）——真面缺口（保存出口端侧路径判据未单列）已登记。
  - 批 A 拆档一档 + 增档一档：`thincoder-desktop/test/views-tabbar-close.test.mjs`（确认面族 U55 自 `views-tabbar` 拆出）· `thincoder-desktop/test/views-question.test.mjs`（U 号面 = §7 批 A 注）；`views-tabbar` 原址**改例**（⑤ 换机制——既有 `inert` 断言件改「两控件 `tabindex` 两态」+ 点按两向——T-DSK20 / T-DSK25）；
    **T-DSK26（关标签页随动）= 第 ⑥ 件机检面** = `thincoder-desktop/test/views-tabbar-close.test.mjs`（页随动**五例**：关活动 ⇒ 邻位页 ∕ 关唯一 ⇒ 关页 `none` 态（零块节点 + 引导节点 `data-guide="no-session"`）∕ 关非活动 ⇒ 零动作 ∕ 待确认按取消 ⇒ 零动作 ∕ 已关会话迟到回执零写）+ `thincoder-desktop/test/views-locks.test.mjs` 原址补例（关闭尾接线锚 ⇒ 值列实施后回填）。
  - 中区外壳面读作 **静态树面 + 常量驻留**（常量机检折进 U48）；运行时横滚 / 渐隐 / **标签点按切换与加速键**归人工走查。
- **自动 · 项目面**：`projects` = T-DSK1 / T-DSK2（核 `_setSessionsDirForTest` 指临时目录 + 手写 `<40hex>.json` 族——零新核缝）。
- **CI 冒烟**：产物与启动 = T-DSK14（矩阵见 §4.2 / §5）。
- **人工交互面**（人工走查）：键位 / 焦点 / 拖拽类 = T-DSK21（含本批卡面「同 `prompt-id` 重挂不夺焦」幂等条）；实机交互类（宿主内实跑 + 真实后端回路）= T-DSK4 / T-DSK5 / T-DSK6 / T-DSK7 / T-DSK8 / T-DSK9 / T-DSK10 / T-DSK11 / T-DSK13。

### 4.2 现有文件改动（实施批）

| 文件 | 改动 | 归属 |
|---|---|---|
| `PROJECT-MANIFEST.json` | `checkConfig` 域内：`docRoot` 扩 `docs/desktop/{requirements,design}`（实读现状 `PROJECT-MANIFEST.json:22-24` 仅 `docs` 一域） | **父侧**（写门专权——批次档 §1.3 已裁定） |
| `.github/workflows/test.yml` | 新增三平台矩阵（win / mac / linux）+ 本端测试 job（需求档 §8 P4：现仅 ubuntu） | 实施批 |
| `docs/core/design/DOC-SYSTEM.md` | 三部分 → 四部分（本批已落） | 本批 |
| `docs/core/design/ARCHITECTURE.md` | 补第四端（本批已落） | 本批 |
| `thincoder-core/session-slot-write.mjs` | 增 `setSlotPrefs(cwd, slot, patch)`（沿 `setSlotAutoApprove:140` 同形 · 复用 `writeFlag:131`）+ `resolveEffortPatch(level, model)` 纯函数（档位归一——含 off 族）· `newSlotData:46` 产 `effort: null` | **本批**（授权 = 批次档 §1.2） |
| `thincoder-core/session.mjs` | `saveSession` 字段表携 `effort`（实读 `:120-138` 现表无该键——缺之 ⇒ 下一次保存整对象抹除） | **本批**（同上） |
| `thincoder-core/session-lifecycle.mjs` | `applySession:81`（档位支 `:176-:190`）在模型合并支之后应用 `data.effort`（`null` / 缺键 ⇒ 不动）——施加面唯一 | **本批**（同上） |
| `docs/core/design/SESSION.md` | 增 §6.21（核面单源——判据句 1–5 + 立/破表 + 验收回指 + 不做 + 端侧契约指针）；收口轮随动：写面坐标按实读重指 + 施加面口径收正（含 VSC 自有面） | **本批**（已落） |
| `docs/desktop/design/IPC.md` | 批 B 契约落定（`ev:usage` · `session:prefs` · 会话级偏好注 · 附件注 · 白名单 **27** · `model:list` 补 `effortEnum` / `thinkOff` 元素投影 · 需求侧行 `D1–D16`） | **本批**（已落） |
| `docs/desktop/design/UI.md` | 批 B 形态落定（§1 存量行内「（批 B 落）」标注 + §1 批 B 注**五项**——行数不变）+ **批 B 追加注**（首启引导四项——追加轮） | **本批**（已落） |
| `docs/desktop/design/SHELL.md` | 批 B 形态与收口轮随动（§1 树补五新行 + 值收正（`events-subscribe` / `mount-settings` / `mount-composer`）· `views/` 行补两档 · 十通道口径） | **本批**（已落） |
| `docs/desktop/design/RENDERER.md` | 批 B 形态落定（§1 单状态树行补 `usage` 切片 · §1.1 事件归约面条补 `ev:usage` 归约——KD-20 指针）+ **批 B 追加轮**（§1.1 引导节点条 + 关标签页随动条收正） | **本批**（已落） |
| `docs/desktop/design/E2E-TESTING.md` | 批 B 追加轮落定（§3.5 T-DSK32 十二序 + §4 新档行 + §6 用例行 + §7 按批限定） | **本批**（已落） |
| `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 主表行 13 `session-slot-write.mjs` 读数收正 **168 → 222**（批 B 核面增量入账——口径 = 内容行数） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 批 B 全程随动（§4.1 行预算按末实读回填 · 越层表重写 · §6.1 / §7 用例面 · §9 落形指针；明细 = 批次档 §2）+ **批 B 追加轮**（首启引导：§4.1 值列 / 新档两行 + 集成行 · §6.1 D11 / D14 · §7 T-DSK32 · §8 · §9 · §10 Z） | **本批**（已落） |
| `docs/README.md` | 地图补第四部分行 + 各「三部分」口径改四（**本批不动**——报告面上报，§10） | 父侧 |
| `docs/desktop/design/UI.md` | 本批形态落定（§1 七处「可见面修复批修」指针 + **本批注**五项：输入区样式 / 用户块出泡 / 游标清点 / 文本段逐处形 / 信息行复读） | **本批**（已落） |
| `docs/desktop/design/RENDERER.md` | 本批工艺落定（§1.1 三条：用户块 · 游标清点 · 文本段行形态通则） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§2 KD-23 / KD-24 · §4.1 值列九行 + 越层段 · §4.2 三行 · §6.1 D3 / D10 · §7 T-DSK22 · §10 AB / AC / AD） | **本批**（已落） |
| `docs/render-core/design/RENDER-CORE.md`（新档） | 核落点 / 加载形 / 边界 / 逐模块判定表（51 档）/ 逐机制对位表（22 行）/ 分期 R1–R3c（本批主交付） | **本批**（已落） |
| `docs/desktop/design/UI.md` | 对齐重定位四项（状态行 15 段裁定表 · 右列 = 子 agent 面 · 会话流经核（含「零 Markdown」改判）· 元数据族）——§1「本批注（对齐重定位）」 | **本批**（已落） |
| `docs/desktop/design/IPC.md` | `ev:reasoning` / `ev:subagent` 两通道 + `ev:usage` 载荷扩（`tokens?` / `timers?`）+ `subagent:stop`（白名单 27 ⇒ 28） | **本批**（已落） |
| `thincoder-render-core/**`（拟新增） | 共享渲染核包（落点 / 加载形 / 边界 = `docs/render-core/design/RENDER-CORE.md`）；两端接入面 = `thincoder-vscode/package.json` + `.vscodeignore` + `scripts/check-vsix.mjs` ∥ `thincoder-desktop/package.json` + `src/main/protocol.mjs` + `test/guard-closure.test.mjs` + `scripts/check-dist.mjs`；逐档「现行 ⇒ 预期」= 核档 §6 | 实施批 R1–R3（核档 §8） |
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
| `thincoder-desktop/renderer/views/chat-stream.mjs` · `views/chat-tool.mjs` | **77 ⇒ 77**（流式外壳留存——未接核 rAF 缝合件）· **135 ⇒ 138**（工具结果面经核 `capText`；卡壳四段头 / 折叠 / 耗时 / 改动摘要留存；`formatToolSummary` / `isToolFailure` 不消费——非缺口） | R3c |
| `thincoder-desktop/renderer/views/chat-text.mjs`（新） | — ⇒ **70**（文本面经核 `md` + 推理块壳〔核件结构同形〕+ 帧尾就地更新〔核 `paintStreamTarget`〕） | R3c |
| `thincoder-desktop/renderer/views/chat-cards.mjs`（新） | — ⇒ **51**（卡构树拆出——在册拆档预案落形） | R3c |
| `thincoder-desktop/renderer/views/sessions.mjs` | **256 ⇒ 286**（行元数据族三值——provider / N msgs / updated；贴 300 预警不变） | R3c |
| `thincoder-desktop/renderer/mount-*.mjs` 族 | 随动挂载（右列）：`mount-pool.mjs` **36 ⇒ 57**（停止出口 `stopSubagent` + `POOL_KEYS` 两键）——结构不变 | R3b |
| `thincoder-desktop/renderer/core.css`（新） | — ⇒ **140**（核类名 → 桌面变量映射——md 产出 / 推理块 / 复制钮三族 + `task-check`；映射不并入存量 `styles.css` / `chat.css`） | R3c |
| `thincoder-desktop/renderer/styles.css`（本批随动） | **340 ⇒ 374**（R3a 段面 / 警示色两 class + `--warn`；R3c 随动——R3a 末实读 356） | R3a / R3c |
| `thincoder-desktop/test/**` | guard 前缀白名单（`/rc/`）（R1）+ 新用例族（状态行 / 右列 / 会话流 / 元数据；R3——D20 面含**出生自愈直测**；自铸用例号 **U154 起**（U152 / U153 已被占用——在册；U50 随族档迁宿主）+ E2E 用例号 **T-DSK37**） | R1 / R3 |
| `thincoder-desktop/renderer/core.css` | **140 ⇒ ~240**（D21 内容面视觉收正——逐面映射表 = `docs/render-core/design/RENDER-CORE.md` §5；本批首要缺口 = `tk-*` 高亮 9 规则现零 ⇒ 高亮不可见） | **本批（D21）** |
| `thincoder-desktop/renderer/styles.css` | **374 ⇒ ~420**（D21 主题表 +14 变量〔亮暗两套〕· 左列会话行 9 面收正——会话面板映射表 = `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2；越 300 在册——拆档窗口 = §10 **AL**） | **本批（D21）** |
| `thincoder-desktop/test/views-locks.test.mjs` | **190 ⇒ ~210**（D21 值落点锁原址补例——新增变量两模式齐备 · `tk-*` 9 规则在场 · 关键值串；补例量自估 ≤ ±20；沿 §7 D21 注「测试档随修随加——不占设计条目」既裁） | **本批（D21）** |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | **146 ⇒ ~160**（D21 真机读数原址补例——真 Electron `getComputedStyle` 四值：代码块底 / 行内码底 / 表头底 / 关键词色；补例量自估 ≤ ±15） | **本批（D21）** |
| `docs/render-core/design/RENDER-CORE.md` | §5 样式契约句收正（内容面视觉对齐 VSC）+ 视觉映射口径三律 + 主题表新增变量 **12** + 逐面映射表 **21 面**；§9 增 D21 端差两项 + 会话面板端差一项 + 不追面核心四条（全清单七条 = `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2） | **本批（已落）** |
| `docs/desktop/design/UI.md` | §1 增**本批注（D21 · 视觉对齐）两项**（内容面值表指针 · 会话面板映射表 **9 面** + 不追面七条）+ 对话流 / 左列会话行两行行内指针 + 档头 `D1–D21` | **本批（已落）** |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§2 **KD-29** · §4.1 `styles.css` 值列 + 越层段 · §4.2 五行 · §6.1 **D21 行** + 表头 · §7 **D21 注** · §9 · §10 **AL–AN**） | **本批（已落）** |
| `thincoder-core/session-lifecycle.mjs` | **352 ⇒ ≈386**（新出口 `sessionReading`——打开态读数；尾部追加 · 500 硬线内） | **本批（残余批）** |
| `thincoder-core/session.mjs` | **254 ⇒ 255**（`sessionReading` re-export 一行随动） | **本批（残余批）** |
| `thincoder-desktop/src/main/session-slots.mjs` | **154 ⇒ ≈195**（`pageHistory` 出 `seed` + `openingSeed` 投影；**实施后实读 180**） | **本批（残余批）** |
| `thincoder-desktop/renderer/events.mjs` | **500 ⇒ ≈470**（**在册拆分预案执行**——问题 / 任务切片拆出 `questions.mjs` + `badgeStamps` 随迁 `badges.mjs`；首屏播种支 +14；**拆后处置 = ≈470 仍越 300 ⇒ 续期 + 新预案**〔页读径拆出——见 §4.1 越层段〕） | **本批（残余批）** |
| `thincoder-desktop/renderer/questions.mjs`（拟新增） | — ⇒ **≈45**（`QUESTION_KEYS` / `onQuestion` / `onTask` / `clearQuestion`——events 原址 re-export 保名面） | **本批（残余批）** |
| `thincoder-desktop/renderer/badges.mjs`（拟新增） | — ⇒ **≈20**（`BADGES` / `badgeStamps`——events / questions 共用单一实现） | **本批（残余批）** |
| `thincoder-desktop/renderer/views/chat-text.mjs` | **70 ⇒ ≈82**（`textFace` 深度分流——`user` ⇒ `mdInline`；`assistant` / `reasoning` / `error` ⇒ `md`） | **本批（残余批）** |
| `thincoder-core/test/session-reading.test.mjs`（拟新增） | — ⇒ **≈90**（同源对拍 / 老槽回退 / 边界三组） | **本批（残余批）** |
| `thincoder-desktop/test/history-page.test.mjs` | **105 ⇒ ≈150**（seed 三例：`tasks` 直取 / `usage` 有效门 / 回填不携） | **本批（残余批）** |
| `thincoder-desktop/test/events-page.test.mjs` | **172 ⇒ ≈200**（首屏播种例：写入 / 缺席零写） | **本批（残余批）** |
| `thincoder-desktop/test/views-chat-text.test.mjs` | **139 ⇒ ≈160**（`user` ∥ `assistant` 深度对拍——纯构树） | **本批（残余批）** |
| `thincoder-desktop/test/integration/session-open.test.mjs`（拟新增 · 集成域） | — ⇒ **≈120**（**T-DSK38**——探针式真 Electron：resume 后 `tasks` / `context` 段在场 + md 深度断言） | **本批（残余批）** |
| `thincoder-desktop/test/files.mjs` | **21 ⇒ 22**（新集成档登记） | **本批（残余批）** |
| `docs/core/design/SESSION.md` | 增 §6.24（`sessionReading` 契约——打开态读数判据句 + 验收回指）+ §5 指针 + §7 **D-SE61** | **本批**（已落） |
| `docs/desktop/design/IPC.md` | §2 `history:page` 行 + **「打开态播种注」**（新——`seed` 形态 / 缺席降级单源） | **本批**（已落） |
| `docs/desktop/design/UI.md` | §1 增**本批注（D17 / D19 · 残余补齐）两项** + 状态栏 / 对话流两行行内指针 | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§4.2 本批行 · §7 **T-DSK38** 行 + 残余批注 · §10 **AP–AR** 三行） | **本批**（已落） |
| `thincoder-desktop/renderer/views/statusline.mjs` | **256 ⇒ 269**（实读 2026-09-28——banner 四段 + 状态词两态 + 输入提示三态 + 段闭集 12 ⇒ **16**；越 300 建议线解除：banner 段组已拆出〔下行〕） | **本批（状态栏对齐）** |
| `thincoder-desktop/renderer/views/statusline-banner.mjs`（新） | — ⇒ **25**（实读 2026-09-28——`BANNER_CODES` + `bannerSegments`；拆后两档皆 ≤300） | **本批（状态栏对齐）· 拆档落形** |
| `thincoder-desktop/renderer/views/chrome.mjs` · `thincoder-desktop/renderer/i18n.mjs` · `thincoder-desktop/renderer/events.mjs` · `thincoder-desktop/renderer/mount-status.mjs` · `thincoder-desktop/renderer/mount-pool.mjs` · `thincoder-desktop/renderer/store.mjs` | chrome **163 ⇒ 164**（会话头回三值——`FIELD_ORDER` 撤两键）· i18n **407 ⇒ 423**（词键 +6〔两语同形〕——两座后合计；实读 2026-09-28）· events **473 ⇒ 494**（`META_FIELDS` 三键 + `flags` 切片写 + `applyFlags` 纯动作导出〔页读 / 出站回执两径同点——桌内翻转即时刷新面〕）· mount-status **24 ⇒ 26**（`STATUS_KEYS` 增键）· mount-pool **57 ⇒ 60**（`submitVerdict` 成功径以回执写 `flags` 切片）· store **328 ⇒ 333**（`sessionFlags` 初形；账本槽位同笔） | **本批（状态栏对齐）** |
| `thincoder-desktop/src/main/ipc.mjs` · `thincoder-desktop/src/main/agent-host.mjs` · `thincoder-desktop/src/main/session-slots.mjs` | ipc **214 ⇒ 221**（`history:page` 转口叠加 `flags`——`approval:respond` 回执直传零改）· agent-host **300 ⇒ 254**（拆分已落——`flagsOf(key)` 活值投影 + `respond` 回执叠加 `{ key, flags }`）· session-slots **180 ⇒ 195**（`slotMeta` 三值收正 + 两座合计增量——实读 2026-09-28） | **本批（状态栏对齐）** |
| `thincoder-desktop/src/main/agent-assemble.mjs`（新） | — ⇒ **95**（实读 2026-09-28——装配面逐字搬运；原路径同名 re-export 保名面） | **本批（状态栏对齐）· 拆档落形** |
| `thincoder-desktop/test/**` | 随动（`views-statusline` **298** / `views-chrome` **283** / `views-chrome-vocab`〔计数 139 ⇒ 145；账本批再 +1 键 ⇒ **320**〕/ `views-head` **299** / `history-page` **172** / `session-contract` **319** / `agent-host` **338**〔`respond` 回执两向〕/ `events-page` **252**〔`submitVerdict` 写切片两向〕/ `events-reduce` **312** / `host-floor` **303** 原址补例 + 集成新档 `thincoder-desktop/test/integration/statusline-align.test.mjs` **142**（**T-DSK39**））+ `thincoder-desktop/test/files.mjs` **22 ⇒ 22**（新档名打包入既有行——净 0）；测试档随修随加——不占设计条目（沿 §7 D21 注既裁） | **本批（状态栏对齐）** |
| `docs/desktop/design/UI.md` · `docs/desktop/design/IPC.md` | UI.md §1 增**本批注（状态栏对齐 · 屏面为准）** + 15 段表就地收正 + 会话头 / 状态栏两行指针；IPC.md §2 `history:page` 行补 `flags` + `meta` 三值收正 + 增**「模式位投影注」** | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） · `docs/desktop/design/E2E-TESTING.md` | 本档随动（§2 **KD-25 收正 + KD-30** · §6.1 **D22 行** + 表头 · §7 **T-DSK39** · §10 **AS / AT**）；E2E-TESTING.md §4 / §6 补 `statusline-align` 用例行 | **本批**（已落） |
| `thincoder-desktop/src/main/sessions.mjs` | **37 ⇒ 45**（实读 2026-09-28——回执增 `ledger` 投影；异常才携；经端壳转口引核 `ledgerHealth`，零算法副本） | **本批（账本警示面）** |
| `thincoder-desktop/src/main/session-slots.mjs` | **180 ⇒ 195**（两座合计——状态栏 wiring `slotFlags` + 本座核出口 `ledgerHealth` 转口一行；实读 2026-09-28） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/views/sessions.mjs` | **286 ⇒ 301**（实读 2026-09-28——账本注记节点 + `railModel` 增 `ledger` 字段 + 条件附句合成；会话区末位；**越 300 顾问线** ⇒ 预案 = 注记构树外提〔档名实施批定〕） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/app.mjs` | **253 ⇒ 254**（实读 2026-09-28——`RAIL_KEYS` 增 `ledger`；切片变即重挂） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/styles.css` | **462 ⇒ 466**（实读 2026-09-28——`.rail-ledger-notice` 单规则；`color: var(--fg-muted)` dim 观感） | **本批（账本警示面）** |
| `thincoder-desktop/renderer/i18n.mjs` | **407 ⇒ 423**（两座合计；本座 = 键 `rail.ledger.notice` 两语各一行；实读 2026-09-28——键增协调 = §10 **AW** 收口依据） | **本批（账本警示面）** |
| `thincoder-desktop/test/session-contract.test.mjs` | **291 ⇒ 319**（实读 2026-09-28——原址补例：回执 `ledger` 两向〔现场档 ⇒ 在场 ∧ 正常 ⇒ 缺席〕；**新越层档** ⇒ 已登记 + 预案 = 注记用例拆出〔档名实施批定〕） | **本批（账本警示面）** |
| `thincoder-desktop/test/views.test.mjs` | **217 ⇒ 242**（实读 2026-09-28——原址补例：注记构树三例：在场〔含 `empty` 态〕/ 缺席零节点 / 非可点） | **本批（账本警示面）** |
| `thincoder-desktop/test/integration/ledger-notice.test.mjs`（集成域） | — ⇒ **121**（实读 2026-09-28——**T-DSK40**：真 Electron 账本警示面；损坏现场档夹具 ⇒ 注记在场 + PNG） | **本批（账本警示面）** |
| `thincoder-desktop/test/files.mjs` | **22 ⇒ 22**（新集成档名打包入既有行——净 0） | **本批（账本警示面）** |
| 随动四档（表外披露——落而必报） | `thincoder-desktop/renderer/mount-sessions.mjs` **197**（净 0——`refreshRail` 同行加 `ledger` 写）· `thincoder-desktop/test/views-chrome-vocab.test.mjs` **320**（+4——键数门 145 ⇒ 146 + 注记树入消费面）· `thincoder-desktop/renderer/store.mjs` **333**（+2——`ledger` 槽位注册）· `thincoder-desktop/test/store.test.mjs` **339**（+2——初态定形锁同拍） | **本批（账本警示面）** |
| `docs/desktop/design/IPC.md` · `docs/desktop/design/UI.md` · `docs/desktop/design/E2E-TESTING.md` · `docs/desktop/design/PROJECT.md`（本档） | 四档落点（回执 / 渲染 / 用例 / 行数账——明细 = `docs/batches/2026-09-28-ledger-reliability.md` §2 微轮块） | **本批**（已落） |
| `thincoder-desktop/renderer/styles.css` | **463 ⇒ ≈481**（容器 4（:93-102）· 骨架线 3 处（:111-117 / :128-132 / :349-357）· 控件族（:296-306 / :395-405 / :407-415 / :418-425 / :435-441）· 活动标签（:368 就地改 + 1 新行）· `.rail-control` hover 收齐（:199-202）· 滚动条 4 规则 + 交互态组（新增 · 全局段）；越 300 在册——拆档窗口 = §10 **AL**） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/chat.css` | **300 ⇒ ≈310**（`.composer` 顶线（:261-268）· 回填 / 药丸（:97-104 / :106-118）· 三控件（:282-291）· hover 收齐（:119-123 / :293-298）· 交互态组（新增）；**超 300 建议线**（< 500 硬限）⇒ 预案 = 新立 `thincoder-desktop/renderer/chrome-denoise.css`（拟新增 · 排末 · 零搬移 · 本批不落）） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/pool.css` | **78 ⇒ ≈84**（`.pool-toggle`（:28-45）· `.pool-item`（:57-65）+ 交互态组） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/renderer/settings.css` | **273 ⇒ ≈289**（面头线（:44-51）· 键 8（:60-86）· 警示面（:105-117）· 行（:141-157）· 强调标（:159-165）· 表单（:173-180）+ 升底 / 活动态 / 交互态组——设置面映射 9 面） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/test/views-locks.test.mjs` | **280 ⇒ ≈320**（D24 值落点锁原址补例——四族归零 ∧ 四值族 ∧ 滚动条 4 规则 ∧ 设置面映射 ∧ 保留面负向锁 ∧ 零新变量；测试档随修随加——不占设计条目〔2026-09-27 裁定〕） | **本批（外壳视觉降噪）** |
| `thincoder-desktop/test/integration/chat-render.test.mjs` | **176 ⇒ ≈212**（真机读数原址补例——静息四边透明 ∧ 1px 保位 ∥ hover 底非透明 ∥ `:focus-visible` outline 2px ∥ 活动标签底 ∥ 滚动条占宽 10 ∥ `.composer-input` 保留面） | **本批（外壳视觉降噪）** |
| `docs/desktop/design/UI.md` | 外壳视觉降噪批落定（§1 增「本批注（外壳视觉降噪 · D24）」九项 + 标签条 / 会话头 / 输入区 / 设置面 / 主题五行行内指针 + 档头需求侧行 **D1–D23 ⇒ D1–D24** + 变更记录一行） | **本批**（已落） |
| `docs/desktop/design/PROJECT.md`（本档） | 本批随动（§4.1 触碰段 + §4.2 本批行 · §6.1 **D24 行** + 表头 · §10 **AX** 行 + **AN** 行随收 · 变更记录一行） | **本批**（已落） |

**本批（对齐第二批 · 六件）行「现行 ⇒ 预期」**（实读 2026-09-28——内容行数口径；机制 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」；核面 = `docs/render-core/design/RENDER-CORE.md`）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-desktop/src/main/agent-bridge.mjs` | **174 ⇒ ≈205**（`ev:subchunk` 四面分流——text / think / 工具调用行 / 工具输出行 ⇒ 出站；构造面同形 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:172-191`） | **本批** |
| `thincoder-desktop/renderer/events.mjs` | **473 ⇒ 硬限 500 顶格 ⇒ 在册拆分预案本批执行**——页读径（`applyPage` / `blockOfMessage` / `seedPatch` / `metaOf`）拆 `thincoder-desktop/renderer/page-read.mjs`（拟新增 · ≈120）⇒ 拆后 ≈415（仍越 300 ⇒ 续期 + 新预案 = 子 agent 归约径拆 `renderer/subagent-reduce.mjs`）；本批增量 = `ev:subchunk` 归约（`rows`）+ 归档入流（`region` + `blocks` 尾追）− `archiveFrozen` | **本批** |
| `thincoder-desktop/renderer/store.mjs` | **331 ⇒ ≈300**（`pending` 切片 + 三动作带键 + 满队按键判；在册预案 = 队列面拆 `thincoder-desktop/renderer/queue.mjs`（拟新增 · ≈45）——**本批执行**） | **本批** |
| `thincoder-desktop/renderer/mount-composer.mjs` | **362 ⇒ ≈380**（带键入队 / flush 携键 / 出泡携 `ts`；越 300 在册——预案 = 发送面拆 `thincoder-desktop/renderer/composer-send.mjs`（拟新增 · ≈110）——拆档 = 结构改动，归父侧裁〔沿 §10 **AD** 先例〕） | **本批** |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **69 ⇒ ≈75**（回合尾窄口携 `key`——`onTurnTail(key)`） | **本批** |
| `thincoder-desktop/renderer/views/chat.mjs` | **280 ⇒ ≈310**（尾组槽 + 标签后处理 + `subagent` 块引调；越 300 建议线 ⇒ 预案 = 帧尾态刷拆 `thincoder-desktop/renderer/views/chat-chrome.mjs`（拟新增 · ≈60）） | **本批** |
| `thincoder-desktop/renderer/views/activity.mjs` | **248 ⇒ ≈300**（键控差分 + 核件直消费 + 停止钮读锚；预案 = 核件挂载面拆出——超线则执行 · 档名实施批定） | **本批** |
| `thincoder-desktop/renderer/views/chat-text.mjs` | **73 ⇒ ≈95**（推理画笔分流 `paintReasoningTarget` + 用户块 `.msg-label` 容器 + 标签后处理） | **本批** |
| `thincoder-desktop/renderer/views/statusline.mjs` | **269 ⇒ ≈272**（段 14 源改**本会话队**——`pending[<会话键>]`） | **本批** |
| `thincoder-desktop/renderer/i18n.mjs` | **423 ⇒ ≈470**（核件词键 +~12 × 2 语 + `setStrings` 单点接线；越 300 在册——预案续期〔词族按视图面拆第二档〕） | **本批** |
| `thincoder-desktop/renderer/app.mjs` | **254 ⇒ ≈257**（`CHAT_KEYS` 增 `pending`） | **本批** |
| `thincoder-desktop/renderer/mount-pool.mjs` | **60 ⇒ ≈75**（⏹ 点击委托 ⇒ `subagent:stop`） | **本批** |
| `thincoder-desktop/renderer/chat.css` | **299 ⇒ ≈325**（待发送气泡 + `.msg-label` / `.msg-time`（值源 = `thincoder-vscode/webview/chat.css:3-18`）+ `.block-subagent` 透传壳；超 300 建议线 ⇒ 在册预案续期〔`chrome-denoise.css`〕） | **本批** |
| `thincoder-desktop/renderer/core.css` | **259 ⇒ ≈300**（核类名映射 `advisor-block` / `sub-*` 族——值源 = `thincoder-vscode/webview/chat.css:298-374` / `:328-371`） | **本批** |
| `thincoder-desktop/renderer/styles.css` | **466 ⇒ ≈468**（`--pool-w: 18rem ⇒ 36rem` 一行 + 注释；越 300 在册——拆档窗口 = §10 **AL**） | **本批** |
| 新档 **2** | `thincoder-desktop/renderer/views/chat-pending.mjs`（拟新增 · ≈60——尾组构树）· `thincoder-desktop/renderer/views/chat-subagent.mjs`（拟新增 · ≈70——归档块构树） | **本批** |
| 测试面 | 原址补例：`store` / `views` / `views-chat` / `views-chat-text` / `views-activity` / `views-chrome` / `views-statusline` / `views-locks` / `agent-bridge-subagent` / `events-subagent` / `events-reduce`；真机读数 = 集成域现有档原址补例（D16 义务）——测试档随修随加（2026-09-27 裁定） | **本批** |
| `docs/desktop/design/{UI,PROJECT,IPC,RENDERER}.md` + `docs/render-core/design/RENDER-CORE.md` | 本批设计落定（UI 本批注六件 · 本档 KD / §4.2 / §6.1 / §10 · IPC `ev:subchunk` · RENDERER 块六型与尾组 · 核档 §4 / §5 / §9 / §10） | **本批**（已落） |

## 5. 三平台打包链与发行面（需求档 D12）

| 项 | 形态 |
|---|---|
| 工具 | `electron-builder`（构建期 devDep）；声明面 = `thincoder-desktop/electron-builder.yml`（拟新增） |
| 目标 | **Windows**（NSIS 安装器 + 免安装 zip）· **macOS**（dmg + zip，签名 / 公证留发布前置）· **Linux**（AppImage + deb） |
| script 三条（单源 · 本行） | `test` = `node test/run.mjs`；`package` = 调打包器；`postpackage` = `node scripts/check-dist.mjs`（产物校验）——分发走发布计划（`docs/RELEASE.md`，桌面端首版须在该档登记发布单元），非 script 名 |
| 验证面（三层） | ① **产物存在性**：校验脚本断言安装包 / 免安装包齐备且体积合理；② **产物可启**：CI 内自解包 + 冒烟启动（win / linux 可实跑；mac 以 CI 为准）；③ **三端共享契约零回归**：与另两端互读互写同一份配置与会话（需求档 A2） |
| CI | `.github/workflows/test.yml` 增平台矩阵（需求档 A3：本机 Windows 实跑，另两平台以 CI 为验证面） |
| 版本与升级 | 版本号 = CalVer（三端同制，`docs/RELEASE.md` §4）；升级路径首版 = 手动下载覆盖安装，自动更新**不列入本轮**（§8 边界） |

## 6. 验收判据回指需求

### 6.1 功能点 D1–D24

| 需求 | 机检判据（点回需求 §4） | 验证面 |
|---|---|---|
| D1 | 打开目录后按 cwd 哈希取会话路径（点名「同一状态文件」= `sessions/<sha1>.json`，核 `sessionPath`）；重启后最近目录列表仍在（读面 = 槽面回读、零新存储——`docs/desktop/design/IPC.md` §2 项目面注 · `docs/desktop/design/PROJECT.md` §2 KD-9） | T-DSK1 / T-DSK2 |
| D2 | 新建 / 列表 / 切换 / 删除 / 重命名 / 接续六操作各有往返读数；跨端接续 = 与另两端读写同一 sessions 目录（A2）；列表条目 `createdBy` 读面 = 会话行来源端标注（缺键 ⇒ 不标注——`docs/desktop/design/UI.md` §2 项 3） | T-DSK3 / T-DSK12 / T-DSK20 |
| D3 | 发送后收到流式增量事件序列；中断后回合停止且历史保留；错误卡出现且含耗时；长会话渲染 / 回填 / 跟滚三面见 `docs/desktop/design/RENDERER.md` §2 / §3；批 A 落**输入区**（Enter 发送 / Shift+Enter 换行 · 忙态入队 · 回合尾 flush——`docs/desktop/design/UI.md` §1 输入区行）；**可见面修复批修（#458 / #459 / #457）**：用户消息块活流在场（受理即出——`docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 2）· 回合尾零流式游标（项 3）· 输入区样式落点与关键尺寸（项 1） | T-DSK4 / T-DSK17 / T-DSK18 / T-DSK19 / T-DSK22 |
| D4 | 子代理活动块 = 子 agent 实例（块头读数〔role / model / 用时 / 回合 N/M〕+ 状态词；**无工具位** · **不含内容**——D20 块形，单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2；状态词出自同档 §1 状态词行闭枚举，不得自造词）；advisor / consult / 队列 / 待审批四族各可呈现；批 A 落**队列写者**（忙态发送入队——写者 = `thincoder-desktop/renderer/store.mjs` 纯动作，条目 `{ title, status: "queued" }`）+ 满队提示（`QUEUE_MAX`） | T-DSK5 / T-DSK22 / T-DSK23 |
| D5 | 审批三出口（once / always / reject）+ 批审批三按钮皆通；AUTO 与工程模式状态随会话槽往返不丢 | T-DSK6 / T-DSK21 |
| D6 | provider → 模型两级选择生效；档位与 effort 菜单回执与槽值一致（批 9 落：`model:list` 候选集 = 核 `listModels` 投影 · `settings:agent` 写入后回读同值——主侧用例 `thincoder-desktop/test/settings.test.mjs`）；**批 B 落**：三值入槽（`session:prefs` ⇒ 槽往返不丢 · 改一处不波及他会话 · 在飞拒 `busy` 零写）+ 档位枚举化（设置面 `select` = 全局默认 ∥ 会话头 `select` = 会话级；候选 = `model:list` 逐模型元素投影（`effortEnum` + `thinkOff`——off 在场判据）+ `provider:list`；表外档位字面串 ⇒ 归一 `null`（未设）——KD-17 / KD-18 / KD-19）；**批 B · ⑥（档位控件设计修订轮）**：设置面现值 = `provider:list` 行投影 `effort`（离线）· 表外现值自成一选项 · `defaultModel` 缺 / 模型段空 ⇒ 控件零节点 · 写面 = 意图级载荷 `{ tier }`（`bad-level` / `unknown-provider` 两码零写）——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」 | T-DSK7 / T-DSK28 / T-DSK31 |
| D7 | provider 增删 + key 校验 + preset 三协议 + i18n 两语各往返（批 9 落：`provider:*` 四通道 + `config:write` 的 `locale` 键——用例 `thincoder-desktop/test/providers.test.mjs` / `settings.test.mjs` + `views-settings.test.mjs`） | T-DSK8 |
| D8 | 索引状态读数可达（**读数面 = 另批**——携核只读出口随核面批落；本端不直读核内表，同项登记 = `docs/desktop/design/IPC.md` §2 `memory:status` 行）；记忆 / 检索**只经 agent 工具面**（无 UI 搜索框） | T-DSK9 |
| D9 | MCP 服务器增删后工具入口状态随动（批 9 落：`mcp:*` 三通道 + 探活失败 ⇒ 零写盘——用例 `thincoder-desktop/test/mcp-servers.test.mjs`） | T-DSK10 |
| D10 | 台账行与批次相位读数出现（项目级信息，不随会话走——批 9 落：`ledger:read` / `batch:status` 载荷不携会话 `key`；用例 `thincoder-desktop/test/project-info.test.mjs` + `views-settings.test.mjs`）；**可见面修复批修（#461）**：开项目 ⇒ 信息行复读（触发点 = `openDir` 成功链——`docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 5） | T-DSK11 |
| D11 | 无 config 时向导可完成并进入主界面；有 config 时跳过向导（批 9 落：闸 = 配置档存在性（读数 = `config:read` 回执 `configured`）；入口 = 左列底行右端 `data-action="settings:open"`；用例 `thincoder-desktop/test/views-onboarding.test.mjs`） | T-DSK13 / T-DSK32 |
| D12 | 三平台产物存在 + 可启动冒烟过我（§5 三层验证面） | T-DSK14 / CI 矩阵 |
| D13 | 附件随 `msg:send` 载荷 `images` 维度发出一（贴图 / 粘贴 ⇒ 附件条在场 · 空 ⇒ 零节点）；非视觉模型 ⇒ 回执携 `degraded` 且提示行在场（不静默丢图）；代码块 / 末条复制 = 控件在场 + 取块文本逐字（真代码块面 = 随核落——`docs/render-core/design/RENDER-CORE.md` §4 行 11 / R3c） | T-DSK30 |
| D14 | 真 Electron 启停 + 交互驱动 + 固定落点截图（批 E2E 落 = T-DSK27；单入口 · 每用例隔离临时家 · devDep `playwright-core`——单源 = `docs/desktop/design/E2E-TESTING.md` §3.3 / §6） | T-DSK27 / T-DSK32 |
| **D15**（§3.1:52 · 需求 §3.5 项 7） | 状态栏上下文占用读数（活动会话 · 回合尾更新）：`ev:usage` 有效读数 ⇒ 读数节点在场；未至 / 非正数 ⇒ 零节点（禁假造）——KD-20 | T-DSK29 |
| **D16**（需求 §4 D16） | 两态引导在场（`no-project` ⇒ 含 `button[data-action="project:open"]` · `no-session` ⇒ 含 `button[data-action="session:create"]`）+ 控件在场 ⟺ 句柄在场（零假按钮）+ 空态分态（`none` ⇒ 零块节点 + 引导节点〔`data-guide`〕· `no-message` ⇒ 复用既有空态节点）——判据四值 = `chatModel.guide`；单源 = `docs/desktop/design/UI.md` §1 批 B 追加注；机检面 = `thincoder-desktop/test/views-chat-guide.test.mjs` + `thincoder-desktop/test/integration/first-run-smoke.test.mjs`（两档已落 · 2026-09-27 实读） | T-DSK32 |
| **D17**（需求 §4 D17） | 状态行对齐 CLI：**16 段逐项裁定表**在册（2026-09-28 屏面为准重审后——承载 16 / 旁置 1 / 不适用 1 行；零静默省略）；承载段逐段有节点判据与数据源（承载四项〔耗时 / 令牌 / 计时 / 回合 N/M〕**已落（R3a）**——读数槽四住 `thincoder-desktop/renderer/events.mjs`）；未至 / 非正 ⇒ 零节点（禁假造）——KD-25 / KD-30；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 + 「本批注（状态栏对齐 · 屏面为准）」 | T-DSK33 / T-DSK38 |
| **D18**（需求 §4 D18） | 会话面板对齐 VSC：元数据族**三值**（provider · N msgs · updated）逐项裁定在册（provider = 槽投影 `activeProvider` 补载——KD-28）；**多标签保留**（本端结构差异不削）；单源 = `docs/desktop/design/UI.md` §1 同注项 4 | T-DSK34 |
| **D19**（需求 §4 D19） | 宿主无关渲染核在册（逐模块判定表 51 档 + 落点 / 加载形）= `docs/render-core/design/RENDER-CORE.md` §1/§3；逐机制对位表 **22 行**在册（§4）；桌面经核呈现（Markdown / 代码块复制 / 工具卡族 / 推理块 / 帧容器 / 文件链接裁不承载——KD-RC-4 / 5）；VSC 接核零回归（C2）；判据 C1–C8 = 核档 §7；**「对齐第二批」扩充消费面**（推理钉底画笔 / 队列标记三导出 / 子 agent 块四件直消费——`setStrings` 接线；单源 = 核档 §5 消费面段） | T-DSK35 / T-DSK38 |
| **D20**（需求 §4 D20） | 右列 = 子 agent 面板：五类射程（sync / async / consult / escalate / advisor-async）块出场；块态机（出生 / 终态折叠 / **归档 = 入流**——「对齐第二批」项 5 收正）；停止出口（`subagent:stop` 往返 · ⏹ 为核件钮——点击委托）；数据链含**出生自愈**（宿主存活投影 2s 再断言——丢首发出生 ⇒ 一拍内复现）；**零工具调用行残留**（`pool` 切片零 tool 条目）——KD-26；单源 = `docs/desktop/design/UI.md` §1 同注项 2 + `docs/desktop/design/IPC.md` §1/§2 | T-DSK36 |
| **D21**（需求 §4 D21） | 会话流**内容面** + **会话面板**（桌面左列会话列表）视觉对齐 VSC：内容面 **21 面** / 会话面板面 **9 面** **逐面映射表在册**（VSC 实值带 `file:line` × 桌面落法——单源 = `docs/render-core/design/RENDER-CORE.md` §5 ∥ `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2）；**结构零动**（外壳 / 主题体系 / 左列 + 标签条结构不改）；端差 **3** 项在册（核档 §9）；值面落点 = `thincoder-desktop/renderer/core.css` + 主题表 `thincoder-desktop/renderer/styles.css`（新增变量 **14**）——KD-29 | T-DSK21 / T-DSK37（原址补例） |
| **D22**（需求 §4 D22） | 状态栏对齐（屏面为准 · 2026-09-28 走查裁定）：**16 段**逐项裁定表在册（banner 四态承载 / 会话头三值 / 静息词 / 输入提示段 / 键位尾逐件——单源 = `docs/desktop/design/UI.md` §1「本批注（状态栏对齐 · 屏面为准）」）；四项重审判据句在册；模式位供面 = `history:page` 回执 `flags`（单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」） | T-DSK39 |
| **D23**（需求 §4 D23） | 列表计数不撒谎：count 不可得 ⇒ **显示不可得**——桌面 = **段缺席**（既有 `Number.isFinite` 门零改——`thincoder-desktop/renderer/views/sessions.mjs`）∥ CLI / VSC / `read_history` = 「—」；设计面单源 = `docs/core/design/SESSION.md` §6.25 判据句 4（台账可靠批）；计数面本端零改（既有 `Number.isFinite` 门）；**账本异常警示面（账本可靠批 · 桌面微轮）** = 左列会话区末位 dim 注记（`data-ledger-notice` · 非可点；触发 = `refused > 0 ∨ scene`——单源 = `docs/desktop/design/UI.md` §1「本批注（账本警示面）」/ `docs/desktop/design/IPC.md` §2「会话族注」项 6） | T-DSK40 + 既有门（计数段缺席零改） |
| **D24**（需求 §4 D24） | 外壳视觉降噪（对照 mock 选定帧 02-chrome）：**静息描边归零四族**（容器 4 · 骨架线 4 处 · 控件族 11 选择器 · 池条目 1——保位式 `border-color: transparent` ⇒ 零几何位移）+ **交互态显形**（hover / 按下 / 聚焦 + 标签活动态 / 设置活动行）+ 滚动条皮肤 4 规则 + **设置面映射** 9 面（8 改 + 1 零动）；**保留面负向锁**（`.composer-input` / `.block` / `.approval-card` / `.question-card` / `.plan-card` / `.rail-row` 仍 `var(--line)`）+ 零新变量 / 零新依赖 / 零新文件；内容面零动 · 布局与信息层级零动（守 D21 值源）；单源 = `docs/desktop/design/UI.md` §1「本批注（外壳视觉降噪 · D24）」 | 验收三件：① 静息描边机检锁（`thincoder-desktop/test/views-locks.test.mjs` 原址补例）② 真机 hover · 聚焦读数（`thincoder-desktop/test/integration/chat-render.test.mjs` 原址补例）③ 改前 / 改后对照（走查）——用例行随测试档修加（2026-09-27 裁定） |

### 6.2 验收 A1–A4 与依赖面 P1–P4

| 项 | 本设计与它的关系 |
|---|---|
| A1 | §6.1 每行皆机检判据（用例号登记于 §7） |
| A2 | 三端共享契约零回归：配置 / 会话面全部经核入口（`docs/desktop/design/SHELL.md` §3），端侧只加 `END = "desktop"` 单写者文件（不增跨端共享可变字段——照核 NF1 语义）；`locale`（批 9 首写者）= **端无关偏好键**（任一端写、他端读，非属主型状态 ⇒ 不属本条禁增范围——§2 KD-13） |
| A3 | 三平台 CI 矩阵 = §5 CI 行；本机 Windows 实跑 + 另两平台 CI |
| A4 | 核 / CLI / 扩展三包测试零回归：本端**不改核机制语义**、不触另两端源码（批 B 纯加法三处，授权在案——批次档 §1.2 A；`docs/desktop/design/SHELL.md` §3「不改核」行 + §8 边界）；**对齐重定位批例外（在案）**：`thincoder-vscode/webview/**` 接核改造 + 核包新增（净 = 换实现不换行为——`docs/render-core/design/RENDER-CORE.md` §8 / §9）；**残余批**：核只读出口（`docs/core/design/SESSION.md` §6.24） |
| P1 | 落判 = KD-7（下限取 Electron ≥ 44.x，判据 = 启动自检实测）；**Node 24 专属 API 使用面** = 实施批逐点核（本端新增代码不主动用高于宿主内置版本的 API） |
| P2 | 落定 = §1.2 第 2 条 + KD-3 / KD-4 + `docs/desktop/design/SHELL.md` §1 前端目录形态 + `docs/desktop/design/UI.md` §1 交互决策全落（长会话渲染与回填本批落定——`docs/desktop/design/RENDERER.md` §2 / §3） |
| P3 | 落定 = `docs/desktop/design/SHELL.md` §4（第三种装配；共享化 = 独立议题，不并入本批） |
| P4 | 落定 = §5 CI 行（待实施，随 A3） |

### 6.3 批级判据（批次档 §1.6）

| # | 判据 | 落点 |
|---|---|---|
| ① | 四部分落点与命名规则可机检 | `docs/core/design/DOC-SYSTEM.md` §4 部分表 + §8 射程行（本批已落；本档即在 `docs/` 域内被机检覆盖） |
| ② | 本档给出可验证验收 | §6.1 / §6.2 / §7 |
| ③ | 三平台打包链明确形态 | §5（工具 / 产物 / 验证面 / CI 矩阵） |
| ④ | 与核接口面逐项点名、不改核机制语义（批 B 纯加法三处——授权在案） | `docs/desktop/design/SHELL.md` §3 七面表 + 「不改核」行 |

## 7. 用例表

| 用例 | 场景 | 输入 | 预期输出 | 机检面 / 落点 |
|---|---|---|---|---|
| T-DSK1 | 正常 · 项目入口 | 打开目录 A（无既有会话） | 生成 / 命中 A 的会话路径；主界面就绪，左列出现 A |
| T-DSK2 | 边界 · 最近目录 | **前置**：A 已有会话写入（族最新 mtime 居前 10）∥ A 无数据文件（首次打开即物化——位次由打开写定）；打开目录 A 后退回启动态；重启应用 | 最近列表含 A；点击直接进 A（不再选目录） |
| T-DSK3 | 正常 · 会话族 | 新建 3 个会话 → 重命名 1 个 → 删除 1 个 | 左列 = 2 项且名称为改后值；标签条与左列语义不混（左列全部 / 标签已打开）；会话行按 `createdBy` 标注来源端（老槽缺键 ⇒ 不标注） |
| T-DSK4 | 正常 · 流式与中断 | 发送一条消息 → 中途中断 | 收到增量事件序列；中断后回合停止、已产出内容保留在对话流 |
| T-DSK5 | 边界 · 活动池粒度 | 触发一个子代理 + 一个并发子代理 | 活动池出现两个块，各含块头读数 + 状态词（**无工具位** · **无内容回显**——D20 块形）；折叠后对话流得全宽 |
| T-DSK6 | 正常 · 审批三出口 | 触发需审批工具 → 分别回 once / always / reject | 首次执行 / 后续免问 / 拒绝；三态下活动池待审批计数与标签位同步变化 |
| T-DSK7 | 正常 · 模型与档位 | 改 provider → 改模型 → 改推理档位 | 会话头三值更新（改 `provider` ⇒ 模型 / 档位候选逐 provider 重取随动）；切标签再切回仍为该会话值（槽往返不丢） |
| T-DSK8 | 正常 · 设置与凭据 | 新增 provider + 填 key（真调校验）→ 切换语言 | 校验通过后可用；语言切换后界面文案随动；key 落共享配置文件 |
| T-DSK9 | 正常 · 记忆与检索 | 让 agent 调一次记忆检索 | 工具卡显示检索结果；**界面无独立搜索框**（D8 边界） |
| T-DSK10 | 正常 · MCP | 添加一个 stdio MCP 服务器 | 服务器列表出现该条；其工具入口随动可见 |
| T-DSK11 | 正常 · 项目级信息 | 打开有台账 / 批次的目录 | 左列底部出现台账行与批次相位；切会话时**不随会话变** |
| T-DSK12 | 正常 · 跨端接续 | 另端起一个会话 → 本端打开同一 cwd → 接续 | 历史完整载入并可继续对话；另两端读数不变（无互写） |
| T-DSK13 | 边界 · 首启分叉 | ① 无共享 config ② 已有共享 config | ① 进向导并在完成后可用 ② 跳过向导直接进主界面 |
| T-DSK14 | 正常 · 产物与启动 | 跑 `package` script | 三平台产物齐备；校验脚本通过；本平台冒烟启动可进主界面 |
| T-DSK15 | 错误 · 宿主下限不满足 | 以低于下限的宿主运行 | 启动自检报错并显式退出（不静默降级、不崩栈） |
| T-DSK16 | 错误 · 渲染面越界 | 渲染面试图 import `node:` 内置或 `@thincoder/core` | 静态闭包守卫测试红（照扩展端守卫先例） |
| T-DSK17 | 边界 · 长会话渲染窗口 | 单会话累计块数 > 200 | DOM 只保留尾部 200 块；更早部分呈「摘要块」且可一键回填；块数有界（不做虚拟化） |
| T-DSK18 | 正常 · 历史回填 | 于流顶附近上滚（scrollTop ≤ 48） | 取更早一页（100 块）且插入后视口不跳（scrollTop 按 scrollHeight 增量修正）；有在途请求时不重入 |
| T-DSK19 | 正常 · 跟滚与药丸 | 先上滚停跟 → 期间到达新块 → 点药丸 | 新块到达时视口不动（停跟）；出现药丸；点击回底并复跟；平滑滚动 420ms 窗内不抢占 |
| T-DSK20 | 边界 · 标签条溢出 | 打开超过单屏容量的标签 | 标签宽在 [1.75rem, 14rem] 内有界；溢出可横向滚动 + 端点渐隐；非活动标签不收 Tab 序（落形 = 标签控件与关闭控件 `tabindex="-1"` · 确认态 `data-confirm="1"` 项例外 · **零 `inert`**） |
| T-DSK21 | 正常 · 审批键盘与大 patch | 待审批卡出现 → 键 1 / 2 / 3；另一例 patch 超阈 | 三键 = once / always / reject；初始焦点**目标** = 「拒绝」（真置焦执行未落——登记 open）；超阈（> 200 行 或 > 10 文件）只呈摘要 + 增删计数且无外部查看器入口 |
| T-DSK22 | 正常 · 输入区与中断 | 在活动会话输入文本 → Enter；另一例 Shift+Enter；另一例回合在飞时 Enter；另一例回合错误后再 Enter | Enter ⇒ 发出一条消息并清空输入区；Shift+Enter ⇒ 只换行不发；忙态 ⇒ 该文本落队列（池面「队列」族在场）且输入区清空；回合尾发队首一条（**三径同判据**——`done` / `stopped` ∨ `ev:error`；**先发后出队**：**取文本面 = 条目 `title` 逐字原样**（载荷 `text` = `title`——零显示串副本 / 零第二字段）；`ok` 假（`busy` / `bad-key` / `provider-invalid`）∥ 抛 ⇒ 留队 + `console.error`〔可见面 = 池面队列族在场 · 重触发 = 下一回合尾〕）；发送失败 ⇒ 文本保留 + `console.error`；错误终局 ⇒ 本键 `running` 清 + 位落 `done`；**可见面修复批修（#458）**：直发 ∥ flush 回执 `ok` 真 ⇒ 该条作为用户块入流（**尾块 = 本回合首个块** · 文本逐字）；失败 ⇒ 零块（原判据不动） |
| T-DSK23 | 边界 · 队列上限 | 连续在飞态下投满条数 > `QUEUE_MAX` | 达上限后提示行落地且**该条不入队**（队长不增、输入文本保留）；提示词出自词表键；**flush 失败 ⇒ 该条留队**（队长不降 + `console.error`——零静默丢条） |
| T-DSK24 | 正常 · 提问作答与计划 | ① 核发 `ev:question` ⇒ 界面出现提问卡；选项 / 自由作答 / 取消各一例 ② 核发 `ev:task`（含 pending / in_progress / done 三态事项）；③ 待作答期按中断键（`msg:interrupt`） | ① 卡含题干 + 给答项 + 作答区；作答 ⇒ `question:respond` 往返 ⇒ **回执 ok 后**卡清除（失败 ⇒ 卡留 + `console.error`）；取消 ⇒ `answer: null`；**待作答期该会话位标含 `approval` 码**（跨会话可见面 = 「不静默等待」兑现），回执处置后清码 ② 计划卡逐行 = 标题 + 状态词（排队中 / 运行中 / 完成）；空列表 ⇒ 卡不在场；③ 卡**零回执直摘**（中断 ⇒ 本键各门按取消结算 ⇒ `stopped` 终局 ⇒ 事件面摘本键提问项 + 按卡退场同判据清码；判据 = 终局事件面，非回执——单源 = `docs/desktop/design/RENDERER.md` §1.1 卡面在场与随动条） |
| T-DSK25 | 正常 · 标签条点按与加速键 | ① 点非活动标签；② 点活动标签；③ 焦点在输入区时按 `Ctrl/Cmd+1..9` | ① 标签激活 ⇒ 切换会话（与左列点行同一路）② 界面不变（零新标签 · 零重复开页）③ **键 ∈ 1..9 ∧ 第 N 档存在** ⇒ 第 N 档激活；第 N 档不存在 ∥ 表外键 ⇒ 零动作不吞键 |
| T-DSK26 | 正常 · 关标签的页随动 | ① 关活动标签（另有邻位）② 关唯一标签 ③ 关非活动标签 ④ 待确认态按取消；⑤ 已关会话迟到的回执（关后到达） | ① 邻位接管：`activeSession` = 邻位 · 屏面转邻位页（关前会话块零残留）② 中区 `none` 态**零块节点 + 引导节点**（`data-guide="no-session"`——批 B 追加轮；引导面非空态视觉）③ 两键皆不动 · 零 IPC ④ 零动作（页不动）；⑤ **零写**——页切片与 `tabs` 零动（`sessionMeta` / `tabBadges` 仍写已关键 = 既有登记观察——`docs/desktop/design/RENDERER.md` §1.1） |
| T-DSK27 | 正常 · E2E 设置面（真 Electron） | 空 fixture 家（唯一预置 `<临时家>/.thincoder/config.json` = `{"locale":"en"}`）· 无项目 | boot `ok`；入口在；点按后面板 `open`；段序 `providers,model,agent,mcp`；态 `ready,none,ready,ready`；PNG 落固定落点（存在 + magic）；关闭后 `closed` 且子节点 0；机检面 = `thincoder-desktop/test/integration/settings-panel.test.mjs`（已落）；形态与九步断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.3 / §6 |
| T-DSK28 | 边界 · 会话级偏好隔离 | 两会话（A 活动 / B 非活动）各改 provider / 模型 / 档位（含 `off` 与 `Auto` 各一例；另例：不可 `off` 模型——off 选项缺席）；另例：B 回合在飞时提交；另例：提交表外档位字面串；另例：只送 `provider`（不携 `model`）；另例：槽不可读 / 键不合法 | ① 各值只落本槽（`session:prefs` 回执 `meta` ⇒ 就地刷本行 · 不整页重挂 · 零乐观写）；② 切标签回读 = 各自槽值（互不波及）；③ 改 A 不改 B（B 只写盘——内存态不动）；④ 在飞 ⇒ 拒 `busy` · 槽不可读 ⇒ 拒 `slot-missing` · 键不合法 ⇒ 拒 `bad-key`——三径皆**零写**且失败缺 `meta` 键；⑤ 表外档位字面串 ⇒ 归一 `null`（未设——原非 `null` 亦置 `null`）、其余键照改；⑥ 槽往返不丢（`effort` 随 `saveSession` 落盘；老槽无键 ⇒ `null` 容忍 · 零回填）；⑦ 只送 `provider` ⇒ 拒 `model-required` 且**零写**（模型候选随动 = T-DSK7） |
| T-DSK29 | 正常 · 状态栏占用读数 | ① 活动会话跑完一回合（核发有效 `ev:usage`）② 核不发 / `percent` ≤ 0 ③ 切标签 | ① 状态栏读数节点在场且值 = 活动会话读数 ② **零读数节点**（禁假造）③ 随活动键取值换读数（非活动会话读数不串场） |
| T-DSK30 | 正常 · 附件与复制（D13） | ① 输入区粘贴一张图 ⇒ 发送（视觉模型）② 同例换非视觉模型 ③ 清空附件条 ④ 点某块复制控件 / 点末条复制 ⑤ 空文本块 | ① 附件条出现缩略图 + 文件名 + 移除控件；`msg:send` 载荷携 `images`（逐项 `{ name, mime, dataURL }`）；`ok` 真 ⇒ 清条 ② 回执携 `degraded:"non-vision"` ⇒ 提示行在场 + 用户消息文本尾说明行（不静默丢图）；超限 / 落盘失败项 ⇒ `"partial"` ③ 附件条**零节点** ④ `clipboard.writeText` 收到块文本逐字（**末条取文源 = 末 `assistant` 块**——无 `assistant` 块 ⇒ 零控件；成败零布局变化；失败 ⇒ `console.error`）⑤ 该块**零复制控件** |
| T-DSK31 | 正常 / 边界 · 设置面档位控件（批 B · ⑥） | ① 「模型与档位」段选档位 = Auto / off / 枚举档各一例 ② 现值 = 表外字面串 ③ 陈旧面提交表外档位 / 表外 `provider` ④ `defaultModel` 缺 / 模型段空 ⑤ 不可 `off` 模型 ⑥ 写盘失败（mtime 冲突） | ① 载荷 `{ tier: { provider, model, level } }` ⇒ `ok` 真 ⇒ 重取 `provider:list` 后该行 `effort` = 所选档（**写后投影恒等**）；键面形 = Auto 删两键 / off 落 `thinkOffShape(spec)` + 删 `reasoningEffort` / member 清关思考记号（值 deep-equal `thinkOffShape(spec)` 时删 `thinking`）后置 `reasoningEffort` ② 现值**自成一选项**（不吞 · 零改写）③ 拒 `bad-level` ∥ `unknown-provider`——两径零写 + 控件回退回执前值 ④ 档位控件**零节点**（禁假造）⑤ off 选项缺席（该模型 `thinkOff` 假）⑥ 核 reason 直传（`mtime-conflict`）+ 零写 + 回退；机检面 = `thincoder-desktop/test/views-settings.test.mjs`（现值投影 / 选项集 / 表外自成一选项）+ `thincoder-desktop/test/settings.test.mjs`（tier 三径 + 两 reason）+ `thincoder-desktop/test/providers.test.mjs`（行 `effort` 投影两向） |
| T-DSK32 | 正常 · 首启空态引导（真 Electron） | 空 fixture 家（无 config ⇒ 无项目 / 无会话；另**预置**会话槽族档一枚〔`cwd` = 项目根 ⇒ 左列最近目录项在场〕）——新装首启 | ① 向导退场后：`[data-guide="no-project"]` 在场（含 `button[data-action="project:open"]`）∧ 输入框 `disabled` ② **真点**左列最近目录项（带 `data-path` 形 · 渲染面产品路）⇒ `[data-guide="no-message"]` ∧ 输入框非 `disabled` ③ **真点**关唯一标签 ⇒ `[data-guide="no-session"]`（含 `button[data-action="session:create"]`）· 仍 `disabled` ④ **真点**引导面 `session:create` ⇒ `[data-guide="no-message"]` ∧ 非 `disabled` ⑤ 键入 + Enter ⇒ 输入值保留 ∧ `data-blocks="0"` ∧ console 出 `[composer] msg:send failed: `（不静默丢文本）；机检面 = `thincoder-desktop/test/integration/first-run-smoke.test.mjs`（批 B 追加轮已落 · 实读 **171**）；十二序断言单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 |
| T-DSK33 | 正常 · 状态行十六段（D17） | 活动会话（另有非活动标签）逐态：忙态（含工具在跑）· 任务有项 · `ev:activity` turn（n/max）· 有效 `ev:usage`（percent + tokens）· 计时在途 · 台账超阈 · 队列 ≥1 · 位标含 `approval` | 承载 16 段各节点在场且源正确：banner 四态 / 状态词（两态）/ 当前工具 / 耗时 / ✓n/m / turn N/M / 令牌 / context% / 台账超阈位 / ⏰N / 会话标题 / 输入提示段 / 注意力提示；旁置 1 段（滚动位零节点）· 键位组零节点；未至 / 非正数 ⇒ 对应段零节点（禁假造） | `thincoder-desktop/test/views-statusline.test.mjs` 原址补例（已落 · 实读 **298**——段集 16 计数锁 / banner 四段两态 / `state` 两态 / `enter` 三态）+ `thincoder-desktop/test/views-chrome.test.mjs` 原址补例（会话头回三值） |
| T-DSK34 | 正常 · 会话面板元数据（D18） | 项目内 ≥2 会话 | 行元数据三值在场（provider = 槽 `activeProvider` 投影；`messageCount` / `updatedAt`）；多标签结构不动（既有标签用例不缩水） | `thincoder-desktop/test/views.test.mjs` 原址补例（行三值构树）+ `thincoder-desktop/test/session-contract.test.mjs` 原址补例（行投影 `activeProvider` 两向——`sessions:list` 载荷面，U38 邻位；清单随动 = `thincoder-desktop/test/files.mjs` / `thincoder-desktop/test/run.mjs` 无需新档） |
| T-DSK35 | 正常 / 边界 · 会话流经核（D19） | 助手块含围栏代码块 / 行内 md / 注入样本（`<script>` 字面）；用户块；推理 `ev:reasoning`；文件链接候选文本 | ① 围栏块 ⇒ `pre.code-block` 在场 + 代码块复制控件在场（点按 ⇒ `clipboard.writeText` 收代码文本）；② 注入样本 ⇒ 字面文本（转义闸）；③ 推理块 = 折叠块（块型 `reasoning`）；④ 文件链接零节点（KD-RC-5） | 新增用例族（名实施批定；真渲染视觉 = 人工走查 T-DSK21 面） |
| T-DSK36 | 正常 / 边界 · 右列 = 子 agent 面（D20） | ① 五类射程各一例投 `ev:subagent`；② 同实例 queued → started → turn → done；③ 停止钮点按；④ 旧工具行；⑤ 丢首发出生事件（模丢帧） | ① 各出块（头含 role / 用时 / 回合，状态词闭枚举）且**零内容回显**（text / think 不进流也不进块）；② queued 态 / 终态折叠（终态词 + 用时）；③ `subagent:stop` 往返 `ok` ⇒ 实收 `cancelled`（源 = `⟦ev⟧stopped`——先例兼容映射）⇒ 块折叠；④ 右列**零工具行**（`pool` 切片零 tool 条目 · 树面零工具行节点）；⑤ **出生自愈**：丢首发 ⇒ 一拍（2s）内块复现；终态出表 ⇒ 零再断言（不复活）；归档 = 下回合起已终态块不在场 | 新增用例族（`events-reduce` 归约 + 视图构树）+ `agent-bridge` 平 node 直测（映射表 + 存活投影拍体直驱） |
| T-DSK37 | 正常 · 会话流经核 + 会话面板元数据（真 Electron） | fixture 家（`{"locale":"en"}` + 会话槽族四档——槽 1 回放历史：围栏块 / 注入样本 / 路径候选 / 推理块） | 块序 = `user/assistant/reasoning/user`；`pre.code-block` 恰一枚 + 复制钮点按 ⇒ 剪贴板收代码文本；注入样本 = 字面文本 ∧ 零 `script` 节点；推理块 = `details.reasoning-block`；路径候选零 `.file-link` 节点；行元数据段序 = `provider / msgs / updated` ∧ 含 `p1:m1`；机检面 = `thincoder-desktop/test/integration/chat-render.test.mjs`（已落 · 实读 146）；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §6 |
| T-DSK38 | 正常 · 恢复态播种 + 用户块 md 深度（真 Electron） | 探针式 fixture 家（既有会话槽：`tasks` 2 条在场 · 读数可算）——resume 该会话 | ① resume 后状态行段 6（`tasks`）在场——槽数据直取（非空时）；空 / 缺 ⇒ 零节点 ② 段 9（`context`）在场——打开态读数 `> 0`；未至 / ≤ 0 ⇒ 零节点 ③ 用户块块级构件零节点（围栏 / 标题）∥ assistant 同文本块级在场 | 机检面 = `thincoder-desktop/test/integration/session-open.test.mjs`（拟新增 · 集成域）；用例号自铸披露 = §10 **AP** |
| T-DSK39 | 正常 · 状态栏对齐（真 Electron · 打开态对表） | fixture 家（`{"locale":"en"}` + **另建第二枚临时目录作项目根**（记 `PROJ`）+ 会话槽族档〔`cwd` = `PROJ`；形单源 = 核写面物化形——沿 T-DSK32 夹具先例〕——**两臂**（夹具按可达态）：主臂槽档 = `autoApprove: true` / `advisor: { guard: true }` / `engineering: true` / `planMode: false`（四真不可达——`engineering: true` ⇒ 核恢复点 `clearPlanMode` 令 `planMode` 恒 false，实读 `thincoder-core/session-lifecycle.mjs:126-133`）；第二臂槽档 = `planMode: true` / `engineering: false` + `autoApprove: true` / `advisor: { guard: true }` 同值（另盖 `plan` 点亮）；两臂皆 `tasks` 2 条 + `title` 一条 + 读数可算；清理 = 两枚临时目录） | ① 真点左列**最近目录项**（`button[data-action="project:open"][data-path]`——与 T-DSK32 第 6 步同一产品路；作用域限定：同页多枚 `project:open`，只点带 `data-path` 者）⇒ `openDir` 成功链 ⇒ 自动一次 `session:resume` 开页（点开即续——`docs/desktop/design/IPC.md` §2 项目面注项 3）；主路未开页（续失败）⇒ 备路 = 真点左列会话行（`button[data-action="session:switch"]`——同一开页尾） ② 状态行在场段 ⊆ 16 码闭集 ∧ 相对序 = 闭集序 ∧ 假 / 缺 ⇒ 零节点（**主臂**亮点三段 = `auto` / `advisor` / `eng` 在场 + **`plan` 零节点**（负断言）；**第二臂** = `plan` 在场 + `eng` 零节点；两臂保留在场 = `state` / `tasks` / `context` / `title` / `enter`）③ `state` 段词 = `Ready`（locale = en）④ `enter` 段词 = `Enter: send` ⑤ `tasks` 段词 = `✓0/2` ⑥ 截图 PNG 落 `thincoder-desktop/test/artifacts/statusline-align.png`（父侧 CLI 同刻对照面）；机检面 = `thincoder-desktop/test/integration/statusline-align.test.mjs`（已落 · 实读 **142** · 集成域）；用例号自铸披露 = §10 **AS** |
| T-DSK40 | 正常 · 账本警示面（真 Electron） | fixture 家（`{"locale":"en"}` + 第二枚临时目录作项目根〔记 `PROJ`〕+ 会话槽族档〔`cwd` = `PROJ`——沿 T-DSK32 / T-DSK39 夹具先例〕+ **损坏现场档** `{manifest}.corrupted` 一枚〔= `<临时家>/.thincoder/sessions/<cwd 哈希>.json.manifest.corrupted`——命名单源 = `docs/core/design/SESSION.md` §6.1 后缀族〕；清理 = 两枚临时目录） | ① 真点左列**最近目录项**（带 `data-path` 形——作用域限定同 T-DSK32 第 6 步）⇒ 等 `[data-guide="no-message"]`（resume 开页两况同落）② 会话区 `[data-section="sessions"]` 末子 = `div.rail-ledger-notice[data-ledger-notice]`（**非 `button`** ∧ 零 `data-action`——非可点）∧ `[data-list="sessions"]` 行数 = 夹具族数（不打断列表）③ PNG 落 `thincoder-desktop/test/artifacts/ledger-notice.png`（存在 + magic）④ 全程零 `pageerror`；机检面 = `thincoder-desktop/test/integration/ledger-notice.test.mjs`（已落 · 实读 **121** · 集成域）；断言序单源 = `docs/desktop/design/E2E-TESTING.md` §3.6 / §6；用例号自铸披露 = §10 **AU** |

**T-DSK3 注**：场景中「重命名 1 个 → 删除 1 个」的**通道面**（机检 = `thincoder-desktop/test/session-contract.test.mjs` 五通道往返用例——**已落**（批 5））与 **UI 入口**（批 A **已落**——左列行内控件，形态单源 = `docs/desktop/design/UI.md` §1 左列会话行；构树机检 = `thincoder-desktop/test/views.test.mjs` 原址补例 · 实机走查 = T-DSK21）分属两面、两层。

**D21 注（视觉对齐 · 值面验收）**：三面 = ① **值落点锁**（`thincoder-desktop/test/views-locks.test.mjs` 原址补例——新增变量两模式齐备 · `tk-*` 9 规则在场 · 关键值串；沿 U152 同式）；
② **真机读数**（`thincoder-desktop/test/integration/chat-render.test.mjs` 原址补例——真 Electron `getComputedStyle` 读代码块底 / 行内码底 / 表头底 / 关键词色四值；需求 D16 条「改可见面 ⇒ 真 Electron 使用面用例」由本条承担）；③ **人工走查** = 逐面与 VSC 并比（T-DSK21 面）。
值表单源 = `docs/render-core/design/RENDER-CORE.md` §5（内容面 21 面）/ `docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」项 2（会话面板 9 面）；**测试档随修随加——不占设计条目**（用户 2026-09-27 裁定）。

**残余批注（D17 / D19 · 验收面 · 2026-09-28）**：机检面 = ① **值落点锁**（`thincoder-desktop/test/history-page.test.mjs` 原址补例——seed 三例：`tasks` 直取 / `usage` 有效门 / 回填不携；`thincoder-desktop/test/events-page.test.mjs` 原址补例——首屏播种：写入 / 缺席零写）；
② **同源对拍**（`thincoder-core/test/session-reading.test.mjs`（拟新增）——`sessionReading` × 同 data ⇒ === `applySession` 后同式读数 / 老槽回退 / 边界三组）；③ **深度对拍**（`thincoder-desktop/test/views-chat-text.test.mjs` 原址补例——`user` ⇒ `mdInline` ∥ `assistant` ⇒ `md`）；
④ **真机使用面**（**T-DSK38**——D16 义务：resume 后 `tasks` / `context` 段在场 + md 深度断言；`thincoder-desktop/test/integration/session-open.test.mjs`（拟新增 · 集成域））；⑤ **时序例**（首屏种 × 在飞键）：本键在飞（回合未尾）⇒ 首屏种零写（活切片为准）——`thincoder-desktop/test/events-page.test.mjs` 原址补例；测试档随修随加——不占设计条目（沿本档 §7 D21 注既裁）。

**批 9 注**：T-DSK7 / T-DSK8 / T-DSK10 的机检面 = 主侧三档（`thincoder-desktop/test/settings.test.mjs` / `providers.test.mjs` / `mcp-servers.test.mjs`）+ 视图面 `thincoder-desktop/test/views-settings.test.mjs`（表单构树与通道接线）；
T-DSK11 = `thincoder-desktop/test/project-info.test.mjs`（台账行与相位两向）；T-DSK13 = `thincoder-desktop/test/views-onboarding.test.mjs`（闸两向 + 三步可走完）；T-DSK9 读数面 = 随 `memory:status` 另批（本批不落）；T-DSK8 的「切换语言」机检 = `settings` 档（键往返）+ `views-settings` 档（词表重刷）。

**批 9 用例号归属（修正轮 #9）**：设置族 `thincoder-desktop/test/settings.test.mjs` = **U98–U102**；渠道族 `thincoder-desktop/test/providers.test.mjs` = **U103–U107**（含 **U107b**）；
  MCP 族 `thincoder-desktop/test/mcp-servers.test.mjs` = **U108–U110**；项目级信息族 `thincoder-desktop/test/project-info.test.mjs` = **U111–U113**（U98–U113 全数在册）；
  视图面 `thincoder-desktop/test/views-settings.test.mjs` / `views-onboarding.test.mjs` = 零 U 号（档名面入 U51 扫描清单）。

**批 B 用例号归属**：本批自铸段 = **U127–U150**——会话级偏好族 `thincoder-desktop/test/session-prefs.test.mjs` = **U127–U131**；用量族 `thincoder-desktop/test/agent-host-usage.test.mjs` = **U132–U137**；
  附件视图族 `thincoder-desktop/test/views-attach.test.mjs` = **U138–U141**；附件落盘族 `thincoder-desktop/test/attachments.test.mjs` = **U142–U145**；档位写径 `thincoder-desktop/test/settings.test.mjs` = **U146**（原址补例）；
  会话头与状态栏 `thincoder-desktop/test/views-head.test.mjs` = **U147–U150**（U127–U150 全数在册；自铸披露 = 批次档 §5）。

**批 B 追加轮用例号归属**：本批自铸段 = **U151**——引导面用例族 `thincoder-desktop/test/views-chat-guide.test.mjs` = **U151**（自铸披露 = 批次档 §2.12 / §5）。

**批 A 注**：T-DSK22 / T-DSK23 的机检面 = 队列三纯动作与两切片归约（`thincoder-desktop/test/store.test.mjs` / `thincoder-desktop/test/events-reduce.test.mjs` 原址补例——**含回合终局三径**：错误径清本键 `running` + 位落 `done`〔T-DSK22〕）+ **输入区构树与两态锚**
  （`thincoder-desktop/test/views-chrome.test.mjs` 原址补例——中区外壳面同档，新词键随入「全量词表键齐」）；实键位（Enter / Shift+Enter 真事件）· flush 时序 · **两失败径**（`msg:send` 失败 ⇒ 文本保留 ∥ flush 先发后出队：失败 ⇒ 留队——判据在 T-DSK22 / T-DSK23）归人工走查（T-DSK21 面）。
T-DSK24 ① 的机检面 = `thincoder-desktop/test/agent-host.test.mjs`（`question:respond` 往返 + 三 reason 不 resolve + **中断径**〔`msg:interrupt` ⇒ `stopped` ⇒ 本键提问项随清——归约面判据〕——原址补例）+ `thincoder-desktop/test/events-reduce.test.mjs`（`stopped` 面清本键 `questions`——原址补例）
  + `thincoder-desktop/test/views-question.test.mjs`（卡构树与三出口锚）；② 的机检面 = 同档（`ev:task` 归约 + 卡构树——**事件驱动**：核 `task` 工具在工程模式下机械停用，故不以「真跑出帧」为判据，见 §10 P 行）。
T-DSK25 的机检面 = `thincoder-desktop/test/views-tabbar.test.mjs`（两控件 `tabindex` 两态 + 接线两向：非活动项点按 ⇒ `onActivate` 携本键 + 加速键**纯函数判定**：**键 ∈ 1..9 ∧ 第 N 档存在** ⇒ 第 N 档激活；第 N 档不存在 ∥ 表外键 ⇒ 零动作不吞键）· 加速键真事件面与点按真视觉切换 = 人工走查（T-DSK21 面）。

**批 B 注**：T-DSK28 的机检面 = `thincoder-desktop/test/session-prefs.test.mjs`（通道往返 / 键闭集 / 在飞拒 `busy` 零写 / 表外档位字面串归一 `null` / 老槽零回填 / 失败径三档：`model-required` / `slot-missing` / `bad-key`）+ `thincoder-desktop/test/settings.test.mjs`（原址补例——`model:list` 回执形两向：元素形 `{ id, effortEnum, thinkOff }` 逐项在场）；
T-DSK29 的机检面 = `thincoder-desktop/test/events-reduce.test.mjs`（原址补例——`ev:usage` 归约：按会话 `key` 写切片 · 未至 / 非正数 ⇒ 零节点）+ `thincoder-desktop/test/views-chrome.test.mjs`（原址补例——读数节点两态 + 会话头三 `select` 与回执刷行）；
T-DSK30 的机检面 = `thincoder-desktop/test/views-attach.test.mjs`（附件条目构树 / 空条零节点 / 两 `degraded` 提示行 / 复制控件与取文面）；真粘贴事件 · 真剪贴板写 · 真落盘后的图片指针 = 人工走查（T-DSK21 面）；
`host-floor` U95 臂清单随动 = 码面池（批 B 新档四档：`attach.mjs` / `views/chat-copy.mjs` / `mount-head.mjs` / `mount-onboarding.mjs`——实读面 = §4.1 值列）；批 B 新档**不越 300**（实读 **146** / **133** / **147** / **88**）。

## 8. 边界（不做）

- **不做**需求档 §5 所列：文件视图 / 编辑器 / 打开 / 保存 / 内置 diff · 常驻多项目面板 / 项目切换器 · 云服务 / 工作流引擎 · 复制核机制 · 另立存储格式 · ACP 面之外的新协议面 · 通用编辑器 / IDE。
- **贯穿不做**：改核**机制语义**（批 B 纯加法三处，授权在案——批次档 §1.2 A）· 需求档与提示词面。
- **本轮不做**（设计面明确排除）：自动更新（升级首版 = 手动下载覆盖）· 代码签名 / 公证执行（落发布前置，机制面已留位）· 多窗口 · 全局快捷键。
- **本批（装配桥批）不做**：`msg:*` 的 UI 输入区与中断键（视图批）· MCP 连接（设置批）· 工程模式 manifest 附着（`docs/desktop/design/SHELL.md` §4 端差注）· 审批卡 `changes` 摘要供给（核侧缺该键 ⇒ 卡面无摘要行——`docs/desktop/design/IPC.md` §1）· 多实例协作面。
- **本批（设置面批）不做**：`memory:status` 通道与索引状态面板（归另批——携核只读出口）· 端侧直读核内表（不授权）· 打包与发行（批 10）· 主题切换面（未在需求档）。
- **本批（批 B · 会话级偏好 / 档位枚举化 / 占用读数 / 附件与复制）不做**：斜杠命令（需求档 §3.5 边界裁定）· 真代码块面（围栏切分 / 语言高亮 / 代码块级出口——**另裁已落**：`docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 11）· 端侧自建落盘与图片指针格式（落盘径 = 核）· 主题 / 通知面 · 用量面板（状态栏读数以外）· CI 接线（随三平台 CI 批）。
- **本批（批 B · 追加轮）不做**：真实模型回路下的发送成功面（空 fixture 家 ⇒ 无凭据 ⇒ 断言只覆盖失败可见面：文本保留 + `console.error`）· 引导面另立样式档（沿现盘 `.chat-empty`）· 需求档补条目 ⇒ **已落**（需求档 **D16** = 首启空态引导；本档 §6.1 D16 行 / §10 Z 行同源）。
- **本批（批 A · 对话面板）不做**：斜杠命令 · 模型 / provider 切换 · 推理档位 · 上下文占用读数 · 附件与导出 · 文件树 / diff / 终端（需求档 §5）——后四项中前四者 = 批 B 面，附件 / 导出同归批 B。
- **本批（桌面端 E2E 基建批）不做**：web 快筛与 Electron 一致性核（判据④——Electron = 唯一权威面）· CI 接线（随三平台 CI 批）· 第二 runner / 测试框架（`@playwright/test` 等——`node --test` 单入口不变）· 视觉 / 像素回归（只断言 PNG 存在 + magic）
  · 错误 / 边界用例三条（`T-DSK27b` / `T-DSK27c` / `T-DSK27d`）· 产品码改动（`thincoder-desktop/src/**` / `thincoder-desktop/renderer/**` 零改）——单源 = `docs/desktop/design/E2E-TESTING.md` §6 / §7 / §8。
- **本批（可见面修复批）不做**：#426 窄窗左列折叠**交互**（窗口 = 视图交互批）· #440 真代码块面（围栏切分 / 语言高亮——**另裁已落**：`docs/render-core/design/RENDER-CORE.md` §4 行 11）· 核（`thincoder-core/**`）零触碰。
- **本批（对齐重定位批）不做**：CLI 代码面（D17 = 语义对位——零触碰）· 搜索面 / 文件链接出口（暂缓面——KD-RC-5）· 核化滚动 / 回填 / 窗口裁剪（各端在册机制不动——核档 §4 行 13–15）· 提示词面与需求档（笔权在父侧）。
- **本批（残余批 · D17 / D19）不做**：状态行段集 / 段判据（R3a 在册）· 视觉面（#477 批在途）· VSC 侧零改 · 核机制语义（除 §6.24 只读出口一处）——`tokens` / `timers` 等 10 段不属播种面（单源 = `docs/desktop/design/UI.md` §1「本批注（D17 / D19 · 残余补齐）」项 1）。

## 9. 界面形态落定（UI / 交互决策）

→ 见 `docs/desktop/design/UI.md` §1（形态与交互面 **23 行**）· `docs/desktop/design/RENDERER.md` §2 / §3（工艺面 2 行：有界渲染窗口 / 回填与跟滚）——合计 **25 行**。
批 B 四件（会话头三值就地可改 · 附件条 · 状态栏读数 · 复制面）落形 = `docs/desktop/design/UI.md` §1 存量行内「（批 B 落）」标注 + §1 批 B 注——**形态行 / 工艺行数不变**（合计 **25 行**）；批 B 设计修订轮（**⑥** 设置面档位控件）落形同径（§1 设置面行 + §1 批 B 注项 5）——**行数不变**；批 B 追加轮（首启引导面）落形同径（§1 **批 B 追加注**）——**行数不变**（合计 **25 行**）。
对齐重定位批落形同径（`docs/desktop/design/UI.md` §1「本批注（对齐重定位）」四项）——**行数不变**（合计 **25 行**）。
D21 视觉对齐批落形同径（`docs/desktop/design/UI.md` §1「本批注（D21 · 视觉对齐）」两项：内容面值表指针 + 会话面板映射表）——**行数不变**（合计 **25 行**）。
残余批（D17 / D19）落形同径（`docs/desktop/design/UI.md` §1「本批注（D17 / D19 · 残余补齐）」两项）——**行数不变**（合计 **25 行**）。

## 10. 上抛与报告项

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| B | `PROJECT-MANIFEST.json` 的 `docRoot` 需扩第四端 | 写门专权在父侧 | 父侧随本批设计批准后落笔（批次档 §1.3 已裁） |
| C | `docs/README.md` 多处「三部分」口径（`:12` · `:16` · `:25` · `:63` · `:91`）与桌面端「三端发布」表述（`docs/RELEASE.md` 档头） | 地图 / 发布档与第四端不一致 | 父侧批内跟进：地图补第四部分行 + 口径改四；发布档待桌面端首版登记发布单元时改 |
| D | 壳装配第三份是否抽共享层 | 独立议题（需求档 §2 + 批次档 §1.5 已裁不并入） | 另立议题，不并入本批 |
| F | 需求档 §6 明写「留设计轮」而本档无专表落点的两项——「启动可接受」（阈值与测法）·「平台差异面逐项定形」（路径与大小写 / 行尾 / 进程与信号 / 窗口壳与原生菜单） | 需求侧留白 · 本档覆盖缺口 | 评审裁定：本档补专表（下批）或需求侧收正措辞——本批 fix 射程外，登记不改 |
| H | 两项端差：MCP 连接随设置批 · `attachManifest` 工程模式钩子不附着 | 端差登记（`docs/desktop/design/SHELL.md` §4） | 无静默降级；MCP 面与设置面同批 |
| I | 活 / 页两面块形一致性（同一会话在活动池与页内呈现的块形同源） | 实机走查面 | 随 T-DSK17 / T-DSK18 实机走查记录；不一致 ⇒ 归并到归约面单源 |
| J | `sessionMeta` 五值字段名（`effort` / `autoApprove` 等是否槽字段） | **已订正** | `effort` = 槽字段（批 B 立——KD-17 ⇒ 槽值优先，配置回落支删除）· `provider` / `model` 映射既有 `activeProvider` / `activeModel` · `autoApprove` / `engineering` = 布尔槽（`ON` / `OFF` 词形）⇒ 槽值优先；报明 = 批次档 §5.8 / §2 |
| K | 活动池切片**窗限 / 归档口径** | **已裁（对齐重定位批）** | 工具行摘除（工具面入流）；子 agent 块 = 出生 / 终态折叠 / **归档 = 该会话下回合起清已终态**（KD-26；形态 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 2）；`UI.md` open 行同笔摘项 |
| L | `ev:tool-result` 载荷 `subKey` **值面在场 · 消费未落**（宿主透传 + 键定形已落；渲染面归约不按 `subKey` 归并——子代理工具结果与顶层同片） | 设计留白（渲染面消费未落） | 视图批或归约面下次触碰时定形；同项登记 = `docs/desktop/design/IPC.md` §1 载荷键集段 |
| N | `memory:status` 通道与「索引状态读数」（需求 D8 判据含「索引状态」） | **已裁定 = 另批**（父侧 2026-09-26 11:52） | 本端不设该通道（端侧直读核内表不授权——第二消费面 ⇒ 核表结构成无主公共契约）；正解 = **核加只读出口**（`memoryStatus()` 一类）随**核面批**落，届时通道 + 设置面状态行随落（台账条件型待办已记）；能力面（memory / code_search / doc_search）本身经 agent 工具面可达、不缺；同项登记 = `docs/desktop/design/IPC.md` §2 |
| O | 提问挂起（`ev:question` 待作答）的呈现面：需求 D4 所列「挂起态」措辞 vs 本端池族枚举 | **已裁定（父侧 2026-09-26）** | 裁定 = **需求 D4 措辞不改**（问题卡走流内 = 审批卡先例）；**「不静默等待」兑现面 = 跨会话可见面**——待作答 ⇒ 该会话位标含 `approval` 码（⚠ 待审批 · 状态栏告警位同源同词）· 出场 ⇒ 清码；**池三族不动**（池 = 本会话面 ⇒ 不添跨会话可见性；流内已有决策面 ⇒ 池行零增益）；连带 = 该态下关标签走确认面（`needsCloseConfirm` 判据自动在场）；落形 = `docs/desktop/design/UI.md` §1 提问呈现行 |
| P | 核 `task` 工具在**工程模式下机械停用**（实读 `thincoder-core/agent-tools/task.mjs:64-66`）⇒ `ev:task` 帧只在普通模式会话出现 | 环境事实（登记） | 计划面消费路已落（`docs/desktop/design/UI.md` §1 计划面行）——验收按**事件驱动**（投 `ev:task` ⇒ 卡可见），不写「必现」；启用面 = 工程模式择绪另议 |
| Q | **页窗暂留**：页键变更至 `history:page` 回执落之间，屏上暂留前页块（关活动 / 切标签同源 —— 既有口径），非「状态转了页没转」 | 设计登记（既有行为 · 非本批新增） | 消解 = 第三态「载入中」= 新词键 / 新形态 ⇒ 新需求面——本批不落；若裁定须消解 ⇒ 另批（`docs/desktop/design/RENDERER.md` §1.1 页生命周期行） |
| R | 桌面端 E2E 面续件：判据④（web 快筛与 Electron 一致性）归属 · 边界 / 错误用例三条 · CI 接线 | 上抛（判据归属 · 父侧裁定） | 判据④ = 落需求档或另立批（本批只登记不做）；用例补面 = 后续批；CI 接线 = 随三平台 CI 批——单源 = `docs/desktop/design/E2E-TESTING.md` §6 / §7 / §8 |
| S | 需求 D4「挂起态与 **digest**」的 `digest` 面（`docs/desktop/requirements/PROJECT.md:112`）在设计五档零落点（评审扫全档仅需求档一处命中） | 需求与设计覆盖差（登记 · 不改需求档） | 父侧 / 需求侧收口（另批起落点 ∥ 需求措辞收正）——本批只登记；连带 = §10 O 行已裁 D4「挂起态」前半（提问呈现），「digest」未涉 |
| T | **§4.1 行数账按盘全量回填**（实读 2026-09-27）：§5 披露差三档收正（`app.mjs` **222** / `i18n.mjs` **317** / `views-chrome.test.mjs` **392**）· `agent-bridge.mjs` 实读 **77** | 实施后随动收正（登记） | 值列 = 本档 §4.1；存量估值几项（只报）见该段 |
| U | **批 A 拆档产物四件**（`views/tabbar.mjs` **200** · `mount-sessions.mjs` **197** · `agent-host-question.test.mjs` **116** · `views-tabbar-close.test.mjs` **317**——末者拆后即越 300） | 登记（拆分落形） | 越层档预案 = 本档 §4.1 越 300 段（`views-tabbar-close` 页随动例拆出——档名实施批定） |
| V | `railForm` **无外部消解窗口**（切项目 / 行集整置留场 · 槽号复用 ⇒ 陈旧确认面指向新槽——批档 §5 响应表 4） | 设计缺口（登记） | 消解 = 设新需求面（另批立项）；落点 = `docs/desktop/design/UI.md` §1 左列会话行 |
| W | **行形态两件**：D2 / D3 收正已落（删除形保留行控件 · 改名形撤行控件 · 确认键词 = 动作词）；**改名出口无行为例**（与删除出口用例不对称——批档 §5 响应表 5） | 收正落地 ∥ 用例缺口待补 | 用例补面 = 后续批（`thincoder-desktop/test/views.test.mjs` 行形态例） |
| X | **输入面两件**：① IME 组字保护（`isComposing`——先例 = `docs/vsc/design/WEBVIEW-INPUT.md:72`；**实施未落**）· ② 附件面（批 B 立 = KD-21 + IPC 附件注） | 登记（① 规则入册 · 实施待安排；② 设计已落 · 实施随批 B） | ① = `docs/desktop/design/UI.md` §1 交互行 / open 行；② = 同档 §1 批 B 注项 2 |
| Y | **真代码块面**（围栏切分 / 语言高亮 / 代码块级复制） | **已裁（对齐重定位批）** | 随共享渲染核落（`docs/render-core/design/RENDER-CORE.md` §2 KD-RC-4 / §4 行 1 / 11）；实施随 R3c；块级 + 末条复制口径（KD-22）不变——两控件并存 |
| Z | **D14（可测性 E2E）的批 B 覆盖**：批 B 四件走查面不补 E2E；**批 B 追加轮**补落一条（T-DSK32 首启空态引导冒烟） | 覆盖登记（追加轮已增一例） | 追加轮裁定 = 首启引导走 E2E（判据 = 无项目 ⇒ 无会话 ⇒ 建会话 ⇒ 键入不丢）；批 B 四件的实机面仍归人工走查（T-DSK21）；单源 = `docs/desktop/design/E2E-TESTING.md` §3.5 / §6 |
| AA | 需求档两处随动（**已随动**）：① §3.1:47 槽字段列举补 `effort`；② §3.5 项 7（状态栏占用读数）= 需求档 **D15** | 已随动（需求侧 2026-09-27 落） | 收口 ✓（本档 §6.1 同源 **D15 行**） |
| AB | **活流用户块与入会话文本在非视觉降级径有一行差**（#458 边界）：入会话文本 = 提交文本 + 说明行（主进程 `appendLine`），活流块 = 提交文本 | 登记（边界 · 三端同义：VSC 回显 = 键入串——本档 §2 KD-23） | 消解路 = `msg:send` 回执携入会话文本（须动 IPC 回执形 + 主进程——另裁）；触发条件 = 用户裁定「活流与回放须逐字等同」 |
| AC | **需求侧建议（已随动）**：需求 §4 D3 判据列补「发送后用户消息在对话流在场（与回放块序一致，对齐 CLI / VSC）」 | 已随动（需求侧 2026-09-27 落——`docs/desktop/requirements/PROJECT.md:111` D3 判据 + `:179` 变更记录） | 收口 ✓（本档 §2 KD-23 同源） |
| AD | **两越层档被本批触碰**（`thincoder-desktop/renderer/events.mjs` **351 ⇒ 369** · `thincoder-desktop/renderer/mount-composer.mjs` **348 ⇒ 362**）——拆档 = 结构改动 | 上抛（归父侧裁——§4.1 该两行） | 预案补登 = 见 §4.1 越层段；父侧裁：本批实施批执行 ∕ 续期至下批（消解窗口 = 该两档下次被触碰的批） |
| AE | **在飞回合内切回 ⇒ 本回合用户块不在页读**（#458 键门径窄窗——页复读只含已落盘态） | 登记观察（窄窗 · 无数据丢失） | 槽落盘在回合尾（`thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）· 页读 `loadSlotFile`（`thincoder-desktop/src/main/session-slots.mjs:123` / `:145`）⇒ 随回合尾落盘后、于下次页读在场；消解路 = 无；若须消除 ⇒ 另裁（须触页数据整置口径） |
| AG | **新核包入发布序列**：`@thincoder/render-core`（R1 随发布单元登记 + `docs/RELEASE.md` §5.5 三端物化窗口同源） | 记录面随动（父侧 / 发布轮） | 随 R1 实施批；指针 = `docs/render-core/design/RENDER-CORE.md` §10 B / C |
| AH | **D17 承载四项（耗时 / 令牌 / 计时 / 回合 N/M）** | **已落（R3a）**（2026-09-28 坐实：读数槽四住 `thincoder-desktop/renderer/events.mjs`；载荷面 = `ev:usage` 两键扩 + `ev:activity` `turn`） | 收口 ✓——单源 = `docs/desktop/design/IPC.md` §1 `ev:usage` 行 |
| AI | **两条加载形探针**（VSC dev junction 下 `node_modules` 相对路径 webview 取核 · 桌面 `/rc/` 双根与逃逸门）——任一失败 ⇒ 回核档改加载形（备选 = 物化后 `localResourceRoots` 显式扩面） | 实施前置实证 | R1 首跑即测（`docs/render-core/design/RENDER-CORE.md` §10 E） |
| AL | **`thincoder-desktop/renderer/styles.css` 拆档窗口已到**（**374 ⇒ 本批 ~420**；在册预案 = 按「主题变量 / 布局 / 折叠态」三段拆档） | 上抛（归父侧裁——§4.1 该行） | 拆档**不消解**越层（主题段拆出后本档仍 ~380 > 300）⇒ 本设计倾**续期**；执行窗口 = 后续「三段一次性拆档」批或父侧裁定 |
| AM | **★上抛① 正文面字族**：随 VSC = 编辑器等宽栈（新增变量 `--mono`）——观感变化最大一项 | 上抛（用户裁定面 · 设计已按「值以 VSC 实值为源」落） | 核准 ⇒ 照落；否决 ⇒ **单点回退**（删 `font-family: var(--mono)` 行 · 余 20 面不动）；登记 = 核档 §5 映射表行 1 |
| AN | **D 号口径同族书证**（本档档头 `:6` · `docs/desktop/design/IPC.md:4` · `docs/desktop/design/RENDERER.md:4` · `docs/desktop/design/SHELL.md:4` · `docs/desktop/design/UI.md:4`） | **已收口**（父侧直接执行〔可 revert〕· 2026-09-28；随 D22 / D23 收 ⇒ **D1–D23**；**外壳视觉降噪批随 D24 再收**——五处 ⇒ **D1–D24**） | **五处已全收正为 D1–D24**；口径 = 「D 号诸处同改」（本档先例） |
| AO | **需求档 2026-09-28 补两句的落点（登记）**：D17「恢复态播种」（`docs/desktop/requirements/PROJECT.md:146`）· D19「用户块 md 深度两端统一」（`:148`）——落点 = 批 `docs/batches/2026-09-28-desktop-residuals.md` | 协调项（落点归批 · 零双记——本档不另立条目） | **设计已落**（UI.md 本批注 + 该批 §2 在册）；实现随该批实施轮 |
| AP | **`T-DSK38` 用例号自铸披露**（沿 T-DSK37 先例——本批自铸；若 #477 实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §7 用例表行；并号裁定权 = 父侧 |
| AQ | **`session:create` 径播种 = 空种**（新槽 `tasks: []` / 读数 0 ⇒ 零节点——无可见变化） | 登记（有意行为） | 沿 D17 播种判据的自然结果；无动作 |
| AR | **D17 补句措辞与「播种 2 / 不播种 10」清单的一致性**（`docs/desktop/requirements/PROJECT.md:146`——`tokens` / `timer` 不属播种面；如需在需求档显式列出不播种面 ⇒ 归父侧裁定） | 上抛（需求档面 · 归主 agent） | 本设计不改需求档（笔权在父侧） |
| AS | **`T-DSK39` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 先例——本批自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §7 用例表行；并号裁定权 = 父侧 |
| AT | **模式位桌内翻转刷新**（桌内 AUTO 翻转〔always 放行置位 = `thincoder-desktop/src/main/suspensions.mjs:103`〕后 `flags` 即时刷新） | **已裁（2026-09-28 评审轮 1 修正——并入本批定形）** | 落形 = `approval:respond` 成功径回执叠加 `{ key, flags }` ⇒ 渲染面写 `sessionFlags` 切片（最小可落路径——零新通道 / 零算法副本）；单源 = `docs/desktop/design/IPC.md` §2「模式位投影注」项 5 |
| AU | **`T-DSK40` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 / T-DSK39 先例——本微轮自铸；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 已落 §7 用例表行；并号裁定权 = 父侧 |
| AV | **桌面需求档 D23 句面与账本警示面的关系**（`docs/desktop/requirements/PROJECT.md:153`：主句 = 计数显示；「同批落会话账本摘要可靠化…失效可见」为归批句——桌面警示面判据锚 = 核需求 §4.6 **F-L4** + 批档 §1.6 扩面裁定；需求档如需桌面专句 ⇒ 归父侧裁） | 上抛（需求档面 · 归主 agent） | 本微轮不改需求档（笔权在父侧）；设计面落点已齐（IPC / UI / E2E 三档 + 本档） |
| AW | **词表键计数在途协调**（`thincoder-desktop/renderer/i18n.mjs` = 139 键 as-of 2026-09-28 实读；状态栏对齐批另有键增 139 ⇒ 145 设计在册且该档在途） | 登记（协调项） | `rail.ledger.notice` 两语必增（判据 = 键名在位，不以计数为门）；实施轮以对盘计数为准 |
| AX | **`T-DSK41` 用例号自铸披露**（沿 T-DSK37 / T-DSK38 / T-DSK39 / T-DSK40 先例——本批自铸〔外壳视觉降噪〕；**机检豁免**——用例行随测试档修加〔2026-09-27 裁定〕；若实施批占用同号 ⇒ 请父侧并号裁定） | 登记（自铸披露） | 用例行随测试档修加——不进设计面条目（2026-09-27 裁定）；号面登记 = 本行；并号裁定权 = 父侧 |
| AY | **核侧无「助手说话人标签」原语**（核内为 `renderBlock` / `buildAssistantRestore` 内联字面；桌面助手标签 = 端侧同字面落形——词键同源 / 字形住样式档） | 上抛（核面收拢候选） | 若须核侧收拢 ⇒ 补助手标签原语（与 `queued-mark` 的 `paintLabel` 同族）——**另裁**；本批不改核件 |
| AZ | **核件消费面两处不消费登记**：`queued-mark` 的 `planBusyQueued`（宿主快照对账面 = VSC 专有）/ `clearPending`（桌面交接 = 节点换代，非原地清标）· 核 **effects 表不逐条执行**（端面动作由模型态幂等派生——`connectedOf` / `regionOf` 由模型字段供给） | 登记（非缺口） | 单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2 / 5；如判须逐条执行 ⇒ 另裁 |
| BA | **运行期可见面两件**：待发送气泡 / 归档子 agent 块——页读整置即失（非落盘件） | 登记（有意行为） | 与 VSC 重载面同族；如需持久化 ⇒ 新需求面（另裁） |

## 11. 范本借用清单（UI 范式勘察落档）

→ 见 `docs/desktop/design/UI.md` §3（形态面 5 行 · 第 7–11 项 · 清单前言单源）· `docs/desktop/design/RENDERER.md` §4（实现工艺面 6 行 · 第 1–6 项）。

## 变更记录

- 2026-09-25：建档（桌面端设计批 1）——模块目标与总体方案（§1）· 关键决策 8 条含被否候选（§2）· 架构与接口契约（§3：进程形态 / IPC 通道 / 六面接口 / 壳装配第三份 / 需求档 §3.5 三项落定）· 受影响文件清单（§4）· 三平台打包链（§5）· 验收回指（§6）· 用例表 16 条（§7）· 边界（§8）· 界面形态落定（§9）· 上抛项 5 条（§10）。
  与需求档的对齐：需求 §3.1 布局收正（**活动池 = 会话视图内靠右**）已按本批新形态落于 §9 与 §3.5；需求 §3.5 项 3（会话行来源端）标 open 并上抛（§10 A）。
- 2026-09-25（修正轮）：§9 补落 6 行（标签条 · 长会话渲染窗口（200 块 + 摘要块）· 回填与跟滚 · 状态词闭枚举 · 状态栏警示与单点重建 · 工具卡大 patch 降级）；§9 open 行收窄为「左列折叠阈值数值」。
  新增 §11 范本借用清单（11 行 = 10 项 + 首屏补行，带来源坐标与证据级别）；随动 = §3.1 树 · §3.2 `history:page` · §4.1 拆档（`chat-stream.mjs` / `chat-scroll.mjs`）· §6.1 D2–D5 · §6.2 P2 · §7 用例 T-DSK17–21 · §10 F 行。
- 2026-09-25（分档轮）：按板块切五档（判据 = 多面 + 会被并行写的面，非篇幅）。映射：
  - §3.1 → `docs/desktop/design/SHELL.md` §1（树注另归该档 §2 职责索引）；§3.2 → `docs/desktop/design/IPC.md` §1 / §2；§3.3 → `docs/desktop/design/SHELL.md` §3；
  - §3.4 → `docs/desktop/design/SHELL.md` §4；§3.5 → `docs/desktop/design/UI.md` §2；§9 → `docs/desktop/design/UI.md` §1（形态 14 行）+ `docs/desktop/design/RENDERER.md` §2 / §3（工艺 2 行）；
  - §11 → `docs/desktop/design/UI.md` §3（形态面 5 行）+ `docs/desktop/design/RENDERER.md` §4（工艺面 6 行）。
  搬迁节在原档只留一行指针（不留正文副本）；本档 §4 / §6 / §8 / §10 内被搬节的 `§` 回指随动改为带路径指针；档头补五档导航。
- 2026-09-25（**修正轮**——设计评审 §3 轮次 1 发现 1 / 2 / 3 / 4 / 7）：§2 增 **KD-9**（最近项目目录零新存储）· §4.1 增 `projects.mjs`（拟新增）/ `renderer/i18n.mjs`（拟新增）/ 用例模块五档行 + 测试面三分落点注 · §4.1 注行改「≲300」并补 `styles.css` 拆分预案 · §5 script 三条收正为**单源**（`test` / `package` / `postpackage`）· §6.1 D1 判据点名状态文件。
- 2026-09-25（**修正轮 2**——设计评审 §3 轮次 2 发现 14 / 16）：§4.1 `projects.mjs` 行与 §6.1 D1 判据行的 KD-9 指针改**带路径全名**（消指代歧义）· §9 指针行计数同步（UI §1 形态行 15 行 / 合计 17 行）。
- 2026-09-25（**修正轮 3**——收尾两件：设计评审 §3 轮次 2 发现 15 的 H1 角落 · 发现 4 残余）：§7 T-DSK2 前置写明「A 已有会话写入（族最新 mtime 居前 10）∥ A 无数据文件（首次打开即物化——位次由打开写定）」——对回批次档 §1.12 裁定「最近 = 最近写入」（打开既有族不刷新位次）· §4.1 人工面补实机交互类 9 条（T-DSK4 / 5 / 6 / 7 / 8 / 9 / 10 / 11 / 13——T-DSK6 由「键位项」收口为整项）⇒ §7 用例 21 条逐条有落面。
- 2026-09-25（**实施后修正轮**——SLOT-END-PARAM 落地同步 · R-5 / R-2 回填）：KD-5 改端名声明形态（核 marker 端参数化 ⇒ 端侧零算法副本）· KD-9 被否候选坐标收正 · §2.1 改实测读数（宿主内置 Node = 22.21.1）· §4.1 增 `host-floor.mjs` 行（42）· `session-slots.mjs` 行改端壳口径 · §6.1 D2 / §7 T-DSK3 补 `createdBy` 判据 · §8 撤「不承诺来源端」行 · §10 销 A / E。
- 2026-09-25（**宿主底线轮** · 批 2026-09-25-host-node24）：KD-7 下限改 **Electron ≥ 44.x** · 理由链改「Electron 44 内置 Node 24.21.0；本端取 Node 24 主版本底线」· §2.1 实测读数改 Electron 44 面（`24.21.0`）· §6.2 P1 下限指针随动。实施面（`electron` `^37.3.1` → `^44.4.5` · `MIN_NODE` `"22.13.0"` → `"24.0.0"`）由实施舱落。
- 2026-09-25（**批 3 视图面首段 · 左列**）：§4.1 增 `sessions.mjs` 行（会话族读面：`sessions:list` 载荷投影）· 用例模块行增 `views`（~90 行）+ 自动面落点补 T-DSK1 / T-DSK2 / T-DSK3 渲染面 · `thincoder-desktop/renderer/views/sessions.mjs`（拟新增）行补左列先行口径。
- 2026-09-25（**宿主底线轮 · 实施后修正轮**）：KD-7 被否候选「保留 Electron 37 面」删括注「与 core / CLI 的单条底线分叉」（A 裁定 ⇒ 双轨底线保留 · 该括注失据）。
- 2026-09-25（**批 4 中区外壳面**）：§4.1 增 `thincoder-desktop/renderer/views/chrome.mjs`（拟新增）行（会话头 + 状态栏）· `thincoder-desktop/renderer/views/sessions.mjs` 行预算 180 → ~240 · `styles.css` 行预算 300 → ~280（注行「居顶」随动）· `i18n.mjs` 行预算 60 → ~100（皆据实读行数）· 自动面 `views` 落点补中区外壳结构面（T-DSK20 / T-DSK3）。
- 2026-09-25（**实施后修正轮 2**——行数回填）：表下补「批 3 收口 · 行数回填」注（内容行数口径——文末换行不计）：`thincoder-desktop/renderer/i18n.mjs` 93 · `thincoder-desktop/renderer/styles.css` 180 · `thincoder-desktop/test/views.test.mjs` 174——三档超批 3 实施前预估界（89 / 162 / ≤150）但 ≪ 500 硬限 ⇒ 无拆分案。
- 2026-09-25（**实施后修正轮 2**——标记与路径收正）：§4.1「（拟新增）」按盘上实态逐行收正（已落档 19 行去标 · 未落档 10 行保留）· 节标题改「本端文件清单与行数预算」· `test/` 两行的相对路径 token 改带路径全名（`thincoder-desktop/test/run.mjs` · `thincoder-desktop/test/files.mjs`）。
- 2026-09-25（**批 4 修复轮 #55**——设计评审 §3 轮次 1 发现 1–9 全收）：§4.1 用例模块行 `~90` ⇒ `~300（实读 175）` · 表下补 **300 行主动拆分层**段（`test/views.test.mjs` 拆分预案 = U45–U48 拆 `views-tabbar.test.mjs` + `thincoder-desktop/test/files.mjs` 清单随动）· 「自动」行下补中区外壳面读法（静态树面 + 常量驻留；运行时横滚 / 渐隐 / `inert` 归人工走查）。
- 2026-09-25（**批 4 修后收正轮 #57**——数值 / 标记收正）：§4.1 `thincoder-desktop/renderer/styles.css` / `thincoder-desktop/renderer/i18n.mjs` / `thincoder-desktop/renderer/views/sessions.mjs` 三行实读值回填（**270 / 97 / 250**——内容行数口径）· `thincoder-desktop/renderer/views/chrome.mjs` 行撤「（拟新增）」标记（已落档 · 不写数）。
- 2026-09-25（**批 4 修后收正轮 #57**——档数 / 300 层收正）：§4.1 用例模块行补第七档 `views-tabbar`（`~300（实读 228）`）且 `views.test.mjs` 实读 175 → **322** · 表下「300 行主动拆分层」段改写（首轮拆分已落档）+ 紧接登记 **在册例外**（`thincoder-desktop/test/views.test.mjs` 322 · 消解窗口 = 该档下次被触碰的批）。
- 2026-09-26（**批 5 会话族批**）：§4.1 增 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行 · `thincoder-desktop/src/main/session-slots.mjs` 行改**七项绑定转口**（marker 三项 + 会话族四项）+ `renameSlot` 纯 re-export。
- 2026-09-26（**批 5 会话族批 · 预算与档数**）：`thincoder-desktop/renderer/app.mjs` 预算 ~120 → ~150 · `thincoder-desktop/renderer/views/sessions.mjs` 预算 ~240 → ~290（贴 300 拆分层——标签条面拆分预案在册）· 用例模块行七 → **八档**（补 `thincoder-desktop/test/views-chrome.test.mjs`）+ 各档预算重估。
- 2026-09-26（**批 5 会话族批 · 续**）：「300 行 = 主动拆分层」段改写（首轮 / 二次拆分均落档；在册例外段撤）· §7 补 T-DSK3 注（重命名 / 删除零 UI 入口 ⇒ 走查口径）· 拆分预案行 `tabbar.mjs` 补「（拟新增）」标记（锚收正）。
- 2026-09-26（**批 5 修复轮 #60**——设计评审 §3 轮次 1 发现 9 / 10 / 11 · 转口措辞）：KD-5 与 §4.1 `thincoder-desktop/src/main/session-slots.mjs` 行**转口措辞分层**（转口八项 = 端参绑定 6 · 同形转口 1 · 纯 re-export 1）。
- 2026-09-26（**批 5 修复轮 #60**——信封记法 / 拆分预案随动面）：§4.1 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行信封记法统一（`reason: null|string`）· 300 层段二次拆分改**条件式**（「随本批落地」）· 拆分预案行补**随动面**（`docs/desktop/design/SHELL.md` §1 树 + U51 扫描清单 / U52 导出锁 + 本档 §4.1）。
- 2026-09-26（**批 5 实施后修正轮 #62**——全表实读回填 · 逐号 1 · 依据 = 批次档 §1.8 / §1.9）：§4.1 产品 / 测试面实读收正（17 档 · 交付档列值 = 实读裸值 · 未交付档保 `~`）· 新档两行入表（`thincoder-desktop/src/main/session-actions.mjs` 67 · `thincoder-desktop/test/views-chrome.test.mjs` 213）· 用例模块行八档实读 `99 / 101 / 280 / 200 / 227 / 200 / 213 / 329`。
- 2026-09-26（**批 5 实施后修正轮 #62**——300 层段 · 逐号 2）：段改写（两轮拆分均落档——`thincoder-desktop/test/views.test.mjs` 200）· 在册例外换防：旧 `thincoder-desktop/test/views.test.mjs` 322 消解 ⇒ 新 `thincoder-desktop/test/views-tabbar.test.mjs` 329（候选 = 确认面 U55 面拆出 · 消解窗口 = 该档下次被触碰的批）。
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
- 2026-09-26（**批 7 实施后修正轮 #76**——逐号 1 · 档数与落点收正）：§4.1 用例模块行**十二 → 十四档**（名集与 `thincoder-desktop/test/files.mjs` 同序同值；两拆档 `views-locks` / `views-chat-frame` 入枚举）·「300 行 = 主动拆分层」段与「随动面」行两处 U52 落点收正（`thincoder-desktop/test/views-locks.test.mjs`）· 自动面落点补两拆档。
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
  新档**两**行（`renderer/mount-settings.mjs`（拟新增）~70 · `renderer/settings.css`（拟新增）~120——分档理由 = `styles.css` 实读 284 贴 300 层；`renderer/views/settings.mjs`（拟新增） / `renderer/views/onboarding.mjs`（拟新增）两行系批 7 已在）· 用例模块 **十九 → 二十五档**；
  §6.1 D6–D11 回填批 9 落点（D8 加限定注「读数面 = 另批」）· §6.2 A2 补 `locale` 口径 · §7 增批 9 注 · §8 增本批不做行 · §9 形态行 17 → **20 行**（合计 22）· §10 增 N 行（`memory:status` 归另批）。
- 2026-09-26（**批 9 收正轮**——坐标实核后定点）：§2 KD-12 闸改读数口径（`config:read` 回执 `configured` = 核 `existsSync(configPath())`——`thincoder-core/config-io.mjs:39`；CLI `isConfigured` 口径差**有意、勿统一**）· §4.1 `project-info.mjs` 行相位改**回执形**（`manifest.phase`——无顶层 `phase`）·
  `sessions.mjs` 计数收正 **292 → 291**（§4.1 行与拆分预案行同值）· `views/onboarding.mjs`（拟新增）行闸同收 · 用例模块行**两段分组**（批 8 五档 ∥ 批 9 六档——19 + 6 = 25）· §6.1 D11 闸 + 入口同收 · §9 形态行 17 → **20**（合计 22）。
- 2026-09-26（**批 9 修复轮 #94**——设计评审 §3 十条逐号 + doc-check 清项）：§7 批 9 注与变更记录批 9 两行**行宽收正**（≤300——零语义）+ 三处前向引用补「（拟新增）」标记（`renderer/mount-settings.mjs` / `renderer/settings.css` / `renderer/views/*.mjs`——盘上未落；与 §4.1 行标记面一致）。
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
  **补行** `thincoder-desktop/renderer/views/info-row.mjs` **135**（项目级信息行落册）+ `:127` 自述随动（视图构树三档列举）；
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
- 2026-09-26（**批 A · 机检面收正**）：§7 批 A 注——T-DSK22 / T-DSK23 机检面补**输入区构树与两态锚**（`thincoder-desktop/test/views-chrome.test.mjs` 原址补例——中区外壳面同档，新词键随入「全量词表键齐」）+ 删误挂的「左列行控件构树」（单源 = §7 T-DSK3 注）· T-DSK25 机检面补**加速键纯函数判定**（原仅登记走查面）。
- 2026-09-26（**批 A · U2 裁定落形**）：`docs/desktop/design/UI.md` **提问呈现行** = 跨会话可见面 ⇒ **标签位含 `approval` 码**（与审批门**同码同词** · 不入池三族）；`docs/desktop/design/PROJECT.md` §10 **O** 行转「已裁定」· §7 **T-DSK24** 判据补徽标行为 · `UI.md` 计划面行删失效表述「本批唯一呈现面」。（**父侧直接执行** · ③ 小改 · 可单独回退 ✓）
- 2026-09-26（**批 E2E · 放行落笔轮** · 次序 = 批 A 后）：`docs/desktop/design/E2E-TESTING.md` 入册（档头 `五档 ⇒ 六档`「另两档 ⇒ 另三档」· §1.1 同收）；需求侧行 `D1–D12 ⇒ D1–D14`
  §4.1 值收正（`thincoder-desktop/package.json` `~45 ⇒ 20 ⇒ 21`——`playwright-core` devDep〔测试面驱动·`dependencies` 零第三方不变〕· `thincoder-desktop/test/files.mjs` `14 ⇒ 15`）
  + §4.1 增两行（`thincoder-desktop/.gitignore`〔新增〕/ `thincoder-desktop/test/integration/settings-panel.test.mjs`〔拟新增 · 集成域〕）· §7 增 **T-DSK27**（E2E 设置面）· §8 增本批不做行 · §10 增 **R** 行 · §4.1 批 A 注长行折行（行宽收正）。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：§4.1 逐号收正——`app.mjs` 落点 `299 ⇒ ~330` + 拆分预案（`mount-sessions.mjs`（拟新增））· 三测试档补登越层 + 拆分预案（`agent-host` ~322 ∕ `views-chrome` ~321 ∕ `store` ~304）· 预算贴「四面」⇒ **八面** ·
  挂起表表项 `{ kind, shape?, key, resolve }`（verdict discriminator = `shape`）· 新档 `mount-cards.mjs` + 换形态态 `railForm` 入册 · `files.mjs` 值 `41 / 12 ⇒ 15` · 行内动作「原址改例」记法 · 随动面七处（`inert` 死注释四 + 换靶三面）；
  §7 判据补（T-DSK22 两失败径 + 错误终局 ∕ T-DSK23 flush 失败留队 ∕ T-DSK24 中断径 ∕ T-DSK25 命中判据 ∕ T-DSK26 五例）· §10 增 **S** 行；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2 修正块。
- 2026-09-26（**批 A 二轮点修**——设计评审 §3 轮次 2 发现 2–6 逐号点修）：§4.1 逐号收正——`thincoder-desktop/src/main/ipc.mjs` `184 ⇒ ~190`（余量按批后重算 ~10 行）· `thincoder-desktop/renderer/store.mjs` `259 ⇒ ~300` + 拆分预案（`thincoder-desktop/renderer/queue.mjs`（拟新增））⇒ 贴 / 越 300 层段 **八面 ⇒ 九面** ·
  另五档补增量（`agent-bridge.mjs` ~85 ∕ `preload.cjs` 57 ∕ `index.html` ~46 ∕ `views.test.mjs` ~215 ∕ `events-reduce.test.mjs` ~190）· `isTurnTail` 判据**吃两通道形**点名 ∕ 提问位标**置位面 = 归约面**点名；
  §7 T-DSK22 补**取文本面**（条目 `title` 逐字原样）+ flush 三码与重触发 · 行宽重排（两行超 300 ⇒ 分句断行，零语义）+ D3 收正（「另四档」列举 5 条路径 ⇒ **另五档**）；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2 二轮点修块。
- 2026-09-27（**批 E2E · 实施后对账轮**）：§4.1 集成用例行去「（拟新增）」+ 值回填 **137** 内容行（已落 · 实读 2026-09-27）· §7 T-DSK27 行态序收正为实证序 `ready,none,ready,ready`（位序 = `providers,model,agent,mcp`）+ 机检面去「（拟新增）」标记（已落）；明细 = `docs/batches/2026-09-26-desktop-e2e-infra.md` §2.11。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§4.1 行数账按盘全量回填（实读 2026-09-27——§5 披露差三档收正：`app.mjs` **222** / `i18n.mjs` **317** / `views-chrome.test.mjs` **392**）· 越 300 段重写（**九档** = 在册例外 `mount-settings` **458** + 本批越层八档，各带拆分预案 / 消解窗口；贴层 `chat.mjs` **289**）·
  新行两处（`mount-sessions.mjs` **197** · `views/settings-sections.mjs` **206**〔补登〕）· 用例模块 **二十八档** · KD-16 宿主收正（关闭尾住 `mount-sessions.mjs`）· §10 增 **T–X** 五行；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 A 收口尾轮**——只报不写清单落地）：§4.1 行数账两值回填——`thincoder-desktop/renderer/mount-composer.mjs` **251 ⇒ 262**〔实读 2026-09-27〕·
  `thincoder-desktop/test/views-chrome.test.mjs` **392 ⇒ 437**（越 300 软线 ⇒ 补拆分点登记——新档须动 `thincoder-desktop/test/files.mjs` / `thincoder-desktop/test/run.mjs`、只登记不建新档）；
  明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.14。
- 2026-09-27（**批 B · 会话级偏好 / 档位枚举化 / 占用读数 / 附件与复制**——设计落笔轮）：§2 增 **KD-17 … KD-22**（`effort` 入槽顶层字段 + `saveSession` 须携带 · 档位枚举双面 + `model:list` 补逐模型 `effortEnum` 投影 · 施加径 = 写盘 → 重施〔在飞拒 `busy` 零写〕·
  占用读数 = 回合尾 `ev:usage` 推〔未至 ⇒ 零节点〕· 附件 = 渲染面零 fs〔`dataURL` → 主进程落盘 + 核 `appendImagePointer`〕· 复制 = 块级 + 末条）；
  §4.1 值列随动十二处（`ipc.mjs` **195 ⇒ ~197**〔余量 3 行〕· `agent-host.mjs` **204 ⇒ ~219** · `session-slots.mjs` `~120 ⇒ **135** ⇒ ~137`〔估值收正〕· `settings.mjs` **156 ⇒ ~160** · `preload.cjs` **57 ⇒ 58** · `events.mjs` **338 ⇒ ~344** ·
  `store.mjs` **310 ⇒ ~313** · `views/chat.mjs` **289 ⇒ ~291** · `views/chrome.mjs` **101 ⇒ ~129** · `views/settings-sections.mjs` **206 ⇒ ~215** · `mount-composer.mjs` **262 ⇒ ~282** · `i18n.mjs` **317 ⇒ ~327**）
  + 新档**四**（拟新增：`thincoder-desktop/renderer/attach.mjs` ~90 · `thincoder-desktop/renderer/views/chat-copy.mjs` ~40 · `thincoder-desktop/test/session-prefs.test.mjs` ~140 · `thincoder-desktop/test/views-attach.test.mjs` ~160）+ `thincoder-desktop/test/files.mjs` `15 ⇒ 17`
  + 用例模块 **二十八 ⇒ 三十档**（§4.1 两处计数同改——D3）；
  §4.2 补核面三档（`thincoder-core/session.mjs` · `session-slot-write.mjs` · `session-lifecycle.mjs`——授权 = 批次档 §1.2）+ 三文档行（`docs/core/design/SESSION.md` §6.21 · `docs/desktop/design/IPC.md` · `docs/desktop/design/UI.md`）；
  §6.1 表头 `D1–D12 ⇒ D1–D14` + 补 **D13 / D14** 两行 + 表外一项（需求 §3.5 项 7 未编 D 号）+ D6 行补批 B 落点 · §7 增 **T-DSK28 / T-DSK29 / T-DSK30** 三行 + 批 B 注（机检面逐条点名）· §8 增本批不做行 · §9 补批 B 四项落形指针（行数不变）· §10 **J** 行再订（`effort` 入槽 ⇒ 槽值优先）· **X** 行 ② 转「设计已落」· 增 **Y / Z / AA** 三行；
  单源 = `docs/core/design/SESSION.md` §6.21（核面判据句 1–5）· `docs/desktop/design/IPC.md` §2（契约）· `docs/desktop/design/UI.md` §1 批 B 注（形态）；明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：需求侧 D 号 `D1–D14 ⇒ D1–D15`（档头 / §4.2 `IPC.md` 行 / §6.1 表头三处同收；表外一项 ⇒ **D15 行**——说明行删）· §2 KD-18 收正（逐模型元素投影 `{ id, effortEnum, thinkOff }` · `thinkOffPath` 单源 · 表外档位字面串归一 `null`——被否候选补「候选面恒含 off」）；
  §4.1 收正——`events.mjs` / `events-subscribe.mjs` 两行九 ⇒ **十通道** · `events-subscribe.mjs` **68 ⇒ ~70**（补登随动档）· `thincoder-desktop/renderer/views/settings.mjs` **295 ⇒ ~296**（批 B 值列十二 ⇒ **十三处**）·
  消费面点名（`views/settings-sections.mjs` 补 off 在场判据 · `views/chrome.mjs` / `store.mjs` 候选取逐项 `.id`）· 三测试档估增（`settings` +~4 / `events-reduce` +~4 / `views-chrome` +~6——贴层判据）；
  §6.1 D6 行收正（元素投影 + `thinkOff` + 归一 `null`）· §7 T-DSK7 补候选随动 / T-DSK28 补四例（不可 `off` 模型 · 只送 `provider` / `slot-missing` / `bad-key` / 归一 `null`）· T-DSK30 ④ 补取文源（末 `assistant` 块）·
  批 B 注同步 · §10 AA 转**已随动** · §8 贯穿不做行与 A4 / 批级判据 ④ 补「不改核**机制语义**（批 B 纯加法三处，授权在案）」。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 设计修订轮 · ⑥ 设置面档位控件**）：§2 KD-18 增设置面半（写面意图级载荷 `{ tier }` · 键协议统一式 · 现值 `provider:list` 行投影 · 表外现值自成一选项 · 控件零节点判据 · 两拒绝码——单源 = `docs/desktop/design/IPC.md` §2「档位控件注」）；
  §4.1 收正（`settings.mjs` **174** 实读 ⇒ ~205 · `providers.mjs` ⇒ ~140 · `views/settings-sections.mjs` ⇒ ~235 · `mount-settings.mjs` 458 ⇒ ~430 + 拆档落形〔向导族拆 `mount-onboarding.mjs`〕+ 例外续期）；§6.1 D6 补 ⑥ 判据 · §7 增 T-DSK31 · §9 批 B 落形扩 ⑥ ·
  `docs/desktop/design/UI.md` §1 设置面行 + 批 B 注项 5 · `docs/desktop/design/IPC.md` §2 两行 + 项 9「档位控件注」。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮 · 续**——实施后随动收正 · 数值对盘）：§4.1 全表按批 B 末实读回填（含新登行五：`mount-head.mjs` **147** / `attach.mjs` **146** / `views/chat-copy.mjs` **133** / `views-chrome-vocab.test.mjs` **291** / `agent-host-usage.test.mjs` **183**）· 越 300 段重写（**十档** = 例外一 `mount-settings` **426**〔距硬限 74〕+ 越层九：`styles` 340 / `events` 351 / `i18n` 356 / `store` 313 / `mount-composer` 348 / `views-settings.test` 446 / `views-question.test` 359 / `store.test` 334 / `views-tabbar-close.test` 317——`views-chrome.test` 拆档后 **258** 除名）· 贴层 = `views/chat.mjs` **292** ·
  §4.2 补登四行（`SHELL.md` / `RENDERER.md` / `CORE-UNIFICATION.md` / 本档）· §6.1 坐标收正（`session-slot-write.mjs` `:134`/`:125`/`:40` ⇒ `:140`/`:131`/`:46` · `session-lifecycle.mjs` `:77` ⇒ `:81`〔档位支 `:176-:190`〕）· §7 补**批 B 用例号归属 U127–U150** + 去「拟新增」与估值残留（实读 **146** / **133** / **147** / **88**）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 追加轮 · 首启引导与冒烟**）：§4.1 值列收正（`app.mjs` **243 ⇒ 247** · `i18n.mjs` **356 ⇒ 360** · `views/chat.mjs` **292 ⇒ 290** · `thincoder-desktop/test/files.mjs` **19 ⇒ 21**）+ 新档**两**行（拟新增 · `renderer/views/chat-guide.mjs` **~50** · `test/views-chat-guide.test.mjs` **~70**）；
  + 集成行**一**（`test/integration/first-run-smoke.test.mjs` **~140**）+ 用例模块 **三十四 ⇒ 三十五档**；§6.1 D11 / D14 验证面补 T-DSK32 · §7 增 **T-DSK32** + T-DSK26 ② 收正（`none` 态 = 零块节点 + 引导节点）· §8 增本批不做行 · §9 落形指针（行数不变）· §10 **Z** 行转「追加轮增一例」；
  §4.2 补 `docs/desktop/design/E2E-TESTING.md` 行 + 三行随动；单源 = `docs/desktop/design/UI.md` §1 批 B 追加注 · `docs/desktop/design/E2E-TESTING.md` §3.5。
- 2026-09-27（**批 B 追加轮 · 回指锚补**——父侧裁定）：§6.1 补 **D16 行**（首启空态引导）+ 表头 **`D1–D15 ⇒ D1–D16`**；**同族书证随动**（D 号口径「诸处同改」）：档头 `:6` / §4.2 `IPC.md` 行 `:218` /
  另四档档头（`docs/desktop/design/IPC.md` / `RENDERER.md` / `SHELL.md` / `UI.md`）；依据 = `docs/desktop/requirements/PROJECT.md` §4 **D16**（同刻落地 ⇒ 三链同源补中环）。
- 2026-09-27（**批 B 追加轮 · 修正轮**——设计评审 §3 轮次 1 逐号点修）：§6.1 **D16 行**收正（`none` 态记法 ⇒「零块节点 + 引导节点」+ 机检面）· §7 **T-DSK32** 行重写（**十二序**：向导退场 / 族档夹具 / 真点最近目录项 / 关唯一标签 / 引导面真点）
  · §4.1 收正（`views/chat.mjs` **292** 实读 + 方向断言删；`views-chat-guide.test.mjs` 归末位〔名序与 `thincoder-desktop/test/files.mjs` 同序〕；`views-chrome-vocab.test.mjs` 实读 **291**；用例模块行补随动两笔〔vocab / host-floor〕）· §8 行收正（需求档 **D16** 已落）· 集成行「十一序 ⇒ 十二序」· 明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.10。
- 2026-09-27（**批 B 追加轮 · 注记修正轮 #106**——设计评审 §3 轮次 2 注记 N1 / N2 落）：§4.1 集成行 + §4.2 `E2E-TESTING.md` 行序数记法收正为**十二序**（单源 = `docs/desktop/design/E2E-TESTING.md` §3.5）；§4.1 贴 300 层行数值收正 **292**（`views/chat.mjs` · 批 B 末实读）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.11。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**——数值按盘回填）：§4.1 值列收正（`app.mjs` **247** · `i18n.mjs` **363** · `views/chat.mjs` **299**〔批 B 末 292〕 · 集成行 `first-run-smoke.test.mjs` **171**）· 新档两行去「拟新增」（**54** / **110**）· `thincoder-desktop/test/files.mjs` **19**（两新档名打包入既有行 ⇒ 净 0）· 另触碰三档入表；
  越 300 段标题 ⇒「批 B 追加轮实读（未触碰者承批 B 末实读）」· 段内 `i18n.mjs` **363** · 贴 300 层行 **299** · 随动两笔实读（`views-chrome-vocab.test.mjs` **298** · `host-floor.test.mjs` **294**）；
  §6.1 **D16** 行机检面两档去「拟新增 / 待实施」· §7 **T-DSK32** 机检面「待实施」⇒「已落」（**171**）· §7 **T-DSK3 注**「落形 · 待实施」⇒「已落」· §7 U 账补**批 B 追加轮用例号归属 U151** · U 账段行拆三行（480 ⇒ ≤300，零语义）；明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
- 2026-09-27（**可见面修复批 · 设计轮**）：§2 增 **KD-23 / KD-24**（用户块出泡时刻 = `msg:send` 回执 `ok` 真〔受理即出〕——含失败边界与三被否候选 · 流式游标清点两族 + 块面引用刷新径）；
  §4.1 值列九行随动（`chat.css` **254 ⇒ ~296** · `events.mjs` **351 ⇒ ~363** · `mount-composer.mjs` **348 ⇒ ~362** · `app.mjs` **247 ⇒ ~251** · `mount-settings.mjs` **426 ⇒ ~427**）；
  另四档（`views/chat-tool.mjs` ~131 · `views/activity.mjs` ~176 · `views/approval.mjs` ~155 · `views/plan.mjs` ~45）+ 越层段补**预案补登**（两档——`questions.mjs` ∕ `composer-send.mjs`，归父侧裁）；
  §4.2 补三行（本档 + `docs/desktop/design/UI.md` + `docs/desktop/design/RENDERER.md`）· §6.1 D3 / D10 补本批修判据 · §7 T-DSK22 补用户块 clause（T-DSK32 ⑩⑪ **原形不动**——零缩水）· §10 增 **AB / AC / AD** 三行（降级径一行差 · 需求侧建议·只报 · 两越层档拆档）；
  单源 = `docs/desktop/design/UI.md` §1 本批注（形态逐处）· `docs/desktop/design/RENDERER.md` §1.1 三条（工艺）；明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2。
- 2026-09-27（**可见面修复批 · 修正轮 1**——设计评审 §3 轮次 1 逐号点修）：§10 **AC** 行转**已随动**（需求档 D3 判据补句——`docs/desktop/requirements/PROJECT.md:111` + `:179`）· 增 **AE** 行（在飞回合内切回 ⇒ 本回合用户块不在页读——窄窗登记，消解路 = 无 ∕ 另裁）·
  §7 T-DSK22 块位措辞统一「尾块 = 本回合首个块」· §8 增本批不做行（#426 ∕ #440 ∕ 核零触碰）。明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2.9。
- 2026-09-27（**可见面修复批 · 实施后对账 · 父侧直接执行〔例外②③〕 · 可 revert**）：§4.1 三行按盘回填（`events.mjs` **369** · `views/chat-tool.mjs` **135** · `views/activity.mjs` **177**——±~ 估值转实读）；§10 **AD** 行同判；零语义。
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

