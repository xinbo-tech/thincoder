# 会诊机制（Consultation）

> 板块：会诊。状态：**已实施 + 已异步化**（R17——2026-09-06）。本文件为**已完成专题的当前态记录**——
> 记录会诊机制（含 `main_history` 只读拉取面）在 VS Code 端的现行实现与接线。
> 权威源（现行语义/用例/验收）：VSC `AGENT-LOOP.md` §9（会诊/飞刀/advisor 完全异步化——ARCHITECTURE
> §8.5 迁出，R17 VS Code 镜像）+ CLI `AGENT-LOOP.md` §14.1（会诊 R17 异步化）与 CLI `CONSULTATION.md`（F/D/T/AC——本文件不复制正文）。
> 与 CLI 端同源（`CONSULTATION（CLI 仓）`）；会诊（consult）与飞刀（escalate）
> 互补，飞刀见 `ESCALATE.md`。
> 本文件已由 as-of 快照流水重写为当前态记录（历史实现/整改流水见文末「变更记录」）。

## 1. 需求

**一句话**：可配置多模型并行会诊，主 agent 收到全量意见 digest 后自行判断与验证。

### 行为

遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题。
工具只负责**编排与收集**，判定权完整归主 agent——它在消化轮里用已有工具
（bash / verify / read / 推理）逐条判断、采纳或否决。

- **两个工具**：`consult_start`（非阻塞发起）→ `consult_stop`（取消仍在跑的会诊——弃回复不入 digest）。
  `consult_check` 已退役（R17 决策点 ①）——**digest 自动注入是唯一消费通道**。
- **会诊子 agent 只读**，`main_history` 按需拉取主会话失败轨迹（readonly，`limit` 默认 20 最大 100）。
- **生命周期跨 run**：会诊会话沿共享 depth-0 `history._consultSessions` 存活——普通回合收尾不再清理，
  仅 Ctrl+C / 会话中止时 abort（cleanupConsultSessions）。
- **候选池**：`agent.consultModels`（`{ provider, model, effort? }`，≤5），缺省空数组 = 会诊未启用。

### 范围边界（不做）

工具内置自动验证、模型间交叉通信、会诊子 agent 改文件、部分 settle 提前注入
（**全 settle 才入 digest 流**——T-R17k（引例：CLI 仓用例编号，本仓不在册））。

## 2. 设计

### 2.1 架构与数据流

```
主 agent（turn 中，非阻塞）
  │  consult_start(problem) → 立即返回 { id, models }
  ▼
consult 会话（history._consultSessions = Map<id, Session>，跨 run 存活）
  ├─ 并发启动 N 个只读会诊子任务
  │    （独立 AbortController + 只读工具集 + main_history + effort/墙钟看门狗）
  ├─ 全 settle（pending=0）→ 会话移入 history._pendingConsultResults（独立族流）
  ▼
下回合 run-start 首行注入 digest：System reminder + 逐条意见全文
  ▼
消化轮逐条判断处置（会诊 = 建议非门禁；手动档禁写禁 spawn——T-R17p 零例外）
```

会诊 settle 在用户空闲时也触发消化轮（suspension 驱动判据 = 任一 pending 族非空——T-R17j（引例：CLI 仓用例编号，本仓不在册））。

### 2.2 R17 现行机制（digest 消费模型）

- **唯一消费通道 = digest 自动注入**；`consult_check` 工具已删（描述零残留，stall 免检分支随删）。
- **settle 判定**：某 id pending=0（全部模型回复/失败/超时 settle）→ 会话移入
  `history._pendingConsultResults`（独立流，与 subagent/advisor/escalate 族互不干扰）→
  下回合（用户回合或 digest auto-turn）run-start 首行注入
  `[System reminder: consultation #<id> finished — N replies received (F failed / M models):` + 逐条全文
  （XML-escaped；超长走 `offloadToolResult` 落盘 + 预览路径）。
- **部分 settle 不提前注入**——全 settle 才入 digest 流（意见全貌才可判断）。
- **消化轮动作域**：会诊 = 建议非门禁——消化指令语义 = "逐条判断采纳与否并处置"——
  动作域按消费回合档位（§17 D-S6/D-S7 既有规则）：手动档 auto-turn 注入 `AUTO_TURN_DIGEST_DOMAIN`
  禁写禁 spawn（同 advisor/escalate digest——**无 "consult 可写" 例外**）；AUTO 档全语义推进。
  机械拒绝：手动档 auto-turn 内 `consult_start` execute 门拒绝（`cannot start consultations from
  a manual auto-turn`）；`consult_stop` 保留放行（控制类豁免）。
- **`consult_stop` = 取消语义**：abort 剩余子任务，`terminated` settle（计数不入队）、会话弃——
  不入 pending（T-R17c（引例：CLI 仓用例编号，本仓不在册））；已回完的回复丢弃不可达（取消不产 digest）。
- **子代理信号**：`sessionSignal ?? turn signal`——会话 Stop 逐链中止；interrupt（Ctrl+I——停回合
  续跑）不逐链中止在飞会诊（F2 同款豁免——否则意见丢为失败注记 + 噪音 digest）。
- **等待/活度**：`wait_for "consult done"` 条件保留（会话 Map 沿 history 读）；suspension 驱动
  poolLive 含 running 会诊会话——空闲 settle 也触发消化轮。
- **面板可见性**：每 consultant 一条活动块（`onSubagent` 事件，role `consult`），回复预览随
  answered 事件带前 8KB；R22 冻结入流同 subagent/escalate/advisor 机制。

### 2.3 工具契约

**config（`~/.thincoder/config.json`）**：

```jsonc
"agent": {
  // 候选池——会诊与飞刀共用（上限 5；缺省空数组 = 未启用）
  "consultModels": [
    { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" },
    { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "max" }
  ],
  "consultTurns": 40,        // 每个顾问的工具轮数预算（15 曾致读文件途中撞墙）
  "consultTimeoutMs": 600000 // 墙钟看门狗（10 分钟；turn 上限只数 LLM 响应，不数慢工具）
}
```

**工具**（均在 `src/agent-tools/consult.mjs`（W12 已迁核——现体见批次档 §5））：

```
consult_start
  - problem (required): 问题简报——现象 + 失败轨迹概述 + 文件入口
    （原始报错无需粘贴——会诊子 agent 用 main_history 自行拉取）
  - models (optional): 子集选择器——["provider:model" | 裸 provider | 裸 model]
    （大小写不敏感），只从 agent.consultModels 里筛出子集跑；缺省/空 = 全池。
    选择器匹配不到任何池成员 → 报错并列出可选值
  → { id, models: ["deepseek:deepseek-v4-pro", ...] }   // 非阻塞，立即返回

consult_stop
  - id (required): consult_start 返回的会话 id
  → { stopped: <aborted 数>, cancelled: true }
    // abort 剩余子任务（terminated settle——计数不入队）；回复丢弃——不产 digest
  → 未知 id → { error: "unknown consult id" }
```

**main_history**（仅会诊子 agent 可用，readonly）：`limit`（默认 20，最大 100）→ 主会话尾部窗口，
多模态 base64 图片替换 `[image omitted]`、tool_calls 显形（name + args 截 200 字符）、
60KB 字节预算（超出截尾注明）——见 `consult.mjs makeMainHistoryTool`。

**会话状态**：`Session = { id, controllers, replies, pending, failed, terminated, stopped,
received, total, models }`。settle 语义：正常回复入队；`session.stopped` 后被 abort 的计
`terminated`（不入队）；报错/超时计 `failed`（带失败/`timed out after Nmin` note）。全失败时
会话照常 settle 并注入 digest（失败按 per-model 标注）——`consult_stop`/看门狗都不让主 agent 挂死。

### 2.4 端级实现接线

| 环节 | VS Code |
|---|---|
| 子 agent 构建 | `runConsultChild`——`buildProvider` + effort 钳制（越 `reasoningEffortEnum` 整字段丢弃——防 candidate 开跑即死） |
| 子任务 runner | `runAgent(child, problem, childCallbacks, { depth: 1, maxTurns: consultTurns, signal })` |
| 只读工具集 | setup.mjs role 过滤（depth>0 且 role `consult` → 只读）+ `main_history` 经 `opts.extraTools` 注入 |
| 系统 prompt | role `"consult"` → `consult-base.md` 底座（瘦——不背主 agent system.md 人格/工具引用） |
| 工具注册 | setup.mjs：`consultModels` 非空即注册 `consult_start`/`consult_stop`（与会诊同条件）——空池不注册 |
| 会话跨 run 容器 | `history._consultSessions`（`_asyncSubagents` 同款载体——agent per-run 重建） |
| settle → digest | 全 settle park `history._pendingConsultResults` → agent.mjs run-start 注入（splice 即 consumed——单注入点） |
| 驱动/中止 | extension/suspension.mjs poolLive + 消化判据推广；`cleanupConsultSessions`（普通回合收尾不再 abort——仅中止分支） |
| 面板 | `onSubagent` consult 事件 → R22 底部活动面板/冻结入流（回复 preview ≤8KB） |
| 配置入口 | Settings 面板（`src/config-io.mjs`（W16 已迁核收口——现体见批次档 §5）默认/透传 consultTurns/consultTimeoutMs/consultModels） |

### 2.5 关键决策记录

- **判定归主 agent，工具零判定**：采纳与否在主 agent 的 turn 里用它的工具完成。
- **digest 自动注入取代 check 轮询（R17）**：发完会诊即可继续交互，判断性消费保留在消化轮；
  `consult_check` 退役——无轮询、无挂起、无 stall 误报。
- **只读会诊 + main_history**：会诊子 agent 不改文件；按需拉主会话历史（证据 = 失败轨迹原文，非二手复述）。
- **跨 run 生命周期**：回合尾不再清理（与 async 子代理同规则），仅中止时 abort。
- **独立 consult role**：不复用 explore 身份——consult-base.md 作裸底座，工具集只读 + main_history。
- **部分 settle 不提前**：意见全貌才可判断——全 settle 一次注入。
- **成本**：effort 显式落盘（panel 选模型填官方默认档，可改）；非思考模型 null；越枚举整字段丢弃。

## 3. 测试

会诊测试用例清单的权威 = **AGENT-LOOP（CLI 仓·设计）§25**（T-R17a..p（引例：CLI 仓用例编号，本仓不在册）：会话 settle park / digest 注入全文 /
check 退役（调 consult_check 工具不存在）/ 部分 settle 不注入 / stop 弃不入 pending / 空闲 settle
消化 / 超长注入落盘 / 注入一次竞态 / 手动档动作域零容忍 / 双族隔离 / 中止语义等——VS Code 镜像）。

**验收**（AGENT-LOOP §25）：T-R17a..p 双端绿 + consult 家族既有零回归（T-R17a..p = 引例：CLI 仓用例编号，本仓不在册）。

## 变更记录

- 2026-08-16：立项实施（三工具 consult_start/check/stop + check 回合内轮询消费 + `main_history` +
  独立 consult role + effort 注入 + 墙钟看门狗；0.1.23 随版发布）。元会诊三批整改（terminated 不入队、
  墙钟/撞墙调参、面板三态 + 回复预览、独立 role、机制化触发）已合入上文现行语义。
- 2026-09-06：**R17 完全异步化**——`consult_check` 退役（digest 自动注入唯一消费通道），跨 run 后台 +
  digest auto-turn 消化，动作域档位制，挂起活度判据推广；机制正文收敛为本文件 §2 当前态。
- 2026-09-08：DOC-REWRITE-VSC 批 V4——从 as-of 快照流水重写为当前态记录（多行 markdown，历史折叠本段）。
