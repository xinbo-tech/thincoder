# 评审/凭证链边缘守卫（溢出 / 信号注入 / cite 校验）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 用户「开工」（同族三条攒批——父侧提议 + 用户 04:10 批准）。

---

## §1 讨论（主 agent 记）

### 需求来源

用户 2026-09-11 04:10「**开工**」——承接父侧提议：「这三条是同一族：**评审/凭证链在边缘情况下靠父侧临场兜**」。
三条均来自本会话**当日实证**（第 7/8 批评审过程），非推测。

### 条目 A：设计评审 context 溢出仍签发 token（`docs/TODO.md:78`）

- **实证**：`advisor type=design` 在四文档 + 大量 file:line 核验的评审中自报
  「**context window limit reached (123099 tokens) — Review incomplete — too many tool calls. Try a narrower scope.**」
  ——**但宿主仍以 Approved 收尾并签发 token**（本会话第 8 批轮次 2）。
- **可靠界**：溢出发生在**补充检查**阶段（核心条目已核完）；父侧已**代跑**未完成补充（宽度 0 · 行数口径差 1 · cite 六处全中）补齐。
- **待裁**：溢出/incomplete 时 token 应**缓发**还是**标注**？自报 incomplete 的**机械可观测信号**是什么？恢复路径（重跑/缩范围）怎么写？

### 条目 B：approval-signal 未注入 → token 链断裂（`docs/TODO.md:80`）

- **实证**：`advisor type=design` 返回 **VERDICT: pass** 但评审请求内 **`## Approval Signal` 段未随附**——
  token/designId 均为**未填占位符**（评审员原话：「本次请求中 `## Approval Signal` 段未随附…无法逐字回显」）→
  **eng-coder 无凭证可 spawn**（本会话第 7 批轮次 1；同日第 3/6 批评审均正常）。
- **待裁**：注入路径现状（谁注入/何时/空值守卫）+ 缺信号时应**报错可见**而非静默发未填占位符。

### 条目 C：宿主 cite 校验对「无仓前缀路径」误报（本批新增——父侧两处实证）

- **实证**：宿主 `[host-verified]` 校验把评审引文判为 `file unreadable` 两例——
  第 8 批轮次 2 的 `TOOLS.md:124`（**父侧实文核验：存在且正确**——「本端键集（`_NULL_LEAF_SHAPES`…2 键）」）·
  第 7 批轮次 2 的 `AGENT-LOOP.md:714`（同类标注）。评审对象声明的路径均带仓前缀（`thincoder/...`），
  而评审员的引文多为**裸相对路径**——疑 **校验器路径解析未按仓前缀补全**（工作区含两仓）。
- **待裁**：解析候选补全方案（按声明仓前缀 / 双仓试解）+ 误报与漏报取舍（宁误报不放过？）。

### 已核事实（供 designer 免重复勘察——行号为 as-of，须现场复核）

- 机制落点候选：**评审启动/收尾与凭证签发**（`src/agent-tools/advisor.mjs`——`runAdvisorReview`：审批信号注入、token 签发、
  host-verified citations 后处理）；设计权威候选 = `docs/design/ADVISOR-CONVERGENCE.md`
  （**§5 host-verified citations——机械证据校验** 已记现有校验实现）+ `docs/design/AGENT-LOOP.md`（机制层）。
- 本会话同族已处置项（**不在本批**）：修正轮 ⇄ 批准时序 + `Fixed` 四值 = **第 9 批在途**（`2026-09-11-PROMPT-REVIEW-ORDER.md`）。

### 范围边界（明确不做）

- **不**改评审的**语义判据**（什么算 pass/changes-required）——本批只做**链的守卫与可观测性**。
- **不碰**第 9 批落点节：`docs/design/ADVISOR-CONVERGENCE.md` **§7 四值词表句 + §13 全节**（在途链）——
  需在该档落内容时**只新增节**（如 §14），不改既有节；或优先落 `docs/design/AGENT-LOOP.md`。
- 不改提示词语义（`prompts/*`）；不改 `ENGINEERING-MODE.md` 链（他链在途）；不改 CHANGELOG/README。
- **不得自行新建档**（用户边界指令——归属档勘察后判定；必须新建则停下打回父侧）。

### 待设计裁定（5 问）

1. **A 的可观测信号与守卫点**：自报 incomplete 怎么机械识别（评审收尾文本 / 状态字段 / 其它）→ 守卫动作（缓发/标注/重试）
   与**恢复路径**（重跑策略：缩范围提示何处来）；给候选对比。
2. **B 的注入路径排查**：谁注入 approval-signal、哪一步会空/缺、守卫位置与**失败可见性**（报错文案/阻断 spawn 与否）。
3. **C 的解析补全**：候选（按评审对象声明仓前缀补全 / 双仓试解析 / 两者结合）+ 误报-漏报取舍 + 是否影响既有引文判定。
4. **测试面**：三条守卫各自的机器断言（本仓测试范式勘察——哪些既有测试覆盖 advisor 启动/收尾面）。
5. **归属与写域**：三条各落哪档/哪个源（是否含双源面）；受影响文件全清单（带行数/增量）。

### 状态

**已收口 2026-09-11**（用户"开工"）。下一步 = **设计**（spawn eng-designer）。

### 用户授权（主 agent 记 · 2026-09-11 04:19/04:20）

用户原话①「**第10/11批帮我自动点火**」（04:19）· ②「**帮我也自动批准，授权都明天上午八点**」（04:20）——
**① 设计评审发起权（含轮次 2/修正轮后重发）② §4 用户批准**，两项均**委托父侧自动执行**。

**有效期**：2026-09-11 04:20 → **08:00**（窗口外 → 等用户）。

**代签规则（父侧自缚）**：① 仅「评审 pass（0🔴）+ 修正轮落地并核验 + token 已签发」三条件齐备时代签；
② 代签记录写明「父侧代签（用户 04:20 授权，至 08:00）」+ 冻结面摘要；③ 🔴 未闭 / 需用户裁定项 → 不代签。

父侧承诺：点火后逐条核验 + 裁决表 + 修正轮一律照常落档，早上一次性呈报。

### 条目 D（父侧追加 · 2026-09-11 04:20 · designer 裁定「纳入本批·可行」）

**实证**：第 10 批设计评审 `advisor type=design` **600s 超时、零输出**（机制提示「Partial results may be available. Try again with a
narrower scope.」）——无发现表 / verdict / token / 部分结果可回收。登记 `docs/TODO.md:78`。

**根因候选**（designer 判：证据不足以区分；守卫对三类均有效）：① 预算被探索耗尽（大范围 + 慢模型）② 单次调用停滞吞预算（无预算感知 deadline）③ 模型不知预算在烧，撞墙来不及收敛。

**守卫口径（见设计档 §14）**：**硬墙**（per-call `AbortSignal.timeout(remaining)`——中断语义零变）+ **0.75 一次性预算提示**
+ **结构化收尾**（rounds / tool calls / review text produced / budget 指引）；凭证面由 A 族覆盖（timeout ∈ 判定族）。

### 条目 E（父侧追加 · 2026-09-11 04:21 · designer id=22 落档中）

**实证（父侧自重失误）**：评审实例**进程 done 后、digest 落定前**，父侧改被审文档（批次档 §1 写「用户授权」段）→ 宿主判
「**评审目标已变更——token 未签发（judged a stale state）**」→ **整轮作废**。本轮无 token 损失（本就 changes-required）；**若发生在 pass 轮 = token 直接丢失**。

**机制面缺口**：D5「评审在途不改被审文档」**未定义「在途」的终点**——父侧按「子进程退出 = 安全」执行 → 踩中。

**即时纪律（父侧已生效，非设计替代）**：**点火 → digest 落定前，被审文件集（含批次档记录）父侧零写入**。登记 `docs/TODO.md:78`（同条目）。


---

## §2 批次任务（eng-designer 自写）

**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字文案 / 用例表 / 验收判据全文在设计档，本段只做任务书）。

**落档位置**：需求 `docs/requirements/ADVISOR-CONVERGENCE.md` **§7**（F11–F16 / N7–N10）· 设计+测试 `docs/design/ADVISOR-CONVERGENCE.md` **§14 全节**（14.0 裁定摘要 / 14.1 问题陈述与实证 / 14.2 选型对比四表 / 14.3–14.6 契约逐字 / 14.7 受影响文件 / 14.8 决策 / 14.9 冲突核对 / 14.10 登记项 / 14.11 用例 T-CG1–T-CG14 / 14.12 AC-CG1–AC-CG12 / 14.13 边界）。
**归属判定（q5）**：单归属 = 需求档 §7 + 设计档 §14（评审收敛板块——`docs/README.md` §4 映射表「评审收敛」行）；`AGENT-LOOP.md` 零碰（第 10 批在途审查——D5）；`AGENT-PARAMS.md` 零改（超时预算语义无变）；**CLI 单端**（VSC 对位面登记后续批——§14.10）。

### 本批覆盖条目（= 设计 §14.12 AC 回指条目 = 需求档 §7 条目——三方一致）

| 条目 | 内容（一句话） | 需求 | 设计 |
|---|---|---|---|
| A | 评审溢出/截断仍签发 token → **未完成即不签发**（缓发 + 可见提示 + 恢复指引；单谓词三消费点） | F11 · F16 | §14.3 |
| B | approval-signal 未注入/丢失 → **构建自愈 + 启动断言（fail-closed）+ 压缩定锚** | F12 · F13 | §14.4 |
| C | cite 校验对无仓前缀路径误报 → **声明范围派生根候选链** + 失败原因三分 | F14 | §14.5 |
| D | 设计评审 600s 超时零输出（父侧当日追加——设计者**裁定纳入**，同族：宿主侧非正常收尾）→ **预算硬墙 + 0.75 一次性提示 + 结构化收尾** | F15（凭证面由 F11 覆盖） | §14.6 |

**明示不在本批**：VSC 端对位面（`thincoder-vscode/src/advisor/{citations,messages,run}.mjs` 同构面——登记 §14.10，后续批含 VSC `test/files.mjs` 注册）· `AGENT-LOOP.md` §11.2 同步行（第 10 批在途）· 评审语义判据 / 凭证机制本体（槽/TTL/门禁/consume/cap）/ 评审侧提示词 / README / CHANGELOG / `docs/TODO.md`（父侧写域）。

### 受影响文件（= coder `files` 声明清单——10 项：7 改 + 3 新；行数 as-of 2026-09-11 实测）

| # | 文件 | 当前行数 | 动作 | 预计 |
|---|---|---|---|---|
| 1 | `src/advisor/run.mjs` | 498 | 改 + **拆**（迁出 loop/compaction；留 启动断言 / 定锚源 / citations 传参 / re-export） | → ≤300 |
| 2 | `src/advisor/loop.mjs` | 新 | **新增**（工具循环 + 截断尾生成 + 谓词 + 硬墙/提示/结构化尾） | ~290 |
| 3 | `src/advisor/compaction.mjs` | 新 | **新增**（estimateTokens + compactMessages(messages, pinned)） | ~75 |
| 4 | `src/advisor/messages.mjs` | 402 | 改（`buildAdvisorUserMessage` 尾包自愈） | +~10 |
| 5 | `src/advisor/citations.mjs` | 78 | 改（候选链解析 + 失败原因三分） | +~42 |
| 6 | `src/agent-tools/advisor.mjs` | 227 | 改（未完成判定透传 + 同步 prior 清洗） | +~10 |
| 7 | `src/agent-tools/advisor-async.mjs` | 500 | 改 + **拆**（迁出 settle 记账块；re-export 保持 import 面） | → ~353 |
| 8 | `src/agent-tools/advisor-settle.mjs` | 新 | **新增**（settleAdvisorRun + 失败/截断判定 + 陈旧判定） | ~165 |
| 9 | `src/agent-tools/design-token.mjs` | 105 | 改（settle 未完成守卫 `opts.incomplete`） | +~20 |
| 10 | `test/advisor-chain-guards.test.mjs` | 新 | **新增**（T-CG1–T-CG14） | ~230 |

**档位必拆（硬帽触发，非可选）**：#1（498 逼近 500，本批新增必越）与 #7（500 = 硬帽**在册**）——拆分方案见设计 §14.7；**import 面经 re-export 保持不变**（`_runAdvisorToolLoop` / `advisorToolsFor` / `settleAdvisorRun` 等既有导入路径零改）。测试档登记要求：CLI 无注册清单档（`test/*.test.mjs` glob 自动发现——第 8 批实测结论）⇒ **零注册改动**。

### 验收标准（AC-CG1–AC-CG12——判据全文 = 设计 §14.12，逐条机器可验证）

- **AC-CG1** 单谓词三消费点（T-CG1 绿 + 旧 `^` 锚形态 grep 零残留）
- **AC-CG2** 未完成不签发（T-CG2/T-CG3：`passed=false` + 槽零写 + 报告零 token 字面 + 提示串在位）
- **AC-CG3** 正常批准零回归（T-CG4 + 既有 settlement / async-settle 测试绿）
- **AC-CG4** 信号必达（T-CG6 自愈 + T-CG7 拒绝前缀）· **AC-CG5** 压缩不吞锚（T-CG8 + pin 源为评审参数）
- **AC-CG6** 解析补全零假命中（T-CG9 / T-CG10 / T-CG11 + citations.mjs 无全盘扫描）
- **AC-CG7** 预算硬墙与三要素收尾（T-CG12）· **AC-CG8** 0.75 一次性提示（T-CG13 / T-CG14）
- **AC-CG9** 提示可执行关键词在位 · **AC-CG10** 文档-实现逐字一致 + `node scripts/check-doc-width.mjs` 新增违规 0 / 新增超宽 0
- **AC-CG11** 档位（无文件越 500；run.mjs ≤300；新模块 ≤300）· **AC-CG12** 零回归 + 边界（`node test/run-fast.mjs` 全绿；`src/prompts/**` 与 VSC 仓零改动；文档凭证扫描零命中）

### 交付定义与报告格式

**交付** = eng-coder 自审闭环（内部 explore 偏差审计 → advisor 代码评审 → 收敛）+ 新档 T-CG1–T-CG14 全绿 + 既有测试零回归 + 批次档 §5 自写。
**报告**：交付摘要 / 改动清单（file:line）/ AC-CG1–AC-CG12 逐条结论（通过 / 未过 + 理由）/ 审计与评审轮次与终态 / 档位实测行数（§14.7 对表）/ 遗留项与归属。
**纪律**：契约与提示文案**逐字**落地（AC-CG10）；不改提示词（`src/prompts/**` 零碰）、不改 VSC 仓、不 commit、不发起评审；越出声明写域 → 停下报告。

**就绪待评审**（发起权在用户）。

### E 追加（eng-designer · 2026-09-11——条目 E 落档；上文 A–D 内容零改）

**状态**：E 的文档面已落——需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §7 追加 **F17 / N11**；设计 `docs/design/ADVISOR-CONVERGENCE.md` **§14.14 契约五**（+ 用例 T-CG15–T-CG18 + AC-CG13 / AC-CG14）；**实施面并入本批 coder 任务**（E-1…E-5 = §14.14 E-4 表 coder 视角）。
上文「落档位置」行记的 F11–F16 / N7–N10 为 A–D 段——全节现值 = **F11–F17 / N7–N11**。另：本节顶部遗留占位行 `_（待写——eng-designer）_`（前次落档遗留）已由本节作者清理（同 SUBAGENT-TAIL 先例——D6 回读核实无正文重复）。

**覆盖条目（三方一致——追加行）**

| 条目 | 内容（一句话） | 需求 | 设计 |
|---|---|---|---|
| E | 冻结窗口边界：「在途」下界定义（点火 → 结算；父侧可观察下界 = 报告送达 / 取消——「子进程退出 ≠ 安全」）+ 在途写入拦截（dispatch 预闸 + 点火回执冻结句） | F17 · N11 | §14.14 |

**受影响文件追加（实施域合计 11 行 = A–D 10 行 + E-1 新行；行内增量 E-2…E-5——as-of 2026-09-11 实测）**

| # | 文件 | 当前行数 | 动作 | 预计 |
|---|---|---|---|---|
| E-1 | `src/agent/dispatch.mjs` | 455 | 改（Phase 1 预闸：`FILE_MUTATORS` × `inflightDesignReviewConflict` → `denied + hint`） | +~20 |
| E-2 | `src/agent-tools/advisor-settle.mjs`（A–D 新档） | 新（~165） | 改（+`inflightDesignReviewConflict`——与 `reviewIsStale` 同族） | → ~187 |
| E-3 | `src/agent-tools/advisor-async.mjs` | 500（拆后 ~353） | 改（re-export +1 名） | → ~354 |
| E-4 | `src/agent-tools/advisor.mjs` | 227 | 改（设计评审 ack 冻结句——逐字见 §14.14 E-3c） | +~3 |
| E-5 | `test/advisor-chain-guards.test.mjs`（A–D 新档） | 新（~230） | 改（+T-CG15–T-CG18） | → ~290 |

**验收追加（判据全文 = 设计 §14.14 E-8）**

- **AC-CG13** 冻结拦截：T-CG15 / T-CG16 / T-CG17 绿 + 拒绝文案锚（`write refused — design review`）+ 被拒写入零落地 + 逃生门指引
- **AC-CG14** 定义与回执：T-CG18 绿 + 定义句与实现锚点对齐 + `node scripts/check-doc-width.mjs` 新增违规 0 + 登记项在节

**E 实施纪律（coder 须知）**：① 契约文案逐字（§14.14 E-3c 两条）；② 拦截判据与 `reviewIsStale` 同源、仅扫 running 未取消设计条目；③ 工具面 = `FILE_MUTATORS`（bash / file_ops 不拦——登记 §14.14 E-6 #3）；④ 不改 `reviewIsStale` / 记账 / 结算本体；⑤ 他链在途零碰（`ENGINEERING-MODE.md` 双档 / 提示词四镜像——登记 §14.14 E-6 #1）。

**计数（D3）**：用例合计 18（T-CG1–T-CG18——追加 T-CG15–T-CG18）· AC 合计 14（AC-CG1–AC-CG14——追加 AC-CG13 / AC-CG14）· 需求条目 = F11–F17 / N7–N11 · 实施域 11 行。

### 修正轮同步（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审轮次 1 = **changes-required**（发现表 6 条：1🔴 · 2🟡 · 3🔵——见 §3 `### 轮次 1`）。父侧裁决：**全部采纳**（docs FIRST——同一 designId 链内；修复后由父侧自动重发轮次 2 取 token，本设计者不发起评审）。本轮 = 修正轮（**只改文档、不碰实现**；未新建档；§1 零碰；需求档零改动）。

**逐条落点**（as-of——设计档 `docs/design/ADVISOR-CONVERGENCE.md`）：

| # | 级别 | 落点 |
|---|---|---|
| 1 | 🔴 | §14.3：kind 表补 `review_failed` 行（前缀 `Advisor: review failed`——旧锚六形态语义零丢）；消费点 2 同步；§14.8 D-CG2；§14.11 T-CG1 扩为六覆盖 + +T-CG19；§14.12 AC-CG1 |
| 2 | 🟡 | §14.6 #1：墙判定绑信号状态（`compositeAborted && !signal?.aborted`；接受 `AbortError` / `TimeoutError` 两名；partial 不抛错返回形态同判）；§14.11 +T-CG20；§14.12 AC-CG7 |
| 3 | 🟡 | §14.14：E-D6 限定（拦 = 父侧自身 `FILE_MUTATORS` 写面；**判 stale 集 ⊇ 拦集**）+ E-6 补 #5（子代理合入写入面——预闸不可达） |
| 4 | 🔵 | 计数裁定：逐行标签为准 = **6 改 + 4 新**——设计 §14.7 表头 / §14.9 D3 行 + 本档（本块）已同改；§14.9 补「A–D 段」限定 |
| 5 | 🔵 | §14.11 T-CG13：时钟注入（`now` 测试缝）——去 wall-clock 依赖（零真实等待） |
| 6 | 🔵 | §14.3 匹配规则：**块首行扫描** + 负向精度口径（非块首引用行不误判；块首裸行残余 fail-closed 如实登记）；§14.11 +T-CG21 |

**计数同步（以本块为准）**：

- 受影响文件：实施域 **11 行** 不变 = 设计 §14.7 表 10 行（**6 改 + 4 新**——上文「7 改 + 3 新」作废；测试档全新计「新」）+ E-1 新行。
- 用例：全节合计 **21**（T-CG1–T-CG14 + T-CG15–T-CG18 + 修正轮 T-CG19–T-CG21）；A–D 段 = 17。
- 判定族 kind 数 = **6**（context_limit / turn_cap / timeout / empty / interrupted / review_failed）。
- AC 合计 **14** 不变（AC-CG1 / AC-CG7 / AC-CG8 判据行文按轮次 1 修正更新——全文以设计 §14.12 为准）。
- 需求条目 **F11–F17 / N7–N11 不变**（需求档本轮零改动）；测试档预估 ~340 行（≤500 硬帽内）。

**AC-CG1 判据修正（供 coder 照抄——设计 §14.12 为准）**：T-CG1（六 kind 全覆盖）+ T-CG5 / T-CG19（code 守卫旧锚语义零丢）+ T-CG21（负向精度锁）绿；`ADVISOR_FAILURE_TEXT` 旧 `^` 锚定义与消费在 `advisor-settle.mjs` / `advisor-async.mjs` 零残留（grep 零命中）。

**状态**：设计档修正已落 + 回读核实（D6）；`check-doc-width.mjs` 本轮改动面新增超宽 0 / 新增违规 0（全仓余项 = 存量基线 + 他批在途 + 本档 §3（评审子代理段）既有条目——非本轮改动面）。待轮次 2（父侧发起）。

### 交付同步（eng-designer · 2026-09-11——设计档与交付实测态对齐；本追加与上文本冲突时以本追加为准）

**背景**：实现已交付并父侧验收通过（21/21；CLI 419/408/0；VSC 391/390/0；六 kind 含 `review_failed` 逐字复核 ✓；墙判 partial 同判 ✓；预闸在只读/autoApprove 短路前 ✓）。本追加 = 设计档（`docs/design/ADVISOR-CONVERGENCE.md`）与交付实测态对齐的落档（coder §5 偏差 ④-1 / 外域项 ③ / 外域项 ① 的文档面同步），**只改文档、实现零触碰**（append 机制——上文各行零改，冲突处以本块为准）。

**同步项（4 项——逐项落点）**：

| # | 项 | 设计档落点 | 结果摘要 |
|---|---|---|---|
| 1 | §14.7 载体列：守卫族落点 loop.mjs → compaction.mjs（交付拆分线） | §14.7 两行「变更」列（loop / compaction） | 守卫族居 `compaction.mjs`；loop = 工具循环 + 接线（明细见下） |
| 2 | 全表行数注记：设计估 → 交付态·实测 | §14.7 表 10 行 + §14.14 E-4 表 5 行 | 口径 = 批次前 → 交付态·实测（明细见下） |
| 3 | 载体指针自查（`:9` `MAX_ADVISOR_TURNS` + 同类） | § 实现载体 header · §2.3 · §14.3 · §14.11 · §14.14 | 逐处按交付态（清单见下） |
| 4 | F16 同步面残留登记 | §14.10 #6（新增） | `record-results.mjs:114` sync 记账无「未完成尾」判定——边界登记（扩展 / 改需求 = 另走链） |

**落点明细**：

- #1 拆分线理由：逐字迁移（含注释）后 loop 承载全部守卫将超 300 档——六 kind 谓词 / `shouldBudgetNudge` / `budgetNudgeText` / `timeoutTail` / `renderTimeline` / 上限常量实际居 `compaction.mjs`（实测 158）；loop.mjs = 工具循环 + 硬墙 / 提示 / 结构化尾接线（实测 291）。
- #2 行数（`N lines total` 口径）：run 498→**239** · loop **291** · compaction **158** · messages 402→**413** · citations 78→**140** · tools/advisor 227→**241** ·
  advisor-async 500→**350** · advisor-settle **214** · design-token 105→**118** · dispatch 455→**481** · test **498**（21 例；评审轮 1 压缩 513→498）。
- #3 指针落点：`MAX_ADVISOR_TURNS` = `compaction.mjs:12`；尾生成点 = `loop.mjs`（:92 / :103 / :113 / :124 / :176 / :187）、`timeoutTail` = `compaction.mjs:120`；
  `reviewIsStale` = `advisor-settle.mjs:58-70`、`noteMutations` = `:36-43`、settle = `:123`（调用点 `advisor-async.mjs:310-314`）；`review_failed` 行号 :492 → :233。

**计数（D3）**：同步项 = 4 · §14.7 表 10 行（6 改 + 4 新）· E-4 表 5 行（E-1…E-5）· 实施域合计 11 行 · 行数注记 = 11 文件（口径 = 批次前 → 交付态·实测）· 用例 21 · AC 14 · kind 6 · 需求 F11–F17 / N7–N11（不变项）。

**与实测零冲突声明**：除上述 4 项外，设计档未发现与交付实测的其它冲突。两处精度补注：① §14.10 #4 `messages.mjs` 行数按实测（402 → 413；净增 +11）；② as-of 证据面（§14.1 问题陈述、§14.3 :552 旧锚 `ADVISOR_FAILURE_TEXT` 引用）按口径保留批次前 file:line（描述批次前缺陷态——不改写历史）。

**纪律**：本次只改设计档 + 本批次档 §2（本追加）；实现 / 测试 / 需求档 / 他批在途面（§7 / §13 / ENGINEERING-MODE / 提示词）零触碰；未 commit；未发起评审；未新建档。`cd thincoder && node scripts/check-doc-width.mjs` 复跑：本次改动面新增超宽 0 / 新增一致性违规 0。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

**评审对象**：需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §7（F11–F17 / N7–N11）· 设计 `docs/design/ADVISOR-CONVERGENCE.md` §14（14.0–14.14，含 E）· 批次档 §2（含 E 追加段）——轮次 1。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 零回归 / F16 需求覆盖 | 🔴 | `settleAdvisorRun` 的 `failureVerdict`「改用同谓词（替代 `^` 锚的 `ADVISOR_FAILURE_TEXT`，设计 §14.3 消费点 2）**按字面会丢 `review failed` 形态**：现行 `ADVISOR_FAILURE_TEXT`（`advisor-async.mjs:236`，实文六形态含 `review failed`），而新谓词族只有 5 个 kind（设计 §14.3 表无 `review failed` 行）；`runAdvisorReview` 的 catch 以字符串 resolve（`run.mjs:492` `Advisor: review failed (…)`，不 throw）⇒ 字面实现后机械失败评审重新被计为「已覆盖」（`_calledAdvisorThisRun=true`，guard 不再重推）——与 `advisor-async.mjs:333-342` 既定注释意图及设计自述「失败判定扩展」相悖；`test/` 全库无该行为断言（grep `ADVISOR_FAILURE_TEXT` / `failureVerdict` 零命中）；AC-CG1 的 grep 锚（`^Advisor: (review timeout|context window limit)`）只列两形态，证明不了旧锚零残留 | 契约补一句：谓词族保留 `review failed` 分支（或把 `review_failed` 列入 kind 表并同步 D3 计数）；补一条用例（code + `Advisor: review failed …` → 不置 `_calledAdvisorThisRun`）；AC-CG1 锚覆盖全六形态或改测谓词全覆盖 |
| 2 | 可行性 / D 硬墙 | 🟡 | 「捕获 `AbortError`：…否则（预算墙触发）⇒ 返回超时尾（不转 generic 失败）」（设计 §14.6 #1）与运行时错误形态不齐：`AbortSignal.timeout` 的中止 reason 是 **TimeoutError** DOMException（本仓先例 `sse.mjs:168-170`「The operation was aborted due to timeout」直透 · `log.mjs:178-179` 按 `signal?.reason?.name === "TimeoutError"` 区分 timeout）⇒ TTFB 阶段墙触发的抛错名可能非 `AbortError`；且 `sse.mjs:228-235` + `core.mjs:235` 会把「已有内容的流中断」以 partial 结果**不抛错**返回 ⇒ 评审按普通结果收尾——超时尾/统计（rounds/tool calls/budget）不出现；T-CG12 只走 `remaining ≤ 0` 早退、T-CG13 不触发墙 ⇒ 该路径零覆盖（AC-CG7 绿不保证） | 墙判定绑信号状态（composite aborted ∧ user signal 未 aborted ⇒ 超时尾）而非仅异常名；接受 {AbortError, TimeoutError} 两名；补一条「墙在调用中触发（含 partial 返回形态）」用例 |
| 3 | E / 自洽性（登记完整） | 🟡 | E-D6「拦与判 stale 同集」（设计 §14.14 E-5）不精确：`reviewIsStale` 读的 `agent._mutLog` 还收**子代理合入**的写入（`mergeChildMutations` → `noteMutations`，`subagent-async.mjs:446-459` 实文）⇒ 子代理在途写被审文档仍可致 stale 但 dispatch 预闸拦不到（子代理无 `_asyncAdvisors` 池面）；E-6 #3 只登记 bash / file_ops 盲区 | E-6 补登「子代理合入写入面」或限定 E-D6 表述（拦 = 父侧自身 `FILE_MUTATORS` 写面；判 stale 集 ⊇ 拦集） |
| 4 | D3 计数·编号 | 🔵 | A–D 段「10 项：7 改 + 3 新」与逐行标签（6 改 + 4 新 = 10）差 1——三处：设计 §14.7 表头 / §14.9 D3 行 / 批次档 §2 受影响文件行；E 后 §14.9 的「用例 14、AC 12」亦为 A–D 局部数（E-6 #4 只注记前项） | 裁定：以逐行标签为准 = **6 改 + 4 新**（测试档全新 → 计「新」）；三处表述一次编辑同步（非阻断）；§14.9 计数加「A–D 段」限定 |
| 5 | 用例稳健性（R4） | 🔵 | T-CG13「预算 1500ms + 首次调用阻塞 ~1200ms」实际余量仅 300ms——负载过冲即 elapsed > 1500 → 第 2 轮落 `remaining ≤ 0` 走超时尾 → 断言红（wall-clock 依赖） | 时钟注入或判定绑纯函数（`shouldBudgetNudge` 已有）+ 集成断言放宽阈值 / mock 计时器驱动 |
| 6 | 谓词精度（A） | 🔵 | 行扫描前缀匹配无法区分宿主截断尾与**模型引文**引用同一逐字串（本批评审对象文档即含这些串）——干净评审含一行以此开头即 fail-closed 缓发 token（方向安全、多付一轮重跑）；line-scan 本身必要（sync 路径 `appendCitationReport` 尾接在超时尾之后——`run.mjs:450-451`） | 补负向锁（干净评审 + 引文含尾前缀不应判 incomplete）；或把匹配限定为尾区段形态 |

**计数**：发现表 6 条（1🔴 · 2🟡 · 3🔵）。**锚点抽检（全中）**：`run.mjs` :163/:171/:175/:186/:228/:451/:492/:52-75/:170-172 · `messages.mjs` :194/:273-276（402 行）· `citations.mjs` :46（78 行）· `design-token.mjs` :83（105 行）· `advisor-async.mjs` :236/:415-418/:178-192/:283-291/:350-356（500 行）· `async-settle.mjs` :134-146/:163-177 · `dispatch.mjs` :169-208/:291-301（455 行）· `helpers.mjs:86`（FILE_MUTATORS）· `subagent-async.mjs` :446-459/:245-251 · `provider/core.mjs` :72/:77-78/:235/:426-430 · `sse.mjs` :168-170/:182-189/:220-235 · `log.mjs` :178-179。**行数实测与标注一致**：run.mjs 498 · advisor-async.mjs 500 · messages.mjs 402 · dispatch.mjs 455 · agent-tools/advisor.mjs 227 · design-token.mjs 105 · citations.mjs 78。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审对象**：需求 `docs/requirements/ADVISOR-CONVERGENCE.md` §7 · 设计 `docs/design/ADVISOR-CONVERGENCE.md` §14（含 §14.14 E）· 批次档 §2（含修正轮同步块）——轮次 2：复核轮次 1 六条发现（1🔴 / 2🟡 / 3🔵）的修复落地（三项文档全文 + 关键源侧锚点 fresh read 实文核验）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `docs/design/ADVISOR-CONVERGENCE.md` | 🔴 | Fixed | kind 表第 6 行 `review_failed`（:548）；匹配规则改块首行扫描（:550）；消费点 2「六 kind 全覆盖 = 旧锚六形态语义零丢」（:561）；D-CG2 六 kind（:687）· T-CG1 六形态（:731）· 新增 T-CG19（:745）· AC-CG1 六覆盖 + 旧锚零残留（:758）——全部在位 |
| 2 | 2 | `docs/design/ADVISOR-CONVERGENCE.md` | 🟡 | Fixed | §14.6 #1（:633-637）：墙判定绑信号状态（`compositeAborted && !signal?.aborted`）· 接受 `AbortError`/`TimeoutError` 两名 · partial 不抛错形态同判；+T-CG20（:746）· AC-CG7（:764） |
| 3 | 3 | `docs/design/ADVISOR-CONVERGENCE.md` | 🟡 | Fixed | E-D6 限定（:887：拦 = 父侧自身 `FILE_MUTATORS` 写面 × `docAbs`；判 stale 集 ⊇ 拦集）+ E-6 #5 子代理合入写入面登记（:895）——两项均落 |
| 4 | 4 | 设计 §14.7/§14.9 + 批次档 §2 | 🔵 | Fixed | 裁定「逐行标签为准 = 6 改 + 4 新」：§14.7 表头（:656）· §14.9 D3 行（:705，含「A–D 段」限定）· 批次档 §2 修正轮同步块（:185-210；:202「上文『7 改 + 3 新』作废」）。批次档原行 :119/:183 旧数保留、由同步块显式超控（append 超控模式，与全批一致；非阻断） |
| 5 | 5 | `docs/design/ADVISOR-CONVERGENCE.md` | 🔵 | Fixed | T-CG13 时钟注入（:743：`now` 测试缝、默认 `Date.now`、零真实等待、原 1500/1200ms 行作废）；AC-CG8（:765）同步 |
| 6 | 6 | `docs/design/ADVISOR-CONVERGENCE.md` | 🔵 | Fixed | 负向精度（:553：非块首引用行（围栏内行 / 表格行 / 引用行）不得判 incomplete）+ 残余 fail-closed 如实登记（:554）；+T-CG21（:747） |

**新增问题**：无（未发现修复引入的新问题；无新增 🔴）。**不变项复核**：AC 14 · 用例 21（A–D 17 / E 4）· 实施域 10 项（6 改 + 4 新）· kind 6 · 需求 F11–F17 / N7–N11——与声明一致。

**关键锚点实文引证（本轮 fresh read）**：
- thincoder/docs/design/ADVISOR-CONVERGENCE.md:550: 匹配规则：**块首行扫描**（按空行分块，逐块取首行 trim 后测前缀）——`renderTimeline`（`src/advisor/run.mjs:118-124`）
- thincoder/docs/design/ADVISOR-CONVERGENCE.md:561: **六 kind 全覆盖 = 旧锚六形态语义零丢**——含 `review_failed`（`run.mjs:492` 字符串 resolve、不 throw））
- thincoder/docs/design/ADVISOR-CONVERGENCE.md:634: 否则「复合信号已中止且用户信号未中止」（`compositeAborted && !signal?.aborted`）⇒ 返回结构化超时尾——**两种运行时形态同判**：
- thincoder/docs/design/ADVISOR-CONVERGENCE.md:656: **实施域（eng-coder 写域——10 项：6 改 + 4 新——逐行标签为准，测试档全新计「新」）**
- thincoder/docs/design/ADVISOR-CONVERGENCE.md:887: 写面边界：**拦 = 父侧自身 `FILE_MUTATORS` 写面 × `docAbs`；判 stale 集 ⊇ 拦集**
- thincoder/docs/batches/2026-09-11-REVIEW-CHAIN-GUARDS.md:202: 受影响文件：实施域 **11 行** 不变 = 设计 §14.7 表 10 行（**6 改 + 4 新**——上文「7 改 + 3 新」作废；测试档全新计「新」）+ E-1 新行。
- thincoder/src/agent-tools/advisor-async.mjs:236: const ADVISOR_FAILURE_TEXT = /^Advisor: (?:review failed|review timeout|stopped after|interrupted|context window limit|empty response)/
- thincoder/src/advisor/run.mjs:492: return `Advisor: review failed (${errorType}) — ${e.message || "unknown error"}. ${retryAdvice}`
- thincoder/src/agent-tools/subagent-async.mjs:459: noteMutations(parent, merged)
- thincoder/src/provider/core.mjs:235: if (result.partial) return result
- thincoder/src/log.mjs:179: return signal?.reason?.name === "TimeoutError" ? "timeout" : "abort"

**计数**：复核 6/6 Fixed · 剩余问题 0（0🔴 / 0🟡 / 0🔵）。

VERDICT: pass

> 〔父侧代笔 2026-09-11 05:05〕§3 计数行括号枚举分隔符由 ` / ` 改为 ` · `（V2「声明 6 ≠ 枚举 3」——检查器把斜杠枚举计 3；**文字零增删、语义不变**）。

## §4 用户批准（主 agent 记）

**2026-09-11 04:58 父侧代签**——用户 04:20 授权原话「**帮我也自动批准，授权都明天上午八点**」；**授权窗口 04:20 → 08:00**；
父侧代签三条件**齐备**（自缚规则见 §1「用户授权」节）：

- **轮次 1**：changes-required（1🔴 · 2🟡 · 3🔵——§3 轮次 1）→ 6 条全部采纳（🔴 `review failed` 形态补回 / 硬墙判定绑信号状态 / E-D6 限定 + E-6 #5 登记 / 计数裁定 `6 改 + 4 新` / T-CG13 时钟注入 / 负向精度锁 T-CG21）；
- 修正轮落地（id=27）经父侧实文核验：**6/6**（kind 表第 6 行 :548 · 块首行扫描 :550-554 · 消费点 2 :560-562 · §14.6#1 :631-637 · E-D6 :887 + E-6 #5 :895 · 计数三处 :656/:705/批次档 :202 · T-CG13 :743 · T-CG21 :747）；
- **轮次 2 评审：Approved**（六条全 Fixed · 无新增 🔴/🟡 · 不变项复核 ✓：AC 14 · 用例 21（A–D 17 / E 4）· 实施域 10 项 · kind 6 · 需求 F11–F17/N7–N11）+ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：**11 文件实施面**（A–D 10 项 + E-1 新行）——`src/advisor/run.mjs`（拆）· `src/advisor/loop.mjs`（新）· `src/advisor/compaction.mjs`（新）· `src/advisor/messages.mjs` · `src/advisor/citations.mjs` · `src/agent-tools/advisor.mjs` · `src/agent-tools/advisor-async.mjs`（拆）· `src/agent-tools/advisor-settle.mjs`（新）· `src/agent-tools/design-token.mjs` · `test/advisor-chain-guards.test.mjs`（新）· `src/agent/dispatch.mjs`（E-1 预闸）。
**不含**：文档面（§14 / 需求 §7 / 批次档——已落）· `ENGINEERING-MODE.md` 双档与提示词四镜像（登记面 E-6 #1）· 它批/实现面。
**验收**：AC-CG1–AC-CG12 + AC-CG13/AC-CG14（**14 条**）· 用例 T-CG1–T-CG14 + T-CG19–T-CG21 + T-CG15–T-CG18（**21 条**）· 两处硬帽拆分（run.mjs 498→拆 / advisor-async.mjs 500=在册硬帽→拆）+ **import 面经 re-export 零改**。

**下一节点**：eng-coder（11 文件 + token）→ 交付 → 父侧实跑 → 用户验收 → §6 收口 + 令牌消费。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

_（eng-coder 自写 · 2026-09-11）_

**状态：实现完成 · 自审闭环收敛（clean）**——A–E 五条目全落地；新档 21/21 绿；`node test/run-fast.mjs` = **419 测试 / 408 过 / 0 败 / 11 跳过**（slow 归册——exit 0，slow 门零拦截）；`npm run test:full` = **418/419**（1 红 = `test/tui-stderr-capture.test.mjs`「AC-1/2/3/6 实跑」慢例——**本批 7 个跟踪文件 stash 后同红**，既有问题，非本批面，已如实登记）。

### 交付摘要（11 文件 = 7 改 + 4 新；行数 = 本仓 `N lines total` 口径实测）

| # | 文件 | 行数（前 → 后） | 交付内容 |
|---|---|---|---|
| 1 | `src/advisor/run.mjs` | 498 → **238** | 启动断言（fail-closed + 拒绝前缀单源常量）/ 定锚源 `buildPinnedBrief` / citations scope 传参 / 谓词与 loop 全量 re-export（import 面零改） |
| 2 | `src/advisor/loop.mjs` | 新 → **290** | 工具循环（逐字迁出）+ 硬墙（`AbortSignal.any` × per-call deadline，绑信号状态）+ 0.75 提示注入 + 结构化超时尾接线 + 压缩定锚接线 |
| 3 | `src/advisor/compaction.mjs` | 新 → **158** | `estimateTokens` / `compactMessages(messages, pinned)`（逐字 + 定锚）、六 kind 单谓词 `advisorIncompleteMarker`、`shouldBudgetNudge` / `budgetNudgeText` / `timeoutTail`、`renderTimeline`、评审上限常量 |
| 4 | `src/advisor/messages.mjs` | 402 → **413** | `buildAdvisorUserMessage` 尾包自愈（内层 + 包裹——覆盖全出口，幂等） |
| 5 | `src/advisor/citations.mjs` | 78 → **140** | 候选链（cwd + 声明仓根 + 声明文件目录/目录）+ 命中根记录 + 失败原因三分 |
| 6 | `src/agent-tools/advisor.mjs` | 227 → **240** | 未完成判定透传 + 同步 prior 清洗 + 拒发登记（`_advisorRefusals`）+ 设计评审 ack 冻结句 |
| 7 | `src/agent-tools/advisor-async.mjs` | 500 → **350** | 拆出 settle/变更日志/陈旧判定；re-export 全保面（dispatch/subagent-async/escalate-async/测试零改） |
| 8 | `src/agent-tools/advisor-settle.mjs` | 新 → **213** | `settleAdvisorRun`（逐字 + 谓词消费）+ `noteMutations` / `reviewIsStale` / `normAbs` + `inflightDesignReviewConflict`（E 判据） |
| 9 | `src/agent-tools/design-token.mjs` | 105 → **117** | `settleDesignReview(opts.incomplete)`——未完成一律不签发（剥 token + 逐字提示，槽零写、实例不关） |
| 10 | `src/agent/dispatch.mjs` | 455 → **481** | Phase-1 D5 冻结窗口预闸（`FILE_MUTATORS` × `inflightDesignReviewConflict` → `denied + hint`，位在只读/autoApprove 短路前） |
| 11 | `test/advisor-chain-guards.test.mjs` | 新 → **498** | T-CG1–T-CG14 + T-CG19–T-CG21 + T-CG15–T-CG18（21 例） |

**导入面零改（机械证明）**：既有消费名逐一在位（`MAX_ADVISOR_ROUNDS` / `ADVISOR_THINKING_PLACEHOLDER` / `MAX_RESULT_CHARS` / `_advisorToolsFor` / `_renderTimeline` / `_runAdvisorToolLoop` / `looksLikeReviewOutput` / `buildCapMessage` / `runAdvisorReview` / `resolveAdvisorProvider` / citations 三导出 / `settleAdvisorRun` / `noteMutations` / `mutationSeqOf` / `reviewIsStale` / 池族全名）；全量套件零回归佐证。

### 逐需求透明表（F11–F17 / N7–N11——Done / Simplified / Not done）

| 需求 | 状态 | 证据（命令 / 断言 / 位置） |
|---|---|---|
| F11 未完成即不签发 | **Done** | T-CG2/T-CG3/T-CG4：`settleDesignReview(…,{incomplete})` + `settleAdvisorRun` 同判（剥 token、逐字提示、槽零写、实例不关；通过面零回归） |
| F12 凭证信号必达 | **Done** | T-CG6（自愈补齐 + 幂等）+ T-CG7（拒绝前缀逐字、零 chat、异步面不计覆盖） |
| F13 信号全程在位 | **Done** | T-CG8：>20 条触发压缩 → pinned（对象声明/文档清单/Approval Signal 三锚）作为 user 消息重挂；pin 源 = 评审参数（源码断言） |
| F14 引用解析按声明范围补全 | **Done** | T-CG9/T-CG10/T-CG11：声明文件目录/声明仓根命中、同名另一仓不误命中、失败三分；`citations.mjs` 无 readdir/glob |
| F15 超时 / 预算守卫 | **Done** | T-CG12（预算用尽尾）/ T-CG13（时钟注入——0.75 恰一次）/ T-CG14（纯函数）/ T-CG20（墙在调用中触发：partial 与 TimeoutError 两形态同判）；三要素 + 恢复关键词在位 |
| F16 同族一致性（A3） | **Done（async 面）** | T-CG5/T-CG19：六形态（含 `review_failed`）不再置 `_calledAdvisorThisRun`；旧 `^` 锚定义/消费零残留（grep + 测试断言） |
| F17 冻结窗口边界 | **Done** | T-CG15/T-CG16（判据族，含 done/cancelled/code/空 scope/空池负向）+ T-CG17（dispatch 集成：逐字拒绝、零落地、非 scope 过闸、autoApprove 不绕过）+ T-CG18（回执冻结句；代码评审 ack 不对称） |
| N7 零静默 | **Done** | 各提示串逐字断言（未签发/拒绝/超时尾/冻结句）；零 token 泄漏断言 |
| N8 可恢复 | **Done** | 提示含 `narrower` / `agent.advisor.timeoutMs` / `re-run` / `action:'cancel'`（用例断言） |
| N9 凭证卫生 | **Done** | 三处清洗分支（stale / 落盘失败 / 未完成）零 token 字面；文档面凭证扫描零命中（本批未动文档） |
| N10 零回归 + 可机判 | **Done（1 处偏差已闭）** | 快层 419/408/0 败；全量 418/419（1 例既有红，stash 对照证明非本批）；测试档行数曾 513 越 500 帽 → 评审轮 1 🔴 后压回 **498** |
| N11 边界可观察（零推断） | **Done** | 下界以可观察信号表达（回执冻结句 + 拒绝文案逐字可 grep）；E 用例断言零命中 = 0 |

### 与设计偏差（逐条如实）

| # | 偏差 | 理由 | 处置 |
|---|---|---|---|
| 1 | **拆分线落点**：守卫族（六 kind 谓词 / 0.75 提示 / 结构化尾 / `renderTimeline` / 评审上限常量）落 `compaction.mjs`，非设计 §14.7 表所写 `loop.mjs` | 逐字迁移（含注释，拆分红线）后 loop.mjs 承载全部守卫将超 300 档 | 已实现且全档达标（loop 290 / compaction 158）；**设计 §14.7 表内容列建议由设计者/父侧同步**（写域外） |
| 2 | **T-CG17 对照组**：非 scope 写以「过冻结闸 + 拒因下移权限层（`no permission handler`）」证明选择性，未真执行写 | 真写执行触发 peer 注册表冷扫（实测 ~470ms，负载下 >3s）——触快层慢门（>800ms 拦截 → `npm test` 非零退出）；先例同形（design-token-settlement AC4「工程门放行——拒因变权限层」） | 断言不弱化：拒绝逐字 + 读回零落地 + autoApprove 不绕过三项全在 |
| 3 | **测试档行数**：513 → 498（评审轮 1 🔴） | 写域 11 文件按红线上限「不新建档」→ 不可拆第二档 | 压缩格式（结构/断言/文案零删减）后 21/21 仍绿 |
| 4 | **拒绝前缀单源**：审计发现前缀字面三处重复 → 加 `ADVISOR_LAUNCH_REFUSAL_PREFIX` 常量（run.mjs 导出，工具面/结算面消费） | 防三处各写字符串漂移（同 D2 口径） | 已修（测试断言覆盖） |
| 5 | **异步面拒绝不计覆盖**：审计算术复核发现 design 结算恒置 `_calledAdvisorThisRun`（原注释误读） | 设计 §14.4 明写「异步结算面据此不置」 | 已修：`launchRefused` 排除 + T-CG7 双向断言（拒绝不计 / 普通 design 结算照常计入） |

### 自审轮次与终态

- **轮次 1 · 内部 explore 偏差审计**（1 轮）：7 项发现——2 项提级修复（#4 前缀单源 / #5 异步面覆盖语义）、2 项测试卫生修复（T-CG1 自指断言改真六覆盖 / T-CG4 补异步通过面与 D1 落盘断言）、3 项为文档面/已披露项（§14.7 落点、T-CG17 对照组、批次档 §5 本体）。
- **轮次 2 · 内部 advisor 代码评审**（1 轮，同步）：**1🔴 + 2🔵**。响应表：

| # | Action | Detail |
|---|---|---|
| 1 | **Fixed** | 测试档 513 行越 500 硬帽 → 压缩至 **498**（未拆档：写域红线「不新建档」）；21/21 重跑绿 |
| 2 | **Not an issue** | `messages.mjs` 413 行 >300 advisory——存量（402 → +11），设计 §14.10 #4 已登记「本批不拆」；R3 存量先例不升级 |
| 3 | **Not an issue** | `dispatch.mjs` 481 行 >300 advisory——存量（455 → +26），设计 E-1 行已登记「不拆（<500 帽）」；未越硬帽 |

- **外域项（无级别，交父侧裁定）**：① F16 同步面残留（`src/agent/record-results.mjs` 无「未完成尾」判定——设计 §14.3 消费点 2 限定在 `settleAdvisorRun`；与需求 F16 行文字面差，文件在写域外）；② 批次档 §5 本体（本段即落）；③ 设计档载体指针滞后（§ 实现载体 header 仍以 run.mjs 记 `MAX_ADVISOR_TURNS`——文档面，登记后续批）。

**终态：clean**（0 未闭 🔴；🔵 = 存量登记项；外域项已逐条登记/打回）。取证：`_t-chain-guards.log`（快层）/ `_t-chain-guards-full.log`（全量）/ `node --test test/advisor-chain-guards.test.mjs`（21/21）。

**行数复核（终稿 —— 修复后最终实测，`N lines total` 口径）**：`run.mjs` **239** · `loop.mjs` **291** · `compaction.mjs` **158** · `messages.mjs` **413** · `citations.mjs` **140** · `agent-tools/advisor.mjs` **241** · `advisor-async.mjs` **350** · `advisor-settle.mjs` **214** · `design-token.mjs` **118** · `dispatch.mjs` **481** · `test/advisor-chain-guards.test.mjs` **498**。（上表个别数字为压缩 / 审计修复前时刻实测——以本行为准；全部在档：run/loop/compaction/advisor-settle ≤300、其余 ≤500、新档 498 ≤500。）

**§5 写入自证**：本段经 `batch_segment({segment:"§5"})` 两笔落档（回读核实：批次档 §5 现含交付摘要 / 逐需求透明表 / 偏差表 / 轮次响应表 / 外域项 / 终态）。

## §6 验证与收口（父代理自写）

**2026-09-11 10:53 用户验收**（原话「都验收」——含本批；§4 为**父侧代签**——用户 04:20 授权窗口内，三条件齐备）。

- **交付面**：11 文件（7 改 + 4 新）——A 谓词族六 kind（含 `review_failed`）+ 三消费点 + 启动断言 · B 构建自愈 + 压缩定锚 · C 引文候选链 × 三条件 · D 硬墙绑信号状态 + 0.75 提示 + 结构化尾 · E 写前拦截 + ack 冻结句；两处硬帽拆分（`run.mjs` 498→239 + `loop.mjs` 291 + `compaction.mjs` 158；`advisor-async.mjs` 500→350 + `advisor-settle.mjs` 214）+ import 面 re-export 零改。
- **父侧实跑**：新档 **21/21** · CLI 全量 **419/408/0**（唯一红 = 既有 TUI 慢例，coder `git stash` 对照实证非本批）· 实现读码——六 kind 表含 `review_failed` ✓ · 墙判 partial 同判（`loop.mjs:177-181`）✓ · dispatch 预闸在只读/autoApprove 短路前（`dispatch.mjs:217`）✓ · `launchRefused` 排除 ✓ · 候选链/自愈/冻结句 ✓。
- **验收后同步轮**（id=30）：设计档 ↔ 交付实测 4 项（§14.7 载体列 + 全表行数 + 载体指针 sweep（8 处）+ F16 边界登记 §14.10 #6）——父侧核验 ✓ · T41 复跑 6/6 ✓。
- **偏差裁定**：拆分线落 `compaction.mjs` = 接受（≤300 档位实测达标；设计档已同步）· T-CG17 对照组口径 = 接受（先例 = design-token-settlement AC4）· 测试档 513→498 = 接受（硬帽内）。
- **遗留转后续**：F16 同步面残留 → **第 13 批**（用户 10:50 已裁「扩展实现」）；设计档载体指针滞后 = id=30 已修 ✓。
- **令牌链**：设计评审 token **已消费**（`consume-design`——链终）。

---
