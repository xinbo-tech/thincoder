# 2026-09-25 · 桌面端实施批 2（数据面）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 17:59「批」（四条清单第 3 条：启动桌面端实施程序 · 按设计 §4.1 分批）——本批 = 实施**第 2 段（数据面）**，设计锚 = 五档（含设计同步轮现态）+ §4.1 表 + §7 用例面 + KD-1–KD-9 + U3 契约（启动点 `setSessionEnd("desktop")` + `listSlots[].createdBy` 读面）。
> 台账 = #353（桌面端（第四端）· 归批——本批 = 其实施第 2 段）。前情 = docs/batches/2026-09-25-desktop-impl-1.md §6（壳骨架已收口 · 2026-09-25）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

用户 2026-09-25 17:59「**批**」（四条清单第 3 条：启动桌面端实施程序 · 按设计 §4.1 分批）⇒ 本批 = 实施**第 2 段（数据面）**。前情 = `docs/batches/2026-09-25-desktop-impl-1.md` §6（壳骨架已收口 · 2026-09-25）。

### 1.2 本批交付目标（父侧裁定 · 数据面）

**目标 = 数据面可跑**（壳骨架之上接真数据）：

- **会话面**：`src/main/session-slots.mjs`（端壳 = 端名声明 `END = "desktop"` + `setSessionEnd(END)` 一次 + 四项绑定转口 + 槽 / 会话清单消费——**零算法副本**；引设计 KD-5 与 **U3 契约**）+ `test/session-contract.test.mjs`（T-DSK3 跨端接续 / T-DSK12）。
- **项目面**：`src/main/projects.mjs`（当前项目 = 主进程**内存态**；最近目录 = 核槽面回读**零新存储**——引 `IPC.md` §2 项目面注六项 + KD-9）+ 通道 **`project:open` / `project:recent`**（`IPC.md:42-43`）+ `test/projects.test.mjs`（T-DSK1 / T-DSK2）。
- **状态树**：`renderer/store.mjs`（单状态树 + 订阅）+ `test/store.test.mjs`（T-DSK17–T-DSK20）。
- **词表面**：`renderer/i18n.mjs`（核域键取 `config:read` **语言面下发投影** + 宿主 UI 专有键（两语）+ `t()`）。
- **接线随动**：`src/main/ipc.mjs`（扩通道注册）· `src/preload/preload.cjs`（白名单随动）· `renderer/app.mjs`（引导 / 订阅随动）· `test/files.mjs`（登记三新档）。

**判据（机器可核）**：① `npm test` 全绿（含三新档 · 清单↔盘上两向自检）；② **项目面往返**：`project:open`（缺省 = 主进程原生目录选择）→ `{cwd, recent}` ∧ `project:recent` = 族最新 mtime 降序前 10；③ **会话清单**：`createdBy` **有值才带**（缺键 ⇒ 不标注 · **禁以占用端冒充**）；④ **状态树**：订阅回调按变更触发（用例钉住增量渲染语义）；⑤ 三包（core / vsc / cli）**增量零**；⑥ doc-check **失败行集合无新增**。

**本批不含（后续批）**：视图面（会话列表 UI / 对话流 / 设置 / 活动池 / 审批卡）· 打包与分发面 · `agent-host.mjs` / `settings.mjs`。

### 1.3 设计锚

五档（**含设计同步轮（#35）后的现态**）+ `PROJECT.md` §4.1 + §7 用例面 + **KD-1–KD-9** + **U3 契约**（启动点 `setSessionEnd("desktop")` + 读 `listSlots[].createdBy`）。

### 1.4 边界

本批 = **产品代码面**（`thincoder-desktop/**`）；不改 core / vsc / cli · 不改 `docs/desktop/**`（**如需更正 ⇒ 上抛**）· 不含面照旧不扩。

### 1.5 §2 落地后的父侧裁定（父侧 · 2026-09-25 19:34）

- **R-2（T-DSK17–T-DSK20 本批只核销数据面切片 U29–U32）= 认**：数据面 / DOM-CSS 形态分离切法正确，形态随视图批 ✓。
- **R-1（i18n 行为用例折入 `store.test.mjs`）= 认**：设计 §4.1 测试模块表 = 五档（无 `i18n.test.mjs`）⇒ 折入**不越边界** ✓。
- **R-3（`guard-closure` 非平凡门槛 2→3 档）= 认**：设计 §2.11 收正① 的**增长条款按条件生效**（本批渲染面 ≥3 档：`app` / `dom` / `store` / `i18n`）✓；「超 §1.2 枚举一行」——§1.2 为**目标面非穷举**，不构成越界。
- **R-4（`docs/desktop/design/IPC.md:47` 引 `:81`，实读 `thincoder-core/session-slots.mjs:86`）= 入账 #393**：随**下次设计档修正轮**一并收正（本批不写 `docs/desktop/**` ✓ 边界守持）。
- **R-5 / R-6 = 知悉**：R-5（`recent` 组合算法端侧自持 · `IPC.md:50` 已授权）✓；**R-6 转正为后续批已知面**：物化裸式文件的后续影响 ⇒ **后续批不得按目录名列会话，须走 manifest**（写入本档已知面，视图批 §2 必承）。

### 1.6 §2 评审裁定（父侧 · 2026-09-25 19:39）

- **§3 轮次 1 = pass**（🔴 0 / 🟡 3 / 🔵 5）；**8 条全采纳** → 修复轮（§2.11 形态 · append-only）→ 轮 2 核验 → 通过即派实施。
- **🟡 三条**：① **载入序不变量补生产链判据**（自 `src/main/main.mjs` 的静态闭包断言，照 U34 形态）；② **U26 / 2.4(c) 降级链取设计字面支**（候选序 = 裸 `{hash}.json` → 最小槽号；候选不可读 / 无 `cwd` ⇒ **整族跳过、不再降级**）+ 补混合族子例；③ **E-5 读数加范围**（仅三包源码根；排除 `docs/` 与本档自身——批档 append-only 必被实施期写）。
- **🔵 五条**：④ §2.3 两处数字收正（`guard-closure.test.mjs` 现读 80→**101** · 改档 Δ 合计 ~78→**81**）；⑤ `hidden` = **计数**（或改名 `hiddenCount`）∧ `closeTab` 邻位方向明写（优先右邻、无右邻取左邻）；⑥ §2.10 补 U33 / U34 两格 + E-4 判据文字点名词表小节；⑦ `GROUP_RE` 改述（`:46` 非导出常量 · 可导入面 = `:56`）；⑧ D-1 补依据链一句（`PROJECT.md:146` 裸路径点名 + `IPC.md:47` 首句 `sessionPath`；先例只取 `newSlotData`→`writeSessionFile` 链）。
- **域外**：设计档坐标漂移**二处**（`IPC.md:47` 引 `session-slot-write.mjs:38`，实读 `newSlotData` 在 `:40`）——并入 #393 同轮。
- **设计槽清理**：四条**已终结链**的设计槽消费（slot-end-param · desktop-design · config-mirror · impl-1）；`doc-split` 批的 designId 不在本会话上下文 ⇒ 留槽（无 spawn 会携带它，风险低）。

### 1.7 §2 轮 2 核验通过 + 派发前裁定（父侧 · 2026-09-25 19:57）

- **轮 2（#39）= pass**：🔴 0 / 🟡 0 / 🔵 2 —— 轮 1 发现 **1–8 = 8/8 真消解**（U36 生产链判据落位 ∧ 降级链收成单解 ∧ E-5 白名单 ∧ 101 / Δ81 / ~1704 算术自洽 ∧ `hidden`·邻位钉死 ∧ §2.10 补格 ∧ `GROUP_RE` 改述 ∧ D-1 依据链）⇒ **§2 定稿 = §2 正文 + §2.11（修后为准）**。
- **两条 🔵 裁定 = Deferred（随实施后修正轮）**：① `test/guard-closure.test.mjs` 现读记 101 → 应为 **100**（同表口径 ±1；无 tier 影响）；② U36 归属单向不闭环（2.10 记 E-7、实体落 `projects.test.mjs`、E-7 判据列未点 U36）——二者取一补正。**不另起轮、不阻塞实施**（两条均不影响实施面取值）。
- **派发**：eng-coder（round = initial；设计锚 = §2 + §2.11；designToken 见回执——**按凭据纪律不入档**）。

### 1.8 实施轮上抛裁定（父侧 · 2026-09-25 19:59）

- **冲突 = 真**：§2.7 的「批 1 冻结档**唯一例外** = guard-closure 门槛一行」清单**写漏一处**——`thincoder-desktop/test/host-floor.test.mjs:79` 的 `assert.deepEqual([...preload.CHANNELS], ["config:read"], "白名单 = 本批一条")` 按批 1 快照写死；而 §2.4(e) 明令白名单加两项（→ 三项）⇒ 该断言必红、**判据①（`npm test` 全绿）不可达**。**无第三条路**（不增白名单即违设计）。
- **裁定 = 认改（随动）**：该行改为**三项且顺序锁定**（读法同 U27）；该档不在 §2.3 表内 ⇒ §5 + 交付表按「**列表外改动 + 理由**」如实披露；**产品码零触碰**（纯测试断言随动）。
- **设计面补正 = 并入实施后修正轮**（§2.7 例外清单补第二处；与 §1.7 的两条 🔵 同轮）。
- **口径（推而广之）**：凡「批 N 的断言 = 批 N 快照」形态、被批 N+1 必然作废者 ⇒ 由批 N+1 **随动 + 披露**——**不改批 N 冻结档、不留红**。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix-2 收正（§1.7 两条 + §1.8 → §2.12 · 修后为准））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮次**：initial（首轮任务书）· 编制 = eng-designer · 承接本档 §1（讨论面）与 §1.2 六判据。

**本批一句话**：把「项目面 + 会话面端壳 + 渲染面数据面（状态树 / 词表）」落成可跑自动面——本批完成时 `npm test` 全绿，`project:open` → `{cwd, recent}` 往返、`createdBy` 来源端、状态树订阅与增量数据面各有单测读数。

### 2.1 条目表（E-1…E-8：可核交付物 · 归属文件 · 机检判据读数形式）

| 条目 | 可核交付物 | 机检判据（读数形式） | 设计锚 |
|---|---|---|---|
| E-1 | 测试面：三新用例档登记入显式清单，清单↔盘上两向自检生效 | `npm test` 退出码 0；`test/files.mjs` 条目 2 → 5；反查零失败 | `docs/desktop/design/PROJECT.md:107-108` |
| E-2 | 项目面往返：`project:open`（缺省 = 主进程原生目录选择）→ `{cwd, recent}` ∧ `project:recent` = 族最新 mtime 降序前 10 | `test/projects.test.mjs` ≥18 断言全绿（含 12 族 ⇒ 列表长 10 · 降序逐位 · 二次打开零写） | `docs/desktop/design/IPC.md:42-50` |
| E-3 | 会话清单来源端：`createdBy` 有值才带（缺键 ⇒ `""`；禁以占用端冒充） | `test/session-contract.test.mjs` ≥14 断言全绿（新槽 `"desktop"` / 老槽 `""` / 认领后仍 `""`） | `docs/desktop/design/IPC.md:31` · `docs/desktop/design/UI.md:37,39` |
| E-4 | 状态树：单树 + 订阅（变更触发 · 等值零通知 · 通知中再变更不递归）+ 增量数据面四切片 | `test/store.test.mjs` ≥20 断言全绿（订阅三态 + 窗口/回填守卫/跟滚计数/标签位） | `docs/desktop/design/SHELL.md:32` · `docs/desktop/design/RENDERER.md:17` |
| E-5 | 三包增量零：本批改动集合 ⊆ `thincoder-desktop/**` | `git status --porcelain` 非空行全以 `thincoder-desktop/` 起头 ∧ 核/扩展端/CLI 源码面 `git diff --stat` 空 | 本档 §1.2 判据⑤ |
| E-6 | 文档闸零新增失败行 | `node scripts/doc-check.mjs` 失败行集合 ⊆ 实施时刻基线快照（基线含批 1 时点读数 悬空 4 / 行宽 18 + 本 §2 新增行） | 本档 §1.2 判据⑥ · 批 1 §2 收正口径 |
| E-7 | 会话面端壳：端名声明（`END = "desktop"` + 一次 `setSessionEnd`）+ 四项绑定转口 + 清单消费 + `sessionsDir()` 访问器（零算法副本） | `test/session-contract.test.mjs` 机检：端壳源零 `node:fs` 导入 ∧ 导入后 `sessionEnd() === "desktop"` | `docs/desktop/design/PROJECT.md:40`（KD-5）· `docs/desktop/design/SHELL.md:23,59` · `docs/desktop/design/IPC.md:48` |
| E-8 | 跨端接续：恢复另端所建槽 + 三端互不写 | `await resumeSlot(cwd)` 返回另端槽数据；另端 marker/数据文件哈希不变 | `docs/desktop/design/PROJECT.md:196`（T-DSK12）· 需求档 A2 |

### 2.2 本批不覆盖（显式）

- **视图面全族**：`chat-stream.mjs` / `chat-scroll.mjs` / 标签条 / 左列 / 活动池 / 状态栏 / `styles.css` —— 文案与 DOM 形态随视图批。
- **T-DSK17–T-DSK20 的 DOM/CSS 形态**：DOM 尾部 200 块、摘要块元素、`scrollHeight` 增量修正、药丸元素与 420ms 平滑窗、标签宽 `[1.75rem,14rem]` 与端点渐隐、非活动标签 Tab 序 —— 全部属视图批；本批只核销其**数据面切片**（见 2.5 · 2.6 D-4）。
- **打包面**：`electron-builder` 配置 / `check-dist.mjs` / 三平台产物 / `package`·`postpackage` 脚本执行。
- **未列档**：`agent-host.mjs` / `settings.mjs` / 会话族通道（`sessions:list` 等）与 `config:write` / 菜单面 / 人工交互面 T-DSK21。
- **三包任何改动**（核 / 扩展端 / CLI）与 `docs/desktop/**` 任何改动（需更正 ⇒ 走 R-4）。

### 2.3 受影响文件表（已建档给现读行数 + 预期 Δ；新档给预算上界）

| 文件 | 现读行数 | 预期 Δ | 预算 / 依据 |
|---|---|---|---|
| `thincoder-desktop/src/main/session-slots.mjs`（新） | — | 全档 ~80 | `docs/desktop/design/PROJECT.md:89`（先例 = 扩展端端壳 77 行） |
| `thincoder-desktop/src/main/projects.mjs`（新） | — | 全档 ~90 | `docs/desktop/design/PROJECT.md:90` |
| `thincoder-desktop/renderer/store.mjs`（新） | — | 全档 ~200 | `docs/desktop/design/PROJECT.md:98` |
| `thincoder-desktop/renderer/i18n.mjs`（新） | — | 全档 ~60 | `docs/desktop/design/PROJECT.md:97` |
| `thincoder-desktop/src/main/ipc.mjs` | 43 | +~45（两条通道 + 处理表 + picker 缝） | `docs/desktop/design/PROJECT.md` §4.1（上界 ~200，超则按面拆） |
| `thincoder-desktop/src/preload/preload.cjs` | 22 | +2（`CHANNELS` 加两项） | `docs/desktop/design/PROJECT.md` §4.1 |
| `thincoder-desktop/renderer/app.mjs` | 39 | +~30（引导/订阅随动） | `docs/desktop/design/PROJECT.md` §4.1（~120） |
| `thincoder-desktop/test/session-contract.test.mjs`（新） | — | 全档 ~90 | `docs/desktop/design/PROJECT.md:108` |
| `thincoder-desktop/test/projects.test.mjs`（新） | — | 全档 ~85 | `docs/desktop/design/PROJECT.md:108` |
| `thincoder-desktop/test/store.test.mjs`（新） | — | 全档 ~92（含词表小节 ~12——见 R-1） | `docs/desktop/design/PROJECT.md:108` |
| `thincoder-desktop/test/files.mjs` | 2 | +3 条目（2 → 5） | `docs/desktop/design/PROJECT.md:107` |
| `thincoder-desktop/test/guard-closure.test.mjs` | 80 | +1（非平凡门槛 2 → 3 档） | 批 1 §2 收正①（增长条款，本批 renderer JS 达 4 档 ⇒ 生效） |

未列表 = 零改动：`src/main/main.mjs` / `window.mjs` / `host-floor.mjs` / `renderer/dom.mjs` / `index.html` / `styles.css` / `package.json` / `test/run.mjs` / 核 / 三包。

末段说明（table delta）：上表合计新档 7 档 + 改档 5 档；改档 Δ 合计 ~+78 行；批 1 末态 16 档 906 行 → 本批末态 ~23 档 ~1684 行（均远低于 500 行/档硬限；`store.mjs` ~200 与 `ipc.mjs` ~88 均在 `docs/desktop/design/PROJECT.md` §4.1 上界内）。
`main.mjs` 零改动的依据 = 载入序不变量（见 2.4（a））：端壳经 `ipc.mjs → projects.mjs → session-slots.mjs` 顶层 import 链在通道注册前完成端名声明。

### 2.4 接口契约

**（a）载入序不变量（本批关键接线）**：`setSessionEnd("desktop")` 必须在**任何物化写之前**发生 —— 核 `newSlotData(cwd)` 的
`createdBy = sessionEnd()`（实读 `thincoder-core/session-slot-write.mjs:46`），端名未声明时物化即写入 `"cli"` = 跨端误标（`docs/desktop/design/UI.md:37` 禁项）。
实现路径 = `projects.mjs` 顶层 import 端壳；机检 = `test/projects.test.mjs` **只** import `projects.mjs`（不得自行 import 端壳）后断言 `sessionEnd() === "desktop"`，并断言物化文件 `createdBy === "desktop"`。

**（b）端壳导出面（`src/main/session-slots.mjs`，名面与核一致、零重命名）**：

- 端常量与声明：`END = "desktop"` · 顶层一次 `setSessionEnd(END)`（模块求值期，先例 = `thincoder-vscode/src/extension/session-slots.mjs:46,51`）。
- 四项绑定转口：`endMarkerPath` / `readEndMarker` / `writeEndMarker`（`(cwd) => 核同名(cwd, END)` 形态）· `resumeSlot`（`(cwd) => coreResumeSlot(cwd, { end: END })`，async）。
- 端壳访问器：`sessionsDir()` = `dirname(sessionPath(process.cwd()))`（核未导出根访问器，反推保单源；先例 = `thincoder-vscode/src/extension/session-slots.mjs:56-58`，设计锚 = `docs/desktop/design/IPC.md:48`）。
- 核转口（单源，调用方 import 路径与名面不变）：`sessionPath` / `slotPath` / `manifestPath` / `loadManifest` / `saveManifest` / `writeSessionFile` / `slotDigest` /
  `activeSlot` / `claimSlot` / `allocateFresh` / `_setSessionsDirForTest` / `_resetSessionsDirForTest`（`@thincoder/core/session-slots.mjs`）·
  `slotOccupancy` / `listSlots`（`@thincoder/core/session.mjs`）· `newSlotData`（`@thincoder/core/session-slot-write.mjs`）。
- 零算法副本（机检可核）：端壳源**不含** marker/slot 判定实现 —— 判据 = 源零 `node:fs` 导入 ∧ 零 `JSON.parse`（全部读写走核）。

**（c）`projects.mjs` 面（纯逻辑档：零 electron 导入 → 平 node 可测）**：

- `openProject({ path, pick }) → { cwd, recent }`：`path` 给定时直接采用；缺省走 `await pick()`（picker 由 `ipc.mjs` 注入 electron `dialog`，测试注入假函数）；`pick()` 返回 `null`（用户取消）或 `path` 无效（不存在/非目录）⇒ **fail-soft**：当前项目不变、盘面零改动（2.6 D-6）。
- `recentDirs() → [{ cwd, mtimeMs }]`：扫 `sessionsDir()`，族判据/分组单源 = 核纯函数（`thincoder-core/session-stale.mjs:46` `GROUP_RE` ·
  `:56` `groupSessionEntries`）；每组取**一份**数据文件回读 `cwd`（确定性：裸 `{hash}.json` 优先，否则最小槽号；不可读/无 `cwd` 字段 ⇒ 该组跳过、不猜测、不抛）；
  按族最新 mtime 降序取前 10（`RECENT_LIMIT = 10`）。零新文件、零新配置字段（`docs/desktop/design/PROJECT.md:45` KD-9）。
- `currentCwd() → string|null`：主进程内存态（唯一持有点 = 本档；不落盘）。
- 物化（`project:open` 选中后，`docs/desktop/design/IPC.md:47`）：族内有任一数据文件（裸 `{hash}.json` ∨ `{hash}.json.N`）⇒ 命中、零写；无 ⇒ 经核 `writeSessionFile(sessionPath(cwd), newSlotData(cwd))` 落空槽数据文件。**不认领**槽（不写 `slotSessions` / 不建 manifest / 不动 active）——认领属 `newSlot` / `resumeSlot` 职责（2.6 D-1）。

**（d）`ipc.mjs` 面**：注册三项 handler —— `config:read`（照批 1）+ `project:open`（缺省 pick = `dialog.showOpenDialog({ properties: ["openDirectory"] })` → `filePaths[0] ?? null`）+ `project:recent`（= `recentDirs()`）；白名单单源照批 1 = `createRequire` 读 `preload.cjs` 的 `CHANNELS`，白名单项无处理体 ⇒ **注册期抛**（⇒ 漏注册在冒烟启动即红）。

**（e）`preload.cjs` 面**：`CHANNELS = ["config:read", "project:open", "project:recent"]`；`invoke(channel, payload)` 面不变（白名单外 ⇒ 拒绝）。

**（f）`store.mjs` 面**：

- `createStore(initialState) → { get(), set(patch), subscribe(fn) }`：`set` 逐键 `Object.is` 判定，**≥1 键变更才通知**（等值 ⇒ 零通知）；`subscribe(fn)` 收 `(state, changedKeys)`、返回退订函数；通知中再次 `set` ⇒ 本轮通知跑完再处理该变更（不递归重入）。
- 增量数据面（纯函数，导出供测试直驱；单例 `store` 供 `app.mjs` 用）：`appendBlock(state, block)`（块落树；停跟只影响视口/计数，不影响数据落树）·
  `visibleWindow(blocks, limit) → { visible, hidden }`（`limit` 由调用面带 —— 工艺常量归视图批，2.6 D-4）·
  `beginBackfill(state, { page })`（`hasOlder === false` ∨ 在途 ⇒ 拒；否则置在途）· `endBackfill(state)` · `setFollowing(state, bool)` · `returnToBottom(state)`（复跟 + 清零）·
  `openTab(state, key)`（去重 + 序追加 + 置活动）· `closeTab(state, key)`（不变量：关活动 ⇒ 邻位接管；关末位 ⇒ `activeTab = null`）·
  `deriveTabBadge(states[])`（四值码 `"running"/"approval"/"done"/"idle"`，优先序 approval > running > done > idle，空集 ⇒ `"idle"` —— 词面映射见 2.6 D-5）。

**（g）`i18n.mjs` 面**：`initDict({ locale, dict })`（`locale` 缺/未知 ⇒ `"en"`；`dict` = `config:read` 下发的核 `projectDictionary` 扁平投影）·
`t(key, params?)`（解析序：宿主键表 → 核投影 → **键名自身**，永不返回空/`undefined`）·
`locale()` · `HOST_DICT`（两语键集相等；本批**空表** —— `index.html` 零面向用户字符串，首消费 = 视图批）。消费面 = `app.mjs` 引导（`config:read` 载荷 → `initDict` + `store.set({ locale })`）。

### 2.5 用例表（本批 U 编号承接批 1 的 U13 ⇒ 本批 U14–U35）

| # | 类 | 输入 | 期望输出 | 落点 |
|---|---|---|---|---|
| U14 | 正常 · 端壳形态（机检） | 读端壳源 + 导入后读数 | 源零 `node:fs` 导入 ∧ 零 `JSON.parse`；`END === "desktop"`；`sessionEnd() === "desktop"` | `session-contract` |
| U15 | 正常 · 本端记录往返 | `writeEndMarker(cwd, 2)` → `readEndMarker(cwd)` | 路径以 `.manifest.desktop` 结尾；读回 `{ slot: 2, ... }` | `session-contract` |
| U16 | 边界 · 端间不互写 | 写 vscode 记录（显式端参）后读本端记录；写本端记录后比对 vscode 文件哈希 | 互不影响；vscode 文件哈希不变 | `session-contract` |
| U17 | 正常 · 跨端接续（T-DSK12） | 另端（显式 `end: "vscode"`）落槽 1 数据 + manifest + 记录 ⇒ 本端 `await resumeSlot(cwd)` | 返回槽 1 且 `data` 与另端写入内容等值；另端两文件哈希不变 | `session-contract` |
| U18 | 边界 · 沙箱缝覆盖 | `_setSessionsDirForTest(tmp)` 后取 `sessionPath(cwd)` / `sessionsDir()` | 两值均落在 tmp 根下（前缀断言）；用例后复位 | `session-contract` |
| U19 | 正常 · `createdBy` 三态（判据③ · T-DSK3） | ① 本端物化新槽 ② 老槽（digest 无 `createdBy` 键） ③ ② + 本端 `claimSlot` 认领 | ① `"desktop"` ② `""` ③ **仍 `""`**（禁以占用端冒充——`docs/desktop/design/UI.md:39`） | `session-contract` |
| U20 | 正常 · 物化（T-DSK1） | 空目录 cwd ⇒ `openProject({ path })` | `sessionPath(cwd)` 在盘 ∧ 内容键集 = `newSlotData` 同形 ∧ `createdBy === "desktop"`（载入序不变量）∧ manifest 零认领 ∧ `listSlots(cwd)` 空 | `projects` |
| U21 | 边界 · 物化幂等 | 同 cwd 连续两次 `openProject` | 第二次零写（数据文件 mtime 不变） | `projects` |
| U22 | 正常 · 往返读数（判据②） | `openProject({ path })` | `cwd === path` ∧ `recent[0].cwd === path`（新族位次由打开写定） | `projects` |
| U23 | 正常 · 序与前 10（T-DSK2） | 手写 12 个 40hex 族（内容含 `cwd`）+ `utimesSync` 定死 mtime ⇒ `recentDirs()` | 长度 = 10 ∧ 逐位按族最新 mtime 降序 | `projects` |
| U24 | 边界 · 读面纯盘面 | 连续两次 `recentDirs()`；改一族 mtime 后再读 | 两次调用等值；序随 mtime 随动（零内存依赖——重启面） | `projects` |
| U25 | 边界 · pick 取消 / 路径无效 | `pick: async () => null`；`path` 指向不存在目录 | `cwd` 保持前值 ∧ 盘面零改动（mtime 快照等值） | `projects` |
| U26 | 错误 · 坏文件容忍 | 族内数据文件坏 JSON ∥ 无 `cwd` 字段 | 该族跳过（不抛、不猜测）∧ 其余族正常返回 | `projects` |
| U27 | 正常 · 接线机检 | 读 `ipc.mjs` 源 + `createRequire` 读 `preload.cjs` 的 `CHANNELS` | 源含 `showOpenDialog` ∧ `openDirectory` ∧ 三通道名；`CHANNELS` 三项且顺序如 2.4（e） | `projects` |
| U28 | 正常/边界 · 订阅三态（判据④） | ① `set` 等值 ② `set` 不等值 ③ 通知中再 `set` | ① 零通知 ② 通知携带变更键 ③ 不递归（通知数 = 2 ∧ 终态成立） | `store` |
| U29 | 边界 · 窗口切片（T-DSK17 数据面） | `visibleWindow(blocks, 3)`（7 块） | `visible` = 尾 3 块（引用等值）∧ `hidden` = 4 | `store` |
| U30 | 边界/错误 · 回填守卫（T-DSK18 数据面） | `hasOlder = false` ⇒ `beginBackfill`；在途再 `beginBackfill`；`endBackfill` 后重试 | 前两次拒（状态不变）∧ 末次受理（`page` 生效） | `store` |
| U31 | 正常 · 跟滚计数（T-DSK19 数据面） | 停跟 ⇒ `appendBlock` ⇒ `returnToBottom` | 停跟期间 `pendingNew` 递增且 `following` 不变；返回后 `{ following: true, pendingNew: 0 }`；块始终落树 | `store` |
| U32 | 正常 · 标签面（T-DSK20 数据面 · 需求档 §3.5） | `openTab` 同键两次 / `closeTab` 活动位与末位 / `deriveTabBadge` 逐对 | 去重 + 序稳定；关活动 ⇒ 邻位接管；关末位 ⇒ `null`；优先序 待审批 > 运行中 > 完成 > 空闲 逐对成立 | `store` |
| U33 | 正常/边界 · 词表解析序（R-1） | 未初始化 `t(k)`；初始化后核投影命中；缺键；宿主键同名；`locale` 未知 | ① 返回 `k` 不抛 ② 取值 ③ 返回 `k` ④ 宿主键优先 ⑤ 回退 `"en"` ⑥ 两语宿主键集相等 | `store`（词表小节） |
| U34 | 边界 · 闭包守卫随动（T-DSK16） | 自 `renderer/app.mjs` 起静态 import 闭包 | 闭包含 `store.mjs` / `i18n.mjs` / `dom.mjs` ∧ 档数 ≥ 3（门槛收紧后仍绿） | `guard-closure` |
| U35 | 正常 · 清单两向自检（E-1） | `npm test` | 退出码 0；`test/files.mjs` 5 项 ∧ 盘上 5 档无未登记项 | `run.mjs` 清单面 |

未入选本条目的设计用例（T-DSK4–T-DSK11 / T-DSK13–T-DSK15 / T-DSK21 与 T-DSK17–20 的 DOM/CSS 形态）⇒ 随后续批或人工面（2.2）。

### 2.6 关键决策记录（含被否候选）

| # | 决策 | 理由（证据） | 被否候选 |
|---|---|---|---|
| D-1 | 物化写**裸式** `sessionPath(cwd)`，不认领槽 | `docs/desktop/design/IPC.md:47` 头句点名该路径；命中判据 = 族内有任一数据文件；不认领 ⇒ 零幻影会话行（`listSlots` 走 manifest，实读 `thincoder-core/session-slots.mjs:195-221`） | 写 `slotPath(cwd, 1)`（占号空槽——后续 `allocateFresh` 跳号，留不可见孤儿文件）· 全链 `newSlot`（含认领 ⇒「打开项目」造出空会话行）· 不物化（recent 面无 `cwd` 可回读 ⇒ T-DSK1 不达标） |
| D-2 | 项目面读/写全在 `projects.mjs`，picker 以 `pick` 回调注入 | 纯逻辑档零 electron ⇒ 平 node 可测（先例 = `host-floor.mjs` 的 D-2 裁法） | `projects.mjs` 直 import electron `dialog`（测试面失守）· 逻辑内联 `ipc.mjs`（依赖 electron ⇒ 项目面不可测） |
| D-3 | 端壳载入序 = `ipc.mjs → projects.mjs → session-slots.mjs` 顶层 import 链 | `newSlotData` 的 `createdBy = sessionEnd()`（`thincoder-core/session-slot-write.mjs:46`）⇒ 端名未声明时物化即写入 `"cli"` = 跨端误标 | `main.mjs` side-effect import（多改一档、且端壳离写点更远）· 不声明端名直消费核（缺省 `"cli"` ⇒ 误标） |
| D-4 | 回填页量参数化（`beginBackfill({ page })`）——工艺常量（`MAX_RENDER_BLOCKS` / `HISTORY_PAGE` / 跟滚 420ms 窗）归视图批单源 | 批 1 §2.7 已裁「渲染面工艺常量随视图批」；数据面算法与常量分家 ⇒ 测试用夹具页量 | store 内联 100 / 200（与批 1 裁定冲突 + 常量双源） |
| D-5 | 状态位取**码值**（`"running"/"approval"/"done"/"idle"` + 优先序映射） | 左列/标签为码值消费者；词面（两语）走 i18n 宿主键（视图批）——呈现层单源 = `docs/desktop/design/UI.md:36` 四词 | 直存中文词（英文界面须反查；把呈现层单源塞进数据面） |
| D-6 | 项目面失败语义 = **fail-soft**（取消 / 无效路径 ⇒ 现状不变 + 零写） | 本批无异常消费面；T-DSK1/2 只走 happy path | 抛错上通道（引入未用异常面——异常语义留视图批定） |
| D-7 | i18n 行为断言折入 `store.test.mjs` 词表小节 | `docs/desktop/design/PROJECT.md:108` 用例模块行无 `i18n.test.mjs`；新造档超本批边界（见 R-1） | 新造 `test/i18n.test.mjs`（超 2.3 表 + §4.1 表）· i18n 零行为用例（词表解析序无判据） |
| D-8 | `recent` 读面组合算法自持 `projects.mjs` | 核无「最近目录」导出（`snapshotGroups` 未导出）；判据单源 = 核导出纯函数（`thincoder-core/session-stale.mjs:46,56`）；设计锚 `docs/desktop/design/IPC.md:50` 已明示该机制 | 端自建列表文件（违 KD-9 / 需求档 §2）· 核侧新增导出（属核侧批——见 R-5） |

### 2.7 边界（本批不做）

- 不改核 / 不改扩展端 / 不改 CLI / 不改 `docs/desktop/**`（任何设计更正走 R-4）。
- 不动批 1 冻结档（批 1 §2 条目与判据照旧）——唯一例外 = `guard-closure.test.mjs` 非平凡门槛一行收紧（R-3，已列 2.3）。
- 不新增机检门：本批判据全部落在既有门（`npm test` 单入口 + 清单两向自检 · `guard-closure` 静态闭包 · CI 冒烟 · `node scripts/doc-check.mjs`）。
- 不引入 UI 字符串：面向用户文案零新增（`index.html` 现状即零字符串；首消费随视图批）。
- 不做 DOM/CSS/交互：窗口渲染、回填视口修正、药丸、标签宽与 Tab 序 —— 全在视图批。

**后续批清单（据 2.2 与设计 §4.1 未列面）**：视图批（`chat-stream.mjs` / `chat-scroll.mjs` / 标签条 / 左列 / 活动池 / 状态栏 / `styles.css` / 文案）·
会话族通道批（`sessions:list` 等 + `session:create|switch|rename|delete`）· 配置写面批（`config:write` / `settings.mjs`）·
agent 回路批（`agent-host.mjs`）· 打包批（`electron-builder` / `check-dist.mjs` / 三平台 CI 矩阵 A3）。

### 2.8 上抛与报告项（R-1…R-6）

| # | 项 | 依据 / 事实 | 处置建议 |
|---|---|---|---|
| R-1 | `i18n.mjs` 无专属用例模块 | `docs/desktop/design/PROJECT.md:108` 用例模块行未列 `i18n.test.mjs`；本批 i18n 有行为判据（U33） | 折入 `store.test.mjs` 词表小节（+~12 行，仍 ≪300 行限）；若父侧要独立模块 ⇒ 需 §4.1 增行（超本批边界） |
| R-2 | T-DSK17–T-DSK20 覆盖口径 | 设计 §7（`docs/desktop/design/PROJECT.md:201-204`）判定面含 DOM/CSS 形态；§4.1 三分落点（`:114`）把四条指到 `store` | 本批按**数据面切片**核销（U29–U32）；DOM/CSS 形态随视图批——请父侧确认该口径 |
| R-3 | `guard-closure.test.mjs` 门槛 2 → 3 档落地 | 批 1 §2 收正① 增长条款：自渲染面 JS ≥ 3 档的批起生效；本批 renderer JS 达 4 档 | 照条款收紧（超出 §1.2 接线随动枚举一行，已入 2.3）；若父侧不认 ⇒ 删该行（条款随之无强制力） |
| R-4 | 设计档坐标小漂移（本批不写 `docs/desktop/**`） | `docs/desktop/design/IPC.md:47` 引「核 `sessionPath`——`thincoder-core/session-slots.mjs:81`」，实读 `sessionPath` 住 `:86`（`:81` = `_setSessionsDirForTest`） | 并入下一次设计档修正轮（笔 = eng-designer） |
| R-5 | `recent` 读面组合算法归属 | 核侧无「最近目录」导出；本端组合核导出纯函数（D-8） | 维持本端组合（`docs/desktop/design/IPC.md:50` 已明示）；若核侧收编为导出 ⇒ 属核侧批 |
| R-6 | 物化裸式文件的后续影响 | 物化文件无 manifest 条目 ⇒ `usableSlot` 不命中、`allocateFresh` 只按编号槽判在盘 ⇒ 首个真实会话取槽 1 | 维持（D-1）；风险面 = 后续批若引入「按族列会话」实现须走 manifest（不得扫目录名） |

### 2.9 三方一致对照（本批条目 ↔ 设计档 ↔ 需求档）

| 本批条目 | 设计档锚 | 需求档锚（`docs/desktop/requirements/PROJECT.md`） |
|---|---|---|
| E-1 | `docs/desktop/design/PROJECT.md:107-108` | §7 A1（`:122`） |
| E-2 | `docs/desktop/design/IPC.md:42-50` · `docs/desktop/design/PROJECT.md:89-90,146,185-186` | §4 D1（`:80`） · §7 A1 |
| E-3 | `docs/desktop/design/UI.md:37,39` · `docs/desktop/design/IPC.md:31` | §3 来源端行（`:74`） |
| E-4 | `docs/desktop/design/SHELL.md:32` · `docs/desktop/design/RENDERER.md:17` | §3.5（活动池与状态位）· §4 D3（`:82`）/ D4（`:83`） |
| E-5 | 设计面三包边界（`docs/desktop/design/PROJECT.md` §4.2） | §7 A2（`:123`）· A4（`:125`） |
| E-6 | 批 1 §2 收正口径（doc-check 基线） | §7 A1（`:122`） |
| E-7 | `docs/desktop/design/PROJECT.md:40`（KD-5）· `docs/desktop/design/SHELL.md:23,59` | §4 D2（`:81`）· §7 A2 |
| E-8 | `docs/desktop/design/PROJECT.md:196`（T-DSK12）· `docs/desktop/design/IPC.md:48` | §4 D2（`:81`）· §7 A2（`:123`） |

**需求档合规检查（五要素）**：模块目标（§1 `:9`）· 功能点（§4 D1–D12 `:76-91`）· 边界（§5 `:93`）· 验收（§7 A1–A4 `:118-125`，逐条机检）· 依赖（§8 P1–P4 `:127-134`）——五要素齐、可设计。本批不涉及需求档改动；无缺口、无矛盾（D1「重启后最近列表仍在」与 KD-9「零新存储」口径已对齐 = 最近列表为槽面事实回读，非端自存）。

### 2.10 编号索引

- **条目** E-1…E-8（2.1）· **用例** U14–U35（2.5，承接批 1 的 U1–U13）· **决策** D-1…D-8（2.6）· **上抛** R-1…R-6（2.8）。
- **判据承载**：E-1 ← U35 · E-2 ← U20–U27 · E-3 ← U19 · E-4 ← U28–U32 · E-5 ← 命令读数 · E-6 ← 命令读数 · E-7 ← U14–U18 · E-8 ← U17。
- 实施面顺序（建议）：端壳 → `projects.mjs` → `ipc.mjs` + `preload.cjs` → `store.mjs` + `i18n.mjs` → `app.mjs` 随动 → 三用例档 + `files.mjs` + `guard-closure` 一行。

### 2.11 评审轮次 1 收正（fix-1 · §3 全 8 条 · 修后为准）

**轮次**：fix-1（逐号点修 · 口径 = §1.6 父侧裁定）· 编制 = eng-designer · 承接 §3 轮次 1 的 8 条发现（🟡 3 · 🔵 5）。
**效力**：本节点名的位置以本节「修后文本」为准（原行照旧呈现、不回改——append-only）；本节内容 = §1.6 裁定范围内收正 + 直接算术连带，不夹带裁定外语义。
**号 → 收正位置**（号 = §1.6 裁定序号 = §3 轮次 1 表 #1–8）

| 号 | 摘要 | 收正位置（§2 内） |
|---|---|---|
| ① 🟡 | 载入序不变量缺生产链静态闭包判据 | 2.5 行尾追加 U36 · 2.3 `projects.test.mjs` 行 · 2.10（见 ⑥ 块） |
| ② 🟡 | 2.4（c）降级链定死 | 2.4（c）`recentDirs()` 枚（见 ②⑦⑧ 合并块）· 2.5 U26 行 |
| ③ 🟡 | E-5 读数加范围 | 2.1 E-5 行读数列 |
| ④ 🔵 | 数字收正（现读 101 · Δ 合计 · 末态） | 2.3 `guard-closure` 行 · 2.3 末段说明 |
| ⑤ 🔵 | `hidden` 形态 · `closeTab` 邻位方向 | 2.4（f）两枚 · 2.5 U29 / U32 行 |
| ⑥ 🔵 | U33 / U34 承载补格 · E-4 点名词表 | 2.1 E-4 行判据列 · 2.10 |
| ⑦ 🔵 | `GROUP_RE` 非导出改述 | 2.4（c）`recentDirs()` 枚（见 ②⑦⑧ 合并块） |
| ⑧ 🔵 | D-1 依据链 | 2.4（c）物化枚（见 ②⑦⑧ 合并块）· 2.6 D-1 理由列 |

**① 载入序生产链判据（U36 新增 · 落点 `projects`）**

2.5 行尾追加（编号续 U35 ⇒ U36）：

| U36 | 边界 · 载入序生产链静态闭包（2.4（a）） | 自 `src/main/main.mjs` 起走静态 import 闭包（相对说明符逐档下钻 · bare 止步） | 闭包含 `src/main/session-slots.mjs` ∧ `ipc.mjs` 顶层静态 import `./projects.mjs` | `projects` |

注：U36 只核**可达**——主进程链含 `electron` / `@thincoder/core/*` 等 bare 说明符，故不做纯净性断言（与 U5 有别）；落点 = `projects`（读源先例 = U27 同档；不变量同伴 U20/U27 同档集中；`guard-closure` 面不扩——其面 = 渲染纯净性 + 门槛）。

2.3 `projects.test.mjs` 行（修后 · 并载 ① 的 U36 行数）：

| `thincoder-desktop/test/projects.test.mjs`（新） | — | 全档 ~105（含 U36 生产链闭包断言 ~+20） | `docs/desktop/design/PROJECT.md:108` |

**②⑦⑧ 合并 · 2.4（c）两枚修后全文（单版防双源）**

同节另两枚（`openProject({ path, pick })` · `currentCwd()`）照原文。

- `recentDirs() → [{ cwd, mtimeMs }]`：扫 `sessionsDir()`；族判据定义于 `thincoder-core/session-stale.mjs:46`（**模块内常量 · 不可 import**）；可导入面 = `:56 groupSessionEntries`（纯函数，给 `newestMtimeMs` 与 `dataFiles`）；
  每组取**一份**数据文件回读 `cwd`（候选序 = 裸 `{hash}.json` → 最小槽号；候选不可读 ∥ 无 `cwd` 字段 ⇒ **整族跳过 · 候选级终止**——不再降级到更大槽号、不换候选、不猜测、不抛）；
  按族最新 mtime 降序取前 10（`RECENT_LIMIT = 10`）。零新文件、零新配置字段（`docs/desktop/design/PROJECT.md:45` KD-9）。
- 物化（`project:open` 选中后）· 依据链 = `docs/desktop/design/PROJECT.md:146` 裸路径点名（同一状态文件 = `sessions/<sha1>.json`）+ `docs/desktop/design/IPC.md:47` 首句 `sessionPath(cwd)`；
  先例串只取 `newSlotData` → `writeSessionFile`（`thincoder-vscode/src/extension/session-io.mjs:146-147`），不取其槽号路径与认领段（`:148-151`）。
  族内有任一数据文件（裸 `{hash}.json` ∨ `{hash}.json.N`）⇒ 命中、零写；无 ⇒ 经核 `writeSessionFile(sessionPath(cwd), newSlotData(cwd))` 落空槽数据文件。
  **不认领**槽（不写 `slotSessions` / 不建 manifest / 不动 active）——认领属 `newSlot` / `resumeSlot` 职责（2.6 D-1）。

2.5 U26 行（修后）：

| U26 | 错误 · 坏文件容忍（含混合族） | ① 族内候选数据文件坏 JSON ∥ 无 `cwd` 字段 ② 混合族：裸文件坏而槽文件可读 ∥ 无裸文件 · 最小槽号坏而更大槽号可读 | 该族跳过（不抛、不猜测、**不降级**）∧ 其余族正常返回（混合族两子例均整族跳过 · 候选级终止） | `projects` |

**③ E-5 读数加范围（2.1 E-5 行 · 「机检判据（读数形式）」列 · 修后）**

① 三包源码根（`thincoder-core/` / `thincoder-cli/` / `thincoder-vscode/`）`git diff --stat` 空 ∧
② `git status --porcelain` 改动集合 ⊆ `thincoder-desktop/**` ∪ {`docs/batches/2026-09-25-desktop-impl-2.md`}——本档 append-only 为实施期必写面（唯一白名单），`docs/` 其余不入读数域。

**④ 数字收正（2.3 `guard-closure` 行 · 2.3 末段说明 · 修后）**

| `thincoder-desktop/test/guard-closure.test.mjs` | 101 | +1（非平凡门槛 2 → 3 档） | 批 1 §2 收正①（增长条款，本批 renderer JS 达 4 档 ⇒ 生效） |

上表合计新档 7 档 + 改档 5 档；改档 Δ 合计 ~+81 行（45+2+30+3+1）；
批 1 末态 16 档 906 行 → 本批末态 ~23 档 ~1704 行（均远低于 500 行/档硬限；`store.mjs` ~200 与 `ipc.mjs` ~88 均在 `docs/desktop/design/PROJECT.md` §4.1 上界内）。

**⑤ 两处规格钉死（2.4（f）两枚 · 修后）**

- `visibleWindow(blocks, limit) → { visible, hidden }`（`limit` 由调用面带——工艺常量归视图批，2.6 D-4）：`visible` = 尾 `limit` 块（引用等值）；**`hidden` = 隐藏块数（number）= `max(0, blocks.length - limit)`**（非块数组 · 名面不变）。
- 标签枚：`openTab(state, key)`（去重 + 序追加 + 置活动）· `closeTab(state, key)`（不变量：关活动 ⇒ 邻位接管，**方向 = 优先右邻、无右邻取左邻**；关唯一标签（列表空）⇒ `activeTab = null`；关非活动 ⇒ 活动键不变）· `deriveTabBadge(states[])`（四值码 `"running"/"approval"/"done"/"idle"`，优先序 approval > running > done > idle，空集 ⇒ `"idle"` —— 词面映射见 2.6 D-5）。

2.5 U29 行（修后）：

| U29 | 边界 · 窗口切片（T-DSK17 数据面） | `visibleWindow(blocks, 3)`（7 块） | `visible` = 尾 3 块（引用等值）∧ `hidden` = 4（number 计数 = `blocks.length - limit`） | `store` |

2.5 U32 行（修后）：

| U32 | 正常 · 标签面（T-DSK20 数据面 · 需求档 §3.5） | `openTab` 同键两次 / `closeTab` 活动位（含活动居末 · 无右邻回退左邻）/ `closeTab` 唯一标签 / `deriveTabBadge` 逐对 | 去重 + 序稳定；关活动 ⇒ 邻位接管（优先右邻 · 无右邻取左邻）；关唯一标签 ⇒ `activeTab = null`；优先序 待审批 > 运行中 > 完成 > 空闲 逐对成立 | `store` |

**⑥（并载 ①）2.1 E-4 行判据列 · 2.10（修后）**

- 2.1 E-4 行 · 「机检判据（读数形式）」列（修后）= `test/store.test.mjs` ≥20 断言全绿（订阅三态 + 窗口/回填守卫/跟滚计数/标签位 **+ 词表解析序（U33）**）。
- 2.10 编号枚（修后）= **条目** E-1…E-8（2.1）· **用例** U14–U36（2.5，承接批 1 的 U1–U13）· **决策** D-1…D-8（2.6）· **上抛** R-1…R-6（2.8）。
- 2.10 判据承载行（修后）= E-1 ← U35 · E-2 ← U20–U27 · E-3 ← U19 · E-4 ← U28–U33 · E-5 ← 命令读数 · E-6 ← 命令读数 · E-7 ← U14–U18 · U36 · E-8 ← U17 · 门槛行 ← U34。

**⑧ D-1 理由列（2.6 · 修后）**

`docs/desktop/design/IPC.md:47` 头句点名该路径（裸路径点名同据 = `docs/desktop/design/PROJECT.md:146`）；命中判据 = 族内有任一数据文件；
不认领 ⇒ 零幻影会话行（`listSlots` 走 manifest，实读 `thincoder-core/session-slots.mjs:195-221`）；先例串只取 `newSlotData` → `writeSessionFile`（`thincoder-vscode/src/extension/session-io.mjs:146-147`），不取其槽号路径与认领。

**收正计数**：8/8 全落（🟡 3 · 🔵 5）；唯一改动面 = 本档 §2 追加块。

### 2.12 实施后修正轮收正（§1.7 两条 🔵 + §1.8 设计面补正 · 修后为准）

**轮次**：fix-2（逐号点修；口径 = §1.7 两条 🔵 裁定（Deferred ⇒ 本轮回填）+ §1.8 冲突裁定与设计面补正下令）· 编制 = eng-designer · 承接 §2.11（fix-1）。
**效力**：本节点名的位置以本节「修后文本」为准（原行照旧呈现、不回改 —— append-only）。本节 = 裁定范围内收正 + 直接算术 / 编号连带；不夹带裁定外语义。

**号 → 收正位置**（号 = 本节 ①–⑥）

| 号 | 摘要 | 收正位置（§2 内） |
|---|---|---|
| ① | `guard-closure.test.mjs` 现读 101 → **100**（批前口径；末态实读 101 不变） | 2.3 行 · 2.11 ④ 块 |
| ② | U36 归属单向闭环（E-7 判据列点 U36 及落点） | 2.1 E-7 行判据列 |
| ③ | 批 1 冻结档例外清单：唯一 → **两处** | 2.7 冻结档枚 |
| ④ | 行数口径 = 实读回填（末态实读 23 档 **1874** 行） | 2.3 末段说明 · 2.11 ④ 末段 |
| ⑤ | E-5 读数形 = 基线相对（工作树全量不作读数域） | 2.1 E-5 行 · 2.11 ③ 全块 |
| ⑥ | 列表外档入表（12 → **13** 档 · `test/host-floor.test.mjs`）+ 报告登记 | 2.3 表与未列表说明 · 2.8（R-7）· 2.10 编号枚 |

**① `guard-closure.test.mjs` 现读口径（修后）**

| `thincoder-desktop/test/guard-closure.test.mjs` | 100 | +1（非平凡门槛 2 → 3 档；末态实读 101） | 批 1 §2 收正①（增长条款，本批 renderer JS 达 4 档 ⇒ 生效） |
|---|---|---|---|

表口径 = 内容行数（去尾换行，同 §5.2 / §5.5）。现读 = 100（§1.7 ① 裁定）；101 系末态值落早入现读列；末态实读 = 101（本席实测，与 §5.2 行相符）。Δ 与末态不受影响。

**② U36 归属单向闭环（2.1 E-7 行 · 「机检判据（读数形式）」列 · 修后）**

= `test/session-contract.test.mjs` 机检：端壳源零 `node:fs` 导入 ∧ 导入后 `sessionEnd() === "desktop"` ＋ **U36**（载入序生产链静态闭包 · 落 `test/projects.test.mjs`）。
闭环 = 2.10 判据承载行已记 **E-7 ← U14–U18 · U36**（§2.11 ⑥）；U36 实体 = `test/projects.test.mjs:168-191`（自 `src/main/main.mjs` 走静态 import 闭包 · 断言闭包含端壳）。本节取 §1.7 ② 的「E-7 判据列补」支。

**③ 批 1 冻结档例外清单（2.7 第 2 枚 · 修后）**

- = 不动批 1 冻结档（批 1 §2 条目与判据照旧）—— 例外 = **两处**：
- ① `test/guard-closure.test.mjs` 非平凡门槛一行收紧（R-3，已列 2.3）；
- ② `test/host-floor.test.mjs:79` 白名单断言随本批（2.4（e））三项 + 顺序锁定（§1.8 裁认）；实读现文 =
- `assert.deepEqual([...preload.CHANNELS], ["config:read", "project:open", "project:recent"], "白名单 = 数据面三条（顺序锁定）")`。
- 口径（§1.8 推而广之）= 凡「批 N 的断言 = 批 N 快照」形态、被批 N+1 必然作废者 ⇒ 由批 N+1 **随动 + 披露** —— 不改批 N 冻结档、不留红。

**④ 行数口径 = 实读回填（2.3 末段说明 · 2.11 ④ 末段 · 修后）**

- 口径 = **实读回填**（内容行数 · 去尾换行；同 §5.2 口径）；预估列仅作对照、不作判据。
- 本批末态实读 = **23 档 1874 行** = 批 1 十六档 949 + 新档七档 925（本席本次实测）。
- 批 1 十六档 949 = 906（批 1 §5.2 落档表合计）+ 4（批 1 修正轮 3：`renderer/index.html` +1 / `renderer/styles.css` +3，未回炉入合计）+ 39（本批改档 Δ 实读）。
- 本批改档 Δ 实读 = +39（`ipc.mjs` +23 · `preload.cjs` +1 · `app.mjs` +11 · `files.mjs` +3 · `guard-closure.test.mjs` +1 · `host-floor.test.mjs` ±0）。
- 超源（实读 − 预估）= `test/projects.test.mjs` +88（193 vs ~105）· `test/store.test.mjs` +92（184 vs ~92）· `src/main/projects.mjs` +30（120 vs ~90）；其余档在预估内或低于预估。
- 注（发现项 · 记录面滞后）：§5.2 末态账 1870 = 906 + 925 + 39 以 906 老基计、未含批 1 修正轮 3 的 +4；本节以实读 **1874** 为准（§5 记录面照旧，不改）。

**⑤ E-5 读数形 = 基线相对（2.1 E-5 行 · 2.11 ③ 全块 · 修后）**

- 判据 = ① 三包源码根（`thincoder-core/` / `thincoder-cli/` / `thincoder-vscode/`）**零本批写入** ∧ ② 本批写面 ⊆ `thincoder-desktop/**` ∪ {本档（`docs/batches/2026-09-25-desktop-impl-2.md`）}。
- 读数形 = **基线相对**（基线 = 实施起点快照 · 本批首写时刻）；二形择一可用者并记名：**git 基线形** = 以起点快照为基的改动路径集合核 ∥ **mtime 窗口形** = 起点时刻后写路径核。
- **工作树全量（`git status --porcelain` 全条）不作读数域** —— 面含他批在飞未提交（实测 53 条：M 40 = 根 1 / docs 14 / 核 15 / 扩展端 10；?? 13 = 含 `thincoder-desktop/` · `docs/desktop/` · 他批档）⇒ 字面形恒红。
- ⇒ 原子读法 = 本批增量相对基线核（他批脏面不入）。先例读数 = §5.5（字面红 → 本批增量 mtime 窗口达标：窗口 18 档中本批 13 档全在 `thincoder-desktop/**`）。

**⑥ 列表外档入表（2.3 表 + 未列表说明 · 2.8 · 2.10 · 修后）**

- 2.3 表 12 → **13 档**，追加行：

| `thincoder-desktop/test/host-floor.test.mjs` | 92 | 0（就地收紧断言：白名单三项 + 顺序锁定） | §1.8 裁认（认改随动）· 批 1 §2 冻结档第二处例外 · 披露见 §5.3 |

- 未列表说明澄清（防混）：2.3 未列表中的 `host-floor.mjs` = `src/main/host-floor.mjs`（源档 · 零改动不变）；与 test 档 `test/host-floor.test.mjs`（本批改动 · 已入表）**非同一文件**。
- 2.8 追加报告行：

| R-7 | 列表外改动随动（1 档） | `test/host-floor.test.mjs:79` 白名单断言按批 1 快照写死，本批 2.4（e）三项令其必红（§1.8 冲突记录）；该档不在 §2.3 表内 | 已随动（三项 + 顺序锁定）+ 披露（§5.3）；入表见本节 ⑥；口径 = 批 N 断言被批 N+1 必然作废 ⇒ 随动 + 披露（§1.8） |

- 编号枚同步：2.8 节头（R-1…R-6 → **R-1…R-7**）· 2.10 编号枚（上抛 **R-1…R-7**（2.8））。

**收正计数**：6/6 全落（① 2 落点 · ② 1 · ③ 1 · ④ 2 · ⑤ 2 · ⑥ 4 = 12 落点）；唯一改动面 = 本档 §2 追加块。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：`docs/batches/2026-09-25-desktop-impl-2.md` §2（条目 E-1–E-8 / 用例 U14–U35 / 决策 D-1–D-8 / 边界 / 上抛 R-1–R-6）↔ 设计五档（`docs/desktop/design/**`）· 判据可机检性 · 边界/上抛完整性 · 载入序不变量可行性。
**限制**：需求档（`docs/desktop/requirements/PROJECT.md`）不在读面 ⇒ §2.9 需求侧锚点未核；为核验 §2 标注与引用，抽读了仓内源（`thincoder-core/` 相关档 · `thincoder-vscode` 端壳/先例 · `thincoder-desktop/` 现档）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 可行性 · 判据可机检性 | 🟡 | 载入序不变量（2.4(a)）要求端名声明先于任何物化写，机检只钉「测试侧仅 import `projects.mjs`」这条路径；生产链 `main.mjs → ipc.mjs → projects.mjs → session-slots.mjs`（2.3 的「`main.mjs` 零改动」依据）无用例承载——U27 只读 `ipc.mjs` 源文本（`showOpenDialog` / `openDirectory` / 三通道名），U14 只读端壳本身 | 增一条静态闭包断言（照 U34 形态）：自 `src/main/main.mjs` 起可达 `session-slots.mjs`（或至少断言 `ipc.mjs` 顶层静态 import `projects.mjs`），把判据的分母钉在入口上 |
| 2 | 判据可机检性 | 🟡 | 2.4(c)「裸 `{hash}.json` 优先，否则最小槽号」+「不可读/无 `cwd` ⇒ 该组跳过」对**混合族**（裸文件坏、槽文件可读）与「最小槽号坏、更大槽号可读」两输入有两解（整族跳过 ∥ 逐级降级取首个可读者），U26 只覆盖单档坏文件 ⇒ 两实现都能过判据、读数不同（最近列表含/不含该族） | 在 2.4(c) 明写候选序与终止规则（如「候选序 = 裸 → 最小槽号；候选不可读即整族跳过、不再降级」），并给 U26 加一条混合族子例 |
| 3 | 判据可机检性 | 🟡 | E-5 读数「`git status --porcelain` 非空行全以 `thincoder-desktop/` 起头」无范围子句：本档自身（`docs/batches/2026-09-25-desktop-impl-2.md`）在实施期必被 §3/§5/§6 追加写，而 `thincoder/.gitignore`（实读 20 行）无 `docs/` 条目 ⇒ 除非验证时点该档已提交（跟踪态未核），按字面读会因批次档改动而红 | 给读数加范围（仅三包源码根 / 排除 `docs/` 与本档自身），或改口径为「基线 = 实施起始 HEAD：`git diff --name-only <基线>` 的非 `thincoder-desktop/` 路径为空」 |
| 4 | 受影响文件行数标注（判据 8） | 🔵 | §2.3 两处数字与盘上/自表不符：`test/guard-closure.test.mjs` 现读 80，实读 101 行（同表 `ipc.mjs` 43 / `preload.cjs` 22 / `renderer/app.mjs` 39 / `test/files.mjs` 2 四档逐一吻合 ⇒ 非计数口径差）；「改档 Δ 合计 ~+78」与表内自算 81（45+2+30+3+1）不符，而末态 ~1684 = 906+697+81 又与 81 自洽 | 收正两处数字（无 tier 影响：该档 102 行 ≪ 300 行） |
| 5 | 清晰性 · 判据可机检性 | 🔵 | 两处规格未钉到唯一实现：① `visibleWindow` 的 `hidden` 形态未写（U29 读作计数 `4`，而同签名 `visible` 为块数组、引用等值）② `closeTab`「关活动 ⇒ 邻位接管」未写方向（右邻 / 左邻 / 末位回退）⇒ 断言只能随实现者自定 | ① 明写「`hidden` = 隐藏块数（number）」或改名 `hiddenCount`；② 明写邻位规则（如「优先右邻，无右邻取左邻」） |
| 6 | 追溯 · 覆盖 | 🔵 | §2.10「判据承载」未列 U33 / U34（22 条用例中两条在索引里无归属）；且 §1.2 目标面之一「词表面」在 E-1…E-8 无专条目、E-4 判据文字亦未点名词表小节（实经 U33 承载，R-1 已裁） | §2.10 补两格（E-4 ← U33 · 门槛行 ← U34），并在 E-4 判据文字补「+ 词表解析序（U33）」，使目标四面与条目表一一对应 |
| 7 | 引用精度 | 🔵 | 2.4(c) 把 `GROUP_RE` 与 `groupSessionEntries` 并称「核纯函数」；实读 `thincoder-core/session-stale.mjs:46` 的 `GROUP_RE` 为**非导出** const（`:56` 的 `groupSessionEntries` 才是导出纯函数）⇒ 照字面 import 会失败 | 改述为「族判据定义于 `:46`（模块内常量，不可 import）；可导入面 = `:56 groupSessionEntries`」 |
| 8 | 一致性 · 口径 | 🔵 | D-1 取裸路径「不认领」与 `IPC.md:47` 引的「同链先例」口径不同——实读 `thincoder-vscode/src/extension/session-io.mjs:146-147` = `newSlotData(cwd)` + `writeSessionFile(slotPath(cwd, slot), data)`，其后即认领槽 / 建 manifest / 写 marker；本批依据充分（`PROJECT.md:146` 点名同一状态文件 = `sessions/<sha1>.json`；R-6 已登记影响），但两文并读易被复刻成「打开即建会话行」 | 在 §2.4(c) 补一句依据链（「据 = `PROJECT.md:146` 裸路径点名 + `IPC.md:47` 首句 `sessionPath(cwd)`；先例只取 `newSlotData`→`writeSessionFile` 链，不取其槽号路径与认领」） |

**范围外记（无严重度）**：`docs/desktop/design/IPC.md:47` 引 `thincoder-core/session-slot-write.mjs:38`，实读 `newSlotData` 在 `:40`（与 R-4 同类坐标漂移，随下次设计档修正轮一并收正）。
**已核通过项（摘要）**：`newSlotData` 的 `createdBy = sessionEnd()` 实读在 `session-slot-write.mjs:46` ⇒ 载入序不变量机理成立、路径可行；`resumeSlot(cwd, { end })` / `readEndMarker` / `writeEndMarker` 均带显式端参（`session-slots.mjs:120/133/300`）⇒ U16/U17 机检可写；`listSlots` 投影 `createdBy: meta.createdBy ?? ""`（`:217`）与「禁回填」（`session-slot-write.mjs:99` / `slotDigest` 有值才带）⇒ U19 三态成立；`session.mjs:38-43/51-53` re-export 使 2.4(b) 的 `@thincoder/core/session.mjs`（`listSlots` / `slotOccupancy`）与 `session-slots.mjs` 转口名单均可达；`groupSessionEntries`（纯函数 · 给 `newestMtimeMs` 与 `dataFiles`）足以支撑 2.4(c) 的族判据与命中判据；`preload.cjs` 现读 22 行（`CHANNELS` 单项）⇒ +2 = 三项与 2.4(e)/U27 一致；`config:read` 已下发 `{ config, locale, dict: projectDictionary(locale) }`（`ipc.mjs:22-28`，`projectDictionary` 返回扁平 `{key: value}`）⇒ 2.4(g)/U33 供给面在位。

计数：🔴 0 · 🟡 3 · 🔵 5

VERDICT: pass

### 轮次 2（评审子代理）

**评审面**：`docs/batches/2026-09-25-desktop-impl-2.md` §2.11 收正块（`:230-311` · 轮 1 发现 1–8 逐号收正 ·「修后为准」）——轮 2 = 核验轮：逐号核 1–8 是否真消解（不扩面）。

**逐号核验（读面 = §2.11 + 盘上实读）**：
① U36 已追加（`:251` · 落点 `projects` · 自 `src/main/main.mjs` 走静态闭包 ∧ `ipc.mjs` 顶层静态 import `./projects.mjs`）+ 2.3 `projects.test.mjs` ~105（`:257`）· 2.10 承载（`:304`）——盘上 `main.mjs:12` 静态 import `./ipc.mjs`、静态 import ⇒ 求值先于入口体 ⇒ 判据可写、机理成立 ✓
② 2.4（c）候选序定死（裸 `{hash}.json` → 最小槽号）+ 候选不可读/无 `cwd` ⇒ 整族跳过 · 候选级终止（`:263-265`）+ U26 混合族两子例（`:273`）⇒ 原两解收成单解 ✓
③ E-5 读数拆两子句（三包源码根 diff 空 ∧ status 改动集合 ⊆ desktop ∪ 本档）（`:277-278`）⇒ 实施期必被 §3/§5/§6 追加写的批档不再入红光 ✓
④ 101（`:282`）· Δ 合计 ~+81（`:284` = 45+2+30+3+1）· 末态 ~1704（`:285` = 906+717+81，新档 717 = 80+90+200+60+90+105+92）自洽 ✓（101 见发现 1）
⑤ `hidden` = number 计数（`:289`）∧ `closeTab` 优先右邻、无右邻取左邻 ∧ 关唯一标签 ⇒ `activeTab = null`（`:290`）+ U29/U32 修后行（`:294,298`）✓
⑥ 2.1 E-4 判据补「+ 词表解析序（U33）」（`:302`）· 2.10 编号改 U14–U36 与承载行补格（`:303-304`）✓（归属见发现 2）
⑦ `GROUP_RE` 改述（`:263`）——盘上实读 `thincoder-core/session-stale.mjs:46` = 非导出 `const GROUP_RE`、`:56` = `export function groupSessionEntries`（给 `newestMtimeMs` 与 `dataFiles`）✓
⑧ 依据链两句（`:266-267`）+ D-1 理由列（`:308-309`）——盘上实读 `PROJECT.md:146` 点名「同一状态文件 = `sessions/<sha1>.json`」、`IPC.md:47` 首句 `sessionPath(cwd)`、`session-io.mjs:146-147` = `newSlotData` + `writeSessionFile(slotPath(...))`、`:148-151` = 认领/manifest 段 ⇒ 口径与设计档自洽 ✓

**盘上实读核过（其余口径）**：`guard-closure.test.mjs`（末内容行 100 + 尾换行）· `ipc.mjs` 43 · `preload.cjs` 22 · `renderer/app.mjs` 39 · `test/files.mjs` 2 四行按「内容行数」口径吻合；16 档合计 906 核账成立（逐档读数之和 − 16 = 906）；`session-slot-write.mjs:40/newSlotData` · `:46/createdBy = sessionEnd()` 在位；本仓 = git 仓（`thincoder/.git` 在位）⇒ E-5 读数可行，`.gitignore` 含 `*.log` / `tmp-*.mjs`。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 核验 · 数字标注（判据 8） | 🔵 | ④ 收正后 `test/guard-closure.test.mjs` 现读记为 101（§2.3 行 + §2.11 ④ 块），与同表计数口径差 1 行：同表 `ipc.mjs` 43 / `preload.cjs` 22 / `renderer/app.mjs` 39 / `test/files.mjs` 2 四行按「内容行数」口径实读吻合，且 16 档合计 906 按同口径核账成立；101 系把末尾换行切出的空行计入（同口径下 `files.mjs` 读作 3 · `preload.cjs` 读作 23）——该档实为 100 行 | 该行改记 100（Δ +1 与末态 ~1704 合计不受影响 · 无 tier 影响）；若改口径则须全表统一（四行随之各 +1） |
| 2 | 核验 · 追溯（① 归属） | 🔵 | ① 把 U36 落在 `projects.test.mjs`（`:251,257`），2.10 修后把 U36 记入 E-7 承载（`:304`）；但 2.1 E-7 行判据列仍只写 `test/session-contract.test.mjs` 两项读数（`:69`），而 E-2 判据「`test/projects.test.mjs` ≥18 断言全绿」（`:64`）按文件必然把 U36 断言计入 ⇒ 同一用例两处归属、判据文字单向不闭环 | 二者取一：E-7 判据列补「+ U36（载入序生产链闭包）」，或 2.10 把 U36 改记 E-2 承载（E-2 判据随之点名 U36） |

**未核（无 git 读面）**：E-5 读数② 以工作树全量为域 ⇒ 基线时点若存在非本批未提交改动即红（本评审未读 git 状态 · unverified）。

计数：🔴 0 · 🟡 0 · 🔵 2（轮 1 发现 1–8 = 8/8 真消解）

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（13 档落地 · npm test 30/30 · 冒烟 exit 0 · advisor 两轮 pass）



### 5.1 实施摘要（eng-coder · 2026-09-25）

- 实施面 = 13 档：**新档 7**（§2.3 表列 7 档）+ **改档 6**（表列 5 档 + 列表外 1 档，见 5.3）。
- 架构锚 = 本档 §2 + §2.11（修后为准）；授权面已核；逐档 write → 分组 `node --check` → `npm test` 全量 → 冒烟 → doc-check。
- 本批判据读数全达（5.4 / 5.5 读数面）；E-5 字面命令读数受并发脏面污染 —— 口径与增量证据见 5.5。

### 5.2 实读行数回填（内容行数口径 · §2.3 预估对照）

| 档 | §2.3 预估 / 现读 | 实读 | 备注 |
|---|---|---|---|
| 新 `src/main/session-slots.mjs` | 全档 ~80 | 64 | 端壳 = 端名声明 + 四转口 + 访问器（零算法副本） |
| 新 `src/main/projects.mjs` | 全档 ~90 | 120 | 族分组 / 回读 / mtime 降序 / 前 10 组合面 |
| 新 `renderer/store.mjs` | 全档 ~200 | 159 | 单树 + 订阅 + 增量四切片 |
| 新 `renderer/i18n.mjs` | 全档 ~60 | 67 | 归一镜像 + 插值 + 解析序 |
| 新 `test/session-contract.test.mjs` | 全档 ~90 | 138 | U14–U19（6 用例 · 28 断言；E-3 阈 ≥14） |
| 新 `test/projects.test.mjs` | 全档 ~105（§2.11 ④） | 193 | U20–U27 + U36（9 用例 · 34 断言；E-2 阈 ≥18） |
| 新 `test/store.test.mjs` | 全档 ~92 | 184 | U28–U33 + U28b（7 用例 · 78 断言；E-4 阈 ≥20） |
| 改 `src/main/ipc.mjs` | 43 + ~45 | 66（Δ +23） | 两通道 + 处理表 + picker 缝 + 读数 |
| 改 `src/preload/preload.cjs` | 22 +2 | 23（Δ +1） | `CHANNELS` 三项（2 → 3） |
| 改 `renderer/app.mjs` | 39 + ~30 | 50（Δ +11） | 引导 + 载荷形判 + 订阅镜像 |
| 改 `test/files.mjs` | 2 +3 | 5（Δ +3） | 5 条目登记（E-1 判据） |
| 改 `test/guard-closure.test.mjs` | 100 +1 | 101（Δ +1） | 非平凡门槛随动（§2.11 ④ 收正后口径） |
| 改 `test/host-floor.test.mjs`（**列表外**） | — | 92（Δ 0） | 见 5.3 |

末态账：批 1 末态 16 档 906 行 + 新档 925 行 + 改档 Δ +39 行 = **23 档 1870 行**（§2.3 预估 ~1704）。
差源 = 三档实测超预估：`projects.test.mjs` +88 · `store.test.mjs` +92 · `projects.mjs` +30；其余档在预估内或低于预估。
硬限核：最大档 193 行 ≪ 500 行硬限（顾问线 300 行亦在限内）。

### 5.3 列表外改动（1 档 · 已报父侧裁认）

`test/host-floor.test.mjs`（+0 行 · 就地收紧断言）：装配调序锁定 —— 下限自检调用点「先于协议 / 窗口注册」压为**源序断言** + 本档入册。
理由 = 该档 U4 判据与本批装配点同语义面；不收紧则该条「先于」语义无可核读数。除该档外，改动集合 ⊆ §2.3 表列 12 档。

### 5.4 实跑读数（报告时刻 fresh）

- `npm test`（`node test/run.mjs`）= **tests 30 · pass 30 · fail 0 · exit 0**（343.7ms）。
  用例分布 = guard-closure 3 + host-floor 5 + projects 9 + session-contract 6 + store 7。
  stderr 两行 `[store] listener failed: Error: boom` = U28b **预期证据**（监听器抛错面 · 非失败）。
- 断言实读：projects 34 ≥ 18（E-2）· store 78 ≥ 20（E-4）· session-contract 28 ≥ 14（E-3）—— 阈值全达。
- 冒烟：`npx electron . --smoke` = **exit 0** · `{"ok":true,"boot":"ok","channels":["config:read"],"configKeys":15,"floorMet":true,"sqlite":true,"node":"22.21.1"}`。
  注：须先 `set "ELECTRON_RUN_AS_NODE="`（不置空 ⇒ 宿主伪影红，非本档面）。
  `channels` 序 1 = **预期**（冒烟只走 `config:read`；三通道注册证 = U27 机检 + 缺处理体注册期抛）。
- E-6：`node scripts/doc-check.mjs` = exit 1 · **悬空 4 / 行宽 18**（= 基线同值）；失败行全在 `docs/core/**` / `docs/vsc/**`，`docs/desktop/**` / 本档零失败行 ⇒ **零新增**。

### 5.5 边界读数（E-5 · 口径与证据）

- E-5 字面读数（全工作树）：**红** —— `git status --porcelain` 含他批未提交改动（M 40 = docs 面 15 + 根 MANIFEST 1 + 核 15 + 扩展端 10；untracked 13 = 含 `thincoder-desktop/` · `docs/desktop/` · 他批档 9）。
- E-5 本批增量读数（mtime 窗口 = 本批首写起）：**达标** —— 窗口内 18 档 = 我方 13 档（全在 `thincoder-desktop/**`）+ 他批 5 档（`thincoder-core/prompts/*` ×2 · `docs/desktop/*` ×2 · 他批档 ×1）。
  核 / 扩展端产品码零本批写入（其改动 mtime 早于窗口起点 = 他批面）；CLI 面全树零改动。本 §5 落笔另使本档入窗 = 本批唯一非 desktop 写点。
- 结论：E-5 判据「本批改动集合 ⊆ `thincoder-desktop/**`」**成立**；字面命令读数为**读数口径污染**（§3 未核条已预见该风险），非本批越界。

### 5.6 代码评审轮次 · 终态（advisor · 实施面）

- 轮 1 = **VERDICT pass**（🔴0 / 🟡4 / 🔵4）。
- 自修轮 = 11 处编辑（7 条修复声明）：① i18n 归一镜像核 ② ipc `normalizeLocale` 单源 + U33 补 `zh-CN` 子例 ③ store 逐监听器 try/catch + finally ④ U28b 新增用例 ⑤ U14 正则收紧（覆盖 `node:fs/promises`）⑥ U27 断言针收紧（括号 / 引号字面量）⑦ `ipc.mjs` / `projects.mjs` 档头注释。
- 轮 2 = **VERDICT pass**（修复声明 7/7 对源成立 · 无新 🔴）；余项 = 异批 / 设计缺口记项（见 5.7 · 5.8），非本批改面。
- 终态 = **clean**（两轮 pass · 本批面 🔴0 / 🟡0；🔵 残留 2 条已折入 5.7 / 5.8 报告项）。

### 5.7 发现与处置（轮 1 全 8 条）

| # | 级 | 面 | 发现 | 处置 |
|---|---|---|---|---|
| 1 | 🟡 | `i18n.mjs` · `ipc.mjs` | BCP-47 分叉：`zh-CN` 归 `en`（核归 `zh`）；ipc 原文下发 locale + 已归一词表 = 两源 | 已修：归一同形镜像核（`thincoder-core/i18n.mjs:75-81`）；ipc 改 import 核 `normalizeLocale` |
| 2 | 🟡 | `renderer/store.mjs` | 监听器抛错无守卫 ⇒ 排空位永真、后续派发堵死 | 已修：逐监听器 try/catch + finally 收束；U28b 钉「不吞其余 ∧ 不堵死后续」 |
| 3 | 🟡 | `host-floor.test.mjs` ↔ 设计档 | 宿主下限设计 ↔ 盘矛盾（盘 `22.13.0` / electron ^37.3.1 vs 设计档记 `24.0.0`） | 报告项（异批 = host-node24 批收口面）；本批零码改（见 5.8） |
| 4 | 🟡 | `src/main/ipc.mjs` | `config?.locale` 无供给源（核 `config.mjs` 零 `locale` 键）⇒ 语言面恒 `en` | 归一已单源；供给缺口 = 设计缺口，归配置写面批（见 5.8） |
| 5 | 🔵 | `src/main/ipc.mjs` | 坏配置 fail-loud 语义未落字 + 无用例 | 半闭合：档头注释已落「fail-loud 有意」；用例未加（测试面无 `loadConfig` 注入缝）—— 残留 🔵 · 非阻塞 |
| 6 | 🔵 | `test/session-contract.test.mjs` | U14 正则漏 `node:fs/promises` 面（可绕过） | 已修：正则收紧覆盖 promises 面 |
| 7 | 🔵 | `src/main/projects.mjs` | 主进程同步 FS vs 核异步约定 | 择支闭合：档头注释记「同步有界 · 族量上限」取向（设计未定面的实现选择） |
| 8 | 🔵 | 档面行数账 | §2.3 表列 ~N 与实读不符 | 本 §5.2 实读回填（§2 面数字已由 §2.11 ④ 收正，不改 §2） |

### 5.8 形差与域外记（本批不改 / 后续批收口）

**形差（交付形态与 §2.4 名面的差异 —— 均超集 / 缝，无语义偏离）**：

1. `i18n.mjs` 导出超集：另有 `normalizeLocale` / `SUPPORTED_LOCALES` / `FALLBACK_LOCALE`（§2.4（g）名面的超集；值域与核同步由 U33 机检）。
2. `initDict({ locale, dict, host })` 多可选 `host` 缝（U33 ④ 宿主优先判据所需；缺省 = 本档 `HOST_DICT`；先例 = 核 `_setSessionsDirForTest`）。
3. `ipc.mjs` 顶层 `import { dialog, ipcMain } from "electron"`：picker 仍以 `pick` 回调注入 `projects.mjs`（§2.4（d）同）；electron 依赖收在主进程专档顶层（平 node 不 import 该档；U27 / U36 以源文本机检）。
4. 插值形 = 核同形 `${name}`（逐参首发替换 · 缺参原样保留 —— 镜像 `thincoder-core/i18n.mjs:91-93`）；§2.4（g）未写插值细则，实现以核为单源。

**域外记（非本批笔权 / 留后续）**：

- `docs/desktop/design/IPC.md:47` 引 `thincoder-core/session-slots.mjs:38`（实读 `:40`）—— 坐标漂移，已入台账 #393；沿用 §2.8 R-4（并入下次设计档修正轮）。
- `PROJECT.md:49` 记宿主下限 `24.0.0` vs 盘 `MIN_NODE="22.13.0"`（`host-floor.mjs:9`）—— 归 host-node24 批（见 5.7 #3）。
- 核 `config.mjs` 零 `locale` 键 ⇒ `config.locale` 无供给源 —— 归配置写面批（见 5.7 #4）。
- 坏配置 fail-loud 无用例（5.7 #5）—— 残留 🔵 报告项。

### 5.9 内部差异审计（explore · 只读）与审计后处置

- 审计面 = 13 档 + 设计档相关小节 + 支撑核源；判据 = 四类偏差（判据未兑现 / 静默简化 / 列表外未披露 / 档面漂移）。
- **VERDICT = clean**：四类逐类零命中；E-1…E-8 逐条「满足」并附本次实读证据 —— 摘要：E-1 `test/files.mjs:2-5` 五项 + `test/run.mjs:21-38` 两向自检；E-2 `projects.mjs:19/43-51/65-71/74-87/105-110` + `test/projects.test.mjs` 9 用例；E-3 `test/session-contract.test.mjs:121/133/136-137`；E-4 `renderer/store.mjs:52-54/89-94/108-159` + `test/store.test.mjs`；E-5 以 mtime 窗口代证（核 / 扩展端 / CLI 逐面 mtime 全早于窗口）；E-7 `src/main/session-slots.mjs:20/22/38/41/45-46/52-64` + U14 机检；E-8 `test/session-contract.test.mjs:83-103`（哈希不变面）。
- 审计自限：该装配无执行面 / git 面 ⇒ `npm test` / 冒烟 / doc-check **未独立复跑**（E-1 执行面 · E-6 · 冒烟以本档读数为准）；E-5 以 mtime 代证（同 §5.5 口径）。
- **审计注记 4 条处置**：
  1. N1（🔵 `src/main/ipc.mjs:51-53`）：`project:recent` 返回 = 兄弟同形包 `{ cwd, recent }`（§2.4（d）字面 = `recentDirs()`；设计侧支持 = `docs/desktop/design/IPC.md:49`「刷新：返回 `{ cwd, recent }`」）—— 行为零偏离 ⇒ 作 **§5.8 形差清单第 5 条**补列。
  2. N2（🔵 `renderer/app.mjs:15`）：注释引「E-3」= **批 1 条目编号**（批 1 E-3 含 `config:read` 载荷形 —— 已对批 1 §2.1 核实），在本批上下文易误读 ⇒ 就地改自含措辞：`:15` 改「`config:read` 往返：`{ config, locale, dict }`」；`:6` 的批 1「E-6」改「守卫 = `test/guard-closure.test.mjs`」。**纯注释 · 零语义**。
  3. N3（`docs/desktop/design/PROJECT.md` mtime 12:05 落本批窗口）：属实且已披露 —— = §5.5 他批 5 档之一（他批设计档，本批零写入）；非列表外改动。
  4. N4（`thincoder-vscode/` 目录 mtime 12:15）：其下逐档 mtime 全 ≤ 10:14 ⇒ 无产品码写入证据，E-5 不受影响（记录项）。
- **审计后重跑（最终读数 · cwd = `thincoder-desktop/`）**：`npm test` = **30/30 pass · exit 0**（含 U28b 预期 stderr 两行）；冒烟 = exit 0 · `ok:true` · `boot:"ok"` · `channels:["config:read"]`；doc-check = **悬空 4 / 行宽 18**（基线同值 · 本档零标记）。
  口径注：批档 §5.4 的 `npm test` 读数 cwd = `thincoder-desktop/`（仓根 `thincoder/` 无 package.json——不属本批面）。
- 覆盖注：N2 的两行注释改动发生在 advisor 两轮之后 ⇒ 代码评审覆盖 = 除该 2 行注释外全部；注释无语义面，判定不受影响。
- **报告项（跨批编号陈旧类）**：批 1 时代档引批 1 的 E-6 / E-7（`renderer/dom.mjs:4` · `test/guard-closure.test.mjs:2` · `test/host-floor.test.mjs:2`），与本批 E-6 / E-7 含义相撞 —— 本批未改（`renderer/dom.mjs` 在本批改动集合之外，另两档系批 1 遗留），留后续批以「批 N 条目」限定词统一收口。

### 5.10 advisor 轮 3（N2 注释处置 · 收口复核）与终态

- 触发：审计注记 N2 的处置（`renderer/app.mjs` 两行注释改自含措辞）发生在 advisor 轮 2 之后 ⇒ 以轮 3 对最终态收口复核（对象面 = `renderer/app.mjs`「已实现」+ 上轮 11 项残留逐条对源）。
- **轮 3 = pass**：对象面两行逐符在位 ∧ 零语义面独立佐证（注释体内原位 1:1 置换；代码锚点 `:30` / `:36` / `:38-41` / `:49` 逐行未移）∧ 引用可解析（`test/guard-closure.test.mjs` 在位于该判据档内 · `{ config, locale, dict }` = `src/main/ipc.mjs:30` 返回形）；上轮 11 项 = 8 闭合 / 1 半闭合 / 2 报告项；无 must-fix · 无新 🔴。
- advisor 轮次合计 = 3（轮 1：pass 带 8 发现 → 修；轮 2：7 条声明逐条对源成立；轮 3：本轮收口）。
- 轮 3 宿主引用核对读数 = 0/41（引用体相对路径不可解析 —— 与轮 2 的 0/49 同机制面）；其实质事实本席已逐条以可解析路径重取成立（证据行见 §5.9）。
- 留存报告项（不影响收口 · 均非 must-fix）：① 坏配置 fail-loud 无用例（🔵 可选）；② `src/main/host-floor.mjs:9` = `22.13.0` vs `docs/desktop/design/PROJECT.md:42/:49` = Electron ≥ 44.x / MIN_NODE 24.0.0（🟡 矛盾在盘 · host-node24 批收口面）；③ 核 `config.mjs` 零 `locale` 键 ⇒ `ipc.mjs:28` 读的 `config?.locale` 无写者（🟡 设计缺口 · 设置 / 配置写面批）。
- 终态 = **clean**：实现 13 档（含本批唯一列表外 1 档）+ 审计 clean + advisor 三轮 pass + 闸读数与基线同值。

## §6 验证与收口（父代理）

### 6.1 落地核验（父侧亲跑 · 2026-09-25 20:36）

**判据 E-1–E-8 = 全 ✅**（承 §5 交付表 + 父侧独立抽核）。**父侧亲跑读数（非引用子代理回执）**：

- `cd thincoder-desktop && set "ELECTRON_RUN_AS_NODE=" && npm test` ⇒ **tests 30 · pass 30 · fail 0 · exit 0**（stderr 两行 `[store] listener failed` = U28b 预期证据）。
- `npx electron . --smoke` ⇒ `ok:true ∧ boot:"ok" ∧ served:8 ∧ lock:"primary" ∧ errors:[]`（批 1 面不回归；`served` 6 → 8 = 新模块入供给）。
- 逐档实读抽核：`src/main/session-slots.mjs` **全档**（端名模块级声明 `:38`/`:41` · 四项转口 `:52/:56/:60/:64` · `sessionsDir()` `:45-47` · 零 `node:fs` 直读 · 零算法副本 —— 与设计字字相符）；`test/run.mjs:21-38` 两向自检；`renderer/store.mjs` 订阅/守卫面抽核。

### 6.2 E-5 替换读数裁定 = 收（附独立取证）

字面形（porcelain 全树）在**带未提交他批交付**的树上**恒红**——父侧 `git status` 实读：core 24 改 + vsc 10 改 + 2 未跟踪；**末次写入 = 18:10，早于批 2 窗口（19:58）** ⇒ 「他批并发脏面」确证，**非本批越界**。采纳 mtime 窗口形（本批 13 档全在 `thincoder-desktop/**`）；读数形已在 §2.12⑤ 改为**基线相对**（二形择一并记名）✓。

### 6.3 修正轮与裁定在册

§2 评审轮 1（pass · 3🟡+5🔵）→ 修复轮 #38（8/8）→ 轮 2（pass · 2🔵 Deferred）→ 实施 #40 → **实施后修正轮 #44（6/6 · §2.12 fix-2）** ✓。父侧裁定在册：§1.6（轮 1 十条全收 + 一处事实更正）· §1.7（轮 2 + 两条 Deferred）· §1.8（`host-floor.test.mjs` 列表外裁认）。

### 6.4 errata（记录面 · 冻结档不回改）

- §5.2 末态账 **1870**（=906+925+39 · 以 906 老基计，未含批 1 修正轮 3 的 +4）vs 实读 **1874**（=949+925）——以 §2.12④ 为准（§5 记录面照旧）。
- §5.5 分项算术：`M 40` 分项和 = **41**（docs 15 + 根 1 + 核 15 + 扩展端 10），实读 = 根 1 / docs 14 / 核 15 / 扩展端 10 ⇒ 记录面 off-by-one（读数本身以本表为准）。
- §5.9 一行 **481 字符**（>300 软线）：§5 append-only 不可回改 ⇒ 登记照留（`docs/batches/**` 在 doc-check 扫描域外 · 非闸态）；后续 append 已控宽。

### 6.5 收口清单（D7）

| 项 | 状态 |
|---|---|
| 角色表（六段一作者） | ✅ §1 父侧 · §2 + §2.11 + §2.12 designer · §3 评审 · §4 父侧 · §5 coder · §6 父侧 |
| 状态行 | §1 → **已收口**（本块后冻结） |
| 计数 | 交付 **13 档**（7 新 + 6 改）/ 末态 **23 档 1874 行** / 条目 E-1–E-8 · 用例 U14–U36 · 决策 D-1–D-8 · 上抛 R-1–R-7 |
| 指针 | 台账 **#353**（桌面端程序 · 滚动在途）；衍生债在册 = #389 / #392 / #393 / #396 / #397 / #398 |
| 变更记录 | 无（桌面端程序首发行前不设 CHANGELOG，随打包批） |
| 待办勾销 | 本批无独立台账行（程序级 #353 滚动在途）⇒ 无勾销；父侧新债三条已入册（#396 注释陈旧 / #397 locale 供给 / #398 fail-loud 判据） |
| 批前遗留交叉核 | 批 1 §6 残留（#389 四项 · #384 实践沉淀）= 在册待批 ✓ |
| 台账可见面 | 已查（本会话 `ledger_query` 全量）✓ |

### 6.6 结论

批 2（数据面）**收口**：设计两轮 + 修复两轮 + 实施 + 实施后修正，全链留痕；实现面零越界（E-5 实读确证）；下一批（视图面或宿主底线轮）另档。
