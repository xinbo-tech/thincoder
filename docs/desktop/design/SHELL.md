# 桌面端（DESKTOP）· 宿主适配层

> 板块 = **桌面端宿主适配层**——三层进程与目录形态 · 宿主面职责（窗口 / 菜单 / 系统主题 · `app://` 供给 · 预载窄桥 · 启动自检）· 与核的接口面**七面** · 壳装配第三份。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D16 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：总览 / 决策 / 受影响文件 / 发行 / 验收 = `docs/desktop/design/PROJECT.md` · 主 ↔ 渲染通道契约 = `docs/desktop/design/IPC.md` · 界面形态与交互 = `docs/desktop/design/UI.md` · 渲染面实现工艺 = `docs/desktop/design/RENDERER.md`。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 文档体系落点（第四部分）判别与命名 = `docs/core/design/DOC-SYSTEM.md`；全仓模块地图与硬约束 = `docs/core/design/ARCHITECTURE.md`。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 进程与目录形态

```text
thincoder-desktop/                  ← 本端产品包
├── package.json                    ← 包定性：`main` 入口 + script 三条（`test` / `package` / `postpackage`——单源 `docs/desktop/design/PROJECT.md` §5）+ devDeps（electron · electron-builder · `playwright-core`——E2E 驱动 · 测试面）
├── electron-builder.yml            ← 三平台产物声明（拟新增）
├── .gitignore                      ← 忽略 `thincoder-desktop/test/artifacts/`（运行期产物不进 git——单源 = `docs/desktop/design/E2E-TESTING.md` KD-10）
├── src/main/                       ← 主进程（Node / ESM——唯一持 Node 能力者）
│   ├── main.mjs                    ← 入口：单实例锁 → 协议注册 → 窗口 · 启动自检（`docs/desktop/design/PROJECT.md` §2 KD-7）；ready 前初始化一律 await
│   ├── host-floor.mjs              ← 宿主下限谓词 + `node:sqlite` 探针（`main.mjs` 同面拆分 · 零 `electron` 导入的叶子——预算 = `docs/desktop/design/PROJECT.md` §4.1）
│   ├── window.mjs                  ← BrowserWindow 生命周期 / 菜单 / 系统主题 / 窗口态
│   ├── protocol.mjs                ← app:// 供给 + 路径逃逸防护
│   ├── ipc.mjs                     ← IPC 通道注册与分发（`docs/desktop/design/IPC.md` §1 / §2）
│   ├── agent-host.mjs              ← 壳装配第三份 + 回合驱动；回调桥 / 待决门 / 槽 I-O 三出档（下三行）（本档 §4）
│   ├── agent-bridge.mjs            ← 回调桥（自 `agent-host.mjs` 拆出）：活动名闭集八名 + 协议行解析 + 九回调 ⇒ `ev:*` 映射 + 注入 `post` / `askSingle` / `askBatch` / `askQuestion`（批 A 增第 4 键——自挂起门出 `ev:question`，桥零文案）（映射单源 = `docs/desktop/design/IPC.md` §1）（本档 §4 项 2）
│   ├── suspensions.mjs             ← 待决门（自 `agent-host.mjs` 拆出）：两门 verdict 闭集 + 挂起表
│   │                                  （**唯一持有点**：`promptId → { kind, shape?, key, resolve }`——`shape` = verdict 闭集选择 discriminator）+ 五操作
│   │                                  （`askSingle` / `askBatch` / `askQuestion` / `denyGates` / `respond`——批 A 增 `askQuestion`）+ `kind` 两值（`approval` / `question`）（本档 §4 项 5）
│   ├── session-io.mjs              ← 会话槽装载 / 回合尾落盘（自 `agent-host.mjs` 拆出——`loadAgentSlot` / `saveAgentSlot`；本档 §4 项 1 / 项 4）
│   ├── session-slots.mjs           ← 端壳：端名声明 END = "desktop" + `setSessionEnd(END)` + **转口八项**（marker 三项〔端参绑定〕+ 会话族五项：端参绑定 3〔`resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`〕· 纯 re-export 1〔`renameSlot`〕）（零算法副本——`docs/desktop/design/PROJECT.md` §2 KD-5）
│   ├── session-actions.mjs         ← 会话族动作层：五通道（create / switch / rename / delete / resume）+ 回执信封 `{ ok, reason: null|string, cwd, slot }`（`docs/desktop/design/IPC.md` §2 会话族注）
│   ├── sessions.mjs                ← 会话族读面：`sessions:list` 载荷投影（核 `listSlots` 条目 → 左列行）——零新增算法（`docs/desktop/design/IPC.md` §2 会话族注）
│   ├── projects.mjs                ← 当前项目（内存态）与最近目录面——读面 = 核会话槽面回读、零新存储（`docs/desktop/design/IPC.md` §2 项目面注 · `docs/desktop/design/PROJECT.md` §2 KD-9）
│   ├── settings.mjs                ← 设置族三面（`config:write`——键白名单仅 `locale` · `model:list` · `settings:agent`）——三面共用核 `loadConfig` / `writeConfigAtomic`
│   ├── providers.mjs               ← 渠道族四通道（`provider:list` / `save` / `remove` / `verify`——值面住核、端侧零形状构造）
│   ├── mcp-servers.mjs             ← MCP 族三通道（`mcp:list` / `save` / `remove`——探活失败 ⇒ 零写盘）
│   ├── project-info.mjs            ← 项目级信息族（`ledger:read` / `batch:status`——台账经核动态 import；相位 = `readManifest(cwd)` 回执 `manifest.phase`）
│   └── attachments.mjs             ← 附件落盘（渲染面 `dataURL` → 主进程落文件 + 核 `appendImagePointer` 锚点——渲染面零 fs；批 B（实读 **125**——预算 = `docs/desktop/design/PROJECT.md` §4.1））
├── src/preload/preload.cjs         ← 沙箱 CJS 窄桥：contextBridge 暴露 window.thincoder（`docs/desktop/design/PROJECT.md` §2 KD-3）
├── renderer/                       ← 前端（Chromium——无 Node，零框架零构建）
│   ├── index.html · styles.css · chat.css · pool.css · settings.css
│   ├── app.mjs                     ← 引导：接线装配（会话族 / 对话流 / 池面）→ 驱动 store（池面接线拆出 `mount-pool.mjs`；设置面 / 向导接线拆出 `mount-settings.mjs`；批 A 输入区接线拆出 `mount-composer.mjs` + **会话族接线拆出 `mount-sessions.mjs`（关闭尾 / 行控件两件出口）** + 批 A 修正轮卡族出站拆出 `mount-cards.mjs`；事件订阅住 `events-subscribe.mjs`）
│   ├── events.mjs                  ← 事件归约面：`ev:*` 十通道 → 切片写者（`reduce` 纯函数 + `applyPage` / `blockOfMessage`——零 DOM；批 A：`ev:question` / `ev:task` 由直返改写切片 `questions` / `tasks`）
│   ├── events-subscribe.mjs        ← 订阅接线（自 `events.mjs` 拆出——`attachEvents({ on, store, invoke, onTurnTail })`（实读 **68**——`docs/desktop/design/PROJECT.md` §4.1 · 批 B 末实读）：十通道订阅 + 回合尾标题刷新 + 输入区 flush 窄口；单向依赖归约档）
│   ├── mount-pool.mjs              ← 活动池面接线（自 `app.mjs` 拆出——在册预案落形，`docs/desktop/design/PROJECT.md` §4.1）
│   ├── mount-settings.mjs          ← 设置面 / 向导接线出档（自 `app.mjs` 拆出——批 9 拆分落形（批 B 拆出向导接线族 `mount-onboarding.mjs`——实读 **426**；在册例外续期 / 拆分预案 = `docs/desktop/design/PROJECT.md` §4.1）；通道接线与表单装配，视图构树住 `views/settings.mjs`）
│   ├── mount-composer.mjs          ← 输入区挂载出档（自 `app.mjs` 拆出——批 A（实读 **348**——`docs/desktop/design/PROJECT.md` §4.1 · 批 B 末实读〔越 300 ⇒ 拆分预案见该档 §4.1〕））：两态落形 · Enter / Shift+Enter 键位 · 忙态入队 + 满队提示 · 回合尾三径 flush 队首（先发后出队）· 批 B：附件条挂载（根锚 `data-attachments`——构树 / 采集住 `attach.mjs`）+ 末条复制控件（`data-action="chat:last"`）（形态单源 = `docs/desktop/design/UI.md` §1 输入区行）
│   ├── mount-head.mjs              ← 会话头接线（批 B（实读 **147**——`docs/desktop/design/PROJECT.md` §4.1）：会话头三值就地可改（`data-field` 内嵌 `select`——候选 = `model:list` / `provider:list` 投影）+ 状态栏读数节点（`data-usage`）；形态单源 = `docs/desktop/design/UI.md` §1 会话头 / 状态栏行）
│   ├── attach.mjs                  ← 附件采集与构树纯函数（批 B（实读 **146**——`docs/desktop/design/PROJECT.md` §4.1）：输入区 `paste` → `FileReader` → `dataURL` 条目集 + 移除控件；**零 fs** ⇒ 平 node 直测）
│   ├── mount-sessions.mjs          ← 会话族接线出档（自 `app.mjs` 拆出——批 A 拆分落形（实读 **197**——`docs/desktop/design/PROJECT.md` §4.1））：开页三路（`openPage` / `activateSession` / `createSession`）· 关闭尾 `closeTail`（三调用点）· 行控件两件出口（改名 / 删除接线）· 刷新面（通道面 = `docs/desktop/design/IPC.md` §2 会话族注）
│   ├── mount-cards.mjs             ← 卡族挂载与出站（批 A 修正轮（实读 **149**——`docs/desktop/design/PROJECT.md` §4.1））：`question:respond` 出站（作答 / 取消两向）
                                      + 回执 `ok` 真 ⇒ 清本键 `questions` 切片（`clearQuestion` 增导出 = `thincoder-desktop/renderer/events.mjs`）+ 清位标 + 卡挂载（计划卡零出口——纯呈现）（形态单源 = `docs/desktop/design/UI.md` §1 提问呈现行）
│   ├── dom.mjs                     ← 手写 DOM 工具（元素构造 / 事件委托 / 增量渲染）
│   ├── i18n.mjs                    ← 词表面：核域键取 `config:read` 语言面下发投影 + 宿主 UI 专有键（两语）+ `t()`（供给面 = `docs/desktop/design/IPC.md` §2）
│   ├── store.mjs                   ← 单状态树 + 订阅（会话 / 标签页 / 活动池 / 待审批 / 设置 / 项目级信息——批 9 增两切片；批 A 增 `questions` / `tasks` 两切片 + 队列三纯动作 `enqueue` / `dequeue` / `drainQueue`——`pool.queue` 唯一写面 · 满队常量 `QUEUE_MAX`；批 A 修正轮增换形态态 `railForm{ key, mode }` + 两纯动作 `openRailForm` / `closeRailForm`）
│   └── views/                      ← chat.mjs · chat-stream.mjs · chat-scroll.mjs · chat-tool.mjs · chat-copy.mjs · chat-guide.mjs · approval.mjs · question.mjs · plan.mjs · sessions.mjs · tabbar.mjs · chrome.mjs · activity.mjs · settings.mjs · settings-sections.mjs · onboarding.mjs · info-row.mjs
├── scripts/check-dist.mjs          ← 产物校验（照扩展端 check-vsix 先例）
└── test/                           ← run.mjs（单入口）+ files.mjs（显式清单 · 两向自检）+ 用例模块**三十五档**
                                      （`{host-floor,guard-closure,agent-host,agent-host-question,events-reduce,history-page,session-io,session-prefs,agent-host-usage,session-contract,projects,store,views,views-tabbar,views-tabbar-close,views-chrome,views-chrome-vocab,views-head,views-locks,
                                      views-chat,views-chat-frame,views-chat-scroll,views-chat-guide,views-approval,views-activity,events-page,views-question,
                                      settings,providers,mcp-servers,project-info,views-settings,views-onboarding,views-attach,attachments}.test.mjs`——名序 = `thincoder-desktop/test/files.mjs` 现值同序）
                                      + 集成域（`integration/`——E2E 用例 `settings-panel.test.mjs` / `first-run-smoke.test.mjs` · 单列）
                                      （共享助手（非清单档）＝ `fake-dom.mjs` · `slot-sandbox.mjs` · `views-harness.mjs`）
```

**作用域注**：本树只落**模块形态与一行职责**；逐文件**行数预算**单源 = `docs/desktop/design/PROJECT.md` §4.1——本树不复制预算列。

**分层铁律**：渲染面代码**不得** import 任何 `node:` 内置或 `@thincoder/core`（照扩展端守卫先例——渲染面静态闭包不得到达 `node:sqlite`：`thincoder-vscode/test/engine-floor-guard.test.mjs`）；跨面一律走 `window.thincoder`（通道面 = `docs/desktop/design/IPC.md` §1 / §2）。

## 2. 宿主面职责（形态索引）

本表 = **职责索引**（形态一行 + 落点）：决策理由住 `docs/desktop/design/PROJECT.md` §2，逐文件预算住同档 §4.1——本表不重复其内容。

| 面 | 形态 | 落点 |
|---|---|---|
| 入口与单实例 | `main.mjs` = 单实例锁 → 协议注册 → 窗口；ready 前初始化一律 await | `docs/desktop/design/PROJECT.md` §4.1 |
| 窗口 · 菜单 · 系统主题 | `window.mjs` = BrowserWindow 生命周期 / 菜单 / 系统主题；**菜单（首版）= 原生菜单只挂主进程动作**（窗口 / 缩放 / 退出 / 开发者工具 ＋ **平台惯例 Edit 组**〔内建 `role:`，非通道〕——通道面注 = `docs/desktop/design/IPC.md` §1） | `docs/desktop/design/PROJECT.md` §4.1 |
| `app://` 供给 | 自定义标准协议（standard + secure + supportFetchAPI）+ 路径逃逸防护；不直载 `file://` | `docs/desktop/design/PROJECT.md` §2 KD-2 |
| 预载窄桥 | 沙箱 CJS 预载 + `contextBridge` 暴露白名单通道为 `window.thincoder`；渲染面零 Node | `docs/desktop/design/PROJECT.md` §2 KD-3 · `docs/desktop/design/IPC.md` §1 / §2 |
| 启动自检 | 断言 `process.versions.node` 与 `node:sqlite` 可加载；不满足 ⇒ 显式报错退出（自检本身 = 判据） | `docs/desktop/design/PROJECT.md` §2 KD-7 · §7 用例 T-DSK15 |
| 配置写面 | 一切配置写入经核唯一执行体 `writeConfigAtomic`（`stat → read → mutate → 原子写`四步住核；mtime 冲突 ⇒ 非 ok + `.bak-{ts}` 留现场——`thincoder-core/config-io.mjs:78`）；端侧零自写盘、零 provider 形状构造 | `docs/desktop/design/PROJECT.md` §2 KD-10 · `docs/desktop/design/IPC.md` §2 设置族与项目级信息族注 |

## 3. 与核的接口面逐项点名（七面）

| 面 | 本端消费的核入口 | 本端**不做**的事 |
|---|---|---|
| 配置 | 读 = 核 `loadConfig`；写 = 核**唯一执行体** `writeConfigAtomic`（共享 `~/.thincoder/config.json`——含凭据明文落档契约） | 不另立配置格式 / 不做第二份 key 存储（SecretStorage 类本端无）· **端侧零自写盘**（`docs/desktop/design/PROJECT.md` §2 KD-10） |
| 会话 | 槽位模型与 manifest 面（核 `@thincoder/core/session-slots.mjs` 族纯转口）+ 端名声明 `END = "desktop"`（`setSessionEnd(END)` 一次）+ **转口八项**（marker 三项〔端参绑定〕：`endMarkerPath` / `readEndMarker` / `writeEndMarker` + 会话族五项：端参绑定 3〔`resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`——无端参〕· 纯 re-export 1〔`renameSlot`〕）——零算法副本（`docs/desktop/design/PROJECT.md` §2 KD-5） | 不另立会话目录 / 不另写 marker 读写实现（算法归核单源） |
| 记忆 | 核记忆工具族 + 检索（`memory` / `code_search` / `doc_search` 走 agent 工具面） | 不自持记忆实现、不做降级路径（`docs/desktop/design/PROJECT.md` §2 KD-7） |
| 工具 | 内置工具静态表 + 家族段（核 `agent-tools/` 与 `agent/family-tools.mjs` 经壳装配注入） | 不复制工具实现、不另写文件 / 进程工具（进程终止**复用** `thincoder-core/tools/process-tree.mjs`） |
| 审批 | 两条门（批审批 ∥ 逐项，实读 `thincoder-core/agent/dispatch.mjs:281-303`）→ IPC `ev:approval` | 不在渲染面实现权限判定（判定与串行化留核） |
| 活动事件 | `onToken`（含 `⟦ev⟧` 内联事件族）· `onAgentTurn` · `onToolCall` · `onToolOutput` · `onToolResult` · `onQuestion` | 不另起事件总线、不落第二份轨迹（轨迹落核 `traces/`） |
| 项目级信息 | 核 `buildScan`（`thincoder-core/ledger.mjs:114`——**经动态 import**）给台账计数 / 超阈 · 核 `readManifest(cwd)` 给批次相位（**回执 `manifest.phase`**——`thincoder-core/manifest.mjs:334`；非 ENOENT 读错上抛直传） | 不携会话 `key`（项目一份）· 不直读核内表 / 不落第二份台账读数（`docs/desktop/design/IPC.md` §2 设置族与项目级信息族注） |

**不改核**：本端设计面**无一处**要求核新增 / 修改能力——**不改核机制语义**；marker 家族端参数化与创建端字段已由核侧批落地（`thincoder-core/session-slots.mjs:99` / `:107` / `:109`），本端只声明端名并转口（`docs/desktop/design/PROJECT.md` §2 KD-5）。
**批 B 例外（授权在案）** = 核面**纯加法**三处（槽字段 `effort` + `setSlotPrefs` 写出口 + `saveSession` 携带——授权 = 批次档 §1.2 A；同项录入 = `docs/desktop/design/PROJECT.md` §4.2）。

## 4. 壳装配第三份

形态对齐另两端先例（CLI 侧 `assembleAgent` ∥ 扩展端 `buildTopLevelAgent`）：**同一份契约、第三种装配**——本端 `thincoder-desktop/src/main/agent-host.mjs` 主责，回调桥 / 待决门 / 槽 I-O 三面已成出档（`agent-bridge.mjs` / `suspensions.mjs` / `session-io.mjs`——§1 树同源）：

1. 载核与实例化 agent（cwd = 当前项目目录——**主进程内存态**、项目面 = `docs/desktop/design/IPC.md` §2 项目面注；provider / 模型 / 档位 / 工程模式**槽值优先**——`effort` 未设（`null`）⇒ 回落**渠道默认**（槽字段已落 · 配置回落支批 B 删——KD-17）；槽装载 = `session-io.mjs` 的 `loadAgentSlot`——槽缺 ⇒ 新建形）；
2. 注入核回调集 → 转成 IPC 事件（`docs/desktop/design/IPC.md` §1）——回调**逐条映射**，不改核签名；
3. 工具族装配（静态表 + 家族段 + 本端注入面）；
4. 回合驱动与中断（`msg:send` / `msg:interrupt` → 核 run / abort 面）——**主侧本体已落**（单驱动器：在飞再发 ⇒ `busy`；中断 = `signal.abort()`；回执形 = `docs/desktop/design/IPC.md` §2）；**回合尾落盘已落**（三路终局 done / stopped / error 同序 `saveAgentSlot`——**先落盘再出终局事件**，`thincoder-desktop/src/main/session-io.mjs`）；
  UI 输入区与中断键**批 A 已落**（挂载 = `thincoder-desktop/renderer/mount-composer.mjs`——形态单源 = `docs/desktop/design/UI.md` §1 输入区行）；
5. 待审批项登记（供活动池计数与标签位——**同一事实只存一处**：挂起表在主进程，渲染面只呈现）；**响应通道** = 渲染面出口 `approval:respond`（`docs/desktop/design/IPC.md` §2——白名单 + 处理体，未装配 ⇒ fail-loud）；
  **挂起表供给已落**——表住 `thincoder-desktop/src/main/suspensions.mjs`（**唯一持有点**：`promptId → { kind, shape?, key, resolve }`——`kind` 两值 = `approval` / `question` · `shape` 两值 = `single` / `batch`（verdict 闭集选择 discriminator；批 A 修正轮））·
  五操作 `askSingle` / `askBatch` / `askQuestion` / `denyGates` / `respond`（批 A 增 `askQuestion`——提问门：登记后自 post `ev:question`，渲染面作答经 `question:respond` 回执解除）·
  verdict 闭集两套（逐项 `once` / `always` / `reject` ∥ 批门 `approveAll` / `deny` / `oneByOne`）· `promptId` 主侧生成 · 表清两时点 = 出站 respond ∨ 门 resolve。

**两项显式端差（登记）**：MCP 连接不入装配面（通道与探活 = `thincoder-desktop/src/main/mcp-servers.mjs`——批 9 落，仍不入装配面）· `attachManifest` 工程模式 M1 钩子不附着（「装配即 attach」的 CLI 形态不作本端先例）——两差无静默降级（登记 = `docs/desktop/design/PROJECT.md` §10）。

**共享化议题不并入本批**（需求档 §2 壳装配行 + 批次档 §1.5）：第三份装配是否抽共享层 = 独立议题。

## 变更记录

- 2026-09-25：建档（桌面端设计批 1 · 分档轮）——由 `docs/desktop/design/PROJECT.md` 分出宿主适配层面：§1 = 该档 §3.1 逐字（目录树与分层铁律同搬）；§2 = 宿主面职责索引（树注归并 · 决策仍住该档 §2 / §4.1）；§3 = 该档 §3.3 逐字；§4 = 该档 §3.4 逐字。该档 §3.1–§3.4 位置改留一行指针；树内与表内 `§` 回指随动改为带路径指针。
- 2026-09-25（**修正轮**——设计评审 §3 轮次 1 发现 3 / 11）：§1 树内 `package.json` 行收正为 script 三条（单源 = `docs/desktop/design/PROJECT.md` §5）；§2 窗口行补**菜单首版口径**注（只挂主进程动作）；§4 项 1 cwd 补项目面指针。
- 2026-09-25（**修正轮 2**——设计评审 §3 轮次 2 发现 13）：§1 树补两行（`src/main/projects.mjs`（拟新增） · `renderer/i18n.mjs`（拟新增））· `test/` 行扩用例模块五档——三处均与 `docs/desktop/design/PROJECT.md` §4.1 同源；`main.mjs` 行补启动自检 · `window.mjs` 行补「窗口态」；树后补作用域注（逐文件预算单源 = §4.1）。
- 2026-09-25（**实施后修正轮**——SLOT-END-PARAM 落地同步 · R-2 / U1 / U3 / D4）：§1 树增 `host-floor.mjs` 行 + `session-slots.mjs` 行改端壳口径（端名声明 + 四项绑定转口）；§2 窗口行补平台惯例 Edit 组（内建 `role:`，非通道）；§3 会话行改端名声明形态 · 「不改核」行改核侧已落地口径（端参数化 + 创建端字段）。
- 2026-09-25（**实施后修正轮 2**——树行同步）：§1 树 `src/main/` 块补 `thincoder-desktop/src/main/sessions.mjs` 行（会话族读面）· `views/` 行补 `thincoder-desktop/renderer/views/chrome.mjs`（拟新增）——批 4 中区外壳面；两行均与 `docs/desktop/design/PROJECT.md` §4.1 同源。
- 2026-09-25（**实施后修正轮 2**——用例模块 + 标记）：`test/` 行用例模块五档 → **六档**（补 `thincoder-desktop/test/views.test.mjs`——同档 §4.1 用例模块行同值）· 树首行「（拟新增）」标记删（产品端已落；其余未落档行标记保留）。
- 2026-09-25（**批 4 修后收正轮 #57**——档数收正）：§1 树 `test/` 行用例模块**六档 → 七档**（补 `thincoder-desktop/test/views-tabbar.test.mjs`——与 `docs/desktop/design/PROJECT.md` §4.1 用例模块行同源同值）。
- 2026-09-26（**批 5 会话族批**）：§1 树增 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行（会话族动作层）· `thincoder-desktop/src/main/session-slots.mjs` 行改**七项绑定转口** + `renameSlot` 纯 re-export · `test/` 行用例模块七 → **八档**（补 `views-chrome`）；§3 会话行同值随动。
- 2026-09-26（**批 5 修复轮 #60**——设计评审 §3 轮次 1 发现 11 · 转口措辞）：§1 树 `thincoder-desktop/src/main/session-slots.mjs` 行与 §3 会话行**转口措辞分层**——端参绑定 6〔marker 三项 + `resumeSlot` / `switchToSlot` / `deleteSlot`〕· 同形转口 1〔`newSession`·无端参〕· 纯 re-export 1〔`renameSlot`〕。
- 2026-09-26（**批 5 修复轮 #60**——信封记法）：§1 树 `thincoder-desktop/src/main/session-actions.mjs`（拟新增）行信封记法统一（`reason: null|string`）。
- 2026-09-26（**批 5 实施后修正轮 #62**——逐号 3）：§1 树 `thincoder-desktop/src/main/session-actions.mjs` 行「（拟新增）」标记删（已交付 · 实读 67）；`test/` 行八档名复核 = `thincoder-desktop/test/files.mjs` 现值（同值 · 未改）；本档变更记录 #60 两行内「（拟新增）」按**记录面留档**不改。
- 2026-09-26（**批 6 对话流 + 工具卡（视图面）**）：§1 树 `renderer/` 静态资源行加 `chat.css`（拟新增）· `test/` 行用例模块八 → **十档**（补 `views-chat` / `views-chat-scroll`——与 `docs/desktop/design/PROJECT.md` §4.1 同源同值）。
- 2026-09-26（**批 6 实施后修正轮 #69**）：§1 树 `views/` 行补 `chat-tool.mjs`（`chat-scroll.mjs` 之后——拆分落形档入树；与 `docs/desktop/design/PROJECT.md` §4.1 同源同值）。
- 2026-09-26（**批 7 审批与活动池视图面**）：§1 树 `renderer/` 静态资源行加 `pool.css（拟新增）` · `views/` 行加 `approval.mjs（拟新增）`（`chat-tool.mjs` 之后——卡面属对话流族）· `test/` 行用例模块十 → **十二档**（补 `views-approval` / `views-activity`——与 `docs/desktop/design/PROJECT.md` §4.1 同源同值）；§4 项 5 补**响应通道在册 / 挂起表供给随装配批**注。
- 2026-09-26（**批 7 实施后修正轮 #76**）：§1 树去「（拟新增）」两处（`pool.css` / `approval.mjs`——已落档）· `test/` 行用例模块十二 → **十四档**（补实施期拆档两档 `views-locks` / `views-chat-frame`——与 `docs/desktop/design/PROJECT.md` §4.1 同序同值）；该行 §4.1 尾指针去重（行数预算单源指针住本档 §1 作用域注）。
- 2026-09-26（**批 7 实施后修正轮 #76 · 标记补遗**——一致性面）：§1 树四行补「（拟新增）」（`src/main/agent-host.mjs` · `src/main/settings.mjs` · `renderer/views/settings.mjs` · `renderer/views/onboarding.mjs`——盘上皆未落；与 `docs/desktop/design/PROJECT.md` §4.1 同项标记面一致）。
- 2026-09-26（**批 8 装配桥批**）：§1 树 `thincoder-desktop/src/main/agent-host.mjs` 行职责扩（挂起表 / 回合驱动——「（拟新增）」标记按盘上实态保留）·
  `renderer/` 块增 `events.mjs` 与 `mount-pool.mjs` 两行（拟新增 · 池面接线拆分落形）· `app.mjs` 行估括注改「拆出」（未落口径）·
  `test/` 行用例模块十四 → **十七档**（补 `agent-host` / `events-reduce` / `history-page`——与 `docs/desktop/design/PROJECT.md` §4.1 同源同值）；§4 项 4 / 项 5 收为已落口径（回合驱动主侧本体 · 挂起表供给 = `agent-host.mjs` 唯一持有点）+ 增**两项显式端差（登记）**注（MCP 随设置批 · `attachManifest` 不附着）。
- 2026-09-26（**批 8 doc-check 清项轮**）：§1 树 `test/` 行与变更记录批 8 行**行宽收正**（312 → 两行 / 443 → 三行 ≤300）+ §4 项 5 挂起表供给行前向引用补「（拟新增）」标记（`agent-host.mjs`）——零语义变更。
- 2026-09-26（**批 8 修正轮 #91**——逐号定点）：§1 树**去「（拟新增）」五处**（`agent-host.mjs` / `events.mjs` / `mount-pool.mjs`——盘上皆已落；`app.mjs` 行内 `mount-pool.mjs` 括注 · 下条新行内）· 增**四出档 / 拆出档行**（`agent-bridge.mjs` / `suspensions.mjs` / `session-io.mjs`——自 `agent-host.mjs` 拆出；
  `events-subscribe.mjs`——自 `events.mjs` 拆出）· `test/` 行用例模块十七 → **十九档**（名集 = `thincoder-desktop/test/files.mjs` 现值同序）+ 共享助手两档注（`fake-dom.mjs` / `slot-sandbox.mjs`——非清单档）；
  §4 前言补三出档 · 项 1 补**槽值优先 / `effort` 回退配置面**（`thincoder-desktop/src/main/session-slots.mjs:112`）与槽装载出档 · 项 4 补**回合尾落盘已落**（**先落盘再出终局事件**——`session-io.mjs`）· 项 5 挂起表改指 `suspensions.mjs` + 表项形状 / 四操作 / verdict 闭集两套；§3 活动事件行补 `onAgentTurn`；§4 项 4 / 项 5 与变更记录两行**行宽收正**（≤300——零语义）。
- 2026-09-26（**批 9 设置面 + 首启向导批**）：§1 树增 `renderer/mount-settings.mjs`（拟新增）行 · 静态资源行加 `settings.css（拟新增）` · `src/main/settings.mjs` 行职责改口径（读 `loadConfig` / 写 `writeConfigAtomic`）· `store.mjs` 行补两切片 · `test/` 行用例模块十九 → **二十五档** + 六档名（与 `docs/desktop/design/PROJECT.md` §4.1 同源同序同值）；
  §2 增**配置写面**行；§3 六面 → **七面** + 增**项目级信息**行 + 配置行改双面口径（写 = 核唯一执行体）；§4 端差行 MCP 项补通道处理体落点（`mcp-servers.mjs`）。
- 2026-09-26（**批 9 修复轮 #94**——设计评审 §3 十条逐号 + doc-check 清项）：§1 树 `src/main/` 增三行（`providers.mjs` / `mcp-servers.mjs` / `project-info.mjs`——职责与 `docs/desktop/design/PROJECT.md` §4.1 同源）+ `settings.mjs` 行改**三面**口径 · `test/` 名单行**行宽收正**（366 → 两行 ≤300——零语义）·
  §4 端差行前向引用补「（拟新增）」（`mcp-servers.mjs`——盘上未落）。
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮）：§1 树**去「（拟新增）」九处**（`src/main/` 四行 · `settings.css` · `mount-settings.mjs` · `views/` 行两档 · §4 端差行——盘上皆落；`mount-settings.mjs` 行补实读 **458** 指针 = `docs/desktop/design/PROJECT.md` §4.1）；
  `test/` 行共享助手**两档 → 三档**（补 `views-harness.mjs`——非清单档，与 `docs/desktop/design/PROJECT.md` §4.1 用例模块行同源同值）；
  明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
- 2026-09-26（**批 9 修正轮 #9 续**——表补项 21）：§1 树 `app.mjs` 行括注补第三拆出档 `mount-settings.mjs`（与 `mount-pool.mjs` 并列；同面 `mount-settings.mjs` 行已载「自 `app.mjs` 拆出」——行面补齐）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.17。
- 2026-09-26（**批 A 对话面板批**——一致性随动）：§1 树 `agent-bridge.mjs` 行补注入四键（`post` / `askSingle` / `askBatch` / `askQuestion`——批 A 第 4 键）· `suspensions.mjs` 行四操作 → **五操作**（+ `askQuestion`）+ `kind` 两值 · `app.mjs` 行补拆出档 `mount-composer.mjs` · `events.mjs` 行补两切片改写（`questions` / `tasks`）·
  `store.mjs` 行补两切片 + 队列三纯动作 + 满队常量；
  `views/` 行补 `question.mjs` / `plan.mjs`（拟新增）· `test/` 行用例模块二十五 → **二十六档**（补 `views-question`）；§4 项 4 的「UI 输入区与中断键随视图批」收正为**批 A 已落**（挂载 = `thincoder-desktop/renderer/mount-composer.mjs`）+ 项 5 挂起表四操作 → **五操作** + 提问门一句（与 `docs/desktop/design/PROJECT.md` §4.1 同源）。
- 2026-09-26（**批 A · ⑤**——随动）：§1 树 `views/` 行补 `tabbar.mjs`（拟新增——标签条面自 `thincoder-desktop/renderer/views/sessions.mjs` 拆出）· `test/` 行用例模块二十六 → **二十七档** + 名单补 `views-tabbar-close`（确认面族自 `thincoder-desktop/test/views-tabbar.test.mjs` 拆出——与 `docs/desktop/design/PROJECT.md` §4.1 同源同值）。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：§1 树增卡族两行（`mount-composer.mjs` / `mount-cards.mjs`——皆拟新增 · 卡族出站承载档点名）+ `app.mjs` 行补卡族出站拆出档 · `suspensions.mjs` 行与 §4 项 5 表项形收正（`promptId → { kind, shape?, key, resolve }`——verdict 闭集选择判据 = `shape`）· `store.mjs` 行补换形态态 `railForm{ key, mode }` + 两纯动作。
- 2026-09-27（**批 E2E · 实施后对账轮**）：§1 树同步本批新面——`package.json` 行 devDeps 补 `playwright-core`（E2E 驱动 · 测试面）+ 增 `.gitignore` 行（忽略 `thincoder-desktop/test/artifacts/`——单源 = `docs/desktop/design/E2E-TESTING.md` KD-10）
  + `test/` 行补集成域（`integration/`——E2E 用例 `settings-panel.test.mjs` · 单列）；与 `docs/desktop/design/PROJECT.md` §4.1 同源同值（明细 = `docs/batches/2026-09-26-desktop-e2e-infra.md` §2.11）。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§1 树 `app.mjs` 行补会话族拆出档 `mount-sessions.mjs` + 该档树行入册 · `events-subscribe.mjs` 行补第 4 键 `onTurnTail` ·
  `mount-composer.mjs` / `mount-cards.mjs` / `views/` 三处去「（拟新增）」· `views/` 行补 `settings-sections.mjs`（登记）· `test/` 行用例模块 **二十七 ⇒ 二十八档** + 名单补 `agent-host-question`。明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：§1 树收正——`events.mjs` / `events-subscribe.mjs` 两行九 → **十通道**（`ev:usage` 入册）· `mount-composer.mjs` 行实读收正（**251 ⇒ 262 ⇒ ~282**）· `events-subscribe.mjs` 行补批 B 估值（**68 ⇒ ~70**）；
  `test/` 行用例模块 **二十八 ⇒ 三十档** + 名单补 `session-prefs` / `views-attach`；§4 项 1 槽值优先口径收正（`effort` 未设 ⇒ 回落渠道默认——删除配置回落支陈旧坐标）· §3 「不改核」行补限定（不改核**机制语义**；批 B 纯加法三处，授权在案）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 收口轮**——实施后随动收正 · 数值对盘）：§1 树新行五（`thincoder-desktop/src/main/attachments.mjs` **125** · `thincoder-desktop/renderer/mount-onboarding.mjs` **88** · `thincoder-desktop/renderer/mount-head.mjs` **147** · `thincoder-desktop/renderer/attach.mjs` **146** · `thincoder-desktop/renderer/views/chat-copy.mjs` **133**）· `views/` 行补 `chat-copy.mjs` 与 `info-row.mjs` · 值收正（`events-subscribe.mjs` **68**〔批 B 末实读〕 · `mount-settings.mjs` **426**〔拆出向导族后〕 · `mount-composer.mjs` **348**〔批 B 末实读〕）·
  `test/` 行用例模块 **三十 ⇒ 三十四档**（补 `agent-host-usage` / `views-chrome-vocab` / `views-head` / `attachments`）· §4 项 1 去「（拟新增）」标记；数值单源 = `docs/desktop/design/PROJECT.md` §4.1。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**）：§1 树 `views/` 行补 `chat-guide.mjs`（**54**——追加轮实读）· `test/` 行用例模块 **三十四 ⇒ 三十五档**（名单补 `views-chat-guide`——名序同 `thincoder-desktop/test/files.mjs`）·
  集成域两处并一处（用例 `settings-panel.test.mjs` / `first-run-smoke.test.mjs`）· 行宽重排（`test/` 名单条与本节条目超 300 ⇒ 分句断行——零语义）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
