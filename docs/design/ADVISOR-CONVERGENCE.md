# Advisor 评审收敛协议（Convergence Protocol）——VS Code 独立实现

> 板块：评审收敛——ThinCoder VS Code 的 advisor 评审收敛机制：定义"审查 → 修复 →
> 复审"循环如何收敛（全绿通过 / 有限轮次机械终止）。
> 与 `ADVISOR-CONVERGENCE（CLI 仓·设计）` 同名文档对应同一机制板块——各端独立
> 实现，内容以本端代码为准（本端 = `thincoder-vscode`；DOC-REORG-VSC）。
> 判定铁律 R1-R7 的**逐字源 = 本端 `src/prompts/advisor-round{1,2,3}.md` 与
> `advisor-design.md` 尾部的 "Judgment Rules" 块**（四份逐字一致，注入全部轮次提示
> 词）；工程模式集成（token/门禁/guard 开关/信任模型）权威 = ENGINEERING-MODE.md——
> 本文件只保留收敛相关语义与指针。

## 1. 目标

独立评审必须在"审查 → 修复 → 复审"循环中**收敛**：要么确认全部问题已修复
（passed），要么在有限轮次内机械终止。历史病根：advisor 反复执行、每轮全量扫描都报
新问题、永不收敛（修复前 system prompt 冻结在 ROUND1）；复评引用旧文件状态、把已修复
问题反复报回。以下机制均为这些病根的修复产物：

- **轮次衰减**：system prompt 按轮次替换——ROUND1 全量、ROUND2 验 prior 为主、ROUND3+
  严格只验 prior。
- **机械 cap**：`MAX_ADVISOR_ROUNDS = 5`（**仅代码评审**），第 6 次启动机械终止、不消
  耗 LLM；design 评审豁免 cap（轮次照常递增）。
- **会话隔离 + 证据机械校验**：每轮 fresh session（旧 read 数据物理不在上下文）+
  host-verified citations 机械比对磁盘。
- **确定性状态**：轮次/失效/重置全部由运行状态位决定，不解析 LLM 输出。

## 2. 实现载体（本端文件）

- `src/prompts/advisor-round1.md` / `advisor-round2.md` / `advisor-round3.md` /
  `advisor-design.md`——轮次提示词（**硬加载**——缺失即抛错，防静默降级）。
- `src/advisor/main.mjs`——system prompt 轮次选择（`buildAdvisorSystemPrompt`）、
  round2+ follow-up 构建（`buildAdvisorFollowUp`）、评审会话组装
  （`prepareAdvisorMessages`）。
- `src/advisor/run.mjs`——组装入口与机械 cap（`MAX_ADVISOR_ROUNDS` / `buildCapMessage` /
  `runAdvisorReview` / `resolveAdvisorProvider`）；**第 12 批拆分**：工具循环与墙/提示接线在
  `src/advisor/loop.mjs`、上下文限额/压缩定锚与守卫族（谓词族 / 提示文案 / 结构化尾）在
  `src/advisor/compaction.mjs`——run.mjs 保持 re-export 面（import 兼容零改；行数见 §13.5）；**第 15 批增补**：设计评审启动断言（`ADVISOR_LAUNCH_REFUSAL_PREFIX` + 拒绝报告——§14.3）；**第 26 批增补**：评审上下文预算跟随模型窗口（`advisorContextBudget`——120K 常量退场——本档 §15）。
- `src/advisor/convergence.mjs`——round2+ 收敛消息体单源（`buildConvergenceBody` /
  `buildConvergenceInstructions`）。
- `src/advisor/messages.mjs`——user 消息构建（`buildAdvisorUserMessage` / review-object
  declaration / 文档清单注入）、`src/advisor/citations.mjs`——host-verified citations
  机械校验、`src/advisor/repos.mjs`——doc-file 分类（isDocFile）。
- `src/agent-tools/advisor.mjs` / `advisor-async.mjs`——advisor 工具（sync 执行 / async
  后台池 / design token 入槽）；`src/agent/run-stages.mjs`——completion guard 推回
  （`maybeGuardPushbacks`）；**第 15 批增补**：`inflightDesignReviewConflict`（D5 冻结窗口冲突
  helper——§14.4）+ 设计评审 ack 冻结句 + 启动拒绝结算消费（§14.3）；**群 B 增补**：结算面拒发不记账（§17.1）+ 注入预算接线（`AGENT-LOOP.md §16`）。
- `src/agent/execute-tools.mjs`——工具批执行与前置门禁 `preGateBlocked`（planMode / 工程设计闸 /
  **D5 冻结窗口预闸**——第 15 批 §14.4）。**群 B 增补**：file_ops 冻结拦 / 记账扩面（§17.2）。

## 3. 轮次定义与判定

### 3.1 轮次表

| 轮次 | system prompt | 检查范围 | 新问题权限 |
|---|---|---|---|
| Round 1 | `advisor-round1.md`（代码）/ `advisor-design.md`（设计） | 全量审查（对象声明 + 范围文件；先读 Project Guide 指向的需求文档） | ✅ 任意问题，建立 issue 表 |
| Round 2 | `advisor-round2.md` | 以验证 prior 表为主 | ⚠️ 仅明显可见且导致 crashes / data loss / logic errors 的新问题 |
| Round 3–5 | `advisor-round3.md` | 严格只验证 prior 表 | ❌ 禁止（"Do NOT look for new issues"） |

- **评审对象锚**：round1 与 round2+ 的用户消息都以机械生成的 **Review-object
  declaration** 块开头（`{type, target, status, reason, exclude}`——每轮注入）；
  评审员不推断"评谁/为什么评"。块生成 = `messages.mjs` `buildReviewObjectDeclaration`，
  注入点 = `run.mjs` `injectObjectDeclaration`（评审消息构建后一个机械点覆盖全部轮次）。
- **design 评审**（`reviewType="design"`）与代码评审共用收敛提示词轮换：round 1 用
  `advisor-design.md`（设计评审标准 + **Approval Signal**——无 🔴 时回显
  `[DESIGN-TOKEN:…]` + designId 双值逐字）；round 2/3+ 用 `advisor-round*.md` 收敛提示
  词（验证 prior 表、证据强制）。**cap 仅代码评审**（§4.2）：design 轮次继续递增（收
  敛提示词轮换 + 轮次显示照常），第 6 次调用不被 cap 拒绝。机制权威 =
  ENGINEERING-MODE.md §4。

### 3.2 轮次映射与 off-by-one（确定性，无解析）

- `_advisorRound` = **已完成的** advisor 评审尝试次数（sync 工具调用完成后记账——含
  失败/错误返回；拒发——cap/无范围——不计）。async 实例经 `rv`（per-review instance
  上下文 `{round, priorOutput}`——多评审并行隔离）解析，不读全局。
- round1 与 round2+ 的**语义判定确定性**：`_advisorRound > 0` **且**存有上一轮评审输
  出 → round 2+；否则 round 1（重启后 `_advisorRound = 0` → 保守全量重评）。**无解析**：
  不解析 prior 表头、不匹配 all-clear 短语。
- 提示词选择（`buildAdvisorSystemPrompt`）：round 1 → ROUND1；round 2 → ROUND2；
  round ≥ 3 → ROUND3。实现用已完次数推导**即将进行**的轮次号（相差 1，勿混淆）。
- **重置语义**：无 prior 且本 run 未改代码（`!_mutatedThisRun`）→ 轮次归零、开新评审
  周期（各自获得完整预算）；本 run 改过代码 → **保留轮次**（completion guard 必推
  回，轮次必须继续向 cap 推进——任何改了代码的循环不得靠归零重置逃逸预算）。

### 3.3 工具轮预算

提示词自报工具轮预算：round 1 = **20** 轮（里程碑 6/10/17——三分之一/一半/接近上
限）；round 2/3 = **15** 轮（8 轮未验完即收尾兜底）。机械硬帽 **100 工具轮**
（`MAX_ADVISOR_TURNS`——`run.mjs` 工具循环止损——type-agnostic，design 评审同受；
死循环时机械打断）。注意：提示词预算与机械 100 轮是不同机制，不同步。

### 3.4 通过/阻断判定

- **通过 = 无未决 🔴**：全部 🔴 已解决、仅剩 🟡/🔵 → 评审通过（🟡/🔵 不阻断
  approval——照列不隐藏）。任一 🔴 未决 → 不得声称 passed。
- **宿主判定面**：评审的"通过/不通过"**不是宿主控制流输入**——guard 只消费"评审发
  生"（`_calledAdvisorThisRun`）+ 轮次预算；是否通过由主 Agent 读评审输出自行判断。
  唯一机械例外 = design 评审的 token 回显即通过信号（凭证入槽/门禁解锁）。

## 4. 机械轮次上限（cap）

### 4.1 cap 语义与执行点

`MAX_ADVISOR_ROUNDS = 5`（`run.mjs`）。**第 6 次 advisor 启动**（该实例 round ≥ 5）
**直接返回终止消息、不消耗 LLM**——评审根本不启动。执行点：

1. **工具层预检**（`agent-tools/advisor.mjs`——sync/async 共用启动前检查）——cap 拒
   绝只标记拒发，不置 called、不耗轮次（guard 因此在 cap 后自然停止推回）；
2. **`runAdvisorReview` 内防线**（`run.mjs`——legacy/直接调用方防绕）；
3. **completion guard 的 `round < MAX` 项**（§6）——到 cap 后不再推回。

cap 消息（`run.mjs`）：`Advisor: convergence cap reached after 5 rounds.` + 列出来自
prior 的未决问题（或 `All prior issues appear resolved.`）+ 三个选项（接受当前状态继续
/ 手动 read/grep 复查 / 新会话重置）。**5 轮后不再打回**——cap 消息是收敛失败的出口，
不是又一轮评审。

**无范围早退在 cap 之前**：代码评审无 review scope（无 paths/documents 且
`_touchedFiles` 为空）时工具层提前拒发（"no review scope specified"）——保证诊断信息
准确（无改动文件时不误报成收敛失败）。

### 4.2 design 豁免 cap（2026-09-07 用户裁定）

- cap 的第 6 次启动拒绝**仅代码评审**（`reviewType !== "design"`）；**design 第 6 次
  调用不被拒**、照常触达 LLM。
- **计数照增（两轴正交）**：design 实例的轮次**继续递增**——round2/3 收敛提示词轮换
  与轮次显示照常——豁免的只是"第 6 次拒绝"这一轴，不是轮次预算。
- 动机：cap 原防"改 A 报 B"无限拉锯（2026-08-01）；round3+ 只查修复声明的收敛模式已
  根除发散空间——design 的 cap 是旧病因残留。

## 5. 收敛会话与证据纪律

### 5.1 stale-context 加固

- ROUND2/3 的 system prompt 与 follow-up 用户消息均声明 **STALE-CONTEXT WARNING**：
  更早消息中的任何内容都是历史快照——**视为过期**——只有本轮 `read` 的结果描述当前
  状态。
- **round2+ follow-up 刻意零 git**：不注入 diff/状态快照——git diff 曾误导复评（已提
  交的修复不会出现在 diff 里 → 模型把"无变化"读成"无修复"）——验证只靠 `read`。
- **证据强制**：任何 "Unfixed" / "New" 判定必须附 `read` 验证的 `file:line` 证据（引
  本轮 read 的确切行内容——"Line numbers alone are NOT evidence"——行号可能伪造或陈
  旧）；无证据的判定视为未验证、不予接受。机械校验见 §5.3。

### 5.2 fresh session + prior 全文注入

- **round 2+ 不复用 round 1 的会话**：每轮构建全新 `[system(ROUND2/3), user(对象声明
  块 + prior 全文 + agent 响应表 + 指令)]`。旧 read 输出（上轮读到的文件全文）从物理
  上不在上下文里——复评误报的最大锚定源 + token 浪费源。"保留探索上下文"与证据规则
  天然冲突——已废除。评审失败不产生可泄漏的半成品上下文。
- **prior 全文注入**：round 2+ 用户消息注入**上一轮评审的完整原文**（模型自行理解表
  格与结论——无表头/短语硬解析）。prior 是**唯一完整的验证清单**——agent 响应表只覆
  盖 agent 选择回答的问题，遗漏问题若无 prior 会在收敛中静默通过。
- **消息形态**（`convergence.mjs`——正常流与 legacy 路径单源）：`## Round N — Verify
  Prior Table + Flag New Issues`（round 2）/ `## Round N — Strict Verification`
  （round 3+）+ `## Prior Review Output (verify every item it raises)`（完整原文）+
  `## Agent Response (fix claims — reference only)`（响应表——聚焦参考，不驱动控制
  流）+ `## Instructions`（编号指令：逐项 read 验证 / STALE-CONTEXT / 无 git / Evidence
  rule / round 3+ **"Do NOT look for new issues"**）。
- **只存"评审形态输出"作 prior**：仅当输出像评审（markdown 表格行或 ≥200 字正文——
  `looksLikeReview`）才存为 prior——空回复/纯工具进度不得成为 round2+ 的验证清单。
  sync 存 `agent._lastAdvisorOutput`；async 实例经 runner 记入 `_advisorRuns`（并发隔
  离——不写全局）。

### 5.3 host-verified citations——机械证据校验

提示词的证据规则无法由 LLM 自我强制——模型可能声称读过而实际复述 prior 表。**宿主侧
机械校验是最后防线**（`citations.mjs`）：

- `runAdvisorReview` 拿评审结果后解析其中的 `file:line: content` 引用（正则：文件扩展
  名白名单 + 内容 ≥4 字符 + 排除反引号引文——防 URL 假阳性）。
- 逐条 `readFileSync` 磁盘比对：该文件该行实际内容**包含**引用内容；引用路径有**路径
  围栏**（realpath 解析后必须在 cwd 内——LLM 生成的路径不可信，防越界读泄漏配置）。
- 验证报告追加到评审结果：`[host-verified] N/M citations match current file state.` +
  不匹配清单（至多 10 条，含失败原因）。
- 父 agent（决策方）对不匹配的 "Unfixed" 判定自动降权——**未通过校验的引用不能支撑
  打回**。

## 6. 评审触发与失效（guard 推回——run-stages.mjs）

guard 的唯一依据是"是否存在未评审的代码修改"——**失效 = 状态转换**，不是独立机制。

```
// maybeGuardPushbacks（收尾时，depth-0、advisor.guard===true、非工程模式）
if (!advisorReviewInFlight(agent)     // async 评审未决 → 未决不算未评审 → 不推回
    && agent._mutatedThisRun          // ① 本 run 改过代码
    && !agent._calledAdvisorThisRun   // ② 修改尚未被评审覆盖
    && hasCodeMutations(agent)        // 内容判定——src/ 下全算，文档排除
    && advisorPushbacks < MAX_ADVISOR_PUSHBACKS
    && (agent._advisorRound || 0) < MAX_ADVISOR_ROUNDS) { 推回 }
```

- **触发范围只跟代码修改绑定**：`FILE_MUTATORS`（write/edit/insert_after/apply_patch/
  delete/hashline_edit）调用 → 重置 `_calledAdvisorThisRun` + `_verifiedThisRun`；非写
  文件副作用工具（bash/git）→ **只重置 verify**（快照可能过时），**不重置评审标记**
  ——bash 被系统规则禁止写文件，合规 agent 的 bash 不会改变被评审代码。由此
  "评审 → 只读/环境操作 → 完成"不再触发多余评审轮；"评审 → 再次改代码 → 重新评审"
  保持。
- **② = `_calledAdvisorThisRun`**：评审完成置 `true`（sync：工具结果记账；async：非
  陈旧 settle）；再次修改代码（FILE_MUTATORS）置回 `false`——这就是"失效"。没有失效
  重置，评审后修复的问题无人验证 → 收敛断裂。**失效是收敛循环（评审→修复→再评审
  →…直到 0 🔴 或 5 轮 cap）的引擎**。
- **guard opt-in**：`advisor.guard === true`（默认 OFF——advisor 工具本身永远可用，
  guard 只控制完成时是否推回）；**工程模式永不启用**（工程模式的评审义务由 token/门
  禁链机械强制——ENGINEERING-MODE.md）；仅 depth 0。
- **async 交互**：评审 launch 后发生 FILE_MUTATORS → settle 判 **stale** → 不置
  `_calledAdvisorThisRun`、不签 token → guard 继续推回发起新评审；非陈旧 code 评审
  settle → 置 `_calledAdvisorThisRun`。
- 子代理代码合并（`mergeChildMutations`）→ 合并进父 `_mutatedThisRun`/`_touchedFiles`
  并使先前 verify/advisor 标记失效。

## 7. 响应表纪律（Action 四值）

`discipline-normal.md`（普通模式）/ `persona-engineering.md`+`discipline-engineering.md`（工程模式——父代理——旧 engineering.md 退役后宿主）的响应表纪律（纯提示
词纪律——**不加机械解析**——响应表仍是"聚焦参考"，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取
   （`extractAgentResponseTable`）；round2+ 用 `Orig#`（原编号，不重编号）。
2. **`Action` 四值封闭词表**：`Fixed`（**已落地**——已改代码/设计）、`Dispatched`（**修正
   轮在途——尚未落地**）、`Not an issue`（技术反驳，附证据）、`Deferred`（承认但不修，附
   理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴，不得用于静默丢弃真缺陷）。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码/设计——问题何时出现不决定它该
   不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**；一个 🔴
   既不修也不 surface = 阻断收敛。
5. **收口时序**（评审后）：裁决表落定后，修正轮 ⇄ 用户批准的先后见 §12——`Dispatched`
   行必须在批准请求前逐条收敛为 `Fixed`。

## 8. 判定铁律 R1-R7（逐字源 = 本端 4 份 advisor 提示词尾 "Judgment Rules" 块）

四份提示词（`advisor-round{1,2,3}.md` + `advisor-design.md`）尾部各注入一段逐字一致的
**Judgment Rules** 块——严重级判定内容（R1-R7）。语义归纳（逐字以提示词块为准）：

- **R1** 文档矛盾/状态不一致 → 🟡（父侧文档层报出即修——非 🔴；例外：同一机制两处不
  同描述 = Document ownership 🔴）。
- **R2** 实现偏离设计（验收未达/静默简化）→ 🔴（必须修）。
- **R3** 裁定（文件尺寸等债）→ 🟡/🔵，不升级、不重诉。
- **R4** 脆弱测试（wall-clock/序列化形状依赖）→ 🔵 + 建议确定性。
- **R5** 范围协调（父侧 TODO）→ 🟡 "coordination item"。
- **R6** 测试 seam（mock 内部工具集需模块级 setter/参数覆盖 + `??` 默认回退；默认
  null 保生产行为不变；finally 恢复）。
- **R7a-e** 文档状态矛盾 → 🟡 报出不改（只读）；机制级矛盾除外（= 🔴）；内容矛盾 →
  高层赢（D > F > 记录）；数值漂移/TODO 未勾/卫生 → 🔵；语义悬空 → 🟡 报设计缺口；
  **R7e** 从不因文档状态矛盾卡 "pass"——矛盾 = 🟡 报出即过（机制级描述不一致除外 = 🔴）。

铁律与轮次行为**正交**：本文件管轮次衰减/收敛上限（轮次行为），铁律管严重级怎么定
（判定内容）——铁律不改变轮换行为（Round 2/3 的新问题权限不变）。

## 9. 需求契合度检查（requirement fit）与自定义标准

- **ROUND1 提示词新增评审维度**：核对实现与用户诉求差异——(a) 声称 vs 实现；(b) 期望
  vs 形态。偏差按影响标 🔴/🟡；证据约束（用户原话或实现行）——无证据的需求偏差至多
  🔵。需求文档是主参照（Project Guide 指向）。
- **自定义标准**：项目级 `.thincoder/advisor.md`——存在则替换内置默认准则（正确性/
  安全/一致性/完整性五维；`history.mjs` 加载）。本仓库追加文件尺寸档（>300 advisory /
  >500 critical）。

## 10. 工程模式集成（收敛相关——指针）

工程模式承诺 "Advisor is mandatory at both design and code gates"。机械强制链的**完整
机制权威 = ENGINEERING-MODE.md**——本文件只留收敛语义：

- **Design gate**：spawn eng-coder 时 token 校验 + 写文件门禁（design 评审通过时同步置
  位）。凭证机制权威 = ENGINEERING-MODE.md。
- **Code gate**：eng-coder 内部交付协议闭环（in-child explore 审计 → advisor 复评 →
  修正轮 ≤5 → 收敛交付）；guard 在工程模式关闭（§6）——评审义务由内部协议承担。
- **轮次与 cap**：per-review 实例；cap 仅 code（§4.2）——design 轮次照常递增。

## 11. 配置与验证

- `config.json`：`advisor.provider` / `advisor.model` 可选覆盖主 agent 的
  provider/model（`resolveAdvisorProvider`——未配则继承主 provider，恒启用零障碍）；
  `advisor.guard` 为 completion guard 开关（默认 false）。`agent.engTokenTtlMs` 覆盖
  design token TTL（ENGINEERING-MODE.md §4）。
- **提示词硬加载**：4 份 advisor 提示词缺失即抛错（防静默降级到劣质内置 prompt）。
- 验证：轮次提示词替换/prior 注入/确定性轮次判定/cap 仅 code（第 6 次拒 + design 豁免
  正向探针）/guard 推回/fresh session/host-verified citations 的回归测试按端测试基建
  分层执行（TESTING.md §1）；提示词锚（"Do NOT look for new issues"、Evidence rule
  句等）由 prompts 内容断言防回退。

## 12. 评审后收口：Action 四值 + 修正轮 ⇄ 用户批准 时序（2026-09-11 批）

> 本节对位 CLI 同名档的「评审后收口」节（§13）——语义同源、本端原文自持。需求层 = CLI 端
> 需求档 §6 与 ENGINEERING-MODE 档 §1.5 #8（CLI 端）；批次 = `2026-09-11-PROMPT-REVIEW-ORDER.md`。
> 两处缺口的本端表现与 CLI 同源（用户 2026-09-11 实况发现）：①链上无「评审后修正轮」节点——
> 父侧在修正轮在途时即请求批准（第 3/6 批）；②`Fixed` 字面 = 已改完、实况按在途填——裁决表
> 与真实状态脱节。

### 12.1 Action 四值（本端词表句）

`Fixed` = **已落地**（代码/设计已改）；`Dispatched` = **修正轮在途**（已派/已启动、尚未落
地）；`Not an issue` / `Deferred` 语义不变。**收敛义务**：批准请求前 `Dispatched` 行须已逐条
收敛为 `Fixed`，并随批准请求给出落地证据（file:line 或设计档节）。本端词表句落点（8 文件中
的本端 4 文件）：`src/prompts/discipline-engineering.md` · `src/prompts/discipline-normal.md` ·
`docs/design/prompts/discipline-engineering.md` · `docs/design/prompts/discipline-normal.md`——
zh 面「恰好四选一」/ en 面 `exactly four values`（计数词与枚举同改）。

### 12.2 修正轮 ⇄ 用户批准 时序（严格序）

评审 pass → 逐条裁决 →（如需修正）**修正轮落地并核验后、才可请求用户批准**；修正轮在途时
**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。**修正轮边界**：只落评审发现与
裁决直接导出的修正——**不得夹带新语义/新范围**。时序规则 bullet 落点 = 本端
`discipline-engineering.md` 双源（bullet 文本与 CLI 端同文——跨仓逐字由镜像锚测试面⑥守）。

### 12.3 断言面（随本批同链）

- A12 字面 +2：链行插入子串 `评审 pass 后逐条裁决` / `修正轮落地并经核验`（`persona-engineering.md`
  双源两面）；
- 新面⑥（`test/prompts-mirror-anchors.test.mjs` 第六断言面）：四值句组 + 时序 bullet 组跨仓
  逐字（CLI ↔ VSC——定义见 CLI 同名档 §13.10）；
- 本端双源断言（`test/prompts-async-guidance.test.mjs`）：链行 / 四值 / 时序 bullet 在位 +
  负断言（无旧三值句残留）。

**决策溯源**（本端不重述——D2 单一权威源）：`Fixed` 方案①（保语义+补 `Dispatched`）与时序方案①（严格序）
的选型对比、否决备选与冲突核对 = CLI 同名档收口节 §13.2/§13.7/§13.8；本端只持契约与落点。

## 13. 评审链边缘守卫（VSC 对位——2026-09-11 第 12 批）

> 来源：批次档 `2026-09-11-VSC-GUARD-MIRROR`（CLI 仓 docs/batches）§1——条目 A（三处同构镜像）+
> 条目 B（settings 形状面残留；用户 2026-09-11 10:50「2.开」）。
> 语义源 = CLI 设计档（ADVISOR-CONVERGENCE）§14（A–E——CLI 单端交付，本批 VSC 对位）（CLI 侧）；
> 需求 = CLI 需求档同板块 §8（F18–F23 / N12–N15）与 SETTINGS-TOOL 需求档 F-S1.7（VSC 对位行）（CLI 侧）。
> **冻结面**：§7 / §12 零碰（第 9 批链落档件）；本批只新增本节 + §2 载体表同步 + 变更记录行。
> **镜像口径（双端独立实现纪律）**：语义同源、本端原文自持、不做 byte-identical、不建跨仓依赖
> （无 import、无同步脚本）；一致由本端语义锚断言守。差异如实登记（§13.6 D-VG6 / D-VG7）。

### 13.0 裁定摘要（批次 §1 五问）

| # | 问题 | 裁定（详文见对应小节） |
|---|---|---|
| 1 | 三处对位的镜像口径 | 语义同源 + 本端原文自持 + 零跨仓依赖；范围 = F18–F23 语义面；启动断言 / 冻结窗口不进本批（§13.10 登记）——§13.2 / §13.4 |
| 2 | VSC 是否需 loop/compaction 拆分 | **必拆**（468 + 预计新增 ~100–140 行必越 500 硬帽）——拆线 = `loop.mjs`（工具循环 + 墙/提示接线）+ `compaction.mjs`（限额 / 压缩+定锚 / 谓词族 / 文案 / 结构化尾）——§13.3 表 1 |
| 3 | 条目 B 落点 | `_SIBLING_SHAPES` 补第 4 条 + `_checkShape` 增 `roleMap` 分支 + 计数/测试/文档同步；键空间 = 工具寻址完整点分路径——§13.4 契约六 |
| 4 | 测试面与编号 | 新档 `test/advisor-chain-guards.test.mjs`（入 `test/files.mjs` 登记——显式清单硬项）；编号 **VSC 自持**（T-VG1–T-VG15 / AC-VG1–AC-VG8；映射列回指需求条目——CLI 对位经 §13.1 对位列）——§13.8 / §13.9 |
| 5 | 需求层落点 | CLI 需求档（同板块 §8 新节 + SETTINGS-TOOL F-S1.7 VSC 对位行——批 10 / 批 8 同口径）（CLI 侧）；本仓无 requirements 树——本档持指针（§13.1） |

### 13.1 需求层（指针 + 对位索引）

**总体需求**（详文 = CLI 需求档同板块 §8，本端不重述）（CLI 侧）：VSC 端评审链在宿主截断 /
信号缺失 / 引用歧义时机械自守——未完成评审不产出凭证；预算以硬墙约束并有可恢复收尾。

| 本批需求（CLI 侧文档 ID） | 语义标题 | 对位（CLI 第 11 批） |
|---|---|---|
| F18 | 未完成即不签发（VSC——sync + async 两结算面） | F11 |
| F19 | 凭证信号必达（VSC·构建面自愈） | F12（自愈层） |
| F20 | 信号全程在位（VSC·压缩定锚） | F13 |
| F21 | 引用解析按声明范围补全（VSC） | F14 |
| F22 | 超时 / 预算守卫（VSC——硬墙 + 提示 + 结构化尾） | F15 |
| F23 | 同族一致性（VSC·code 守卫同谓词） | F16（A3 面） |
| F-S1.7（VSC 对位行） | settings 形状表第 4 条（`agent.subagentModels` roleMap） | 第 8 批 W3 |

> **W 编号所指（第 8 批——CLI 仓批次档 `2026-09-11-SETTINGS-NULL-DEFAULT` §2 五·待裁定项）**：
> **W2** = 待裁定项「VSC 镜像是否纳入」（裁定 = 纳入——本批对位依据）· **W3** = 待裁定项
> 「`agent.subagentModels` 同族」（保留——该批 CLI 面落地、VSC 面本批补）——引用为条目号，非编号漂移。

非功能（详文同上，CLI 侧）：N12 零静默 / N13 可恢复 / N14 凭证卫生 / N15 零回归+可机判。
**明确不做（提要——详 §13.10）**：不改 CLI 侧；不做启动断言面 / 冻结窗口面；不改传输层 /
完成记账面 / 评审语义判据 / 提示词 / 凭证机制本体。

### 13.2 问题陈述（现场复核——file:line 为 as-of 2026-09-11，本端）

1. **引用解析单根**：`src/advisor/citations.mjs:34`（`verifyCitations` 只以 cwd 单根解析）+ 调用点
   `src/advisor/run.mjs:418`（`appendCitationReport(result, advisorCwd)` 不传 scope）——声明带仓前缀 /
   裸文件名引文 → `file unreadable` 误报（CLI 两处实证的 VSC 同构面；本端为 CLI 修复前逐字副本：78 行）。
2. **信号注入面缺口**：`src/advisor/messages.mjs:173-176` 的 Approval Signal 只在 design round1 分支注入；
   降级路径（`reviewType="design"` 且 round ≥1 无 prior → 落入 code 形态构建）**零信号**——评审员无法
   回显 token（CLI 同族缺陷；本端 `src/advisor/main.mjs:261-286` 的构建面同构）。
3. **压缩吞锚**：`src/advisor/run.mjs:58-81`（`compactMessages` 物理丢弃首条 user 消息——design 评审时
   其内含 token）+ `:166`（触发点）——压缩后评审员再也不见 Approval Signal，永不 re-approve。
4. **截断尾无判定族**：本端六 kind 宿主尾（按 kind 计；现行各一站点——`:146` 中断 / `:155` 超时 /
   `:159` 轮上限 / `:170` context 溢出 / `:210` 空响应 / `:462` 失败 resolve）无聚合谓词；
   `src/agent-tools/advisor-async.mjs:61`
   （`ADVISOR_FAILURE_TEXT`——`^` 锚）对「时间线 + 尾」形态（尾不在文本首行）**不命中** → 截断代码
   评审仍置 `_calledAdvisorThisRun`（`:372`）；且 design 结算（sync `agent-tools/advisor.mjs:275-294` /
   async `advisor-async.mjs:330`）只看 token 回显——截断评审回显 token 即签发。
5. **无硬墙**：`src/advisor/run.mjs:144-172` 的超时只在**轮间**检查——单次 `chat` 不受剩余预算约束
   （默认 600s 与传输层硬顶同量级）→ 停滞吞掉全预算、零输出（CLI 第 10 批实证的同构面）。
6. **settings 写面残留**：`src/agent-tools/settings.mjs:33-37`（`_SIBLING_SHAPES` 3 条）不含同族键
   `agent.subagentModels`——字符串形态被接受并落盘，而本端读侧（`subagent.mjs:87-90`）以
   `cfg.subagentModels?.[role]` 消费 → 静默读成 undefined（回落 subagentModel）=「写了等于没写」。

### 13.3 方案选型对比

**表 1——run.mjs 拆分线**（>500 硬帽触发；拆分必要性为硬约束）

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **镜像 CLI 拆线：`loop.mjs` + `compaction.mjs`** | 语义归位与 CLI 同源（迁移 / 对读成本最低）；两档预计 ~250 / ~140，均 ≤300；既有 import 面经 run.mjs re-export 零改 | run.mjs 保组装入口（re-export 面 ~10 行成本） | **选定** |
| 2 | 仅拆 `loop.mjs`（压缩/谓词留 run.mjs） | run.mjs 预计 ~330——仍超 300 advisory 且与 CLI 拆线不同构，后续对读漂移 | — | 否决（档位与同源双输） |
| 3 | 就地压缩注释 / 合并行 | 应付式——违正确性优先 | — | 否决 |

**表 2——谓词族的镜像范围（消费面）**

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **谓词 + 三消费点 + 定锚**（design sync/async 不签发 · code 守卫换谓词 · 报告提示 · 压缩定锚） | 语义同源 = 守卫生效（CLI 三消费点同构）；本端同构缺陷（§13.2 #3/#4）全部消除 | 触及 `agent-tools/advisor.mjs` / `advisor-async.mjs` / `run.mjs`（+~30 行） | **选定** |
| 2 | 只落谓词（不接线消费） | 死码——截断评审签发 / 计数缺陷仍在 | — | 否决（缺陷本体未除） |

**表 3——需求层落点**

| # | 候选方案 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **CLI 需求档新节 + SETTINGS-TOOL F-S1.7 对位行** | 批 10 同口径（VSC 条目落 CLI 需求档）+ 批 8 同口径（VSC 档明示需求层落 CLI 档）——单源可指、三方一致（批次档 §2 = 本档 AC 回指 = 需求档条目）锚定 | 需求在本端档缺席（本档持索引指针） | **选定** |
| 2 | 需求句全落本档内 | 本仓自含；但违「一板块一档」既有布局 + 三方一致锚点模糊 | — | 否决 |

> 契约一 / 二 / 三 / 六为**单一候选**（镜像语义唯一合理落点——同构缺陷已在 §13.2 逐条列证）：
> 显式声明「单方案——无对比」。契约四 / 五见上表 2 / 表 1 对应行。

### 13.4 契约（六条——逐字锚实现 grep / 用例断言）

**契约一：引用解析候选链（F21 / 对位 CLI §14.5）**

- `citations.mjs`：`citationRoots(cwd, scope)`（纯路径派生——候选序 = cwd → 声明仓根 `cwd/segs[0]` →
  声明文件目录 / 声明目录；声明在 cwd 之外 ⇒ 不派生）· `resolveCitation(citation, roots, base)`（逐候选
  `resolve(root, file)` → realpath 围栏在 cwd 内 → 读行 → 行内容包含引文；**三条件全中**才命中并记录
  所用根）· `verifyCitations(text, cwd, opts={})` / `appendCitationReport(text, cwd, opts={})`
  （`opts.scope` 省略 ⇒ 旧行为——签名向后兼容）。
- 失败原因三分：`file unreadable`（无候选命中）/ `content mismatch @ {相对路径}`（存在但内容不符）/ 
  `path traversal`（越围栏——不变）。
- 命中根透明：经派生根解析的命中逐条注明 → 报告段
  `Citations resolved via the declared review scope (bare path — resolved root noted):`。
- 调用点：`run.mjs` 的 `appendCitationReport(result, advisorCwd, { scope: [...(documents ?? []), ...(paths ?? [])] })`。
- 报告头 `[host-verified] N/M citations match current file state.` 不变；候选链新增段文案与 CLI 端同文
  （本端原报告已是 CLI 逐字副本，本批只增候选链与三分支）。

**契约二：信号自愈（F19 / 对位 CLI §14.4 #1）**

- `messages.mjs`：`buildAdvisorUserMessage` 改「内层构建 + 尾包」——外层守卫
  `reviewType !== "design" || !designToken` ⇒ 原样返回；输出不含逐字 `[DESIGN-TOKEN:{token}` ⇒ 尾包
  `buildDesignApprovalBlock(designToken, designId)`；否则原样（幂等——不缺不补、不重复）。
- 覆盖所有出口（design round1 分支 / code 形态降级路径 / legacy 收敛分支）——既有分支语义零改。

**契约三：压缩定锚（F20 / 对位 CLI §14.4 #3）**

- `compaction.mjs`：`compactMessages(messages, pinned = null)`——压缩动作内（首条 user 被丢弃的同一次
  splice）把 `pinned` 作为一条 user 消息重挂（`pin = pinned ? [{ role: "user", content: pinned }] : []`）；
  ≤20 条消息不触发（原样返回）。重复压缩允许重复挂回（幂等可读，不做存在性判定）。
- `run.mjs`：`buildPinnedBrief(reviewType, documents, object, designToken, designId)`（**评审参数构建——
  非模型输出**）：首行逐字
  `[review brief — re-attached after context compaction; the original review request is no longer in the context]`
  + 对象声明块（`buildReviewObjectDeclaration`）+ `## Documents to Review` 清单 + design+token 时
  `buildDesignApprovalBlock`。重内容（项目指南 / 方法论 / 文档地图）不入 pin。

**契约四：不完整判定族 + 三消费点（F18 / F23 / 对位 CLI §14.3）**

- 谓词 `advisorIncompleteMarker(text) → kind | null`（`compaction.mjs`；**块首行扫描**：按空行分块，
  逐块取首个非空行 trim 后测前缀）。六 kind（**本端字面**——逐字前缀取各尾固定部分），表列如下：

| kind | 本端行前缀（逐字） | 生成点（交付态） |
|---|---|---|
| context_limit | `Advisor: context window limit` | `loop.mjs` 溢出尾（原 run.mjs:170） |
| turn_cap | `Advisor: stopped after` | `loop.mjs` 轮上限尾（原 :159） |
| timeout | `Advisor: review timeout` | `loop.mjs` 硬墙 / 轮间检查（结构化尾） |
| empty | `Advisor: (empty response` | `loop.mjs` 空响应尾（本端自持括号字面） |
| interrupted | `Advisor: interrupted.` | `loop.mjs` 中断尾（原 :146；返回路径站点同判——契约五 ②） |
| review_failed | `Advisor: review failed` | `run.mjs` catch 字符串 resolve（不 throw——原 :462） |

- **计数口径（D3）**：六 = **kind** 计（「生成点」列列交付态站点——同 kind 可多站点：`timeout` / `interrupted`）；
  §13.2 #4 的六锚 = 现行代码站点枚举（非交付态站点总数）。
- 负向精度：非块首形态（围栏内行 / 表格行 / 引用行）**不判** incomplete（残余方向 fail-closed——
  多付一轮重跑，如实登记）；块首裸行引用同串的残余误报方向安全。
- 消费点 1（design sync 结算，`agent-tools/advisor.mjs`）：`incomplete = advisorIncompleteMarker(result)`；
  非空 ⇒ **不签发**——剥 token 回显（`makeDesignTokenRegex(token, "g")`）→ 输出 = 剥后文本 + 未签发
  提示（逐字见下）→ `_engDesignTokens` 零写（槽零写）；F2h 映射登记保留；`_lastAdvisorOutput` 覆写为
  清洗后输出（防未注册 token 进 prior）。
- 消费点 2（design async 结算，`advisor-async.mjs` `advisorSettleAccounting`）：同上判据；`passed=false`、
  D1 台账零写、`entry.report` = 剥后文本 + 未签发提示；stale 分支在外层优先保留。**N14 三面同源（report /
  digest / prior）**：digest（`injectAdvisorResult` 原样注入 `entry.report`——as-of `advisor-async.mjs:438-447`）
  与 prior（唯一写点 `record.priorOutput = stripApprovedSuffix(entry.report, …)`——as-of `:399-400`，取
  **清洗后**报告）均与 report 同源 ⇒ 剥除结果自动传导——async 面无需另设清洗（对偶 = sync 面
  `_lastAdvisorOutput` 显式覆写——消费点 1）。
- 消费点 3（code 完成守卫，`advisor-async.mjs`）：`failureVerdict` 改用同谓词（`ADVISOR_FAILURE_TEXT`
  `^` 锚正则**定义与消费退场**——六 kind 全覆盖 = 旧六形态语义零丢；error settle（result=null + error）
  判定保留）。
- **未签发提示（逐字——与 CLI 同文，机器可 grep）**：

```
评审未完成——token 未签发 (review incomplete — no design token issued; reason: {kind})
以更小范围重跑设计评审（逐档 / 逐节拆分，或拆到两次评审），或调大 agent.advisor.timeoutMs 后重试；补充检查未完成的部分不得按已核处理。
```

**契约五：硬墙 + 提示 + 结构化尾（F22 / 对位 CLI §14.6）**

- 硬墙：轮内 `remaining = timeoutMs - elapsed`；`remaining <= 0` ⇒ 结构化超时尾；否则每次调用信号 = 用户信号 ×
  本调用 deadline（复合信号无条件传入——语义零变）：
  `callSignal = signal ? combineSignals([signal, AbortSignal.timeout(remaining)]) : AbortSignal.timeout(remaining)`。
  **交付实现形态（第 12 批交付同步——只记形态、不改语义）**：`AbortSignal.any` **不可直接依赖**（本端
  `provider.mjs:31` 载荷 polyfill 为非导出局部 const；仓内无裸调在案）⇒ 组合经 `loop.mjs:29-38` `combineSignals` =
  **特征检测**（`typeof AbortSignal.any === "function"` 走原生）+ **本地兜底**（AbortController 包装——任一输入
  abort 即触发、已 aborted 立即生效、reason 透传；形态同形 `src/mcp/http.mjs:14-22`）——语义一致。
  `.timeout` 原生——VS Code 运行环境兼容。
- 墙判定**绑信号状态**（非异常名）：① 抛错路径——`signal?.aborted` ⇒ 原样上抛（用户中断语义零变）；
  `callSignal.aborted || e.name ∈ {AbortError, TimeoutError}` ⇒ 结构化超时尾；其余错误上抛。② 不抛错
  返回路径——`signal?.aborted` ⇒ 中断尾；`callSignal.aborted && response?.interrupted` ⇒ 结构化超时尾
  （本端传输层中止返回形态 = `interrupted` 字段；非 interrupt 中止抛错——形态差异如实注，见 D-VG5）。
- **②2 防御分支注（第 12 批交付同步）**：`interrupted` 返回仅用户 Ctrl+I 中止置位（四传输层同判：
  `e.name === "AbortError" && signal.reason?.interrupt`——`anthropic.mjs:187` / `google.mjs:213` /
  `openai.mjs:268` / `responses.mjs:349`）；彼时 `signal.aborted` 先命中 ②1 中断尾（顺序敏感——
  `loop.mjs:176` → `:179`）⇒ ②2 可达性存疑（实施前锚点核验 id=7 结论）；**保留**（防御分支，实现按
  契约原样落）+ 用例经 seams 构造（T-VG13）。
- 0.75 一次性提示：`shouldBudgetNudge(elapsed, timeoutMs, nudged)` 纯函数 + `budgetNudgeText(...)` 注入
  一条 user 消息（每场评审至多一次）。
- 结构化超时尾 `timeoutTail(timeoutMs, rounds, toolCalls, producedText)`：族前缀
  `Advisor: review timeout after {S}s.` 逐字保留（判定族字面依赖）；其后替换本端旧句
  （`Partial results may be available. Try again with a narrower scope.`）为**机读统计行三要素**
  （`rounds:` / `tool calls:` / `review text produced:`）+ **`budget:` 预算指引行**——D3 口径：「三要素」在本档
  一律指统计行（budget 为独立行；与 F22 枚举四项同指）。
- **逐字抄写源（D-VG6——预算提示 / 结构化尾不逐字重述）**：CLI 仓 `src/advisor/compaction.mjs`
  `budgetNudgeText`（提示串）/ `timeoutTail`（三段式尾：族前缀 + 统计行 + budget 行；CLI 仓设计档
  `docs/design/ADVISOR-CONVERGENCE` §14.6 同文）——本端逐字同文。
- 计数器：`turns` / `toolCallCount` / `reviewTextProduced`（onToken 非空白 ⇒ true）/ `budgetNudged`。

**契约六：条目 B——VSC 形状表第 4 条（F-S1.7 VSC 对位）**

- `src/agent-tools/settings.mjs`：`_SIBLING_SHAPES` 补
  `"agent.subagentModels": { kind: "roleMap", expects: "object of role→non-empty string" }`（第 4 条）；
  `_checkShape` 增 `roleMap` 分支（非对象 / 数组 ⇒ 拒；`Object.values` 逐值非空串；`{}` 空对象 =
  有效清除态）；头注「跨端三键」措辞同步为「跨端 3 + 同族 1 = 4 条」。
- 计数与文档同步：本仓 TOOLS 档「3 键」→「4 键」+ 新增条目行；测试 T-S2.33 存在性断言扩为 4 键 +
  新增 T-S2.36 / T-S2.37（见 §13.8）。
- 消费面证据（拒绝依据）：`src/agent-tools/subagent.mjs:87-90`（`effectiveSubagentModel`——
  `cfg.subagentModels?.[role]`；字符串形态静默回 undefined）。

### 13.5 受影响文件全清单（行数注记 = 批次前 → 交付实测）

**实施域（eng-coder 写域——11 项 = 8 改 + 3 新（拆分新档 ×2 + 测试新档 ×1））**

| # | 文件（VSC 仓） | 行数注记 | 变更 | 档位结论 |
|---|---|---|---|---|
| 1 | `src/advisor/citations.mjs` | 78 → **143** | 候选链 + 三分 + 命中根透明 | 不拆（≤300） |
| 2 | `src/advisor/messages.mjs` | 285 → **296** | 自愈尾包（内层 + 外层） | 不拆（≤300；**实测 296 贴线未越线**——无新增 >300 advisory 债） |
| 3 | `src/advisor/run.mjs` | 468 → **221** | 组装入口 + 定锚构建 + scope 传参 + re-export 面 | **拆分后** ≤300 |
| 4 | `src/advisor/loop.mjs` | 新 → **278** | 工具循环（迁出）+ 硬墙 / 提示 / 结构化尾接线 + 循环测试缝 `seams`（`{now, chat}`——`??` 默认回退，生产路径零变） | 新档（≤300） |
| 5 | `src/advisor/compaction.mjs` | 新 → **160** | 限额 / `compactMessages`（+定锚）/ `renderTimeline` / 谓词族 / `shouldBudgetNudge` / `budgetNudgeText` / `timeoutTail` | 新档（≤300） |
| 6 | `src/agent-tools/advisor.mjs` | 310 → **321** | sync design 未完成守卫 | 不拆（<500；>300 存量档） |
| 7 | `src/agent-tools/advisor-async.mjs` | 460 → **463** | async 未完成守卫 + `failureVerdict` 换谓词（旧正则退场） | 不拆（<500） |
| 8 | `src/agent-tools/settings.mjs` | 250 → **261** | 第 4 条形状 + `roleMap` 分支 + 头注计数 | 不拆（≤300） |
| 9 | `test/advisor-chain-guards.test.mjs` | 新 → **427** | T-VG1–T-VG15（15 例） | 新档（≤500；**入 `test/files.mjs` 登记**） |
| 10 | `test/settings-tool.test.mjs` | 149 → **192** | T-S2.33 扩 + T-S2.36 / T-S2.37（2 例） | 不拆 |
| 11 | `test/files.mjs` | 53 → 54 | 登记新测试档 | — |

> 行数注记口径 = `N lines total`（右值 = **交付实测**——第 12 批交付同步复写；对照见下）。re-export 面零改 =
> 既有消费经 run.mjs 保持：`agent.mjs` / `run-stages.mjs` 的 `MAX_ADVISOR_ROUNDS`；`advisor.mjs` /
> `advisor-async.mjs` 的 `runAdvisorReview` + `resolveAdvisorProvider`。`_setAdvisorToolSetForTest` 消费面实况
> （交付同步校正·D3）：`advisor-chain-guards.test.mjs:18` 经 run.mjs re-export（`run.mjs:25`）；
> **`batch-segment.test.mjs:20` 直连 `src/advisor/tools.mjs`（不经 run.mjs）**——拆分保留 re-export 即可，
> 两者均不受拆分影响（消费面零改）。
>
> **交付实测 vs 预计**：11 项全落地（8 改 + 3 新）；正偏差 `loop.mjs` +28（~250 → 278）· 新测档 +27（~400 → 427）·
> `compaction.mjs` +20（~140 → 160）；负偏差 `run.mjs` ~250 → 221（拆分后更小）· `advisor-async.mjs` ~476 → 463；
> **贴线项 `messages.mjs` = 296**（≤300 未越线——无新增 >300 advisory 债）；全部落于各档位内（余项偏差 ≤13）。

**文档域（eng-designer 写域——本设计者已落 / 随批）**

| 文件 | 行数注记 | 变更 |
|---|---|---|
| `ADVISOR-CONVERGENCE（CLI 仓）` | 152 → **197（实落）** | §8（F18–F23 / N12–N15）——**已落** |
| `SETTINGS-TOOL（CLI 仓）` | 51 → **52（实落）** | F-S1.7 VSC 对位行——**已落** |
| `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` | 330 → **660（实落——交付同步后终值）** | 本节 §13 + §2 载体表 + 变更记录行——**已落**（行数 = 交付同步复写） |
| `thincoder-vscode/docs/design/TOOLS.md` | 223 → **226（实落——修正轮后终值）** | §5 第 4 条 + 计数 + 变更记录行——**已落** |

### 13.6 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-VG1 | **拆分 = `loop.mjs` + `compaction.mjs`**（必拆） | 表 1——468 + 预计新增必越 500 硬帽（无豁免通道）；CLI 同款拆线 = 迁移 / 对读成本最低。否决：仅拆 loop（run 超 advisory 且与 CLI 不同构）· 就地压缩（应付式） |
| D-VG2 | **镜像范围 = F18–F23 语义面**（含谓词三消费点 + 定锚） | 表 2——谓词无消费点 = 死码，同构缺陷（§13.2 #3/#4）不除；定锚与自愈同属「信号必达」家族（压缩物理丢首条 user 消息 = 同一证据面）。否决：只落谓词不接线 · 定锚延后登记 |
| D-VG3 | **需求层落 CLI 需求档**（同板块 §8 + F-S1.7 对位行） | 表 3——批 10 / 批 8 同口径。否决：需求全落本档（违一板块一档 + 三方一致锚点模糊） |
| D-VG4 | **用例 / AC 编号 VSC 自持**（T-VG / AC-VG；映射列回指需求条目——CLI 对位经 §13.1 对位列） | 覆盖集与 CLI 不同（本批不含启动断言 / 冻结窗口——沿用 CLI 同号会指向不存在的对位件）；两仓同 ID 混淆面。映射表保证可追溯 |
| D-VG5 | **硬墙形态按本端实况**（中止返回 = `interrupted` 字段；非 interrupt 中止抛错——传输层零改） | 本端 transports 中止语义已定；改传输层超本批边界。判定以信号状态为主判据（异常名兜底）——语义同源、形态差异如实注 |
| D-VG6 | **新增字面与 CLI 同文**（枚举 = 本批新增字面中与 CLI 同文者，共五处——未签发提示 · 预算提示 · 结构化尾 · 报告候选链段 · 契约三 pin 首行；本端原文自持字面不入枚举——D-VG7） | 选择同文不构成依赖（无同步脚本；各端自持语义锚断言）；两仓用户读到同一文案 = 同机制统一恢复指引；预算提示与结构化尾的逐字抄写源见契约五（本档不重述——D2） |
| D-VG7 | **存量字面保留本端原文**（空尾括号形态 `Advisor: (empty response` 等） | 各端原文自持纪律；谓词取本端字面——跨端字面差异不构成缺陷（如实登记，不追赶） |
| D-VG8 | **sync 完成记账面（`execute-tools.mjs`）零改** | parity：CLI 同面 = 第 13 批另裁（`record-results`）；VSC 随之（登记 §13.10）。否决：本批单边扩面（跨批语义分裂） |

### 13.7 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D2 单一权威源** | 契约详文 = 本节（VSC 端）；需求详文 = CLI 需求档同板块 §8（CLI 侧）；本档持索引不重述 |
| **D3 计数·枚举** | 六 kind（表 6 行同改）· 用例 17（T-VG1–T-VG15 + T-S2.36/T-S2.37）· AC 8（AC-VG1–AC-VG8）· 受影响文件 11 实施 + 4 文档（§13.5） |
| **D5 冻结窗口** | §7 / §12 零碰（第 9 批链落档件）；CLI 仓代码零改（第 11 批已闭）；本档改动集齐后统一入场 |
| **D6 回读核对** | 设计落档后回读核实（本节 + §2 + 两份需求档）；实施面验收含读回断言 |
| **D7 变更留痕** | 本节落档 + 变更记录行（本批） |
| **凭证不落档** | 全文零 token / designId 值（占位符形态） |
| **多实现面纪律（双端）** | 语义同源 + 本端原文自持；不 byte-identical、不建依赖；差异如实登记（D-VG6 / D-VG7） |
| **R24a/R24b 行数与档位** | §13.5 逐文件当前行数 + 预计增量 + 档位结论（含必拆与拆分计划） |
| **文档宽度 / 一致性** | 两仓 `check-doc-width` 新增违规 0 + 新增超宽 0（改动后实跑——设计落档即验） |

### 13.8 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-VG1 | 正常 | 谓词输入：六形态尾（各一，块首行）+ 干净文本 + 空串 | 六 kind 逐一命中；干净 / 空 → null（块首行锚——尾不在首行也命中） | F18 / F23 |
| T-VG2 | 边界 | 非块首的尾前缀引用行（围栏内 / 表格行 / 引用行） | null（负向精度锁——引文不误判 incomplete） | F18（负向） |
| T-VG3 | 正常 | sync design 结算：时间线（含 token 回显）+ context 尾 | 不签发：报告零 token 字面 + 提示串在位 + 槽零写 | F18 |
| T-VG4 | 正常 | async design 结算（fixture entry，report 同 T-VG3） | 同 T-VG3（`entry.report` 含提示；D1 台账零写） | F18 |
| T-VG5 | 边界 | 干净通过（无尾 + token 回显） | 签发零回归：槽写入 + Approved 后缀 | F18（负向） |
| T-VG6 | 错误 | code 守卫：时间线 + context 尾；另一例 `review failed (…)` 字符串形态 | `_calledAdvisorThisRun` **不**置 true（行为面保留）；旧正则定义 / 消费零残留（grep 面）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1） | F23 |
| T-VG7 | 边界 | 构建自愈：design + round ≥1 + 无 prior（降级形态）；幂等复测 | 输出含 `## Approval Signal` + 精确 token 字面；已含时不重复 | F19 |
| T-VG8 | 边界 | `compactMessages(>20 条, pinned)` / `(≤20 条, pinned)` | 前者压缩后含 pinned 三锚；后者原样返回 | F20 |
| T-VG9 | 正常 | 夹具双仓；scope 声明 VSC 档；引文 = 裸文件名 | 命中 1/1 + 报告注明解析路径 | F21 |
| T-VG10 | 边界 | 引文 = 仓根相对路径；另一仓存在同名文件 | 经声明仓根命中；另一仓不被误命中（内容判据） | F21 |
| T-VG11 | 错误 | 三形态：不存在 / 行内容不符 / `../` 越围栏 | `file unreadable` / `content mismatch @ {path}` / `path traversal` | F21 |
| T-VG12 | 边界 | `_runAdvisorToolLoop` + seams：预算用尽（首调返回工具调用） | 结构化尾（族前缀 + 统计行三要素 `rounds:` / `tool calls:` / `review text produced:` + `budget:` 行——口径同 §13.4 契约五） | F22 |
| T-VG13 | 边界 | 墙在调用中触发：抛错形态（AbortError / TimeoutError 名）+ `interrupted` 返回形态 | 两形态同判结构化尾（族前缀 + 统计行三要素 + budget 行——口径同契约五） | F22 |
| T-VG14 | 边界 | 时钟注入（`seams.now` 序列）：0.75 阈值后第 2 轮 | 预算提示恰一次（断言串；仅一次出现；零真实等待） | F22 |
| T-VG15 | 正常 | 纯函数 `shouldBudgetNudge`：阈值两侧 + `nudged=true` | 不提示 / 提示 / 已提示不重复 | F22 |
| T-S2.36 | 正常 | `set agent.subagentModels`：`{"coder":"x"}` 接受落盘；字符串 / 数组 / 含空串值拒绝（磁盘零变化） | 接受 + roleMap 拒例（`expects object of role→non-empty string`） | F-S1.7 |
| T-S2.37 | 边界 | `null` 显式清除 / `{}` 清除态 / 消费面探针 | 清除回未设置；`{}` 接受；`effectiveSubagentModel` 命中 | F-S1.7 |

> 测试基建：单测零网络、零真实 LLM（`seams.chat` / `seams.now` 参数覆写 + `??` 默认回退——
> 生产路径不可达）、零长等待（T-VG14 时钟注入零真实等待；T-VG13 真实墙定时器 ~0.1s 级；
> 余皆微秒级——快层 800ms 拦截线内）。新档入 `test/files.mjs` 登记后随 `npm test` 跑。

### 13.9 验收标准（逐条回指——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-VG1 | 候选链零假命中：T-VG9 / T-VG10 / T-VG11 绿（行为面）；`citations.mjs` 无全盘扫描（grep）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；命中根报告段在位 | F21 |
| AC-VG2 | 信号必达：T-VG7 绿（自愈 + 幂等） | F19 |
| AC-VG3 | 压缩不吞锚：T-VG8 绿（行为面）；pin 来源 = 评审参数（grep 判据三式）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1） | F20 |
| AC-VG4 | 未完成不签发：T-VG3 / T-VG4 绿（`passed=false` + 槽 / 台账零写 + 报告零 token 字面 + 提示串在位）；T-VG5 零回归（正常批准不变） | F18 |
| AC-VG5 | 同谓词守卫：T-VG6 绿（行为面）；`ADVISOR_FAILURE_TEXT` 定义 / 消费 grep 零命中（六 kind 全覆盖）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1） | F23 |
| AC-VG6 | 硬墙 + 结构收尾 + 提示：T-VG12 / T-VG13 绿（族前缀逐字 + 统计行三要素 + budget 行；两形态同判）；T-VG14 / T-VG15 绿（0.75 阈值、一次性、时钟注入零真实等待） | F22 |
| AC-VG7 | 形状表第 4 条：T-S2.36 / T-S2.37 绿；`_SIBLING_SHAPES` 键数 = 4 与 TOOLS 档计数一致；roleMap 拒 / 接受集 == `effectiveSubagentModel` 可消费集（表驱动） | F-S1.7 |
| AC-VG8 | 零回归 + 档位 + 登记：VSC `npm test` 全绿；`test/files.mjs` 清单含新档（+1）；行数实测对表（loop / compaction / run ≤300；advisor-async ≤500；新测试档 ≤500）；两仓 `check-doc-width` 新增违规 0 + 新增超宽 0；CLI 仓代码零改动（`git status` 判据——本批不碰 CLI 实施面） | N15 |

### 13.10 边界（本批不做 + 登记项）

- **启动断言面（F12 的 fail-closed 层）——已收口（第 15 批，见 §14.3）**：原登记 = VSC 设计评审链路
  恒签发 token（`agent-tools/advisor.mjs:254`——as-of 2026-09-11）⇒ 正常链不可达；第 15 批裁定 = **实现直接
  调用方兜底**（断言 + 异步结算消费——CLI §14.4 #2 语义同源，「不依赖可达性论证」）→ 契约 §14.3 / AC-VG9。
- **收敛路径信号面——已复核收口（第 15 批，见 §14.5）**：原登记（交付披露 ③）表述为「收敛路径不含
  Approval Signal」——第 15 批复核**不成立**（normal chain 已携带：`main.mjs:308`/`:311` 显式尾包；三形态探针
  + T-VG21 回归锁）；`buildAdvisorFollowUp` 本体无信号 = 设计使然（信号 = 调用面评审参数注入，CLI 同构）。
  登记描述按本行更正。
- **冻结窗口 E 面——已收口（第 15 批，见 §14.4）**：实现点 = `execute-tools.mjs` `preGateBlocked`
  （VSC 无 `dispatch.mjs`——单一预闸点）；口径 = 本端特有形态（事件面 `_fileMutEvents`；判据同源 `advisorStale`
  设计面含 legacy 分支）→ 契约 §14.4 / AC-VG10 / AC-VG11。
- **传输层零改**：中断 / 超时形态按本端实况（`interrupted` 返回字段；非 interrupt 中止抛错）；
  `partial` 字段不存在——不引入
- **sync 完成记账面零改**（`execute-tools.mjs:432`）：CLI 第 13 批另裁（`record-results`）后 VSC 随批
- 不改评审语义判据 / 评审侧提示词 / 凭证机制本体 / cap 语义；不改压缩触发阈值
- 不碰 §7 / §12；不碰 CLI 仓实施面与已交付面；不新建文档档（本批全落既有档）
- **零 UI 面**（提示 / 尾 / 报告段均落评审文本与工具返回值内——无面板 / webview 改动；无 `open` 项）

## 14. 守卫收尾：启动断言 / 冻结窗口对位 / 收敛信号锁定（VSC——2026-09-11 批）

> 来源：批次档 `2026-09-11-VSC-GUARD-COMPLETION.md` §1（用户 12:35「这三条都重新核实一下，然后按照你的
> 意见办」→ 裁定开批）。三面 = §13.10 登记项原位收口：①启动断言面 ②冻结窗口 E 面 ③收敛路径信号面。
> 语义源（CLI 侧）：CLI 设计档（ADVISOR-CONVERGENCE）§14.4 #2（启动断言）与 §14.14（冻结窗口 E）、
> CLI `src/advisor/run.mjs:162-171`（断言实现）；需求 = CLI 需求档 §9（F24–F26 / N16–N18——本批新增节）。
> **冻结面**：§13 已交付契约文本零碰（本批只新增本节 + §13.10 登记项原位收口 + §2 载体表同步 + 变更记录行）；
> §7 / §12 零碰。**镜像口径**：语义同源、本端原文自持、零跨仓依赖（无 import / 无同步脚本）——一致由本端
> 用例断言守；跨端差异 3 处如实登记（判官 legacy 分支 / 面①消费面 / 事件面形态——§14.7 D-VGC3）。
> **批次号**：批号按会话序推定（14 = SWEEP-FOLLOWUP 收尾批）；档内引用以批次档路径为准。

### 14.0 裁定摘要（批次 §1 三面 + 四问）

| # | 问题 | 裁定（详文见对应小节） |
|---|---|---|
| 1 | 面①启动断言：实现 vs 维持登记 | **实现**（直接调用方兜底——CLI §14.4 #2 语义同源，"不依赖可达性论证"）；实现点 = `run.mjs` 断言 + 异步结算消费——§14.3 |
| 2 | 面②冻结窗口：实现点 + 口径 | 实现点 = `execute-tools.mjs` `preGateBlocked`（**单一预闸点**——VSC 无 dispatch.mjs）；口径 = 本端特有形态（事件面 `_fileMutEvents` / 判官同源含 legacy 面）——§14.4 |
| 3 | 面③收敛信号：补齐 vs 维持 | **维持（不补）——登记描述不成立**：normal chain 已携带信号（`main.mjs:308`/`:311` 显式尾包；三形态探针 + T-VG21 回归锁）；`buildAdvisorFollowUp` 本体无信号 = 设计使然（信号 = 调用面评审参数）——§14.5 |
| 4 | 受影响文件 / 用例 / AC | 实施域 6 项（4 改 + 1 新测档 + 1 登记）——§14.6 / §14.9 / §14.10 |

### 14.1 登记复核（三面现场复核——file:line as-of 2026-09-11，本端）

1. **①启动断言面**：`src/agent-tools/advisor.mjs:254`（sync——`reviewType === "design"` 恒铸 token）与
   `src/agent-tools/advisor-async.mjs:202`（async——`launchAsyncAdvisor` 恒铸；拒发分支 `:192`/`:196` 早于铸码
   ——拒发不丢码）⇒ 两个生产调用点（`advisor.mjs:265-270` / `advisor-async.mjs:253-259`）**恒携带 token**。
   `run.mjs:95` 的 `runAdvisorReview` **无启动断言**（对照 CLI `run.mjs:162-171`）；全仓无拒绝记账机制
   （`_advisorRefusals` / `ADVISOR_LAUNCH_REFUSAL_PREFIX` 零命中）。
2. **②冻结窗口**：VSC 无 `src/agent/dispatch.mjs`；父侧工具写面单一执行器 = `src/agent/execute-tools.mjs`
   （`executeToolBatches`——唯一 `tool.execute` 模型工具调用点，`agent.mjs:308` 唯一调用方），单一预闸 =
   `preGateBlocked`（`:82-114`；逐项调用点 `:217`——权限阶段 `:237` 之前、autoApprove 短路之前）。
   在途判定面 = `advisorStale`（`advisor-async.mjs:116-143`——design 分支：`entry.documents` 射程 + legacy 面
   （声明为空 ⇒ `.md`/`.markdown` 或 `docs/` 路径））；事件面 = `_fileMutEvents`（`recordFileMutation`，`:80-85`）
   + `eventsAtLaunch` 快照（`:227`）。**无拦截面**（预闸无冻结分支）。
3. **③收敛信号**：`prepareAdvisorMessages` 的 design round ≥2 分支（`main.mjs:301-312`）**已**显式尾包
   `buildDesignApprovalBlock`（`:308` 条件 = `designToken` 真值；`:311` 注入）——探针实证三形态（rv 实例 /
   sync 持久 prior / 无 prior 降级）全部携带 `## Approval Signal` + 逐字 token。`buildAdvisorFollowUp` 本体
   （`:162-183`）无 token 参数、不含信号——**属设计使然**（信号 = 调用面评审参数，非模型输出派生）。

### 14.2 方案选型对比

**表 1——面①：启动断言的落法**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **实现：`run.mjs` 断言 + 异步结算消费 `launchRefused`**（CLI §14.4 #2 语义同源） | 补齐全家族第三层（自愈 / 断言 / 定锚）；拒发可见（前缀 = 稳定契约）；口径 = CLI D-CG6「不依赖可达性论证」；成本 ~15 行 + 2 用例 | 拒绝在正常链不可达（防御纵深——如实注）；sync 面拒绝登记无宿主（登记残余） | **选定** |
| 2 | 维持登记（免修——可达性论证） | 可达性成立（两调用点恒铸 + 自愈保证字面在场）；但判据依赖"未来不变"假设——CLI 对同机制明确否弃可达性论证；且本批目的 = 收口登记（再登记 = 未收口） | — | 否决（违家族原则：断言兜底未来路径） |
| 3 | 只实现断言（不做结算消费） | 拒绝报告会被异步结算计"已评审覆盖"（零评审产出却置 called——与 F16/A3 同向语义相悖）；CLI 已裁同款消费面 | — | 否决（半机制） |

**表 2——面②：冻结拦截的实现点**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **`execute-tools.mjs` `preGateBlocked` 单一预闸点**（+ `advisor-async.mjs` 冲突 helper） | 单一来源（批扫描 + 逐项共用）；权限阶段 / autoApprove 之前（审批不得绕过冻结）；全仓唯一执行器（无旁路）；与既有两道工程门 `:97`/`:105` 同形） | 预闸 +~14 行 / helper ~22 + 消费 ~4（合计 ~26） | **选定** |
| 2 | 只在逐项执行点内联（`runOne` 权限段前） | 绕过批扫描面（冻结项会进入批审批组——审批语义被扰动）；判据两处重复风险 | — | 否决 |
| 3 | extension 面板写路径 | 面板写非模型工具写（覆盖不到父 agent 的 FILE_MUTATORS 写——本批保护对象） | — | 否决（射程错位） |

**表 3——面②：判据同源范围**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **全镜像本端 `advisorStale` 设计面（含 legacy 分支）** | 拦 = 判 射程（零误杀 + 零漏拦）；legacy 形态（无声明文档）在本端判官下 .md / docs 路径写即 stale——拦集必须覆盖 | 无声明形态下 .md 写被拦（= 该写本会致 stale——正确行为） | **选定** |
| 2 | 仅声明文档集（CLI 判官形态） | CLI 判官无 legacy 分支（`reviewIsStale` 空射程 ⇒ 不判 stale）——照搬会在本端留"致 stale 却不拦"的残口 | — | 否决（违拦 ⊆ 判 的保守方向） |

**表 4——面③：收敛信号**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **维持（回归锁 + 登记原位更正）** | 信号在位已实证（三形态探针）；补包装 = 不可达冗余；登记按复核结果更正——防未来按错误描述重开评估 | 无代码改动 | **选定** |
| 2 | 给 `buildAdvisorFollowUp` 加自愈尾包 | 该函数无 token 参数（纯构建器）；加参数 = 改签名面；产品链信号来源 = 调用面（CLI 同构）——"补齐"无对象 | — | 否决 |

### 14.3 契约一：启动断言（① / F24 / AC-VG9）

- `src/advisor/run.mjs`：导出 `ADVISOR_LAUNCH_REFUSAL_PREFIX = "Advisor: design review launch refused"`
  （稳定契约——结算消费面据此判）。
- `runAdvisorReview`：`prepareAdvisorMessages` 之后、发起之前，`reviewType === "design"` 时断言——
  ① 本次已签发 token 非空；② user 消息内逐字含 `[DESIGN-TOKEN:{token}`。违反 ⇒ **返回拒绝报告**
  （不发请求）。逐字（与 CLI §14.4 #2 同文——本批同文字面枚举 #1）：

```
Advisor: design review launch refused — {reason: no design token was minted | the request does not carry the approval signal}. Nothing was sent: a request that asks the reviewer to echo a token it cannot see would break the credential chain. Re-run advisor(type='design') to mint a fresh token.
```

- 异步结算消费（`advisor-async.mjs` `advisorSettleAccounting`）：拒绝报告前缀 ⇒ `launchRefused` 入
  `failureVerdict` ⇒ **不置 `_calledAdvisorThisRun`**（未发起 = 无产出——CLI §14.4 记账面同源）。
- **可达性如实注**：两个生产调用点恒铸 token ⇒ 正常链不可达（表 1 候选 2 的论证成立）——本断言 =
  **直接调用方兜底（防御纵深）**（CLI 明载同款口径）。
- 零回归边界：正常链（token 在场 + 自愈保证字面在场）行为零变；（同步面）拒绝报告不写槽 / 不写 prior / 不耗轮次；**异步面**本批消费点只保证「不置已评审覆盖」——prior/轮次面 = 结算语义本体（§14.12 排除），残留登记见 §14.11 #5。

### 14.4 契约二：冻结窗口（② / F25 / N16 / N17 / AC-VG10 / AC-VG11）

**（a）窗口定义（下界定义句——本端机制权威表述）**

```
在途窗口（D5 冻结窗口）= 点火 → 结算：起点 = 异步评审启动受理（eventsAtLaunch 快照——
父侧文件变更事件表的记录时点）；终点 = 结算记账（advisorStale 读取父侧文件变更事件的时点）。
父侧可观察下界 = 报告送达（digest 注入 / 回合尾 collectSettledAdvisors）或取消·中止。
「子进程退出」不是窗口边界。窗口内父侧对被审文件集零写入；违规后果保留既有语义（结算 stale →
不签发 token / 不计评审覆盖）。
```

**（b）参与者义务**

- **父侧**：① 点火后至报告送达 / 取消前，被审文件集零写入；② 有改动需求 → 先 cancel
  （`subagent` `action:'cancel'` + id → `cancelAdvisorReview` 路由）→ 改动落地 → 重发评审（不在途改）；
  ③ 收到 stale 结果按既有提示重跑，不按已评审处置。
- **宿主**：点火回执携带冻结句（设计评审——§14.4（d））；结算前拦截父侧对被审文件集的 `FILE_MUTATORS`
  写入（§14.4（c））；stale 结果照既有通道可见。
- **评审员**：零新增义务——§3 写入通道（`batch_segment`）不受影响（不在 `FILE_MUTATORS` 内，不落父侧变更
  事件表——既不判 stale 也不拦）。

**（c）拦截（实现点 + 判据 + 文案）**

- 实现点：`src/agent/execute-tools.mjs` `preGateBlocked`（工程门后、权限阶段前）——`FILE_MUTATORS` ×
  `inflightDesignReviewConflict(agent, absPaths)` 命中 ⇒ blocked（content = 拒绝串）。路径提取同既有语义
  （`tool.touchedPaths(args)`；取不到路径不拦——与变更记账同界）。
- 冲突 helper（`src/agent-tools/advisor-async.mjs`——与 `advisorStale` 同模块、同源）：
  `inflightDesignReviewConflict(parent, absPaths) → {id, path} | null`——D1 accessor（`advisorPoolMap`）读池；
  筛选 **design × running × 未取消 × 未结算**；射程与归一 = `advisorStale` 设计面全同源（`entry.documents` +
  legacy 面；路径归一 `\` → `/` + cwd 前缀剥离）。
- 拒绝文案（逐字，与 CLI §14.14 E-3c 同文——本批同文字面枚举 #2；`{path}` = cwd 相对）：

```
Error: write refused — design review #{id} is in flight over {path} (D5 freeze window). A write now would settle it stale — no token for a pass (the round is lost). Wait for the report, or cancel the review first (subagent action:'cancel' id:'{id}') and re-launch after the change.
```

- **同源判据（N16 零误杀）**：拦集 ⊆ 判 stale 集（只拦会致 stale 的写）；已结算 / 已取消 / 代码评审 /
  射程外路径 → 放行（用例成对断言）。
- **批次档覆盖（口径明示）**：经既有纪律——批次档列入 `documents`（ENGINEERING-MODE §2.20：「批次档本身在
  documents 清单里」）即入判 stale / 拦截射程；未列入则两面同界不覆盖（同源口径——不单边扩大）。**不豁免**
  （与 CLI E-表 3 同裁定：批次档 = 评审对象，在途改 = 对象变更）。

**（d）点火回执冻结句（逐字——设计评审 ack 追加；代码评审 ack 零改）**

```
；D5 冻结窗口：被审文档（含批次档）在报告送达前零写入——在途写入会被拒绝，写入将使本轮结算为陈旧 (pass 不发 token)
```

落点 = `src/agent-tools/advisor.mjs` 异步分支 ack 串尾（design 分支）。

**（e）残余（如实登记——与 CLI E-6 同族，本端实况）**

`FILE_MUTATORS` 之外的可写通道（bash / execute / git / checkpoint / file_ops / batch_segment）不记变更事件
⇒ 既不判 stale 也不拦（既有边界）；子代理磁盘合入（`mergeChildMutations` → `recordFileMutation`）在途可致
stale 但预闸不可达（子代理写不落父侧预闸）；同步评审（`async:false`）不落池——无在途窗口语义（E 面只覆盖
async 点火路径；同步评审阻塞回合、父侧无并发写时刻）。

### 14.5 契约三：收敛路径信号（③ / F26——现状锁定，零代码改动）

- 复核结论：原登记（交付披露 ③）「收敛路径不含 Approval Signal」**不成立**——本端三条 design round ≥2
  形态全部携带信号：
  1. rv 实例 + prior（async 修正轮）→ `main.mjs:296-312` 收敛分支 + `:308` tokenBlock 尾包；
  2. sync + 持久 prior（`_advisorRound ≥ 1` + `_lastAdvisorOutput`）→ 同分支；
  3. rv.round ≥ 2 且无 prior（降级形态）→ `:261-286` 分支 → `buildAdvisorUserMessage` 自愈尾包
     （F19/契约二——第 12 批）。
- `buildAdvisorFollowUp` 本体不含信号 = **设计使然**：它是纯构建器（无 token 参数），信号由调用面以评审参数
  注入（评审参数 ≠ 模型输出——与 F20 定锚同口径）；CLI 同构（CLI `src/advisor.mjs:279`）。
- 本批动作 = **回归锁**（T-VG21——覆盖前两形态；第三形态（rv.round≥2 无 prior 降级）由既有 T-VG7 的 `buildAdvisorUserMessage` 自愈锁（`messages.mjs:274-275`）覆盖）+ 登记描述原位更正（§13.10）——防未来按错误描述重开评估。
- 残余：直接调用 `buildAdvisorFollowUp` 的外部方（该函数无信号参数）——非产品路径（全仓唯一调用点 =
  `prepareAdvisorMessages`）；CLI 同况（不跨端追赶）。

### 14.6 受影响文件全清单（行数注记 = **当前 → 预计**；口径 = `N lines total`）

**实施域（eng-coder 写域——6 项 = 4 改 + 1 新测档 + 1 登记）**

| # | 文件（VSC 仓） | 行数注记 | 变更 | 档位结论 |
|---|---|---|---|---|
| 1 | `src/advisor/run.mjs` | 221 → ~236 | 启动断言 + `ADVISOR_LAUNCH_REFUSAL_PREFIX` 导出 | ≤300 |
| 2 | `src/agent-tools/advisor-async.mjs` | 463 → ~489 | 冻结冲突 helper（~22）+ 启动拒绝结算消费（~4）——合计 ~26 | ≤500（**贴线注记**：余量 ~11 行——先落 helper 实测行数再落消费项；越 500 须停下报告——不得静默越线） |
| 3 | `src/agent/execute-tools.mjs` | 468 → ~482 | `preGateBlocked` 冻结分支 + `relative` import | <500（>300 存量档） |
| 4 | `src/agent-tools/advisor.mjs` | 321 → ~324 | 设计评审 ack 冻结句 | <500（>300 存量档） |
| 5 | `test/advisor-guard-completion.test.mjs` | 新 → ~170 | T-VG16–T-VG21（6 例） | 新档（≤500；**入 `test/files.mjs` 登记**） |
| 6 | `test/files.mjs` | 54 → 55 | 新测档登记（显式清单 +1） | — |

> 新档说明（**测试档——非文档档**；同款 = 第 12 批 `test/advisor-chain-guards.test.mjs`）：既有同族测试档
> 427 行——追加 ~130 行必越 500 硬帽 ⇒ 新建独立测档（域同族、编号续 T-VG）。若父侧判「不得新建」含测试档
> → 本项停下打回（designer 已留翻转口）。
> 行数锚（as-of）：run 221 · advisor-async 463 · execute-tools 468 · advisor 321 · 同族测档 427 · files 54
> （口径 = `N lines total`——与 §13.5 同）。

**文档域（eng-designer 写域——本设计者已落 / 随批）**

| 文件 | 行数注记 | 变更 |
|---|---|---|
| `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` | 660 → **931（交付后修正轮实测）** | §14 全节 + §13.10 三面原位收口 + §2 载体表 + 变更记录行 |
| `ADVISOR-CONVERGENCE（CLI 仓）` | 197 → **239（本批落档后实测）** | §9（F24–F26 / N16–N18）+ §8 收口注记 |
| `TODO（CLI 仓）` | — | 状态推进（第 12 批两处登记条目 → 在途——池动作） |

### 14.7 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-VGC1 | 面①= **实现**（断言 + 异步结算消费） | 表 1——家族第三层；CLI「不依赖可达性论证」口径；本批目的 = 收口。否决：维持（再登记）· 半机制 |
| D-VGC2 | 面②落点 = `preGateBlocked` 单一预闸点 | 表 2——单一来源 + 权限 / autoApprove 前 + 无旁路。否决：逐项内联 · 面板路径 |
| D-VGC3 | 判据 = 与 `advisorStale` 设计面**全同源（含 legacy 分支）** | 表 3——零误杀 + 零漏拦；跨端差异 3 处（①判官 legacy 分支 / ②面①消费面 / ③事件面形态）全列——登记位：①本条（对照 §14.2 表 3）②§14.3 + §14.11 #2 ③§14.4——D-VG7 族「本端原文自持」 |
| D-VGC4 | 面③= **维持**（登记更正 + 回归锁） | 表 4——缺口不成立（探针实证）；"补齐"无对象 |
| D-VGC5 | 批次档：不豁免、经 documents 纪律入射程 | CLI E-表 3 同裁定；口径 = 同源（不单边扩大——未列 documents 则两面同界） |
| D-VGC6 | 同文字面（D-VG6 族）本批 3 处 = 启动拒绝串 / 冻结拒绝串 / 回执冻结句 | 同文 ≠ 依赖（无同步脚本；各端自持语义锚断言）；两仓用户读到同一指引 |
| D-VGC7 | 残余如实登记（bash / file_ops / execute / git / checkpoint / batch_segment / 子代理合入 / sync 面） | 与 CLI E-6 #2/#3/#5 同族；不静默、不跨端追赶 |
| D-VGC8 | 测档新立（`test/advisor-guard-completion.test.mjs`） | 既有同族档 427 行——追加必越 500（硬约束触发）；非文档档（同款 = 第 12 批） |

### 14.8 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D1 写权矩阵** | 实施 = eng-coder；本设计者只落设计 / 需求 / 批次档（+ TODO 状态推进 = 提示词规定动作） |
| **D2 单一权威源** | 契约详文 = 本节；需求详文 = CLI 需求档 §9；CLI 机制详文 = CLI 设计档 §14.4/§14.14（指针不重述） |
| **D3 计数·枚举** | 三面列表与计数同改；同文字面 3 处枚举；用例 6（T-VG16–T-VG21）· AC 4（AC-VG9–AC-VG12）· 实施域 6 项 |
| **D5 冻结窗口** | §13 已交付契约零碰（本批只新增 §14 + §13.10 原位收口）；CLI 仓零改；改动集齐后统一入场 |
| **D6 回读核对** | 设计落档后回读核实（本节 + §13.10 + 需求 §9 + §2）；实施面验收含读回断言 |
| **D7 变更留痕** | 本节落档 + 变更记录行（本批）；TODO 状态推进（池） |
| **凭证不落档** | 全文零 token / designId 值（占位符形态） |
| **多实现面纪律（双端）** | 语义同源 + 本端原文自持；差异 3 处如实登记（D-VGC3 判官 legacy 分支 / 面①消费面 / 事件面形态） |
| **R24a/R24b 行数与档位** | §14.6 逐文件当前行数 + 预计增量 + 档位（advisor-async 贴线注记——越线停下报告） |
| **文档宽度 / 一致性** | 两仓 `check-doc-width` 新增违规 0 + 新增超宽 0（改动后实跑） |

### 14.9 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-VG16 | 错误 | `runAdvisorReview(agent, "design", {}, null, ["docs/design/X.md"], …)`（无 token 直调；agent 桩含 `_provider`） | 返回以 `Advisor: design review launch refused` 开头；含 `no design token was minted`；零请求（未触 provider）；槽零写 | F24 / AC-VG9 |
| T-VG17 | 边界 | async 结算：entry.report = 拒绝报告串；对照 = 普通 design 报告 | 前者 `_calledAdvisorThisRun` 保持 false；对照组照常置位（零回归） | F24 / AC-VG9 |
| T-VG18 | 正常 | `inflightDesignReviewConflict`：running design entry（`documents=[X]`）× wanted=[abs(X)]；负向族 = 已结算 / 已取消 / code 评审 / 射程外路径 / 空池 | 命中 `{id, path}`；负向族全 null | F25 / N16 / AC-VG10 |
| T-VG19 | 错误 | `executeToolBatches` 集成：在途设计评审 × `write` → 射程内档；对照 = 射程外写 | 结果逐字含 `write refused — design review` + `action:'cancel'` 指引 + 评审 id；**文件零落地**（读回断言）；对照写放行（成对） | F25 / N17 / AC-VG10 |
| T-VG20 | 边界 | `advisorTool.execute`（design；`ctx.runAdvisorReview` seam = pending promise）× 对照 code | ack 含冻结句（`D5 冻结窗口` 逐字）；code ack 不含（不对称锁定；零真实 LLM / 零挂起句柄） | F25 / N17 / AC-VG11 |
| T-VG21 | 正常 | `prepareAdvisorMessages`：design + rv={round:2, priorOutput}（RV 形态）/ sync 持久 prior 形态 | user 消息含 `## Approval Signal` + 逐字 `[DESIGN-TOKEN:{token}` + designId；各恰一次（无重复）——现状锁定（零代码改动） | F26 / AC-VG12 |

> 测试基建：零网络 / 零真实 LLM / 零长等待（T-VG20 seam = pending promise——不 settle、无副作用）；
> T-VG19 经 `executeToolBatches`（autoApprove 夹具短路权限——预闸不受影响）；新档登记 `test/files.mjs` 后随
> `npm test` 快层跑。

### 14.10 验收标准（逐条回指需求——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-VG9 | 启动断言：T-VG16 / T-VG17 绿（行为面逐字断言保留）；拒绝前缀 `Advisor: design review launch refused` 实现 grep——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；正常链零回归（既有 design 用例全绿）；拒绝不写槽 / 不写 prior | F24 |
| AC-VG10 | 冻结拦截：T-VG18 / T-VG19 绿（行为面）；拒绝文案锚（`write refused — design review` + `D5 freeze window` + `action:'cancel'`）grep——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；被拒写入零落地（读回断言）；射程外写放行（成对） | F25 / N16 / N17 |
| AC-VG11 | 边界可观察：T-VG20 绿（行为面）；§14.4（a）定义句与实现锚（`eventsAtLaunch` / `advisorStale` / `settleAdvisorReview`）grep——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1）；回执冻结句逐字在位 | F25 / N17 |
| AC-VG12 | 收敛信号锁定 + 零回归：T-VG21 绿；VSC `npm test` 快层全绿；新档登记 `test/files.mjs`（+1）；行数实测对表（run ≤300 · execute-tools / advisor / advisor-async ≤500——贴线项注记）；两仓 `check-doc-width` 新增违规 0 + 新增超宽 0；CLI 仓代码与已交付面零改动（`git status` 判据） | F26 / N18 |

### 14.11 后续登记项（本批不碰——明示，不静默）

1. **D5 下界定义句同步面**：VSC `src/prompts/discipline-engineering.md`（`:110` D5 行）与
   `docs/design/prompts/discipline-engineering.md` 双源 + VSC `ENGINEERING-MODE.md`——下界定义句入行
   （提示词 / 机制档非本批写域；**登记后续批**——CLI E-6 #1 同族 posture）。
   **（收口 2026-09-11：群 A 批承接——本档 §16.2；CLI 两镜像仍为 CLI 侧另批。）**
2. **VSC 同步记账面拒绝登记**：`execute-tools.mjs:431-442` 对任何 sync advisor 返回置 `_calledAdvisorThisRun`
   （无 `_advisorRefusals` 机制——CLI 既有）——CLI 第 13 批（`record-results`）已裁、VSC 镜像另批评估
   （§13.10 既有登记维持）。**（收口 2026-09-11：群 A 批承接——本档 §16.1。）**
3. **同步评审（`async:false`）无在途窗口**：E 面只覆盖 async 点火路径——若后续需要，另评估。
4. **子代理合入面（预闸不可达）与 bash / file_ops 盲区**：与 CLI E-6 #3/#5 同族——登记后续评估。**（收口 2026-09-11：群 B 批承接——本档 §17.2（file_ops 拦 + 记 / batch_segment 记；其余面逐条登记）。）**
5. **async 结算面 launchRefused 残留**：launchRefused 报告在 async 结算面仍写 priorOutput + 推 record.round 0→1（与 CLI 对位一致）——后续批评估（消费点守卫 vs 结算语义本体修订）。**（收口 2026-09-11：群 B 批承接——本档 §17.1（消费点守卫选定；CLI 对位登记 `ADVISOR-CONVERGENCE（CLI 仓）§18.4`）。）**

### 14.12 边界（本批不做）

- 不改 CLI 仓（实施面与已交付面零碰）；不重开第 12 批已闭项；不碰 §7 / §12 / §13.4 契约文本
- 不改 `advisorStale` / 变更记账 / 结算语义本体（helper 独立实现、语义同源）；不改评审语义判据 / 评审侧
  提示词 / 凭证机制本体 / cap 语义
- 不覆盖 `FILE_MUTATORS` 之外写入面；不拦代码评审在途写；不引入节级快照 / 自动取消 / 自动重发
- 不改提示词与 ENGINEERING-MODE 档（D5 定义句同步 = 登记 §14.11 #1）
- **零 UI 面**（拒绝串落工具返回值、冻结句落 ack 文本——无面板 / webview 改动；无 `open` 项）

## 15. 评审上下文预算跟随模型窗口（VSC——120K 硬编码退场）

> 来源：批次档 `2026-09-11-ADVISOR-BUDGET-VSC-MIRROR`（CLI 仓 docs/batches）§1——用户 2026-09-11 13:18
> 「120K 那个是 bug…你检查一下」的 **VSC 镜像面**（CLI 第 25 批对位批）。语义源（CLI 侧）：设计档
> `ADVISOR-CONVERGENCE（CLI 仓）§16`（比例式派生 / 契约 / OOM 论证 / D-CB1–D-CB9 / T-CB1–T-CB5（T-CB6 已退场——整删；删除记录 = `TESTING（CLI 仓）§11.3`）/ AC-CB1–AC-CB5）；
> 需求 = `docs/requirements/ADVISOR-CONVERGENCE（CLI 仓）§10`（F27 / N19——**指针不重述**）。
> **冻结面**：本档 §13 / §14 已交付契约文本零碰；CLI 仓零写入；本批只新增本节 + §2 载体表同步 + 变更记录行。
> **镜像口径**：语义同源、本端原文自持、不做 byte-identical、零跨仓依赖（无 import / 无同步脚本）——一致由
> 本端语义锚断言守；差异逐点登记（§15.7——语义差异 = 零；形态差异 3 处）。**批次号**：档内引用以批次档路径为准。

### 15.0 裁定摘要（批次 §1 五问）

| # | 问题 | 裁定（详文见对应小节） |
|---|---|---|
| 1 | 派生实现面（语义对齐 + 本端形态） | `providerSpec` 经 `../specs.mjs` 现成面（本模块惯例——`loop.mjs:17` 同源）；`advisorContextBudget(provider)` 单参数、两档命名 `{limit, compactAt}` 照 CLI；OOM = 本端一句 + CLI 指针——§15.3 表 1 / §15.4 / §15.6 |
| 2 | 两处消费点逐点落法 | 循环体外一次性派生 `const budget = advisorContextBudget(provider)`；`loop.mjs:116` → `budget.compactAt`；`:121` → `budget.limit`——§15.5 |
| 3 | 受影响文件 / 用例 / AC | 实施域 4 项（2 改 + 1 新测档 + 1 登记）；T-CB1–T-CB5 同型化（T-CB6 已退场——整删，删除记录 = `TESTING.md` §8.1（`:118`））；AC-CB1–AC-CB5 回指 F27 / N19——§15.8 / §15.11 / §15.12 |
| 4 | 与 CLI 语义差异 | **零语义差异**（逐面核对 §15.7）；形态差异 3 处如实注 |
| 5 | 纪律核对 | 双端纪律 / 既有锁零伤（常量消费面仅 `loop.mjs`；测试零引用）/ `test/files.mjs` 登记——§15.10 |

### 15.1 需求层（指针 + 对位索引）

**总体需求**（详文 = `docs/requirements/ADVISOR-CONVERGENCE（CLI 仓）§10`，本端不重述）：评审循环的上下文预算由
本次评审所用模型的**实际窗口**派生——两档（压缩触发 / 判死线）均比例式；预算只是宿主机自限线，不替代服务端
窗口约束（判定族与截断尾语义零改）。

| 本批需求（CLI 侧文档 ID） | 语义标题 | 对位（CLI 第 25 批） |
|---|---|---|
| F27 | 预算派生（评审上下文——双端同源）的 **VSC 端** | 设计档 §16.3 / §16.9（T-CB1–T-CB5；T-CB6 已退场——整删，删除记录 = `TESTING.md` §8.1（`:118`）） |
| N19 | 零回归 + 可机判（VSC 端） | 设计档 §16.10（AC-CB1–AC-CB5） |

- 判定句（执行面）：需求 §10.2 F27 行三段——① 1M 大窗在 ~19.7 万 tokens 下**不再**判死 ② 128K / 未知模型
  同量上下文**仍**截断 ③ provider 级覆盖**双向**翻转——本档 §15.11 逐条同型化（T-CB2 / T-CB3 / T-CB4）。
- 本批**零写入**需求档：§10 为第 25 批已落（批次 §1 裁定「引用不重述」——双端同源需求单载体）；其 §10.4
  「VSC 镜像随批」登记行的收口 = 父侧排程（§15.13 #1）。
- **明确不做（提要——详 §15.13）**：不改判定族六 kind / 六条尾文案 / 压缩本体 / 结算·凭证·超时语义；
  不改 `estimateTokens`；不新增 advisor 专属配置项；不碰 CLI 仓与 §13 / §14 已交付契约。

### 15.2 问题陈述（现场复核——file:line 为 as-of 2026-09-11，本端）

1. **缺陷（同款）**：`src/advisor/compaction.mjs:18`——`export const MAX_CONTEXT_TOKENS = 120_000`
   （注释 `Reserve headroom to avoid OOM`；CLI 第 25 批逐字同款——128K 时代遗留，本端主力模型同为 1M 档位）。
2. **守卫链（同款）**：`src/advisor/loop.mjs:116`（`currentTokens > MAX_CONTEXT_TOKENS * 0.8` → 本地压缩）+
   `:121`（压缩后仍 `> MAX_CONTEXT_TOKENS` → `Advisor: context window limit reached …` 判死尾）。CLI 侧实证死因
   `(120225 tokens)` 与该常量逐字吻合 ⇒ 1M 窗口模型被硬帽限死在 ~12% 窗口处（缺陷本体 = 上限来源，非守卫结构）。
3. **窗口真值源（现成）**：`providerSpec(provider)`（`src/config.mjs:142-149`——模型表前缀命中 + provider 级
   `context`（K 单位 ×1024）覆盖；非法值 / 缺省 → 模型表原值；未知模型 → 一次性告警 + `DEFAULT_SPEC` 128K）
   经 `src/specs.mjs:5` re-export——本批接线面（§15.3 表 1）。
4. **接线可达性**：评审循环所持 `provider` 即评审真实 provider（`src/advisor/run.mjs:137` `resolveAdvisorProvider(agent)`
   → `:181` 传入循环）；且循环已在该 provider 上消费 `specForModel`（`loop.mjs:202`，reasoningEcho 判定）——派生值就地可得。
5. **同族同款（本端）**：主循环阈值跟随窗口——`src/compact.mjs:51-54`（压缩阈值 = 窗口 × 60%）、`src/compact.mjs:98-99`
   （尾预算 = 窗口 × 15% − 摘要段估算）——「阈值跟随窗口」为本端既有惯例（CLI 同族同口径 = 其 §16.1 四条）。
6. **消费面（grep 实测）**：`MAX_CONTEXT_TOKENS` 在 VSC 仓定义 1 处（`compaction.mjs:18`）+ 导入与使用 2 处
   （`loop.mjs:22/116/121`）；`run.mjs:19-20` 的 re-export 面**不含**该常量——替换零外溢。
7. **既有锁零伤**：`test/advisor-chain-guards.test.mjs`（T-VG1–T-VG15）与 `test/advisor-guard-completion.test.mjs`
   （T-VG16–T-VG21）零引用该常量；AC-VG3 的 grep 锚 `compactMessages(messages, pinned)`（`loop.mjs:120` 调用点）
   原位不动 ⇒ 继续命中。

### 15.3 方案选型对比

> 判死线式样（比例式 = 窗口 × 0.8）与两档关系（触发 = 判死线 × 0.8）为**同源硬约束**——语义源
> `ADVISOR-CONVERGENCE（CLI 仓）§16.2 表 1` 与 D-CB1 / D-CB4（指针不重述），本端不重开选型。
> 本端开放的落法选择 = 接线面与常量处置（下表两表）。

**表 1——接线面（派生值从哪取）**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **`providerSpec` 经 `../specs.mjs`** | 与 CLI 同真值源（模型表 × provider 级覆盖）；本模块惯例——`loop.mjs:17` 的 `specForModel` 同面；零新参数 / 零新配置面 | 派生结果无回显面——以纯函数单测 + provider 覆盖双向用例锁（T-CB1 / T-CB4） | **选定** |
| 2 | `../config.mjs` 直连（同函数另一再导出面） | 同一函数对象、语义零差；但与本模块既有 import 惯例（specs.mjs 面）不一致——跨端对读多一处形式歧义 | — | 否决（无收益的形式偏离） |
| 3 | 循环入口注入（`runAdvisorReview` 算好传入） | 显式可测；但派生逻辑两处（生产 + 测试）需同步，且要动 11 参签名；循环所持 provider 即评审真实 provider ⇒ 注入 = 重复派生 | — | 否决（CLI D-CB2 同款否决） |

**表 2——常量处置**

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | **原地替换**（`MAX_CONTEXT_TOKENS` 退场，不留别名） | 本端消费面仅 `loop.mjs`（grep 实测）；留别名 = 双源漂移（D2） | 与 CLI D-CB5 同源 | **选定** |
| 2 | 保留常量 + 并列新函数 | 旧帽仍在，随时被误用 | — | 否决 |
| 3 | 保留别名（旧常量名指向新派生） | 常量语义从「绝对帽」变「函数」——误导 | — | 否决 |

### 15.4 契约一：预算派生（本端原文——逐字函数语义）

`src/advisor/compaction.mjs` 限额族内：`MAX_CONTEXT_TOKENS` **退场**，新增常量与纯函数（`providerSpec` 自
`../specs.mjs` 导入——与 `loop.mjs:17` 同源面）：

```js
// 上下文预算（第 26 批——120K 硬编码退场）：预算跟随评审模型窗口（providerSpec：
// 模型规格表 × provider 级 context 覆盖）。头寸用途 = chars/4 估算误差 + 响应/协议开销
// （内存不构成约束——本档 §15.6）；判死线仍是宿主机自限线，服务端窗口约束不变。
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

- **回退链**：未知模型 → `specForModel` 一次性告警 + `DEFAULT_SPEC`（`config.mjs:93`，语义零改）；`provider` 为
  `null` 时 `providerSpec` 退化默认（`config.mjs:142-149` 总函数）——派生不抛错。
- **量纲**：窗口为 tokens；`providers[].context` 的 K 单位 ×1024 转换只发生在 `providerSpec` 内（零重复转换）。
- **导出面**：`CONTEXT_LIMIT_RATIO` 导出（与 CLI 契约同形——跨端对读 / 机测系数）；`COMPACT_TRIGGER_RATIO`
  模块内私有（CLI 同形）——否决：两系数全私有（无收益的跨端形式偏离——D-CBV3）。
- **两档语义**：`compactAt` = 触发本地裁剪（`compactMessages`，规则零改）；`limit` = 压缩后仍超即判死（`context_limit`）。
  两者关系（×0.8）与现状**逐字同源**——本批只换「上限从哪来」，不换「如何比较」；守卫分支结构（if / 二次估算 /
  尾形态）零改。**语义对齐声明**：判死线 / 触发 / 两档关系 / 回退链 / 消费点语义与 CLI §16.3 契约同源
  （逐面核对 = §15.7）；本端文本自持，不做 byte-identical。

### 15.5 契约二：循环侧两处消费（逐点落法）

循环体外一次性派生：`const budget = advisorContextBudget(provider)`（provider 为循环参数、全场不变；落点 =
`startTime` 初始化同区带）。逐点：

| # | 消费点 | 现状（as-of 行位） | 改后 | 语义 |
|---|---|---|---|---|
| 1 | 压缩触发 | `loop.mjs:116`——`currentTokens > MAX_CONTEXT_TOKENS * 0.8` | `currentTokens > budget.compactAt` | 触发线 = 判死线 × 0.8（关系零改） |
| 2 | 判死 | `loop.mjs:121`——`estimateTokens(messages) > MAX_CONTEXT_TOKENS` | `estimateTokens(messages) > budget.limit` | 压缩后仍超 ⇒ `context_limit` 尾（逐字零改） |

- 导入面：`loop.mjs:20-24` 导入块——`MAX_CONTEXT_TOKENS` 退场、`advisorContextBudget` 入列（同块其余零改）。
- **零改余项**（逐字不动）：`[Context compacted:` 提示（`:117`）、`compactMessages(messages, pinned)` 调用点
  （`:120`）、二次估算与分支结构、判死尾文案（`:124`）、`turns` / `toolCallCount` / `reviewTextProduced` 计数、
  超时 / 中止 / 硬墙面（§13.4 契约五）。
- 二次估算语义：判死检查读**压缩后**计数（既有注释 `:122-123` 语义零改）。

### 15.6 OOM 论证（本端一句 + 指针）

预算上限量的**内存不构成约束**：1M tokens ↔ `estimateTokens` 口径 ~4M 字符 ↔ JS 字符串 ~8MB（UTF-16）+
单请求 JSON 瞬时副本，与 Node 默认堆相差两个数量级；真正的内存边界已由 `MAX_RESULT_CHARS = 64K`
（`compaction.mjs:21`）与压缩后**有界集**（`compactMessages`——system + 压缩注记 + 定锚 + 最近 20 条）承担。
20% 头寸的真实用途 = `chars/4` 估算误差（CJK 低估）+ 响应 / 协议开销 + 宿主机自限线 < 服务端真窗。
**完整论证 = `ADVISOR-CONVERGENCE（CLI 仓）§16.4`（指针不重述——D2）**——本端只作一句等义论证；残余
（4× 级 CJK 低估不可完全覆盖）同 CLI §16.4 #6：服务端拒绝仍是兜底，可见失败、不静默。

### 15.7 语义差异声明（与 CLI 对照——预期零语义差异）

| 语义面 | 本端落法 | 与 CLI 对照判定 |
|---|---|---|
| 判死线式样 | `floor(窗口 × 0.8)` | 同源（CLI §16.3） |
| 触发式样 | 触发 = 判死线 × 0.8（旧关系保持） | 同源 |
| 函数签名 / 两档命名 | `advisorContextBudget(provider)` → `{limit, compactAt}` | 照 CLI（批次 §1 裁定「单参数 / 两档命名照 CLI」） |
| 回退链 | 未知模型 → 告警一次 + 128K 默认；`null` → 默认（总函数） | 同源（形态差异见 #2——实测等价） |
| 消费点语义 | 两处比较换值、分支结构零改 | 同源 |
| 尾文案 / 判定族 | `Advisor: context window limit reached (…)` 逐字零改 | 同源 |

**形态差异（如实登记——非语义差异；差异 3 处）**：

1. **导入面**：本端 `../specs.mjs`（re-export 面）vs CLI `../config.mjs`——同一函数对象；本端模块惯例
   （`loop.mjs:17` 的 `specForModel` 同面）。
2. **`providerSpec` 实现形**：本端 `config.mjs:142-149` 对 `context == null` 提前返回；CLI `model-specs.mjs:174-179`
   经 `Number()` + NaN 兜底——实测等价（非法 / 缺省 / `null` 三态均回落模型表原值；整数 > 0 → ×1024）。
3. **文本与行位自持**：注释与行号为 VSC 原文（非逐字拷贝）；一致由本端 T-CB1–T-CB5 断言守（T-CB6 已退场——整删，删除记录 = `TESTING.md` §8.1（`:118`））。

### 15.8 受影响文件全清单（行数注记 = 当前 → 预计；口径 = `N lines total`）

**实施域（eng-coder 写域——4 项 = 2 改 + 1 新测档 + 1 登记）**

| # | 文件（VSC 仓） | 行数注记 | 变更 | 档位结论 |
|---|---|---|---|---|
| 1 | `src/advisor/compaction.mjs` | 160 → ~176 | 常量退场 + 预算纯函数 + `providerSpec` 导入 | ≤300 ✓（余量充裕） |
| 2 | `src/advisor/loop.mjs` | 278 → ~280 | 导入换名 + 预算一次性派生 + 两处消费 | ≤300 ✓（余量 ~20；越 300 须停下报告——不硬压行） |
| 3 | `test/advisor-context-budget.test.mjs` | 新 → ~130–140 | T-CB1–T-CB5（5 例在役；T-CB6 已退场——整删，删除记录 = `TESTING.md` §8.1（`:118`）） | 新档（≤500；**入 `test/files.mjs` 登记**） |
| 4 | `test/files.mjs` | 55 → 56 | 新测档登记（显式清单 +1） | — |

**文档域（eng-designer 写域——本设计者已落）**

| 文件 | 行数注记 | 变更 |
|---|---|---|
| `docs/design/ADVISOR-CONVERGENCE.md`（VSC 仓） | 931 → **1185（本批落档后实测）** | 本节 §15 全节 + §2 载体表 + 变更记录行 |

> 行数锚（as-of）：compaction 160 · loop 278 · files 55 · 同族测档 427（`advisor-chain-guards`）/ 221
> （`advisor-guard-completion`）——本批零改。测试基建：VSC 为**显式清单**（`test/files.mjs`——不登记不跑）；
> 新用例零网络 / 零真实 LLM（循环 `seams.chat` 覆写）/ 零长等待（字符串夹具——微秒级，slow-gate 零命中）。

### 15.9 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CBV1 | 预算式样 = **CLI §16 同源硬约束**（比例式 + ×0.8 关系） | 双端同源纪律 + 批次 §1；语义源 D-CB1 / D-CB4（指针）。否决：本端另行设计（违同源）——开放落法选择见 §15.3 两表 |
| D-CBV2 | 接线面 = `providerSpec` 经 `../specs.mjs` | 表 1——本模块惯例 + 同真值源。否决：`../config.mjs` 直连 · 入口注入 |
| D-CBV3 | 导出形态照 CLI（`CONTEXT_LIMIT_RATIO` 导出 / `COMPACT_TRIGGER_RATIO` 私有） | 跨端对读零歧义 + 契约面同形。否决：两系数全私有（无收益的形式偏离） |
| D-CBV4 | **原地替换常量、零别名** | 表 2——消费面 grep 实测单点。否决：别名 / 保留常量 + 并列函数 |
| D-CBV5 | 128K 档线位变化**采纳**（触发 96K → 81.92K；判死 120K → 102.4K） | CLI D-CB6 同源理由（现状 93.75% 窗占比对估算误差无头寸）；本端独立复核：`providerSpec` 语义一致 ⇒ 同结论 |
| D-CBV6 | 判定族 / 尾文案 / 压缩规则**零改** | 缺陷本体是「上限来源」；§13.4 契约四已被 T-VG1–T-VG15 锁 |
| D-CBV7 | **不新增 advisor 专用配置项** | 覆盖能力已由 `providers[].context` 提供（`config.mjs:142-149`）；advisor 专属旋钮 = 第二真值源（CLI D-CB3 同款） |
| D-CBV8 | 测试档**独立新立** + `test/files.mjs` 登记 | VSC 显式清单纪律（不登记不跑）；新档 ≤500（同口径 §13.5 #9 / #11） |
| D-CBV9 | 本批 **VSC 单端**；CLI 仓零写入 | 各端独立实现纪律；CLI 档登记收口 = 父侧（§15.13 #1 / #2） |

### 15.10 与既有纪律的冲突点核对

| 纪律 / 既有节 | 核对结论 |
|---|---|
| **D1 写权矩阵** | 实施 = eng-coder；本设计者只落本档 §15 + §2 + 变更记录 + 批次档 §2（任务书） |
| **D2 单一权威源** | 契约详文 = 本节；CLI 机制详文 = `ADVISOR-CONVERGENCE（CLI 仓）§16`（指针不重述）；窗口语义 = `PROVIDER（CLI 仓）§15`（只引用） |
| **D3 计数·枚举** | 用例 6 · AC 5 · 契约 2 条 · 实施域 4 项 · 形态差异 3 处——列表与计数同改（本行与各表一致） |
| **D5 冻结窗口** | 本档 §13 / §14 已交付契约零碰；CLI 仓零写入；改动集齐后统一入场 |
| **D6 回读核对** | 本节 + §2 + 变更记录落档后回读核实；实施面验收含读回断言（T-CB6——已退场：整删，删除记录 = `TESTING.md` §8.1（`:118`）） |
| **D7 变更留痕** | 本档变更记录一行（本批）+ 批次档 §2（任务书） |
| **凭证不落档** | 全文零 token / designId 值 |
| **多实现面纪律（双端）** | 语义同源 + 本端原文自持；不做 byte-identical、不建依赖；差异 3 处如实登记（§15.7） |
| **R24a/R24b 行数与档位** | §15.8 逐文件当前行数 + 预计增量 + 档位（loop 注记越线停下） |
| **文档宽度 / 一致性** | VSC 仓 `check-doc-width` 宽度 + V1/V2 新增违规 0（落档后实跑） |
| **判定族 / §13.4 契约四** | 六 kind 前缀与六条尾文案逐字零改；kind 表指针（`loop.mjs` 溢出尾——文件不变）不受影响；T-VG1 既有回归锁继续绿 |
| **§14.6 超时语义** | `agent.advisor.timeoutMs` 零改；预算（token）与墙钟（时间）两维正交 |
| **主循环阈值** | 主循环压缩阈值（`src/compact.mjs`——60% 窗口）与评审预算职责不同——不合并、不同步（CLI 同裁定） |

### 15.11 测试层：用例表（正常 / 边界 / 错误）

| 用例 | 类别 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-CB1 | 正常 | 纯函数 `advisorContextBudget(x)`：1M 模型 / 128K 模型 / 未知模型名 / provider 级 `context:64` / `null` | `{limit:800_000, compactAt:640_000}`；`{102_400, 81_920}`（128K）；未知 → 回退同值；`{52_428, 41_942}`；`null` → 默认回退不抛（五组逐一断言） | F27 |
| T-CB2 | 错误（回归锁） | `_runAdvisorToolLoop` + 1M 模型 provider + ~19.7 万 tokens 上下文（12 × 64K 字符工具结果，消息数 ≤20）+ `seams.chat` 返回终稿 | 输出**不含** `Advisor: context window limit`；含终稿文本；`advisorIncompleteMarker(out) === null`（改前该形态必判死——120K 帽） | F27 |
| T-CB3 | 对照 | 同上下文 + 128K 模型 provider；同上下文 + 未知模型名 provider | 两者均以截断尾收尾（族前缀 `Advisor: context window limit reached (` 逐字）；`advisorIncompleteMarker → "context_limit"`（机械线不失效 + 未知模型回退判据） | F27 |
| T-CB4 | 边界 | 同上下文 + `{model:"deepseek-flash", context:64}`（收紧）；同上下文 + `{model:"glm-4", context:1024}`（放宽） | 前者判死、后者不判死（**同量上下文两结果**——provider 级覆盖双向生效，证 `providerSpec` 接线面而非 `specForModel` 单源） | F27 |
| T-CB5 | 边界 | 1M 模型 provider + ~73.7 万 tokens（45 × 64K 字符工具结果——消息数 > 20，触发压缩真裁剪） | 输出含 `[Context compacted:`（派生触发线在位）且不含截断尾；压缩后估算 < 判死线（就地断言 `estimateTokens(messages) < 800_000`）；评审正常收尾 | F27 |
| T-CB6 | 正常（静态锚） | — | 已退场（整删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1（`:118`）） | F27 / N19 |

> 测试基建：单测零网络（循环 `seams.chat` 覆写——`??` 默认回退，生产路径不可达）、零真实 LLM、零长等待
> （字符串夹具——微秒级）；新档入 `test/files.mjs` 登记后随 `npm test` 快层跑。

### 15.12 验收标准（逐条回指——每条可机器验证）

| AC | 验收内容（机判） | 回指 |
|---|---|---|
| AC-CB1 | 派生与两档：T-CB1 绿（五组输入 × `{limit, compactAt}` 逐断言 + 确定性）；`advisorContextBudget` 纯函数静态面（`compaction.mjs` 内无 I/O、无状态写入）——已退场（段删——2026-09-12-PROSE-ANCHOR-RETIRE；删除记录 = `TESTING.md` §8.1） | F27 |
| AC-CB2 | 核心缺陷闭合：T-CB2 绿（1M 模型 ~19.7 万 tokens **不以** `context_limit` 收尾）+ T-CB3 绿（128K / 未知模型同量上下文仍以截断尾收尾——机械线与回退判据双锁） | F27 |
| AC-CB3 | 接线面 = `providerSpec`：T-CB4 绿（provider 级 `context` 覆盖**双向**翻转判定结果） | F27 |
| AC-CB4 | 零回归：T-CB5 绿（派生触发线在位）；既有 `advisor-chain-guards`（T-VG1–T-VG15）+ `advisor-guard-completion`（T-VG16–T-VG21）全绿；`npm test` 快层全绿；CLI 仓零改动（`git status` 判据） | N19 |
| AC-CB5 | 文档-实现一致 + 旧帽退场：旧帽面随 T-CB6 整删退场（删除记录 = `TESTING.md` §8.1（`:118`））；VSC 仓 `node scripts/check-doc-width.mjs` 新增违规 0（宽度 + V1/V2） | N19 |

### 15.13 边界（本批不做 + 登记项）

- 不改判定族六 kind 与六条尾文案、不改压缩算法本体（最近 20 条 + 定锚重挂）、不改结算 / 凭证 / 超时语义
- 不改 `estimateTokens` 估算式（登记 #4）；不新增 advisor 专属配置项（D-CBV7）
- 不碰本档 §7 / §12 / §13 / §14 已交付契约文本；CLI 仓零写入（实施面与文档面——D-CBV9）
- **零 UI 面**（提示 / 尾 / 报告均落评审文本与工具返回值内——无面板 / webview 改动；无 `open` 项）
- **登记项（父侧排程——本设计者不写）**：
  1. `docs/requirements/ADVISOR-CONVERGENCE（CLI 仓）§10.4` 的「VSC 镜像随批」登记行收口（1 行注记——父侧 / 收口批）
  2. `ADVISOR-CONVERGENCE（CLI 仓）§16.8 #1`（VSC 端镜像登记）同款收口（1 行）
  3. `docs/TODO.md` 需求池行状态推进（CLI 仓——父侧写域；CLI §16.8 #4 已注）
  4. `estimateTokens` CJK 低估修正（CLI §16.8 #2 同族——另批评估）

**计数（D3）**：用例 6（编号 T-CB1–T-CB6；在役 5——T-CB6 已退场，删除记录 = `TESTING.md` §8.1（`:118`））· AC 5（AC-CB1–AC-CB5）· 契约 2 条（§15.4 / §15.5）· 实施域 4 项
（2 改 + 1 新测档 + 1 登记）· 文档域 1 档；需求 = F27 / N19（§10，CLI 仓）。

## 16. 同源镜像收口（群 A——同步记账拒绝登记 + D5 下界定义句同步）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1（A6 / A7——来源指针 = 本档 §14.11 #2 / #1）。
> 语义源：CLI 侧第 13 批（同步记账拒绝登记——CLI `record-results` 消费同谓词）与 CLI §14.14（窗口定义——本端对位 = 本档 §14.4（a））。
> 双端纪律：语义同源、本端原文自持、零跨仓依赖（不做 byte-identical、不建同步依赖）。
> 冻结面：本档 §7 / §12 / §13 / §14 已交付契约文本零碰（§14.11 #1/#2 为原位收口注——§16.3）；CLI 仓零写入。

### 16.1 条目 A6：同步记账面拒绝登记（`_advisorRefused`——CLI `_advisorRefusals` 语义镜像）

**问题（现状——as-of 2026-09-11）**：`src/agent/execute-tools.mjs` 同步记账块（as-of `:447-457`）对任何 sync advisor 返回一律置
`_calledAdvisorThisRun = true` 并推 `_advisorRound`——**被拒绝的评审（未跑）被记为「已评审」**：guard 不再推回、轮次被无谓消耗。
CLI 第 13 批已裁（refused launch 既不记调用也不记轮次）；本端缺该机制（§14.11 #2 登记）。

**拒绝类清单（本端——逐点 as-of，实现时以重扫为准）**：

| # | 拒绝点 | 现状行为 | 处置 |
|---|---|---|---|
| 1 | `src/agent-tools/advisor.mjs:197`（async 只限 depth-0——depth>0 显式 async 拒） | 返回拒文；记账分支按 `advisorAsync` 谓词通常跳过 | 登记（统一形态） |
| 2 | `:213`（code 评审无 scope） | 返回拒文；sync 路径被误记 | 登记（本类核心） |
| 3 | `:223`（design 文档非法） | 同上 | 登记（本类核心） |
| 4 | `:240`（async 启动拒——`launchAsyncAdvisor` 返回 `r.error`：池满 / 同 scope 等） | 返回拒文；记账通常跳过 | 登记（统一形态） |
| 5 | sync 启动拒（`runAdvisorReview` 返回 `ADVISOR_LAUNCH_REFUSAL_PREFIX` 开头——`src/advisor/run.mjs:153`） | 被误记 | 登记（前缀判定——与 CLI 同款） |
| 6 | sync cap 拒（`src/advisor/run.mjs:120-135`——「convergence cap reached」） | 被误记 | 登记（新增工具层预检——与 CLI 同位同谓词） |

**载体（VSC 自持形态——语义同源、实现独立）**：per-call `ctx._advisorRefused = true`（工具调用上下文标记）。
CLI 用 `_toolCallId` + `agent._advisorRefusals` Set；本端无 `_toolCallId` 线程，且消费点与调用点在**同一循环**内（单点消费）——
标记直接落调用上下文，无需 Set 生命周期清理。**载体差异 = 登记项（语义零差）**。

**契约（逐条——实现对象）**：

1. `execute-tools.mjs` 工具调用点：ctx 字面量提升为 `const toolCtx = {...}`（`tool.execute(args, toolCtx)`）——记账块改读 `toolCtx._advisorRefused`；
2. `advisor.mjs` 各拒绝 return 之前置位（#1–#4）；#5 = run 调用后对结果前缀判定（`String(result).startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)`）置位；
3. #6 = 新增工具层 cap 预检（位置 = **async 分支之后、sync 启动之前（sync-only——async 分支先返回，不经此预检）**——与 CLI 同位；**同谓词** = `reviewType !== "design" && (agent._advisorRound || 0) >= MAX_ADVISOR_ROUNDS`），
   返回 `buildCapMessage(agent)` 并置位；
4. `src/advisor/run.mjs`：抽取**导出** `buildCapMessage(agent)`（现值 = `:126-134` 拼装）——`runAdvisorReview` 内部改用同一 builder，**输出逐字零变**（双源消解）；
5. 记账块（sync 分支）：`toolCtx._advisorRefused === true` → **不置 called / 不推 round**（拒绝 = 未跑）；否则既有置位（零回归）。
   async ack 路径零改（既有 `advisorAsync` 谓词继续跳过记账——settle 面记账不动）。

**用例表（T-MA6——正常 / 边界 / 错误）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA6-1 | 错误 | sync code 评审无 scope（stub agent + depth 0 + `async:false`）→ 走记账块 | 拒文原样返回；`_calledAdvisorThisRun === false`；`_advisorRound` 不变 | AC-MA6-1 |
| T-MA6-2 | 错误 | sync design 评审文档非法 | 同上（拒 + 零记账） | AC-MA6-1 |
| T-MA6-3 | 错误 | sync 启动拒（run 返回前缀串——seam 覆写） | 拒文返回；零记账 | AC-MA6-1 |
| T-MA6-4 | 错误 | cap 拒（`_advisorRound = MAX_ADVISOR_ROUNDS` + sync code） | 返回 `buildCapMessage` 逐字；零记账；零 LLM（run 未被调） | AC-MA6-1 |
| T-MA6-5 | 边界 | async 启动拒（池满模拟 `r.error`） | 拒文返回；零记账（既有跳过行为不回归） | AC-MA6-1 |
| T-MA6-6 | 正常 | sync code 评审正常完成（seam 终稿） | `_calledAdvisorThisRun === true`；`_advisorRound` +1（零回归对照） | AC-MA6-2 |
| T-MA6-7 | 边界 | `buildCapMessage` 直调对拍：run.mjs 内部拒绝与工具层预检 | 两处输出逐字相等（builder 单源） | AC-MA6-3 |
| T-MA6-8 | 边界 | async 对照：`_advisorRound = MAX_ADVISOR_ROUNDS` + `async:true` + depth 0 → 走 async 分支 | cap 预检**不触发**（sync-only——无 `buildCapMessage` 文案、零误拒）；async 启动路径照常（seam 判定） | AC-MA6-1 |
| T-MA6-9 | 边界 | async 且 depth>0（显式 async 拒——类 #1；stub agent） | 拒文原样返回；零记账锁定（既有 `advisorAsync` 跳过路径：`_calledAdvisorThisRun === false`、`_advisorRound` 不变） | AC-MA6-1 |

**AC（机判）**：

- AC-MA6-1：T-MA6-1–T-MA6-5 + T-MA6-9 绿（六类拒绝全覆盖：置位否 ∧ 轮次不变 ∧ 文案原样——类 #1 = T-MA6-9 走既有跳过路径）；T-MA6-8 绿（async 对照——cap 预检 sync-only）；
- AC-MA6-2：T-MA6-6 绿（对照零回归——正常 sync 仍记账）；
- AC-MA6-3：T-MA6-7 绿（builder 单源）；既有 `advisor-chain-guards` / `advisor-guard-completion` / `eng-settlement` 族全绿 + VSC 快层全绿。

### 16.2 条目 A7：D5 下界定义句同步（提示词双源 + ENGINEERING-MODE）

**背景（§14.11 #1 原位收口）**：§14.4（a）已定「在途窗口」的机制权威表述（下界 = 报告送达 / 取消·中止；
「子进程退出」不是窗口边界）——但**提示词 D5 行与 ENGINEERING-MODE 未承载该定义**：父侧按「子进程退出 = 安全」执行 →
在途改被审档 → 结算 stale → pass 轮整轮作废（CLI §14.14 E-6 #1 同族 posture——CLI 两镜像另批）。

**落点（逐字——VSC 本端自持；机制权威 = 本档 §14.4（a）——不重述）**：

1. `src/prompts/discipline-engineering.md:110`（D5 行——英文落地）与 `docs/design/prompts/discipline-engineering.md:84`（中文权威）同句行尾追加（两档逐字同文）：

   `**在途下界 = 报告送达（digest 注入 / 回合尾 collect）或取消·中止**——「子进程退出」不是窗口边界；窗口内对被审文件集（设计评审含批次档）零写入——射程内写入会被预闸拒绝（先 cancel → 改动 → 重发）。`

2. `docs/design/ENGINEERING-MODE.md` §6（写文件门禁）新增 bullet：

   `**D5 冻结窗口预闸（第 15 批 §14.4——本端）**：设计评审在途期间，父侧对被审文件集（含批次档）的写入被拒（`preGateBlocked` × `inflightDesignReviewConflict`——拒绝串见 ADVISOR-CONVERGENCE.md §14.4（c））。**在途下界 = 报告送达（digest 注入 / 回合尾 collect）或取消·中止**——「子进程退出」不是窗口边界（窗口 = 点火 → 结算）；逃生门 = 先 cancel → 改动 → 重发。`

**用例表（T-MA7）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA7-1 | 正常 | 双源 `discipline-engineering.md` grep | `在途下界 = 报告送达` 与 `「子进程退出」不是窗口边界` 各命中 1（两档） | AC-MA7-1 |
| T-MA7-2 | 正常 | `ENGINEERING-MODE.md` grep | `D5 冻结窗口预闸` + 上述两子串在位 | AC-MA7-2 |
| T-MA7-3 | 边界 | 宽度检查实跑 | 两档新增行 ≤300 字符；宽度命中集合差 = 0 | AC-MA7-3 |
| T-MA7-4 | 边界（回归） | prompts 测试族实跑 | `prompts-async-guidance` / `prompts-mirror-anchors` / `doc-consistency` 全绿（锚零损） | AC-MA7-3 |

**AC（机判）**：

- AC-MA7-1：T-MA7-1 绿（双源固定子串逐字）；
- AC-MA7-2：T-MA7-2 绿（机制档子串 + §6 承接）；
- AC-MA7-3：T-MA7-3 / T-MA7-4 绿（宽度零新增 + 锚族零回归）+ §14.11 #1 原位收口注在位（§16.3）。

### 16.3 §14.11 登记原位收口（注记——只改登记行，不改 §14 契约正文）

- §14.11 **#1**（D5 下界定义句同步面）→ 收口注：**已承接——本档 §16.2（提示词双源 + ENGINEERING-MODE 三落点；CLI 两镜像另批）**；
- §14.11 **#2**（VSC 同步记账面拒绝登记）→ 收口注：**已承接——本档 §16.1**。

### 16.4 边界（本批不做）

- 不改结算语义本体 / 判定族 / 凭证机制；不改 §14.4 契约正文（#1/#2 只落收口注）；
- 不碰 CLI 仓（实施与文档面零写入；E-6 #1 的 CLI 两镜像 = CLI 侧另批，不追赶）；
- `_toolCallId` 线程不引入（载体取 per-call ctx 标记——语义同源、实现独立）；
- 子代理合入面 / bash 等拒绝盲区（§14.11 #3/#4）不在本批（群 B 承接）；
- **零 UI 面**（全部落工具返回值与 doc/prompt 文本——无面板 / webview 改动；无 `open` 项）。

**计数（D3）**：条目 2（A6 / A7）· 用例 13（T-MA6-1–9 + T-MA7-1–4）· AC 6（AC-MA6-1–3 · AC-MA7-1–3）·
实施域 coder 触面 = `execute-tools.mjs` / `advisor.mjs` / `run.mjs` / 双源 `discipline-engineering.md`（4 档 + 测试）；
设计者已落 = 本档 §16 + §14.11 收口注 + `ENGINEERING-MODE.md` §6 bullet。

## 17. 评审链残留收口（群 B——B2 / B3 / B4-VSC）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-REVIEW-ASYNC-SWEEP（本仓）` §1（B2 = 本档 §14.11 #5 登记复议；B3 = §14.11 #4 登记复议；
> B4 = `ADVISOR-CONVERGENCE（CLI 仓）§16.8 #2` 登记承接）。需求 = `docs/requirements/ADVISOR-CONVERGENCE（CLI 仓）§13`（F30 / F31 / F32 + N22~N24——指针不重述）。
> 分工：B2 / B3 = VSC 单端修（CLI 对位登记——§17.7）；B4 = 双端（语义源 = `ADVISOR-CONVERGENCE（CLI 仓）§18`，本节只写 VSC 面）。
> 冻结面：§7 / §8 / §9 / §13 / §14 已交付契约文本零碰（本批只新增本节 + §14.11 收口注 + §2 载体表同步）；CLI 仓零写入。

**§14.11 复议结论（现场复核——两择一必须有理由）**：

- **#5 → 修（消费点守卫）**：残留实存（见 §17.1 复核）且与「拒发不耗轮次」既有契约相悖（同步面同族语义已由 §16.1 裁定）——
  原「后续批评估」的两候选之选定 = 消费点守卫（否决「结算语义本体修订」：面大于收益，选型见 §17.1）。
- **#4 → 分面处置（三修五登记）**：路径机判完备的写面修复（file_ops 拦 + 记；batch_segment 记）；
  参数外波及面与预闸不可达面维持登记（逐面理由与复核触发见 §17.2 表）。

### 17.1 条目 B2：结算面拒发不记账（消费点守卫）

**问题（复核 as-of 2026-09-11）**：`advisorSettleAccounting`（`src/agent-tools/advisor-async.mjs:345-441`）已对启动拒绝报告做两处守卫——
`_calledAdvisorThisRun` 不置位（`:396-401`——F24/§14.3 语义：未发起 = 无评审产出）；但记录段整段执行：
`record.round = Math.max(record.round ?? 0, entry.round ?? 1)`（`:426-427`——拒绝的新实例 0→1）与 `record.priorOutput`
（拒绝文案 ≥200 字符命中 `looksLikeReview` 启发式——`:430-433`）⇒ **「未发起请求」被记成「有轮次、有前轮输出」**：
后续同 scope 续跑在数值上多耗一轮、prior 上下文被拒文污染（续跑的评审者把拒绝说明当「前轮评审输出」读）。
拒绝可达性 = 防御纵深（工具路径恒签发 token ⇒ 正常链不可达——`src/advisor/run.mjs:41-45` 自注）；但该面的正确性应与
同步面（§16.1：`ctx._advisorRefused` 不记轮）同构。CLI 对位结构同款（`advisor-settle.mjs:133` 无条件 `run.round++` +
`:227-229` prior 写入）——本批零改 CLI（§17.7 登记）。

**选型（两候选——§14.11 #5 原列）**：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| 1 | **消费点守卫**：记录段对 launchRefused 跳过 `round` / `priorOutput` 写入；`state` 仍归 settled | 改动限于写入点；语义 = 「拒绝 ⇒ 无 attempt」——与 §16.1 / cap 预检同构；`state=settled` 保住同 scope 重发通道（不堵死——`:186-188` 同 scope 守卫读 state） | 新拒绝语义点单点（可机判） | **选定** |
| 2 | 结算语义本体修订（拒绝单列早退分支 / 改 state 机） | 「无尝试」语义更纯；但触及 settle 分流本体（pending / _resolve / refill 共享段）与 record.state 词表——面大于收益 | — | 否决 |

**契约（逐条）**：

1. `launchRefused` 判定（`result != null && String(result).startsWith(ADVISOR_LAUNCH_REFUSAL_PREFIX)`——`:396`）上移 `if (!stale)` 块外（无条件求值——语义零变）；
2. 记录段：`if (!launchRefused) { round 推进 + priorOutput 写入 }`；`record.state = "settled"` 保留（可续跑）；
3. 不变式：拒绝结算后 `record.round` / `record.priorOutput` 与结算前**逐值相等**；`_calledAdvisorThisRun` 保持 false（既有）；
4. 报告分支形态零改（拒绝文原样进 digest——模型可见「未发起 + 重发指引」）。

### 17.2 条目 B3：冻结窗口盲区收口（拦 / 判两面）

**现状枚举表（VSC 实况——as-of 2026-09-11）**：

| # | 面 | VSC 实况 | 路径机判 | 陈旧记账 | 处置 |
|---|---|---|---|---|---|
| 1 | bash | `src/tools/shell.mjs`——任意命令 | 不可（参数外） | 无 | 登记（诚实边界——E-6 #3 同族） |
| 2 | execute | `src/tools/execute.mjs`——任意脚本 | 不可 | 无 | 登记（同上） |
| 3 | file_ops | `src/tools/ops.mjs:32-52` move / copy / rename；L3 触达面已派生（`execute-tools.mjs:24-36`：copy→[dest]；move/rename→[source,dest]） | **完备**（动作全集） | 现无 → 本批补 | **修**（契约 1/2） |
| 4 | git | `src/tools/git.mjs` 21 动作；写入面 ref / 索引 / 工作树混合；路参子集仅 checkout(path) / restore / mv；reset / pull / merge / revert / cherry-pick / rebase / apply / stash / clean 波及面在参数外 | **部分** | 无 | 登记（拦 3/21 = 假安全 + 判集无法同闭；复核触发 = 实战在途 git 还原被审档事故） |
| 5 | checkpoint | `src/tools/checkpoint.mjs`——rewind 恢复快照清单内文件（清单在快照内，参数仅 id） | 不可 | 无 | 登记（拦须预闸同步读盘枚举快照——代价 vs 场景不成比例；复核触发同上） |
| 6 | batch_segment | `src/agent-tools/batch-segment.mjs:178-181` 直写绑定批次档（§2 / §5——子代理通道；批次档 ∈ 设计评审 docAbs——§14.4 口径「含批次档」） | 完备（工具自持单一路径） | 现无 → 本批补 | **修**（契约 3） |
| 7 | 子代理合入面 | `mergeChildMutations`（`src/agent-tools/subagent-async.mjs:483-498`）——子代理磁盘写入在完成点合入父侧记账 | 预闸不可达（子代理无父侧评审池面） | **已有 + 本批补 file_ops 支**（合入即记账——随契约 2） | 登记维持（拦面不可达；判面 = FILE_MUTATORS + batch_segment + file_ops 已覆盖（合入即记账）——E-6 #5 同族） |

**契约（逐条）**：

1. **E-扩 1（file_ops 拦）**：`preGateBlocked` 冻结分支（`execute-tools.mjs:113-124`）键扩为 `FILE_MUTATORS.has(toolName) || toolName === "file_ops"`；
   路径提取统一走 `l3TouchedPaths`（`:28-36`——非 file_ops 支与现等价：`tool.touchedPaths` 优先、`[args?.path]` 兜底）；拒绝串逐字复用 §14.4(c)。
2. **E-扩 2（file_ops 记）**：执行成功记账分支（`:347-353`）键同扩——`l3Paths` 全量 `recordFileMutation`（move / rename 记源 + 目标；copy 仅目标）；
   **同点同步把 `l3Paths` 逐项记入 `agent._touchedFiles`**（`includes` 去重守卫——子代理合入载体）——子代理 file_ops 写即随 `mergeChildMutations`
   （`subagent-async.mjs:483-489`：`sink.touchedFiles` → 父侧 `_touchedFiles` + `recordFileMutation`）合入父侧 ⇒ 拦集 ⊆ 判集不变式保持（**CLI** §14.14 E-D6 口径）。
3. **E-扩 3（batch_segment 记）**：`batch-segment.mjs` 写入成功后 `agent._touchedFiles` 记入绑定档绝对路径（`Array.isArray` 守卫——评审实例面可能未挂）；
   子代理完成点经 `mergeChildMutations` 合入父侧变更事件 ⇒ 在途设计评审的 stale 判定覆盖批次档面。
4. **不改**：guard / verify 的 file_ops 记账面（`_mutatedThisRun` / advisor / verify 清除标志——`:411-430` 维持 FILE_MUTATORS 键；登记）；**`_touchedFiles` 除外**——已由契约 2 同点补全（评审轮次 1 #1 落修——子代理合入载体面）；`advisorStale` 判定本体零改（仅数据源扩面）。

### 17.3 条目 B4：评审估算器 CJK 加权（VSC 面）

**问题**：`src/advisor/compaction.mjs:38-44`——`Math.ceil((content.length + toolCalls.length) / 4)` 扁平式；CJK 低估 ~3-4×。
消费点：`src/advisor/loop.mjs:117 / 123 / 126`（compactAt / limit / 判死尾计数）+ `src/advisor/run.mjs:212`（显示统计）。

**修**：`estimateText`（`src/provider/rate.mjs:68-86`——已导出，ASCII/4 + 非 ASCII/1）替换扁平式：`estimateText(content + toolCalls)`——
纯 ASCII 与旧式**逐值相等**（同 ceil 式）；CJK 升档；微差为零（空串 → 0 与旧式一致）。import 面：`provider/rate.mjs` 仅依赖 `specs.mjs`——叶子向无环。

**选型**：候选 1 = 复用 `provider/rate.mjs#estimateText`（选定——单源加权公式，与主循环同口径）；
候选 2 = 本文件内联加权式（复制公式 = D2 双源）；候选 3 = 全对齐 `compact.mjs` / `context.mjs` 消息 walker（加 reasoning_content / 逐参 tool_calls——面大于需求）。否决 2/3。

**边界**：不改 `CONTEXT_LIMIT_RATIO` / `COMPACT_TRIGGER_RATIO`（§15 预算两档语义零改）；不改六 kind / 尾文案 / `looksLikeReviewOutput` 阈值谓词；
不改主循环估算器（已加权）；CLI 面语义同源、实现各自（CLI 落 `ADVISOR-CONVERGENCE（CLI 仓）§18`）。

### 17.4 受影响文件（行数 as-of 2026-09-11 实测——口径 `N lines total`）

| # | 文件 | 现 | 预计 | 改动点 |
|---|---|---|---|---|
| 1 | `src/agent-tools/advisor-async.mjs` | 493 | ≤498（**贴线注记**——越 500 停下报告） | B2 守卫（+~3）+ B5 接线（`AGENT-LOOP.md §16`——+~3） |
| 2 | `src/agent/execute-tools.mjs` | 483 | ~489 | B3 契约 1/2（+~6） |
| 3 | `src/agent-tools/batch-segment.mjs` | 185 | ~188 | B3 契约 3（+~3） |
| 4 | `src/advisor/compaction.mjs` | 171 | ~174 | B4（+3） |
| 5 | `test/advisor-guard-completion.test.mjs` | 221 | ~290 | T-RS1~2 + T-FZ1~2 + T-FZ4 |
| 6 | `test/batch-segment.test.mjs` | 221 | ~245 | T-FZ3 |
| 7 | `test/advisor-context-budget.test.mjs` | 155 | ~190 | T-EST1~2 |

**贴线注记（advisor-async.mjs——三处改动叠加）**：若实施越 500：先落 B2+B5 实测行数；越线即停下报告（备选拆分面 = `inflightDesignReviewConflict`
对位 CLI `advisor-settle.mjs` 拆出——由评审裁定，不硬压）。

文档面（设计者写域——已落）：本节 + §14.11 #4/#5 收口注 + §2 载体表同步 + 变更记录行。

### 17.5 用例表（正常 / 边界 / 错误——输入 / 预期输出）

| # | 类型 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-RS1 | 正常 | `settleAdvisorReview` 直驱（桩 parent + 新实例 record round=0 / prior=null；report = 拒绝前缀串） | `record.round === 0`、`record.priorOutput === null`、`record.state === "settled"`、`_calledAdvisorThisRun === false` | F30 |
| T-RS2 | 边界 | 续跑实例（record round=3 / prior="PRIOR"）拒绝结算；对照：普通 design 报告 | 前者 `round === 3` 且 `priorOutput === "PRIOR"`（逐值不变）；对照照常推进（零回归） | F30 |
| T-FZ1 | 错误 | `executeToolBatches` 集成：在途设计评审 × `file_ops`（move / copy 目标 = 被审档） | 结果逐字含 `write refused — design review`；源 / 目标零变动（读回断言）；射程外 file_ops 放行（成对） | F31 |
| T-FZ2 | 正常 | 成功 `file_ops`（move / copy 两形态）+ 读 `_fileMutEvents` | move / rename 记源 + 目标；copy 仅目标（记账断言） | F31 |
| T-FZ3 | 正常 | `batch_segment` 成功写入（桩 agent 带 `_touchedFiles`）；错误路径对照 | 成功：`_touchedFiles` 含绑定档绝对路径；失败 / 拒绝路径零记账 | F31 |
| T-FZ4 | 正常 | 子代 file_ops（桩 child agent——`executeToolBatches` 驱动 move 成功）→ `mergeChildMutations(parent, { touchedFiles: child._touchedFiles })` | 子代 `_touchedFiles` 含源 + 目标（契约 2 同点）；合入后父侧 `_touchedFiles` 同含 + `history._fileMutEvents` 含二者（合入即记账——#7 判面判据） | F31 |
| T-EST1 | 正常 | `estimateTokens`：纯 ASCII 400 字符 | 100（与旧式逐值相等——零回归） | F32 |
| T-EST2 | 正常 | `estimateTokens`：CJK「中」×400；混合 200 ASCII + 200 CJK | 400（旧式 100）；混合 = 50 + 200 = 250 | F32 |

### 17.6 验收标准（逐条回指需求——可机判）

| AC | 判据 | 回指 |
|---|---|---|
| AC-B2-1 | T-RS1 / T-RS2 绿（拒绝零记账 + 对照零回归） | F30 |
| AC-B3-1 | T-FZ1 / T-FZ2 / T-FZ3 / T-FZ4 绿（拦 / 判两面 + 零落地断言 + 子代理合入） | F31 |
| AC-B4-1 | T-EST1 / T-EST2 绿（ASCII 逐值不变 + CJK 加权） | F32 |
| AC-R-1 | 既有 `advisor-guard-completion` / `advisor-chain-guards` / `batch-segment` / `advisor-context-budget` 族全绿；VSC 快层全绿 | N22 |
| AC-R-2 | 行数实测对表（advisor-async ≤500 贴线）；两仓 `check-doc-width` 新增违规 0；CLI 仓 B2 / B3 面零改动（`git status`） | N24 |

### 17.7 边界（本批不做）

- 不改 CLI 仓代码 / 测试（B4 的 CLI 面另端实施；B2 / B3 CLI 对位**登记维持**——`advisor-settle.mjs:133` 同款虽存，本批零改，
  CLI 侧登记落 `ADVISOR-CONVERGENCE（CLI 仓）§18.4`）；
- 不拦 git / checkpoint / bash / execute 与子代理预闸面（§17.2 表——复核触发条件随表）；
- 不改 §14.4 契约正文与拒绝串（复用）；不改 guard / verify 的 file_ops 记账面；不改 stale 判定本体；
- 不改 §15 预算两档比例；不改提示词 / ENGINEERING-MODE 档；§14.11 #3（sync 无在途窗口）不在本批（登记维持）；
- **零 UI 面**（全部落拒绝串 / 记账面——无面板 / webview 改动；无 `open` 项）。

**计数（D3）**：条目 3（B2 / B3 / B4-VSC）· 用例 8（T-RS1~2 + T-FZ1~4 + T-EST1~2）· AC 5（AC-B2-1 / AC-B3-1 / AC-B4-1 / AC-R-1 / AC-R-2）·
实施域 4 档改（advisor-async / execute-tools / batch-segment / advisor-compaction）+ 测试 3 档扩例；文档域已落（本节 + 收口注 + 载体表 + 变更记录）。

## 变更记录（历史折叠——详见 git log）

- 2026-08-01~08-08 反转链一句演变：cap 引入（防发散拉锯）→ round2+ fresh session +
  design 并入共享预算 → prior 全文重注入 round2+（响应表退为聚焦参考）→ 硬解析删除 /
  原文注入 / 轮次判定确定性化——现行语义见正文各节。
- 2026-08-21：guard 语义重构——advisor 工具永远可用、guard opt-in、工程模式关闭。
- 2026-08-22：响应表 Action 三值词表 + 禁 pre-existing（§7）。
- 2026-08-30：评审提速——round1 预算 20 轮（里程碑 6/10/17）、round2/3 15 轮（8 轮兜
  底）、硬帽 100 不动。
- 2026-09-06：async advisor（R13）——轮次/prior/cap 随 review 实例计
  （`_advisorRuns`）；async 路径机制权威 = AGENT-LOOP.md（VSC 端建档）。
- 2026-09-07：design 评审 cap 豁免裁定（cap 仅 code——第 6 次拒 + design 豁免正反向探
  针）。
- 2026-09-08：DOC-REORG-VSC 第 4 批建档——从 ARCHITECTURE §9 评审收敛部分迁出正文，写
  全本端独立实现（§9 留 ARCHITECTURE 待后续批瘦身；§8.3 eng-coder 交付协议归属
  AGENT-LOOP.md，非本文档）。
- 2026-09-11：**评审后收口**（用户实况发现批——与 CLI 同源）：§7 三值 → **四值**（新增
  `Dispatched` = 修正轮在途）+ 新增 §12 收口节（修正轮 ⇄ 用户批准 严格序；对位 CLI 收口节）；
  **新老划断**：第 3/6 批并行实践为规则生效前既成事实，不回填冻结批次档。
- 2026-09-11（第 12 批——VSC 评审链守卫镜像）：新增 §13（citations 候选链 / 信号自愈+压缩定锚 /
  谓词族+三消费点 / 硬墙+提示+结构化尾 / settings 形状表第 4 条）；run.mjs 拆出 loop.mjs +
  compaction.mjs（§2 载体表同步）。
- 2026-09-11（第 15 批——VSC 守卫收尾）：新增 §14（启动断言 / 冻结窗口 E 对位 / 收敛信号锁定）；
  §13.10 三面登记原位收口；§2 载体表同步。
- 2026-09-11（VSC-GUARD-COMPLETION 批·修正轮）：评审后文档修正——三形态锁口径交叉引用（§14.5——第三形态归既有 T-VG7 自愈锁）· D-VGC3 跨端差异 3 处全列 + 登记位 · §14.2↔§14.6 行数口径统一 + 贴线预案（先落 helper 实测行数）；零契约语义变动。
- 2026-09-11（VSC-GUARD-COMPLETION 批·交付后修正轮）：§14.3 尾句限定为同步面语义 · §14.11 #5 登记 async 结算面 launchRefused 残留（priorOutput / round 推进——与 CLI 对位一致，维持实现）；零契约语义变动。
- 2026-09-11（ADVISOR-BUDGET-VSC-MIRROR 批——VSC 评审上下文预算镜像）：新增 §15（预算跟随模型窗口——`MAX_CONTEXT_TOKENS = 120_000` 退场；判死线 / 压缩触发改由 `providerSpec` 派生；判定族与六条尾文案零改）；§2 载体表同步。
- 2026-09-11（群 A 批——VSC-MIRROR-SWEEP）：**新增 §16**（A6 同步记账拒绝登记——`ctx._advisorRefused` 载体 + 六类拒绝点 + cap 工具层预检 + `buildCapMessage` 单源；A7 D5 下界定义句三落点）；§14.11 #1/#2 原位收口注；零契约正文改动。
- 2026-09-11（群 B 批——VSC-REVIEW-ASYNC-SWEEP）：**新增 §17**（B2 结算面拒发不记账——消费点守卫；B3 冻结窗口盲区收口——file_ops 拦 + 记 / batch_segment 记 / 五面登记；B4 评审估算器 CJK 加权 VSC 面）；§14.11 #4/#5 原位收口注；§2 载体表同步（advisor-async / execute-tools 两行）。
- 2026-09-11（群 A 批·修正轮——设计评审轮次 1 #3/#4 落修）：§16.1 契约 #6 位置措辞定型（async 分支之后、sync 启动之前——sync-only 消歧）+ 用例补 T-MA6-8（async 对照）/ T-MA6-9（类 #1）；AC-MA6-1 覆盖闭口。纯措辞与用例补充、零语义。
- 2026-09-11（群 B 批·修正轮——设计评审轮次 1 #1/#4 落修）：§17.2 契约 2 补 `_touchedFiles` 同点记账（子代理 file_ops 合入面闭合）+ 表 #7 理由句定型 + 用例补 T-FZ4（§17.5——7→8）；§17.4 贴线注「B2+B5」正名。纯覆盖补全与措辞、零语义。
