# WEBVIEW（webview 界面面）— 需求 · VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；板块 = **webview 界面面**——本部分 UI 面（面板主界面：对话流 / 活动区 / 工具卡 / 输入面 / 状态面）。
> 对端 UI 面 = 终端 TUI（**异名对位**）——两端形态不镜像（端差逐条登记见 §4）。
> **设计侧 = 同层三档**——`design/WEBVIEW.md`（结构与活动区 · 块头形态）· `design/WEBVIEW-PROTOCOL.md`（消息协议 · 秩序/忙态 · 状态行）· `design/WEBVIEW-INPUT.md`（输入面 · 消息渲染契约）——**已由批 2 迁入基准层**（拆分记录 = `docs/vsc/design/VSC-MIGRATION.md` §6 · §9.2）。
> 本档**不重述**的权威源（D2）：webview 族节（行内转义 / 活动区回归 / live 块 UX / 活动区收口）= `AGENT-LOOP（VSC 侧·需求）` §10 / §12 / §14 / §16；完整输出落盘 = `TOOL-OUTPUT-LIMITS（VSC 侧）`。
> 来源 = `thincoder-vscode/docs/requirements/WEBVIEW.md`（VSC 产品树）——**原地一字未改，留作参照历史**（保留 ≠ 维护）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 第 1 批**）；坐标 = as-of 2026-09-12 实测 + 2026-09-15 迁移批实核（坐标一律改写为仓根相对路径）。

## 1. 总体需求

VSC 面板使用者在 webview 主界面完成全部交互：对话流、子代理活动、工具执行与历史回读必须**可见、可滚动、可回读**——
流式输出看着像活的（跟尾）、上滚阅读不被打断、历史能翻到底。
webview 只做 UI 渲染与用户交互；agent 循环与工具执行在 extension host（职责边界 = UI 适配层，经 `postMessage` 单向通信——`design/WEBVIEW.md` §1）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-W1 | **布局与活动区驻留**：垂直序 = 会话栏 → 消息区 → 活动区（子代理 / consult / advisor-async 活动块）→ 面板区 → 输入区；活动块**全程驻留**（live 固定可见，不随消息流滚动丢失）；终态消化回收后**归档落流**（消息区，形态不变）。证据 = `design/WEBVIEW.md` §2 / §5 · `thincoder-vscode/webview/activity.js` · `thincoder-vscode/webview/activity-view.js` | 活动区为空 → 零高隐藏（CSS `:empty`，零 JS）；live 块在区内固定可见（消息区滚动不影响）；回收后块以同形落 `#messages`（归档块）；区居民 = live + awaitingDigest（有界）。用例 = `thincoder-vscode/test/activity-flow.test.mjs` / `activity-closure.test.mjs` / `async-visibility.test.mjs` | 不改块头字段语义（字段表 = `design/WEBVIEW-PROTOCOL.md` §6.2）；不做浮动 / 弹窗形态；不复活旧 DOM-move 链（设计 = `design/WEBVIEW.md` §6 D-W4） |
| F-W2 | **流式跟随与滚动**：消息区默认钉底（流式跟随尾部）；上滚解钉（阅读历史不被打断）；回底复钉；悬浮回底钮；活动区块内容区独立跟滚。证据 = `thincoder-vscode/webview/ui.js:445-489` · `thincoder-vscode/webview/scroll.js:13-33` · `thincoder-vscode/webview/activity.js:115-135` · `thincoder-vscode/webview/streaming.js:27-65` | 钉底态下流式帧到达 → 视口保持贴底；上滚（距底 ≥24px——近底判据同源）→ 解钉（帧应用不再拉底）；回底 / 点回底钮 → 复钉；两层独立（消息区 / 活动区互不拉扯）。用例 = `thincoder-vscode/test/activity-live-ux.test.mjs` | 不做 `scrolled N` 状态串（端差——回底钮替代，本档 §4）；不逐 chunk 强制同步布局（见 §3 N-W3） |
| F-W3 | **历史懒加载**：打开会话只加载首窗（分页 200）；滚动近顶自动拉更早页；prepend 后视口锚定保持（正在读的行不跳）；无更早页不再请求。证据 = `thincoder-vscode/webview/history.js:23-87` · `thincoder-vscode/webview/state.js:63/89` · `thincoder-vscode/webview/ui.js:465-476` · `thincoder-vscode/src/extension/history-window.mjs:22` | 首渲 = 200 条 + `hasOlder` 真值（`HISTORY_PAGE_SIZE === 200` 断言）；`scrollTop ≤ 40` → 发 `loadOlder`（before 锚 = 已渲染外层消息的最早 `data-idx`）；prepend 后 `scrollTop = 原值 + scrollHeight 增量`（视口顶保持）；`hasOlder=false` → 零请求。用例 = `thincoder-vscode/test/history-window.test.mjs` / `session-boot.test.mjs` / `history-restore.test.mjs` | 不做计数行「… N more …」（端差——加载指示器形态，本档 §4）；live 消息无 idx（永不污染窗口——锚只取外层消息） |
| F-W4 | **工具调用卡**：每次工具调用产出一张卡（头 = 工具名 + 参数摘要 + 状态词）；执行中输出**流式追加**进卡体（长命令可看）；完成 → 状态 + 耗时 + 末行摘要，成功折叠 / 错误展开；恢复会话的完成卡与活卡终态同形。证据 = `thincoder-vscode/webview/ui.js:216-254/303` · `thincoder-vscode/webview/tool-card-restore.mjs:23` · `thincoder-vscode/webview/chat.js:139-160` · `thincoder-vscode/webview/lib.js:27-30` | `toolCall` → 卡（名 + args 前 80 字符 + 状态词）；`toolOutput` → 追加且卡展开（卡体超 64K 截断加注）；`toolResult` → 成功折叠（含耗时与末行摘要 ≤80）/ 错误保持展开；恢复卡折叠语义与活卡对齐。用例 = `thincoder-vscode/test/history-restore.test.mjs`（恢复面——含 live 对齐断言）；活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）**现无专属用例**（原 `chat-panel.test.mjs` 内覆盖随 2026-09-07 测试清空退场——非拆档迁出面；缺口登记 = 本档 N-W5） | 卡体不保留全文（全文在会话记录——`TOOL-OUTPUT-LIMITS（VSC 侧）` 面）；不做 `│ ` 前缀行间区块形态（端差，本档 §4） |
| F-W5 | **输入面 Enter 语义**：Enter 发送；组合期（IME）Enter 归输入法；`@` 下拉打开时 Enter 只接受建议；运行中拒发可见提示。证据 = `thincoder-vscode/webview/input.js:75-85` · `thincoder-vscode/webview/send.js` | 组合期 Enter → 零发送（不 preventDefault）；`@` 下拉打开 → Enter 归 autocomplete；busy 发送 → 拒发 + 可见提示；其余 Enter → 发送。用例 = `thincoder-vscode/test/webview-input-enter.test.mjs` | 不改 send 出口守卫（拒发门禁保持——只改按钮可见性，设计 = `design/WEBVIEW-PROTOCOL.md` §4.4） |
| F-W6 | **输入历史与多行竖移**：↑↓ 判定五态（IME 组合期 → `@` 下拉让位 → 历史态恒历史 → 单行任意位置 → 多行边界门）；草稿 stash；不劫持原生竖移。证据 = `thincoder-vscode/webview/input.js:86-110` · `design/WEBVIEW-INPUT.md` §2 | 历史态（`_historyIdx ≠ -1`）↑↓ 恒历史（连续上溯与回落）；多行非边界位置零劫持（原生竖移保留）；边界门 = 首行行首 ↑ / 末行行末 ↓ 触发；草稿恢复。用例 = `thincoder-vscode/test/webview-input-history.test.mjs` | 不引入列记忆状态；不跨出输入框（不滚动会话） |
| F-W7 | **忙态与消化轮可见指示**：忙态收敛（turnState）；停止钮常显；消化轮起跑可见（`.digest-status` 三态）；状态行段位（工具 / 耗时 / `turn N/M` / ✦reasoning / token——对位表 = `design/WEBVIEW-PROTOCOL.md` §6.1）。证据 = `thincoder-vscode/webview/chat.js:351-405` · `thincoder-vscode/webview/status-bar.js` · `design/WEBVIEW-PROTOCOL.md` §5 | digest 起跑 / 收尾两态渲染幂等（ok 旗标时序）；Stop 期间常显；状态行对位表逐项落位；端差项（ctx 绝对数 / `scrolled N` / attention chip / 键位提示）保持登记态（本档 §4）。用例 = `thincoder-vscode/test/webview-turnstate.test.mjs` / `digest-visibility.test.mjs` / `status-line.test.mjs` | 不做 attention chip（端差登记）；不做 `scrolled N`；不改发送门禁 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-W1 | 零依赖零构建 | webview 侧纯浏览器标准 API——无 npm 运行时依赖、无打包器（约束面 = `design/WEBVIEW.md` 头注） | `package.json` 零运行时依赖 + `npm run lint` 全绿；webview 目录零构建产物 |
| N-W2 | DOM / 内存有界 | 消息窗上限 150 块（含归档块——`thincoder-vscode/webview/ui.js:468-476`）；卡体上限 64K（`thincoder-vscode/webview/lib.js:27-30`）；离屏消息 / 工具卡跳过 layout/paint（`thincoder-vscode/webview/chat.css:474-475`）；活动区居民有界（live + awaitingDigest——设计 = `design/WEBVIEW.md` §5.1） | 常量在位（逐处源码锚）；长会话回归：裁剪后 `data-idx` 锚可将历史拉回（`thincoder-vscode/test/history-restore.test.mjs`） |
| N-W3 | 流式渲染性能 | 帧应用走 rAF 脏集路径——不逐 chunk 强制同步布局（`thincoder-vscode/webview/ui.js:449-450` 抄「写超值不读 scrollHeight」；`thincoder-vscode/webview/streaming.js:27` 注释） | 源码锚 + `thincoder-vscode/test/activity-live-ux.test.mjs`（帧应用不丢 / 节流重排） |
| N-W4 | 分页与恢复对位 | `HISTORY_PAGE_SIZE === 200`（`thincoder-vscode/src/extension/history-window.mjs:22`——跨端首窗对齐）；恢复保真（帧序 / 工具卡 / 时间戳形态） | 常量断言 = `thincoder-vscode/test/history-window.test.mjs`；`history-restore.test.mjs` 全绿 |
| N-W5 | 可机判 | 每条功能需求有既有用例面（活动族 / 输入族 / 历史族 / 状态族）；**登记在案的例外 1 条**：F-W4 活卡面现无专属用例——**消解路径** = 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）补测；**到期条件** = WEBVIEW 面下次被触碰时 / 下批收口前（依据 = `ENGINEERING-MODE（VSC 侧·需求）` §1.3 F14 第三子条）；测试档登记入 `thincoder-vscode/test/files.mjs`（清单制） | `node test/run-fast.mjs` 全绿 + 档名在册；登记在案的例外 1 条（消解路径 + 到期条件在位） |
| N-W6 | 端差显式 | 各端独立实现、语义同源；端差逐条登记（本档 §4），不静默（同规 = `AGENT-LOOP（VSC 侧·需求）` §16 N-CL4） | §4 表逐行在位；无未登记放行通道（`ENGINEERING-MODE（VSC 侧·需求）` §1.3 F14） |

## 4. 对位与端差登记（对位 = `TUI（CLI 侧·需求）` + `TUI-TOOL-OUTPUT（CLI 侧·需求）`）

> 读法：逐行对位 CLI 需求行 → 本端对位 → 端差；「等价」= 语义同源且形态对位；端差 = 各端形态差异（登记不静默）。
> 端差判据以本端实测与 `design/WEBVIEW-PROTOCOL.md` §6.1 · §6.2 对位表为准；对端行号以其文档为准（本档不代述对端正文）。TTO = `TUI-TOOL-OUTPUT（CLI 侧·需求）`（下文行标简写）。

| CLI 行（对位参照） | 本端对位 | 端差（登记） |
|---|---|---|
| TUI F1–F5（跟随 / 暂停 / 锚定补偿 / 恢复 / 滚动入口） | F-W2 | 入口 = 滚动容器 + 悬浮回底钮（对端 = PgUp/PgDn + 滚轮）；`scrolled N` 不做（钮替代）；锚定补偿面 = 历史 prepend（`thincoder-vscode/webview/history.js:58-61`）——追加不位移 DOM 视口 |
| TUI F6（懒加载） | F-W3 | 触发 = 滚动近顶（`scrollTop ≤ 40`）；页大小 200（两端对齐——N-W4）；数据源 = 宿主会话记录（磁盘为准） |
| TUI F7（头部分页标记） | F-W3（加载指示器） | 本端 = `loadOlder` 加载指示（`thincoder-vscode/webview/history.js:23/33`）+ `hasOlder` 门；无「N more」计数行 |
| TUI F8（子代理嵌套活动显示） | F-W1 | 块形态 = 活动区驻留 + 收口落流两态（设计 = `design/WEBVIEW.md` §5.1）；嵌套行随外层块（`thincoder-vscode/webview/ui.js:38` 注释口径）；不做嵌套独立小节 |
| TUI F9（picker 附注渲染） | 本端无全屏 picker——模型选择 = 下拉部件（`thincoder-vscode/webview/model-picker.js` / `model-menu.js`） | 形态端差：全屏列表 vs 下拉 / 面板；无 80 列渲染预算概念 |
| TUI F10（选择面分工与契约） | question 卡（`thincoder-vscode/webview/question.js`）+ 模型下拉 + 设置对话框 | 各端组件面自持（不镜像）；交互契约差异登记于各端设计 |
| TUI F11（输入框方向键编辑） | F-W6 | 语义同源（同款竖移规则——对端文档明载其口径引本端同款）；呈现载体各端自持 |
| TUI F12（`/advisor` 子菜单） | advisor 配置面 = 设置面板（`thincoder-vscode/webview/settings-models.js` advisor 区） | 命令子菜单（对端）vs 面板表单（本端）——入口形态端差 |
| TUI F13（attention 态） | 本端对位 = 工具条按钮 active + plan 徽标 + 权限 / 提问卡流内可见 | **端差（明确登记）：attention chip 不做**（设计 = `design/WEBVIEW-PROTOCOL.md` §6.1）；无系统级通知 / 闪烁 |
| TUI N1–N2（滚动 / 加载不卡） | N-W3 / N-W2 | 机制端差：终端渲染缓存 vs DOM 窗口化 + 离屏跳过 |
| TUI N3（跨端对齐） | N-W4 | 等价（分页常量两端对齐 200） |
| TUI N4（零依赖） | N-W1 | 等价（两端同政策） |
| TUI N5–N6（防刷屏 / 省略计数真值） | 块折叠形态（冻结头 + tail——设计 = `design/WEBVIEW-PROTOCOL.md` §6.2） | 冻结头 + tail-3 同形态保持（等价）；本端截断标记不含计数（`thincoder-vscode/webview/lib.js:30` 注文本）——「省略 N 行」体系端差 |
| TUI N7（选择面行宽预算） | —（本端无 cols 固定宽面） | 不适用：面板自适应宽度；预算式不入本端 |
| TUI N8（方向键编辑约束） | F-W6 | 等价（零列记忆两端同）；载体 = 浏览器输入框原生编辑 + 判定五态 |
| TUI N9（attention 零侵入） | —（随 F13 行） | attention chip 不做（登记态）；无空闲重绘面 |
| TUI N10（显示层内存有界） | N-W2 | 口径端差：对端 = 各载体字符额度族；本端 = 块窗 150 + 卡体 64K + 离屏跳过（DOM 面） |
| TTO FR1–FR3（行间区块 / 滚动内容 / 完成行） | F-W4 | 形态端差：卡片（折叠 / 展开）vs 行间区块（`❯` / `│` 前缀）；完成语义同（done / 失败 + 耗时 + 摘要） |
| TTO FR4（完整输出落盘） | `TOOL-OUTPUT-LIMITS（VSC 侧·需求）`（本档不重述——D2）；呈现面 = 卡体预览 | 无端差（同机制——本端已自持对位档） |
| TTO NFR1（区块渲染性能） | N-W3 | 等价（增量路径） |
| TTO NFR2（单一输出入口） | 消息族 `toolCall` / `toolOutput` / `toolResult`（`thincoder-vscode/webview/chat.js:139-141`） | 接口形态端差：宿主回调 vs postMessage 消息族 |

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/WEBVIEW.md`（VSC 产品档）——**原地保留作参照历史**。下列内容**不并入本档**：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 头注「本仓自持需求档」建档依据段 | 建档依据（F11 / §8.6 建档规则） | 时点材料——需求已住基准层，自持理由不再需要 |
| 头注「实测口径 as-of 2026-09-12」 | 时点口径行 | 时点材料——本档首注已给口径 |
| 旧档 §5「变更记录」（2 条：建档 / N-W5 收正） | 逐批流水 | 历史叙述——本档自有变更记录 |

### 5.2 迁移期状态登记（**非**不并项——须随批收口）

| # | 事项 | 现状 | 收口点 |
|---|---|---|---|
| 1 | 设计侧三档（`design/WEBVIEW.md` · `WEBVIEW-PROTOCOL.md` · `WEBVIEW-INPUT.md`）**已迁入基准层**（批 2） | 本档 §1 / §2 的设计节引用已翻转为**同层引用**（`design/<档>.md` §N——`docs/core/design/DOC-SYSTEM.md` §7 R2 层前缀形态） | 本批已收口 |
| 2 | `AGENT-LOOP（VSC 侧·需求）` §10 / §12 / §14 / §16 未迁入基准层 | 同上 | 统一面批次（`docs/core/requirements/AGENT-LOOP.md` 并入后翻转） |
| 3 | 测试档路径按仓根写（`thincoder-vscode/test/...`） | 已按现状改写（产品树仍在） | 产品树降格后随批收口 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 第 1 批**）：建档——`thincoder-vscode/docs/requirements/WEBVIEW.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为仓根相对现状路径（代码 / 测试档锚全部加 `thincoder-vscode/` 前缀）；设计节与对位档引用改用迁移期现状口径（§5.2）；时点材料与逐批流水入 §5.1。

- 2026-09-15（**B 式迁移轮 · VSC 第 2 批**）：设计侧引用**翻转**——源档 `WEBVIEW（VSC 侧）`（1867 行）已拆三档迁入基准层
  （`design/WEBVIEW.md` · `design/WEBVIEW-PROTOCOL.md` · `design/WEBVIEW-INPUT.md`），本档 §1 / §2 / §4 的设计节引用改同层引用（R2 层前缀）；
  §5.2 第 1 条**收口**；漂移坐标按现态收正（`chat.js` 353-390 → 351-405 · `chat.css` 471 → 474-475）。
