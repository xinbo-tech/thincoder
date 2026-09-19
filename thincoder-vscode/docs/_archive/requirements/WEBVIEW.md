# WEBVIEW（webview 界面面）— 需求（VSC 仓）

> 板块：webview 界面——本端 UI 面（面板主界面：对话流 / 活动区 / 工具卡 / 输入面 / 状态面）。对端 UI 面 = 终端 TUI（异名对位）。
> 本档为**本仓自持需求档**（异层者建档——需求住本仓；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11 + `LEDGER-SELF-CONTAINED（本仓·设计）§8.6` 建档规则）。
> 对位档：`TUI（CLI 仓·需求）` + `TUI-TOOL-OUTPUT（CLI 仓·需求）`——一档承载两行；语义同源、本端原文自持（不做逐字一致）；端差逐条登记见本档 §4。
> 设计见 `WEBVIEW（本仓·设计）`；webview 族节（行内转义 / 活动区回归 / live 块 UX / 活动区收口）= `AGENT-LOOP（本仓·需求）§10 / §12 / §14 / §16`——本档不重述（D2 单一权威源）。
> 实测口径 as-of 2026-09-12（file:line 为本轮实测）。

## 1. 总体需求

VSC 面板使用者在 webview 主界面完成全部交互：对话流、子代理活动、工具执行与历史回读必须**可见、可滚动、可回读**——
流式输出看着像活的（跟尾）、上滚阅读不被打断、历史能翻到底；webview 只做 UI 渲染与用户交互，
agent 循环与工具执行在 extension host（职责边界 = UI 适配层，经 postMessage 单向通信——`WEBVIEW（本仓·设计）§1`）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-W1 | **布局与活动区驻留**：垂直序 = 会话栏 → 消息区 → 活动区（子代理 / consult / advisor-async 活动块）→ 面板区 → 输入区；活动块**全程驻留**（live 固定可见，不随消息流滚动丢失）；终态消化回收后**归档落流**（消息区，形态不变）。证据 = `WEBVIEW（本仓·设计）§2 / §5 / §14` · `webview/activity.js` · `webview/activity-view.js` | 活动区为空 → 零高隐藏（CSS `:empty`，零 JS）；live 块在区内固定可见（消息区滚动不影响）；回收后块以同形落 `#messages`（归档块）；区居民 = live + awaitingDigest（有界）。用例 = `test/activity-flow.test.mjs` / `test/activity-closure.test.mjs` / `test/async-visibility.test.mjs` | 不改块头字段语义（字段表 = `WEBVIEW（本仓·设计）§14.3`）；不做浮动 / 弹窗形态；不复活旧 DOM-move 链（设计 §14.4） |
| F-W2 | **流式跟随与滚动**：消息区默认钉底（流式跟随尾部）；上滚解钉（阅读历史不被打断）；回底复钉；悬浮回底钮；活动区块内容区独立跟滚。证据 = `webview/ui.js:445-489` · `webview/scroll.js:13-33` · `webview/activity.js:115-135` · `webview/streaming.js:27-65` | 钉底态下流式帧到达 → 视口保持贴底；上滚（距底 ≥24px——近底判据同源）→ 解钉（帧应用不再拉底）；回底 / 点回底钮 → 复钉；两层独立（消息区 / 活动区互不拉扯）。用例 = `test/activity-live-ux.test.mjs` | 不做 `scrolled N` 状态串（端差——回底钮替代，本档 §4）；不逐 chunk 强制同步布局（见 §3 N-W3） |
| F-W3 | **历史懒加载**：打开会话只加载首窗（分页 200）；滚动近顶自动拉更早页；prepend 后视口锚定保持（正在读的行不跳）；无更早页不再请求。证据 = `webview/history.js:23-87` · `webview/state.js:63/89` · `webview/ui.js:465-476` · `src/extension/history-window.mjs:22` | 首渲 = 200 条 + `hasOlder` 真值（`HISTORY_PAGE_SIZE === 200` 断言）；`scrollTop ≤ 40` → 发 `loadOlder`（before 锚 = 已渲染外层消息的最早 `data-idx`）；prepend 后 `scrollTop = 原值 + scrollHeight 增量`（视口顶保持）；`hasOlder=false` → 零请求。用例 = `test/history-window.test.mjs` / `test/session-boot.test.mjs` / `test/history-restore.test.mjs` | 不做计数行「… N more …」（端差——加载指示器形态，本档 §4）；live 消息无 idx（永不污染窗口——锚只取外层消息） |
| F-W4 | **工具调用卡**：每次工具调用产出一张卡（头 = 工具名 + 参数摘要 + 状态词）；执行中输出**流式追加**进卡体（长命令可看）；完成 → 状态 + 耗时 + 末行摘要，成功折叠 / 错误展开；恢复会话的完成卡与活卡终态同形。证据 = `webview/ui.js:216-254/303` · `webview/tool-card-restore.mjs:23` · `webview/chat.js:139-160` · `webview/lib.js:27-30` | `toolCall` → 卡（名 + args 前 80 字符 + 状态词）；`toolOutput` → 追加且卡展开（卡体超 64K 截断加注）；`toolResult` → 成功折叠（含耗时与末行摘要 ≤80）/ 错误保持展开；恢复卡折叠语义与活卡对齐。用例 = `test/history-restore.test.mjs`（恢复面——含 live 对齐断言）；活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）现无专属用例（原 `test/chat-panel.test.mjs` 内覆盖随 2026-09-07 测试清空退场——非拆档迁出面；缺口登记 = 本档 N-W5——消解路径 + 到期条件） | 卡体不保留全文（全文在会话记录——`TOOL-OUTPUT-LIMITS（本仓·需求）` 面）；不做 `│ ` 前缀行间区块形态（端差，本档 §4） |
| F-W5 | **输入面 Enter 语义**：Enter 发送；组合期（IME）Enter 归输入法；`@` 下拉打开时 Enter 只接受建议；运行中拒发可见提示。证据 = `webview/input.js:75-85` · `webview/send.js` | 组合期 Enter → 零发送（不 preventDefault）；`@` 下拉打开 → Enter 归 autocomplete；busy 发送 → 拒发 + 可见提示；其余 Enter → 发送。用例 = `test/webview-input-enter.test.mjs` | 不改 send 出口守卫（拒发门禁保持——只改按钮可见性，设计 §14.3 C-14） |
| F-W6 | **输入历史与多行竖移**：↑↓ 判定五态（IME 组合期 → `@` 下拉让位 → 历史态恒历史 → 单行任意位置 → 多行边界门）；草稿 stash；不劫持原生竖移。证据 = `webview/input.js:86-110` · `WEBVIEW（本仓·设计）§11.1` | 历史态（`_historyIdx ≠ -1`）↑↓ 恒历史（连续上溯与回落）；多行非边界位置零劫持（原生竖移保留）；边界门 = 首行行首 ↑ / 末行行末 ↓ 触发；草稿恢复。用例 = `test/webview-input-history.test.mjs` | 不引入列记忆状态；不跨出输入框（不滚动会话） |
| F-W7 | **忙态与消化轮可见指示**：忙态收敛（turnState）；停止钮常显；消化轮起跑可见（`.digest-status` 三态）；状态行段位（工具 / 耗时 / `turn N/M` / ✦reasoning / token——对位表 = `WEBVIEW（本仓·设计）§14.3` C-15）。证据 = `webview/chat.js:353-390` · `webview/status-bar.js` · `WEBVIEW（本仓·设计）§7.4` | digest 起跑 / 收尾两态渲染幂等（ok 旗标时序）；Stop 期间常显；状态行对位表逐项落位；端差项（ctx 绝对数 / `scrolled N` / attention chip / 键位提示）保持登记态（本档 §4）。用例 = `test/webview-turnstate.test.mjs` / `test/digest-visibility.test.mjs` / `test/status-line.test.mjs` | 不做 attention chip（端差登记）；不做 `scrolled N`；不改发送门禁 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-W1 | 零依赖零构建 | webview 侧纯浏览器标准 API——无 npm 运行时依赖、无打包器（约束面 = `WEBVIEW（本仓·设计）` 头注） | `package.json` 零运行时依赖 + `npm run lint` 全绿；webview 目录零构建产物 |
| N-W2 | DOM / 内存有界 | 消息窗上限 150 块（含归档块——`webview/ui.js:468-476`）；卡体上限 64K（`webview/lib.js:27-30`）；离屏消息 / 工具卡跳过 layout/paint（`webview/chat.css:471`）；活动区居民有界（live + awaitingDigest——设计 §2） | 常量在位（逐处源码锚）；长会话回归：裁剪后 `data-idx` 锚可将历史拉回（`test/history-restore.test.mjs`） |
| N-W3 | 流式渲染性能 | 帧应用走 rAF 脏集路径——不逐 chunk 强制同步布局（`webview/ui.js:449-450` 抄「写超值不读 scrollHeight」；`webview/streaming.js:27` 注释） | 源码锚 + `test/activity-live-ux.test.mjs`（帧应用不丢 / 节流重排） |
| N-W4 | 分页与恢复对位 | `HISTORY_PAGE_SIZE === 200`（`src/extension/history-window.mjs:22`——跨端首窗对齐）；恢复保真（帧序 / 工具卡 / 时间戳形态） | 常量断言 = `test/history-window.test.mjs`；`test/history-restore.test.mjs` 全绿 |
| N-W5 | 可机判 | 每条功能需求有既有用例面（活动族 / 输入族 / 历史族 / 状态族）；**登记在案的例外 1 条**：F-W4 活卡面现无专属用例——**消解路径** = 活卡面（`toolCall`/`toolOutput`/`toolResult` 接收）补测；**到期条件** = WEBVIEW 面下次被触碰时 / 下批收口前（F14 第三子条）；测试档登记入 `test/files.mjs`（清单制） | `node test/run-fast.mjs` 全绿 + 档名在册；登记在案的例外 1 条（消解路径 + 到期条件在位） |
| N-W6 | 端差显式 | 各端独立实现、语义同源；端差逐条登记（本档 §4），不静默（同规 = `AGENT-LOOP（本仓·需求）§16` N-CL4） | §4 表逐行在位；无未登记放行通道（`ENGINEERING-MODE（本仓·需求）§1.3` F14） |

## 4. 对位与端差登记（对位 = `TUI（CLI 仓·需求）` + `TUI-TOOL-OUTPUT（CLI 仓·需求）`）

> 读法：逐行对位 CLI 需求行 → 本端对位 → 端差；「等价」= 语义同源且形态对位；端差 = 各端形态差异（登记不静默）。
> 端差判据以本端实测与 `WEBVIEW（本仓·设计）§14.3` 对位表为准；对端行号以其文档为准（本档不代述对端正文）。TTO = `TUI-TOOL-OUTPUT（CLI 仓·需求）`（下文行标简写）。

| CLI 行（对位参照） | 本端对位 | 端差（登记） |
|---|---|---|
| TUI F1–F5（跟随 / 暂停 / 锚定补偿 / 恢复 / 滚动入口） | F-W2 | 入口 = 滚动容器 + 悬浮回底钮（对端 = PgUp/PgDn + 滚轮）；`scrolled N` 不做（钮替代）；锚定补偿面 = 历史 prepend（`webview/history.js:58-61`）——追加不位移 DOM 视口 |
| TUI F6（懒加载） | F-W3 | 触发 = 滚动近顶（`scrollTop ≤ 40`）；页大小 200（两端对齐——N-W4）；数据源 = 宿主会话记录（磁盘为准） |
| TUI F7（头部分页标记） | F-W3（加载指示器） | 本端 = `loadOlder` 加载指示（`webview/history.js:23/33`）+ `hasOlder` 门；无「N more」计数行 |
| TUI F8（子代理嵌套活动显示） | F-W1 | 块形态 = 活动区驻留 + 收口落流两态（设计 §5/§14）；嵌套行随外层块（`webview/ui.js:38` 注释口径）；不做嵌套独立小节 |
| TUI F9（picker 附注渲染） | 本端无全屏 picker——模型选择 = 下拉部件（`webview/model-picker.js` / `webview/model-menu.js`） | 形态端差：全屏列表 vs 下拉 / 面板；无 80 列渲染预算概念 |
| TUI F10（选择面分工与契约） | question 卡（`webview/question.js`）+ 模型下拉 + Settings 对话框 | 各端组件面自持（不镜像）；交互契约差异登记于各端设计 |
| TUI F11（输入框方向键编辑） | F-W6 | 语义同源（同款竖移规则——对端文档明载其口径引本端同款）；呈现载体各端自持 |
| TUI F12（/advisor 子菜单） | advisor 配置面 = Settings 面板（`webview/settings-models.js` advisor 区） | 命令子菜单（对端）vs 面板表单（本端）——入口形态端差 |
| TUI F13（attention 态） | 本端对位 = 工具条按钮 active + plan 徽标 + 权限 / 提问卡流内可见 | **端差（明确登记）：attention chip 不做**（设计 §14.3 C-15）；无系统级通知 / 闪烁 |
| TUI N1–N2（滚动 / 加载不卡） | N-W3 / N-W2 | 机制端差：终端渲染缓存 vs DOM 窗口化 + 离屏跳过 |
| TUI N3（跨端对齐） | N-W4 | 等价（分页常量两端对齐 200） |
| TUI N4（零依赖） | N-W1 | 等价（两端同政策） |
| TUI N5–N6（防刷屏 / 省略计数真值） | 块折叠形态（冻结头 + tail——设计 §14.3 C-13） | 冻结头 + tail-3 同形态保持（等价）；本端截断标记不含计数（`webview/lib.js:30` 注文本）——「省略 N 行」体系端差 |
| TUI N7（选择面行宽预算） | —（本端无 cols 固定宽面） | 不适用：面板自适应宽度；预算式不入本端 |
| TUI N8（方向键编辑约束） | F-W6 | 等价（零列记忆两端同）；载体 = 浏览器输入框原生编辑 + 判定五态 |
| TUI N9（attention 零侵入） | —（随 F13 行） | attention chip 不做（登记态）；无空闲重绘面 |
| TUI N10（显示层内存有界） | N-W2 | 口径端差：对端 = 各载体字符额度族；本端 = 块窗 150 + 卡体 64K + 离屏跳过（DOM 面） |
| TTO FR1–FR3（行间区块 / 滚动内容 / 完成行） | F-W4 | 形态端差：卡片（折叠 / 展开）vs 行间区块（`❯` / `│` 前缀）；完成语义同（done / 失败 + 耗时 + 摘要） |
| TTO FR4（完整输出落盘） | `TOOL-OUTPUT-LIMITS（本仓·需求）`（本档不重述——D2）；呈现面 = 卡体预览 | 无端差（同机制——本仓已自持对位档） |
| TTO NFR1（区块渲染性能） | N-W3 | 等价（增量路径） |
| TTO NFR2（单一输出入口） | 消息族 `toolCall` / `toolOutput` / `toolResult`（`webview/chat.js:139-141`） | 接口形态端差：宿主回调 vs postMessage 消息族 |

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 B 轮——异名 / 异层者建档：`TUI` + `TUI-TOOL-OUTPUT` 一档承载；内容 = 本端机制实况登记 + 端差逐条登记；零新需求语义）。
- 2026-09-12：N-W5 按现态收正（F-W4 活卡面缺口显性化 + 登记在案的例外携消解路径 / 到期条件；F-W4 缺口句补登记指针）。
