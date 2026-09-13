# AGENT-LOOP — 需求

> 板块：Agent 循环（主循环/子代理生命周期/异步化）。
> 状态：现行（随实现演进）。
> 来源：2026-09-10 自 `../design/AGENT-LOOP.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。
> **迁移注记 + 移出清单（LEDGER-SELF-CONTAINED 批——2026-09-12）**：原 §9 / §10 / §11 / §12 / §14 / §16 / §17 七节
> = 历史「需求落本档」托管族（VSC 端需求原寄于本档），依各仓自持裁定**已迁 VSC 仓**（接收档 = VSC 仓
> `docs/requirements/AGENT-LOOP.md`——本批建；逐字迁移）。**切掉的行 = 下列 7 节**（D11「带清单的搬迁」——
> 可审计、非静默）；**源档 blob SHA** = `ccd6bd14b97674dce4a33c7781d75374e23ddab`（本批改动前的 HEAD 版）。

| # | 移出节 | 行数 | 接收档（VSC 仓） | 接收节号 |
|---|---|---|---|---|
| 1 | §9 VSC async 子代理保真（GitHub #6） | 50 | `docs/requirements/AGENT-LOOP.md` | §9 |
| 2 | §10 VSC webview Markdown 行内代码（GitHub #7） | 46 | 同上 | §10 |
| 3 | §11 VSC 评审链 / 异步残留收口（群 B B1/B5） | 45 | 同上 | §11 |
| 4 | §12 VSC 固定活动区回归 | 53 | 同上 | §12 |
| 5 | §14 VSC live 块 UX | 34 | 同上 | §14 |
| 6 | §16 VSC 活动区收口 | 43 | 同上 | §16 |
| 7 | §17 VSC 子代理审批面对齐（child permission gate） | 40 | 同上 | §17 |

> **范围与残留（如实登记）**：本批 C 桶射程 = 上述 7 节（托管声明族）+ `design/ENGINEERING-MODE.md` 1 处登记行。
> **仍住本档的 VSC 面需求节**（§3 / §5 / §8 / §13——各该批落位时未携托管声明，故不在本批 C 桶清单）——
> 其归属面收敛**触发 = 该档被后续批触碰或用户发起存量收口专项批**（登记不静默）。
> **本档节号保留源编号**（§1–§8 / §13 / §15——编号不连续 = 托管族已迁的痕迹）。

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
> 设计+测试见 `../design/AGENT-LOOP.md` §18（CLI 面）与 VSC 仓 `docs/design/WEBVIEW.md（VSC 仓）` §5.1（VSC 面）。

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
| NFR-A3 | 可机器验证 | 每条验收标准由 happy-dom 驱动**真 webview 模块**（`test/helpers/webview-env.mjs（VSC 仓）`）或桩面板驱动**真 extension 模块**（`test/chat-panel.test.mjs（VSC 仓）` 骨架）机判 | 新增用例全绿 + 反例（修前红）可复现 |

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


## 5. digest 起跑可见指示（VSC——第 21 批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-INDEX-PERCEPTION（VSC 仓）§1 条目 B6` + VSC 仓 `docs/TODO.md`
> 「会话流 / UI 反馈」组（2026-09-08 用户实测）。设计+测试见 `WEBVIEW（VSC 仓）§7.4`；
> 机制面（挂起会话 digest）见 `AGENT-LOOP（VSC 仓）§7`。

### 5.1 总体需求

后台异步子代理完成 → 区块并入会话流后，**消化轮（digest）已开始但界面无任何动静**（在等消化模型首 token，
可长达数十秒~分钟）——用户无法区分「正在消化」与「卡死」。CLI 在进入消化轮前**零延迟**打一行
`[auto-turn: digesting …]`（`src/tui/suspension-drive.mjs:161`）；VSC 侧此前只落 `logEvent("digest:start")`
（文件日志，用户不可见）——本条目把「起跑」这一时刻变为面板可见。

### 5.2 功能性需求

| # | 需求 | 说明 | 范围边界（不做） |
|---|---|---|---|
| F-C1 | digest 起跑即时可见（VSC） | 消化轮开始（调用消化回合之前）即向面板投一条**即时的流内指示**——含待消化份数与「进行中」语义；消化结束以同一元素收尾（成功/中断两态），异常路径不得留下「仍在消化」的假象 | 不新增忙态通道（忙态 = 既有 `turnState` 单广播）；不改 digest 注入/动作域/结算语义；不做历史回填（会话重载后不恢复该元素） |

### 5.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-C1 | 对位 CLI（语义同源·文案自持） | 语义 = CLI「进消化轮前即刻可见」；形态各端自持（CLI = dim 行；VSC = webview 流内元素 + i18n）——不做逐字镜像 | 设计档逐条对位说明；用例断言「post 早于消化回合调用」 |
| NFR-C2 | 零回归 | 挂起驱动状态机（`susp:*` / `digest:*` 事件）/ 计数广播（`turnState.counts`）/ 忙态派生 / 已消化块回收语义**零变化** | 既有挂牌用例全绿；新增用例与既有用例同文件跑 |

### 5.4 明确不做

- 不改 CLI TUI 的消化行（现状已达标——本条目纯 VSC）；
- 不做「消化进度百分比 / 逐条报告进度」（消化是单回合 LLM 语义——无可报告进度）；
- 不把该元素并入任务活动块族（`.thincoder` 活动块 = 子代理族；本元素 = 生命周期指示——同「压缩状态行」同规）。

### 5.5 判定句（验收语义——设计 AC 逐条回指）

- **F-C1**：消化轮开始 —— 面板在消化回合被调用**之前**收到 `{type:"digest", status:"start", n}`；结束收到
  `{type:"digest", status:"end", ok, ms}`；webview 流内出现指示元素（start 文案含 n；end 成功/中断两态）。

## 6. 子代理 abort 来源标注（可诊断性——第 24 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-ABORT-PROVENANCE.md` §1（用户反馈已实证两次：子代理死亡只报
> `aborted due to timeout`——无来源层 / 无错误栈）；用户 2026-09-11 裁定「本仓接管」。
> 设计+测试见 `../design/AGENT-LOOP.md` §20。

### 6.1 总体需求

子代理（及 settle 族后台任务）的**死亡报告必须自证来源**：任何 abort / 超时死亡，报告文本须标明
「哪一层发起（provider / agent / settle）+ 何触发（user / timeout / cancel / stop / unknown）」——
使「~600s 死」一类不可诊断问题**一次可判**。

### 6.2 功能性需求（判定句逐条）

| # | 需求 | 判定句（验收语义——设计 AC 逐条回指） | 范围边界（不做） |
|---|---|---|---|
| F-D1.1 | abort 产生点标注 | 每个 abort/超时产生点（三层面）产出的错误对象带结构化来源（trigger+layer+detail）；词汇表由单测锁定（trigger 枚举 5 值） | 不改 abort 机制本体（何时 abort / 谁有权 abort 零改） |
| F-D1.2 | 链式传播保真 | 子代理 controller 链每一跳转发 abort 时**保留原因**（reason 逐跳传递）——下游可判定「谁杀的」 | 不改链拓扑 / 注册 / 注册注销语义 |
| F-D1.3 | 死亡报告合成 | 结算 / 报告面以**单一合成器**输出死亡行：原消息前缀逐字保留 + 来源后缀；用户面与模型面同源 | 不改 digest 注入格式 / 预算契约 |
| F-D1.4 | 未知显式告警 | 无来源信号的死亡必须显式标 `unknown`（含未标注兜底）——不得静默空白 | 不做自动上报 / 遥测（诊断只在本地报告面与日志面） |

### 6.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-D1.1 | 零回归 | 既有 abort / 结算 / 取消语义与文案前缀零变化；既有测试族全绿 | 新增 `test/abort-provenance.test.mjs` + 既有族 `node --test` |
| N-D1.2 | 可机判 | 词汇表 / 死亡行形态 / 链跳形态 / 合成点在位由断言锁定（fail-when-unchanged） | 新增测试档 + grep 断言（设计 §20.8） |
| N-D1.3 | 双端 | 各端独立实现、语义同源：CLI 面本批落地；VSC 面差异（600s 绝对墙钟残留等）如实登记、父侧排程 | 差异登记（设计 §20.4 / §20.10） |

### 6.4 明确不做

- 不改 abort 机制本体与提示词语义；不碰他链在途档；
- 不做自动遥测 / 上报；不做 TUI 块面错误文案（登记，设计 §20.10）；
- VSC 仓改动不在本批（双端纪律——差异登记 + 父侧排程）。

## 7. Stop 钩子（主会话 run 结束事件——第 30 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-STOP-HOOK.md` §1（Gitee #IKD5XY：弹窗/声音——「回答结束触发自定义通知」）。
> 用户裁定（2026-09-11 13:36）：事件名 `Stop`；范围 = 每回合、仅主会话（子代理不触发）。
> 设计+测试见 `../design/AGENT-LOOP.md` §21。

### 7.1 总体需求

作为一个 ThinCoder 用户，我希望**每次回答结束（主会话一次执行的终止）时触发我自定义的钩子脚本**，
以便离开终端时也能收到弹窗 / 声音等通知（OS 级通知由我自己的脚本实现——产品不做通知设施）。

**口径（「每回合」的精确语义）**：一次 Stop = **主会话（depth 0）一次 runAgent 执行的终止**——即用户可见的
「一次回答」（含正常完成 / 撞帽暂停 / 异常终止三态）；内层工具轮（turn loop 迭代）**不**逐轮触发
（逐轮触发对长任务 = 通知风暴，与「回答结束」语义相悖）。子代理（depth > 0）不触发（用户裁定）。

### 7.2 功能性需求（判定句逐条）

| # | 需求 | 判定句（验收语义——设计 AC 逐条回指） | 范围边界（不做） |
|---|---|---|---|
| F-E1 | 触发面 | 主会话 run 终止（done / maxTurns / error 三态）各触发一次 Stop；用户中止（signal 已 abort / AbortError 展开）不触发；子代理（depth > 0）不触发 | 不做逐内层轮触发；不做子代理 Stop |
| F-E2 | 载荷与原因 | 钩子 stdin 收到 JSON：基础骨架（event / toolName / toolArgs / result / error / timestamp——镜像既有事件）+ `turn`（链内累计轮号）+ `reason`（done / maxTurns / error）；`error` 仅 reason=error 时非空（异常 message） | 不携带回答正文 / agent 对象；不新增截断策略（后续可加字段——向后兼容） |
| F-E3 | 非阻塞与失败静默 | fire-and-forget：不 await、不计入回合时延（宿主返回先于脚本产物）；hook 命令缺失 / 超时 / 报错绝不影响主流程（不抛、不阻断） | 不做失败可见面（日志 / 告警——与既有三事件同语义）；不做重试 |
| F-E4 | matcher 面 | matcher = 工具名正则过滤，仅对工具事件生效；无工具名事件（Stop）忽略 matcher——配了 matcher 也不静默失火 | 不改工具事件的 matcher 语义；不为 Stop 发明新 matcher 语义 |
| F-E5 | 事件集收口 | 钩子事件集 = PreToolUse / PostToolUse / PostToolUseFailure / Stop 四类；未接线的 `Notification` 声明除名（引擎头 + 文档面） | 不接通 Notification；不新增其它事件 |

### 7.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-E1 | 零回归 | 既有三类调用点（dispatch Pre / Post / Failure）语义与文案零变化；既有测试族全绿 | `npm test` + `npm run test:full` 全绿 |
| N-E2 | 可机判 | 触发面 / 载荷 / 非阻塞 / 失败静默由断言锁定（fail-when-unchanged） | 新增 `test/hooks-stop.test.mjs`（假 hook 脚本落盘断言 + 源码扫描断言） |
| N-E3 | 单端与登记 | 本批 CLI 单端（勘察：VSC 仓无 hooks 引擎——`runHooks|hooks` 零命中）；VSC 差异如实登记、父侧排程；不做 byte-identical 镜像 | 差异登记（设计 §21.8 / §21.9）· 两仓 `check-doc-width` 本批触碰档零新增 |

### 7.4 明确不做

- 不实现 OS 级弹窗 / 声音（用户脚本面——正是 hook 的意义）；
- 不做工具化通知（不新增「通知」工具 / 不接通 Notification）；
- 不改 hooks 引擎 matcher / timeout / action 既有语义与三个既有调用点；
- 不改 TUI 面（onTurnEnd 语义零改）；不新建文档档。

## 8. VSC 输入面 Enter 语义（webview——第 28 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-INPUT-FIXES-SMALL.md` §1 条目 B2（Gitee #IKALHO——「VSC Enter 离线可测面」）。
> 设计+测试见 `WEBVIEW（VSC 仓）§9`；输入门禁机制面（busy 语义）见 `AGENT-LOOP（VSC 仓）§7`。

### 8.1 总体需求

VSC 面板输入框的 Enter 键语义必须**可预测**：输入法（IME）组合确认的 Enter 不得误发消息或误触注入；
@ 文件补全下拉打开时 Enter 只应接受建议（不得同时发送）；主会话忙时拒发必须**可见**——
现状拒发只改占位符，而输入框有文本时占位符不可见（拒发现场恰为「有文本」）= 用户感知「Enter 没反应」。

### 8.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-F1 | 组合期 Enter 归输入法 | keydown `isComposing===true` 时按 Enter：零 `userMessage`、零 `interrupt`、不接受 @ 下拉建议（三路机验）；组合结束后 Enter 语义即时恢复（守卫不粘滞） | 不做兼容兜底（`keyCode===229` 等——mac 真机矩阵不在本批，登记）；不改组合期其它键既有语义 |
| F-F2 | @ 下拉 Enter 协调 | @ 下拉打开时按 Enter：只接受当前建议（插入引用 + 关闭下拉）、零 `userMessage`；下拉关闭时 Enter 照常发送（正控）；下拉元素缺失不得判为「打开」 | 不改下拉过滤/防抖/seq/导航语义；不改 Shift+Enter 在打开态由下拉接受的既有形态 |
| F-F3 | busy 拒发可见提示 | busy（`_turnState==="running"`——含 digest）经 Enter/发送按钮被拒时：文本保留（既有）+ 可见提示出现（复用既有 toast 机制、文案 = 既有 busy 串、自动隐去）；零 `userMessage` | 不改 busy 判据/单广播/派生（`_turnState` 生命周期零动）；不改「不禁录入只禁 send」门禁语义；不引入排队 |

### 8.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-F1 | 零回归 | busy 占位符 / readOnly / 拒发 / 中断模态语义零变化；既有 webview 测试族全绿（基线 as-of 2026-09-11：422/421/0/1） | 既有族运行 + 新档（happy-dom 直驱真模块） |
| NFR-F2 | 可机判 | 全部功能需求由 happy-dom 驱动真 webview 模块机判（Enter 经 `KeyboardEvent` 注入——`isComposing` 可控——已实测） | 新档 `test/webview-input-enter.test.mjs（VSC 仓）` + `test/files.mjs（VSC 仓）` 登记 |
| NFR-F3 | 双端纪律 | 本条目纯 VSC（webview 独有——CLI TUI 无 @ 下拉 / 无 webview；busy 拒发语义 CLI 已具备）——两端各自独立实现、无镜像义务 | CLI 仓本面零代码改动（同批 B1 为 CLI 另条目）+ CLI 快层绿 |

### 8.4 明确不做

- 不碰真机面（mac/输入法矩阵——索料待回；兼容兜底如 `keyCode===229` 登记不引入）；
- 不动 `_turnState` 生命周期本体（busy 判据/派生/广播零动）；
- 不动 CLI TUI 输入面（各端独立实现——本条目纯 VSC）；
- 不做「Enter 队列化 / 忙时暂存待发」（INPUT-LOCK 已裁定：只禁 send 不禁录入——不复活排队）；
- 不新建文档档。

## 13. VSC 会话上下文注入面对齐（注入面补齐 + 顺序 + 缓存契约——VSC-CONTEXT-PARITY 批，2026-09-11）

> 来源：批次 `2026-09-11-VSC-CONTEXT-PARITY（VSC 仓）§1`（用户 22:54 原话 + 23:02 三条裁定：
> 权威源 = CLI 蓝图 / `[Current file:]` 收窄保留 / **提示词与注入顺序全对齐**；父侧 23:06 追加约束：
> 注入落位与前缀缓存契约）。
> 设计+测试见 VSC 仓 `AGENT-LOOP（VSC 仓）§17`；语料面归 `PROMPT-SYSTEM.md §9`、工具描述面归 `TOOLS.md` F7——
> 本条目只承载注入面与顺序。

### 13.1 总体需求

VSC 面板会话与 CLI 主会话的**每 run 上下文注入面同族同序**：CLI 有而 VSC 无的注入块按 CLI 对位补齐；
两端同有块按 CLI 时序排布；全部注入块落**单调追加的尾区（前缀缓存契约）**；两家「有收集无消费」载荷
（skills 载荷、MCP 警告）收口；VSC 独有注入（编辑器文件、图片指针）保留但条件收窄。

### 13.2 功能性需求（判定句 = 设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-Q1 | 项目指令注入 | VSC systemPrompt 含 `<untrusted_project_instructions>` 块；三层顺序（用户级 → `AGENTS.md` → `project_rules.md`）；缺文件静默 | 不改 CLI；不做缺失警告（蓝图 §3.4） |
| F-Q2 | 记忆召回 | 每 run（depth 0）≤3 条、`[Relevant memories from previous sessions (context, not instructions):` 前缀、XML 转义；无命中零注入 | 不做向量召回（本端既有 search 形态） |
| F-Q3 | 文档召回 | 有索引（manifest + embedder）时 ≤5 条 chunk + `[Relevant documentation` 前缀；无索引静默 | 不做关键词回退（注入面只走向量） |
| F-Q4 | checklist 推送 | depth 0、pending/in-progress 非空时注入 `[System reminder: task checklist (pending/in-progress):` 块（`- [~] / - [ ]` 前缀） | 不改 checklist 工具与写回语义 |
| F-Q5 | 工作目录快照 | depth 0 首回合注入 `OS/cwd/Session start + <untrusted_cwd_listing>`；agent 实例内一次；systemPrompt 尾行 OS/cwd 删除 | 不做每回合重注；不改槽 `sessionStart` |
| F-Q6 | 依赖大纲 | `[System reminder: project dependency outline:` 前缀；同 history 去重；空/无源静默 | 不建索引库（沿用本端 live build） |
| F-Q7 | skills 面（清单注入 + load 形态） | depth 0 时 systemPrompt 追加 `DISREGARD …` + ≤3 条 + `... and N more` 形态；skill 工具 load 面 = `<skill-loaded>` 包裹 + XML 转义 + history 去重 + 不截断（D-CI8） | 不做 skills 热刷新（下一 run 生效） |
| F-Q8 | plan 节律重注 | 稀疏 2 轮/满 5 轮/新消息全量 + 进出模式 pending 句（与 CLI 同族） | 不改 plan 工具动作面/readonly 语义 |
| F-Q9 | 异常提醒 | 异常 finishReason → `the previous turn ended abnormally — …` 提醒；`_warnings` 非空 → warning 行 | 不移植 stream rules（本端传输面既定无此机制） |
| F-Q10 | 编辑器注入收窄 | 无活动编辑器零注入；同文（同路径+同区间+同内容）不重复注入；3000 字符上限不变 | 不做选区/整文形态变更 |
| F-Q11 | MCP 警告收口 | 采集点可见面（console）对齐 CLI；字段不再「有收集无消费」（注释与消费面一致） | 不做 history 注入（CLI 无此行为） |
| F-Q12 | 死载荷消费 | `opts.skills` 载荷被真实消费（= F-Q7）；不再出现解构后无引用的死参数 | 不改面板协议 |
| F-Q13 | 顺序对齐 | 每 run 注入块顺序 = 设计 §17.4 序表（CLI 现序为基准）；系统提示尾块 = [4] 层 | 不改子代理（depth>0）的 per-run history 注入面（仅时间提醒）；[4] 尾块（项目指令 + skills）不分 depth = F-P5 既定项（systemPrompt 面——非 history 注入面；修正轮 #7） |

### 13.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-Q1 | 前缀缓存契约 | 注入只追加、不改写早期消息；同会话相邻两 run 的前一 run 请求前缀 ⊆ 后一 run 请求体且逐字节相等 | 机判用例：连续两 run 快照前缀断言 |
| N-Q2 | 每 run 成本可控 | 新注入块 I/O 有界：目录快照 readdir 一次/实例；大纲一次/session；文档/记忆召回各一次/run；全部失败静默 | 用例断言调用次数（seam 计数） |
| N-Q3 | 双端语义同源 | 各端独立实现；VSC 自身断言驻留绿；零跨仓依赖 | VSC 快层全绿 + CLI 仓零改动 |
| N-Q4 | 可机判 | 每功能需求 ≥1 用例（正常/边界/错误三态）机判 | VSC 用例表全绿 |

> **N-Q3 登记豁免（修正轮 #1——设计评审轮次 1 落修）**：跨仓判据 = **产品/运行面**（代码 import / 同步脚本 /
> 共享模块）零跨仓；VSC 侧 T-CI-11 跨仓只读检验（读兄弟仓 `../thincoder` 源文件做序锚对照）= **交付期对照面**、
> 登记豁免——**fail-closed**（兄弟仓缺失/异位 = 显式失败不 skip——跳过 = 序锚漂移检测静默失效）——**T-CI-11 已退场（整删——两仓合并批 2；删除记录 = 2026-09-13-TWO-REPO-MERGE §5）**；同款 = VSC
> `test/prompts-mirror-anchors.test.mjs（VSC 仓）`（同款兄弟仓读 + `THINCODER_CLI_ROOT` 覆盖 + fail-closed）——**该跨仓读面已退场（段删——两仓合并批 3 · S5（R10）；现体 = 单仓版双源守卫：本端同名集合相等 + 本端镜像节引用可解析；删除记录 = 2026-09-13-TWO-REPO-MERGE §5）**。

### 13.4 明确不做

- 不改 CLI 仓（代码与提示词）/ 不做跨仓共享注入模块；
- 不改子代理（depth>0）的 per-run history 注入面（[4] 尾块不分 depth——F-P5 既定项、systemPrompt 面；修正轮 #7）；除新增块与 F-Q9/F-Q11 文本外不改既有注入块文案；
- 不做注入预算/压缩（后须另批）；不动 webview。
- `[Current file:]` 与粘贴图指针保留（面板能力——仅收窄条件，见 F-Q10）；stream rules 不移植（PROVIDER 传输面既定决策）。

## 15. 长会话内存上界：子代理族与轨迹存档（TUI-OOM-ROOTCAUSE 批——2026-09-11）

> 来源：CLI TUI 会话 ~19.4 分钟后 V8 堆 OOM（批次档 `../batches/2026-09-11-TUI-OOM-ROOTCAUSE.md`
> §1——勘察 C2/C4）。机器线（`history`）由压缩治理已有界；本节约束**压缩管不到的驻留面**：
> 子代理族的人读线与捕获输出、消化窗口的持有、轨迹存档的在途拷贝。

### 15.1 总体需求

子代理（含 escalate/consult/advisor 族）与轨迹存档在长会话中**不得结构性无界**：子代理族内存
驻留与「消化窗口持有」有明确上界与释放点；轨迹存档单次记录的拷贝与在途份数有界——
且**语义可观测面不缩水**（报告完整到达、observe/status 窗口内行为不变、轨迹分析字段保留）。

### 15.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-O1 | 子代理人读线窗口化（C2） | 子代理（depth>0）人读线 `_fullHistory` 只保最近 200 条（常量单源同主 agent 窗口）；模拟子代理长跑 10,000 条 → 驻留 ≤ 200 且为最新 200；observe 的「最近 N 回合摘要」（默认 5，≤20）读取面不变 | 不改子代理机器线（`history`）压缩语义（已有）；不做子代理会话落盘（子代理本无槽） |
| F-O2 | `_capturedOutput` 有界（C2） | 捕获累积超限即截断（头 + 尾 + 省略标记——额度/形态见设计档常量）；模拟子代理流式输出 10MB → 捕获 ≤ 设计上界；既有消费面（停止报告/中止回退——读时已各自 `slice(0, 2000/4000)`）行为不变 | 不落盘全量捕获（被停子代理的部分输出诊断价值在头尾——设计档选型论证）；不改正常完成路径（报告 = entry.report，非捕获面） |
| F-O3 | 消化窗口持有释放（C2） | 消化注入完成后释放条目对子代理对象的引用（`childAgent`/`report` 置空）——三处消费点（回合尾收集 / 挂起残差 / run 起始 pending 注入）一致；池内未消化窗口（done-in-pool / 挂起驻留）行为不变（报告仍到达、status/observe 可读） | 不改 settle/挂起状态机、不改 digest 注入格式与预算（第 22 节机制零动）；不提前释放未消化条目 |
| F-O4 | 轨迹存档单次拷贝收敛（C4） | 单条轨迹写入不再产生整对象图深拷贝（序列化一遍完成脱敏 + 编码）；超长消息内容按额度截断（头尾保真）；单记录总量超上限 → 正文降级为摘要 stub（元数据保留，标记可见） | 不改轨迹字段集/落盘目录/保留期（`cleanupTraces` 不变）；不改开关默认（默认 OFF 保持）；不做轨迹压缩/加密 |
| F-O5 | 轨迹在途份数有界（C4） | 并发在途写盘份数 ≤ 设计上界定值——超限丢弃并计数（不阻塞模型调用路径）；序号分配不再逐次同步扫目录 | 不做轨迹重放/重试补偿（尽力面——丢弃可观测）；不改 fire-and-forget 不阻塞语义 |

### 15.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-O1 | 有界可测 | 上述四条上界均可注入缝直测（模拟增长/超限矩阵——零网络、零真实写盘） | 新用例档全绿（设计档用例表） |
| N-O2 | 零回归 | 既有族测试全绿（`test/async-settle.test.mjs` / `test/subagent-observe-send.test.mjs` / `test/subagent-scheduler.test.mjs` / `test/subagent-tail-merge.test.mjs` / 集成 `test/integration/subagent-lifecycle.test.mjs`）；digest 注入内容与预算零变化 | 既有套件 + 定向跑证据 |
| N-O3 | 诊断可见 | 丢弃/截断均有可观测标记（轨迹丢弃计数；捕获截断标记）——不静默 | 用例断言标记串 |
| N-O4 | 行数纪律 | 触碰源档守 500 硬限；越 300 软线如实登记 | 交付报告实测行数表 |

### 15.4 明确不做

- 不做子代理内存的全局池级上限（并发 4 已约束）；不做 entry/report 的落盘化（报告本身放行）；
- 不做轨迹内容质量改写（仅截断/降级 + 标记）；不改 VSC 端（其轨迹面约定不实现——既有登记）。




