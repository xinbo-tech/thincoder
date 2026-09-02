> **§19 修订标注（2026-09-03）**：`escalate` 工具已并入 `subagent` 工具 `action:"escalate"`（工具面收敛——语义/约束/relay 前缀 escalate#N 全保留——见 AGENT-LOOP.md §19）——本文件机制描述仍有效（飞刀语义/模型池/术后报告），工具注册/调用表述以 §19 为准。

# 飞刀（Escalate）— 需求与设计（CLI）

> 状态：**已实施**（2026-08-16，commit 596a69f；0.12.30 随版发布）。与 VS Code 插件同源设计（`thincoder-vscode/docs/design/ESCALATE.md`），本文件记录 CLI 端的实现差异与接线。
> 关联：`CONSULTATION.md`（会诊——飞刀的候选池来源与互补机制）

---

## 0. 术语表（归并后：两个名字）

| 名字 | 是什么 |
|---|---|
| **`escalate`** | **唯一的技术名**——工具名 = 它召唤的子 agent 角色名（role: "coder"，写路径复用） |
| **飞刀** | escalate 的中文别名（用户面向） |

红线：看到 `escalate.mjs` 的源码不等于"要写脚本调它"——escalate 是主 agent 工具表里的工具，直接调用。

## 1. 需求

### 1.1 一句话

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——像医院请外院专家飞刀：专家到场、亲自手术、术后交回病历、离场。

### 1.2 与会诊的分工（互补，不重叠）

| | 会诊 consult | 飞刀 escalate |
|---|---|---|
| 本质 | 多模型**并行给意见** | 一个强模型**亲自执行** |
| 权限 | 只读 | **可写**（走正常权限门） |
| 场景 | 判断不清，要多视角 | 确认干不动，要人代干 |
| 候选 | `consultModels` 全体 | `consultModels` 全体 |
| 形态 | 三工具（start/check/stop），异步 | 单工具，同步等待 |
| 产物 | 各家分析意见 | 改动清单 + 理由 + 验证结果（术后病历） |

### 1.3 边界哲学（用户拍板：不设硬边界）

飞刀成本 ≈ 主 agent 自跑一轮，硬边界只会让模型该出手时不出手。条款只描述"什么样的任务适合"和"与会诊的区别"，**何时出手交给模型判断**。

### 1.4 不做清单

- ❌ 飞刀再飞刀（depth 封顶，execute 层拒绝 depth>0）
- ❌ 多模型并行操刀（一个手术台只站一位主刀）
- ❌ 飞刀专用独立模型配置（候选池就是会诊列表）
- ❌ 全自动升级（触发权在主 agent 判断 + 用户）

---

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

工具注册（setup.mjs）：`consultModels` 非空即注册 `escalateTool`（与会诊同条件——未配置时模型看不到工具）。

### 2.2 工具契约

```
escalate
  - task (required): 交给飞刀模型的任务描述——目标、约束、入口文件、验收标准
  - model (optional): 指定候选池中的模型（provider:model 格式）；缺省 = 候选池第一个
→ 同步执行：spawn 可写子 agent（role "coder" + 候选 effort）
→ 返回子 agent 的最终报告（术后病历：改动清单 / 理由 / 验证结果 + Touched files）
→ 子 agent 活动流通过 relay 前缀 `escalate#<id>/` 进 TUI 子 agent 活动区块（§7.2 D4 会话流内可折叠块）
```

### 2.3 CLI 与插件的实现差异

| 环节 | 插件（vscode） | CLI |
|---|---|---|
| 子任务 runner | `runner({...provider, model}, cwd, task, callbacks, signal, true, opts)` | `runAgent(child, task, childCallbacks, { depth:1, maxTurns, signal })` |
| 子 agent 构建 | runAgent 内部 createAgent + `stateSink` | 显式 `createAgent({ provider, tools, config, cwd, memory, overlay:CODER_OVERLAY, role:"coder" })` |
| provider 解析 | `buildProvider(m.provider)` | `resolveChildProvider(parent, "provider:model")` |
| 改动合并 | `mergeChildMutations(parent, sink)`（state sink） | `mergeChildMutations(parent, child)`（child agent 对象） |
| 活动流上屏 | `onSubagent` / `onToolPanel` → webview | relay 前缀 `escalate#<id>/` → TUI 子 agent 活动区块（§7.2 D4；原 subTasks 窄带已退役） |
| ContinueError | `agentMod.ContinueError` 判断 partial work | `ContinueError`（agent.mjs 导出）判断 partial work |
| 配置入口 | 设置面板 | `/config` 命令 |

### 2.4 实现要点

- **复用 coder role**：写权限、权限门（`onPermissionRequest` 转发）、recent-changes 追踪全部现成，零新机制。
- **改动并入父级守卫**：`mergeChildMutations(parent, child)` 重置父级 verify/advisor 收敛预算——飞刀不能绕过父级门直接收尾。
- **深度护栏**：`(ctx.depth ?? 0) > 0` 拒绝（飞刀不能再飞刀）。
- **工程模式禁飞刀**：engineering mode 下 spawn coder 子 agent 是设计禁止的，fail-closed 指向 eng-coder。
- **无墙钟看门狗**：完全依赖 turn 上限（`subagentTurns` ?? 100），与 subagent 写路径对齐——固定墙钟会误杀正常但慢的手术（2026-08-16 会诊实测：两个 max-effort 顾问仅读 5 个文件即撞 10min 墙）。挂死防护由 FETCH_TIMEOUT_MS（单 LLM 调用）+ 用户 Stop（父 signal 直传子）覆盖。
- **撞墙后用户可选继续**：子 agent 撞 turn 上限（`ContinueError`）时，复用子 agent 写审批的同一通道 `ctx.onPermissionRequest("continue", { turns })` 弹"继续?"——name `"continue"` 在 TUI 渲染主 agent 同款 y/n Continue 面板（tui/agent-turn.mjs 同款机制）。用户选继续则以 `resume: true` 续跑：runAgent 不重复注入任务文本（setup.mjs resume 分支跳过 input push），child history 与 mutation 簿记保留，预算重置为一轮完整 `maxTurns`。~~续跑上限 `MAX_RESUMES = 2`~~（已删——TURN-CAP-CONTINUE.md 用户决定所有 agent 撞墙可无限继续，次数不设上限）超限或用户放弃或 headless 无回调时退回 partial work 话术。
- **用户 Stop 传播**：AbortError 向上 rethrow，不吞掉。

### 2.5 受影响文件

| 文件 | 动作 |
|---|---|
| `src/agent-tools/escalate.mjs` | 新增：escalateTool + touchedFilesNote |
| `src/agent/setup.mjs` | depthOnly 注册（depth 0 + consultModels 非空）+ withPool |
| `src/agent-tools/consult.mjs` | 会诊三工具（候选池同源） |
| `src/config.mjs` | consultModels 校验 |
| `src/tui/cmd-config.mjs` | `/config` 候选池管理 |
| `src/prompts/main.md` | 飞刀条款（术语 + 时机 + 直接调用红线） |
| `test/escalate.test.mjs` | 新增测试（11 条，CLI 签名适配） |

### 2.6 关键决策记录

- **候选池复用会诊列表**：不新增配置章节，零额外字段（2026-08-16 飞刀钩删除——减少心智负担）。
- **同步单工具而非异步三件套**：飞刀是"交给它干完"，主 agent 等待病历天经地义。
- **复用 coder role**：写权限/权限门/追踪全部现成。
- **工具名 escalate，中文叫飞刀**：英文语境 "escalate to an expert" 模型一见即懂。
- **空池不注册**：模型看不到不存在的功能就不会误调。
- **术语归并**（2026-08-16）：surgeon 曾作为角色名与工具名并存导致模型混淆，现已统一为 escalate（工具名 = 角色名）。

---

## 3. 测试

`test/escalate.test.mjs`（11 条）：

| 用例 | 断言 |
|---|---|
| 空池报错 | 指向 agent.consultModels |
| 操刀契约 | fake runner 收到第一个候选 + effort + role coder + depth 1 |
| model 指定 | 指定候选生效；未知候选报错列出候选池 |
| 深度护栏 | depth>0 拒绝 |
| 工程模式 | fail-closed 指向 eng-coder |
| 活动流 | relay 前缀 `escalate#<id>/` |
| 改动合并 | 子 agent mutate 重置父级 verify/advisor 预算 + touchedFiles 并入 |
| 失败也合并 | 中途崩溃仍合并已 touch 的文件 |
| 用户 Stop | AbortError 向上传播 |
| ContinueError | 撞墙后用户可选继续（复用 onPermissionRequest 通道，`resume:true` 续跑不重复注入任务，次数不设上限——TURN-CAP-CONTINUE.md）；放弃/headless 读作 partial work（stopped） |
| 无墙钟 | turn 帽 + 撞墙继续选择；用户 Stop 经父 signal 直传 |
