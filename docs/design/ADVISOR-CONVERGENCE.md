# Advisor 评审收敛协议（Convergence Protocol）

> 本文档是 advisor 评审收敛机制的设计权威（AGENTS.md：评审代码前必读）。它定义"审查 → 修复 → 复审"循环如何**收敛**：要么全部问题确认修复（passed），要么在有限轮次内机械终止。轮次提示词（`src/prompts/advisor-*.md`）与机械执行层（cap/citations/guard）是本文档语义的执行实现；评审契约句以本文档为准。
>
> **实现载体**：
>
> - `src/prompts/advisor-round1.md` / `advisor-round2.md` / `advisor-round3.md` / `advisor-design.md`——轮次提示词（硬加载——缺失即抛错，防静默降级）。
> - `src/advisor.mjs`——system prompt 轮次选择（`buildAdvisorSystemPrompt`）、round2+ follow-up 构建（`buildAdvisorFollowUp`）、评审会话组装（`prepareAdvisorMessages`）。
> - `src/advisor/run.mjs`——执行与机械 cap（`MAX_ADVISOR_ROUNDS`/`buildCapMessage`/`runAdvisorReview`/`MAX_ADVISOR_TURNS`）。
> - `src/advisor/convergence.mjs`——round2+ 收敛消息体（正常流与 legacy 路径的单源）。
> - `src/advisor/messages.mjs`——user 消息构建（round1 设计/代码、legacy 收敛路径、对象声明块、Project Guide 注入）。
> - `src/advisor/citations.mjs`——host-verified citations 机械校验；`src/advisor/history.mjs`——响应表/对话背景提取；`src/advisor/repos.mjs`——评审范围采集 + `hasCodeMutations`。
> - `src/agent-tools/advisor.mjs` / `advisor-async.mjs`——advisor 工具（sync 执行、async 后台池、cap 预检、per-review 实例）；`src/agent/record-results.mjs`（工具结果记账）；`src/agent/completion.mjs`（完成 guard 推回）。
>
> **权威边界**：
>
> - **同步评审路径 = 本文档**（轮次语义、prior 注入、cap、证据纪律、响应表）。
> - **async 评审路径 = AGENT-LOOP §11.2**（async advisor——R13——`_advisorRuns` per-review 实例解析/后台池/settle 记账）——async 面上本文档的轮次/cap 语义以 §11.2 的实例机制落地（R13 = 2026-09-06 用户需求"主代理跑 advisor 不阻塞前端"，已实现）。
> - **判定铁律 R1-R7 = AGENT-LOOP §12.2**（注入全部 4 份提示词尾部的 "Judgment Rules" 块）——与本文件**正交**：本文件管轮次衰减/收敛上限（轮次行为），铁律管严重级怎么定（判定内容）——铁律不改变轮换行为（Round 2/3 的新问题权限不变）。冲突时以本文件轮次表为准。
> - **工程模式 = ENGINEERING-MODE.md**（token/门禁/guard 开关/信任模型）——本文件只保留收敛相关与指针。
> - 设计文档档位纪律（>300/>500 拆分判据）= METHODOLOGY.md「代码结构分层」；行数标注义务 = METHODOLOGY F-R24a；评审核查维度行为 = 本文档 §9（METHODOLOGY F-R24b 只放挂钩指针——单向权威）。

## 1. 目标

独立评审必须在"审查 → 修复 → 复审"循环中**收敛**：要么确认全部问题已修复（passed），要么在有限轮次内机械终止。历史病根：advisor 反复执行、每轮全量扫描都报新问题、永不收敛（修复前 system prompt 冻结在 ROUND1，收敛约束只存在于 user 级消息，system 权重压过 user）；以及复评引用旧文件状态、把已修复问题反复报回。以下机制均为这些病根的修复产物：

- **轮次衰减**：system prompt 按轮次替换（§2/§4.1）——ROUND1 全量、ROUND2 验 prior 为主、ROUND3+ 严格只验 prior。
- **机械 cap**：`MAX_ADVISOR_ROUNDS = 5`（仅代码评审），第 6 次启动机械终止、不消耗 LLM（§3）。
- **会话隔离 + 证据机械校验**：每轮 fresh session（旧 read 数据物理不在上下文）+ host-verified citations 机械比对磁盘（§4/§5）。
- **确定性状态**：轮次/失效/重置全部由运行状态位决定，不解析 LLM 输出（§2/§6）。

机制演进沿多次反转收敛（cap 引入 → fresh session 与 design 共享预算 → prior 重注入 → 硬解析删除/原文注入/确定性判定——见变更记录），正文只述现行态。

## 2. 轮次定义

### 2.1 轮次表

| 轮次 | system prompt | 检查范围 | 新问题权限 |
|---|---|---|---|
| Round 1 | `advisor-round1.md`（代码）/ `advisor-design.md`（设计） | 全量审查（评审对象声明 + 范围文件；先读 Project Guide 指向的需求文档） | ✅ 任意问题，建立 issue 表 |
| Round 2 | `advisor-round2.md` | 以验证 prior 表为主 | ⚠️ 仅限明显可见且导致 crashes / data loss / logic errors 的新问题 |
| Round 3–5 | `advisor-round3.md` | 严格只验证 prior 表 | ❌ 禁止（"Do NOT look for new issues"） |

- 评审对象锚：round1 与 round2+ 的用户消息都以机械生成的 **Review-object declaration** 块开头（`{type, target, status, reason, exclude}`——每轮注入——权威 AGENT-LOOP §12.1）——评审员不推断"评谁/为什么评"。
- 设计评审（`reviewType="design"`）与代码评审共用收敛提示词轮换：round 1 用 `advisor-design.md`（设计评审标准 + Approval Signal——无 🔴 时回显 `[DESIGN-TOKEN:…]` + designId 双值逐字）；round 2/3+ 用 `advisor-round*.md` 收敛提示词（验证 prior 表、证据强制）。设计文档多次修改的评审循环因此与代码评审同构。**cap 仅代码评审**（§3.2）：design 轮次继续递增（收敛提示词轮换 + 轮次显示照常），第 6 次调用不被 cap 拒绝。
- 对象声明块后每轮注入评审内容；round2+ 的完整用户消息形态见 §4.3。

### 2.2 轮次映射与 off-by-one

- `_advisorRound` = **已完成的** advisor 评审尝试次数（同步路径：工具调用完成后记账——含失败/错误返回的尝试；拒发——cap/池满/无范围——不计不置 called；async 路径：settle 时 `run.round++`——attempts 语义与 legacy 一致）。
- round1 与 round2+ 的**语义判定**是确定性的：`(_advisorRound || 0) > 0` **且**存有上一轮评审输出 → round 2+；否则 round 1（重启后 `_advisorRound=0` → 保守全量重评）。**无解析**：不解析 prior 表头、不匹配 all-clear 短语。
- 提示词选择（`buildAdvisorSystemPrompt`）：调用时 `_advisorRound=0 → ROUND1`，`=1 → ROUND2`，`≥2 → ROUND3`。实现用 `_advisorRound + 1` 推导**即将进行**的轮次号（=2 → ROUND2，≥3 → ROUND3）——与已完成的次数相差 1，勿混淆。
- 轮次预算按 **review 实例**计（sync 与 async 工具路径共用 `_advisorRuns` 注册表——reviewId = designId/随机 id——round/prior 随实例；legacy 直接调用方退化为全局镜像计数）。并发多评审的 round/prior 互不污染。实例解析/settle 细节权威 = AGENT-LOOP §11.2。
- **重置语义**（2026-08-08 确定性化）：无 prior 且本 run 未改代码（`!_mutatedThisRun`）→ 轮次归零、开新评审周期（首次评审 / 上次 all-clear / 纯文档或无修改的 run——各自获得完整预算）；本 run 改过代码 → **保留轮次**（completion guard 必推回，轮次必须继续向 cap 推进——任何改了代码的循环不得靠归零重置逃逸预算）。每 runAgent 起始重置镜像状态（resume 续写保留——预算跨续跑，cap 不可重置）。

### 2.3 工具轮预算

提示词自报工具轮预算（防止评审者按预算花满时间的放大器）：round 1 = **20** 轮（里程碑引导 6/10/17——三分之一/一半/接近上限）；round 2/3 = **15** 轮（8 轮未验完即收尾兜底）。机械硬帽 **100 工具轮**（`MAX_ADVISOR_TURNS`——run.mjs 工具循环止损——type-agnostic，design 评审同受；评审死循环时 host 机械打断）。

### 2.4 通过 / 阻断判定

- **通过 = 无未决 🔴**：全部 🔴 已解决、仅剩 🟡/🔵 → 评审通过（🟡/🔵 不阻断 approval——照列不隐藏）。任一 🔴 未决 → 不得声称 passed。
- **宿主判定面**：评审的"通过/不通过"**不是宿主控制流输入**——宿主不做 findings/短语解析——guard 只消费"评审发生"（`_calledAdvisorThisRun`）+ 轮次预算；是否通过由主 Agent 读评审输出自行判断。唯一机械例外 = design 评审的 token 回显即通过信号（§2.1——凭证入槽/门禁解锁）。
- **R7e 文档状态矛盾不卡 pass**：文档矛盾/状态不一致 → 🟡 报出即过（report-and-pass，评审只读不改）——**机制级描述不一致除外（= 🔴——必须处理后才可过）**。判据来源：判定铁律 R7e（AGENT-LOOP §12.2）——本文件不重复铁律正文。

## 3. 机械轮次上限（cap）

### 3.1 cap 语义与执行点

`MAX_ADVISOR_ROUNDS = 5`（run.mjs）。**第 6 次 advisor 启动**（该实例 round ≥ 5）**直接返回终止消息、不消耗 LLM**——评审根本不启动。执行点：

1. **工具层预检**（`agent-tools/advisor.mjs`——sync/async 共用的启动前检查）——cap 拒绝只标记拒发，不置 called、不耗轮次（guard 因此在 cap 后自然停止推回）。
2. **`runAdvisorReview` 内防线**（run.mjs——legacy/直接调用方防绕）。
3. **completion guard 的 `round < MAX` 项**（§6.2）——到 cap 后不再推回。

cap 消息（`buildCapMessage`）：`Advisor: convergence cap reached after 5 rounds.` + **列出来自 prior 的未决问题**（或"All prior issues appear resolved."）+ 三个选项：**接受当前状态继续 / 手动 read/grep 复查特定问题 / 新会话重置（/new）**——由用户拍板。**5 轮后不再打回**——cap 消息是收敛失败的出口，不是又一轮评审。

**无范围早退在 cap 之前**：代码评审无 review scope（无 paths/documents 且 `_touchedFiles` 为空）时工具层提前拒发（"no review scope specified"）——保证诊断信息准确（无改动文件时不误报成收敛失败）。空 `_touchedFiles` 的检查在 cap 检查之前。

### 3.2 design 豁免 cap（2026-09-07 用户裁定——与计数正交）

- 裁定原话："代码评审保留机械限制，设计评审取消。" cap 的 6 次启动拒绝**仅代码评审**（`reviewType !== "design"` 条件两处同改）；**design 第 6 次调用不被拒**、照常触达 LLM。
- **计数照增（两轴正交）**：design 实例的轮次**继续递增**——round2/3 收敛提示词轮换与轮次显示照常——豁免的只是"第 6 次拒绝"这一轴，不是轮次预算。
- **guard 不受 design 轮次干扰（2026-09-07 实现批 F2）**：completion guard 的轮次上限读 `effectiveAdvisorRound`——**只认 open 的 code 评审实例**（无 → 0）——design 实例的轮次（含其 settle 写的 legacy mirror）不参与 code guard 判定——design round ≥ 5 不会误挡代码评审推回。
- 动机：cap 原防"改 A 报 B"无限拉锯（2026-08-01 引入）；round3+ 只查修复声明的收敛模式已根除发散空间（病根已换）——design 的 cap 是旧病因残留（2026-08-04 曾把 design 纳入共享预算——2026-09-07 supersede）。演进史一句：cap 于 2026-08-01 引入 → 08-04 design 并入共享 5 轮预算 → 09-07 design 重获豁免（code-only cap 保留）。

## 4. 收敛会话与证据纪律

### 4.1 stale-context 加固

history 中旧消息嵌有历史 diff/旧文件内容，模型可能把"已删除的旧代码"误判为当前状态（曾连续两轮报告已修复的旧问题——引用行号为修复前状态）。防护：

- ROUND2/3 的 system prompt 与 follow-up 用户消息均声明 **STALE-CONTEXT WARNING**：更早消息中的任何内容都是历史快照——**视为过期——只有本轮 `read` 的结果描述当前状态**。
- **round2+ follow-up 刻意零 git**：不注入 diff/状态快照——git diff 曾误导复评（已提交的修复不会出现在 diff 里 → 模型把"无变化"读成"无修复"）——验证只靠 `read`。
- **证据强制**：任何 "Unfixed" / "New" 判定必须附 `read` 验证的 `file:line` 证据（引本轮 read 的确切行内容——"Line numbers alone are NOT evidence"——行号可能是伪造或陈旧的）；无证据的判定视为未验证、不予接受。机械校验见 §5。

### 4.2 fresh session——每轮全新会话

- **round 2+ 不复用 round 1 的会话数组**：每轮构建全新 `[system(ROUND2/3 提示词), user(对象声明块 + prior 全文 + agent 响应表 + 指令)]`。**旧 read 输出（上一轮读到的文件全文）从物理上不在上下文里**——它是复评误报的最大锚定源（模型引用旧文件内容而非重新 read），也是 token 浪费源（大文件全文滞留触发频繁压缩）。"保留探索上下文"与证据规则（只有本轮 read 才算数）天然冲突——已废除。
- 评审失败不产生可泄漏的半成品上下文（每轮 fresh，天然免疫）。
- `agent._advisorSession` 字段保留（初始化兼容）但**不再作为会话延续读取/写入**；runAgent 每 run 重置。

### 4.3 prior 全文注入——唯一完整验证清单

- prior 注入史一句话：prior 曾两度反转（先注入 → 移除 → 2026-08-05 重新注入），现行态 = round 2+ 用户消息注入**上一轮评审的完整原文**（模型自行理解表格与结论——2026-08-08 起无表头/短语硬解析）。
- **为什么必须注入**：prior 是**唯一完整的验证清单**——agent 响应表只覆盖 agent 选择回答的问题，agent 遗漏/回避的问题若无 prior 会在收敛中**静默通过**（验证目标被 agent 自我声明绑架）。
  当年移除的理由（复述锚定/跨主题污染/token）已被后续防线化解：**复述** → host-verified citations 机械拦截（引用与磁盘不符即标记）+ fresh session 排除旧 read 数据（prior 是唯一旧信息源，其余干净）；**跨主题污染** → 确定性轮次判定（`_mutatedThisRun` 无修改 → 重置 → round 1 无 prior）；**token** → 注入的是评审原文而非解析表，通常 <16KB 可接受。
- **消息形态**（convergence.mjs——正常流与 legacy 路径单源）：
  - `## Round N — Verify Prior Table + Flag New Issues`（round 2）/ `## Round N — Strict Verification`（round 3+）——声明本轮 system prompt 已收窄范围；
  - `## Prior Review Output (verify every item it raises)`——上一轮评审完整原文；
  - `## Agent Response (fix claims — reference only)`——agent 响应表（**聚焦参考**——"我修了 X"——**不再是验证清单**；格式漂移或缺失时 fallback 文本兜底，不驱动控制流）；
  - `## Instructions`——编号指令：逐项 read 验证 prior 每项 / STALE-CONTEXT WARNING / 无 git / 必须 read 当前文件再判定 / **Evidence rule**（引本轮 read 确切行内容——无 fresh 引证 = unverified 不受理）/ round 2 可标修复引入的明显新问题（crashes, data loss, logic errors——非 style）/ round 3+ **"Do NOT look for new issues"**。
- **只存"评审形态输出"作 prior**：评审完成时宿主只在该输出像评审时（markdown 表格行或 ≥200 字正文——`looksLikeReviewOutput`）存为 prior——空回复/纯工具进度不得成为 round2+ 的验证清单。同步路径存 `agent._lastAdvisorOutput`；实例路径存 `run.priorOutput`；subagent 内的 advisor 调用不写父 agent 状态。
- **已知边界（legacy 路径）**：`buildAdvisorUserMessage` 的 legacy 收敛路径不应用 `escapeLiteralEscapes`（成因注：函数现居独立 `escape.mjs`——曾因 messages.mjs ↔ advisor.mjs 顶层循环无法引用——缺口历史保留未接线，非当前循环约束）——直接外部调用方须自行转义（parent 对话引用字面 `\x`/`\u` 序列时有服务端 400 风险）；正常流（`prepareAdvisorMessages` → `buildAdvisorFollowUp`）已转义，无风险。

## 5. host-verified citations——机械证据校验

提示词的证据规则无法由 LLM 自我强制——模型可以声称读过而实际复述 prior 表（实证：三轮误报引用修复前的旧行号）。**宿主侧机械校验是最后防线**：

- `runAdvisorReview` 拿到评审结果后解析其中的 `file:line: content` 引用（正则：`([\w./\\-]+\.\w+):(\d+):\s*(.+)`——实现为加固扩展：后缀白名单（源码/配置/文档扩展名，防 URL 假阳性）+ 内容 ≥4 字符 + 排除反引号引文）。
- 逐条 `readFileSync` 磁盘比对：该文件该行的实际内容是否**包含**引用内容；引用路径有**路径围栏**（realpath 解析后必须仍在 cwd 内——LLM 生成的路径不可信，防越界读泄漏配置）。
- 验证报告追加到评审结果：`[host-verified] N/M citations match current file state.` + 不匹配清单（"Citations that do NOT match the current file state (treat their claims as unverified):"——至多 10 条，含失败原因）。
- 父 agent（决策方）与用户看到验证报告后，对不匹配的 "Unfixed" 判定自动降权——**未通过校验的引用不能支撑打回**。效果：模型编造/复述旧证据的成本从"零"变为"必然被标记"；即便提示词失效，机械层仍能拦截。

## 6. 评审触发与失效（guard 推回）

### 6.1 触发范围：只跟代码修改绑定

`agent.mjs` 曾对**任何副作用工具**（bash/git 等）重置"评审已覆盖"标记——导致"评审通过后仅用 bash 读日志/删临时文件"也再次触发评审推回（实测：round 2 零问题后仍被要求 round 3）。用户否决扩散（"修改代码以后触发评审，为什么要扩散到 bash 这一类的东西？"）。现行：

1. **FILE_MUTATORS**（`write`/`edit`/`insert_after`/`apply_patch`/`delete`/`hashline_edit`）调用 → 重置 `_calledAdvisorThisRun` + `_verifiedThisRun`（评审/验证确实过时——文件状态变了）。
2. **非写文件副作用工具**（bash/git）→ **只重置 verify**（其 diff/状态快照可能过时），**不重置评审标记**——bash 被系统规则禁止写文件，合规 agent 的 bash 不会改变被评审代码。
3. 由此"评审 → 只读/环境操作 → 完成"不再触发多余评审轮；"评审 → 再次改代码 → 重新评审"保持。

**残余边界（接受）**：违规 agent 用 bash 改代码文件 → 不进 `_touchedFiles` → `hasCodeMutations` 检测不到 → 评审漏过。这是"bash 写文件被禁"规则下不存在的场景（规则与机械判定的一致性优于对违规行为的兜底）。

**内容级判定**（`hasCodeMutations`——guard 共用单源）：`src/` 下任何文件都是代码（含 `src/prompts/*.md`、`src/tmp-*.mjs`——无条件）；`src/` 外的文档文件（`*.md`/`LICENSE`/`NOTICE`/`CHANGELOG`/`AUTHORS` 等）与临时件（`tmp-*` 名/`.tmp`/`.temp` 扩展）**不算**代码修改；无已知路径的修改保守视为代码（`_mutatedThisRun` 兜底）。

### 6.2 失效语义与 completion guard 公式

**"评审失效"不是独立机制，是 guard 条件的状态转换**。guard 的唯一依据是"是否存在未评审的代码修改"：

```js
// src/agent/completion.mjs — 完成时推回判定（depth 0、advisor.guard===true、非工程模式）
if (!pending // async 评审在飞/排队 → 未决不算未评审 → 不推回
    && agent._mutatedThisRun // ① 本 run 改过代码
    && !agent._calledAdvisorThisRun // ② 修改尚未被评审覆盖
    && hasCodeMutations(agent) // 内容判定——src/ 下全算，文档/临时件排除（§6.1）
    && advisorPushbacks < MAX_ADVISOR_PUSHBACKS
    && effectiveAdvisorRound(agent) < MAX_ADVISOR_ROUNDS) { 推回 }
```

- **② = `_calledAdvisorThisRun`**：评审完成置 `true`（sync：工具结果记账；async：非陈旧 settle）——表示"当前代码状态已被评审覆盖"；**再次修改代码**（FILE_MUTATORS）置回 `false`——这就是"失效"。没有 ②，`_mutatedThisRun` 永远为 true（评审不消除修改事实）→ guard 无限推回，run 永不完成；没有失效重置，评审后修复的问题无人验证 → 收敛断裂。**失效是收敛循环（评审→修复→再评审→…直到 0 🔴 或 5 轮 cap）的引擎**。
- **guard opt-in**：`advisor.guard === true`（默认 OFF——2026-08-21 语义重构——advisor 工具本身永远可用，guard 只控制完成时是否推回）；**工程模式永不启用**（工程模式的评审义务由 token/门禁链机械强制——ENGINEERING-MODE.md）；仅 depth 0。
- **async 交互**（§11.2 settle 记账）：评审 launch 后发生 FILE_MUTATORS → settle 判 **stale** → 不置 `_calledAdvisorThisRun`、不签 token → guard 继续推回发起新评审；非 stale 的 code 评审 settle → 置 `_calledAdvisorThisRun`。
- 子代理代码合并（`mergeChildMutations`——eng-coder 返回）→ 合并进父 `_mutatedThisRun`/`_touchedFiles` 并使先前 verify/advisor 标记失效——父代理无法通过"把改动委托给 eng-coder"跳过代码评审（工程模式 code gate 的机械触发点）。
- 新 runAgent → 重置为未评审（新评审周期）→ 按条件判定（见 §2.2 重置语义）。

### 6.3 触发路径清单（严格限定代码修改——用户拍板"不要肆意扩大"）

| 事件 | 评审失效？ | 推回？ |
|---|---|---|
| FILE_MUTATORS（edit/write/apply_patch/insert_after/hashline_edit/delete）改代码 | ✅ | ✅（guard 综合判定） |
| 子代理代码合并（mergeChildMutations） | ✅ | ✅ |
| bash/git（非写文件副作用） | ❌ | ❌（只失效 verify——快照可能过时） |
| 只读工具（read/grep/lsp/glob） | ❌ | ❌ |
| 写 docs/**、写 tmp-* 临时文件 | 状态位翻转但 `hasCodeMutations` 过滤 | ❌ |
| verify/task/checklist/question/plan 等 | ❌ | ❌ |
| async 评审在飞（池内/排队） | 不推回（未决 ≠ 未评审）；stale settle 后恢复推回 | — |
| 新 runAgent（新任务） | 重置为未评审（新评审周期） | 按条件判定 |

设计理由：bash 被系统规则禁止写文件——合规 agent 的副作用工具不可能改变被评审代码，故不触发评审；违规场景（bash 改文件）与 `hasCodeMutations` 盲区一致，接受（规则与机械判定的一致性优先）。

## 7. 响应表纪律（Action 三值）

 `discipline-normal.md`（普通模式）/ `persona-engineering.md`+`discipline-engineering.md`（工程模式——父代理——旧 engineering.md 施工③退役后宿主）的响应表纪律（纯提示词纪律——**不加机械解析**——响应表仍是"聚焦参考"，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取（`extractAgentResponseTable`），保持逐字。每 issue 一行；`#` = advisor 的 issue 编号（**round2+ 用 `Orig#`**——原编号，不重编号）。
2. **`Action` 三值封闭词表**：`Fixed`（已改代码/设计）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴，不得用于静默丢弃真缺陷）。`Detail` = 改了哪、在哪（file:line），或证据/理由。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码/设计——"之前就有""不是我引入的"永远不是跳过修复的理由；问题何时出现不决定它该不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**（父代理不直接写实现代码）；一个 🔴 既不修也不 surface = 阻断收敛。

## 8. 需求契合度检查（requirement fit）

评审的传统维度（正确性/安全/一致性/完整性）只检查"代码对不对"，不检查"做的是不是用户要的"——实现者可以把功能做对但做错方向（实测：声称"交替显示修复完成"却让工具调用整体消失；声称"记录里有工具调用"却把清单附加在尾部、时序丢失）。需求-实现偏差没有被任何旧评审维度覆盖（2026-08-06 决策）。

- **ROUND1 提示词新增评审维度**（`advisor-round1.md`）——核对实现与用户诉求的差异，两个对照：
  - (a) **声称 vs 实现**：实现者陈述的目的（对话背景/响应表/提交说明）对照实现实际行为——"声称做 X 却给了 Y"是偏差；
  - (b) **期望 vs 形态**：需求文档（Project Guide 指向）与用户明确期望对照交付形态——"要 A 却给了 B"是偏差。
- 偏差按影响标 🔴/🟡，Issue 中写明：用户要什么、实现给什么、差在哪。**证据约束**：判断必须引用证据（用户原话或实现行）——无证据的"需求偏差"至多标 🔵——与 §5 citations 机械校验共用同一证据规则。
- **需求文档是主参照**（2026-08-08 决策）：评审 user 消息注入 `## Project Guide (AGENTS.md)`（预算 = max(8KB, 评审模型上下文 × 5%)——注入段标注 `<!-- Project root: … -->`），评审者第一步必须读它并按指引读需求文档——"用户需求在文档里，对话背景只是补充"（对话背景只取最近 3 轮）；无 AGENTS.md 时诚实降级（明说以对话背景为准）。
- **项目根定位**：项目根是工作目录下的**子目录**——从评审范围第一个文件所在目录**在 cwd 边界内**向上找最近 AGENTS.md（monorepo：被评审文件归属的子项目就是项目根）；都找不到 → 诚实降级。**不向上越过 cwd**（用户明确否定"向上查找"）。

## 9. 受影响文件行数标注核查（设计评审维度——F-R24b 权威载体）

> 权威链（指环单向化）：设计文档的行数标注**义务**与档位判据 = METHODOLOGY.md（代码结构分层章 / F-R24a 挂钩）；advisor design review 的**核查维度行为语义** = 本节（METHODOLOGY F-R24b 只放挂钩指针）；执行实现 = `advisor-design.md` Review Criteria 第 8 维 "Affected-file size annotations"。

advisor design review 标准维度补一条（2026-09-07 · R24——与 §8 需求契合度同构的维度补条）：

- **受影响文件行数标注核查**：设计文档「受影响文件」表行数标注是否齐全——每个将修改的源/测试文件标注 `当前行数 + 预计增量`（预计 ≤±N 或"结构不变"；纯 .md 文档豁免）+ 超档拆分规划是否在。
- **标注数值抽查**：抽样核实标注的行数与磁盘一致；含 **≥300 单体函数触及抽查**——函数档是第一判据：文件 ≤500 行而内含 300+ 行单体函数 = 仍未达标；文件档 >300 主动审视 / >500 必须拆——封口语义——无豁免通道。

## 10. 工程模式集成（收敛相关）

工程模式（`agent.engineering: true`）承诺 "Advisor is mandatory at both design and code gates"。机械强制链的**完整机制权威 = ENGINEERING-MODE.md**——本文件只留收敛相关语义：

- **Design gate**：spawn eng-coder 时 token 校验 + 写文件门禁（`_engDesignReviewed`）——确保设计评审先行；design 评审通过（token 回显）时同步置位。凭证机制（designId 槽/消费/多槽/TTL）权威 = ENGINEERING-MODE.md（凭证机制节——含"凭证不落文档"）。
- **Code gate**：eng-coder 返回后 `mergeChildMutations` 使父代理 guard 触发（§6.2）——无法绕过代码评审。
- **guard 在工程模式关闭**（§6.2）——评审义务由上述机械链承担，不靠 completion 推回。
- **轮次与 cap**：per-review 实例（2026-09-06 起）；cap 仅 code（2026-09-07 起）——design 轮次照常递增、第 6 次不被拒（§3.2）。
- **信任模型边界**（指针）：机械闸作用于 eng-coder 子代理；父代理本身不受写文件门禁约束（需写 docs/），其"设计先行、委托实现、实现后 code review"靠工程提示词约束——详见 ENGINEERING-MODE.md。

## 11. 配置

- 项目级 `.thincoder/advisor.md`：评审准则覆盖——存在则替换内置默认准则（history.mjs `DEFAULT_CRITERIA`——正确性/安全/一致性/完整性/可维护性五维）；项目可在覆盖文件里追加规则（如本仓库的文件尺寸档 >300 advisory / >500 critical）。
- `config.json`：`advisor.provider` / `advisor.model` 可选覆盖主 agent 的 provider/model；`advisor.guard` 为 completion guard 开关（默认 false——§6.2）。
- 轮次提示词硬加载：4 份提示词文件缺失即抛错（防静默降级到劣质内置 prompt）。

## 12. 验证

评审收敛行为（轮次提示词替换、prior 原文注入、确定性轮次判定、cap 仅 code——第 6 次拒 + design 豁免正向探针、guard 推回判定、fresh session、host-verified citations、对象声明块注入）的回归测试按端测试基建分层执行（TESTING.md §1：L0+/L1 `npm test` 快层 / L2 `test:full` 链终父侧——含 slow 层）。提示词锚（"Do NOT look for new issues"、Evidence rule 句等）由各端 prompts 内容断言防回退。

## 变更记录（历史折叠——详见 git log）

- 2026-08-01~08-08 反转链一句演变：cap 引入（防发散拉锯）→ round2+ fresh session + design 并入共享预算 → prior 表重注入 round2+（响应表退为聚焦参考）→ 硬解析/短语匹配删除、prior 改全文原文注入、轮次判定确定性化——现行语义见正文各节。
- 2026-08-21：guard 语义重构——advisor 工具永远可用、guard opt-in（`advisor.guard`）、工程模式关闭。
- 2026-08-22：响应表 Action 三值词表 + 禁 pre-existing（§7）。
- 2026-08-30：评审提速——round1 预算 20 轮（里程碑 6/10/17）、round2/3 15 轮（8 轮兜底）、硬帽 100 不动；删 caller 追踪步骤；评审质量红线（需求契合/证据纪律）不动。
- 2026-09-06：async advisor（R13）——轮次/prior/cap 随 review 实例计（`_advisorRuns`）——实例机制权威 AGENT-LOOP §11.2；同步路径 cap 同改随实例（legacy 直接调用方退化为镜像计数）。
- 2026-09-07：design 评审 cap 豁免裁定（实现批——F1 双处 cap 条件加 design 跳过、F2 guard fallback 只认 open code 实例、F3 文档 drift 清、F4 prompts drift 核查零改；正/反向测试断言；双端全量绿）；R24b 受影响文件行数标注核查维度（§9——METHODOLOGY 挂钩单向化）。
- 2026-09-07：批 A 格式债重写——历史流水折叠、契约句逐字保留、指针按 AGENT-LOOP 重排编号更新（§11.2 async / §12.2 铁律——旧 §24/§18.10 已随 AGENT-LOOP 重写不存）。
