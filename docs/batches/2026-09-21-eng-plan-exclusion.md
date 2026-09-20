# 工程模式 plan 面排除（ENG-PLAN-EXCLUSION）· 批次记录（2026-09-21）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 00:5x · 来源 = 用户 00:55 需求（工程模式排除 plan 模式）+ 00:57 三裁批准（「我认为你的裁决合理」）。
> 台账 = #155（点火推进中）· 需求档 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.9（FR31）。
> 关联：#154（工程模式绕过根因分析——独立线 · 冻结中）· 本批落地后消解其候选③（退出话术冲突）在工程模式下的可达性 ✗ 但两线不合并。

## §1 讨论（主 agent）

**状态行**：🔄 进行中

**用户原始需求（2026-09-21 00:55）**：

> 我发现glm-5.3-flash在工程模式下经常会启动plan模式，这一步在工程模式下是不必要的，所以，我觉得应该把plan模式从工程模式下排除，避免误导模型，因为工程模式主agent本身的职能就是plan。

**讨论结论（用户 00:57 批准三裁）**：

1. **排除形态 = 工具不注册**（模型不可见——优于「注册但报错」的干扰回合）；
2. **命令面同步禁**：TUI `/plan` + ACP plan 设置，工程模式下禁用且明确提示；
3. **残留清零**：会话中途开启工程模式且 `planMode` 已为 true ⇒ 强制复位。

**现状实勘（父侧只读 · 2026-09-21 实读）**：

- `plan` 工具现居**固定段**（`thincoder-core/agent/family-tools.mjs:173`：`[taskTool, planTool, timerTool, ...depthOnly]`）——全模式全深度注入；
- 同类过滤先例（同档）：`:44-48` 子代理角色 enum 互斥（工程 = eng-coder/eng-designer）· `:67` consult 家族按 `!engineering` 不注册——「工程模式裁工具」非新机制；
- 话术冲突实锤：`PLAN_EXIT_REMINDER`（`thincoder-core/agent-tools/plan.mjs:21-23`）逐字含「Start implementing your plan … No need for … further confirmation」——与工程链条（设计 → 评审 → 批准 → token）直接打架。

**落点登记**：需求档 FR31 已落 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.9（父侧落笔 · 需求档为父侧写域 · 可 revert）。

## §2 批次任务与设计（eng-designer）

（待设计——设计档落点 = `docs/core/design/ENGINEERING-MODE-V2.md`。）

## §3 设计评审（评审子代理）

（待评审——用户点火。）

## §4 用户批准（主 agent）

（待 §3 后。）

## §5 实施记录（eng-coder）

（待批准后。）

## §6 验证与收口（父代理）

（待实施后。）
