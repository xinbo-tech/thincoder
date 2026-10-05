# 2026-10-05 · 评审 history 串台面（会话级单值镜像 ∥ 上轮表扫父全文）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 20:15「其余两件也要做」（承 #940 ② 缓裁面——对侧 N-9 后半；台账 #949）。
> 台账 = #949（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 来源 = `#940` 证据②（对侧报告 N-9 后半）：`thincoder-core/agent-tools/advisor-async.mjs:165-166` 会话级**单值镜像** ∥ `thincoder-core/advisor/history.mjs:29-45` 上轮表扫**父 history 全文**——并发 / 延迟下可能读到另一场评审的 history（对侧未活体复现 = unverified）。同日裁定 = 「缓」（无红腿、待复现）；用户 20:15「其余两件也要做」= 本批点火。
- 设计轮职责之一 = **复现或证伪**（按机制构造可稳定驱动的红绿对；证伪 ⇒ 报「前提不成立」并收口）。
- 边界：只动这两处机制（镜像键控 / 上轮表取件按本评审 id 收敛）；结算 / 签发 / 闸位（`#940` ①）零触；槽位积压（`#927`）另案。
- 授权 = 全链跑（设计 → 代点火评审 → 代签 → 实施 → 收口；「自动跑」在效）。台账 = **#949**（待设计 → 任务书 = 本档 §2）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（复现成立（①② 双红实读——探针 2 fail / 2 pass 可行向绿）∥ 两设计档落笔（AGENT-LOOP-ASYNC-POOL §6.10 ∥ ADVISOR-CONVERGENCE §4.3 / §12）∥ 评审轮次 1 修正已落（#1 ∥ #2 ∥ #4 落修 ∥ #5 判由；#6 无动作——§2 fix 块））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-05 · initial 轮 · #949）**

**口径**：本批 = 评审 history 串台面（#940 ② 独立挂账转出——其 §6 ④「独立挂账 #949（缓裁在册）」）。**设计轮第一职责 = 复现或证伪**——已完成：两点**均活体复现**（对侧 unverified ⇒ verified）。设计落点 / 机制设计 / 受影响文件（L7）/ 红绿对 / 关键决策 / 上抛见 §2.2–§2.9。产品码零触（设计轮——只读勘察 + temp 探针）；结算 / 签发 / 闸位（#940 ① 已收口）零触；端面（CLI / 桌面 / VSC）零触；#927 零文件交叉。

### 2.1 复现结论（设计轮第一职责 · 证据链逐条）

**结论：前提成立——疑似点 ①② 均活体复现（稳定可驱动，三次实跑读数全同）。**

- 探针 = `.thincoder/tmp/2026-10-05-review-cross-talk-probe.test.mjs`（temp 件；只读勘察 + 运行期替身——LLM 调用经 `registerHooks` 重定向为捕获替身，零网络；驱动面全真实函数：`resolveAdvisorLaunch` / `launchAsyncAdvisor` / `settleAdvisorRun` / `injectAsyncResult` / `prepareAdvisorMessages`）。
- 跑法 = 仓根 `node --test .thincoder/tmp/2026-10-05-review-cross-talk-probe.test.mjs`。
- 读数 = **fail 2（P1 / P2 红）∥ pass 2（P1b / P2b 可行向绿）**——全腿版实跑 2 次读数全同（初版实跑 1 次同读）。
- **P1（① 镜像串台）红**：池上限 1；A（code）running；Q（design·docB）发起 ⇒ 池满**排队**；放行 A 结算（镜像被写成 A 场值）⇒ refill 补位启动 Q ⇒ Q 的消息构建读会话镜像。实读：Q 的 system = `slot:special-advisor-round2`（轮 2 收敛提示词——非设计轨）；Q 的 user 首行 `## Round 2 — Verify Prior Table + Flag New Issues` 且**载他场正文**（`A-REVIEW-MARKER` = true）。
  - 链条：定域在 launch（`thincoder-core/agent-tools/advisor-async.mjs:167-168`）∥ 消费在**启动时**（`entry.start` → `thincoder-core/advisor/run.mjs:117` → `thincoder-core/advisor.mjs:197` / `thincoder-core/advisor/messages.mjs:94` 读 `agent._advisorRound` / `_lastAdvisorOutput`）；窗口 = 排队（`advisor-async.mjs:457-464` 入队 → `:330-356` refill 启动）∥ 他场结算重写镜像（`thincoder-core/agent-tools/advisor-settle.mjs:137` / `run.mjs:168`）。
- **P2（② 全文倒扫）红**：本线程投递（真实 `injectAsyncResult`）→ 表 A → 他场投递 → 表 B → 轮 2 构建。实读：`## Agent Response` 段 = `TABLE-B-MARKER`（他场响应表）；本线程表 `TABLE-A-MARKER` 零命中（hasA=false ∥ hasB=true）。
  - 链条：`thincoder-core/advisor/history.mjs:39-44` 无 sinceIdx ⇒ 全文**倒扫取最新**表；消费点 = `thincoder-core/advisor.mjs:159` ∥ `thincoder-core/advisor/messages.mjs:199`。
- **P1b / P2b（可行向——修复方向机检）绿**：P1b = 按本评审实例定域后启动 ⇒ 构建回设计轨（system=设计轨 ∥ user 含 docB ∥ 零 A 正文）——证明「唯一错因 = 镜像值」；P2b = `extractAgentResponseTable(h, 0)` 前向取首表 = 本线程表（落点机制现态已具备——缺的只是水印投递）。

**实施后期望**：P1 / P2 转绿（红→绿对）；P1b / P2b 保持绿。基线（旧批件只读复跑——设计轮实测）：`docs/batches/2026-10-03-advisor-convergence.test.mjs` 13/13 ∥ `2026-10-05-review-gate-gaps.test.mjs` 8/8 ∥ `2026-10-04-issue-fix-round5.test.mjs` 11/11 ∥ `2026-10-04-tool-path-baseline.test.mjs` 8/8（四档 exit 0）。

### 2.2 本批条目（覆盖）

- **#949 ①（会话级单值镜像）⇒ 修**：镜像三值（`_advisorRound` ∥ `_lastAdvisorOutput` ∥ `_advisorResponseAnchor`）在**消费点**（消息构建前）按本评审实例定域——排队 / 延迟窗口封死（§2.4）。
- **#949 ②（上轮表取件扫父 history 全文）⇒ 修**：响应表取件按**本评审 id** 收敛——投递水印 + 前向取首表（§2.4）。
- **不在本批**：结算 / 签发 / 闸位（#940 ① 已收口——零触）· 端面（CLI / 桌面 / VSC——零触）· #927（槽位积压——另案，零文件交叉）。

**需求面核对（读侧——需求档 = 父侧笔域）**

- `docs/core/requirements/ADVISOR-CONVERGENCE.md` F-A4（`:188` 会话隔离——「每轮 fresh session」）：本批 = 同一隔离意图的**跨评审实例**面（构建取值 ∥ 取件窗）——**相符（注记：F-A4 现文只覆盖轮间隔离，跨评审面逐条对位候选 ⇒ 上抛 §2.9）**。
- 同档 F-A12（`:196` 响应表纪律——「提示词纪律，不驱动控制流」）：取件窗收窄不改「聚焦参考」语义（零 Action 值解析、零控制流驱动）——**相符**。
- 同档 F9（`:36`——「不引入机械解析」）：同上——**相符**。

### 2.3 设计档落点（单源）

| 条目 | 落点 | 内容 |
|---|---|---|
| ① | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.10（`:107-110`）· 变更记录（`:1027` / `:1029`） | 收敛状态行载 `historyAnchorIdx` ∥ 构建期定域条（消费点定域 + 排队窗 + 双点 + 投递水印双点） |
| ② | `docs/core/design/ADVISOR-CONVERGENCE.md` §4.3（`:274-276`）· §12 A-AC14（`:411`）· 变更记录（`:430`） | 取件下界条（水印 + 前向取首表 + 无水印回落 + 残余声明）∥ 验收行 |
| 两档 | 各变更记录一行（已在盘） | 流水 |

### 2.4 机制设计（改前 → 改后 · 逐处）

**① 镜像键控（消费点定域）**

- **改前**：`resolveAdvisorLaunch` 末两行定域（`thincoder-core/agent-tools/advisor-async.mjs:167-168`：`agent._advisorRound = run.priorOutput ? run.round : 0` ∥ `agent._lastAdvisorOutput = run.priorOutput`）；排队条目的构建发生在**启动时**（`entry.start` → `runAdvisorReview` → `prepareAdvisorMessages`），与定域之间窗口 = 排队 ∥ 他场结算 ∥ run 起点复位。
- **改后**：提取定域单点 **`scopeAdvisorMirror(agent, run)`**（新落 `thincoder-core/agent-tools/review-facts.mjs`——事实面叶档，零环；三值同点落：round ∥ prior ∥ `run.historyAnchorIdx ?? null` → `agent._advisorResponseAnchor`）；`resolveAdvisorLaunch` 两行改一行调用（同栈路径值零变）；`entry.start`（`advisor-async.mjs:419` 起）在 `runAdvisorReview` 前加调一处（排队路径的消费点复核）。非排队 / 同步路径语义零变（定域幂等）。

**② 上轮表取件按本评审 id 收敛（投递水印 + 前向扫描）**

- **改前**：`extractAgentResponseTable(agent.history)`（无 sinceIdx）⇒ 全文倒扫取**最新**表——他场可被取（P2 实证）。
- **改后**：
  - **投递水印单点** = `noteReviewDelivered(agent, run)`（同叶档；`run.historyAnchorIdx = agent.history.length`）——**双投递点调用**：async = 投递单点 `thincoder-core/agent-tools/subagent-async.mjs` `injectAsyncResult`（`pushReal` 之后，`:393-396` 邻位——全自动注入路径共享形态）；sync = `thincoder-core/agent/record-results.mjs` advisor 记账块（`:119-138`——工具结果已入史）。
  - **取件面** = `extractAgentResponseTable(agent.history, agent._advisorResponseAnchor ?? undefined)`（前向扫描取首表——`history.mjs:31-37` 既有 sinceIdx 腿，纯函数语义零改；无水印 = legacy 直调 ⇒ 回落全文倒扫）：`thincoder-core/advisor.mjs:159`（`buildAdvisorFollowUp`）∥ `thincoder-core/advisor/messages.mjs:199`（legacy 收敛路径）同行改参。
  - `history.mjs:20-23` JSDoc 现态化（「no prior-table index is carried anymore」旧句 ⇒ 现行语义：有实例 ⇒ 水印下界前向；无 ⇒ 回落倒扫）。
- **残余声明**：水印只保证「≥ 本评审投递点」——他场响应表若在本评审投递后、本次构建前交错写入，取件仍可先命中他场；「聚焦参考」语义不变（不驱动控制流）。更强绑定 = 响应协议改（需求 / 提示词面——上抛 §2.9）。

### 2.5 受影响文件与测试面（L7 取数面 · 模块列）

| # | 文件 | 现行行数 | Δ（上界） | 模块 | 变更 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/review-facts.mjs` | 125 | ≤ +18 | M6 | `scopeAdvisorMirror` + `noteReviewDelivered` 两单点 + 头注 |
| 2 | `thincoder-core/agent-tools/advisor-async.mjs` | 497 | ≤ +3（**硬帽预算**——目标净 +1 ≤500） | M6 | 定域改调（−1）+ `entry.start` 复核（+2）；import 同线增名 |
| 3 | `thincoder-core/agent-tools/subagent-async.mjs` | 469 | ≤ +4 | M6（机制归属：评审族水印接入） | `injectAsyncResult` 调用 + import + 注释 |
| 4 | `thincoder-core/agent/record-results.mjs` | 182 | ≤ +4 | M6（机制归属：评审记账——同步面） | sync 记账块调用 + import + 注释 |
| 5 | `thincoder-core/advisor.mjs` | 281 | ≤ +3 | M6 | 取件参（同行改 + JSDoc） |
| 6 | `thincoder-core/advisor/messages.mjs` | 300 | **±0**（贴 300 建议线上沿——只改同行） | M6 | 取件参（同行改） |
| 7 | `thincoder-core/advisor/history.mjs` | 77 | ≤ +3 | M6 | JSDoc 现态化（函数语义零改） |
| 8 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` | 1158（设计轮已落） | 实施零触 | M6 | §6.10 / 变更记录（在盘） |
| 9 | `docs/core/design/ADVISOR-CONVERGENCE.md` | 465（设计轮已落） | 实施零触 | M6 | §4.3 / §12 / 变更记录（在盘） |
| 10 | `docs/batches/2026-10-05-review-cross-talk.test.mjs` | 0 | 新增 ≤ 250 | — | 红绿对宿主（实施轮新建） |

**L7 复核（判定时点②）**：模块列去重 = **M6 = 1 ≤ 2 ✓**（承载文件 `subagent-async.mjs` / `record-results.mjs` 的变更 = 评审族水印 1 行接入——按**机制归属**记 M6；先例 = `engine-face-gaps` §1.3「机制归属」/ #940 `messages.mjs` 记 M6）。判由 = 本批 = **单机制**（评审实例键控——定域 ∥ 取件窗同锚），承载面仅接线。
**行数面**：#2 = 497 ⇒ **≤500 硬帽在位**（净 +1 目标、+3 上界——任何超限即触拆分义务）；#6 = 300 ⇒ **Δ 必须 ±0**（只改同行；若落地须增行 ⇒ 先拆分评估）；其余代码档 ≪ 300 建议线；批内件 ≤250（线内）。
**测试面**：批内件自持（第 10 行——实施轮新建）∥ 探针 = 红基线证据（§2.1；temp 件，收口可清理）∥ 旧批件只读复跑（§2.1 末四档基线——实施轮）∥ 仓套件零档新增/修改（收口跑 = 父侧）∥ 集成场景零涉（机制 = 内部构建取值 / 取件窗）。

### 2.6 验收对照（可机检——红绿对）

| 腿 | 面 | 输入 | 机检断言 | 初态 |
|---|---|---|---|---|
| P1（主红腿） | ① | 探针构造：池上限 1 ∥ A（code）running ∥ Q（design）排队 → A 结算 → refill 启动 Q | Q 的 system 含设计轨句（`You are an independent design reviewer …`）；不含轮 2 收敛句；user 不含 `A-REVIEW-MARKER` | **红**（实跑：system=`slot:special-advisor-round2` ∥ 载 A 正文） |
| P1b（可行向） | ① | 同构造 + 手动按实例定域后启动 | system=设计轨 ∥ 含 docB ∥ 零 A 正文 | 绿（现态） |
| P2（主红腿） | ② | 探针构造：本线程投递（真实 `injectAsyncResult`）→ 表 A → 他场投递 → 表 B → 轮 2 构建 | user 含 `TABLE-A-MARKER`；不含 `TABLE-B-MARKER` | **红**（实跑：hasB=true ∥ hasA=false） |
| P2b（可行向） | ② | `extractAgentResponseTable(h, 0)` vs 无参 | sinceIdx 前向 = 本线程表；无参 = 最新表（现缺陷机制本征） | 绿（现态） |
| S1（结构单源） | ①② | 源档结构机检 | `scopeAdvisorMirror` 两调用点（`resolveAdvisorLaunch` ∥ `entry.start`）；`noteReviewDelivered` 两调用点（`injectAsyncResult` ∥ record-results）；两消费点各携 `_advisorResponseAnchor` 参 | 红（现态零命中） |
| S2（回归） | 断言面 | 旧批件只读复跑 | 四档读数 = §2.1 基线（13/13 ∥ 8/8 ∥ 11/11 ∥ 8/8——零退化） | 绿（基线） |

**红绿纪律**：实施前直跑探针 = P1/P2 红、P1b/P2b 绿（已在盘——§2.1）；实施后 = P1/P2 转绿、P1b/P2b 保持绿、S1 转绿、S2 零退化；读数入 §5。

### 2.7 关键决策（含被否）

| # | 决策 | 依据 / 否决备选 |
|---|---|---|
| 1 | ① 修形 = **消费点定域**（单点双点同调：`resolveAdvisorLaunch` ∥ `entry.start`） | 排队窗即唯一错因（P1b 证明）；否决「实例全量穿透（`runAdvisorReview` 全签名改 + 构建面全改引）」——观察等效、面大，且 `advisor-async.mjs` 497/500 硬帽下不可行 |
| 2 | ② 水印落点 = **投递时点**（async = `injectAsyncResult` ∥ sync = record-results） | 投递点 = 响应表可见性的真实下界；否决「settle 时点水印」——settle→投递间他场表窗口仍在（父回合中段可写表）；否决「按投递消息文本匹配（entry.id 散文匹配）」——消息形变更即断 |
| 3 | 水印字段落 **run 实例**（`historyAnchorIdx`——per-review 键控） | 与 `round` / `priorOutput` 同族；镜像三值同点定域（同一窗口封死） |
| 4 | **残余接受**：交错响应窗（他场表 ∈ 本评审投递后 ∧ 构建前）仍可先命中 | 「聚焦参考」不驱动控制流（F9 / F-A12 不相触）；更强绑定 = 响应协议改（需求 / 提示词面——上抛） |
| 5 | 模块桶 = M6 单桶（机制归属） | 两承载文件仅 1 行接入；L7 取数面见 §2.5 |

### 2.8 自检读数（设计轮）

- 仓根 `node scripts/doc-check.mjs` ⇒ **exit 0 · 悬空 0 · 行宽 OK**（两设计档落笔后实跑；汇总候选 48951——as-of 读数，含并行在盘面）。
- 探针实跑 3 次读数全同（§2.1）；旧批件四档基线复跑全绿（§2.1 末）。
- 行宽注记：两设计档新增行全 ≤300（改动行逐行核）。

### 2.9 上抛项（父侧）

- **需求面候选（父侧笔域）**：`docs/core/requirements/ADVISOR-CONVERGENCE.md`——F-A4 现文只覆盖「轮间 fresh session」；本批机制 = 跨评审实例隔离（构建取值 ∥ 取件窗）。是否补一行逐条对位 ⇒ 父侧裁。
- **提示词面（主 agent 内容权）**：轮 2+ 「响应表仅回应本评审 prior」纪律句 = 可选加固；本批机制面无需求、零改。
- **`docs/core/design/API-CONTRACT.md`**：新导出 `scopeAdvisorMirror` / `noteReviewDelivered`（review-facts.mjs）登记与否 ⇒ 父侧裁（本席零触）。
- **#927 关系一句**：本批与 #927（槽位积压）零文件交叉（另案在册）。

**评审轮次 1 修正（fix 轮 · eng-designer · 2026-10-05 · #949）**

**口径**：承 §3 轮次 1 表（🔴 0 ∥ 🟡 4 ∥ 🔵 2）——父侧裁定 = 逐号落修（#1 ∥ #2 ∥ #4 本块落修；#5 = 判由落 §2.6；#3 = 需求档已在盘〔落点外 ①〕；#6 = 无动作——父侧 §6 随记）。**机制语义零改**（全部 = 注记 ∥ 判由 ∥ 行数面收正——零新语义）；落点 = 本块 + `docs/core/design/ADVISOR-CONVERGENCE.md` §4.3 单句 + 其变更记录一行。产品码零触 ∥ `docs/core/design/API-CONTRACT.md` 本体零触（登记归实施轮）∥ 他批面零触。

**①（评审 #1 · 行数面收正——§2.5 终值，以本块为准）**

- 收正（原句「其余代码档 ≪ 300 建议线」失准——第 3 行 `subagent-async.mjs` = 469 = 越线存量、非 ≪300）：收正后「其余」= `review-facts.mjs` 125 ∥ `record-results.mjs` 182 ∥ `advisor.mjs` 281 ∥ `history.mjs` 77（均 < 300）。
- **>300 审视句（合并终值——#2 ∥ #3 ∥ #6 一条）**：
  - #2 `advisor-async.mjs` = 497（越线存量 · 距 500 硬帽 3 行 ⇒ **≤500 硬帽在位**——净 +1 目标 / +3 上界，任何超限即触拆分义务）；在册引用 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 子表行 8（`:1133`——实例注册表 + 启动解析面外提 `advisor-runs.mjs` 式；消解条件 = 下次实质改动时）。
  - #2 触评 = 本批行级改调（`resolveAdvisorLaunch` 两行改一行调用）∥ `entry.start` 复核调用 + import / 注释——零新函数 ∥ 零导出面变 ⇒ **不构成「下次实质改动」触发、计划续挂**（先例 = 同档行 8 批·五触评同款）。
  - #3 `subagent-async.mjs` = 469（越线存量）；在册引用 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.9 >300 块该行（`:952`——「越线为存量……**本批不拆**；拆分计划随该档下次结构性触碰登记」）。
  - #3 触评 = 本批投递单点接入（`injectAsyncResult` 调用 + import + 注释）——零新函数 ∥ 零导出面变 ⇒ 非结构性触碰、计划续挂。
  - #6 `advisor/messages.mjs` = 300 ⇒ **Δ 必须 ±0**（只改同行；若落地须增行 ⇒ 先拆分评估）——原句保留。
- 批内件 ≤250（线内）——原句保留。

**②（评审 #2 · 残余面补「索引稳定性前提」）**

- 单源落点 = `docs/core/design/ADVISOR-CONVERGENCE.md` §4.3 残余声明（`:276` 邻位；已同拍落）；本档随动 = 本块同句（§2.4 残余声明 ∥ §2.7 #4 残余接受同域——以本块为准）：
  「**索引稳定性前提**：水印 = 投递刻 history 下标；跨存档重装（整换径 `thincoder-core/session-lifecycle.mjs:115` `agent.history = [...machineMerged]`）∥ 头裁切后可失配；失配表现 = 前向窗越过本表 ⇒ 回落「no response table」兜底文本 = 聚焦参考降级、不驱动控制流。」
- 零机制改（按现状登记）。

**③（评审 #4 · §2.4 落点约束——`API-CONTRACT.md` 零漂）**

- 新函数两枚（`scopeAdvisorMirror` ∥ `noteReviewDelivered`）**追加 `thincoder-core/agent-tools/review-facts.mjs` 档尾**（现 125 行——追加内容自 `:126` 起）⇒ `docs/core/design/API-CONTRACT.md` 生成区既有五行的坐标（`:632-636`）**零漂**（排序键 = 档内行序 ⇒ 新行恒落 `:636` 之后）。
  既有五行 = `normAbs:17` ∥ `docSetKey:23` ∥ `REVIEW_ROOT_KEYS:32` ∥ `resolveReviewRootsFor:38` ∥ `resolveReviewDocPaths:72`（行内实读）。
- 两行新登记**随落点顺排**（生成区 `:637` ∥ `:638` 位——紧随现 `:636`；其后各行随生成 +2 位移、再生自洽）：`scopeAdvisorMirror` ∥ `noteReviewDelivered`（`fn` 型 ×2）——行号列 = 追加块内函数定义行（终值以实施后实读为据；生成器自读，无需手填）。
- 登记本体归**实施轮**（`API-CONTRACT.md` 属生成面——生成器 = `scripts/api-contract.mjs`）；本席零触。

**④（评审 #5 · §2.6 判由——不加腿）**

- §2.6 补判由句（终值）：sync 水印 / 无水印回落两面的验证腿 = **结构单源（S1）+ 纯函数腿（P2b）已足**；端到端腿留待该面下次触碰——本批不加腿。

**落点外（如实登记）**：① 评审 #3（需求面 F-A4 逐条对位）= 需求档（父侧笔域）——**已在盘**（`docs/core/requirements/ADVISOR-CONVERGENCE.md:188` F-A4 已携「跨评审实例隔离」句；残余面 = 交错写窗 + 索引稳定性前提）；本席零触。
② `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.17 实读链（`:775`）内 `session-lifecycle.mjs` 坐标记 `:113`——实读现盘 = `:115`（漂移 2 行）；该档未触（随本块登记；如需重锚请父侧裁）。
**随动注记**：设计档 `docs/core/design/ADVISOR-CONVERGENCE.md` 本 fix 轮 +3 行（§4.3 拆行 +1 ∥ 变更记录 +2）——§2.5 第 9 行行数读数随动（465 ⇒ 468，内容口径）；「设计轮已落 / 实施零触」口径不变。

**代码评审 🟡② 处置追记（fix 轮 · eng-designer · 2026-10-05 · #949）**

**口径**：承本档 §5 ④ 代码评审轮次 1 🟡②（残余声明「索引左移支」未登记 ⇒ 上抛父侧）——父侧裁定 = **补登记**（设计档 = 本席笔域）。**机制语义零改**（纯声明补登——注记级）；产品码零触 ∥ 他批面零触。

- **落点①（设计档）**：`docs/core/design/ADVISOR-CONVERGENCE.md` §4.3 残余声明①（`:276`）——失配面由单向（前向窗越过本表 ⇒ 回落兜底）扩为**两向（同因）**：前向窗**越过**本表 ⇒ 回落「no response table」兜底文本 ∥ 前向窗起点**左移** ⇒ 覆盖更早区段（可含投递前）⇒ 可取他场**更早**表（本笔补）；两向均 = 聚焦参考降级、不驱动控制流。同档变更记录一条（同拍落）。
- **落点②（本档）**：本追记行。
- **验收读数**：① **左移支句在盘**（read-back）；② `node scripts/doc-check.mjs` ⇒ **exit 0 · 悬空 0 · 行宽 OK**（候选 48978——as-of）。
- **行数随动**：同档 468 ⇒ 470 行（§4.3 同行扩〔±0〕∥ 变更记录 +2 行）——§2.5 第 9 行读数随动（内容口径）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**核查口径**：三档读全 + 抽验 §2.5 十行标注（十行全与盘面吻合——含「读取工具 ∥ 内容行数 ±1」在册口径约定，§6.20.4）∥ 载重坐标抽验（`advisor-async.mjs:167-168` ∥ `:419` ∥ `:457-464` ∥ `:330-356`；`advisor/run.mjs:117`；`advisor.mjs:159` / `:197`；`advisor/messages.mjs:94` / `:199`；`advisor/history.mjs:29-45`；`record-results.mjs:119-148`；`subagent-async.mjs:365-404`）全中 ∥ 投递单点 `injectAsyncResult` 为三端残余注入器共用（CLI / 桌面 / VSC 均转口）⇒ ② 单点声明成立。探针实读未独立复跑（本席无执行通道）——如实标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected-file size annotations | 🟡 | §2.5 行数面自述失准：`:91`「其余代码档 ≪ 300 建议线」对第 3 行 `subagent-async.mjs` **469** 不成立（>300 且本批触碰 ≤+4）；#3（469）与 #2 `advisor-async.mjs`（497）均未给「在册引用 + 触评句」——先例 = 本档 §6.31.9（`:952`「越线为存量…**本批不拆**；拆分计划随该档下次结构性触碰登记」）∥ `CORE-UNIFICATION.md:1133`（`advisor-async.mjs`「**>300——须带**：**实例注册表 + 启动解析面**…`消解条件 = 下次实质改动时`」）∥ 前批同款发现 `2026-10-05-subagent-zero-write-watchdog.md:67`「未引在册拆分计划、亦无触评结论句」 | 行数面补两句：① 收正「其余代码档 ≪300」表述（`subagent-async.mjs` 469 = 越线存量、非 ≪300）；② #2 / #3 各补在册引用 + 触评句（`advisor-async.mjs` 在册 = `CORE-UNIFICATION.md` §2.8.1 行 8 `advisor-runs.mjs` 外提；本批 = 行级改调 ∥ 复核调用 + import / 注释（零新函数 ∥ 零导出面变）⇒ 不构成「下次实质改动」、计划续挂），与「≤500 硬帽」句合并成一条 >300 审视句 |
| 2 | Acceptance / completeness（② 残余面） | 🟡 | 水印 = 裸 history 下标，残余声明只覆盖交错写窗（批档 `:73`「水印只保证「≥ 本评审投递点」」∥ 设计档 `:276` 同句），未声明**索引稳定性前提**——整换径在盘（本档 §6.30.17 实读链第 4 条 `:775`「`agent.history = [...machineMerged]`」）：投递 → 轮 2 构建之间整换 / 头裁切 ⇒ 下标失配（越过本表 ⇒ 回落兜底文本；或落到更早 ⇒ 取到更早场表） | 残余声明补「索引稳定性前提」句（水印 = 投递刻下标；跨存档重装 / 裁切可失配；失配表现 = 前向窗越过本表 ⇒ 回落「no response table」兜底文本 = 聚焦参考降级、不驱动控制流）——按现状登记即可，无需改机制 |
| 3 | Requirements coverage（协调项） | 🟡 | 需求面对位未落：F-A4 现文只覆盖轮间隔离（`requirements/ADVISOR-CONVERGENCE.md:188`），本批 = 跨评审实例面；设计已自报上抛（批档 `:125`「是否补一行逐条对位 ⇒ 父侧裁」）= 协调项（非缺陷） | 需求档补一行跨评审实例隔离对位（F-A4 邻位），或裁定维持现状并登记「不做」判由 |
| 4 | Doc-state / coordination | 🟡 | `review-facts.mjs` 导出已在 `API-CONTRACT.md:632-636` **带行号**登记五行（`normAbs:17` ∥ `docSetKey:23` ∥ `REVIEW_ROOT_KEYS:32` ∥ `resolveReviewRootsFor:38` ∥ `resolveReviewDocPaths:72`）；设计只提「登记与否 ⇒ 父侧裁」（`:127`），未点出**既有五行坐标随新函数插入位置漂移**的风险 | 设计补落点约束：新函数**追加档尾**（既有五行坐标零漂）或同拍收正五行坐标；新两行登记随落点连行号一并给出 |
| 5 | Acceptance criteria | 🔵 | sync 水印（第 4 行档 `record-results.mjs`）仅 S1 结构腿；「无水印回落全文倒扫」仅纯函数层 P2b（`:101`），无端到端（消费点实传 `?? undefined`）腿 | 可选补 sync 径行为腿 ∥ 无水印回落端到端腿；不补则写明「结构单源 + 纯函数腿已足」判由 |
| 6 | Review-scope limitations | 🔵 | 核查边界（如实）：无 standards 档、无 document map ⇒ ownership 按在集权威行判（`ADVISOR-CONVERGENCE.md:7`「**权威边界：同步评审路径 = 本档**；**异步评审路径 = `design/AGENT-LOOP-ASYNC-POOL.md` §6.10**」——落点 / 单源指针相符，未见新档、重复描述或互斥表述）；L7 ∕ M6 取数面与 R24a 自订判据档不在集内（unverified）；探针四腿读数未独立复跑 | 无需改动（如实登记核查边界） |

**正向核**：① 定域机制可行——`entry.start`（`:419`）闭包持有 `run`，`refillAdvisorQueue:350` 经 `start()` 启动排队条目 ⇒ 双点均可调 `scopeAdvisorMirror`；② 取件链可信——`run.mjs:117` 以 `priorParam=null` 调 `prepareAdvisorMessages`，设计评审轮 2+ 走 `buildAdvisorFollowUp` → `advisor.mjs:159`，镜像 / 表取件两处均实测；③ 投递单点成立——`injectAsyncResult` 为 `run-start.mjs:51/:83` ∥ `run-stages.mjs:285` ∥ 三端 `injectResidual` 共用。机制设计未见 🔴。

**计数**：🔴 0 ∥ 🟡 4 ∥ 🔵 2。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-05 20:4x 父侧代签**——依据用户 20:15「其余两件也要做」= 全链授权（代点火评审 → 代签 → 实施派发 → 收口；「自动跑」在效）。

**三条件核验**：

① **设计评审两轮走完** ✓——轮 1（评审 id=44 · pass · 0🔴 / 4🟡 / 2🔵）→ 修正轮（`#45` 四项落修：行数面收正 ∥ 索引稳定性前提 ∥ API-CONTRACT 落点约束 ∥ 判由句；#3 = 需求档已在盘 ∥ #6 = 无动作）→ 父侧抽读核过（§2 fix 块 `:130-164` ∥ `ADVISOR-CONVERGENCE.md` §4.3 `:274-277` ∥ 变更记录 `:431`）。
② **修正落地并逐条核验** ✓——上列两窗实读对位；坐标收正（`session-lifecycle.mjs:113` → 实读 `:115`）在册（落点外②）。
③ **token 已签发** ✓（轮 1 pass——运行态不入档）。

**批准范围** = 消费点定域（`scopeAdvisorMirror` 双点）+ 投递水印（`noteReviewDelivered` 双点）+ 前向取首表（取件面两处同行改参）∥ 受影响 7 档 + 批内件新档 ∥ `API-CONTRACT.md` 生成器回填（登记本体）。**边界** = 结算 / 签发 / 闸位（#940 面）零触 ∥ 端面（CLI / 桌面 / VSC）零触 ∥ `#927` 零交叉。

## §5 实施记录（eng-coder）

**§5 实施记录（eng-coder · 2026-10-05 · initial 轮 · #949）**

**状态行**：实施完成（initial 轮 · 批内件 6/6 绿 ∥ 审计 CLEAN ∥ 评审 pass（0🔴/3🟡/3🔵））

**① 写入面（file:line → Δ · 内容行口径）**

| # | 文件 | 变更 | Δ |
|---|---|---|---|
| 1 | `thincoder-core/agent-tools/review-facts.mjs` | 档尾追加 `scopeAdvisorMirror`（:130-134）∥ `noteReviewDelivered`（:139-142） | 125 → 142（+17 ≤ +18；既有五行 :17/:23/:32/:38/:72 零漂） |
| 2 | `thincoder-core/agent-tools/advisor-async.mjs` | :56 import 增名 ∥ :166-168 两行定域 → 一行调用 ∥ :428-429 `entry.start` 构建前复核 | 497 → 499（+2 ≤ +3；≤500 硬帽在位） |
| 3 | `thincoder-core/agent-tools/subagent-async.mjs` | :37-38 import ∥ :399-400 `injectAsyncResult`（pushReal 后）水印 | 469 → 473（+4 = 上界） |
| 4 | `thincoder-core/agent/record-results.mjs` | :33-34 import ∥ :123-124 sync 记账块水印 | 182 → 186（+4 = 上界） |
| 5 | `thincoder-core/advisor.mjs` | :127-129 JSDoc ∥ :161 取件参 | 281 → 283（+2 ≤ +3） |
| 6 | `thincoder-core/advisor/messages.mjs` | :199 取件参（同行改） | 300 → 300（Δ0 ✓） |
| 7 | `thincoder-core/advisor/history.mjs` | :17-30 JSDoc 现态化（函数体零改） | 77 → 79（+2 ≤ +3） |
| 8 | `docs/batches/2026-10-05-review-cross-talk.test.mjs` | 新建（探针转正 + S1/S2 两腿） | 0 → 233（≤250） |
| 9 | `docs/core/design/API-CONTRACT.md` | 生成器回填（`--write`）：新两行 :637/:638；既有五行 :632-636 零漂 | 生成区 +2 行（其后行 +2 位移） |

**② 红绿两读（先红后绿）**

- **红（实施前 · 探针）**：`node --test .thincoder/tmp/2026-10-05-review-cross-talk-probe.test.mjs` ⇒ **fail 2（P1 ✖ / P2 ✖）∥ pass 2（P1b ✔ / P2b ✔）**（P1 实读 system=`slot:special-advisor-round2`、user 载 A-REVIEW-MARKER；P2 实读 hasA=false ∥ hasB=true）——与 §2.1 读数全同。
- **红（转正后初态复跑 · 隔离面）**：`git worktree`（HEAD=7dc8ce7b——本批未提交面外）内跑正式批内件 ⇒ **P1 ✖ ∥ P2 ✖ ∥ S1 ✖ ∥ P1b ✔ ∥ P2b ✔**（3 fail / 2 pass）。S2 在隔离面因缺 `node_modules` 工作区链（`@thincoder/render-core/package.json` 解析失败）不可用——环境因、非回归证；实仓内 S2 全绿。worktree 已移除、零残留（审计复核磁盘无痕）。
- **绿（实施后 · 批内件）**：`node --test docs/batches/2026-10-05-review-cross-talk.test.mjs` ⇒ **6/6 pass**（P1 ∥ P2 ∥ P1b ∥ P2b ∥ S1 ∥ S2）。
- **绿（实施后 · 探针复跑）**：⇒ 4/4 pass（P1 system=`slot:special-advisor-design` ∥ A 正文零命中；P2 = TABLE-A 在场 ∥ TABLE-B 零命中）。

**③ 门读数**

- `node --check` 全触档（7 代码档 + 批内件 + 探针）⇒ exit 0（逐档 Syntax OK）。
- `node scripts/doc-check.mjs` ⇒ exit 0（悬空 0 ∥ 行宽 OK；候选 48977——as-of）。
- `node scripts/api-contract.mjs --check` ⇒ OK 零漂（2904 条 · 641 档）；两新行行号 = 源档真值（`review-facts.mjs:130` / `:139`）。
- 行位守限实读：`advisor-async.mjs` = 499 ≤ 500 ∥ `messages.mjs` = 300（Δ0）∥ 其余 ≤ 上界（见 ① 表）。
- 四档回归基线（各单跑）：`2026-10-03-advisor-convergence` 13/13 ∥ `2026-10-05-review-gate-gaps` 8/8 ∥ `2026-10-04-issue-fix-round5` 11/11 ∥ `2026-10-04-tool-path-baseline` 8/8——零退化。
- 仓套件 = 收口面（父侧）；core `test/` 现为空清单（零用例=绿）。

**④ 审计与代码评审轮次与终态**

- **内部发散审计（explore · 只读）轮次 1 = CLEAN**：四类偏差（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 表外变更）逐条核验未见偏差；行位守限全项达标；如实标 unverified = 运行读数（审计无执行通道）。
- **内部代码评审（advisor · type=code）轮次 1 = pass**（🔴 0 ∥ 🟡 3 ∥ 🔵 3——全部非 must-fix；修正轮 = 0）。应答（逐条）：
  - 🟡① 文件越 300 建议线（advisor-async 499 ∥ subagent-async 473）= 在册存量，本批按行 8 触评「零新函数 ∥ 零导出面变 ⇒ 非实质改动、计划续挂」⇒ **维持现状**（另注：499 距 500 硬帽仅 1 行——下批任何净增须先拆分）。
  - 🟡② 残余声明「索引左移支」（整换径/裁切后前向窗覆盖更早区段 ⇒ 可取他场较早表）未登记 ⇒ **上抛父侧**（设计档 = eng-designer 笔域，本席零触）。
  - 🟡③ 本档 §5/§6 空白（读数未入档）⇒ **本条即修**（本段落笔）。
  - 🔵① S2 腿墙钟/兄弟批件计数耦合 ⇒ 接受原样（归档件；子进程假绿已由清 `NODE_TEST_CONTEXT` 封死）。
  - 🔵② P1b 手工定域与生产复核重复、前后皆绿 ⇒ 接受原样（腿定义 = 可行向，设计明定「手动按实例定域」）。
  - 🔵③ `history.mjs` 传 `null` 会 TypeError（现盘两调用点均 `?? undefined` 收口 ⇒ 不可达）⇒ 不改（函数语义零改 = 本批设计约束）；登记为可选加固候选。
- **终态 = clean**。

**⑤ 决策透明表**

| # | 决定 | 依据 |
|---|---|---|
| 1 | `advisor-async.mjs` 净 +2（非最小 +1） | 上界 +3 内（499 ≤ 500）；注释如实承载机制归属 |
| 2 | S2 = 子进程复跑四旧档（而非独立读数腿） | 验收 ① 命令式口径（一条命令自含 6 腿）；先例 = `2026-10-04-tool-path-baseline.test.mjs:140-147` 嵌套复跑 |
| 3 | S2 子进程清 `NODE_TEST_CONTEXT` | 父运行器注入 `child-v8` ⇒ 嵌套 `--test` 会「递归跳过」假绿（实施中实撞后修） |
| 4 | 转正后初态红读数 = `git worktree`（HEAD）隔离复跑 | 不扰动工作树 / 不动未提交面；S2 环境因失败如实标注 |
| 5 | 探针件夹具名 `__crossTalkProbe` / `probe-token` → `__crossTalkStub` / `batch-token` | 转正件不带探针残留名；语义零变（红绿两读按终版件重取） |
| 6 | `API-CONTRACT.md` 走生成器 `--write`（机械整区替换） | 生成面 = 生成器单笔；§2-fix 块 ③「登记本体归实施轮」 |
| 7 | P1/P2/P1b/P2b 逐字承探针；S1 = 源档结构切片（fail-closed 锚） | §2.6 S1 机检断言口径 |

**⑥ 披露**

- 探针 temp 件 `.thincoder/tmp/2026-10-05-review-cross-talk-probe.test.mjs` 留存（设计轮证据件；收口可清理）。
- `git worktree`（`.thincoder/tmp/xfix-wt`）已创建并移除，零残留。
- 端面（CLI / 桌面 / VSC）零触 ∥ 结算 / 签发 / 闸位（#940 面）零触 ∥ #927 零交叉 ∥ 设计两档实施轮零触（其未提交面改动 = 设计轮在盘）。
- 未跑项：仓套件（收口面 = 父侧）；`CORE-UNIFICATION.md` §2.8.1 在册引用未独立复核（unverified）。

## §6 验证与收口（父代理）

**2026-10-05 21:0x · 收口**

**① 交付验证**：实施（`#48`）九档写入面 + 补登（`#50`：评审 🟡②「索引左移支」残余声明）。**父侧抽验**（五窗）：`review-facts.mjs:130/:139` 两新函数 ∥ `advisor-async.mjs:168`（两行改调）∥ `:428-429`（排队窗封死复核）∥ `messages.mjs:199`（同行改参 Δ0）∥ `API-CONTRACT.md:637-638`（两行新登记 + 既有五行零漂）∥ `ADVISOR-CONVERGENCE.md:276`（两向残余句）+ `:431`（变更记录）。

| 面 | 终值 | 核验读数 |
|---|---|---|
| 批内件 | `docs/batches/2026-10-05-review-cross-talk.test.mjs`（233 行 · 6 腿：P1 ∥ P2 ∥ P1b ∥ P2b ∥ S1 ∥ S2） | 先红后绿：探针红（`fail 2 ∥ pass 2`）→ 转正初态红 3 腿（`git worktree` 隔离留档——S2 环境因不可用如实标注）→ **终态 6/6** ∥ 探针复跑 4/4 |
| 行位守限 | `advisor-async.mjs` **499 ≤ 500** ∥ `messages.mjs` **300（Δ0）** ∥ `review-facts.mjs` 142（+17 ≤ +18） | 实读核 ✓ |
| 回归 | 四档基线 13/13 ∥ 8/8 ∥ 11/11 ∥ 8/8 | 零退化（#48 实跑） |
| 闸 | `node --check` ×9 exit 0 ∥ `doc-check` exit 0（悬空 0） | #48 ∥ #50 实跑 |
| 契约面 | `api-contract --check`：本批写后 = OK 零漂（#48 实跑）；父侧收口复跑见 DRIFT（生成侧 +8——**在飞 `#49` 面所致**，归 attach 收口 regen 归还） | 如实 |

**② 集成场景**：零涉（内部评审机制——无用户面集成路径变更）。

**③ 仓套件读数**：三端跑器（cli ∥ desktop ∥ vscode）**空清单绿灯 ×3**（父侧亲跑 exit 0——本波统一读数）。

**④ 收口清单核验**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（7 代码档 + 批内件 + `API-CONTRACT.md` + 设计档 470）∥ 指针（§2 ∥ §4.3 ∥ §6.10）✓ ∥ 变更记录（`:431` / `:432`）✓ ∥ 待办勾销 = `#949` ∥ 前批遗留跨核 = 无 ∥ 台账面 = 核销行。

**⑤ 暂缓批复核**：无（本批无缓存面；`#927` 零交叉在册）。

**⑥ 债务与备忘**：① `advisor-async.mjs` 距 500 硬帽仅 **1 行**——下批任何净增须先拆（在册）；② `history.mjs` 传 `null` 契约自防加固 = 不修（可选候选在册）；③ 探针 temp 件留存 `.thincoder/tmp/`（证据件）；④ `CORE-UNIFICATION.md` §2.8.1 读数注已由父侧随收（497/469）。

**⑦ 收口判定**：实施验证通过（抽验五窗 ∥ 6/6 ∥ 回归零退化 ∥ 门全绿）⇒ 本批**收口**（记录冻结）。
