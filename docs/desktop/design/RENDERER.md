# 桌面端（DESKTOP）· 渲染面实现工艺

> 板块 = **桌面端渲染面（前端）实现工艺**——零框架 DOM 层 · 单状态树 `store` · 渲染粒度与流式缝合 · 有界渲染窗口 · 回填与跟滚。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D33 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
> 同部分相关档：进程与目录形态（渲染面目录与模块注）= `docs/desktop/design/SHELL.md` §1 · 通道与载荷 = `docs/desktop/design/IPC.md` · 界面形态与交互 · 借用清单形态面 = `docs/desktop/design/UI.md` · 逐文件预算（§4.1）= `docs/desktop/design/PROJECT.md`。
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
| 单状态树 | `store.mjs` 单状态树 + 订阅（会话 / 标签页 / 活动池 / 待审批 / 设置 / 项目级信息——批 9 增两切片；**批 A 增** `questions` / `tasks` 两切片 + 队列面（**「回合中插入」批收正**：`pending` 切片 = `ev:queue` 镜面——原三纯动作退场；单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**）；**会话模型轮 R13**：会话开合 ∕ 换形态归 `thincoder-desktop/renderer/mount-sessions.mjs` 面内记账（活动会话单源 = `activeSession`）；**批 B 增** `usage` 切片），由 IPC 事件驱动 | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/IPC.md` §1 |
| 渲染粒度 · 流式缝合 | `chat-stream.mjs` 按块更新、不整段重画（token / 推理块 / 工具卡增量）；**尾块文本面增量 md**（冻结切点 + 热区换代——性能尾账批；单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-10） | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/PROJECT.md` §4.1 |
| 更新纪律（帧合并 · 收核） | 触发源 = store 变更 ⇒ 核帧合并件 `mark`；单飞 rAF + `FRAME_MIN_MS`(50) 间隔；每帧每面至多绘一次 + 布局节俭 + 帧尾动作；帧内组合（就地改 + 追加）= `patch-append` 档——不回落重挂 | 本档 §1.2 · `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-9 |
| 设置面 / 向导（批 9） | 两形构树（`thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`）+ 薄挂载出档（`thincoder-desktop/renderer/mount-settings.mjs`）；**零新事件通道**（请求通道）；向导闸 = `config:read` 回执 `configured` | 本档 §1.1 · `docs/desktop/design/UI.md` §1 设置面 / 首启向导行 |
| 提问与计划卡 · 输入区（批 A） | 提问卡 / 计划卡 = 流内非块节点，纯构树（`thincoder-desktop/renderer/views/question.mjs` / `thincoder-desktop/renderer/views/plan.mjs`——零 `store` import）· 输入区 = 中区底行挂载出档（`thincoder-desktop/renderer/mount-composer.mjs`，自 `app.mjs` 拆出）· 卡族挂载与出站 = `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮——`question:respond` 出站 + 清本键 `questions` 切片 + 清位标） | 本档 §1.1 · `docs/desktop/design/UI.md` §1 输入区 / 提问呈现 / 计划面行 |
| 挂起窗与消化轮（桌面空闲唤醒） | 宿主挂起驱动（消费核件）= 空闲子任务 settle ⇒ 自唤醒消化轮；两事件面 `ev:susp`（计数：状态行段 3 第三态）· `ev:digest`（边界：流内消化状态行）；挂起空闲输入开放；块归档（**回收窗（reclaim 形）**——消化完成点对 `consumed` 实参逐条补发 `done`（consult 会话条目 ⇒ 按其 `childIds` 逐子块补发——consult 同族收齐批 · #748；`hooks.reclaim` = **主面**；对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:173`）；退出 freeze = 兜底同型（`ev:susp {active:false}` 径）；**待消化块来源 = 全族 settle**——非挂起态亦发 `settled`（块到达时点归位批 · #746——本批以其落地为依赖）） | 本档 §1.1 · `docs/desktop/design/PROJECT.md` §2 KD-34–36 · `docs/desktop/design/IPC.md` §1 |
| 有界渲染窗口 | 见本档 §2 | 本档 |
| 回填与跟滚 | 见本档 §3 | 本档 |
| 右栏宽度拖动（chrome 级直写 · D30） | 拖柄三段交互 + 内联 `--pool-w` 直写（rAF 合帧）· 界 = CSS `clamp` 单落点 · 持久化 = `localStorage`（端自有 UI 态） | 本档 §1.3 · `docs/desktop/design/UI.md` §1 本批注 |
| 主题三态（chrome 级状态 · D33） | `data-theme` 状态（单写者 `theme.mjs`）+ 单块 `light-dark()` 值对 + `localStorage` 持久化 · 零 IPC | 本档 §1.4 · `docs/desktop/design/UI.md` §1 本批注 |

### 1.1 视图面形态：纯描述符 + 薄挂载

- **两层分家**：视图档（`thincoder-desktop/renderer/views/*.mjs`）分两层 —— ① **纯构树**（`xxxModel(state)` → 态对象；`xxxTree(model)` → **结构描述符树**）；② **薄挂载**（`mountXxx(root, state)` = `clear` + `build` + `append`——**建树面单点**）。
  视图档 **DOM 触面四处** = 建树（本条）· 接线（下条）· 帧尾态刷（`syncChrome`——本档 §1.1）· 帧尾滚动作（`settleFrame` ∕ 池面 `mountPool` 尾——本档 §3）。
- **接线面（第二形）**：事件 / 状态机型视图档（如滚动面）以 **`attachXxx(root, deps)`** 落形——`deps` = 出口回调集（`on*` 键：回填 / 复跟 / 停跟 / **滚动拍**）+ **只读口** `guards?()`（缺 ⇒ 恒假），程序化滚动作经返回 handle 出（不占 `deps` 键）；阈值常量与事件订阅（`scroll` 用 `passive`）收口于该档（常量单源声明 = 档头）；判定与算式一律纯函数（`scrollAction` / `compensateTop` / `nextWindow` / `smoothWindowOpen`）。
- **接线面依赖面（测试缝）**：`attachXxx` 的 DOM 依赖 = root 三读数（`scrollTop` / `scrollHeight` / `clientHeight`）+ `addEventListener` / `scrollTo` ⇒ **假 root 可注入**（接线面入自动面：直调出口 + 断言 store 读数）；**真实事件触发（用户真滚）仍归人工走查**。
- **事件归约面（批 8 落）**：`ev:*` **二十三通道** → 切片写者**单源** = `thincoder-desktop/renderer/events.mjs`——`reduce(state, ev)` 纯函数（零 DOM ⇒ 平 node 直测）+ `applyPage(state, receipt)`（页回执 → 首屏 / 回填两径）
  + `applyFlags(state, key, flags)`（`sessionFlags` 切片写者——页读 / 出站回执**两径同点**；状态栏对齐批）+ `blockOfMessage(msg)`（核 message → 块五型：用户 / 助手 / 推理 / 工具 / 错误——**页读域**；
  **块总集 = 六型**：+ `subagent`（归档子 agent 块——**留档块**（留档批 · #719）：**页读域第六型**——六型全员入页读域；「对齐第二批」项 5））；
  订阅接线拆出 `thincoder-desktop/renderer/events-subscribe.mjs`——`attachEvents({ on, store, invoke, onTurnTail })`（二十三通道订阅 · 退订句柄在场 · 回合尾标题刷新**存续**——输入区 flush 携行随「回合中插入」批退场）· 单向依赖归约档（无环）。
  写者与读者键面同源 = `key`（`docs/desktop/design/IPC.md` §1 会话键面）。
  **批 A 增（两通道归约）**：`ev:question` / `ev:task` 由「直返 `state`」改**写切片**（`state.questions` / `state.tasks`——同 `key` 就地替换零叠条，**不入 `pool`**）；队列面写者 = `ev:queue` 归约（**「回合中插入」批收正**——权威 = 宿主 ∕ 渲染面 = 镜面；原 store 纯动作 `pool.queue` 写面退场——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**）。
  **批 B 增（一通道归约）**：`ev:usage` 写 `usage` 切片（按会话 `key` · 同键就地替换 · 首写自种——**归约面唯一写者**；未至 / 非正数 ⇒ 零节点——KD-20，单源 = `docs/desktop/design/PROJECT.md` §2 KD-20 行）。
  **本批增（桌面空闲唤醒 · 两通道归约 + 消化行族）**：`ev:susp` 写 `susp` 切片（按会话 `key` · 同键就地替换——计数四值 + `active`；`active:false` ⇒ 段回落两态词，**禁假造**）；`ev:digest` 写 `digest` 切片（按会话 `key` · **逐轮累积**——`start` ⇒ **追加本轮**（旧轮零动——行入流，与内容同生态）· `cap` ∕ `end` **就末轮更新**（cap 事实跨 `end` 存续；无轮 ⇒ 零写——**防守档**（宿主轮序守恒下不可达；VSC 死游标零动作只系 `end`））；**记录 ∥ 显示两面**：轮事件三型（`start` ∕ `cap` ∕ `end`）**全量**逐条入**人读线记录**（`pushReal` 同面追加——不入机器线）；**显示 = 逐轮在流（零摘除——旧轮随流自然卷走；既非「删除」亦非「保留」；口径终正 = 用户 2026-09-30 21:40）**；切片清点（`clearDigest`——未结末轮保，余随首屏记录重建）+ 折叠（`foldDigest`——页内全量完整轮 + 消费轮配对））；
  **流内消化行族** `[data-digest]` = **逐轮行元素（非块节点）· 流内就地**（**累积**——`start` 帧落**座次**〔= 起跑帧当刻流末（起跑水位 = 起跑时已有块数）；起跑后常规新块随流居其下；归档块按到达序入其消费轮座次位——先于该轮行族〕、随流滚动；沿 `[data-pending]` 先例——不占块序 / 不动 `data-blocks` 不变式；**行集 = 本轮**（起跑标签行——**恒在**（终态不撤；对位 VSC `chat-status.js:79` 标签行零删除）+ `n > 0` 计数行（**终态文 = `digest.done` ∕ `digest.aborted`**——`end` 帧**就地换文**，对位 VSC `chat-status.js:110-121`）+ **cap 行（锚 `data-digest-cap`；`mode === "stop"` ⇒ 并 `.digest-cap-stop`；行文 = `digest.capStop` ∕ `digest.capAuto`）**；ask 档行文 = `digest.turnLabelAsk`（携 `from` ∕ `msg`；终态不换词——沿 VSC `:77-78`）；行形单源 = `thincoder-vscode/webview/chat-status.js:69-122`；**行族形态（本批收正——对位 VSC 实形）：无轮容器**——行元素 = 流内并列兄弟（逐行直挂、不做每轮包裹元素；对位 VSC `chat-status.js:72-89` 逐行 `appendChild`）；**cap 行 = 尾追形——两径并存为设计**：**活流径** = cap 帧到达于**流末锚**补建（随流尾追——其位可与其族本体不相邻；对位 VSC `chat-status.js:97-105` 到达即 `appendChild`）∥ **重建径** = **族内紧邻**（`digestRows` 出 [标签行, 计数行?, cap 行?]——重建按记录；对位 VSC #726 复列——`docs/vsc/design/WEBVIEW.md` §5.7）；**重挂后位次差（自活流尾位回族内位——仅此一枚行）= 在册行为、非缺陷**）；**记录面 = 行族入人读线 `digest` 记录（全量在档）**）；
  **流内压缩状态行** `[data-compress]`（R4 增）= 非块节点组同侧单元素四态（start ∕ done ∕ fallback ∕ failed——形 / 在场 / 生命期 = `docs/desktop/design/IPC.md` §1 `ev:compress` 行；构树面 = `thincoder-desktop/renderer/views/compress-status.mjs`）；**定位 = 流元素冻结点**（单源 = 本档 §1.1 插入点纪律条）
  · **卡序闭集 += `goal`（尾位）**（R5 增——核件 `renderGoalPanel` 直取；卡序单源 = `thincoder-desktop/renderer/mount-cards.mjs` `CARD_ORDER`）· **`ledgerDetail` 行**（R8 增——`ev:ledger` `detailLines` 切片 ⇒ 状态行段 11 tooltip 载波，非块节点）；
  **在场 / 出现 / 更新 / 退场路径**：在场 ⟺ 轮集非空（逐轮累积）；出现 = `start` 帧**落座次**（= 起跑帧当刻流末〔起跑水位 = 起跑时已有块数〕；起跑后常规新块随流居其下；归档块按到达序入其消费轮座次位——先于该轮行族）∥ 行族缺 ∧ 本轮在场 ⇒ 构树自愈（座次插）∥ 更新 = **本轮计数行就地换文**（`end`——标签行零动）∥ 退场 = **零摘除**（旧轮随流自然卷走；重挂 ∕ 首屏整置 = 唯一清点）；**行元素为非块节点 ⇒ 不占块序 ∥ 不计 `data-blocks`**（**随窗**——重建径在场面 = 记录位次落于已渲染块区——留档批 · #719；沿本档 §1.1 ∕ §2 口径）**；插入点 / 根子序与帧尾态刷成员 = 本档 §1.1 两条纪律（两处皆本族点名）；
  **块归档面**（**回收窗（reclaim 形）**：消化完成点 = `hooks.reclaim(consumed)` 实参逐条补发 `ev:subagent { status: "done" }`（consult 会话条目 ⇒ 按其 `childIds` 逐子块补发——consult 同族收齐批 · #748；`thincoder-desktop/src/main/suspension-drive.mjs` `reclaim` 钩——**主面**；对位 VSC `thincoder-vscode/src/extension/suspension.mjs:112-119` 逐条补发 ∥ CLI `thincoder-cli/src/tui/suspension-drive.mjs:173` reclaim → `freezeReclaimDigestedBlocks`）——`settled` 待消化块（**含非挂起态 settle——块到达时点归位批 · #746**）归档入流、**居消费行族之前**（落位 = 本档 §1.1 插入点纪律条）；退出 freeze = 兜底同型（`ev:susp {active:false}` 径——对位 VSC `suspension.mjs:132-135` freeze 消息）；迟来 `done`（回合窗已闭——边界已清）⇒ 常规块插入点退化）；状态行段 3 三态与词键 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」。
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
- **帧面分派（判据面）**：块面比较对 = 两帧 **`state.blocks`**（全列表引用 + 逐位元素引用）——非模型窗列表（窗列表每帧新数组 ∧ 饱和追加时位移 ⇒ 每 token 全量重挂）；**五档**判据 = `streamDelta`（`none` ∕ `append` ∕ `patch` ∕ `patch-append` ∕ `reset`——组合档 = 本档 §1.2 ②）、
  分派纯函数 = `paintPlan({ prev, next, changedKeys })` → `{ tier, index, remount, refresh, appended }`（平 node 直测；`appended` 自 delta 携出——仅 `patch-append` 档非零）；**分派时机 = 帧合并件**（触发源 = store 变更 ⇒ `mark`——本档 §1.2；比较对不变）。
- **全量重挂键 = `activeSession` / `locale`**：两键变 ⇒ 无条件全量重挂；其余键不重挂——`mountChat` 的 `clear` 清宿主 ⇒ 滚动位置归零（停跟翻转时重挂 = 把用户拽回顶部）。
- **帧尾态刷（刷新面单点）**：每帧末尾一处 `syncChrome(root, model)`（帧尾态刷出档 = `thincoder-desktop/renderer/views/chat-chrome.mjs`——帧尾调用点 = `thincoder-desktop/renderer/views/chat.mjs` `settleFrame` ③；重挂径调用点 = `thincoder-desktop/renderer/app.mjs:171` ∕ `:180` · 幂等 · 与档位解耦——`none` 帧同刷，`refresh` 恒真 = 无帧豁免）⇒ 根锚四（语义单源 = 本档 §2 / `docs/desktop/design/UI.md` §1 对话流行）+ 两控件（摘要块 `hidden > 0` · 药丸 `!following`）
  + **消化行族**（`[data-digest]`——**逐轮行族（累积） · 流内就地**（无轮容器——行元素并列兄弟）；在场 ∕ 更新 ∕ 退场 = 本档 §1.1 归约面条；归档锚 = 本档 §1.1 插入点纪律条；「桌面空闲唤醒批」）——**待发送带不在流内**（住输入区上方带：消费面 = `thincoder-desktop/renderer/mount-composer.mjs` `paintNotices`；数据源 = `pending` 镜面非空判据——两源：忙态队 ∪ 挂起窗输入队；本批收正——收正轮 B12 终态口径落字）
  + **引导节点**（判据 = `model.guide` 空否——`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）在场与文本随判据；`none` 态零块节点不破（只摘不插）。
- **插入点纪律（批 A 扩三卡 · 压缩行定位收正 · 消化行流内落位批收正）**：块节点插入点 = 首个**尾组（压缩行 ∕ 消化行族除外）** ∕ 卡节点之前——**常规新块随流居消化行元素之下**（流内就地序 = CLI `docs/cli/design/TUI.md` §6.9 ∥ VSC `thincoder-vscode/webview/ui.js:102`）；**归档块（`kind: "subagent"`）落位 = 消费轮边界物形**（移植 VSC 三句语义——对位 `thincoder-vscode/webview/activity.js:104-110`）：**设边界元素** = `ev:digest start` 建点记其标签行（对位 VSC `chat-status.js:92` `S._digestBoundary = label`）∥ **`insertBefore(块, 边界)`** = 归档挂载于边界之前（边界在连）· 边界失效 ⇒ 常规块插入点退化（对位 VSC `activity.js:108` `appendChild` 尾追退化）∥ **收帧清边界** = `ev:susp` 收帧即清 ∥ 会话重挂 ∕ 清屏即清（对位 VSC `chat-messages.js:236` 收帧清 ∥ `:122` 清屏清）；**模型同拍（桌面宿主面——窗口模型所需）** = 归档块入模于其消费轮**座次**（= 起跑帧当刻流末〔起跑水位 = 起跑时已有块数〕；起跑后常规新块随流居其下；归档块按到达序入其消费轮座次位——先于该轮行族）⇒ 文档序 [.. 块][归档块][行族][行内后产块 ..] 与 VSC 活流逐字同序，本档 §2 不变式（DOM ≡ `visible`）零破（帧径 = 既有对齐步承接——`evict + prepend` 径（中段插入消解为「头段换代 + 前插」）；对齐不成立 ⇒ 回落重挂档；零新档）；**原块序守卫链（`thincoder-desktop/renderer/views/chat-digest.mjs` `digestBoundaryOf`）退场**（守卫语义由座次面承担——唯落点经座次即保块序）；退化径 = 常规块插入点（VSC `appendChild` 对位）；尾组族内序 = 到期触发行组 → 停止痕 → 台账行（消化行族元素恒居尾组之前）；压缩行 = 流元素冻结点，**不在块插入点上**（VSC D-C3 append-once——创建点定位后新块随流居其下；其后创建的族员 ∕ 卡 ∕ 药丸自然落其后）；
  卡三类 = `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]`，卡间 DOM 次序固定 = 待审批 → 提问 → 计划（缺者跳过）；无尾组无卡 ⇒ `[data-pill]` 之前；两锚皆缺 ⇒ 末位；
  根子序（构树 ∕ 重建）= [摘要块?] → **流序**（块序列 × 消化轮**按座次复列**——活流轮座次 = 起跑水位；重建轮 = 记录位次 + **消费轮配对**（`subagent` 记录居其消费轮族之前——与活流同序；跨页无本轮首 ⇒ 页段尾追加））→ [压缩行?] → [到期触发行组?] → [停止痕?] → [台账行组?] → [卡序列?] → [药丸?]（**活流序 = 就地**——`start` 帧落座次、随流居其位；重建径 = 按记录位次复列 + 消费轮配对（留档批 · #719——复列 = 页内全量轮）；**待发送带不在流内**——住输入区上方带；重建 ⇒ 压缩行重植于块序列之后 = 该时刻新冻结点，其下新内容随流——VSC「重建即清」对位 = 桌面常驻重植，生命期单源 = `docs/desktop/design/IPC.md` §1 `ev:compress` 行）。
- **引导节点（批 B 追加轮 · 非块节点）**：无活动会话 ∥ 零块 ⇒ 引导节点 `div.chat-empty[data-guide]`——`none` 帧 = 根**唯一子** · `empty` 帧 = **首子**（在块序列 / 卡序列之前）· `flow` 帧 = 不在场；零 `data-block-id` ⇒ **不入块序**（上条根子序与 `data-blocks` 不变式不受其影响）。
  判据（模型 `guide` 字段）= 无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
  构树 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落——流内非块节点构树）；**动作控件在场 ⟺ 句柄在场**（`onOpenDir` / `onNewSession` 缺 ⇒ 整控件缺席——比接线形通则更严：零假按钮）；
  重挂键集须含 `project`（键名单 = `thincoder-desktop/renderer/app.mjs`）；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注项 1 / 2。
- **卡面在场与随动（帧尾态刷 · 批 A 扩三卡）**：卡节点 `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]` 的在场与文本随帧内判据刷（形态单源 = `docs/desktop/design/UI.md` §1 审批呈现 / 提问呈现 / 计划面三行）；`question` 卡**退场非乐观**（回执 `ok` 真 ⇒ 清除；失败 ⇒ 卡留可重试 + `console.error`——出口口径见该行；
  **中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清位标——判据 = 终局事件面，非回执（单源 = 本档「回合尾三径」条））；
  三卡皆**非块节点** ⇒ 不入块序不变式（本档 §2），块面比较对与 `data-blocks` 语义不受其影响。
- **流内非块节点族（对齐第二批扩 · 桌面空闲唤醒批增一）**：**消化行族** `[data-digest]`（**逐轮行族（累积）**——无轮容器（行元素 = 流内并列兄弟）；行集 = 本轮（起跑标签行——恒在 + `n > 0` 计数行 + cap 行（锚 `data-digest-cap`——**尾追形**（两径 ∥ 位次差 = 在册行为——单源 = 本档 §1.1 流内消化行族条）））；落点 = **流内就地**（`start` 帧落座次、随流滚动；归档块落位 ∕ 常规新块序 = 本档 §1.1 插入点纪律条）；在场 / 更新 / 退场 = 本档 §1.1 事件归约面条）；
  **归档子 agent 块**（`data-block-kind="subagent"`——**是块节点**（入块序 / 计 `data-blocks`；壳 = 零边距透传容器 + 内嵌核件元素——“对齐第二批”项 5）——**留档批 · #719 ⇒ 留档块**：入**页读域**（计 `data-hidden` ∥ 可回填 ∥ 退窗折摘要块）；记录形 `{ kind: "subagent", meta, rows }`（与活流归档同一形状）。
- **留档记录（消化面留档批 · #719 ⇒ 跨端承接批 · #726——机制单源上提）**：记录**形 ∥ 写缝 ∥ 读缝契约 ∥ 重建义务 ∥ 容差登记**单源 = `docs/core/design/SESSION.md` §6.26（跨端单源——本档不复述）。
  **本端承接面**：产读两面同上核节——产 = 宿主发帧点**同点双动作**（`cap` 帧点 = `thincoder-desktop/src/main/turn-face.mjs:142-143`）∥ 渲染面归档派生点经 `record:append` 通道（快照含非活动键）；读 = 页读直通（核 `historyWindow` opt-in `{ records: true }`）+ **折叠重建**（`digest` 记录 ⇒ **页内全量完整轮**（逐轮携位次 `at` = 起跑记录全局 `idx`；**末轮无 `end` 不产**——防双份）；`subagent` 记录 ⇒ 留档块（`blockOfMessage` 同形）+ **消费轮配对**（居其消费轮族之前——活形镜式））；
  **落盘节律** = 与消息同节律（人读线段即时 ∥ 槽文件回合尾投影）；**修单已落（修复轮 3 · 2026-09-30）** = `end` 记录写点前移（结算序先于槽落盘——消「收束后即时重载末轮痕缺」；落点 = `thincoder-desktop/src/main/turn-face.mjs` `emitDigestEnd` `:169-176` ∥ 两径结算前调用 `:179` ∥ `:184` ∥ `thincoder-desktop/src/main/suspension-drive.mjs` 收尾移出 `:130-140`；裁定 ∥ 判由 = 批档 `docs/batches/2026-09-30-digest-persistence.md` §2）；
  **写面薄壳（端核契约 · 登记）** = 端 `appendRecord`（`thincoder-desktop/src/main/session-io.mjs`）现行 = 复用核 `pushReal` 半提取载体形（字段面 `_fullHistory` ∥ `_recordStore` ∥ `_historyWindow` = 隐式契约；行为面钉守 = 批内件腿 1a）——**消解路径** = 端壳下次触碰改调核 `pushRecord` 单点（行为等价）；**边界** = 记录不入机器线 ∥ 重建径置位规则与活流同一套（座次 ∕ 消费轮配对 ∥ `blockAnchor` 复用）∥ **容差（2 · 桌面侧状态）** = 同 `docs/core/design/SESSION.md` §6.26 容差登记 ①/②（桌面侧特异半句 = ① 页界落于轮记录之间；② 快照产生面「渲染面异步出站」——下一落盘承接）。
- **到期触发行（timer-wake 阶段 2 批增）**：`ev:timer` ⇒ 归约写 `state.timerNotice[key]` 切片 ∧ `thincoder-desktop/renderer/views/chat.mjs` 流内行组（非块节点 · 不入块序——**与 `[data-digest]` 行同族**）；行文 = 交付原文（显示裁 ≤3 行 + `…`）；
  在场 / 退场路径 = **随页读整置即失**（沿 `[data-stopped]` 先例——定形 2026-09-28）；落点 = `thincoder-desktop/renderer/page-read.mjs` ∕ `views/chat-chrome.mjs` `syncTimer`（幂等 ∕ 换代原位换 ∕ 缺席摘）；单源 = `docs/desktop/design/IPC.md` §1。
- **池面挂载（键控差分 · 「对齐第二批」项 3；**让位修复批收正（2026-09-29）——壳原位领用**）**：**三径** = ① `none` / `empty` ⇒ `clear` + 零节点（无滚动件）② 壳缺位（首挂 ∕ 换代后）⇒ 建树全挂 ③ **壳在位 ∧ `pool` ⇒ 原位领用**——头 ∕ 待审批族 ∕ 队列族 = **原位重建**（节点内零滚动件——重建零损失）；**子 agent 族容器（含 `[data-pool-body]` 祖先链）零摘离 ∕ 零移动**（块内容区位 ∕ 池自身滚动位跨帧**保真**——链不稳定则位面归零，单源 = `docs/batches/2026-09-29-subblock-follow-resume.md` §2.3-A）；**子 agent 族按 key 复用元素**（`el._subMeta === model` 判据：同 key 跨帧同一元素——内容追加 / 折叠态 / ⏹ 全走核函数，**不重建**）；
  **R10 帧触发判据 = 触碰块换对象引用**（`archiveIntoFlow` 按核 `effects` 键集对被触碰块**换新引用**——未触碰块保原引用 ⇒ 帧比较对逐位引用即定触发，沿本档 §2 帧面分派同源）；
   形态单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3（KD-32 同裁 = `docs/desktop/design/PROJECT.md` §2）。
- **键域与换代（交付评审修正 · 2026-09-28）**：元素复用键域 = **会话内**（容器跨帧常驻不承旧账——同键重现于另一会话 ⇒ 元素账复位 ∕ 换代，禁沿用旧会话行账——relay id 按 agent 实例自 1 起计，同键跨会话重现属常态）；**换元素径**（新代接管）须**挂载后末刷**（⏹ 门控读 `isConnected`——与首见径同序）。
- **1s 拍面（R10 落）**：`thincoder-desktop/renderer/heartbeat.mjs`——拍体 = 在飞块逐块核件 `refreshBlock`（封装 = `refreshLiveBlocks`）+ 状态行重挂（`paintStatus`——装配单点 = `thincoder-desktop/renderer/app.mjs:269-276`）；**判据三件同序** = `_subMeta` 在场 ∧ `!frozen` ∧ 在连（逐值同 VSC `thincoder-vscode/webview/activity.js:149-153`）。
- **设置面与向导形（批 9 落）**：两形构树（`thincoder-desktop/renderer/views/settings.mjs` 四段面〔渠道 / 模型与档位 / agent 参数 / MCP〕· `thincoder-desktop/renderer/views/onboarding.mjs` 三步向导——纯描述符 + 薄挂载，形态单源 = `docs/desktop/design/UI.md` §1）· 接线出档 = `thincoder-desktop/renderer/mount-settings.mjs`（自 `app.mjs` 拆出）；
  **零新事件通道**——读数 / 写入全走请求通道：写成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷 + 向导闸随新档态（**免二跳重调**）；填 key 经 `provider:verify` 真调一次；**闸 = `configured`**（档存在性——向导不进 / 设置面可进 + 明示不可读；零静默重置）。
  **容器面（批 9 裁定）**：挂载根 = `index.html` 单容器 `[data-slot="settings"]` 自身（窗口级覆盖层面——设置树 / 向导树**互斥**占槽：`configured` 假 ⇒ 向导树占位；退场 = `clear` 清空容器 ⇒ 主 UI 可用）。
  **退场口径（批 9 补——子节点面 ∥ 属性面）**：退场 = `clear` 清空容器（子节点面）**+ 薄挂载属性应收**——挂载期所加宿主属性须有复位回路；判据 = **退场后宿主属性集 ⊆ 挂载前属性集**（只增不减 ⇒ 判据不达）；**回路已落 · 单源 = `thincoder-desktop/renderer/views/settings.mjs` `syncHostProps`**（复位表 = `root` → 上次薄挂载所落属性名集 · 未再声明者摘除 · 骨架属性零动）——三挂载共用（设置 / 向导 / 信息行）。
  `removeAttribute` 两命中 = `thincoder-desktop/renderer/views/chat.mjs:227`（`data-streaming` 摘除）+ `thincoder-desktop/renderer/views/settings.mjs:281`（复位表摘除）；**长驻两面** = `thincoder-desktop/renderer/views/{chat,activity}.mjs`（:134 / :167）**无复位回路 ⇒ 码面池**（属性名集常量〔`chromeProps` 四名 · 池树两名〕⇒ 跨重绘不增 ⇒ 现值零残留）。

- **用户块（可见面修复批修 · 写者与出泡时刻 —— #458；「回合中插入」批扩写者；挂起窗径批扩抑制面 ∕ 时刻）**：活流 `user` 块两写者 = **发送面**（`msg:send` 回执 `ok` 真——直发径本地先行）+ **排队消费回执**（`ev:queue.delivered`——**五时刻**：步边界注入 ∕ 回合尾续发 ∥ **窗步边界消费** ∕ **窗内消费 ∕ 残续发**（挂起窗径批增 + 队列取项边缘收正批）；裁决与边界 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-40）+ **挂起窗径抑制面（挂起窗径批增）**：窗内提交零本地块（`onUserEcho` 判据 = `busyOf ∨ suspActiveOf`）⇒ 块唯一来源 = 消费回执；直发径「回执言队形」（含窗内受理）⇒ 本地块**退流**（终态 = 消费前流内零块）；失败径 ⇒ 本地块退流（零块）+ 失败行 + 稿留输入历史；**键门**（回执键 = 现刻 `activeSession`，非活动 ⇒ 零写；
  **在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场——页读 = `thincoder-desktop/src/main/session-slots.mjs:123` / `:145`；槽落盘在回合尾 = `thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）；
  块形 = `{ kind: "user", text, ts? }`（**与 `blockOfMessage` 回放块同形**——无 `id` ⇒ 键域回落位序，同回放；`ts` = 提交 ∕ 入队现刻——「对齐第二批」项 4 载波，非有限数 ⇒ 键缺席）·
  写入走 `appendBlock`（**既有**纯动作——`thincoder-desktop/renderer/store.mjs:73` 导出，归约面 `thincoder-desktop/renderer/events.mjs:21` / `:97` / `:105` / `:220` 四处已消费；`pendingNew` 语义同源）· 二十三通道零 `user` 通道（写入时刻 = 受理时刻 ⇒ 活流块 ⟺ 已受理）。
- **流式游标清点（可见面修复批修 —— #459）**：清点两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② **段界**（`ev:tool-call` 入场 ⇒ 助手文本段收束）；
  清点**须落块面引用**（新块对象 ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚——旁路态无刷新路径 = 缺陷成因面）· 辅助与两族调用点住归约面（`thincoder-desktop/renderer/events.mjs`）· 游标语义 = **末块追加态**（形态单源 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 3 · 裁决 = `docs/desktop/design/PROJECT.md` §2 KD-24）。
- **文本段行形态通则（可见面修复批修 —— #460）**：行内 ≥2 文本段（flex 行：`gap` ∨ `space-between`）⇒ **逐段包元素**（`span[data-seg="<段码>"]`；段缺席 ⇒ 零节点——空段仍占 flex 项 ⇒ 假间隔）；
  **裸串不得直作 flex 行子**（相邻文本节点合为单一匿名项 ⇒ `gap` / `space-between` 静默失效）；逐处段码与取舍 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 4。
- **重建保真族（2026-09-29 · 批 `docs/batches/2026-09-29-desktop-rebuild-fidelity.md` §2.2 ∕ §2.4 · 台账 #604 ∕ #606）**：重建面位 ∕ 焦点保真**二分修形**——**身份保真 = 键控差分**（同一元素跨帧复用：会话控制条条目按会话键 ∕ 池两族按 `promptId` ∕ 条目 `title`——治跨帧点按丢击 ∕ 原生控件开态被销毁）；
  **改名草稿面（会话条）**：键控差分下输入节点跨帧存续（值 ∕ 光标 ∕ 焦点 ∕ 草稿四项皆保）——原 `readDraft` ∕ `restoreDraft` 两函数已随 RF 收口退役（旧制重建复填在差分歧径下成死重）；
  **位置 ∕ 状态保真 = 快照复填**（`thincoder-desktop/renderer/view-state.mjs`：`captureView(root)` ∕ `restoreView(root, snap)`——`snap = { scrolls, drafts, focus }`；focus 键回退链 = `id` → `data-field` → `data-action` → 结构路径兜底）。
  **对话流重挂径**（`activeSession` ∕ `locale` 全量重挂——本档「全量重挂键」条）：重建前捕 `root.scrollTop` + 归档块展开集（`[data-block-id]` 键）——`following` 真 ⇒ `stickToBottom(root)`；假 ⇒ 复原 scrollTop + 展开集（`open` 回真，不强制关闭）；其余四面（会话条 ∕ 状态行 ∕ 池 ∕ 卡面）以 `captureView` ∕ `restoreView` 包重建。
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
  ② **帧内组合（就地改 + 追加）**：`streamDelta` 增 `patch-append` 档 + 对齐步 combo 支（`patchAt`）+ `settleFrame` 同帧「尾块就地 + 追加段挂载」——每新块边界的全量重挂消（帧内组合不再回落 `mountChat`）。

### 1.3 chrome 级直写面：右栏宽度拖动（D30 · 2026-09-30）

- **面判定**：本面 = **chrome 级直写**（不落 store 切片 ∥ 不进帧分派面表 ∥ 零 IPC）——先例 = 滚动面（直写 DOM ∥ 事件自持）；**零 `store` ∥ 零 `events` 依赖**（宽度零自动源——机检负控腿）。
- **模块缝**（拟新增 `thincoder-desktop/renderer/pool-width.mjs`）：注入缝 `{ doc, win, storage, root }`（缺省 = `document` / `window` / `localStorage` ∕ 锚查询）⇒ 平 node 直测；纯函数 = 值解析（非正有限数 ⇒ `null`）；
  导出 = `initPoolWidth`（装配入口：读存储 ⇒ 内联 `--pool-w` ⇒ 拖柄接线）∥ `refreshResizerLabel`（`t("pool.resize")` ⇒ `aria-label`）；**写径 = CSSOM**（`documentElement.style.setProperty("--pool-w", …)` 变量写；**`style` 属性写径列禁径**——平台行为未核）。
- **装配两点**（`thincoder-desktop/renderer/app.mjs`）：① 装配期一次 `initPoolWidth()`——**先于首绘可及面**（引导层在场期完成 ⇒ 零可见跳变）；② 帧分派 `locale` 支一调 `refreshResizerLabel()`（词表到位 ∥ 语言切换随动——单点）。
- **交互三段**（形态 ∥ 判据单源 = `docs/desktop/design/UI.md` §1「本批注（右栏宽度拖动 · D30 · 2026-09-30）」）：`pointerdown`（记起始宽 + 起始 x · `setPointerCapture` · `preventDefault` · `body.pool-resizing`）⇒
  `pointermove`（相对算式 ⇒ 内联 `--pool-w` 写（**写径 = CSSOM**）；**rAF 合帧**——每帧至多一写）⇒ `pointerup` / `pointercancel`（**落定前置（刷一拍）**：rAF 待写在场 ⇒ 撤帧 + 同步落待值（末次 move 位）⇒ 再**读回实宽** ⇒ 归一写回 + 存储写入 + 撤类——落定后零迟到写）。
- **界 = CSS 单落点**（`thincoder-desktop/renderer/chrome.css` 栅格行 `clamp`）：窗口 resize 零 JS（随窗重算）；模块侧零界常量（禁双实现）。
- **持久化**（`localStorage` 键 `thincoder.desktop.poolWidth` · 整数 px）：读 ∥ 写皆捕获 + `console.error`（零静默）；读失败 ∥ 非法值 ⇒ 视同未拖过（零内联写）；写时机 = 仅落定一刻。

### 1.4 主题三态面：`data-theme` 状态（D33 · 2026-09-30）

- **面判定**：本面 = **chrome 级状态直写**（渲染面 · 零 IPC ∥ 零 `events` 依赖 ∥ 主进程零行为面）——先例 = §1.3（宽度面）+ `dataset.locale` 帧写径；**用户值覆写系统缺省**（`system` = 缺省态——非零态）。
- **模块缝**（拟新增 `thincoder-desktop/renderer/theme.mjs`）：注入缝 `{ doc, storage }`（缺省 = `document` / `localStorage`）⇒ 平 node 直测；
  导出 = `initTheme`（装配入口：读存储 ⇒ 归一 ⇒ 写 `documentElement.dataset.theme` ⇒ 返值）∥ `setTheme(value)`（出口：三值闭集校验 ⇒ 应用 + 落存储 ⇒ 返落地值；表外 ⇒ `null` + `console.error`）；常量 = 键 `thincoder.desktop.theme` ∥ `THEMES`（三值闭集——控件序单源）。
- **装配两点**（`thincoder-desktop/renderer/app.mjs` / `thincoder-desktop/renderer/mount-settings-exits.mjs`）：① 装配期一次 `initTheme()` ⇒ `store.set({ theme })`（切片播种——先于首绘可及面，同 `initPoolWidth` 位）；② 设置面出口 `onSetTheme`（`setTheme` ⇒ 切片写——重绘触发键 = `mount-settings.mjs` `SETTINGS_KEYS` 增 `theme`）。
- **值面**（`thincoder-desktop/renderer/theme.css`）：单块 `light-dark()` 值对（色值对 **24**——原双块收敛；`--error-fg` 同值单列）+ `color-scheme` 三态（`light dark` 缺省 ∥ 两枚 `:root[data-theme]` 覆写）；`@media (prefers-color-scheme: dark)` 退场。
  值对函数支持面 = Chromium 123+（宿主实读 = Electron 44.4.5 ∕ Chromium 152.0.7977.130——`releases.electronjs.org`，2026-09-30）。
- **持久化**（`localStorage` 键 `thincoder.desktop.theme` · 三值闭集串）：读 = 装配期一次 ∥ 写 = 点按即刻；读 ∥ 写皆捕获 + `console.error`——读失败 / 表外 ⇒ `system`（降级）；写失败 ⇒ 会话内照常（fail-soft）。
- **单写者纪律**：`documentElement.dataset.theme` 写径全仓仅 `theme.mjs` 一处（机检负控腿）；任一 `theme` 切片写入须先经 `theme.mjs`。

## 2. 有界渲染窗口

- **MAX_RENDER_BLOCKS = 150**：只渲染尾部窗口，更早块折**「摘要块」**（可一键回填，回填后仍守窗口）；**不做虚拟化**（DOM 块数有界即达标——虚拟化不列入本版）。**值 = VSC `MAX_MESSAGE_BLOCKS`（`thincoder-vscode/webview/ui.js:204`）逐值对齐（2026-09-29 · 批 `docs/batches/2026-09-29-hatch-clearance-2.md` §4 裁定 = 建议㈠ · E10 端差消）**。
- **窗限增量**：窗限 = 视图侧计数（初值 150）——回填收束沿（无在途 ⇒ 页并入）⇒ 限 + **本页归约后实际块数**（页量 = 核 `historyWindow` 缺省 200 **条**——**条 ≠ 块**，渲染面不写死页量），以宽窗容纳并入的更早页；未渲染更早块数落根锚 `data-hidden`（判据函数 = `nextWindow`——落点 = `thincoder-desktop/renderer/views/chat-scroll.mjs`）。`hasOlder ∧ data-hidden === 0` ⇒ 零摘要块（回填只经滚顶触发）。
- **留档块记账（「对齐第二批」项 5 · 留档批 · #719 收正）**：`kind === "subagent"`——留档块（页读域第六型）计入块序 / `data-blocks` / 尾窗渲染；**退出尾窗 ⇒ 计入 `data-hidden` ∥ 折摘要块 ∥ 可回填**（留档件——页读有源）⇒ 摘要块判据（`hidden > 0`）与回填触发（`hasOlder`）含留档块，与五型块同规。
- **窗口对齐步（非重挂帧帧尾固定步）**：每帧以本帧 `visible`（= 窗出口尾窗）对齐已挂块序 `mounted`（帧层记账——不变式：DOM 块节点序 ≡ 其）——判据纯函数 `alignPlan(mounted, visible, tailExempt, appended = 0)` → `{ evict, prepend, patchAt, tail, ok }`（落点 = `thincoder-desktop/renderer/views/chat-stream.mjs`）；`patchAt` = 就地更新位（纯 patch = 尾位）——既有键纯增。
  **第 3 参兼容口径** = 真值（`true`——既有调用 ∕ 用例仍视作尾位豁免）∨ mode 串（`"patch"` = 尾位豁免 ∕ `"patch-append"` = 组合档——第 4 参 `appended` 生效）。
- **对齐判据**：重合 = 逐位**引用**等（非键——兜底键 `String(index)` 逐位会漂）；取**最大重合**（`evict` 最小者）；`evict` = 摘去 DOM 头部枚数、`prepend` = 头部前插枚数（插点 = 块序首，摘要块之后）；**尾位豁免**（`tailExempt` = `patch` 档 ⇒ 尾位不入重合判、不入余段，由就地更新承接）；零重合 ⇒ `ok = false` ⇒ 该帧回落全量重挂。
  **组合档（`patch-append`）** = 尾位同键改 + 追加 k ≥ 1 枚（帧内组合）：尾位豁免 + 追加段 = `visible` 尾 k 枚（`patchAt = visible.length - 1 - k`；目标头段 = `visible.slice(0, patchAt)`）；**稳定性守卫** = 重合须覆盖全部目标头段（`prepend + overlap === goals.length`——否则 `ok = false` 回落重挂）；**纯追加档广义化**（任意枚追加增量挂载）。
- **对齐步两效果**：饱和追加 ⇒ 摘最旧守窗口（DOM 块数有界）；限增宽窗帧（块面可为零变更——限变而 `blocks` 引用等）⇒ 前插更早页块；对齐步不随块面档位（`history` 帧同走）。
- **DOM ≡ `visible` 不变式**：非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`（逐位引用等）⇒ 根锚 `data-blocks` = `visible.length` = DOM 块节点数；重挂帧由 `mountChat` 按 `visible` 重建（同断言）。
- **巨块分段窗（E4-JS 支 · 2026-09-30 · 机制 ∕ 参数单源 = 批档 `docs/batches/2026-09-30-desktop-heap-freeze.md` §2.15）**：巨块（渲染文本 > 24K 字符）按 **12K 字符 ∕ 段**切分——文本节点级 `splitText` + 行内续跑 `<span data-seg>` 包壳（顶层块节点即单元）；
  窗 = **视口段 ± 1 段**（可见 ≤4 段）；切换 = `display:none` 置 ∥ 清（**文本恒在 DOM**——`textContent` 等价 ∥ 搜索命中面完整）；每帧段状态变更 ≤ 2；
  初窗住挂载径（`dressNode` ∥ `mountChat`——先于一切读数步）· 滑动住帧尾第 ⑦ 步（内容帧 ∥ 滚动拍 `segView` 信号）；**与块窗两级叠加**——块窗管块序（本节各条零改），段窗管块内。

## 3. 回填与跟滚

- 回填 = 滚至顶 **≤ 40px** ∧ 有更早页 ∧ 无在途 ⇒ 取一页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；**条 ≠ 块**），插入后按 `scrollHeight` 增量修 `scrollTop`（视口不跳）——三出口判定与补偿算式 = 纯函数 `scrollAction`（`backfill` / `follow` / `unfollow`）· `compensateTop`。
- 跟滚 = 近底 **24px** 复跟（判据 = 核工厂 `nearBottom`——严格小于：恰 24px 不判近底；`FOLLOW_PX` = 工厂 `NEAR_BOTTOM_PX` 再出口保名——2026-09-29 留端清算）。
  上滚即停跟；**药丸单判据 = `!following`**（「可滚 ∧ 非近底 ⇒ 显」与此**等价**——上滚即停跟；文本两态 = 未读数 > 0 ⇒ `chat.pill.new`（`${n}`），否则 `chat.pill.bottom`）；点击回底复跟；程序化平滑滚动互斥窗 **420ms**（判据 = `smoothWindowOpen(now, lastAt)`）。
- **滚动作落面**（DOM 写面点名）：跟滚追加 ⇒ **瞬时贴底**（写 `scrollTop`——先例 `thincoder-vscode/webview/ui.js:428`）· 药丸回底 ⇒ **程序化平滑**（`scrollTo({ top: scrollHeight, behavior: "smooth" })` + 记 `lastAt`）· `scroll` 订阅先过 `smoothWindowOpen(now, lastAt)` 门——**窗内不派发**（该判据真 ⇒ 窗已过期、可派发；程序化平滑的滚动回波不算用户动作）。
- **帧尾滚动作（补偿消费点）**：非重挂帧末尾 `settleFrame(root, model, scroll, align, tier)`（落点 = `thincoder-desktop/renderer/views/chat.mjs` · `paintChat` 调用）——六步序 = ① 挂尾段（**先于读数**）② 读数 `t0` ③ `syncChrome` ④ 头动作（摘 `evict` + 前插 `prepend`）⑤ 读数 `t1` ⑥ 写（下两条）。
- **尾段挂载（第 ① 步）**：`align.tail` 逐枚挂（插点单源 = §1.1 插入点纪律）；`patch` 档 ⇒ 就地更新尾块（文本 + `data-streaming` 锚），尾段 ∅；**组合档（`patch-append`）** ⇒ 先就地更新第 `patchAt` 块（非尾位——`patchTail` 携 `patchAt`）、再挂 `align.tail` 追加段（同帧两动作）；`none` 档 ⇒ 尾段 ∅。
- **帧尾三写（第 ⑥ 步）**：帧后跟滚 ⇒ `stickToBottom`（瞬时贴底——**写超值不读 `scrollHeight`**（浏览器鉗底），幂等）；非跟滚 ∧ `evict + prepend > 0` ⇒ `compensate`（`compensateTop` 算式——`prevTop` = `t0.scrollTop`、`prevHeight` = `t0.scrollHeight`、`nextHeight` = `t1`）；其余 ⇒ **零写**。
- **补偿单权源**：`.flow` 置 `overflow-anchor: none`（`chat.css` 面）——头侧变更的视口锚定只由 `compensate` 显式承担，免浏览器自动锚定叠算。
- **读数区间记账**：区间 = [`t0`, `t1`] 跨头侧变更（摘 / 插 + 摘要块在场与文本）；尾侧（尾段挂载 / 就地更新 / 药丸——单行 `nowrap` 定高，`chat.css`）在区间外或零高度增量 ⇒ ΔH = `t1 - t0` = 头侧净增量。
- **瞬时写不记窗**：`lastAt` 只由程序化平滑（滚动面 handle 方法 `returnToBottom()`——`thincoder-desktop/renderer/views/chat-scroll.mjs:78`）记；`stickToBottom` / `compensate` 不记 `lastAt`——其滚动回波读数即真态（同值 `setFollowing` 归原态）。
- **读数按档裁剪（更新纪律收核批 · 2026-09-29）**：跟滚帧 ⇒ 帧尾两读数免读（贴底 = 写超值）；非跟滚帧 ⇒ 头动作 > 0（补偿径）才读 `t0` ∕ `t1`——即每帧读数 ≤2 且仅在补偿径（禁逐 chunk 强制布局；单源 = 核档 §2 KD-RC-9）。
- **块内容区跟滚（#518 收口 · 核原语直消费；让位修复批收正（2026-09-29））**：子 agent 块内容区（`.advisor-content`）跟滚 = 核件原语 `initBlockFollow` ∕ `maybeScrollBlock`（`thincoder-render-core/subblocks/block.mjs`；落点 = `thincoder-desktop/renderer/views/pool-subagents.mjs`）。
  **接线四点** = ① 出生 ∕ 接管（`subElementOf`）· ② 内容增量（`replayRows` 追加后）· ③ 挂载补钉（`createSubBlock` `family.append` 后）· ④ 接管径补钉（`replaceWith` 后）——① 挂 `initBlockFollow`，余三点 = `maybeScrollBlock` 应用；**帧尾复核** = `mountPool` 尾逐块 `applySubBlockFollow(family)`（族级扫描——`views/pool-subagents.mjs` 新导出；VSC `streaming.js:31` 脏集对位：任何位面被抹 ⇒ 下一帧自愈）——**应用时机契约** = 核档 §2 KD-RC-8（应用点清单：追加后 ∕ 挂载后 ∕ 帧尾复核；“端只在宿主时刻调用核应用器”；端侧遗漏应用点 = **违约缺陷**）。
  判据 = `内容区._pinFollow`（**让位三律** = 近底 < 24px **无条件翻真** ∕ 远离底仅凭**用户手势门**（`wheel` ∕ `touchmove` ∕ `pointerdown` · 600ms）翻假 ∕ 非手势位移（复位回波 ∕ 程序写 ∕ 布局）**不改旗标**；`false` ⇒ **零写**——不夺阅读位）；让位期出口钮 `sub-follow-btn`（核件自持：`open ∧ 非冻结 ∧ 可滚` ⇒ 可见；两态 `sub.follow.new` ∕ `sub.follow.bottom`；点击 ⇒ 回底 + 复跟）——单源 = `docs/render-core/design/RENDER-CORE.md` §2 **KD-RC-8**；折叠（`open=false`）∕ 已移除 ⇒ no-op；写超值不读 `scrollHeight`；桌面帧 = **store 变更排帧**（核帧合并件——单飞 rAF + ≥50ms 间隔 + 脏键集；触发源 = store 变更——本档 §1.2 ∕ 核档 §2 KD-RC-9）。
  **键盘位移**（键盘滚动——无手势标记）不改旗标（非手势位移同路）；可达性 unverified（需真机核）⇒ **残余登记**（单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8）。**手势窗内以手势为准**（窗内非手势位移按手势期计——有意取舍）。
- **池区帧尾钉底（#518 收口 · R10 E6 帧尾径补齐）**：`views/activity.mjs` `mountPool` 尾 `maybePinPool(root)`（`views/activity-new.mjs`——`_poolPin !== false` ⇒ 写 `scrollTop`；VSC `webview/streaming.js:32` `frameEnd` 对位）；
  旗标维护 = `attachActivityNew` `scroll` 订阅（2026-09-29 改工厂 `createPinWatch` 消费——`gestureGateMs = 0`；零行为变更）；未钉底 ⇒ 零写。
  **让位修复批**：池位跨帧保真由领用径承担（池面挂载条）——`_poolPin=false` 时新 chunk 不再拽回顶（churn 消）；`_poolPin` 语义零改（#563② 有界自纠结论保持）；**区钉底判据 ∕ 清账路 = 滚动策略族同源**（核档 §2 KD-RC-8 ④——端 = 工厂消费（`maybePinPool` ∕ `nearBottom` 改工厂调用——`_poolPin` 保持）；判据漂移 = 缺陷）。
  **对拍机检腿** = 批次本地机检件（**本批须新增**——载体单源 = `docs/desktop/design/PROJECT.md` §4.2 本批行「测试面 ∕ 探针面」）。
- **池区旗标窗口登记（#563② 评估 · 残余族清账批 · 2026-09-29）**：`_poolPin` 三写者（点击 ∕ `scroll` ∕ 世代重置）+ 帧尾写守 `_poolPin !== false` 早退 ⇒ 极端窗口（上滚与帧尾写同刻）可夺回一次上滚 = **有界自纠**（非持续失效）——裁 = 维持现态；若真机走查再现夺回 ⇒ 再立小修。
- **滚动策略族工厂化（2026-09-29 · 留端清算 ∕ 台账 #607——机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-8 ④ ∕ §5）**：策略族四件（判据 ∕ 写门 ∕ 旗标维护 ∕ 计数簿记）抽核件 `thincoder-render-core/scroll.mjs`（拟新增）；桌面持载两档改**工厂消费**——
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
- 2026-09-30（**消化面留档批 · 回填轮（实施 A+B 落定）· eng-designer**——承批档 `docs/batches/2026-09-30-digest-persistence.md` §5 ∥ §2 回填轮注记）：本档 §1.1「留档记录」条随实读收正——`cap` 帧点坐标 `turn-face.mjs:122 ⇒ :134-135`（发帧 ∥ 记录同点双动作）；**写面薄壳登记**（端核隐式契约——`pushReal` 字段面）；**修单在册（待落）** = `end` 记录写点前移（结算序先于槽落盘）∥ **在册容差（2）**（跨页截断轮页内不产 ∥ 归档快照族落盘晚一拍）。**零新语义**（坐标 ∥ 裁定 ∥ 容差归置）。明细 = 批档 §2 回填轮注记。
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

- 2026-09-30（**三端消化面统一批 · 重写设计轮 · eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §1 ∥ §2 · 台账 #747）：§1 挂起窗行（块归档 = **回收窗（reclaim 形）**——起跑窗补发已撤）+ §1.1 十一处收正——**归约面条**（行族逐轮累积 · 零全替）· **流内消化行族条**（累积 · 标签恒在 · 座次）· **在场条**（零摘除 · 座次）· **块归档面**（reclaim 主面）· **插入点纪律条**（VSC 边界物三句语义 · 座次入模 · 守卫链退场）· **根子序句**（座次复列 + 消费轮配对）· **留档记录条**（页内全量轮 + 配对）· 帧尾态刷 ∥ 流内非块节点族条（成员句）· 写面薄壳条（置位句）。**口径终正 = 用户 2026-09-30 21:40（「摘 ∥ 留 ∥ 驻留 ∥ 只留」腔维退场——消化行 = 流内普通项）**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 预评审收正轮（歧义收正 + 三裁落位）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §2 收正块 · 台账 #747 · 父侧预评审自查〔22:0x〕）：§1.1『座次』表述三处**统一**（`:43` ∥ `:46` ∥ `:72`——座次 = 起跑帧当刻流末（起跑水位 = 起跑时已有块数）；起跑后常规新块随流居其下；归档块按到达序入其消费轮座次位——先于该轮元素）；行族遗留差异两条**随裁并入本批**（cap 行位置 ∥ 轮容器形态——对位 VSC 收正）；同裁副本同拍 = `docs/desktop/design/IPC.md` §1 ∥ `docs/desktop/design/PROJECT.md` §10 **DA** ② ∥ **KD-60** 上抛栏。**零新语义 ∥ 机制本体零改**。明细 = 批档 §2。
- 2026-09-30（**三端消化面统一批 · 修复轮（评审轮 1 · 发现 1 ∥ 6 ∥ ① 落形裁）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §3 轮次 1）：§1 挂起窗行 ∥ §1.1 块归档面**起跑窗残句删**（现行口径 = 回收窗（reclaim 形）单留）；§1.1 **行族形态规范句落**（**无轮容器**——行元素 = 流内并列兄弟；**cap 行 = 尾追形**（本轮元素族末位）——对位 VSC 实形）——流内消化行族条 ∥ 在场条 ∥ 帧尾态刷成员 ∥ 流内非块节点族条 ∥ 插入点纪律条（座次句 ∥ 边界设施句）同拍；根子序句残句删（留档批 · #719——复列 = 页内全量轮）。**零新语义 ∥ 机制本体零改（除裁定落形）**。明细 = 批档 §2 修复轮块。
- 2026-09-30（**三端消化面统一批 · 实施后收正轮（#747 实施交付）· eng-designer**——承批档 `docs/batches/2026-09-30-triple-end-digest-unify.md` §5 ∥ §2）：§1.1 **cap 行两径钉词**——**活流径 = cap 帧到达于流末锚补建 ∥ 重建径 = 族内紧邻**（**两径并存为设计**；**重挂后位次差 = 在册行为、非缺陷**——对位 VSC 同形：到达即 `appendChild` ∥ 重建按记录）；流内非块节点族条同拍。**零新语义**（父裁落档）。明细 = 批档 §2 实施后收正轮块。
- 2026-09-30（**consult 同族收齐批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-30-consult-family.md` §1 · 台账 #748）：§1 挂起窗行 ∥ §1.1 块归档面——回收补发补 **consult 子块**口径（会话条目 ⇒ 按其 `childIds` 逐子块补发 `done`；子块 settle ⇒ `settled` 驻留）。
  **桌面产品码随动 = `reemitDone` 展开**；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.8。明细 = 批档 §2。
