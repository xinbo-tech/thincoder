# 诊断日志（LOGGING）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 事件日志 | `thincoder-cli/src/log.mjs` | 同名（同路径对） |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 非逐字节同组（原 §2.5（二）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|
| 42 | `log.mjs` | 同路径 | 0.9290 · 异 | ① | 取一侧 + 注记 / 指针订正（非语义） | 分叉 = 注释独立维护（两端指针各自局部正确）；无失效前提（①） | — | S0a（首批建核） |

**四要素明细（原 §2.5（二）明细块 · 逐字）**

- **#42 `log.mjs`**（同路径 · j 0.9290 · sha `388222697c48` / `ab12c7f0f694` · 195 / 196 行）
  - 左端读数（CLI）：差异 = 5 行注释——指针 `docs/design/LOGGING.md`（CLI 侧该档存在）+ `§18.6` 等注记。
  - 右端读数（VSC）：6 行注释——指针 `docs/requirements/LOGGING.md`（VSC 侧该档存在——两仓文档约定不同，各自局部正确）+ 镜像注记（「CLI log.mjs redactSecret 同实现——双端语义同构」）。
  - 建议归一形态：取一侧 + 镜像注记删除、指针按仓约定订正（非语义）。
  - 影响面：无（仅注释；须用户裁 = —）。

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（差异仅注释与指针）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/LOGGING.md`（160 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料（受影响文件表 / 用例表 / 验收表 / 变更流水账）· 时点括注。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧日志实现住 `src/log.mjs` / `src/agent/**`）——本节一律按**现状路径**落笔（`thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 方案选型与理由

- **文件 append 日志**（非结构化文本行——每行一个事件 JSON）vs 轮询式内存缓冲：文件直接可查（用户 tail / grep）——**零依赖**——行 JSON 便于 grep（事件 `ev` / 耗时）——不引入结构化存储。
- 事件面从既有关键节点**透出**（callbacks / 既有 settle 钩子处加 emit——**不新造事件总线**——最小侵入）。
- 统一入口 `thincoder-core/log.mjs`（CLI）/ VS Code 同构模块——`logEvent(kind, fields)`——内部组装时间戳 / 写文件 / 轮转清理；双端同实现语义（共享日志目录、同格式、同事件面）。

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
- **`err:internal`** —— 未分类异常（回合包装器 catch——带消息 200 截断 + 栈位置）；字段 msg / where。

**写入点落位**（在既有节点 emit，不新造总线）：回合包装器与 digest / suspension 面（`thincoder-cli/src/tui/agent-turn.mjs`）· `llm:*` 统一落 `chat()`（单点全覆盖——未来新增调用点自动覆盖）· `tool:*` 在 dispatch `runOne` · `child:*` / `ev:*` 在子代理族 spawn / settle 分流点 · 中止清池（runAgent finally + suspension abort）→ `ev:stopped`。

**存储**：目录 `~/.thincoder/logs/`（与 sessions/ 同域）；`THINCODER_LOG_DIR` 显式 override；文件名 `agent-YYYY-MM-DD.log`（按日——两端同写同文件追加）；**轮转** = 每进程每日首次写事件时清超龄 `agent-*.log`（机会式）；**写入** = `appendFileSync` 小写（每事件一次——事件频率低——开销可忽略——失败静默降级，进程内首次失败置死——不逐事件空转）。

### 6.3 关键决策

- **B 摘要粒度**（用户裁定）：「LLM 响应头 300 + 工具结果头 200 + 错误 200」——**不为内容级诊断倒退全文日志**（摘要封顶——单行 < 512）。动机 = A 级盲区（模型没抛错但响应异常：空 / 超短 / 乱格式——响应头可见）。
- **敏感黑名单优先于摘要**：任何摘要写入前过黑名单——密钥形态（`sk-xxx` / `Bearer xxx` / `key=…`）截断到形态前——**宁可丢信息不漏密钥**。
- **敏感字段黑名单**：`apiKey` / `designToken` / `password` / `secret` / `token`——**匹配语义 = 字段名精确匹配（大小写不敏感）+ 内容只扫密钥形态**；**工具事件不记 args**——URL 不入事件——另加防御性字段名（`authorization` / `proxy` / `proxyUri`）。
- **LLM 调用全点覆盖**（含 digest / compress / distill / 子代理回合）：实现 = `llm:*` 统一在 `chat()` 落点（**单点 = 全覆盖**，未来新增调用点自动覆盖）；子代理内部事件同文件全记（`child` 字段 = role#N——spawn 时 stamp）；VSC 子代理 agent 对象 per-run 重建——子内事件以 role/depth 归属。
- **摘要字段名定稿**：`llm:done` / `tool:done` 带头字段 `head`（≤300/200）；`err` 变体带 `err`（≤200）；**`seq` = per-process 计数器**——注释明示双端同写一个文件时 seq 会各自重复（定位以 ts 为准）。
- **否决**：a) 结构化数据库（sqlite——零依赖约束——文件行 JSON 够）；b) 内存环形缓冲 + 崩溃时 dump（崩溃场景罕见——文件直写更简单可靠）；c) 全量内容日志（文件爆炸——A 裁定）；d) 独立诊断模式开关（常驻才有效——用户要「发生时好查」——常驻低开销）。

### 6.4 测试隔离与开发提示

- **测试隔离**：`THINCODER_LOG_DIR` 显式 override + `NODE_TEST_CONTEXT` 门——`node --test` 进程默认跳过写盘（不污染真实日志）；测试用 `THINCODER_LOG_DIR` 指向临时目录。
- **开发提示**：直接跑脚本验证会写真实 `~/.thincoder/logs`（常驻日志固有行为）——验证脚本请设 `THINCODER_LOG_DIR=临时目录`。
- **跨平台写失败注入**：父路径为文件（Windows 只读目录不阻止创建文件）。
- **已知 v1 边界**（非 chat 调用的 LLM 直连点不入 `llm:*` 事件）：generate-title（直连 fetch——非 chat 管线）；embedding 向量调用。诊断价值无碍。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-LG1 | 存储 = **文件 append 日志**（每行一个事件 JSON） | 零依赖 + 用户可直接 tail / grep；否决结构化 DB · 内存环形缓冲 |
| D-LG2 | 事件面从既有节点**透出**（不新造事件总线） | 最小侵入；写入点集中且可枚举 |
| D-LG3 | 摘要粒度 = **B 级**（LLM 响应头 300 / 工具结果头 200 / 错误 200） | 用户裁定「B 诊断效果更好」——A 级盲区（响应异常不可见）；否决全文日志 |
| D-LG4 | **敏感黑名单优先于摘要**（字段名精确匹配 + 内容扫密钥形态；工具不记 args；URL 不入事件） | 宁可丢信息不漏密钥 |
| D-LG5 | `llm:*` 统一落 **`chat()` 单点** | 单点 = 全覆盖（未来新增调用点自动覆盖）；否决各注入器各自实现 |
| D-LG6 | 轮转 = **每进程每日首次写事件时机会式清理**（非仅启动时） | extension host 可长驻——启动清理覆盖不到；用户零手动维护 |
| D-LG7 | 失败 = **静默降级**（进程内首次失败置死——不逐事件空转） | 日志不得影响主流程（fire-and-forget） |
| D-LG8 | 测试隔离 = `THINCODER_LOG_DIR` + `NODE_TEST_CONTEXT` 门 | 不污染真实日志；两端既有测试套件跑真实管线也零污染 |
| D-LG9 | 两端**同事件面**（共享目录 / 同格式 / 镜像实现） | 双端同构便于合并分析；不做跨端同步依赖（差异如实登记） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/LOGGING.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 文末「变更记录」（立项 / 9 项 refinement / code review 收敛 / 可读化重写） | 逐批变更与评审流水账 | 历史叙述——本档自有变更记录 |
| 头注「状态：已实现（2026-09-03 两端交付；评审 refinement 全处置）」 | 交付状态标记 | 时点状态——归批次档 / 台账（D2） |
| §2.2 「今日场景直接可验证」括注（4 spawn 场景的日志序列示例） | 事故场景取证叙述 | 时点材料——事件面已入 §6.2 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §2.3 受影响文件（实现版——双端逐档） | 逐档清单 | **一次性批次材料**——批次档承载 |
| §3 测试（T-L1–T-L10 + AC-L1–AC-L4） | 用例表与验收表 | **一次性批次材料**——测试资产归测试层 |
| §2.2 内的 VSC 镜像模块逐行 | VSC 侧同构实现 | 属 VSC 产品树（`thincoder-vscode/src/**`）；同构语义已入 §6.1 / §6.2 |

### 8.3 需求侧（已并入本层需求档）

旧档需求面（F-L1–F-L7 / NF-L1–NF-L4）=== 本板块需求层，已并入本层需求档 `docs/requirements/LOGGING.md`（**与本档同名成对**）——本档不重复。

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **144 行**（B 轮并入前 46 行）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #42 + 四要素明细）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §6 **机制面**（选型与理由 / 架构——事件格式·事件面·写入点·存储 / 关键决策 / 测试隔离与开发提示）· §7 **关键决策记录（D-LG1–9）** · §8 **不并项与历史沿革** · §9 体量（低于软线，无需拆分）；来源 = `thincoder-cli/docs/design/LOGGING.md`（**旧档一字未改**——原地作参照历史）；需求侧已并入本层 `docs/requirements/LOGGING.md`；首部加机制面指针一行。
