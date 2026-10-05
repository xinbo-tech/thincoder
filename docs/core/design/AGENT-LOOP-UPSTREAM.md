# 子代理上行通道与唤醒面（AGENT-LOOP-UPSTREAM）· 核心统一子系统档（拆分面）

> 归属 = `docs/core/design/AGENT-LOOP.md` 的**机制族拆分面**——「子 → 父上行与唤醒面」族（2026-09-22 structure-debt 批 · 档面车道 · 自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出）。
> 承载节 = §6.27 全族（§6.27.1–§6.27.12.13 · 含 §6.27.8 内两段无编号提示词面文本块——队列 / 谓词 / 域文本 / 信号提示行 / VSC 对位）· **§6.32 零落笔看门狗（阈值自动上行提醒——2026-10-05 增）**。
> **节号沿用母档全局编号**——全仓既有指针**只改档名、不改节号**。
> 同三分面 = `docs/core/design/AGENT-LOOP-SUBAGENT.md`（子代理工具契约与装配面——§6.7 · §6.9 · §6.12 · §6.21–§6.26 · §6.28）；
> `docs/core/design/AGENT-LOOP-ASYNC-POOL.md`（后台异步池 / 挂起回合与 digest / 评审实例面——§6.8 · §6.10 · §6.11 · §6.18 · §6.19 · §6.20）。
> 母档 = `docs/core/design/AGENT-LOOP.md`（归属与范围 / 核模块裁决行 / 须用户裁条目 / 对外契约 / 受影响文件 / 主循环机制面 §6.1–§6.6 / 诊断与预算面 §6.13–§6.17 / 关键决策 / 沿革）。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`；需求层 = `docs/core/requirements/AGENT-LOOP.md`（§4.12 子代理上行通道 · §4.16 零落笔看门狗）。
> 建档 = 2026-09-22（structure-debt 批 · 台账 #67）：**段零改动**（迁出节逐字搬移、节号沿用）；三分前变更史 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` 变更记录（历史归记录面）。
> **2026-09-29 P2 三拆坐标注（core-hygiene 批 · §2.8 行 5）**：核 `agent.mjs` 主循环面已分档（`agent/run-start.mjs` ∕ `agent/turn-loop.mjs` ∕ `agent/chat-call.mjs`；`agent.mjs` = 105 行编排面）——本档消费单点语义句与坐标已按新档收正（随行注「三拆前」= 旧坐标）。

## 6.27 子代理上行通道（子 → 父 在飞提问 / 上报）（2026-09-18 · 批 SUBAGENT-UPSTREAM-CHANNEL · 台账 #81）

**定位**：补上子代理通信的**第三象限**。既有两象限 = 父→子在飞（`send`，§6.7.2）+ 子→父**终态**（报告 → settle → digest，§6.8）；
本条目 = 子→父**在飞**——子代理在运行中向父（spawn 方）发一条决策级消息，**不中断自身回合**。

### 6.27.1 问题陈述与现状坐标（as-of 2026-09-18 实读）

**病**：子代理在飞命中「前提失效 / 方向冲突 / 授权边界」时只有一条出路——走到终态停下上报（`thincoder-core/prompts/common.md:40-45`）；
父在子代理运行期间**收不到任何在飞信号**。代价 = 该轮上下文作废 + 父重派新子代理 + 重新勘察
（当日两例：id=53 在**已作废前提**上建成整节 §10；id=49 命中「设计 1 档真读、实况 3 档」只能终态停报）。

**现状坐标（逐处实读）**：

| # | 面 | 坐标 | 实况 |
|---|---|---|---|
| S1 | 下行在飞（父→子） | `thincoder-core/agent-tools/subagent-actions.mjs:74-75`（push `entry._injected`）→ `thincoder-core/agent/turn-loop.mjs:87`（回合边界 `consumeInjected?.(agent)`——三拆前 `thincoder-core/agent.mjs:214-218`）→ `thincoder-core/agent-tools/subagent-run.mjs:34`（`drainInjectedQueue` → `pushReal`） | ✅ 既有 |
| S2 | 上行终态（子→父） | `thincoder-core/agent-tools/async-settle.mjs:200-293`（settle）→ `thincoder-core/agent-tools/subagent-async.mjs:358-392`（`injectAsyncResult` → `pushReal`） | ✅ 既有 |
| S3 | 上行在飞（子→父） | —— | **缺**（本条目补位） |
| S4 | 子代理侧工具面 | `thincoder-core/agent/family-tools.mjs:141-175` | eng-coder `[advisor, verify, batch, subagent(勘察)]` · eng-designer `[batch, subagent(勘察)]` · coder `[verify, advisor]` · consult `[recent_changes]` · explore / plan `[]` |
| S5 | 子代理内 `question` | `thincoder-core/tools/question.mjs:20` | 无 `ctx.onQuestion` ⇒ **抛错**（子代理无交互 UI） |
| S6 | 父侧消费点 | `thincoder-core/agent.mjs:85`（`consumeInjected = null` 缺省——签名解构行；三拆前 `:96`） | depth-0 调用方**不传** ⇒ 父侧无「子→父在飞」消费点 |
| S7 | depth 门现状（§6.7.2） | `thincoder-core/agent-tools/subagent.mjs:179-181` · `subagent-actions-query.mjs:95-99` / `:229-230` · `subagent-actions.mjs:47-48` | 除 `spawn` 外全部动作 **depth-0 专有** |

### 6.27.2 四面裁定

**① 机制面**（子侧如何发声 · 父侧如何接收 · 与既有模型如何相容）

- **子侧载体 = 新工具 `notify_parent`**（单档 `thincoder-core/agent-tools/parent-channel.mjs`（已落 · 实读 **248**）导出
  `parentChannelTool` / `pushChildUpstream` / `drainChildUpstream` / 三常量）。
  **否决**「`subagent` 工具新动作 `action:'notify'`」——① 须给 explore / plan 装 subagent 工具，破「非递归」结构防线；② 与 §6.7.2 / §6.25 的**单向 depth 门**相抵（新动作方向相反 ⇒ 判定表重构）；③ subagent 描述 140+ 行，子代变体已分叉（`family-tools.mjs:86-127`）。
- **装配面** = `assembleFamilyTools` 的 depth>0 段（`thincoder-core/agent/family-tools.mjs:139-169`）——形状 = **三元链 5 分支，其中 4 处携带 `parentChannelTool`**（as-of 2026-09-18 17:3x 实读）：
   `eng-coder`（`:166`）· `eng-designer`（`:167`）· `coder`（`:168`）· **兜底段 `: []`**（`:170`——今日落 explore / plan 及未列名 role）——**四者携带**（坐标 = **修正轮 1 收正**至现盘；原记 `:165` / `:166` / `:167` / `:169` 为逐行差 1 的陈旧读数）。
  ⇒ **携带点 = 4 处**；`consult` 分支（`:168`，`[recentChangesTool]`）**不入**。**未列名 depth>0 role 落同一兜底段 ⇒ 亦装配**（语义 =「depth>0 且非 consult 皆装配」；
  今日可达 role 集由 spawn 门收束 = 五角色 + consult——`family-tools.mjs:44-54` 两 enum 并集）。**consult 不装配**（其角色语义 = 父发起的一次性会诊，父在其 settle 前不期望中途对话——登记为范围边界）。
- **父侧接收 = 队列 `_childUpstream`**（数组；条目 `{seq, from, kind, message, ts}`）+ 单调计数 `_childUpstreamSeq`——**两字段皆属载体字段集**
  （`docs/core/design/AGENT-LOOP.md` §2.3——与 `_asyncQueue` / `_asyncAdvisorQueue` 同列；VSC 形挂 depth-0 `history`）：
  读 / 写同经单点 `upstreamHolder(parent)` = ① 父字段在场 ⇒ 父对象（CLI 形主容器）② 缺 ⇒ `carrierField` 回退 `history`（命中即用）③ 两者皆无 ⇒ **建在父字段 + 载体别名**
  （`parent.history._childUpstream = parent._childUpstream`——同 `writeTombstone` 借用规则扩张句的既有形态，`thincoder-core/agent-tools/async-settle.mjs:73-83`）。
  ▸ **VSC 形后果 = 已知面（F8）**：载体吸收只解决容器跨 run 存活；**端壳自接消费点 = 已并入（2026-09-19 批 · 设计面）**（循环头调核单源——`thincoder-vscode/src/agent.mjs:179` 邻位，§6.27.12.12）⇒ VSC 形与核形同判。
  **载体分离**：不进 `_asyncSubagents`（那是「父→子」的池条目）、不进 `_pendingAsyncResults`（那是终态报告容器）。
- **与既有 `send` 相容**：**回复路径复用 `send`**（零新下行管子）——本通道只增「子→父」一个方向。
- **与池 / 异步模型相容**：池 / 队列 / 补位 / settle / digest **零触碰**；`_childUpstream` 生命周期与子代理生命周期**解耦**（子代理 settle / cancel 不迁移它）。

**② 语义面**（非阻塞往返五步 + 无答复路径）

1. 子代理在回合 T 调 `notify_parent({kind, message})`；
2. 工具**立即返回**（`{status:"queued", kind, position, note}`）——同步 push 进父队列，**零 await、零等待态**；
   ▸ **本通道不提供任何「取回复」动作**——判据同 §6.7.5 `check` 删除（不造「异步拉起再等它」的路径）；
3. 子代理继续：**不受影响的部分照常做**；受影响部分**标 pending**（提示词纪律——§6.27.8）；
4. 父的**下一回合边界**消费（`thincoder-core/agent/turn-loop.mjs:89` 邻位单点 `drainChildUpstream(agent)`——三拆前 `thincoder-core/agent.mjs:214-218`）：
   全部 pending 消息**合并为一条** user 消息注入（`pushReal`——不带 `transient`，事件落盘）；
5. 父判断 → 需要答复则 `subagent action:'send'`（id + message）→ 子下回合边界按普通指令消费（既有路径）；不需要答复则继续 / 终止子代理。

**无答复路径（兜底）**：到子代理终态仍未收到答复 ⇒ ① 受影响部分**不做** ② 终态报告如实写「未获答复 ⇒ X 未做」（现有「停下上报」纪律的自然延伸）
③ 父侧队列中未消费的消息**仍注入**（下一回合边界，附「该子代理已结束」注脚）——信息不丢、父可回溯。

**③ 射程面**（什么必须问 / 什么必须自己判——可判据分界）

**两问自检（须皆过才可问）**：

- **Q1 行动相关性**：答案会改变我的下一步行动吗？两种答案下行动相同 ⇒ **禁问**。
- **Q2 材料可读性**：答案能在本次任务的可读材料（任务书 / 设计档 / 仓内代码与文档）里找到吗？能找到 ⇒ **禁问——先自己读**。

**可问（正面清单四类）**：① 前提失效（任务书 / 设计写明的前提与实况冲突）② 方向冲突（两处要求互斥且都不可自行裁）
③ 授权边界（待做之事是否在任务域内）④ 代价性抉择（继续当前路线会作废已完成的工作）。

**禁问（负面清单四类）**：① 细节判断（命名 / 实现方式 / 代码结构 / 措辞——自己定并写进报告）② 可自查事实（文件在否 / 签名 / 测试是否通过）
③ 任务书已明示的取舍 ④ 求安心式确认。

**兜底判据**：**拿不准 ⇒ 按终态「停下上报」处置（保守），不做默认问。**

**机制面强制（可机判）**：`kind` 必填枚举 `ask|note`；**同一子代理「未 drain」的 `ask` ≤1**（`UPSTREAM_ASK_MAX_INFLIGHT = 1`——再问 ⇒ 工具报错，不投递）；
▸ **闸一窗口定义 = 「未 drain」**（判据 = 父队列中存在 `from` = 本子代理 label 的 `ask` 条目；该条目随 drain 移出队列 ⇒ 窗口关闭）——**机制面不追踪答复**
（子代理无法观测答复是否到达 ⇒ 闸门不以答复为界；提示词面同述此窗口——§6.27.8 ①②）；
`message` 长度上限（`UPSTREAM_MSG_MAX = 1500` 字符）；父队列总长上限（`UPSTREAM_QUEUE_MAX = 20`——超 ⇒ 工具报错，不静默丢）。

**④ 失败面**

| # | 情形 | 处置 |
|---|---|---|
| F1 | 父已结束回合（挂起 / idle / digest 之间） | 消息留队列 → 父**下次苏醒**（digest auto-turn / 用户回合）的回合边界注入（核形 / VSC 形同判——VSC 侧消费点已并入（2026-09-19 批 · 设计面）：§6.27.12.12） |
| F2 | 父侧会话终止（进程退出） | 无注入面——消息随会话丢弃（子代理同随会话 abort——一致性）；`child:upstream` 日志留痕 |
| F3 | 子代理先 settle / cancel | 队列消息**不删**——注入时读池状态附注脚（两形态判据点逐字见 §6.27.4「结束注脚」：池内条目 `done: true` ⇒ `has since settled`；出池 + 墓碑 `cancelled` ⇒ `has since been cancelled`；其余态**不附注脚**）；终态报告侧由「无答复兜底」承载 |
| F4 | 并发多子代理 | 父侧**单队列**，条目带 `from`（`role#id`）；同一回合边界**合并一条**注入（按入队序）——不刷屏、不丢来源 |
| F5 | 消息积压 | 双闸（单子代理未 drain ask ≤1（窗口定义见 ③）+ 父队列总长上限）；超限 = 子侧工具**明确报错** |
| F6 | 同步子代理（顶层 `async:false` / 子代内嵌套 spawn） | **单向**：消息同样入队（父侧消费顺延到阻塞工具返回后的下一回合边界，不因父在等而丢）；但**回复不可达**——`send` 契约只对**运行中异步子代理**可注入（§6.7.2 / 本档 `:51`），父在阻塞中、子在其返回前已终态 ⇒ 处置 = **父重派**（带答复的任务书）/ **无答复兜底**（子侧该部分不做 + 如实报告）。工具返回注按 `_upstream.sync` 分形（§6.27.4）；工具描述对 sync 面同述此单向性（§6.27.8 ④） |
| F7 | 无上游（`_upstream` 缺失——未接线站点 / depth-0 误调） | 工具返回**明确错误**（不静默成功） |
| F8 | **VSC 端壳（消费点已并入——2026-09-19 批设计 / 2026-09-20 批实现；§6.27.12.12）** | 端壳自持 depth-0 循环（`thincoder-vscode/src/agent.mjs:59`（as-of 2026-09-29） `runAgent` / `:206` 循环头；面板调用点 `thincoder-vscode/src/extension/panel-chat.mjs:27` / `:427`）⇒ **核 `thincoder-core/agent.mjs:223-225` 邻位的 drain 不经端壳** —— 消费点与载体面 = 端壳自接（**设计 + 实现均已落地**——设计 2026-09-19 · 实现 2026-09-20 三包）：端壳循环头调核单源 `drainChildUpstream`（`thincoder-vscode/src/agent.mjs:206`（as-of 2026-09-29） 循环头，动态 import `:162-163`）+ 载体两字段入 `CARRIER_FIELDS`（`:36-40`，12 → 14）；端壳取消 / 观察面对位 = **已对位**（取消走核单源 `executeCancelAction`（`thincoder-vscode/src/extension/panel-messages-turn.mjs:113-125`）· 观察面 = `vscSubagentFace`（`thincoder-vscode/src/agent/setup-tooltable.mjs:150-174`）；台账 #87 归档） |

### 6.27.3 方案选型对比

| # | 候选 | 判据逐项评估 | 结论 |
|---|---|---|---|
| 1 | **新工具 `notify_parent` + 父侧队列 + 回合边界注入** | ① depth>0 专有、不动既有动作面 ② 复用 `send` 作回复（零新管子）③ 非阻塞（无等待 API）④ 单容器可测 | **选定** |
| 2 | `subagent` 新动作 `action:'notify'`（depth>0 可用） | ① 须给 explore / plan 装 subagent（破非递归防线）② 与 §6.7.2 单向门相抵（判定表重构）③ 描述面二次分叉 | 否决 |
| 3 | 复用 `⟦ev⟧` token（TUI 事件通道） | 只到端侧（用户面）——**不进父上下文**，不解决「父瞎猜」 | 否决 |
| 4 | 子代理写文件当信箱（如 `docs/.child-inbox`） | 路径污染（须进 files 域 / §6.9 R26 黑名单面）+ 无生命周期 + 读写竞态 | 否决 |
| 5 | 阻塞式「子停下等父 `send`」 | 占池位空转 + 等待无界定（父可能长时不回）——**任务书明示不做** | 否决 |
| 6 | 队列挂池条目 `entry._inbox`（而非父 agent 对象） | 条目生命周期 = 子代理生命周期（settle 出池 ⇒ 消息随条目丢）——违反 F3 | 否决 |
| 7 | 注入形态用 `transient: true` | transient = 机器状态行（不进人读线 / 不落盘，`thincoder-core/session-segments.mjs:59-61`）；本通道是**事务性事件** | 否决 |

### 6.27.4 接口契约（改前 → 改后逐字）

**新档 `thincoder-core/agent-tools/parent-channel.mjs`（已落 · 实读 **248**）** 导出面：
`parentChannelTool`（工具对象）· `pushChildUpstream({parent, from, kind, message})` · `drainChildUpstream(agent)` ·
`UPSTREAM_MSG_MAX` / `UPSTREAM_QUEUE_MAX` / `UPSTREAM_ASK_MAX_INFLIGHT`。

▸ **载体吸收**（finding 4 落位 · §6.27.2 ① 载体句）：`_childUpstream` / `_childUpstreamSeq` 的读 / 写同经单点 `upstreamHolder(parent)`——
`carrierField` 自 `thincoder-core/agent-tools/async-settle.mjs` import（同层既有导出，`thincoder-core/agent-tools/advisor-async.mjs:64` / `thincoder-core/agent-tools/async-discard.mjs:35` 同式；无新静态边）。

工具 schema（改后）：

```js
{ name: "notify_parent",
  description: "<工具描述——建议逐字见 §6.27.8 ④（实现轮落笔）>",
  parameters: { type: "object", properties: {
    kind: { type: "string", enum: ["ask", "note"], description: "ask = a question whose answer changes your next step; note = an FYI that needs no answer" },
    message: { type: "string", description: "The message to deliver to your parent (one short paragraph — details belong to your final report)" },
  }, required: ["kind", "message"] },
  readonly: true }
```

▸ **只读分类 `readonly: true`**（工具对象字段——实现轮落位；判据同 `task` 工具「只改 agent 内部状态、不改外部世界」）：标为只读是本通道在 **explore / plan 子代**可用的**前提**（子代无交互 UI ⇒ 非只读会吃权限询问）。
  dispatch 分类载荷三处：① planMode 门放行（`thincoder-core/agent/dispatch.mjs:167`——`!tool.readonly` 即拒）② 免权限问询（同档 `:257`——`tool.readonly` 直过）③ 批并行分类（同档 `:483`——非只读 ⇒ 断批串行）。
  实读落点 = `thincoder-core/agent-tools/parent-channel.mjs:211`（`readonly: true`；落地理由注 = 同档 `:135-141`）；**机检锚 = `thincoder-core/test/parent-channel.test.mjs:278`**（`assert.equal(parentChannelTool.readonly, true, …)`）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

▸ **depth 门**（工具 execute 首行）：`(ctx.depth ?? 0) === 0` ⇒ 返回错误对象（与 §6.7.2 / §6.25 同款 fail-closed 形态）。

**装配接线（改后）**：

- `thincoder-core/agent-tools.mjs`（登记册，20 → **23** 行）：+ 一行 re-export——`export { parentChannelTool }`（源 = `./agent-tools/parent-channel.mjs`）；
- `thincoder-core/agent/family-tools.mjs:171-175` depth>0 段**前置** `parentChannelTool`——**4 处携带**：`eng-coder`（`:171`）· `eng-designer`（`:172`）· `coder`（`:173`）· 兜底段（`:175`，explore / plan / 未列名 role）；`consult` 分支（`:174`）不入（坐标 = **修正轮 1 收正**至现盘；原 as-of 2026-09-18 17:3x 读数逐行差 1）。

**上游接线（改后——3 站点全枚举，各 1 行 + 注）**：

| # | 站点 | 改后 |
|---|---|---|
| W1 | `thincoder-core/agent-tools/subagent-spawn.mjs:428` **邻位**（`child._logId = relayPrefix.slice(0, -1)` 之后——`relayPrefix` 于 `:451` `let` / `:457`·`:459` 定值，故 `:345` 的 `createAgent` 处引用是 **TDZ**；`buildSpawnChild` = spawn 主路径，sync + async 共用） | `child._upstream = { parent, label: relayPrefix.slice(0, -1), sync: !wantAsync }`（紧随 `:428` 落位；`wantAsync` 是本函数入参 ⇒ **sync / async 两形同点装配**，`sync` 供返回注分形（§6.27.4）） |
| W2 | `thincoder-core/agent-tools/subagent-actions.mjs:165`（escalate **sync** 的 `createAgent`） | 同式（label = `escId`；**`sync: true`**） |
| W3 | `thincoder-core/agent-tools/escalate-async.mjs:193`（escalate **async** 的 `createAgent`） | 同式（label = `escalate#<id>`；**`sync: false`**——该站点已用 `relayPrefix`，`:191`） |

▸ **嵌套天然成立**：子代内 spawn 时 `parent` = 子代自身（`buildSpawnChild(parent, …)`）⇒ 通道逐层指向上游、零特判。
▸ **consult 不接线**（`thincoder-core/agent-tools/consult.mjs:275`）——装配面已排除，工具不在场 ⇒ 零「在场不可用」诱错面。

**父侧消费点（改后）**：`thincoder-core/agent/turn-loop.mjs:89` 邻位新增一行 `drainChildUpstream(agent)`（空队列 no-op——零开销）。

▸ **import 形态 = 动态**：`const { drainChildUpstream } = await import("./agent-tools/parent-channel.mjs")` —— 实到档 = `thincoder-core/agent-tools/parent-channel.mjs`（已落 · 实读 **248**）；先例 = `injectAsyncResult`（`thincoder-core/agent.mjs:113-117`；as-of 2026-09-29）：
**不新增静态边**（登记册静态图契约 = `family-tools.mjs:12-16` / 端壳 W8 契约②）；取用一次 / 循环头就地取皆可（实现轮择一，判据 = 零新增静态 import + A2 的循环头调用点）。

▸ 与 `consumeInjected?.(agent)` 的关系：后者 = spawn 方为我（子）装的**入向**通道；前者 = 我（作为父）自身的**子代理入向**通道。同址、反向、互不干扰。
▸ 覆盖面：正常回合 / digest auto-turn / headless 直连 `runAgent` **同点覆盖**（皆为循环头）。

**注入文案（逐字——父侧所见；`message` 经 `escapeXml`）**：

单条：

```
[System reminder: in-flight message from your subagent eng-coder#57 — it keeps working on the unaffected parts. Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means the child skips that part and reports it as not done.]
ask · eng-coder#57: <message>
```

多条（同一回合边界合并）：

```
[System reminder: N in-flight message(s) from your subagents — they keep working on the unaffected parts. Answer with subagent action:'send' (id + message) if the decision is yours; an unanswered ask means that child skips the part and reports it as not done.]
- ask · eng-coder#57: <message>
- note · explore#61: <message>
```

结束注脚（drain 时读池状态——`getAsyncPool(parent, "subagent")` + `tombstoneOf`，accessor 源 `thincoder-core/agent-tools/async-settle.mjs`）——**两形态 + 一显式不附注脚**（finding 5 落位）：

| 形态 | 判据点（逐字） | 注脚文案 |
|---|---|---|
| 已 settle | 池内命中条目且 `entry.done === true`（done-in-pool 表示——§6.7.3 `:87`） | `(eng-coder#57 has since settled — see its report)` |
| 已 cancel | 池**未命中** 且 `tombstoneOf(parent, id)?.status === "cancelled"`（出池 + 墓碑——`async-settle.mjs:86-89`；写点 `:238`） | `(eng-coder#57 has since been cancelled)` |
| 其余态（`discarded` §6.20.3 / `consumed` / `failed` 墓碑，或池与墓碑皆未命中） | —— | **不附注脚**（消息本体照常注入——**不臆断状态**；`discarded` 写点 = `thincoder-core/agent-tools/async-discard.mjs:90`） |

▸ `id` 取自条目 `from` 的 `#` 后段（W1 / W2 = relay 前缀去尾；W3 = `escalate#<id>`）——该 id 即池键（`String(id)`，`subagent-run.mjs:202` / `escalate-async.mjs:297`）。

**工具返回（逐字——子侧所见）**：**两形分述**（键 = `_upstream.sync`，W1–W3 装配）——sync 形**不给「答复到达」承诺**（父在阻塞中，`send` 对已终态子代理不可达，F6）。

异步形（`sync: false`）：

```json
{ "status": "queued", "kind": "ask", "position": 1,
  "note": "delivered to your parent's queue — consumed at the parent's next turn boundary (non-blocking). Keep working on the unaffected parts; a reply arrives as an ordinary instruction at your next turn boundary. If your run ends first, report the unanswered part as not done." }
```

同步形（`sync: true`）：

```json
{ "status": "queued", "kind": "ask", "position": 1,
  "note": "queued for your parent — but it spawned you synchronously and is blocked on this run, so no reply can reach you before you end. It reads this when its call returns and may re-spawn you; report the unanswered part as not done." }
```

**错误文案（逐字）**：

- depth-0：`notify_parent is only available inside a subagent (depth > 0) — at depth 0 you talk to the user through your normal reply or the question tool`
- 无上游：`notify_parent: this agent has no parent channel (not spawned through the subagent pipeline)`
- kind 非法：`notify_parent requires kind: "ask" (a question whose answer changes your next step) or "note" (an FYI that needs no answer)`
- message 空：`notify_parent requires a non-empty message`
- message 超长：`notify_parent message exceeds 1500 chars — one short paragraph; details belong to your final report`
- 未 drain ask 在场（闸一窗口——见 ③）：`notify_parent: your earlier ask (#<seq>) is still queued for your parent — one ask at a time until the parent picks it up; fold this into your final report if you cannot continue without an answer`
- 队列满：`notify_parent: the parent's in-flight queue is full (20) — the parent has not consumed the pending messages yet; fold yours into your final report instead`

**日志面**：入队点直记一条 `logEvent("child:upstream", { id: "role#N", kind, seq })`（`thincoder-core/log.mjs`）；消费点不另记（注入动作自身已有面）。

**UI / 交互面**：零新增面板块 / 零块状态机改动；注入 = 父历史的一条 user 消息（TUI 渲染既有逻辑，用户可见 ⇒「会话面唯一 = 父侧」不被破坏）。**无 open 项**。

### 6.27.5 与既有机制的关系

| 机制 | 关系 |
|---|---|
| `send`（§6.7.2） | **回复路径**（复用）——本通道只增「子→父」方向 |
| `observe` / `status`（§6.7.2） | 互补：二者 = 父**拉**（readonly 快照）；本通道 = 子**推**（事件） |
| `panel`（§6.7.2 / §6.11） | 零关系——不进面板块面、不改块状态机 |
| 池（`_asyncSubagents` / `_asyncQueue`） | 零触碰（载体分离）；drain 时**只读**池状态做结束注脚 |
| depth 规则（§6.7.2 / §6.25） | **互补对偶**：既有「除 `spawn` 外全部 depth-0 专有」；本工具「depth>0 专有」——两面不重叠（本工具不进 depth-0 家族段） |
| 终态通道（settle → digest，§6.8） | 分离：终态 = 报告（`_pendingAsyncResults`）；在飞 = 本通道。两容器互不迁移 |
| `question`（用户面） | 不替代：`question` = 「agent ↔ 用户」（子代理内不可用，S5）；本通道 = 「子代理 ↔ 父」 |

### 6.27.6 受影响文件清单（R24a · 行数口径 = `wc -l`；**当前行数 = as-of 2026-09-18 17:3x 实测**（实现轮后复读）；Δ 列 = 批内记录值（据实回填））

| # | 文件 | 当前行数 | Δ（实测） | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/parent-channel.mjs`（本批新增） | **209** | 新增 **+209** | 通道本体（工具 + push + drain + 常量 + 载体吸收单点 `upstreamHolder`）；守 300 软线内 |
| 2 | `thincoder-core/agent-tools.mjs` | **23** | **+3**（20 → 23） | 登记册 re-export + 2 行注 |
| 3 | `thincoder-core/agent/family-tools.mjs` | **173** | **+4**（169 → 173） | depth>0 段前置 `parentChannelTool`——**4 处携带**（`eng-coder` `:165` · `eng-designer` `:166` · `coder` `:167` · 兜底段 `:169`；`consult` 分支 `:168` 不入）+ 4 行注（段内前置 ⇒ 零新增装配行） |
| 4 | `thincoder-core/agent-tools/subagent-spawn.mjs` | **473** | **+3**（470 → 473） | W1 上游接线（1 行 + 注；含 `sync: !wantAsync`；`:463` 邻位） |
| 5 | `thincoder-core/agent-tools/subagent-actions.mjs` | **495** | **+3**（493 → 495） | W2（escalate sync——`sync: true`） |
| 6 | `thincoder-core/agent-tools/escalate-async.mjs` | **302** | **+3**（300 → **302**） | W3（escalate async——`sync: false`）；**本批新增越 300 软线档**（核侧 `SOFT_LINE_REGISTRY` 已登记——见下 ▸ 越线登记） |
| 7 | `thincoder-core/agent.mjs` | **436** | **+6**（430 → 436） | 回合边界消费点一行 + **动态 import 取用**（同 `:113-117` 先例，零新增静态边）+ 2 行注 |
| 8 | `thincoder-core/test/parent-channel.test.mjs`（本批新增） | **291** | 新增 **+291** | 用例 T1–T17 + A4 导出面 + 载体吸收（19 例） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 9 | `thincoder-core/test/family-tools.test.mjs` | **131** | **+13**（118 → 131） | `ROLE_FIXTURES`（:24-56）名集 + 兜底段 / depth-0 / consult 断言 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 10 | `thincoder-cli/test/prompts-dual-source.test.mjs` | **121** | **0**（121 → 121） | `T-CL1` 计数 10 → **11** 三处同改——`:80` 口径注 · `:82` 标题串（「十节（## 块数 10…）」）· `:83` 断言与消息串（净增 **0** 行） （机检豁免——用例退场登记） |
| 11 | `thincoder-core/prompts/common.md` | **112** | **已落笔**——批内实测 **+21**（89 → 110，as-of 16:2x）；批后 **+2**（→ 112，见 ▸ 表注） |
| 12 | `thincoder-core/prompts/discipline-engineering.md` | **121** | **已落笔**——批内实测 **+2**（118 → 120）；批后 **+1**（→ 121，见 ▸ 表注） |
| 13 | `docs/core/design/prompts/common.md` | **74** | **已落笔**——批内实测 **+15**（58 → 73）；批后 **+1**（→ 74，见 ▸ 表注） |
| 14 | `docs/core/design/prompts/discipline-engineering.md` | **119** | **已落笔**——批内实测 **+2**（116 → 118）；批后 **+1**（→ 119，见 ▸ 表注） |
| 15 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | **1932** | **+333**（设计轮 1085 → 1418）· **+6**（修正轮 1 → 1424）· **+44**（修正轮 2 → 1468）· **+15**（设计档面收正轮 → **1483** 实测） | §6.27 全节 + 变更记录条目（设计轮 / 修正轮 1 / 修正轮 2 / 设计档面收正轮 各一行） |
| 16 | `docs/core/requirements/AGENT-LOOP.md` | **257** | **已落笔**——实测 **+24**（233 → 257，as-of 16:2x） | §4.12 建议文本（**父侧笔**——本档不写） |

▸ **提示词面落笔状态（finding 1 回填 · 口径 = 换行计数）**：行 11–14 **已落笔**（父侧 2026-09-18；逐字 = §6.27.8 ①–③）——批内实测 Δ：核 `common.md` **+21** · 核 `discipline-engineering.md` **+2** · 中文 `common.md` **+15** · 中文 `discipline-engineering.md` **+2**（as-of 16:2x）。
**批后同窗写入（as-of 2026-09-18 17:3x 复读 · 现盘值已按此回填）**：四档现盘 **112 / 121 / 74 / 119**——比批内读数各 **+2 / +1 / +1 / +1**。
**来源** = 批内落笔之后的同窗写面（父侧 sync 面限定句（批档 §5 `:316`）· 末次触碰 = `4e3429f2`（09-18 16:59，两份 `discipline-engineering.md` 各 +2——`git log --numstat` 实证））；**本档 / 本批零写提示词面**（父侧笔）。
逐档归因不闭合处（`discipline-engineering.md` 批内记录 120 / 现盘 121 而末次提交 +2）已入批档 §2 报告面。
**仍归实现轮**：T-CL1 计数（10 → 11——`:80` / `:82` / `:83` 三处同改）与 `notify_parent` 工具注册——两者与提示词面**同批落地**；在此之前 `prompts-dual-source.test.mjs:83` 现盘断 10 / 现盘 `##` 块数 11 ⇒ 该测**现盘红**（已知，实现轮消解，不入本批判据）。 （机检豁免——用例退场登记）

▸ **载体清单位点（finding 4）**：`_childUpstream` / `_childUpstreamSeq` 属载体字段集（核读 / 写 = §6.27.2 ① 的 `upstreamHolder` 吸收）；**端壳字段表**（`thincoder-vscode/src/agent.mjs:36-40`
 `CARRIER_FIELDS`）**已并入（2026-09-19 批 · 设计面）**（12 → 14 款 + 端壳 drain 接线；**实现已落地**——§6.27.12.12 · 2026-09-20 三包）；**端壳取消 / 观察面对位已对位**（取消走核单源 `executeCancelAction`；观察面 = `vscSubagentFace`——F8 残项③ 已消解 · 台账 #87 归档；§6.27.11-6）。

▸ **越线登记（R24a 尺寸档 · as-of 2026-09-18 17:3x 实测）**：本批**新增一个越 300 软线档** = `thincoder-core/agent-tools/escalate-async.mjs`（300 → **302**——W3 纯接线 1 行 + 注）。
**核侧已登记**：`thincoder-core/test/core-hygiene.test.mjs:32`（`SOFT_LINE_REGISTRY`）含 `agent-tools/escalate-async.mjs`（`:34`），登记注 = 同档 `:27-30`（「纯接线、不改变既有拆分结论；拆分计划归父侧另案」）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
既有已越档（本批前即越，**不变**）：`subagent-actions.mjs`（493 → **495**）· `subagent-spawn.mjs`（470 → **473**）——各 +3 纯接线，拆分立场不变（**登记同理**——同表在册）。新档 `parent-channel.mjs`（**209**）守 300 软线内。⇒ **三档拆分计划归父侧另案（登记）**。

### 6.27.7 关键决策记录

- **D-UC1（载体 = 新工具 + 父侧队列）**：否决候选 2 / 3 / 4 / 6（§6.27.3）。判据 = 非递归防线 + 单向 depth 门 + 容器生命周期。
- **D-UC2（回复复用 `send`）**：不新造下行管子；「send→settle 竞态」与「undelivered 提示」语义原样继承（`subagent-run.mjs:165-174`）。
- **D-UC3（非阻塞 = 结构保证）**：通道**不提供任何拉取 / 等待动作**（判据同 §6.7.5 `check` 删除）——子代理在机制上无法等待，「禁等待态」不只靠纪律。
- **D-UC4（射程 = 两问自检 + 正负清单 + 保守兜底）**：射程是**提示词面**纪律（§6.27.8）；机制面只强制可机判的三条闸（kind / 未 drain ask ≤1（窗口 = 未 drain，见 §6.27.2 ③）/ 长度与队列上限）。
- **D-UC5（注入形态 = `pushReal` 非 `transient`）**：判据 = 事件性（一次性、有内容、落盘有价值）vs 状态性（每轮重复的机器行）；先例 = `injectAsyncResult`（`subagent-async.mjs:383`）。
- **D-UC6（范围 = 核侧 + 提示词面——§6.27 批口径）**：VSC 端对位面**该批不做**（登记：VSC 子代理经核 `runChildPipeline` → 核 `runAgent`；装配面在其 `setup` 面）；**范围现值 = 核 + CLI + VSC 两端对位**（2026-09-19 批并入——需求 §4.12 N4 / §6.27.12.12）。
  **已知面 = F8**（端壳自持 depth-0 循环 ⇒ 核侧 drain 不经端壳）：三项（端壳 drain 接线 / 端壳载体表补字段（+ 夹具）/ 端壳取消 · 观察面对位）**均已对位**——
  前两项 = 设计 + 实现已落地（2026-09-19 · 2026-09-20 · §6.27.12.12）；第三项 = 已对位（取消走核单源 `executeCancelAction`；观察面 = `vscSubagentFace`——台账 #87 归档）。
  **核侧读 / 写按 `carrierField` 吸收**（§6.27.2 ①）——端壳面只补消费点与端壳登记，**不回改核码**。

### 6.27.8 提示词面逐字建议（**父侧已落笔（2026-09-18）**——内容权在父侧；本档只出文本。落笔状态与实测读数 = §6.27.6 行 11–14 及其下表注）

**① `thincoder-core/prompts/common.md`（英文运行面）**——新增一段（置于「停下上报（Stop and report）」段之后、「工具观」段之前；`##` 块数 10 → 11）：

```
## 上行通道（Upstream channel — subagents and their parent）

A subagent has a channel to its parent for decision-grade questions — the `notify_parent` tool. The parent is not a
user: it cannot confirm anything and it may be busy. Pass every message through this filter first:

- **Ask only when both hold**: (1) the answer changes your next step, and (2) the answer cannot be found in the
  materials you can read (task book, design doc, repo code/docs). Otherwise decide yourself and write the call into your report.
- **In scope**: a stated premise the facts contradict; two requirements that conflict and you cannot arbitrate;
  whether an action is inside your task domain; a choice that would waste work already done.
- **Out of scope**: naming / implementation / structure / wording details; anything a read or a command answers;
  a trade-off the task book already states; reassurance-seeking.
- **Non-blocking**: send it and keep working on the unaffected parts — the affected part stays pending until a reply
  arrives (as an ordinary instruction). Never idle waiting, never poll. No reply by the time you finish ⇒ skip that
  part and report it as not done.
- **One ask at a time**: while an `ask` of yours is still waiting in the parent's queue (not yet picked up), a
  second one is refused. When unsure whether a question qualifies, fall back to the stop-and-report discipline above.

Receiving side (the parent): an in-flight child message arrives as a `[System reminder: ...]` user message at your
next turn boundary. If it is decision-grade, answer with `subagent action:'send'` (id + message) — the child consumes
it at its next turn boundary and keeps the rest of its discipline unchanged.
```

**② `docs/core/design/prompts/common.md`（中文权威面）**——同段中文（双面流程：中英不同字面，各自自足）：

```
## 上行通道（子代理及其父）

子代理有一条向父（spawn 方）发「决策级问题」的通道——`notify_parent` 工具。父不是用户：它不确认任何事，
也可能正忙。每条消息先过这道滤网：

- **两问皆过才可问**：① 答案会改变你的下一步行动 ② 答案在你能读到的材料（任务书 / 设计档 / 仓内代码与文档）里找不到。
  否则自己定，并把该判断写进报告。
- **可问**：写明的前提与实况冲突；两处要求互斥且你不可自行裁；待做之事是否在任务域内；继续当前路线会作废已完成的工作。
- **禁问**：命名 / 实现方式 / 结构 / 措辞等细节；读一下或跑一下就有答案的事；任务书已明示的取舍；求安心式确认。
- **非阻塞**：发完继续做不受影响的部分——受影响部分标 pending 直到答复到达（按普通指令消费）。**禁空转等待、禁轮询**；
  到结束仍无答复 ⇒ 该部分不做，并如实报告。
- **一问一答**：你的 `ask` 还留在父队列里（父尚未取走）时不得再发 `ask`。拿不准是否该问 ⇒ 回落到上面的「停下上报」纪律。
- **接收侧（父）**：子代理的在飞消息在下个回合边界以 `[System reminder: ...]` user 消息到达；属决策级则以
  `subagent action:'send'`（id + message）答复——子代理在其下个回合边界按普通指令消费，其余纪律不变。
```

**③ 工程场景一句**（`thincoder-core/prompts/discipline-engineering.md` + `docs/core/design/prompts/discipline-engineering.md`）：

- 英文：`**Premise invalidated mid-flight**: when the premise you are executing on turns out false (the code contradicts the design / the task book), send an upstream `ask` (notify_parent) — do not finish the wrong work and stop at the terminal report.`
- 中文：`**途中前提失效**：正在执行的前提被实况证伪（代码与设计 / 任务书相抵）⇒ 走上行 `ask`（notify_parent）——不要做完错的工作再终态停报。`

**④ 工具描述（`parent-channel.mjs` 的 `description`——实现轮落笔，建议逐字）**：

```
A one-way channel to your PARENT (the agent that spawned you) — you are a subagent, so there is no user to ask.
Queue a message on the parent's side; your turn is not interrupted and nothing is consumed from it.
- kind:'ask' — a question whose answer changes your next step and that you cannot answer from the materials you can read
  (task book / design doc / repo). The parent replies with subagent action:'send'; you receive it as an ordinary
  instruction at your next turn boundary. One ask at a time while the previous one is still waiting in the parent's queue.
- kind:'note' — an FYI that needs no answer (a premise you found broken, a conflict you resolved and want visible early).
- NON-BLOCKING: the call returns immediately. Keep working on the unaffected parts; keep the affected part pending.
  There is no fetch and no waiting — if you finish first, report the unanswered part as not done (never idle, never poll).
- SYNCHRONOUS SPAWN: if the parent is blocked on your run (sync spawn), nothing can be sent back to you — the reply path (`send`) reaches only a RUNNING ASYNC child. The message is read when the parent's call returns (it may re-spawn you with an answer); report the unanswered part as not done.
- Out of scope: naming / implementation / wording details, anything a read or a command would answer, trade-offs the
  task book already states. When in doubt use the stop-and-report discipline — this is not an escape from your own judgment.
- Availability: subagents only (depth > 0). At depth 0 you talk to the user through your normal reply or the question tool.
```

### 6.27.9 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T1 | 正常·`ask` 入队 + 立即返回 | 子代理（带 `_upstream`）调 `notify_parent({kind:"ask", message:"…"})` | 返回 `status:"queued"` + `position:1`；父 `_childUpstream` 长度 1（`from` / `kind` / `seq` 正确）；调用**即刻返回**（零 await） | A1 / A4 |
| T2 | 正常·父消费注入 | T1 后 `drainChildUpstream(parent)` | 父 history 尾新增**恰 1** 条 user 消息（含 `eng-coder#57` + `ask` + 指引句）；队列清空 | A2 |
| T3 | 正常·往返闭环 | T2 后父 `send` → 子下回合边界 | 子历史新增该回复（user 回合）——既有 `drainInjectedQueue` 路径零改 | A2 / A6 |
| T4 | 正常·`note` 类 | `{kind:"note"}` | 注入文案含 `note`；无待答复语义 | A1 |
| T5 | 边界·多来源合并 | 两子代理各 1 条（同边界前） | 注入**恰 1** 条 user 消息，含两条列表行（按入队序）；队列清空 | A2 |
| T6 | 边界·父未运行（挂起） | 父 `runAgent` 已返回后子代理入队 | 队列留存；父下次 `runAgent` 首轮边界注入 | F1 |
| T7 | 边界·子代理已 settle | 子代理 settle 后父 drain | 注入含 `has since settled` 注脚；消息**不丢** | F3 |
| T8 | 边界·空队列 | `drainChildUpstream` on 空 | 零历史变更（no-op） | A2 |
| T9 | 错误·depth-0 调用 | 主 agent 调 `notify_parent` | 明确错误（`depth > 0` 文案）；零入队 | A3 |
| T10 | 错误·二次 `ask`（窗口 = 未 drain） | ① 首条 `ask` 未 drain 时同子代理连发两次 ② 同子代理首条被 drain 后再发一次 | ① 第二次**报错**（`one ask at a time` 文案）；队列长度仍 1 ② 放行（队列长度 1） | A5 |
| T11 | 错误·队列满 | 队列已达 20 | 报错（队列满文案）；零入队 | A5 |
| T12 | 错误·`message` 非法（空 / 超 1500）· `kind` 非法 | 三种输入 | 各自明确错误；零入队 | A5 |
| T13 | 错误·无上游 | 手工构造无 `_upstream` 的 agent | 报错（`no parent channel`） | F7 |
| T14 | 零回归 | 既有族 | `subagent-observe-send` / `async-family` / `spawn-gates` / `family-tools`（更新后）全绿 | A6 |
| T15 | 边界·子代理已 cancel（注脚第二形态） | 子代理取消（出池 + 墓碑 `cancelled`）后父 drain | 注入含 `has since been cancelled` 注脚；消息**不丢** | F3 |
| T16 | 边界·第三态不附注脚 | 池未命中 + 墓碑 `discarded`（`thincoder-core/agent-tools/async-discard.mjs:90`）/ 无墓碑 | 注入**不含**任何注脚；消息本体照常注入 | F3 |
| T17 | 边界·sync 面返回注（同用例两半） | ① `_upstream.sync === true` 调 `notify_parent` ② `sync: false` 同调 | ① 注**不含**「reply arrives」句、**含**「父阻塞 ⇒ 无答复 ⇒ 报未做」句 ② 含「reply arrives」句（异步形字面不变） | F6 |

### 6.27.10 验收标准（逐条回指）

| # | 判据（可机检） | 回指 |
|---|---|---|
| A1 | 工具在场性：`assembleFamilyTools({depth:1, role})` 五角色皆含 `notify_parent`；兜底段（未列名 role）同含（表断言：`{depth:1, role:"sub"}` ⇒ 含）；`depth:0` 各面不含；consult 不含（表断言） | 批 §2 条目 1 |
| A2 | 消费单点：`agent/turn-loop.mjs` 循环头含 `drainChildUpstream(agent)` 调用（import 形态 = 动态——§6.27.4；三拆前 = `agent.mjs` 循环头）；空队列零变更；非空 ⇒ 恰 1 条合并注入 + 清队列 + 结束注脚按两判据点（T2 / T5 / T8 / T15 / T16） | 批 §2 条目 2 |
| A3 | depth 门：depth-0 调 ⇒ 明确错误（T9）；文案族与 §6.7.2 fail-closed 形态同款 | 批 §2 条目 1（depth>0 专有——五角色装配 / depth-0 与 consult 不装配） |
| A4 | 非阻塞 + 无答复路径：工具 execute 无父侧 await；**通道无拉取 / 等待导出**（导出面断言：仅 tool + push / drain + 常量）；未获答复的 ask 其队列消息**仍注入**（T7——信息不丢）；sync 形返回注不给「答复到达」承诺（T17——同用例两半） | 批 §2 条目 3 |
| A5 | 三闸：未 drain ask ≤1（T10 红——窗口 = 未 drain：未 drain ⇒ 拒 / drain 后 ⇒ 放行，同用例两半）· 长度上限与队列上限（T11 / T12 红）· kind 枚举（T12 红） | 批 §2 条目 4 |
| A6 | 零回归：既有族测试全绿（含 `thincoder-cli/test/subagent-observe-send.test.mjs`）+ `family-tools.test.mjs` 更新后绿 | 批档自身约束（无对应条目——零回归基线 = 需求档建议 N2） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| A7 | 提示词面：`common.md` `##` 块数 = 11（T-CL1 同批更新——`:80` 口径注 · `:82` 标题串 · `:83` 断言与消息串三处）；核 `prompts/` 文件集仍 15（`thincoder-core/test/prompt-files.test.mjs:69`）；零新增 `{{inject:...}}` 锚 | 批 §2 条目 6 （机检豁免——用例退场登记） |
| A8 | 文档一致：设计档 §6.27 ↔ 批档 §2 ↔ 需求档条目三方一致；`node scripts/doc-check.mjs` 本批触碰档零新增悬空锚 / 零新增行宽违规 | 批档自身约束（无对应条目——三方一致 + doc-check 按档零新增） |

### 6.27.11 边界（本批不做）

1. 不做阻塞式提问（等待态）；不提供拉取 / 轮询 / 等答复 API（D-UC3）。
2. 不给 consult 装配（角色语义边界）；不给 depth-0 主 agent 装配（其与用户的通道 = 普通回复 / `question`）。
3. 不改 `send` / `observe` / `status` / `cancel` / `panel` 动作语义与文案；不改 depth 门既有条文（§6.7.2 / §6.25）。
4. 不改池 / 队列 / 补位 / settle / digest 语义；`_childUpstream` 不参与 `dependsOn` 墓碑与 `status` 视图。
5. 不新增 TUI 面板块 / 不改块状态机；不改 `transient` 语义。
6. **VSC 端对位已并入（2026-09-19 批 · 设计面）**（端壳消费点 = 循环头调核单源 `drainChildUpstream` + 载体表 12 → 14 款 + 端侧唤醒 / 谓词 / 旗标 + 夹具同步；端侧细则见 §6.27.12.12）；端壳取消 / 观察面对位 = **已对位**（取消走核单源 `executeCancelAction`；观察面 = `vscSubagentFace`——台账 #87 归档）。
7. 不改需求档正文（父侧笔）；不改提示词正文（父侧落笔——本档只出逐字建议）。
8. 不做「父→子」新动作 / 新管子（回复路径恒 = `send`）。

### 6.27.12 上行唤醒面（默认流可用性 · F-UC7）（2026-09-19 · 批 2026-09-19-upstream-channel-availability · 台账 #104）

**回指**：需求 = `docs/core/requirements/AGENT-LOOP.md` §4.12 **F-UC7**（`:220`）+ 由头注（`:227`）；任务书 = `docs/batches/2026-09-19-upstream-channel-availability.md` §2。
**定位**：§6.27（通道本体）建成后**在默认异步流不可用**——本节 = 唤醒面（结构层真因）的裁定与落地契约。三面（机制 / 语义 / 射程）承 §6.27.2 不变，本节只补**唤醒面**。

#### 6.27.12.1 病与实证（默认流窗口）

**病**：通道的父侧消费点 = 回合循环头单点 `drainChildUpstream(agent)`（`thincoder-core/agent/turn-loop.mjs:89`——三拆前 `thincoder-core/agent.mjs:225`）——**只在回合内**；
而挂起期（父侧无回合）的唤醒源只有三路（§6.27.12.2），**「未 drain 的 ask」不在列** ⇒ 默认流（单子代理 · 父侧挂起）里 ask 恒等到「子代理自身 settle」那次 digest 轮才被读到 ⇒ 子代理已终态，答复无处可去——§4.12 总体需求 `:210` 的「在飞纠偏」在默认流**不成立**。

**实证（本机 `~/.thincoder/logs/agent-2026-09-19.log` 逐条实读）**：挂起窗口 = 分钟级，且首个唤醒恒 = 子代理自身 settle（五次挂起皆 `poolN 1 / runningN 1` = 单子代理默认流）：

| # | `susp:enter` | 首个 `digest:start` | 窗口 | 证据行 |
|---|---|---|---|---|
| 1 | 12:52:09 | 12:59:08 | **419 s** | `:1721` / `:2025` |
| 2 | 13:24:03 | 13:28:26 | **263 s** | `:2592` / `:2748` |
| 3 | 14:26:09 | 14:34:29 | **500 s** | `:3863` / `:4122` |
| 4 | 14:38:40 | 14:45:25 | **405 s** | `:4200` / `:4332` |
| 5 | 14:46:42 | 14:52:28 | **346 s** | `:4373` / `:4423` |

子代理典型运行时长 ≈ 该窗口 ⇒ **ask 恒迟到**（§1.2 诊断的结构面成立）。**同档次生读数**：digest 轮自身耗时 ≈ 6.8–64.3 s（`digest:end` 的 `ms` 字段全档区间）——即「唤醒后答复到达」的代价量级 = 一个父侧轮。
**零使用证据**：同日志 `child:upstream` **0 命中**（`notify_parent` 仅出现在父侧 read / grep 载荷内）⇒ 本通道**从未在默认流被真实走通一次**——本批修的是「结构在先、建成即不可用」，不是统计意义上的偶发。

#### 6.27.12.2 唤醒事件族逐条实核（三路 + 一问）

| # | 唤醒源 | 核内 `thincoder-core/agent/suspension.mjs` | CLI `thincoder-cli/src/tui/suspension-drive.mjs` | VSC `thincoder-vscode/src/extension/suspension.mjs` |
|---|---|---|---|---|
| W1 | **子代理 settle**（池项结算） | 注册 `:133`（`carrier._asyncWaiters ??= []` + `push(onSettle)`）· 摘除 `:121-122` · 兑现 = `thincoder-core/agent-tools/async-settle.mjs:281` | 注册 `:127`；兑现同核 settle 尾 | 注册 `:190`（双载体 `panel._agent` + `susp.lines.history`）；兑现同核 settle 尾 |
| W2 | **用户输入**（Enter 落槽） | `latch.wake` `:134` ← 宿主句柄 `handle.wake()` `:231` | `state._suspWake` `:128`（Enter → 唤醒） | `panel._suspWake` `:191` |
| W3 | **abort**（Ctrl+C / 会话中止） | `abortSignal` `:123` / `:136` → `finish("aborted")` | `agent._sessionAbort.signal` `:126` / `:129-130` | `susp.abort.signal` `:180` / `:192-193` |
| — | **未 drain 的 ask** | —— | —— | —— |

**三路之外无第四路（实核）**：advisor digest / consult 结果都经 settle 入池 ⇒ 走 W1；`_asyncQueue` 排队条目由调度面在池内处理，不设唤醒点。

**末行缺口的填充（2026-09-19 VSC 扩面轮）**：表内「未 drain 的 ask」一行的「——」= 诊断时缺口；修法 = 唤醒（核 ask 入队尾调 `wakeAsyncWaiters`——§6.27.12.4 ①）+ 三驱动第 2 步谓词（§6.27.12.4 ① / §6.27.12.12-③）。**VSC 侧等待栓（W1 面）本就在位**（`thincoder-vscode/src/extension/suspension.mjs:190`）——本批只补该面的消费与谓词。

**挂起驱动坐标（核 + 两端——2026-09-29 收口轮实读）**：核 `thincoder-core/agent/suspension.mjs`（**297 行** · `startSuspension` `:180` · 等待单点 `waitForSettleOrWake` `:135`）·
CLI `thincoder-cli/src/tui/suspension-drive.mjs`（**211 行** · `suspensionSession` `:137` · 核驱动装配面 + 壳）·
VSC `thincoder-vscode/src/extension/suspension.mjs`（**291 行** · `suspensionSession` `:193` · 核驱动装配面——核驱动动态装载）。
**核驱动现状（2026-09-29 · parity-b1-vsc-core 全修收编）**：**挂起面单源 = 核驱动（三端消费）**——CLI ∕ VSC ∕ desktop 皆以 `startSuspension` 为唯一驱动，端差只在装配面（carrier ∕ hooks ∕ 输入缝）。

#### 6.27.12.3 关键发现——唤醒 ≠ 开轮（第二要件）

CLI 驱动循环（`:211-247`）的等待单点被唤醒后**只重新求值、不直接开轮**：

```
while (…) { sweepSettledToPending(agent)
  1. pendingInput 非空            → 用户回合（:217）
  2. _pendingAsyncResults 非空    → 消化轮 auto-turn（:231）
  3. !poolLive(agent)             → 退出（:244）
  4. await 等待下一唤醒（:246） }
```

⇒ **只补唤醒零效果**：唤醒后 ① 输入槽空 ② pending 空 ③ 池仍 live（子代理还在跑）⇒ 回第 4 步继续等。
**未 drain 的 ask 必须进第 2 步的开轮判据**——只有轮跑起来，`thincoder-core/agent/turn-loop.mjs:89`（三拆前 `thincoder-core/agent.mjs:225`）的 drain 才会把消息注入父上下文（消费单点唯一性的结构断言 = `thincoder-core/test/parent-channel.test.mjs:130-133`）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
⇒ **本批修法 = 唤醒面（复用 W1 通道）+ 开轮谓词（第 2 步新增判据源）两件一组，缺一无效。**

#### 6.27.12.4 四面裁定

**① 机制面**（唤醒条件 / 注入点 / 回复路径）

- **唤醒条件** = 子代理入队一条 `kind:"ask"` 条目（`thincoder-core/agent-tools/parent-channel.mjs:88-95` 入队之后）。
  `note` **不唤醒**（FYI 无时效义务；同时避开「每条消息一次父侧 LLM 轮」的轮风暴面）——唤醒源 = **未 drain 的 ask**，与 F-UC7 措辞（`:220`「ask 须能触发父侧一次处理」）逐字对齐；note 面处置见边界项 §6.27.12.11-7。
- **唤醒实现** = **复用 W1 通道**（`_asyncWaiters`），抽核内单点：`wakeAsyncWaiters(parent)`（现 `async-settle.mjs:281` 的 `splice(0)` 循环**逐字**迁入；settle 尾改调用同函数），`pushChildUpstream` 在 `kind === "ask"` 分支尾部调它一次。
  载体读经 `carrierField`（既有无障碍单点，`async-settle.mjs:52-56`）——与入队侧 `upstreamHolder`（`parent-channel.mjs:76-89`）同口径。
  **零新字段 / 零新容器 / 零新注册点**：等待栓数组在挂起期已由三驱动注册；非挂起期数组空 ⇒ `splice(0)` 空循环 = no-op（父侧忙 / 会话已退出 / 挂起未进入三情形皆 no-op）。
- **轮谓词** = 三驱动第 2 步判据追加 `|| upstreamWaiting(carrier)`（`parent-channel.mjs` 新导出；读 `carrierField(carrier, "_childUpstream")`，且**队列中存在 `kind === "ask"` 条目**为真）。
  该轮 = **auto 轮**（`autoTurn: true` 不变 ⇒ `_inAutoTurn` spawn 门 / `INHERITED_GUARD_KEYS` 继承 / `resume: resume || autoTurn` 语义**全部沿既有 auto 轮**）+ 新旗标 `upstreamTurn: true`（**仅供域文本选择**，不进任何门）。
- **注入点** = **零改**：仍是 `drainChildUpstream` 回合头单点（`thincoder-core/agent/turn-loop.mjs:89`——三拆前 `thincoder-core/agent.mjs:225`），全部 pending 合并一条 user 消息（`parent-channel.mjs:120-133`）。
- **回复路径** = **零改**：`subagent action:'send'`（§6.27.1 S1 表 = `subagent-actions.mjs:74-75` 入 `entry._injected` → 子代理回合头 `thincoder-core/agent/turn-loop.mjs:87` `consumeInjected` 消费——三拆前 `thincoder-core/agent.mjs:223`）。
  **回复可达性实核（本批关键前提）**：`send` 属 dispatch **控制类豁免**——`thincoder-core/agent/dispatch-gates.mjs:89-98`（`isSubagentControlAction` 含 `send` ⇒ `:257` 免权限门）⇒ 免审批 / planMode 放行 / **digest 内放行**；
  `thincoder-core/agent-tools/subagent.mjs:186` 的 auto 轮门**只覆盖 `escalate`**，`:263` 只覆盖 spawn ⇒ **manual 档 auto 轮内 `send` 可调**（逐条实读，非推断）。
- **非阻塞地基**：`notify_parent` 侧零改（仍同步返回、无等待 / 拉取导出）——N1 / D-UC3 结构保证原样。

**② 语义面**（回合类型与域文本）

- 唤醒轮 = **auto 轮类**（父侧无用户在场）：manual 档照既有 D-S6 纪律（不 spawn / 不改文件 / 不提问）；AUTO 档无域提醒（既有）。
  **与既有 digest 域文本的冲突（必须处置）**：`AUTO_TURN_DIGEST_DOMAIN`（`thincoder-core/agent/helpers.mjs:436-437`；VSC 侧注入点 = 端侧组合 `thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 **37**——§6.27.12.5 L））写「**No one is waiting for this reply**, so organize only」——**对 ask 轮恰相反**（子代理正在等答复）
  ⇒ 唤醒轮**不得**沿用 digest 域文本，须有自己的域文本（逐字建议 = §6.27.12.8；**内容权 = 父侧**，本档只出文本——同 §6.27.8 先例）。选择点 = `thincoder-core/agent/run-start.mjs:97-101`（manual 档域提醒注入点；三拆前 `thincoder-core/agent.mjs:162`）邻位：`upstreamTurn` 优先、否则 `autoTurn`。
- **提示词面零改**：注入文案自带指引（`parent-channel.mjs:126-129` 抬头「Answer with subagent action:'send' …」）⇒ 主分支下 §6.27.8 的 async 承诺（「回复在你的下回合边界到达」）在默认流**变得成立**，无需改准；`prompts/**` 与工具描述本批**零行**。
- 队列消费仍**消费即清**（`parent-channel.mjs:162` `splice(0)`）⇒「未 drain」窗口随该轮关闭，子代理可再问一条（闸二语义零改）。
- 混合场景（同一轮既有 ask 又有已 settle 报告）：**一轮同时办两事**（drain 注入 ask + 轮首注入 pending 报告 `thincoder-core/agent/run-start.mjs:33-45`——三拆前 `thincoder-core/agent.mjs:111-122`）——域文本按 `upstreamTurn` 选择并显式容纳摘要句（§6.27.12.8 文本末段），**不新开第二轮**。

**③ 失败面**（增量；F1–F8 原样）

| # | 情形 | 处置 |
|---|---|---|
| F9 | 唤醒后父侧轮未及跑完，子代理已 settle | 注入仍发生（`endNote` 附「has since settled」注脚，`parent-channel.mjs:144-150`）；`send` 因目标出池不可达 ⇒ 既有 F-UC3 兜底（子侧该部分不做 + 如实上报）——**零新语义** |
| F10 | 唤醒触发但队列已被同轮 drain 清空（多次唤醒 / 竞态） | 循环回求值：谓词假 ⇒ 继续等——**无自旋**（唤醒为一次性栓，`splice(0)` 即清）；**残余两项（登记 · 判据本体零改）**：① **采样窄窗 race**——谓词 = 开轮前一次性采样且无「本轮是否产生 drain 进度」判定 ⇒ 采样之后、核 drain 之前入队的 ask 由 digest 域文本的轮消费（§6.27.12.4 ② 相抵场景的窄窗）；② **谓词恒真 ⇒ 连开轮**——宿主 `runTurn` 未完成回合头 drain（宿主契约）或某轮未达核循环头（如 `prepareRun` 抛错）⇒ 谓词保持真 ⇒ 连开轮无上限 / 无退避（每轮 `[error]` 行）——F10 只覆盖「已 drain」反方向。细则 = `docs/batches/2026-09-19-upstream-channel-availability.md` §5.6-3 / §5-CLI.5-2 |
| F11 | 挂起已退出后 ask 入队 | 等待栓数组空（核 `finishSuspension` / CLI `:258` / VSC `:324` 清场）⇒ 唤醒 no-op；消息留队列等下一回合边界（F1 原样） |
| F12 | 父侧忙（回合内）时 ask 入队 | 等待栓数组空 ⇒ 唤醒 no-op；该轮或下一轮边界注入（既有） |
| F13 | 挂起期 note 入队（不唤醒） | 静默留队列 → 下一拐点（settle / 用户输入）注入——**今日语义零变**（边界项 §6.27.12.11-7） |

**④ 范围面**

- **本批写域 = 核 + CLI + VSC（三面）**：核（`thincoder-core/agent-tools/async-settle.mjs` / `thincoder-core/agent-tools/parent-channel.mjs` / `thincoder-core/agent/suspension.mjs` /
  `thincoder-core/agent.mjs` / `thincoder-core/agent/helpers.mjs`）+ CLI（`thincoder-cli/src/tui/suspension-drive.mjs` / `thincoder-cli/src/tui/agent-turn.mjs`——**旗标贯通两跳，修正轮 1 补**）
  + **VSC 端壳**（`thincoder-vscode/src/agent.mjs` / `thincoder-vscode/src/extension/suspension.mjs` / 旗标贯通三档 / 载体表夹具——**细则、坐标与用例 = §6.27.12.12**）。
  **扩充依据**：用户 2026-09-19 23:23 裁定「**vsc 肯定要扩啊，否则不完整啊**」+ 需求档 §4.12 **N4**（`docs/core/requirements/AGENT-LOOP.md`——范围 = **核侧 + CLI + VSC 两端对位**）。
- **实证面仍 = CLI**（§6.27.12.1 日志 = 本机 CLI 会话：无 `Code` 进程、会话子代理 id 序列与批档 §1.2 同源）；**VSC 面 = 对位设计已并入本批（2026-09-19 · 设计面）**（结构 + 夹具可机判）——**实证日志不覆盖 VSC**（如实登记：本机默认流非 VSC；VSC 侧重载后自验归收口，见 §6.27.12.12-5）。
- **VSC 面落点顺序（硬）**：**先补 drain**（否则唤醒轮注入空内容——F8 病征原样）**再补载体两字段**（否则队列跨 run 丢）⇒ 其后才是谓词 / 旗标 / 日志标签。四项同批改造，**待实现轮落地**。
- **不动**：consult / depth-0 面 · 既有三路唤醒语义（W1–W3）· `_childUpstream` 与池生命周期解耦（F3）· sync 子代理面（F6）· 计数 / 上限（无新增）。

#### 6.27.12.5 接口契约（改前 → 改后）

**A. `thincoder-core/agent-tools/async-settle.mjs`（293 行 → ~299 行）**

```js
// 改前（:278-281 公共尾 ④）
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  for (const w of parent._asyncWaiters?.splice(0) ?? []) { try { w() } catch { /* noop */ } }

// 改后（抽单点——settle 尾 / 上行 ask 两处调用；循环体逐字）
  entry._settleSeq = (parent._asyncSettleSeq = (parent._asyncSettleSeq ?? 0) + 1)
  entry._settle?.()
  wakeAsyncWaiters(parent)

/** 唤醒挂起驱动单点（settle 尾 / 上行 ask 两处调用；读经 `carrierField` 吸收）。 */
export function wakeAsyncWaiters(parent) {
  const list = carrierField(parent, "_asyncWaiters")
  for (const w of list?.splice(0) ?? []) { try { w() } catch { /* noop */ } }
}
```

▸ **语义差分显式声明**：循环体逐字；唯一差分 = 读径由 `parent._asyncWaiters` 改 `carrierField(parent, "_asyncWaiters")`（父字段优先、缺则载体）——**严格超集**（父字段在场路径零差分；今日「父字段缺 + 载体有」= 漏唤醒 ⇒ 挂起僵死至下次用户输入，本点顺带补齐）。

**B. `thincoder-core/agent-tools/parent-channel.mjs`（209 行 → ~231 行）**

```js
// 新导出（谓词单点——三驱动第 2 步判据共用）
/** 父侧是否存在「未 drain 的 ask」（唤醒 / 开轮判据单点；载体经 carrierField 吸收）。 */
export function upstreamWaiting(carrier) {
  const q = carrierField(carrier, "_childUpstream")
  return Array.isArray(q) && q.some((e) => e.kind === "ask")
}

// pushChildUpstream 尾部（唯一激活点——入队 + 日志之后；同步，无 await）
  if (kind === "ask") wakeAsyncWaiters(parent)   // import 自 ./async-settle.mjs（既有边，零新增静态边）
```

**C. `thincoder-core/agent/suspension.mjs`（234 行 → ~242 行）**——`:187` 判据 + 旗标贯通：

```js
// 改前
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0) {
          const afterRun = consumedByRun()
          hooks.onDigest?.("start", backgroundCounts(carrier))
          try { await runTurn("", { autoTurn: true }) }
// 改后
        const upstream = upstreamWaiting(carrier)   // 静态 import（同 :29 async-settle 先例）
        if ((carrier._pendingAsyncResults?.length ?? 0) > 0 || upstream) {
          …
          try { await runTurn("", { autoTurn: true, upstreamTurn: upstream }) }
```

**D. `thincoder-cli/src/tui/suspension-drive.mjs`（现量 323 行）**——提示行权威节 = **F-UC8 按因两档 × 全档（manual / AUTO 同判）**；矩阵 / 携参 / 起跑行口径单源 = §6.27.12.13 ①–③；开轮判据（`:252-254`）零改：

```js
// 开轮判据（:252-254——F-UC7 落，零改）
      const upstream = upstreamWaiting(agent)
      if (pendingFamiliesNonEmpty(agent) || upstream) { await digestTurn(ctx, upstream) … }
// digestTurn（:168-192——F-UC8 改点）：起跑数前置 + 按因两档标签（核容器字面——CLI 零自持）+ 起跑行
      const pend0 = pendingFamilyCount(agent)                           // 取数前置（起跑行与 X9 收尾行同源）
      const ask = upstream ? upstreamAskLabelVars(agent) : null         // 核单点（§6.27.12.13 ②）
      pushLine(ask ? t("digest.turnLabelAsk", ask) : t("digest.turnLabel"), C.dim)
      if (pend0 > 0) pushLine(t("digest.start", { n: pend0 }), C.dim)   // 起跑行（对位 VSC——§6.27.12.13 ③）
// 其后零改：digest:* 日志 / `runAgentTurn(ctx, "", { autoTurn: true, upstreamTurn: upstream, skipSession: true })`；X9 收尾行加 `pend0 > 0` 守卫（ask-only 轮零收尾行——§6.27.12.13 ③）
```

（`upstreamTurn` 与 `autoTurn` 同径贯通到核 `runAgent`——**修正轮 1 补跳后的实际链路（发现 1）**：CLI 驱动 `runAgentTurn(ctx, "", { autoTurn, upstreamTurn, skipSession })`
→ `thincoder-cli/src/tui/agent-turn.mjs:105` 解构补 `upstreamTurn` → 同档 `:147` opts 字面量补 `upstreamTurn`
→ 核 `thincoder-core/agent.mjs:96` 签名解构读 `opts.autoTurn` / `opts.upstreamTurn`、`:124` 落 `_inAutoTurn`（**原「同径贯通」句在补跳前不成立**——CLI 档曾丢弃该旗标）；实证 = `_inAutoTurn` 门在 CLI manual 档生效。）

**E. `thincoder-core/agent.mjs`（436 行 → ~441 行）**——`:96` 读 `opts.upstreamTurn`（**修正轮 1 收正（发现 3）**：原记 `:62` 实为 `createAgent` 参数表；opts 读点 = `runAgent` 签名解构 `:96`）；`:124` 落 `_inAutoTurn`；`:162` 域提醒选择（`upstreamTurn` → `UPSTREAM_TURN_DOMAIN`，否则 `AUTO_TURN_DIGEST_DOMAIN`；皆限 manual 档 `!getAuto()`）。

**F. `thincoder-core/agent/helpers.mjs`（383 行 → ~386 行）**——新增导出 `UPSTREAM_TURN_DOMAIN`（文本 = §6.27.12.8 逐字；**内容权 = 父侧**）。

**G. `thincoder-vscode/src/agent.mjs`（485 行 → ~487 行）**——端壳 depth-0 循环的**消费点（drain）** + 载体表补款 + 域文本组合调用（常量块外提至 L ⇒ 净移出 8 行）：

```js
// ① 载体表（thincoder-vscode/src/agent.mjs:41-45）12 → 14 款（+ `_childUpstream` / `_childUpstreamSeq`
//     ——进 `for (const f of CARRIER_FIELDS)` :146-152 的访问器绑定；不预建容器）
// ② run 起、主循环之前（仿核 thincoder-core/agent.mjs:195）——动态 import，模块缓存
  const { drainChildUpstream } = await import("@thincoder/core/agent-tools/parent-channel.mjs")
// ③ 循环头（thincoder-vscode/src/agent.mjs:179）——紧随 `opts.turnInput?.()` 消费段（:193-198）；
//     核 thincoder-core/agent.mjs:223-225 同址反向（consumeInjected → drain）
  drainChildUpstream(agent)     // 子→父在飞消息（§6.27）；空队列 no-op——零历史变更
// ④ 旗标读点（:62 邻位）+ 域文本组合调用（:125-127）——组合单点 = L（核基座 + 端 overlay）
  const upstreamTurn = opts.upstreamTurn === true
  if ((autoTurn || upstreamTurn) && !getAuto()) {
    history.push({ role: "user", content: composeTurnDomain(upstreamTurn), transient: true })
  }
```

**为什么是动态 import（非静态）**：`thincoder-core/agent-tools/parent-channel.mjs` 的**静态闭包实测可达 `node:sqlite`**（本席实测：126 档，`node:sqlite` 在 builtins 列——经 `thincoder-core/agent-tools/async-settle.mjs`）⇒ 静态引会破端壳静态闭包机判
（W8 契约②判据——现载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`，单测树重建时回迁端侧单测档）。**零新增静态边**——与 `thincoder-vscode/src/extension/suspension.mjs:73` 同款先例。

**H. `thincoder-vscode/src/extension/suspension.mjs`（397 行 → ~409 行）**——等待单点**零改**（W13 已双载体注册 `_asyncWaiters`：`thincoder-vscode/src/extension/suspension.mjs:171-191`）；第 2 步判据 + 旗标 + 日志标签：

```js
// 会话进入（while 之前，:257 邻位）：谓词取一次——动态 import（同上，W8 契约②）
  const { upstreamWaiting } = await import("@thincoder/core/agent-tools/parent-channel.mjs")
// 第 2 步（改前 :283-284）
  const pendingN = history._pendingAsyncResults?.length ?? 0
  const upstream = upstreamWaiting(history)
  if (pendingN > 0 || upstream) {
    … logEvent("digest:start", { pendingN, ...(upstream ? { upstream: true } : {}) })
    if (pendingN > 0) panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN })  // webview 面零改
    await entry.runTurn({ autoTurn: true, text: "", upstreamTurn: upstream })
    … logEvent("digest:end", { pendingN: left, ms: …, ...(upstream ? { upstream: true } : {}) })
```

谓词载体 = `history`（与 `:283` 同行读的 pending 容器**同一对象**）；写侧（核 `upstreamHolder`）与读侧（核 `carrierField`）经访问器 + 载体别名命中**同一容器**——两读点等价（`history._childUpstream` ≡ `panel._agent._childUpstream`）。

**I. 旗标贯通链（VSC 三档——每档一处透传）**：`thincoder-vscode/src/extension/panel-turn-stages.mjs`（`:156-158` `runTurn` 闭包解构 + 透传）→ `thincoder-vscode/src/extension/panel-chat.mjs`（`:87` opts 解构 + `:243` deps 注入）→
`thincoder-vscode/src/extension/panel-turn-loop.mjs`（`:60` deps 解构 + `:65-80` `ro.upstreamTurn`）——末端 = 端壳 `runAgent` 的 `opts`（G ④ 读点）。**参照 CLI**：`runAgentTurn(ctx, "", { autoTurn: true, upstreamTurn, skipSession: true })`——VSC 的三跳 = 端壳自有循环的固有多层，非新面。
（CLI 侧另有**两跳**（**修正轮 1 补——发现 1**）：`thincoder-cli/src/tui/agent-turn.mjs:105` 解构 → 同档 `:147` opts 字面量 ⇒ 核 `runAgent` 才实收该旗标。）

**J. `thincoder-vscode/src/agent/setup-reminders.mjs`（134 行 → ~136 行）**——核单源转口表（W15，`:31-40`）**增两名**：`AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`（自核面 `thincoder-core/agent/helpers.mjs` 转口——端侧**零自持副本**；两名 = 端侧域文本组合的两个基座，消费点 = L）。

**K. `thincoder-cli/src/tui/suspension-drive.mjs`（301 行 → ~315 行）**——承父侧同轮裁定 ④「**宿主日志加 `upstream: true`** 区分唤醒轮与 digest 轮」（**两端同规**）：`digestTurn(ctx, upstream)` 内
`logEvent("digest:start", { pendingN: pend0, ...(upstream ? { upstream: true } : {}) })` / `logEvent("digest:end", { …, ...(upstream ? { upstream: true } : {}) })`（CLI 面两点同式；核 `thincoder-core/agent/suspension.mjs` 无 `logEvent`——宿主钩子 `hooks.onDigest` 承载，本项零触）。

**L. `thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 **37**——拆分计划落地 + 端侧域文本组合单点）**

端侧域文本的**唯一组合点**（digest 轮与 ask 唤醒轮共用——选择仅换基座，端 overlay 恒在场）：

```js
// ① 核单源转口（自 ./setup-reminders.mjs 的 W15 转口表取——端侧零自持基座副本）
import { AUTO_TURN_DIGEST_DOMAIN, UPSTREAM_TURN_DOMAIN } from "./setup-reminders.mjs"

// ② 端 overlay（端自持述句块——逐字搬迁自端侧既有变体的端特有部分；零新撰 / 零改写；
//    字面 as-of 源 = thincoder-vscode/src/agent.mjs:29-30；逐字见 §6.27.12.12-④）
export const VSC_TURN_OVERLAY = "…"

// ③ 组合单点（入参 = 轮型旗标；不出基座串 ⇒ 调用方无从绕过 overlay——fail-closed）
export function composeTurnDomain(upstreamTurn) {
  const base = upstreamTurn ? UPSTREAM_TURN_DOMAIN : AUTO_TURN_DIGEST_DOMAIN
  return base.endsWith("]") ? `${base.slice(0, -1)} ${VSC_TURN_OVERLAY}]` : `${base} ${VSC_TURN_OVERLAY}`
}
```

- **组合形态 = 收尾括号内拼接**：端 overlay 落于基座正文之后、闭合 `]` 之前（`base.endsWith("]")` 为真 ⇒ 去尾插入；为假 ⇒ 尾接退化——端述句恒在场，不静默丢弃）。
- **为什么不是另一边（括号外尾部追加 / 句内锚点插值）**：① 括号外追加 ⇒ overlay 落在 `]` 之外，破 system reminder 括号形态（两基座皆以 `]` 收尾）；② 句内锚点插值 ⇒ 端侧须持基座句串锚点，而基座文本内容权在核侧（§6.27.12.8）——核侧改字面即静默失效（漂移面）。
- **核单源守护**：本档零核基座文本字面（基座只经转口 import 取）——机检锚 = §6.27.12.9 T-VS-U5 / §6.27.12.10 U12；端 overlay 住端侧 ⇒ **端特有述句不进核**。
- **W8 契约②（零新增静态边）**：核 `thincoder-core/agent/helpers.mjs` 已在端壳静态闭包内（`thincoder-vscode/src/agent/setup-reminders.mjs:16-21` 转口——包名导入符形态）⇒ 本档不引新核侧静态边，`node:sqlite` 仍不入端壳静态链。
- **行数收益**：`thincoder-vscode/src/agent.mjs` 原常量块（`:23-30`，含 JSDoc）随本档外提 ⇒ 该档净移出 8 行（拆分触发面清零——§6.27.12.7 尾距注）。

#### 6.27.12.6 方案选型对比

| # | 候选 | 判据逐项评估 | 结论 |
|---|---|---|---|
| **a** | **复用既有 async 唤醒通道（W1 `_asyncWaiters`）+ 扩第 2 步开轮谓词**（+ auto 轮新旗标与域文本） | ① 唤醒零新字段 / 零新注册（三驱动已注册）② 谓词 = 1 行 × 3 驱动（核单点导出）③ 回复路径既有（`send` 控制类豁免，digest 内可调）④ **提示词面零改**（承诺变真）⑤ 非阻塞地基零改 ⑥ 面数 = **7 档 + 4 用例档**（**修正轮 1 收正**：+ CLI 贯通档 `agent-turn.mjs` · + 核新测档） | **选定** |
| b | 把 ask 并入 `_pendingAsyncResults`（复用 digest 机器，谓词零改） | ① 破 §6.27.2 载体分离裁决（D-UC1/D-UC5——`_childUpstream` ≠ 终态报告容器）② 注入点二义（轮首注入 vs 轮头 drain）③ 回收 / 冻结 / `injectAsyncResult` 族分发全需新分支 ④ 失败面（F3 / F9）注脚语义被污染 | 否决 |
| c | 新造唤醒钩子（宿主句柄注册字段，如 `parent._upstreamWake`） | ① 比 a 多 3 宿主注册 + 1 字段 + 清场生命周期面（挂起退出 / 面板销毁 / 会话切换三路）② 只买到「唤醒原因可区分」这点内部面子（返回值今日无消费方——`thincoder-core/agent/suspension.mjs:208-209` 只判 `aborted`） | 否决 |
| d | **降级 note-only**（不改机制，把承诺改准） | 0 机制改动；但「在飞纠偏」需求主线（`:210`）作废、F-UC1 / F-UC2 / F-UC6 须同步收紧（**需求改判 = 父侧笔**） | **备选（不落——见 §6.27.12.11-6 备份路径）** |
| e | 子侧批量化提问（"攒够再问"） | 提示词面纪律、零结构收益——首个 ask 仍等父侧拐点，且子代理无从知晓拐点在何时 | 否决 |
| f | 同步窗口（`notify_parent` 阻塞 N 秒等父回合） | 破非阻塞地基（N1 / D-UC3「子代理机制上永不等」）——**出界**（批档禁触面） | 否决 |

**为什么不是另一边（d）**：a 的代价面 = **7 档小改 + 1 段文本 + 4 用例档**（**修正轮 1 收正**），全部落在既有单点上；d 的代价 = 需求承诺降级（用户 2026-09-19 23:11 确认的验收目标 `:220` 整条作废）。**残余代价如实登记**：a 下答复到达耗时 = 一个父侧轮（本机实测 ≈ 6.8–64.3 s）；子代理剩余运行时长若短于该轮，答复仍在子代理终态后到达 ⇒ 走 F9 / F-UC3 兜底。**收益面**：恒迟到 ⇒ 大概率及时（窗口从「子代理自身 settle」前移到「ask 入队 + 一个父侧轮」）。

#### 6.27.12.7 受影响文件清单（行数口径 = `find /c /v ""`（≡ `wc -l`）；现量 = as-of 2026-09-19 23:2x 实测）

| # | 文件 | 现量行数 | Δ（估） | 变更类型 | 说明 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/async-settle.mjs` | 293 | +6 | 重构（抽单点） | `wakeAsyncWaiters(parent)` 新导出；settle 尾 `:281` 改调用同函数（循环体逐字） |
| 2 | `thincoder-core/agent-tools/parent-channel.mjs` | 209 | +22 | 新导出 + 1 调用 | `upstreamWaiting(carrier)` 谓词单点；`pushChildUpstream` ask 分支尾唤醒；文件头注同步 |
| 3 | `thincoder-core/agent/suspension.mjs` | 234 | +8 | 判据 + 旗标贯通 | `:187` 谓词；`runTurn("", { autoTurn: true, upstreamTurn })`；import |
| 4 | `thincoder-core/agent/helpers.mjs` | 383 | +3 | 新常量（**文本 = 父侧内容权**） | `UPSTREAM_TURN_DOMAIN`（§6.27.12.8 逐字；父侧确认后落笔） |
| 5 | `thincoder-core/agent.mjs` | 436 | +5 | 域文本选择 | `:96` 读旗标（**修正轮 1 收正**——原记 `:62`）；`:124` 落 `_inAutoTurn`；`:162` 邻位二选一 |
| 6 | `thincoder-cli/src/tui/suspension-drive.mjs` | **316**（实测） | **+15（实测）** | 判据 + 提示行 + 旗标 | `:245` 谓词（**先于**池空退出判 `:259`）；`digestTurn` 第三档提示行 `:173`；`upstreamTurn` 贯通 `:183`（父侧直接执行 · 可 revert） |
| 7 | `thincoder-core/test/parent-channel.test.mjs` | 291 | **0（改行）** | 用例（**修正轮 1 拆分**） | T18–T22 **移出**（→ 行 23）；本档仅 `:272` 导出面名单补 `upstreamWaiting`（一行就地改）；余 T1–T17 原位 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 8 | `thincoder-core/test/suspension.test.mjs` | 213 | +35 | 用例（假 carrier 纯 Node 驱动） | ask → 唤醒 → 开轮；note → 零轮零退出 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 9 | `thincoder-cli/test/input-lock.test.mjs` | **368**（实测） | **+101（实测）** | 用例（复用 `driveRig` `:137-164`） | T-CL-U1 / U2（驱动判据 + 提示行 + `runAgent` 桩第 4 参 `upstreamTurn` `:251`）；**档位声明**：越 300 **advisory** 线（368）——CLI 无同族机检门 ⇒ **不拆**（触发式计划见越线核查；父侧直接执行 · 可 revert） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 10 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1932（**as-of 读数**） | +~130 | 设计档（本节） | §6.27.12 全节 + 变更记录一行；**本批不追值**（见尾注④） |
| 11 | `docs/core/design/AGENT-LOOP.md` | 519（**as-of 读数**） | +~12 | 设计档（一致性对齐） | §2.3 载体字段集 11 → **13**（补 `_childUpstream` / `_childUpstreamSeq`）+ 唤醒栓兑现点改指 + 变更记录一行；**本批不追值**（见尾注④） |
| 12 | `thincoder-vscode/src/agent.mjs` | 485 | **−8 / +~10** | 端壳 drain + 载体两字段 + 旗标 + 域文本组合调用 | 域文本常量块（`:23-30`）外提至行 21（净移出 8 行）；循环头 `drainChildUpstream(agent)`（动态 import 核单源——W8 契约②）；`CARRIER_FIELDS` 12 → 14 |
| 13 | `thincoder-vscode/src/extension/suspension.mjs` | 397 | +~12 | 第 2 步判据 + 旗标 + 日志标签 | `upstreamWaiting(history)`（动态 import）；`runTurn({ autoTurn, upstreamTurn })`；`digest:start` / `digest:end` 载荷 |
| 14 | `thincoder-vscode/src/extension/panel-turn-stages.mjs` | 177 | +2 | 旗标透传 | `:156-158` `runTurn` 闭包解构 + 透传 |
| 15 | `thincoder-vscode/src/extension/panel-chat.mjs` | 252 | +2 | 旗标透传 | `:87` opts 解构 + `:243` deps |
| 16 | `thincoder-vscode/src/extension/panel-turn-loop.mjs` | 161 | +2 | 旗标透传 | `:60` deps 解构 + `ro.upstreamTurn` |
| 17 | `thincoder-vscode/src/agent/setup-reminders.mjs` | 134 | +2 | 核单源转口 | `AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`（两个基座；端侧零自持副本——§6.27.12.5 J） |
| 18 | `thincoder-vscode/test/upstream-parity.test.mjs` | **262**（实测） | **+262（新建）** | 用例（新档） | T-VS-U1–U7（夹具自持，`suspFixture` 手法同 `thincoder-vscode/test/async-parity.test.mjs:245-260`；U7 = 组合同规） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 19 | `thincoder-vscode/test/files.mjs` | 101 | +1 | 入册 | 新档登记（未登记 = 不跑——`thincoder-vscode/test/run.mjs:49-51` 自检） |
| 20 | `thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs` | 266 | +1（改行） | 夹具同步 | `:48` 字段副本 12 → 14（T-AF16 对位锁 `:263-266`——不改即红） （机检豁免——用例退场登记） |
| 21 | `thincoder-vscode/src/agent/turn-domains.mjs` | **31**（实测） | **+31（新建）** | 新档（拆分计划落地 + 端侧域文本组合单点） | 核基座转口（两名）+ `VSC_TURN_OVERLAY` + `composeTurnDomain(upstreamTurn)`——§6.27.12.5 L |
| 22 | `thincoder-cli/src/tui/agent-turn.mjs` | 343 | **0（两行就地改）** | 旗标贯通（CLI 跳——**修正轮 1 补入**） | `:71` 解构补 `upstreamTurn` + `:147` opts 字面量补 `upstreamTurn`（承接发现 1——CLI 驱动与核 `runAgent` 之间的漏跳）；行号置尾以保本表既有行序 |
| 23 | `thincoder-core/test/parent-channel-upstream.test.mjs` | **95**（实测） | **+95（新建）** | 用例（新档——**修正轮 1 拆分落地**） | T18–T22（含档头 / import 面 ≈10–12 行）；`thincoder-core/test/run.mjs:37` 单层 `test/*.test.mjs` glob 自动收集（无需入册） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |

**越线核查（修正轮 1 收正——原「零新增越线档」句不实，见发现 2）**：

① **核侧硬门**（`thincoder-core/test/core-hygiene.test.mjs:109-123`——`walk()` 覆盖 `test/`、注册表 `:46-58`（含 2026-09-20 渠道批补登的两条 test 条目）⇒ >300 未登记 = 红，且 U5 重点族含 `core-hygiene`）：`parent-channel.test.mjs` 291 + 45 会越线 ⇒ **已拆**（T18–T22 → 行 23 新档；`thincoder-core/test/run.mjs:37` 单层 glob 自动收集）。（迁移期引文）

**登记 `SOFT_LINE_REGISTRY` 路被否**（二选一之另一支）：注册表当年 33 档全为源档、零 `test/` 条目（**该批时点论**；2026-09-20 渠道批起 test 条目已可入册——见 `CORE-UNIFICATION.md` §2.8.1 子表行 12 / 13）；登记动作 = 产品码 `core-hygiene.test.mjs` 改 + 设计档 `CORE-UNIFICATION.md` §2.8.1 拆分计划补登——两者皆出本批写域，且 test 档无「拆分计划」面（2026-09-15 批已裁「勿以为 `test/` 免档位」）。

② **CLI 侧 advisory 线**（无同族机检门——`SOFT_LINE_REGISTRY` 全仓仅核档一处）：`input-lock.test.mjs` 267 → **368（实测）** 越 300 **advisory** ⇒ **拆分立场 = 本批不拆**（该档 `driveRig` 夹具 `:137-164` 为本档自持，外提即改既有夹具结构；先例 = 2026-09-18-toolface-fixes §2「端侧测试档存量超线 ⇒ 拆分另议」——CLI 现役 >300 测试档 **16 档**、最大 488）。

**拆分计划（触发式）**：该档下次实质改动，或 CLI 侧引入档位门时，把 `suspensionSession` 直驱段（`:134-267`）连 `driveRig` 一并外提；**消解条件 = 上述触发之一**。

③ 最大档 `thincoder-core/agent.mjs` 436 → ~441（≤500 硬限）；`parent-channel.mjs` 209 → ~231（守 300 软线）⇒ **核侧零新增越线档**；VSC 侧零新增（见下尾距注 + 拆分计划）。

④ **读数口径（修正轮 1 · 发现 8 处置）**：① `input-lock.test.mjs` 取实测 **267**（原记 268 = 口径差）；② `docs/core/design/AGENT-LOOP.md` **519**（行 11）、③ `thincoder-core/agent-tools/subagent-spawn.mjs` **484**（§6.14 `:616`）、④ 本档自持 **1932**（行 10）= **as-of 读数**（批档 / 现盘另记 ~535 / 473 / newline 1931——差已登记）⇒ **本批不追值**，统一归实现轮。

**VSC 侧尾距（拆分计划已落地）**：`thincoder-vscode/src/agent.mjs` 485 → ~487（距 500 硬限 ~13 行——N-P3 口径）——域文本常量族（`:23-30`）外提至行 21 `thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 **37**），该档净移出 8 行，抵消本批他项净增；拆分触发面清零（判据 = `wc -l`（≡ `find /c /v ""`）读数）。
`thincoder-vscode/src/extension/suspension.mjs` 397 → ~409（>300 咨询线、≤500 硬限）——读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1（**登记归父侧派单**，本席不越域）。

#### 6.27.12.8 唤醒轮域文本（逐字建议——**内容权 = 父侧**；本档只出文本）

落点 = `thincoder-core/agent/helpers.mjs`（常量）+ `thincoder-core/agent/run-start.mjs:97-101` 邻位（选择）；manual 档注入（`transient: true`——同 `AUTO_TURN_DIGEST_DOMAIN` 注入口）：

（下方按行宽折行展示；**实现时 = 单行字符串常量**——逐字拼接，无换行）

```
[System reminder: auto-turn — a running subagent sent you an in-flight message (shown below). No user message is waiting.
Decide it now and reply with subagent action:'send' (id + message) — the child consumes the reply at its next turn boundary and keeps working
on the unaffected parts; if the message needs no answer, say so in one line and move on. If finished subagent reports are also present above,
summarize them as usual in the same turn. Do not start new work: FORBIDDEN this turn (mechanically enforced): modifying files, bash/execute/verify,
spawning subagents, asking questions — those need a real user message. End the turn once the reply is sent.]
```

**指位约束（修正轮 1 · 发现 4——上方改述 = 改述建议，定稿权 = 父侧）**：域文本先注入（`thincoder-core/agent.mjs:163-165`，循环前）、在飞消息由循环头 drain 追加（`:225`）⇒ 消息落于域文本**之后（下方）**——逐字面**不得**以「above / 上方」指在飞消息（原「named in the reminder above」与注入次序相抵）；末段「finished subagent reports … above」指 run 首注入的已结算报告（`:111-122`）——用法正确、保留。

**双面纪律**（承 §6.27.8 先例）：英文运行面（核 `helpers.mjs`）+ 中文权威面的对位文本归父侧同轮落笔；本档只登记落点与逐字建议。

#### 6.27.12.9 用例表（正常 / 边界 / 错误）

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T18 | 正常·ask 入队即唤醒 | 父挂起（`_asyncWaiters` 已注册）· 子入队 `{kind:"ask"}` | 等待栓被兑现（`_asyncWaiters` 清空 + 唤醒回调恰 1 次）；入队同步返回（零 await） | 批 §2 条目 1 |
| T19 | 边界·note 不唤醒 | 同 T18 但 `{kind:"note"}` | 唤醒回调 **0 次**；队列长度 1 | 条目 1 / 边界 7 |
| T20 | 边界·无等待栓（父侧忙 / 已退出） | `_asyncWaiters` 缺省 / 空数组 | ask 入队成功、唤醒 no-op（零抛错、队列长度 1） | 条目 1 / F11 / F12 |
| T21 | 谓词真值 | `[]{ }` / `[{kind:"note"}]` / `[{kind:"ask"}]` / `[{kind:"note"},{kind:"ask"}]` 四形 | `upstreamWaiting` = false / false / true / true | 条目 2 |
| T22 | 结构单点（机检） | 源文本 | `async-settle.mjs` 内 `wakeAsyncWaiters` 定义 1 处 + `splice(0)` 全档仅在该函数内；三驱动第 2 步含 `upstreamWaiting(`；`agent.mjs` 的 `drainChildUpstream(agent)` 仍恰 1 处（既有断言 `parent-channel.test.mjs:130-133` 不破） | 条目 1 / 2 / 零回归 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T23 | 正常·核驱动开轮（假 carrier） | `startSuspension`：池内 1 running + `_childUpstream` 含 ask；假 `runTurn` 记录 `(text, opts)` 并清池 | `runTurn("", { autoTurn: true, upstreamTurn: true })` 恰 1 次；`res.upstreamTurn === true` | 条目 2 |
| T24 | 边界·核驱动 note 不开轮 | 同上但 `[{kind:"note"}]` | 零 `runTurn` 调用；池空即退出（`reason: "idle"`） | 条目 2 / 边界 7 |
| T-CL-U1 | 正常·CLI 驱动开轮 + **旗标贯通（修正轮 1 补——发现 1）**（`driveRig`） | `agent._childUpstream = [{kind:"ask",…}]` + 池内 1 running；桩 `ctx.runAgent`（记录第 4 参 opts） | 桩被调 1 次（`text === ""`——auto 轮）；**桩第 4 参 `opts.upstreamTurn === true`**（旗标未被 CLI 跳丢弃——可机检）；提示行为 ask 档携参形态（字面随 F-UC8 批收正——§6.27.12.13 ⑦） | 条目 4 |
| T-CL-U2 | 边界·CLI 驱动提示行矩阵 + 不误开轮 | ① 仅 note ⇒ 桩 0 次 ② manual 档 ask ③ manual 档 digest ④ AUTO 档两因 | 字面断言（四格矩阵——F-UC8 批四处字面收正，见 §6.27.12.13 ⑦ T-SL-C1） | 条目 4 / 条目 3 |
| T-VS-U1 | 正常·端壳驱动开轮（`thincoder-vscode/test/upstream-parity.test.mjs`） | 桩面板 + `history` 内 `_childUpstream = [{ kind:"ask", … }]` + 池内 1 running；桩 `runTurn` 记录 `(opts)` | 恰 1 次调用且 `opts = { autoTurn: true, text: "", upstreamTurn: true }` | 条目 9 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T-VS-U2 | 正常·注入内容非空（补 F8 病征） | 同 T-VS-U1；桩 `runTurn` 内调核 `drainChildUpstream(history)` | `history` 尾条 user 消息含 `ask · <role>#<id>: <message>`（**非空**）；队列消费即清（`_childUpstream.length === 0`） | 条目 7 |
| T-VS-U3 | 正常·ask 唤醒驱动开轮（端到端·含载体别名路） | 不 await 地起 `suspensionSession`（会话进第 4 步等待）→ 一拍后 `pushChildUpstream({ parent: { history }, kind: "ask" })`（合成 parent 形——写侧别名） | 等待栓被兑现 ⇒ 驱动重入 ⇒ 第 2 步真 ⇒ 桩 `runTurn` 恰 1 次；日志含 `upstream: true`；会话自然退出 | 条目 9 |
| T-VS-U4 | 边界·note 不唤醒不开轮 | 同上但 `{ kind:"note" }` + 池空 | 桩 `runTurn` 0 次；会话退出（`history._suspended === false`）；队列长度 1（留队等下拐点） | 边界 7 |
| T-VS-U5 | 结构机检（端侧名集 + 消费点 + 谓词 + 组合单点） | 源文本 | 生产 `CARRIER_FIELDS` 含两款（夹具副本 == 生产表——既有 T-AF16 锁，本批同步）；`thincoder-vscode/src/agent.mjs` 含 `drainChildUpstream(agent)` 恰 1 处 + `composeTurnDomain(` 调用恰 1 处 + 动态 import 形态（静态引即红——W8 契约②）；`thincoder-vscode/src/extension/suspension.mjs` 含 `upstreamWaiting(`；`thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 **37**）含 `composeTurnDomain(` 定义恰 1 处 + `VSC_TURN_OVERLAY` ∧ **零核基座文本字面**（核单源守护） | 条目 7 / 8 / 9 （机检豁免——用例退场登记） |
| T-VS-U6 | 正常·回复可达（`send` → runs 子代理） | 端侧载体形（`{ history }` 合成父 + 池挂 history）+ `executeSendAction({ id, message }, ctx)` | `delivered` + 条目 `_injected` 呈追加（下回合边界消费——回复路径零改） | 条目 7 / §6.27.12.4 ① 回复可达性 |
| T-VS-U7 | 正常·组合同规（两轮构成差异项 = 0） | 端侧纯函数两分支（`composeTurnDomain(false)` / `composeTurnDomain(true)`——`thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 **37**）） | 两返回值：① 各以对应核基座（`AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`）逐字起头；② 均含 `VSC_TURN_OVERLAY` 全串（逐字）；③ 均以 `]` 收尾且端 overlay 在收尾括号内；④ 两返回值的 overlay 段逐字相同（差异项 = 0） | 条目 9 / §6.27.12.12 ④ |

**用例档位（修正轮 1 · 发现 2）**：T18–T22 = `thincoder-core/test/parent-channel-upstream.test.mjs`（已落 · 实读 146——拆分落地，行 23）；T23 / T24 = `thincoder-core/test/suspension.test.mjs`；T-CL-U1 / U2 = `thincoder-cli/test/input-lock.test.mjs`；（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
T-VS-U1–U7 = `thincoder-vscode/test/upstream-parity.test.mjs`（已落 · 实读 276）。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

#### 6.27.12.10 验收标准（逐条回指——可机检 · Windows / cmd.exe）

| # | 判据（cmd.exe 可跑） | 回指 |
|---|---|---|
| U1 | `cd thincoder && node --test thincoder-core/test/parent-channel.test.mjs thincoder-core/test/parent-channel-upstream.test.mjs` 全绿（**T18–T22 在新档**——修正轮 1 拆分；原档导出面断言 `:268-279` 更新后含 `upstreamWaiting`、常量仍**恰 3 个**） | 批 §2 条目 1 / 2 |
| U2 | `cd thincoder && node --test thincoder-core/test/suspension.test.mjs` 全绿（含 T23 / T24——假 carrier / 假 runTurn 纯 Node 驱动，不加载端模块） | 条目 2 |
| U3 | `cd thincoder && node --test thincoder-cli/test/input-lock.test.mjs` 全绿（含 T-CL-U1 / U2——`driveRig` 直驱 `suspensionSession`，不触网） | 条目 4 |
| U4 | 结构机检（ASCII 令牌，单行 `node -e`；四查：两定义点 + 两调用点）：`node -e "const fs=require('fs');const f=(p,s)=>{if(!fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' missing: '+s)};f('thincoder-core/agent-tools/parent-channel.mjs','export function upstreamWaiting');f('thincoder-core/agent-tools/async-settle.mjs','export function wakeAsyncWaiters');f('thincoder-core/agent/suspension.mjs','upstreamWaiting(');f('thincoder-core/agent-tools/parent-channel.mjs','wakeAsyncWaiters(')"` | 条目 1 / 2 |
| U5 | 零回归（**按包拆分——修正轮 1 · 发现 7**；仓根无 `package.json`）：cwd = `D:\teamcode\thincoder` ⇒ `cd thincoder-core && npm test` + `cd thincoder-cli && npm test` **双绿**——重点族落点：核包 = `core-hygiene` / `family-tools`；CLI 包 = `async-settle` / `queued-stop` / `input-lock` / `attention-state` / `subagent-observe-send` / `doc-check`（机检本体仍 = 仓根 `node scripts/doc-check.mjs`——U8） | 不变量 ⑤ |
| U6 | 零新增计数 / 上限：`parent-channel.mjs` 导出常量集不变（3 个）；三驱动第 2 步**无新增数值常量** | 不变量 ③ |
| U7 | 提示词面零行：`git diff --stat -- thincoder-core/prompts docs/core/design/prompts` 输出为空（主分支不需改承诺） | 批档禁触面 |
| U8 | 文档一致：`node scripts/doc-check.mjs` 输出中**本批触碰档零新增**悬空锚 / 行宽条目（基线（修正轮 1 复测，cwd = `thincoder/`）= **6 悬空 / 18 行宽**——存量，非本批引入；初期轮记 17 = as-of 读数；本批落地后复测原始读数 = **6 / 19**，**剔除他批同期写入 1 行（`docs/core/design/PROMPT-SYSTEM.md:293`）后 = 6 / 18** ⇒ 本批写域**净增 0**；本批触碰两档零悬空 / 零行宽条目）；§6.27.12 ↔ 批档 §2 ↔ 需求档 §4.12 三方条目同源 | 批档自身约束 |
| U9 | VSC 载体检修：`cd thincoder-vscode && node --test test/upstream-parity.test.mjs test/integration/scenario-03-subagent-lifecycle.test.mjs` 全绿（含 T-VS-U1–U7 + 夹具同步） | 条目 7 / 8 / 9 |
| U10 | VSC 零回归：`cd thincoder-vscode && npm test` 全绿（单元 + 集成两清单；启动自检含无漏登记反查） | 不变量 ⑤ |
| U11 | 端壳静态闭包不破：`node --test docs/batches/2026-09-29-residuals-round2.test.mjs`（腿 A——W8 契约②判据现载体；单测树重建时回迁端侧单测档）全绿（`node:sqlite` 不入静态链） | 不变量 ① / ⑤ |
| U12 | 端侧结构机检（ASCII 令牌，单行 `node -e`；四查 + 一否定）：`node -e "const fs=require('fs');const f=(p,s)=>{if(!fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' missing: '+s)};const g=(p,s)=>{if(fs.readFileSync(p,'utf8').includes(s))throw new Error(p+' must not contain: '+s)};f('thincoder-vscode/src/agent.mjs','drainChildUpstream(agent)');f('thincoder-vscode/src/extension/suspension.mjs','upstreamWaiting(');f('thincoder-vscode/src/agent/turn-domains.mjs','composeTurnDomain');f('thincoder-vscode/src/agent.mjs','composeTurnDomain(');g('thincoder-vscode/src/agent/turn-domains.mjs','[System reminder: auto-turn')"`（在 `thincoder` 根跑；末项 = 核单源守护——新档零核基座文本字面） | 条目 7 / 9 |
| U13 | 行宽门（N-P3 硬限）：`find /c /v "" thincoder-vscode\src\agent.mjs` ≤ 500（本批预测 ~487）；报告行数口径 = `wc -l`（≡ `find /c /v ""` 实测） | 拆分计划已落地（行 21） |

#### 6.27.12.11 边界（本批不做）

1. 不改非阻塞地基：`notify_parent` 仍同步返回（无等待 / 无拉取 / 无轮询导出）——N1 / D-UC3。
2. 不新增机制计数 / 上限（承用户 2026-09-18 裁定）；`UPSTREAM_*` 三常量语义与数值零改。
3. 不动 consult / depth-0 面；不动 `send` / `observe` / `status` / `cancel` / `panel` 语义与文案；不动 depth 门条文。
4. 不改 settle / digest / 用户输入三路既有唤醒语义（W1–W3）；不改 `_childUpstream` 生命周期与池解耦（F3）、sync 子代理面（F6）。
5. 不改提示词面（`prompts/**`）与 `notify_parent` 工具描述 / 返回注（主分支下承诺变真，无需改准）——**内容权 = 父侧**。
6. **降级分支（不落 · 备份路径）**：若父侧裁为 note-only 降级，则改准面 = 工具描述 `parent-channel.mjs:183-195`（`:187` 承诺句）· `ASYNC_NOTE` `:54-58` · 提示词面 `thincoder-core/prompts/common.md` + 模板 `docs/core/design/prompts/common.md`（父侧笔）· 需求 F-UC1 / F-UC2 / F-UC6 收紧（父侧笔）；机制零改。
7. **note 面（登记）**：`note` 入队**不唤醒**（§6.27.12.4 ①）⇒ 挂起期 note 仍等下一拐点——若父侧要求 note 一并唤醒，改动 = `upstreamWaiting` 谓词一行（`q.some(...)` → `q.length > 0`）+ 用例 T19 / T24 反转；**代价 = 每条 note 一次父侧轮**（轮风暴面，故默认不开）。
8. **VSC 面已并入本批（设计面；实现已落地）**：本批 VSC 写域 = 文件表行 **12–21**（源 7 档 + 新测 1 档 + 登记 1 档 + 集成夹具 1 档）；**不动** webview 面（`digest` 消息族 / `suspension` 消息族 / 文案）与提示词面——细则 = §6.27.12.12。
9. 不改需求档正文（父侧笔）；不做「父→子」新动作 / 新管子（回复路径恒 = `send`）。


#### 6.27.12.12 VSC 对位面（本批并入——用户 2026-09-19 23:23 裁定「**vsc 肯定要扩啊，否则不完整啊**」）

**回指**：需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 **N4**（范围 = **核侧 + CLI + VSC 两端对位**）；台账 **#87**（VSC 端壳上行通道对位 = F8 三项，均已对位）。
**本节功能**：VSC 面**落地设计**——四面 + 接口契约（§6.27.12.5 G–L）+
关键决策 + 端侧域文本组合（核基座 + 端 overlay——§6.27.12.5 L）+ 用例 / 验收（§6.27.12.9 / §6.27.12.10）+ 边界。

**① drain 面（端侧消费点）**

- **落点** = 端壳自有 depth-0 循环的**循环头**：`thincoder-vscode/src/agent.mjs:179`（as-of 2026-09-29） 循环体首段，紧随 `opts.turnInput?.()` 消费段（`:193-198`）——与核 `thincoder-core/agent/turn-loop.mjs:87-89`（`consumeInjected` → `drainChildUpstream`）**同址反向**（同址 = 回合边界单点；反向 = 核该处兼收父→子注入，端壳该处只收子→父在飞消息）。
- **形态 = 复用核单源**（动态 import `@thincoder/core/agent-tools/parent-channel.mjs` 取 `drainChildUpstream`；run 起取一次、循环头调用一次）——**禁另造第二实现**。
- **为什么不是另一边（端侧自持一份）**：① **写侧已在核**——入队单点 `pushChildUpstream`（`thincoder-core/agent-tools/parent-channel.mjs:124-134`）是唯一生产者，VSC 子代理经核 `runChildPipeline` → 核 `runAgent` 运行 ⇒ 端侧副本 = 第二份实现 + 第二份抬头 / 注脚文案（`endNote` 读池 + 墓碑）⇒ 漂移源（D2 单一权威源）。
  ② **同面既有先例（W13 · 2026-09-15）**：`thincoder-vscode/src/extension/suspension.mjs:68-73` / `:344-356`（as-of 2026-09-29） 已把 pending 停靠（`parkAsyncPending`）· 残余注入（`injectAsyncResult` / `injectConsultResult`）· 会诊清理
  （`cleanupConsultSessions`）改为**核单源 + 动态 import**，端侧镜像随「镜像删旧」退役；`subagent` 工具族（status / observe / send / cancel）同批同向 ⇒ 本项沿同一收敛方向。
  ③ **FR23 的适用面界定**：FR23「语义同源 · 原文自持（两端各自实现、不共用代码）」的对象 = **工程模式机制的跨端镜像**
  （`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.2 / `docs/core/design/BATCH-RECORD.md` §6.1），其「不共用代码」的**前提 = 两仓分立**（跨仓 import 不可行）——
  该前提已由两仓合并批（`thincoder-cli/docs/batches/2026-09-13-TWO-REPO-MERGE.md:128` **R14**：「import 禁令删除……『语义同源 / 各写一份』保留」）撤销
  ⇒ 单仓内核包复用**不违** FR23，且**强于**「语义同源」（同一实现）。④ 端壳「自持 depth-0 循环」不是障碍——本项是**单点调用**（非把核循环搬端侧），与 W15 的「循环契约位移 = 调用期适配」同款。
  **备选（登记不采）**：端侧自持 drain 副本——收益 = 端侧可自定文案（本项无此需求）；代价 = 上文 ① 的漂移面。若父侧另裁，改动面 = 端侧新函数 + 夹具重组（本设计不预设）。
- **W8 契约②（硬）**：`thincoder-core/agent-tools/parent-channel.mjs` 静态闭包实测**可达 `node:sqlite`**（本席实测 126 档）⇒ **必须动态 import**（静态引 ⇒ W8 契约②判据（现载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`；单测树重建时回迁端侧单测档）即红）。

**② 载体表**

- `CARRIER_FIELDS`（`thincoder-vscode/src/agent.mjs:36-40`；as-of 2026-09-29）**12 → 14 款**（+ `_childUpstream` / `_childUpstreamSeq`）——进 `:146-152` 访问器绑定循环；`docs/core/design/AGENT-LOOP.md` §2.3 的 VSC 绑定不变式**本批归零**（13 款全集全绑定——承接句见该档 `:114`）。
- **不预建容器**（`:139-145` 预建块**不加行**）：创建 / 借用归核单点 `upstreamHolder`（`thincoder-core/agent-tools/parent-channel.mjs:76-89`）；两读点皆有 `Array.isArray` 守卫（缺容器 ⇒ 谓词 `false` / drain 返 0——fail-closed，不抛）。
- **夹具同步（硬）**：`thincoder-vscode/test/integration/scenario-03-subagent-lifecycle.test.mjs:48` 字段副本 + T-AF16 对位锁（`:263-266` `deepEqual` 双向）——**不改即红**；`thincoder-vscode/test/integration/vsc-panel-rings.test.mjs:35` `BOUND_CARRIER_FIELDS` = **子集**断言 ⇒ 零改。 （机检豁免——用例退场登记）

**③ 唤醒 + 开轮谓词 + 日志标签**

- **等待单点零改**：`thincoder-vscode/src/extension/suspension.mjs:163-195`（as-of 2026-09-29） 已双载体注册 `_asyncWaiters`（`:190`）——核 ask 入队尾的 `wakeAsyncWaiters(parent)` 经 `carrierField` 命中同一容器（`panel._agent` 访问器 → 共享 `history`；`:171` 的第二载体 = `susp.lines.history` = 同一数组）。**本项不新增注册点**（唤醒面 W1 复用成立）。
- **第 2 步判据**（`:283-284`）：`const upstream = upstreamWaiting(history)` + `if (pendingN > 0 || upstream)`。**谓词必须先于第 3 步池空退出**——「池空 + 队列留 ask」（子代理已 settle 且报告已消化）仍须开一轮把它 drain 出来。
- **旗标**：`entry.runTurn({ autoTurn: true, text: "", upstreamTurn: upstream })` → 三跳透传（§6.27.12.5 I）→ 端壳 `runAgent` 域文本组合调用（§6.27.12.5 G ④ / L）。
- **日志标签**（父侧同轮裁定 ④ · 两端同规）：`digest:start` / `digest:end` 载荷**条件携带** `upstream: true`（仅 ask 唤醒轮）——VSC `thincoder-vscode/src/extension/suspension.mjs:287` / `:307`；CLI 同式（§6.27.12.5 K）。**备选（未采）**：恒带布尔（`upstream: false`）——对既有 digest 轮载荷的字节零扰动优先。

**④ 端侧域文本 = 核基座 + 端 overlay（两轮同规 · 组合单点 = §6.27.12.5 L）**

- **形态**：端侧域文本 = **核基座（转口逐字——`AUTO_TURN_DIGEST_DOMAIN` / `UPSTREAM_TURN_DOMAIN`；端侧零自持基座副本）+ 端 overlay（`VSC_TURN_OVERLAY`——端特有 advisor / consult / escalate 呈递纪律，端侧自持）**；组合 = 端侧纯函数 `composeTurnDomain(upstreamTurn)`（`thincoder-vscode/src/agent/turn-domains.mjs`（已落 · 实读 37））——**选择仅换基座，端 overlay 恒在场**。
- **端 overlay 字面**（逐字搬迁 · 零新撰 / 零改写；下方按行宽折行展示，实现时 = 单行）：

```text
(async advisor review reports: present the findings and suggested fixes verbatim — do not apply them;
consultation reports: present each reply verbatim with your per-reply adoption judgment as text — do not apply anything;
escalate reports: summarize the merged post-op work — further changes need a user message)
```

- **两轮对照（域文本构成 · 差异项 = 0）**：

| # | 构成项 | VSC digest 轮 | VSC ask 唤醒轮 | 差异 |
|---|---|---|---|---|
| 1 | 核基座（核单源） | `AUTO_TURN_DIGEST_DOMAIN`（转口逐字） | `UPSTREAM_TURN_DOMAIN`（转口逐字） | 按轮型换基座——核侧同款二选一（`thincoder-core/agent.mjs:162` 邻位同判）⇒ 非构成差异 |
| 2 | 端 overlay（呈递纪律） | `VSC_TURN_OVERLAY`（逐字） | 同常量 · 逐字 | **0** |
| 3 | 组合形态 | `composeTurnDomain(false)` | `composeTurnDomain(true)` | **0**（同一纯函数） |
| 4 | 注入点 / 载体 | `thincoder-vscode/src/agent.mjs:125-127`（`history.push` + `transient`；as-of 2026-09-29） | 同址 | **0** |
| 5 | 注入条件 | `autoTurn && !getAuto()` | `upstreamTurn && !getAuto()` | **0**（同门；AUTO 档两侧皆无域文本） |
| 6 | 四族覆盖（subagents / consultations / escalate reports / advisor reviews） | 基座（subagents）+ 端 overlay（其余三族——“consultation reports” / “escalate reports” / “async advisor review reports” 类目形态） | 同 | **0** |
| 7 | 机械拒绝面 | 同（`autoTurn` ⇒ permission deny-stub + spawn 门） | 同 | **0** |
| 8 | 收尾形态 | `]` 收尾 · 端 overlay 在括号内 | 同 | **0** |
| 9 | 宿主日志载荷 | `digest:start` / `digest:end` | 同 + `upstream: true` | 非文本面（有意区分项——两端同规：CLI 同式 = §6.27.12.5 K） |
| 10 | webview 起跑行 | 起跑即 post `digest` 消息（`n` 可 0） | 同（两轮同规） | 非文本面（可见性面——登记见 ⑥） |

⇒ **域文本构成差异项 = 0**（第 1 行 = 按轮型的基座选择；第 9 / 10 行 = 非文本面且各有既定登记）。

- **Δ 登记（文本形态 · 零新撰）**：① 四族枚举短语（端侧变体头部「/ consultations / escalate reports / advisor reviews」）作为独立串退役——该短语语法上系于 digest 基座的句身（ask 基座无同句），不能作两轮共用 overlay 片段；其外延由端 overlay 的族名列举穷尽（其余三族以「… reports」类目形态在场，subagents 由基座承载——四族覆盖零缺口；**枚举原串逐字不保留**，如实登记）。
  ② 端 overlay 落位 = 基座正文之后、收尾 `]` 内（原 = 句内嵌套）；③ 端侧核文本副本（原整体变体）退役——基座部分改引核单源，端特有部分入端 overlay（端特有述句单源化）。
- **备选（登记 · 须父侧先裁才可动——属核侧改文本）**：把四族枚举**上收核基座**——收益 = 枚举在两端两轮恒在场、端 overlay 只携纪律句；代价 = 核文本改（内容权 = 父侧）+ CLI 文本随之变 ⇒ 本设计不采。

**⑤ 写域与实证口径（如实登记）**

- 本批 VSC 写域 = 文件表行 **12–21**；核面零改；**CLI 面 1 档**（`thincoder-cli/src/tui/agent-turn.mjs`——旗标贯通两行，**修正轮 1 补——发现 1**；行 22）+ CLI 日志载荷回填（§6.27.12.5 K，承父侧同轮裁定 ④）。
- **实证面 = CLI**（§6.27.12.1）；VSC 面 = **对位设计已并入本批（2026-09-19 · 设计面）**（结构 + 夹具可机判）。本机默认流非 VSC ⇒ VSC 侧行为验收 = 收口轮**重载扩展后实跑**（「重载后自验」口径；`docs/core/requirements/ENGINEERING-MODE-V2.md` §13.2）。
- **台账 #87 关系**：其 **①②**（端壳循环插 drain / 端壳载体表补两字段 + 夹具）= **本批设计并入（2026-09-19 · 设计面；实现已落地）**；其 **③**（端壳取消 / 观察面对位）= **已对位**（取消走核单源 `executeCancelAction`；观察面 = `vscSubagentFace`）。台账本体 = 父侧笔（本席不改）。

**⑥ 边界（VSC 面）**

- **webview digest 可见面**：`digest` 消息族的可见面契约 —— 起跑即 post（`n` 可 0，**两轮同规**）；载荷 `tier` ∈ `ask` / `digest`（**按因两档**）+ ask 档携 `from` / `msg`（问题摘要——`msg` 单行 + 截断 ≤120 字符，核单点 `upstreamAskLabelVars`）；**计数元素随 `n > 0`**（两档同规——`n = 0` 零元素 ∧ end 零动作）；标签键 = `digest.turnLabelAsk`（携参）/ `digest.turnLabel`（缺省档）。
  契约单源 = `docs/vsc/design/WEBVIEW.md` §5.1（机制：档位判据与元素约束）与 `docs/vsc/design/WEBVIEW-PROTOCOL.md` §5（元素级：标签行 / 计数行 / `start`·`end` 语义）——本节不重述。
- **不动提示词面 / 工具描述 / 返回注**（同 §6.27.12.11-5）。
- **不做** VSC 侧 `escalate` / `consult` 面的上行对位（本批只及子代理 spoke 面——与 §6.27.2 射程一致）。
- **端 overlay 字面 = 逐字搬迁既有端述句**（零新撰 / 零改写——落点 = §6.27.12.5 L；四族枚举短语的处置见 ④ Δ 登记）。

#### 6.27.12.13 信号提示行（F-UC8 · 全档 × 双端）（2026-09-21 · 批 `2026-09-21-subagent-signal-lines` · 台账 #166）

**回指**：需求 `docs/core/requirements/AGENT-LOOP.md` §4.12 **F-UC8**（全档按因分流 + ask 携「谁 + 啥」+ CLI digest 起跑对位 VSC；**N4 范围 = 核侧 + CLI + VSC 两端**）。
**射程**：只动**可见提示面**——唤醒 / 开轮 / 域文本 / `UPSTREAM_*` / 队列结构 / 提示词面**零改**；X9 收尾行**加 `pend0 > 0` 守卫一处**（ask-only 轮零收尾行——父侧 2026-09-21 02:0x 裁定；逐条见 ⑨）。

**① 档位矩阵（判据 = `upstream` 旗标（`upstreamWaiting`）——ask 因恒优先于 digest 因）**

| 模式 | 本因 | 标签行（键） | 计数行 | 备注 |
|---|---|---|---|---|
| manual | ask（未 drain ask 在场） | `digest.turnLabelAsk`（携参——②） | `pend0 > 0` ⇒ `digest.start` | 两因同轮 ⇒ 标签取 ask、计数照出 |
| manual | digest | `digest.turnLabel` | `pend0 > 0` ⇒ `digest.start` | 既有字面零改 |
| AUTO | ask | 同 manual · ask | 同 | AUTO 泛句退场（④ D-SL1） |
| AUTO | digest | 同 manual · digest | 同 | 同上 |

- **档值 = `tier` ∈ `ask` / `digest` 两档**（`auto` 档退役——D-SL1）；webview 侧 `tier` 缺省 ⇒ `digest.turnLabel`（后向兼容面保留）。
- **计数行 / 计数元素规则 = `n > 0`**（不按档判——两端同规；`n = 0` 的 ask-only 轮零计数元素：幻影行禁出不变）。

**② ask 携参形态（单源 = 核 `upstreamAskLabelVars(carrier)`）**

- **选择 = 队首**：`_childUpstream` 插入序首个 `kind === "ask"`——与 drain 合并注入的列示序同源；多 ask 时标签示其一，**全文由该轮注入承载**（不并列 / 不 `+N`——D-SL5）。
- **`msg` = 显示串**：折行 / 连续空白归一为单空格 + **截断 120 字符**（超长补 `…`）；口径 = **字符**（跨端单源；宽字符在窄终端折行——列宽口径见 ⑨-5）。
- **`from` = 原文**（`role#id`——`role` = `[\w-]+` 机器键，零改写）。
- **防御缺省**：归一后空串（工具闸拒空 message ⇒ 不可达）⇒ `msg = "…"`；`from` 缺 ⇒ `"?"`。

**③ CLI digest 起跑行（对位 VSC——消费既有 `digest.start`）**

- 位置 = 标签行之后、`runAgentTurn` 之前（VSC `thincoder-vscode/src/extension/suspension.mjs:321` post 早于 `:324` runTurn——同序）。
- 计数 = **起跑数** `pend0 = pendingFamilyCount(agent)`（`thincoder-cli/src/tui/suspension-drive.mjs:182` 取数点前移）——与 X9 收尾行（`:191`）同源。
- 形态 = `pushLine(t("digest.start", { n: pend0 }), C.dim)`（dim 与标签行同色；VSC 对位元素 = `.digest-status`）。
- **X9 收尾行 = `pend0 > 0` 守卫**（**父侧 2026-09-21 02:0x 裁定纳入本批**）：`pend0 = 0`（ask-only 轮）⇒ **零收尾行**——与起跑行同规则（两行成对，`n > 0`）；**`digest.done` / `digest.aborted` 两形态同判**（VSC 侧零动作守卫先于 `ok` 判——`thincoder-vscode/webview/chat.js:425-426`，两端行为对齐）；其外形制零改（字面 = 核容器 `t()` / 计数口径 = 起跑数 `pend0` / 轮序）。

**④ 关键决策（含否决备选）**

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| D-SL1 | `digest.turnLabelAuto` **退场**（键删除 + `tier` 的 `auto` 值退役） | 开轮因穷尽（`pendingFamiliesNonEmpty` ∥ `upstream`——CLI `:253` / VSC `:307`）⇒ 泛句无生产者；模式可见性另有载体（CLI `AUTO│` 横幅 `thincoder-cli/src/tui/render-frame.mjs:233` / VSC `autoApprove` 广播 `thincoder-vscode/src/extension/panel-session.mjs:141`） | 降兜底（保留 `auto` 档作未知来源回退）——无未知来源、徒留死分支 |
| D-SL2 | 计数行规则 = `n > 0`（替「非 ask 档」） | 两因同轮时 digest 计数不丢（VSC 亦得 `digest.done` 收尾更新）；两端规则同式 | 按档判（ask 档吞计数——两因同轮信息缺失） |
| D-SL3 | 携参单源 = **核 `parent-channel.mjs` 新导出**（选择 + 显示串同点） | 选择须走 `carrierField` 吸收（父字段 / 载体别名两形态）；截断 / 归一字面跨端一致（D2） | 两端各自读原始字段（载体形态漏读 ⇒ 标签与 tier 判据分叉）· VSC 自持副本（第二单源） |
| D-SL4 | 标签字面 = **核容器键**（CLI 亦改读容器——零自持字面） | D2 单源（CLI 现持硬编码字面 = 第二份）；CLI 既有 `t()` 先例（`thincoder-cli/src/tui/suspension-drive.mjs:29` / `:191`） | CLI 保留硬编码（两端逐字漂移面） |
| D-SL5 | 多 ask 取队首（不并列 / 不 `+N`） | 注入消息列全量（`drainChildUpstream` 合并列示）；提示行 = 单行信号 | 并列（行宽爆）· `+N`（新变量 + 双语键面） |

**⑤ 接口契约（改点逐档；行数 = as-of 2026-09-21 01:5x 实测）**

**a. `thincoder-core/agent-tools/parent-channel.mjs`（231 行 → ~250 行）**——新导出（已落；导出面 +1 名——`thincoder-core/test/parent-channel.test.mjs:272` 名单同批更新）：（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

```js
/** ask 提示行显示串上限（字符——模块内常量，不导出）。 */
const ASK_LABEL_MSG_MAX = 120

/** ask 提示行携参（显示面单点——CLI / VSC 两端同源）：队首未 drain ask ⇒ `{ from, msg }`；无 ⇒ null。
 *  选择 = 插入序首个 `kind === "ask"`（与 drain 列示序同源）；`msg` = 单行归一 + 截断 `ASK_LABEL_MSG_MAX`；
 *  载体经 `carrierField` 吸收（同 `upstreamWaiting`）。 */
export function upstreamAskLabelVars(carrier) {
  const q = carrierField(carrier, "_childUpstream")
  const e = Array.isArray(q) ? q.find((x) => x.kind === "ask") : null
  if (!e) return null
  const one = String(e.message ?? "").replace(/\s+/g, " ").trim()
  return { from: String(e.from ?? "?"), msg: one.length > ASK_LABEL_MSG_MAX ? one.slice(0, ASK_LABEL_MSG_MAX - 1) + "…" : (one || "…") }
}
```

**b. `thincoder-core/i18n.mjs`（106 行 → ~105 行）**——键面三笔：
  - **改值** `digest.turnLabelAsk` → 携参形态（en `[auto-turn: answering ${from}: ${msg}]` / zh `自动回合：答复 ${from}：${msg}`）；
  - **删除** `digest.turnLabelAuto`（AUTO 泛句退场——D-SL1）；
  - **零新增键**（`digest.turnLabel` / `digest.start` 复用——CLI 新增消费点）。
  golden 面（`thincoder-core/test/i18n.test.mjs:32-46`）锁 `digest.done` / `digest.start`——两键本批零改。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）

**c. `thincoder-cli/src/tui/suspension-drive.mjs`（323 行 → ~333 行）**——= §6.27.12.5 D 现态块；import 面 `:27` +1 名（`upstreamAskLabelVars`——零新静态边）；**X9 收尾行（`:191`）加 `pend0 > 0` 守卫**（ask-only 轮零收尾行——done / aborted 两形态同判，口径与理由见 ③ / ⑩）。

**d. `thincoder-vscode/src/extension/suspension.mjs`（430 行 → ~432 行）**——`:320-321` 判据 + 载荷（`:275` 动态 import 解构 +1 名）：

```js
// 改前（:320-321）
        const tier = panel._autoApprove === true ? "auto" : (upstream ? "ask" : "digest")
        panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN, tier })
// 改后
        const tier = upstream ? "ask" : "digest"
        const ask = upstream ? upstreamAskLabelVars(history) : null
        panel._panel?.webview.postMessage({ type: "digest", status: "start", n: pendingN, tier, ...(ask ?? {}) })
```

**e. `thincoder-vscode/webview/chat.js`（445 行 → ~448 行）**——`:389-404` 分档取键 + 计数元素规则：

```js
    label.textContent = t(m.tier === "ask" ? "digest.turnLabelAsk" : "digest.turnLabel",
      m.tier === "ask" ? { from: m.from ?? "?", msg: m.msg ?? "…" } : {})
    …
    if ((m.n ?? 0) > 0) { /* 本轮独立计数元素——两档同规（D-SL2）；n = 0 ⇒ 零元素 + end 零动作（零改） */ }
```

**f. 档面同步**：`docs/vsc/design/WEBVIEW-PROTOCOL.md` §3（载荷行）· §3.2 行 11 收正 + **新增行 14**（`from` / `msg`——ask 携参）· §5（元素级契约）· §13 `digest` 行（坐标随实现位移 ⇒ 按档内既有程序重出）· §6.3 键表；`docs/vsc/design/WEBVIEW.md` §5.1 · §6 D-W35 · §8 U-W19。

**⑥ 受影响文件表（行数口径 = `find /c /v ""`；现量 = as-of 2026-09-21 01:5x 实测）**

| # | 文件 | 现量 | Δ（估） | 变更类型 | 说明 |
|---|---|---|---|---|---|
| 1 | `thincoder-core/agent-tools/parent-channel.mjs` | 231 | +19 | 新导出 | `upstreamAskLabelVars`（显示面单点）+ `ASK_LABEL_MSG_MAX`（内部常量） |
| 2 | `thincoder-core/i18n.mjs` | 106 | −1 | 键面 | `digest.turnLabelAsk` 改值携参；`digest.turnLabelAuto` 删 |
| 3 | `thincoder-cli/src/tui/suspension-drive.mjs` | 323 | +10 | 提示行 | 起跑数前置 + 两档标签 + 起跑行 + X9 收尾行 guard（`pend0 > 0`——`:168-192`）；import +1 名 |
| 4 | `thincoder-cli/test/digest-end-line.test.mjs` | 97 | +40 | 用例 | 起跑行三态（digest / ask `n=0` / ask `n>0`）+ 矩阵字面 + T-SL-C3（ask-only 零收尾行 · 两态对照） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 5 | `thincoder-cli/test/input-lock.test.mjs` | 368 | ±6 | 用例（改行） | `:252` / `:265-290` 四格矩阵收正（AUTO 两格字面改判） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 6 | `thincoder-core/test/parent-channel.test.mjs` | 291 | ±2 | 用例（改行） | A4 导出面名单 +1 名（`:272`） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 7 | `thincoder-core/test/parent-channel-upstream.test.mjs` | 95 | +30 | 用例 | T-SL1–T-SL4（携参选择 / 归一截断 / 载体吸收 / 多 ask 队首） （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| 8 | `thincoder-vscode/src/extension/suspension.mjs` | 430 | +2 | tier + 载荷 | `:320-321` 两档 + 携参；`:275` 解构 +1 名 |
| 9 | `thincoder-vscode/webview/chat.js` | 445 | +4 | webview | 标签携参 + 计数元素 `n > 0`（`:389-404`）；`auto` 分支退场 |
| 10 | `thincoder-vscode/test/digest-visibility.test.mjs` | 250 | ±22 | 用例 | T-SL-V1 / T-SL-V2（T-D9 / T-D10 就地收正） （机检豁免——用例退场登记） |
| 11 | `docs/core/design/AGENT-LOOP-SUBAGENT.md` | 1975 | +95 | 设计档 | §6.27.12.5 D 改写 + §6.27.12.13 新增 + §6.27.12.12 ④/⑥ 收正 + 变更记录 |
| 12 | `docs/vsc/design/WEBVIEW-PROTOCOL.md` | 539 | +12 | 设计档 | §3 / §3.2（行 11 + 新增行 14）/ §5 / §6.3 / §13 / 变更记录 |
| 13 | `docs/vsc/design/WEBVIEW.md` | 615 | +8 | 设计档 | §5.1 / §6 D-W35 / §8 U-W19 / 变更记录 |
| 14 | `docs/cli/design/TUI.md` | 630 → **635**（本设计微修二轮实读） | 0（实现轮零改） | 设计档 | §6.9 就地同步（起跑标签两档 · 起跑数行 · 收尾行 `pend0 > 0` 守卫）+ 变更记录一行——本微修二轮已落 |

**越线核查（评审 #44 发现 3 处置——逐档档位口径；对照先例 = §6.27.12.7 ①–③）**：行 3 / 5 / 8 / 9 四档越 300 软线（均 ≤500 硬限；CLI 侧 = advisory 线、无同族机检门——§6.27.12.7 ②）：

- **行 3 `thincoder-cli/src/tui/suspension-drive.mjs`（323 → ~333）**：**既有在册**——§6.20.4 拆分计划（`finally` 收尾块 → `suspension-teardown.mjs` 候选）；本批 +10 = 就地改行（零新增段）⇒ **结构未变 · 本批不拆**。
- **行 5 `thincoder-cli/test/input-lock.test.mjs`（368）**：**既有在册**——§6.27.12.7 ② 越线核查 + 触发式拆分计划；本批 ±6 = 就地改行（四格矩阵收正）⇒ **结构未变 · 本批不拆**。（已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文）
- **行 8 `thincoder-vscode/src/extension/suspension.mjs`（430 → ~432）**：读数登记面 = `docs/vsc/design/VSC-DEBT.md` §12.1（登记归父侧派单——§6.27.12.7 尾注先例）；本批 +2 = 就地改行 ⇒ **结构未变 · 本批不拆**。
- **行 9 `thincoder-vscode/webview/chat.js`（445 → ~448）**：≤500 硬限、>300 咨询线；`VSC-DEBT.md` §12.1 本刻未列该档（该节逐项登记、非全量普查）⇒ 补登归父侧派单；本批 +4 = 就地改行 ⇒ **结构未变 · 本批不拆**。

**读数口径（评审 #44 发现 4 处置；先例 = §6.27.12.7 尾注④）**：行 11–14（设计档四档）= **as-of 读数 · 不追值**——「现量」= 落笔前读数、「Δ」= 落笔估值；
实测终态另见批档 §2.3 / §2.7（本档 2127 · `docs/vsc/design/WEBVIEW-PROTOCOL.md` 545 · `docs/vsc/design/WEBVIEW.md` 621 · `docs/cli/design/TUI.md` 635）⇒ **统一归实现轮复核**。

**⑦ 用例表（正常 / 边界 / 错误）**

| # | 用例 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| T-SL1 | 正常·携参取队首 ask（`thincoder-core/test/parent-channel-upstream.test.mjs`） | `_childUpstream = [{kind:"note",…},{kind:"ask", from:"coder#7", message:"选 A 还是 B？"}]` | `upstreamAskLabelVars(载体)` = `{ from:"coder#7", msg:"选 A 还是 B？" }` | F-UC8 条 2 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T-SL2 | 边界·无 ask / 非数组 / 载体别名路 | ① `[]` ② `[{kind:"note"}]` ③ 字段缺省 ④ 父字段缺 + `history._childUpstream` 在场 | ①②③ ⇒ `null`（不抛）；④ ⇒ 命中同一容器（carrier 吸收） | 条 2 / 零回归 |
| T-SL3 | 边界·单行归一 + 截断 | `message` = 折行 + 连续空白 + 200 字符 | 单空格单行；长度 ≤ 120；尾 `…` | 条 2 |
| T-SL4 | 边界·多 ask 队首 | 两条 ask（不同 `from`） | 取插入序首个（`from` = 首条） | 条 2 |
| T-SL-C1 | 正常·CLI 四格矩阵（`thincoder-cli/test/digest-end-line.test.mjs`） | 四 rig：manual / AUTO × ask / digest | 标签 = 对应核容器值（ask 档携 `from` + `msg`）；**AUTO 两格与 manual 逐字同** | 条 1 / 2 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T-SL-C2 | 正常·CLI 起跑行 | `_pendingAsyncResults` 2 条；① 无 ask ② ask + `pend0 = 0` | ① 标签（digest）→ 起跑行 `digest.start n=2`；② 零起跑行（`n > 0` 规则） | 条 3 |
| T-SL-C3 | 正常 + 边界·CLI ask-only 轮零收尾行（`thincoder-cli/test/digest-end-line.test.mjs`） | ① ask-only 轮（`upstream` + 零 pending ⇒ `pend0 = 0`）② 同形 + 首轮停（aborted 形态）③ 对照：`entries = 2`（`pend0 > 0`） | ①② **零收尾行**（`digest.done` / `digest.aborted` 皆不出——`pend0 > 0` 守卫）；③ 收尾行在场（零回归） | 条 3 / 零回归 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T-SL-V1 | 正常·VSC tier 两档 + 携参（`thincoder-vscode/test/digest-visibility.test.mjs`） | ① pending ② ask + `from` / `msg` ③ AUTO + pending | ①/③ `tier:"digest"`（AUTO 同判）② `tier:"ask"` + 两字段——逐字段 deepEqual | 条 1 / 4 （已随 2026-09-28 测试树全清退场——档不在盘）（迁移期引文） |
| T-SL-V2 | 正常 + 边界·webview 标签与计数元素 | ① `tier:"ask", n:0` ② `tier:"ask", n:2` ③ `tier` 缺省 | ① 携参标签行 + 零计数元素 + end 零动作 ② 计数元素在场 + end 原地更新 ③ `digest.turnLabel` 零回归 | 条 4 |

**⑧ 验收标准（逐条回指——可机检 · Windows / cmd.exe；cwd = `D:\teamcode\thincoder`）**

| # | 判据 | 回指 |
|---|---|---|
| U-SL1 | `cd thincoder-core && npm test` 全绿（含 T-SL1–T-SL4 + A4 导出面 +1 名） | 条 1 / 2 |
| U-SL2 | `cd thincoder-cli && npm test` 全绿（含 T-SL-C1 / C2 / C3 + `input-lock` 四格收正） | 条 1 / 2 / 3 |
| U-SL3 | `cd thincoder-vscode && npm test` 全绿（含 T-SL-V1 / V2 + 协议档坐标面重出） | 条 4 |
| U-SL4 | 结构机检（ASCII 令牌，单行 `node -e`；四查 + 两否定）：核容器含 `"digest.turnLabelAsk"` ∧ `${from}` ∧ **不含** `digest.turnLabelAuto`；`suspension-drive.mjs` 含 `t("digest.turnLabel` ∧ `digest.start` ∧ **不含** `[auto-turn:`；`suspension.mjs` 含 `upstreamAskLabelVars(`；`chat.js` 不含 `digest.turnLabelAuto` | 条 1 / 4 |
| U-SL5 | 文档一致：`node scripts/doc-check.mjs --root .` **本批触碰档零新增**条目（悬空 0 ∧ 行宽读数不因本批上升）；引擎退出码 = 0 需存量超宽行（需求档 `docs/core/requirements/AGENT-LOOP.md:236` / `:278`——父侧写域；`docs/core/requirements/SESSION.md:45`——他流写域）各自折行后成立；§6.27.12.13 ↔ 批档 §2 ↔ 需求 §4.12 F-UC8 三方同源 | 批档自身约束 |

**⑨ 边界（本批不做）**

1. 唤醒 / 开轮 / 域文本机制零改（`upstreamWaiting` 谓词 · `_asyncWaiters` · `upstreamTurn` 旗标 · 域文本常量）。
2. X9 收尾行 **guard 一处**（`pend0 > 0`——ask-only 轮零收尾行，done / aborted 两形态同判）；其余轮尾机制零改（字面 / 计数口径 / 轮序 / `digest:*` 日志面）。
3. `UPSTREAM_*` 三常量语义与数值 · 队列结构 · drain 注入文案与注脚零改。
4. 提示词面 / `notify_parent` 工具描述与返回注零改（内容权 = 父侧）。
5. 不做列宽口径截断（核无宽度叶——`sliceByWidth` 住 `thincoder-cli/src/tui/render.mjs:46`；引核 = 新结构面）。CLI 手边同档宽度叶不用于显示点截断之由 = **跨端单源（D2）**——截断口径须与 VSC 同源（VSC 侧无终端宽度概念）⇒ 只取字符口径（②）；代价 = CLI 窄终端下含宽字符的标签可折行——**已知形态**，不为此再分叉口径。
6. 不新增 i18n 键（改值 1 + 删 1 + 复用 2）；`thincoder-vscode/locales/{en,zh}.json` 零改（核投影面）。
7. 不做 AUTO 档模式字面（模式可见性 = CLI `AUTO│` 横幅 / VSC `autoApprove` 广播）。

**⑩ 登记**

- **ask-only 轮的 CLI 收尾行**：**已裁纳入本批**（父侧 2026-09-21 02:0x）——落点 = ③ 尾条（guard 口径与理由）+ ⑤c + ⑨-2 + 用例 T-SL-C3（⑦）。依据 = 与起跑行同规则（`n > 0`）才有一致形态；`pend0 = 0` 轮出收尾行 = 幻影行（同 ① 计数行的幻影行禁出原则）；两端形态对齐（VSC ask 轮无计数元素 ⇒ end 零动作——`thincoder-vscode/webview/chat.js:425-426`，该守卫先于 `ok` 判 ⇒ done / aborted 两形态皆零）。
- **`digest.turnLabel` 措辞**：pending 单容器含 consult / escalate / advisor 族，标签字面只说 "subagent reports"（既有多族措辞面）；本批只钉两因分流，措辞面不动。

## 6.32 零落笔看门狗（阈值自动上行提醒）（2026-10-05 · 批 subagent-zero-write-watchdog · 台账 #934）

**定位**：给「子代理族 ∥ 评审族」的原地打转补一条**自动上行提醒**——连续 50 轮没有落笔 / 产出 ⇒ 自动向父（主代理）推一条 `note`（复用 §6.27 上行通道的推送 / 消费单点）。父不必再靠主动轮询 `subagent status` 才发现停滞（动因实例 = #42 一段 63 零写轮）。
**本机制只推提醒：不自动杀 / 不自动转向 / 不代父侧动作**——防卡死仍靠父 / 用户处置（沿 `docs/core/design/TURN-CAP-CONTINUE.md` §1 行 6「防卡死靠用户 Stop」）。

### 6.32.1 问题陈述与现状坐标（as-of 2026-10-05 实读）

**病**：子代理 / 评审在「原地读」长跑（连续几十轮零文件写）时**没有任何在飞信号**——父侧须主动巡检才发现。实证链：#42 一段 63 零写轮；同族前史 = 2026-09-25 mimo 子代理 60+/180 回合零落盘被外戳才上抛；2026-09-26 同面三度空转（#54 / #60 / #59——靠人巡检止损）。

**现状坐标（逐处实读）**：

| # | 面 | 坐标 | 实况 |
|---|---|---|---|
| S1 | 零落盘计数（子代理族） | `thincoder-core/agent/turn-loop.mjs:73`（轮顶结上一轮）+ `:248`（撞帽收尾轮）· `thincoder-core/agent/run-start.mjs:106`（段起点复位） | 有计数、有显示（`subagent status` 第三元——`thincoder-core/agent-tools/checkpoint.mjs:30`）——**只报数：零阈值 ∕ 零自动动作**（#417） |
| S2 | 推送面 | `thincoder-core/agent-tools/parent-channel.mjs`（`pushChildUpstream` / `drainChildUpstream` / `UPSTREAM_*`）· 装配 = `thincoder-core/agent/family-tools.mjs:165-175`（depth>0 段 4 处携带） | 通道齐备；**现唯一自动源 = 撞帽检查点**（`thincoder-core/agent-tools/checkpoint.mjs:81-87`——ask 类；时点 = 撞帽，晚于 50 轮） |
| S3 | 上游接线（`_upstream` 赋值点） | `thincoder-core/agent-tools/subagent-spawn.mjs:431`（子代理族——label = `role#id`）· `thincoder-core/agent-tools/escalate-async.mjs:208`（飞刀）· `thincoder-core/agent-tools/consult.mjs:297`（会诊） | 子代理族恒在；**评审族不在其中**（评审走独立环路——无 `_upstream`） |
| S4 | 评审环路 | `thincoder-core/advisor/loop.mjs`（`turns` `:120` · `reviewTextProduced` `:91` / `:158`）· 硬帽 `MAX_ADVISOR_TURNS = 100`（`thincoder-core/advisor/compaction.mjs:16`）· 墙钟 10 分钟（同档 `:36`） | 只读（零文件写——`:26`）；**无零产出阈值**——只有 100 轮硬帽尾（`:121`）与超时尾 |
| S5 | 评审池装配 | `thincoder-core/agent-tools/advisor-async.mjs:417-450`（`entry.start`——`advisor#<id>` 标签 + 运行面 = 父 agent 对象）· `thincoder-core/advisor/run.mjs:143`（环路调用点） | 异步评审条目携 id——提醒三要素（角色 / id / 轮数）全具 |

**面清单**：触面 = **eng-coder ∥ eng-designer**（子代理族——有文件写面）**∥ advisor**（评审族——只读，判据改锚、见 §6.32.2 ②）。
**不设**：explore / plan（恒只读——字面阈恒真，装即噪声）· consult（一次性会诊角色语义）· 普通 coder（用户点名三角色之外）· depth-0（无父）。

### 6.32.2 触发判据与阈值（两族）

**① 子代理族（eng-coder / eng-designer）——「连续零写回合」**

- **「落笔」口径** = `_touchedFiles` 无增（`FILE_MUTATORS` 六工具：`write` / `edit` / `insert_after` / `apply_patch` / `delete` / `hashline_edit`——`thincoder-core/agent/helpers.mjs:86`）——**与 #417 计数同源面**。
  ▸ 边界如实登记：`batch` 追加（§2 段写）与 `file_ops`（移动 / 复制 / 改名）**不计入**——前者核内记账缺省 no-op（#84 缝）、后者在 `FILE_MUTATORS` 之外（「只经 batch 写 §2 的长跑不计为落笔」= 已知窄面，现实撞面再议）。
- **新增字段 `_zeroWriteStreak`**（连续零写回合数）：采集点邻（`thincoder-core/agent/turn-loop.mjs:73` 邻——**单点**）更新——上一轮零写 ⇒ +1；上一轮有写 ⇒ 归零。
  **旧字段 `_zeroWriteTurns`（#417）口径零改**（仍为「本段零落盘轮数」= 段内累计、写后不清零——显示面逐字不变）。
- **复位条件 = 链起点且无继承 guard**（`!resume` 块——钉单一锚 = `_touchedFiles = []`（`thincoder-core/agent/run-start.mjs:123`）同点；与块顶 `_turnSeq = 0`（`:111`）的分支差别 = `:123` 在 `_inheritedGuard` else 支内（有继承 guard 时不执行）、`:111` 恒执行——触面（eng 子代理恒无继承 guard）两锚同效）——段起点 / 续跑新段**不回退**（「连续」跨段存活——段边界不打断语义）。
- **阈值** = `ZERO_WRITE_ALERT_ROUNDS = 50`（**连续**口径——「50 轮没有落笔」= 最近 50 个回合无一落笔）。越阈（`_zeroWriteStreak ≥ 50`）⇒ 推一条 note。
- **单点采集**：判定恒在回合环轮顶（`turn > 0` 结上一轮）；**撞帽收尾轮不另判**——链尾窗口价值低，且撞帽 ask 载荷自带 `_zeroWriteTurns` 计数（终局信息不丢）。
- 未跟踪执行面（缺 `_zeroWriteStreak` 字段）⇒ **不判**（零动作——沿 `thincoder-core/agent-tools/checkpoint.mjs:30`「缺字段不渲染」同精神；不冒充 0）。**as-built 注（NaN 卫生 · 父侧 2026-10-05 裁 = 接受）**：未初始化面——缺字段自增产出 NaN，由门「整数判」（§6.32.6）拦下 ⇒ 零动作（与「不判」同效）；无显示面；可选加固（初始化缺省）留档。「轮」= 回合（turn——与 #417 口径同）。

**② 评审族（advisor——异步评审）——「连续无产出轮」**

- **判据改锚句（父侧 2026-10-05 12:2x 裁定 A——承用户原话三面全点名）**：advisor 恒只读（`thincoder-core/advisor/loop.mjs:26`——「read-only ONLY … never writes」；工具集无 `FILE_MUTATORS`）⇒ 字面「零落笔」在只读角色上**恒真、无判定力**——「落笔」的对应物 = **评审文本产出**；「没有落笔」之于只读角色 = **「没有产出」**。
- **判据** = **连续 50 轮无评审文本产出**：新增循环局部 `silentRounds`——上一轮有文本 token（`reviewTextProduced` 置位同源信号）⇒ 归零；否则轮顶 +1；`silentRounds ≥ 50` ∧ 未通报 ⇒ 恰一次通报。
- **父侧裁定注 + 用户可一句话改判留痕**：口径（判定物 / 阈值 / 是否含推理 token）属可调参数——用户一句话改判 ⇒ 本段收正即可，机制结构不变。
- **面 = 异步评审**（池条目——父不阻塞、有处置窗；S5）：`entry.start` 闭包携 `advisor#<id>` 与父对象。
  **同步评审不设**（`depth>0` 内嵌自评 / 显式 `async:false`）：调用方阻塞在评审上——提醒无处置窗；其收敛面已有 100 轮硬帽 + 10 分钟墙钟双保险。
- **次 / 运行**：`silentRounds` 与通报闩均属**单次评审运行**（修复轮 = 新运行 ⇒ 重新计数）。

### 6.32.3 防轰炸（每跨阈恰一条 · 写后重臂）

- **子代理族**：闩 `_zeroWriteAlerted`——越阈推报时置位；**下一次落笔（streak 归零）时清位**（此后再度连零 50 ⇒ 再报一条——「每条连续零写段恰一条」）；链起点（`!resume`）随 streak 复位一并清位。
- **评审族**：闩 `stallAlerted`——单次运行至多一条（文本产出后不再触发——「连续无产出」条件不回头）。
- **否决备选与判据**：a）每段臂上限（1 条 / 段）——与跨段 streak 互相打架（段界会吞已累计的连续数）；b）冷却计时——无计时器面（引 timer 机制 = 新结构面），且冷却期内的真停滞漏报；c）每满 50 轮循环重报——轮风暴（父侧队列可积压）。
  判据 = 闩 + 写后重臂在「写 = 恢复推进」语义上自洽——报一次、恢复即重臂，零计时零窗口。

### 6.32.4 提醒文案（单行 · 英文 · 携角色 / id / 轮数——**父侧定稿 2026-10-05**：逐字如下）

- 子代理族（`from` = `_upstream.label`，形 `role#id`）：

  `[zero-write watchdog] ${from}: ${rounds} consecutive rounds with no file write — take a look (subagent action:'status' for the live view).`

- 评审族（`from` = `advisor#<entry id>`）：

  `[zero-write watchdog] ${from}: ${rounds} consecutive rounds with no review output — take a look (subagent action:'status' / 'cancel').`

- **语言 = 英文**（沿 2026-09-26 检查点批裁定——上行载荷一律英文）；**文案单源** = 新叶档 `thincoder-core/agent-tools/zero-write-watch.mjs`（已落——§6.32.6）的两族文本函数（逐字可断言）。**父侧定稿 2026-10-05**（逐字改判 = 一句话）。

### 6.32.5 送达面（复用上行通道 · note 类 · 零唤醒）

- **复用 `pushChildUpstream({parent, from, kind:"note", message})`**——与 `notify_parent` **同队列、同消费点**（`drainChildUpstream`——父侧下一回合边界合并注入）；**零新容器、零新通道、零新闸**。
- **不唤醒（note 语义零改）**：提醒在父侧**下一回合边界**被合并消费——父在跑 ⇒ 随其下一回合；父挂起 ⇒ 随下次自然苏醒（settle digest / 撞帽 ask / 用户输入 / timer）。
- **选型依据（同通道 + note + 不唤醒——三否决记录）**：
  ① 语义面——提醒无需答复、不改变父下一步「回答」义务 ⇒ 按通道自身定义（「ask = 答案会改变你下一步」）就是 **note**；
  ② 机制面——ask 类会占子代理「未 drain ask ≤1」窗口（`UPSTREAM_ASK_MAX_INFLIGHT`）⇒ 可能把子代理**自己的决策级 ask 挤掉**（真实损害）；
  ③ 成本面——ask 会唤醒父侧开一轮 LLM（轮风暴）。
  **否决独立通道**（零新容器原则——推送 / 消费 / 闸 / 显示全在既有面）。
- **闸面**：内部直推——沿 `registerTurnCapCheckpoint`（`thincoder-core/agent-tools/checkpoint.mjs:81`）先例**不经工具闸**（工具面 `UPSTREAM_QUEUE_MAX` 校验不动；直推不查队列长度——登记）；`from` 取 S3 既有面（子代理族 = `_upstream.label`；评审族 = `advisor#<id>`）。
- **失败面**：无 `_upstream.parent`（未接线站点 / headless 内嵌）⇒ **静默跳过**（自动源无模型可报错——F7 仅约束工具调用面）。会话终止 ⇒ 随会话丢弃（F2 同）。父挂起 ⇒ 留队列待下次边界（F1 同）。
- **日志面**：推送经 `pushChildUpstream` 自带 `child:upstream` 事件（`{id, kind:"note", seq}`——零新增字段 / 零新增事件）。

### 6.32.6 接口契约（实现面 · 改前 → 改后）

**新档 `thincoder-core/agent-tools/zero-write-watch.mjs`（已落——零依赖叶：静态 import 只取 `parent-channel.mjs` 的 `pushChildUpstream`；不引池 / 端面 / 循环）**：

```js
export const ZERO_WRITE_ALERT_ROUNDS = 50          // 阈值单源（两族共用）
export function zeroWriteAlertText(from, rounds)   // 子代理族文案（§6.32.4 逐字——`from` = `_upstream.label`）
export function advisorAlertText(from, rounds)     // 评审族文案（§6.32.4 逐字——`from` = `advisor#<entry id>`）
export function maybeZeroWriteAlert(child)         // 子代理族判定 + 推送；恒零抛；返回布尔（测试面）
// 门 = child._role ∈ {eng-coder, eng-designer} ∧ child._upstream?.parent 在场
//      ∧ (_zeroWriteStreak 为整数) ≥ 50 ∧ !child._zeroWriteAlerted
// 命中 ⇒ pushChildUpstream({ parent, from: child._upstream.label, kind: "note",
//          message: zeroWriteAlertText(child._upstream.label, child._zeroWriteStreak) }) + _zeroWriteAlerted = true
export function pushAdvisorAlert(parent, from, rounds)   // 评审族推送（组合文案 + push）——呼点 = 评审环路钩子；恒零抛（实现面兜底捕获兑现——抛错不得上抛为评审 failed 面）
```

**触发接线①（子代理族——回合环 · 采集点邻单点）**：

```js
// 改前（thincoder-core/agent/turn-loop.mjs:73-74）
if (turn > 0 && agent._touchedFiles.length === agent._turnFilesMark) agent._zeroWriteTurns += 1
agent._turnFilesMark = agent._touchedFiles.length

// 改后（#417 计数语义逐字保持；streak 与越阈判定同点）
if (turn > 0) {
  if (agent._touchedFiles.length === agent._turnFilesMark) {
    agent._zeroWriteTurns += 1
    agent._zeroWriteStreak += 1
    maybeZeroWriteAlert(agent)        // #934：连续零写越阈 ⇒ 自动上行提醒（只推——§6.32）
  } else {
    agent._zeroWriteStreak = 0
    agent._zeroWriteAlerted = false   // 写后重臂
  }
}
agent._turnFilesMark = agent._touchedFiles.length
```

- import 面：随既有动态 import 块（`thincoder-core/agent/turn-loop.mjs:53`——`drainChildUpstream` 同源）扩一名 `maybeZeroWriteAlert`（叶档 `../agent-tools/zero-write-watch.mjs`——零新增静态边）。

**触发接线②（评审族——环路钩子）**：

```js
// thincoder-core/advisor/loop.mjs —— 循环局部：let silentRounds = 0; let stallAlerted = false
// onToken 内（:158 既有 reviewTextProduced 置位处）：文本 token ⇒ silentRounds = 0
// 轮顶（:120 turns++ 之后——结上一轮）：上一轮无文本 ⇒ silentRounds += 1
if (!stallAlerted && silentRounds >= ZERO_WRITE_ALERT_ROUNDS) {
  stallAlerted = true
  seams.onStallRound?.(silentRounds)   // 可选钩子——缺省 ⇒ 零行为；恒零抛（契约见 pushAdvisorAlert——实现面兜底捕获）
}
```

- 钩子链：`thincoder-core/agent-tools/advisor-async.mjs` 的 `entry.start` 供 `callbacks.onStall`（= `(rounds) => pushAdvisorAlert(parent, "advisor#" + id, rounds)`——entry 闭包携 id）；`thincoder-core/advisor/run.mjs` 调用环路时以 `seams = { onStallRound: callbacks?.onStall }` 转发；**同步径（advisor 工具）不供钩子 ⇒ 零行为**。
- **as-built 残余登记（评审族钩子链 · 父侧 2026-10-05 裁 = 接受登记，不补腿）**：真入口两行转发（`thincoder-core/agent-tools/advisor-async.mjs:431` ∥ `thincoder-core/advisor/run.mjs:146`）无已执行证据——批件按设计以钩子注入定形（静态核对：供点 / 转发点 / 环路取值链；叶档 ∥ 环路单元面已覆盖）；**真入口腿留作可选加固**。
- 计数细节（逐轮增量序 / 首轮口径）实现轮定形；契约 = 「连续 50 轮无文本 token ⇒ 恰一次通报」+「缺钩子零行为」。

**载体重置（`thincoder-core/agent/run-start.mjs`）**：`!resume` 块内——`_touchedFiles = []`（`:123`）邻（复位锚与分支差别注见 §6.32.2 ①）——加两行：`_zeroWriteStreak = 0` · `_zeroWriteAlerted = false`。

### 6.32.7 受影响文件清单（R24a · 行数口径 = 换行符计数；现量 = 设计轮实读 · 终值 = 实施后实读——as-of 2026-10-05）

| # | 文件 | 现量 → 终值 | Δ（实测） | 说明 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/turn-loop.mjs` | 253 → **267** | +14 | 采集点邻扩展（streak 更新 + 越阈判定）+ 动态 import 扩一名 |
| 2 | `thincoder-core/agent/run-start.mjs` | 152 → **157** | +5 | `!resume` 块：streak / 闩复位 |
| 3 | `thincoder-core/agent-tools/zero-write-watch.mjs` | 新 → **77** | 新增 | 阈值 / 文案 / 两族推送单源 |
| 4 | `thincoder-core/advisor/loop.mjs` | 288 → **310** | +22 | 循环局部计数 + 越阈通报钩子（缺省零行为）；**>300 咨询线（310）**——增量以注释为主 ⇒ 非结构性触碰；**本批不拆**；拆分预案随该档下次结构性触碰登记 |
| 5 | `thincoder-core/advisor/run.mjs` | 200 → **204** | +4 | 钩子转发（seams） |
| 6 | `thincoder-core/agent-tools/advisor-async.mjs` | 494 → **497** | +3 | `entry.start` 供钩——**≤500 硬限 ✓（终值 497 · 余量 3——守限兑现）**。在册 = `docs/core/design/CORE-UNIFICATION.md` §2.8.1 行 8（`advisor-runs.mjs` 外提方案；消解条件 = 下次实质改动时）；**触评**：本批 = `entry.start` 内加一回调键的行级改动 · 零新函数 ∥ 零导出面变 ⇒ 不构成「下次实质改动」触发、计划续挂 |
| 7 | `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs` | 新 → **319** | 新增 | 用例宿主（U-ZW1–U-ZW8 + A-ZW4 送达/静态腿 = 9 用例——名随批档 · 复跑 = `node --test` 直跑）；**>300 口径核** = 批内件（随批档留存 · 不进仓套件——记录接受，不拆；先例 = `docs/batches/2026-10-04-core-patch-batch.test.mjs` 342 行同判） |
| 8 | `docs/core/design/AGENT-LOOP-UPSTREAM.md` | 1022 | +~200（落笔实测——1224 ⇒ 收笔轮 **1227**） | §6.32（本节）+ 承载节 / 需求层指针行 + 变更记录 |
| 9 | `docs/core/requirements/AGENT-LOOP.md` | 347 | +22（落笔实测——369） | §4.16（五要素）+ 变更记录 |
| 10 | 批档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.md` | — | §2 | 一次性批次材料 |

> 注：`thincoder-core/agent/turn-loop.mjs` 系消化账务批近期落痕面（`:198-200` 在盘——as-of 收笔轮实读，行号随动）。

### 6.32.8 用例表（正常 / 边界 / 错误）

| # | 类型 | 输入 | 期望输出 | 回指 |
|---|---|---|---|---|
| U-ZW1 | 正常·越阈推送 | 假 child：role `eng-coder` · streak 50 · 闩假 · `_upstream = {parent, label}` | `maybeZeroWriteAlert` ⇒ true ∧ 队列恰 +1（`{from: label, kind:"note", message: zeroWriteAlertText(50)}`）∧ 闩置位 | F-ZW1 / F-ZW4 |
| U-ZW2 | 边界·阈下 / 已闩 | ① streak 49；② streak 50 且闩真 | 均 ⇒ false ∧ 队列零增 | F-ZW3 |
| U-ZW3 | 边界·写后重臂 | 越阈报毕 ⇒ 落笔（streak 归零 + 闩清）⇒ 再连零 50 | 第二条 note（恰 +1） | F-ZW3 |
| U-ZW4 | 边界·角色门 / 无上游 | ① role `coder`；② role `explore`；③ 无 `_upstream.parent` | 均 ⇒ false ∧ 零动作（静默、零抛） | F-ZW6 |
| U-ZW5 | 集成·回合环 50+ 轮 | 直驱 `runTurnLoop` 零写夹具（形参照在盘批件 `docs/batches/2026-10-04-core-patch-batch.test.mjs`） | 第 50 零写轮起恰 1 条；51 轮起不重发；`_zeroWriteTurns` 读数改前逐字同 | F-ZW1 / F-ZW3 |
| U-ZW6 | 集成·跨段存活 | streak 49 ⇒ resume 新段（`_zeroWriteTurns` 复位、streak 存活）再 1 零写轮 | 新段内越阈推报（段界不吞计数） | F-ZW1 |
| U-ZW7 | 正常·评审越阈 | 假评审环路（钩子注入）：连 49 轮无文本 ⇒ 第 50 轮 | `onStallRound` 恰一次（携 50）；文本后归零不再触发 | F-ZW2 |
| U-ZW8 | 边界·评审无钩子 | 同步径调用（不供 seams） | 零行为（零推、零抛） | F-ZW2 |

### 6.32.9 验收标准（逐条回指——可机检 · cmd.exe；cwd = `D:\teamcode\thincoder`）

| # | 判据 | 回指 |
|---|---|---|
| A-ZW1 | 触发判据双族在盘：子代理族 = 连续 `_zeroWriteStreak ≥ 50`（采集点邻单点）；评审族 = 连续 `silentRounds ≥ 50`（缺钩子零行为）——U-ZW5 / U-ZW7 绿 | F-ZW1 / F-ZW2 |
| A-ZW2 | 防轰炸：越阈恰一条 ∧ 写后重臂 ∧ 评审一次 / 运行——U-ZW2 / U-ZW3 / U-ZW7 绿 | F-ZW3 |
| A-ZW3 | 文案携 `from`（`role#id`）+ 轮数；两族文案逐字 = `zero-write-watch.mjs`（已落）单源——U-ZW1 逐字断言 | F-ZW4 |
| A-ZW4 | 送达 = 同队列 note：条目 `{from, kind:"note", message}`；**不唤醒**（静态机检：watch 档零引唤醒面）；`UPSTREAM_*` / drain 文案零改 | F-ZW5 |
| A-ZW5 | 零回归：`_zeroWriteTurns`（#417）读数与显示逐字不变；`notify_parent` 工具面零改；**现役可红面 = 本批批件用例（U-ZW1–U-ZW8）全绿**（U-ZW5 已含「`_zeroWriteTurns` 读数改前逐字同」断言）；`cd thincoder-core && npm test` 绿 = 形式过门（核清单自 2026-09-28 空置——`thincoder-core/test/run.mjs:42-45`：空清单 ⇒ 零用例 = 绿 · exit 0——非可红判据） | F-ZW6 |
| A-ZW6 | `node scripts/doc-check.mjs` 本批触碰档零新增悬空锚 / 零新增行宽违规 | 批档自身约束 |

### 6.32.10 边界（本批不做）

1. **只推提醒**：不自动杀（cancel） / 不自动转向（send 引导） / 不自动重派 / 不代父侧动作。
2. 不改 `notify_parent` 工具面（schema / `kind` 枚举 / 三闸 / 返回注）——自动源直调 `pushChildUpstream`（非新工具动作）。
3. 不改唤醒面（`upstreamWaiting` 谓词 / `wakeAsyncWaiters` / 域文本 / 挂起驱动）——note 不唤醒照旧（挂起期即时唤醒 = 另案——时效取舍与替代路径见 D-ZW9）。
4. 不改 `_zeroWriteTurns`（#417）口径与显示面（status / 面板 / webview 零改——可见面 = 既有 drain 注入）。
5. 阈值固定 50（用户口径）——不做配置键；文案定稿权 = 父侧。
6. 触面 = 用户点名三角色；explore / plan / consult / 普通 coder / depth-0 不设；同步评审不设（§6.32.2 ②）。
7. 撞帽收尾轮不另判（单点采集——§6.32.2 ①）；未跟踪执行面不判。
8. 提示词面零改（内容权 = 父侧）。

### 6.32.11 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决 |
|---|---|---|
| D-ZW1 | 子代理族判据 = **连续**零写（新增 `_zeroWriteStreak`），不复用 `_zeroWriteTurns` | 「50 轮没有落笔」直读 = 连续；累计计数在健康长任务上误报（写后不清零）；改其语义则 #417 显示契约破面。否决：累计口径 / 改写 `_zeroWriteTurns` |
| D-ZW2 | streak **跨段存活**（复位 = `!resume` 链起点——锚与分支差别见 §6.32.2 ①） | 段边界不打断「连续」语义；否决段内口径（45+45 型跨段停滞漏报） |
| D-ZW3 | 送达 = 同通道 / note / 不唤醒 | 语义 + ask 窗口 + 成本三面（§6.32.5）；否决 ask 类 / 独立通道 |
| D-ZW4 | 防轰炸 = 闩 + 写后重臂 | 零计时零窗口、语义自洽（写 = 恢复推进）；否决段臂 / 冷却 / 周期重报（§6.32.3） |
| D-ZW5 | 单源落点 = 本档 §6.32（上行通道族）+ 机制叶档 `thincoder-core/agent-tools/zero-write-watch.mjs`（已落） | 交付面全在 §6.27 面（队列 / 消费 / 闸 / 显示）；触发坐标以「产出站点」表跨档列示（§6.27.2 S 表先例）。否决落 `docs/core/design/AGENT-LOOP-SUBAGENT.md`（其范围句 = 工具契约与装配面——触发坐标跨族无自然承载位） |
| D-ZW6 | 评审族判据 = **文本产出否**（改锚）+ 连续 50 轮 + 异步面 + 钩子形 | 父侧 2026-10-05 12:2x 裁定 A（承用户原话三面全点名）；只读角色「没有落笔」=「没有产出」；用户可一句话改判。否决 B（轮数直报——正常产出中的大评审误报）/ C（不动——静默缩面） |
| D-ZW7 | 采集点 = 回合环轮顶单点（撞帽收尾轮不另判） | 单点最小面；撞帽 ask 载荷自带 `_zeroWriteTurns`——终局信息不丢 |
| D-ZW8 | 与「不设零产出阈值」裁定（`docs/core/design/TURN-CAP-CONTINUE.md` §1 行 6——2026-09-26）的关系 = **相容**：该裁定对象 = 续跑决策的自动动作；本机制不触续跑决策（只推一条提醒，处置归父 / 用户）。**字面收窄已落 = 对象限定＋交叉指针（同档 §1 行 6——本修正轮裁定①）** | 用户 2026-10-05 原话（后令）立提醒阈值；机制面零自动动作与裁定精神一致 |
| D-ZW9 | 送达时效 = **维持 note 不唤醒（有意选择——父侧 2026-10-05 定稿）** | 代价 = 越阈提醒常在子代理结束后才达父侧（默认流首个唤醒恒 = 子代理自身 settle——§6.27.12.1 实证）；替代路径登记 = §6.27.12.11-7 单行改法（`upstreamWaiting` 谓词一行——代价 = 每条 note 一次父侧轮）；用户 / 父侧一句话可改判 |

## 变更记录

- 2026-10-05（**批 subagent-zero-write-watchdog · 实施后终收笔（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.md` §5 实施终态 + 父侧裁定〔随条注〕）：① §6.32.6 简记收正——两族文案函数签名 `(rounds)` ⇒ **`(from, rounds)`**（与 §6.32.4 定稿模板自洽；实现以定稿为准，§5 已证字节相等）+ `maybeZeroWriteAlert` 内呼对齐（`zeroWriteAlertText(child._upstream.label, child._zeroWriteStreak)`）；② §6.32.7 行 1–7 as-built 回填（253→**267** ∥ 152→**157** ∥ 新 **77** ∥ 288→**310** ∥ 200→**204** ∥ 494→**497** ∥ 新 **319**）+ 表头读法注 + 行 8 自指读数随拍（1224 ⇒ **1227**）；③ >300 越线补行——`thincoder-core/advisor/loop.mjs`（310——增量以注释为主 ⇒ 非结构性触碰；本批不拆；拆分预案随下次结构性触碰登记）+ 批件测档 319（批内件口径——先例 342 行同判：记录接受）；④ 钩子链残余登记（`thincoder-core/agent-tools/advisor-async.mjs:431` ∥ `thincoder-core/advisor/run.mjs:146` 两行转发无已执行证据——静态核对 + 单元面覆盖；真入口腿留作可选加固）；⑤ NaN 卫生接受注（`_zeroWriteStreak` 未初始化面——门「整数判」拦下、无显示面）；⑥ 「拟新增」标记批收口核销（↔ 受影响文件表——叶档 / 批件测档已落）+ 表下注「在飞」字样与坐标收正（`:198-200`）。**零新语义**（收正 / 回填 / 登记面——产品码零触）。

- 2026-10-05（**批 subagent-zero-write-watchdog · 设计评审轮 1 修正（fix 轮）· eng-designer**——承批档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.md` §3 轮次 1 七项·定点落位〔本档面 = 发现 1/2/3/5/6/7 + 发现 4 联动的 D-ZW8 收正〕）：① A-ZW5 零回归改钉现役可红面（批件用例 U-ZW1–U-ZW8——U-ZW5 断言面）+ 核清单空置注（`thincoder-core/test/run.mjs:42-45` = 形式过门）；② §6.32.7 行 6 补在册引用（`docs/core/design/CORE-UNIFICATION.md` §2.8.1 行 8）与触评句；③ 新增 **D-ZW9**（送达时效 = 维持 note 不唤醒——有意选择 + 代价 + 替代路径）；④ 变更记录去重（2026-10-05 设计轮条 ×2 ⇒ ×1）；⑤ §6.32.2 ① 复位锚钉单（`:123` + 与 `:111` 分支差别注；§6.32.6 ∥ D-ZW2 同拍）；⑥ `pushAdvisorAlert` ∥ 环路钩子呼点补「恒零抛」契约句；⑦ D-ZW8 尾句结案收正（字面收窄已落）。**零新语义**。

- 2026-10-05（**批 subagent-zero-write-watchdog · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.md` §1（用户 12:11 原话 + 12:13 开批）· 需求 §4.16 · 台账 #934）：新增 **§6.32 零落笔看门狗（阈值自动上行提醒）**——双族触发判据（子代理族 = 连续 50 回合零文件写〔新字段 `_zeroWriteStreak`——`!resume` 复位、采集点邻单点、写后重臂〕；评审族 = 连续 50 轮零评审文本产出〔父侧 2026-10-05 12:2x 裁定 A——只读角色改锚「产出否」〕）· 防轰炸（闩 + 写后重臂）· 文案（英文单行——候父侧定稿）· 送达（复用 §6.27 队列 · note · 零唤醒）· 机制叶档 `thincoder-core/agent-tools/zero-write-watch.mjs`（拟新增）· 批件测档 `docs/batches/2026-10-05-subagent-zero-write-watchdog.test.mjs`（拟新增）· 用例 U-ZW1–U-ZW8 · 验收 A-ZW1–A-ZW6 · 边界八条。承载节行与需求层指针行随动。**机制语义 = 新增**（#417 计数 / 上行三闸 / `notify_parent` 工具面逐条零改）。
- 2026-09-22（**structure-debt 批 · 档面车道 · eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.5 · 台账 #67）：**建档**——自 `docs/core/design/AGENT-LOOP-SUBAGENT.md` 三分迁出
  §6.27 全族（§6.27.1–§6.27.12.13 + §6.27.8 内两段无编号提示词面文本块——**段零改动**——逐字搬移、节号沿用；全仓档面指针同批改指本档名）。
- 2026-09-29（**parity-b1-vsc-core 批 · 收口轮 · eng-coder**——承批档 `docs/batches/2026-09-29-parity-b1-vsc-core.md` §2.9）：§6.27.12.2 段尾句（核驱动现状）按**取代句**收正——**挂起面单源 = 核驱动（三端消费）**（端差只在装配面）；同段挂起驱动坐标块按实施后实读刷新（核 **297** ∕ CLI **211** ∕ VSC **291**——含 B1 面 W8 修单）。**机制条文零改**。

- 2026-09-29（**desktop-residuals-sweep 批 · 波 D（非冻结档面）· eng-designer**——承 `docs/batches/2026-09-29-desktop-residuals-sweep.md` §2 · 台账 #535）：D-SL1 行坐标按盘收正（`render-frame.mjs:221 ⇒ 227`——`AUTO│` 横幅）。**零新语义**。
- 2026-09-29（**core-hygiene 批 · P3 文档收正 · eng-designer**——承批档 `docs/batches/2026-09-29-core-hygiene.md` §2.8 行 5）：消费单点语义句与坐标按 **P2 三拆**收正（S1 ∕ S6 行 · §6.27.2-④ ∕ §6.27.12.1 ∕ §6.27.12.3 ∕ §6.27.12.4——
  drain = `agent/turn-loop.mjs:89`、consumeInjected = `:87`、域提醒注入点 = `agent/run-start.mjs:97-101`、轮首 pending 注入 = `:33-45`）；档头补三拆坐标注。机制条文零改。
- 2026-09-29（**residuals-round2 批 · 文档面实施轮 · eng-designer**——承批档 `docs/batches/2026-09-29-residuals-round2.md` §2 #586）：§6.27.12.5 F ∕ §6.27.12.10 U11 ∕ §6.27.12.12 ① 三处引文改指——W8 契约②判据现载体 = 批件 `docs/batches/2026-09-29-residuals-round2.test.mjs`（单测树重建时回迁端侧单测档）。**零新语义**。
