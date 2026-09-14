# 诊断事件日志机制（LOGGING）

> 板块：诊断事件日志。状态：**已实现**（2026-09-03 两端交付；评审 refinement 全处置）。
> 机制级文档——功能性需求以机制约束表述。
> 双端同构：CLI `thincoder-core/log.mjs` 与 VS Code `thincoder-vscode/src/log.mjs` 同一实现语义——共享日志目录、
> 同格式、同事件面。权威实现注释见 `thincoder-core/log.mjs`。

> 需求层已迁出（2026-09-10 需求层拆分批）：本板块需求见 `../requirements/LOGGING.md`——本档保留设计+测试层。

## 2. 设计

### 2.1 方案选型与理由

- **文件 append 日志**（非结构化文本行——每行一个事件 JSON）vs 轮询式内存缓冲：文件直接
  可查（用户 tail/grep）——零依赖——行 JSON 便于 grep（事件 kind/耗时）——不引入结构化存储。
- 事件面从既有关键节点**透出**（callbacks/现有 settle 钩子处加 emit——不新造事件总线——
  最小侵入）。
- 统一入口 `thincoder-core/log.mjs`（CLI）/VS Code 同构模块——`logEvent(kind, fields)`——内部组装
  时间戳/写文件/轮转清理。

### 2.2 架构

**事件格式**（每行一个 JSON——单行无换行）：

```json
{"ts":"2026-09-03T12:50:11.123Z","ev":"tool:call","tool":"subagent","ms":0,"seq":123}
{"ts":"2026-09-03T12:51:02.410Z","ev":"child:done","role":"explore","id":"explore#1","ms":51187,"kind":"ok"}
{"ts":"2026-09-03T12:51:02.900Z","ev":"llm:start","provider":"glm","model":"glm-5.3","turn":18}
{"ts":"2026-09-03T12:52:44.700Z","ev":"llm:error","provider":"glm","model":"glm-5.3","turn":18,"ms":101800,"err":"timeout ...","kind":"timeout"}
```

**事件面（v1 覆盖；触发点 = 实现落位的实际模块）**：

- **`turn:start` / `turn:end`** — `src/tui/agent-turn.mjs` 回合包装器入口/finally（含嵌套
  回合独立事件）。字段：kind（user/autoTurn）、ms、result（ok/error/stopped）。
- **`llm:start` / `llm:done` / `llm:error`** — **chat() 统一落点**（`thincoder-core/provider/core.mjs`
  chat 包装器——所有 LLM 调用点：主回合消化轮 + digest + compress + distill +
  advisor/子代理/consult/auto-think 各回合）。字段：provider/model/ms/err/stage/turn/
  auto/child（child=CLI 子代理 id；vscode 以 role/depth 归属）；llm:done 带 head/len/finish/tools。
- **`tool:call` / `tool:done` / `tool:error`** — dispatch 执行前后（`src/agent/dispatch.mjs`
  runOne / vscode `src/agent/execute-tools.mjs（VSC 仓）` runOne——pre-gate 拦截与参数解析失败不入事件）。
  字段：tool/ms/head（≤200）/err（≤200）。
- **`child:spawn` / `child:done` / `child:error`** — 子代理 spawn/settle
  （agent-tools/{subagent,subagent-async,consult}.mjs + vscode 同族 + escalate 执行器）。
  字段：role/id/ms/kind（ok/partial）——id 形如 explore#1。
- **`susp:enter` / `susp:exit` / `digest:start` / `digest:end`** — 挂起态迁移
  （`src/tui/agent-turn.mjs` suspensionSession/digestTurn / vscode `src/extension/suspension.mjs（VSC 仓）`）。
  字段：pendingN/poolN/ms/reason。
- **`ev:settled` / `ev:stopped` / `ev:cancelled`** — settle 回调分流（cancelled 分支 →
  ev:cancelled；挂起移交 → ev:settled）+ **中止清池 `ev:stopped`**（settle 回调外的
  turn-end Ctrl+C / suspension abort 清池点；正常回合内 settle 由 child:done 覆盖不另发）。
  字段：id/kind/poolN/where。
- **`err:internal`** — 未分类异常（runAgentTurn / runPanelChat 包装器 catch——带消息
  200 截断 + 栈位置）。字段：msg/where。

**写入点落位**（在既有节点 emit，不新造总线）：

- `src/tui/agent-turn.mjs`：回合包装器（turn:start/end）+ digestTurn（digest:*）+ suspensionSession（susp:*）。
- **llm:\* 统一落 chat()**（`thincoder-core/provider/core.mjs` chat 包装器——含续写嵌套对）——覆盖
  agent.mjs 消化轮、context.mjs compress/distill、auto-think、advisor、子代理/consult 各
  回合（单点全覆盖）。
- tool:*（`src/agent/dispatch.mjs` runOne——vscode `src/agent/execute-tools.mjs（VSC 仓）` runOne——
  pre-gate 拦截不入事件）。
- child:*/ev:*（agent-tools/{subagent,subagent-async,consult}.mjs 与 vscode 同族 +
  escalate 执行器——spawn/settle 分流点）。
- 挂起循环（suspensionSession/digestTurn——CLI agent-turn.mjs / vscode src/extension/suspension.mjs（VSC 仓））。
- 中止清池（agent.mjs runAgent finally Ctrl+C + suspension abort）→ ev:stopped。

**今日场景直接可验证**：4 spawn → tool:call ×4（并行同刻）→ child:done ×4 → llm:start
（消化轮）→ llm:error/done——"直接结束"若有 llm:error(timeout) 即实锤。

**存储**：

- 目录：`~/.thincoder/logs/`（与 sessions/ 同域）；`THINCODER_LOG_DIR` 显式 override。
- 文件名：`agent-YYYY-MM-DD.log`（按日——两端同写——同文件追加）。
- 轮转：每进程每日首次写事件时清超龄 `agent-*.log`（NF-L4/F-L3——机会式）。
- 写入：appendFileSync 小写（每事件一次——事件频率低——开销可忽略——失败静默降级，
  进程内首次失败置死——不逐事件空转）。

### 2.3 受影响文件（实现版）

- **CLI**：`thincoder-core/log.mjs`（新——logEvent/轮转/黑名单/seq）；`thincoder-core/provider/core.mjs`
  （llm:* 统一落点）；`src/tui/agent-turn.mjs`（turn/susp/digest/err）；`src/agent.mjs`
  （chat logCtx + 中止清池 ev:stopped）；`src/agent/dispatch.mjs`（tool:*）；
  `thincoder-core/context.mjs`（compress/distill logCtx）；`src/auto-think.mjs`（logCtx）；
  `src/agent-tools/{subagent,subagent-async,consult}.mjs`（child/ev 事件 + escalate
  执行器）；测试（T-L1..L10）。
- **VS Code**：同构镜像——新 `thincoder-vscode/src/log.mjs`（同一实现语义）；`src/provider.mjs（VSC 仓）`（llm:*）；
  `src/agent.mjs`（logCtx + ev:stopped）；`src/agent/execute-tools.mjs（VSC 仓）`（tool:*）；
  `src/extension/panel-chat.mjs（VSC 仓）`（turn/err——runPanelChat 包装）；
  `src/extension/suspension.mjs（VSC 仓）`（susp/digest/ev:stopped）；`src/agent-tools/*`（child/ev）；
  `src/compact.mjs（VSC 仓）` + `src/advisor/run.mjs`（logCtx stage）；测试（镜像）。
- **文档**：本文（README 地图已注册）；两端 AGENTS.md 模块表登记 log.mjs。

### 2.4 关键决策

- **B 摘要粒度**（用户裁定——"B 诊断效果更好"——A 盲区：模型没抛错但响应异常（空/超短/
  乱格式）——响应头可见）：LLM 响应头 300 + 工具结果头 200 + 错误 200——**不为内容级诊断
  倒退全文日志**（摘要封顶——单行 <512）。
- **敏感黑名单优先于摘要**：任何摘要写入前过黑名单——密钥形态（sk-xxx / Bearer xxx /
  key=…）截断到形态前——宁可丢信息不漏密钥。
- **敏感字段黑名单**：apiKey/designToken/password/secret/token——**匹配语义（refinement
  #7 定稿）：字段名精确匹配（大小写不敏感）+ 内容只扫密钥形态（sk-xxx / Bearer xxx /
  key= 等）**——工具事件不记 args——URL 不入事件（llm/tool 事件不携带 URL——err 文本经
  形态扫描）——另加防御性字段名（authorization/proxy/proxyUri——防凭据型 URL 泄漏）。
- **LLM 调用全点覆盖**（含 digest/compress/distill/子代理回合）：今日场景诊断需要
  digest/compress 调用可见——**实现：llm:\* 统一在 chat() 落点（单点 = 全覆盖，未来新增
  调用点自动覆盖）**；子代理内部事件同文件全记（CLI 子内 llm/tool 事件带 child 字段 =
  role#N——spawn 时 stamp agent._logId；查日志按 childId grep）；vscode 子代理 agent 对象
  per-run 重建——子内事件以 role/depth 归属。
- **摘要字段名定稿**：llm:done/tool:done 带头字段 head（≤300/200）；err 变体带 err（≤200）；
  **seq = per-process 计数器——注释明示双端同写一个文件时 seq 会各自重复（定位以 ts 为准）**。
- **否决**：a) 结构化数据库（sqlite——零依赖约束——文件行 JSON 够）；b) 内存环形缓冲 +
  崩溃时 dump（崩溃场景罕见——文件直写更简单可靠）；c) 全量内容日志（文件爆炸——A 裁定）；
  d) 独立诊断模式开关（常驻才有效——用户要"发生时好查"——常驻低开销）。

### 2.5 测试隔离与开发提示

- **测试隔离**：`THINCODER_LOG_DIR` 显式 override + `NODE_TEST_CONTEXT` 门——node --test
  进程默认跳过写盘（不污染真实日志）；两端既有测试套件跑真实管线也零污染。测试用
  `THINCODER_LOG_DIR` 指向临时目录。
- **跨平台写失败注入**（T-L8）：父路径为文件（Windows 只读目录不阻止创建文件）。
- **开发提示**：直接跑 `node 某scratch.mjs` 验证脚本会写真实 `~/.thincoder/logs`（常驻日志
  固有行为）——验证脚本请设 `THINCODER_LOG_DIR=临时目录`（当日轮转自清真实目录）。
- **已知 v1 边界**（非 chat 调用的 LLM 直连点不入 llm:* 事件）：generate-title（直连
  fetch——非 chat 管线）；embedding 向量调用。诊断价值无碍（标题生成/embedding 均非回合
  断点相关）。

## 3. 测试

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T-L1 | 正常回合骨架 | 跑一个 turn（mock LLM） | turn:start/llm:start/llm:done/turn:end 落文件——含耗时 | F-L1 |
| T-L2 | 工具调用事件 | 回合内 read | tool:call/tool:done——**无参数值** | F-L1/NF-L3 |
| T-L3 | LLM 错误 | mock 超时 | llm:error kind=timeout + 消息 200 截断 | F-L2 |
| T-L4 | 子代理骨架 | spawn explore（mock） | child:spawn/child:done + childId 字段 | F-L4 |
| T-L5 | 敏感字段 | 工具带 apiKey 参数 + 响应含 sk-xxx | 日志零 apiKey/sk-xxx（负断言——摘要黑名单截断） | NF-L3 |
| T-L5b | 响应头摘要 | mock 空回复/超短回复 | llm:done 带头摘要（空/超短可见） | F-L2 |
| T-L6 | 行截断 | 超长错误消息 | 行 <512 字符 | NF-L2 |
| T-L7 | 轮转清理 | 造 >1 天旧日志 | 首次写事件后旧文件删除 | NF-L4 |
| T-L7b | 自动清理 | 造超龄旧日志 + 首次写事件 | 旧文件自动删除（机会式——用户零手动） | F-L3 |
| T-L8 | 写失败静默 | 日志目录不可创建（父路径为文件注入） | 主流程无异常——日志静默 | NF-L1 |
| T-L9 | 挂起/digest 事件 | mock 挂起会话 | susp:enter/digest:start/digest:end | F-L4 |
| T-L10 | 今日场景复现链路 | 4 并行 spawn mock → 消化轮 mock 失败 | 日志序列 tool:call×4 → child:done×4 → llm:start → llm:error——断点可定位 | F-L4 |

**验收**：AC-L1 = 事件面 v1 全落地（T-L1..L9 双端绿）；AC-L2 = 敏感零落盘（T-L5）；
AC-L3 = 今日场景日志可定位断点（T-L10——序列断言）；AC-L4 = 两端同事件面（VS Code 镜像）。

## 变更记录

- 2026-09-03：立项实现（两端交付）——常驻事件骨架日志，按天轮转保留 1 天，机会式清理，
  B 级摘要 + 敏感黑名单，llm:* 统一落 chat()，测试隔离（THINCODER_LOG_DIR + NODE_TEST_CONTEXT）。
- 2026-09-03：9 项评审 refinement 全处置（#1 输入事件不记 / #2 行号锚去符号 / #3 清理机会式
  / #4 受影响文件补全实际模块 / #6 测试隔离门 / #7 黑名单词表 + 匹配语义 / #8 head/err/seq
  字段定稿 / #9 README 地图登记）。
- 2026-09-03：code review 收敛（advisor #1 七项全修）——保留窗口以文件名日期当日结束为
  基准（今天+昨天）、CLI poolN 去双计、vscode parity 补齐、中止守卫等；机制正文收敛到本文
  §2 当前态。
- 2026-09-07：DOC-REWRITE 批 A——可读化重写为当前态（多行 markdown，历史折叠为变更记录）。
