# 父侧观察 / 注入运行中子代理（VSC 端）

> 板块：Agent 循环 · 子代理运行时观测与控制。状态：**设计（待评审）**——2026-09-08 用户需求点。CLI 同名对应（SUBAGENT-OBSERVE-SEND.md CLI 端）——同一机制各自独立实现。
> 背景：父 agent 对运行中异步子代理只看到 turn/touchedFiles（status），看不到中间——eng-coder 跑很久看不出是否死循环（用户实测，VSC 端）。用户端 VSC 面板本已实时显示子代理流（webview activity `sub:role#id` 块）——核心缺口在父模型侧。
> 范围（用户裁定）：父侧 `subagent` 加 **observe**（查进度）+ **send**（注入引导）；双端各自独立文档同一机制；不做 UI 直连。

## 1. 需求

### 总体
给父 agent 对运行中异步子代理的**运行时观测与轻量引导**——治"父看不到中间瞎猜 + 无法中途引导"，不改变子代理隔离模型。

### 功能性需求
- **F1（observe）**：父 agent 按 id 查 running 异步子代理的 recent-activity 快照（最近 **5 条**回合摘要 + 当前工具 + turn/touched），判断是否推进 vs 卡死。
- **F2（send）**：父 agent 向 running 异步子代理发消息，子代理下回合边界作普通 user 输入消费——给纠结/跑偏的子代理引导方向。
- **边界**：只对异步池中未 settle 子代理；sync/已 settle/cancel 不可 send；observe 可查 running/queued/done。注入 = 普通用户回合，不等同偏离豁免，子内部收敛纪律不变。

### 非功能性需求
- N1 回合错位：父只在自身回合内能调 observe/send。
- N2 隔离不破坏：observe 返摘要非全量；send 经子回合边界注入不打断其正在跑的工具。
- N3 凭证纪律不变：不读写 token/designId（DESIGN-TOKEN-SETTLEMENT 语义）。
- N4 双端一致：CLI/VSC 同机制语义各自实现。

## 2. 设计（VSC 端落地）

### 现状（explore 核实）
- VSC `subagent` 动作：`src/agent-tools/subagent-actions.mjs` status(:87) 只给决策字段；无 panel 动作（AC-P4）。子代理回调经 `subagent.mjs:305-397 runChild` → webview activity。
- VSC child 历史在 runChild 闭包 `sink.history`（`subagent.mjs:389-393`），`setup.mjs:343` 只 depth0 挂 `_fullHistory`——**父进程内可达 sink.agent/sink.history，但薄、无工具暴露**。
- 子代理只收 spawn task，无外部输入。父 `pendingInput` 语义同 CLI 可镜像。
- **VSC 有 stateSink 模式先例**（runChild 已把 onAgentTurn/输出回调注入子 runAgent）——send 的输入源贯通可顺延该模式，比 CLI 顺。

### D1 observe 从 sink 拉摘要
- `subagent-actions.mjs` 加 `observe`：按 id 定位池条目 → 从 `entry.childAgent`/`sink.agent` 或其 history 取最近 N 条回合摘要 + 当前工具 + turn/touched + status。
- 返回摘要（非全量）——N2。
- 落点：`subagent-actions.mjs` + subagent 工具 schema 描述加 observe。

### D2 send 写注入队列 + 子回合边界消费
- 池条目加 `entry._injected = []`；`send` 动作 push（仅 running 异步可 send）。
- 子侧输入源贯通：仿现有 stateSink——把"注入队列消费回调"作为新回调传给子 runAgent（runChild childOpts），子 turn 循环头消费 `_injected` → pushReal 成 user 回合进子历史 → 子作普通指令。
- 落点：`subagent-actions.mjs`（observe+send）、`subagent.mjs` runChild（stateSink 扩注入）、子 runAgent 回合边界。

### D3 父子回合错位
- observe/send 父回合内调；目标父回合内可见未 settle 异步子代理。父空闲等子时不可达（同 cancel 时序）。不引入子代理主动推送/后台定时。

### D4 双端一致
- 同 CLI 机制语义独立实现。

## 3. 受影响文件（VSC，thincoder-vscode）

- 修改：`src/agent-tools/subagent-actions.mjs`（observe+send）、subagent 工具描述/schema、`src/agent-tools/subagent.mjs` runChild（stateSink 扩注入队列消费入口）、子 runAgent 回合边界消费
- 文档：本设计 + README 地图登记 + AGENT-LOOP.md 子代理 §

## 4. 验收

AC1 = observe 对 running 异步子代理返回最近 N 条回合摘要+当前工具+turn/touched（非全量）；AC2 = send 对 running 入队，子下回合边界收到作普通 user 指令处理；AC3 = send 对 sync/settled/未知 id 明确错误；AC4 = 凭证纪律不变；AC5 = 双端语义一致。

## 测试用例表

| 用例 | 输入/场景 | 预期输出 | 对应 |
|---|---|---|---|
| 正常 observe | running async 上查 id | 摘要+当前工具+turn/touched | AC1 |
| 正常 send | running async 上 send | 入队确认；子下回合收到并响应 | AC2 |
| 边界 observe done/queued | settled/queued 查 | 可查（done 终报/queued 占位） | AC1 |
| 边界 父非回合中调 observe/send | 父空闲等子（非回合内） | 不可达/明确行为（父回合外无法执行工具） | N1 |
| 凭证纪律 | send 触达子代理全程 | 不读写 token/designId（DESIGN-TOKEN-SETTLEMENT 语义保持） | AC4/N3 |
| 双端一致 | CLI/VSC 对照 | 同机制语义各自实现，契约措辞单源 | AC5/N4 |
| 边界 send settled/cancel | settled send | 明确错误 | AC3 |
| 边界 send sync | sync send | 明确错误 | AC3 |
| 错误 send 未知 id | 不存在 | 明确错误 | AC3 |
| 隔离 | observe 超上限 | 截断（不灌全量） | N2 |

## 变更记录
- 2026-09-08：立项。用户实测（eng-coder 父看不到进度）+ 用户裁定（父侧、双功能、注入=普通指令）+ explore 前置调研（sink.agent 源 / stateSink 先例可顺延注入贯通）。
