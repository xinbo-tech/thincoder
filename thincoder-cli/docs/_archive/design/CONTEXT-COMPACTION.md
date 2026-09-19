# Context Compaction 统一规范（CLI / VS Code 一致落地）

> **权威源**：本文件是 thincoder（CLI）与 thincoder-vscode 上下文压缩语义的规范基准，两端实现与验收口径以本文件为准。
> **范围**：thincoder（CLI）与 thincoder-vscode 的上下文压缩语义统一。
> **状态**：已落地（两端实现 + 测试全绿，2026-08-03 起逐批演进，2026-09-02 完成当前态全部机制）。本文档按机制主题重组为**当前态设计**；历史落地流水账折叠见文末「变更记录」。
> **原则**：一套语义，两端一致落地；正确性优先于 token 节省（与双线历史同一总原则）。
> 关联权威：`PROVIDER.md` §14/§15（模型上下文配置与 provider 覆盖）、`AGENT-LOOP.md` §7.2.1（面板机制）、`PROVIDER.md` §14（deepseek 续写 400 根因）。

## 1. 术语

| 术语 | 含义 |
|---|---|
| 机读线 `history` | 送模型的上下文，压缩作用于此 |
| 人读线 `_fullHistory`/`fullHistory` | 永不压缩的完整记录（UI/resume 用） |
| prompt 估算 | system + tools schema + history（含注入）的 token 近似 |
| 安全点 | history 末尾消息 role ∈ {user, tool}（完整交换边界） |

## 2. 触发时机与阈值（D1 / D2）

### 2.1 触发时机（D1）——仅安全点

**仅安全点检查**：history 末尾消息 role ∈ {user, tool} 时才检查是否压缩。

- CLI：仅 history 末尾为 user/tool 时检查；VS Code 每轮无条件。
- 理由：压缩是结构性 splice（head + 摘要 + tail），在模型输出中途（assistant 半截）切会破坏 tool 配对语境；安全点检查零成本。

### 2.2 阈值（D2）——显式优先，auto = context × 0.6

**阈值判定**：显式 `config.agent.compactThreshold` 优先；否则 auto = `specForModel(model).context × 0.6`。

- **判定对象统一**：完整 prompt 估算（system + tools + history）≥ threshold 即触发。
- 理由：0.6 为注入上下文（git/目录/outline/memory/文档，实测每轮 30–50K）+ 输出/reasoning（部分模型 maxOutput 384K）留余量；0.8 在 1M 窗口只剩 200K，刚压缩完可能又超。

### 2.3 provider 级覆盖（PROVIDER §15）

阈值与 tail 公式（D4）的 context 输入**可被 provider 级 context 覆盖**：`providers[].context`（K 单位）覆盖 MODEL_SPECS 的 context 后，阈值与 tail 公式跟随覆盖值（`providerSpec`，权威规格见 `PROVIDER.md §15`——公式权威不复制）。

## 3. token 判定（D3）——实测优先 + 增量估算

**实测优先**（两端同款）：

- 有实测：`_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`
- 无实测（首轮/恢复后/压缩后）：`estimateTokens(history) + system/tools 估算`
- 压缩成功 / 会话恢复 / 新 run 时基线失效（置 null）

**估算公式统一**（取 CLI 精细版）：

- 文本：ASCII/4 + 非 ASCII/1
- `reasoning_content`、`tool_calls` 参数计入
- 图像：按 2000 token（取 VS Code 保守值；CLI 原 256 偏低会延迟触发）

理由：估算对 CJK 系统性低估，纯估算可能永远不触发（CLI 实测过的教训）；实测值是完整上下文的真实成本。

## 4. 切割：tail 保留、无头部、配对保护与 token 预算

> 本节是压缩的结构性 splice 规则。tail 最终保留量由 **§4.1 候选条数 + §4.4 token 预算双约束**共同决定（D-T1 双约束 + D-T2 保底）——**§4.1 公式是"候选条数"规则，不是最终保留量**。

### 4.1 tail 保留——候选条数公式（D4）

```
keepTail = min(max(10, floor(context/100_000 × 30)), floor(len × 0.4))
```

- **2026-09-02 修订：本条为候选条数规则，最终受 §4.4 token 预算约束（D-T1 双约束 + D-T2 保底）。**
- 理由：1M 窗口只留 10 条太薄，模型丢失近期工作上下文；40% 上限防小窗口保留过多导致"压缩了个寂寞"。

### 4.2 无头部（D12）——KEEP_HEAD = 0

`KEEP_HEAD = 0`——**无头部**。最早的 2 条并入中间段一起进摘要。

- 历史：`KEEP_HEAD = 2`（"保留最初意图"）——单任务会话的假设：最早消息 = 当前任务定义。
- **问题（用户反馈实证）**：多任务连续会话（同一会话连续做任务 A→B→C）中，最早消息是**已完成的旧任务**——压缩后原文保留在上下文中，模型注意力被旧事锚住（"AI 忽然转向以前的旧事"）。
- **决策**：摘要提示词增加"区分已完成 vs 进行中：已完成任务一行概述，细节预算花在未完成/当前任务"。压缩后上下文 = 摘要注记（第一条）+ 占位 + tail——锚点天然是当前任务（最近的 user 消息）。
- 影响：任何 ≥2 条的历史都能切出中间段（keepTail ≥ 0）——`shrinkOversized` 兜底只剩"单条巨型消息"场景（历史 1 条）。
- 协议安全：head 为空后 tool_calls 配对保护只剩 tail 侧（§4.3 后半）；中段消息序列化为文本（`[assistant][ called tools: …]`），不保留原始配对结构——无 orphan 风险。
- 人读线不变（双线历史，§6.2）：任何压缩丢失的原文仍可从 `_fullHistory` 恢复。

### 4.3 切割配对保护（D5）——双侧

**双侧保护**（CLI 版 head 保护 + 两端版 tail 保护）：

- **head 侧**：head 不以 `tool_calls` 结尾（CLI）。head 保护是 CLI 修过的真实 400 场景（并行工具结果被摘要吞掉）。
- **tail 侧**：tail 的 orphan tool 拉回其 owner（两端版；工具配对边界不被切断）。

### 4.4 tail 按 token 预算——压缩后 history 段 ≤ 窗口 15%（D-T1/D-T2/D-T3/D-T4/D-T5）

> 用户实测：600K 窗口模型压缩后上下文仍占 ~40%——`keepTailSize` 只按**条数**（每 100K 30 条）缩放，无 token 预算；工具密集会话中单条消息 token 大（assistant 工具链 + 大 tool 结果），tail 条数公式失控 → 压缩释放空间小、很快再触发。用户目标：**压缩后 15%**。

**目标**（用户拍板）：

- F1 = 压缩后 **history 段（摘要注记 + 占位 + tail）≤ 窗口 15%**（B 口径——system prompt / tools 描述 / 注入上下文在外单算，history 段独立达标）
- F2 = 工具密集会话生效；**普通会话不误伤**（预算未超时行为与现状完全一致）
- F3 = 摘要 ≤1K 设计（§9.1）协同——摘要段 ~1K 可忽略，15% 预算几乎全给 tail
- F4 = 两端一致

**D-T1 tail token 预算**：

- `tailBudget = context × 0.15 − 摘要估算`（摘要 ~1K，预算 ≈ 窗口 15%）。
- **两端常量实现差（可接受）**：CLI `SUMMARY_TOKEN_ESTIMATE = 1000`（note+占位由 ±5% 容差吸收）；VS Code `SUMMARY_SEGMENT_ESTIMATE = 1100`（= note+占位 ~90 + 1K 目标，显式预留后严格断言）。语义等价（<0.2% 窗口差），两端各按本地断言强度实现。
- **测量边界**：15% 目标按压缩时刻的 history 段（摘要+占位+tail）计量——D7 压缩后回注（task/plan/AUTO 注记）不计入预算，其增量（通常 ≤ 几 K，plan 回注最长）由 ±5% 容差吸收；验收口径与用户实测口径一致（用户 40% 观察含回注，本设计保证回注前段 ≤15%，回注后仍远低于 40%）。
- **落地形态**（CLI 2026-09-02，VS Code 移植以 CLI 为准）：`keepTailSize` 保持**纯条数公式（语义改为"候选条数"）**，预算双约束在 `splitHistory` 接线——候选尾估算超预算（estimateTokens 复用，含 reasoning/tool_calls/图像 2000）→ `tightenTailByBudget` 把 **tailStart 前移**（候选尾头部消息并入摘要段）直到估算 ≤ 预算 或触保底；D5 修复提取为 `repairedTailStart` 供候选/floor 两边界复用。
- **pair-safe 边界约束**：tailStart 只允许落在配对安全边界——plain 消息，或完整 assistant(tool_calls)→tools 对的起点（D5 tail 侧 orphan 拉回语义下，切在 assistant 与其 tool 结果之间会把 owner 拉回 tail 使预算重新超支）；无 pair-safe 边界能满足预算 → 显式进入 D-T2 保底并接受超支。
- **VS Code 倒序配对（REVERSE）位不停**：assistant 位其 tool_calls 未被其后连续 tool 块覆盖 → 悬空 400 类——`callsGapAfter` 判据。

**D-T2 保底 10 条**：预算不足以保留 10 条原文时，**保底优先**（保留最近 10 条，允许小幅超预算）——tail 原文的作用是让模型看到最近真实对话（工具调用链、最近请求语境），全吞进摘要会失真；10 条即使单条偏大（~1.3K 均值场景 ≈ 13K）也不足以再现 40% 问题。

- **单条巨型消息**（估算 > 预算总量）保留该条本身（64K 落盘/预览机制已管大工具结果；单条截断是 shrinkOversized 的职责，不在 tail 预算内二次处理）。
- **短历史优先级**：历史 <25 条时 §4.1 的 ⌊len×0.4⌋ cap 使候选 <10——保底上限 = 候选条数（保底 = min(10, 候选条数)，不突破 40% cap——防"压缩了个寂寞"）；预算不足仅在候选 ≥10 且 10 条仍超预算时触发。

**D-T3 摘要材料相应扩大**：tailStart 前移 → 更多中间内容进摘要——与 §9.1 摘要 ≤1K 协同（砍价优先级已保证决策锚点/未决清单优先保留；材料更大时信息密度压力由模型按优先级处理）。

- **摘要调用输入**：600K 工具密集场景 tail 200-300K→≤90K → mid 增 ~100-200K 进摘要 LLM 调用（D6 序列化 cap 是单条非总量，无总量上限）——输入增大使摘要变慢/超时概率升，失败走 3 连败降级（压缩面板可见，人读线兜底正确性）；600K 窗口内输入仍可容纳（≤0.6×ctx − tail），**接受的取舍**：摘要质量与耗时换取 tail 释放空间，锁输入界断言。

**D-T4 预算只在压缩发生时计算**：不改变触发阈值 0.6；压缩后 history ≈ 摘要 + 占位 + ≤预算 tail。

**D-T5 期望效果（600K 场景）**：压缩后 history ≤ 90K（15%）；完整 prompt = 90K + system/tools（~40K 外计）≈ 130K ≈ 窗口 22%——**history 段单独达标 15%**（B 口径）。

**关键决策**：

- **B 口径**：history 段单独 ≤ 窗口 15%——不把 system/tools 固定开销计入（小窗口下固定开销本身可能 >15%，计入则永远不可达）。
- **预算为主、条数为辅、保底 10 条**：条数公式保留为候选上限（普通会话不误伤）；预算超限才前移 tailStart；保底 10 条防"最近对话失真"。**小窗口取舍**：≤64K 窗口 15% 预算可能小于保底 10 条估算（10×~1.3K ≈ 13K ≈ 20-40% 窗口）——保底优先于 15% 目标（最近真实对话保真 > 压缩率；小窗口模型成本低、重触发代价小）。**否决 `min(10, ⌊预算/单条均值⌋)` 可选项**：保底语义固定 10 条，均值启发式引入不确定性且让保底语义复杂化。
- **预算只作用于 tail，不作用触发**：触发阈值 0.6 不变（预算是压缩"结果"目标不是"何时压"判据）。
- **否决**：a) 对 tail 内单条巨型消息二次截断（与 shrinkOversized/64K 落盘职责重叠——大消息处理有专门机制，tail 预算只做段边界选择）；b) 预算不足时砍光 tail 全靠摘要（最近真实对话失真——保底 10 条否决此路线）。

## 5. 降级链（D6）——三级（LLM 摘要 → 确定性截断 → 单消息截断）

两端统一三级降级模型：

1. **LLM 摘要**：`thinking: null` / `reasoningEffort: null`；序列化 user 8000 / tool+assistant 2000 cap。
2. **确定性截断**：连续 `COMPRESS_FAILURE_LIMIT = 3` 次失败 → `compressFallback`（FALLBACK_NOTE，丢 middle 不碰网络）。
3. **单消息截断**：超阈值但无 middle 可切（历史 = 1 条单条巨型消息场景——被 D12 KEEP_HEAD=0 取代后仅剩此场景，历史 ≥2 条即可切出中间段）→ `shrinkOversized`：user/tool 体 8000 上限、keepHead 50%/keepTail 25%，不动 reasoning/tool_calls 结构。

- **废弃** VS Code 启发式摘要：`User:/Assistant:` 流水账对 agent 工作日志价值低，且与真实消息难以区分（模型会把"User:" 当真实输入）；确定性截断 + 明确 note 更诚实。
- **失败计数语义统一**：**每次 runAgent（用户消息）开始时重置**（CLI 现状跨消息累计，改为一致、可预测）。

## 6. 压缩后回注（D7）、双线历史（D10）与 checkpoint（D8）

### 6.1 压缩后回注（D7）

压缩成功后回注：`task（去重：先滤掉历史中 TASK_REINJECT_PREFIX 旧注入，再注入 pending 全量 + done 最多 3）` + `plan mode` + `AUTO/permission`。

- 理由：done 只列 3 条省 token 且信息足够；去重保证单源真值。

### 6.2 双线历史（D10）——既有共识

- CLI：`pushReal` 源头双写；压缩只动机读线。
- VS Code：调用方经 `opts.history`/`opts.fullHistory` 传入；`compactHistory` 只处理机读线。
- 会话持久化：CLI `saveSession` 写 `history`+`contextHistory`、`applySession` 机读线从 `contextHistory` 恢复；VS Code `saveMessages(msgDir, name, messages, contextHistory)` 双字段。保持不变。
- **人读线内存表示修订（2026-09-11，TUI-OOM-ROOTCAUSE 批）**：「人读线全量」指**记录/落盘语义**
  （完整记录在盘、压缩不触）；运行期内存 = 有界窗口（磁盘为准 + 内存窗口）——机制权威见
  `SESSION.md` §14。本节其余语义（压缩只动机读线）逐字不变。

### 6.3 压缩前 checkpoint（D8）——已移除

原设计：压缩前 git checkpoint + 注入引用（失败不阻塞）。

**2026-08 决策：移除**（用户拍板）。理由：双线历史（机读 `history` + 人读 `_fullHistory`）已保证压缩后可恢复完整上下文（resume 走人读线）；压缩前快照白占磁盘。checkpoint 仅保留：模型手动调用、rewind 前 pre-rewind 快照、git 破坏命令 guard 快照。

## 7. 压缩过程文案与静默（D9 / D11）

### 7.1 文案与形状（D9）

- 摘要调用 `thinking: null` / `reasoningEffort: null`（纯文本任务不烧推理 token）。
- 占位回复固定 `"Understood. I'll continue from these notes, re-verifying anything transient."`
- COMPACTION_PREFIX 文案两端已一致（`[Context was automatically compacted…]`），保持不变。
- 序列化格式一致：`[role][ called tools: …] content`。

### 7.2 对前端静默（D11）

**摘要调用不传** `onToken`/`onReasoning`（前端对压缩过程静默）。

- 问题背景：CLI 摘要调用曾把 `callbacks.onToken`/`onReasoning` 透传给摘要 LLM（`context.mjs`），导致摘要生成过程像正常回复一样流式显示在对话区（`ensureAssistantLabel` + streaming 渲染）——用户看到一段非回复的陌生文本。VS Code 无此问题（摘要不接流式回调；面板只渲染人读线，压缩 note 是机读注入）。
- 压缩发生只通过既有状态提示告知用户：CLI `agent-turn.mjs` 的 `onCompress` 回调（`"[context] Context too long, auto-compacted…"`）；VS Code 压缩后回注/状态提示。
- 恢复渲染（CLI `startup.mjs` / VS Code `_loadSession`）读人读线，压缩 note 不在其中，天然不显示——无需改动。

## 8. 压缩体验：进度感知 + 失败可见性（压缩面板）

> 用户问题：Q2 压缩时 LLM 摘要耗时长，TUI 无"压缩中"反馈——用户看到程序"忽然僵住不动"；Q3 压缩失败静默飞出，用户无提示。Q3 的另一根因（deepseek 续写 400）见 PROVIDER.md §14——本节管"压缩/摘要执行过程中的可见性与失败不静默"。

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/CONTEXT-COMPACTION.md`。

### 8.2 压缩生命周期回调（D-C1）

对齐既有 `onCompress` 形态（agent.mjs）：

- `onCompressStart`——`compressIfNeeded` 进入摘要调用**前**触发（context.mjs 的摘要 `chat()` 调用前）。
- `onCompress`（完成）——保留不动，携带完成信息。
- `onCompressFail(error)`——压缩 catch 分支（`compressIfNeeded` 调用方的 catch）触发，带错误对象（message + name + 是否 400/超时）。现有静默计数逻辑保留（失败策略不变：`COMPRESS_FAILURE_LIMIT` 后 `compressFallback` 截断兜底），**只加可见性**。
- 回调缺省 = no-op（F4：`callbacks?.onCompressStart?.()` 形式，与现有 onCompress 一致）。

### 8.3 TUI 压缩面板（D-C2）

复用子 agent 面板机制（AGENT-LOOP §7.2.1）——用户要求"像子agent 面板那样显示压缩会话"。

- `onCompressStart` → 打开一个压缩面板区块：头部 `Compressing context…`（C.warn）+ 进行中状态（耗时 ticker + "summarizing N messages" 阶段标签——N = 待摘要历史条数）。面板独立于会话流（复用 subagent-blocks 的区块创建/更新/冻结机制——压缩是阻塞主循环的串行步骤，但面板显示的是"正在发生什么"，与并行子 agent 面板同构，不冲突）。
- **面板状态机**：`Compressing…`（进行中）→ `Compression failed: <错误>`（失败，仅错误文本，**不含降级说明**）→ 重试时回到进行中（每次 onCompressStart 重置）→ **第 3 次失败后 `compressFallback` 实际运行** → 面板更新为 `Compression failed — fallback: truncated to N messages`（此时降级说明才出现）。**降级说明与"连续 3 次失败"绑定，不在单次失败时显示**。
- `onCompress`（完成）→ 面板更新为完成态：`Compressed: N tokens freed → summary (Xs)`（**N = 压缩释放的 token 数** = 压缩前估计 − 压缩后估计，语义定死；Xs = 耗时），区块保留可折叠（同子 agent 完成态冻结形态）。
- `onCompressFail(error)` → 面板更新为失败态（错误文本可见，console.error 同步落）。
- 摘要调用保持静默（thinking:null、无 onToken——摘要内容不进会话流、不进面板 body；面板只显示**状态/阶段/耗时/结果**，不显示摘要正文——摘要正文是机器产物，用户看状态就够）。

### 8.4 headless / 桥接 / VS Code（D-C3）

- 回调链无 UI 时自然 no-op（F4）。
- **VS Code 端**（两端对齐）：VS Code 无 TUI 面板——对齐形态为 onCompressStart/onCompressFail 回调 + webview 压缩状态行（agent.mjs 压缩 catch 静默现状补 console.error + webview 通知行 "Compressing context——Compressed: N tokens freed (Xs)/failed: <错误>"；3 次失败降级说明同 §8.3 状态机语义）。

### 8.5 关键决策

- **压缩面板（用户要求形态）**：用户明确要求"压缩会话像子agent 面板那样显示（可见进度/完成）"——面板是需求本身，不是可裁减项。压缩虽阻塞主循环，但面板复用既有 subagent-blocks 机制（区块创建/更新/冻结/折叠），与子 agent 面板同构，无新布局体系。**摘要正文不流式进面板**（摘要调用保持静默——正文是机器产物，用户看状态/阶段/耗时/结果即可）——这是唯一保留的简化，且不违背"可见进度"需求（进度 = 状态 + 耗时 + 阶段，而非 token 流）。
- **失败可见但不改变失败策略**：Q3 的"飞出"根因（deepseek 续写 400）由 PROVIDER.md §14 修；本节只补"失败不静默"——错误策略（连续 3 次截断兜底）是既有正确行为，不加行为变更。
- **否决**：a) 一行状态提示（用户否定——"像子agent 面板那样显示"是明确要求，状态行不满足）；b) 压缩期间阻塞输入（破坏既有交互）；c) 自动重试压缩（摘要失败重试已由计数+截断兜底覆盖）。

## 9. 摘要内容：大小目标 ≤1K（D13）与探索结果语义摘要（H1/H2）

### 9.1 摘要大小目标 ≤1K tokens（D13）

用户裁定：**约定目标 ≤1K tokens**（长会话多次压缩时旧摘要再被摘要，失控摘要会逐层放大占窗）。

- **目标**：摘要输出目标 **≤1K tokens**（≈1000 中文字符 / 4000 ASCII 字符——按 estimateText 口径 ASCII/4）；超限时的砍价优先级明确；**形态 A：纯 prompt 指令，无 max_tokens 机械保险丝**（用户拍板——模型自控，偶超可接受）；两端语义一致。

**D13-1 prompt 尾句**（两端 SUMMARIZE_PROMPT 各自尾句段，语义同构）：

- 删除 "err on the long side" 语义，改为：**"Stay under ~1K tokens (≈1000 Chinese chars / 4000 ASCII chars) — a hard target."** An oversized summary wastes window and dilutes the tail; the old unbounded-length guidance is deprecated.
- **保留**信息完整性基调（要点式、决策锚点必保）——只约束长度，不退回 500-char 时代"越短越好"。

**D13-2 砍价优先级（超限时按序）——整条写入两端 SUMMARIZE_PROMPT 尾句段**：

1. 已完成任务 recap → 每项一行（既有规则重申为第一砍项）；
2. FILES CHANGED 的 why 注释 → 裸路径或分组；
3. 进行中任务的细节叙述 → 收紧；
4. **永不砍**：设计决策/锚点（架构选择、API 契约、命名、trade-off）与 UNRESOLVED ISSUES/TODOs——压缩后续接恢复依赖它们。

prompt 措辞（建议）：When over budget, trim in this order: completed recaps to one line; FILES CHANGED why-notes to bare paths; in-progress prose tightened. NEVER cut design anchors or UNRESOLVED ISSUES/TODOs.

**D13-3 无机械拦截**：不设 max_tokens 上限——模型失控长写时摘要被硬切会丢尾部且无标记；宁可偶超（prompt 约束 + COMPACTION_PREFIX 语义兜底 + 人读线完整可恢复）。

**D13-4 既有规则不动**：两清单（FILES CHANGED / UNRESOLVED）、COMPLETED vs IN-PROGRESS 区分、第一人称、honest 标注——全部保留。

**关键决策**：

- **A 形态（用户拍板）**：纯 prompt 指令、无机械保险丝——信任模型遵循；偶超可接受。
- **目标定"约 1K"非精确**：token 无精确计（estimateText 粗算）——"~1K tokens ≈ 1000 中文字符 / 4000 ASCII"给模型可操作直觉（ASCII/4 口径）。
- **砍价优先级写死**：防模型为凑长度误砍续接锚点（决策/未决清单）——这是压缩后恢复的关键。
- **否决**：a) max_tokens 保险丝（硬切丢尾部无标记，用户拍板不用）；b) 回到 500-char 硬 cap（信息保真倒退，2026-08 明确废弃过）。

> 需求层已迁出（2026-09-10 需求层拆分批）：本节需求见 `../requirements/CONTEXT-COMPACTION.md`。

**机制**（`summarizeRunExplorations(agent, callbacks, signal)`，两端同构）：

1. **触发时机**：主 `runAgent` **最终返回前**（即 onComplete 前，非 advisor/verify 推回的 `continue` 点）。若本轮新增探索类工具结果 ≥ 3 条，触发一次 LLM 蒸馏。
2. **探索类工具集**：`read` / `grep` / `glob` / `ls` / `code_search` / `doc_search` / `repo_outline`（只读知识型；`execute` 会写文件、不计入探索类）。
3. **定位本轮新增**：记录 run 起点的 `agent.history.length`（新增 `agent._runStartHistoryLen`）；run 最终返回前对 `history.slice(起点)` 中「assistant(tool_calls)+tool 结果」按探索类配对识别本轮探索突发。
4. **蒸馏**：新增专用 `EXPLORE_SUMMARY_PROMPT`，静默调用（对齐 D11：`thinking:null`、不接 onToken/onReasoning），把该批探索结果蒸馏为语义摘要——**发现了什么 / 在哪 / 关键结论**。
5. **收缩**：在 `agent.history`（机器线）里把这批「assistant→tools」配对**整体替换**为一条 `user` 角色 `[Exploration summary]` note——**保留 assistant/tool 配对边界、不产生孤儿 tool_calls/tool**（仿照 `splitHistory` 的配对保护）；`agent._fullHistory` 保持全量不动。
6. **阈值/降级**：<3 条不摘要；LLM 摘要失败时**静默跳过**（不阻塞本轮返回、不丢历史——原始结果仍在）；与压缩各自独立、不抢阈值。

**与 A（AGENT-LOOP §13 F2）的交互**：轮末摘要发生在编辑之后——「即将编辑而 read」的原始内容若在本轮内已被编辑消费则无需保留（编辑结果已在历史）；若跨轮到下一轮才编辑，摘要需足够支撑下一轮的精确编辑、必要时模型重读该文件。本设计选择轮末摘要、接受此权衡。

### 9.3 压缩保真清单（H2）

`SUMMARIZE_PROMPT` 追加显式清单——① 已改动文件清单；② 未决点/待办（供压缩后恢复定位）；「已完成 vs 进行中」已在 D12 规定、不重复。

## 10. 行为契约（验收口径）

统一后，两端在相同输入下应满足：

1. 仅当 history 末尾为 user/tool 且完整 prompt 估算 ≥ threshold 时触发压缩。
2. 压缩结果 = 摘要 note + "Understood" 占位 + tail（tail 按 **§4.4 token 预算**——§4.1 条数公式仅候选上限、保底 10；**KEEP_HEAD=0，无头部**——最早消息进摘要），任意切割不产生孤儿 tool_calls/tool 消息。
3. 摘要失败：连续 3 次（每次 runAgent 重置计数）后确定性截断；历史过短时单消息截断。
4. 压缩后：task（去重、pending 全量 + done≤3）、plan、AUTO/permission 回注齐全；实测基线失效。
5. 人读线全程不动；落盘双字段（CLI contextHistory / VS Code contextHistory）。
6. 空响应：自动重试 2 次，仍空抛错。

### 10.1 关联一致性项：empty-response 自动重试（E1）

随上下文压缩任务一并落地的关联一致性项（与 IK60QP 同步）：

- **CLI 已落地**：`MAX_EMPTY_RETRIES = 2`，空响应注入 `[System reminder: your last response was empty…]` 重试，仍空才抛错；预算 `agent._emptyRetries` 每次 runAgent 重置。
- VS Code：空响应直接 throw（`LLM returned empty response.`）——**移植 CLI 语义**（两端一致）。

## 11. 已知 parity 说明

- **CLI `splitHistory` 无「reverse 保护」**（VS Code `compact.mjs` 的 REVERSE protection）：reverse 保护处理「tail 以 tool_calls 悬空 assistant 开头、其 tool 结果在尾部之前被切掉」的**倒序**场景。
  - **CLI 不需要**——`repairHistory` 在 run 起点已保证 tool_calls→tool 顺序，run 中 append 与原样重建均保序，倒序无法产生。另有边界微差（CLI `i > headEnd` / `tokens <= threshold` vs VS Code `i >= headEnd` / `total < threshold`），为 off-by-one 粒度差、不改变语义。若将来两端 history 来源出现倒序，应回植该保护。
- **`SUMMARIZE_PROMPT` 两端措辞微差**（语义等价、非 byte-identical）：`EXPLORE_SUMMARY_PROMPT` 两端 byte-identical；`SUMMARIZE_PROMPT` 各端自有措辞（关键清单——D12 区分、FILES CHANGED、UNRESOLVED——均齐全）。如需防漂移可对齐为同一字面量（以 CLI 为准）；未强制对齐，避免牵动压缩行为与既有测试断言。

## 12. 实现位置（端点映射）

机制所在模块（两端当前落点，代码为准）：

| 机制 | CLI | VS Code |
|---|---|---|
| 压缩/预算/tail/截断/摘要主体（`splitHistory`/`compressIfNeeded`/`compressFallback`/`shrinkOversized`/`summarizeRunExplorations`/`tightenTailByBudget`/`repairedTailStart`/`tailBudgetTokens`） | `thincoder-core/context.mjs` | `src/compact.mjs（VSC 仓）`（`compactHistory`/`estimateTokens`/`tailStartByBudget`） |
| 常量（`IMAGE_TOKEN_ESTIMATE`/`TAIL_BUDGET_FRACTION`/`SUMMARY_TOKEN_ESTIMATE=1000`/`TAIL_FLOOR_MESSAGES`） | `thincoder-core/context.mjs` | `src/compact.mjs（VSC 仓）`（`SUMMARY_SEGMENT_ESTIMATE=1100`） |
| run 钩子（`_compressFailures` 重置/`_runStartHistoryLen`/onCompress* 接线） | `thincoder-core/agent.mjs` + `src/agent-turn.mjs` | `thincoder-core/agent.mjs` |
| 压缩面板渲染 | `src/tui/tool-events.mjs` + `src/tui/subagent-blocks.mjs` | webview 会话状态渲染 |
| SUMMARIZE_PROMPT / EXPLORE_SUMMARY_PROMPT | `thincoder-core/context.mjs`（export） | `src/compact.mjs（VSC 仓）` |

## 变更记录

- 2026-09-11（TUI-OOM-ROOTCAUSE 批）：§6.2 增补「人读线内存表示修订」行（全量 = 记录/落盘语义；
  内存窗口机制指 `SESSION.md` §14）；零机制语义变化。
- 2026-08-03：立项与两端首轮统一落地（决策 D1–D12、行为契约、CLI C1–C6 + VS Code V1–V9 清单）——原 §3 两端落地清单已核销，机制收敛为本文档主题正文。
- 2026-08-23：新增探索结果语义摘要 + 压缩保真（H1/H2，两端 `summarizeRunExplorations` 落地）；parity 说明（reverse 保护 / SUMMARIZE_PROMPT 措辞）评审定稿。
- 2026-09-02：用户拍板三项——压缩面板（Q2/Q3 进度感知 + 失败可见性）、摘要 ≤1K 目标（D13）、tail 按 token 预算 ≤15%（D-T1/D-T2，含 D4 公式改判"候选条数"语义并移挂预算约束、D12 COMPLETED vs IN-PROGRESS 句在 VS Code 端补齐）。两端实现 + 测试全绿；VS Code 端以 CLI 为准移植。
- 本文档为当前态重组版本；此前逐节变更流水账已折叠，机制正文保持当前生效语义。
