# Advisor 评审收敛协议（ADVISOR-CONVERGENCE）· 设计

> 本档是 advisor 评审收敛机制的**设计权威**：定义「审查 → 修复 → 复审」循环如何**收敛**——要么全部问题确认修复，要么在有限轮次内机械终止。
> 轮次提示词与机械执行层（cap / citations / guard）是本档语义的执行实现；评审契约句以本档为准。
> 需求层指针 = `thincoder-cli/docs/requirements/ADVISOR-CONVERGENCE.md`（该板块需求档——迁入基准层属后续批）。
> 兄弟档：`design/ADVISOR-GUARDS.md`（评审链边缘守卫：判定族 / 凭证链 / 引文候选链 / 预算 / 冻结窗口 / 护栏 / 预算跟随 / 加权）·
> `design/ENGINEERING-MODE.md`（token / 门禁 / guard 开关 / 信任模型）· `design/AGENT-LOOP.md`（异步评审实例机制 · 判定铁律 · 评审对象锚）。
> 权威边界：**同步评审路径 = 本档**；**异步评审路径 = `design/AGENT-LOOP.md` §11.2**（轮次 / cap 语义以实例机制落地）；
> **判定铁律 R1–R7 = `design/AGENT-LOOP.md` §12.2**——与本档**正交**（本档管轮次衰减 / 收敛上限；铁律管严重级怎么定）；冲突时以本档轮次表为准。
> 实现载体：轮次提示词（`thincoder-core/prompts/advisor-round1.md` / `advisor-round2.md` / `advisor-round3.md` / `advisor-design.md`——硬加载，缺失即抛错）·
> `thincoder-core/advisor.mjs`（system prompt 轮次选择 / follow-up 构建 / 评审会话组装）· `thincoder-core/advisor/run.mjs`（执行与机械 cap）·
> `thincoder-core/advisor/loop.mjs`（工具循环：硬墙 / 预算提示 / 结构化尾）· `thincoder-core/advisor/compaction.mjs`（压缩与守卫族）·
> `thincoder-core/advisor/convergence.mjs`（round2+ 收敛消息体）· `thincoder-core/advisor/messages.mjs`（user 消息构建）·
> `thincoder-core/advisor/citations.mjs`（host-verified citations）· `thincoder-core/advisor/history.mjs`（响应表 / 对话背景提取）·
> `thincoder-core/advisor/repos.mjs`（评审范围采集）· `thincoder-core/agent-tools/advisor.mjs` / `advisor-async.mjs`（工具面与异步池）·
> `thincoder-core/agent-tools/advisor-settle.mjs`（结算 / 陈旧判定）· `thincoder-core/agent/record-results.mjs`（工具结果记账）· `thincoder-core/agent/completion.mjs`（完成 guard 推回）。
> 档位判据（>300 主动拆 / >500 硬顶）= 纪律层代码结构判据节；行数标注义务 = 纪律层文档规范节；评审核查维度行为 = 本档 §8。

## 1. 目标

独立评审必须在“审查 → 修复 → 复审”循环中**收敛**：要么确认全部问题已修复，要么在有限轮次内机械终止。
历史病根：advisor 反复执行、每轮全量扫描都报新问题、永不收敛（修复前 system prompt 冻结在 ROUND1，收敛约束只存在于 user 级消息，system 权重压过 user）；以及复评引用旧文件状态、把已修复问题反复报回。

- **轮次衰减**：system prompt 按轮次替换（§2 / §4）——ROUND1 全量、ROUND2 验 prior 为主、ROUND3+ 严格只验 prior。
- **机械 cap**：代码评审第 6 次启动机械终止、不消耗 LLM（§3）。
- **会话隔离 + 证据机械校验**：每轮 fresh session（旧 read 数据物理不在上下文）+ host-verified citations 机械比对磁盘（§4 / §5）。
- **确定性状态**：轮次 / 失效 / 重置全部由运行状态位决定，**不解析 LLM 输出**（§2 / §6）。

## 2. 轮次定义

### 2.1 轮次表

| 轮次 | system prompt | 检查范围 | 新问题权限 |
|---|---|---|---|
| Round 1 | 代码评审档 / 设计评审档 | 全量审查（评审对象声明 + 范围文件；先读项目指南指向的需求文档） | 任意问题，建立 issue 表 |
| Round 2 | round2 档 | 以验证 prior 表为主 | **仅限**明显可见且导致 crashes / data loss / logic errors 的新问题 |
| Round 3–5 | round3 档 | 严格只验证 prior 表 | **禁止**（“Do NOT look for new issues”） |

- **评审对象锚**：round1 与 round2+ 的用户消息都以机械生成的 **Review-object declaration** 块开头（`{type, target, status, reason, exclude}`——每轮注入）——评审员不推断“评谁 / 为什么评”。
- **设计评审与代码评审共用收敛提示词轮换**：round 1 用设计评审档（设计评审标准 + Approval Signal——无 🔴 时回显凭证与 designId 双值逐字）；round 2/3+ 用收敛提示词（验证 prior 表、证据强制）。
- **cap 仅代码评审**（§3.2）：design 轮次继续递增（收敛提示词轮换 + 轮次显示照常），第 6 次调用不被 cap 拒绝。

### 2.2 轮次映射与 off-by-one

- **轮次计数 = 已完成**的 advisor 评审尝试次数（同步路径：工具调用完成后记账——含失败/错误返回的尝试；拒发——cap / 池满 / 无范围——不计不置；异步路径：结算时递增——attempts 语义一致）。
- round1 与 round2+ 的**语义判定是确定性的**：`轮次 > 0` **且**存有上一轮评审输出 → round 2+；否则 round 1（重启后归零 → 保守全量重评）。**无解析**：不解析 prior 表头、不匹配 all-clear 短语。
- **提示词选择**：调用时已完成 0 → ROUND1，1 → ROUND2，≥2 → ROUND3。实现用「已完成次数 + 1」推导**即将进行**的轮次号——与已完成的次数相差 1，勿混淆。
- **轮次预算按 review 实例计**（同步与异步工具路径共用实例注册表——reviewId = designId / 随机 id——round/prior 随实例；并发多评审的 round/prior 互不污染）。实例解析与结算细节权威 = `design/AGENT-LOOP.md` §11.2。
- **重置语义**：无 prior 且本 run 未改代码 → 轮次归零、开新评审周期（首次评审 / 上次 all-clear / 纯文档或无修改的 run——各自获得完整预算）；本 run 改过代码 → **保留轮次**（completion guard 必推回，轮次必须继续向 cap 推进——任何改了代码的循环不得靠归零重置逃逸预算）。每 runAgent 起始重置镜像状态（resume 续写保留——预算跨续跑，cap 不可重置）。

### 2.3 工具轮预算

提示词自报工具轮预算（防止评审者按预算花满时间的放大器）：round 1 = **20** 轮（里程碑引导 6/10/17）；round 2/3 = **15** 轮（8 轮未验完即收尾兜底）。
**机械硬帽 100 工具轮**（type-agnostic，设计评审同受；评审死循环时宿主机械打断）。

### 2.4 通过 / 阻断判定

- **通过 = 无未决 🔴**：全部 🔴 已解决、仅剩 🟡/🔵 → 评审通过（🟡/🔵 不阻断 approval——照列不隐藏）。任一 🔴 未决 → 不得声称 passed。
- **宿主判定面**：评审的“通过/不通过”**不是宿主控制流输入**——宿主不做 findings/短语解析——guard 只消费“评审发生”+ 轮次预算；是否通过由主 agent 读评审输出自行判断。**唯一机械例外** = 设计评审的凭证回显即通过信号（凭证入槽 / 门禁解锁）。
- **文档状态矛盾不卡 pass**：文档矛盾 / 状态不一致 → 🟡 报出即过（report-and-pass，评审只读不改）——**机制级描述不一致除外（= 🔴——必须处理后才可过）**。判据来源 = 判定铁律（`design/AGENT-LOOP.md` §12.2）——本档不重复铁律正文。

## 3. 机械轮次上限（cap）

### 3.1 cap 语义与执行点

**第 6 次 advisor 启动**（该实例轮次 ≥ 5）**直接返回终止消息、不消耗 LLM**——评审根本不启动。执行点：

1. **工具层预检**（同步 / 异步共用的启动前检查）——cap 拒绝只标记拒发，不置 called、不耗轮次（guard 因此在 cap 后自然停止推回）。
2. **评审执行体内防线**（legacy / 直接调用方防绕）。
3. **completion guard 的轮次项**——到 cap 后不再推回。

**cap 消息**：`Advisor: convergence cap reached after 5 rounds.` + **列出来自 prior 的未决问题**（或“All prior issues appear resolved.”）+ 三个选项：**接受当前状态继续 / 手动复查特定问题 / 新会话重置**——由用户拍板。**5 轮后不再打回**——cap 消息是收敛失败的出口，不是又一轮评审。

**无范围早退在 cap 之前**：代码评审无评审范围（无 paths/documents 且无已触碰文件）时工具层提前拒发——保证诊断信息准确（无改动文件时不误报成收敛失败）。空触碰集的检查在 cap 检查之前。

### 3.2 design 豁免 cap

- **裁定原话**：“代码评审保留机械限制，设计评审取消。” cap 的第 6 次启动拒绝**仅代码评审**；**design 第 6 次调用不被拒**、照常触达 LLM。
- **计数照增（两轴正交）**：design 实例的轮次**继续递增**——round2/3 收敛提示词轮换与轮次显示照常——豁免的只是“第 6 次拒绝”这一轴。
- **guard 不受 design 轮次干扰**：completion guard 的轮次上限**只认 open 的代码评审实例**（无 → 0）——design 实例的轮次（含其结算写的镜像）不参与代码 guard 判定——design 轮次高位不会误挡代码评审推回。
- 动机：cap 原防“改 A 报 B”无限拉锯；round3+ 只查修复声明的收敛模式已根除发散空间（病根已换）——design 的 cap 是旧病因残留。

## 4. 收敛会话与证据纪律

### 4.1 stale-context 加固

history 中旧消息嵌有历史 diff / 旧文件内容，模型可能把“已删除的旧代码”误判为当前状态（曾连续两轮报告已修复的旧问题——引用行号为修复前状态）。防护：

- ROUND2/3 的 system prompt 与 follow-up 用户消息均声明 **STALE-CONTEXT WARNING**：更早消息中的任何内容都是历史快照——**视为过期——只有本轮 `read` 的结果描述当前状态**。
- **round2+ follow-up 刻意零 git**：不注入 diff / 状态快照——git diff 曾误导复评（已提交的修复不会出现在 diff 里 → 模型把“无变化”读成“无修复”）——验证只靠 `read`。
- **证据强制**：任何 “Unfixed” / “New” 判定必须附 `read` 验证的 `file:line` 证据（引本轮 read 的确切行内容——行号本身不是证据）；无证据的判定视为未验证、不予接受。机械校验见 §5。

### 4.2 fresh session——每轮全新会话

- **round 2+ 不复用 round 1 的会话数组**：每轮构建全新 `[system(轮次提示词), user(对象声明块 + prior 全文 + agent 响应表 + 指令)]`。
  **旧 read 输出从物理上不在上下文里**——它是复评误报的最大锚定源（模型引用旧文件内容而非重新 read），也是 token 浪费源（大文件全文滞留触发频繁压缩）。“保留探索上下文”与证据规则（只有本轮 read 才算数）天然冲突——已废除。
- 评审失败不产生可泄漏的半成品上下文（每轮 fresh，天然免疫）。
- 会话延续字段保留（初始化兼容）但**不再作为会话延续读取/写入**；每 run 重置。

### 4.3 prior 全文注入——唯一完整验证清单

- 现行态 = round 2+ 用户消息注入**上一轮评审的完整原文**（模型自行理解表格与结论——无表头/短语硬解析）。
- **为什么必须注入**：prior 是**唯一完整的验证清单**——agent 响应表只覆盖 agent 选择回答的问题，agent 遗漏/回避的问题若无 prior 会在收敛中**静默通过**（验证目标被 agent 自我声明绑架）。
  当年移除的理由已被后续防线化解：**复述** → host-verified citations 机械拦截 + fresh session 排除旧 read 数据；**跨主题污染** → 确定性轮次判定；**token** → 注入的是评审原文而非解析表。
- **消息形态（单源）**：
  - `## Round N — Verify Prior Table + Flag New Issues`（round 2）/ `## Round N — Strict Verification`（round 3+）——声明本轮 system prompt 已收窄范围；
  - `## Prior Review Output (verify every item it raises)`——上一轮评审完整原文；
  - `## Agent Response (fix claims — reference only)`——agent 响应表（**聚焦参考**——**不再是验证清单**；格式漂移或缺失时 fallback 文本兜底，不驱动控制流）；
  - `## Instructions`——编号指令：逐项 read 验证 prior 每项 / STALE-CONTEXT WARNING / 无 git / 必须 read 当前文件再判定 / **证据规则**（引本轮 read 确切行内容——无 fresh 引证 = unverified 不受理）/ round 2 可标修复引入的明显新问题（crashes, data loss, logic errors——非 style）/ round 3+ **“Do NOT look for new issues”**。
- **只存“评审形态输出”作 prior**：评审完成时宿主只在该输出像评审时（markdown 表格行或足够长正文）存为 prior——空回复 / 纯工具进度不得成为 round2+ 的验证清单。同步路径存于 agent 状态；实例路径存于 run 实例；子代理内的 advisor 调用**不写父 agent 状态**。
- **已知边界（legacy 路径）**：legacy 收敛路径不应用转义——**直接外部调用方须自行转义**（parent 对话引用字面转义序列时有服务端 400 风险）；正常流已转义，无风险。

## 5. host-verified citations——机械证据校验

提示词的证据规则无法由 LLM 自我强制——模型可以声称读过而实际复述 prior 表。**宿主侧机械校验是最后防线**：

- 评审结果拿到后解析其中的 `file:line: content` 引用（后缀白名单（源码/配置/文档扩展名，防 URL 假阳性）+ 内容长度下限 + 排除反引号引文）。
- 逐条磁盘比对：该文件该行的实际内容是否**包含**引用内容；引用路径有**路径围栏**（realpath 解析后必须仍在 cwd 内——LLM 生成的路径不可信，防越界读泄漏配置）。
- 验证报告追加到评审结果：`[host-verified] N/M citations match current file state.` + 不匹配清单（至多 10 条，含失败原因）。
- 父 agent（决策方）与用户看到验证报告后，对不匹配的 “Unfixed” 判定自动降权——**未通过校验的引用不能支撑打回**。效果：模型编造 / 复述旧证据的成本从“零”变为“必然被标记”。
- **候选根派生（与`路径围栏`配合；实现契约见 `design/ADVISOR-GUARDS.md`）**：按声明路径派生候选根（工作区根 / 声明仓根 / 声明文件目录），逐引文按候选顺序试解析；失败原因三分（无候选文件存在 / 内容不符 / 越围栏）。

## 6. 评审触发与失效（guard 推回）

### 6.1 触发范围：只跟代码修改绑定

宿主曾对**任何副作用工具**（bash / git 等）重置“评审已覆盖”标记——导致“评审通过后仅用 bash 读日志 / 删临时文件”也再次触发评审推回（实测：round 2 零问题后仍被要求 round 3）。用户否决扩散（“修改代码以后触发评审，为什么要扩散到 bash 这一类的东西？”）。现行：

1. **文件写工具**（write / edit / insert_after / apply_patch / delete / hashline_edit）调用 → 重置“评审已覆盖”+“已验证”标记（评审/验证确实过时——文件状态变了）。
2. **非写文件副作用工具**（bash / git）→ **只重置 verify**（其 diff / 状态快照可能过时），**不重置评审标记**——bash 被系统规则禁止写文件，合规 agent 的 bash 不会改变被评审代码。
3. 由此“评审 → 只读/环境操作 → 完成”不再触发多余评审轮；“评审 → 再次改代码 → 重新评审”保持。

**残余边界（接受）**：违规 agent 用 bash 改代码文件 → 不进触碰集 → 内容判定检测不到 → 评审漏过。这是“bash 写文件被禁”规则下不存在的场景（规则与机械判定的一致性优于对违规行为的兜底）。

**内容级判定（guard 共用单源）**：产品代码树下的任何文件都是代码（含提示词档——无条件）；产品树**外**的文档文件与临时件**不算**代码修改；无已知路径的修改保守视为代码（兜底）。

### 6.2 失效语义与 completion guard 公式

**“评审失效”不是独立机制，是 guard 条件的状态转换**。guard 的唯一依据是“是否存在未评审的代码修改”：

```js
// 完成时推回判定（顶层、guard 开启、非工程模式）
if (!pending                          // 异步评审在飞/排队 → 未决不算未评审 → 不推回
    && agent._mutatedThisRun          // ① 本 run 改过代码
    && !agent._calledAdvisorThisRun   // ② 修改尚未被评审覆盖
    && hasCodeMutations(agent)        // 内容判定——产品代码全算，文档/临时件排除
    && advisorPushbacks < MAX_ADVISOR_PUSHBACKS
    && effectiveAdvisorRound(agent) < MAX_ADVISOR_ROUNDS) { 推回 }
```

- **② = “评审已覆盖”位**：评审完成置真（同步：工具结果记账；异步：非陈旧结算）——表示“当前代码状态已被评审覆盖”；**再次修改代码**置回假——这就是“失效”。没有 ②，修改事实永不消除 → guard 无限推回、run 永不完成；没有失效重置，评审后修复的问题无人验证 → 收敛断裂。**失效是收敛循环（评审 → 修复 → 再评审 → … 直到 0 🔴 或轮次 cap）的引擎**。
- **guard opt-in**：默认关闭（advisor 工具本身永远可用，guard 只控制完成时是否推回）；**工程模式永不启用**（工程模式的评审义务由 token / 门禁链机械强制）；仅顶层 run。
- **异步交互**：评审启动后发生文件写 → 结算判 **stale** → 不置“评审已覆盖”、不签 token → guard 继续推回发起新评审；非陈旧的代码评审结算 → 置位。
- 子代理代码合并（eng-coder 返回）→ 合并进父侧修改追踪并使先前 verify / advisor 标记失效——父代理无法通过“把改动委托给 eng-coder”跳过代码评审。
- 新 run → 重置为未评审（新评审周期）→ 按条件判定。

### 6.3 触发路径清单

| 事件 | 评审失效？ | 推回？ |
|---|---|---|
| 文件写工具改代码 | 是 | 是（guard 综合判定） |
| 子代理代码合并 | 是 | 是 |
| bash / git（非写文件副作用） | 否 | 否（只失效 verify——快照可能过时） |
| 只读工具（read / grep / lsp / glob） | 否 | 否 |
| 写文档 / 写临时文件 | 状态位翻转但内容判定过滤 | 否 |
| verify / task / checklist / question / plan 等 | 否 | 否 |
| 异步评审在飞（池内 / 排队） | 不推回（未决 ≠ 未评审）；陈旧结算后恢复推回 | — |
| 新 run（新任务） | 重置为未评审（新评审周期） | 按条件判定 |

## 7. 响应表纪律（Action 四值）

纪律层的响应表纪律（**纯提示词纪律——不加机械解析**——响应表仍是“聚焦参考”，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取，保持逐字。每 issue 一行；`#` = advisor 的 issue 编号（**round2+ 用原编号**——不重编号）。
2. **`Action` 四值封闭词表**：`Fixed`（**已落地**——已改代码/设计）、`Dispatched`（**修正轮在途——尚未落地**）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴，**不得用于静默丢弃真缺陷**）。`Detail` = 改了哪、在哪（file:line），或证据 / 理由。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码 / 设计——“之前就有”“不是我引入的”永远不是跳过修复的理由；问题何时出现不决定它该不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**（父代理不直接写实现代码）；一个 🔴 既不修也不 surface = **阻断收敛**。
5. **收口时序**：见 §7.1。

### 7.1 修正轮 ⇄ 用户批准 时序

- **链行节点**（四面同文插入）：`… 提醒用户发起设计评审（发起权在用户）→ **评审 pass 后逐条裁决** →（如需修正）**修正轮落地并经核验** → 用户批准 → spawn eng-coder 实现。`
- **时序规则**：评审 pass 后逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），**修正轮落地并经核验后，才可请求用户批准**；**修正轮在途时不得请求批准**——在途状态只作汇报，汇报不携带批准请求。
  **修正轮边界**：只落评审发现与裁决直接导出的修正——**不得夹带新语义 / 新范围**；夹带即新内容，须显式摆给用户单独定。
  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。
- **落点**：四个工程纪律档副本（两端产品源 + 中文权威镜像）——就地把「三选一」句替换为四值文本，时序 bullet 紧随裁决表条块末行之后。

## 8. 需求契合度检查（requirement fit）

评审的传统维度（正确性 / 安全 / 一致性 / 完整性）只检查“代码对不对”，不检查“做的是不是用户要的”——实现者可以把功能做对但做错方向（实测：声称“交替显示修复完成”却让工具调用整体消失；声称“记录里有工具调用”却把清单附加在尾部、时序丢失）。需求-实现偏差没有被任何旧评审维度覆盖。

- **ROUND1 提示词含此评审维度**——核对实现与用户诉求的差异，两个对照：
  - (a) **声称 vs 实现**：实现者陈述的目的（对话背景 / 响应表 / 提交说明）对照实现实际行为——“声称做 X 却给了 Y”是偏差；
  - (b) **期望 vs 形态**：需求文档（项目指南指向）与用户明确期望对照交付形态——“要 A 却给了 B”是偏差。
- 偏差按影响标 🔴/🟡，Issue 中写明：用户要什么、实现给什么、差在哪。**证据约束**：判断必须引用证据（用户原话或实现行）——无证据的“需求偏差”至多标 🔵——与 citations 机械校验共用同一证据规则。
- **需求文档是主参照**：评审 user 消息注入项目指南块（预算 = max(8KB, 评审模型上下文 × 5%)；注入段标注项目根），评审者第一步必须读它并按指引读需求文档——“用户需求在文档里，对话背景只是补充”（对话背景只取最近 3 轮）；无项目指南档时诚实降级（明说以对话背景为准）。
- **项目根定位**：项目根是工作目录下的**子目录**——从评审范围第一个文件所在目录**在 cwd 边界内**向上找最近的项目指南档（monorepo：被评审文件归属的子项目就是项目根）；都找不到 → 诚实降级。**不向上越过 cwd**。

## 9. 受影响文件行数标注核查（设计评审维度）

> 权威链（指环单向化）：行数标注**义务**与档位判据 = 纪律层（文档规范节 + 代码结构判据节）；核查维度行为语义 = 本节；执行实现 = 设计评审提示词的对应维度。

advisor design review 标准维度补一条：

- **受影响文件行数标注核查**：设计文档「受影响文件」表行数标注是否齐全——每个将修改的源 / 测试文件标注 `当前行数 + 预计增量`（预计 ≤±N 或“结构不变”；纯 `.md` 文档豁免）+ 超档拆分规划是否在。
- **标注数值抽查**：抽样核实标注的行数与磁盘一致；含 **≥300 单体函数触及抽查**——**函数档是第一判据**：文件 ≤500 行而内含 300+ 行单体函数 = 仍未达标；文件档 >300 主动审视 / >500 必须拆——**封口语义，无豁免通道**。

## 10. 工程模式集成（收敛相关）

工程模式承诺「Advisor is mandatory at both design and code gates」。机械强制链的**完整机制权威 = `design/ENGINEERING-MODE.md`**——本档只留收敛相关语义：

- **Design gate**：spawn eng-coder 时 token 校验 + 写文件门禁——确保设计评审先行；design 评审通过（凭证回显）时同步置位。凭证机制（多槽 / 消费 / TTL）权威 = `design/ENGINEERING-MODE.md`。
- **Code gate**：eng-coder 返回后子代理改动合并使父代理 guard 触发（§6.2）——无法绕过代码评审。
- **guard 在工程模式关闭**——评审义务由上述机械链承担，不靠 completion 推回。
- **轮次与 cap**：per-review 实例；cap 仅 code——design 轮次照常递增、第 6 次不被拒（§3.2）。
- **信任模型边界**：机械闸作用于 eng-coder 子代理；父代理本身不受写文件门禁约束（需写 docs/），其“设计先行、委托实现、实现后 code review”靠工程提示词约束。

## 11. 配置

- 项目级 `.thincoder/advisor.md`：评审准则覆盖——存在则替换内置默认准则（正确性 / 安全 / 一致性 / 完整性 / 可维护性五维）；项目可在覆盖文件里追加规则（如本仓的文件尺寸档 >300 advisory / >500 critical）。
- `config.json`：`advisor.provider` / `advisor.model` 可选覆盖主 agent 的 provider / model；`advisor.guard` 为 completion guard 开关（默认 false）。
- **轮次提示词硬加载**：四份提示词文件缺失即抛错（防静默降级到劣质内置 prompt）。

## 12. 验证

评审收敛行为（轮次提示词替换、prior 原文注入、确定性轮次判定、cap 仅 code——第 6 次拒 + design 豁免正向探针、guard 推回判定、fresh session、host-verified citations、对象声明块注入）的回归测试按测试基建分层执行（`design/TESTING.md`：快层 / 全量链终父侧——含慢测层）。
提示词锚（“Do NOT look for new issues”、证据规则句等）由各端 prompts 内容断言防回退。

**验收标准（逐条回指需求）**：

| # | 验收标准（机器可验） | 回指 |
|---|---|---|
| A-AC1 | 轮次表与提示词选择：round1 全量 / round2 验 prior 为主 / round3+ 只验 prior；判定无 LLM 输出解析 | 轮次定义 |
| A-AC2 | cap：第 6 次代码评审启动被拒且不消耗 LLM；design 第 6 次照常触达 | cap |
| A-AC3 | design 轮次不干扰代码 guard 判定（open 代码实例唯一来源） | cap 豁免 |
| A-AC4 | fresh session：round2+ 不复用 round1 会话数组；旧 read 输出不在上下文 | 会话隔离 |
| A-AC5 | prior 注入：round2+ 用户消息含上轮完整原文；非评审形态输出不作 prior | prior 注入 |
| A-AC6 | citations 机械校验：`[host-verified] N/M` 报告在位；不匹配清单 ≤10 条；围栏生效 | 证据纪律 |
| A-AC7 | 触发范围：文件写工具与子代理合并 → 失效 + 可推回；bash / git → 只失效 verify；只读 → 否 | 触发范围 |
| A-AC8 | guard 公式六条件齐备才推回；opt-in 且工程模式关闭 | guard |
| A-AC9 | 响应表 `Action` 四值封闭；`Dispatched` 行在批准请求前须收敛为 `Fixed` | 响应表 / 时序 |
| A-AC10 | 需求契合度维度在位（声称 vs 实现 / 期望 vs 形态）；证据约束（无证据至多 🔵） | 需求契合 |
| A-AC11 | 行数标注核查维度在位；函数档为第一判据 | 行数核查 |

## 13. 不并项与历史沿革

| 面 | 内容 | 何故不并 |
|---|---|---|
| 逐批设计记录（原 §13–§18 的批次小节） | 每批的问题陈述 / 选型 / 受影响文件 as-of 快照 / 决策表 / 修正轮注记 | 一次性批次材料——契约已提炼入本档 §7.1 / §3.2 与兄弟档 `design/ADVISOR-GUARDS.md`；流水归 `docs/batches/` + git 历史 |
| 逐批用例与 AC 编号集（T-CG* / T-SG* / T-EST* / L-* / AC-CG* / AC-B4-*） | 批次验收明细 | 批次材料；机制级不变量已并入本档 §12 |
| 变更记录流水（历史折叠） | 逐条批号与落点 | 时序日志——归 git 历史 |
| 机制演进沿革 | 「cap 引入 → design 并入共享预算 → design 重获豁免」的反转史 | 已收为一句（§3.2 动机）；逐轮反转流水不作现行依据 |
| 受影响文件清单（行数 as-of） | 逐文件行数与增量 | 快照（as-of 数字不作契约） |
| 状态行与落笔流水 | 「实现未启动 / 待 coder / 已落」类状态句 | 运行时状态 |

## 14. 体量与拆分规划（R24a）

**实测行数**：本档 **≈330 行**——超 300 软线。
**拆分规划（登记——触发 = 再度增厚至 >450）**：候选切面 = ①**轮次与 cap**（§1–§3）②**会话 / 证据 / guard**（§4–§6）；切点零交叉（§4 引 §2 轮次判定，以节名互挂）。**当前不拆**（≤500）。
**本次迁移的切分理由**：原 1570 行超硬限；按「收敛协议本体 ⇄ 边缘守卫」切为两档——读者面 = 「评审几轮、怎么收敛」与「评审链在边界上怎么不失守」。

## 变更记录

- 2026-09-15（**迁移批 · 第 4 批 · 大档拆分实迁** · eng-designer）：自 `thincoder-cli/docs/design/ADVISOR-CONVERGENCE.md`（1570 行）切出并重建——落点判据 = `design/DOC-SYSTEM.md` §5.1 P1；
  承载原 §1–§12（收敛协议本体）+ §13 契约一/二（响应表四值 + 修正轮⇄批准时序）；§14–§18 的守卫契约切出为 `design/ADVISOR-GUARDS.md`；坐标全量改现状路径。
