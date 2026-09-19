# 上下文压缩 · 标题 · 文本额度（CONTEXT-COMPACTION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 上下文压缩 | `thincoder-cli/src/context.mjs`（已删——现体 `thincoder-core/context.mjs`） | `thincoder-vscode/src/compact.mjs`（已删——W6 迁核，现体 `thincoder-core/context.mjs`） （迁移期引文） |
| 会话标题 | `thincoder-core/generate-title.mjs` | `thincoder-vscode/src/extension/generate-title.mjs` |
| 文本额度 | `src/text-budget.mjs` | `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 162 | `src/context.mjs` ↔ `src/compact.mjs`（两旧档**已删**——现体 `thincoder-core/context.mjs`） | ② | 融合：取一侧（压缩触发 / 摘要 / 降级截断 / 尾部预算） | 分叉 ＝ 档名（context / compact）+ 目录；VSC 头注 20+ 处自述「CLI parity（CONTEXT-COMPACTION.md D2/D3/D4/D6）」⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 163 | `thincoder-core/generate-title.mjs` ↔ `thincoder-vscode/src/extension/generate-title.mjs` | ② | 融合：取一侧 + 端差（CLI 仅 OpenAI 兼容 / VSC 三格式分派）按端注入 | 分叉 ＝ 目录 + 格式分派（CLI 头注自述「CLI is OpenAI-compatible ONLY」）；会话标题语义同 ⇒ 前提成立 | — | S1（建核补齐） |
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
- 决策：摘要提示词增加「已完成 vs 进行中」区分；压缩后上下文 = 摘要注记 + 占位 + tail（tail 首条为 assistant 时占位并入该条——§7 D-CC18）——锚点天然是当前任务。协议安全：head 为空后 head 侧无切割面，配对自足由 **tail 侧配对安全边界**承接——中段以**真身消息**进摘要请求（§6.14）。
  （原「中段序列化为文本（`[assistant][ called tools: …]`）——无 orphan 风险」句随序列化面退役——2026-09-18 收正。）人读线不变。

**③ 切割配对保护（D5）——双侧**：head 侧 head 不以 `tool_calls` 结尾（CLI——并行工具结果被摘要吞掉是修过的真实 400 场景）；tail 侧 orphan tool 拉回其 owner（两端版——工具配对边界不被切断）。

**④ tail token 预算——压缩后 history 段 ≤ 窗口 15%（D-T1–D-T5）**：

- 背景（用户实测）：600K 窗口模型压缩后仍占 ~40%——条数公式不控 token——工具密集会话中 tail 条数失控、释放空间小、很快再触发。用户目标 = 压缩后 **15%**。
- **F1** = 压缩后 history 段（摘要注记 + 占位 + tail）≤ 窗口 **15%**（B 口径——system / tools / 注入在外单算）；**F2** 工具密集会话生效、普通会话不误伤（预算未超时行为与现状完全一致）；**F3** 与摘要 ≤1K 协同（§6.9）；**F4** 两端一致。
- `tailBudget = context × 0.15 − 摘要估算`（摘要 ~1K）。**两端常量单源**（W6 收正）：`SUMMARY_TOKEN_ESTIMATE = 1000`（旧 VSC 侧 `SUMMARY_SEGMENT_ESTIMATE = 1100` 随迁核退场——语义等价差 <0.2% 窗口差不再存在）；`IMAGE_TOKEN_ESTIMATE = 2000`/part 两端同值。
- 测量边界：15% 按压缩时刻 history 段计量——压缩后回注（§6.6）不计入预算，其增量由 ±5% 容差吸收。
- 落地形态：`keepTailSize` 保持纯条数公式（语义改为「候选条数」），预算双约束在 `splitHistory` 接线——候选尾超预算 → `tightenTailByBudget` 前移 tailStart（候选尾头部并入摘要段）直到 ≤ 预算或触保底；D5 修复提取为 `repairedTailStart` 供候选 / floor 两边界复用（落点 = `thincoder-core/context.mjs`）。
- pair-safe 边界约束：tailStart 只允许落在配对安全边界（plain 消息，或完整 assistant(tool_calls)→tools 对起点）——无 pair-safe 边界能满足预算 → 进 D-T2 保底并接受超支。
- **D-T2 保底 10 条**：预算不足以保留 10 条原文时保底优先（保留最近 10 条、允许小幅超预算）——最近真实对话全吞进摘要会失真。单条巨型消息（估算 > 预算总量）保留该条本身（单条截断是 `shrinkOversized` 职责）。短历史（<25 条）：保底上限 = 候选条数（= min(10, 候选条数)）。
- **D-T3**：tailStart 前移 → 更多中间内容进摘要（砍价优先级保证决策锚点 / 未决清单优先保留）；摘要输入增大使变慢 / 超时概率升——失败走 3 连败降级（压缩面板可见，人读线兜底正确性）。
- **D-T4**：预算只在压缩发生时计算，不改变触发阈值 0.6。
- **D-T5 期望效果（600K 场景）**：压缩后 history ≤ 90K（15%）；完整 prompt ≈ 130K ≈ 窗口 22%——history 段单独达标 15%。

### 6.5 降级链（D6）——三级

1. **LLM 摘要**（`thinking: null` / `reasoningEffort: null`；中段以**真身消息**进请求、逐条**不截断**——§6.14。原「序列化 user 8000 / tool+assistant 2000 cap」句随序列化面退役——2026-09-18 收正）；
2. **确定性截断**：连续 `COMPRESS_FAILURE_LIMIT = 3` 次失败 → `compressFallback`（FALLBACK_NOTE——丢 middle、不碰网络）；
3. **单消息截断**：超阈值但无 middle 可切（历史 = 1 条巨型消息）→ `shrinkOversized`：user / tool 体 8000 上限、keepHead 50% / keepTail 25%，不动 reasoning / tool_calls 结构。

- **失败计数语义统一**：每次 runAgent（用户消息）开始时重置（CLI 现状跨消息累计 → 改一致、可预测）。

### 6.6 压缩后回注（D7）· 双线历史（D10）· 压缩前 checkpoint（D8 已移除）

- **回注（D7）**：压缩成功后回注 `task`（去重：先滤掉历史中 TASK_REINJECT_PREFIX 旧注入，再注入 pending 全量 + done 最多 3）+ `plan mode` + `AUTO / permission`。理由：done 只列 3 条省 token 且信息足够；去重保证单源真值。
- **双线历史（D10）**：CLI `pushReal` 源头双写、压缩只动机读线；VSC 经 `opts.history` / `opts.fullHistory` 传入、`compactHistory` 只处理机读线。会话持久化双字段（CLI `saveSession` 写 `history` + `contextHistory`、`applySession` 从 `contextHistory` 恢复；VSC 同理）——保持不变。
  「人读线全量」= **记录 / 落盘语义**（完整记录在盘、压缩不触）；运行期内存 = 有界窗口（机制权威 → 本层 `SESSION.md` §6.14）。
- **压缩前 checkpoint（D8）——已移除**：原设计 = 压缩前 git checkpoint + 注入引用（失败不阻塞）；2026-08 用户拍板移除（双线历史已保证压缩后可恢复完整上下文；压缩前快照白占磁盘）。checkpoint 仅保留：模型手动调用、rewind 前 pre-rewind 快照、git 破坏命令 guard 快照（机制本体 = 本层 `CHECKPOINT.md`）。

### 6.7 文案与静默（D9 / D11）

- **D9 文案与形状**：摘要调用 `thinking: null` / `reasoningEffort: null`；占位回复固定 `"Understood. I'll continue from these notes, re-verifying anything transient."`；
  （tail 首条为 assistant 时并入该条——回声安全，§6.10 #7 / §7 D-CC18）；COMPACTION_PREFIX 文案两端一致（`[Context was automatically compacted…]`）；序列化格式**已退场**——中段以真身消息进摘要请求（§6.14 · 2026-09-18 收正）。
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

**H1 探索结果语义摘要**（**核形** `summarizeRunExplorations(agent, callbacks, signal, depth, extras)`——`extras` 居第 5 位；**端形**（`thincoder-vscode/src/explore-distill.mjs:11`）= 在 `agent`（第 5）之后追加的第 6 位 `extras`（`agent` 序位不变）；两端同构；**调用形态 = §6.15**）：

- 触发：主 `runAgent` **最终返回前**（onComplete 前，非 continue 点）——本轮新增探索类工具结果 ≥ 3 条触发一次 LLM 蒸馏。
- 探索类工具集：`read` / `grep` / `glob` / `ls` / `code_search` / `doc_search` / `repo_outline`（只读知识型；`execute` 会写文件、不计入）。
- 定位本轮新增：记录 run 起点 `agent._runStartHistoryLen`；run 返回前对 `history.slice(起点)` 按探索类配对识别探索突发。
- 蒸馏：专用 `EXPLORE_SUMMARY_PROMPT`（静默调用——对齐 D11）把该批结果蒸馏为「发现了什么 / 在哪 / 关键结论」；调用形态 = 会话续写（前缀复用）——§6.15。
- 收缩：在机器线里把这批配对**整体替换**为一条 `user` 角色 `[Exploration summary]` note（保留配对边界——仿 `splitHistory` 配对保护）；`_fullHistory` 全量不动。
- 阈值 / 降级：<3 条不摘要；LLM 失败静默跳过（不阻塞返回、不丢历史）；与压缩各自独立。
- 与轮末编辑的交互（设计取舍）：轮末摘要发生在编辑之后——「即将编辑而 read」的原文若本轮已被编辑消费则无需保留；跨轮才编辑时摘要须足够支撑精确编辑、必要时模型重读文件。

**H2 压缩保真清单**：SUMMARIZE_PROMPT 追加显式清单——① 已改动文件清单；② 未决点 / 待办（供压缩后恢复定位）。

### 6.10 行为契约（验收口径）

1. 仅当 history 末尾为 user / tool 且完整 prompt 估算 ≥ threshold 时触发；
2. 压缩结果 = 摘要 note + "Understood" 占位 + tail（§6.4④ 预算 + 保底 10；KEEP_HEAD = 0）——tail 首条为 assistant 时占位并入该条（copy-on-write；§7 D-CC18），任意切割不产生孤儿 tool_calls / tool 消息；
3. 摘要失败：连续 3 次（每次 runAgent 重置计数）后确定性截断；历史过短时单消息截断；
4. 压缩后回注齐全（task 去重 / plan / AUTO）、实测基线失效；
5. 人读线全程不动、落盘双字段；
6. 空响应：自动重试 2 次仍空抛错（E1——`MAX_EMPTY_RETRIES = 2`，空响应注入 `[System reminder: your last response was empty…]`；VSC 原直接 throw——移 CLI 语义）。
7. **回声安全（D-CC18）**：压缩注入不产出「无 `reasoning_content` 的 assistant 紧邻 assistant」形态——DeepSeek 系（`reasoningEcho:"required"`）对压缩后首发请求 400 的成因形态（子代理触发压缩后必死——轨迹实证）；占位并入时尾首的 `tool_calls` / `reasoning_content` / 其余字段原样保留。

8. **恢复面回声归并（D-CC19）**：已落盘会话的机读线（落盘 `contextHistory`）在**恢复路径读取时**扫描归并——凡「无 `reasoning_content` 的 assistant 紧邻下一条 assistant」形态（D-CC18 的成因形态），把**前条文本并入后条**（同 D-CC18 方向：占位/无推理者被吸收，后条 `tool_calls` / `reasoning_content` / 其余字段原样保留；文本以空行相接），前条移除；**迭代至不动点**（链式形态一次跑完）。
   归并 = **核内单一纯函数**（`thincoder-core/` 导出）；各端**独立接线**（多实现面纪律——语义同源、断言各自驻留）——调用点：CLI `thincoder-core/session.mjs` `applySession` `:293/:296`（`machine` 定线后、`agent.history = [...machine]` 前）·
   VSC `thincoder-vscode/src/extension/panel-session.mjs` `activeLines` `:54-55`（`contextHistory` 定线后、`:56` 返回前——VSC **不经核 `applySession`**，槽直读组装，`panel-chat.mjs:255-257` 消费）。恢复后首请求不再携带病态形态（不推用户、不改会话档）。
   边界：前条带 `tool_calls` 的变体（孤儿 `tool_result` 面）**不并**——配对安全优先（登记上抛，批次档 §2 F-3）；干净输入返回**同一数组引用**（零拷贝 / 零回归）。
   判据锚：`applySession` 线 `thincoder-core/test/compaction-echo.test.mjs`（形态计数 0 + 文本 / `tool_calls` 守恒）；VSC 面 `thincoder-vscode/test/**` 同形名用例（各面自持）。

9. **活体推入面回声恒带（D-CC22）**：`reasoningEcho:"required"` 族（`thincoder-core/model-specs.mjs:33/35/38/40/42` deepseek · `:44/46/48` kimi · `:75/76` mimo）的**工具轮** assistant 消息经核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`）推入 ⇒ **恒带** `reasoning_content`；本轮无推理 ⇒ **空串**（不省略字段——「必须回传」按字段在场判定）。真机三连（2026-09-20 · `deepseek-flash` · 带 `tools` · 同形历史）：空串 **200**（服务端仍回 `reasoning` 63 字符）/ 缺字段 **200**（`reasoning` 帧 **0**）/ 真值 **200**（104 字符）⇒ 空串合法；缺字段轮不再回推理，与 `advisor/loop.mjs:199-204` 自述同向（n=1 采样——症状面证据）。调用点（**三站点共享同一构造单点**，非各自内联）：主循环 `thincoder-core/agent.mjs:366-376` · advisor 循环 `thincoder-core/advisor/loop.mjs:205-215` · VSC 端壳自有循环 `thincoder-vscode/src/agent.mjs:387-397`（端取值 = `thincoder-vscode/src/specs.mjs` 的 `specForModel`，构造单点经该档转口复用；静态引合法（W8 契约②）= 结论——**闭包读数单源 = 批次档 `docs/batches/2026-09-20-reasoning-echo-gap.md` §2.9 ①**）。glm 族 / 未声明（`optional`）⇒ 恒不带（行为零改）。

### 6.11 已知 parity 说明

- **CLI `splitHistory` 无「reverse 保护」**（VSC 旧镜像 `thincoder-vscode/src/compact.mjs` **已删**——W6 迁核后本差异退场；旧 VSC 侧判据 `callsGapAfter` / `reverseProtectTail` 随删档退场）：CLI 不需要——`repairHistory` 在 run 起点已保证 tool_calls→tool 顺序、run 中 append 保序，倒序无法产生； （迁移期引文）
  边界微差（`i > headEnd` vs `i >= headEnd` 等）为 off-by-one 粒度差、不改语义。若将来两端 history 来源出现倒序，应回植该保护（W6 后回植点 = 核内笔——超本批写域）。
- **提示词单源（W6 / W15 迁核后收正 · 2026-09-18 · 评审 #6）**：`SUMMARIZE_PROMPT`（`thincoder-core/context.mjs:61`——本批 `:15` 新增 import 行的 +1 位移已收正 · 2026-09-18 实施后修正轮）
  与 `EXPLORE_SUMMARY_PROMPT`（`thincoder-core/explore-distill.mjs:23`）现体均为**核单源**。
  两端副本随旧档退场（VSC 旧档 `compact.mjs` 已删——W6 迁核；`explore-distill.mjs` 现为**调用期适配器**——只 import 核面）——旧「两端措辞微差 / byte-identical」口径随之退役（比对对象已不存在，一致性由单源承接）。

### 6.12 实现位置（两端当前落点——代码为准）

| 机制 | CLI | VS Code |
|---|---|---|
| 压缩 / 预算 / tail / 截断 / 摘要主体（`applyCompression` / `splitHistory` / `compressIfNeeded` / `compressFallback` / `shrinkOversized` / `summarizeRunExplorations` / `tightenTailByBudget` / `repairedTailStart` / `tailBudgetTokens`） | `thincoder-core/context.mjs` | `thincoder-vscode/src/compact.mjs` **已删**（W6 迁核——旧 `compactHistory` / `estimateTokens` / `tailStartByBudget` 退场）；端侧判定点封装 = `thincoder-vscode/src/agent/run-stages.mjs` （迁移期引文） |
| 常量（`IMAGE_TOKEN_ESTIMATE` / `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE = 1000` / `TAIL_FLOOR_MESSAGES`） | `thincoder-core/context.mjs` | 旧档 `thincoder-vscode/src/compact.mjs`（`SUMMARY_SEGMENT_ESTIMATE = 1100`）**已删**——W6 端差退场、单源 = 核列常量 （迁移期引文） |
| run 钩子（`_compressFailures` 重置 / `_runStartHistoryLen` / onCompress* 接线） | `thincoder-core/agent.mjs` + `thincoder-cli/src/tui/agent-turn.mjs` | W6 后：`thincoder-vscode/src/agent/run-stages.mjs`（判定点转发）+ `thincoder-vscode/src/agent.mjs`（安全点调用） |
| 压缩面板渲染 | `thincoder-cli/src/tui/tool-events.mjs` + `thincoder-cli/src/tui/subagent-blocks.mjs` | webview 会话状态渲染 |
| SUMMARIZE_PROMPT / EXPLORE_SUMMARY_PROMPT | `thincoder-core/context.mjs`（export） | 旧档 `thincoder-vscode/src/compact.mjs`（export：`SUMMARIZE_PROMPT` = `:115`）**已删**——现体 = 核 export（单源）；`thincoder-vscode/src/explore-distill.mjs` 现为**调用期适配器**（W15 已落——只 import 核面） （迁移期引文） |

### 6.13 VS Code 端接线面（VSC 轮并入 · 2026-09-15；**W6 迁核后收正**）

> **来源** = `thincoder-vscode/docs/design/CONTEXT-COMPACTION.md`（**迁移期参照历史**）。本节 = 该档中「根层所缺」的 **VSC 专有接线细节**（(a) 机制 / (b) 坐标）。与 CLI 同源语义（触发 / 阈值 / 切割 / 预算 / 降级 / 回注 / 摘要 ≤1K）已入 §6.1–§6.10，不重复（D2）。
> **W6 迁核事实**（2026-09-15 · S2 单元 W6）：VSC 旧镜像档 `thincoder-vscode/src/compact.mjs`（388 行）**已删**；压缩面现体 = 核单源（`@thincoder/core/context.mjs`）；下列逐条按迁核后现状收正（机制条文零改——07:08 裁定）。 （迁移期引文）

- **判定点封装（端侧接线 · §2.13.4 #56 类）**：`checkAndCompact(agent, ctx)` 住 `thincoder-vscode/src/agent/run-stages.mjs`——循环骨架只留检查调用（`thincoder-vscode/src/agent.mjs` 主循环 LLM 调用前；
  安全点判定 = `history.at(-1)?.role` 为 `user` / `tool`）。封装体内驱动核 `compressIfNeeded` / `compressFallback`（触发 / 摘要 / 降级截断 / 尾部预算 / task+plan 回注 / 重建边界 / 基线失效全归核）。与 CLI 语义一致（D1）。
- **阈值档位（核面）**：`resolveCompactThreshold(cfgCompactThreshold, provider)`（核 `config.mjs`——显式优先 / auto = providerSpec 窗口 × 0.6）——阈值随回合模型（档位跟随窗口，PROVIDER §15 T-C2）。旧 VSC 侧内联 `THRESHOLD_FRACTION` 实现随删档退场。
- **端差适配（调用期——W11/W15 前载体形态）**：核压缩面读 CLI 载体字段名 `provider` / `tasks` / `planMode`——本端 agent 载体为 provider 入参（`ctx.provider`）/ `_tasks` / `_planMode` ⇒ `checkAndCompact` 调用期同指三键（核只读此三键）；核以新数组替换 `agent.history`（applyCompression / shrinkOversized 均 copy-on-write）⇒ 端侧回收共享数组（面板持有同一引用；数组自定义属性随原位回收保留）。
- **预算端差——W6 退场**：旧 VSC `SUMMARY_SEGMENT_ESTIMATE = 1100`（与 CLI 1000 的语义等价差）**随迁核退场**——现体单源 = 核 `SUMMARY_TOKEN_ESTIMATE = 1000`（§6.4④ 两端差注随之收正）；`IMAGE_TOKEN_ESTIMATE = 2000`/part 两端同值不变。
- **REVERSE 配对保护——W6 退场（回植候选登记）**：旧 VSC 特有判据（`callsGapAfter` / `reverseProtectTail`——tail 以悬空 assistant 开头的倒序形状处理）**随删档退场**；现体核面无本判据（§6.11 口径：CLI 不需要——`repairHistory` 在 run 起点保证顺序）。VSC 侧倒序来源若仍可达 ⇒ **回植候选 = 核内笔**（超本批写域；交付面登记见批次档 §5）。
- **webview 压缩状态四态（现状登记 · 不变）**：`thincoder-vscode/src/extension/panel-callbacks.mjs` → postMessage `compress` 消息：
  `start` → 状态行 `Compressing context… (summarizing N messages)`；`done` → `Compressed: N tokens freed (Xs)`；
  `fallback` → `Compression failed — fallback: truncated to N messages`；`failed` → `Compression failed: <error>`。
  `webview/chat.js showCompressStatus` 原地更新 `#compress-status`；摘要正文永不进前端（D11 静默纪律）。
  回调链（onCompressStart / onCompress / onCompressFail）由端侧判定点转发——语义同 §6.8（D-C3）。
- **摘要段形状（迁核后）**：压缩 note + 摘要 + assistant 占位（tail 首条为 assistant 时占位并入该条——§6.10 #7）——VSC 旧档的 `<handoff_notes>` 标签形态随迁核退场，现体 = 核段落形状（§6.7 文案族；两端非 byte-identical 注见 §6.11）。
- **失败可见化（Q3）**：`run-stages.mjs` catch → console.error + `onCompressFail` → webview 渲染错误文本；`_compressFailures` 连续 3 次（核 `COMPRESS_FAILURE_LIMIT`）后 `compressFallback` 确定性截断；无 middle 可切 → `shrinkOversized` 单消息截断（核内承载——边界重置 2（并入分支 1）/ 基线失效由核 applyCompression / shrinkOversized 自理）。
- **非压缩职责边界（原 `context.mjs`——GIT-ASYNC L21 整文件删除；不变）**：repo outline → `repomap.mjs`（repoOutlineTool——按需工具，非回合自动注入）；git 富注入 → `agent/setup-reminders.mjs`（`collectGitContext` = `:145` / `pushGitContext` = `:163`；async）；editor / 机器注入 → `extension/editor-context.mjs` + `pushInjections`（`:194`）。

### 6.14 压缩调用形态 · 会话续写（前缀复用）（2026-09-18 压缩续写批 · 台账 #39）

**修前实况（坐标 · as-of 设计轮——该形态已随本批实施退役，坐标为修前位）**：压缩请求 = 单独一条 `user` 消息（`thincoder-core/context.mjs:410-421`——`messages: [{ role: "user", content: SUMMARIZE_PROMPT + serialized }]`，无 `system`、无 `tools`）；
正文 = 中段**序列化文本**（`thincoder-core/context.mjs:387-400`——逐条 `[role][ called tools: …] 正文`，user 截 8000 / 其余 2000 字符）。
回合请求形态 = `[{ role: "system", content: systemPrompt }, ...agent.history]` + `tools: toolSchemas`（`thincoder-core/agent.mjs:230` · `:240-241`）⇒ 两者**共享前缀 = 0**。

**轨迹读数（修前基线）**——轨迹档 `~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl` 的 `"stage":"compress"` 行（会话 2026-09-17T10:38:01.419Z · deepseek-flash · depth 0）：

| 压缩调用 prompt / cached | 同会话回合调用 prompt / cached |
|---|---|
| 125671 / 256 · 94696 / 256 · 108590 / 256 · 107799 / 256 | 592628 / 591104（99.7%） |

**机制对照（同请求体重发）**：同一压缩请求体（逐字节相同）在两次调用间命中 **131328 / 134061 = 98.0%** ⇒ 前缀命中机制本身可用，修前形态**从不复用前缀**。
**口径注（评审 #7）**：档内「53354 字符」的**计量对象未记**（是否 messages-only / 是否含 JSON 转义 / 是否同一会话）——与 token 读数不可直接换算（≈2.5 token/字符，BPE 口径不可达）⇒ 疑非同口径或转录误差。
该换算**未实证**（轨迹档不在仓内）；结论不依赖它——探针表自成一致，修前 0.2% 命中率另由上方轨迹表直接给出。

**探针实证（设计期实测 · deepseek-flash）**：

| 请求 | prompt | cached |
|---|---|---|
| R1 `[system, user]` + tools | 747 | 0 |
| R2 `[system, user]`（不带 tools） | 493 | 256 |
| R3 同 R1（重发） | 747 | 512 |
| R4 同 R2（重发） | 493 | 256 |

结论 ①（**作废 · 2026-09-18 实施轮受控实测推翻**）：设计期读数「R2 / R4（不带 tools）命中了 R1（带 tools）所建前缀」在生产尺度**不成立**——该 256 命中 = 493 / 747 token 小样本的整块 floor 巧合（见下方「命中面按 `tools` 声明分区」）。
结论 ②：命中按 256 token 整块计（floor）；tools 段本身计不计入命中**未判定**（该规则下不可区分）——此项不受推翻影响。

**命中面按 `tools` 声明分区（实施轮受控实测 · 2026-09-18）**：

受控单变量真机序列（deepseek-flash · nonce 全新前缀 · 单进程 · 同模式同前缀；探针档用后已删 · 原始日志留档）——完整读数与归因见批次档 §5：

| 步 | 请求形态 | prompt / cached |
|---|---|---|
| W1 | 回合形态（system + 全量 194 条 + **tools**） | 12941 / 0 |
| W2 | W1 重发 | 12941 / 12800 = 98.9%（前提「回合调用 ≥0.9」成立） |
| W3 | v1 压缩形态（system + 中段 117 条 + 指令 · **无 tools**） | 6092 / **0 = 0%** |
| X3 | v1 压缩形态 **+ tools** | 8345 / 7808 = **93.6%** |
| X4 | 与 X3 逐字同请求 **去 tools** | 6090 / **0 = 0%** |

**结论**：命中面**按 `tools` 声明分区**——同模式同前缀下，携带 tools 的压缩请求命中了回合请求所建前缀（93.6%），不携带者命中 **0%**（与修前基线 256 / 108590 = 0.2% 相当）⇒ **v1 形态（不带 tools）实测收益 ≈ 0**；v1 的 `tools = 不带` 决定随之作废（下节收正）。

**v2 修法——声明面对齐（`tools` + `tool_choice: "none"` · 设计定稿 · 待实施轮）**：

- **形态**：压缩请求随带**与回合请求同一**的 tools 声明（`extras.tools` 原样）——两消费点均以 `tools` 键透传 `toolSchemas`（CLI `thincoder-core/agent.mjs:184-190`、VSC `thincoder-vscode/src/agent/run-stages.mjs:195-197`），与回合调用同数组（`thincoder-core/agent.mjs:241` / `thincoder-vscode/src/agent.mjs:262`）⇒ 声明面无第二构造点、无字节漂移。
- **抑制 tool 调用**：同调用随带 `toolChoice: "none"`——**仅在有 tools 声明时发**（无声明面时该参数在部分服务端作 400）。
- **可行性核（仓内可核 · 零 provider 层改动）**：`toolChoice` 能力层四 transport 全支持——OpenAI 通路 `thincoder-core/provider/core.mjs:214`（`body.tool_choice`）·
  Anthropic `thincoder-core/provider/anthropic.mjs:62`（`{type:"none"}`——`:20`）· Gemini `thincoder-core/provider/google.mjs:101-102`（`{mode:"NONE"}`——`:16`）·
  Responses `thincoder-core/provider/responses.mjs:221`。
- **tool_call 泄漏后处理**：摘要面只取 `summary.content`——`tool_calls` **零落点**（不执行 / 不入 `history` / 不进注记）；`content` 空或空白 ⇒ 既有空白摘要守卫（`thincoder-core/context.mjs:414`）抛错进失败链。⇒ 抑制失败 = 可恢复的单次失败（3 连败照常走确定性降级），非状态污染。
- **观测出口**：真机读数增一格「压缩轨迹行的响应 tool_calls 计数」（批次档 §2.10）。
- **退化面**：`extras.tools` 缺省（直调者——如 `thincoder-cli/scripts/verify-compress.mjs`）⇒ 不发 `tools`、不发 `tool_choice`——形态退回 v1，正确性不变、仅无命中折扣（同退化面 1）。
- **成本面**：请求体多出 tools 声明（上表 X3 − W3 ≈ 2.2K token）；命中时按缓存价、未命中时全价 ⇒ 无前缀缓存场景成本略升，由命中收益主导（本批目标场景）。
- **落地面（待实施轮）**：`thincoder-core/context.mjs:399-410` 压缩调用增 `tools: extras?.tools` + `toolChoice: extras?.tools?.length ? "none" : undefined`（净 +2 行）；既有注释 `:388-390` 与本档同步收正；行数预算 ≤495（现况 492）不变。

**否决备选（v2 · 逐条）**：

| # | 备选 | 否决理由 |
|---|---|---|
| ① | 维持不带 tools（= v1 现态） | 实测命中 0% ⇒ 本批目标（省 token 最大单点）零收益 |
| ② | 带 tools 但**不**抑制 tool_call | **备选保留**（仅当探针 S3 不达标而 S4 达标时启用——抑制参数若自身破坏命中）：泄漏由 content-only + 空白守卫兜底；残留 = 「content 非空 + tool_call 同出」的偏形摘要（观测出口同上） |
| ③ | 用提示词 / system 指令抑制 tool 调用 | 不可离线机判 / 对命中无益 / 与提示词内容权（= 主 agent）冲突 |
| ④ | 压缩改走另一模型或另一 endpoint（绕开声明面差异） | 命中是**同会话前缀**的性质——换模型 ⇒ 前缀整体不复用，本批前提消失 |
| ⑤ | 让回合请求不带 tools 以对齐 v1 | 回合需要工具面（功能面）——本末倒置 |

**受控探针复测方案（判定句 = `cached / prompt ≥ 0.9` · 与需求档 §2.1 同源）**：

夹具 = 同会话 + nonce 全新前缀 + 单进程 + 单一模式（复现上表方法——单变量、同前缀）：

| 步 | 请求 | 判定 |
|---|---|---|
| S1 | 回合形态（system + 全量 + tools） | 建前缀；承接 S2 |
| S2 | S1 重发 | ≥0.9（**前置闸**：证明该会话命中面可用） |
| S3 | 压缩形态 **+ tools + `tool_choice:"none"`** | **判定格**：≥0.9 ⇒ 采纳 v2 全形态 |
| S4 | 压缩形态 **+ tools**（不带 tool_choice） | ≥0.9 ⇒ 备选② 可用；与 S3 同低 ⇒ v2 不成立 |
| S5 | 压缩形态（不带 tools——v1 现态） | 对照格：预期 0%（非判定格） |
| S6 | 回合形态（生产模式 · 随带 thinking 配置）→ 压缩形态 + tools + `tool_choice:"none"`（`thinking:null`——D9） | 方法面口径格（**未测维度**）：达标 ⇒ 无需改；不达标 ⇒ 上抛父侧（是否随带回合 thinking / reasoningEffort——涉成本面，须裁定） |

**判定规则（预注册）**：S3 ≥0.9 ⇒ 采纳 v2 全形态；S3 <0.9 且 S4 ≥0.9 ⇒ 采纳 v2 **减** `tool_choice`（备选②）；S4 <0.9 ⇒ **v2 不成立 ⇒ 回退 (b)：明确接受零收益 + 需求档 §2.1「不带 tools」与判定句改字（父侧笔——本设计只登记，见批次档 §2.10）**。
**（2026-09-18 实施轮实测执行）**：**S3 = 6/6 格首现 0%**（含 token 证据：带该参数时 prompt 与「无 tools」形态同值 ⇒ 服务端**丢弃 tools 区**）· **S4 = params 同值 8 格 84–98%** ⇒ 按本规则**采纳备选②**；另单变量归因出 `reasoning_effort` 异值（压缩侧 null vs 回合侧 `"max"`）⇒ 生产口径仍 0%（上抛父侧裁定——同值则 **95.69%**；见批次档 §5/§2.10）。
**（父侧 2026-09-18 裁定——用户「好」）**：**随带同值**（采纳）——压缩调用取与回合请求**同源**的 `reasoningEffort`（不得硬编码；无配置时保持缺省）；判据 = 真机生产口径 `cached / prompt ≥ 0.9`（改前 0% → 预期 95.69%）；成本记录 = 单次压缩 completion ≈ 8,147 tokens / ≈31.9 s（低频操作，净收益仍为正）。
取证路径 = `~/.thincoder/traces/<date>/*.jsonl` 中 `"stage":"compress"` 行的 usage；探针日志留档（先例 = 本批实施轮 `_b39_probe6.log`）。

**取证项——provider 接受度（评审 #2 补 · 实施轮必得读数）**：新形态首次让中段「真身」消息进请求体（含 `role:"tool"` 与 assistant `tool_calls`），而请求**不带 tools 声明**（`thincoder-core/provider/core.mjs:211`——`tools?.length` 为空则不发 `body.tools`）。

- **覆盖缺口**：探针 R1–R4 只覆盖 `[system, user]` 形态 ⇒ 该格无覆盖（本行为补项）。
- **离线取证** = 用例 8（fetch 桩断言 `body.tools` 缺省 + 中段 tool 配对完整——批次档 §2.5）。
- **真机取证**（人工核验 · **非 CI 门禁**）：**首轮真机压缩成功**（非 400 · 摘要非空落盘）+ 该请求体真机重发被接受。
- **未兜住面（明示）**：若服务端拒收（400）⇒ 只落 3 连败降级（§6.5），信息损失面——故列为实施轮必得读数而非门禁。
- **v2 收正（2026-09-18 实施后修正轮）**：v2 下请求携带与回合同声明的 tools ⇒「带 tool 中段 + 带 tools 声明」= 与回合请求同构（回合请求本就如此），该格不再是新形态；「不带 tools 声明」退为**无 tools 直调者的退化格**（退化面 1）。离线面断言（用例 8 / AC7）随 v2 修订——见批次档 §2.10。

**修后形态（消息序 + 前缀构成）**：

```
messages = [ { role: "system", content: extras.systemPrompt },  // 与回合请求同字节
             ...history.slice(0, tailStart),                    // 中段「真身」消息（原样引用——不拷贝 / 不截断）
             { role: "user", content: SUMMARIZE_PROMPT } ]      // 尾部指令（唯一新增面）
tools    = extras.tools（与回合请求同一声明面；**不随 tool_choice**——实测该参数致服务端丢弃 tools 区）   // v2 收正 · 已实施 2026-09-18
                                                            // （v1 曾定「不带」——实施轮实测推翻；v2 全形态（含 tool_choice:"none"）经 S3 实测否决 ⇒ 备选②，见上方分区）
```

- **状态**：消息序 v1 **已落**（`thincoder-core/compress-form.mjs` + `context.mjs` 接线）；`tools` 行 = **v2 已实施**（2026-09-18 · `context.mjs` 落盘 494 → v3 后 **495**）——**落备选②**（带 tools、**不随 `tool_choice`**：该参数实测致服务端丢弃 tools 区 ⇒ 按预注册判定规则采纳备选②）；`reasoningEffort` 行 = **v3 已实施**（2026-09-18——**同源随带**：移除 `reasoningEffort: null` 覆盖 ⇒ 与回合同一字段；不硬编码 · 无配置 ⇒ 缺省）——**真机生产口径首现命中 92.86% / 93.65%**（两次独立运行，对照改前 0%）；派生差两则（百炼 qwen 族 / autoThink 窗口）⇒ 台账 **#56** 登记。
- **前缀构成**（= 可复用面）= `tools` 声明 + `system` + 中段（v2；v1 = `system` + 中段——实测该面未被命中）；**新增未命中面** = 尾部指令一条（+ ≤255 的块对齐残余）。中段 = `splitHistory` 的 `[headEnd, tailStart)`（KEEP_HEAD = 0 ⇒ head 空；§6.4② / ④）。
- **摘要输入域（选中面）不变 / 表示面改变**（评审 #3 收正）：修前同样只喂中段（尾部不进摘要输入）⇒ **选中范围不变**；中段的**表示面**改变（序列化文本 → 真身消息 · 不截断）——信息量差异见下方质量风险表（旧「模型所见内容面无变化」句作废）。
- **前缀对齐前提**：切点须是配对安全边界（`repairedTailStart` 保证中段自足）——否则发送期配对归一（`thincoder-core/provider/normalize.mjs`）会在压缩请求合成 `[Tool result missing: …]` 占位而回合请求不会，前缀自此分叉。
- **单一真值**：请求前缀切点与摘要段切点同源（同一个 `tailStart`），不新增第二处切割判据。
- **落地形态（模块拆分 · 行数预算 · 评审 #1——已落）**：纯函数 `buildCompressMessages` 落核档 `thincoder-core/compress-form.mjs`（落盘 **21 行**（`wc -l`）——零 import 依赖：指令文本由实参传入，不与 `context.mjs` 成环）。
  行数沿革（2026-09-18 · 蒸馏前缀批评审轮 1 · 评审 #1 收正）：实施轮 as-of 值 20 行 ⇒ v2 收正扩写头注 +1 行 = **21 行**（`wc -l` 实测）——全档唯一权威读数，§6.15 不再复制。
  `thincoder-core/context.mjs` 只留接线（import `:15` + 调用 `:400` + 空白摘要守卫 `:414`）并**减去** `serialized` 序列化段（修前 `:388-400`，13 行）——**行数口径 = `wc -l`**（= 机检 `thincoder-core/test/core-hygiene.test.mjs:99` 的判定口径·>500 硬红）。
  设计期现况 499 行（read 口径 500）⇒ 预测落盘 ≈ 489；**实施轮实测落盘 492 行**（预算上限 495 · 硬限 500——余 8 行；差 = +3 形态/守卫注释）；新测试档 `thincoder-core/test/compress-form.test.mjs` 落盘 **213 行**（≤300 软线 ⇒ 免登记；原估 +105——2026-09-18 实施后修正轮按实测收正）；先例 = 同档 `thincoder-core/context.mjs:495-497`（524 > 500 ⇒ 拆分 `explore-distill.mjs`）。

**摘要质量风险评估（模型所见上下文差异）**：

| 面 | 修前 | 修后 | 评估 |
|---|---|---|---|
| 中段形态 | 序列化纯文本（角色行 + 工具名单 + 逐条截断） | 真身消息（role 结构 / `tool_calls` 配对 / `reasoning_content` / 多模态 part） | 信息量↑——保真度预期↑，无丢信息风险 |
| 逐条截断 | user 8000 / 其余 2000 字符 | 不截断 | 「长结论被截而摘要漏」的形态退场 |
| 尾部 | 不进（与修后同） | 不进 | 无变化；当前任务锚点仍由保留尾部承担 |
| 指令位置 | 前置于正文（"the following work log"） | 后置于正文 | 指令文本须随之改写（**内容权 = 主 agent**）；改写不到位 ⇒ 输出面偏移（续写对话而非给摘要） |
| 输出面 | 无 tools ⇒ 必为文本 | v2：带 tools 声明 + `tool_choice:"none"`（主抑制） | 残余（服务端忽略该参数）= content-only + 空白守卫兜底——非状态污染（备选② / 观测出口见上方 v2 节） |

**退化面**：

1. **无前缀可复用**（`extras.systemPrompt` 缺省——如 `thincoder-cli/scripts/verify-compress.mjs` 直调；或 provider 无前缀缓存）⇒ 请求仍按同一形态发出，**正确性不变**，仅无命中折扣（v2 下请求体多出 tools 声明——无命中时按全价，成本略升，见上方 v2 成本面）。
   **否决「按 `cacheMode` 分派回旧序列化形态」**（评审 #5 收正引证）：双形态 = 双语义 / 双维护面；且 `cacheMode` 是**静态模型能力标注**（`thincoder-core/model-specs.mjs:20`——核内除定义与测试断言外零消费），而「前缀可否复用」是**调用期事实**（取决于 `systemPrompt` 是否给定与服务端行为）⇒ 分派判据错位。
2. **摘要失败 / 中止**：降级链不动（§6.5——连续 3 次失败 → `compressFallback`；AbortError 透传）。
3. **空白摘要守卫（新增 · 最小）**：`summary.content` 去空白后为空 ⇒ 抛错进失败计数链、**不改 `history`**。理由：新形态下模型处于「对话续写」框架，输出面偏离不再由「无 tools」兜底；空白摘要若落到 `applyCompression`，形态 = 「中段已丢 + note 为空」且计为成功。
4. **轨迹体积副作用（登记 · 接受 · 评审 #8）**：轨迹纪律 = **完整落盘**（不截断 / 不丢行——`thincoder-core/traces/trace-store.mjs:22-24`；写入面 `:240` 落出站 `messages` 全量）。
   本形态把中段真身（含每轮 `reasoning_content` 与多模态 base64 part）写进 `stage:"compress"` 行 ⇒ 单行体积升至中段全量——增量 = 每次压缩多一份中段副本（同批消息在同会话回合行亦全量落盘，量级同单回合行）。
   清理面不变（按 mtime 保留期 prune——`thincoder-core/traces/trace-store.mjs:284`）：**接受，不新增机制**（traces 默认 OFF · 诊断面）。
5. **非空白但非摘要的输出（残余 · 登记 + 观测口径 · 评审 #9）**：「对话续写」框架下模型可能输出非摘要文本——请求面无判据，会作为 `note` 进 `applyCompression`（`thincoder-core/context.mjs:423`）并计为成功。
   **接受该残余**（无可离线机判的形态）；观测出口 = 实施轮真机读数增一项**摘要形状抽查**（要点式 / 含 FILES CHANGED · UNRESOLVED 清单）——不达标 ⇒ 上抛，不静默通过。

**与「压缩生存」诸机制的交互（逐条 · 均不动）**：触发面（安全点 + 阈值 0.6，§6.2）· 切割面（`tailStart` / 尾部预算 / 保底 10，§6.4）· 回注面（task / plan / AUTO，§6.6 D7）
与情境行重推（`MANIFEST.md` §2.6）——均作用于压缩**之后**的 history 重建 · 边界与基线（`_runStartHistoryLen` 重置 D-CC17 / `_lastPromptTokens` 失效）·
回调面（`onCompressStart({ messages: middle.length })` 语义不变：仍是「被摘要的中段条数」）· 双线（压缩仍只动机读线，§6.6 D10）。

**用例表与验收判据**：见批次档 §2（本批任务书——用例 1–8 · AC1–AC7，回指台账 #39；provider 接受度取证见上方取证项）；**v2（声明面对齐）的 AC / 用例增量见批次档 §2.10**。

**`SUMMARIZE_PROMPT` 定稿（主 agent 内容权 · 2026-09-18 02:10——已完成 · 评审 #4 收正）**：首句 → `The conversation above is our work log so far — summarize it into a compact summary for use as context in the ongoing conversation.`；删 `Work log:` 标签行与其后空行（正文现位于指令**之前**）。
其余 **9 条要求**与末段砍价优先级一字不动（计数口径收正 · 2026-09-18 实施后修正轮：现档 = 9 条 bullet + 末段砍价优先级——`thincoder-core/context.mjs:63-71`；旧「10 条」为误计）。原文与最小 diff → 批次档 §2.7-1。
**读法裁定（整句替换 · 父侧 2026-09-18 实施后确认）**：`You are a conversation compressor.` 角色句**退役**（不保留）——现档 `thincoder-core/context.mjs:61` = 定稿句逐字符相同（实施轮「判断存疑 1」随之定论）。
原「定稿前不得落地」句随定稿完成退役——**落地解锁**（实施轮已落）。

### 6.15 蒸馏调用形态 · 会话续写（前缀复用）（2026-09-18 蒸馏前缀批 · 台账 #47）

**修前实况（坐标 · as-of 设计轮）**：蒸馏调用 = 单独一条 `user` 消息，**无 `system`、无 `tools`、无 history 前缀**：

- 调用点 `thincoder-core/explore-distill.mjs:104-105`：`chat({ ...provider, thinking: null, reasoningEffort: null }, { messages: [{ role: "user", content: EXPLORE_SUMMARY_PROMPT + serialized }] })`。
- 正文 = 探索块**序列化文本**（`serializeExplorationMessages` `:72-84`——逐条 `cap = 8000` 字符，`:74`）。
- 回合请求形态 = `[{ role: "system", content: systemPrompt }, ...agent.history]` + `tools: toolSchemas`（`thincoder-core/agent.mjs:230` · `:241`）⇒ 共享前缀 = **0**（与 §6.14 修前实况同款）。

**轨迹读数（修前基线 · 本设计轮自采）**——轨迹档 `~/.thincoder/traces/2026-09-18/*.jsonl` 的 `"stage":"distill"` 行（UTC `2026-09-17T16:13Z–20:49Z` = 本地 09-18 00:13–04:49 · deepseek-flash · 18 次）：

| 读数 | 值 |
|---|---|
| `cached / prompt` | **0 / 18 = 0%**（18 次全 0——与「单条 user + 无前缀」形态一致） |
| prompt 区间 | **1,478 – 11,694**（中位 ≈4.6K——全价 miss） |
| 抽样 | 10469/0 · 9030/0 · 7692/0 · 6890/0 · 4932/0 · 1478/0 |

**量级收正**：台账 #47 / 批件记「~10–17K prompt / 次」；本设计轮实测 = **1.5–11.7K / 次**（频度 ≈18 次 / 半日会话——同族第二消费点，量级小于压缩面）。

**修法（与压缩线逐件同构——先例即设计）**：

```
messages = [ { role: "system", content: extras.systemPrompt },   // 与回合请求同字节
             ...history.slice(0, lastBlockEnd),                  // 中段真身消息（原样引用——不拷贝 / 不截断）
             { role: "user", content: EXPLORE_SUMMARY_PROMPT } ] // 尾部指令（唯一新增面）
tools    = extras.tools          // 与回合请求同一声明面；**不随** tool_choice（§6.14 分区实测：该参数致服务端丢弃 tools 区）
provider = { ...agent.provider, thinking: null }   // **不覆盖** reasoningEffort ⇒ 与回合侧同源（v3 形态）· thinking:null 保留（D9/D11 静默）
```

| 件 | 压缩线（§6.14 · 已实施） | 蒸馏线（本 §） |
|---|---|---|
| 消息序 | `[system, ...history.slice(0, tailStart), 指令]` | `[system, ...history.slice(0, lastBlockEnd), 指令]` |
| 声明面 | `tools: extras.tools`（**不随** `tool_choice`） | 同 |
| 调用参数 | `thinking: null` + **不覆盖** `reasoningEffort`（v3） | 同 |

- **前缀（可复用面）** = `tools` 声明 + `system` + `history[0, lastBlockEnd)`——皆回合请求已建缓存面（探索结果在 run 内已随回合请求送服务端 ⇒ 该段在缓存内）；**未命中面** = 尾部指令一条（+ ≤255 块对齐残余）。
- **切点 `lastBlockEnd`** = 本 run 最后一个探索块的 `end`（`findExplorationBlocks` 的 `blocks.at(-1).end`）——与替换面**同一 blocks 数组**（note 插入点 = `blocks[0].start`、丢弃集 = 各块区间）⇒ **不新增第二处切割判据**。
- **选中面 / 表示面**（对照 §6.14 同款口径）：修前 = 探索块**序列化文本**（逐条截 8000）；修后 = `[0, lastBlockEnd)` 段**真身消息**（不截断）⇒ **表示面改变**（保真度↑）+ **选中范围扩大**（含非探索消息——见质量风险表）。
- **序列化面退役**：`serializeExplorationMessages`（`:72-84`）与 `safeSliceUTF16` 引用（`:13`）随批删除（服务端已见真身 ⇒ 重复表示无益；同 §6.14「序列化面退场」）；`thincoder-core/text-budget.mjs` 仍有 memory 族消费方（`thincoder-core/memory/core.mjs:15`）——**非末位消费**。
- **形态构造面单源**：复用 `thincoder-core/compress-form.mjs` 的 `buildCompressMessages(history, cut, systemPrompt, instruction)`（`:15-21`）——压缩为形态首个消费点、蒸馏为第二消费点；**不设第二构造点**（D2：同一形态单源，避免两处字节漂移）；该模块头注随批收正（语义 = 会话续写形态构造器）。
- **替换面不变**（§6.9 H1 不动）：note 仍插在首块位置、探索块整体丢弃、非块消息保留、`_fullHistory` 不触；失败静默（`chat` 抛错 / `content` 空 ⇒ `if (!summary)` 返回 null ⇒ 原历史保留——**无替换 = 无信息损失**，N3）。
- **提示词文本不动**（内容权 = 主 agent）：`EXPLORE_SUMMARY_PROMPT` 本批禁触；其尾行 `Exploration log:` 在真身形态下**指向空**——风险与上抛见下。

**质量风险评估（模型所见上下文差异）**：

| 面 | 修前 | 修后 | 评估 |
|---|---|---|---|
| 中段形态 | 序列化纯文本（角色行 + 工具名单 + 逐条截断） | 真身消息（role 结构 / `tool_calls` 配对 / 多模态 part） | 信息量↑——保真度预期↑（与 §6.14 同向） |
| 逐条截断 | 8000 字符 cap | 不截断 | 「长结论被截而摘要漏」形态退场 |
| 选中范围 | 仅探索块 | `[0, lastBlockEnd)`（含前置上下文与非块消息） | **扩大**——摘要可能覆盖非块内容：块外内容仍留在历史 ⇒ **重复而非丢失**（登记，非缺陷） |
| 指令位置 | 前置于序列化正文（"the following…"） | 后置于真身正文 | 尾行 `Exploration log:` 指空 ⇒ **文本与位置不匹配**（上抛项，见下） |
| 输出面 | 无 tools ⇒ 必为文本 | 带 tools 声明（无 `tool_choice`） | 残余（模型选择调工具）= `content` 空 ⇒ 既有 `if (!summary)` 静默跳过（无替换、无损失）——非状态污染 |
| 请求体量 | ≈1.5–11.7K（全价 miss） | ≈会话前缀量级（命中按缓存价） | 命中收益主导（本批目标场景）；**miss 面成本量级**（评审 #2 补——与 §6.14「成本略升」不同量级，故单列）：单次 miss = 前缀量级**全价**，频度 ≈18 次/半日 ⇒ 较修前（1.5–11.7K/次）放大约一个前缀量级（登记，非阻断） |

**上抛项（主 agent 笔 · 提示词面）**：修后形态下 `EXPLORE_SUMMARY_PROMPT` 的角色句与尾行须随指令位置改写（先例 = §6.14 `SUMMARIZE_PROMPT` 定稿「The conversation above is our work log so far…」整句替换 + 删 `Work log:` 标签行）；
本批**禁触提示词面** ⇒ 设计按文本原样落形态；文本改写 = 主 agent 另笔——**非实施前置**（形态与命中判据不依赖文本），但摘要质量面以改写为上。

**退化面**：

1. **无 `systemPrompt` / 无 `tools`**（`extras` 缺省——VSC 适配器未接线 / 直调者）：`buildCompressMessages` 既有语义（system 缺省 ⇒ 不带头）+ `tools` 缺省 ⇒ 不发声明面 ⇒ 形态退化为「history 前缀 + 指令」，**正确性不变**、仅命中折扣；**miss 面成本量级**同上方质量风险表「请求体量」行（前缀量级全价 × ≈18 次/半日）。
   **服务端接受度登记（评审 #3 · 与 §6.14 取证项同源）**：该格 = 真身 `role:"tool"` / assistant `tool_calls` 消息**且不带 `tools` 声明**——即 §6.14 列为实施轮必得读数的那一格；蒸馏线该格**仅直调或测试可达**（生产两端接线后核调用点与 VSC 发射点均传 `extras`）⇒ **免真机取证**，离线面由新用例档覆盖；实施轮若实测该格真机可达（400）⇒ 上抛，不静默。
2. **无块 / <3 条探索结果**：不触发（阈值面不动，§6.9 H1）。
3. **蒸馏失败 / 中止**：返回 null、原历史保留、不触发 `onDistilled`（N3 既有；本批零改）。
4. **run 内发生过压缩**：切点 `lastBlockEnd` 落在压缩后 history 上 ⇒ 前缀 = 压缩后所送序列，仍与回合请求同源（前缀对齐前提同 §6.14：切点须为配对安全边界——`findExplorationBlocks` 只认完整助手→工具配对块，天然自足）。

**判定句与取证（预注册 · 与压缩线同口径）**：真机蒸馏调用 `cached / prompt ≥ 0.9`（对照改前 **0/18 = 0%**）；取证路径 = `~/.thincoder/traces/<date>/*.jsonl` 中 `"stage":"distill"` 行的 usage；前置闸 = 同会话回合调用命中 ≥0.9（同 §6.14）。
**判定格口径（评审 #5 补）**：判定格取**中大型前缀会话**（前缀占请求主体）——命中率结构上限 ≈ 前缀 /（前缀 + 未命中面），未命中面 = 尾部指令一条 + ≤255 块对齐残余；小前缀会话不作判定格（够不到 0.9 属结构性，非机制未生效），如需折算按 `(prompt − 未命中面) / prompt` 口径。

**先红方案（离线可判 · 实施轮落）**：新用例档 `thincoder-core/test/explore-distill-form.test.mjs`（`globalThis.fetch` 桩——先例 `thincoder-core/test/compress-form.test.mjs:114-151`）——修前形态 = `messages[0].role === "user"` ⇒ 形态断言（首条 = system / 末条 = 指令 / 前 N 条 = 回合前缀切片）**必红**；修后转绿。

**受影响文件表（单一权威位 = 本批任务书 · 评审 #1 收正）**：逐文件现况行数 / Δ / 尺寸档状态注 /「零改动」逐处核实 = **批次档 `2026-09-18-distill-prefix.md` §2.3**——本档不重复（D2；两处曾逐行重复并已现读数分叉）。

本 § 的落点族（设计侧速览）：核 `thincoder-core/explore-distill.mjs`（调用形态改会话续写 + 序列化面退役）· 核 `thincoder-core/compress-form.mjs`（头注声明第二消费点——行数读数见 §6.14 落地形态）。
两处调用点 `extras` 透传（核 `thincoder-core/agent.mjs` · VSC `thincoder-vscode/src/agent.mjs` + `thincoder-vscode/src/agent/run-stages.mjs`）· VSC 适配器（**端形向后兼容**——增形参 `extras`，评审 #7）。

**边界（本 § 不改）**：压缩面 · provider 面（`chat` 签名与发送面）· 提示词文本 · 替换面（§6.9 H1）——范围与逐处核实同批次档 §2.3 末行。

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
| D-CC17 | VSC 压缩 / 蒸馏共用 `_runStartHistoryLen` 边界重置（rebuild 后 = head + 2；占位并入分支 = head + 1——D-CC18） | 压缩与轮末蒸馏对锚；共享边界避免二次压缩误判 |
| D-CC18 | 压缩注入回声安全：tail 首条为 assistant ⇒ 占位并入该条（copy-on-write） | 「无 reasoning 的 assistant 紧邻 assistant」= 压缩后首发 400 成因形态（DeepSeek 系——子代理压缩后必死，轨迹实证）；占位为合成消息、无推理可回声 ⇒ 并入 = 消形态且零文本丢失（其 `tool_calls` / `reasoning_content` 原样保留）。**否决**：全量去占位（超发病面 + 推翻 D9）· 丢弃占位变体（丢确认锚）· 伪造 `reasoning_content`（污染 + 服务端接受度不可离线证）· tail 边界强制 user（与 D-T1 / D-T2 / 配对安全三约束互斥、不可保证） |

| D-CC19 | 恢复面回声归并 = **读取时**修（前条并入后条——与 D-CC18 同向） | 恢复路径原样装回已落盘机读线 ⇒ D-CC18 治好的形态从**盘上**复活（首请求 400）。**否决**：① 只在注入期修（病灶在盘 + 两端共用盘——恢复即复活）② 写盘时修（改历史文本 = 污染双线来源 / 会话档语义）③ 推用户重开会话（把机器面缺陷推成用户面成本）。**归并方向取「前并入后」**而非「后并入前」——与被并者（无推理者）字段语义一致、保文本序、与 D-CC18 同一判据。前条带 `tool_calls` 的变体**不并**（配对安全优先） |

| D-CC20 | 压缩调用改**会话续写形态**（前缀复用）：`system`（同回合）+ 中段真身消息 + 尾部指令一条 + **与回合同声明的 `tools`**（**不随 `tool_choice`**——v2 实施 2026-09-18：全形态经 S3 实测否决，该参数致服务端**丢弃 tools 区** ⇒ 落备选⑤；v1「不带 tools」被实施轮受控实测推翻） | 修前形态与回合请求共享前缀 0（轨迹 108590 / 256）；同请求体重发命中 98.0% ⇒ 机制可用、**形态**未复用；**命中面按 `tools` 声明分区**（实施轮受控实测：带 tools 93.6% · 不带 0%）⇒ 声明面须与回合同源。**否决**：① 全量 history + 指令（尾部进摘要输入域 ⇒ 摘要与保留尾部重复，且尾部落入未命中面）② **不带 tools**（= v1 决定——实施轮实测命中 0%；探针 R2 / R4 小样本结论作废）③ 按 `cacheMode` 双形态分派（双语义；`cacheMode` = 静态能力标注且核内零消费，与「调用期前缀可否复用」不同层——判据错位；原「标注语义 = 需显式 cache_control ≠ 无缓存」引证作废——评审 #5）④ 保留序列化正文 + 前缀拼接（中段重复发送，重复段不在命中面）⑤ 带 tools 但不抑制 tool_call（**已采纳**——2026-09-18 实测触发条件成立：`tool_choice` 自身破坏命中；泄漏由 content-only + 空白守卫兜底） |
| D-CC21 | 蒸馏调用改**会话续写形态**（前缀复用）：`system`（同回合）+ 中段真身消息（`[0, lastBlockEnd)`）+ 尾部指令（`EXPLORE_SUMMARY_PROMPT`）+ **与回合同声明面的 `tools`**（不随 `tool_choice`）+ **`reasoningEffort` 同源**——与 D-CC20 逐件同构（§6.15） | 修前形态与回合请求共享前缀 0（轨迹 18/18 = 0%，prompt 1.5–11.7K 全价）；命中机制（`tools` 声明分区 / effort 同值）已由 §6.14 受控实测确立（84–98% · 92.86/93.65%）⇒ 本面 = 同式复制、不重造。**否决**：① 保留序列化正文 + 前缀拼接（重复段全价且不在命中面）② 全量 history + 指令（末块之后尾部入摘要输入域，且全价新面）③ 指令前置于正文（插入点之后的真身消息全落入未命中面 ⇒ 命中 ≈ 0）④ 维持修前单条 `user` 形态（0%）⑤ 改提示词文本以适配尾部位置（内容权 = 主 agent——登记上抛，本批不做） |

| D-CC22 | 活体推入面回声恒带：`required` 族的**工具轮** assistant 消息恒带 `reasoning_content`（本轮无推理 ⇒ **空串**）——核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`），**主循环 / advisor 循环 / VSC 端壳自有循环（`thincoder-vscode/src/agent.mjs:387-397`）三站点共用** | 与 D-CC18 / D-CC19 **同判据**（required 族机读线不得缺该字段）的**第三面**：前两者治压缩注入 / 恢复读取，本面治**活体推入**（前两者不覆盖）。真机实证（2026-09-20 · deepseek-flash · 带 `tools` · 同形历史三连）：带空串 **200**（服务端仍回 `reasoning`）· 缺字段 **200** 但 `reasoning` 帧 = **0** · 带真值 **200** ⇒ 空串合法，且缺字段轮服务端不再回推理（与 `advisor/loop.mjs:199-204` 自述同向，n=1）。**否决**：① 维持条件式省略（族内形态不齐 + 症状持续）② 伪造 / 借用别轮推理文本（污染 + 与「回声 = 服务端原文」语义冲突——承 D-CC18 否决③）③ 改 provider 序列化面统一补字段（跨族越权：glm / optional 族行为将改）④ 落点选 `context.mjs`（该档 496 行 + Δ 越 **500 硬限**——`core-hygiene` 硬红）⑤ 各推入点内联同式（多构造点——违 D2 单源） |

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
| 源档 §1–§5 纯 VSC 同构细节逐行（安全点 / 阈值 / token 判定 / 切割 / 摘要回注） | VSC 侧同构实现 | 已并入 §6.13（接线面 + 端差坐标）；同构正文不逐行复制（D2） |

### 8.3 需求侧（已并入本层需求档）

旧档需求面（原 §8.1 压缩体验 F1–F4 · §9.2 探索摘要条目 F1–F3 / N1–N3）=== 本板块需求层，已并入本层需求档 `docs/core/requirements/CONTEXT-COMPACTION.md`（**与本档同名成对**）——本档不重复。

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #162–#164）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §6 **机制面**（术语与双线 / 触发 / token 判定 / 切割四约束 / 降级链 / 回注与双线 / 文案与静默 / 压缩面板 / 摘要 ≤1K 与探索摘要 / 行为契约 / parity / 实现位置）· §7 **关键决策（D-CC1–16）** · §8 **不并项与历史沿革** · §9 体量（低于软线，无需拆分）；
  来源 = `thincoder-cli/docs/design/CONTEXT-COMPACTION.md`（**旧档一字未改**——原地作参照历史）；需求侧已并入本层 `docs/core/requirements/CONTEXT-COMPACTION.md`；首部加机制面指针一行。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.13 新增 **VS Code 端接线面**（判定点封装 / 基线记录 / 预算端差 /
REVERSE 保护坐标 / 摘要段形状 / 边界重置 2 / webview 四态 / 失败可见化 / 非压缩职责边界）· §7 补 **D-CC17** ·
§8.2 补 1 行不并项登记；来源 = `thincoder-vscode/docs/design/CONTEXT-COMPACTION.md`（**旧档一字未改**）；
坐标按现状实核（`thincoder-vscode/src/compact.mjs:31,115,323,367`——该档 **W6 已删**、现体 `thincoder-core/context.mjs` · `thincoder-vscode/src/extension/panel-callbacks.mjs:144-152` · `thincoder-vscode/src/agent/setup-reminders.mjs:145,163,194`）。 （迁移期引文）
- 2026-09-15（**W6 迁核收正 · VSC 壳代码接线批**）：§6.13 按 W6 现状收正（判定点封装改指核 `compressIfNeeded` / `compressFallback` ·
  阈值档位经核 `resolveCompactThreshold` · 端差适配（`provider` / `tasks` / `planMode` 调用期同指 + 共享数组回收）· 预算端差退场 ·
  REVERSE 保护退场（回植候选记核内笔）· webview 四态现状登记 · 摘要段形状取核）· §6.12 实现位置 VSC 列改指核面 ·
  §6.11 REVERSE 差异注收正 · §6.4④ 预算常量端差注收正 · §1 归属表补迁核注（旧档 `thincoder-vscode/src/compact.mjs` **已删**、现体 `thincoder-core/context.mjs`）；§9 体量重锚。 （迁移期引文）
- 2026-09-16（**子代理压缩后推理链回传断裂修复 · eng-designer**——承 `docs/batches/2026-09-16-subagent-reasoning-echo.md`）：新增 **D-CC18**（压缩注入回声安全——tail 首条为 assistant 时占位并入该条）· §6.10 #2 形状句修正 + 新增 **#7 回声安全契约** · §6.7 D9 注 · §6.12 符号列补 `applyCompression` · §6.13 边界重置注收正；
  来源 = 轨迹档离线解剖（`reasoningEcho:"required"` 压缩后首发 400——同链 5 子代理全灭实证）；修复落点 = `thincoder-core/context.mjs` `applyCompression`（反向用例 = 核单测，§2 任务书）。
- 2026-09-16（**实施轮收正 · eng-coder**——评审发现 🟡#3 / 父侧裁决「同轮收正失效文本」）：§6.4② 形状句补并入分支注 · §6.13 摘要段形状注删「带压缩时刻 ts」（并入分支保留尾首原 ts——D-S1 例外）；实现面 = `thincoder-core/context.mjs` `applyCompression` 并入分支 + 核单测 `thincoder-core/test/compaction-echo.test.mjs`。
- 2026-09-16（**批 8 ENGINE-DEBT · 设计轮 · eng-designer**——承 `docs/batches/2026-09-16-engine-debt.md` §2 ED-1）：§6.10 新增 **#8 恢复面回声归并契约**（读取时归并 + 两端调用点 + 配对安全边界）· §7 新增 **D-CC19**（读取时归并决策 + 否决备选）；需求侧同批补 `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 恢复面回声安全条目。
- 2026-09-18（**压缩续写批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-compression-continuation.md` §1 · 台账 #39）：新增 **§6.14 压缩调用形态 · 会话续写（前缀复用）**
  （修前实况 / 轨迹读数 / 探针实证 / 消息序与前缀构成 / 质量风险评估 / 退化面 / 与压缩生存诸机制的交互）· §7 新增 **D-CC20**；
  依据 = 轨迹离线取证（`~/.thincoder/traces/**`）+ 设计期缓存探针；落点 = `thincoder-core/context.mjs`（任务书见批次档 §2）。
- 2026-09-18（**压缩续写批 · 评审轮 1 收正 · eng-designer**——承批次档 `2026-09-18-compression-continuation.md` §3：🔴1 · 🟡5 · 🔵3）：
  §6.14 补 **落地形态（模块拆分 + `wc -l` 行数预算）** 与 **provider 接受度取证项**；「内容面无变化」句按「选中面 / 表示面」收正；尾「待定稿」句 → 定稿完成指针；
  退化面补 **轨迹体积**（接受）与 **非空白非摘要残余**（登记 + 观测口径）两条；「机制对照」补口径注；§6.11 提示词口径按单源收正 · §6.12 VSC 列蒸馏注按 W15 收正；
  §7 D-CC20 否决③ 引证收正（原 `cacheMode` 语义引证作废——改「静态能力标注 / 调用期事实」错位论证）。
- 2026-09-18（**压缩续写批 · 实施后修正轮 · eng-designer**——承批次档 `2026-09-18-compression-continuation.md` §5 实测 + 父侧裁定；逐条处置见其 §2.10）：
  §6.14 新增「**命中面按 `tools` 声明分区**」（实施轮受控实测——推翻探针 R1–R4 结论①）与「**v2 修法 · 声明面对齐（`tools` + `tool_choice:"none"`）**」（可行性核 / tool_call 泄漏后处理 / 5 条否决备选 / 预注册探针复测方案 S1–S6）；
  `tools` 行 · 「前缀构成」· 质量风险表「输出面」行 · 退化面 1 按 v2 收正；落地形态按实施实测收正（`context.mjs` **492** · `compress-form.mjs` **20** · 新测试档 **213**——原估 +105 作废）；
  §6.4② / §6.5① / §6.7 D9 三处**已退役序列化面**描述收正（代码评审 #2 登记项）· §6.11 提示词坐标 `:60 → :61` · 定稿块补「整句替换」读法裁定（`You are a conversation compressor.` 退役）+ 计数收正（10 条 → 9 条）· §7 D-CC20 的 tools 面与否决② 收正（原「带 tools」否决项改指「不带 tools」）。
- 2026-09-18（**压缩续写批 · 实施轮 v2 实测收正 · 父侧直接执行**——承批次档 §5 读数）：§6.14 定稿块 / 状态行 / 判定规则 + §7 D-CC20 同步收正——**落备选⑤**（带 `tools`、**不随 `tool_choice`**：S3 6/6 格首现 0% + token 证据=服务端丢弃 tools 区）；残留 0% 根因 = `reasoning_effort` 异值（单变量实证——上抛父侧裁定）。
- 2026-09-18（**蒸馏前缀批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-18-distill-prefix.md` §1 · 台账 #47）：新增 **§6.15 蒸馏调用形态 · 会话续写（前缀复用）**（修前实况 / 轨迹读数 18 次 0 命中 / 修法三件与压缩线逐件同构 / 质量风险与上抛项 / 退化面 / 判定句与先红方案 / 受影响文件表）· §7 新增 **D-CC21** · §6.9 H1 补调用形态指针与签名收正；
  依据 = 轨迹离线自采（`~/.thincoder/traces/2026-09-18/*.jsonl`——18/18 零命中；量级收正 1.5–11.7K）+ §6.14 先例（v2/v3 受控实测）；落点 = `thincoder-core/explore-distill.mjs` 一族（任务书见批次档 §2）。
- 2026-09-18（**蒸馏前缀批 · 评审轮 1 收正 · eng-designer**——承批次档 `2026-09-18-distill-prefix.md` §3 轮次 1：🟡3 · 🔵4）：§6.15 **受影响文件表改指针**（单一权威位 = 批次档 §2.3——两处逐行重复且读数分叉，评审 #1）+ `compress-form.mjs` 读数统一 **21 行**（§6.14 落地形态 + 行数沿革行，同批收正）；
  质量风险表「请求体量」行 + 退化面 1 补 **miss 面成本量级**（前缀量级全价 × ≈18 次/半日——评审 #2）· 退化面 1 增 **服务端接受度登记**（与 §6.14 取证项同源：该格仅直调 / 测试可达 ⇒ 免真机取证——评审 #3）· 判定句补 **判定格口径**（中大型前缀会话 / 折算口径——评审 #5）· 适配器措辞改 **端形向后兼容（增形参 `extras`）**（评审 #7·落地见批次档 §2.3 #5）。
- 2026-09-18（**漂移收正轮 · eng-designer**——承 `docs/batches/2026-09-18-distill-prefix.md` §5 八、登记 · 台账 #76）：§6.9 H1 签名行标 **核形** + 端形第 6 位注明（`agent` 居第 5——防实施误插）· `EXPLORE_SUMMARY_PROMPT` 坐标 `thincoder-core/explore-distill.mjs:21` → **`:23`**（+2 = 本批头注改动位移）。机制条文零改。
- 2026-09-20（**thinking 回传缺口批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-20-reasoning-echo-gap.md` §1 · 台账 #109）：§6.10 新增 **#9 活体推入面回声恒带** · §7 新增 **D-CC22**（required 族工具轮 assistant 消息恒带 `reasoning_content`，缺值 ⇒ 空串；核单点构造 `assistantToolCallMessage`）；
  依据 = 真机三连实证（空串 200 / 缺字段 200 且 `reasoning` 帧 0 / 真值 200）+ 轨迹面复算（`~/.thincoder/traces/2026-09-20/` 当日 690 次调用：缺字段形态 263 次**全成功**——批次档 §1.2 的「一律 400」不成立于普通请求，见该批 §2.7）；落点 = `thincoder-core/model-specs.mjs` + `config.mjs` re-export + 两推入点（任务书见批次档 §2）。
- 2026-09-20（**thinking 回传缺口批 · fix 轮（第三站点补面）· eng-designer**——承 `docs/batches/2026-09-20-reasoning-echo-gap.md` §2.9）：§6.10 #9 调用点枚举 **2 → 3**（补 VSC 端壳自有循环 `thincoder-vscode/src/agent.mjs:387-397`——端取值 × 同一构造单点；W8 契约② 静态引合法）· §7 D-CC22「共用」口径同步为三站点、否决项「双构造点」收正为「多构造点」。机制条文其余零改。
- 2026-09-20（**thinking 回传缺口批 · 设计评审轮 1 收正 · eng-designer**——承批次档 `docs/batches/2026-09-20-reasoning-echo-gap.md` §3 轮次 1：🟡#3）：§6.10 #9 的 W8 闭包读数改**指针形态**（单源 = 该批 §2.9 ①——同批三处重复读数收口）。机制条文其余零改。

