# 桌面端（DESKTOP）· 渲染面实现工艺

> 板块 = **桌面端渲染面（前端）实现工艺**——零框架 DOM 层 · 单状态树 `store` · 渲染粒度与流式缝合 · 有界渲染窗口 · 回填与跟滚。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D26 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
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
| 渲染粒度 · 流式缝合 | `chat-stream.mjs` 按块更新、不整段重画（token / 推理块 / 工具卡增量） | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/PROJECT.md` §4.1 |
| 设置面 / 向导（批 9） | 两形构树（`thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`）+ 薄挂载出档（`thincoder-desktop/renderer/mount-settings.mjs`）；**零新事件通道**（请求通道）；向导闸 = `config:read` 回执 `configured` | 本档 §1.1 · `docs/desktop/design/UI.md` §1 设置面 / 首启向导行 |
| 提问与计划卡 · 输入区（批 A） | 提问卡 / 计划卡 = 流内非块节点，纯构树（`thincoder-desktop/renderer/views/question.mjs` / `thincoder-desktop/renderer/views/plan.mjs`——零 `store` import）· 输入区 = 中区底行挂载出档（`thincoder-desktop/renderer/mount-composer.mjs`，自 `app.mjs` 拆出）· 卡族挂载与出站 = `thincoder-desktop/renderer/mount-cards.mjs`（批 A 修正轮——`question:respond` 出站 + 清本键 `questions` 切片 + 清位标） | 本档 §1.1 · `docs/desktop/design/UI.md` §1 输入区 / 提问呈现 / 计划面行 |
| 挂起窗与消化轮（桌面空闲唤醒） | 宿主挂起驱动（消费核件）= 空闲子任务 settle ⇒ 自唤醒消化轮；两事件面 `ev:susp`（计数：状态行段 3 第三态）· `ev:digest`（边界：流内消化状态行）；挂起空闲输入开放；块回收（消化完成逐条 `done` 归档） | 本档 §1.1 · `docs/desktop/design/PROJECT.md` §2 KD-34–36 · `docs/desktop/design/IPC.md` §1 |
| 有界渲染窗口 | 见本档 §2 | 本档 |
| 回填与跟滚 | 见本档 §3 | 本档 |

### 1.1 视图面形态：纯描述符 + 薄挂载

- **两层分家**：视图档（`thincoder-desktop/renderer/views/*.mjs`）分两层 —— ① **纯构树**（`xxxModel(state)` → 态对象；`xxxTree(model)` → **结构描述符树**）；② **薄挂载**（`mountXxx(root, state)` = `clear` + `build` + `append`——**建树面单点**）。视图档 **DOM 触面四处** = 建树（本条）· 接线（下条）· 帧尾态刷（`syncChrome`——本档 §1.1）· 帧尾滚动作（`settleFrame`——本档 §3）。
- **接线面（第二形）**：事件 / 状态机型视图档（如滚动面）以 **`attachXxx(root, deps)`** 落形——`deps` = 出口回调集（`on*` 键：回填 / 复跟 / 停跟）+ **只读口** `guards?()`（缺 ⇒ 恒假），程序化滚动作经返回 handle 出（不占 `deps` 键）；阈值常量与事件订阅（`scroll` 用 `passive`）收口于该档（常量单源声明 = 档头）；判定与算式一律纯函数（`scrollAction` / `compensateTop` / `nextWindow` / `smoothWindowOpen`）。
- **接线面依赖面（测试缝）**：`attachXxx` 的 DOM 依赖 = root 三读数（`scrollTop` / `scrollHeight` / `clientHeight`）+ `addEventListener` / `scrollTo` ⇒ **假 root 可注入**（接线面入自动面：直调出口 + 断言 store 读数）；**真实事件触发（用户真滚）仍归人工走查**。
- **事件归约面（批 8 落）**：`ev:*` **十八条**通道 → 切片写者**单源** = `thincoder-desktop/renderer/events.mjs`——`reduce(state, ev)` 纯函数（零 DOM ⇒ 平 node 直测）+ `applyPage(state, receipt)`（页回执 → 首屏 / 回填两径）
  + `applyFlags(state, key, flags)`（`sessionFlags` 切片写者——页读 / 出站回执**两径同点**；状态栏对齐批）+ `blockOfMessage(msg)`（核 message → 块五型：用户 / 助手 / 推理 / 工具 / 错误——**页读域**；
  **块总集 = 六型**：+ `subagent`（归档子 agent 块——**运行期块**，非页读域；「对齐第二批」项 5））；
  订阅接线拆出 `thincoder-desktop/renderer/events-subscribe.mjs`——`attachEvents({ on, store, invoke, onTurnTail })`（十八条通道订阅 · 退订句柄在场 · 回合尾标题刷新**存续**——输入区 flush 携行随「回合中插入」批退场）· 单向依赖归约档（无环）。
  写者与读者键面同源 = `key`（`docs/desktop/design/IPC.md` §1 会话键面）。
  **批 A 增（两通道归约）**：`ev:question` / `ev:task` 由「直返 `state`」改**写切片**（`state.questions` / `state.tasks`——同 `key` 就地替换零叠条，**不入 `pool`**）；队列面写者 = `ev:queue` 归约（**「回合中插入」批收正**——权威 = 宿主 ∕ 渲染面 = 镜面；原 store 纯动作 `pool.queue` 写面退场——单源 = `docs/desktop/design/PROJECT.md` §2 **KD-40**）。
  **批 B 增（一通道归约）**：`ev:usage` 写 `usage` 切片（按会话 `key` · 同键就地替换 · 首写自种——**归约面唯一写者**；未至 / 非正数 ⇒ 零节点——KD-20，单源 = `docs/desktop/design/PROJECT.md` §2 KD-20 行）。
  **本批增（桌面空闲唤醒 · 两通道归约 + 消化行族）**：`ev:susp` 写 `susp` 切片（按会话 `key` · 同键就地替换——计数四值 + `active`；`active:false` ⇒ 段回落两态词，**禁假造**）；`ev:digest` 写 `digest` 切片（按会话 `key` · 同键就地替换——起跑 / 终态两态；`end` 原地更新本键游标行）；
  **流内消化行族** `[data-digest]` = 非块节点组（沿 `[data-pending]` 先例——不占块序 / 不动 `data-blocks` 不变式；两行：起跑标签行 + `n > 0` 计数行——单源 = `thincoder-vscode/webview/chat-status.js:69-122`）；
  **在场 / 出现 / 更新 / 退场路径**：在场 ⟺ 本键 `digest` 切片 = 起跑态（`start`）；出现 = 起跑帧建组 ∥ 更新 = `end` 原地更新本键游标行（先更新后摘）∥ 退场 = `end` 更新毕摘除；插入点 / 根子序与帧尾态刷成员 = 本档 §1.1 两条纪律（两处皆本族点名）；
  **块回收面**（驱动 hooks.reclaim ⇒ `ev:subagent { status: "done" }` 逐条补发—— `settled` 驻留块归档入流；退出 freeze 同型）；状态行段 3 三态与词键 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」。
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
- **帧面分派（判据面）**：块面比较对 = 两帧 **`state.blocks`**（全列表引用 + 逐位元素引用）——非模型窗列表（窗列表每帧新数组 ∧ 饱和追加时位移 ⇒ 每 token 全量重挂）；四档判据 = `streamDelta`、分派纯函数 = `paintPlan({ prev, next, changedKeys })` → `{ tier, index, remount, refresh }`（平 node 直测）。
- **全量重挂键 = `activeSession` / `locale`**：两键变 ⇒ 无条件全量重挂；其余键不重挂——`mountChat` 的 `clear` 清宿主 ⇒ 滚动位置归零（停跟翻转时重挂 = 把用户拽回顶部）。
- **帧尾态刷（刷新面单点）**：每帧末尾一处 `syncChrome(root, model)`（`chat.mjs` DOM 面 · 幂等 · 与档位解耦——`none` 帧同刷，`refresh` 恒真 = 无帧豁免）⇒ 根锚四（语义单源 = 本档 §2 / `docs/desktop/design/UI.md` §1 对话流行）+ 两控件（摘要块 `hidden > 0` · 药丸 `!following`）
  + **待发送气泡组**（`[data-pending]`——在场 ⟺ 本会话队（`pending[<会话键>]`）非空；**写者 = `ev:queue` 归约**（宿主快照镜面——「回合中插入」批）；「对齐第二批」项 2）+ **消化行组**（`[data-digest]`——在场 ⟺ 本键 `digest` 切片起跑态；`end` ⇒ 原地更新后摘除；「桌面空闲唤醒批」）
  + **引导节点**（判据 = `model.guide` 空否——`none` / `empty` 帧由重挂面建 · `flow` 帧由本刷面摘）在场与文本随判据；`none` 态零块节点不破（只摘不插）。
- **插入点纪律（批 A 扩三卡）**：块节点插入点 = **首个卡节点之前**——卡三类 = `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]`，卡间 DOM 次序固定 = 待审批 → 提问 → 计划（缺者跳过）；卡缺席 ⇒ `[data-pill]` 之前；两者皆缺席 ⇒ 末位——根子序 = [摘要块?] → 块序列 → [消化行组?] → [待发送气泡组?] → [卡序列?] → [药丸?]（尾段两族同侧 = 块序列之后、卡序列之前；族内序 = 消化行组 → 待发送气泡组）。
- **引导节点（批 B 追加轮 · 非块节点）**：无活动会话 ∥ 零块 ⇒ 引导节点 `div.chat-empty[data-guide]`——`none` 帧 = 根**唯一子** · `empty` 帧 = **首子**（在块序列 / 卡序列之前）· `flow` 帧 = 不在场；零 `data-block-id` ⇒ **不入块序**（上条根子序与 `data-blocks` 不变式不受其影响）。
  判据（模型 `guide` 字段）= 无活动会话 ⇒ `cwd` 缺 ? `no-project` : `no-session`；有活动会话 ∧ 可见块 0 ⇒ `no-message`；否则 `null`。
  构树 = `thincoder-desktop/renderer/views/chat-guide.mjs`（批 B 追加轮新档 · 已落 · 实读 **54**——沿流内非块节点构树先例 = `thincoder-desktop/renderer/views/chat-copy.mjs`）；**动作控件在场 ⟺ 句柄在场**（`onOpenDir` / `onNewSession` 缺 ⇒ 整控件缺席——比接线形通则更严：零假按钮）；
  重挂键集须含 `project`（键名单 = `thincoder-desktop/renderer/app.mjs`）；形态单源 = `docs/desktop/design/UI.md` §1 批 B 追加注项 1 / 2。
- **卡面在场与随动（帧尾态刷 · 批 A 扩三卡）**：卡节点 `[data-card="approval"]` / `[data-card="question"]` / `[data-card="task"]` 的在场与文本随帧内判据刷（形态单源 = `docs/desktop/design/UI.md` §1 审批呈现 / 提问呈现 / 计划面三行）；`question` 卡**退场非乐观**（回执 `ok` 真 ⇒ 清除；失败 ⇒ 卡留可重试 + `console.error`——出口口径见该行；
  **中断径** = `msg:interrupt` ⇒ 本键各门按取消结算 ⇒ 终局 `stopped` ⇒ **事件面摘本键提问项** + 清位标——判据 = 终局事件面，非回执（单源 = 本档「回合尾三径」条））；
  三卡皆**非块节点** ⇒ 不入块序不变式（本档 §2），块面比较对与 `data-blocks` 语义不受其影响。
- **流内非块节点族（对齐第二批扩 · 桌面空闲唤醒批增一）**：**消化行组** `[data-digest]`（两行 = 起跑标签行 + `n > 0` 计数行；落点 = 块序列之后、待发送气泡组之前；在场 / 更新 / 退场 = 本档 §1.1 事件归约面条）；
  **待发送气泡组** `[data-pending]`（组内项 = 待发送气泡·落点 = 块序列之后、卡序列之前——与块插入点同侧 ⇒ 交接位置零跳）；**归档子 agent 块**（`data-block-kind="subagent"`——**是块节点**（入块序 / 计 `data-blocks`；壳 = 零边距透传容器 + 内嵌核件元素——“对齐第二批”项 5）。
- **到期触发行（timer-wake 阶段 2 批增）**：`ev:timer` ⇒ 归约写 `state.timerNotice[key]` 切片 ∧ `thincoder-desktop/renderer/views/chat.mjs` 流内行组（非块节点 · 不入块序——**与 `[data-digest]` 行同族**）；行文 = 交付原文（显示裁 ≤3 行 + `…`）；
  在场 / 退场路径 = **随页读整置即失**（沿 `[data-stopped]` 先例——定形 2026-09-28）；落点 = `thincoder-desktop/renderer/page-read.mjs` ∕ `views/chat-chrome.mjs` `syncTimer`（幂等 ∕ 换代原位换 ∕ 缺席摘）；单源 = `docs/desktop/design/IPC.md` §1。
- **池面挂载（键控差分 · 「对齐第二批」项 3）**：壳（三态 / 头读数 / 折叠）与待审批 / 队列族**照帧刷**（`clear` + `build` + `append` 薄挂载口径不变）；**子 agent 族按 key 复用元素**（`el._subMeta === model` 判据：同 key 跨帧同一元素——内容追加 / 折叠态 / ⏹ 全走核函数，**不重建**）；
  **R10 帧触发判据 = 触碰块换对象引用**（`archiveIntoFlow` 按核 `effects` 键集对被触碰块**换新引用**——未触碰块保原引用 ⇒ 帧比较对逐位引用即定触发，沿本档 §2 帧面分派同源）；
   形态单源 = `docs/desktop/design/UI.md` §1「本批注（对齐第二批 · 六件）」项 3（KD-32 同裁 = `docs/desktop/design/PROJECT.md` §2）。
- **键域与换代（交付评审修正 · 2026-09-28）**：元素复用键域 = **会话内**（容器跨帧常驻不承旧账——同键重现于另一会话 ⇒ 元素账复位 ∕ 换代，禁沿用旧会话行账——relay id 按 agent 实例自 1 起计，同键跨会话重现属常态）；**换元素径**（新代接管）须**挂载后末刷**（⏹ 门控读 `isConnected`——与首见径同序）。
- **2s 拍面（R10 落）**：`thincoder-desktop/renderer/heartbeat.mjs`——拍体 = 在飞块逐块 `refreshBlock` + 状态行重挂；**判据三件同序** = `_subMeta` 在场 ∧ `!frozen` ∧ 在连（逐值同 VSC `thincoder-vscode/webview/activity.js:149-153`）。
- **设置面与向导形（批 9 落）**：两形构树（`thincoder-desktop/renderer/views/settings.mjs` 四段面〔渠道 / 模型与档位 / agent 参数 / MCP〕· `thincoder-desktop/renderer/views/onboarding.mjs` 三步向导——纯描述符 + 薄挂载，形态单源 = `docs/desktop/design/UI.md` §1）· 接线出档 = `thincoder-desktop/renderer/mount-settings.mjs`（自 `app.mjs` 拆出）；
  **零新事件通道**——读数 / 写入全走请求通道：写成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷 + 向导闸随新档态（**免二跳重调**）；填 key 经 `provider:verify` 真调一次；**闸 = `configured`**（档存在性——向导不进 / 设置面可进 + 明示不可读；零静默重置）。
  **容器面（批 9 裁定）**：挂载根 = `index.html` 单容器 `[data-slot="settings"]` 自身（窗口级覆盖层面——设置树 / 向导树**互斥**占槽：`configured` 假 ⇒ 向导树占位；退场 = `clear` 清空容器 ⇒ 主 UI 可用）。
  **退场口径（批 9 补——子节点面 ∥ 属性面）**：退场 = `clear` 清空容器（子节点面）**+ 薄挂载属性应收**——挂载期所加宿主属性须有复位回路；判据 = **退场后宿主属性集 ⊆ 挂载前属性集**（只增不减 ⇒ 判据不达）；**回路已落 · 单源 = `thincoder-desktop/renderer/views/settings.mjs` `syncHostProps`**（复位表 = `root` → 上次薄挂载所落属性名集 · 未再声明者摘除 · 骨架属性零动）——三挂载共用（设置 / 向导 / 信息行）。
  `removeAttribute` 两命中 = `thincoder-desktop/renderer/views/chat.mjs:227`（`data-streaming` 摘除）+ `thincoder-desktop/renderer/views/settings.mjs:281`（复位表摘除）；**长驻两面** = `thincoder-desktop/renderer/views/{chat,activity}.mjs`（:134 / :167）**无复位回路 ⇒ 码面池**（属性名集常量〔`chromeProps` 四名 · 池树两名〕⇒ 跨重绘不增 ⇒ 现值零残留）。

- **用户块（可见面修复批修 · 写者与出泡时刻 —— #458；「回合中插入」批扩写者）**：活流 `user` 块两写者 = **发送面**（`msg:send` 回执 `ok` 真——直发径）+ **排队消费回执**（`ev:queue.delivered`——步边界注入 ∕ 回合尾送达两时刻；裁决与边界 = `docs/desktop/design/PROJECT.md` §2 KD-23 / KD-40）+ **键门**（回执键 = 现刻 `activeSession`，非活动 ⇒ 零写；
  **在飞回合内切回** ⇒ 本回合用户块随回合尾落盘后、于下次页读在场——页读 = `thincoder-desktop/src/main/session-slots.mjs:123` / `:145`；槽落盘在回合尾 = `thincoder-desktop/src/main/agent-host.mjs:214` / `:219`）；
  块形 = `{ kind: "user", text, ts? }`（**与 `blockOfMessage` 回放块同形**——无 `id` ⇒ 键域回落位序，同回放；`ts` = 提交 ∕ 入队现刻——「对齐第二批」项 4 载波，非有限数 ⇒ 键缺席）·
  写入走 `appendBlock`（**既有**纯动作——`thincoder-desktop/renderer/store.mjs:73` 导出，归约面 `thincoder-desktop/renderer/events.mjs:21` / `:97` / `:105` / `:220` 四处已消费；`pendingNew` 语义同源）· 十八条通道零 `user` 通道（写入时刻 = 受理时刻 ⇒ 活流块 ⟺ 已受理）。
- **流式游标清点（可见面修复批修 —— #459）**：清点两族 = ① 回合尾三径（`done` / `stopped` ∨ `ev:error`）② **段界**（`ev:tool-call` 入场 ⇒ 助手文本段收束）；
  清点**须落块面引用**（新块对象 ⇒ `blocks` 键变 ⇒ 帧触发 ⇒ 就地更新摘 `data-streaming` 锚——旁路态无刷新路径 = 缺陷成因面）· 辅助与两族调用点住归约面（`thincoder-desktop/renderer/events.mjs`）· 游标语义 = **末块追加态**（形态单源 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 3 · 裁决 = `docs/desktop/design/PROJECT.md` §2 KD-24）。
- **文本段行形态通则（可见面修复批修 —— #460）**：行内 ≥2 文本段（flex 行：`gap` ∨ `space-between`）⇒ **逐段包元素**（`span[data-seg="<段码>"]`；段缺席 ⇒ 零节点——空段仍占 flex 项 ⇒ 假间隔）；
  **裸串不得直作 flex 行子**（相邻文本节点合为单一匿名项 ⇒ `gap` / `space-between` 静默失效）；逐处段码与取舍 = `docs/desktop/design/UI.md` §1「本批注（可见面修复 · 五件）」项 4。

## 2. 有界渲染窗口

- **MAX_RENDER_BLOCKS = 200**：只渲染尾部窗口，更早块折**「摘要块」**（可一键回填，回填后仍守窗口）；**不做虚拟化**（DOM 块数有界即达标——虚拟化不列入本版）。
- **窗限增量**：窗限 = 视图侧计数（初值 200）——回填收束沿（无在途 ⇒ 页并入）⇒ 限 + **本页归约后实际块数**（页量 = 核 `historyWindow` 缺省 200 **条**——**条 ≠ 块**，渲染面不写死页量），以宽窗容纳并入的更早页；未渲染更早块数落根锚 `data-hidden`（判据函数 = `nextWindow`——落点 = `thincoder-desktop/renderer/views/chat-scroll.mjs`）。`hasOlder ∧ data-hidden === 0` ⇒ 零摘要块（回填只经滚顶触发）。
- **运行期块记账（「对齐第二批」项 5 · 判据）**：运行期块（`kind === "subagent"`——归档入流块）计入块序 / `data-blocks` / 尾窗渲染；**退出尾窗 ⇒ 不计入 `data-hidden`**（该账面 = 页读域可回填块数——运行期块非落盘件，回填无源）；退窗运行期块**即弃**（不落摘要块 / 不成回填对象）；⇒ 摘要块判据（`hidden > 0`）与回填触发（`hasOlder`）不受运行期块扰动——回填耗尽 ⇒ `data-hidden` 归零 ⇒ 零摘要块。
- **窗口对齐步（非重挂帧帧尾固定步）**：每帧以本帧 `visible`（= 窗出口尾窗）对齐已挂块序 `mounted`（帧层记账——不变式：DOM 块节点序 ≡ 其）——判据纯函数 `alignPlan(mounted, visible, tailExempt)` → `{ evict, prepend, tail, ok }`（落点 = `thincoder-desktop/renderer/views/chat-stream.mjs`）。
- **对齐判据**：重合 = 逐位**引用**等（非键——兜底键 `String(index)` 逐位会漂）；取**最大重合**（`evict` 最小者）；`evict` = 摘去 DOM 头部枚数、`prepend` = 头部前插枚数（插点 = 块序首，摘要块之后）；**尾位豁免**（`tailExempt` = `patch` 档 ⇒ 尾位不入重合判、不入余段，由就地更新承接）；零重合 ⇒ `ok = false` ⇒ 该帧回落全量重挂。
- **对齐步两效果**：饱和追加 ⇒ 摘最旧守窗口（DOM 块数有界）；限增宽窗帧（块面可为零变更——限变而 `blocks` 引用等）⇒ 前插更早页块；对齐步不随块面档位（`history` 帧同走）。
- **DOM ≡ `visible` 不变式**：非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`（逐位引用等）⇒ 根锚 `data-blocks` = `visible.length` = DOM 块节点数；重挂帧由 `mountChat` 按 `visible` 重建（同断言）。

## 3. 回填与跟滚

- 回填 = 滚至顶 **≤ 40px** ∧ 有更早页 ∧ 无在途 ⇒ 取一页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；**条 ≠ 块**），插入后按 `scrollHeight` 增量修 `scrollTop`（视口不跳）——三出口判定与补偿算式 = 纯函数 `scrollAction`（`backfill` / `follow` / `unfollow`）· `compensateTop`。
- 跟滚 = 近底 **24px** 复跟（判据 `scrollHeight - scrollTop - clientHeight < FOLLOW_PX`——严格小于：恰 24px 不判近底）· 上滚即停跟；**药丸单判据 = `!following`**（「可滚 ∧ 非近底 ⇒ 显」与此**等价**——上滚即停跟；文本两态 = 未读数 > 0 ⇒ `chat.pill.new`（`${n}`），否则 `chat.pill.bottom`）；点击回底复跟；程序化平滑滚动互斥窗 **420ms**（判据 = `smoothWindowOpen(now, lastAt)`）。
- **滚动作落面**（DOM 写面点名）：跟滚追加 ⇒ **瞬时贴底**（写 `scrollTop`——先例 `thincoder-vscode/webview/ui.js:428`）· 药丸回底 ⇒ **程序化平滑**（`scrollTo({ top: scrollHeight, behavior: "smooth" })` + 记 `lastAt`）· `scroll` 订阅先过 `smoothWindowOpen(now, lastAt)` 门——**窗内不派发**（该判据真 ⇒ 窗已过期、可派发；程序化平滑的滚动回波不算用户动作）。
- **帧尾滚动作（补偿消费点）**：非重挂帧末尾 `settleFrame(root, model, scroll, align, tier)`（落点 = `thincoder-desktop/renderer/views/chat.mjs` · `paintChat` 调用）——六步序 = ① 挂尾段（**先于读数**）② 读数 `t0` ③ `syncChrome` ④ 头动作（摘 `evict` + 前插 `prepend`）⑤ 读数 `t1` ⑥ 写（下两条）。
- **尾段挂载（第 ① 步）**：`align.tail` 逐枚挂（插点单源 = §1.1 插入点纪律）；`patch` 档 ⇒ 就地更新尾块（文本 + `data-streaming` 锚），尾段 ∅；`none` 档 ⇒ 尾段 ∅。
- **帧尾三写（第 ⑥ 步）**：帧后跟滚 ⇒ `stickToBottom`（瞬时贴底——写 `scrollTop`，幂等）；非跟滚 ∧ `evict + prepend > 0` ⇒ `compensate`（`compensateTop` 算式——`prevTop` = `t0.scrollTop`、`prevHeight` = `t0.scrollHeight`、`nextHeight` = `t1`）；其余 ⇒ **零写**。
- **补偿单权源**：`.flow` 置 `overflow-anchor: none`（`chat.css` 面）——头侧变更的视口锚定只由 `compensate` 显式承担，免浏览器自动锚定叠算。
- **读数区间记账**：区间 = [`t0`, `t1`] 跨头侧变更（摘 / 插 + 摘要块在场与文本）；尾侧（尾段挂载 / 就地更新 / 药丸——单行 `nowrap` 定高，`chat.css`）在区间外或零高度增量 ⇒ ΔH = `t1 - t0` = 头侧净增量。
- **瞬时写不记窗**：`lastAt` 只由程序化平滑（`returnToBottom`）记；`stickToBottom` / `compensate` 不记 `lastAt`——其滚动回波读数即真态（同值 `setFollowing` 归原态）。

## 4. 范本借用清单（实现工艺面）

清单前言（落形列 = 单源 · 全项只用浏览器原生能力 ⇒ **零框架零构建**（`docs/desktop/design/PROJECT.md` §2 KD-4）成立 · 证据级别两档 · 计数）住 `docs/desktop/design/UI.md` §3——本表不重复。

| # | 借用项 | 本端落形（本档 §2 / §3 规则行） | 来源坐标 | 级别 |
|---|---|---|---|---|
| 1 | 跟滚状态机 | 近底 24px 复跟 · 上滚即停跟（§3） | `thincoder-vscode/webview/ui.js:460-468`（`_pinBottom` 判定 `< 24`） | 本仓实读 |
| 2 | 新消息药丸 + 平滑互斥 | `!following` ⇒ 药丸（文本两态 = 未读数 / 无未读）· 点击回底复跟 · 420ms 平滑窗互斥（§3） | kimi-web `ConversationPane.vue`（419 状态机 · 501 平滑互斥 420ms · 1503-1512 药丸元素） | 外部转引 |
| 3 | 回填触发与补偿 | 顶 ≤ 40px ∧ hasOlder ∧ 无在途 ⇒ 取更早页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；条 ≠ 块）；按 `scrollHeight` 增量修 `scrollTop`（§3） | `thincoder-vscode/webview/history.js:79-88`（触发 + 防重入；先例阈值 40px）· `:57-61`（插入 + 高度补偿） | 本仓实读 |
| 4 | 首屏（补行） | 首屏页 = 追加 + 回底；恢复出的非空首屏先摘空态页，不残留（规则落点 = 本表本行）；页应用口径 = 非空首屏摘空态页 + 块面整置 + 回底（`following = true` / `pendingNew = 0`；块归约单源 = `thincoder-desktop/renderer/events.mjs`） | `thincoder-vscode/webview/history.js:43-46`（空态页摘除）· `:62-65`（追加 + 回底） | 本仓实读 |
| 5 | 有界渲染（不虚拟化） | 窗口 200 块 + 更早折「摘要块」（§2） | `thincoder-vscode/src/extension/history-window.mjs:12`（窗口算法 = 核单源转口）· kimi-web `ConversationPane.vue`（75 惰性页 prop） | 本仓实读 + 外部转引 |
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
