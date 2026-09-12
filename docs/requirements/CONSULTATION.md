# 会诊（CONSULTATION）— 需求（VSC 仓）

> 板块：会诊（多模型并行分析同一问题——VS Code 端实现）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`CONSULTATION（CLI 仓·需求）§1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见 `CONSULTATION（本仓·设计）`；权威源 = `src/agent-tools/consult.mjs`（475 行）+ `src/config-consult.mjs`（79 行）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题——为 VS Code 面板使用者与主 agent 提供多路独立意见。
工具只负责**编排与收集**——判定权完整归主 agent：它在消化轮里用已有工具逐条判断、采纳或否决（会诊 = 建议非门禁）。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-S1 | **非阻塞发起**：`consult_start(problem)` 立即返回 `{ id, models }`——会诊会话沿共享 depth-0 `history._consultSessions` 存活（agent per-run 重建不丢）。证据 = `src/agent-tools/consult.mjs`（`_consultSessions` 载体）· `CONSULTATION（本仓·设计）§2.3` | 发起即回（不阻塞回合）；返回含可解析 id + 实际参战模型清单 | 不做回合内轮询消费 |
| F-S2 | **取消语义**：`consult_stop(id)` abort 剩余子任务（terminated settle——计数不入队）；回复丢弃不可达——**取消不产 digest**；未知 id → `{ error: "unknown consult id" }`。证据 = `src/agent-tools/consult.mjs:346,468` | stop 后会话弃、零 digest；未知 id 明确报错 | 不做「部分取回已回完的回复」 |
| F-S3 | **digest 自动注入为唯一消费通道**：全 settle（pending=0）→ 会话移入 `history._pendingConsultResults` → 下回合 run-start 首行注入（System reminder + 逐条意见全文；XML 转义；超长走落盘 + 预览）。证据 = `src/agent-tools/consult.mjs:194-220`（park "always"） | 全 settle 才注入；部分 settle 零注入；注入一次即消费（splice——单注入点） | `consult_check` 已退役——无轮询通道（R17） |
| F-S4 | **只读会诊 + main_history**：会诊子代理只读；`main_history`（limit 默认 20 / 最大 100；图片 `[image omitted]`；60KB 字节预算）按需拉主会话失败轨迹（证据 = 失败轨迹原文，非二手复述）。证据 = `src/agent-tools/consult.mjs`（makeMainHistoryTool） | 会诊子代理写路径全部被拒；main_history 输出含截断注明 | 不做「会诊子代理改文件」；不做模型间交叉通信 |
| F-S5 | **跨回合生命周期**：普通回合收尾**不再清理**会诊会话（与 async 子代理同规则）；仅 Ctrl+C / 会话中止时 abort（cleanupConsultSessions）；空闲 settle（池 live）也触发消化轮。证据 = `src/extension/suspension.mjs:48,260,307` | 回合尾闲置不杀会诊；会话中止 → 全 abort；空闲 settle → 消化轮驱动 | 不在回合尾清理（R17 前语义已废） |
| F-S6 | **候选池契约**：`agent.consultModels`（`{ provider, model, effort? }`，≤5）；缺省空 = 会诊未启用（工具不注册）；`models` 子集选择器（大小写不敏感；匹配不到 → 报错列可选值）。证据 = `src/agent-tools/consult.mjs:397-400` · `src/config-consult.mjs` | 池 >5 → 明确错误；空池 → 工具不可见；子集选择器行为可机判 | 不做模型间自动回退；不做池外模型 |
| F-S7 | **面板可见性（本端特有）**：每 consultant 一条活动块（`sub:consult` 事件）+ 回复预览（≤8KB）随 answered 事件带出；冻结入流同 subagent / escalate / advisor。证据 = `test/activity-flow.test.mjs:340-347` | answered 事件驱动块终态；回复预览随事件呈现 | 不改冻结入流机制本体 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-S1 | 成本与预算 | 每顾问工具轮数预算 `consultTurns`（默认 40）+ 墙钟看门狗 `consultTimeoutMs`（默认 600000ms = 10min）；超时按模型标注（`timed out after Nmin`） | `src/agent-tools/consult.mjs:226,300` · `src/agent/setup.mjs:243-244` |
| N-S2 | 工具侧零判定 | 会诊 = 建议非门禁；手动档 auto-turn 注入内 `consult_start` 被机械拒绝（`cannot start consultations from a manual auto-turn`）——`consult_stop` 保留放行（控制类豁免） | `src/agent-tools/consult.mjs:391` 区 |
| N-S3 | 失败不挂死 | 全失败会话照常 settle 并注入 digest（失败按 per-model 标注）——stop / 看门狗都不让主 agent 挂死 | `src/agent-tools/consult.mjs:333` 区 |
| N-S4 | 跨端一致 | 与对端同款语义（编排与收集 / 只读 / digest 唯一通道 / 池 ≤5）；各端独立实现 | 对位档 §1；端差登记 = 本档 §4 |

> **机制实况注（发现即报）**：本仓 `test/` 内 `consult_start|consult_stop|_consultSessions|runConsultChild` 直引零命中（as-of 2026-09-12）——
> 核心流程专属用例缺口如实登记；既有间接回归面 = `test/config-softfail.test.mjs`（池清洗 + 级联清理）· `test/activity-flow.test.mjs`（活动块）· `test/agent-lifecycle-singleton.test.mjs`（字段装配）。

## 4. 对位与端差登记（对位 = `CONSULTATION（CLI 仓·需求）§1`）

- 语义对位：一句话 / 两工具面（start + stop）/ 只读 + main_history / 跨回合生命周期 / 池 ≤5 / 范围边界——逐条同源。
- 端差登记：本端呈现面 = 面板活动块 + 回复预览（对端 = TUI 呈现）；配置读写入口 = Settings 面板（对端 = `/config`）；机制语义同源。
- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
