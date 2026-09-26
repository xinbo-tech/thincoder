# 2026-09-26 · 桌面端实施批 7（活动池 + 审批呈现）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-26 · 来源 = 用户 2026-09-25 22:17「你直接自己跑完吧」（授权与自缚条件见批 3 档 §1.11）——父侧自推：批 6（对话流 + 工具卡）收口 ⇒ 批 7 = 活动池 + 审批呈现（视图面 + 审批通道）。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 7 段）。前情 = docs/batches/2026-09-26-desktop-impl-6.md §6（已收口 2026-09-26）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26

### 1.1 讨论来源

用户 2026-09-25 22:17「**你直接自己跑完吧**」（授权射程与自缚条件 = 批 3 档 §1.11）——父侧自推：批 6（对话流 + 工具卡）收口 ⇒ **批 7 = 活动池 + 审批呈现（视图面 + 审批通道）**。

### 1.2 本批交付目标

1. **审批呈现**（设计锚 = `docs/desktop/design/UI.md:21` 审批呈现行）：**流内审批卡**（形态 / 键位 / 三出口按设计锚）+ **审批响应通道**（`approval:respond` 类——若设计已在册；载荷与失败面照 `IPC.md` + 既有先例）。
2. **活动池**（设计锚 = `UI.md` 活动池行 + `SHELL.md` `views/activity.mjs` 档）：进行中活动面（工具调用 / 待审批汇总）——**值面未落 ⇒ 契约 + 零节点（禁假数据）**。
3. **store 面**：审批 / 活动切片（**以设计锚实读为准**：已在册 ⇒ 消费；未在册 ⇒ §2 定形 + 上抛）。
4. **挂载与接线**（`renderer/app.mjs` 槽 + 订阅键集随动；`index.html` 槽位按设计现状）。

### 1.3 判据（机器可核 · 待 §2 细化）

① 审批卡树面机检（三出口 + 键位）；② 活动池树面机检（三态 / 汇总）；③ **审批通道端到端**（若本批落：回执信封 + 负例）；④ 词表键齐（零硬编码）；⑤ **零回归**（61 例不红 · 新增全绿 · 三包增量零（基线相对形）· doc-check **本批新增 / 改动行零新增**（基线 = 悬空 7 / 行宽 18，含跨面连带 3 条 = 台账 #408））；⑥ 形态沿 `docs/desktop/design/RENDERER.md` §1.1（含接线面第二形）。

### 1.4 边界（本批不含）

**agent 装配 / 值面供给**（`agent-host.mjs`——审批与活动的**数据供给**未落 ⇒ 零节点；本批落的是卡面 / 池面 / 通道 / 切片）· 设置 / 首启向导 · 打包分发 · 主题切换面 · `docs/vsc` 面（跨面连带归 #408）。

### 1.5 已知事实 / 依赖 / 条件触发

- 批 6 已收口（**61/61** · 冒烟 `boot:"ok" ∧ served:15` · 视图面 = 左列 / 标签条 / 会话头 / 状态栏 / 对话流 + 工具卡）。
- **store 现状**（批 2 落 · 批 5 扩）：窗口面五 API + `openTab` / `closeTab` / `deriveTabBadge` / `pendingClose` / `needsCloseConfirm`；**审批 / 活动切片是否在册 ⇒ §2 前实读确认**（`renderer/store.mjs` 188 行 · `initialState` 实读）。
- 设计锚：`docs/desktop/design/UI.md:21`（审批呈现）· 活动池行 · `docs/desktop/design/SHELL.md` §1 `views/activity.mjs` 行 · `docs/desktop/design/IPC.md`（审批通道若在册）· `docs/desktop/design/PROJECT.md` §4.1 各行预算。
- 台账 **#396 / #397 / #401 / #406 / #407 / #408** 不阻塞本批；#403（冒烟环境坑）沿用。
- **诚实形先例**：值面未落 ⇒ 零节点；未接线 ⇒ `disabled` + `data-action`；条件拆分预案制（批 6 已证有效）。

### 1.6 设计轮裁定 + 上抛处置（父侧 · 2026-09-26 03:43）

- **P-4（需求 §4 D4「四族」vs `docs/desktop/design/UI.md:37`「三族」）⇒ 裁定 = 非冲突，需求档零改**：D4（`docs/desktop/requirements/PROJECT.md:83`）是**内容枚举**（活动池须可见的四类 = 子代理活动块 / advisor-consult / 挂起态与 digest / 队列表）；`UI.md:37` 是**视觉族分组**（三族 = 活动块〔括注即在册「子代理 / advisor / consult」〕· 队列 · 待审批）；四内容项 → 三族**全映射**（挂起态 → 待审批 · digest → advisor / consult 活动块面）。设计侧零改（括注即映射证据）；本裁定入档备查。
- **P-1 / P-2 / P-3 / P-5**（正例读数归装配批 · 真回路归人工走查 · `activeSession` 悬空键归供给批 · `ev:approval` 核映射归装配批照实读填）⇒ **全收**（各按其所，登记在案）。
- **P-6**（`thincoder-desktop/src/preload/preload.cjs:7-10` 头注「九项」须随动「十项」）⇒ 收，**并入实施派单**（实施面收正项）。
- **评审**：设计评审**已发**（#71）——通过后逐条裁定 → 修复轮（如需）→ **§4 代签** → 实施。

### 1.7 首轮评审裁定 + 修复轮（父侧 · 2026-09-26 03:48）

- **#71 = changes-required**（🔴 2 / 🟡 4 / 🔵 6 · **无 token**）——**十二条全收** ⇒ 修复轮 **#72**（§2.11 形态 · 逐号 1–12 · 修后为准）。
- **两条 🔴 口径**：
  1. **载荷字段集异述**（§2.2(d) `:98` vs `docs/desktop/design/IPC.md:18`：`shape` 只见后者 · `argsSummary`↔`args` · `count` 顶层↔嵌 `batch`，且批形**工具清单键名缺**）⇒ **一处定名**、另一处改写同值，§2.2(a) 消费名对齐。
  2. **卡锚 token 异述**（三锚 `data-card="approval"` vs `[data-approval]`）⇒ **归一为同一 token**（`RENDERER.md:37` / `:38` + §2.2(b) + U71 同步同值）。
- **🟡 / 🔵 承 §3 表逐条收正**：`togglePool` 缺键分支 · `none` 态锚承载节点 · 出口描述符单一 owner · `PROJECT.md:106` / `:107` 随动 · dom / chrome 行数两说 · 「23 处」计数 · §2.8 措辞滞后 · `PROJECT.md:122` 十档 · 卡键盘面覆盖 · §2.5 ③ 登记句。
- **闸**：修复轮后重跑（判据 = 本批面零新增）；**排程**：修复轮落 → 父侧核验（含两条 🔴 **逐字对照**）→ **§4 代签** → 实施。

### 1.8 复核轮落地 + 骨架占位清理（父侧 · 2026-09-26 04:14）

- **#73（复核轮）落地**：`§2.11.5`（`:334`–`:362`）+ `§2.11.6`（`:364`–`369`）在档；**收正 9 处坐标 / 名称错**（C-1 节名 §2.7→§2.3 · C-2a/b 计数 · **C-3a–e 五处越界 / 指错坐标**：D4 → `requirements/PROJECT.md:83`、D5 → `:84`、T-DSK6 → `design/PROJECT.md:208`、T-DSK21 → `:223`、行预算 → `:110`）——**零设计档改动**、零新发现、门 = 悬空 7 / 行宽 18 基线下同值 ✓。**价值**：此五处坐标属父侧评审射程外（需求档不在 scope 内）⇒ 独立复核补上 ✓。
- **骨架占位清理（父侧机械直改 · 标记）**：§1 / §2 两条 `<§N 模板占位：…>` 行（原 `:7` / `:54`）**已删**——其余区（§3–§6 未写区）占位随各自段落落笔后于收口前一并清理；本改动为单行删除、可回退（父侧直改）。
- **复评**：评审复核轮**已发**（round 2 · 核两条 🔴 归一两侧同值 + 12 条落地 + 无新引入）——通过即发 token → **§4 代签** → 实施。

### 1.9 实施中裁定：测试档越层拆分（父侧 · 2026-09-26 05:20）

- **情形**：本批 U71 / U51–U52 增量使两测例档越层——`test/views-chat.test.mjs` **365** · `test/views-chrome.test.mjs` **321**（>300 主动拆分层 · `docs/desktop/design/PROJECT.md:117`）。
- **裁定 = 本批拆**（取实施舱 A 案）：
  1. **依据** = `PROJECT.md:117` 在册规则 + 批 6 先例（`chat.mjs` 越层 ⇒ 条件拆分落形 `chat-tool.mjs` = 「收」）——两档由**本批自身增量**推出层界 ⇒ 本批清账，**不属越权**。
  2. **落法** = U71 帧面 → `test/views-chat-frame.test.mjs` · U52 零回归 / 导出锁面 → `test/views-locks.test.mjs`；`test/files.mjs` **十二 → 十四档**；**拆后两档须回层内**（实读作证）。
- **事实纠正**：`views-tabbar.test.mjs`（329 · 台账 **#407**）**本批不触碰** ⇒ #407 消解窗口**不在本批触发**（已回令实施舱不动该档）。
- **归口**：设计档 drift（用例模块行 / 档数枚举 / §2.4 落档列）= **实施后修正轮**；实施舱只披露、不改设计档。
- **台账**：#407 保持条件型在册（窗口未触发）。

### 1.10 落地核验 + 修正轮（父侧 · 2026-09-26 05:36）

- **交付核验 = 通过**（父侧亲跑）：`npm test` ⇒ **tests 69 · pass 69 · fail 0**（U68–U75 全绿 · U74 = 白名单十项末位 ∧ `HANDLERS ≡ CHANNELS` 两向 ∧ 未装配 fail-loud · U51 = 34 键 + 八视图档零 CJK · U52 = 五槽接线结构）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:18`；`renderer/views/approval.mjs`（150 行）逐行实读 = 设计形态（两形 / 键位闭集不吞键 / 最安全键置焦 / **出口描述符单一 owner** / **零 `store.mjs` import = 结构性零写保证**）；**拆档实测**：`views-chat.test.mjs` **246** · `views-chat-frame.test.mjs` **185** · `views-chrome.test.mjs` **232** · `views-locks.test.mjs` **107** ⇒ **两档回层内 ✓**。
- **垃圾档清理（父侧 · 单文件）**：`thincoder-desktop/x[1]).join('`（**0 字节** · mtime 2026-09-25 21:07 · 名形 = 命令行事故残片 · 零引用）⇒ 经 `delete` 工具**已删**（可逆性 = 零字节无内容损失）。
- **修正轮 #76 已派**（设计档随动：两拆档后的枚举 / 档数 / 落点收正 + 全表实读回填 + `pool.css` 行号 + **两条评审 🟡 设计面项裁定**（`data-autofocus` 零消费点 · 池头读数口径张力）+ §2.14 记账）；**依 #404 纪律：修正轮落地核验 ⇒ 才 close**。
- **实施舱两处自纠（记功）**：① 我的派单把拆分层坐标写 `:117`（批 6 位），其实读校正为 **`:121`**（另有 `:119` 500 硬限）✓；② 拆档后 `test/fake-dom.mjs` 头注消费档名与 `test/views.test.mjs:7-8` 注释指针随动 ✓（越清单已披露）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 #76 逐号 1–3 落形（档数落点收正 / §4.1 实读回填 / 两条 🟡 处置）+ 一致性面补遗（树标记 · 置焦表述对齐）；写后闸态与基线同值）

### 2.1 本批覆盖（条目表）

| 条目 | 内容 | 锚（需求 / 设计） | 判据面 |
|---|---|---|---|
| E-1 | **审批卡面（两形）** = `thincoder-desktop/renderer/views/approval.mjs`（拟新增）：卡树（工具名 / 参数摘要 / 状态词 / [改动摘要降级行?] / 三出口）+ 键位闭集 `verdictOfKey` + 置焦「最安全键」+ 出口动作 `respondApproval` | 需求 §4 D5（`docs/desktop/requirements/PROJECT.md:164`）· 用例 T-DSK6 / T-DSK21（`:204` / `:219`）· `docs/desktop/design/UI.md` §1 审批呈现行（`:21`）+ 键盘可达行（`:27`）· 范本借用 11（`UI.md:55`）· `docs/desktop/design/PROJECT.md` §2 KD-8（`:43`，两条门皆接） | U68 · U69 · U70 |
| E-2 | **卡入流（帧面随动）** = `renderer/views/chat.mjs` + `renderer/chat.css`：`chatModel` 携卡面 · 帧尾态刷纳卡（幂等）· 根子序与插点纪律 | `UI.md` §1 审批呈现行（流内卡片 = 主视图）· `docs/desktop/design/RENDERER.md` §1.1（帧尾态刷 / 插入点纪律） | U71 |
| E-3 | **活动池面** = `renderer/views/activity.mjs`（拟新增）+ `renderer/pool.css`：三族（待审批置顶 → 活动块 → 队列）+ 两读数 + 折叠（按会话记忆）+ 待审批操作区 | 需求 §4 D4（`:163`）· `UI.md` §2 项 1（`:37`，**落定**）· `UI.md` §1 布局行（`:13`）· `docs/desktop/design/PROJECT.md` §4.1 行预算（`:108`，~200 · 三族 + 折叠） | U72 · U73 |
| E-4 | **审批响应通道（配线完整性 + 未装配负例）** = `src/preload/preload.cjs`（白名单第 10 项）+ `src/main/ipc.mjs`（处理体） | `docs/desktop/design/IPC.md` §2 `approval:respond` 行（`:35`）· §1 `ev:approval` 行（`:18`）· 批档 §1.3 ③ · `docs/desktop/design/SHELL.md` §4 项 5（`:77`，挂起表在主进程） | U74 + U27 / U37 原址更新 |
| E-5 | **store 切片定形** = `renderer/store.mjs`：`pool` 补三族与待决项数组 · `tabBadges` / `sessionMeta` / `poolCollapsed` 槽位注册 · 纯动作 `togglePool` | 批档 §1.2 项 3 · `store.mjs` 在册先例（槽位在、供给随批）· `UI.md` §1 标签条行（`:15`）/ 会话头行（`:18`，两切片消费面已在册） | U75 + U52 导出面原址更新 |
| E-6 | **挂载接线** = `renderer/app.mjs`（池槽 + 键集 + handler 两件）+ `renderer/index.html`（`pool.css` 一条 `<link>`） | `docs/desktop/design/SHELL.md` §4（装配面）· `RENDERER.md` §1.1（接线面） | U52 原址更新（四槽 → 五槽） |
| E-7 | **词表随动** = `renderer/i18n.mjs`：宿主键 20 → 34（两语同增） | `UI.md` §1 i18n 行（`:28`，本端不另立词表源） | U51 原址更新（键数 + 零 CJK 清单） |
| E-8 | **设计档落形（随动交付）** = `UI.md` / `IPC.md` / `RENDERER.md` / `PROJECT.md` / `SHELL.md` 五档 | 批档 §1.3 ⑥ · D1 写权矩阵（设计档 = eng-designer） | §2.10 实读抽检 |

**不入本批**（§1.2 未列 / §1.4 已排）：`ev:approval` 推送面与预载事件订阅面（`on`）· 挂起表与值面供给（`src/main/agent-host.mjs`）· 设置与首启面 · 打包分发 · 主题切换 · `docs/vsc` 跨面连带（台账 #408）· composer 输入面 · 虚拟化 · 外部查看器 · 回填真通道。

### 2.2 逐面契约（机制设计）

#### （a）审批卡形态（两形 · `views/approval.mjs`）

- **卡根** = `data-card="approval"` + `data-prompt-id`（待决项身份，路由键）+ `data-shape="single" | "batch"`；驻点 = 对话流根（**非块节点** —— 见 KD-9）。
- **逐项形（`single`）**：首行 = 工具名 + 参数摘要（`argsSummary`）+ 状态词（**闭枚举取值**：待审批 = 复用 `tab.badge.approval` 词键，单源不复制）+ 改动摘要行（`changes` 在场 ⇒ 复用工具卡降级形；缺 ⇒ 零节点）；三出口 = `once` / `always` / `reject`，锚 `data-action="approval:once|always|reject"` + `data-key="1|2|3"`。
- **批形（`batch`）**：首行 = 工具清单摘要 + 计数（词键 `approval.batch.count` 带 `{count}` 占位）+ 三出口 = `approveAll` / `deny` / `oneByOne`，锚 `data-action="approval:approveAll|deny|oneByOne"` + `data-key="1|2|3"`。
- **键位闭集** = 纯函数 `verdictOfKey(shape, key)`：`("single", "1"|"2"|"3")` ⇒ `once|always|reject`；`("batch", …)` ⇒ `approveAll|deny|oneByOne`；表外键 / 非串 / 未知形 ⇒ `null`（**闭集外零动作**，不吞键 —— 不 `preventDefault`）。
- **出口动作** = `respondApproval(host, promptId, verdict)`：`host.invoke("approval:respond", { promptId, verdict })`；invoke 抛 / 拒绝 ⇒ `console.error`（**不静默**）且**零切片写** —— 后者是**结构性保证**：本档零 `store.mjs` import（KD-14）。
- **置焦** = 「最安全键」（逐项 ⇒ `reject`；批 ⇒ `deny`）；锚 `data-autofocus="1"`；同 `prompt-id` 重挂不夺焦（幂等）。
- **接线两态** = 复用 `chat-tool.mjs` 导出原语 `wire` / `withKey`（零副本）：handlers 缺 ⇒ 三出口 `disabled: true` ∧ `data-action` 仍在场（诚实非死控）。

#### （b）卡入流（帧面 · E-2）

- `chatModel(state, limit)` 增 `approval` 面 = **本会话**待决项数组（源 = `state.pool.approvals`；缺 / 非数组 ⇒ 零卡 —— 禁假数据）。
- **根子序** = [摘要块?] → 块序列 → [审批卡?] → [药丸?]；卡 = 非块节点 ⇒ `RENDERER.md` §2 的「DOM 块节点序 ≡ visible 逐位引用等」**不变式不受影响**。
- **插点纪律随动**（单源 = `RENDERER.md` §1.1）：块节点插点 = **首个 `[data-approval]` 之前**；无卡 ⇒ `[data-pill]` 之前。
- **帧尾态刷**（`syncChrome`）纳卡面：在场判据 = 待决项非空；进出 + 同 `prompt-id` 文本随判据；幂等（零变化 ⇒ 零 DOM 写）。
- `CHAT_KEYS` += `"pool"`（待决项变更 ⇒ 对话流帧）。

#### （c）活动池面（E-3）

- **根** = 骨架 `.pool-body[data-slot="pool"]`（`index.html:30-32` 已在册 ⇒ 槽位零改）；树根 `data-pool` + `data-state="none | empty | pool"`（三态沿对话流行同形律：无活动会话 ⇒ `none` **零节点**；有会话三族皆空 ⇒ `empty`（词表提示）；有内容 ⇒ `pool`）。
- **族序固定** = **待审批（置顶）** → 活动块 → 队列；族空 ⇒ 该族**零节点**（不落空壳 —— 禁假数据）。
- **待审批条目** = 工具名 + 操作区（三出口 = 与卡面**同一 handlers**，两态同锚）；**活动块条目** = 工具名 + 状态词（闭枚举 6 词）+ **零内容回显**；**队列条目** = 标题串（供给面出串）+ 状态词。
- **两读数** = `pool.running` / `pool.approval`（**在册键**）—— 折叠头的计数读数；展开体 = 三族列表。
- **折叠** = 控件锚 `data-action="pool:toggle"` + `aria-expanded`；折叠态 = `poolCollapsed[会话键]`（**按会话记忆**）；折叠 ⇒ 体零条目节点 + 头读数在场。
- 键域 = **本会话**（`activeTab`）⇒ 随标签切换。

#### （d）审批响应通道（E-4 · 配线完整性 + 负例）

- **白名单**（`src/preload/preload.cjs:12-15`，唯一副本）+= `"approval:respond"` ⇒ **第 10 项 / 定序末位**。
- **处理体**（`src/main/ipc.mjs` `HANDLERS`，`:40-50`）+= `"approval:respond"`：**未装配审批源 ⇒ fail-loud 直传拒绝**（抛 ⇒ `invoke` 拒绝；**不吞 / 不造 reason 码 / 不落假成功**）—— 沿 `IPC.md` §2 会话族注项 5 fail-loud 先例（`:55`）与「禁假数据」。
- **两处同动**（fail-closed 在册）：白名单项无处理体 ⇒ 注册期抛（`ipc.mjs:84`）⇒ 预载面与处理体必须**同批**落。
- **渲染面出口** = `{ promptId, verdict }`（**载荷定形**见下）；成功 ⇒ 零切片写（待决项清除归**事件面** = 供给批）。
- **回执信封 = 形定**：装配后照**会话族统一信封同形族**（`{ ok, reason, … }`，`IPC.md:51`）—— 正例读数随供给批（值面未落 ⇒ 无条件可产；见 §2.8 P-1）。
- **IPC.md 载荷定形（两行）**：`ev:approval` 行补**消费面最小字段集** = `{ promptId, tool, argsSummary?, changes?, batch?: { count, tools } }`；`approval:respond` 行补 = `{ promptId, verdict }` + verdict 闭集（两形）。核回调 → 本通道的**字段映射**由 agent 装配批照核**实读**填（§2.8 P-5）—— 本批只定消费面所需最小集，不重述核回调形状。

#### （e）store 切片定形（E-5）

- `pool` 补形 = `{ running: 0, approval: 0, blocks: [], queue: [], approvals: [] }`（两读数**在册保留** = 折叠头读数；三族 + `approvals` 新增；`approvals` = **卡面与池面的同一源** —— 一事实只存一处）。
- `tabBadges: {}` / `sessionMeta: {}` = **槽位注册**（消费面已在册：`app.mjs:40` `SHELL_KEYS` · `chrome.mjs:56` / `:96` · `requestCloseTab` 的 `state.tabBadges?.[key] ?? []`）⇒ 注册后**零行为变化**（前者读 `?? []` 恒空；后者空对象 ⇒ `data-meta="none"` 不变）。
- `poolCollapsed: {}` 新增 + 纯动作 `togglePool(state, key)`（非串键 / 无变化 ⇒ **原引用** —— 沿 store 三纯动作纪律）。
- 三切片皆 = **供给面写入**（值面未落 ⇒ 零节点）；读数 ≡ 族长、位标 ≡ 待决的**一致性由供给面单点写入保证**，渲染面**零推导 / 零复制**（沿 `UI.md` §1 状态栏行「优先序消费 = 标签切片单源」）。

#### （f）挂载接线（E-6）

- `POOL_SLOT = '[data-slot="pool"]'` + `POOL_KEYS = ["pool", "poolCollapsed", "activeTab", "locale"]` + `paintPool(state)` + 订阅分流一行；`handlers` += `onApprove` / `onTogglePool`。
- `CHAT_KEYS` += `"pool"`；`index.html` += 一条 `<link rel="stylesheet" href="./pool.css" />`（槽位零改）。

#### （g）词表（E-7）

- 新增宿主键 **14 条 × 2 语**（20 → **34** 键）：池 = `pool.title` / `pool.family.approvals` / `pool.family.blocks` / `pool.family.queue` / `pool.collapse` / `pool.expand` / `pool.empty.hint`；卡 = `approval.once` / `approval.always` / `approval.reject` / `approval.batch.approveAll` / `approval.batch.deny` / `approval.batch.oneByOne` / `approval.batch.count`。
- 两语键集须**相等**（在册机检形，U51 原址更新）；状态词**零新键**（闭枚举 6 词：核投影 + 复用 `tab.badge.approval` —— 单源不复制）。
- 文本字符串字面**视图档零**（一律经 `t()`）；字形（`+` / `−` / `×` 类）住 `chat.css` / `pool.css` 的 `content`。

#### （h）形态沿 `RENDERER.md` §1.1

- 纯构树（零 DOM 依赖、零 `node:`、零裸包 —— 静态闭包守卫判红面不动）+ 薄挂载（clear + build + append）+ **接线两态**（`wire` / `withKey`）+ 文案经 `t()`；接线面**第二形**（`attachXxx`）本批零新增（卡键盘接线落构树面 `onKeyDown` 导出面）。
- 视图档零字形字面 · 零硬编码串 · `pool.css` **零断点**（单断点常量仍单源 = `styles.css`，U43 判据不动）。

### 2.3 受影响文件与设计档落点（实读 → 预估；口径 = 内容行数 · 文末换行不计 · 实读 = 本设计轮逐档清点）

**产品面（渲染面 + 主侧配线）**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/approval.mjs`（新增） | 0 | ~150 | 卡面两形 + `verdictOfKey` + 置焦 + `respondApproval`（零 `store.mjs` import） |
| `thincoder-desktop/renderer/views/activity.mjs`（新增） | 0 | ~200 | 三族 + 两读数 + 折叠 + 操作区（沿 `PROJECT.md` §4.1 在册预算 ~200 · `:108`） |
| `thincoder-desktop/renderer/pool.css`（新增） | 0 | ~40 | 池面样式（零断点 —— 单断点常量仍单源） |
| `thincoder-desktop/renderer/views/chat.mjs` | 228 | ~250 | 卡入流（`chatModel` + 帧尾态刷 + 插点纪律） |
| `thincoder-desktop/renderer/views/chat-tool.mjs` | 123 | ~135 | 导出面 +3（阈值常量 / `changeTotals` / 降级摘要形）⇒ 卡面复用零副本 |
| `thincoder-desktop/renderer/chat.css` | 127 | ~165 | 卡面样式（越阈摘要行复用既有 `.tool-*` 形态） |
| `thincoder-desktop/renderer/store.mjs` | 188 | ~205 | 三切片定形 + `togglePool` |
| `thincoder-desktop/renderer/app.mjs` | 271 | ~298 | 池槽 + 键集 + handler 两件（**贴 300 层**） |
| `thincoder-desktop/renderer/i18n.mjs` | 115 | ~145 | 宿主键 20 → 34（两语） |
| `thincoder-desktop/renderer/index.html` | 37 | 38 | +1 `<link>`（`pool.css`；槽位零改） |
| `thincoder-desktop/src/preload/preload.cjs` | 29 | ~31 | 白名单九 → 十项 + 头注一行 |
| `thincoder-desktop/src/main/ipc.mjs` | 90 | ~97 | `HANDLERS` 第 10 项 + 处理体（未装配 ⇒ fail-loud） |
| `thincoder-desktop/renderer/styles.css` | 284 | 284 | **零改动**（池面样式分档 —— 284 贴 300 层，KD-13） |
| `thincoder-desktop/renderer/dom.mjs` | 64 | 64 | 零改动（薄挂载原语 `clear` / `build` / `el` 够用） |
| `thincoder-desktop/renderer/views/chrome.mjs` | 101 | 101 | 零改动（消费面已在册：`:56` / `:96`） |
| `thincoder-desktop/renderer/views/sessions.mjs` | 292 | 292 | 零改动 |
| `thincoder-desktop/renderer/views/chat-scroll.mjs` / `chat-stream.mjs` | 90 / 77 | 90 / 77 | 零改动 |

**行预算警戒**：`app.mjs` 271 + ~27 ⇒ **~298 贴 300 层** ⇒ **拆分预案在册**：超 300 ⇒ 池面接线（`POOL_SLOT` / `POOL_KEYS` / `paintPool` / 订阅分流）拆 `renderer/mount-pool.mjs`（沿批 6 `chat-*` 拆分先例 · 条件触发）。

**测试面**

| 文件 | 实读 | 预估 | 改动 |
|---|---|---|---|
| `thincoder-desktop/test/views-approval.test.mjs`（新增） | 0 | ~200 | U68–U70 |
| `thincoder-desktop/test/views-activity.test.mjs`（新增） | 0 | ~170 | U72–U73 |
| `thincoder-desktop/test/views-chat.test.mjs` | 245 | +~40 | +U71（卡入流与插点 · 假根接线沿 U67 先例） |
| `thincoder-desktop/test/store.test.mjs` | 227 | +~30 | +U75（三切片定形 + `togglePool`） |
| `thincoder-desktop/test/host-floor.test.mjs` | 99 | +~25 | +U74（通道配线两向 + fail-loud 源扫描） |
| `thincoder-desktop/test/projects.test.mjs` | 200 | ~200 | U27 原址更新：白名单九 → 十项 |
| `thincoder-desktop/test/session-contract.test.mjs` | 280 | ~282 | U37 原址更新：白名单九 → 十项（定序 + 冻结） |
| `thincoder-desktop/test/views-chrome.test.mjs` | 256 | ~272 | U51 / U52 原址更新（见下「原址更新逐条」） |
| `thincoder-desktop/test/files.mjs` | 7 | 9 | 清单 **十 → 十二档**（**须与两新档创建同刻落** —— U52 清单两向自检） |
| `thincoder-desktop/test/guard-closure.test.mjs` | 101 | 101 | **零随动**（U5 闭包自 `app.mjs` 走边 ⇒ 两新档自动入扫描 · 已实读 `:43-66`） |
| `thincoder-desktop/test/views-tabbar.test.mjs` / `views.test.mjs` / `views-chat-scroll.test.mjs` | 329 / 200 / 278 | 同 | 零触碰 |
| 核（`thincoder-core`）/ CLI / 扩展三包 | — | — | 增量零 |

**原址更新逐条（实施面按此逐条收正，勿凭记忆改）**

1. `files.mjs`：十 → 十二档（+`views-approval.test.mjs` / `views-activity.test.mjs`）。
2. U51：宿主键 **20 → 34**（两语键集相等）· 哨兵消费面 += 卡 / 池两档 · **零 CJK 扫描六 → 八档**（+`views/approval.mjs` / `views/activity.mjs`）。
3. U52：**四槽 → 五槽**（+= `pool`：`index.html` 容器锚 + `app.mjs` 槽锚 —— 实读 `views-chrome.test.mjs:230-233`）· 接线调用清单 += `paintPool(state)`（实读 `:243`）· **导出面锁 += `approval.mjs` / `activity.mjs` 两档**（同形同锁）+ `store.mjs` 锁 += `togglePool`（实读 `:217-221`）+ `chat-tool.mjs` 锁 += 导出三件（实读 `:226`）。
4. U27（`projects.test.mjs:159`）/ U37（`session-contract.test.mjs:148`）：白名单 **九 → 十项**（定序 + 冻结）。
5. U5 / U6 / U7（`guard-closure.test.mjs`）：零改动（自 `app.mjs` 走边 + 内存合成源判红面）。

**设计档落点**

| 档 | 改动 |
|---|---|
| `docs/desktop/design/UI.md` | §1 审批呈现行**落形**（流内卡片 · 形态两形 · 键位 1/2/3 · 焦点最安全键 · 三出口）+ 键盘可达行补两形键位与焦点 + §2 项 1 活动池**落定**（三族序 / 两读数 / 折叠记忆）+ 变更记录 |
| `docs/desktop/design/IPC.md` | §1 `ev:approval` 行载荷定形（消费面最小字段集）+ §2 `approval:respond` 行载荷定形（`{ promptId, verdict }` + 闭集）+ 未装配口径（fail-loud）+ 变更记录 |
| `docs/desktop/design/RENDERER.md` | §1.1 帧尾态刷纳卡面 + 插入点纪律补卡锚（首个 `[data-approval]` 之前）+ 变更记录 |
| `docs/desktop/design/PROJECT.md` | §4.1 产品面 +3 行（`views/approval.mjs` / `views/activity.mjs` / `pool.css`）+ 行预算回填 + 用例模块行十 → 十二档 + 变更记录 |
| `docs/desktop/design/SHELL.md` | §1 树（`renderer/` 加 `pool.css` · 用例模块十 → 十二档）+ §4 项 5 挂起表行注明「响应通道已落 / 供给未落」+ 变更记录 |
| `docs/desktop/requirements/**` | **零改动**（需求档 = 主 agent 笔 —— 见 §2.8 P-4） |

### 2.4 用例表（U68 起续号 —— 实读在册最大 = U67（`test/views-chat-scroll.test.mjs:191`）；判据形态沿 `RENDERER.md` §1.1 —— 纯构树零 DOM，平 `node` 直测）

| 用例 | 场景 | 输入 | 预期输出 | 落档 |
|---|---|---|---|---|
| U68 | 卡面两形与键位闭集 | `approvalTree`：逐项形 · 批形 · 两形 `changes` 在场 / 缺 · `verdictOfKey` 入参矩阵（两形 × `1`/`2`/`3` · 表外键 · 非串 · 未知形） | 卡根 `data-card="approval"` + `data-prompt-id` + `data-shape`；三出口 `data-action` + `data-key="1|2|3"` 逐位同序；`verdictOfKey` 命中 ⇒ 六值闭集，表外 ⇒ `null`（零动作）；焦点锚 = 逐项 `reject` / 批 `deny`（各恰一） | `test/views-approval.test.mjs` |
| U69 | 卡面降级与接线两态 | `changes` 未越阈 / 越阈（`>200` 行 ∨ `>10` 文件）· handlers 给 / 缺 | 未越阈 ⇒ 摘要行 + 每文件 `[data-file]`；越阈 ⇒ 只摘要行 ∧ 零 `[data-file]`（与工具卡同判据同形）；缺 handlers ⇒ 三出口 `disabled: true` ∧ `data-action` 仍在场 | 同上 |
| U70 | 出口动作与负例 | `respondApproval(host, promptId, verdict)`：假 host（成功 / 拒绝）· 卡树出口按钮的 `onClick` 直接调用（携 spy handler） | 载荷 = `("approval:respond", { promptId, verdict })` 逐字；拒绝 ⇒ `console.error` 在场（不静默）∧ 本档零 `store.mjs` import（源面 + 结构面双证 ⇒ 零乐观写）；出口 `onClick` ⇒ handler 收 `(promptId, verdict)` | 同上 |
| U71 | 卡入流与插点（帧面） | `chatModel` 待决项空 / 一 / 二 · 假根（沿 U67）帧尾态刷：卡在场 ↔ 缺席 · 同 `prompt-id` 文本变 / 不变 | 根子序 = [摘要块?] → 块序列 → [卡?] → [药丸?]；块序不变式不受卡影响；块节点插在**首个 `[data-approval]` 之前**（无卡 ⇒ `[data-pill]` 之前）；幂等（零变化 ⇒ 零 DOM 写）；`CHAT_KEYS` 含 `pool` | `test/views-chat.test.mjs` |
| U72 | 池面三族与三态 | `poolTree`：无活动会话 · 有会话三族皆空 · 三族各一 / 部分空 | `data-state` = `none`（**零节点**）/ `empty`（词表提示）/ `pool`；族序 = 待审批 → 活动块 → 队列；族空 ⇒ 该族零节点；待审批条目 `data-prompt-id` + 三出口操作区；活动块条目带状态词（闭枚举值）；条目**零内容回显** | `test/views-activity.test.mjs` |
| U73 | 池面折叠与两读数 | 折叠态 `poolCollapsed` 真 / 假 / 缺 · `togglePool` 三组（命中 / 未命中 / 非串键） | 折叠 ⇒ 体零条目节点 ∧ 头读数 = `pool.running` / `pool.approval` 两名值；控件 `aria-expanded` 两态；`togglePool` 命中 ⇒ 翻转，未命中 / 非串键 ⇒ **原引用**；`data-action="pool:toggle"` 在场 | 同上 |
| U74 | 通道配线两向 | `preload.cjs` 源面（`CHANNELS`）· `ipc.mjs` 源面（`HANDLERS`） | `CHANNELS` 含 `approval:respond` ∧ 十项 ∧ 定序末位；`HANDLERS` 键集 **≡** `CHANNELS` 集（两向 —— 缺一即判红）；未装配处理体 = **throw**（源面判红：零 `reason` 码字面 · 零 `{ ok: true }` 字面） | `test/host-floor.test.mjs` |
| U75 | 切片定形与纯动作 | `initialState()` 键集 · `pool` 三族与两读数 · `togglePool` 三组 · 注册前三切片消费面读数（`requestCloseTab` / `headModel`） | 切片在册且形如 §2.2（e）；`togglePool` 命中翻转 / 未命中与非串键 ⇒ 原引用；`tabBadges` / `sessionMeta` 注册后 `requestCloseTab` 取键 ⇒ 零抛 ∧ `headModel` ⇒ `data-meta="none"` 不变（**零行为变化**） | `test/store.test.mjs` |

**用例计数**：61 → **69**（+U68–U75）；续号自 U67（实读最大）起，无跳号 / 无重号。

### 2.5 验收对照（对回批档 §1.3 判据）

| 判据 | 落点 | 机检面 |
|---|---|---|
| ① 审批卡树面机检（三出口 + 键位） | §2.2（a） | U68 · U69（纯构树零 DOM）· U71（入流） |
| ② 活动池树面机检（三态 / 汇总） | §2.2（c） | U72 · U73（三态 / 族序 / 两读数 / 折叠） |
| ③ 审批通道端到端（回执信封 + 负例） | §2.2（d） | U70（出口载荷 + 拒绝负例）· U74（配线两向）· U27 / U37 原址更新；**信封 = 形定**（会话族同形族）+ 负例可检；**正例读数随供给批**（值面未落 ⇒ 无条件可产 —— §2.8 P-1） |
| ④ 词表键齐（零硬编码） | §2.2（g） | U51 原址更新（20 → 34 键两语相等 · 哨兵消费面 · 零 CJK 八档） |
| ⑤ 零回归 | §2.3 | 61 例不红 + 新增 8 全绿；三包增量零（核 / CLI / 扩展零触碰）；`doc-check` **本批新增 / 改动行零新增**（基线 = 悬空 7 / 行宽 18，含跨面连带 3 条 = 台账 #408） |
| ⑥ 形态沿 `RENDERER.md` §1.1（含接线面第二形） | §2.2（h） | 卡 / 池两档形 + U68–U75 判据全走纯函数与树面；接线面第二形本批零新增（卡键盘 = 构树面 `onKeyDown`） |

### 2.6 关键决策（本批新增 · 含被否方案）

| # | 决策 | 理由 | 被否方案 |
|---|---|---|---|
| KD-9 | 审批卡 = 流内**非块节点**（驻对话流根；根子序 [摘要块?] → 块序列 → [卡?] → [药丸?]） | `RENDERER.md` §2 不变式只覆盖**块节点**序 ⇒ 非块节点驻根零冲突；批形（N 工具清单）无单块可挂 ⇒ 独立卡是两形唯一统一形；三视图一事实（卡 / 池 / 位标同源切片） | ① 嵌工具块内（批形无宿主）② 新块型 `approval`（块五型 = 闭枚举，动 §2 与 U59）③ 浮层（违 `UI.md:21`「流内卡片」） |
| KD-10 | 卡面改动摘要**复用** `chat-tool.mjs`（阈值与摘要形导出 +3） | 阈值（`>200` 行 ∨ `>10` 文件）与降级形在册单源 ⇒ 复制 = 第二口径；卡面与工具卡同锚（`[data-file]` / 摘要行）⇒ 用户面无分裂 | 卡面自带阈值副本 / 摘要形 |
| KD-11 | 通道 = 白名单第 10 项 + 处理体；**未装配 ⇒ fail-loud 直传拒绝** | 白名单 ↔ 处理体同动（`ipc.mjs:84` 注册期抛 = fail-closed，两处必须同批）；造 reason 码 / 假成功 = 发明语义 + 违「禁假数据」；沿会话族注项 5 fail-loud 先例 | ① 只落预载面（注册期即抛，起不来）② 造 `not-attached` 码（第二 reason 语义）③ 本批不落通道（§1.2 明列） |
| KD-12 | store 三切片定形：`pool` 补三族 + `tabBadges` / `sessionMeta` **槽位注册** + `poolCollapsed` + `togglePool` | 两切片消费面已在册（`app.mjs:40` / `chrome.mjs:56,96` / `requestCloseTab` 防御取键）而槽位缺 = 悬空键 ⇒ 同一状态树两形；注册后**零行为变化**（可机检）；沿 `pool` 在册先例（槽位在、供给随批） | 留悬空（下一批必遇）/ 改消费面加兜底（把缺失推进视图档） |
| KD-13 | 池面样式分档 `renderer/pool.css` + `index.html` 一条 `<link>` | `styles.css` 实读 **284** 贴 300 层 ⇒ 并入 ~40 行必越层并触发在册拆档预案（无因果搬移）；沿 `chat.css` 批 6 先例（分档零搬移 · 零断点） | 并入 `styles.css`（越层）/ 并入 `chat.css`（两面无因果） |
| KD-14 | `respondApproval` **零 `store.mjs` import**（结构性零乐观写） | 待决项清除归事件面（供给批）；零依赖 ⇒「invoke 失败不改状态」由**结构**保证而非纪律（可机检）；防乐观写返工 | 出口即改切片（乐观写 —— 供给批必然返工） |

### 2.7 边界（本批不做）

- **值面供给**（审批挂起表 / 活动族数据 —— `src/main/` 现无装配档，实读确认）：本批落**契约 + 零节点**，**禁假数据**（沿批档 §1.4）。
- **`ev:approval` 推送面与预载事件订阅面（`on`）**：`IPC.md:18` 行在册（载荷本批定形）⇒ 推送实现随 agent 装配批（本批只定形 + 消费面）。
- **通道正例读数**（回执信封成功态）：无害可产（§2.8 P-1）—— 本批只落**形定 + 负例**。
- 设置 / 首启向导 · 打包分发 · 主题切换 · `docs/vsc` 跨面连带（#408）· composer 输入面 · 虚拟化 · 外部查看器 · 回填真通道 · 卡面真回路（点出口 ⇒ 挂起表响应 = 供给批 + 人工走查）。
- **需求档与他批档**：零改动（笔属主 agent）。

### 2.8 上抛项（本批设计面发现 · 全为非阻塞观测）

| # | 发现 | 处置 |
|---|---|---|
| P-1 | `approval:respond` 的**正例回执语义**须供给面（挂起表）在场方存在 ⇒ 本批只落形定 + 负例 | **判：不造挂起表桩**（造桩 = 假值面）；正例读数归 agent 装配批。父侧如另有裁定请覆 |
| P-2 | 判据 ①②（卡 / 池树面）在值面未落时只能走**假根 / 树面**机检，真回路归人工走查 | 沿批 6 P-6 先例登记（自动面不承诺真回路） |
| P-3 | store 悬空键：`tabBadges` / `sessionMeta`（本批注册槽位）+ `activeSession`（**在册恒不被写** —— 写入方 = 会话供给面） | 前三者本批注册 / 登记；`activeSession` 归供给批（本批零改动） |
| P-4 | 需求 D4（`docs/desktop/requirements/PROJECT.md:163`）枚举「advisor / consult / 队列 / 待审批」**四族** vs `UI.md` §2 项 1（`:37`）**三族**（活动块族内含 advisor / consult）—— 口径不一致 | 需求档笔属主 agent ⇒ **只登记不动**；请裁是否对齐（本端设计以 `UI.md` 三族 + 族内两型呈现为准） |
| P-5 | `ev:approval` 载荷的**核侧映射**（核回调形状 → 本通道字段）未定 | 由 agent 装配批照核**实读**填；本批只定**消费面最小字段集**（不重述核形状 —— 防第二口径） |
| P-6 | 批 6 遗留：`preload.cjs` 头注（`:7-10`）逐字列九项通道名，与本批十项并存 ⇒ 头注须同刻随动 | 一致性面：实施面收正头注为十项（本档 §2.3 已列 +2 行；逐条报告） |

### 2.9 三链一致（自检）

- **需求链**：需求 §4 D4 / D5（`requirements/PROJECT.md:163` / `:164`）+ 用例 T-DSK6 / T-DSK21（`:204` / `:219`）→ E-1–E-8 → 设计档落点（`UI.md` §1 审批呈现 / 键盘可达 + §2 项 1 · `IPC.md` §1 / §2 · `RENDERER.md` §1.1 · `PROJECT.md` §4.1 · `SHELL.md` §1 / §4）。
- **判据链**：批档 §1.3 ①–⑥ ↔ E-1–E-8 ↔ §2.5 逐行 ↔ U68–U75 + 原址更新五条（每条判据至少一条机检用例，无判据悬空；③ 的正例面已显式标注归属）。
- **用例链**：在册 **61** + U68–U75 = **69**；续号自 U67（实读最大）起，无跳号 / 无重号；`test/files.mjs` 十 → 十二档与两新档**同刻落**。

### 2.10 设计档落形与闸态（本轮实读）

**落形（五档 · 23 处 · 逐处回读）**

- `docs/desktop/design/UI.md`：`:21` 审批呈现行**落形**（卡 = 流内独立节点三锚 `data-card="approval"` / `data-prompt-id` / `data-shape` · 两形键位 `verdictOfKey`（表外零动作 · 不吞键）· 三出口锚 `data-action="approval:<verdict>"` + `data-key="1|2|3"` · 初始焦点 = 最安全键 · `changes` 超阈只摘要 · 出口通道 `approval:respond` · 零乐观写）· `:27` 键盘可达行改**两形**（焦点锚 `data-autofocus="1"` 恰一）· `:37` §2 项 1 **池落形**（三态 `data-state` · 族序 = 待审批 → 活动块 → 队列 · 族空零节点 · 两读数禁假造 · 折叠锚 `data-action="pool:toggle"`）· `:73` 变更记录。
- `docs/desktop/design/IPC.md`：`:18` `ev:approval` 行**载荷定形**（消费面最小字段集 `{ promptId, shape, tool, args, changes?, count? }`）· `:35` `approval:respond` 行**载荷定形**（`{ promptId, verdict }` · 六值闭集 · 未装配 ⇒ fail-loud 直传拒绝 · 回执形定 = 会话族同形族）· `:79` 变更记录。
- `docs/desktop/design/RENDERER.md`：`:37` 插入点纪律改**卡锚**（块节点插在首个 `[data-approval]` 之前；卡缺席 ⇒ `[data-pill]` 之前；根子序含卡位）· `:38` 新增「**卡面在场与随动**（帧尾态刷 · 本批）」条（非块节点不入块序不变式）· `:55` 尾段挂载条插点改指纪律单源 · `:86` 变更记录。
- `docs/desktop/design/PROJECT.md`：`:98` 新增 `renderer/pool.css`（拟新增 · ~40）行 · `:103` `chat.mjs` 行改**卡入流**口径 · `:107` 新增 `renderer/views/approval.mjs`（拟新增 · ~150）行 · `:110` `activity.mjs` 行补池落形（保 ~200）· `:115` 用例模块行**十 → 十二档**（+`views-approval` / `views-activity` · `~200 / ~170`）· `:124` 拆分预案段增 `app.mjs`（条件触发 ⇒ `renderer/mount-pool.mjs`（拟新增））· `:131` 自动面落点补两档（U68–U70 / U72–U73 · U71 / U74 / U75 原址补例）· `:287` 变更记录。
- `docs/desktop/design/SHELL.md`：`:30` 静态资源行加 `pool.css（拟新增）` · `:35` `views/` 行加 `approval.mjs（拟新增）`（`chat-tool.mjs` 之后）· `:37` 用例模块十 → **十二档** · `:77` §4 项 5 补「响应通道在册 / 挂起表供给随装配批」· `:96` 变更记录。

**收正（一致性面 · 本轮实改 · 逐条）**

1. §2.3「设计档落点」SHELL.md 行**漏列** `views/` 行加 `approval.mjs` 随动 ⇒ 本轮已补做（档间同值随动面；与 §2.1 E-1 落点同源）。
2. §2.3 PROJECT.md 行「产品面 +3 行」口径收正：实读 = **两新行**（`:98` `pool.css` / `:107` `approval.mjs`）+ `activity.mjs` 行**原地补形**（该行批 3 起在册——§2.1 E-3 已引 `:108`）+ `chat.mjs` 行口径改 + 用例模块行 + 拆分预案段；非笼统「+3 行」。
3. RENDERER.md 实际落形比 §2.3 行多一处随动（§3 尾段挂载条插点改指纪律单源——同面同源，非新语义）。

**闸态（机检 · 本批新增 / 改动行零新增）**

- `node scripts/doc-check.mjs`（实读）：悬空 **7** · 行宽 **18** —— 与批前基线**同值**（7 全落 `docs/core/**` / `docs/vsc/**` = MODEL-SPECS ×3 / SESSION ×1 / VSC-DEBT ×1 / WEBVIEW ×2；18 行同域 = CORE-UNIFICATION ×2 / MODEL-BENCH ×6 / MODEL-SPECS ×6 / VSC-DEBT ×3 / WEBVIEW ×1）；`docs/desktop/**` 零判红。
- 五档新增路径锚全带「（拟新增）」标记（列报 · 不入闸——机检「拟新增 31」全域含本批）；新增符号锚（`verdictOfKey` / `respondApproval` / `poolCollapsed` / `paintPool`）落**报告面**（不入闸）。
- 需求档 / 他批档 / `docs/vsc` 面：**零触碰**（实改面 = 上述五档 + 本档）。

**三链复核**：§2.9 三链（需求 / 判据 / 用例）不受落形影响成立（本轮 = 落形：零条目改 / 零判据改 / 零用例改）。

### 2.11 修复轮 #72（逐号 1–12 · 修后为准）

**口径**：§3 轮次 1 全 12 条（🔴 2 · 🟡 4 · 🔵 6 —— 父侧 §1.7 裁「全收」）逐号处置；本档 append-only ⇒ §2.2–§2.10 首轮落形原文留档不动，**凡与本节不一致处一律以本节为准**（修后为准）。
**行号换算**：§1.7 / §3 内引本档行号 = **实读行号 − 9**（常量差 · 如 §3 的 `:78` = 本档实读 `:87`）；本节与 §2.11.1 落点一律用**修复轮实读行号**。
**两面处置**：设计档实改 8 号（§2.11.1 · 五档 · 10 处点）+ 本档面收正（§2.11.2）；号 3 / 8 / 9 / 12 无设计档改（只本档面），号 5 / 6 / 7 本档面无需改。

#### 2.11.1 设计档实改（逐号 · 行号 = 修复轮读回实读号）

| 号 | 收正后为准 | 实改点 |
|---|---|---|
| 1 | `ev:approval` 载荷 = `{ promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`（owner = 通道面 `IPC.md` §1 行）；`shape` = `"single"` ∥ `"batch"` · `tool` / `argsSummary` = 逐项形（批形缺省）· `batch.tools` = 工具名数组 · `changes` 缺 ⇒ 卡面无摘要行 | `docs/desktop/design/IPC.md:18` + `:80`（变更记录） |
| 2 | 卡锚 = `[data-card="approval"]`（三锚为准 = `UI.md` §1 审批呈现行）——两处选择器改写为已枚举锚 | `docs/desktop/design/RENDERER.md:37` / `:38` + `:87`（变更记录） |
| 4 | 池三态承载 = 宿主 `.pool-body[data-slot="pool"]` **自身**（树根 = 挂载根 · props 复制到宿主 · `data-slot` 保留）；`none` = 根描述符恒在 · **零子节点** | `docs/desktop/design/UI.md:37` + `:74`（变更记录） |
| 5 | 池内待审批操作区出口描述符 = `views/approval.mjs` **单一 owner**（锚 / 值映射 / 词键）；`activity.mjs` 消费零副本 | `docs/desktop/design/PROJECT.md:107` + `:110` + `:288`（变更记录） |
| 6 | `chat-tool.mjs` 补**共享导出面**（阈值常量 `DIFF_FILE_FLOOR` / `DIFF_LINE_FLOOR` · `changeTotals` · 改动摘要行构造〔越阈降级 = 只摘要行 ∧ 零 `[data-file]`〕——审批卡面复用零副本） | `docs/desktop/design/PROJECT.md:106` + `:288`（变更记录） |
| 7 | 行数实读回填：`dom.mjs` `~120` ⇒ **64** · `chrome.mjs` `~130` ⇒ **101**（预估形去除；本批新增档实施后行数归实施后修正） | `docs/desktop/design/PROJECT.md:100` / `:109` + `:288`（变更记录） |
| 10 | 「清单十档同步」⇒ **十二档**（与同档用例模块行同值） | `docs/desktop/design/PROJECT.md:122` + `:289`（变更记录） |
| 11 | 卡根键盘面 = `onKeyDown` **两态**（handler 在场 / 缺省 ⇒ 不夺焦）；「同 `prompt-id` 重挂不夺焦」= **人工走查**（登记 T-DSK21） | `docs/desktop/design/PROJECT.md:135` + `:289`（变更记录） |

#### 2.11.2 本档面收正（§2.2–§2.10 原文留档 ⇒ 本表文本为准）

| 号 | 本档面行（实读） | 收正后为准 |
|---|---|---|
| 1 | §2.2（d）`:107` | 字段集补 `shape`；`tool` / `argsSummary` 记作可选（键名沿 `chat-tool.mjs:72` 先例）；批形清单键名 = `batch.tools` · `count` 嵌 `batch` ⇒ 与 `IPC.md:18` **逐字同值**（`args` ↔ `argsSummary`、`count` 顶层 ↔ 嵌 `batch` 两说作废） |
| 2 | §2.2（b）`:87` · §2.7 RENDERER 行 `:189` · U71 `:201` | 卡锚一律 `[data-card="approval"]`（`[data-approval]` 记法作废） |
| 3 | §2.2（e）`:113` · U73 `:203` · U75 `:205` | `togglePool(state, key)` 三支：命中 ⇒ 翻转 · **缺键 ⇒ 落 `true`（首击折叠）** · 非串键 ∨ 目标值 ≡ 现值 ⇒ **原引用**；U73 三组 = 命中 / 缺键 / 非串键（同词）；U75 同词 |
| 4 | §2.2（c）`:93` | 「根 = 骨架」与「树根 `data-pool` + `data-state`」= **同一节点**（描述符落宿主自身）；`none` = 根描述符恒在 · 零子节点（U72 `:202` 同形） |
| 5 | §2.2（c）`:95` | 同句补：三出口**描述符**（锚 / 值映射 / 词键）= `views/approval.mjs` 导出面（单一 owner · 消费零副本）；本档 §2.3 `:139` 活动池行同值 |
| 6 | 无需改 | §2.3 `:142` 已记「导出面 +3（阈值常量 / `changeTotals` / 降级摘要形）⇒ 卡面复用零副本」；本轮补齐 `PROJECT.md:106` 同值 |
| 7 | §2.7 PROJECT 行 `:190` | 「行预算回填」= 本轮已做（`PROJECT.md:100` / `:109` 实读 64 / 101）⇒ 该条读作已落 |
| 8 | §2.10 标题 `:258`（「五档 · 23 处」）+ §2 状态行 `:53` | **24 处**（4 UI + 3 IPC + 4 RENDERER + 8 PROJECT + 5 SHELL）；状态行已随本轮更新 |
| 9 | §2.8 表头 `:239` · P-1…P-6 `:243`–`:248` | 见 §2.11.3（§2.8 内「请覆 / 请裁」语气作废，不再读作待办） |
| 10 | §2.7 PROJECT 行 `:190` | 「用例模块行十 → 十二档」同句 + `PROJECT.md:122`（「清单十档同步」）已改十二档 |
| 11 | U69 `:199`（判据追加） | 卡根 `onKeyDown` **两态**：handlers 给 ⇒ 键处理在场 / 缺 ⇒ 不挂（不夺焦）——与 U68 `:198` 焦点锚「恰一」并列为卡键盘面两条；「同 `prompt-id` 重挂不夺焦」= 人工走查（登记 `PROJECT.md:135`） |
| 12 | §2.5 ③ `:215` | 补句：**本批无信封产出点** ⇒ 判据 ③ 读作「配线两向 + 负例」（正例读数随供给批 —— §2.8 P-1） |

#### 2.11.3 §2.8 P 项注记（§1.6 裁定 · 不复裁实体）

| 项 | 行（实读） | 注记 |
|---|---|---|
| P-1 | `:243` | 收 —— 「不造挂起表桩 · 正例读数归 agent 装配批」定为本批口径；「父侧如另有裁定请覆」作废 |
| P-2 | `:244` | 收 —— 真回路归人工走查（沿批 6 P-6 先例） |
| P-3 | `:245` | 收 —— 槽位本批注册 · `activeSession` 归供给批（本批零改动） |
| P-4 | `:246` | **非冲突**（需求四族 vs 设计三族 = 口径差，族内两型呈现）⇒ 需求档零改；「请裁是否对齐」作废 |
| P-5 | `:247` | 收 —— 核侧映射归 agent 装配批（本档只定消费面最小字段集） |
| P-6 | `:248` | 收 —— 并入**实施派单**（头注收正 = 实施批条目，逐条报告） |

#### 2.11.4 闸态与落点（修复轮 · 实读）

- `node scripts/doc-check.mjs`（修复轮重跑）：悬空 **7** · 行宽 **18** —— 与 §2.10 基线**同值同域**（皆本批射程外档）；`docs/desktop/**` 零判红 ⇒ 判据 ⑤「本批新增 / 改动行零新增」成立。
- 拟新增（列报面 · 不入闸）：**32** = 修复轮前 31 + 本修复轮 `PROJECT.md:110` 新增 1 处 `views/approval.mjs` 引用。
- 五档变更记录（新落 · 各带日期「批 7 修复轮 #72」）：`IPC.md:80` · `RENDERER.md:87` · `UI.md:74` · `PROJECT.md:288` / `:289`。
- 三链（§2.9）：本轮 = 口径 / 计数 / 记法归一 + U69 判据一句（号 11）+ U73 / U75 同词（号 3）——同一机制同值化，非新语义；条目 / 判据集 / 用例集零增减；**需求档零改**（与 §1.6 P-4 裁定一致）。

#### 2.11.5 复核轮 · 同值化收正（实读逐项）

**口径**：本块 = §2.11 续块（复核轮实读）——§2.11 `:282` 口径照用（§2.2–§2.10 原文留档不动 · 不一致处以本节为准）；逐项按复核号 C-1…C-3e 记（报告面同号）；本轮零条目 / 零判据 / 零用例号增减（收正 = 记录面同值化，非新语义）；`docs/desktop/requirements/**` / `docs/vsc/**` / 他批档 / 代码面零触碰。

**三链复核（实读 · 逐面同值读数）**

- **需求链**：D4 / D5 现址 = `docs/desktop/requirements/PROJECT.md:83` / `:84`（逐行实读命中：D4 活动与后台 / D5 审批与模式）⇒ E-3 / E-1 锚同值；首轮引坐标见 C-3a / C-3b。
- **用例链**：T-DSK6 / T-DSK21 现址 = `docs/desktop/design/PROJECT.md:208` / `:223`（逐行实读命中）⇒ E-1 / §2.9 `:252` 同值（见 C-3c / C-3d）；U68–U75 沿 §2.11.2 表（号 3 / 11 / 12 收正文本在场）。
- **判据链**：§1.3 ①–⑥ ↔ E-1–E-8 ↔ §2.5 ↔ U68–U75（§2.9 `:253` + §2.11.4 `:332` 读数）；本块不增号。

**收正表（旧值 ⇒ 收正值 · 引用处 = 本档实读行）**

| # | 旧值 | 收正值 | 引用处 |
|---|---|---|---|
| C-1 | 节名「§2.7」 | **「§2.3」**（受影响文件与设计档落点 —— RENDERER 行 `:189` / PROJECT 行 `:190` 皆在该节表内，实读命中） | `:304` · `:309` · `:312` |
| C-2a | 「五档 · 10 处点」 | **「四档 · 11 处点」**= IPC `:18` · RENDERER `:37` / `:38` · UI `:37` · PROJECT `:100` / `:106` / `:107` / `:109` / `:110` / `:122` / `:135`（变更记录行另列） | `:284` |
| C-2b | 「五档变更记录」 | **「四档变更记录（5 行）」**= `IPC.md:80` · `RENDERER.md:87` · `UI.md:74` · `PROJECT.md:288` / `:289` | `:331` |
| C-3a | D4 引坐标 `:163`（越界 —— 该档实读 144 行） | `docs/desktop/requirements/PROJECT.md:83` | E-3 `:62` · P-4 `:246` · §2.9 `:252` |
| C-3b | D5 引坐标 `:164`（越界） | `docs/desktop/requirements/PROJECT.md:84` | E-1 `:60` · §2.9 `:252` |
| C-3c | 用例 T-DSK6 引 `:204`（裸号 · 未指档） | `docs/desktop/design/PROJECT.md:208` | E-1 `:60` · §2.9 `:252` |
| C-3d | 用例 T-DSK21 引 `:219`（裸号 · 未指档） | `docs/desktop/design/PROJECT.md:223` | E-1 `:60` · §2.9 `:252` |
| C-3e | 行预算引 `:108`（实读 = `sessions.mjs` 行，非目标） | `docs/desktop/design/PROJECT.md:110`（`activity.mjs` 行） | E-3 `:62` · §2.3 产品表 `:139` |

**零续改（复核确认 · 原值即正 / 已覆盖）**

- C-4：§2.10 标题 `:258`「五档 · 23 处」实为 **24 处**（4 UI + 3 IPC + 4 RENDERER + 8 PROJECT + 5 SHELL）——已由 §2.11.2 号8 收正、状态行 `:53` 随动；首轮「五档」含 SHELL = 首轮落形射程（与 C-2 修复轮四档 = 不同轮不同射程）⇒ 零续改。
- 卡锚 `[data-approval]` 残留 = 归档面四处（§2.2(b) `:87` · §2.3 `:189` · U71 `:201` · §2.10 `:262`）：§2.11.2 号2 + §2.11 `:282` 口径已覆盖（C-1 收正后号2 行节名同值）⇒ 零续改。
- §2.5 ③ `:215`「本批无信封产出点」语义在场（§2.11.2 号12 已落）⇒ 零续改。
- C-5 = 并入 C-3e（`:108` 两处引用已并计；无独立续改）。

#### 2.11.6 写后闸态（实读 · §2.11.5 落盘后重跑）

- `node scripts/doc-check.mjs`（§2.11.5 落盘后重跑）：悬空 **7** · 行宽 **18** —— 与批前基线 / §2.10 `:274` / §2.11.4 `:329` **同值同域**；`docs/desktop/**` 与 `docs/batches/**` 零判红 ⇒ 本续块新增行零新增。
- 7 条逐点复核命中（同基线）：`MODEL-SPECS.md:323`（符号）· `:1372` / `:1465`（路径/坐标）· `SESSION.md:850` · `VSC-DEBT.md:302` · `WEBVIEW.md:393` / `:420`（路径/坐标）。
- 18 行同域：CORE-UNIFICATION ×2 / MODEL-BENCH ×6 / MODEL-SPECS ×6 / VSC-DEBT ×3 / WEBVIEW ×1；计数同基线 = 候选 25551 · 注记豁免 43 · 拟新增 32 · 迁移期引文 215。
- 本续块面：零条目 / 零判据 / 零用例号；§2.9 三链计数不动（在册 61 + U68–U75 = 69）；零触碰面同 §2.11.5 口径行。

### 2.12 修正轮 #76 · 逐号 1（档数 / 落点 / 编号收正）

本轮 = §1.10 派单（修正轮 #76 · 设计档修正）；**零新语义**——只做归属方（父侧）决定后的落形；条目 / 判据 / 用例号零增减；需求档零改。

- **用例模块行 十二 → 十四档**：名集与 `thincoder-desktop/test/files.mjs` **同序同值**（实读）——`host-floor` · `guard-closure` · `session-contract` · `projects` · `store` · `views` · `views-tabbar` · `views-chrome` · `views-locks` · `views-chat` · `views-chat-frame` · `views-chat-scroll` · `views-approval` · `views-activity`。
- **两拆档入表**（§1.9 裁定落形）：`views-locks`（U52 零回归面 · 实读 107）· `views-chat-frame`（U71 帧面 · 实读 185）。
- **U52 落点收正**：载体自 `views-chrome` 改 `views-locks`——「300 行 = 主动拆分层」段与「随动面」行两处；`views-chrome.test.mjs` 实读 232 = 其余面。
- **`PROJECT.md:119` 拆档算式加「拆档时」限定**：`chat.mjs` 228 + `chat-tool.mjs` 123 = 351 = **拆分时点**实读（非现状值）。
- **`SHELL.md:37`**：用例模块十二 → **十四档**（同序同值）+ 该行 §4.1 尾指针去重（`test/` 行行数预算单源 = 该档 §1 作用域注）。
- **实改点**：`PROJECT.md:115` / `:119` / `:121` / `:122` / `:125` / `:131` + `:290`（变更记录）· `SHELL.md:37` + `:97`（变更记录）。

### 2.13 修正轮 #76 · 逐号 2（§4.1 实读回填 + 标记 / 预案收正）

- **产品面十二行实读回填**（口径 = 内容行数 · 文末换行不计——`PROJECT.md:117` 在册）：`ipc.mjs` **100** · `preload.cjs` **31** · `index.html` **38** · `chat.css` **170** · `pool.css` **77** · `app.mjs` **297** · `i18n.mjs` **145** · `store.mjs` **205** · `chat.mjs` **282** · `chat-tool.mjs` **126** · `approval.mjs` **150** · `activity.mjs` **171**。
- **`pool.css` 口径差注**：批 7 §5 记 **78** ⇒ 差 1 = 文末换行（本档口径在册）⇒ **77 为准**。
- `test/` 行 `files.mjs` **7 → 9**。
- **三处去「（拟新增）」**（实施已落档）：`pool.css` · `views/approval.mjs`（含 `chat.mjs` 行内注）· `views/activity.mjs`。
- **`app.mjs` 拆分预案段改结**：实读 **297 未超 300** ⇒ 批 7 在册预案（池面接线拆 `mount-pool.mjs`）**未触发**，保留为条件型（同 `tabbar.mjs` 先例）。
- **`sessions.mjs` 292 不动**（`:108` / `:123` 两行位置）：口径复核 = 292 正确（疑 291 系尾空行计数假漂移）。
- **实改点**：`PROJECT.md:87` / `:94` / `:95` / `:97` / `:98` / `:99` / `:101` / `:102` / `:103` / `:106` / `:110` / `:114` / `:124` + `:291` / `:292`（变更记录）。

### 2.14 修正轮 #76 · 逐号 3（UI 两条 🟡 处置 + 一致性面补遗 + 写后闸态）

**🟡-1 初始焦点（设计宣称 vs 制品形态）**——设计面收正 + 真置焦登记 open：

- 收正：宣称 = **初始焦点目标 = 最安全键**（逐项「拒绝」/ 批「全否」）；落形 = 标记锚 `data-autofocus="1"`（卡内恰一 · 机检）+ `chat.css` 高亮；**真置焦执行（DOM `focus()`）未落** ⇒ `UI.md:29` 登记 open。
- 证据（实读）：`thincoder-desktop` 全域零 `.focus(` / `autofocus` / `tabindex`；生产 = `renderer/views/approval.mjs` 三点标记锚（`:58` / `:72` / `:134`）；消费 = `renderer/chat.css:164`（唯一）；机检 = `test/views-approval.test.mjs`（恰一枚断言）+ `test/views-activity.test.mjs`（不争焦）。
- 实改点：`UI.md:21` / `:27` / `:29` + `:75`（变更记录）。

**🟡-2 池头两读数（口径张力）**——收正「**非数 ⇒ 零节点**」（原措辞把「无供给」与「非数」混同）：

- 证据（实读）：`renderer/views/activity.mjs:24-25`（`readingOf`：非有限数 ⇒ `null`）· 同档 `:50-51`（`none` ⇒ 两读数 `null`）；`renderer/store.mjs:42`（缺省 `pool: { running: 0, approval: 0 }` = **数**）⇒ `empty` / 池常态落 `0` 读数（非零节点）。
- 实改点：`UI.md:37` + `:75`（变更记录）。

**一致性面补遗（派单射程外 · 一并落形 · 可单行回退）**：

- **树标记补遗**：`src/main/agent-host.mjs` · `src/main/settings.mjs` · `renderer/views/settings.mjs` · `renderer/views/onboarding.mjs` 四档**盘上未落**（`ls` 实读）⇒ `SHELL.md` §1 树四行补「（拟新增）」，与 `PROJECT.md` §4.1 同项标记面一致；同树 `electron-builder.yml` 原有标记合法保留。
- **置焦表述对齐**：🟡-1 收正后三处**重述面**残留原口径 ⇒ 对齐（同目标 · 去「已执行」义）：`PROJECT.md:107`（§4.1 审批卡面行）· `PROJECT.md:223`（T-DSK21 行）· `UI.md:55`（§3 项 11 行）——各补「真置焦执行未落」。
- 补遗实改点：`SHELL.md:22` / `:27` / `:35` + `:98`（变更记录）· `PROJECT.md:107` / `:223` + `:293`（变更记录）· `UI.md:55` + `:76`（变更记录）。

**写后闸态（落盘后实读重跑）**：

- `node scripts/doc-check.mjs` ⇒ **悬空 7 · 行宽 18**——与基线（§2.10 / §2.11.4 / §2.11.6）**同值**、零新增。
- **行宽自核**（本仓实读）：三档非表行最长 = `PROJECT.md:117` **300**（恰在限内）· `SHELL.md` 最长 278 · `UI.md` 最长 289 ⇒ **非表行 >300 = 0**。
- 拟新增两口径分列：机检 pendingTotal（路径/坐标锚）= **29**（本轮含 `SHELL.md:98` +4 行）；标记引用处数（`docs/desktop/**` 全档 · 含记录面）= **49**——§2.11.4 的「32」口径未在本节复述，**未据此对账**。
- 本轮超长自纠 2 处（落盘前）：`PROJECT.md:291` 首版 318 字符 ⇒ 现值 **277**；`SHELL.md:98` 首版 310 ⇒ 现值 **235**。
- **三链**：零条目 / 零判据 / 零用例号增减；需求档（`docs/desktop/requirements/**`）零改；`docs/vsc/**` 与代码面零触碰。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审轮 1（设计就绪 · 首轮）** — 目标 = 批 7 §2（E-1–E-8 · 逐面契约 (a)–(h) · 受影响文件表 · U68–U75 · 验收对照 ①–⑥ · KD-9–KD-14 · 边界 · 上抛 · §2.10）↔ 设计锚实读（UI.md:21/:27/:37 · RENDERER.md:37-38 · PROJECT.md:98/:103/:107/:110/:115/:124/:131 · SHELL.md:30/:35/:37/:77 · IPC.md:18/:35）。锚侧核对结论：§2.10 逐处点名的五档落形锚**全部在位且同值**（24 个 `file:line` 点逐个回读命中）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（机制级不一致） | 🔴 | `ev:approval` 载荷字段集两处异文：§2.2(d)（批档 `:98`）= `{ promptId, tool, argsSummary?, changes?, batch?: { count, tools } }`，落形后的 owning 档 `IPC.md:18`（= §2.10 `:252` 同值）= `{ promptId, shape, tool, args, changes?, count? }`。三处差异：`shape` 只见于 IPC.md · `argsSummary` ↔ `args`（§2.2(a) `:67` 消费面同用 `argsSummary`）· `count` 顶层 ↔ 嵌 `batch`。且 `IPC.md:18` 只写「批形补 `count` 与工具清单」而**未给工具清单字段名**，§2.2(a) `:68` 批形首行却要「工具清单摘要 + 计数」⇒ 卡/池两档（U68 / U72）消费键不可定。 | 两档收敛为**同一套字段集**（一处定名、另一处改写为同值，含批形工具清单键名），并使 §2.2(a) 消费字段名与通道字段名逐一对齐。 |
| 2 | Document ownership（锚名不一致） | 🔴 | 卡节点锚两说：`UI.md:21` + §2.2(a)（批档 `:66`）+ §2.10（`:251`）= **三锚** `data-card="approval"` / `data-prompt-id` / `data-shape`；而 `RENDERER.md:37` / `:38`（插入点纪律 · 卡面在场随动）与 §2.2(b)（`:78`）、U71（`:192`）一律以 `[data-approval]` 为卡锚。若卡根不带 `data-approval`：插入点判定落空 ⇒ 块插到卡之后（卡漂到流中部）；U71 又会照实现自洽改写 ⇒ 机检面与三锚契约静默分叉。 | 归一为**同一 token**：选择器改写成已枚举锚（`[data-card="approval"]`），或把 `data-approval` 补进三锚枚举；`RENDERER.md:37` / `:38` · §2.2(b) · U71 同步同值。 |
| 3 | Clarity（纯动作语义） | 🟡 | `togglePool` 分支语义两说：§2.2(e)（`:104`）= 「非串键 / 无变化 ⇒ 原引用」；U73（`:194`）= 「命中 / 未命中 / 非串键」且「未命中 / 非串键 ⇒ 原引用」。按「未命中 = 键不在 `poolCollapsed`」读，首次折叠（缺键 ⇒ 原引用）恒为 no-op ⇒ §2.2(c)（`:88`）折叠功能不可达。 | 明写缺键分支（缺键 ⇒ 落 `true` = 折叠；「无变化」= 目标值与现值同 ⇒ 原引用），并令 U73 三组与契约同词。 |
| 4 | Clarity（三态锚落点） | 🟡 | 池三态锚落点未定：§2.2(c)（`:84`）并列「根 = 骨架 `.pool-body[data-slot="pool"]`」与「树根 `data-pool` + `data-state`」，且「无活动会话 ⇒ `none` **零节点**」；U72（`:193`）却断言「`data-state` = `none`（零节点）」。零节点时 `data-state` / `data-pool` 谁承载未定（对话流先例 = 锚在恒在宿主：`UI.md:19` 挂载根自身 + `RENDERER.md:36`）。 | 指明 `none` 态承载节点（宿主锚，或恒在的树根），令 §2.2(c) 与 U72 同形。 |
| 5 | Clarity（零副本归属） | 🟡 | 池内待审批操作区与卡面「三出口 = 与卡面**同一 handlers**，两态同锚」（§2.2(c) `:86`），但**未指名出口描述符（锚 + 值映射 + 词键）的单一 owner**；U68 / U72 两处均断言三出口 ⇒ 无 owner 即第二份副本（与 KD-10 自身「复制 = 第二口径」的理由相悖）。 | 指名单一 owner（如 `approval.mjs` 导出一枚出口描述符构造函数，`activity.mjs` 消费），并在 §2.3 两行改动列同步。 |
| 6 | Document ownership（档间滞后） | 🟡 | `chat-tool.mjs` 行（`PROJECT.md:106`）未随本批改动（§2.3 `:133` 记「导出面 +3」；§2.10 `:254` 落形清单无此行）⇒ 逐文件职责**单源**上看不出卡面 / 池面复用它（KD-10）。 | 该行与 `approval.mjs` 行（`PROJECT.md:107`）补记共享导出面。 |
| 7 | 行数一致性 | 🔵 | 同一文件两个当前行数：§2.3 记 `dom.mjs` 实读 64 / `chrome.mjs` 实读 101，而 `PROJECT.md:100` = `~120` / `:109` = `~130`（两行无「（拟新增）」标记 ⇒ 已落档）；§2.3（`:181`）称「行预算回填」而 §2.10 落形清单无对应行。 | 二者取一为准并回填；「行预算回填」若未做则从本批改动列删。 |
| 8 | Numeric drift | 🔵 | 「五档 · **23 处**」（`:249`，§2 状态行 `:44` 同值）与自身枚举不符：§2.10 逐处列出 4（UI）+3（IPC）+4（RENDERER）+8（PROJECT）+5（SHELL）= **24** 个 `file:line` 点。 | 计数与枚举取一为准。 |
| 9 | Doc-state（§2.8 vs §1.6） | 🔵 | §2.8 处置列仍是**裁定前**语气：P-1「父侧如另有裁定请覆」（`:234`）· P-4「请裁是否对齐」（`:237`），而 §1.6（`:38`–`:39`）已裁「全收 / P-4 = 非冲突 · 需求档零改」；§2.8 表头「全为非阻塞观测」（`:230`）亦与 §1.6 把 P-6 并入实施派单不同。不复裁 P 项实体，仅记措辞滞后。 | §2.8 各行注记 §1.6 处置（或标已裁），使该面不再读作待办。 |
| 10 | Numeric drift | 🔵 | `PROJECT.md:122`「清单**十档**同步 = `test/files.mjs`」本批后失真（同档 `:115` 已十二档；§2.3 `:168` files.mjs 十 → 十二档）；§2.10 落形清单无 `:122`。 | 该句计数改十二档（或去计数）。 |
| 11 | Acceptance（覆盖） | 🔵 | 卡键盘面仅 `verdictOfKey` 矩阵（U68）与出口 `onClick`（U70）入机检；卡根键盘 handler 两态（§2.2(h) `:120`）与「同 `prompt-id` 重挂不夺焦（幂等）」（§2.2(a) `:71`）无用例 / 走查条目承接（`PROJECT.md:135` 走查项未列该条）。 | 或补一条树面断言（handler 在场 / 缺省两态 · `data-autofocus` 恰一），或在 §2.5 / §2.7 显式登记「重挂不夺焦」归走查。 |
| 12 | 通道面登记 | 🔵 | §2.2(d)（`:97`）「回执信封 = 形定」+ fail-loud 负例下，本批无信封产出点 ⇒ 判据 ③ 的「端到端」实际读作「配线两向 + 负例」（已按 §1.6 P-1 裁定在案，非缺陷）。 | 保持现口径；§2.5 ③ 行补一句「本批无信封产出点」，免读作已落。 |

**计数**：🔴 2 · 🟡 4 · 🔵 6（共 12 条）。评审限制：无文档地图 / 项目标准档宣告 ⇒ ownership 判据降级为「Project Guide + 既有五档定位」；受影响文件表的 `实读` 值（源档行数 · i18n 键数 · store 切片在册性 · doc-check 闸态读数）不在本评审射程内（源档与脚本面除外），按未验证处理，仅与 `PROJECT.md` §4.1 同值面互校。

**VERDICT: changes-required**（🔴 2 条：载荷字段集异文 · 卡锚 token 异文——皆为「同一机制两处异述」，须先归一）

### 轮次 2（评审子代理）

**评审轮 2（修复复评 · 设计评审）** — 目标 = §2.11（#72 修复轮）两条 🔴 归一后两侧同值 + 10 条（🟡4 / 🔵6）落地 + 复核轮 C-1–C-5 收正态 + 三链（E-1–E-8 / U68–U75 / §2.5）同值；射程 = 批档 + 设计五档本轮**全量重读**（不以轮次 1 快照为准）。

| # | Orig# | 文件 · 行 | Severity | Status | 核验证据（本轮实读引文） |
|---|---|---|---|---|---|
| 1 | 1 | `IPC.md:18` ↔ 批档 `:294` / `:307` | — | **Fixed** | `IPC.md:18` 现载同一字段集：`= { promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`，并给批形键名「`batch` = 批形（`count` = 工具数 · `tools` = 工具名数组——键形沿 `thincoder-cli/src/tui/interaction.mjs:104`）」；§2.11.1 号1「`ev:approval` 载荷 = `{ promptId, shape, tool?, argsSummary?, changes?, batch?: { count, tools } }`（owner = 通道面 `IPC.md` §1 行）」；§2.11.2 号1「（`args` ↔ `argsSummary`、`count` 顶层 ↔ 嵌 `batch` 两说作废）」+ `IPC.md:80` 变更记录同值。两侧同值成立 |
| 2 | 2 | `RENDERER.md:37` / `:38` / `:87` ↔ 批档 `:308` | — | **Fixed** | `RENDERER.md:37`「块节点插入点 = **首个 `[data-card="approval"]` 之前**」· `:38`「卡节点 `[data-card="approval"]` 的在场与文本随帧内审批判据刷」· `:87`「旧记法 `[data-approval]` 仅存记录面」；§2.11.2 号2「卡锚一律 `[data-card="approval"]`（`[data-approval]` 记法作废）」并点名 §2.2(b) / §2.3 RENDERER 行 / U71 三处残文；C-4 另行覆盖 §2.10 残文。运行面 token 单一 |
| 3 | 3 | 批档 `:309`（§2.2(e)/U73/U75 收正） | — | **Fixed** | 「`togglePool(state, key)` 三支：命中 ⇒ 翻转 · **缺键 ⇒ 落 `true`（首击折叠）** · 非串键 ∨ 目标值 ≡ 现值 ⇒ **原引用**；U73 三组 = 命中 / 缺键 / 非串键（同词）；U75 同词」——缺键分支已明写，首击折叠可达 |
| 4 | 4 | `UI.md:37` / `:74` ↔ 批档 `:310` | — | **Fixed** | `UI.md:37`「三态 `data-state`（树根 = 挂载根 = 宿主 `.pool-body[data-slot="pool"]` 自身——props 复制到宿主 · `data-slot` 保留）：无活动会话 ⇒ `none`（**根描述符恒在 · 零子节点**）」——承载节点（宿主）与 `none` 态语义均已定 |
| 5 | 5 | `PROJECT.md:107` / `:110` / `:288` ↔ 批档 `:311` | — | **Fixed** | `PROJECT.md:107`「+ **操作区描述符导出**（三出口锚 / 值映射 / 词键 = 单一 owner——池面待审批族消费零副本）」· `:110`「待审批族操作区 = 复用 `thincoder-desktop/renderer/views/approval.mjs` 导出描述符〔单一 owner · 零副本〕」 |
| 6 | 6 | `PROJECT.md:106` / `:288` | — | **Fixed** | `:106` 行补「+ **共享导出面**（批 7 追加：阈值常量 `DIFF_FILE_FLOOR` / `DIFF_LINE_FLOOR` · `changeTotals` · 改动摘要行构造〔越阈降级 = 只摘要行 ∧ 零 `[data-file]`〕——审批卡面复用零副本，阈值 / 摘要形单源）」 |
| 7 | 7 | `PROJECT.md:100` / `:109` / `:288` | — | **Fixed** | `:100`「`thincoder-desktop/renderer/dom.mjs` \| 64 \| DOM 工具」· `:109`「`views/chrome.mjs` \| 101 \| 会话头 + 状态栏」——两说归一，与 §2.3 表（`:155` / `:156` 实读 64 / 101）同值 |
| 8 | 8 | 批档 `:58`（状态行）+ `:314`（§2.10 标题收正） | — | **Fixed** | 状态行现载「设计完成（五档落形 **24 处（计数收正）**…」；§2.11.2 号8「**24 处**（4 UI + 3 IPC + 4 RENDERER + 8 PROJECT + 5 SHELL）；状态行已随本轮更新」；本轮复算 §2.10 枚举 = 4+3+4+8+5 = 24 ✓ |
| 9 | 9 | 批档 `:315` + `:320`–`:329`（§2.11.3） | — | **Fixed** | §2.11.3 六行逐项注 §1.6 处置并作废裁前语气（如 `:327`「P-4 … **非冲突** …；「请裁是否对齐」作废」），该面已不再读作待办（P 项实体未复裁） |
| 10 | 10 | `PROJECT.md:122` / `:289` | — | **Fixed** | `:122`「消解窗口 = 该档下次被触碰的批；清单**十二档**同步 = `thincoder-desktop/test/files.mjs`。」（与同档 `:115` 用例模块行同值） |
| 11 | 11 | `PROJECT.md:135` / `:289` ↔ 批档 `:317` | — | **Fixed** | `:135`「**人工交互面**（人工走查）：键位 / 焦点 / 拖拽类 = T-DSK21（含本批卡面「同 `prompt-id` 重挂不夺焦」幂等条）」；§2.11.2 号11 另给 U69 键面两态断言 |
| 12 | 12 | 批档 `:318`（§2.5 ③） | — | **Fixed** | 「补句：**本批无信封产出点** ⇒ 判据 ③ 读作「配线两向 + 负例」（正例读数随供给批 —— §2.8 P-1）」 |

**复核轮 C-1–C-5 落地态**：C-1（节名 §2.7→§2.3）· C-2a（四档 · 11 处点，与 §2.11.1 号集 1+2+1+2+1+2+1+1 = 11 复算一致）· C-2b（四档变更记录 5 行 = `IPC.md:80` · `RENDERER.md:87` · `UI.md:74` · `PROJECT.md:288` / `:289`，逐行实读在位）· C-3c/C-3d/C-3e 目标行实读命中（`PROJECT.md:208` = T-DSK6 · `:223` = T-DSK21 · `:110` = `activity.mjs` 行）；C-3a/C-3b（`requirements/PROJECT.md:83` / `:84`）在评审射程外 = **未验证**；C-4 / C-5「零续改」与本轮实读一致。

**三链同值**：61 + U68–U75 = 69（`:211` / `:258`）· `files.mjs` 十 → 十二档三处同值（`:174` · `PROJECT.md:115` / `:122` · `SHELL.md:37`）· U51 键 20 → 34（`:182` / `:70` / `:127`）· 行数面互校 16 档与 `PROJECT.md` §4.1 逐值同值（含修复的两档）。

**新增问题**：**零**（修复只动设计四档 + 本档面；SHELL.md 本轮零改，实读无残留）。

**计数**：🔴 0 · 🟡 0 · 🔵 0（项 1–12 全数核销 · 零新增）。

**VERDICT: pass**

评审限制：源档面（行数 / i18n 键数 / 切片在册性 / `doc-check` 读数）不在射程，按未验证处理（本轮以设计五档间同值面互校代替）；`requirements/**` 两坐标（C-3a/b）同。

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 = **通过**（轮次 1 = changes-required（🔴2）→ 修复轮 **#72**（12/12）+ 复核轮 **#73**（9 处坐标收正）→ **轮次 2 = pass**（🔴 0 · 项 1–12 **全数核销** · 零新增））；② 修复主张经父侧核验（**两侧同值**：`docs/desktop/design/IPC.md:18` ↔ 批档 §2.11.1 载荷字段集 · `RENDERER.md:37` / `:38` ↔ §2.11.2 卡锚 token；门 = **悬空 7 / 行宽 18** 基线同值）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审轮次 1 + 轮次 2（§3）· §1.6 / §1.7 / §1.8 · §2.11（**修后为准**）。
- **批准射程** = §2 十节 + §2.11「修后为准」全部条目（**E-1…E-8** · **U68–U75** · 受影响面 **17 档** + 新档 4）；**不含**：agent 值面供给 · 设置 / 首启 · 打包 · 台账族在册项（#396–#408）。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（eng-coder 自写 · 闸 69/69 pass · doc-check 基线不变 · 终态 clean · 2026-09-26）

### 5.1 交付摘要（实施舱 · eng-coder）

**面**：源面 E-1…E-7（`renderer/views/approval.mjs` · `renderer/views/activity.mjs` · `renderer/pool.css` · `i18n.mjs` +34 键 · 预载白名单十项 · `HANDLERS` 末项 · `app.mjs` 池面接线）+ 用例面 U68–U75 八例 + `views-chrome.test.mjs` 的 U51/U52 原址更新。**设计档零改动**（drift 只披露，见 5.6）。

**闸（实施舱实跑）**：
- `cd thincoder-desktop && npm test` ⇒ **69/69 pass**（fail 0 · cancelled 0）——末次跑于拆档 + U71 补判据 + `fake-dom.mjs` 头注改正之后。
- 根 `node scripts/doc-check.mjs` ⇒ `FAIL(锚) 7 条悬空` + `FAIL(行宽) 18 行超 300 字符` = **基线不变**（全在 `docs/core`，本批零触碰）。

**实读行数（`node -e` 口径 · 尾行 = 末行计数）**：`test/views-chat.test.mjs` 246 · `test/views-chat-frame.test.mjs` 185 · `test/views-chrome.test.mjs` 232 · `test/views-locks.test.mjs` 107 · `test/views.test.mjs` 201 · `test/files.mjs` 9 行 / **十四档**。

### 5.2 决策透明表（拆档 + 越清单披露）

| 决策 | 内容 | 依据 | 清单关系 |
|---|---|---|---|
| 拆档 A | `views-chat.test.mjs` 365 → 246 + 新 `views-chat-frame.test.mjs`（U71 帧面整段搬出） | `docs/desktop/design/PROJECT.md:121`「**300 行 = 主动拆分层**（>300 即须拆分评审）」——**准确坐标 = `:121`**（父侧派单先写的 `:117` 实为同段批 3 行数回填行）+ `:119` 500 行硬限 + 批 6 `chat-*` 拆分先例 | **越清单**（新档） |
| 拆档 B | `views-chrome.test.mjs` 321 → 232 + 新 `views-locks.test.mjs`（U52 零回归面整段搬出） | 同上 | **越清单**（新档） |
| 清单同步 | `test/files.mjs` 十 → 十二 → **十四档** | §2.3:184 要求清单与两新档「同刻落」；U52 本体 = 清单↔盘上两向自检 | 清单内 |
| 指针改写 | `test/views.test.mjs:7-8`「（U49–U52）」→「（U49–U51）· 零回归锁面 `views-locks.test.mjs`（U52）」 | 拆档后指针失准（指针纪律） | **越清单**（注释一行 · §2.3:186 记为「零触碰」） |
| 头注改正 | `test/fake-dom.mjs:3` 消费档名 `views-chat` → `views-chat-frame` | 拆档后消费档集合变了（`grep`：现三档 = views-approval / views-activity / views-chat-frame） | **越清单**（注释一行 · §2.3 未列本档） |

**搬迁法（可复算）**：整档复制（`file_ops`）+ 整行区间删除 ⇒ U71 / U52 主体**按构造成分不变**（零逐字改编）；四档尾均 `})` 无尾空行。全量 **69 例齐**：U71 恰 `views-chat-frame.test.mjs:46` 一次、U52 恰 `views-locks.test.mjs:24` 一次 ⇒ 零复制式重复 / 零丢例。

### 5.3 审计与评审批次（终态）

| 批次 | 类型 | 范围 | 结论 |
|---|---|---|---|
| 内审 A | explore 分歧审计（只读） | 实施面（拆档前） | 无 🔴 |
| 代码评审 R1 | `advisor type="code"` | 渲染面 / 主进程 / 预载 / 测试面 | **VERDICT pass**（🟡×5 · 🔵×3） |
| 内审 B | explore 分歧审计（只读） | **终态**（拆档后） | 搬迁未见删减性缺陷；69 例齐 · 清单两向真判红；设计档 drift 属已裁定延后 |
| 代码评审 R2 | `advisor type="code"`（只验 fix claims） | 测试面 6 档（两新档 + 两原档 + 清单 + 指针） | **VERDICT pass**（fix claims 逐条核实落地 · 无新 🔴） |

终态：**clean**（无未决 🔴 / 无待修 must-fix；余项 = 🔵 与已披露延后项）。

### 5.4 fix 轮次（实施舱自修）

- **F1**：R1 🟡#1/#2 两档超 300 行 ⇒ 两处拆档（5.2）+ 清单同步。
- **F2**：R1 🟡#3 `CHAT_KEYS` 循环缺 `"pool"` 断言 ⇒ `views-locks.test.mjs:76` 补入（与源面 `app.mjs:46` 现状对齐）。
- **F3**：内审 B 缺口（§2.4:215 U71 输入列三行未覆盖）⇒ `views-chat-frame.test.mjs` 补判据：**待决项二**（`:55` · `:70-72` 两卡逐位 + `data-prompt-id` 序）· **卡在场 ↔ 缺席**（`:111-119` 两向 · 复入 ⇒ 卡插在药丸之前）· **无卡 ⇒ 尾块插在药丸之前**（`:149-158`）。补后单档 1/1 pass、全量 69/69 pass、该档 185 行 < 300。
- **F4**：R2 🔵#8 `fake-dom.mjs:3` 头注消费档名失准 ⇒ 改正（见 5.2）。
- 未修项 = 5.6 披露面（🔵 与设计侧归口项，本批不改）。

### 5.5 用例面落点（U68–U75）

`views-approval.test.mjs`（U68–U70 · 卡面两形与键位闭集 / 降级与接线两态 / 出口动作与负例）· `views-activity.test.mjs`（U72–U73 · 池面三族三态 / 折叠与两读数）· `host-floor.test.mjs`（U74 · 通道配线两向 + fail-loud）· `store.test.mjs`（U75 · 三切片定形 + `togglePool`）· `views-chat-frame.test.mjs`（U71 · 帧面）· `views-locks.test.mjs`（U52 · 零回归面）· `views-chrome.test.mjs`（U49–U51 原址）。

### 5.6 披露面（实施舱只披露 · 不代改）

**（a）设计档 drift（归实施后修正轮 · eng-designer）**：`PROJECT.md:115`（用例模块 **十二档** 枚举 + 逐档行数滞后）· `:121`（`views-chrome.test.mjs`（实读 256））· `:122`（`清单**十二档**同步`）· `:125`（U52 落点写 `views-chrome.test.mjs`）· `:131`（批 7 补两档枚举 / 原址补例）· `SHELL.md:37`（用例模块十二档枚举）· `pool.css` 实读 78 行 vs 设计档 ~40 号。

**（b）语义悬空 / 口径项（本批不改代码）**：R1 🟡#4 卡面 `data-autofocus` 锚零消费点（假 DOM 面不含 focus）· 🟡#5 池头读数「无供给 ⇒ 零节点」与 `store.mjs:42` 默认 `running: 0, approval: 0` 的张力（`UI.md:37` 原文实读可读，非「不可读」）· 🔵#6 帧内为等价比较离线建树（`chat.mjs:182/:190`）· 🔵#7 `fake-dom` 结构写计把离线建树计入（新档 `:97` 自述同口径）· 🔵#8 已修（F4）。

**（c）用例口径层（随设计档回填轮一并处置）**：U73 原文残句 · U72/U70 表外加固断言 · U13/U74 白名单断言轻度重叠 · O-1 `togglePool` 不可达支保留 · O-3 幂等口径张力（四根锚恒写）。

**（d）盘面残片（越清单 · 交父侧裁定 · 实施舱未动）**：`thincoder-desktop/x[1]).join('` —— 0 字节 · mtime 2026-09-25 21:07（本批窗口内）· 名形 = 命令行事故残片 · 零引用（清单 / 渲染面 / 主进程均不涉）⇒ 建议父侧确认后清理。

### 5.7 事实边界

- `thincoder-desktop/` 整目录**未纳入 git** ⇒ 无 diff 佐证；「搬迁零损」论证 = 整档复制 + 整行删除的工具语义 + 拆前拆后全量 69/69 + 逐档例数清点（工具语义为构造性保证，非逐字比对）。
- 内审 A/B 为只读舱（无执行手段 ⇒ 未跑套件）；套件读数为无——实跑读数见 5.1（实施舱执行）。
- 本段为实施舱自写（一段一作者）：以上每条读数均可在盘面复算（`node -e` 行数 · `npm test` · `node scripts/doc-check.mjs` · `advisor` 两轮报告）。

### 5.8 事实边界补注（F3 时序 · 供父侧收口时比对）

F3 的三组判据系实施舱在**内审 B 之后**自修补入（`views-chat-frame.test.mjs`），判据↔设计对照由实施舱自校（`:55` / `:70-72` ↔ §2.4:215「待决项二」· `:111-119` ↔ 在场/缺席两向 · `:149-158` ↔ 无卡尾块插点）；其独立复核情况**以 R2 报告的对象范围为准**（R2 对象含本档）。收口时若需独立复核，F3 三组 = 唯一「终态审计后新增」的子面，本段如实标记。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-26 05:36）

- **E-1…E-8 = 全 ✅**（§5 交付表）。**父侧亲跑**：`npm test` ⇒ **tests 69 · pass 69 · fail 0**（U68–U75 全绿 · U74 = 白名单十项末位 ∧ `HANDLERS ≡ CHANNELS` 两向 ∧ fail-loud · U51 = 34 键 + 八视图档零 CJK · U52 = 五槽接线结构）；冒烟 ⇒ `ok:true ∧ boot:"ok" ∧ served:18`；`renderer/views/approval.mjs`（150 行）逐行实读 = 设计形态（两形 / 键位闭集不吞键 / 最安全键目标 / **出口描述符单一 owner** / **零 `store.mjs` import = 结构性零写保证**）；**拆档实测**：`views-chat.test.mjs` **246** · `views-chat-frame.test.mjs` **185** · `views-chrome.test.mjs` **232** · `views-locks.test.mjs` **107** ⇒ 两档回层内 ✓。
- **越清单 5 条 = 全披露且各有依据** ✓（两拆档 = §1.9 裁定；`views.test.mjs:7-8` / `fake-dom.mjs:3` = 拆档随动；`files.mjs` = 同刻落）。

### 6.2 裁定与例外（承 §1.9 / §1.10）

拆档 = **本批清账**（取 A 案）✓；`pool.css` 77 vs 设计 ~40 = **收（以实读为准）**；0 字节垃圾档 = **已删**（零内容损失）；**#407**（`views-tabbar` 329）窗口**未触发**（本批不碰该档）✓。

### 6.3 修正轮核验（父侧 · 2026-09-26 05:53）

- **#76 五组 + 两条 off-dispatch 一致性补遗**（`SHELL.md:22` / `:27` / `:35` 四档树标记；**置焦表述三处对齐**（`PROJECT.md:107` / `:223` · `UI.md:55`）——防两版本共存）✓；门 = **悬空 7 / 行宽 18**（基线同值 · 本轮零新增）✓；名集三面 = **十四档**同值 ✓。
- **报面登记**：§2.11.4「拟新增 32」vs 机检 `pendingTotal` 29 = **不同口径**（标记引用处数 vs 列报项）⇒ 不作对账（列报面 · 不入闸）✓；**「真置焦执行」= 设计档 open 行（`docs/desktop/design/UI.md:29`）在册**（归后续批）✓。

### 6.4 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.11–§2.14 designer · §3 评审（**轮次 1 + 轮次 2**）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **21 档**（产品 11 + 测试 10，含新档 6）· 用例 **U68–U75**（总 69/69）· 条目 E-1…E-8 |
| 指针 | 台账 **#353** 在途 · **#407** 条件型（未触发）· **#408** 在册 |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | 无独立台账行；「真置焦执行」= 设计 open 在册 |
| 台账可见面 | 已查 ✓ |

### 6.5 结论

批 7（活动池 + 审批呈现）**收口**：审批卡（两形 / 键位 / 焦点目标 / 零乐观写）+ 活动池（三族 / 三态 / 折叠）+ **通道十项** + store 切片 + 词表 34 键；69/69 + 冒烟全绿；**评审两轮**（changes-required → 修复 12/12 + 复核 9 处 → pass）全链留痕；**收口序纪律（#404）四度守住**。
