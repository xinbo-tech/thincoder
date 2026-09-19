# 飞刀（ESCALATE）· 会诊与评审板块

> 板块 = **飞刀**——把实现任务交给更强模型**亲自操刀**（`subagent` 工具动作 `action:"escalate"`）。
> 本档 = 飞刀机制设计面的**唯一权威**（术语 / 需求定位 / 候选池 / 工具契约 / async 机制 / 双端接线）。
> 相邻权威 = `docs/core/design/CONSULTATION.md`（会诊与评审·**共用候选池与后台池机制**——本档不复制其机制正文）·
> `docs/core/design/AGENT-LOOP.md`（异步化 / 子代理结算 / 消化轮档位）· `docs/core/design/ENGINEERING-MODE-V2.md`（工程模式禁飞刀——v1 设计档已归档）·
> `docs/core/design/TURN-CAP-CONTINUE.md`（撞轮数墙续跑）。
> 需求侧 = `docs/core/requirements/ESCALATE.md`（F-E1–F-E5 / N-E1–N-E4）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 3**——`thincoder-vscode/docs/design/ESCALATE.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名档（`thincoder-cli/docs/design/ESCALATE.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> 逐节对账后 CLI 独有面（TUI 接线 / relay 前缀 CLI 形 / 撞墙继续 CLI 通道）已入 §5 / §6，(d) 类入 §8.1。
> 本档坐标 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 术语表

| 名字 | 是什么 |
|---|---|
| **`escalate`** | **唯一技术名**——`subagent` 工具的动作名；召唤的子代理走 `role: "coder"`（写路径复用） |
| **飞刀** | escalate 的中文别名（用户面向） |

**红线**：`escalate` 是主 agent 工具表里的**动作**，直接调用（`subagent` 的 `action:"escalate"`）——看到相关源码不等于「要写脚本调它」。
历史角色名 **surgeon 已从代码移除**，不留别名。

## 2. 需求定位

### 2.1 一句话

主模型遇到**自己干不动**的复杂实现任务时，请能力更强的模型**亲自操刀**——像医院请外院专家飞刀：专家到场、亲自手术、术后交回病历、离场。

### 2.2 与会诊的分工（互补，不重叠）

| | 会诊 consult | 飞刀 escalate |
|---|---|---|
| 本质 | 多模型**并行给意见** | 一个强模型**亲自执行** |
| 权限 | 只读 | **可写**（走正常权限门——ask 弹卡带归属 / AUTO 直通） |
| 场景 | 判断不清，要多视角 | 确认干不动，要人代干 |
| 候选 | `agent.consultModels` 全体 | `agent.consultModels` 全体（**同一列表**） |
| 形态 | 两工具（start / stop），后台 digest | 单动作，**缺省 async**（`async:false` 显式同步） |
| 产物 | 各家分析意见 | 改动清单 + 理由 + 验证结果（术后报告） |

### 2.3 边界哲学（用户拍板：不设硬边界）

飞刀成本 ≈ 主 agent 自跑一轮，硬边界只会让模型该出手时不出手。条款只描述「什么样的任务适合」与「与会诊的区别」，
**何时出手交给模型判断**——机制化挂钩（verify 耗尽 / stall）不用于飞刀。

### 2.4 不做清单

- ❌ 飞刀再飞刀（depth 封顶——拒绝 `depth > 0`）
- ❌ 多模型并行操刀（一个手术台只站一位主刀）
- ❌ 飞刀专用独立模型配置（候选池就是会诊列表）
- ❌ 全自动升级（触发权 = 主 agent 判断 + 用户）

## 3. 配置与候选池

候选池 = `agent.consultModels` 的**全部条目**，无额外字段（不新增配置章节）。池**空**时 escalate 动作运行时返回既有错误语义——
**空池不注册 / 不可用**：模型看不到不存在的功能就不会误调。

## 4. 工具契约

`escalate` 是 `subagent` 工具的动作（`action:"escalate"`）——已退役的独立 `escalateTool` 执行逻辑 verbatim 并入（约束 / 前缀 / 术后报告全保留）：

```
subagent(action:"escalate")
  - task (required): 交给飞刀模型的任务描述——目标、约束、入口文件、验收标准
  - model (optional): 指定候选池中的模型（provider:model 格式）；缺省 = 候选池第一个
  - 可写子 agent（role "coder" + 候选 effort）——走正常权限门（ask 弹卡带归属；AUTO 直通）
  - 子 agent 活动流经 relay 前缀进面板——**双端异形**：CLI = `escalate#<id>/` → TUI 子代理活动区块；VSC = `sub:escalate <label> #N` → 面板
  → 术后报告：改动清单 / 理由 / 验证结果 + Touched files
```

**工具描述语义**：把实现任务交给更强的模型，它**可写并亲自干活**（读 / 改 / 跑测试），返回术后报告。
**early escalate，别烧完尝试才出手**。**工程模式不可用**（实现走 eng-coder spawn——fail-closed）。

## 5. async 现行机制（缺省后台飞刀）

**发起**：返回 ack（`{ id, role: "escalate", status: "running" | "queued" }`）→ 后台 **other 池**飞行（与 explore / plan 共享槽位——池满公平排队、补位自动、cancel / ⏹ / status 共享池机制）。

**settle 三分类**：

| 类 | 处置 |
|---|---|
| **done** | mutations **merge-all** 回父；与父侧并发写重叠 ⇒ **报告级警告**（不 gate） |
| **error**（child 失败 / 撞轮数墙——async 永不弹继续面板） | 已产出的 partial mutations 视**父侧重叠判定**决定 merge（父 launch 后无重叠则 merge；有重叠则不 merge + 报告列差异） |
| **cancelled**（⏹ / 定向 cancel） | **不入 pending**——什么都不 merge |

**aborted**（会话全停 / controller 链中止）→ 出池丢弃（中止清池不注入）。

- **术后报告经 pending 单容器 digest 自动注入**（done = 已 merge 报告可继续；error = 错误报告）——动作域仍按**消费回合档位**（手动档 digest 禁写禁 spawn，无族例外）。
- **条目 settle 即出池**（status 查询在 settle 后为 unknown——报告经 digest 自动到达）。
- **顶层一律异步**（depth-0 escalate 本就 depth-0 only ⇒ 顶层缺省 = async）；`async:false` 仅**机制参数**——depth>0 子代理内同步（平台规则）。
- **撞墙继续（CLI 同步路径）**：撞轮数墙（`ContinueError`）经权限请求 `onPermissionRequest("continue")` 弹主 agent 同款 y/n Continue 面板；
  用户选继续则以 `resume: true` 续跑（不重注入任务文本、history 与 mutation 簿记保留、预算重置为一轮完整 `maxTurns`）——**续跑次数不设上限**（见 `docs/core/design/TURN-CAP-CONTINUE.md`）。
- **用户 Stop 传播**：`AbortError` 向上 rethrow，不吞掉。

## 6. 端级实现接线（双端 · as-of 2026-09-15 实核）

| 环节 | 核 / CLI | VSC |
|---|---|---|
| 工具面 | `thincoder-core/agent-tools/subagent.mjs:2`（ONE tool, EIGHT actions）· `:94-102`（动作清单含 escalate） | `thincoder-vscode/src/agent-tools/subagent.mjs`（同形动作面） |
| 动作执行器 | `thincoder-core/agent-tools/subagent-actions.mjs:23`（`launchEscalateAsync`）· `:6`（`executeEscalateAction` §19） | `thincoder-vscode/src/agent-tools/subagent-escalate.mjs:73`（`escalateAction`）——**该端档已退役**（W12 删除集；现体 = 核 `thincoder-core/agent-tools/subagent-actions.mjs`） （迁移期引文） |
| async runner | `thincoder-core/agent-tools/escalate-async.mjs:2-8`（缺省 async / other 池 / 共享 4 槽）· `:142-149`（入池） | `thincoder-vscode/src/agent-tools/subagent-escalate-async.mjs:59`（`settle: settleEscalateEntry`）· `:39`（三分类）——**该端档已退役**（W12 删除集） （迁移期引文） |
| 池域 | `thincoder-core/agent-tools/subagent-async.mjs:55`（`ASYNC_POOL_LIMITS = { engCoder: 4, other: 4 }`）· `:62-65`（`poolDomainOf`——escalate 以 role coder 落 other 池） | 同源（池域机制见 `AGENT-LOOP.md`） |
| 结算 helper | `thincoder-core/agent-tools/async-settle.mjs`（`settleAsyncEntry` / `buildChildSignal`） | `thincoder-vscode/src/agent-tools/async-settle.mjs`（同款） |
| 深度护栏 | `thincoder-core/agent-tools/subagent-actions.mjs:341`（`(ctx.depth ?? 0) > 0` → 明确错误） | `thincoder-vscode/src/agent-tools/subagent-escalate.mjs:79`（`depth > 0` → 明确错误）——**该端档已退役**（W12 删除集） （迁移期引文） |
| 工程模式禁用 | fail-closed（实现走 eng-coder spawn） | 同位 |
| 撞墙继续（同步路径） | `thincoder-core/agent-tools/subagent-actions.mjs:423`（`runWithContinue` + `onPermissionRequest("continue")` y/n 面板——主会话同款） | `thincoder-vscode/src/agent-tools/subagent-escalate.mjs:163`（`for (let resumes = 0; ; resumes++)`）· `:197`（`ContinueError`）——见 `docs/core/design/TURN-CAP-CONTINUE.md` §2（**该端档已退役**——W12 删除集） （迁移期引文） |
| 子代理构建 | `createAgent({ provider, tools, config, cwd, memory, role: "coder" })`（async `thincoder-core/agent-tools/escalate-async.mjs:190` · 同步 `subagent-actions.mjs:403`）——人格槽由 `assemblePrompt` 场景表承载（旧 `overlay: CODER_OVERLAY` 前缀参数已退役） | 同形 |
| provider 解析 / 改动合并 | `resolveChildProvider`（`thincoder-core/agent-tools/subagent-async.mjs:138`）· `mergeChildMutations`（`:411`） | 同形机制 |
| 活动流上屏 | relay 前缀 `escalate#<id>/`（`thincoder-core/agent-tools/escalate-async.mjs:158`）→ TUI 子代理活动区块（no-preview legacy 面——`thincoder-cli/src/tui/tool-events.mjs:227-238`） | relay 前缀 `sub:escalate <label> #N`（`thincoder-vscode/src/agent-tools/subagent-escalate.mjs:142`——**该端档已退役**，W12 删除集）→ 面板（冻结入流同 subagent / consult） （迁移期引文） |
| 配置入口 / 提示词条款 | `/config` 候选池管理（`thincoder-cli/src/tui/cmd-config.mjs`——上限 5 条 `:198`）· 飞刀条款 = `thincoder-core/prompts/discipline-normal.md` | Settings 面板（VSC 专有面——见 VSC 迁移台账） |

## 7. 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-E1 | **候选池复用会诊列表**（零额外字段） | 减少心智负担——所有会诊模型自动是飞刀候选。否决「每个模型带飞刀勾」钩选机制（已删除） |
| D-E2 | escalate **并入 `subagent` 动作面** | 工具面收敛——一个工具多动作，模型不会为找飞刀而混淆；退役逻辑 verbatim 并入、约束 / 前缀 / 报告零变化。否决「独立 escalate 工具」（已退役） |
| D-E3 | **缺省 async** | 长飞刀不再锁死交互——发起 ack → 回合收尾 → 完成报告 digest 自动注入 + mutations 自动 merge；`async:false` 显式同步零回归 |
| D-E4 | **复用 coder role** | 写权限 / 权限门（ask 弹卡带归属）/ 追踪全部现成，零新机制 |
| D-E5 | **空池不注册** | 模型看不到不存在的功能就不会误调 |
| D-E6 | **改动并入父级守卫**（`mergeChildMutations` 重置父级 verify / advisor 收敛预算） | 飞刀不能绕过父级门 |
| D-E7 | **无墙钟看门狗**（飞刀专属；consult 保留） | 固定墙钟会误杀正常但慢的手术（实测 max-effort 顾问读文件即撞 10min 墙）——改为 turn 上限 + 单次 LLM 调用超时 + 用户 Stop 直传 |
| D-E8 | **术语归并** 统一为 escalate | surgeon 曾作角色名与工具名并存导致模型混淆（role 语义 = `coder`，动作名 = escalate） |
| D-E9 | **depth-0 only** | 飞刀不能再飞刀。否决「嵌套升级」 |
| D-E10 | **effort 越界钳制**（池 effort 越出该模型枚举 → 整字段丢弃） | 此前候选每次调用必抛错（「起飞即死」） |
| D-E11 | **深度护栏**（`(ctx.depth ?? 0) > 0` 拒绝——`thincoder-core/agent-tools/subagent-actions.mjs:341`） | 飞刀不能再飞刀——错误文案明示「an escalate's work cannot be delegated again」 |
| D-E12 | **无墙钟看门狗的挂死防护** = turn 上限（`subagentTurns` ?? 100）+ 单次 LLM 调用超时 + 用户 Stop 直传 | 与 subagent 写路径对齐——固定墙钟会误杀正常但慢的手术（D-E7 的 CLI 侧出处） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/design/ESCALATE.md`（VSC 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实施 + 已异步化（R17——2026-09-06）…已完成专题的当前态记录」） | 时点状态行 + 批序 | 批次语境——现行态已入 §2–§6 |
| 旧档 §2.1 配置示例（`jsonc` 片段） | 单批施工示例 | 现态配置语义已入 §3 |
| 旧档 §2.4 表「测试」行（用例清单权威 = 跨仓引例） | 跨仓用例编号引例 | 跨仓指针（P3 自持纪律）——不并 |
| 旧档 §3 测试（跨仓引例用例编号——对端仓在册） | 跨仓用例清单 | 同上（根域不在册：本档不引字面编号） |
| 旧档「已退役独立 escalateTool（删除记录 = 变更记录 2026-09-03 行）」 | 退役工具删除流水 | 一次性材料——结论已入 §4 / D-E2 |
| 旧档变更记录（2026-08-16 起逐批流水） | 历史叙述 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/design/ESCALATE.md`（2026-09-15 CLI 尾部真批对账并入）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行（「已实施 + 已异步化（R17——2026-09-06，默认 async）」） | 时点状态行 | 批次语境——现行态已入 §2–§6 |
| 旧档 §2.1 配置示例（`jsonc` 片段） | 单批施工示例 | 现态配置语义已入 §3（与 VSC 侧同型判例一致） |
| 旧档 §2.6 受影响文件表 | 单批文件清单 | 一次性材料——现行坐标已入 §6 |
| 旧档 §3 测试（用例清单权威 = CLI 树 `AGENT-LOOP §14` · R17 系用例编号） | 跨仓用例编号引例 | 跨仓指针（P3 自持纪律）——不并 |
| 旧档变更记录（2026-08-16 起逐批流水） | 历史叙述 | 结论面已入 §7；本档自有变更记录 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「消化轮动作域（消费驱动 / 档位制）权威 = VSC `AGENT-LOOP.md` §17 D-S6/D-S7 + §25」 | 跨板块机制指针 | 归 `docs/core/design/AGENT-LOOP.md`（本档只留分工句） |
| 旧档「settle 三分类机制」细则 | 与会诊共用的池 / 结算机制 | 归 `docs/core/design/CONSULTATION.md` 与核侧结算 helper（本档只留飞刀差异面） |
| 旧档「Settings 面板配置入口」行 | 面板配置面 | 归 VSC 专有面（`SETTINGS`）——见 VSC 迁移台账 |
| CLI 侧同名档未迁面（`CONSULTATION.md` §8.2 越段登记——触发 = 父侧另派） | CLI 产品档正文 | **已并入（2026-09-15 CLI 尾部真批）**——CLI 独有面入 §5 / §6，(d) 类入 §8.1；`CONSULTATION.md` §8.2 越段登记销项 = 父侧 |

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/design/ESCALATE.md` 逐节对账并入——
  CLI 独有面入档：relay 前缀 CLI 形（`escalate#<id>/` · 与 VSC `sub:escalate <label> #N` 双端异形，§4 / §6）· 撞墙继续 CLI 通道
  （`onPermissionRequest("continue")` y/n 面板 · 次数不限，§5）· Stop 传播句（§5）· 子代理构建 / provider 解析 / 改动合并 / 配置入口坐标（§6）；
  决策补 D-E11 / D-E12；(d) 类（状态行 / jsonc 示例 / 受影响文件表 / 跨仓用例编号 / 逐批流水）入 §8.1。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 3**）：建档——`thincoder-vscode/docs/design/ESCALATE.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；坐标改写为现状路径并实核（`thincoder-core/agent-tools/{subagent,subagent-actions,escalate-async,subagent-async}.mjs`；
  `thincoder-vscode/src/agent-tools/{subagent-escalate,subagent-escalate-async}.mjs`）；与会诊共用的池 / 结算机制指向
  `CONSULTATION.md` 与核侧 helper（D2 单一权威源）；批次材料 / 状态行 / 跨仓引例不并（§8）。
