# 诊断日志（LOGGING）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§7）：机制 / 契约的实质描述 · 关键决策——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 事件日志 | 经 `@thincoder/core/log.mjs` 引用 | 经 `@thincoder/core/log.mjs` 引用 |

## 2. 核模块裁决行

### 2.1 非逐字节同组

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 42 | `log.mjs` | 同路径 | 0.9290 · 异 | ① | 取一侧 + 注记 / 指针订正（非语义） | 分叉 = 注释独立维护（两端指针各自局部正确）；无失效前提（①） | — | S0a（首批建核） |

**四要素明细**

- **#42 `log.mjs`**（同路径 · j 0.9290 · sha `388222697c48` / `ab12c7f0f694` · 195 / 196 行）
  - 左端读数（CLI）：差异 = 5 行注释——指向本仓 LOGGING 档的指针（`docs/design/LOGGING`——CLI 侧该档存在）+ `§18.6` 等注记。
  - 右端读数（VSC）：6 行注释——指向该仓需求层 LOGGING 档的指针（`docs/requirements/LOGGING`——VSC 侧该档存在，两仓文档约定不同、各自局部正确）+ 镜像注记（「CLI log.mjs redactSecret 同实现——双端语义同构」）。
  - 建议归一形态：取一侧 + 镜像注记删除、指针按仓约定订正（非语义）。
  - 影响面：无（仅注释；须用户裁 = —）。

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（差异仅注释与指针）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 6. 机制面

> **本节内容**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> 符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 方案选型与理由

- **文件 append 日志**（非结构化文本行——每行一个事件 JSON）：文件直接可查（用户 tail / grep）——**零依赖**——行 JSON 便于 grep（事件 `ev` / 耗时）——不引入结构化存储。
- 事件面从既有关键节点**透出**（callbacks / 既有 settle 钩子处加 emit——**不新造事件总线**——最小侵入）。
- 统一入口 `thincoder-core/log.mjs`——`logEvent(kind, fields)`——内部组装时间戳 / 写文件 / 轮转清理；双端同实现语义（共享日志目录、同格式、同事件面）。

### 6.2 架构

**事件格式**（每行一个 JSON——单行无换行）：

```
{"ts":"2026-09-03T12:50:11.123Z","ev":"tool:call","tool":"subagent","ms":0,"seq":123}
{"ts":"2026-09-03T12:51:02.410Z","ev":"child:done","role":"explore","id":"explore#1","ms":51187,"kind":"ok"}
{"ts":"2026-09-03T12:51:02.900Z","ev":"llm:start","provider":"glm","model":"glm-5.3","turn":18}
{"ts":"2026-09-03T12:52:44.700Z","ev":"llm:error","provider":"glm","model":"glm-5.3","turn":18,"ms":101800,"err":"timeout ...","kind":"timeout"}
```

**事件面（v1 覆盖）**：

- **`turn:start` / `turn:end`** —— 回合包装器入口 / finally（含嵌套回合独立事件）；字段 kind（user/autoTurn）/ ms / result（ok/error/stopped）。
- **`llm:start` / `llm:done` / `llm:error`** —— **`chat()` 统一落点**（`thincoder-core/provider/core.mjs`）——所有 LLM 调用点（主回合消化轮 + digest + compress + distill + advisor / 子代理 / consult / auto-think 各回合）；字段 provider / model / ms / err / stage / turn / auto / child；`llm:done` 带 head / len / finish / tools。
- **`tool:call` / `tool:done` / `tool:error`** —— dispatch 执行前后（`thincoder-core/agent/dispatch.mjs`——pre-gate 拦截与参数解析失败**不入事件**）；字段 tool / ms / head（≤200）/ err（≤200）。
- **`child:spawn` / `child:done` / `child:error`** —— 子代理 spawn / settle（`thincoder-core/agent-tools/*`）；字段 role / id / ms / kind（ok/partial）。
- **`susp:enter` / `susp:exit` / `digest:start` / `digest:end`** —— 挂起态迁移；字段 pendingN / poolN / ms / reason。
- **`ev:settled` / `ev:stopped` / `ev:cancelled`** —— settle 回调分流 + **中止清池 `ev:stopped`**（正常回合内 settle 由 child:done 覆盖不另发）；字段 id / kind / poolN / where。
  - **`ev:cancelled` 三个写点**：
    - ① `settleAsyncEntry` cancelled 分支（running 取消——经 settle 三连）；
    - ② **queued 取消出队点直记**（`advisor-async.mjs` / `subagent-async.mjs` 的 queued 分支——出队即终态、不经 settle ⇒ 不走 ①）；
    - ③ **sync 定向取消提交点直记**（`subagent-async.mjs` `cancelSyncChild`——sync 块 ⏹ 唯一入口；机制条 = `AGENT-LOOP-SUBAGENT.md` 的 §6.7.2「日志面」）。
  - 三写点字段同形：`id` = `<role>#<id>`（评审族 = `advisor#<id>`）；**同一次取消恰一条**（写点互斥：queued 走 ②、running 走 ①、sync 走 ③——三种 child 形态各恰一条）。
- **`ev:unsettled`** —— 消化账务升级留痕（`thincoder-core/agent/digest-account.mjs`——同一条目积满 `DA_MISS_LIMIT`（= 4）个未签收消化轮 ⇒ 升级单点；恰一条/批）；字段 n / ids（机制 = `AGENT-LOOP-ASYNC-POOL.md` §6.31.5）。
- **`ev:unsettled-disclose-failed`** —— 升级终局披露失败留痕（`thincoder-core/agent/digest-account.mjs`——披露逐条 try/catch，单条失败不拦余下条目：账本与提醒已先落 ⇒ 可见性降级、不静默）；字段 id / err（≤200）（机制 = 同档 §6.31.5）。
- **`ev:finish-missing`** —— 结束信号缺席留痕（`thincoder-core/agent/run-stages.mjs`——`finishReason` 缺席（clean ∧ 非 partial）与同面提醒同点；F-DA5）；字段 turn / auto / child（机制 = 同档 §6.31.7）。
- **`ev:subagent-block-revived`** —— 墓碑存活闸**复活分支**留痕（`thincoder-cli/src/tui/subagent-blocks.mjs` `ensureSubTaskKey`——墓碑命中但条目**池内存活（在池 ∧ 非 done / 非 cancelled）** ⇒ 摘墓碑 + 重建块；**每次复活记一条（无去重状态）**）。
- **`ev:queued-paint-failed`** —— 排队块刷新 relay 异常留痕（`thincoder-core/agent-tools/subagent-scheduler.mjs` `refreshQueuedTokens` catch——池状态不被破坏）。
- **`err:internal`** —— 未分类异常（回合包装器 catch——带消息 200 截断 + 栈位置）；字段 msg / where。
- **`err:provider`** —— provider 失败面的原文余行（CLI 回合循环 `thincoder-cli/src/tui/agent-turn.mjs` 非中止 catch 分支——X8 跟进 ②）；字段 `err`（脱敏首行，≤200）· `head`（余行合单行——**同过脱敏管道**〔`[endpoint]`；§6.3 D-LG4「URL 不入事件」〕后自限 ≤200——合字段上限后单行仍 <512）；余行缺 ⇒ 字段缺省（**不传空串**）；写点唯一；表面零膨胀（不增 UI 行）。

**写入点落位**（在既有节点 emit，不新造总线）：回合包装器与 digest / suspension 面（`thincoder-cli/src/tui/agent-turn.mjs`）· `llm:*` 统一落 `chat()`（单点全覆盖——未来新增调用点自动覆盖）。

其余落点：`tool:*` 在 dispatch `runOne` · `child:*` / `ev:*` 在子代理族 spawn / settle 分流点（另两新条目见 §6.2——`ev:subagent-block-revived` 落显示层复活分支 · `ev:queued-paint-failed` 落排队刷新 catch）· 中止清池（runAgent finally + suspension abort）→ `ev:stopped`。

**存储**：目录 `~/.thincoder/logs/`（与 sessions/ 同域）；文件名 `agent-YYYY-MM-DD.log`（按日——两端同写同文件追加）；**轮转** = 每进程每日首次写事件时清超龄 `agent-*.log`（机会式）；**写入** = `appendFileSync` 小写（每事件一次——事件频率低——开销可忽略——失败静默降级，进程内首次失败置死——不逐事件空转）。

### 6.3 关键决策

- **B 摘要粒度**（用户裁定）：「LLM 响应头 300 + 工具结果头 200 + 错误 200」——**不为内容级诊断倒退全文日志**（摘要封顶——单行 < 512）。动机 = A 级盲区（模型没抛错但响应异常：空 / 超短 / 乱格式——响应头可见）。
- **敏感黑名单优先于摘要**：任何摘要写入前过黑名单——密钥形态（`sk-xxx` / `Bearer xxx` / `key=…`）截断到形态前——**宁可丢信息不漏密钥**。
- **敏感字段黑名单**：`apiKey` / `designToken` / `password` / `secret` / `token`——**匹配语义 = 字段名精确匹配（大小写不敏感）+ 内容只扫密钥形态**；**工具事件不记 args**——URL 不入事件——另加防御性字段名（`authorization` / `proxy` / `proxyUri`）。
- **LLM 调用全点覆盖**（含 digest / compress / distill / 子代理回合）：实现 = `llm:*` 统一在 `chat()` 落点（**单点 = 全覆盖**，未来新增调用点自动覆盖）；子代理内部事件同文件全记（`child` 字段 = role#N——spawn 时 stamp）；VSC 子代理 agent 对象 per-run 重建——子内事件以 role/depth 归属。
- **摘要字段名定稿**：`llm:done` / `tool:done` 带头字段 `head`（≤300/200）；`err` 变体带 `err`（≤200）；**`seq` = per-process 计数器**——注释明示双端同写一个文件时 seq 会各自重复（定位以 ts 为准）。

### 6.4 测试隔离与开发提示

- **测试隔离**：`NODE_TEST_CONTEXT` 写门 + 进程内落点缝——`node --test` 进程默认跳过写盘（不污染真实日志）；测试以 `_setLogsDirForTest(临时目录)` 显式指定落点（缝形态见 `CONFIG.md` §6.2）。
- **开发提示**：直接跑脚本验证会写真实 `~/.thincoder/logs`（常驻日志固有行为）——须换落点时在脚本内先调 `_setLogsDirForTest(临时目录)`。
- **跨平台写失败注入**：父路径为文件（Windows 只读目录不阻止创建文件）。
- **已知 v1 边界**（非 chat 调用的 LLM 直连点不入 `llm:*` 事件）：generate-title（直连 fetch——非 chat 管线）；embedding 向量调用。诊断价值无碍。

## 7. 并入的关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-LG1 | 存储 = **文件 append 日志**（每行一个事件 JSON） | 零依赖 + 用户可直接 tail / grep |
| D-LG2 | 事件面从既有节点**透出**（不新造事件总线） | 最小侵入；写入点集中且可枚举 |
| D-LG3 | 摘要粒度 = **B 级**（LLM 响应头 300 / 工具结果头 200 / 错误 200） | 用户裁定「B 诊断效果更好」——A 级盲区（响应异常不可见） |
| D-LG4 | **敏感黑名单优先于摘要**（字段名精确匹配 + 内容扫密钥形态；工具不记 args；URL 不入事件） | 宁可丢信息不漏密钥 |
| D-LG5 | `llm:*` 统一落 **`chat()` 单点** | 单点 = 全覆盖（未来新增调用点自动覆盖） |
| D-LG6 | 轮转 = **每进程每日首次写事件时机会式清理**（非仅启动时） | extension host 可长驻——启动清理覆盖不到；用户零手动维护 |
| D-LG7 | 失败 = **静默降级**（进程内首次失败置死——不逐事件空转） | 日志不得影响主流程（fire-and-forget） |
| D-LG8 | 测试隔离 = 进程内落点缝（`_setLogsDirForTest`）+ `NODE_TEST_CONTEXT` 写门 | 不污染真实日志；两端既有集成测试跑真实管线也零污染 |
| D-LG9 | 两端**同事件面**（共享目录 / 同格式） | 双端同构便于合并分析；不做跨端同步依赖（差异如实登记） |
