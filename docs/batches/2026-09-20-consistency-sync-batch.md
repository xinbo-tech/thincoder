# 2026-09-20 · 一致性同步批（CONSISTENCY-SYNC-BATCH）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-20 03:58 · 来源 = 用户 03:58「**b**」（选定父侧方案 B）+ 03:57「**我希望显示的提示信息能够跟 cli 端一致**」+ 小债批四轮上抛（#115 / #116 / #117 / #118）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮待发）

### 1.1 条目清单（4 条 · 同族 = **端 / 档之间的说法不一致**）

| # | 台账 | 条目 | 证据 / 落点（已勘坐标） | 面 |
|---|---|---|---|---|
| 1 | **#118** | **VSC 面板排队头缺原因**：域冲突等待被印成「(slot full)」（用户 03:57 口径 = **与 CLI 逐档一致**） | `thincoder-vscode/src/extension/suspension.mjs:153`（挂起重绘只发 `position`）× `webview/activity-view.js:79-80`（`reason` 无 ⇒ 回退 `t("sub.queueSlot")`）× `webview/activity.js:278`（不收 `kind`）；标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73`/`:100-102` | **VSC 产品码**（3 档 + i18n + 测试） |
| 2 | **#115** | **产品档 `AGENTS.md` 残余四则**：v1 测试门陈述（不可执行）· `:12`∥`:21` 自相抵 + PHILOSOPHY 死链 · CHECKPOINT 权威死链 ×2 · VSC 模块图不对称 | `thincoder-cli/AGENTS.md:12`/`:31`/`:35`/`:38` · `thincoder-vscode/AGENTS.md:35`/`:37-71` | **产品文本面**（2 档） |
| 3 | **#116** | **设计 / 工具面同族残余**：`TESTING.md` §1 ∥ §10 内部相抵（**权威先改**）· `ARCHITECTURE.md` 「CLI 侧未迁」死链 · `check-vsix.mjs` tool-docs **25∥24** 口径差 · 枚举漏 `tool-docs/` | `docs/core/design/TESTING.md` §1/§10 · `docs/core/design/ARCHITECTURE.md:5`/`:117-119` · `thincoder-vscode/scripts/check-vsix.mjs:29`/`:65` · 两产品 core 族枚举（CLI `:49` / VSC `:38`） | **设计档 + 工程工具面**（`scripts/**` = 父侧直改） |
| 4 | **#117** | **普通模式派单清单未随 #95 对齐**：五条无标签 + 旧字段名「目标与为什么」（无「轮次」） | `docs/core/design/prompts/discipline-normal.md:149-155`（+ 英文落地面对位） | **提示词面（双面）** |

### 1.2 边界

- **只收这 4 条**——triage 表 3 功能候选不在本批；#118 的修法射程 = **排队头显示链**（不动调度器 / 池语义 / 核分类）✓；
- 各条**面判定**由设计轮逐条给出；**工程工具面（`scripts/**`）= 父侧直改**（不进 eng-coder 派单）；
- **#118 的验收面 = 用户口径「与 CLI 端逐档一致」**（`slot → queued · position N（槽满等位）` / `wait → 原因原文` / `depc → 专用态`）；
- 不加机械门（承 2026-09-18 用户裁定）。

### 1.3 验收（父侧初稿 · 设计轮细化）

① 逐条「台账 id → 改动 file:line（或裁定不动作 + 理由）」；② 机检净增 0（`doc-check` 悬空 / 行宽）；③ 触及测试面 / 提示词面的条目：相关包 `node test/run.mjs` 全绿；④ **#118 追加**：VSC 侧补 **queued 载荷断言**（`waiting`/`reason` 在位 · 与 CLI 同形——该族 VSC 现零用例）。

### 1.4 台账

4 条 → 本批（待讨论 → **待设计**；任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

**批次任务与设计（eng-designer · 2026-09-20 · 轮次 = initial）**

**状态行**：✅ 逐条设计已出（4 条）· 设计档面**本轮已落**（见 2.6 批 3）——**§3 设计评审 = changes-required（🔴1 / 🟡8 / 🔵4）· 修正轮 1 逐条收正已全落**（见 §2.12）。

**书源**：本档 §1（4 条清单 + 边界 + 验收初稿）；仓根 = `D:\teamcode\thincoder`；机检基线（父侧 as-of 03:2x）= 悬空 0 · 行宽 0 · EXIT 0。

### 2.1 条目 1 · #118 VSC 面板排队头缺原因（用户 03:57 口径 = **与 CLI 端逐档一致**）

**① 面判定**：VSC 产品码面（显示链 4 档 + i18n 2 档 + 测试 3 档）+ 设计档面（`docs/vsc/design/WEBVIEW.md` §5.2/§5.3 —— **本轮已落**）；**修法射程 = 显示链**（调度器 / 池语义 / 核分类零触碰）。

**缺口（证据）**：`thincoder-vscode/src/extension/suspension.mjs:153` 挂起重绘只发 `{status:"queued", id, role, position}`——**无 `waiting` / `reason` / `kind`**；`webview/activity-view.js:79-80` 因 `q?.reason` 空而回退 `t("sub.queueSlot")`（zh = `排队中 · 位置 N（槽满等位）`）⇒ **域冲突 / 依赖等待被印成「槽满等位」**（用户症状本体）。live 面（正确面 · 参照）= `src/extension/panel-subagent-relay.mjs:76-81`（已携 `waiting` / `reason`）；标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73`（状态词 `kind==="slot" ? "queued" : "waiting"`）+ `:100-102`（状态区 slot → `queued · position N（槽满等位）`；wait / depc → detail 原文）。

**② 完整修法（落点 + 改法 + 关联面）**：

| # | 落点 | 改法 |
|---|---|---|
| R1 | `panel-subagent-relay.mjs:71-82` | queued 消费点：载荷**加 `kind`**（`parts[1]`——已在手、现丢弃）；同点把 `{kind, position, waiting, reason}` 记入**每面板缓存**（新 `WeakMap<panel, Map<"role#id", info>>`——与既有 `_relayAsyncPending` 同款载体），`started` / `cancelled` / 终态分支删该键；导出读取函式 |
| R2 | `suspension.mjs:152-155` | queued 分支载荷与 relay 面**同形**：`{type:"subagent", status:"queued", id, role, position, waiting, reason, kind}`（字段取自 R1 缓存；缓存缺省 ⇒ 仅 `position`——降级态，见 F-5） |
| R3 | `webview/activity.js:278` | `meta.queueInfo = { kind: m.kind ?? null, position: m.position ?? null, waiting: m.waiting ?? null, reason: m.reason ?? null }`（现缺 `kind`） |
| R4 | `webview/activity-view.js:38` | queued 头词 = `[⏳ ${label} · ${kind === "slot" ? W.queued() : W.waiting()}]`（CLI `subagent-panel.mjs:73` 对位） |
| R5 | `webview/activity-view.js:77-80` | `stateWord` 判据改 **kind 优先**（CLI `thincoder-cli/src/tui/subagent-panel.mjs:100-102` 同形）：`kind === "slot"` ⇒ `t("sub.queueSlot", {n: position})`；**其余（含 `kind` 缺省）** ⇒ `reason` **原文零改写**；`reason` 无 ⇒ **中性回落 `t("sub.queued")`**（= CLI `queued.detail || "queued"` 同形）。**降级形**（缓存缺省 ⇒ 载荷仅 `position`）⇒ 状态区 = `t("sub.queued")` ∧ 状态词 = `t("sub.waiting")`（`kind` 缺省 ⇒ 走 `kind !== "slot"` 支） |
| R6 | `locales/{en,zh}.json` | 补键 `sub.waiting`（en `waiting` / zh `等待中`——CLI 状态词对位；`sub.queued` / `sub.queueSlot` 已在）。key 表同源 = `WEBVIEW-PROTOCOL.md` |
| R7 | 测试面（该族 VSC 现零用例） | 见 2.7 命令 2 / 5h |

**载荷字段语义（#8 · 定案）**：`waiting` = **字符串枚举**（`null` | `"waiting-deps"` | `"dependency-cancelled"`）——relay 面由 `kind` 派生（`panel-subagent-relay.mjs:79`：`kind === "slot"` ⇒ `null`；`"depc"` ⇒ `"dependency-cancelled"`；其余 ⇒ `"waiting-deps"`），**显示面零消费**（判词单源 = `kind` · 文本单源 = `reason`）；其消费面 = **载荷契约断言两处**（`thincoder-vscode/test/chat-panel-messages.test.mjs:412-413` · `thincoder-vscode/test/async-parity.test.mjs:346`）。三源并存风险 = 消（`kind` 判词、`reason` 判文本、`waiting` 只作对位字段——不参与任何判定；**不从载荷剔除**：两处既有契约断言指向它，删字段 = 改既有契约，超本批射程）。

**块级活态载体与读点（#9 · 覆盖刷新两路径）**：`kind` / `reason` / `position` 的载体 = **块自身 `block._subMeta.queueInfo`**（`thincoder-vscode/webview/activity.js:88` 建块默认 `null`；写点 = queued 消费点 `:278`——R3 起含 `kind`；清点 = `started` 分支 `:307`）；**单一读点** = `headerText` / `stateWord`（`thincoder-vscode/webview/activity-view.js:38` · `:78-80`），经 `refreshBlock` 被两条路径消费：
① **2 s 同点刷 live 块头**（`thincoder-vscode/webview/panels.js:69-70` `_panelTimer` → `refreshLiveHeaders` → `refreshBlock`）；② **覆盖式重建头词与状态区**（每条已建块消息 / 状态分支 + `toggle`——`activity.js:279` / `:314` / `:368` / `:406` · `:93`）。
⇒ 两条路径**同读该载体** ⇒ **无回落通道**（R4 / R5 只改 `headerText` / `stateWord` 两个**读点**，不改写点）；契约落档 = `docs/vsc/design/WEBVIEW.md` §5.2（载体与读点行）。降级态（relay 无缓存 ⇒ 仅 `position`）由 `kind` 缺省判据承接（F-5）。

**不动**：`thincoder-core/agent-tools/subagent-scheduler.mjs`（`describeBlockers` :159-176 = 分类单源）· `⟦ev⟧queued` token 文法 · 池上限 / 域冲突语义 · ⏹ 取消语义。

**③ 可机检验收（逐档一致 + 载荷同形）**：

- **A118-1（三档显示形态 · VSC 侧）**：slot ⇒ 状态区 = `t("sub.queueSlot")` 文本 ∧ 状态词 `queued`；wait ⇒ 状态区 = reason **逐字**（`waiting for: explore#1（域冲突 src/a.mjs）`）∧ 状态词 `waiting`；depc ⇒ 状态区 = `dependency cancelled: …` 逐字 ∧ 状态词 `waiting`。**刷新后同形（#9）**：三档各条在 2 s 路径（`refreshLiveHeaders()`）与重建路径（`refreshBlock(block)`）后**逐字不变**（同一断言体复跑——两路径同一读点）。
- **A118-2（重绘载荷 · 该族新增）**：同一 `⟦ev⟧queued` token 经 relay 消费后调 `reassertLiveChildren(panel)` ⇒ 重发消息与 relay 面载荷 **四项全等**（字段集 = **#8 定案**的四项：`position` / `waiting` / `reason` / `kind`）——wait / depc / slot 各一行 + 降级一行（无缓存 ⇒ 仅 `position`；**期望形态写死** = 状态词 `t("sub.waiting")` ∧ 状态区 `t("sub.queued")`（zh `排队中` / en `queued`）——即 R5 降级形：`kind` 缺省 ⇒ `kind !== "slot"` 支）；**并断重发后块头形态 = A118-1 三档**（重绘路径显示与 live 面一致——#9）。
- **A118-3（CLI 对位 · 静态判据）**：wait / depc 状态区 = 核 detail 原文（零改写）；标尺 = `thincoder-cli/src/tui/subagent-panel.mjs:73` / `:100-102`（同一条 detail，零加工）。

**④ 边界**：不做——跨端文案**逐字**统一（VSC 走 i18n 键、CLI 走代码字面量；本批判据 = **三档归类 + detail 原文一致**）· 队列位置重编号 / 排队块 ⏹ · 核 token 文法 · 调度器与池语义 · `sub.queueSlot` 键文案改写。

### 2.2 条目 2 · #115 产品档 `AGENTS.md` 残余四则（产品文本面 · 2 档）

**① 面判定**：**产品文本面**（`thincoder-cli/AGENTS.md` · `thincoder-vscode/AGENTS.md`）= 产品码面（fail-closed）⇒ **eng-coder 轮**（token 门），**非**父侧直改面（`scripts/**` 之外）。

**② 完整修法（逐点 · 全部实测）**：

| # | 落点 | 现状（死） | 改为 | 实测判据 |
|---|---|---|---|---|
| C1 | `thincoder-cli/AGENTS.md:12` | 链接 `docs/requirements/PHILOSOPHY.md` | `../docs/core/requirements/PHILOSOPHY.md` | 前者 MISSING / 后者 EXISTS |
| C2 | 同上 `:12` | 「prompts（`src/prompts/` …）」 | 删路径，改指 `docs/core/design/prompts/`（zh 正本）+「双面见下条」（**D2 不重述**） | `thincoder-cli/src/prompts` MISSING；与 `:21` 自相抵（同档两态） |
| C3 | 同上 `:12` | 层根 `docs/requirements/` / `docs/design/` | `docs/core/requirements/` / `docs/core/design/` | `thincoder-cli/docs/requirements/` 实测仅剩 `TWO-REPO-MERGE.md`；`docs/cli/requirements/*.md` 在仓根 |
| C4 | 同上 `:14` | `[docs/README.md](docs/README.md)`（相对链） | 仓根相对 `docs/README.md` | cli 侧无该档（**同族邻项**） |
| C5 | 同上 `:31` | `prepublishOnly` = `lint + test:full + test:integration` | `lint → npm test`（全量·单入口） | `package.json` scripts = test / prepublishOnly / lint / release:check；`release-check.mjs:66-78` = lint → `test/run.mjs` |
| C6 | 同上 `:35` | 三段执行面 + `slow()` 快层 skip + `test:full` / `test:integration` / `slow-gate.mjs` | v2：一包一条 `test`（`node test/run.mjs`——单元 + 集成 + slow 全跑）；权威指针 `docs/core/design/TESTING.md` **§10**（现指 §1） | 四脚本档 MISSING；`test/run.mjs:4-5`（slow ≡ test）；TESTING.md §10 = 单一权威（本轮裁定） |
| C7 | 同上 `:38` | `docs/design/CHECKPOINT.md` | `../docs/core/design/CHECKPOINT.md` | 后者 EXISTS |
| C8 | 同上 `:49` | core 族枚举无 `tool-docs` | 枚举补 `tool-docs` | `thincoder-core/tool-docs/*.md` = **24** 档（实测） |
| C9 | `thincoder-vscode/AGENTS.md:35` | `thincoder-cli/docs/design/CHECKPOINT.md` | `../docs/core/design/CHECKPOINT.md` | 同 C7 |
| C10 | 同上 `:37`（块头） | 无概览 / 权威声明 | 加「模块图 = 概览——权威 = `../docs/core/design/ARCHITECTURE.md` §3；本块只列主要项（**非穷尽**）」 | 对位 cli `:47` 同款形态（同族对称化） |
| C11 | 同上 `:38` | core 族枚举无 `tool-docs` | 补 `tool-docs` | 同 C8 |
| C12 | 同上 `:59-62` | `settled 视同 done` + `WEBVIEW.md §14 / §5.5 / §5.3` 节号指针 | 措辞收正为 awaitingDigest 驻留 + 改指 `../docs/vsc/design/WEBVIEW.md` §5.1 / §5.2 / §5.5 | 现态 `activity.js:367`；live 档仅 §1–§10（**F-2**） |

**③ 可机检验收**：A115-1（死链 0）= 2.7 命令 5d；A115-2（v1 残留零匹配）= 命令 5f；A115-3（枚举对称）= 命令 5g。

**④ 边界**：**不逐档裸列**模块（承 cli `:14` 反双源漂移决定——webview 47 档不全列，只加声明，见 F-6）· 不改 AGENTS.md 其余条 · 不动 README / 其他产品档。

### 2.3 条目 3 · #116 设计 / 工具面同族残余（**改权威优先**）

**① 面判定**：**设计档面**（`docs/core/design/TESTING.md` · `docs/core/design/ARCHITECTURE.md` · `docs/cli/design/RELEASE.md` · `docs/vsc/design/WEBVIEW.md` = **eng-designer 笔——本轮已落**）+ **工程工具面**（`thincoder-vscode/scripts/check-vsix.mjs` = **父侧直改**）+ 产品文本面枚举（归 #115 C8/C11）+ **需求档面**（F-1，主 agent 笔）。

**② 完整修法（权威裁定 + 落点）**：

**D-116（权威裁定）**：**`TESTING.md` §10 = 测试门单一权威**（v2：每包一条 `npm test` 全绿）。§1 保留的活语义 = 工作分工（L0 / L0+ / L2）；**L1 快层行删除**（v2 无快层）。

**已落（本轮 · 设计档面）**：

| 落点 | 改法 |
|---|---|
| `TESTING.md` §1 标题 + §1.1 表（:12-:25） | 层表 4 行 → **3 行**（L0 / L0+ / L2）；L2 内容 `test:full` → **各包 `npm test`**；L1 行与 L1 条删除 |
| `TESTING.md` §1.2（:28-:31） | 「slow 门机制」（快层 skip + 防漏拦截 + 归册 + 阈值）→ **「slow 标注」**：`export { test as slow }` 纯别名（§10 F3）+ AC-M10-3 判据；v1 阈值依据实测数据转入本档变更记录（留档不丢） |
| `TESTING.md` :33-:41（入口表 + 核树面） | 五套 runner 表 → **三包 `test/run.mjs`** 单入口表；核树面「设计态 / 待落」→ 已落形态（无集成层 · CI 同入口） |
| `TESTING.md` 首部 :3 / :7 / :8 | 板块行 + 权威源行（列 `slow-gate` / `run-fast` / `run-full` / `run-integration`）+ 多实现面行 → v2 形态 |
| `TESTING.md` §2 :49 / :52 · §3 注 :56 | 「用 `slow()` 归册进全量层」→ 别名标注；「快层 / 全量脚本照常可用」→ 单入口；术语注 `L0/L0+/L1/L2` → `L0/L0+/L2` |
| `TESTING.md` §4.2 :111-112 · §4.3 :121-124 | runner 选型（取「新入口 `run-integration.mjs`」）→ **并入单入口 + 否决第二 runner**；契约四行（入口 / env 门 / 发布门接线 / 不变量）同步——发布门实测 = `release-check.mjs:66-78`（lint → `test/run.mjs`） |
| `TESTING.md` §5 用例表 · §7 验收表 | TS-1/2/4/8/9 与 A-TS4/A-TS9/A-TS12 的死命令 / 快层 / 归册措辞 → v2（行号保留，仅词面收正） |
| `TESTING.md` 变更记录 | +1 条（含 v1 阈值数据留档） |
| `ARCHITECTURE.md` :5 / :6 / :117-119 + 变更记录 | `thincoder-cli/docs/requirements/PROJECT.md` → `docs/core/requirements/PROJECT.md`（已并入）+ VSC 对位档死链（`docs/vsc/design/ARCHITECTURE.md` 实测不存在）改指本档 §3.1/§4.1 + `docs/cli/design/{TUI,ACP-CLIENT,CRASH-REPORTS}.md`（三档实测存在，删「未迁」注） |
| `docs/cli/design/RELEASE.md` §2 表 / 接线行 / §4 注释 / §2 标题 | 删 `run-full.mjs` / `run-integration.mjs` 两行 → 单入口 `test/run.mjs`；标题「三步一链」→「两步一链」；`prepublishOnly 自动跑 lint → test:full → test:integration` → `lint → npm test`（**同族发现 F-4 · 就地修**） |
| `WEBVIEW.md` §5.2 :180 / §5.3 :230-231 + 变更记录 | queued 形态 = 与 CLI 逐档一致（状态词 + 三档状态区 + 载荷四项）；存活投影载荷与 relay 面同形（**#118 契约落档**） |

**待父侧直改（工程工具面 · 机械）**：`thincoder-vscode/scripts/check-vsix.mjs:29` —— `EXPECT["tool-docs"]` **25 → 24**（实测盘上 24 档；`prompts: 15` 保持——实测 15 ✓）；改后实跑读数（命令 5c）。

**待主 agent（需求档面）**：见 F-1（**本轮零触碰**）。

**③ 可机检验收**：A116-1（§1–§8 死命令零残留——白名单 = §9 / §10 / 变更记录）= 命令 5b；A116-2（check-vsix 口径 = 盘上计数）= 命令 5c；A116-3（机检净增 0）= 命令 1。

**④ 边界**：不改 `doc-check` 引擎与 manifest 判据面；不引新档；不改核 / CLI / VSC **代码**（check-vsix 仅口径数字）；§5 / §7 只改死命令词面，**不重排用例集 / 不删用例**；需求档 F1–F3 / F17 → 主 agent（F-1）。

### 2.4 条目 4 · #117 普通模式派单清单未随 #95 对齐（提示词双面）

**① 面判定**：**提示词面（双面）**——zh 正本 `docs/core/design/prompts/discipline-normal.md:149-155`（**内容权威 = 主 agent**）∥ en 运行面 `thincoder-core/prompts/discipline-normal.md:150-156`（产品码面 · 落地 = eng-coder）。本轮只出**逐字目标形**（承 #95 已裁形态——**零新语义**）。

**② 完整修法（逐字目标形 · 两面同步）**：

zh（`:149-155`）：`每次委派都带任务书：` 之下五条无标签 + 旧字段名「目标与为什么」→ **六字段带标签**（对位 `docs/core/design/prompts/persona-engineering.md:106-110`）：

```
- 每次委派都带任务书：
  **目标与理由**
  **轮次**（初始 / 修复——修复轮只定点改、禁全量勘察）
  **已知事实**（父代理已勘察的路径——不重复勘察）
  **设计要点与禁止范围**
  **验收标准**（机器可验证：命令、阈值、断言数——不要"做好点"）
  **交付报告格式**
```

en（`:150-156`）同构：`goal & why` / `round (initial | fix — fix rounds are point-fixes only, no full survey)` / `known facts` / `design points & forbidden scope` / `acceptance criteria` / `delivery-report format`。双语 marker 单源 = `thincoder-core/agent-tools/spawn-gates.mjs:18-24`（`/目标与理由/` · `/goal\s*&\s*why/i` · `/goal\s+and\s+why/i` 已收——**谓词零改**）。

**③ 可机检验收**：A117-1（六标签两面齐 + 旧字段名零残留）= 命令 5e；A117-2（门禁谓词零回归）= 命令 3（`thincoder-core` 全量）。

**④ 边界**：不动工程模式侧六字段正文（`persona-engineering.md` / `spawn-gates.mjs` 零改）；不引新字段；不动工具面 2 锚；**措辞若主 agent 另裁 ⇒ 以裁定为准**（本设计给的是逐字形）。

### 2.5 受影响文件表（含越线判定）

| 文件 | 面 | 执行者 | 现状 | 预期 Δ | 越线判定 |
|---|---|---|---|---|---|
| `thincoder-vscode/src/extension/suspension.mjs` | VSC 产品码 | eng-coder | 408 行 | +2~+5（:152-155） | 显示链内 ✓ |
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | VSC 产品码 | eng-coder | 216 行 | +8~+12（R1） | ✓ |
| `thincoder-vscode/webview/activity.js` | VSC 产品码 | eng-coder | **434 行**（行计数口径 = 含末行；as-of 2026-09-20 实核） | +1（:278——`kind` 入载体） | ✓（<500 硬限） |
| `thincoder-vscode/webview/activity-view.js` | VSC 产品码 | eng-coder | 183 行 | +3~+6（:38 / :77-80） | ✓ |
| `thincoder-vscode/locales/en.json` + `zh.json` | VSC 产品码 | eng-coder | 各 **260 行**（as-of 2026-09-20 实核） | +1 ×2（`sub.waiting`：en `"sub.waiting": "waiting"` / zh `"sub.waiting": "等待中"`——插入位 = `sub.queueSlot` 行后；键码权威 = `docs/vsc/design/WEBVIEW-PROTOCOL.md` §6.3） | ✓ |
| `thincoder-vscode/test/async-visibility.test.mjs` | 测试面 | eng-coder | 405 行 | +1 用例（重绘载荷） | ✓ |
| `thincoder-vscode/test/activity-closure.test.mjs` | 测试面 | eng-coder | **297 行**（<300 建议线；as-of 2026-09-20 实核） | T-CL17 扩三档（`kind` 判据 + 两条刷新后同形断言）~+6 ⇒ **~303 行**（越 300 建议线——尺寸档见下注） | ✓（<500 硬限） |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | 测试面 | eng-coder | **458 行**（>300 建议线 · <500 硬限；as-of 2026-09-20 实核） | ⑬ 断言加 `kind`（:412-413 两条 deepEqual 共 2 行）⇒ **460 行**（尺寸档见下注） | ✓（<500 硬限） |
| `thincoder-cli/AGENTS.md` | 产品文本 | eng-coder | 64 行 | ~8 行（C1–C8） | 产品文本面（非 scripts）✓ |
| `thincoder-vscode/AGENTS.md` | 产品文本 | eng-coder | 127 行 | ~5 行（C9–C12） | ✓ |
| `docs/core/design/prompts/discipline-normal.md` | 提示词 zh 正本 | 主 agent 权威 + eng-coder 落 | 202 行 | ~6 行 | 提示词面 ✓ |
| `thincoder-core/prompts/discipline-normal.md` | 提示词 en 运行面 | 同上 | 206 行 | ~7 行 | ✓ |
| `thincoder-vscode/scripts/check-vsix.mjs` | 工程工具 | **父侧直改** | 72 行 | 1 行（:29） | 机械改动 ⇒ 直改 + 实跑读数 + 单提交可 revert ✓ |
| `docs/core/design/TESTING.md` | 设计档 | **eng-designer（本轮已落 · 修正轮 1 再改）** | **408 行**（as-of 2026-09-20 修正轮后实核） | 相对本批落笔前 426 ⇒ **−18** | 设计档面 ✓ |
| `docs/core/design/ARCHITECTURE.md` | 设计档 | 已落（修正轮 1 再改） | **197 行**（同 as-of） | 相对 192 ⇒ **+5**（含 #1 两行收正 + 变更记录） | ✓ |
| `docs/cli/design/RELEASE.md` | 设计档 | 已落（修正轮 1 再改） | **136 行**（同 as-of） | 相对 134 ⇒ **+2**（#7 变更条 + #12 三处指针） | ✓ |
| `docs/vsc/design/WEBVIEW.md` | 设计档 | 已落（修正轮 1 再改） | **509 行**（同 as-of） | 相对 499 ⇒ **+10**（含 #9 载体行 + #10 两处行数 + 变更记录） | ✓ |
| `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 设计档 | **eng-designer（修正轮 1 / 复核轮 2 落）** | **522 行**（as-of 2026-09-20 复核轮后） | +8（#4 键表族 +6：§6.3 键行 +1 · 表头计数 13→14 · 登记注 +1 · 变更记录 +4；复核轮 #1：§6.3 注内状态区键面 +2） | 设计档面 ✓ |
| `docs/core/requirements/TESTING.md` | 需求档 | **主 agent**（F-1） | 未核 | 0（本轮） | 非我笔 ✓ |
| triage 表 3 功能候选 | —— | 无人 | —— | 0 | **不在本批**（§1.2 边界）✓ |

**行数口径与先后（#6）**：本表「现状」列 = **行计数口径（含末行；`wc -l` / `find /c /v ""` 同口径）**，设计档五行的现状 = **§2.11 轮内三处行宽拆分落地后 + 修正轮（§2.12）与复核轮（§2.13）改动后**的盘上实读（as-of 2026-09-20 复核轮后）。
§2.11 记录的首跑读数（悬空 3 / 行宽 3）及其后拆分发生在 §2.5 成稿**之后** ⇒ 成稿时的「426 / 192 / 499」与「read 口径（+1）」两类数字均已作废，**以本表现状列为准**（终值读数另见 §2.12）。

**尺寸档（越 300 建议线两档 · #5）**：

- `thincoder-vscode/test/chat-panel-messages.test.mjs`（458 行）：**理由** = 面板入口面（拒收 / 控制直通 / 启动闩 / 响应器匹配 / 忙态状态机 / sendMessage / `_chat` 单槽 / 取消路由 ⑫ / W15 中继 ⑬ / advisor ⏹ ⑭）单档承载——2026-09-12 自 `chat-panel.test.mjs` 拆分（500 行硬限无豁免）后逐批追加回到 458；**触发** = 实施轮末实读 **≥500 行**（硬限无豁免）⇒ 必拆；**抽取候选线** = ⑬ W15 事件中继组（~39 行——自持夹具 `RS` / `consume`，零跨档 import）或 ⑭ advisor ⏹ 组（末组，夹具 `poolHistory` / `advisorQueuedEntry` 自持）。
- `thincoder-vscode/test/activity-closure.test.mjs`（297 → ~303 行）：**理由** = 活动区收口面（终态清退 / 归档落流 / 接管吞守卫 / 补桩 / 块头字段 AC-CL4 组）单档承载；**触发** = 本轮 Δ 使其越线（297 + ~6）；**抽取候选线** = AC-CL4 块头字段组（`T-CL17`–`T-CL19`——块头字段族自足，与归档 / digest 组零共享夹具）。

### 2.6 实施分批（eng-coder ∥ 父侧直改）

| 批 | 执行者 | 内容 | 准入 |
|---|---|---|---|
| **批 1** | **eng-coder**（token 门） | #118 R1–R7 + 测试面（6 档 + 3 测试档）· #115 C1–C12（2 档）· #117 双面落地（2 档——承主 agent 内容权威） | 主 agent 派单（含本 §2 逐字修法 + designToken）；#117 若主 agent 另裁措辞 ⇒ 先裁后落 |
| **批 2** | **父侧直改**（工程工具面） | `check-vsix.mjs:29` EXPECT `tool-docs` 25 → 24 + 实跑读数（命令 5c）+ 单提交 | 无（机械面） |
| **批 3** | **eng-designer（本轮已落）** | 设计档面 4 档（TESTING / ARCHITECTURE / RELEASE / WEBVIEW）——§3 评审可逐行核，判红即回改 | 已落（D7 逐档变更记录 1 条） |
| **批 4** | **主 agent** | F-1 需求档面（`docs/core/requirements/TESTING.md:20-22` / `:103`）+ **F-3** 裁定（**F-2 已由 C12 落笔**——批 1；本批不另裁，§2.9 F-2 行即其处置——#13 去重） | 需求档笔 = 主 agent |

**串行约束**：批 1 与批 2 **互不重叠文件** ⇒ 可并行；批 1 内 #118 / #115 / #117 三组零文件交集 ⇒ 可并行三派单（各自 `files` 声明）。

**越段说明（F-8）**：设计档面（批 3）由**本设计轮**落地（D1：设计档 = eng-designer 笔；决策当日落档）——§1 未指定设计档执行者，若评审认为应移入实现轮，逐行 revert 即可（零产品面影响）。

### 2.7 验收命令清单（cmd.exe · 判据全 ASCII）

1. `cd D:\teamcode\thincoder && node scripts/doc-check.mjs` —— 判据：末行 `OK(锚): 0 条悬空` + `OK(行宽)` ∧ exit 0（**净增 0**）。
2. `cd D:\teamcode\thincoder\thincoder-vscode && npm test` —— exit 0（含 A118-1 / A118-2 新断言）。
3. `cd D:\teamcode\thincoder\thincoder-core && npm test` —— exit 0（#117 双面 + A117-2）。
4. `cd D:\teamcode\thincoder\thincoder-cli && npm test` —— exit 0（#115 面零回归）。
5. 机械点检（`node -e` 单行 · 全 ASCII）：
- **5b** 同族四档 v1 词面零残留（#1 扩域 + #3 判据集列全）：`node -e "const fs=require('fs');const R='## \u53d8\u66f4\u8bb0\u5f55';const spec=[['docs/core/design/TESTING.md','## 9.'],['docs/core/design/ARCHITECTURE.md',R],['docs/cli/design/RELEASE.md',R],['docs/vsc/design/WEBVIEW.md',R]];const re=/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|\u5feb\u5c42|\u5feb\s*\/\s*[\u5168\u6162]|slow\s*\u95e8/;const bad=[];for(const s of spec){const t=fs.readFileSync(s[0],'utf8').split('\n');const i=t.findIndex(l=>l.startsWith(s[1]));const n=i<0?t.length:i;t.forEach((l,k)=>{if(k<n&&re.test(l))bad.push(s[0]+':'+(k+1))})}console.log(bad.length?('FAIL '+bad.join(',')):'OK 0 v1 residue in 4 docs');process.exit(bad.length?1:0)"` —— 判据：`OK 0 v1 residue in 4 docs`（检索域 = **同族四档**；判据集 = v1 命令面 `test:full` / `test:integration` / `slow-gate` / `run-fast` / `run-full` / `run-integration` **＋ v1 词汇面** 快层 / 快·全·慢两层 / slow 门——中文一律**码点转义**写法（非中文直书），**命令面全 ASCII**；切点 = TESTING 的 §9 起、另三档的「变更记录」起——记录面（历史 / 沿革）白名单）。**域外（检索域外）残留的登记处 = §2.12 ④ G-6 清单**（5b 检索域不扩；含同批写域档 `docs/vsc/design/WEBVIEW-PROTOCOL.md:328`——复核轮 #4 补登；评审 as-of 记 `:326`，本笔 #1 插 2 行后下移）。
   - **5c** check-vsix 口径 = 盘上计数：`node -e "const fs=require('fs');const s=fs.readFileSync('thincoder-vscode/scripts/check-vsix.mjs','utf8');const p=Number(s.match(/prompts:\s*(\d+)/)[1]);const td=Number(s.match(/\"tool-docs\":\s*(\d+)/)[1]);const n=d=>fs.readdirSync('thincoder-core/'+d).filter(f=>f.endsWith('.md')).length;const bad=[['prompts',p,'prompts'],['tool-docs',td,'tool-docs']].filter(x=>x[1]!==n(x[2])).map(x=>x[0]+'='+x[1]);console.log(bad.length?('FAIL '+bad.join(',')):'OK counts match disk');process.exit(bad.length?1:0)"` —— 判据：`OK counts match disk`。
   - **5d** 两产品档死链 0：`node -e "const fs=require('fs'),p=require('path');const bad=[];for(const f of['thincoder-cli/AGENTS.md','thincoder-vscode/AGENTS.md']){const d=p.dirname(f);for(const m of fs.readFileSync(f,'utf8').matchAll(/\]\(([^)#]+\.md)\)/g)){if(!fs.existsSync(p.resolve(d,m[1])))bad.push(f+': '+m[1])}}console.log(bad.length?('FAIL '+bad.join(' | ')):'OK 0 dead md links');process.exit(bad.length?1:0)"` —— 判据：`OK 0 dead md links`。
   - **5e** 提示词六标签两面齐：`node -e "const fs=require('fs');const zh=fs.readFileSync('docs/core/design/prompts/discipline-normal.md','utf8');const en=fs.readFileSync('thincoder-core/prompts/discipline-normal.md','utf8');const zn=['目标与理由','轮次','已知事实','设计要点','验收标准','交付报告格式'];const en6=['goal & why','round (initial','known facts','design points','acceptance criteria','delivery-report format'];const miss=[...zn.filter(x=>!zh.includes(x)),...en6.filter(x=>!en.includes(x))];const stale=zh.includes('目标与为什么')?'zh-old-label':'';console.log(miss.length||stale?('FAIL '+miss.join(',')+' '+stale):'OK 6 fields both faces');process.exit(miss.length||stale?1:0)"` —— 判据：`OK 6 fields both faces`（注：`zn` 断言为全角字面串——命令本身全 ASCII）。
   - **5f** 产品档 v1 残留零匹配：`node -e "const fs=require('fs');const h=[];for(const f of['thincoder-cli/AGENTS.md','thincoder-vscode/AGENTS.md'])fs.readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|src\/prompts/.test(l))h.push(f+':'+(i+1))});console.log(h.length?('FAIL '+h.join(',')):'OK 0 v1 residue');process.exit(h.length?1:0)"` —— 判据：`OK 0 v1 residue`。
   - **5g** core 族枚举对称：`node -e "const fs=require('fs');const c=fs.readFileSync('thincoder-cli/AGENTS.md','utf8').includes('tool-docs');const v=fs.readFileSync('thincoder-vscode/AGENTS.md','utf8').includes('tool-docs');console.log(c&&v?'OK tool-docs named in both':'FAIL enum');process.exit(c&&v?0:1)"` —— 判据：`OK tool-docs named in both`。
   - **5h** 单档定向（#118）：`cd D:\teamcode\thincoder && node --test thincoder-vscode/test/async-visibility.test.mjs` —— exit 0 ∧ 新用例名在册。

### 2.8 边界（本批不做 · 承 §1.2）

只收这 4 条（triage 表 3 功能候选不在本批）· #118 射程 = 排队头显示链（**不动**调度器 / 池语义 / 核分类）· **不加机械门**（承 2026-09-18 用户裁定）· 需求档 = 主 agent 笔（F-1 只报告不落）· 他批写域（`docs/batches/**`）不碰 · 新面不扩张。

### 2.9 逐条发现（A5 · 不一致处 · 附证据）

| # | 级 | 发现 | 证据 | 处置 |
|---|---|---|---|---|
| F-1 | 🟡 | **需求档同族 v1 残余**（非我笔）：`docs/core/requirements/TESTING.md:20-22`（F1「四级分层 L0/L0+/L1/L2」+ F2/F3 `test:full`）· `:103`（F17 保留面含「slow 门（归册防漏）」）——与 §10 / AC-M10-3 相抵 | 盘上 `thincoder-cli/test/{run-fast,run-full,run-integration,slow-gate}.mjs` 全缺；三包 scripts 无 `test:full`；AC-M10-3 = env 零匹配 | **交主 agent**（需求档笔——建议随本批同族同步，批 4） |
| F-2 | 🟡 | VSC 产品档**死节号指针 + 措辞相抵**：`thincoder-vscode/AGENTS.md:59`「settled 视同 done」· `:60`（`WEBVIEW.md §14 现行机制`）· `:61`（`§5.5`）· `:62`（`§5.3`） | 现态 = awaitingDigest 驻留（`activity.js:367`）；live 档 `docs/vsc/design/WEBVIEW.md` 仅 §1–§10（`^##` 实测，无 §14） | 随 #115 **同批修**（C12） |
| F-3 | 🔵 | `docs/core/design/VERIFY-REDESIGN.md:75` 以「L1 项目快测试」为现行层——v2 无快层 | v2 = 单入口（§10 F1 / F3）；三包 scripts 实测 | 不在 4 条射程 ⇒ **登记**，建议随 F-1 同批 |
| F-4 | 🔵 | `docs/cli/design/RELEASE.md` §2 表 / :23 接线行 / :77 注释 = v1 入口名（父侧清单未含） | 实测 `run-full.mjs` / `run-integration.mjs` MISSING；`release-check.mjs:66-78` = lint → `test/run.mjs` | **本轮已就地修**（死入口名 = 一致性面） |
| F-5 | 🔵 | #118 重绘载荷**降级态**：缓存缺省 ⇒ 仅 `position` | R1 缓存 = 新载体；`reassertLiveChildren` 在 webview 重载时触发（host 存活 ⇒ 缓存通常在手） | 已写入 WEBVIEW.md 契约 + 验收含降级行 |
| F-6 | 🔵 | VSC AGENTS.md 模块图 webview 列举非穷尽（清单 16 行 ∥ 盘上 **47** 档：41 js/mjs + 5 css + 1 html） | 实测 `webview/` = 47 条目；cli `:14` 反双源漂移决定 | 本批处置 = **加概览 / 权威声明 + 标非穷尽**（C10），**不逐档裸列** |
| F-7 | 🔵 | 台账同步（#115–#118 状态迁移 + 批指针 = 本档 §2） | 子代理工具面**无台账写命令**（读权全角色） | **交主 agent** |

### 2.10 三向同源

**批档 §2 条目 4 条 = 设计档验收回指 = 需求档条目**：本批**不新增需求条目**（4 条均为**存量一致性债**——需求侧条目 = 台账 #115 / #116 / #117 / #118；需求档面改动仅 F-1）；设计档回指 = 2.1–2.4 各条 A 号（A118-1~3 · A115-1~3 · A116-1~3 · A117-1~2）映射到 §1.3 ①–④。

### 2.11 轮内机检读数（红 → 绿 · 原样登记）

- **首跑（设计档面落笔后）= 红**：`node scripts/doc-check.mjs` → `悬空 3 · 行宽 3 · exit 1`。
  - 3 悬空（本笔新增裸路径 token）= `docs/core/design/TESTING.md:111`（`test/run.mjs` · `test/integration/files.mjs`）· `:123`（`test/run.mjs`）——缺 `thincoder-cli/` 前缀。
  - 3 行宽（本笔新增行）= `ARCHITECTURE.md:187`（335 字符）· `WEBVIEW.md:180`（394）· `:226`（384）。
- **处置（逐处就地修）**：路径补全前缀 + 集成面按实测改「两层 glob」事实（CLI `run.mjs:23-30`；另纠 `docs/cli` 侧 `test/integration/files.mjs` 实不存在——清单制属 VSC 面）；三行按 ≤300 字符拆分。
- **终态复跑（绿）**：`汇总：候选 17575 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 213` + `OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽)` · **exit 0** ⇒ 本批**净增 0**（承 §1.3 ②）。
- 另：读数含预存「列报 · 不入闸」族（迁移期引文 213 / 拟新增 6 / 符号·宽报告面）——**非本笔**，不入闸态。

### 2.12 修正轮 1（承 §3 评审 13 条 · 定点收正 · 追加制）

**轮次** = fix（定点 · 追加制）。**书源** = §3 评审 id=13（VERDICT = changes-required · 🔴1 / 🟡8 / 🔵4）+ 父侧逐条裁定「接受」+ 父侧实核读数。
**落笔形态**：§2.1 / §2.5 / §2.6 / §2.7 与状态行 = **定点就地收正**（my 段内，逐处见下表）；本段 = 该轮的轮记（追加）。
**轮内偏差登记（工具面）**：§2.7 命令 5b 行首的 3 空格缩进被编辑工具归一丢失（内容零影响，仅列表缩进与姊妹项不一致）——登记不掩。

#### ① 逐条「号（#1..#13）→ 改动 file:line」

| # | 级 | 改动（file:line） | 内容 |
|---|---|---|---|
| 1 | 🔴 | `docs/core/design/ARCHITECTURE.md:97` · `:146` · `:186-188`（变更记录）；批档 §2.7 命令 5b | 测试面行 + §4.1「验证层」行**收正为单入口形态**（`node thincoder-vscode/test/run.mjs` + 显式清单 `thincoder-vscode/test/files.mjs`；`test:full` / `slow-gate 分层` 词面删除）+ 权威指针 = `TESTING.md` §10；**5b 检索域扩到同族四档**（ARCHITECTURE / RELEASE / WEBVIEW 同判据） |
| 2 | 🟡 | `docs/core/design/TESTING.md:4`（+ `:382-385`） | 首部状态行收正——§1 = 活语义（工作分工 L0 / L0+ / L2；**门禁权威 = §10**）· §4 = 集成集承载（v2 = 并入单入口）· §3 = v1 历史（v2 由 §10 F4 替代）；「为 v1 历史」表述删除 |
| 3 | 🟡 | `TESTING.md:99` · `:105` · `:107` · `:193` · `:194` · `:206` · `:242`（+ `:382-385`） | 七处按 v2 词面收正：判据③ → **执行集零混入** · 候选 3 否决理由去 slow 门 skip 叠加 · 对照注去「快 / 慢同一断言双执行面」 · **对账口径 → 单入口执行集内** · 零误删去 slow 门 · §6.4 边界改 `slow` 标注纪律 · §8 边界改「测试门与分层机制语义」；**A116-1 判据集列全** = §2.7 命令 5b（新增词汇面判据，此前命不中） |
| 4 | 🟡 | `docs/vsc/design/WEBVIEW-PROTOCOL.md:227`（§6.3 表头）· `:236`（新键行）· `:248`（登记注）· `:465-467`（变更记录）；批档 §2.5 新增该档行 | 键表**追加 `sub.waiting`**（zh `等待中` / en `waiting`；D3：表头计数 13 → 14 与行同改）+ 登记注（成对键 `sub.queued` / 选用判据 = 载荷 `kind` / 无占位符）+ **逐字登记点** = §6.3（键码权威）∥ 实体落点 = `thincoder-vscode/locales/{en,zh}.json`（`sub.queueSlot` 行后——批 1 R6 落地）。原键**不在表在位** ⇒ 按「补该档 + 给登记点」支处置 |
| 5 | 🟡 | 批档 §2.5 三行（`locales` / `activity-closure.test.mjs` / `chat-panel-messages.test.mjs`）+ 表后「尺寸档」注 | 三行补**现盘行数 + 预期 Δ**（各 260 行 / 297 行 / 458 行——as-of 2026-09-20）；>300 建议线两档按尺寸档补「理由 + 触发 + **抽取候选线**」（`chat-panel-messages` 458 · `activity-closure` 本轮 Δ 后 ~303） |
| 6 | 🟡 | 批档 §2.5 四档行 + 表后「行数口径与先后」注 | 按盘上实读收正（**408 / 197 / 136 / 509**——含本修正轮改动，且在 §2.11 行宽拆分**之后**）+ 写明先后：§2.5 成稿时的「426 / 192 / 499」与「read 口径」两类数字均已作废 |
| 7 | 🟡 | `docs/cli/design/RELEASE.md:130-132`（变更记录） | 补本轮 1 条（死入口名 + 「两步一链」收正 = #116 落地；2026-09-15 条 = 该轮谱系、记录面留档）⇒ §2.6 批 3 的 D7 声明与盘上一致 |
| 8 | 🟡 | 批档 §2.1 新增「载荷字段语义（#8 · 定案）」块 + A118-2 行 | `waiting` = **字符串枚举**（`null` / `"waiting-deps"` / `"dependency-cancelled"`）；生产点 = relay `:79`（由 `kind` 派生）；**显示面零消费**（判词单源 = `kind` · 文本单源 = `reason`）；消费面 = 载荷契约断言两处（`chat-panel-messages.test.mjs:412-413` · `async-parity.test.mjs:346`）——**不从载荷剔除**（剔 = 改既有契约，超本批射程）。A118-2 字段集按定案四项写 |
| 9 | 🟡 | 批档 §2.1 新增「块级活态载体与读点（#9）」块 + A118-1 / A118-2 各补刷新后断言；`docs/vsc/design/WEBVIEW.md:183-184`（§5.2 载体行，+ `:470-471`） | 载体 = `block._subMeta.queueInfo`（`activity.js:88` / `:278` / `:307`）；单一读点 = `headerText` / `stateWord`（`activity-view.js:38` / `:78-80`）；两条路径 = 2 s 同点刷（`panels.js:69-70` `_panelTimer` → `refreshLiveHeaders`）∥ 覆盖式重建（消息 / 状态分支 + `toggle`）⇒ **无回落通道** |
| 10 | 🔵 | `docs/vsc/design/WEBVIEW.md:261`（§5.3 痕迹面行）· `:378`（D-W22）（+ `:470-471`）；批档 §2.5 同行 | `activity.js` 行数两说收正到同一口径与 as-of：425 → **434 行**（行计数口径 = `wc -l` / 含末行；as-of 2026-09-20）；批档行 435 → 434 |
| 11 | 🔵 | `TESTING.md:339`（§10.2 实测行）· `:372`（A-RC3 行）（+ `:382-385`） | VSC 单元清单条数两说收正到同一 as-of：60 → **61**（并行线 `thincoder-vscode/test/tool-display-sync.test.mjs` 登记入册后）；`:310` / `:336` 的 61 保持（此处不动） |
| 12 | 🔵 | `docs/cli/design/RELEASE.md:5` · `:100` · `:125`（+ `:130-132`） | 三处「VSC 侧未迁」指针按同一判据核：原址 `thincoder-vscode/docs/design/RELEASE.md` **不在盘** ⇒ 收正为归档址 `thincoder-vscode/docs/_archive/design/RELEASE.md` + 标 as-of 2026-09-20（与 ARCHITECTURE 同判据） |
| 13 | 🔵 | 批档 §2.6 批 4 行 | 去重——批 4 只留 F-1 / F-3；**F-2 已由 C12 落笔**（批 1），本批不另裁（§2.9 F-2 行即其处置） |

#### ② C2 断言清单（cmd.exe 可跑 · 判据全 ASCII · 逐条实跑读数）

1. `#1 / #3` **同族四档 v1 词面零残留**（§2.7 命令 5b）：`node -e "const fs=require('fs');const R='## \u53d8\u66f4\u8bb0\u5f55';const spec=[['docs/core/design/TESTING.md','## 9.'],['docs/core/design/ARCHITECTURE.md',R],['docs/cli/design/RELEASE.md',R],['docs/vsc/design/WEBVIEW.md',R]];const re=/test:full|test:integration|slow-gate|run-fast|run-full|run-integration|\u5feb\u5c42|\u5feb\s*\/\s*[\u5168\u6162]|slow\s*\u95e8/;const bad=[];for(const s of spec){const t=fs.readFileSync(s[0],'utf8').split('\n');const i=t.findIndex(l=>l.startsWith(s[1]));const n=i<0?t.length:i;t.forEach((l,k)=>{if(k<n&&re.test(l))bad.push(s[0]+':'+(k+1))})}console.log(bad.length?('FAIL '+bad.join(',')):'OK 0 v1 residue in 4 docs');process.exit(bad.length?1:0)"` ⇒ **`OK 0 v1 residue in 4 docs`（exit 0）**。
2. `#4` **键表计数与行数一致（D3）**：§6.3 表头声明的键数 == 表内键行数 ⇒ **`OK keys 14`**（断言体见本行末括注；实跑读数 `14 / 14`）。〔命令 = 解析 `### 6.3` 段内 `| \`` 起始行计数 ‖ 表头 `(\d+) 键` 捕获值，比较取等〕
3. `#4` **逐字登记点在位**：§6.3 含行 ``| `sub.waiting` | 等待中 | waiting |`` ⇒ **`OK sub.waiting row verbatim`**。
4. `#10` **旧读数零残留**：`WEBVIEW.md` 不含「现 425 行」⇒ **`OK 0 stale 425`**。
5. `#11` **旧读数零残留**：`TESTING.md` 不含「单元域盘上 **60** 档」/「VSC 60 单元」⇒ **`OK 0 stale 60`**。
6. `#12` **指针可解析**：原址不在盘 ∧ 归档址在盘 ∧ 正文「未迁」引用零（旧址仅存于变更记录 1 处作为历史）⇒ **`OK archive in place / old addr only in changelog`**。
7. `#5 / #6` **行数读数（非闸——as-of 快照）**：`TESTING 408 · ARCHITECTURE 197 · RELEASE 136 · WEBVIEW 509 · WEBVIEW-PROTOCOL 520 · activity.js 434 · activity-closure 297 · chat-panel-messages 458 · locales en/zh 各 260`。
**命令面（可复制 · 判据全 ASCII；命令内用 `\x60` 表示反引号，避免与 markdown 码段冲突）：**

- `#4` 键数（D3）：`node -e "const fs=require('fs');const t=fs.readFileSync('docs/vsc/design/WEBVIEW-PROTOCOL.md','utf8').split('\n');const s=t.findIndex(l=>l.startsWith('### 6.3'));const e=t.findIndex((l,i)=>i>s&&l.startsWith('## 7.'));const rows=t.slice(s,e).filter(l=>/^\| \x60/.test(l)).length;const m=/### 6\.3 i18n \u952e\u8868\uff08(\d+) \u952e/.exec(t[s]);const n=m?Number(m[1]):-1;console.log(n===rows?('OK keys '+n):('FAIL decl '+n+' rows '+rows));process.exit(n===rows?0:1)"` ⇒ `OK keys 14`
- `#4` 逐字键行：`node -e "const fs=require('fs');const t=fs.readFileSync('docs/vsc/design/WEBVIEW-PROTOCOL.md','utf8');const row='| \x60sub.waiting\x60 | \u7b49\u5f85\u4e2d | waiting |';const ok=t.includes(row);console.log(ok?'OK sub.waiting row verbatim':'FAIL row');process.exit(ok?0:1)"` ⇒ `OK sub.waiting row verbatim`
- `#10` 旧值零残留：`node -e "const fs=require('fs');const t=fs.readFileSync('docs/vsc/design/WEBVIEW.md','utf8');const bad=/\u73b0 425 \u884c/.test(t);console.log(bad?'FAIL 425 residue':'OK 0 stale 425');process.exit(bad?1:0)"` ⇒ `OK 0 stale 425`
- `#11` 旧值零残留：`node -e "const fs=require('fs');const t=fs.readFileSync('docs/core/design/TESTING.md','utf8');const bad=/\u5355\u5143\u57df\u76d8\u4e0a \*\*60\*\* \u6863|VSC 60 \u5355\u5143/.test(t);console.log(bad?'FAIL stale 60':'OK 0 stale 60');process.exit(bad?1:0)"` ⇒ `OK 0 stale 60`
- `#12` 指针可解析：`node -e "const fs=require('fs');const a=fs.existsSync('thincoder-vscode/docs/design/RELEASE.md');const b=fs.existsSync('thincoder-vscode/docs/_archive/design/RELEASE.md');const t=fs.readFileSync('docs/cli/design/RELEASE.md','utf8');const refs=t.split('\n').filter(l=>l.includes('thincoder-vscode/docs/design/RELEASE.md')).length;console.log((!a&&b&&refs===1)?'OK archive in place / old addr only in changelog':('FAIL a='+a+' b='+b+' refs='+refs));process.exit((!a&&b&&refs===1)?0:1)"` ⇒ `OK archive in place / old addr only in changelog`

#### ③ C3 机检读数（净增 0）

- 终态：`cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ `OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽): 源域全部 .md 无 >300 字符单行` ⇒ **exit 0（净增 0——与 §2.11 终态基线同值）**。
- 中途一次红（就地修 · 登记）：本笔新写 `docs/cli/design/RELEASE.md:131` 的裸 token `test/run.mjs` 判悬空（basename `run.mjs` 仓内多义 → 宽容规则不适用）⇒ 改全路径 `thincoder-cli/test/run.mjs` 后转绿。**机检口径旁证**：多义 basename 仅在 token **不含 `/`** 时才宽容（`scripts/doc-check-anchors.mjs:171`——`n ≥ 2 ∧ 含 "/"` ⇒ 判 null）。
- **交付时点补读（并行线扰动 · 如实登记）**：末次复跑（04:4x）闸读 = `悬空 1`（`docs/core/design/MODEL-SPECS.md:380 none`——**符号锚**）。**归属 = 并行会话的在途未跟踪档**（非本笔写域）：证据 ① `git status` 该档 = `??`（仓内基线外）且 mtime = 本地 04:36（晚于本笔全部写入）；② 其符号行号在本笔两次复跑间位移（`:74→:75` · `:87→:88` · `:177→:181` · `:199→:203` · `:355→:385`）⇒ 档在我笔下被他人改写；③ 该锚宿主 = `thincoder-cli/src/tui/cmd-think.mjs`（在盘但无裸 `none` token）。**本笔面读数（诊断 · 经引擎原样调用、仅临时加排除该单档）**：声明面 `悬空 1` → **排除该单档后 `悬空 0`** ⇒ 本笔写集**净增 0**（与 §2.11 终态基线同值）。**处置建议**：交并行会话或收口父侧（本笔不动他人在途档）。

#### ④ 不一致处 / 新发现（本轮探索所得 · 附证据 · 逐条报告 · **未就地修**）

| # | 级 | 发现 | 证据 | 处置建议 |
|---|---|---|---|---|
| G-1 | 🟡 | **「归档址」死指针族**（#12 同判据的更大面）：`ARCHITECTURE.md` §3.1 表内 8 处 + §7.2 行 1、`WEBVIEW.md` §7.2 行 2 仍指 `thincoder-vscode/docs/design/*.md`——该产品树设计档已整体入 `_archive/design/` | 实测 `thincoder-vscode/docs/design/` 仅剩 `_archive/`；机检不红 = 多义 basename 宽容规则（同上） | 随下轮同族收正；或明文登记「归档降格面 = 保留 ≠ 维护、指针不追」 |
| G-2 | 🔵 | `WEBVIEW.md:261` / `:378` 的「（拟新增）」= 陈旧态（`thincoder-vscode/webview/activity-diag.js` 已落地 **83 行**） | 文件在盘；同批姊妹档 `WEBVIEW-PROTOCOL.md:511-513` 已去该标记 | 一行收正（本轮未动——超 13 条射程） |
| G-3 | 🔵 | `WEBVIEW-PROTOCOL.md` §6.2「块头字段对位」表**无 queued 状态词行**（CLI ` · queued|waiting`）——`WEBVIEW.md:180` 已落该契约、§6.3 已登记键，表未对位 | §6.2 现 10 行（`:215-225`）无该行；`:217` 仅注「queued 不携模式词」 | 一行补（本轮未动——超 13 条射程） |
| G-4 | 🔵 | §6.3 键表自称「N 键」但**非 locales 全量清单**（`sub.queued` / `sub.async` / `sub.done` 等在位键未登记） | `locales/en.json:148-162` 有 15 个 `sub.*` 键；表只收其中 4 个 | 明确该表口径，或逐键登记——防下一新键再现 #4 型缺口 |
| G-5 | 🔵 | 本轮新登记的 `sub.waiting` 在**产品码面尚无实体**（设计先落；批 1 R6 落地前 locales 零命中） | grep 零命中 | 实施轮 R6 落地后随批核销（落点已写 §2.5） |
| G-6 | 🟡 | **v1 词面残留的域外面**（#1 / #3 同判据的更大面）：设计面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:500`（A6 判据 = `lint` / `test:full` / `test:integration` 全绿——**死命令**）· `DOC-DISCIPLINE.md:910`（发布门链 = `lint` → `test:full` → `test:integration`）· `:997`（全量跑 = `npm run test:full`）· `CORE-UNIFICATION.md:619-620` / `:913` / `:1728` · `ADVISOR-CONVERGENCE.md:294` · `DOC-MIGRATION.md:221` · `VSC-DEBT.md`（:6 / :14 / :27 / :65 / :192 / :197-198 / :207-209）；**同批写域（5b 检索域外 · 复核轮 #4 补登）** = `docs/vsc/design/WEBVIEW-PROTOCOL.md:328`（「`npm test` 快层逐跑」= v1 词汇面残留——该档本轮被 #4 触碰，5b 检索域（同族四档）未含该档；评审 id=18 as-of = `:326`，本笔 #1 在 §6.3 注内插 2 行 ⇒ 下移至 `:328`）；**需求面**（非我笔）= `docs/core/requirements/TESTING.md`（:3 / :20 / :52-56 / :104 / :107 / :114-116 / :157 / :170-181——已含 §2.9 F-1）· `docs/vsc/requirements/PROJECT.md:74`（N-P1 归册慢层）· `docs/vsc/requirements/WEBVIEW.md:99`（N-W5 证据 = `node test/run-fast.mjs` 全绿——**死命令**）· `docs/core/requirements/RELEASE.md:46`（V-F1「原『四环』」修订式表述） | 实测扫描（`docs/**` 去 `batches/` 与 `_archive/`）= 84 处命中（4 处 = 本轮记录面白名单）；其余逐行判「**历史对照（合法）** vs **死处方（违规）**」：合法例 = `ENGINEERING-MODE-V2.md:271`（「不再 lint + … 三层」= v2 设计陈述）· `prompts/discipline-engineering.md:65` 同 · `TODO-archive.md`（归档） | 设计面可按「同族四档判据」扩为**全 docs 域**另轮收正（本轮未动——超 13 条射程）；**需求面 4 档 = 主 agent 笔**，建议随 F-1 同批处置 |

#### ⑤ 净增核与边界

- **C1** 13 / 13 条一条不漏（①表逐号）；**C2** 七项全绿（逐条实跑读数见 ②）；**C3** 净增 0（见 ③）；**C4** 与父侧已落面零冲突——设计档四行的「现状」列按 **§2.11 落地后 + 本修正轮后**读数重出，**§2.11 记录本身未被回改**。
- **本修正轮不做**：实现面（产品码 / `scripts/**` / 提示词 / 两产品 `AGENTS.md`）· 需求档（父侧笔）· §3 / §4 / §6（他人段）· 13 条以外的收正（G-1–G-4 = 报告面）· 新增设计条目。

### 2.13 复核轮 2（承 §3 轮次 2 评审 · 4 条 · 定点收正 · 追加制）

**轮次** = fix（定点 · 追加制）。**书源** = §3 评审 id=18（VERDICT = **pass** · 🟡1 / 🔵3）+ 父侧逐条裁定「接受」+ 父侧实读标尺真身（`thincoder-cli/src/tui/subagent-panel.mjs:100-102`：`kind === "slot"` ⇒ slot 文案；否则 ⇒ `queued.detail || "queued"`）。
**落笔形态**：§1.1 / §2.1 / §2.3 / §2.5 / §2.7 / §2.12 ④ + 本档外两档（`WEBVIEW.md` / `WEBVIEW-PROTOCOL.md`）= **定点就地收正**；本段 = 该轮的轮记（追加）。

#### ① 逐条「号（#1..#4）→ 改动 file:line」

| # | 级 | 改动（file:line） | 内容 |
|---|---|---|---|
| 1 | 🟡 | 批档 `:56`（§2.1 R5 行）· `:71`（A118-2 行）；`docs/vsc/design/WEBVIEW.md:182`；`docs/vsc/design/WEBVIEW-PROTOCOL.md:248-250` | **降级支收正为 CLI 形**：`kind === "slot"` ⇒ slot 文案；**其余（含 `kind` 缺省）** ⇒ `reason` 原文零改写；无 `reason` ⇒ **中性回落 `t("sub.queued")`**（= CLI `queued.detail \|\| "queued"` 同形）。R5 同点明写**降级形**（缓存缺省 ⇒ 载荷仅 `position`）= 状态区 `t("sub.queued")` ∧ 状态词 `t("sub.waiting")`（`kind` 缺省 ⇒ 走 `kind !== "slot"` 支，与 R4 头词同判据）。`WEBVIEW.md:182` 括注由「`kind` 缺省时按 `reason == null` 判 slot」整句删除、改为 `kind` ≠ `slot` 支（含回落后备）。`WEBVIEW-PROTOCOL.md` §6.3 注：`sub.waiting` 行**明标消费点 = 状态词**（`activity-view.js:38`）+ `kind` 缺省并入同支；**新增状态区（方括号后）键面**一行（slot ⇒ `sub.queueSlot`；wait / depc ⇒ `reason` 原文；降级 ⇒ `sub.queued`——`activity-view.js:77-80`，标尺 CLI `:100-102`）。A118-2 降级行**期望形态写死**（状态词 `t("sub.waiting")` ∧ 状态区 `t("sub.queued")`） |
| 2 | 🔵 | 批档 `:123`（§2.3 已落清单行） | 指针「`WEBVIEW.md` §5.3 `:226`」→ **`:230-231`**（§2.11 行宽拆分后存活投影「载荷与 relay 面同形」句实读所在行） |
| 3 | 🔵 | 批档 `:14`（§1.1 条目 1 行） | CLI 状态区行号 `:98-101` → **`:100-102`**（与 §2.1 / `WEBVIEW.md:180` / 批档 `:72`（A118-3 行）统一） |
| 4 | 🔵 | 批档 `:303`（§2.12 ④ G-6 行）· `:210`（§2.7 命令 5b 行尾注） | G-6 清单补登**同批写域档**的 v1 词汇面残留 `docs/vsc/design/WEBVIEW-PROTOCOL.md:328`（评审 id=18 as-of = `:326`；本笔 #1 在该档 §6.3 注内插 2 行 ⇒ 下移，坐标按盘上实读登记）；5b 行内注写明**域外残留的登记处 = §2.12 ④ G-6 清单**（5b 检索域不扩） |
| 5 | —— | 批档 `:178`（§2.5 `WEBVIEW-PROTOCOL.md` 行）· `:182`（行数口径注） | **随 #1 同源的计数收正（一致性面 · 就地修 · 报备）**：该档现状 520 → **522 行**（#1 插入 2 行）+ Δ 记 +8（#4 键表族 +6 · 复核轮 #1 +2）；行数口径注纳入「复核轮（§2.13）」 |

#### ② C2 断言清单（cmd.exe 可跑 · 判据全 ASCII · 逐条实跑读数）

**单命令 14 断言（实跑 = `OK all 14 assertions` · exit 0）**：

```
cd D:\teamcode\thincoder && node -e "const fs=require('fs');const BT=String.fromCharCode(96);const raw=fs.readFileSync('docs/batches/2026-09-20-consistency-sync-batch.md','utf8').split('\n');const s2=raw.findIndex(l=>l.startsWith('## \u00a72')),s3=raw.findIndex((l,i)=>i>s2&&l.startsWith('## \u00a73'));const S2=raw.slice(s2,s3).join('\n');const S12=raw.slice(0,s3).join('\n');const Wl=fs.readFileSync('docs/vsc/design/WEBVIEW.md','utf8').split('\n');const Pl=fs.readFileSync('docs/vsc/design/WEBVIEW-PROTOCOL.md','utf8').split('\n');const C=fs.readFileSync('thincoder-cli/src/tui/subagent-panel.mjs','utf8').split('\n');const Q=String.fromCharCode(34);const r=[];r.push(['#1 ruler: CLI :102 = queued.detail || '+Q+'queued'+Q,/queued\.detail \|\| \u0022queued\u0022/.test(C[101])]);r.push(['#1 stale degraded rule absent in WEBVIEW.md',!Wl.join('\n').includes('reason == null')]);r.push(['#1 WEBVIEW.md:182 = kind!=slot branch + fallback key',Wl[181].includes('\u964d\u7ea7\u5f62\u6001')&&Wl[181].includes('queued.detail || '+Q+'queued'+Q)]);r.push(['#1 PROTOCOL:250 = degraded branch + state-area keys',Pl[249].includes('\u964d\u7ea7')&&Pl[249].includes('sub.queueSlot')]);r.push(['#1 PROTOCOL:249 marks consumer = state word',Pl[248].includes('\u6d88\u8d39\u70b9 = \u72b6\u6001\u8bcd')]);r.push(['#1 R5 CLI-form in batch \u00a72',S2.includes('**\u5176\u4f59\uff08\u542b '+BT+'kind'+BT+' \u7f3a\u7701\uff09**')&&S2.includes('\u4e2d\u6027\u56de\u843d')]);r.push(['#1 A118-2 degraded expectation written',S2.includes('\u671f\u671b\u5f62\u6001\u5199\u6b7b')]);r.push(['#2 batch \u00a72 pointer :230-231, no \u00a75.3 :226',S2.includes('\u00a75.3 :230-231')&&!S2.includes('\u00a75.3 :226')]);r.push(['#2 WEBVIEW.md:230-231 = live projection payload',/\u5b58\u6d3b\u6295\u5f71/.test(Wl[229])&&/\u8f7d\u8377\u4e0e relay \u9762\u540c\u5f62/.test(Wl[230])]);r.push(['#3 \u00a71.1 ruler = :100-102',raw[13].includes('subagent-panel.mjs:73'+BT+'/'+BT+':100-102')]);r.push(['#3 no :98-101 in \u00a71+\u00a72 (outside \u00a73)',!S12.includes(':98-101')]);r.push(['#4 G-6 registers PROTOCOL:328 and it resolves',S2.includes('WEBVIEW-PROTOCOL.md:328')&&/\u5feb\u5c42\u9010\u8dd1/.test(Pl[327])]);r.push(['#4 5b row names G-6 as registry place',/\u57df\u5916\uff08\u68c0\u7d22\u57df\u5916\uff09\u6b8b\u7559\u7684\u767b\u8bb0\u5904 = \u00a72.12 \u2463 G-6/.test(S2)]);r.push(['C4 prior-round key-table count 14/14',(()=>{const s=Pl.findIndex(l=>l.startsWith('### 6.3'));const e=Pl.findIndex((l,i)=>i>s&&l.startsWith('## 7.'));return Pl.slice(s,e).filter(l=>/^\| \x60/.test(l)).length===14})()]);let bad=0;for(const x of r){if(!x[1])bad++;console.log((x[1]?'OK   ':'FAIL ')+x[0])}console.log(bad?('FAIL '+bad):'OK all 14 assertions');process.exit(bad?1:0)"
```

逐条读数（原样）：`#1` ×7 = OK（CLI 标尺 `:102` 命中 `queued.detail || "queued"` · 旧口径 `reason == null` 在 `WEBVIEW.md` 零命中 · `WEBVIEW.md:182` = `kind` ≠ slot 支 + 回落后备 · `PROTOCOL:250` 降级支与状态区键面 · `PROTOCOL:249` 消费点 = 状态词 · 批档 §2 R5 CLI 形 · A118-2 期望形态）；`#2` ×2 = OK（§2 指针 `:230-231` 且 §2 内 `§5.3 :226` 零命中 · `WEBVIEW.md:230-231` = 存活投影行）;`#3` ×2 = OK（§1.1 行 = `:100-102` · §1+§2 内 `:98-101` 零命中）；`#4` ×2 = OK（G-6 登记 `PROTOCOL:328` 且该行实载 `npm test` 快层逐跑 · 5b 行内注 = G-6 登记处）；`C4` ×1 = OK（上轮键表 14/14 未破）。

**辅助读数**：`node -e` 行计数（`split('\n').length - 1` 口径）⇒ `TESTING 408 · ARCHITECTURE 197 · RELEASE 136 · WEBVIEW 509 · WEBVIEW-PROTOCOL 522`（与 §2.5 现状列逐档相符）。

#### ③ C3 机检读数（净增 0）

- `cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ 汇总 `悬空 1 · 注记豁免 43 · 拟新增 6 · 迁移期引文 213` + `OK(行宽): 源域全部 .md 无 >300 字符单行`。
- **本笔写集净增 0**：首读（落笔前）与末读（落笔后）为**同一条同址**——`✗ docs/core/design/MODEL-SPECS.md:380 none（符号）`。该档 `git status` = `??`（仓内基线外 · 并行会话在途），mtime 早于本笔写入 ⇒ **非本笔写域**（承 §2.12 ③ 同族登记）。故闸态行的 `FAIL(锚): 1 条悬空` = 该在外档所致，本笔四档改动零新增悬空。
- 行宽：本笔新写行读数 = `WEBVIEW.md:182` 243 · `PROTOCOL:248` 155 · `:249` 188 · `:250` 291（均 < 300；`PROTOCOL` 的 §6.3 注按宽度拆为 3 行 = 行数 +2 之因）。

#### ④ 不一致处 / 新发现（本轮探索所得 · 逐条报告）

| # | 级 | 发现 | 证据 | 处置 |
|---|---|---|---|---|
| D-1 | 🔵 | **#4 登记坐标与评审 as-of 差 2 行**：评审 id=18 #4 记 `:326`，本笔 #1 在**同档 §6.3**（`:248`）插 2 行 ⇒ 该残留行下移至 `:328` | grep 实测 `PROTOCOL:328` = 「…`npm test` 快层逐跑）」；`:326` 现为坐标注行 | 按**盘上实读**登记 `:328`，并把评审 as-of `:326` 与位移因由写入 G-6 行（D4：指针须解析）——**偏离父侧字面坐标，报备** |
| D-2 | 🔵 | **§2.5 计数随 #1 同源漂移**：`WEBVIEW-PROTOCOL.md` 行数 520 → 522（#1 插 2 行） | 盘上实读 522（`split` 口径 −1）；该档 §6.3 注按行宽拆为 3 行 | **就地修**（一致性面 · D3 计数与列表同改）+ 行数口径注纳入复核轮（见 ① 第 5 行） |
| D-3 | 🔵 | **降级态显示面观感**（设计意图 · 非缺陷）：降级档状态词 = `等待中`（waiting）∥ 状态区 = `排队中`（`sub.queued`）——两词面不同 | CLI 同形（`statusWord` = `waiting` ∥ `statePart` = `queued`） | **登记不改**（= CLI 逐档同形；实施轮勿以「词面不一致」为由收正） |
| D-4 | 🔵 | **§3 轮次 2 引文残留**：`:369`（`§5.3 :226`）· `:370`（`:98-101`）= 评审对**当时**批档的引证 | grep 实测仅 §3 内命中 | **不回改**（评审段 = 他人笔 · 冻结记录面）；全档范围内这两串的命中处 = §3 两行 |
| D-5 | 🔵 | `WEBVIEW-PROTOCOL.md:222`（§6.2 状态区·queued 行）未对位降级支（本轮 #1 只落 §6.3 注） | `:222` 现文 = slot / 原因原文两档，无降级档 | **不改**（与 §2.12 ④ **G-3** 同族——该表未对位，本轮射程外）；登记供下一轮 |

#### ⑤ 净增核与边界

- **C1** 4 / 4 一条不漏（① 表逐号；另报 1 条同源计数收正 = 第 5 行）；**C2** 14 / 14 全绿（② 单命令；判据全 ASCII · cmd.exe 可跑）；**C3** 净增 0（③ —— 闸读的唯一悬空项 = 并行会话在途档，本笔首末两次复跑同一条同址）；**C4** 与父侧已落面零冲突——上轮键表 14/14 与四档行数读数逐档核过，`§2.11` / `§2.12` 记录面**未被回改**（§2.5 现状列与口径注按本轮后实读重出，属活面）。
- **本复核轮不做**：实现面（产品码 `thincoder-vscode/**` / `scripts/**` / 提示词 / 两产品 `AGENTS.md`）· 需求档（主 agent 笔）· 批档 §3 / §4 / §6（他人段）· G-1–G-7 与 D-5 的实际收正（只补 G-6 登记）· 新条目 / 新键 / 新字段。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：批档 §1–§2 全段 + 已落设计档四档（TESTING.md / ARCHITECTURE.md / docs/cli/design/RELEASE.md / docs/vsc/design/WEBVIEW.md）。评审面局限：需求档 / 两产品 AGENTS.md / 提示词双面 / `scripts/**` / VSC 产品码均不在评审面 ⇒ 相关断言标 unverified；无 document map 与 standards 档 ⇒ 文档归属按 Project Guide 与档内权威声明判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | `docs/core/design/ARCHITECTURE.md:97` 仍把 VSC 测试面写成 `"test" = node test/run-fast.mjs` + `"test:full" = 全量层——slow-gate 分层`；`ARCHITECTURE.md:146`（§4.1 差异表「验证层」行 = `slow-gate 分层 + files.mjs 显式清单`）同病。与本批裁定为单一权威的 `TESTING.md` §10 F2（每包一条 `test` = `node test/run.mjs`）· AC-M10-2（`run-fast`/`slow-gate` 文件名不存在）· §1.2 入口表（VSC = `thincoder-vscode/test/run.mjs`）直接相抵 ⇒ 同一机制两处不同描述 = 机制级矛盾。批档 §2.3 对 ARCHITECTURE 的改动面只到 `:5`/`:6`/`:117-119`（:115），未覆盖此二处；§2.7 命令 5b 检索域仅 TESTING.md ⇒ 机检不红。 | 把 :97 与 :146 收正为单入口形态（VSC = `node test/run.mjs` + 显式清单；删 `test:full` / `slow-gate 分层` 词面）；把 5b 类检索扩到同族四档（ARCHITECTURE / RELEASE 同判据）。 |
| 2 | Doc hygiene / state | 🟡 | `TESTING.md:4` 仍写「§1 分层纪律 / §3 生命周期 / §4 集成集 runner 为 v1 历史（v2 由 §10 替代）」，而本轮已把 §1 改名「分层纪律与测试门（v2）」（:12）并填入活语义（L0/L0+/L2 :22 · slow 标注 :30 · §4.2/§4.3 单入口契约 :111/:121-124）⇒ 同一档内「§1 = v1 历史」与「§1 = v2 活档」并存（规范面残留 + 状态相抵）。批档 §2.3 的收正清单列了 `:3 / :7 / :8`，未含 `:4`。 | 该行按 v2 收正（§1 活语义 = 工作分工；门禁权威 = §10），删「为 v1 历史」表述。 |
| 3 | Completeness / acceptance | 🟡 | 半改残留（v1 快层 / slow 门 skip 语义仍在活段）：`TESTING.md:99`（「快 / 全两层」）· `:105`（「slow 门与集成门两套 skip 叠加」）· `:107`（「对照 slow 门…防漂移」）· `:193`（对账口径「快层执行面内」——A-TS10 的执行面，语义悬空）· `:194` · `:206` · `:242`（「slow 门 / 分层机制语义改动」）。§10 F1/F3 已裁定 v2 无快层、`slow()` 不 skip、防漏拦截删除。A116-1（命令 5b）正则只查 `test:full|test:integration|slow-gate.mjs|run-fast|run-full|run-integration`，命不中「快层 / slow 门 / 快·全两层」⇒ 「§1–§8 死命令零残留」的覆盖面窄于缺陷面（该命令在盘上确会返回 OK）。 | 上述行按 v2 词面收正（对账口径改「单入口执行集内」）；AC 补按词面（快层 / slow 门 / 快·全两层）判零残留的检索，或把 5b 的判据集列全。 |
| 4 | Document ownership | 🟡 | #118 新增 i18n 键 `sub.waiting`（批档 :57）无落档点：`WEBVIEW.md:188` 明写「i18n 键表 = `WEBVIEW-PROTOCOL.md`（本档不重述）」，而批档 §2.5 受影响文件表（:153-173）与 §2.3 已落清单均未列该档 ⇒ 键表权威若不同步，新键落在权威表外（unverified：该档不在评审面）。 | 受影响文件表补该档（或注明该键已在表在位），并给出 `sub.waiting` 的 en/zh 逐字登记点。 |
| 5 | Affected-file annotations | 🟡 | 批档 §2.5 三行未标行数：`locales/en.json + zh.json`「未核行数」（:159）· `test/activity-closure.test.mjs`「17.6 KB（行数未核）」（:161）· `test/chat-panel-messages.test.mjs`「28.0 KB（行数未核）」（:162）。无现状行数 ⇒ 越线判定不可做（>300 主动复审 / >500 必须拆分）；28.0 KB 的档是否已越 500 硬限未知，而其 Δ 只写「+2 行」。 | 三档补现盘行数 + 预期 Δ；若某档 >500，附拆分计划。 |
| 6 | Clarity / evidence | 🟡 | §2.5 已落三档的行数与盘上不符：`TESTING.md`「426 → 401 行」（:168；盘上 404 行）· `ARCHITECTURE.md`「192 → 193」（:169；盘上 194）· `WEBVIEW.md`「499 → 501」（:171；盘上 504）；仅 `RELEASE.md`「134 → 132」与盘上一致（:170）。§2.11 的轮内 3 处行宽拆分（`ARCHITECTURE.md:187` · `WEBVIEW.md:180` · `:226`）发生在表成稿之后 ⇒ 现状 / Δ 两栏已失效。 | 按落笔后盘上实测重出该三档行数（现状与 Δ 同步），并写明与 §2.11 轮内改动的先后。 |
| 7 | Methodology / record | 🟡 | 四档中三档有 2026-09-20 变更记录（`TESTING.md:382` · `ARCHITECTURE.md:187` · `WEBVIEW.md:468`），`RELEASE.md` 无——其变更记录止于 2026-09-15（:128-132），正文却已按本轮改为「两步一链」（:15 表两行 · :20 · :22 · :76），旧记录 `:132` 仍写「三环：lint → 全量 → **集成集**」⇒ 记录面留下无解释的相抵。批档 §2.6 批 3 准入声明「已落（D7 逐档变更记录 1 条）」（:181）与盘上不符。 | `RELEASE.md` 变更记录补本轮 1 条（死入口名「两步一链」收正），使 D7 声明与盘上一致。 |
| 8 | Clarity | 🟡 | #118 载荷字段 `waiting` 语义与消费面未定：§2.1 R1/R2/R3（:52-54）载入并转投 `waiting`、A118-2（:65）断言四项全等，但 R4/R5（:55-56）的显示判据只用 `kind` 与 `reason`；`WEBVIEW.md:182` 亦只列字段名 ⇒ 实施者无法判其类型（布尔 / 字符串）与唯一消费点，存在 `waiting` ∥ `kind` ∥ `reason` 三源并存风险。 | 明确 `waiting` 的类型与唯一消费点，或从载荷剔除只留 `kind` / `reason`；A118-2 的同形断言按最终字段集写。 |
| 9 | Completeness | 🟡 | #118 显示链未穷举刷新路径：`WEBVIEW.md:50` 记 `panels.js` `_panelTimer`（2 s）「同点刷 live 块头」、`:147` 记 chunk / turn / 审批态「覆盖式刷新头词与状态区」。R3（:54）只把 `kind` 记入 import 时消息面的 `meta.queueInfo`，未说明 `kind` 是否也进块级活态载体 ⇒ 若 2 s 刷新 / `refreshBlock` 从活态载体重建 queued 头词与状态区，则刷新后回落 `sub.queueSlot`（缺陷复辟路径）。载体细节在评审面外（unverified）。 | 在 §2.1 明写 `kind`（及 `reason` / `position`）的活态载体与读点，覆盖 2 s 刷新与块重建两路径；A118-1/A118-2 各补一条刷新后断言。 |
| 10 | Numeric drift | 🔵 | 同一档行数两说：批档 §2.5 `webview/activity.js` = 435 行（:157）vs `WEBVIEW.md:259` 与 D-W22（:376）= 425 行（read 口径）。差 10 行，影响「近 500 硬限」余量判断。 | 统一读数口径，两处收正到同一 as-of。 |
| 11 | Numeric drift | 🔵 | `TESTING.md` §10 VSC 清单条数两说：`:310` / `:336` = 61 条 vs `:339` / `:372`（A-RC3）= 60 档（该族 2026-09-18 已在，非本轮新增）。 | 收正到同一 as-of（并行线 `tool-display-sync.test.mjs` 登记后应为 61）。 |
| 12 | Same-family residue | 🔵 | `RELEASE.md:5` / `:100` / `:125` 仍以「VSC 侧**未迁**」指 `thincoder-vscode/docs/design/RELEASE.md`；本轮在 `ARCHITECTURE.md` 把同形态「未迁」指针判为死链并收正（批档 :115）⇒ 同族判据未遍及本档（目标档是否在盘 unverified——产品树不在评审面）。 | 按同一判据核本档三处「未迁」指针（在盘 ⇒ 保留并标 as-of；不在盘 ⇒ 同 ARCHITECTURE 收正）。 |
| 13 | Coordination item | 🔵 | F-2（`thincoder-vscode/AGENTS.md` 死节号 / 措辞）已在批 1 由 C12 落笔（批档 :212 处置 = 「随 #115 同批修」），批 4 又列「F-2 / F-3 裁定」（:182）⇒ 同一项两处派工，边界不清。 | 批 4 只留 F-1 / F-3，或写明 F-2 在本批已由 C12 落笔、不再另裁。 |

**计数**：🔴 1 · 🟡 8 · 🔵 4（共 13）。

**出界（不assignseverity）**：需求档 F-1 / F-3（`docs/core/requirements/TESTING.md` :20-22 / :103）· 两产品 AGENTS.md 与提示词双面（含 #117 en 面 :150-156）· VSC 产品码 3 档 + i18n + 测试 3 档 · `scripts/**`（check-vsix.mjs / release-check.mjs——`TESTING.md:123` 记失败详情提取 `:57-63` 与 `RELEASE.md:22` 记链编排 `:66-74` / `:76-78` 的区间差异未核）· `ARCHITECTURE.md` §3.1 / §7.2 的产品树指针族 · triage 表 3 功能候选。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮（修正声明复核——承评审 id=13 VERDICT=changes-required + 修正轮 id=14）**

**评审面** = 批档 §1–§2 全段 + 六档（本批档 · `docs/core/design/TESTING.md` · `docs/core/design/ARCHITECTURE.md` · `docs/cli/design/RELEASE.md` · `docs/vsc/design/WEBVIEW.md` · `docs/vsc/design/WEBVIEW-PROTOCOL.md`）。声明排除面（需求档 / 两产品 AGENTS.md / 提示词双面 / `scripts/**` / VSC 产品码 / locales / 测试档 / `MODEL-SPECS.md` / G-1–G-7）不核，相关行数断言标 unverified。无 document map 与 standards 档 ⇒ 归属按 Project Guide + 档内权威声明判。

**① 13/13 落档核（每号一条证据）**

| # | 判定 | 证据（file:line） |
|---|---|---|
| 1 | 落 | `docs/core/design/ARCHITECTURE.md:97`（测试面 = 单入口 `node thincoder-vscode/test/run.mjs` + 显式清单 + 权威 §10；`test:full` / `slow-gate 分层` 词面为零）· `:146`（§4.1「验证层」行同形）· `:187`（变更记录）；批档 `:210`（5b 检索域已扩四档 + 词汇面判据） |
| 2 | 落 | `TESTING.md:4`（§1 = 活语义 + 门禁权威 §10；「为 v1 历史」表述零残留） |
| 3 | 落 | `TESTING.md:99` / `:105` / `:107` / `:193` / `:194` / `:206` / `:242` 七处词面收正；5b 判据集已列全 |
| 4 | 落 | `WEBVIEW-PROTOCOL.md:227`（表头 = 14 键）· `:236`（键行逐字在位）· `:248`（登记注 + 选用判据 + 成对键）· `:465-467`（变更记录）；表内键行实数 14 = 声明 ✓ |
| 5 | 落 | 批档 `:165`（locales 各 260 行 + 1×2）· `:167`（activity-closure 297 → ~303）· `:168`（chat-panel-messages 458 → 460）· `:185-188`（尺寸档 = 理由 / 触发 / 抽取候选线） |
| 6 | 落 | 批档 `:174-178` 现状列 = 408 / 197 / 136 / 509 / 520，与本轮盘上实读逐档相符（末行号：TESTING :408 · ARCHITECTURE :197 · RELEASE :136 · WEBVIEW :509 · WEBVIEW-PROTOCOL :520）；先后注 = `:182-183` |
| 7 | 落 | `docs/cli/design/RELEASE.md:130-132`（2026-09-20 变更条在位）；正文「两步一链」= `:15` / `:20` / `:76` |
| 8 | 落 | 批档 `:60`（载荷字段语义定案块：三值枚举 / 显示面零消费 / 消费面两处）· `:71`（A118-2 字段集 = 定案四项） |
| 9 | 落 | 批档 `:62-64`（载体与读点块 + 两条刷新路径）· `:70-71`（A118-1 / A118-2 各补刷新后断言）；`WEBVIEW.md:183-184`（载体行）+ `:471`（变更记录） |
| 10 | 落 | `WEBVIEW.md:261` · `:378`（D-W22）两处同为 434 行 + 同一口径 + as-of；批档 `:163` 同值 |
| 11 | 落 | `TESTING.md:339` · `:372` 两处同为 61；`:310` / `:336` 未动（61 保持） |
| 12 | 落 | `RELEASE.md:5` / `:100` / `:125` 三处 = `thincoder-vscode/docs/_archive/design/RELEASE.md`；该归档档**在盘**（本评审实测）· 旧址字符串全文仅 1 次（`:132`，变更记录面） |
| 13 | 落 | 批档 `:197`（批 4 只留 F-1 / F-3 + 「F-2 已由 C12 落笔」说明） |

**结论：13 / 13 全部落档**（① 表逐号可核）。5b 类判据实测可复现：同族四档在切点前零命中（`TESTING` 切 §9 / 另三档切「变更记录」，切点后命中均为记录面白名单：`RELEASE.md:131` · `ARCHITECTURE.md:187` · `TESTING.md:259` / `:266` / `:267` / `:277` / `:384` / `:387`）。

**② 复核发现（含修正引入的新问题）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Acceptance verifiability | 🟡 | **降级支三处不一致**（修正轮文本内）：批档 `:55`（R4 头词判据 = `kind === "slot" ? W.queued() : W.waiting()`）未含降级支，而 `:56`（R5）与 `docs/vsc/design/WEBVIEW.md:182` 的降级规则 = 「`kind` 缺省 ∧ `reason == null` ⇒ 判 slot」（⇒ 头词应 `queued`）；`WEBVIEW-PROTOCOL.md:248`（#4 新增登记注）同缺降级支且未标消费点（状态词 vs 状态区）。⇒ 降级载荷（F-5 / A118-2 降级行）按两处文本得出不同形态（头词 `waiting` ∥ 状态区「排队中 · 位置 N」），A118-2 降级行期望形态不可判定；并读 §5.2「wait/depc 状态区 = host detail 原文（零改写）」有把 key 读作状态区文案的歧义 | 把降级支并入两处判据（`kind === "slot" || (kind 缺省 ∧ reason == null)` ⇒ `sub.queued` / `sub.queueSlot`），或明写降级形态的头词 + 消费点并回指单源 `WEBVIEW.md` §5.2；A118-2 降级行按此写死期望形态 |
| 2 | Numeric drift / coordinate | 🔵 | 批档 `:123` 以「`WEBVIEW.md` §5.2 :180 / §5.3 :226」指 #118 落档点，但盘上 `WEBVIEW.md:226` 现为「`logEvent("ev:subdeliver", …)` 五处置全留痕」行，存活投影「载荷与 relay 面同形」句已在 `:230-231`（§2.11 行宽拆分使该行下移）⇒ 该指针已失效（#9 只改 §2.1/§2.5，未及 §2.3 行） | 按盘上重出该指针（`:180` / `:230-231`）或改指节号 + as-of |
| 3 | Numeric drift | 🔵 | 同一 CLI 标尺「状态区」行号两说：批档 `:14`（§1.1 = `thincoder-cli/src/tui/subagent-panel.mjs:98-101`）vs `:46`（§2.1 = `:100-102`）；CLI 源不在评审面 ⇒ 不判哪说为准，只报批档内两说不同（`WEBVIEW.md:180` 用 `:100-102`） | 二选一收正到同一 as-of，并同步 `WEBVIEW.md:180` 的引注 |
| 4 | Completeness / disclosure | 🔵 | §2.12 ④ G-6 的「域外 v1 词面残留」清单未含同批写域内 `docs/vsc/design/WEBVIEW-PROTOCOL.md:326`（「`npm test` 快层逐跑」——v1 词汇面）；该档本轮被 #4 触碰，而 5b 检索域（四档）与 G-6 清单两级都未覆盖 ⇒ 下一轮收正清单会漏该档一行 | 把该行并入 G-6 清单（或把 5b 检索域扩到同批触碰档），并在 5b 行内注说明域外残留的登记处 |

**计数**：🔴 0 · 🟡 1 · 🔵 3（共 4）。

**出界（不 assign severity）**：VSC 产品码 / locales / 测试档（`activity.js` 434 行 · `activity-closure.test.mjs` 297 行 · `chat-panel-messages.test.mjs` 458 行 · `async-parity.test.mjs:346` 断言形态）· 需求档 F-1 / F-3 · 两产品 `AGENTS.md` · 提示词双面 · `scripts/**` · `docs/core/design/MODEL-SPECS.md`（并行会话在途）· G-1–G-7（已披露未修）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 04:56 父侧代签**——依据用户 03:58「**b**」（选定本批）+ 01:04 排空令（评审点火 + §4 批准委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（id=18 复核轮：13/13 落档核全通过 + 残余 1🟡3🔵 全接受）；② **修订轮（id=19）4/4 落地**（降级支就 **CLI 形** · §2.3 指针 `:230-231` · §1.1 标尺 `:100-102` · G-6 补登 `:328`）+ 断言 **14/14** 绿 + 净增 0；③ **token 已签发**（值不落档——运行时凭证）。

**响应表（轮 1 · 13 条）**：Fixed = #1–#10、#12、#13（含 🔴 #1 = ARCHITECTURE 单入口收正 + 5b 扩四档）· **Not an issue** = #11（`--root` 实核为真旗标）。

**响应表（轮 2 · 4 条）**：Fixed = 全部 4 条（#1 降级支三处收正为 CLI 形 · #2/#3 指针与标尺 · #4 G-6 补登）——**CLI 真身由父侧实读定案**（`subagent-panel.mjs:100-102` 三元式；`kind ≠ "slot"` 含缺省走 wait 支）。

**批准范围**：① **设计定稿**（批档 §1–§2 全段含 §2.11/§2.12/§2.13 + 设计档四档 + `WEBVIEW-PROTOCOL.md` 键表）；② **实施 = 批 1 三组并行**（#118 VSC 显示链 6 档 + 3 测试 · #115 两产品 `AGENTS.md` · #117 提示词双面 2 档）+ **批 2 父侧直改**（`thincoder-vscode/scripts/check-vsix.mjs` `tool-docs` 25 → 24）+ **批 4 父侧笔**（需求档 F-1 收正 · F-3 裁定；批 3 设计档面已落）；③ **特别授权**：`check-vsix.mjs` 计数收正（工程工具面）· 需求档 F-1（父侧笔）。

**收口预告**：三组落定 → 逐条核 A115 / A116 / A117 / A118 → 收口（§6）+ 核销 4 条 + **提交 + push**。

## §5 实施记录（eng-coder）

### 5.1 交付摘要（批 1-C · 台账 #117 · 提示词双面）

**范围** = #117（普通模式派单清单对齐，承 #95 已裁形态）· 面 = 提示词面（双面）· 轮次 = initial · 执行者 = eng-coder（承主 agent 内容权威——批档 §2.4 / §2.6 批 1）。

**改动清单（file → 落点 → Δ）**

| # | file | 落点 | Δ |
|---|---|---|---|
| 1 | `docs/core/design/prompts/discipline-normal.md`（zh 正本） | `:149-155`——`- 每次委派都带任务书：` 之下五条无标签 → **六条带标签** | 行数 202 → **203**（净 +1）；触改行 6 |
| 2 | `thincoder-core/prompts/discipline-normal.md`（en 运行面） | `:150-156`——`- Every delegation carries a task book with:` 之下五条无标签 → **六条带标签** | 行数 206 → **207**（净 +1）；触改行 6 |

**落笔逐字（zh）**：`**目标与理由**` · `**轮次**（初始 / 修复——修复轮只定点改、禁全量勘察）` · `**已知事实**（父代理已勘察的路径——不重复勘察）` · `**设计要点与禁止范围**` · `**验收标准**（机器可验证：命令、阈值、断言数——不要"做好点"）` · `**交付报告格式**。`

**落笔逐字（en）**：`**goal & why**` · `**round (initial | fix — fix rounds are point-fixes only, no full survey)**` · `**known facts** (paths the parent already explored — no re-exploration)` · `**design points & forbidden scope**` · `**acceptance criteria** (machine-verifiable: commands, thresholds, assertion counts — no vague "do it well")` · `**delivery-report format**.`

**既有句零改**：`git diff` 两档各恰一个 hunk（即清单块本身）——除「加标签 `**…**`」+「第 1 字段名 `目标与为什么` → `目标与理由`」+「新增 `轮次` / `round` 行」三类外**零字符改动**；清单后段落（zh `:156` / en `:157`「有规模委派缺这些字段是缺陷…」）逐字未动。零节变更（两档 `## ` 块数各 6，改区内无标题行）。**越线改动 = 0**（写域恰为声明 2 档）。

### 5.2 决策透明表（逐条：决定 / 理由 / 代价）

| # | 决定 | 理由（证据） | 代价 / 已登记 |
|---|---|---|---|
| D1 | 第 6 标签**尾标点保留**（zh `**交付报告格式**。` / en `**delivery-report format**.`） | 设计要点「只加标签、**既有句零改**」（该 `。`/`.` 为既有字符）；且与姊妹工程面 `docs/core/design/prompts/persona-engineering.md:111` 逐字同形；5e 判据不含标点 | 与 §2.4 逐字块（批档 `:148` = `  **交付报告格式**` 无句号）差 1 字符——内审 🔵 + advisor 🔵 双重登记；1 字符 revertible（上抛 1） |
| D2 | en `round` 行**粗体覆盖括注**（`**round (initial \| fix — …)**`） | 命令 5e 判据 = `en.includes('round (initial')`（大小写敏感、连续串）；若写家族式 `**round** (initial …)` 则 `round` 后接 `**` ⇒ 判据不命中（A117-1 红） | 与 zh `**轮次**（…）` 的粗体跨度不对称——advisor 🔵（非阻塞，上抛 2） |
| D3 | en 六标签取 §2.4 逐字**全小写**（非父侧简报示例 `**Goal & why**`） | 5e 的 `en6` 六串全小写 + `includes` 大小写敏感 ⇒ 照父侧简报字面落会红；小写形另与 marker 单源 label 串（`spawn-gates.mjs:19-23`）同形 | 与工程面 en 的 Title Case（`persona-engineering.md:108`）风格分叉——出界注记（报告面） |

**marker 相容**：六标签 1:1 命中 `thincoder-core/agent-tools/spawn-gates.mjs:18-24` 谓词（`/目标与理由/` · `/已知事实/` · `/设计要点/` · `/验收标准/` · `/交付报告格式/` · `/goal\s*&\s*why/i` · `/known\s+facts/i` · `/design\s+points/i` · `/acceptance\s+criteria/i` · `/delivery[- ]report\s+format/i`）；该档**零改**（谓词与 `:29` `ROUND_VALUES` 未触）；工程模式侧六字段正文（两档 `persona-engineering.md`）**零改**；无新字段。

### 5.3 验收读数（命令逐字取批档 §2.7）

| 验收 | 命令 | 读数 |
|---|---|---|
| **A117-1** | 命令 5e（`node -e "…"`，逐字） | **`OK 6 fields both faces`** · exit 0 |
| **A117-2** | 命令 3：`cd thincoder-core && npm test` | `tests 401 · pass 401 · fail 0 · cancelled 0 · skipped 0 · todo 0` · `duration_ms 15914` · **exit 0** |
| 机检净增 | 命令 1：`node scripts/doc-check.mjs` | `OK(行宽): 源域全部 .md 无 >300 字符单行`；闸读 `悬空 1` = 唯一项 `docs/core/design/MODEL-SPECS.md:380 none（符号）`（**并行会话在途未跟踪档**，与 §2.12 ③ / §2.13 ③ 同址登记）⇒ **本组写集零新增悬空、零宽行** |
| 旁证（自加 18 项逐行锚定断言） | `node -e`（逐行 startsWith + en `round` 行逐字等值 + 旧名零残留 + `## ` 块数 + 行宽） | **18/18 OK**（含 en `:152` 全行逐字等值；`## ` 块数 6 / 6；行数 202→203 · 206→207） |
| 旁证（提示词面零回归） | CLI `node --test test/prompts-async-guidance.test.mjs test/prompts-dual-source.test.mjs` · VSC `node --test test/prompts-async-guidance.test.mjs` | CLI **18/18** · VSC **19/19** |

### 5.4 审计与代码评审（轮次与终态）

- **内审（read-only explore 背离审计，1 轮）**：VERDICT = **pass**——四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**均未发现**；1 🔵（zh 尾 `。`，建议收口接受）；2 处审计限度（审计席无 git / 无 shell ⇒ 命令复跑降级为静态等价读数，实跑读数由本席在 5.3 补齐）。
- **advisor 代码评审（`type=code`，1 轮 · depth>0 同步）**：VERDICT = **pass**（0 🔴 · 0 must-fix 🟡 · 2 🔵 = 尾标点 + en 粗体跨度，均非阻塞）；出界注记 3 条（报告面，见 5.5-3）。
- **fix round = 0**（无 must-fix 发现 ⇒ 无修正轮）· **终态 = clean**。

### 5.5 上抛项

1. **🔵 尾标点定稿（需父侧一句裁定）**：① 严格逐字形 ⇒ 去 zh `:155` 尾 `。` / en `:156` 尾 `.`（1 字符/档，revertible）；② 认家族惯例（本席取此）⇒ 由文档层把 §2.4 逐字块补标点并在此登记。二者皆不阻塞 A117-1/2。
2. **🔵 en `round` 行粗体跨度**：现形为 5e 判据所强制（D2）；若父侧裁定改家族强调式 ⇒ 需文档层同改 §2.4 `:151` + 同步调 5e 判据串（超本组写域）。
3. **出界（报告面 · 不在本组写域，未就地修）**：① `thincoder-core/prompts/discipline-normal.md:192` 与 `:205` 为**同句逐字重复**（`Consultations are cross-turn background work: …`；zh 面仅 `:201` 一处）——非本批落点所致；② `docs/core/design/MODEL-SPECS.md:380` 悬空锚（并行会话在途档，承 §2.12 ③）；③ A117-1（5e）判据不含「字段数恰为 6」与两面同构断言（当前两面实读皆合格）。
4. **口径登记**：批档 §2.5 该两档「预期 Δ ~6 行 / ~7 行」= 触改行数口径；**净行数 Δ 实读 = +1 / 档**（202→203 · 206→207）——收口时请按实读口径记（设计档/批档非我笔，未改）。

### 实施记录 · 批 1-B（#115 两产品 `AGENTS.md` 残余四则 · eng-coder）

**状态行**：✅ 交付完成 · 内审（explore）0 偏差 · 代码评审（advisor·code）轮 1 changes-required（🔴1 / 🟡2 / 🔵2）→ **fix 轮 1 落定**（🔴#1 + 🟡#2 就地收正）→ **轮 2 复核 pass** ⇒ **终态 = clean**。任务书 = §2.2 C1–C12 全段；轮次 = initial。

#### ① 交付摘要（C1–C12 逐条 · 落点 = 现盘行）

| # | 落点 | 落地 |
|---|---|---|
| C1 | `thincoder-cli/AGENTS.md:12` | 链接 → `../docs/core/requirements/PHILOSOPHY.md`（在盘） |
| C2 | 同 `:12` | prompts 改指 `docs/core/design/prompts/`（中文正本）+「双面见下『提示词双面』条」；`src/prompts` 两档零残留 |
| C3 | 同 `:12` | 层根 → `docs/core/requirements/` / `docs/core/design/` |
| C4 | 同 `:14` | 链接 → `../docs/README.md`（在盘） |
| C5 | 同 `:31` | `prepublishOnly` 文面 = `lint` → `npm test`（全量·单入口）；对盘 `package.json:38` → `release-check.mjs:67` lint / `:77` `test/run.mjs` |
| C6 | 同 `:35` | Testing policy = v2 单入口（`node test/run.mjs`——单元 + 集成 + slow 全跑；`slow` 纯别名）；权威指针 = `docs/core/design/TESTING.md` §10 |
| C7 | 同 `:38` | 权威文档 → `../docs/core/design/CHECKPOINT.md`（在盘） |
| C8 | 同 `:49` | core 族枚举补 `tool-docs`（盘上 24 档） |
| C9 | `thincoder-vscode/AGENTS.md:35` | 权威文档 → `../docs/core/design/CHECKPOINT.md` |
| C10 | 同 `:37` | 模块图块头声明「概览——权威 = `ARCHITECTURE.md` §3（·§3.1）——只列主要项（非穷尽）」 |
| C11 | 同 `:40` | core 族枚举补 `tool-docs` |
| C12 | 同 `:61-64` | `settled ⇒ awaitingDigest 驻留（回收 done 才归档）`；指针 = `../docs/vsc/design/WEBVIEW.md` §5.1 / §5.2 / §5.5 D-W27 / §5.3 D-W22 |

#### ② 决策透明表（越列 / 偏离 · 全披露）

| 类 | 坐标 | 内容与理由 |
|---|---|---|
| 越列 ① | `vsc :15` | 删字面 `src/prompts`（→「本端自持提示词 / 工具描述镜像已删（F9 零残留）」）——A115-2（§2.7 命令 5f）判据含 `src\/prompts` 且域 = 两档全文，原句必命中 ⇒ 非改不可 |
| 越列 ② | `vsc :59` / `:61` | 出生位 `#messages 流尾` → **活动区 `#subagent-activity` 区尾**；`B1 流尾形态` 改标「已由活动区回归取代」（advisor 轮 1 🔴 驱动；证据 = `activity.js:104`/`:136-137` · `state.js:19` · `index.html:25` · `WEBVIEW.md:151`/`:159`；`#messages` = 归档落点） |
| 越列 ③ | `vsc :61` | `lookup-only 绝不建块` → `非出生消息 lookup-only 绝不建块（终态补桩例外——§5.3「终态必现」）`（advisor 轮 1 🟡 驱动；证据 = `activity.js:377-384` · `WEBVIEW.md:153`/`:269`） |
| 偏离 ④ | C12 字面 vs 盘上 | 设计字面「改指 §5.1 / §5.2 / §5.5」= 三节号对四行（欠定）；盘上取 §5.1（activity.js）/ §5.2（activity-view.js）/ §5.5 D-W27（activity-new.js）/ §5.3 D-W22（activity-diag.js）——第四条按 `WEBVIEW.md:173`「留痕节律见 §5.3」+ D-W22 行实况落 §5.3 |
| 偏离 ⑤ | §2.9 F-2 引证 | F-2 称 `vsc :60` 载「`WEBVIEW.md §14 现行机制`」指针——盘上两档 `§14` **零命中**（`WEBVIEW.md` 现仅 §1–§10）；按盘上实况处置，无该句可收正（原句已不在盘，基线不可考） |

#### ③ 审计与代码评审轮次 / 终态

- **内审（explore · divergence audit）轮 1**：**0 偏差类别**（C1–C12 逐条落档核 + 无未声明改动 + 无围栏/链接 collateral）；其无执行工具 ⇒ doc-check / 测试读数由其标 unverified，由本笔实跑补足。
- **代码评审（advisor · type=code）轮 1**：**changes-required**（🔴1 出生位相抵 · 🟡2 `lookup-only` 绝对化 / `cli :59` `CRASH-REPORTS.md` §8 死节号 · 🔵2 `vsc :122` 基线旧读数 / `vsc :22` 节号不可解析）。
- **fix 轮 1**：🔴#1 + 🟡#2 就地收正（`vsc :59`/`:61`）；🟡#3 与 🔵#4/#5 = **域外未改**，入上抛清单（见 ⑤）。
- **代码评审（advisor）轮 2（fix 复核）**：**pass**（两项 Fixed ✓；无新 🔴）。
- **终态 = clean**（审计 0 偏差 + advisor 轮 2 pass；纠偏轮次 = 1，未触 5 轮上限）。

#### ④ 机检读数（逐条实跑 · 原样）

- A115-1（§2.7 命令 5d）= **`OK 0 dead md links`** · exit 0
- A115-2（5f）= **`OK 0 v1 residue`** · exit 0
- A115-3（5g）= **`OK tool-docs named in both`** · exit 0
- `cd D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` = `FAIL(锚): 1 条悬空`（唯一悬空 = 并行会话在途档 `docs/core/design/MODEL-SPECS.md:380 none（符号）`，非本笔写域——承 §2.12 ③ / §2.13 ③ 同族登记）+ **`OK(行宽)`** ⇒ **本笔净增 0**
- `cd D:\teamcode\thincoder\thincoder-cli && node test/run.mjs` = **`ℹ tests 718 · suites 12 · pass 718 · fail 0 · cancelled 0 · skipped 0`**（收正后复跑同值）
- `git diff` 逐 hunk 核：CLI 6 hunk / VSC 4+3 hunk，**全部落在 C1–C12 与上表越列坐标内**，零 collateral

#### ⑤ 上抛项（未改 · 报告面 · 坐标已逐条实核）

1. `thincoder-cli/AGENTS.md:59` —— `docs/cli/design/CRASH-REPORTS.md` **§8 死节号**（该档实测仅 §1–§6 + 变更记录；堆遥测 = **§4**（`:96` `## 4. 堆遥测 / 看门狗（事前预警）`）；建议 §8 → §4）。doc-check 只判路径锚不判节号 ⇒ 机检不红。
2. `thincoder-cli/AGENTS.md:10` —— 层根 `docs/requirements/` / `docs/design/` 与同档已修 `:12` 及盘上实况两态仍在（C3 只列 `:12` ⇒ 生内；建议随下轮同族收口）。
3. `thincoder-cli/AGENTS.md:31` —— `docs/design/RELEASE.md` ×2 死指针（真身 = `docs/cli/design/RELEASE.md`；且节号已漂：github 双远端 = §6.2、CalVer = §3.2）。
4. `thincoder-vscode/AGENTS.md:7` —— `docs/design/`（产品树设计档已整体入 `_archive/design/`；与 §2.12 ④ **G-1** 同族）。
5. `thincoder-vscode/AGENTS.md:15` / `:127` —— `tool-docs` **25 档**（盘上实测 **24**）；与批 2（`check-vsix.mjs` 25→24）交叉后 = 文档∥工具面口径差，建议同轮收正。
6. `thincoder-vscode/AGENTS.md:22` —— `(§10, 2026-09-05)` 节号不可解析（unverified：未指名档；若指本仓会话档，端分离在 `_archive/design/SESSION.md:175 §3`，`:479 §10` = 会话上下文注入序）。
7. `thincoder-vscode/AGENTS.md:122` —— as-of 2026-09-15 基线 `≈ 553 例 / 553/518 pass / 35 skip` 早于权威档最记录（`TESTING.md:291` = 593 tests / 592 pass，as-of 2026-09-18）；建议重取读数或标历史。
8. 台账 #115 状态迁移 + 批指针 = §2（子代理工具面无台账写命令 ⇒ 交主 agent）。

**实施记录（eng-coder · 2026-09-20 · 轮次 = initial · 范围 = 批 1-A · #118 一块）**

**状态行**：✅ 落定——R1–R6 + R7 测试面全落 · A118-1/2/3 全绿 · 内审（发散审计）与 advisor 代码评审**终态 = clean**（轮 1 pass / fix round 1 / 复核轮 2 pass）· 仓根 = `D:\teamcode\thincoder`。

### 5.1 交付摘要（改动清单 · file → 落点 → Δ）

| 文件 | 落点 | Δ |
|---|---|---|
| `thincoder-vscode/src/extension/panel-subagent-relay.mjs` | **R1**：`:49-71` 新增 `_relayQueuedInfo` 每面板缓存（`WeakMap<panel, Map<role#id, info>>`）+ `rememberQueued` / `forgetQueued` / 导出读点 `queuedInfoOf`；`:98-109` queued 消费点：`kind` 随载荷下行 + 四项入缓存；`:91`（`[model]`⇒started）/ `:112`（cancelled）/ `:115-117`（stopped / settled / done）五分支删键 | +29 行 |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | **KD-12 缝**：转口面 re-export 表补 `queuedInfoOf`（+ 消费面注释一行）——**越 §2.5 文件表一档**（见 5.4 D-2） | +1 行 |
| `thincoder-vscode/src/extension/suspension.mjs` | **R2**：`reassertLiveChildren` queued 行载荷与 live 中继面**同形**——四项取自 relay 缓存；缓存缺省 ⇒ 仅 `position`（降级态）；函数头注同步（`：136-137`） | +12 行 |
| `thincoder-vscode/webview/activity.js` | **R3**：`:280` `meta.queueInfo` 收入 `kind`（四项入块级活态载体；写点唯一 / 清点 `:309`） | +2 行 |
| `thincoder-vscode/webview/activity-view.js` | **R4**：`:41-45` 排队头 = `[⏳ label · queued\|waiting]`（`kind` 判词）；**R5**：`:86-91` `stateWord` kind 优先（slot ⇒ `sub.queueSlot`；其余含缺省 ⇒ `reason` 原文零改写；无 reason ⇒ 中性回落 `t("sub.queued")`） | +9 行 |
| `thincoder-vscode/locales/en.json` / `zh.json` | **R6**：`:162` 各补 `sub.waiting`（en `waiting` / zh `等待中`——插在 `sub.queueSlot` 行后；键码权威 = `WEBVIEW-PROTOCOL.md` §6.3） | +1 ×2 |
| `thincoder-vscode/test/activity-closure.test.mjs` | **R7 / A118-1**：T-CL17 扩为四行数据表（slot / wait / depc + 降级）+ 「两刷新路径逐字不变」同一断言体 `stable()` 复跑（`refreshLiveHeaders()` ∥ `refreshBlock(block)`） | +20 行 |
| `thincoder-vscode/test/async-visibility.test.mjs` | **R7 / A118-2**：新增用例 `A118-2 重绘载荷…`——同一 `⟦ev⟧queued` token 经 relay 消费 ⇒ `reassertLiveChildren` 重发与 relay 面**四项全等**（+键集同形）+ 降级行（无缓存 ⇒ 仅 `position`）+ 重发载荷喂真 webview ⇒ 头形态逐字 | +47 行 |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | **R7**：⑬ 两条 `deepEqual` 补 `kind`（`slot` / `depc`）——载荷契约断言按 #8 定案四项 | +1 行 |

**最终尺寸（read 口径；= §2.5「含末行」口径 +1）**：relay 245 · suspension 420 · activity-view 192 · activity.js 437 · locales 各 262 · activity-closure 318 · async-visibility 453 · chat-panel-messages 460——**全部 < 500 硬限**。

### 5.2 决策透明表（设计未明处 · 我的取舍）

| # | 决策 | 理由 |
|---|---|---|
| D-1 | `reassertLiveChildren` 的 `position` 来源 = **缓存在场 ⇒ 全取自缓存**（`info ? (info.position ?? null) : (e.position ?? null)`）；缓存缺省 ⇒ 池条目位置 | A118-2「四项全等」的字面严格化：缓存在场时四项单一来源 ⇒ 与 relay 面逐字同形（含 `position` 为 null 的退化情形，显示面 `n:"?"` 与 CLI `queued.position ?? "?"` 同形）；advisor 轮 1 #4 指出原 `info?.position ?? e.position ?? null` 的理论分叉 ⇒ 已改 |
| D-2 | `queuedInfoOf` 经 `panel-callbacks.mjs` 转口再被 `suspension.mjs` 消费（非直连 relay 档） | KD-12 缝保持（`relay` 档 docstring `:22-25` + `panel-callbacks.mjs:24-32`「既有导出名零改」规则）：新导出件沿同一转口面 ⇒ 消费档 import 面形态不破；代价 = 越 §2.5 文件表一档（设计表漏列） |
| D-3 | 缓存删键点 = `[model]`(started) / cancelled / stopped / settled / done **五处**；`⟦ev⟧turn` 不删（非终态） | R1 原文「`started` / `cancelled` / 终态分支删该键」的逐字展开；`⟦ev⟧async` 不删（恒先于 queued，删之无义） |
| D-4 | T-CL17 由「逐行直书」改**数据表驱动**四行 + `stable()` 断言体 | A118-1 要求「三档各条在两条路径后逐字不变（同一断言体复跑）」——表驱动让同一断言体对四行复跑，且新增档位零复制粘贴 |
| D-5 | A118-2 用例**跨两侧**（extension 侧 relay+reassert 载荷 ∥ webview 侧真渲染头形态）单用例承载 | #9 的判据本体 = 「live 面与重绘面同读点」⇒ 两端同案断言才能证「重绘后显示与 live 一致」；同档已有两侧夹具（`stubPanel` + `setupWebview`） |
| D-6 | 降级态（缓存缺省）头态 = 状态词 `t("sub.waiting")` ∧ 状态区 `t("sub.queued")`（词面不同） | 设计已定案（§2.13 ④ D-3 登记「= CLI 逐档同形，勿以词面不一致为由收正」）——按定案实现，未"顺手统一" |

### 5.3 验收读数（先红 → 后绿 · 逐条实跑）

- **先红（R7 测试先落、实现未落）**：`node --test test/activity-closure.test.mjs` ⇒ `T-CL17 …` ✖（`[9] 状态词 = queued（实到 "[⏳ eng-coder#9] queued · position 2 (slot full)"）`——头词缺 ` · queued`，即缺口本体复现）；`node --test test/async-visibility.test.mjs` ⇒ `A118-2 …` ✖（`#2 重发 waiting 与 relay 面全等（relay 实到 null）` ⇒ `actual undefined / expected null`——重发面缺四项）。
- **后绿（R1–R6 落定）**：`T-CL17 …` ✔ · `A118-2 …` ✔（两档同跑 39/39 · fail 0）。
- **A118-1**：三档 + 降级逐一断言（状态词 / 状态区逐字）+ 两刷新路径后逐字不变 ⇒ ✔（`test/activity-closure.test.mjs:251-284`）。
- **A118-2**：四项全等 + 键集同形 + 降级行键集写死 `["id","position","role","status","type"]` + 重发后头形态四行逐字 ⇒ ✔（`test/async-visibility.test.mjs:187-229`）。
- **A118-3（静态判据）**：wait / depc 状态区 = `reason` 原文零改写（`activity-view.js:89`）；判词与 CLI 标尺逐条对位（`thincoder-cli/src/tui/subagent-panel.mjs:73` 状态词 / `:100-102` 状态区）⇒ ✔。
- **§2.7 命令 2**：`cd thincoder-vscode && npm test` ⇒ **`ℹ tests 735 · pass 735 · fail 0`（exit 0）**（fix round 后复跑同值）。
- **§2.7 命令 5h**：`node --test test/async-visibility.test.mjs` ⇒ `ℹ tests 11 · pass 11 · fail 0`（exit 0）∧ 新用例名在册 ✔。
- **§2.7 命令 1（doc-check）**：`node scripts/doc-check.mjs` ⇒ `FAIL(锚): 1 条悬空` 唯一项 = `docs/core/design/MODEL-SPECS.md:380 none`（**并行会话在途档**，`git status` = `??`；非本笔写域——承 §2.12 ③ / §2.13 ③ 同族登记）；`OK(行宽)` ✔；本笔**零 .md 触碰** ⇒ 净增 0。

### 5.4 内审 / 评审轮次与终态

| 环节 | 轮次 | 读数 / 终态 |
|---|---|---|
| **内审（explore 只读发散审计）** | 轮 1 | R1–R6 逐条「落」· A118-1/2/3 静态可核 ⇒ **DEVIATIONS（低）**：① OUT-OF-LIST=1 档（`panel-callbacks.mjs`，KD-12 缝要求 ⇒ 定性设计表漏列）；② DOC-DRIFT（设计档引用的代码行锚随本笔注释插入漂移，见 E-1）；③ 零机制偏差 / 零越线 / 调度器零触碰 |
| **advisor 代码评审** | 轮 1 | **VERDICT = pass**（🔴0 · 🟡1 optional（文件尺寸建议线·非 must-fix）· 🔵5） |
| **fix round** | 1 | 采纳 1 条：轮 1 #4（`position` 来源单一化）⇒ `suspension.mjs:164` 改为 `info ? (info.position ?? null) : (e.position ?? null)`；其余 🔵 全为报告面 / 他人笔（E-1–E-5），按边界不就地改 |
| **advisor 复核** | 轮 2（fix-claim 复核） | **VERDICT = pass**——fix 逐字核到（`:164` 与 claim 一致 · 配套 `:165` 四项同源 · 降级支不变 · 无新 🔴） |
| **终态** | —— | **clean**（无 🔴；遗留 1 🟡 optional + 🔵 全为报告面/他人笔，逐条见 5.5） |

**上抛项（报告面 · 未就地改）**

| # | 级 | 项 | 处置建议 |
|---|---|---|---|
| E-1 | 🟡 | **设计档行锚漂移（本笔注释插入所致）**：`docs/vsc/design/WEBVIEW.md:183` 载「写点 = queued 消费点 `:278`；清点 = `started` 分支 `:307`」，盘上实为 `activity.js:280` / `:309`；`WEBVIEW-PROTOCOL.md:249-250` 载 `activity-view.js:38` / `:77-80`，盘上实为 `:44` / `:86-91`（§5.2 首行 `:177` 的 `:36`/`:74` 同理。词面与判据全对，仅行号 as-of 失效） | **设计档作者笔**：按盘上 as-of 重出两档引注，或改指函数名（`headerText` / `stateWord` / queued 消费点）免再漂移 |
| E-2 | 🔵 | **批档 §2.5 两测试档 Δ 标注偏小**（实现轮成果大于预估 · 非缺陷）：`async-visibility.test.mjs` 标「+1 用例」实为 +47 行；`activity-closure.test.mjs` 标「297 → ~303」实为 318 | 父侧/设计笔：收口时按盘上读数重出两行 Δ |
| E-3 | 🔵 | **新缝未登记**：`queuedInfoOf`（`panel-subagent-relay.mjs:69` → 转口 `panel-callbacks.mjs:32` → 消费 `suspension.mjs:27`）在 `docs/vsc/design/VSC-DEBT.md` §12.3 对外缝清单无行 | 该档作者补一行（与既有六件同名在册） |
| E-4 | 🔵 | **尺寸档缺口**：`async-visibility.test.mjs` 453 行（越 300 建议线）无尺寸档登记（activity.js / activity-closure / chat-panel-messages 三档已有裁定，不重议） | 下次设计档触碰时补「触发 + 抽取候选线（A118-2 组自持夹具）」 |
| E-5 | 🔵 | **命令 1 的悬空项归属**：`docs/core/design/MODEL-SPECS.md:380 none` = 并行会话在途未跟踪档（`??`），非本笔写域 | 交并行会话或收口父侧（本笔不动作） |

### 5.5 边界核对（不动面 · 逐条守）

`thincoder-core/agent-tools/subagent-scheduler.mjs` / 池语义 / 分类（`describeBlockers`）/ `⟦ev⟧queued` token 文法 / ⏹ 取消语义 **零触碰**；`sub.queueSlot` 键文案未改写；跨端文案未逐字统一（按 §2.1 ④：VSC 走 i18n 键、CLI 走字面量，判据 = 三档归类 + detail 原文一致）；设计档 / 需求档 / `scripts/**` 未改；他批写域（`docs/batches/**` 他人段）未碰。

## §6 验证与收口（父代理）

**2026-09-20 05:17 父侧收口**

**交付核验（三组）**：**1-A（#21）**R1–R7 全落 + **A118-1/2/3 全绿**（先红后绿：缺口本体复现 → 定向两档 39/39 · VSC 包 **735/735** · 四项全等 + 降级行 + 两刷新路径逐字断言）✓ · **1-B（#22）**C1–C12 全落 + 三命令全绿（CLI **718/718**）✓ · **1-C（#23）**六字段双面逐字 + `OK 6 fields both faces`（核 **401/401**）✓ —— **三组 advisor 终态均 clean**（1-A：pass 两轮；1-B：changes-required→fix→pass；1-C：pass 两轮）✓

**角色表（D7）**：设计席（已落 · 含 §2.10–§2.13 四附录）· 实施三组（已交）· **父侧批 2**（`check-vsix.mjs:29` 25→24 · **已落** · 可 revert）· **批 4 = F-1 需求档**（`docs/core/requirements/TESTING.md:20-22`/`:103` · 父侧笔 · **待落**）· 批 3 设计档面（已落）

**计数**：`doc-check` 本批面 **净增 0**（悬空项唯一 = 并行会话在途档 `MODEL-SPECS.md:380`）· 行宽 OK · 三包测试 **735 / 718 / 401** 全绿

**指针 / 台账**：**#115 · #116 · #117 · #118 → 待核销 → 已核销**（两步迁移）；余项已入账（`#128` v1 词面域外面 · `#129` VSC 文档面三则 · `#131` 两产品 `AGENTS.md` 残余族 · `#130` `loadRules` 接线）✓

**遗留（显式）**：① 批 4（F-1 需求档收正 · 父侧笔）；② 三组各自上抛的 🔵 报告面项（已在 §5 在册）；③ 设计档行锚 as-of 漂移（1-A ⑤-1：`WEBVIEW.md:183` 载 `:278`/`:307` 实为 `:280`/`:309`；`WEBVIEW-PROTOCOL.md:249-250` 载 `:38`/`:77-80` 实为 `:44`/`:86-91`）——**归批 4 收口重出或改指函数名**。

**提交**：待 `commit + push`（路径限定）。