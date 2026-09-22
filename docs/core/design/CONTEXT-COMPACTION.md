# 上下文压缩 · 标题 · 文本额度（CONTEXT-COMPACTION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

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

9. **活体推入面回声恒带（D-CC22）**：`reasoningEcho:"required"` 族（`thincoder-core/model-specs.mjs:33/35/38/40/42` deepseek · `:44/46/48` kimi · `:75/76` mimo）的**工具轮** assistant 消息经核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`）推入 ⇒ **恒带**
 `reasoning_content`；本轮无推理 ⇒ **空串**（不省略字段——「必须回传」按字段在场判定）。真机三连（2026-09-20 · `deepseek-flash` · 带 `tools` · 同形历史）：空串 **200**（服务端仍回 `reasoning` 63 字符）/ 缺字段 **200**（`reasoning` 帧 **0**）/ 真值 **200**（104 字符）⇒
 空串合法；缺字段轮不再回推理，与 `advisor/loop.mjs:199-204` 自述同向（n=1 采样——症状面证据）。调用点（**三站点共享同一构造单点**，非各自内联）：主循环 `thincoder-core/agent.mjs:366-376` · advisor 循环 `thincoder-core/advisor/loop.mjs:205-215` · VSC 端壳自有循环
 `thincoder-vscode/src/agent.mjs:387-397`（端取值 = `thincoder-vscode/src/specs.mjs` 的 `specForModel`，构造单点经该档转口复用；静态引合法（W8 契约②）= 结论——**闭包读数单源 = 批次档 `docs/batches/2026-09-20-reasoning-echo-gap.md` §2.9 ①**）。glm 族 / 未声明（`optional`）⇒ 恒不带（行为零改）。
   **形状限定（2026-09-20 · 实现轮 184 探针 · 批次档 §2.11 ①）**：「缺字段 **200** · `reasoning` 帧 0」**仅设计轮形状（请求尾 = user）**成立；**活体形状（尾 = tool · 三站点产出形状）**实测 = 空串 **200** / 缺字段 **400**（逐字 `must be passed back`）· 真值 **200** · kimi 三形态全 **200** ⇒ 空串接受面双族已证（mimo 不可证——无凭证）。

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
  `webview/chat-status.js showCompressStatus` 原地更新 `#compress-status`；摘要正文永不进前端（D11 静默纪律）。
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

结论 ①（2026-09-18 裁定）：设计期读数「R2 / R4（不带 tools）命中了 R1（带 tools）所建前缀」在生产尺度**不成立**——该 256 命中 = 493 / 747 token 小样本的整块 floor 巧合（见下方「命中面按 `tools` 声明分区」）。
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

**结论**：命中面**按 `tools` 声明分区**——同模式同前缀下，携带 tools 的压缩请求命中了回合请求所建前缀（93.6%），不携带者命中 **0%**（与修前基线 256 / 108590 = 0.2% 相当）⇒ **v1 形态（不带 tools）实测收益 ≈ 0**。

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

- **状态**：消息序 v1 **已落**（`thincoder-core/compress-form.mjs` + `context.mjs` 接线）；`tools` 行 = **v2 已实施**（2026-09-18 · `context.mjs` 落盘 494 → v3 后 **495**）——
  **落备选②**（带 tools、**不随 `tool_choice`**：该参数实测致服务端丢弃 tools 区 ⇒ 按预注册判定规则采纳备选②）；
  `reasoningEffort` 行 = **v3 已实施**（2026-09-18——**同源随带**：移除 `reasoningEffort: null` 覆盖 ⇒ 与回合同一字段；不硬编码 · 无配置 ⇒ 缺省）——**真机生产口径首现命中 92.86% / 93.65%**（两次独立运行，对照改前 0%）；
  派生差两则（百炼 qwen 族 / autoThink 窗口）⇒ **认账**（2026-09-22 裁 · 台账 #56）：压缩侧**不设思考**（`thinking:null` = 需求 N1 字面 · 本档 D9）——
  ① 百炼 qwen 族压缩侧 `enable_thinking:false` = 该字面的派生结果（`thincoder-core/config.mjs:137` 首判命中；非缺陷）；② autoThink turn-0 窗口（压缩检查先于分类）为**已知边界**（影响有界：仅 turn-0 且长史触阈；其后各轮同源）。
- **前缀构成**（= 可复用面）= `tools` 声明 + `system` + 中段（v2；v1 = `system` + 中段——实测该面未被命中）；**新增未命中面** = 尾部指令一条（+ ≤255 的块对齐残余）。中段 = `splitHistory` 的 `[headEnd, tailStart)`（KEEP_HEAD = 0 ⇒ head 空；§6.4② / ④）。
- **摘要输入域（选中面）不变 / 表示面改变**（评审 #3 收正）：修前同样只喂中段（尾部不进摘要输入）⇒ **选中范围不变**；中段的**表示面**改变（序列化文本 → 真身消息 · 不截断）——信息量差异见下方质量风险表。
- **前缀对齐前提**：切点须是配对安全边界（`repairedTailStart` 保证中段自足）——否则发送期配对归一（`thincoder-core/provider/normalize.mjs`）会在压缩请求合成 `[Tool result missing: …]` 占位而回合请求不会，前缀自此分叉。
- **单一真值**：请求前缀切点与摘要段切点同源（同一个 `tailStart`），不新增第二处切割判据。
- **落地形态（模块拆分 · 行数预算 · 评审 #1——已落）**：纯函数 `buildCompressMessages` 落核档 `thincoder-core/compress-form.mjs`（落盘 **21 行**（`wc -l`）——零 import 依赖：指令文本由实参传入，不与 `context.mjs` 成环）。
  行数沿革（2026-09-18 · 蒸馏前缀批评审轮 1 · 评审 #1 收正）：实施轮 as-of 值 20 行 ⇒ v2 收正扩写头注 +1 行 = **21 行**（`wc -l` 实测）——全档唯一权威读数，§6.15 不再复制。
  `thincoder-core/context.mjs` 只留接线（import `:15` + 调用 `:400` + 空白摘要守卫 `:414`）并**减去** `serialized` 序列化段（修前 `:388-400`，13 行）——**行数口径 = `wc -l`**（= 机检 `thincoder-core/test/core-hygiene.test.mjs` 硬限用例 `:136` · `wc -l` 口径 `:141` · `>500` 断言 `:145` 的判定口径·>500 硬红）。
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

### 6.16 模型主动整理上下文（`context` 工具 · 操作区分）（2026-09-21 context-tool 批 · 台账 #18）

**需求单源** = `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1「模型主动整理上下文（`context` 工具 · 操作区分）」条目 **F-CC1–F-CC5**（判定句 ①–⑤ 与边界在同处）——本节只给**落点与形态**，不重述需求（D2）。

**命名辨析（读到 "context" 时先分清三义）**：① 本节的**工具名** `context`（模型可见的单工具三操作）；② 核**压缩模块档** `thincoder-core/context.mjs`（机制本体——与工具名同词、不同命名空间）；③ VSC **宿主工具**（IDE 快照——本批**改名 `ide`**，让出 `context` 名，见 D-CC26）。CLI `/config` 的 action id `context`（窗口设置项）与工具面无关。

**6.16.1 工具形态逐字（F-CC5）**

落点 = 新档 `thincoder-core/agent-tools/context.mjs`（**已落**——家族工具面；**内联 description**；**不新增 tool-docs 档**：24 档族计数零动，先例 = agent-tools 全族内联）。

注册单源 = `thincoder-core/agent-tools.mjs`（#83 登记册，+1 export）；装配点 = `thincoder-core/agent/family-tools.mjs` 的 depth-0 段（`depthOnly`——与 `readHistoryTool` 同列表；子代理面裁见 6.16.6）。

```js
export const contextTool = {
  name: "context",
  description:
    "Manage your own context window — see how full it is, drop stale tool output, or compact the earlier " +
    "conversation into a summary at a moment of your own choosing.\n" +
    "- action='stats': current usage — total vs the compaction threshold, per-segment shares, and how much " +
    "is prunable / reclaimable.\n" +
    "- action='prune': drop the CONTENT of stale tool results (older than the protected tail) and replace it " +
    "with a short stub — tool pairing stays intact, the session record keeps the full text, and the tool can " +
    "simply be re-run.\n" +
    "- action='compact': compact the earlier conversation now, with 'focus' — write what the UPCOMING work " +
    "needs (1–3 sentences: the goal, the files, the constraints that must survive). The summary is written to " +
    "serve that focus; the current task list and goal are attached automatically. It runs at the next safe " +
    "point (before the next request — never mid-exchange) through the same machine as the automatic " +
    "compaction: same summary chain, same panel, same failure chain (3 consecutive failures degrade to a " +
    "deterministic truncation). The receipt carries this session's record path, so nothing is lost for good.\n" +
    "Nothing here runs on its own — the automatic threshold compaction stays in place as a fallback; whether " +
    "to compact is your call. Errors come back as 'Error: ...' and change nothing.\n" +
    "Parameters:\n" +
    "- action (required): stats | prune | compact\n" +
    "- focus (required for compact): what the upcoming work needs — the summary is weighted toward it",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["stats", "prune", "compact"], description: "stats — usage report; prune — drop stale tool-output content; compact — summarize the earlier conversation now." },
      focus: { type: "string", description: "compact only (required): what the upcoming work needs — 1–3 sentences. The summary is weighted toward it." },
    },
    required: ["action"],
  },
  readonly: true, // 只动机内状态（同 task / goal 先例）——planMode 放行、只读角色过滤放行、无权限问询
  async execute(args, ctx) { /* stats | prune | compact —— 见 6.16.2–6.16.5 */ },
}
```

- **描述面六要素核对**（形态权威 = `TOOLS.md` §6.9）：① 一句话语义 = 首句；② 参数关系 = 末段 `Parameters:` 块；③ 路由 / 反模式 = 三操作逐条 + 「nothing here runs on its own」；④ 副作用 = prune 丢内容 / compact 排队 + 回查锚；⑤ 错误形态 = 「Errors come back as 'Error: ...' and change nothing」；⑥ 多端一致 = 核单源（family 段两端同调）。
- **两界原则（零文档指称）**：描述文本内零档案指称（无 "see docs/…" / 无节号）——模型可见面自足；`read_history` 只在**回执**里作**取回面**出现（工具名指称，非文档指针；先例 = plan-mode 提醒点名 `plan`）。
- **参数面**：`focus` 在 schema 层非 required（JSON Schema 无条件必填），改由 execute **fail-closed** 运行期判：`compact` 且 `focus` 去空白为空 ⇒ 返回错误串、**不排队**（先例 = `goal` 的 `criteria` 必填判）。

**6.16.2 压缩接线（F-CC2 · 本设计的机制核心）**

模型发起 ⇒ **排队 + 下一安全点落**（不是回合中途立即压）——三面逐条：

| 面 | 判定 |
|---|---|
| **回合中途怎么落** | `compact` 工具**只登记不执行**：写 `agent._pendingCompact = { focus, at }`（**单槽**——重复调用后者覆盖前者，回执明示），返回回执；**历史零改、不发 LLM**。真正执行发生在**下一个安全点**（`agent.history.at(-1)?.role ∈ {user, tool}`——工具结果落盘后的天然边界），即既有检查点的同一处；此刻本批全部 tool 结果已配对落盘 ⇒ 不产生孤儿 `tool_call` 结果（回合中途压缩的本体风险由此消） |
| **消费点** | 核 `thincoder-core/agent/run-stages.mjs` `runCompactionCheck`（`:63-87`）——先取 `pending = agent._pendingCompact`，随即**清槽**（失败不重放；重发由模型再调）；`pending` 在场 ⇒ 以 `{ ...compactionOverhead, force: true, focus }` 调核 `compressIfNeeded`。VSC 对位 = `thincoder-vscode/src/agent/run-stages.mjs` `checkAndCompact`（`:186-250`）同构接线（两端各自接线、语义同源——先例 D-CC19） |
| **与回合尾 / 阈值面（互斥还是排队）** | **阈值面排队承接、互斥于「同点一次压缩」**：强制面**成功（摘要路）** ⇒ 本次安全点的阈值检查自然不被消费（历史已重建）；强制面**成功（有损收缩路——`!split` 且 `shrinkOversized` 命中）** ⇒ 同按「一次成功压缩」记账（**不落 no-op 注记 / 不跑阈值面**——见下「第三去向」）；强制面**无可压**（`!split` 且 `shrinkOversized` 未命中）⇒ 记 no-op 注记后**照常**跑阈值检查（阈值面不因模型请求而让位）；同一安全点至多发生**一次成功压缩**（重建后的 tail 不得当轮再摘要） |
| **阈值面语义零改** | `force` 只跳过 `tokens <= threshold` 这一条早退（模型判定优先于阈值），其余全同：同 `splitHistory` / 同尾部预算 / 同摘要链 / 同 `applyCompression` 回注 / 同 `_lastPromptTokens` 失效；**无 focus 时请求体逐字节同修前**（`compress-form.test.mjs` 零回归） |
| **失败路径复用** | 摘要在途失败 ⇒ 既有失败链原样（`_compressFailures++` → `onCompressFail` → 连续 3 次 `compressFallback`）；AbortError 照旧透传（不落注记）；模型面另落**失败注记一行**（旧式无人告知的缺口在本面补齐——见下）。`context compact` **不另起**任何失败 / 降级 / 面板机制 |
| **回执面** | ① **工具回执**（`compact` 调用当次返回）：排队事实 + focus 回显 + 落点说明 + **可回查锚**（见 6.16.7）；② **结果注记**（机器行一条，`transient: true`，直推 `agent.history`）：仅两种情况落——**no-op**（`nothing to compact right now (no middle section…)`）与**失败**（`context compact failed (attempt N of 3): <msg>`）；**成功不落注记**（压缩注记 + 摘要本身就是结果，重复即噪音） |

- **强制面第三去向（有损收缩已处理 · 登记）**：`force` ∧ `!split`（无中段）∧ 单条消息体 > `OVERSIZE_CONTENT_LIMIT`（8000 字符——`thincoder-core/context.mjs:393`）⇒ `shrinkOversized` 命中（`:403-432` 返 true）——该安全点按**一次成功压缩**记账：**不落 no-op 注记**（有损收缩已发生，「nothing to compact」不实）、**不跑阈值面**。
  等价性（判「现状语义自洽、非缺口」之据）：该形下阈值面的唯一杠杆 = **同一** `shrinkOversized`（`:285-289`）⇒ 跳过与执行**可观察结果等价**——`split` 输入（条数 / 角色序）不因收缩改变仍为 null，已截体落限内（keepHead 4000 + stub + keepTail 2000 < 8000）⇒ 重复调用恒 false。
  模型面可观察 = 被截条目的体内标记 `[... N chars truncated — single message too large for context window ...]`（`:421` 逐字）；该去向含 `tokens <= threshold` 形——`force` 已跳过阈值早退（模型判定优先于阈值）。
  机判形（登记 · 现无专属用例——C5① 覆盖摘要路、C7 覆盖无收缩命中的 no-op 路）：短历史 ∧ 单条 >8000 字符 + `compact` ⇒ 零摘要请求 ∧ 体内截断标记 ∧ 零 no-op 注记。

**focus 指令块（摘要请求尾段追加——`context.mjs`）**：

```js
const focusBlock = (focus, anchor) =>
  `\n\nThis compaction happens at my own request and is weighted toward the work coming next:\n${focus}\n\n` +
  `Keep what that work needs at full fidelity — files, decisions, constraints, open threads; compress ` +
  `everything else harder. Current task/goal state (attached automatically):\n${anchor}`
// anchor 行格式沿用既有任务重注入形态（`- [status] title` + goal 一行）；无 task 且无 goal ⇒ anchor 段省略（focus 正文恒保留）
```

- **自动附任务 / 目标（F-CC2 明文）**：`anchor` 取 `agent.goal`（`objective` + `criteria` + `status`）与 `agent.tasks`（`- [status] title`，任务工具已限 20 条）——**取值源 = 工具面单源**（`agent-tools/task.mjs` / `goal.mjs` 写入的 `agent.tasks` / `agent.goal`），不新增第二份状态。
- **两相斥 focus 的可断言性**（判定句 ①）：离线（桩）= 两请求体末条互不相同且各含其 focus 文本 + anchor 块（机判）；真机 = 两份摘要的聚焦词命中计数差额（**取证类，非 CI 门禁**——先例 = §6.14 真机取证项）。
- **前缀复用不受损**（与 §6.14 同口径，登记非门禁）：强制压缩的中段 = `[0, tailStart)`，仍是上一回合请求消息数组的前缀 ⇒ 命中面不因本面退化。

**6.16.3 prune 语义（F-CC3）**

- **合格对象**（三条件合取，单源实现 = 核 `token-window.mjs` `collectStaleToolOutputs(history, provider)`）：① `role === "tool"`；
  ② **保护尾之外**（`i < split.headEnd…tailStart` 边界内——**复用 `splitHistory` 的同一 `tailStart`**：即「压缩会摘要掉的那段」，不新增第二处切割判据）；
  ③ 估算 ≥ **`PRUNE_MIN_TOKENS = 200`**——**常量与合格集同住 `token-window.mjs`**（该档导出、`context.mjs` 单向取用 ⇒ **零回指**；低于门槛的替换是净增 token——stub 本身有长度）。
- **与配对安全的关系**：**保结构、只换内容**——`history[i] = { ...m, content: stub }`（原位换对象：数组引用 / 长度 / 索引 / `tool_call_id` 全不变）⇒ tool_use↔tool_result 配对**结构上不可能被拆**（不设 owner 拉回逻辑——无切割面）。stub 逐字：`[pruned: stale tool output dropped (<N> chars) — re-run the tool if you need it again.]`。
- **与保护尾 / 预算面的关系**：保护尾边界 = 压缩面同一函数（`keepTailSize` + `tailBudgetTokens` + `splitHistory` 的配对修复）⇒ 压缩刻意保留的近期原文**不在 prune 面内**；短历史（无中段）⇒ 合格集为空 ⇒ no-op。
- **记录面不变**：只动机读线；`_fullHistory` / 会话档 / 记录存储零改（copy-on-write——消息对象与人读线共享，原地改会连带截断记录面：`shrinkOversized` 同款纪律）。
- **基线失效**：prune 后 `_lastPromptTokens = null` / `_usageAtLen = null`（同 `shrinkOversized` 先例——实测基线含已删内容，不失效则阈值被高估）。
- **回执**：`Pruned N stale tool output(s) ≈T tokens freed …` + 「扫过的候选数 / 保护尾内保留数 / 门槛下跳过数」+ 「会话记录零改（全文仍在盘上）」。
- **边界（登记）**：多模态 tool 结果（content 数组）整体替换为 stub ⇒ 图像 part 丢弃（不可再取；prune 是**删**不是摘要——回执不声称可复原，只给「重跑工具」路径）。

**6.16.4 stats 面（F-CC1）**

- **报什么数**（逐行定稿，机判可解析）：

```
Context ≈{total} tokens vs compaction threshold {threshold} ({pct}% — {toGo} to go); window {window}
Segments ≈: system {system} · tools {tools} · history {history} (basis: {measured|estimated})
History: tool outputs {toolOut} tokens in {toolCount} msgs · prunable stale {stale} tokens in {staleCount} msgs · protected tail {tailCount} msgs
Status line: context {statusPct}% ({history} history estimate / {window} window)
Compaction so far: {none | last summary freed {freed} tokens | last fallback truncation} · failures {n}/3
```

- **取自哪里（单源）**：`total` = 核新档 `thincoder-core/token-window.mjs`（**已落**）的 `contextUsage(agent, overhead)`——与 `compressIfNeeded` 的 token 判定**同一函数**（既有内联式改为调它，判定语义零改）。
  - 实测优先 = `_lastPromptTokens + 增量`；无实测 = `estimateTokens(history) + system + tools`。
  - `threshold` = 该回合检查用的同一值（`agent._ctxBasis.threshold`）；缺省回退 `resolveCompactThreshold(agent.config?.agent?.compactThreshold, agent.provider).value`。
  - `window` = `providerSpec(agent.provider).context`；`stale` / `tailCount` = 6.16.3 的同一合格集函数。
- **阈值单源接线**：核 `agent.mjs`（`compactionOverhead` 构造处 `:188-194`）与 VSC `checkAndCompact`（`:190-199`）各补一行 `agent._ctxBasis = { threshold, overhead }`——stats 因此报**该回合实际判定所用的阈值**，不自行重算第二口径。
- **与状态行 ctx% 的单源关系**：状态行口径 = `estimateTokens(history) / providerSpec(provider).context`（CLI `thincoder-cli/src/tui/render-frame.mjs:394-397` + `thincoder-cli/src/tui/render-loop.mjs:89-90`；VSC `ctxPercentForHistory`）——两端已由 `context-percent-parity.test.mjs` 钉死。
  stats **不新增第三口径**：以 `historyPercent(history, provider)`（核新导出，与状态行同式）报出**用户看到的那个百分比**，并写明两种口径的分子分母（阈值口径含 system / tools；状态行口径只算 history）。
  **状态行实现零改**（其字面被该测试组①「对端源锚」机判锁定——改字面即红）。
  **空历史口径（保留分歧 · 登记）**：`historyPercent([])` = **0**（纯公式——分子 0）；两端把「零值不显示」的门放在**端侧显示层**（CLI `thincoder-cli/src/tui/render-frame.mjs:396-397` 以 `ctxPct > 0` 才渲染该段；VSC `thincoder-vscode/src/specs.mjs:84-88` 分子 0 ⇒ 返 `null`）——显示门不入本函数面。
  stats 恒报数值（报告面须给定值：空历史 = `0%`）。**不收正**：收正须动 VSC `ctxPercentForHistory` 的 `null` 返回，或让核函数返 `null`（后者使 stats 第 4 行无法定值）——两向皆越「状态行实现零改 / VSC 面板零改」边界，且两端同为「零值即不显示」，取形分歧零收益。

**6.16.5 轻推（F-CC4）**

- **触发事件**：`task` 工具改变任务列表后（`agent-tools/task.mjs` execute 尾）+ `goal` 工具任一状态变更后（`set` / `complete` / `blocked` / `cancel` 四个状态改变分支）。**不做方向检测**：触发 = 机械事件（工具被调用），不判「是否真的转向」。
- **落线与形态（一行 · 非命令）**：`pushContextNudge(agent)`（住 `thincoder-core/agent-tools/context.mjs`（**已落**））——直推机器行 `{ role: "user", content: CONTEXT_NUDGE_LINE, transient: true }`：

```
[System reminder: task/goal changed — current objective: {anchor}. If the earlier context no longer serves this direction, you may compact it (context tool, action="compact" with a focus) — the decision is yours.]
```

  `anchor` = 有 active goal ⇒ `goal.objective`；否则 in_progress 任务标题；否则首个 pending 标题；否则 `(none set)`。
- **去重（恰一次）**：**单活体行**——同前缀旧行先滤（`filter` 同 `TASK_REINJECT_PREFIX` 手法）再推一行 ⇒ 任意次数的 task/goal 变更后恒**恰一行**；`_pendingCompact` 被消费后该行不特殊处理（它是一次建议，压缩重建时若落入中段即随摘要退场、落入 tail 则保留——非命令文本，良性）。
- **零调用零副作用**：只有 task/goal 工具被调用才可能产生；`context` 自身与其它工具不产。
- **深度门**：`ctx.depth === 0` 才落——子代理无 `context` 工具（6.16.6），提示一个它拿不到的工具即噪音。

**6.16.6 装配面（双端一致 ✓ 与子代理裁定）**

- **单源落点**：`thincoder-core/agent-tools.mjs`（#83 登记册）+ `thincoder-core/agent/family-tools.mjs` 的 `depthOnly` 段 ⇒ **两端自动同表**（CLI 经核 `thincoder-core/agent/setup.mjs`；VSC 经 `setup-tooltable.mjs:262-273` 同调核 `assembleFamilyTools`）。
- **VSC 端零表改动**——这正是把 `context` 放家族段而非 `tools/` 静态表的原因：那张 VSC 手写表是已知重复面（教训 = `docs/batches/2026-09-15-vsc-tool-table-dup.md`）。`builtinTools` / `assembleBuiltinTools` 名集（24 + 8）**零改** ⇒ `tool-registry.test.mjs` 的 `SHARED_FACE` 计数不动。
- **VSC 宿主工具让名（D-CC26）**：VSC 宿主工具 `context`（**旧路径** `thincoder-vscode/src/tools/context.mjs`（迁移期引文——旧档改名 · 列报 · 不入闸）✗ 现档 = `thincoder-vscode/src/tools/ide.mjs`，
  本批**档改名 `ide.mjs`** ✓ 实施轮已落）；`name: "context"` = IDE 快照，登记于 VSC 手写 `builtinTools:181`，且被核测试 `HOST_ONLY = ["ide","focus"]`（现行值——实施轮随改名已落）钉为「不得入核」）与新工具**同名撞车**。
  生产后果 = 请求体工具名重复（provider 逐字 400 `Tool names must be unique.`；机判面 = `thincoder-vscode/test/integration/host-shape-spawn.test.mjs:102-110`）⇒ **宿主工具改名为 `ide`**——**档改名**：
  `thincoder-vscode/src/tools/context.mjs`（迁移期引文——旧路径删除态）⇒ `thincoder-vscode/src/tools/ide.mjs`（自 `context.mjs` 改名 · 实测 **144** 行；行为面零改）。
  行为面零改：`readonly`、描述语义、`what` 参数、四段采集全不动；仅名字与引用面随改。
- **子代理面裁定（父侧裁令 D：须带可回查性论证）——裁定 = 不给（depth-0 only）**：
  1. **回查面事实**：depth-0 会话的记录面 = 槽文件（`session-slots.mjs` `slotPath(cwd, agent._slot)`）+ 记录存储（sidecar 段）——恒在盘上、从不压缩、可经 `read_history path=` 取回（`read-history.mjs:172-197`）。
  2. **子代理无回查通道**：`read_history` **depth-0 only**（`thincoder-core/agent/family-tools.mjs:141`/`:150-151` 实读——「subagents get their own throwaway history」）。
     子代理亦**不绑记录存储**（`bindRecordStore` 调用点全在 depth-0 会话路径：`thincoder-core/session.mjs:147` / `thincoder-core/session-lifecycle.mjs:134` / `cmd-new.mjs:20` / ACP handlers——子代理链无绑定）。
     ⇒ 子代理的 `_fullHistory` 是**内存一次性**，settle 后其被压掉的中段**无面可达**（父只拿到子代理的最终报告；轨迹档默认关，非取回面）。
  3. **结论**：若给子代理 `compact` / `prune`，「压掉的可取回」在本面**承诺不了**——与本批「记录面不死」硬边界（及裁令 A 的可回查锚）冲突。故 `context` **不入 depth>0 任何角色**（`depthOnly` 段 = 结构性不可达，与 `read_history` 同款 fail-closed）；depth>0 的上下文治理仍由**既有阈值自动压缩**承担（语义零改——其本身也是「压掉即不可回查」，本批不改变既有事实，只是**不新增**一条模型可主动触发的不可回查路径）。
  4. **代价与替代**：子代理失去 stats / prune（其探索面工具输出确有可压量）——替代 = 父侧按需建/裁子代理任务粒度（既有惯例）+ 阈值面兜底；若将来给 depth>0 开回查面（父侧台账 #204 族另议），本裁定随之下修。

**6.16.7 可回查锚（父侧裁令 A · 用户 2026-09-21 20:11 批准）**

`compact` 回执**必须**给出「压掉的可一步取回」的锚——两分支逐字：

| 分支 | 判据 | 回执尾段（逐字形态） |
|---|---|---|
| 已绑定槽 | `agent._slot != null` **∧ `agent.cwd` 在场**（CLI：`saveSession`/恢复绑定后；粘性缓存 `thincoder-core/session.mjs:141`） | `Full record (never compacted): {slotPath(cwd, agent._slot)} — read it back with: read_history path="{同一路径}" (add keyword / since / role filters to target it).` |
| 未绑定 | `agent._slot == null` **或 `cwd` 缺省**（会话首次保存前 / VSC 端——面板 `_slot` 住 panel 不在 agent） | `Full record: this session's file is created on first save — list this project's sessions with: read_history path="cwd:{agent.cwd}", then copy the listed path into path= to query it.` |

- **接的既有单源**：取回面 = `read_history` 的 `path=` 参数（`read-history.mjs:172-197` 单文件深查 + `:202-219` `cwd:` 发现面）——本工具**不新建**取回通道，只把「全史所在」补进回执（现尾注「full text is in the session file」不给路径 ⇒ 不可行动；本面补此闭环）。
- **边界**：不写盘 / 不改会话档 / 不代模型取回——回执只给坐标与调用形。
- **VSC 端差（登记）**：面板槽位不在 agent 上 ⇒ VSC 端走「未绑定」分支（`cwd:` 发现面 = 等效取回面，父侧裁令明文允许）；若将来把 `panel._slot` 绑到 agent（如 `agent._slot = panel._slot`），该端自动升级为直接路径——**非本批前提**。
- **`cwd` 缺省态（登记 · 降级形）**：`_slot` 在场而 `cwd` 缺省 ⇒ 落**未绑定分支**（判据 = 上表合取），`cwd` 字面取 `undefined`（回执形 `read_history path="cwd:undefined"`）——工具内**不抛**（fail-soft 守卫 = `thincoder-core/agent-tools/context.mjs:107`）。
  该态在两端生产链**不可达**（建链面恒带 `cwd`：CLI `thincoder-cli/src/cli/make-agent.mjs:112-118`；VSC `thincoder-vscode/src/agent/setup.mjs:322-324` 每轮重指 `agent.cwd`），仅直调 / 退化夹具可达 ⇒ 不另设分支、不改形（登记入降级面）。

**6.16.8 模块拆分与行数预算（`context.mjs` 495 行 —— 越限在即，硬限 500）**

- **新档 `thincoder-core/token-window.mjs`**（**已落** · 实测 188 行 = 迁入 110 + 新增族 ≈78）：自 `context.mjs` **逐字迁出**计量 / 窗口 / 边界族，**迁出 = 110 行**（三区间逐段可核算）：
  ① 计量面 `:17-36`（20 行——IMAGE_TOKEN_ESTIMATE + `estimateTokens`）；
  ② 尾族 `:38-59`（22 行——KEEP_HEAD 头注 + `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE` / `TAIL_FLOOR_MESSAGES` + `keepTailSize` + `tailBudgetTokens`）；
  ③ 切分与配对修复族 `:95-162`（68 行——`splitHistory` 头注 + `splitHistory` + `repairedTailStart` + `tightenTailByBudget`）——三区间和 = 20 + 22 + 68 = **110**（`wc -l` 语义 · as-of 2026-09-21 实读）。
  **新增族 ≈65**：上下文用量单源函数（6.16.4）· 陈旧工具输出合格集（6.16.3——含门槛常量 `PRUNE_MIN_TOKENS`，与合格集同住本档）· 状态行百分比（与状态行同式）。**零 import 环 / 零回指**（只依赖 `provider/rate.mjs` 与 `config.mjs`——`context.mjs` 单向消费）。
- **`context.mjs` 收缩后新增 ≈43 行**（分项：estimateTokens 再导出 1 · force / focus 接线 ≈6 · 焦点块构造 ≈8 · anchor 取值 ≈8 · `pruneStaleToolOutputs` 应用面（stub 文案 + 原位替换 + 回执）≈20）。
  ⇒ **核算式：495 − 110 + 43 ≈ 428 行**（净 ≈ **−67**；≤500 ✓；软线 300 之上 = 既有事实，非本批新增面）。**不拆则 ≈495 + 108（= 43 + 65）≈ 603 > 500 ⇒ 硬红**（`core-hygiene.test.mjs:145`）。
  estimateTokens 再导出保 **import 面**（`thincoder-cli/scripts/verify-compress.mjs:7`、`thincoder-vscode/test/context-percent-parity.test.mjs:20`、TUI 均经本档取；先例 = explore-distill 再导出）。
- **新档 `thincoder-core/agent-tools/context.mjs`**（**已落** · 实测 174 行）= 工具对象 + 三操作 + 轻推助手 + 注记文案；**新测试档 `thincoder-core/test/context-tool.test.mjs`**（**已落** · 实测 300 行 ≤300 软线）。

**6.16.9 受影响文件表（单一权威位 = 本批任务书）**

逐文件现况行数 / Δ / 尺寸档状态注 /「零改动」逐处核实 = **批次档 `docs/batches/2026-09-21-context-tool.md` §2**——本档不重复（D2；§6.15 曾因两处逐行重复出现读数分叉，本面取同一纪律）。

- **体量档（结构性结论，非读数副本）**：`thincoder-core/context.mjs`（现况 495）——本批**必须拆分**（6.16.8；不拆则 ≈495 + 108 ≈ 603 > 500 硬限——`thincoder-core/test/core-hygiene.test.mjs:136` 硬限用例 · `:145` `>500` 断言 硬红）。
  `thincoder-core/token-window.mjs`（**已落**）、`thincoder-core/agent-tools/context.mjs`（**已落**）与新测试档均落 ≤300 软线内；其余改动档（含 >300 软线档 `agent.mjs` 与 VSC `run-stages.mjs`）的逐档档位与拆分立场 = 批档 §2.2「尺寸档」句（单一权威位——本档不复制读数，D2）。
- **CLI 侧零代码改动**（核装配面自动生效）；未新增 `tool-docs/` 档（24 档族计数零动）。
- **不触面**：`docs/core/requirements/**`（需求档 = 主 agent 笔）· `docs/TODO.md` / 台账（主 agent 笔）· 提示词档（`prompts/**`、`tool-docs/**` 内容权 = 主 agent）· 版本号 / 发布面。

**6.16.10 用例表（判定句 ①–⑤ + 裁令 A/D 逐条落用例）**

| # | 用例 | 输入 | 期望（机判形） | 对位 |
|---|---|---|---|---|
| S1 | stats 实测口径 | agent 夹具（`_lastPromptTokens` + `_usageAtLen` + `_ctxBasis` 在场） | 首行 total = `_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`（复算等值）；`basis: measured`；三段数之和 = 复算 | F-CC1 |
| S2 | stats 估算口径 | 同上但基线为 null | `basis: estimated`；total = `estimateTokens(history) + system + tools`（`contextUsage` 复算等值） | F-CC1 |
| S3 | stats 状态行单源 | 同一夹具 | 第 4 行 pct = `historyPercent(history, provider)` = CLI 公式复算值（`Math.round(estimateTokens(history)/providerSpec(provider).context*100)`） | F-CC1 |
| S4 | stats 空历史 / 无 `_ctxBasis` | `history: []`；无暂存 | 不抛；总数为 overhead；threshold 走 `resolveCompactThreshold` 兜底 | F-CC1 边界 |
| P1 | prune 正常 | 保护尾外 12 条大 tool 输出（≥200 tok/条） | 12 条 content 变 stub；`estimateTokens(history)` 下降；回执计数 = 12；数组引用 / 长度 / 各 `tool_call_id` 索引全等 | 判定③ |
| P2 | prune 配对守恒 | 同上 | 每个 `role:"tool"` 消息仍有其 owner（assistant `tool_calls` id 集合覆盖不变）；无新孤儿 | 边界③ |
| P3 | prune 记录面不变 | 同上 | `_fullHistory` 深等（引用 + 内容）；人读线投影零改 | 判定③ |
| P4 | prune 边界 | 保护尾内 / <200 tok / 非 tool / 短历史（无中段） | 零改动、回执 0；`_lastPromptTokens` 不变（未发生 prune 不失效） | 边界 |
| P5 | prune 基线失效 | 发生 prune | `_lastPromptTokens === null ∧ _usageAtLen === null` | 机制 |
| C1 | compact 排队（回合中途不执行） | `context{action:'compact',focus:'…'}` | 返回即：`_pendingCompact.focus` 置位 ∧ `agent.history` 逐位深等 ∧ 零 LLM 调用（fetch 桩零请求） | F-CC2 核心 |
| C2 | compact 安全点落地 | 紧接 C1 推一条工具结果 → 调 `runCompactionCheck` | fetch 桩收到 `stage:"compress"` 一次；请求末条 = `SUMMARIZE_PROMPT + focus 块 + anchor 块`；历史 = 注记 + 占位 + tail | F-CC2 |
| C3 | focus 相斥可断言 | 同一夹具 × 两条相斥 focus | 两请求体互不相同 ∧ 各含其 focus 文本；真机摘要聚焦词计数差额（**非门禁**） | 判定① |
| C4 | anchor 自动附 | `agent.tasks`（含 in_progress）+ `agent.goal` 在场 | anchor 块含 `- [in_progress] <title>` 与 goal `objective`/`criteria`；两者皆空 ⇒ anchor 段省略（focus 正文恒保留；不产空标题） | F-CC2 明文 |
| C5 | 阈值面互斥 / 承接 | ① 强制成功；② 强制无可压 + tokens > threshold | ① 本轮阈值调用不发生（桩计次）；② 强制返 false 后阈值调用**发生**（承接） | 6.16.2 |
| C6 | 单槽覆盖 | 同回合连调 `compact` 两次 | 回执第二次明示替换；安全点只消费一次（一次压缩） | F-CC2 边界 |
| C7 | no-op 注记 | 短历史 + `compact` | 落一行 no-op 注记（`transient: true`）∧ 历史其余零改 | 回执面 |
| C8 | 失败注记 + 失败链 | 摘要桩抛错（1 次） | `_compressFailures = 1` ∧ 失败注记一行（`attempt 1 of 3`）∧ 历史未变；第 3 次 ⇒ `compressFallback` 既有行为 | 失败路径复用 |
| C9 | AbortError 透传 | 摘要桩抛 AbortError | `runCompactionCheck` 抛 AbortError ∧ **不落注记** | 失败面 |
| C10 | focus 必填 fail-closed | `compact` 无 focus / 空白 | 回执 `Error: …` ∧ `_pendingCompact` 仍为空（不排队） | F-CC5 边界 |
| C11 | 回查锚（A·已绑定） | `agent._slot = 7` + `cwd` 夹具 | 回执含 `slotPath(cwd, 7)` 逐字 ∧ `read_history path="…"` 调用形；该路径文件可被 `read_history` 建索引（`existsSync` / 深查返回非 error） | 裁令 A |
| C12 | 回查锚（A·未绑定） | `agent._slot = null` | 回执含 `cwd:<cwd>` 取回形 ∧ 不含 `slotPath` 形 | 裁令 A |
| C13 | 记录面不死（压缩后） | 走完 C2 | `_fullHistory` 深等 ∧ 会话档字段零改；`read_history` 默认查询仍取全量 | 判定② |
| N1 | 轻推恰一次 | 调 `taskTool.execute` 两次（不同 items） | 机器行内该前缀行**恒 1 行**（第二次替换）；内容含当前 anchor | 判定④ |
| N2 | 轻推触发面 | `goal{action:'set'/'complete'/'blocked'/'cancel'}` | 每分支后恒 1 行（同上） | 判定④ |
| N3 | 零调用零副作用 | 不调 task / goal 的夹具 | 全史零该前缀行 | 判定④ |
| N4 | 深度门 | `ctx.depth = 1` 调 task | 零轻推行 | 裁令 D |
| R1 | 注册单源（core） | `assembleFamilyTools({depth:0})` / `{depth:1, role:'explore'}` | depth-0 含 `context` **恰一次**；depth>0 各角色零含（含 consult） | 判定⑤ / 裁令 D |
| R2 | 双端表（VSC） | `hydrateRun` 生产形状 | `toolByName.has("context")` ∧ 表内名唯一（宿主工具已名 `ide`）∧ `context` 唯一来源 = 核家族段 | 判定⑤ |
| R3 | 三操作可达 | schema + 逐 action 调用 | enum = `["stats","prune","compact"]` 三项 ∧ 各返回确定回执（无 `unknown action`） | 判定⑤ |
| R4 | 零回归 | `assembleBuiltinTools` 名集 / `tool-docs` 计数 / `compress-form.test.mjs` / `compaction-echo.test.mjs` | 名集 = 24+8 不变；`tool-docs` 24 档不变；两既有测试档全绿（无 focus ⇒ 请求体逐字节不退） | 边界 |

**6.16.11 边界（本面不改）与退化面**

- **边界**：阈值自动压缩语义 / 触发线（0.6）/ 阈值解析（`resolveCompactThreshold`）**零改**；记录面（`read_history` / 人读线 / 会话档双字段）零改；不做自动压缩、不做自动方向检测（轻推 = 一行建议，压缩决策恒在模型）。
  不新增用户侧命令；不新增配置键（门槛常量等为设计常量）；子代理面不给（6.16.6）；`read_history` 本体零改（裁令 A 只借其既有 `path=` 面；台账 #204 族另议）。
  `SUMMARIZE_PROMPT` 文本零改（只追加焦点块）；VSC 面板 / webview 零改（压缩可见面复用既有四态）。
- **退化面**：① 无 `_ctxBasis`（直驱 / 测试）⇒ stats 阈值走 `resolveCompactThreshold` 兜底；② `extras.systemPrompt` / `extras.tools` 缺省（直调压缩）⇒ 焦点块仍生效、前缀复用退化（既有退化面 1）。
  ③ `agent._slot` 无 **或 `cwd` 缺省** ⇒ 锚走 `cwd:` 形（6.16.7——含字面 `cwd:undefined` 的降级态）；④ 摘要连续失败 ⇒ 既有三连败降级（模型面另见失败注记）；⑤ 未绑定记录存储（模式 F）⇒ 人读线仍全量，回查锚不变。
  ⑥ 宿主工具改名 ⇒ 端侧旧名引用（描述测试死常量 / AGENTS.md / README）属文档面残留，实施轮随改（受影响表见批次档 §2）。

**6.16.12 发布关联**

无（随下一代发版列车；**发布动作 = 用户门**）。

**载体指针**：本批任务书（用例 S1–R4 · AC1–AC9）＝ 批次档 `docs/batches/2026-09-21-context-tool.md` §2——本档不重复（D2）。

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

| D-CC22 | 活体推入面回声恒带：`required` 族的**工具轮** assistant 消息恒带 `reasoning_content`（本轮无推理 ⇒ **空串**）——核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`），**主循环 / advisor 循环 / VSC 端壳自有循环（`thincoder-vscode/src/agent.mjs:387-397`）三站点共用** | 与 D-CC18 / D-CC19 **同判据**（required 族机读线不得缺该字段）的**第三面**：前两者治压缩注入 / 恢复读取，本面治**活体推入**（前两者不覆盖）。真机实证（2026-09-20 · deepseek-flash · 带 `tools` · 同形历史三连）：带空串 **200**（服务端仍回 `reasoning`）· 缺字段 **200** 但 `reasoning` 帧 = **0** · 带真值 **200** ⇒ 空串合法，且缺字段轮服务端不再回推理（与 `advisor/loop.mjs:199-204` 自述同向，n=1）。**形状限定（2026-09-20 · 实现轮 184 探针 · 批次档 §2.11 ①）**：上列读数为**设计轮形状（请求尾 = user）**；**活体形状（尾 = tool）**实测 = 空串 / 真值 **200** · 缺字段 **400**（`must be passed back`）· kimi 三形态全 **200**（mimo 不可证）。**否决**：① 维持条件式省略（族内形态不齐 + 症状持续）② 伪造 / 借用别轮推理文本（污染 + 与「回声 = 服务端原文」语义冲突——承 D-CC18 否决③）③ 改 provider 序列化面统一补字段（跨族越权：glm / optional 族行为将改）④ 落点选 `context.mjs`（该档 496 行 + Δ 越 **500 硬限**——`core-hygiene` 硬红）⑤ 各推入点内联同式（多构造点——违 D2 单源） |

| D-CC23 | `context` 单工具三操作（stats / prune / compact），落**家族登记册**（`agent-tools.mjs`）+ `family-tools.mjs` **depth-0 段** | 用户 2026-09-21 20:03 定形（原话级「收在一个 `context` 工具里 ✗ 用操作区分」）。**落家族段而非 `tools/` 静态表**：VSC 不消费 `assembleBuiltinTools`（手写 30 项表）——家族段两端同调核单源 ⇒ **双端一致零端侧重复**（先例教训 = `2026-09-15-vsc-tool-table-dup`）；内联 description（**不新增 tool-docs 档**）⇒ 24 档族计数零动。**否决**：① `tools/` 静态表落点（VSC 须手加两条 = 重复面复活）② 三工具分开（违用户定形）③ 扩既有工具（`read_history` 是查询面，语义不可混）④ 新增 tool-doc 档（触发 24→25 计数链 ~17 处文档面 + 4 处测试断言，零收益） |
| D-CC24 | 模型发起压缩 = **排队 + 下一安全点落**（`agent._pendingCompact` 单槽），**不回合中途执行**；阈值面**排队承接**、同安全点至多一次压缩；`force` 只跳过阈值早退 | 回合中途执行须重建 `agent.history`——核循环逐处重读（安全），但 **VSC 主循环持共享数组**（`thincoder-vscode/src/agent.mjs:106` 局部 `history` + `checkAndCompact:203-207` 原位回收）⇒ 工具内换数组会令同批 tool 结果落进陈旧数组（孤儿 `tool_call_id` / 结果丢失）。排队落点 = 既有安全点（工具结果落盘后、下一 `chat()` 前——`thincoder-core/agent.mjs:231-236`）⇒ 本批 tool 结果配对完整，且**复用**既有检查点 / 面板 / 失败链 / 双端回收逻辑。**否决**：① 工具内同步压缩（VSC 共享数组契约破 + 同批其余工具等待摘要 30s）② 立即压缩但强制把在飞 assistant 拉进 tail（核可、端不可；两实现分叉）③ 等到回合尾才压（回合尾可能不再回模型——安全点已足够近）④ 阈值⊓请求才压（用户目标 = 阈值之外的自选时点，交集合 = 罕见） |
| D-CC25 | prune = **保结构换内容**（`history[i] = { ...m, content: stub }` 原位）+ 合格集 = 保护尾外 ∧ `role:"tool"` ∧ ≥200 tok；记录面不变；基线失效；**无 target 参数** | 配对安全**结构上不可能被拆**（数组引用 / 长度 / 索引 / `tool_call_id` 全不变——不设 owner 拉回逻辑）。合格边界**复用** `splitHistory` 的 `tailStart`（=「压缩会摘要掉的那段」）⇒ 不新增第二处切割判据。原位换对象满足 VSC 共享数组契约（vs `shrinkOversized` 的换数组——那是安全点外调用）。基线失效同 `shrinkOversized` 先例。**否决**：① 整对删除（连 assistant 文本 / 推理一起丢——损失面大于收益）② 按 id 指定目标（模型需自记账 id，无用例支撑）③ 无门槛（stub 比短输出长——净增）④ 摘要式清理（= 压缩面，语义正交才是本操作的价值） |
| D-CC26 | VSC 宿主工具 `context`（IDE 快照）**改名 `ide`**，让出 `context` 名给核心新工具 | 同名撞车 ⇒ provider 逐字 400（`Tool names must be unique.`——`host-shape-spawn.test.mjs:102-110` 机判面）+ `toolByName` Map 后写覆盖。用户定形名（F-CC5）= `context`，不可改 ⇒ 让名方必为宿主工具。行为面零改（名字 + 引用面）。**否决**：① 新工具改名（违用户原话级定形）② 合并语义（IDE 快照 = 宿主能力，与上下文治理不同职责；且核工具须跨端）③ 只在 CLI 注册（违「双端一致」判定⑤） |
| D-CC27 | `compact` 回执带**可回查锚**：`agent._slot` 在场 ⇒ 逐字给出槽文件路径 + `read_history path="…"` 调用形；否则给 `cwd:` 发现面（等效取回） | 父侧裁令 A（用户 2026-09-21 20:11 批准）。现尾注「full text is in the session file」不给路径 ⇒ 不可行动；取回通道**复用** `read_history` 既有 `path=`（不新建通道）。VSC 面板槽位不在 agent 上 ⇒ 该端走等效面（已登记的端差；将来绑 `panel._slot` 即自动升级）。**否决**：① 只给「会话档」模糊指称（不可行动 = 本裁定要修的缺口）② 由工具代取回 / 内联全文（越权 + 上下文膨胀）③ VSC 端本批强接槽位（面板→agent 管道 = 新接线面，非本批前提，收益低） |
| D-CC28 | **子代理面 = 不给**（`context` 入 `depthOnly` 段，depth>0 结构性不可达） | 裁令 D（须带可回查性论证）：depth>0 **无回查面**——`read_history` depth-0 only（`family-tools.mjs:141/150-151`）+ 不绑记录存储（`bindRecordStore` 调用点全在 depth-0 会话路径）+ 不落会话档 ⇒ 被压中段 settle 后无面可达。给 = 新增一条**不可回查**的模型可触发路径，与「记录面不死」（判令②）及裁令 A 的承诺冲突。depth>0 仍由既有阈值压缩治理（本批不改变既有事实）。代价（子代理失 stats/prune）登记，替代 = 任务粒度 + 阈值兜底。**否决**：① 全深度给（承诺不了可回查）② 给 stats/prune 不给 compact（prune 同样是不可回查的删——半给仍违口径；且须两套装配面）③ 给但回执声明「子代理面不可回查」（把缺陷写进提示词 = 教模型接受损失） |

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

- 2026-09-22（**structure-debt 批 · 档面车道（#163 尾账）· eng-designer**——承 `docs/batches/2026-09-22-structure-debt.md` §2.4）：
  §6.13 webview 压缩状态四态**落点改指**（`webview/chat.js showCompressStatus` → **`webview/chat-status.js showCompressStatus`**——#163 拆分后状态显示族迁出；调用链 `compress` 消息消费位 = `chat-messages.js`）。**零语义**：四态形态 / 触发 / 静默纪律零变。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮（上抛处置）· eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #225）：规范面修订式标记清理（上抛 2 处）——结论①「作废 · 实施轮受控实测推翻」转裁定语「（2026-09-18 裁定）」；分区结论条去「v1 决定随之作废（下节收正）」尸语（无裁定锚 ⇒ 整删）。**语义零改**。

- 2026-09-22（**hygiene-sweep 批 · 文档卫生轮 · eng-designer**——承 `docs/batches/2026-09-22-hygiene-sweep.md` §2 · 台账 #225）：规范面修订式标记清理——摘要输入域条去「旧「模型所见内容面无变化」句作废」尸语（留现状陈述）。**语义零改**。


- 2026-09-22（**pending-triage 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-22-pending-triage.md` §1「#56 认账」裁）：压缩侧两则派生差（百炼 qwen 族 / autoThink turn-0 窗口）**认账登记**——压缩侧不设思考（需求 N1 字面）；机制条文零改。

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #162–#164）；**语义零改**，行号沿用原编号。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §6 **机制面**（术语与双线 / 触发 / token 判定 / 切割四约束 / 降级链 / 回注与双线 / 文案与静默 / 压缩面板 / 摘要 ≤1K 与探索摘要 / 行为契约 / parity / 实现位置）· §7 **关键决策（D-CC1–16）** · §8 **不并项与历史沿革**；
  来源 = `thincoder-cli/docs/design/CONTEXT-COMPACTION.md`（**旧档一字未改**——原地作参照历史）；需求侧已并入本层 `docs/core/requirements/CONTEXT-COMPACTION.md`；首部加机制面指针一行。
- 2026-09-15（**VSC 轮并入 · 批 7**）：§6.13 新增 **VS Code 端接线面**（判定点封装 / 基线记录 / 预算端差 /
REVERSE 保护坐标 / 摘要段形状 / 边界重置 2 / webview 四态 / 失败可见化 / 非压缩职责边界）· §7 补 **D-CC17** ·
§8.2 补 1 行不并项登记；来源 = `thincoder-vscode/docs/design/CONTEXT-COMPACTION.md`（**旧档一字未改**）；
坐标按现状实核（`thincoder-vscode/src/compact.mjs:31,115,323,367`——该档 **W6 已删**、现体 `thincoder-core/context.mjs` · `thincoder-vscode/src/extension/panel-callbacks.mjs:144-152` · `thincoder-vscode/src/agent/setup-reminders.mjs:145,163,194`）。 （迁移期引文）
- 2026-09-15（**W6 迁核收正 · VSC 壳代码接线批**）：§6.13 按 W6 现状收正（判定点封装改指核 `compressIfNeeded` / `compressFallback` ·
  阈值档位经核 `resolveCompactThreshold` · 端差适配（`provider` / `tasks` / `planMode` 调用期同指 + 共享数组回收）· 预算端差退场 ·
  REVERSE 保护退场（回植候选记核内笔）· webview 四态现状登记 · 摘要段形状取核）· §6.12 实现位置 VSC 列改指核面 ·
  §6.11 REVERSE 差异注收正 · §6.4④ 预算常量端差注收正 · §1 归属表补迁核注（旧档 `thincoder-vscode/src/compact.mjs` **已删**、现体 `thincoder-core/context.mjs`）。 （迁移期引文）
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
- 2026-09-20（**thinking 回传缺口批 · 实现轮探针证据收正 · eng-designer**——承批次档 §2.11 ①）：§6.10 #9 与 §7 D-CC22 补**形状限定**（「缺字段 200」仅设计轮形状（尾 = user）成立；活体形状（尾 = tool）实测缺字段 **400**（`must be passed back`）· 空串 / 真值 200；kimi 三形态全 200；mimo 不可证）。机制条文与决策零改。
- 2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。
- 2026-09-21（**context-tool 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-21-context-tool.md` §1 · 台账 #18 · 需求档 §2.1 F-CC1–F-CC5）：新增 **§6.16 模型主动整理上下文（`context` 工具）**
  （工具形态逐字 / 压缩接线：排队 + 安全点 + 阈值面承接 / prune 语义 / stats 单源 / 轻推 / 装配面 + 子代理裁定 / 可回查锚 / 模块拆分与行数预算 / 用例表 S1–R4 / 边界与退化面）· §7 新增 **D-CC23–D-CC28**。
  依据 = 核与两端实读坐标（压缩模块现况 495 行越限在即 / **VSC 宿主工具 `context` 名冲突**（`thincoder-vscode/src/tools/context.mjs:22`（迁移期引文——旧档改名 · 列报 · 不入闸））/ VSC 主循环共享数组契约 / 子代理无回查面）+ 父侧裁令 A·D（用户 2026-09-21 20:11 批准）。
- 2026-09-21（**context-tool 批 · 设计评审轮 1 收正 · eng-designer**——承 `docs/batches/2026-09-21-context-tool.md` §3 轮次 1：🟡5 · 🔵4）：§6.16.6 宿主工具让名统一为**档改名读法**（`ide.mjs` = 改名 · 旧路径删除态 · 行为面零改）·
  §6.16.8 行数预算改**可核算式**（迁出 110 = `:17-36` 20 + `:38-59` 22 + `:95-162` 68 · 新增 ≈43 ⇒ 净 ≈ −67 ⇒ **≈428**；`token-window.mjs` ≈175 = 迁入 110 + 新增族 ≈65）·
  §6.16.3 门槛常量 `PRUNE_MIN_TOKENS` 单一落点（与合格集同住 `token-window.mjs`——零回指）· §6.16.2 / 用例 C4 焦点块省略范围写明 = **anchor 段**（focus 正文恒保留）·
  §6.16.9 体量档句改结构性结论 + 批档指针（>300 两档逐档档位以批档 §2.2 为单一权威）· §6.14 行数口径坐标收正（`core-hygiene.test.mjs:136` / `:141` / `:145`）· 载体指针计数对齐（用例 S1–R4 · AC1–AC9）。**零新语义**（评审发现逐号落位）。
- 2026-09-21（**context-tool 批 · 实施后微修轮 · eng-designer**——承 `docs/batches/2026-09-21-context-tool.md` §5 上抛 2–3 + 父侧裁定）：
  §6.16.2 补 **强制面第三去向**（`!split` ∧ `shrinkOversized` 命中 = 有损收缩已处理：不落 no-op 注记 / 不跑阈值面 + 等价性论证）· §6.16.4 补 **空历史口径**
  （`historyPercent([]) = 0`；端侧显示门保留分歧——不收正理由在册）· §6.16.7 判据补 `cwd` 在场条件 + `cwd` 缺省降级形（字面 `cwd:undefined` · fail-soft）· §6.16.11 退化面 ③ 同步。
  同轮收正 §6.16.6 引文标记形三处（标记串未命中机检闭枚举 ⇒ 悬空误报）+ 两条 >300 字符行宽（拆行）。**零代码改动**（判定 = 三条皆现状语义自洽）。

