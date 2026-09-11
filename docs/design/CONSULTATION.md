# 会诊机制（Consultation）

> 板块：会诊。状态：**已实施 + 已异步化**（R17——2026-09-06）。
> 权威规格（现行）：`AGENT-LOOP.md` §25 D-R17a（会诊 digest 自动注入 / 跨回合后台 / `consult_check` 退役）。
> 与 VS Code 插件同源设计（`CONSULTATION（VSC 仓）`）——本文记录 CLI 端的实现与接线。
> 会诊（consult）与飞刀（escalate）是互补机制，见 `ESCALATE.md`。

> 需求层已迁出（2026-09-10 需求层拆分批）：本板块需求见 `../requirements/CONSULTATION.md`——本档保留设计+测试层。

## 2. 设计

### 2.1 架构与数据流

```
主 agent（turn 中，非阻塞）
  │  consult_start(problem) → 立即返回 { id, models }
  ▼
consult 会话（agent._consultSessions = Map<id, Session>，跨回合存活）
  ├─ 并发启动 N 个只读会诊子任务
  │    （独立 AbortController + 只读工具集 + main_history）
  ├─ 全 settle（pending=0）→ 会话升格完整 entry 移入 pending 单容器
  │    （_pendingAsyncResults +role "consult"——ASYNC-RESULT-CONTAINER.md D2）
  ▼
下回合 run 首行注入 digest：reminder + 逐条意见全文
  ▼
消化轮逐条判断处置（会诊 = 建议非门禁）
```

会诊 settle 在用户空闲时也触发消化轮（见 §2.2 消费驱动）。

### 2.2 R17 现行机制（digest 消费模型）

R17（2026-09-06）以 digest 自动注入取代旧的 `consult_check` 回合内轮询消费模型：

- **唯一消费通道 = digest 自动注入**；`consult_check` 工具已删除（描述零残留）。
- **settle 判定**：某 id pending=0（全部模型回复/失败 settle）→ 会话升格完整 entry
  （`{id, role:"consult", report, done:true}`——ASYNC-RESULT-CONTAINER.md D2）移入
  pending 单容器 `_pendingAsyncResults`（+role——原 `_pendingConsultResults` 独立族流退役）
  → 下回合（用户回合或 digest auto-turn）run 首行注入
  `[System reminder: consultation #id finished — N of M models replied (F failed)]`
  + 逐条意见全文（失败按 per-model 标注——部分/全失败同规则）。
- **部分 settle 不提前注入**——全 settle 才入 digest 流（意见全貌才可判断）。
- **消化轮动作域**：会诊 = 建议非门禁——消化指令语义 = "逐条判断采纳与否并处置"——
  **动作域按消费回合档位**（§17 D-S6/D-S7 既有规则）：用户回合/AUTO 档 = 正常决策域
  （写按档放行——手动档审批弹窗 / AUTO autoApprove）；手动档 auto-turn = **整理禁写**
  （同 advisor digest——无 "consult 可写" 例外）。
- **注入容量**：超长 → 既有 digest 截断/落盘机制（XML-escaped，>64K offload 预览 + 路径）。
- **`consult_stop` 保留为取消语义**：`{ abandoned, cancelled: true }`——已答部分丢弃、
  不入 pending；会话 settle 即移出 map。
- **消费驱动（评审 #2）**：digest auto-turn 驱动判据 = pending 单容器非空
  （`_pendingAsyncResults` 四族统一——2026-09-08 ASYNC-RESULT-CONTAINER.md D2）；
  挂起活度钩子 = running 会诊会话纳入 `poolLive`（consultRunningChildren）——空闲 settle
  也触发消化轮（T-R17j）。
- **每 consultant 活动块在 child settle 即冻结**（`⟦ev⟧done`——per-child key——不再经 check 消费冻结）。
- **`wait_for "consult done"` 条件保留**（会话 settle 即移出 map）。

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

**工具**（均在 `src/agent-tools/consult.mjs`）：

```
consult_start
  - problem (required): 问题简报——现象 + 失败轨迹概述 + 文件入口
    （原始报错无需粘贴——会诊子 agent 用 main_history 自行拉取）
  - models (optional): 子集选择器——["provider:model" | 裸 provider | 裸 model]
    （大小写不敏感），只从 agent.consultModels 里筛出子集跑；缺省/空 = 全池。
    选择器匹配不到任何池成员 → 报错并列出可选值
  → { id, models: ["deepseek:deepseek-v4-pro", ...] }   // 非阻塞

consult_stop
  - id (required): consult_start 返回的会话 id
  → { abandoned: <pending>, cancelled: true }
    // abort 剩余（terminated settle，计数不入队）；abandoned = 放弃时的 pending 数
  → 未知 id / 已结束或已取消 → { error: "unknown consult id" }
```

**main_history**（仅会诊子 agent 可用，readonly）：`limit`（默认 20，最大 100）→
主 agent 历史尾部窗口，多模态图片替换 `[image omitted]`、tool_calls 显形、60KB 字节预算。

**会话状态**：`Session = { controllers, replies, pending, waiters, failed, terminated,
stopped, total, received }`。settle 语义：正常回复入队；`session.stopped` 后被 abort 的
计 `terminated`（不入队）；报错计 `failed`（入队，带失败 note）。全失败时会话照常 settle
并注入 digest（失败按 per-model 标注）——不挂死。

**TUI 可观测**：每顾问一条活动卡，relay 前缀 `consult#<childRelayN>/` 复用 subagent
通道（relay 号非会话 id——会话自持 `_consultIdCounter`）；child settle 即冻结
（`⟦ev⟧done`），并行顾问互不覆盖。

### 2.4 CLI 实现接线

| 环节 | CLI |
|---|---|
| 子 agent 构建 | 显式 `createAgent({ provider, tools, config, cwd, memory, role: "consult" })` |
| 子任务 runner | `runAgent(child, input, childCallbacks, { depth: 1, maxTurns: consultTurns, signal })` |
| provider 解析 | `resolveChildProvider(parent, "provider:model")`（复用 subagent——跨 provider 候选） |
| 只读工具集 | `readonlyToolNames(agent.tools)` 过滤父工具集 + `main_history` |
| 系统 prompt | `role: "consult"` → `CONSULT_BASE`（setup.mjs base 分支——CLI `consult-base.md`） |
| effort 越界防护 | `clampEffort`——池 effort 越出该模型 `reasoningEffortEnum` → 整字段丢弃（防 candidate 开跑即死） |
| API key | `ensureChildApiKey`——缺 key 转清晰 failed reply（不裸 401） |
| 活动流上屏 | relay 前缀 `consult#<childRelayN>/` → TUI 子 agent 活动区块 |
| 工具注册 | setup.mjs depthOnly（depth 0 + consultModels 非空）注册 `consult_start`/`consult_stop` 两工具 |
| 会话收尾 | `cleanupConsultSessions`——仅 Ctrl+C / suspension abort 分支；标记 stopped + abort 清 map |
| 配置入口 | `/config` 命令（候选池增删改 + effort picker） |

### 2.5 受影响文件

| 文件 | 动作 |
|---|---|
| `src/agent-tools/consult.mjs` | 两工具 + main_history + 会话状态 + runConsultChild + settle→pending 单容器（升格完整 entry——ASYNC-RESULT-CONTAINER.md D2）+ cleanupConsultSessions |
| `src/agent/setup.mjs` | depthOnly 注册两工具 + role "consult" base prompt 分支 + `withPool` 候选池装饰 |
| `src/agent.mjs` | `CONSULT_BASE` 加载导出 + run 首行 consult digest 注入（含 digest 消费驱动的 pending 族推广） |
| `src/config.mjs` | DEFAULTS 加 consultModels/consultTurns/consultTimeoutMs + 校验（≤5、provider 存在） |
| `src/tui/suspension-drive.mjs` | 挂起活度判据（consultRunningChildren / poolLive）+ digest 触发判据推广 |
| `src/tui/cmd-config.mjs` | `/config` 候选池管理（增删改 + effort picker） |
| `src/prompts/consult-base.md` | 会诊子任务 prompt（只读约束 + main_history + 预算引导） |
| `src/prompts/discipline-normal.md`（旧 main.md 会诊条款——2026-09-10 PROMPT-SYSTEM 施工①随迁） | 主 agent 会诊条款（何时会诊 + 简报质量） |
| 测试 | consult 家族测试（会诊 settle 注入 / check 退役 / 取消 / 空闲 settle 消化——用例清单权威 = AGENT-LOOP.md §25.3 T-R17a..r） |

### 2.6 关键决策记录

- **判定归主 agent，工具零判定**：采纳与否在主 agent 的 turn 里用它的工具完成。
- **digest 自动注入取代 check 轮询（R17）**：发完会诊即可继续交互，判断性消费保留在
  消化轮；`consult_check` 退役。
- **只读会诊 + main_history**：会诊子 agent 不改文件；按需拉主会话历史。
- **跨 turn 生命周期**：回合尾不再清理，仅 Ctrl+C / 会话中止时 abort。
- **独立 consult role**：不复用 explore 身份——consult-base.md 作裸 prompt，不背编码
  纪律块；工具集只读过滤 + main_history。
- **CLI 复用 subagent 的 provider 解析**：`resolveChildProvider` 零新机制，跨 provider 候选天然支持。

## 3. 测试

会诊测试用例清单的权威 = **AGENT-LOOP.md §25.3**（T-R17a..r：会诊 settle 注入全文 /
check 退役（调 consult_check 工具不存在）/ 取消不入 pending / 空闲 settle 消化 /
部分 settle 不注入 / 超长注入截断落盘 / 注入一次竞态 / 手动档动作域零容忍等）。

**验收**（AGENT-LOOP §25）：T-R17a..p 双端绿 + consult 家族既有零回归。

## 变更记录

- 2026-08-16：立项实施（会诊三工具 start/check/stop + check 回合内轮询消费；0.12.30 随版发布）。
- 2026-08-30：会话级收尾与墓碑修复（会诊 4/4 收敛）；`consult_check` 加递增 `n` 协议参数。
- 2026-09-06：**R17 完全异步化**——`consult_check` 退役（digest 自动注入是唯一消费通道），
  跨回合后台 + digest auto-turn 消化，动作域档位制，挂起活度判据推广；机制正文整体收敛到
  本文 §2 当前态，check 时代接口契约与结算小节折叠为考古。
- 2026-09-07：DOC-REWRITE 批 A——可读化重写为当前态（多行 markdown，历史折叠为变更记录）。
