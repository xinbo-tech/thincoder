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


## 5. digest 起跑可见指示（VSC——第 21 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-INDEX-PERCEPTION.md` §1 条目 B6 + VSC 仓 `docs/TODO.md`
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
- 不把该元素并入任务活动块族（`.thincoder` 活动块 = 子代理族；本元素 = 生命周期指示——同「压缩状态行」先例）。

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
| NFR-F2 | 可机判 | 全部功能需求由 happy-dom 驱动真 webview 模块机判（Enter 经 `KeyboardEvent` 注入——`isComposing` 可控——已实测） | 新档 `test/webview-input-enter.test.mjs` + `test/files.mjs` 登记 |
| NFR-F3 | 双端纪律 | 本条目纯 VSC（webview 独有——CLI TUI 无 @ 下拉 / 无 webview；busy 拒发语义 CLI 已具备）——两端各自独立实现、无镜像义务 | CLI 仓本面零代码改动（同批 B1 为 CLI 另条目）+ CLI 快层绿 |

### 8.4 明确不做

- 不碰真机面（mac/输入法矩阵——索料待回；兼容兜底如 `keyCode===229` 登记不引入）；
- 不动 `_turnState` 生命周期本体（busy 判据/派生/广播零动）；
- 不动 CLI TUI 输入面（各端独立实现——本条目纯 VSC）；
- 不做「Enter 队列化 / 忙时暂存待发」（INPUT-LOCK 已裁定：只禁 send 不禁录入——不复活排队）；
- 不新建文档档。

## 9. VSC async 子代理保真：丢弃可见 / 无孤儿 / 终态可辨（VSC——GitHub #6——第 35 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-ASYNC-PARITY.md` §1（GitHub #6 · GCZ-jpg 2026-09-06：
> 「新消息把还在跑的子代理杀了——修复只落在了 CLI，扩展端没同步到」+ 2026-09-06 真实事故：
> eng-coder 写一半被杀无报告 / explore 零产出 / 主会话误读「已消费」）。
> 设计+测试见 VSC 仓 `AGENT-LOOP（VSC 仓）§12`（VSC 仓无 requirements 树——需求落本档，先例 §3/§4）。

**现场复核前置（2026-09-11 设计勘验——issue 断言不得直接当任务派）**：issue 四根因中两条的**机制面在现行树已不成立**——
① 「async spawn 返回 raw object」：spawn ack 早已是 JSON 字符串（VSC `agent-tools/subagent-async.mjs:326/342`，
与 CLI `agent-tools/subagent-run.mjs:193/201` 对位），且被工具契约测试锁定（`test/batch-doc-gate.test.mjs:79`）；
④ 「空池恒返 `{done:true}`」：`check` 动作已随 §19.8（2026-09-06）删除（结果仅自动通道）。
而**症状面仍真实**：中止（Stop）导致的丢弃静默、孤儿（存活子代理脱离池）报告静默丢失、终态误读——
落点即下列 F-G1~F-G7（逐条机制证据见设计档 §12.1 复核表）。

### 9.1 总体需求

用户（VSC 面板使用者）的后台异步子代理在主会话被中止（Stop）或会话收尾时，必须**有据可查、有终可判**：
被杀（丢弃）的子代理不得静默消失——模型与用户都能知道「谁被杀、报告不会到达」；**不得留下仍在运行却已脱离池的孤儿**
（其报告静默丢失）；事后按 id 查询必须能区分「已丢弃 / 已取消 / 已送达 / 从未存在」，不得把丢弃读成「结果已消费」。
同时锁死工具结果契约：异步 spawn 返回的字符串可解析出 id（模型拿得到 id），工具返回**非字符串**必须响亮失败——
不得静默变 `[object Object]`。

### 9.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-G1 | spawn ack 契约锁定 | async spawn（running / queued 两形态）工具结果为**字符串**且 `JSON.parse` 得 `{id, role, status}`——id 与池条目一致 | 不改 ack 字段集/命名；不做 id 类型归一（两端差异登记） |
| F-G2 | 非字符串工具结果响亮失败 | 工具返回非字符串（对象/null/undefined/数字）时：工具结果 = 可见 `Error:` 串并点明「must return a string value」；池/调度/落盘零副作用 | 不改正常字符串路径；不把对象静默 JSON 化当兜底 |
| F-G3 | 丢弃必留痕（模型可见） | 中止导致条目出池（丢弃）时：整批**恰一条** user-role 提醒，列每个被丢弃条目的 `role#id` 与当时状态，并明说报告不会到达；零丢弃 → 零提醒 | 不改 ⟦ev⟧ 事件族与 webview 文案；不改既有 cancel 提醒文案 |
| F-G4 | 无孤儿（清池只清已死） | 中止分支只清「已死」条目（子信号或条目 controller 已中止）；**存活条目留池**且 `history._asyncSubagents` 仍持该 Map；**已完成未取回（done-in-pool）条目不被清** | 不中止存活条目（F-6 裁定：Stop 不停后台池）；不改 ContinueError / interrupt 分支语义 |
| F-G5 | 会话不因中止轮搁置后台池 | 会话内 digest 轮被 Stop 中止（AbortError）→ 会话继续驱动（池 live 即继续等待/消化），不退出不搁置；非用户中止异常照旧上抛 | 不改会话退出条件（池空/无 pending 自然退出）；不吞非 AbortError |
| F-G6 | 终态可辨（status 面） | `subagent status <id>` 对已丢弃 / 已取消 / 已送达 / 失败条目回显对应终态 + 注记（不再回 unknown）；**从未存在**的 id 仍回 unknown | 不改无 id 概览形态与 running/queued 字段；不改 cancel / observe / send 判定 |
| F-G7 | dependsOn 面停靠对齐 | 丢弃条目落终态记录后，依赖它的后续 spawn 走 `cancelled` 分支（依赖者驻留标 depc 等父决定）——不得静默放行、不得冒 unknown 硬错 | 不给调度器新增 state 值；不改 depc 文案与 AUTO 放行规则 |

### 9.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-G1 | 零回归 | 既有异步族测试全绿（async-visibility / subagent-observe-send / subagent-id-counter / chat-panel / webview-turnstate / digest-visibility / advisor-guard-completion）；webview 面零改动 | `npm test`（快层）全绿；`webview/` 文件零 diff |
| N-G2 | 可机判 | 每条功能需求由新增档 `test/async-parity.test.mjs` 机判（真模块直驱：discard helper / finalizeAgentTurn / status 动作 / 桩面板 suspensionSession / executeToolBatches） | 新档全绿 + 反例（修前红）可复现；登记 `test/files.mjs` |
| N-G3 | 对位与登记 | CLI 面代码/测试零改动；两端差异逐条登记（Stop 语义：CLI 全停清池 vs VSC F-6 只停轮留存活的；CLI 无丢弃提醒与丢弃终态记录） | 设计档 §12.8 差异表；CLI 仓 `git status` 零改动自证 |
| N-G4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；实现档行数守 500 硬限（撞线停下报告，不带代偿） | `node scripts/check-doc-width.mjs` 两仓 + 行数实测表（设计档 §12.4） |

### 9.4 明确不做

- 不改 CLI 仓代码与测试（只读对位）；不修 **advisor 池**同构问题（同一中止分支的 `_asyncAdvisors` 面——登记设计档 §12.8，父侧排程）——**（收口 2026-09-11：群 B 批承接——本档 §11 F-I1。）**；
- 不重开 F-6 语义（不恢复 Stop 全停）、不动 INPUT-LOCK / 忙态 / 挂起会话既有裁定；
- 不改 webview 呈现（块/行/⟦ev⟧ 事件族——他批面）、不新增块状态、不新增工具动作（`status` 只扩终态回显）；
- 不做跨会话（扩展重载 / 会话切换）后的丢弃追溯——终态记录沿 history 会话级存活；
- 不新建文档档。

## 10. VSC webview Markdown 行内代码：字面量契约与转义回归（VSC——GitHub #7——第 34 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-WEBVIEW-ESCAPE.md` §1（GitHub #7 · zacharyyyang 2026-09-08：
> 「行内代码中的 HTML 标签未转义，导致后续回复隐藏，看起来像任务中途停止」——复现 = 合成 markdown，不依赖模型 / 网关）。
> 设计 + 测试见 VSC 仓 `WEBVIEW（VSC 仓）§10`（VSC 仓无 requirements 树——需求落本档，先例 §3/§4/§8/§9）。

**现场复核前置（2026-09-11 设计勘验——issue 的 file:line 与根因不得直接当任务派）**：issue 定位的
「`md()` / `mdInline()` 未转义插入」对发布版 0.8.10 成立、对现行树**不成立**——`webview/md.js` 已于
2026-09-05（VSC 仓 `a3aea39`）重写为 esc-first 架构（先整体转义、再内联构建），issue 的最小复现在
现行树输出 `&lt;script …&gt;`（无字面 `<script`；旧版逐字节复现与对拍证据见设计档 §10.1）。
**而 issue 修法方向 1 的实质目标——行内代码内容不被后续 Markdown 替换二次处理——在现行树仍未满足**
（证据：设计档 §10.1 复核表 R-2）——落点即下列 F-H1~F-H4。

### 10.1 总体需求

VSC 面板回复里的**行内代码**必须按字面量呈现，且渲染管线**不得吞掉任何内容**：代码里的 HTML 标签 /
尖括号 / `&` 以文本显示（不是元素）、代码里的 `**`/`*`/`~~`/链接/图片标记不被解释、代码之后的内容
完整可见（issue 的「像中途停止」= 渲染截断，实际会话记录完整）；代码范围之外的原始 HTML 一律按
文本转义（无 passthrough）。

### 10.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-H1 | 行内代码字面量 | 行内代码内容不参与 Markdown 解释：`` `**x**` `` 输出 `<code>**x**</code>`；`` `*x*` `` / `` `~~x~~` `` 同规；代码内的链接 / 图片标记保持字面（`<code>` 内零 `<a>` / `<img>` / `<strong>` / `<em>` / `<s>`） | 不改 fenced 代码块 / 表格结构 / 链接 / 列表语义；不发散为 CommonMark 全集（多反引号围栏、代码内反斜杠折叠、多行段 `<br>` 形态——现状保持并登记） |
| F-H2 | HTML 转义（代码内与代码外） | 行内代码含 `<script …>` / `<style>` / `<textarea>` / `<img onerror=…>` 时输出 `/<(script\|style\|textarea)/i` 零命中；`&` / `<` / `>` 以 `&amp;` / `&lt;` / `&gt;` 文本呈现 | 不改 esc-first 架构与转义字符集（`&<>"`）；不新增 raw HTML passthrough |
| F-H3 | 后续内容完整可见 | issue 最小复现（行内代码含 `<script type="application/ld+json">` + 后段）输出含后段文本且无字面 `<script`；裸 `<script>` / `<img onerror=…>` 亦为文本 | 不做历史消息重渲染；不改流式 rAF 渲染时机与滚动 |
| F-H4 | 单实现点覆盖全调用面 | `md()` / `mdInline()` / 表格单元格 / 引用块 / 列表（含嵌套·任务项）/ 标题各行内代码路径同契约（同一 `inline()` 实现点——mdInline 零额外改动） | 不新增第二套内联渲染器；不改块级解析次序 |

### 10.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-H1 | 零回归 | 既有快层全绿（基线 as-of 2026-09-11：tests 447 · pass 441 · fail 0 · skip 6）；**语料对拍范围内**，代码范围之外的渲染输出与修前逐字节一致（差异全部落在 `<code>` 内）；**跨界配对族例外**（代码段内标记与段外标记配对型——保护契约的预期后果，差异可外溢到 `<code>` 之外；按设计 §10.6 T-H15 字面量白名单机判 · §10.8 登记） | 快层运行 + 设计档 §10.1 行为差异表 + T-H15 白名单断言 |
| N-H2 | 可机判 | 每条功能需求由新增档 `test/md-render-escape.test.mjs` 机判（纯函数直驱 `webview/md.js`——渲染器无 DOM 依赖）；登记 `test/files.mjs` | 新档全绿 + 档内登记自断言 |
| N-H3 | 双端纪律 | 纯 VSC（CLI TUI 无 webview 渲染器）——CLI 仓代码 / 测试本批零改动；无镜像义务 | CLI 仓代码 / 测试路径（`src/` · `test/`）本批新增 0（交付时 `git status --porcelain -- src test` 与开档快照差集为空——批次档 §2 修正块） |
| N-H4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；`webview/md.js` 守 ≤500 硬限（现 261 行） | 两仓 `node scripts/check-doc-width.mjs` |

### 10.4 明确不做

- 不改 fenced 代码块 / 表格结构 / 链接 / 列表 / 标题既有语义（各自已成形的面）；
- 不引入 raw HTML passthrough（保持「全转义」策略——待裁 2 裁定 = 保持）；
- 不做 CommonMark 全语义对齐（多反引号围栏、代码内反引号、实体与制表符细节不在本批）；
- 不重渲染历史消息；不改流式节流与滚动；
- 不做发布面（版本号 / CHANGELOG / Marketplace 发布——0.8.10 用户可见的旧行为依赖下次发布，父侧排期）；
- 不新建文档档。

## 11. VSC 评审链 / 异步残留收口（群 B——条目 B1 / B5，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §1（用户 2026-09-11 16:45「都一起做了」
> + VSC 未做项普查——条目 B1 = VSC `AGENT-LOOP.md` §12.8 #1 登记复议；B5 = `docs/TODO.md` 需求池
> 「digest 注入预算扩面」）。设计+测试见 VSC 仓 `AGENT-LOOP（VSC 仓）§15`（B1）与 `§16` + 设计档 `AGENT-LOOP.md` §22
> （B5——双端语义源）（VSC 仓无 requirements 树——需求落本档，先例 §3/§4/§9/§10）。同批 B2/B3/B4 条目
> （VSC 评审链面）需求落 `ADVISOR-CONVERGENCE.md §13`（同批分面——两份载体）。

**现场复核前置（设计勘验——登记行不得直接当任务派）**：B1 原判「登记不改」为第 35 批的**排程理由**
（advisor 池面属他批——§12.8 #1 自注「修法同 C-1~C-4，最小改动面 = 同一分支复用判定」）——复议指令下经
现场复核：缺陷实存（中止分支 `run-stages.mjs:271-277` 仍 `advMap.clear()`；advisor 条目 controller 链会话
signal——`advisor-async.mjs:259-268`，与子代理同款孤儿前提）且修法面全现成（谓词/池 accessor/墓碑/status
回显零新增）⇒ 本批**修**（完整论证见设计档 §15.1）。

### 11.1 总体需求

VSC 面板会话中，后台 advisor 评审池与子代理池享有**同一条中止不变量**：用户 Stop（非 interrupt）时，
**清池 ⟺ 该条目已死且其报告不可达**。存活评审（持会话 signal——F-6 裁定：Stop 只停当前轮）不得被静默
清出池（其报告仍应沿自动通道到达）；已完成未取回（done-in-pool）的评审报告不得被丢弃；被丢弃的评审必须
**有据可查**——模型与用户都能知道「谁被丢弃、报告不会到达、未签发 token」，事后按 id 查询能区分「已丢弃 /
已取消 / 已送达 / 从未存在」。同时，后台结果注入（digest）的**单轮累计预算**必须覆盖全部结果族与全部注入
路径——多族合并轮不得把请求体撑爆（BATCH-3 F-2 事故面），且预算记账**单源**（常量 / 判超 / 落盘一处定义）。

### 11.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-I1 | advisor 池中止收口（VSC） | 中止分支只清已死 advisor 条目：被丢弃条目出池 + `discarded` 终态记录 + **恰一条** user-role 提醒（列 `advisor#id (design\|code)` 与「报告不会到达」「未签发 token」语义）；存活条目留池（报告仍到达）；done-in-pool 留池；**零丢弃 → 零提醒零日志**；`subagent status <id>` 对丢弃 id 回 `discarded`（不再 unknown） | 不重开 §9 已交付子代理面契约（C-1~C-9 语义零改——只扩 advisor 同构面）；不中止存活评审；不做自动重发；不改会话收尾站清池（§12.8 #6 登记维持） |
| F-I2 | digest 注入预算统一（双端） | 单轮（相邻注入间 history 无其他落史）合计 ≤64K 覆盖四族（subagent / advisor / escalate / consult）与全部注入路径（派发 + 直采）；超限条目改行内清单行 + 全文落盘（落盘失败回退 inline——结果零丢失）；首条豁免（单条大报告不回归）；记账单源（共享模块一处定义常量 / 判超 / 落盘） | 不改 offloadToolResult 单条路径与阈值；不改轮界定语义（相邻注入 = 同轮）；不改各族标签文案与墓碑语义；不做跨轮累计 |

### 11.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-I1 | 零回归 | 两仓快层全绿；§9 已交付契约（提醒文案 / 终态回显 / 依赖停靠）逐字零回归；BATCH-3 既有预算用例零回归 | 两仓 `npm test`（VSC 快层含 `test/files.mjs` 全册）+ 指名用例 |
| N-I2 | 可机判 | 每条功能需求由指名档机判（扩既有档、不新立：VSC `async-parity.test.mjs` / `eng-settlement.test.mjs`；CLI `async-settle.test.mjs`） | 新用例全绿 + 修前红可复现 |
| N-I3 | 双端与文档 | B1 = VSC 单端（CLI 对位零改——差异登记）；B5 双端同语义、各端独立实现、零跨仓依赖（无 import / 无同步脚本）；两仓 `check-doc-width` 新增违规 0；实现档守 500 硬限（贴线停下报告） | CLI 仓 B1 面 `git status` 零改动；行数实测表（设计档 §15.4 / §16.4）；宽度脚本两仓 |

### 11.4 明确不做

- 不重开 F-6 裁定（Stop 不停后台池）与 §9 已交付契约（只扩 advisor 面）；不改会话收尾站清池（§12.8 #6）；
- 不改 CLI advisor 池同款面（CLI Stop = 全停——清池即诚实；§12.8 #2 登记维持）；
- 不改 pending 单容器 / park / settle 记账语义；不改 UI / webview（零 UI 面）；
- 不做跨会话（面板销毁 / 扩展重载）丢弃追溯；不建跨仓依赖、不写同步脚本；
- 本 §11 不含 B2/B3/B4 条目（→ `ADVISOR-CONVERGENCE.md §13`）；不新建文档档。

## 12. VSC 固定活动区回归：live 固定可见 · 区内原地保留（webview——活动区回归批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-ACTIVITY-REGION-RESTORE.md` §1（用户 2026-09-11 17:20 质询
> 「块为什么在会话流里」+ 17:23 裁定「加回固定活动区」）——目标 = 09-09 前段裁定 D-1 原话
> （**live 固定可见 + 一个面板**），并保留 09-11 批 10 全部可靠性机制（投递队列 / 就绪握手 /
> 终态防御）与 queued 可见性（F-2）——「干净地基上的活动区」，非补丁形态。本条目 = 批次 R1–R8
> 逐条对位（判定句回指 AC-R1..AC-R10）。
>
> **2026-09-12 修订（活动区收口批——A 方案反转）**：冻结块去向由「区内原地保留」反转为
> **终态清退 + 消化后落流**（awaitingDigest 驻留带提示 → 回收归档 `#messages`）；settled 由
> 「视同 done 即时折叠」改为 **awaitingDigest 驻留**。本 §12 的 F-J1 / F-J3 / F-J6 已随修订；
> Q1/D-A1/D-A2、§12.3#4（区上限 20）、§12.4 落流行、§12.7 T-R8、§12.8 AC-R3、§12.10 以 §16 为准
> （用户 2026-09-12 01:09「1走A」；设计 = VSC 仓 `WEBVIEW.md` §14）。
> 设计+测试见 VSC 仓 `WEBVIEW（VSC 仓）§12`（§12.1–§12.10）+ §2/§3/§5/§5.1 修订；机制面
> （挂起 UI 与中止语义）见 VSC 仓 `AGENT-LOOP（VSC 仓）§7/§10`（VSC 仓无 requirements 树——
> 需求落本档，先例 §3/§4/§5/§8/§9/§10/§11）。

### 12.1 总体需求

用户（VSC 面板使用者）的后台活动（子代理 / consult / escalate / advisor-async 活动块）必须
**live 固定可见**：块出生在会话流与输入之间的固定活动区（`#subagent-activity`），**全程不随会话流
滚动丢失**、**一个面板**（单活动区——非行面板复活）；块生命周期维持 live → frozen 两态、终态
**原地折叠**（容器与 DOM 序号不变；**2026-09-12 修订**：终态折叠后**消化回收即归档落流**——
见 §16 F-R1）；同时 09-11 批 10 的全部可靠性机制（出生必达 / 终态必现 /
块身份唯一 / 控制面不降级 / 清屏可恢复）与 queued 可见性（⏳ 头 + 取消 ⏹）语义零回归。

### 12.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R8）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-J1 | 活动区回归——live 固定可见 + 单面板（R1） | 一切出生块 parentNode === `#subagent-activity`（区尾出生）；区驻留期（live + awaitingDigest）不移动；**终态（含消化回收）归档落流**（§16 F-R1——2026-09-12 反转；原「全程不移动 / `#messages` 零 `.sub-block`」限缩为区驻留期）；区位于 messages 与面板/输入之间（index.html 结构断言）——AC-CL1 | 不做行面板复活；不做 CLI 端（原「不改扩展端协议」＝活动区回归批边界；本批消息面增补登记见 §16 N-CL1） |
| F-J2 | 可靠性零回归（R2） | 折叠原地（容器与 DOM 序号不变）；终态闭合 / 幂等守卫 / queued / 补桩 / 接管断言全绿；批 10 实现面零改（投递队列/握手/终态防御）——AC-R2 · AC-R7 | 不改批 10 实现（extension 端零改）；不重做池快照（REMOVE-POOL-SNAPSHOT） |
| F-J3 | 冻结块去向 = 消化后落流（R3——**2026-09-12 反转**） | settled → awaitingDigest 驻留（带提示——§16 F-R3）；消化回收（reclaim done）→ 出区 + 归档进 `#messages`（内容可读可展开；落点 = 消化轮边界元素之前，兄弟序保序）；无待消化终态 → 即时归档尾追；全完成后区 `:empty` 零高——AC-CL1 · AC-CL3 | 旧 DOM-move 锚链仍禁（新机制见 §16 F-R1 与 VSC `WEBVIEW.md` §14.4）；不做折后即移除（归档取代移除） |
| F-J4 | 区显隐 = 有内容才现（R4） | 空区 children == 0 且 `:empty` 规则在位（零显隐 JS）；块入区即现——AC-R4 | 不做常驻空面板；不做「有 live 才现」 |
| F-J5 | 区高度/自滚（R5） | 32vh 封顶 + 区内自滚 + pin 跟随（静态样式断言 + 近底 24px 解/重 pin）——AC-R5 | 不改 `#messages` 滚动语义；不固定高 / 不封顶 / 不 pin |
| F-J6 | 与 digest / 挂起态交互（R6——**2026-09-12 修订**） | settled → awaitingDigest 驻留（带提示）；消化回收 → 归档落流（落点随消化轮边界）；挂起期 live 固定可见；suspension 退出兜底 = 区全体（live + awaitingDigest）折叠归档落流——AC-CL1 · AC-CL3 | 不复活旧锚插链（新机制见 §16）；不改 digest 注入语义 |
| F-J7 | ⏹ 委托与 reset 语义（R7） | ⏹ 委托目标迁区后 postMessage 载荷与 preventDefault/stopPropagation 逐字不变；resetActivity 全区清（含折叠）+ 清 map——AC-R8/AC-R9 | 不改 ⏹ 可见性判据；不跨清屏保留折叠块 |
| F-J8 | 测试族更新 + 文档面（R8） | activity-flow 族改写为区语义（含 T-R13 ⏹ 委托真 chat.js 图驱动）；async-visibility 位置断言改区；webview-env fixture 区 id 回归；设计修订在位 + `check-doc-width` 新增 0——AC-R10 | 不拆测试族（就地改写）；不动群 A §11 节域 |

### 12.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| NFR-J1 | 零回归 | VSC 快层全绿；extension 端 `git diff` 空（协议零改）；trace/接管/补桩调用点在位 | 既有族运行 + 机检（AC-R7） |
| NFR-J2 | 可机判 | 每条功能需求由 happy-dom 驱动真 webview 模块机判（区出生/折叠原序/上限/显隐/自滚/委托） | 用例表 T-R1..T-R16 全绿（VSC 测试族） |
| NFR-J3 | 双端不对称 OK | CLI 单面板形态照旧（零改）；各端独立实现、语义同源（不做逐字镜像） | CLI 仓本面零代码改动（`git status` 断言） |
| NFR-J4 | 文档与行数 | 本批触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（activity.js ~313 越 300 软线——登记不拆） | 两仓宽度脚本 + 行数实测表（设计 §12.6） |

### 12.4 明确不做

- 不做 CLI 端（单面板照旧）；不动扩展端协议与实现（投递队列 / 握手 / 终态防御零动）；
- 不做行面板复活；不做跨 reload 恢复；不加新交互元素 / 新 locale 键；不动块内渲染改造；
- 不动 advisor 流内块（`S._advisorBlock` ∈ `#messages`）；群 A §11 节域零碰（A10/A13 各自批）；
- 不新建文档档。

## 13. VSC 会话上下文注入面对齐（注入面补齐 + 顺序 + 缓存契约——VSC-CONTEXT-PARITY 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-CONTEXT-PARITY.md` §1（用户 22:54 原话 + 23:02 三条裁定：
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
> 登记豁免——**fail-closed**（兄弟仓缺失/异位 = 显式失败不 skip——跳过 = 序锚漂移检测静默失效）；先例 = VSC
> `test/prompts-mirror-anchors.test.mjs`（同款兄弟仓读 + `THINCODER_CLI_ROOT` 覆盖 + fail-closed）。

### 13.4 明确不做

- 不改 CLI 仓（代码与提示词）/ 不做跨仓共享注入模块；
- 不改子代理（depth>0）的 per-run history 注入面（[4] 尾块不分 depth——F-P5 既定项、systemPrompt 面；修正轮 #7）；除新增块与 F-Q9/F-Q11 文本外不改既有注入块文案；
- 不做注入预算/压缩（后须另批）；不动 webview。
- `[Current file:]` 与粘贴图指针保留（面板能力——仅收窄条件，见 F-Q10）；stream rules 不移植（PROVIDER 传输面既定决策）。

## 14. VSC live 块 UX：流式跟滚 + 内容区高度（webview——VSC-LIVE-UX 批，2026-09-11）

> 来源：批次 `../batches/2026-09-11-VSC-LIVE-UX.md` §1（用户 2026-09-11 23:29 实测两条：live 块
> 默认显示内容头部、不跟流式输出滚动、得手动滚；live 块高度 100 → 60）。
> 设计+测试见 VSC 仓 `WEBVIEW（VSC 仓）§13`（§13.1–§13.9——现场核实/选型/契约/决策/用例/AC/边界）+
> §12.3 第 6 条高度句改指；机制面零动（本批只动 VSC webview 呈现——CLI 仓零改）。
> 本条目 = 用户实测两条逐条对位（判定句回指设计 AC-LU1..AC-LU7；VSC 仓无 requirements 树——
> 需求落本档，先例 §3~§13）。

### 14.1 总体需求

VSC 面板使用者在子代理 live 块流式输出期间**持续看到最新输出**：块内容区默认钉底跟随；用户手动
上滚即让位（不被拽回）；滚回近底后自动复钉。块内容区高度由 100px 调降为 **60px**（单块占高更小、
多块不挤会话）。跟滚语义与既有钉底族（`#messages` / 活动区 pin）同源，不新造第三种滚动模式。

### 14.2 功能性需求（判定句逐条——设计 AC 逐条回指）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-LU1 | live 块流式跟滚（U1） | 内容区追加后默认钉底（追加帧后 scrollTop = 超值——AC-LU1）；手动上滚（wheel/touchmove——近底判据 24px）后追加不回弹（AC-LU2）；滚回近底复钉（AC-LU3）；折叠（details 关闭）/已移除态零滚动副作用（AC-LU4） | 不动流内 advisor 块的既有裸钉底；不改区级 pin（`maybeScrollActivity`）；无新交互元素 / 新 locale 键 |
| F-LU2 | live 块内容区高度 100→60（U2） | `.advisor-block.sub-block .advisor-content` max-height == 60px（静态断言——AC-LU5）；基础 `.advisor-content`（advisor 流内评审块）维持 100px；chat.css 注释同步改述 | 不改 advisor 评审块高度；不改区高度（32vh）；冻结块同 60px（同族卡面统一——live/frozen 不二分） |

### 14.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-LU1 | 零回归 | VSC 快层全绿；流内 advisor 块 `_advisorScrollDirty` 路径零改；CLI 仓代码零改动 | 既有测试族运行 + `git status` 机检（AC-LU6） |
| N-LU2 | 可机判 | 每条功能需求 ≥1 用例机判（happy-dom 直驱真 webview 模块——追加钉底/让位不回弹/复钉/折叠零副作用/CSS 断言） | 新档 `test/activity-live-ux.test.mjs`（入 `test/files.mjs` 登记）全绿（AC-LU1..AC-LU5） |
| N-LU3 | 文档与行数 | 触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（activity.js ~354——越 300 软线登记）；测试面独立新档（activity-flow 486 近满不追加） | 两仓宽度脚本 + 行数实测表（设计 §13.5） |

### 14.4 明确不做

- 不做 CLI 端（CLI 无 live 块 UI——代码零改动）；不动扩展端协议与实现；
- 不动流内 advisor 块（`S._advisorBlock`）的跟滚与高度（用户原话指 live 块；如要同口径，用户一句话）；
- 不改区级 pin / 块头 / tail-3 摘要 / ⏹ 语义；不加新交互元素 / 新 locale 键；不新建文档档。

---

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

## 16. VSC 活动区收口：终态清退落流 · digest 可读性 · 块头/状态行字段对齐（webview——活动区收口批，2026-09-12）

> 来源：批次 `../batches/2026-09-12-VSC-ACTIVITY-CLOSURE.md` §1（用户 2026-09-12 走查：
> 01:03「live 块执行完没有从子agent面板清除，digest 过程远不如 CLI 清晰」· 01:09「1走A」
> （A 方案 = 终态块出活动区、内容进会话流 = CLI 语义——对 §12 F-J3 的反转）· 01:10「live 块的
> 标题信息我也希望对齐」· 01:13 Send 可见性与拒发矛盾 · 01:17「状态行那条，我也希望对齐 CLI」）。
> 设计+测试见 VSC 仓 `WEBVIEW（VSC 仓）§14`（§14.1–§14.10）+ §2/§3/§5/§5.1/§6/§7.4/§12 修订；
> 机制面（挂起 UI 与中止语义）见 VSC 仓 `AGENT-LOOP（VSC 仓）§7/§10` 修订。VSC 仓无 requirements
> 树——需求落本档，先例 §3~§15。本条目 = 批次 R1–R6 逐条对位（判定句回指 AC-CL1..AC-CL6）。

### 16.1 总体需求

VSC 面板使用者的子代理活动块**终态即清退**：live 阶段固定驻留活动区（既有语义保留）；awaitingDigest
阶段驻留并带明确提示；消化回收后**归档进会话流**（内容可读、可展开，落点与消化轮同序）；全部完成后
活动区不再常驻（`:empty` 零高）。消化轮（digest）在会话流中**可见可辨**（专属回合标签 + 每轮独立
状态元素 + turn-cap 可见行）；块头与状态行**字段级对齐 CLI**；主会话活动期 Send 按钮不再出现
「可点但必被拒」的假 affordance。

### 16.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R6）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-R1 | 终态块清退 + 落流（A 方案——R1） | settled → awaitingDigest 驻留（带提示——F-R3）；消化回收（reclaim done）→ 出活动区 + 归档进 `#messages`（内容可读可展开；落点 = 消化轮边界元素之前、保序）；无待消化终态 → 即时归档（尾追）；全完成后区 children == 0（`:empty` 零高）；会话退出兜底 = 区全体归档；reset 仅清区——AC-CL1 | 不复活 §12.4 点名的旧 DOM-move 锚链（替代机制见设计 §14.4）；不做折后即移除；不跨 reload 恢复 |
| F-R2 | digest 可读性（R2） | 每轮消化轮 = ① 专属回合标签行（i18n 落档）② 每轮独立状态元素（轮内原地更新、跨轮随流新增——跨轮漂移消除）③ 本轮 assistant 输出带回合标签（`assistantLabeled` 复位）；turn-cap 停止/自动续跑补可见行（CLI `agent-turn.mjs:188/:192` 对位——i18n 落档）——AC-CL2 | 不改 digest 注入语义与预算；不新增消息类型（cap 用既有 `digest` 族新 status 值） |
| F-R3 | awaitingDigest 块级提示（R3） | settled 未回收期间块头含对位态词（en = `done · awaiting digestion`；两 locale 落档）——AC-CL3 | 不改 ⏹/折叠语义之外的生命周期；单标志位（不建第二状态机） |
| F-R4 | live 块标题信息字段级对齐（R4） | 逐字段对位表（设计 §14.3 表 C-13）逐项落位：queued 位置/等待原因 · 当前工具 + 参数摘要 · turn 进展（`turn N/M`）· elapsed 定时刷新 · 模式词/模型（既有等价）；审批态 = 无数据源端差登记（VSC 子代理不经权限门——`execute-tools.mjs:258` depth===0）——AC-CL4 | 不新造 CLI 无的字段；不改 ⏹ 门控；不逐轮重建块（增量刷新） |
| F-R5 | 活动期 Send 可见性（R5） | `_turnState === "running"` ⇒ Send 不渲染（`display:none`——与 Stop 同派生点）；非 running ⇒ 恢复可见；Enter 出口守卫保留（拒发提示不变）——AC-CL5 | 不开「禁用态」第二形态；不改键位/toast/readOnly 语义 |
| F-R6 | 状态行字段级对齐（R6） | 逐字段对位表（设计 §14.3 表 C-15）逐项落位：状态文本段（TPM 限流等待 / 限流 429 / 服务过载重试 / 配额耗尽 / 索引进度——结构化 `statusText` 消息 + i18n + 注入缝）· ✦reasoning 段（usage 增 `reasoning_tokens`）· `turn N/M` 段（turnFrame 消息）；`scrolled N` = 端差保持（VSC 悬浮回底钮替代——设计 §14.2 M5）——AC-CL6 | VSC 独有段（goal 徽标/悬浮钮/键位提示缺失）保持；既等价段不重造（审批 attention 段等端差登记） |

### 16.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-CL1 | 零回归 + 协议登记 | VSC 快层全绿；extension 端消息面增补逐条登记（`statusText`/`turnFrame` 新消息 · `toolPanel` 增 tool 字段 · `subagent` 增 `status:"turn"` · `digest` 增 `status:"cap"`——只增不改）；CLI 仓代码零改 | 既有族运行 + `git status` 断言 + 登记表（设计 §14.3） |
| N-CL2 | 可机判 | 每功能需求 ≥1 happy-dom 机判用例（归档落点/序 · 每轮元素 · cap 行 · 块头字段 · Send 可见性 · 状态文本映射）——限流等外部态用消息注入缝 | 用例表 T-CL1..T-CL24 全绿（VSC 测试族） |
| N-CL3 | 文档与行数 | 触碰档 `check-doc-width` 新增违规 0；源档守 500 硬限（`panel-chat.mjs` 499 零余量——增行须先抽 helper，见设计 §14.6） | 两仓宽度脚本 + 行数实测表（设计 §14.6） |
| N-CL4 | 端差登记 | 各端独立实现、语义同源；端差（审批态无源 · `scrolled N` 钮替代 · ctx 绝对数 · 无人值守续跑文案 · attention 段）逐条登记不静默 | 设计 §14.3/§14.9 差异表 |

### 16.4 明确不做

- 不做 CLI 端（CLI 单面板照旧）；不做行面板复活；不做跨 reload 恢复；不改 digest 注入/预算；
- 不复活 §12.4 点名的旧加戏链（DOM move 锚链 / settle 驻留双态旧形态 / 逐行簿记 / preview·ticker）；
- 不重开 §12 其余条目（区位置/区高度/pin/⏹ 语义/批 10 机制——除 §16 明列的反转项）；
- 不新建文档档；不在本批做流内归档块的独立分页锚（页锚仍由 `.message` 承担——登记设计 §14.9）。

## 17. VSC 子代理审批面对齐：child permission gate（VSC——2026-09-12）

> 来源：批次 `../batches/2026-09-12-VSC-CHILD-PERMISSION.md` §1（用户 2026-09-12 01:16/01:17 裁定 A =
> child（depth>0）写操作走审批门——现状为「偶然的洞」：VSC 权限门要求 `depth === 0`、child callbacks 无
> permission 通道、child `runAgent` 的 autoApprove 恒 `true`）。设计+测试见 VSC 仓 `AGENT-LOOP（VSC 仓）§18`；
> 协议登记 `WEBVIEW（VSC 仓）§7.2`；门禁增量 `TOOLS（VSC 仓）§8`；R2 文档修正 = VSC 仓 `ESCALATE.md` /
> `ENGINEERING-MODE.md`（随设计落档，措辞锚见设计 §18.4 C-13）。VSC 仓无 requirements 树——需求落本档，
> 先例 §3~§16。本条目 = 批次 R1–R2 逐条对位（判定句回指 AC-CP1..AC-CP9——设计 §18.8）。
> **交界注**：§16 F-R4/N-CL4 的「审批态 = 无数据源」理由句随本批落地失实（本批即该数据源）——
> 两批核销时由父侧同步（本批不改他批档节——登记不静默）。

### 17.1 总体需求

VSC 面板使用者在 ask（手动）模式下，**子代理（depth>0）的写操作与主 agent 一样经过审批门**：权限卡带归属
（`<child key> · <tool>`）并复用既有权限卡/队列/响应机制；AUTO（autoApprove / approve-all，含轮中翻转）整树
**静默直通**（模式继承——不新造模式）；等待期间子代理活动块显示 `⏸` + `等待审批: <tool>`（CLI 面板行对位）；
覆盖 spawn 子代理与 escalate（`ESCALATE.md` 声称的权限门转发成真）；取消（⏹ / 模型 cancel / 会话中止 / Stop）释放
pending ask（deny + 卡移除）——child 不悬挂（Stop 不停后台池：child 存活、收 deny 后继续——修正轮 #2）。explore/plan（只读工具集）、
eng-coder（spawn 设计令牌预授权）、consult（只读）**审批面**零行为（手动档 child AUTO 提醒句停注 = KD-7 连带——已登记接受——修正轮 #5）。

### 17.2 功能性需求（判定句逐条——设计 AC 逐条回指；对位批次 R1–R2）

| # | 需求（批次对位） | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-CP1 | child 审批门对齐 CLI（R1） | ask 模式：coder/eng-designer 子代理写工具 ⇒ 弹卡（卡含归属 `<child key> · <tool>`）→ approve ⇒ 工具执行、child 继续；deny ⇒ child 工具结果 = 拒绝语义（对位 CLI）；auto / approve-all（含轮中翻转）⇒ 该 child 零卡直通；等待期间块头 `⏸` + `等待审批: <tool>`，resolve 后清除；escalate（sync/async）同覆盖（归属 `escalate <tag> #<id>`）；取消（⏹/模型 cancel/会话中止/Stop）⇒ pending ask 释放（deny + 卡移除）、child 不悬挂（Stop 下 child 存活——不停后台池——修正轮 #2）——AC-CP1..AC-CP6 | 不改权限模式集合；不动 depth-0 顶层审批语义；children 不启用批合并（CLI 对位：`wrapChildCallbacks` 不携批通道——候选扩展登记）；consult/explore/plan/eng-coder 审批面零行为（KD-7 连带除外——见 §17.1——修正轮 #5）；question 面 child 卡释放不做（登记） |
| F-CP2 | 文档矛盾修正（R2） | `ESCALATE（VSC 仓）:33/:79/:125/:143` · `ENGINEERING-MODE（VSC 仓）:128-130` · `TOOLS（VSC 仓）:178-180` · `AGENT-LOOP（VSC 仓）§8`（同族句）改写后与实现语义一致（机检逐字锚——设计 §18.4 C-13 清单；四处——修正轮 #1）——AC-CP7 | 不改 escalate 机制本体；不改 eng-coder token 门 |

### 17.3 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-CP1 | 零回归 + 协议登记 | VSC 快层全绿；协议增量（`permissionRequest` 增 owner/promptId · `permissionResponse` 增 promptId · 新 `permissionWithdrawn`/`subagentApproval`）只增不改、逐条登记；CLI 仓代码零改 | 既有族运行 + `git status`（CLI 仓）+ `WEBVIEW（VSC 仓）§7.2` 登记表 |
| N-CP2 | 结构 | `execute-tools.mjs` 拆 gate 层后 ≤500（as-of 506 已越硬限）；源新档 ≤300（测试档按测试档登记口径 = 不拆分——设计 §18.6 注④）（修正轮 #4）；两仓 `check-doc-width` 新增违规 0 | 行数实测表（设计 §18.6） |
| N-CP3 | 可机判 | 每功能需求 ≥1 机判用例（卡归属 / 模式继承 / 块头态 / 取消释放 / 角色域 / 文档锚）——host 直驱 + happy-dom 双面 | 用例表 T-CP1..T-CP19 全绿（含 T-CP19 Stop 释放——修正轮 #2） |
| N-CP4 | i18n | 新文案键两 locale 同步（`sub.awaitingApproval`） | 键在位 + 插值断言 |

### 17.4 明确不做

- 不做 CLI 端（CLI = 目标语义参照）；不新造权限模式 / 新对话框类型；children 批合并不做（候选扩展登记）；
- 不动 VSC 顶层（depth 0）审批现有语义（批卡协议 / approve-all / 中止释放面仅按设计 C-5/C-6 增量）；
- 不做 question 面 child 卡释放（既有缺口——登记）；不改 prompts/提示词文件；不改其他在途批的档节。



