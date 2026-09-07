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
- `src/advisor/run.mjs`——执行与机械 cap（`MAX_ADVISOR_ROUNDS` / `buildCapMessage` /
  `runAdvisorReview` / `runAdvisorToolLoop` / `MAX_ADVISOR_TURNS` /
  `resolveAdvisorProvider`）。
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

## 7. 响应表纪律（Action 三值）

`discipline.md`（普通模式）/ `engineering.md`（工程模式——父代理）的响应表纪律（纯提示
词纪律——**不加机械解析**——响应表仍是"聚焦参考"，不驱动控制流）：

1. **表头精确**：`| # | Action | Detail |`——运行时按此精确提取
   （`extractAgentResponseTable`）；round2+ 用 `Orig#`（原编号，不重编号）。
2. **`Action` 三值封闭词表**：`Fixed`（已改代码/设计）、`Not an issue`（技术反驳，附证
   据）、`Deferred`（承认但不修，附理由——仅适用于 🟡/🔵 改进或需用户先拍板的 🔴）。
3. **禁止「pre-existing」借口**：评审双方拥有整个代码/设计——问题何时出现不决定它该
   不该修。只能技术反驳或修，否则不算收敛。
4. **工程模式收窄**：超出已批准设计范围的 finding → **surface 或提设计更新**；一个 🔴
   既不修也不 surface = 阻断收敛。

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
