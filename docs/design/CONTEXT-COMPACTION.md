# 上下文压缩 · 标题 · 文本额度（CONTEXT-COMPACTION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 上下文压缩 | `thincoder-cli/src/context.mjs` | `thincoder-vscode/src/compact.mjs` |
| 会话标题 | `src/generate-title.mjs` | `src/extension/generate-title.mjs` |
| 文本额度 | `src/text-budget.mjs` | `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 162 | `src/context.mjs` ↔ `src/compact.mjs` | ② | 融合：取一侧（压缩触发 / 摘要 / 降级截断 / 尾部预算） | 分叉 ＝ 档名（context / compact）+ 目录；VSC 头注 20+ 处自述「CLI parity（CONTEXT-COMPACTION.md D2/D3/D4/D6）」⇒ 前提成立 | — | S1（建核补齐） |
| 163 | `src/generate-title.mjs` ↔ `src/extension/generate-title.mjs` | ② | 融合：取一侧 + 端差（CLI 仅 OpenAI 兼容 / VSC 三格式分派）按端注入 | 分叉 ＝ 目录 + 格式分派（CLI 头注自述「CLI is OpenAI-compatible ONLY」）；会话标题语义同 ⇒ 前提成立 | — | S1（建核补齐） |
| 164 | `src/text-budget.mjs` ↔ `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） | ② | 融合：核内单一文本额度纯函数（头保 + 中段标记 + 尾保） | 分叉 ＝ 落点（CLI 独立档 / VSC 住 run-helpers）；计长口径（UTF-16 码元）两端同 ⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（三条均为同构融合，差异以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/CONTEXT-COMPACTION.md`（306 行 · CLI 产品档——两端统一规范，逐批演进至当前态）。根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料 · 头注状态行 / 逐批变更流水账 · 需求侧已归位（本层同名需求档）。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**——本节一律按**现状路径**落笔（CLI 侧实现已住 `thincoder-core/**`；`thincoder-cli/src/tui/**` = CLI 壳体面；VSC 侧 = `thincoder-vscode/src/**`）。符号名与档路径为契约面，行号未逐条复核。
> **交叉板不复制**：provider 级 context 覆盖的公式权威 → 本层 `PROVIDER.md` §6.15（不复制）。

### 6.1 术语与双线

| 术语 | 含义 |
|---|---|
| 机读线 `history` | 送模型的上下文——压缩作用于此 |
| 人读线 `_fullHistory` / `fullHistory` | 永不压缩的完整记录（UI / resume 用） |
| prompt 估算 | system + tools schema + history（含注入）的 token 近似 |
| 安全点 | history 末尾消息 role ∈ {user, tool}（完整交换边界） |

### 6.2 触发：仅安全点（D1）与阈值 0.6（D2）

- **仅安全点检查**：history 末尾消息 role ∈ {user, tool} 时才检查压缩——压缩是结构性 splice（head + 摘要 + tail），在 assistant 半截切会破坏 tool 配对语境；安全点检查零成本。
- **阈值**：显式 `config.agent.compactThreshold` 优先；否则 auto = `specForModel(model).context × 0.6`；**判定对象 = 完整 prompt 估算**（system + tools + history）≥ 阈值即触发。
- **0.6 理由**：为注入上下文（git / 目录 / outline / memory / 文档——实测每轮 30–50K）+ 输出 / reasoning（部分模型 maxOutput 384K）留余量；0.8 在 1M 窗口只剩 200K，刚压缩完可能又超。
- **provider 级覆盖**：`providers[].context`（K 单位）覆盖 MODEL_SPECS 的 context 后，阈值与 tail 公式跟随覆盖值（公式权威 → 本层 `PROVIDER.md` §6.15）。

### 6.3 token 判定（D3）——实测优先 + 增量估算

- 有实测：`_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`；无实测（首轮 / 恢复后 / 压缩后）：`estimateTokens(history) + system / tools 估算`；压缩成功 / 会话恢复 / 新 run 时基线失效（置 null）。
- 估算公式统一（取 CLI 精细版）：文本 ASCII/4 + 非 ASCII/1；`reasoning_content`、`tool_calls` 参数计入；图像按 2000 token（取 VSC 保守值——CLI 原 256 偏低会延迟触发）。
- 理由：估算对 CJK 系统性低估，纯估算可能永不触发（CLI 实测教训）；实测值是完整上下文的真实成本。

### 6.4 切割：tail / 无头部 / 配对 / 预算四约束

**① tail 保留——候选条数公式（D4）**：`keepTail = min(max(10, floor(context/100_000 × 30)), floor(len × 0.4))`——本条为**候选条数**规则，最终保留量受 §6.4④ token 预算双约束（D-T1 / D-T2）。

- 理由：1M 窗口只留 10 条太薄（丢近期工作上下文）；40% 上限防小窗口「压缩了个寂寞」。

**② 无头部（D12）——`KEEP_HEAD = 0`**：最早的 2 条并入中间段一起进摘要。

- 历史：`KEEP_HEAD = 2`（「保留最初意图」）——单任务会话假设。
- 问题（用户反馈实证）：多任务连续会话中最早消息是**已完成的旧任务**——压缩后模型注意力被旧事锚住（「AI 忽然转向以前的旧事」）。
- 决策：摘要提示词增加「已完成 vs 进行中」区分；压缩后上下文 = 摘要注记 + 占位 + tail——锚点天然是当前任务。协议安全：head 为空后配对保护只剩 tail 侧；中段序列化为文本（`[assistant][ called tools: …]`）——无 orphan 风险。人读线不变。

**③ 切割配对保护（D5）——双侧**：head 侧 head 不以 `tool_calls` 结尾（CLI——并行工具结果被摘要吞掉是修过的真实 400 场景）；tail 侧 orphan tool 拉回其 owner（两端版——工具配对边界不被切断）。

**④ tail token 预算——压缩后 history 段 ≤ 窗口 15%（D-T1–D-T5）**：

- 背景（用户实测）：600K 窗口模型压缩后仍占 ~40%——条数公式不控 token——工具密集会话中 tail 条数失控、释放空间小、很快再触发。用户目标 = 压缩后 **15%**。
- **F1** = 压缩后 history 段（摘要注记 + 占位 + tail）≤ 窗口 **15%**（B 口径——system / tools / 注入在外单算）；**F2** 工具密集会话生效、普通会话不误伤（预算未超时行为与现状完全一致）；**F3** 与摘要 ≤1K 协同（§6.9）；**F4** 两端一致。
- `tailBudget = context × 0.15 − 摘要估算`（摘要 ~1K）。两端常量实现差（可接受）：CLI `SUMMARY_TOKEN_ESTIMATE = 1000` / VSC `SUMMARY_SEGMENT_ESTIMATE = 1100`——语义等价（<0.2% 窗口差）。
- 测量边界：15% 按压缩时刻 history 段计量——压缩后回注（§6.6）不计入预算，其增量由 ±5% 容差吸收。
- 落地形态：`keepTailSize` 保持纯条数公式（语义改为「候选条数」），预算双约束在 `splitHistory` 接线——候选尾超预算 → `tightenTailByBudget` 前移 tailStart（候选尾头部并入摘要段）直到 ≤ 预算或触保底；D5 修复提取为 `repairedTailStart` 供候选 / floor 两边界复用（落点 = `thincoder-core/context.mjs`）。
- pair-safe 边界约束：tailStart 只允许落在配对安全边界（plain 消息，或完整 assistant(tool_calls)→tools 对起点）——无 pair-safe 边界能满足预算 → 进 D-T2 保底并接受超支。
- **D-T2 保底 10 条**：预算不足以保留 10 条原文时保底优先（保留最近 10 条、允许小幅超预算）——最近真实对话全吞进摘要会失真。单条巨型消息（估算 > 预算总量）保留该条本身（单条截断是 `shrinkOversized` 职责）。短历史（<25 条）：保底上限 = 候选条数（= min(10, 候选条数)）。
- **D-T3**：tailStart 前移 → 更多中间内容进摘要（砍价优先级保证决策锚点 / 未决清单优先保留）；摘要输入增大使变慢 / 超时概率升——失败走 3 连败降级（压缩面板可见，人读线兜底正确性）。
- **D-T4**：预算只在压缩发生时计算，不改变触发阈值 0.6。
- **D-T5 期望效果（600K 场景）**：压缩后 history ≤ 90K（15%）；完整 prompt ≈ 130K ≈ 窗口 22%——history 段单独达标 15%。

### 6.5 降级链（D6）——三级

1. **LLM 摘要**（`thinking: null` / `reasoningEffort: null`；序列化 user 8000 / tool+assistant 2000 cap）；
2. **确定性截断**：连续 `COMPRESS_FAILURE_LIMIT = 3` 次失败 → `compressFallback`（FALLBACK_NOTE——丢 middle、不碰网络）；
3. **单消息截断**：超阈值但无 middle 可切（历史 = 1 条巨型消息）→ `shrinkOversized`：user / tool 体 8000 上限、keepHead 50% / keepTail 25%，不动 reasoning / tool_calls 结构。

- **失败计数语义统一**：每次 runAgent（用户消息）开始时重置（CLI 现状跨消息累计 → 改一致、可预测）。

### 6.6 压缩后回注（D7）· 双线历史（D10）· 压缩前 checkpoint（D8 已移除）

- **回注（D7）**：压缩成功后回注 `task`（去重：先滤掉历史中 TASK_REINJECT_PREFIX 旧注入，再注入 pending 全量 + done 最多 3）+ `plan mode` + `AUTO / permission`。理由：done 只列 3 条省 token 且信息足够；去重保证单源真值。
- **双线历史（D10）**：CLI `pushReal` 源头双写、压缩只动机读线；VSC 经 `opts.history` / `opts.fullHistory` 传入、`compactHistory` 只处理机读线。会话持久化双字段（CLI `saveSession` 写 `history` + `contextHistory`、`applySession` 从 `contextHistory` 恢复；VSC 同理）——保持不变。
  「人读线全量」= **记录 / 落盘语义**（完整记录在盘、压缩不触）；运行期内存 = 有界窗口（机制权威 → 本层 `SESSION.md` §6.14）。
- **压缩前 checkpoint（D8）——已移除**：原设计 = 压缩前 git checkpoint + 注入引用（失败不阻塞）；2026-08 用户拍板移除（双线历史已保证压缩后可恢复完整上下文；压缩前快照白占磁盘）。checkpoint 仅保留：模型手动调用、rewind 前 pre-rewind 快照、git 破坏命令 guard 快照（机制本体 = 本层 `CHECKPOINT.md`）。

### 6.7 文案与静默（D9 / D11）

- **D9 文案与形状**：摘要调用 `thinking: null` / `reasoningEffort: null`；占位回复固定 `"Understood. I'll continue from these notes, re-verifying anything transient."`；COMPACTION_PREFIX 文案两端一致（`[Context was automatically compacted…]`）；序列化格式 `[role][ called tools: …] content`。
- **D11 对前端静默**：摘要调用不传 `onToken` / `onReasoning`（CLI 曾透传导致摘要像回复一样流式显示——用户看到非回复陌生文本；VSC 本无此问题）。压缩发生只经既有状态提示（CLI `onCompress` 回调 `"[context] Context too long, auto-compacted…"`）；恢复渲染读人读线、压缩 note 不在其中——天然不显示。

### 6.8 压缩体验：进度感知 + 失败可见性（压缩面板）

- **生命周期回调（D-C1）**：`onCompressStart`（摘要调用前）+ `onCompress`（完成——保留不动）+ `onCompressFail(error)`（catch 分支——带错误对象；失败策略不变，**只加可见性**）；回调缺省 = no-op。接线落点 = `thincoder-core/agent.mjs` + `thincoder-cli/src/tui/agent-turn.mjs`。
- **TUI 压缩面板（D-C2）**：复用子 agent 面板机制（区块创建 / 更新 / 冻结 / 折叠——`thincoder-cli/src/tui/subagent-blocks.mjs` 同构）。状态机：`Compressing…` → `Compression failed: <错误>`（不含降级说明）→ 重试回进行中 → **第 3 次失败后 `compressFallback` 实际运行** →
  `Compression failed — fallback: truncated to N messages`（降级说明与「连续 3 次失败」绑定）。完成 → `Compressed: N tokens freed → summary (Xs)`（N = 压缩释放 token 数 = 压缩前估计 − 压缩后估计——语义定死）。
  **摘要正文不进面板**（只显示状态 / 阶段 / 耗时 / 结果）。
- **headless / VSC（D-C3）**：回调链无 UI 时自然 no-op；VSC 无 TUI 面板——对齐形态 = onCompressStart / onCompressFail + webview 压缩状态行（语义同上方状态机）。

### 6.9 摘要内容：≤1K 目标（D13）与探索结果语义摘要（H1 / H2）

**D13 摘要 ≤1K tokens**（用户裁定——长会话多次压缩时旧摘要再被摘要，失控摘要逐层放大占窗）：

- **D13-1**：SUMMARIZE_PROMPT 尾句删「err on the long side」，改为 **"Stay under ~1K tokens (≈1000 Chinese chars / 4000 ASCII chars) — a hard target."**；保留信息完整性基调（要点式、决策锚点必保）。
- **D13-2 砍价优先级**（超限时按序）：① 已完成任务 recap → 每项一行；② FILES CHANGED 的 why 注释 → 裸路径或分组；③ 进行中任务细节叙述 → 收紧；④ **永不砍**：设计决策 / 锚点与 UNRESOLVED ISSUES / TODOs。
- **D13-3 无机械拦截**：不设 max_tokens（硬切丢尾部且无标记）——prompt 约束 + COMPACTION_PREFIX 语义兜底 + 人读线完整可恢复。
- **D13-4**：既有规则不动（FILES CHANGED / UNRESOLVED 两清单、COMPLETED vs IN-PROGRESS 区分、第一人称、honest 标注）。

**H1 探索结果语义摘要**（`summarizeRunExplorations(agent, callbacks, signal)`——两端同构）：

- 触发：主 `runAgent` **最终返回前**（onComplete 前，非 continue 点）——本轮新增探索类工具结果 ≥ 3 条触发一次 LLM 蒸馏。
- 探索类工具集：`read` / `grep` / `glob` / `ls` / `code_search` / `doc_search` / `repo_outline`（只读知识型；`execute` 会写文件、不计入）。
- 定位本轮新增：记录 run 起点 `agent._runStartHistoryLen`；run 返回前对 `history.slice(起点)` 按探索类配对识别探索突发。
- 蒸馏：专用 `EXPLORE_SUMMARY_PROMPT`（静默调用——对齐 D11）把该批结果蒸馏为「发现了什么 / 在哪 / 关键结论」。
- 收缩：在机器线里把这批配对**整体替换**为一条 `user` 角色 `[Exploration summary]` note（保留配对边界——仿 `splitHistory` 配对保护）；`_fullHistory` 全量不动。
- 阈值 / 降级：<3 条不摘要；LLM 失败静默跳过（不阻塞返回、不丢历史）；与压缩各自独立。
- 与轮末编辑的交互（设计取舍）：轮末摘要发生在编辑之后——「即将编辑而 read」的原文若本轮已被编辑消费则无需保留；跨轮才编辑时摘要须足够支撑精确编辑、必要时模型重读文件。

**H2 压缩保真清单**：SUMMARIZE_PROMPT 追加显式清单——① 已改动文件清单；② 未决点 / 待办（供压缩后恢复定位）。

### 6.10 行为契约（验收口径）

1. 仅当 history 末尾为 user / tool 且完整 prompt 估算 ≥ threshold 时触发；
2. 压缩结果 = 摘要 note + "Understood" 占位 + tail（§6.4④ 预算 + 保底 10；KEEP_HEAD = 0），任意切割不产生孤儿 tool_calls / tool 消息；
3. 摘要失败：连续 3 次（每次 runAgent 重置计数）后确定性截断；历史过短时单消息截断；
4. 压缩后回注齐全（task 去重 / plan / AUTO）、实测基线失效；
5. 人读线全程不动、落盘双字段；
6. 空响应：自动重试 2 次仍空抛错（E1——`MAX_EMPTY_RETRIES = 2`，空响应注入 `[System reminder: your last response was empty…]`；VSC 原直接 throw——移 CLI 语义）。

### 6.11 已知 parity 说明

- **CLI `splitHistory` 无「reverse 保护」**（VSC `thincoder-vscode/src/compact.mjs` 有 REVERSE protection——处理 tail 以悬空 assistant 开头、其 tool 结果在尾部之前被切的**倒序**场景）：CLI 不需要——`repairHistory` 在 run 起点已保证 tool_calls→tool 顺序、run 中 append 保序，倒序无法产生；
  边界微差（`i > headEnd` vs `i >= headEnd` 等）为 off-by-one 粒度差、不改语义。若将来两端 history 来源出现倒序，应回植该保护。
- **`SUMMARIZE_PROMPT` 两端措辞微差**（语义等价、非 byte-identical）；`EXPLORE_SUMMARY_PROMPT` 两端 byte-identical。如需防漂移可对齐（以 CLI 为准）；未强制，避免牵动压缩行为与既有测试断言。

### 6.12 实现位置（两端当前落点——代码为准）

| 机制 | CLI | VS Code |
|---|---|---|
| 压缩 / 预算 / tail / 截断 / 摘要主体（`splitHistory` / `compressIfNeeded` / `compressFallback` / `shrinkOversized` / `summarizeRunExplorations` / `tightenTailByBudget` / `repairedTailStart` / `tailBudgetTokens`） | `thincoder-core/context.mjs` | `thincoder-vscode/src/compact.mjs`（`compactHistory` / `estimateTokens` / `tailStartByBudget`） |
| 常量（`IMAGE_TOKEN_ESTIMATE` / `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE = 1000` / `TAIL_FLOOR_MESSAGES`） | `thincoder-core/context.mjs` | `thincoder-vscode/src/compact.mjs`（`SUMMARY_SEGMENT_ESTIMATE = 1100`） |
| run 钩子（`_compressFailures` 重置 / `_runStartHistoryLen` / onCompress* 接线） | `thincoder-core/agent.mjs` + `thincoder-cli/src/tui/agent-turn.mjs` | `thincoder-vscode` 侧同构 |
| 压缩面板渲染 | `thincoder-cli/src/tui/tool-events.mjs` + `thincoder-cli/src/tui/subagent-blocks.mjs` | webview 会话状态渲染 |
| SUMMARIZE_PROMPT / EXPLORE_SUMMARY_PROMPT | `thincoder-core/context.mjs`（export） | `thincoder-vscode/src/compact.mjs` |

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-CC1 | 触发仅安全点（D1）+ 阈值显式优先 / auto = context × 0.6（D2） | 半截切破坏 tool 配对语境；0.6 为注入 + 输出留余量（0.8 留不够） |
| D-CC2 | token 判定 = 实测优先 + 增量估算（D3） | 纯估算对 CJK 系统性低估——可能永不触发（实测教训） |
| D-CC3 | tail 公式 = 候选条数（D4），最终受双约束 | 1M 窗口 10 条太薄；40% 上限防小窗口「压缩了个寂寞」 |
| D-CC4 | KEEP_HEAD = 0（D12） | 多任务会话中旧任务原文锚住注意力（用户反馈实证）；摘要承担「已完成 vs 进行中」区分 |
| D-CC5 | 配对保护双侧（D5） | head 侧吞并行工具结果 = 真实 400 场景；tail 侧 orphan 拉回 owner |
| D-CC6 | 预算为主 / 条数为辅 / 保底 10 条（承 D-T1 与 D-T2） | 用户目标 15%；保底防「最近对话失真」；小窗口取舍 = 保底优先于 15%。**否决** `min(10, ⌊预算/单条均值⌋)`（均值启发式引入不确定性）· 对 tail 单条巨型消息二次截断（与 `shrinkOversized` / 64K 落盘职责重叠）· 预算不足时砍光 tail（失真） |
| D-CC7 | 三级降级链（D6）；失败计数每次 runAgent 重置 | 确定性截断 + 明确 note 比启发式摘要诚实。**废弃** VSC 启发式摘要（`User:/Assistant:` 流水账价值低且难与真实消息区分） |
| D-CC8 | 压缩后回注去重（D7）：pending 全量 + done ≤3 | done 只列 3 条省 token；去重保证单源真值 |
| D-CC9 | 压缩前 checkpoint **移除**（D8——2026-08 用户拍板） | 双线历史已保证可恢复；压缩前快照白占磁盘 |
| D-CC10 | 摘要调用静默（D11）：不传 onToken / onReasoning | 摘要过程曾像回复一样流式显示——用户看到陌生文本 |
| D-CC11 | 压缩面板 = 复用子 agent 面板机制（D-C2） | 用户明确要求「像子 agent 面板那样显示」；否决一行状态提示 · 压缩期间阻塞输入 · 自动重试 |
| D-CC12 | 摘要 ≤1K = 纯 prompt 指令、无 max_tokens（D13-3） | 硬切丢尾部且无标记；**否决** max_tokens 保险丝 · 回到 500-char 硬 cap（信息保真倒退） |
| D-CC13 | 砍价优先级写死（D13-2）：决策锚点 / 未决清单永不砍 | 防模型为凑长度误砍续接锚点——压缩后恢复的关键 |
| D-CC14 | 探索结果语义摘要 = 轮末蒸馏替换（H1） | 机器线信号密集；失败静默跳过、不阻塞 |
| D-CC15 | 空响应自动重试 2 次（E1）——两端一致（VSC 移 CLI 语义） | 空响应是瞬时故障——重试 2 次兜底；仍空才抛错 |
| D-CC16 | 预算测量口径 = B（history 段单独 ≤15%） | 不把 system / tools 固定开销计入（小窗口下固定开销本身可能 >15%，计入则永远不可达） |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/CONTEXT-COMPACTION.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 头注「状态：已落地…2026-09-02 完成当前态全部机制」 | 交付状态标记 | 时点状态——归批次档 / 台账（D2） |
| 「本文档为当前态重组版本；此前逐节变更流水账已折叠」+ 文末「变更记录」 | 重写叙述 + 逐批变更流水账 | 历史叙述——本档自有变更记录 |
| 「需求层已迁出」注（旧档内两处） | 拆分时点注 | 时点材料——需求已归位本层同名需求档 |
| §2.1 / §6.2 内的「CLI 现状…改为一致」等**修正前状态描述** | 修正过程叙述 | 结论已入 §6.2 / §6.6（修正后语义为准） |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档内 VS Code 实现细节逐行（§2.1 / §7 / §9 等） | VSC 侧同构实现 | 属 VSC 产品树（`thincoder-vscode/**`）；同构语义已入 §6 各节 |
| 关联旧编号指针（`AGENT-LOOP.md` §7.2.1 面板机制等） | 旧档内跨档指针 | 指针已随落位重写（§6.8 引现状坐标）；旧编号不再维护 |

### 8.3 需求侧（已并入本层需求档）

旧档需求面（原 §8.1 压缩体验 F1–F4 · §9.2 探索摘要条目 F1–F3 / N1–N3）=== 本板块需求层，已并入本层需求档 `docs/requirements/CONTEXT-COMPACTION.md`（**与本档同名成对**）——本档不重复。

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **225 行**（B 轮并入前 42 行）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #162–#164）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §6 **机制面**（术语与双线 / 触发 / token 判定 / 切割四约束 / 降级链 / 回注与双线 / 文案与静默 / 压缩面板 / 摘要 ≤1K 与探索摘要 / 行为契约 / parity / 实现位置）· §7 **关键决策（D-CC1–16）** · §8 **不并项与历史沿革** · §9 体量（低于软线，无需拆分）；
  来源 = `thincoder-cli/docs/design/CONTEXT-COMPACTION.md`（**旧档一字未改**——原地作参照历史）；需求侧已并入本层 `docs/requirements/CONTEXT-COMPACTION.md`；首部加机制面指针一行。
