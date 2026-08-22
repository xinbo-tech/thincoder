# 会诊机制（Consultation）— 需求与设计（CLI）

> 状态：**已实施**（2026-08-16，commit 596a69f；0.12.30 随版发布）。与 VS Code 插件同源设计（`thincoder-vscode/docs/design/CONSULTATION.md`），本文件记录 CLI 端的实现差异与接线。
> 一句话：可配置多模型并行会诊，主 agent 逐个读回复、自行判断与验证，觉得够了就早停其余。

---

## 1. 需求（与插件一致）

遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题。主 agent **逐个读取先返回的回复，自己判断、自己验证**（用已有的工具：bash / verify / read / 推理），一旦认定某份回复足够好，立即终止其余仍在执行的会诊。工具只负责**编排与收集**，判定权完整归主 agent。

- **三个工具**：`consult_start`（非阻塞发起）→ `consult_check`（读下一个先到的回复）→ `consult_stop`（早停其余）。
- **会诊子 agent 只读**，`main_history` 按需拉取主会话失败轨迹。
- **生命周期绑定 turn**：turn 结束（runAgent finally）清理残留会诊。
- **候选池**：`agent.consultModels`（`{ provider, model, effort? }`，≤5），缺省空 = 未启用。

**范围边界（不做）**：工具内置自动验证、模型间交叉通信、会诊子 agent 改文件、批量收齐再返回。

---

## 2. 设计

### 2.1 架构与数据流

```
主 agent（turn 中，非阻塞）
  │ consult_start(problem) → 立即返回 { id, models }
  ▼
consult 会话（挂在 agent._consultSessions = Map<id, Session>，turn 结束清理）
  ├─ 并发启动 N 个会诊子任务（独立 AbortController + 只读工具集 + main_history）
  ├─ 子任务回复流进会话的 reply 队列
  │
主 agent 继续自己的 turn：
  │ consult_check(id) → await「下一个」先到的回复 → { reply, received, total, done }
  │   → 主 agent 读回复，用自己的工具判断与验证
  │   → 不够 → 再 consult_check；够了 → consult_stop(id) → abort 剩余
  ▼
主 agent 采纳，继续完成任务
```

### 2.2 CLI 与插件的实现差异

插件端 `runAgent(provider, cwd, input, callbacks, signal, getAuto, opts)` 内部自建 agent；CLI 端 `runAgent(agent, input, callbacks, opts)` 要求**显式构造 agent 对象**。移植的对应关系：

| 环节 | 插件（vscode） | CLI |
|---|---|---|
| 子任务 runner | `runner({...provider, model}, cwd, task, callbacks, signal, true, opts)` | `runAgent(child, input, childCallbacks, { depth:1, maxTurns, signal })` |
| 子 agent 构建 | runAgent 内部 `createAgent` | 显式 `createAgent({ provider, tools, config, cwd, memory, role:"consult" })` |
| provider 解析 | `buildProvider(m.provider)` | `resolveChildProvider(parent, "provider:model")`（复用 subagent） |
| 只读工具集 | `builtinTools.filter(readonly)` | `readonlyToolNames(agent.tools)` 过滤父工具集 + `main_history` |
| 系统 prompt | `role:"consult"` → `_CONSULT_BASE` | `role:"consult"` → `CONSULT_BASE`（setup.mjs base 分支） |
| 活动流上屏 | `onSubagent` / `onToolPanel` → webview 面板卡 | relay 前缀 `consult#<id>/` → TUI `subTasks` 面板 |
| 工具注册 | agent.mjs `agentTools` 三分支 | setup.mjs `depthOnly`（depth 0 + consultModels 非空） |
| 配置入口 | 设置面板（模型选择 + effort 下拉） | `/config` 命令（候选池增删改 + effort picker） |

### 2.3 接口契约

**config（`~/.thincoder/config.json`）**：
```jsonc
"agent": {
  "consultModels": [
    { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" },
    { "provider": "zhipu-plan", "model": "glm-5.2", "effort": "max" }
    // 上限 5；缺省空数组 = 未启用
  ],
  "consultTurns": 40,          // 每个顾问的工具轮数预算（15 曾致读文件途中撞墙）
  "consultTimeoutMs": 600000   // 墙钟看门狗（10 分钟；turn 上限只数 LLM 响应，不数慢工具）
}
```

**工具**（均在 `src/agent-tools/consult.mjs`）：
```
consult_start
  - problem (required): 问题简报——现象 + 失败轨迹概述 + 文件入口
      （原始报错无需粘贴——会诊子 agent 用 main_history 自行拉取）
  - models (optional): 子集选择器——["provider:model" | 裸 provider | 裸 model]（大小写不敏感），
      只从 agent.consultModels 里筛出子集跑；缺省/空 = 全池。选择器匹配不到任何池成员 → 报错并列出可选值
  → { id, models: ["deepseek:deepseek-v4-pro", ...] }   // 非阻塞

consult_check
  - id (required)
  → 返回「下一个」先到的回复；回复耗尽且全部 settle 时 done:true
  → 边界：未知 id → { error }；done 后再 check → 仍 { done:true }（幂等）

consult_stop
  - id (required)
  → { stopped: N }   // abort 剩余 N 个（terminated settle，计数不入队）
```

**main_history**（仅会诊子 agent 可用，readonly）：`limit`（默认 20，最大 100）→ 主 agent 历史尾部窗口，多模态图片替换 `[image omitted]`、tool_calls 显形、60KB 字节预算。

**会话状态**：`agent._consultSessions = Map<id, Session>`。`Session = { controllers, replies, pending, waiters, failed, terminated, stopped, total, received }`。`done = 回复队列空 AND pending==0`——失败的模型也 settle，全失败时 `done` 仍成立，`consult_check` 不挂死。settle 语义：正常回复入队；`session.stopped` 后被 abort 的计 `terminated`（不入队）；报错计 `failed`（入队，带失败 note）。

**TUI 可观测**：每个顾问一条活动卡（`subTasks` 面板），relay 前缀 `consult#<subId>/` 复用 subagent 通道——并行顾问互不覆盖，run 结束随 `processing=false` 面板消失。

### 2.4 受影响文件

| 文件 | 动作 |
|---|---|
| `src/agent-tools/consult.mjs` | 新增：三工具 + main_history + 会话状态 + runConsultChild + cleanupConsultSessions |
| `src/agent-tools/escalate.mjs` | 新增（飞刀，见 ESCALATE.md） |
| `src/agent/setup.mjs` | depthOnly 注册三工具（depth 0 + consultModels 非空）+ role "consult" base prompt 分支 + `withPool` 候选池装饰 |
| `src/agent.mjs` | `CONSULT_BASE` 加载导出；runAgent finally → `cleanupConsultSessions` |
| `src/config.mjs` | DEFAULTS 加 consultModels/consultTurns/consultTimeoutMs + 校验（≤5） |
| `src/tui/cmd-config.mjs` | `/config` 候选池管理（增删改 + effort picker） |
| `src/prompts/consult-base.md` | 新增：会诊子任务 prompt（只读约束 + main_history + 预算引导） |
| `src/prompts/main.md` | 主 agent 会诊条款（何时会诊 + 简报质量） |
| `test/consult.test.mjs` | 新增测试（9 条，CLI 签名适配） |

### 2.5 关键决策记录

- **判定归主 agent，工具零判定**：采纳与否在主 agent 的 turn 里用它的工具完成。
- **两阶段三工具而非单阻塞工具**：主 agent 阻塞时无法中途判断；拆开后"逐个读、边判边早停"才成立。
- **只读会诊 + main_history**：会诊子 agent 不改文件；按需拉主会话历史。
- **turn 绑定生命周期**：runAgent finally 清理，避免孤儿子任务泄漏。
- **独立 consult role**：不复用 explore 身份——consult-base.md 作裸 prompt，不背编码纪律块；工具集只读过滤 + main_history。
- **CLI 复用 subagent 的 provider 解析**：`resolveChildProvider("provider:model")` 零新机制，跨 provider 候选天然支持。

---

## 3. 测试

`test/consult.test.mjs`（9 条，runner 用 CLI 签名 `(childAgent, input, callbacks, opts)` 的 fake）：

| 用例 | 断言 |
|---|---|
| 发起即返回 | consult_start 立即返回 { id, models } |
| 逐个读取 | 3 模型回复先后到达 → check 依次返回先到者，done false→true |
| 早停 | consult_stop 返回 { stopped:N }，剩余 abort |
| 失败 settle | 报错模型记 failed 入队，不阻断其余 |
| 未配置 | 空池返回"先配置 agent.consultModels" |
| 用户 Stop | abort 全部，check 返回 done+stopped |
| main_history | 返回主历史窗口，字节预算内 |
| 只读隔离 | 工具过滤只留 readonly + main_history |
| cleanup | 标记 stopped + abort 残留 + 清空 Map |

## 4. 与插件的已知差异（非缺陷）

- **D3（Ctrl+I 中断杀会诊）**：CLI 无中断续传（turn 绑定是刻意设计），与插件一致。
- **面板回复预览（D10）**：CLI 的回复全文在主 agent 上下文 + 活动流可见，无独立展开预览（TUI 面板已显示工具调用流，回复文本由主 agent 转述）。
- **usage 上报（D12）**：会诊子任务 usage 不计入主状态栏缓存命中率（与插件一致，记录在案）。
