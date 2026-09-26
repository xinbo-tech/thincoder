# 2026-09-25 · 桌面端实施批 3（视图面首段 · 左列）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 22:07「批3按默认」——批 3 = 桌面端实施程序**第三段**：按设计 §4.1 顺序做**视图面**（父侧 20:47 呈报的默认切法 = 左列会话列表 → 标签页 → 对话流…），用户取默认。
> 台账 = #353（桌面端程序 · 滚动在途 · 本批 = 第 3 段）。前情 = docs/batches/2026-09-25-desktop-impl-2.md §6（已收口 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 22:07「**批3按默认**」——批 3 = 桌面端实施程序**第三段**：按设计 §4.1 顺序做**视图面**（父侧呈报的默认切法 = 左列会话列表 → 标签页 → 对话流…），用户取默认。

### 1.2 本批交付目标

**视图面首段 = 左列（项目区 + 会话列表）**——架在设计 §4.1 的 `renderer/views/sessions.mjs` 面（该档设计线 = 左列 + 标签条 + 状态位）。

**首选切法（父侧裁）**：**左列一件**——

1. **项目区**：当前项目 + 最近目录列表；**启动态**（无当前项目）= 中区最近目录列表 + 打开目录入口（`UI.md:23`），退回启动态 = 左列项目区入口；
2. **会话列表**（当前项目的槽面）：核 `sessions:list` 读面（`IPC.md:31` 行）· 每行 **来源端标注** = `createdBy`（CLI / 扩展端 / 桌面端 · **缺键（老槽）⇒ 不标注** · 禁以「占用端」冒充 · `UI.md` §2 项 3）；
3. **空态**：无会话 ⇒ 左列新建入口（`UI.md:22`）；
4. **折叠断点**：< **900px** ⇒ 左列折叠为图标条（单常量 · `UI.md:14` · 数值保 open）；
5. **词表**：左列 / 空态 / 启动态 / 来源端键（`t()` 面 · 供给 = `config:read` 语言面）。

**若设计档的档位切分（`views/sessions.mjs` 含标签条）使左列不可单独落** ⇒ 可在 §2 提切法（含拆档方案）并论证，父侧核。

### 1.3 判据（机器可核 · 待 §2 细化）

① 新通道 **`sessions:list`** 端到端可用（载荷 = 列表项含 `createdBy`）；② 左列**三态**（有会话 / 无会话 / 无当前项目）渲染可机检——**注意：零框架零依赖 ⇒ 视图模块判据须可脱 DOM 机检**（形态由 §2 定形，如「纯构造函数返回结构描述符 + 薄挂载」）；③ 来源端标注三态（标 CLI / 扩展端 / 桌面端 · 缺键 ⇒ 不标）；④ 折叠断点**常量单源**；⑤ 词表键齐（左列面无硬编码面向用户字符串）；⑥ **零回归**（桌面 `npm test` 增量零 · 三包增量零（基线相对形）· doc-check 失败行集合无新增）。

### 1.4 边界（本批不含）

对话流 / 工具卡 / 审批卡（`views/chat*.mjs`）· 活动池（`views/activity.mjs`）· 设置与首启向导（`views/settings.mjs` / `onboarding.mjs` · `src/main/settings.mjs`）· **agent 装配**（`agent-host.mjs`）· 打包分发 · **标签条交互切换**（若切法含标签条：仅其静态形态 + 状态位读取）/ 状态栏内容面 · 主题切换面（跟随系统即可）。

### 1.5 已知事实 / 依赖 / 已知缺口

- 批 2 已收口 ⇒ `sessions:list` 的**数据面已就绪**（端壳转口 `listSlots` / `slotOccupancy` ✓ · `createdBy` 三态已机检 ✓）；本批 = 加通道 + 渲染面。
- 设计锚：`docs/desktop/design/UI.md` §1（布局 / 断点 / 标签条 / 状态词 / 空态 / 启动态 / i18n 行）· §2（项 3 来源端标注）· `docs/desktop/design/IPC.md` §2（`sessions:list` 行）· 需求档 §3.1 / §3.5。
- **已知缺口（本批不修）**：台账 **#397**（`locale` 键无写者 ⇒ 语言切换无供给）——不阻塞默认面渲染。

### 1.7 §2 落地核验 + 设计轮上抛裁定（父侧 · 2026-09-25 22:16）

- **§2 落地**（十节 · `:45-163`）+ 设计档四处（`RENDERER.md` §1.1 视图形态 · `IPC.md` 会话族注 · `UI.md` 左列行 + 档头面清单 · `PROJECT.md` 逐档预算 + 自动面落点）——父侧抽核实读 ✓。
- **视图面形态定形（本批关键设计点）**：**纯描述符 + 薄挂载**——两层分家：① 纯构造函数（`railModel` / `railTree` ⇒ `{tag,props,children}` 描述符树 · **脱 DOM 可断言**）；② 唯一构造点 `dom.build()` + `mountRail`；文案一律经 `t()` · **零第三方依赖** ✓（不引 jsdom / happy-dom）。
- **上抛裁定**：
  - **R-1 收**：`test/host-floor.test.mjs:79` 与 `test/projects.test.mjs:165` 的通道数断言随批 **3 → 4**（+ 披露）；与 #45 在飞面**不冲突**（其改 = 版本字面，非通道数）。
  - **R-2 / R-3 收**：运行标记 / 待审批位随对话流 / 审批批；空态新建入口与会话行点击 = `disabled` + `data-action`（接线随会话族通道批）。
  - **R-4 裁定 = 延后 + 入账**：启动态**中区**引导面在设计 §4.1 无落点档 ⇒ 本批只落左列；中区启动态随对话流批（设计档补一行）——台账 **#401**。
  - **R-5 收**（折叠态图标条内容随图标集批；本批只落常量单源）· **R-6 记录**（`src/main/projects.mjs` 121 行 > 预估 ~90，未越 300 硬限，本批不改）。
- **§2 两行 >300 字符**（`:54` 322 · `:57` 444）：批档不在 `lineWidth` 扫描域；**append-only 不回改**（改写既有行 = 绕段白名单机制）⇒ **照留 + 记档**（子代理只报不改 = 正确处置）；后续 append 控宽。
- **评审**：设计评审**已发**（#47 · 本块落地后同轮点火）——**通过后逐条裁定 → 修复轮（如需）→ 再请 §4 批准**（修复在飞期间不请批）。

### 1.8 评审点火 + 一处父侧调度更正（父侧 · 2026-09-25 22:17）

- **设计评审已发**（本轮点火 · 对象 = §2 十节 + 设计锚四处新增面）；**通过后逐条裁定 → 修复轮（如需）→ 再请 §4 批准**。
- **父侧调度更正（如实记）**：22:16 父侧误把「发评审」打成了**重复的设计师派单**（同一 initial 任务书二次派发，id 47）——**当轮发现并即取消**（该子代理刚起步、仅读文件、**零写入**）；随后按原意点火评审。**批面零影响**（无档、无代码、无评审产物受影响）。

### 1.9 首轮评审裁定 + 修复轮（父侧 · 2026-09-25 22:21）

- **#48 = pass**（🔴 0 / 🟡 5 / 🔵 4）——**九条全收** ⇒ 修复轮 **#49**（§2.13 形态 · 逐号 1–9 · 修后为准）。
- **逐号口径**：
  1. 🟡 U43 扫描式 ⇒ 改「能匹配 `900px` 形态」的口径 + 期望命中集语义钉死（声明一处 / 注释不计；现盘实读 `styles.css:108` 注释 · `:109` media）。**不写补丁**（形态由你在 §2.13 定）。
  2. 🟡 E-6 git 读数 ⇒ **基线相对形**（或收窄代码路径）+ 写明「文档面不计入」。
  3. 🟡 2.4(a) 错误形 ⇒ **删去** `{error:{code,message}}`，改按既有口径「失败 ⇒ 抛错 ⇒ `invoke` 拒绝」（先例 `config:read`）；错误码语义如需 ⇒ 记上抛，**不本批落**。
  4. 🟡 `UI.md` §1 补「左列启动态 = 打开目录入口 + 最近目录列表」落点（**你的笔权面**·与 §1.2 一致）；中区面延后口径（R-4 / #401）一并注明。
  5. 🟡 §2.3 补 `≤±N`（既有 8 行）+ 两随动档现状行数（**实读**）。
  6. 🔵 E-3 锚点坐标 ⇒ **你实读校正**（评审给 `:37,39` 系二手读数，父侧已疑为 `:38/:40`——**以实读为准**）。
  7. 🔵 随动字面同步：两测试档四处「三」字面（`:74`/`:79` · `:159`/`:165`）随 R-1 一并点名。
  8. 🔵 §2.3 / 2.4 点明左列数据路径（`project:recent` + `sessions:list` → store 切片 → `railModel`）。
  9. 🔵 U38 用例名/说明：读数面 = 「主进程读面 + 白名单」（线面由 fail-closed 注册 + 冒烟承接）。
- **排程**：修复轮落 → 父侧核验 → **§4 代签**（依 §1.11 授权）→ 派实施。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修复轮 1 已落（§2.13 · §3 轮次 1 逐号 1–9 + 父侧追加 1 条））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮次**：initial（首轮任务书）· 编写 = eng-designer · 承接面 = 本档 §1（§1.2 交付目标 1–5 · §1.3 判据 ①–⑥ · §1.4 边界 · §1.5 已知缺口）。

**本批一句话**：左列视图面（项目区 + 会话列表 + 三态 + 词表）落成可核项 —— 完成时 `sessions:list` 端到端出左列行数据、左列三态与来源端标注以**脱 DOM 机检**读数、折叠阈值单常量可核、词表零硬编码、三包增量零。

### 2.1 条目表（E-1…E-6 = §1.3 判据 ①–⑥ 逐条交付物）

| 条目 | §1.3 判据 | 交付物 | 机检读数形式 | 设计锚 |
|---|---|---|---|---|
| E-1 | ① 新通道端到端 | preload 白名单 +1 · `src/main/sessions.mjs`（新）· `ipc.mjs` 处理表项 · `sessions:list` 返回 `{ cwd, rows }` | `npm test` 退出码 0；U37（白名单四项定序）· U38（无项目 ⇒ `cwd:null` + `rows:[]`；有槽 ⇒ 行字段集如 2.4（e）） | `docs/desktop/design/IPC.md` §2 会话族注 |
| E-2 | ② 左列三态脱 DOM 机检 | `renderer/views/sessions.mjs`（新）纯函数 `railModel` / `railTree` + 薄挂载 `mountRail`；`dom.mjs` 增 `build` | U39（三态判定 + 树根 `data-state` 三值）· U40（启动态树含 `project:open` 入口 + 最近目录项 · 零会话行） | `docs/desktop/design/RENDERER.md` §1.1 · `docs/desktop/design/UI.md`:13,22,23 · `docs/desktop/design/UI.md` §1 左列会话行 |
| E-3 | ③ 来源端标注三态 | 行映射：`createdBy` 三值 ⇒ 端标；缺键（`""`）⇒ **无标** | U41（三值各带标且文案 = 词表键值；`""` ⇒ 行内**无**标节点）· U42（`title` 空 ⇒ 缺省词，非空串） | `docs/desktop/design/UI.md` §2 项 3（`:37,39`） |
| E-4 | ④ 折叠断点常量单源 | 断点 `900` 只住 `styles.css` 一处；渲染面 JS 零阈值副本、零 `matchMedia` | U43（源扫描：`\b900\b` 命中集 ⊆ `styles.css` 1 处 ∧ 渲染面零 `matchMedia`） | `docs/desktop/design/UI.md`:14 |
| E-5 | ⑤ 词表键齐 · 零硬编码 | `i18n.mjs` `HOST_DICT` 10 键 × 2 语（`rail.action.openDir` / `rail.recent.title` / `rail.sessions.title` / `rail.project.none` / `rail.empty.hint` / `rail.action.newSession` / `rail.session.untitled` / `origin.cli` / `origin.vscode` / `origin.desktop`） | U44（两语键集相等 ∧ keys ⊇ 10 键 ∧ 树文本 = 键哨兵映射 ∧ 视图档源零 CJK） | `docs/desktop/design/IPC.md`:36 · `docs/desktop/design/UI.md` §1 i18n 行 · `docs/desktop/design/RENDERER.md` §1.1 |
| E-6 | ⑥ 零回归 | 不改核、不引依赖 | `git status --porcelain` 非空行全以 `thincoder-desktop/` 起头；`node scripts/doc-check.mjs` 失败行 ⊆ 基线 + 本批新增行；`npm test` 全绿 | 本档 §1.3 ⑥ |

### 2.2 本批不覆盖（对回 §1.4 + 分批位移）

- 对话流 / 工具卡 / 审批卡（`views/chat*.mjs`）· 活动池（`views/activity.mjs`）· 设置与首启向导（`views/settings.mjs` / `onboarding.mjs` · `src/main/settings.mjs`）· agent 装配（`agent-host.mjs`）· 打包分发 —— §1.4 逐项。
- **标签条**：§1.4 口径为「若切法含标签条：仅其静态形态 + 状态位读取」；本批**连静态形态亦不落**——左列单落（决策 D-1），标签条随视图面下一段入同档。
- 状态栏内容面 · 主题切换面（跟随系统即可）—— §1.4。
- **运行标记与待审批位**：需渲染面挂起表 / 回合事件 ⇒ 随对话流 / 审批批（`docs/desktop/design/IPC.md` §2 会话族注项 4）；本批位标面 = `isActive` 当前活动槽标。
- 台账 **#397**（`locale` 键无写者 ⇒ 语言切换无供给）不修（§1.5 已知缺口）。

### 2.3 受影响文件表

| 文件 | 现状 | 改动 | 归属 |
|---|---|---|---|
| `thincoder-desktop/src/preload/preload.cjs` | 24 行 | `CHANNELS` 增第 4 项（定序见 2.4（b）） | 本批 |
| `thincoder-desktop/src/main/sessions.mjs` | 新档（~70 行） | 会话族读面：`listSessions(cwd)` → `{ cwd, rows }` | 本批 |
| `thincoder-desktop/src/main/ipc.mjs` | 66 行 | 注册 `sessions:list` 处理表项（转口 `sessions.mjs`） | 本批 |
| `thincoder-desktop/renderer/dom.mjs` | 51 行 | 增 `build(node)`（唯一 DOM 构造点，与 `el()` 同入参面） | 本批 |
| `thincoder-desktop/renderer/i18n.mjs` | 67 行 | `HOST_DICT` 增 10 键 × 2 语 | 本批 |
| `thincoder-desktop/renderer/views/sessions.mjs` | 新档（~150 行） | 左列：`railModel` / `railTree` / `mountRail`（标签条 / 状态位留同档后续段） | 本批 |
| `thincoder-desktop/renderer/app.mjs` | 50 行 | 左列挂载 + `project:open` 接线（打开目录 / 点最近项） | 本批 |
| `thincoder-desktop/renderer/styles.css` | 117 行 | 左列行样式 + 折叠单常量（`900` 一处） | 本批 |
| `thincoder-desktop/test/session-contract.test.mjs` | 138 行 | +U37 / U38 | 本批 |
| `thincoder-desktop/test/views.test.mjs` | 新档（~90 行） | U39–U44 | 本批 |
| `thincoder-desktop/test/files.mjs` | 5 行 | 清单 +1 项（`views.test.mjs`） | 本批 |
| `thincoder-desktop/test/host-floor.test.mjs` | `:79` 三通道硬断言 | 改**四通道**（随动 · 见 R-1，披露不静默） | 随动 |
| `thincoder-desktop/test/projects.test.mjs` | `:165` 三通道硬断言 | 改**四通道**（随动 · 见 R-1） | 随动 |

`test/guard-closure.test.mjs` 不动（闭包随 `ipc.mjs` 顶层 import 自动扩张）。核面（`@thincoder/core`）零改动。

### 2.4 接口契约

**(a) IPC（单源 = `docs/desktop/design/IPC.md` §2 会话族注；本表只引不重述）**：`sessions:list` —— 入参无（cwd 取主进程当前项目内存态）；返回 `{ cwd: string|null, rows: Row[] }`；错误形 `{ error: { code, message } }`。未打开项目 ⇒ `{ cwd: null, rows: [] }` = **非错误**（渲染面读作启动态）。

**(b) preload 白名单（定序）**：`CHANNELS = ["config:read", "project:open", "project:recent", "sessions:list"]`（冻结数组；顺序供 U37 断言）。

**(c) 渲染面视图契约（单源 = `docs/desktop/design/RENDERER.md` §1.1）**：视图档导出 `xxxModel(state)` / `xxxTree(model)` / `mountXxx(root, state)`；描述符 = `{ tag, props, children }`；唯一 DOM 构造点 = `dom.build(node)`。

**(d) 左列导出面（`renderer/views/sessions.mjs`）**：`railModel({ projectCwd, recent, rows })` → `{ state: "boot"|"empty"|"list", rows, recent }`；`railTree(model)` → 描述符树（根 `data-state` = `model.state`）；`mountRail(root, state, handlers)`。

**(e) 行形（左列消费，字段名与 (a) 同源）**：`{ slot, title, createdBy, updatedAt, messageCount, isActive }`。渲染映射 —— `title` 空 ⇒ `t("rail.session.untitled")`；`createdBy` ∈ `cli|vscode|desktop` ⇒ `t("origin.<值>")`，`""` / 未知值 ⇒ **无标**；`isActive` ⇒ 行 `data-active="1"`。

**(f) 主进程读面**：`listSessions(cwd)` —— `cwd` 空 ⇒ `{ cwd: null, rows: [] }`；否则 `listSlots(cwd)`（端壳转口）→ 逐行投影 6 字段。**零新增算法**：不落新存储、不重算摘要、不扫目录名。

### 2.5 用例表（U37–U44 · 接续现状最大 U36）

| # | 用例 | 输入 | 期望输出（断言） | 面 |
|---|---|---|---|---|
| U37 | 白名单定序 | 载 `preload.cjs` | `CHANNELS` = 2.4（b）四项链 ∧ `Object.isFrozen` | node |
| U38 | `sessions:list` 三态端到端 | 临时 sessions 目录：无项目 / 有槽族（`createdBy` 三值各一 + 缺键一个） | 无项目 ⇒ `{cwd:null, rows:[]}`；有槽 ⇒ `cwd` = 输入 ∧ 行集字段 = 2.4（e）∧ 缺键行 `createdBy === ""` | node（`_setSessionsDirForTest`） |
| U39 | 左列三态判定 | 三组输入（无 cwd / 有 cwd 无行 / 有行） | `railModel().state` = `boot` / `empty` / `list` ∧ 树根 `data-state` 同名 | node |
| U40 | 启动态树 | `state:"boot"` + 两条最近目录 | 树含 `project:open` 动作节点 ∧ 最近目录项顺序 = 输入序 ∧ **零会话行** | node |
| U41 | 来源端三态 | 四行（`cli` / `vscode` / `desktop` / `""`） | 前三行带标且文案 = `t("origin.<值>")`；`""` 行无标节点 | node |
| U42 | 标题缺省 | 一行 `title: ""` | 行标题文本 = `t("rail.session.untitled")`（非空串） | node |
| U43 | 折叠常量单源 | 渲染面源码扫描 | `\b900\b` 命中集 ⊆ `styles.css` 1 处 ∧ 渲染面零 `matchMedia` | node（读源） |
| U44 | 词表键齐 + 零硬编码 | `HOST_DICT` / 视图档源 / 树 | 两语键集相等 ∧ keys ⊇ 10 键 ∧ 树内文本全 = 键哨兵映射 ∧ 视图档源零 CJK | node |

用例模块落点：U37 / U38 → `test/session-contract.test.mjs`；U39–U44 → `test/views.test.mjs`（新档，须登记 `test/files.mjs`）。挂载 / DOM 面不设自动用例（随人工走查）—— `docs/desktop/design/PROJECT.md` §4.1 三分落点口径。

### 2.6 关键决策（D-1…D-6）

- **D-1 排布落点 = `renderer/views/sessions.mjs` 面，不新立档、不拆档**：左列以「纯函数导出面」独立成件（导出 `railModel` / `railTree` / `mountRail`），标签条 / 状态位留同档后续段。满足 §1.2 末段「左列可单独落」的诉求 —— 无需拆档。**被否**：新建 `views/rail.mjs`（与设计 §4.1 格位重复立档）。
- **D-2 视图形态 = 纯描述符构树 + 薄挂载**（判据 ② 的形态定形，落设计单源 `docs/desktop/design/RENDERER.md` §1.1）。**被否**：① jsdom 类 —— 第三方依赖，违反零依赖；② 字符串模板自测 —— 结构不可机检。
- **D-3 会话行投影新档 `src/main/sessions.mjs`**：会话族读面自成一件（后续批 create / switch / resume 之家）。**被否**：折入 `projects.mjs`（已 121 行 > §4.1 预估 90，见 R-6）· 折入 `ipc.mjs`（~200 行上界）。
- **D-4 载荷只出 6 字段**：核 `listSlots` 条目的 `date` / `updatedDate` 是本地化显示串（非机器读数）、`firstMessage` 非左列所需 ⇒ 不载。行渲染所需集 = 2.4（e）。
- **D-5 运行标记 / 待审批位本批不载**：需渲染面状态源（挂起表 · 回合事件）；**宁可空位不编造**（判据 ② / ③ 不要求该位）。位标面暂 = `isActive`（`docs/desktop/design/IPC.md` §2 会话族注项 4）。
- **D-6 打开目录入口单键 `rail.action.openDir`**：左列启动态入口与中区启动态入口共用一词条（中区面归属未裁 —— 见 R-4）。

### 2.7 边界（本批不做）

- 不新增通道族（仅 +1 通道 `sessions:list`）；不改核（`@thincoder/core` 零改动）；不引第三方依赖。
- **不认领活动槽**：`isActive` 只读（不写 manifest、不发端壳认领）。
- 不落标签条 / 状态栏 / 活动池 / 设置 / 首启向导 / agent 装配 / 打包面（§1.4）。
- 不落运行标记 / 待审批位（D-5）、不落空态与行点击的通道接线（R-3：按钮渲染为 `disabled` + `data-action`，诚实非死控）。

### 2.8 上抛项（R-1…R-6）

- **R-1 两处既有通道硬断言随动**：`test/host-floor.test.mjs:79` 与 `test/projects.test.mjs:165` 现断言**三通道** ⇒ 本批必改**四通道**。属一致性面随动，本批按「随批改 + 披露」处理（未静默）——请裁是否照此随动。
- **R-2 运行标记 / 待审批位未载**：`docs/desktop/design/IPC.md`:31 载荷要素的裁剪 ⇒ 随对话流 / 审批批补（消费面 = 标签条 / 状态栏）。
- **R-3 空态新建入口 / 会话行点击的接线未落**：需 `session:create` / `session:resume`（本批不落）⇒ 渲染为 `disabled` + `data-action`；接线随会话族通道批（仅改 `app.mjs`）。
- **R-4 启动态中区引导面归属待裁**：`docs/desktop/design/UI.md`:23 的启动态含中区面，本批只落左列；设计 §4.1 视图族无中区启动态落点档（`views/chat.mjs` 还是新档？）——本批不落。
- **R-5 折叠态图标条内容形态未定形**：零图标集 ⇒ 本批只落常量单源（U43）；图标条形态随图标面批。
- **R-6（披露，非请裁）**：`src/main/projects.mjs` 现 **121 行** > §4.1 预估 ~90（批 2 落地）——本批不改（未越 300 硬限），仅登记。

### 2.9 三方一致对照（§1.3 判据 ↔ 条目 ↔ 用例 ↔ 设计锚）

| §1.3 判据 | 条目 | 用例 | 设计锚（单源） |
|---|---|---|---|
| ① | E-1 | U37 / U38 | `docs/desktop/design/IPC.md` §2 会话族注 |
| ② | E-2 | U39 / U40 | `docs/desktop/design/RENDERER.md` §1.1 · `docs/desktop/design/UI.md`:13,22,23 |
| ③ | E-3 | U41 / U42 | `docs/desktop/design/UI.md` §2 项 3 |
| ④ | E-4 | U43 | `docs/desktop/design/UI.md`:14 |
| ⑤ | E-5 | U44 | `docs/desktop/design/IPC.md`:36 · `docs/desktop/design/UI.md` §1 i18n 行 |
| ⑥ | E-6 | 无新用例（读数 = `git status --porcelain` + `node scripts/doc-check.mjs` 输出 + `npm test`） | — |

需求档用例挂钩（引自 `docs/desktop/design/PROJECT.md` §4.1 自动面落点，不重述其正文）：E-2 / E-3 的渲染面 = T-DSK1 / T-DSK2 / T-DSK3。

### 2.10 编号索引

本批新增编号：条目 **E-1…E-6** · 用例 **U37…U44**（接续现状最大 U36）· 决策 **D-1…D-6** · 上抛 **R-1…R-6**。

### 2.13 修复轮 1 收正（§3 轮次 1 · 九条全收 + 父侧 22:28 追加一条 · **修后为准**）

**出处 / 口径**：本节 = 本档 §3 轮次 1（#48 · pass · 🔴0 / 🟡5 / 🔵4）逐号 1–9 的处置 + §1.9 父侧「全收」裁定 + 父侧 22:28 追加（doc-check 增量 1 条）。
凡 2.1–2.10 与本节相抵处，**以本节为准**；行数口径 = **内容行数**（`read` 行号最大值 · 文末换行不计——同批 2 §5.2）。（§2.11 / §2.12 号段本批未用——§1.9 口径指向本节。）

**1（🟡 U43 判据形态）**：扫描式 = `/(?<![0-9A-Za-z_])900(?:px)?(?![0-9A-Za-z_])/`——`\b900\b` 否决（`900px` 的 `0` 与 `p` 两词字符间无边界 ⇒ 零命中）。
域 = `thincoder-desktop/renderer/**`；判据 = **非注释命中恰 1**（`styles.css:109` `@media (width < 900px)`）∧ 注释命中允许（`:108` 注释行——实读命中）∧ 渲染面 `.mjs` 零 `matchMedia`（实读零）。命中集语义：命中行 = 断点声明本身；`px` 后缀与裸 `900` 同判（式内 `(?:px)?`）。

**2（🟡 E-6 读数形）**：`git status --porcelain` 改**基线相对形**——实施开工刻取快照，判据 = 相对该快照的**新增行**全以 `thincoder-desktop/` 起头；**`docs/**` 不计入**。三项读数同刻基线口径：doc-check 判据 = 失败行集合**不新增**（非「零失败」）· `npm test` 全绿。

**3（🟡 2.4(a) 错误形）**：`{ error: { code, message } }` **删去**（2.4(a) 以本节为准）；失败面 = 既有口径「**抛出 ⇒ `invoke` 拒绝**」（先例 = `thincoder-desktop/src/main/ipc.mjs:23-25` 头注 + `:27` `loadConfig()` 直抛；路径无效面 = fail-soft 正常载荷，同档 `:40-49`）。本批 `sessions:list` 无可预期失败分支（未打开项目 = `{cwd:null,rows:[]}` 正常态）。错误码语义如需 ⇒ **上抛 R-7**（本批不落；§2.10 索引不回改——R-7 以本节为记）。

**4（🟡 UI.md 启动态落点 · 已落笔）**：`docs/desktop/design/UI.md:23` 单行收正——启动态 ⇒ **左列** = 打开目录入口 + 最近目录列表（点最近项直接进入）+ **中区引导面延后**（落点档未裁——视图族落点 = `docs/desktop/design/PROJECT.md` §4.1；台账 #401）⇒ 同一列表只落左列一处（对回 `UI.md:18` 单点取向）；同档变更记录补 1 行（`:65`）。

**5（🟡 §2.3 增量上界 + 随动行数 · 修后口径 · 实读）**：

| §2.3 行（序同原表） | 现状实读 | Δ 上界 |
|---|---|---|
| `src/preload/preload.cjs` | 23（原记 24 = 含文末换行读数，差一） | ≤ +1 |
| `src/main/sessions.mjs`（新档） | — | ~70（≤ 90） |
| `src/main/ipc.mjs` | 66 | ≤ +5 |
| `renderer/dom.mjs` | 50（原记 51 = 同差一） | ≤ +20 |
| `renderer/i18n.mjs` | 67 | ≤ +22 |
| `renderer/views/sessions.mjs`（新档） | — | ~150（≤ 200） |
| `renderer/app.mjs` | 50 | ≤ +40 |
| `renderer/styles.css` | 117 | ≤ +45 |
| `test/session-contract.test.mjs` | 138 | ≤ +70 |
| `test/views.test.mjs`（新档） | — | ~90（≤ 150） |
| `test/files.mjs` | 5 | +1 |
| `test/host-floor.test.mjs` | 92（评审读 ≈93 = 含文末换行） | ±0（字面替换 · 结构不变） |
| `test/projects.test.mjs` | 193（评审读 ≈194 = 同） | ±0（同上） |

拆档判据：13 行（含上界）全 < 300 ⇒ **无需拆分案**（`styles.css` 117 + 45 = 162 亦远低于 300）。

**6（🔵 E-3 锚 · 实读校正）**：`UI.md` §2 项 3 = `:38`、旁证 = `:40`（`:37` = 项 2 · `:39` = 空行）⇒ 2.1 的 E-3 行（`:87`）所载 `:37,39` 以本节为准（2.9 的 E-3 引用未带行号——无需随动）。旁见（**只报不改**）：`thincoder-desktop/src/main/session-slots.mjs:33` 注释同引旧对（代码面——随实施轮）；冻结档 `docs/batches/2026-09-25-desktop-impl-2.md:78` / `:118` / `:228` 同引旧对（as-of 记录面，不回改）。

**7（🔵 随动字面 · 三改一保留）**：评审列四处 ⇒ **三改** = `test/host-floor.test.mjs:79`（「数据面三条」→四条）· `test/projects.test.mjs:159`（用例名「白名单三项」→四项）· `:165`（「白名单三项 + 顺序」→四项）；**一保留** = `test/host-floor.test.mjs:74`「预载档三面」——头注 `:5` 自证「三面」= **三断言面**（主进程可读不抛 / 平 node 装配判红 / 主侧读取面），非通道数 ⇒ 保留原字面（改后失真）。两档 Δ ±0。

**8（🔵 左列数据路径）**：启动（或切项目后）取 `invoke("project:recent")` + `invoke("sessions:list")` → 写 store 切片（`renderer/store.mjs:26-27` 的 `project` / `sessions` 槽；store.mjs **零改动**，写面 = `app.mjs` 的 `store.set`）→ 交 `railModel({ projectCwd, recent, rows })`（2.4(d)）→ `railTree` → `mountRail`；open 后刷新链引单源 = `docs/desktop/design/IPC.md` §2 项目面注项 3（`:56`）。

**9（🔵 U38 读数面 · 名/说明）**：U38 名/说明改「`sessions:list` 三态（**主进程读面**：`src/main/sessions.mjs` + 白名单）」；**线面不入 node 用例**——`ipc.mjs:9` 顶层 `import { dialog, ipcMain } from "electron"` ⇒ 平 node 不可导入；线面由 ① fail-closed 注册（`ipc.mjs:57-66`；白名单项无处理体 ⇒ `:60` 抛）② 冒烟读数（`main.mjs:29` `channels` = 实际分发集合）承接。

**10（父侧 22:28 追加 · doc-check 增量收正 · 已落笔）**：`docs/desktop/design/PROJECT.md:247` 的 `views/sessions.mjs` = 不可解析形（悬空第 5 条）⇒ 改**带路径全名** `thincoder-desktop/renderer/views/sessions.mjs`（与同档 `:103` 同形——拟新增面 · 列报不入闸）。复跑预期 = 悬空 **4**（= 开工前基线；余 4 = 核面既有）· 行宽 18 不变。

**号 → 位置表**（号 = §3 表行号；10 = 父侧追加）：

| 号 | 处置（一句） | 落点 |
|---|---|---|
| 1 | 判据形态改扫描式（含 `px`） | 本节 1（2.5 U43 行以本节为准） |
| 2 | E-6 改基线相对形 + `docs/**` 不计入 | 本节 2（2.1 E-6 行以本节为准） |
| 3 | 删错误形（抛出 ⇒ reject） | 本节 3（2.4(a) 以本节为准） |
| 4 | 启动态左列落点 + 中区延后 | `docs/desktop/design/UI.md:23` · 同档 `:65` |
| 5 | Δ 上界 13 行 + 随动两行现状 | 本节 5 表（2.3 表以本节为准） |
| 6 | E-3 锚改 `:38,40` | 本节 6（2.1 / 2.9 以本节为准） |
| 7 | 随动字面三改一保留 | 本节 7（实施轮落字面） |
| 8 | 左列数据路径点明 | 本节 8（2.3 / 2.4 以本节为准） |
| 9 | U38 名/说明收窄读数面 | 本节 9（2.5 U38 行以本节为准） |
| 10 | PROJECT.md 锚形态改全名 | `docs/desktop/design/PROJECT.md:247` |

**不覆盖**（本次修复轮不做）：代码面（含 §3 发现 7 的三处字面——归实施轮）· 需求档 · 冻结档（批 1 / 批 2 记录不回改）· 台账写面（#401 由父侧落）。

**补记（本节 10 的落形精化 · 实读两跳）**：① 改**带路径全名** ⇒ 复跑仍悬空（标记族判定 = **行标记**，非全名可解）；② 行内补 **「（拟新增」（全角左括号起）** 标记（单源 = `scripts/doc-check-anchors.mjs:57`）⇒ 归「拟新增——列报 · 不入闸」族。

**收正后 fresh 读数**：悬空 **4**（= 开工前基线；余 4 皆核面既有 = `MODEL-SPECS.md:323` / `:1372` / `:1465` · `SESSION.md:850`）· 行宽 **18**（不变）· 拟新增 32 → 33（+1 = 本节 10）。
**可复用口径**（实施轮 / 后续批）：指向**未创建**文件的路径行须带「（拟新增」标记，否则悬空照红；裸文件名（无 `/`）走符号面、不触本闸。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审轮（设计评审 · 首轮）** · 对象 = 批档 §2 十节（2.1–2.10）+ 设计锚四处新增面（`RENDERER.md` §1.1 · `IPC.md` §2 会话族注 · `UI.md` §1 左列会话行 + §2 项 3 · `PROJECT.md` §4.1 预算行）。**判定 = 无 🔴** ⇒ pass；🟡 5 · 🔵 4。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据（判据④ · E-4 / U43） | 🟡 | U43 扫描式 `\b900\b` 与盘上实形不符：`900px` 的 `900` 后接 `p`（词字符）⇒ 无词边界 ⇒ **零命中**（现盘只两处 `900`：`thincoder-desktop/renderer/styles.css:108` 注释「宽 < 900px」· `:109` `@media (width < 900px)`）；且「⊆ styles.css **1 处**」与实况（同档两处文本命中）不符——按「恰一处」读 ⇒ 正确实现即判红；按「只在 styles.css」读 ⇒ 检查空转（`900px` 形态的任何副本都不被命中）。判据④的唯一机检读数因此不成立。 | 扫描口径改为能匹配数值记号（含 `px` 后缀）的形态；期望命中集/计数语义钉死（例：断点声明 = `styles.css` 唯一 `@media (width < 900px)`，注释行不计入）——具体形态由实施轮定，此处只提口径须先钉。 |
| 2 | 验收判据（判据⑥ · E-6 读数形） | 🟡 | E-6 的 git 读数取**绝对形**（「`git status --porcelain` 非空行全以 `thincoder-desktop/` 起头」），而本轮设计面已动 `docs/desktop/design/*.md` 四处 + 本批档（变更记录在案：`RENDERER.md:57` · `IPC.md:68` · `UI.md:64` · `PROJECT.md:247`）⇒ 只要这些 `docs/` 面改动仍在工作区，读数必含非 `thincoder-desktop/` 起头的行而判红；同一行另两项读数（doc-check / `npm test`）都是**基线相对形**，三项口径不一致。 | 改为基线相对形（实施前留 `git status` 基线快照、只比新增行）或收窄到代码路径（三包 + 核），并把「文档面改动不计入」的口径写明。 |
| 3 | 一致性 / 单源（2.4(a)） | 🟡 | 2.4(a) 声明「单源 = `IPC.md` §2 会话族注；本表只引不重述」，但其中**错误形 `{ error: { code, message } }`** 在单源零命中（`IPC.md` §2 会话族注四项只定载荷与行字段语义；`docs/desktop/**` 全域检索无此形）⇒ 新元素未落单源、无触发条件、无消费面、U38 亦无错误路径用例；实现现状的失败口径是「抛错 ⇒ `invoke` 拒绝」（`thincoder-desktop/src/main/ipc.mjs:23-25`）与 fail-soft 返回正常载荷（同档 `:40-49`）两种，`{error}` 形是第三种。 | 或把错误形 + 触发条件落进 `IPC.md` §2 会话族注（单源）并补一条错误路径用例；或删去该错误形、按既有「抛错 ⇒ reject」口径收正 2.4(a)——二选一，不留未接线元素。 |
| 4 | 文档面状态（U40 ↔ 锚） | 🟡 | U40 要求启动态树含**最近目录项**（左列承载最近目录列表），而锚面把该列表记在中区（`UI.md:23`「启动态 ⇒ 中区 = 最近目录列表 + 打开目录入口；退回启动态 = 左列项目区入口」），左列行（`UI.md:24`）只记三项（标题 / 来源端标 / 活动槽标）⇒ 锚面缺该落点记录；叠加中区启动态归属未裁（R-4）⇒ 中区面后续落地后同一列表两处呈现，与档内「同一事实只出现一处」取向（`UI.md:18`）相抵。 | 在 `UI.md` §1 启动态行/左列行补记「左列启动态 = 打开目录入口 + 最近目录列表」这一落点（或反向把 U40 收窄为仅入口），使锚与批档一致。 |
| 5 | 受影响文件标注（判据8口径） | 🟡 | §2.3 表 13 项：既有 8 行只有现状行数 + 定性改动，**无 `≤±N` 预期增量**；两项随动（`test/host-floor.test.mjs` ≈93 行 · `test/projects.test.mjs` 194 行）未给现状行数。抽核：8 项现状行数与盘上逐一对上（preload 24 · ipc 66 · dom 51 · i18n 67 · app 50 · styles.css 117 · session-contract 138 · files.mjs 5）；新档三件（~70 / ~150 / ~90）与改后预估均未越 300 线 ⇒ 无需拆分案。 | 按判据补 `≤±N`（改动极小的可写「结构不变」）并补两行现状行数；`styles.css` 117 行增量后仍远低于 300（写明即可）。 |
| 6 | 引用准确性（E-3 锚） | 🔵 | E-3 锚点写 `UI.md` §2 项 3（`:37,39`）——实盘 `:38` = 项 3（会话行「来源端」标注）、`:40` = 旁证行；`:37` = 项 2、`:39` = 空行。同批其余锚点实核无误（`IPC.md:36` · `UI.md:14` · `:13,22,23` · `:23`）。 | 更正为 `:38,40`（同错对亦见于实现档注释，见本档外注）。 |
| 7 | 随动字面（R-1 面内细节） | 🔵 | 改「三通道 → 四通道」时，随动两档的字面同含「三」：`test/host-floor.test.mjs:74` 注释「U13 预载档三面」· `:79` 消息「白名单 = 数据面三条（顺序锁定）」· `test/projects.test.mjs:159` 用例名「preload 白名单三项顺序」· `:165` 消息「白名单三项 + 顺序（U27）」——只换数组字面会留旧口径。 | 随动时同步这四处字面（或写明「保留旧名」的口径）；R-1 的处置本身已裁，此处只提字面同步。 |
| 8 | 清晰度（app.mjs 数据路径） | 🔵 | §2.3 只写「左列挂载 + `project:open` 接线」，未写左列数据从哪来/何时取：渲染面已有槽位是 store 的 `project.{cwd,recent}` / `sessions`（`thincoder-desktop/renderer/store.mjs:26-27`，注释「消费面随后续批」），而 2.4(d) 入参名为 `projectCwd` / `recent` / `rows`——两份命名的对接无一句交代。 | 在 2.3/2.4 点明数据路径（启动取 `project:recent` + `sessions:list` → store 三切片 → 交 `railModel`），使实现轮与人工走查同一口径。 |
| 9 | 清晰度（U38「端到端」射程） | 🔵 | U38 名「端到端」实际只能到 `src/main/sessions.mjs`（`ipc.mjs` 顶层 `import { dialog, ipcMain } from "electron"` ⇒ 平 node 不可导入；U19 已示范 `_setSessionsDirForTest` 沙箱用法）；通道注册面由 fail-closed 注册表（`ipc.mjs:56-66`：白名单项无处理体即抛）+ U37 覆盖 ⇒ 结论成立，仅用例名易被读作已覆盖线面。 | 用例名/说明写清读数面 = 「主进程读面 + 白名单」（线面由 fail-closed 启动抛 + 冒烟承接），免误读。 |

计数：🔴 0 · 🟡 5 · 🔵 4 · 合计 9。
VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 §4 批准 —— 父侧代签（用户 2026-09-25 22:17「你直接自己跑完吧」授权）

- **三条件齐备**：① 设计评审 **#48 = pass**（🔴 0 · 5🟡 + 4🔵 **全收**）；② **修复轮 #49 已落地**（§2.13 · **10/10** · 含父侧追加的 doc-check 基线订正）+ 父侧同轮抽核实读（§2.13 在档 · `UI.md:23` 左列启动态落点 · `PROJECT.md:247` 锚收正 · doc-check 回基线 **悬空 4 / 行宽 18**）；③ **token 已签发**（按凭据纪律**不入档**）。
- **依据**：评审 = #48（pass）· 核验结论 = 上列读数 · 发现处置表 = §1.9（九条全收）+ §2.13（逐号对账 + 旁见 7 条）。
- **批准射程** = §2 十节 + §2.13「修后为准」的全部条目（E-1…E-6 · U37–U44 · 受影响 13 档 + 新档三件）；**不含**：新范围 · R-2/R-3/R-5 延后面 · R-4 中区启动态（台账 #401）· 批 4 面（对话流 / 活动池 / 设置 / 首启向导 / agent / 打包）。
- **派发** = eng-coder（round = initial）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-25 · 审计 0 越界 / advisor 两轮 pass / 终态 clean）



### §5 实施记录（eng-coder）

**5.1 交付摘要**

按 §2 + §2.13（修后为准）实施 E-1…E-6，14 档落（均在 `thincoder-desktop/` 内）：

| 面 | 档 |
|---|---|
| 主进程 | `src/main/sessions.mjs`（新）· `src/main/ipc.mjs` · `src/main/session-slots.mjs` |
| 桥 | `src/preload/preload.cjs` |
| 渲染面 | `renderer/app.mjs` · `renderer/dom.mjs` · `renderer/i18n.mjs` · `renderer/views/sessions.mjs`（新）· `renderer/styles.css` |
| 测试 / 登记 | `test/session-contract.test.mjs` · `test/views.test.mjs`（新）· `test/files.mjs` · `test/host-floor.test.mjs` · `test/projects.test.mjs` |

E 项落点：**E-1** preload 白名单四项定序（U37）· **E-2** railModel + railTree + mountRail + `dom.build`（U39 / U40）· **E-3** 端标 `createdBy` ⇒ `span.rail-origin[data-origin]`，`""` / 未知 ⇒ 不落节点（U41）· **E-4** 断点单源 `renderer/styles.css` + 渲染面零 `matchMedia`（U43）· **E-5** HOST_DICT 10 键 × 两语（U44）· **E-6** 零回归（读数见 5.4）。
禁改面零触碰：其他 views / 设置面 / 打包档 / 标签条 / 状态栏 / `docs/**` 设计档 / 零依赖律——审计轮独立复核 = 0 越界。

**5.2 决策透明表**

| # | 决策 | 依据 / 披露 |
|---|---|---|
| D1 | **三档超 §2.13-5 上界，逐档披露不静默**：`renderer/i18n.mjs` 93（界 89 · Δ+4）· `renderer/styles.css` 180（界 162 · Δ+18）· `test/views.test.mjs` 174（界 ≤150 · Δ+24）。其余 11 档全在界内：preload 24/≤24 · ipc 71/71 · sessions.mjs 34/≤90 · session-slots 64（表外档 · 见 D2）· dom 64/≤70 · views/sessions 145/≤200 · app 90/≤90 · session-contract 199/≤208 · files 6/6 · host-floor 92/±0 · projects 193/±0 | 14 档全部低于仓级硬限 500；超界三档的处置（收窄 / 提界）属设计面裁定——本栏只披露读数，不定夺 |
| D2 | `src/main/session-slots.mjs`（表外档）落地 = 端壳声明 `END = "desktop"` + `setSessionEnd` + 四项绑定转口，**零算法副本**（64 行） | §2.13-6 指派「代码面随实施轮」；U14 机检「零算法副本」 |
| D3 | doc-check 判据取**相对形**：gating 集合（悬空 / 行宽）对照 §4 基线判「不新增」，并以 desktop 面逐条核查；不以退出码 1 判红（脚本对列报面子项亦计数） | 口径先声明后判读，读数见 5.4-3 |
| D4 | E-6 触碰面证据 = **触碰面读数 + 独立审计**，不用 `git status` 基线差分 | 工作区并发多批（cli / core / vscode 面同期在途），porcelain 无基线不可归因；越界面由 explore 审计独立复核 = 0 |
| D5 | `docs/**` 漂移（SHELL.md 树 / 计数）**只报不改** | D1 矩阵：设计档作者 = eng-designer；见 5.5 |

**5.3 审计与代码评审轮次与终态**

| 轮 | 角色 | 结论 |
|---|---|---|
| 内部发散审计 | explore（只读） | **OUT-OF-LIST = 0**——交付与设计无偏离项，越界档 0 |
| 代码评审 R1 | advisor（code） | findings ⇒ 自修 2 项（见下 fix round） |
| 代码评审 R2 | advisor（code） | **VERDICT: pass**（同步轮：复核自修项 + 全量面） |
| fix round | eng-coder | ① `test/views.test.mjs` 去遮蔽（5 处）② `renderer/i18n.mjs:2` 四锚可解析 |

**终态 = clean**（审计 0 越界 · 评审两轮收敛 pass · 自修 2 项已经 R2 复核）。

**5.4 E-6 零回归读数（2026-09-25 本机实读 · 冻结树）**

1. `npm test`（`thincoder-desktop` 全量）⇒ `tests 38 · pass 38 · fail 0 · duration_ms 341`，exit 0 ✓。stderr 中 `[store] listener failed: Error: boom` 为 U28b 用例的**预期噪声**（该用例断言「监听器抛错不吞其余监听器」，本身 ✔ 通过），非失败。
2. Electron 冒烟（真 Electron 运行）⇒ `{"window":true,"node":"24.21.0","sqlite":true,"floorMet":true,"boot":"ok","configKeys":15,"channels":["config:read","project:recent","sessions:list"],"errors":[],"ok":true}`，exit 0 ✓；协议探针 `served:9 · blocked:3`（html / css 供面 200，escape / escapePct / ext 三探针 404 = 逃逸防护生效）；stderr 三行 `[protocol] extension refused` = 探针既定拒绝日志。
   - ⚠ **环境坑（§6 复核必读）**：本会话环境携带 `ELECTRON_RUN_AS_NODE=1`（进程继承性——不在 HKCU / HKLM 环境注册表，源自 VS Code 扩展宿主血缘），electron 二进制会退化为纯 node ⇒ `npx electron .` 报 `does not provide an export named 'protocol'` **假红**。复核须清该变量运行；内联 `set ELECTRON_RUN_AS_NODE=` 无效（npx / 垫片层不吃），实测有效形 = **以清理后的 env 直调 `node_modules/electron/dist/electron.exe . --smoke`**。
3. `node scripts/doc-check.mjs`（docs 全扫描）⇒ `汇总：候选 25318 · 悬空 4 · 注记豁免 43 · 拟新增 30 · 迁移期引文 215`；gating 集合 = 悬空 4 + 行宽 18，逐条核查 **desktop 面 0**（悬空 4 皆 `docs/core/design/`：MODEL-SPECS.md:323 · :1372 · :1465 · SESSION.md:850；行宽 18 皆 core / vsc 面）——与 §4 基线「悬空 4」同位 = **本批 docs 面零新增 gating**（D3）。
4. 触碰面：本批写入仅 `thincoder-desktop/` 内 14 档（第三方复核 = 审计轮 OUT-OF-LIST 0）。mtime 扫描（2026-09-24Z 起）显示工作区 510 档面外改动皆属他批他面既存（cli / core / vscode · `.thincoder/tmp/*`）——**不作归因证据**（D4）。

**5.5 旁见（越界只报 · 不动手）**

1. `docs/desktop/design/SHELL.md` §1 树（:16–:25）缺 `src/main/sessions.mjs`（本批新增档）——树须补行。
2. `docs/desktop/design/SHELL.md:35` 「用例模块五档」未含 `views.test.mjs`；`PROJECT.md:109` 已按六档计（host-floor / guard-closure / session-contract / projects / store / views）——档间计数不一致，须同步（D3 纪律）。
3. `docs/desktop/design/PROJECT.md` §4.1 表内「（拟新增）」标记对本批已落档（`renderer/views/sessions.mjs` · `test/files.mjs` 等）已成历史态——设计面清单行有待刷（doc-check 归「列报 · 不入闸」）。
4. 上述皆 `docs/**` 设计面（D1 矩阵他作者面），本批零触碰。

**5.6 写入说明**：本段由 eng-coder 自写（一段一作者 · 无父侧转述）。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-25 22:57）

- **E-1…E-6 = 全 ✅**（交付表见 §5）。**父侧亲跑**：① `cd thincoder-desktop && npm test` ⇒ **tests 38 · pass 38 · fail 0 · exit 0**（U37–U44 全绿）；② 真 Electron 冒烟（健壮形 = 清 env + 二进制直调）⇒ `{"node":"24.21.0","floorMet":true,"boot":"ok","served":9,"channels":["config:read","project:recent","sessions:list"],"errors":[],"ok":true}` · exit 0 ✓；③ 逐档实读：`src/main/sessions.mjs`（35 行 · 字段闭集 + 零算法 + 抛 ⇒ reject）✓ · `renderer/views/sessions.mjs`（146 行 · 纯描述符 + 薄挂载 + 机读面 `data-state`/`data-section`/`data-list`/`data-origin`/`data-action` · 零 CJK）✓ · `src/main/session-slots.mjs`（端壳不变量全在：`END` / `setSessionEnd` / 四项转口 ✓；**唯一改动 = `:33` 注释坐标 `:37,39` → `:38,40`** —— §2.13-6 指派项 ✓ 一行注释、零语义）。

### 6.2 披露裁定

- **三档越过 §2.13-5 Δ 上界**（`i18n.mjs` 93 / `styles.css` 180 / `views.test.mjs` 174）⇒ **裁定 = 收（以实读为准）**：三档均远低于 500 硬限、无拆分需要；上界系预估 ⇒ 修正轮回填实读。
- **环境坑**（`ELECTRON_RUN_AS_NODE=1` 随进程血统继承 · `set` 内联在部分血统下无效 ⇒ 健壮形 = 清 env + 二进制直调）⇒ 台账 **#403**（含纪律句：冒烟报「导出缺失」类语法错先查该变量）。
- **旁见**（`SHELL.md` §1 树缺 `src/main/sessions.mjs` · `:35`「用例模块五档」未含 `views.test.mjs`（PROJECT.md 按六档计）· `PROJECT.md` §4.1「（拟新增）」标记对已落档成历史态）⇒ 修正轮。
- **§5 段内标题与骨架行重复一次**：append-only 不可回改 ⇒ **照留 + 记录**（非闸态）。

### 6.3 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表 | ✅ §1 / §4 / §6 父侧 · §2 + §2.13 designer · §3 评审（轮次 1）· §5 coder |
| 状态行 | §1 → 已收口（本块后冻结） |
| 计数 | 交付 **14 档**（13 声明 + `session-slots.mjs` §2.13-6 指派一行）· 用例 **U37–U44** · 条目 E-1–E-6 |
| 指针 | 台账 **#353**（滚动在途）· 衍生 **#403** 新立 · **#401 / #402** 在册 |
| 变更记录 | 无（程序首发行前不设 CHANGELOG） |
| 待办勾销 | 无独立台账行（程序级 #353 滚动） |
| 台账可见面 | 已查 ✓ |

### 6.4 结论

批 3（视图面首段 · 左列）**收口**：第一批真界面落地（左列三态 + 来源端标注 + 新通道 `sessions:list`）；38/38 + 冒烟全绿；修正轮（Δ 回填 + 设计档旁见）另派。
