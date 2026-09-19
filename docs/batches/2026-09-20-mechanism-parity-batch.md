# 2026-09-20 · 端差·机制层定策批（MECHANISM-PARITY-BATCH）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-20 04:25 · 来源 = 用户 04:22「**端差 p1/2/3 都要处理**」+ 端差总体评估（explore id=10 · 代码同源度）。
> 本档 = **P2**（机制层端差 · **需要方向裁定**）。

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计已交 · 评审 id=31 = **changes-required**〔🔴1 / 🟡4 / 🔵4〕→ 修正轮 id=32 **9/9 已落** → **复核中**）

### 1.1 条目清单（2 条台账）

| # | 台账 | 条目 | 证据 / 关键坐标（勘察已核） | 面 |
|---|---|---|---|---|
| 1 | **#122** | **VSC depth-0 循环缺核语义三段**：① **Stop 钩子缺席**——核 `core/agent/run-stages.mjs:128 finalizeAgentTurn` 跑 `:136 runHooks("Stop")` + `:132 flushPeerDomains` + `:193 closeOpenCodeAdvisorRuns`；VSC 自持 `src/agent/run-stages.mjs:277` **无 Stop 钩子、无 advisor-run 收口** ⇒ **用户配的 hooks 在 VSC 静默不生效**（VSC 全树 `runHooks` 零命中）② 派发面 hooks 缺席（核 `core/agent/dispatch.mjs:258/314/443/457` ∥ VSC `src/agent/execute-tools.mjs:49`）③ guard 载体分叉（核 `_inheritedGuard` ∥ VSC `guardCarry`） | 见台账 #122 evidence | 产品码（两条线） |
| 2 | **#123** | **端差真分叉族**：① **VSC 模型面缺 `ledger_query`/`ledger_count`**（核基础集有 ∥ VSC 自持清单 27 项无；VSC 内 grep 零命中）② **权限/审批四处实现**（核 `core/permission.mjs` = **孤儿零引用** · CLI `src/cli/permission.mjs` + TUI `interaction.mjs` · VSC `permission-gate.mjs`）③ **核挂起状态机零产品消费者**（`core/agent/suspension.mjs:154` · 两端各一份已分叉）④ **事件载荷字段集两端不同构**（同一 `⟦ev⟧queued`：CLI `kind`+detail ∥ VSC `waiting`+`reason`）⑤ `ContinueError` **双类**（核 `helpers.mjs:205` ∥ VSC `agent.mjs:43`） | 见台账 #123 evidence | 产品码 + 结构 |

### 1.2 边界与**本轮必需产出**

- **本批 = 定策批**：设计轮**必须先给方向选项**（每项 2–3 案 + 推荐 + 代价 + 可逆性），**由用户裁定后**才进入实现轮；**不得**在未裁前写实现设计定稿。
- 方向骨架（父侧预置候选，供设计轮展开，**不等于裁定**）：
  - **#122①**：① VSC 循环向核收口（长程）② 端侧补齐三段语义（短程）③ 判端差保留 + 登记 + 文案告知（零改）
  - **#123①**：① 补 `ledger_query`/`ledger_count` 入 VSC 基础集 ② 端自持查询面 ③ 判端差保留 + 登记
  - **#123②**：① 核 `core/permission.mjs` 作单一权威、两端消费 ② 判端差保留（核那份删除 → **删除须另裁**）③ 登记不动
  - **#123③**：① 两端驱动接核状态机 ② 判「两份保留 + 状态机降为参考」并同步设计档 ③ 收核那份
  - **#123④**：① 载荷字段同构（一端改形）② 判「两端各自归一 + 双改纪律」入档
  - **#123⑤**：① 单一类（核导出、端引）② 登记不动
- **不动**：纯显示面（归 P1）· 文档过期登记（归 P3）· 池上限 / 调度语义。

### 1.3 验收

① 逐条「台账 id → 方向选项 + 推荐 + 代价」（**本批设计轮的交付物 = 裁定书**）；② 用户裁定后：逐条「裁定 → 改动 file:line」；③ 三包测试全绿；`doc-check` 净增 0。

### 1.4 台账

#122 / #123 → 本批（待讨论 → **待设计** · 任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

### 2.1 本轮性质与产出

**轮次** = initial（定策轮）。**产出** = **裁定书**（每项 2–3 个方向选项 + 推荐 + 代价 + 风险 + 可逆性 + 与两条端差裁定的关系），供用户裁定。

**边界（本轮明确不做）**：① 不给实现设计定稿（用户裁定前不写「怎么做」的定稿）；② 不写产品码；③ 纯显示面端差（P1）与文档过期登记（P3）不并入；④ 需求档（`docs/core/requirements/**`）内容权归主 agent，本席只读不改。

**方案定稿的落点（裁定后轮次用）**：机制面 `docs/core/design/AGENT-LOOP.md`（§2.3 载体契约 / §6.13 Stop 钩子 / §6.18 端壳接线）· `docs/core/design/AGENT-LOOP-SUBAGENT.md`（§6.27.12 挂起驱动三端表）· 读数登记 `docs/vsc/design/VSC-DEBT.md` §12.1；规格点 `docs/core/design/TOOLS.md`（工具面）/ `docs/core/design/CORE-UNIFICATION.md` §2.13（端差注入位）。

### 2.2 覆盖表（台账 id → 本档小节）

| # | 台账 | 条目（简） | 本档 |
|---|---|---|---|
| 1 | #122① | VSC depth-0 循环缺 Stop 钩子 + advisor-run 收口 | §2.3 |
| 2 | #122② | 派发面 hooks 缺席（VSC depth-0 工具轮） | §2.4 |
| 3 | #122③ | guard 载体分叉（核 `_inheritedGuard` ∥ VSC `guardCarry`） | §2.5 |
| 4 | #123① | VSC 模型面缺 `ledger_query` / `ledger_count` | §2.6 |
| 5 | #123② | 权限/审批四处实现（核那份孤儿） | §2.7 |
| 6 | #123③ | 核挂起状态机零产品消费者 | §2.8 |
| 7 | #123④ | 同族事件载荷字段集两端不同构（`⟦ev⟧queued`） | §2.9 |
| 8 | #123⑤ | `ContinueError` 双类 | §2.10 |

### 2.3 #122① VSC depth-0 循环缺 Stop 钩子 + advisor-run 收口

**现状**（实核）：核 `thincoder-core/agent/run-stages.mjs:128 finalizeAgentTurn` → `:132 flushPeerDomains(agent)` · `:135-144`（`depth === 0 && !signal?.aborted && thrownError?.name !== "AbortError"` 时跑 `runHooks("Stop", …)`，fire-and-forget）· `:192-195`（正常结束且未注入评审报告 ⇒ 动态 import 核 `agent-tools/advisor-async.mjs:464 closeOpenCodeAdvisorRuns(agent)`）。
VSC 自持 `thincoder-vscode/src/agent/run-stages.mjs:277 finalizeAgentTurn`（378 行）：走 consult 清理 / 双池回合尾 / `:374-376 flushDomains(cwd)`（端侧登记面）/ `_inAutoTurn` 复位 / `guardCarry` 继承——**无 Stop 钩子、无 advisor-run 收口**。
全仓实核：`runHooks` 定义 = `thincoder-core/hooks.mjs:27`（唯一实现），调用点 = 核 `agent/run-stages.mjs:136` + 核 `agent/dispatch.mjs:258/314/443/457` + CLI 测 `thincoder-cli/test/hooks-stop.test.mjs:18/240/243`；`thincoder-vscode/**` **零命中**。用户可见后果 = `config.json` 的 `hooks.Stop` 在 VSC 静默不生效（CLI 生效）；评审线程收口语义在 VSC 缺位。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① VSC 循环向核收口**（depth-0 用核 `runAgent` / 核收尾） | VSC `src/agent.mjs`（484）· `src/agent/run-stages.mjs` · `src/agent/setup.mjs`（482）· `execute-tools.mjs` · 面板事件链 | 极高（端壳循环签名/载体/回调三态门/帧回调/面板事件全需归位） | 高（面板可用面直接暴露） | 低 |
| **② 端侧补齐三段语义**（VSC 收尾调核 `runHooks("Stop")` + 核 `flushPeerDomains` 对位 + 核 `closeOpenCodeAdvisorRuns`） | VSC `src/agent/run-stages.mjs` 1 档 + VSC 用例档（新增） | 低（~20 行；两处动态 import——核 `advisor-async` 链可达 `node:sqlite`，须守 W8 契约②） | 中（Stop 钩子 = 用户脚本外部副作用，归一后 VSC 开始触发；`docs/core/design/AGENT-LOOP.md:161` #169 行已点名「外部副作用随 #111 登记」） | 高 |
| **③ 判端差保留 + 登记 + 文案告知** | 文档面 + 文案 | 零机制改 | 高（用户配置的自动化两端不等——正是台账判「风险评级 = 高」的判据） | 最高 |

**推荐 = ②**。理由：三处语义在核内**均已是单点**（`runHooks` / `flushPeerDomains` / `closeOpenCodeAdvisorRuns`），端侧动作是**调用期接线**而非第二份实现——与既裁先例同款（`docs/core/design/CORE-UNIFICATION.md` §2.13 端差注入位；核单源 + 端装配 W13/W15 先例）。① 与现行端壳结构（面板事件 / 回转 / 三态门）耦合成本远高于其收益，且属长程工程，不宜与本批同轮。

**与两条端差裁定的关系**：本项**不属** 2026-09-12 23:37「端差选 A = 登记共存」的保留面——该面在 `docs/core/design/AGENT-LOOP.md:41`（#111）与 `:61`（#169）已裁「**以 CLI 为准**（Stop 钩子 + 收尾编排）· 已裁（2026-09-13）· 按建议」，即 09-12 的 A 是**未裁面的默认处置**，本面已被后续裁决覆盖。故本项属 2026-09-19 23:35「端差还是要消除的」所指的**该消的差**（裁了但端侧接线未落 = S2 段未完）。选项 ③ 成立的前提是**显式撤回** #111 / #169 两条裁决，本席不代裁。

### 2.4 #122② 派发面 hooks 缺席（VSC depth-0 工具轮）

**现状**（实核）：核 `thincoder-core/agent/dispatch.mjs:6` import `runHooks`，四处调用点——`:258`（串行批 PreToolUse，**可阻断**）· `:314`（并行批 PreToolUse）· `:443`（PostToolUse，fire-and-forget）· `:457`（PostToolUseFailure）。
VSC 自持 `thincoder-vscode/src/agent/execute-tools.mjs:49 executeToolBatches`（394 行）**零 hooks 调用点**（import 面 `:7-22` 无 `hooks`）。
**同时实核到一条关键边界**（台账与 §1.1 未含，本席补）：VSC 的 **depth>0 子代理走核循环**——VSC 子代理工具族 = 核登记册（`thincoder-vscode/src/agent-tools/index.mjs` = `export * from` 核转口），管线 `thincoder-core/agent-tools/subagent-async.mjs:16-20` 直接 import 核 `agent.mjs` 的 `runAgent` 并以**核签名**（agent 对象）调用；端壳循环是 provider+cwd 签名（`thincoder-vscode/src/agent.mjs:53`），两者不可能混用（`thincoder-vscode/test/eng-designer-role.test.mjs:23` 记「端工具 `ctx.runAgent` 缝不存在」）。
⇒ 缺口**只在 VSC depth-0 工具轮**：今日 VSC **主会话与子代理皆不触发**（`runHooks` 读 `ctx.agent?.config?.hooks`——`thincoder-core/hooks.mjs:28`；而 VSC `agent.config` 缺 `hooks` 段，§2.27-1）⇒ 三事件两处皆静默；归一（config plumb 落）后**子代经父 config 获 `hooks`、触发由核循环承载**，主会话自持循环仍无四调用点 ⇒ 缺口收窄为 depth-0 工具轮。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① VSC 派发改调核 `dispatch.mjs`** | VSC `execute-tools.mjs` + `tool-gates.mjs`（166） | 高 | 高——VSC 派发前置门族（planMode 门 / 批权限聚合 / L3 域记账 / 端只读分类）**核内无对位**，收口前须先把门族归位（另工作面） | 低 |
| **② 端侧在批执行处补四调用点**（语义与核同：PreToolUse 阻断 ⇒ 工具结果「被拦」形态须与核逐字一致） | VSC `execute-tools.mjs`（394 → ~409）+ 用例 | 低 | 中（阻断语义的工具结果文案 / 状态两端口径若不一致即漂移） | 高 |
| **③ 登记保留** | 文档面 | 零 | 同 §2.3 ③（用户配置自动化两端不等） | 最高 |

**推荐 = ②**，与 §2.3 ② 同批同源（同一根因：端壳自有循环的分支面未接线）。落地前须先定「PreToolUse 阻断后的工具结果形态」两端口径（本席未实读核阻断文案 → 标 `unverified`，**实现轮前须实核**）。

**与两条端差裁定的关系**：同 §2.3——本面由 `AGENT-LOOP.md:61`（#169 hooks 四事件「以 CLI 为准」）覆盖，属**该消的差**；③ 须先撤回 #169。

### 2.5 #122③ guard 载体分叉

**现状**（实核，坐标补全）：核 = **agent 字段载体**——写 `thincoder-core/agent/run-stages.mjs:201-208`（`agent._inheritedGuard = { …7 键 }`，条件 = autoTurn ∧ 非中止 ∧ 非 ContinueError），读 `thincoder-core/agent.mjs:146-149`（`:149` 复位 null）。
VSC = **宿主对象容器载体**——键名清单常量 `thincoder-vscode/src/agent.mjs:27 INHERITED_GUARD_KEYS`（7 键，与核内联字面量逐键同集），写 `src/agent/run-stages.mjs:366-369`（参数 `guardCarry` + `:278` 解构），宿主持有 `panel._guardCarry`（`src/extension/panel-turn-loop.mjs:63-64` 取用并清空 · `:82` 每轮 `??= {}`），恢复端 `src/agent.mjs:120`（`opts.inheritedGuard`）。
⇒ **语义等价、无用户可见差异**；真病 = **7 键清单存在两份**（VSC 常量 ∥ 核内联字面量），任一侧加键即静默漂移。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 端侧改用核载体名**（`agent._inheritedGuard`） | VSC 3 档 | 中 | 高——VSC agent 对象为 per-run，字段载体不跨 run 存活；须改挂 history，牵动载体表 | 中 |
| **② 核内提供快照 / 恢复单点**（如 `snapshotGuard(agent)` / `restoreGuard(agent, obj)`，**载体留端**、清单归核） | 核 1 导出 + VSC 2 调用点（+ CLI 调用点若同改则 1） | 低 | 低（语义不变，仅清单单源化） | 高 |
| **③ 登记保留（现状）** | 文档面 | 零 | 低（两端等价）——但漏改清单的漂移风险留存 | 最高 |

**推荐 = ②**（可选），**若本批只求稳则 ③ 可接受**：推荐 ② 的唯一动机是消灭双份键名清单（与 §2.9 / §2.10 同族「同形重复」），不涉行为。

**与两条端差裁定的关系**：本项在 09-12 的 A 面内**已登记**（`docs/core/design/AGENT-LOOP.md:20` 表列 guard 面 · #111 行含「VSC 的 guard 推回」按核内结构归位）。② 属「收口为核单点」而非「以任一端产物回改另一端」，不违 09-12 A 的「互不追赶」；若判 ③ 则完全落在 A 内，不必碰 09-19。

### 2.6 #123① VSC 模型面缺 `ledger_query` / `ledger_count`

**现状**（实核）：核 `thincoder-core/tools/index.mjs:55 assembleBuiltinTools` 含两工具——`:61` 动态 import `../ledger.mjs` 取 `ledgerQueryTool` / `ledgerCountTool`（`:73-74` 入表），工具定义 = `thincoder-core/ledger-cmd.mjs:112` / `:130`（`readonly: true`；`cwd` 缺省经 `cwdOf(ctx)` = `ctx.agent.cwd ?? ctx.cwd ?? process.cwd()`，`:110`）；CLI 消费 = `thincoder-cli/src/cli/make-agent.mjs:64`。
VSC 消费 = `thincoder-vscode/src/agent/setup.mjs:15`（import `builtinTools` / `readImageTool` / `toOpenAISchema` from `../tools.mjs`）+ `:162`（baseTools）——清单 = VSC 自持 `thincoder-vscode/src/tools/index.mjs:172-186`（**实核 30 项**；台账读数 27，见 §2.12 不一致处），**无该两工具**；`thincoder-vscode/**` grep `ledger_query|ledger_count` **零命中**。VSC 侧台账面另有**可见面**（状态栏 + 提示行 = `src/extension/ledger-surface.mjs`，经动态 import 用核 `ledger.mjs`）——但它不在模型工具面内。
⇒ 能力面不等：VSC 里模型**无法自行查台账**（台账写面走核 `agent/family-tools.mjs` 家族段，与基础集分离；**本席未逐字实读家族段的 ledger 写工具段** ⇒ 标 `unverified`，实现轮须实核「写面是否已在 VSC 可用」以定缺口边界）。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 补两工具入 VSC 基础集**（经核 `ledger.mjs` **动态** import 追加，形态照核 `tools/index.mjs:61`） | VSC `src/agent/setup.mjs`（482）或 `src/tools/index.mjs`（187）+ 用例档 | 低（~10 行 + 1 用例档） | 中——`node:sqlite` 静态闭包红线（W8 契约②；`thincoder-vscode/test/engine-floor-guard.test.mjs` 静态闭包扫描）；两档均逼近 500 硬限（见 §2.11） | 高 |
| **② 端自持查询面**（VSC 另写一份） | VSC 1 新档 + 用例 | 中 | 高——第二份实现（违 D2 单源；且台账 SQLite 面已在核） | 中 |
| **③ 登记保留 + 文案告知** | 文档面 + 提示文案 | 零 | 高（模型端能力面不等；VSC 内自查台账不可达） | 最高 |

**推荐 = ①**。理由：机制与数据面**已在核单源**（`ledger-cmd.mjs` 两工具本就为「全角色面」设计，`:107` 注释即点名接线去向），端侧只是未挂；与 `AGENT-LOOP.md:414`（#83 自持工具登记面）已落的「VSC 经核登记册取工具」先例同向，无新增语义。

**与两条端差裁定的关系**：本项**不在** 09-12 的 A 登记面（A 面 = 已裁「各自保留」的同源机制差异）；它属 CORE-UNIFICATION 工具面归一（`docs/core/design/TOOLS.md` §6.11 端差行 / §1 归属表）**未接线**的残留 ⇒ 归 09-19「该消的差」。③ 若取，须补一条**能力面例外**的显式理由（A9 允许端特有的判据 = 结构性不对称 + 证据；本项 VSC 无结构性不对称——它有 SQLite 依赖能力，`ledger-surface.mjs` 已在用核 `ledger.mjs`）⇒ ③ 事实上不成立，本席不建议。

### 2.7 #123② 权限 / 审批四处实现（核那份孤儿）

**现状**（实核）：**核** `thincoder-core/permission.mjs`（80 行 · `summarize:18` · `formatPermission:25` · `askPermission:60`，展示面经 `io.ask` 注入缝，`:62-64`）——全仓 grep `permission.mjs`：**零 importer**（命中仅本档头注 + 同名不同物的 `child-permission.mjs`）⇒ **孤儿**。
**CLI** 实走 = `thincoder-cli/src/cli/permission.mjs:34 askPermission`（消费 `bin/thincoder.mjs:27` import · `:217` 接线 `onPermissionRequest`；`src/cli/distill-command.mjs:80` 另引）+ TUI 面 = `thincoder-cli/src/tui/interaction.mjs:58 askPermission`（`:132` 导出，`src/tui/index.mjs:387/426` 注入）。
**VSC** = `thincoder-vscode/src/extension/permission-gate.mjs`（110 行 · `:30` / `:46` / `:87`）+ 面板询问链；**子代理权限通道** = 核 `agent-tools/child-permission.mjs`（**已被两端消费**：`thincoder-vscode/src/extension/panel-callbacks.mjs:22` · 核 `agent-tools/subagent-actions.mjs:437/449`）⇒ 该面已归一，不属本项。
⇒ 真分叉 = 「闸语义 + 每工具请示文案」三份（核孤儿 / CLI 两份）+ VSC 面板门一份。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 核那份作单一权威、两端消费** | CLI `src/cli/permission.mjs` + `src/tui/interaction.mjs`（134）· VSC `permission-gate.mjs`（110）· 用例 | 中（3 档 + 用例） | 中——CLI TTY 文案须**逐字保**（`[allow?]` / `[deny]` / 非交互默认拒绝），VSC 面板卡形态经 `io.ask` 保 | 高 |
| **② 判端差保留**（核那份删 / 或两端各持） | 若「删核那份」⇒ **删除须另裁**（核档在册、`CORE-UNIFICATION.md:1090` §2.8.1 有行数登记） | 中（删除面 + 文档面） | 高——与已裁 #165 相抵 | 中 |
| **③ 登记不动** | 文档面（登记「四份实现」事实） | 低 | 中——任一改动只落一处即端间行为漂移（台账原判） | 最高 |

**推荐 = ①**。理由：核那份**就是**已裁 #165 的落点（`CORE-UNIFICATION.md:1283` §2.13.3「`io.ask`（权限展示面）→ `thincoder-core/permission.mjs:52-64`，端装配层」· `docs/core/design/AGENT-LOOP.md:59` #165/`:159`）——「孤儿」= **端侧接线未落**，而非有意端差；归一不改用户可见形态（TTY 问答 vs 面板卡已由缝承载）。

**与两条端差裁定的关系**：属 09-19「该消的差」（裁了未落）；**不属** 09-12 的 A（A 的「各自保留」不适用已裁依 CLI 为准的面）。取 ② 须显式撤回 #165；「删核那份」另需一次删除裁定（本席只报不代裁）。

### 2.8 #123③ 核挂起状态机零产品消费者

**现状**（实核）：核 `thincoder-core/agent/suspension.mjs:154 startSuspension`（241 行；等待单点 + `hooks` 注入缝 `:155`）——**唯一消费者 = 核测** `thincoder-core/test/suspension.test.mjs:13/40/54/…`（grep 全仓 `startSuspension` 命中仅核档 + 核测）。
两端各一份**已分叉**的驱动：CLI `thincoder-cli/src/tui/suspension-drive.mjs`（317 行 · `suspensionSession:191`）· VSC `thincoder-vscode/src/extension/suspension.mjs`（408 行 · `suspensionSession:227`；另有 digest 可见面 / 存活投影 `:140-159` / 心跳 / 终止冻结 `:404-406`）。
⇒ 文档面仍以「核状态机 = 挂起面权威」叙述（`AGENT-LOOP.md:72-73` · `CORE-UNIFICATION.md:1094` · `AGENT-LOOP-SUBAGENT.md:1443`），而「无生产消费者」的事实**已显式陈述于 `docs/core/design/AGENT-LOOP-SUBAGENT.md:1446`**（「核驱动现状 = 无生产消费方」）——未收正的是该句后半的**计划面**陈述（「本批改动面 = 核 + CLI + VSC 三面」，与本批 §2.21「判保留 + 核降参考」相反）。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 两端驱动接核状态机** | CLI 1 档 + VSC 1 档 + 双夹具 | 高（两驱动均承载大量端特有可见面） | 高——与 **P1 显示面批（正在动 VSC 驱动，台账 #124/#125 家族）**改动面正面相撞 | 低 |
| **② 判「两份保留 + 核状态机降为参考」并同步设计档** | 文档面 2–3 档（`AGENT-LOOP.md` §2.3 / `AGENT-LOOP-SUBAGENT.md` §6.27.12.3 三端表 / `CORE-UNIFICATION.md` §2.8.1 注） | 低（零产品码） | 低 | 高 |
| **③ 收核那份（删 `startSuspension`）** | 核 1 档 + 核测 1 档 | 中 | 中——**删除须另裁**；且核档现有「端差注入位」登记面（`CORE-UNIFICATION.md:1288`）随之失效 | 中 |

**推荐 = ②**（本批**不动两端驱动**），并把「核状态机是否收核 / 删除」立为独立议题另批。理由：核状态机无生产消费者 + 两端已分叉 + 两端驱动均承载端特有可见面（VSC 侧正在被 P1 批触碰）⇒ 现在收口会把两批改动面撞在一起；② 的收益 = 消掉「核已有单源」的**误读**（误读会导致实现轮按核档改而两端不见效）。

**与两条端差裁定的关系**：② 正是 09-12 A 的形态（登记共存）；与 09-19「消差」的关系须显式说明——本项属**结构不对称**（两端驱动各有端特有可见面 / 宿主能力），A9 判据下可合法判保留；③ 则是「该消的差」的另一读法，但删除面须另裁。**两条裁定均不单独决定本项**——需用户在本轮显式选定。

### 2.9 #123④ 同族事件载荷字段集两端不同构（`⟦ev⟧queued`）

**现状**（实核）：**发射面 = 核单点** `thincoder-core/agent-tools/subagent-scheduler.mjs:171-176`——返回 `{ kind ∈ {depc, wait, slot}, detail }`（域冲突细节 `:159-166` 拼进 detail；`:176` 仅无依赖、无域冲突时 `kind:"slot"`）。
**CLI 消费** = `thincoder-cli/src/tui/subagent-panel.mjs:73`（`kind === "slot" ? "queued" : "waiting"`）+ `:98-101`（wait / depc 打 detail 原文；slot 打「queued · position N（槽满等位）」）。
**VSC 消费** = 中继 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:94-108`（映射表实位——`kind` → `waiting ∈ {null, "waiting-deps", "dependency-cancelled"}` + `reason`；四项入缓存 `:107`）+ webview `thincoder-vscode/webview/activity-view.js:79-80`（`reason` 空 ⇒ 回退 `t("sub.queueSlot")`）。
⇒ 载荷**不同构**：CLI 保 `kind` + detail（文本渲染）；VSC 归一为 `waiting` + `reason`（结构化消息）。**已发生的实害实例 = #118**（挂起重绘只发 `position` ⇒ 域冲突被印成「槽满等位」），正由一致性同步批处置。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 载荷字段同构**（一端改形使两端同形） | 核发射面 + 一端消费面 + 端口协议档 | 高 | 高——输入端承载形态差异（文本 token ∥ 结构化消息）**已裁为保留面**（`CORE-UNIFICATION.md:1209` §2.12.3：「归一的是语义，不是承载形态」）⇒ ① 与既裁相抵 | 中 |
| **② 两端各自归一 + 双改纪律入档 + 机检锚** | `docs/core/design/AGENT-LOOP.md` §6.18 一行 + VSC 用例（relay 映射表逐 `kind` 断言） | 低（文档 + 1 用例档） | 低 | 高 |
| **③ 登记不动** | — | 零 | 中（新增/改核事件时漏改一端 ⇒ 单端静默；今日已发生一次） | 最高 |

**推荐 = ②**。理由：可消的不是字段形态（已裁保留），而是**漏改风险**——把它写成纪律行 + 机检锚（现状中继映射表**无对位断言**，实核 VSC 用例族无 `queued` 载荷断言）。

**与两条端差裁定的关系**：② = 09-12 A 的形态，并**划清**「该消的差」= #118 那类**字段丢失**（真缺陷，已归另一批），而**字段命名/承载形态差异**属已裁保留。

### 2.10 #123⑤ `ContinueError` 双类

**现状**（实核）：核 `thincoder-core/agent/helpers.mjs:205`（`this.name = "ContinueError"` `:208`）· VSC `thincoder-vscode/src/agent.mjs:43`。
消费面**逐点实核**：核类 = 核 `agent.mjs:419` 抛 · 核 `spawn-child.mjs:237`（`e instanceof ContinueError` 守卫）· CLI `src/tui/agent-turn.mjs:17/182` · `bin/thincoder.mjs:227`（按 `error.name` 判，类无关）· 核测；VSC 类 = VSC `agent.mjs:467` 抛 · VSC `run-stages.mjs:38/317/342/366` · `panel-turn-loop.mjs:17/105` · VSC 测。
**关键实核（台账陈述须降级）**：VSC 的 **depth>0 子代走核循环**（`subagent-async.mjs:16-20` import 核 `runAgent`），⇒ 子代一律抛**核类**；VSC 类只服务 **depth-0 端壳循环**（`thincoder-vscode/src/agent.mjs:53` 签名 `(provider, cwd, ...)` ≠ 核 `(agent, input, ...)`）。**今日无活跨域失配路径**——台账「潜在 `instanceof` 失配」应读作**潜在**（触发条件 = 端壳循环向核收口 / 核管线收到端抛错 / 新增跨域消费点），不是现行缺陷。

| 选项 | 改动面 | 代价 | 风险 | 可逆性 |
|---|---|---|---|---|
| **① 单一类**（核导出，VSC 引 / re-export） | VSC `src/agent.mjs`（484 · 删类定义改转口）+ VSC 2 档 import 面 + 结构机检 | 低 | 低（须实核核 `helpers.mjs` 是否进 VSC 静态闭包——W8 契约②；`run-stages.mjs:27` 已记核链可达性面） | 高 |
| **② 登记不动** | 文档面（`#127` 同形重复族一行） | 零 | 低（今日各在自域一致） | 最高 |

**推荐 = ①**（低成本消潜在失配）；**若本批不动产品码则 ② 可接受**，但须把「端壳循环向核收口」登记为 ① 的前置失效条件。

**与两条端差裁定的关系**：本项**不是端差**（两端行为无差异），是**同物两份**（`#127` 同形重复族已登记）⇒ 09-12 A 的「各自保留、互不追赶」**不适用**（其对象是两端差异）；属 09-19「该消的差」的可选项，但无用户可见收益——纯结构治理。

### 2.11 受影响文件面清单（仅列面 + 越线判定 · 不含实现定稿）

> 判据 = 项目约定「≤300 咨询线 / ≤500 硬限」（`AGENTS.md`）；行数 = 2026-09-20 本轮实核。

| 组（对应项） | 档 | 现行数 | 预估 Δ | 越线判定 |
|---|---|---|---|---|
| A（§2.3 / §2.4 / §2.5） | `thincoder-vscode/src/agent/run-stages.mjs` | 378 | +15~25 | >300 咨询线、≤500 硬限 ✓ |
| A | `thincoder-vscode/src/agent/execute-tools.mjs` | 394 | +10~15 | 同上 ✓ |
| A + §2.10 | `thincoder-vscode/src/agent.mjs` | 484 | ±0~+5 | **距 500 硬限 13 行**——若触 ≥490 须启用既有拆分计划（域文本常量族已外提 `src/agent/turn-domains.mjs`） |
| A | VSC 测试面：hooks / 派发 hooks 用例 | — | 新增 1–2 档 | VSC 现**无** hooks 用例族（实核 glob 无命中）；参照锚 = `thincoder-cli/test/hooks-stop.test.mjs`（256） |
| B（§2.6） | `thincoder-vscode/src/agent/setup.mjs` 或 `src/tools/index.mjs` | 482 / 187 | +5~10 | 前者 >300、≤500 ✓；后者 <300 ✓ |
| B | VSC 用例（ledger 查询工具面） | 新增段 | — | 落点候选 = `thincoder-vscode/test/ledger.test.mjs`（249，现为可见面用例） |
| C（§2.7） | `thincoder-cli/src/cli/permission.mjs` · `src/tui/interaction.mjs` · `thincoder-vscode/src/extension/permission-gate.mjs` · 核 `thincoder-core/permission.mjs` | 49 / 134 / 110 / 80 | 小（改接线） | 全部 <300 ✓；用例面 = CLI `interaction` 面 / VSC `child-permission*.test.mjs`（368 / 109） |
| D（§2.8） | 文档面：`docs/core/design/AGENT-LOOP.md`（553）· `AGENT-LOOP-SUBAGENT.md`（1964）· `CORE-UNIFICATION.md`（1923） | — | 文档 | 产品码**零改**（推荐 ②） |
| E（§2.9） | `thincoder-vscode/src/extension/panel-subagent-relay.mjs`（**245**——2026-09-20 实读；映射表 `:94-108`）+ 用例 + 设计档 1 行 | — | 文档 + 用途例 | <300 ✓ |
| F（§2.10） | `thincoder-vscode/src/agent.mjs`（同 A 行）+ 核 `thincoder-core/agent/helpers.mjs`（392，零改） | — | 小 | 见 A 行判定 |

**总判定**：**零新增越 500 硬限档**；三档在 300–500 区间（`run-stages` / `execute-tools` / `agent.mjs`）；`agent.mjs` 为唯一贴线档 —— 若 §2.3②与 §2.10① 同批落地，须先执行该档拆分（触发条件已在 `docs/vsc/design/VSC-DEBT.md` §12.1 登记为「净增越 490 或下次触碰」）。

### 2.12 不一致处（A4 · 附证据 · 只报不动）

1. **读数不一致（计数面）**：台账 #123① 述「VSC 自持清单 **27 项**」∥ 本轮实核 `thincoder-vscode/src/tools/index.mjs:172-186` = **30 项**（逐名计数：read/write/edit/insertAfter/applyPatch/hashlineEdit/lint/ls/delete/glob/grep/bash/git/websearch/fetch/question/repoOutline/codeSearch/docSearch/lsp/execute/memory/context/focus/fileOps/process/getCurrentTime/waitFor/tree/peerInstances）。**口径未明**（疑似旧读数或排除 `context`/`focus`/`peerInstances` 等宿主 / 端特有项）——台账写域 = 主 agent，**本席不改**。
2. **风险陈述须降级**：台账 #123⑤「潜在 `instanceof` 失配」∥ 实核**今日无活跨域路径**（VSC depth>0 走核循环 ⇒ 核类；VSC 类只服务 depth-0 端壳循环）。按原文读会高估本项优先级（详见 §2.10）。
3. **坐标不全（非错）**：台账 #122③ 仅给 VSC `src/agent.mjs:27`；实核另有 `src/agent/run-stages.mjs:278/366-369` · `src/extension/panel-turn-loop.mjs:63-64/82` · `src/agent.mjs:120`（§2.5 已补全）。
4. **选项骨架漏面（发现）**：§1.1 #122② 的三案未含「VSC depth-0 派发前置门族（`tool-gates.mjs` 166 行：planMode 门 / 批权限聚合 / 端只读分类）**核内无对位**」——若选「向核收口」，须先把门族归位（改动面估算须上调）。本席已在本行标注（§2.4 ① 行）。
5. **文档面登记缺口（非矛盾）**：核 `permission.mjs`（已裁 #165 的落点）与核 `agent/suspension.mjs`（已裁 #184 的落点）均**无生产消费者**，而设计档仍以「核内落点 = 权威」叙述（`CORE-UNIFICATION.md:1090/1288/1094` · `AGENT-LOOP.md:59/72-73/159`）——缺一条「核内落点已落、端侧接线未落」的**现态陈述**。属文档面欠账，建议随裁定结果同轮落笔。
6. **正面核对项（无异常）**：`docs/core/design/AGENT-LOOP.md:20` 表「hooks → `src/hooks.mjs` → —（零 `runHooks`）」与实核一致 ✓；`:61`（#169）「VSC 侧零 `runHooks`」与实核一致 ✓。

### 2.13 本档边界（不做什么）

- 不给实现设计定稿（用户裁定前）；不写产品码；不改需求档与他批写域；不代裁删除类动作（§2.7 ② / §2.8 ③）。
- 不并入纯显示面（P1）与文档过期登记（P3）。
- 池上限 / 调度语义不在本档。

### 2.14 变更记录

- 2026-09-20：建档——8 项裁定书（#122①–③ / #123①–⑤），逐项含现状 / 2–3 选项 / 推荐 / 代价 / 风险 / 可逆性 / 与 2026-09-12 与 2026-09-19 两条端差裁定的关系；附文件面清单（越线判定）与 6 条不一致项。

### 2.15 实施设计（裁后轮 · 总述与实施分批）

**轮次** = initial（批准后首轮）。**依据** = 用户 2026-09-20 05:15「都按建议」——§2.3–§2.10 八项**推荐方向全部定案**（本轮不再开选项，不重开方案）。**产出** = 八项可实施设计（逐项：落点 file:line + 可照抄改法 + 逐条机检验收 + 边界/降级）+ 受影响文件表（含现盘行数与越线判定）+ 实施分批 + 验收命令清单。

**本轮实核口径**：全表坐标 = 2026-09-20 本席逐处实读；行数 = `find /c /v ""` 口径（现盘）。**W8 契约② 判据** = 本席自跑静态闭包（算法与 `thincoder-vscode/test/engine-floor-guard.test.mjs:101-127` 同源，注释先剥离、动态 `import()` 不入闭包）——读数：`thincoder-vscode/extension.mjs` 闭包 **168 档** · 零 `node:sqlite` · 零不可解析裸包；候选模块逐档——`@thincoder/core/hooks.mjs`（1 档 · 仅 `node:child_process`）· `@thincoder/core/agent/helpers.mjs`（8 档 · 无 sqlite，**且已在端壳闭包内**）· `@thincoder/core/permission.mjs`（1 档 · 仅 `node:readline`）⇒ 三者**静态 import 合法**；`@thincoder/core/ledger.mjs`（11 档）· `@thincoder/core/agent-tools/advisor-async.mjs`（125 档）⇒ **静态链达 `node:sqlite`，只能动态 import**。

**实施分批**（三车道 · 文件域互不相交）：

| 车道 | 内容 | 文件域 | 执行 |
|---|---|---|---|
| **1 · 核 + CLI** | §2.18 核半（guard 快照/恢复单点）· §2.20 CLI 半（转口 + TUI 缝）| `thincoder-core/agent/helpers.mjs` · `thincoder-core/agent/run-stages.mjs` · `thincoder-core/agent.mjs` · `thincoder-cli/src/cli/permission.mjs` · `thincoder-cli/src/tui/interaction.mjs` + CLI 用例 | eng-coder（designToken）|
| **2 · VSC** | §2.16 / §2.17 / §2.18 端半 / §2.19 / §2.20 VSC 半 / §2.23 + 新增用例档（须登记 `thincoder-vscode/test/files.mjs`）| `thincoder-vscode/src/**` · `thincoder-vscode/test/**` | eng-coder（designToken）|
| **3 · 设计档** | §2.21 三档同步 · §2.22 纪律行 · §2.16–§2.20/§2.23 各「设计档落点」行（含 `TOOLS.md` §6.11——§2.17 / §2.19 落点行）· `AGENT-LOOP.md` as-of 行（`:550`）按现盘刷新（§2.29-#9） | `docs/core/design/AGENT-LOOP.md` · `docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/design/CORE-UNIFICATION.md` · `docs/core/design/TOOLS.md` · `docs/vsc/design/VSC-DEBT.md` | **本席（eng-designer 笔）** —— **自查：已落**（2026-09-20 · 逐项落点表 + 收正表见 §2.30） |

**依赖与并行**：车道 1 ∥ 车道 3 可同轮并行；**车道 2 待车道 1 的 `snapshotGuard`/`restoreGuard` 导出落盘后启动**（否则端半 import 不存在符号）。车道 2 内 `thincoder-vscode/src/agent.mjs` 被 §2.18 端半与 §2.23 同时触碰 ⇒ 同 spawn 内串行落笔，不另开并行支。**测试档登记面**：VSC = 显式清单 `test/files.mjs`（未登记 = 不跑——`test/run.mjs:51-56` fail-closed）；CLI = 两层 glob（`test/*.test.mjs` 自动收集，无需登记）。

**本批不动面**：纯显示面（P1）· 文档过期登记（P3）· 需求档（父侧笔）· 他批写域 · VSC 派发前置门族 `thincoder-vscode/src/agent/tool-gates.mjs`（166 行——§2.17 不采「向核收口」方案，门族零改）。

### 2.16 #122① 端侧补齐 Stop 钩子 + advisor-run 收口（定案 = §2.3 方案②）

**三段语义落点判定**：① Stop 钩子——**新增**（端侧）② `flushPeerDomains` 对位——**已在位**：端侧 `flushDomains(cwd)`（`thincoder-vscode/src/agent/run-stages.mjs:374-376`）写同一 `~/.thincoder/peers/{sessionId}.json`、同形载荷（`{sessionId, pid, end, cwd, domains, updatedAt}`），与核 `thincoder-core/peer-domains.mjs:248 flushPeerDomains` 同族同目的——**零改** ③ advisor-run 收口——**新增**（端侧）。

**增量发现（本席实核 · 决定改动面上调）**：VSC 的 `agent.config` 由 `thincoder-vscode/src/agent/agent-state.mjs:96-107` **整建**（只含 advisor / agent / proxy / shell / providersList / websearch / traces 七段）——**`hooks` 段不在内**；`thincoder-vscode/src/**` grep `hooks` **零命中**。而 `runHooks` 读 `ctx.agent?.config?.hooks?.[event]`（`thincoder-core/hooks.mjs:28`）⇒ **只补调用点不补配置面 = 钩子恒空转**。故本项 = 三档：调用点（run-stages）+ 读取（setup）+ 落 config（agent-state）。

**改法（可照抄）**：

1. `thincoder-vscode/src/agent/run-stages.mjs`（377 行）—— import 面增：`import { runHooks } from "@thincoder/core/hooks.mjs"`（静态合法——§2.15 闭包读数）。`finalizeAgentTurn` 首部（现 `:284` 咨询清理块之前）插入：

```js
  // 第 30 批 D1（Stop 钩子——核 `thincoder-core/agent/run-stages.mjs:135-144` 同语义）：
  // 主会话 run 终止 → fire-and-forget（非阻塞 / 失败静默）；排除用户中止与 AbortError 展开。
  // 轮号载荷 = 端壳 `_turnSeq`（链内累计轮号）——与核 `_currentTurn` **同口径**：核由帧赋值
  // `agent._currentTurn = frame.turn`、`turnFrame().turn` = 链内累计 `seq`（载荷表 =
  // `docs/core/design/AGENT-LOOP.md` §6.13）。
  if (depth === 0 && !signal?.aborted && thrownError?.name !== "AbortError") {
    runHooks("Stop", {
      agent,
      error: thrownError && !(thrownError instanceof ContinueError) ? thrownError : undefined,
      extra: {
        turn: agent._turnSeq ?? 0,
        reason: thrownError instanceof ContinueError ? "maxTurns" : thrownError ? "error" : "done",
      },
    }).catch(() => {})
  }
```

2. 同档 —— advisor-run 收口：`advMap` 块（`:333-356`）前声明 `let injectedAdvisor = false`；`suspDriven !== true` 注入支（`:347-354`）每注入一条置 `injectedAdvisor = true`；块后（`:356` 之后）插入：

```js
  // §11.2 D-24b（核 `run-stages.mjs:192-195` 同语义）：正常结束且本回合未注入 settled 评审
  // 报告 ⇒ 关闭 OPEN code 评审实例（自动回合豁免——其消化先于修复轮）。动态 import：核
  // advisor-async 链静态达 `node:sqlite`（W8 契约②——本席实核 125 档闭包含该 builtin）。
  if (!autoTurn && !injectedAdvisor && !(signal?.aborted && !signal?.reason?.interrupt) && !(thrownError instanceof ContinueError)) {
    const { closeOpenCodeAdvisorRuns } = await import("@thincoder/core/agent-tools/advisor-async.mjs")
    closeOpenCodeAdvisorRuns(agent)
  }
```

3. `thincoder-vscode/src/agent/setup.mjs`（481 行）—— 配置读取块（`:212-233`）：`let cfgHooks = null`（与 `cfgTraces` 同段声明）+ `cfgHooks = raw.hooks ?? null`（try 内，与 `cfgWebsearch` 同段）；`cfgBag`（`:243-254`）增 `hooks: cfgHooks,`。

4. `thincoder-vscode/src/agent/agent-state.mjs`（147 行）—— `agent.config` 字面量（`:96-107`）增 `hooks: cfg.hooks ?? null,`。

**验收（机检 · 全 ASCII · cmd.exe）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"@thincoder/core/hooks.mjs" thincoder-vscode\src\agent\run-stages.mjs` | ≥1（改前 0） |
| 2 | `findstr /c:"closeOpenCodeAdvisorRuns" thincoder-vscode\src\agent\run-stages.mjs` | 2（import 行 + 调用行——语义 = **恰一个调用点**；2026-09-20 实测收正，见 §5 车道 2 上抛 ③） |
| 3 | `findstr /c:"raw.hooks" thincoder-vscode\src\agent\setup.mjs` | 1 |
| 4 | `findstr /c:"hooks:" thincoder-vscode\src\agent\agent-state.mjs` | 1 |
| 5 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/lifecycle-hooks.test.mjs` | exit 0（新档——见下用例表） |
| 6 | `cd /d D:\teamcode\thincoder\thincoder-vscode && npm test` | exit 0（全量回归——含 engine-floor-guard 结构机检） |

**用例表（新档 `thincoder-vscode/test/lifecycle-hooks.test.mjs`——须登记 `test/files.mjs`）**：假 hook 脚本 = 运行期 tmpdir 生成（`command: process.execPath`——免 PATH/Windows 差异，照 `thincoder-cli/test/hooks-stop.test.mjs:30-54` 技法）。

| # | 输入 | 期望输出 |
|---|---|---|
| T-LH1 正常 | `finalizeAgentTurn(agent, ctx)`，ctx = `{depth:0, signal:未中止, thrownError:null}`，config.hooks.Stop = 假脚本 | 脚本收到 payload；`event==="Stop"`、`extra.reason==="done"`、`extra.turn` = `agent._turnSeq` |
| T-LH2 maxTurns | ctx.thrownError = `new ContinueError(5)` | `reason==="maxTurns"`；payload `error === null` |
| T-LH3 error | ctx.thrownError = `new Error("x")` | `reason==="error"`；payload `error` = "x" |
| T-LH4 中止 | ctx.signal = 已中止 | 脚本零调用（无 payload） |
| T-LH5 AbortError | ctx.thrownError.name = "AbortError" | 脚本零调用 |
| T-LH6 depth>0 | ctx.depth = 1 | 脚本零调用 |
| T-LH7 非阻塞 | 假脚本 = 写到达标记（含 `pid`）后 `await new Promise(() => {})`（**永不 resolve** ⇒ 进程存活；零墙钟计时） | `await finalizeAgentTurn(...)` 正常返回 ∧ 返回后到达标记在场 ∧ 该 `pid` 仍存活（`process.kill(pid, 0)` 不抛）⇒ 判「未 await 钩子」（若实现侧 await 则用例挂死 = 失败）；尾部 `process.kill(pid)` 清理。就绪等待 = 轮询到达标记（上限 2s——**就绪判据，非断言面**） |
| T-LH8 advisor 收口 | advisor 池空 + 存在 open code 实例 + `autoTurn:false` | 实例 `open → false`（`closeOpenCodeAdvisorRuns` 被调）；`autoTurn:true` ⇒ 不关 |
| T-LH9 池非空豁免 | advisor 池有条目 | 实例保持 open（核内建守卫） |

**边界 / 降级**：① Stop 钩子 = 外部副作用面（用户脚本）——归一后 VSC 开始触发，与 `docs/core/design/AGENT-LOOP.md:141` A23 行「① 归一后 VSC 侧是否开始触发 Stop 钩子（外部副作用）」一致（该行已裁「按建议」）；失败静默 + 非阻塞 = 核同语义 ② 轮号载荷：核 `_currentTurn` ∥ 端 `_turnSeq` ——**同口径**（皆链内累计轮号；核 `thincoder-core/agent.mjs:209` ← `turnFrame().turn` = `seq`，`thincoder-core/agent/helpers.mjs:221-223`）；实现侧取 `agent._turnSeq ?? 0`，不新增端字段 ③ 子代理（depth>0）不触发端侧 Stop（VSC 子代走核循环 ⇒ 钩子由核面触发，无双重触发）④ 端侧 `flushDomains` 的调用位（函数尾、`try/catch` 内）与核（函数首、无 try）次序不同——**不在本项改动面**（语义 = 无写入回合跳过 + 失败容忍，同核），登记为观察项 ⑤ L3 登记实现仍是两份（核 `peer-domains.mjs` ∥ 端 `extension/peer-domains.mjs`）——不在本批八项内，报告项（§2.27）。

**设计档落点（车道 3）**：`AGENT-LOOP.md` §6.13（`:298`）增端侧触发面句（VSC 同源触发 + 轮号句：两端 `turn` 同为链内累计轮号，与同节载荷表 `:336` 一致）；§6.18 表（`:403` 起）增一行「生命周期钩子面（Stop / 派发四事件）」；§2.2 A23 行（`:141`）「VSC 全仓零 `runHooks`」按现态改述为端侧接线事实 + 指针本档 §2.16。

### 2.17 #122② 派发面 hooks 四调用点（定案 = §2.4 方案②）

**「阻断后工具结果形态」两端口径（定案 · 已实核）**：核阻断 ⇒ 模型可见结果 = **`Error: blocked by PreToolUse hook`**（逐字 = `thincoder-core/agent/dispatch.mjs:337-338`，`reason === "blocked by PreToolUse hook"` 分支）、调用未执行、记为失败结果。VSC 同形 = 返回 `{ tool_call_id: tc.id, toolName, content: "Error: blocked by PreToolUse hook", meta: null }`（`meta: null` ⇒ 不入变更/停滞记账——与核 denied 早退同口径；核阻断路径不落 `tool:call` 事件，VSC 同样落在此前 ⇒ 一致）。

**改法（可照抄 · `thincoder-vscode/src/agent/execute-tools.mjs` 393 行）**：import 面增 `import { runHooks } from "@thincoder/core/hooks.mjs"`（静态合法）。四处：

1. **PreToolUse**（单点覆盖 readonly + 已批非 readonly 两路——核 `dispatch.mjs:258`/`:314` 两端点在此合流）：插在权限块结束（`:169` `}`）之后、`callbacks.onToolCall?.`（`:171`）之前：

```js
      // PreToolUse hooks（核 `dispatch.mjs:258/314` 同语义）：用户脚本可拦截工具执行；
      // 阻断 ⇒ 工具不执行 + 模型可见结果**逐字**同核（`dispatch.mjs:337-338`）。
      if (!(await runHooks("PreToolUse", { agent, toolName, toolArgs: args }))) {
        return { tool_call_id: tc.id, toolName, content: "Error: blocked by PreToolUse hook", meta: null }
      }
```

2. **PostToolUse**（fire-and-forget）：插在 L3 记账块（`:249-256`）之后、多模态分支（`:258`）之前：

```js
          // PostToolUse hooks（核 `dispatch.mjs:443` 同语义——fire-and-forget；载荷 result = 原始结果）
          runHooks("PostToolUse", { agent, toolName, toolArgs: args, result: raw }).catch(() => {})
```

3. **PostToolUseFailure**：插在 `logEvent("tool:error", …)`（`:274`）之后（核 `dispatch.mjs:456-457` 同序——中止先于事件、中止不落钩子）：

```js
          // PostToolUseFailure hooks（核 `dispatch.mjs:457` 同语义）——中止路径已在上行 throw 排除
          runHooks("PostToolUseFailure", { agent, toolName, toolArgs: args, error: e }).catch(() => {})
```

4. **未知工具 / 前置门禁阻断路径不触发**（核同——`:258/:314` 只在两类 prepared 项上；未知工具与 planMode 早退在核 Phase 1 更前）：VSC 的 `preGateBlocked` 早退（`:100-102`）与 `!tool` 路径（`:188-189`）保持零钩子。

**验收（机检 · 全 ASCII）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"blocked by PreToolUse hook" thincoder-vscode\src\agent\execute-tools.mjs` | 1（逐字文案在位） |
| 2 | `findstr /c:"PostToolUseFailure" thincoder-vscode\src\agent\execute-tools.mjs` | 1 |
| 3 | `findstr /c:"runHooks" thincoder-vscode\src\agent\execute-tools.mjs` | ≥4（下界；**含 import 行实命中 5 行** = 四调用点 + import） |
| 4 | 新档用例（下用例表）| exit 0 |

**用例表（新档 `thincoder-vscode/test/dispatch-hooks.test.mjs`——须登记 `test/files.mjs`；驱动 `executeToolBatches` 直调，桩 callbacks/agent）**：

| # | 输入 | 期望输出 |
|---|---|---|
| T-DH1 PreToolUse 放行 | 假 hook 退出码 0 | 工具执行；钩子收到 `{event:"PreToolUse", toolName, toolArgs}` |
| T-DH2 PreToolUse 阻断 | hook `action:"block"` + 非零退出 | 工具**未执行**；模型可见 `content === "Error: blocked by PreToolUse hook"`；`meta === null` |
| T-DH3 readonly 工具同测 | 只读工具（不过权限块）| 钩子仍被调用（T-DH1/2 同判） |
| T-DH4 PostToolUse | 执行成功 | 钩子收到 `result` = 原始结果（非 offload 后文本） |
| T-DH5 PostToolUseFailure | 工具 throw | 钩子收到 `error`；结果 = `Error: …`（成功钩子不触发） |
| T-DH6 中止不落钩子 | `signal.aborted` | 工具不执行、零钩子调用 |
| T-DH7 前置门禁 | planMode 命中 | 零钩子调用（planMode 结果原样） |

**边界 / 降级**：① 子代理侧 hooks 由核循环承载（VSC depth>0 走核 —— `thincoder-core/agent-tools/subagent-async.mjs:16-20`）⇒ 本项只补 depth-0 主会话缺口，无双重触发 ② PostToolUse 位序：核 = `onToolResult` 之后；端 = `onToolResult`（结果循环 `:305-308`）之前（同成功路径内）——钩子为 fire-and-forget 外部进程且载荷同构，不构成可观察差异（登记于此）③ `PreToolUse` 在 VSC 对「批权限已 approveAll」项同样触发（核 `:313-317` 同） ④ 未采「VSC 派发改调核 dispatch」——门族 `tool-gates.mjs` 核内无对位（上轮 §2.12-④ 已登记），收口面另立。

**设计档落点（车道 3）**：`AGENT-LOOP.md` §6.18 表同 §2.16 行（钩子面 = Stop + 派发四事件，一行承载）；`TOOLS.md` §6.11 端差行补端侧接线事实句（工具面）。

### 2.18 #122③ guard 快照 / 恢复单点（定案 = §2.5 方案② · 清单归核 · 载体留端）

**改法（可照抄）**：

1. `thincoder-core/agent/helpers.mjs`（391 行 · 已在 `SOFT_LINE_REGISTRY` 在册）—— `ContinueError`（`:205-211`）之后新增：

```js
/** §17 D-S6 auto-turn guard 标记集（核内单源）：快照/回填两 helper 共用本清单——
 *  端侧宿主载体（`panel._guardCarry`）与核载体（`agent._inheritedGuard`）同清单。 */
export const INHERITED_GUARD_KEYS = [
  "_mutatedThisRun", "_verifiedThisRun", "_verifyPassed", "_calledAdvisorThisRun",
  "_touchedFiles", "_verifyRetries", "_advisorRound",
]

/** 写侧单点：快照 7 键 → 纯对象（载体形态由调用方决定——核 = agent 字段 / 端 = 宿主容器）。 */
export function snapshotGuard(agent) {
  const snap = {}
  for (const k of INHERITED_GUARD_KEYS) snap[k] = agent[k]
  return snap
}

/** 读侧单点：回填快照中**存在**的键（`in` 守卫——等价核现行读侧；端侧快照恒含全键 ⇒
 *  等价现行无条件拷贝）。载体留端（target 由调用方给）。 */
export function restoreGuard(target, snap) {
  if (!snap) return
  for (const k of INHERITED_GUARD_KEYS) if (k in snap) target[k] = snap[k]
}
```

2. `thincoder-core/agent/run-stages.mjs`（248 行）—— `:201-208` 内联字面量替换为 `agent._inheritedGuard = snapshotGuard(agent)`（helpers import `:11` 增两符号）。`thincoder-core/agent.mjs`（429 行）—— `:146-149` 内联数组循环替换为 `restoreGuard(agent, g)`（import 面增）。

3. `thincoder-vscode/src/agent/run-stages.mjs` —— ① import 面 `:38` **删 `INHERITED_GUARD_KEYS`**（现行 = `import { ContinueError, INHERITED_GUARD_KEYS } from "../agent.mjs"` ⇒ 改 `import { ContinueError } from "../agent.mjs"`；`agent.mjs:27` 常量删除后不删即**模块加载期硬失败**——非法具名导入）；② import 面增 `import { restoreGuard, snapshotGuard } from "@thincoder/core/agent/helpers.mjs"`（静态合法——该档**已在端壳闭包内**，§2.15 读数）；③ `:366-370` 改 `if (guardCarry) restoreGuard(guardCarry, snapshotGuard(agent))`（载体 = `panel._guardCarry`（`src/extension/panel-turn-loop.mjs:63-64/82`）留端）。`thincoder-vscode/src/agent.mjs` —— `:27` 键清单常量删除；`:119-121` 改 `restoreGuard(agent, opts.inheritedGuard)`。（同档 `ContinueError` 符号面以 §2.23 形态为准——`:38` 该符号继续经 `../agent.mjs` 转口。）

**验收（机检 · 全 ASCII）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"export const INHERITED_GUARD_KEYS" thincoder-core\agent\helpers.mjs` | 1（核单源） |
| 2 | `findstr /c:"INHERITED_GUARD_KEYS" thincoder-vscode\src\agent.mjs thincoder-vscode\src\agent\run-stages.mjs` | 0（VSC `src/**` 该符号全退场——含 `:38` import 面；今日现盘 = 4 行命中 `agent.mjs:27/120` + `run-stages.mjs:38/368`） |
| 3 | `findstr /c:"snapshotGuard" thincoder-core\agent\run-stages.mjs thincoder-vscode\src\agent\run-stages.mjs` | ≥2（两写侧） |
| 4 | `findstr /c:"for (const k of [" thincoder-core\agent.mjs` | 0（内联数组退场——核档该形态唯一实例即 `:148`）· 正向锚 `findstr /c:"restoreGuard" thincoder-core\agent.mjs` ⇒ ≥1 |
| 5 | `cd /d D:\teamcode\thincoder\thincoder-core && npm test` | exit 0（含 core-hygiene） |
| 6 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/agent-lifecycle-singleton.test.mjs` | exit 0（该档零 guard 引用——覆盖为名义；**guard 继承回归 = `test/lifecycle-hooks.test.mjs` T-LH11**〔车道 2 补位〕——2026-09-20 实测收正） |

**边界 / 降级**：① 纯结构治理（7 键清单双份 → 单源）；语义等价（核读侧 `in` 守卫与端侧无条件拷贝在「快照恒含全键」下等价）② 载体表与端差登记（`AGENT-LOOP.md` §2.3）**零改** ③ 核 `helpers.mjs` ≈410 行（<500 硬限）④ 端 `agent.mjs` 净 −（≈483 → ≈480——距 500 余量回 20；**不触发** `VSC-DEBT.md` 拆分条件「净增越 490 / 下次触碰」）。

**设计档落点（车道 3）**：`AGENT-LOOP.md` §2.3 载体契约段补「快照/回填单点 = 核 `snapshotGuard` / `restoreGuard`；端载体 `panel._guardCarry` 留端」；`CORE-UNIFICATION.md` §2.8.1 表 `:886`（`agent/helpers.mjs | 384`）读数收正（as-of 2026-09-20 = 实施后实测）。

### 2.19 #123① VSC 基础集补 `ledger_query` / `ledger_count`（定案 = §2.6 方案①）

**缺口边界实核（销 §2.6 的 unverified 标）**：VSC **写命令已在可达面**——`thincoder-vscode/src/agent/setup.mjs:125` 动态 import 核 `assembleFamilyTools`、`:131` 以 `depth` 调用 ⇒ 核 `agent/family-tools.mjs:30`（仅 `depth === 0` 载入）+ `:142-144`（`ledgerAddTool` / `ledgerUpdateTool` / `ledgerCloseTool`）已在 VSC 主会话装配。**缺口 = 仅查询两工具**（全角色面）。

**改法（可照抄 · `thincoder-vscode/src/agent/setup.mjs` 481 行）**：

1. `hydrateRun` 内、家族装配块（`:131-141`）之后新增：

```js
  // M2 台账查询命令（核 `thincoder-core/tools/index.mjs:61` 同法——全角色面）：动态 import
  // （ledger 链静态达 `node:sqlite`——W8 契约②；本席实核 11 档闭包含该 builtin）。
  // 写命令族已随核 `assembleFamilyTools` depthOnly 分支在端可达（`:131`）。
  const { ledgerQueryTool, ledgerCountTool } = await import("@thincoder/core/ledger.mjs")
```

2. `baseTools` 计算（`:162-163`）改为：

```js
  const baseTools = [
    ...(isReadOnlyRole ? builtinTools.filter((t) => t.readonly) : builtinTools),
    ledgerQueryTool, ledgerCountTool,
  ].filter((t) => depth === 0 || t.name !== "question")
```

（两工具 `readonly: true`（核 `ledger-cmd.mjs:124/137`）——只读角色过滤天然放行；入 `baseTools` ⇒ 同时入绑定值 `baseSet`（`:169-175`）与全表 `tools`（`:176-182`）⇒ 模型面 + 子代装配面同核口径。）

**验收（机检 · 全 ASCII）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"@thincoder/core/ledger.mjs" thincoder-vscode\src\agent\setup.mjs` | 1 |
| 2 | `findstr /c:"ledgerQueryTool" thincoder-vscode\src\agent\setup.mjs` | ≥2 |
| 3 | `findstr /c:"ledger_query" thincoder-vscode\src\agent\setup.mjs` | 0（名字面在核——端侧零重复定义） |
| 4 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/ledger.test.mjs` | exit 0（含新组，见下用例表） |
| 5 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/engine-floor-guard.test.mjs` | exit 0（闭包零 `node:sqlite` 未破——动态 import 不入闭包） |

**用例表（并入 `thincoder-vscode/test/ledger.test.mjs`（248 行）新增组）**：

| # | 输入 | 期望输出 |
|---|---|---|
| T-LQ1 装配面 | 桩 handle 驱动 `hydrateRun`（台账 tmp 夹具） | `tools` / `agent.tools` 名集含 `ledger_query`、`ledger_count`（各恰 1，零重名） |
| T-LQ2 只读角色 | `role: "explore"`（depth>0） | 两工具仍在（readonly 放行） |
| T-LQ3 执行形状 | `ledger_query.execute({}, {agent:{cwd: tmpRoot}})` | 行集 JSON；`ledger_count` 返回 `{"count":N}` |
| T-LQ4 写面零回归 | 同夹具 | 写命令仍只在 depth-0 装配（核面行为不变） |

**边界 / 降级**：① 端侧零第二实现（工具定义 / cwd 供值 / SQLite 面全在核）② 动态 import = W8 契约② 硬约束（静态化 ⇒ 端壳闭包机检红——`test/engine-floor-guard.test.mjs:139-140`）③ 家族段（写命令）与本项不相交 ④ 台账查询经核链触达 `node:sqlite`——**载入形态 = 装配期**（`hydrateRun` 内动态 import——全深度、`try/catch` 外；2026-09-20 实测收正）；低于引擎下限的宿主由 `extension.mjs` 护栏停用记忆面（与端侧既有 `ledger-surface.mjs` 同一动态先例）；静态闭包机检不受影响（动态 import 不入闭包——W8 契约②）。不在本项改动面（观察项 · §2.27）。

**设计档落点（车道 3）**：`TOOLS.md` §6.11（端差行）改述「VSC 已接线」；`CORE-UNIFICATION.md` §2.13（端差注入位）行注补查询工具接线事实。

### 2.20 #123② 核 `permission.mjs` 作单一权威（定案 = §2.7 方案①）

**权威面 = 闸语义 + 请示文案**（`thincoder-core/permission.mjs`：`summarize:18` / `formatPermission:25` / `askPermission:60`——**核内零改**）；**展示面 = `io.ask` 缝**（`:62-64`）。三端消费形态：

1. **`thincoder-cli/src/cli/permission.mjs`（48 行）→ 整体转口**（保既有 import 面：`bin/thincoder.mjs:27` 与 `src/cli/distill-command.mjs:80` 零改）：

```js
export { summarize, formatPermission, askPermission } from "@thincoder/core/permission.mjs"
```

　　（**CLI TTY 文案逐字保**——本席逐字对照核/CLI 两份：`formatPermission` 全分支同文；`askPermission` 的 `[allow?] … (y/N)` 与非交互 `[deny] … (non-interactive, side-effect tools require a TTY)` 同文 ⇒ 转口零文案变化。）

2. **`thincoder-cli/src/tui/interaction.mjs`（133 行）**——`askPermission`（`:58-72`）改经核缝；TUI 行式 `formatPermission`（`:16-56`：危险命令红标 `detectDanger` / apply_patch diff）**保留为端显示变换**（承载形态面 = 已裁保留，`CORE-UNIFICATION.md` §2.12.3）。顶部增 `import { askPermission as coreAskPermission } from "@thincoder/core/permission.mjs"`；函数体改：

```js
  function askPermission(name, args) {
    // auto 档放行保持端特有可见行（原语义）
    if (agent.autoApprove) {
      const argSummary = summarize(args)
      pushLine(`  [auto] ${name}${argSummary ? ` ${argSummary}` : ""}`, C.warn)
      return Promise.resolve(true)
    }
    // 闸语义 / 请示流程 = 核单源；本端只供展示面（TUI 卡片）经 `io.ask` 缝注入。
    return coreAskPermission(name, args, {
      ask: ({ name: n, toolArgs }) => new Promise((resolve) => {
        state.permissionPreview = formatPermission(n, toolArgs)
        state.permission = { name: n, args: toolArgs, resolve }
        state.status = `Waiting: ${n}`
        render()
      }),
    })
  }
```

3. **`thincoder-vscode/src/extension/permission-gate.mjs`（109 行）**——逐项门改经核缝（面板卡形态逐字保）：顶部增 `import { askPermission } from "@thincoder/core/permission.mjs"`（静态合法——闭包仅 `node:readline`）；`permissionGate`（`:49-78`）改：

```js
export function permissionGate(panel) {
  return (toolName, args, diffInfo, opts) => askPermission(toolName, args, {
    ask: () => new Promise((resolve) => {
      // 原卡片体逐字保留（`_autoApprove` 短路 → 队列 / `promptId` / postMessage / release / abort 三路）；
      // postMessage 载荷取值 = `toolName` / `args`（同一对象）与闭包 `diffInfo` / `opts`。
    }),
  })
}
```

　　（`releasePermission` / `batchPermissionGate` / `_permissionSeq` 等端显示机制**零改**；`batchPermissionGate` **不属** #165 缝——核 `permission.mjs` 无批面，锚定不动。）

**验收（机检 · 全 ASCII）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"@thincoder/core/permission.mjs" thincoder-cli\src\cli\permission.mjs` | 1 |
| 2 | `findstr /c:"export function formatPermission" thincoder-cli\src\cli\permission.mjs` | 0（本地重复实现退场） |
| 3 | `findstr /c:"@thincoder/core/permission.mjs" thincoder-cli\src\tui\interaction.mjs thincoder-vscode\src\extension\permission-gate.mjs` | ≥2（两端接缝） |
| 4 | `cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/permission-transit.test.mjs` | exit 0（新档：转口恒等 + 默认通道文案保） |
| 5 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/permission-gate-seam.test.mjs` | exit 0（新档——须登记 `test/files.mjs`） |
| 6 | VSC 既有面 | `node --test test/child-permission.test.mjs test/child-permission-wiring.test.mjs test/webview-permission-batch-release.test.mjs` ⇒ exit 0 |
| 7 | 三包 | `npm test` ×3 ⇒ exit 0 |

**用例表**：

| # | 输入 | 期望输出 |
|---|---|---|
| T-PT1 转口恒等 | CLI：两 import 比对 | 函数对象同一（`===`） |
| T-PT2 假 io.ask | CLI：`askPermission("x", {}, {ask:()=>true/false})` | 恰调一次、以其返回值为准（两档） |
| T-PT3 io.ask 未处理 | CLI：`ask` 返回 undefined | 回默认通道（非 TTY ⇒ `[deny]` + false） |
| T-PT4 TUI 缝 | TUI：`createInteraction` 夹具 + 假 state/render | `state.permission` 置位（name/args/resolve）；resolve(true) ⇒ Promise 解 true |
| T-PT5 TUI 行式预览保留 | TUI：edit / apply_patch 参数 | `state.permissionPreview` = 行数组（apply_patch 分支仍在） |
| T-PT6 VSC 门接缝 | VSC：`permissionGate(panel)` 夹具 | `_permissionQueue` 入队 + `permissionRequest` postMessage（含 promptId）；作答 ⇒ resolve 值 |
| T-PT7 VSC AUTO 短路 | 面板 `_autoApprove=true` | resolve(true)；零入队 / 零 postMessage |
| T-PT8 VSC 中止释放 | 轮级 abort | release(false)（三路释放语义零改） |

**边界 / 降级**：① CLI TTY 文案逐字保（转口零改文案；默认通道实现在核）② VSC 面板卡形态保（结构化 args/diff 载荷不动；核 `text` 未新引入显示面——不属本批）③ TUI 行式预览保留（危险命令红标 / apply_patch diff 不丢）④ child 权限通道 = 核 `agent-tools/child-permission.mjs`（两端已消费）——不在本项 ⑤ 批合并卡不在本项（核无批面）⑥ 核 `permission.mjs` 本体**零改动**（权威面已落，缺的是消费者；「孤儿」由此消解）。

**设计档落点（车道 3）**：`CORE-UNIFICATION.md` §2.13.3 表 `io.ask` 行（`:1283`）端侧列改述「CLI = 不传（核默认 TTY）· TUI = 卡片预览经 `io.ask` 注入 · VSC = 面板卡经 `io.ask` 注入（`permission-gate.mjs`）」；§2.8.1 表 `permission.mjs` 行（`:1090`）注「消费者已接线（#165 已落）」。

### 2.21 #123③ 两份保留 + 核降为参考 + 同步设计档（定案 = §2.8 方案② · 零产品码）

**裁定语义（本项 = 文档面）**：核 `thincoder-core/agent/suspension.mjs:154 startSuspension`（241 行）**无生产消费者**（唯一消费者 = 核测 `thincoder-core/test/suspension.test.mjs`）；两端各持已分叉驱动（CLI `thincoder-cli/src/tui/suspension-drive.mjs`（`suspensionSession:191`）∥ VSC `thincoder-vscode/src/extension/suspension.mjs`（`suspensionSession:227`））⇒ **判保留**（结构不对称：两端驱动各承载端特有可见面 / 宿主能力）；核档**降为参考实现**（不构成两端权威）。**本批不动两端驱动**；「核状态机收核 / 删除」= 独立议题另批。

**改法（车道 3 · 本席笔）**：

1. `docs/core/design/AGENT-LOOP.md` §2.3（挂起 / 载体面 `:72-73` 邻区）——增现态陈述句：「核 `agent/suspension.mjs`（`startSuspension`）= **参考实现**（唯一消费者 = 核测）；挂起面**权威 = 两端驱动**（CLI `suspension-drive.mjs` ∥ VSC `extension/suspension.mjs`——已分叉，**判保留**：结构不对称）；核档读者不得据其改端行为」。
2. `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.12.2（三路唤醒表 + 挂起驱动坐标段 `:1430-1446`）——同款现态注 + 指针；**同轮收正 `:1446` 后半句**（「本批改动面 = 核 + CLI + VSC 三面」= 计划面失效表达 ⇒ 按 D 纪律**删除**、改述为现态句「核驱动 = 参考实现；两端各持驱动（判保留）」——不留划改残迹）。
3. `docs/core/design/CORE-UNIFICATION.md` §2.8.1 表 `:1094` 行（`suspension.mjs | 234`）——注列补「核内落点已落 · 端侧接线未落（两端各持驱动——判保留；核档 = 参考）」；同表 `:1090` 行（`permission.mjs`）同法注（承 §2.20）。
4. `docs/core/design/CORE-UNIFICATION.md` **§2.13 端差注入位表 `:1288` 行**（`ctx.carrier` / `ctx.runTurn` / `ctx.hooks` 挂起载体——末列验收句「载体双夹具……各跑同组状态机断言」）与 **§2.13.6 表 `:1313` 行**（#184 挂起 / 唤醒池载体——端侧列「端侧接线」）——两行现仍作「端侧接线待落」叙述 ⇒ **同轮注现态**（「核内落点已落 · 端侧两份驱动判保留（核档 = 参考；P2 批 §2.21）」）+ `:1288` 的双夹具验收句按「核状态机 = 参考」收正。**取「补」不取「显式声明计划面不改」**——判保留落笔后两行会同档并存两种相反叙述。

**验收（机检）**：`findstr /c:"startSuspension" docs\core\design\AGENT-LOOP.md` ⇒ ≥1（ASCII 锚；中文内容人工核对——中文 `findstr` 判据禁用，台账 #102）；`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ 本批改动档**零新增悬空 / 零新增超宽**。

**边界**：零产品码；不改两端驱动（与 P1 批改动面不相撞）；删除类动作不在本批（须另裁）。

### 2.22 #123④ 同族事件载荷双改纪律入档 + 机检锚（定案 = §2.9 方案②）

**定案口径**：可消的不是字段形态（发射面 = 核单点 `thincoder-core/agent-tools/subagent-scheduler.mjs:171-176`（`kind ∈ {depc, wait, slot}` + detail）——**不动**），而是**漏改风险**；字段命名 / 承载形态差异 = 已裁保留面（`CORE-UNIFICATION.md:1209` §2.12.3）。

**改法**：

1. **设计档纪律行**（车道 3）——`docs/core/design/AGENT-LOOP.md` §6.18 表增一行「同族事件载荷双改纪律」：「`⟦ev⟧queued` 载荷 = 核单点（`kind ∈ {depc, wait, slot}` + `position` + `detail`）；**改核事件族任一 kind / 字段 ⇒ 同轮改两端消费面**（CLI `subagent-panel.mjs:73/98-101` 分流；VSC `panel-subagent-relay.mjs:94-108` 映射 + `webview/activity-view.js:79-80` 回退）+ 两端用例同轮；字段命名 / 承载形态差异 = 已裁保留（§2.12.3）——**不属该消的差**；#118 那类**字段丢失**属真缺陷（已由一致性同步批消解）」。
2. **机检锚**（车道 2）——新档 `thincoder-vscode/test/subagent-queued-payload.test.mjs`（须登记 `test/files.mjs`；**不并入** `test/async-parity.test.mjs`——该档 485 行，距 500 硬限 15 行）：

| # | 输入 | 期望输出 |
|---|---|---|
| T-QP1 slot | token `⟦ev⟧queued\x1eslot\x1e2\x1e…\x1e`（经 `relaySubagentEventToken`） | 载荷 `{status:"queued", kind:"slot", position:2, waiting:null, reason:null}` |
| T-QP2 wait | `…\x1ewait\x1e1\x1e…\x1e域冲突 x.mjs` | `{waiting:"waiting-deps", reason:<detail 原文>, kind:"wait"}` |
| T-QP3 depc | `…\x1edepc\x1e3\x1e…\x1e…` | `{waiting:"dependency-cancelled", reason:<detail>}` |
| T-QP4 缓存单源 | T-QP1/2 后 `queuedInfoOf(panel, "coder#7")` | 与载荷同形的缓存项（四项：kind / position / waiting / reason） |
| T-QP5 作废点 | `[model]`（started，`:91`）/ `⟦ev⟧cancelled`（`:112`）/ `⟦ev⟧stopped`（`:116`）/ `⟦ev⟧settled`（`:117`）/ `⟦ev⟧done`（`:118`）各一发 | 缓存键删除（`queuedInfoOf` ⇒ null——陈旧项不滞留）；**五路逐路断言** |
| T-QP6 重生投影同形 | `reassertLiveChildren`（`suspension.mjs:141`）对 queued 条目 | 载荷四项取自缓存（与 T-QP1–3 逐字段同形）；缓存缺省 ⇒ 仅 `position`（降级形） |

**验收（机检 · 全 ASCII）**：`cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/subagent-queued-payload.test.mjs` ⇒ exit 0；`findstr /c:"depc" docs\core\design\AGENT-LOOP.md` ⇒ ≥1（新纪律行 ASCII 锚）。

**边界**：不改发射面；不改两端消费面行为（仅补锚）；#118 已消（一致性同步批已落——`panel-subagent-relay.mjs:94-108` 同点四项入缓存 + `suspension.mjs:153-166` 同源投影）。

### 2.23 #123⑤ `ContinueError` 单一类（定案 = §2.10 方案①）

**权威类 = 核** `thincoder-core/agent/helpers.mjs:205-211`（`this.name = "ContinueError"`；字段 `turn`）。**改法**：

1. `thincoder-vscode/src/agent.mjs`（483 行）—— `:42-45` 本地类删除，改**转口**（保既有 import 面：`src/agent/run-stages.mjs:38` · `src/extension/panel-turn-loop.mjs:17` · `test/turn-across-segments.test.mjs:25`）：

```js
import { ContinueError } from "@thincoder/core/agent/helpers.mjs"
export { ContinueError }
```

　　（`throw new ContinueError(maxTurns)`（`:467`）语义不变。）

2. `thincoder-vscode/src/extension/panel-turn-loop.mjs`（164 行）—— **字段名收正**（核字段 = `turn` ∥ 端旧字段 = `turns`）：`:110` / `:114` / `:124` 三处 `e.turns` → `e.turn`；`:124` 用户可见句 `Agent reached ${e.turn} turns (limit). Continue from here?` 文案零改。

**验收（机检 · 全 ASCII）**：

| # | 命令 / 判据 | 期望 |
|---|---|---|
| 1 | `findstr /c:"extends Error" thincoder-vscode\src\agent.mjs` | 0（本地类退场） |
| 2 | `findstr /c:"@thincoder/core/agent/helpers.mjs" thincoder-vscode\src\agent.mjs` | 1（核面转口） |
| 3 | `findstr /c:"e.turns" thincoder-vscode\src\extension\panel-turn-loop.mjs` | 0（字段收正） |
| 4 | `cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/turn-across-segments.test.mjs test/agent-lifecycle-singleton.test.mjs` | exit 0；并断言 `（await import("../src/agent.mjs")).ContinueError === （await import("@thincoder/core/agent/helpers.mjs")).ContinueError` |
| 5 | VSC 全量 | `npm test` ⇒ exit 0 |

**边界 / 降级**：① 今日**无活跨域路径**（VSC depth>0 子代走核循环 ⇒ 子代一律抛核类；端壳类只服务 depth-0）——本项 = 同物两份收口（结构治理），非缺陷修复（§2.10 实核降级）② 类消息文本两端不同（核 `Agent paused after N turns. Continue?` ∥ 端旧 `Agent reached max turns (N).`）——VSC 三消费点均自建文案（弹卡 / digest cap 行 / tlog），**用户可见文案零改**；核消息文本成为唯一类消息（实核无直显点）③ `src/agent/run-stages.mjs:38` 的 `INHERITED_GUARD_KEYS` 符号面以 §2.18 形态为准（同轮落则一并改指向核）。

### 2.24 受影响文件表（现盘行数 + Δ + 越线判定 + 拆分计划）

> 行数 = 2026-09-20 本席实读（`find /c /v ""` 口径）。判据 = `AGENTS.md`「≤300 咨询线 / ≤500 硬限」。

| 组（项） | 档 | 现行数 | 预估 Δ | 越线判定 |
|---|---|---|---|---|
| ①②③⑤（VSC） | `thincoder-vscode/src/agent/run-stages.mjs` | 377 → **402**（落笔后实测） | +25 | >300、≤500 ✓ |
| ②（VSC） | `thincoder-vscode/src/agent/execute-tools.mjs` | 393 → **407**（落笔后实测） | +14 | 同上 ✓ |
| ①（VSC 配置面） | `thincoder-vscode/src/agent/setup.mjs` | 481 → **489**（落笔后实测；`find` 口径） | +8 | 距 500 硬限 11 · **贴 490 触发线**：`find` 口径 489 < 490 未触线；`read` 口径 490 = 恰在触发线 ⇒ **下次触碰即触线**（拆分计划在册 `docs/vsc/design/VSC-DEBT.md` §12.1） |
| ①（VSC 配置面） | `thincoder-vscode/src/agent/agent-state.mjs` | 147 | +1 | <300 ✓ |
| ③⑤ | `thincoder-vscode/src/agent.mjs` | 483 → **478**（落笔后实测） | −5 | 距 500 余 22；>300 ✓ |
| ①②③⑤（VSC 用例 · 新） | `test/lifecycle-hooks.test.mjs` · `test/dispatch-hooks.test.mjs` · `test/permission-gate-seam.test.mjs` · `test/subagent-queued-payload.test.mjs` | — | 新增 4 档（各 ≈120–220） | 各 <500 ✓；**须登记 `test/files.mjs`**（未登记 = 不跑 + `run.mjs` fail-closed） |
| ①②③⑤（VSC 用例登记面 · 改） | `thincoder-vscode/test/files.mjs` | **110 → 116**（落笔后实测） | **+4**（三条新档登记 `:112-115`；表列现盘差 +6——另 2 行 = 并行批次在途） | <300 ✓；未登记 = 不跑（`test/run.mjs:51-56` fail-closed） |
| ②⑤（VSC 用例 · 改） | `test/turn-across-segments.test.mjs`（154）· `test/agent-lifecycle-singleton.test.mjs` | 154 / — | +0~+8 | <300 ✓ |
| ①（VSC 用例 · 改） | `test/ledger.test.mjs` | 248 → **324**（落笔后实测） | +76 | **>300 咨询线**——已在 `docs/vsc/design/VSC-DEBT.md` §12.1 登记；<500 ✓ |
| ②（VSC） | `thincoder-vscode/src/extension/permission-gate.mjs` | 109 → **117**（落笔后实测） | +8 | <300 ✓ |
| ⑤（VSC） | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 164 | ±0（三处词面收正） | <300 ✓ |
| ③（核） | `thincoder-core/agent/helpers.mjs` | 391 → **411**（落笔后实测；`find` 口径） | +20 | >300 已在册（`thincoder-core/test/core-hygiene.test.mjs:40`）；<500 ✓ |
| ③（核） | `thincoder-core/agent/run-stages.mjs` | 248 | −4~−6 | <300 ✓ |
| ③（核） | `thincoder-core/agent.mjs` | 429 | ±0~+1 | >300 在册；<500 ✓ |
| ②（CLI） | `thincoder-cli/src/cli/permission.mjs` | 48 | −40（转口） | <300 ✓ |
| ②（CLI） | `thincoder-cli/src/tui/interaction.mjs` | 133 | +2~6 | <300 ✓ |
| ②（CLI 用例 · 新） | `thincoder-cli/test/permission-transit.test.mjs` | — | 新增 1 档 | CLI 收集面 = 两层 glob（零登记义务） |
| ③④（文档） | `docs/core/design/AGENT-LOOP.md`（553 → **564**）· `AGENT-LOOP-SUBAGENT.md`（1964 → **1968**）· `CORE-UNIFICATION.md`（1923 → **1925**）· `TOOLS.md`（→ **537**）· `docs/vsc/design/VSC-DEBT.md`（→ **589**）——落笔后实测 | — | 文档 | 文档不受行数规则（`DOC-DISCIPLINE.md` §3.7） |

**总判定**：**零新增越 500 硬限档**；300–500 区间 = VSC `run-stages` / `execute-tools` / `setup` + 核 `helpers` / 核 `agent.mjs`；**唯一贴线档 = VSC `setup.mjs`（现盘 489〔`find` 口径〕）**——`read` 口径 490 恰在触发线 ⇒ **下次触碰即触线**（拆分计划在册）。

### 2.25 验收命令清单（全 ASCII · cmd.exe · 只读诊断）

**A 组 · 三包门禁（最终判据）**：

```bat
cd /d D:\teamcode\thincoder\thincoder-core && npm test
cd /d D:\teamcode\thincoder\thincoder-cli && npm test
cd /d D:\teamcode\thincoder\thincoder-vscode && npm test
```

**B 组 · 逐项正向（各条对应 §2.16–§2.23 表内编号）**：

```bat
cd /d D:\teamcode\thincoder
findstr /c:"@thincoder/core/hooks.mjs" thincoder-vscode\src\agent\run-stages.mjs thincoder-vscode\src\agent\execute-tools.mjs
findstr /c:"closeOpenCodeAdvisorRuns" thincoder-vscode\src\agent\run-stages.mjs
findstr /c:"raw.hooks" thincoder-vscode\src\agent\setup.mjs
findstr /c:"hooks:" thincoder-vscode\src\agent\agent-state.mjs
findstr /c:"blocked by PreToolUse hook" thincoder-vscode\src\agent\execute-tools.mjs
findstr /c:"export const INHERITED_GUARD_KEYS" thincoder-core\agent\helpers.mjs
findstr /c:"snapshotGuard" thincoder-core\agent\run-stages.mjs thincoder-vscode\src\agent\run-stages.mjs
findstr /c:"@thincoder/core/ledger.mjs" thincoder-vscode\src\agent\setup.mjs
findstr /c:"@thincoder/core/permission.mjs" thincoder-cli\src\cli\permission.mjs thincoder-cli\src\tui\interaction.mjs thincoder-vscode\src\extension\permission-gate.mjs
findstr /c:"@thincoder/core/agent/helpers.mjs" thincoder-vscode\src\agent.mjs
findstr /c:"e.turns" thincoder-vscode\src\extension\panel-turn-loop.mjs
findstr /c:"startSuspension" docs\core\design\AGENT-LOOP.md
findstr /c:"depc" docs\core\design\AGENT-LOOP.md
```

**B 组反证（期望零命中 · 退出码 1）**：

```bat
findstr /c:"INHERITED_GUARD_KEYS" thincoder-vscode\src\agent.mjs thincoder-vscode\src\agent\run-stages.mjs
findstr /c:"for (const k of [" thincoder-core\agent.mjs
findstr /c:"extends Error" thincoder-vscode\src\agent.mjs
findstr /c:"export function formatPermission" thincoder-cli\src\cli\permission.mjs
findstr /c:"ledger_query" thincoder-vscode\src\agent\setup.mjs
```

**C 组 · 结构机检（既有档，须绿）**：

```bat
cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/engine-floor-guard.test.mjs
cd /d D:\teamcode\thincoder\thincoder-core && node --test test/core-hygiene.test.mjs
```

**D 组 · 新档定向**：

```bat
cd /d D:\teamcode\thincoder\thincoder-vscode && node --test test/lifecycle-hooks.test.mjs test/dispatch-hooks.test.mjs test/permission-gate-seam.test.mjs test/subagent-queued-payload.test.mjs
cd /d D:\teamcode\thincoder\thincoder-cli && node --test test/permission-transit.test.mjs
```

**E 组 · 文档面**：

```bat
cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .
```

**F 组 · 行数复测（落笔后）**：

```bat
cd /d D:\teamcode\thincoder && find /c /v "" thincoder-vscode\src\agent\setup.mjs thincoder-vscode\src\agent\run-stages.mjs thincoder-vscode\src\agent\agent.mjs thincoder-core\agent\helpers.mjs
```

（中文串判据一律**不落 `findstr /c:"<中文>"`**——本机该形态假绿 / 假红不可判别（台账 #102）；中文内容断言 = 人工核对 + `doc-check`。）

### 2.26 边界（本批不做）

1. 不重开方案选项（八项定案）；不采「VSC 派发向核收口」长程方案（门族 `tool-gates.mjs` 核内无对位）。
2. 不写需求档（父侧笔）；不并入纯显示面（P1）与文档过期登记（P3）。
3. 不删任何档 / 不删核内落点（核 `permission.mjs` / `agent/suspension.mjs` 本体零改；删除类动作须另裁）。
4. 不改两端挂起驱动；不接 `loadRules`（台账 #130 已裁「先登记不接线」）。
5. 不改 child 权限通道（核 `child-permission.mjs` 已归一）；不改批合并卡面。
6. 不做 L3 登记两份实现归一（§2.27-3）。
7. 不顺手优化：不改名既有导出、不清既有死码、不动他批在途档。

### 2.27 设计轮增量发现（只报不动 · A5）

1. **配置面缺口（已纳入设计）**：VSC `agent.config` 由 `agent-state.mjs:96-107` 整建、缺 `hooks` 段（且无任意新 config 段的通用通路）⇒ §2.16/§2.17 的钩子接线**必须**同轮补 config plumb（§2.16-3/4）。**影响**：上轮 §2.11 文件表未含 `setup.mjs` / `agent-state.mjs` 两档——本设计已补（§2.24）。
2. **轮号同口径（登记）**：核 `_currentTurn`（`thincoder-core/agent.mjs:209` ← `turnFrame().turn` = 链内累计 `seq`；`thincoder-core/agent/helpers.mjs:221-223`）∥ 端 `_turnSeq`（链内累计轮号，`thincoder-vscode/src/agent.mjs:171-175`）——Stop 载荷 `turn` 两端**同口径**（一致于 `docs/core/design/AGENT-LOOP.md` §6.13 载荷表 `:336`）；实现侧取 `agent._turnSeq ?? 0`，不新增端字段。
3. **同族两份仍在（本批不动）**：L3 写域登记实现两份（核 `thincoder-core/peer-domains.mjs`（266 行 · `agent._peerWritten` 载体）∥ 端 `thincoder-vscode/src/extension/peer-domains.mjs`（168 行 · 模块级集合 + `flushDomains(cwd)`））——目标文件与载荷同形（`~/.thincoder/peers/{sessionId}.json`），功能对位成立；归一 = 新工作面。
4. **VSC 工具表计数**：上轮 §2.12-① 读数不一致（台账 27 ∥ 实核 30）——本轮复核 `thincoder-vscode/src/tools/index.mjs:172-186` 现盘 = **30 项**；本批 +2（ledger 两工具，经 `setup.mjs` 装配面追加——**不改该静态表**）⇒ 表内仍 30 项、装配面名集 +2。台账读数收正归主 agent 写域。
5. **跨批归属重叠（须协调）**：#123⑤（本批）与 #127⑤（`docs/batches/2026-09-20-structure-consolidation-batch.md§2`）**同标 `ContinueError` 双类**——本批落地即同轮满足两条；他批**不得重复施工**（否则 VSC `agent.mjs` 双改冲突）。
6. **台账 #130 不涉本批**：`loadRules` 接线 = 能力面另立（用户已裁「先登记不接线」）——本批零动作。
7. **上轮欠账已并入车道 3**：核 `permission.mjs` / `agent/suspension.mjs` 的「核内落点已落、端侧接线未落」现态陈述随 §2.20 / §2.21 落笔消解。

### 2.28 变更记录（续）

- 2026-09-20：**实施设计轮（批准后首轮 · eng-designer）**——承用户 05:15「都按建议」（八项定案）：新增 §2.15–§2.27（八项可实施设计 + 受影响文件表 + 实施分批 + 全 ASCII 验收命令清单 + 边界 + 增量发现）。**本轮实核增量**：① W8 静态闭包逐模块读数（`hooks` / `agent/helpers` / `permission` 静态合法；`ledger` / `advisor-async` 必须动态）② VSC config 面缺 `hooks` 段（#122①/#122② 改动面上调：+2 档）③ VSC 台账写命令已在可达面（#123① 缺口边界收窄为查询两工具）④ `panel-turn-loop` 三处 `e.turns` 字段收正（#123⑤）。**本轮零产品码 / 零文档落笔**（设计面单轮；文档落笔归车道 3 = 实施轮本席笔）。

### 2.29 修正轮（设计评审 §3 轮次 1 · findings #1–#9 全落 · 2026-09-20 · eng-designer）

**轮次** = fix（定点 · 追加制）。**依据** = §3 发现表 9 条（🔴1 / 🟡4 / 🔵4）——父侧逐条裁定**接受**。**改动形态** = ① 被点名失效的表述**就地删除 / 改述**（不留划改残迹——旧文可在 git 历史逐字复核；判据 = 2026-09-18 用户裁定「失效的表达一定要删掉」）② 本节 = 追加制逐条记录（号 → 改动 file:line → 机检断言 / 本轮实测读数）。**本轮零产品码 · 零设计档正文落笔**；**零新条目 · 不重开八项定案**（§2.26 边界不变）。

| # | 处置（承 §3 改法） | 改动 file:line（本节落笔前现盘） | 机检断言 / 本轮实测读数 |
|---|---|---|---|
| 1（🔴） | 删「口径差」表述三处 + 落点句收正：① §2.16 代码注释模板轮号句 →「**同口径**」+ 帧赋值事实 ② §2.16 边界② ③ §2.27-2；④ §2.16「设计档落点」句「轮号口径注」→「轮号句（与同节载荷表一致）」。实现侧取 `agent._turnSeq ?? 0` **不改** | 批档 `:259-261` · `:315` · `:317` · `:722` | `findstr /c:"agent.mjs:209" docs\batches\2026-09-20-mechanism-parity-batch.md` ⇒ **2 行**（实跑）·「同字段异口径」/「段内计数」**§2 内零残留**（UTF-8 感知核对：命中仅 §3 `:743` 评审原文；中文串不入 `findstr`——§2.25 末注） |
| 2（🟡） | §2.4 现状段末句改述：今日 VSC 主会话与子代理**皆不触发**（VSC `agent.config` 缺 `hooks` 段）；归一后子代经父 config 获 `hooks`、触发由核循环承载 ⇒ 缺口收窄为 depth-0 工具轮（**范围结论不变**） | 批档 `:81` | `findstr /c:"ctx.agent?.config?.hooks" docs\batches\2026-09-20-mechanism-parity-batch.md` ⇒ **3 行**（实跑）· 子代 config = 父 config 实证 = `thincoder-core/agent-tools/subagent-spawn.mjs:341-348`（本轮实读：`:343` = `: parent.config` · `:348` = `config: childConfig`） |
| 3（🟡） | §2.18 步 3 增列 `thincoder-vscode/src/agent/run-stages.mjs:38` import 面删 `INHERITED_GUARD_KEYS`（不删 = 非法具名导入 ⇒ 模块加载期硬失败）；§2.18 验收 #2 期望面扩为两档零命中；§2.25 B 组反证同步 | 批档 `:407` · `:414` · `:674` | `findstr /c:"INHERITED_GUARD_KEYS" thincoder-vscode\src\agent.mjs thincoder-vscode\src\agent\run-stages.mjs` ⇒ 现盘 **4 行**（实跑：`agent.mjs:27/120` + `run-stages.mjs:38/368`）→ 目标 **0** |
| 4（🟡） | 前提收正 + 落点补全：§2.8 现状末句**指回** `AGENT-LOOP-SUBAGENT.md:1446`（已显式陈述「无生产消费方」）；§2.21 改法② 节号 → **§6.27.12.2** + 同轮收正 `:1446` 后半计划面句（**删除**失效表达、改述现态，不留残迹）；§2.21 改法**新增 ④** = 落点清单补 `CORE-UNIFICATION.md:1288` / `:1313`（**取「补」**——两行仍作「端侧接线待落」叙述，判保留落笔后会与现态注并存相反叙述） | 批档 `:146` · `:558` · `:560`（新增 ④） | `findstr /c:"CORE-UNIFICATION.md:1288" /c:"CORE-UNIFICATION.md:1313" docs\batches\2026-09-20-mechanism-parity-batch.md` ⇒ ≥1（实跑命中，含 §3 评审行）· 两坐标本轮实读在位（`:1288` = carrier 行 · `:1313` = #184 行） |
| 5（🟡） | §2.24 表补 `thincoder-vscode/test/files.mjs` 行（现盘行数 + Δ + 越线判定——原表只在四新档行文本里提登记义务） | 批档 `:627`（新增行） | `find /c /v "" thincoder-vscode\test\files.mjs` ⇒ **109**（`read` 口径 110——见下「读数口径」注） |
| 6（🔵） | §2.9 映射表坐标 `:71-81` → **`:94-108`**（+ 四项入缓存 `:107`）；§2.11 E 组行行数 216 → 245（+ 映射表坐标） | 批档 `:162` · `:204` | `findstr /c:"panel-subagent-relay.mjs:94-108" docs\batches\2026-09-20-mechanism-parity-batch.md` ⇒ **4 行**（实跑）· `find /c /v "" thincoder-vscode\src\extension\panel-subagent-relay.mjs` ⇒ **244**（`read` 口径 245） |
| 7（🔵） | 三处验收口径：(a) §2.17 #3 期望 →「≥4（含 import 行实命中 5）」；(b) §2.18 #4 换**不携引号** ASCII 锚（`for (const k of [` ⇒ 0）+ 正向锚 `restoreGuard` ⇒ ≥1，并进 §2.25 B 组；(c) T-QP5 补 `⟦ev⟧stopped`（`:116`）⇒ **五路逐路断言** | 批档 `:357` · `:416` · `:581` · `:674-678` | (a) `findstr /c:"runHooks" thincoder-vscode\src\agent\execute-tools.mjs` ⇒ 现盘 **0 行**（实跑 exit 1）→ 目标 5；(b) `findstr /c:"for (const k of [" thincoder-core\agent.mjs` ⇒ 现盘 **1 行**（实跑：`:148` 唯一实例）→ 目标 0 |
| 8（🔵） | T-LH7 改**确定性缝**（避开墙钟）：假脚本写到达标记（含 `pid`）后 `await new Promise(() => {})`（永不 resolve）；断言 = `finalizeAgentTurn` 返回 ∧ 标记在场 ∧ `process.kill(pid, 0)` 不抛 ⇒ 判「未 await 钩子」（实现侧若 await ⇒ 用例挂死 = 失败）；尾部 `process.kill(pid)` 清理。「假脚本挂起 1s」退场 | 批档 `:311` | `findstr /c:"process.kill(pid, 0)" docs\batches\2026-09-20-mechanism-parity-batch.md` ⇒ **1 行**（实跑）·「挂起 1s」**§2 内零残留**（UTF-8 核对：命中仅 §3 `:750`）· 用例判据 = `node --test test/lifecycle-hooks.test.mjs` exit 0 |
| 9（🔵） | `AGENT-LOOP.md:550` as-of 行按现盘刷新 ⇒ **记入车道 3 清单**（§2.15 车道 3 行点名 + 本表）；**本轮不落设计档**（车道 3 面） | 批档 `:240`（车道 3 行） | `find /c /v "" docs\core\design\AGENT-LOOP.md` ⇒ **552**（`read` 口径 553；该行自陈 **547** = stale——刷新动作归车道 3，落笔后复测） |

**读数口径（本轮登记 · 非本批改动面）**：批档行数两口径并存——`find /c /v ""`（§2.24 表头声明口径）与 `read`（= 前者 +1 尾行；承 `docs/batches/2026-09-15-check-tooling-debt.md:117`）。本修正轮 #5 / #6 两处读数沿用**父侧 · 评审读数**（`test/files.mjs` = 110 · relay = 245）；对应 `find` 口径 = **109 / 244**。该差 = 口径 artifact（非内容差）。档内同族 ±1 差另有：`run-stages.mjs`（§2.3 记 378 ∥ §2.16/§2.24 记 377——`find` = 377）· `execute-tools.mjs`（§2.4 记 394 ∥ §2.17/§2.24 记 393——`find` = 393）。**口径统一 = 文档维护面，不入本批**（只报不动）。

**E3 读数（本节落笔前 · 本批改动面全落）**：`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs --root .` ⇒ 锚：**悬空 1**（存量 = `docs/core/design/MODEL-SPECS.md` FLOOR_SPECS——并行会话在途档，非本批）· 路径/坐标 悬空 **0** · 行宽：源域 .md **零超宽** ⇒ **本批净增 0**（与父侧基线逐项同）。**入闸项零触**（本节为文档面追加记录）。

**边界**：同 §2.26（不写产品码 / 不落设计档正文 / 不删档 / 不重开方案 / 不夹带新语义）；本节只记 §3 九条的直接导出项。

**变更记录**：2026-09-20（**设计评审 #31 修正轮 · eng-designer**）：§3 findings #1–#9 逐条落修（**9/9**）——失效表述就地删除 / 改述 5 处（`:81` · `:259-261` · `:315` · `:317` · `:722`）+ 前提收正 1 处（`:146`）；设计面补强 4 处（`:407` · `:414` · `:558` · `:560`）+ 新增 1 行（`:627`）；验收口径 4 处（`:357` · `:416` · `:581` · `:674-678`）；车道 3 清单 1 项（`:240`）。

### 2.30 车道 3 设计档落笔轮（initial · eng-designer · 2026-09-20）

**轮次** = initial（条款落笔轮）。**依据** = §2.15 车道 3 行 + §2.16–§2.22 各「设计档落点」+ §5 两车道实施记录（车道 1 / 车道 2 均已交付 clean ⇒ 条款按实读落笔）。**改动形态** = 逐项接线事实落笔（含 as-of 标注）+ 现态收正（失效表述删除 / 改述，不留划改残迹）+ 读数按实读收正。**边界**：零产品码 · 零需求档 · 零 `scripts/**` · 零 §3/§4/§5 他人段 · 零新语义（只落 §2 已裁条款与实读事实）。

**① 逐项条款落点（号 → 改动 file:line · 落笔后现盘）**

| # | 源（批档） | 落点 file:line |
|---|---|---|
| 1 | §2.16 端侧触发面 | `docs/core/design/AGENT-LOOP.md:326-327`（§6.13——VSC 同源触发 + 两端 `turn` 同口径） |
| 2 | §2.16 / §2.17 钩子面 | `AGENT-LOOP.md:423`（§6.18 新行「生命周期钩子面（Stop + 派发四事件）」）· `:426`（权威注「八面 → 十面」联改） |
| 3 | §2.16 / §2.17 现态收正 | `AGENT-LOOP.md:145`（§3.1 A23 行）· `:20`（§1 归属表 hooks 行）· `:41`（§2.1 #111 行）· `:61`（§2.2 #169 行）——「VSC 零 `runHooks`」四处按现态注接线事实 |
| 4 | §2.17 / §2.19 工具面 | `docs/core/design/TOOLS.md:272-273`（§6.11「工具面接线」条——hooks 三调用点 + 台账查询两工具） |
| 5 | §2.18 guard 单点 | `AGENT-LOOP.md:120`（§2.3「guard 载体（相邻面 · 非本表字段集）」条——核单点 + 载体留端） |
| 6 | §2.18 helpers 读数 | `docs/core/design/CORE-UNIFICATION.md:886`（384 → 411，2026-09-20 实读） |
| 7 | §2.19 查询工具接线 | `CORE-UNIFICATION.md:1337`（§2.13.4 #174 行注） |
| 8 | §2.20 io.ask / permission 行 | `CORE-UNIFICATION.md:1283`（端侧列三端填法）· `:1090`（§2.8.1`permission.mjs` 行「消费者已接线」） |
| 9 | §2.20 #165 行（一致性面同题） | `CORE-UNIFICATION.md:1311`（#165「端侧接线」→「已落」） |
| 10 | §2.21 挂起面现态（三档同步） | `AGENT-LOOP.md:75-76`（§2.3 现态句）· `:134`（验收点 5 驱动面计划收正）· `AGENT-LOOP-SUBAGENT.md:1446-1447`（§6.27.12.2 尾句——「核 + CLI + VSC 三面」计划面删除、改述现态） |
| 11 | §2.21 CORE-UNIFICATION 三行 | `CORE-UNIFICATION.md:1288`（载体行注现态 + 双夹具验收句改「核内自证」）· `:1313`（#184 行）· `:1094`（§2.8.1 `suspension.mjs` 行） |
| 12 | §2.22 双改纪律行 | `AGENT-LOOP.md:424`（§6.18 新行；机检锚 = VSC 用例——归收口轮 coder 面，本轮不落） |
| 13 | §2.15 as-of 刷新 + 自查 | `AGENT-LOOP.md:558`（547 → **564**〔`find /c /v ""` 口径〕）· 本档 `:240`（车道 3 行：文件域补 `TOOLS.md` + 自查「已落」） |
| 14 | VSC-DEBT §12.1 | `docs/vsc/design/VSC-DEBT.md:273-281`（本批读数收正块 + `agent.mjs` 触发条件更新 + 测试档越线续登记） |

**逐档变更记录**（各 1 条）：`AGENT-LOOP.md:561-564` · `AGENT-LOOP-SUBAGENT.md:1967` · `CORE-UNIFICATION.md:1921-1924` · `TOOLS.md:536-537` · `VSC-DEBT.md:587-589`。

**② 收正表**

(b) 表述相抵收正（父侧裁定 = 收正 · 三处）：① §2.16 验收 #2 期望 1 → **2**（本档 `:295`；import 行 + 调用行——语义 = 恰一个调用点）② §2.18 验收 #6（本档 `:418`）——`agent-lifecycle-singleton.test.mjs` 零 guard 引用（名义覆盖）⇒ 改述并指向 `test/lifecycle-hooks.test.mjs` T-LH11（车道 2 补位）③ §2.19 边界④（本档 `:469`）——「运行期行为」→ **装配期、全深度、`try/catch` 外**（实测）。

(a) 读数收正（父侧汇总 · 实读落账；口径 `find /c /v ""` · 2026-09-20 实读）：

| 档 | 设计记 | 实读落账 | 落点 |
|---|---|---|---|
| `thincoder-core/agent/helpers.mjs` | 391 / 预估 ≤409 | **411** | 本档 §2.24 `:632` · CORE-UNIFICATION `:886` |
| `thincoder-vscode/src/agent/run-stages.mjs` | 377 / +12~16 | **402**（+25） | §2.24 `:621` · VSC-DEBT `:275` |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 393 / +10~14 | **407**（+14） | §2.24 `:622` · VSC-DEBT `:276` |
| `thincoder-vscode/src/agent/setup.mjs` | 481 / +5~8 | **489**（`find`；`read` 490 恰在触发线 ⇒ 下次触碰即触线） | §2.24 `:623` · VSC-DEBT `:277` |
| `thincoder-vscode/src/agent.mjs` | 483 / −2~−5 | **478**（−5） | §2.24 `:625` · VSC-DEBT `:274` |
| `thincoder-vscode/src/extension/permission-gate.mjs` | 109 / +2~4 | **117**（+8） | §2.24 `:630` · VSC-DEBT `:278` |
| `thincoder-vscode/test/files.mjs` | 110 / +4 | **116**（本批 +4 = 三条登记 `:112-115`；另 2 行 = 并行批次在途） | §2.24 `:627` · VSC-DEBT `:279` |
| `thincoder-vscode/test/ledger.test.mjs`（一致性面同题） | 248 / +20~30 | **324**（>300 咨询线 ⇒ 越线登记） | §2.24 `:629` · VSC-DEBT `:281` |

**③ 落地闸自查读数**（`node scripts/doc-check.mjs --root .`）：**锚：悬空 0**（闸态阈值 0，OK）· **行宽：源域 .md 零超宽**（OK）⇒ **本批净增 0**（零新增悬空 / 零新增超宽）。
读数口径 `find /c /v ""`：`AGENT-LOOP.md` **564** · `AGENT-LOOP-SUBAGENT.md` **1968** · `CORE-UNIFICATION.md` **1925** · `TOOLS.md` **537** · `VSC-DEBT.md` **589**（§2.24 `:638` 同步）。
**首检自纠**：本轮首笔落地的短形路径锚（`agent/suspension.mjs` / `agent/helpers.mjs`）与 7 行超宽已同轮即修（全文路径化 + 折行）⇒ 复检 0/0。

**④ 不一致处 / 上报**（只报 · 零动作）：

1. **VSC-DEBT §12.1 上行通道批块的 `agent.mjs 485 → 492` 与本轮实读不符**（HEAD `:483` / 现盘 478，`find` 口径）——该块读数口径 / 时点不可复现（`.git` 重建提交 `c90b08fb` 前后树差）；本轮按实读落账，旧块原文保留（历史面）。
2. **§5 两处读数与实测差**：`test/ledger.test.mjs` §5 记 254 → 316 ∥ 实测 HEAD 248 → 现盘 **324**；`test/files.mjs` §5 记 110 → 116 与实读同，但 +4/+6 归属含并行批次在途行（§2.24 `:627` 已注明）。
3. **`AGENT-LOOP-SUBAGENT.md:1443-1445` 挂起驱动坐标读数为旧值**（核 234 / CLI 301 / VSC 397 ∥ 实测核 240 / CLI 324 / VSC 430——后两档含并行批次在途改动）——不在本轮落点，归文档过期登记面（P3）。
4. **`test/subagent-queued-payload.test.mjs`（§2.22 机检锚）未落盘**——按父侧裁定归收口轮 coder 面；本轮纪律行已按「两面分列」落 `AGENT-LOOP.md:424`（不引用未落盘档，避免新增悬空锚）。

**变更记录**：2026-09-20（**P2 机制层端差批 · 车道 3 设计档落笔轮 · eng-designer**）：逐项条款落 14 处（5 档设计文档）+ 现态收正 4 处 + 表述相抵收正 3 处 + 读数收正 8 行 + as-of 刷新 1 处 + 车道 3 自查字段更新；`doc-check` 悬空 0 / 行宽 0（净增 0）。零产品码 / 零需求档 / 零他人段。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面限制**：本实例未获得文档地图（Document Map）与项目标准档声明 ⇒「文档归属」判据按 `AGENTS.md` 指引 + 各评审档内部一致性执行（降级）；`.md` 文档不受行数规则（判据本身豁免纯文档）。

**发现表（P2 机制层端差批 · 设计评审）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / 事实 | 🔴 | 批档 §2.16 边界②（`docs/batches/2026-09-20-mechanism-parity-batch.md:314`）与 §2.27-2（`:718`）断言核 Stop 载荷 `turn` 取自「段内计数」的 `_currentTurn`、端取「链内累计序数」的 `_turnSeq`，属「同字段异口径」；该断言还被写进待逐字照抄的代码注释（`:260-261`）并计划以「轮号口径注」落进 `docs/core/design/AGENT-LOOP.md` §6.13（`:316`）。实核：核 `_currentTurn` 由帧赋值（`thincoder-core/agent.mjs:208-209` ← `turnFrame(...).turn` = `seq`，见 `thincoder-core/agent/helpers.mjs:221-223`），即**链内累计轮号**，与 §6.13 载荷表（`docs/core/design/AGENT-LOOP.md:336`「链内累计轮号（跨段累计，与状态行同源）」）及端 `_turnSeq`（`thincoder-vscode/src/agent.mjs:167-175`）**同口径** ⇒ 口径差不存在，落笔即与同一节的载荷表互相矛盾（同机制两处描述不同 = 机制级矛盾）。 | 改法：删除「口径差」表述（代码注释与 §2.27-2 两处）；§6.13 的端侧触发面句按与 `AGENT-LOOP.md:336` 载荷表一致的表述收正（两端 `turn` 同为链内累计轮号）。实现侧取 `agent._turnSeq ?? 0` 本身无需改。 |
| 2 | Requirements / 现状 | 🟡 | §2.4（`:81`）称 VSC 里 hooks「对主会话不生效，**对子代理生效**」，与 §2.27-1（`:717`）「VSC `agent.config` 缺 `hooks` 段 ⇒ 只补调用点 = 钩子恒空转」互相矛盾。实核：子代 config = 父 config（`thincoder-core/agent-tools/subagent-spawn.mjs:341-348`）+ `runHooks` 读 `ctx.agent?.config?.hooks`（`thincoder-core/hooks.mjs:28`）+ VSC `agent.config` 字面量无 `hooks`（`thincoder-vscode/src/agent/agent-state.mjs:96-107`）⇒ 今日 VSC 子代理同样不触发，「对子代理生效」只在 config plumb 落地后成立。 | 改法：该句改述为「归一后子代经父 config 获 hooks、由核循环承载」（现状段标注其归一后态）；「只补 depth-0 派发」的范围结论不变。 |
| 3 | Clarity | 🟡 | §2.18 步 3（`:406`）删端侧 `INHERITED_GUARD_KEYS` 字面量（`thincoder-vscode/src/agent.mjs:27`）并改 `:366-370`，但未写 `thincoder-vscode/src/agent/run-stages.mjs:38` 的 import 面收正——该行现为 `import { ContinueError, INHERITED_GUARD_KEYS } from "../agent.mjs"`，导出删除后即非法具名导入（模块加载期硬失败）。全仓该符号仅 4 处（`agent.mjs:27/120` · `run-stages.mjs:38/368`）；§2.23 边界③（`:611`）仅以「以 §2.18 形态为准」指代。 | 改法：§2.18 步 3 明列「`run-stages.mjs:38` import 面删 `INHERITED_GUARD_KEYS`」，并把「VSC `src/**` 零 `INHERITED_GUARD_KEYS`」并入 §2.18 验收表 / §2.25 B 组反证。 |
| 4 | Document ownership | 🟡 | §2.21 的前提与落点需收正：① §2.8（`:146`）称与「无生产者」事实「并存但**未显式陈述**」——`docs/core/design/AGENT-LOOP-SUBAGENT.md:1446` 已显式陈述（就在所引 `:1443` 坐标段下一句）；② 落点写「§6.27.12.3（三端表）」（`:557`），但三端表/坐标段在 §6.27.12.2（`:1432-1446`，§6.27.12.3 标题在 `:1448`）；③ 落点清单未含仍以「端侧接线待落」叙述的两处（`CORE-UNIFICATION.md:1288` carrier 行 · `:1313` #184 行）与 `AGENT-LOOP-SUBAGENT.md:1446`「本批改动面 = 核 + CLI + VSC 三面」句 ⇒「判保留 + 核降参考」落笔后同档并存两种相反叙述。 | 改法：现态句改为**指回** `AGENT-LOOP-SUBAGENT.md:1446` 并同轮收正该句（或明标已废计划），节号改 §6.27.12.2；落点清单补 `CORE-UNIFICATION.md:1288`/`:1313`（或显式声明其为计划面不改）。 |
| 5 | Affected-file annotations | 🟡 | §2.24 表缺 `thincoder-vscode/test/files.mjs` 行（现盘 110 行）——四新用例档「须登记 `test/files.mjs`」（`:624`、`:300`、`:359`、`:529`、`:571`）即该档必被修改，表内只在新档行文本里提登记义务，无现盘行数/Δ 标注。 | 改法：§2.24 补一行（`thincoder-vscode/test/files.mjs | 110 | +4（四条登记） | <300 ✓`）。 |
| 6 | Clarity / 读数 | 🔵 | §2.9（`:162`）与 §2.11（`:204`）的 relay 面读数/坐标为 #118 前形态：映射表实位 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:94-108`（§2.22 `:570` 已用正确坐标），现行数 = 245 行（非 216）；§2.9 所引 `:71-81` 现为函数头/解析段。 | 改法：§2.9/§2.11 两处按现盘收正（坐标 `:94-108`、行数 245）或标 as-of。 |
| 7 | Acceptance | 🔵 | 验收命令三处口径：(a) §2.17 #3（`:356`）`findstr /c:"runHooks" …execute-tools.mjs` 期望 4——import 行同含 `runHooks` ⇒ 实命中 5 行；(b) §2.18 #4（`:415`）命令用 `\"` 转义（cmd.exe 非该转义），且该反证未收入 §2.25 B 组清单；(c) §2.22 T-QP5（`:579`）列四条作废源，漏 `⟦ev⟧stopped`（`thincoder-vscode/src/extension/panel-subagent-relay.mjs:116` 亦删缓存键）。 | 改法：(a) 期望改「≥4（含 import 行 = 5）」；(b) 换不携引号的 ASCII 锚并进 §2.25 B 组；(c) T-QP5 补 `⟦ev⟧stopped` 一档。 |
| 8 | Acceptance / 测试确定性 | 🔵 | T-LH7（`:310`）以「假脚本挂起 1s」验证非阻塞 = 墙钟依赖（脆弱测试）。 | 改法：改确定性缝——钩子进程先写到达标记再挂起，以标记/未决 Promise 顺序断言「未 await 钩子」，避开 1s 计时。 |
| 9 | Doc hygiene（数值） | 🔵 | 评审档自陈行数与现盘不符：`docs/core/design/AGENT-LOOP.md:550` 称「本档 as-of **547 行**」，现盘 = 553 行（§2.24 自身读数亦为 553）；车道 3 落笔后该自陈将进一步漂移。 | 改法：车道 3 落笔时同步刷新 as-of（或撤该自陈句）。 |

**正面核对（已实核无异常，不计条目）**：W8 静态闭包判据成立（`thincoder-core/hooks.mjs:24` 仅 `node:child_process` · `thincoder-core/permission.mjs:15` 仅 `node:readline` · `agent/helpers.mjs` 已在端壳闭包内——`thincoder-vscode/src/agent/setup-reminders.mjs:44/46`）；`ledger.mjs:202` 确 re-export 两查询工具；核 `dispatch.mjs:337-338` 阻断文案与 `:258/:314/:443/:457` 四调用点坐标全中；核 `agent.mjs:146-149` / `helpers.mjs:205-211` / `agent-state.mjs:96-107` / `panel-turn-loop.mjs:110/114/124` / `setup.mjs:125/131/162-163` 坐标全中；`test/files.mjs` + `test/run.mjs:51-56` 未登记即 fail-closed 成立；三档设计档行数（553/1964/1923）与所引节号/行号全部核对通过。

**计数**：共 9 条 —— 🔴 1 · 🟡 4 · 🔵 4。

VERDICT: changes-required

### 轮次 2（评审子代理）

**复核轮（承 §3 轮次 1 的 9 条 · 修正声明源 = 批档 §2.29）**

复核面限制：本实例未获文档地图 / 项目标准档声明 ⇒ 按 `AGENTS.md` + 档内一致性判据（降级）；`.md` 不受行数规则。

| # | Orig# | File | Severity | Status | Notes（本轮实读证据） |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批档 `:259`/`:315`/`:317`/`:722` + 源侧 | 🔴 | **Fixed** | 批档 `:259` = "// 轮号载荷 = 端壳 `_turnSeq`（链内累计轮号）——与核 `_currentTurn` **同口径**：核由帧赋值" · `:315` = "**同口径**（皆链内累计轮号；核 `thincoder-core/agent.mjs:209` ← `turnFrame().turn` = `seq`，`thincoder-core/agent/helpers.mjs:221-223`）" · `:317` = "轮号句：两端 `turn` 同为链内累计轮号，与同节载荷表 `:336` 一致" · `:722` = "轮号同口径（登记）… 两端**同口径**（一致于 … §6.13 载荷表 `:336`）"。现盘反证成立：`thincoder-core/agent.mjs:208-209` = "const frame = turnFrame(++agent._turnSeq, turn, maxTurns)" / "agent._currentTurn = frame.turn"；`agent/helpers.mjs:218/222` = "返回 { turn, maxTurns }：turn = seq（累计已跑轮数）" / "return { turn: seq, maxTurns: seq - turn - 1 + maxTurns }"；`docs/core/design/AGENT-LOOP.md:336` = "| `turn` | number | 链内累计轮号（跨段累计，与状态行同源） |"；`thincoder-vscode/src/agent.mjs:171-175` `_turnSeq` 仅 `!resume` 复位 ⇒ 两端确同口径。 |
| 2 | 2 | 批档 `:81` + 源侧 | 🟡 | **Fixed** | `:81` = "⇒ 缺口**只在 VSC depth-0 工具轮**：今日 VSC **主会话与子代理皆不触发**（`runHooks` 读 `ctx.agent?.config?.hooks`——`thincoder-core/hooks.mjs:28`；而 VSC `agent.config` 缺 `hooks` 段，§2.27-1）…归一（config plumb 落）后**子代经父 config 获 `hooks`、触发由核循环承载**"。腿证实读：`hooks.mjs:28` = "const hooks = ctx.agent?.config?.hooks?.[event]"；`agent-state.mjs:96-107` `agent.config` 七段、无 `hooks`；`subagent-spawn.mjs:343` = ": parent.config" + `:348` = "config: childConfig,"。 |
| 3 | 3 | 批档 `:407`/`:414`/`:674` | 🟡 | **Fixed** | `:407` = "① import 面 `:38` **删 `INHERITED_GUARD_KEYS`**（现行 = `import { ContinueError, INHERITED_GUARD_KEYS } from \"../agent.mjs\"` ⇒ 改 `import { ContinueError } from \"../agent.mjs\"`；…不删即**模块加载期硬失败**——非法具名导入）"；`:414` 验收 #2 期望 **0**（两档）；`:674` B 组反证同步；现盘 `thincoder-vscode/src/agent/run-stages.mjs:38` = "import { ContinueError, INHERITED_GUARD_KEYS } from \"../agent.mjs\"" ✓。 |
| 4 | 4 | 批档 `:146`/`:558`/`:560` + 设计档 | 🟡 | **Fixed** | `:146` = "…事实**已显式陈述于 `docs/core/design/AGENT-LOOP-SUBAGENT.md:1446`**（「核驱动现状 = 无生产消费方」）——未收正的是该句后半的**计划面**陈述…"；`:558` 节号改 **§6.27.12.2** + "**同轮收正 `:1446` 后半句**…**删除**…不留划改残迹"；新 ④ `:560` 补 `CORE-UNIFICATION.md:1288`/`:1313`。设计档实读：`AGENT-LOOP-SUBAGENT.md:1430` = "#### 6.27.12.2 唤醒事件族逐条实核（三路 + 一问）" · `:1446` = "**核驱动现状 = 无生产消费方**：…⇒ 本批改动面 = **核 + CLI + VSC 三面**…" · `:1448` = "#### 6.27.12.3 关键发现——唤醒 ≠ 开轮（第二要件）"（旧指针确错，已收正）。 |
| 5 | 5 | 批档 `:627` | 🟡 | **Fixed** | `:627` 新增行 = "| ①②③⑤（VSC 用例登记面 · 改） | `thincoder-vscode/test/files.mjs` | **110** | **+4**（四条新档登记） | <300 ✓；未登记 = 不跑（`test/run.mjs:51-56` fail-closed） |"；现盘该档末行 `:109` = "]"（`find` 口径 109 / `read` 口径 110——§2.29 `:749` 已登记，属声明排除面）。 |
| 6 | 6 | 批档 `:162`/`:204` | 🔵 | **Fixed** | `:162` = "VSC 消费 = 中继 `thincoder-vscode/src/extension/panel-subagent-relay.mjs:94-108`（映射表实位——…）"；`:204` = "（**245**——2026-09-20 实读；映射表 `:94-108`）"；现盘 relay `:94-108` = 四项映射 + `rememberQueued`、文件 245 行 ✓。 |
| 7 | 7 | 批档 `:357`/`:416`/`:581`/`:675` | 🔵 | **Fixed** | `:357` = "| 3 | … | ≥4（下界；**含 import 行实命中 5 行** = 四调用点 + import） |"；`:416` = "| 4 | `findstr /c:"for (const k of [" thincoder-core\agent.mjs` | 0（内联数组退场——核档该形态唯一实例即 `:148`）· 正向锚 … `restoreGuard` ⇒ ≥1 |"（并入 `:675` B 组）；`:581` T-QP5 = "…/ `⟦ev⟧stopped`（`:116`）/ … **五路逐路断言**"；现盘 `thincoder-core/agent.mjs:148` 该形态 1 处、relay `:116` = "if (rest.startsWith(\"⟦ev⟧stopped\")) { forgetQueued(panel, path.head); return emit({ status: \"cancelled\" }) }" ✓。 |
| 8 | 8 | 批档 `:311` | 🔵 | **Fixed** | `:311` = "…`await new Promise(() => {})`（**永不 resolve** ⇒ 进程存活；零墙钟计时）…（`process.kill(pid, 0)` 不抛）…（上限 2s——**就绪判据，非断言面**）"——1s 墙钟断言退场。 |
| 9 | 9 | 批档 `:240`/`:747` | 🔵 | **Fixed（登记 · 编辑待车道 3）** | `:240` = "…· `AGENT-LOOP.md` as-of 行（`:550`）按现盘刷新（§2.29-#9）"；`:747` = "⇒ **记入车道 3 清单**（§2.15 车道 3 行点名 + 本表）；**本轮不落设计档**（车道 3 面）"；现盘 `docs/core/design/AGENT-LOOP.md:550` = "本档 as-of **547 行**（**超 500 硬限**沿革在册）。"（仍 stale；档至 `:553`）——与建议时点一致。 |
| N1 | (new) | 批档 `:739` | 🔵 | New | `:739` 机检列 = "「同字段异口径」/「段内计数」**§2 内零残留**（UTF-8 感知核对：命中仅 §3 `:743` 评审原文；中文串不入 `findstr`——§2.25 末注）"——`:743` 实为 §2.29 自身表行（§3 起点 = `:757`）；该串在 §3 的落点 = `:767`。改法：坐标改 `:767`，并注明本节自指行 `:739` 亦含该串。 |
| N2 | (new) | 批档 `:613` | 🔵 | New | `:613` = "③ `src/agent/run-stages.mjs:38` 的 `INHERITED_GUARD_KEYS` 符号面以 §2.18 形态为准（同轮落则一并改指向核）。"——括注「改指向核」与修订后 §2.18 `:407`（**删**）+ 验收 `:414`（期望 0）相抵：照「指向核」引入该符号则验收 #2 必红。改法：括注改为与 §2.18 一致的「删（不自核引入）」。 |

**计数**：原 9 条 **9/9 落**（🔴1 · 🟡4 · 🔵4 全 Fixed）；新增 **2 条（🔵 ×2）**；无 🔴 / 🟡 遗留。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-20 05:45 父侧代签**——依据用户 05:15 逐字「**都按建议**」（八项方向已定案 · 评审点火权 + §4 批准权委托父侧，自缚三条件）。

**三条件核验**：① 评审 **pass（0 🔴）**（复核轮 id=33：**9/9 逐号复核全通过**；新捕获 2 🔵 全接受、均不阻塞）；② **修正轮（id=32）9/9 落地**（含原 🔴 =「同字段异口径」三处删除、改为「同口径」+ 帧赋值事实；实现侧取值未改）；③ **token 已签发**（值不落档——运行时凭证）。

**响应表（轮 1 · 9 条）**：Fixed = #1–#9 全落（#9 = 登记入车道 3 清单 · 编辑待设计档落笔轮）；新增 N1/N2（🔵 ×2）**接受、不阻塞**（已入 §3 轮次 2 表）。

**批准范围**：① **设计定稿**（批档 §1–§2 全段含 §2.15–§2.29）；② **实施 = 三车道**：**车道 1（核 + CLI）** —— `snapshotGuard`/`restoreGuard` 核单源 + CLI 转口（`permission.mjs` 单一权威 + TUI `io.ask` 缝）· **车道 2（VSC）** —— 依赖车道 1 导出（`run-stages.mjs:38` import 面删键 · 四调用点 · config plumb · ledger 两查询 · `ContinueError` 单类）· **车道 3（设计档 · 设计席笔）** —— 含 `AGENT-LOOP.md:550` as-of 刷新；③ **跨批扣重**：`#127⑤`（`ContinueError`）由本批落地 ⇒ P3 收口批**不得重复施工**（§2.27-5 已标）。

**收口预告**：三车道落定 → 逐条核 §2.25 判据链（13 正 + 4 反证 + 三包测试 + 机检净增 0）→ 收口（§6）+ 核销 #122 / #123 + 提交 + push。

## §5 实施记录（eng-coder）

### 车道 1（核 + CLI）· §2.18 核半 + §2.20 CLI 半（eng-coder · 2026-09-20）

**交付摘要**：#122③ 核侧 guard 快照/恢复单点落盘（`INHERITED_GUARD_KEYS` 七键 + `snapshotGuard` / `restoreGuard` 挂 `agent/helpers.mjs`；核写侧 `run-stages.mjs:203`、读侧 `agent.mjs:149` 换单点）；#123② CLI 半落盘（`src/cli/permission.mjs` 整档转口核 `permission.mjs`；TUI `interaction.mjs:59-76` 请示流程改经核 `io.ask` 缝，auto 档端特有行与行式预览 `formatPermission` 零变）。核 `permission.mjs` 本体零改；车道 2 / 车道 3 零触碰；列表外改动 0。

**决策透明表**

| # | 决策 | 依据 | 代价 / 备注 |
|---|---|---|---|
| 1 | `run-stages.mjs` helpers import 只增 `snapshotGuard`（该档零读侧消费点；`restoreGuard` 由 `agent.mjs` import 面增） | 强增 = 死导入；机检 #3 只数 `snapshotGuard` | 与 §2.18 行文「helpers import `:11` 增两符号」字面差一符号——实际两档合计增两符号（内审 O1 / advisor 均判「最小正确集，不构成 PARTIAL」） |
| 2 | 新测档内 `withNonTTY`（defineProperty 置 `process.stdin.isTTY=false` + 还原） | 真 TTY 下跑测试时默认通道会交互问答而挂死；T-PT3 需确定性非 TTY 窗口 | 属测试内部技法（未改产品面）；用例表未列，已披露 |
| 3 | 转口档保留 3 行注释头 | D2 单源可读性（读者需知权限单源去向） | 行数 5（§2.24 预估 ≈8）；注释不含 `@thincoder/core/…` 全串 ⇒ 机检 #1 仍 = 1 |
| 4 | 不新增核 helper 单测（advisor 🔵 #3） | §2.24 文件表未列核测试档；§2.26-7「不顺手优化」 | 上抛：可选补测（七键快照 / `in` 守卫 / null no-op） |

**改动清单（file → 落点 → Δ · 行数 = 本席实测）**

| 档 | 落点 | Δ |
|---|---|---|
| `thincoder-core/agent/helpers.mjs` | `ContinueError`（`:205-211`）后新增：七键清单（`:215-218`）+ `snapshotGuard`（`:221-225`）+ `restoreGuard`（`:229-232`） | 391 → 411（`find` 口径；node 换行计数 412）· Δ +20 |
| `thincoder-core/agent/run-stages.mjs` | import `:11` 增 `snapshotGuard`；写侧 `:201-204` 内联字面量 → `agent._inheritedGuard = snapshotGuard(agent)` | 248 → 244 · Δ −4 |
| `thincoder-core/agent.mjs` | import 面（`:30`）增 `restoreGuard`；读侧 `:147-150` 内联数组循环 → `restoreGuard(agent, g)` | 429 → 430 · Δ +1 |
| `thincoder-cli/src/cli/permission.mjs` | 整档转口（3 行注头 + `:4` 单行导出） | 48 → 4 · Δ −44 |
| `thincoder-cli/src/tui/interaction.mjs` | import `:3` 增核 `askPermission`（别名 `coreAskPermission`）；`:59-76` 请示流程改经核缝（auto 档 / 行式预览 / 批卡不动） | 133 → 137 · Δ +4 |
| `thincoder-cli/test/permission-transit.test.mjs`（新） | T-PT1 转口恒等 · T-PT2 假 io.ask · T-PT3 默认通道（`[deny]` + false）· T-PT4 TUI 缝 · T-PT5 行式预览保 | 0 → 123 · 新增 |

**判据链（先红 → 后绿 · 全 ASCII · cmd.exe）**

| 判据 | 改前（先红） | 改后（后绿） |
|---|---|---|
| `findstr /c:"export const INHERITED_GUARD_KEYS" thincoder-core\agent\helpers.mjs` | 0（exit 1） | 1 |
| `findstr /c:"snapshotGuard" thincoder-core\agent\run-stages.mjs` | 0（exit 1） | 2（import + 调用点） |
| `findstr /c:"restoreGuard" thincoder-core\agent.mjs` | 0（exit 1） | 2（import + 调用点） |
| `findstr /c:"for (const k of [" thincoder-core\agent.mjs`（反证） | 1（`:148` 唯一实例） | 0（exit 1） |
| `findstr /c:"@thincoder/core/permission.mjs" thincoder-cli\src\cli\permission.mjs thincoder-cli\src\tui\interaction.mjs thincoder-vscode\src\extension\permission-gate.mjs` | 0（exit 1） | 2（本车道两档；端半待车道 2） |
| `findstr /c:"export function formatPermission" thincoder-cli\src\cli\permission.mjs`（反证） | 1 | 0（exit 1） |
| `cd thincoder-cli && node --test test/permission-transit.test.mjs` | 3/5（T-PT1 恒等红 / T-PT2 假 io.ask 红） | 5/5 · exit 0 |

**包与结构面读数**：`thincoder-core && npm test` ⇒ **401/401 pass · exit 0**；`thincoder-cli && npm test` ⇒ **732/732 pass · exit 0**；`thincoder-core && node --test test/core-hygiene.test.mjs` ⇒ 5/5（`helpers.mjs` 已在 `SOFT_LINE_REGISTRY`，新读数 411/412 < 500）；`node scripts/doc-check.mjs --root .` ⇒ 悬空 1（存量 = `MODEL-SPECS.md` 并行会话在途档）+ 行宽 0 ⇒ **本批净增 0**。行为面抽查：helper 语义（七键 / `in` 守卫 / null no-op）实测等价；TUI 既有预览行用例（`test/integration/tui-basics.test.mjs:85`）随包全绿。

**内审与代码评审（本 session）**：内审（explore 分歧审计 · 只读）⇒ **clean**（四类偏差 0；🔵 观察 3 = import 符号数文义 / helpers Δ +20 超预估 / 转口档 5 行——已并入上表与上抛）。advisor 代码评审（轮次 1）⇒ **pass**（0 🔴；🟡 2 = 车道 2 协调项（非 must-fix）+ 咨询线在册债；🔵 4 = 核侧补测可选 / §2.24 读数漂移 / §5 记录（本节）/ 转口文案 parity 可复核面）。**fix round = 0**（无 must-fix）。终态 = **clean**。

**上抛**：① 车道 2 依赖已就绪（`helpers.mjs` 两 helper 已落盘）——端半硬前提 = 批档 §2.18 步 3（`run-stages.mjs:38` import 面删 `INHERITED_GUARD_KEYS`，不删 = 模块加载期硬失败）② 设计档读数收正（`helpers.mjs` 现盘 411/412；§2.24 `:632` 表 391 + 预估 ≤409）归车道 3 as-of 刷新 ③ 可选补测：核侧 `snapshotGuard` / `restoreGuard` 单测（现全仓 `test/` 零命中——advisor 🔵 #3）

### 车道 2（VSC）· §2.16 + §2.17 + §2.18 端半 + §2.19 + §2.20 VSC 半 + §2.23（eng-coder · 2026-09-20）

**交付摘要**：六项逐条落盘——① **§2.16** 端侧 Stop 钩子（`finalizeAgentTurn` 首部；fire-and-forget；载荷 `turn`/`reason`/`error`，轮号取 `agent._turnSeq ?? 0`）+ advisor-run 收口（`closeOpenCodeAdvisorRuns` 动态 import，`!autoTurn && !injectedAdvisor` 豁免）+ **config plumb 三处**（`setup.mjs` 读 `raw.hooks` → `cfgBag.hooks` → `agent-state.mjs` 的 `agent.config.hooks`）② **§2.17** 派发面 hooks 三调用点（PreToolUse 单点合流 readonly + 已批两路 · PostToolUse · PostToolUseFailure；阻断文案逐字同核 `Error: blocked by PreToolUse hook` + `meta:null` 零记账）③ **§2.18 端半**（端侧 `INHERITED_GUARD_KEYS` 常量与全部消费退场，改经核 `snapshotGuard`/`restoreGuard`；载体 `panel._guardCarry` 留端）④ **§2.19** 台账查询两工具经动态 import 入基础集（⇒ baseSet + tools + 子代装配面同核口径）⑤ **§2.20 VSC 半**（逐项门改经核 `askPermission` 的 `io.ask` 缝；面板卡载荷/队列/`promptId`/释放三路逐字保）⑥ **§2.23** `ContinueError` 单类转口 + `panel-turn-loop.mjs` 三处 `e.turns` → `e.turn`（用户可见文案零改）。**零触碰**：核侧 / CLI 侧（车道 1）· 设计档（车道 3）· 需求档 · `scripts/**` · 他批写域。**列表外改动 = 0**（新增/改用例档均落 §2.24 文件表内）。

**决策透明表**

| # | 决策 | 依据 | 代价 / 备注 |
|---|---|---|---|
| 1 | §2.17 PreToolUse 调用点加 `tool &&` 前置条件（设计「可照抄」片段未含该条件） | §2.17 文点 4 明文「未知工具（`!tool` 路径）保持零钩子」（核同——Phase 1 更前）；两处相抵取明文，插入点仍是设计指定位置（权限块后 / `onToolCall` 前） | 与片段字面差一条件；语义 = 与核一致。已由内审 O5 判「正确解，非简化」 |
| 2 | §2.16 收口块取 2 行形态（`const … = await import(...)` + 调用） | 核 `run-stages.mjs:193-194` 同形 + 设计片段同形 | 批档 §2.16 验收 #2 期望「1」与设计片段自身（符号出现两处）相抵 ⇒ 实测 2（上抛项 ③） |
| 3 | §2.19 import 面注释压至 2 行（Δ 控在 489） | §2.24 贴线档「落笔后复测；≥490 ⇒ 停笔上报」 | find 口径 **489**（<490 ⇒ 未触线）；read 口径 490（= ±1 口径 artifact，§2.29 已登记）——上抛项 ① |
| 4 | T-LH7 假脚本改「`setInterval` 保活 + 永不 resolve」 | 设计原文假定「永不 resolve ⇒ 进程存活」；Node 在事件循环空转时退出，挂起 Promise 自身不保活 | 断言语义不变（宿主已返回 ∧ 子进程存活）；属测试技法，已披露 |
| 5 | T-LH7 钩子条目 `timeout: 4000` + 就绪轮询窗口 2s | 批档 §2.16 声明就绪上限 2s；spawn 超时须 > 就绪窗口（advisor 🔵 #4 收口） | 仅夹具参数，不改核 `hooks.mjs` 默认（用户钩子 10s 语义零改） |
| 6 | 用例档内追加 **T-LH10**（config plumb 行为面）/ **T-LH11**（§2.18 端半快照/回填） | §2.16 步 3/4 验收面只有 grep（无运行实证）；§2.18 端半「等价」叙述 + 该路径零用例覆盖（内审 O5 / advisor 🟡 #2） | 皆为**同档内**追加（非新档、非登记面变更）；覆盖缺口闭合，用例表外新增已在此披露 |

**改动清单（file → 落点 → Δ；行数 = `find /c /v ""` 口径）**

| 档 | 落点 | Δ |
|---|---|---|
| `thincoder-vscode/src/agent/run-stages.mjs` | import 面 `:38-42`（hooks.mjs / helpers 两符号 / ContinueError 单符号）· Stop 钩子 `:283-295` · `injectedAdvisor` `:350-351`/`:371` · advisor 收口 `:377-383` · guard 回填 `:394` | 377 → **402** · +25 |
| `thincoder-vscode/src/agent/execute-tools.mjs` | import `:14-15` · PreToolUse `:173-178` · PostToolUse `:266-268` · PostToolUseFailure `:287-288` | 393 → **407** · +14 |
| `thincoder-vscode/src/agent/setup.mjs` | ledger 装配面 `:142-144` + `baseTools` `:167-170` · `cfgHooks` 声明/读入/cfgBag `:212`/`:238`/`:261` | 481 → **489** · +8 |
| `thincoder-vscode/src/agent/agent-state.mjs` | `agent.config.hooks` `:99-100` | 147 → **149** · +2 |
| `thincoder-vscode/src/agent.mjs` | 核转口 import `:6-7` · 键清单常量删除（原 `:25-27`）· `export { ContinueError }` `:40-43` · 读侧 `restoreGuard` `:117` | 483 → **478** · −5 |
| `thincoder-vscode/src/extension/permission-gate.mjs` | 核 import `:22` · 门体经 `io.ask` 缝 `:54-86` | 109 → **117** · +8 |
| `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 三处字段收正 `:110`/`:114`/`:124` | 164 · ±0 |
| `test/lifecycle-hooks.test.mjs`（新） | T-LH1–T-LH11（Stop 触发五态 / 载荷三态 / 非阻塞确定性缝 / 收口两态 / config plumb / §2.18 快照回填） | 0 → 268 |
| `test/dispatch-hooks.test.mjs`（新） | T-DH1–T-DH7（PreToolUse 放行·阻断·readonly 同测 / PostToolUse / PostToolUseFailure / 中止 / 前置门禁） | 0 → 223 |
| `test/permission-gate-seam.test.mjs`（新） | T-PT6–T-PT8（接缝载荷 + 作答 / AUTO 短路 / 两路释放） | 0 → 101 |
| `test/ledger.test.mjs`（改） | 追加 T-LQ1–T-LQ4 组 + 装配夹具（`hydrateRun` 直驱） | 254 → 316 |
| `test/turn-across-segments.test.mjs`（改） | 追加 T12（ContinueError 单类身份锁） | 154 → 165 |
| `test/files.mjs`（改） | 三条新档登记 `:112-115` | 110 → 116 · +6 |

**判据链（先红 → 后绿；「先红」= `git show HEAD:<档> \| findstr` 实测，与「后绿」= 现盘实测同命令对照）**

| 判据（§2.25 本车道各行） | 先红 | 后绿 |
|---|---|---|
| `findstr /c:"@thincoder/core/hooks.mjs"` run-stages + execute-tools | 0（exit 1） | **2** |
| `findstr /c:"closeOpenCodeAdvisorRuns"` run-stages | 0 | **2**（设计表列 1——见上抛 ③） |
| `findstr /c:"raw.hooks"` setup | 0 | **1** |
| `findstr /c:"hooks:"` agent-state | 0 | **1** |
| `findstr /c:"blocked by PreToolUse hook"` execute-tools | 0 | **1** |
| `findstr /c:"runHooks"` execute-tools | 0 | **4**（下界 ≥4 ✓；import + 三调用点） |
| `findstr /c:"PostToolUseFailure"` execute-tools | 0 | **1** |
| `findstr /c:"@thincoder/core/ledger.mjs"` setup | 0 | **1** |
| `findstr /c:"ledgerQueryTool"` setup | 0 | **2** |
| `findstr /c:"@thincoder/core/permission.mjs"` ×3 档 | 0 | **3**（CLI 两档车道 1 + 端 1） |
| `findstr /c:"@thincoder/core/agent/helpers.mjs"` VSC agent.mjs | 0 | **1** |
| `findstr /c:"snapshotGuard"` 核 run-stages + VSC run-stages | — | **4**（≥2 ✓） |
| **反证** `INHERITED_GUARD_KEYS` VSC 两档 | 2 + 2 | **0**（exit 1） |
| **反证** `for (const k of [` 核 agent.mjs | — | **0** |
| **反证** `extends Error` VSC agent.mjs | 1 | **0** |
| **反证** `ledger_query` setup.mjs | 0 | **0** |
| **反证** `e.turns` panel-turn-loop | 3 | **0** |

**包与结构面读数**：`thincoder-core && npm test` ⇒ **401/401 pass · exit 0**；`thincoder-cli && npm test` ⇒ **732/732 pass · exit 0**；`thincoder-vscode && npm test` ⇒ **823/823 pass · exit 0**（含 `engine-floor-guard` W8 契约② 静态闭包零 `node:sqlite` ✓ · 登记面 fail-closed ✓）；D 组定向：`lifecycle-hooks` **11/11** · `dispatch-hooks` **7/7** · `permission-gate-seam` **3/3** · `ledger` **14/14** · `turn-across-segments` + `agent-lifecycle-singleton` **25/25** · `child-permission*` + `webview-permission-batch-release` + `engine-floor-guard` **26/26**（全 exit 0）；`node scripts/doc-check.mjs --root .` ⇒ 锚悬空 **0** · 行宽 **0** ⇒ **本批净增 0**（本车道零 docs 改动）。

**内审与代码评审（本 session）**：内审（explore 分歧审计 · 只读）⇒ **四类偏差 0**（部分实现 / 静默简化 / 越界 / 文档漂移），观察 6 条（验收期望值 artifact ×2 · `setup.mjs` 贴线 · Δ 超预估 · `tool &&` 判「正确解」· 登记数 +3 对本车道完整）。advisor 代码评审（轮次 1）⇒ **pass**（0 🔴 · 🟡2 · 🔵3）。**fix round = 1**：🟡 #2（§2.18 空载体语义 + 覆盖点名）⇒ 追加 T-LH11 钉死；🔵 #4（T-LH7 三值不一致）⇒ 就绪窗口改 2s 与 spawn 超时 4s 同源化。另 3 条（🟡 #1 `setup.mjs` 489/490 贴线 · 🔵 #3 Δ 漂移 · 🔵 #5 装配期 import 面）判为**报告/上抛面**，零代码动作（#5 若改 depth 门会破 T-LQ2 语义）。终态 = **clean**。

**上抛**：① `setup.mjs` 现盘 **489（find）/ 490（read）**——贴 VSC-DEBT 触发线；按 §2.24 声明口径 489 < 490 **未触线**，请父侧落账并择定口径 ② Δ 漂移三处：`run-stages.mjs` +25（预估 +12~16）· `execute-tools.mjs` +14（预估 +10~14 上界）· `test/files.mjs` +6（表列 +4）——建议随车道 3 as-of 收正 ③ 批档 §2.16 验收 #2 期望「1」与设计片段（符号两处）相抵，实测 **2**（语义 = 恰一个调用点）④ §2.18 验收 #6 点名 `test/agent-lifecycle-singleton.test.mjs` 为「既有 guard 继承用例回归」，实测该档零 `_guardCarry`/`inheritedGuard` 引用 ⇒ 覆盖为名义（已由本车道 T-LH11 补位；批档表述建议收正）⑤ §2.19 边界④「运行期行为」与实现（装配期、全深度、`try/catch` 外）不符——未改代码（depth 门会破 T-LQ2）⑥ §2.22 机检锚档 `test/subagent-queued-payload.test.mjs` 未落盘 / 未登记，§2.15 车道表未列 §2.22 而其锚自标「车道 2」⇒ 归属互斥，请父侧裁定（本车道按任务书未实施）⑦ T-LH7 参数三值已同源化（批档 2s · 轮询 2s · spawn 超时 4s）。

**变更记录**：2026-09-20（**P2 机制层端差批 · 车道 2 实施轮** · eng-coder）：六项（§2.16 / §2.17 / §2.18 端半 / §2.19 / §2.20 VSC 半 / §2.23）逐条落盘 + 新增用例档 3 档（T-LH×11 / T-DH×7 / T-PT×3）+ 改用例档 3 档（T-LQ×4 / T12 / 登记 +3）；三包全绿（401 / 732 / 823）· 机检净增 0 · 列表外改动 0。

### 收口轮（单件 · §2.22 机检锚）（eng-coder · 2026-09-20）

**交付摘要**：§2.22 机检锚落盘——新档 `thincoder-vscode/test/subagent-queued-payload.test.mjs`（T-QP1–6 六例：载荷逐 kind 对表 · 缓存单源 · **五路作废点**（含 `⟦ev⟧stopped`——§2.29 #7(c)）· 重生投影同形）+ `test/files.mjs:116` 登记行。**零产品码 · 零设计档 · 零核面 · 零 `scripts/**`**（本单件 = 测试档 only）。**列表外改动 = 0**。

**改动清单（file → 落点 → Δ）**

| 档 | 落点 | Δ |
|---|---|---|
| `thincoder-vscode/test/subagent-queued-payload.test.mjs`（新） | T-QP1 slot（`:49`）/ T-QP2 wait（`:58`）/ T-QP3 depc（`:67`）· T-QP4 缓存单源（`:78`）· T-QP5 五路作废点 + 邻键零误伤（`:102`）· T-QP6 重生投影同形 + 缓存缺省降级（`:130`） | 0 → **160 行**（<300 ✓） |
| `thincoder-vscode/test/files.mjs`（改） | `:116` 登记行（车道 2 组末——未登记 = 不跑；`test/run.mjs:51-56` fail-closed） | 现盘 **117 行** · 本单件 +1 |

**T-QP1–6 读数（现盘 · 全绿）**：T-QP1 `{kind:"slot", position:2, waiting:null, reason:null}`（全载荷 deepEqual，含 `type/role/id/status`）· T-QP2 `{kind:"wait", waiting:"waiting-deps", reason:<detail 原文>}`（含中文/全角逐字透传）· T-QP3 `{kind:"depc", waiting:"dependency-cancelled", reason:<detail>}` · T-QP4 缓存四项与同点载荷逐字段等值 + 未消费键 `null` + 跨面板隔离 `null` · T-QP5 五路逐路（每 leg：queued 先到 ⇒ 缓存在位 ⇒ 触发行消费 ⇒ 键删除 `null`）+ 邻键零误伤 · T-QP6 投影四条与中继面载荷 deepEqual 全等 + 缓存缺省形恰 `{...position}`（无 `kind/waiting/reason`）。

**先红后绿（留痕）**：五路作废点实现已由 #118 R1 落盘 ⇒ 现盘直跑即绿；红痕 = **变异探针**（`module.register` + data: URL 内存 loader 注入 · **零盘面改动**；`node --test` 的用例子进程不继承父侧 `--import`（argv 与 NODE_OPTIONS 两路实测皆不达）⇒ 探针走**进程内直跑**）：① 零变异 ⇒ **6/6 绿（exit 0）**；② **仅停用 `⟦ev⟧stopped` 路 `forgetQueued`** ⇒ **T-QP5 恰该路红**（断言文本 `"stopped（运行中取消——§2.29 #7(c) 补入路）：缓存键删除…"`，exit 1；余 5 例绿）——即 §2.29 #7(c) 所补「四源表漏 stopped」的正是此红面；③ 五路作废全停用（`forgetQueued` 空转）⇒ T-QP5 红（首 leg 断）；恢复 ⇒ 全绿。

**包与结构面读数**：`thincoder-vscode && node test/run.mjs` ⇒ **829/829 pass · exit 0**（T-QP1–6 在册实跑——日志内六例 ✔ 均在场）；定向 `cd thincoder-vscode && node --test test/subagent-queued-payload.test.mjs` ⇒ **6/6 · exit 0**；`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ exit 0（锚悬空 **0** · 行宽 **0** ⇒ **净增 0**——本单件零 `.md` 面）。

**内审与代码评审（本 session）**：内审（explore · 只读分歧审计）⇒ **四类偏差 0**（部分实现 / 静默简化 / 越界 / 文档漂移），观察 3 条（批档坐标陈旧 · 批档 `test/files.mjs` 计数差 · T-QP5 单例 test 的失败定位）——均属报告面。**fix round = 1**：采纳内审建议（T-QP5 每 leg 在「前置 token 后」再断言缓存在位 ⇒ 封死「前置自身清缓存 ⇒ 末判 `null` 空转通过」的假绿空窗）；复跑 6/6 绿 + red-A 复现。advisor 代码评审（轮次 1）⇒ **pass**（0 🔴 · 0 🟡 · 2 🔵 可选项，均标「非必改」）。**终态 = clean**（评审对象 = 交付物，评审后未再改动——D5 冻结窗）。

**上抛**：① **§2.22 验收第二条 `findstr /c:"depc" docs\core\design\AGENT-LOOP.md` ⇒ ≥1 现盘不命中（0）**——`:424` 纪律行以「三 kind」表述、未枚举 `depc`（大小写敏感口径全档零命中；忽略大小写命中仅 `:191` `assertNoDepCycle`）。属设计档面（车道 3 写域）⇒ 本单件未动；请父侧择定：纪律行补三 kind 的 ASCII 枚举锚 / 改验收锚为现盘可命中串 ② 批档 §2.22 T-QP5 行（`:581`）与 §2.29 #7(c) 的坐标 `:91/:112/:116/:117/:118` 与现盘五路实位（`panel-subagent-relay.mjs:101/123/129/130/131`）不符；`AGENT-LOOP.md:424` 标 `105-118`（queued 分支实位 `105-119`）——文档面 as-of 收正归车道 3 ③ `test/files.mjs` 现盘 117 行（本单件净增 1 行 = `:116`）；批档 §2.24/§2.29 声明基线 110 → +4（同批他件增量已由车道 2 上抛 `:977-②`）④ advisor 两条 🔵 未采纳（披露）：(a) T-QP5 五路共用单例 test ⇒ 首路失败中断后路（可拆 5 例——设计行「逐路断言」已由逐 leg 三条断言 + leg 名消息满足，非必改）；(b) 端侧锚射程残口——核侧**新增第四 kind** 会被 `panel-subagent-relay.mjs:115` 三目静默归入 `waiting-deps` 且本档零覆盖（可加只读源锚，先例 `test/files.mjs:104` 记的「含对端源锚」式；超 §2.22 T-QP 表定案射程，未加）。

**变更记录**：2026-09-20（**P2 机制层端差批 · 收口轮单件** · eng-coder）：§2.22 机检锚档落盘 + 登记；定向 6/6 · 包 829/829 · doc-check 净增 0；红痕以内存变异探针留取（stopped 路 ⇒ 恰该路红）；内审 0 偏离 · advisor pass · 终态 clean。

## §6 验证与收口（父代理）

**2026-09-20 07:00 父侧收口**

**交付核验（四轮）**：车道 1（#34 · 核 + CLI）✓ · 车道 2（#37 · VSC 六件）✓ · 车道 3（#38 · 设计档 5 档 · 14 处条款落点）✓ · **收口单件（#39 · §2.22 机检锚 T-QP1–6）**✓ —— **四轮 advisor 终态全 clean**（车道 2 走 pass → fix 1 → pass；收口单件 pass 0🔴0🟡）。

**读数**：core **401/401** · CLI **732/732** · VSC **829/829** ✓ · `doc-check` 本批面**净增 0**（悬空 0 · 行宽 0）✓ · 13 正 + 5 反证判据链全红→绿 ✓（含 `⟦ev⟧stopped` 路的**内存变异红痕**——证明测试有牙 ✓）。

**角色表**：设计席（§2.15–§2.30 全落）· 实施三轮（已交）· 父侧 §4 代签（05:45）· 批档 §6 本笔。

**台账**：**#122 / #123 → 待核销 → 已核销** ✓；余项入账（`#133` 产者侧序缺陷 · `#135` 收口项四则）。

**遗留（显式）**：① §2.22 验收第二条锚不可命中（`findstr /c:&quot;depc&quot;` ⇒ **0**——纪律行未枚举三 kind）⇒ 归 **P2 收口尾项**（父侧小改或设计席补）；② 五路坐标 as-of 与 `AGENT-LOOP.md:424` 行号偏 1 ⇒ 文档面 as-of 收正；③ advisor 🔵 未采纳两条（五路共档 / 端侧第四 kind 残口）⇒ 已登记；④ 核面 `hooks.mjs` 定时器未 unref（#135-④）。

**提交**：待 `commit + push`（路径限定）。