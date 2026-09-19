# 2026-09-20 · thinking 回传缺口修复批（#109）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

**前情** = 无（独立缺陷批）· **母本** = 用户 2026-09-20 00:57 截图反馈 + 父侧逐条实核（行号已收正）

### 1.1 报告与实核

| 面 | 配置（实读） | 表现（用户提供） |
|---|---|---|
| 子代理 `eng-designer` | `agent.subagentModel` / `subagentModels` 未设 ⇒ 继承主模型 `deepseek:deepseek-flash`（thinking） | **挂 2 次**（长任务 · 编号疑为 run id · 未核） |
| 评审 `advisor` | `agent.advisor = {guard:true}` · 同样继承主 provider | 跑完 2 次 |

⇒ **差异不在模型强弱，在暴露量**：多轮子代理 = 更多「可能漏 reasoning」的机会。

### 1.2 病与自我强化机制

- **病根**（实读 · 截图记 `agent.mjs:351` 系早期行号，真位置 = **`:373-374`**）：
  `...(response.reasoning && specForModel(agent.provider.model).reasoningEcho === "required" ? { reasoning_content: response.reasoning } : {})`
  ⇒ **本轮回复无 reasoning ⇒ 该 assistant 消息不带 `reasoning_content` 入库**。
- **镜像同形** = `thincoder-core/advisor/loop.mjs:212-215`（其注释 `:199-204` 自陈已观测症状「server stops returning reasoning_content on later rounds…」）。
- **自我强化**：漏一次 ⇒ 后续轮次模型不再吐 reasoning ⇒ 再漏 ⇒ 供应商从某一轮起一律 400 ⇒ **整条会话死**。
- **症状形态**：总是「**跑了大半程突然中断**」，而不是一开头就挂。

### 1.3 暴露面（实读）

- `reasoningEcho:"required"`：`model-specs.mjs:33/35/38/40/42`（deepseek 族）+ `:44/46/48`（kimi）+ `:75/76`（mimo）；
- `config-presets.mjs:17` deepseek preset = `thinking:{type:"enabled"}` ⇒ 该族**默认暴露**；
- glm 族 = `"optional"`（不暴露）。

### 1.4 已知同族护栏（修法须对齐，勿另起一套）

- `context.mjs:289-290`（**D-CC18 echo safety**——无 `reasoning_content` 的 assistant 紧邻 assistant ⇒ DeepSeek 族 thinking 模式 **400**）；
- `session-lifecycle.mjs:93`（D-CC18 病态形态）；`test/compaction-echo.test.mjs`（专门不变量检出器）。
- ⇒ 项目已在**压缩/邻接面**打过这一仗，**live push 面（`agent.mjs` 主推入 + `loop.mjs` 镜像）仍是条件式**。

### 1.5 待裁三点（交设计轮 · 父侧不自定方案）

1. `required` 族**是否无条件回传**（缺值回空串？须核供应商接受面与序列化形态）；
2. 缺值补齐策略**与 D-CC18 家族对齐**（复用既有判据 vs 新增）；
3. `advisor/loop.mjs` 镜像**同轮修否**（advisor 同样在 required 族上）。

### 1.6 台账

- **#109** → 本批（待讨论 → **待设计**；任务书指针 = 本档 §2）。

## §2 批次任务与设计（eng-designer）

## §3 设计评审（评审子代理）

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

## §6 验证与收口（父代理）
