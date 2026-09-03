# 诊断事件日志机制（LOGGING）

> 状态：设计定稿，待评审（2026-09-03 用户裁定——两端一次 + A 事件骨架）。机制级文档——功能性需求以机制约束表述。

## 1. 需求

### 1.1 总体需求（为什么）

**问题循环**：用户实测问题（"4 个 explore 完成但主会话回合直接结束无消化"）暴露——每次诊断都靠**临时插桩再删**（eea8fcc 插桩 → 5d0a38a 撤——TODO 记复现点），成本高、覆盖窄、撤后无痕。用户裁定：**常驻诊断事件日志**——保留一天——问题发生时直接查日志定位断点——根治插桩循环。

### 1.2 机制约束（功能性——架构级表述）

- F-L1：**事件骨架日志**——回合/工具/子代理/LLM 调用的关键事件序列（时间戳 + 事件 + 关键参数 + 耗时）——**不记内容文本**（工具输出/LLM 文本流不落——文件小、够定位断点）
- F-L2：**错误事件带截断消息**（≤200 字符——错误消息是诊断必需——不算"内容"——kind + 位置 + 消息）
- F-L3：**按天轮转保留**（~/.thincoder/logs/agent-YYYY-MM-DD.log——保留最近 1 天自动清理——滚动窗口防累积）
- F-L4：**覆盖面**：主回合骨架（开始/结束/耗时/结果 kind）、LLM 调用（provider/模型/请求开始/完成/错误 + 耗时 + 状态——无内容）、工具调用（名/耗时/结果 kind——无参数值——**敏感参数（apiKey/token/密钥）永不落**）、子代理（spawn/完成/role/耗时/kind——含 async settle/digest 轮）、挂起态（进入/退出/digest 触发/输入事件）
- F-L5：**零侵入**：日志写入是 fire-and-forget（append 同步/异步无阻塞——失败静默——绝不影响主流程）
- F-L6：**两端一致**：CLI + VS Code 同事件面（共享日志目录 ~/.thincoder/logs/——同格式——VS Code 端实现镜像）
- F-L7：**性能**：每事件一次小 append（<1KB）——正常回合事件数 <1000——无热点（非每 token 记——只在事件边界记）

### 1.3 非功能性（硬指标）

- NF-L1：日志写失败（磁盘满/权限）**静默降级**——主流程零影响
- NF-L2：单事件行 <512 字符（超长截断）——错误消息 200 截断
- NF-L3：**敏感数据零落盘**（apiKey/designToken/对话文本/工具参数——黑名单字段+默认不记参数）
- NF-L4：保留窗口：最近 1 天（启动时清理 >1 天的 agent-*.log）

## 2. 设计

### 2.1 方案选型与理由

- **文件 append 日志**（非结构化文本行——每行一个事件 JSON）vs 轮询式内存缓冲：文件直接可查（用户 tail/grep）——零依赖——行 JSON 便于 grep（事件 kind/耗时）——不引入结构化存储
- 事件面从既有关键节点**透出**（callbacks/现有 settle 钩子处加 emit——不新造事件总线——最小侵入）
- 统一入口 `src/log.mjs`（CLI）/VS Code 对应（extension 侧同构模块）——`logEvent(kind, fields)`——内部组装时间戳/写文件/轮转清理

### 2.2 架构

**事件格式**（每行 JSON——单行无换行）：
```json
{"ts":"2026-09-03T12:50:11.123Z","ev":"tool:call","tool":"subagent","ms":0,"seq":123}
{"ts":"2026-09-03T12:51:02.410Z","ev":"child:done","role":"explore","id":"explore#1","ms":51187,"kind":"ok"}
{"ts":"2026-09-03T12:51:02.900Z","ev":"llm:start","provider":"glm","model":"glm-5.3","turn":18}
{"ts":"2026-09-03T12:52:44.700Z","ev":"llm:error","provider":"glm","model":"glm-5.3","turn":18,"ms":101800,"err":"timeout ...","kind":"timeout"}
```

**事件面（E 清单——v1 覆盖）**：
| 事件 | 触发点 | 字段 |
|---|---|---|
| turn:start / turn:end | runAgentTurn 入口/finally | kind（user/autoTurn）、ms、result（ok/error/stopped） |
| llm:start / llm:done / llm:error | chat 调用（agent.mjs L262 消化轮 + digest + compress + distill + advisor/子代理 chat 各自回合——**所有 LLM 调用点**） | provider/model/turn/ms/err |
| tool:call / tool:done / tool:error | dispatch 执行前后 | tool/ms/result |
| child:spawn / child:done / child:error | 子代理启动/settle（阻塞 + async + escalate + consult） | role/id/ms/kind |
| susp:enter / susp:exit / digest:start / digest:end | 挂起态迁移 | pendingN/poolN |
| ev:settled / ev:stopped / ev:cancelled | settle 回调分流 | id/kind |
| err:internal | 未分类异常（catch-all——带消息 200 截断 + 栈位置） | msg/where |

**写入点落位**（自查确认——不新造总线——在既有节点 emit）：
- agent-turn.mjs：回合开始/finally（turn:start/end）
- agent.mjs：chat 调用处 ×N（llm:*）——runAgent 循环内 tool 执行前后（tool:*）
- subagent/subagent-async/consult/escalate：spawn/settle 分流点（child:*、ev:*）
- 挂起循环（agent-turn suspensionSession）：susp:*、digest:*
- **今日场景直接可验证**：4 spawn → tool:call ×4（并行同刻）→ child:done ×4 → llm:start（消化轮）→ llm:error/done——"直接结束"若有 llm:error(timeout) 即实锤

**存储**：
- 目录：~/.thincoder/logs/（与 sessions/ 同域——session-io 共享）
- 文件名：agent-YYYY-MM-DD.log（按日——两端同写——同文件追加）
- 轮转：启动时清 >1 天的 agent-*.log（NF-L4）
- 写入：appendFile 同步小写（每事件一次 fs.appendFileSync——事件频率低——开销可忽略）或异步队列——选实现最小（自查——appendFileSync 于事件边界可接受——失败 try/catch 静默）

### 2.3 受影响文件

| 端 | 文件 |
|---|---|
| CLI | 新 src/log.mjs（入口——logEvent/轮转/清理）、src/agent-turn.mjs（回合/挂起/digest 事件）、src/agent.mjs（LLM/tool 事件）、src/agent-tools/{subagent,subagent-async,consult,escalate}.mjs（child/ev 事件）、test/log.test.mjs（新） |
| VS Code | 同构镜像：extension 侧 log 模块（src/extension/log.mjs？——自查）——事件点同（panel-chat/agent.mjs/execute-tools/subagent 族）——共享 ~/.thincoder/logs/ |
| 文档 | 本文件（README 地图注册）、两端 AGENTS.md/ARCHITECTURE 模块表 |

### 2.4 关键决策

- **A 骨架不记内容**（用户裁定）：内容文本/参数不落——诊断断点靠事件序列 + 耗时 + 错误消息——**若未来某类问题需要内容级诊断——加定向字段（如 llm:start 的 prompt 长度/模型——仍不记正文）——不倒退全文日志**
- **错误消息例外记**（≤200 截断）：错误是诊断必需信号——不算内容
- **敏感字段黑名单**：apiKey/designToken/password/secret/token——工具事件不记 args——URL 记 host 不记 query 参数值（如 api 域名可记——query token 不记）
- **LLM 调用全点覆盖**（含 digest/compress/distill/子代理回合）：今日场景诊断需要 digest/compress 调用可见（A/C 候选区分）——子代理的 LLM 调用也记（child 自己的回合——provider/model/耗时）——但子代理内部事件不进主文件？——**设计：主文件记主会话事件 + 子代理骨架事件（child:spawn/done + 子代理内 llm 调用以 child 前缀记——同文件——统一时序）**——简化：一个文件全记（事件含 childId 字段区分）——查日志按 childId grep
- **否决**：a) 结构化数据库（sqlite——零依赖约束——文件行 JSON 够）；b) 内存环形缓冲 + 崩溃时 dump（崩溃场景罕见——文件直写更简单可靠）；c) 全量内容日志（文件爆炸——A 裁定）；d) 独立诊断模式开关（常驻才有效——用户要"发生时好查"——常驻低开销）

## 3. 测试（用例表）

| # | 场景 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|
| T-L1 | 正常回合骨架 | 跑一个 turn（mock LLM） | turn:start/llm:start/llm:done/turn:end 落文件——含耗时 | F-L1 |
| T-L2 | 工具调用事件 | 回合内 read | tool:call/tool:done——**无参数值** | F-L1/NF-L3 |
| T-L3 | LLM 错误 | mock 超时 | llm:error kind=timeout + 消息 200 截断 | F-L2 |
| T-L4 | 子代理骨架 | spawn explore（mock） | child:spawn/child:done + childId 字段 | F-L4 |
| T-L5 | 敏感字段 | 工具带 apiKey 参数 | 日志零 apiKey 出现（负断言） | NF-L3 |
| T-L6 | 行截断 | 超长错误消息 | 行 <512 字符 | NF-L2 |
| T-L7 | 轮转清理 | 造 >1 天旧日志 | 启动后旧文件删除 | NF-L4 |
| T-L8 | 写失败静默 | 目录只读 | 主流程无异常——日志静默 | NF-L1 |
| T-L9 | 挂起/digest 事件 | mock 挂起会话 | susp:enter/digest:start/digest:end | F-L4 |
| T-L10 | 今日场景复现链路 | 4 并行 spawn mock → 消化轮 mock 超时 | 日志序列 tool:call×4 → child:done×4 → llm:start → llm:error——断点可定位 | F-L4 价值证明 |

**验收**：AC-L1 = 事件面 v1 全落地（T-L1..L9）；AC-L2 = 敏感零落盘（T-L5）；AC-L3 = 今日场景日志可定位断点（T-L10——序列断言）；AC-L4 = 两端同事件面（VS Code 测试镜像）
