# 评审收敛（ADVISOR-CONVERGENCE）— 需求（VSC 仓）

> 板块：评审收敛（advisor 独立评审的「审查 → 修复 → 复审」循环收敛保证 + 评审链边缘守卫）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`ADVISOR-CONVERGENCE（CLI 仓·需求）§1–§4`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `ADVISOR-CONVERGENCE（本仓·设计）`（1426 行——机制权威）；权威源 = `src/advisor/`（13 档）+ 工具面 `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）`（346 行）/ `advisor-async.mjs`（497 行）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

独立评审子代理（只读、零 git 写）必须在「审查 → 修复 → 复审」循环中**收敛**：确认全部问题已修复（pass），或在有限轮次内**机械终止**——
收敛不依赖模型自觉；复评不得引用陈旧上下文，已修问题不得反复报回。

> 历史病根（需求来源）：① 每轮全量重扫 → 永远报新问题 → 永不收敛（收敛约束只存在于 user 级消息、system 权重压过 user）；
> ② 复评引用旧文件状态 → 已修问题反复报回。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-A1 | **工具面**：`advisor` 工具——`type`（code / design）· `paths[]` / `documents[]` / `batchDoc` / `object` / `async` 参数；工具声明 readonly + 副作用豁免。证据 = `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:187-188,211-230` | 参数形态可机判（enum / 数组）；空范围（code 无 paths / documents）→ 拒；design documents 须为文档（`isDocPath`） | 不做范围自动推断（paths 缺省回落 `_touchedFiles`——不遍历 git diff） |
| F-A2 | **轮次衰减**：评审系统提示按轮次确定性替换——round 1 全量评审；round 2 验 prior 为主 + 允许报明显新问题；round 3+ 严格只验 prior（`Do NOT look for new issues`）。证据 = `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:119-139` · `src/advisor/convergence.mjs:13,31,49-52` | 第 N 轮系统提示 = 对应轮次档（`advisor-round1/2/3.md` 硬加载——缺失即抛错）；轮次判定由运行状态位（`_advisorRound>0` 且存有 prior）决定，**零输出解析** | 不做 LLM 输出解析判状态；不做「每轮全量重扫」 |
| F-A3 | **机械 cap（code）**：代码评审 `MAX_ADVISOR_ROUNDS = 5`——第 6 次启动机械终止（不消耗 LLM），终止消息列未决问题 + 选项；design 评审豁免该 cap（轮次照增）。证据 = `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:37,92-98,141-142` · `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:260` | `_advisorRound >= 5` 再发起 → 返回 cap 消息（非评审文本）；design 请求不受该分支 | 不对 design 评审施加 cap |
| F-A4 | **会话隔离**：每轮评审 fresh session（`[system, user]` 重建）——旧轮 read 数据物理不在上下文；prior 仅以注入文本形式存在。证据 = `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:236,272,290-317` | 单轮会话不携带上轮工具尾；round 2+ 携带 prior 全文注入 | 不复用上轮会话上下文 |
| F-A5 | **证据机械校验（citations）**：模型引用的 `file:line` 逐条比对磁盘——白名单扩展名 + 内容匹配 + 路径围栏（`realpathSync` 后须在 cwd 内）；报告 `[host-verified] N/M citations match`。证据 = `src/advisor/citations.mjs:15,70,126` | 失真引用 → 失败清单可见；越界路径 → path traversal 判败 | 不做语义级正确性判定（只验「引文与磁盘一致」） |
| F-A6 | **失败护栏（六 kind）**：context_limit / turn_cap / timeout / empty / interrupted / review_failed——命中标记块首行前缀族；design 命中**一律不签发 token**。证据 = `src/advisor/compaction.mjs（W12 已迁核——现体见批次档 §5）:114-127` | 触发六类之一 → 报告携标记（固定字面）；design 请求不产出可用凭证 | 不把失败静默为通过 |
| F-A7 | **异步通道**：顶层缺省异步（ack 即回，settle → digest 自动送达）；池 4（`agent.poolLimits.advisor` 可配——非法回退 4）；同 type+scope 在跑 → 拒。证据 = `src/agent-tools/advisor-async.mjs:45,52,223` | ack 可解析（含 id）；settle 后 digest 注入；同域重复发起 → 明确拒绝串 | 不做轮询式 check（结果仅自动通道） |
| F-A8 | **冻结窗口（D5）**：评审点火 → 结算期间，被审面文件写入被预闸拦截（fail-closed——拒文含 `wait for the report, or cancel`）；下界 = 报告送达 / 取消·中止。证据 = `src/agent/tool-gates.mjs:105-110` | 窗口内写被审文件 → 拒绝串；窗口外写入 → 照常 | 预闸不可达面（bash / execute / git 三动作 / checkpoint）如实登记为残留——不虚称全覆盖 |
| F-A9 | **启动断言**：design 评审请求必须携带与本次 token 精确对应的 Approval Signal——缺失即拒绝启动（fail-closed，固定前缀 `ADVISOR_LAUNCH_REFUSAL_PREFIX`）。证据 = `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:45,151-163` | 伪造 / 缺失 Signal → 启动拒绝串；零发送 | 不放行无 Signal 的 design 评审 |
| F-A10 | **轮次重置语义**：无 prior 且本 run 未改代码 → 轮次归零（新周期完整预算）；本 run 改过代码 → **保留轮次**。证据 = `src/advisor/main.mjs（W12 已迁核——现体见批次档 §5）:254-267` | 改码后再评审 → 轮次不重置（收敛预算不可刷）；未改码 → 重置 | 不做无条件重置 |
| F-A11 | **guard 推回（可配，缺省 OFF）**：`advisor.guard=true` 且非工程模式且 depth0 且改码未评审 → 工具调用被推回（pushback < 3 且 round < 5）；FILE_MUTATORS 重置评审标记 | 开启 guard + 改码未评审 → 推回串；FILE_MUTATORS 触发重置 | 缺省 OFF；工程模式不适用 |
| F-A12 | **响应表纪律**：裁决表表头逐字 `\| # \| Action \| Detail \|`；Action 四值（Fixed / Dispatched / Not an issue / Deferred）——提示词纪律，**不驱动控制流**。证据 = `src/advisor/history.mjs（W12 已迁核——现体见批次档 §5）:8` | 输出含合规表头；机制层零表解析 | 不做表解析驱动逻辑 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-A1 | 收敛保证 | 有限轮内必然终止——双帽（轮 5 / turn 100）+ 六 kind 护栏 | `src/advisor/run.mjs（W12 已迁核——现体见批次档 §5）:37`（`MAX_ADVISOR_ROUNDS=5`）· `src/advisor/compaction.mjs（W12 已迁核——现体见批次档 §5）:16`（`MAX_ADVISOR_TURNS=100`） |
| N-A2 | 上下文预算 | limit = provider 窗口 × 0.8；压缩触发 = limit × 0.8；压缩保留 system + 末 20 条；工具结果截断 64K（头 60% + 尾 40% 双端保） | `src/advisor/compaction.mjs（W12 已迁核——现体见批次档 §5）:24-34` · `src/advisor/truncate.mjs` |
| N-A3 | 超时 | 单工具 30s；整场评审 600s（`agent.advisor.timeoutMs` 可覆盖，非法回退默认）；墙判定绑信号状态 | `src/advisor/compaction.mjs（W12 已迁核——现体见批次档 §5）:32-33` · `src/advisor/loop.mjs:98,112-118` |
| N-A4 | 评审对象稳定 | 评审对象由调用时显式传入（paths / documents / batchDoc）——不遍历 git diff | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:211-230` |
| N-A5 | 触发克制 | 评审在既有流程节点触发——不肆意扩大（用户裁定在案）；工具面空范围早退 | `src/agent-tools/advisor.mjs（W12 已迁核——现体见批次档 §5）:211-217` 区；设计档口径 |
| N-A6 | 可机判 | 评审链行为由用例断言（拒绝记账 / 护栏 / 预算 / 截断 / 池） | `test/advisor-chain-guards.test.mjs（W12 已退役——删除记录见批次档 §5）`（410 行）· `advisor-guard-completion.test.mjs`（325）· `advisor-refusal-accounting.test.mjs`（226）· `advisor-context-budget.test.mjs`（142）· `advisor-truncation.test.mjs`（89）· `portability-vsc-advisor-context.test.mjs`（111）· `wait-for-advisor-pool.test.mjs`（60） |

## 4. 对位与端差登记（对位 = `ADVISOR-CONVERGENCE（CLI 仓·需求）§1–§4`）

- 语义对位：收敛四件套（轮次衰减 / 机械 cap / 会话隔离 / 证据校验）+ 六 kind 护栏 + 异步池 + 冻结窗口 + 启动断言——逐条同源。
- 端差登记（本端实况，逐条）：
  1. 硬墙中止形态：本端中止返回 `interrupted` 字段（非抛错）——墙判定以信号状态为主判据（`ADVISOR-CONVERGENCE（本仓·设计）§13.6 / §13.10`）。
  2. 结算拒发不记账载体 = per-call `ctx._advisorRefused`（对端用 `agent._advisorRefusals` Set）——载体差异，语义零差（设计档 §16.1）。
  3. 冻结窗口实现点 = `src/agent/execute-tools.mjs`（单一预闸点——本端无独立 dispatch 模块）；事件面 = `_fileMutEvents`（设计档 §13.10）。
  4. 项目方法论指针 = **仅声明**（`advisor.standardsDoc`——硬探针已退役）；文档地图 = 声明优先 → 兜底链（设计档 §14 区）。
- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
