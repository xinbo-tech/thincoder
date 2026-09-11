# VSC 固定活动区回归（live 固定可见）· 批次记录（2026-09-11）

> 搬迁注记：本档自 CLI 仓 `thincoder/docs/batches/2026-09-11-VSC-ACTIVITY-REGION-RESTORE.md` 迁入本仓 `docs/batches/`（LEDGER-SELF-CONTAINED 批——实施面全在本仓的批档物理迁移，档名不变、文字逐字；源档 blob SHA = 1c1854b8d397 · 源提交 = 167f48f）。

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-11 · 来源 = 用户 17:20 质询（「块为什么在会话流里」）→ 父侧取证链（git 史 + 档案）→ 用户 **17:23 裁定：「加回固定活动区。」**

---

## §1 讨论（主 agent）

### 一、背景（父侧取证链——16:20 核）

- **09-09 前段·用户裁定 D-1**：固定活动区（`#subagent-activity`——messages 与输入之间；「**live 固定可见**」（不随会话流滚动丢失）+ 单面板（一个面板））→ `SESSION-ACTIVITY-REVISED.md:10` + commit `5be6c67`（「子代理活动区回归 + Stop 语义（B1 修正——CLI 单面板形态）」）。
- **09-09 后段·用户裁定（档案原文）**：「块显示机制整体加戏——补丁叠补丁致间歇丢块——回 B1 简单形态——手工重写去加戏」→ `ACTIVITY-REWRITE-SIMPLE.md:7-8`：活动区容器及其派生**全删**、块回 `#messages` 流尾（commit `bdf0f63`）。
- **09-11·批 10**：只补出生可靠性（投递队列/就绪握手/终态防御）——**位置未动**。
- **用户 17:20 质询 → 17:23 裁定**：位置回退非本轮所愿——**加回固定活动区**。

### 二、裁定（用户 17:23）

**A = 加回固定活动区**——目标 = D-1 原话：**live 固定可见 + 一个面板**；同时**保留** 09-11 批 10 的全部可靠性机制（投递队列/就绪握手/终态防御）与 queued 可见性（F-2）——**「干净地基上的活动区」，不是回到补丁形态**。

### 三、约束（设计者须知）

1. **不回补丁地狱**：`ACTIVITY-REWRITE-SIMPLE` 点名删除的加戏链（DOM move 落流 + `freezeInsertPoint` 锚插链 / settle 驻留双态 / `_subagentMap` 逐行簿记 / preview/ticker）——**设计须给干净机制替代**，不得原样复活（其删因 = 间歇丢块，批 10 已治本；但旧补丁链本身仍是设计债）；
2. **可靠性零回归**：批 10 三条 + 现行两态机（live→frozen 原地折叠）语义保留；
3. **双端不对称 OK**：CLI 单面板形态照旧；各端独立实现、语义同源；
4. **开放设计问**（设计者定，含选型）：冻结块去向（区内原地 vs 落流——需给判据）；区显隐（常驻 vs 有 live 才现）；区高度/自滚策略；与 digest / 挂起态的交互（挂起期间块驻留语义）。

### 四、边界

- 只动 VSC webview 面（activity 族 + index.html/base.css + panels/chat/streaming/state + 测试 + locales）；扩展端协议零改；CLI 零改。

### 五、状态

**讨论收敛 2026-09-11 17:23**（用户「加回固定活动区。」）。下一步 = §2 批次任务（eng-designer）。

---

## §2 批次任务（eng-designer 写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求+设计+测试三层已落档；待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）。

**落档位置**：需求源 = 本批 §1（用户 17:23 裁定「加回固定活动区」——初版无需求档新增条目，需求三层以 §1 原文 + 本表承载；
修正轮已补齐需求第三腿：CLI 仓 `docs/requirements/AGENT-LOOP.md` §12，见修正轮 #6 与三方一致表）；设计+测试 = VSC 仓 `docs/design/WEBVIEW.md` **§12**
（§12.1–§12.10——选型/契约/决策/用例/AC/边界）+ §2/§3/§5/§5.1 修订 + 变更记录 §13；
`docs/design/AGENT-LOOP.md` §1 模块行 / §7 挂起 UI 与中止语义 / §10 全节改写（+ 变更记录）；
沿革档两指针（`SESSION-ACTIVITY-REVISED.md` / `ACTIVITY-REWRITE-SIMPLE.md`）。

### 一、覆盖条目（本批条目 = 设计回指 = §1 裁定；三方一致清单）

| # | 条目 | 设计 | 用例 | 验收 |
|---|---|---|---|---|
| R1 | 活动区回归（live 固定可见 + 单面板——§1 目标） | §12.1 · §12.3#1-2 | T-R1/T-R2/T-R9 | AC-R1 |
| R2 | 可靠性零回归（批 10 三条 + 两态机——§1 约束 2） | §12.3#3/#10 · §5/§5.1 修订 | T-R3..T-R6 · T-R11 · T-R16 | AC-R2 · AC-R7 |
| R3 | 冻结块去向（开放问 Q1——区内原地 vs 落流） | §12.2 Q1 · §12.3#4 | T-R8/T-R14 | AC-R3 |
| R4 | 区显隐（Q2——常驻 vs 有 live 才现） | §12.2 Q2 · §12.3#5 | T-R7 | AC-R4 |
| R5 | 区高度/自滚策略（Q3） | §12.2 Q3 · §12.3#6-7 | T-R10 | AC-R5 |
| R6 | 与 digest/挂起态交互（Q4——挂起期驻留语义） | §12.2 Q4 · §12.3#3 | T-R5/T-R16 | AC-R6 |
| R7 | ⏹ 委托与 reset 语义 | §12.3#8-9 | T-R12/T-R13 | AC-R8/AC-R9 |
| R8 | 测试族更新 + 文档面 | §12.6/§12.7 | 全表 | AC-R10 |

### 二、影响文件全清单（行数口径 = `split("\n").length` 含末行；as-of 2026-09-11 实测）

**实施域（coder——VSC 仓；12 改 = 9 源 + 3 测试；代码面 ~+60 / 测试面 ~+53）**：
`webview/index.html`(85,+2) · `webview/base.css`(435,+~18) · `webview/state.js`(122,+1) ·
`webview/activity.js`(298,+~15) · `webview/ui.js`(483,+~12) · `webview/streaming.js`(247,±5) ·
`webview/chat.js`(355,±3) · `webview/chat.css`(470,±1) · `webview/activity-view.js`(157,±4) ·
`test/helpers/webview-env.mjs`(91,+1) · `test/activity-flow.test.mjs`(292,+~40) · `test/async-visibility.test.mjs`(388,±12)。
**拆分评审注**：activity-flow 292→~332 越 ≤300 警示线（≤500 硬限内）——测试族存量同带（最高 `chat-panel.test.mjs` 620）——本批**不拆分**（就地改写——同第 10 批结论）。

**文档域（设计者已落——coder 零碰）**：`docs/design/WEBVIEW.md`（1029→1221——初版落档时点；修正轮后实测 1227→1257，现档 1257；§2/§3/§5/§5.1 修订 + §12 新节 + 变更记录 §13）· `docs/design/AGENT-LOOP.md`（1045→1042：§1/§7/§10 + 变更记录）· 两沿革档指针（各 +3 行量级）。
**不入 files**：`docs/TODO.md` / `CHANGELOG.md`（父侧写域）· CLI 仓一切文件（本批 VSC 单端——需求树除外：本批条目落 CLI 仓 `docs/requirements/AGENT-LOOP.md` §12，同先例 §3/§8~§11）· 群 A 批 §11/§13/§14 节域（零碰）。

### 三、验收标准（逐条——每条可机器验证；判据全文见 §12.8，不重抄）

- **AC-R1**（§1 目标）= T-R1/T-R9：一切出生块 parentNode === `#subagent-activity`；`#messages` 内 `.sub-block` 计数 == 0；区位于 messages 与 panels 之间（index.html 结构断言）。
- **AC-R2**（§1 约束 2）= T-R3/T-R5/T-R6/T-R15/T-R16：折叠原地（容器与 DOM 序号不变）；终态闭合/幂等/queued/补桩/接管断言全绿。
- **AC-R3**（Q1）= T-R8/T-R14：折叠块在区不落流；上限 20 丢最旧折叠（DOM 先出）；簿记守卫保留（迟来消息丢弃）。
- **AC-R4**（Q2）= T-R7：空区 children==0 且 `:empty` 规则在位；块入区即现。
- **AC-R5**（Q3）= T-R10 + 静态样式断言（32vh / overflow-y / overscroll-behavior）。
- **AC-R6**（Q4）= T-R5/T-R16 + §5.1 位置口径修订在位（流尾→区尾——文档断言）。
- **AC-R7**（§1 约束 2 零回归）= VSC 快层全绿；extension 端 `git diff` 空（协议零改）；trace/接管/补桩调用点在位（机检）。
- **AC-R8**（reset/清屏）= T-R11/T-R12；**AC-R9**（⏹ 委托）= T-R13；**AC-R10**（文档面）= 设计修订在位 + `check-doc-width` 新增超宽 0。

### 四、用例（三态——共 16 例 T-R1..T-R16；输入/预期全文 = §12.7）

正常：T-R1 区出生 · T-R2 内容入块 · T-R3 原地折叠 · T-R4 queued 三分支 · T-R5 终态补桩 · T-R6 新代接管 · T-R11 清屏恢复 · T-R15 error/answered · T-R16 兜底折叠；
边界：T-R7 区显隐 · T-R8 区上限 · T-R9 live 不裁 · T-R10 区自滚 · T-R12 回合中止；
错误面：T-R13 ⏹ 委托点击 · T-R14 迟来丢弃。
**测试族写法**：activity-flow 全族改写为区语义（出生 parentNode=区/折叠原序号/上限/显隐/自滚/委托）；async-visibility 更新（helper/fresh 改区 + T-V3 位置断言改区）；helpers/webview-env fixture 恢复 `#subagent-activity` id。

### 五、开放设计问选型表（§1 约束 4——逐项 ≥2 候选 + 判据 + 否决理由；全文 §12.2）

| 问 | 选定 | 否决候选（理由） |
|---|---|---|
| Q1 冻结块去向 | 区内原地保留（上限 20） | 落流（DOM move + 锚链 = 补丁链复活——约束①）/ 折后即移除（补桩不可见——批 10） |
| Q2 区显隐 | 有内容才现（CSS `:empty` 零 JS） | 有 live 才现（折叠条目藏而不删）/ 常驻空面板（空占位） |
| Q3 高度/自滚 | 自适应 + 32vh 封顶 + 区内自滚 + pin 跟随 | 固定高 / 不封顶 / 不 pin |
| Q4 digest/挂起 | 块驻留区 + settled 即时折叠（digest 零位移） | settle 驻留 awaiting digestion 双态（复活被删机制） |

### 六、明确不在本批（不扩面）

- CLI 端（单面板照旧）；扩展端协议与实现（投递队列/握手/终态防御零动）；行面板复活；跨 reload 恢复；新交互元素/新 locale 键；块内渲染改造（chat.css 块样式原样）；advisor 流内块（`S._advisorBlock` ∈ #messages）；群 A §11 节域。

### 七、纪律与边界（coder 须知 + 父侧事项）

- **D1 写权**：coder 写实施域 12 文件；文档域 = 设计者已落——coder 零碰（发现文档需改 → 回报）。
- **D5 冻结窗（落笔时点核验）**：设计先行；群 A 轮次 1 评审实例 17:33 已 settle（冻结窗关闭）后落笔——落笔核验通过、无违规；coder 实施期不改设计档。
- **D6**：写入后回读核对；行数对表入 §5。
- **逐字纪律**：无新增文案/i18n；⏹ 与头词语义零变（仅迁址）；常量 `MAX_REGION_FOLDED = 20` / `max-height: 32vh` 单点定义。
- 不 commit（改动留工作区）；凭证不落档；越出声明写域 → 停下报告；**群 A A13 实施面重叠**（`webview/activity.js`/`chat.css`/`state.js`/`locales`/`activity-flow`）——父侧按 files 域串行（本批先落）。
- **父侧登记项（批后核销）**：VSC `docs/design/README.md` 补登行 + `docs/TODO.md` 状态推进 + 需求池（如适用）。

### 修正轮（评审轮次 1 后——2026-09-11）

> 背景：轮次 1 设计评审（§3）VERDICT = changes-required（🔴1 · 🟡5 · 🔵1 = 7 条）；父侧裁决 = **7 条全修**。
> 本轮 = 修正轮——**只改文档、零实现触碰**（VSC 仓 `src/**` / `webview/**` / `test/**` / `locales/**` 零触碰；
> 未 commit、未发起评审——轮次 2 复核待父侧发起）。D5 落笔时点核验通过（轮次 1 实例已 settle）；
> 凭证不落档（D5/D6——回读核对已跑）。**落修文件**：VSC 仓 `docs/design/WEBVIEW.md`（1227 → 1257 行，含 §13 变更记录一行）
> · CLI 仓 `docs/requirements/AGENT-LOOP.md`（390 → 438 行——§12 新增）；其余零触碰。

**逐条落点**（以 §3 轮次 1 表为准；`WEBVIEW.md` = VSC 仓 `docs/design/WEBVIEW.md`）：

| # | 级别 | 处法 / 落点 |
|---|---|---|
| 1 | 🔴 | `WEBVIEW.md` §5.1.8 AC-A1 采样点改 `#subagent-activity > .sub-block.sub-live`（区内 2 live 块）；AC-A3 改 `#subagent-activity > .sub-block`（区内计数不变）；§12.3#10 列举补 AC-A1/AC-A3（+ sweep 清单，见 #2）。语义零变（漏块防回归不变——仅采样点改区）。 |
| 2 | 🟡 | 全档位置 sweep 六处落修（流内/流尾 → 区口径）：§5.1.2 复现手法（采样点改区）· §5.1.4 第 5 条 · §5.1.5 D-4 · §5.1.7 T-V2 · §6 · §8.4（停止靠区内逐块 ⏹）；§12.3#10 改 ①再断言位置 ②位置措辞 sweep 正列。**交接登记**：§11.2.1（「现行 = 流内活动块」）属群 A A13 节域——本批零碰，**交接 A13 批改**。 |
| 3 | 🟡 | fixture 空安全（取①）：§12.3#8 明写 chat.js 委托 + §12.3#7 区监听用空安全绑定（`ctx.activityEl?.addEventListener`——生产行为不变）；§12.6 边注 fixture 波及面——`digest-visibility` / `scenario-05` 不列写域、零改；webview-env +1 照旧（`installChatFixture` 区 id）。 |
| 4 | 🟡 | T-R13 手法钉死（§12.7 注 + §12.6 activity-flow 行注）：activity-flow 内**追加式**补缺项 21 id（对照 `installFullIndexFixture` 清单——append 不换夹具——既有 `ctx` 引用零失效）→ `import` 真 `chat.js` 图；断言 = `capturedPosts` 过滤 `cancelSubagent` 逐字 + `defaultPrevented` 真触 + document 见证零命中 + 块不翻。 |
| 5 | 🟡 | §12.6 补**源侧拆分评审注**（activity.js 298→~313 越 300 软线——不拆；再增厚即触发评估）；**A13 基线漂移登记**：§11.2.3 的 activity.js / activity-flow 行（298 / 292 前提）因本批先落而失效——交接 A13 批更新。 |
| 6 | 🟡 | 需求第三腿补齐：CLI 仓 `docs/requirements/AGENT-LOOP.md` 新增 **§12**（总体需求 + F-J1..F-J8 逐条对位 R1–R8 + NFR-J1..J4 + 明确不做——判定句回指 AC-R1..AC-R10）；三方一致表见下。 |
| 7 | 🔵 | `WEBVIEW.md` §3 `activity.js` 行补第 10 批指注（「第 10 批修订——现行权威，见 §5/§5.1；补桩集 = §5.1.4 第 6 条」——与 §5 指注同款）。 |

**可行性核验（#4 证据）**：只读临时探针（独立 node 进程——零仓库写入）实测——小夹具 + 21 缺项补齐后 `chat.js` 模块图导入 OK；
`.sub-stop-btn` 点击 → `capturedPosts` 逐字 `{type:"cancelSubagent", id, role}`；`dispatchEvent` 返 false（preventDefault 真触）。

**三方一致（修正后收口——批次 §2 条目 = 设计回指 = 需求条目）**：

| # | 批次条目（§2 一表） | 需求（CLI 仓 `requirements/AGENT-LOOP.md` §12） | 设计 | 验收 |
|---|---|---|---|---|
| R1 | 活动区回归（live 固定可见 + 单面板） | §12 F-J1 | §12.1 · §12.3#1-2 | AC-R1 |
| R2 | 可靠性零回归（批 10 三条 + 两态机） | §12 F-J2 | §12.3#3/#10 · §5/§5.1 修订 | AC-R2 · AC-R7 |
| R3 | 冻结块去向（Q1） | §12 F-J3 | §12.2 Q1 · §12.3#4 | AC-R3 |
| R4 | 区显隐（Q2） | §12 F-J4 | §12.2 Q2 · §12.3#5 | AC-R4 |
| R5 | 区高度/自滚（Q3） | §12 F-J5 | §12.2 Q3 · §12.3#6-7 | AC-R5 |
| R6 | digest/挂起交互（Q4） | §12 F-J6 | §12.2 Q4 · §12.3#3 | AC-R6 |
| R7 | ⏹ 委托与 reset 语义 | §12 F-J7 | §12.3#8-9 | AC-R8/AC-R9 |
| R8 | 测试族更新 + 文档面 | §12 F-J8 | §12.6/§12.7 | AC-R10 |

**登记（父侧核销台面）**：① §11.2.1 交接（群 A A13 批改）；② §11.2.3 基线漂移（A13 批更新）；
③ 需求树新增（CLI 仓 requirements——`docs/TODO.md` / `CHANGELOG.md` / VSC `docs/design/README.md` 仍归父侧）。
**实施清单口径**：12 文件实施域不变；`webview-env.mjs` +1 照旧；activity-flow 内 T-R13 手法并入 +~40 预算。
**状态推进**：任务书 = 修正轮后版本——待轮次 2 复核（父侧发起）→ 用户批准；UI/交互决策全落档（§12.10 无 open 项）。

**自检**：D6 回读核对已跑（逐处）；两仓 `check-doc-width` 本批触碰档**新增超宽 0**（VSC 仓全绿——69 文件 0 超宽）；
零代码 / 零提示词 / 未 commit。**lint 备注**：CLI 仓脚本余量告警（17 档）与新增一致性项（6 条）均在其他批在飞档
（非本批触碰——ACP-CHANNEL-FIXES / PORTABILITY / TUI-SELECTION 等）；批次档 §3 的核验基础行超宽（评审子代理所写，
一段一作者——非本轮写域）——报父侧处置（轮次 2 复核侧可修）。

## §3 设计评审（评审子代理）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

**发现表（设计评审 · VSC 固定活动区回归批——对象 = 批次档 §1/§2 · VSC 仓 `WEBVIEW.md` §12 新节 + §2/§3/§5/§5.1 改写 + §13 · `AGENT-LOOP.md` §1/§7/§10 + 变更记录）**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership / Acceptance | 🔴 | `WEBVIEW.md:316` §5.1.8 **AC-A1** 仍断言 `#messages > .sub-block.sub-live` 计数 == 2——与 §12.3#2（`:1042-1043`「`#messages` 零 `.sub-block`」）及 AC-R1（`:1138-1139`「`#messages` 内 `.sub-block` 计数 == 0」）为**同一机制（块出生地）的相反描述**；AC-A1 承载 T-V1——其测试体（`test/async-visibility.test.mjs:255-258` 的 `subBlocks` 数 `ctx.messagesEl.children`）正是本批要改区的对象（§12.6:1105「helper/fresh 改区」），按 §5.1.8 文本机验必红。§12.3#10（`:1060-1063`）的修订列举只含 §5.1.4 第 2/4 条 · D-6 · §5.1.6 panel-session 行 · T-V3 · AC-A4——AC-A1 漏网。AC-A3（`:318`「`#messages > .sub-block` 计数不变」）同族：该采样点在区语义下变空转（错误补桩将落区，此断言看不见）。 | 把 AC-A1/AC-A3 纳入本批 sweep（采样点改 `#subagent-activity`：AC-A1 = 区内 2 live 块；AC-A3 = 区内计数不变），或显式标注其口径已由 §12 取代——二择一，勿两可并存。 |
| 2 | Clarity / 一致性 sweep | 🟡 | §12.3#10「唯一口径修订」只列 5 点，而变更记录（`:1172`）宣称「§5.1 位置口径修订（流尾→区尾）」；未列点位仍以「流内/流尾」作**现行**口径：§5.1.4#5（`:246`「旧冻结块以 DOM 留在流内作历史」）· §5.1.2 复现手法（`:168`「数 `#messages > .sub-block`」）· T-V2（`:306`「旧块仍在流内冻结」）· D-4（`:279`）· §6（`:359`「子代理停止靠流内逐块 ⏹」）· §8.4（`:548` 同句族）· §11.2.1（`:938`「现行 = 流内活动块」——A13 节域）。其中 `:359`/`:548` 是停止语义归属的现行陈述（他档会引用）。 | 一次全档 sweep 补齐（`:938` 属群 A A13 批——本批零碰，至少登记交接）；或把 §12.3#10 的列举改为正列清单，免「已修订」与实况不符。 |
| 3 | Feasibility / 受影响文件 | 🟡 | §12.3#8（`:1056-1057`）把 chat.js 顶层委托（`:89` `ctx.messagesEl.addEventListener("click", onStopClick)`）迁至 `ctx.activityEl`；§12.3#7（`:1052-1055`）再给区挂 wheel/touch（`scroll.js:11` 顶层 `initScrollFollow(ctx)`）。凡驱动真 chat.js 模块图的既有测试，fixture 缺 `#subagent-activity` 即 import 期抛 TypeError（null.addEventListener）：`test/digest-visibility.test.mjs`（自持 INDEX_IDS `:23-29`/`:34`、loadChat `:95-97`——快层在册 `files.mjs:57`）· `test/integration/scenario-05-panel-basics.test.mjs`（`:28` installFullIndexFixture）· `installFullIndexFixture`（`webview-env.mjs:79-89`）。设计只列 webview-env.mjs +1（batch:69 / §12.6:1103），digest-visibility 不在 12 档内；按字面实现（无 `?.`）→ 快层 T-D4/T-D5 红 → AC-R7（`:1147`）不成立。 | 二择一钉死：① 两处绑定用空安全（`ctx.activityEl?.addEventListener`——生产行为不变，fixture 零改）；或 ② 三处 fixture 补 id（webview-env 两表 + digest-visibility INDEX_IDS）并把 digest-visibility 列入受影响表。 |
| 4 | Clarity / 用例可机验 | 🟡 | T-R13（§12.7:1131）「区内点击 `.sub-stop-btn` → cancelSubagent postMessage 逐字 + 不翻折叠」手法未钉：委托 handler 在 chat.js 顶层（`:82-89`），而 activity-flow 现不加载 chat.js（`:27-33` 只 import state/ui/activity），其 fixture（installChatFixture）亦不含 chat.js 图所需 id（如 `chat-container`——`scroll.js:20` 顶层 appendChild）。不加载 chat.js 则点击无监听者——断言无法成立（或空转假绿）。 | 在 §12.7/§12.6 明写 T-R13 手法（在哪个档、是否换 installFullIndexFixture / 扩 installChatFixture、capturedPosts 取用），保证 postMessage 逐字与 preventDefault/stopPropagation 真被驱动。 |
| 5 | 结构合规（受影响文件） | 🟡 | activity.js 298→~+15 ≈ 313 越 >300 软线（§12.6:1097 无拆分评审行——同表 activity-flow 越线有注 `:1110-1111`）；且群 A A13 的既有注以 298 为基（`:957`「298→≤306 越 300 软线…**再增厚即触发拆分评估**」、`:962` activity-flow 292→~310）——本批先落（batch:112）使该两处前提失效。 | 补一行源侧拆分评估（313 的软线处置：为何不拆/何时拆）+ 登记 A13 基线漂移（父侧排程已知会 A13 批）。 |
| 6 | Requirements / 文档链（协调项） | 🟡 | batch:44-45 声明「本批无需求档新增条目，需求三层以 §1 原文 + 本表承载」——第三腿（requirements/ 条目）留空；同日报先例 VSC-ASYNC-VISIBILITY 落了 `requirements/AGENT-LOOP.md` §3/§4（batch:85-86），同类情形在先例评审判 🟡（`batches/2026-09-11-SPAWN-QUEUE-DISCIPLINE.md:140`）。属协调项，非实现阻塞。 | 父侧裁：补一条 requirements 回指（R1..R8）或确认微批豁免并在 §6 留痕。 |
| 7 | Doc hygiene | 🔵 | §3 activity.js 行（`:64-69`）保留「其余 status 一律终态折叠——lookup-only 绝不建块」——与第 10 批补桩表（§5.1.4#6 `:249-266`）并读为冲突；§5（`:125-126`）已带「（第 10 批修订——现行权威）」指注，§3 行无（batch-10 遗留；本批 §3 同步面触碰未随补）。 | 随 §3 同步补同款指注，或明示该行为摘要、语义权威在 §5/§5.1。 |

**计数**：🔴 1 · 🟡 5 · 🔵 1。

**核验基础**：批次档全文 · `WEBVIEW.md` §2/§3/§5/§5.1.6-9/§12/§13 现读 · `AGENT-LOOP.md`（VSC）活动区引用 grep 抽核（§1 行 `:81` / §7 `:329/:336-337` /
  §10 `:410-412` / 变更记录 `:39` 在位）· 源码抽检 `activity.js`（298 行 ✓ 全文）· `chat.js`（355 ✓）· `scroll.js` · `webview-env.mjs`（91 ✓）·
  `activity-flow.test.mjs`（292 ✓）· `async-visibility.test.mjs` · `digest-visibility.test.mjs` · `files.mjs`。未逐档复核：index.html / base.css / state.js / ui.js / streaming.js /
  chat.css / activity-view.js 行数与 AGENT-LOOP「1045→1042」差（**unverified**——不参与判定）。只读评审、零写盘。

VERDICT: changes-required

> 〔父侧代笔：折行——§3 轮次 1 的「核验基础」超宽行（原单行 508 字符）按空白归一逐字折行，零增删；父侧落笔打标（六段纪律父侧代笔规则）。〕

### 轮次 2（评审子代理）

**发现表（轮次 2——单轮校验：7 件修正落点复核；对象 = 批次档 §2 修正轮 7 条落点 × VSC 仓 `WEBVIEW.md` §3/§5.1/§12 × CLI 仓 `requirements/AGENT-LOOP.md` §12）**

核验：轮次 1 的 7 条修正 **7/7 全部落位**——① AC-A1 `:316` / AC-A3 `:318` 采样点改区 + §12.3#10 `:1067-1072` 补列 ② 六处 sweep `:168` / `:246` / `:279` / `:306` / `:359` / `:548` 全改区口径 + 正列在位 + §11.2.1 交接登记（batch:128 / :151）
③ §12.3#7 / #8 空安全绑定 + §12.6 `:1127-1130` fixture 边注 ④ §12.7 `:1156-1165` 手法注 + 探针实测（batch:135-136）+ §12.6 `:1113` 行注
⑤ §12.6 `:1122-1125` 源侧拆分注 + A13 基线登记（batch:131 / :151-152） ⑥ CLI 仓 `requirements/AGENT-LOOP.md` §12（`:389-438`）+ 三方一致表（batch:140-149） ⑦ §3 第 10 批指注 `:67` 逐字吻合；另 §3 核验基础折行打标（batch:181-184 / :188）在位。残遗/注记 = 下表（无 🔴）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 一致性（残遗——#6 收口后 §2 主文未同步） | 🟡 | batch:44-45 仍称「本批无需求档新增条目，需求三层以 §1 原文 + 本表承载」——与同档修正轮 #6（batch:132「需求第三腿补齐：CLI 仓 `docs/requirements/AGENT-LOOP.md` 新增 §12」）、三方一致表（batch:140-149 需求列）、落档实况（CLI 仓 `requirements/AGENT-LOOP.md` §12 在场）及设计侧需求树行（`WEBVIEW.md:1119`）相抵；batch:73「CLI 仓一切文件（本批 VSC 单端）」亦缺 `WEBVIEW.md:1132-1133` 同款「需求树除外」限定。 | 两处按设计 §12.6 对齐：batch:44-45 注「修正轮补齐 requirements §12——见下」；batch:73 照抄「需求树除外：本批条目落 CLI 仓 `docs/requirements/AGENT-LOOP.md` §12」。一行小改、零语义。 |
| 2 | 计数一致性（行数快照） | 🔵 | 同档两处 WEBVIEW.md 行数快照不一致：batch:72「1029→1221」 vs batch:120「1227 → 1257 行」；现档实测 1257 与后者吻合；轮次 1 引用锚点（AC-R1 `:1138-1139`）现于 `:1169-1171`（位移 ≈ +30 = 修正轮增量）佐证轮次 1 时点值为 1227。两者差 6 行——若中间另有他批落笔（**unverified**）则均属真值、仅缺时点注；否则为漂移。 | 在 batch:72 补时点/口径注，或校对「1221」。 |
| 3 | 残遗（登记交接——他批节域） | 🔵 | `WEBVIEW.md:939` §11.2.1 仍写「现行 = 流内活动块（`activity.js`）」；`:958` / `:963` §11.2.3 的 298 / 292 基线将因本批先落失效——两处均属群 A A13 修改面，已按轮次 1 处置登记（batch:128 · :131 · :151-152；`WEBVIEW.md:1124-1125` 指注在位）——本轮确认残遗在位、待 A13 批改，**非本批缺陷**。 | 无需本批动作（保持登记；A13 落笔时更新）。 |
| 4 | 措辞自洽（修正轮新增文本） | 🔵 | `WEBVIEW.md:1123-1124` 源侧拆分注称「（单点小改——无新函数面扩张）」，而同句增量列举含 `enforceRegionCap`（新 helper——`:1052`）与 `MAX_REGION_FOLDED`（导出常量——`:1051`；`:131` 标「本批新增」）——严格读与列举相悖，与「再增厚即触发拆分评估」判据并读易生歧义。 | 措辞精确化（如「仅 1 个小 helper——无大函数面」）；零语义。 |

VERDICT: pass

**计数**：🔴 0 · 🟡 1 · 🔵 3——轮次 1 的 7 条修正 7/7 落位；上表均不阻断。

## §4 用户批准（主 agent 记）

> 〔父侧代笔：折行——§3「核验」行（原单行 319 字符）按空白归一逐字折行，零增删；父侧落笔打标。〕

**2026-09-11 19:20 父侧代签**——用户 16:40 授权窗口 + 17:23「加回固定活动区」直令；条件齐备：轮次 1 changes-required（🔴1·🟡5·🔵1）→ 修正轮 7/7 → 轮次 2 pass（0🔴·0🟡·3🔵）→ 残项微修 4 件（#182）→ **token 已签发**（值不落档）。

**父侧裁定（轮次 2 四 🔵）**：① 主文同步——已落修；② 行数快照——已落修（时点注）；③ A13 交接登记——**维持零动**（A13 批落笔时更新）；④ 措辞自洽——已落修。另 `:42` / `:154` 既往状态句 = **历史留档零动**（append-only）。

**批准范围**：活动区回归（R1–R8）——实施面 12 档（webview 9 + 测试 3；文件域以 §2 表为准）；实施者 = eng-coder（设计 token 门）。

**遗留**：commit 待父侧随批提交。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

**状态：交付完成（2026-09-11 · 实施者 = eng-coder · 设计 token 门（值不落档）· 终态 = clean）**
——内层 explore 背离审计 **2 轮**（轮次 1：2 条发现 = 1 条已修 + 1 条产物登记；轮次 2 只读复核 fix = clean）；
**advisor 代码评审未发起**（任务书红线「不发起评审」——归父侧流程节点）。

**范围**：R1–R8 八条目 + 用例 T-R1..T-R16 + AC-R1..AC-R10 逐条机验。设计权威 = VSC 仓 `WEBVIEW.md` §12（+ §2/§3/§5/§5.1）+ `AGENT-LOOP.md` §7/§10（文档域 = 设计者已落——coder 零碰）。
**红线核**：不 commit（改动留工作区）· 不发起评审 · 真跑（长测试先落盘再查）· extension 端零改 · 无新增文案/i18n · 凭证不落档。

### 一、落笔清单（12 档——行数口径 = `split("\n").length` 含末行；实测 = 落笔后 as-of 2026-09-11）

| 文件 | 设计 as-of | 落笔后 | Δ | 改动要点 |
|---|---|---|---|---|
| `webview/index.html` | 85 | 86 | +1 | 区容器 div（messages 与 panels 之间——`role="region"`） |
| `webview/base.css` | 435 | 448 | +13 | grid 五行 + 区样式（`:empty` 隐藏 / 32vh / `overflow-y:auto` / `overscroll-behavior:contain` / padding） |
| `webview/state.js` | 122 | 127 | +5 | `ctx.activityEl`（+3 行注释；余 +1 = A13 先落 `_subDescShown`） |
| `webview/activity.js` | 298 | 328 | +30 | 头注机制段重写 + `buildBlock` 目标区 + `MAX_REGION_FOLDED` + `enforceRegionCap` + `resetActivity` 全区清 |
| `webview/ui.js` | 483 | 492 | +9 | `maybeScrollActivity` + `initScrollFollow` 单 `watch(el,key)` 闭包双目标（区监听——`?.` 空安全） |
| `webview/streaming.js` | 247 | 249 | +2 | rAF 尾区 pin + 头注/`subagentChunk` 注 |
| `webview/chat.js` | 355 | 355 | 0 | ⏹ 委托迁区（`ctx.activityEl?.addEventListener`）+ 注 |
| `webview/chat.css` | 470 | 477 | +7 | 注释同步（+1；余 +6 = A13 先落 `.sub-desc`） |
| `webview/activity-view.js` | 157 | 157 | 0 | 头注同步（零逻辑） |
| `test/helpers/webview-env.mjs` | 91 | 92 | +1 | fixture `#subagent-activity` id 回归（messages 之后——位置序同 index.html） |
| `test/activity-flow.test.mjs` | 292 | 486 | +194 | 区语义全族改写（含 A13 先落 +51 基线；本批新增 T-R7/T-R8/T-R9/T-R10/T-R11/T-R13） |
| `test/async-visibility.test.mjs` | 388 | 402 | +14 | helper/fresh 改区 + T-V1/T-V2/T-V3/T-V4 采样点与位置断言改区 |

### 二、契约逐条落点（§12.3 第 1–10 条）

1. **容器**：`index.html:25` `<div id="subagent-activity" role="region" aria-label="Subagent activity"></div>`（messages 与 panels 之间——逐字）。
2. **出生**：`activity.js` `buildBlock` 单点 `ctx.activityEl.appendChild(block)`（`ensureBlock`/`takeoverBlock`/`stubTerminalBlock` 三路径共用）——`#messages` 零 `.sub-block`。
3. **折叠**：`freezeBlock` 原地（容器与 DOM 序号不变）——终态集合闭合 / settled 视同 done / answered 裁决 / 幂等守卫 / tombstone 全原样（§5/§5.1 语义零改）。
4. **保留**：`MAX_REGION_FOLDED = 20` 导出常量；`freezeBlock` 折后 `enforceRegionCap()`——移除 DOM 中最旧 `.sub-frozen`（先序 = 出生序）；**簿记条目保留**（幂等守卫；`resetActivity` 才清）。
5. **显隐**：`base.css` `#subagent-activity:empty { display: none; }`——零显隐 JS。
6. **高度/滚动**：`max-height: 32vh` + `overflow-y: auto` + `overscroll-behavior: contain` + `padding: 0 12px`（`chat.css` 块内 `.advisor-content` 100px 原样）。
7. **区自滚**：`ctx._pinActivity`（默认钉底）+ `ui.js maybeScrollActivity`——`buildBlock` 与 `streaming.js` rAF 尾两驱动；`initScrollFollow` 区 wheel/touch 监听（近底 <24px 解/重 pin——`?.` 空安全）；**块出生不再牵动 `#messages` 滚动**（原 `maybeScrollDown` 调用已删）。
8. **⏹ 委托**：`chat.js` `ctx.activityEl?.addEventListener("click", onStopClick)`——单委托点（messagesEl 侧零残留）；postMessage 载荷与 preventDefault/stopPropagation 逐字不变。
9. **resetActivity**：清区全部条目（live + 折叠——D-A8）+ 清 map + 防御孤儿清（选择器改全类 `.sub-block`）。
10. **批 10 机制零改**：投递队列 / 就绪握手 / 终态防御实现面未动；extension 端零改（协议零改）；位置口径修订为文档面（设计者已落）。

### 三、用例与 AC 覆盖（逐条机验）

| 用例 | 落点 | 结果 |
|---|---|---|
| T-R1 区出生 | activity-flow::T-R1（+ index.html 结构断言 messages→区→panels） | ✔ |
| T-R2 内容入块 | activity-flow::T-R2 | ✔ |
| T-R3 原地折叠 | activity-flow::T-R3（done + settled 同族断言——容器/序号不变） | ✔ |
| T-R4 queued 三分支 | activity-flow::T-R4 | ✔ |
| T-R5 终态补桩 | async-visibility::T-V4 + T-V5（不补行边界） | ✔ |
| T-R6 新代接管 | async-visibility::T-V2（旧块留区内冻结） | ✔ |
| T-R7 区显隐 | activity-flow::T-R7（children 0↔N + `:empty` 规则静态断言） | ✔ |
| T-R8 区上限 | activity-flow::T-R8（21 折叠 → 丢最旧 / live 不裁 / 被移除频道迟来丢弃） | ✔ |
| T-R9 live 不裁 | activity-flow::T-R9（151 消息裁：live 与折叠块均留区；消息窗 150） | ✔ |
| T-R10 区自滚 | activity-flow::T-R10（pin/解 pin 不强拉/回底重 pin + 32vh·overflow·overscroll 静态断言） | ✔ |
| T-R11 清屏恢复 | activity-flow::T-R11（区零残留 + 重建块区尾/pool/⏹/startedAt） | ✔ |
| T-R12 回合中止 | activity-flow::T-R12（全区清含折叠 + map 清） | ✔ |
| T-R13 ⏹ 委托 | activity-flow::T-R13（追加补 21 id + 真 `chat.js` 图；`capturedPosts` 逐字 + `defaultPrevented` + document 见证零命中 + 块不翻） | ✔ |
| T-R14 迟来丢弃 | activity-flow::T-R14（折叠后 / 上限移除后 / 元素移除三径） | ✔ |
| T-R15 error/answered | activity-flow::T-R15 | ✔ |
| T-R16 兜底折叠 | activity-flow::T-R16（freezeLiveBlocks 原地） | ✔ |

- **AC-R1** = T-R1/T-R9 + 结构断言 ✔ · **AC-R2** = T-R3/T-R4/T-R14/T-R15/T-R16 ✔ · **AC-R3** = T-R8/T-R14 ✔ · **AC-R4** = T-R7 ✔ ·
  **AC-R5** = T-R10 + 静态样式 ✔ · **AC-R6** = T-R3（settled 即折）+ §5.1 位置口径在位（抽查：`:168/:243-246/:279/:292/:306/:316-319` 均区口径）✔ ·
  **AC-R7** = 快层 0 fail + `src/**` 零触碰（本批只写 webview/test 12 档）+ trace/接管/补桩调用点机检（async-visibility::AC-A6/A7 用例）✔ ·
  **AC-R8** = T-R11/T-R12 ✔ · **AC-R9** = T-R13 ✔ ·
  **AC-R10** = 文档面在位（WEBVIEW §2/§3/§5/§5.1/§12/§13 + AGENT-LOOP §1/§7/§10 + 两沿革档指针）＋ check-doc-width 新增 0 ✔。

### 四、实测（先落盘再查——证据日志名给出）

- VSC 快层 `node test/run-fast.mjs` → **569 tests / 555 pass / 0 fail / 14 skipped**（slow 归册）· exit 0 —— `_r-restore-fast5.log`（前序 `-fast2/-fast3` 同为 0 fail；用例数 570→569 = T-R3b 并入 T-R3）。
- 集成层 `node test/run-integration.mjs` → **28/28 pass / 0 fail** —— `_r-restore-int3.log`（覆盖用 `installFullIndexFixture` 的 scenario-05——缺区 id 夹具零抛错）。
- `npm run lint`（check-syntax）→ **273 JS files OK** —— `_r-restore-lint3.log`。
- `node scripts/check-doc-width.mjs`（VSC 仓）→ **69 档零超宽 · 新增违规 0**（基线 26）—— `_r-restore-docwidth2.log`。
- 单档：activity-flow **19/19**（`_r-restore-af2.log`）· async-visibility **10/10**（`_r-restore-av.log`）· 邻接 8 档 **62/62**
  （`_r-restore-neighbors.log`——含 eng-designer-role / turn-across-segments / digest-visibility / history-restore /
  webview-input-enter / webview-input-history / webview-turnstate / model-picker-fallback）。
  〔注记：本行原为单行长 317 字符（超 300 文档规）——同段自查后折行，零增删；写入手段 = 本人 §5 域内折行修补。〕

### 五、透明表（超声明产物 / 偏差披露 / 已知非本批项）

| # | 项 | 说明 | 处置 |
|---|---|---|---|
| 1 | 行数超估计（非越限） | `activity-flow` 292→486（设计估 ~332；其中 A13 先落 +51 为基线、本批 5 个新用例体量大于估计）；`activity.js` +30（估 +~15——头注机制段重写）；其余档在估计带内 | 全部 ≤500 硬限；设计「不拆分」声明保持；实测值供父侧回填设计档（设计者写域——coder 零碰） |
| 2 | 超声明产物（非源码） | 仓库根 8 个 scratch 日志 `_r-restore-*.log`（长测试先落盘纪律——证据链） | 如实披露（超声明 ≠ 越权）；父侧可清理 |
| 3 | A13（群 A）先落地 | 工作区 `activity.js`/`state.js`/`chat.css`/`activity-flow` 已含 A13 `.sub-desc` 先落内容（+3 例 T-MA13-1..3）——本批在其**现态**上叠加（落笔前读现态——任务书要求） | A13 语义零破坏（T-MA13 三例全绿）；§11.2.1 交接 / §11.2.3 基线漂移登记不变（父侧台面） |
| 4 | 已知 flake（非本批） | `provider-timeout-semantics.test.mjs::T-MA1-4`（40ms idle 阈值 × 20ms chunk 节拍——并发 6 下偶发）：本轮 5 次快层跑中 1 次红，复跑与单档跑绿（`_r-restore-fast4.log` 红 / `-fast5.log` 与 `_r-restore-mta.log` 绿） | 与本批写域（webview/测试档）无交集；登记供父侧知悉 |
| 5 | 空安全边界（评审 #3 收口①） | `chat.js`/`ui.js` 绑定用 `?.`——缺区 id 夹具（digest-visibility / scenario-05）零抛错且零改；`buildBlock` **无** messagesEl 回退（缺区即显式抛错——不静默降级回「落流」） | 集成层 28/28 绿佐证 |

### 六、fix round（审计驱动——轮次记录）

- **fix round 1**（审计轮次 1 发现 #1 = 一般级）：`webview/ui.js` 实测 502 行 > AGENTS.md「≤500 hard limit」→ 注释压缩 + `initScrollFollow` 合并为**单 `watch(el,key)` 闭包双目标**（messagesEl=`_pinBottom` / activityEl=`_pinActivity`，同为 wheel+touchmove passive、阈值 <24px、`?.` 空安全）→ **492 行**（余量 8）。
- **顺手收敛**：`activity-flow` 494 → **486**（T-R3b 并入 T-R3——断言零丢失、用例数 20→19），余量 14。
- **审计轮次 2**（只读复核——仅核 fix）：行数 ≤500 ✅ · `initScrollFollow` 语义等价 ✅ · `maybeScrollActivity` 行为未变 ✅ · 12 档无其它越限 ✅ → **VERDICT: clean**。
- 审计轮次 1 发现 #2（8 个 scratch 日志）= 产物登记，见透明表 #2（非代码缺陷）。

### 七、交接 / 登记（父侧核销台面）

- 设计档 §12.6 行数估计与拆分注的 `activity-flow ~332` / `ui.js +~12` 现值 = 486 / +9（回填与否由设计者/父侧定——coder 零碰文档）。
- VSC `docs/design/README.md` 补登行 + `docs/TODO.md` 状态推进 + 需求池（如适用）——父侧。
- commit 待父侧随批提交（本批零 commit）。
- 群 A A13：本批已在其先落内容上叠加完成；`§11.2.1`／`§11.2.3` 两处交接登记保持（A13 批落笔时更新）。

## §6 验证与收口（父代理自写）

**2026-09-11 20:25 · 父侧收口**

- **交付核验**（父侧抽核）：快层 **569/555/0/14 skip** · 集成 **28/28** · activity-flow **19/19** · async-visibility **10/10** · 邻接 8 档 62/62；`check-doc-width` 两仓新增超宽 0；`lint` 273 OK；
  面：12 档全落（9 源 + 3 测试）· 契约 §12.3#1–#10 逐条 · §12.4 旧加戏链 grep 零复活 · 批 10 机制零改 · extension 端零触碰（mtime 佐证）。**核心：live 固定可见 + 一个面板回归**（区内出生 · 原地折叠 · 20 上限 · 32vh 自滚 · `:empty` 显隐）。
- **AC 核销**：T-R1..T-R16 / AC-R1..AC-R10 按 §5 逐条过（含 AC-A1/A3 改区采样）。
- **内部审计**：2 轮（轮 1 divergence-found：`ui.js` 502>500 硬限 → fix（单闭包合并 492）+ 余量；轮 2 clean）——**硬限合规恢复**（审计抓住唯一结构性违规）。
- **父侧裁定**：① 行数超估计（activity-flow 486 / activity.js 328——非越限）——接受；设计档 `§12.6` 回填**可选**（§5 对表为实测权威）；② A13 先落 + 本批现态叠加——语义零破坏（A13 三例全绿）✓；③ `provider-timeout-semantics::T-MA1-4` flake（他批域）——登记他链，不属本批。
- **核销同步清单**（D7）：状态行——VSC TODO / `docs/design/README.md` 补登（父侧随「扫」）；计数——T-R/AC-R 与 §2 一致；指针——WEBVIEW §12 / AGENT-LOOP §7/§10 可达；变更记录——在档。
- **令牌**：链终——consume-design 已消费（本批**全链路闭环 ✓**）。
- **遗留**：① scratch 日志 8 个（`_r-restore-*.log`）+ `tmp-*` 系列——随「扫」清理；② 设计档 `§12.6` 回填（可选）；③ commit 随「扫」批。
