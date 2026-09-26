# 2026-09-26 · 桌面端实施批 6（对话流 + 工具卡）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-25 22:17「你直接自己跑完吧」（授权与自缚条件见批 3 档 §1.11）——父侧自推：批 5（会话族通道 + 接线）收口 ⇒ 批 6 = 对话流 + 工具卡（视图面）。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 6 段）。前情 = docs/batches/2026-09-26-desktop-impl-5.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 22:17「**你直接自己跑完吧**」（授权射程与自缚条件 = 批 3 档 §1.11）——父侧自推：批 5（会话族通道 + 左列 / 标签条接线）收口 ⇒ **批 6 = 对话流 + 工具卡（视图面）**。

### 1.2 本批交付目标

1. **对话流视图**（设计面 = `docs/desktop/design/UI.md` 对话流行 + `docs/desktop/design/RENDERER.md` §1.1）：消息行 / 流段 / 尾随（跟底）/ 回底行为——三档契约（model / tree / mount）逐段落。
2. **工具卡**（形态按 `UI.md` 工具卡锚）：工具调用 / 结果的卡面（**含折叠态若设计已定**）。
3. **store 消息面接线**（批 2 已落 API 消费：`visibleWindow` 尾 limit 块 / `beginBackfill` / `endBackfill` / 停跟 ⇒ `pendingNew` / 回底 ⇒ 复跟清零——视图侧接线，**不改 store 语义**）。
4. **挂载与装配**（`renderer/app.mjs` 增 `paintXxx` 槽 + 会话区落点；`index.html` 槽位按设计现状）。

### 1.3 判据（机器可核 · 待 §2 细化）

① 对话流三态 / 段结构**脱 DOM 可机检**；② 工具卡（含折叠）树面机检；③ 尾随 / 回底 / 停跟的**纯函数面**行为（视图侧读数）；④ 词表键齐（零硬编码）；⑤ **零回归**（51 例不红 · 新增全绿 · 三包增量零（基线相对形）· doc-check 失败行集合无新增）；⑥ 形态沿 `docs/desktop/design/RENDERER.md` §1.1。

### 1.4 边界（本批不含）

**agent 装配 / 值面供给**（`agent-host.mjs`——消息数据供给未落 ⇒ 视图按**契约 + 零节点**落，**禁假数据**）· 活动池 · **审批卡**（归属若设计锚定他批 ⟹ 不含）· 设置 / 首启向导 · 打包分发 · 主题切换面。

### 1.5 已知事实 / 依赖 / 条件触发

- 批 5 已收口（**51/51** · 冒烟 `boot:"ok"` · 白名单九项 · 全交互接线）。
- **store 消息面 API 已就绪**（批 2 落 · 用例 U29–U31 锁）：`visibleWindow`（尾 limit 块 · 引用等值）· `beginBackfill` / `endBackfill`（卫兵 + 收束）· 停跟 ⇒ `pendingNew` 累加 / 回底 ⇒ 复跟清零。
- 设计锚：`docs/desktop/design/UI.md` 对话流 / 工具卡行 · `docs/desktop/design/SHELL.md` §1 `views/` 档集（`chat.mjs` · `chat-stream.mjs` · `chat-scroll.mjs`）· `docs/desktop/design/PROJECT.md` §4.1（各行预算）· 需求档 §3.1 / §3.2。
- **台账 #407 条件触发**：若本批触碰 `thincoder-desktop/test/views-tabbar.test.mjs` ⇒ 须执行其二次拆分；本批预期新增视图档 ⇒ 测试面落点由 §2 定（**新档优先**，`views.test.mjs` 现 200 行、新增量大时避越 300 层）。
- 台账 #396 / #397 / #401 / #406 不阻塞本批；#403（冒烟环境坑）沿用。

### 1.6 设计轮裁定 + 上抛处置（父侧 · 2026-09-26 01:44）

- **闸面归口裁定 = 收**（设计轮送裁）：判据⑤ 读作「**本批新增 / 改动行零悬空、零新增超宽**」——`docs/core` / `docs/vsc` 的既有红（**悬空 4 + 行宽 18**）**不卡本批**（与前批同律：全仓归零属两面板独立批次，其债在册）。
- **上抛处置（P-1…P-6 全收）**：
  - **P-1**（工具卡行缺耗时）⇒ **已就地落** ✓（`UI.md:22` 补耗时 = `ev:tool-result` 载荷）。
  - **P-2**（位标面三处指针归**值面**轮）· **P-3**（`HISTORY_PAGE=100` 视图侧 vs 核 `HISTORY_PAGE_SIZE=200` 默认值 · 核收参 ⇒ **非冲突**）· **P-4**（值面批面）· **P-5**（清单列序各保在册序，不趁机重排）· **P-6**（真回路归人工走查）⇒ 登记在案，各按其所。
- **评审**：设计评审**已发**（#64）——通过后逐条裁定 → 修复轮（如需）→ **§4 代签** → 实施。

### 1.7 首轮评审裁定 + 修复轮（父侧 · 2026-09-26 01:49）

- **#64 = pass**（🔴 0 / 🟡 7 / 🔵 4）——**十一条全收** ⇒ 修复轮 **#65**（§2.11 形态 · 逐号 1–11 · 修后为准）。
- **承重项口径**：
  1. **窗口切片出口**：按实读形 `const { visible, hidden } = visibleWindow(state.blocks, limit)`——删二次算式与 `hidden` 双口径（口径单源 = store）。
  2. **限值入参**：`chatModel(state, limit)`（缺省 = `MAX_RENDER_BLOCKS`）或并入 model 入参对象；U58 / U65 入参行写明。
  3. **`streamDelta` 出口形**钉死（`{ kind, index }` 形）⇒ U66 的 `index` 断言有唯一解释。
  4. **U67 测试缝**声明（假 root 三读数 + `addEventListener`，或抽纯分派函数单测）。
  5. **DOM 滚动作落面**：点名（跟滚追加 ⇒ 贴底 / 药丸回底 ⇒ `scrollTop` / 节流判据 = `smoothWindowOpen`）**或**按 `nextWindow` 先例写入 §2.7 边界（本批只落纯函数面 · DOM 动作归人工走查）——二择一。
  6. **`data-block-id` 兜底**：定义键形（如 `String(index)`）+ 用例断言，**或**声明 `id` 必给并删兜底句。
  7. **§2.3 陈旧计数**（「产品面 +2 行 · 测试面 +2 行」）⇒ 删（正范面不留失效计数；收正过程留 §2.10 记录面）。
  8. `PROJECT.md:229` 指针计数随动（UI.md §1 17 行 / 合计 19 行）。
  9. 根锚全量（`data-blocks` / `data-following` + `data-blocks` 语义）登记进形态档。
  10. U51 断言集新形（20 宿主键 + 5 核状态键）+ U60 状态词三词（`queued` / `stopped` / `approval`）覆盖或归属注。
  11. 文件行 `+x −y` 字形口径明示（符号面豁免 或 字形面承载）。
- **排程**：修复轮落 → 父侧核验 → **§4 代签** → 实施。

### 1.8 修复轮后裁定（父侧 · 2026-09-26 02:02）

- **#65 核验 + 两点裁定**：
  1. **N-1（修复轮 1 新发现 · 药丸 / 根锚陈旧）⇒ 裁定 = 落**：`paintChat` 订阅 `CHAT_KEYS` 而 `streamDelta` 只按 `blocks` 引用判定 ⇒ `following` / `pendingNew` 翻转落 `kind=none` ⇒ 零 DOM 动作 ⇒ 药丸两态与四根锚不刷（可见缺陷：**回底后药丸不消**）⇒ 派 **#66**（修复轮 2）落其候选**最小形 R** + 同类兄弟路径自查（键面 / 帧面不另一处）。
  2. **滚动作落形裁定 = 平滑（收其择① · 其自决正确）**：父侧 sketch「瞬时 `scrollTop` + 判据 `smoothWindowOpen`」自相矛盾（瞬时写则 420ms 互斥窗无对象）；`docs/desktop/design/RENDERER.md:41` 正范句 = 程序化平滑滚动互斥窗 ⇒ **药丸回底 = 程序化平滑 + 记 `lastAt`**；**跟滚追加 = 瞬时贴底**（无动画）⇒ `:41` / `:43` / `:56` **不须回改** ✓。
  3. **§2.3 陈旧计数格 = 父侧机械清删**（记录面 append-only 通道不可删 ⇒ 按「失效表达须删」由父侧机械删改 + 标记「父侧直改」）。
- **排程**：#66 落 → 核验 → **§4 代签** → 实施。

### 1.9 修复轮 2 后裁定（父侧 · 2026-09-26 02:13）

- **#66 落定**：N-1 收正形落档（`docs/desktop/design/RENDERER.md:33-36` + §2.12）——**两点自决全收**：① **R 第一支不取 = 正确**（`mountChat` 的 `clear` = `replaceChildren`（`renderer/dom.mjs:34`）⇒ `scrollTop` 归零 ⇒ **停跟时刻重挂 = 把用户拽回顶部** ✗）；② **「摘要块并入刷新面」= 收**（`hidden` 亦可在无块变帧变 ⇒ 同属刷新面；不判越界）✓。
- **N-2（窗口对齐面缺口 · 子代理标 🔴）⇒ 裁定 = 落（取提案 a「窗口对齐步」）**：
  1. **饱和追加**（`blocks.length > 窗限`）：**摘最旧块**（维持 DOM ≡ `visible` 不变式）+ `compensateTop` **消费点**；**拒提案 b**（饱和回落 `reset` ⇒ 丢滚动锚定 · 与 KD-7 同族拒案面）。
  2. **限增宽窗无块变**（`history` 帧）：**前插更早块 + 补偿**规则同段写明（本批 `onBackfill` 缺省 ⇒ 运行期潜在态，规则先立、落点标「回填批接线」）。
  - **理由**：「块数有界」（`RENDERER.md` §2）与 `data-blocks`【已渲染块数】蕴含 DOM ≡ `visible` ⇒ 无逐出规则即不变式破（DOM 无界增长）；且「碰到错结构当场修」优于留债给 agent 批（免二次改动）。
  - 派 **#67**（designer · 修复轮 3 · 单题）。
- **N-3**（§2.11 引 §2.10 坐标 `:299` 实为 `:307`）= 记录面漂移，**不动**（在案）。
- **排程**：#67 落 → 核验 → **§4 代签** → 实施。

### 1.10 实施中裁定：doc-check 跨面连带 3 条（父侧 · 2026-09-26 03:11）

- **情形**：本批新档 `thincoder-desktop/renderer/chat.css` 落盘 ⇒ 仓内 basename `chat.css` **1 → 2** ⇒ doc-check「仓内 basename 唯一」兜底规则失效 ⇒ 实跑 **悬空 4 → 7**（行宽 18 不变）；三条新增全在 `docs/vsc/design/`（`VSC-DEBT.md:302` · `WEBVIEW.md:393` · `:420`），**三档本轮零触碰**。
- **裁定 = 接受并登记、本批不修**（承 §1.6 判据⑤ 读法「**本批新增 / 改动行零新增**」）：三条为**跨面连带**（非本批失败行）；修法（三处指针补**带路径全名** `thincoder-vscode/webview/chat.css`）归 **vsc / doc 侧**（该面并行未提交批在途 ⇒ **不越面改**）。
- **登记**：台账已立行（**归批**触发 · 含根因 = `scripts/doc-check-anchors.mjs:158-173` 兜底启发式在 basename 碰撞后失效）。
- **实施舱处置**：§5 如实披露（3 条原样 + 归口句）；判据⑤ 记「**本批面零新增 ✓ · 跨面连带 3 条已登记**」。

### 1.11 落地核验 + 修正轮（父侧 · 2026-09-26 03:22）

- **交付核验 = 通过**（父侧亲跑）：`npm test` ⇒ **tests 61 · pass 61 · fail 0**（U58–U67 全绿 · U51 = 20 键 + **六视图档零 CJK** · U52 = **四槽**接线结构）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:15`；`renderer/views/chat-stream.mjs`（77 行）逐行实读 = 设计 + 三轮修复落形（`blockKey` 单源 · `{kind,index}` 四档 · `alignPlan` 最大重合 / `evict` 最小 / 尾位豁免 · `paintPlan` 重挂键收窄 `activeSession` / `locale` + `refresh` 恒真）✓。
- **表外档裁定 = 收**：`renderer/views/chat-tool.mjs`（新 **123** 行）= §2.13 的**条件授权落形**（`chat.mjs` 越层再启拆分 ⇒ 实读组合 351 > 300）✓ 披露在案；随动面入修正轮。
- **修正轮 #69 已派**（设计档随动五组：新档行 / 树 · **实读回填（含 U-4）** · U51 括注 · `RENDERER.md:26` 措辞 + `deps.guards` + 两字段裁定落文 · §2.14 记账）；**依 #404 纪律：修正轮落地核验 ⇒ 才 close**。
- **跨面连带 3 条**（§1.10）= 台账 **#408**（vsc / doc 侧）；`PROJECT.md` 预算回填 = **U-4** 随修正轮。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-26（修正轮 #69 · §2.14 收正 · 修后为准）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批覆盖（条目表）

| # | 条目 | 需求 / 上溯回指 | 本批形态 |
|---|---|---|---|
| E-1 | 对话流视图三档 | 批档 §1.2 项 1 · 需求 §3.1 对话流（`docs/desktop/requirements/PROJECT.md:50`）· §4 D3（同档 `:82`） | 新档 `thincoder-desktop/renderer/views/chat.mjs`：三态（`none` / `empty` / `flow`）+ 根锚（`data-state` / `data-blocks` / `data-hidden` / `data-following`）+ 五型块构树 + 挂载（mounted 根 = 滚动容器 `[data-slot="flow"]` 自身） |
| E-2 | 工具卡 | 批档 §1.2 项 2 · 需求 §3.1 工具卡（`requirements/PROJECT.md:50`） | 工具块卡面：头行（状态锚 + 名称 + 参数摘要 + 状态词 + 耗时）+ 改动摘要行（降级阈值单源 = `docs/desktop/design/UI.md` §1 工具卡行）+ 可展开结果区（默认 `error` 展开，显式 `expanded` 优先） |
| E-3 | 错误卡 | 需求 §3.1 错误卡 + §4 D3「错误与耗时」（`requirements/PROJECT.md:50` / `:82`）· `docs/desktop/design/IPC.md` §1 `ev:error`（`:21`） | 块型第五值 `error`＝回合级错误卡（文本 + 状态词取核 `sub.error`）；工具级错误 = 工具块 `status="error"`（同卡面状态词，零第二卡面） |
| E-4 | 流式增量面 | 批档 §1.2 项 1 · 判据 ① | 新档 `renderer/views/chat-stream.mjs`：`streamDelta(prev, next)` 四档（`none` / `append` / `patch` / `reset`）——只改尾块，不整段重画 |
| E-5 | 滚动面（窗口 / 回填 / 跟滚） | 批档 §1.2 项 1 · 判据 ③ · `docs/desktop/design/RENDERER.md` §2 / §3 | 新档 `renderer/views/chat-scroll.mjs`：五常量单源 + `scrollAction` / `compensateTop` / `nextWindow` / `smoothWindowOpen` 四纯函数 + `attachScroll(root, deps)` 接线面（RENDERER.md §1.1 第二形） |
| E-6 | store 消息面接线 | 批档 §1.2 项 3 · §1.5 批 2 API（U29–U31） | 视图侧消费 `visibleWindow` / `beginBackfill` / `endBackfill` / `setFollowing` / `returnToBottom` 五 API + 五键（`blocks` / `history` / `following` / `pendingNew` / `activeSession`）——**`store.mjs` 零改动**（188 行零 diff） |
| E-7 | 挂载与装配 | 批档 §1.2 项 4 | `renderer/app.mjs` 增 `FLOW_SLOT` + `CHAT_KEYS` + `paintChat` + 订阅分流；接线 2 处（药丸回底 / 工具卡 toggle）；回填控件**未接线**（`history:page` 不在白名单 ⇒ `disabled` + `data-action`，诚实非死控）；`index.html` 增一条 `<link>`（样式分档，见 §2.2（i）） |
| E-8 | 词表 6 键 | 判据 ④ | `renderer/i18n.mjs` 宿主键 14 → **20**（两语同增）；**状态词 6 词零新键**（核投影 `sub.*` 5 + 复用 `tab.badge.approval`） |
| E-9 | 测试面 | 判据 ① ② ⑤ | 两新档 `test/views-chat.test.mjs`（U58–U62）+ `test/views-chat-scroll.test.mjs`（U63–U67）；`test/files.mjs` 八档 → **十档**（随两档创建同刻落）；U51 原址更新（14 → 20 键 + 对话流树入量 + 三档零 CJK 扫描） |
| E-10 | 零回归 | 判据 ⑤ | 51 例不红 → 本批后 **61** 例；核 / CLI / 扩展三包增量零；`doc-check` 失败行集合无新增 |

**本批不含**（沿批档 §1.2 未列 / §1.4 边界）：agent 装配与值面供给 · 活动池 · 审批卡 · 输入 / 发送 / 中断（composer 面）· 位标面（运行 / 待审批）· 虚拟化 · 外部查看器 · 主题切换面 · 打包分发。逐条见 §2.7。

### 2.2 逐面契约（机制设计）

**（a）对话流三档 · 三态 · 根锚**（`thincoder-desktop/renderer/views/chat.mjs`，0 → ~260）

三档沿 `docs/desktop/design/RENDERER.md` §1.1：`chatModel(state)` → `chatTree(model, handlers)` → `mountChat(root, state, handlers)`（纯构树零 DOM——机检面；DOM 只住 mount）。

- **三态**（判据 = `data-state`）：`activeSession == null` ⇒ `none`（零节点——**禁假数据**，沿批档 §1.4）；有活动会话 ∧ `blocks.length === 0` ⇒ `empty`（落提示节点，词面 `chat.empty.hint`）；否则 ⇒ `flow`。
- **根锚**（挂载根 = `[data-slot="flow"]` 自身，见 §2.6 KD-1）：`data-state` · `data-blocks`（块数）· `data-hidden`（未渲染的更早块数）· `data-following`（`state.following` ⇒ `"1"` / `"0"`）。
- **模型形**：`{ state, blocks, hidden, following, pendingNew, hasOlder, inFlight, locale }`——`blocks` = 该帧应渲染块序列 = `visibleWindow(state.blocks, renderLimit)`（限值住挂载闭包，§2.2（e）`nextWindow`）；`hidden` = `max(0, state.blocks.length - renderLimit)`；`hasOlder` / `inFlight` = `state.history` 两键直取（`renderer/store.mjs:33`）。

**（b）块契约**（五型闭集 · 每块 `data-block-id` + `data-block-kind`）

| 字段 | 类型 | 落面 |
|---|---|---|
| `id` | string | 块标识（`data-block-id` 锚 = 增量缝合键与 toggle 键；缺 ⇒ 以位序兜底，见 §2.4 U58） |
| `kind` | `"user"` / `"assistant"` / `"reasoning"` / `"tool"` / `"error"` | 五值闭集（第五值 = §2.6 KD-2） |
| `text` | string | 文本载荷（`user` / `assistant` / `reasoning` / `error` 四型用） |
| `streaming` | boolean? | 仅 `assistant`：流式中 ⇒ 落 `data-streaming="1"` + 尾随游标（`chat.css` 一条 `::after`，字形 = `▌`，取既有主题变量） |
| `name` / `argsSummary` / `status` / `result` / `changes` / `durationMs` / `expanded` | — | 仅 `tool`：见（c） |

块序 = `blocks` 数组序，**单一序列**（无左 / 右分组容器——用户块与助手块靠 `kind` 分区样式）。文本节点为纯文本（`white-space: pre-wrap`，渲染面零 Markdown / 零 HTML 注入）。`reasoning` 块 = 常显（不可折叠——折叠归后续批，§2.7）。

**（c）工具卡落形**（`tool` 块 · 三行结构）

- **头行**（`[data-tool-head]`）：`data-status`（值域 = 状态词码 `queued` / `running` / `approval` / `done` / `stopped` / `error`）+ 名称（`name`，数据串）+ 参数摘要（`argsSummary`，数据串）+ 状态词（词面 = 核投影 `sub.<status>`，`approval` ⇒ 宿主键 `tab.badge.approval`）+ 耗时（词面 `chat.tool.duration`，`${seconds}` = `(durationMs / 1000).toFixed(1)`；**仅 `status ∈ {done, error}` ∧ `durationMs` 为数时落**——运行中 / 排队 / 待审批零耗时节点）。
- **改动摘要行**（`[data-tool-changes]`，`changes.items[]` 非空时落）：`files` = `items.length` · `add` = Σ`insertions` · `del` = Σ`deletions` ⇒ 词面 `chat.tool.changes`（`${files}` / `${add}` / `${del}`）。**降级判据**（单源 = `UI.md` §1 工具卡行）：`add + del > 200 ∨ files > 10` ⇒ **只留摘要行**（零 `[data-file]` 子节点）；否则摘要行 + 每条 `[data-file]` 行（`path` + `+x −y`）。
- **可展开结果区**（`[data-tool-result]`）：`result` 非空 ∧ 展开态 ⇒ 落文本节点；`result` 空 ⇒ **头为纯展示行**（零 toggle 控件——诚实非死控）。
- **展开态判据**：`expanded === true / false` 显式优先；缺省 ⇒ `status === "error"` 展开、其余折叠（§2.6 KD-3）。
- **toggle 接线**：handlers 给 ⇒ 落 `onClick`（无 `disabled`）；缺 ⇒ `disabled: true` + `data-action="chat:tool-toggle"`（沿批 5 接线形通则）。
- **toggle 纯函数** `toggleExpanded(blocks, id)`：命中 ⇒ 新数组（该块 `expanded` 翻转）；未命中 / 无变化 ⇒ **原引用**（沿 store 三纯动作纪律）。

**（d）流式增量面**（`renderer/views/chat-stream.mjs`，0 → ~110）

`streamDelta(prev, next)`（两块数组入参，引用比较）→ 四档：

| 档 | 判据 | 消费面 |
|---|---|---|
| `none` | 长度等 ∧ 逐位引用等 | 零 DOM 动作 |
| `append` | `next.length === prev.length + 1` ∧ 前 n 位引用全等 | 增量挂一个块节点（末位）+ 滚动作（跟滚 / 计新消息） |
| `patch` | 长度等 ∧ 仅末位引用不等 ∧ 末位 `id` 等 | 就地更新尾块（文本 + `data-streaming` 锚） |
| `reset` | 其余（含切换会话 / 词表置位 / 回填并入前部） | 全量 `mountChat`（挂载根不清宿主 ⇒ 滚动位置由 `compensateTop` 决定） |

**只改尾块**：`patch` 与 `append` 皆不触碰非尾块节点（DOM 增量面的机检判据 = U66）。

**（e）滚动面**（`renderer/views/chat-scroll.mjs`，0 → ~150）

常量单源（本档一处定义，别处只引用）：`FOLLOW_PX = 24` · `BACKFILL_PX = 48` · `SMOOTH_MS = 420` · `MAX_RENDER_BLOCKS = 200` · `HISTORY_PAGE = 100`。

| 纯函数 | 入参 | 出口 / 判据 |
|---|---|---|
| `scrollAction(metrics, { hasOlder, inFlight })` | `metrics = { scrollTop, scrollHeight, clientHeight }` | `"backfill"`（`scrollTop <= BACKFILL_PX` ∧ `hasOlder` ∧ `!inFlight`）· `"follow"`（`scrollHeight - scrollTop - clientHeight <= FOLLOW_PX`）· `"unfollow"`（其余）。序 = backfill 先判（顶端优先），follow 后判 |
| `compensateTop({ prevTop, prevHeight, nextHeight })` | 回填前后的 `scrollTop` / `scrollHeight` | 新 `scrollTop` = `prevTop + (nextHeight - prevHeight)`（视口锚定——用户正看的块不动） |
| `nextWindow({ limit, inFlight }, nextInFlight)` | 视图侧窗限 + 收束沿 | `inFlight && !nextInFlight` ⇒ `limit + HISTORY_PAGE`；否则原值（回填页并入 `blocks` 前部后加宽窗） |
| `smoothWindowOpen(now, lastAt)` | 两时间戳 | `now - lastAt >= SMOOTH_MS`（平滑窗口节流判据） |

`attachScroll(root, deps)` = **接线面**（RENDERER.md §1.1 第二形，本批立）：`root` = 滚动容器（`[data-slot="flow"]`）；`deps = { onBackfill, onFollow, onUnfollow, onReturn }`。落面 = `scroll` 事件（`passive`）⇒ 取 `metrics` ⇒ `scrollAction` ⇒ 调对应出口；`onBackfill` 出口内消费 `beginBackfill` / `endBackfill` 守卫（`store.mjs:60` / `:66`），`onFollow` / `onUnfollow` ⇒ `setFollowing`（`:72`），`onReturn` ⇒ `returnToBottom`（`:77`）。本批 `onBackfill` **不给**（`history:page` 不在白名单九项——`src/preload/preload.cjs:10`）⇒ 滚顶只到纯函数面，通道批再接。

**摘要块**（根首子，条件 = `hidden > 0`）：`[data-summary]` = 文本节点（词面 `chat.summary.older`，`${n}` = `hidden`）+ 回填控件（handlers 给 ⇒ `onClick`，缺 ⇒ `disabled: true` + `data-action="chat:backfill"`）。角例：`hasOlder ∧ hidden === 0`（已载块全渲染、盘上仍有更早）⇒ **零摘要块**（回填只经滚顶触发——决策行，见 §2.6 KD-5）。

**药丸**（`[data-pill]`，sticky 尾随）：判据 = `!following`（单元素两态，§2.6 KD-4）；文本 = `pendingNew > 0` ⇒ `chat.pill.new`（`${n}`）否则 `chat.pill.bottom`；点击 = `returnToBottom`（本批接线第 1 处）。

**（f）store 消费面**（`renderer/store.mjs` **零改动**——188 行零 diff）

| 消费名 | 坐标 | 用法 |
|---|---|---|
| `visibleWindow(blocks, limit)` | `store.mjs:53` | 渲染窗（尾 limit 块） |
| `beginBackfill(state, { page })` / `endBackfill(state)` | `store.mjs:60` / `:66` | 回填卫兵与收束（本批只接守卫面，通道未落） |
| `setFollowing(state, following)` | `store.mjs:72` | 停跟 / 复跟（`scrollAction` 两出口） |
| `returnToBottom(state)` | `store.mjs:77` | 药丸回底（复跟清零） |
| 键 `activeSession` / `blocks` / `history` / `following` / `pendingNew` | `store.mjs:28` / `:32` / `:33` / `:34` / `:35` | 三态判据 · 窗口源 · `hasOlder` / `inFlight` · 药丸判据 · 药丸文本 |

`appendBlock`（`store.mjs:44`）**不在视图消费面**——块写入属值面供给（本批排除）。

**（g）挂载与装配**（`renderer/app.mjs`，实读 209 → ~255）

- 槽常量 `FLOW_SLOT = '[data-slot="flow"]'`（骨架 = `renderer/index.html:27`，位在册）；
- 重挂切片 `CHAT_KEYS = ["activeSession", "blocks", "history", "following", "pendingNew", "locale"]`（`locale` 在内：文案随词表 ⇒ 树须重绘——沿 `RAIL_KEYS`（`:30`）纪律）；
- `paintChat(state)` = 持上一帧 `blocks` 引用 ⇒ `streamDelta` ⇒ 增量三出口 / `reset` ⇒ `mountChat`；首绘与 `reset` 皆 `mountChat`；
- 订阅分流（沿 `:207` / `:208` 两行同形增一行）：`changedKeys.some(k => CHAT_KEYS.includes(k))` ⇒ `paintChat(state)`；
- 接线 2 处：药丸回底 ⇒ `store.set(returnToBottom(store.get()))`；工具卡 toggle ⇒ `store.set({ blocks: toggleExpanded(store.get().blocks, id) })`（**store 语义零改动**——纯 `set` 数据面）；
- 装配一次：`attachScroll(document.querySelector(FLOW_SLOT), deps)`（`onBackfill` 缺省）。

**（h）词表面**（`renderer/i18n.mjs`，实读 102 → ~112；宿主键 14 → 20，两语同增）

| 键 | en | zh | 消费面 |
|---|---|---|---|
| `chat.empty.hint` | `No messages in this session yet` | `本会话暂无消息` | 空态提示节点（(a)） |
| `chat.pill.new` | `${n} new` | `${n} 条新消息` | 药丸（`pendingNew > 0`） |
| `chat.pill.bottom` | `Back to latest` | `回到最新` | 药丸（`pendingNew === 0`） |
| `chat.summary.older` | `${n} earlier messages` | `更早的 ${n} 条` | 摘要块文本 |
| `chat.tool.changes` | `${files} files · +${add} −${del}` | `${files} 个文件 · +${add} −${del}` | 改动摘要行 |
| `chat.tool.duration` | `${seconds}s` | `${seconds} 秒` | 头行耗时 |

插值 = 核同形 `${name}`（`i18n.mjs:90-95`），缺参原样保留。**状态词 6 词零新键**：`sub.queued` / `sub.running` / `sub.stopped` / `sub.done` / `sub.error`（核 `thincoder-core/i18n.mjs:50-54`）+ `tab.badge.approval`（`i18n.mjs:30` / `:46`）——单源不复制。

**（i）样式面**（新档 `renderer/chat.css`，0 → ~55 + `index.html` 一行）

`.flow` **已是滚动容器**（`renderer/styles.css:86-93`：`flex: 1` / `min-height: 0` / `overflow: auto`）⇒ 滚动行为零 CSS 新增；`chat.css` 只管块 / 卡 / 药丸 / 摘要的外观（块间距与 `pre-wrap` · 用户块与助手块分区 · 推理块降调 · 卡三行 · 状态色 · 药丸 sticky · 摘要降调 · 流式游标）。`index.html:11` 之后增一条 `<link rel="stylesheet" href="./chat.css" />`（载入序在 `styles.css` 之后——主题变量住 `styles.css`；CSP `style-src 'self'`（`index.html:7`）已允）。**不并入 `styles.css`**：实读 284 贴 300 拆分层，并入必越层（§2.6 KD-6）。

### 2.3 受影响文件与设计档落点（实读 → 预估；口径 = 内容行数 · 文末换行不计）

**产品面（渲染面 —— 本批零主进程 / 零预载改动）**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/chat.mjs`（新增） | 0 | ~260 | 三档 + 三态 + 根锚 + 五型块构树 + 工具卡三行 + 摘要块 + 药丸 + `toggleExpanded` |
| `thincoder-desktop/renderer/views/chat-stream.mjs`（新增） | 0 | ~110 | `streamDelta` 四档 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs`（新增） | 0 | ~150 | 五常量 + 四纯函数 + `attachScroll` 接线面 |
| `thincoder-desktop/renderer/chat.css`（新增） | 0 | ~55 | 对话流块 / 工具卡 / 药丸 / 摘要样式 |
| `thincoder-desktop/renderer/app.mjs` | 209 | ~255 | `FLOW_SLOT` + `CHAT_KEYS` + `paintChat` + 订阅分流一行 + 接线 2 处 + `attachScroll` 装配 |
| `thincoder-desktop/renderer/i18n.mjs` | 102 | ~112 | 宿主键 14 → 20（两语） |
| `thincoder-desktop/renderer/index.html` | 37 | 38 | 增一条 `<link>`（槽位零改动——`data-slot="flow"` 位在册 `:27`） |
| `thincoder-desktop/renderer/styles.css` | 284 | 284 | **零改动** |
| `thincoder-desktop/renderer/store.mjs` | 188 | 188 | **零改动** |

三新档皆 ≪ 300（行宽 500 硬限）：`chat.mjs` ~260 贴 300 层——**拆分预案**：超 300 ⇒ 工具卡面（工具块构树 + `toggleExpanded`）拆 `renderer/views/chat-tool.mjs`（SHELL.md §1 树随动）。

**测试面**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/test/views-chat.test.mjs`（新增） | 0 | ~200 | U58–U62（树面：三态 / 块序 / 工具卡 / 折叠 / 词表面） |
| `thincoder-desktop/test/views-chat-scroll.test.mjs`（新增） | 0 | ~150 | U63–U67（纯函数面：滚动 / 补偿 / 窗 / 增量 / 摘要与药丸） |
| `thincoder-desktop/test/views-chrome.test.mjs` | 213 | ~235 | U51 原址更新（14 → 20 键 · 对话流树入量 · 三档零 CJK 扫描） |
| `thincoder-desktop/test/files.mjs` | 6 | 8 | 清单八档 → 十档（**须与两档创建同刻落**——清单↔盘上两向自检） |
| `thincoder-desktop/test/views-tabbar.test.mjs` | 329 | 329 | **零触碰**（在册例外 · 台账 #407 条件触发不触发） |
| `thincoder-desktop/test/views.test.mjs` | 200 | 200 | 零改动 |

**设计档落点**

| 档 | 改动 |
|---|---|
| `docs/desktop/design/UI.md` | 对话流行（三态 / 根锚 / 摘要 / 药丸落形）+ 工具卡行（**补耗时** + 折叠默认态 + 降级阈值引用）+ 变更记录 |
| `docs/desktop/design/RENDERER.md` | §1.1 增**第二形「接线面」** + §2 窗口限增量（`nextWindow`）+ §3 药丸单判据与等价句（消张力）+ §4 行 2 / 行 6 措辞 + 变更记录 |
| `docs/desktop/design/PROJECT.md` | §4.1 产品面 +1 新行（`chat.css`）+ 3 行说明随动 · 三档行预算回填（`chat.mjs` 260 / `chat-stream.mjs` 110 / `chat-scroll.mjs` 150 沿在册）+ 用例模块行（八档 → 十档）+ 变更记录 |
| `docs/desktop/design/SHELL.md` | §1 树（`renderer/` 行加 `chat.css` · 用例模块八档 → 十档）+ 变更记录 |

### 2.4 用例表（U58 起续号——实读在册最大 = U57（`test/session-contract.test.mjs`）；判据形态沿 RENDERER.md §1.1——纯构树零 DOM，平 `node` 直测）

| 用例 | 场景 | 输入 | 预期输出 | 落档 |
|---|---|---|---|---|
| U58 | 三态与根锚 | `chatModel` / `chatTree`：无活动会话 · 有会话零块 · 有块三组入参 | `data-state` = `none` / `empty` / `flow`；`none` ⇒ **零节点**；`empty` ⇒ 提示节点文本 = `chat.empty.hint` 词表值；`flow` ⇒ `data-blocks` = 块数 ∧ 根锚 `data-hidden` / `data-following` 齐 | `test/views-chat.test.mjs` |
| U59 | 块五型与块序 | 含五型各一（含 `assistant.streaming`）的块序列 | 每块 `data-block-id` + `data-block-kind` 与入参逐位同序；`streaming` ⇒ `data-streaming="1"`；文本节点为原样文本（无 HTML / Markdown 转换） | 同上 |
| U60 | 工具卡三行与降级 | 五组工具块：`done` + 改动（未越阈）· `done` + 越阈（`add+del > 200` ∨ `files > 10`）· `result` 空 · `status="error"` · `status="running"` | 头行 `data-status` + 名称 + 参数摘要 + 状态词 = 核词表值；耗时节点仅 `done` / `error` ∧ 数时落（值 = `(ms/1000).toFixed(1)` 入词）；未越阈 ⇒ 摘要行 + 每文件 `[data-file]`，越阈 ⇒ 只摘要行 ∧ 零 `[data-file]`；`result` 空 ⇒ 零 toggle 控件 | 同上 |
| U61 | 折叠默认态与 toggle | 五组块（显式 `expanded` 真 / 假 · 缺省 + `error` · 缺省 + `done` · 无结果）+ `toggleExpanded(blocks, id)` 三组（命中 / 未命中 / 无变化） | 展开判据 = 显式优先，缺省 ⇒ `error` 展开 / 其余折叠；`toggleExpanded` 命中 ⇒ 翻转，未命中 / 无变化 ⇒ **原引用** | 同上 |
| U62 | 接线形与词表面 | `chatTree(model, handlers)` 给 / 缺 handlers（药丸 · toggle · 回填三控） | 给 ⇒ 落 `onClick` ∧ 无 `disabled`；缺 ⇒ `disabled: true` ∧ `data-action` = `chat:backfill` / `chat:tool-toggle`；药丸文本两态 = `pendingNew` 判据 | 同上 |
| U63 | 滚动三出口 | `scrollAction` 入参矩阵（触顶 ∧ `hasOlder` ∧ `!inFlight` · 触顶 ∧ `inFlight` · 触顶 ∧ `!hasOlder` · 近底（`<= FOLLOW_PX`）· 中段） | 依次 ⇒ `backfill` / `follow`（触顶不满足 ⇒ 落底判）/ `follow` / `follow` / `unfollow`；边界 = 恰 `FOLLOW_PX` / 恰 `BACKFILL_PX` 皆命中 | `test/views-chat-scroll.test.mjs` |
| U64 | 视口补偿 | `compensateTop`：高增（回填并入）· 高不变 · 高减 | `prevTop + (nextHeight - prevHeight)`；高不变 ⇒ 原值 | 同上 |
| U65 | 窗限与摘要块 | `nextWindow`（收束沿 `inFlight` 真→假 / 假→真 / 恒假）+ 模型 `hidden` 三档（0 · 正 · 超窗） | 收束沿 ⇒ `+ HISTORY_PAGE`，其余原值；`hidden > 0` ⇒ 摘要块在（文本 = `chat.summary.older` 值 ∧ `${n}` = `hidden`），`hidden === 0` ⇒ 零摘要块（含 `hasOlder` 真角例） | 同上 |
| U66 | 流式增量四档 | `streamDelta`：长度等 + 引用全等 · 尾增一（前位引用等）· 长度等 + 仅尾块换引用（`id` 等）· 前部换引用 / 长度减 | `none` / `append`（`index` = 末位）· `patch`（`index` = 末位）· `reset`；`append` / `patch` 皆不触碰非尾块 | 同上 |
| U67 | 跟滚 / 停跟 / 药丸（视图侧读数） | `attachScroll` 的 `scrollAction` 出口 × `following` / `pendingNew` 组合 | `follow` ⇒ `setFollowing(true)` 出口；`unfollow` ⇒ `setFollowing(false)` + 药丸在；`returnToBottom` 出口 ⇒ `following` 复真 ∧ `pendingNew` 清零（全经 store 纯动作，读数 = 状态树） | 同上 |

**原址更新**：U51（`test/views-chrome.test.mjs:106-158`——键数 14 → **20** · 键集两语相等 · 对话流树入量（哨兵消费面）· 零 CJK 扫描清单 `["sessions.mjs", "chrome.mjs"]` → +`chat.mjs` / `chat-stream.mjs` / `chat-scroll.mjs`）。
**清单**：`test/files.mjs` 八档 → 十档。
**用例计数**：51 → **61**（+U58–U67）。

### 2.5 验收对照（对回批档 §1.3 判据）

| 判据 | 落点 | 机检面 |
|---|---|---|
| ① 对话流三态 / 段结构脱 DOM 可机检 | §2.2（a）（b） | U58 · U59（纯构树零 DOM） |
| ② 工具卡（含折叠）树面机检 | §2.2（c） | U60 · U61 · U62 |
| ③ 尾随 / 回底 / 停跟的纯函数面行为 | §2.2（e）（f） | U63 · U64 · U65 · U67（读数 = store 状态树） |
| ④ 词表键齐（零硬编码） | §2.2（h） | U51 原址更新（20 键两语键集相等 + 对话流树哨兵消费面 + 三档零 CJK） |
| ⑤ 零回归 | §2.3 | 61 例全绿（51 存量不红）· 三包增量零（核 / CLI / 扩展零触碰）· `doc-check` 失败行集合无新增 |
| ⑥ 形态沿 RENDERER.md §1.1 | §2.2（a）（d）（e） | 三档形 + §1.1 第二形（接线面）本批落档；U58–U67 的判据形态全部走纯函数面 |

### 2.6 关键决策（本批新增 · 含被否方案）

| # | 决策 | 理由 | 被否方案 |
|---|---|---|---|
| KD-1 | 挂载根 = 滚动容器 `[data-slot="flow"]` **自身**（clear + build + append 不清宿主元素） | `.flow` 已 `overflow: auto`（`styles.css:86-93`）⇒ 滚动位置天然存活；药丸 sticky / 摘要块 / 块序皆其子，零额外层级 | 宿主内再包一层滚动 div——多一层且槽 ↔ 滚容器分离须同步，滚动位置反而不保 |
| KD-2 | 块型**五值**（`user` / `assistant` / `reasoning` / `tool` / `error`） | 需求 §3.1 / D3 明列错误卡 ∧ `IPC.md:21` 分「工具错误 / 回合错误」⇒ 工具错误 = 工具块 `status="error"`，回合错误 = `error` 块；零第二卡面 ∧ 零新词键 | 四值 + 回合错误并入 `assistant`——文本面无判别锚，机检不可分 |
| KD-3 | 工具卡默认态：`error` 展开、其余折叠；显式 `expanded` 优先 | 错误取证优先 ∧ 长会话零噪声；显式字段保住供给面控制权 | 全展开（噪声）/ 全折叠（错误被藏） |
| KD-4 | 药丸 = **单元素两态**（判据 `!following`） | 消 RENDERER.md §3 双判据张力：等价句「可滚 ∧ 非近底」≡「`!following`」（上滚即停跟）⇒ 同义双控件不立 | 两元素（回底键 + 新消息药丸） |
| KD-5 | 窗限 = 视图闭包计数 + `nextWindow` 收束沿（`inFlight` 真→假 ⇒ `+ HISTORY_PAGE`）；摘要块条件 = `hidden > 0`（`hasOlder ∧ hidden === 0` ⇒ 零摘要块） | 视图侧零猜测 store 游标语义（`history.page` 住 store 面）；摘要块的 `n` 与 `hidden` 同源，无第二计数 | 按 `history.page` 派生窗限——游标语义未定，易造第二份口径 |
| KD-6 | 样式分档：新增 `renderer/chat.css` + `index.html` 一条 `<link>` | `styles.css` 实读 284 贴 300 拆分层——并入必越层并触发在册三段拆档预案（与对话流面无因果的搬移面）；分档零搬移、既有 284 行零触碰 | 并入 `styles.css`（越层）/ 拆既有三段（无因果 churn） |
| KD-7 | 流式增量 = 纯函数四档，只改尾块；`reset` ⇒ 全量 | 增量面机检可达（引用比较）；每帧全量重挂的 DOM 抖动与滚动风险不立 | 每帧全量 `mountChat` / 虚拟化（本批不做——§2.7） |
| KD-8 | 状态词 6 词**零新键**（核投影 5 + 复用 `tab.badge.approval`） | 单源 = `thincoder-core/i18n.mjs:50-54` + `renderer/i18n.mjs:30` / `:46`；词面双源即缺陷 | 新造 `chat.status.*` 六键（第二词表源） |

### 2.7 边界（本批不做）

- **值面供给**（`src/main/agent-host.mjs`——消息 / 事件数据未落）：视图按契约 + **零节点**落，**禁假数据**（沿批档 §1.4）。
- **输入 / 发送 / 中断（composer 面）**：批档 §1.2 未列 · `index.html` 无 composer 槽 · `msg:send` / `msg:interrupt` 不在白名单九项（`src/preload/preload.cjs:10`）⇒ 后续批（需求 §3.1 / §3.2 步 1 / D3「可中断」待接）。
- **审批卡**（需求 §3.1 流内嵌）：归审批批（`IPC.md` §1 `ev:approval` 通道批）。
- **位标面（运行 / 待审批）**：源 = 挂起表 / 回合事件 = 值面 ⇒ 本批不含（见 §2.8 P-2）。
- **回填真通道**：`history:page` 不在白名单 ⇒ 本批只到纯函数面 + 守卫消费；真回填随通道批。
- 活动池 · 虚拟化 · 外部查看器 · 主题切换面 · 打包分发 · 推理块折叠 · 会话命中跳转。

### 2.8 上抛项（本批设计面发现 · 全为非阻塞观测）

| # | 发现 | 处置 |
|---|---|---|
| P-1 | `UI.md` §1 工具卡行未列**耗时**，而需求 D3（`requirements/PROJECT.md:82`）与 `IPC.md:17`（`ev:tool-result` = 结果 + 改动摘要 + 耗时）皆有 | 一致性面：本批随动补落 `UI.md` 工具卡行（耗时 + 折叠默认态）；逐条报告 |
| P-2 | 位标面（运行 / 待审批）三处指针（`UI.md` §1 左列会话行尾 · `IPC.md:50` 会话族注 · `renderer/app.mjs:164` 注「位标源随对话流 / 审批批落地」）与本批「对话流（**视图面**）」并存——位标**源**（挂起表 / 回合事件）= 值面，§1.4 已排除 | 本批不含、不改三处指针（其批面归属 = 对话流 / 审批的**值面**轮）；报告面登记待裁 |
| P-3 | 视图批常量 `HISTORY_PAGE = 100` vs 核 `HISTORY_PAGE_SIZE = 200`（`thincoder-core/history-window.mjs:24`） | 非冲突：核 `historyWindow(history, before, pageSize)` **收参**、200 = 首窗默认；两参数两口径——本档已登记，报评审知悉 |
| P-4 | 会话切换时 `blocks` 单序列替换面（清空 / 重建） | 值面批面（本批只消费）；报告面登记 |
| P-5 | `test/files.mjs` 清单列序与 `PROJECT.md` §4.1 用例模块行序不同序 | 历史沿革；本批两向随动时**各保在册序**（不趁机重排） |
| P-6 | 渲染面真回路（滚顶回填 / 药丸跟滚的实际滚动行为） | 归人工走查（宿主内实跑）；自动面只判纯函数与树面 |

### 2.9 三链一致（自检）

- **需求链**：需求 §3.1 对话流（`requirements/PROJECT.md:50`）+ §4 D3（`:82`）→ E-1 / E-2 / E-3（含错误卡与耗时）→ 设计档落点（`UI.md` 对话流 / 工具卡行 + `RENDERER.md` §1.1–§3）。
- **判据链**：批档 §1.3 ①–⑥ ↔ E-1–E-10 ↔ §2.5 逐行 ↔ U58–U67 + U51 原址更新（每条判据至少一条机检用例，无判据悬空）。
- **用例链**：在册 51 例 + U58–U67 = **61**；续号自 U57（实读最大）起，无跳号 / 无重号；`test/files.mjs` 十档与两新档同刻落。

### 2.10 收正与闸态（写档后自检 · 2026-09-26）

- 实读复核：`store.mjs`（188 · 五 API + 五键坐标逐条实读）· `app.mjs`（209 · 槽常量 / 切片 / 订阅分流坐标）· `index.html`（37 · `data-slot="flow"` = `:27` · 单 `<link>` = `:11`）· `i18n.mjs`（102 · 14 键两语）· `styles.css:86-93`（`.flow` = 滚动容器）· `thincoder-core/i18n.mjs:50-54`（状态词 5）· `IPC.md:13-21`（事件表）· `views-chrome.test.mjs:106-158`（U51 原址更新面）。
- 行预算：三新档 ~260 / ~110 / ~150（沿 `PROJECT.md` §4.1 在册行）+ 两测试档 ~200 / ~150 ⇒ 皆 ≪ 300；`chat.mjs` 拆分预案在册（§2.3）。
- 用例号连续（U57 → U58–U67）· 档名 / 锚点 / 通道白名单九项逐条实读（`preload.cjs:10`）。
- 本批**零产品码改动**（设计轮）：闸态（`node test/run.mjs` / `doc-check`）留 §6 面读数，本档不作设计面承诺。

**设计档随动落盘（落盘后自检 · 2026-09-26）**

- `docs/desktop/design/UI.md`：§1 表**新增「对话流」行**（原表只于「布局」行提及对话流——本行为新增行，不占既有行位）+ 「工具卡」行改写（补耗时 · 折叠默认态 · 状态锚）+ 变更记录一条。
- `docs/desktop/design/RENDERER.md`：§1.1 增「接线面（第二形）」条 · §2 增「窗限增量」条 · §3 回填 / 跟滚两条补纯函数名与药丸单判据 · §4 行 2 / 行 6 落形随动 + 变更记录一条。
- `docs/desktop/design/PROJECT.md`：§4.1 产品面**+1 新行**（`chat.css` · 拟新增 · ~55）+ 说明随动 3 行（`chat.mjs` / `chat-stream.mjs` / `app.mjs`）+ 用例模块行八 → 十档 + 自动面落点补 U58–U67 + 两注行收正 + 变更记录两条。**口径收正**：§2.3 原记「产品面 +2 行（`chat.css`）」= 含说明随动的计数，实落 = **+1 新行 + 3 说明随动行**。
- `docs/desktop/design/SHELL.md`：§1 树 `renderer/` 静态资源行加 `chat.css` · `test/` 行八 → 十档 + 变更记录一条。
- **一致性面就地修（逐条报告）**：① `PROJECT.md:116`「`styles.css` 284 居产品面顶」失据（`sessions.mjs` 实读 292 > 284）⇒ 收正为「实读 284」（拆分预案保留）；② 同注行「本批即定拆档」= 无日期时限语 ⇒ 改「在册三行」；③ `PROJECT.md:119`「清单八档同步」→ 十档（随用例模块行同步）；④ 本档 §2 内重复状态行（第 39–40 行）已删——状态行单条留骨架行。

**闸态实测读数（设计轮 · 2026-09-26 · 补 §2.10 第 4 条）**

- 实跑 `node scripts/doc-check.mjs`（cwd `thincoder/`）= **FAIL(锚) 4 · FAIL(行宽) 18**——全部落 `docs/core` / `docs/vsc` 既有档（`MODEL-SPECS.md:323 / 1372 / 1465` · `SESSION.md:850` · CORE-UNIFICATION / MODEL-BENCH / VSC-DEBT / WEBVIEW 四档行宽）；**本批所触四档（UI / RENDERER / PROJECT / SHELL）= 0 悬空 · 0 行宽**——两条闸的红与批 6 面无关（归 `docs/core` / `docs/vsc` 面自理）。
- 本批自引入两处，已就地收口：① `RENDERER.md:36` 新档路径 `views/chat-scroll.mjs` 补「（拟新增）」标记（悬空 5 → 4，机检转为「列报 · 不入闸」）；② `PROJECT.md` 自动面落点行（本批补 U58–U67 后 357 字符）与变更记录行（370 字符）超 300 ⇒ 拆行（行宽 20 → 18）。
- 产品面测试 `node test/run.mjs` 未跑（本批零产品码改动——设计轮）；两闸的 §6 面归口与读数登记 = §6。

### 2.11 修复轮 #65（首轮评审 §3 轮次 1 · 十一条全收 · 2026-09-26）

**收正形态（机制约束）**：§2 段 append-only（既有行不改不删 = `batch` 写入工具的段语义）⇒ 收正 = 本追加块 +「**修后为准**」；先例 = §2.10（`:299`）对 §2.3 计数的同形收正；§1.7（`:46`）已定本轮形态 = §2.11。**凡 §2.1–§2.5 与本节冲突处，以本节为准**（若须物理清删旧句，属父侧处置面）。

**逐号处置（1–11 · 号 → 修后形 → 落点）**

| 号 | 修后形（收正后为准） | 落点（收正 / 随动） |
|---|---|---|
| 1 | 模型形按实读写：`const { visible, hidden } = visibleWindow(state.blocks, limit)`（出口两读数单源 = `renderer/store.mjs:53-56`）；`hidden` 的 `max(0, …)` 二次算式作废；`data-blocks` = **已渲染块数**（= `visible.length`）。 | §2.2（a）`:89` / `:90` · §2.2（f）`:147` · U58 `:223`；`UI.md:19` |
| 2 | 限值入参钉死 `chatModel(state, limit = MAX_RENDER_BLOCKS)`（常量单源 = `chat-scroll.mjs` 档头 `:128`，`chat.mjs` 只引用）；限值落 `paintChat` 闭包，沿 `nextWindow` 收束沿更新。 | §2.2（a）`:86` · §2.2（g）`:159` · U58 `:223` / U65 `:230` |
| 3 | `streamDelta` 出口形钉死 = `{ kind, index }`（`index` = 变动块位）：`append` / `patch` ⇒ `next.length - 1`；`none` / `reset` ⇒ `-1`（四档闭集不变）。 | §2.2（d）`:115-124` · U66 `:231` |
| 4 | U67 测试缝 = 接线面 DOM 依赖仅 root 三读数（`scrollTop` / `scrollHeight` / `clientHeight`）+ `addEventListener` / `scrollTo` ⇒ **假 root 可注入**（自动面：直调出口 + 断言 store 读数）；**真实事件触发（用户真滚）归人工走查**（先例 `RENDERER.md:28`）。 | `RENDERER.md:28`（新条）· U67 `:232` |
| 5 | 滚动作落面点名（择「点名」支，不写 §2.7 边界）：跟滚追加 ⇒ **瞬时贴底**（写 `scrollTop`——先例 `thincoder-vscode/webview/ui.js:428`）；药丸回底 ⇒ **程序化平滑** `scrollTo({ top: scrollHeight, behavior: "smooth" })` + 记 `lastAt`（经返回 handle 出，不占 `deps` 键）；`scroll` 订阅门 = `smoothWindowOpen(now, lastAt)` **为假（窗内）⇒ 不派发**；`deps` 收窄 `{ onBackfill?, onFollow, onUnfollow }`。 | `RENDERER.md:27` / `:43` / `:56` · §2.2（e）`:135` / `:137` · §2.2（g）`:162` |

**§2.6 KD-9（本批内续号 · 发现 5 派生的唯一化，非新增面）**：平滑窗语义**单一 = 抑制程序化回波**（窗内零派发）——**不做 pin 门禁、不锁 `following`**；窗内夹带的真用户滚，其停跟判定**延后至窗后首事件**（≤ `SMOOTH_MS` 级，不补偿重放 · **后到者胜**）。理由：窗若兼作门禁 ⇒ 与「点击回底复跟」抢同一状态位（双判据张力复现）；否案 = 窗内锁 `following`（第二状态源）。落点 = 本节 · `RENDERER.md:43`。

**口径说明（父侧择① 的落形收正 · 逐点报明）**：§1.7 第 5 条 sketch 写「药丸回底 ⇒ `scrollTop`」+「节流判据 = `smoothWindowOpen`」——两半不自洽：回底若为**瞬时**写，420ms 窗无对象（纯函数无消费 = 评审发现 5 自身列的悬空复现），且 `RENDERER.md:41` 在册正范句「程序化平滑滚动互斥窗 **420ms**（判据 = `smoothWindowOpen(now, lastAt)`）」失据。⇒ 取**平滑**为唯一自洽落形（窗只掐程序化回波），`:56` §4 行 6「回底**一步到位**」为派生行、随之收正为「程序化平滑 + 记 `lastAt`」；正范句（`:41`）不动。

**设计档随动（本轮实改 · 三档 · 零代码 / 零需求档 / 零他批）**

| 档 | 落点 | 内容 |
|---|---|---|
| `docs/desktop/design/RENDERER.md` | `:27` · `:28` · `:43` · `:56` · `:66` | `deps` 收窄（`onReturn` 出 `deps`、入返回 handle）· 测试缝新条 · 滚动作落面新条（含门读向「真 ⇒ 窗已过期、可派发」）· §4 行 6 收正 · 变更记录一条 |
| `docs/desktop/design/UI.md` | `:19` · `:72` | 对话流行补**根锚全量（四锚语义）**· 变更记录一条 |
| `docs/desktop/design/PROJECT.md` | `:229` · `:279` | §9 指针计数 15 → 17 / 17 → 19 · 变更记录一条 |

**机检（`node scripts/doc-check.mjs` · cwd `thincoder/` · 交付前一次运行）**：FAIL(锚) **4** · FAIL(行宽) **18**——**与基线（§2.10 `:305`）逐行同**：悬空 4 = `MODEL-SPECS.md:323` / `:1372` / `:1465` · `SESSION.md:850`；行宽 18 全落 `docs/core` / `docs/vsc`。**本批三设计档：悬空 0 · 行宽 0**（`docs/desktop` 非表格行 > 300 = 0；13 处超宽全为表格行 = 机检豁免）。新写非表格行实测：`RENDERER.md:27` 272 · `:28` 198 · `:43` 274 · `:56` 170 · `:66` 247 · `UI.md:72` 209 · `PROJECT.md:229` 124 · `:279` 154（最大 274 ≤ 300）。

**上抛（本轮新发现 · 只登记 · 待父侧裁）**

- **N-1（设计面缺口 · 自陈）**：`paintChat` 入盯 `CHAT_KEYS`（`:160`），但 `streamDelta` 只按 `blocks` 引用判定 ⇒ **非 `blocks` 键变动**（`following` / `pendingNew` 翻转）落 `kind = none` ⇒ **零 DOM 动作** ⇒ 药丸两态（`!following`）与根锚 `data-following` / `data-blocks` **陈旧不刷**。候选最小形 R = 非 `blocks` 的 `CHAT_KEYS` 变动 ⇒ 全量 `mountChat` + 增量出口后统一刷根锚（锚刷新单点化）。本轮为修复轮（**禁掺新语义**）⇒ 未落；裁落 ⇒ 追加收正，或入边界 / 下批。

**核对提示（D4）**：§3 轮次 1 引用行号 ≈ 现读 **− 17**（例：U58 记 `:206` / 现读 `:223`；`SMOOTH_MS` 记 `:111` / 现读 `:128`；内容逐条对得上，发现本体不受影响）——本节一律用现读行号。

**自检**：三链一致 = §2 条目集 ↔ 设计档 ↔ 需求档条目（**本轮零条目增减**，只收正形与计数）；写后读回（D6）见下。

**（续 2.11 · 逐号处置 6–11）**——前块表列 1–5，本块列 6–11；两段合读 = §2.11 全表 **1–11**（分次落笔，非编号拆分）。其余段（收正形态 / KD-9 / 口径说明 / 随动表 / 机检 / 上抛 N-1 / 核对提示 / 自检）已在上一块落齐，不重复。

| 号 | 修后形（收正后为准） | 落点（收正 / 随动） |
|---|---|---|
| 6 | `data-block-id` 兜底键形 = 单源函数 `blockKey(block, index) = block.id ?? String(index)`（住 `chat.mjs`；三消费 = 落锚 / 增量缝合键 / `toggleExpanded` 键）；U59 补兜底断言（缺 `id` ⇒ `String(index)`）；U61 补兜底键命中组（三组 → **四组**）；兜底指路「见 §2.4 U58」⇒ **改指 U59**（断言落点）。 | §2.2（b）`:96` · §2.2（c）`:111` · U59 `:224` / U61 `:226` |
| 7 | §2.3 该格「产品面 +2 行 · 测试面 +2 行」**整格作废**：修后为准 = 产品面 **+1 新行 + 3 说明随动行**（§2.10 `:299` 记录面已收）· 测试面 = **两新档**（`views-chat` / `views-chat-scroll`）+ **两改档**（`views-chrome` / `files.mjs`）、**既有档零增行**（`views-tabbar` `:207` / `views.test` `:208` 零触碰）。 | §2.3 落点表 `:216` 该格作废（本节收正）· §2.10 `:299`（记录面） |
| 8 | §9 指针计数随动 ⇒ 形态与交互面 **17 行** / 合计 **19 行**（15 → 17 · 17 → 19）。 | `PROJECT.md:229`（实改）· `:279`（变更记录） |
| 9 | 根锚全量登记 = 四锚语义（`data-state` · `data-blocks` = 已渲染块数 · `data-hidden` = 未渲染更早块数 · `data-following`）入形态档；`data-hidden` **产出规则仍单源**住 `RENDERER.md` §2（只登记语义，不复制机制）。 | `UI.md:19`（实改）· `:72`（变更记录）· §2.2（a）`:89` |
| 10 | 词表机检面收正 ⇒ U51 修后形 = **20 宿主键 + 5 核状态键**（`sub.queued` / `sub.running` / `sub.stopped` / `sub.done` / `sub.error`——`thincoder-core/i18n.mjs:50-54`；消费面断言，非新键）+ 断言集（键数 / 两语键集相等 / 逐键有消费 / 三档零 CJK）；U60 状态组 **五 → 八组**（补 `queued` / `stopped` / `approval`——`approval` 词面 = 宿主键 `tab.badge.approval`）。 | U51 `:234` · U60 `:225` · §2.3 `:205` · §2.5 ④ `:245` |
| 11 | 文件行 `+x −y` 字形口径 = **符号面**（非词表项）：字形住 `chat.css`（`[data-add]::before` = `+` · `[data-del]::before` = `−`——视图档零字形字面，与标签条 / 关闭控件同纪律）；词表键 `chat.tool.changes`（`:172`）内 `+${add} −${del}` **保留**（插值文案 = 词表面单源）；U60 断言改**数节点**（`[data-add]` / `[data-del]` 承载增删数；字形不入断言面）。 | §2.2（c）`:107` · §2.2（h）`:172` / `:177` · U60 `:225` |

**写后读回（D6 · 收口）**

- §2.11 全块现读 = `:309`–`:354`（两段：`:309`–`:343` + `:345`–`:354`）；§2 状态行 = `:62`「设计完成（修复轮 #65 · §2.11 收正 · 逐号 1–11 · 修后为准）」——上块尾句「写后读回（D6）见下」在此收口。
- 三设计档实改行读回（fresh）：`RENDERER.md:27` / `:28` / `:41`（正范句在位未动）/ `:43` / `:56` / `:66` · `UI.md:19` / `:72` · `PROJECT.md:229`（17 / 19 已落）/ `:279`——逐行与本节所述一致。
- 行宽机检域声明：`checkConfig` = `scanDirs: ["docs"]` · `lineWidth: 300` · `anchors.exclude: ["_archive", "batches"]`（`thincoder-core/manifest.mjs:250-253`）⇒ **批档 §2 自身不在行宽 / 锚扫描域**——与本节机检段读数自洽（18 宽行全在 `docs/core` / `docs/vsc`）。

### 2.12 修复轮 #66（N-1 裁定 = 落 · 最小形 R 收正 + 兄弟路径自查 · 2026-09-26）

**口径**：承 `batch` 段 append-only ⇒ 收正 = 本追加块 +「**修后为准**」；**凡 §2.1–§2.11 与本节冲突处，以本节为准**。§1.8（`:64`）第 1 条 = 本轮任务面（N-1 ⇒ 落候选最小形 R + 键面 / 帧面兄弟自查）；§1.8（`:65`）第 2 条（滚动作 = 平滑）前轮已落，本节不动。

#### 落形（五条 · 判据面纯函数 + DOM 面单点）

| # | 落形（修后为准） | 依据（实读坐标） |
|---|---|---|
| 1 | **比较对钉死**：`streamDelta(prev, next)` 两入参 = 两帧 **`state.blocks`**（全列表引用 + 逐位元素引用），**非**模型窗列表（`model.blocks`）；四档判据与出口 `{ kind, index }`（§2.11 第 3 条）不动，树仍按（a）渲窗口。 | 窗列表每帧新数组（`renderer/store.mjs:53-56` 的 `slice`）+ 饱和追加（`blocks.length > 200`）时窗口整体位移 ⇒ 窗列表比对落 `reset` ⇒ 每 token 全量重挂 = 明拒案；`appendBlock` 产 `[...state.blocks, block]`（`store.mjs:47`）⇒ 前缀引用保持 ⇒ 全列表比对下 `append` 恒可测 |
| 2 | **全量重挂键 = `activeSession` / `locale`**（收正候选形 R 第一支「非 `blocks` 键 ⇒ 全量 `mountChat`」⇒ 收窄）：两键变 ⇒ 无条件全量重挂；其余四键（`blocks` / `following` / `pendingNew` / `history`）**不重挂**。 | `mountChat` 对挂载根 `clear` = `replaceChildren`（`renderer/dom.mjs:34`）⇒ 滚动容器 `scrollTop` 归零；`following` 翻转恰在用户上滚（停跟）时 ⇒ 重挂 = 把用户拽回顶部。两键须无条件重挂：三态可翻转（`empty` → `none` 须零节点化，此时 `blocks` 引用可能等 ⇒ 块面判 `none`）∧ 文案随词表（沿 `RAIL_KEYS` 纪律 `renderer/app.mjs:30` 先例） |
| 3 | **帧尾态刷单点** `syncChrome(root, model)`（住 `renderer/views/chat.mjs` DOM 面；每帧末尾一处 · 幂等 · **与档位解耦**）：① 根锚四（`data-state` / `data-blocks` = `model.blocks.length`（已渲染块数）/ `data-hidden` / `data-following`）；② 摘要块（在场 ⟺ `hidden > 0`，文本 = `chat.summary.older`（`${n}` = `hidden`））；③ 药丸（在场 ⟺ `!following`，文本 = `pendingNew > 0` ⇒ `chat.pill.new`（`${n}`）否则 `chat.pill.bottom`）；`none` 态零节点化不破（只摘不插）。 | N-1 本体：`following` / `pendingNew` 翻转落 `kind = none` ⇒ 无块动作 ⇒ 药丸两态与四锚须由帧尾单点刷承担；摘要块同属「模型标量读数 → chrome 节点」面（`hidden` 亦可在无块变的帧变）⇒ 并入本面（沿「键面 / 帧面不另一处」） |
| 4 | **分派纯函数** `paintPlan({ prev, next, changedKeys })` → `{ tier, index, remount, refresh }`（住 `renderer/views/chat-stream.mjs`；`tier` / `index` = `streamDelta(prev.blocks, next.blocks)` 出口；`remount` = 首帧 ∨ 两全量重挂键变；`refresh` = 恒真）；`paintChat` = `paintPlan` ⇒ `remount` ⇒ `mountChat` / 其余 ⇒ 按 `tier` 三出口 ⇒ 帧尾 `syncChrome`。 | 修正须可机检（帧面分派脱 DOM 直测——沿 `RENDERER.md:31` 判据面纪律）；「`refresh` 恒真」= **无帧豁免**的单点表达 |
| 5 | **插入点纪律**：块节点插入点 = `[data-pill]` 之前（药丸缺席 ⇒ 末位）；根子序 = [摘要块?] → 块序列 → [药丸?]。 | 增量挂块与药丸在场性正交（帧尾态刷可在同帧改药丸在场态）⇒ 插点显式化，免实现面把块挂在药丸之后 |

**口径说明（候选形 R 收正 · 逐点报明）**：R 第一支「`CHAT_KEYS` 中非 `blocks` 键变 ⇒ 全量 `mountChat`」**不取**——重挂经 `clear` 清宿主 ⇒ 滚动归零，而 `following` 翻转（用户上滚）正是重挂最伤的场景 ⇒ 收窄为两全量重挂键 + 帧尾态刷承接其余四键；R 第二支「增量出口后统一刷根锚（锚刷新单点化）」**取**（本节第 3 条），并把同类的**摘要块**并入 ⇒ 刷新面完整化（无同类残留）。

#### 逐键清单（`CHAT_KEYS` 六键 × 分派面 —— 兄弟自查 · 键面）

| 键 | 块面（比较对 = `state.blocks`） | 分派结论 |
|---|---|---|
| `blocks` | 四档（`none` / `append` / `patch` / `reset`） | `reset` ⇒ 重挂（重挂后同帧态刷）；`append` / `patch` ⇒ 尾块增量；帧尾态刷 |
| `following` | `none` | 不重挂 ⇒ 帧尾态刷（锚 `data-following` + 药丸在场 / 文本）——**N-1 修复点** |
| `pendingNew` | `none` | 不重挂 ⇒ 帧尾态刷（药丸文本）——**N-1 修复点** |
| `history` | `none` | 不重挂 ⇒ 帧尾态刷（锚 `data-hidden` + 摘要块在场 / 文本）；限增宽窗前插 ⇒ N-2 ②（本批 `onBackfill` 缺省 ⇒ 潜在态） |
| `activeSession` | 三态可翻转（引用可能等） | **全量重挂键**（无条件 `mountChat`） |
| `locale` | `none` | **全量重挂键**（文案随词表 ⇒ 树须重绘） |

#### 帧面自查（兄弟自查 · 帧面）

首帧 + 四档**逐帧末尾**皆态刷（`refresh` 恒真 ⇒ 无档位豁免）；`reset` / 全量键 ⇒ `mountChat`（树已按新模型构建）后同帧态刷（幂等 ⇒ 双刷无害）⇒ 六键 × 五帧（首帧 + 四档）**无豁免组合口**。

#### 落点（收正 / 随动 —— 逐号）

| # | 面 | 修后形 | 落点 |
|---|---|---|---|
| 1 | §2.2（d） | 比较对注（= 两帧 `state.blocks`）；「只改尾块」对饱和追加的边界 ⇒ N-2 ① | 本节第 1 条 |
| 2 | §2.2（g） | 「持上一帧 `blocks` 引用」明示为 `state.blocks` + 分派 / 态刷形 | 本节第 2–4 条 |
| 3 | §2.3 表 | `chat-stream.mjs` 格 += `paintPlan`（~110 → ~125）；`chat.mjs` 格 += `syncChrome`（~260 → ~280）——皆 ≪ 300，拆分预案不动 | 本节第 2 / 3 条 |
| 4 | §2.4 U66 | 入参面 = 两帧 `state.blocks`（补注） | 本节第 1 条 |
| 5 | §2.4 U67 | 补「态刷断言」组（判据面 = `paintPlan`：`following` / `pendingNew` 单变 ⇒ `tier = none` ∧ `remount = false` ∧ `refresh = true`；`activeSession` 单变 ⇒ `remount = true`；首帧 ⇒ `remount = true`）——**零新用例号**（N-1 = 已定行为的判据缺口，非新面 ⇒ 计数 51 → 61 不变；档集十档不变；`views-chat-scroll.test.mjs` 行预算 ~150 为预估层，补组 ~+15 ⇒ ~165，仍 ≪300） | 本节第 4 条 |
| 6 | §2.5 | ⑥ 落点 += §1.1 帧面条（本节第 4 条的判据面） | 本节第 4 条 |
| 7 | 设计档 | `docs/desktop/design/RENDERER.md` §1.1 增四条（帧面分派 / 全量重挂键 / 帧尾态刷 / 插入点纪律）+ 变更记录一行 | 本节第 1–5 条 |

#### 设计档复核（零改结论 · 逐档实读）

| 档 | 结论 |
|---|---|
| `UI.md:19`（对话流行） | **零改**：根锚四 / 摘要块 / 药丸判据 / 词键已在册（§2.11 第 9 条落）；本节只补**刷新时机** = 实现工艺 ⇒ 归 `RENDERER.md` |
| `PROJECT.md` | **零改**：§4.1 行预算为预估层（收口回填面；实落 ~280 / ~125 仍 ≪300）；§9 指针计数无新行 |
| `SHELL.md` | **零改**：零新档（`chat.mjs` / `chat-stream.mjs` / `chat.css` 已在树）；测试档集十档不变 |
| `test/files.mjs` | **零改**：本节点 5 不增档 |
| 需求档（`requirements/`） | **零改**（合规面 · 只看不写）：本批条目 / 判据 / 边界无增删 |

#### 机检（`node scripts/doc-check.mjs` · cwd `thincoder/` · 交付前一次）

`FAIL(锚) 4 · FAIL(行宽) 18`——**与基线同**（全在 `docs/core` / `docs/vsc`；`docs/desktop` 零命中）；新写非表格行宽 = 224 / 117 / 241 / 77（+ 变更记录 298），皆 ≤300。

#### 上抛（本轮新发现 · 只登记 · 待父侧裁）

- **N-2（设计面缺口 · 自陈 · 非本轮引入 · 本轮未落）**：增量档的**窗口对齐面**未定义——① **饱和追加**（`blocks.length > 窗限`）⇒ 窗口须摘最旧块：与 §2.2（d）「只改尾块 / 不触碰非尾块节点」相抵，且 `data-blocks`【已渲染块数】蕴含 DOM 块数 ≡ `visible.length` ⇒ 逐出规则缺位（DOM 无界增长 ⇒ `RENDERER.md` §2「DOM 块数有界即达标」失据）；逐出 / 前插的高度补偿（`compensateTop`）消费点亦缺。② **限增宽窗无块变**（`history` 帧）⇒ 更早块前插缺位——本批 `onBackfill` 缺省（`history:page` 不在白名单）⇒ 潜在态（通道批面）。**提案**（待裁）：`append` 档补「窗口对齐步」（超限 ⇒ 摘最旧 + `compensateTop`）或饱和回落 `reset` 兜底（代价 = 滚动锚定）；与本节第 1 条耦合——若择「窗列表」比较对 ⇒ 边消失但复现每 token 重挂（明拒案）。**修复轮禁掺新语义 ⇒ 未落。**
- **N-3（记录面坐标）**：§2.11 引「§2.10（`:299`）」实指 `:307`（坐标漂移 · 记录面）⇒ 只报不改。

#### 三链一致（自检）

条目链 = E-1–E-10 **零增减**（本节只收正形：帧面分派 / 刷新面——落 §2.2（d）（g）+ U66 / U67；无新条目 / 无新档 / 无新判据）；判据链 = ①–⑥ 不变（U67 补组落 ③ / ⑥）；用例链 = 51 → 61 不变（零新用例号）。

**写后读回（D6）**：`RENDERER.md:33`–`:36` 四条 + `:71` 变更记录一行已逐行读回 ✓；本节 append 后按同法回读。

### 2.13 修复轮 #67（评审 N-2 · 增量档窗口对齐面缺口 · 单题 · 2026-09-26）

**口径**：本节 = **修后为准**面。上溯裁定 = §1.9（`:69-78`）：**取提案 a（窗口对齐步）**；提案 b（饱和回落 `reset` 兜底——丢滚动锚定 · 与 KD-7 同族）**已拒**。范围 = 仅 N-2（单题修复轮 · 不掺新语义）；设计档落点 = `docs/desktop/design/RENDERER.md`（本批唯一可改设计档）；代码 / 需求档 / 他批档零触碰。

#### 落形（设计档实落 · 逐条对应）

**对齐面（`RENDERER.md` §2 · 新增四行）**

| # | 修后落形 | 落点 |
|---|---|---|
| 1 | 窗口对齐步 = **非重挂帧帧尾固定步**（非 `append` 专属）；判据纯函数 `alignPlan(mounted, visible, tailExempt)` → `{ evict, prepend, tail, ok }`——重合 = 逐位**引用**等 · 取最大重合（`evict` 最小）；`evict` = 摘头部枚数 · `prepend` = 头部前插枚数（插点 = 块序首，摘要块之后）· `tail` = 重合段后余段 | `RENDERER.md:42` |
| 2 | 判据与回落地：**尾位豁免**（`tailExempt` = `patch` 档 ⇒ 尾位不入重合判、不入余段——由就地更新承接）；零重合 ⇒ `ok = false` ⇒ 该帧回落全量重挂 | `RENDERER.md:43` |
| 3 | 两效果：饱和追加 ⇒ 摘最旧守窗口（DOM 块数有界）；限增宽窗帧（块面可零变更）⇒ 前插更早页块；**对齐步不随块面档位**（`history` 帧同走） | `RENDERER.md:44` |
| 4 | **DOM ≡ `visible` 不变式**：非重挂帧收尾后 DOM 块节点序 ≡ 帧内 `visible`（逐位引用等）⇒ 根锚 `data-blocks` = `visible.length` = DOM 块节点数；重挂帧由 `mountChat` 按 `visible` 重建（同断言） | `RENDERER.md:45` |

**帧尾消费面（`RENDERER.md` §3 · 新增六行）**

| # | 修后落形 | 落点 |
|---|---|---|
| 5 | 补偿消费点：非重挂帧末尾 `settleFrame(root, model, scroll, align, tier)`（住 `views/chat.mjs` · `paintChat` 调用）——**六步序** = ① 挂尾段（**先于读数**）② 读数 `t0` ③ `syncChrome` ④ 头动作（摘 `evict` + 前插 `prepend`）⑤ 读数 `t1` ⑥ 写 | `RENDERER.md:52` |
| 6 | 尾段挂载（①）：`align.tail` 逐枚挂（插点 = 药丸之前——§1.1 插入点纪律）；`patch` 档 ⇒ 就地更新尾块（文本 + `data-streaming` 锚），尾段 ∅；`none` 档 ⇒ 尾段 ∅ | `RENDERER.md:53` |
| 7 | 帧尾三写（⑥）：帧后跟滚 ⇒ `stickToBottom`（瞬时贴底——写 `scrollTop`，幂等）；非跟滚 ∧ `evict + prepend > 0` ⇒ `compensate`（`prevTop` = `t0.scrollTop` · `prevHeight` = `t0.scrollHeight` · `nextHeight` = `t1`）；其余 ⇒ **零写** | `RENDERER.md:54` |
| 8 | 补偿单权源：`.flow` 置 `overflow-anchor: none`（`chat.css` 面）——头侧变更的视口锚定只由 `compensate` 显式承担（免浏览器自动锚定叠算） | `RENDERER.md:55` |
| 9 | 读数区间记账：区间 = [`t0`, `t1`] 跨头侧变更；尾侧（尾段 / 就地更新 / 药丸——单行 `nowrap` 定高）在区间外或零高度 ⇒ ΔH = `t1 - t0` = 头侧净增量 | `RENDERER.md:56` |
| 10 | 瞬时写不记窗：`lastAt` 只由程序化平滑（`returnToBottom`）记；`stickToBottom` / `compensate` 不记（滚动回波读数即真态） | `RENDERER.md:57` |

#### 逐格收正（批档 §2.2 面 · 原文留档 · 本节为准）

| 格位 | 修后（为准） |
|---|---|
| §2.2（d）· `none` 行消费面 | **零块动作**——块面零变更；窗面对齐步仍走（帧尾固定步：限变 / 位移帧同走） |
| §2.2（d）· `append` 行消费面 | 增量挂一个块节点（末位）+ **窗口对齐步**（饱和追加 ⇒ 摘最旧守窗口）+ **帧尾三写**（跟滚 ⇒ 贴底；非跟滚 ∧ 头动作 > 0 ⇒ 补偿；其余零写） |
| §2.2（d）· `patch` 行消费面 | 就地更新尾块（文本 + `data-streaming` 锚）+ **尾位豁免**（尾位不入重合判 / 不入余段） |
| §2.2（d）· `reset` 行消费面 | **对齐步优先**：`ok` 真 ⇒ 对齐步（摘 / 插）+ 帧尾写；`ok` 假（零重合）⇒ 回落全量重挂——**重挂归零**（`mountChat` 的 `clear` ⇒ 滚动位置归零；恢复面 = 上抛 U-1）。原句「挂载根不清宿主 ⇒ 滚动位置由 `compensateTop` 决定」作废 |
| §2.2（d）· 「只改尾块」句 | **收窄为块面判据**：块面增量只改尾块；对齐步的头侧摘 / 插 = **窗面动作**（mounted 记账面），不受此限——U66 机检面据此分列（块面 / 窗面两组） |
| §2.2（e）· 章末（`attachScroll` 段后） | 增**帧尾消费点**：`compensateTop` 消费点 = `settleFrame` 第 ⑥ 步；`nextWindow` 的宽窗帧前插随对齐步落——`onBackfill` 本批缺省（`:156`）⇒ **规则先立 · 回填批接线**（潜在态） |

#### 落点逐号（号 → 收正位置）

| 号 / 面 | 收正位置 |
|---|---|
| N-2 ⓐ 对齐步（§2 面） | `RENDERER.md:42`–`:45`（§2 +4 行；落形表 1–4） |
| N-2 ⓑ 帧尾消费面（§3 面） | `RENDERER.md:52`–`:57`（§3 +6 行；落形表 5–10） |
| N-2 ⓒ §2.2（d）四行 + 「只改尾块」句 | 本节「逐格收正」表 |
| N-2 ⓓ §2.2（e）帧尾消费点 | 本节「逐格收正」表末行 |
| N-2 ⓔ 用例面（同号补格 · **零新号**） | U66 += 窗面组（重合 / 逐出 / 前插 / `tailExempt` / `ok = false` 回落地）；U67 += 三写组（跟滚 ⇒ 贴底 · 非跟滚 ∧ 头动作 > 0 ⇒ 补偿算式 · 其余零写）——总数仍 **61**（51 → 61 不变） |
| N-2 ⓕ §2.3 行预算 | 见下表（修后为准） |
| N-2 ⓖ §2.3 设计档落点行 | `RENDERER.md` 行改记：§2 对齐面 +4 · §3 帧尾消费面 +6 · 变更记录 +1（余项零动） |
| N-2 ⓗ §2.5 ③ / ⑥ | **判据文本与落点列零改**：窗面 / 帧尾面机检仍走 U66（⑥ 落点 = §2.2（d）修后面）与 U67（③ 机检面在册） |
| 设计档 | `RENDERER.md`：`:42`–`:45` · `:52`–`:57` · `:82` 变更记录——本批**唯一**设计档改动 |

**行预算（修后为准）**

| 文件 | §2.3 表原记 | #66 补记 | **#67 修后** |
|---|---|---|---|
| `renderer/views/chat.mjs` | ~260 | ~280 | **~295**（+`settleFrame` 六步 · 三写接线） |
| `renderer/views/chat-stream.mjs` | ~110 | ~125 | **~145**（+`alignPlan` · 尾位豁免 · 排布） |
| `renderer/views/chat-scroll.mjs` | ~150 | ~150 | **~160**（+`stickToBottom` 贴底出口） |
| `renderer/app.mjs` | ~255 | ~255 | **~263**（+对齐 / 档位穿线） |
| `renderer/chat.css` | ~55 | ~55 | **~57**（+`.flow` `overflow-anchor: none` · 药丸单行 `nowrap`） |
| `test/views-chat-scroll.test.mjs` | ~150 | ~165 | **~215**（U66 / U67 同号补组） |

余行零动（`i18n.mjs` / `index.html` / `styles.css` 284 / `store.mjs` 188 / `views-chat.test.mjs` ~200 / `views-chrome.test.mjs` ~235 / `files.mjs` 十档）。**`chat.mjs` ~295 < 300 ⇒ 拆分预案不触发**（在册不动；交付实读越层再启）。

#### 设计档复核（本轮 · 逐档）

| 档 | 结论 |
|---|---|
| `RENDERER.md` | **改**：§2 +4（`:42`–`:45`）· §3 +6（`:52`–`:57`）· 变更记录 +1（`:82`）——冻结面 `:27` / `:28` / `:33`–`:36` / `:41` **零触碰** |
| `UI.md` | **零改**：窗口对齐 = 实现工艺面（不进 UI 形态行） |
| `PROJECT.md` | **零改（本批禁改）**：§4.1 行预算随动见上抛 U-4 |
| `SHELL.md` | **零改**：零新档（十档不变） |
| 需求档（`requirements/`） | **零改**（合规面 · 只看不写）：本批条目 / 判据 / 边界零增减 |

#### 机检（`node scripts/doc-check.mjs` · cwd `thincoder/` · 交付前一次）

- `FAIL(锚) 4 · FAIL(行宽) 18`——**与基线同数**（§2.10 `:324`）：四锚 = `MODEL-SPECS.md:323 / 1372 / 1465` · `SESSION.md:850`；18 行宽全落 `docs/core` / `docs/vsc`。
- 本批四设计档 = **0 悬空 · 0 行宽**；`RENDERER.md` 新行路径入「拟新增」（不入闸）、符号入「报告面」（不入闸）；新写行最长 = `:52` 242 字符（< 300）✓。
- 观察（归 §6 复核 · 只报不判）：§2.10 `:324` 行宽面列名四档（CORE-UNIFICATION / MODEL-BENCH / VSC-DEBT / WEBVIEW），本次实读含 `MODEL-SPECS.md` 六行 ⇒ 列名与总数 18 不齐（简写或他批在途随动，未判）。

#### 三链一致（自检）

条目链 = E-1–E-10 **零增减**（N-2 = 机制细化，非新条目 / 零新档）；判据链 = ①–⑥ **不变**（窗面机检落 U66 ⑥ 落点面）；用例链 = 51 → **61 不变**（同号补格）；需求档零改。

#### 上抛（本轮 · 只登记 · 待父侧裁）

- **N-2 销项**：本轮已落（提案 a）——§2.12 `:440` 的「本轮未落」以本节为准。
- **U-1（沿册 · 不销项 · 本轮补记）**：重挂归零面（`ok = false` / 重挂帧 ⇒ `mountChat` 的 `clear` ⇒ 滚动位置归零）——`reset` 档收窄后仍在册；恢复面未定。
- **U-2 / U-3（沿册）**：KD-1 张力 · `RENDERER.md:26` 措辞——内容以在册文本为准，本轮不动。
- **N-3（沿册）**：§2.11 引 `:299` 实为 `:307`（记录面坐标）——只报不改。
- **U-4（本轮新增）**：`PROJECT.md` §4.1 行预算（`:97` ~55 · `:102` ~260 · `:103` ~110 · `:104` ~150 · `:278` 同数）与修后预算（~57 / ~295 / ~145 / ~160）不一致——本批**禁改 `PROJECT.md`** ⇒ 交付后按实读回填（父侧排随动；`app.mjs` / 测试档同类若在册同行同法）。

**写后读回（D6）**：`RENDERER.md:42`–`:45` · `:52`–`:57` · `:82` 已逐行读回 ✓（含行宽实读：新行 ≤242）；本节 append 后按同法回读。

### 2.14 实施后修正轮 #69（逐号五组 · 实读回填 + 新档行 + 拆分落形 + 口径收正 · 2026-09-26）

**依据** = §1.11 派单（逐号五组）。本轮 **零代码改动 · 零需求档改动 · UI.md 零改**——写域 = 三档（`docs/desktop/design/PROJECT.md` · `SHELL.md` · `RENDERER.md`）+ 本段。

#### 逐号对账（派单 → 落点 → 状态）

| # | 派单号 | 改动（现行 file:line） | 状态 |
|---|--------|------------------------|------|
| 1 | 组 1a 新档行 | `docs/desktop/design/PROJECT.md:105` 增 `thincoder-desktop/renderer/views/chat-tool.mjs` 行（123 · 工具卡面 = 构树三件 + 折叠纯函数 `toggleExpanded` + 接线两态原语 `wire` / `withKey`） | ✅ |
| 2 | 组 1b 树入档 | `docs/desktop/design/SHELL.md:35` `views/` 行 `chat-scroll.mjs` 后补 `chat-tool.mjs`（同源同值） | ✅ |
| 3 | 组 2 实读回填 | `PROJECT.md:95` 37（去「（拟新增）」） | ✅ |
| 4 | 组 2 | `PROJECT.md:97` 127（去标） | ✅ |
| 5 | 组 2 | `PROJECT.md:98` 271 | ✅ |
| 6 | 组 2 | `PROJECT.md:100` 115 | ✅ |
| 7 | 组 2 | `PROJECT.md:102` 228（去标 + 括注改「流式 / 滚动 / 工具卡**三面**」+ 描述去「+ 工具卡」+ 单源改「§1 对话流行」） | ✅ |
| 8 | 组 2 | `PROJECT.md:103` 77（去标） | ✅ |
| 9 | 组 2 | `PROJECT.md:104` 90（去标） | ✅ |
| 10 | 组 2 | `PROJECT.md:112` `test/files.mjs` 6 → 7 | ✅ |
| 11 | 组 2 | `PROJECT.md:113` 用例模块行 256 / 245 / 278 | ✅ |
| 12 | 组 2 | `PROJECT.md:119` 300 层段 `views-chrome.test.mjs` 213 → 256 | ✅ |
| 13 | 组 3 拆分落形 | `PROJECT.md:117` 删条件式、补**拆分落形**（`chat.mjs` 228 + `chat-tool.mjs` 123 = 351 > 300 ⇒ 工具卡面拆出 · 三面四行） | ✅ |
| 14 | 组 4a 口径收正 | `RENDERER.md:26` 「视图档内唯一触 DOM 处」⇒ **DOM 触面四处**枚举（建树 / 接线 / 帧尾态刷 `syncChrome` / 帧尾滚动作 `settleFrame`） | ✅ |
| 15 | 组 4b 只读口 | `RENDERER.md:27` `deps` 增 `guards?()`（缺 ⇒ 恒假）+ 「DOM 事件订阅」→「事件订阅」 | ✅ |
| 16 | 组 4c 新条 | `RENDERER.md:29` 新增**回填接线口径（本批）**（形 = `{ hasOlder, inFlight }` · 与 `onBackfill` 同刻接线 · 本批零给 ⇒ 恒不派发 · 两字段卫兵消费零） | ✅ |
| 17 | 组 4d 去标 | `RENDERER.md:42` / `:43` / `:53` 三处落点行「（拟新增）」删 | ✅ |
| 18 | 组 5 变更记录 | `PROJECT.md:281` / `:282` · `SHELL.md:95` · `RENDERER.md:84` 各补一行 | ✅ |

**未动行复核**：`PROJECT.md:96`（`styles.css` 284）· `:120`（在册例外）· `:121`–`:122`（拆分预案 `sessions.mjs` 292）——数值经复核无误，不属本轮面。**「（拟新增）」标记收口**：三档规范面现存标记仅属**未落档档**（`electron-builder.yml` · `agent-host.mjs` · `settings.mjs` 两处 · `activity.mjs` · `onboarding.mjs` · `tabbar.mjs` 预案）——已交付**七档**（`index.html` / `chat.css` / `app.mjs` / `i18n.mjs` / `chat.mjs` / `chat-stream.mjs` / `chat-scroll.mjs`）零残留；变更记录行内旧标记按**记录面留档**（先例 = 批 5 修正轮 #62）。

#### 实读表（内容行数 · 文末换行不计 · 本轮实读复验）

| 档 | 实读 | 落点 |
|----|------|------|
| `thincoder-desktop/renderer/index.html` | 37 | PROJECT §4.1 |
| `thincoder-desktop/renderer/chat.css` | 127 | 同上 |
| `thincoder-desktop/renderer/app.mjs` | 271 | 同上 |
| `thincoder-desktop/renderer/i18n.mjs` | 115 | 同上 |
| `thincoder-desktop/renderer/views/chat.mjs` | 228 | 同上 |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | 77 | 同上 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | 90 | 同上 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 123 | 同上（新档行） |
| `thincoder-desktop/test/files.mjs` | 7 | PROJECT §4.1 |
| `thincoder-desktop/test/views-chrome.test.mjs` | 256 | PROJECT §4.1 两处 |
| `thincoder-desktop/test/views-chat.test.mjs` | 245 | PROJECT §4.1 用例行 |
| `thincoder-desktop/test/views-chat-scroll.test.mjs` | 278 | 同上 |

#### 门读数（写档后 · 一次性）

`node scripts/doc-check.mjs`（cwd `thincoder/`）⇒ **FAIL(锚) 7 / FAIL(行宽) 18** ——与在册基线**逐项同值、零新增**；18 条行宽与 7 条锚态**无一条**属本轮三档。本轮新增 / 改动行宽记账（上限 300）：`PROJECT.md` :102 226 · :105 233 · :113 237 · :117 293 · :281 296 · :282 185；`RENDERER.md` :26 297 · :27 296 · :29 202 · :84 252；`SHELL.md` :35 173 · :95 142。**三链一致**：本轮不动条目表（§2.1）· 不动需求档 ⇒ 三链同源不变。

#### 非阻断观察（只报不修 · 三条）

1. **未触碰行实读偏差**（预估 `~N` 与实读不符 · 均 ≪300 且非本轮面 ⇒ 留待触碰批回填）：`src/main/sessions.mjs` ~70/34 · `projects.mjs` ~90/120 · `renderer/dom.mjs` ~120/64 · `views/chrome.mjs` ~130/101 · `scripts/check-dist.mjs` ~90/27 · `test/run.mjs` ~60/41 · `package.json` ~45/20 · `src/main/window.mjs` ~120/130 · `src/main/protocol.mjs` ~60/68。
2. **§5.4-2 记法偏差**：批档 `:658` 记「实读回填（**57** / 228 / 77 / 90）」——`chat.css` 实读 **127**（57 系实施前预估）。记录面 · 非本轮写域 ⇒ 只报（若需收正 = 父侧判）。
3. **U-4 修后预算作废**：修后预算（57 / 295 / 145 / 160）与实读（127 / 228 / 77 / 90）全不符 ⇒ 一切以实读为准（已在档内变更记录与本段落定）。

**本轮收口**：派单 18 项全 ✅（组 1–5 全落 · 零遗留）· 修后为准。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（首轮）· 范围 = 批档 §2（E-1–E-10 / 逐面契约 (a)–(i) / 受影响文件表 / U58–U67 / 验收对照 ①–⑥ / KD-1–KD-8 / 边界 / 上抛 P-1–P-6 / §2.10）↔ 设计锚（`UI.md:19` / `:22` · `RENDERER.md:27` / `:36` · `PROJECT.md` §4.1 · `SHELL.md:30` / `:37`）**

判据降级声明：本仓未声明项目标准档、未发现文档地图 ⇒ 「方法学合规」「文档归属」两项按 Project Guide + 设计档自身分档/单源惯例判读。判据⑧的行数标注已按受影响文件表逐档实读抽查（store 188 · app 209 · i18n 102 · index.html 37 · styles.css 284 · views/sessions.mjs 292 · test/files.mjs 6 · views-chrome.test.mjs 213 · views.test.mjs 200 · views-tabbar.test.mjs 329——全部与设计记值一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Feasibility | 🟡 | 窗口切片出口写成数组：`blocks` = `visibleWindow(state.blocks, renderLimit)`，而实读 API 返回 `{ visible, hidden }`（`thincoder-desktop/renderer/store.mjs:53-56`）；同处 `hidden` 又用 `max(0, state.blocks.length - renderLimit)` 二次算式（`docs/batches/2026-09-26-desktop-impl-6.md:73`），与 store 自算的 `hidden` 在 `limit ≤ 0` / 非整数分支口径不同 —— 与 KD-5「无第二计数」自相违。 | 按实读形写 `const { visible, hidden } = visibleWindow(state.blocks, limit)` 并删二次算式（口径单源 = store）；§2.2（f）注一句限值入参形。 |
| 2 | Clarity | 🟡 | 三档签名给 `chatModel(state)`（`:69`），但 `blocks` / `hidden` 依赖 `renderLimit`，而限值「住挂载闭包」（`:73` · KD-5 `:240`）⇒ 纯构树层取不到限值，U58 / U65 的入参形无从落。 | 钉死限值入参（`chatModel(state, limit)`，缺省 = `MAX_RENDER_BLOCKS`，或并入 model 入参对象）；U58 / U65 入参行随之写明。 |
| 3 | Clarity / Acceptance | 🟡 | `streamDelta` 出口形未钉：四档表只给档名（`:100-105`），U66 却断言 `index` = 末位（`:214`）—— 字符串标签与带 `index` 的对象两读皆通，用例写不出唯一形。 | 明示出口契约（如 `{ kind, index }`），令 U66 的 `index` 断言有唯一解释。 |
| 4 | Acceptance | 🟡 | U67 把 `attachScroll` 事件面纳入自动档（`:215`），但形态档写「事件触发面归人工走查」（`docs/desktop/design/RENDERER.md:27`）·「挂载函数不进自动面」（同档 `:30`）—— 测试缝（假 root 的 `addEventListener` 与三读数来源）未声明。 | 声明测试缝：`attachScroll` 只依赖 root 三读数 + `addEventListener`（可注入假 root），或抽出纯分派函数单测；U67 落该缝。 |
| 5 | Requirements / Clarity | 🟡 | 「回底 / 跟滚」的 DOM 落面缺位：`:124` 与 `:144` 只写药丸点击 ⇒ `store.set(returnToBottom(...))`，`:103` 的 append 只写「滚动作」，装配行（`:145`）亦无滚动作；`SMOOTH_MS = 420` / `smoothWindowOpen`（`:111` / `:118`）在 U58–U67 无用例、在 §2.2（g）无消费点（对比 `nextWindow` 有「本批只到纯函数面」豁免句 `:120`）—— 而 `docs/desktop/design/RENDERER.md:41`（回底复跟 + 420ms 互斥窗）与 `:54`（回底一步到位）是本批落档的正范句。 | 在 §2.2（e）/（g）点名滚动作落面（跟滚追加 ⇒ 贴底；药丸回底 ⇒ 设 `scrollTop`；节流判据 = `smoothWindowOpen`），或按 `nextWindow` 先例显式写入 §2.7 边界（本批只落纯函数面、DOM 动作归人工走查）；取一即消悬空。 |
| 6 | Clarity | 🟡 | `data-block-id` 兜底未定义：「缺 ⇒ 以位序兜底，见 §2.4 U58」（`:79`），但 U58 行（`:206`）无该断言；`id` 同时是增量缝合键与 toggle 键（`:79` · `:94`）—— 兜底键形（串形 / 位序基准）无处可查。 | 定义兜底键形（如 `String(index)`）并在 U59 / U61 断言；或声明 `id` 必给（值面契约）并删兜底句、改指回坐标。 |
| 7 | Doc hygiene | 🟡 | §2.3（正范面）残留已被收正的计数：「§4.1 产品面 **+2 行**（`chat.css`）· 测试面 +2 行」（`:199`）与 §2.10 自陈实落「**+1 新行 + 3 说明随动行**」（`:282`）互斥；实态 = `chat.css` 单行 + `app.mjs` / `chat.mjs` / `chat-stream.mjs` 三行说明随动（`docs/desktop/design/PROJECT.md:97` · `:98` · `:102` · `:103`），测试面未增行。失效计数留正范面 ⇒ 下游按旧数核对。 | 删 §2.3 该格旧计数（改已核实口径或只留「随动」），收正过程留 §2.10（记录面）。 |
| 8 | Doc ownership / Consistency | 🔵 | `docs/desktop/design/PROJECT.md:229` 指针计数「UI.md §1（形态与交互面 15 行）… 合计 17 行」未随本批新增「对话流」行同步：UI.md §1 现为 17 行（`docs/desktop/design/UI.md:13-29`）⇒ 合计应为 19（批 3 增行后该计数已滞后 1）。 | §9 指针行改「17 行 / 合计 19 行」，或改为不计数写法免再滞后。 |
| 9 | Consistency | 🔵 | 根锚登记不全：`data-hidden` 已单源在 `docs/desktop/design/RENDERER.md:36`，而 `data-blocks`（渲染块数 vs 总块数未钉）与 `data-following` 只住批档 `:72`（形态单源 `docs/desktop/design/UI.md:19` 未列）⇒ 机器读面的根锚集无设计档落点。 | 在 UI.md §1 对话流行（或 RENDERER.md §2）登记根锚全量并写明 `data-blocks` 语义（建议 = 已渲染块数，与 `data-hidden` 互补）。 |
| 10 | Acceptance | 🔵 | 词表面机检面随动不全：U51 断言集现为「14 宿主键 + 2 核状态键全被消费」（`thincoder-desktop/test/views-chrome.test.mjs:108` · `:118` · `:152`），§2.4 只写「14 → 20 键 + 对话流树入量 + 三档零 CJK」（`:217`）⇒ 核状态词面与断言集新形未写；且 6 词中 `queued` / `stopped` / `approval` 无树面用例（U60 五组仅 running / done / error，`:208`）。 | §2.4 U51 行补核键面与断言集新形（如「20 宿主键 + 5 核状态键」）；U60 状态组补 `queued` / `stopped` / `approval` 或注明其归属批。 |
| 11 | Clarity | 🔵 | 每文件行增删字形为视图档内字面（`+x −y`，`:90`），与 `docs/desktop/design/RENDERER.md:31`「面向用户字符串一律经 `t()`（含英文）」存隙，而机检面只有零 CJK 扫描（`:217`）⇒ ASCII 字面不入闸。 | 或明示该字形属符号面（非词表项）写入 §2.2（c），或交由字形面（`chat.css`）承载。 |

**已核验一致（不列发现）**：三态 / 块五型 / 错误卡双支 / 挂载根 = 滚动容器 / 摘要块与药丸判据（UI.md:19 · RENDERER.md:36 · :41 ↔ 契约 (a)(b)(e)）；`attachXxx` 第二形 ↔ RENDERER.md:27；`.flow` 确为滚动容器（`renderer/styles.css:86-93`）；store 五 API + 五键坐标逐条实读（store.mjs:28/32/33/34/35/53/60/66/72/77）；宿主键实读 14 键（i18n.mjs:18-51，`tab.badge.approval` 在位 `:30`/`:46`）；核状态词 5 键（`thincoder-core/i18n.mjs:50-54`）；白名单九项且无 `history:page`（`src/preload/preload.cjs:12-15`）；新档经扩展名白名单即可供给，故「零主进程 / 零预载改动」成立（`src/main/protocol.mjs:16-23` · `:39-50`）；用例续号 U57 → U58–U67 无跳号（`test/session-contract.test.mjs:210`）；`test/files.mjs` 现为八档 6 行（:2-6）与 §2.3 记值一致；受影响文件表逐档实读与记值一致，`chat.mjs` ~260 未越 300 层且拆分预案在册。

**计数**：🔴 0 · 🟡 7 · 🔵 4 —— 无阻断项；🟡 / 🔵 全部为可读面收正（契约形钉死 / 计数同步），供父侧派单。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 **#64 = pass**（🔴 0 · 7🟡 + 4🔵 **全收**）；② **修复轮 #65（11 条）+ #66（N-1）+ #67（N-2）全部落地**并经父侧核验（`RENDERER.md:33-36` / `:42-45` / `:52-57` / `:82` · 批档 §2.11 / §2.12 / §2.13）· 门 = **悬空 4 / 行宽 18** 基线同值；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审 = #64 · 核验结论 = 上列读数 · 发现处置 = §1.7（十一条全收）+ §1.8 / §1.9（N-1 / N-2 裁定落）· §2.11 / §2.12 / §2.13（**修后为准**）。
- **批准射程** = §2 十节 + §2.11–§2.13「修后为准」全部条目（**E-1…E-10** · **U58–U67** · 受影响面 **11 档** + 新档 4）；**不含**：值面供给（agent 批）· 活动池 · 审批卡 · 设置 / 首启 · 打包 · **U-1…U-4**（在册：重挂归零面 / KD-1 张力 / 措辞 / `PROJECT.md` 预算回填）。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（12 档 · 测试 61/61 · 冒烟 ok · 审计与评审双 pass · 终态 clean）



### 5.1 交付摘要（eng-coder · round = initial）

**落盘面 12 档**（新 7 · 改 5）：

| 档 | 形 | 实读行数 |
|---|---|---|
| `thincoder-desktop/renderer/views/chat.mjs` | 新 | 228 |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 新（§2.3 拆分预案落形） | 123 |
| `thincoder-desktop/renderer/views/chat-stream.mjs` | 新 | 77 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` | 新 | 90 |
| `thincoder-desktop/renderer/chat.css` | 新 | 127 |
| `thincoder-desktop/test/views-chat.test.mjs` | 新（U58–U62） | 245 |
| `thincoder-desktop/test/views-chat-scroll.test.mjs` | 新（U63–U67） | 278 |
| `thincoder-desktop/renderer/index.html` | 改（对话流槽） | 37 |
| `thincoder-desktop/renderer/i18n.mjs` | 改（+20 键 × 两语） | 115 |
| `thincoder-desktop/renderer/app.mjs` | 改（对话流接线 + 帧出口） | 271 |
| `thincoder-desktop/test/views-chrome.test.mjs` | 改（U51 / U52 原址更新） | 256 |
| `thincoder-desktop/test/files.mjs` | 改（用例模块八档 → 十档） | 7 |

**验收证据**（复跑读数见 §5.4）：`node test/run.mjs` ⇒ **tests 61 / pass 61 / fail 0**；冒烟 `electron . --smoke` ⇒ `ok:true · boot:"ok" · served 15 · blocked 3`（exit 0）；禁改面（`views-tabbar.test.mjs` / `views.test.mjs` / `renderer/store.mjs`(188) / `renderer/styles.css` / 设计档 / 需求档）实证未触。

### 5.2 决策透明表（实现面自陈 15 条 —— 设计未钉处 / 实现面取形）

| # | 面（落形实证） | 与设计档的差 | 取形理由 |
|---|---|---|---|
| ① | `blockKey` 单源落 `chat-stream.mjs`（`chat.mjs:20` 单向导入；三消费者 = `blockNode` / 流式缝合 / `alignPlan`） | 设计只钉「兜底键 = 全列表位序」，未钉函数落点 | 键的消费者同在两档 ⇒ 归流式档免 `chat.mjs` ⇄ `chat-stream.mjs` 双源 |
| ② | 回填控件无词面 ⇒ 空 `button`（`chat.mjs:79`：`data-action="chat:backfill"` · 零文本 · `wire` 落 `disabled`） | UI.md 未给该控件词条；§2.2(e) 明文本批不接线 | 不造假文案（「零假数据」）；词条随回填接线批入 `i18n` 表 |
| ③ | `attachScroll` 收 `deps.guards()` **只读口**（缺 ⇒ 恒假） | RENDERER.md §2 定义 `deps` = `on*` 出口回调集——**未登记本键** | 卫兵读数（`hasOlder` / `inFlight`）须由装配处供；缺省恒假 ⇒ 本批与「回填不接线」自洽（评审轮 1 🟡#1 已报，归父侧设计面） |
| ④ | `handlers` 键名 = `onReturn`（药丸）/ `onToggleTool`（工具卡）/ `onBackfill` | 设计只点名 `onBackfill` | 后两键 = 命名自由面；与 `deps.on*` 形对齐 |
| ⑤ | 三处签名增参 / `mounted` 由 DOM 重建：`mountChat` 返 `{model, mounted}` · `settleFrame(..., handlers)` 第六参 · `mountedOf`（`chat.mjs:110-113`） | §2.12 只钉「帧层记账 = `{state, mounted}`」 | 帧层须持上帧 `state`（帧前判据比较对）；重建式读数免第二份真值（内存态仅 `app.mjs:194-196` 三变量） |
| ⑥ | 药丸出口平滑 / 贴底档恒瞬时 | 设计未钉平滑归属 | 贴底须与尾段同帧可见（无动画延迟）；药丸出口平滑（`app.mjs:20` 注）在贴底档被同帧写覆盖 = 已知取舍 |
| ⑦ | `reset` 帧对齐优先：`alignPlan.ok` 真 ⇒ `settleFrame` 六步；假 ⇒ 全量重挂 + 同帧态刷（`app.mjs:224-229`） | 沿 §2.13 逐格收正口径 | 保滚动位（U-1 张力面在册） |
| ⑧ | `none` 态 `blocks = []` ∧ `hidden = 0`（`chat.mjs:27-41`） | 设计钉三态；未钉 `none` 的 `blocks` 值 | 守 `data-blocks` = DOM 块节点数不变式（stale 块不落节点） |
| ⑨ | DOM 锚 = **全列表位序**（`chat.mjs:58`：`hidden + index`）⇒ 窗滑动不改键 | 沿 RENDERER.md「兜底 = 全列表位序」 | 窗滑动下键稳定（`toggle` 同域查找依赖之） |
| ⑩ | `patch` 档单块重建：kind 变 / 工具卡 ⇒ 尾块整节点重建；非尾块零触碰 | 沿 §2.13 收正口径 | 工具卡节点形变非就地可改；重建限尾块一枚 ⇒ 零头侧位移 |
| ⑪ | `chatTree` 再守一道：`model.state === "none"` ⇒ 零子（`chat.mjs:98`） | 设计未钉「双守」 | 即便调用方传 stale `blocks`，树面仍零节点 ⇒ 三态闸不破 |
| ⑫ | 摘要块文本位锚 `[data-summary-text]`（`chat.mjs:78` · 态刷就地刷读它 `:148`） | 设计只钉摘要块在场判据与文本值，未钉位锚名 | 帧尾态刷需位锚（同 `[data-pill]` 形） |
| ⑬ | `syncChrome` 实为三态幂等刷：摘 / 就地刷 / **建插** | RENDERER.md:35 句子面为「在场与文本随判据」 | 缺席且判据真 ⇒ 建（摘要首插 · 药丸末插）⇒ 重挂帧后同帧态刷自愈缺失控件；插入侧 = **显式入参** `atStart`（评审轮 1 🔵#5 修复落形，见 §5.3） |
| ⑭ | 窗限 `chatLimit` = `app.mjs:194` **模块级 `let` · 只增**（`nextWindow` 收束沿 `+HISTORY_PAGE`；跨会话不回零） | 设计 §2.2 未钉窗限归属面 | **禁由 `blocks.length` 派生**（`none` / 短会话会归零 ⇒ 下帧窗塌到 1 —— `app.mjs:192-193` 注）；只增 ⇒ 块数有界（头部由对齐步摘除） |
| ⑮ | **拆分 `chat-tool.mjs`**：`chat.mjs` 228 + `chat-tool.mjs` 123 = **351 > 300** | §2.13:518 明文「`chat.mjs` ~295 < 300 ⇒ 拆分预案不触发（在册不动；**交付实读越层再启**）」 | 条件授权落形：交付实读越层 ⇒ 拆分再启（工具卡面 + 折叠纯函数移出）；连带设计档漂移面见 §5.4 |

### 5.3 审计与代码评审轮次与终态

| 轮 | 面 | 结果 | 处置 / 终态 |
|---|---|---|---|
| ① 交付前分歧审计（explore · 只读 · 全交付面 vs 设计规格） | 12 档全量 | 🟡 2 · 🔴 0：**①** `chat-tool.mjs` 属**表外新档**；**②** `SHELL.md:35` 树 `views/` 行缺 `chat-tool.mjs`（doc 漂移） | ① = §2.13:518 条件授权落形（越层再启条件成立，见 §5.2-⑮）⇒ 表内披露、无需修；② = 设计档漂移 ⇒ 登记 §5.4 交父侧随动（非本席写域）。**表外改动仅此一档**，自陈 ①–⑮ 逐条核对属实 |
| ② advisor 代码评审 **轮 1** | 12 档全量 | **VERDICT pass**：🟡 3 · 🔵 3 —— 🟡#1 `deps.guards` 未入设计档 · 🟡#2 `SHELL.md:35` 树缺档 · 🟡#3 `RENDERER.md:26`「视图档内唯一触 DOM 处」与同批新增 `:27`/`:35`/`:52` 三 DOM 面自相抵 · 🔵#4 模型 `hasOlder`/`inFlight` 零消费（设计面裁定）· 🔵#5 `chromeSlot` 插入侧由字面比较隐式决定 · 🔵#6 记录面行数漂移（= U-4） | #1 / #2 / #3 / #4 / #6 **全在父侧设计 / 记录层**（本轮禁改面）⇒ 披露归口、不越域改；**#5 本席即修**（见下轮） |
| ③ **修复轮（本席 · 🔵#5）** | `renderer/views/chat.mjs` | 插入侧改**显式入参**：`chromeSlot(root, selector, want, make, update, atStart = false)`（`:128`）· 摘要侧显式传 `true`（`:151`）· 药丸侧走缺省（`:153-157`）⇒ 首插 / 末插语义与修前逐位一致；旧字面比较全档零残留；档头注释随动（`:127`） | 复跑 `node test/run.mjs` ⇒ **61 / 61 全绿**（含 U58–U67 十例） |
| ④ advisor 代码评审 **轮 2** | `chat.mjs`（仅核 🔵#5 修复声明 · 显式排除其余 5 条） | **VERDICT pass**：修复属实 ∧ **零新发现**（签名变更 = 档内私有面：`chromeSlot` 未导出 · 唯二调用点在 `syncChrome` 内 · `syncChrome` 自身签名未动 ⇒ `app.mjs:222` / `:228` 零随动） | 收敛 |

**终态 = clean**（审计 2 🟡 已逐条处置 · 评审轮 1 = pass · 修复轮 = 已修 · 轮 2 = pass）。

### 5.4 门读数 · 漂移随动面 · 在册未落

**门读数（父侧机检口径）**：FAIL(锚) **7** / FAIL(行宽) **18**——增量 = 悬空锚 **+3**，**三条全在 `docs/vsc/`**（`VSC-DEBT.md:302` · `WEBVIEW.md:393` / `:420`）；成因 = 新档 `thincoder-desktop/renderer/chat.css` 使 basename `chat.css` 不再唯一，撞 `scripts/doc-check-anchors.mjs:158-173` 兜底解析 ⇒ **本批产品面零新增悬空 · 零新增超宽**；跨面连带 3 条已登记台账，**归口 = `docs/vsc` 写域随动批**（非本批射程、非本席写域）。

**设计档漂移随动面（实证 · 交父侧派单）**：

1. `SHELL.md:35` 树 `views/` 行缺 `chat-tool.mjs`（本轮新拆分档未入树）。
2. `PROJECT.md` §4.1：缺 `chat-tool.mjs` 行 + 四档预算为**修前层**（`:97` ~55 · `:102` ~260 · `:103` ~110 · `:104` ~150）——U-4 明文**本批禁改**，交付后按实读回填（57 / 228 / 77 / 90 + 新行 123）；`:112` 用例模块行两档预算（~200 / ~150）同法回填（245 / 278）。
3. 批档 §2.4 U51 括注扫描清单记 **3 档**，实现面按 **4 档**落（`test/views-chrome.test.mjs` 扫描含 `chat-tool.mjs`）⇒ 记录面文本待父侧随动。
4. 评审轮 1 三项设计面（`RENDERER.md:26` 三口径自相抵 · `RENDERER.md:27` / §3 未登记 `deps.guards` · 模型两字段零消费的裁定落文）。

**在册未落（本批射程外 · 沿 §2.13 收正）**：回填接线（`onBackfill` 零给 ⇒ U-1 张力面）· 活动池 / 审批卡 · 设置 / 首启 · 打包；U-1…U-4 随动面见上。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-26 03:22）

- **E-1…E-10 = 全 ✅**（§5 交付表）。**父侧亲跑**：`npm test` ⇒ **tests 61 · pass 61 · fail 0**（U58–U67 全绿 · U51 = 20 键 + 六视图档零 CJK · U52 = 四槽接线结构）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:15`；`renderer/views/chat-stream.mjs`（77 行）逐行实读 ✓（`blockKey` 单源 · `{kind,index}` 四档 · `alignPlan` 最大重合 / `evict` 最小 / 尾位豁免 · `paintPlan` 重挂键收窄 + `refresh` 恒真）；**禁改面零 diff**（`store.mjs` 188 · `styles.css` · 两零触碰测试档）✓。

### 6.2 裁定与例外

表外档 `renderer/views/chat-tool.mjs`（**§2.13 条件授权落形** · 越层再启拆分）= **收** ✓；跨面连带 3 条 = 台账 **#408**（非本批面 · 判据⑤ 按「本批所触档零新增」）；N-1（态刷）/ N-2（窗口对齐步）已落（§1.8 / §1.9）。

### 6.3 修正轮核验（父侧 · 2026-09-26 03:30）

- **#69 五组全落**：`PROJECT.md:105`（`chat-tool.mjs` 行）+ 实读回填（`:95` 37 / `:97` 127 / `:98` 271 / `:100` 115 / `:102` 228 / `:103` 77 / `:104` 90 / `:112` 7 / `:113` 256/245/278 / `:119` 256）+ `:117` **拆分落形**（228 + 123 = 351 > 300 ⇒ 工具卡面拆出）+ `RENDERER.md:26`（**DOM 触面四处**枚举）· `:27`（`guards?()`）· `:29`（回填接线口径）+ 三设计档变更记录 + 批档 §2.14；门 = **悬空 7 / 行宽 18**（基线同值 · **本轮零新增**）✓。
- **记录面记法偏差**（§5.4-2 的 `chat.css` **57** vs 实读 **127**）= §2.14 已收正覆盖 ⇒ **不回改**（记录面 ✓）；未触碰行估计值偏差 = 在册（随各自触碰批回填）✓。

### 6.4 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.11–§2.14 designer · §3 评审（轮次 1）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **13 档**（12 产品 / 测试实改 + 本批档；其中新 **7**）· 用例 **U58–U67**（总 61/61）· 条目 E-1…E-10 |
| 指针 | 台账 **#353** 在途 · **#408** 新立（跨面连带）· #396–#407 在册 |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | 无独立台账行；U-1…U-4 = 在册 / 已消解 |
| 台账可见面 | 已查 ✓ |

### 6.5 结论

批 6（对话流 + 工具卡 · 视图面）**收口**：三新档 + 工具卡（三行 / 折叠 / 降级）+ 流式增量（含 **N-1 态刷** / **N-2 窗口对齐步**）+ 滚动面四纯函数 + 词表 20 键；61/61 + 冒烟全绿；**条件授权拆分自动生效并如实披露** ✓；**收口序纪律（#404）三度守住**。
