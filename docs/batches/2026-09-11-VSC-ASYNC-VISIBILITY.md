# VSC 异步任务可见性/可控性（live 块显示 + advisor 池）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 用户 2026-09-09 反馈 + 本会话「还记得吗」追问 + 「第10批开工，相邻的那个也并入」。

---

## §1 讨论（主 agent 记）

### 需求来源

- 用户 2026-09-09 原话：**"实际启动了但不能可靠显示 live 块"**（VSC 端）。
- 用户 2026-09-11 03:48 追问召回 → 03:50 指令：**「第10批开工，相邻的那个也并入」**（相邻项 = advisor 池状态/取消缺陷）。

### 条目 A：VSC live 块显示不可靠（症状 = 普遍时有时无）

**用户实测模式**（2026-09-09）：**非 advisor-only**——第一次 advisor 没出现 + explore（subagent 角色）也没出现 + 后来 advisor 又出现。

**三层诊断演进（记录于 `docs/TODO.md:160-183`；行号为 TODO 记录 as-of，设计须现场复核）**：

- **首轮勘察（explore#1 2026-09-09）——三重脆弱广化根因**：
  - 🔴① **出生靠窗口**：`started` 落在 webview 未就绪/加载窗口即静默丢弃（`panel-callbacks.mjs:81/113` postMessage 可选链**无队列**）——无兜底则块永不显示。
  - 🔴② **快照兜底不全**：`postPoolSnapshot` 门控只认 `_asyncSubagents` Map（`panel-callbacks.mjs:165`——`run-stages.mjs:279` 池空摘 `undefined`——advisor-only 会话空转）；快照只重放 running——settle 出池后 reload/`clearMessages` 抹块则永不重建。
  - 🔴③ **终态对 never-born 块 no-op**：`applySubagentStatus` settled/done 分支只遍历**已存在**块（`activity.js:179-201/240-248`）——advisor/family 无 consult 快照式建块防御（`:234-239`）——块缺失一旦发生**即永久**。
  - 🟡④ `clearMessages`（boot/loadSession 必经——`chat.js:180-189`）池仍活时抹全部 live 块——重建依赖后续快照。
- **用户观察补强（21:30）**：**间歇性非恒定**——丢集中 20:52（round2 评审）+ 21:01（explore）；21:06 起连续正常 → 提出"**重启后头一两个 async 任务落在 webview 重建窗口 → started 丢 → 面板稳定后恢复**"假设（**待受控复现验证**）。
- **撤除实证（22:32）**：`REMOVE-POOL-SNAPSHOT` 批已交付（快照重推撤除）——**问题依旧 → 坐实快照非因**（②的"快照干扰"面被排除；门控/重建面仍需另判）。
- **🔴 最新精确复现（22:32——本批设计的主输入）**：**同一响应双 spawn 两个 eng-coder** → 状态行显示 **2 running**（扩展侧 pool 计数正确）→ **live block 只渲染 1 个**——出生/显示链**并发竞态**（两个 `started` 紧邻，webview 渲染端只建一块——可能丢消息/互踩）——**与 reload 无关**（正常会话内可复现）——真因方向 = **webview 渲染端并发消息处理**（非扩展侧——扩展侧计数正确）。

### 条目 B：advisor 池状态不可查询 + 不可取消（平台机制缺陷——已实证三次）

- ① `subagent status` 只查 subagent 池——advisor 池（`_asyncAdvisors`）**无状态通道**→ 评审是否在跑/卡住/完成**不可知**（digest 是唯一信号——死等）。
- ② `wait_for "advisor settled"` **误报**（0ms 即过但池仍拒重发——口径与实际池状态脱钩）。
- ③ advisor **无 cancel 通道**（同 scope 重发被拒"settle 后逐个发起"——对象漂移时旧评审杀不掉）。
- TODO 记录提示：**"与 live 块问题可能同源"**（待设计判定）。

### 已核事实（供 designer 免重复勘察——**均为 TODO 记录 as-of，须现场复核**）

- 条目 A 代码面：`thincoder-vscode/src/.../panel-callbacks.mjs`（`:81/:113` 出生投递、`:165` 快照门控）·
  `run-stages.mjs:279` · `webview/activity.js`（`:179-201/:234-248`）· `webview/chat.js:180-189`（clearMessages）。
- 条目 B 面：CLI 工具侧（`subagent status` 动作 / `wait_for` 工具 / cancel 通道）+ 池实现（`_asyncAdvisors`）。
- **已知盲区**：现测试 fixture **恒双 Map running**——advisor-only / explore-only / settle-after-reload / **并发双 spawn** 四类场景无用例。

### 范围边界（明确不做）

- **CLI live 块/面板本体不在本批**（用户症状 = VSC 端）；CLI 侧只作对位核对（若某缺陷双端同源且 CLI 亦然，设计须显式列出并给理由，不得静默扩面）。
- 不重做快照机制（已由 REMOVE-POOL-SNAPSHOT 批处置）；不改 `REMOVE` 批已定语义。
- **不碰 `docs/design/ADVISOR-CONVERGENCE.md`**（第 9 批链在飞——D5 冻结/避让）；若条目 B 的归属档是它，**停下打回主 agent**。
- 不改 CHANGELOG/README/`docs/TODO.md`/`ENGINEERING-MODE.md` 链。

### 待设计裁定（5 问）

1. **根因收口**：22:32 并发竞态（webview 渲染端）与首轮三条（①出生窗口 ②快照 ③never-born 终态）+ 🟡④ 的关系——哪些是**同一根因的不同表现**、哪些是**独立缺陷**（逐条给证据 = 现场读码 + 若能则复现）。
2. **修复选型（≥2 候选对比）**：**修补**（逐处门控/防御）vs **出生队列根治**（`started` 队列化 + webview 就绪补发）——判据（覆盖 22:32 复现 + 旧三面 + 成本 + 回归风险）+ 结论；**用户将在批准环节裁**，设计给齐两案的代价。
3. **条目 B 接入面**：advisor 池状态通道（`subagent status` 扩 advisor？面板展示评审 live 块？）+ `wait_for` 口径修正 + cancel 通道——**与条目 A 是否同源**（TODO 谓"可能同源"——判定并给依据）。
4. **测试面**：现 fixture 盲区补法——**并发双 spawn（22:32 复现）** + advisor-only + explore-only + settle-after-reload 四类用例如何机器断言（webview 侧如何驱动/断言）。
5. **双端对位**：条目 B 的 CLI 面影响（`subagent status` / `wait_for` / cancel 均 CLI 工具）——是否连带、影响面清单。

### 状态

**已收口 2026-09-11**（用户"第10批开工，相邻的那个也并入"）。下一步 = **设计**（spawn eng-designer；归属档由勘察判定）。

### 用户授权（主 agent 记 · 2026-09-11 04:19/04:20）

用户原话①「**第10/11批帮我自动点火**」（04:19）· ②「**帮我也自动批准，授权都明天上午八点**」（04:20）——
**① 设计评审发起权（含轮次 2/修正轮后重发）② §4 用户批准**，两项均**委托父侧自动执行**，不必逐次请点。

**有效期**：2026-09-11 04:20 → **08:00**（授权窗口；窗口外任何批次到达该门 → 等用户）。

**代签规则（父侧自缚）**：① 仅在「评审 pass（0🔴）+ 修正轮已落地并核验 + token 已签发」三条件齐备时代签；
② 代签记录**必须**写明「父侧代签（用户 04:20 授权，有效期至 08:00）」+ 冻结面摘要；③ 🔴 未闭 / 需用户裁定项 → 不代签，停下等。

本批点火记录：轮次 1 = 04:03 用户点（id=17，**600s 超时零输出**）→ **04:14 收窄重发（id=20）**（机制提示
「narrower scope」——属修复性重发，父侧执行；对象 = 4 档核心 + 时间预算纪律）。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求+设计+测试三层已落档，待设计评审；**含一项用户裁定项** = 条目 A 修复选型 A/B 案——见下「待总裁定」）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求 = `docs/requirements/AGENT-LOOP.md` **§3**（条目 A：F-A1~F-A5 / NFR-A1~A3）+ **§4**（条目 B：F-B1~F-B4 / NFR-B1~B2）。
设计+测试 = 条目 A → VSC 仓 `docs/design/WEBVIEW.md` **§5.1**（+ §5 终态规则修订指注）· 条目 B → `docs/design/AGENT-LOOP.md` **§18**（+ `docs/design/TOOLS.md` §7 `wait_for` 口径行 · VSC 镜像 `thincoder-vscode/docs/design/AGENT-LOOP.md` §9）。

## 覆盖条目（本批 = §1 两条目，逐条回指）

| 条目 | 需求 | 设计 | 用例 | 验收 |
|---|---|---|---|---|
| A：VSC live 块出生可靠性 | `requirements/AGENT-LOOP.md` §3（F-A1~F-A5） | VSC `design/WEBVIEW.md` §5.1.1~§5.1.9 | T-V1~T-V8（§5.1.7） | AC-A1~AC-A8（§5.1.8） |
| B：后台评审池可观测/可控 | `requirements/AGENT-LOOP.md` §4（F-B1~F-B4） | `design/AGENT-LOOP.md` §18.1~§18.8 | T-B1~T-B8（§18.6） | AC-B1~AC-B7（§18.7） |

**三方条目一致**：本表条目 = 设计档验收标准回指的条目 = 需求档条目（F-A\*/F-B\* 逐条对应）。

## 第 10 批勘察 5 问结论（详见设计档，逐条带证据）

1. **根因收口（条目 A）**：受控复现（happy-dom 驱真 `webview/activity.js`）得 R-1~R-5 五条——**R-2 = 22:32 精复现的机制**
   （块身份键重名 × 冻结守卫 → 重名新任务永不建块 + 其 chunk 全吞；复现：host 计 2 running / webview 1 活块）；
   R-1（投递无队列）×R-4（清屏抹块+重建降级）**同源**（投递链只增量、无状态对账）；R-2×R-3（终态对 never-born no-op）
   **同源**（缺新代/补块路径）；两组独立。**R-5「webview 并发渲染竞态」证伪**（背靠背双 started → 2 块正常）——
   22:32 当日记录的真因方向更正。
   诚实附注：R-2 的**触发源**（id 复用）已由 `SUBAGENT-ID-COUNTER-AGENT`（2026-09-10）修于源头 → 显示层防御为**纵深加固**；R-1/R-3/R-4 仍真实存在（缺块即永久 + 清屏后无 ⏹）。
2. **修复选型（条目 A）**：案 A（webview 侧防御修补 ~40 行）vs **案 B（投递链根治——队列 + 就绪/清屏后状态再断言 + 新代接管 + 终态补块 + 诊断，唯一同时覆盖 R-1/R-3）**——设计给齐两案代价并推荐 B，**由用户在批准环节裁**（见下）。与 `REMOVE-POOL-SNAPSHOT` 的边界核对已落档（不得静默复活池行快照）。
3. **条目 B 接入面 + 同源性**：状态通道 = `subagent status` 双池并表（CLI **已具备** 2026-09-08 / **VSC 缺失**——即 TODO「评审状态查询假空」的实证因）× `wait_for` 口径改读评审池（**两端同缺陷**：判据读子代理池 role=advisor 恒无命中 → 0ms 秒过）× cancel 落评审池（CLI 已具备 / VSC 工具动作缺、面板 ⏹ 已有）；**与条目 A 判定不同源**（B = 池访问器接入面遗漏；A = webview 块身份/投递链；共性是「第二池接入面遗漏」系统模式，非同一根因）。
4. **测试面**：四类盲区（并发双 spawn / advisor-only / explore-only / settle-after-reload）由两类骨架机判——webview 侧 happy-dom
   驱真模块（`test/helpers/webview-env.mjs`）、主侧桩面板驱真 extension（`test/chat-panel.test.mjs` 骨架）；新档
   `test/async-visibility.test.mjs` + `test/wait-for-advisor-pool.test.mjs` 须入 `test/files.mjs` 登记（接线硬项）。
   现 fixture 盲区（恒双池 running + 无 advisor 面）随新档补齐。
5. **双端对位**：条目 A **纯 VSC**（CLI TUI 无 webview——CLI 侧零代码改动，AC-A7 断言）；条目 B **双端**——CLI 侧仅 `wait_for` 待改（①③ 已具备——as-of 证据见 §18.1），VSC 侧三面补齐。

## 受影响文件（双端分列，行数口径 = `wc -l`；as-of 2026-09-11；明细见设计档表）

**条目 A（VSC——12 项：11 改 + 1 增，代码面 ~+130 行 = 设计 §5.1.6 src 8 文件求和）**：
`webview/activity.js`(204,+45) · `webview/state.js`(113,+3) · `webview/streaming.js`(244,±5) ·
`src/extension/panel-callbacks.mjs`(148,+30) · `src/extension/panel-messages.mjs`(455,+14) · `src/extension/panel-session.mjs`(332,+8) ·
`src/extension/chat-panel.mjs`(414,+3) · `src/extension/suspension.mjs`(313,+22) · `test/async-visibility.test.mjs`(新,+170) ·
`test/files.mjs`(49,+1) · `test/activity-flow.test.mjs`(300,+40) · `docs/design/WEBVIEW.md`(339,+197)。

**条目 B（双端——14 项 = 12 改 + 2 增，代码面 ~+90 行）**：
CLI：`src/tools/ops.mjs`(286,+14) · `src/agent-tools/subagent.mjs`(402,+4) · `src/agent-tools/subagent-actions.mjs`(470,±3——已具备核实) · `test/subagent-observe-send.test.mjs`(200,+45) · `test/wait-for-advisor-pool.test.mjs`(新,+60) · `docs/design/TOOLS.md`(124,+3) · `docs/design/AGENT-LOOP.md`(724,+138)。
VSC：`src/agent-tools/subagent-actions.mjs`(337,+55) · `src/agent-tools/subagent.mjs`(380,+4) · `src/tools/wait_for.mjs`(195,+10) · `test/subagent-observe-send.test.mjs`(167,+45) · `test/wait-for-advisor-pool.test.mjs`(新,+60) · `test/files.mjs`(49,+1) · `docs/design/AGENT-LOOP.md`(506,+14)。

## 验收标准（逐条机验；本表 = 设计档 AC 索引）

- 条目 A：**AC-A1**（T-V1 双 id 双块计数 2）· **AC-A2**（T-V2 重名接管 + `takeover` 痕迹）·
  **AC-A3**（T-V4/T-V5 never-born 补桩行 + 不补桩行（含 answered / queued-cancel））·
  **AC-A4**（T-V3 清屏后再断言 → `pool === true` + ⏹ 在 + 位置断言流尾）·
  **AC-A5**（T-V6/T-V7 队列按序 flush + 溢出丢最旧留痕）· **AC-A6**（`postPoolSnapshot`/`SNAPSHOT_ROLES` grep 零命中）·
  **AC-A7**（VSC run-fast 全绿 + 新档在册 + CLI 零代码改动）· **AC-A8**（文档面 + 宽度新增超宽 0）。
- 条目 B：**AC-B1**（status 双池并表/单查/done 注记，双端）· **AC-B2**（`advisor settled` 池真态：有 running → false，
  池空/仅 done → true，双端）· **AC-B3**（cancel 落评审池 + abort + 幂等 + 错误行）· **AC-B4**（observe/send 遇 advisor id
  给指引、不报 unknown）· **AC-B5**（双端同输入同判定）· **AC-B6**（CLI `npm test` 全绿 + VSC run-fast 全绿）·
  **AC-B7**（文档面 + 宽度）。

## 待总裁定 / 待评审项

1. **用户裁定（批准环节）**：条目 A 采 **案 A（修补）** 还是 **案 B（根治，设计推荐）**——两案代价已并列（§5.1.3）；采 A 时 AC-A5 中「就绪后队列 flush/溢出」与 AC-A3 的 never-born 补块部分降级（覆盖面缺口在设计档显式登记）。
2. **设计评审关注点**：① 与 `REMOVE-POOL-SNAPSHOT` 的边界（§5.1.3 末）② §5 终态规则修订的正当性（§5.1.4 第 6 条）③ 接管后迟到 chunk 落新块的取舍登记（§5.1.4 第 5 条）。

## 实施纪律（coder 须知）

- 条目 A 仅 VSC 仓；条目 B 双端各自独立实现（语义同源·原文自持——不跨仓 import、不改对方文案）。
- **不碰**：`docs/design/ADVISOR-CONVERGENCE.md`（第 9 批链在飞，D5 冻结）· `docs/design/TUI.md`（第 7 批在途）· 提示词文件 · `docs/TODO.md` · 两仓 README/CHANGELOG。
- 新测试文件必须登记本仓 `test/files.mjs`（VSC 仓——新档接线硬项；CLI 仓无此登记档，测试文件按 `node --test` 自动发现）；文档写入后回读核对（D6）；跑 `node scripts/check-doc-width.mjs`（新增超宽 0 / 新增违规 0）。
- 父侧登记项（批后核销）：本批设计落点登记（两仓文档地图变更记录）+ TODO 两条目状态推进 + 需求池勾销。

**计数更正（D3——计数与列表同改）**：条目 B 标题行原「13 改 + 2 增」为笔误——按 18.5 表逐行实数为 **14 项 = 12 改 + 2 增（CLI 7 项：6 改 + 1 增；VSC 7 项：6 改 + 1 增）**；标题行已直改准（2026-09-11 修正轮——见上「受影响文件」节），设计档 §18.5 合计行已同步改准。**全批受影响文件合计 = 26 项（23 改 + 3 增：条目 A 12 = 11 改 + 1 增；条目 B 14 = 12 改 + 2 增）**。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）VERDICT = changes-required（1🔴 · 5🟡 · 4🔵——发现表见 §3 轮次 1）。父侧裁决 **10 条全部采纳**（docs FIRST——同一链内；修复后父侧重发轮次 2 取 token）。本轮 = 修正轮（**只改文档、不碰实现**；未新建档）。

**10 条落点**：

| # | 级别 | 落点（落档后 as-of） |
|---|---|---|
| 1 | 🔴 | answered 口径两处相反 → **保既有裁决：answered 排除出桩集**——设计 §5.1.4 第 6 条改写为**桩集精确成员表**（answered / queued-cancel 为表内显式「不补」行）；§5 指注同步加例外注（§5 保留句未动）；需求档 F-A2 边界同步 |
| 2 | 🟡 | 清屏/握手位置**定死 = 流尾**：§5.1.4 第 2 条（webviewReady：flush + 再断言排在 `openSessionContent` 之后）+ 第 4 条（`clearMessages` → `historyPage` 之后同 tick 再断言）+ D-6 改口 + T-V3 位置断言 + AC-A4 同步 |
| 3 | 🟡 | queued-cancel 例外 → 成员表显式「不补」行（与 §5「头移除、从未启动不冻结」对账）；T-V5 边界扩为五例 |
| 4 | 🟡 | NFR-A2 范围 = **出生事件面**（设计 §5.1.9 声明 + 需求档 NFR-A2 范围句）；queued-遇冻结键 = 陈旧窗口事件，不补痕（口径唯一） |
| 5 | 🟡 | 计数勾稽 → 案 B / 合计行 / 本 §2 条目 A 行统一「代码面 ~+130（= src 8 文件求和）」；「~5 文件」→ **8 文件** |
| 6 | 🟡 | activity-flow 跨 >300 → 该行补**拆分评审结论**（300→~340，≤500 硬限内；测试族存量 6 档同带——最高 620）＋「reload 无恢复」用例按新口径改写注（T-V8 同步） |
| 7 | 🔵 | running 侧再断言载荷补 `role`/`id`（§5.1.4 第 3 条——两侧全形状复用） |
| 8 | 🔵 | 本 §2：条目 B 标题行直改「14 项 = 12 改 + 2 增」；测试登记句加仓库限定（本仓 = VSC 仓；CLI 仓无此档——`node --test` 自动发现） |
| 9 | 🔵 | as-of 注记改「批次前 → 现态」口径 + 表头声明「行数口径 = `wc -l`」——WEBVIEW.md 339→536 · CLI §18.5 行 724→862 |
| 10 | 🔵 | `suspension.mjs:95` 直投 → §5.1.4 第 1 条补**族边界**：reclaim 直投不入队（不迁移——理由在档：已消化回填边界） |

**计数同步点（D3）**：设计 §5.1.6 表内求和 = 代码面 130 / 测试面 211 / 文档面 ~197 / 合计 ~538；本 §2 条目 A「代码面」改 ~+130、受影响文件行 WEBVIEW.md 改 (339,+197)、CLI 行改 (724,+138)。条目 B 行已改准 14 项（与 §18.5 合计行及下方更正段一致）；全批 26 项不变；用例 16 / AC 15 不变（T-V5 扩例不增条）。

**对 coder 的影响**：任务书仍以设计档为准；实现口径硬点 = 设计 §5.1.4 第 1/2/3/4/6 条 + §5.1.9 声明（**桩集成员表逐行照抄**——answered / queued-cancel / 前置不满足三行为「不补」）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

第 10 批复审（600s 缩范围重发——先产出发现表 + VERDICT，逐 cite 仅抽查关键锚点）。

**核对方法**：通读四档（WEBVIEW（VSC 仓）§5/§5.1、CLI design §18、requirements §3/§4、批次档 §2）；
抽查锚点 = panel-messages.mjs:396/:228-246/:229-231、panel-session.mjs:155/:159/:197、
panel-callbacks.mjs:80/:112、activity.js:67-95/:121-174、chat.js:180-189/:318、
VSC wait_for.mjs:58-62/:125-129、CLI ops.mjs:159-161/:223-227、
CLI/VSC subagent-actions.mjs（双池/单池、行数 470/337）、advisor-async.mjs:413/:468、
suspension.mjs:95、test/files.mjs（glob：仅 VSC 仓存在）。
> 〔父侧代笔 2026-09-11 04:38〕本段仅两处**形式**处理：① 折行（原单行 415 字符）；② 原引用为「VSC 仓档名 + `.md` 后缀 + 节号」三段形态——
> 此类**跨仓引用**在 V1 按 basename 解析恒判 `unknown-doc`（基线零先例），改为 `WEBVIEW（VSC 仓）§5/§5.1`。**文字零增删、语义不变**；
> 「已核通过的关键项」段同因折行。评审结论与计数不受影响。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | §5 保留句「answered 有块折叠、无块 no-op」（WEBVIEW.md:116-117）与本批修订指注/§5.1.4 第 6 条把 answered 列入终态补桩集（WEBVIEW.md:120-121、234-237）**同机制两处相反**：answered 无块时是 no-op 还是补桩折叠未定；T-V4/V5 不覆盖 answered，两读法均可过 AC——实现将静默分叉（该句是既有「无块防御建块已删」的显式裁决）。 | 定死唯一口径：§5 与 §5.1.4#6 同改一处（把 answered 排除出桩集，或把修订扩到该句）；若改行为，同步需求 §3.4 边界并补一条用例断言。 |
| 2 | Clarity | 🟡 | 清屏路径再断言与 historyPage 的先后未定死：按现文（clearMessages 后同 tick，panel-session.mjs:155→:159/:197 之前）实现，重建 live 块落 #messages 头部（history 之上——非「出生即流尾」）；webviewReady 内 flush+再断言与 openSessionContent 的次序同样未定；T-V3/AC-A4 无位置断言，D-6 只否决「延迟一拍」未说明期望序。 | 契约里定死期望位置（若期望流尾 → 再断言随 historyPage 之后投递）并在 T-V3 加位置断言。 |
| 3 | Requirements | 🟡 | F-A2「任何后台任务终态必然呈现」与 §5 既有 queued-cancel 例外（头移除、从未启动不冻结，WEBVIEW.md:110-111）未对账：同一 cancelled(was:queued) 事件，块存在→移除（activity.js:154-164）、块缺失→按第 6 条补出已折叠桩（WEBVIEW.md:234-237）——两结果相反且无用例覆盖。 | 在 §5.1.4#6 或 §5.1.9 写明该例外的适用面（queued 取消是否补桩）。 |
| 4 | Requirements | 🟡 | NFR-A2「每一次出生事件被守卫丢弃…必须留痕」未全覆盖：第 5 条保留 queued 分支现状 → queued 遇已冻结键仍静默丢弃（activity.js:124-125→:73），不在第 7 条痕迹集（takeover/late-terminal-stub/drop-unknown-role）内。 | 给该丢弃点补痕，或在边界显式声明其不在 NFR-A2 范围。 |
| 5 | Affected-file size（计数勾稽） | 🟡 | 「代码面 ~+165」三处（WEBVIEW.md:208、:269、批次档:95）与 §5.1.6 表内求和不符：src 8 文件 = 130（含测试 341；总 ~+490 与 491 可对上）；同处「实现面 ~5 文件」与表列 8 个 src 文件不符（对照：条目 B 的 ~+90 = src 求和 90 精确——口径不同源）。 | A 的「代码面」改为表内可求和数（~130）；「~5 文件」改为实际文件数。 |
| 6 | Affected-file size | 🟡 | test/activity-flow.test.mjs（300→~340，WEBVIEW.md:267）随本批越过 >300 行警示线，受影响表未带拆分评审注记（其余 >300 文件为存量不越级）。 | 该行补一句拆分评审结论（或声明测试文件豁免依据）。 |
| 7 | Clarity | 🔵 | 第 3 条 running 侧再断言载荷枚举 {status:"started", pool:true, model, startedAt} 缺 role/id（queued 侧有）；webview started 建块守卫需 role∈FAMILY+id（activity.js:135）——靠第 8 条「复用既有载荷形状」隐含补全。 | 契约补全 running 侧载荷（或注明「全形状复用」）。 |
| 8 | Methodology / 文档卫生 | 🔵 | 批次档 §2 标题行仍为「条目 B（双端——13 改 + 2 增）」（:97），与 §18.5 合计行及文末更正段（:118）的 14 项 = 12 改 + 2 增并存；另「新测试文件必须登记 test/files.mjs」（:115）未区分仓库——CLI 仓无 test/files.mjs（glob 实证）。 | 直改标题行；该纪律句加仓库限定或指 CLI 侧对应登记物。 |
| 9 | Affected-file size | 🔵 | as-of 行数快照 ≤16 行量级偏差：activity.js 表列 204/实测 205；WEBVIEW.md 339/+150/实测约 +164（现文 505）；CLI AGENT-LOOP.md 724/+120/实测 §18 占 ~728–863（全档 863）——抽样 ops.mjs 286、CLI subagent-actions 470、VSC subagent-actions 337 三处精确。 | 影响小（自指档已落）；交付时同步实数即可。 |
| 10 | Scope | 🔵 | suspension.mjs:95 的 {type:"subagent",status:"done"}（settled→done 补发）为直投、未经新 outbox；第 1 条「任务可见性族消息经 postSubagentEvent」与 §5.1.6 该文件行（只列再断言+投影）未说明该投递点 in/out。 | 契约补一句族边界（该直投是否迁移/为何不迁移）。 |

**已核通过的关键项**：R-1 投递直投无缓冲（panel-callbacks.mjs:80/:112 ✓）；R-2 冻结守卫/接管缺口（activity.js:67-75、
:135-151 ✓）；R-4 clearMessages 路径（panel-session.mjs:155、chat.js:181 replaceChildren+resetActivity ✓）与 ⏹ 判据同源
（panel-messages.mjs:229-231 = 契约第 3 条投影源 ✓）；R-5 证伪成立（applySubagentStatus 非 async ✓）；
§18 双端差异断言逐条成立（CLI 已具备 :98/:109/:145/:235-236 ✓；VSC 缺失——单池 getAsyncPool 四处 ✓；
wait_for 两端同形误报——ops.mjs:227 / wait_for.mjs:129 查 role=="advisor" 于子代理池，且 role:"advisor" 仅落
_asyncAdvisors（advisor-async.mjs:413/:468）✓）；条目 B 与 A 不同源判定证据成立；计数：26=23 改+3 增 ✓、
AC 15 ✓、用例 16 ✓、AC↔T↔F 回指一致 ✓。

VERDICT: changes-required

计数：🔴 1 · 🟡 5 · 🔵 4 = 10 条（🔴 = #1——answered 无块口径两处相反，机制级，须先收口再签发；其余不阻塞）。

> 〔父侧记 2026-09-11 04:21〕**本轮实例已由宿主作废**（「评审目标已变更——token 未签发（judged a stale state）」：评审 done 后、digest 前
> 父侧改动了被审文档集内的本批次档 §1）——**findings 仍作为修正轮输入全部采纳落档**（修正轮 id=21——10/10）；轮次 2 将在当前态重审取 token。
> 父侧教训已登记 `docs/TODO.md`（条目 E——冻结窗口 = 点火 → digest 落定）。

### 轮次 2（评审子代理）

轮次 2（修正轮 id=21 后重审）——核验轮次 1 十条修复落地 + 不变项复核。方法：四档全读（WEBVIEW（VSC 仓）§5/§5.1、CLI design §18、requirements §3/§4、批次档）+ 关键锚点抽查（panel-session.mjs:155/:159/:197、panel-messages.mjs:396-417、suspension.mjs:91-95、activity.js 尾、两档尾部行数）。

| # | Orig# | File | Severity（原级） | Status | Notes（本轮实读证据） |
|---|---|---|---|---|---|
| 1 | ① | WEBVIEW.md · requirements/AGENT-LOOP.md | 🔴 | Fixed | answered 三处同口径：§5 指注「**answered 与 queued-cancel 为表内显式例外**」（WEBVIEW.md:121）；成员表「| answered | — | **不补**（no-op） |」（:254）；需求「**answered 例外**：无块 no-op（不属补桩集」（requirements/AGENT-LOOP.md:42）。§5 保留句「有块折叠、无块 no-op」同向，无残留矛盾。 |
| 2 | ② | WEBVIEW.md | 🟡 | Fixed | 位置定死=流尾：webviewReady 两拍「**flush（保持入队序）→ `reassertLiveChildren(panel)`** 排在 case 内既有推送与 `openSessionContent(panel)`…**之后**」（:227-229）；「**期望位置 = 流尾**」（:237）；T-V3「**位置断言：重建块位于末页 history 消息之后（流尾）**」（:301）；AC-A4 同（:313）。代码面可落地：panel-messages.mjs:416 `openSessionContent(panel)` 为 case 尾；panel-session.mjs:155/:159→:197 同函数同 tick。 |
| 3 | ③ | WEBVIEW.md | 🟡 | Fixed | 成员表「| cancelled | `was === "queued"`（从未启动） | **不补**（no-op） |」（:251）；T-V5 五例含「④ `answered` 无块 ⑤ `cancelled(was:"queued")` 无块」（:303）。 |
| 4 | ④ | WEBVIEW.md · requirements/AGENT-LOOP.md | 🟡 | Fixed | 「痕迹集（§5.1.4 第 7 条）覆盖**出生事件面**」（WEBVIEW.md:326）；需求 NFR-A2「**范围 = 出生事件面**」（requirements:52）——两档同口径。 |
| 5 | ⑤ | WEBVIEW.md · 批次档 | 🟡 | Fixed | 「实现面 8 文件（代码面 ~+130 行 = §5.1.6 src 8 文件求和）」（WEBVIEW.md:209）；合计「~+538（代码面 ~+130 = src 8 文件求和；测试面 ~+211；文档面 ~+197——见行数差）」（:293）；批次档「代码面 ~+130 行 = 设计 §5.1.6 src 8 文件求和」（:115）。求和核对 45+3+5+30+14+8+3+22=130 ✓。 |
| 6 | ⑥ | WEBVIEW.md | 🟡 | Fixed | 「**拆分评审**：300→~340 越 ≤300 警示线（≤500 硬限内）——测试族存量 6 档同带（最高 `chat-panel.test.mjs` 620）——结论 = 本批不拆分」（:291）。 |
| 7 | ⑦ | WEBVIEW.md | 🔵 | Fixed | 「`{status:"started", role, id, pool:true, model, startedAt}`」+「两侧 role/id 必带——建块/接管守卫依赖；其余字段复用既有载荷全形状」（:233-234）。 |
| 8 | ⑧ | 批次档 | 🔵 | Fixed | 标题行「**条目 B（双端——14 项 = 12 改 + 2 增，代码面 ~+90 行）**」（:121）；「新测试文件必须登记本仓 `test/files.mjs`（VSC 仓——新档接线硬项；CLI 仓无此登记档，测试文件按 `node --test` 自动发现）」（:146）；更正段「全批受影响文件合计 = 26 项（23 改 + 3 增：条目 A 12 = 11 改 + 1 增；条目 B 14 = 12 改 + 2 增）」（:149）。 |
| 9 | ⑨ | WEBVIEW.md · AGENT-LOOP.md · 批次档 | 🔵 | Fixed | 「行数口径 = `wc -l`；as-of 2026-09-11」（WEBVIEW.md:277 / AGENT-LOOP.md:805 / 批次档:113）；自指行「339（批次前）→ 536（本批落档后）」（WEBVIEW.md:292）、「724（批次前）→ 862（本批落档后）」（AGENT-LOOP.md:817）——本轮实读：WEBVIEW 内容止于 :536、CLI 档内容止于 :862，一致。 |
| 10 | ⑩ | WEBVIEW.md | 🔵 | Fixed | 「**族边界（评审 #10 收口）**：`suspension.mjs:95`（`reclaimDigestedBlocks`）的 `{type:"subagent", status:"done"}` 补发为**直投、不入队**」（:223-225）；代码面实读 suspension.mjs:95「panel._panel?.webview.postMessage({ type: "subagent", id: e.id, role: e.role, status: "done" })」与所述一致。 |

**不变项复核**：用例 16（T-V1~V8=8 + T-B1~B8=8）✓；AC 15（AC-A1~A8=8 + AC-B1~B7=7）✓；全批 26 项 = 23 改 + 3 增（A 12 = 11 改 + 1 增；B 14 = 12 改 + 2 增，CLI 7 + VSC 7）✓——三处数字与两档表、批次档一致。

**结论**：轮次 1 全部十条（1🔴 + 5🟡 + 4🔵）已核实落地；修正未引入新的 🔴 / 🟡；无未修复项。

VERDICT: pass

计数：🔴 0 · 🟡 0 · 🔵 0 = 0 条（原级 1🔴+5🟡+4🔵 全部 Fixed；无新增问题）。

> 〔父侧代笔 2026-09-11 05:05〕§3 轮次 2 核对方法行的**跨仓引用**（VSC 仓档名 + `.md` 后缀 + 节号）→ 归一为 `WEBVIEW（VSC 仓）§5/§5.1`（V1 unknown-doc——检查器按本仓 basename 解析；**文字零增删、语义不变**）。

## §4 用户批准（主 agent 记）

**2026-09-11 04:42 父侧代签**——用户 04:20 授权原话「**帮我也自动批准，授权都明天上午八点**」；**授权窗口 04:20 → 08:00**；
父侧代签三条件**齐备**（自缚规则见 §1「用户授权」节）：

- **轮次 1**：changes-required（1🔴 · 5🟡 · 4🔵——§3 轮次 1；该实例曾因目标变更被宿主作废，findings 已全部采纳落档）；
- 修正轮落地（id=21）经父侧逐条实文核验：**10/10**（answered 排除出桩集 + 桩集精确成员表 · 位置定死流尾 · queued-cancel 不补 · NFR-A2 范围 · 计数 ~+130 · activity-flow 拆分评审注 · 载荷补 role/id · 批次档三项直改 · as-of 口径 · reclaim 族边界）；
- **轮次 2 评审：Approved**（十条全 Fixed · 无新增 🔴/🟡 · 不变项 16/15/26 复核 ✓）+ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：**22 文件实现面**——条目 A 11（`webview/activity.js` · `state.js` · `streaming.js` · `panel-callbacks.mjs` · `panel-messages.mjs` · `panel-session.mjs` · `chat-panel.mjs` · `suspension.mjs` + 新档 `test/async-visibility.test.mjs` · `test/files.mjs` · `test/activity-flow.test.mjs`）；
条目 B 11（CLI：`src/tools/ops.mjs` · `src/agent-tools/subagent.mjs` · `src/agent-tools/subagent-actions.mjs` + 2 测试档（含新档 `test/wait-for-advisor-pool.test.mjs`）；VSC：`src/agent-tools/subagent-actions.mjs` · `subagent.mjs` · `src/tools/wait_for.mjs` + 2 测试档（含新档） · `test/files.mjs`）。
文档面 4 项（`WEBVIEW.md` / CLI `TOOLS.md` §7 / CLI `AGENT-LOOP.md` §18 / VSC `AGENT-LOOP.md` §9）**已由 designer 落毕**——不计入 coder 交付。

**不含**：`REMOVE-POOL-SNAPSHOT` 面（零关系）· TUI/`subagent-blocks`（第 7 批域）· 提示词 · `docs/TODO.md`/CHANGELOG（父侧收口）。
**验收**：AC-A1–A8 + AC-B1–B7（15 条）· 用例 T-V1–V8 + T-B1–B8（16 条）· 双仓 run-fast 全绿 + 两个新测试档登记 `test/files.mjs`；**VS Code 实机 webview 面归用户验收**（coder 无 IDE 环境——按设计口径声明）。

**下一节点**：eng-coder（22 文件写域 + token）→ 交付 → 父侧实跑 → 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**实施状态**：2026-09-11 04:39–05:05 实施完毕。写域 = 21 个唯一文件（条目 A 11 个：VSC 仓 8 src/webview + 3 测试；条目 B 10 个：CLI 5 + VSC 6，其中 `test/files.mjs` 为两清单共面条目）。
双仓全量实跑（先落盘再读）：VSC `npm test` → **391 用例 / 390 通过 / 0 失败**（1 条 slow 归册跳过，零 slow 门拦截）；
CLI `npm test` → **398 / 386 / 1 失败**——唯一失败 = `test/doc-consistency.test.mjs` T41（预存文档面红，非本批代码面，见「未闭项」）。
日志：`thincoder-vscode/_t-vscvis-vsc.log` · `thincoder/_t-vscvis-cli.log`。

**逐需求透明表（条目 A — VSC live 块出生可靠性；设计 = WEBVIEW（VSC 仓）§5.1）**

| 需求 | 状态 | 落点 / 证据 |
|---|---|---|
| F-A1 出生必达（自愈） | Done | 投递队列 `panel-callbacks.mjs:19-50`（`_wvOutbox` 上界 200、溢出丢最旧 + `_wvOutboxDropped`、`ev:subdeliver` 入队/出队/丢弃计数）+ 就绪两拍 `panel-messages.mjs:410/427-428`（flush 保持入队序 → 再断言，排在 `openSessionContent` 之后） |
| F-A2 终态必现 | Done | 桩集精确成员表 `webview/activity.js:149-180`——done/settled/error/运行中 cancelled/terminated/failed 补桩；`answered` 与 `queued-cancel` 不补；前置不满足（role 未知/非 family/id 缺失/非法频道）不补 + `drop-unknown-role` |
| F-A3 块身份唯一 | Done | 新代接管 `activity.js:120-128`（仅 `started`+`pool:true`+同名**已冻结**触发；tombstone/queued 不触发）+ `takeover` 痕迹；旧冻结块以 DOM 留流内 |
| F-A4 控制面不降级 | Done | 存活投影载荷 `suspension.mjs:131-150`（running 带 `pool:true`/model/startedAt，queued 带 role/id/position）；清屏重建后 pool/⏹/startedAt 保留（T-V3 后半用例锁） |
| F-A5 清屏可恢复 | Done | `panel-session.mjs:157→161→165`（`clearMessages` → `historyPage` → 同 tick 再断言；期望位置 = 流尾，用例含位置断言） |
| NFR-A1 零回归 | Done | 150 窗/tombstone/冻结幂等语义未动（activity-flow 原断言全绿，仅「reload 无恢复」用例按新口径改写为终态补桩）；`postPoolSnapshot`/`SNAPSHOT_ROLES` 两仓零命中（本档机检用例断言） |
| NFR-A2 可诊断 | Done | webview 三类痕迹（takeover / late-terminal-stub / drop-unknown-role）环形末 50（`state.js:119-120` + `activity.js:77-81` 单一写点）；主侧 `ev:subdeliver` 三类计数；queued 遇已冻结键按设计不补痕 |
| NFR-A3 可机器验证 | Done | 新档 `test/async-visibility.test.mjs`（T-V1/T-V2/T-V3 两半/T-V4/T-V5/T-V6/T-V6b/T-V7 + 机检；happy-dom 驱真 webview 模块 + 桩面板驱真 extension 模块） |

**逐需求透明表（条目 B — advisor 池接入面；设计 = `docs/design/AGENT-LOOP.md` §18）**

| 需求 | 状态 | 落点 / 证据 |
|---|---|---|
| F-B1 状态可查 | Done | 双池并表 + 单查 fall-through + 评审专属字段 + done 未取注记——CLI `subagent-actions.mjs:79-101/104-151`（概览并表 `:154`、done 行 `:169`）；VSC 同名档 `:92-105/106-142` |
| F-B2 等待口径真实 | Done | CLI `ops.mjs:179-198/236-240`（本文件内双载体 helper——agent ∪ history，修前读子代理池恒真 0ms 秒过）；VSC `wait_for.mjs:117-131`（复用 `advisorReviewInFlight` 双载体）；条件字面/超时/间隔零变 |
| F-B3 定向取消 | Done | CLI 既有 fall-through 核实（`subagent-async.mjs:245-251` + `advisor-async.mjs:247-261`：abort/幂等/已完成后错误行）；VSC 补落点（`subagent-actions.mjs:194-198` → `cancelAdvisorReview`）；两端用例锁 |
| F-B4 动作面指引一致 | Done | 两端 observe/send 遇 advisor id 给明确指引（含 `action:'status'`）且不报 unknown（CLI `:244-245/:300-301`；VSC `:309/:358`）；零新能力（不注入） |
| NFR-B1 双端同源 | Done | 两端用例表同构（T-B1/B2/B2b/B3 + T-B6/B6b/B7 + T-B8 各一组）；命名差异（cancelAdvisorReview ↔ cancelAsyncAdvisor）按 D-B3 登记；工具描述句两端各原文自持 |
| NFR-B2 零回归 | Done | 子代理面字段/判定零变化（两端既有 subagent 用例全绿）；其余 wait_for 条件零变化（用例锁） |

**偏差（逐条，均已在交付报告登记）**

1. VSC `wait_for.mjs` 以**惰性动态 import**（非顶层静态）引 `advisorReviewInFlight`——静态 import 实测成环 TDZ（`Cannot access 'waitForTool' before initialization`，经 wait_for 入口加载时复现）；复用同 helper、语义零变，仅加载写法偏离惯例一处。
2. VSC 工具描述句落在 `src/agent-tools/subagent.mjs` 的 description 组装点（本仓描述载荷在 `subagent-spec.mjs`——写域外未动）：句尾追加评审面句。
3. 增量与预估有差：`test/async-visibility.test.mjs` 387 行（预估 +170）——覆盖 T-V1~T-V7 + 主侧定序/载荷/机检；测试族同带存量先例（最高 620），本批不拆分。其余文件增减落在预估带内。
4. 契约 §5.1.4 第 4 条的清屏再断言使 boot 路径出现「loadSession 内再断言 → flush → case 两拍」三段（末两拍仍为 flush → reassert；三段均幂等，末拍保证块恒落流尾）。
5. 内部代码评审 🟡#1 已修：cancel→settle 窗口内单查判定原两端不一致（VSC 报 `cancelled` / CLI 报 `running`）——删 VSC 分支对齐 CLI（NFR-B1 同输入同判定），两端各加一条锁定用例（T-B2b）。

**轮次与终态**

- 内部分歧审计（read-only explore）：8 组核查（补桩成员表 / 接管 / 队列与族边界 / 两处定序 / 痕迹与环 / REMOVE 零命中 / 条目 B 四面 / 写域归属）**全部无差异**。
- 内部代码评审（advisor code，轮次 1）：**VERDICT pass**（0🔴 / 1🟡 / 3🔵）——🟡#1 已修（上表偏差 5）；🔵#2（§18.3 done 注记措辞 vs 概览行）、🔵#3（T-V5 痕迹措辞 vs 实现超集）属文档面（写域外，留父侧/设计者裁）；🔵#4 即本 §5。
- 终态：**clean**（内部循环收敛）。

**未闭项（非本批代码面）**

- CLI `npm test` 唯一失败 = `doc-consistency` T41：① 本档 `:223` 一处跨仓引用未归一（VSC 仓档名 + `.md` 后缀 + 节号三段形态——V1 unknown-doc；§3 轮次 2 文本遗留，归一写法见 §3 父侧注）② `docs/batches/2026-09-11-REVIEW-CHAIN-GUARDS.md:229`（V2 计数，他批档）。均非本批写域（coder 不碰文档）→ 留父侧处置。
- `node scripts/check-doc-width.mjs`：本批新增文档面零（coder 未写文档）；报告中的超宽/一致性违规全部落在他批在飞文档（另行列表）。
- VS Code 实机 webview 目视：**未执行**（coder 无 IDE 环境）——按设计口径归父侧/用户验收。

## §6 验证与收口（父代理自写）

**2026-09-11 10:53 用户验收**（原话「都验收」——含本批；§4 为**父侧代签**——用户 04:20 授权窗口内，三条件齐备）。

- **交付面**：22 文件（条目 A 11 = 8 源 + 3 测试 · 条目 B 11 = CLI 5 + VSC 6，含两新测试档与 `test/files.mjs` ×2）——投递队列/就绪握手/终态防御三条 + R-1..R-5 收口（**案 B**）+ advisor 池四面（双端）。
- **父侧实跑**：VSC 全量 **391/390/0** · CLI 全量 **419/408/0**（与第 11 批合跑态）· 实现读码全对——桩集成员表逐行（`activity.js:149-181`：`answered`/`queued-cancel`/前置不满足三行 = **不补** ✓）·
  两拍排在 `openSessionContent` 之后（`panel-messages.mjs:427-428`）· `loadSession` 清屏→historyPage→同 tick 再断言（`panel-session.mjs:165`）· dispose 关闸清队（`chat-panel.mjs:126-127`）· VSC 双池单查 fall-through + `wait_for` 惰性 import（TDZ 披露）· CLI `advisorPools`/`advisorSettled` ✓。

> 〔父侧代笔 2026-09-11 12:58：单行 412 字符 → 纯折行〕
- **文档面**：§3 两处跨仓/计数形态违规 → 父侧 05:05 **代笔**（带标注）+ T41 复跑 **6/6 绿** ✓。
- **偏差裁定**：惰性动态 import = 接受（TDZ 实测）· VSC 描述落点 = 接受 · 387 行测试档 = 接受（同带先例）· boot 三段幂等 = 接受 · cancel↔settle 两端对齐（代码评审 🟡 已修）✓。
- **实机面**：VS Code 真 webview 目视 = 用户验收面（coder 无 IDE 环境——按设计口径声明；用户 10:53 验收通过）。
- **令牌链**：设计评审 token **已消费**（`consume-design`——链终）。

---
