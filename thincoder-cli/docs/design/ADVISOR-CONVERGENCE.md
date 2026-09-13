# Advisor 评审收敛协议（Convergence Protocol）

> 本文档是 advisor 评审收敛机制的设计权威（AGENTS.md：评审代码前必读）。它定义"审查 → 修复 → 复审"循环如何**收敛**：要么全部问题确认修复（passed），要么在有限轮次内机械终止。轮次提示词（`src/prompts/advisor-*.md`）与机械执行层（cap/citations/guard）是本文档语义的执行实现；评审契约句以本文档为准。
>
> **实现载体**：
>
> - `src/prompts/advisor-round1.md` / `advisor-round2.md` / `advisor-round3.md` / `advisor-design.md`——轮次提示词（硬加载——缺失即抛错，防静默降级）。
> - `src/advisor.mjs`——system prompt 轮次选择（`buildAdvisorSystemPrompt`）、round2+ follow-up 构建（`buildAdvisorFollowUp`）、评审会话组装（`prepareAdvisorMessages`）。
> - `src/advisor/run.mjs`——执行与机械 cap（`MAX_ADVISOR_ROUNDS`/`buildCapMessage`/`runAdvisorReview`）；拆分后（第 11 批）：工具循环居 `loop.mjs`（含硬墙 / 预算提示 / 结构化尾接线），压缩与守卫族居 `compaction.mjs`（`MAX_ADVISOR_TURNS`:12 / 六 kind 谓词 / `renderTimeline`）——既有 import 面经 re-export 保面。
> - `src/advisor/convergence.mjs`——round2+ 收敛消息体（正常流与 legacy 路径的单源）。
> - `src/advisor/messages.mjs`——user 消息构建（round1 设计/代码、legacy 收敛路径、对象声明块、Project Guide 注入）。
> - `src/advisor/citations.mjs`——host-verified citations 机械校验；`src/advisor/history.mjs`——响应表/对话背景提取；`src/advisor/repos.mjs`——评审范围采集 + `hasCodeMutations`。
> - `src/agent-tools/advisor.mjs` / `advisor-async.mjs`——advisor 工具（sync 执行、async 后台池、cap 预检、per-review 实例；结算 / 陈旧判定拆出至 `advisor-settle.mjs`——第 11 批）；`src/agent/record-results.mjs`（工具结果记账）；`src/agent/completion.mjs`（完成 guard 推回）。
>
> **权威边界**：
>
> - **同步评审路径 = 本文档**（轮次语义、prior 注入、cap、证据纪律、响应表）。
> - **async 评审路径 = AGENT-LOOP §11.2**（async advisor——R13——`_advisorRuns` per-review 实例解析/后台池/settle 记账）——async 面上本文档的轮次/cap 语义以 §11.2 的实例机制落地（R13 = 2026-09-06 用户需求"主代理跑 advisor 不阻塞前端"，已实现）。
> - **判定铁律 R1-R7 = AGENT-LOOP §12.2**（注入全部 4 份提示词尾部的 "Judgment Rules" 块）——与本文件**正交**：本文件管轮次衰减/收敛上限（轮次行为），铁律管严重级怎么定（判定内容）——铁律不改变轮换行为（Round 2/3 的新问题权限不变）。冲突时以本文件轮次表为准。
> - **工程模式 = ENGINEERING-MODE.md**（token/门禁/guard 开关/信任模型）——本文件只保留收敛相关与指针。
> - 设计文档档位纪律（>300/>500 拆分判据）= 纪律层 `src/prompts/discipline-normal.md`（代码结构判据节）；行数标注义务 = 纪律层 `src/prompts/discipline-engineering.md`「文档规范」节；评审核查维度行为 = 本文档 §9（原 METHODOLOGY.md 已退役入 `_archive/`——权威链改指纪律层）。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/ADVISOR-CONVERGENCE.md`——本档保留设计与测试细节。

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

提示词自报工具轮预算（防止评审者按预算花满时间的放大器）：round 1 = **20** 轮（里程碑引导 6/10/17——三分之一/一半/接近上限）；round 2/3 = **15** 轮（8 轮未验完即收尾兜底）。机械硬帽 **100 工具轮**（`MAX_ADVISOR_TURNS`——工具循环止损（`loop.mjs`；常量居 `compaction.mjs:12`）——type-agnostic，design 评审同受；评审死循环时 host 机械打断）。

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

## 7. 响应表纪律（Action 四值）

 `discipline-normal.md`（普通模式）/ `persona-engineering.md`+`discipline-engineering.md`（工程模式——父代理——旧 engineering.md 施工③退役后宿主）的响应表纪律（纯提示词纪律——**不加机械解析**——响应表仍是"聚焦参考"，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取（`extractAgentResponseTable`），保持逐字。每 issue 一行；`#` = advisor 的 issue 编号（**round2+ 用 `Orig#`**——原编号，不重编号）。
2. **`Action` 四值封闭词表**：`Fixed`（**已落地**——已改代码/设计）、`Dispatched`（**修正轮在途——尚未落地**）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴，不得用于静默丢弃真缺陷）。`Detail` = 改了哪、在哪（file:line），或证据/理由。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码/设计——"之前就有""不是我引入的"永远不是跳过修复的理由；问题何时出现不决定它该不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**（父代理不直接写实现代码）；一个 🔴 既不修也不 surface = 阻断收敛。
5. **收口时序**（评审后）：裁决表落定后，修正轮 ⇄ 用户批准的先后见 **§13**——`Dispatched` 行必须在批准请求前逐条收敛为 `Fixed`。

## 8. 需求契合度检查（requirement fit）

评审的传统维度（正确性/安全/一致性/完整性）只检查"代码对不对"，不检查"做的是不是用户要的"——实现者可以把功能做对但做错方向（实测：声称"交替显示修复完成"却让工具调用整体消失；声称"记录里有工具调用"却把清单附加在尾部、时序丢失）。需求-实现偏差没有被任何旧评审维度覆盖（2026-08-06 决策）。

- **ROUND1 提示词新增评审维度**（`advisor-round1.md`）——核对实现与用户诉求的差异，两个对照：
  - (a) **声称 vs 实现**：实现者陈述的目的（对话背景/响应表/提交说明）对照实现实际行为——"声称做 X 却给了 Y"是偏差；
  - (b) **期望 vs 形态**：需求文档（Project Guide 指向）与用户明确期望对照交付形态——"要 A 却给了 B"是偏差。
- 偏差按影响标 🔴/🟡，Issue 中写明：用户要什么、实现给什么、差在哪。**证据约束**：判断必须引用证据（用户原话或实现行）——无证据的"需求偏差"至多标 🔵——与 §5 citations 机械校验共用同一证据规则。
- **需求文档是主参照**（2026-08-08 决策）：评审 user 消息注入 `## Project Guide (AGENTS.md)`（预算 = max(8KB, 评审模型上下文 × 5%)——注入段标注 `<!-- Project root: … -->`），评审者第一步必须读它并按指引读需求文档——"用户需求在文档里，对话背景只是补充"（对话背景只取最近 3 轮）；无 AGENTS.md 时诚实降级（明说以对话背景为准）。
- **项目根定位**：项目根是工作目录下的**子目录**——从评审范围第一个文件所在目录**在 cwd 边界内**向上找最近 AGENTS.md（monorepo：被评审文件归属的子项目就是项目根）；都找不到 → 诚实降级。**不向上越过 cwd**（用户明确否定"向上查找"）。

## 9. 受影响文件行数标注核查（设计评审维度——F-R24b 权威载体）

> 权威链（指环单向化）：行数标注**义务**与档位判据 = 纪律层（`discipline-engineering.md`「文档规范」节 +<br>`discipline-normal.md` 代码结构判据节；原 METHODOLOGY.md 已退役）；核查维度行为语义 = 本节；<br>执行实现 = `advisor-design.md` 第 8 维。

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

## 13. 评审后收口：裁决表 Action 四值 + 修正轮 ⇄ 用户批准 时序（2026-09-11 批）

> 需求层 = `../requirements/ADVISOR-CONVERGENCE.md` §6（F7–F10 / N4–N6）；批次档 = `../batches/2026-09-11-PROMPT-REVIEW-ORDER.md` §1。
> **归属判定**：本机制的**提示词实现面**驻本档（§7 + 本节）；工程模式交付链的机制权威仍在 `ENGINEERING-MODE.md`
> （该档另有在途链——本批不碰；需同步的登记面见 §13.9「后续登记项」）。

### 13.1 问题陈述（两个缺口——逐字实证）

**缺口一：链上缺「评审后修正轮」节点。** 链行（现状逐字）= 「批次讨论收口 → spawn eng-designer → **核验其产出** →
提醒用户发起设计评审 → **用户批准** → spawn eng-coder 实现」——四面同位（中文权威 `docs/design/prompts/persona-engineering.md:18-19`；
英文落地 `src/prompts/persona-engineering.md:21-22`；VSC 两镜像同名同位）。锚#3 只定修正轮 **docs FIRST**
（`src/prompts/discipline-engineering.md`「交付链收口」节——CLI `:135-138` / VSC `:136-139`，as-of 2026-09-11）——未定它与用户批准的先后，也未定修正轮可改什么。

实证后果：第 3 批（`../batches/2026-09-10-MODEL-SELECTION.md`——13 条采纳项修正轮）与第 6 批
（`../batches/2026-09-11-DEEPSEEK-V41-FLASH.md`——8 条）均「评审 pass → 父侧同时（a）派修正轮（b）请用户批准」；
父侧只能临场判断（“7 条均为评审派生小改、不改已裁内容”）——**该判断没有规则支撑**；第 6 批的「严格序」为临场发明、未入档。

**缺口二：`Fixed` 语义漂移。** 字面定义 = `Fixed`（you edited the code）= **已改完**；实况按「**已派工/在途**」填写
（第 3 批 13 条、第 6 批 7 条）——填表时修正轮尚未落地 → 裁决表与真实状态脱节（用户读表 = 已修，实际在途）。
定义副本面 = 8 文件（`discipline-engineering.md` 4 + `discipline-normal.md` 4，见 §13.3 落点）。

### 13.2 方案选型对比

**表 1：`Fixed` 语义方案**（判据 = 向后兼容既有批次表 · 用户读表歧义最小 · 与评审侧文本一致）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | ① **保「已改完」语义 + 补在途态**：`Fixed` = 已落地；新增 `Dispatched` = 修正轮在途 | 兼容：旧表语义不被追溯改写（旧批把在途写成 `Fixed` = 当时语义缺陷，冻结档不回改）；歧义：四值封闭集，每行状态唯一可读；评审侧：无定义副本（§13.5 实证）——无联动成本 | 代价：词表 3 → 4；三值句 8 文件同批改（D3 计数同改） | **选定** |
| 2 | ② **改语义**：`Fixed` = 已定（含在途）+ 每行显式标注落地状态 | 兼容：改写既有词条语义（旧表 `Fixed` 被追溯重解释）；歧义：落地状态落 `Detail` 自由文本 = 新的歧义源；评审侧：无副本、无额外成本 | 代价：一词承载两态，与「封闭词表」设计原则冲突 | 否决（状态不在枚举里 = 用户仍需读自由文本） |

**表 2：修正轮 ⇄ 用户批准 时序方案**（判据 = 用户读表歧义最小 · 父侧裁量空间最小 · 可机判 · 延迟代价）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | ① **严格序**：修正轮落地并经父侧核验 → 才请求批准 | 歧义：请求批准 = 一切已定，无在途；裁量：零（不存在“要不要等”的判断）；可判：批准请求时点前是否有在途修正轮可从会话状态判定；延迟：需修正轮时批准请求晚一轮 | 代价：一次往返延迟（= 修正轮运行时长） | **选定**（与第 6 批 §4「严格序」同口径——该口径经用户认可） |
| 2 | ② **并行 + 强制声明**：在途时可请求批准，但必须声明「修正轮挂起中 + 逐条内容 + 不含新语义/新范围」 | 歧义：请求批准仍可携带在途状态——用户要读声明才知真相（**正是本次质疑的形态**）；裁量：父侧又要判断“算不算并行例外”；延迟：零 | — | 否决（保留临场判断面 = 原缺陷未除） |
| 3 | ③ **混合**：默认严格序，紧急时并行 + 声明 | 歧义同 ②；「紧急」判据不可机判 | — | 否决（判据不可判 = 回到发案现场） |

### 13.3 契约一：裁决表 `Action` 四值（逐字文本）

**语义定义**（供实现与评审判据）：`Fixed` = **已落地**（代码/设计已改）；`Dispatched` = **修正轮在途**
（已派/已启动，尚未落地）；`Not an issue` / `Deferred` 语义不变。**收敛义务**：批准请求前，`Dispatched` 行须已逐条
收敛为 `Fixed`，并随批准请求给出落地证据（file:line 或设计档节）。

**中文面文本**（4 个 zh 面：CLI/VSC × `discipline-engineering.md` + `discipline-normal.md`；就地把「三选一」句替换为）：

```
`Action` 恰好四选一：`Fixed`（你改了代码——**已落地**）、`Dispatched`（**修正轮在途——尚未落地**）、`Not an issue`（有证据的技术反驳）、`Deferred`（承认但现在不修——附理由）。
```

**英文面文本**（两端 `src/prompts/discipline-engineering.md` 与 `src/prompts/discipline-normal.md`；就地替换）：

```
`Action` is one of exactly four values: `Fixed` (you edited the code — landed), `Dispatched` (fix round in flight — not yet landed), `Not an issue` (technical rebuttal with evidence), `Deferred` (admitted, not fixed now — with a reason).
```

**落点（8 文件，as-of 2026-09-11）**：CLI `docs/design/prompts/discipline-engineering.md:95` · CLI `src/prompts/discipline-engineering.md:120` ·
CLI `docs/design/prompts/discipline-normal.md:100` · CLI `src/prompts/discipline-normal.md:100` · VSC `docs/design/prompts/discipline-engineering.md:95` ·
VSC `src/prompts/discipline-engineering.md:121` · VSC `docs/design/prompts/discipline-normal.md:100` · VSC `src/prompts/discipline-normal.md:93`。
**注意**：VSC `src/prompts/discipline-normal.md:93` 为**合并行**（响应表 + Action + Detail 同处一行）——只改子句、**不动行结构**；
各行保留既有缩进（zh 面两空格缩进），不做重排。

### 13.4 契约二：修正轮 ⇄ 用户批准 时序（逐字文本）

**（a）链行节点**——四面同文插入（插入子串逐字相同，汉语，进 A12 字面表）：

插入子串 = `**评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** →`

- zh 面（两仓 `docs/design/prompts/persona-engineering.md:19`）改后：

```
→ **核验其产出**（内容性核验）→ 提醒用户发起设计评审（发起权在用户）→ **评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** → 用户批准 → spawn eng-coder 实现。
```

- en 面（两仓 `src/prompts/persona-engineering.md:22`）改后：

```
→ **verify its output** (content-level) → remind the user to fire the design review (initiation stays with the user) → **评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** → user approval → spawn eng-coder for implementation.
```

**（b）时序规则 bullet**——4 个 `discipline-engineering.md` 同文插入；位置 = **紧随「裁决表」条块末行之后、
「轮次衰减」条之前**（对位锚句 = 裁决表块末行“……未解决的 🔴 必须向用户呈现。”/“……surface any unresolved 🔴 to the user.”）：

```
- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），
  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。
  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，
  须显式摆给用户单独定，不得随批准请求一并默认通过。
  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。
```

**落点**：CLI `src/prompts/discipline-engineering.md`（现 221 行）· CLI `docs/design/prompts/discipline-engineering.md`（现 149 行）·
VSC `src/prompts/discipline-engineering.md`（现 228 行）· VSC `docs/design/prompts/discipline-engineering.md`（现 155 行）。

### 13.5 勘察实证（权威源 / 加载点 / 副本面）

| 事实 | 证据 |
|---|---|
| **运行时只加载 `src/prompts/*`** | `src/prompt-overlays.mjs:17-19`（`loadSlot` = `readFileSync(join(__dirname, "prompts", name))`，模块级常量）+ `:48-57`（engineering 场景槽序 = persona-engineering → common → discipline-engineering） |
| **中文权威面不参与加载（零运行时引用）** | `docs/design/prompts/*` 在 `src/**` 零引用（loader 实证——运行时只读 `src/prompts/*`）；`.mjs` 引用仅测试层（双源/跨仓断言所需——实测行位见下注）——双源流程 = 「改中文模板 → 内容把关 → 落地时译写回填 `src/prompts`」（`requirements/PROMPT-SYSTEM.md` §2） |
| **双源同步机制 = 手抄/译写（无脚本）** | 同上零脚本引用；双端为**语义同源、原文自持**（多实现面纪律），跨仓逐字由锚测试守（`test/prompts-mirror-anchors.test.mjs（VSC 仓）`：A1–A8/A11/A12 + 双源同名集合各 15 档） |
| **`Fixed` 定义副本 = 8 文件** | `discipline-engineering.md` ×4 + `discipline-normal.md` ×4（§13.3 落点表；逐文件行号） |
| **评审侧零副本** | `advisor-design.md` / `advisor-round{1,2,3}.md` / `consult-base.md` / `persona-*.md` 对 `Fixed` 词表 grep 零命中——评审侧只描述自身输出格式（VERDICT），不定义 Action 词表 |
| **运行时零解析（四值化无代码影响）** | `src/advisor/history.mjs:8`（`AGENT_RESPONSE_HEADER = "\| # \| Action \| Detail \|"`）+ `:29-45`（`extractAgentResponseTable` 按表头取整段、`agent.history` 只作 round2+ “聚焦参考”）——Action **值**从不解析 |
| **既有断言对词表零断言** | 双端 test 目录 grep `three values\|三值\|三选一` 零命中——改词表不破既有断言（但既有 prompts 锚测试仍须全绿——N4） |
| **链行四面同位** | CLI zh `docs/design/prompts/persona-engineering.md:18-19` · CLI en `src/prompts/persona-engineering.md:21-22` · VSC zh `docs/design/prompts/persona-engineering.md:18-19` · VSC en `src/prompts/persona-engineering.md:21-22`（四面逐字一致——A12 断言对象） |
| **VSC 端无 `docs/requirements/` 层** | `docs/`（VSC 仓）仅 `design/` + 三份根级 .md（三层历史形态——VSC 设计档即其权威） |

> 测试层引用实测（`.mjs` 行位，as-of 2026-09-11——均为中文权威面的读取/断言，非运行时加载）：CLI `test/prompts-async-guidance.test.mjs:428` · `test/eng-designer-role.test.mjs:298` · `test/batch-segment.test.mjs:220`；VSC `test/prompts-mirror-anchors.test.mjs:30（VSC 仓）`。

### 13.6 受影响文件全清单（as-of 2026-09-11 · 当前行数实测）

**实施域（eng-coder 写域——16 项：12 提示词 + 4 测试）**

| 文件 | 端/面 | 性质 | 当前行数 | 预计增量 | 变更 |
|---|---|---|---|---|---|
| `thincoder-cli/src/prompts/persona-engineering.md` | CLI | **落地（运行时加载）** | 46 | ±0（行内插入 ~40 字符） | 链行节点（§13.4a） |
| `thincoder-cli/docs/design/prompts/persona-engineering.md` | CLI | **中文权威** | 46 | ±0（同上） | 同上 |
| `src/prompts/persona-engineering.md`（VSC 仓） | VSC | 落地（运行时加载） | 78 | ±0（同上） | 同上 |
| `docs/design/prompts/persona-engineering.md`（VSC 仓） | VSC | 中文镜像 | 53 | ±0（同上） | 同上 |
| `thincoder-cli/src/prompts/discipline-engineering.md` | CLI | 落地 | 221 | +≤5（新 bullet） | Action 四值 + 时序 bullet |
| `thincoder-cli/docs/design/prompts/discipline-engineering.md` | CLI | 中文权威 | 149 | +≤5 | 同上 |
| `src/prompts/discipline-engineering.md`（VSC 仓） | VSC | 落地 | 228 | +≤5 | 同上 |
| `docs/design/prompts/discipline-engineering.md`（VSC 仓） | VSC | 中文镜像 | 155 | +≤5 | 同上 |
| `thincoder-cli/src/prompts/discipline-normal.md` | CLI | 落地 | 244 | ±0（就地改词） | Action 四值 |
| `thincoder-cli/docs/design/prompts/discipline-normal.md` | CLI | 中文权威 | 247 | ±0 | 同上 |
| `src/prompts/discipline-normal.md`（VSC 仓） | VSC | 落地 | 229 | ±0（**合并行** L93——子句级改） | 同上 |
| `docs/design/prompts/discipline-normal.md`（VSC 仓） | VSC | 中文镜像 | 247 | ±0 | 同上 |
| `thincoder-cli/test/prompts-async-guidance.test.mjs` | CLI | 测试 | 512 | +≤30（新批节：链行/四值/时序双源断言 + 负断言） | T-RO1–T-RO4 已退场（整删——删除记录 = `TESTING.md` §11.3）；T-RO5/T-RO6 未入本批删除面 |
| `thincoder-cli/test/eng-designer-role.test.mjs` | CLI | 测试 | 312 | +≤6（T40 双源循环字面表 +2） | A12 字面扩展 |
| `thincoder-vscode/test/prompts-async-guidance.test.mjs` | VSC | 测试 | 396 | +≤25（同款断言——本端 src + 中文镜像两侧） | T-RO1–T-RO4 已退场（整删——删除记录 = `TESTING.md` §11.3）；T-RO5/T-RO6 未入本批删除面 |
| `thincoder-vscode/test/prompts-mirror-anchors.test.mjs` | VSC | 测试 | 202 | +≤12（A12 字面 +2 + 新面⑥：四值句组 + 时序 bullet 组跨仓逐字——定义见 §13.10） | 跨仓逐字 |

**文档域（eng-designer 写域——逐行 owner 标；不计入 coder 交付清单）**

| 文件 | 层 | owner | 行数（改前 → 现态） | 本批变更 |
|---|---|---|---|---|
| `thincoder-cli/docs/requirements/ADVISOR-CONVERGENCE.md` | 需求层 | eng-designer | 65 → 105 | +§6（F7–F10 / N4–N6 / 范围边界）——**本批已落** |
| `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md` | 设计+测试层 | eng-designer | 234 → 462 | §7 标题与第 2 条改四值 + 新增第 5 条 + §13 全节（含修正轮 8 条落档）+ 变更记录行——**本批已落** |
| `thincoder-cli/docs/requirements/PROMPT-SYSTEM.md` | 需求层（提示词面） | eng-designer | 296 → 301 | §2.5 persona-engineering 行③调用链段（补节点）+ 变更记录行——**本批已落** |
| `ADVISOR-CONVERGENCE（VSC 仓）` | VSC 设计档（端内独立——对位 CLI §7 四值 / §13 收口节） | eng-designer | 287 → 330 | §7 第 2 条四值 + §12 收口节（对位 CLI §13）+ 变更记录行——**本修正轮已落** |

> 行数口径注：「现态」= 本修正轮落地后实测——读取计行 `N lines total`（内容行数 +1，如实施域 VSC `persona-engineering.md` 表 78 / 读取 79 即此差）；「改前」= 原标注值（历史口径）。
> 行数豁免注：提示词与文档均为纯 `.md`（R24a 豁免）；测试档已标改前行数 + 增量上限——**无新增跨档**；存量 >500 面（`thincoder-cli/test/prompts-async-guidance.test.mjs`，实测 512–513 行）不在本批范围。

### 13.7 关键决策记录（含否决备选 + 追溯留痕）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-RO1 | **改动面 = 四面**（CLI 双源 + VSC 双源，每改动落 4 文件） | 运行时读 `src/prompts/*`；内容权威 = `docs/design/prompts/*`——两面都改才不产生“权威未更新/运行时未更新”的任一侧漂移。**否决**：只改 `src/`（权威档 stale，违双源流程）· 只改 CLI 端（VSC 端保持旧规则 = 同机制两端两说，违 N5） |
| D-RO2 | **`Fixed` 方案 ①**（保语义 + 补 `Dispatched`） | 见 §13.2 表 1——用户读表歧义最小 + 不追溯改写旧表 |
| D-RO3 | **时序方案 ① 严格序** | 见 §13.2 表 2——裁量空间归零 + 可机判；与第 6 批 §4 的「严格序」同口径 |
| D-RO4 | **新增文本 = 中文、四面同文**（含两端 `src/`） | 判据 = 跨面同字面 → 一致性可机判性最高（A12 型字面断言）；插图注（第 2 批已落形态：`批次档与执行者纪律` 节中文进 `src/`，`test/prompts-async-guidance.test.mjs` AC22① 即断言中文子串于**双源**）——仅作插图，非依据。既有英文句**就地改词**（Action 词表句不整句改语言） |
| D-RO5 | **时序细则落 `discipline-engineering.md`「评审收敛纪律」节**（不落「交付链收口」节） | 实证：「交付链收口」节**只存在于两端 `src/` 落地档**（中文权威镜像无该节）——落彼处 = 新规则只在落地档、权威档缺规则（违 N5）；「评审收敛纪律」节**四面齐备（4/4）**且已拥有「裁决表」条（同节内聚） |
| D-RO6 | **追溯留痕 = 新老划断，不回填冻结批次档**（F10） | 维度：①第 3/6 批当时无规则，行为不构成违例——无需“纠错”；②两批批次档已冻结（`docs/README.md` §3.4 正文冻结）；③§6 段属父侧写域且已收口。**载体** = 本档 §13.1/§13.7 + 本档变更记录行。**否决**：回填两批 §6 注记（破坏冻结 + 跨批写权）· 写进提示词（§2.7 #15 禁维护者注）· 只登记 TODO（台账≠决策留痕） |
| D-RO7 | **测试落点 = 扩展既有测试档，不新增测试文件** | VSC `test/files.mjs（VSC 仓）` 零变更（新增档须入册）；断言与既有双源/A12 模式同址 |
| D-RO8 | **提示词落笔交 eng-coder，与锚断言同批**（既有裁定支持 + §2.7 #13 口径差） | **既有裁定支持**：`requirements/ENGINEERING-MODE.md:126-128`（§1.5 #8 注「落笔仍走正常链」）+ `:130`（#10）；内容权口径见 §13.8；#13 口径差登记 §13.9。**理由**：§2.7 #12 锚句变更 = 同批改断言（文本+断言同链原子交付）。**备选**（designer/parent 落文本、coder 只改断言）在案 |

### 13.8 与既有纪律的冲突点核对

| 纪律 | 核对结论 |
|---|---|
| **D2 单一权威源** | 时序**细则**仅在 §13.4(b) 的纪律层文本详述；链行只补**节点**（spine），不重述细则；链行与细则并存不构成两说（节点 = 顺序，细则 = 禁止与边界） |
| **D5 冻结窗口** | 本档为本次设计评审对象——评审在途不改本档；改动集齐后统一入场 |
| **D3 计数·枚举** | 「三值 → 四值」的**计数词**（en `exactly three values`→`exactly four values`；zh `恰好三选一`→`恰好四选一`）与**枚举列表**同改；本档 §7 标题计数、§13 用例/验收条数同步 |
| **§2.7 #12 锚稳定** | 锚#1–#7 逐字**零改动**（含锚#3 docs FIRST、锚#4 拍板≠批准）——新增文本进断言表（A12 +2 字面 + 新面⑥），既有断言不改语义 |
| **§2.7 #13 提示词=设计文档性质** | **口径差**（文本落笔谁做）——处置见 D-RO8；**内容权口径**：`ENGINEERING-MODE.md` §1.5 #8/#10 的「内容权 = 主 agent」为**权利归属**，本批**编写分工** = 主 agent 派工、designer 起草逐字定稿（§13.3/§13.4）、主 agent 核验把关、coder 机械落笔——归属 ≠ 分工、无实质冲突；与 #13「架构师直接做」的文本抵牾登记 §13.9 |
| **§2.7 #15 提示词不含维护者注** | 新增文本零日期 / 批次号 / 评审号（本批留痕只在文档面——§13 与需求档 §6） |
| **评审收敛纪律（本档 §7）** | 四值与「响应表不驱动控制流」不冲突——运行时零解析已实证（§13.5）；`Deferred` 语义与适用范围不变 |
| **锚#3（修正轮 docs FIRST）** | **不冲突**：锚#3 管「修正轮 spawn 前先落档」，新增时序管「批准请求前修正轮落地并核验」——同一修正轮可同时满足（序：落档 → spawn → 落地 → 核验 → 请批准） |
| **多实现面纪律（双端）** | 不做 byte-identical 硬一致；一致由同源设计 + 各端断言守（本批不新增端特有段 → VSC 镜像差异表 `README（VSC 仓）` 零变更） |
| **R24a 行数标注** | 提示词/文档 = 纯 .md（豁免）；测试档已标当前行数 + 增量上限（§13.6） |

### 13.9 后续登记项（本批不碰——明示，不静默）

1. **`docs/design/ENGINEERING-MODE.md` 的链/锚登记面**：§2.2 step 6（交付链）、§2.5、§2.6 F2、§2.9（锚清单——新时序规则的登记位）；
   VSC `ENGINEERING-MODE（VSC 仓）` 同名面。**owner = 该链收口之后**（父侧或后续 designer 轮）——本批不碰（他链在途）。
2. **`docs/design/ENGINEERING-MODE.md` §2.22.2（镜像锚表）**：A12 字面表扩展的登记（可选——A12 内容描述「调用链」已覆盖其扩展面；本批跨仓断言由 §13.6 测试档与新面⑥承载）。
3. **`docs/TODO.md`「工程模式 / 评审收敛」组条目**（2026-09-11 登记行）：status 推进 = **父侧核销面**（本批设计档不改 TODO）。
4. **`PROMPT-SYSTEM.md` §2.7 #13 ↔ `ENGINEERING-MODE.md` §1.5 #8/#10 的口径抵牾**（「文本迁移/内容修订 = 架构师直接做」vs
   「落笔仍走正常链（→ eng-coder）」——同日两条用户裁定的文本级冲突）：本批按 #8/#10 系处置（D-RO8）、**两档文本不改**；
   登记去向 = 父侧同步登记 `docs/TODO.md`（或随该两档收口链）——本批只登记、不决议。

### 13.10 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-RO1 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F7 / N5 |
| T-RO2 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F9 / N6 |
| T-RO3 | 边界 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F9 / N5 |
| T-RO4 | 正常 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F7 / F8 |
| T-RO5 | 错误（反例） | 12 个改动提示词档 | 负断言：无 `恰好三选一` / `exactly three values` 残留；zh persona 面无旧相邻形态 `（发起权在用户）→ 用户批准`、en persona 面无 `(initiation stays with the user) → user approval`（防“追加两版”） | F7 / F9 |
| T-RO6 | 边界 | 新增文本 + 既有锚 | §2.7 #15：新增文本零日期/批次号；锚#1–#7 字面逐字在位；既有 prompts 锚测试（双端）全绿 | N4 / N6 |

> **新面⑥定义**（VSC `test/prompts-mirror-anchors.test.mjs（VSC 仓）` 第六断言面——文件头注「断言五面」→「断言六面」同改）：**本批同文组跨仓逐字**（CLI ↔ VSC），两组——
> **组 1 四值句**：§13.3 中文面整句（4 文件 = 双端 × `docs/design/prompts/{discipline-engineering,discipline-normal}.md`）与英文面整句（4 文件 = 双端 × `src/prompts/{…}`）——zh↔zh / en↔en 跨仓逐字（T-RO2/T-RO3 原逐文件子串断言已退场——整删，删除记录 = `TESTING.md` §11.3；跨仓逐字由本面承载）；
> **组 2 时序 bullet**：§13.4(b) bullet 全文（4 文件 = 双端 × 双源 `discipline-engineering.md`）跨仓逐字。链行组（2 字面）由 A12 字面 +2 承载（面②内）——不重复。

### 13.11 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-RO1 | 判据面退场（T-RO1 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F7 |
| AC-RO2 | 跨仓逐字：`prompts-mirror-anchors.test.mjs` A12 字面 +2 绿 + 面⑥（四值句组 + 时序 bullet 组跨仓逐字——定义 §13.10）绿 | N5 |
| AC-RO3 | 判据面退场（T-RO2/T-RO3 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F9 / N6 |
| AC-RO4 | 判据面退场（T-RO4 整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F7 / F8 |
| AC-RO5 | 零残留负断言（T-RO5 绿——旧三值句 / 旧相邻形态零命中） | F9 |
| AC-RO6 | 既有 prompts 锚测试双端全绿（`cd thincoder && node test/run-fast.mjs`；`cd thincoder-vscode && node test/run-fast.mjs`）+ 锚#1–#7 字面逐字在位 | N4 |
| AC-RO7 | 范围外零改动（`git status`：`src/advisor/**`、`src/agent-tools/advisor*.mjs`、`src/prompts/advisor-*.md`、`src/prompts/consult-base.md` 零变更） | 需求 §6.4 |
| AC-RO8 | 文档面与文本一致（VSC 设计档 §7 四值 + 时序节 + 变更记录行；`requirements/PROMPT-SYSTEM.md` §2.5 链行含节点）；`node scripts/check-doc-width.mjs` 双端新增违规 0 | N6 |
| AC-RO9 | 追溯留痕：本档变更记录含「新老划断」行；两冻结批次档**不在本批改动集**——判据 = 批次档交付清单与 `files` 委托声明均不含 `docs/batches/2026-09-10-MODEL-SELECTION.md` / `docs/batches/2026-09-11-DEEPSEEK-V41-FLASH.md`（如需加证 = 批前/批后哈希比较；两档现存修改属他链，不入本批判据） | F10 |
| AC-RO10 | 生效声明：交付报告写明「提示词改动需 **reload** 会话后才生效」——不得以静态断言绿声称已生效 | N4 类比 |

### 13.12 边界（本批不做）

- 不改评审机制代码与评审侧提示词（§13.5 实证：词表运行时零解析、评审侧零副本）
- 不改工程模式机制的**机制档**（`ENGINEERING-MODE.md` 两仓——见 §13.9 后续登记项）
- 不新增锚号、不新增测试文件、不改 `thincoder-vscode/test/files.mjs`
- 不做双源同步脚本自动化（本批只做规则文本；脚本化不在需求内）
- 不重排既有段落、不改行结构（VSC `src/prompts/discipline-normal.md:93`（VSC 仓） 合并行只做子句级改）
- 不改批次档与 TODO / README / CHANGELOG（父侧写域）

## 14. 评审/凭证链边缘守卫（溢出 / 信号 / cite / 超时——2026-09-11 第 11 批）

> 需求层 = `../requirements/ADVISOR-CONVERGENCE.md` §7（F11–F17 / N7–N11）；批次档 = `../batches/2026-09-11-REVIEW-CHAIN-GUARDS.md` §1。
> 条目：A 评审溢出仍签发 token · B approval-signal 未注入 · C cite 校验对无仓前缀路径误报 · D 设计评审 600s 超时零输出（父侧当日追加——**裁定纳入**，理由见 §14.1 D 行 / §14.8 D-CG9）。
> 条目 E：冻结窗口边界（父侧 04:21 追加——**裁定纳入**；「在途」下界定义 + 在途写入拦截——§14.14 / 需求 F17·N11）。
> **冻结窗口（D5）**：本节为**新增节**——§7（四值句）与 §13（全节）属第 9 批在途链，**零碰**；本档变更记录行留待该链收口后由父侧并入（本节自带日期与批次注记，不静默）。
> 上下游不变式：评审语义判据（什么算 pass / changes-required）、凭证机制本体（槽 / TTL / 门禁 / consume）、评审侧提示词 = **零改**。

### 14.0 裁定摘要（批次 §1 五问 + 条目 D）

| # | 问题 | 裁定（详文见对应小节） |
|---|---|---|
| 1 | A：自报 incomplete 的机械可观测信号 → 守卫动作与恢复路径 | 信号 = **宿主截断尾族**（行锚 + 逐字前缀，非自然语言判断）；守卫点 = 结算（settle）；动作 = **缓发**（不签发 + 可见提示 + 恢复指引）——§14.3 |
| 2 | B：注入路径现状 → 守卫位置 + 失败可见性 | 注入面 = `buildAdvisorUserMessage`（round 0）/ `prepareAdvisorMessages`（round 2+）；守卫 = **构建自愈 + 启动断言（fail-closed）+ 压缩定锚**；缺信号 = **拒绝启动**（可见报错，不发请求）——§14.4 |
| 3 | C：解析补全候选 + 误报-漏报取舍 | 候选链 = cwd + **声明范围派生根**（声明文件目录 / 声明仓根）；取舍 = 三条件全中才算命中（**零新增假命中**，宁 unreadable 不模糊匹配）——§14.5 |
| 4 | 测试面：三条（四条）守卫的机器断言 | 新建单测档 `test/advisor-chain-guards.test.mjs`（CLI 无注册档——`test/*.test.mjs` glob 自动发现；**登记要求 = 无**）；用例 T-CG1–T-CG14——§14.11 |
| 5 | 归属与写域：落哪档 / 是否双源面 | 单归属 = 本节（设计+测试层）+ 需求档 §7；**CLI 单端**；VSC 对位面（`thincoder-vscode/src/advisor/{citations,messages,run}.mjs` 同构缺陷）= 登记后续批（§14.10） |
| D | 600s 超时零输出（父侧追加） | **纳入**（同族：宿主侧非正常收尾）——守卫 = 硬墙（单次请求 deadline）+ 0.75 一次性预算提示 + 结构化收尾——§14.6 |

### 14.1 问题陈述（现场复核——file:line 为 as-of 2026-09-11）

**A 溢出仍签发 token**：宿主在 context 溢出时以截断尾收尾——`src/advisor/run.mjs:186` 生成
`Advisor: context window limit reached (N tokens). Review incomplete — …`；而结算只看 token 回显——
`src/agent-tools/design-token.mjs:83`（`tokenPattern.test(rawResult)`）。两条路径独立 ⇒ 时间线里任何位置出现的
token 回显（例如模型先写完结论再继续补充检查）都会让**被截断的评审**拿到凭证（第 8 批轮次 2 实证）。

**B approval-signal 未注入**：信号只在两条消息构建路径注入——`src/advisor/messages.mjs:273-276`（design round 0，
分支条件 `:194` 依赖 `agent._advisorRound === 0`）与 `src/advisor.mjs:279`（design round 2+）。
两条独立缺口：

1. **构建面**：`prepareAdvisorMessages` 的「无 prior 全新评审」路径（`src/advisor.mjs:232-257`）在
   `reviewType === "design"` 且 `_advisorRound ≥ 1` 时落入 **code 形态分支**——`buildAdvisorUserMessage` 的 design 分支
   不再命中，用户消息**零 Approval Signal**（系统提示仍是 design 评审提示词，声称"请求内含 token"）。
   现场复核：以最小 agent 桩直调 `prepareAdvisorMessages`，`{_advisorRound:1, _lastAdvisorOutput:null, _mutatedThisRun:true}`
   → 用户消息 `## Approval Signal` 缺失、token 字面缺失（同态 `_mutatedThisRun:false` 时因 round 复位而不缺）——即该镜像态下**必现**；
   工具路径经 `resolveAdvisorLaunch` 再 scope（`src/agent-tools/advisor-async.mjs:136-137`），正常链据此暂不可达——
   本批以**自愈 + 启动断言**两层封死（自愈覆盖该形态、断言兜底未来路径），不依赖可达性论证。
2. **运行面**：评审中途上下文压缩会**物理丢弃首条 user 消息**——`src/advisor/run.mjs:52-75`
   （`messages.splice(0, len, system, 压缩注记, ...messages.slice(-20))`；首条 user = 评审简报，含 token）
   ⇒ 评审员此后再也无法回显 token（第 7 批轮次 1 实证：评审员原话"本次请求中 `## Approval Signal` 段未随附…无法逐字回显"，
   token/designId 为未填占位符）。

**C cite 校验误报**：`verifyCitations` 只有**单一解析根** —— `src/advisor/citations.mjs:46`（`resolve(cwd, c.file)`），
调用点 `src/advisor/run.mjs:451` 只传 cwd。而评审对象声明带仓前缀（`thincoder-cli/…`），评审员引文多为相对声明范围的
裸路径 ⇒ `file unreadable` 误报（第 8 批 `TOOLS.md:124`、第 7 批 `AGENT-LOOP.md:714` 两处实证——父侧实文核验均存在且正确）。

**D 超时零输出**：超时只在**轮间**检查——`src/advisor/run.mjs:170-172`（`Date.now() - startTime > timeoutMs`），
单次模型请求不受评审预算约束（响应头超时同量级：`src/provider/core.mjs:77-78` 默认 600s；body idle 120s——
`src/provider/core.mjs:72`）。预算语义 = 整场墙钟（`docs/design/AGENT-PARAMS.md:19-39`）。第 10 批设计评审 600s 超时、零产出、
父侧无部分结果可回收——根因候选（证据不足以区分，守卫对两类均有效）：① 预算被探索耗尽（大范围 + 慢模型）；
② 单次调用停滞吞掉预算（无预算感知 deadline）；③ 模型不知预算在烧（无中途提示），撞墙时来不及收敛产出。

### 14.2 方案选型对比

**表 1——A：截断时的凭证动作**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **缓发**（不签发 + 提示 + 恢复指引） | 结论-凭证边界诚实；实现面小（settle 单点）；与既有 stale / 落盘失败两分支同族（未签发 + 清洗 + 提示）；零新依赖 | 大评审真溢出时需重跑一轮（成本只在真溢出发生） | **选定** |
| 2 | 标注后发（照常签发 + 报告加注） | 保留本次评审产出；但凭证 = eng-coder 门禁授权——未完成评审的授权风险直接落到实现；用户已判该行为为缺陷（TODO 原话"溢出仍发 token 的口径需要在机制面明确"） | — | 否决（缺陷本体未除） |
| 3 | 自动重跑（缩范围） | 宿主无法机械判定"缩到多小"（拆分边界是语义判断）；单次评审成本高、串行阻塞链 | — | 否决（发起权在父/用户——与 F15 同口径） |

**表 2——C：引文路径解析候选**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **声明范围派生根**（cwd + 声明文件目录 + 声明仓根） | 覆盖两处实证（裸文件名 → 声明文件目录；仓根相对路径 → 声明仓根）；纯路径派生（零扫描、零 git）；与"评审对象声明"单一来源一致 | 引用**声明范围外**且其仓根不在声明内时仍判 unreadable（残余，如实报告） | **选定** |
| 2 | 双仓全试解（cwd 下所有仓根都试） | 覆盖更广；但候选与声明脱节——可能命中**未声明仓**的同名文件（假命中面扩大）；需仓库发现（git 依赖、非确定） | — | 否决 |
| 3 | basename 全局扫描 | 覆盖裸文件名最全；假命中风险最高 + 全仓 walk 成本 | — | 否决 |

**表 3——D：预算守卫组合**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **硬墙 + 0.75 一次性提示 + 结构化收尾** | 硬墙把预算从"轮间检查"提升为**真墙**（单次请求不得越墙，停滞被墙截断而非无限挂）；提示在墙前给模型收敛机会（"零输出"→"部分产出 + unverified 标注"）；结构化收尾让父侧可判（预算/轮次/工具数） | 评审过程多一条提示消息（不改语义判据） | **选定** |
| 2 | 只改收尾文案 | 成本最低；"零输出"病根（模型不知预算在烧）不变 | — | 否决（不解决本体） |
| 3 | 自动拆分重跑 | 同表 1 候选 3（拆分边界不可机械判定） | — | 否决 |

**表 4——B：防线形态**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **构建自愈 + 启动断言（fail-closed）+ 压缩定锚** | 三层各堵一类：构建面漏注入 / 未来路径回归 / 运行中压缩吞锚；自愈在前使断言成为**真兜底**（零误伤正常路径） | 压缩后多一条定锚消息（~1KB 级） | **选定** |
| 2 | 只加启动断言 | 漏注入被拒即"可见"；但正常路径仍会撞（拒 = 重跑一轮，用户成本高） | — | 否决 |
| 3 | 只加压缩定锚 | 只堵运行中丢失面；构建面缺口仍可达 | — | 否决 |

### 14.3 契约一：不完整判定族（A / F16 共用单谓词）

**判定信号 = 宿主尾族（截断尾 + 机械失败尾）**（宿主生成，唯一确定性来源；模型自报"未完成"属自然语言——**不纳入**，语义判据边界不动）。

**谓词（单源）**——`advisorIncompleteMarker(text) → kind | null`，块首行逐字前缀（六 kind）：

| kind | 行前缀（逐字） | 生成点（交付态·实测） |
|---|---|---|
| `context_limit` | `Advisor: context window limit reached (N tokens).` | `src/advisor/loop.mjs:124` |
| `turn_cap` | `Advisor: stopped after 100 tool rounds` | `src/advisor/loop.mjs:113` |
| `timeout` | `Advisor: review timeout after {S}s.` | `src/advisor/loop.mjs:103`（另 :172 / :180 同判；`timeoutTail` = `compaction.mjs:120`） |
| `empty` | `Advisor: empty response — review was inconclusive` | `src/advisor/loop.mjs:187` |
| `interrupted` | `Advisor: interrupted.` | `src/advisor/loop.mjs:92` / :176 |
| `review_failed` | `Advisor: review failed` | `src/advisor/run.mjs:233`（catch 内字符串 resolve——不 throw） |

匹配规则：**块首行扫描**（按空行分块，逐块取首行 trim 后测前缀）——`renderTimeline`（`src/advisor/compaction.mjs:151`）
以空行连接时间线与尾 ⇒ 六条尾均以块首行形态落地（`review_failed` 为独立返回串 = 文本首行）；
**不得**只测首行（既有 `ADVISOR_FAILURE_TEXT` 的 `^` 锚即漏「时间线 + 尾」形态——`src/agent-tools/advisor-async.mjs:236`，本批改正）。
**负向精度**（轮次 1 修正）：引文中同串的**非块首形态**（围栏内行 / 表格行 / 引用行）**不得**判 incomplete（T-CG21 锁定）；
块首裸行引用同串的残余误报方向安全（fail-closed——多付一轮重跑，如实登记）。

**三个消费点（同谓词）**：

1. **design 结算**（`settleDesignReview`，`src/agent-tools/design-token.mjs`）：`incomplete` 非空 ⇒ **一律 `passed:false`**——
   剥除全部 token 回显（既有 `makeDesignTokenRegex(…, "g")` 复用）→ 追加未签发提示（逐字见下）→ 不写槽、不关实例（可重评）。
2. **code 完成守卫（F16/A3）**（`settleAdvisorRun`）：`failureVerdict` 判定改用同谓词（替代 `^` 锚的 `ADVISOR_FAILURE_TEXT`；
   **六 kind 全覆盖 = 旧锚六形态语义零丢**——含 `review_failed`（`run.mjs:233` 字符串 resolve、不 throw））——
   截断/失败评审不再置 `_calledAdvisorThisRun`（T-CG5 / T-CG19）。
3. **报告提示**：结算输出携带提示 + 恢复指引（父侧据此决定重跑范围）。

**未签发提示（逐字——机器可 grep）**：

```
评审未完成——token 未签发 (review incomplete — no design token issued; reason: {kind})
以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。
```

**零回归边界**：正常通过路径（无截断尾 + token 回显）行为零变（`passed:true`、槽写入、Approved 后缀）；
`prior` 存储规则不变（评审形态输出仍可作 round 2+ 的 prior——提示随文可见）。
同步路径的 prior 镜像：未完成时 `agent._lastAdvisorOutput` 覆写为**清洗后**输出（防未注册 token 进 prior）。

### 14.4 契约二：凭证链启动 / 全程守卫（B / F12 / F13）

1. **构建自愈**（`src/advisor/messages.mjs`）：`buildAdvisorUserMessage` 改为「内层构建 + 尾包」形态——
   `reviewType === "design" && designToken` 且输出不含 `[DESIGN-TOKEN:{token}` 时，追加 `buildDesignApprovalBlock(designToken, designId)`。
   覆盖所有出口（含 code 形态分支降级态与 legacy 收敛分支），不改任何分支的既有语义。
2. **启动断言（fail-closed）**（`src/advisor/run.mjs`，`prepareAdvisorMessages` 之后、发起之前）：
   `reviewType === "design"` 时校验——① 本次已签发 token（非空）；② `[DESIGN-TOKEN:{token}` 逐字在请求内。
   违反 ⇒ 返回拒绝报告（**不发请求**）：

```
Advisor: design review launch refused — {reason: no design token was minted | the request does not carry the approval signal}. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.
```

   可见性与记账：拒绝报告前缀 `Advisor: design review launch refused` = 稳定契约（同步工具面据此登记
   `_advisorRefusals`——既有池满/cap 同款机制，`src/agent-tools/advisor.mjs:105/117/129`；异步结算面据此不置
   `_calledAdvisorThisRun`）。**可达性如实注**：工具路径恒签发 token ⇒ 该拒绝为**直接调用方兜底**（防御纵深），
   正常链不可达。
3. **压缩定锚**（`src/advisor/compaction.mjs` + 循环接线）：`compactMessages(messages, pinned)` ——
   压缩触发时（首条 user 消息被丢弃的同一动作内）把 `pinned` 作为一条 user 消息重新挂回。
   `pinned` 由评审参数（非模型输出）构建，逐字形态：

```
[review brief — re-attached after context compaction; the original review request is no longer in the context]
{对象声明块（若有）}
## Documents to Review
- {doc} — Read this file in full
{## Approval Signal 块（design + token 时）}
```

   边界：重复压缩允许重复挂回（幂等可读，不做存在性判定）；`pinned` 不含项目指南 / 方法论 / 文档地图（重内容可弃——F13 边界）；
   压缩触发阈值与 abort 阈值零改。

### 14.5 契约三：引文解析候选链（C / F14）

`verifyCitations(text, cwd, opts = {})`（`opts.scope` = 评审对象声明路径列表——调用点 `runAdvisorReview` 传
`[...(documents ?? []), ...(paths ?? [])]`；`appendCitationReport` 同参透传）。签名向后兼容（opts 可省 ⇒ 旧行为）。

**候选根派生（纯路径，零扫描）**——对每条声明路径 `s`（cwd 相对或绝对）：

1. `cwd`（保留——绝对路径与工作区根相对路径保持不变）；
2. `segs = relative(cwd, resolve(cwd, s))` 非 `..` 开头时：`cwd/segs[0]`（**声明仓根**）与
   `extname(s) ? dirname(声明文件) : 声明目录本身`（**声明文件目录 / 声明目录**）。

**逐引文解析**：按候选顺序试 `resolve(root, file)`；命中判据三条件全中——① realpath 在 cwd 内（**围栏不变**）；
② 可读；③ 该行内容包含引文内容。命中记录所用根。

**失败原因三分（报告可判，替代单一 `file unreadable`）**：无任何候选文件存在 ⇒ `file unreadable`；
存在但内容不符 ⇒ `content mismatch @ {解析到的相对路径}`；越围栏 ⇒ `path traversal`（不变）。
报告头行 `[host-verified] N/M citations match current file state.` 不变。

**取舍**：只按"声明范围 + 内容判据"扩充候选——**零新增假命中**（不会因同名文件而误命中：内容必须逐字包含）；
残余如实报告：引用声明范围外、且其仓根不在声明范围时仍判 unreadable。

### 14.6 契约四：预算硬墙 + 提示 + 结构化收尾（D / F15）

1. **硬墙（per-call deadline）**：循环内每次 `chat` 调用计算 `remaining = timeoutMs - elapsed`；`remaining ≤ 0` 走既有超时尾；
   否则调用信号 = `AbortSignal.any([signal, AbortSignal.timeout(remaining)])`（无外层 signal 时直接用 `AbortSignal.timeout(remaining)`）。
   **墙判定绑信号状态（非异常名）**：每轮 `chat` 返回或抛错后——`signal?.aborted`（用户中断）⇒ 原样上抛（中断语义零变）；
   否则「复合信号已中止且用户信号未中止」（`compositeAborted && !signal?.aborted`）⇒ 返回结构化超时尾——**两种运行时形态同判**：
   ① **抛错**——异常名接受 `AbortError` / `TimeoutError` 两名（`AbortSignal.timeout` 的 reason 是 TimeoutError DOMException——
   本仓同款 `src/provider/sse.mjs:168-170` / `src/log.mjs:178-179`）；② **不抛错而返回 partial 结果**——流已有内容时中断
   以 `partial:true` 透传（`sse.mjs:228-235` + `src/provider/core.mjs:233-235`），该形态**不得**按普通结果收尾。
2. **0.75 一次性预算提示**（同一检查点、每场评审至多一次；判定抽成纯函数便于机测）：注入一条 user 消息（逐字）：

```
⏳ review budget: ~{pct}% consumed ({elapsed}s of {budget}s). Converge now: emit your findings table for the evidence you have verified, mark anything you could not verify explicitly as `unverified` (unverified evidence must not support a pass), and emit your verdict line.
```

3. **结构化超时尾**（前缀保持 `Advisor: review timeout after {S}s.`——判定族字面依赖；其后为新增统计与指引）：

```
Advisor: review timeout after {S}s. Review incomplete — the wall-clock budget was exhausted; partial findings (if any) are above.
- rounds: {R} · tool calls: {T} · review text produced: {yes|no}
- budget: {S}s (agent.advisor.timeoutMs) — re-run with a narrower scope (split the review across fewer documents) or raise the budget.
```

   其余五条尾文案**零改**（A 族判定已覆盖；改动面越小越好）。

### 14.7 受影响文件全清单（2026-09-11 · 行数注记 = 批次前 → 交付态·实测 = `N lines total` 口径）

**实施域（eng-coder 写域——10 项：6 改 + 4 新——逐行标签为准，测试档全新计「新」；行数 = 交付同步·实测）**

| 文件 | 行数注记（批次前 → 交付态·实测） | 增量（设计估 → 实测） | 变更 | 档位结论 |
|---|---|---|---|---|
| `src/advisor/run.mjs` | 498 → **239** | −259（实测——设计估 −~285 迁出 + ~37 新增）：启动断言 / 定锚源 / citations 传参 / 谓词 re-export | 拆出 loop.mjs + compaction.mjs | **必拆**（498 逼近 500 硬帽，新增必越；交付清偿 498 → 239 ≤300） |
| `src/advisor/loop.mjs` | 新 → **291** | 291（新档——设计估 ~290） | 工具循环（自 run.mjs 逐字迁出）+ 硬墙（绑信号状态）+ 0.75 提示注入 + 结构化尾 / 压缩定锚接线；**守卫族落 `compaction.mjs`**（交付拆分线——见下行） | 新文件（交付 291 ≤300） |
| `src/advisor/compaction.mjs` | 新 → **158** | 158（新档——设计估 ~75；含守卫族） | `estimateTokens` / `compactMessages(messages, pinned)`（自 run.mjs 迁入 + 定锚 ~15）；**守卫族**：`advisorIncompleteMarker`（六 kind）/ `shouldBudgetNudge` / `budgetNudgeText` / `timeoutTail` / `renderTimeline` / 上限常量 | 新文件（交付 158 ≤300） |
| `src/advisor/messages.mjs` | 402 → **413** | +11（实测——设计估 +~10） | `buildAdvisorUserMessage` 尾包自愈 | 不拆（净增小；>300 为存量档——拆分评估见 §14.10） |
| `src/advisor/citations.mjs` | 78 → **140** | +62（实测——设计估 +~42） | 候选链解析 + 失败原因三分 | 不拆 |
| `src/agent-tools/advisor.mjs` | 227 → **241** | +14（实测——设计估 +~10） | 未完成判定透传 + 同步 prior 清洗 | 不拆 |
| `src/agent-tools/advisor-async.mjs` | 500 → **350** | −150（实测——设计估 −~150 迁出 + ~3） | 拆出 advisor-settle.mjs；settle 接线 | **必拆**（500 = 硬帽**在册**——任何新增必越；交付清偿 500 → 350；import 面经 re-export 保持） |
| `src/agent-tools/advisor-settle.mjs` | 新 → **214** | 214（新档——设计估 ~165；含 E-2 增量） | `settleAdvisorRun` + 失败 / 截断判定块 + 陈旧判定（自 advisor-async 迁入 + 谓词消费；E 族增量见 §14.14） | 新文件（交付 214 ≤300） |
| `src/agent-tools/design-token.mjs` | 105 → **118** | +13（实测——设计估 +~20） | settle 未完成守卫（`opts.incomplete`） | 不拆 |
| `test/advisor-chain-guards.test.mjs` | 新 → **498**（评审轮 1 🔴 压缩 513→498；21 例） | 498（新档——设计估 ~280；含 E 增量） | T-CG1–T-CG14 · T-CG19–T-CG21（修正轮） | 新档（交付 498 ≤500 帽内；>300 advisory——`test/` 存量档；CLI glob 自动发现——**登记要求 = 无**；VSC 端若有 `test/files.mjs（VSC 仓）` 才需入册，本批不涉 VSC） |

> 档位依据：`discipline-engineering.md` 代码结构判据（>300 主动审视 / >500 必拆——无豁免通道）。本批两处**必拆**均为硬约束触发，
> 非可选项；拆分保持既有 import 面（`run.mjs` 继续 re-export `_runAdvisorToolLoop` / `advisorToolsFor` / 谓词；
> `advisor-async.mjs` 继续 re-export `settleAdvisorRun`——既有测试档零改导入路径）。

**文档域（eng-designer 写域——本设计者已落）**

| 文件 | 变更 |
|---|---|
| `docs/requirements/ADVISOR-CONVERGENCE.md`（105 → +~95） | §7（F11–F16 / N7–N10 / 范围边界）——**已落** |
| `docs/design/ADVISOR-CONVERGENCE.md`（462 → +~250） | 本节 §14（含本表）——**已落**（仅新增节；§7/§13 零碰） |

### 14.8 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CG1 | **A 动作 = 缓发** | 表 1——未完成评审不产出可用凭证；与 stale / 落盘失败两分支语义同族。否决：标注后发（缺陷本体未除）· 自动重跑（边界不可机械判定，成本不可控） |
| D-CG2 | **判定信号 = 宿主尾族（截断尾 + 机械失败尾——六 kind）**（块首行逐字前缀） | 唯一确定性来源（宿主生成）；模型自报不纳入（免语义判据）。否决：状态字段（宿主无"完成"字段——尾文本即唯一机械产物）· 自然语言匹配（违"零语义判据"边界） |
| D-CG3 | **单谓词三消费点** | 防止三处各写正则漂移（第 8 批 cite 六处核验的教训）；既有 `^` 锚形态一并改正（A3/F16） |
| D-CG4 | **B = 自愈 + 断言 + 定锚三层** | 表 4——各堵一类缺口；自愈在前 ⇒ 断言零误伤（真兜底） |
| D-CG5 | **定锚内容 = 对象声明 + 文档清单 + Approval Signal**（不含项目指南 / 方法论 / 文档地图） | 凭证与锚必须存活（F13）；重内容可弃（保留整条简报会使压缩失去意义，且更易撞 abort 阈值） |
| D-CG6 | **design 无 token ⇒ 拒绝启动**（fail-closed） | "不得静默发未填占位符"的直接落实；工具路径恒有 token ⇒ 正常链零影响。否决：告警放行（等于继续发"回显不存在的 token"的请求） |
| D-CG7 | **C = 声明范围派生根** | 表 2——覆盖两处实证、纯路径派生、与声明单一来源一致。否决：双仓全试解（假命中面 + git 依赖）· basename 扫描（假命中 + 成本） |
| D-CG8 | **失败原因三分 + 命中根透明** | 父侧不再人肉复核（本批要消灭的成本）；三条件全中 ⇒ 零新增假命中 |
| D-CG9 | **D 纳入本批**（同族：宿主侧非正常收尾） | 四条同属"评审链边缘守卫"，一次收口；D 的凭证面由 A 族覆盖（超时 ∈ 判定族），机制面补硬墙 / 提示 / 结构化收尾。否决：另行登记（同族拆分 = 固定成本翻倍 + 判定族割裂） |
| D-CG10 | **档位拆分**（run.mjs 拆 loop/compaction；advisor-async 拆 advisor-settle） | 500 硬帽强制（两文件均已在帽上）；拆分是正确性面要求。否决：就地压缩注释 / 合并行（应付式，违正确性优先） |
| D-CG11 | **CLI 单端**（VSC 对位面登记后续批） | 本批证据全部 CLI 侧；用户批次边界未含 VSC；多实现面纪律 = 各端独立实现、差异**如实上报**（不静默）——登记见 §14.10 |
| D-CG12 | **不改完成守卫公式本体与凭证机制**（槽 / TTL / 门禁 / consume / cap） | 只加"未完成 ⇒ 不签发（design）/ 不计已覆盖（code）"的边界；机制本体权威在 `ENGINEERING-MODE.md` 与 `AGENT-LOOP.md` §11.2（引用不重述） |
| D-CG13 | **`AGENT-LOOP.md` 零碰**（A3 的 settle 记账口径登记为后续项） | 该档正被第 10 批设计评审在途审查（D5 冻结窗口）——同步行待该链收口（§14.10） |

### 14.9 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D2 单一权威源** | 评审语义判据 / 凭证机制 / 超时预算语义均**只引用不重述**（`AGENT-PARAMS.md:19-39` = timeoutMs 预算语义；`AGENT-LOOP.md` §11.2 = settle 池；本档 §6 = 完成守卫公式）；本节只写新增守卫契约 |
| **D3 计数·枚举** | 判定族"六条 kind"的计数与列表同改；§14.7 受影响文件条数（实施域 10 = **6 改 + 4 新**——逐行标签为准）；**A–D 段**用例 17（T-CG1–T-CG14 + 修正轮 T-CG19–T-CG21）、AC 12 与列表一致（全节现值 = 用例 21 / AC 14——见 §14.14 E-计数） |
| **D5 冻结窗口** | 本档只**新增节**——§7/§13（第 9 批在途）与 `AGENT-LOOP.md`（第 10 批在途）零碰；本节改动集齐后统一入场 |
| **D6 回读核对** | 本节与需求档 §7 落笔后回读核实（写入静默失败防护）；实施面验收含回读断言 |
| **D7 变更留痕** | 本档变更记录行**暂不写**（第 9 批链在途）——收口时由父侧并入；本节自带日期 / 批次注记 |
| **凭证不落档** | §14 全文零 token / designId 值；提示文案用 `{token}` / `{kind}` 占位符 |
| **R24a/R24b 行数与档位** | §14.7 逐文件当前行数 + 增量 + 档位结论（两处必拆含拆分计划）；纯 `.md` 文档豁免 |
| **多实现面纪律（双端）** | 不做 byte-identical 硬一致；VSC 同构缺陷**如实上报**（§14.1 证据为 CLI 侧，VSC 侧同构面见 §14.10）——不静默、不跨端追赶 |
| **完成守卫公式（§6.2）** | 公式本体零改；F16/A3 只改"何种 settle 算有判定"的判定谓词（失败判定扩展）——与"未决不算未评审"同向 |
| **`AGENT-PARAMS` 超时语义** | `agent.advisor.timeoutMs` 仍是整场预算（默认 600s，非法回退不变）；硬墙只是把同一预算落实为真墙（单次请求不越墙）——语义无变 |
| **证据 / 引用纪律** | 本节全部事实带 file:line（as-of）；对既有实现的描述以磁盘为准（发现 `src/advisor/run.mjs:200-207` 注释所述 `core.mjs composes AbortSignal.any` 与 `src/provider/core.mjs` 实况不符——陈旧注释，登记 §14.10） |

### 14.10 后续登记项（本批不碰——明示，不静默）

1. **VSC 端对位面**（后续批建议）：`thincoder-vscode/src/advisor/{citations,messages,run}.mjs` 与本批修的三处同构
   （citations.mjs 逐字同源副本；messages.mjs:62 信号块；run.mjs:58/166/170 压缩 / 截断尾）——按各端独立实现纪律同步，
   VSC 新测试档须入 `thincoder-vscode/test/files.mjs` 注册。**本批不碰**（CLI 单端）。
2. **`AGENT-LOOP.md` §11.2 settle 记账行**：A3（截断不置 `_calledAdvisorThisRun`）的判定口径同步——**待第 10 批链收口后**
   （该档正被审查，D5）。
3. **`src/advisor/run.mjs:200-207` 陈旧注释**：与实际（`provider/core.mjs` 无 AbortSignal 组合）不符——实施时一并改正（本批 `run.mjs` 已被改写覆盖该段）。
4. **`messages.mjs` 拆分评估**（交付 413 行——402 → 413，>300 advisory）：本批净增 +11（实测）—— 不拆；若后续继续增厚，按 `loop.mjs` 同法拆分。
5. **父侧核销面**：`docs/TODO.md` 三条目（A/B/C）status 推进 + 需求池指针——父侧写域，本设计者不动。
6. **F16 同步面残留**（coder 披露；交付同步登记——不改语义）：`src/agent/record-results.mjs:114` 的 **sync 记账**无「未完成尾」判定
   （`depth>0` 自审 / 显式 `async:false` / 无 depth 直调——消费面 `src/agent-tools/advisor.mjs:198`）——以截断尾收尾的 sync 代码评审仍置 `_calledAdvisorThisRun`（计「已覆盖」）；
   本批设计（§14.3 消费点 2）只限定 `settleAdvisorRun`（async 结算面），实现与设计一致；需求 F16 行文字面宽于实现范围——**扩展实现或改需求均需独立批次 / 用户裁定（另走链）**。

### 14.11 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-CG1 | 正常 | 谓词输入：时间线 + 六形态尾（context_limit / turn_cap / timeout / empty / interrupted / review_failed 各一）+ 干净评审文本 + 空串 | `advisorIncompleteMarker` → 六个 kind 逐一命中；干净文本 / 空串 → `null`（**块首行**锚——尾不在首行也命中；六覆盖 = 谓词全覆盖断言） | F11 / F16 |
| T-CG2 | 正常 | `settleDesignReview(agent, run, tok, report, {incomplete:"context_limit"})`，report = 时间线（含 token 回显）+ 截断尾 | `passed=false`；报告零 token 字面；含 `评审未完成——token 未签发` + 恢复指引；`_engDesignTokens` 未写；`run.open` 仍 true | F11 / N7 / N9 |
| T-CG3 | 正常 | `settleAdvisorRun`：design entry（同 T-CG2 报告） | 经异步结算同结果；`entry.report` 含提示；槽文件零写 | F11 |
| T-CG4 | 边界 | 干净通过：无截断尾 + token 回显 | `passed=true`；槽写入；Approved 后缀在位；`entry` 计入（零回归锁） | F11（负向） |
| T-CG5 | 错误 | `settleAdvisorRun`：**code** entry，report = 时间线 + context 尾（尾不在首行） | `_calledAdvisorThisRun` **不**置 true（A3/F16；改前该形态置 true） | F16 |
| T-CG6 | 边界 | `prepareAdvisorMessages`：design + `_advisorRound=1` + `_lastAdvisorOutput=null` + `_mutatedThisRun=true` | user 消息含 `## Approval Signal` + 精确 token 字面（改前缺失——回归锁） | F12 |
| T-CG7 | 错误 | `runAdvisorReview(agent,"design",{}, null, …)`（无 token 直调） | 返回 `Advisor: design review launch refused` 前缀；不 throw；未发起请求（零 chat 调用） | F12 / N8 |
| T-CG8 | 边界 | `_compactMessages(>20 条消息, pinned)` / `_compactMessages(≤20 条, pinned)` | 前者结果含 pinned 三锚（对象声明 / 文档清单 / Approval Signal）；后者原样返回（无 pin） | F13 |
| T-CG9 | 正常 | 夹具工作区双仓：CLI `docs/design/X.md` + VSC 仓 `docs/design/X.md`；scope 声明 vsc 档；引文 `X.md:<行>: <vsc 行内容>` | 命中 1/1（经声明文件目录解析）；报告注明解析路径 | F14 |
| T-CG10 | 边界 | 引文 = 仓根相对路径（`docs/design/Y.md:…`）；scope 在 `thincoder-cli/**`；另一仓存在同名文件 | 经声明仓根命中；`X.md` 同名另一仓不被误命中（内容判据） | F14 |
| T-CG11 | 错误 | 引文三形态：不存在文件 / 行内容不符 / `../` 越围栏 | `file unreadable` / `content mismatch @ {path}` / `path traversal`（三分支各一断言） | F14 / N7 |
| T-CG12 | 边界 | `_runAdvisorToolLoop` + chat 覆写：`advisor.timeoutMs=1`，首次返回工具调用 | 返回超时尾：族前缀 + `rounds:` / `tool calls:` / `budget:` 三要素 | F15 / N8 |
| T-CG13 | 边界 | 同上 + **时钟注入**（`_runAdvisorToolLoop` 测试缝 `now`——默认 `Date.now`，生产路径零变）：预算 1000ms，注入序列使首调返回时 elapsed=800（≥ 0.75×1000） | 第 2 轮注入预算提示恰一次（断言提示串；仅一次出现）；**零真实等待、零 wall-clock 依赖**（余量问题消解——原「1500ms vs ~1200ms」行作废） | F15 |
| T-CG14 | 正常 | 纯函数 `shouldBudgetNudge(elapsed, budget, nudged)`：阈值两侧 + `nudged=true` | 0.75 阈值下不提示 / 达阈值提示 / 已提示不重复 | F15 |
| T-CG19 | 错误 | `settleAdvisorRun`：**code** entry，report = 时间线 + `Advisor: review failed (timeout) — …`（字符串 resolve 形态——`run.mjs:233`） | `_calledAdvisorThisRun` **不**置 true（旧锚六形态语义零丢；guard 可重推） | F16 |
| T-CG20 | 边界 | `_runAdvisorToolLoop` + chat 覆写：预算 ~100ms；首调**阻塞至墙触发后返回 partial 形态结果（不抛错）**；另附抛 `TimeoutError` 名异常形态 | 两形态均返回结构化超时尾（族前缀 `Advisor: review timeout after ` + `rounds:` / `tool calls:` / `budget:` 三要素） | F15 / N8 |
| T-CG21 | 边界 | 干净评审文本：含**非块首**的尾前缀引用行（围栏内行 / 表格行 / 引用行三形态）；无宿主尾 | `advisorIncompleteMarker` → `null`（负向精度锁——引文不误判 incomplete；§14.3 匹配规则） | F11（负向） |

> 测试基建：单测零网络、零真实 LLM（chat / 时钟覆写 = 循环参数覆写 + `??` 默认回退，生产路径不可达）、零长等待
> （T-CG13 时钟注入零真实等待；T-CG20 ~0.1s 级——真实墙定时器驱动；余皆为微秒级）；
> 新档由 `test/run-fast.mjs` 的 `test/*.test.mjs` glob 自动发现（CLI 无注册清单档——第 8 批实测结论）。
> 用例编号按新增序：修正轮追加 T-CG19–T-CG21（A–D 映射）；E 段 T-CG15–T-CG18 保持原位。

### 14.12 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-CG1 | 单谓词 + 三消费点：T-CG1（**六 kind 全覆盖**——含 `review_failed`）+ T-CG5 / T-CG19（code 守卫——旧锚语义零丢）+ T-CG21（负向精度锁）绿；`ADVISOR_FAILURE_TEXT` 旧 `^` 锚定义与消费在 `advisor-settle.mjs` / `advisor-async.mjs` **零残留**（grep）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F11 / F16 |
| AC-CG2 | 未完成不签发：T-CG2 / T-CG3 绿（`passed=false` + 槽零写 + 报告零 token 字面 + 提示串在位） | F11 / N7 / N9 |
| AC-CG3 | 正常批准零回归：T-CG4 绿 + 既有 `design-token-settlement.test.mjs` / `async-settle.test.mjs` 全绿 | F11 / N10 |
| AC-CG4 | 信号必达：T-CG6 绿（自愈）+ T-CG7 绿（拒绝启动前缀逐字） | F12 |
| AC-CG5 | 压缩不吞锚：T-CG8 绿；定锚内容来源 = 评审参数（grep：pin 由 `documents` / `object` / `designToken` 构建）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F13 |
| AC-CG6 | 解析补全零假命中：T-CG9 / T-CG10 / T-CG11 绿；`citations.mjs` 无全盘扫描（grep：无 `readdir` / glob 调用） | F14 |
| AC-CG7 | 预算硬墙 + 结构收尾：T-CG12 / T-CG20 绿（三要素行在位 + 族前缀逐字；**墙在调用中触发——含 partial 不抛错返回形态**） | F15 / N8 |
| AC-CG8 | 预算提示：T-CG13（**时钟注入——判定确定、零真实等待**）/ T-CG14 绿（0.75 阈值、一次性） | F15 |
| AC-CG9 | 提示可执行：各提示串含恢复关键词（`narrower` / `agent.advisor.timeoutMs` / `re-run`）——用例断言 | N8 |
| AC-CG10 | 文档-实现逐字一致：§14 三条逐字文案（未签发提示 / 拒绝报告前缀 / 超时尾三要素）在实现中 grep 命中；`node scripts/check-doc-width.mjs` 新增违规 0 + 新增超宽 0 | N10 |
| AC-CG11 | 档位：无文件越 500 硬帽；`run.mjs` ≤300、`loop.mjs` / `compaction.mjs` / `advisor-settle.mjs` ≤300、`advisor-async.mjs` ≤500（实测对表） | N10 |
| AC-CG12 | 零回归 + 边界：`cd thincoder && node test/run-fast.mjs` 全绿；新档被 glob 发现（测试数 +1 档）；`src/prompts/**` 与 VSC 仓零改动（`git status` 判据）；文档凭证扫描零命中 | N9 / N10 |

### 14.13 边界（本批不做）

- 不改评审语义判据、不改评审侧提示词（`src/prompts/advisor-*.md`）、不改凭证机制本体（槽 / TTL / 门禁 / consume / cap）
- 不做自动重跑 / 自动缩范围 / 自动拆分评审范围（恢复动作发起权在父代理或用户）
- 不引入 basename 全局扫描 / 模糊匹配 / git 依赖的解析候选
- 不做 VSC 端对位面（登记 §14.10）；不碰 `AGENT-LOOP.md`（第 10 批在途）与 `AGENT-PARAMS.md`（语义无变，无需改）
- 不改 `ENGINEERING-MODE.md` 链、`docs/TODO.md` / README / CHANGELOG（父侧写域）
- **UI / 交互**：本批零 UI 面（提示文案落在评审报告文本与工具返回值内——无 TUI / VSC 显示改动；无 `open` 项）

### 14.14 契约五：冻结窗口边界——「在途」下界定义 + 在途写入拦截（E / F17 / N11）

> 追加注（E——父侧 2026-09-11 04:21 登批次档 §1）：本子节为第 11 批条目 E 的设计落档；§14.0–§14.13（A–D）逐字零改，E 的增量自成本节。
> E 的实证 = 第 10 批 id=20 评审实例作废（结算输出「评审目标已变更——token 未签发」）。

**E-1 问题陈述（实证 + 机制复核——file:line 为 as-of 2026-09-11）**

- **实证**（批次档 §1 条目 E）：评审实例**点火后、报告送达前**，父侧改被审文档（批次档 §1 写「用户授权」段）→ 结算判 stale → **整轮作废**；本轮无 token 损失（本就 changes-required），**pass 轮 = token 直接丢失**。
- **归因**：D5 现文（`docs/design/ENGINEERING-MODE.md` §2.19 表 D5 行 :528 · 提示词 `discipline-engineering.md` D5 行 :109）只写「评审在途不改被审文档」——**未定义「在途」的下界**；父侧按「子进程退出 = 安全」执行 → 踩中。
- **机制复核（陈旧判定的射程与时点——现行实现；file:line = 交付同步）**：
  1. 起点 = 点火受理：异步启动快照 `launchSeq`（`src/agent-tools/advisor-async.mjs:265`）——同批中先于点火的写不计、后于点火的写计入；
  2. 评估面 = 设计评审声明文档集 `docAbs`（`advisor-async.mjs:266-268`，即 `documents` 声明——含批次档）；
  3. 判决 = `reviewIsStale`（`src/agent-tools/advisor-settle.mjs:58-70`——第 11 批自 advisor-async 迁出）：`seq > launchSeq` 的父侧变更命中 `docAbs` → stale；
  4. 判决时点 = 结算记账（`settleAdvisorRun`，`advisor-settle.mjs:123`——调用点 `advisor-async.mjs:310-314`，经 `async-settle.mjs:163-177` 于评审 promise 收尾时调用）；读取的是**读取时刻**的变更日志；
  5. 违规后果（既有行为——保留）= stale 分支：剥 token 回显 + 「评审目标已变更——token 未签发」前缀（`advisor-settle.mjs:198-204`）、不签 token、不计评审覆盖；
  6. 父侧可观察下界 = **报告送达**（结算 → 挂起移交 `_pendingAsyncResults`（`async-settle.mjs:171-174`）→ digest 注入 / 回合尾 collect）**或取消·中止**（`async-settle.mjs:134-146` / `:163`）。
- **边界澄清**：**「子进程退出」不是窗口边界**——结算记账晚于进程收尾执行（promise 收尾微任务级）且对父侧不可观察；窗口实际射程 = **点火 → 结算读取**（进程退出后、结算读取前的写同样计入）。父侧唯一可观察的安全边界 = 报告送达。

**E-2 方案选型对比**

E-表 1——规则面落地形态

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | 定义落本节 + 需求档 F17；D5 行双档 + 提示词四镜像**登记待他链** | 定义即时可落（文档面可机判）；同步面不撞在途链（D5 本体）；用例可断言 | 提示词/机制档同步延后至他链收口（窗口期由本节 + 父侧即时纪律覆盖） | **选定** |
| 2 | 本批直改 `ENGINEERING-MODE.md` 双档 + 提示词四镜像 | 一步到位；但撞他链在途文件（第 9 批：提示词 + ENGINEERING-MODE 链），且提示词非本批写域 | — | 否决（在途改被审文档——D5 本体） |
| 3 | 只保留父侧即时纪律（不落档） | 零成本；但「下界」仍不落机制权威面——需求本体未闭（批次档 §1：即时纪律「非设计替代」） | — | 否决 |

E-表 2——机制面形态

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **写前拦截**（dispatch 预闸）× **点火回执冻结句** | 唯一预防级：在途写被拒 → 档不改 → 不 stale；判据与 `reviewIsStale` 同源（同 `docAbs` + 同一路径归一）→ 零误杀；与 eng-coder 设计闸 `denied + hint` 同形；逃生门 = cancel → 改 → 重发 | 新拒绝面：父侧在途写从「静默踩雷」变「可见拒绝 + 指引」；dispatch +~20 行 | **选定** |
| 2 | 写后提示（不拦） | 写已落地 = 本轮必 stale——只提前发现（digest 本就会展示结果）；新面照付、预防为零 | — | 否决 |
| 3 | 仅回执冻结句（不拦） | 规则钉在点火时点；但依赖父侧记忆 / 注意——「靠父侧临场兜」正是本批要治的病 | — | 否决 |
| 4 | 拦截 + 自动取消 / 自动重发 | 全自动；但发起权在父 / 用户（同 §14.2 表 1 候选 3 / 表 3 候选 3 口径——自动重跑类不引入） | — | 否决 |

E-表 3——批次档是否从快照面豁免

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **不豁免**（批次档保持在 `docAbs` 面内） | E 事故的保护对象恰是批次档（父侧最常写）；评审员确实读批次档 §2（实证：第 10 批评审方法行「通读四档…批次档 §2」；`ENGINEERING-MODE.md` §2.20 注「批次档本身在 documents 清单里」） | 父侧在途改批次档被拒——须等报告或先 cancel（正确行为） | **选定** |
| 2 | 档级豁免（`docAbs` / `docSetKey` 过滤 batchDoc） | 父侧可自由写批次档；但破坏评审对象完整性（评审员读 §1 语境 + §2 任务书，在途改 = 对象变更）；且恰使 E 场景失守 | — | 否决 |
| 3 | 节级豁免（§2 冻结、§1/§3–§6 可写） | 语义最细；但变更记账为**文件级**（`noteMutations` 记路径——`advisor-settle.mjs:36-43`），节级判定需引入解析 / 节快照新机制（成本高、无同类在案、易假阳） | — | 否决 |

**E-3 契约五（逐字）**

**（a）窗口定义（下界定义句——机制权威表述）**

```
在途窗口（D5 冻结窗口）= 点火 → 结算：起点 = 异步评审启动受理（launchSeq 快照）；
终点 = 结算记账（陈旧判定读取父侧变更日志的时点）。父侧可观察下界 = 报告送达（digest 注入 / 回合尾 collect）或取消·中止。
「子进程退出」不是窗口边界。窗口内父侧对被审文件集（设计评审 = 声明文档集 + 批次档）零写入；
违规后果保留既有语义（结算 stale → 不签发 token / 不计评审覆盖）。
```

**（b）参与者义务**

- **父侧**：① 点火后至报告送达 / 取消前，被审文件集（含批次档）零写入；② 有改动需求 → 先 cancel（`subagent` `action:'cancel'`）→ 改动落地 → 重发评审（不在途改）；③ 收到 stale 结果按既有提示重跑，不按已评审处置。
- **宿主**：点火回执携带冻结句（设计评审）；结算前拦截父侧对被审文件集的 `write` 面写入；stale 结果照既有通道可见。
- **评审员**：零新增义务——§3 写入通道不受影响（评审员侧写不落父侧变更日志；`batch_segment` 不在 `FILE_MUTATORS` 表内）。

**（c）拦截与回执文案（逐字——实现 grep / 用例断言锚）**

拒绝（dispatch `denied` → 工具结果；reason = `d5 freeze window`；`{path}` 为 cwd 相对）：

```
Error: write refused — design review #{id} is in flight over {path} (D5 freeze window). A write now would settle it stale — no token for a pass (the round is lost). Wait for the report, or cancel the review first (subagent action:'cancel' id:'{id}') and re-launch after the change.
```

点火回执（设计评审 ack note 追加；代码评审 ack 零改）：

```
；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)
```

**（d）实现要点（语义锚——防漂移）**

- 拦截判据与 `reviewIsStale` **同源**（同一 `docAbs` + 同一路径归一 `normAbs`）；**仅扫 running 且未取消的设计条目标**（已结算 / 已取消条目不拦——结算后写不再致 stale、取消的结算早退不判）。
- 工具面 = `FILE_MUTATORS`（与变更记账同集——不记入日志的写面既不判 stale 也不拦）；目标路径经 `tool.touchedPaths(args)` 提取（取不到路径不拦——同记账语义）。
- 落位 = `dispatch.mjs` Phase 1 预闸（工程门后、只读 / 权限阶段之前——与 :169-208 同形）；拒绝渲染 = 既有 denied 通道（`Error: {hint}`，:291-301）。
- 保守残余（如实注）：回合中止后池清前的窗口可能拒一笔不致 stale 的写（保守方向）。

**E-4 受影响文件（E 增量——交付同步：行数注记 = 批次前 → 交付态·实测；§14.7 表为 A–D 段，两表合读 = §14 实施域全表）**

| # | 文件 | 行数注记（批次前 → 交付态·实测） | E 增量 | 变更 | 档位 |
|---|---|---|---|---|---|
| E-1 | `src/agent/dispatch.mjs` | 455 → **481** | +26（实测——设计估 +~20） | Phase 1 预闸（`FILE_MUTATORS` × 冲突命中 → `denied + hint`） | 不拆（交付 481 < 500 帽） |
| E-2 | `src/agent-tools/advisor-settle.mjs` | 新（A–D 段）→ **214** | +~22（设计估——A–D 段 ~165 增量并入） | `inflightDesignReviewConflict(agent, absPaths)`（与 `reviewIsStale` 同族、同 `normAbs` / `docAbs` 语义） | 新档（交付 214 ≤300） |
| E-3 | `src/agent-tools/advisor-async.mjs` | 500 → **350**（拆后） | +1 行（re-export 名） | helper 经既有 re-export 面出——dispatch 的 import 路径不变 | 交付 350 ≤500 |
| E-4 | `src/agent-tools/advisor.mjs` | 227 → **241** | +~3（设计估——A–D + E 合计 +14） | 设计评审异步 ack note 追加冻结句（E-3c 逐字） | 不拆 |
| E-5 | `test/advisor-chain-guards.test.mjs` | 新（A–D 段）→ **498**（21 例） | +~60（设计估——A–D 段 ~230 增量并入） | T-CG15–T-CG18（E 用例） | 新档（交付 498 ≤500） |

E 增量 = 1 新行（E-1）+ 4 行内增量（E-2…E-5）；实施域与 §14.7 表合读 = 11 行。

**他链在途文件评估（本批零碰——登记）**：`docs/design/ENGINEERING-MODE.md`（§2.19 D5 行 :528）· `docs/requirements/ENGINEERING-MODE.md`（§1.15 D5 行 :624）——他链在途（第 9 批）。
提示词四镜像 `src/prompts/discipline-engineering.md`（D5 行 :109）· `docs/design/prompts/discipline-engineering.md`（:84）· VSC 对位 ×2——提示词非本批写域。下界定义句的同步 = 登记（E-6 #1），待他链窗口关闭后随批。

**E-5 关键决策记录（含否决备选）**

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| E-D1 | 机制面 = **写前拦截**（非提示） | 提示不预防（写落地 = 必 stale）；拦截与 `reviewIsStale` 同源 → 零误杀；与既有拒绝通道同形。否决：写后提示 / 仅回执句 / 自动重发（E-表 2） |
| E-D2 | 拦截**限设计评审** | E 的证据与损失路径均在设计评审（token / 轮次损失）；代码评审 stale 已有「不置 called + guard 重推」既定语义，且正常模式在途改码属常规流——拦截将改常规工作流语义（超 E 范围）。登记：E-6 #2 |
| E-D3 | 批次档**不豁免**（E-表 3） | 评审对象完整性 + E 场景保护对象 + 文件级机制约束 |
| E-D4 | 逃生门 = cancel → 改 → 重发（不自动） | 发起权在父 / 用户（同 §14.2 表 1 / 表 3 口径） |
| E-D5 | 定义句**现落本档**、四镜像同步登记 | 他链在途（零碰）；本档 = 评审链机制权威档——定义先落，同步随批 |
| E-D6 | 写面边界：**拦 = 父侧自身 `FILE_MUTATORS` 写面 × `docAbs`；判 stale 集 ⊇ 拦集** | 拦集 = 预闸可见的父侧自身写面；判集另含预闸不可达的**子代理合入**写入（`mergeChildMutations` → `noteMutations`，`subagent-async.mjs:446-459`——子代理无 `_asyncAdvisors` 池面）——「致 stale 却没拦」只可出自不可达面，非本可拦面之分叉；bash / file_ops 盲区不记账不判 stale（E-6 #3）；子代理合入面登记 E-6 #5 |

**E-6 后续登记项（本批不碰——明示，不静默）**

1. **D5 定义句同步面**：`ENGINEERING-MODE.md` 双档 D5 行 + 提示词四镜像——下界定义句入行（他链收口后随批）。
2. **代码评审在途写面**：未拦截（E-D2）——若后续观察显示代码评审轮次损失同样显著，再评估（含正常模式影响面）。
3. **bash / file_ops 写入面**：陈旧扫描自身盲区（不被记账 → 不判 stale；E 拦截同界不扩大）——登记后续评估。
4. **A–D 段计数**（轮次 1 修正轮已结）：原「7 改 + 3 新」与逐行标签口径差 1——已按裁定同改（逐行标签为准 = **6 改 + 4 新**；§14.7 表头 / §14.9 D3 行 / 批次档 §2）。
5. **子代理合入写入面**（预闸不可达）：`mergeChildMutations` → `noteMutations`（`subagent-async.mjs:446-459`）在途写入父侧 `_mutLog`——在途设计评审期间子代理合并仍可致 stale，dispatch 预闸拦不到（子代理无 `_asyncAdvisors` 池面）。与 #3 同族（扫面盲区），后续评估随批。

**E-7 测试层：用例表（正常 / 边界 / 错误）**

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-CG15 | 正常 | `inflightDesignReviewConflict(agent, [X])`——running 设计条目 `docAbs=[X]` | `[X]` → 冲突 `{id,…}`；非 scope 路径 → null | F17 |
| T-CG16 | 边界 | 负向族：已结算（done）/ 已取消 / 代码评审 / `docAbs` 空 / 池空 | 全部 → null（「报告送达后可写」= 下界语义锁定；代码面不在射程） | F17 |
| T-CG17 | 错误 | dispatch 集成：在途设计评审 × `write` 指向其 `docAbs` 档 | 结果逐字含 `write refused — design review` + `action:'cancel'` 指引 + 评审 id；**文件零改动**（读回断言）；同场非 scope 写放行（对照） | F17 / N11 |
| T-CG18 | 正常 | 设计异步启动 ack（`advisor` 工具返回 JSON） | note 含冻结句（`D5 冻结窗口` 逐字）；代码评审 ack 不含（不对称锁定） | F17 / N11 |

**E-8 验收标准（逐条回指需求——每条可机器验证）**

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-CG13 | 冻结拦截：T-CG15 / T-CG16 / T-CG17 绿；拒绝文案锚（`write refused — design review`）实现 grep 命中；被拒写入零落地（读回断言）；逃生门指引含 `action:'cancel'` | F17 / N11 |
| AC-CG14 | 定义与回执落档：T-CG18 绿；§14.14 定义句与实现锚点（`launchSeq` / `docAbs` / `reviewIsStale` / 结算调用点）grep 对齐；`node scripts/check-doc-width.mjs` 新增违规 0 + 新增超宽 0；登记项在节（E-6 可 grep） | F17 / N11 |

**E-9 边界（E 不做）**

- 不改 `reviewIsStale` / 变更记账 / 结算语义本体；不引入节级快照、自动取消 / 自动重发
- 不拦截代码评审在途写；不覆盖 bash / file_ops 写入面（登记 E-6 #2 / #3）
- 不碰他链在途文件（`ENGINEERING-MODE.md` 双档 / 提示词四镜像——登记 E-6 #1）；§14.0–§14.13 与 A–D 文案零改
- 零 UI 面（拒绝文案落工具结果、冻结句落工具返回 JSON——无 TUI / VSC 显示改动）

**E-计数（D3 同步）**：用例 T-CG15–T-CG18（4 例）· AC-CG13 / AC-CG14（2 条）；§14 全节 = 用例合计 **21**（T-CG1–T-CG14 + T-CG15–T-CG18 + **修正轮 T-CG19–T-CG21**）· AC 合计 14（AC-CG1–AC-CG14）· 实施域 11 行（§14.7 表 10 行 + E-1 新行）；需求档 §7 = F11–F17 / N7–N11。

**修正轮注记（设计评审轮次 1 后——6 条发现全部采纳落档；2026-09-11）**

> 本注记 = 本节内偏差记录（docs FIRST——同一 designId 链内；实现面未动，待轮次 2 评审取 token）。
> 与上文冲突处，以本注记所列改动为准；§7 / §13（第 9 批在途）与他档零碰；未新建档。

| # | 级别 | 修正点（本档落点——本轮全部采纳） |
|---|---|---|
| 1 | 🔴 | §14.3：kind 表补 `review_failed`（前缀 `Advisor: review failed`——旧锚六形态零丢）；消费点 2 同步；§14.8 D-CG2；§14.11 T-CG1 扩为六覆盖 + +T-CG19；§14.12 AC-CG1 |
| 2 | 🟡 | §14.6 #1：墙判定绑信号状态（`compositeAborted && !signal?.aborted`；接受 `AbortError` / `TimeoutError` 两名；partial 不抛错返回形态同判）；§14.11 +T-CG20；§14.12 AC-CG7 |
| 3 | 🟡 | §14.14：E-D6 限定（拦 = 父侧自身 `FILE_MUTATORS` 写面；**判 stale 集 ⊇ 拦集**）+ E-6 补 #5（子代理合入写入面——预闸不可达） |
| 4 | 🔵 | 计数裁定（逐行标签为准 = **6 改 + 4 新**）：§14.7 表头 / §14.9 D3 行 / 批次档 §2 同改；§14.9 补「A–D 段」限定 |
| 5 | 🔵 | §14.11 T-CG13：时钟注入（`now` 测试缝）——去 wall-clock 依赖（零真实等待） |
| 6 | 🔵 | §14.3 匹配规则：块首行扫描 + 负向精度口径（引文同串不误判——残余 fail-closed 如实登记）；§14.11 +T-CG21 |

**计数（D3）**：kind = **6** · 用例合计 **21**（A–D 17 / E 4）· AC 合计 **14** · 实施域 **11 行**（6 改 + 4 新 + E-1）。

**交付同步注记（2026-09-11——设计档 ↔ 交付实测态对齐；本注记与上文冲突时以本注记为准）**

> 实现已交付并父侧验收通过；本注记 = 文档面同步（批次档 §2「交付同步」块——同源）：
> ① §14.7 两行「变更」列——守卫族（六 kind 谓词 / `shouldBudgetNudge` / `budgetNudgeText` / `timeoutTail` / `renderTimeline` / 上限常量）交付落 `compaction.mjs`（非 loop.mjs——逐字迁移后 loop 承载全部守卫将超 300）；
> ② 全表行数注记改交付态·实测（§14.7 表 + E-4 表——口径 = 批次前 → 交付态，`N lines total`）；
> ③ 载体指针按交付态（`MAX_ADVISOR_TURNS` = `compaction.mjs:12`；§ 实现载体 header / §2.3 / §14.3 生成点 / §14.11 T-CG19 / §14.14 E-1 机制复核 / E-表3）；
> ④ §14.10 补 #6（F16 同步面残留登记）· #4 行数按实测。
> 未涉项照旧：§7 / §13 零碰（第 9 批链）；变更记录行待父侧收口并入（§14.9 D7）。

## 15. F16 同步面扩展——record-results sync 记账消费同谓词（第 13 批——机制债收束）

> 需求 = `../requirements/ADVISOR-CONVERGENCE.md` §7 F16（**文字零改**——该行面宽于第 11 批实现范围：「完成守卫的失败判定与 design 面共用同一谓词」覆盖同步记账面）；用户裁定 = 批次档 `../batches/2026-09-11-MECH-DEBT-SWEEP.md` §1 条目 A（2026-09-11「1可以」= **扩展实现**）。
> 承接面 = §14.10 #6（F16 同步面残留登记——本批闭合）；实现面 = `src/agent/record-results.mjs` sync 记账分支。

### 15.1 问题陈述（批次前缺陷态——as-of file:line）

- sync 记账（`src/agent/record-results.mjs:114`）无「未完成尾」判定：以宿主截断尾收尾的 sync 代码评审
  （`depth>0` 自审 / 显式 `async:false` / 无 depth 直调——同步路径 `src/agent-tools/advisor.mjs:198`）
  仍置 `_calledAdvisorThisRun`（计「已覆盖」→ guard 不重推）。
- 同族不一致：异步结算面（`settleAdvisorRun`，§14.3 消费点 2）第 11 批已消费单谓词；sync 面遗漏。
- guard 链（相容面）：`src/agent/completion.mjs:130`——`!pending ∧ _mutatedThisRun ∧ !_calledAdvisorThisRun ∧ hasCodeMutations ∧ pushbacks<MAX ∧ rounds<MAX` ⇒ 推回；
  **opt-in**（`advisor.guard === true`、默认关）且**工程模式关闭**（`ENGINEERING-MODE.md` §2.3）。

### 15.2 契约：判定点与置位语义（逐字）

**判定点** = `record-results.mjs` advisor 记账分支的 sync else 分支（refused / asyncAck 两分支先行排除——零改）；
**谓词** = `advisorIncompleteMarker`（单源——`src/advisor/compaction.mjs`；经 `src/advisor/run.mjs` re-export 消费，
与 §14.3 三个消费点同串）。

**置位规则**（与 `settleAdvisorRun.failureVerdict` 逐条 parity）：

| 场景 | `_calledAdvisorThisRun` | 依据 |
|---|---|---|
| 干净结果（无截断尾） | **置 true** | 零回归（既有语义） |
| 未完成尾 ∧ 代码评审（`run.reviewType !== "design"`） | **不置** | F16 本体——guard 可重推（防静默跳过） |
| 未完成尾 ∧ 设计评审（`run.reviewType === "design"`） | **置 true** | parity：设计评审无代码面（§14.3 消费点 2 注释口径） |
| 未完成尾 ∧ 类型不可判（无 marker / run 缺失的 legacy 直调） | **不置** | fail-closed：截断尾不得计「已覆盖」（残余保守方向——与 §14.3 负向精度登记同取向） |
| 拒绝报告（`_advisorRefusals`）/ 异步 ack（`_advisorAsyncAcks`） | 两分支先行排除（零改） | §14.4 / §29 既有语义 |

**对照实现（选定形态）**：

```js
const reviewId = agent._advisorSyncCalls?.get(toolCall.id)
const run = reviewId !== undefined ? advisorRuns(agent).get(reviewId) : undefined
// F16 同步面（第 13 批 §15.2）：未完成尾 + 非设计面（含类型不可判）⇒ 不置「已覆盖」。
const incomplete = advisorIncompleteMarker(String(result))
if (!(incomplete && run?.reviewType !== "design")) agent._calledAdvisorThisRun = true
```

**零改边界（逐字保全）**：round 进位（含 legacy 分支 `_advisorRound++`）/ prior 规则（`looksLikeReviewOutput` → strip）
/ `_advisorSyncCalls` 删除 / refused / asyncAck 语义——全数不动（attempts 计数照旧：未完成尝试耗预算，
反复截断受 cap 5 与 pushbacks 上限约束——与异步面注释同口径）。

### 15.3 受影响文件（eng-coder 写域——2 项）

| # | 文件 | 当前行数 | 动作 | 预计 |
|---|---|---|---|---|
| 1 | `src/agent/record-results.mjs` | 167 | 改（sync 记账消费同谓词 + import + 头注补注） | +~8 |
| 2 | `test/advisor-sync-accounting.test.mjs` | 新 | **新增**（T-SG1–T-SG6） | ~100（≤500） |

测试基建：CLI glob 自动发现（零注册）；零网络 / 零真实 LLM / 零长等待（直接调用 `recordToolResults` + stub agent——
`test/advisor-chain-guards.test.mjs` 同族在案；该档现 498 行近帽——**不复用、新建档**）。

### 15.4 用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-SG1 | 正常 | sync code run + 干净评审结果 | `_calledAdvisorThisRun === true`；`run.round` 进位；prior 规则照旧 | F16（负向） |
| T-SG2 | 错误 | sync code run + 时间线 + `Advisor: review timeout after …` 尾（尾不在首行） | `_calledAdvisorThisRun === false`；round 照常进位（attempts 计数） | F16 本体 |
| T-SG3 | 边界 | sync **design** run + 同款截断尾 | `_calledAdvisorThisRun === true`（parity——设计无代码面） | F16 边界 |
| T-SG4 | 错误 | 无 marker legacy 直调 + 截断尾 / 干净结果两例 | 截断尾 → 不置；干净 → 置（+round 进位） | F16 fail-closed |
| T-SG5 | 边界 | 六 kind 逐一遍历（复用 §14.3 前缀表）——sync code run | 六 kind 均不置标记 | F16 全覆盖 |
| T-SG6 | 边界 | refused（`_advisorRefusals` 命中）/ asyncAck 两分支 | 两分支语义零改（不置标记——先行排除） | 零回归 |

### 15.5 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-SG1 | 判定点与置位语义：T-SG1–T-SG5 绿；`record-results.mjs` 含 `advisorIncompleteMarker` 消费（grep）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F16 |
| AC-SG2 | 零回归：T-SG6 绿 + 既有 `advisor-chain-guards.test.mjs`（21 例）全绿 | F16 |
| AC-SG3 | 文档-实现一致：§15.2 置位表在实现逐条可指认；`node scripts/check-doc-width.mjs` 新增违规 0 + 新增超宽 0 | N10 类比 |
| AC-SG4 | 边界：不改 `settleAdvisorRun` / `advisor.mjs` / 提示词 / VSC 仓；档位实测 ≤500 | §15.6 |

### 15.6 边界（本批不做）

- 不改 `settleAdvisorRun` / `advisor.mjs` 结算与透传（零改）；不改 guard 开关语义（opt-in / 工程模式关闭——§2.3）
- 不改提示词语义；不做 VSC 端对位——VSC 同构面（sync 记账）已由 `../requirements/ADVISOR-CONVERGENCE.md` §8 F23 注「VSC 随之」，
  本批 CLI 单端交付（镜像登记——**后续批建议**，沿 §14.10 #1 同口径；批 12 已排除该面——`2026-09-11-VSC-GUARD-MIRROR（VSC 仓）` §四「明确出批」含「sync 完成记账面改动」；不静默）
- 不做自动重推策略变更（推回 = 既有 guard 机制；本批只修「已覆盖」判定）

## 16. 评审上下文预算跟随模型窗口（120K 硬编码退场——2026-09-11 第 25 批）

> 需求 = `../requirements/ADVISOR-CONVERGENCE.md` §10（F27 / N19）；批次档 = `../batches/2026-09-11-ADVISOR-CONTEXT-BUDGET.md` §1（条目 E1）。
> **冻结窗口（D5）**：本节为**新增节**——§1–§15 零碰（含 §14 判定族 / §15 sync 记账面）；本档变更记录追加一行（§16.7 注记）。
> 上下游不变式：判定族六 kind 与六条尾文案（§14.3）**逐字零改**；凭证机制 / 评审语义判据 / 超时预算（`agent.advisor.timeoutMs`）零改。

### 16.1 问题陈述（现场复核——file:line 为 as-of 2026-09-11）

- **缺陷**：评审循环的上下文上限是固定常量 `MAX_CONTEXT_TOKENS = 120_000`（`src/advisor/compaction.mjs:19`，
  注释 `Reserve headroom to avoid OOM`）。守卫链（`src/advisor/loop.mjs:117-126`）：估算 → `currentTokens > MAX_CONTEXT_TOKENS * 0.8`
  → 本地压缩 → 压缩后仍 `> MAX_CONTEXT_TOKENS` ⇒ 以 `Advisor: context window limit reached (N tokens).` 收尾
  （判定族 kind `context_limit`，前缀表 `compaction.mjs:76`）。
- **实证**：第 15 批轮次 2 评审实例死于 `(120225 tokens)`——与常量逐字吻合；1M 窗口模型被硬帽限死在 ~12% 窗口处。
- **来源**：该常量自 2026-08-02 引入（`git log -S "MAX_CONTEXT_TOKENS"` → `79fc3df`，注释原文「预留 headroom，避免 OOM」）——
  当时模型档位为 128K 时代（`120_000 / 128_000 ≈ 94%`）；对现行主力 1M 档位（`deepseek-flash { context: 1_000_000 }`，
  `src/model-specs.mjs:33`）是**遗留限制**，与用户 2026-09-11 13:18 判定一致。
- **窗口真值源（既有）**：`providerSpec(provider)`（`src/model-specs.mjs:174-179`）——模型表前缀命中 + provider 级
  `context`（K 单位）覆盖；未知模型回退 `DEFAULT_SPEC`（128K，`:97`）。**同族同口径**（本仓「阈值跟随窗口」惯例）：
  主循环压缩阈值 `resolveCompactThreshold`（`src/config.mjs:120-135`，`0.6 × 窗口`）、主循环尾预算（`src/context.mjs:44-58`）、
  评审项目指南预算（`src/advisor/messages.mjs:18-19,93-96`，`5% × 窗口`——advisor 模块内同口径）、传输层窗口判定
  （`src/provider/core.mjs:126-128`）。
- **接线可达性**：评审循环所持 `provider` 即评审真实 provider（`src/advisor/run.mjs:151` `resolveAdvisorProvider(agent)`
  → `:181` 传入循环），且循环已在该 provider 上消费 `providerSpec`（`loop.mjs:204`，`reasoningEcho` 判定）——派生值就地可得。
- **消费面（grep 实测）**：`MAX_CONTEXT_TOKENS` 在全仓（CLI + VSC + 测试 + 脚本）定义 1 处（`compaction.mjs:19`）+
  导入与使用 2 处（`loop.mjs:18/118/121`）——`run.mjs:16` 的 re-export 面**不含**该常量，替换零外溢。

### 16.2 方案选型对比

**表 1——判死线派生式**（判据来自需求层：跟随窗口 / 头寸充分 / 单参简洁 / 与既有形态同族）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **比例式**：`limit = floor(窗口 × 0.8)` | 跟随窗口（1M → 800K，= 现状 6.7×——缺陷闭合）；头寸按比例（128K 留 25.6K / 1M 留 200K）；单参数零分支；与既有触发系数（×0.8）同源；与 `COMPACT_RATIO`（0.6）同族 | 128K 档线位自 120K 降至 102.4K（−15%——换估计误差头寸，论证见 §16.4）；大窗单请求延迟/额度随上下文上升（模型选择的已知后果） | **选定** |
| 2 | 绝对预留式：`limit = 窗口 − 100_000` | 大窗几乎不设限（1M → 900K）；但 128K 档 → 28K（远低于现状——128K 模型评审几近不可用）；预留绝对值与「误差随内容量增长」脱节 | — | 否决 |
| 3 | 混合式：`limit = min(窗口 − 32_000, 窗口 × 0.95)` | 小窗更贴现状（96K）；但两常数三段行为，且 1M 档仅留 5%（对 `chars/4` 估算误差无头寸） | — | 否决（复杂度无对应收益） |

**表 2——接线面**（派生值从哪取）

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **`providerSpec(provider)`（loop.mjs 函数体内、while 轮次外一次性派生——与「循环入口注入」对举）** | 与四条既有派生同族（同一真值源）；自动跟随 provider 级 `context` 覆盖（同一模型不同端点的窗口差异）；循环已持 provider 且已有同源消费点（`loop.mjs:204`）；零新参数、零新配置面 | 派生结果无回显面（不可从运行输出反查）——以纯函数单测 + provider 覆盖双向用例锁（T-CB1 / T-CB4） | **选定** |
| 2 | agent 配置项（新增 `agent.advisor.maxContextTokens`） | 可显式覆盖；但与 `providers[].context`（窗口真值源）**双源**——配置高于真实窗口时产出「合规但必被服务端拒」的请求（footgun）；E1 不含新配置需求 | — | 否决（覆盖能力已由 `providers[].context` 提供） |
| 3 | 循环入口注入（`runAdvisorReview` 算好传入） | 显式可测；但派生逻辑两处（生产 + 测试）需同步，且要动 11 参签名；循环所持 provider 即评审真实 provider ⇒ 注入 = 重复派生 | — | 否决 |

### 16.3 契约一：预算派生（两档 + 回退——逐字函数语义）

`compaction.mjs` 常量族内：`MAX_CONTEXT_TOKENS` **退场**，新增常量与纯函数（`providerSpec` 自 `../config.mjs` 导入——
与 `loop.mjs:11` 同源）：

```js
// 上下文预算（第 25 批——120K 硬编码退场）：预算跟随评审模型窗口（providerSpec：
// 模型规格表 × provider 级 context 覆盖）。头寸用途 = chars/4 估算误差 + 响应/协议开销
// （内存不构成约束——设计 §16.4）；判死线仍是宿主机自限线，服务端窗口约束不变。
export const CONTEXT_LIMIT_RATIO = 0.8  // 判死线 = 窗口 × 0.8
const COMPACT_TRIGGER_RATIO = 0.8       // 压缩触发 = 判死线 × 0.8（既有关系零改）

/** 评审上下文预算（纯函数——两档阈值可机测；provider 为 null 时退化默认规格）。 */
export function advisorContextBudget(provider) {
  const limit = Math.floor(providerSpec(provider).context * CONTEXT_LIMIT_RATIO)
  return { limit, compactAt: Math.floor(limit * COMPACT_TRIGGER_RATIO) }
}
```

| 输入（provider） | 窗口 | 判死线 `limit` | 压缩触发 `compactAt` |
|---|---|---|---|
| `{ model: "deepseek-flash" }`（1M） | 1_000_000 | **800_000** | **640_000** |
| `{ model: "glm-4" }`（128K） | 128_000 | **102_400** | **81_920** |
| 未知模型名（回退 `DEFAULT_SPEC` 128K） | 128_000 | **102_400** | **81_920** |
| `{ model: "deepseek-flash", context: 64 }`（K 覆盖） | 65_536 | **52_428** | **41_942** |
| `null` / 缺 model（总函数） | 128_000 | **102_400** | **81_920** |

- **回退链**：未知模型 → `specForModel` 的一次性告警 + `DEFAULT_SPEC`（既有语义零改）；`provider` 为 `null` 时
  `providerSpec` 退化默认（`model-specs.mjs:175` 总函数）——派生不抛错。
- **量纲**：窗口为 tokens；`providers[].context` 的 K 单位 ×1024 转换只发生在 `providerSpec` 内（零重复转换）。
- **两档语义**：`compactAt` = 触发本地裁剪（`compactMessages`，规则零改）；`limit` = 压缩后仍超即判死（`context_limit`）。
  两者关系（×0.8）与现状**逐字同源**——本批只换「上限从哪来」，不换「如何比较」；守卫分支结构（if / 二次估算 / 尾形态）零改。

**循环侧消费（`loop.mjs`——2 处）**：循环体外一次性 `const budget = advisorContextBudget(provider)`（provider 全场不变）；
`:118` → `currentTokens > budget.compactAt`；`:121` → `estimateTokens(messages) > budget.limit`。其余逐字不动。

### 16.4 OOM 论证（正面回应原注释 `Reserve headroom to avoid OOM`）

1. **内存量级不构成约束**：预算 1M tokens ↔ `estimateTokens` 口径 ~4M 字符 ↔ JS 字符串 ~8MB（UTF-16 双字节）；
   单次请求 JSON 序列化为同量级瞬时副本 ⇒ 峰值 ≲ 20-30MB，与 Node 默认堆量级相差两个数量级。
2. **真正的内存边界已由他处承担**：单结果截断 `MAX_RESULT_CHARS = 64K` 字符（`compaction.mjs:22`，`loop.mjs:282` 消费）；
   压缩后消息集 = system + 压缩注记 + 定锚简报 + 最近 20 条（`compactMessages`）——**与窗口无关的有界集**。
3. **大窗的真实代价是延迟与 token 额度**（单请求 prefill / 计费），不是 OOM：由 `agent.advisor.timeoutMs` 硬墙（§14.6）
   与用户的模型选择承担——故 20% 头寸**不**为内存而留；旧注释的动机在本仓代码中找不到支撑（`git log -S` 溯源仅得
   2026-08-02 的原始中文注释，无对应事故记录），按实测结论改写。
4. **头寸的真实用途**（新注释所载，三项）：① `estimateTokens` 是 `chars/4` 扁平估算——CJK 内容低估约 3-4×
   （主循环 `estimateText` 为 ASCII/4 + 非 ASCII/1，`src/provider/rate.mjs:29-35`）；② 响应 / 推理与协议
   （system/tools）在服务端计入窗口；③ 20% 是「宿主机自限线 < 服务端真窗」的安全间距。
5. **服务端仍是最终兜底**：超窗由服务端拒绝 → `context_too_long` 分类可见（`run.mjs:222`），评审结算 fail-closed
   （§14.3 消费点）——本批不改变该兜底。
6. **残余如实注**：20% 头寸**不能**完全覆盖 4× 级 CJK 低估——极端中文重评审仍可能撞服务端窗（可见失败，不静默）；
   根治 = 估算器修正（§16.8 #2 登记，另批）。

### 16.5 受影响文件全清单（as-of 2026-09-11 实测 · 行数口径 = `N lines total`）

**实施域（eng-coder 写域——3 项：2 改 + 1 新）**

| # | 文件 | 当前行数 | 动作 | 预计增量 | 档位结论 |
|---|---|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | 158 | 改（常量退场 + 预算纯函数 + `providerSpec` 导入） | +~15 | 交付 ~173 ≤300 ✓ |
| 2 | `src/advisor/loop.mjs` | 291 | 改（导入换名 + 预算一次性派生 + 两处消费） | +1~3 | 交付 ~294 ≤300（**贴线注记**——若实施越 300：按 §14.7 同口径把守卫族整体迁出本档并登记拆分计划，不硬压行） |
| 3 | `test/advisor-context-budget.test.mjs` | 新 | **新增**（T-CB1–T-CB5 在役；T-CB6 已退场——整删，删除记录 = `TESTING.md` §11.3） | ~130 | 新档 ≤500 ✓ |

**文档域（eng-designer 写域——本设计者已落）**

| 文件 | 行数注记（批次前 → 落档后） | 变更 |
|---|---|---|
| `docs/requirements/ADVISOR-CONVERGENCE.md` | 239 → **279**（§10 落档；§11 属第 23 批） | §10（F27 / N19 / 边界与登记面）——**已落** |
| `docs/design/ADVISOR-CONVERGENCE.md` | 1045 → **1242**（含本修正轮） | 本节 §16 + 变更记录（含本修正轮 3 条 🔵）——**已落** |

测试基建：CLI 无注册清单档——`test/*.test.mjs` glob 自动发现（`test/run-fast.mjs:17`）；新用例零网络、零真实 LLM
（循环 `seams.chat` 覆写）、零长等待（字符串夹具——微秒级，`slow-gate` 零命中）。

### 16.6 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CB1 | 判死线 = **比例式**（窗口 × 0.8） | 表 1——跟随窗口 + 单参数 + 与既有系数/形态同族。否决：绝对预留（小窗崩）· 混合式（两常数无对应收益） |
| D-CB2 | 接线面 = **`providerSpec`（loop.mjs 函数体内、while 轮次外一次性派生）** | 表 2——真值源单一（provider 级覆盖随之生效）+ 循环已持 provider + 四条同类在案。否决：新配置项（双源 footgun）· 入口注入（重复派生 + 签名扰动） |
| D-CB3 | **不新增 advisor 专用配置项** | 覆盖能力已由 `providers[].context` 提供（同一模型不同端点窗口不同的既定机制）；advisor 专属旋钮 = 第二真值源 |
| D-CB4 | 两档**分开命名**（`limit` / `compactAt`），关系保持 ×0.8 | 需求要求两档分别可调可测（一次返回两值）；触发与判死的既有依赖关系不动（改动限于命名层） |
| D-CB5 | **原地替换常量**（`MAX_CONTEXT_TOKENS` 退场，不留别名） | 全仓消费面仅 `loop.mjs`（grep 实测）；留别名 = 双源漂移（D2）。否决：保留常量 + 并列新函数（旧帽仍在，随时被误用） |
| D-CB6 | 128K 档线位下调（120K → 102.4K）**采纳** | 现状 93.75% 的窗占比对 `chars/4` 估算误差与响应空间**无头寸**（CJK 低估实证）——比例式下小窗一并获得正确头寸；1M 档不降反升 6.7×（缺陷本体） |
| D-CB7 | 六条尾文案 / 判定族 / 压缩规则**零改** | §14.3 判定族与既有用例已锁；缺陷本体是「上限来源」，不是守卫结构。否决：顺带把预算值写进截断尾（文案漂移面 + 无必要） |
| D-CB8 | **CLI 单端本批**；VSC 镜像随批（登记 §16.8 #1） | 各端独立实现纪律（语义同源、各自原文自持、零跨仓依赖）；VSC 档不在本批写域（差异如实上报——VSC 侧同款缺陷**实测确认存在**，非推测） |
| D-CB9 | 估算器（`estimateTokens`）**本批不改** | 改估算式会平移全部模型的压缩时点（面大于 E1）；本批头寸已把误差计入（§16.4 #4），修正另批登记 |

### 16.7 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D2 单一权威源** | 窗口真值语义**只引用不重述**（`PROVIDER.md` §15 = `providers[].context`；模型规格表 = `src/model-specs.mjs`）；本节只写「预算 = 窗口 × 系数」这一新契约 |
| **D3 计数·枚举** | 用例 6（编号 T-CB1–T-CB6；在役 5——T-CB6 已退场，删除记录 = `TESTING.md` §11.3）· AC 5（AC-CB1–AC-CB5）· 实施域 3 项（2 改 + 1 新）· 文档域 2 档——计数与列表同改（本行与各表一致） |
| **D5 冻结窗口** | 本档只**新增节**（§16）+ 变更记录 1 行——§1–§15 零碰；改动集齐后统一入场 |
| **D6 回读核对** | 需求 §10 与本节落笔后回读核实（写入静默失败防护）；实施面验收含回读断言（T-CB6 静态锚——已退场：整删，删除记录 = `TESTING.md` §11.3） |
| **D7 变更留痕** | 本档变更记录追加一行（本批）；需求档按既有形态（无变更记录节）由 §10 自带日期与批次注记 |
| **判定族 / §14.3 契约** | 六 kind 前缀与六条尾文案**逐字零改**（T-CG1 既有用例继续锁）；`context_limit` 生成点行号（§14.3 表引 `loop.mjs:124`）如因本批落笔位移，按 D4「行号 = as-of 参考」由父侧收口并入 |
| **§14.6 超时语义** | `agent.advisor.timeoutMs`（整场墙钟，默认 600s）零改；预算（token）与墙钟（时间）两维正交 |
| **主循环阈值（`COMPACT_RATIO = 0.6`）** | 两个不同对象的阈值：主循环 = 会话历史压缩触发（含每轮注入上下文 ⇒ 留 40% 头寸）；评审 = 本地裁剪 + 判死。**不合并、不同步**（同 `MAX_ADVISOR_TURNS` 与提示词 ~30 轮的既有口径：职责不同不同步） |
| **`AGENT-PARAMS.md` 超时档** | 零改（语义无变，无需改） |
| **多实现面纪律（双端）** | 不做 byte-identical 硬一致、不建跨仓依赖；VSC 同款缺陷**如实上报**（§16.8 #1——file:line 实证） |
| **凭证不落档** | 本节全文零 token / designId 值 |
| **文档人类可读** | 无 >300 字符非表格单行；`node scripts/check-doc-width.mjs` 新增违规 0（AC-CB5） |

### 16.8 后续登记项（本批不做——明示，不静默）

1. **VSC 端镜像（后续批建议——父侧排程）**：**同款缺陷确认存在**（非推测）——`thincoder-vscode` 仓
   `src/advisor/compaction.mjs:18`（同款常量 `MAX_CONTEXT_TOKENS = 120_000`）、`src/advisor/loop.mjs:22/116/121`
   （导入 + 两处守卫）；VSC 侧 `providerSpec` 现成（`src/config.mjs:142-149（VSC 仓）`，经 `src/specs.mjs（VSC 仓）` re-export）——
   完整修复路径同本端（+~15 行 / +1~3 行）。测试面：新增 VSC 用例档 + **登记 `thincoder-vscode/test/files.mjs`**
   （VSC 为显式清单，与 CLI glob 不同）。文档面：`ADVISOR-CONVERGENCE（VSC 仓）` 新增 §15 + 变更记录 1 行——
   VSC 档不在本批写域（本设计者未写）。
2. **`estimateTokens` 估算器修正（CJK 低估）**：`chars/4` 扁平式 vs 主循环 `estimateText`（ASCII/4 + 非 ASCII/1，
   `src/provider/rate.mjs:29-35`）——修正会平移全部模型的压缩时点，另批评估（本批头寸已计入误差）。**（收口 2026-09-11：群 B 批承接——本档 §18。）**
3. **§14.3 生成点行号指针**：`context_limit` 生成点（kind 字面 = `src/advisor/run.mjs:43`；表引渲染行 = `src/advisor/loop.mjs:127`——原 :124 落笔位移 +3，已随收口并入；节内容零改——D4 as-of 口径）。
4. **父侧核销面**：`docs/TODO.md` 需求池行（本批来源 = 用户 bug 报告）——父侧写域，本设计者不动。
5. **tpm / rpm 交互**：`rateGate`（`src/provider/rate.mjs:52-57`）对单请求估算超 tpm 只告警放行——大窗评审的额度
   后果由用户模型选择承担（登记；不新增闸）。

### 16.9 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-CB1 | 正常 | 纯函数 `advisorContextBudget(x)`：1M 模型 / 128K 模型 / 未知模型名 / provider 级 `context:64` / `null` | `{limit:800_000, compactAt:640_000}`；`{102_400, 81_920}`；未知 → 回退同值；`{52_428, 41_942}`；`null` → 默认回退不抛（五组逐一断言） | F27 |
| T-CB2 | 错误（回归锁） | `_runAdvisorToolLoop` + 1M 模型 provider + ~197K tokens 上下文（12 × 64K 字符工具结果——64K = `MAX_RESULT_CHARS`（64 × 1024）；`chars/4` 口径；消息数 ≤20）+ `seams.chat` 返回终稿 | 输出**不含** `Advisor: context window limit`；含终稿文本；`advisorIncompleteMarker(out) === null`（改前该形态必判死——120K 帽） | F27 |
| T-CB3 | 对照 | 同上下文 + 128K 模型 provider；同上下文 + 未知模型名 provider | 两者均以截断尾收尾（族前缀 `Advisor: context window limit reached (` 逐字）；`advisorIncompleteMarker → "context_limit"`（机械线不失效 + 未知模型回退判据） | F27 |
| T-CB4 | 边界 | 同上下文 + `{model:"deepseek-flash", context:64}`（收紧）；同上下文 + `{model:"glm-4", context:1024}`（放宽） | 前者判死、后者不判死（**同量上下文两结果**——provider 级覆盖双向生效，证 `providerSpec` 接线面而非 `specForModel` 单源） | F27 |
| T-CB5 | 边界 | 1M 模型 provider + ~737K tokens（45 × 64K 字符工具结果——同 64K 口径；消息数 > 20，触发压缩真裁剪） | 输出含 `[Context compacted:`（派生触发线在位）且不含截断尾；压缩后估算 < 判死线；评审正常收尾 | F27 |
| T-CB6 | 正常（静态锚） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F27 / N19 |

### 16.10 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-CB1 | 派生与两档：T-CB1 绿（五组输入 × `{limit, compactAt}` 数对逐断言）；`advisorContextBudget` 为纯函数（`compaction.mjs` 内无 I/O、无状态写入） | F27 |
| AC-CB2 | 核心缺陷闭合：T-CB2 绿（1M 模型 ~197K tokens **不以** `context_limit` 收尾）+ T-CB3 绿（128K / 未知模型同量上下文仍以截断尾收尾——机械线与回退判据双锁） | F27 |
| AC-CB3 | 接线面 = `providerSpec`：T-CB4 绿（provider 级 `context` 覆盖**双向**翻转判定结果） | F27 |
| AC-CB4 | 零回归：T-CB5 绿（派生触发线在位）；既有 `advisor-chain-guards.test.mjs`（21 例）+ `advisor-sync-accounting.test.mjs`（6 例）全绿；`node test/run-fast.mjs` 全绿；`src/prompts/**` 与 VSC 仓零改动（`git status` 判据） | N19 |
| AC-CB5 | 文档-实现一致 + 旧帽退场：旧帽面随 T-CB6 整删退场（删除记录 = `TESTING.md` §11.3）；`node scripts/check-doc-width.mjs` 新增违规 0 | N19 |

### 16.11 边界（本批不做）

- 不改判定族六 kind 与六条尾文案、不改压缩算法本体（最近 20 条 + 定锚重挂）、不改结算 / 凭证 / 超时语义
- 不改 `estimateTokens` 估算式（登记 §16.8 #2）；不新增 advisor 专用配置项（D-CB3）
- 不做 VSC 端实现（登记 §16.8 #1——各端独立实现纪律）；不碰 `AGENT-PARAMS.md` / `CONTEXT-COMPACTION.md` / `PROVIDER.md`
- 不改 `docs/TODO.md` / README / CHANGELOG（父侧写域）；不碰他链在途档
- **UI / 交互**：本批零 UI 面（无 TUI / VSC 显示改动；无 `open` 项）

**计数（D3）**：用例 **6**（编号 T-CB1–T-CB6；在役 5——T-CB6 已退场，删除记录 = `TESTING.md` §11.3）· AC **5**（AC-CB1–AC-CB5）· 实施域 **3 项**（2 改 + 1 新）· 文档域 **2 档**；需求 §10 = F27 / N19。

## 17. 评审失败护栏：同一 doc-set 连续未完成即停（第 33 批——2026-09-11）

> 需求 = `../requirements/ADVISOR-CONVERGENCE.md` §12（F28 / F29 / N20 / N21）；批次档 = `../batches/2026-09-11-REVIEW-ATTENTION.md` §1 条目 G1（用户 2026-09-11 13:36 裁定）。
> **冻结窗口（D5）**：本节为**新增节**——§1–§16 零碰；本档变更记录追加一行。
> 上下游不变式：凭证签发 / 作废 / 清洗语义、cap（含 design 豁免）、判定族六 kind 与六条尾文案、
> 陈旧判定 / 记账 / 结算本体**逐字零改**。

### 17.1 问题陈述（现场复核——file:line 为 as-of 2026-09-11）

- **缺陷**：design 评审 cap 豁免（`src/advisor/run.mjs:21-25`；工具层 cap 预检只走 code 分支 `src/agent-tools/advisor.mjs:165-168`）
  ⇒ **失败路径无上界**：判死（宿主截断尾——结算不签发，`src/agent-tools/design-token.mjs:86-94`）
  与 stale（陈旧结算——不签发，`src/agent-tools/advisor-settle.mjs:196-203`）都不产出凭证，
  而设计评审必须拿到凭证才能继续交付链 ⇒ **必然重评**，每次都是整场预算（默认 600s + 全量上下文）。
- **既有出口盘点**：code = 5 轮 cap（cap 消息 = 收敛失败出口）；design = **无**——两条失败提示都只有
  「重跑 / 缩范围」指引，没有次数上界（病根即 issue #IKDCVV 的评估结论）。
- **计数锚可行性（结算点三输入齐备）**：
  1. `settleAdvisorRun`（`src/agent-tools/advisor-settle.mjs:121-211`）结算时同时持有 `stale`（:128）、
     `incomplete`（单谓词，:133）、`settled.passed` 与落盘结果（:142-168）——分类输入一处可得；
  2. 同步面（`src/agent-tools/advisor.mjs:218-237`）在同点持有 `settled.passed` 与 `incomplete`；
  3. 「同一 doc-set」键现成：`docSetKey`（`src/agent-tools/advisor-async.mjs:67-75`——次序无关 + ABS 归一；
     与实例续跑同源）。
- **既有语义可复用**：拒发语义（不置 called / 不耗轮次——`src/agent-tools/advisor.mjs:165-168` cap 款）、
  未完成判定单谓词（§14.3）、每评审实例注册表（`agent._advisorRuns`）。

### 17.2 方案选型对比

**表 1——N 值**（判据来自需求层：防无限重评 / 误停概率 / 代价上界 / 恢复成本 / 同族一致性）

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | N=2 | 浪费上界最小（最多 1 次同集重跑余量）；但两次暂态噪声（如 `empty`×2）即触发误停——停止不可自解除，误停恢复 = 换范围 / 新会话 | 误停面最大：把偶发当系统故障 | 否决 |
| 2 | **N=3** | 连续 3 次同集无可用结算 ≈ 强证据（暂态连中三次概率低）；容忍一次暂态重试；浪费上界 2 次整场预算；与 round2/3 收敛提示的既有节奏同量级；「三振」惯例 | 对比 N=2 多付至多 1 次失败重跑 | **选定** |
| 3 | N=5 | 与 code cap 同数字但异轴（易被读成同语义）；浪费上界 4 次（600s 预算下 ≈ 40min+ 额度） | 过宽——护栏形同无感 | 否决 |

**表 2——计数载体**

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | run 实例对象（`run.incompleteStreak`） | 零新结构；但「pass 但落盘失败」路径已由 `settleDesignReview` 关闭实例（`design-token.mjs:108`）——重建实例丢计数；且「同一 doc-set」语义锚在键、不在实例 | 语义锚错位 + 已知漏面 | 否决 |
| 2 | **会话级 Map<docSetKey, {count, log}>**（`agent._designReviewStreaks`） | 与「同一 doc-set」同锚（键 = 现成 `docSetKey` 单源）；跨实例重建存活（含落盘失败路径）；生命周期 = 会话级内存（重启 / `/new` 归零；重置点与 `_advisorRuns` **刻意不同步**——§17.9 #5 定案）；有界（不同 doc-set 数量级极小） | 新会话级小 Map（+1 字段） | **选定** |
| 3 | 落盘（session 文件字段） | 跨重启存活；但与轮次 / cap 既有语义相悖（重启归零、保守重评——§2.2），且引入字段迁移 / 校验恢复面 | 面大且与既有口径相悖 | 否决 |

**表 3——与 design 豁免 5 轮的关系**

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **叠加**（豁免保留 + 新失败轴护栏） | 语义正交（轮次轴 vs 失败轴）；保留 2026-09-07 用户裁定；失败无上界的病根由本轴直接闭合 | 两个上界概念并存——须写明轴差异（本节与需求 §12 已明示） | **选定** |
| 2 | 替代（design 重施 5 轮 cap） | 单一上界；但推翻用户裁定，且轮次预算内的失败循环仍不受控（目标未闭合）；误伤「多轮修正、每次都产出判决」的正常收敛 | — | 否决 |
| 3 | 只提示不拦（每次失败附计数提示） | 零新拒绝面；但「靠父侧临场兜」正是本批要治的病 | — | 否决 |

### 17.3 契约一：结算分类（纯函数单源）

`designReviewOutcome(input)`（新模块 `src/agent-tools/review-streak.mjs`——纯函数，无 I/O / 无状态）：
输入 = 一次 design 结算的宿主可见事实；输出 = `{ reset, count }`（`reset=true` = 计数复位；
`count` = 需加一的类名；两者皆空 = **neutral**——不动计数）。

**优先级（自上而下，首个命中）**：

| # | 输入（结实事实现场） | 输出 | 语义依据 |
|---|---|---|---|
| 1 | `launchRefused`（报告以 `ADVISOR_LAUNCH_REFUSAL_PREFIX` 开头——未发起请求） | neutral | 无尝试发生（§14.4 既有语义） |
| 2 | `stale`（设计评审陈旧结算） | `count: "stale"` | F28 计数类（判死 / stale 两源之一） |
| 3 | `!hasResult`（design 结算无报告——防御性，正常链不可达） | `count: "no_report"` | fail-closed：无报告不得计为可用 |
| 4 | `incomplete !== null` 且 `!== "interrupted"` | `count: "{kind}"`（五 kind） | 宿主截断尾（单谓词——§14.3 同源） |
| 5 | `incomplete === "interrupted"` | neutral | 用户 / 系统中断类——被丢弃的尝试（与 cancelled 同族） |
| 6 | `persistFailed`（pass 但槽落盘失败） | `count: "no_credential"` | 未产出可用凭证（F28 计数类） |
| 7 | 其余（`passed` 且落盘成功 / changes-required） | `reset` | 可用判决——连续链断点 |

- **确定性**：全部输入为宿主状态（尾族谓词 / stale 标志 / 结算结果 / 落盘结果）——**零 LLM 输出解析**（N20）。
- **neutral 与 reset 的分工**：neutral = 无信息事件（取消 / 中断 / 拒发）——**不打断连续计数**
  （防「取消夹在两次失败之间即洗白」）；如实注：失败-取消-失败-失败 的序列在语义上略宽于「字面相邻」——
  取舍与收紧方向登记见 §17.9 #2。

### 17.4 契约二：计数、停止与结论（逐字）

**计数（`noteDesignReviewOutcome(agent, key, outcome)`）**：

- `reset` ⇒ 删除该键记录；`count` ⇒ 记录 `{count: prev+1, log: [...log, kind].slice(-MAX_DESIGN_REVIEW_STREAK)}`；neutral ⇒ 不动。
- 键 = `docSetKey(documents, cwd)`（**自 `advisor-async.mjs` 逐字迁入**——单源）；**空清单键不适用**：不计数也不停止（登记 §17.9 #3）。
- 载体 = `agent._designReviewStreaks`（Map——懒初始化；**eng 模式切换不清护栏**——与 `_advisorRuns` 刻意不同步，定案见 §17.9 #5）。

**常量**：`MAX_DESIGN_REVIEW_STREAK = 3`（`review-streak.mjs` 导出；`MAX_ADVISOR_ROUNDS` 零改动）。

**停止判定（`designReviewStreakStopped(agent, key)`）**：`(record?.count ?? 0) >= MAX_DESIGN_REVIEW_STREAK`；空清单键恒 false。
**不可自解除**：被拒后记录保留（复位仅经「可用判决」——被拒后无法发生）；会话结束（重启）随载体清零。

**结论串（`buildDesignReviewGuardMessage(record, documents)`——`run.mjs`，逐字；表行 = 记录逐条）**：

```
Advisor: design review stopped — 3 consecutive attempts on this document set produced no design token (repeated failed settlements; no further reviews will start for this set in this session).
Document set (1 design instance — no token issued):
- docs/design/X.md
- docs/requirements/X.md
Attempts (most recent last):
| # | outcome | meaning |
|---|---|---|
| 1 | timeout | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| 2 | stale | the reviewed documents changed while the review was in flight |
| 3 | empty | the provider returned an empty response |
Options:
1. Accept the current state and proceed — implementation for this document set stays gated (no design token).
2. Narrow or change the scope: a different document set starts a fresh budget — fix the cause first (agent.advisor.timeoutMs / advisor model / provider).
3. Start a new session (/new) to reset the guard.
```

**kind → meaning 映射（逐字——上表第三列）**：

| kind | meaning |
|---|---|
| timeout | review exceeded the wall-clock budget (agent.advisor.timeoutMs) |
| context_limit | review exceeded the model context budget |
| turn_cap | review exceeded the tool-round limit |
| empty | the provider returned an empty response |
| review_failed | provider / transport error |
| stale | the reviewed documents changed while the review was in flight |
| no_credential | the token could not be written to the session ledger |
| no_report | the review settled without a report |

**稳定前缀**：`ADVISOR_DESIGN_STREAK_STOP_PREFIX = "Advisor: design review stopped"`（`run.mjs` 导出——与
`ADVISOR_LAUNCH_REFUSAL_PREFIX` 同族；实现 grep / 用例断言锚）。凭证卫生：串内零 token / designId 值。

### 17.5 契约三：检查点与计数点（接线）

**检查点（cap 两点式同形）**：

1. **工具层预检**（`src/agent-tools/advisor.mjs`——cap 预检邻位，`resolveAdvisorLaunch` 之后、`if (isAsync)` 之前）：
   `reviewType === "design" && designReviewStreakStopped(agent, resolved.run.docSetKey)` ⇒ 登记
   `_advisorRefusals`（`ctx._toolCallId` 存在时）+ 返回结论串。**sync / async 两路同治**（检查点在分叉前）。
2. **`runAdvisorReview` 内防线**（`src/advisor/run.mjs`——cap 内检查邻位）：`reviewType === "design"` 且有 `documents`
   ⇒ 算 `docSetKey` → 命中则返回结论串——**不建消息、不发起**（防直接调用方绕；零 LLM）。

**计数点（分类单源 `designReviewOutcome`）**：

1. **异步结算**（`settleAdvisorRun`——非陈旧 design 分支 / 陈旧 design 分支 / design 无报告分支三出口）
   ⇒ `noteDesignReviewOutcome(agent, run.docSetKey, designReviewOutcome({...}))`；
   `launchRefused` 判定上移为该结算段单点（消费点 = design 分类 + code 守卫——既有语义零变）。
2. **同步面**（`src/agent-tools/advisor.mjs`——design 结算 `settleDesignReview` 返回后）⇒ 同函数。
   同步面无 stale / 无落盘步骤（`persistFailed` 恒 false）。

**模块图（新中立模块——打断潜在环）**：`review-streak.mjs` 不 import 任何 `src/` 模块；
`normAbs` 自 `advisor-settle.mjs` 迁入 + 原处 re-export（既有 import 面零变）、
`docSetKey` 自 `advisor-async.mjs` 迁入（原为私有——零 import 面）。
`run.mjs` → `review-streak.mjs` 单向（不构成环：`review-streak` 无回指）。

### 17.6 受影响文件全清单（as-of 2026-09-11 实测——含修正轮复核；行数口径 = `N lines total`）

**实施域（eng-coder 写域——4 改 + 2 新）**

| # | 文件 | 当前行数 | 动作 | 预计增量 | 档位结论 |
|---|---|---|---|---|---|
| 1 | `src/agent-tools/review-streak.mjs` | 新 | 新增（常量 + `normAbs` / `docSetKey` 迁入 + 记录 API + 纯分类函数） | ~95 | 新档 ≤300 ✓ |
| 2 | `src/advisor/run.mjs` | 239 | 改（结论串构建 + 前缀常量 + `runAdvisorReview` 内防线 + 导入） | +~42 | 交付 ~281 ≤300 ✓ |
| 3 | `src/agent-tools/advisor.mjs` | 241 | 改（工具层预检 + 拒发登记 + 同步面计数） | +~20 | 交付 ~261 ≤300 ✓ |
| 4 | `src/agent-tools/advisor-settle.mjs` | 212 | 改（`normAbs` 迁出 + 结算段计数接线） | 净 +~10 | 交付 ~222 ≤300 ✓ |
| 5 | `src/agent-tools/advisor-async.mjs` | 354 | 改（`docSetKey` 迁出 + 导入） | 净 −~6 | >300 advisory（存量 354 → 交付 ~348；净减——迁出 `docSetKey`；拆分评估见 §17.9 #1） |
| 6 | `test/design-review-streak-guard.test.mjs` | 新 | 新增（T-SK1–T-SK8 + T-SK10 在役；T-SK9 已退场——整删，删除记录 = `TESTING.md` §11.3） | ~230 | 新档 ≤500 ✓ |

**文档域（eng-designer 写域——本设计者已落）**

| 文件 | 行数注记（批次前 → 落档后） | 变更 |
|---|---|---|
| `docs/requirements/ADVISOR-CONVERGENCE.md` | 293 → 334 | §12（F28 / F29 / N20 / N21 + 边界）——**已落** |
| `docs/design/ADVISOR-CONVERGENCE.md` | 1242 → 1501 | §17 + 变更记录（含修正轮行）——**已落** |

测试基建：CLI 无注册清单档——`test/*.test.mjs` glob 自动发现；新用例零网络 / 零真实 LLM（桩 agent + 纯函数直驱）/ 零长等待。
`test/advisor-chain-guards.test.mjs`（498 行近帽）**不复用**——新建档（同族同口径）。

### 17.7 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-SK1 | **N = 3** | 表 1——三振 + 暂态容忍 + 上界可控。否决：2（误停面最大）· 5（形同无感） |
| D-SK2 | **载体 = 会话级 Map<docSetKey>**（不落盘） | 表 2——同锚 + 跨实例存活 + 会话级寿命（跨 eng 模式切换——§17.9 #5 定案）。否决：run 实例字段（已知漏面）· session 落盘（面大且违既有口径） |
| D-SK3 | **「同 doc-set」判据 = `docSetKey`**（迁入复用） | 与实例续跑同源（零新归一逻辑）；空清单不适用（登记） |
| D-SK4 | **计数类 = 未产出可用结算**（五 kind + stale + no_credential + no_report）；reset = 可用判决；neutral = 取消 / 中断 / 拒发 | §17.3 表——覆盖「判死 / stale / 无凭证」三源；`interrupted` 归 neutral（用户中断类不惩罚——与 cancelled 同族） |
| D-SK5 | **与 design 豁免 5 轮 = 叠加** | 表 3——语义正交 + 保留用户裁定。否决：替代（推翻裁定且目标未闭合）· 只提示（不治本） |
| D-SK6 | **停止 = 硬停（会话内不可自解除）** | 恢复 = 换 / 缩范围（天然新键）· `/new` · 接受现状；**不随 eng 模式切换清空**（与 `_advisorRuns` 刻意不同步——§17.9 #5 定案）。否决：自动解除（护栏失效） |
| D-SK7 | **拒发不耗轮次 / 不耗预算 / 不置已覆盖** | 与 cap 拒发既有语义逐条同款（`_advisorRefusals` 登记——record-results 不置 called / 不进 round） |
| D-SK8 | **分类单源纯函数（两计数点共用）** | §14.3「单谓词三消费点」教训的直接沿用（防两处各写分类漂移） |
| D-SK9 | **改动用例新建档**（不复用 498 行档） | 近帽档不得再增厚（档位纪律）；新档 glob 自动发现 |
| D-SK10 | **CLI 单端本批**；VSC 镜像登记（§17.9 #1） | 各端独立实现纪律；证据与完整修复路径已列（file:line as-of） |

### 17.8 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D2 单一权威源** | 分类 / 计数 / 停止语义只在本节详述；需求 §12 引用不重述判定表；六 kind 谓词 / 陈旧判定 / 凭证机制**只引用不重述**（§14.3 / §14.14 / `ENGINEERING-MODE.md`） |
| **D3 计数·枚举** | 用例 10（编号 T-SK1–T-SK10；在役 9——T-SK9 已退场，删除记录 = `TESTING.md` §11.3）· AC 6（AC-SK1–AC-SK6）· 实施域 6 项（4 改 + 2 新）· 文档域 2 档——声明与列表逐条一致（本节计数行同表） |
| **D4 指针纪律** | 指针 = `文档:节`；代码锚 file:line 标 as-of |
| **D5 冻结窗口** | 本节只**新增节** + 变更记录一行——§1–§16 零碰 |
| **D6 回读核对** | 需求 §12 与本节落笔后回读核实；实施面验收含静态锚（AC-SK4 / AC-SK6） |
| **D7 变更留痕** | 本档变更记录追加一行（本批）；需求档按既有形态（§12 自带日期与批次注记） |
| **凭证不落档** | 本节全文零 token / designId 值（结论文案用通用计数与 doc-set 路径占位） |
| **cap 语义（§3.2 design 豁免）** | 零改——本护栏是叠加失败轴；`MAX_ADVISOR_ROUNDS` 与 cap 预检分支不动 |
| **判定族 / 六条尾文案（§14.3）** | 零改（谓词原样复用；`interrupted` 仅在本分类中作 neutral 分支，不改谓词本身） |
| **完成守卫（§6.2 / §15）** | 公式本体与 sync 记账零改；护栏拒发沿 `_advisorRefusals` 既有契约（不置 called） |
| **eng 模式重置点** | 定案 = **不同步**——模式切换不清护栏（`eng.mjs` / `cmd-eng.mjs` 零改；§17.9 #5 定案 + T-SK9 静态锚——已退场：整删，删除记录 = `TESTING.md` §11.3） |
| **多实现面纪律（双端）** | CLI 单端本批；VSC 同构面如实登记（§17.9 #1——不静默、不跨端追赶） |
| **档位（≤300 / ≤500）** | 逐文件行数注记 + 交付预估（§17.6）；无越帽项 |

### 17.9 后续登记项（本批不碰——明示，不静默）

1. **VSC 端镜像（后续批建议——父侧排程）**：VSC 侧同款失败无上界存在——`thincoder-vscode/src/agent-tools/advisor-async.mjs`
   （**492 行**——近 500 帽：`_advisorRuns` :66-70、`docSetKey` 同款 :102 注释、settle 段 :308 起）+
   `advisor.mjs`（324 行——:115/:129 实例读取）；镜像批须**先评估该档拆分**（新增必越帽）。CLI 侧本批交付 ~348——远 500 帽，无需拆分评估（§17.6 行 5）。
   文档面：`ADVISOR-CONVERGENCE（VSC 仓）` 新增节（承接 §15 编号）+ 变更记录；测试档须入
   `thincoder-vscode/test/files.mjs` 注册（VSC 显式清单）。
2. **neutral 不打断连续的取舍**：失败-取消-失败-失败 亦会累积（现语义）。若实测误报（取消本意为放弃本 doc-set）
   → 收紧为「严格相邻」或让取消复位（语义级——需用户裁定）。
3. **空 documents 清单的 design 评审**：护栏不适用（其连评已由实例键控归并——既有 quirk，本节不改；如实注）。
4. **「会话内再武装」不引入**：硬停的解除 = 换 / 缩范围 · `/new` · 接受现状；若实测「配置修复后想重试同集」成为
   痛点 → 另批评估（候选：键加配置指纹 / 显式再武装通道——均需走设计评审）。
5. **`_designReviewStreaks` 生命周期（修正轮定案——原「二选一」收口）**：**会话级**——随会话结束（重启 / `/new`）归零；
   **eng 模式切换不清**（`eng.mjs` / `cmd-eng.mjs` 的 `_advisorRuns` 置空点**刻意不同步**——护栏病理（同 doc-set 机械性失败）不随评审实例周期改变；
   F28⑤「停止在该会话内不可自解除」+ 结论串选项③ `/new` 为唯一会话级复位）；实现动作 = **零**（零清位调用——`eng.mjs` / `cmd-eng.mjs` 零改；机判 = T-SK9 静态锚（已退场：整删，删除记录 = `TESTING.md` §11.3） + AC-SK2）。
6. **父侧核销面**：`docs/TODO.md` 需求池行 / #IKDCVV 台账 / CHANGELOG——父侧写域，本设计者不动。

### 17.10 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-SK1 | 正常 | `designReviewOutcome` 输入矩阵：pass+落盘成功 / changes-required（无尾、无回显）/ 五 kind 逐一 / `interrupted` / stale / persistFailed / launchRefused / hasResult=false | 逐项：reset / reset / `count:{kind}`×5 / neutral / `count:"stale"` / `count:"no_credential"` / neutral / `count:"no_report"`（优先级逐条锁定） | F28 / N20 |
| T-SK2 | 正常 | `noteDesignReviewOutcome`：连续三次 `count`（同类） | `count===3`；`log` 顺序 = 录入顺序；`designReviewStreakStopped` → true | F28 |
| T-SK3 | 边界 | 混合 kind：`timeout` → `stale` → `empty` | `count===3` 且停止；`log` 三 kind 有序（结论表数据源） | F28 / F29 |
| T-SK4 | 边界 | 计数 2 后一次 `reset`（changes-required）再 2 次 `count` | 第二次序列停在 2（<3）不停；记录删除后重建（log 从空起） | F28 判定句③ |
| T-SK5 | 边界 | 序列含 neutral：count → neutral（`interrupted`）→ count → count | `count===3` 停止；neutral 不增计数（值断言） | F28 / D-SK4 |
| T-SK6 | 边界 | 键隔离与归一：集合 A 停止后集合 B 发起；同集写法变体（`./docs/x.md` vs `docs/x.md`；反斜杠；次序颠倒）指向同一键 | B 不受影响；变体同键（A 的计数在变体发起上生效——`stopped===true`） | F28 判定句④ |
| T-SK7 | 错误 | 工具层预检：置位 3 次计数后 `advisorTool.execute({type:"design", documents:[A]}, ctx)` | 返回串以 `Advisor: design review stopped` 开头；含尝试表与三选项；零 chat 调用；`_advisorRefusals` 命中该 toolCallId | F28 / F29 |
| T-SK8 | 正常 | `settleAdvisorRun` 直驱（桩 agent + 桩 entry）：design + 六 kind 报告逐一（含 stale 分支与 persist 失败分支） | 每次按分类增计数 / 记录 kind；launchRefused 报告 → 不动计数 | F28 / N20 |
| T-SK9 | 边界 | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F28 · §17.9 #5 |
| T-SK10 | 错误 | 空清单：`documents=[]` 与 `documents=null` 下的计数 / 停止调用 | 均 no-op / false（护栏不适用——fail-open 于此面；无计数写入） | F28（登记 §17.9 #3） |

> 测试基建：桩 agent（`{_designReviewStreaks: new Map(), cwd}`）+ 直驱纯函数 / `settleAdvisorRun` / `advisorTool.execute`
> （零网络、零真实 LLM、零长等待——微秒级）；新档由 glob 自动发现。

### 17.11 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-SK1 | 分类单源：T-SK1 绿（矩阵逐项）；`designReviewOutcome` 纯函数静态锚（`review-streak.mjs` 无 I/O、无 import `src/`）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §11.3） | F28 / N20 |
| AC-SK2 | 计数 · 停止 · 复位：T-SK2 – T-SK5 绿；`_designReviewStreaks` 在 session 落盘面 grep 零命中（会话级载体）；`eng.mjs` / `cmd-eng.mjs` 零命中（模式切换不清护栏——T-SK9 已退场：整删，删除记录 = `TESTING.md` §11.3；§17.9 #5 定案） | F28 / N20 |
| AC-SK3 | 停止产物：T-SK7 绿（前缀逐字 + 尝试表 + 三选项 + 零凭证值 + 拒发登记）；T-SK3 的 log 与表行一致 | F29 |
| AC-SK4 | 两级检查点：T-SK9 已退场（整删——删除记录 = `TESTING.md` §11.3）；T-SK7 零 chat 调用 | F28 |
| AC-SK5 | 键归一与隔离：T-SK6 绿；T-SK10 绿（空清单 no-op） | F28 判定句④ / §17.9 #3 |
| AC-SK6 | 零回归 + 档位 + 文档一致：`cd thincoder && node test/run-fast.mjs` 全绿（含既有 advisor 三档）；新档被 glob 发现（测试数 +1 档）；§17.4 逐字文案在实现中 grep 命中；受影响文件 ≤ 档位帽（实测对表）；`node scripts/check-doc-width.mjs` 新增违规 0；`src/prompts/**` 与 VSC 仓零改动 | N20 / N21 |

### 17.12 边界（本批不做）

- 不改凭证机制本体与签发 / 作废 / 清洗语义；不改 cap 与 design 豁免（叠加轴）
- 不改评审侧提示词、判定族谓词与六条尾文案、陈旧判定 / 记账 / 结算本体
- 不对代码评审生效；不做自动重跑 / 自动缩范围 / 自动再武装
- 不做 VSC 端实现（登记 §17.9 #1）；不碰 `AGENT-LOOP.md` / `AGENT-PARAMS.md` / `ENGINEERING-MODE.md` 链
- 不改 `docs/TODO.md` / README / CHANGELOG（父侧写域）
- **UI / 交互**：本批零 UI 面（结论串落工具返回值；无 TUI / VSC 显示改动；无 `open` 项）

**计数（D3）**：用例 **10**（编号 T-SK1–T-SK10；在役 9——T-SK9 已退场，删除记录 = `TESTING.md` §11.3）· AC **6**（AC-SK1–AC-SK6）· 实施域 **6 项**（4 改 + 2 新）· 文档域 **2 档**；需求 §12 = F28 / F29 + N20 / N21。

## 18. 群 B 批 CLI 侧落点：评审估算器 CJK 加权 + 对位登记面（2026-09-11）

> 来源：批次档 `../batches/2026-09-11-VSC-REVIEW-ASYNC-SWEEP.md` §1 条目 B4（登记承接 = 本档 §16.8 #2）。
> 需求 = `../requirements/ADVISOR-CONVERGENCE.md` §13（F32 / N22~N24——指针不重述）。
> 双端纪律：B4 双端（语义同源、各端独立实现、零跨仓依赖）；VSC 面落 `ADVISOR-CONVERGENCE（VSC 仓）§17.3`——本节 = 语义源 + CLI 面。
> CLI 仓其余面（B1 / B2 / B3）零改——对位登记见 §18.4。

### 18.1 问题（复核 as-of 2026-09-11）

`src/advisor/compaction.mjs:38-45`——`estimateTokens(messages)` = `Math.ceil((content.length + toolCalls.length) / 4)` 扁平式；
CJK 低估 ~3-4×（主循环 `estimateText`——`src/provider/rate.mjs:30-36`，ASCII/4 + 非 ASCII/1）。
消费点：`src/advisor/loop.mjs:120 / 124 / 127`（compactAt / 判死线 / 判死尾计数）+ `src/advisor/run.mjs:264`（显示统计——装饰面）。
行号实证：§16.4 #4 已如实注「20% 头寸不能完全覆盖 4× 级 CJK 低估」（§16.6 D-CB9 本批不改——另批登记）；本批即承接。

### 18.2 方案选型（候选 ≥2）

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **复用 `src/provider/rate.mjs#estimateText`**（叶子模块——仅依赖 `abort-provenance.mjs`） | 单源加权公式（与主循环同口径）；纯 ASCII 逐值相等；零新配置面 | import +~1 行；公式替换 1 行 | **选定** |
| 2 | 本文件内联加权式（复制公式） | 零跨模块依赖；但公式双源（D2——与 rate.mjs 漂移风险） | — | 否决 |
| 3 | 全对齐 `context.mjs` 的 estimateTokens walker（reasoning_content / 逐参 tool_calls） | 口径最全；但面大于需求（评审 messages 无 reasoning_content 持久；判死语义不变） | — | 否决 |

### 18.3 契约与受影响文件

**契约（逐条）**：

1. `estimateTokens(messages)` 内容项改 `estimateText(content + toolCalls)`——walker（content / tool_calls 两源）零改、计数口径（含 tool_calls JSON 全串）零改；
2. 纯 ASCII 输入与旧式逐值相等（`ceil((len−0)/4)` 同式）；CJK「中」×N → N（旧式 N/4）；
3. 消费点（两守卫 + 判死尾 + 显示统计）零改——只随新估值自然生效；比例系数（`CONTEXT_LIMIT_RATIO` / `COMPACT_TRIGGER_RATIO`）零改；
4. 判定族 / 六条尾文案 / `looksLikeReviewOutput` 阈值谓词零碰。

**受影响文件（行数 as-of 2026-09-11 实测）**：

| # | 文件 | 现 | 预计 | 动作 |
|---|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | 171 | ~174 | +import +加权式 |
| 2 | `test/advisor-context-budget.test.mjs` | 101 | ~140 | T-EST1 / T-EST2（ASCII 夹具断言逐值不变——零回归对照） |

**用例表（T-EST1 / T-EST2——同 VSC §17.3 语义；CLI 面夹具同型）**：

| # | 类型 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-EST1 | 正常 | `estimateTokens`：纯 ASCII 400 字符 | 100（与旧式逐值相等——零回归） | F32 |
| T-EST2 | 正常 | CJK「中」×400；混合 200 ASCII + 200 CJK | 400（旧式 100）；混合 = 50 + 200 = 250 | F32 |

**AC（机判）**：

| AC | 判据 | 回指 |
|---|---|---|
| AC-B4-CLI-1 | T-EST1 / T-EST2 绿；既有夹具断言（12 × TOKENS_PER_BLOB 等）逐值不变——CLI 快层全绿 | F32 / N22 |
| AC-B4-CLI-2 | 行数实测对表 + `check-doc-width` 新增违规 0 | N24 |

### 18.4 对位登记面（CLI 零改——明示，不静默）

| # | 面 | CLI 现状（复核 as-of） | 处置 |
|---|---|---|---|
| 1 | B2 async 结算面拒发记账（VSC 已修） | `src/agent-tools/advisor-settle.mjs:133` `run.round++` 无条件 + `:227-229` prior 写入（launchRefused 可命中 `looksLikeReviewOutput`）——与 VSC 修复前同款 | **登记**（本批零改；语义同源指向 `ADVISOR-CONVERGENCE（VSC 仓）§17.1`；随批评估——触发 = VSC 面交付验证或用户裁定） |
| 2 | B3 冻结窗口 file_ops 面（VSC 已修） | E-6 #3 维持：bash / file_ops 不拦不记（§14.14）；子代理合入面 = E-6 #5 登记 | **登记维持**（不跨端追赶；复核条件随 `ADVISOR-CONVERGENCE（VSC 仓）§17.2` 表） |
| 3 | B1 advisor 池中止（VSC 已修） | CLI Stop = 全停 → 清池即诚实（无孤儿） | 不需修（本端语义自洽——对位口径 `AGENT-LOOP（VSC 仓）§12.8 #2`） |

### 18.5 边界（本批不做）

- 不改 `loop.mjs` / `run.mjs` / 判定族 / 尾文案 / cap / 凭证机制；不新增配置项；
- B1 / B2 / B3 CLI 面零改（§18.4 登记）；不做 VSC 仓写入；
- **零 UI 面**（TUI 显示统计随估值自然变化——无渲染面改动）。

**计数（D3）**：条目 1（B4-CLI）+ 登记 3 项（§18.4）· 用例 2（T-EST1~T-EST2）· AC 2（AC-B4-CLI-1~2）·
实施域 2 档（compaction 改 + 测试档扩例）· 文档域已落（本节 + §16.8 #2 收口注 + 变更记录行）。

## 变更记录（历史折叠——详见 git log）

- 2026-08-01~08-08 反转链一句演变：cap 引入（防发散拉锯）→ round2+ fresh session + design 并入共享预算 → prior 表重注入 round2+（响应表退为聚焦参考）→ 硬解析/短语匹配删除、prior 改全文原文注入、轮次判定确定性化——现行语义见正文各节。
- 2026-08-21：guard 语义重构——advisor 工具永远可用、guard opt-in（`advisor.guard`）、工程模式关闭。
- 2026-08-22：响应表 Action 三值词表 + 禁 pre-existing（§7）。
- 2026-08-30：评审提速——round1 预算 20 轮（里程碑 6/10/17）、round2/3 15 轮（8 轮兜底）、硬帽 100 不动；删 caller 追踪步骤；评审质量红线（需求契合/证据纪律）不动。
- 2026-09-06：async advisor（R13）——轮次/prior/cap 随 review 实例计（`_advisorRuns`）——实例机制权威 AGENT-LOOP §11.2；同步路径 cap 同改随实例（legacy 直接调用方退化为镜像计数）。
- 2026-09-07：design 评审 cap 豁免裁定（实现批——F1 双处 cap 条件加 design 跳过、F2 guard fallback 只认 open code 实例、F3 文档 drift 清、F4 prompts drift 核查零改；正/反向测试断言；双端全量绿）；R24b 受影响文件行数标注核查维度（§9——METHODOLOGY 挂钩单向化）。
- 2026-09-07：批 A 格式债重写——历史流水折叠、契约句逐字保留、指针按 AGENT-LOOP 重排编号更新（§11.2 async / §12.2 铁律——旧 §24/§18.10 已随 AGENT-LOOP 重写不存）。
- 2026-09-11：**评审后收口**（用户实况发现批）：`Action` 三值 → **四值**（新增 `Dispatched` = 修正轮在途——§7）+ **修正轮 ⇄ 用户批准 时序**（严格序——§13）；
  **新老划断**：第 3/6 批的并行实践为规则生效前既成事实，不回填冻结批次档（追溯行见 §13.7 · 规则生效日 = 本批落地日）。
- 2026-09-11（修正轮——设计评审轮次 1 后 8 条全部采纳落档）：§13.5 零运行时引用 + 测试层实测行位 · §13.7 D-RO8 补引 `ENGINEERING-MODE.md` §1.5 #8/#10 · §13.9 口径差登记 · §13.10 面⑥定义 ·
  §13.6 行数口径与 tier 措辞 · §13.1 锚#3 仓限定 · §13.11 AC-RO9 判据收缩；VSC 设计档 §7 四值 + §12 收口节（本修正轮落档）。
- 2026-09-11（第 13 批——机制债收束）：§15 新增（F16 同步面扩展——sync 记账消费单谓词；需求 §7 F16 文字零改）；修正轮：§15.6 镜像登记改述（单指后续批——批 12 已排除该面；评审 #4）。
- 2026-09-11（第 25 批）：§16 新增——评审上下文预算跟随模型窗口（`MAX_CONTEXT_TOKENS = 120_000` 硬编码退场：判死线 / 压缩触发改由 `providerSpec` 派生；判定族与六条尾文案零改；VSC 镜像登记 §16.8 #1）。
- 2026-09-11（第 25 批·修正轮——设计评审轮次 1 后 3 条 🔵 落档）：§16.5 文档域行数改「批次前 → 落档后」双值 · §16.9/§16.10 T-CB2 数字按夹具算术落定（~197K——64K = 64 × 1024 口径；T-CB5 同步 ~737K——与 VSC 镜像档跨端一致）· §16.2 表 2 #1 + D-CB2 措辞消歧（loop.mjs 函数体内、while 轮次外一次性派生）。
- 2026-09-11（第 33 批）：§17 新增——评审失败护栏（同一 doc-set 连续未完成即停：N=3 · 会话级键控计数 · 结论表产物；cap 豁免保留，叠加失败轴；需求 §12 = F28/F29 + N20/N21）。
- 2026-09-11（第 33 批·修正轮——设计评审轮次 1 后）：§17.6 行 5 档位标注统一（>300 advisory；行数复核 350 → 354）· §17.9 #5 生命周期定案（模式切换不清护栏——与 `_advisorRuns` 刻意不同步；§17.2 / §17.4 / D-SK2 / D-SK6 / §17.8 / T-SK9 / AC-SK2 同步）· §17.9 #1 补 CLI 侧远帽注。消歧与登记、零新语义。
- 2026-09-11（群 B 批——VSC-REVIEW-ASYNC-SWEEP）：**新增 §18**（B4 评审估算器 CJK 加权——`estimateText` 复用；ASCII 逐值零回归；对位登记面 3 项——B1 / B2 / B3 CLI 零改）；§16.8 #2 原位收口注。
