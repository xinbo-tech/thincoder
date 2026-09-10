# SUBAGENT-OBSERVE-SEND — 需求

> 板块：子代理观测/注入（父侧 observe 查进度 + send 注入引导）。需求层文档（docs/requirements/）。
> 状态：已实现（VSC 同名对应）。
> 来源：2026-09-10 自 `../design/SUBAGENT-OBSERVE-SEND.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

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
