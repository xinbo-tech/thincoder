# 飞刀（Escalate）

> 板块：飞刀。状态：**已实施 + 已异步化**（R17——2026-09-06，默认 async）。
> 权威规格（现行）：`AGENT-LOOP.md` §19（escalate 并入 `subagent` 工具 `action:"escalate"`——
> 工具面收敛，语义/约束/relay 前缀 `escalate#N` 全保留）+ §25 D-R17b（**缺省 async** + 后台池化 + settle 三分类）。
> 与 VS Code 插件同源设计（`thincoder-vscode/docs/design/ESCALATE.md`）——本文记录 CLI 端的实现与接线。
> 与会诊（consult）互补，见 `CONSULTATION.md`。

## 0. 术语表

| 名字 | 是什么 |
|---|---|
| **`escalate`** | **唯一的技术名**——`subagent` 工具的动作名，召唤的子 agent 走 `role: "coder"`（写路径复用） |
| **飞刀** | escalate 的中文别名（用户面向） |

红线：`escalate` 是主 agent 工具表里的动作，**直接调用**（`subagent` 的 `action:"escalate"`）——
看到 escalate 相关源码不等于"要写脚本调它"。

## 1. 需求

### 1.1 一句话

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——像医院请外院
专家飞刀：专家到场、亲自手术、术后交回病历、离场。

### 1.2 与会诊的分工（互补，不重叠）

| | 会诊 consult | 飞刀 escalate |
|---|---|---|
| 本质 | 多模型**并行给意见** | 一个强模型**亲自执行** |
| 权限 | 只读 | **可写**（走正常权限门） |
| 场景 | 判断不清，要多视角 | 确认干不动，要人代干 |
| 候选 | `consultModels` 全体 | `consultModels` 全体 |
| 形态 | 两工具（start/stop），后台 digest | 单动作，**缺省 async（R17）——`async:false` 同步** |
| 产物 | 各家分析意见 | 改动清单 + 理由 + 验证结果（术后病历） |

### 1.3 边界哲学（用户拍板：不设硬边界）

飞刀成本 ≈ 主 agent 自跑一轮，硬边界只会让模型该出手时不出手。条款只描述"什么样的任务
适合"和"与会诊的区别"，**何时出手交给模型判断**。

### 1.4 不做清单

- ❌ 飞刀再飞刀（depth 封顶，拒绝 depth>0）
- ❌ 多模型并行操刀（一个手术台只站一位主刀）
- ❌ 飞刀专用独立模型配置（候选池就是会诊列表）
- ❌ 全自动升级（触发权在主 agent 判断 + 用户）

## 2. 设计

### 2.1 配置

`agent.consultModels` 全部条目都是飞刀候选，无额外字段：

```jsonc
"agent": {
  "consultModels": [
    { "provider": "kimi", "model": "kimi-k3", "effort": "max" },
    { "provider": "deepseek", "model": "deepseek-v4-pro", "effort": "high" }
  ]
}
```

`consultModels` 非空即注册 escalate 动作（与会诊同条件——**空池不注册**：模型看不到
不存在的功能就不会误调）。

### 2.2 工具契约

escalate 是 `subagent` 工具的动作（`action:"escalate"`）：

```
subagent(action:"escalate")
  - task (required): 交给飞刀模型的任务描述——目标、约束、入口文件、验收标准
  - model (optional): 指定候选池中的模型（provider:model 格式）；缺省 = 候选池第一个
  - 可写子 agent（role "coder" + 候选 effort）——走正常权限门
  - 子 agent 活动流经 relay 前缀 `escalate#<id>/` 进 TUI 子 agent 活动区块
  → 术后报告：改动清单 / 理由 / 验证结果 + Touched files
```

**tool 描述语义**（subagent.mjs）：把实现任务交给更强的模型（`agent.consultModels`），它
**可写并亲自干活**——读、改、跑测试——然后返回术后报告。用于你判断任务需要更强的手
（复杂多文件重构、棘手的 bug、精密的算法活、或超出你舒适区的工作）；**early escalate，
别烧完尝试才出手**。工程模式不可用（实现走 eng-coder spawn）。

### 2.3 async 现行机制（R17——缺省后台飞刀）

R17（2026-09-06）把 escalate 改为**缺省 async**（depth-0——唯一允许深度）：

- **发起返回 ack**：`{ id, role: "escalate", status: "running" | "queued" }` → 后台
  other 池飞行（与 explore/plan/coder 共享 4 槽——池满公平排队——补位自动）。
- **settle 三分类**：
  - **done**：mutations **merge-all 回父** + 重叠警告入报告（报告级提示——不 gate）；
  - **error**（child 失败 / 撞 turn cap）：partial mutations 视父侧重叠决定 merge
    （无父侧重叠则 merge；有重叠则不 merge + 差异列于报告）；
  - **cancelled**（⏹ / action cancel）：不入 pending——什么都不 merge。
- **术后报告经 pending 单容器 digest 自动注入**（"报告已 merge——可继续处置"——
  `_pendingAsyncResults` +role "escalate"——ASYNC-RESULT-CONTAINER.md D2）——
  **动作域仍按消费回合档位**——手动档 digest 禁写——无族例外。
- **顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）。`async:false` 仅机制参数——depth>0 子代理内同步（平台规则）。

消化轮动作域（消费驱动 / 档位制）与 consult/advisor 族规则同源，权威 = `AGENT-LOOP.md`
§17 D-S6/D-S7 + §25。

### 2.4 CLI 实现接线

| 环节 | CLI |
|---|---|
| 子 agent 构建 | 显式 `createAgent({ provider, tools, config, cwd, memory, overlay: CODER_OVERLAY, role: "coder" })` |
| 子任务 runner | `runAgent(child, task, childCallbacks, { depth: 1, maxTurns, signal })` |
| provider 解析 | `resolveChildProvider(parent, "provider:model")` |
| 改动合并 | `mergeChildMutations(parent, child)`（child agent 对象） |
| 活动流上屏 | relay 前缀 `escalate#<id>/` → TUI 子 agent 活动区块 |
| ContinueError | `ContinueError`（agent.mjs 导出）判断 partial work |
| 配置入口 | `/config` 命令 |

### 2.5 实现要点

- **复用 coder role**：写权限、权限门（`onPermissionRequest` 转发）、recent-changes 追踪
  全部现成，零新机制。
- **改动并入父级守卫**：`mergeChildMutations(parent, child)` 重置父级 verify/advisor 收敛
  预算——飞刀不能绕过父级门直接收尾。
- **深度护栏**：`(ctx.depth ?? 0) > 0` 拒绝（飞刀不能再飞刀）。
- **工程模式禁飞刀**：engineering mode 下 spawn coder 子 agent 是设计禁止的，fail-closed
  指向 eng-coder。
- **无墙钟看门狗**：完全依赖 turn 上限（`subagentTurns` ?? 100），与 subagent 写路径对齐——
  固定墙钟会误杀正常但慢的手术。挂死防护由 FETCH_TIMEOUT_MS（单 LLM 调用）+ 用户 Stop
  （父 signal 直传子）覆盖。
- **撞墙后用户可选继续**：子 agent 撞 turn 上限（`ContinueError`）时，复用子 agent 写审批
  的同一通道 `ctx.onPermissionRequest("continue", { turns })` 弹"继续?"——TUI 渲染主 agent
  同款 y/n Continue 面板。用户选继续则以 `resume: true` 续跑：runAgent 不重复注入任务文本，
  child history 与 mutation 簿记保留，预算重置为一轮完整 `maxTurns`。**续跑次数不设上限**
  （TURN-CAP-CONTINUE.md：所有 agent 撞墙可无限继续）。超限或用户放弃或 headless 无回调时
  退回 partial work 话术。
- **用户 Stop 传播**：AbortError 向上 rethrow，不吞掉。

### 2.6 受影响文件

| 文件 | 动作 |
|---|---|
| `src/agent-tools/subagent-actions.mjs` | escalate 动作接线（缺省 async 分支） |
| `src/agent-tools/escalate-async.mjs` | async 飞刀 runner + settle 三分类 + digest 注入 |
| `src/agent-tools/consult.mjs` | 会诊工具（候选池同源——见 CONSULTATION.md） |
| `src/config.mjs` | consultModels 校验 |
| `src/tui/cmd-config.mjs` | `/config` 候选池管理 |
| `src/prompts/main.md` | 飞刀条款（术语 + 时机 + 直接调用红线） |
| 测试 | escalate 家族测试（async ack / settle merge / error partial-merge / 取消 / sync 保留 / 深度护栏 / 工程模式 / 撞墙继续——用例清单权威 = AGENT-LOOP.md §25.3 T-R17a..r） |

### 2.7 关键决策记录

- **候选池复用会诊列表**：不新增配置章节，零额外字段。
- **缺省 async（R17）**：10-30min 飞刀不再锁死前端——发起 ack → 回合收尾 → 完成报告 digest
  自动注入 + mutations 自动 merge；`async:false` 显式同步零回归。
- **复用 coder role**：写权限/权限门/追踪全部现成。
- **动作名 escalate，中文叫飞刀**：英文语境 "escalate to an expert" 模型一见即懂。
- **空池不注册**：模型看不到不存在的功能就不会误调。
- **术语归并**：surgeon 曾作为角色名与工具名并存导致模型混淆，现统一为 escalate
  （动作名 = 角色语义，role "coder"）。

## 3. 测试

escalate 测试用例清单的权威 = **AGENT-LOOP.md §25.3**（T-R17d..r：async ack 返回 + 回合
收尾 / settle 三分类 merge / sync `async:false` 零回归 / 容量排队 / eng 拒保持 / 取消不入
pending / error partial-merge 决策 / 空闲 settle 消化等）。

**验收**（AGENT-LOOP §25）：T-R17a..p 双端绿 + escalate/subagent 家族既有零回归。

## 变更记录

- 2026-08-16：立项实施（飞刀 escalate 工具 + 同步执行 + 术后病历；0.12.30 随版发布）；
  术语归并 surgeon → escalate；空池不注册；深度护栏；工程模式 fail-closed。
- 2026-09-03：escalate 并入 `subagent` 工具 `action:"escalate"`（工具面收敛——语义/约束/
  relay 前缀 `escalate#N` 全保留——AGENT-LOOP §19）。
- 2026-09-06：**R17 缺省 async**——后台 other 池 + settle 三分类 + digest 自动注入；
  `async:false` 显式同步保留——2026-09-08 §7.7.1 移除（同步保留例外全移除——顶层一律异步——见 2026-09-09 条）；机制正文收敛到本文 §2 当前态。
- 2026-09-07：DOC-REWRITE 批 A——可读化重写为当前态（多行 markdown，历史折叠为变更记录）。
- 2026-09-09：BATCH-4-DOC-CLEANUP——§2.3 async:false 残留句清（§7.7.1 锚句照抄 AGENT-LOOP §14.2——顶层一律异步——`async:false` 仅机制参数）。
