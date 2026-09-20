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

**状态行**：✅ 设计就绪（评审发起权在用户）· 本段承接上方占位行（占位「待设计」语以本段为准）

**本批覆盖条目（1 条）**：

- **FR31「工程模式 plan 面排除」**——需求依据 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.9（父侧已落）；三条裁决 = ① 工具不注册（模型不可见）② 命令面同步禁 ③ 残留清零（用户 2026-09-21 00:57 批准）。

**明确不在本批（边界）**：

- 普通模式零改（plan 工具 / `/plan` / ACP `mode` / 槽恢复四路径全带宽）；
- `PLAN_FULL/SPARSE/EXIT_REMINDER` 三条文本本体不改（`thincoder-core/agent-tools/plan.mjs:11-23`）；
- **提示词面零改**——`thincoder-core/prompts/**` 与模板对位不在本批（评估结论与三条理由见设计档 §2.3 E7）；
- 不新增机械门（不设拦截层；拒绝点 = 既有命令面与既有翻转点）；
- VSC `setup.mjs` 拆分（495 行 > 300 软线）——方案已登记，本批不执行；
- 相邻观察项（见末节，不在本批）。

**设计档落点** = `docs/core/design/ENGINEERING-MODE-V2.md`（就地并入，无旁路档）：§1.1/§1.2 计数与 E7 行 · §2.2 M11 行 + 接线表行 · §2.3 E7（新增段，五面 + 矩阵 + 文件表）· §2.4 依赖 +2 行 · §2.6 KD8–KD11 · §3.1 AC12–AC15 · §3.2 T10–T14 · §4 变更记录一行。

**五面设计结论（摘要；逐条判据见设计档 §2.3 E7）**：

1. **装配面** = 核单源裁剪：`thincoder-core/agent/family-tools.mjs:173` 固定段按 `engineering` 取 `[task, timer]`（工程模式 plan 不入表）。
   **端差面（实核）**：CLI 路径（核 `thincoder-core/agent/setup.mjs:163-168`，`:165` 取 `config.agent.engineering`）**已传**模式位 ⇒ 核改一处即生效；
   VSC 路径（`thincoder-vscode/src/agent/setup.mjs:132-142`）**未传**（既有唯一消费点 `filteredSubagent` 被端侧 `decorate.subagent` 替换）⇒ 须补传，且装配块（`:125-191`）下移至模式判定（`applySlotSessionState`，`:267`）之后；
   端壳**不**二次过滤（KD9——同一条规则两处实现 = 两份矩阵）。
2. **命令面** = `/plan`（`thincoder-cli/src/tui/cmd-plan.mjs`）· ACP 两入口（`thincoder-cli/src/acp/handlers-session.mjs`：`applyConfigOption` `mode` 分支 `:80-84` + `session/set_mode` `:224-238`）· VSC 面板开关（`thincoder-vscode/src/extension/chat-panel.mjs` `_setPlanMode` `:314-319`）工程模式一律拒绝 + 提示可见（一条共用文案常量）；ACP `mode:"normal"` 照常接受（唯一合法态，幂等）。
3. **残留清零点** = 单点 helper `clearPlanMode(agent)`（`thincoder-core/agent-tools/plan.mjs` 新增：清 `planMode` + 两 reminder 计数 + **未注入的 plan 提示语**）；五个挂点 = 三翻转（核 `eng` 工具 `enter` `:85` · CLI `/eng` FIFO `:50` · VSC `handleSetEngineeringEnabled`）+ 两恢复（CLI `session-lifecycle.mjs:101/:111-114` · VSC `agent-state.mjs:110`）。
4. **提示词面** = **零改**（① 工程两档与中文模板零处指示 plan 模式；② 工具不注册已由结构兜底，加「不要用 plan」句 = 为不可见选项写限制（反模式）；③ `ENG_ON_REMINDER` 无 plan 字样）。
5. **测试面** = 判据集 T10–T14（设计档 §3.2）+ AC12–AC15（§3.1）：工程装配不含 `plan`（depth-0 + 子代理面）/ 普通含 / 四命令面拒绝 / 翻转清零 / 恢复清零 / 普通模式零回归。

**排除面矩阵结论（FR31 边界项 · 设计段裁定）**：

| 面 | 结论 | 理由（一句） |
|---|---|---|
| depth-0 主 agent · CLI | 排除 | 需求本体（用户实测场景） |
| depth-0 主 agent · VSC | 排除 | 同一产物两端同源（§13.2）；端差仅在「模式位由谁传」 |
| depth>0 子代理（eng-coder / eng-designer / explore · 工程模式） | **排除** | 子代理的「计划」= 任务书；话术冲突同在主代理；角色面已排除（role enum `family-tools.mjs:44-48` + spawn 门 `agent-tools/subagent.mjs:253-255`）而工具面留口 = 半排除；判据句最短（不带深度分支） |
| 普通模式（全深度 · 两端） | 不排除 | FR31 边界：普通模式零改 |

**受影响文件表**（file 级 + 每行改动面；行数 = 2026-09-21 实测；与设计档 §2.3 E7 表同源）：

| file | 行数 | 改动面 |
|---|---|---|
| `thincoder-core/agent/family-tools.mjs` | 174 | 固定段按 `engineering` 裁剪（`:173` 返回式）；`:27` 解构形态零改 |
| `thincoder-core/agent-tools/plan.mjs` | 86 | 新增 `clearPlanMode(agent)` + 拒绝文案常量 |
| `thincoder-core/agent-tools/eng.mjs` | 102 | `enter` 分支（翻态后）调 `clearPlanMode` |
| `thincoder-core/session-lifecycle.mjs` | 305 | 槽恢复面清零（`:101` + `:111-114` 之后） |
| `thincoder-cli/src/tui/cmd-plan.mjs` | 10 | 工程模式拒绝分支（提示行 + 零翻转） |
| `thincoder-cli/src/tui/cmd-eng.mjs` | 94 | ON 翻转后清零 + 槽 `data.planMode = false` + 提示行 |
| `thincoder-cli/src/acp/handlers-session.mjs` | 240 | `applyConfigOption` `mode` + `session/set_mode` 拒 plan |
| `thincoder-vscode/src/agent/setup.mjs` | 495 | 装配块（`:125-191`）下移 + 传 `engineering` |
| `thincoder-vscode/src/agent/agent-state.mjs` | 149 | `:110` 槽恢复清零 |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | `_setPlanMode` 拒绝（不写槽 + 回弹） |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 202 | eng 开关 ON ⇒ 调 `panel._setPlanMode(false)` |
| `thincoder-vscode/webview/mode-buttons.js` | 119 | plan 按钮 disabled + 点击守卫 |
| `thincoder-core/test/family-tools.test.mjs` | 131 | 工程模式固定段断言（含子代理面） |
| `thincoder-cli/test/cmd-plan.test.mjs` | 新建 | `/plan` 工程拒绝 + 普通回归 |
| `thincoder-cli/test/cmd-eng.test.mjs` | 124 | 清零断言（内存位 + 槽位） |
| `thincoder-cli/test/acp-contract.test.mjs` | 363 | `set_mode` / `set_config_option` 拒绝断言 |
| `thincoder-cli/test/session-store.test.mjs` | 389 | 恢复清零断言 |
| `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | 491 | 槽恢复清零断言 |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | 462 | `_setPlanMode` 拒绝断言 |

（测试面行 = 落点建议：判据以用例号 T10–T14 为准，实施段可就近并入更贴切的既有档。）

**验收判据（回指 FR31 四条；每条可机判）**：

| FR31 | 判据 | 用例 | 设计档 AC |
|---|---|---|---|
| ① 装配面不含 plan | 工程模式装配名集不含 `plan`（depth-0 + 子代理）；普通模式含 | T10 | AC12 |
| ② 命令面拒绝且提示可见 | `/plan` · ACP `set_mode` / `set_config_option` · VSC 面板开关四处拒绝；`planMode` 不变 | T11 | AC13 |
| ③ 开工程模式 `planMode` 强制 false | 三翻转点 + 两恢复点后 `planMode` 恒 false（含槽位） | T12 + T13 | AC14 |
| ④ 普通模式全带宽零回归 | 工具 / `/plan` / ACP / 恢复四路径不变，既有测试零改全绿 | T14 | AC15 |

**关键决策记录**（理由详版 = 设计档 §2.6 KD8–KD11）：KD8 卸载而非「注册 + 报错」· KD9 裁剪落点 = 核单源（端壳只补传模式位）· KD10 清零 = 单点 helper 复用（含未注入提示语过滤）· KD11 排除面 = 全深度 + 两端。

**未决项 / 观察项（交父侧）**：

1. **实施期实核一条**：VSC 深度>0 路径的工程模式真值来源（核 spawn 强制 `childConfig.agent.engineering = true`，`agent-tools/subagent-spawn.mjs:341-344`）——实测若子代理面派生为 false 而强制位为 true ⇒ 以强制位为准（判据 = eng-coder 子代理装配不含 `plan`），同批收正。
2. **相邻发现（不在本批范围）**：`thincoder-core/agent-tools/subagent-async.mjs:61` 注释陈旧（写「engineering → explore/plan/eng-coder」，与 role enum（`family-tools.mjs:44-48`）及 spawn 门（`subagent.mjs:253-255`）实况不符，且漏 `eng-designer`）——一行注释修正，归属请父侧裁定（本批或另行入账）。
3. **源扫描测试依赖提示**：`thincoder-core/test/tool-registry.test.mjs:102` 以源形态断言 `agent/setup.mjs` 不解构 `planTool`；本次裁剪不改 `family-tools.mjs:27` 解构形态 ⇒ 不触发，但实施段须保持该形态。

## §3 设计评审（评审子代理）

（待评审——用户点火。）

## §4 用户批准（主 agent）

（待 §3 后。）

## §5 实施记录（eng-coder）

（待批准后。）

## §6 验证与收口（父代理）

（待实施后。）
