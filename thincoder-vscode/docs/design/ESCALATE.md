# 飞刀（Escalate）

> 板块：飞刀。状态：**已实施 + 已异步化**（R17——2026-09-06，escalate 缺省 async）。本文件为
> **已完成专题的当前态记录**——记录飞刀机制在 VS Code 端的现行实现与接线。
> 权威源（现行语义/用例/验收）：VSC `AGENT-LOOP.md` §9（会诊/飞刀/advisor 完全异步化——ARCHITECTURE
> §8.5 迁出，R17 VS Code 镜像）+ CLI `AGENT-LOOP.md` §7.2（escalate = `subagent` 工具 `action:"escalate"`）与
> §14.2（飞刀——缺省 async + settle 三分类）；F/D/T/AC 见 CLI `ESCALATE.md`（本文件不复制正文）。
> 与 CLI 端同源（`ESCALATE（CLI 仓）`）；与会诊（consult）互补，见 `CONSULTATION.md`。
> 本文件已由 as-of 快照流水重写为当前态记录（历史 surgeon 时代/整改/简化流水见文末「变更记录」）。

## 0. 术语表

| 名字 | 是什么 |
|---|---|
| **`escalate`** | **唯一的技术名**——`subagent` 工具的动作名，召唤的子 agent 走 `role: "coder"`（写路径复用） |
| **飞刀** | escalate 的中文别名（用户面向） |

红线：`escalate` 是主 agent 工具表里的动作，**直接调用**（`subagent` 的 `action:"escalate"`）——
看到 escalate 相关源码不等于"要写脚本调它"。历史上的角色名 **surgeon** 已从代码移除——不留别名。

## 1. 需求

### 1.1 一句话

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——像医院请外院
专家飞刀：专家到场、亲自手术、术后交回病历、离场。

### 1.2 与会诊的分工（互补，不重叠）

| | 会诊 consult | 飞刀 escalate |
|---|---|---|
| 本质 | 多模型**并行给意见** | 一个强模型**亲自执行** |
| 权限 | 只读 | **可写**（走正常权限门——ask 弹卡带归属 / AUTO 直通） |
| 场景 | 判断不清，要多视角 | 确认干不动，要人代干 |
| 候选 | `consultModels` 全体 | `consultModels` 全体 |
| 形态 | 两工具（start/stop），后台 digest | 单动作，**缺省 async（R17）——`async:false` 显式同步** |
| 产物 | 各家分析意见 | 改动清单 + 理由 + 验证结果（术后报告） |

### 1.3 边界哲学（用户拍板：不设硬边界）

飞刀成本 ≈ 主 agent 自跑一轮，硬边界只会让模型该出手时不出手。条款只描述"什么样的任务
适合"和"与会诊的区别"，**何时出手交给模型判断**——机制化挂钩（verify 耗尽/stall）不用于飞刀
（那是事后撞墙信号；判断缺口已挂会诊）。

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

depth-0 装配 `subagentTool` 常驻；`consultModels` 非空时 withPool 装饰（escalate 动作列出候选池）。
池空时 escalate 动作运行时返回既有错误语义——**空池不注册/不可用**：模型看不到不存在的功能就不会误调。

### 2.2 工具契约

escalate 是 `subagent` 工具的动作（`action:"escalate"`）——已退役的独立 `escalateTool` 执行逻辑（删除记录 = 本档变更记录 2026-09-03 行）
verbatim 并入（约束/前缀/术后报告全保留）：

```
subagent(action:"escalate")
  - task (required): 交给飞刀模型的任务描述——目标、约束、入口文件、验收标准
  - model (optional): 指定候选池中的模型（provider:model 格式）；缺省 = 候选池第一个
  - 可写子 agent（role "coder" + 候选 effort）——走正常权限门（ask 弹卡带归属；AUTO 直通）
  - 子 agent 活动流经 `sub:escalate <label> #N` relay 前缀进面板
  → 术后报告：改动清单 / 理由 / 验证结果 + Touched files
```

**工具描述语义**：把实现任务交给更强的模型（`agent.consultModels`），它**可写并亲自干活**——
读、改、跑测试——然后返回术后报告。用于你判断任务需要更强的手（复杂多文件重构、棘手的 bug、
精密的算法活、或超出你舒适区的工作）；**early escalate，别烧完尝试才出手**。
工程模式不可用（实现走 eng-coder spawn）。

### 2.3 async 现行机制（R17——缺省后台飞刀）

R17（2026-09-06）把 escalate 改为**缺省 async**（escalate depth-0 only → 顶层缺省 = async）：

- **发起返回 ack**：`{ id, role: "escalate", status: "running" | "queued" }` → 后台 **other 池**飞行
  （与 explore/plan 共享槽位——池满公平排队——补位自动——cancel/⏹/status 共享池机制）。
- **settle 三分类**：
  - **done**：mutations **merge-all 回父** + 与父侧并发写重叠 → **报告级警告**（不 gate）；
  - **error**（child 失败 / 撞 turn cap——async 永不弹继续面板）：已产出 partial mutations 视父侧
    重叠决定 merge（父侧 launch 后无重叠则 merge；有重叠则不 merge + 报告列差异）；
  - **cancelled**（⏹ / cancel 定向中止）：不入 pending（D-M6）——什么都不 merge。
  - aborted（会话/全停——controller 链中止）→ 出池丢弃（中止清池不注入）。
- **术后报告经 `history._pendingEscalateResults` digest 自动注入**（done = 已 merge 报告可继续 /
  error = 错误报告）——**动作域仍按消费回合档位**——手动档 digest 禁写禁 spawn——无族例外
  （T-R17p 零例外——引例：CLI 仓用例编号，本仓不在册）。
- **条目 settle 即出池**（status 查询在 settle 后为 unknown——报告经 digest 自动到达）。
- **顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）。`async:false` 仅机制参数——depth>0 子代理内同步（平台规则）。

消化轮动作域（消费驱动 / 档位制）与 consult/advisor 族规则同源，权威 = `AGENT-LOOP.md` §17 D-S6/D-S7 + §25。

### 2.4 端级实现接线

| 环节 | VS Code |
|---|---|
| 引擎 | `subagent-escalate.mjs`（sync 路径 verbatim——`escalateAction`）+ `subagent-escalate-async.mjs`（async——入池 + settle 三分类 + 飞刀 digest 注入文案） |
| 子 agent 构建 | `prepareEscalateProvider（W12 已迁核——现体见批次档 §5）`（buildProvider + effort 钳制 + apiKey 预检——缺 key 提前报错不裸 401） |
| 子任务 runner | 同步：`runAgent(child, task, …)`；异步：经 `spawnAsyncSubagent` 入 other 池 |
| 改动合并 | `mergeChildMutations(parent, child)`（重置父级 verify/advisor 收敛预算——飞刀不能绕过父级门） |
| 活动流上屏 | relay 前缀 `sub:escalate <label> #N` → 面板（R22 冻结入流同 subagent/consult） |
| 深度护栏 | depth>0 拒绝（飞刀不能再飞刀） |
| 工程模式 | eng 模式禁飞刀（fail-closed——实现走 eng-coder spawn） |
| 配置入口 | Settings 面板（候选池 = `consultModels`） |
| 测试 | escalate 家族（async ack / settle merge / error partial-merge / 取消 / sync 保留 / 深度护栏 / 工程模式 / 撞墙——用例清单权威 = AGENT-LOOP §25） |

### 2.5 实现要点

- **复用 coder role**：写权限、权限门（`onPermissionRequest` 转发——ask 模式经父面板弹卡，
  卡归属 `escalate <label> #N`；AUTO 直通）、recent-changes 追踪全部现成，零新机制。
- **改动并入父级守卫**：`mergeChildMutations` 重置父级收敛预算——飞刀改动照常受父级 verify/advisor 门检。
- **无墙钟看门狗（飞刀专属，consult 保留）**：固定墙钟会误杀正常但慢的手术（实测 max-effort 顾问
  读文件即撞 10min 墙）——改为完全依赖 turn 上限 + FETCH_TIMEOUT（单 LLM 调用）+ 用户 Stop 直传。
- **撞墙后用户可选继续（同步路径）**：撞 turn 上限（ContinueError）经 question 通道弹"继续?"——选
  Continue 则以 `resume:true` 续跑（history/mutations 保留、预算重置）；async 路径永不弹继续面板。
- **effort 越界钳制**：池 effort 越出该模型 `reasoningEffortEnum` → 整字段丢弃（此前候选每次 chat
  必抛错——"起飞即死"）。

### 2.6 关键决策记录

- **候选池复用会诊列表**：不新增配置章节，零额外字段（早期"每个模型带飞刀勾"的钩选机制 2026-08-16
  删除——用户拍板减少心智负担：所有会诊模型自动是飞刀候选）。
- **escalate 并入 `subagent` 动作（§19）**：工具面收敛——一个工具多动作，模型不会为找飞刀而混淆；
  escalate 退役逻辑 verbatim 并入，约束/前缀/报告零变化。
- **缺省 async（R17）**：长飞刀不再锁死交互——发起 ack → 回合收尾 → 完成报告 digest 自动注入 +
  mutations 自动 merge；`async:false` 显式同步零回归。
- **复用 coder role**：写权限/权限门（ask 弹卡带归属）/追踪全部现成。
- **空池不注册**：模型看不到不存在的功能就不会误调。
- **术语归并**：surgeon 曾作为角色名与工具名并存导致模型混淆，现统一为 escalate（动作名 = 角色语义，
  role "coder"）。

## 3. 测试

escalate 测试用例清单的权威 = **AGENT-LOOP（CLI 仓·设计）§25**（T-R17d..r（引例：CLI 仓用例编号，本仓不在册）——async ack 返回 + 回合收尾 / settle
三分类 merge / sync `async:false` 零回归 / 容量排队 / eng 拒保持 / 取消不入 pending / error
partial-merge 决策 / 空闲 settle 消化等——VS Code 镜像）。

**验收**（AGENT-LOOP §25）：T-R17a..p 双端绿 + escalate/subagent 家族既有零回归（T-R17a..p = 引例：CLI 仓用例编号，本仓不在册）。

## 变更记录

- 2026-08-16：立项实施（独立 escalate 工具 + 同步执行 + 术后报告；0.1.22 随版发布）；术语归并
  surgeon → escalate；钩选机制删除（所有会诊模型 = 飞刀候选）；飞刀合并入父级守卫、工程模式禁飞刀、
  墙钟看门狗删除、撞墙继续、effort 钳制等整改批合入上文现行语义。
- 2026-09-03：escalate 并入 `subagent` 工具 `action:"escalate"`（独立 `escalateTool` 已退役——verbatim 并入；删除记录 = 本行）。
- 2026-09-06：**R17 缺省 async**——后台 other 池 + settle 三分类 + digest 自动注入；`async:false`
  保留同步路径；机制正文收敛为本文件 §2 当前态。
- 2026-09-08：DOC-REWRITE-VSC 批 V4——从 as-of 快照流水重写为当前态记录（多行 markdown，历史折叠本段）。
- 2026-09-09：BATCH-4-DOC-CLEANUP——§2.3 async:false 残留句清（§7.7.1 锚句照抄 AGENT-LOOP §14.2——顶层一律异步——`async:false` 仅机制参数——与 CLI 同源 byte-final）。
