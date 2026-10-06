# 2026-10-06 · advisor-budget-reserve
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 20:32「坐着完成预留的处理也应该压缩而不是判死啊！你这什么逻辑？！」——上下文预算须按「窗口 − 完成预留」派生（压缩先行，不判死）；承 20:27 评审 #71 顶窗实证（台账 #975）。轻轮（defect fix）——可 revert。。
> 台账 = #975（core · 归批）。前情 = 无（独立轻轮——由 `#975` 点火）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-06 20:3x）**

**来源与授权**：用户 20:32「坐着完成预留的处理也应该压缩而不是判死啊！你这什么逻辑？！」（承 20:27 评审 `#71` 顶窗问 + `#975`）——裁定：**完成预留在窗口里的处理 = 折入预算 → 压缩先行；不许落到 provider 判死**。

**This pen 1 = light channel**（defect fix）：
- **disclosure**：change = 预算派生基数「窗 ⇒ **窗 − 预留**」（两处：`advisor/compaction.mjs` `advisorContextBudget` ∥ `config.mjs` `resolveCompactThreshold`；预留 = `provider.maxTokens` ?? `spec.maxOutput` ?? 0——新增单点 `outputReserve`）| reach = 评审压缩触发/判死线 + 代理压缩阈值（提前触发）| rollback = revertable。
- **change（落盘）**：① `thincoder-core/advisor/compaction.mjs:13`（import + `outputReserve`）∥ `:24-27`（注释收正）∥ `:28-40`（`advisorContextBudget` 基数改可用窗口）；② `thincoder-core/config.mjs:102-125`（`outputReserve` 新增 + `resolveCompactThreshold` 基数改可用窗口）。
- **walkthrough（父侧亲跑 · 一行读数）**：deepseek（1024K 覆盖 ∥ 预留 393,216）：评审 compactAt **671,088 ⇒ 419,430** ∥ 判死 838,860 ⇒ 524,288 ∥ 代理阈值 **629,145 ⇒ 393,216**；`#71` 输入 670,532——旧差 556 未触发（死在 provider）⇒ 新「早已触发」✓；跨模型（kimi-k3 ∥ glm-5.3）阈值小幅前移（预留占比小）——无不合理跳变。
- **freeze**：本笔完成（closeout 链随下一波：设计形式化 → 独立评审 → §4/§6 → `#975` 核销）。

**注**：生效面 = 新进程（宿主已载旧核不热换——今晚评审链不变，拆片跑法继续可用）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（轻轮形式化：ADVISOR-GUARDS §8/§10 收正；上抛 2 项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**§2 批次任务与设计（eng-designer · 2026-10-06 · 设计形式化轮）**

**本批条目（覆盖）**：#975（core · 归批）——预算基数 = **可用窗口 = 窗 − 完成预留**（轻轮 defect fix 的**设计形式化**收口笔）。实施 = 本批前笔（父侧直接执行 · 可 revert——落盘与读数见 §1）；本笔 = 设计档形式化 + 本段，**零代码写**。

**设计档落点**：`docs/core/design/ADVISOR-GUARDS.md` §8（契约块 `:313-334` / 五组表 `:336-342` / 新登 `:344-350` 预留解析·裁定 ∥ `:352-356` 收口读数 ∥ `:358` 与头寸用途句关系）· §10 A-AG10（`:396`）· 变更记录（`:431`）。

**机制设计（形式化摘要）**：
- 基数 = 可用窗口 = 窗口（`providerSpec`：规格表 × provider 级 `context` 覆盖）− 完成预留；两档比例零改（`limit` = floor(可用 × 0.8) ∥ `compactAt` = floor(`limit` × 0.8)）。
- 预留解析（单源 `outputReserve`——`thincoder-core/config.mjs:112`）：显式 `provider.maxTokens`（有限且 > 0——实发值 `thincoder-core/provider/core.mjs:187`）∥ 规格 `maxOutput` ∥ 0。
- 消费面两处（同源）：① 评审 `advisorContextBudget`（`thincoder-core/advisor/compaction.mjs:34-39`）② 代理阈值 `resolveCompactThreshold`（×0.6——`thincoder-core/config.mjs:122-129`；每回合压缩检查 + 展示面回退 `thincoder-core/token-window.mjs:151`）。

**受影响文件与测试面**：产品码两档 = 前笔已落（`thincoder-core/advisor/compaction.mjs` ∥ `thincoder-core/config.mjs`——本笔零写）；测试面 = **零新增 / 零改动**（轻轮 defect fix；核验 = 父侧亲跑读数（§1）+ 本笔逐行复算；全仓 test 树对 `advisorContextBudget` / `compactAt` / `compactThreshold` 零命中——无既有断言被此改打破）。

**验收对照（回指）**：① 派生式 + 五组表（§8 `:315-342`）= 表逐值可复算（A-AG10）；② 收口读数三行（`:352-356`）逐行可复算；③ 机检 = `node scripts/doc-check.mjs --root d:/teamcode/thincoder`：触面新增悬空 **0** ∥ 新增超宽 **0**（读数 = 悬空 65 ⇒ 65 · 超宽 2 ⇒ 2——存量全为触面外基线，改前后逐项同）。

**关键决策**：取「**收正**」而非「仅追加」——旧「窗 × 0.8」句与表五组旧值已失效，追加保留 = 规范面双版（D8：失效表达删除；历史入变更记录 `:431`）。被否：「仅追加新块、旧文不动」。

**上抛项**：
1. **需求档补句两落点**（父侧笔——建议措辞见交付报告）：`docs/core/requirements/ADVISOR-CONVERGENCE.md` ① §6.1 F27 行（as-of `:131`）公式 + 判定句 ④；② §8.2 N-A2 行（as-of `:203`）公式同变；联动 = §6.1 总体需求句（`:127`）。
2. **外档规范面残句**（非本批写域——报出）：`docs/core/design/CONTEXT-COMPACTION.md` `:61` / `:196` / `:674`（旧基数公式 auto = 窗口 × 0.6；`:62` 理由句部分被取代）；`docs/core/design/MODEL-SPECS.md` §12.4（`:1071`「压缩阈值」行「读什么」列未含 `maxOutput`）。建议随下一设计笔收正。

**§2 行区收正（自查）**：「设计档落点」§8 行区收窄——**新增行** = `:348-350`（预留解析 · 裁定）· `:352-356`（收口读数）· `:358`（头寸用途句关系）；`:346` = 既有行收正一处（`:344-347` 块内其余为既有行）；契约块 = `:313-334`（前言 + 围栏）、五组表 = `:336-342`（原述同）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**§4 用户裁定（授权面——主 agent 落档）**

- **2026-10-06 20:32 原话**：「坐着完成预留的处理也应该压缩而不是判死啊！你这什么逻辑？！」——裁定：**完成预留在窗口里的处理 = 折入预算 ⇒ 压缩先行；不许 provider 判死**。
- 授权口径：本笔 = light channel（defect fix）直落——20:32 同拍披露（change/reach/rollback = revertable）；用户当条 = 对 20:27「要修你一句话点火」的回应且语义为强制要求（「应该」）⇒ 按裁定直落；单笔可 revert，异议一句话回退。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）**

- **链面**：设计形式化 `#79`（`ADVISOR-GUARDS.md` §8 收正 ∥ §10 同步 ∥ 变更记录 + 本档 §2——机检触面新增悬空 0 ∥ 新增超宽 0）→ 独立评审 `#82`（代码 · 记录 · 文档对账）**pass**（旧项 0 ∥ 新项 0 ∥ must-fix 0；host 引文自检唯一失配 = 异链残句噪声，非本对象引文）→ fix 0 项。
- **§5**：N/A——轻轮无 eng-coder 实施段（实施面 = 父侧直改，逐处见 §1）。
- **验证读数（父侧亲跑 · 一行制）**：deepseek（1024K 覆盖 ∥ 预留 393,216）：评审 compactAt **671,088 ⇒ 419,430** ∥ 判死 838,860 ⇒ 524,288 ∥ 代理阈值 629,145 ⇒ 393,216；`#71` 输入 670,532——旧差 556 未触发（死在 provider）⇒ 新「早已触发」✓；kimi-k3 ⇒ 556,113 ∥ glm-5.3 ⇒ 558,080。
- **落点汇总**：代码两处（`thincoder-core/advisor/compaction.mjs` ∥ `thincoder-core/config.mjs`——「窗 − 预留」同源派生）∥ 需求档 `docs/core/requirements/ADVISOR-CONVERGENCE.md` §6.1（总体需求 ∥ F27 判定句 ④ ∥ §8.2 N-A2——父侧笔）∥ 设计档 `ADVISOR-GUARDS.md` §8/§10/变更记录（#79）。
- **台账**：`#975` 核销（evidence = 本档 + 三行读数）——随本收口同拍。
- **单元/集成面**：无批内件（核验 = 亲跑读数——本档在案）；集成场景零涉（全仓测试树对 `advisorContextBudget`/`compactAt`/`compactThreshold` 零命中——#79 披露 e 在案）。
- **残留披露（登记面）**：① 生效面 = 新进程（宿主已载旧核不热换——过渡期拆片跑法继续可用）；② 外档规范面残句（`docs/core/design/CONTEXT-COMPACTION.md` `:61`/`:196`/`:674` ∥ `docs/core/design/MODEL-SPECS.md:1071`——#79 披露 b）= 非本批写域，**另笔登记**（台账行随本收口同拍落）；③ §2#3/§11 机制域边界句（#79 披露 c）——评审已含（pass，不收正）。
- **冻结**：本档收口 ⇒ 冻结（§1 → 已收口 2026-10-06）；不复改。

**§6 补记（收口核验捕获——评审后修复 1 处）**

- **捕获**：收口前补跑消费面测试件 `docs/batches/2026-10-05-advisor-loop-split.test.mjs`（#79 披露 e「零命中」= 静态符号面；本件含行为面剪影）⇒ **B5a 红**：退化规格（预留 ≥ 窗——harness 1K 窗 × 缺省 32K 规格）下 `usable = max(0, …) = 0` ⇒ **即时判死**（正是本笔要消灭的病）。真实面对照 = `model-specs.mjs` doubao 族 `context: 256_000 ∥ maxOutput: 524_288`（预留 > 窗）同病。
- **修复（补钉 1 处）**：新增单源 `usableWindow(context, reserve)`（`thincoder-core/config.mjs`——预留 ≥ 窗 ⇒ 回落半窗；正常档零触），两处消费面同源改用（`advisor/compaction.mjs` `advisorContextBudget` ∥ `config.mjs` `resolveCompactThreshold`）。
- **复跑读数（父侧亲跑）**：① 测试件 **11/11**（B5a/B5b 校准随正——harness `maxTokens: 80` ⇒ 可用 944 ⇒ limit 755/compactAt 604；注释同拍）；② 回归读数：deepseek **524,288/419,430/393,216 逐值不变**（正常档零触 ✓）；③ 退化档：doubao ⇒ usable 128,000 ⇒ limit 102,400/compactAt 81,920（不再 0）；harness ⇒ 755/604。
- **口径**：本补钉 = 收口核验捕获的缺陷修复（defect fix 类）；`#82` 评审通过面 = 补钉前状态——补钉后核验 = 上述复跑读数（如需对补钉再作独立复核，可另行点火）。
- **测试件随正**：`2026-10-05-advisor-loop-split.test.mjs`（B5 注释 + B5a/B5b 两 provider 字面量——校准档显式化）。
