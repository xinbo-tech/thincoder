# 2026-09-25 · 桌面端实施批 4（视图面次段 · 中区外壳）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 22:17「你直接自己跑完吧」（授权射程见批 3 档 §1.11）——父侧按设计 §4.1 序自推：批 3（左列）收口 ⇒ 批 4 = 视图面次段（中区外壳）。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 4 段）。前情 = docs/batches/2026-09-25-desktop-impl-3.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-26
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 22:17「**你直接自己跑完吧**」（授权射程与自缚条件见批 3 档 §1.11）——父侧按设计 §4.1 序自推：批 3（视图面首段 · 左列）已收口 ⇒ **批 4 = 视图面次段：中区外壳（标签条 + 会话头 + 状态栏）**。

### 1.2 本批交付目标

架在设计既有面（不新立设计主张，逐处引锚）：

1. **标签条**（`UI.md:15` 标签条行；`:13` = 布局行——父侧自校更正）：标签宽 ∈ `[1.75rem, 14rem]` · 溢出 = 横向滚动 + 两端渐隐（`mask-image`）· **非活动标签 `inert`**；
2. **标签状态位**（`UI.md` §2 项 2）：取值四态 = 运行中 / 待审批 / 完成 / 空闲 · **优先级 待审批 > 运行中 > 完成 > 空闲** · 来源 = store `deriveTabBadge`（批 2 已落）；
3. **会话头**（`UI.md:18`）：provider / 模型 / 推理档位 / 工程模式 / AUTO = **会话级**，随活动标签切换；状态栏不重复（同一事实只出现一处）；
4. **状态栏**（`UI.md:19`）：窗口级底行（批 1 已置位）；内容面按设计——**供给缺口项（如活动会话上下文占用）若无可供数据 ⇒ 只落骨架 + 标注延后**（不许假数据）。

### 1.3 判据（机器可核 · 待 §2 细化）

① 标签条静态树**脱 DOM 可机检**（零标签 / 单标签 / 多标签三态 + 溢出面标记）；② 状态位**四值优先级逐对成序**（纯函数面）；③ 会话头字段**随活动标签切换**（纯函数层可断言）；④ 词表键齐（零硬编码面向用户字符串）；⑤ **零回归**（38 用例不红 · 新增用例全绿 · 三包增量零（基线相对形）· doc-check 失败行集合无新增）；⑥ 判据形态沿 `docs/desktop/design/RENDERER.md` §1.1（纯描述符 + 薄挂载）。

### 1.4 边界（本批不含）

对话流 / 工具卡 / 审批卡（`views/chat*.mjs`）· 活动池（`views/activity.mjs`）· 设置 / 首启向导 · **agent 装配** · 打包分发 · **通道族扩展**（会话切换 / 会话操作通道若未落 ⇒ 同批内以 `disabled` + `data-action` **诚实形**，不假接线）· 主题切换面。

### 1.5 已知事实 / 依赖

- 批 3 已收口（左列 + `sessions:list` 通道 + 14 档）；批 2 的 store 已落四切片 + `openTab` / `closeTab` / `deriveTabBadge` / `visibleWindow`（标签面数据已就绪）。
- 设计锚：`docs/desktop/design/UI.md` §1（布局 / 标签条 / 会话头 / 状态栏 行）· §2（项 2 状态位优先级）· `docs/desktop/design/RENDERER.md` §1.1（视图形态）· `docs/desktop/design/PROJECT.md` §4.1（档位面）。
- **已知缺口（本批不修）**：台账 **#397**（`locale` 键无写者）· **#401**（启动态中区引导面）——均不阻塞本批。

### 1.7 首轮评审裁定 + 修复轮（父侧 · 2026-09-25 23:11）

- **#54 = pass**（🔴 0 / 🟡 4 / 🔵 5）——**九条全收** ⇒ 修复轮 **#55**（§2.11 形态 · 逐号 1–9 · 修后为准）。
- **逐号口径**：(1) U45 第三输入改**单标签态** + 补根锚断言（`data-slot`/`data-tabs`）· (2) U48 钉**描述符树面**（「重挂可重入」改树面等价断言或移人工走查）· (3) 测试档档位：补拆分预案**或**预算上限 &lt; 300 + §2.2 补 300 档位口径 · (4) U50 补**可见词面**断言（= `BADGE_WORD[码]`）+ N≥2 例或明示上限 = 1 · (5) `PROJECT.md:110` 数值随动（~90 → 实读 175 / 预算 ~300）· (6) U48 字形扫描限**字面量位**（先剥注释）· (7) i18n 行补档头随动（10 → 12 键 · `tab.*` 族）· (8) §2.4 ③ 补「值面随 T-DSK7」、⑤ 补「其余分量 = 父侧 §6 机检」· (9) 标签条常量面沿 U43 先例补机检**或**明示归人工走查 + 同步 `PROJECT.md:116`。
- **并发守则**：`docs/desktop/design/PROJECT.md` 与批 3 修正轮（#52）**共面** ⇒ **先 re-read 再写 · 只动点名行 · 写完回读双方行都在**（调度面按 `files` 声明自动串行）。
- **排程**：修复轮落 → 父侧核验 → **§4 代签**（依 §1.11 授权）→ 派实施。

### 1.8 跨批记账 + 一处父侧时序失误（父侧 · 2026-09-25 23:21）

- **批 3 修正轮（#52）落地**：设计档 4 处——`PROJECT.md` §4.1 已落档 **19 行去「（拟新增）」**（未落档 10 行保留）+ 节标题改「本端文件清单与行数预算」+ 用例模块行回填 **174** + 变更记录 +2；`SHELL.md` 树补 `src/main/sessions.mjs` 行 + `views/` 行补 **`chrome.mjs`**（跨批合并处置 ✓）+ 用例模块五档 → **六档**；`IPC.md` / `UI.md` 同源去标 + 变更记录。门 = **悬空 4 / 行宽 18**（基线同值 · desktop 面两项均 0）✓。
- **行数口径**：回填取**内容行数**（文末换行不计）= `i18n.mjs` 93 · `styles.css` 180 · `views.test.mjs` 174；含文末换行口径另读 +1（两读皆真）——批 4 行不回改，回填注已标口径 ✓。
- **父侧时序失误（如实记）**：批 3 档在 #52 落地**之前**已 `close` 冻结 ⇒ 其 §2.14 记账被「已收口档不回改」拒（**工具行为正确**）——**修正轮必须在收口冻结之前落地**（批 2 / 宿主底线轮即为此序；本批 4 收口时须守）。
- **落点裁定**：§2.14 拟稿（eng-designer 全文已附）**并入本档 §6 收口清单区**（前档已冻结 ⇒ 本档为唯一耐久面；设计档自身变更记录已留痕 ✓）；纪律教训入台账 **#404**。
- **#55（批 4 修复轮）**：#52 已 settle ⇒ 队列应自动释放（状态见本轮复核）。

### 1.9 实施后裁定（父侧 · 2026-09-25 23:56）

- **交付核验 = 通过**（父侧亲跑：`npm test` **46/46** · 冒烟 `boot:"ok" ∧ node:"24.21.0" ∧ served:10` · `views/chrome.mjs` 逐行实读 ✓）。
- **裁定四条**（对 §5 披露）：
  1. **行预算（⚠️）**：`test/views.test.mjs` **322**（>300 层）⇒ **注册例外 + 消解窗口**——二次拆分预案 = U49–U52 面拆 `views-chrome.test.mjs`，**执行 = 随该档下次触碰的批**；`views/sessions.mjs` 250（~240）· `app.mjs` 107（~105）⇒ **收（以实读为准）**。
  2. **标签条双锚**（容器 `div` + 树根 `nav` 同 `data-slot="tabs"`）⇒ **收**（设计定「挂载点 = 首子元素 + 树根带锚」，双锚为其直接推论）。
  3. **`mask-image` 常驻**（advisor 🔵①）⇒ **裁：常驻**（不溢出时视觉同一；条件化渐隐需运行期 JS = 形态单源已排除）。
  4. **两测试档 ~55 行重复**（advisor 🔵②）⇒ **收**（沿「每档自持」先例，不抽公共档）。
- **修正轮 #57 已派**（设计档随动：落档后标记/数值/档数收正 + 300 行层在册例外登记）；**依 #404 纪律：修正轮落地核验 ⇒ 才 close**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（中区外壳面（标签条 + 会话头 + 状态栏）· 落点 sessions.mjs / chrome.mjs · 用例 U45–U52）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**批次任务书**（中区外壳面 · 2026-09-25）

### §2.1 范围与条目逐面

| # | 面 | 需求锚（逐面凡例 = 一处置形态 + 一处判据 + 一处落点） | 判据 |
|---|---|---|---|
| E-1 | 标签条（标签 + 状态位 + 新建 / 关闭控件） | 需求档 §3.1 图 `:34`（`[ A ● ][ B ⚠ ][ C ] +`）· `:46`（可关 · 每标签带状态位）· UI.md §1 标签条行 `:15` · §2 项 2 `:37`（四值 + 优先序）· T-DSK20 | U45–U48 |
| E-2 | 会话头 | 需求档 §3.1 `:47`（槽字段 = `activeProvider` / `activeModel` / 工程模式 / AUTO · 推理档位随 provider 变）· UI.md §1 会话头行 `:18` · T-DSK7 | U49 |
| E-3 | 状态栏（告警位） | 需求档 §3.1 `:42`（位置）+ `:52`（跨会话告警位 · 上下文读数）· UI.md §1 状态栏行 `:19` | U50 |
| E-4 | 词表面增键（2 键 × 2 语） | UI.md §1 i18n 行 `:27`（不另立词表源）· `renderer/i18n.mjs` 档头 `:5-6`（两语键集相等律） | U51 |
| E-5 | 装配接线 | 批档 §1.2 交付项 · `renderer/app.mjs:86-89` 订阅面先例 | U52 |

**逐面落点契约**（命名沿 `railModel` / `railTree` / `mountRail` 三段式；挂载面 = 唯一触 DOM 处 · 不进自动面之外的路径）：

- `renderer/views/sessions.mjs`（增 · 左列面零改动）：`tabbarModel({ tabs, activeTab, rows, badges })` ⇒ `{ tabs: [{ key, title, active, badge }] }`（`badge` = `deriveTabBadge(badges[key] ?? [])`——优先序单源 `renderer/store.mjs:100-105`，视图只消费）；`tabbarTree(model, handlers)`；`mountTabbar(root, state, handlers)`（读切片 `tabs` / `activeTab` / `sessions` / `tabBadges`）。
- `renderer/views/chrome.mjs`（新档）：`headModel({ tab, meta })` / `headTree` / `mountHead`（读切片 `activeTab` / `sessionMeta`）；`statusModel({ tabs, activeTab, badges })` / `statusTree` / `mountStatus`（读切片 `tabs` / `activeTab` / `tabBadges`）。
- 树根机读锚：标签条 `nav[data-slot="tabs"][data-tabs=N]`；会话头 `[data-tab][data-meta="present|none"]`；状态栏 `[data-alerts=N]`。
- 位标词键（`BADGE_WORD`）：`approval` = `tab.badge.approval`（宿主新键）· `running` = `sub.running`（核词族键）· `done` = `sub.done`（核词族键）；`idle` ⇒ **零节点**（UI.md §2 项 2 四值面 · 需求档 §3.1 图 C 无位标）。核 i18n 无审批词条（实读 `thincoder-core/i18n.mjs:44-70` 无匹配）⇒ 增宿主键两语：`tab.badge.approval` = 待审批 / awaiting approval（词形随核状态词族小写）· `tab.action.close` = 关闭标签 / Close tab（字形住 `styles.css`，词面只走 `aria-label`）。
- 供给切片名（读面契约 · 本批恒缺省）：`tabBadges`（map 标签键 → states 数组；缺省 `{}` ⇒ 全空闲）· `sessionMeta`（已成形值串集：provider / model / effort / engineering / autoApprove；缺省 `null` ⇒ 零字段）。

**不在本批**（§1.3 已裁 · 与下述边界同源）：通道族（预载白名单四通道）不动 ⇒ 标签切换 / 关闭 / 新建 / 会话族载荷扩充**全不接线**（沿批 3 先例：`disabled` + `data-action`）；逐标签 states 供给 · 会话头字段供给 · 状态栏上下文读数 = 未落（**零节点**——禁假数据）；上下文 ≥ 80% 警示色 · `Ctrl/Cmd+1..9` · 关闭确认面 · 左列会话行位标面（UI.md `:24` 已派对话流批）；`views/chat*.mjs` / `activity.mjs` / `settings.mjs` / `onboarding.mjs` / `agent-host.mjs` / `store.mjs` / `dom.mjs` / 打包面 / 第三方依赖 / 需求档 = 零改动。

### §2.2 受影响文件表（现读行数 → 预算）

| 文件 | 现读 | 预算 | 改动 |
|---|---|---|---|
| `thincoder-desktop/renderer/views/sessions.mjs` | 146 | ~240 | 增标签条三段 + 位标词面（左列 `rail*` 三段零改动） |
| `thincoder-desktop/renderer/views/chrome.mjs` | 0（新档） | ~130 | 会话头 + 状态栏各三段 |
| `thincoder-desktop/renderer/index.html` | 34 | ~38 | `.session` 首子元素增 `[data-slot="tabs"]` 容器（骨架注释同步） |
| `thincoder-desktop/renderer/styles.css` | 181 | ~280 | 标签条（宽 ∈ [1.75rem, 14rem] · 溢出横滚 + `mask-image` 两端渐隐 · 非活动 `inert` 态）/ 位标 / 会话头字段 / 状态栏告警 + **字形面（`+` / `×` 的 `content`）** |
| `thincoder-desktop/renderer/i18n.mjs` | 94 | ~104 | HOST_DICT 增 2 键 × 2 语（`tab.badge.approval` · `tab.action.close`） |
| `thincoder-desktop/renderer/app.mjs` | 90 | ~105 | 增 `paintShell`（三槽挂载）+ 外壳订阅切片表 |
| `test/views.test.mjs` | 175 | ~300 | 增 U45–U52（U39–U44 零改动） |

清单与存档零改动：`test/files.mjs`（6 行 · 6 档两向自检不动）· `test/run.mjs` · `test/store.test.mjs`（U32 已锁优先序）。全档 < 500 行硬限；`styles.css` ~280 居顶（`PROJECT.md` §4.1 注行随动）。

### §2.3 用例表（脱 DOM · 纯函数面 —— 用例代码 = 实施舱写）

| # | 场景 | 输入（纯函数，无 DOM shim） | 预期输出 |
|---|---|---|---|
| U45 | 标签条三态 | `tabbarModel({})` ∥ `{ tabs: ["a","b"], activeTab: "b" }` ∥ `{ tabs: [], activeTab: null }` | 零标签节点 ∥ 两节点 · 序 = 标签序 · `data-active="1"` 恰在 `b` · 非活动标签带 `inert` ∥ 空条（零节点） |
| U46 | 位标四值 + 空闲零节点 | badges = `{a:["approval"], b:["running","done"], c:["done"], d:[]}` | `data-badge` = approval / running / done 各一；`d` 无位标节点；节点文本 = 词表值哨兵（`tab.badge.approval` / `sub.running` / `sub.done`）；`b` 取 running（优先序 = `deriveTabBadge` 消费面） |
| U47 | 标题缺省 | rows 命中标签键且 `title` 非空 ∥ `title` 空 ∥ 无命中行 | 用 `title` ∥ `t("rail.session.untitled")` ∥ `t("rail.session.untitled")`（不猜） |
| U48 | 未接线形 + 零字形 | 渲染标签条（含新建控件） | 每标签 = `disabled` + `data-action="tab:activate"`；关闭控件 `data-action="tab:close"` + `aria-label=t("tab.action.close")`；新建控件 `data-action="session:create"` + `aria-label=t("rail.action.newSession")`；重挂可重入；**视图两档源零字形字面**（扫 `+` `×` `●` `⚠` `✓`） |
| U49 | 会话头 | `{ tab: null, meta: null }` ∥ `{ tab: "b", meta: { provider, model, effort, engineering, autoApprove } }` ∥ 部分给值 | 根 `data-meta="none"` + 零字段 ∥ 字段序 = provider → model → effort → engineering → autoApprove · `data-field` 各一 · 文本 = 供给串（数据面非词表）· 根 `data-tab="b"` ∥ 只落给到的字段（不补空节点） |
| U50 | 状态栏告警位 | `{ tabs: ["a","b"], activeTab: "a", badges: {a:["approval"], b:["running"]} }` ∥ 活动码 done | 告警 = `b` 一条（活动标签的待审批**不出**——活动态由标签位承载）· `data-alerts="1"` · `data-alert="running"` · `data-tab="b"` ∥ 零告警 |
| U51 | 词键齐 | `HOST_DICT` 两语 + 全量渲染用例 | 两语键集相等（含新 2 键）；文本节点 ⊆ 词表值哨兵（含 `aria-label` 面）；两视图档源零 CJK |
| U52 | 零回归 | 全量测试 | 现 38/38 全绿；`test/files.mjs` 清单零改动；`store.mjs` / `dom.mjs` / 左列面零改动 |

### §2.4 判据（对齐批档 §1.3 ①–⑥ 逐条）

| §1.3 | 判据 | 落点 |
|---|---|---|
| ① | 标签条三态脱 DOM | U45（纯函数面 · node 进程无 DOM shim 即机证） |
| ② | 状态位四值成序 | U46（消费面）+ 单源已锁 = `test/store.test.mjs:128-132`（U32） |
| ③ | 会话头随活动标签切换 | U49 根 `data-tab` 随 `activeTab` 随动（结构机读核）；字段值端到端面 = T-DSK7（供给批 / 实机面） |
| ④ | 词表键齐 | U51 |
| ⑤ | 零回归 | U52 |
| ⑥ | 形态沿 `docs/desktop/design/RENDERER.md` §1.1 | 两档三段（model / tree / mount 各自可测）· 挂载面唯一触 DOM · 文案一律经 `t()` · 文本节点全哨兵（U45–U51 断言面即该形态机检） |

### §2.5 边界 · 依赖 · 上抛

- **边界**：见 §2.1 末段（通道族不扩 ⇒ 交互未接线；供给未落 ⇒ 零节点；非目标档零改动）。另不做：上下文 ≥ 80% 警示色 · 键盘切标签 · 关闭确认面 · 左列位标面。
- **依赖（上游 · 已落）**：批 2 store 标签面（`tabs` / `activeTab` / `openTab` / `closeTab` / `deriveTabBadge`）· 批 3 会话切片（`sessions` / `sessions:list`）· 词表面（`renderer/i18n.mjs`，本批增 2 键）· 骨架（`index.html` / `styles.css`，本批增槽位与样式）。
- **依赖（下游）**：回调 / 活动池批（填 `tabBadges`）· 会话族通道批（`sessionMeta` · 标签切换 / 关闭接线 · 关闭确认）· 对话流批（左列位标面）。
- **上抛**：① 逐标签 states 供给落点未定（活动池 / 回调批——本批只定消费契约与切片名）② 会话头字段 / 状态栏读数供给须**会话族载荷扩充**（现闭集 = `thincoder-desktop/src/main/sessions.mjs:14-16 ROW_FIELDS`，无 provider / 模型 / 档位 / 工程模式 / AUTO / 用量字段）——通道族扩展须另批 ③ 派单坐标更正：UI.md 标签条行实为 `:15`（`§1.2` 写 `:13`，`:13` = 布局行）④ 会话头 / 状态栏本批只落骨架 + 契约 + `data-meta="none"`，零字段面延后（供给未落，不猜词不加键）。

### §2.6 关键决策（含被否候选）

- **KD-a 标签条落 `views/sessions.mjs`**：原派单（`PROJECT.md` §4.1 `:103`）即「左列 + 标签条 + 状态位」；同族视图合并，预算 240 < 300。被否：新档 `tabbar.mjs`（拆档无收益）。
- **KD-b 会话头 / 状态栏 = 新档 `views/chrome.mjs`**：外壳件非会话族视图，且 `sessions.mjs` 接近中限。被否：并入 `sessions.mjs`（跨族混装）· 并入 `activity.mjs`（活动池面属他批）。
- **KD-c 位标词键取核词族键 + 宿主仅补审批键**：`running` / `done` 用核 `sub.running` / `sub.done`（词形单源）；核无审批词条 ⇒ 宿主新键。被否：3 键全走宿主（词形与核双份）· approval 借核 `error` / `stopped` 词（语义不符）。
- **KD-d 优先序不在视图复制**：视图收原始 states 调 `deriveTabBadge`（`store.mjs:100-105` 单源）。被否：视图内重写优先序（双源）。
- **KD-e 供给未落 ⇒ 零节点**：`data-meta="none"` / 零位标 / 零读数，不落占位假串。被否：假数据占位（禁）。
- **KD-f 字形住 `styles.css`（`content`）· 视图档零字面**：关闭 / 新建控件字形不落视图，词面经 `aria-label`。被否：字形字面落视图（破坏「视图档零硬编码文案」判据面）· 省略两控件（需求图 `:34` 有 `+`、`:46` 标签可关）。
- **KD-g 标签条槽位 = `index.html` `.session` 首子元素**（`[data-slot="tabs"]`）。被否：复用 `session-head` 槽（条与头语义不同）。

### §2.11 修复轮 #55（设计评审 §3 轮次 1 发现 1–9 全收 · 修后为准）

**裁定**：§3 轮次 1 = pass（🔴 0 / 🟡 4 / 🔵 5）；父侧裁「九条全收」。§2 为 append-only 段——**本节 = 修复轮收正块**：前文相关行如与本节相左，**一律以本节文字为准**；§2 其余条目（E-1–E-5 / KD-a–KD-g / 判据映射）零改动。

- **1｜U45 三态 + 根锚**：U45 第三输入 `{ tabs: [], activeTab: null }` ⇒ **单标签态 `{ tabs: ["a"], activeTab: "a" }`**（单节点 · `data-active="1"` 恰在 `a` · 零 `inert`）；三输入皆补根锚断言 `data-slot="tabs"` ∧ `data-tabs` = 标签数。§2.4 ① 同步：标签条三态判据读作「零 / 单 / 多标签」，其「溢出面标记」收正为**根锚 `data-tabs`**（溢出面运行时行为归人工走查）。
- **2｜U48 钉树面**：U48 输入收正为**纯描述符树面** `tabbarTree(tabbarModel(...), handlers)`；「重挂可重入」⇒ **重入等价**（同输入两次构树 `deepEqual`）。§2.3 表头补口径：本表 = 纯函数面（`*Model` / `*Tree`），**挂载面不自动**（依据 `docs/desktop/design/RENDERER.md` §1.1）。
- **3｜300 行档位 + 拆分预案**：§2.2 末行补 **300 行 = 主动拆分层**（>300 即须拆分评审）；`test/views.test.mjs` 预算 ~300 正压此界 ⇒ **预案** = 超限时 U45–U48 标签条面拆 `test/views-tabbar.test.mjs`（`test/files.mjs` 清单随增一行 · 该行预算「~300（档界）」）。§2.3 U52「`test/files.mjs` 清单零改动」加限定 **「未触发预案时」**。设计档同裁：`docs/desktop/design/PROJECT.md` §4.1 用例模块行 + 表下新段。
- **4｜U50 词表哨兵 + N=2 例**：U50 期望列补 **告警节点文本 = `BADGE_WORD[码]` 词表值哨兵**（与 U46 同哨兵面）；增 **N=2 例**（4 标签 · `b` / `c` 两告警 · 告警序 = 标签序 · `data-alerts="2"` · `d` 仅 `done` 零告警 = 码集边界）。
- **5｜行预算数值随动**：`PROJECT.md` §4.1 用例模块行 `~90` ⇒ **`~300（实读 175）`**（含文末换行口径——与同表 `styles.css` / `i18n.mjs` / `sessions.mjs` 行同）；表下「行数回填」注的 **174 = 内容行数口径**，两读皆真、既有声明，非新增张力。
- **6｜U48 字形扫描限字面量位**：U48「视图两档源零字形字面」扫描域收正 = **先剥注释**（照 `test/views.test.mjs:36-41` `stripComments` 先例）再取**字符串 / 模板字面量**内字形；**算符位不扫**（消假红面）。
- **7｜i18n 档头随动**：§2.2 i18n 行「改动」列补 **档头键数 / 键族注同步**（10 键 → 12 键 · 增 `tab.*` 族）。
- **8｜§2.4 两处残量**：③ 补 **「本批读作结构面，值面随 T-DSK7」**；⑤ 补 **「其余分量 = 父侧 §6 机检（三包基线相对形 + doc-check 行集合）」**。
- **9｜常量面机检（折进 U48 · 不新增用例号）**：样式面单源常量 `1.75rem` / `14rem` / `mask-image` 沿 U43 先例（`test/views.test.mjs:114-138`）机检：**命中 ⊆ `styles.css` ∧ 非注释各恰 1**（边界式计数），折进 U48 断言面。设计档 `PROJECT.md` 自动面 `views` 落点下补读法：**静态树面 + 常量驻留**（常量机检折进 U48）；运行时横滚 / 渐隐 / `inert` 归人工走查。

**号 → 收正位置**

| 号 | 批档（§2 · 本节为准） | 设计档 `docs/desktop/design/PROJECT.md` |
|---|---|---|
| 1 | §2.3 U45 · §2.4 ① | — |
| 2 | §2.3 U48 · §2.3 表头 | — |
| 3 | §2.2 末行 · §2.3 U52 | §4.1 用例模块行 · 表下新段（300 行主动拆分层） |
| 4 | §2.3 U50 | — |
| 5 | — | §4.1 用例模块行（数值） |
| 6 | §2.3 U48 | — |
| 7 | §2.2 i18n 行 | — |
| 8 | §2.4 ③ / ⑤ | — |
| 9 | §2.3 U48（折进） | 自动面 `views` 落点下行 |

**落笔与闸态（实读）**：设计档四处已改并回读——`PROJECT.md:110`（预算 `~300（实读 175）`）· `:116`（新段 · 215 字符）· `:121`（新子行 · 67 字符）· `:258`（变更记录本轮行 · 272 字符）；批 3 修正轮（#52）两行 `:256` / `:257` 并存未动 ✓。`node scripts/doc-check.mjs` 前后对比：悬空 **4 → 4**（全在 core 面 · 本端 0）· 行宽 **18 → 18**（PROJECT.md 0 条）· 拟新增 30 → 30 · 迁移期引文 215 → 215 · 候选 25339 → 25341（+2 = 本轮新增的两处 `thincoder-desktop/test/files.mjs` 锚，皆可解析）。**无新增失败面。**

**坐标注（实读漂移 · 报父侧）**：① §3 轮次 1 引用的**批档 §2 行号**（`:70` / `:72` / `:74` / `:76` / `:80` / `:83` / `:85` / `:93` / `:95` / `:97`）相对现档整体偏移约 −15（评审读的是早期版本）⇒ 本轮落点一律按**内容**锚定，非按行号。② §3 发现 3 / 9 引用的 `PROJECT.md:112` / `:116` 同为早期坐标：`:112` 现读 = 行数回填注（发现 3 所指「行宽 / 拆分预案」段实为现档 `:114`）；`:116` 现读 = 三分落点节标题（发现 9 所指「自动面 `views` 落点行」实为现档 `:118`）。③ `PROJECT.md:110` 现值 = `174（实读）`，与评审所述「~90 拟新增」不符（`~90` 系批前预估）⇒ 按盘上现值收正为 `~300（实读 175）`。

### §2.12 修后收正轮 #57（设计档漂移收正 · 修后为准）

**裁定**：设计档数值 / 标记 / 档数漂移由本舱收正（父派 3 组：① 数值 · 标记 · 档数 ② 300 层在册例外登记 ③ 两档 changelog）。§2 = append-only 段——**本节 = 收正块：前文相关行如与本节相左，一律以本节文字为准。**

**口径声明（表值单基）**：设计档 §4.1「实读」值本轮起**统一 = 内容行数口径（文末换行不计 = `wc -l` = `read` 工具总行数 − 1）**——本轮六档实测差恒 1。§2.11 第 5 条「（含文末换行口径）」为旧口径表述：两口径「两读皆真」；表值自此与 `PROJECT.md` §4.1 表下「行数回填」注（同口径）一致。派单 vs 实读差：`chrome.mjs` 派单 102 = `read` 工具口径，内容行数实读 **101**（只撤标记 · 不写数）；`styles.css` 派单「以实读为准」⇒ 回填 **270**（非旧值 181）。

**号 → 收正位置**（下表位置 = 设计档 · as-of 行号）

| 号 | 收正项 | 位置 |
|---|---|---|
| 1 | `styles.css` 实读 181 → **270** | `PROJECT.md:95` |
| 2 | `i18n.mjs` 实读 94 → **97** | `PROJECT.md:98` |
| 3 | `sessions.mjs` 实读 146 → **250** | `PROJECT.md:103` |
| 4 | `chrome.mjs` 行撤「（拟新增）」标记（已落档 · 不写数） | `PROJECT.md:104` |
| 5 | 用例模块行补第七档 `views-tabbar`（`~300（实读 228）`）· `views.test.mjs` 实读 175 → **322** | `PROJECT.md:110` |
| 6 | 「300 行主动拆分层」段改写（首轮拆分已落档）+ **在册例外**登记（二次拆分预案 · 消解窗口 = 该档下次被触碰的批） | `PROJECT.md:116–117` |
| 7 | 用例模块**六档 → 七档** + 补 `views-tabbar.test.mjs` | `SHELL.md:36` |
| 8 | changelog 各一条（本轮） | `PROJECT.md:260–261` · `SHELL.md:88` |

**实读读数表**（内容行数口径 · 本轮实测）

| 档 | 行数 | 处置 |
|---|---|---|
| `renderer/styles.css` | **270** | 回填（号 1） |
| `renderer/i18n.mjs` | **97** | 回填（号 2） |
| `renderer/views/sessions.mjs` | **250** | 回填（号 3） |
| `renderer/views/chrome.mjs` | **101** | 只撤标记（号 4） |
| `renderer/app.mjs` | **107** | 预算内（~120）⇒ 零改动 |
| `renderer/index.html` | **36** | 预算内（~60）⇒ 零改动 |
| `test/views.test.mjs` | **322** | 回填 + 在册例外（超 22） |
| `test/views-tabbar.test.mjs` | **228** | 第七档新登记（首轮拆分产物） |

（档名根 = `thincoder-desktop/`。）

**落笔与闸态（实读）**：`node scripts/doc-check.mjs` 前后**输出等长 51096**：悬空 **4 → 4**（既有 · 全 core 面；desktop 面 0）· 行宽 **18 → 18**（全 core / vsc 面；`PROJECT.md` / `SHELL.md` 0 条）· 拟新增 **27 → 27** · 迁移期引文 **215 → 215** · 候选 **25341 → 25347**（+6 = 新锚皆可解析 ⇒ 悬空 / 拟新增零增量）。**desktop 面零新增失败面。**

**观察（本轮不改 · 超派单射程 · 报父侧）**：`PROJECT.md:112`「批 3 收口 · 行数回填」注（时点性历史记录）值 93 / 180 / 174 与今日实读 97 / 270 / 322 并存——本轮未动；如需统一时点口径，由父侧另裁。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**轮次 1 发现表（设计评审 · 中区外壳面 · §2 条目 E-1–E-5 / 落点契约 / 受影响文件表 / U45–U52 / 判据 ①–⑥ / KD-a…KD-g）**

机器核过（盘上实读，只读行数 / 坐标，不改任何档）：`renderer/views/sessions.mjs` 146 ✓ · `renderer/index.html` 34 ✓ · `renderer/styles.css` 181 ✓ · `renderer/i18n.mjs` 94 ✓ · `renderer/app.mjs` 90 ✓ · `test/views.test.mjs` 175 ✓ · `renderer/views/chrome.mjs` 盘上无（新档 ✓）· 现测例 = 38 ✓（六档逐 `test(` 计数）⇒ 受影响文件表现读数**逐条准确**（仅 `PROJECT.md` §4.1 用例模块行滞后，见发现 5）。设计坐标抽检：`store.mjs:100-105` 优先序 ✓ · `test/store.test.mjs:128-132`（U32）✓ · `renderer/i18n.mjs:5-6` 两语键集相等律 ✓ · `src/main/sessions.mjs:14-16` ROW_FIELDS（无 provider / 模型 / 档位 / 工程模式 / AUTO / 用量字段）✓ · 核 `thincoder-core/i18n.mjs:50-54` 有 `sub.running` / `sub.done`、全档无审批词条 ✓（KD-c 成立）· `test/files.mjs` 清单只含 6 测例模块、`guard-closure` 走 import 闭包 ⇒ 新档免登记，「零改动」主张成立 ✓ · `initDict({locale,dict,host})` 支持核投影 / 宿主表注入口、`store.set` 按补丁键取值 ⇒ 新切片 `tabBadges` / `sessionMeta` 免改 `store.mjs` ✓。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Acceptance 覆盖 / 判据映射 | 🟡 | §1.3 ① 声明「零标签 / 单标签 / 多标签三态 + 溢出面标记」，而批档 `:80` U45 三输入实为 零标签 / 多标签 / 零标签（第三输入 `{ tabs: [], activeTab: null }` 与第一态重复，**单标签态缺失**）；落点契约声明的根机读锚（`:56` `nav[data-slot="tabs"][data-tabs=N]` = 溢出面标记）无任何用例断言；§2.4 ①（`:93`）仍记「U45 = 三态」⇒ 判据映射过度声明 | 第三输入改单标签态（`{ tabs: ["a"], activeTab: "a" }` ⇒ 单节点 · `data-active` 在 `a` · 零 `inert`）；补根锚断言（`data-slot="tabs"` + `data-tabs=N` = 标签数），把 ① 的「溢出面标记」落成机检面 |
| 2 | Clarity / 形态一致性 | 🟡 | U48（`:83`）面界模糊：§2.3 表头（`:76`）声明全表「脱 DOM · 纯函数面」，而 U48 输入写「渲染标签条（含新建控件）」、期望含「重挂可重入」（挂载面属性）；`RENDERER.md:27` 明记「挂载函数不进自动面（DOM 面随人工走查）」——按字面实施即与形态单源相抵 | 收正为树面（输入 = `tabbarTree(model, handlers)`；「重挂可重入」改树面等价断言：同输入两次构树结构相等），或把「重挂」移入人工走查面并在 §2.3 注明；若要自动测挂载面须同步改 `RENDERER.md` §1.1 口径（不可两处并存） |
| 3 | 受影响文件 / 档位 | 🟡 | `test/views.test.mjs` 预算 `~300`（`:72`）正压 300 行主动拆分档界（>300 即须拆分评审）且无拆分预案（`styles.css` ~280 有预案 = `PROJECT.md:112`）；§2.2 末行（`:74`）只给「全档 < 500 行硬限」、未提 300 档位 | 补拆分预案（如 U45–U48 标签条面拆 `test/views-tabbar.test.mjs`）或写明预算上限 < 300；300 行档位口径补进 §2.2 末行 |
| 4 | Acceptance（状态栏面） | 🟡 | U50（`:85`）只断言机读属性（`data-alerts` / `data-alert` / `data-tab`），无一条断言告警节点**可见文本 = 同一位标词**；`UI.md:19` 要求告警位「与标签位**同源同词**」⇒ 只落属性时该面不可见（E-3 交付面落空）。另多告警 N≥2 的序 / 上限未覆盖 | U50 期望列补「告警节点文本 = `BADGE_WORD[码]` 词表值」（与 U46 同哨兵面）；补 N=2 例（序 + `data-alerts="2"`）或明示本批上限 = 1 并在 §2.5 登记 |
| 5 | Doc state / 数值漂移 | 🔵 | `PROJECT.md:110` 用例模块行仍记 `views.test.mjs`（拟新增）~90，与本批现读 175（`:72`，盘上实读一致）与预算 ~300 不一致；该档「批 4」变更记录（`:250`）称预算行已按实读同步、漏此行 | 该行随批改「实读 175 → 预算 ~300」形（或注明「本行 = 预估，逐批按实读收正」） |
| 6 | Test fragility（R4） | 🔵 | U48 的「视图两档源零字形字面（扫 `+` `×` `●` `⚠` `✓`）」（`:83`）若按裸字符扫，`+` 为运算符字符（现档 `views/sessions.mjs` 的 `+` 只在注释——盘上实读），实现舱新增三段的任何算符 / 拼接即假红；判据本意是字形**字面** | 扫描限字面量位（先剥注释——照 `test/views.test.mjs:36-41` / U43 的 `stripComments` 先例，再扫字符串 / 模板字面量内的字形），或把扫描域写进用例文字 |
| 7 | Doc hygiene（档内自述） | 🔵 | `renderer/i18n.mjs` 档头自述（`:5-6`「左列 10 键 × 2 语」· `:15-16` 键族说明）未列入随动：增 2 键后档内自述与 `HOST_DICT` 不一致（10 vs 12 键、缺 `tab.*` 族） | 受影响文件表 i18n.mjs 行（`:70`）「改动」列补「档头键数 / 键族注同步（10 → 12 · 增 `tab.*` 族）」 |
| 8 | Acceptance 映射残量 | 🔵 | §2.4 两处残量：③（`:95`）的「字段随活动标签切换」值面只在实机 T-DSK7（已披露，须防 §6 按字面判 ③）；⑤（`:97`）四分量中「三包增量零」「doc-check 失败行集合无新增」在 U52 无落点，而本批已改 `UI.md` / `PROJECT.md` ⇒ doc-check 须重跑 | ③ 行补「本批读作结构面，值面随 T-DSK7」；⑤ 行补「其余分量 = 父侧 §6 机检（三包基线相对形 + doc-check 行集合）」 |
| 9 | Acceptance / 常量面 | 🔵 | 标签条常量面（标签宽 ∈ [1.75rem, 14rem] · 溢出 `mask-image` 两端渐隐，`UI.md:15`）无机器断言，而同形先例已有（`test/views.test.mjs:114-138` U43 机检断点常量「命中 ⊆ styles.css ∧ 非注释恰 1」）；`PROJECT.md:116` 把「中区外壳结构面 T-DSK20」归 views 自动面（U45–U52） | 沿 U43 先例补常量机检（`1.75rem` / `14rem` / `mask-image` 只住 `styles.css` 且非注释恰 1），或明示该面归人工走查并同步 `PROJECT.md:116` 归面表述 |

**范围外注（无严重度）**：① 新档 `views/chrome.mjs` 的目录树注落 `SHELL.md` §1（不在本评审范围；批 3 实施后修正轮 #52 在飞）——该档若逐行登记渲染面档需同批随动（未核）。② `renderer/index.html:15` 注释「`UI.md` §1 状态栏行只定内容 / writer、未定位置」与现 `UI.md:19`（已落位置）不一致——设计「骨架注释同步」（`:68`）射程应含此行。③ `data-action` 码 `tab:activate` / `tab:close` / `session:create` 与 `IPC.md` 通道族命名的对位未核（该档不在范围）——接线批须先对位，避免悬空承诺。

**计数**：🔴 0 · 🟡 4 · 🔵 5（发现 9 条；0 阻塞项）
**VERDICT: pass**

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 **#54 = pass**（🔴 0 · 4🟡 + 5🔵 **全收**）；② **修复轮 #55 已落地**（§2.11 · **9/9**）+ 父侧同轮抽核（§2.11 在位 · `PROJECT.md:110` / `:116` / `:121` / `:258` 实改 · 门 = **悬空 4 / 行宽 18** 基线同值 · 与 #52 的行 `:256/:257` **并存未动**）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审 = #54（pass）· 核验结论 = 上列读数 · 发现处置表 = §1.7（九条全收）+ §2.11（逐号对账 + 坐标注 + 落点微偏差披露）。
- **批准射程** = §2 六段 + §2.11「修后为准」全部条目（E-1…E-5 · U45–U52 · 受影响文件表 7 档 + 预案件 1 档）；**不含**：值面（会话头 / 状态栏数据供给 · 延后已登记）· 通道族扩展 · 未接线交互（诚实形）· 后续批面。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（7 档 + 预案 1 档 · npm test 46/46 · advisor 双 pass · fix round 1 · 终态 clean）



### 5.1 交付摘要（射程 = §2.2 七档 + §2.11 第 3 条预案档）

| 文件 | 落笔 | 现读（预算） |
|---|---|---|
| `thincoder-desktop/renderer/views/sessions.mjs` | 标签条三段（`tabbarModel` / `tabbarTree` / `mountTabbar`）+ `BADGE_WORD` 位标词面 | 250（~240） |
| `thincoder-desktop/renderer/views/chrome.mjs`（新档） | 会话头三段（`headModel` / `headTree` / `mountHead`）+ 状态栏三段（`statusModel` / `statusTree` / `mountStatus`） | 101（~130） |
| `thincoder-desktop/renderer/index.html` | `.session` 首子元素增 `[data-slot="tabs"]` 容器 + 骨架注释同步 | 36（~38） |
| `thincoder-desktop/renderer/styles.css` | 标签条（宽 ∈ [1.75rem, 14rem] · 横滚 + `mask-image` 两端渐隐 · 非活动 `inert`）/ 位标 / 会话头字段 / 状态栏告警 / 字形面（`+` · `×` 的 `content`） | 270（~280） |
| `thincoder-desktop/renderer/i18n.mjs` | HOST_DICT 增 2 键 × 2 语（`tab.badge.approval` · `tab.action.close`）+ 档头键数注（10 → 12） | 97（~104） |
| `thincoder-desktop/renderer/app.mjs` | `paintShell`（三槽挂载）+ `SHELL_KEYS` 订阅切片表（六键） | 107（~105） |
| `thincoder-desktop/test/views.test.mjs` | U45–U52（U39–U44 零改动） | 322（~300） |
| `thincoder-desktop/test/views-tabbar.test.mjs`（新档 · 预案触发） | U45–U48 标签条面 + 字面量游走（先剥注释） | 228 |
| `thincoder-desktop/test/files.mjs` | 清单 `views.test.mjs` 行后登记新档（行数不变 · 两向自检随动） | 6 |

**行数口径** = 内容行数（`read` 工具 / `PROJECT.md` §4.1 = +1 含尾行口径；两读皆真——§2.11 第 5 条既有声明）。**零改动面（实读）**：`renderer/store.mjs` · `renderer/dom.mjs` · 左列 `rail*` 三段 · `test/run.mjs` · `test/store.test.mjs`（U32 优先序锁）· 通道族 · 需求档 · 他批档 · 打包面。

### 5.2 决策透明表（实施侧裁定）

| # | 裁定 | 依据 / 含义 |
|---|---|---|
| D-1 | 标签条**双锚**（须披露）：容器 `div[data-slot="tabs"]` = 挂载点，树根 `nav[data-slot="tabs"][data-tabs=N]` = 结构面读数，两锚同槽同值 | 设计规定「挂载点 = `.session` 首子元素」+「树根带锚」⇒ 双锚为直接推论；非冲突（`app.mjs` 查容器锚，U45 / U52 断根锚） |
| D-2 | 三控件（标签 / 关闭 / 新建）**恒 `disabled` + `data-action`**；`tabbarTree` 的 `handlers` 参本版零消费 | 通道族未落 ⇒ 树形照落、事件面零接线（诚实非死控）；JSDoc 写明零消费与接线批替换义务 |
| D-3 | **首绘无显式调用**：`paintShell` 只由订阅触发 ⇒ 首绘 = 首个 `SHELL_KEYS` 切片写入（`locale` 变更或 `refreshRail` 的 `sessions` 写） | 随批 3「读面自持错误面」口径：读面失败 ⇒ 无切片写 ⇒ 本壳不绘；`app.mjs` 档头按实机制写明 |
| D-4 | 订阅切片表 = `SHELL_KEYS` 六键（`tabs` / `activeTab` / `sessions` / `tabBadges` / `sessionMeta` / `locale`） | 设计原文机制；`locale` 入表 = 文案随词表 ⇒ 树须重绘 |
| D-5 | 告警码**须有词键**（`ALERT_CODES` ⊆ `BADGE_WORD` 键）；无词键不落节点 | 同源同词；过滤在模型面 ⇒ `data-alerts` 恒 = 渲染节点数。本项为 fix round 1 新增守卫（防漂移 · 随例同式） |
| D-6 | 字形**只住** `styles.css` `content`；视图两档零字形字面 | U48 扫描域 = 先剥注释的字面量位（算符位不扫） |
| D-7 | **挂载面不进自动用例面** | 依据 `docs/desktop/design/RENDERER.md` §1.1；横滚 / 渐隐 / `inert` 运行面归人工走查 |

### 5.3 上抛父侧（待裁 / 知悉 · 实施舱未擅动）

1. **行数超预算三项**：`test/views.test.mjs` 322（超 22 · 预算 ~300）· `renderer/views/sessions.mjs` 250（超 10 · ~240）· `renderer/app.mjs` 107（超 2 · ~105）。`PROJECT.md:116` 的「300 行主动拆分层」对 `views.test.mjs` 现为**触发态**（322 > 300）：§2.11 第 3 条预案（拆 U45–U48 出 `views-tabbar.test.mjs`）已执行，仍未落回 300 内 ⇒ **二次拆分 / 口径裁定属设计面**，未擅动；两产品档的二次拆分同属射程外。
2. **`mask-image` 常驻**（advisor 轮次 1 发现 4 · 🔵）：样式面常量驻留形与「溢出才渐隐」的语义差 ⇒ 若接受常驻须父侧一句裁定，否则归运行面走查；未擅改。
3. **两测试档公共件重复 ~55 行**（advisor 轮次 1 发现 6 · 🔵）：`stripComments` / `walk` / 词表哨兵两档各持一份；沿仓内「每档自持」先例（`guard-closure.test.mjs` / `host-floor.test.mjs` 同式），未抽公共档。
4. **设计档漂移（只报不改 · eng-designer 产权）**：`PROJECT.md:104`（`chrome.mjs`「（拟新增）」标记）与 `:116`（`views-tabbar.test.mjs`「拟新增 · 预案件」）**两处标记到期未撤**；`:110` 用例模块行未登记第七档（且「实读 175」过期，现 322）；`:98` i18n「实读 94 行」· `:103` sessions「实读 146 行」两注随本批落档过期（现 97 / 250）；`SHELL.md:36` 用例模块**六档**句（现为七档）。
5. **doc-check 拟新增 30 → 27（差 3 · 减向 · 非回归）**：本批两档落档 ⇒ 三处「（拟新增）」锚行转正（`PROJECT.md:104` / `:116` · `SHELL.md:86`——`chrome.mjs` 两处 + `views-tabbar.test.mjs` 一处，与 −3 吻合）。
6. **advisor 轮次 1 报告一处 host 引文不匹配**（`UI.md:19`）：实读该行内容正确（告警 = 非活动标签位标码 · 同源同词）⇒ 属引文形式问题，非内容问题。

### 5.4 审计与评审轮次（终态 = clean）

| 轮 | 类型 | 结论 |
|---|---|---|
| — | 内部分歧审计（explore 子代理） | OUT-OF-LIST **0** · SILENT-SIMPLIFICATION **0** |
| 1 | advisor code review | **pass**（🔴 0 · 🟡 1 非 must-fix · 🔵 5） |
| fix round 1 | 本舱自修 | 4 修 / 2 上报不改（明细见下） |
| 2 | advisor code review（验修复声明） | **pass**（5 条修复声明逐条核实 · 引用 5/5 命中现档 · 0 新问题） |

**fix round 1 明细**：① 发现 1（🟡）= `app.mjs` 档头改写为实触发机制（行为零改 · 不添显式首绘）；② 发现 2（🔵）= `sessions.mjs` JSDoc 明写「本版零消费 + 接线批须替换等价断言」；③ 发现 3（🔵）= `chrome.mjs` 加词键守卫 + 档注同步；④ 发现 5（🔵）= `views-tabbar.test.mjs` 用例文字写明「被扫两档无正则字面量」假设与失效处置。**上报不改**：发现 4（`mask-image` 常驻语义差）· 发现 6（公共件重复）——理由见 §5.3 第 2 / 3 条。

### 5.5 验证读数（本舱实跑 · 修复轮后）

- `npm test`（`thincoder-desktop`）= **tests 46 · pass 46 · fail 0 · exit 0**（含 U45–U52）。
- 逐档 `node --check`：六个 `.mjs` 改档 + 新档全通过；`index.html` / `styles.css` 非 JS ⇒ 由测试面（U45–U48 / U51 / U52）覆盖。
- `node scripts/doc-check.mjs` = 悬空 **4**（全 core 面 · 本端 0）· 行宽 **18 条**（全 core / vsc 面 · desktop 0）· 拟新增 **27** · 迁移期引文 215——**无新增失败面**（FAIL 4 / 18 属既有基线）。
- **冒烟诚实口径**：`boot:"ok"` = 渲染面读回，非逐槽 DOM 断言；三槽 DOM 形与运行时行为归人工走查（D-7）。
- **超清单改动 = 零**（改动全落 §2.2 七档 + 预案档 + `test/files.mjs` 清单项）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-25 23:56）

- **E-1…E-7 = 全 ✅**（+ 一项 ⚠️ 行预算 · §6.2 已裁）。**父侧亲跑**：`npm test` ⇒ **tests 46 · pass 46 · fail 0 · exit 0**（U45–U52 全绿）；冒烟（清 env + 二进制直调）⇒ `{"node":"24.21.0","floorMet":true,"boot":"ok","served":10,"errors":[],"ok":true}`；`renderer/views/chrome.mjs` **逐行实读** ✓（三面各三段 · 字段序单源 · 只落非空串 · `data-meta` 两态 · 告警 = 非活动标签 approval/running + **`BADGE_WORD` 词面** · 优先序消费不复写 · 零假数据）。

### 6.2 裁定与例外（承 §1.9 · 台账 #405 在册）

① `test/views.test.mjs` **322**（>300 层）⇒ **注册例外 + 消解窗口**：二次拆分预案 = U49–U52 面拆 `views-chrome.test.mjs`，执行 = 该档下次被触碰的批；② `views/sessions.mjs` 250 / `app.mjs` 107 超预估 ⇒ **收（以实读为准）**；③ `mask-image` **常驻** = 裁定收；④ 标签条双锚与两测试档 ~55 行重复 = 收（推论 / 先例）。

### 6.3 修正轮核验（父侧 · 2026-09-26 00:09）

- **#57 落地**：`PROJECT.md:95`（styles 270）/ `:98`（i18n 97）/ `:103`（sessions 250）/ `:104`（撤标）/ `:110`（七档 + `views.test` 322）/ `:116-117`（拆分层 + **在册例外**）/ `:260-261`（变更记录）· `SHELL.md:36`（七档）/ `:88` · 批档 §2.12（`:174-210`，含**口径声明** = 内容行数）✓；门 = **悬空 4 / 行宽 18 / 拟新增 27 / 引文 215** 全等基线 ✓。
- **折叠记账（批 3 修正轮 #52 的 §2.14 拟稿 · 前档冻结 ⇒ 并入本区）**：落点 = `PROJECT.md` §4.1 已落档 **19 行去「（拟新增）」** + 节标题改「本端文件清单与行数预算」+ `:110` 回填 + `SHELL.md` 树补 `src/main/sessions.mjs` / `views/chrome.mjs` + 用例模块五档→六档 + `IPC.md` / `UI.md` 同源去标 + 行数回填注（93 / 180 / 174 时点值）；门 = 悬空 4 / 行宽 18；**纪律教训 = 台账 #404**（修正轮先于 close —— **本批已守** ✓）。

### 6.4 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.11 + §2.12 designer · §3 评审（轮次 1）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **10 档**（6 改 + 新档 `views/chrome.mjs` / `views-tabbar.test.mjs` + `test/files.mjs` 登记 1 项 + 本批档）· 用例 **U45–U52**（总 46/46）· 条目 E-1…E-5 |
| 指针 | 台账 **#353**（滚动在途）· **#405** 新立（322 二次拆分 · 条件型）· #403 在册 |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | 无独立台账行（程序级 #353 滚动）；#405 = 条件型 |
| 台账可见面 | 已查 ✓ |

### 6.5 结论

批 4（视图面次段 · 中区外壳）**收口**：标签条（含状态位 / 新建 / 关闭控件）+ 会话头 + 状态栏告警位 + 词表 10 → 12 键；46/46 + 冒烟全绿；**收口序纪律（#404）本批已守**。
