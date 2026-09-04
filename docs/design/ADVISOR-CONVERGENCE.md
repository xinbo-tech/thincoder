# Advisor 收敛协议（Convergence Protocol）

> 本文档记录 advisor 审查的收敛机制设计。实现：`src/advisor.mjs`（消息构建）、`src/advisor/run.mjs`（执行/上限）、`src/prompts/advisor-round*.md`（轮次提示词）。

## 目标

独立审查在"审查 → 修复 → 复审"循环中必须**收敛**：要么确认全部问题已修复（passed），要么在有限轮次内终止。历史上出现过 advisor 反复执行、每轮都报新问题、永不收敛的问题，以下机制均为其修复产物。

## 轮次定义

| 轮次 | system prompt | 检查范围 | 新问题权限 |
|---|---|---|---|
| Round 1 | `advisor-round1.md`（代码）/ `advisor-design.md`（设计） | 全量审查（读约定文档、追踪调用方） | ✅ 任意问题，建立 issue 表 |
| Round 2 | `advisor-round2.md` | 以验证 prior 表为主 | ⚠️ 仅限明显可见且导致 crashes / data loss / logic errors 的新问题 |
| Round 3–5 | `advisor-round3.md` | 严格只验证 prior 表 | ❌ 禁止（Do NOT look for new issues） |

> **指注（2026-09-04——§18.10 铁律固化）**：`AGENT-LOOP.md §18.10` 的判定铁律（R1-R7——注入 `advisor-round1/2/3.md` + `advisor-design.md` 尾部的"Judgment Rules"块）与本文档的轮换/预算机制**正交**——本文件管"轮次衰减/收敛上限"（表上 3 轮行为），铁律管"判定严重级怎么定"（各轮内容辅助）——两者不冲突：铁律不改变轮换行为（Round 2/3 的新问题权限不变），只给判定提供一致标准。实现时若铁律文本与轮次提示词冲突，以本文件轮换表为准（轮次行为是收敛机制，铁律是判定内容）。


轮次映射（`buildAdvisorSystemPrompt`）：`_advisorRound` 在每次 advisor 工具调用成功后 +1（`agent.mjs`），调用时 `_advisorRound=0 → ROUND1`，`=1 → ROUND2`，`≥2 → ROUND3`。注意 `_advisorRound` 是**已完成的** advisor 调用次数，`buildAdvisorSystemPrompt` 用 `_advisorRound + 1` 推导即将进行的轮次号——两者相差 1，勿混淆。

> **设计评审（`reviewType="design"`）与代码评审共用同一收敛协议**（2026-08-04 决策变更）：round 1 用 `advisor-design.md`（设计评审标准 + Approval Signal），round 2/3+ 用 `advisor-round*.md` 收敛提示词（验证 prior 表、证据强制）。设计文档多次修改的评审循环因此与代码评审同构：第 2 轮可报新问题，第 3+ 轮严格只查已知问题，5 轮封顶后不再打回。

## 关键机制

### 1. system prompt 按轮次替换（核心修复）

会话续接路径（`prepareAdvisorMessages`）在每轮追加 follow-up user 消息的同时，**替换 `session[0]` 的 system prompt** 为对应轮次版本。

历史教训：修复前 system prompt 冻结在 ROUND1（"full-scope review"），收敛约束只存在于 user 级 follow-up 消息，system 权重压过 user → 模型每轮都全量扫描挑新问题 → 永不收敛。ROUND2/3 提示词文件一度是死代码。

### 2. 机械轮次上限

`MAX_ADVISOR_ROUNDS = 5`（`run.mjs`）。第 6 次 advisor 调用（**代码与设计评审一致**）直接返回终止消息（"convergence cap reached"），不消耗 LLM——**5 轮后不再打回**：cap 消息列出未决问题与选项（接受当前状态 / 手动 read 复查 / 新会话重置），由用户拍板。空 `_touchedFiles` 检查在 cap 检查**之前**，保证诊断信息准确。

> 设计评审曾豁免 cap（每次调用重置轮次、单遍评审无收敛需求）——2026-08-04 决策变更：设计文档多轮修改的评审循环同样会无限发散，与代码评审共用 5 轮上限与轮次预算（`_advisorRound` 共享递增）。

### 3. stale-context 加固

history 中旧消息嵌有历史 diff，模型可能把"被删除的旧代码"误判为当前状态（曾连续两轮报告已修复的旧问题）。防护：

- ROUND2/3 system prompt 与 follow-up user 消息均声明 **STALE-CONTEXT WARNING**：更早消息中的 diff 全部过期，仅以本轮 "Current Changes" 和实时 `read` 为准。
- **证据强制**：任何 "Unfixed" / "New" 判定必须附 `read` 验证的 `file:line` 证据；无证据的判定视为未验证、不予接受。

### 4. 会话生命周期

- **收敛轮 fresh session（2026-08-04 决策变更）**：round 2+ **不复用** round 1 的会话数组——每轮构建全新 `[system(ROUND2/3 提示词), user(agent 响应表 + Review Scope + follow-up 指令)]`。**旧 read 输出（上一轮读到的文件全文）从物理上不在上下文里**——它是复评误报的最大锚定源（模型引用旧文件内容而非重新 read），也是 token 浪费源（大文件全文滞留触发频繁压缩）。"保留探索上下文"与证据规则（"只有本轮 read 才算数"）天然冲突，已废除。
- **后轮上下文包含 prior 表（2026-08-05 决策变更，反转）**：prior 表（旧问题清单）**重新注入** round 2+ 的用户消息——它是**唯一完整的验证清单**：agent 响应表只覆盖 agent 选择回答的问题，agent 遗漏/回避的问题若无 prior 表会**在收敛中静默通过**（验证目标被 agent 自我声明绑架）。当初移除的理由（复述锚定/跨主题污染/token）已被后续防线化解：**复述** → host-verified citations 机械拦截（引用与磁盘不符即标记）+ fresh session 排除旧 read 数据（prior 表是唯一旧信息源，其余干净）；**跨主题污染** → 确定性轮次判定（`_mutatedThisRun`，无修改 → 重置 → round 1 无 prior）；**token** → prior 表 <5KB 可忽略。agent 响应表保留为**聚焦参考**（"我修了 X"），不再是验证清单。
- ~~prior 表仍用于轮次判断：`extractPriorIssueTable` 存在 → round 2+，缺失 → round 1~~ **已废止（2026-08-08）**——轮次判断改为确定性状态（`_advisorRound > 0 && _lastAdvisorOutput`），见 §4a。
- `agent._advisorSession` 字段保留（初始化兼容）但**不再作为会话延续读取**；run.mjs 不再写它。
- run 结束（`runAgent`）重置 `_advisorRound`。
- 审查失败不产生可泄漏的半成品上下文（每轮 fresh，天然免疫）。
- prior 表为空（上次 all-clear 或首次）时重置为 round 1 全新全量审查。

### 4a. prior 注入改为原文 + 模型理解（2026-08-08 决策，移除硬解析）

**背景**：prior 表靠**表头字符串精确匹配**（`ADVISOR_TABLE_HEADER` 等 4 个常量）从历史提取，all-clear 靠**短语匹配**（`ALL_CLEAR_PHRASES`）。两类都是"用字符串匹配解析 LLM 输出"——LLM 措辞/表格格式一漂移即静默失败（提取失败 → prior=null → 收敛退化为全量重评，无任何报错）。用户两次质疑（"不能依赖模型理解吗""短语判定有实质意义吗"）——核实后确认：

- **guard 推回不看评审结论**（`_calledAdvisorThisRun` 只看评审发生没发生）；
- **round 重置已解耦**（`_mutatedThisRun` 决定，2026-08-05）；
- 短语判定唯一实质作用是 all-clear 后 prior=null → ROUND1——与确定性重置重合（无害）或造成轮次混搭（有害）。

**决策**：
1. **删除** prior 表硬解析（`extractPriorIssueTable` 表头匹配）与 all-clear 短语判定（`ALL_CLEAR_PHRASES`）；
2. 评审完成时宿主存**完整原文**：`agent._lastAdvisorOutput = result`（run.mjs 评审结束处；subagent 的 advisor 调用不写父 agent 状态）；
3. round 2+ 注入**上轮评审原文**（模型自行理解表格与结论）——指令："以下是上一轮评审的完整输出——逐项验证其中指出的每个问题（基于本轮 read 的当前文件状态，Fixed/Unfixed/New）"；
4. **round 判定**：`_advisorRound > 0 && agent._lastAdvisorOutput` → round 2+；否则 round 1（重启后 `_advisorRound=0` → 保守全量重评）；
5. agent 响应表（fix claims）保留为聚焦参考（`extractAgentResponseTable`，格式漂移仅影响参考性——fallback 文本兜底，不驱动控制流）。

**收益**：消除两类字符串解析的脆弱性；注入信息完整（原文含解释——解析版会丢）；轮次语义一致（不再有 prior=null 与 round 计数的混搭）；代码简化。
**代价**：注入体积略增（原文 vs 表，评审输出通常 <16KB 可接受）；重启后保守全量重评。
**宿主判定面**：只保留"评审发生"（`_calledAdvisorThisRun`）+ 轮次预算（`_advisorRound`/cap）——评审"通过/不通过"不是宿主控制流输入，是主 Agent 读评审输出自行判断。
**已知风险（2026-08-08 评审确认）**：`buildAdvisorUserMessage` 的 legacy 收敛路径（直接外部调用方）不应用 `escapeLiteralEscapes`（import 会形成 messages.mjs↔advisor.mjs 顶层循环）——parent 对话引用字面 `\x`/`\u` 时可能触发服务端 400。正常流（`prepareAdvisorMessages` → `buildAdvisorFollowUp`）已转义，无风险；legacy 路径的直接调用方需自行转义。

### 4b. 评审触发范围收缩：只跟代码修改绑定（2026-08-08 用户决策）

**背景**：`agent.mjs` 曾对**任何副作用工具**（bash/git 等非只读工具）重置 `_calledAdvisorThisRun`（"评审失效"）——导致"评审通过后仅用 bash 读日志/删临时文件"也再次触发评审推回（观察到 round 2 零问题后仍要求 round 3）。用户否决："我们明确有规定：修改代码以后触发评审，为什么要扩散到 bash 这一类的东西？"

**决策**：
1. **FILE_MUTATORS**（edit/write/apply_patch 等）调用 → 重置 `_calledAdvisorThisRun` + `_verifiedThisRun`（评审/验证确实过时——文件状态变了）；
2. **非写文件副作用工具**（bash/git）→ **只重置 verify**（其 diff/状态快照可能过时），**不重置评审标记**——bash 被系统规则禁止写文件（"NEVER use bash to write or modify files"），合规 agent 的 bash 不会改变被评审代码；
3. 由此"评审 → 只读/环境操作 → 完成"不再触发多余评审轮；"评审 → 再次改代码 → 重新评审"保持。

**残余边界（接受）**：违规 agent 用 bash 改代码文件 → 不进 `_touchedFiles` → `hasCodeMutations` 检测不到 → 评审漏过。这是"bash 写文件被禁"规则下不存在的场景（规则与机械判定的一致性优于对违规行为的兜底）。

### 4c. 评审失效机制（2026-08-08 概念澄清，用户追问）

**"评审失效"不是独立机制，是 guard 条件的状态转换**。guard 的唯一依据是"是否存在未评审的代码修改"：

```js
// completion.mjs — 完成时推回判定
if (agent._mutatedThisRun        // ① 本 run 改过代码
 && !agent._calledAdvisorThisRun // ② 修改尚未被评审覆盖
 && hasCodeMutations(agent)      // 内容判定：排除 docs/tmp-* 等非代码
 && pushbacks < MAX && round < MAX) { 推回 }
```

- **② = `_calledAdvisorThisRun`**：评审完成置 `true`（agent.mjs advisor 工具调用处理）——表示"当前代码状态已被评审覆盖"；**再次修改代码**（FILE_MUTATORS）置回 `false`——这就是"失效"。没有 ②，`_mutatedThisRun` 永远为 true（评审不消除修改事实）→ guard 无限推回，run 永不完成；没有失效重置，评审后修复的问题无人验证 → 收敛断裂。**失效是收敛循环（评审→修复→再评审→…直到 0 🔴 或 5 轮 cap）的引擎**。
- **触发路径完整清单**（严格限定代码修改，2026-08-08 用户最终拍板"不要肆意扩大"）：

| 事件 | 评审失效？ | 推回？ |
|---|---|---|
| FILE_MUTATORS（edit/write/apply_patch/insert_after/hashline_edit/delete）改代码 | ✅ | ✅（guard 综合判定） |
| 子代理代码合并（mergeChildMutations） | ✅ | ✅ |
| bash/git（非写文件副作用） | ❌ | ❌ |
| 只读工具（read/grep/lsp/glob） | ❌ | ❌ |
| 写 docs/**、写 tmp-* 临时文件 | 状态位翻转但 `hasCodeMutations` 过滤 | ❌ |
| verify/task/checklist/question/plan 切换 | ❌ | ❌ |
| 新 runAgent（新任务） | 重置为未评审（新评审周期） | 按条件判定 |

- **设计理由**：bash 被系统规则禁止写文件（"NEVER use bash to write or modify files"）——合规 agent 的副作用工具不可能改变被评审代码，故不触发评审；违规场景（bash 改文件）与 `hasCodeMutations` 盲区一致，接受（规则与机械判定的一致性优先）。

### 4d. 响应表 Action 语义 + 禁「pre-existing」借口（2026-08-22 决策）

`discipline.md`（标准模式）/ `engineering.md`（工程模式父代理）的响应表纪律此前只规定表头 `| # | Action | Detail |`，未定义 `Action` 取值，模型对审查发现的处理因此含糊——常见"之前就有、不修"的推诿。用户拍板补两件事：

1. **`Action` 三值封闭词表**：`Fixed`（已改代码/设计）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴，不得用于静默丢弃真缺陷）。表头保持 `| # | Action | Detail |` 不变（`extractAgentResponseTable` 按此精确匹配提取）。
2. **禁止「pre-existing」借口**：评审双方拥有整个代码/设计——"之前就有""不是我引入的"永远不是跳过修复的理由；问题何时出现不决定它该不该修。只能技术反驳或修，否则不算收敛。

约束性质：纯提示词纪律，不加机械解析——响应表仍是"聚焦参考"，不驱动控制流（见 §4a）。两条同时写入 `discipline.md` 与 `engineering.md`（两端 `src/prompts/` byte-identical）；工程模式条款收窄为"超出已批准设计范围就 surface 或提设计更新"，因父代理不直接写实现代码。

### 5. 证据机械校验（host-verified citations）

提示词的证据规则（"引用必须来自本轮 read"）无法被 LLM 自我强制——模型可以声称读过而实际复述 prior 表（三轮误报实证：引用行号为修复前旧状态）。**宿主侧机械校验**作为最后防线：

- `runAdvisorReview` 拿到评审结果文本后，解析其中的 `file:line: content` 引用（正则：`([\w./\\-]+\.\w+):(\d+):\s*(.+)`）
- 逐条 `readFileSync` 磁盘比对：该文件该行的实际内容是否包含引用内容
- 输出验证报告追加到结果（或独立输出）：`[host-verified] N/M citations match current file state` + 不匹配清单
- 父 agent（决策方）与用户看到验证报告后，对不匹配的 "Unfixed" 判定自动降权——**未通过校验的引用不能支撑打回**

效果：模型编造/复述旧证据的成本从"零"变为"必然被标记"；即便提示词失效，机械层仍能拦截。

### 6. 需求契合度检查（requirement fit）

评审的传统维度（正确性/安全/一致性/完整性）全部检查"代码对不对"，不检查"做的是不是用户要的"——实现者可以把功能做对但做错方向（实测案例：声称"交替显示修复完成"却让工具调用整体消失；声称"记录里有工具调用"却把清单附加在尾部、时序丢失）。用户两次在交付后才发现偏差，本质是需求-实现偏差没有被任何评审维度覆盖（2026-08-06 决策，用户提出）。

- **ROUND1 提示词新增评审维度**（`advisor-round1.md`）：核对实现与用户诉求的差异。两个对照：
  - (a) **声称 vs 实现**：实现者陈述的目的（对话背景/响应表/提交说明）对照实现实际行为——"声称做 X 却给了 Y"是偏差；
  - (b) **期望 vs 形态**：**需求文档**（AGENTS.md 指引的项目需求/设计文档）与用户明确期望对照交付形态——"要 A 却给了 B"是偏差。
- 偏差按影响标 🔴/🟡，Issue 中写明：用户要什么、实现给什么、差在哪。
- **证据约束**：判断必须引用证据（用户原话或实现行）——无证据的"需求偏差"至多标 🔵，与第 5 节的 citations 机械校验共用同一证据规则。
- **已知边界**：conversation background 只取最近 3 轮——**2026-08-08 决策：需求文档成为 (b) 的主参照**——评审 user 消息注入 `## Project Guide (AGENTS.md)`（项目文档地图，预算 = max(8KB, 评审模型上下文 × 5%)，1M 模型 ≈ 50K），评审者第一步必须读它并按指引读需求文档——"用户需求在文档里，对话背景只是补充"；无 AGENTS.md 时诚实降级（明说以对话背景为准）。这消除了旧边界"需求在文档中但 advisor 不知道去哪读"的盲区。
- **项目根定位（2026-08-08 追加）**：项目根是**工作目录下的子目录**（用户明确否定"向上查找"）——发现顺序：cwd 自身有 AGENTS.md → cwd 即项目根（单项目）；否则从评审范围第一个文件所在目录**在 cwd 边界内**向上找最近 AGENTS.md（多项目工作区/monorepo：被评审文件归属的子项目就是项目根）；都找不到 → 诚实降级。注入段标注 `<!-- Project root: <相对路径> -->` 让评审者知道地图归属。

## 配置

`.thincoder/advisor.md` 提供评审准则覆盖；`config.json` 中 `advisor.provider` / `advisor.model` 可选覆盖主 agent 的 provider。

## 变更记录

### 2026-08-30：评审提示词提速——预算压缩 + 删 caller 追踪步骤（用户拍板 A + 删第四步）

**需求**（用户报告：文档审核与代码审核执行时间都非常长）：advisor 耗时 = 每轮 LLM 时间 × 工具轮数，提示词控制后者。两处放大器：① round1 预算 30 轮 + 里程碑引导（8/15/25），模型照着预算花满；② round1 工作流第 4 步 "Use grep or lsp to trace callers, imports, and dependencies — only where genuinely needed"——"genuinely needed" 是弱闸，模型大量执行调用方/导入追踪（每轮一次 LLM 往返）。round2/3 同款追踪条款与 30/15 预算同步改，否则口径分裂。

**设计**（两端 `src/prompts/advisor-round*.md` byte-identical）：
- 预算压缩（方案 A）：round1 30→**20** 轮，里程碑 8/15/25 → 6/10/17；round2/round3 30→**15** 轮，收敛兜底 15→**8**。硬帽 100 不动（host 机械止损不变）。
- 删 caller 追踪步骤：round1 工作流删原第 4 步（grep/lsp trace callers）→ 5 步变 4 步；round2/3 删同款条款 → 6 步变 5 步。**明确不做**：§6 需求契合度检查（两对照）与证据引用纪律不动——评审质量红线保留，砍的是探索性追踪，不是证据链。

**已知代价（接受）**：调用方/导入级 bug 的发现率会降（原第 4 步的价值面）；以评审速度换覆盖深度，用户拍板。

**受影响文件**：`src/prompts/advisor-round1.md`（49→48 行）、`advisor-round2.md`（37→36 行）、`advisor-round3.md`（33→32 行）（两端各一份，共 6 个文件）。验证：CLI 全量 787/787 全绿、vscode 全量 783/783 全绿、CLI lint 0 error、三份文件两端 byte-identical。无既有测试断言旧预算值（advisor.test.mjs 87 条不涉及提示词预算文案），无需断言更新。

## 工程模式（engineering mode）集成

工程模式（`agent.engineering: true`）承诺 "Advisor is mandatory at both design and code gates"，机械强制链如下：

- **Design gate（机械强制）**：spawn `eng-coder` 时 `subagent.mjs` 校验 `parent._engDesignToken === designToken`，不符即拒绝；`dispatch.mjs` 的写文件门禁以 `_engDesignReviewed` 为兜底，advisor 工具在 design review 通过（token 回显）时同步置位——两套机制联动，任何未经授权路径都无法写文件。
- **Code gate（机械强制）**：eng-coder 返回后 `mergeChildMutations`（subagent.mjs）把子代理的修改合并进父代理（`_mutatedThisRun`/`_touchedFiles`，并使先前 verify/advisor 标记失效）——父代理的 advisor guard 因此触发，无法通过"把所有改动委托给 eng-coder"跳过代码评审。
- **Verify（机械强制）**：工程模式下 verify guard 与 `verifyGuard: true` 等效，父代理完成前必须 verify（verify 用 `git diff` 检测，子代理改动同样可见）。
- **轮次共享**：design review 与 code review 共用 `_advisorRound`（每次 advisor 调用成功 +1，含 design）——设计评审与代码评审共享 MAX_ADVISOR_ROUNDS=5 预算。设计文档的评审循环因此有界（2026-08-04 决策变更；此前 design 不递增、不消耗预算）。
- **Token 生命周期**：`_engDesignToken` 在会话内跨 turn 存活（TUI 用户批准设计是新的 runAgent 调用，token 必须跨过去）；任何 design review 失败会使其失效（agent-tools/advisor.mjs）。已知的保守缺口：token 不随任务结束自动作废，极端情况下可从历史中复用——接受（需要模型既违反工程提示词又提取旧 token，实际风险低）。
- **机械强制的边界**：机械闸（token 校验、写文件门禁、guard 推回）作用于 **eng-coder 子代理**；**父代理本身不受写文件门禁约束**——它需要写设计文档（docs/），且工程提示词（engineering.md）约束其"设计先行、委托实现、实现后必须 code review"。父代理的越权（跳过设计直接写代码）只能靠提示词约束，这是信任模型的设计选择，与普通模式的纪律约束一致。

## 验证

`test/advisor.test.mjs` 覆盖：system prompt 轮次替换、cap 阻断第 6 次调用、design 豁免、design 不递增轮次、follow-up 原文注入、确定性 round 判定（`_advisorRound > 0 && _lastAdvisorOutput`）、项目根发现（子项目地图/单项目/降级）；`test/agent.test.mjs` 覆盖 `mergeChildMutations` 合并/去重/标记失效、runAgent 级 guard 推回（bash 后不重触发、未评审代码写必推回）。全套测试 `node --test test\*.test.mjs`。
