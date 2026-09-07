# 父侧观察 / 注入运行中子代理（CLI 端）

> 板块：Agent 循环 · 子代理运行时观测与控制。状态：**设计（待评审）**——2026-09-08 用户需求点。
> 背景：父 agent 对运行中异步子代理（eng-coder/explore 等）只能看到 turn 数 + touchedFiles（`subagent status`），看不到中间（在读啥/改啥/卡在哪）——eng-coder 跑 65 分钟看不出是否死循环（用户实测触发）；也无法中途给纠结的子代理传话引导。用户端（CLI TUI / VSC 面板）本已实时看到子代理输出——**核心缺口在父模型侧**。
> 范围（用户裁定）：功能 = 父侧 `subagent` 加 **observe**（查进度）+ **send**（注入引导）两动作；双端（CLI/VSC）各自独立文档同一机制。用户可注入也通过父侧，不做 UI 直连。

## 1. 需求

### 总体
给父 agent 对运行中异步子代理的**运行时观测与轻量引导**能力——治"父看不到中间瞎猜 + 无法中途引导"，不改变子代理隔离模型（中间内容仍不进父上下文，按需拉取）。

### 功能性需求
- **F1（observe 查进度）**：As a 父 agent, I want to query a running async subagent by id for its recent-activity snapshot (最近 N 条回合/动作摘要 + 当前工具 + turn/touched), so that I can judge whether it is progressing vs stuck without guessing.
- **F2（send 注入引导）**：As a 父 agent, I want to send a message to a running async subagent, which it consumes as an ordinary input at its next turn boundary, so that I can give it direction when it is stuck/off-course.
- **边界**：只对**异步池中未 settle** 的子代理（父自身 spawn 的 async 子代理）；sync/阻塞子代理（父在等、无法中转）与已 settle/已 cancel 的不可 send。observe 可查 running/queued/done 任意。注入不等同偏离豁免——子代理按普通用户回合接收，其内部收敛/审计纪律不变。

### 非功能性需求
- N1（回合错位）——父只在自身回合内能调 observe/send；异步子代理后台跑时父回合外——observe/send 的目标是"父回合内可见的、未 settle 的异步子代理"（AUTO 或父挂起被唤醒时）。
- N2（隔离不破坏）——observe 返回摘要（非全量）进父上下文，不把子代理每 token 噪音灌入（那正是隔离要防的）。send 消息经子回合边界注入，不打断其正在跑的工具。
- N3（凭证纪律不变）——token/designId 只进槽文件（DESIGN-TOKEN-SETTLEMENT 语义），observe/send 不读写凭证。
- N4（双端一致）——CLI/VSC 同机制语义，各自独立实现。

## 2. 设计（CLI 端落地）

### 现状（explore 核实）
- `subagent` 工具动作执行器 `src/agent-tools/subagent-actions.mjs`；status(:74/:90) 只给决策字段，无内容。panel(:233) 仅 CLI 镜像 UI 块。
- 子代理中间内容进程内可达：`entry.childAgent`（`subagent-run.mjs:111`）含 `child._fullHistory`（回合累积）、`child._capturedOutput`、`child._touchedFiles`——**父侧同进程可达，但无任何工具暴露**。
- 子代理只收 spawn task；无运行时外部输入。父主会话有 `pendingInput` 单槽攒批语义（AGENT-LOOP §9.2/§11.3——回合空闲把外部消息合并注入）——可镜像到子级。
- **硬缺口**：子代理 runAgent 今日不知自己的池条目——childOpts 未携带 entry 引用，注入要在回合边界消费队列需先把输入源贯通进 runAgent opts。

### D1 数据源：observe 从 entry.childAgent 拉摘要
- `subagent-actions.mjs` 加 `observe` 动作执行器：按 id 定位池条目 → 从 `entry.childAgent` 取最近 N 条**已落回合**摘要（工具调用/关键动作）+ `_touchedFiles` + 当前回合 turn/maxTurns + status + **in-flight 当前工具**（评审 #1——读 child 进行中 dispatch/工具状态，非只读已落 history：卡在长工具调用时 history 无新回合，恰是 observe 要检测的卡死态，须从 dispatch 层读）。
- 返回**摘要**（每回合首行/工具名 + 当前工具，非全量）——N2 隔离。条数上限（默认最近 ~5 回合摘要，可参数）。
- 落点：`subagent-actions.mjs`（新 observe 分支）+ 动作 schema（subagent 工具描述加 observe）+ 可能的 `entry.childAgent` 访问收口 helper。

### D2 注入通道：send 写 entry 队列 + 子回合边界消费
- 池条目加注入队列：`entry._injected = []`（父 send 写入）。
- `subagent-actions.mjs` 加 `send` 动作：按 id 定位 → push 消息进 `entry._injected`（仅 running 异步可 send；settle/cancel/unknown → 明确错误）。返回已入队确认。
- **动作门禁分类（评审 #2）**：observe = **readonly**（查询不副作用）；send = **控制类豁免**（同 cancel/panel——写入子输入队列属父对子轻量引导，非产品代码写，不需 approval 门；父回合内显式调用即授权）。写 AGENT-LOOP §7.2 动作表时注明两分类。
- **send→settle 竞态（评审 #3）**：消息入队后子代理在下一回合边界前 settle → 消息未投递——send 返回时无法预知；settle 收尾时若有未消费 `_injected` → 附入 settle 报告/错误提示（"N 条注入未投递"），防父误以为引导已落地。
- **子侧输入源贯通（硬缺口）**：runAgent 需能读到注入队列——仿 VSC stateSink 模式，把"注入队列消费回调"塞进子 runAgent opts（childOpts 加字段），子 turn 循环头（`agent.mjs` 每轮开头，父消费 pendingInput 的同类点）消费 `entry._injected` → `pushReal` 成 user 回合进子历史 → 子 agent 当作普通指令处理。
- 落点：`subagent-actions.mjs`（send + observe）、`agent-tools/subagent-run.mjs`/`spawn-child`（childOpts 贯通 entry）、`agent.mjs`（子回合边界消费注入点）。

### D3 父子回合错位（N1）
- observe/send 由父在自身回合内调用；目标是父回合内可见的异步子代理。父回合外（父空闲等子代理时）父无法执行工具——observe/send 自然不可达（与 cancel 同时序约束）。AUTO/digest 唤醒父回合时可查。
- **不引入**子代理主动推送或后台定时（那会破坏隔离 + 灌噪音）。

### D4 双端一致（N4）
- CLI/VSC 各自独立实现同一机制：observe（父拉摘要）+ send（父写注入队列 + 子回合边界消费）。

## 3. 受影响文件（CLI，thincoder）

- 修改：`src/agent-tools/subagent-actions.mjs`（observe + send 动作执行器）、subagent 工具描述/schema（加两动作 + §4.1 分类）、`src/agent-tools/subagent-run.mjs` / `spawn-child`（childOpts 贯通 entry——send 消费入口）、`src/agent.mjs`（子回合边界消费注入点）
- 文档：本设计（CLI 细节/机制）+ README 地图登记 + **AGENT-LOOP.md §7.2 动作表加 observe/send（含两动作分类 + 契约——单一权威源，本设计不复述契约措辞——评审 #6 防双源漂移）**

## 4. 验收

AC1 = observe 对 running 异步子代理返回其最近 N 条回合摘要 + 当前工具 + turn/touched（非全量——隔离保持）；AC2 = send 对 running 异步子代理入队，子代理下回合边界收到并作普通用户指令处理（回合历史出现该 user 消息 + 子代理后续动作响应）；AC3 = **send** 对 sync 子代理 / settled / 未知 id 返回明确错误（不可达）；**observe 对 running/queued/done 均可查**（done 终报 / queued 占位）；AC4 = 凭证纪律不变（不读写 token/designId）；AC5 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 observe | running 异步 eng-coder 上查 id | 返回最近 N 条回合摘要 + 当前工具 + turn/touched | AC1 |
| 正常 send | running 异步 explore 上 send "看 X 别卡 Y" | 入队确认；子下回合收到该 user 消息并响应 | AC2 |
| 边界 observe done/queued | 已 settle 子代理查 observe | 可查（status 同——done 有最终报告，queued 未启动占位） | AC1 |
| 边界 send 给 settled/cancel | 已 settle 子代理 send | 明确错误（不可注入） | AC3 |
| 边界 send 给 sync | sync 子代理 send | 明确错误（父在等不可中转） | AC3 |
| 错误 send 未知 id | 不存在 id | 明确错误 | AC3 |
| 隔离 | observe 返回条数超上限 | 截断到上限（不灌全量） | N2 |

## 变更记录
- 2026-09-08：立项。用户实测触发（eng-coder 65 分钟父看不到进度）+ 用户裁定（两功能都做、父侧、注入=普通指令不纠结纪律）+ explore 前置调研（entry.childAgent 富源 / pendingInput 可镜像 / childOpts 缺 entry 引用硬缺口）。
