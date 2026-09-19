# 2026-09-18 · 顾问面治理批（#84 治理面重设计 + #85 + #86）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

### 1.1 批件（用户 2026-09-18 15:46 裁定；15:57「全做」= 立批授权）

**用户原话（15:46 · 逐字）**：「不不不，过度工程，防无限重评审也不是这么防的，到处加机械限制是一种非常拙劣低级的做法，完全不体现程序员的能力和水平。」

**15:57「全做」** = 对父侧三件提案的授权：① #84 检查结论与更正 ② 受影响四条批链**重发正确设计评审**（在飞：id=69 / 70 / 71 / 72）③ **本批 = 机制修复 + 治理面重设计**（走全链：需求 → 设计 → 评审 → 实施）。

### 1.2 起因实核（父侧 · 2026-09-18 15:5x–16:1x · slot 37 会话档 + 本仓源码逐处）

| # | 事实 | 证据 |
|---|---|---|
| ① | 三条 cap 回执现象为真，但**归因错**——被拒对象是 **code 实例**（design 评审 cap 豁免） | `thincoder-core/agent-tools/advisor.mjs:180` · `thincoder-core/advisor/run.mjs:193`（两处检查点均以 `reviewType !== "design"` 排除 design） |
| ② | **真因** = 点火调用缺顶层 `type:"design"`（只写在 `object` 声明块内）⇒ **静默落 code 轨** | `thincoder-core/agent-tools/advisor.mjs:98`（`args.type \|\| "code"`）+ 会话档实取调用参数全文（14:59 / 15:14 / 15:35 三条均然） |
| ③ | 后果 = 下午 5 次「设计评审」（id=52 / 55 / 60 / 64 / 67）**全数落空**（无 design token 铸出）+ 第 6 次点火撞 code 实例 5 轮上限 | 五条 ack 共用同一实例 `a993fcd2-…`（三批文档集——design 轨按 doc-set 分槽，不可能同槽）；旁证 = 14:12:58 拒回逐字含「a **code review** is still running」 |
| ④ | cap 文案**不载范围**（哪种评审 / 哪条实例 / 第几轮）⇒ 被读成「设计评议会话级封禁」，据此误报并立 #84 | `thincoder-core/advisor/run.mjs:140` 区 `buildCapMessage` 逐字（三选项）+ 同日误读记录（会话档） |

### 1.3 本批做（三条 · 逐条可交付）

| # | 条目 | 台账 | 交付面（拟 · 设计轮核） |
|---|---|---|---|
| ① | **顶层 `type` 必填（fail-closed）**：缺 `type`（缺失 / 空串 / 非法值）⇒ **拒绝启动 + 指引**——**不再缺省 code**（用户 2026-09-18 16:16 裁定「不带 type 就要拒，不静默降级」；原「矛盾形」= 本条自然子集） | #85 | `thincoder-core/agent-tools/advisor.mjs`（参数门）+ **调用面全量收正**（代码内调用点 · 提示词 / 纪律档 · 用例 / 夹具）+ 用例 |
| ② | **文案载范围**：cap / 护栏停止 / 范围拒回三类文案**首行载对象标识四项**（评审类型 · 范围摘要 · 轮次 N/M · 触发判据名） | #86 | `thincoder-core/advisor/run.mjs` · `thincoder-core/agent-tools/advisor-async.mjs`（scope 拒回）+ 用例 |
| ③ | **治理面重设计（用户裁定）**：**撤除全部会话级轮次计数器**；改治——**失败有结论 / 反复失败停止上报 / 资源保护归调度域（池）** | #84 | `thincoder-core/advisor/run.mjs`（cap 分支撤除）· `thincoder-core/agent-tools/review-streak.mjs`（护栏面重定）· 设计档 §3 / §12 · 用例重写 |

**需求层已同轮收正（本席 · D1 写域 · 2026-09-18）**：`docs/core/requirements/ADVISOR-CONVERGENCE.md`——§2.1 **F2 / F3 撤项** · §6.2 **F28 / F29 重定**（失败有结论 / 结论文本载对象标识四项）· **新增 §9（F30 / F31 + N22）** · §1 / §3.1 N1 / §4 / §8.1 F-A3 撤项 / §8.2 N-A1 同步 · 变更记录一条。

### 1.4 边界（明确不做）

- **不删失败路径本体**：六 kind 判定族 / 尾文案 / 证据校验（citations）/ 冻结窗口 / 启动断言 **零改**——撤的是**计数器与按计数封禁**，不是守卫。
- **不动调度面**：池上限（`agent.poolLimits.advisor`）保持；不新增会话级计数载体（承 N20 零计数）。
- **不改评审语义判据**（pass / changes-required 判定、告警词表、凭证链语义）。
- **不改提示词面正文**（如需，设计轮出逐字建议、**父侧落笔**）。
- **调用面收正随本批（用户 2026-09-18 16:16 补裁）**：依赖旧缺省（无 `type` ⇒ code）的调用点须同轮补齐显式 `type`——**代码内调用点 = 实现轮；提示词 / 纪律档文本 = 设计轮出逐字建议、父侧落笔**；盘点面（口径 + 命中清单）在设计轮必做，否则新门会打死合法调用。
- **批档 §5 修正轮上限 / §3 停止判据（同族候选）= 本批只出对照与裁定选项**——是否同口径撤除 = **用户裁**（设计档列对照表）。
- **VSC 端（2026-09-18 16:1x 实核收正）**：核单源（W12 后无端侧副本）**但端侧仍有硬依赖残留**——`thincoder-vscode/src/agent/run-stages.mjs:22` / `:156`（guard 轮次项）· `src/agent.mjs:13`（死导入）；核常量删除后不处理 = **端启动期 import 抛错** ⇒ 已入受影响表（硬依赖，非选项）。

### 1.5 验收口径

1. **行为可机判（先红后绿）**：③ 撤计数 = 断言「同实例第 6 次发起**不**返回 cap 消息、照常受理」；①② 各有用例（拒回串 / 文案四要素在位）。**① 补（2026-09-18 16:16 用户裁）**：「缺顶层 `type` ⇒ 拒」+ **调用面全量收正**（盘点可复核）。**用例口径（16:1x 实核收正）**：全仓零 cap 用例（含 `_archive`）⇒ cap 面**新增**覆盖；streak 面**改名 + 全量重写**（不得只删）。
2. **零回归**：评审类测试全绿；三包既有基线不破。
3. **文档一致**：设计档 / 需求档（已落）/ 提示词面（若涉）三链同源；`node scripts/doc-check.mjs` **按档归属零新增**。

### 1.6 台账

- **#84 · #85 · #86** → 本批；完成后核销。（#84 的「受影响批重发评审」半幅 = 本会话在飞四批 **id=69–72**，另行处置与收口。）

### 1.7 冻结避让（在飞评审的 D5 窗口）

本批设计轮**禁触**以下在审文档（直到对应报告送达、冻结解除）：

- 上行通道批：`docs/core/design/AGENT-LOOP-SUBAGENT.md` · `docs/core/requirements/AGENT-LOOP.md` · `docs/batches/2026-09-18-subagent-upward-channel.md`
- ACP 批：`docs/cli/design/ACP-CLIENT.md` · `docs/cli/requirements/ACP-CLIENT.md` · `docs/batches/2026-09-18-acp-external-drivers.md`
- 死名收正二轮批：`docs/core/design/DOC-DISCIPLINE.md` · `DOC-MIGRATION.md` · `SEND-STALL-DISTILL.md` · `docs/batches/2026-09-18-deadname-sweep2.md`
- 判据面收正批：`docs/core/design/DOC-SYSTEM.md` · `MULTI-INSTANCE-COLLAB.md` · `ANCHOR-DEBT-REPAIR.md` · `docs/batches/2026-09-18-arbiter-face.md`

## §2 批次任务与设计

### 2.1 本批覆盖的需求条目（逐条可交付）

| # | 需求（需求档） | 本批交付 |
|---|---|---|
| ① | **F30** 误配 fail-closed（`requirements/ADVISOR-CONVERGENCE.md` §9） | 工具层**最早**判定：`object.type === "design"` ∧ 顶层 `type` 缺失或非 design ⇒ **拒发串**（两路指引 + 对象标识行）+ 拒发登记（不置 called / 不耗轮次 / 零实例 / 零 LLM） |
| ② | **F31** 文案载范围（同档 §9） | 三类文案（失败结论 / 范围拒回三处 / 误配拒回）**首行载对象标识四项**（type · scope · round · criterion）；既有稳定前缀逐字在位；cap 文案随撤除整体退场 |
| ③ | **F28** 失败有结论（同档 §6.2） | 结算分类改**纯函数**（输出判据名、零状态）+ 逐次结论块（发生了什么 + 下一步）；**零会话级计数载体**；机制面**零封禁** |
| ④ | **F29** 失败结论文本（同档 §6.2） | 结论块逐字模板：块首行四项标识 + 判据名 → 人读说明 + 失败尝试表 + 选项三值；全文零凭证值 |
| ⑤ | **#84 治理面撤计数**（N1 / §4 / §8.1 F-A3 撤项 / §8.2 N-A1） | cap 整体撤除（常量 / 消息构建器 / 三处检查点）+ 停止护栏整体撤除（载体 / 停止谓词 / 两级检查点）；**轮次字段保留**（提示词衰减 + 显示——非终止判据） |

**设计权威（本设计轮已落）**：`docs/core/design/ADVISOR-CONVERGENCE.md` §3 重写（「机械轮次上限（cap）」→「轮次与终止（无机械上限）」：撤除面 / 轮次字段区分对待 / 失败有结论 / 停下上报 / 零载体 / 父侧纪律逐字建议 / 载体收窄 / §3.5 同族对照表 / §3.6 材料归属）· `docs/core/design/ADVISOR-GUARDS.md` §2.4（误配断言）+ §2.5（对象标识行）+ §7 重写（失败结算结论）+ §10 / §11 同步。

**本批不做（明确）**：批档 §5 修正轮上限 / §3 停止判据的同口径撤除（设计档只出对照表 §3.5，**用户裁**）· 六 kind 判定族谓词与六条尾文案 · 冻结窗口 / 启动断言 / citations / 池上限 · 提示词面正文（设计档出逐字建议，**父侧落笔**）· 需求档（父侧笔 · 已同轮收正）。

### 2.2 受影响文件表（行数 as-of 2026-09-18 · 设计轮实测）

| 文件 | 现行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `thincoder-core/advisor/notice.mjs`（拟新增） | 0 | +~110 | 失败结论 / 拒回文案 + 对象标识行**单源**；结算判据名纯函数；判据名 → 人读说明表 |
| `thincoder-core/agent-tools/advisor.mjs` | 280 | -6 / +14（≈288） | 删 cap 预检 + 停止预检；增 F30 误配断言；两处范围拒回改调标识行构建器 |
| `thincoder-core/advisor/run.mjs` | 293 | -49 / +4（≈248） | 删 `MAX_ADVISOR_ROUNDS` / `buildCapMessage` / `extractUnfixedIssues` / 停止前缀与结论串构建器 / 停止内防线；保留启动拒绝前缀契约 |
| `thincoder-core/agent-tools/review-streak.mjs` → `review-facts.mjs`（改名） | 93 | -45（≈48） | 只留 `normAbs` + `docSetKey`（纯事实面）；计数载体 / 停止谓词 / 分类函数全删 |
| `thincoder-core/agent-tools/advisor-settle.mjs` | 231 | -6 / +6（≈231） | 计数落账 → 结论块落账（分类单源）；陈旧 / 落盘分支出结论 |
| `thincoder-core/agent-tools/advisor-async.mjs` | 477 | -3 / +1（≈475） | 同 scope 拒回文案改调标识行构建器（净不增行） |
| `thincoder-core/advisor.mjs` | 278 | ±0 | 头注「cap / 第 6 次拒绝」句收正（注释面） |
| `thincoder-core/agent/completion.mjs` | 146 | -2（≈144） | guard 公式删轮次项 + 删 `MAX_ADVISOR_ROUNDS` 导入（`rounds` 变量留作提醒文案显示） |
| `thincoder-core/agent/record-results.mjs` | 174 | ±0 | 注释收正（REFUSED 族引述的「per-review cap」） |
| `thincoder-vscode/src/agent/run-stages.mjs` | 380 | -2（≈378） | guard 删轮次项 + 删导入（端侧镜像残留——§1.4「端侧残留登记」实核命中） |
| `thincoder-vscode/src/agent.mjs` | 485 | -1（≈484） | 删死导入（`MAX_ADVISOR_ROUNDS` 导入未消费） |
| `thincoder-cli/test/advisor-failure-notice.test.mjs`（拟新增 · 承既有用例重写） | 0 | +~180 | 承 `thincoder-cli/test/design-review-streak-guard.test.mjs`（266 行）**改名 + 全量重写**（承载新语义，非删除）：结论块 / 判据名 / 零载体 / 零封禁 |
| `thincoder-cli/test/advisor-round-uncapped.test.mjs`（拟新增） | 0 | +~110 | 撤计数主判据：第 6 次照常受理 + guard 不因轮次停推 + 结构断言（常量 / 导出零残留） |
| `thincoder-cli/test/advisor-chain-guards.test.mjs` | 488 | ±0（复核面） | 既有断言零改；若存在对报告全文的等价比较 ⇒ 仅随结论块微调该断言 |
| `thincoder-vscode/test/advisor-guard-rounds.test.mjs`（拟新增） | 0 | +~60 | 端侧 guard 直驱（`maybeGuardPushbacks` 导出面）：`_advisorRound=6` 仍推回 |
| `thincoder-vscode/test/files.mjs` | — | +1 行 | 端侧显式测试登记表（新增用例登记） |
| `docs/core/design/ADVISOR-CONVERGENCE.md` | 259 | +~35（已落） | §3 重写 + §3.5 / §3.6；§1 / §2.1 / §2.2 / §6.2 / §10 / §12 同步 |
| `docs/core/design/ADVISOR-GUARDS.md` | 334 | +~50（已落） | §2.4 / §2.5 新增 · §7 重写 · §4 / §6 / §10 / §11 同步 |

**拆分规划（跨档位文件的既有硬帽面）**：`advisor-async.mjs`（477 → 475，净减）后续再增 ⇒ 先拆池队列面（`dequeueAdvisor` / `refillAdvisorQueue` / `refreshAdvisorQueuedTokens` ≈70 行）到 `advisor-pool.mjs`；`thincoder-vscode/src/agent.mjs`（485 → 484）后续再增 ⇒ 先拆 `INHERITED_GUARD_KEYS` + hydrate 面到 `agent/setup.mjs`（对位已存在）；`run-stages.mjs`（380 → 378）后续再增 ⇒ 先拆 guard 面（`maybeGuardPushbacks` ≈120 行）到 `agent/guard-stages.mjs`；新档 `notice.mjs`（~110）在 300 档内、零拆分义务。

### 2.3 验收标准与用例表

**验收标准（逐条机判）**

| # | 标准（命令 / 断言级） | 回指 |
|---|---|---|
| AC-1 | 主判据（先红后绿）：code 实例 `run.round=5` 发起 ⇒ 返回 async ack（`JSON.parse(out).kind === "advisor"`）、`out` 不含 `convergence cap`、`_advisorRefusals` 不含该 toolCallId | F2 / F3 撤项 · #84 |
| AC-2 | 误配拒发：`out.startsWith("Advisor: design review launch refused")` ∧ 含两路指引 ∧ 含 `criterion=type-mismatch` ∧ `_advisorRefusals.has(id)` ∧ 零池条目 | F30 |
| AC-3 | 文案载范围：块首行正则 `\[type=(design\|code).*scope=.*round=.*criterion=[a-z-]+\]` 命中（三类文案逐一）；既有稳定前缀逐字 `includes` 命中 | F31 / F29 |
| AC-4 | 零计数载体：`agent._designReviewStreaks === undefined`；`review-facts.mjs` 导出面无停止谓词 / 计数函数；`run.mjs` 导出面无 `MAX_ADVISOR_ROUNDS` / `buildCapMessage`（结构断言） | F28③ / N20 |
| AC-5 | 零封禁：同 doc-set 第 4 次及以后的发起照常受理（逐次 settle 后重发）；失败结论块照常产出（不是拒发串） | F28② |
| AC-6 | guard 不因轮次停推：`handleCompletion`（code 实例 `round=6`）仍推回；`MAX_ADVISOR_PUSHBACKS` 仍限 3 | F28 / §3.1 |
| AC-7 | 零回归：三包 `npm test` 全绿（core / cli / vsc）；六 kind 尾文案 / 冻结窗口 / 启动断言 / citations 用例零改 | N21 |
| AC-8 | 机检：`node scripts/doc-check.mjs` 按档归属**零新增** | 批 §1.5 #3 |

**用例表（正常 / 边界 / 错误）**

| # | 用例 | 类 | 输入 | 期望 |
|---|---|---|---|---|
| T-AF1 | 撤计数主判据（第 6 次照常受理） | 正常 | code 实例 `round=5` + `advisorTool.execute({type:"code",paths:[...]}, {depth:0,_toolCallId})` | 返回 async ack（非 cap 串）；`_advisorRefusals` 零登记 |
| T-AF2 | 逐次重发（第 7 / 8 次） | 正常 | 同实例逐次 settle / cancel 后重发 | 每次都受理——无任何按轮次拒发 |
| T-AF3 | 失败结论块（截断族） | 正常 | design settle 携 `timeout` 尾 | 结论块在位（块首行四字段 + `criterion=timeout` + 含义 + 选项三值 + 尝试表行）；既有正文逐字保留 |
| T-AF4 | 一致形零影响 | 边界 | `object.type="design"` ∧ 顶层 `type="design"` | 照常走 design 轨（不拒、铸 token） |
| T-AF5 | 无 `object` 形零影响 | 边界 | 仅 `documents`、无顶层 `type` | 仍落 code 轨（F30 边界——既有语义不变） |
| T-AF6 | 轮次字段保留 | 边界 | 逐次发起 | `run.round` 照常递增；ROUND2 / ROUND3 提示词轮换与显示不变 |
| T-AF7 | guard 不以轮次停推 | 边界 | `handleCompletion`（guard 开、改码未评审、`round=6`） | 仍推回（受 `MAX_ADVISOR_PUSHBACKS`=3 限）；VSC 端同式（`maybeGuardPushbacks`） |
| T-AF8 | 无结论面零噪声 | 边界 | 可用判决 / `interrupted` / 启动拒绝结算 | 判据名 `null` ⇒ 不追加结论块 |
| T-AF9 | 误配拒发 | 错误 | `object.type="design"` ∧ 顶层 `type` 缺省（或 `"code"`） | 拒发串（前缀 + 两路指引 + 标识行）+ 拒发登记 + 零实例 / 零 LLM |
| T-AF10 | 范围拒回载标识 | 错误 | 无 scope（code）/ design documents 非文档 / 同 scope 在跑 | 首行 = 既有前缀逐字 + 标识块四项（`criterion` 分别 `scope-missing` / `scope-not-doc` / `scope-in-flight`） |
| T-AF11 | 零载体与导出面结构断言 | 错误 | 失败结算后读 `agent` / 模块导出面 | `_designReviewStreaks === undefined`；停止谓词 / 计数函数 / cap 常量零导出 |
| T-AF12 | 凭证卫生 | 错误 | 结论块全文 | UUID 形扫描零命中（零 token / designId 值） |

**先红证据形式（实施前以现状代码跑，读数入 §5）**：T-AF1 → 读得 cap 串 `Advisor: convergence cap reached after 5 rounds.`（拒发 + `_advisorRefusals` 登记）· T-AF9 → 读得**无拒发**（静默落 code 轨：有 documents 则越过范围检查）· T-AF11 → 读得 `_designReviewStreaks` 被创建（`Map`）/ `MAX_ADVISOR_ROUNDS` 与 `buildCapMessage` 在导出面。

### 2.4 上抛（待父侧 / 用户裁——本设计不代裁）

| # | 事项 | 性质 | 本设计取法 / 建议 |
|---|---|---|---|
| 1 | **F29「轮次 N/M」的 M 在撤 cap 后无定义** | 需求面（父侧笔） | 取 `round={N}/uncapped`（机制真相——不发明新上限）；若要求数字 M 或只写 N，请父侧在需求档 §6.2 / §9 明确 |
| 2 | **F29「失败尝试表（逐次 kind）」与 F28③「零会话级计数载体」张力** | 需求面 | 取**零载体** ⇒ 尝试表 = **单行**（本次尝试，`#` = 实例尝试序号）；若需跨次累积表 ⇒ 须引入非封禁用记录载体，与 F28③ 字面冲突，请裁 |
| 3 | **F31 枚举含「cap 文案」，而 cap 已随 F2 / F3 撤项** | 需求面（枚举陈旧） | 该文案整体退场；需求档 §9 枚举建议同步为「失败结论 / 范围拒回 / 误配拒回」三类 |
| 4 | **F31「既有稳定前缀保留」的形态** | 需求面 | 取法：拒回族**行首前缀逐字 + 标识块尾随**（两句同时满足）；失败族**既有正文逐字下沉为块体**（块首行让位标识行）。若「前缀必须仍在首行」为硬要求 ⇒ 与「首行载对象标识」冲突，请裁 |
| 5 | **VSC 端残留（实核命中，与批 §1.4「无对位实施面」预判不符）** | 实施面（已列表） | `thincoder-vscode/src/agent/run-stages.mjs:156` / `:22` · `src/agent.mjs:13`——核常量删除后不处理 = VSC 启动期 import 抛错（**硬依赖，非选择**）；已入 §2.2 受影响表 |
| 6 | **跨档悬空引用（本批不动手——写域只含两档 advisor 设计档）** | 一致性面（父侧派单） | `docs/core/design/CONFIG.md:113`（「评审轮次上限（cap 5）不变」）· `docs/core/design/ENGINEERING-MODE-V2.md:331`（枚举含「机械 cap」）· `docs/core/design/AGENT-LOOP-SUBAGENT.md:197`（「cap 随实例 ≤5 轮」——**在飞冻结档，禁触**） |
| 7 | **批次档 §1.5「既有 cap 用例重写」口径实核更正** | 批次档（父侧笔） | 全仓（含 `_archive`）零命中 `MAX_ADVISOR_ROUNDS` / `buildCapMessage` / `convergence cap` 的测试引用 ⇒ **无 cap 用例可重写**；cap 面以**新增**用例覆盖（T-AF1 / T-AF2 / T-AF7 / T-AF11），streak 面按口径**重写**（`design-review-streak-guard.test.mjs` → `advisor-failure-notice.test.mjs`，改名 + 全量重写） |
| 8 | **父侧纪律文本落笔**（`design/ADVISOR-CONVERGENCE.md` §3.3 逐字建议已出） | 提示词面（父侧笔） | 建议落 `thincoder-core/prompts/discipline-engineering.md`（普通模式由 common 层「停下上报」承接）；本批设计不改提示词正文 |

### 2.5 用例实施手法（离线——零网络 · N21）

- **发起受理面断言（T-AF1 / T-AF2 / T-AF7）零网络手法**：桩 provider（`globalThis.fetch` 桩，或不可达 `baseURL`）+ 发起后立即 `cancelAsyncAdvisor(agent, id)` 清理池条目；断言只看**发起受理**（ack 形态 / `_advisorRefusals` 零登记 / 无拒发串），**不等待评审完成**（评审 promise 的失败分支由桩裁决，不进断言面）。
- **结算面断言（T-AF3 / T-AF8 / T-AF9 / T-AF10 / T-AF12）**：纯函数 / 直调 `settleAdvisorRun` + 桩 entry（既有 `advisor-chain-guards.test.mjs` 与 `design-review-streak-guard.test.mjs` 同款手法——零 chat）。
- **guard 面（T-AF6 / T-AF7 端侧）**：`handleCompletion`（核）与 `maybeGuardPushbacks`（端——已导出）直驱桩 agent，零 chat。
- **主判据测试文件命名**：`thincoder-cli/test/advisor-round-uncapped.test.mjs`（撤计数）· `thincoder-cli/test/advisor-failure-notice.test.mjs`（结论块——承既有 streak 用例重写）· 端侧 `thincoder-vscode/test/advisor-guard-rounds.test.mjs`（登记入 `thincoder-vscode/test/files.mjs`）。

### 2.6 返工轮（用户 16:16 补裁后）——落位表 + 上抛收口

**来源**：用户 2026-09-18 16:16 逐字「我的观点是不带 type 就要拒，不静默降级。」（原裁决消息在本席上一轮 settle 前未送达——`undelivered`）+ 父侧 16:1x–16:17 对本席上抛 1–8 的裁定。
**效力声明**：本轮收正 **§2.1 ① / §2.2 / §2.3 / §2.4** 的对应行；上列旧行**作废**，以本 §2.6–§2.8 为权威版本（§2.7 = §2.2 受影响表 + §2.3 AC·用例收正版；§2.8 = 调用面盘点清单）。

**落位表（要点号 → 改动 → file:line）**

| # | 要点 | 改了什么 | file:line（读数 as-of 2026-09-18 16:2x） |
|---|---|---|---|
| 1 | F30 返工——判定 | §2.4 重写为「**类型门（顶层 `type` 必填）**」：判定 = `args.type ∉ {code,design}`（缺失 / `null` / 空串 / 非法值 / 非字符串）⇒ 拒；撤「无 `object` 时顶层缺省 = code」；矛盾形并入（自然子集，不另立规则） | `docs/core/design/ADVISOR-GUARDS.md:64-65`（判定句）· 判定点 `:67` → 实现落点 `thincoder-core/agent-tools/advisor.mjs:98` |
| 1b | F30 返工——拒发串 | 两个合法值 + **各一行用途**（`type="code"` / `type="design"`）；前缀**新设** `Advisor: launch refused`（与设计专用启动断言前缀分列，附理由）；`Why:` 第二行三形态逐字（`type-missing` / `type-invalid` / 对象声明不一致追加句）；收尾「零实例 / 零 token / 零 LLM」 | `ADVISOR-GUARDS.md:69-90`（前缀 `:69` · 消费面 `:71` · 逐字块 `:74-80` · 三形态 `:82-86`） |
| 1c | F30 返工——边界 / 枚举 | 删旧边界句；新边界 = 显式 `code`/`design` 照常（`object` 不选轨）+ 只认逐字枚举（不 trim / 不大小写推断）+ 不设内防线（位置参面实测零缺省）；判据名闭合两条 `type-missing` / `type-invalid`（`type-mismatch` 退场——全仓未实现，实测零命中） | `ADVISOR-GUARDS.md:88-89` |
| 1d | F30 返工——标识行 / AC / 边界登记 | §2.5 标识行 `type` 值域扩 `code\|design\|absent\|invalid`、`round` 记 `{N}/uncapped`、载面 ④ 改「类型门拒回」；§10 **A-AG13 重写** / A-AG14 收正 / **A-AG15 新增**（调用面零残留）；§11 增类型门登记（非发起点两项）；板块行收正 | `ADVISOR-GUARDS.md:92-103` · `:342-344` · `:356` · 板块行 `:3` |
| 2 | **调用面盘点与收正（本轮核心增量）** | 口径命令 + 逐条命中清单 + 落笔级 + 「零残留」判据形态 | **§2.8**（清单）· **§2.7**（受影响表 + AC 收正）· 设计档指针 `ADVISOR-GUARDS.md:90` |
| 3 | 上抛 3 / 4 / 6 设计面收正 | ③ F31 枚举 = 失败结论 / 范围拒回 / 类型门拒回（cap 文案退场）· ④ 形态 = 前缀行首逐字 + 标识块紧随 · ⑥ 三处跨档引用入表（文本随实现轮） | `ADVISOR-GUARDS.md:92 / 100 / 101`（③）· `:94`（④）· §2.7 受影响表三行（⑥） |
| 4 | 两档设计档变更记录 | 各加一行（各档「变更记录」首条） | `ADVISOR-CONVERGENCE.md:282` · `ADVISOR-GUARDS.md:372` |

**上抛 1–8 收口表（父侧裁定 → 落位）**

| # | 上抛事项 | 裁定（父侧 16:1x–16:17） | 落位 |
|---|---|---|---|
| 1 | F29 轮次 `N/M` 的 M 无定义 | 取 `round={N}/uncapped`（机制真相——不发明新上限） | `ADVISOR-GUARDS.md:98`（字段行 `round`）· `:247`（结论块模板） |
| 2 | 尝试表 vs 零会话级载体 | 取**零载体 + 本次单行**（`#` = 实例尝试序号；不许引入跨次载体） | `ADVISOR-GUARDS.md:256`（§7 契约二） |
| 3 | F31 枚举含已退场的 cap 文案 | 取「失败结论 / 范围拒回 / 类型门拒回」；cap 文案退场 | `ADVISOR-GUARDS.md:92 / 100 / 101` |
| 4 | F31「既有稳定前缀」形态 | 取**前缀行首逐字 + 标识块尾随**（两句同时满足） | `ADVISOR-GUARDS.md:94` |
| 5 | VSC 端硬依赖残留 | **采纳为硬依赖**（非选项）；端侧用例随本批 | §2.7 受影响表 `run-stages.mjs` / `agent.mjs` 两行（行数已实测收正） |
| 6 | 跨档悬空引用三处 | **纳入本批射程**：登记 + 拟改形态；**文本改动随实现轮**（本轮写域不含三档）；`AGENT-LOOP-SUBAGENT.md` 系 #69 已过审档 ⇒ 改后在批档记 delta | §2.7 受影响表三行（本档**未触碰**三档本体） |
| 7 | §1.5 用例口径实核更正 | 父侧已直接收正（本席不动） | — |
| 8 | 父侧纪律文本（评审反复失败 ⇒ 停下上报） | 采纳：§3.3 逐字建议保留，父侧在实现轮同轮落笔（本席不改提示词正文） | `ADVISOR-CONVERGENCE.md:79-85`（§3.3 逐字块 `:84`） |

**§2.1 ① 收正行（旧行作废——以本行为准）**

| # | 需求（需求档） | 本批交付 |
|---|---|---|
| ① | **F30** 顶层 `type` 必填（fail-closed）（`requirements/ADVISOR-CONVERGENCE.md` §9） | 工具层**最早**判定：顶层 `type` 必须逐字 ∈ {`"code"`, `"design"`}——缺失 / `null` / 空串 / 非法值 / 非字符串 ⇒ **拒发串**（前缀 `Advisor: launch refused` + 两个合法值各一行用途 + 标识行）+ 拒发登记（不置 called / 不耗轮次 / 零实例 / 零 token / 零 LLM）；撤「无 `object` 缺省 = code」旧语义；`object.type="design"` 且顶层缺/非法的矛盾形 = 自然子集；**调用面全量收正**（盘点见 §2.8） |

**新增上抛（第 9 项——语义面，本席不代裁）**

| # | 事项 | 性质 | 本设计取法 / 请裁 |
|---|---|---|---|
| 9 | **显式 `type:"code"` ∧ `object.type="design"` 的形**：需求档 §9 F30 判定句 ②（「显式 `type:"code"` / `"design"` 照常」）与括注「矛盾形 = 本条自然子集」中的「顶层**异**」在这一点上张力——拒（旧 §2.4 语义）还是照常（判定句 ② 语义）？ | 需求面（父侧笔） | 取**照常受理**（判据：用户裁定只覆盖「**不带** type」；判定句 ② 明文「显式 code/design 照常」；`object` 声明只描述评审对象、不选轨）——对象声明不一致仅在拒发串正文追加一句说明。若判为「须拒」⇒ 需求档 §9 F30 需写明（设计随改：判据名增第 3 条 `type-object-conflict`） |

### 2.7 §2.2 受影响表 / §2.3 AC·用例（收正版——旧同名表作废）

**口径**：下表为 §2.2 / §2.3 的**权威版本**；旧表中未列于此的行/条目**零改**（继续有效）。行数 as-of 2026-09-18 16:2x（实测）。

**§2.2 受影响文件表（收正行 + 新增行）**

| 文件 | 现行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `thincoder-core/agent-tools/advisor.mjs`（**收正**） | 280 | -23 / +9（≈266） | ① `:98` 旧缺省 `args.type \|\| "code"` → **类型门**（最早判定；`:64-90` 契约——`type-missing` / `type-invalid` 两分支 + 拒发登记）；② `:4` / `:38` / `:61` 声明面三处 type `(default)` 旧句收正；③ 删 cap 预检（`:172-183`）；④ 删停止预检（`:185-191`）+ `review-streak` 导入块（`:23-26`）；⑤ 两处范围拒回改调标识行构建器（净 0） |
| `thincoder-core/advisor/notice.mjs`（拟新增 · **收正**） | 0 | +~130（原 ~110） | 失败结论 / 拒回文案 + 对象标识行**单源**；**增**：类型门拒发串构建（前缀行 + `Why` 三形态 + 两个合法值行 + 标识行）；结算判据名纯函数 + 判据名 → 人读说明表 |
| `thincoder-vscode/src/agent.mjs`（**收正行数**） | **486**（旧表误记 485） | -3（≈483） | 删死导入 `MAX_ADVISOR_ROUNDS`（`:13`）+ 同文件 `INHERITED_GUARD_KEYS` 面复核（`:35`）；端侧硬依赖（§1.4 实核） |
| `thincoder-vscode/src/agent/run-stages.mjs`（**收正**） | 380 | -4（≈376） | 删导入（`:22`）+ guard 轮次项（`:156`）+ 两处注释 cap 引述（`:78` / `:144`）；端侧硬依赖——不处理 ⇒ 端启动期 import 抛错 |
| `thincoder-cli/test/advisor-type-required.test.mjs`（拟新增 · **新**） | 0 | +~110 | F30 全形态（缺 / `null` / 空串 / 非法 / 非字符串 ⇒ 拒；显式 `code` / `design` ⇒ 受理；矛盾形 ⇒ 同拒）+ **盘点零残留结构断言**（源内旧缺省零命中 · 三树调用点逐处显式 `type`） |
| `thincoder-cli/test/advisor-failure-notice.test.mjs`（拟新增 · 行数收正） | 0 | +~170（原 ~180） | 承 `design-review-streak-guard.test.mjs`（266 行）改名 + 全量重写；类型门用例**不并入本档**（独立档见上行） |
| `thincoder-cli/src/tui/tool-args.mjs`（**新增 · 登记零改**） | 84 | ±0 | 显示面 fallback `a.type ?? "review"`（`:51`）——**非发起点**，不参与发轨判定；登记见 `ADVISOR-GUARDS.md` §11 |
| `thincoder-vscode/src/agent/execute-tools.mjs`（**新增 · 登记零改**） | 393 | ±0 | 记账面 `args.type !== "design"`（`:363`）——判定后恒为枚举值，语义等价；登记同上 |
| `docs/core/design/CONFIG.md`（**新增 · 跨档 ①**） | 149 | ±0（一行文本） | `:113` 现文读数：「**范围边界（旧档承接）**：评审轮次上限（cap 5——见 `ADVISOR-CONVERGENCE.md` §3）不变；…」→ 拟改形态：删「评审轮次上限（cap 5…）不变」句，改指同档 §3「无机械上限」。**文本随实现轮**（本轮写域不含本档） |
| `docs/core/design/ENGINEERING-MODE-V2.md`（**新增 · 跨档 ②**） | 435 | ±0（一行文本） | `:331` 现文读数：「- 轮次衰减 / 机械 cap / 会话隔离 / 失败护栏（六 kind 不签发）。」→ 拟改形态：删「机械 cap」项 ⇒「轮次衰减 / 会话隔离 / 失败护栏（六 kind 不签发） / 失败结论」。**文本随实现轮** |
| `docs/core/design/AGENT-LOOP-SUBAGENT.md`（**新增 · 跨档 ③——在飞冻结档，本轮零触碰**） | 1468 | ±0（一行文本） | `:197` 现文读数：「③ `_advisorRound` 改按 review 实例记（**cap 随实例 ≤5 轮**）」→ 拟改形态：「（轮次仅作提示词衰减与显示——**无机械上限**）」。**文本随实现轮**；本档系 #69 评审已过档 ⇒ **改后须在批档记 delta** |
| `docs/core/design/ADVISOR-GUARDS.md`（**收正**） | 355 → **382**（本轮已落） | +27 | §2.4 重写 / §2.5 值域 / §10 A-AG13-15 / §11 登记 / 板块行 / 变更记录 |
| `docs/core/design/ADVISOR-CONVERGENCE.md`（**收正**） | 288 → **293**（本轮已落） | +5 | 变更记录一行（多行续行——宽度判据）（返工轮；本档随动 = 零的核过声明） |

**拆分规划（新增面）**：本轮新增行集中在 `advisor.mjs`（280 → ≈266，**净减**、300 档内）与两个新档（`notice.mjs` ≈130、`advisor-type-required.test.mjs` ≈110，均在档内）；`advisor-async.mjs`（477 → 475）后续再增 ⇒ 拆池队列面到 `advisor-pool.mjs`（承原规划）。

**§2.3 AC（收正 + 新增）**

| # | 标准（命令 / 断言级） | 回指 |
|---|---|---|
| AC-2（**收正**） | F30 类型门（先红后绿）：`advisorTool.execute({documents:[…]}, {depth:0,_toolCallId})`（**无 `type`**）⇒ 返回串首行以 `Advisor: launch refused` 开头 ∧ 含 `type="code"` 与 `type="design"` 两行（各带用途）∧ 标识行含 `criterion=type-missing` ∧ `_advisorRefusals.has(id)` ∧ 零池条目 ∧ `_engDesignTokens` 零写入；显式 `type:"code"` / `"design"` ⇒ 照常受理（拒绝串零命中） | F30 |
| AC-3（**收正**） | 文案载范围：块首行正则 `\[type=(code\|design\|absent\|invalid) · scope=.* · round=(\d+/uncapped\|—) · criterion=[a-z-]+\]` 命中（三类文案逐一）；既有稳定前缀逐字 `includes` 命中（范围缺失 `Advisor: no review scope specified` / 范围非法 `Advisor: design review documents must be documentation files` / 同 scope 在跑 `Advisor: 此 scope 已有评审在跑`） | F31 / F29 |
| AC-9（**新增**） | F30 形态枚举闭合：`null` / `""` / `"  "` / `"Code"` / `"design "` / `"foo"` / `1` / `true` / `{}` / `[]` ⇒ **全部拒**（缺失 / `null` / 空串 / 纯空白 ⇒ `type-missing`；其余 ⇒ `type-invalid`）；`"code"` / `"design"` ⇒ 受理；`object.type="design"` ∧ 顶层缺 ⇒ 同拒 + 正文追加对象声明句 | F30 |
| AC-10（**新增**） | 调用面零残留（机判）：① 结构断言——`thincoder-core/agent-tools/advisor.mjs` 源内 `args.type \|\| "code"` 零命中 ∧ 声明面 type `(default)` 句零命中；② 三树 `advisorTool.execute(`（12 处）/ `runAdvisorReview(` / `prepareAdvisorMessages(` 调用点逐处显式；③ 口径命令（复审可重跑）见 §2.8 | F30 判定句 ③ |

**§2.3 用例表（收正 + 新增）**

| # | 用例 | 类 | 输入 | 期望 |
|---|---|---|---|---|
| T-AF4（**收正**） | 一致形照常 | 边界 | `object.type="design"` ∧ 顶层 `type="design"` | 照常走 design 轨（铸 token、受理） |
| T-AF5（**重写**——旧「无 `object` 形零影响 / 仍落 code 轨」作废） | **无 `type` 形 ⇒ 拒发** | 错误 | 仅 `documents`、无顶层 `type` | 拒发串（前缀 + 两合法值行 + `criterion=type-missing`）+ 拒发登记；**零实例 / 零 token / 零 LLM** |
| T-AF9（**重写**——旧「或 `"code"` ⇒ 拒」口径作废） | 类型门全形态 | 错误 | `null` / `""` / `"  "` / `"Code"` / `"foo"` / `1` / `true` / `{}` / `[]` 逐一 + 对照行 `"code"` / `"design"` | 前九者全拒（判据名按 AC-9 分叉）；对照行照常受理 |
| T-AF13（**新增**） | 对象声明不一致形 | 错误 | `object.type="design"` ∧ 顶层缺（或非法值） | 同一条拒绝 + 正文追加 `The object declaration says type="design"; …` 句；零实例 |
| T-AF14（**新增**） | 调用面零残留结构断言 | 结构 | 源扫描（三树 `*.mjs`）+ 提示词 / 纪律档文本 | 旧缺省载体零命中；`advisorTool.execute(` 调用点逐处带 `type:`；提示词面 advisor 调用形仅槽位头注 2 处（非调用指令） |
| T-AF15（**新增 · 上抛 9 取法锁定**） | 显式 `code` ∧ `object` 声明 `design` | 边界 | `advisorTool.execute({type:"code", paths:[…], object:{type:"design"}})` | **照常走 code 轨**（`object` 不选轨）——父侧若裁「须拒」⇒ 本行改拒 + 判据名增 `type-object-conflict` |

**先红证据形式（承旧表，补 F30 行）**：T-AF1 → 读得 cap 串 `Advisor: convergence cap reached after 5 rounds.` · **T-AF5 → 读得无拒发（静默落 code 轨：有 `documents` 则越过范围检查直接受理）** · T-AF9 → 读得 `"Code"` / `1` / `{}` 等非法值同样静默落 code 轨 · T-AF14 → 读得 `advisor.mjs:98` `args.type \|\| "code"` 1 处 + 声明面 `(default)` 3 处 · T-AF11 → 读得 `_designReviewStreaks` 被创建（`Map`）/ `MAX_ADVISOR_ROUNDS` 与 `buildCapMessage` 在导出面。

### 2.8 调用面盘点清单（F30 判定句 ③——口径可复核）

**扫描域**：三产品树 `thincoder-core/` · `thincoder-cli/` · `thincoder-vscode/` 的 `*.mjs` + 提示词 / 纪律档文本（`thincoder-core/prompts/` · `docs/core/design/prompts/`）；排除 `node_modules` · `.thincoder` · `_archive`。
**口径命令（任何人可重跑——读数即下表命中清单）**

```text
命令 1（发起点与内部链）:
  grep -rnE "advisorTool\.execute\(|runAdvisorReview\(|prepareAdvisorMessages\(" thincoder-core thincoder-cli thincoder-vscode --include="*.mjs"
命令 2（旧缺省载体 + 声明面 default 句）:
  grep -rnE "args\.type *\|\| *\"code\"|\(default\)" thincoder-core/agent-tools/advisor.mjs
命令 3（提示词 / 纪律档文本——advisor 调用形）:
  grep -rnE "advisor\s*\([^)]*\)|advisorTool[.\w]*\(" thincoder-core/prompts docs/core/design/prompts
```

**A. 代码内发起点（唯一判定点）**

| # | file:line | 现形态 | 拟改 | 落笔级 |
|---|---|---|---|---|
| A1 | `thincoder-core/agent-tools/advisor.mjs:98` | `const reviewType = args.type \|\| "code"`（缺省 code——静默落 code 轨） | **类型门**：判定前置到 `execute` 最前（范围判定 / 实例解析之前），拒发 + 登记 + 指引 | 代码 = **实现轮** |

**A2. 工具声明面（同档——模型可见文本，含旧缺省自述 3 处）**

| # | file:line | 现形态 | 拟改 | 落笔级 |
|---|---|---|---|---|
| A2.1 | `:4` | 头注 `type="code" for code review (default).` | 删「(default)」；写明顶层 `type` 必填 | 实现轮 |
| A2.2 | `:38` | description `Use type='code' (default) to review code changes after implementation…` | 删「(default)」；两值用途表述与拒发串同源 | 实现轮 |
| A2.3 | `:61` | 参数描述 `…, 'code' for code review (default)` | 同上 + schema 增 `required: ["type"]`（模型侧第一道提示） | 实现轮 |

**A3. 内部链（判定点之后——非发起点，零改）**

| # | file:line | 现形态 | 判定 |
|---|---|---|---|
| A3.1 | `thincoder-core/agent-tools/advisor.mjs:237` | `runAdvisorReview(agent, reviewType, …)`（同步路径） | 零改（收已判定值） |
| A3.2 | `thincoder-core/agent-tools/advisor-async.mjs:410` | 同（异步池条目启动） | 零改 |
| A3.3 | `thincoder-core/advisor/run.mjs:180` | 签名位置参 `reviewType`（无缺省值） | 零改（登记：位置参面不属类型门——两条内部调用者均在门后，直接调用方实测零缺省） |
| A3.4 | `thincoder-core/advisor.mjs:190` | `prepareAdvisorMessages(…)` 签名 | 零改（同上） |

**A4. 分支 / 显示依赖面（读 `type` 但非发起点——登记零改）**

| # | file:line | 现形态 | 判定 |
|---|---|---|---|
| A4.1 | `thincoder-vscode/src/agent/execute-tools.mjs:363` | `if (args.type !== "design") agent._advisorRound++` | 零改（判定后恒为枚举值——语义等价；登记 `ADVISOR-GUARDS.md` §11） |
| A4.2 | `thincoder-cli/src/tui/tool-args.mjs:51` | `case "advisor": return String(a.type ?? "review")` | 零改（渲染兜底——不参与发轨判定；被拒调用照原样渲染） |

**B. 提示词 / 纪律档文本（口径命令 3——命中 2 处，均非调用指令）**

| # | file:line | 现形态 | 判定 |
|---|---|---|---|
| B1 | `thincoder-core/prompts/advisor-design.md:1` | 槽位头注 `consumers:[advisor(type='design') injection — …]` | **零改**（自述消费方，非调用指令） |
| B2 | `docs/core/design/prompts/advisor-design.md:1` | 中文正本同句（`消费方:[advisor(type='design') 注入…]`） | **零改**（同上） |

**提示词面零残留结论（逐条核过——均不涉 `type` 取值 / 省略形）**

- `thincoder-core/prompts/discipline-normal.md:120`（Advisor：改码后调用、必须给范围 `paths`/`documents`）——零改；中文正本 `docs/core/design/prompts/discipline-normal.md:119` 同。
- `thincoder-core/prompts/persona-engineering.md:90`「advisor 调用在顶层默认**异步**」——**async 缺省**（非 type 缺省），零改；中文正本 `:88` 同。
- `thincoder-core/prompts/persona-eng-coder.md:9`（`advisor` 且 `type="design"`——已显式）——零改；中文正本 `:9` 同。
- `thincoder-core/prompts/discipline-engineering.md`——**advisor 零命中**（工程模式 advisor 纪律在 `persona-engineering.md`）⇒ 无本面改动（§3.3 父侧纪律文本另属失败上报面，落笔权在主 agent）。
- 结论：**提示词 / 纪律档面零旧缺省依赖 ⇒ 本面设计轮无逐字建议、实现轮零文本改动。**

**C. 测试夹具与用例调用点（口径命令 1——`advisorTool.execute(` 12 处，逐处显式）**

| # | file:line | 现形态 | 拟改 | 落笔级 |
|---|---|---|---|---|
| C1 | `thincoder-core/test/advisor-consult-merge.test.mjs:80` | `type:"code"` | 零改 | — |
| C2 | `thincoder-cli/test/advisor-chain-guards.test.mjs:481` | `type:"design"` | 零改 | — |
| C3 | 同档 `:485` | `type:"code"` | 零改 | — |
| C4 | `thincoder-cli/test/batch-segment.test.mjs:159` | `type:"design"` | 零改 | — |
| C5 | `thincoder-cli/test/design-review-streak-guard.test.mjs:150` | `type:"design"` | 随档**改名 + 全量重写**（→ `advisor-failure-notice.test.mjs`） | 实现轮 |
| C6 | `thincoder-cli/test/integration/engineering-chain.test.mjs:89` | `type:"design"` | 零改 | — |
| C7 | `thincoder-vscode/test/integration/scenario-02-eng-chain.test.mjs:116` | `type:"design"` | 零改 | — |
| C8 | 同档 `:149` | `type:"design"` | 零改 | — |
| C9 | `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs:50` | `type:"design"` | 零改 | — |
| C10 | 同档 `:64` | `type:"design"` | 零改 | — |
| C11 | 同档 `:66` | `type:"design"` | 零改 | — |
| C12 | 同档 `:76` | `type:"design"` | 零改 | — |

**其余调用形（逐处显式——零改）**：`runAdvisorReview(` 测试 2 处（`advisor-chain-guards.test.mjs:215` · `design-review-streak-guard.test.mjs:171`，均 `"design"`）+ 内部 2 处（A3.1 / A3.2）；`prepareAdvisorMessages(` 测试 2 处（`advisor-chain-guards.test.mjs:197` · `:205`，均 `"design"`）。
**夹具另核**：`thincoder-cli/test/advisor-sync-accounting.test.mjs:46`（合成工具调用记录 `arguments: "{}"`——**非发起点**：`recordToolResults` 不解析 `args.type`，记账按 `_advisorRefusals` / `_advisorAsyncAcks` / `_advisorSyncCalls` 标记键走）⇒ 零改；`thincoder-vscode/test/trace-store.test.mjs:297`（trace 夹具）⇒ 纯显示，零改。

**「零残留」判据形态（机判三式 → 落 T-AF14 结构断言 / AC-10）**

1. **载体零命中**：`grep -c 'args.type || "code"' thincoder-core/agent-tools/advisor.mjs` ⇒ `0`；
2. **声明面零命中**：`grep -c '(default)' thincoder-core/agent-tools/advisor.mjs` ⇒ `0`（现行 3 处（`:4` / `:38` / `:61`）全为 type 旧缺省句）；
3. **调用点逐处显式**：口径命令 1 的每条命中行（含续行）均含 `type:` / 显式 reviewType 实参 ⇒ 缺项 `0`。

**盘点计数（D3——计数与列表同改）**：代码内发起点 **1**（A1）· 声明面 **3**（A2）· 内部链 **4**（A3）· 分支/显示依赖 **2**（A4）· 提示词文本命中 **2**（B，均非调用指令）· 用例 / 夹具调用点 **12 + 4 + 2**（C + 其余 + 夹具另核）；**需改动项合计 = 4**（A1 + A2 三处，全为实现轮代码面）；**提示词面改动项 = 0**。

### 2.9 小返工轮（父侧裁定上抛 9「拒」）——上抛收口 + 用例 / AC / 受影响表收正

**来源与效力**：父侧 2026-09-18 16:3x 裁定 §2.6 上抛表**第 9 项 = 拒**（声明面与实际轨不得静默不一致）；需求档 §9 F30 判定句 ② 已由父侧同轮收正（显式 `type` 须与 `object.type`（若声明）一致；**矛盾对 ⇒ 拒** + 判据名 `type-object-conflict` + 指引两路）。
本节收正 **§2.6 上抛 9 行** + **§2.7** 的 T-AF15 / AC-2 / AC-9 / AC-10 / 受影响表三行；**旧行作废，以本节为权威版本**（其余行零改、继续有效；**读数与机检卫生不回溯**——承禁改面）；本节读数 as-of 2026-09-18 16:4x。

**上抛 9 收口（承 §2.6 上抛表第 9 项）**

| # | 事项 | 裁定 | 落位（节 / file:line） |
|---|---|---|---|
| 9 | 显式 `type:"code"` ∧ `object.type="design"`（旧取法 = 照常受理） | **已裁：拒**（父侧 2026-09-18 16:3x）——不得静默走错轨 | 设计档 `docs/core/design/ADVISOR-GUARDS.md` §2.4（冲突分支 = 判定第 2 段 · 三条判据名 · `Why:` 四形态）· 需求档 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §9 F30 判定句 ② · 用例 = 本节 T-AF15 行 |

**判据名闭合（三值——设计档 / 批档 / 用例同词）**：`type-missing` · `type-invalid` · `type-object-conflict`（`type-mismatch` 仍退场——全仓零命中）。落点 = 设计档 §2.4 判定枚举 · §2.5 `criterion` 集与 `type` 值域 · §10 A-AG13 / A-AG14；批档 = 本节 T-AF15 行 + 三条 AC 行；用例 = `advisor-type-required.test.mjs`（**拟新增**——实现轮落笔，形见 §2.7 该行收正版）。

**用例收正（权威版本）**

| # | 用例 | 类 | 输入 | 期望 |
|---|---|---|---|---|
| T-AF15（**收正**——旧「照常走 code 轨（`object` 不选轨）」作废） | 冲突对（顶层显式 `code` ≠ `object.type="design"`） | 错误 | `advisorTool.execute({type:"code", paths:[…], object:{type:"design"}}, {depth:0,_toolCallId})` | **拒发**：`out` 首行以 `Advisor: launch refused` 起 ∧ 标识行含 `criterion=type-object-conflict` ∧ `Why` 行含指引两路（改顶层 `type` / 改 `object.type` 声明）∧ `_advisorRefusals.has(id)` ∧ 零池条目 / 零 token / 零 LLM |

**先红形态（补 §2.7 先红段）**：T-AF15 现状代码读得**照常受理**——`thincoder-core/agent-tools/advisor.mjs:98` 旧缺省取值后即按 code 轨发起（无拒发串、`_advisorRefusals` 零登记；全仓 `object.type` 消费面仅 `thincoder-core/advisor/messages.mjs:34` 注入行）⇒ 先红；收正后须转绿。

**AC 收正（权威版本）**

| # | 标准（命令 / 断言级） | 回指 |
|---|---|---|
| AC-2（**收正**——末句照常条件收窄） | F30 类型门（先红后绿）：`advisorTool.execute({documents:[…]}, {depth:0,_toolCallId})`（**无 `type`**）⇒ 返回串首行以 `Advisor: launch refused` 开头 ∧ 含 `type="code"` 与 `type="design"` 两行（各带用途）∧ 标识行含 `criterion=type-missing` ∧ `_advisorRefusals.has(id)` ∧ 零池条目 ∧ `_engDesignTokens` 零写入；显式 `type:"code"` / `"design"` ∧ `object` 未声明 / `object.type` 一致 ⇒ 照常受理（拒绝串零命中） | F30 |
| AC-9（**收正**——补冲突形） | F30 形态枚举闭合：`null` / `""` / `"  "` / `"Code"` / `"design "` / `"foo"` / `1` / `true` / `{}` / `[]` ⇒ **全部拒**（缺失 / `null` / 空串 / 纯空白 ⇒ `type-missing`；其余 ⇒ `type-invalid`）；`"code"` / `"design"` ⇒ 受理；`object.type="design"` ∧ 顶层缺/非法 ⇒ 同拒 + 正文追加对象声明句；**`object.type="design"` ∧ 顶层显式 `"code"` ⇒ 拒 + `criterion=type-object-conflict`** | F30 判定句 ② |
| AC-10（**收正**——补声明一致零残留） | 调用面零残留（机判）：① 结构断言——`thincoder-core/agent-tools/advisor.mjs` 源内 `args.type \|\| "code"` 零命中 ∧ 声明面 type `(default)` 句零命中；② 三树 `advisorTool.execute(`（12 处）/ `runAdvisorReview(` / `prepareAdvisorMessages(` 调用点逐处显式；③ **声明一致零残留**——三树 `*.mjs` 调用点 `object` 声明零命中（静态面实测 0：`object` 仅见于工具 schema 与描述；夹具 `object: null` = 池条目字段）；④ 口径命令（复审可重跑）见 §2.8 | F30 判定句 ③ |

**受影响面表收正（权威版本——三行）**

| 文件 | 现行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `thincoder-cli/test/advisor-type-required.test.mjs`（拟新增 · **收正**） | 0 | +~110 | F30 全形态（缺 / `null` / 空串 / 非法 / 非字符串 ⇒ 拒；显式 `code` / `design` 且声明一致 / 未声明 ⇒ 受理；顶层缺·非法 ∧ `object.type="design"` ⇒ 同拒；**冲突对 ⇒ 拒 + `type-object-conflict`**）+ 盘点零残留结构断言 |
| `thincoder-core/advisor/notice.mjs`（拟新增 · **收正**） | 0 | +~130 | 失败结论 / 拒回文案 + 对象标识行单源；**类型门拒发串构建 = `Why` 四形态**（判据名三值 + 两路指引 + 两个合法值行 + 标识行） |
| `thincoder-core/agent-tools/advisor.mjs`（**收正**） | 280 | -23 / +9（≈266） | ① `:98` 旧缺省 → 类型门（最早判定；**三分支**——冲突判定读归一后的 `reviewObject`（`:104-106`））；②③④⑤ 承 §2.7 原行零改 |

**§2.8 计数行对照**：需改动项合计仍 **4**（A1 判定面含冲突分支 + A2 三处声明面）；提示词面改动项 = 0；类型门登记面 = 设计档 §11 三项（皆非发起点）。

**机检读数（as-of 2026-09-18 16:4x）**：`node scripts/doc-check.mjs`——候选 14844 → **14849**（+5 = 本档新增可解析锚）；悬空 5 → **5** · 注记豁免 43 → 43 · 迁移期引文 221 → 221（前后同值）；拟新增 14 → **17**（+3 = 本节三行「（拟新增」标记——**列报 · 不入闸**，非闸态新增）；行宽超限 6 行 → **6 行**（零新增——设计档本轮两处超限已当场拆行；`ADVISOR-GUARDS.md` 最宽行 298 字符、>300 行 0 条）；两档（`docs/core/design/ADVISOR-GUARDS.md` · 本档）**零行命中**（未入列报、未入闸）。本档行数 337 → 待本行落定读数。

**待父侧确认（1 项 · 非阻断）**：需求档 §9 F30 判定句 ② 括注「（若声明）」的字面射程 = 任意声明值；本设计取**窄读法**——冲突分支仅在 `object.type ∈ {code,design}`（与顶层不一致）时触发，`object.type` 为**非法值**（`"foo"` / 数字 / 非字符串）时**不触发**（无合法轨可矛盾——照常受理，`object` 非选轨面）。若父侧取宽读法（非法声明值亦须拒）⇒ 请收窄需求档 §9 措辞 + 设计档 §2.4 判定枚举 / 边界相应各一句（判据名不变）。

**读数收正（更正上节末行两处——拟新增读数 + 行数占位；以本行为准）**：

1. **拟新增读数更正**：上节「拟新增 14 → **17**（+3 = 本节三行「（拟新增」标记）」**有误**——批档**不在机检扫描域**（`checkConfig.anchors.exclude` 含 `batches`——`docs/batches/**` 属一次性材料面）⇒ 本节新增**零机检计入**；实测 拟新增 **14 → 14**（前后同值）。
2. **扫描域归属更正**：本轮写域两档中**仅设计档在扫描域内**——`docs/core/design/ADVISOR-GUARDS.md` = **零行命中**（未入列报、未入闸）；本档（2026-09-18-advisor-face.md）**不在扫描域**（exclude）——其「零命中」为域外事实，非判据成绩，如实注。
3. **行数占位结清**：上节末行「本档行数 337 → 待本行落定读数」的占位 = **337 → 380**（本节 +43 行）；设计档 **383 → 392**（+9 行）。
4. **落定机检读数（as-of 2026-09-18 16:5x）**：`node scripts/doc-check.mjs` ⇒ 候选 14844 → **14849**（+5，全为设计档新增锚且**全部可解析**）· 悬空 **5 → 5** · 注记豁免 43 → 43 · 拟新增 14 → 14 · 迁移期引文 221 → 221 · 行宽超限 **6 行 → 6 行**（零新增；设计档 >300 行 0 条、最宽 298 字符）· 用例号候选 437 · 用例号悬空 0。
   ⇒ **按档归属：设计档零新增（锚 / 行宽两判据）；批档域外**。

### 2.10 修正轮（评审 id=84 · 12 条发现）——逐条收正

**来源与效力**：设计评审 id=84 首轮 12 条（🔴2 / 🟡5 / 🔵5，原表见 §3 轮次 1）；父侧逐条裁定接受 ⇒ 本席（eng-designer）按**发现号 1..12** 收正。**笔域** = 两档设计档（`docs/core/design/ADVISOR-GUARDS.md` · `ADVISOR-CONVERGENCE.md`）+ 本档 §2；**非笔域** = 提示词正文（只出逐字建议——父侧落笔）· 需求档（只登记——父侧笔）· 实现面代码。本节为 §2.6 / §2.7 / §2.9 的**收正与接续**：凡与其冲突的旧读数 / 旧锚，以本节为准。

**逐条落位表（发现号 → 改了什么 → file:line〔写后读回〕）**

| # | 级 | 改了什么 | file:line |
|---|---|---|---|
| 1 | 🔴 | 撤计数扫尾：设计档 §3.1 增「纪律面扫尾」+ 逐字改法 · §3.3 落位清单写全 · §3.5 增行 3 + 运行期孪生行补登记 · **新增 §3.7** 同口径盘点（口径命令 ×2 + 提示词 6 行 + 需求面 3 行 + 假阳 3 行） | `ADVISOR-CONVERGENCE.md:69-71`（扫尾 + 逐字）· `:83-86`（落位）· `:100` / `:106` / `:111-113`（§3.5）· `:117-147`（§3.7） |
| 2 | 🔴 | 受影响表补端测试行 + 改名行消费方导入面列全（含本轮实核**新增**的注释面 6 处）+ 结构断言 | 本节「受影响表收正」 |
| 3 | 🟡 | 失败结论块轨适用 = **两轨共用**：模板 `type` → `{type}` · 契约一/二「轨适用」句 · 判据名表增「轨」列（`no_credential` = 设计专属）· §6 零改边界措辞 · §2.5 字段对齐 | `ADVISOR-GUARDS.md:249` · `:253` · `:256` · `:262` · `:273-282` · `:226` · `:102` |
| 4 | 🟡 | `thincoder-cli/test/advisor-chain-guards.test.mjs`（488 行）补**拆分规划 + ±0 判据句** | 本节「拆分规划（收正版）」 |
| 5 | 🟡 | §2.4 边界句写明**窄读法** + 关闭 §2.9「待父侧确认」行 | `ADVISOR-GUARDS.md:93` · 本节「待确认行关闭」 |
| 6 | 🟡 | 设计档 cap 残留三处收正 | `ADVISOR-CONVERGENCE.md:9` · `:45` · `:290` |
| 7 | 🟡 | §3.3 落位副本面写全（运行期 + 中文正本；普通模式同族句节位——双源同文） | `ADVISOR-CONVERGENCE.md:85-86` |
| 8 | 🔵 | 结论块 `round` 语义 = 本次已结算尝试号（与尝试表 `#` 同值）+ 断言 | `ADVISOR-GUARDS.md:266` · 字段行 `:104` |
| 9 | 🔵 | 批档数值漂移收正 + 落位锚改**节号锚** | 本节「数值漂移与锚收正」 |
| 10 | 🔵 | §10 A-AG 编号按号重排（10/11/12/13/14/15 单调） | `ADVISOR-GUARDS.md:351-356` |
| 11 | 🔵 | `thincoder-vscode/test/files.mjs` 行数补全——**读数按实测收正**（82，非 83） | 本节「读数收正」 |
| 12 | 🔵 | 两档需求层指针统一现状绝对路径 + 删过时注 | `ADVISOR-GUARDS.md:5` · `ADVISOR-CONVERGENCE.md:5` |

**受影响表收正（承 §2.2 / §2.7 / §2.9——本表为权威版本）**

| 文件 | 现行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `thincoder-vscode/test/config-pool.test.mjs`（**新增行** · 发现 2） | **204**（评审给 205 = 行使数差一，见下「读数收正」） | ±0 | 改名消费方：`:31` 导入路径 `review-streak.mjs` → `review-facts.mjs`（`docSetKey`）；`:114` 使用点零改 |
| `thincoder-core/agent-tools/review-streak.mjs` → `review-facts.mjs`（**收正行** · 发现 2） | 93 | -45（≈48） | **消费方导入面列全（6 处）**——`thincoder-core/advisor/run.mjs:15-17`（`MAX_DESIGN_REVIEW_STREAK` / `docSetKey` / 两个护栏函数——护栏项随撤除退场）· `thincoder-core/agent-tools/advisor.mjs:24-26`（四名——护栏面全退场）· `thincoder-core/agent-tools/advisor-async.mjs:56`（`docSetKey`）· `thincoder-core/agent-tools/advisor-settle.mjs:28`（`normAbs` / `designReviewOutcome` / `noteDesignReviewOutcome`）+ `:53` re-export · `thincoder-cli/test/design-review-streak-guard.test.mjs:14-18`（随档改名 + 全量重写）· `thincoder-vscode/test/config-pool.test.mjs:31`（**漏项已补**）。**注释面 6 处同改**（旧路径零命中判据含注释面）：`advisor/run.mjs:14` / `:40` · `agent/write-gate.mjs:27-29` · `advisor-async.mjs:54` · `advisor-settle.mjs:17` / `:26` / `:51` · 自档头注 `review-streak.mjs:2`。**结构断言**：三树 `*.mjs` 内 `review-streak.mjs` 字面**零命中**（含注释面；`_archive` 除外域） |
| `thincoder-vscode/test/files.mjs`（**收正行** · 发现 11） | **82**（实测） | +1（→ **83**） | 端侧显式测试登记表；新增用例 `advisor-guard-rounds.test.mjs` 登记入册 |
| `thincoder-cli/test/advisor-chain-guards.test.mjs`（**收正行** · 发现 4） | 488 | ±0（不增行） | 拆分规划见下（发现 4 判据句）；断言面若随结论块微调只动一条 |
| `docs/core/design/ADVISOR-GUARDS.md`（**收正行**） | 392 → **402**（本轮实测） | +10 | §2.4 窄读法 · §2.5 两字段行 · §6 措辞 · §7 轨适用 + `round` 语义 + 判据名表「轨」列 · §10 重排 · 变更记录（逐条落位表见上） |
| `docs/core/design/ADVISOR-CONVERGENCE.md`（**收正行**） | 293 → **340**（本轮实测） | +47 | §3.1 扫尾 · §3.3 落位 · §3.5 行 3 + 补登记 · **§3.7 新节** · 三处 cap 残留 · 变更记录 |

**拆分规划（收正版——补发现 4 行）**

`thincoder-cli/test/advisor-chain-guards.test.mjs`（488 行：>300 主动审视档 · <500 硬顶）：本轮 **±0 净增 ⇒ 零拆分义务（判据句）**；后续任何新增（结论块断言扩面 / 新 kind）⇒ **先按组拆**——E 组冻结窗口（T-CG15–T-CG18，≈91 行）→ `advisor-freeze-window.test.mjs`；B 组凭证链（T-CG6–T-CG8，≈82 行）→ `advisor-credential-chain.test.mjs`（两组各自 <300；组内自持夹具、切点零交叉）。其余三档拆分行（`advisor-async.mjs` / 端 `agent.mjs` / `run-stages.mjs`）承 §2.2 / §2.7 原规划**零改**。

**AC 收正（新增 1 条——承 §2.7 / §2.9 权威版本）**

| # | 标准（命令 / 断言级） | 回指 |
|---|---|---|
| AC-11（**新增** · 发现 3/8） | 结论块**两轨共用**：代码轨失败结算（桩 entry `reviewType="code"` + `timeout` 尾）⇒ 结论块在位，块首行 `type=code` · `criterion=timeout` · 块首 `round=N` ∧ 尝试表 `#=N`（同值）；设计轨同式（`type=design`）；`no_credential` 只可出自设计轨（代码轨不可达） | F28 / F29 / F31 |

**用例收正（权威版本——序号顺延）**

| # | 用例 | 类 | 输入 | 期望 |
|---|---|---|---|---|
| T-AF16（**新增** · 发现 3/8） | 代码轨失败结论块 + `round` 语义 | 正常 | `settleAdvisorRun`（桩 entry：`reviewType="code"`、`round=3`、报告携 `timeout` 尾、无 token） | 结论块在位：块首 `[type=code · scope=… · round=3/uncapped · criterion=timeout]` ∧ 尝试表 `#=3`（与块首同值）∧ 选项三值在位 ∧ 零凭证值；设计轨对照行（同尾）⇒ `type=design` |

**待确认行关闭（发现 5——§2.9 末「待父侧确认（1 项 · 非阻断）」行）**

父侧已裁定并同轮收正需求档 ⇒ **该行关闭**：取**窄读法**（冲突域 = 两个合法轨值之间；`object.type` 为非合法值 ⇒ 不构成矛盾、照常受理）。设计面落 = `ADVISOR-GUARDS.md:93`（§2.4 边界句）；§2.4 判定枚举 `:90`（「另一合法值」限定）与需求档 §9 F30 判定句 ② 同射程——**无并存读法**。

**数值漂移与锚收正（发现 9）**

- **旧读数作废**：§2.7 的 `ADVISOR-GUARDS.md`「355 → **382**（+27，本轮已落）」= **作废**（§2.9 已收正为 383 → 392）；本轮收正后实测 **392 → 402**。§2.9 的「383 → 392」为**历史读数**（其时刻正确），现值 = 402。
- **落位锚改节号锚**：§2.6 落位表的行号锚 → **节号锚**——「结论块模板」= `ADVISOR-GUARDS.md` **§7 契约二**（行号 as-of 本轮 = `:256`）；「变更记录首条」= `ADVISOR-GUARDS.md` **变更记录 · 首条**（行号 as-of 本轮 = `:383`）。行号只作 as-of 注，不作锚。

**读数收正（发现 11 + 发现 2——口径 = `wc -l`）**

- 抽查 16 档：**14 档逐值同口径**（`advisor.mjs` 280 · `run.mjs` 293 · `review-streak.mjs` 93 · `advisor-settle.mjs` 231 · `advisor-async.mjs` 477 · core `advisor.mjs` 278 · `completion.mjs` 146 · `record-results.mjs` 174 · 端 `run-stages.mjs` 380 · 端 `execute-tools.mjs` 393 · `tool-args.mjs` 84 · `advisor-chain-guards.test.mjs` 488 · `design-review-streak-guard.test.mjs` 266 · 端 `agent.mjs` 486）；**2 档差一**——`thincoder-vscode/test/files.mjs` 实 **82**（评审记 83）· `thincoder-vscode/test/config-pool.test.mjs` 实 **204**（评审记 205）。
- ⇒ 本档取值：**`files.mjs` = 82 → 83（+1）**（发现 11 的「83 → 84」按实测收正）；**`config-pool.test.mjs` = 204 → 204（±0）**（发现 2 的「205 → 205」按实测收正）。评审两处 +1 同源 = 行使数差一（尾换行计一行）。

**提示词面 / 需求面登记（发现 1——父侧落笔，本席只出清单与逐字）**

- 设计面登记表（口径命令可重跑）= `ADVISOR-CONVERGENCE.md` **§3.7**（`:117-147`）：提示词面 **6 行**（P1–P4 = 四活行，逐字改法见 §3.1 `:69-71`；P5 = §3.5 行 1/2 的双语孪生行；P6 = eng-coder 自修轮上限双语行）；需求面 **3 行**（`NORMAL-MODE.md:68` · `ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md:13` · `ENGINEERING-MODE-V2.md:373`，同族 `:642`）；假阳 **3 行**（档位判据 `≤500` × 2 · `consultModels` 池 ≤5）。
- **与 §2.8 的关系（防误读）**：§2.8 的「提示词面零残留 ⇒ 零文本改动」结论**射程 = F30 类型门的 advisor 调用形**；本轮**轮次计数面**是另一口径（§3.7 命令 1/2）——两面各自独立，不互相推翻。

**计数同步（D3——计数与列表同改）**：受影响表新增行 = **1**（`config-pool.test.mjs`）；拆分规划新增 = **1 行**（`advisor-chain-guards.test.mjs`）；AC 新增 = **1**（AC-11）；用例新增 = **1**（T-AF16）；设计档枚举计数同改（§3.5：两处 → **三处**；§3.7：提示词 6 / 需求 3 / 假阳 3）。

**机检读数（`node scripts/doc-check.mjs`——as-of 本轮；口径 = 按档归属）**

- **收正前基线**：候选 14849 · 悬空 5 · 注记豁免 43 · 拟新增 14 · 迁移期引文 221 · 用例号候选 437 · 行宽超限 **6 行**。
- **收正后实测**：候选 **14885**（+36 = 两档新增可解析锚）· 悬空 **5 → 5**（零新增）· 注记豁免 43 → 43 · 拟新增 14 → 14 · 迁移期引文 221 → 221 · 用例号候选 437 → **438** · 行宽超限 **6 行 → 6 行**（**零新增**；6 行全在域外档：`CONTEXT-COMPACTION.md` ×2 · `requirements/ADVISOR-CONVERGENCE.md` ×2 · `prompts/persona-engineering.md` ×2）。
- **自纠记录（如实）**：本轮初稿曾新增 2 行超限（`ADVISOR-CONVERGENCE.md:69` 315 字符 / `:110` 343 字符）——当场拆行收正（`:69-71` / `:111-113`），复跑后回到基线 6 行。
- ⇒ **按档归属：两档设计档零新增**（锚：悬空 5 → 5 且两档零命中；行宽：非表行 >300 命中 **0**——两档逐行核过）。

**上抛（本轮新增 · 待父侧裁——语义面，本席不代裁）**

| # | 事项 | 性质 | 本设计取法 / 请裁 |
|---|---|---|---|
| 10 | **发现 3 取法的子项校正**：「`stale` / `no_credential` 等设计专属判据」中的 `stale` 与实核不符——`reviewIsStale`（`thincoder-core/agent-tools/advisor-settle.mjs:57-72`）有 code 分支（`:68-71`），**代码轨可达 `stale`**。故表内按实核标注：`no_credential` = **设计专属**（凭证面）；`stale` = **两轨**（设计另附「token 未签发」正文） | 设计面（已按实核落，报备） | 若须严格「`stale` 设计专属」⇒ 请裁并同步收窄 `advisor-settle.mjs` 的 stale 判定射程（超出本批 12 条范围，另批） |

**读数校正（§2.10 落位表行号——本轮初稿两处超限行当场拆行（+3 行）晚于落位表写定 ⇒ 以下为**收正后实测**，以本行为准）**

- 行 1：§3.1 扫尾 `:69-71`（同）· §3.3 落位 **`:84-87`**（原记 `:83-86`）· §3.5 行 3 **`:107`**（原记 `:106`）· 补登记 `:111-113`（同）· §3.7 **`:119-149`**（原记 `:117-147`）。
- 行 6：§12 探针 **`:293`**（原记 `:290`）。
- 行 7：§3.3 落位 **`:84-87`**（原记 `:85-86`）；「提示词面 / 需求面登记」段的 §3.7 行号同前（`:119-149`）。
- 其余行（`ADVISOR-GUARDS.md` 全部引用 `:5` / `:93` / `:102` / `:104` / `:226` / `:249` / `:253` / `:256` / `:262` / `:266` / `:273-282` / `:351-356`；`ADVISOR-CONVERGENCE.md:5` / `:9` / `:45`）**逐处读回一致，零漂**。
- 本档行数：415（§2.10 落笔前）→ **497**（含 §2.10 两段 + 本节；§3 评审段 415 起为既有）。

### 2.11 实现后收正（修正轮 id=99——三项闭合 · 实测回填）

**来源与效力**：实现轮 id=91 终态 clean 后，父侧转来设计档面三项（行数读数按实测回填 / 撤「（拟新增）」标记 / 同族到期措辞核对）。本节 = **§2.2 / §2.7 / §2.10 三表行数读数的权威收正版**（旧表数值不再作读数依据——行数一律以本节实测值为准，标 as-of）；其余行零改、继续有效。

**口径**：文件行数 = 该档实际行数（尾换行计一行；与 §5.1「实测终值」同口径——本节 25 档实测尾换行均在，`wc -l` 与显示行数逐值相等）。测量时刻 = 2026-09-18 18:0x；两档设计档为**本轮收正后**读数。

**A. 实测行数回填表（承 §2.2 / §2.7 / §2.10——逐行权威版本）**

| 文件 | 批档原记（预计 / 旧记） | **实测（as-of 2026-09-18 18:0x）** |
|---|---|---|
| `thincoder-core/advisor/notice.mjs`（新） | 0 → +~110 / +~130 | **141** |
| `thincoder-core/agent-tools/advisor.mjs` | 280 → ≈266 | **280**（±0） |
| `thincoder-core/advisor/run.mjs` | 293 → ≈248 | **190** |
| `thincoder-core/agent-tools/review-facts.mjs`（改名自 `review-streak.mjs`） | 93 → ≈48 | **31** |
| `thincoder-core/agent-tools/advisor-settle.mjs` | 231 → ≈231 | **240** |
| `thincoder-core/agent-tools/advisor-async.mjs` | 477 → ≈475 | **481** |
| `thincoder-core/advisor.mjs` | 278 → ±0 | **281** |
| `thincoder-core/advisor/messages.mjs`（越界项） | — | **299** |
| `thincoder-core/agent/completion.mjs` | 146 → ≈144 | **145** |
| `thincoder-core/agent/record-results.mjs` | 174 → ±0 | **174** |
| `thincoder-core/agent/write-gate.mjs`（越界项） | — | **87** |
| `thincoder-vscode/src/agent/run-stages.mjs` | 380 → ≈376 / ≈378 | **377** |
| `thincoder-vscode/src/agent.mjs` | 486 → ≈483 | **485** |
| `thincoder-cli/test/advisor-type-required.test.mjs`（新） | 0 → +~110 | **182** |
| `thincoder-cli/test/advisor-round-uncapped.test.mjs`（新） | 0 → +~110 | **169** |
| `thincoder-cli/test/advisor-failure-notice.test.mjs`（新 · 承旧档改名 + 全量重写） | 0 → +~170 | **220** |
| `thincoder-cli/test/design-review-streak-guard.test.mjs` | 266 → 删除 | **0**（整档删除） |
| `thincoder-cli/test/advisor-sync-accounting.test.mjs`（越界项） | — | **111** |
| `thincoder-cli/test/advisor-chain-guards.test.mjs` | 488 → ±0 | **488** |
| `thincoder-vscode/test/advisor-guard-rounds.test.mjs`（新） | 0 → +~60 | **34** |
| `thincoder-vscode/test/files.mjs` | 82 → +1 = 83 | **83** |
| `thincoder-vscode/test/config-pool.test.mjs` | 204 → ±0 | **204** |
| `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs`（越界项） | — | **109** |
| `docs/core/design/ADVISOR-GUARDS.md`（**两档之一**） | 392 → 402（§2.10 记） | **405**（本轮收正后） |
| `docs/core/design/ADVISOR-CONVERGENCE.md`（**两档之一**） | 293 → 340（§2.10 记） | **344**（本轮收正后） |

**两档同口径核过（验收 ②）**：上两行 = 本轮收正后实测；收正前实测 **402 / 340** 与 §2.10 记录值**逐值一致（无漂）**。**注（①的落点如实说明）**：两档设计档**不承载受影响文件表**——`ADVISOR-CONVERGENCE.md` §3.6（D2 单一权威源）明文「本批的受影响文件表 / 用例表 / 验收标准 / 上抛 = 一次性材料，落批档 §2」⇒ ① 的落点 = 本节表（+ §2.2 / §2.7 / §2.10 旧表，旧值以本节为准）；设计档面 = 档自身行数（405 / 344）与批档同值核过。

**B. 撤「（拟新增）」标记（四处 · 逐处实读定位 · 实现已落）**

| # | file:line（收正前） | 收正前现文 | 处置 |
|---|---|---|---|
| 1 | `docs/core/design/ADVISOR-CONVERGENCE.md:11`（首部实现载体表） | `notice.mjs`（失败结论 / 拒回文案 + 对象标识行单源）**（拟新增）** | **撤**（现文 = 同句无标记） |
| 2 | 同档 `:78`（§3.2 失败有结论） | 单源构建 = `notice.mjs`**（拟新增）** | **撤** |
| 3 | 同档 `:97`（§3.4 载体收窄） | 落 `notice.mjs`**（拟新增）** | **撤** |
| 4 | 同档 `:336`（变更记录 · 用户裁定条） | 首部实现载体表增 `notice.mjs`**（拟新增）** | **撤** → 改「（本批新增）」 |
| — | `docs/core/design/ADVISOR-GUARDS.md` | 实读**零命中** | — |

**撤后读数**：两档内「（拟新增」字面 **0 命中**（临时核；变更记录行以「拟新增标记」叙述形态保留史实——不含该字面）。

**C. 同族到期措辞核对（逐条判定：已实现 ⇒ 撤；未实现 ⇒ 保留 + 标轮次）**

| # | 位点（收正前） | 判定 | 处置（收正后） |
|---|---|---|---|
| 1 | `ADVISOR-CONVERGENCE.md:69`（§3.1 纪律面扫尾「四处活提示词**仍载**『最多 5 轮』」） | **已实现**（父侧 2026-09-18 落笔） | **撤**——改「曾载」+「已由父侧落笔收正」+ 落位指针 |
| 2 | 同档 `:71`（逐字改法行） | 已实现（现文逐字同此） | 标「**已落笔**（2026-09-18）」 |
| 3 | 同档 `:84`（§3.3 父侧纪律「落笔 = 父侧在实现轮同轮」） | **已实现** | 标「**已落笔**」+ 落位读数：运行期 `thincoder-core/prompts/discipline-engineering.md:42` · 中文正本 `docs/core/design/prompts/discipline-engineering.md:42`（双源同文，实读逐字在位） |
| 4 | 同档 `:133-136`（§3.7 P1–P4 处置列「改 §3.1 逐字句（父侧落笔）」） | **已实现** | 改「**已落**」；现文读数：`thincoder-core/prompts/discipline-normal.md:126` · `persona-engineering.md:88` / `docs/core/design/prompts/discipline-normal.md:125` · `persona-engineering.md:86` = `No round cap — repeated mechanical failure (same criterion) ⇒ stop and report.` / 「无轮次上限——反复机械失败（同因）⇒ 停下上报。」 |
| 5 | 同档 `:137-138`（§3.7 P5/P6） | **未实现** | 保留 + 标「**同族 · 未落**」（P5 = 待用户裁 · P6 = 非本批射程） |
| 6 | 同档 `:140`（§3.7 ② 需求面 R1–R3） | **未实现**（实读：`requirements/NORMAL-MODE.md:68` 现文「≤5 轮收敛」· `…SPEC-REVIEW-CREDENTIAL.md:13` 现文含「机械 cap」· `ENGINEERING-MODE-V2.md:373` 现文「自修（≤5 轮）」） | 保留 + 标「截至 2026-09-18：三行**未落**」（需求档笔在父侧） |
| 7 | 同档 `:150`（§3.7 ④ 设计面「随本轮收正」） | 已实现 | 改「**已随本轮收正**」 |
| 8 | 同档 `:101`（§3.5 同族对照三行） | 未实现（本批只出表） | 保留 + **增「到期核对」行**：三行均未动手——行 1 / 行 2 = 待用户裁（预计另批）· 行 3 = 非本批射程 |
| 9 | `ADVISOR-GUARDS.md:68`（§2.4「先于范围判定 / 实例解析 / **cap 与停止预检**」） | cap / 停止预检**已实现撤除** ⇒ 在场表述到期 | **撤**——改「先于范围判定 / 实例解析；cap / 停止预检已随撤除退场」 |
| 10 | `ADVISOR-GUARDS.md` §2.5「cap 文案」条 / §7「检查点撤除说明」 / §6「无 cap」 | 均为**退场陈述**（非在场表述） | 保留（形态已合规） |

**D. 实现后坐标回填（本批改动的后果面——同轮核过收正）**

| # | 位点 | 旧锚 | 新锚 | 依据（实读） |
|---|---|---|---|---|
| 1 | `ADVISOR-GUARDS.md:21`（§1 `review_failed` 生成点） | `run.mjs:233` | **`:185`**（原值超档长——run.mjs 实测 190 行） | `run.mjs:185` = `` return `Advisor: review failed (${errorType}) …` ``（catch 内字符串 resolve） |
| 2 | 同档 `:68`（§2.4 判定点） | `advisor.mjs:98` | **`:110`** | `advisor.mjs:110` = `const gateCriterion = typeGateCriterion(args.type, reviewObject?.type)`（判定块 `:106-117`） |
| 3 | 同档 `:71`（§2.4 启动拒绝前缀锚） | `run.mjs:33` | **`:23`** | `run.mjs:23` = `export const ADVISOR_LAUNCH_REFUSAL_PREFIX = "Advisor: design review launch refused"` |
| 4 | 同档 `:72`（§2.4 前缀消费面两锚） | `advisor.mjs:247` · `advisor-settle.mjs:144` | **`:250`** · **`:147`** | `advisor.mjs:250` / `advisor-settle.mjs:147` = 两处 `.startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)` |
| 5 | 同档 `:266`（§7 `run.round++` 锚） | `advisor-settle.mjs:133` | **`:136`** | 同档 `:136` = `run.round++` |
| 6 | 同档 `:16`/`:17`/`:19`/`:20`（§1 判定族生成点 ×4） | `loop.mjs` `:124` / `:113` / `:187` / `:92`（另 `:176`） | **`:132`** / **`:121`** / **`:195`** / **`:100`**（另 **`:184`**） | loop.mjs 实读（该档本批**零改**——漂移系前批累积 · 同轮核过） |

**未改（核过在位）**：`advisor.mjs:66`（`object` schema）· 同档 `:47`（描述行）· `advisor.mjs:69`（`object.type` 字段）· `messages.mjs:34`（对象声明注入）· `execute-tools.mjs:363` · `tool-args.mjs:51`。§1 表头改标 as-of（「生成点（交付态 · 实测 as-of 2026-09-18）」）。

**E. 机检读数（`node scripts/doc-check.mjs`——口径 = 按档归属）**

- **收正前基线**：候选 **15183** · 悬空 **8** · 注记豁免 43 · 拟新增 4 · 迁移期引文 222 · 用例号 439 / 悬空 0 · 行宽超限 **6 行**（全在域外档：`design/CONTEXT-COMPACTION.md:303` · `prompts/persona-engineering.md:137/:139` · `requirements/ADVISOR-CONVERGENCE.md:129/:224` · `requirements/CONTEXT-COMPACTION.md:27`）。
- **收正后实测**：候选 **15187**（+4 = 两档新增可解析锚）· 悬空 **8 → 8**（**零新增**）· 注记豁免 43 → 43 · 拟新增 **4 → 4** · 迁移期引文 222 → 222 · 用例号 439 / 0 · 行宽超限 **6 行 → 6 行**（**零新增**——两档 >300 行 **0 条**，非表行判据下逐行核过；表行结构性豁免）。
- ⇒ **按档归属：两档零新增**（锚：两档零新悬空；行宽：两档零新超限）。两档在册细项仅 `ADVISOR-CONVERGENCE.md:95`（`review-streak.mjs` + 「迁移期引文」= **列报 · 不入闸**——改名史实，形态合规，保留）。

**F. 跨档引用文本落位核过（父侧笔 · 读数）**

- `docs/core/design/CONFIG.md:113` —— 现文含「评审轮次**无机械上限**（cap 已撤——见 `ADVISOR-CONVERGENCE.md` §3 · 2026-09-18 用户裁定）」⇒ **已落**。
- `docs/core/design/ENGINEERING-MODE-V2.md:331` —— 现文「轮次衰减 / 会话隔离 / 失败护栏（六 kind 不签发） / 失败结论。」⇒ **已落**。
- `docs/core/design/AGENT-LOOP-SUBAGENT.md:197` —— 现文「③ `_advisorRound` 改按 review 实例记（轮次仅作提示词衰减与显示——**无机械上限**）」⇒ **已落**。

**报备（可 revert）**：D 表第 6 行 4 处 `loop.mjs` 锚 = **前批漂移**（该档本批零改），本轮按同判据核过一并收正——若父侧取「只收本批后果面」口径 ⇒ 该 4 处可单点回退（其余 5 处为本批后果面，不回退）。

**本节读数（as-of 2026-09-18 18:0x）**：两档设计档终值 **405 / 344** 行；本档（批档）行数 = 本节落定后实测（见 §6 收口行）。

**补（§2.11 落定后 · 收口读数 as-of 2026-09-18 18:1x）**：

- `docs/batches/2026-09-18-advisor-face.md` = **736 行**（`wc -l` 口径；落笔前 642 行 = 本节 +94；读取工具渲染 737 = 尾换行形态差一，同 §2.10「行使数差一」注）。
- 两档设计档 **405 / 344**（承 §2.11 A 表尾两行，读数不变）；三档同口径（尾换行计一行）。
- §2.11 三表（A 行数 / C 到期核对 / D 坐标回填）落位：`docs/batches/2026-09-18-advisor-face.md:472-565`（本节自 472 起，§3 前）。

**补（读数 as-of 边界 · 18:2x 复跑所见）**：§2.11 E 段读数 = 本笔落定时（18:0x）实测，**未被本笔之后任何改动触碰两档**。复跑见全仓总数漂移（候选 15187 → **15238** · 悬空 8 → **9** · 行宽 6 → **7** · 用例号 439 → **440**）——逐条核过，全部落在**域外档** `docs/vsc/requirements/WEBVIEW.md`（新悬空 `:36 history-window.mjs:130` · 新超限行 `:49`（309 字符）），系**他批在写**（`docs/batches/2026-09-18-vsc-settings-wiring.md` 批面）所致，**非本笔**；两档设计档（`ADVISOR-CONVERGENCE.md` / `ADVISOR-GUARDS.md`）**零新增不变**（零新悬空 · 零新超限；唯一在册细项仍是 `:95` 的列报·不入闸项）。

## §3 设计评审

### 轮次 1（评审子代理）

**设计评审（首轮）· 发现表**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage | 🔴 | 撤计数扫尾不完整：四处**活**提示词仍载轮次上限——`thincoder-core/prompts/discipline-normal.md:126`「Max 5 rounds total.」· `thincoder-core/prompts/persona-engineering.md:88` 同句 · `docs/core/design/prompts/discipline-normal.md:125`「总共最多 5 轮。」· `docs/core/design/prompts/persona-engineering.md:86` 同句——未入设计档 §3.1 撤除面（`ADVISOR-CONVERGENCE.md:68`）/ §3.5 同族对照 / 批档 §2.2 受影响表 / §2.8 盘点（口径命令 3 只扫 advisor 调用形）。与 `ADVISOR-CONVERGENCE.md:68`（不设会话级计数载体、不按计数拒发）· `:41`（第 6 次及以后照常受理）· `:258` A-AC2 直接矛盾：机制撤 cap，纪律面仍命令「最多 5 轮」。同类未登记：`docs/core/requirements/NORMAL-MODE.md:68`（「≤5 轮收敛」）· `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md:13`（枚举含「机械 cap」） | 补一次同口径盘点（双源 × 两档：运行期 + 中文正本；含需求面），命中行逐条落「受影响表 / 登记表」并给逐字改法（例：「第 3 轮起严格只验前表；无轮次上限——反复失败 ⇒ 停下上报」），或明示保留并写明理由；盘点口径命令入批档（可重跑） |
| 2 | Affected files | 🔴 | 受影响文件表漏项（模块改名的跨树消费方）：`thincoder-core/agent-tools/review-streak.mjs` → `review-facts.mjs` 改名，但 `thincoder-vscode/test/config-pool.test.mjs`（205 行）`:31` 仍 `import { docSetKey } from "@thincoder/core/agent-tools/review-streak.mjs"`（`:114` 使用）——不在 §2.2 / §2.7 受影响表，也不在 §2.8 清单；改名后导入断链 ⇒ 端包 `npm test` 直接红，与 AC-7（三包全绿）冲突。同批已为同类跨树硬依赖（`MAX_ADVISOR_ROUNDS`）建表（§1.4 · §2.7 `run-stages.mjs` / `agent.mjs` 两行）——本项同判据下遗漏。另：`advisor-settle.mjs:28` / `:53` · `advisor-async.mjs:56` · `run.mjs:16-17` 的导入路径更新亦未写入改动要点 | 受影响表补 `thincoder-vscode/test/config-pool.test.mjs`（205 → 205，±0：导入路径改名）一行；改名行改动要点列全消费方导入面（core 三处 + 端测试一处）+ 结构断言（旧路径零命中） |
| 3 | Clarity | 🟡 | 失败结论块轨适用性未定义：`ADVISOR-GUARDS.md:252` 结论块首行逐字写死 `[type=design …]`，而 `:100-101` 定义 `type` = 实际评审轨（`code`/`design`）、需求档 F29（`requirements/ADVISOR-CONVERGENCE.md:134`）四项含「评审类型」；同时 `:225`（§6 零改边界）把「失败结论」列为**代码面**反复截断的出口。实现面现状 = 分类仅设计轨跑（`thincoder-core/agent-tools/advisor-settle.mjs:219` `if (run.reviewType === "design")`），设计未写明「仅设计轨」⇒ 实现二义 | §7 加一句轨适用性定义：或「结论块仅设计轨」（同步 §6:225 措辞：代码面出口 = 尾文案 + guard 推回上限），或「两轨共用」（模板 `type` 改 `{type}`、判据名表标注 stale / no_credential 设计专属）；补一条代码轨用例 |
| 4 | Affected files | 🟡 | 拆分规划缺一行：`thincoder-cli/test/advisor-chain-guards.test.mjs` 488 行（>300 档；实测 488）在 §2.7 表内标 ±0（复核面、可能微调一条断言），§2.7 拆分规划只覆盖 `advisor-async.mjs` / 端 `agent.mjs` / `run-stages.mjs` 三个 >300 文件，未给该档拆分规划或豁免判据句 | 补一行：拆分规划（如冻结窗口 / 启动断言两组用例先拆独立档）或「±0 不增行 ⇒ 本轮零拆分义务」判据句 |
| 5 | Document ownership | 🟡 | 需求档 F30 判定句 ② 宽 / 窄读法未闭合：需求档 `requirements/ADVISOR-CONVERGENCE.md:213` 字面「矛盾对（顶层显式 ≠ `object.type`）⇒ 拒」；设计档 `ADVISOR-GUARDS.md:90` 把冲突域收窄为「另一个**合法**值」⇒ `object.type="foo"` ∧ 顶层 `type="code"` 照常受理。批档 §2.9 自认「待父侧确认」——两射程当前并存 | 二选一并同轮同步（窄读法：需求档括注补「另一合法值」限定；宽读法：设计档 §2.4 判定枚举 / 边界各加一句 + 用例补一行），闭合后删「待确认」行 |
| 6 | Document ownership | 🟡 | 设计档内 cap 残留与 §3.1 自相矛盾：`ADVISOR-CONVERGENCE.md:250`（§12 验证仍把「cap 仅 code——第 6 次拒 + design 豁免正向探针」列为现行回归内容）· `:45`（拒发枚举仍写「cap / 池满 / 无范围」，未增类型门拒回）· `:9`（首部「本档管轮次衰减 / 收敛上限」）；变更记录 `:289` 自称 §12 已同步，实际只落到 AC 表 | 三处随实现轮收正：`:250` 改「第 6 次照常受理探针」· `:45` 枚举改「类型门 / 池满 / 无范围」· `:9` 删「收敛上限」 |
| 7 | Methodology | 🟡 | §3.3 纪律文本落位副本面未指定（协调项）：`ADVISOR-CONVERGENCE.md:84` 只写落 `thincoder-core/prompts/discipline-engineering.md`；实测存在双源（运行期 `thincoder-core/prompts/*` + 中文正本 `docs/core/design/prompts/*`），既有标准为双源同文（需求档 §3.2 N5）；批档 §2.4 上抛 8 只登记「父侧落笔」，未列副本集 | 落位清单写全：运行期 `discipline-engineering.md` + 中文正本同档；说明普通模式同族句落 `discipline-normal.md` 何处（双源同步、不得两说） |
| 8 | Clarity | 🔵 | 结论块标识行 `round` 值语义未定：`ADVISOR-GUARDS.md:103` 定义 `round` = 「本次发起将使用的轮次号」，而结论块在结算出口追加（`:249-252`），此时 `run.round` 已是本次**已完成**尝试号（`advisor-settle.mjs:133`）——`{N}` 取 N 还是 N+1 未写明，且须与尝试表 `#`（`:256`）同值 | §7 加一句：结论块 `round` = 本次已结算尝试号（与尝试表 `#` 同值）+ 断言（块首 `round=N` ∧ 尝试表 `#=N`） |
| 9 | Doc hygiene | 🔵 | 批档数值漂移：§2.7 记 `ADVISOR-GUARDS.md`「355 → 382（+27，本轮已落）」，§2.9 读数收正为「383 → 392」，实测 **392**——382 未标作废；§2.6 落位锚 `ADVISOR-GUARDS.md:247`（结论块模板实测 `:252`）· `:372`（变更记录首条实测 `:378`）已漂（批档自称「读数不回溯」） | 一句话收正 / 给旧读数打「已被 §2.9 收正」标记；落位锚改节号锚（§7 契约二 / 变更记录首条） |
| 10 | Doc hygiene | 🔵 | §10 A-AG 编号乱序：`ADVISOR-GUARDS.md:346-349` 的 A-AG12–A-AG15 插在 A-AG9 与 A-AG10（`:350`）/ A-AG11（`:351`）之间 | 按号重排或改段号锚，保持编号单调便于机检引用 |
| 11 | Affected files | 🔵 | 标注义务半满足：`thincoder-vscode/test/files.mjs` 现行数记 `—`（实测 83 行）+1 行——「当前行数 + 预计增量」只给一项 | 补 `83 → 84（+1）` |
| 12 | Doc hygiene | 🔵 | 需求层指针形态陈旧：`ADVISOR-GUARDS.md:5` 写 `requirements/ADVISOR-CONVERGENCE.md`（相对形态，与 `:6` 绝对指针不一致；注「迁入基准层属后续批」与实况不符）；`ADVISOR-CONVERGENCE.md:5` 指向 `thincoder-cli/docs/requirements/…`（参照历史档） | 两档指针统一为现状绝对路径 `docs/core/requirements/ADVISOR-CONVERGENCE.md`，删过时注（前批遗留） |

**域外注（不评级）**：`docs/core/design/BATCH-RECORD.md:133/174/246` + `docs/core/design/prompts/persona-engineering.md:48`（§3.5 对照表 · 用户裁项）· `AGENT-LOOP-SUBAGENT.md:197`（已登记跨档项）· `docs/core/design/AGENT-PARAMS.md:17/:34`（主 agent 轮次上限，同名异面）——均未评。

**已核（正面证据）**：受影响表行数抽查全对（`advisor.mjs` 280 · `run.mjs` 293 · `review-streak.mjs` 93 · `advisor-settle.mjs` 231 · `advisor-async.mjs` 477 · core `advisor.mjs` 278 · `completion.mjs` 146 · `record-results.mjs` 174 · 端 `run-stages.mjs` 380 · 端 `execute-tools.mjs` 393 · `tool-args.mjs` 84 · `advisor-chain-guards.test.mjs` 488 · `design-review-streak-guard.test.mjs` 266）；关键锚全对（`advisor.mjs:98` 旧缺省 · `:4/:38/:61` 三处 `(default)` · `:172-183`/`:185-191` 两预检 · `:237`/`:247` · `run.mjs:29/:33/:140/:193/:201` · `advisor-settle.mjs:144` · `messages.mjs:34` · 端 `agent.mjs:13` 死导入 · `run-stages.mjs:22/:156`）；调用面盘点可复核（`advisorTool.execute(` 12 处 · `runAdvisorReview(` 4 处 · `prepareAdvisorMessages(` 4 处，逐处显式 `type` · 三树调用点零 `object` 声明 · 全仓零 cap 用例引用）。

**计数**：🔴 2 · 🟡 5 · 🔵 5（合计 12）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**修项核验（轮 2 · 评审 id=84 的 12 条）· 发现表 + 裁定**

12 条 prior 发现逐条对现盘复核 → **全部 Fixed**；本轮另报 2 条观察（🟡1 / 🔵1，均 advisory、不阻断）。

| # | Orig# | File | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `docs/core/design/ADVISOR-CONVERGENCE.md` §3.1/§3.7 · 批档 §2.10 | — | Fixed | §3.1:69 加「纪律面扫尾（同口径——提示词面 = 逐字建议，落笔权在主 agent）：四处**活**提示词仍载「最多 5 轮」上限」+ :71 逐字改法（双源同文 · 只替换末句）；新 §3.7:119-149 载口径命令 ×2 + P1–P6 + R1–R3 + 假阳 3。逐行抽查全对（`thincoder-core/prompts/discipline-normal.md:126` 现文 `…(no new-issue hunting). Max 5 rounds total.`；`persona-engineering.md:50`/中文 `:48`、`persona-eng-coder.md:26` 双语、`NORMAL-MODE.md:68`、`ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md:13`、`ENGINEERING-MODE-V2.md:373`/`:642`）。四处活行正文仍为旧句——已登记「父侧落笔」待落项，设计侧义务闭合。 |
| 2 | 2 | 批档 §2.10 | — | Fixed | `:407` 新增 `thincoder-vscode/test/config-pool.test.mjs` 行（204、±0、`:31` 导入改 `review-facts.mjs`）；`:408` 改名行列全 6 导入消费方 + 注释面 6 处 + 三树零命中结构断言。全仓 grep `review-streak` 复核：三产品树全部位点被覆盖（含原漏项 `config-pool.test.mjs:31: import { docSetKey } from "@thincoder/core/agent-tools/review-streak.mjs"`）。 |
| 3 | 3 | `ADVISOR-GUARDS.md` §7/§6/§2.5 · 批档 §2.10 | — | Fixed | §7:253「轨适用（两轨共用——2026-09-18 裁定）：结论块对 code / design 两轨同式适用（块首行 `type` = **实际评审轨**，不再写死 `design`）」；:256 模板改 `[type={type} · …]`；:273-282 判据名表增「轨」列（`no_credential` 设计专属 · `stale` 两轨——实核 `advisor-settle.mjs:68-71` 有 code 分支，报备为上抛 10）；§6:226 措辞同步；代码轨用例 T-AF16 + AC-11 在册。 |
| 4 | 4 | 批档 §2.10 | — | Fixed | `:410` 行 + `:414-416`「拆分规划（收正版）」：488 行档「本轮 **±0 净增 ⇒ 零拆分义务（判据句）**」+ 后续按组拆预案（E 组 / B 组 → 独立档，均 <300）。 |
| 5 | 5 | `requirements/ADVISOR-CONVERGENCE.md` §9 · `ADVISOR-GUARDS.md` §2.4 | — | Fixed | 需求档 F30 判定句 ②:213 已载「（若声明**为另一合法值**）…**`object.type` 为非合法值 ⇒ 不构成矛盾**（…16:5x 裁定窄读法）」；设计档 :93 窄读法同射程（「无并存读法」）；批档 §2.10「待确认行关闭」。 |
| 6 | 6 | `ADVISOR-CONVERGENCE.md` :9 / :45 / :293 | — | Fixed | 三处 cap 残留全部收正：:9「轮次衰减 / 终止语义——**无机械上限**（§3）」· :45「拒发——类型门 / 池满 / 无范围——不计不置」· :293「**第 6 次及以后照常受理探针（撤 cap）**」。 |
| 7 | 7 | `ADVISOR-CONVERGENCE.md` §3.3 | — | Fixed | :84-87 落位清单写全（工程模式：运行期 + 中文正本 ×「步骤 4（测试）」；普通模式：§Review discipline `:119` 起 + 中文「§评审纪律」`:118` 起）；抽查锚全对（`discipline-engineering.md` 运行期/中文 `:41` = 步骤 4）。 |
| 8 | 8 | `ADVISOR-GUARDS.md` §2.5/§7 | — | Fixed | :104 字段行 + :266「`round` = 本次**已结算**尝试号（与尝试表 `#` 同值）+ 断言（T-AF16）」；锚 `advisor-settle.mjs:133 run.round++` 实核在位。 |
| 9 | 9 | 批档 §2.10 | — | Fixed | 「数值漂移与锚收正」：旧读数 382 作废；GUARDS 392 → **402** · CONV 293 → **340**（读回实测一致）；落位锚改节号锚（§7 契约二 as-of `:256` · 变更记录首条 as-of `:383`）。 |
| 10 | 10 | `ADVISOR-GUARDS.md` §10 | — | Fixed | 编号已单调：`:351` A-AG10 → `:356` A-AG15（A-AG9 在 :350）。 |
| 11 | 11 | 批档 §2.10 | — | Fixed | `:409`：`thincoder-vscode/test/files.mjs` 现行数补全 = **82**（实测）→ +1 = 83；原「83」为行使数差一，已在「读数收正」段说明。 |
| 12 | 12 | 两档首部 | — | Fixed | `ADVISOR-GUARDS.md:5` / `ADVISOR-CONVERGENCE.md:5` 均改「需求层指针 = `docs/core/requirements/ADVISOR-CONVERGENCE.md`（…现状绝对路径）」。 |
| 13 | (new) | 批档 §2.7 AC-3（`:227`） | 🟡 | New（上轮遗留 · 非本轮修正引入 · 不阻断） | AC-3 块首行正则 `criterion=[a-z-]+` 的字符类不含下划线，而 §7 判据名表五值含 `_`（`context_limit` / `turn_cap` / `review_failed` / `no_credential` / `no_report`）⇒ 失败结论类以这些判据名取样时正则不命中（仅取 `timeout`/`empty`/`stale` 才过）。建议放宽为 `[a-z_-]+`（或按判据名集显式枚举）。 |
| 14 | (new) | `requirements/ADVISOR-CONVERGENCE.md` 变更记录 | 🔵 | New（本轮引入） | 判定句 ②:213 已载「16:5x 裁定窄读法」，但变更记录末条止于 `:227`「2026-09-18 16:3x 父侧裁定…」——16:5x 收窄无记录行。建议补一条 16:5x 子条目（窄读法：冲突域 = 两个合法轨值；非合法声明值不构成矛盾）。 |

**计数**：prior 12（🔴2 / 🟡5 / 🔵5）全部 Fixed（零复发）；本轮新增 🟡1 / 🔵1（advisory，不阻断）。

**已核（正面证据）**：标注数字抽查一致（GUARDS 402 · CONV 340 · `files.mjs` 82 · `config-pool.test.mjs` 204；wc -l 口径差一已在批档说明）；fix 轮新增锚全对（§3.1/§3.3/§3.5/§3.7 行号 · §2.4 `:93` · §2.5 `:102/:104` · §6 `:226` · §7 `:249/:253/:256/:262/:266/:273-282` · §10 `:351-356` · `advisor-settle.mjs:133` · 提示词面 P1–P6 位点）。

VERDICT: pass

## §4 用户批准（主 agent）

## §5 实施

### 5.1 交付摘要（受影响表逐行 · Δ = 实测行数）

**状态行**：✅ 实现完成 · 内部发散审计（explore）1 轮 + 代码评审（advisor）1 轮已过（VERDICT pass） · 三包 `npm test` 全绿（core 362 / cli 701 / vsc 601） · 待父侧收口（§6）。

| 文件 | 批档现行数 | 实测终值 | Δ | 改动要点 |
|---|---|---|---|---|
| `thincoder-core/advisor/notice.mjs`（**新**） | 0 | 141 | +141 | F30 类型门判定 + 拒发串（四形态 Why / 对象声明追加行 / 两合法值行）· F31 标识行 + `withIdentityLine` + `scopeSummary` · F28 判据名纯函数（七行优先级）+ 人读说明表（八值）· F29 结论块构建（§7 契约二逐字）——单源、零状态、零 LLM 解析 |
| `thincoder-core/agent-tools/advisor.mjs` | 280 | 280 | ±0 | `:98` 旧缺省 → 类型门（最早判定；三分支 + 拒发登记）· 声明面三处 `(default)` 收正 + schema `required:["type"]` · 删 cap 预检 / 停止预检 / review-streak 导入块 · 两处范围拒回改调标识行构建器 · 同步分支计数落账撤除（注释注明结论块落结算出口） |
| `thincoder-core/advisor/run.mjs` | 293 | 190 | **-103** | 删 `MAX_ADVISOR_ROUNDS` / `buildCapMessage` / `extractUnfixedIssues` / `MAX_UNFIXED_DISPLAY` / 停止前缀 / 停止结论串构建器 / 人读说明表 / cap 内防线 / 停止内防线 / 护栏导入块；保留启动拒绝前缀契约 + `looksLikeReviewOutput` |
| `thincoder-core/agent-tools/review-facts.mjs`（**改名**自 review-streak.mjs） | 93 | 31 | -62 | 只留 `normAbs` + `docSetKey`（纯事实面）；计数载体 / 停止谓词 / 分类函数 / 常量全删 |
| `thincoder-core/agent-tools/advisor-settle.mjs` | 231 | 240 | +9 | 计数落账 → 结论块落账（`settlementCriterion` 单源，**两轨共用**）；prior 归一刻意先于结论块（结论块不进 prior） |
| `thincoder-core/agent-tools/advisor-async.mjs` | 477 | 481 | +4 | 同 scope 拒回 = 既有前缀行首 + 标识行（`criterion=scope-in-flight`，round=`N+1/uncapped`）+ 两处注释面收正（cap 表述 / 旧档名） |
| `thincoder-core/advisor.mjs` | 278 | 281 | +3 | 头注 cap 句收正 + 三处行内 「cap」注释收正（注释面；评审域外注 ③ 采纳） |
| `thincoder-core/agent/completion.mjs` | 146 | 145 | -1 | guard 公式删轮次项 + 删 `MAX_ADVISOR_ROUNDS` 导入（`rounds` 仅入提醒文案显示） |
| `thincoder-core/agent/record-results.mjs` | 174 | 174 | ±0 | 注释收正（REFUSED 族引述 —「per-review cap」→ 类型门 / 范围守卫 / 同 scope） |
| `thincoder-core/advisor/messages.mjs`（**越界项**） | — | 299 | ±0 | `:64` docstring `(default)` 旧句收正（一行） |
| `thincoder-core/agent/write-gate.mjs`（**越界项**） | — | 87 | ±0 | `:28` 注释面改名（review-streak.mjs → review-facts.mjs，一行） |
| `thincoder-vscode/src/agent/run-stages.mjs` | 380 | 377 | -3 | 删导入 + guard 轮次项 + 三处注释 cap 引述收正 |
| `thincoder-vscode/src/agent.mjs` | 486 | 485 | -1 | 删死导入 `MAX_ADVISOR_ROUNDS` |
| `thincoder-cli/test/advisor-type-required.test.mjs`（**新**） | 0 | 182 | +182 | T-AF4/5/9/13/14/15（形态枚举 / 对象声明 / 冲突对 / 窄读法 / 调用面零残留结构断言） |
| `thincoder-cli/test/advisor-round-uncapped.test.mjs`（**新**） | 0 | 169 | +169 | T-AF1/2/2b/6/7/11（第 6 次照常受理 / 逐次重发 / 零封禁 / 轮次字段保留 / guard 不停推 / 零载体与导出面） |
| `thincoder-cli/test/advisor-failure-notice.test.mjs`（**新**；承旧档改名 + 全量重写） | 0 | 220 | +220 | T-AF3/3a/8/10/12/12b/16（判据名矩阵 / 结论块两轨 / 零噪声 / 三处范围拒回标识行 / 凭证卫生 / round 语义） |
| `thincoder-cli/test/design-review-streak-guard.test.mjs` | 266 | — | **-266** | 整档删除（承档改名 + 全量重写为 `advisor-failure-notice.test.mjs`） |
| `thincoder-cli/test/advisor-sync-accounting.test.mjs`（**越界项**） | — | 111 | ±0 | `:62` 断言消息文本收正（「cap 5 约束」→ 轮次仅提示词衰减与显示） |
| `thincoder-vscode/test/advisor-guard-rounds.test.mjs`（**新**） | 0 | 34 | +34 | T-AF7 端侧（`maybeGuardPushbacks` 直驱：`_advisorRound=6` 仍推回 + 推回上限仍 3） |
| `thincoder-vscode/test/files.mjs` | 82 | 83 | +1 | 端侧测试登记（新档入册） |
| `thincoder-vscode/test/config-pool.test.mjs` | 204 | 204 | ±0 | `:31` 导入改指 `review-facts.mjs`（改名消费方） |
| `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs`（**越界项**） | — | 109 | ±0 | T-V12 两处等价断言随 F31 标识行同步（文本逐字更新，行数 ±0） |

**两处读数校正（评审 🔵 采纳）**：`advisor-async.mjs` 实测 **481**（批档 §2.2 预测 ≈475）· `run-stages.mjs` 实测 **377**（预测 ≈376）· `advisor-settle.mjs` 实测 **240**（预测 ≈231）· `run.mjs` 实测 **190**（预测 ≈248，删面大于预测）——批档 §2.2/§2.7 两行读数请父侧按实测收正。

### 5.2 先红读数（§2.3 要求 · 现状码实跑）

`thincoder-cli/.thincoder/tmp/af-probe-readings.log`（先红 / 后绿同口径记录；探针脚本已清——重跑面由三个新用例档承接）：

- **T-AF1**：code 实例 `round=5` 第 6 次发起 ⇒ `"Advisor: convergence cap reached after 5 rounds.\n\nAll prior issues appear resolved.\n\nOptions: …"` + `_advisorRefusals=["c1"]`（拒发登记）。
- **T-AF5 / T-AF9**：无 `type` / `type:'Code'` / `type:1` ⇒ **拒发串零命中**、返回 `{"kind":"advisor","status":"running",…}`、池条目 = 1（**静默落 code 轨**）。
- **T-AF11**：失败结算后 `_designReviewStreaks = Map(size=1)`（计数载体被创建）；`run.mjs` 导出面 `MAX_ADVISOR_ROUNDS=true · buildCapMessage=true · ADVISOR_DESIGN_STREAK_STOP_PREFIX=true`（18 导出）。
- **T-AF14**：`agent-tools/advisor.mjs` 旧缺省载体 `args.type || "code"` **1 处** · 声明面 `(default)` **3 处**。
- **后绿（同口径重跑）**：T-AF1 → async ack + 零拒发登记；T-AF5/T-AF9 → `Advisor: launch refused …` + 登记 + 池 0；T-AF11 → 判据名 `timeout` + 载体字段 `undefined` + 四名零导出（14 导出）；T-AF14 → 1 处 → **0** · 3 处 → **0**。

### 5.3 AC / 用例实测

| AC | 结果 | 命令 / 证据 |
|---|---|---|
| AC-1 第 6 次照常受理 | ✅ | T-AF1/T-AF2（`advisor-round-uncapped.test.mjs`） |
| AC-2 无 `type` ⇒ 拒发串 | ✅ | T-AF5（前缀 + Why + 两合法值行 + 标识行 + 拒发登记 + 零池/零 token） |
| AC-3 三类文案首行载四项 | ✅ | T-AF5 / T-AF10（三处范围拒回）/ T-AF3 / T-AF16（结论块）；正则 `[a-z_-]+`（发现 13 建议形态） |
| AC-4 零计数载体 + 导出面 | ✅ | T-AF11（三树源面八针零命中 + 导出面） |
| AC-5 零封禁（第 4 次及以后 + 块逐次） | ✅ | T-AF2b（真工具 + 真结算五次循环） |
| AC-6 guard 不因轮次停推 | ✅ | T-AF7 核（`handleCompletion` round=6 仍推回）+ 端（`maybeGuardPushbacks`） |
| AC-7 三包 `npm test` 全绿 | ✅ | core **362 / 362** · cli **701 / 701** · vsc **601 / 601**（`npm test`，末轮终态） |
| AC-8 `doc-check` 按档归属零新增 | ⚠️ 见 5.5（rename 侧效 3 条 · 文档面待父侧） | `node scripts/doc-check.mjs`：悬空 11（探针实验证明其中 3 条由 rename 引起）/ 行宽 6（零新增） |
| AC-9 形态枚举闭合 | ✅ | T-AF9（缺/null/""/"  " ⇒ type-missing；"Code"/"design "/"foo"/1/true/{}/[] ⇒ type-invalid；冲突对 ⇒ type-object-conflict） |
| AC-10 调用面零残留 | ✅ | T-AF14（旧缺省零命中 / `(default)` 零命中 / 三树调用点逐处显式 / 调用点零 `object` 声明） |
| AC-11 结论块两轨共用 | ✅ | T-AF16（code 轨 · round=3 与表 `#=3` 同值）+ T-AF3（design 轨）+ T-AF12（`no_credential` 设计专属面） |

T-AF1…T-AF16 全覆盖（含新增 T-AF2b / T-AF12b——覆盖 AC-5 与单源构件，属加面非偏差）；零网络 / 零真实 LLM / 零长等待。

### 5.4 决策透明表

| # | 决策点 | 取法 | 依据 |
|---|---|---|---|
| 1 | F31 拒回族形态 | 既有前缀**行首逐字 + 标识块同首行尾随**（`withIdentityLine`） | 设计 §2.5「前缀仍在行首——向后可搜索」+ F31 两句同时满足 |
| 2 | 拒回族 `round` | 未定轨（类型门 / 范围缺失 / 范围非法）记 `—`；同 scope 在跑记 `{N+1}/uncapped` | 设计 §2.5 字段行（判定先于实例解析记 `—`；否则记本次发起将使用的轮次号） |
| 3 | 结论块落点 | **结算出口**（`settleAdvisorRun`，两轨共用）；**同步路径不追加** | 设计 §7 契约二（「结算出口」+ `round` 语义锚 `advisor-settle.mjs` run.round++）；批档受影响表 `advisor.mjs` 行不含结论块任务 ⇒ 同步面缺块为设计允许面（**已披露，待父侧裁**） |
| 4 | 结论块 vs prior 顺序 | 结论块**晚于** prior 归一（prior 只承载评审正文） | 设计 §7 零凭证值 + prior 语义（评审形态输出） |
| 5 | 人读说明表落点 | 迁 `notice.mjs`（原 `run.mjs` 表随停止护栏退场） | 设计 §3.2「结论文案与对象标识四项单源构建 = notice.mjs」 |
| 6 | `stale` 含义句 | 取设计 §7 表逐字「the reviewed **target** changed…」（原实现为 documents 版） | 设计档权威（文案逐字） |
| 7 | AC-3 正则字符类 | 用例取 `criterion=[a-z_-]+`（含下划线） | 设计 §7 判据名表含 `_`（评审 id=86 观察 13 建议形态） |

### 5.5 越界项（逐条带理由）与残留披露

1. `thincoder-vscode/test/portability-vsc-advisor-context.test.mjs`（**不在批档受影响表**）：T-V12 两处**等价比较**断言随 F31 标识行同步（文本逐字更新、行数 ±0）——F31 改变该拒回串，不同步即端包红；同类先例（`advisor-chain-guards.test.mjs`）批档已建「随结论块微调该断言」行，本档同判据漏项（评审 🔵 已确认，建议父侧补表行）。
2. `thincoder-core/advisor/messages.mjs:64`（**不在受影响表**）：docstring `(default)` 旧句收正一行（与受影响表内 `advisor.mjs:4/38/61`、`run.mjs` 同族语句一致——F30 撤缺省后该表述已不实；经代码评审域外注 ③ 同判据采纳）。
3. `thincoder-core/advisor.mjs:215-229` 三处行内「cap」注释收正（**超出该档「头注收正」登记面**，同文件同主题；代码评审域外注 ③ 采纳）。
4. `thincoder-cli/test/advisor-sync-accounting.test.mjs:62` 断言消息文本收正（「cap 5 约束」→ 轮次仅提示词衰减与显示；断言本体零改、行数 ±0）。
5. `thincoder-core/agent/write-gate.mjs:28` 注释面旧档名改指（rename 消费方注释面收正，一行）。
6. `thincoder-cli/.thincoder/tmp/af-probe-readings.log`（gitignored 现场记录：先红/后绿读数 + doc-check 侧效实验）——探针脚本已清，重跑面由用例档承接。

**未处理（非本笔域，父侧笔）**：① 提示词面四处「最多 5 轮」活行 + 三处跨档引用文本（`CONFIG.md:113` · `ENGINEERING-MODE-V2.md:331` · `AGENT-LOOP-SUBAGENT.md:197`）；② 设计档 `notice.mjs`「（拟新增）」标记四处（`:11` / `:78` / `:97` / `:336`）——实现后该标记到期，建议父侧收口同轮撤除；③ **rename 侧效（文档面）**：`docs/core/design/CONSULTATION.md:15` / `:72` · `CORE-UNIFICATION.md:857` 的 `src/agent-tools/review-streak.mjs` 锚随改名悬空（basename 唯一解析面归零；探针实验：伪档在场 ⇒ 悬空 11→8、迁引 222→221，清理后回 11）——建议父侧改指 `review-facts.mjs`（或在行内加「（迁移期引文）」+ 史实谓词「改名」）。

### 5.6 审计与代码评审轮次与终态

| 轮 | 形式 | 结果 | 处置 |
|---|---|---|---|
| 审计 1 | 内部 explore（只读发散审计：设计档 §2.4/§2.5/§7 + 批档 §2.10 + AC 清单逐条） | **DEVIATIONS**（仅 DOC-DRIFT 🔵×2，无 🔴 / 无 PARTIAL / 无 SILENT-SIMPLIFICATION / 无 OUT-OF-LIST） | 自修：两处 `(default)` 注释面收正（含越界项 2）+ 其一致性面（run.mjs / advisor.mjs）；受影响表补行建议转父侧（越界项 1） |
| 评审 1 | advisor code review（8 档实施文件 + 3 份文档 + 测试档；逐字对读） | **VERDICT: pass**（0 🔴；🟡 = 两个 >300 软线档（拆分规划在册，非阻断）+ 批档 §5/§6 空（协调项）；🔵 = 批档行数预测漂移 + 设计档「（拟新增）」标记待撤 + 域外注 ③） | 域外注 ③ 采纳（advisor.mjs 三处注释收正）；🔵/协调项转父侧收口 |

**终态**：`clean`（无 must-fix；无未披露越界；三包全绿）。

### 5.7 结构断言实测（零残留）

- 三树源面（`test` / `_archive` / `.thincoder` 除外域）字面零命中：`MAX_ADVISOR_ROUNDS` · `buildCapMessage` · `buildDesignReviewGuardMessage` · `ADVISOR_DESIGN_STREAK_STOP_PREFIX` · `MAX_DESIGN_REVIEW_STREAK` · `_designReviewStreaks` · `designReviewStreak*` · `convergence cap reached` · `review-streak`。
- `review-facts.mjs` 导出面 = `{ docSetKey, normAbs }`（行为断言 `Object.keys(...)` 深等）；`run.mjs` 导出面 18 → 14（cap 族四名退场，启动拒绝前缀契约保留）。
- 端侧硬依赖零残留（`thincoder-vscode/src/agent.mjs` 无 `MAX_ADVISOR_ROUNDS`；`run-stages.mjs` guard 无轮次项）。
- `_advisorRefusals` 拒发登记族（类型门 / 范围 / 同 scope / 池 / 启动拒绝）逐处保持；第 6 次及以后无任何按计数拒发路径。

## §6 验证与收口（父代理）

**收口（2026-09-18 18:0x · 父侧直接执行）**

- **交付判据**：评审轮 2 pass（id=86）→ 修正轮（id=85）→ 实现轮（id=91 · 终态 clean：内部分歧审计 1 轮 + 代码评审 1 轮 pass）→ 验收 **AC-1…AC-11 全绿** · **T-AF1…T-AF16 全覆盖**（含加面 T-AF2b / T-AF12b）；三包 `npm test` 终态 = **362 / 701 / 601**（0 fail）。
- **先红后绿实证**（读数在 §5）：第 6 次照常受理化 · 无 `type` ⇒ 拒发串 + 登记 + 零实例/零 token/零 LLM · 零计数载体与导出面（14 名）· 调用面零残留（旧缺省 0 / `(default)` 0）。
- **父侧裁定（承实现轮 §6 上抛 5）**：**同步路径（depth>0 / `async:false`）不追加结论块 = 设计允许面**——同步面失败文本随工具返回直返调用方、无 digest 环节 ⇒ 无结论块需求；如需变更走另批（本批不改）。
- **父侧直接执行（机械面 · 可 revert）**：三处 rename 侧效锚改指——`docs/core/design/CONSULTATION.md:15` / `:72` · `docs/core/design/CORE-UNIFICATION.md:857`（`review-streak.mjs` → `review-facts.mjs`（改名自 review-streak））。
- **父侧笔已落（早前轮次）**：提示词面四处「最多 5 轮」活行 + 两档 `discipline-engineering.md` 新条目 + 三处跨档引用文本（`CONFIG.md:113` · `ENGINEERING-V2.md:331` · `AGENT-LOOP-SUBAGENT.md:197`）——实现轮 §6 ④ 项已先行闭合。
- **待办（设计档面两则）**：行数读数按实测回填 + `notice.mjs`「（拟新增）」标记撤除 ⇒ 已转修正轮 **id=99**。
- **状态行**：✅ **已收口 2026-09-18**（全档冻结——不再回改）。
- **#99 落地核验（父侧）**：三项全闭 ✓（① 行数按实测回填——批档 **§2.11 A 表 25 行**（标 as-of · supersede §2.2/§2.7/§2.10 旧记值）+ 两档设计档自身读数 405/344；② 四处「（拟新增）」标记撤销（档内零命中）；③ 同族到期核对 **10 条逐条判定**（6 条已实现⇒撤/标已落 · 3 条未实现⇒保留+标轮次 · 1 条退场陈述⇒保留）+ 坐标回填 6 处后果面 + 5 处前批漂移）。
- **父侧两裁（承 #99 上抛）**：① **设计档不增设受影响表**（按 D2 / §3.6 实做——一次性材料落批档 §2）✓ ② `loop.mjs` 4+1 处**前批漂移一并收正 = 采纳**（同判据核过；如取「只收本批后果面」口径 ⇒ 该 4 处可单点回退，其余 6 处不回退）✓。
- **域外报备（已知 · 父侧自身面）**：`docs/vsc/requirements/WEBVIEW.md` 新增 1 悬空 + 1 超限——来源 = 父侧同轮写入的 **F-W13–F-W16** 段（会话界面审计登记）⇒ **父侧自行收正**（非本批）。
- **台账**：#84 / #85 / #86 ⇒ **已核销**。
