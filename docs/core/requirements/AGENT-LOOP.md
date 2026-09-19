# agent 主循环与子代理（AGENT-LOOP）· 核心统一子系统需求档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统需求档**（三层归属之需求层）。
> **工作流档**（需求层）= `docs/core/requirements/CORE-UNIFICATION.md` §1–§4 + §5 登记表（统一目标 / 边界原则 / 量级读数基线 / 范围边界）——本档**不复制**（D2 单一权威源）。
> **设计层** = `docs/core/design/AGENT-LOOP.md`（本子系统设计与测试）；工作流设计档 = `docs/core/design/CORE-UNIFICATION.md`。
> 建档：2026-09-13（**需求侧拆分轮**——用户 2026-09-13 明令「需求侧文档先拆」）。**不新增需求**：条文分**搬移 / 回填 / 派生**三类并逐条标来源；无现成表述者由设计裁决派生，标「**派生 · 非用户原话**」。
> 命名与层级 = **板块镜像**（`requirements/<板块>.md` ↔ `design/<板块>.md`，**同板块名**）——规则原文见 CLI 产品地图 `thincoder-cli/docs/README.md` §3.2；三层归属见同图 §3.1。
> **需求条目面**（§4 · 2026-09-14「B 轮并入」）：自 CLI 产品需求档并入的**既有需求条目正文**（编号承旧档）——**无新增需求**。

## 1. 总体定位

agent 主循环与子代理 = 主循环（`agent.mjs`）**+** 装配 / 提醒 / 收尾（`agent/*`）**+** 子代理与异步（`agent-tools/subagent*` · `async-settle`）**+** 挂起与唤醒 **+** 权限 **+** hooks **+** 推理档位与模型引用 **+** 探索蒸馏 **+** token 台账。
VSC 侧同名面多为拆档（`execute-tools` · `tool-gates` · `run-helpers` · `context-injections` · `agent-state` · `suspension.mjs`）。
本板块对本子系统的要求 = 该面归一为**核内单一实现**，端差以**注入**承载。

> 面清单与逐面裁决（分类 / 端差处置 / 前提校验 / 归属段）→ `docs/core/design/AGENT-LOOP.md` §1–§2（不复制）。

## 2. 功能性需求

### 2.1 本子系统条目

- **【派生 · 非用户原话】** 主循环与子代理面归一为**核内单一实现**：主循环本体取 CLI（并入 VSC 的 onToken 三态门 / 帧回调 / 空响应重试）；`streamRules` 归一后**两端均生效**；`subagent` 动作集以 CLI 为准（`panel` 按端差注入）；装配顺序与注入块取 CLI，编辑器上下文 / 按模型能力的 `read_image` / MCP 扩工具时机按**端注入**；收尾编排取 CLI（含 Stop 钩子）；`autoThink` 由 VSC 的**死键恢复语义**（默认 `false`）。
  源 = 设计档 `AGENT-LOOP.md` §2.1–§2.2 · §3.1 A7 / A15 / A22 / A23 · §3.2 D2。

### 2.2 适用工作流条目（回指 · 不复制）

| 条目 | 适用于本子系统的哪一面 |
|---|---|
| F11 | 对称面**进核**的准入（主循环面属「进核」集合） |
| F6 | 裁决**逐条落实**（归一后行为 = 裁决结果） |
| F12 | 凡改可观察行为 / 对外契约者**逐条提交裁定**（本面命中 ①②） |
| F13 | 对外契约面（事件语义类）变更须登记；`autoThink` 死键恢复属行为变更登记项 |
| F3 | 核内实现**只从两侧提取**（来源可追溯） |

## 3. 非功能性需求

本子系统无独立非功能条目。适用工作流条目（回指）= **N1**（未涉面不得无故回归）· **N2**（建核段两产品零改动 · 可回退）· **N3**（核独立可验证）· **N5**（单一权威源）· **N7**（零第三方依赖）· **N8**（结构尺度）。

## 4. 需求条目（自 CLI 需求档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/requirements/AGENT-LOOP.md`（356 行 · CLI 产品需求档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护）。
> **并入** = 该档中「根层所缺」的**需求条目正文**（判定句 / 范围边界 / 度量方式）——条目**编号与文本承旧档**（编号 = 既有引用锚，重编号会再制造引用漂移）。
> **批 5 补记（2026-09-15）**：另并入两份独立专题档——§4.7（`thincoder-cli/docs/_archive/requirements/SUBAGENT-OBSERVE-SEND.md`）· §4.8（`thincoder-cli/docs/_archive/requirements/ASYNC-RESULT-CONTAINER.md`）；本档旧档的 VSC 面需求节（§3 / §5 / §8 / §13）维持「不并」（见 §5）。

### 4.1 question 工具抑制（旧档 §1）

**总体需求**：抑制 question 工具过度使用与不当形态（过度提问 / 大段文字 / 一条多问），修复 VS Code 卡片渲染可读性。**确认门（routine confirmation）用普通文本回复履行**——用户直接答「可以」——question 只留给真正需要用户选择 / 输入的场景。

| # | 条目 | 内容 |
|---|---|---|
| 1 | 工具描述三锚 | question.md / VS Code question.mjs 对齐：每调用一问；单问简短（背景 / 分析放正文回复不放 question）；routine confirmations 走普通回复（仅真决策用工具） |
| 2 | 提示词 | discipline-engineering 的 Questioning Style 语义 + common 确认门段 + discipline-normal 工具表反模式列 |
| 3 | 机械限制 | question 长度 ≤100 字符、options ≤4 条——超限返回错误串，不弹卡、不调 onQuestion |
| 4 | VS Code 渲染 | `.question-text` 加 `white-space: pre-wrap` + max-height 兜底滚动 |

### 4.2 顶层 spawn / escalate / advisor 一律异步（用户裁定——旧档 §2）

- 用户 2026-09-08 裁定（同步 spawn 反复误用）：**顶层（depth-0）禁 `async:false`——一律异步**；depth>0 平台强制 sync 不受影响（平台硬规则）。快车道（用户明确指令）。
- 用户裁 a：**escalate（飞刀）/ advisor 顶层同纳入一律异步**（范围扩展）。判定句 = 三者的顶层同步例外全移除（机制参数保留，提示词与工具描述不引导）。

### 4.3 后台评审池可观测 / 可控（advisor 池接入面——旧档 §4）

**总体需求**：后台评审（独立池）与异步子代理是**同一类后台任务**，其可观测 / 可控面必须同等——模型能查到「评审在不在跑、跑了多久、第几轮、卡在哪」，能等一个**口径真实**的条件，能在对象漂移时**定向干掉旧评审**并重发。

| # | 需求 | 判定句 | 范围边界（不做） |
|---|---|---|---|
| F-B1 | 状态可查 | `subagent status`（概览与单查）覆盖后台评审池条目——含 role / status / 已跑时长 / 轮次 / reviewType（design / code）与未消化（done）态注记；两端语义同源 | 不做独立 advisor 查询工具；不改既有返回字段语义（只增字段） |
| F-B2 | 等待口径真实 | `wait_for "advisor settled"` 判据 = **评审池真实状态**（无 running / queued 评审）；条件字面与既有条件集不变（不再 0ms 误报） | 不新增条件字面；不改等待边界（超时 / 间隔不变） |
| F-B3 | 定向取消 | `subagent cancel <advisor id>` 可定向中止运行中评审（与面板 ⏹ 同源：abort 条目 controller → cancelled settle 不入 pending、不签发 token）、幂等、未知 / 已完成 id 显式报错 | 不做全停；不改 ⏹ 既有路由；不改评审取消的 token 语义 |
| F-B4 | 动作面指引一致 | `observe` / `send` 遇 advisor id 时给**明确指引**（「这是后台评审——用 status 查 / 等其自动送达」），不得回含糊的 unknown id | 不为 advisor 开 observe / send（评审无逐回合观察面） |
| F-B5 | 池满排队 | 池满（**达 advisor 生效上限**——默认 4 running）+ **异 scope** 发起 ⇒ ack 返回 `queued` + `position`（非 error）、槽释放按队首自动起跑；**同 scope** 发起 ⇒ 仍拒（文案原样）；等待口径「无 running / queued」含排队条目；排队条目 cancel ⇒ 出队 + 余项 `position` 重编号无空洞；池未满路径逐字同（零回归） | 不改池容量默认值与 `agent.poolLimits` 语义；不改「同 scope 不并发」守卫语义；不新造第二套队列（复用子代理域既有排队语义） |
| F-B6 | 取号断言（防静默覆写） | 每个 spawn 站点**必先调分配器**由运行期断言强制：未调分配器即消费 ⇒ **显式报错**（非静默覆写）；同 id 二次入池 ⇒ **显式报错**；既有链路（分配点前缀号 ≡ ack id）零回归 | 不改 id 语义与分配算法（取号公式 / 载体字段 / 池键形态零改）；不做跨进程槽持久化；不去令牌化（改动面仅核侧） |

**非功能**：NFR-B1 双端同源（两端工具面行为一致——同输入同判定；文案各自原文自持，不一致处显式登记）· NFR-B2 零回归（子代理池既有语义零变化、`wait_for` 其余条件零变化）。

**明确不做**：不改评审收敛机制本体（轮次 / cap / 铁律）· 不改评审池容量默认值（`agent.poolLimits` 独立键语义不变）· 不改「同 scope 不并发」守卫语义；「评审排队」= **F-B5**（2026-09-16 批 8 起纳入——原「不做」**撤**）· 不改子代理取号公式与 id 语义（取号断言 = **F-B6**，2026-09-16 批 8 起纳入——仅核侧加固，VSC 零写入）。

### 4.4 子代理 abort 来源标注（可诊断性——旧档 §6）

**总体需求**：子代理（及 settle 族后台任务）的**死亡报告必须自证来源**——任何 abort / 超时死亡，报告文本须标明「哪一层发起（provider / agent / settle）+ 何触发（user / timeout / cancel / stop / unknown）」——使「约 600s 死」一类不可诊断问题**一次可判**。

| # | 需求 | 判定句 | 范围边界（不做） |
|---|---|---|---|
| F-D1.1 | abort 产生点标注 | 每个 abort / 超时产生点（三层面）产出的错误对象带结构化来源（trigger + layer + detail）；词汇表由单测锁定（trigger 枚举 5 值） | 不改 abort 机制本体（何时 abort / 谁有权 abort 零改） |
| F-D1.2 | 链式传播保真 | 子代理 controller 链每一跳转发 abort 时**保留原因**——下游可判定「谁杀的」 | 不改链拓扑 / 注册 / 注销语义 |
| F-D1.3 | 死亡报告合成 | 结算 / 报告面以**单一合成器**输出死亡行：原消息前缀逐字保留 + 来源后缀；用户面与模型面同源 | 不改 digest 注入格式 / 预算契约 |
| F-D1.4 | 未知显式告警 | 无来源信号的死亡必须显式标 `unknown`（含未标注兜底）——不得静默空白 | 不做自动上报 / 遥测 |

**非功能**：N-D1.1 零回归（既有 abort / 结算 / 取消语义与文案前缀零变化，既有测试族全绿）· N-D1.2 可机判（词汇表 / 死亡行形态 / 链跳形态 / 合成点在位由断言锁定）· N-D1.3 双端（各端独立实现、语义同源；VSC 面差异如实登记）。

**明确不做**：不改 abort 机制本体与提示词语义；不做自动遥测 / 上报；不做 TUI 块面错误文案；VSC 仓改动不在本条目。

### 4.5 Stop 钩子（主会话 run 结束事件——旧档 §7）

**总体需求**：作为一个用户，我希望**每次回答结束（主会话一次执行的终止）时触发我自定义的钩子脚本**，以便离开终端时也能收到弹窗 / 声音等通知（OS 级通知由我自己的脚本实现——产品不做通知设施）。

**口径（「每回合」的精确语义）**：一次 Stop = **主会话（depth 0）一次 runAgent 执行的终止**——即用户可见的「一次回答」（含正常完成 / 撞帽暂停 / 异常终止三态）；内层工具轮**不**逐轮触发；子代理（depth > 0）不触发。

| # | 需求 | 判定句 | 范围边界（不做） |
|---|---|---|---|
| F-E1 | 触发面 | 主会话 run 终止（done / maxTurns / error 三态）各触发一次 Stop；用户中止（signal 已 abort / AbortError 展开）不触发；子代理不触发 | 不做逐内层轮触发；不做子代理 Stop |
| F-E2 | 载荷与原因 | 钩子 stdin 收到 JSON：基础骨架（event / toolName / toolArgs / result / error / timestamp）+ `turn`（链内累计轮号）+ `reason`（done / maxTurns / error）；`error` 仅 reason=error 时非空 | 不携带回答正文 / agent 对象；不新增截断策略 |
| F-E3 | 非阻塞与失败静默 | fire-and-forget：不 await、不计入回合时延；hook 命令缺失 / 超时 / 报错绝不影响主流程 | 不做失败可见面；不做重试 |
| F-E4 | matcher 面 | matcher = 工具名正则过滤，仅对工具事件生效；无工具名事件（Stop）忽略 matcher——配了 matcher 也不静默失火 | 不改工具事件的 matcher 语义 |
| F-E5 | 事件集收口 | 钩子事件集 = PreToolUse / PostToolUse / PostToolUseFailure / Stop 四类；未接线的 `Notification` 声明除名（引擎头 + 文档面） | 不接通 Notification；不新增其它事件 |

**非功能**：N-E1 零回归（既有三类调用点语义与文案零变化，既有测试族全绿）· N-E2 可机判（触发面 / 载荷 / 非阻塞 / 失败静默由断言锁定）· N-E3 单端与登记（本批 CLI 单端——VSC 仓无 hooks 引擎；差异如实登记，不做 byte-identical）。

**明确不做**：不实现 OS 级弹窗 / 声音；不做工具化通知；不改 hooks 引擎 matcher / timeout / action 既有语义与三个既有调用点；不改 TUI 面；不新建文档档。

### 4.6 长会话内存上界（子代理族与轨迹存档——旧档 §15）

**总体需求**：子代理（含 escalate / consult / advisor 族）与轨迹存档在长会话中**不得结构性无界**：子代理族内存驻留与「消化窗口持有」有明确上界与释放点；轨迹存档单次记录的拷贝与在途份数有界——且**语义可观测面不缩水**（报告完整到达、observe / status 窗口内行为不变、轨迹分析字段保留）。

| # | 需求 | 判定句 | 范围边界（不做） |
|---|---|---|---|
| F-O1 | 子代理人读线窗口化 | 子代理（depth>0）人读线只保最近 200 条（常量单源同主 agent 窗口）；模拟长跑 10,000 条 → 驻留 ≤200 且为最新 200；observe 的「最近 N 回合摘要」（默认 5）读取面不变 | 不改子代理机器线压缩语义；不做子代理会话落盘 |
| F-O2 | `_capturedOutput` 有界 | 捕获累积超限即截断（头 + 尾 + 省略标记——额度 / 形态见设计档常量）；模拟流式输出 10MB → 捕获 ≤ 设计上界；既有消费面（读时各自 slice）行为不变 | 不落盘全量捕获；不改正常完成路径 |
| F-O3 | 消化窗口持有释放 | 消化注入完成后释放条目对子代理对象的引用（`childAgent` / `report` 置空）——三处消费点一致；池内未消化窗口行为不变 | 不改 settle / 挂起状态机；不改 digest 注入格式与预算；不提前释放未消化条目 |
| F-O4 | 轨迹存档单次拷贝收敛 | 单条轨迹写入不再产生整对象图深拷贝（序列化一遍完成脱敏 + 编码）；超长消息内容按额度截断（头尾保真）；单记录总量超上限 → 正文降级为摘要 stub（元数据保留，标记可见） | 不改轨迹字段集 / 落盘目录 / 保留期；不改开关默认（默认 OFF）；不做轨迹压缩 / 加密 |
| F-O5 | 轨迹在途份数有界 | 并发在途写盘份数 ≤ 设计上界定值——超限丢弃并计数（不阻塞模型调用路径）；序号分配不再逐次同步扫目录 | 不做轨迹重放 / 重试补偿；不改 fire-and-forget 不阻塞语义 |

**非功能**：N-O1 有界可测（四条上界均可注入缝直测——零网络、零真实写盘）· N-O2 零回归（既有族测试全绿；digest 注入内容与预算零变化）· N-O3 诊断可见（丢弃 / 截断均有可观测标记——不静默）· N-O4 行数纪律（触碰源档守 500 硬限；越 300 软线如实登记）。

**明确不做**：不做子代理内存的全局池级上限；不做 entry / report 的落盘化；不做轨迹内容质量改写（仅截断 / 降级 + 标记）；不改 VSC 端。

### 4.7 子代理观测 / 注入（旧档 `thincoder-cli/docs/_archive/requirements/SUBAGENT-OBSERVE-SEND.md` · 22 行）

**总体需求**：给父 agent 对运行中异步子代理的**运行时观测与轻量引导**能力——治「父看不到中间瞎猜 + 无法中途引导」，不改变子代理隔离模型（中间内容仍不进父上下文，按需拉取）。

| # | 需求 | 判定句 |
|---|---|---|
| F1 | observe 查进度 | As a 父 agent, I want to query a running async subagent by id for its recent-activity snapshot（最近 N 条回合 / 动作摘要 + 当前工具 + turn / touched），so that I can judge whether it is progressing vs stuck without guessing |
| F2 | send 注入引导 | As a 父 agent, I want to send a message to a running async subagent, which it consumes as an ordinary input at its next turn boundary, so that I can give it direction when it is stuck / off-course |

**边界**：只对**异步池中未 settle** 的子代理（父自身 spawn 的 async 子代理）；sync / 阻塞（父在等、无法中转）与已 settle / 已 cancel 不可 send。observe 可查 running / queued / done 任意。注入不等同偏离豁免——子代理按普通用户回合接收，其内部收敛 / 审计纪律不变。

**非功能**：N1 回合错位（父只在自身回合内能调 observe / send）· N2 隔离不破坏（observe 返回摘要非全量；send 经子回合边界注入，不打断正在跑的工具）· N3 凭证纪律不变（observe / send 不读写 token / designId）· N4 双端一致（各端独立实现）。

**设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.2**（observe / send 契约行）——本档不复制。

### 4.8 async 结果容器统一（旧档 `thincoder-cli/docs/_archive/requirements/ASYNC-RESULT-CONTAINER.md` · 27 行）

**总体需求**：统一 async 子代理结果结算的**容器与记账逻辑**——消 4 处 settle 重复 / 3 族 pending 分叉 / 3 表示 done-in-pool / 信号兜底抄，统一为**池 accessor + pending 单容器 + role + settle 共享 helper + buildChildSignal**，每次加角色不再复制整段。

| # | 需求 | 说明 |
|---|---|---|
| F1 | 池 accessor 吸收双池 | 消费端统一经 `getAsyncPool(role)` 访问——底层保留双池（advisor 独立调度——**2026-09-16 批 8 ED-4 后含排队面**，见 §4.3 F-B5），accessor 吸收差异 |
| F2 | pending 单容器 + role | 3 族 pending 统一为单容器 `_pendingAsyncResults`，条目带 role 字段；consult 裸对象升格完整 entry；done-in-pool 统一表示（留池 done:true + `_inPending` 标记防重复移交） |
| F3 | settle 共享 helper | `thincoder-core/agent-tools/async-settle.mjs`——`settleAsyncEntry(parent, entry, {pool, onAccounting})`；族特有段作 hook 注入 |
| F4 | 守卫统一 | settle 守卫统一为 `!parentAborted`（严格版——覆盖 ctx.signal ∨ 条目 controller aborted） |
| F5 | consult 补信号兑底 | consult 补 `_sessionSignal` 兑底（同其余三族——修一致性 bug） |
| F6 | buildChildSignal | 兑底 `_sessionSignal ?? ctx.signal ?? null` 抄 3 处收单点 + consult 补上 |

**非功能**：N1 一致性（四族 settle 语义一致：同守卫 / 同日志 / 同分流 / 同信号兑底）· N2 实现面收敛（accessor 吸收 vs 合并池——**不合并池**、不动调度逻辑；helper 抽取 vs 逐字重复）· N3 token 根治不冲突（settleAdvisorRun 保留为 advisor 族 hook）· N4 双端一致（各端独立实现）。

**设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.7.3**（settle 统一机制）——本档不复制。

### 4.9 VSC 端对位与端差（SUBAGENT-OBSERVE-SEND · ASYNC-RESULT-CONTAINER——并入 · 2026-09-15 批 8）

**SUBAGENT-OBSERVE-SEND（VSC 仓版）**：语义同源（F1 / F2 / N1–N4 已并 §4.7）；VSC 端条目 = ① F-O3 目标边界**逐类显式错误**（send 对 queued / settled / sync / unknown）·
② F-O4 动作级分类（observe = readonly——planMode 放行、免审批；send = control——豁免审批、不入批审批分组）· ③ depth>0 不可用（子代理无异步池）。坐标（实核）＝
`thincoder-vscode/src/agent-tools/subagent-actions.mjs:276`（`SUBAGENT_OBSERVE_RECENT = 5` 摘要条数 · 行截断 160/条）· send 入队 `:349-396` · `subagent-spec.mjs`（工具描述逐字）· `tool-gates.mjs`（分类钩子）：59-67。

**ASYNC-RESULT-CONTAINER（VSC 仓版）**：语义同源（F1–F6 / N1–N4 已并 §4.8）；VSC 端条目 = ① F-A6 挂起期注入与消化面（settle → 单容器 → digest 轮驱动；中止 → 容器清不注入陈旧结果）·
② 端差——统一前 pending **5 族**（对端 3 族，含 advisor 独立族）· 池载体 = 共享 history 数组双查询（`history?._X ?? agent._X`——accessor 吸收，语义同源）。坐标（实核）＝
`thincoder-vscode/src/agent-tools/async-settle.mjs`（`settleAsyncEntry`——四族调用点 = advisor-async / consult / subagent-async / subagent-escalate-async）· `thincoder-vscode/src/extension/suspension.mjs:32-55`（挂起期单容器）· `thincoder-vscode/src/agent.mjs:66-74`。

端差差异若有 → 逐条补登记（不静默）；本档不代述对端正文（D2）。旧档 = 各自 VSC 仓需求档（一字未改 · 参照历史）。

### 4.10 CLI 侧中止丢弃提醒与终态（CLI-ASYNC-DISCARD——新增 · 2026-09-15 批 4）

**总体需求**：作为 **使用 CLI 的开发者 / 模型**，我想要 **中止（Stop / 会话中止）导致后台子代理 / 评审条目被丢弃时留下终态
并得到一次可见提醒**，以便 **知道「报告不会到达」而不必猜，并据此决定是否重派**。
症状（台账 `docs/TODO.md` 技术待办）：CLI 中止分支仍**静默清池**（`thincoder-core/agent/run-stages.mjs:168-170` ·
`thincoder-cli/src/tui/suspension-drive.mjs:260-262`），且**丢弃墓碑状态与丢弃提醒文案**在 `thincoder-core/**` + `thincoder-cli/**` 全仓零命中（该词在核内另有 4 处出现，均为其他语义——见设计档 §6.20.1 清单）。
对侧（VSC）同场景已有「墓碑 + 整批提醒 + 事件」三件套（`thincoder-vscode/src/agent-tools/async-discard.mjs`）
⇒ 本条 = **CLI 侧对称，不新语义**。

| # | 需求（能力逐条可交付） | 范围边界（明确不做什么） |
|---|---|---|
| F1 | 中止时**只清「已死」条目**——判定 = `done !== true ∧ cancelled !== true ∧ parentAborted(...)`，复用核守卫单点（零新谓词） | 不改 cancel / failed 语义；不新增判定谓词 |
| F2 | 每个被丢弃条目留 **`discarded` 终态墓碑**（跨 run 终态账本）+ 出池 + 汇总；整批**一次**提醒注入（含丢弃数 + 名单）+ **一条** `ev:discarded` | 零丢弃 ⇒ 零提醒、零事件（零噪音）；不改提醒以外的 settle 语义 |
| F3 | 中止清池在**两个生产接线点**（回合尾中止 · 挂起会话中止）都生效——任一 Stop 路径均不静默 | 收尾站（`finishSuspension`）**不接线**（无父 agent 注入目标——判据登记设计档 §6.20.1）；**不改 VSC 侧** |
| F4 | 依赖目标被判丢弃时**不再判「报告已到达」**（`depInfo` 归 `cancelled` 口径——非 AUTO 依赖者锁住等父处置，AUTO 可启动） | 不新增枚举值；不改 `describeBlockers` / `detectStall` 与依赖者文案 |

**非功能**：N1 **对称语义**（提醒文案 / 动作序 / 事件名与对侧同源；必须不同处须显式登记端差，不静默偏离）· N2 **可机检**（断言面 = 墓碑状态 / 池内容 / 提醒注入 / `ev:discarded` 计数 / 依赖终态）· N3 **尺度与可回退**（源档守 500 硬限，越 300 软线如实登记 + 拆分计划；纯增量接线 ⇒ 整批可回退）。

**设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20**（条目标号 F1–F4 / N1–N3 与批次档 `docs/batches/2026-09-15-cli-async-discard.md` §2 **三方一致**）——本档不复制。

### 4.11 回合记忆召回注入（depth-0——新增 · 2026-09-18 · TUI 假死批）

**总体需求**：作为**使用 CLI 的开发者**，我想要 **主 agent 回合（depth-0 · 非 resume）注入一条记忆召回块**，而**子代理 spawn 的子代回合不注入**（子代按需自取），以便**召回对主对话可用、且不为每次 spawn 付一次全表扫描**。

来源与依据：VSC 端条目 `docs/core/requirements/MEMORY.md:146` F-M7（depth-0 · 非 resume · 非 auto-turn）+ 迁移期参照档 `thincoder-cli/docs/requirements/AGENT-LOOP.md:283-284`（F-Q2 / F-Q3）；核心层此前**无对应条目** ⇒ 本条 = **核心层补位**。现状代码 `thincoder-core/agent/setup.mjs:101-126` 无 depth 门（同函数其余自动注入面皆有门）⇒ 与本条相抵，修复随 TUI 假死批。

| # | 需求（能力逐条可交付） | 范围边界（明确不做什么） |
|---|---|---|
| F1 | 召回注入限 **depth-0**（子代理 spawn 的子代回合不注入） | 不加配置开关；不改注入内容 / 检索路径 / limit |
| F2 | 既有「非 resume」条件保持（注入块位于 `if (!resume)` 内——现状即如此） | 不新增门类 |
| F3 | 子代仍可按需检索（readonly `code_search` / `doc_search` 在子代工具表内；`memory` 工具因工具级 readonly 不在只读子代表内 = 既有登记） | 不改工具表过滤 |

**非功能**：N1 **可机判**（两路径回合装配的注入有无 = 断言面）· N2 **零新增失败面**（注入失败静默跳过 = 现状）· N3 **auto-turn 面已满足**（实测 `thincoder-core/agent.mjs:129` `resume: resume || autoTurn` ⇒ auto-turn 回合走 resume 路径、不进召回块——2026-09-18 收正；本条不改 auto-turn 语义）。

**设计侧 = `docs/core/design/MEMORY.md` §6.10 修法 B**（批次档 `2026-09-18-tui-freeze.md` §2 三方一致）——本档不复制。

### 4.12 子代理上行通道（子 → 父 在飞提问 / 上报）（新增 · 2026-09-18 · 批 SUBAGENT-UPSTREAM-CHANNEL）

**总体需求**：作为**子代理（depth>0）**，我想要**在运行中向父（spawn 方）发一条决策级消息、且不中断自身回合**，以便命中「前提失效 / 方向冲突 / 授权边界」时**不必走到终态停报、代价整轮作废**；
作为**父（主 agent）**，我想要**在自己下个回合边界收到该消息、并能直接用 `subagent action:'send'` 答复**，以便**在飞纠偏，不必重派子代理重新勘察**。

| # | 需求（能力逐条可交付） | 范围边界（明确不做什么） |
|---|---|---|
| F-UC1 | 子侧发声面：`notify_parent({kind, message})`——depth>0 专有（五角色装配）；调用**立即返回**（零等待态） | 不给 consult / depth-0 装配；不提供拉取 / 轮询动作 |
| F-UC2 | 父侧接收面：队列 `_childUpstream` → **下一回合边界**合并注入一条 user 消息（来源 + 答复指引）；回复**复用 `send`** | 不新造下行管子；不改 `send` / `observe` / `status` 语义 |
| F-UC3 | 无答复兜底：到终态未获答复 ⇒ 受影响部分不做 + 报告如实写；队列消息**仍注入**（附「已结束」注脚） | 不做自动重试 / 超时重发 |
| F-UC4 | 射程纪律（提示词面）：两问自检（行动相关性 + 材料可读性）+ 可问 / 禁问清单 + 保守兜底 | 机制面不新增语义判定；不弱化既有「停下上报」纪律 |
| F-UC5 | 机械闸：kind 枚举 · **同一子代理在父队列中未取走（未 drain）的 ask ≤1** · message ≤1500 字符 · 父队列 ≤20 | 不做配额持久化 / 跨会话计数 |
| F-UC6 | 失败面：父不在（留队列待苏醒）· 会话终止（随会话丢弃 + 日志）· 子先结束（消息不丢）· 并发合并 · 同步子代理顺延 · 无上游明确报错 | 不做跨进程传递 / 持久化信箱 |
| F-UC7 | **默认流可用性**（2026-09-19 · 用户实证）：单子代理 · 父侧挂起（无并发回合）时，ask 须**能触发父侧一次处理**（唤醒面）使答复可在子代理结束前到达；**结构不可行 / 代价不可接受 ⇒ 降级为 note-only 通道**，且工具描述 / 提示词面的承诺与事实**同轮改准**（不许留「答复会到达」的假承诺） | 不改非阻塞地基（子代理机制上永不等）· 不新增计数 / 上限 · 不动 consult / depth-0 面 · 降级分支 = 需求改判（F-UC1 / F-UC2 / F-UC6 同步收紧，须父侧裁定） |

**非功能**：N1 非阻塞**结构保证**（无等待 / 拉取 API——子代理在机制上无法等待）· N2 零回归（既有语义与文案零变化）· N3 可机判（在场性 / 合并注入 / 三闸 / 零回归 = 断言面）·
N4 范围 = **核侧 + CLI + VSC 两端对位**（**2026-09-19 23:23 用户裁定「vsc 肯定要扩啊，否则不完整啊」**；提示词面本批零改）。

> **窗口口径（父侧 2026-09-18 15:2x 收正 · 承修正轮 id=66 上抛 1）**：F-UC5 闸一窗口 = 「**父队列中未取走（未 drain）**」——机制面不追踪「是否已答复」（唯一可观测注入 = 父 `send`；答复与任意注入不可区分）⇒ 本档措辞与设计档 §6.27.2 ③ 同源（设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27.2 ③ / §6.27.8）。

> **F-UC7 由头（2026-09-19 · 用户实证 · 父侧直接执行 · 可 revert）**：默认异步流实测——`thincoder-core/agent-tools/parent-channel.mjs:83-84` 自陈「**零等待、零唤醒**」⇒ 子代理 ask 只在父侧「下一次回合」被读到，而该回合的唤醒源通常正是**子代理自身的 settle**
 ⇒ 答复恒迟到，「在飞纠偏」（本 § 总体需求 `:210`）在默认流不成立；工具返回注 `:45-49` 自带的退路（「运行先结束 ⇒ 未获答复部分按未做上报」）即默认流实走的那条。批 = `docs/batches/2026-09-19-upstream-channel-availability.md`（台账 #104）。

**设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27**——本档不复制（D2）。

### 4.13 thinking 回传缺口（回声恒带——D-CC22）（新增 · 2026-09-20 · 批 REASONING-ECHO-GAP）

**总体需求**：作为 **thinking 模式的代理（主循环 / 评审镜像 / 端壳三站点）**，我想要**工具轮的 assistant 消息按族语义恒带 `reasoning_content` 字段**，
以便**服务端（`reasoningEcho:"required"` 族：deepseek / kimi / mimo）不在后续轮次停发推理、长会话推理连续性不被打断**。

| # | 需求（能力逐条可交付） | 范围边界（明确不做什么） |
|---|---|---|
| F-RC1 | **判定句（机读）**：`specForModel(…).reasoningEcho === "required"` 族下，工具轮响应 `reasoning` 为空时，推入机读线的该 assistant 消息满足 `'reasoning_content' in msg === true` 且 `msg.reasoning_content === ""`；`optional`（如 `glm-5.3`）/ 未声明族 ⇒ 该键**恒不存在** | 不改 provider 序列化语义（`provider/*` 零改）· 不动非工具路径（final answer）推入 |
| F-RC2 | **三站点覆盖**（单点构造 · 同一构造器）：`thincoder-core/agent.mjs`（主循环）· `thincoder-core/advisor/loop.mjs`（评审镜像）· `thincoder-vscode/src/agent.mjs`（端壳自有循环 · 2026-09-20 扩展并入） | 不新增构造点（多构造点 = 已否决项）· 端侧不复制字段字面 |
| F-RC3 | **族关系**：与 D-CC18（压缩注入）/ D-CC19（恢复读取）**同判据、不同面**；本项 = **活体推入** ⇒ 新增 **D-CC22** 行 | 不触压缩 / 恢复面代码与判据 |
| F-RC4 | **前置真机探针**（**已闭合 2026-09-20 · 实现轮 184**：6 请求 ≤ 9 · **活体形状**（尾 tool）空串 200 / 缺字段 **400** / 真值 200 · kimi 三形态 200 · mimo 不可证）：三形态 × 三族各一模型；**出现 400 ⇒ 停下上报** | 探针请求数上限（父侧授权面）· 不做自动重试 |

**非功能**：N1 零回归（glm / optional 族零改 · D-CC18 家族测试全绿）· N2 显示面零改（`history-window` 对 `""` 返 null）· N3 可机判（断言面 A-C1..A-C11）· N4 范围 = **核 + 评审 + VSC 三站点**（判定句单源 = 本节）。

> **口径收正（父侧 2026-09-20 01:1x 落笔 · 01:45 补形状限定 · 可 revert）**：① 当日 690 次调用轨迹中「缺 rc」形态 263 次全 200 · 0 error ⇒ **「一律 400」在混合形状面不成立**；
> ② **形状面单离**（实现轮探针 · 尾 `tool` = 活体形状）：缺字段 = **400（逐字 `must be passed back`）** · 空串 = 200（含推理回传） · 真值 = 200；尾 `user` 形状（设计轮探针）三形态全 200 ⇒ **触发与形状/`content` 面相关**。**修法接受面 =
 活体形状下空串 200** ✓ ⇒ 价值 = **活体 400 消除 + 推理连续性 + 同族收口**；残险 = mimo 两行（`model-specs.mjs:75/76`）凭证缺 ⇒ 不可证（保持翻面 + 登记）。（折行 = 父侧直接执行 · 可 revert）

**设计侧 = `docs/core/design/CONTEXT-COMPACTION.md` §6.10 #9 + §7 D-CC22**（判据与决策单源）——本档不复制（D2）；主循环线与端壳接线面指针见 `AGENT-LOOP.md` §6.4 / §6.18。

**批 = `docs/batches/2026-09-20-reasoning-echo-gap.md`**（台账 #109）。



## 5. 不并项与历史沿革（B 轮 · 2026-09-14）

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| §3 异步任务可见性（VSC 面板 live 块出生可靠性） | F-A1–F-A5 / NFR-A1–A3（VSC webview 面） | **VSC 面需求**——归属面为 VSC 部分（`docs/vsc/requirements/`）；旧档自述「仍住本档的 VSC 面需求节（§3 / §5 / §8 / §13）……归属面收敛触发 = 该档被后续批触碰或用户发起存量收口专项批」 |
| §5 digest 起跑可见指示（VSC） | F-C1 / NFR-C1–C2 | 同上（VSC 面） |
| §8 VSC 输入面 Enter 语义 | F-F1–F-F3 / NFR-F1–F3 | 同上（VSC 面） |
| §13 VSC 会话上下文注入面对齐 | F-Q1–F-Q13 / N-Q1–N-Q4 | 同上（VSC 面） |
| 各节「来源：批次 …」注 + 档首「迁移注记 + 移出清单」 | 批次来源指针与七节迁出记录 | 时点材料——批次档承载；迁出记录属历史留痕 |
| VSC 仓两档（`SUBAGENT-OBSERVE-SEND.md` / `ASYNC-RESULT-CONTAINER.md`）的「变更记录」与对位档头 | 一次性材料 + 历史流水 | VSC 端对位面已并 §4.9（2026-09-15 批 8）；批次档承载 |
| 变更记录 | 逐批流水账 | 历史叙述——本档自有变更记录 |

## 变更记录

- 2026-09-20（**批 REASONING-ECHO-GAP · 父侧直接执行 · 可 revert**——承用户 00:57 截图反馈 + 设计轮真机取证）：新增 **§4.13 thinking 回传缺口（回声恒带——D-CC22）**（F-RC1–F-RC4 / N1–N4 · **三站点** = 核主循环 + 评审镜像 + 端壳）；
  **口径收正**（01:45 补形状限定）= 混合形状面「一律 400」不成立 · **活体形状（尾 tool）缺字段 = 400** / 空串 = 200；价值 = **活体 400 消除 + 推理连续性**；残险 = mimo（保持翻面 + 登记）。本档 261 → **284 行**（实测 · 折行 = 父侧直接执行 · 可 revert）。

- 2026-09-18（**批 SUBAGENT-UPSTREAM-CHANNEL · 父侧直接执行 · 可 revert**——承用户 2026-09-18 14:49 提议「子侧有没有必要向父侧发消息或者问问题」；14:51「立批吧」）：新增 **§4.12 子代理上行通道**（F-UC1–F-UC6 / N1–N4）——设计侧 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.27。
  - 2026-09-18 16:1x 父侧直接执行：**§4.12 位置收正**——原误置于「§5 不并项与历史沿革」之后，移回 §4 序列（§4.11 之后）；承设计评审 id=69 发现 6。

- 2026-09-13：建档——自 `docs/core/requirements/CORE-UNIFICATION.md` 拆分（来源：§2 F11 / F6 / F12 / F13 回指）+ 设计档 `AGENT-LOOP.md`（§2.1–§2.2 · §3.1 A7 / A15 / A22 / A23 · §3.2 D2 派生）；**无新增需求**。
- 2026-09-14（**B 轮并入 · 试点批**）：新增 §4 **需求条目**（question 工具抑制 / 顶层一律异步 / 后台评审池可观测可控 / abort 来源标注 / Stop 钩子 / 长会话内存上界——自 `thincoder-cli/docs/requirements/AGENT-LOOP.md` 逐节比对后并入需求正文；**编号与文本承旧档**）；新增 §5 **不并项与历史沿革**（VSC 面需求节 4 处 + 时点材料 + 变更记录）；**本档新增需求 0**（纯回填）。本档 41 → **140 行**。
- 2026-09-15（**迁移批 · 第 5 批 · 并入 · eng-designer**）：新增 §4.7 **子代理观测 / 注入**（旧专题档 `thincoder-cli/docs/_archive/requirements/SUBAGENT-OBSERVE-SEND.md`）+ §4.8 **async 结果容器统一**（旧专题档 `thincoder-cli/docs/_archive/requirements/ASYNC-RESULT-CONTAINER.md`）
  ——编号与文本承旧档；设计侧指针按批 5 拆分面改指（`AGENT-LOOP-SUBAGENT.md` §6.7.2 / §6.7.3）；**本档新增需求 0**（纯回填）。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：新增 §4.9 **VSC 端对位与端差**（SUBAGENT-OBSERVE-SEND F-O3/F-O4 · ASYNC-RESULT-CONTAINER F-A6 + 端差——自两 VSC 仓需求档并入；坐标实核）；§5 登记 VSC 两档批次材料；**本档新增需求 0**（纯回填）。
- 2026-09-15（**批 4 CLI-ASYNC-DISCARD · eng-designer**）：新增 §4.10 **CLI 侧中止丢弃提醒与终态**（F1–F4 / N1–N3）——台账技术待办一条（CLI 侧无「子 agent 被丢弃」提醒与丢弃终态，与 VSC 不对称）；**本档新增需求 1**（自 B 轮以来首次非纯回填增条）。本档 186 → **207 行**（实测）。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-4）：§4.3 新增 **F-B5 池满排队**（异 scope 入队 / 同 scope 仍拒；判定句含 position / 自动起跑 / 取消重编号 / 零回归）+ 撤「不做评审排队」句（范围边界同句重写）；源 = 设计档 `AGENT-LOOP-SUBAGENT.md` §6.10。本档 207 → **209 行**（`wc -l` 实测）。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-5）：§4.3 新增 **F-B6 取号断言（防静默覆写）**（漏调分配器即消费 ⇒ 显式报错 / 同 id 二次入池 ⇒ 显式报错 / 既有分配点前缀号 ≡ ack id 链路零回归）；
  范围 = 仅核侧（不改 id 语义与分配算法）；源 = 设计档 `AGENT-LOOP-SUBAGENT.md` §6.21。本档 209 → **211 行**（`wc -l` 实测——F-B6 行 +1 · 变更记录 +1）。
- 2026-09-16（**批 8 ENGINE-DEBT · 补充收正 · eng-designer**）：§4.3 F1 说明括注「advisor 无队列独立调度」→「advisor 独立调度——批 8 ED-4 后含排队面」（与 F-B5 · 设计档 `AGENT-LOOP-SUBAGENT.md` §6.10 对齐——残留旧语义清理，该行改写净零）；本档行数 **+1**（变更记录行）——复测 **213 行**。
- 2026-09-18（**TUI 假死批 · 父侧直接执行**）：新增 §4.11 **回合记忆召回注入（depth-0）**（F1–F3 / N1–N3——**核心层补位**；依据 = VSC 端条目 `docs/core/requirements/MEMORY.md:146` F-M7 + 迁移期参照档 F-Q2/F-Q3）；源 = 批次档 `docs/batches/2026-09-18-tui-freeze.md` §2 与设计档 `MEMORY.md` §6.10 修法 B。

