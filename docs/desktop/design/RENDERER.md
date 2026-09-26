# 桌面端（DESKTOP）· 渲染面实现工艺

> 板块 = **桌面端渲染面（前端）实现工艺**——零框架 DOM 层 · 单状态树 `store` · 渲染粒度与流式缝合 · 有界渲染窗口 · 回填与跟滚。
> 需求侧 = `docs/desktop/requirements/PROJECT.md`（§4 功能点 D1–D12 · §7 验收 A1–A4 · §8 依赖面 P1–P4）。
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
| 接线形通则 | handlers 给 ⇒ 落 `onClick` 且**无** `disabled`；缺省 ⇒ `disabled: true` + `data-action`（**诚实非死控**——树形只随 handlers 变） | 本档 §1.1 |
| 单状态树 | `store.mjs` 单状态树 + 订阅（会话 / 标签页 / 活动池 / 待审批 / 设置 / 项目级信息——批 9 增两切片），由 IPC 事件驱动 | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/IPC.md` §1 |
| 渲染粒度 · 流式缝合 | `chat-stream.mjs` 按块更新、不整段重画（token / 推理块 / 工具卡增量） | `docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/PROJECT.md` §4.1 |
| 设置面 / 向导（批 9） | 两形构树（`thincoder-desktop/renderer/views/settings.mjs` / `thincoder-desktop/renderer/views/onboarding.mjs`）+ 薄挂载出档（`thincoder-desktop/renderer/mount-settings.mjs`）；**零新事件通道**（请求通道）；向导闸 = `config:read` 回执 `configured` | 本档 §1.1 · `docs/desktop/design/UI.md` §1 设置面 / 首启向导行 |
| 有界渲染窗口 | 见本档 §2 | 本档 |
| 回填与跟滚 | 见本档 §3 | 本档 |

### 1.1 视图面形态：纯描述符 + 薄挂载

- **两层分家**：视图档（`thincoder-desktop/renderer/views/*.mjs`）分两层 —— ① **纯构树**（`xxxModel(state)` → 态对象；`xxxTree(model)` → **结构描述符树**）；② **薄挂载**（`mountXxx(root, state)` = `clear` + `build` + `append`——**建树面单点**）。视图档 **DOM 触面四处** = 建树（本条）· 接线（下条）· 帧尾态刷（`syncChrome`——本档 §1.1）· 帧尾滚动作（`settleFrame`——本档 §3）。
- **接线面（第二形）**：事件 / 状态机型视图档（如滚动面）以 **`attachXxx(root, deps)`** 落形——`deps` = 出口回调集（`on*` 键：回填 / 复跟 / 停跟）+ **只读口** `guards?()`（缺 ⇒ 恒假），程序化滚动作经返回 handle 出（不占 `deps` 键）；阈值常量与事件订阅（`scroll` 用 `passive`）收口于该档（常量单源声明 = 档头）；判定与算式一律纯函数（`scrollAction` / `compensateTop` / `nextWindow` / `smoothWindowOpen`）。
- **接线面依赖面（测试缝）**：`attachXxx` 的 DOM 依赖 = root 三读数（`scrollTop` / `scrollHeight` / `clientHeight`）+ `addEventListener` / `scrollTo` ⇒ **假 root 可注入**（接线面入自动面：直调出口 + 断言 store 读数）；**真实事件触发（用户真滚）仍归人工走查**。
- **事件归约面（批 8 落）**：`ev:*` 九通道 → 切片写者**单源** = `thincoder-desktop/renderer/events.mjs`——`reduce(state, ev)` 纯函数（零 DOM ⇒ 平 node 直测）+ `applyPage(state, receipt)`（页回执 → 首屏 / 回填两径）+ `blockOfMessage(msg)`（核 message → 块五型：用户 / 助手 / 推理 / 工具 / 错误）；
  订阅接线拆出 `thincoder-desktop/renderer/events-subscribe.mjs`——`attachEvents({ on, store, invoke })`（九通道订阅 · 退订句柄在场 · 回合尾标题刷新）· 单向依赖归约档（无环）。
  写者与读者键面同源 = `key`（`docs/desktop/design/IPC.md` §1 会话键面）。
- **池切片清点口径（批 8 落）**：池条目入池 = `ev:tool-call`（开始）、`ev:tool-result` 只收束 `status`——**清点 = 全量在场**（收束不摘除 ⇒ 长会话池切片单调增长）；**窗限 / 归档 = open**（登记 = `docs/desktop/design/PROJECT.md` §10 · `docs/desktop/design/UI.md` §2 项 1）。
- **回填接线口径（接线态）**：`onBackfill` 出口与只读口 `guards()` 两读数**同刻接线**——`hasOlder` 源 = `history.hasOlder`（页回执落态）· `inFlight` = 回填在途（`beginBackfill` / `endBackfill` 置清）；触发三步判据 = 本档 §3；摘要块在场仍以 `data-hidden` 为判据（`guards` 不参与树形）。
- **描述符规格**：`{ tag, props, children }` —— `tag` 必填；`props` = 属性 / 事件（`on*` 键 = 监听器；`true` = 布林属性；`false` / `null` / `undefined` = 不落）；`children` = 子描述符 / 裸串（裸串 = 文本节点；`null` = 空位跳过）。**唯一构造点** = `thincoder-desktop/renderer/dom.mjs` 的 `build(node)`（递归；入参面与同档 `el()` 同形）。
- **接线形通则**：视图档收 handlers 面的控制项**两态落形**——handlers 给 ⇒ 落 `onClick`（携带本项键）、**不落** `disabled`；缺省 ⇒ `disabled: true` + `data-action` 机读锚（**诚实非死控**：不落假接线、不留死控件）——树形**只随 handlers 变**，不随状态另定形。关闭确认面 = 树面关闭控件**原位换两键**（形态单源 = `docs/desktop/design/UI.md` §1 交互行）。
- **判据面**：纯构树**零 DOM** ⇒ 视图行为可在平 node 直测（断言描述符树：机器读面用 `data-*` 承载，不依赖 DOM 实现）；挂载函数不进自动面（DOM 面随人工走查）。
- **文案纪律**：视图档内面向用户字符串**一律经 `t()`**（词表面）——档内零硬编码文案（含英文；机检面 = 词表键哨兵 / 源扫描）。
- **帧面分派（判据面）**：块面比较对 = 两帧 **`state.blocks`**（全列表引用 + 逐位元素引用）——非模型窗列表（窗列表每帧新数组 ∧ 饱和追加时位移 ⇒ 每 token 全量重挂）；四档判据 = `streamDelta`、分派纯函数 = `paintPlan({ prev, next, changedKeys })` → `{ tier, index, remount, refresh }`（平 node 直测）。
- **全量重挂键 = `activeSession` / `locale`**：两键变 ⇒ 无条件全量重挂；其余键不重挂——`mountChat` 的 `clear` 清宿主 ⇒ 滚动位置归零（停跟翻转时重挂 = 把用户拽回顶部）。
- **帧尾态刷（刷新面单点）**：每帧末尾一处 `syncChrome(root, model)`（`chat.mjs` DOM 面 · 幂等 · 与档位解耦——`none` 帧同刷，`refresh` 恒真 = 无帧豁免）⇒ 根锚四（语义单源 = 本档 §2 / `docs/desktop/design/UI.md` §1 对话流行）+ 两控件（摘要块 `hidden > 0` · 药丸 `!following`）在场与文本随判据；`none` 态零节点化不破（只摘不插）。
- **插入点纪律**：块节点插入点 = **首个 `[data-card="approval"]` 之前**（卡缺席 ⇒ `[data-pill]` 之前；两者皆缺席 ⇒ 末位）——根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]。
- **卡面在场与随动（帧尾态刷 · 本批）**：卡节点 `[data-card="approval"]` 的在场与文本随帧内审批判据刷（形态单源 = `docs/desktop/design/UI.md` §1 审批呈现行）；卡 = **非块节点** ⇒ 不入块序不变式（本档 §2），块面比较对与 `data-blocks` 语义不受其影响。
- **设置面与向导形（批 9 落）**：两形构树（`thincoder-desktop/renderer/views/settings.mjs` 四段面〔渠道 / 模型与档位 / agent 参数 / MCP〕· `thincoder-desktop/renderer/views/onboarding.mjs` 三步向导——纯描述符 + 薄挂载，形态单源 = `docs/desktop/design/UI.md` §1）· 接线出档 = `thincoder-desktop/renderer/mount-settings.mjs`（自 `app.mjs` 拆出）；
  **零新事件通道**——读数 / 写入全走请求通道：写成功**同回带** `{ locale, dict, configured }` ⇒ `initDict` 重刷 + 向导闸随新档态（**免二跳重调**）；填 key 经 `provider:verify` 真调一次；**闸 = `configured`**（档存在性——向导不进 / 设置面可进 + 明示不可读；零静默重置）。
  **容器面（批 9 裁定）**：挂载根 = `index.html` 单容器 `[data-slot="settings"]` 自身（窗口级覆盖层面——设置树 / 向导树**互斥**占槽：`configured` 假 ⇒ 向导树占位；退场 = `clear` 清空容器 ⇒ 主 UI 可用）。
  **退场口径（批 9 补——子节点面 ∥ 属性面）**：退场 = `clear` 清空容器（子节点面）**+ 薄挂载属性应收**——挂载期所加宿主属性须有复位回路；判据 = **退场后宿主属性集 ⊆ 挂载前属性集**（只增不减 ⇒ 判据不达）；**回路已落 · 单源 = `thincoder-desktop/renderer/views/settings.mjs` `syncHostProps`**（复位表 = `root` → 上次薄挂载所落属性名集 · 未再声明者摘除 · 骨架属性零动）——三挂载共用（设置 / 向导 / 信息行）。
  `removeAttribute` 两命中 = `thincoder-desktop/renderer/views/chat.mjs:227`（`data-streaming` 摘除）+ `thincoder-desktop/renderer/views/settings.mjs:281`（复位表摘除）；**长驻两面** = `thincoder-desktop/renderer/views/{chat,activity}.mjs`（:134 / :167）**无复位回路 ⇒ 码面池**（属性名集常量〔`chromeProps` 四名 · 池树两名〕⇒ 跨重绘不增 ⇒ 现值零残留）。

## 2. 有界渲染窗口

- **MAX_RENDER_BLOCKS = 200**：只渲染尾部窗口，更早块折**「摘要块」**（可一键回填，回填后仍守窗口）；**不做虚拟化**（DOM 块数有界即达标——虚拟化不列入本版）。
- **窗限增量**：窗限 = 视图侧计数（初值 200）——回填收束沿（无在途 ⇒ 页并入）⇒ 限 + **本页归约后实际块数**（页量 = 核 `historyWindow` 缺省 200 **条**——**条 ≠ 块**，渲染面不写死页量），以宽窗容纳并入的更早页；未渲染更早块数落根锚 `data-hidden`（判据函数 = `nextWindow`——落点 = `thincoder-desktop/renderer/views/chat-scroll.mjs`）。`hasOlder ∧ data-hidden === 0` ⇒ 零摘要块（回填只经滚顶触发）。
- **窗口对齐步（非重挂帧帧尾固定步）**：每帧以本帧 `visible`（= 窗出口尾窗）对齐已挂块序 `mounted`（帧层记账——不变式：DOM 块节点序 ≡ 其）——判据纯函数 `alignPlan(mounted, visible, tailExempt)` → `{ evict, prepend, tail, ok }`（落点 = `thincoder-desktop/renderer/views/chat-stream.mjs`）。
- **对齐判据**：重合 = 逐位**引用**等（非键——兜底键 `String(index)` 逐位会漂）；取**最大重合**（`evict` 最小者）；`evict` = 摘去 DOM 头部枚数、`prepend` = 头部前插枚数（插点 = 块序首，摘要块之后）；**尾位豁免**（`tailExempt` = `patch` 档 ⇒ 尾位不入重合判、不入余段，由就地更新承接）；零重合 ⇒ `ok = false` ⇒ 该帧回落全量重挂。
- **对齐步两效果**：饱和追加 ⇒ 摘最旧守窗口（DOM 块数有界）；限增宽窗帧（块面可为零变更——限变而 `blocks` 引用等）⇒ 前插更早页块；对齐步不随块面档位（`history` 帧同走）。
- **DOM ≡ `visible` 不变式**：非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`（逐位引用等）⇒ 根锚 `data-blocks` = `visible.length` = DOM 块节点数；重挂帧由 `mountChat` 按 `visible` 重建（同断言）。

## 3. 回填与跟滚

- 回填 = 滚至顶 **≤ 48px** ∧ 有更早页 ∧ 无在途 ⇒ 取一页（页量 = 核 `historyWindow` 缺省 200 条——渲染面不写死页量；**条 ≠ 块**），插入后按 `scrollHeight` 增量修 `scrollTop`（视口不跳）——三出口判定与补偿算式 = 纯函数 `scrollAction`（`backfill` / `follow` / `unfollow`）· `compensateTop`。
- 跟滚 = 近底 **24px** 复跟（判据 `scrollHeight - scrollTop - clientHeight <= FOLLOW_PX`）· 上滚即停跟；**药丸单判据 = `!following`**（「可滚 ∧ 非近底 ⇒ 显」与此**等价**——上滚即停跟；文本两态 = 未读数 > 0 ⇒ `chat.pill.new`（`${n}`），否则 `chat.pill.bottom`）；点击回底复跟；程序化平滑滚动互斥窗 **420ms**（判据 = `smoothWindowOpen(now, lastAt)`）。
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
| 3 | 回填触发与补偿 | 顶 ≤ 48px ∧ hasOlder ∧ 无在途 ⇒ 取更早页（100 块）；按 `scrollHeight` 增量修 `scrollTop`（§3） | `thincoder-vscode/webview/history.js:79-88`（触发 + 防重入；先例阈值 40px）· `:57-61`（插入 + 高度补偿） | 本仓实读 |
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
