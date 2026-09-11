# Advisor 评审收敛协议（Convergence Protocol）——VS Code 独立实现

> 板块：评审收敛——ThinCoder VS Code 的 advisor 评审收敛机制：定义"审查 → 修复 →
> 复审"循环如何收敛（全绿通过 / 有限轮次机械终止）。
> 与 CLI `docs/design/ADVISOR-CONVERGENCE.md` 同名文档对应同一机制板块——各端独立
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
  `src/advisor/compaction.mjs`——run.mjs 保持 re-export 面（import 兼容零改；行数见 §13.5）。
- `src/advisor/convergence.mjs`——round2+ 收敛消息体单源（`buildConvergenceBody` /
  `buildConvergenceInstructions`）。
- `src/advisor/messages.mjs`——user 消息构建（`buildAdvisorUserMessage` / review-object
  declaration / 文档清单注入）、`src/advisor/citations.mjs`——host-verified citations
  机械校验、`src/advisor/repos.mjs`——doc-file 分类（isDocFile）。
- `src/agent-tools/advisor.mjs` / `advisor-async.mjs`——advisor 工具（sync 执行 / async
  后台池 / design token 入槽）；`src/agent/run-stages.mjs`——completion guard 推回
  （`maybeGuardPushbacks`）。

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
- **R3** 既有先例裁定（文件尺寸等债）→ 🟡/🔵，不升级、不重诉。
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
| 5 | 需求层落点 | CLI 需求档（同板块 §8 新节 + SETTINGS-TOOL F-S1.7 VSC 对位行——批 10 / 批 8 先例）（CLI 侧）；本仓无 requirements 树——本档持指针（§13.1） |

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
| 1 | **CLI 需求档新节 + SETTINGS-TOOL F-S1.7 对位行** | 批 10 先例（VSC 条目落 CLI 需求档）+ 批 8 先例（VSC 档明示需求层落 CLI 档）——单源可指、三方一致（批次档 §2 = 本档 AC 回指 = 需求档条目）锚定 | 需求在本端档缺席（本档持索引指针） | **选定** |
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
  `provider.mjs:31` 载荷 polyfill 为非导出局部 const；仓内无裸调先例）⇒ 组合经 `loop.mjs:29-38` `combineSignals` =
  **特征检测**（`typeof AbortSignal.any === "function"` 走原生）+ **本地兜底**（AbortController 包装——任一输入
  abort 即触发、已 aborted 立即生效、reason 透传；形态先例 `src/mcp/http.mjs:14-22`）——语义一致。
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
| 6 | `src/agent-tools/advisor.mjs` | 310 → **321** | sync design 未完成守卫 | 不拆（<500；>300 存量先例） |
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
| `thincoder/docs/requirements/ADVISOR-CONVERGENCE.md` | 152 → **197（实落）** | §8（F18–F23 / N12–N15）——**已落** |
| `thincoder/docs/requirements/SETTINGS-TOOL.md` | 51 → **52（实落）** | F-S1.7 VSC 对位行——**已落** |
| `thincoder-vscode/docs/design/ADVISOR-CONVERGENCE.md` | 330 → **660（实落——交付同步后终值）** | 本节 §13 + §2 载体表 + 变更记录行——**已落**（行数 = 交付同步复写） |
| `thincoder-vscode/docs/design/TOOLS.md` | 223 → **226（实落——修正轮后终值）** | §5 第 4 条 + 计数 + 变更记录行——**已落** |

### 13.6 关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-VG1 | **拆分 = `loop.mjs` + `compaction.mjs`**（必拆） | 表 1——468 + 预计新增必越 500 硬帽（无豁免通道）；CLI 同款拆线 = 迁移 / 对读成本最低。否决：仅拆 loop（run 超 advisory 且与 CLI 不同构）· 就地压缩（应付式） |
| D-VG2 | **镜像范围 = F18–F23 语义面**（含谓词三消费点 + 定锚） | 表 2——谓词无消费点 = 死码，同构缺陷（§13.2 #3/#4）不除；定锚与自愈同属「信号必达」家族（压缩物理丢首条 user 消息 = 同一证据面）。否决：只落谓词不接线 · 定锚延后登记 |
| D-VG3 | **需求层落 CLI 需求档**（同板块 §8 + F-S1.7 对位行） | 表 3——批 10 / 批 8 先例。否决：需求全落本档（违一板块一档 + 三方一致锚点模糊） |
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
| T-VG6 | 错误 | code 守卫：时间线 + context 尾；另一例 `review failed (…)` 字符串形态 | `_calledAdvisorThisRun` **不**置 true；旧正则定义 / 消费零残留 | F23 |
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
| AC-VG1 | 候选链零假命中：T-VG9 / T-VG10 / T-VG11 绿；`citations.mjs` 无全盘扫描（grep：无 `readdir` / glob 调用）；命中根报告段在位 | F21 |
| AC-VG2 | 信号必达：T-VG7 绿（自愈 + 幂等） | F19 |
| AC-VG3 | 压缩不吞锚：T-VG8 绿；pin 来源 = 评审参数（grep 判据三式，全真：① `function buildPinnedBrief(` 命中 ≥1；② 其定义体内 `documents` / `object` / `designToken` 各 ≥1 引用；③ `compactMessages(` 调用点第二实参（`pinned`）在位 ≥1） | F20 |
| AC-VG4 | 未完成不签发：T-VG3 / T-VG4 绿（`passed=false` + 槽 / 台账零写 + 报告零 token 字面 + 提示串在位）；T-VG5 零回归（正常批准不变） | F18 |
| AC-VG5 | 同谓词守卫：T-VG6 绿；`ADVISOR_FAILURE_TEXT` 定义 / 消费 grep 零命中（六 kind 全覆盖 = 旧六形态语义零丢） | F23 |
| AC-VG6 | 硬墙 + 结构收尾 + 提示：T-VG12 / T-VG13 绿（族前缀逐字 + 统计行三要素 + budget 行；两形态同判）；T-VG14 / T-VG15 绿（0.75 阈值、一次性、时钟注入零真实等待） | F22 |
| AC-VG7 | 形状表第 4 条：T-S2.36 / T-S2.37 绿；`_SIBLING_SHAPES` 键数 = 4 与 TOOLS 档计数一致；roleMap 拒 / 接受集 == `effectiveSubagentModel` 可消费集（表驱动） | F-S1.7 |
| AC-VG8 | 零回归 + 档位 + 登记：VSC `npm test` 全绿；`test/files.mjs` 清单含新档（+1）；行数实测对表（loop / compaction / run ≤300；advisor-async ≤500；新测试档 ≤500）；两仓 `check-doc-width` 新增违规 0 + 新增超宽 0；CLI 仓代码零改动（`git status` 判据——本批不碰 CLI 实施面） | N15 |

### 13.10 边界（本批不做 + 登记项）

- **不做启动断言面**（F12 的 fail-closed 层）：VSC 设计评审链路恒签发 token（`agent-tools/advisor.mjs:253`）
  ⇒ 正常链不可达；直接调用方兜底登记后续评估
- **design 评审收敛路径（`buildAdvisorFollowUp`——round ≥2 且有 prior）不含 Approval Signal**：契约二覆盖范围 =
  `buildAdvisorUserMessage` 三个出口（§13.4）；该面与上行启动断言面同族——本批不做、归后续批评估（交付披露 ③——
  第 12 批交付同步登记）。
- **不做冻结窗口 E 面**（VSC dispatch 预闸）：与 CLI §14.14 同机制面，另批评估
- **传输层零改**：中断 / 超时形态按本端实况（`interrupted` 返回字段；非 interrupt 中止抛错）；
  `partial` 字段不存在——不引入
- **sync 完成记账面零改**（`execute-tools.mjs:432`）：CLI 第 13 批另裁（`record-results`）后 VSC 随批
- 不改评审语义判据 / 评审侧提示词 / 凭证机制本体 / cap 语义；不改压缩触发阈值
- 不碰 §7 / §12；不碰 CLI 仓实施面与已交付面；不新建文档档（本批全落既有档）
- **零 UI 面**（提示 / 尾 / 报告段均落评审文本与工具返回值内——无面板 / webview 改动；无 `open` 项）

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
