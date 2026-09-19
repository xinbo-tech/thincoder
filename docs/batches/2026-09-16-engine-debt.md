# 批 8 · ENGINE-DEBT（引擎面债）· 2026-09-16

> 前情 = 批 1–5 已收口（提交 `5b0387b5`）· 批 6/7 在飞 · 本批条目源自`docs/TODO.md` 技术待办

## §1 需求讨论与裁定（主 agent）

> **批次状态：设计轮就绪待评审**（2026-09-16——§1 已落；§2 撰毕 ED-1–ED-5 + E 段预审五项收口）

**交付目标（一句话）**：清掉四条**引擎/机制面**独立小债（各带用例），消除三处「同族不一致 / 无出路 / 记账失真」。

### 本批条目（4 条，逐条可验收）

1. **恢复旧会话仍可触发推理链回传 400**（修复只作用于新产物）——已持久化会话（双字段 `history` + `contextHistory`）若含「无推理 assistant 紧邻 assistant」形态，恢复后首个请求仍被 provider 拒。
   **用户裁定（2026-09-16 按建议）= ① 恢复路径扫描归并（读取时修复）**——不把代价推给用户（不得取「不处理 / 新开会话规避」）。
   判据：夹具 = 含病态的已落盘会话 ⇒ 恢复后首个请求**不被 400 拒**（归并生效）+ 健康会话零改动（零回归）。
   证据：`thincoder-core/context.mjs`（并入分支）· `docs/core/design/CONTEXT-COMPACTION.md:108`（双字段持久化）。
2. **AUTO 轮中关闭权限 ⇒ 同轮两判据混判**（门判据在**回合首**构建 ⇒ 轮中关 AUTO 后：父级写工具静默放行、子代回退拒绝）。
   **裁定 = 门判据改「每次询问时取 live」**（消除同轮不一致）+ 可机判用例。
   判据：同轮内关 AUTO 后，父级与子代**判据一致**（同一 live 值）；开/关各一态各一用例。
   证据：`thincoder-vscode/src/agent/execute-tools.mjs:119` · `thincoder-vscode/src/extension/permission-gate.mjs:47`。
3. **TUI `loadOlder` 占位行移除未入账**（直算账对 Σ占位行**高估**，数十码元/页；长会话累积可达阈值级）——链：占位行 `unshift` 入账（`startup.mjs:145`/`:191`）→ 次轮 `shift()` 直接移除（`:170`）→ `loadOlder` 无重对账（`syncLineBudget` 的 `!Number.isFinite(_linesChars)` 守卫不触发重算）。
   判据（设计二选一）：① `shift()` 处补入账 **或** ② 占位行不单独入账 —— 收口后 **记账对照用例**（占位行加/减后 Σ 与实际渲染行一致）。设计档已有限定句 = `docs/cli/design/TUI-SESSION-VIEW.md:160`。
4. **advisor 评审池满 = 硬拒（非排队）**（同族不一致：`subagent` spawn 池满**排队 + 返回 position**，advisor 池满**硬拒**；且**异 scope** 独立评审本可并行却被拒）。
   **裁定 = 池满改排队**：**异 scope 恒可排队**；**同 scope 保持拒** + 给依赖理由（续审 stale 无意义）。退一步形态（设计可纳入对比）= 拒发文案带「可排队」选项 / 自动排队回执。
   判据：并发发起**异 scope** 评审 ⇒ 返回 `queued` + `position`（非错误文案）；**同 scope** 连发起 ⇒ 仍拒且理由含依赖语义；临时绕过（抬 `agent.poolLimits.advisor`）不再必需。
   证据：`docs/core/design/AGENT-LOOP-SUBAGENT.md:171`（设计口径）· `thincoder-core/agent-tools/advisor-async.mjs`（拒发实现面）。

5. **加固：spawn 站点 `nextSubagentId` 缺断言**（2026-09-16 explore#9 查证所得——**真加固点**）：当前「每个 spawn 站点必先调 `nextSubagentId`」**仅由约定保证、代码无断言**；若将来新增第四族漏调，`subagent-run.mjs:53` 读到**陈旧值** ⇒ `subagent-scheduler.mjs:181` `map.set` 覆写旧条目 ⇒ **静默丢报告 + status/cancel 错址**（病征见 `subagent-scheduler.mjs:375-378` 注释自陈）。
   **裁定 = 加断言 + 用例**（成本极低，收益 = 消除静默失败面）。
   判据：① 运行期断言（站点未调分配器即消费 ⇒ **显式报错**、非静默覆写）② 用例：漏调路径**必红**（反证）+ 正常路径零回归 ③ 既有断言锚 `thincoder-cli/test/subagent-scheduler.test.mjs:161-169` 保持绿。
   范围注：仅核侧；**不改 id 语义与分配算法**。

### 边界（本批不做）

① 不改批 1–7 已收口 / 在飞内容 ② 不做文档对账（批 10 面）与锚判据族（批 9 面）③ 不改 `agent.poolLimits` 默认值（只改池满行为）。

### 已知事实（供设计省勘察）

- 提交基线 = `5b0387b5`；三机检现状 = 宽度 ✅ / 台账 ✅ / 锚 域一 ✅（域二按批 6 处置中）。
- 条目 1/2/3/4 的 `file:line` 均已在 §1 就位（设计轮逐处**实读复核**，不得直引本 §1 行号当结论）。
- 条目 2 涉 VSC 侧（`thincoder-vscode/src/**`）——**入本批写域**（与批 7 的文件域不重叠：批 7 = agent/setup · extension/panel-* · webview · test 面）。

### 验收口径（初拟 —— 设计轮细化到可机判）

① 四条各带**可机判用例**（每条 ≥1 正常 + 1 反证）② 三机检零新增 + 发布门（`lint → test:full → test:integration`）全绿 ③ 条目 4 的异 scope 排队行为有实测读数（`queued` + `position`）④ 条目 2 的 VSC 侧与 CLI 侧**同判据**（若 CLI 侧同类门存在，一并核）。

### 用户裁定（2026-09-16 · 16:59）= **文档不受 300/500 行限制**（R6 撤下）

**用户原话**：「300 行 500 行那是对程序代码的限制，现在你们怎么对文档也搞起这种限制了？」

⇒ `thincoder/docs/core/design/AGENT-LOOP-SUBAGENT.md` **560 行合法**；**R6（本批执行拆分）撤下**——该档 §6.20 / §6.21 拆分规划按新口径**另批收正**（不入本批）。
**标记**：本条 = **父侧直接记录用户裁定**（非代笔设计内容）。

## §2 批次任务（eng-designer）


**§2 批 8 ENGINE-DEBT · 任务书（eng-designer 撰写）**

> 撰写 = eng-designer · as-of 2026-09-16 · 基线 `5b0387b5` · 勘察 = 设计轮**实读**（本段坐标均实读复核，不转引 §1）。
> 本段 = 任务书（条目 → 设计落点 → 受影响文件〔当前行数 + 预计增量，R24a〕→ 可机判判据 → 待裁项）。
> 交付件 = 本段 + 四档设计落笔 + 四档需求条目（落点全表见 2.6）。

### 2.1 条目 ED-1 · 恢复面回声归并（读取时修复，不推用户）

**来源**：§1 条 1 裁定（恢复路径**读取时扫描归并**；`docs/core/design/CONTEXT-COMPACTION.md:108` 双线约定不变）。

**缺陷面（实读）**：压缩当轮的 D-CC18 回声修复在 `thincoder-core/context.mjs:201-208`——tail 首条为 assistant 时占位经 `withPlaceholderPrefix` **并入该条**（copy-on-write；`pushReal:184` 与 `_fullHistory` 共享对象，禁原地改）。
已落盘的 `contextHistory`（机读线）在**恢复路径原样装回** ⇒ 病态形态（无 `reasoning_content` 的 assistant **紧邻** assistant）复活 ⇒ 首请求 400。
两端恢复落点（实读）：CLI `thincoder-core/session.mjs:273-296` `applySession`（`:292` 装 `machine` → `:296` `agent.history = [...machine]`）；VSC `thincoder-vscode/src/extension/panel-session.mjs:47-56` `activeLines`（→ `contextHistory`，`panel-chat.mjs:257` 装入）。

**设计落点**：`docs/core/design/CONTEXT-COMPACTION.md` §6.10 新增 **#8**（恢复面回声归并契约）+ §7 新增 **D-CC19**（读取时归并决策 + 否决备选）。

**受影响文件（R24a）**：

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/context.mjs` | 433 | +25/−4 | 新增导出：谓词（紧邻 assistant 判定）+ 归并函数（复用 `:201` `withPlaceholderPrefix`；干净输入返回同一引用） |
| 2 | `thincoder-core/session.mjs` | 495 | +2 | `applySession` 归并调用点（`:296` 前）——机器线出口单点 |
| 3 | `thincoder-vscode/src/extension/panel-session.mjs` | 349 | +2 | `activeLines` 归并调用点（`:47-56` 返回面） |
| 4 | `thincoder-core/test/compaction-echo.test.mjs` | 132 | +45 | 新增 M0–M3（见判据 1–4） |

**可机判判据**：
1. **归并有效**：夹具 = 已落盘会话（`contextHistory` 含病态对）⇒ 恢复后 `agent.history` 中「无 `reasoning_content` 的 assistant 后紧邻 assistant」计数 = **0**。
2. **信息守恒**：归并前后文本拼接逐字相等 + `tool_calls` 总数相等（只搬位置、不丢内容）。
3. **零回归**：干净输入 ⇒ 归并函数返回**同一数组引用**（`===` 断言）；健康会话恢复后 `agent.history` 逐元素 `JSON.stringify` 与归并前相等。
4. **两端同判据**：同一函数、两个调用点（CLI / VSC）各 ≥1 用例。
5. **不推用户**：恢复路径无新增询问、无抛出（病态输入 ⇒ 静默归并；会话档零改写）。

**待裁 / 上抛**：前条带 `tool_calls` 的变体（孤儿 `tool_result` 面）⇒ **上抛**（不在本批，见 2.5 F-3）。

### 2.2 条目 ED-2 · AUTO 门判据 live 化（父级 / 子代同判据）

**来源**：§1 条 2 裁定（每次询问取现值 + 「父级与子代同判据」句 + 开 / 关两态用例）。

**缺陷面（实读）**：`thincoder-vscode/src/extension/permission-gate.mjs:47`（AUTO 真 ⇒ `return undefined` **构建期早退** = 半 live 缺口）与 `:88`（批门同款）——二者在**门构建时**读一次 `panel._autoApprove`，其后 `:52` 的询问时活读对该路径**不可达**；
而 `thincoder-vscode/src/agent/execute-tools.mjs:104-119`（getAuto **每工具重读**，`:107` 已移除 `depth===0` 限定）与子代面 `thincoder-core/agent-tools/child-permission.mjs:32-43`（询问时读）均为 live ⇒ **同轮内两套判据**。

**设计落点**：`thincoder-vscode/docs/design/TOOLS.md` §8（`:173-175` 活事实源句 + `:188` 子代理 bullet 原地修订）+ §10 关键设计决策（`:224-225` live autoApprove 行）。

**受影响文件（R24a）**：

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/extension/permission-gate.mjs` | 107 | +4/−4 | 删两处构建期早退（`:47` 逐工具 / `:88` 批门）——门恒在，判定只留询问时活读 |
| 2 | `thincoder-vscode/src/agent/execute-tools.mjs` | 393 | ±3 | `:104-119` 注收正（逻辑零改——本已 live） |
| 3 | `thincoder-core/agent-tools/child-permission.mjs` | 44 | 0～+2 | 子代面口径句收正（注释面；实现轮实读定是否已足） |
| 4 | `thincoder-vscode/test/integration/vsc-autoapprove-midturn.test.mjs` | 新档 | +70 | 两态用例宿主（**新档**——既有档 `vsc-autoapprove-field.test.mjs` 190 行属批 7 test 域，只读不改，见 F-1） |

**可机判判据**：
1. **关→开（同轮）**：构建期 AUTO 开、同轮内关 ⇒ 父级写工具**出卡**（`onPermissionRequired` 调用计数 ≥1）。
2. **开→关（同轮）**：构建期 AUTO 关、同轮内开 ⇒ 父级写工具**零询问**（直通，询问计数 = 0）。
3. **父级与子代同判据**：同一轮内翻转后，父级与子代**读同一 live 值**（同一 `panel._autoApprove` 快照 ⇒ 同一判定）——开 / 关两态各一用例。
4. **CLI 侧口径对齐（只核不改）**：CLI 同类门为询问时读字段（坐标实现轮实读复核）——判据 = CLI 侧无构建期早退形态。

### 2.3 条目 ED-3 · TUI 占位行记账对账（`loadOlder` 移除未出账）

**来源**：§1 条 3 裁定（设计二选一）。

**缺陷面（实读）**：`thincoder-cli/src/tui/startup.mjs:170` `if (state.lines[0]?.text?.startsWith("… ")) state.lines.shift()`——**移除占位行未出账**；
而同档 `:190-191` 入账（`accountLine`）、`:147` 恢复路径以 `accountAll` 直算对账 ⇒ 账本漂移只在此处累积；`thincoder-cli/src/tui/display-budget.mjs:175` 的 `!Number.isFinite(_linesChars)` 守卫不触发（账仍有限）⇒ 不重算。

**设计落点**：`docs/cli/design/TUI-SESSION-VIEW.md` §5.5（`:160` 限定句原地修订——存量漂移 → 本批修复）+ §5.4（记账口径补句：移除必出账）。

**选型（二选一 → 选定 ①）**：① 「`shift()` 处补出账」选定；② 「占位行不单独入账」否决——占位行确在 `state.lines` 渲染面，`_linesChars = Σ lineChars` 不变式（`accountAll:146-153` 同口径）随之破裂，反向失真。对比表见设计档同批落笔。

**受影响文件（R24a）**：

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-cli/src/tui/startup.mjs` | 298 | +3 | `:170` 移除前补出账 |
| 2 | `thincoder-cli/src/tui/display-budget.mjs` | 199 | +8 | 新增导出 **`releaseLine(state, l)`**（= `_linesChars -= lineChars(l)`，钳 0）——**既有 `accountLine`（`:137-143`）不可复用**（幂等记于 `_budgetChars`：移除后重调增量为 0 ⇒ 账不降）；不变式 `_linesChars === Σ lineChars(l)` |
| 3 | `thincoder-cli/test/tui-memory-budget.test.mjs` | 301 | +25 | 对账用例（判据 1–3） |

**可机判判据**：
1. **对账等式**：`state.lines` 含占位行时 `state._linesChars` === Σ `lineChars(l)`（与 `:147` `accountAll` 同口径直算）。
2. **反证**：不含占位行时同式成立（不引入反向偏差）。
3. **重放无漂移**：连续两次 `loadOlder` 后等式仍成立。
4. **零回归**：`thincoder-cli/test/tui-memory-budget.test.mjs` 既有用例全绿（额度 / 保底 / 收据行计数语义零改）。

### 2.4 条目 ED-4 · advisor 池满改排队（异 scope 恒可排队 / 同 scope 保拒）

**来源**：§1 条 4 裁定（异 scope 恒可排队 + 依赖理由；须给队列语义 + 同 scope 识别 + 用例）。

**缺陷面（实读）**：`thincoder-core/agent-tools/advisor-async.mjs:256-267` 两关**皆硬拒**——`:259-264` 同 scope 守卫、`:265-267` 池满（`ADVISOR_POOL_LIMIT = 4`，`:166`）；`:15-28` 头注自述「over-limit 与 same-scope-running 一律即拒、从不排队」。
`thincoder-core/agent-tools/async-settle.mjs:274-278` 补位**显式豁免 advisor**（注：「advisor（独立评审池——无队列）」）⇒ 即便入队也无人补位。

**设计落点**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.10（`:171` 池满句改排队、`:172` 同 scope 守卫**语义不变**）+ §6.11（`:185` 等待口径含 queued、`:186` 取消路由含排队条目）+ `docs/core/requirements/AGENT-LOOP.md` §4.3（新增 **F-B5** + 明确不做行收正）。

**受影响文件（R24a）**：

| # | 文件 | 当前行数 | 预计增量 | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +22/−6 | `:15-28` 头注改句 + `:265-267` 池满分支 → 入队（返回 `queued` + `position`）；同 scope 分支**不动**；`cancelAsyncAdvisor:209-224` 排队条目取消分支（无 controller ⇒ 出队 helper + 余位重编号）——≈+4 |
| 2 | `thincoder-core/agent-tools/async-settle.mjs` | 280 | +2/−2 | `:274-278` 补位豁免面收窄（advisor 纳入补位；consult 保持豁免） |
| 3 | `thincoder-core/agent-tools/async-discard.mjs` | 139 | +6 | 排队条目取消 = 出队 + 余项位置重编号 |
 | 4 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | 0 | **复用**既有导出面（入队 / 位置重算 / 补位 / 排队块刷新）——不新造第二套队列 |
| 5 | `thincoder-core/test/advisor-pool-queue.test.mjs` | 新档 | +90 | 判据 1–5 用例宿主 |
| 6 | `thincoder-cli/test/config-pool.test.mjs` | 159 | ±15 | 池满两处断言改排队（`:70-83` / `:85-96`——异 scope 第 5 发 ⇒ 断 `queued` + `position`） |
| 7 | `thincoder-vscode/test/config-pool.test.mjs` | 201 | ±15 | 同族两处（`:90-97` / `:99-105`） |

**可机判判据**：
1. **异 scope 恒可排队**：池满 + 异 scope 发起 ⇒ 返回含 `queued` + `position`（**非** error 文案）。
2. **池空自动起跑**：槽释放 ⇒ 该评审 `status` 由 queued → running（实测计数，非仅文案）。
3. **同 scope 保拒**：同 scope 连发 ⇒ 仍拒，且文案含依赖语义（沿用既有实例键 / `docSetKey`，**不新造键**）。
4. **排队条目取消**：出队 + 池内无该条目 + 余项 `position` 重编号严格递增无空洞。
5. **零回归**：池未满 ⇒ 发起路径与既有行为逐字同（含 sync 面）。
6. **等待口径**：排队在途时 `wait_for "advisor settled"` **不**判 settled（与 §6.11 `:185` 口径一致）。

### 2.5 边界（明确不在本批）

- 不改批 1–7 已收口 / 在飞内容（承 §1 边界①）；不改 `agent.poolLimits` **默认值**（只改池满行为，承 §1 边界③）。
- 不做文档↔实装对账（批 10 面）与锚判据族（批 9 面）（承 §1 边界②）。
- 不在本批：① 孤儿 `tool_result` / `tool_calls` 形态的归并（ED-1 只治「紧邻 assistant」形态）② `panel-callbacks.mjs:349/:374` 注释口径收正（F-2）③ CLI 侧 AUTO 门改动（本批只核不改）④ TUI 其它记账面（`:145` 恢复占位行已由 `:147 accountAll` 对账）⑤ 任何新语义 / 新功能（本批 = 债清算）。
- **ED-5 专属边界**（承 §6.21.8）：不改 id 语义 / 分配算法 / 取号公式 / 池键形态 / relay 前缀；不新增第四条池；不做跨进程或槽持久化；不做 VSC 侧写入（镜像面只读复测）。

### 2.6 三方条目一致（批次档 §2 ↔ 设计档 ↔ 需求档）

| 条目 | 设计落点 | 需求档条目 | 判据条数 |
|---|---|---|---|
| ED-1 | `docs/core/design/CONTEXT-COMPACTION.md` §6.10 #8 + §7 D-CC19 | `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 新增（恢复面回声安全） | 5 |
| ED-2 | `thincoder-vscode/docs/design/TOOLS.md` §8 + §10 | `thincoder-vscode/docs/requirements/TOOLS.md` **F6**（`:22` 判定句收正） | 4 |
| ED-3 | `docs/cli/design/TUI-SESSION-VIEW.md` §5.4 + §5.5 | `docs/cli/requirements/TUI.md` **N11**（显示层字符账账实一致——`docs/cli/requirements/TUI.md:50`） | 4 |
| ED-4 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.10 + §6.11 | `docs/core/requirements/AGENT-LOOP.md` **§4.3 新增 F-B5** + 明确不做行收正 | 6 |
| ED-5 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` **§6.21** | `docs/core/requirements/AGENT-LOOP.md` **§4.3 新增 F-B6** | 5 |

### 2.7 发现即报告（编号 → 处置）

- **F-1 边界 / 归属**：§1 声明本批「与批 7 的文件域不重叠」**不精确**——批 7 域含 `extension/panel-*` 与 VSC `test/` 面，而 ED-2 原拟注释收正面含 `panel-callbacks.mjs`、用例宿主原拟含既有测试档 ⇒ 重叠。**处置**：ED-2 文件面收窄为不重叠面（`permission-gate.mjs` / `src/agent/execute-tools.mjs` / 新测档），重叠面移出本批。**边界判别权归主 agent**。
- **F-2 文档↔实况漂移（非本批）**：`panel-callbacks.mjs:374` 注释「无 gate（headless / AUTO 构建期）」在 ED-2 修后仅剩 headless 一义 ⇒ 需收正；该档属批 7 域 ⇒ 只登记、不动笔。
- **F-3 形态未覆盖（上抛）**：`tool_calls` / 孤儿 `tool_result` 形态的回声病态不在 ED-1 射程 ⇒ 登记待裁。
- **F-4 存量观察（非本批）**：`thincoder-core/agent.mjs:22` 对 `repairHistory` 的 import 无使用（定义 `agent/helpers.mjs:226`；唯一调用点 `agent/setup.mjs:50`）⇒ 死 import，登记不本批处置。

### 2.8 待裁项（实现前需主 agent / 用户裁）

1. **F-1 边界裁定**：重叠面（`panel-callbacks` 注释 + 既有测试档）是否移出本批（设计默认：移出）。
2. **ED-4 队列上限 / TTL**：是否需要独立上限或 TTL（设计默认：沿用子代理域既有队列语义——不新设上限，取消 = 出队）。
3. **ED-2 用例宿主**：新档 vs 改既有档（设计默认：新档，既有档只读）。

### 2.9 落档后收正 / 波及面登记（eng-designer · 四裁定落档完成后追加）

**A. 收正（一致性面 · 当场修 + 逐条登记）**

1. **2.3 表行 2（`:118`）**——出账辅助定为**新增导出 `releaseLine`**；「若既有面可复用则零改」句作废（依据见 B1）。
2. **2.6 表 ED-3 行（`:165`）**——需求档落点 `N10` → **`N11`**（ED-3 判据实落 `docs/cli/requirements/TUI.md:50`「显示层字符账账实一致」；N10 = 既有「会话显示层内存有界」条目，非本批落点）。
3. **指针**：`docs/cli/design/TUI.md:403` `F1–F12 / N1–N10` → **`F1–F13 / N1–N11`**。
4. **R24a 体量行 5 处**（实测复核后收正，口径 = 去尾换行后行数）：`docs/core/design/AGENT-LOOP.md:469` 517→**519**（超 500 硬限 +19）· `docs/core/design/CONFIG.md:143` 150→**152** ·
  `docs/core/design/AGENT-LOOP-SUBAGENT.md:446` 457→**464** · `docs/core/design/CONTEXT-COMPACTION.md:250` 260→**268** · `docs/cli/design/TUI-SESSION-VIEW.md:206` 206→**220**。
   - **未核差**：`TUI-SESSION-VIEW.md` 前记 206 与落笔前实测之间有 +10 差（本批笔 +4 可归因，余 +10 成因未核——非本批笔，登记不处置）。

**B. 落档补正（设计面 · 本批已落）**

1. **ED-3**：`docs/cli/design/TUI-SESSION-VIEW.md` §5.5 记账锚由 `startup.mjs:146-153` 收正为 **`display-budget.mjs:137/:146`**（原锚指调用面、非定义面）+ 新增导出 `releaseLine(state, l)` + 「`accountLine` 不可复用」依据（幂等记于 `_budgetChars`：移除后重调增量为 0 ⇒ 账不降）+ `Math.max(0, …)` 钳位例外句；§6.2 用例表 + 变更记录。
2. **ED-1**：`docs/core/design/CONTEXT-COMPACTION.md` §6.10 #8 + §7 **D-CC19**（读时扫描归并 → 定点；与既有 D-CC18 同机制）；`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 新条目。
3. **ED-4 决策面**：`docs/core/design/AGENT-LOOP.md` §7 **D-AL11** 修订（池满 ⇒ 异 scope 排队 / 同 scope 保拒；`ADVISOR_POOL_LIMIT = 4` 不变）+ 变更记录；`docs/core/design/CONFIG.md` §7 D-CF2/D-CF3 **理由句**收正（决策实体不变）；
  `thincoder-vscode/docs/design/AGENT-LOOP.md` §9 指针 `F-B1~B4` → **`F-B1~B5`**；`docs/core/requirements/AGENT-LOOP.md` §4.3 新增 **F-B5** + 变更记录（现 `:209`）。
4. **ED-2**：落点勘误已并档——`thincoder-vscode/src/extension/permission-gate.mjs:47` + `thincoder-core/src/agent/execute-tools.mjs:119`（**非** `thincoder-vscode/src/extension/` 之外的路径）。

**C. 波及面登记（非本批落笔 · 待裁 / 后续批）**

1. **ED-4 头注与注释面（核心 3 处）**：`thincoder-core/agent-tools/advisor-async.mjs:15-28`（自述「over-limit 与 same-scope-running 一律即拒、从不排队」）、`:244-253`（`slotsFull` 注释「池无排队语义」）、`:257-258`（`describe` 硬编码 running）⇒ 随排队面改写；`:166` 池限与 `:254-267` 两关为现行硬拒点。
2. **ED-4 出队面——已纳入（父侧裁定 2026-09-16 · 见 §2.4 表行 1/3）**：`thincoder-core/agent-tools/async-discard.mjs:109-116`（`ADVISOR_SPEC` 注释「池无排队语义 ⇒ wasStatus 恒 running」）须补 queued 面；同档无 `pruneQueue`、`describe(state, entry)` 仅凭 id 取 pending ⇒ 排队条目出队需新逻辑（`ROLE_SPECS` 扩展）；
   `cancelAsyncAdvisor`（`advisor-async.mjs:209-224`）走 `controller.abort`——**排队条目无 controller**。
3. **ED-4 补位面（判据 2 的前置）**：`thincoder-core/agent-tools/async-settle.mjs:271-278` 补位循环**显式豁免 advisor**（`settleAsync` 注解「advisor（独立评审池——无队列）」）——不改则排队条目永不自动起跑。
4. **ED-4 队列语义血缘（供实现轮对齐）**：`thincoder-core/agent-tools/subagent-async.mjs:55` 存 `ASYNC_POOL_LIMITS` · `escalate-async.mjs:175` 用池限 · 批调度面 `docs/core/design/AGENT-LOOP-SUBAGENT.md:157-165`（仅 async 参与 / `maybeRefillAsync` 补位 / 同档串行防死锁）⇒ 排队复用同族语义，不新造第二套。
5. **VSC 镜面**：`thincoder-vscode/docs/design/AGENT-LOOP.md` C-10b 排队面 `wasStatus` 标 **open**；VSC 侧同源镜面本批未落（是否同批落 = 主 agent 裁）。
6. **ED-1 未覆盖形态**（承 2.7 F-3）：`tool_calls` / 孤儿 `tool_result` 不归并（配对安全优先）。

**D. 实现前待裁（承 2.8 · 落档后状态）**

1. F-1 边界：重叠面（`panel-callbacks` 注释 + 既有测试档）移出本批——设计默认移出，仍待主 agent 裁。
2. ED-4 队列上限 / TTL——默认沿用子代理域既有队列语义（不新设上限；取消 = 出队），血缘见 C4。
3. ED-2 用例宿主：新档 vs 改既有档——默认新档（既有档只读）。

**E. 实现轮前续办（本设计轮未跑 · 列交预检）**

- 各条目测试面实读（候选宿主：cli `tui-memory-budget` / `wait-for-advisor-pool` / `advisor-chain-guards`；core `compaction-echo` / `advisor-consult-merge`；vscode `child-permission` / `vsc-autoapprove-field`）。
- ED-2 子代理面 `docs/core/design/AGENT-LOOP.md` §18 + `child-permission.mjs:32-33,38`（本轮未实读）。
- ED-1 调用点复核：CLI `session.mjs:293/296` · VSC `panel-session.mjs:54-55`；`session-restore.mjs` **未找到**（疑已并入 `startup.mjs`）。
- 锚 / 骨架复检（§2 + 四裁定落档后未跑）。

### 2.10 条目 ED-5 · spawn 站点取号断言（防静默覆写）（设计轮落档 2026-09-16）

**覆盖需求** = `docs/core/requirements/AGENT-LOOP.md` §4.3 **F-B6**；**设计落点** = `docs/core/design/AGENT-LOOP-SUBAGENT.md` **§6.21**（新增，八项齐备：选型对比 §6.21.2 · 接口契约 §6.21.3 · 受影响文件 §6.21.4 · 关键决策 D-SUB-ID1–ID4 §6.21.5 · 用例表 §6.21.6 · 验收 A1–A5 §6.21.7 · 边界 §6.21.8）。

**交付目标（一句话）**：把「每个 spawn 站点必先调 `nextSubagentId`」从**约定**变成**可机检断言**——漏调即抛错，不再静默覆写旧条目、静默丢报告。

**设计要点**：三取号站点（`subagent-spawn.mjs:445` · `escalate-async.mjs:157` · `advisor-async.mjs:270`）+ 三入池点（`subagent-run.mjs:181` · `escalate-async.mjs:285` · `advisor-async.mjs:326`）
——取号站点写**一次性令牌**（`_lastSubagentId`），入池点 ①断言令牌在场且与 id 匹配（漏调 ⇒ 抛 `Error`）②键守卫（同 id 二次入池 ⇒ 抛 `Error`）。令牌为**同步配对语义**（取号 → 消费无 await 间隙；跨 await 站点以键守卫兜底并显式登记）。

**零改面**：取号公式（`subagent-scheduler.mjs:396-397`）· 载体字段名 `_subAgentCounter` · 池键形态 `String(id)` · relay 前缀 · VSC 镜像载体。

**受影响文件（R24a · 行数口径 = `wc -l`）**：

| # | 文件 | 当前行数 | 预计增量 |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/subagent-scheduler.mjs` | 398 | +4 |
| 2 | `thincoder-core/agent-tools/subagent-run.mjs` | 202 | +8 |
| 3 | `thincoder-core/agent-tools/escalate-async.mjs` | 295 | +6 |
| 4 | `thincoder-core/agent-tools/advisor-async.mjs` | 357 | +6 |
| 5 | `thincoder-cli/test/subagent-scheduler.test.mjs` | 182 | +34 |
| 6 | `thincoder-core/agent-tools/subagent-spawn.mjs` | 459 | 0（零改——只读核对面） |

**验收标准逐条回指**（设计档 §6.21.7 A1–A5）：

| 验收 | 判据（可机检） | 回指 |
|---|---|---|
| A1 | T5-5 / T5-6 / T5-7 反证例断言抛错（`assert.throws`——非静默通过） | §1 条目 5 判据①② |
| A2 | 三消费点各含令牌断言 · 三入池点各含键守卫（断言句 + 抛错分支可 grep） | §1 条目 5 判据① |
| A3 | `thincoder-cli/test/subagent-scheduler.test.mjs:161-172` 绿 + 分配器单测族绿（`:105-139` · `thincoder-core/test/async-family.test.mjs:83-94` · VSC `test/subagent-id-counter.test.mjs`） | §1 条目 5 判据②③ |
| A4 | diff 不触取号公式行与池键形态；`thincoder-vscode/**` 零写入 | §1 条目 5 范围句 |
| A5 | 触碰源档 ≤500 硬限；越软线档在档内登记（含拆分计划） | R24a |

**用例表** = 设计档 §6.21.6 **T5-1–T5-8**（正常 2 · 边界 2 · 错误 3 · 零回归 1；错误面含漏调 / 覆写两反证，兄弟族 escalate 与 advisor 各 ≥1）。

**明确出批**：不改 id 语义 / 分配算法 / 取号公式 / 池键形态 / relay 前缀；不新增第四条池；不改令牌为多槽或计数池；不做跨进程 / 槽持久化；不做 VSC 侧写入（镜像面只读复测）；不迁 `DOC-MIGRATION.md:63` 所记迁移事项。

**收正（一致性面 · 当场修 + 逐条登记）**：

1. 2.9 A4 行 3 体量读数：`docs/core/design/AGENT-LOOP-SUBAGENT.md` 464 → **554**（本条目落档后复测；**越 500 硬限**——见 F-6）。
2. §2.6 表新增 ED-5 行（三方一致链补齐）；§2.5 增 ED-5 专属边界行。

**发现即报告（续 2.7 · 编号 F-5 起）**：

- **F-5 计数与枚举不符（§1 属主 agent 写域——打回，不自行改）**：`docs/batches/2026-09-16-engine-debt.md` `:11`（「本批条目（4 条）」）· `:9`（「清掉四条」）· `:7`（状态行「设计轮待发」）与实存 **5 条**（`:13-31`）不符 ⇒ 三处须由主 agent 收正。
- **F-6 体量硬限（本批笔所致 · 待裁）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` **554 行 > 500 硬限**（§6.21 增 90 行）⇒ 拆分触发条件已达（R24a 节已登记：候选 = §6.20 + §6.21 迁新档 `AGENT-LOOP-DISCARD`）。落点 / 时机裁定权归主 agent；本条目只登记不执行（搬迁 ≠ 本条目范围）。
- **F-7 同族体量（非本批笔 · 观察项）**：`docs/core/design/AGENT-LOOP.md` **519 行 > 500 硬限**（2.9 A4 已在案）；`thincoder-vscode/docs/design/AGENT-LOOP.md` **1586 行**（VSC 仓 = 本角色只读面）⇒ 两者均不阻断本批，登记待裁。

**待裁项（承 2.8 续）**：

1. **F-6 拆分落点 / 时机**——设计默认：实施轮开工前执行拆分（候选 = §6.20 + §6.21 迁新档）。
2. **F-5 计数收正**——主 agent 写域；设计默认：按 5 条收正三处。

**实现轮前续办（承 2.9 E 续）**：

- ED-5 测试面实读（候选宿主：`thincoder-cli/test/subagent-scheduler.test.mjs:104-139` / `:161-172` · `thincoder-core/test/async-family.test.mjs:83-94` · `thincoder-vscode/test/subagent-id-counter.test.mjs`）。
- ED-5 反证用例宿主二选一：同档追加（与 ID-COUNTER 链路族同宿主）或核侧新档——**默认同档追加**；若核侧三站点不可由 CLI 测档驱动，须增核侧测档（实现轮实测后定，不得静默跳过 T5-5/T5-7）。
- ED-5 令牌时序前提复核：`subagent-spawn.mjs:445` → `subagent-run.mjs:53` 无 await 间隙（D-SUB-ID2 前提；若不成立则该站点降级为仅键守卫并登记）。

**F. 机检卫生收正（2026-09-16 · 设计者直接执行 · 可 revert · 零语义）**

1. **本档 §2 骨架占位行删除**：原 `:49` 裸占位 `_（待写）_`（§2 已撰毕）——同批他段占位形态病灶见 G4。
2. **折行 2 档**：本档 `:195` / `:202` / `:233`（原超 300 字符）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` `:171` / `:555`。
3. **R24a 行数复测**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` 554（自陈）→ **560 行**（`wc -l` 口径）；
   差 +6 = 折行 +2 · 变更记录行 +1 · **其余 +3 成因未核**（登记不处置）——上记 2.9/A4 行 4 的 464 = 该时点读数，以本行为现状。

**G. 门禁读数（2026-09-16 实跑 · `node scripts/check-doc-width.mjs`）**

1. **宽度**：本域 6 档**零在列**（清）；FAIL = 4 文件 / 6 行，**全在本域之外**——`docs/batches/2026-09-16-migration-wrapup.md:17` · `2026-09-16-residual-debt.md:154` ·
   `2026-09-16-vsc-debt.md:17` / `:70` / `:119` · `docs/vsc/design/VSC-DEBT.md:69`（同刻他实例并改——`git status`：6 批次档 + 相关档在改）。
2. **原始字符口径差异（备查）**：`docs/core/design/AGENT-LOOP-SUBAGENT.md:468`（§6.21.2 表行 334 字符 > 300）——门禁**对表行豁免**（未列 FAIL）⇒ 不折行（折行会破坏 markdown 表行）。
3. **一致性**：V1 `docs/core/design/DOC-RULES.md`（域待定）· V2 `2026-09-16-migration-wrapup.md:4`（两条计数）· V3 四批次档「§3 缺轮次行」——**全非本段可修**。
4. **V3 病灶（全批 6 档同源 · 非本段笔）**：`scripts/check-doc-width-core.mjs:267-268` 骨架判据**只豁免斜体占位** `__（待写）__`；今日 6 档用**裸文本** `_（待写）_` ⇒ `real("4") || real("6")` 真 ∧ §3 无工具轮次行 ⇒ 报 V3。
   合规形态有先例（`docs/batches/2026-09-14-doc-migration.md:854`）。修法 = 包斜体（骨架形态收正 · 零语义）**或**待评审落地 §3 自获轮次行；**属段 = §3 评审 / §4·§6 主 agent**（本档各段段首占位行——§3 / §4 / §5 / §6）⇒ 本段不代笔。

**G5. 锚（V5）读数（2026-09-16 实跑 · `node scripts/doc-anchors.mjs`）**

1. **本域档零闸态悬空**：`docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/AGENT-LOOP.md` · `docs/core/requirements/AGENT-LOOP.md` · `docs/core/design/CONFIG.md` ·
   `docs/core/design/CONTEXT-COMPACTION.md` · `docs/cli/design/TUI-SESSION-VIEW.md` · `docs/cli/design/TUI.md`——在列条目**全为「符号·宽（报告面——不入闸）」**。
2. **闸态 FAIL：域一 31 条 / 域二 37 条——全在本域之外**（样本 `docs/design/TOOLS.md:189`「@thincoder/… 仓根外前缀」）。批基线记「锚 域一 ✅」⇒ 相对批基线为**回退**；
   成因在域外文件（同刻他实例并改）——**归属判定权归主 agent**（本段不处置、不代修）。
3. **报告面读数（不入闸 · 登记备查）**：`AGENT-LOOP-SUBAGENT.md:475` `parent._lastSubagentId` / `:558` `_lastSubagentId`——本次新增的设计档**字段名**，非本仓源码导出 ⇒ 报「符号·宽」非违规。

**H. 发现登记（本轮新增 · 承 2.7「发现即报告」）**

1. **ED-4 补位面 = 阻断项**（复述 C3 并升格）：`thincoder-core/agent-tools/async-settle.mjs:275` 补位循环**显式豁免 advisor / consult**（注解「advisor（独立评审池——无队列）」）+
   `advisor-async.mjs:265-267` 池满仍**硬拒**（注释「不等不排（②-6a 无排队语义保持）」）⇒ ED-4 判据 2「槽释放按队首自动起跑」**无实现面**——不裁此面则验收不可机检。裁定权归主 agent。
2. **ED-5 前提复核通过（实读）**：`escalate-async.mjs:147` 非 async、全档唯一 `await` 在 `:234`（嵌套闭包内）；`advisor-async.mjs` 全档无 `await`（异步面走 `.then()` 链）⇒
   取号 → 入池**同步成立**（D-SUB-ID2 前提）；`subagent-spawn.mjs:445` → `subagent-run.mjs:53` 同前记。不需修订 §6.21.3 数据流不变式。

**I. 本轮状态（不作宣告）**

- §2 撰毕（ED-1–ED-5）· 设计四档 + 需求条目已落档 · 机检卫生：**本域宽度清**；V3 病灶非本段可修（G4）。
- **未跑**：E 段续办项（各条目测试面实读 · ED-2 子代面 · ED-1 调用点复核 · 骨架复检）——**锚（V5）本轮机检已跑**（读数见 G5）⇒ **本段不作「设计就绪待评审」宣告**（五项预审未完）。

**J. E 段预审收口 + R1/R2/R3 落档 + 机检读数（2026-09-16 · eng-designer）**

1. E 段续办五项收口（承 I 块「未跑」清单）：
   - ① 各条目测试面实读：已跑——七候选宿主全数在场（glob 复核：CLI `tui-memory-budget` / `wait-for-advisor-pool` / `advisor-chain-guards` · 核 `compaction-echo` / `advisor-consult-merge` · VSC `child-permission` / `vsc-autoapprove-field`）；已知冲突面 = §2.4 行 6/7（ED-4 受影断言）；ED-2 零冲突（见 ②）；ED-5 宿主面见 §2.10。
   - ② ED-2 子代面实读：已跑——落点勘误已并档（§2.9 B4）；既有断言甄别零冲突（无待改既有反证）。
   - ③ ED-1 调用点复核：已跑——两端恢复落点已在 §2.1 实读（CLI `thincoder-core/session.mjs:273-296` · VSC `panel-session.mjs:47-56`）；`session-restore.mjs` 全仓文件名零命中（**不存在**）——「疑并入 `startup.mjs`」句收正。
   - ④ 骨架复检：已跑——读数见本块 7。
   - ⑤ 锚（V5）复检：已跑——读数见本块 4。
2. R1（ED-4 排队面）落档确认：
   - 设计面 = `AGENT-LOOP-SUBAGENT.md` §6.10 排队面补充 + §6.11 queued 取消路由（`:192`）+ §6.20.3 `wasStatus` 扩 queued（`:316-317`）；
   - 配置面 = `CONFIG.md` §6.1 `:113` + §7 D-CF2/D-CF3（`:122-123`）+ 变更记录（`:152-153`）；
   - 需求面 = `docs/core/requirements/AGENT-LOOP.md` §4.3 **F-B5** 判定句（`:71`）+ 撤句（`:76`）+ §4.8 F1 括注（`:148`）+ 变更记录（`:210`/`:213`）；决策对齐 = `docs/core/design/AGENT-LOOP.md` §7 D-AL11（§2.9 B3）。
3. R2（占位形态约定）：全批档骨架占位 = 斜体 `__（待写）__`（机检豁免谓词 `scripts/check-doc-width-core.mjs:267-268`）；统一动作 = **父侧机械执行面**——本段只登记约定，不收正他档。
4. R3（锚悬空归属登记 · 承 G5）：复检读数 = 域一 **17** / 域二 **37**（`doc-anchors.mjs` 实跑，域一较 G5 读数 31 降 17——他实例回修）；**本批三档闸态零命中**。
   域一按档 = CORE-UNIFICATION×4 · DOC-SYSTEM×4 · VSC-DEBT×8 · WEBVIEW×1；域二按档 = AGENT-LOOP×8 · CONTEXT-COMPACTION×3 · LEDGER-SELF-CONTAINED×5 · LOGGING×2 · PORTABILITY×2 · PROVIDER×4 · QUICKFIX-BATCH-3×2 · SETTINGS-TOOL×8 · TWO-REPO-MERGE×1 · VERIFY-REDESIGN×2——**54 条零条涉本批**。
   本批判据 = 本批三档**零新增**（**非**全域 exit 0——全域仍 FAIL）；归属判定权归主 agent（承 G5.2）。
5. R6 撤下记录：§1 `:47`–`:51` 用户裁定（文档不受 300/500 行限；`AGENT-LOOP-SUBAGENT.md` 560 行合法）——批 8 放弃执行拆分；§6.20/§6.21 拆分规划 + 体量句措辞按新口径**另批收正**（§1 `:51`；拟落 `docs/batches/2026-09-16-doc-length-rule-repeal.md`）——**本批不触体量节**；§2.10 F-6（体量/拆分）处置 = 随 R6 撤下。
6. 用例表形态对齐（设计档收正 · 机械形态）：`AGENT-LOOP-SUBAGENT.md` **§6.21.6** 对齐 §6.20.6 规范形态——列 = `# | 用例 | 输入 | 期望输出 | 回指`（「类型」并入「用例」前缀：`正常·/边界·/错误·/零回归·`；新增「回指」列全行 `F-B6`）；行数不变（块内等行替换）。
7. 一致面机检读数（收口态 · 实跑）：
   - 宽度：本批三档**零在列**；FAIL = 5 档 / 7 行全在域外（`doc-length-rule-repeal:29` · `doc-reconcile:125` · `migration-wrapup:17` · `residual-debt:168`/`:191` · `vsc-debt:129`/`:144`）。
   - 一致性：6 条（V2×2 = `migration-wrapup:4`「33 条」「26 条」≠ 枚举 3；V3×4 = §3 缺轮次行——criteria-face · doc-length-rule-repeal · **engine-debt（本档）** · migration-wrapup）——存量基线 0（均计新增）。本档 V3 行消解 = R2 斜体化（父侧）或 §3 评审落笔自获轮次行。
8. 余留（明示 · 非本段可修）：§1 计数收正（F-5 · 主 agent 域）· V3 本档行消解（R2 / §3）· **R24a 行数格 lag**（`:542`/`:544` 记 **560** vs 实测 **567**——`:567` 变更记录已记，body 未联动；本批不触体量节（§1 `:51`），处置随另批收正）· CLI 产品档旧语义句（C 块在案）。

## §3 设计评审（评审子代理）

_（待写）_

### 轮次 1（评审子代理）

__（待写）__
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | Same mechanism described two contradictory ways: `AGENT-LOOP-SUBAGENT.md:76` (§6.7.3) 腾槽补位 = "subagent / escalate 族恒补；advisor / consult 豁免" vs `:176` (§6.10) "补位覆盖评审池…原补位循环「显式豁免 advisor」句废". Same refill mechanism, advisor treatment differs → R1-exception / Document-ownership 🔴; lands on ED-4 判据 2. | Revise §6.7.3:76 to the ED-4 outcome (advisor covered, consult unchanged). |
| 2 | R24a annotations | 🟡 | Baseline drift: `advisor-async.mjs` 358 (`batch:153`) vs 357 (`batch:258` + `AGENT-LOOP-SUBAGENT.md:496`); `subagent-scheduler.mjs` 399 (`batch:156`) vs 398 (`batch:255` + `:493`). | Reconcile to one measured value across §2.4/§2.10/§6.21.4. |
__（待写）__
| 4 | Feasibility / scope | 🟡 | Queued-cancel implementation面 under-assigned: §6.11:192 commits queued cancel → 出队; §2.4:155 assigns `async-discard.mjs` +6; but §2.9 C2 (`batch:221`) flags "排队条目出队需新逻辑（ROLE_SPECS 扩展）…cancelAsyncAdvisor（:209-224）…无 controller" as 非本批落笔·待裁. Cancel-routing file not clearly in affected-files. | Put the cancel-routing modification (file + delta) in the affected-files table, or mark it deferred in §6.11. |
| 5 | Document ownership / consistency | 🟡 | Stale 硬限/拆分 language contradicts user ruling (docs exempt, R6 撤下, `batch:47-51`): `AGENT-LOOP-SUBAGENT.md:542/544` "越 500 硬限…拆分触发条件已达…须执行拆分"; `AGENT-LOOP.md:469` "超 500 硬限 +19"; also :542 says 560 vs 变更记录 :567 records 567. | Amend 体量/R24a sections to reflect ruling (no split required) + fix 560→567. |
| 6 | Scope | 🟡 | Review-object declaration labels ED-2 "子代理内容面 chunk 通道" but batch §2.2 (`batch:91`) = AUTO 门判据 live 化; chunk 通道 = other batch's 内容中继 (`AGENT-LOOP.md:398`). | Reconcile declaration's ED-2 descriptor with batch §2.2. |
__（待写）__
| 8 | Doc hygiene | 🔵 | R2 convention = 斜体 `__（待写）__` (`batch:346`) but batch §3–§6 (`batch:359/363/367/371`) still bare `_（待写）_` (V3 病灶, `batch:311`). | Apply 斜体 placeholder form to §3–§6. |
| 9 | Scope (note) | 🔵 | ED-1/2/3 design-landing docs outside review scope; source line counts not verifiable against disk. | N/A. |

VERDICT: changes-required
计数：🔴 1 · 🟡 5 · 🔵 3

### 轮次 2（评审子代理）

轮次 2（delivery-verification · 只验两条 · 新问题仅明显缺陷级）：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 验证 · 轮 1 #3 | — | `AGENT-LOOP-SUBAGENT.md:187-195` R24a 表 7 行值与批档 §2.4（`:153-159`）逐字一致：357 / 280 / 139 / 398 / +90 / 159 / 201；说明列亦逐字一致；`:197` 脚注口径句成立 | — |
| 2 | 验证 · 轮 1 #4 | — | §2.4 行 1（`:153`）delta = +22/−6 且说明列已纳入 `cancelAsyncAdvisor:209-224` 排队条目取消分支（≈+4 注记）；§2.9 C2（`:221`）已收正为「已纳入（父侧裁定 2026-09-16 · 见 §2.4 表行 1/3）」；§6.11 取消路由 queued 分支（`:205-206`）在场；round 1 #2 基线漂移已消（357/398 三处一致） | — |

VERDICT: pass
计数：🔴 0 · 🟡 0 · 🔵 0

## §4 用户批准（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

### §5 实施记录（eng-coder · 2026-09-16 · 批 8 ENGINE-DEBT · ED-1..ED-5）

**交付摘要（逐条 → 改动 file:line → 读数）**

- **ED-1 恢复面回声归并**：`thincoder-core/context.mjs:231-291`（isAssistantEchoPair / mergeAdjacentAssistantEchoes + prefixContent 泛化；D-CC19 契约：前并入后、空行相接、copy-on-write、干净输入返同引用、迭代至不动点）· `session.mjs:298-300`（machine 定线后装线前单点接线）· `panel-session.mjs:59`（VSC 同函数接线）。测试：core `test/compaction-echo.test.mjs` M0-M3 + VSC 新宿主 `test/compaction-echo.test.mjs` T-V1..V-4（注册 `test/files.mjs:83`）。读数：core test:full 236/236。
- **ED-2 AUTO 门 live 化**：`permission-gate.mjs:46-51 / :86-91`（两门恒返回回调、ask 时 live 读 `panel._autoApprove`——构建期零读）· `execute-tools.mjs:205-218` 注收正（逻辑零改）· `child-permission.mjs:14/:30` 口径句收正。测试：`test/integration/vsc-autoapprove-midturn.test.mjs`（两态用例，注册 `test/integration/files.mjs:22`）。判据④ CLI 只核不改：`interaction.mjs:60/:79` ask 时活读、无构建期早退（零写入）。读数：vsc test:full 570/571（1 败 = doc-anchors 真仓清账——他批 docs 在飞）；vsc test:integration 56/56。
- **ED-3 占位行出账**：`display-budget.mjs:148-150` releaseLine（`-= lineChars(l)` 钳 0）· `startup.mjs:170` 移除前补出账（单行改写净零）。测试：`tui-memory-budget.test.mjs` U11 反证 + T-TB9 更新。读数：cli lint 184 OK。
- **ED-4 advisor 池满排队**：`advisor-async.mjs`（异 scope 恒可排队——ack queued+position `:340-342/:411-419`；同 scope 保拒 `:334-338`；排队取消出队+重编号 `:212-234`；ADVISOR_POOL_LIMIT=4 未改）· `async-settle.mjs:278-283` 补位接线 · `async-discard.mjs:116/:120` queued wasStatus/出队 · `advisor.mjs:204-215` 排队 ack 模型可见面 · `mouse.mjs:239` TUI 取消后刷新。测试：`test/advisor-pool-queue.test.mjs` 7/7 + CLI/VSC config-pool 两族断言改排队。读数：core test:full 236/236。
- **ED-5 取号断言**：`subagent-scheduler.mjs:398-401`（nextSubagentId 同步写 `_lastSubagentId` 一次性令牌）+ `:413-429`（consumeSubagentToken / assertPoolKeyFree 导出）· 三消费点 `subagent-run.mjs:57` / `escalate-async.mjs:160` / `advisor-async.mjs:348` · 三入池键守卫 `subagent-run.mjs:186` / `escalate-async.mjs:289` / `advisor-async.mjs:409`。测试：`test/subagent-scheduler.test.mjs` T5-4..T5-7c（+84 行）。读数：cli test:full 637/639（2 败 = ledger 档指针 `docs/TODO-archive.md:291`——他批文档域，非本批）；cli test:integration 26/26；subagent-scheduler.test.mjs 24/24；VSC subagent-id-counter.test.mjs 4/4。

**验收判据 A1–A5 逐条核对（全部通过）**

- A1 ✓：T5-4/5-5/5-6/5-7a/b/c 全 assert.throws + 文案锚（allocator-not-called / collision）。
- A2 ✓：三消费点 + 三入池守卫 grep 在位（坐标见 ED-5 行）。
- A3 ✓：`subagent-scheduler.test.mjs:161-172` 原样绿（24/24 内）；分配器单测同档；async-family.test.mjs 在 core 236/236；VSC subagent-id-counter 4/4。
- A4 ✓：git diff 无取号公式行 / 池键形态行触碰；`thincoder-vscode/**` 对 ED-5 零写入（VSC 工作树改动均属 ED-1/ED-2/ED-4 面）。
- A5 ✓：触碰源档全 ≤500 硬限（max session.mjs 499）；越软线档均注册 SOFT_LINE_REGISTRY；escalate-async.mjs = 300 换行计数（不越线、零余量——下批动此档需注册或拆分）。

**决策透明表（内部审计 + code review 逐条裁决）**

| # | 来源 | 级别 | 内容 | 裁决 | 证据/理由 |
|---|---|---|---|---|---|
| 1 | explore 审计 | 🔴 | escalate-async.mjs 越 300 软线未登记 → hygiene 必红 | **Not an issue** | 实证：换行计数 = 300（`>300` 为假）；core-hygiene T-C14/N8 在 236/236 全绿内 |
| 2 | explore 审计 | 🟡×4 | R24a 增量低估（context 433→499 / session 495→499 / scheduler 398→429 / advisor-async 357→451） | **Deferred**（档案保真——设计档表修订 = eng-designer 域） | 实际读数已列本表 |
| 3 | explore 审计 | 🔵×3 | 表外实现面：advisor.mjs:204-215 / mouse.mjs:21/:239 / VSC compaction-echo 新宿主 + files.mjs:83 | **Not an issue**（批内判据必需面——透明披露） | ED-4 判据 1/4、ED-1 判据 4 直接要求 |
| 4 | advisor review | 🟡 | ED-4 排队取消缺「同款机读线提醒」（设计 §6.11 句；`advisor-async.mjs:226-235` 无 pushReal——对照 async-settle.mjs:235 running 面有） | **Deferred**（设计档句 vs 判据：6 判据全绿；补提醒 = 设计者裁定后一行 pushReal） | 交付报告列为跟进项 |
| 5 | advisor review | 🟡 | VSC 队列载体缺口：`_asyncAdvisorQueue` 不在 VSC CARRIER_FIELDS（agent.mjs:39-43）；panel-messages.mjs:221 部分 parent → dequeue no-op → refill 可重启已取消排队评审 | **Deferred**（= 批 8 §2.9 C5 登记项「VSC 镜面本批未落——主 agent 裁」） | 坐标证据在交付报告 |
| 6 | advisor review | 🔵 | 测档头指针误引（vsc-autoapprove-midturn.test.mjs 引 cli TOOLS.md §8 + misalign 批 §2.8；实为 vscode TOOLS.md §8 + 本批 §2.2） | **Deferred**（🔵 文档卫生——父侧/设计者一行修订） | 交付报告列明 |
| 7 | advisor review | 🔵 | 注释失鲜：async-settle.mjs:8/:104「advisor 无队列」、advisor.mjs:192「pool-full refusal」 | **Deferred**（🔵——随下批顺带） | 交付报告列明 |

**审计与代码评审轮次与终态**

- 内部 explore 分歧审计：1 轮 → DEVIATIONS（1🔴 + 4🟡 + 3🔵）→ 裁决后终态 **clean**（🔴 实证不成立；余项档案保真/协调项）。
- advisor code review：1 轮 → wall-clock 超时（600s）未产正式 VERDICT，但产出实质发现——逐条裁决见上表，未发现新增 🔴 阻断面。
- 修正轮：0 轮（无 must-fix 发现）。fix round 记录：无（唯一代码面发现 = EOF 换行卫生——已修：subagent-scheduler.mjs 尾行补换行符，lint Syntax OK）。
- **终态：clean**（交付面无未决 🔴；Deferred 项均为文档域/协调项，处置权 = 父代理/设计者）。

**全量验证读数（本 pass 实跑）**：core lint/test:full 236/236 · cli lint 184 OK / test:full 637/639（2 败见他批文档域）/ test:integration 26/26 · vsc lint 203 OK / test:full 570/571（1 败见他批文档域）/ test:integration 56/56。

## §6 验证与收口（父代理）

> **收口判词：已收口 2026-09-16**（设计轮 1 changes-required → 轮 2 pass → 实施轮交付 → 父侧核验 → 核销关链）

### 交付判定（父侧实测）

| 条目 | 父侧核验 | 判定 |
|---|---|---|
| ED-1..ED-5 | 实施轮报三包 236/236 · 637/639 · 570/571 + int 56/56 · **父侧单跑核验**：`advisor-pool-queue` **7/7** ✓ · `subagent-scheduler` **24/24** ✓ | ✅ |
| 2+1 失败裁决 | cli T67/T96 + vsc T-DC6 = 他批文档域在飞（登记） | ✅（裁决） |

### 未决（登记/触发 · 承实施轮 Deferred 六项）

1. 🟡 ED-4 排队取消缺「同款机读线提醒」（设计 §6.11 句未逐字落；6 判据全绿——补 = 一行 + 测试锚，随下批）；
2. 🟡 VSC 队列载体缺口（§2.9 C5 已登记——主 agent 裁）；
3. 🟡×4 R24a 增量低估（context 433→499 · session 495→499 · scheduler 398→429 · advisor-async 357→451——设计档表修订随批 12 续轮后 designer 面）；
4. 🔵×2 注释失鲜（`async-settle.mjs:8/:104` · `advisor.mjs:192`——下一触点修）。

### D7 核销同步

| 项 | 状态 |
|---|---|
| 状态行 | 本档 → **已收口 2026-09-16** |
| 待办勾销 | 台账四条（「机器线残留」·「AUTO 门判据窗口」·「TUI loadOlder 占位行」·「advisor 池满硬拒」）→ **核销 → 归档**（父侧同轮） |
| 台账可见面 | 收口行见会话流 |
