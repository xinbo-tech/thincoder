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
- 同类过滤先例（同档）：`:44-49` 子代理角色 enum 互斥（工程 = eng-coder/eng-designer）· `:66-67` escalate 池装饰门（`action: (consultModels.length && !engineering)`——工程模式下装饰只对正常模式有意义）——「工程模式裁工具」非新机制；
- 话术冲突实锤：`PLAN_EXIT_REMINDER`（`thincoder-core/agent-tools/plan.mjs:21-23`）逐字含「Start implementing your plan … No need for … further confirmation」——与工程链条（设计 → 评审 → 批准 → token）直接打架。

**落点登记**：需求档 FR31 已落 `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.9（父侧落笔 · 需求档为父侧写域 · 可 revert）。

### 1.0 用户授权（父侧代点火 + 代批准 · 时限「自动跑」）（2026-09-21 01:21）

**用户原话**：「自动跑」⇒ 本批**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**，直到本批收口 ✓。

**父侧自缚（代签条件）**：① 仅当「评审 pass（0 🔴）∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备时代签；② 每次代签在 §4 写明「父侧代签（用户 01:21 授权）+ 依据（评审 id / 核验结论 / 发现处置表）」；③ 需**新范围**（本批之外）或**用户口径裁决** ⇒ 停下 ✓。

## §2 批次任务与设计（eng-designer）

（待设计——设计档落点 = `docs/core/design/ENGINEERING-MODE-V2.md`。）

**状态行**：✅ 设计就绪（评审发起权在用户）· 本段承接上方占位行（占位「待设计」语以本段为准）

**本批覆盖条目（1 条）**：

- **FR31「工程模式 plan 面排除」**——需求依据 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §13.9（父侧已落）；三条裁决 = ① 工具不注册（模型不可见）② 命令面同步禁 ③ 残留清零（用户 2026-09-21 00:57 批准）。

**明确不在本批（边界）**：

- 普通模式零改（plan 工具 / `/plan` / ACP `mode` / 槽恢复四路径全带宽）；
- **三条文本本体不改**（`PLAN_FULL_REMINDER` / `PLAN_SPARSE_REMINDER` / `PLAN_EXIT_REMINDER`——`thincoder-core/agent-tools/plan.mjs:11-23`，普通模式仍用）；
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
2. **命令面** = `/plan`（`thincoder-cli/src/tui/cmd-plan.mjs`）· ACP 两入口（`thincoder-cli/src/acp/handlers-session.mjs`：`applyConfigOption` `mode` 分支 `:80-84` + `session/set_mode` `:224-238`）· VSC 面板开关（`thincoder-vscode/src/extension/chat-panel.mjs` `_setPlanMode` `:314-319`）工程模式一律拒绝；
   逐面钉定（真值来源 / 出口形态 / 提示载体）= 设计档 §2.3 E7「命令面逐面钉定」表（TUI/ACP 共用文案常量；ACP = 前置判 + 携共用文案的 `INVALID_PARAMS`；VSC = 槽同源真值 + plan 按钮 disabled/title）；ACP `mode:"normal"` 照常接受（唯一合法态，幂等）。
3. **残留清零点** = 单点 helper `clearPlanMode(agent)`（`thincoder-core/agent-tools/plan.mjs` 新增：清 `planMode` + 两 reminder 计数 + **未注入的 plan 提示语**）；五个挂点 = 三翻转（核 `eng` 工具 `enter` `:85` · CLI `/eng` FIFO `:50` · VSC `handleSetEngineeringEnabled`）+ 两恢复（CLI `session-lifecycle.mjs:101/:111-114` · VSC `agent-state.mjs:110`）；恢复面**槽值一并收正**（VSC 水合槽回写 + `panel-session.mjs:129` 装载推送读生效值）。
4. **提示词面** = **零改**（① 工程两档与中文模板零处指示 plan 模式；② 工具不注册已由结构兜底，加「不要用 plan」句 = 为不可见选项写限制（反模式）；③ `ENG_ON_REMINDER` 无 plan 字样）。
5. **测试面** = 判据集 T10–T14（设计档 §3.2）+ AC12–AC15（§3.1）：工程装配不含 `plan`（depth-0 + 子代理面）/ 普通含 / 四命令面拒绝 / 翻转清零 / 恢复清零 / 普通模式零回归。

**排除面矩阵结论（FR31 边界项 · 设计段裁定）**：

| 面 | 结论 | 理由（一句） |
|---|---|---|
| depth-0 主 agent · CLI | 排除 | 需求本体（用户实测场景） |
| depth-0 主 agent · VSC | 排除 | 同一产物两端同源（§13.2）；端差仅在「模式位由谁传」 |
| depth>0 子代理（eng-coder / eng-designer / explore · 工程模式） | **排除** | 子代理的「计划」= 任务书；话术冲突同在主代理；角色面已排除（role enum `family-tools.mjs:44-48` + spawn 门 `agent-tools/subagent.mjs:253-255`）而工具面留口 = 半排除；判据句最短（不带深度分支） |
| 普通模式（全深度 · 两端） | 不排除 | FR31 边界：普通模式零改 |

**受影响文件表**（file 级 + 每行改动面；行数 = 2026-09-21 实测——口径 = 内容行数、不含文末空行；与设计档 §2.3 E7 表同源）：

| file | 行数 | 改动面 |
|---|---|---|
| `thincoder-core/agent/family-tools.mjs` | 174 | 固定段按 `engineering` 裁剪（`:173` 返回式）；`:27` 解构形态零改 |
| `thincoder-core/agent-tools/plan.mjs` | 86 | 新增 `clearPlanMode(agent)` + 拒绝文案常量 |
| `thincoder-core/agent-tools/eng.mjs` | 102 | `enter` 分支（翻态后）调 `clearPlanMode` |
| `thincoder-core/session-lifecycle.mjs` | 305 | 槽恢复面清零（`:101` + `:111-114` 之后；CLI 槽随内存值收正） |
| `thincoder-cli/src/tui/cmd-plan.mjs` | 10 | 工程模式拒绝分支（提示行 + 零翻转） |
| `thincoder-cli/src/tui/cmd-eng.mjs` | 94 | ON 翻转后清零 + 槽 `data.planMode = false` + 提示行 |
| `thincoder-cli/src/acp/handlers-session.mjs` | 240 | 两 handler 前置判 ⇒ 携共用文案的 `INVALID_PARAMS`（`applyConfigOption` 契约零改） |
| `thincoder-vscode/src/agent/setup.mjs` | 495 | 装配块（`:125-191`）下移 + 传 `engineering`；水合发现槽 `planMode:true` ∧ engineering ⇒ 槽回写 false（先例 `:277-279`） |
| `thincoder-vscode/src/agent/agent-state.mjs` | 149 | `:110` 生效值收正（engineering ⇒ `_planMode=false`） |
| `thincoder-vscode/src/extension/chat-panel.mjs` | 441 | `_setPlanMode` 拒绝（真值 = `agentSettings(_agentSettingsSession()).engineering`；不写槽 + 回弹） |
| `thincoder-vscode/src/extension/panel-messages-settings.mjs` | 202 | eng 开关 ON ⇒ 调 `panel._setPlanMode(false)` |
| `thincoder-vscode/webview/mode-buttons.js` | 119 | plan 按钮 disabled + title（`toolbar.planDisabled`）+ 点击守卫 |
| `thincoder-vscode/src/extension/panel-session.mjs` | 295 | `:129` 装载推送改读生效值（工程 ⇒ `active:false`） |
| `thincoder-vscode/src/extension/panel-messages.mjs` | 294 | `:133` 取槽同源 engineering 传入 `runVisionReader` |
| `thincoder-vscode/src/extension/image-handler.mjs` | 87 | `:84` 旁路 runAgent 携 `engState`（工程真值同源） |
| `thincoder-vscode/locales/en.json` · `zh.json` | 263 · 263 | 新增 `toolbar.planDisabled` 一键（两 locale 同步） |
| `thincoder-core/test/family-tools.test.mjs` | 131 | 工程模式固定段断言（含子代理面） |
| `thincoder-cli/test/cmd-plan.test.mjs` | 新建 | `/plan` 工程拒绝 + 普通回归 |
| `thincoder-cli/test/cmd-eng.test.mjs` | 124 | 清零断言（内存位 + 槽位） |
| `thincoder-cli/test/acp-contract.test.mjs` | 363 | `set_mode` / `set_config_option` 拒绝断言 |
| `thincoder-cli/test/session-store.test.mjs` | 389 | 恢复清零断言（恢复后槽 `planMode` 收正） |
| `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | 491 | 槽恢复清零断言（`_planMode` + 槽位） |
| `thincoder-vscode/test/chat-panel-messages.test.mjs` | 462 | `_setPlanMode` 拒绝断言（不写槽 + 回弹） |
| `thincoder-vscode/test/status-line.test.mjs` | 157 | plan 按钮 disabled + title 断言（happy-dom 真 chat.js 驱动全量 id fixture） |
| `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 208 | T5 fixture 两条工程行（`:121-127` eng-designer / eng-coder）删 `plan` + 增 explore 工程行（旁路面形状——`:193-199` 以 engineering=true 驱动；= T10 旁路面判据落点）；其余既有用例零改 |

（测试面行 = 落点建议：判据以用例号 T10–T14 为准，实施段可就近并入更贴切的既有档。）

**验收判据（回指 FR31 四条；每条可机判）**：

| FR31 | 判据 | 用例 | 设计档 AC |
|---|---|---|---|
| ① 装配面不含 plan | 工程模式装配名集不含 `plan`（depth-0 + 子代理：核 spawn 子代 + VSC 旁路面）；普通模式含 | T10 | AC12 |
| ② 命令面拒绝且提示可见 | `/plan` · ACP `set_mode` / `set_config_option` · VSC 面板开关四处拒绝；`planMode` 不变（ACP 携共用文案；VSC 按钮 disabled/title） | T11 | AC13 |
| ③ 开工程模式 `planMode` 强制 false | 三翻转点 + 两恢复点后 `planMode` 恒 false（含槽位） | T12 + T13 | AC14 |
| ④ 普通模式全带宽零回归 | 工具 / `/plan` / ACP / 恢复四路径不变，**除本批所列矩阵镜像收正外**既有测试零改全绿 | T14 | AC15 |

**关键决策记录**（理由详版 = 设计档 §2.6 KD8–KD11）：KD8 卸载而非「注册 + 报错」· KD9 裁剪落点 = 核单源（端壳只补传模式位）· KD10 清零 = 单点 helper 复用（含未注入提示语过滤）· KD11 排除面 = 全深度 + 两端。

**未决项 / 观察项（交父侧）**：

1. **实施期复核一条**（原「实核」已由端差面两条活体面钉定取代——评审轮 1 发现 #7 处置，见上）：实施段照常以「eng-coder 子代装配不含 `plan`」断言复核（强制位已成文 `agent-tools/subagent-spawn.mjs:341-344`）。
2. **相邻发现（不在本批范围）**：`thincoder-core/agent-tools/subagent-async.mjs:61` 注释陈旧（写「engineering → explore/plan/eng-coder」，与 role enum（`family-tools.mjs:44-48`）及 spawn 门（`subagent.mjs:253-255`）实况不符，且漏 `eng-designer`）——一行注释修正，**父侧裁定：已入账 台账 #158**（本批不做）。

3. **源扫描测试依赖提示**：`thincoder-core/test/tool-registry.test.mjs:102` 以源形态断言 `agent/setup.mjs` 不解构 `planTool`；本次裁剪不改 `family-tools.mjs:27` 解构形态 ⇒ 不触发，但实施段须保持该形态。

（父侧小项收正（2026-09-21 · 可 revert）：未决项 1 状态注随 #7 处置更新 · 未决项 2 归属裁定 = 台账 #158。）

**修正记录（评审轮 1 · 2026-09-21 · eng-designer）**——§3 发现表 #1–#10 逐号落点（设计档 + 本段面）：

| # | 级 | 落点 |
|---|---|---|
| 1 | 🔴 | 两表补 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（本段文件表 + 设计档 §2.3 E7 表；改动面 = T5 fixture 两条工程行删 `plan`）；设计 T14 / 本段判据 ④ 口径改「除本批所列矩阵镜像收正外，既有测试零改全绿」 |
| 2 | 🟡 | 设计档 §2.3 E7 新增「命令面逐面钉定」表（VSC 真值 = `agentSettings(_agentSettingsSession()).engineering`，先例 `chat-panel.mjs:359-364`；载体 = plan 按钮 disabled + title `toolbar.planDisabled`）+ AC13/T11 措辞对齐；边界行「不加新 i18n 键」收窄为「仅 `toolbar.planDisabled` 一键」 |
| 3 | 🟡 | T13 / AC14 纳入槽位 + 残留清零判据改「内存 + 槽位」（本段判据 ③ 原即「含槽位」口径，两侧对齐）；恢复面槽值收正 = VSC 水合槽回写（`setup.mjs`，先例 `:277-279`）+ `agent-state.mjs:110` 生效值 + `panel-session.mjs:129` 装载推送读生效值 |
| 4 | 🟡 | ACP 拒绝出口钉定 = 两 handler 前置判 ⇒ 携共用文案的 `INVALID_PARAMS`（`applyConfigOption` 布尔契约零改，`:212-215` 误导文案不可达）——设计档 E7 表 + 两表文件行 |
| 5 | 🟡 | 见下「§1 :25 边界申报」 |
| 6 | 🟡 | 设计档边界行改「三条 reminder 文本本体不改」（`PLAN_FULL_REMINDER` / `PLAN_SPARSE_REMINDER` / `PLAN_EXIT_REMINDER`——`plan.mjs:11/17/21`）；本段原文即「三条」口径（保持） |
| 7 | 🟡 | 设计档端差面 depth>0 改「两条活体面」逐条钉定：① 核 spawn 强制位 `subagent-spawn.mjs:341-344`（附证：子代执行 `subagent-async.mjs:17-19` · `:308`）② VSC 旁路面 `image-handler.mjs:84` ⇒ 本批补传（两表 +2 文件行；AC12/T10 判据随补） |
| 8 | 🔵 | 设计档判据链 + §2.4 依赖表改「core 侧五处（示例）」+ 补列 VSC 载体面（`tool-gates.mjs:73` · `agent.mjs:419`）/ 槽写面（`token-ttl.mjs:256` · `session-slot-write.mjs:131` · `session-lifecycle.mjs:250`） |
| 9 | 🔵 | 设计档 §4 记录段时序收正（2026-09-21 行移至段末）+ 本批修正行续其后 |
| 10 | 🔵 | 设计档拆分方案节「净增 ±0 行」→「净增 +1 行」（等量位移 + 1 行入参）；F12 口径句 = 需求档面，父侧处置 |

**§1 :25 边界申报（🟡#5）**：该句（consult 家族按 `!engineering` 不注册）位于本批档 **§1 = 主 agent 写域**（一段一作者；本轮授权面 = 设计档 + §2），子代理无写权 ⇒ 未改，请父侧自改。

正确读法（本节收正；实施与评审以此为准）：先例 = `thincoder-core/agent/family-tools.mjs:44-49`（角色 enum 互斥）· `:66-67`（escalate 池装饰门——工程模式 escalate 拒在 execute 层 `thincoder-core/agent-tools/subagent-actions.mjs:349`）；
consult 家族注册门 = `consultModels.length`（`:135-137`），与 `engineering` 无关。

**修正记录（评审轮 2 · 2026-09-21 · eng-designer）**——§3 发现表 #11–#13 逐号落点（设计档 + 本段面）：

| # | 级 | 落点 |
|---|---|---|
| 11 | 🔵 | `test/status-line.test.mjs` 行「行数」列由描述改**实测行数 157**（口径 = 内容行数、不含文末空行——以表内既有行实读核对：`family-tools.mjs` 174 / `plan.mjs` 86 / 本档 host-shape 208）；两表同步（设计 `:417` · 本段 `:105`）；原描述语移入「改动面」列保留 |
| 12 | 🔵 | 五处新增行行数按同口径收正：`panel-session.mjs` 296→**295** · `panel-messages.mjs` 295→**294** · `image-handler.mjs` 88→**87** · `locales/en.json` · `zh.json` 264·264→**263·263**（两表同步：设计 `:405-408` · 本段 `:94-97`） |
| 13 | 🔵 | VSC 旁路面判据（设计 `:513` T10）落点钉定 = 扩 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` T5 用例集（增 explore + engineering=true 一例——`:193-199` 驱动块同款形状、`engState.enabled` 驱动 ⇒ 名集不含 `plan`）；两表该行改动面同步（设计 `:416` · 本段 `:106`）=「T5 fixture 两条工程行删 `plan` + 增 explore 工程行（旁路面形状）」，「其余断言零改」→「其余既有用例零改」；设计 T14 括注同步（`:517`）——#13 派生的同源枚举同步（非新语义） |

（落点选择依据（实读）：视觉渠道档 `test/image-downgrade.test.mjs` 直调 `runVisionReader`（`:101`/`:103`/`:212` 调用形态），入参面无 `engState` ⇒ 换落点须为其补新参（超出本批改动面）；host-shape T5 的 `:193-199` 驱动块已以 `engState.enabled` 走生产 hydrate 入口 ⇒ 维持父侧钉定落点。）

（父侧小项收正（2026-09-21 · 可 revert）：两表表头补口径声明（内容行数、不含文末空行——防 #11/#12 一类口径漂移复发）。）

## §3 设计评审（评审子代理）

（待评审——用户点火。）

### 轮次 1（评审子代理）

**评审对象**：#155 工程模式 plan 面排除（FR31）——需求档 §13.9 ↔ 设计档 §2.3 E7 / §2.4 / §2.6 KD8–KD11 / §3 AC12–AC15 + T10–T14 ↔ 批档 §2（声明见评审发起方）。**方法**：三档全文实读 + 被引代码坐标逐条实核（as-of 本轮磁盘状态）。行数标注抽查结论 = 全部与内容行数一致（含 495/174/86/102/305/10/94/240/149/441/202/119/131/124/363/389/491/462 各行；差异源为文末空行，非错标）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Affected files | 🔴 | 受影响文件表漏挂必改档：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（208 行）不在设计档 E7 表亦不在批档 §2 表（`thincoder/docs/core/design/ENGINEERING-MODE-V2.md:378-398` · `thincoder/docs/batches/2026-09-21-eng-plan-exclusion.md:79-99` 各 19 行，均无该档）。该档在 VSC 集成测试清单内（`thincoder-vscode/test/integration/files.mjs:17` ⇒ 随 `npm test` 执行），其 T5 的 `FAMILY_FIXTURE`（`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:121-127`）工程行含 `"plan"`，且以 `engineering=true` 驱动（同档 `:194` `["eng-designer","eng-designer",true]` / `["eng-coder","eng-coder",true]` → `hostShape` 于 `:134` 传 `engState:{enabled:true}` → `applySlotSessionState` 派生 engineering=true，`thincoder-vscode/src/agent/agent-state.mjs:88-91`）。按设计档自身的规则（`:347` 固定段按 `engineering` 裁剪；`:363` VSC 须补传、装配入参 = 工程模式真值；KD11 全深度）该两行名集必失 `plan` ⇒ `:199` 的 `deepEqual` 必红。该档正是核档自认的「同 fixture 口径」端侧断言（`thincoder-core/test/family-tools.test.mjs:9-10`「端侧断言（host-shape-spawn.test.mjs T5）与本档同 fixture 口径」）。而 T14 的「既有测试零改全绿」（`ENGINEERING-MODE-V2.md:497`）以此为门 ⇒ 设计按现状落地即门红。 | 受影响文件表补该行（208 行 + 预计增量/等量改写）；改动面写明 T5 两条工程行 fixture 收正（除 `plan`），或明写 VSC 侧装配入参只到 depth-0 并同步收窄 KD11/AC12 的子代理面判据——二者取一，不得留双解。 |
| 2 | Clarity | 🟡 | VSC 命令面拒绝的「真值来源」与「提示可见」载体均未落档：设计档只写「VSC 面板开关 … 一律拒绝 + 提示可见（一条共用文案常量）」（`ENGINEERING-MODE-V2.md:348`）与「`_setPlanMode` 工程模式拒绝（不写槽 + 回弹）」（`:389`），而 `_setPlanMode` 现值不看工程位（`thincoder-vscode/src/extension/chat-panel.mjs:314-319`），真相源候选里 `panel._agent` 在会话装载点被置 null（`thincoder-vscode/src/extension/panel-session.mjs:113`）⇒ 恢复后的工程会话在首回合前用 `_agent` 判会 fail-open；提示侧无通道（按钮 disabled 后点击不触发 `chat-panel.mjs` 任何推送，`:390-392` 只有按钮态；`ENGINEERING-MODE-V2.md:404` 明写「VSC 不加新 i18n 键」），AC13/T11 的「提示可见」在 VSC 面无可判载体。 | 钉死 VSC 侧两件：① 工程真值读取点（槽/设置快照面可用——`chat-panel.mjs:359-364` `_agentSettingsSession` 先例）；② 拒绝提示的可见载体（如既有 `statusText` 通道，`thincoder-vscode/webview/chat.js:279`），或显式声明「disabled + title」即视为提示并把 AC13/T11 措辞对齐。 |
| 3 | Clarity | 🟡 | VSC 恢复面只清内存、槽值可残留，且批档验收与设计判据不同幅：批档判据写「三翻转点 + 两恢复点后 `planMode` 恒 false（**含槽位**）」（`2026-09-21-eng-plan-exclusion.md:109`），设计 T13 只断言 `_planMode`（`ENGINEERING-MODE-V2.md:496`），file 表亦只写「`:110` 槽恢复清零」（`:388`）；而 VSC 槽只有 `_setPlanMode` 会改（槽保存面 `thincoder-vscode/src/extension/panel-session-write.mjs:77` 用 `existing.planMode ?? false` 保留旧值），boot/装载面每轮把槽值推回面板（`thincoder-vscode/src/extension/panel-session.mjs:129`）⇒ 槽 `{engineering:true, planMode:true}` 场景下工程模式开着而按钮/状态条仍显示 plan-active（正是 FR31 ③ 要消灭的半状态，且随每次装载重推）。 | 恢复面把槽值一并收正（或装载推送改读生效值）；并把该面纳入 T13/AC14 判据，使批档「含槽位」口径与设计判据一致。 |
| 4 | Clarity | 🟡 | ACP 拒绝的出口语义未钉：`applyConfigOption` 现契约为布尔（`thincoder-cli/src/acp/handlers-session.mjs:62-88`），唯一调用点把 `false` 一律映成 `unknown configId: ${configId}`（同档 `:212-215`）——若工程模式拒 plan 也走 `false`，客户端看到的逐字提示与「共用文案常量 / 非静默失败」（`ENGINEERING-MODE-V2.md:348` · `:386`）相抵，AC13/T11 的「拒绝 + 提示可见」在 ACP 面变成误导文案。 | 在设计中写明拒绝的出口形态（结构化原因 / handler 前置判 + 专用错误分支），使 `mode` 分支的拒绝可携共用文案返回。 |
| 5 | Requirements | 🟡 | 先例引证与实读不符（需求档与批档同句）：`thincoder/docs/core/requirements/ENGINEERING-MODE-V2.md:697` 与 `2026-09-21-eng-plan-exclusion.md:25` 写「`:67`（consult 家族按 `!engineering` 不注册）」——实读 `thincoder-core/agent/family-tools.mjs:67` 为 `filteredSubagent` 内 **escalate 池装饰**门（注释 `:66`；工程模式的 escalate 拒在 execute 层 `thincoder-core/agent-tools/subagent-actions.mjs:349`），consult 家族注册门 = `consultModels.length`（同档 `:135-137`），与 `engineering` 无关。 | 把该先例句改为实读形态：`:44-49`（角色 enum 互斥）· `:66-67`（escalate 装饰门）+ execute 层拒（`subagent-actions.mjs:349`）；「consult 家族不注册」表述删除。 |
| 6 | Requirements | 🟡 | reminder 文本计数互斥：需求档与设计档写「**两条** reminder 文本本体不改」（`ENGINEERING-MODE-V2.md:696` · `ENGINEERING-MODE-V2.md:404`，后者引 `plan.mjs:11-23`），批档写「`PLAN_FULL/SPARSE/EXIT_REMINDER` **三条**」（`2026-09-21-eng-plan-exclusion.md:49`）——该行段实为三常量（`thincoder-core/agent-tools/plan.mjs:11` · `:17` · `:21`），且 KD10 的清零过滤正需覆盖 EXIT 一条（`ENGINEERING-MODE-V2.md:455`）。 | 统一为「三条（FULL / SPARSE / EXIT）」或逐名列出，保持 D3 计数与列表一致。 |
| 7 | Requirements | 🟡 | VSC depth>0 真值来源枚举不完备：设计档实核项只覆盖核 spawn 强制位一条（`ENGINEERING-MODE-V2.md:364`），而 VSC 另有一条活体 depth>0 装配面——视觉渠道子代理 `runAgent(..., { depth: 1, role: "explore" })`（`thincoder-vscode/src/extension/image-handler.mjs:84`），它不传 `engState`/`engPersist` ⇒ 工程真值走 config.json 镜像回退（`thincoder-vscode/src/agent/setup.mjs:250-252` · `agent-state.mjs:88-91`），而镜像只在面板开关处置写（`thincoder-vscode/src/extension/panel-messages-settings.mjs:171-176`）——经核 `eng` 工具/CLI 侧开的工程会话该面可派生 false ⇒ 该子代理装配仍含 `plan`，与 KD11/AC12「子代理面不含 plan」相抵。附证：核 spawn 子代面本身可闭环（子代执行走核 `runChildPipeline → runAgent`，`thincoder-core/agent-tools/subagent-async.mjs:17-19` · `:308`；强制位 = `thincoder-core/agent-tools/subagent-spawn.mjs:341-344`）⇒ 未决项 #1 剩余风险面即此条。 | 实核项扩到「VSC 全部 depth>0 装配面」（含视觉渠道子代理），并为该面钉定工程真值来源（槽权威或强制位），或在 AC12 注明子代理面判据只锁 spawn 子代并登记该例外。 |
| 8 | Clarity | 🔵 | 「五处消费面零改」为择要枚举而非全列（`ENGINEERING-MODE-V2.md:423`）：同不变量下另有 VSC 载体消费面（`thincoder-vscode/src/agent/tool-gates.mjs:73` · `thincoder-vscode/src/agent.mjs:419` `:434-437`）与槽写面（`thincoder-core/token-ttl.mjs:256` · `thincoder-core/session-slot-write.mjs:130-132`、`thincoder-core/session-lifecycle.mjs:250`）。 | 行文改「core 侧五处（示例）」或补全清单，避免「N 处」被读成穷举。 |
| 9 | Doc hygiene | 🔵 | 变更记录插入点破坏时序：新增 2026-09-21 行置于 2026-09-18 行之前（`ENGINEERING-MODE-V2.md:520-522` vs `:523-524`）。 | 追加到记录段末尾（保持时间序）。 |
| 10 | Clarity | 🔵 | 拆分方案节自证句矛盾：「本批净增 ±0 行（等量位移 + 1 行入参）」（`ENGINEERING-MODE-V2.md:400`）实为净 +1；另 F12「超限档本批拆」（`thincoder/docs/core/requirements/ENGINEERING-MODE-V2.md:631`）与「本批不执行」的批档边界（`2026-09-21-eng-plan-exclusion.md:52`）措辞张力——按既有裁定不改判，仅登记。 | 改「净增 +1 行（等量位移 + 1 行入参）」；F12 口径句由需求档侧标注软/硬线适用（软线 = 触发拆分评审，硬线 = 本批必拆）。 |

**计数**：发现 10 条 = 🔴 1 · 🟡 6 · 🔵 3。行数标注抽查 = 全数相符（无 🔵 级漂移）。需求覆盖 = FR31 三条裁决 + 四条验收均落档；边界（普通模式零改 / reminder 文本不改 / 不新增机械门）齐。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：#155 工程模式 plan 面排除（FR31）——轮次 2（验证轮 1 发现 #1–#10 处置落地 + 例行评审）。**方法**：三档全文实读 + 被引坐标/行数逐条实核（as-of 本轮磁盘状态）。**覆盖**：需求档 §13.9 ↔ 设计档 §2.3 E7 / §2.4 / §2.6 KD8–KD11 / §3.1 AC12–AC15 / §3.2 T10–T14 ↔ 批档 §1/§2。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/core/design/ENGINEERING-MODE-V2.md:416` · `docs/batches/2026-09-21-eng-plan-exclusion.md:106` | 🔴 | Fixed | 两表补齐 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（208 行）+ 改动面 = T5 fixture `:121-127` 的 eng-designer / eng-coder 两行删 `plan`（`:193-199` 以 engineering=true 驱动——本轮实读与实测口径相符）；T14（设计 `:517`）与批档判据 ④（`:117`）口径同步改「除本批所列矩阵镜像收正外」。 |
| 2 | 2 | `ENGINEERING-MODE-V2.md:351-357` · `:424` | 🟡 | Fixed | 新增「命令面逐面钉定」表：VSC 真值 = `agentSettings(_agentSettingsSession()).engineering`（实核 `settings.mjs:196` = `engineering: slotData?.engineering ?? s.engineering`（槽优先）✓ · `chat-panel.mjs:359-364` ✓）；提示载体 = plan 按钮 disabled + title（新键 `toolbar.planDisabled`，两 locale；`mode-buttons.js:16-23` 现无 disabled/title —— 改动面成立）；边界行收窄为「仅一条 i18n 键」。 |
| 3 | 3 | `ENGINEERING-MODE-V2.md:396/:400/:401/:405/:498/:516` | 🟡 | Fixed | T13/AC14 纳入槽位（「内存 + 槽位」）；恢复面槽值收正 = VSC 水合槽回写（先例 `:277-279` = 水合发现槽内过期项回写，实核 ✓）+ agent-state 生效值 + `panel-session.mjs:129` 装载推送改读生效值；CLI 侧明文「下次保存随内存值收正」。 |
| 4 | 4 | `ENGINEERING-MODE-V2.md:356` · `:399` · `docs/batches/…:88` | 🟡 | Fixed | ACP 拒绝出口钉定 = 两 handler 前置判 + 携共用文案的 `INVALID_PARAMS`；`applyConfigOption` 布尔契约零改（`false` 仍 = `unknown configId`——工程拒绝不经该路径，误导文案不可达）。 |
| 5 | 5 | `docs/core/requirements/ENGINEERING-MODE-V2.md:697` · `docs/batches/…:25` | 🟡 | Fixed | 先例句已改实读形态（`:44-49` 角色 enum 互斥 · `:66-67` escalate 池装饰门 + execute 层拒）；批档 §1:25 亦已收正；§2:147-148 附「正确读法」。残留（不另计）：§2:145 仍写「未改，请父侧自改」——§1:25 实已收正，属过程记录滞后一行。 |
| 6 | 6 | `requirements:696` · `ENGINEERING-MODE-V2.md:423` | 🟡 | Fixed | 两侧均改「三条 reminder 文本本体不改」+ 三常量逐名（`plan.mjs:11` · `:17` · `:21`），与批档 §1:49 口径一致。 |
| 7 | 7 | `ENGINEERING-MODE-V2.md:372-377` · `:496` · `:513` · 两表新增 2 文件行 | 🟡 | Fixed | depth>0 改「两条活体面」逐条钉定：① 核 spawn 强制位（`subagent-spawn.mjs:341-344`）；② VSC 旁路面（`image-handler.mjs:84` 携 `engState`；`panel-messages.mjs:133` 传槽同源 engineering）。实核：VSC `runAgent(provider, cwd, input, callbacks, signal, autoApprove, opts)`（`agent.mjs:53`）第 7 参 = opts → `hydrateRun` ✓ ⇒ 无需额外改 `agent.mjs`（不在表内成立）；AC12/T10 判据随补。 |
| 8 | 8 | `ENGINEERING-MODE-V2.md:385-386` · `:443` | 🔵 | Fixed | 改「core 侧五处（示例）」+ §2.4 行补 VSC 载体面 / 槽写面清单，标注「全部零改」。 |
| 9 | 9 | `ENGINEERING-MODE-V2.md:542-549` | 🔵 | Fixed | 变更记录时序收正（2026-09-21 两条移至 09-18 行之后）。 |
| 10 | 10 | `ENGINEERING-MODE-V2.md:419` | 🔵 | Fixed | 「净增 ±0 行」→「净增 **+1 行**」✓；次级项（F12 口径句 = `requirements:631` 仍为「超限档本批拆」原句）转新行 14。 |
| 11 | (new) | `ENGINEERING-MODE-V2.md:417` · `docs/batches/…:105` | 🔵 | New | `test/status-line.test.mjs` 行「行数」列填的是描述（「全量 id fixture 同族（happy-dom 真 chat.js 驱动）」/「happy-dom 真 chat.js 驱动同族」）而非行数 ⇒ 受影响文件表缺该档当前行数标注。 |
| 12 | (new) | `ENGINEERING-MODE-V2.md:405/:406/:407/:408` · `docs/batches/…:94-97` | 🔵 | New | 新增行行数口径与表内既有行不一致（含文末空行，+1）：实读 `panel-session.mjs:295` = `  }`（`:296` 空）↔ 表 296；`panel-messages.mjs:294` = `}`（`:295` 空）↔ 表 295；`image-handler.mjs:87` = `}`（`:88` 空）↔ 表 88；`locales/en.json:263` = `}` 与 `zh.json:263` = `}`（各 `:264` 空）↔ 表 264 · 264。 |
| 13 | (new) | `ENGINEERING-MODE-V2.md:513` · `:389` | 🔵 | New | T10 新增的「VSC 旁路面」判据在两表测试行中无对应落点（现有行 = host-shape T5「其余断言零改」+ panel-messages 的 `_setPlanMode` 断言；最贴近的视觉渠道测试档 `thincoder-vscode/test/image-downgrade.test.mjs`（仓内实存）未列入）⇒ 判据落点靠「就近并入更贴切的既有档」自由度兜底。 |
| 14 | (new) | `docs/core/requirements/ENGINEERING-MODE-V2.md:631` | 🔵 | New | F12「超限档本批拆」口径句未加软/硬线适用注（≠ 本批边界结论本身；批档 `:143` 已裁「需求档面，父侧处置」）。 |

**计数**：本轮 = 🔴 0 · 🟡 0 · 🔵 4（新）；轮 1 发现 #1–#10 = 全部 Fixed（#5 残留 1 行过程记录滞后 · #10 次级项转行 14）。行数抽查 = 其余行与内容行数一致；新增 5 处口径 +1（行 12）。**覆盖**：FR31 三条裁决 + 四条验收齐（判据 = T10–T14 / AC12–AC15）；边界（普通模式零改 / reminder 文本 / 不新增机械门 / 提示词零改 / VSC setup 拆分不执行）齐。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 01:21「自动跑」授权 · 代签三条件齐备）**：

- 依据 ① **评审 pass**：§3 轮次 2 = 🔴 0 · 🟡 0 · 🔵 4（`:196`），无阻塞项；
- 依据 ② **修正轮已落地并逐条核验**：轮 1 十项（§2 修正记录 `:127-148`）+ 轮 2 四项（#11/#12/#13 = §2 修正记录（评审轮 2）`:150-158`；#14 = F12 口径句，需求档 `docs/core/requirements/ENGINEERING-MODE-V2.md:631` 父侧收正）；父侧独立复核（2026-09-21 01:5x）= 改档实读 ✓ · doc-check 复跑 exit 0 ✓ · 两表表头口径声明补行（父侧小项收正 ✓ 可 revert）；
- 依据 ③ **token 已签发**（评审通过即发——不落值）。

**批准 = 本批设计（E7 五面 + 命令面逐面钉定 + 两条活体面 + 受影响文件表 25 行 + T10–T14 / AC12–AC15）为正式设计，准予实施** ✓。

## §5 实施记录（eng-coder）

（待批准后。）

**状态行**：✅ 实施完成（三端全绿 + 内部偏差审计 + advisor 代码评审 pass）· 待父侧 §6 收口

**交付摘要**：FR31 五面落地——① 装配面（核单源按 `engineering` 裁剪 + VSC 补传模式位 / 装配块下移）② 命令面（CLI `/plan` · ACP 两 handler 前置判 · VSC 宿主拒绝 + 按钮 disabled/title/点击守卫 + 两 locale 新键）③ 残留清零（单点 `clearPlanMode` + 三翻转 + 两恢复 + 槽位收正）④ 提示词面零改 ⑤ 测试面 T10–T14 / AC12–AC15。

**判据号 → 落点**（实施 file:line ↔ 判据 file:line）：

| 判据 | 实施落点 | 判据落点（测试） |
|---|---|---|
| FR31 ① / AC12 / T10 | 核裁剪 `thincoder-core/agent/family-tools.mjs:178-180` · VSC 补传+下移 `thincoder-vscode/src/agent/setup.mjs:216-241`（`:229 engineering`）· 旁路面 `thincoder-vscode/src/extension/panel-messages.mjs:137` → `thincoder-vscode/src/extension/image-handler.mjs:87` | `thincoder-core/test/family-tools.test.mjs:73-95` · `thincoder-vscode/test/integration/host-shape-spawn.test.mjs:124-131` + `:197-203` |
| FR31 ② / AC13 / T11 | CLI `thincoder-cli/src/tui/cmd-plan.mjs:12-15` · ACP `thincoder-cli/src/acp/handlers-session.mjs:221-223`（set_config_option）+ `:246-248`（set_mode）· VSC 宿主 `thincoder-vscode/src/extension/chat-panel.mjs:319-333` · 界面 `thincoder-vscode/webview/mode-buttons.js:27-31`+`:44-50` · i18n `thincoder-vscode/locales/en.json:24` · `thincoder-vscode/locales/zh.json:24` | `thincoder-cli/test/cmd-plan.test.mjs:26-40` · `thincoder-cli/test/acp-contract.test.mjs:194-215` · `thincoder-vscode/test/chat-panel-messages.test.mjs:470-500` · `thincoder-vscode/test/status-line.test.mjs:163-198` |
| FR31 ③ / AC14 / T12 | 单点 `thincoder-core/agent-tools/plan.mjs:35`（共用文案常量）+ `:38-61`（`clearPlanMode`）· 三翻转 `thincoder-core/agent-tools/eng.mjs:87-89` · `thincoder-cli/src/tui/cmd-eng.mjs:52-54` · `thincoder-vscode/src/extension/panel-messages-settings.mjs:171-181` · 槽位 `thincoder-cli/src/tui/cmd-eng.mjs:100` | `thincoder-cli/test/cmd-eng.test.mjs:131-167` · `thincoder-core/test/tool-seams-agent.test.mjs:121-145` · `thincoder-vscode/test/chat-panel-messages.test.mjs:470-500` |
| FR31 ③ / AC14 / T13（恢复面） | CLI `thincoder-core/session-lifecycle.mjs:116-119`（内存；槽随下次保存收正 `thincoder-core/session.mjs:128`）· VSC `thincoder-vscode/src/agent/agent-state.mjs:110-127` · 槽回写 `thincoder-vscode/src/agent/setup.mjs:211-214` · 装载推送 `thincoder-vscode/src/extension/panel-session.mjs:128-132` | `thincoder-cli/test/session-store.test.mjs:384-405` · `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs:213` + `:224-230` |
| FR31 ④ / AC15 / T14 | 普通支路逐字（`thincoder-core/agent/family-tools.mjs:180` · `thincoder-cli/src/tui/cmd-plan.mjs:16-18` · ACP 未改 · 两恢复面以 `engineering === true` 为门） | `thincoder-cli/test/cmd-plan.test.mjs:42-53` · `thincoder-cli/test/acp-contract.test.mjs:217-238` · 三端既有用例零改全绿（矩阵镜像收正 = `host-shape-spawn.test.mjs:126-131` 两工程行删 plan + 增 `explore-eng` 行） |

**三端验证读数**（cwd = 各项目根 · 命令 `node test/run.mjs`）：

- 核 `thincoder-core`：`tests 449 / pass 449 / fail 0`
- CLI `thincoder-cli`：`tests 760 / pass 760 / fail 0`
- VSC `thincoder-vscode`：`tests 865 / pass 865 / fail 0`

**实施期端到端复核读数**（一次性脚手架，跑完即删；未入库）：CLI 路径真装配（核 `prepareRun`，depth 0）＝ 工程 `task,timer,subagent,…`（无 plan）· 普通 `task,plan,timer,…`（含 plan）；eng-designer 子代真链（`gateEngCoderSpawn` + `buildSpawnChild` + `prepareRun`）＝ 强制位 `engineering:true` ⇒ `task,timer,notify_parent,batch_segment,subagent`（无 plan）——**未决项 1 复核 ✓**。

**决策透明表**（实施期自决 4 条）：

| # | 决策 | 理由 | 依据 |
|---|---|---|---|
| D1 | VSC `_setPlanMode` 仅锁**开方向**（`value === true` 拒绝）；`false` 走既有槽写契约 | 设计同段落并存「工程模式一律拒绝」与「`handleSetEngineeringEnabled` ON ⇒ 调 `panel._setPlanMode(false)`」；若 false 亦拒写 ⇒ T12「槽 planMode=false（VSC）」无落点。关方向 = 归零语义（工程态下只会清残留，不产生半状态） | 设计档 §2.3 E7 命令面钉定表 VSC 行 + 文件表 `panel-messages-settings.mjs` 行 |
| D2 | VSC 恢复面除 `_planMode` 外，一并摘除**槽回填的未注入 plan 提示语**（`agent-state.mjs:127` 复用单点） | E7 ③ 结构行与 KD10 明写「两个恢复点复用 `clearPlanMode`（含未注入提示语过滤）」；只收 `_planMode` 会留下 `PLAN_EXIT_REMINDER` 跨模式落地口（VSC 逐回合注入 `_pendingReminders`） | 设计档 §2.3 E7 ③ 行 · §2.6 KD10 |
| D3 | T12 核 `eng` 工具翻转点落 `thincoder-core/test/tool-seams-agent.test.mjs`（表外档） | 两表测试行无该落点；批档 `:108` 明授权「测试面行 = 落点建议：判据以用例号 T10–T14 为准，实施段可就近并入更贴切的既有档」（该档已是 eng 工具 #91 用例之家） | 批档 §2 测试面注 + 判据 ③ |
| D4 | 行数压缩以守 ≤500 硬限（`setup.mjs` 499 · 两测试档 500）：注释合并、断言行合并，无逻辑变化 | 触碰后三档越限 ⇒ 违反项目硬限；拆分方案仅 `setup.mjs` 一条已登记（本批不执行），两测试档无拆分授权 | 项目约定「≤ 500 lines hard limit」+ 设计档 §2.3 E7 拆分方案节 |

**面外披露**（表外 + 需父侧/设计段收正）：

1. **表外档 1 个**：`thincoder-core/test/tool-seams-agent.test.mjs`（D3——批档 `:108` 口径内）；
2. **设计档行数自证句漂移**：`setup.mjs` 实为 495 → **499**（净增 **+4**，设计档 §2.3 E7 拆分方案节自证「本批净增 **+1 行**」）——设计档非本角色写域，请父侧/设计段按实收正（不涉机制）；
3. **两表「行数」列整体为设计时实测**（实施后实际值，供下次触碰或 §6 收正）：family-tools 181 · plan.mjs 120 · eng.mjs 106 · session-lifecycle 310 · cmd-plan 19 · cmd-eng 104 · handlers-session 257 · vsc setup 499 · agent-state 158 · chat-panel 455 · panel-messages-settings 208 · mode-buttons 130 · panel-session 298 · panel-messages 300（读侧计数）· image-handler 90 · locales 263 · 263 · family-tools.test 156 · cmd-plan.test 53 · cmd-eng.test 167 · acp-contract 411 · session-store 417 · agent-lifecycle 500 · chat-panel-messages 500 · status-line 198 · host-shape 214（口径 = 内容行数，不含文末空行）；
4. **相邻观察项（本批不做）**：① VSC 翻转点在**在飞回合内**只收正槽位（活体 `agent.config.agent.engineering` / `planMode` 由下一次 hydrate 收正）——该回合剩余轮次内 `planMode` 可仍为 true 且当轮表内仍有 plan（= 设计边界：VSC 真值 = 槽权威 + 不新增机械门）；② VSC 旁路面 `engState` 活体传递链无直接用例（T10 判据按父侧钉定落装配入参面 `host-shape T5`）；③ 两测试档压线 500（零余量，下次触碰前需拆分或外提用例）。

**审计与代码评审轮次与终态**：

- **内部偏差审计（explore 子代 · 只读）轮次 1**：1 🔴（= §5 未写入——协议时序：§5 于实施完成后写）+ 🔵 4（表外档未登记 / 临时脚手架残留 / T10 第四格输入面 `{depth:1, role:"plan"}` 未断言 / 两表行数漂移）；处置：① 补断言 `thincoder-core/test/family-tools.test.mjs:92-94` ② 删 `.thincoder/tmp` 脚手架 3 档 ③ 本段（§5） ④ 行数漂移入本段面外披露第 2/3 条。
- **advisor 代码评审（type=code）轮次 1**：**VERDICT: pass**（0 🔴；🟡 2 = 文件行数软线（7 档 >300，其中两测试档压线 500）+ §5 协调项（本段即其落点）；🔵 4 = 表外档记录面 / 行数漂移 / VSC 翻转点回合内残窗登记 / 旁路面用例缺口）——🟡🔵 均为**登记项，无 must-fix**。
- **终态：clean**（fix round 1 内收敛，无未完项）。

**未做清单（本批边界内明确不做）**：需求档/设计档/§1–§4/§6 未触碰（他段写域）· 表外档 0（除 D3 授权档）· VSC `setup.mjs` 拆分未执行（改动后 499 行，未越 500 硬限 ⇒ 触发条件未成立）· 提示词档零改 · 无新增机械门 · 三条 reminder 文本本体逐字未改（`thincoder-core/agent-tools/plan.mjs:11` · `:17` · `:21`）。

（占位收正注：本段首行「状态行」承接上方占位行「（待批准后。）」——占位语以本段为准，同 §2 先例。）

## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-21

**父侧验证（承 §5 交付）**：

- **三端独立复跑**（父侧实跑 · cwd = 各项目根 · `node test/run.mjs`）：核 **449/449** exit 0 · CLI **exit 0** · VSC **exit 0** ✓（与 §5 自报一致）。
- **承重面抽验**（实读）：核裁剪 `thincoder-core/agent/family-tools.mjs:173-181` = `engineering ? [taskTool, timerTool, …] : [taskTool, planTool, timerTool, …]`（注释含 FR31 / KD8 / KD11 与判据单点句）✓；`setup.mjs` 499 · 两测试档 500 = 未越硬限 ✓（§5 面外披露 2/3 采信）。
- **未决项 1 复核**（实施期 E2E）：CLI depth-0 工程装配无 `plan` / 普通含 `plan`；eng-designer 子代真链 = `engineering:true` ⇒ 无 `plan` ✓。
- **内部审计 + 代码评审**：审计轮 1（1🔴 协议时序 + 4🔵）处置完毕；advisor `type=code` 轮 1 = **pass**（0🔴 / 2🟡 / 4🔵——均登记级）⇒ 终态 clean ✓。

**D7 结算清单**：

- **角色表**：设计 = eng-designer #28（设计轮）/ #33 · #35（修正轮）· 评审 = #34（轮 2 pass）· 实施 = eng-coder #37（内审 + 代码评审 pass）· 收口 = 父侧。
- **状态行**：§2 / §5 完成态 → **已收口**（本段）· 整档冻结（不再回改）。
- **计数**：三端测试 = §5 读数（与本段独立复跑一致）；受影响文件 = 表内 26 档 + 表外授权 1 档（`tool-seams-agent.test.mjs`——批档：108 口径内 ✓）。
- **指针**：需求档 §13.9 FR31 ↔ 设计档 §2.3 E7 ↔ 本批档 ↔ §5 落点表——四方同源 ✓。
- **变更记录**：设计档 / 需求档条目已在档（本批）；批档本档自洽。
- **待办勾销**：**#155 → 已核销**；新增记账两条 = 两测试档压线 500（零余量）+ VSC 翻转在飞回合残窗（另册）。
- **台账可见面**：`#155` 结算依据 = 本段 + §5。
- **Errata（父侧小项收正 · 可 revert）**：设计档 `:419` 拆分方案节「本批净增 +1 行」→ 实读 **+4 行（499）**（实施轮实测；触发条件仍未达 ✓）；设计档变更记录「±0 → +1」为轮 2 时点记录（历史面留档不动）。
