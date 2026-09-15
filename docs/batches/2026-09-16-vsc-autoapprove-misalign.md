# VSC 顶层 `agent.autoApprove` 字段缺失（VSC-AUTOAPPROVE-MISALIGN）· 批次记录（2026-09-16）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-16 · 来源 = 用户「修一下错位」（01:47）+「可以，落批次档」（01:49）。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮待发 · 执行宿主 = CLI**（2026-09-16——**VSC 宿主内本缺陷自身即阻塞：它让自动轮 spawn 恒被拒**；§1 已备齐诊断与修法方向）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 需求池「VSC `agent.autoApprove` 字段缺失」条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> **同链前序缺陷**（VSC 侧，均已修并收口）：
> ① `agent.tools` 未装配 = `docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md` · ② 子代工具表重名 = `docs/batches/2026-09-15-vsc-tool-table-dup.md`
> ③ 子代理面板通道生产者缺失 = `docs/batches/2026-09-16-vsc-subagent-panel-channel.md` · ④ 压缩后推理链回传断裂 = `docs/batches/2026-09-16-subagent-reasoning-echo.md`。
> 上游：台账 `docs/TODO.md` · 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2——本档不重述）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 · 执行宿主 = CLI（2026-09-16）**——用户 01:47 裁定「修一下错位」；本档即刻编制（01:49 用户批准）。
本缺陷是 2026-09-15/16 VSC 端实测暴露的**同链第五处**（前四处均已修并收口），也是**当前唯一阻塞 5 批设计轮推进**的那一处。

### 用户裁定与澄清（2026-09-16）

| 时点 | 内容 |
|---|---|
| 01:45 | 用户问「为什么会发生这么奇奇怪怪的现象，何必做这种奇怪的限制」→ 父侧查得：限制本身 = §17 D-S6 manual 档 spawn 门（设计如此），**怪的是触发条件与豁免条件错位** |
| 01:47 | 用户「**修一下错位**」 |
| 01:49 | 用户「**可以，落批次档**」= 批准建立本批（诊断入档、修法方向交设计轮） |

### 批次条目（本批 = 台账需求池一条；原文与证据以台账为准）

| # | 台账条目 | 症状 | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md` 需求池「VSC `agent.autoApprove` 字段缺失 ⇒ 核侧读点恒按非 AUTO 判」 | 自动轮 spawn 恒被拒 + 子代理写盘恒被拒 + 报告进来必须用户再发一句话才能跨步（AUTO 开着也一样） | 见下「修法方向」——经设计轮裁决后单笔落地 + 机判断言 |

### 症状（三个现象 · 同一根因）

| # | 现象 | 逐字报错 / 表现 |
|---|---|---|
| ① | **自动轮 spawn 恒被拒** | `{"status":"error","error":"cannot spawn subagents from a manual auto-turn — wait for user input"}`——**AUTO 已开亦如此**（2026-09-16 01:45 实测，同轮两次） |
| ② | **子代理写盘恒被拒** | `Error: permission denied by user`——**AUTO 打开（01:38）之后仍被拒**（01:45 批 5 designer 实测；批 2 实测 5 次；批 3 / 批 4 各一次） |
| ③ | **每份报告都需用户再发一句话** | 自动轮恒被判 manual ⇒ 不可跨步 spawn ⇒ 交替卡死（父侧实测 01:40–01:49 连续三轮） |

### 根因（父侧实核 —— designer 不必重探）

**核侧读「字段」，VSC 只提供「闭包」，字段从未被赋值。**

| # | 事实 | 坐标 |
|---|---|---|
| 1 | 核侧读 `parent.autoApprove`（**字段**，非 getter） | `thincoder-core/agent-tools/subagent.mjs:258`（spawn 门）· `:184`（escalate 门）· `thincoder-core/agent-tools/subagent-spawn.mjs:305`（**子代权限继承**）· 另见 `escalate-async.mjs:225/240` · `subagent-run.mjs:155` · `subagent-scheduler.mjs:141/210/270` · `async-settle.mjs:243` |
| 2 | VSC 顶层 agent 的字段表**不含 `autoApprove`** | `thincoder-vscode/src/agent/setup.mjs` `buildTopLevelAgent()`（逐字段读过：`_tasks` / `_goal` / `_touchedFiles` / `_inAutoTurn` … 无 `autoApprove`） |
| 3 | VSC 的 live AUTO 值走**闭包** | `thincoder-vscode/src/agent.mjs:56`（`autoApprove` 参数）· `:64`（`getAuto = typeof autoApprove === "function" ? autoApprove : () => autoApprove`）；面板传 `() => panel._autoApprove`（`thincoder-vscode/src/extension/panel-chat.mjs:427`） |
| 4 | 该闭包**只喂两处** | 工具审批面（`agent/execute-tools.mjs` · `agent/tool-gates.mjs`）与 digest 提醒判定（`thincoder-vscode/src/agent.mjs:123` `if (autoTurn && !getAuto())`）——**不含 spawn 门** |
| 5 | ⇒ VSC 的 `agent.autoApprove` **恒 `undefined`** ⇒ 表 1 全部读点按「非 AUTO」判 | 由 1–4 直接导出 |

**对照面（同一对象两套判据）**：父侧（主会话）**写盘一直正常**——工具审批面用的是 live getter（表 4 第一项）；而 spawn 门 / 子代权限继承读的是字段（表 1）⇒ **同一 agent 上两条判据不一致**，这就是「错位」。

### 未解项（设计要求一并核 —— 父侧不猜）

**AUTO 提醒的注入源**：`ensureAutoReminder` 需 `agent.autoApprove` 为真才注入（`thincoder-core/agent/helpers.mjs:19`），
但用户会话槽 history 中**确有 3 条 AUTO 提醒**（01:38:21 · 01:42:18 · 01:43:43，实测读数）——与表 5 的「恒 undefined」**表面矛盾**。
候选注入源（未定位）：`thincoder-core/session.mjs` 的槽恢复路径（`agent.autoApprove = data.autoApprove ?? false`）。
⇒ 设计要求给出**明确解释或反证**（若确另有赋值路径，表 5 的结论须相应收正——**这是本批的关键待核项**）。

### 修法方向（供设计轮裁决——父侧不代裁）

| # | 方向 | 说明 | 代价 / 风险 |
|---|---|---|---|
| **A** | VSC 在 `hydrateRun` 的 run 绑定块写 **`agent.autoApprove = getAuto()`**（与 `_inAutoTurn` 同处、每轮重指） | 与既有「每轮重指」范式一致；一处补齐 | 动 VSC 装配面（同 `agent.tools` 那次的形态，已证可行） |
| B | 核侧读点改读端传 getter | 语义更「真」 | 改核共享语义 + 端传参，面更大（CLI 侧须零回归） |
| C | `applySlotSessionState` 回填槽值 | 改动最小 | **槽是快照、非 live** ⇒ 与「中途 toggle 生效」的既有语义不符（`permission-gate.mjs` 明说两源：槽快照 + live 标记） |

**父侧倾向 = A**（与 `agent.tools` 缺口同形：VSC 装配面补齐核侧读点所需的字段）。

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **复现判据（可机器验证）**：AUTO=on 时，从**自动轮**发起 `subagent` spawn ⇒ 修复前必返该 JSON 错误；修复后必成功。
   最小驱动面 = 现有 tester 形态（`thincoder-vscode/test/integration/host-shape-spawn.test.mjs` 的 `buildProbe` 先例）+ `_inAutoTurn=true` 注入。
2. **宿主约束**：VSC 面板内**无法 spawn**（本缺陷自身即断点）⇒ 本批设计轮与实施轮的 spawn 必须发生在 **CLI 宿主**。
3. **三处读点须一并覆盖**：spawn 门（`:258`）· escalate 门（`:184`）· **子代权限继承**（`subagent-spawn.mjs:305`）——只补一处 = 症状部分残留。
4. **机检/测试面**：现有回归测试用 mock provider，**不覆盖权限面**（同链前序批次已两次因此漏检）⇒ 设计要求明确「该缺陷靠什么机判拦住」。
5. **分工口径**（改到哪模块 ⇒ 同步修该模块权威档）= 承 `docs/batches/2026-09-15-vsc-core-wiring.md` §1（三层分工）。
6. **迁移期档性**：权威文档层 = `docs/core/**` · `docs/cli/**` · `docs/vsc/**`；产品树 `docs/**` = 迁移期参照历史（保留 ≠ 维护，`docs/README.md:4`）⇒ 坐标按现状实核重锚。
7. 结构纪律：档 ≤300 行软线 / ≤500 硬限；`thincoder-vscode/src/agent/setup.mjs` 与 `thincoder-core/agent-tools/subagent-spawn.mjs` 两档均须给**行数增量与超线判断**。

### 批次边界（明确不做）

1. 不重开同链前序四批（见档头「同链前序缺陷」）——本批是**第五处**，独立建批。
2. 不改 `§17 D-S6` 的**规则本身**（manual 档不许跨步 = 设计如此、用户既定）；本批只修**豁免判据为何失效**。
3. 不改 5 批（`docs/batches/2026-09-15-{core-defect-fixes,check-tooling-debt,eng-discipline-prompts,cli-async-discard,doc-contract-reconcile}.md`）的 §1——它们仍待设计轮启动（**本缺陷不修则它们推不动**）。
4. 不改台账 / 不改本档 §1。

---

## §2 批次任务（eng-designer）

**状态：设计就绪待评审**——交付 = 本任务书 + 涉模块权威档收正（已落，见 2.11；实施笔 §5 零重复触碰）。发起评审 = 用户 / 主 agent（本子代理不发起）。

**依据** = 本档 §1（主 agent 实核）；**本席复核** = 直读取证（零 explore 委派——勘察预算 0/6 未用）；**任务映射** = 必核三件 → ①未解项 = 2.1 D；②三处读点 = 2.1 A/B；③机判面 = 2.7 + AC5。交付两件 → ①本段（§2）②文档收正 = 2.11。根因链 §1 表 1–5 逐点复核一致；修法方向独立裁决 = **A 家族 · 形态升级 A′**（2.2）。
**三方条目一致**：台账 `docs/TODO.md:47`（需求池 1 条）↔ 本段验收条目（2.6）↔ 设计事实行（`docs/core/design/AGENT-LOOP.md` §6.18 :395——已落）。

### 2.1 复核增量与未解项结论

**A 读点全清单（核树 grep 实证——§1 表 1 的完整化）**

| # | 读点（字段面） | 坐标（实核） | 本批处置 |
|---|---|---|---|
| ① | spawn 门（manual auto-turn 拒） | `thincoder-core/agent-tools/subagent.mjs:258` | ✓ 覆盖 |
| ② | escalate 门 | 同档 `:184` | ✓ 覆盖 |
| ③ | 子代权限继承（childPermission 装配） | `subagent-spawn.mjs:305`（+ `:453-455` childOpts） | ✓ 覆盖 |
| ④ | escalate async/sync 子权限与续跑 | `escalate-async.mjs:225` · `:240` · `subagent-actions.mjs:437` · `subagent-run.mjs:155` | ✓ 覆盖 |
| ⑤ | 调度器（depc / 补位 / 停滞） | `subagent-scheduler.mjs:141` · `:210` · `:270` | ✓ 覆盖 |
| ⑥ | settle 注记 | `async-settle.mjs:243` | ✓ 覆盖 |
| ⑦ | AUTO 提醒（核面） | `agent/helpers.mjs:19`（`ensureAutoReminder`） | 不适用（2.1 D③） |
| ⑧ | 子代理自身 dispatch 免审 | `agent/dispatch.mjs:253`（读**子代自身**字段） | 不动（2.4 D7） |
| ⑨ | 顶层 dispatch 免审 | `dispatch.mjs:253` | CLI-only——不动 |
| ⑩ | 槽持久化/恢复 | `session.mjs:129`/`:300` · `session-slot-write.mjs:127` · `token-ttl.mjs:257` | 不动（CLI 槽面） |

**B 三处必覆盖判**：①②③ 同以**父对象**（`ctx.agent` = VSC 顶层 agent）为读源——`subagent.mjs:209`（`const parent = ctx.agent`）→ `buildSpawnChild(parent, …)`；scheduler / settle 同源对象。⇒ 单一接线点**同时覆盖三处**，无「只补一处」的残留面。
**C 邻接实核（零改面）**：`execute-tools.mjs:119`（端审批门）· `tool-gates.mjs:141`（批确认门）· `agent.mjs:123`（digest 域判定）· `agent.mjs:211`（AUTO 提醒注入）· `run-helpers.mjs:257-262`（压缩后回注）——均经 `getAuto` 闭包 live 读取，现状正确、不动。

**D 未解项结论（§1「未解项」）：不收正——表 5 成立。** 三条证据链：

① **直读实况**（本席读 VSC 面板会话槽 `C:\Users\liwei\.thincoder\sessions\…38478126….json.36`——cwd `D:\teamcode`）：精确串 `AUTO_REMINDER` 在**机读线**（`contextHistory`）仅 **1 条**（索引 68 · role=user · **无 `ts` 字段**）；**人读线**（`history`）零精确命中。
② **「3 条」= grep 假阳**：父侧报的 3 个时点（01:38:21 · 01:42:18 · 01:43:43）实为父侧自己 3 条讨论消息的 `ts`（索引 322 / 341 / 350——均 assistant · 内容系引述该提醒串）；父侧 01:46 读数脚本按子串命中了自己的消息，「注入时点 = 01:38:21」的推断同源于此。
③ **注入源穷举 + 赋值反证**：该会话唯一活注入点 = `thincoder-vscode/src/agent.mjs:211`（`getAuto()` 门——闭包不读字段；机器线单写 · 无 ts——与 ① 实测形态逐点吻合）。
核 `ensureAutoReminder`（字段门）在 VSC 树**零调用点**（全树 grep——仅核侧 `core/agent/run-stages.mjs:70` · `core/agent/setup.mjs:243`；双端同一常量 `AUTO_REMINDER`——`setup-reminders.mjs:31` 转口核 `helpers.mjs:14`——故按调用点枚举定源）。
VSC 树 `agent.autoApprove =` **零命中**，核侧唯一运行时赋值 `session.mjs:300` 属 CLI 槽恢复（VSC 不达——`session-io.mjs` 只取 `loadSlotFile`/`saveSlotData` 等）⇒ **无另一赋值路径**。
（附：§1 表 4「闭包只喂两处」补全——提醒面实有**两个** getter 消费点：`agent.mjs:211` 循环头 + `run-helpers.mjs:262` 压缩后回注；均不含 spawn 门，主结论不变。）

### 2.2 方案选型（独立裁决）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| A | `hydrateRun` B 块每轮赋值 `agent.autoApprove = getAuto()` | 单点覆盖 ✓ · 实现最简 ✓ · **取值 = 轮首快照**——轮中翻转不达核读点（与 CLI 字段 live 语义、端面板 mid-turn doctrine 不一致——同类错位窗口残留） | 快照时延 | 否决（形态升级为 A′） |
| **A′** | 同落点**访问器**：`defineProperty(agent, "autoApprove", { get: () => autoProbe() === true, enumerable: true, configurable: true })` | 单点覆盖 ✓ · **取值恒 live**（= CLI `cmd-auto.mjs:7` / `key-modes.mjs:62` 字段翻转语义 ✓；= 端面板 doctrine（`permission-gate.mjs` 头注「mid-turn 立即生效」）✓）· 先例 = `agent.mjs:144-150` 载体访问器别名（同文件同形态）✓ · 无 setter——零写入方实证（grep）⇒ 未来写入方失败显性（fail-loud）✓ | 无 | **选定** |
| B | 核读点改读端传 `ctx.getAuto` | 面大：改核共享读点（3+ 处）+ 需 CLI 零回归证明 + `ctx.getAuto` 对核**零消费者**（死传参——`execute-tools.mjs:205` 注释与实现不符，另报）⇒ 双读路径（getter ∥ 字段）= 新判据分裂源 | 面大 + 新分裂源 | 否决 |
| C | `applySlotSessionState` 回填槽值 | 槽 = 持久快照非 live（轮中翻转不达）；纯函数须扩 `getAuto` 形参（签名波及 `agent-lifecycle-singleton` 单测锚面）；语义错位（槽层 ≠ 活值层） | 语义错位 | 否决 |
| D | 面板 toggle 双写 `panel._agent.autoApprove` | 双源写入（面板 flag + agent 字段）；agent 未建 / destroy 重建 / 换槽各路径须补写——漏写点 = 新错位源 | 双源 | 否决 |

**与 §1 父侧倾向的关系**：同向（A 家族——VSC 装配面补齐字段），**形态升级 A → A′**（快照 → live）——理由见上表第 A′ 行；未否决父侧方向，只收紧取值语义。

### 2.3 接口契约（访问器——实现锚）

| 项 | 契约 |
|---|---|
| 落点 | `thincoder-vscode/src/agent/setup.mjs` `hydrateRun`「B 类 run 绑定」块（现 `:478` 起 · `agent._role = role` 邻区） |
| 形态 | `const autoProbe = typeof getAuto === "function" ? getAuto : () => false`（normalize——同 `agent.mjs:64` 归一语义；`getAuto` = hydrateRun 既有形参——**现状已传未用**，本批启用）+ `Object.defineProperty(agent, "autoApprove", { configurable: true, enumerable: true, get: () => autoProbe() === true })` |
| 语义 | 读 = `getAuto()` 实时值归布尔；每轮 hydrate 重定义（复用单例换轮换闭包）；无 setter（写入即 TypeError——fail-loud）；`enumerable: true`（spread / JSON 反映值——与数据字段外观一致） |
| 数据流 | `panel._autoApprove`（面板唯一来源）→ `getAuto`（`agent.mjs:64` 归一）→ hydrateRun 访问器 → 核字段读点（2.1 A ①–⑥）∥ 既有 getter 消费点（端审批门 / digest / 提醒——零改） |
| 不动面 | `buildTopLevelAgent` 工厂零改（访问器定义在 hydrate = 全部装配路径的单一入口）；`agent-state.mjs` 纯函数层零改；核树零改（CLI 零回归由「不触核」构造性保证） |

### 2.4 关键决策记录

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| D1 | 落点 = hydrateRun B 块（非工厂 / 非 `agent.mjs` / 非 `agent-state.mjs`） | 生产宿主形状测试面直接驱动（`host-shape-spawn.test.mjs` 先例）；`agent.tools` 修复同形先例（提交 `9a0ec8e4`）；工厂无 `getAuto`；agent-state 纯函数层无该形参 |
| D2 | 形态 = live 访问器（非每轮赋值） | 2.2 A 行 vs A′ 行判据；CLI 字段 live 语义 + 端面板 mid-turn doctrine |
| D3 | 无 setter | 零写入方实证（全树 grep）；未来写入方 = 双源缺陷——fail-loud 优于静默 |
| D4 | 测试 = 新档 `thincoder-vscode/test/integration/vsc-autoapprove-field.test.mjs` + `files.mjs` 登记（非改造 host-shape-spawn） | 单点单档（登记即跑——漏登记 = 启动自检 fail）；host-shape 档保持既有面零改 |
| D5 | 文档收正 = `docs/core/design/AGENT-LOOP.md` §6.18 两行 + 变更记录 + §9（**不新建档**） | D2 单一权威源；§6.18 = VSC 接线事实表（`agent.tools` 先例同表）；产品树旧档 = 参照历史（保留 ≠ 维护——零触碰） |
| D6 | 同族发现 F1 / F2 = 报告不动手（2.9） | 边界纪律（§1 只修豁免判据） |
| D7 | 子代自身字段（`dispatch.mjs:253`）不接线 | 两端既有语义 = childPermission 闭包承担豁免；改之 = 核行为变化（面外） |

### 2.5 受影响文件表（R24a）

| # | 文件（cwd = 仓根） | 现值（行） | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/setup.mjs` | 645（TODO `:55` 同读数；wc 644——末行口径） | +11（±4）→ ~656 | B 块访问器接线——**唯一生产改动**；>500 硬限 = **既有登记**（`docs/TODO.md:55`——W15 重定 S 端壳装配面；拆分 = 独立批次，本批不拆） |
| 2 | `thincoder-vscode/test/integration/vsc-autoapprove-field.test.mjs` | 新 | ~+130–160 | 回归用例 T1–T4（新档） |
| 3 | `thincoder-vscode/test/integration/files.mjs` | 19 | +1 | 清单登记（漏登记 = run-integration 启动自检 fail——`run-integration.mjs:45-47`） |
| 4 | `docs/core/design/AGENT-LOOP.md` | 509 | **已落**（509 → 511） | §6.18 :394/:395 两行 + 变更记录 + §9——本席（2.11） |
| — | `thincoder-vscode/src/agent.mjs` | 474 | 0 | **不触**（`getAuto` 面零改） |
| — | `thincoder-core/agent-tools/subagent-spawn.mjs` | 459 | 0 | **不触**（核树全体零改） |
| — | `thincoder-core/agent-tools/subagent.mjs` | 404 | 0 | **不触** |
| — | `docs/core/design/AGENT-LOOP.md` §9 拆分规划 | — | 随 +2 行读数（超硬限 +11——既有拆分候选不变：变更记录移档 / §8 表外迁） | 记录 |

### 2.6 验收标准（逐条可机判——回指台账条目）

| # | 判据（机判） | 执行面 | 回指 |
|---|---|---|---|
| AC1 | `hydrateRun(buildTopLevelAgent(), {getAuto: () => true})` 产物 `agent.autoApprove === true`；getter 翻转后**不重 hydrate** 即读新值（live 语义）——T1 | `npm run test:integration` 新档 | 台账条（根因「字段缺失」）；§1 修法 |
| AC2 | AUTO 档 + 自动轮（`_inAutoTurn=true`）spawn **不再**返回 `cannot spawn subagents from a manual auto-turn…`（逐字反断言）；同条件手动档**仍逐字返回**该串（零回归）——T2 | 同上 | 症状① |
| AC3 | 子代权限继承：AUTO 档 `childOpts.onPermissionRequest(…)` → `true`（直放行）；手动档 → `false`（无通道现状语义不变）——T3 | 同上 | 症状② |
| AC4 | escalate 门：AUTO 档 + 自动轮**非**门拒绝串；手动档 = 逐字门拒绝串——T4 | 同上 | 症状①（escalate 分支） |
| AC5 | 修复前红 / 修复后绿（T1–T4 positive 分支）——§5 原样存证（先落测试 ⇒ 红 ⇒ 落修复 ⇒ 绿） | §5 记录 | §1 第 4 条（机判面） |
| AC6 | 零回归：VSC 树 `npm run lint` + `npm run test:full` + `npm run test:integration` 全绿；核树零 diff | §5 读数 | §1 边界 |
| AC7 | 仓根三闸全绿（宽度 / 台账 / 锚（`--domain .`）——零新增） | `node scripts/*.mjs`（仓根） | §1 第 7 条 |
| AC8 | 文档收正已落且回读核对（2.11 清单） | 回读 | §1 第 5 条（三层分工） |
| AC9 | 三方条目一致：2.6 ↔ 台账 `docs/TODO.md:47` ↔ `AGENT-LOOP.md` §6.18 收正事实行 | 人工核对 | 档头条目指针 |

### 2.7 用例表（T1–T4——正常/边界/错误 + 反证面）

fixture = 生产宿主形状（`hydrateRun(buildTopLevelAgent(), { provider, cwd, input, depth: 0, role: null, getAuto, opts: {} })` + 载体两行照搬：`agent.provider` / `_asyncSubagents` + `_asyncQueue`——`host-shape-spawn.test.mjs:66-77` 同款）+ mock provider（`test/integration/helpers/mock-llm.mjs`）。

| 例 | 类 | 输入 | 期望输出（断言） |
|---|---|---|---|
| T1 | 正常（结构 + live） | `let auto = true; getAuto = () => auto`；hydrate | `agent.autoApprove === true`；`auto = false` 后（不重 hydrate）→ `=== false`（live 锚） |
| T2 | 正常（行为 · spawn 门） | `parent._inAutoTurn = true` + `getAuto → true`；真核 `subagentTool.execute({ task, role: "explore", async: false }, spawnCtx)` | 结果非门拒绝串；`llm.calls` 增长 + 子报告返回 |
| T2n | 反证（错误） | 同上但 `getAuto → false` | 逐字 `{"status":"error","error":"cannot spawn subagents from a manual auto-turn — wait for user input"}`（与修复前一致） |
| T3 | 正常（行为 · 子代权限继承） | AUTO 档父；`buildProbe(parent, { task, role: "coder", async: false }, "coder")` | `await childOpts.onPermissionRequest("write", { path: "x" }, null) === true` |
| T3n | 反证 | `getAuto → false` 同构 | `=== false`（spawnCtx 无 `ctx.onPermissionRequest`——现状语义） |
| T4 | 正常（行为 · escalate 门） | `_inAutoTurn = true` + `getAuto → true`；`subagentTool.execute({ action: "escalate", task, async: false }, spawnCtx)` | 结果 / 抛错**不含**门拒绝串（只锚门判据——下游链结果不设前提） |
| T4n | 反证 | `getAuto → false` | 逐字门拒绝串（同 T2n 串） |

**RED/GREEN 协议（实现顺序——§5 存证）**：① 先落测试档 + 登记 ⇒ `npm run test:integration` ⇒ T1/T2/T3/T4 positive **必红**（修复前字段 undefined——原样记录）；② 再落 setup.mjs 访问器 ⇒ 复跑 ⇒ **全绿**；③ 记录两跑的逐字命令与输出行。

### 2.8 同族读点核对

并入 2.1 A/C（D2 不重述）。摘要：三处必覆盖 ①②③ = 单点接线同时覆盖；邻接 getter 面零改；子代自身字段 / CLI 槽面 / 顶层 dispatch = 面外不动。

### 2.9 边界（承 §1 四条 + 本批新增明确不修项）

1. 不重开同链前序四批；不改 §17 D-S6 规则本身；5 批在途档 §1 零触碰；台账零触碰、本档 §1 零触碰（承 §1）。
2. **F1（同族发现——报告不动手）**：VSC spawn 工具 ctx 缺 `onPermissionRequest`（`execute-tools.mjs:197-219` 对照核 `dispatch.mjs:395`）⇒ 手动档子代理写**恒拒不出卡**（`subagent-spawn.mjs:308-309` 闭包 `return false`）；`makeChildPermission` 零生产调用点（grep）。——交父侧另案裁量。
3. **F2（同族发现——报告不动手）**：`execute-tools.mjs:205` 注释称 spawn 门读 `ctx.getAuto`——实际核门读字段、`ctx.getAuto` 对核零消费者（死传参）——注释与实现不符，收正与否交父侧。
4. **不修项（预声明）**：子代 `childPermission` 分支在 spawn 时求值（`subagent-spawn.mjs:305` 三元）⇒ 已在跑子代理不回溯 AUTO 变更——**CLI 同形既有语义**（01:46 实测同款），非本批缺陷。
5. 核树 / CLI / 他批文档零触碰；不新建档（D5）。

### 2.10 执行宿主与交付面

- **执行宿主 = CLI**（VSC 面板内 spawn 被本缺陷自身阻塞——承 §1）；实施 = eng-coder（§5）；**真机复测 = §6 父侧 / 用户面**（修复后 VSC 面板内 spawn 恢复）。
- 定向跑法 = `cd thincoder-vscode && node --test test/integration/vsc-autoapprove-field.test.mjs`；门禁 = `npm run lint` → `npm run test:full` → `npm run test:integration`。

### 2.11 文档收正（已落——本席；实施笔零重复触碰）

| # | 文件 | 落点 | 内容 |
|---|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP.md` | §6.18「child permission gate」行（:394） | autoApprove 来源收正 = 核引擎三读点（`subagent-spawn.mjs:305` · `escalate-async.mjs:225` · `subagent-actions.mjs:437`）；原 VSC 引擎 `ctx.getAuto?.()` 三处坐标随 W12/W13 退役（旧形态来源 = `2026-09-12-VSC-CHILD-PERMISSION.md:79`——坐标文件已删） |
| 2 | 同档 | §6.18「自持工具登记面（#83）」行（:395） | 补 `agent.autoApprove` 字段接线事实 + 验收机判列补新回归档指针 |
| 3 | 同档 | 变更记录（+2 行）· §9 体量（509 → 511 · 超硬限 +11 读数） | 一行注记 + 读数随收 |

需求档（requirements）本批零改——缺陷批：需求语义（AUTO 档豁免 ~设计如此）不变，缺口在实现面。

### 2.12 自检（评审前预检对照）与读数

①需求可设计 ✓（判据全机判）· ②受影响文件 + 行数（R24a）✓ 2.5 · ③AC 逐条回指 ✓ 2.6 · ④UI/交互决策 = 零变更（AUTO 按钮 / 面板行为不变——无 open 项）✓ · ⑤方案对比已做 ✓ 2.2。
**三闸读数（本席实跑 · cwd = 仓根）**：① `check-doc-width` = OK（415 文件零超 · V1/V2/V3 新增 0）· ② `check-ledger` = 0 违规 · ③ `doc-anchors --domain .` = OK(V5) 0 条悬空锚。
（裸跑无域参附扫两产品树遗留参照档 = 37 条悬空——既有状态、非本批引入、不在维护层——观察项供父侧。）
**自检修正（本席内）**：① 变更记录行 320 字符 → 拆两行；② 行文用词触发 V5「定义谓词」簇 → 换词（防窄符号误判）——修正后三闸复跑全绿。

**STOP「设计就绪待评审」**——发起权在用户 / 主 agent。

**自检补充（§2 落笔后回读核对 · D6）**：③ 2.1 D 第③条行 464 字符超宽 → 拆三行（内容零改——本段 append 后修订仅此一处，纯折行）；④ 终态三闸复跑 = 全绿（读数同上节）。

### 2.13 范围扩一收正登记（F1/F2 并入——用户 02:23「一起修」）

**依据** = 用户 2026-09-16 02:23 裁定「一起修」+ 本条扩写任务书。**覆盖声明**：2.4 D6 · 2.9 第 2/3 条的 F1/F2「报告不动手」状态随本扩展改为**本批修**——前文原样保留（append-only），以本子节为准。
**A′ 结论核**（显式）：A′ 访问器契约（2.3）不变；F1 补手动档另一半（子代询问通道），与 A′ 的 AUTO 面正交——合并后 2.1 A ③「子代权限继承」双模式闭合（见 2.16）。
**坐标实核收正（报告项——台账零触碰）**：① F1 事实所引 `thincoder-vscode/src/extension/execute-tools.mjs` 实为 **`thincoder-vscode/src/agent/execute-tools.mjs`**（`src/extension/` 下无此档——全树 glob 实证）；
② 所引 `thincoder-core/agent-tools/dispatch.mjs:395` 实为 **`thincoder-core/agent/dispatch.mjs:395`**。台账 `docs/TODO.md:12` 含 ① 旧路径——**父侧收正**（本席零触碰台账）。
**2.6 AC3 / 2.7 T3n 括注收正**：原注「现状语义」收正为「无通道 fixture 语义」——T3n 断言不变（`spawnCtx` 不含 `ctx.onPermissionRequest` ⇒ 核分支 `return false`，核行为零改）；生产链无通道面由新增 T7 系列承载（2.17）。

### 2.14 F1 接线勘察（逐条实核——契约 / 消费点 / 端侧现状 / 形态裁决）

**A 缝契约（核侧调用形态——实核）**：`ctx.onPermissionRequest(name, args) ⇒ boolean | Promise<boolean>`；`name` 三形态 = ① `${key}/${tool}`（子代写询问——`subagent-spawn.mjs:319`，`key` = relayPrefix 去尾 = `<role>#<id>`）；
② `escalate/${tool}`（异步飞刀写询问——`escalate-async.mjs:229`）；③ `continue` + `{ turns, agent }`（撞墙继续——`subagent.mjs:293` · `subagent-actions.mjs:442`）。
返回 `false` ⇒ 子 dispatch 记 denied（`agent/dispatch.mjs:301-305`）——工具结果逐字 `Error: permission denied by user`（同档 `:331-332`）。

**B 核侧消费点（实核）**：① 手动分支缺失判定 —— `subagent-spawn.mjs:308-309`（`if (!ctx.onPermissionRequest) return false`——**静默拒绝、不出卡**）；
② 核 toolCtx 透传范式 —— `thincoder-core/agent/dispatch.mjs:395`（`onPermissionRequest: callbacks.onPermissionRequest`）；
③ 同族消费 —— `consult.mjs:317` · `escalate-async.mjs:228-230` · `subagent-actions.mjs:437` 与 `:441-442` · `subagent.mjs:281` 与 `:293`。⇒ 单一接线点同时覆盖全族（与 2.1 B 同法）。

**C 端侧现状（实核）**：① VSC `execute-tools.mjs:197-219` toolCtx **无** `onPermissionRequest`（与核 `:395` 范式差一字段——F1 本体）；② VSC 树全 grep `onPermissionRequest` 零命中（供给面从未存在）；③ 消费链其余环均在位（2.16）。

**D 形态裁决**：接线两点 = ① `panel-callbacks.mjs` 供给 `callbacks.onPermissionRequest`（端装配层——缝表「消费方 = 端装配层」）；② `execute-tools.mjs` toolCtx 透传（镜像核 `:395` + 同档 `:213` `onQuestion` 先例——同构两点式）。
供给语义 = 按次解析 `name` 键 `<role>#<id>` ⇒ 复用 `makeChildPermission` 按次构造（announce → ask → 清态）⇒ 面板卡带 owner 归属；
键不符（`escalate/…` / `continue`）⇒ 回退面板 gate 原样名询问（卡可达 · 无归属标签——见 2.16 行 10）；AUTO（live）⇒ 直返 `true` 零卡。

**E 与 `makeChildPermission` 的关系（零生产调用点含义）**：该助手（核 `agent-tools/child-permission.mjs:32`）产品签名 = `(toolName, args, diffInfo) ⇒ boolean`——非可直接安装进 toolCtx（核以复合名 `${key}/${tool}` 调用、键内含归属）；
其原安装点（VSC 引擎子代 callbacks / escalate 接线）随 W12/W13 迁核退役 ⇒ 零调用点 = **迁移期悬置**。本批处置 = 按次构造复用（归属键解析后构造——语义单源：announce → ask → 清态顺序 + `childOwnerLabel` 与活动块同源 KD-8）；零调用点由本批消除。

**F 核零改判（缝约：壳→核可 · 核→壳禁）**：**要求核零改 · 设计满足**——生产改动两点全在 `thincoder-vscode/src/**`（壳）；核侧仅被 import（`child-permission.mjs` 既有导出——壳→核方向合法）；
核读点 `subagent-spawn.mjs:308-319` / `dispatch.mjs:395` 零触碰（CLI 零回归构造性保证）。

### 2.15 F2 注释收正（落点与事实句）

**落点** = `thincoder-vscode/src/agent/execute-tools.mjs:204-207`（`getAuto` / `sessionSignal` 两行上方注——随 F1 同笔改写）。
**须陈述的事实**：① tool-ctx 透传现行核消费面 = `ctx.onPermissionRequest`（F1 后新供给）；`ctx.getAuto` / `ctx.sessionSignal` = 零消费面（见下）；
② 核 spawn 门读**父对象字段** `parent.autoApprove`（`subagent-spawn.mjs:305`）——不读 `ctx.getAuto`；③ 会话 signal 达核经 `agent._sessionSignal` / `ctx.signal`（`subagent-async.mjs:388`）——不读 `ctx.sessionSignal`。
**须消除的旧句**：旧注「spawn gate reads the LIVE autoApprove (ctx.getAuto)」与「share the session signal (ctx.sessionSignal)」两句与实现不符——收正后不得保留。
**字段处置**：两透传字段**保留**（零回归；消解路径未授权删除——台账消解路径 = 「补接线 + 同笔注释收正」）；零消费面事实 = 报告项（清理登记建议——父侧台账裁量）。
**实核读数**：核树 `getAuto` grep = **零命中**（含 `ctx.getAuto` 形态）；`ctx.sessionSignal` 读方 = 零——VSC 侧两字段唯一出现 = `execute-tools.mjs:205-208`（注释 + 透传本体）。

### 2.16 覆盖面核对（手动档子代理写盘全链——A′ + F1 合并后是否闭）

**结论：目标链闭合**（出卡 → 用户批准 → 放行）；两处残环登记（行 9 / 行 10）。

| # | 环 | 状态 | 坐标 / 说明 |
|---|---|---|---|
| 1 | 端侧 toolCtx 透传 | **本批（F1）** | `execute-tools.mjs` toolCtx 补 `onPermissionRequest`（镜像核 `agent/dispatch.mjs:395`） |
| 2 | 端装配层供给（owner / ⏸ / gate） | **本批（F1）** | `panel-callbacks.mjs` 供给——面板 gate + owner 归属 + announce |
| 3 | 卡投递（permissionRequest / promptId / owner） | 既有 | `permission-gate.mjs:59` |
| 4 | 卡 UI 侧消费面 | 既有 | webview `chat.js:254` → `permission.js:21`（`<owner> · <tool>` 卡格式在位） |
| 5 | 批准回传面 | 既有 | `panel-messages.mjs:344-360`（promptId 精确路由 + approve-all 连带） |
| 6 | 放行 / 拒绝传播 | 既有 | 子 dispatch：approve ⇒ 执行；deny ⇒ 逐字 `Error: permission denied by user`（`agent/dispatch.mjs:331-332`） |
| 7 | ⏸ 块头审批态（announce → 清态） | **本批（F1）** | 供给按次构造复用 `makeChildPermission` 顺序；`panel-callbacks.mjs:251` 生产器既有 · webview `applySubagentApproval` 既有 |
| 8 | 释放：Stop / approve-all 连带 | 既有 | `permission-gate.mjs:63-73` · `panel-messages.mjs:355-357`（`releasePermission`） |
| 9 | 释放：child 定向取消（⏹）已开卡 | **缺（登记——本批不修）** | 核闭包不携条目 signal（`opts.signal` 无来源——核零改面）；已开卡靠 Stop / 用户应答释放；`stopped` 检查只挡新 ask（`subagent-spawn.mjs:316-318`） |
| 10 | escalate / continue 询问卡 | **部分（登记）** | 卡可达（供给回退分支——原样名 `escalate/<tool>` / `continue`）；归属标签不闭（名不携 id/model——核零改面） |

**AUTO 面（A′）**：子代直通零卡（`parent.autoApprove` 访问器获值）；与手动面不相交、无双卡风险（核 `enqueueAsk` 串行——`subagent-async.mjs:39-43`；「并发只弹一个」= 缝验收同句）。

### 2.17 机判面（F1——硬项；另立新档）

**档位裁决：另立档** `thincoder-vscode/test/integration/vsc-spawn-ctx-permission.test.mjs`（不并入 2.5 表第 2 行新档——理由：夹具族不同（面板假体 + 真 spawn 链 + mock provider ∥ 字段面 + 核门直驱）；两档各自自持、互不跨档 import）。登记 `test/integration/files.mjs`（漏登记 = 启动自检 fail）。
**夹具（承 §2 既有形态）**：`hydrateRun(buildTopLevelAgent(), …)` 生产形状父对象（host-shape 先例同款）+ mock provider（`helpers/mock-llm.mjs`——`toolCall` 步支持已实核）+ 面板假体（`_wvReady: true` 直投）+ 真 spawn 链（`vscSubagentFace(subagentTool)`）；supply 用例直驱生产工厂 `buildPanelCallbacks`。

**用例（六例——T5–T9 系列）**：

| 例 | 类 | 输入 | 期望输出（断言） |
|---|---|---|---|
| T5 | 正常（供给 · owner + ⏸） | `buildPanelCallbacks` 产物；`onPermissionRequest("coder#7/write", {path:"a.txt"})`；approve | ① 修复前 `typeof cb.onPermissionRequest === "function"` 即红；② posts 序 = `subagentApproval{tool:"write"}` → `permissionRequest{tool:"write", owner:"coder#7", promptId}` → 应答后 `subagentApproval{tool:null}`；③ 返回 `true` 且出队 |
| T6 | 边界（供给 · 回退 + AUTO） | ① `"continue"`；② `"escalate/read"`；③ AUTO（`_autoApprove=true`） | ①② 卡可达（tool = 原样名、owner = `null`、零 announce）；③ 直返 `true`、零新卡 |
| T7 | 正常（全链 · 手动） | 生产父 + `executeToolBatches` 驱真 spawn（coder · sync）；子末步 = `write child-out.txt`；approve | 卡出（owner 匹配 `/^coder#\d+$/`、tool=`write`）→ approve → **文件落地** + 子报告返回；修复前必红（零卡 + 文件缺席） |
| T7b | 正常（全链 · AUTO） | 同 T7 但 `getAuto → true` | 零卡 + 文件落地（A′ 面；修复前必红） |
| T8 | 错误（全链 · deny） | 同 T7 但 deny | 卡出 → deny → 子下一请求体含逐字 `permission denied by user` + **零落地**；修复前必红（无卡） |
| T9 | 结构（透传 pin） | 探针工具捕获 toolCtx | `ctx.onPermissionRequest === callbacks.onPermissionRequest`（同引用——修复行移除即红） |

**RED/GREEN 协议**：① 新档 + 登记 ⇒ `npm run test:integration` ⇒ T5–T9 **必红**（原样存证）；② A′ 落笔 ⇒ T7b 转绿（分阶段证据）；③ F1 落笔 ⇒ 全绿。三段输出逐字入 §5。
**F2 机判说明**：注释收正**不设**散文锚测试（禁散文锚纪律——新增断言只写行为面 / 结构机检面）；事实核对以 2.15 实核读数为准，回读落 §5。

### 2.18 权威档收正（F1/F2——已落 · 本席；实施笔零重复触碰）

| # | 档 | 落点 | 内容 |
|---|---|---|---|
| 1 | `docs/core/design/CORE-UNIFICATION.md`（1947 → 1949） | §2.13.3 缝表 `ctx.onPermissionRequest` 行（:1324） | 核内落点补 spawn 分支静默拒绝坐标（`subagent-spawn.mjs:309`——「端侧 ctx 必须提供，否则手动档静默拒绝」）；VSC 列收正为现体接线（`panel-callbacks.mjs` 供给 + `execute-tools.mjs` toolCtx 透传；核同范式 `agent/dispatch.mjs:395`）；变更记录一行 |
| 2 | `docs/core/design/AGENT-LOOP.md`（511 → 514） | §6.18 child permission gate 行（:394） | 补端侧供给事实（F1——同上坐标 + 缺失静默拒绝）+ F2 句（tool-ctx `getAuto` / `sessionSignal` = 历史残留零消费面）；变更记录 + §9 体量读数随收 |

需求档（requirements）本批零改——缺陷批：F1/F2 不改需求语义（手动档子代理写盘经审批门 = 既有需求；缺口在实现面）。

### 2.19 受影响文件表（F1/F2 增量——R24a）

| # | 文件（cwd = 仓根） | 现值（行） | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/execute-tools.mjs` | 384 | +8–14 → ~392–398 | F1 透传一行 + F2 注释改写——**生产改动**；≤500 硬限内（T-CP18 判据同口径） |
| 2 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | 331 | +18–28 → ~349–359 | F1 供给（owner / announce / gate 落点）——超 300 软线（基线即超）；≤500 硬限内；软线处置 = 本批不拆（增量小）——登记观察（建议随台账——父侧裁量） |
| 3 | `thincoder-vscode/test/integration/vsc-spawn-ctx-permission.test.mjs` | 新 | ~+170–220 | T5–T9（新档） |
| 4 | `thincoder-vscode/test/integration/files.mjs` | 20 | +1（累计本批 +2——含 2.5 表第 2 行） | 清单登记 |
| 5 | `docs/core/design/CORE-UNIFICATION.md` | 1949 | **已落**（1947 → 1949） | §2.13.3 行 + 变更记录（2.18） |
| 6 | `docs/core/design/AGENT-LOOP.md` | 514 | **已落**（511 → 514） | §6.18 行 + 变更记录 + §9（2.18） |
| — | `thincoder-vscode/src/agent/setup.mjs` | 645 | 0 | **不触**（F1 不涉装配工厂） |
| — | `thincoder-core/**` | — | 0 | **不触**（核零改——缝约） |

行数口径注：split（`\n` 分片）口径——与 T-CP18 结构判据同款；末行口径 = −1。

### 2.20 验收标准（F1/F2——回指台账条目）

| # | 判据（机判） | 执行面 | 回指 |
|---|---|---|---|
| AC10 | 供给面：`buildPanelCallbacks` 产物 `onPermissionRequest` 在场且行为 = T5 / T6（owner 归属 `coder#N` + ⏸ announce 序 + 回退 + AUTO 直通） | `npm run test:integration` 新档 | 台账 F1 条（消解路径「VSC spawn ctx 补接线」） |
| AC11 | 全链：T7（手动出卡 → 批准 → 落地）/ T7b（AUTO 零卡）/ T8（deny 逐字 + 零落地）——修复前必红 / 后必绿 | 同上（§5 存证） | 台账 F1 条 + §1 症状② |
| AC12 | 透传 pin：T9 同引用断言（修复行移除即红） | 同上 | 台账 F1 条（`execute-tools.mjs:197-219` 面） |
| AC13 | F2：注释收正落位（回读核对；零散文锚测试）——事实句 = 2.15 | §5 回读 | 台账 F2 旁证句 |
| AC14 | 核零改：核树零 diff；VSC 仅 import 核既有导出（壳→核） | §5 读数 | 缝约（2.14 F） |
| AC15 | 文档收正：2.18 两档落位 + 仓根三闸全绿（零新增） | 回读 + 三闸 | §1 第 5 条（三层分工） |
| — | （承 2.6）AC1–AC9 不变；AC6 全绿范围含本扩展新增档 | 同 2.6 | — |

三方一致：本表 ↔ 台账 `docs/TODO.md:12`（F1/F2 同条）↔ 2.18 收正事实行。

### 2.21 边界（扩一后——承 2.9 + 新增明确不做）

1. 不扩到**审批 UI 侧**：webview `permission.js` / `chat.js` / `activity.js` / i18n 零改（消费面已齐——2.16 行 3/4/7）。
2. **不回改核**：`thincoder-core/**` 零触碰（含 `subagent-spawn.mjs` / `dispatch.mjs`）；seam 语义核侧不动。
3. 不删 tool-ctx `getAuto` / `sessionSignal` 死字段（F2 只收正注释——清理另案，2.15）。
4. 不接 **escalate 归属标签** / **⏹ 已开卡释放**（2.16 行 9/10 登记——核零改面不闭）。
5. 台账 / §1 / 他批档零触碰；不新建文档档（2.18 更新既有）。

**F1/F2 扩写自检（评审前预检对照 · D6 回读）**：①需求可设计 ✓（全机判）· ②受影响文件 + 行数（R24a）✓ 2.19 · ③AC 逐条回指 ✓ 2.20 · ④UI/交互决策落档 ✓（供给面 owner / ⏸ 语义定死；无 open 项）· ⑤方案对比 ✓（2.2 + 本扩展形态裁决 2.14 D）。

**三闸复跑读数（本席实跑 · cwd = 仓根——本扩展 append 后）**：① `check-doc-width` = OK（415 文件零超 300 字符 · V1/V2/V3 新增 0）· ② `check-ledger` = 0 违规 · ③ `doc-anchors --domain .` = OK(V5) 0 条悬空锚。

**STOP「设计就绪待评审」**——发起权在用户 / 主 agent（2.12 同句不变；本扩展为追加子节）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**本轮发现表（10 条：🔴 0 · 🟡 3 · 🔵 7）**——判读面 = 本档 §1/§2 + `docs/core/design/AGENT-LOOP.md` + `docs/core/design/CORE-UNIFICATION.md`；根因链（§1 表 1–5）与 §2 关键坐标经直接实核复核一致（见末行「复核读数」）。
**限制声明**：评审上下文未声明项目 standards 档与文档地图 ⇒ 方法论 / 文档归属两维为降级判读（按 Project Guide `AGENTS.md` + 本档内证与 AGENT-LOOP.md §6.18 既有惯例核对）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Doc state | 🟡 | 权威档把未落地接线写作现状事实：`AGENT-LOOP.md:394`/`:395` 与 `CORE-UNIFICATION.md:1324` 记 F1 供给/透传与 A′ 访问器为「实核」；实核 = `thincoder-vscode/src/agent/execute-tools.mjs:197-219` toolCtx 无 `onPermissionRequest`、`thincoder-vscode/src/extension/panel-callbacks.mjs:313-316` 无该回调（实施未落） | 行内加「本批待落（§5 后转实核）」或随实施笔落；保留批次指针，勿让「实核」压在待落接线上 |
| 2 | Size / R24a | 🟡 | `thincoder-vscode/src/agent/setup.mjs` 645 → ~656 越 500 硬限，档内只给既有登记指针（`docs/TODO.md:56`），无拆分计划（判据：越档须携拆分计划） | 档内补拆分缝计划（装配面 / 注入序 / 工具表分档）或逐字引既有裁定缓期句；既有登记债不在此重开裁定 |
| 3 | Clarity（证据面） | 🟡 | 2.1 A 自称「A 读点全清单（核树 grep 实证）」但漏 `thincoder-core/agent-tools/subagent-async.mjs:272`（`agent.autoApprove`——:247 `const agent = ctx.agent` 父对象读点）；覆盖不受影响（单点访问器构造性覆盖），但「全清单」断言不成立 | 补该行，或改称「读点族（非穷举）」 |
| 4 | Clarity | 🔵 | 行数读数内部不一致：`files.mjs` 2.5 表 = 19（+1）· 2.19 表 = 20（+1，累计 +2）；实核 = 19 行 / 8 条 | 统一为 19 +2 |
| 5 | Clarity | 🔵 | 台账回指行号漂移：所引 `docs/TODO.md:47` 实为 `:48`（autoApprove 条）· `:55` 实为 `:56`（setup.mjs 645 登记）；内容一致、行号差一 | 重锚或标 as-of |
| 6 | Clarity | 🔵 | 「VSC 树全 grep `onPermissionRequest` 零命中」不确：`thincoder-vscode/test/child-permission-wiring.test.mjs:92` 一处（注释）；结论（`src/**` 零供给）成立 | 收窄为 `src/**` |
| 7 | Acceptance | 🔵 | D3「无 setter ⇒ 写入 TypeError（fail-loud）」无机判（T1–T9 未覆盖） | 新档补一行赋值即抛断言（行为面，非散文锚） |
| 8 | Acceptance | 🔵 | AC6 / AC14 的「零 diff」为 git 判据；评审宿主报「无 git 仓库」（项目树未核） | 备非 git 判据（受影响文件表述 + 哈希基线） |
| 9 | Doc state | 🔵 | `AGENT-LOOP.md:394`「核引擎三读点」与 §1 设计输入 3 的「三处读点」（`:258`/`:184`/`subagent-spawn.mjs:305`）是两组不同三元组；2.1 A 实列 6 组读点 ⇒ 「三读点」易被读作全集 | 措辞收窄为「child 权限面三读点」；同类 = 2.1 D③「唯一活注入点」与同节附注两消费点并列（附注已自行收正，措辞一并对齐） |
| 10 | Scope | 🔵 | 2.16 行 9/10（⏹ 已开卡释放 / escalate·continue 归属标签）登记不修——如实，但未在 §6 复测清单显式挂钩 | §5/§6 复测项补一句「该两环不在本批覆盖」，免验收误判 |

**复核读数（本席实证，供父侧核）**
- ① A′ 可行性 = `setup.mjs:302` 形参 `getAuto` 现状已传未用（本档 grep 仅 :302 一处）+ B 块 `:478-485`（`:479 agent._role = role`）✓；工厂无 `autoApprove` ✓（访问器无覆盖冲突）。
- ② 核读点 `subagent.mjs:184`/`:258`/`:209` · `subagent-spawn.mjs:305`/`:308-309`/`:319`/`:453-455` · `escalate-async.mjs:225`/`:240` · `subagent-actions.mjs:437` · `subagent-run.mjs:155` · `subagent-scheduler.mjs:141`/`:210`/`:270` · `async-settle.mjs:243` ✓ 逐条在位。
- ③ 反证成立 = VSC 树 `agent.autoApprove =` 零命中 + 核树唯一运行时赋值 `session.mjs:300`（属 `applySession`，VSC 只取 `loadSlotFile`/`listSlots`/…——不达）⇒ 2.1 D「无另一赋值路径」结论成立（D① 会话槽文件读数在仓外，未核——由 ②③ 旁证）。
- ④ F1 可落 = `permissionGate(panel)` 已收 `(toolName,args,diffInfo,opts{owner,signal})`（`permission-gate.mjs:42-59`）· `makeChildPermission` 仅需 `ctx.callbacks.onPermissionRequired`+`onSubagentApproval`（`child-permission.mjs:32-43`）· `panel-callbacks.mjs:251`/`:313` 两消费面在位 ⇒ 两点式接线可行。
- ⑤ 测试面 = `mock-llm.mjs` 支 `toolCall` 步 · `host-shape-spawn.test.mjs:66-77`/`:87-90` 夹具先例 · `executeToolBatches` 已导出（`execute-tools.mjs:49`）· `run-integration.mjs:45-47` 漏登记自检 · `files.mjs` 19 行 8 条 ⇒ T1–T9 夹具与登记链路可达。
- ⑥ 未触面复核 = `execute-tools.mjs:119` · `tool-gates.mjs:141` · `agent.mjs:123`/`:211` · `run-helpers.mjs:257-262` 均走 `getAuto` 闭包（不动判成立）✓。

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 7（共 10 条）

### 轮次 2（评审子代理）

**轮次 2（复审补发 · 逐条复核）**——判读面 = 本档 §1/§2 + `docs/core/design/AGENT-LOOP.md` + `docs/core/design/CORE-UNIFICATION.md`（三档本轮全文重读）；轮 1 发现表 10 条对当前态逐条复核 + 关键代码坐标抽样实读。**结论：10 条全部在位（设计冻结窗口零改动 ⇒ 无「已修」项）；新增 0 条；🔴 0。** 限制声明（承轮 1）：评审上下文未声明项目 standards 档与文档地图 ⇒ 方法论 / 文档归属两维为降级判读。

| # | Orig# | File | Severity | Status | Notes（本轮实证） |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/AGENT-LOOP.md:394`/`:395` · `docs/core/design/CORE-UNIFICATION.md:1324` | 🟡 | Unfixed（非阻断·建议） | 权威档仍以现状口吻记 F1/A′ 接线——`AGENT-LOOP.md:394`「**端侧供给**（2026-09-16 缺陷修复——承 `docs/batches/2026-09-16-vsc-autoapprove-misalign.md` §2 F1/F2）」· `CORE-UNIFICATION.md:1324`「VSC = 面板权限卡——**接线**（2026-09-16 缺陷修复」；实核未落 = 本档 :100「**状态：设计就绪待评审**」+ `thincoder-vscode/src/agent/execute-tools.mjs:197-219` toolCtx 无 `onPermissionRequest`（全树 grep `src/**` 零命中） |
| 2 | 2 | `docs/batches/2026-09-16-vsc-autoapprove-misalign.md:172` | 🟡 | Unfixed（非阻断·既有登记） | 「>500 硬限 = **既有登记**（`docs/TODO.md:55`——W15 重定 S 端壳装配面；拆分 = 独立批次，本批不拆）」——档内无拆分计划；登记实锚 = `docs/TODO.md:56` |
| 3 | 3 | 同档 :107 | 🟡 | Unfixed（非阻断） | 「**A 读点全清单（核树 grep 实证——§1 表 1 的完整化）**」仍漏父对象读点 `thincoder-core/agent-tools/subagent-async.mjs:272`（「} else if (agent.autoApprove) {」；`:247 const agent = ctx.agent`）——单点访问器构造性覆盖不受影响、但「全清单」断言不成立 |
| 4 | 4 | 同档 :174 vs :342 | 🔵 | Unfixed | `files.mjs` 现值 19（本轮实读 = 19 行 / 8 条）vs 2.19 表「20」——两表不一致 |
| 5 | 5 | 同档 :103/:193/:172 | 🔵 | Unfixed | 台账回指漂移：:47 实为 :48（autoApprove 条）· :55 实为 :56（setup.mjs 645 登记）；:12（F1 条）正确 |
| 6 | 6 | 同档 :267 | 🔵 | Unfixed | 「② VSC 树全 grep `onPermissionRequest` 零命中（供给面从未存在）」不确——VSC 树有命中（`thincoder-vscode/test/child-permission-wiring.test.mjs:92` + docs 面多档）；`src/**` 确零 ⇒ 结论成立、措辞应收窄 |
| 7 | 7 | 同档 :152/:162 | 🔵 | Unfixed | D3「无 setter（写入即 TypeError——fail-loud）」无机判（T1–T9 未含「赋值即抛」断言） |
| 8 | 8 | 同档 :190/:358 | 🔵 | Unfixed | AC6 / AC14 以「核树零 diff」为判据（git 面；评审宿主无 git 工具 ⇒ 判据可验性依赖执行宿主，宜备非 git 判据） |
| 9 | 9 | `docs/core/design/AGENT-LOOP.md:394` | 🔵 | Unfixed | 「核引擎三读点」（`:305`/`:225`/`:437`）与 §1 设计输入 3「三处读点」（`subagent.mjs:258`/`:184` · `subagent-spawn.mjs:305`）两组三元组并列、易被读作全集 |
| 10 | 10 | 同档 :302/:303 | 🔵 | Unfixed | 2.16 行 9/10 残环（「**缺（登记——本批不修）**」/「**部分（登记）**」）未在 §6 复测清单显式挂钩 |

**复核读数（本轮实证，供父侧核）**
- ① **权威档收正已在位**——`AGENT-LOOP.md:394`（端侧供给行）· `:395`（访问器字段接线行）· §9 体量「本档 **514 行**」（`:467`）· 变更记录 `:509-513` 两条；`CORE-UNIFICATION.md:1324`（`ctx.onPermissionRequest` 行收正）· 变更记录 `:1945-1946` ⇒ 设计 2.11 / 2.18「已落」为真（**文档面**已落、**代码面**未落——即 #1 所指）。
- ② **设计侧数字实核**：`thincoder-vscode/src/agent/execute-tools.mjs` 全文 **384 行**（= 2.19 表读数 ✓）；`thincoder-vscode/test/integration/files.mjs` **19 行 / 8 条**（⇒ 2.19 表「20」为笔误）。
- ③ **台账三点**：`:12`（F1 条 · 旧路径已收正为 `thincoder-vscode/src/agent/execute-tools.mjs`）· `:48`（autoApprove 条）· `:56`（setup.mjs 645 登记）——内容与 §2 一致、行号两处差一。
- ④ **代码面抽样**：`execute-tools.mjs:204-206` F2 靶句旧注仍在位（「the subagent tool's manual-tier」「spawn gate reads the LIVE autoApprove (ctx.getAuto)」「share the session signal (ctx.sessionSignal)」）· `subagent-async.mjs:272` 父对象字段读点 ✓ · `onPermissionRequest` 在 VSC `src/**` 零命中（F1 供给面确实未落）✓。
- ⑤ **轮 1 复核读数**：其代码侧两处引用（`session.mjs:300` / `thincoder-core/agent.mjs:60`）宿主校验报「file unreadable」——本轮未复引；2.1 D「无另一赋值路径」结论由 ②③④ 旁证，不受影响。
- ⑥ **未解项（§1）**：2.1 D 三条证据链本轮复核未变（D① 会话槽文件读数在仓外——**未核**，由 ②③④ 旁证）。

VERDICT: pass

计数：🔴 0 · 🟡 3 · 🔵 7（共 10 条；新增 0 条；轮 1 遗留 10 条全部在位）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

### 5.0 元信息

- 实施轮 · 2026-09-16（CLI 宿主执行——承任务书 §2.10；VSC 面板内 spawn 被本缺陷自身阻塞）。
- 交付 = **单笔提交 `a0813b3b`**（`fix(vsc): wire autoApprove live accessor and spawn ctx permission callback`；9 档 +526/−10——含修正轮 1 折入，见 5.11）。
- 凭证（token/designId）值不落文档（运行时态）；本段只记「评审 pass（轮 1/轮 2）+ 裁决十条已吸收」。
- 写域 = 任务书 files：`setup.mjs` / `execute-tools.mjs` / `panel-callbacks.mjs` / 两新测试档 / `test/integration/files.mjs` / 两权威档；台账零触碰、他批档零触碰。

### 5.1 ⓪ 基线（开工实测 · 与任务书所载逐项一致）

| 面 | 命令 | 读数 | 日志（`.thincoder/tmp/`） |
|---|---|---|---|
| VSC 快层 | `npm test` | tests 560 · pass 525 · fail 0 · skipped 35 | `f1base-fast.log` |
| VSC full | `npm run test:full` | 560 / 560 / 0 / 0 | `f1base-full.log` |
| VSC 集成 | `npm run test:integration` | 34 / 34 / 0 | `f1base-integ.log` |
| VSC lint | `npm run lint` | check-syntax: 195 JS files OK | `f1base-lint.log` |
| VSC doc:check | `npm run doc:check` | V5 命中 0 · distinct 0 | `f1base-doccheck.log` |
| 核回归 | `node --test`（cwd = thincoder-core） | 195 / 195 / 0 | `f1base-core.log` |
| 仓根三闸 | `check-doc-width.mjs` · `check-ledger.mjs` · `doc-anchors.mjs --domain .` | 宽度 **FAIL（开工即红）** · 台账 0 违规 · 锚 OK(V5) 0 悬空 | `f1base-width.log` · `f1base-ledger.log` · `f1base-anchors.log` |

宽度闸开工即红 = 本批批次档 §3 两条复核读数行超宽（非本笔引入；成因与处置见 5.9 #1——本笔零触碰 §3）。

### 5.2 反证面（RED → A′ → F1 三段存证 · 命令逐字 + 日志落盘）

协议 = 任务书 §2.7 / §2.17「RED/GREEN 协议」：① 先落两新档 + 登记 ⇒ 集成跑 ⇒ positive 必红（原样记录）；② A′ 落笔 ⇒ 对应面转绿；③ F1 落笔 ⇒ 全绿。

| 段 | 命令（cwd = thincoder-vscode） | 读数 | 日志 |
|---|---|---|---|
| ① 修前（两新档 + 登记在位，零生产改动） | `npm run test:integration` | tests 47 · pass 37 · **fail 10** · cancelled 0 | `f1-red-integration.log` |
| ② A′ 落笔后（`setup.mjs` 访问器） | 同上 | tests 47 · pass 42 · **fail 5**（T1/T2/T3/T4/T7b 转绿；T5/T6/T7/T8/T9 仍红——F1 未落） | `f1-stage2-integration.log` |
| ③ F1 落笔后（供给 + 透传） | 同上 | tests 47 · **pass 47** · fail 0 | `f1-stage3-integration.log` |

① 段红断言逐字（`f1-red-integration.log` failing-tests 段；T2n/T3n/T4n 反证与既有 34 例全绿）：

| 例 | 红断言（逐字，actual/expected） |
|---|---|
| T1 | `AssertionError: 字段在场且 = getAuto()（修复前 undefined——核字段读点恒判非 AUTO）`（actual=undefined / expected=true） |
| T2 | `AssertionError: 非门拒绝（修复前逐字门拒绝串）——实到：{"status":"error","error":"cannot spawn subagents from a manual auto-turn — wait for user input"}` |
| T3 | `AssertionError: AUTO 档子代写直通（subagent-spawn.mjs:305 父字段读点获值；修复前 false——症状②核内源）`（false !== true） |
| T4 | 同 T2 串（escalate 分支实到门拒绝 JSON） |
| T5 | `AssertionError: 供给在场（修复前 undefined——核 spawn 分支静默拒绝不出卡源）`（'undefined' !== 'function'） |
| T6 | `TypeError: cbs.onPermissionRequest is not a function` |
| T7 | `AssertionError: 子代写卡在场（修复前零卡——核分支静默 false）——实到卡片：[{"tool":"subagent","owner":null}]` |
| T7b | `Error: ENOENT … child-out.txt`（文件缺席 = 子代恒拒零落地） |
| T8 | `AssertionError: 子代写卡在场（修复前零卡——deny 面同样不可达）` |
| T9 | `AssertionError: 透传字段在场（修复前 undefined——透传行缺失）` |

反证自检实录：T9 首跑（smoke）**假绿**（修前 `undefined === undefined`）⇒ 已加固为「先断 `typeof === "function"` 再断同引用」（决策 D6）；Windows 临时区 teardown EPERM（子代真写文件后）⇒ 重试 + 兜底（决策 D7）——两处均在①段定稿前修正，①段读数为定稿版读数。T1b（二次 hydrate 换闭包）为代码评审修正轮补入（见 5.11）——三段存证跑于其加入前（47 例口径）；T1b 对修前树同红（首断言即读缺失字段、余同族）。

### 5.3 落地清单（逐项 file:line）

| # | 文件 | 落点 | 内容 |
|---|---|---|---|
| 1 | `thincoder-vscode/src/agent/setup.mjs` | B 类 run 绑定块 `:480-489`（`agent._role` :479 邻区） | A′：`autoProbe` 归一（`:488`）+ `Object.defineProperty(agent, "autoApprove", { configurable: true, enumerable: true, get: () => autoProbe() === true })`（`:489`，无 setter） |
| 2 | `thincoder-vscode/src/extension/panel-callbacks.mjs` | import `:21`（注释 `:18-20`）· 供给函数 `:333-358`（`return cbs` `:359`） | F1 供给：AUTO live 短路（`:342`）→ `parseRelayPath` 归属键解析（`:343-344`）→ `makeChildPermission` 按次构造（`:346-353`）→ 键不符回退原样名（`:355-357`） |
| 3 | `thincoder-vscode/src/agent/execute-tools.mjs` | F2 注释 `:204-209` · F1 透传 `:217` | 注释收正（核门读父对象字段；`getAuto`/`sessionSignal` 零消费面）+ `onPermissionRequest: callbacks.onPermissionRequest`（核同范式 `dispatch.mjs:395`） |
| 4 | `thincoder-vscode/test/integration/vsc-autoapprove-field.test.mjs` | 新档（189 行） | T1（含 🔵#7 赋值即抛）/ T1b（二次 hydrate 换闭包——代码评审 🔵#4）/ T2 / T2n / T3 / T3n / T4 / T4n |
| 5 | `thincoder-vscode/test/integration/vsc-spawn-ctx-permission.test.mjs` | 新档（265 行） | T5（供给 owner+⏸）/ T6（回退 + AUTO）/ T7 / T7b / T8 / T9（透传 pin） |
| 6 | `thincoder-vscode/test/integration/files.mjs` | `:19-20` | 两档登记（漏登记 = 启动自检 fail） |
| 7 | `docs/core/design/AGENT-LOOP.md` | §6.18 `:394` · 变更记录 `:513` | 🔵#9 措辞收窄「核引擎 child 权限面三读点」+ 回读收正留痕（行数不变 514） |
| 8 | `docs/core/design/CORE-UNIFICATION.md` | §2.13.3 `:1324` · 变更记录 `:1946` | 🟡#1 回读收正：`escalate-async.mjs` :232→:228-229 · `subagent-actions.mjs` :281→:441-442（行数不变 1949） |
| 9 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | `after`（`:55-62`） | **清单外改动（如实披露）**：teardown 加固（`maxRetries: 10, retryDelay: 50` + 兜底）——本批两新档抬高并行临时区占空后，该档 `after` 实测间歇 EPERM（连续两跑复现、集成整档转红）；修 = 与两新档同法、零断言面改动 |

提交口径注：第 7/8 档含 eng-designer 本批设计面收正（评审前「已落」未提交部分）+ 本笔回读收正——同笔入 `a0813b3b`（如需分离请父侧裁定）。第 9 档 = 清单外改动 1 处（teardown 加固——见 5.11 修正轮 1）；提交 `--only` 路径集 = 本表九档，台账 / 他批档零触碰。

### 5.4 决策透明表（实现笔内裁决——均在设计/任务书判据内）

| # | 决策点 | 选定 | 依据 / 备选 |
|---|---|---|---|
| D1 | A′ 落点与形态 | `hydrateRun` B 块访问器（逐字 §2.3） | 设计 §2.2 A′ 行；live 取值 = 面板 mid-turn doctrine（`permission-gate.mjs:5-10`）；备选「每轮赋值快照」已由设计否决 |
| D2 | 供给解析文法 | 复用核 `parseRelayPath`（`RELAY_PREFIX_RE` 文法单一权威） | 不自造正则（文法单源）；`inner.length === 0` 守卫防嵌套链误吞（嵌套 ⇒ 回退，安全降级） |
| D3 | 键不符（escalate / continue） | 回退面板 gate **原样名**（owner null） | 设计 2.14 D；卡可达优先于归属标签（残环登记 2.16 行 10） |
| D4 | AUTO 短路位置 | 供给函数首行 `panel._autoApprove` 早退返回 true | 与 `permissionGate` live re-check 同语义（mid-turn 翻转即生效） |
| D5 | 无 gate 时（headless / 构建期 AUTO） | 返回 false | 与核分支 `return false` 同语义（零回归；不新建通道） |
| D6 | T9 pin 断言加固 | 先断 `typeof === "function"` 再断同引用 | smoke 首跑暴露「修前 `undefined === undefined` 假绿」⇒ 不改断言则 pin 失效 |
| D7 | teardown 抖动处置 | `rmSync(maxRetries: 10, retryDelay: 50)` + 兜底吞 | T7 系列真写文件后 Windows 临时区句柄滞后实测 EPERM；teardown 抖动不得把测试变红 |
| D8 | 批次档 §3 两条超宽行 | **零触碰**（报告不动手） | 一段一作者（§3 = 评审子代理段）；修复坐标已列 5.9 #1 |

### 5.5 复跑链读数（终态 · 修正轮后终版读数——全链逐条跑通）

| 面 | 命令 | 终态读数 | 日志（`.thincoder/tmp/`） |
|---|---|---|---|
| VSC 快层 | `npm test` | 560 / 525 / 0 / 35（与基线逐项一致——零回归） | `f1-fix3-fast.log` |
| VSC full | `npm run test:full` | 560 / 560 / 0 / 0 | `f1-fix3-full.log` |
| VSC 集成 | `npm run test:integration` | **48 / 48 / 0**（基线 34 + 本批 14——含修正轮补入 T1b） | `f1-fix3-integration.log` |
| VSC lint | `npm run lint` | check-syntax: **197** JS files OK（+2 新档） | `f1-fix3-lint.log` |
| VSC doc:check | `npm run doc:check` | V5 命中 0 · distinct 0 | `f1-fix3-doccheck.log` |
| 核回归 | `node --test`（cwd = thincoder-core） | 195 / 195 / 0（核树零触碰） | `f1-final2-core.log` |
| 仓根台账闸 | `node scripts/check-ledger.mjs` | 0 处违规 · 基线 0 条 | `f1-final2-ledger.log` |
| 仓根锚闸 | `node scripts/doc-anchors.mjs --domain .` | OK(V5) 0 条悬空锚（8495 候选 · 豁免 910） | `f1-final2-anchors.log` |
| 仓根宽度闸 | `node scripts/check-doc-width.mjs` | **FAIL：1 文件 / 2 行**（批次档 §3 `:398`/`:421`）+ V1/V2/V3 新增 0 · 存量 0 | `f1-final2-width.log` |

宽度闸处理实录：本笔首跑自引入 1 条（CORE-UNIFICATION `:1946` 315 字符——变更记录追加句）⇒ **同笔折行收正**（≤300）；复跑后宽度闸剩红 = 批次档 §3 两条（开工即红、非本笔引入）。

### 5.6 评审裁决吸收（§3 十条 → 落点）

| 裁决 | 吸收落点 / 证据 |
|---|---|
| 🟡#1（档文 vs 实码） | 5.7：两权威档逐句回读 + 两坐标重锚 + 「档文已随实施转实态」 |
| 🟡#2（setup.mjs 越 500） | **引用既有登记**：`docs/TODO.md:56`（装配面 / 注入序 / 工具表分档）——不重开裁定、本笔不拆（指针） |
| 🟡#3（读点清单措辞） | 读点族补记：`thincoder-core/agent-tools/subagent-async.mjs:272`（`} else if (agent.autoApprove) {`；`:247 const agent = ctx.agent`）——构造性覆盖成立；清单措辞 = **读点族（非穷举）** |
| 🔵#4（行数读数） | `files.mjs` 实读：**内容 21 行 / 10 条**（split 口径 22）；开工基线 = 19 行 / 8 个登记项——2.19 表「20」为笔误、2.5 表「19」正确 |
| 🔵#5（台账回指） | 实锚 = `docs/TODO.md:48`（autoApprove 条）· `:56`（setup.mjs 登记）；§2 所引 :47/:55 差一（内容一致） |
| 🔵#6（grep 措辞） | 评审基线下 `onPermissionRequest` 在 `thincoder-vscode/src/**` **零命中**（test 面命中 = `test/child-permission-wiring.test.mjs:92` 注释——不改变「供给面从未存在」结论）；本笔落地后 `src/**` 两命中（供给 `panel-callbacks.mjs:341` · 透传 `execute-tools.mjs:217`） |
| 🔵#7（fail-loud 机判） | T1 第 5 断言：`assert.throws(() => { agent.autoApprove = false }, TypeError)`（行为面断言，非散文锚；修复前静默不抛即红） |
| 🔵#8（零 diff 判据） | git 可用（`git status --porcelain` 全量列证）= 仅 `M docs/TODO.md`（父侧台账）+ `?? .thincoder/` + `?? docs/batches/*.md`（5 他批档 + 本批档）——**核树零 diff**、AC14 成立（提交 `a0813b3b` 只含 9 档：VSC 侧 7 + 两权威档） |
| 🔵#9（措辞收窄） | `AGENT-LOOP.md:394`「核引擎三读点」→「核引擎 **child 权限面**三读点」（一行；变更记录 `:513` 同句留痕） |
| 🔵#10（残环挂钩） | 5.9 #2（父侧 §6 复测清单用） |

### 5.7 文档收正回读（🟡#1——逐句核对，档文已随实施转实态）

| 档 / 行 | 回读结论（对实码逐句） |
|---|---|
| `AGENT-LOOP.md:394`（child permission gate 行） | `makeChildPermission:32` / `childOwnerLabel:22` ✓ · 三读点 `:305`/`:225`/`:437` ✓（措辞已收窄）· 卡释放三路 ✓ · ⏸ + 态词（`activity-view.js:45/75`）✓ · 端侧供给（panel-callbacks 供给 + execute-tools 透传 + 缺失静默拒绝 `:308-309`）✓ **落地后为实态** |
| `AGENT-LOOP.md:395`（自持工具登记面行） | B 类 run 绑定访问器 ✓ · 核字段读点获值 ✓ · 无 setter ✓ · 验收机判（新回归档已登记）✓ |
| `CORE-UNIFICATION.md:1324`（ctx.onPermissionRequest 行） | 核内落点四坐标：`consult.mjs:317` ✓ · `escalate-async.mjs` :232 → **:228-229 收正** · `subagent-actions.mjs:437` ✓ · `subagent-spawn.mjs:309` ✓ · VSC 列接线（供给〔owner + ⏸〕+ 透传）✓ · 验收列「未注入 ⇒ 视为拒绝」:281 → **:441-442 收正** |
| 两档变更记录 | `AGENT-LOOP.md:513` / `CORE-UNIFICATION.md:1946` 各留一行收正注（两档行数不变：514 / 1949） |

「档文已随实施转实态」：设计面（§2.11 / §2.18）所记端侧供给 + 字段接线，**本笔落地后与实码逐句一致**；两处坐标偏差随回读同笔收正。

### 5.8 结构 / 体量读数（R24a 对账——split 口径）

| 文件 | 设计预计（2.5 / 2.19） | 实到 | 差异说明 |
|---|---|---|---|
| `thincoder-vscode/src/agent/setup.mjs` | 645 +11（±4）→ ~656 | **655**（+10） | 区间内；>500 硬限 = 既有登记（`docs/TODO.md:56`，本笔不拆） |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 384 +8–14 → ~392–398 | **394**（+10） | 区间内；≤500 ✓ |
| `thincoder-vscode/src/extension/panel-callbacks.mjs` | 331 +18–28 → ~349–359 | **362**（+31） | 超预计 +3（注释按判据写全）；≤500 ✓、软线基线即超（本批不拆——5.9 #5） |
| `test/integration/vsc-autoapprove-field.test.mjs` | ~+130–160 | **189** | 超预计（T1b 修正轮 +19；注释按判据写全） |
| `test/integration/vsc-spawn-ctx-permission.test.mjs` | ~+170–220 | **265** | 超预计 +45（全链三态夹具 + driveCards + T9） |
| `test/integration/host-shape-spawn.test.mjs` | —（清单外） | 203 → **209**（+6） | teardown 加固（修正轮 1——见 5.11） |
| `test/integration/files.mjs` | 19 +2 | **21 行 / 10 条** | ✓ |
| `docs/core/design/AGENT-LOOP.md` | 514（随 +2 已落） | **514** | in-place 编辑，计数不变 |
| `docs/core/design/CORE-UNIFICATION.md` | 1949（已落） | **1949** | in-place 编辑，计数不变 |

### 5.9 未落项（父侧 §6 复测 / 收口用——本笔零触碰）

1. **仓根宽度闸红（父侧收口面）**：本批批次档 §3 两条复核读数行超宽——`:398`（1222 字符）/ `:421`（1046 字符）；纯折行即绿、内容零改；§3 = 评审子代理段（一段一作者）⇒ 本笔零触碰，请父侧折行。
2. **覆盖面两残环（不在本批覆盖）**：⏹ 已开卡释放（核闭包不携条目 signal——2.16 行 9）· escalate / continue 归属标签（核名不携 id——2.16 行 10）——父侧 §6 复测清单请按「非本批面」记录。
3. **台账读数随收（台账零触碰）**：`docs/TODO.md:56` 记 setup.mjs「645 行」= 本笔前读数；本笔后 **655**（split）/ 654（wc）——请父侧随收。
4. **tool-ctx `getAuto` / `sessionSignal` 死字段**：本批只收正注释（边界 2.21 #3——不删；清理登记建议）。
5. **`panel-callbacks.mjs` 软线**（362 行 > 300 软线——基线即超）：本批增量小、不拆（设计 2.19 判据）；如父侧要登记，建议随台账。
6. **提交含设计师设计面**：`AGENT-LOOP.md` / `CORE-UNIFICATION.md` 两档本批设计收正在 `a0813b3b` 内（未单独提交）——如需分离请父侧裁定。

### 5.10 §5 自检修正（本席内 · 回读核对 D6）

- 落笔后回读（`read` 逐段）确认两段 append 均在位；三闸复跑暴露 **本席自引入 1 条 V2**（5.6 🔵#4 行「19 行 / 8 条（…）」——声明-枚举不符）⇒ 该行就地改写（「8 个登记项」形态，语义零改）。
- 复跑：`check-doc-width` = 一致性新增 0 · 存量 0；宽度闸剩红 = 5.9 #1（批次档 §3 两条——非本笔）。
- 终态三闸读数（cwd = 仓根 · 本段 append 后）：宽度 FAIL（§3 两条）· 台账 0 违规 · 锚 OK(V5) 0 悬空。

**STOP（实施轮终态）**——交付 = 提交 `a0813b3b` + 本段（修正轮经 5.11）；复测收口 = 父侧 §6 / 用户面（VSC 面板内 spawn 恢复）。

### 5.11 审计轮 + 代码评审轮（自含交付协议——轮次与终态）

**轮 A：内部 explore 分歧审计（BLOCKING——AGENT-LOOP §18 D-E2 ③）**。判读面 = 被审 8 档 + 批次档 §2/§3/§5 + 核侧读点实核 + 三段 RED/GREEN 日志。**结果 = DEVIATIONS（2 × 🔵，无 🔴/🟡）**：

| # | 类别 | 落点 | 处置 |
|---|---|---|---|
| A1 | PARTIAL（机判字面歧义） | `execute-tools.mjs:204-206`——旧句被引号原样保留（「已撕」留痕），字面 grep `ctx.getAuto` 仍命中 ⇒ §2.15「不得保留」按字面不达标 | **Fixed**（修正轮 1：注释改写为间接转述——旧句与 `ctx.getAuto`/`ctx.sessionSignal` 字面零残留；三事实句全留） |
| A2 | DOC-DRIFT（坐标漂移） | 批次档 §2.16 行 7 所引 `panel-callbacks.mjs:251`（onSubagentApproval 生产器）因本笔 import 块 +4 行 → **:255** | **Deferred**（§2 = 设计段——一段一作者；已列入 5.9 报告面，请父侧随收一行） |

**轮 B：内部代码评审（advisor type=code——同步）**。判读面 = 六档代码 + 批次档 + 两权威档。**VERDICT = pass（🔴 0 · 🟡 2 · 🔵 5）**——评审复核读数：A′/供给/透传与设计逐字一致；核侧读点与注释事实全部成立；T5–T9 无弱断言/假绿；两权威档回读坐标属实。

裁决表（`| # | Action | Detail |`）：

| # | Action | Detail |
|---|---|---|
| B1(🟡) | Deferred | 「回合首 AUTO → 轮中关 AUTO」窗口：建 gate 时 AUTO 真 ⇒ `permissionGate` 返 undefined（`permission-gate.mjs:47`）⇒ ①父非只读工具静默放行（`execute-tools.mjs:119`）②子代回退分支返回 false（`panel-callbacks.mjs:356-357`）。②= 本笔 D5 明示取舍（与修前同语义、零回归）；①= 既有面、批边界外——上抛父侧裁量（另案或台账），非本批 must-fix |
| B2(🟡) | Deferred | setup.mjs 655 行 > 500 硬限：既有登记债（`docs/TODO.md:56`）、R3 不重开裁定、本笔增量 +10 在预算内——维持「本批不拆」 |
| B3(🔵) | Deferred | `panel-callbacks.mjs` 362 / `execute-tools.mjs` 394 超 300 软线（基线即超；增量 +31/+10）——设计 2.19 判据「本批不拆」；登记建议随台账（5.9 #5） |
| B4(🔵) | **Fixed** | 机判面缺「重复 hydrate 重绑定」用例 ⇒ 修正轮 1 补 **T1b**（同 agent 二次 hydrate 换 getAuto 闭包——旧闭包翻转不影响 + 新闭包 live；生产路径 = 每轮复跑 hydrate 换闭包） |
| B5(🔵) | Deferred | 供给未传 `model` ⇒ `childOwnerLabel` 模型分支从本供给不可达（卡归属恒 `<role>#<id>`）；consult/escalate 派生键与活动块 label 一致性**未核**（webview 渲染面）——登记疑点，随 2.16 行 10 残环族由父侧/设计裁 |
| B6(🔵) | **Fixed** | §5.3 三处坐标差一（import :18-20→:21 · F1 透传 :218→:217 · F2 注释 :204-210→:204-209）——就地重锚（§5 本席段） |
| B7(🔵) | Deferred | `CORE-UNIFICATION.md:1323`「现形」锚滞后（panel-callbacks.mjs:195 现为 `statusTextPayload`；onQuestion 现住 :320）——非本批行、零改他段；报告父侧（另案重锚） |

**修正轮 1（本席内——只落 A1/B4/B6 三项直接导出修正 + 集成闸抖动处置）**：

1. A1：`execute-tools.mjs:204-209` 注释改写（字面零残留；字面 grep 双零命中已实核）。
2. B4：`vsc-autoapprove-field.test.mjs` +T1b（189 行；集成 48/48/0）。
3. B6：§5.3 三坐标就地重锚。
4. **清单外改动 1 处（如实披露）**：`test/integration/host-shape-spawn.test.mjs` `after` teardown 加固——本批两新档抬高并行临时区占空后该档实测间歇 EPERM（连续两跑复现、集成整档转红）；修 = 与两新档同法（`maxRetries: 10, retryDelay: 50` + 兜底）、零断言面改动。
5. 提交折入：`--amend` 未生效（工具行为 = 新 commit）⇒ 经一次 `reset --soft` 后重提为**单笔 `a0813b3b`**（9 档 +526/−10；工作树其余（台账 / 批次档）零纳入）。

**终态 = `clean`**（🔴 0；must-fix 项 0；修正轮 1 落地且复核绿：集成 48/48/0 · full 560/560/0 · 快层 560/525/0/35 · lint 197 · doc:check 0 · 核 195/195/0 · 台账 0 · 锚 0 悬空；宽度闸仅剩 5.9 #1 父侧项）。**门禁复核链**：修正轮后重跑全链（`f1-fix3-*` / `f1-final2-*` 日志），读数见 5.5。

## §6 验证与收口（父代理）

### 6.1 实施与验证（父侧实核）

- 实施提交 `a0813b3b`（9 档 / +526−10）：A′（`thincoder-vscode/src/agent/setup.mjs:480-489` 访问器）· F1（`panel-callbacks.mjs:333-359` 供给 + `execute-tools.mjs:217` 透传）· F2（注释 `:204-209`）
  · 两新测档（189 + 265 行）+ `files.mjs` 登记 · 两权威档回读与措辞收窄（`docs/core/design/AGENT-LOOP.md:394`/`:513` · `docs/core/design/CORE-UNIFICATION.md:1324`/`:1946`）· 清单外 1 处（`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:55-62` teardown 加固——如实披露、零断言面改动）。
- **反证三段（原样在案）**：修前集成 **47/37/10**（10 红 = 全部 positive；断言逐字 + 日志 `.thincoder/tmp/`）→ A′ 后 **47/42/5** → F1 后 **47/47/0**。
- 终态链：快层 560/525/0/35 · full 560/560/0 · 集成 **48/48/0** · lint **197** · `doc:check` V5 0 · 核 **195/195/0** · 台账 0 违规 · 锚域一 0 悬空 · **核树零 diff**（`git status --porcelain` 列证）· 宽度闸（本档 §3 两长行已由父侧折行，见 6.2）。
- 自含交付协议：审计 1 轮（A1 Fixed · A2 Deferred）+ 代码评审 1 轮 = **pass**（🔴 0 · 🟡 2 · 🔵 5）+ 修正轮 1（B4 / B6 Fixed）⇒ 终态 **clean**。

### 6.2 评审发现处置（父侧裁定）

- **B1**（🟡「回合首 AUTO → 轮中关 AUTO」窗口）= 既有面 + 本笔 D5 明示取舍、批外 ⇒ **登记技术待办**（触发=条件）；
- **B2 / B3**（体量：setup.mjs 655 越硬限；panel-callbacks 362 · execute-tools 394 越软线）= 既有登记、R3 不重开 ⇒ 台账读数随收；
- **B5**（供给未传 `model` ⇒ 卡归属恒 `<role>#<id>`）= 疑点 ⇒ **登记技术待办**（触发=条件）；
- **B7**（`CORE-UNIFICATION.md:1323`「现形」锚滞后）= 归「文档↔实装漂移（类）」行证据；
- **AC7 宽度红**（本档 §3 两条复核读数行 1222 / 1046 字符）= 父侧折行（同批落）。

### 6.3 测试寿命处置

T1–T9（两新档）= **转 ② 长期资产（常驻快层）**——三条件全满足（业务可观察 = 门判据 / 供给面行为；集成未覆盖 = 该两面首测；可稳定驱动 = 宿主侧直驱）；不适用退役。

### 6.4 呈请项（明示用户）

1. **覆盖面两残环不在本批**：child 定向取消（⏹）已开卡释放 · escalate / continue 问询卡归属标签（均为核零改面）；
2. **B1 窗口**（轮中关 AUTO 后的父级写工具 / 子代回退混判）= 已登记，待裁；
3. **reload 后人工复核**：自动轮 spawn 通 + 手动档子代写盘出卡（不再静默拒绝）。

### 6.5 收口行（核销同步清单）

- 台账：需求池两条（「VSC 顶层 `agent.autoApprove` 字段缺失」·「VSC spawn 工具 ctx 缺 `onPermissionRequest`」）→ `docs/TODO-archive.md` §四（已核销）；需求池 26 → 24；技术待办 9 → 11（+B1 +B5；setup 读数随收；B7 并入漂移行）。
- 提交：实现 = `a0813b3b`（单笔）；收口 = 本记录 + 台账两档。
- 推送：两远端（gitee / github）；凭证：本批 designId 槽位终消费（链终）。

### 6.6 未落项（携带）

1. `docs/TODO.md` setup.mjs 读数 645 → 655（本 §6 已随收）；
2. B5 疑点（模型分支不可达）· B7 锚滞后——均已登记；
3. 呈请项 1（两残环）——另批候选。

### 6.7 结论

批终态 = clean（AUTO 面 + 手动面落地 · 反证闭环齐 · 全链绿 · 核零改缝约自持）。
