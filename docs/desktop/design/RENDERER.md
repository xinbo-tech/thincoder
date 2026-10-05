# 桌面端（DESKTOP）· 渲染面实现工艺

> 板块 = **桌面端渲染面（前端）实现工艺**——零框架 DOM 层 · 单状态树 `store` · 渲染粒度与流式缝合 · 有界渲染窗口 · 回填与跟滚。
> 需求侧 = 需求分卷（`docs/desktop/requirements/`——查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**；本域无专卷——D 号散落各域卷；功能点 = 九域卷 + 总览 D14 ∥ 验收 ∥ 依赖面 = 总览 §7 ∥ §8——范围数随需求卷现文）。
> 同部分相关档：进程与目录形态（渲染面目录与模块注）= `docs/desktop/design/SHELL.md` §1 · 通道与载荷 = `docs/desktop/design/IPC.md` · 界面形态与交互 · 借用清单形态面 = `docs/desktop/design/UI.md` · 逐文件预算（§4.1）= `docs/desktop/design/PROJECT.md`。
> 域档（按域拆分后 · 均 `docs/desktop/design/` 下）：`CHAT.md` ∥ `COMPOSER.md` ∥ `ACTIVITY.md` ∥ `SESSIONS.md` ∥ `SETTINGS.md` ∥ `MENU.md` ∥ `PACKAGING.md` ∥ `E2E-TESTING.md` ∥ `WEB-QUICKCHECK.md`——逐域单源；文件账 = 本档 §5。
> 核机制面（agent 主循环 / 工具 / 记忆 / 配置 / 会话）**只住核**——本档只做**接入面**设计，不重述核语义（单一权威源）。
> 建档：2026-09-25（桌面端设计批 1 · 分档轮）；本档坐标 = as-of 2026-09-25 实核（仓根 = `thincoder/`）。

## 1. 渲染面工艺形态（索引）

本表 = **工艺索引**（形态一行 + 落点）：目录树逐行注住 `docs/desktop/design/SHELL.md` §1，逐文件预算住 `docs/desktop/design/PROJECT.md` §4.1——本表不重复其内容。

| 面 | 形态 | 落点 |
|---|---|---|
| 零框架零构建 | 原生 ESM + 手写 DOM；不引框架、不引打包器、无构建步骤 | `docs/desktop/design/PROJECT.md` §2 KD-4 |
| DOM 层 | `dom.mjs` 手写 DOM 工具 | `docs/desktop/design/SHELL.md` §1 |
| 视图面形态 | 视图档 = 纯函数构描述符树 + 薄挂载（机检可脱 DOM；文案一律经 `t()`） | 本档 §1.1 |
| 接线形通则 | handlers 给 ⇒ 落 `onClick` 且**无** `disabled`；缺省 ⇒ `disabled: true` + `data-action`（**诚实非死控**——树形只随 handlers 变）· **键盘面**（批 A）= 挂载面自挂 `keydown`（审批卡根 / 标签条加速键 `Ctrl/Cmd+1..9`——文档级 · 命中才 `preventDefault`） | 本档 §1.1 |
| 单状态树 | `store.mjs` 单状态树 + 订阅（会话 / 标签页 / 活动池 / 待审批 / 设置 / 项目级信息——批 9 增两切片；**批 A 增** `questions` / `tasks` 两切片 + 队列面（**「回合中插入」批收正**：`pending` 切片 = `ev:queue` 镜面——原三纯动作退场；单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**）；**会话模型轮 R13**：会话开合 ∕ 换形态归 `thincoder-desktop/renderer/mount-sessions.mjs` 面内记账（活动会话单源 = `activeSession`）＋ **面内态变更 ⇒ 即时手动重挂（先于帧径数据刷——反馈不候帧）**；**批 B 增** `usage` 切片），由 IPC 事件驱动 | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/IPC.md` §1 |
| 渲染粒度 · 流式缝合 | 流面按**作业结算**（新块到达 ⇒ 追加 ∥ 窗口滑 ⇒ 按数摘 ∥ 回填 ⇒ 整置（删档 + 新写——记录序重放）——作业单 = `state.flowOps`；结算纯件 = `thincoder-desktop/renderer/views/chat-stream.mjs` `flowStep`）；**尾块文本面增量 md**（冻结切点 + 热区换代——性能尾账批；单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-10） | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/PROJECT.md` §4.1 |
| 更新纪律（帧合并 · 收核） | 触发源 = store 变更 ⇒ 核帧合并件 `mark`；单飞 rAF + `FRAME_MIN_MS`(50) 间隔；每帧每面至多绘一次 + 布局节俭 + 帧尾动作；帧内组合（就地改 + 追加）自然同帧（结算步两动作——本档 §1.2 ②） | 本档 §1.2 · `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 |
| 设置面 / 向导（批 9） | 两形构树（`thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`）+ 薄挂载出档（`thincoder-desktop/renderer/mount-settings.mjs`）；**零新事件通道**（请求通道）；向导闸 = `config:read` 回执 `configured` | 本档 §1.1 · `docs/desktop/design/UI.md` §1 设置面 / 首启向导行 |
| 提问与计划卡 · 输入区（批 A） | 提问卡 / 计划卡 = 流内非块节点，纯构树（`thincoder-desktop/renderer/views/question.mjs` / `thincoder-desktop/renderer/views/plan.mjs`——零 `store` import）· 输入区 = 中区底行挂载出档（`thincoder-desktop/renderer/mount-composer.mjs`，自 `app.mjs` 拆出）· 卡族挂载与出站 = `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮——`question:respond` 出站 + 清本键 `questions` 切片 + 清位标） | 本档 §1.1 · `docs/desktop/design/UI.md` §1 输入区 / 提问呈现 / 计划面行 |
| 挂起窗与消化轮（桌面空闲唤醒） | 宿主挂起驱动（消费核件）= 空闲子任务 settle ⇒ 自唤醒消化轮；两事件面 `ev:susp`（计数：状态行段 3 第三态）· `ev:digest`（流内消化行族）；挂起空闲输入开放；块归档（**起跑窗（本批 2026-10-01 复位——用户 2026-09-30 18:49）**——消化起跑点（`ev:digest start` 发帧点）对本轮将消费驻留条目逐条补发 `done`（consult 会话条目 ⇒ 按其 `childIds` 逐子块补发——consult 同族收齐批 · #748；`hooks.reclaim` = **兜底幂等**；**三端同形（2026-10-01 裁 A——两端随正）**——VSC ∥ CLI 各起跑点补发同形、各 `reclaim` 兜底幂等（对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:212`））；退出 freeze = 兜底同型（`ev:susp {active:false}` 径）；**待消化块来源 = 全族 settle**——非挂起态亦发 `settled`（块到达时点归位批 · #746——本批以其落地为依赖）） | 本档 §1.1 · `docs/desktop/design/PROJECT.md` §2 KD-34–36 · `docs/desktop/design/IPC.md` §1 |
| 有界渲染窗口 | 见本档 §2 | 本档 |
| 回填与跟滚 | 见本档 §3 | 本档 |
| 右栏宽度拖动（chrome 级直写 · D30） | 拖柄三段交互 + 内联 `--pool-w` 直写（rAF 合帧）· 界 = CSS `clamp` 单落点 · 持久化 = `localStorage`（端自有 UI 态） | 本档 §1.3 · `docs/desktop/design/UI.md` §1 本批注 |
| 主题三态（chrome 级状态 · D33） | `data-theme` 状态（单写者 `theme.mjs`）+ 单块 `light-dark()` 值对 + `localStorage` 持久化 · 零 IPC | 本档 §1.4 · `docs/desktop/design/UI.md` §1 本批注 |
| 后台态与渲染停摆（#787 · 2026-10-01） | 窗口后台（遮挡∥失焦）不停摆——`backgroundThrottling: false`：后台期照常出帧与交换 ⇒ 无「停摆—复显」相变（无可见性迟滞窗 ∥ 无集中偿付） | 本档 §1.5 |

### 1.1 视图面形态：纯描述符 + 薄挂载

- **两层分家**：视图档（`thincoder-desktop/renderer/views/*.mjs`）分两层 —— ① **纯构树**（`xxxModel(state)` → 态对象；`xxxTree(model)` → **结构描述符树**）；② **薄挂载**（`mountXxx(root, state)` = `clear` + `build` + `append`——**建树面单点**）。
  视图档 **DOM 触面四处** = 建树（本条）· 接线（下条）· 帧尾态刷（`syncChrome`——本档 §1.1）· 帧尾滚动作（`settleFrame` ∕ 池面 `mountPool` 尾——本档 §3）。
- **接线面（第二形）**：事件 / 状态机型视图档（如滚动面）以 **`attachXxx(root, deps)`** 落形——`deps` = 出口回调集（`on*` 键：回填 / 复跟 / 停跟 / **滚动拍**）+ **只读口** `guards?()`（缺 ⇒ 恒假），程序化滚动作经返回 handle 出（不占 `deps` 键）；
  阈值常量与事件订阅（`scroll` 用 `passive`）收口于该档（常量单源声明 = 档头）；判定与算式一律纯函数（`scrollAction` / `compensateTop` / `nextWindow` / `smoothWindowOpen`）。
- **接线面依赖面（测试缝）**：`attachXxx` 的 DOM 依赖 = root 三读数（`scrollTop` / `scrollHeight` / `clientHeight`）+ `addEventListener` / `scrollTo` ⇒ **假 root 可注入**（接线面入自动面：直调出口 + 断言 store 读数）；**真实事件触发（用户真滚）仍归人工走查**。
- **事件归约面（批 8 落）**：`ev:*` **二十三通道** → 切片写者**单源** = `thincoder-desktop/renderer/events.mjs`——`reduce(state, ev)` 纯函数（零 DOM ⇒ 平 node 直测）+ `applyPage(state, receipt)`（页回执 → 首屏 / 回填两径）
  + `applyFlags(state, key, flags)`（`sessionFlags` 切片写者——页读 / 出站回执**两径同点**；状态栏对齐批）+ `blockOfMessage(msg)`（核 message → 块五型：用户 / 助手 / 推理 / 工具 / 错误——**页读域**；
  **块总集 = 六型**：+ `subagent`（归档子 agent 块——**留档块**（留档批 · #719）：**页读域第六型**——六型全员入页读域；「对齐第二批」项 5））；
  订阅接线拆出 `thincoder-desktop/renderer/events-subscribe.mjs`——`attachEvents({ on, store, invoke, onTurnTail })`（二十三通道订阅 · 退订句柄在场 · 回合尾标题刷新**存续**——输入区 flush 携行随「回合中插入」批退场）· 单向依赖归约档（无环）。
  写者与读者键面同源 = `key`（`docs/desktop/design/IPC.md` §1 会话键面）。
  **批 A 增（两通道归约）**：`ev:question` / `ev:task` 由「直返 `state`」改**写切片**（`state.questions` / `state.tasks`——同 `key` 就地替换零叠条，**不入 `pool`**）；队列面写者 = `ev:queue` 归约（**「回合中插入」批收正**——权威 = 宿主 ∕ 渲染面 = 镜面；原 store 纯动作 `pool.queue` 写面退场——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**）。
  **批 B 增（一通道归约）**：`ev:usage` 写 `usage` 切片（按会话 `key` · 同键就地替换 · 首写自种——**归约面唯一写者**；未至 / 非正数 ⇒ 零节点——KD-20，单源 = `docs/desktop/design/PROJECT.md` §2 KD-20 行）。
  **本批增（桌面空闲唤醒 · 两通道归约 + 消化行族）**：`ev:susp` 写 `susp` 切片（按会话 `key` · 同键就地替换——计数四值 + `active`；`active:false` ⇒ 段回落两态词，**禁假造**）；
  `ev:digest` 写 `digest` 切片（按会话 `key` · **全轮累积**——`start` ⇒ **追加本轮**（切片 = […旧轮, 本轮]——旧轮行**出即留**（零清理机器）；自然形收正批 · 2026-10-01 · 台账 #768）·
  `cap` ∕ `end` **就末轮更新**（cap 事实跨 `end` 存续；无轮 ⇒ 零写——**防守档**（**可达面 = 起跑帧未及**（轮在飞时渲染面新接入——其后 `cap` ∥ `end` 帧零写）；渲染面自该轮起跑帧在连 ⇒ 不可达——归属规则（活流侧优先）保运行期未结轮跨首屏存续；VSC 死游标零动作只系 `end`））；
  **记录 ∥ 显示两面**：轮事件三型（`start` ∕ `cap` ∕ `end`）**全量**逐条入**人读线记录**（`pushReal` 同面追加——不入机器线）；**显示 = 自然形**（行出即留——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场；行 = 流内事件——出生 = 到达序）；
  切片清点（`clearDigest`——未结末轮保（余整清——其内容随首屏记录重建））+ 并入（`withFoldedDigest`——**未结轮归属（活流侧优先）**：运行期未结轮在场 ⇒ 折叠未结末轮**不并入**（唯一副本 = 运行期轮）∥
  运行期未结轮缺 ⇒ 折叠未结末轮照并入（照现）；**同轮 ∥ 异轮不可判**（零跨侧去重键）——所失面 = 异轮 + 活轮记录未及投影窗（旧未结轮暂不并入——随后续落盘投影、下次首屏复现）；修复轮 1 · 2026-10-01 收正）
  + 折叠（`foldDigest`——**复列全量**（未结轮照现——可证面（扫描结束仍 `open`——批档 §2 钉定同字）；位次门：`at` 不可得 ⇒ 零产）——记录位次原位）；
  **流内消化行族** `[data-digest]` = **行元素 · 流内就地**（流内普通项——沿两端实形；**行出即留**——行 = 流内事件：出生 = 到达序（当刻流末）；不改 ∥ 不删 ∥ 不退场（零清理机器——自然形收正批 · 2026-10-01 · 台账 #768）；
  零搬移（无搬移机器——结构事实）、随流滚动；不占块序 ∥ 不计 `data-blocks`（沿两端实形——VSC 裁集不含消化行 ∥ CLI 行非块）；
  **行集 = 全轮**（每轮 = [起跑标签行（ask 档行文 = `digest.turnLabelAsk` 携 `from` ∕ `msg`；余 = `digest.turnLabel`；恒在）] +
  [`n > 0` 计数行（**起跑文 = `digest.start`**（携 `n`——「正在消化 N 份后台报告…」；对位 VSC `chat-status.js:82-88`）——**终态不换文**）] +
  [**cap 行（锚 `data-digest-cap`；`mode === "stop"` ⇒ 并 `.digest-cap-stop`；行文 = `digest.capStop` ∕ `digest.capAuto`）**] +
  [**终态行（锚 `data-digest-end`）**——`end` ⇒ **追加一条新行**（词键 `digest.done` ∕ `digest.aborted` 直取——零新键；**不动原 digesting 行**）] +
  [**残余行（锚 `data-digest-residue`）**——`end` 且携 `unsettled > 0` ⇒ 追加（词键 `digest.residue`——核字典直取）；`= 0` ⇒ 零行（消化账务批 · 2026-10-05——机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31）]；`n = 0` 轮零计数行 ∥ **零终态行**（守句——禁幻影行；三端同守））；
  行形单源 = `thincoder-vscode/webview/chat-status.js:69-122`；**行族形态（本批收正——对位 VSC 实形）：无轮容器**——行元素 = 流内并列兄弟（逐行直挂、不做每轮包裹元素；对位 VSC `chat-status.js:72-89` 逐行 `appendChild`）；
  **cap 行 ∥ 终态行 = 到达序追加——两径并存为设计**：**活流径** = 帧到达于**流末**追加（随流尾追——其位可与其族本体不相邻；对位 VSC `chat-status.js:97-105` 到达即 `appendChild`）∥
  **重建径** = **族内紧邻**（`digestRows` 出 [标签行, 计数行?, cap 行?, 终态行?]——重建按记录（族内压缩 = 在册白名单——本档「消化行入流与重放规则」条）；对位 VSC #726 复列——`docs/vsc/design/WEBVIEW.md` §5.7）；**记录面 = 行族入人读线 `digest` 记录（全量在档）**）；
  **流内压缩状态行** `[data-compress]`（R4 增）= 非块节点组同侧单元素四态（start ∕ done ∕ fallback ∕ failed——形 / 在场 / 生命期 = `docs/desktop/design/IPC.md` §1 `ev:compress` 行；构树面 = `thincoder-desktop/renderer/views/compress-status.mjs`）；**定位 = 流元素冻结点**（单源 = 本档 §1.1 插入点纪律条）
  · **卡序闭集 += `goal`（尾位）**（R5 增——核件 `renderGoalPanel` 直取；卡序单源 = `thincoder-desktop/renderer/mount-cards.mjs` `CARD_ORDER`）· **`ledgerDetail` 行**（R8 增——`ev:ledger` `detailLines` 切片 ⇒ 状态行段 11 tooltip 载波，非块节点）；
  **在场 / 出现 / 更新 / 退场路径**：在场 ⟺ 轮集非空（**全轮在流**——行出即留）；
  出现 = 各帧到达即建行于**当刻流末**（`start` ⇒ 新轮起跑——标签行 + `n > 0` 计数行追加（旧轮行留置）；`cap` ⇒ cap 行；`end` ⇒ 终态行追加；起跑后常规新块随流居其下；归档块随到达入流）∥
  行族缺 ∧ **运行期轮**在场 ⇒ 帧内补建（出生点 = 当刻流末；重建径采纳既有行——零重建；**位次轮缺行 ⇒ 回填整置径承接**——记录序复列）∥
  更新 = 零（行出生即定型——**零就地换文**）∥ 退场 = 零（**零清理机器**——行随流上浮；重挂 ∕ 首屏 ∕ 回填整置 = 树面重建——重建轮按记录位次复列（全轮）∥ 未结轮 = 流末）；
  **行元素不占块序 ∥ 不计 `data-blocks`**（重建径在场面 = 记录位次落于已渲染块区——窗口即窗口，同块之退窗——留档批 · #719）**；插入点 / 根子序与帧尾态刷成员 = 本档 §1.1 两条纪律（两处皆本族点名）；
- **消化行入流与重放规则（基础重裁批 · 2026-10-01——台账 #765；自然形收正批 · 2026-10-01——台账 #768：拆「消化行 = 流内非块节点（特殊物种）」自设前提 ⇒ 消化行 = 流内普通项——到达即入流 ∥ 窗口即窗口 ∥ 记录照留、常规重放 ∥ 行出即留（零清理机器））**：
  **零专用机**——消化行零专设身份 ∥ 落位 ∥ 复列设施（座次类 ∥ 锚类 ∥ 位次类 ∥ 族键类 ∥ 例外条 ∥ 专设步序皆无存——**复入窗**（回填使位次轮入区）**归整置径**（删档 + 新写——记录序重放；零专设身份 ∥ 零寻位 ∥ 零位置存储）；源自旧前提者整批失效——用户 2026-10-01 05:16「基础假设错、拆掉解决」；
  拆除清单 = 批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §2 基础重裁块）。**① 入流 = 到达序**（两端同形：VSC 到达即 `appendChild` ∥ CLI 到达即 `pushLine`）——起跑帧建行于**当刻流末**（起跑后常规新块随流居其下）；
  **同帧批内新到流项按到达序**（起跑帧先发 ∥ 补发后发——`thincoder-desktop/src/main/suspension-drive.mjs:146`（post `ev:digest`）→ `:150`（`reemitDone`））⇒ 起跑窗 [行族][归档块]（用户 01:48 面）；
  **② 新轮 = 追加**（`digest` `start` ⇒ 新轮入模型 · 新行当刻流末建——**旧轮行留置原位**（零摘除））；
  **③ 行 = 流内事件 · 出即留**（出生 = 到达序——`start` ⇒ 起跑两行 ∥ `cap` ⇒ cap 行 ∥ `end` ⇒ **终态行（追加——不动原 digesting 行）**；**零就地换文 ∥ 零标签退场 ∥ 零换代删旧**）；
  **④ 重建 = 记录序重放**（**序判据句（修复轮 1 · F3——全流层）**：**恢复序 ≡ 记录序**——重放 ∥ 重挂所得序 ⇔ 记录序，记录 = 唯一参照；机检形 = 批内件腿 7；
  **白名单两档（合法偏移——穷举登记）** = ① 族内压缩（`digest` `cap`/`end` 记录折入行族——重建径）∥ ② 跨页丢终态（起跑未载的 `cap` ∥ `end` 记录零产——`foldDigest` `open` 闸，防并轮错位；起跑侧照现 = 可证面——重建径）；
  重建径 ∥ 回填整置径全载页域内逐位对账成立——**验收以记录序为唯一参照**；
  **复入窗（前插回填使位次轮入区）⇒ 整置径**（回填 ⇒ 删档 + 新写；缺行者随整置落其记录位次——零位置机具：零寻位 ∥ 零搬移 ∥ 零算术）；重建轮于其记录位次复列（**复列全量（未结轮照现）**——记录位次原位；位次落于已渲染块区之外 ⇒ 零复列——窗口即窗口）；运行期未结轮 = 流末；归档块 = 普通块——记录位次原位出（零配对）；**障碍面在册（上抛）** = 页读域窗口化——跨页丢终态段（`page-read.mjs` `foldDigest` `open` 闸；原「配对落尾」段随配对拆除退场）；
  **⑤ 记录面照留**（轮事件三型全量——零动；折叠 ∥ 清点 ∥ 落盘节律单源 = 本档「留档记录」条）；**⑥ 懒加载径（回填 = 整置——删档 + 新写 · 回填落位批 · 2026-10-04 收正）**：滚动到顶 ⇒ 加载更早一页 ⇒ **整置重放（记录序）** ⇒ 序不乱（恢复序 ≡ 记录序换窗后仍成立）∥ 行族与其归档块相对序不变 ∥ **零位置机具**（零寻位 ∥ 零搬移 ∥ 零算术——行族随整置按记录序全量复列；视口锚定 = 帧出口补偿算式承接）。
  **承载件身份**：帧管线 ∥ 块管线本体 ∥ 记录面 = 承载面（保留；改承载件 ≠ 拆前提——单源 = 本档 §3 六步序步①：入流步）。
  **块归档面**（**起跑窗（本批 2026-10-01 复位——用户 2026-09-30 18:49「digest 的时候直接把它挂进去…何必等到消化完再挂」∥ 2026-10-01 02:08）**：消化起跑点（`ev:digest start` 发帧点）= 对本轮将消费驻留条目（起跑快照）逐条补发 `ev:subagent { status: "done" }`（复用 `reemitDone`——consult 会话条目 ⇒ 按其 `childIds` 逐子块补发——consult 同族收齐批 · #748；
  `thincoder-desktop/src/main/suspension-drive.mjs` 起跑支——**主面**；`hooks.reclaim` = **兜底幂等**；**三端同形（2026-10-01 裁 A——两端随正）**——
  VSC ∥ CLI 各起跑点逐条补发同形、各 `reclaim` 兜底幂等（对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` 逐条补发 ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:212` reclaim → `freezeReclaimDigestedBlocks`））——
  `settled` 待消化块（**含非挂起态 settle——块到达时点归位批 · #746**）归档入流（落位 = **随到达入流**——本档 §1.1「消化行入流与重放规则」条）；
  退出 freeze = 兜底同型（`ev:susp {active:false}` 径——对位 VSC `thincoder-vscode/src/extension/suspension.mjs:132-135` freeze 消息）；迟来 `done`（族已离流末）⇒ 随到入流（退化档沿））；
  状态行段 3 三态与词键 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」。
- **池切片清点口径（批 8 落）**：池条目入池 = `ev:tool-call`（开始）、`ev:tool-result` 只收束 `status`——**清点 = 全量在场**（收束不摘除 ⇒ 长会话池切片单调增长）；
  **窗限 / 归档 = open**（登记 = `docs/desktop/design/PROJECT.md` §10 · `docs/desktop/design/UI.md` §2 项 1）；**队列族（批 A 落 · 「回合中插入」批收正）** = **零写者 · 席位保留**（用户排队消息改宿主单源 + `pending` 镜面——`pool.queue` 写面退场；单源 = `docs/desktop/design/UI.md` §1「本批注（回合中插入 · 步边界 pickup）」项 2）。
- **回合尾三径（判据单源 · 批 A 修正轮）**：回合尾 = `ev:activity`（无 `fields`）的 `done` ∨ `stopped` ∨ **`ev:error`**（宿主错误结算——`ev:error` 行单源 = `docs/desktop/design/IPC.md` §1）；三径**同判据**（谓词 `isTurnTail` 住 `thincoder-desktop/renderer/events.mjs`）：**谓词入参形（点名）** = 吃**两通道形**——
  `ev:activity`〔**无** `fields`〕∧ `event ∈ {done, stopped}` ⇒ 真 ∥ `ev:error`（单形载荷 `{ key, message }`——单源 = `docs/desktop/design/IPC.md` §1）⇒ 真 ∥ 余 ⇒ 假（两通道**同调此谓词**——消费面 = 回合尾标题刷新（「回合中插入」批后）；实施落点 = 现谓词体只吃 `ev:activity` 形，批 A 扩吃 `ev:error`）：错误径 ⇒ 本键 `running` 清 + 位落 `done`（落点 = 归约面 `onError`）；
  消费面两处：回合尾标题刷新（`thincoder-desktop/renderer/events-subscribe.mjs`——判据命中即刷）· `stopped` 兼清本键提问项（本档「卡面在场与随动」条）；**输入区 flush 携行随「回合中插入」批退场（`onTurnTail` 窄口存续——标题刷新消费面不动）**
  （队列消费改宿主驱动——步边界注入 ∕ 回合尾送达；**`ev:queue` 归约两形** = 状态形 ⇒ 镜面整置 ∕ 消费回执形 ⇒ 镜面整置 + `delivered` ⇒ 用户块入流 + `degraded` ⇒ 提示面；单源 = `docs/desktop/design/PROJECT.md` §2 KD-40）。
- **回填接线口径（接线态）**：`onBackfill` 出口与只读口 `guards()` 两读数**同刻接线**——`hasOlder` 源 = `history.hasOlder`（页回执落态）· `inFlight` = 回填在途（`beginBackfill` / `endBackfill` 置清）；触发三步判据 = 本档 §3；摘要块在场仍以 `data-hidden` 为判据（`guards` 不参与树形）。
- **描述符规格**：`{ tag, props, children }` —— `tag` 必填；`props` = 属性 / 事件（`on*` 键 = 监听器；`true` = 布林属性；`false` / `null` / `undefined` = 不落）；`children` = 子描述符 / 裸串（裸串 = 文本节点；`null` = 空位跳过）。**唯一构造点** = `thincoder-desktop/renderer/dom.mjs` 的 `build(node)`（递归；入参面与同档 `el()` 同形）。
- **接线形通则**：视图档收 handlers 面的控制项**两态落形**——handlers 给 ⇒ 落 `onClick`（携带本项键）、**不落** `disabled`；缺省 ⇒ `disabled: true` + `data-action` 机读锚（**诚实非死控**：不落假接线、不留死控件）——树形**只随 handlers 变**，不随状态另定形。
- **键盘面（接线第二口径）**：挂载面可自挂 `keydown`（既有 = 审批卡根（`thincoder-desktop/renderer/views/approval.mjs`）；设置面 Esc 关闭 = `docs/desktop/design/UI.md` §1「本批注（对齐第三批 · 小修族）」F-Esc；会话控制面选择器 = `thincoder-desktop/renderer/views/session-control.mjs`）——**命中才** `preventDefault`；形态单源 = `docs/desktop/design/UI.md` §1 交互行。
- **页生命周期（接线第三口径）**：页键写者**单源** = `openSession`（`thincoder-desktop/renderer/events.mjs`：键 `null` ⇒ 关页 · 开页清本键 `done` 位标）；开页路 = `openPage` / `activateSession` / `createSession`（`thincoder-desktop/renderer/mount-sessions.mjs`——共用尾 `openResult`）——会话键（`String(slot)`）与页键 `activeSession` **同刻随动**。
- **删会话 ⇒ 页随动（零新路）**：出口**共用尾** —— 删**活动**会话 ⇒ **邻位接管**（同位置行，越界取末行 ⇒ `session:switch` 同一路）；
  列表空 ⇒ `openSession(state, null)` 关页（中区 `none` 态 = **零块节点**〔不新造空态视觉〕+ 引导节点（`data-guide`——形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注项 1））；删**非活动** / 拒收（末项门 ∕ 槽缺）⇒ **零动作**（键未变 ⇒ 页不动）。
- **删除会话（左列行控件 · 同批）⇒ 同源出口**：`session:delete` 回执 `ok` ⇒ 键面 `closeTab(本键)` + 上条关闭尾（活动 ⇒ 邻位接管 · 唯一 ⇒ 关页）；`ok:false`（核拒）⇒ 零动作（**不造死标签**——已删键的 `session:switch` 必拒）。
- **幽灵更新（已覆盖 · 零新增机制）**：块面 / 页写既有键过滤（`ev.key === state.activeSession`）⇒ 关页后已关会话的到达事件零入块面；`sessionMeta` / `tabBadges` 仍写已关键，而标签条只遍历 `tabs` ⇒ 零可见影响（登记为观察，不新增过滤）。
- **页窗暂留（登记 · 非本批新增）**：页键变更至邻位页回执落之间，屏上暂留前页块（既有口径：页数据随 `history:page` 回执整置）；消解需第三态「载入中」= 新词键 / 新形态 ⇒ 新需求面，本批不落（登记 = `docs/desktop/design/PROJECT.md` §10）。
- **判据面**：纯构树**零 DOM** ⇒ 视图行为可在平 node 直测（断言描述符树：机器读面用 `data-*` 承载，不依赖 DOM 实现）；挂载函数不进自动面（DOM 面随人工走查）。
- **文案纪律**：视图档内面向用户字符串**一律经 `t()`**（词表面）——档内零硬编码文案（含英文；机检面 = 词表键哨兵 / 源扫描）。
- **流面作业单（事件自带——谁变谁写）**：结构变更由**发生点**带上作业（`state.flowOps` 有序单；写口单点 = `thincoder-desktop/renderer/store.mjs` `withFlowOp`——与 `blocks` 写同笔）：`{ kind: "build" }`（整置——页回执首屏 ∥ **回填页并入（回填落位批）** ∥ 换会话 ∥ 关页 ∥ 退流清空（本地先行回声摘空 ⇒ 空态引导面复现））·
    `{ kind: "insert", index }`（按位插入——座次位，#765 在册面）· `{ kind: "cut", index }`（退流——本地先行回声按引用摘）；
  **新块到达零作业**（追加为常规路径——由账自明，见下条）。
  **清账 = 两径同清（构造径亦清 ∥ 结算径亦清）**——消 `build` 作业粘滞；**root 缺位 ⇒ 不清**——未消费不退账。
- **流面结算步（判据面）**：每帧以**账**（上帧 DOM 所覆盖块列 + 隐藏数）对本帧模型窗做**整数结算**——纯件 = `flowStep({ account, model, ops })`（落点 = `thincoder-desktop/renderer/views/chat-stream.mjs`）：项位次 = 账位 + 作业回放（`insert` ⇒ 位次 ≥ 索引者后移 ∥ `cut` ⇒ 命中摘除 ∥ 其后前移——纯加减）；
  留判 = 落于目标窗；**摘 = 按数**（头段越位项）∥ **造 = 给没有节点的内容造节点**（窗位缺账项者——头段此前插 ∥ 尾段此追加 ∥ 中洞此就位；插点锚 = 其后首账项，无 ⇒ 尾插点 `blockAnchor`）∥
  **刷 = 就地**（留位且块对象变者——`refreshNode`）。**无逐位配对判定 ∥ 无全或无判决**（每项各自留 ∥ 摘 ∥ 造 ∥ 刷——结算必达）。
- **建（构造径——给没有节点的内容造节点）**：同一构造面（`mountChat`：清 ∥ 建树 ∥ 快照复填）覆盖三触发——**首帧**（无账）· **整置**（页回执首屏 ∥ **回填页并入（回填落位批 · 2026-10-04）** ∥ 换会话 ∥ 关页（唯一会话删除 ∥ 列表空，`openSession(state, null)` 同笔带作业；`none` 态引导面由本径承接）∥ 退流清空（本地先行回声摘空 ⇒ 空态引导面复现）——承载 = `{ kind: "build" }` 作业）· **词面变**（`locale` 变 ⇒ 内容须换词面——判据 = 帧内单标量比对）。
  三触发同径同形；滚动 ∥ 焦点 ∥ 草稿保真 = 快照族承担（本档 §1.1 快照复填条 ∥ #606④⑤）。
  **`project` 键承接 = 刷面**（键变 ⇒ 帧尾态刷条 `syncGuide` 原位换——`no-project` ↔ `no-session`；建 = 本条构造面；零重挂 ∥ 零静默丢失）。
- **帧尾态刷（刷新面单点）**：每帧末尾一处 `syncChrome(root, model)`（帧尾态刷出档 = `thincoder-desktop/renderer/views/chat-chrome.mjs`——帧尾调用点 = `thincoder-desktop/renderer/views/chat.mjs` `settleFrame` ③；
  构造径调用点 = `thincoder-desktop/renderer/app.mjs`（两处构造支）· 幂等 · 与结算面解耦——`none` 帧同刷 = 无帧豁免）⇒ 根锚四（语义单源 = 本档 §2 / `docs/desktop/design/UI.md` §1 对话流行）+ 两控件（摘要块 `hidden > 0` · 药丸 `!following`）
  + **消化行族**（`[data-digest]`——**全轮行族（行出即留——零清理） · 流内就地**（无轮容器——行元素并列兄弟）；**入流 = 到达序**（同帧批内行族出生先于补发块——单源 = 本档 §1.1「消化行入流与重放规则」条）；
  在场 ∕ 出现 ∕ 更新 ∕ 退场 = 本档 §1.1 归约面条；「桌面空闲唤醒批」）——
  **待发送带不在流内**（住输入区上方带：消费面 = `thincoder-desktop/renderer/mount-composer.mjs` `paintNotices`；数据源 = `pending` 镜面非空判据——两源：忙态队 ∪ 挂起窗输入队；本批收正——收正轮 B12 终态口径落字）
  + **帮助行族**（`[data-help]`——当次打印行族（单枚进场 · 重印换代同枚——零搬移）· **尾组槽位**；构树 ∥ 帧刷 ∥ 锚单源 = `renderer/views/chat-chrome.mjs`；「slash 面增量（`/help`）· 2026-10-01②」）
  + **引导节点**（判据 = `model.guide` 空否——`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）在场与文本随判据；`none` 态零块节点不破（只摘不插）。
- **插入点纪律（批 A 扩三卡 · 压缩行定位收正 · 消化行流内落位批收正）**：块节点插入点 = 首个**尾组** ∕ 卡节点之前——**常规新块随流居消化行元素之下**（消化行 = 流内普通项，不入插点链——新块随流自然落其下）（流内就地序 = CLI `docs/cli/design/TUI.md` §6.9 ∥ VSC `thincoder-vscode/webview/ui.js:102`）；
  **归档块（`kind: "subagent"`）落位 = 随到达入流（当刻流末）**（用户 2026-10-01 01:48「放在已消化1份后台报告那一行后面」——与 18:49 起跑窗 = 同一体两面；**三端同形（2026-10-01 裁 A——两端随正）**：VSC ∥ CLI 随正（VSC 对位 `thincoder-vscode/webview/activity.js:104-110`——其端自持形；本端 = 到达序））：
  **规则 = 当刻流末**（行族在流末时即「放族后」；迟到 ⇒ 随到入流；**零存储 ∥ 零界锚设施 ∥ 零到达序标**——单源 = 本档「消化行入流与重放规则」条）；
  模型 ∥ DOM 同判（常规块插入点）⇒ 文档序 [.. 块][行族][归档块][行内后产块 ..]（起跑窗内成立——**同帧批内新到流项按到达序落位**（起跑先 ∥ 补发后）——单源 = 本档「消化行入流与重放规则」条）、本档 §2 不变式（DOM ≡ `visible`）零破（帧径 = **流面结算步**承接——单源 = 本档 §1.1「流面结算步」条）；
  尾组族内序 = 到期触发行组 → 停止痕 → **帮助行族**（消化行族元素恒居尾组之前）；压缩行 = 流元素冻结点，**不在块插入点上**（VSC D-C3 append-once——创建点定位后新块随流居其下；其后创建的族员 ∕ 卡 ∕ 药丸自然落其后）；
  **卡四类** = `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]` / `[data-card="goal"]`，卡间 DOM 次序固定 = 待审批 → 提问 → 计划 → **目标**（缺者跳过）；无尾组无卡 ⇒ `[data-pill]` 之前；两锚皆缺 ⇒ 末位；
  根子序（构树 ∕ 重建）= [摘要块?] → **流序**（块序列 × 消化行族——**记录序重放**：重建轮于其记录位次复列（未结轮照现）∥ 运行期未结轮 = 流末；活流 = 到达序就地）→
  [压缩行?] → [到期触发行组?] → [停止痕?] → [帮助行族?] → [卡序列?] → [药丸?]（**活流序 = 就地**——各帧行落流末、随流居其位；
  重建径 = 记录序重放（留档批 · #719——复列 = **全量**（未结轮照现；记录位次原位；自然形收正批 · 2026-10-01 ∥ 消化重放口径批 · 2026-10-01））；**待发送带不在流内**——住输入区上方带；重建 ⇒ 压缩行重植于块序列之后 = 该时刻新冻结点，其下新内容随流——VSC「重建即清」对位 = 桌面常驻重植，生命期单源 = `docs/desktop/design/IPC.md` §1 `ev:compress` 行）。
- **引导节点（批 B 追加轮 · 非块节点）**：无活动会话 ∥ 零块 ⇒ 引导节点 `div.chat-empty[data-guide]`——`none` 帧 = 根**唯一子** · `empty` 帧 = **首子**（在块序列 / 卡序列之前）· `flow` 帧 = 不在场；零 `data-block-id` ⇒ **不入块序**（上条根子序与 `data-blocks` 不变式不受其影响）。
  判据（模型 `guide` 字段）= 无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
  构树 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落——流内非块节点构树）；**动作控件在场 ⟺ 句柄在场**（`onOpenDir` / `onNewSession` 缺 ⇒ 整控件缺席——比接线形通则更严：零假按钮）；
  引导面随项目变（**`project` 键承接 = 刷面**——单源 = 本档 §1.1「建」条；零重挂）；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注项 1 / 2。
- **卡面在场与随动（帧尾态刷 · 批 A 扩三卡）**：卡节点 `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]` / `[data-card="goal"]` 的在场与文本随帧内判据刷（形态单源 = `docs/desktop/design/UI.md` §1 审批呈现 / 提问呈现 / 计划面 / 目标面板四行）；`question` 卡**退场非乐观**（回执 `ok` 真 ⇒ 清除；失败 ⇒ 卡留可重试 + `console.error`——出口口径见该行；
  **中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清位标（**清码判据 = 两族皆清**——单源 = `docs/desktop/design/UI.md` §2 项 2）——判据 = 终局事件面，非回执（单源 = 本档「回合尾三径」条））；
  **四卡**皆**非块节点** ⇒ 不入块序不变式（本档 §2），块面比较对与 `data-blocks` 语义不受其影响。
- **流内非块节点族（对齐第二批扩 · 桌面空闲唤醒批增一）**：**消化行族** `[data-digest]`（**全轮行族 —— 行出即留 · 流内普通项**——无轮容器（行元素 = 流内并列兄弟）；行集 = 全轮（起跑标签行 + `n > 0` 计数行 + cap 行（锚 `data-digest-cap`）+ **终态行（锚 `data-digest-end`）**——**cap 行 ∥ 终态行 = 到达序追加**（两径差异 = 在册行为——单源 = 本档 §1.1 流内消化行族条））；
  落点 = **流内就地**（活流行 = 各帧落流末 ∥ 位次轮 = 整置径记录序复列——单源 = 本档「消化行入流与重放规则」条；归档块落位 ∕ 常规新块序 = 本档 §1.1 插入点纪律条）；在场 / 更新 / 退场 = 本档 §1.1 事件归约面条）；
  **帮助行族** `[data-help]`（**slash 面增量（`/help`）· 2026-10-01② 增一**）：**当次打印行族（单枚进场 · 重印换代同枚——零搬移）· 尾组槽位**（卡序列之前；锚 = `helpAnchorOf`（`[data-card] ?? [data-pill]`）——`renderer/views/chat-chrome.mjs`）；
  行集 = `{ kind, text }` 行集逐行（`label` ∥ `group` ∥ `cmd`——`data-help-line` + `data-help-kind`）；**非块节点**（零 `data-block-id` ⇒ 不占块序 ∥ 不动 `data-blocks` 不变式）；
  在场 ⟺ 本键 `helpLines` 切片在场（内容逐行等价 ⇒ 零写）；**运行期痕 · 清点两门**（首屏页读整置即失——`clearHelpLines` ∥ **回合起跑门** = `msg:send` 出站即清——`clearTurnTraces`；单源 = 本档 §1.6 **KD-74**）；写者 = 端装配面 `printHelp` 口（`renderer/mount-composer.mjs`——行文 = 表本体经核 `formatHelp`；经 store 纯动作 `setHelpLines`）；
  **归档子 agent 块**（`data-block-kind="subagent"`——**是块节点**（入块序 / 计 `data-blocks`；壳 = 零边距透传容器 + 内嵌核件元素——“对齐第二批”项 5）——**留档批 · #719 ⇒ 留档块**：入**页读域**（计 `data-hidden` ∥ 可回填 ∥ 退窗折摘要块）；记录形 `{ kind: "subagent", meta, rows }`（与活流归档同一形状）。
- **留档记录（消化面留档批 · #719 ⇒ 跨端承接批 · #726——机制单源上提）**：记录**形 ∥ 写缝 ∥ 读缝契约 ∥ 重建义务 ∥ 容差登记**单源 = `docs/core/design/SESSION.md` §6.26（跨端单源——本档不复述）。
  **本端承接面**：产读两面同上核节——产 = 宿主发帧点**同点双动作**（`cap` 帧点 = `thincoder-desktop/src/main/turn-face.mjs:139` ∥ `:140`）∥ 渲染面归档派生点经 `record:append` 通道（快照含非活动键）；
  读 = 页读直通（核 `historyWindow` opt-in `{ records: true }`）+ **折叠重建**（`digest` 记录 ⇒ **复列全量**（逐轮携位次 `at` = 起跑记录全局 `idx`——记录位次原位；**未结轮照现**（可证面 = 轮间 ∥ 末页（扫描结束仍 `open`——批档 §2 钉定同字））+ **位次门**（`at` 不可得 ⇒ 该轮零产——#773 防御）；
  跨页截断 ⇒ 起跑未载的 `cap` ∥ `end` 记录零产——容差①；消化重放口径批 · 2026-10-01）；`subagent` 记录 ⇒ 留档块（`blockOfMessage` 同形——**记录位次原位**（重放序——零配对））；
  **他端记录读面归一（本批 · #794）**：CLI ∥ VSC 记录读入 ⇒ 留档块同形（缺位字段补形）——落点 = `thincoder-desktop/renderer/page-read.mjs`（`blockOfMessage` subagent 支）；判据 = `docs/core/design/SESSION.md` §6.26 读面归一义务。
  **落盘节律** = 与消息同节律（人读线段即时 ∥ 槽文件回合尾投影）；
  **修单已落（修复轮 3 · 2026-09-30）** = `end` 记录写点前移（结算序先于槽落盘——消「收束后即时重载末轮痕缺」；
  落点 = `thincoder-desktop/src/main/turn-face.mjs` `emitDigestEnd` `:168-175` ∥ 两径结算前调用 `:178` ∥ `:183` ∥ `thincoder-desktop/src/main/suspension-drive.mjs` 收尾移出 `:130-140`；裁定 ∥ 判由 = 批档 `docs/batches/2026-09-30-digest-persistence.md` §2）；
  **写面薄壳（端核契约 · 登记）** = 端 `appendRecord`（`thincoder-desktop/src/main/session-io.mjs`）现行 = 复用核 `pushReal` 半提取载体形（字段面 `_fullHistory` ∥ `_recordStore` ∥ `_historyWindow` = 隐式契约；行为面钉守 = 批内件腿 1a）——**消解路径** = 端壳下次触碰改调核 `pushRecord` 单点（行为等价）；
  **边界** = 记录不入机器线 ∥ 重建径置位规则与活流同一套（随到入流 ∕ 记录序重放 ∥ `blockAnchor` 复用——**该名 = 端面现行导出名；零动作**）∥
  **容差（2 · 桌面侧状态）** = 同 `docs/core/design/SESSION.md` §6.26 容差登记 ①/②（桌面侧特异半句 = ① 页界落于轮记录之间；② 快照产生面「渲染面异步出站」——下一落盘承接）。
- **到期触发行（timer-wake 阶段 2 批增）**：`ev:timer` ⇒ 归约写 `state.timerNotice[key]` 切片 ∧ `thincoder-desktop/renderer/views/chat.mjs` 流内行组（非块节点 · 不入块序——**与 `[data-digest]` 行同族**）；行文 = 交付原文（显示裁 ≤3 行 + `…`）；
  在场 / 退场路径 = **两门**（**首屏门** = 随页读整置即失——沿 `[data-stopped]` 先例 · 定形 2026-09-28；**回合起跑门** = `msg:send` 出站即清——timer 员 2026-10-05 · 台账 #952 并入；晚到（出站后到期）照写照显 · 留至下一回合门）；
  落点 = `thincoder-desktop/renderer/page-read.mjs` ∕ `views/chat-chrome.mjs` `syncTimer`（幂等 ∕ 换代原位换 ∕ 缺席摘）；清点面单源 = 本档 §1.6 **KD-74**；事件面单源 = `docs/desktop/design/IPC.md` §1。
- **池面挂载（键控差分 · 「对齐第二批」项 3；**让位修复批收正（2026-09-29）——壳原位领用**）**：**三径** = ① `none` / `empty` ⇒ `clear` + 零节点（无滚动件）② 壳缺位（首挂 ∕ 换代后）⇒ 建树全挂 ③ **壳在位 ∧ `pool` ⇒ 原位领用**——
  **头 = 逐件就地差分**（件面 = 标题 ∥ `[data-read]` 读数 ∥ 折叠控件——就地更新；旁挂计数钮 `.activity-new-btn` **身份存续**）；待审批族 ∥ 队列族 = **键控差分**（条目按 `promptId` ∥ 标题复用——#606③）；
  **子 agent 族容器（含 `[data-pool-body]` 祖先链）零摘离 ∕ 零移动**（块内容区位 ∕ 池自身滚动位跨帧**保真**——链不稳定则位面归零，单源 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2.3-A）；
  **子 agent 族按 key 复用元素**（`el._subMeta === model` 判据：同 key 跨帧同一元素——内容追加 / 折叠态 / ⏹ 全走核函数，**不重建**）；
  **R10 帧触发判据 = 触碰块换对象引用**（`archiveIntoFlow` 按核 `effects` 键集对被触碰块**换新引用**——未触碰块保原引用 ⇒ 帧比较对逐位引用即定触发，沿本档 §2 帧面分派同源）；
   形态单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3（KD-32 同裁 = `docs/desktop/design/PROJECT.md` §2）。
- **键域与换代（交付评审修正 · 2026-09-28）**：元素复用键域 = **会话内**（容器跨帧常驻不承旧账——同键重现于另一会话 ⇒ 元素账复位 ∕ 换代，禁沿用旧会话行账——relay id 按 agent 实例自 1 起计，同键跨会话重现属常态）；**换元素径**（新代接管）须**挂载后末刷**（⏹ 门控读 `isConnected`——与首见径同序）。
- **1s 拍面（R10 落）**：`thincoder-desktop/renderer/heartbeat.mjs`——拍体 = 在飞块逐块核件 `refreshBlock`（封装 = `refreshLiveBlocks`）+ 状态行重挂（`paintStatus`——装配单点 = `thincoder-desktop/renderer/app.mjs:269-276`）；**判据三件同序** = `_subMeta` 在场 ∧ `!frozen` ∧ 在连（逐值同 VSC `thincoder-vscode/webview/activity.js:149-153`）。
- **设置面与向导形（批 9 落）**：两形构树（`thincoder-desktop/renderer/views/settings.mjs` 四段面〔渠道 / 模型 / agent 参数 / MCP〕· `thincoder-desktop/renderer/views/onboarding.mjs` 三步向导——纯描述符 + 薄挂载，形态单源 = `docs/desktop/design/UI.md` §1）· 接线出档 = `thincoder-desktop/renderer/mount-settings.mjs`（自 `app.mjs` 拆出）；
  **零新事件通道**——读数 / 写入全走请求通道：写成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷 + 向导闸随新档态（**免二跳重调**）；填 key 经 `provider:verify` 真调一次；**闸 = `configured`**（档存在性——向导不进 / 设置面可进 + 明示不可读；零静默重置）。
  **容器面（批 9 裁定）**：挂载根 = `index.html` 单容器 `[data-slot="settings"]` 自身（窗口级覆盖层面——设置树 / 向导树**互斥**占槽：`configured` 假 ⇒ 向导树占位；退场 = `clear` 清空容器 ⇒ 主 UI 可用）。
  **退场口径（批 9 补——子节点面 ∥ 属性面）**：退场 = `clear` 清空容器（子节点面）**+ 薄挂载属性应收**——挂载期所加宿主属性须有复位回路；判据 = **退场后宿主属性集 ⊆ 挂载前属性集**（只增不减 ⇒ 判据不达）；**回路已落 · 单源 = `thincoder-desktop/renderer/views/settings.mjs` `syncHostProps`**（复位表 = `root` → 上次薄挂载所落属性名集 · 未再声明者摘除 · 骨架属性零动）——三挂载共用（设置 / 向导 / 信息行）。
  `removeAttribute` 两命中 = `thincoder-desktop/renderer/views/chat.mjs:227`（`data-streaming` 摘除）+ `thincoder-desktop/renderer/views/settings.mjs:281`（复位表摘除）；**长驻两面** = `thincoder-desktop/renderer/views/{chat,activity}.mjs`（:134 / :167）**无复位回路 ⇒ 码面池**（属性名集常量〔`chromeProps` 四名 · 池树两名〕⇒ 跨重绘不增 ⇒ 现值零残留）。

- **用户块（可见面修复批修 · 写者与出泡时刻 —— #458；「回合中插入」批扩写者；挂起窗径批扩抑制面 ∕ 时刻）**：活流 `user` 块两写者 = **发送面**（`msg:send` 回执 `ok` 真——直发径本地先行）+ **排队消费回执**（`ev:queue.delivered`——**五时刻**：步边界注入 ∕ 回合尾续发 ∥ **窗步边界消费** ∕ **窗内消费 ∕ 残续发**（挂起窗径批增 + 队列取项边缘收正批）；
  裁决与边界 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-40）+ **挂起窗径抑制面（挂起窗径批增）**：窗内提交零本地块（`onUserEcho` 判据 = `busyOf ∨ suspActiveOf`）⇒ 块唯一来源 = 消费回执；直发径「回执言队形」（含窗内受理）⇒ 本地块**退流**（终态 = 消费前流内零块）；
  失败径 ⇒ 本地块退流（零块）+ 失败行 + 稿留输入历史；**键门**（回执键 = 现刻 `activeSession`，非活动 ⇒ 零写；
  **在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场——页读 = `thincoder-desktop/src/main/session-slots.mjs:123` / `:145`；槽落盘在回合尾 = `thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）；
  块形 = `{ kind: "user", text, ts? }`（**与 `blockOfMessage` 回放块同形**——无 `id` ⇒ 键域回落位序，同回放；`ts` = 提交 ∕ 入队现刻——「对齐第二批」项 4 载波，非有限数 ⇒ 键缺席）·
  写入走 `appendBlock`（**既有**纯动作——`thincoder-desktop/renderer/store.mjs:73` 导出，归约面 `thincoder-desktop/renderer/events.mjs:21` / `:97` / `:105` / `:220` 四处已消费；`pendingNew` 语义同源）· 二十三通道零 `user` 通道（写入时刻 = 受理时刻 ⇒ 活流块 ⟺ 已受理）。
- **流式游标清点（可见面修复批修 —— #459）**：清点两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② **段界**（`ev:tool-call` 入场 ⇒ 助手文本段收束）；
  清点**须落块面引用**（新块对象 ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚——旁路态无刷新路径 = 缺陷成因面）· 辅助与两族调用点住归约面（`thincoder-desktop/renderer/events.mjs`）· 游标语义 = **末块追加态**（形态单源 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 四件）」项 3 · 裁决 = `docs/desktop/design/PROJECT.md` §2 KD-24）。
- **文本段行形态通则（可见面修复批修 —— #460）**：行内 ≥2 文本段（flex 行：`gap` ∨ `space-between`）⇒ **逐段包元素**（`span[data-seg="<段码>"]`；段缺席 ⇒ 零节点——空段仍占 flex 项 ⇒ 假间隔）；
  **裸串不得直作 flex 行子**（相邻文本节点合为单一匿名项 ⇒ `gap` / `space-between` 静默失效）；逐处段码与取舍 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 四件）」项 4。
- **重建保真族（2026-09-29 · 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.2 ∕ §2.4 · 台账 #604 ∕ #606）**：重建面位 ∕ 焦点保真**二分修形**——**身份保真 = 键控差分**（同一元素跨帧复用：会话控制条条目按会话键 ∕ 池两族按 `promptId` ∕ 条目 `title`——治跨帧点按丢击 ∕ 原生控件开态被销毁）；
  **改名草稿面（会话条）**：键控差分下输入节点跨帧存续（值 ∕ 光标 ∕ 焦点 ∕ 草稿四项皆保）——原 `readDraft` ∕ `restoreDraft` 两函数已随 RF 收口退役（旧制重建复填在差分歧径下成死重）；
  **位置 ∕ 状态保真 = 快照复填**（`thincoder-desktop/renderer/view-state.mjs`：`captureView(root)` ∕ `restoreView(root, snap)`——`snap = { scrolls, drafts, focus }`；focus 键回退链 = `id` → `data-field` → `data-action` → 结构路径兜底）。
  **对话流构造径**（首帧 ∥ 整置 ∥ 词面变——本档「建」条）：构造前捕 `root.scrollTop` + 归档块展开集（`[data-block-id]` 键）——`following` 真 ⇒ `stickToBottom(root)`；假 ⇒ 复原 scrollTop + 展开集（`open` 回真，不强制关闭）；其余四面（会话条 ∕ 状态行 ∕ 池 ∕ 卡面）以 `captureView` ∕ `restoreView` 包重建。
  **两处滚位例外（RF 收口层 · 代码注自陈）**：池（`mount-pool.mjs`）滚位复填仅未跟底（`_poolPin === false`）时执行（跟底帧尾钉底已写位——复填会夺位）；卡面（`mount-cards.mjs`）滚位不复填（挂载根 = 对话流共享滚动容器——滚位归对话流面帧尾律）。
  **设置面草稿保真闸**（#604——挂闸单点 = `paintSettings`（`thincoder-desktop/renderer/mount-settings.mjs:111-114`）⇒ 设置 ∕ 向导两树一闸）：挂载前捕获草稿、重建后复填（值 ∕ `checked` ∕ 焦点 ∕ 光标区间 ∕ 根 scrollTop）；
  捕获域 = 携 `[data-draft]` 标记的表单控件（键 = 控件 `id`，无 `id` ⇒ 标记取值）——非申报控件 ⇒ 取新模型值（负向锁）；`thincoder-desktop/renderer/views/settings.mjs` ∕ `thincoder-desktop/renderer/views/onboarding.mjs` 零改（越线档零增行）。
  **机制扩展三件（RF 收口层）**：① 未落件（残件）跨**在途**重绘携带（树定型即弃——免陈值复活）② 草稿作用域 `data-draft-scope`（表单身份换 ⇒ 旧草稿不复填——免 add→edit 串值）③ 同键多例捕获位序 `nth` 消歧（设置树两表单 `id` 重复）。三件皆加法、皆在同一重绘单点内，无新重绘径。
  **弱项两件**：归档块重放（`views/chat-subagent.mjs` `echoOf` 重建）⇒ 展开集复填覆盖（`fillSubagentEcho` 幂等保持）；提示带重建（`composer-sync.mjs:122-136` `paintNotices`）⇒ **行集等价零写门**（行签名同 ⇒ 零写；变 ⇒ 原位改文本 ∕ 最小重建）。判据 = M-604 a–c ∕ M-606 a–c + 真机 P1–P5（单源 = 批档 §2.2 ∕ §2.4）。

### 1.2 更新纪律：帧合并（收核 · 2026-09-29）

本批（`docs/batches/2026-09-29-render-perf.md` · 台账 #609）把 VSC 已付的轮子收核、桌面消费：**触发源 = store 变更 · 更新纪律收核**。机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-9**；本档只落接入面。

- **帧出口唯一化**：`store` 订阅 ⇒ `frame.mark(changedKeys)`（**O(1) 脏键集**——订阅回调零渲染）；帧触发后按键集分派五面（会话控制条 ∕ 状态行 ∕ 对话流 ∕ 池区 ∕ 卡面）——**每面每帧至多一次**（分派件 = `thincoder-desktop/renderer/frame-dispatch.mjs`；**帧时刻现读 `store.get()`**——禁 mark 时刻取态快照）。
- **帧合并件 = 核 `flow/frame.mjs` `createFrameMerge`**（脏标记 ∕ 帧合并 ∕ 应用器契约）：单飞 rAF + `FRAME_MIN_MS`（50——与核 `createStreamRenderer` 同值同意）；
  `flush()` = 同步尾帧（消费点 = 回底顺序保真（app 侧回底入口 `returnToLatest`——`thincoder-desktop/renderer/app.mjs:152`；内调 store 纯动作 `returnToBottom`——`thincoder-desktop/renderer/store.mjs:160`）+ 测试 ∕ 探针确定性）。
- **应用器契约**（KD-RC-9）：① 增量更新为默认（尾块就地 ∕ O(1) 追加 ∕ 面内差分；整面重挂仅判据命中）② 布局节俭（读数仅帧内、按档裁剪——禁逐 chunk 强制布局）③ 帧尾动作（滚动 ∕ 钉底 ∕ gating）落各面尾段、每帧至多一次 ④ 每 chunk 同步成本禁 ∝ 累计文本。
- **逐面落点**（2026-09-29 批）：会话流正文 ∕ 推理 = 帧界 + 尾块就地 md 重渲（核 `paintStreamTarget` ∕ `paintReasoningTarget`——帧内至多一次）；工具卡 = **就地更新**（头行分段刷 + 结果区核 `appendToolOutput` O(1) 追加——零重建；#605 消）；状态行 = 帧界 + 面内差分门（模型等价 ⇒ 零写）；池区 = 帧界（壳原位领用 = 让位修复批在册面）；卡面 ∕ 会话条 = 帧界（低频键面）。
- **尾块增量 md 与帧内组合（性能尾账批 · 2026-09-29 · 台账 #619）**：① 尾块文本面（正文 ∕ 推理）重渲 = 核**增量 md 画件**（冻结前缀零重渲 + 热区换代——机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-10**；桌面 `views/chat-text.mjs` 调用点零改——`paintStreamTarget` 同签名）；
  ② **帧内组合（就地改 + 追加）**：结算步天然同帧两动作（`flowStep` 刷项 + 尾段造项——`settleFrame` 同帧执行）——每新块边界的全面构造消（构造只余三触发——本档 §1.1「建」条）。

### 1.3 chrome 级直写面：右栏宽度拖动（D30 · 2026-09-30）

- **面判定**：本面 = **chrome 级直写**（不落 store 切片 ∥ 不进帧分派面表 ∥ 零 IPC）——先例 = 滚动面（直写 DOM ∥ 事件自持）；**零 `store` ∥ 零 `events` 依赖**（宽度零自动源——机检负控腿）。
- **模块缝**（已落 `thincoder-desktop/renderer/pool-width.mjs`）：注入缝 `{ doc, win, storage, root }`（缺省 = `document` / `window` / `localStorage` ∕ 锚查询）⇒ 平 node 直测；纯函数 = 值解析（非正有限数 ⇒ `null`）；
  导出 = `initPoolWidth`（装配入口：读存储 ⇒ 内联 `--pool-w` ⇒ 拖柄接线）∥ `refreshResizerLabel`（`t("pool.resize")` ⇒ `aria-label`）；**写径 = CSSOM**（`documentElement.style.setProperty("--pool-w", …)` 变量写；**`style` 属性写径列禁径**——平台行为未核）。
- **装配两点**（`thincoder-desktop/renderer/app.mjs`）：① 装配期一次 `initPoolWidth()`——**先于首绘可及面**（引导层在场期完成 ⇒ 零可见跳变）；② 帧分派 `locale` 支一调 `refreshResizerLabel()`（词表到位 ∥ 语言切换随动——单点）。
- **交互三段**（形态 ∥ 判据单源 = `docs/desktop/design/UI.md` §1「本批注（右栏宽度拖动 · D30 · 2026-09-30）」）：`pointerdown`（记起始宽 + 起始 x · `setPointerCapture` · `preventDefault` · `body.pool-resizing`）⇒
  `pointermove`（相对算式 ⇒ 内联 `--pool-w` 写（**写径 = CSSOM**）；**rAF 合帧**——每帧至多一写）⇒ `pointerup` / `pointercancel`（**落定前置（刷一拍）**：rAF 待写在场 ⇒ 撤帧 + 同步落待值（末次 move 位）⇒ 再**读回实宽** ⇒ 归一写回 + 存储写入 + 撤类——落定后零迟到写）。
- **界 = CSS 单落点**（`thincoder-desktop/renderer/chrome.css` 栅格行 `clamp`）：窗口 resize 零 JS（随窗重算）；模块侧零界常量（禁双实现）。
- **持久化**（`localStorage` 键 `thincoder.desktop.poolWidth` · 整数 px）：读 ∥ 写皆捕获 + `console.error`（零静默）；读失败 ∥ 非法值 ⇒ 视同未拖过（零内联写）；写时机 = 仅落定一刻。

### 1.4 主题三态面：`data-theme` 状态（D33 · 2026-09-30）

- **面判定**：本面 = **chrome 级状态直写**（渲染面 · 零 IPC ∥ 零 `events` 依赖 ∥ 主进程零行为面）——先例 = §1.3（宽度面）+ `dataset.locale` 帧写径；**与 §1.3 差异 = 持 store 镜面（设置面重绘键）；`dataset.theme` 写仍同步不经帧**；**用户值覆写系统缺省**（`system` = 缺省态——非零态）。
- **模块缝**（已落 `thincoder-desktop/renderer/theme.mjs`）：注入缝 `{ doc, storage }`（缺省 = `document` / `localStorage`）⇒ 平 node 直测；
  导出 = `initTheme`（装配入口：读存储 ⇒ 归一 ⇒ 写 `documentElement.dataset.theme` ⇒ 返值）∥ `setTheme(value)`（出口：三值闭集校验 ⇒ 应用 + 落存储 ⇒ 返落地值；表外 ⇒ `null` + `console.error`）；常量 = 键 `thincoder.desktop.theme` ∥ `THEMES`（三值闭集——控件序单源）。
- **装配两点**（`thincoder-desktop/renderer/app.mjs` / `thincoder-desktop/renderer/mount-settings-exits.mjs`）：① 装配期一次 `initTheme()` ⇒ `store.set({ theme })`（切片播种——先于首绘可及面，同 `initPoolWidth` 位）；② 设置面出口 `onSetTheme`（`setTheme` ⇒ 切片写——重绘触发键 = `mount-settings.mjs` `SETTINGS_KEYS` 增 `theme`）。
- **值面**（`thincoder-desktop/renderer/theme.css`）：单块 `light-dark()` 值对（色值对 **24**——原双块收敛；`--error-fg` 同值单列）+ `color-scheme` 三态（`light dark` 缺省 ∥ 两枚 `:root[data-theme]` 覆写）；`@media (prefers-color-scheme: dark)` 退场。非色变量（`--mono`）暗块同值重声明随块消解——单块单留；不入 `light-dark()`。
  值对函数支持面 = Chromium 123+（宿主实读 = Electron 44.4.5 ∕ Chromium 152.0.7977.130——`releases.electronjs.org`，2026-09-30）。
- **持久化**（`localStorage` 键 `thincoder.desktop.theme` · 三值闭集串）：读 = 装配期一次 ∥ 写 = 点按即刻；读 ∥ 写皆捕获 + `console.error`——读失败 / 表外 ⇒ `system`（降级）；写失败 ⇒ 会话内照常（fail-soft）。
- **单写者纪律**：`documentElement.dataset.theme` 写径全仓仅 `theme.mjs` 一处（机检负控腿）；任一 `theme` 切片写入须先经 `theme.mjs`。

### 1.5 后台态与渲染停摆：窗口不节流（#787 · 2026-10-01）

- **现象 ∥ 触发面（锁定）**：失焦 → 重获焦后小概率短暂假死（10–17s+，自行恢复；用户 2026-10-01 13:46 实报）。两天 20+ 例现场档族（`~/.thincoder/crash-reports/desktop-freeze-*.json`——渲染器 ping 失联 episode）；活体捕获 ×2 均落
  **「已 focus ∥ visibility 未复 / 渲染停摆」窗**：17:09:32 focus → 17:09:49 visible（≈17s）∥ 17:10:54 focus → 17:11:04 visible（≈10s）；rAF 停摆跨窗（gap 22.2s）；复后 200/300ms 抖动恢复。
- **签名（锁定）**：渲染器高 CPU（Tab 24–46%）+ 大工作集（382MB–1.3GB）；主进程健康（49–187MB）；JS 堆 ≤20MB ⇒ **非 GC 类**；应用层零焦点回调面（非自身注册面所致）。
- **机制判定（本批主因 · 收敛）**：窗口后台（Chromium 原生遮挡判定 ⇒ 页面 hidden；Electron 默认 `backgroundThrottling: true`）⇒ 渲染 ∥ 动画 ∥ 定时器停摆 + 绘制停止 + 进程后台类；主进程侧事件流（IPC）不停
  ⇒ 停摆期一切渲染请求延后、**复显时刻集中偿付**（引擎侧样式 ∥ 布局 ∥ 绘制 ∥ 光栅——软件合成路径全 CPU 承担）；且复显相变本身排队于未及时处理事件的主线程之后（复现窗 10–17s = 该相变窗——可见性事件迟到即直接证据）。
- **逐候选成立性（a–e）**：**a 成立**——时相锁定（复现窗 ×2）×「应用侧积压有界」可证（帧合并单飞 + 脏键集 + 作业单闭集：`thincoder-render-core/flow/frame.mjs:26-68` ∥ `thincoder-desktop/renderer/store.mjs:100` ∥ `:143-147` ∥ `thincoder-desktop/renderer/views/chat-stream.mjs:23-72`）
  ⇒ 10–17s 只能由「停摆—复显」相变与引擎侧偿付支付，非应用积压面。**b 不成立**——无队列可追赶（帧合并设计即防无界积压）；分块让渡 = 改帧率语义（用户可见行为）⇒ 越界。
  **c 成立为放大器**——工作集 382MB–1.3GB ⇒ 全窗重绘 ∥ 布局规模乘数；非扳机（非遮挡期风暴族 = 往批在册另账）。**d 成立为放大器**——renderer cmdline `--disable-gpu-compositing` = 环境注入（全仓零代码命中），应用不可改 ⇒ 不属应用修面。**e 排除**——JS 堆 ≤20MB 全样本 ∥ 往批 GC 结论。
- **修复面**：`thincoder-desktop/src/main/window.mjs` 窗口装配（`:127-132`）`webPreferences` 增 `backgroundThrottling: false`（单行开关）——
  **逐字引文**（宿主实装类型 `thincoder-desktop/node_modules/electron/electron.d.ts:19430-19437`——引文两句 = `:19431-19434`）：「frames will be drawn and swapped for the whole window」+「This also affects the Page Visibility API」；运行期同义属性 `:18805-18809`（同句）⇒ 关闭后台节流 = 后台期照常出帧与交换。
  **推断 ∥ 预期方向（引文未言——与逐字引文分列）**：①「后台不再判 hidden」= 方向推断（引文只言「affects」，未言方向）②「遮挡 ∥ 失焦 ∥ 隐藏」三面并列 = 推断（引文只作「when the page becomes background」）——验收触发面 = 批档 §2.5 可判形式；①② 两方向由 §2.5 focus→visible 读数厘定。⇒ 预期：页面不再进入停摆相（无可见性迟滞窗 ∥ 无复显集中偿付；证伪门 = 批档 §2.5 失败行）。
- **边界与代价**：用户可见行为零改（遮挡期不可见；可见期行为逐字同）；
  代价 = 后台期照常渲染——枚举 = ① 有在飞工作时 = 与可见期同量（由「复显集中」摊回常态；事件驱动 ⇒ 空闲期零帧）② **1s 拍面**（`thincoder-desktop/renderer/heartbeat.mjs:16` `HEARTBEAT_MS = 1000` ∥ `:37-48` `createHeartbeat`——定时器节流关掉后后台期照常走拍：在飞块逐块刷 + 状态行重挂）；**代价可实测** = 批档 §2.5 读数后台期三项（遮挡期 Tab CPU ∥ rafGaps 计数 ∥ 帧量）；
  渲染规模 ∥ 软合成 ∥ 摄取热路径 = 本批零动（放大器面在册）。
- **验收口径**：父侧真机复现 + 一行读数（停摆窗 ∥ longtask）——单源 = 批档 `docs/batches/2026-10-01-desktop-focus-freeze.md` §2。

### 1.6 关键决策（迁自 PROJECT.md §2 · 渲染核 · as-of 2026-10-02）

| 号 | 决策 | 依据 | 被否候选 |
|---|---|---|---|
| KD-27 | **会话流经共享渲染核**（D19）：文本面 = 核 Markdown（**「零 Markdown」改判**）；真代码块 / 复制 / 推理块 = 核件分件消费（渲染逻辑单源：`md` / `attachCopyButtons` / `renderReasoning`〔结构同形〕）；帧容器 / 工具卡族 / 卡族 = 桌面外壳留存（否「整件替换核 DOM」）；**文件链接承载**（「对齐第三批」D19 收正——宿主验存链 + 核包裹 + `file:open`；单源 = `docs/desktop/design/CHAT.md` §1 **KD-39**）；核落点 / 加载形 = `docs/render-core/design/RENDER-CORE.md` | 用户走查第 3 点 + D19「经共享渲染核」；同核 ⇒ 「基本对齐」结构性成立 | **保留纯文本**（违走查原话）；**桌面自写渲染面**（第二实现——用户 20:48 改判之由）；**落文件链接无出口**（假控件——KD-RC-5） |
| KD-48 | **桌面接装更新契约 = 帧合并件 + 每帧每面至多一次 + 帧内增量**（更新纪律收核批 · 2026-09-29 · 台账 #609）：① 触发源 = `store` 订阅 ⇒ 核 `createFrameMerge` `mark(changedKeys)`（O(1) 脏集；**帧时刻现读 `store.get()`**——禁 mark 时刻取态；`flush` 消费点 = `returnToLatest`（app 侧回底入口——`thincoder-desktop/renderer/app.mjs:152`）回底顺序保真）；② 分派 = `renderer/frame-dispatch.mjs`（键集 → 五面：会话控制条 ∕ 状态行 ∕ 对话流 ∕ 池区 ∕ 卡面——每面每帧至多一次）；③ 对话流帧内 = 结算步（`flowStep`——摘 ∥ 造 ∥ 刷；尾段先于读数、头段入补偿区间）+ 尾块就地（工具卡头行分段刷 + 结果区核 `appendToolOutput` O(1) 追加——节点身份不变）+ 读数按径裁剪；④ 状态行 = 帧界 + **面内差分门**（模型等价 ⇒ 零写——`blocks` 保持入键：工具段更新点随块面）；⑤ **不并入**：池壳 ∕ 重建面位焦族 ∕ 设置面草稿面（#603 在飞 ∕ #606 ∕ #604——排后）；⑥ 复制钮 gating = 随尾节点着装（重挂全根一次 + 尾段逐新节点——禁帧级全根扫）。`views/chat.mjs` 越 300 消解：模型族七件出档 `views/chat-model.mjs` | 用户报障 + 真机实锤（线性成本）+ #190 会诊（三笔 VSC 未付账：状态行逐 chunk 全量重建 ∕ 逐 chunk 多扫 ∕ 合成布局）；VSC 已付轮子直取（rAF 节流 ∕ O(1) 追加 ∕ 帧尾动作 ∕ 布局节俭）；机制单源 = 核档 §2 **KD-RC-9** | **不接（维持逐写即绘）**；**端自建节流**；**摘 `blocks` 出 `STATUS_KEYS`**（工具段失更窗——工具起 ∕ 结不落任何订阅键）∕ **窄切片**（新投影面 · 双源）；**工具卡整卡重建保留**（#605 不消）；**全文增量 md 渲染**（该批另议——本批落定 = 本档 §1.6 **KD-50** ∕ 核档 §2 KD-RC-10）；**虚拟化**（窗口 150 已有界） |
| KD-50 | **尾块增量 md + 帧内组合（就地改 + 追加）**（性能尾账批 · 2026-09-29 · 台账 #619）：① 尾块文本面（正文 ∕ 推理）重渲 = 核**增量 md 画件**（冻结切点 + 热区换代——三段定界 ∕ 增量单元 = 段落 ∕ 块；机制单源 = 核档 §2 **KD-RC-10**；桌面 `views/chat-text.mjs` 调用点零改）；② **帧内组合（就地改 + 追加）** = 结算步天然同帧两动作（`flowStep` 刷项 + 尾段造项——`views/chat.mjs` `settleFrame` 同帧执行）——每新块边界的全面构造消（2026-10-01 · #764 收正；单源 = `docs/desktop/design/RENDERER.md` §1.1） | 真机实测：80KB 帧 p95 **15.4ms** ∕ 密文（markdown 密度 ≈2×）**31.8ms**（全量 md 口径——8ms 预算不达根因）+ **每新块边界一次全量重挂**（帧合并使「尾块就地改 + 新块追加」同帧 ⇒ `streamDelta` reset ∧ 尾位不入重合判 ⇒ 全窗重建——前批上抛在册） | **保留全量 md 重渲**（预算不达——在册）；**重挂保留（组合回落不修）**（每新块边界一次 O(全窗)）；**固定字数滑窗热区**（非保守——未证区被冻结，正确性不可保）；**md 引擎重写**（双源——`md.mjs` 单源不动）；**组合档用「尾块整节点重建」**（节点身份失（选区 ∕ 滚位）+ 全量 md 重渲照旧——就地 path 已在） |
| KD-54 | **桌面堆累积收敛 = 诊断先行 + 对靶两腿（同批——承 #649 两腿形态先例 `docs/batches/2026-09-29-desktop-carryover.md:54-64`）**：① 诊断腿 = 堆快照钉点（渲染 ∕ 主双进程——读数表 + 按构造器分组快照差落批内件；**候选面在册（实读坐标）**——渲染 JS 侧：`renderer/store.mjs:93` ∕ `:128-132`（块树仅增不裁）· `renderer/views/chat-scroll.mjs:28`（150 仅 DOM 侧）· `:52-57`（窗限只增）· 块载荷无上限（`renderer/events-blocks.mjs:64` ∕ `:92` ∕ `:107`；宿主原样全量 `src/main/agent-bridge.mjs:230-236`）· 子代理 rows 无上限（`renderer/subagent-reduce.mjs:151`）· digest 按轮累积（`renderer/events-wake.mjs:50-57`）· 池族容器摘离引用（`renderer/views/activity.mjs:121`）∥ 主进程侧：装配表无驱逐（`src/main/agent-host.mjs:105`——清点仅 `session:delete` ∕ 切项目）· `turnEpochs` 无清除（`src/main/turn-driver.mjs:55`）∥ DOM 侧：巨块单段（#649 R-7 余账——`docs/render-core/design/RENDER-CORE.md:372` C10）∥ **核共享面（实测命中 · E2 命中分支兑现——2026-09-30 · 单源 = 批档 §2.13）**：`thincoder-render-core/flow/block.mjs` 逐 chunk 文本节点追加（`advisor-text` ∕ `toolOutput` 续写支——`:63-66` ∥ `:47-49`；文本节点洪峰 ≈102K）⇒ 并入末文本节点修法（desktop ∥ VSC 共享面））；② 对靶腿 = 钉点命中面收敛（**留存上界 + 释放 ∕ 重取路径**——缺一不可）+ 未命中面零动作（在册不盲修）；③ 巨块策略 = 渲染 ∕ 布局夹层（CSS `contain` ∕ `content-visibility` 先行——零语义（先例 = #649 候 A②）；**属性表点名 = `contain: layout style paint`（不含 `size`——高度确定性保持）∥ 备选 `content-visibility: auto`——须携 `contain-intrinsic-size` 且过「回填 ∕ 跟滚不跳」腿方采**；**JS 分段挂载 = 实施径**——CSS 支受控 A/B 实测不可及（无材料性收益 · 2026-09-30 父裁点火）：巨块渲染文本 > 24K 字符 ⇒ **12K 字符 ∕ 段**切分（`splitText` + `<span data-seg>` 包壳）· 窗 = 视口段 ±1 · 切换 = `display:none`（文本恒在 DOM——等价门 ∥ 搜索命中面完整）· `patchTextBlock` ∥ 核画件调用点零改（分段 = 挂载径初窗 + 帧尾窗步）· 回滚 = 常量开关 ∥ 整块直挂；机制 ∕ 参数 ∕ 三载径合成单源 = 批档 §2.15；**核 `live-md` 零触**——跨端共享面）**＋ H1 节流缺口支（归档回放 ∕ 心跳两径——回放分片 ∕ 拍体裁剪；候选在册 = §2.11；分支输入 = 1d 分判读数）**；④ 硬边界 = **呈现语义零改动**——射程 = 150 窗语义不动 ∥ 滚动上翻所见逐字同 ∥ **三面受损在册**（选区 ∥ 复制（可见段为限——巨块全量选择 ∕ 复制不完整）∥ 查找跳转（隐藏段命中无位移）——原生行为受损面，如实登记；接受口径随批准 ∕ 收口面落档——§2.15-B⑤ ∥ E②）；判据 = 内存上界断言 + 快照差 + 探针（long-task 计数 ∕ 帧成本 ∕ 文本逐字等价 ∕ **回填 ∕ 跟滚不跳**〔同判据 = T-DSK18 ∕ T-DSK19〕） | 【依据】批档 §2（机制 ∕ 判据单源 = `docs/batches/2026-09-30-desktop-heap-freeze.md`）；候选坐标全部实读在册；**现盘活体读数**：渲染进程 723 → 1,046 MB WS（2026-09-30 00:1x → 00:21 · ≈40–46MB/min 增长 ∥ 主进程 253–264MB 稳）⇒ 累积面在渲染侧为主嫌疑（实施期由 KD-53 武装读数钉死）；**E4 二刀实读（2026-09-30 · §5.7）**：CSS 支受控 A/B 三值（无夹层 18,948ms ∥ `contain` 19,460ms ∥ `cv-auto` 21,182ms——同噪声带）＋成本归因（`md()` 6ms ∥ `innerHTML` 1ms ∥ attach+强制布局 **≈21.8s**；CJK 超线性 60K=206ms → 600K=23.8s；同尺寸 ASCII 83ms）；§1.3 第二冻结（CPU 风暴 ∕ 堆 <1GB）= 双假设并行（H1 计算 ∕ H2 堆）——E2 ∕ E4 两腿分对位（映射 = 批档 §2.10） | 【被否】无诊断直接盲修（源未钉）；砍显示截断（呈现语义违）；改核 `live-md`（跨端共享面 ∕ 非本批射程）；改 150 窗语义（硬边界）；**JS 支弃形三例**（原串按字符切 + 逐段 md ∥ 占位 ∥ 高度替身替换 ∥ DOM 摘除卸载——等价门不可达；§2.15-B③） |
| KD-63 | **桌面流面 = 作业单自带 + 结算步（对账面重写 · 幻影机拔除）**（桌面流面对账面重写批 · 2026-10-01 · 台账 #764）：① **事件自带**——结构变更由发生点带作业（`state.flowOps`；写口单点 = `thincoder-desktop/renderer/store.mjs` `withFlowOp`——与 `blocks` 写同笔）：`build`（整置——页回执首屏 ∥ **回填页并入（回填落位批 · 2026-10-04）** ∥ 换会话 ∥ 关页 ∥ 退流清空（本地先行回声摘空 ⇒ 空态引导面复现））∥ `insert`（按位插入——座次位，#765 面）∥ `cut`（退流）；**新块到达零作业**（追加为常规路径——由账自明）；**清账 = 两径同清（构造径亦清 ∥ 结算径亦清）**——消 `build` 粘滞；**root 缺位 ⇒ 不清**——未消费不退账；② **结算步**——每帧以账（上帧窗块列 + 隐藏数）对模型窗整数量结算（纯件 `flowStep`：摘（按数）∥ 造（给没有节点的内容造节点——头段前插 ∥ 尾段追加 ∥ 中洞就位）∥ 刷（块对象变者就地））；③ **建 = 构造径**（首帧 ∥ 整置 ∥ 词面变——同径同形；`mountChat` + 快照复填）；④ **承载件保留**（帧写序 ∥ `t0` ∥ `t1` 双读数 ∥ 快照复填 ∥ 建树面）；⑤ **禁词一族（新面零命中）** = 八词（清单 = 批档 §1 ∥ §2）；机制明细单源 = 本档 §1.1「流面作业单」条 ∥「流面结算步」条 ∥「建」条；明细 = 批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §2 | 用户 2026-10-01 05:37–05:59 六斥（「过度设计」∥「已生成的 dom 元素」∥「只有最后那个块可能插」∥「修修补补」∥「换代重建」∥「虚幻假设」）+ 父侧实证（全量换新 100% 出自 `app.mjs:181` 一处判决径——台账 #764）；幻影审计 = 「挂载面与目标可能失配」不可达（渲染面 = 流面唯一写者 ∥ 游标 = 帧自己的账 ∥ 无静默丢通道） | **窗位扫描求解**（逐位配对 ∥ 重合最大化 ∥ 全或无判决）；**失配判决面**（任何「验不出就推倒」形态）；**逐位防务**（每帧配对裁判取代发生点自带）；**键表触发**（引用变即全拆） |
| KD-74 | **行痕族三员（帮助行 ∥ 停止痕 ∥ 到期触发行）清点时机 = 双门**（行痕族消失时机批 · 2026-10-04 · 台账 #919；timer 员并入 · 2026-10-05 · 台账 #952）：① **首屏门保留**（`applyPage` `before == null` 五清——`thincoder-desktop/renderer/page-read.mjs:265-278` 键集零动）；② **新增回合起跑门** = `msg:send` 出站即清（信号点 = `thincoder-desktop/renderer/composer-wire.mjs` `sendDirect` `:90` ∥ `sendQueued` `:165` 的 `call("msg:send")` 前沿同笔 → 纯动作 `clearTurnTraces`（新增住 `store.mjs`——摘 `helpLines[key]` ∥ `stopMark[key]` ∥ `timerNotice[key]`（timer 员并入） + 置闩 `stopHold[key]`））；③ **两门 = 幂等并集**（删键动作可交换；闩 = 门簿记**不入五清**；`stopHold` 不入 `CHAT_KEYS`——零渲染依赖）；④ **竞态 = 晚到 `stopped` 丢弃**（闩开窗内〔出站起、本键**回合首帧**前——`turn` 事件 ∧ 此前非 running，与 `turnStarts` 起刻同判〕到达的 `stopped` **只弃痕写**——`withStopMark` 单点门；回合尾其余结算〔位标 ∥ 清扫 ∥ 提问项 ∥ 池 ∥ 游标〕零触；依据 = 同键回合串行——宿主单驱动 `flights` 按键隔离）；⑤ **端差 = VSC 零触**（流尾行痕在 VSC 不存在——其 `[stopped]` = 消息内嵌注记 `thincoder-vscode/webview/streaming.js:142-143`，注记不入 `currentRaw`、历史重建即失、无尾组钉悬形态；用户可见退场面天然成立；判反 ⇒ 翻转对齐须另裁）；⑥ **timer 员并入（2026-10-05 · 台账 #952）**：`timerNotice[key]` 同门摘（出站即清）；**晚到 `ev:timer`（出站后到期）照写照显**——零丢弃机制（与 `stopped` 晚到分道：timer = 会话级独立事实、无「属上一回合」语义；显示期 = [到达，下一回合门)）；端差 VSC ∥ CLI 零触（VSC = 无尾组钉悬形态 · 载体系举证；CLI = 滚回 append-only 宿主能力差——翻转条件在册） | 用户 2026-10-04 20:55 走查（帮助行 ∥ 黄色 stopped 痕「再也不会消失」）+ 21:00 四选一裁定「下一回合开始即清」（台账 #919）；信号点判据 = 「**发出**下一条消息」字面（出站 = 用户动作同步时刻、直发 ∥ 忙态队两径全收）；晚到判据 = 同键串行 ⇒ 闩开窗内 `stopped` 必属上一回合；timer 员 = 2026-10-05 21:42 报障（停在流尾不消失）+ 21:59 点火（快车道）裁定并入（沿同语义——台账 #952） | **② 用户块受理**（忙态 / 挂起抑制出泡 ∥ 队径退流 ⇒ 同一发出动作可零信号）· **③ `ev:activity running`**（滞后宿主往返 + 队列延后 + 不分辨自动 / 消化 / 唤醒回合 ⇒ 误清）；**回执成功后清**（延迟 + 竞态窗更大 + 违「发出」字面）；**时序重排 / 缓冲终局**（丢弃已足——缓冲反引旧痕压新流）；**首屏门吸收起跑门**（切回才清——违裁定）；**`compress` 并入起跑门**（未裁零动——观察项；`timerNotice` 2026-10-05 已裁并入，见⑥）；**晚到 timer 丢弃闩**（误弃真闹钟——timer 无「属上一回合」语义，见⑥）· **VSC 同步改**（举证「不存在该痕」——翻转条件在册） |

（上表 = as-of 2026-10-02 迁移轮文本 + **KD-74**（2026-10-04 新立；2026-10-05 · 台账 #952 timer 员并入——非迁入）；**KD-54 渲染半边** = 全行迁入，其诊断 ∕ 宿主半边仍住 `docs/desktop/design/PROJECT.md` §2。）

## 2. 有界渲染窗口

- **MAX_RENDER_BLOCKS = 150**：只渲染尾部窗口，更早块折**「摘要块」**（可一键回填，回填后仍守窗口）；**不做虚拟化**（DOM 块数有界即达标——虚拟化不列入本版）。**值 = VSC `MAX_MESSAGE_BLOCKS`（`thincoder-vscode/webview/ui.js:204`）逐值对齐（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` §4 裁定 = 建议㈠ · E10 端差消）**。
- **窗限增量**：窗限 = 视图侧计数（初值 150）——回填收束沿（无在途 ⇒ 页并入）⇒ 限 + **本页归约后实际块数**（页量 = 核 `historyWindow` 缺省 200 **条**——**条 ≠ 块**，渲染面不写死页量），以宽窗容纳并入的更早页；未渲染更早块数落根锚 `data-hidden`（判据函数 = `nextWindow`——落点 = `thincoder-desktop/renderer/views/chat-scroll.mjs`）。`hasOlder ∧ data-hidden === 0` ⇒ 零摘要块（回填只经滚顶触发）。
- **留档块记账（「对齐第二批」项 5 · 留档批 · #719 收正）**：`kind === "subagent"`——留档块（页读域第六型）计入块序 / `data-blocks` / 尾窗渲染；**退出尾窗 ⇒ 计入 `data-hidden` ∥ 折摘要块 ∥ 可回填**（留档件——页读有源）⇒ 摘要块判据（`hidden > 0`）与回填触发（`hasOlder`）含留档块，与五型块同规。
- **流面结算步（非构造帧帧尾固定步 · 机制单源 = 本档 §1.1「流面结算步」条）**：账 = 上帧 DOM 所覆盖块列 + 隐藏数（帧层记账 `chatFrame`）——结算 = `flowStep`（纯件 · 平 node 直测）⇒ `{ drop, build, refresh, head }`：摘（头段越位——按数）∥ 造（窗位缺账项——头段前插 ∥ 尾段追加 ∥ 中洞就位，插点单源 = §1.1 插入点纪律）∥ 刷（留位且块对象变——就地；`refreshNode` = 文本族刷 ∥ 工具卡刷 ∥ 型变节点换）。
- **头段 / 尾段（分段规则）**：头段 = 保持段之前者（摘 ∥ 造）⇒ 帧尾读数区间内（§3 六步④）；尾段（追加 ∥ 中洞 ∥ 刷 ∥ 退流摘）⇒ 先于读数（§3 六步①）。
- **两条效果**：饱和追加 ⇒ 按数摘最旧守窗口（DOM 块节点数有界）；回填帧（页并入 ⇒ 限增——判据 `nextWindow` 零改）⇒ **构造径整置**（并入页块可见——记录序重放）；结算不随帧类型分面（`history` 帧同走）。
- **不变式（结算后）**：DOM 块节点序 ≡ 模型窗（逐位同块）⇒ 根锚 `data-blocks` = 窗长 = DOM 块节点数；构造帧同断言（`mountChat` 按窗建树）。
- **巨块分段窗（E4-JS 支 · 2026-09-30 · 机制 ∕ 参数单源 = 批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.15）**：巨块（渲染文本 > 24K 字符）按 **12K 字符 ∕ 段**切分——文本节点级 `splitText` + 行内续跑 `<span data-seg>` 包壳（顶层块节点即单元）；
  窗 = **视口段 ± 1 段**（可见 ≤4 段）；切换 = `display:none` 置 ∥ 清（**文本恒在 DOM**——`textContent` 等价 ∥ 搜索命中面完整）；每帧段状态变更 ≤ 2；
  初窗住挂载径（`dressNode` ∥ `mountChat`——先于一切读数步）· 滑动住帧尾第 ⑦ 步（内容帧 ∥ 滚动拍 `segView` 信号）；**与块窗两级叠加**——块窗管块序（本节各条零改），段窗管块内。**换代件判据 = 核画件热区桶 `_liveMd.hot`**（端**只读**——核侧零公开读面；跨核边界读私有 = 在册披露）：热件不切（换代节点自然隔断）。

## 3. 回填与跟滚

- 回填 = 滚至顶 **≤ 40px** ∧ 有更早页 ∧ 无在途 ⇒ 取一页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；**条 ≠ 块**），并入后按 `scrollHeight` 增量修 `scrollTop`（视口不跳）——三出口判定与补偿算式 = 纯函数 `scrollAction`（`backfill` / `follow` / `unfollow`）· `compensateTop`。
- **回填 = 整置（删档 + 新写——记录序重放 · 回填落位批 · 2026-10-04）**：回填帧 ⇒ 构造径（`mountChat`——行族随树按记录序复列）；视口锚定 = 帧出口补偿（`compensateTop` 单源——非跟滚 ⇒ 取 `t0` ∕ `t1`；
  读数裁剪不破：仅回填收束帧（帧身份 = 上帧在飞 ∧ 本帧坍落 ∥ 非跟滚）· 写门 = 高度净增 ΔH ≠ 0 才读 ∥ 才写——详式 = `docs/batches/2026-10-04-digest-reentry-order.md` §2 修正块 十·②）；跟滚 ⇒ 贴底覆盖；
  **零位置机具**（零寻位 ∥ 零搬移 ∥ 零算术）。
- 跟滚 = 近底 **24px** 复跟（判据 = 核工厂 `nearBottom`——严格小于：恰 24px 不判近底；`FOLLOW_PX` = 工厂 `NEAR_BOTTOM_PX` 再出口保名——2026-09-29 留端清算）。
  上滚即停跟；**药丸单判据 = `!following`**（「可滚 ∧ 非近底 ⇒ 显」与此**等价**——上滚即停跟；文本两态 = 未读数 > 0 ⇒ `chat.pill.new`（`${n}`），否则 `chat.pill.bottom`）；点击回底复跟；程序化平滑滚动互斥窗 **420ms**（判据 = `smoothWindowOpen(now, lastAt)`）。
- **滚动作落面**（DOM 写面点名）：跟滚追加 ⇒ **瞬时贴底**（写 `scrollTop`——先例 `thincoder-vscode/webview/ui.js:428`）· 药丸回底 ⇒ **程序化平滑**（`scrollTo({ top: scrollHeight, behavior: "smooth" })` + 记 `lastAt`）· `scroll` 订阅先过 `smoothWindowOpen(now, lastAt)` 门——**窗内不派发**（该判据真 ⇒ 窗已过期、可派发；程序化平滑的滚动回波不算用户动作）。
- **帧尾滚动作（补偿消费点）**：非构造帧末尾 `settleFrame(root, model, scroll, handlers, account)`（落点 = `thincoder-desktop/renderer/views/chat.mjs` · `paintChat` 调用）——六步序 = ① **尾段**（刷 ∥ 尾段造 ∥ 退流摘 ∥ 行族出生——**新到流项按到达序**：行族出生先于同帧补发块；皆**先于读数**）② 读数 `t0` ③ `syncChrome` ④ **头段**（摘 ∥ 造——按数；位次步 ④′ 保留）⑤ 读数 `t1` ⑥ 写（下两条）。
- **尾段步（第 ① 步）**：造项（尾段 ∥ 中洞）逐枚挂（插点单源 = §1.1 插入点纪律）；刷项就地（文本 + `data-streaming` 锚 ∥ 工具卡）；型变 ⇒ 单块节点换；同帧「刷 + 造」= 帧内组合（就地改 + 追加）本然。
- **帧尾三写（第 ⑥ 步）**：帧后跟滚 ⇒ `stickToBottom`（瞬时贴底——**写超值不读 `scrollHeight`**（浏览器鉗底），幂等）；非跟滚 ∧ 头段动数 > 0 ⇒ `compensate`（`compensateTop` 算式——`prevTop` = `t0.scrollTop`、`prevHeight` = `t0.scrollHeight`、`nextHeight` = `t1`）；其余 ⇒ **零写**。
- **补偿单权源**：`.flow` 置 `overflow-anchor: none`（`chat.css` 面）——头侧变更的视口锚定只由 `compensate` 显式承担，免浏览器自动锚定叠算。
- **读数区间记账**：区间 = [`t0`, `t1`] 跨头侧变更（摘 / 插 + 摘要块在场与文本）；尾侧（尾段挂载 / 就地更新 / 药丸——单行 `nowrap` 定高，`chat.css`）在区间外或零高度增量 ⇒ ΔH = `t1 - t0` = 头侧净增量。
- **瞬时写不记窗**：`lastAt` 只由程序化平滑（滚动面 handle 方法 `returnToBottom()`——`thincoder-desktop/renderer/views/chat-scroll.mjs:78`）记；`stickToBottom` / `compensate` 不记 `lastAt`——其滚动回波读数即真态（同值 `setFollowing` 归原态）。
- **读数按档裁剪（更新纪律收核批 · 2026-09-29）**：跟滚帧 ⇒ 帧尾两读数免读（贴底 = 写超值）；非跟滚帧 ⇒ 头动作 > 0（补偿径）才读 `t0` ∕ `t1`——即每帧读数 ≤2 且仅在补偿径（禁逐 chunk 强制布局；单源 = 核档 §2 KD-RC-9）。
- **块内容区跟滚（#518 收口 · 核原语直消费；让位修复批收正（2026-09-29））**：子 agent 块内容区（`.advisor-content`）跟滚 = 核件原语 `initBlockFollow` ∕ `maybeScrollBlock`（`thincoder-render-core/subblocks/block.mjs`；落点 = `thincoder-desktop/renderer/views/pool-subagents.mjs`）。
  **接线四点** = ① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——① 挂 `initBlockFollow`，余三点 = `maybeScrollBlock` 应用；
  **帧尾复核** = `mountPool` 尾逐块 `applySubBlockFollow(family)`（族级扫描——`views/pool-subagents.mjs` 新导出；VSC `streaming.js:31` 脏集对位：任何位面被抹 ⇒ 下一帧自愈）——**应用时机契约** = 核档 §2 KD-RC-8（应用点清单：追加后 ∕ 挂载后 ∕ 帧尾复核；“端只在宿主时刻调用核应用器”；端侧遗漏应用点 = **违约缺陷**）。
  判据 = `内容区._pinFollow`（**让位三律** = 近底 < 24px **无条件翻真** ∕ 远离底仅凭**用户手势门**（`wheel` ∕ `touchmove` ∕ `pointerdown` · 600ms）翻假 ∕ 非手势位移（复位回波 ∕ 程序写 ∕ 布局）**不改旗标**；`false` ⇒ **零写**——不夺阅读位）；
  让位期出口钮 `sub-follow-btn`（核件自持：`open ∧ 非冻结 ∧ 可滚` ⇒ 可见；两态 `sub.follow.new` ∕ `sub.follow.bottom`；点击 ⇒ 回底 + 复跟）——单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**；
  折叠（`open=false`）∕ 已移除 ⇒ no-op；写超值不读 `scrollHeight`；桌面帧 = **store 变更排帧**（核帧合并件——单飞 rAF + ≥50ms 间隔 + 脏键集；触发源 = store 变更——本档 §1.2 ∕ 核档 §2 KD-RC-9）。
  **键盘位移**（键盘滚动——无手势标记）不改旗标（非手势位移同路）；可达性 unverified（需真机核）⇒ **残余登记**（单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8）。**手势窗内以手势为准**（窗内非手势位移按手势期计——有意取舍）。
- **池区帧尾钉底（#518 收口 · R10 E6 帧尾径补齐）**：`views/activity.mjs` `mountPool` 尾 `maybePinPool(root)`（`views/activity-new.mjs`——`_poolPin !== false` ⇒ 写 `scrollTop`；VSC `webview/streaming.js:32` `frameEnd` 对位）；
  旗标维护 = `attachActivityNew` `scroll` 订阅（2026-09-29 改工厂 `createPinWatch` 消费——`gestureGateMs = 0`；零行为变更）；未钉底 ⇒ 零写。
  **让位修复批**：池位跨帧保真由领用径承担（池面挂载条）——`_poolPin=false` 时新 chunk 不再拽回顶（churn 消）；`_poolPin` 语义零改（#563② 有界自纠结论保持）；**区钉底判据 ∕ 清账路 = 滚动策略族同源**（核档 §2 KD-RC-8 ④——端 = 工厂消费（`maybePinPool` ∕ `nearBottom` 改工厂调用——`_poolPin` 保持）；判据漂移 = 缺陷）。
  **对拍机检腿** = 批次本地机检件（**本批须新增**——载体单源 = `docs/desktop/design/PROJECT.md` §4.2 本批行「测试面 ∕ 探针面」）。
- **池区旗标窗口登记（#563② 评估 · 残余族清账批 · 2026-09-29）**：`_poolPin` 三写者（点击 ∕ `scroll` ∕ 世代重置）+ 帧尾写守 `_poolPin !== false` 早退 ⇒ 极端窗口（上滚与帧尾写同刻）可夺回一次上滚 = **有界自纠**（非持续失效）——裁 = 维持现态；若真机走查再现夺回 ⇒ 再立小修。
- **滚动策略族工厂化（2026-09-29 · 留端清算 ∕ 台账 #607——机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8 ④ ∕ §5）**：策略族四件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记）抽核件 `thincoder-render-core/scroll.mjs`（已落）；桌面持载两档改**工厂消费**——
  `views/chat-scroll.mjs`（`FOLLOW_PX` = 工厂 `NEAR_BOTTOM_PX` 再出口保名；跟随判据 → 工厂 `nearBottom`；贴底写 = 工厂 `applyPin`）· `views/activity-new.mjs`（`maybePinPool` ∕ `nearBottom` 改工厂——`_poolPin` 保持）——**零行为变更**；块内容区两导出（`thincoder-render-core/subblocks/block.mjs`）同改薄包；对拍腿升级 = **工厂单源 + 消费面断言**（判据漂移 = 缺陷——载体 = 批内件）。
- **巨块段窗滚动作（帧尾第 ⑦ 步 · E4-JS 支 · 2026-09-30）**：段窗挂 ∥ 卸的视口补偿 = 帧尾补偿纪律**新消费方**（单权源 `overflow-anchor: none` 不动）：只计**视口顶锚之上的净高变化**（挂上 ⇒ `scrollTop += h`；卸下 ⇒ `scrollTop -= h`——先读后卸；锚下变更零补偿）；
  跟滚帧零读（底窗直取 + 贴底写覆盖）；执行点 = `settleFrame` 六步**之后**（独立显式补偿——与 [t0, t1] 区间互不叠算）；触发 = 内容帧尾 ∥ 滚动拍（`attachScroll` deps `onScrollTick` ⇒ `frame.mark(["segView"])`）。
- **边界**：本两条只覆盖**块内容区 ∕ 池区**——会话流主跟滚面单源保持（回填 ∕ 跟滚 ∕ 药丸 ∕ 帧尾三写 ＋ **巨块段窗滚动作〔2026-09-30 增——见上条〕**）。

## 4. 范本借用清单（实现工艺面）

清单前言（落形列 = 单源 · 全项只用浏览器原生能力 ⇒ **零框架零构建**（`docs/desktop/design/PROJECT.md` §2 KD-4）成立 · 证据级别两档 · 计数）住 `docs/desktop/design/UI.md` §3——本表不重复。

| # | 借用项 | 本端落形（本档 §2 / §3 规则行） | 来源坐标 | 级别 |
|---|---|---|---|---|
| 1 | 跟滚状态机 | 近底 24px 复跟 · 上滚即停跟（§3） | `thincoder-vscode/webview/ui.js:460-468`（`_pinBottom` 判定 `< 24`） | 本仓实读 |
| 2 | 新消息药丸 + 平滑互斥 | `!following` ⇒ 药丸（文本两态 = 未读数 / 无未读）· 点击回底复跟 · 420ms 平滑窗互斥（§3） | kimi-web `ConversationPane.vue`（419 状态机 · 501 平滑互斥 420ms · 1503-1512 药丸元素） | 外部转引 |
| 3 | 回填触发与补偿 | 顶 ≤ 40px ∧ hasOlder ∧ 无在途 ⇒ 取更早页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；条 ≠ 块）；按 `scrollHeight` 增量修 `scrollTop`（§3） | `thincoder-vscode/webview/history.js:79-88`（触发 + 防重入；先例阈值 40px）· `:57-61`（插入 + 高度补偿） | 本仓实读 |
| 4 | 首屏（补行） | 首屏页 = 追加 + 回底；恢复出的非空首屏先摘空态页，不残留（规则落点 = 本表本行）；页应用口径 = 非空首屏摘空态页 + 块面整置 + 回底（`following = true` / `pendingNew = 0`；块归约单源 = `thincoder-desktop/renderer/events.mjs`） | `thincoder-vscode/webview/history.js:43-46`（空态页摘除）· `:62-65`（追加 + 回底） | 本仓实读 |
| 5 | 有界渲染（不虚拟化） | 窗口 150 块 + 更早折「摘要块」（§2） | `thincoder-vscode/src/extension/history-window.mjs:12`（窗口算法 = 核单源转口）· kimi-web `ConversationPane.vue`（75 惰性页 prop） | 本仓实读 + 外部转引 |
| 6 | 回底按钮 | 与药丸**同一元素**（单元素两态——§3 药丸单判据）；回底 = **程序化平滑**（`scrollTo` + 记 `lastAt`——§3 滚动作落面） | `thincoder-vscode/webview/scroll.js:29-34`（`< 120` 非近底 · `> 40` 可滚） | 本仓实读 |

计数：**工艺面 6 行（第 1–6 项；第 4 行 = 首屏面补行，非独立借用项）** + 形态面 5 行（第 7–11 项，住 `docs/desktop/design/UI.md` §3）= **11 行 = 10 项借用 + 1 补行**；外部档引用 = 参考仓文件名 + 行号（参考仓非本仓，不展开路径）。

## 5. 文件账（本域）

### 5.1 本端文件清单与行数预算（本域族行 · 迁自 `PROJECT.md` §4.1——逐字）

| 文件 | 预估行数 | 说明 |
|---|---|---|
| `thincoder-desktop/renderer/app.mjs` | **328**（实读 2026-10-04——子代理面板批实施落盘（321 ⇒ 328——`panel-readout` 接线 = import ∥ 上报器构造 ∥ `applyFrame` 尾报（`app.mjs:42` ∥ `:59-60` ∥ `:318-320`）；非结构性）；前读 **321**（实读 2026-10-02——设置体系升级批（#817）实施落盘（319 ⇒ 321：deps 注入 `openSettings` ∥ `openSettingsModal` 二口——装配接线（非结构性））；前读 **319**（实读 2026-10-02——菜单体系批实施落盘（305 ⇒ 319；**越 300 ⇒ 越层在册——见 `PROJECT.md` §4.1 越层段**）；前读 **305**（实读 2026-10-01——复核扫面收正批实施后（299 ⇒ 305——帧内一次性门 ∥ M7 收口）；更前实读 2026-10-01——#764 拆批后（305 ⇒ 299——`paintChat` 两径；回线 ✓）；前读 305（主题切换批实施后（300 ⇒ 305：`initTheme` import + 装配期切片播种）；前读 300（实读 2026-09-30——右栏宽度拖动批落盘后（装配一调 + 词面两调 + 注释：292 ⇒ ≈295，实读 **300**）；前史：E4-JS 支（`attachScroll` 接线 += `onScrollTick`——289 ⇒ 292）后；撤会话头批（头接线八处退场，299 ⇒ 285）后随动 ⇒ 289；W6 届盘复读——parity-b10 R1 `settleBoot` 引导门） | 引导与会话 / 对话流接线（会话族接线与刷新 · 对话流槽接线与流式拉取——`paintChat`）——**在册预案落形**：池面接线拆出（`mount-pool.mjs`）；**批 9 续拆落形**：设置面 / 向导接线拆出（`mount-settings.mjs`——见 `docs/desktop/design/SETTINGS.md` §3.1 行）；**批 A 续拆落形**：输入区接线拆出（`thincoder-desktop/renderer/mount-composer.mjs`——批 A 新档）；**批 A 修正轮补登行动作接线**：`session:rename` / `session:delete` 两通道出口（invoke + 回执 `ok` 真 ⇒ 列表刷新；删除 ⇒ 邻位接管随动）· 提问卡出口引调（出站与清切片住 `thincoder-desktop/renderer/mount-cards.mjs`——计划卡零出口）· 两新档引调（`mount-composer.mjs` / `mount-cards.mjs`）⇒ **拆分落形**（批 A）：会话族接线拆 `thincoder-desktop/renderer/mount-sessions.mjs`（批 A 拆分落形）⇒ 本档落 **222**（批 A 末实读——预案消解）；**批 B 追加轮**：对话流构树引调增 `onOpenDir` / `onNewSession` 两接线 + `CHAT_KEYS` 增 `"project"`（首启引导面动作出口——单源 = `docs/desktop/design/UI.md` §1 批 B 追加注）；**模型菜单全渠批**：`onConfig` 增线 ⇒ `composer.refreshCandidates()` + `attachSettings` deps 增键 `onProvidersChanged`（迟绑定）；**撤会话头批**：头接线退场（`HEAD_SLOT` ∕ `paintHead` ∕ 两导入 ∕ 候选首取 ∕ 面表 `head` 键） |
| `thincoder-desktop/renderer/events.mjs` | **271**（实读 2026-10-01——桌面二择批实施后（269 ⇒ 271——`clearApproval` 判据过共享谓词）；更前 = 269（复核扫面收正批：265 ⇒ 269——M3 起源键 ∥ M22 注）；更前实读 2026-09-30——前读 264；#510 留守拆档后〔`events-blocks` ∕ `events-slices` ∕ `events-status` ∕ `events-wake` 四档分产〕；≤300——越层消解） | 事件归约面：`ev:*` **二十三条**通道 → 切片写者单源（`reduce` 纯函数 · `applyPage` 回执两径 · `blockOfMessage` 页→块归约 · **批 A**：`ev:question` / `ev:task` 由直返改**写切片** `questions` / `tasks`——零 DOM ⇒ 平 node 直测（`ev:question` 同处按**同码闭集**置本键 `approval` 位标——与 `onApproval` 同形；置位面点名 = `docs/desktop/design/UI.md` §1 提问呈现行）；形态单源 = 本档 §1.1）；批 A 后**贴 300 层**：拆分预案 = 两新切片归约拆 `thincoder-desktop/renderer/questions.mjs`（**已落**）；**批 A 修正轮收正**：回合终局三径（`ev:activity`〔无 `fields`〕`done` / `stopped` ∨ **`ev:error`**——`isTurnTail` **吃两通道形**（`ev:activity`〔无 `fields`〕∧ `event ∈ {done, stopped}` ∥ `ev:error` 单形载荷 `{ key, text }`——两通道同调此谓词），错误径清本键 `running` + 位落 `done`（`onError`）；单源 = 本档 §1.1 回合尾三径条）；**批 B 增**：`ev:usage` 归约（按会话 `key` 写切片——唯一写者 · 未至 / 非正数 ⇒ 零节点——KD-20） |
| `thincoder-desktop/renderer/events-blocks.mjs`（#510 拆档产出） | **135**（实读 2026-09-29） | 块面归约径 + 块面原语（推理 ∕ 正文流式续写 ∕ 工具块三径；`reduce` 分派面留主档） |
| `thincoder-desktop/renderer/events-slices.mjs`（#510 拆档产出） | **149**（实读 2026-10-04——#913 落盘（162 ⇒ 149——`onLedger` `lines` 支整删）；前读 162（实读 2026-09-29）） | 读数与切片归约径（读数槽族 + goal ∕ queue ∕ ledger 切片） |
| `thincoder-desktop/renderer/events-status.mjs`（R4 拆档产出） | **87**（实读 2026-09-29） | 状态面切片归约（`ev:statusText` ∕ `ev:compress` 两切片） |
| `thincoder-desktop/renderer/events-flags.mjs`（输入面板移植拆档产出） | **48**（实读 2026-09-29） | 模式位切片归约（`applyFlags` 纯动作——页读 ∕ 回执 ∕ `ev:flags` 三径同点） |
| `thincoder-desktop/renderer/events-subscribe.mjs` | **101**（实读 2026-10-02——菜单体系批实施落盘（93 ⇒ 101）） | 订阅接线出档（自 `events.mjs` 拆出——300 行拆分层落形）：二十三条通道表 + `attachEvents({ on, store, invoke, onTurnTail })`（退订句柄 · 回合尾标题刷新——`sessions:list` 复用零新通道）；单向依赖归约档（无环——形态单源 = 本档 §1.1） |
| `thincoder-desktop/renderer/badges.mjs`（残余批拆分产出） | **41**（实读 2026-10-01——桌面二择批实施后（30 ⇒ 41——#780 共享谓词 `hasPendingFor` + import 边）；前读 2026-09-29 = 30） | 共用件出档（`BADGES` / `badgeStamps`——events / questions 单一实现；自 `thincoder-desktop/renderer/events.mjs`） |
| `thincoder-desktop/renderer/heartbeat.mjs`（R10 落） | **48**（实读 2026-09-29——内容行数口径；停滞轻显形批后复读） | 1s 拍面：拍体 = 在飞块逐块核件 `refreshBlock`（封装 = `refreshLiveBlocks`）+ 状态行重挂（`paintStatus`——装配单点 = `thincoder-desktop/renderer/app.mjs:269-276`）；判据三件同序（`_subMeta` ∕ `!frozen` ∕ 在连——单源 = 本档 §1.1 拍面条） |
| `thincoder-desktop/renderer/view-state.mjs` | **294**（实读 2026-10-01——复核扫面收正批实施后（299 ⇒ 294——M16 结构兜底全删）；更前实读 2026-09-30——RF 批落盘 **290**；#652 失效集过滤后 299；RF 收口登记缺口补行——台账 #661） | 快照族：`captureView` ∕ `restoreView` ∕ `dropDrafts`（滚位 ∕ 草稿 ∕ 焦点；消费 = 挂载面重建保真；单源 = 本档 §1.1） |
| `thincoder-desktop/renderer/store.mjs` | **368**（实读 2026-10-05——timer 提醒行回合起跑门批（#952）实施落盘（365 ⇒ 368——`clearTurnTraces` 扩员（timer 员并入——三键摘 + 闩置））；前读 **365**（实读 2026-10-05——设计轮实读收正——表载 341 ⇒ 365）；前读 **341**（实读 2026-10-03——无效渠道态逻辑归一批（#841）实施落盘（331 ⇒ 341——`providerState` 切片 + `setProviderState` 纯动作）；前读 **331**（实读 2026-10-02——设置体系升级批（#817）实施落盘（330 ⇒ 331：`settings.modal` +1 键——**非结构性** ⇒ 消解窗口顺延）；前读 **330**（实读 2026-10-01——复核扫面收正批实施后（332 ⇒ 330——M7：初态切片 ∥ 注）；更前实读 2026-10-01——**#764 落盘后**（#761 322 ⇒ #764 332——`flowOps` 切片 + `withFlowOp`；续期裁）；前读 **307**（主题切换批实施后（303 ⇒ 307：`theme` 顶层切片 + 档头槽注）；前读 303（实读 2026-09-30——**留档批（#719）**：`visibleWindow` 去 `subagent` 例外（留档块与五型同规——净 +1 = 注释）；**越 300** ⇒ 越层在册 + 拆分预案 = 续拆评估（切片族）——本批触碰 = **行级小修（非结构性）⇒ 消解窗口顺延**；见 `PROJECT.md` §4.1 越层段）） | 单状态树 + 订阅（批 9 增两切片：`settings`〔渠道 / 模型 / 参数 / MCP 四组 + 三态〕· `projectInfo`〔台账计数 + 相位〕；批 A 增两切片 `questions` / `tasks` + 队列面（**「回合中插入」批收正**：`pending` 切片 = `ev:queue` 镜面——原三纯动作 `enqueue` / `dequeue` / `drainQueue` 与 `pool.queue` 写面随本地队列退场，权威 = 宿主，单源 = `docs/desktop/design/COMPOSER.md` §1 **KD-40**）；**会话模型轮 R13**：标签族三角（`tabs` / `activeTab` / `pendingClose`）与 `railForm` 族退场——会话开合 ∕ 换形归 `thincoder-desktop/renderer/mount-sessions.mjs` 面内记账）；**批 A 预算构成** = 两切片 + 三队列纯动作 + `QUEUE_MAX` + 注释面（~40 行）⇒ 批后实读 **310**（越 300 ⇒ **拆分预案** = 队列面（三纯动作 + `QUEUE_MAX`）拆 `thincoder-desktop/renderer/queue.mjs`（**已落** · 实读 **41**）——消解窗口 = 下次**结构性**触碰的批（注释 ∕ 坐标 ∕ 词值 ∕ 行级小修不计））；**批 B 增**：`usage` 切片（回合尾读数按会话 `key`）· `settings` 切片模型候选随 `model:list` 元素形（逐项 `.id`）；**模型菜单全渠批**：切片形收正 `{ models, unavailable }`（`forProvider` 去名）+ 纯动作 `setModelCandidates(state, models, unavailable)`（同引用才回原态）；**留档批**：`visibleWindow` 例外摘除（留档块计 `data-hidden` ∥ 可回填——与五型同规） |
| `thincoder-desktop/renderer/frame-dispatch.mjs`（更新纪律收核批） | **53**（实读 2026-09-30——E4-JS 支（`CHAT_KEYS` 增 `"segView"` 哨兵键——52 ⇒ 53）；前史：撤会话头批落形（`HEAD_KEYS` 与头面行删，55 ⇒ 52）；五面映射） | 帧分派纯件（键集 → **五面**映射；面回调注入 ⇒ 平 node 直测） |
| `thincoder-desktop/renderer/dom.mjs` | **69**（实读 2026-09-28） | DOM 工具（切片 3 判域迁入——渲染工艺单点：`dom.build()` = 本档 §1.1 唯一 DOM 构造点；原址指针在册） |
| `thincoder-render-core/flow/block.mjs`（核共享面 · E2 实测命中档） | **153**（实读 2026-09-30——内容行数口径；E2 命中分支落盘后 145 ⇒ 153） | 顾问 ∕ 子代理块内容面（`appendAdvisorChunk`——文本 ∕ 推理 ∕ toolOutput 续写支）；**E2 命中分支** = 续写改并入末文本节点（语义等价）；现行 ⇒ 实读落值（153——`docs/desktop/design/SHELL.md` §5.2 批块行 8 ∕ 核档 §6 随动段同拍；单源 = 批档 §2.13）（切片 3 判域迁入——原址指针在册） |

**行数面机检**：本表迁出后，`checkConfig.lineCounts`（`PROJECT-MANIFEST.json`）读取面 = `docs/desktop/design/PROJECT.md` §4.1（运行根单读）——本表行按同值同步；后续本域新档由落盘批在本表补行（沿 §4.1 纪律）。
**原址指针**：本族各行在 `docs/desktop/design/PROJECT.md` §4.1 已改一行指针（as-of 2026-10-02）。

### 5.2 现有文件改动 · 批块（本域 · 迁自 `PROJECT.md` §4.2——逐字；块内「本档」类回指已按新落点改指）

**本批（更新纪律收核批 · 2026-09-29）行「现行 ⇒ 预期」**（实读 2026-09-29——行计数口径；机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-9** · **KD-48**（本档 §1.6） ∥ 本档 §1.2；批档 = `docs/batches/2026-09-29-render-perf.md` §2；台账 #609）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-render-core/flow/frame.mjs`（核新档） | — ⇒ **≈60 → 终读 69**（帧合并件：脏标记 ∕ 单飞 rAF ∕ `FRAME_MIN_MS` ∕ `flush` ∕ 应用器契约注） | 本批 |
| `thincoder-render-core/flow/stream.mjs` | **113 ⇒ ≈135 → 终读 135**（+`appendToolOutput`） | 本批 |
| `thincoder-render-core/test/run.mjs` | **82 ⇒ 82**（零改——帧归并用例住批内件；全清令） | 本批 |
| `thincoder-vscode/webview/chat-messages.js` | **267 ⇒ ≈262 → 终读 262**（toolOutput 支改指核件——零行为变更） | 本批 |
| `thincoder-desktop/renderer/app.mjs` | **271 ⇒ ≈275 → 终读 299**（贴线 ≤300；帧接装：进口 ∕ 构造 ∕ 订阅改 `mark` ∕ 分派引调 ∕ `returnToLatest`（app 侧回底入口）flush 点；分派体出档） | 本批 |
| `thincoder-desktop/renderer/frame-dispatch.mjs`（新档） | — ⇒ **≈50 → 终读 55**（键集 → 六面分派纯件——回调注入） | 本批 |
| `thincoder-desktop/renderer/views/chat-model.mjs`（拆分产出） | — ⇒ **≈95 → 终读 104**（模型族七件出档——越 300 消解） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | **362 ⇒ ≈265 → 终读 284**（机械面就地化：工具支零重建 ∕ 扫描收敛 ∕ gating；拆分后——越 300 消解） | 本批 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | **217 ⇒ ≈233 → 终读 299**（贴线 ≤300；结果区增量刷新助手——`appendToolOutput` 消费 + 记账） | 本批 |
| `thincoder-desktop/renderer/views/chat-chrome.mjs` | **292 ⇒ 零改（292）**（帧内锚查询实测 ≈0.32ms/帧 ⇒ 无功能必要——#223 披露①；父侧裁维持；**贴层**登记 §10 CF 仍有效） | 本批 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | **93 ⇒ ≈99 → 终读 103**（`stickToBottom` 写超值不读 + 读数裁剪助手） | 本批 |
| `thincoder-desktop/renderer/views/statusline.mjs` | **177 ⇒ ≈182 → 终读 205**（面内差分门——模型等价 ⇒ 零写） | 本批 |
| 测试 ∕ 探针面 | 批内件两档 = `docs/batches/2026-09-29-render-perf.test.mjs`（平 node 机检）+ `-probe.mjs`（真机计时扩面——来源 = `.thincoder/tmp/perf-probe.mjs`，原件保留）；仓套件不写 ∕ 不改 ∕ 不跑（全清令——射程 = 五仓测试树：core ∕ cli ∕ vsc ∕ desktop ∕ render-core；本批机检载体 = 批内件两档，核 ∕ VSC 套件零触）。〔收位 ✓ 父侧 copy 终位；**亲跑 17 ∕ 17**；探针 249 行亲跑读数——R-1 ✓（比 0.22）· R-2b ✓ · R-3 ✓ · **R-2a ✗（p95 15.4ms——预算裁定见 §6）**〕 | 本批 |
| `docs/render-core/design/RENDER-CORE.md` + `docs/desktop/design/{RENDERER,UI,PROJECT}.md` | 本批设计落定（KD-RC-9 + KD-RC-8③ 收正 ∕ 本档 §1.2 ∕ 同句域两处收正 ∕ 本档 §1.6 KD-48 + 本档 §5.2（本块））——需求档性能行阈值与测法 = 父侧落笔（`PROJECT.md` §10 **CE**） | 本批（已落） |

**本批（性能尾账批 · 2026-09-29 · 台账 #619）行「现行 ⇒ 预期」**（实读 2026-09-29——行计数口径；机制 ∕ 判据单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-10** · **KD-50**（本档 §1.6） ∥ 本档 §1.2 ∕ §2 ∕ §3；批档 = `docs/batches/2026-09-29-perf-residuals.md` §2 ∕ §5；**实施轮落——设计预估已按盘收正**）：

| 文件 | 现行 ⇒ 预期（构成） | 批 |
|---|---|---|
| `thincoder-render-core/flow/live-scan.mjs`（核新档——实施拆档） | — ⇒ **351**（冻结切点扫描器 `liveCut`；> 300 顾问线（< 500 硬限）——未再拆，给由 = 批档 §5） | 本批 |
| `thincoder-render-core/flow/live-md.mjs`（核新档） | — ⇒ **≈170 → 终读 179**（分片画件 `paintLiveMd`；`liveCut` 经其再出口保签名——三段定界 ∕ 保守律 ∕ 分片全绘 ∕ 热区换代 ∕ 兜底复位） | 本批 |
| `thincoder-render-core/flow/stream.mjs` | **135 ⇒ ≈140 → 终读 135**（`paintStreamTarget` 改走画件——签名 ∕ 兜底语义不变；`paintReasoningTarget` 同签名随动——委托净零） | 本批 |
| `thincoder-render-core/test/run.mjs` | **82 ⇒ 82**（零改——用例住批内件；全清令） | 本批 |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | **77 ⇒ ≈105 → 终读 101**（`streamDelta` 增 `patch-append` 档 + 广义追加；`alignPlan` combo 支（`patchAt` + 守卫）；`paintPlan` 携 `appended`） | 本批 |
| `thincoder-desktop/renderer/views/chat.mjs` | **284 ⇒ ≈296 → 终读 290**（`patchTail` 携 `patchAt` + `settleFrame` combo 支——**< 300 未触越层预案**；结构不变） | 本批 |
| `thincoder-desktop/renderer/app.mjs` | **299 ⇒ 299**（`alignPlan` 调用点一行形改——零净增） | 本批 |
| 零触面 | `thincoder-vscode/webview/**`（调用点零改——核件同签名）· 核 `subblocks/*`（子代理内容面 = 纯文本拼接非 md——不在射程）· `md.mjs`（单源不动）· 两端套件（全清令） | 本批 |
| 测试 ∕ 探针面 | 批内件两档 = `docs/batches/2026-09-29-perf-residuals.test.mjs`（平 node——C12 ∕ C13 + VSC 复证对拍）+ `-probe.mjs`（真机扩面——R-1 ∕ R-6 ∕ R-7 ∕ R-8 ∕ R-9；来源 = `docs/batches/2026-09-29-render-perf.probe.mjs` 扩面，原件存续）；仓套件不写 ∕ 不改 ∕ 不跑（全清令——五仓测试树） | 本批 |
| `docs/render-core/design/RENDER-CORE.md` + `docs/desktop/design/{RENDERER,PROJECT}.md` | 本批设计落定（KD-RC-10 + KD-RC-9 被否列口径收正 ∕ 本档 §1 两行 ∕ 本档 §1.2 增条 ∕ 本档 §2 对齐判据 ∕ 本档 §3 尾段挂载 ∕ 本档 §1.6 KD-50 + 本档 §5.2（本块））——需求档性能行收正 = 父侧落笔（`PROJECT.md` §10 **CM**） | 本批（已落） |

**本批（桌面流面对账面重写（幻影机拔除）· 设计轮 · 2026-10-01 · 台账 #764 · 批 `docs/batches/2026-10-01-desktop-flow-reconcile.md`）行「**现行 ⇒ 实读（实施落盘 · 父侧回填）**」**
（实读 2026-10-01——内容行数口径（文末换行不计）；机制 ∕ 判据单源 = `docs/desktop/design/RENDERER.md` §1.1（流面作业单 ∥ 流面结算步 ∥ 建）+ §2 ∥ §3；**实施落盘（#93）· 父侧回填**）：

| # | 档 | 现行 ⇒ 预期 | 面 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/views/chat-stream.mjs` | **101 ⇒ 72**（实读；重写——判据族 ∥ 扫描族 ∥ 全量键 ∥ 帧前判据全删；留 `blockKey` + 新结算纯件 `flowStep`） | 结算面 |
| 2 | `thincoder-desktop/renderer/app.mjs` | **305 ⇒ 299**（实读——回线 ✓；`paintChat`：两径 = 构造（首帧 ∥ 整置 ∥ 词面变）∥ 结算（作业单消费 + 结算后清）；帧记账 `chatFrame` 增 `hidden`；**越 300 咨询线 ⇒ 本批净减回线——越层段随实施轮读数收正**） | 装配 ∥ 帧出口 |
| 3 | `thincoder-desktop/renderer/views/chat.mjs` | **230（= #765 落盘后基数）⇒ 204**（实读）（`settleFrame` 改结算式（签 = `(root, model, scroll, handlers, account)`）；`patchTail` 泛化 `refreshNode`；头段 = 摘 ∥ 造按数；**④′ 位次步 ∥ `_blockAt`/`_blockSeat` 记账保留零动（#765 面）**；净变 ≈ −5 沿前估；实读回填随实施轮） | 帧尾面 |
| 4 | `thincoder-desktop/renderer/store.mjs` | **322（= #761 落盘后基数）⇒ 332**（实读）（+`flowOps` 切片 ∥ `withFlowOp` 纯动作——**越层在册；触碰 = 结构性（新切片）⇒ 拆档评估窗口（同 #761 在册）；处置 = **父侧裁 2026-10-01 = 续期**（实读 332）**） | 状态树 |
| 5 | `thincoder-desktop/renderer/page-read.mjs` | **268（= #765 落盘后基数）⇒ 235**（实读）（两作业点：首屏 `build` ∥ 回填 `prepend`；净变 ≈ +3 沿前估；实读回填随实施轮） | 页读面 |
| 6 | `thincoder-desktop/renderer/subagent-reduce.mjs` | **258（= #765 落盘后）· 本批零变**（座次支 `insert` 随 #765 退场——零作业点；实读 258——**#765 拆机时随径退场**；越层档读取数随实施轮） | 归约面 |
| 7 | `thincoder-desktop/renderer/composer-wire.mjs` | **254 ⇒ 262**（实读；退流一作业点 `cut` + 摘空并 `build`） | 输入区 |
| 7b | `thincoder-desktop/renderer/session-wire.mjs` | **199 ⇒ 202**（实读；关页一作业点 `build`——mid-life 关页（唯一会话删除 ∥ 列表空）同笔 `withFlowOp`；`none` 态引导面由构造径承接；净变 ≈ +1） | 会话族接线面 |
| 8 | 批内件 | `docs/batches/2026-10-01-desktop-flow-reconcile.test.mjs`（**已建成 · 804 行 · 六腿（6/6 绿）**；腿集 = 批档 §2 修复轮 1 ∥ 修复轮 2 修正块：腿 1 结算纯件八例（含混帧——`prepend` + `cut` 同帧；关页例——`build` 作业承 `none` 态：引导节点唯一子）∥ 腿 2 同尺复测（全量换新 = 0）∥ 腿 3 滚动补偿 ∥ 腿 4 序 / 内容（含构造径终态对拍）∥ 腿 5 禁词 + 写点白名单（五作业点）；随批留存 · 不进仓套件） | 全批 |
| 9 | 设计档 | `docs/desktop/design/RENDERER.md` §1 索引两行 + §1.1（作业单 ∥ 结算步 ∥ 建 ∥ 帧尾态刷条 ∥ 快照族条）+ §1.2 ② + §2 四条 + §3 两条 + 变更记录 · 本档 §1.6 **KD-63** ∥ **KD-48③** ∥ **KD-50②** ∥ `docs/desktop/design/PROJECT.md` §4.1 `chat-stream.mjs` 行 ∥ 本档 §5.2 本块（含修复轮 2 补行 7b） ∥ 变更记录 · `docs/desktop/design/UI.md` §1 批 B 追加注项 2 ∥ 变更记录（修复轮 2） | 全批 |

零触面：`renderer/views/chat-scroll.mjs` ∥ `renderer/frame-dispatch.mjs`（`flowOps` 不入面键集）∥ `renderer/views/chat-chrome.mjs` ∥ `renderer/views/chat-model.mjs` ∥ 核包 ∥ CLI ∥ VSC ∥ 宿主面 ∥ 记录面 ∥ **消化面（#765——座次步 ∥ 归档面零触）**；测试面随修随加——不占设计条目（2026-09-27 裁定）。

**余量**：§4.2 余块 = 零（本域余块「流面对账重写」已随「2c 前置步 · 文件账分片轮（切片 3）」迁入本档 §5.2；跨域块〔重建保真 等〕= 留 `docs/desktop/design/PROJECT.md`——判读在册）。§6.1 ∕ §7 ∥ §10 域行——随分片轮承接（本档不双载）。

## 变更记录

- 2026-09-25：建档（桌面端设计批 1 · 分档轮）——由 `docs/desktop/design/PROJECT.md` 分出渲染工艺面：§1 = 工艺索引（该档 §3.1 渲染子树注与 §4.1 行的形态归并，详述仍住原址）；§2 / §3 = 该档 §9 的「长会话渲染」「回填与跟滚」两行逐字；§4 = 该档 §11 的工艺面 6 行（第 1–6 项）逐字 + 前言指针。该档 §9 / §11 位置改留一行指针。
- 2026-09-25（**批 3 视图面首段 · 左列**）：§1 增「视图面形态」行 + **§1.1**（视图档 = 纯描述符构树 + 薄挂载 · 唯一 DOM 构造点 = `dom.build()` · 文案一律经 `t()`）。
- 2026-09-26（**批 5 会话族批**）：§1 索引增「接线形通则」行 + §1.1 增**接线形通则**条（handlers 两态落形 · 诚实非死控 · 树形只随 handlers 变；关闭确认面形态单源 = `docs/desktop/design/UI.md` §1 交互行）。
- 2026-09-26（**批 6 对话流 + 工具卡（视图面）**）：§1.1 增**接线面（第二形）**条（`attachXxx(root, deps)` · 常量与事件订阅收口 · 判定算式纯函数化）· §2 增**窗限增量**条（回填收束沿 ⇒ 限 + 100 · `data-hidden` · `nextWindow`）· §3 回填 / 跟滚两条补纯函数名，跟滚条改**药丸单判据**（`!following` ≡ 「可滚 ∧ 非近底」——消双判据张力；文本两态）· §4 行 2 / 行 6 落形随动（行 6 = 药丸同一元素）。
- 2026-09-26（**批 6 修复轮 #65**——设计评审 §3 轮次 1 发现 4 / 5）：§1.1 接线面条 `deps` 收窄（回底出 `deps`、入返回 handle）+ 增**接线面依赖面（测试缝）**条（假 root 三读数可注入 · 真实事件触发归人工走查）；§3 增**滚动作落面**条（瞬时贴底 / 程序化平滑 + 记 `lastAt` / `smoothWindowOpen` 窗内不派发）；§4 行 6 落形收正（「回底一步到位」⇒ 程序化平滑——去含混）。
- 2026-09-26（**批 6 修复轮 #66**——N-1 裁定 = 落）：§1.1 增**帧面分派**条（块面比较对 = 两帧 `state.blocks`，非模型窗列表——饱和追加下窗列表比对 ⇒ 每 token 全量重挂 · 分派纯函数 `paintPlan`）+ **全量重挂键**条（= `activeSession` / `locale`，其余键不重挂——重挂清宿主 ⇒ 滚动归零）+ **帧尾态刷（刷新面单点）**条（`syncChrome` = 根锚四 + 摘要块 / 药丸在场与文本，与档位解耦）+ **插入点纪律**条（块节点插在 `[data-pill]` 之前）。
- 2026-09-26（**批 6 修复轮 #67**——N-2 裁定 = 落 · 提案 a「窗口对齐步」）：§2 增四条（对齐步判据 `alignPlan` · 重合与摘插 · 尾位豁免 · DOM ≡ `visible` 不变式）· §3 增六条（`settleFrame` 六步 · 尾段挂载 · 三写 · 补偿单权源 · 读数记账 · 瞬时写不记窗）。
- 2026-09-26（**批 6 实施后修正轮 #69**）：§1.1 两层分家条收正（「视图档内唯一触 DOM 处」⇒ **DOM 触面四处**枚举 = 建树 / 接线 / 帧尾态刷 / 帧尾滚动作——与同节接线条 / 帧尾两条自洽）· 接线条 `deps` 增只读口 `guards?()` + 新增**回填接线口径（本批）**条 · §2 / §3 三处落点行「（拟新增）」标记删（`chat-scroll.mjs` / `chat-stream.mjs` / `chat.mjs` 已交付）。
- 2026-09-26（**批 7 审批与活动池视图面**）：§1.1 插入点纪律条随动（块节点插在**首个 `[data-approval]` 之前**——卡缺席 ⇒ 药丸之前；根子序含卡位）+ 增**卡面在场与随动**条（`[data-approval]` 随审批判据刷 · 非块节点不入块序不变式）；§3 尾段挂载条插点改指纪律单源。
- 2026-09-26（**批 7 修复轮 #72**——设计评审 §3 轮次 1 发现 2）：卡锚 token **归一** = `[data-card="approval"]`（三锚为准 = `docs/desktop/design/UI.md` §1 审批呈现行）——§1.1 插入点纪律条与卡面在场条两处选择器改同值；旧记法 `[data-approval]` 仅存记录面。
- 2026-09-26（**批 8 装配桥批**）：§1.1 增**事件归约面（本批）**条（九通道 → 切片写者 = `thincoder-desktop/renderer/events.mjs`（拟新增）：`reduce` / `attachEvents` / `applyPage` / `blockOfMessage`）；
  回填接线口径条收为**接线态**（`onBackfill` + `guards{hasOlder, inFlight}` 已接线；摘要块判据仍 = `data-hidden`）· §2 窗限增量条与 §3 回填条页量口径改**按实并入块数**（页量 = 核 `historyWindow` 缺省 200 条——条 ≠ 块 · 渲染面不写死页量）· §4 行 4 补页应用口径。
- 2026-09-26（**批 8 doc-check 清项轮**）：§1.1 事件归约面条与变更记录批 8 行**行宽收正**（328 → 两行 / 349 → 两行 ≤300）+ 两处前向引用补「（拟新增）」标记（`events.mjs`——盘上未落）——零语义变更。
- 2026-09-26（**批 8 修正轮 #91**——逐号定点）：§1.1 事件归约面条收为**归约档 + 订阅档两档**（订阅接线拆出 `thincoder-desktop/renderer/events-subscribe.mjs`——`attachEvents` / 九通道表 / 回合尾标题刷新）+ 增**池切片清点口径**条
  （`ev:tool-call` 入 · `ev:tool-result` 只收束 ⇒ 全量在场；窗限 / 归档 = open：`docs/desktop/design/PROJECT.md` §10 · `docs/desktop/design/UI.md` §2 项 1）· §1.1 与 §4 行 4 去「（拟新增）」标记（`events.mjs` 已交付）· 本条与 §1.1 行**行宽收正**（≤300——零语义）。
- 2026-09-26（**批 9 设置面 + 首启向导批**）：§1 索引增「设置面 / 向导」行 + 单状态树行补两切片（设置 / 项目级信息）·
  §1.1 增**设置面与向导形**条（两形构树 + 薄挂载出档 · 零新事件通道 · 填 key = `provider:verify` 真调一次 · 闸 = `configured`）。
- 2026-09-26（**批 9 修复轮 #94**——设计评审 §3 十条逐号 + doc-check 清项）：§1 索引行与 §1.1 设置面与向导形条**补「（拟新增）」六处** + 该条**行宽收正**（≤300——零语义）；
  §1.1 该条写路径口径**收正**——写成功**同回带** `{ locale, dict, configured }`（**免二跳重调** · **零新事件通道**）。
- 2026-09-26（**批 9 修正轮 #9**——实施后修正轮）：§1 索引行与 §1.1 设置面与向导形条**去「（拟新增）」六处**（两视图档 + 出档已交付——盘上皆落）；§1.1 增**退场口径**条（子节点面 ∥ 属性面——退场后宿主属性集 ⊆ 挂载前；对照 `thincoder-desktop/renderer/views/chat.mjs:227`；`views/onboarding.mjs:156-157` 处所加属性未见复位回路 ⇒ 码面池）；明细 = `docs/batches/2026-09-26-desktop-impl-9.md` §2.16。
- 2026-09-26（**批 A 对话面板 · 能对话**）：§1 索引增「提问与计划卡 · 输入区」行 + 单状态树行补两切片与队列纯动作 · §1.1 事件归约面条补 `ev:question` / `ev:task` 两通道归约（由**直返**改**写切片**）· 池切片口径条补**队列族例外**（出队即摘除）；
  插入点纪律条改**三卡序**（待审批 → 提问 → 计划）· 卡面在场与随动条扩三卡 + `question` 卡退场非乐观；明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2。
- 2026-09-26（**批 A · ⑤**——键盘面）：§1 索引「接线形通则」行与 §1.1 增**键盘面**条（挂载面自挂 `keydown`——既有 = 审批卡根 / 批 A 增 = 标签条加速键 `Ctrl/Cmd+1..9`，文档级 · 命中才 `preventDefault` · 表外键零动作不吞键；形态单源 = `docs/desktop/design/UI.md` §1 交互行）。
- 2026-09-26（**批 A 修正轮**——设计评审 §3 十五条逐号点修）：§1 索引两行随动（「单状态树」补 `railForm` + 两纯动作 ·「提问与计划卡 · 输入区」补 `mount-cards.mjs`（拟新增 · 批 A 修正轮））·
  §1.1 增**回合尾三径**条（`done` / `stopped` ∨ `ev:error`——`isTurnTail` 判据单源；错误径清 `running` + 位落 `done`）· 键盘面条补命中判据（**键 ∈ 1..9 ∧ 第 N 档存在**）· 卡面在场与随动条补**中断径**（终局 `stopped` ⇒ 事件面摘提问项——判据非回执）。
- 2026-09-26（**批 A 二轮点修**——设计评审 §3 轮次 2 发现 5）：§1.1 回合尾三径条补 `isTurnTail` **谓词入参形**（吃两通道形：`ev:activity` 无 `fields` ∧ `event ∈ {done, stopped}` ∥ `ev:error` 单形）——两通道同调此谓词（实施落点 = 现谓词体只吃 `ev:activity` 形）· 行宽重排（§1.1 回合尾三径条超 300 ⇒ 分句断行，零语义）。
- 2026-09-27（**批 A 收口轮**——实施后随动收正）：§1 索引「提问与计划卡 · 输入区」行去「（拟新增）」四处（两视图档 + 两挂载档已落盘）· §1.1 订阅面条 `attachEvents` 补第 4 键 `onTurnTail`（输入区 flush 窄口）· §1.1 页生命周期条开页路宿主收正（`thincoder-desktop/renderer/mount-sessions.mjs:63` / `:100` / `:109`——响应表 1）。明细 = `docs/batches/2026-09-26-desktop-chat-panel-a.md` §2.13。
- 2026-09-27（**批 B 修正轮**——设计评审 §3 十五条逐号点修）：§1.1 事件归约面条与订阅面条**九通道 ⇒ 十通道**（`ev:usage` 入册——计数与 `docs/desktop/design/IPC.md` §1 同源）；档头需求侧行 `D1–D12 ⇒ D1–D15`。
- 2026-09-27（**批 B 收口轮**——实施后随动收正）：§1 索引「单状态树」行补批 B 增 `usage` 切片 · §1.1 事件归约面条补批 B 一通道归约（`ev:usage` 写 `usage` 切片——KD-20）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2。
- 2026-09-27（**批 B 追加轮 · 首启空白态引导**）：§1.1 增**引导节点**条（非块节点 · `guide` 三码判据 · 构树档 · 句柄在场判据）· 关标签 ⇒ 页随动条「中区 `none` 态 = 零节点」⇒「**零块节点** + 引导节点」（收正）。明细 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2.12。
- 2026-09-27（**批 B 追加轮 · 修正轮**——设计评审 §3 轮次 1 逐号点修）：§1.1 帧尾态刷条点名**引导节点**成员（判据 = `model.guide` 空否；`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）· 同条「`none` 态零节点化不破」收正为「`none` 态零块节点不破」。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.10。
- 2026-09-27（**批 B 追加轮 · 实施后对账轮**）：§1.1 引导节点条承档位「（拟新增）」⇒「**已落** · 实读 **54**」· 帧尾态刷条拆两行（行宽 315 ⇒ 两行皆 ≤300——零语义）。明细 = `docs/batches/2026-09-27-desktop-firstrun-smoke.md` §2.12。
- 2026-09-27（**可见面修复批 · 设计轮**）：§1.1 增三条款（**用户块**——写者 / 出泡时刻 / 键门 / 同回放块形 · **流式游标清点**——两族 + 块面引用刷新径 · **文本段行形态通则**——逐段包元素）。裁决 / 理由 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-24；形态逐处 = `docs/desktop/design/UI.md` §1 本批注；明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2。
 - 2026-09-27（**可见面修复批 · 修正轮 1**——设计评审 §3 轮次 1 逐号点修）：用户块条——`appendBlock` 就地点名（**既有**纯动作 · `thincoder-desktop/renderer/store.mjs:73` 导出 · 归约面四处已消费）+「切回整置」收正为限定形（在飞回合内切回 ⇒ 随回合尾落盘后、于下次页读在场——附两档实核坐标）。明细 = `docs/batches/2026-09-27-desktop-visible-face-fix.md` §2.9。
- 2026-09-28（**桌面残余批 · 设计评审轮 1 修正**——发现 3 同族扩面）：§1.1 三条「本批修」⇒「可见面修复批修」；「本批注项 3 / 4」补批名限定（= 「本批注（可见面修复 · 五件）」）。明细 = `docs/batches/2026-09-28-desktop-residuals.md` §3。
- 2026-09-28（**对齐第二批 · 六件 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-vsc-align-2.md` §1）：§1.1 四处随动——块总集 **五型 ⇒ 六型**（+ `subagent` 归档块 · 运行期块）· 回合尾三径条消费面补**窄口携 `key`**（`onTurnTail(key)`——flush 目标 = 回合尾事件键）· 帧尾态刷条增**待发送气泡组** `[data-pending]` ·
  增**流内非块节点族**条（待发送气泡组 + 归档子 agent 块）。形态 / 判据单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 2 / 5；明细 = 批档 §2。
- 2026-09-28（**归档面收尾 · 父侧直接执行〔可 revert〕**——承状态栏对齐批 wiring 座 #38 报告面）：§1.1 事件归约面条补新导出 **`applyFlags(state, key, flags)`**（`sessionFlags` 切片写者——页读 / 出站回执两径同点）。**零新语义**（模块图补名）。
- 2026-09-28（**桌面空闲唤醒批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-idle-wake.md` §1）：§1 索引增**挂起窗与消化轮**行；§1.1 事件归约面增**两通道归约 + 消化行族**条。
  机制 ∕ 判据单源 = `docs/desktop/design/PROJECT.md` §2 KD-34–36；词键 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」。
- 2026-09-28（**对齐第二批 · 修正轮 1**——设计评审 §3 轮次 1 发现 7 / 12 逐号点修）：§1.1 增**池面挂载（键控差分）**条（同 key 元素复用 · 壳照帧刷 · 不重建）；§2 增**运行期块记账**条（退出尾窗不计入 `data-hidden`——回填耗尽 ⇒ 零摘要块）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §2。
- 2026-09-28（**桌面空闲唤醒批 · 设计轮 + 评审轮 1 修正 · eng-designer**）：§1 索引增**挂起窗与消化轮**行；§1.1 事件归约面增**两通道归约 + 消化行族**条（含**在场 / 出现 / 更新 / 退场路径**）；
   **通道计数残句清**（三处「十通道」⇒ **十三通道**——现盘实读 `thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` ∧ `thincoder-desktop/renderer/events-subscribe.mjs`；本批两通道落地后 = 15）；**帧尾态刷 / 插入点纪律 / 流内非块节点族三条随本族收正**（`[data-digest]` 入成员 / 入根子序）。明细 = `docs/batches/2026-09-28-desktop-idle-wake.md` §2。
- 2026-09-28（**交付评审（对齐第二批）修正 · 主 agent 落笔**〔父侧直接执行 · 可 revert〕）：§1.1 池面挂载条补**键域与换代**判据句（会话内键域 + 换元素径挂载后末刷——承交付评审 2🟡）。明细 = `docs/batches/2026-09-28-desktop-vsc-align-2.md` §5.3（修正轮随落）。
- 2026-09-28（**timer-wake 阶段 2 批 · 设计收尾轮 · eng-designer**——承 `docs/batches/2026-09-28-timer-wake-phase2.md` §2）：§1.1 增**到期触发行**条（`ev:timer` ⇒ `timerNotice` 切片 + 流内行组——与消化行族同法）。**块序 / 块总集零变**（非块节点）。
- 2026-09-28（**回合中插入批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-midturn-input.md` §2 · 台账 #509）：§1.1 三处随动——回合尾三径条消费面（输入区 flush + `onTurnTail` 窄口**退场** ⇒ 消费面两处 + `ev:queue` 归约两形）· 流内非块节点族（待发送气泡组写者 = `ev:queue` 归约）· 用户块条（写者扩「排队消费回执」径）。
  形态 ∕ 判据单源 = `docs/desktop/design/PROJECT.md` §2 KD-40 ∕ `docs/desktop/design/UI.md` §1「本批注（回合中插入 · 步边界 pickup）」。
- 2026-09-28（**回合中插入批 · 设计评审轮 1 修正（父侧直接执行 · 可 revert）**——承评审 #29 发现 #1 / #11）：§1 索引行 · §1.1 三处（订阅接线条 / 批 A 归约条 / 池切片清点条）**退役句清**（原三纯动作 · `pool.queue` 写面 · flush 携行）逐处对齐 KD-40；窄口条补「标题刷新存续 ∕ flush 携行退场」限定句。明细 = `docs/batches/2026-09-28-desktop-midturn-input.md` §4。
- 2026-09-28（**回合中插入批 · 设计收尾微轮 · eng-designer**——承批档 §5 U-5 存量漂移）：§1.1 用户块条块形句补 **`ts` 载波**（`{ kind: "user", text, ts? }`——「对齐第二批」项 4 产出；非有限数 ⇒ 键缺席）。零新语义。明细 = 批档 §2。
- 2026-09-28（**文档回填与卫生轮**（台账 #516）· eng-designer）：§1.1 三处「十三通道」⇒ **十八条通道**（`ev:*` 归约面 / 订阅接线条 / 零 `user` 通道句——实读 = `thincoder-desktop/src/preload/preload.cjs` `EVENT_CHANNELS` 18 位）。**零新语义**。
- 2026-09-28（**桌面功能对位批 · 设计面收正轮（fix · #129）· eng-designer**——承 flow 批 R10 交付）：§1.1 池面挂载条补 **R10 帧触发判据**（触碰块换对象引用——`archiveIntoFlow` 按核 `effects` 键集）；新增**拍面条**（2s 拍判据三件同序——`thincoder-desktop/renderer/heartbeat.mjs`）。明细 = `docs/batches/2026-09-28-desktop-feature-parity.md` §2。
- 2026-09-29（**退役面本体收正轮（fix · eng-designer）**）：§1 单状态树行收正；§1.1 键盘面 ∕ 页生命周期 ∕ 删会话页随动条 ∕ 幽灵更新条收正（标签条面退场对位）；档头 **D1–D26**。明细 = 批档 §2。
- 2026-09-29（**R12 设计面同步轮（fix · #26 · eng-designer）**——承 flow 批 R12 §5.15 未办 5）：§3 回填阈值 48 ⇒ **40**（`BACKFILL_PX`）· 跟滚判据 `≤` ⇒ **`<`**（严格小于——VSC `ui.js` 同径）；§4 行 3 同拍（40px + 页量口径与 §2 窗限增量条对齐——消 `:128` ∕ `:101` 互抵）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-28-desktop-subblock-follow.md` §1 · 台账 #518）：§1.1 「DOM 触面四处」枚举的「帧尾滚动作」补池面对位（`mountPool` 尾）；§3 增两条（**块内容区跟滚**——核原语四点接线 · **池区帧尾钉底**——`maybePinPool`）+ 边界条。明细 = 批档 §2。
- 2026-09-29（**复制面对齐 VSC 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-copy-vsc-align.md` §1）：§1.1 引导节点条去死先例句（`chat-copy.mjs` 已删档——改述「流内非块节点构树」）；档头 **D1–D27**。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚批 · 修复轮（评审轮 1 · 发现 3 ∕ 4）· eng-designer**）：§1.1 「DOM 触面四处」枚举的「帧尾滚动作」补池面对位（`mountPool` 尾——与 §3 池区帧尾钉底条自洽）；§3 块内容区跟滚条四点枚举统一（① 出生 ∕ 接管 · ② 内容增量 · ③ 挂载补钉 · ④ 接管径补钉——与 `docs/desktop/design/UI.md` §1 本批注同序号同指位）。明细 = 批档 §2 修复轮。
- 2026-09-29（**挂起窗径「消费前流内零块」批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-susp-queue.md` §2 · 台账 #561）：§1.1 三处随动——用户块条（写者四时刻 + 挂起径零本地块 ∕ 退流 ∕ 失败径退流句）· 帧尾态刷 + 插入点纪律 + 流内非块节点族三处**待发送带落点收正**（非流内——住输入区上方带；收正轮 B12 终态口径落字）。明细 = 批档 §2。
- 2026-09-29（**挂起窗径批 · 修正轮（重派 · 评审轮 1 · 12 条）· eng-designer**——发现 1 逐号点修）：「流内非块节点族」成员表剔除「待发送带」（非流内——落点表述住帧尾态刷 ∕ 插入点纪律两条）。明细 = 批档 §2.9。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-subblock-follow-resume.md` §1 · 台账 #603）：§1.1 **池面挂载条收正**（三径：`none`/`empty` 清 ∕ 壳缺位建 ∕ **壳在位原位领用**——子 agent 族祖先链零摘离，滚动位保真）；§3 **块内容区跟滚条收正**（让位三律 + 帧尾复核扫 + 出口钮 `sub-follow-btn` + **应用时机契约在核 ∕ 宿主帧模型在端**——留端边界清算同笔）+ 池区帧尾钉底条补 churn 消句与滚动策略族契约句。明细 = 批档 §2（含 §2.13 边界裁定）。
- 2026-09-29（**更新纪律收核批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-render-perf.md` §1 · 台账 #609 + #190 会诊终报）：§1 索引增**更新纪律**行；§1.1 帧面分派条补时机句；**新增 §1.2**（帧合并：触发源 ∕ 核帧合并件 ∕ 应用器契约 ∕ 逐面落点）；§3 块跟滚条尾句收正（⇒ **store 变更排帧**）+ 帧尾三写条与新增**读数按档裁剪**条（跟滚帧零读 ∕ 补偿径 ≤2 读）。明细 = 批档 §2。
- 2026-09-29（**子 agent 块跟滚让位修复批 · 修复轮（评审轮 1 · 发现 1 / 3 / 6）· eng-designer**——承批档 §3 轮次 1）：§3 块跟滚条补**键盘位移归属**（不改旗标 + 残余登记指针）+ **手势窗内归因取舍句**（窗内以手势为准——有意取舍）；池区帧尾钉底条补**对拍机检腿载体单源指针**。明细 = 批档 §3。
- 2026-09-29（**更新纪律收核批 · 修复轮（评审轮 1（#214）· 发现 4 ∕ 8）· eng-designer**）：§1.1 拍面条按盘收正（**1s 拍面**——停滞轻显形批落值；拍体 = `refreshLiveBlocks`（核件 `refreshBlock` 逐块）+ 状态行重挂 `paintStatus`；装配单点 = `app.mjs:269-276`）；
  §1.2 两处回底符号逐处点名（`returnToLatest` = app 侧入口（`app.mjs:152`）∥ `returnToBottom` = store 纯动作（`store.mjs:160`）∕ 滚动面 handle（`chat-scroll.mjs:78`））。明细 = 批档 §2.9。
- 2026-09-29（**性能尾账批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-perf-residuals.md` §1 · 台账 #619）：§1 索引两行随动（「渲染粒度 · 流式缝合」补尾块增量 md · 「更新纪律」补帧内组合不回落）；§1.2 增**尾块增量 md 与帧内组合**条；§2 对齐判据条补**组合档（`patch-append`）**（`patchAt` + 守卫 + 纯追加广义化）；§3 尾段挂载条补组合档两动作序。明细 = 批档 §2。
- 2026-09-29（**性能尾账批 · 修正轮（评审 #41 · 发现 4）· eng-designer**——承批档 §3 轮次 1）：§2 帧面分派条 ∕ 窗口对齐步条同拍收正（判据**五档**枚举 + `paintPlan` 出口补 `appended` + `alignPlan` 签名补 `appended` 参 ∕ 出口补 `patchAt` ∕ 第 3 参兼容口径〔真值 ∨ mode 串〕）——与组合档条同口径。明细 = 批档 §2 修正块。
- 2026-09-29（**desktop-rebuild-fidelity 批 · U2 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.1 ∕ §2.4 ∕ §2.5）：§1.1 增**重建保真族**条（二分修形 ∕ 快照族 ∕ 草稿保真闸 ∕ 弱项两件）；§3 三处随动（跟滚判据 → 核工厂 `nearBottom` · 池区旗标维护改工厂 ∕ 「端 = 契约适配器」收正 · 增**滚动策略族工厂化**条——两档改工厂消费）。明细 = 批档 §2 记录块。
- 2026-09-29（**desktop-residuals-round3 批 · 波 D 登记 + 实施后文档面随动轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-round3.md` §2.13）：§1.1 消化行族 **cap 态句**五处（三态归约 ∕ cap 行锚 `data-digest-cap` ∕ 在场判据扩 `start ∨ cap ∨（end ∧ 携 cap）` ∕ 携 cap 者终态驻留——#541 波 B 落）。**零新语义**（实施随动）。
- 2026-09-29（**撤会话头 + 工具头色批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-head-toolcolor.md` §2）：§1.1 重建保真族身份清单去「会话头 `[data-field]`」项 · 重挂径「其余五面」⇒ 四面；§1.2 帧分派「六面」⇒ **五面**（会话头面退场——面序 = 会话控制条 → 状态行 → 对话流 → 池区 → 卡面）+ 逐面落点句同拍。明细 = 批档 §2。
- 2026-09-29（**桌面压缩行位置冻结批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-29-desktop-compress-row-pin.md` §1 · 台账 #674）：§1.1 **插入点纪律条收正**（块插入点 = 首个尾组（压缩行除外）∕ 卡节点之前——**压缩行 = 流元素冻结点**〔VSC D-C3 append-once〕：创建点定位后新块随流居其下；根子序全列）+ 压缩行条目补**定位句**。明细 = 批档 §2。
- 2026-09-29（**桌面消化行组收口批 · 修正轮（评审轮 1 · 发现 1 ∕ 5 ∕ 7）· eng-designer**——承 `docs/batches/2026-09-29-desktop-digest-parity.md` §2.11）：§1.1 三处随动——**帧尾态刷条**消化行组句改**指针句**（在场 ∕ 更新 ∕ 退场 = §1.1 归约面条——消批前与 `:45` 相抵句）；**归约面条**「无轮 ⇒ 零写」注收**防守档**（VSC 死游标零动作只系 `end`）；**在场 ∕ 更新 ∕ 退场条**补**组为非块节点 ⇒ 不受块窗裁剪**半句。明细 = 批档 §2.11。
- 2026-09-29（**桌面压缩行位置冻结批 · 修正轮（评审轮 1 · 发现 7）· eng-designer**）：§1.1 **压缩行条目定位句指针化**（定位语义单源 = 插入点纪律条——消 §1.1 内两处同述漂移面）。明细 = 批档 §2.9。
- 2026-09-30（**doc-sweep 批 · RF 收正族 · eng-designer**——承 `docs/batches/2026-09-30-doc-sweep.md` §2 · 台账 #661）：§1.1 重建保真族三处收正——增**改名草稿面**句（原 `readDraft` ∕ `restoreDraft` 随 RF 收口退役）· 增**两处滚位例外**（池仅未跟底复填 ∕ 卡面不复填——代码注自陈）；
  设置面草稿保真闸增**机制扩展三件**（残件跨在途携带 ∕ `data-draft-scope` ∕ `nth`）；`view-state.mjs`「（拟新增）」标记随落盘转正。**零新语义**（= RF 批 §5 披露的文档层落位）。
- 2026-09-29（**口子清零二轮批 · 实施轮 · eng-coder**——承 `docs/batches/2026-09-29-hatch-clearance-2.md` §2 · §4（E10 方向 = 建议㈠））：§2 窗口常量 **200 ⇒ 150**（三处同拍 = `MAX_RENDER_BLOCKS` 条 ∕ 窗限增量条「初值」 ∕ §4 行 5「窗口 N 块」——对齐 VSC `MAX_MESSAGE_BLOCKS`（`thincoder-vscode/webview/ui.js:204`）逐值；落点 = `thincoder-desktop/renderer/views/chat-scroll.mjs:25`；页量 200 **条**口径零改）。明细 = 批档 §5。
- 2026-09-30（**桌面消化行流内落位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 · 台账 #706）：§1.1 四处随动——**消化行族改逐轮元素 · 流内就地**（`start` 帧落流末、随流滚动；旧轮元素驻留原位；收缩 = 保尾去首）；
  **插入点纪律条**去 `[data-digest]` 首锚（常规新块随流居轮行之下——CLI `TUI.md` §6.9 ∥ VSC `ui.js:102`）+ **归档块例外 = 末轮元素之前**（VSC `activity.js:99-110` 同形——KD-33 重裁）；根子序与在场 ∕ 更新 ∕ 退场条同拍（重建径复聚 = 登记）。明细 = 批档 §2。
- 2026-09-30（**桌面堆取证修复批 · E4-JS 支定形轮 · eng-designer**——承批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.15 ∥ §5.7 · 台账 #694）：§1.1 接线面 `deps` 枚举补**滚动拍**；§2 增**巨块分段窗**条（段 = 12K 字符 ∕ 窗 = 视口段 ±1 ∥ `display:none` 切换（文本恒在 DOM）· 初窗 ∕ 帧尾步两级）；§3 增**巨块段窗滚动作**条（帧尾第 ⑦ 步——锚上净变补偿 ∥ 跟滚零读 ∥ 单权源保持）+ 边界句同拍。**零新语义**（父裁 ∥ 设计定形落档）。明细 = 批档 §2.15。
- 2026-09-30（**桌面消化行流内落位批 · 修正轮 1（评审轮 1 · 发现 1 ∕ 4 ∕ 6）· eng-designer**——承 `docs/batches/2026-09-30-desktop-digest-instream.md` §2 修正轮块）：插入点纪律条归档块句补**块序守卫**（末轮元素即块序尾位 ⇒ 前插；否则退化 = 常规块插入点——保 §2 不变式，对齐步零改）；帧尾态刷条档面收正（`chat.mjs` DOM 面 ⇒ 帧尾态刷出档 `thincoder-desktop/renderer/views/chat-chrome.mjs`——帧尾调用点 = `chat.mjs` `settleFrame` ③）；根子序句复聚登记改指 `docs/desktop/design/PROJECT.md` §10 **CR**。明细 = 批档 §2 修正轮块。
- 2026-09-30（**消化面留档批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 · 台账 #719）：§1.1 七处随动——**块总集句**（`subagent` ⇒ 留档块 · 页读域第六型——六型全员页读）+ **归约面条 digest 留存 ∥ 留档**（轮事件三型入人读线记录——终态痕页读重建；切片清点不变）+ **流内消化行族条**（留档 = 记录位次复列）+ **在场 ∥ 更新 ∥ 退场条**（非块节点「不受块窗裁剪」⇒ **随窗**：在场面 = 记录位次落于已渲染块区）+ **归档块句**（页读域 · 计 `data-hidden` ∥ 可回填）+ **新增「留档记录」条**（两族记录形 ∥ 写面 ∥ 读面 ∥ 落盘节律）+ **根子序句**（重建径 = 记录序复列——§10 CR 消解）+ §2 **留档块记账条**（原「运行期块记账」三条退场 ⇒ 与五型块同规）。明细 = 批档 §2。
- 2026-09-30（**消化面留档批 · 修复轮（评审轮 1 · 发现 1 ∕ 2 ∕ 8 引用面同拍）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §3 轮次 1）：本档 §1.1「留档记录」条为**跨页读存续单源**（`docs/desktop/design/PROJECT.md` ∥ `docs/desktop/design/IPC.md` 四处旧留存句收正同拍——「切片清点不变 + 记录重建 ⇒ 跨页读存续」）；
  §2「留档块记账」条名 = 引用面现名（`docs/desktop/design/UI.md` 死引用「运行期块记账条」收正同拍）。**零本档内容改**（登记面）。
- 2026-09-30（**消化面留档批 · 修复轮 2（评审轮 2 · 发现 2）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §3 轮次 2）：§1.1 归档块句 ∥ §2 留档块记账条**尸句删净**（两处失效表述删——规范面只留现行口径；历史 = 本记录设计轮行 ∥ 批档 §2 ∥ §3）。**零本档语义改**（形收正）。明细 = 批档 §3 轮次 2。
- 2026-09-30（**消化痕口径收正（用户 2026-09-30 15:4x ∥ 15:53 走查裁定）· eng-designer**——承 `docs/batches/2026-09-30-digest-persistence.md` §2 增量注记）：§1.1 涉句收正——**行入流（与内容同生态）**：无专门「摘 ∥ 留」处理；重建按记录位次复列（段界可辨）；「多轮就地累积 ∥ 驻留原位 ∥ 终态不摘」框架句清、留存语境 VSC 引用收为形面（对位基准纠偏 = VSC 无「留存不摘」行为——`chat-status.js:69-122` 零删除 ∥ `ui.js:205-212` 裁集不含消化行 = 残存现象非行为；来路 = R10 标签化 → #670 升格桌面目标——无用户点名 ∥ 用户腿未跑即收口，台账 #728 实查 v2 在册）。
- 2026-09-30（**消化面留档批 · 回填轮（实施 A+B 落定）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §5 ∥ §2 回填轮注记）：本档 §1.1「留档记录」条随实读收正——`cap` 帧点坐标 `thincoder-desktop/src/main/turn-face.mjs:122 ⇒ :134-135`（发帧 ∥ 记录同点双动作）；**写面薄壳登记**（端核隐式契约——`pushReal` 字段面）；**修单在册（待落）** = `end` 记录写点前移（结算序先于槽落盘）∥ **在册容差（2）**（跨页截断轮页内不产 ∥ 归档快照族落盘晚一拍）。**零新语义**（坐标 ∥ 裁定 ∥ 容差归置）。明细 = 批档 §2 回填轮注记。
- 2026-09-30（**跨端承接批 · 机制单源上提 · eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §2 · 台账 #726）：§1.1「留档记录」条**通用句指针化**——记录形 ∥ 写缝 ∥ 读缝契约 ∥ 重建义务 ∥ 容差登记单源上提 `docs/core/design/SESSION.md` §6.26（跨端承接批裁）；本档留 = 桌面侧呈现细节 + 写面薄壳消解路径登记（端壳下次触碰改调核 `pushRecord`）。**零桌面语义改 ∥ 桌面产品码零触**。
- 2026-09-30（**主题切换批（D33 · 台账 #743）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §1 骨架 + 需求 D33）：§1 索引增「主题三态（chrome 级状态 · D33）」行 + 新增 **§1.4**（面判定 ∥ 模块缝 ∥ 装配两点 ∥ 值面 ∥ 持久化 ∥ 单写者纪律）；档头需求侧行 **D1–D31 ⇒ D1–D33**；形态 ∥ 判据单源 = `docs/desktop/design/UI.md` §1「本批注（主题切换 · D33 · 2026-09-30）」∥ `docs/desktop/design/PROJECT.md` §2 **KD-61**。明细 = 批档 §2。
- 2026-09-30（**消化回流归位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-digest-reflow-anchor.md` §2 · 台账 #738）：§1 挂起窗行（块归档句 = **消化起跑窗**——`done` 于 `ev:digest start` 点补发；`reclaim` 兜底幂等）；§1.1 归约面条（**只留当轮** + 记录 ∥ 显示两面分离）、流内消化行族条（当轮元素 ≤ 1 · 行集 · 终态非 ask 标签行退场）、在场 ∕ 出现 ∕ 更新 ∕ 退场条（换代 = 旧轮退场）、块归档面（起跑窗语义）、插入点纪律条（补时点句）、根子序条 ∥ 留档记录条（复列最新一条）。**口径收正 = 用户 2026-09-30 15:4x ∥ 18:53 字面**（「只留当前」= 现行规格）。明细 = 批档 §2。
- 2026-09-30（**跨端承接批 · 修正轮（评审轮 1 · 发现 5）· eng-designer**——承 `docs/batches/2026-09-30-cross-end-digest-recovery.md` §3 轮次 1）：§1.1 留档记录条**容差（2）副本收敛为指针**（单源 = `docs/core/design/SESSION.md` §6.26 容差登记 ①/②；桌面特异半句保留）。**零桌面语义改 ∥ 桌面产品码零触**。
- 2026-09-30（**消化回流归位批 · 修复轮（评审轮 1 · 发现 2 ∕ 3 ∕ 7 逐号）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-reflow-anchor.md` §3 轮次 1）：§1.1 帧尾态刷成员句 ⇒ **当轮元素〔在场 ≤ 1〕**（原「逐轮元素」——同档两义收一）；在场 ∕ 出现 ∕ 更新 ∕ 退场条**换代钉径**（复用径亦须末位重锚——新轮行族落位唯一）；
  行集句补 **ask 档终态保留**给由 + 行文取值（`digest.turnLabelAsk`）∥ `digest.done` ∕ `digest.aborted` 可达面（计数行终态文）。**零新语义**（收正 ∕ 钉径）。明细 = 批档 §2 收正轮块。
- 2026-09-30（**右栏宽度拖动批（D30 · 台账 #742）· 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-pool-width-drag.md` §1）：§1 索引增「右栏宽度拖动（chrome 级直写 · D30）」行 + 新增 §1.3（面判定 ∥ 模块缝 ∥ 装配两点 ∥ 交互三段 ∥ 界单落点 ∥ 持久化）；
  形态 ∥ 判据单源 = `docs/desktop/design/UI.md` §1「本批注（右栏宽度拖动 · D30 · 2026-09-30）」∥ `docs/desktop/design/PROJECT.md` §2 **KD-58**。明细 = 批档 §2。
- 2026-09-30（**右栏宽度拖动批 · 修复轮（评审轮 1 · §3 · 发现 1 ∥ 5）· eng-designer**——承批档 `docs/batches/2026-09-30-pool-width-drag.md` §3 轮次 1）：§1.3 交互三段补**落定前置（刷一拍）**（撤帧 + 同步落待值）∥ 模块缝 ∥ 三段点名**写径 = CSSOM**（`style` 属性径禁）。**零新语义**（序 ∥ 写径收正）。明细 = 批档 §2 修复轮块。
- 2026-09-30（**窗口重启最大化批 · 随修（一致性收扫）· eng-designer**）：档头需求侧行 **D1–D30 ⇒ D1–D31**——零语义枚举随动。明细 = 批档 §2。
- 2026-09-30（**块到达时点归位批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-block-arrival-timing.md` §1 · 台账 #746）：§1 挂起窗行（块归档句补「驻留块来源 = 全族 settle」）∥ §1.1 块归档面（`settled` 驻留块含非挂起态 settle——`⟦ev⟧done` 不再自 settle 点发射）。**桌面产品码零触**（`settled` 通路既有）；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8。明细 = 批档 §2。
- 2026-09-30（**块到达时点归位批 · 修复轮（评审轮 1 · 发现 2 · 父侧裁 = 全采纳）· eng-designer**——承批档 §3）：§1.1 块归档面删修订式残句（「`⟦ev⟧done` 不再自 settle 点发射」——现行口径不动）。**零语义**。
- 2026-09-30（**块到达时点归位批 · 对帐后收正轮（③）· eng-designer**——承批档 `docs/batches/2026-09-30-block-arrival-timing.md` §2 收正块 · 用户口径修正〔三端对帐之目的 = 统一——差异出路 = 消除〕）：§1.1 消化行族条补**待统一差异**两条（VSC 无轮容器 ∥ cap 行位置——框 = 待统一差异〔非既成收正列〕；统一方向待裁）。**零新语义 ∥ 端侧行为改动 = 零**。明细 = 批档 §2 收正块。

- 2026-09-30（**三端消化面统一批 · 重写设计轮 · eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §1 ∥ §2 · 台账 #747）：§1 挂起窗行（块归档 = **回收窗（reclaim 形）**——起跑窗补发已撤）+ §1.1 十一处收正——**归约面条**（行族逐轮累积 · 零全替）· **流内消化行族条**（累积 · 标签恒在 · 座次）· **在场条**（零摘除 · 座次）· **块归档面**（reclaim 主面）· **插入点纪律条**（VSC 边界物三句语义 · 座次入模 · 守卫链退场）· **根子序句**（座次复列 + 消费轮配对）· **留档记录条**（页内全量轮 + 配对）· 帧尾态刷 ∥ 流内非块节点族条（成员句）· 写面薄壳条（置位句）。**口径收正 = 父侧全链复查推断**（【更正 2026-10-01】**非用户直令**——用户 21:40 原话仅「desktop 在异步消化这一块的逻辑完全是错的」；初标「口径终正 = 用户 21:40」= 误冠——随 #754 收正作废）。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 预评审收正轮（歧义收正 + 三裁落位）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §2 收正块 · 台账 #747 · 父侧预评审自查〔22:0x〕）：§1.1『座次』表述三处**统一**（`:43` ∥ `:46` ∥ `:72`——座次 = 起跑帧当刻流末（起跑水位 = 起跑时已有块数）；起跑后常规新块随流居其下；归档块按到达序入其消费轮座次位——先于该轮元素）；行族遗留差异两条**随裁并入本批**（cap 行位置 ∥ 轮容器形态——对位 VSC 收正）；同裁副本同拍 = `docs/desktop/design/IPC.md` §1 ∥ `docs/desktop/design/PROJECT.md` §10 **DA** ② ∥ **KD-60** 上抛栏。**零新语义 ∥ 机制本体零改**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 修复轮（评审轮 1 · 发现 1 ∥ 6 ∥ ① 落形裁）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §3 轮次 1）：§1 挂起窗行 ∥ §1.1 块归档面**起跑窗残句删**（现行口径 = 回收窗（reclaim 形）单留）；§1.1 **行族形态规范句落**（**无轮容器**——行元素 = 流内并列兄弟；**cap 行 = 尾追形**（本轮元素族末位）——对位 VSC 实形）——流内消化行族条 ∥ 在场条 ∥ 帧尾态刷成员 ∥ 流内非块节点族条 ∥ 插入点纪律条（座次句 ∥ 边界设施句）同拍；根子序句残句删（留档批 · #719——复列 = 页内全量轮）。**零新语义 ∥ 机制本体零改（除裁定落形）**。明细 = 批档 §2 修复轮块。
- 2026-09-30（**三端消化面统一批 · 实施后收正轮（#747 实施交付）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §5 ∥ §2）：§1.1 **cap 行两径钉词**——**活流径 = cap 帧到达于流末锚补建 ∥ 重建径 = 族内紧邻**（**两径并存为设计**；**重挂后位次差 = 在册行为、非缺陷**——对位 VSC 同形：到达即 `appendChild` ∥ 重建按记录）；流内非块节点族条同拍。**零新语义**（父裁落档）。明细 = 批档 §2 实施后收正轮块。
- 2026-09-30（**consult 同族收齐批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-consult-family.md` §1 · 台账 #748）：§1 挂起窗行 ∥ §1.1 块归档面——回收补发补 **consult 子块**口径（会话条目 ⇒ 按其 `childIds` 逐子块补发 `done`；子块 settle ⇒ `settled` 驻留）。
  **桌面产品码随动 = `reemitDone` 展开**；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8。明细 = 批档 §2。
- 2026-10-01（**消化行只留当轮收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 ∥ §2 · 台账 #754）：§1.1 八处涉句收正——**归约面条**（行族只留当轮——`start` 全替 ∥ 旧轮退场）· **流内消化行族条**（当轮行族 ∥ 终态非 ask 标签行退场（ask 档保留））· **在场 ∥ 出现 ∥ 更新 ∥ 退场条**（换代 = 旧轮行族退场；终态标签退场；复列最新一条）· **插入点纪律条**（边界行取面 = 本族文档序首元素——标签行退场径 ⇒ 计数行）· **根子序句 ∥ 留档记录条**（复列 = 最新一条 + 配对在场轮）。**口径 = 用户 2026-09-30 18:53 ∥ 19:01 字面**（#747 之「回累积 ∥ 标签恒在」随本批退场；两端零动——实读 = 逐轮累积）。明细 = 批档 §2。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 + 扩展设计轮（评审轮 1 · 十发现逐号 + 用户 01:48–02:08 定稿）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 ∥ §3 轮次 1 · 台账 #754）：§1 挂起窗行 ∥ §1.1 **块归档面 = 起跑窗复位**（用户 2026-09-30 18:49 ∥ 2026-10-01 02:08——#747 回收窗退场；`hooks.reclaim` = 兜底幂等）；**插入点纪律条翻转**（归档块落位 = 消费轮**族末之后**——边界行取面 = 本族文档序末元素（计数行＝状态行 ∥ 无 ⇒ 标签行）；挂载居其后；文档序 [.. 块][行族][归档块][..]——旧「族首之前」句不留）；**座次重算纪律（闪现三修）落条**（毕业绑定出运行集 ∥ 算不中即静止 ∥ 兜底带序）；归约面条 ∥ 流内消化行族条 ∥ 在场条 ∥ 根子序句 ∥ 留档记录条同拍（旧轮出模型（真不留）∥ 三端通判 ∥ 复列镜式翻转）；变更记录「口径终正 = 用户 21:40」**误冠更正**（父侧复查推断——非用户直令）。明细 = 批档 §2 修复轮 + 扩展轮块。
- 2026-10-01（**消化行只留当轮收正批 · 增量轮（用户 02:21 裁 A——两端随正）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-row-current-only.md` §1 第六条 · 台账 #754）：§1 挂起窗行 ∥ §1.1 块归档面 ∥ 插入点纪律条**三端同形**句落（起跑窗 ∥ 族末之后——VSC ∥ CLI 随正；CLI 坐标收正 `thincoder-cli/src/tui/suspension-drive.mjs:173 ⇒ :182`）。明细 = 批档 §2 增量轮块。
- 2026-10-01（**主题切换批（D33 · 台账 #743）· 修复轮（评审轮 1 · 发现 5 ∥ 6）· eng-designer**——承 `docs/batches/2026-09-30-theme-switch.md` §2 修复轮块）：§1.4 面判定补**与 §1.3 差异**半句（持 store 镜面——设置面重绘键；`dataset.theme` 写仍同步不经帧）；值面条补 `--mono` 同值重声明随块消解半句（`--error-fg` 单值并拍）。**零新语义**（先例引用精确化 ∥ 值面处置点名）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化行只留当轮收正批 · 修复轮 2（评审轮 2 · 八发现逐号）· eng-designer**——承批档 §3 轮次 2 · 台账 #754）：§1 挂起窗行 ∥ §1.1 块归档面**失效形名句清**（「#747 回收窗随本批退场」式残留删——规范面只留现行口径；退场史实 = 变更记录行 ∥ 批档）；流内消化行族条**起跑刻计数行文点名**（`digest.start`——携 `n`；对位 VSC `chat-status.js:82-88`）。**零新语义**（形名清 ∥ 取值点名）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面消化痕彻底拆批（座次机拆除 + 单体重建）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §1 ∥ §2 · 台账 #765）：§1.1 六处收正 + **新增「静态落位锚」条**（座次【机】拆除清册 ∥ 锚 = 族尾锚（静态——两端镜式：CLI 起跑窗显式锚 ∥ VSC 收帧清/清屏清）；锚的实证服务面 = 重挂径 ∥ 中止残项径——证伪后 2026-10-01）；**「座次重算纪律（闪现三修）」条整删**（其对象 = 座次机——随拆）；涉句同拍：流内消化行族条（`:44`）∥ 在场 ∥ 出现 ∥ 更新 ∥ 退场条（`:47`）∥ 插入点纪律条（`:74`）∥ 根子序句（`:76`）∥ 流内非块节点族条（`:84`）∥ 写面薄壳条（`:89`）。**零两端触 ∥ 记录面零触**。明细 = 批档 §2。
- 2026-10-01（**斜径命令面批（桌面 slash 命令）· 增量块（`/help`）· initial 轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-slash-commands.md` §2.10 · 台账 #761）：§1.1 三处——流内非块节点族条**增帮助行族**（`[data-help]`：当次打印行族 · 尾组槽位 ∥ 运行期痕 ∥ 非块 ∥ 写者 = `printHelp` 口）∥ 插入点纪律条**族序 ∥ 根子序随动**（…台账行 → **帮助行族** → 卡）∥ 帧尾态刷条**成员 +帮助行族**。**零新语义**（增量落形 ∥ 槽位登记）。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 1（评审轮 1 · 1..11 + F2 + F3）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §3 轮次 1 + 父侧 F2/F3（含 04:46 ∥ 04:47 两收正）· 台账 #765）：「静态落位锚」条 ⇒ **「消化面落位与重挂规则」条（F2 零存储——锚整删：编号/水位/关系字段/前插后移全无；三规则即时执行 = 归档随到入流 ∥ 重挂捕位复列 ∥ 换代 = `digest` 脏帧 ∧ `start`）**；涉句同拍（`:44` 换代判据 ∥ `:47` 出现与退场 ∥ `:49` 块归档面 ∥ `:75` 归档落位机制段 ∥ `:77` 根子序 ∥ `:85` 落点 ∥ `:91` 置位句）。**产品码零触（设计轮）· 裁落形（用户 04:47——零存储）**。明细 = 批档 §2 修复轮 1 块。
- 2026-10-01（**桌面消化痕彻底拆批 · 修复轮 2（评审轮 2 · N1–N4 逐号）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §3 轮次 2 · 台账 #765）：「消化面落位与重挂规则」条 ①——**「同帧序 = 族先 ∥ 归档后」升为规则句**（硬判据 = 起跑窗同帧下终态 DOM 序 [行族][归档块]；实现判据 = **同帧批内按到达序落位**——落地 = 帧内行族建 ∕ 换代步先于尾段挂载）；
  §3 **六步序步 ① 同拍**（行族建 ∕ 换代步 + 挂尾段——行族建 ∕ 换代先于尾段挂载）∥ `:47` ∥ `:72` ∥ `:75` 三处口径同拍 ∥ `:91` `blockAnchor` 归属注（端面现行导出名——零动作，非座次机残名）；**归因注**（旧码懒加载径触碰消化切片——候选归因面）移记录面（批档 F2 块在册——规范面只留懒加载径三断言）。**零新语义**（规则句升格 ∥ 步位钉死）。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面消化痕彻底拆批 · 基础重裁轮（initial）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-digest-teardown.md` §1 基础重裁块 ∥ 用户 2026-09-30 15:53 ∥ 2026-10-01 05:14 ∥ 05:16 · 台账 #765）：拆「消化行 = 流内非块节点（特殊物种）」自设前提 ⇒ **消化行 = 流内普通项**（到达即入流 ∥ 窗口即窗口 ∥ 记录照留、常规重放 ∥ 三态 = 就地换文）；「消化面落位与重挂规则」条 ⇒ **「消化行入流与重放规则」条**（零专用机——座次 ∥ 锚 ∥ 位次 ∥ 族键 ∥ 例外条 ∥ 专设步序整批无存）；涉句同拍（§1 索引行 ∥ §1.1 五处 ∥ §3 六步序步①）。`PROJECT.md` ∥ `UI.md` 副本面清面清单在册（随裁可同拍 ∥ 下轮）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2 基础重裁块。
- 2026-10-01（**桌面流面对账面重写（幻影机拔除）· 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §1 · 台账 #764 ∥ 用户 2026-10-01 05:37–05:59 六斥）：§1 索引两行随动；§1.1 **帧面分派 ∥ 全量重挂键**两条 ⇒ **流面作业单 ∥ 流面结算步 ∥ 建**三条；帧尾态刷条 ∥ 快照族条 ∥ §1.2 ② 同拍；§2 四条（窗口对齐步 ∥ 对齐判据 ∥ 两效果 ∥ 不变式）⇒ 结算步 ∥ 头尾分段 ∥ 两效果 ∥ 不变式；§3 帧尾滚动作 ∥ 尾段步两条收正。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 1（评审 #90 · 七号逐条）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §3 轮次 1）：§1.1「流面作业单」条补**清账 = 两径同清**（构造径亦清 ∥ 结算径亦清；root 缺位不清）；「建」条补 **`project` 键承接 = 刷面**（零重挂）；`:81` 残句收正（改指「建」条单源）。**零新语义**。明细 = 批档 §2 修复轮 1 块。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 2 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §1 父侧残留裁定（#92））：「建」条整置触发 **+关页**（唯一会话删除 ∥ 列表空——`openSession(state, null)` 同笔带 `build` 作业；`none` 态引导面由本径承接）；「流面作业单」条 build 触发枚举同拍（`:68`）。**零新语义**。明细 = 批档 §2 修复轮 2 块。
- 2026-10-01（**桌面流面对账面重写 · 修复轮 3（缺口-1 设计面同拍）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-flow-reconcile.md` §5 缺口-1 · 父裁 **Option A**）：「流面作业单」条 build 枚举 ∥「建」条整置触发枚举 **+退流清空**（本地先行回声摘空 ⇒ 空态引导面复现——退流点同笔带 `{ kind: "build" }` 作业）；`PROJECT.md` KD-63 ① 同拍。明细 = 批档 §2 修正轮 3 块。
- 2026-10-01（**消化行自然形收正批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §1 ∥ §2 · 台账 #768）：§1.1 八处涉句收正——**归约面条 ∥ 流内消化行族条 ∥ 在场 ∥ 出现 ∥ 更新 ∥ 退场条 ∥ 消化行入流与重放规则条（intro ②③④）∥ 帧尾态刷成员 ∥ 根子序句 ∥ 流内非块节点族条 ∥ 留档记录条**：行族 = **自然形（行出即留——起跑行 ∥ 计数行 ∥ cap 行 ∥ 终态行：不改 ∥ 不删 ∥ 不退场；零清理机器）∥ 终态 = 追加一条新行（锚 `data-digest-end`）∥ 模型面 = 全轮累积 ∥ 复列 = 全量完整轮**；口径 = 批档 §1（用户 2026-10-01 07:54 ∥ 07:58 直斥——转写失真认账）。**产品码零触（设计轮）· 记录面零动 · 两端零动**。明细 = 批档 §2。
- 2026-10-01（**消化行自然形收正批 · 修复轮（评审轮 1 · 发现 3）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-rows-natural-form.md` §3 轮次 1）：档头需求侧行 **D1–D33 ⇒ D1–D34**——零语义枚举随动（需求 D 表已至 D1–D34）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇落地轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：M18 半句（面内态变更 ⇒ 即时手动重挂）∥ M20 卡三类 ⇒ 卡四类两处同拍 ∥ 池面原位领用句收窄（头逐件差分 ∥ 键控差分）∥ M21 披露句（换代件判据）。明细 = 批档 §2。
- 2026-10-01（**复核扫面收正批（M1–M22 处置）· 文档簇补收轮 · eng-designer**——承 `docs/batches/2026-10-01-audit-remediation.md` §2 · 台账 #769）：§1.1 卡面在场与随动条 M20 残拍——枚举三 ⇒ 四（+`[data-card="goal"]`）∥ 形态单源「三行 ⇒ 四行」（目标面板）。明细 = 批档 §2。
- 2026-10-01（**consult 同族收齐批 · 跨档坐标随动（父侧直接执行〔③ 类小笔〕 · 可 revert）**——承批档 `docs/batches/2026-09-30-consult-family.md` §2 修复块（评审轮 2 发现 4 半项延后转父侧））：§1 挂起窗行 ∥ §1.1 块归档面 **CLI `reclaim` 坐标收正 `thincoder-cli/src/tui/suspension-drive.mjs:182 ⇒ :212`**（对位 = `docs/cli/design/TUI.md:901` 现载——实施净删后实读）。**零新语义**。
- 2026-10-01（**零语义清账批 #2 · 文档面轮 · eng-designer**——承批档 `docs/batches/2026-10-01-zero-semantic-cleanup-2.md` §2 · 台账 #785）：§1.3 模块缝「（拟新增 `thincoder-desktop/renderer/pool-width.mjs`）」陈标 ⇒「（已落 …）」（该档已落——对位 `PROJECT.md:241`）。**零新语义**（陈标收正）。明细 = 批档 §2。
- 2026-10-01（**消化重放口径批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §1 ∥ §2 · 台账 #771 ∥ #773）：§1.1 五处收正——**归约面条**（折叠·复列全量（未结轮照现）+ `clearDigest` 归属）∥ **流内消化行族条**（`n = 0` 零终态行守句）∥ **消化行入流与重放规则条**（跨页丢终态 + 复列全量）∥ **根子序句**（未结轮照现）∥ **留档记录条**（未结轮照现 + 位次门）。重放口径 = 三端同判（批档 §2「三」）。**零机制改**（口径收正）。明细 = 批档 §2。
- 2026-10-01（**零语义清账批 #2 · 修复轮（评审轮 1 · 发现 4）· eng-designer**——承批档 `docs/batches/2026-10-01-zero-semantic-cleanup-2.md` §3 轮次 1 · 台账 #785）：§1.4 模块缝 ∥ §3 滚动策略族工厂化「（拟新增 …）」陈标 ⇒「（已落 …）」（两档实读均在盘——`theme.mjs` ∥ `thincoder-render-core/scroll.mjs`）。**零新语义**（陈标收正）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化重放口径批 · 修复轮（评审轮 1 · 发现 1 ∥ 5 ∥ 9）· eng-designer**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §3 轮次 1 · 台账 #771 ∥ #773）：§1.1 **归属规则钉定 = 活流侧优先**（运行期未结轮在场 ⇒ 折叠未结末轮不并入——所失面登记入句；原「折叠侧优先」弃）∥ 防守档断言收正（可达面 = 起跑帧未及；起跑帧在连之轮不可达——活轮不变式）∥ `turn-face.mjs` 两处坐标对盘（`cap` 帧点 `:139` ∥ `:140`；`emitDigestEnd` `:168-175` ∥ `:178` ∥ `:183`）∥ 名随动（「重放口径批」⇒「消化重放口径批」——`:80` ∥ `:92`）。**零新语义**（判据钉定 ∥ 坐标 ∥ 名随动）。明细 = 批档 §2 修复轮块。
- 2026-10-01（**消化残余批 · 设计档给句落笔轮 · eng-designer**——承批档 `docs/batches/2026-10-01-digest-residue-pair.md` §2 修正块 #3（§4 批准）· 台账 #767）：§1.1「消化行入流与重放规则」条——**白名单两档 ⇒ 三档**（合法偏移——穷举登记；③ **复入窗补建**（前插回填使位次轮入区 ⇒ 缺行者于当刻流末补建——到达序；重建径归记录位次——**增量径登记**））∥ **零专用机列表处置句**（**复入窗补建**（行落流末）= 常规补建族延伸——非专设步序）∥ **机制句**（复入窗（前插回填使位次轮入区）⇒ 缺行者于当刻流末补建（到达序）；记录位次复列 = 重建径专有——两径并存为设计）。**产品码零触**（`:183` ∥ `:217` 注文收正 = 实施轮）· **零新语义（纯落笔）**。明细 = 批档 §2 修正块 #3。
- 2026-10-01（**桌面失焦重获焦假死批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-01-desktop-focus-freeze.md` §1 · 台账 #787）：§1 索引增「后台态与渲染停摆」行 + 增 **§1.5**（机制判定——遮挡停摆相变为主因 ∥ 应用积压有界性证明 ∥ 逐候选成立性 a–e ∥ 修复面 = `window.mjs` `backgroundThrottling: false` 单开关 ∥ 边界与代价）。
  **产品码零触（设计轮）· 探针 ∥ 守零触**；实施落点唯一 = `thincoder-desktop/src/main/window.mjs`。明细 = 批档 §2。
- 2026-10-01（**消化重放批收口随动扫（副本笔 · 父侧直接执行 · 可 revert）**——承批档 `docs/batches/2026-10-01-digest-replay-choices.md` §6 挂账 🔵6（`docs/desktop/design/PROJECT.md` 侧同笔已落）：§1.1 两处「可证面」副本补钉定半句（「扫描结束仍 `open`」——批档 §2 钉定同字）。**零新语义**（副本同拍）。）
- 2026-10-01（**桌面失焦重获焦假死批 · 修复轮（评审轮 1 · 发现 5 ∥ 6）· eng-designer**——承批档 `docs/batches/2026-10-01-desktop-focus-freeze.md` §3 轮次 1）：§1.5 修复面条**逐字引文 ∥ 推断分列**（引文 = `electron.d.ts:19431-19434`；「后台不再判 hidden」∥「遮挡 ∥ 失焦 ∥ 隐藏」三面并列 = 推断——方向由 §2.5 读数厘定）；边界与代价条**代价枚举 +1s 拍面**（`heartbeat.mjs:16` ∥ `:37-48`——定时器节流关掉后后台期照常走拍）+ 可实测句（批档 §2.5 后台期三项）。**零新语义**（引文分列 ∥ 代价点名）。明细 = 批档 §2 修复轮块。
- 2026-10-02（**菜单体系批（#811）· 一致性随扫（档头计数随拍）· eng-designer**——承 `docs/batches/2026-10-02-desktop-menu-system.md` §2）：档头需求侧行 **D1–D34 ⇒ D1–D36**——零语义枚举随动（需求 D 表已至 D1–D36；本档机制面**零触**——菜单动作不触有界渲染窗口 ∥ 回填 ∥ 跟滚机制，单源 = `docs/desktop/design/PROJECT.md` §2 **KD-65** ∥ `docs/desktop/design/IPC.md` §1 `ev:menu` 行）。明细 = 批档 §2。
- 2026-10-02（**设置面样式收正批 · 档头计数随拍 · eng-designer**——承 `docs/batches/2026-10-02-desktop-settings-layout.md` §2）：档头需求侧行 **D1–D36 ⇒ D1–D37**——零语义枚举随动（机制面零触）。明细 = 批档 §2。
- 2026-10-02（**波 2a · 渲染族迁移 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 规格单源 = `docs/core/design/DOC-MIGRATION.md` §11）：**新立 §1.6（关键决策 · 渲染核）**——自 `docs/desktop/design/PROJECT.md` §2 迁入 **KD-27 ∥ KD-48 ∥ KD-50 ∥ KD-63 ∥ KD-54（渲染半边）**（逐字；原址各留一行指针）；**KD-63 行文本迁移余量在册**（迁移轮原行文本不可得——要点句 + 机制单源指针在 §1.6；随分片轮补迁）；KD-48 ③ ∥ KD-50 ② 子句现行单源 = 本档 §1.1 ∥ §2 ∥ §3（桌面流面对账批 #764 收正在册）。**零新语义**（搬迁 ∥ 指针）。

- 2026-10-02（**波 2a 补轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 波 2a 补轮块）：§1.6 **KD-63 全文补迁**（要点句 ⇒ 届盘全文——决策 ∥ 依据 ∥ 被否三栏逐字；机制单源指针句保留）+ **KD-48 ③ ∥ KD-50 ② 按届盘收正** + 表下注余量句清；**KD-27 复核** = 无差异（唯跨档改指——`docs/desktop/design/CHAT.md` §1 **KD-39**）。**零新语义**（搬迁 ∥ 届盘收正）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（续 · #35）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**档头随动**——需求侧行范围数摘除（D1–D37 ⇒ 范围数随需求档现文）＋ 域档导航行新增（9 域档）∥ **§5 新立**：§5.1 本域族行 **12** 行（自 `PROJECT.md` §4.1 逐字迁入；原址各改一行指针）＋ §5.2 批块 **2 块**（更新纪律收核批 ∥ 性能尾账批——迁自 §4.2；块内「本档」类回指按新落点改指）。**零新语义**（迁移 ∥ 指针 ∥ 档头收正）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 2c 前置步 · 文件账分片轮（切片 3 · 余量收尾）· eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：**§5 收尾**——§5.1 补行 **2**（`dom.mjs` ∥ `thincoder-render-core/flow/block.mjs`——判域在册：渲染工艺单点 ∥ 核共享面）＋ §5.2 批块 **1 块**迁入（桌面流面对账面重写——迁自 `docs/desktop/design/PROJECT.md` §4.2）；§4.2 余块收零（跨域块留 `PROJECT.md`——判读在册）。**零新语义**（迁移 ∥ 指针）。
- 2026-10-02（**文档体系重组批（DOC-MIGRATION）· 波 3 · 终扫轮 · eng-designer**——承批档 `docs/batches/2026-10-02-doc-structure-reorg.md` §2 · 台账 #813）：需求侧活面指针收正（需求分卷后形态——「需求档 §4」类表述 ⇒「需求卷」（查卷口 = `docs/desktop/requirements/PROJECT.md` §4 **D 表索引**））；记录面 ∥ as-of 零追改。**零新语义**（指针）。
- 2026-10-02（**记录形残项批（#794）· 设计档随动轮 · eng-designer**——承批档 `docs/batches/2026-10-02-record-shape-residuals.md` §2 随动表）：§1.1 留档记录条补**承接句**——他端记录读面归一（落点 = `thincoder-desktop/renderer/page-read.mjs`；判据 = `docs/core/design/SESSION.md` §6.26 读面归一义务）。**零新语义**（随动落位）。
- 2026-10-03（**无效渠道态逻辑归一（provider-invalid-unify）批 · 实施后回填轮 · eng-designer**——承批档 `docs/batches/2026-10-03-provider-invalid-unify.md` §2 ∥ §5 · 台账 #841）：§5.1 `store.mjs` 行走读齐平（**331 ⇒ 341**——`providerState` 切片 + `setProviderState` 纯动作）；越层在册句随正（续期——引 `docs/desktop/design/PROJECT.md` §4.1 越层段）。**零新语义**（读数）。明细 = 批档 §2 回填轮块。
- 2026-10-02（**文档清账轮 · 执行轮 5（桌面重段）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：锚面 5 处 R1 改指（承接全路径——`thincoder-vscode/src/extension/` ×1 ∥ `thincoder-desktop/src/main/` ×1 ∥ `thincoder-cli/src/tui/` ×2 ∥ `docs/cli/design/` ×1）；宽面 22 行折行（36 ∥ 45 ∥ 46 ∥ 49 ∥ 50 ∥ 51 ∥ 70 ∥ 72 ∥ 76 ∥ 77 ∥ 80 ∥ 82 ∥ 90 ∥ 91 ∥ 94 ∥ 96 ∥ 97 ∥ 100 ∥ 111 ∥ 176 ∥ 219 ∥ 220——语义零改）。**零新语义**。
- 2026-10-04（**渠道档位退役批 · fix 轮（U1 段名收正）· eng-designer**——承批档 `docs/batches/2026-10-04-desktop-channel-tier-retire.md` §2 修正块 · 台账 #902）：设置面段名「模型与档位」⇒「**模型**」（en「Model & tier」⇒「Model」）——本档活面收正（批 9 期设置面句）；「四段面」枚举系批 9 快照（现七段）——陈旧差分披露在册（越本批面，未扩改）。**产品码零触（修正轮）**。明细 = 批档 §2 修正块。
- 2026-10-04（**消化行回填落位批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-digest-reentry-order.md` §1 · 台账 #910）：§1.1「消化行入流与重放规则」条**回填落位收正**——④ **白名单三档 ⇒ 两档**（③「复入窗补建」整删——**复入窗 = 整置径**（回填 ⇒ 删档 + 新写——记录序重放；零位置机具 ∥ 零寻位 ∥ 零搬移 ∥ 零算术））∥ ⑥ 懒加载径 = 整置（原「行族零动 ∥ 前插只动块」按实收正）∥ 零专用机处置句 ∥ 机制句 ∥ 在场条 ∥ 流内非块节点族条 ∥ 作业单枚举（`prepend` 退役；回填入 `build`）∥ 结算步回放枚举 ∥ 建条 ∥ §1.6 KD-63 ① ∥ §2 两条效果 ∥ §3 回填条（帧出口补偿）同拍；`docs/desktop/design/ACTIVITY.md` KD-62 ⑦ 涉句同拍。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**消化行回填落位批 · 修正轮随动 · 父侧直接执行 · 可 revert**——承批档 `docs/batches/2026-10-04-digest-reentry-order.md` §2 修正块 十·②③）：§5.1 `app.mjs` 行数账随正（**321 ⇒ 328**——实读 2026-10-04）；§3 回填条写门句随正（「并入 > 0」块数近似旧句 ⇒ **高度净增 ΔH ≠ 0**——帧身份 = 上帧在飞 ∧ 本帧坍落 ∥ 非跟滚；详式 = 修正块 十·②）。**零新语义**（读数 ∥ 谓词）。
- 2026-10-04（**流尾台账行组退役批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-stream-ledger-lines-retire.md` §2 · 台账 #913）：§1.1 三处收正——尾组族内序（去台账行）∥ 根子序（去 `[台账行组?]`）∥ 帮助行族条槽位句（「台账行组之后 ∥ 卡序列之前」⇒「卡序列之前」）。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-04（**行痕族消失时机批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-row-traces-clear-at-turn.md` §1 ∥ §2 · 台账 #919）：§1.1 帮助行族条清点句 ⇒ 两门（首屏 ∥ 回合起跑——去「同 `[data-timer]` 族」）∥ §1.6 增 **KD-74**（信号点 = `msg:send` 出站 ∥ 晚到丢弃闩 ∥ 端差 VSC 零触；被否七候选）∥ §1.6 注行随正。**产品码零触（设计轮）**。明细 = 批档 §2。
- 2026-10-05（**批 digest-accounting · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-05-digest-accounting.md` §1 · 需求 §4.15 · 台账 #930）：§1.1「流内消化行族」条行集增**残余行**（锚 `data-digest-residue`——`end` 且 `unsettled > 0` ⇒ 追加；词键 `digest.residue` 核字典直取；`= 0` ⇒ 零行）。**零新语义**（判据 / 机制 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31）。明细 = 批档 §2。
- 2026-10-05（**timer 提醒行回合起跑门批 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-05-timer-notice-turn-gate.md` §1 ∥ §2 · 台账 #952）：§1.1 到期触发行条清点句 ⇒ 两门（timer 员并入回合起跑门——晚到照写照显）∥ §1.6 **KD-74** 扩员（两员 ⇒ 三员 + ⑥ 晚到判据 + 被否候选收窄至 `compress`）∥ §1.6 注行随正。**产品码零触（设计轮）**。明细 = 批档 §2。
