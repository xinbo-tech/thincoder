# AGENT-LOOP — 需求

> 板块：Agent 循环（主循环/子代理生命周期/异步化）。
> 状态：现行（随实现演进）。
> 来源：2026-09-10 自 `../design/AGENT-LOOP.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. question 工具抑制



**总体需求**：抑制 question 工具过度使用与不当形态（过度提问/大段文字/一条多问），修复 VS Code 卡片渲染可读性。**确认门（routine confirmation）用普通文本回复履行**——用户直接答"可以"——question 只留给真正需要用户选择/输入的场景。

- **工具描述三锚（question.md/VS Code question.mjs 对齐）**：每调用一问；单问简短（背景/分析放正文回复不放 question）；routine confirmations 走普通回复（仅真决策用工具）。
- **提示词**：discipline-engineering.md Questioning Style 语义 + common.md 确认门段 + discipline-normal.md 工具表反模式列（旧 system/engineering/discipline 表述——施工③随迁）。
- **机械限制**：question 长度 ≤100 字符、options ≤4 条——超限返回错误串不弹卡不调 onQuestion。
- **VS Code 渲染**：`.question-text` 加 white-space:pre-wrap + max-height 兜底滚动。

## 2. 子代理异步化（用户裁定）

- 用户 2026-09-08 裁定（两次痛骂——同步 spawn 反复犯）——**顶层（depth-0）spawn 禁 async:false——一律异步**。depth>0 平台强制 sync 不受影响（子代理内部——平台硬规则）。快车道（用户明确指令）。
- §7.7 只覆盖 spawn——用户裁 a：**escalate（飞刀）/advisor 顶层也纳入一律异步**——

## 3. 异步任务可见性（VSC 面板——live 块出生可靠性）

> 来源：批次 `../batches/2026-09-11-VSC-ASYNC-VISIBILITY.md` §1 条目 A（用户 2026-09-09 原话：
> "实际启动了但不能可靠显示 live 块"）+ 2026-09-09 22:32 精确复现（同响应双 spawn 两个 eng-coder →
> 扩展侧计数 2 running，webview 只渲染 1 个 live 块）+ 2026-09-11 03:50 用户"第10批开工"指令。
> 设计+测试见 `../design/AGENT-LOOP.md` §18（CLI 面）与 VSC 仓 `docs/design/WEBVIEW.md` §5.1（VSC 面）。

### 3.1 总体需求

用户（VSC 面板使用者）在后台任务（异步子代理 / 后台评审）运行时，必须**总能看见它**：面板上出现一个
live 块（谁在跑、跑了多久、能取消）并在任务结束时折叠为终态。当前实现里"块出现"依赖一条**纯增量消息链**
（扩展 → webview 逐条 postMessage），任何一次消息丢失、时序窗口、身份重名都会让块**永久缺失**——
用户看到的是"实际启动了但看不见"，且**不可诊断**（无痕迹、无兜底）。

### 3.2 功能性需求

| # | 需求 | 说明 | 范围边界（不做） |
|---|---|---|---|
| F-A1 | 出生必达（自愈） | 任何后台任务在面板上必然出现其 live 块——扩展侧投递链对"webview 未就绪窗口"的消息零丢失（队列入链），webview 就绪/清屏后以**状态再断言**（存活任务逐条重发出生事件）自愈 | 不做跨 reload 恢复已死任务的块（SESSION-RESTORE-PARITY）；不做存量历史回填 |
| F-A2 | 终态必现 | 任何后台任务的终态（done/settled/error/cancelled/terminated/failed）必然呈现在其块上：块缺失时先补块再折叠（never-born 终态防御），不得静默 no-op | 不建重复块（同身份幂等）；不复活已折叠块；**answered 例外**：无块 no-op（不属补桩集——回复走 digest 呈现，见 VSC 设计 §5.1.4 第 6 条成员表） |
| F-A3 | 块身份唯一 | 同一 webview 生命周期内块身份键（频道名）与任务实例一一对应：出生事件遇**已冻结的同名条目**必须建立新一代块（接管键），不得让新任务永久不可见；重名发生必须可留痕 | 不改频道命名法（`sub:<role>#<id>`——chunk 路由契约不变）；不引入 id 之外的实例序号 |
| F-A4 | 控制面不降级 | 任何"重建/补发"路径产生的块必须保留完整控制面与首见元数据：⏹ 取消（`pool:true` 语义）、async/sync 标记、model、startedAt（elapsed 不准丢） | 不改 ⏹ 的可见性判据（running + pool + family 角色） |
| F-A5 | 清屏可恢复 | 会话清屏（`clearMessages`——boot/loadSession 必经）后仍存活的后台任务必须重新出现为 live 块，且满足 F-A4（现状：重建块丢 pool 标记 → 无 ⏹） | 不重推已消化历史块 |

### 3.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-A1 | 零回归 | live→frozen 两态机/冻结幂等守卫/150 窗裁剪/tombstone 丢弃语义**零变化**；**不重做池快照重推**（REMOVE-POOL-SNAPSHOT 已裁定撤除——birth 队列不得复活"池行快照"形态） | 既有 activity-flow / webview-turnstate / chat-panel 测试全绿；`postPoolSnapshot`/`SNAPSHOT_ROLES` grep 零命中 |
| NFR-A2 | 可诊断 | 每一次"出生事件被守卫丢弃/同名接管/补块"必须留一条可断言的痕迹（webview 侧结构化日志 + 主侧投递日志），复发时能凭痕迹定位，不再"不可诊断"；**范围 = 出生事件面**（同名接管 / 无块终态补桩 / 未知 role 丢弃三类；`queued` 事件遇已冻结键的陈旧窗口丢弃不在内——见 VSC 设计 §5.1.9 声明） | 用例断言痕迹发生；grep 断言痕迹调用点在位 |
| NFR-A3 | 可机器验证 | 每条验收标准由 happy-dom 驱动**真 webview 模块**（`test/helpers/webview-env.mjs`）或桩面板驱动**真 extension 模块**（`test/chat-panel.test.mjs` 骨架）机判 | 新增用例全绿 + 反例（修前红）可复现 |

### 3.4 明确不做

- 不改 CLI TUI 的块机制（CLI 无 webview；其块/丢弃语义与面板无关——本条目纯 VSC）。
- 不改 `docs/design/ADVISOR-CONVERGENCE.md`（第 9 批链在飞，D5 冻结）。
- 不改 `docs/design/TUI.md`（第 7 批在途）。
- 不做"已 settle 且已 digest 的任务"的回填（其呈现面 = digest 文本）。

## 4. 后台评审池可观测 / 可控（advisor 池接入面）

> 来源：批次 `../batches/2026-09-11-VSC-ASYNC-VISIBILITY.md` §1 条目 B（平台机制缺陷——已实证三次：
> ① `subagent status` 只查子代理池——评审是否在跑/卡住不可知 ② `wait_for "advisor settled"` 误报
> （0ms 即过但池仍拒重发）③ 评审无 cancel 通道——对象漂移时旧评审杀不掉）。
> 设计+测试见 `../design/AGENT-LOOP.md` §18。

### 4.1 总体需求

后台评审（`_asyncAdvisors` 独立池）与异步子代理是**同一类后台任务**，其可观测/可控面必须同等：
模型能查到"评审在不在跑、跑了多久、第几轮、卡在哪"，能等一个**口径真实**的条件，能在对象漂移时
**定向干掉旧评审**并重发。现状 = 第二池的接入面遗漏（工具面部分已具备、部分缺失；`wait_for` 判据读错池）。

### 4.2 功能性需求

| # | 需求 | 说明 | 范围边界（不做） |
|---|---|---|---|
| F-B1 | 状态可查 | `subagent status`（概览与单查）必须覆盖后台评审池条目——含 role/status/已跑时长/轮次/reviewType（design/code）与未消化（done）态注记；两端语义同源 | 不做独立 advisor 查询工具（单工具动作面不变）；不改既有返回字段语义（只增字段） |
| F-B2 | 等待口径真实 | `wait_for "advisor settled"` 的判据 = **评审池真实状态**（无 running/queued 评审）；条件字面与既有条件集不变，行为与实际池一致（不再 0ms 误报） | 不新增条件字面；不改等待边界（超时/间隔语义不变） |
| F-B3 | 定向取消 | `subagent cancel <advisor id>` 可定向中止运行中评审（与面板 ⏹ 同源：abort 条目 controller → cancelled settle 不入 pending、不签发 token）、幂等、未知/已完成 id 显式报错 | 不做全停；不改 ⏹ 既有路由；不改评审取消的 token 语义 |
| F-B4 | 动作面指引一致 | `observe`/`send` 遇 advisor id 时给出**明确指引**（"这是后台评审——用 status 查 / 等其自动送达"），不得回含糊的 "unknown id" | 不为 advisor 开 observe/send（评审无逐回合观察面） |

### 4.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-B1 | 双端同源 | 两端（CLI / VSC）工具面**行为一致**（同输入同判定），文案各自原文自持；不一致处必须显式登记 | 双端用例表同构（同输入 → 同 status/error 判定）；差异表逐项登记 |
| NFR-B2 | 零回归 | 子代理池既有语义（status/cancel/observe/send 对子代理条目）零变化；`wait_for` 其余条件零变化 | 既有 `subagent-observe-send` / `async-settle` / ops 条件测试全绿 |

### 4.4 明确不做

- 不改评审收敛机制本体（轮次/cap/铁律——`ADVISOR-CONVERGENCE.md` 冻结对照）。
- 不改评审池容量/守卫语义（`§11.2 ②-6a` 池上限 + 同 scope 守卫原样）。
- 不做"评审排队"（评审间有依赖语义——超限拒绝语义不变）。
