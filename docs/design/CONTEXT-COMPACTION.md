# Context Compaction 统一规范（CLI / VS Code 一致落地）

> 状态：**已落地**（2026-08-03，两端实现 + 测试全绿）。本文档是规范基准，两端实现与验收口径以本文件为准。
> 范围：thincoder（CLI）与 thincoder-vscode 的上下文压缩语义统一。
> 原则：**一套语义，两端一致落地**；正确性优先于 token 节省（与双线历史同一总原则）。
> 本文档定义"应该长什么样"，不是现状记录——两端现状差异见各决策的"现状"行。

---

## 0. 术语

| 术语 | 含义 |
|---|---|
| 机读线 `history` | 送模型的上下文，压缩作用于此 |
| 人读线 `_fullHistory`/`fullHistory` | 永不压缩的完整记录（UI/resume 用） |
| prompt 估算 | system + tools schema + history（含注入）的 token 近似 |
| 安全点 | history 末尾消息 role ∈ {user, tool}（完整交换边界） |

---

## 1. 统一决策（D1–D10）

### D1 触发时机 —— 仅安全点

- 现状：CLI 仅 history 末尾为 user/tool 时检查；VS Code 每轮无条件。
- **统一**：仅安全点检查。
- 理由：压缩是结构性 splice（head + 摘要 + tail），在模型输出中途（assistant 半截）切会破坏 tool 配对语境；安全点检查零成本。

### D2 阈值 —— 显式优先，auto = context × 0.6

- 现状：CLI `spec.context × 0.6`（resolveCompactThreshold）；VS Code `× 0.8`。
- **统一**：显式 `config.agent.compactThreshold` 优先；否则 auto = `specForModel(model).context × 0.6`。
- 理由：0.6 为注入上下文（git/目录/outline/memory/文档，实测每轮 30–50K）+ 输出/reasoning（部分模型 maxOutput 384K）留余量；0.8 在 1M 窗口只剩 200K，刚压缩完可能又超。
- **判定对象统一**：完整 prompt 估算（system + tools + history）≥ threshold 即触发。
  - CLI 现状缺口：纯估算路径不含 system/tools（首轮/恢复后/压缩后会漏算约 10–40K）。
  - VS Code 已含 systemPrompt，需补 tools schema 估算。

### D3 token 判定 —— 实测优先 + 增量估算

- 现状：CLI `_lastPromptTokens`（上次 `usage.prompt_tokens` 实测）+ 自 `_usageAtLen` 起的增量估算；VS Code 纯字符估算。
- **统一**：实测优先（CLI 方案），两端同款：
  - 有实测：`_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`
  - 无实测（首轮/恢复后/压缩后）：`estimateTokens(history) + system/tools 估算`（见 D2）
  - 压缩成功 / 会话恢复 / 新 run 时基线失效（置 null）
- 估算公式统一（取 CLI 精细版）：
  - 文本：ASCII/4 + 非 ASCII/1
  - `reasoning_content`、`tool_calls` 参数计入
  - 图像：按 2000 token（取 VS Code 保守值；CLI 现值 256 偏低会延迟触发）
- 理由：估算对 CJK 系统性低估，纯估算可能永远不触发（CLI 实测过的教训）；实测值是完整上下文的真实成本。

### D4 tail 保留量 —— 窗口自适应

- 现状：CLI 固定 KEEP_TAIL=10；VS Code `max(10, ctx/100K×30)` 且 ≤ 40% 历史。
- **统一**：`keepTail = min(max(10, floor(context/100_000 × 30)), floor(len × 0.4))`。
- 理由：1M 窗口只留 10 条太薄，模型丢失近期工作上下文；40% 上限防小窗口保留过多导致"压缩了个寂寞"。

### D5 切割配对保护 —— 双侧

- 现状：CLI head（不以 tool_calls 结尾）+ tail（orphan tool 拉回 owner）；VS Code 仅 tail。
- **统一**：双侧保护（CLI 版 head 保护 + 两端版 tail 保护）。
- 理由：head 保护是 CLI 修过的真实 400 场景（并行工具结果被摘要吞掉）；VS Code 缺失是缺陷不是特性。

### D12 head 保留 —— 2026-08 决策：KEEP_HEAD = 0（无头部）

- 历史：`KEEP_HEAD = 2`（"保留最初意图"）——单任务会话的假设：最早消息 = 当前任务定义。
- **问题（用户反馈实证）**：多任务连续会话（同一会话连续做任务 A→B→C）中，最早消息是**已完成的旧任务**——压缩后原文保留在上下文中，模型注意力被旧事锚住（"AI 忽然转向以前的旧事"）。
- **决策**：`KEEP_HEAD = 0`——最早的 2 条并入中间段一起进摘要；摘要提示词增加"区分已完成 vs 进行中：已完成任务一行概述，细节预算花在未完成/当前任务"。压缩后上下文 = 摘要注记（第一条）+ 占位 + tail——锚点天然是当前任务（最近的 user 消息）。
- 影响：任何 ≥2 条的历史都能切出中间段（keepTail ≥ 0）——`shrinkOversized` 兜底只剩"单条巨型消息"场景（历史 1 条）。
- 协议安全：head 为空后 tool_calls 配对保护只剩 tail 侧（D5 后半）；中段消息序列化为文本（`[assistant][ called tools: …]`），不保留原始配对结构——无 orphan 风险。
- 人读线不变（双线历史 D10）：任何压缩丢失的原文仍可从 `_fullHistory` 恢复。

### D6 降级链 —— 三级（LLM → 截断 → 单消息截断）

- 现状：CLI 三级（LLM 摘要 → 连续 3 次失败 → 确定性截断 `compressFallback`；无 middle 可切 → `shrinkOversized` 单消息截断）；VS Code LLM 失败 → 同步启发式摘要。
- **统一**：CLI 三级模型：
  1. LLM 摘要（`thinking: null`，序列化 user 8000 / tool+assistant 2000 cap）
  2. 连续 `COMPRESS_FAILURE_LIMIT = 3` 次失败 → 确定性截断（FALLBACK_NOTE，丢 middle 不碰网络）
  3. 超阈值但无 middle 可切（历史 ≤13 条，单条巨型消息）→ 单消息截断（`shrinkOversized`：user/tool 体 8000 上限、keepHead 50%/keepTail 25%，不动 reasoning/tool_calls 结构）
- **废弃** VS Code 启发式摘要：`User:/Assistant:` 流水账对 agent 工作日志价值低，且与真实消息难以区分（模型会把"User:" 当真实输入）；确定性截断 + 明确 note 更诚实。
- 失败计数语义统一：**每次 runAgent（用户消息）开始时重置**（CLI 现状跨消息累计，改为一致、可预测）。

### D7 压缩后回注 —— task 去重 + plan + AUTO/permission

- 现状：CLI task 全量（先清旧回注去重）+ plan；AUTO 在调用方；VS Code task（pending 全量 + done 前 3）+ plan + AUTO/permission。
- **统一**：`task（去重：先滤掉历史中 TASK_REINJECT_PREFIX 旧注入，再注入 pending 全量 + done 最多 3）` + `plan mode` + `AUTO/permission`。
- 理由：done 只列 3 条省 token 且信息足够；去重保证单源真值（CLI 已实现，VS Code 补）。

### D8 压缩前 checkpoint —— 已移除

- 原设计：压缩前 git checkpoint + 注入引用（失败不阻塞）。
- **2026-08 决策：移除**（用户拍板）。理由：双线历史（机读 `history` + 人读 `_fullHistory`）已保证压缩后可恢复完整上下文（resume 走人读线）；压缩前快照白占磁盘。checkpoint 仅保留：模型手动调用、rewind 前 pre-rewind 快照、git 破坏命令 guard 快照。

### D9 压缩过程文案与形状 —— 统一

- 摘要调用 `thinking: null` / `reasoningEffort: null`（纯文本任务不烧推理 token）
- 占位回复固定 `"Understood. I'll continue from these notes, re-verifying anything transient."`
- COMPACTION_PREFIX 文案两端已一致（`[Context was automatically compacted…]`），保持不变
- 序列化格式一致：`[role][ called tools: …] content`

### D10 双线 —— 既有共识，不变

- CLI：`pushReal` 源头双写；压缩只动机读线。
- VS Code：调用方经 `opts.history`/`opts.fullHistory` 传入；`compactHistory` 只处理机读线。
- 会话持久化：CLI `saveSession` 写 `history`+`contextHistory`、`applySession` 机读线从 `contextHistory` 恢复；VS Code `saveMessages(msgDir, name, messages, contextHistory)` 双字段。保持不变。

### D11 压缩过程对前端静默

- 问题：CLI 摘要调用把 `callbacks.onToken`/`onReasoning` 透传给摘要 LLM（`context.mjs`），导致摘要生成过程像正常回复一样流式显示在对话区（`ensureAssistantLabel` + streaming 渲染）——用户看到一段非回复的陌生文本。VS Code 无此问题（摘要不接流式回调；面板只渲染人读线，压缩 note 是机读注入）。
- **统一**：摘要调用**不传** `onToken`/`onReasoning`（前端对压缩过程静默）。压缩发生只通过既有状态提示告知用户：
  - CLI：`agent-turn.mjs` 的 `onCompress` 回调（`"[context] Context too long, auto-compacted…"`）
  - VS Code：压缩后回注/状态提示（若有）
- 恢复渲染（CLI `startup.mjs` / VS Code `_loadSession`）读人读线，压缩 note 不在其中，天然不显示——无需改动。

---

## 2. 关联一致性项（随本任务一并落地）

### E1 empty-response 自动重试（IK60QP 同步）

- CLI 已落地：`MAX_EMPTY_RETRIES = 2`，空响应注入 `[System reminder: your last response was empty…]` 重试，仍空才抛错；预算 `agent._emptyRetries` 每次 runAgent 重置。
- VS Code 现状：`agent.mjs` 空响应直接 throw（`LLM returned empty response.`）——**移植 CLI 语义**。

---

## 3. 两端落地清单

### thincoder（CLI）

| # | 改动 | 位置 |
|---|---|---|
| C1 | tail 固定 10 → 自适应公式（D4） | `src/context.mjs` `splitHistory`/`compressIfNeeded`（需经 `agent.provider.model` → `specForModel` 取 context；注意 config.mjs 无反向依赖，可安全 import） |
| C2 | 纯估算路径含 system/tools（D2） | `src/context.mjs`：`compressIfNeeded` 增加 system/tools 估算参数（由 `agent.mjs` 传 systemPrompt 与 tools JSON 估算） |
| C3 | 失败计数每次 runAgent 重置（D6） | `src/agent.mjs` 非 resume 重置块加 `_compressFailures = 0` |
| C4 | 图像估算 256 → 2000（D3） | `src/context.mjs` `IMAGE_TOKEN_ESTIMATE` |
| C5 | 摘要调用去掉 onToken/onReasoning 透传（D11） | `src/context.mjs` `compressIfNeeded` 的 `chat()` 调用 |
| C6 | 测试：tail 自适应 / 估算含 system / 失败计数重置 / 摘要无流式 | `test/session-compaction.test.mjs` 或新测试 |

### thincoder-vscode

| # | 改动 | 位置 |
|---|---|---|
| V1 | 触发加安全点（D1）：history 末尾 role ∈ {user, tool} 才检查 | `src/agent.mjs` 主循环 |
| V2 | usage 实测基线（D3）：`_lastPromptTokens`/`_usageAtLen` 记录 + 压缩/新 run 失效 | `src/agent.mjs`（response.usage 处已有回调，补记录） |
| V3 | 阈值 0.8 → 0.6（D2） | `src/context.mjs` `THRESHOLD_FRACTION` |
| V4 | 估算公式对齐 CLI（D3）：ASCII/4 + 非 ASCII/1、reasoning/tool_calls 计入、图像 2000、system+tools 计入 | `src/context.mjs` `estimateTokens` + `compactHistory` |
| V5 | head 配对保护（D5） | `src/context.mjs` `compactHistory` 切割前 |
| V6 | 降级链：LLM 失败计数（3 次）→ 确定性截断；无 middle → 单消息截断；废弃启发式摘要（D6） | `src/context.mjs`；失败计数状态由调用方（agent.mjs）持有传入，runAgent 内跨 turn 存活 |
| V7 | task 回注去重（D7） | `src/agent.mjs` 压缩后回注处 |
| V8 | empty-response 重试移植（E1） | `src/agent.mjs` |
| V9 | 测试：配对保护 / 降级链 / 阈值 / 基线 | `test/`（既有 compactHistory 测试扩展） |

---

## 4. 行为契约（验收口径）

统一后，两端在相同输入下应满足：

1. 仅当 history 末尾为 user/tool 且完整 prompt 估算 ≥ threshold 时触发压缩。
2. 压缩结果 = 摘要 note + "Understood" 占位 + tail（tail 按 D4 自适应；**KEEP_HEAD=0，无头部**——最早消息进摘要），任意切割不产生孤儿 tool_calls/tool 消息。
3. 摘要失败：连续 3 次（每次 runAgent 重置计数）后确定性截断；历史过短时单消息截断。
4. 压缩后：task（去重、pending 全量 + done≤3）、plan、AUTO/permission 回注齐全；实测基线失效。
5. 人读线全程不动；落盘双字段（CLI contextHistory / VS Code contextHistory）。
6. 空响应：自动重试 2 次，仍空抛错。
## 5. 探索结果语义摘要 + 压缩保真（2026-08-23）

**需求**（用户报告「主 agent 历史质量差」，选 A+C；C=历史卫生，A=委托策略见 `AGENT-LOOP.md`）：

### 总体需求
机器线历史（`history`）在压缩阈值触发前就因内联探索逐步结果而膨胀；即便触发压缩，LLM 摘要也可能丢关键信号。在**每轮 runAgent 最终返回时**把本轮写入机器线的探索类结果蒸馏为语义摘要、并强化压缩保真，使机器线在任意时刻信号密集、可恢复。

### 功能性需求
- F1：当一轮内连续/成批的探索类工具结果（read/grep/ls/glob/code_search/doc_search/repo_outline）写入机器线后，在轮末被 LLM 蒸馏为语义摘要（发现了什么、在哪、关键结论），而非裸堆结果或机械截断。
- F2：压缩摘要（`SUMMARIZE_PROMPT`）在压缩时，除 D12 已有的「已完成 vs 进行中」外，显式新增保留：已改动文件清单、未决点/待办。
- F3：人读线 `_fullHistory`（落盘 `fullHistory`）保持全量不变；机器线 `history`（落盘 `contextHistory`）承载摘要后的信号密集形式。

### 非功能性需求
- N1：摘要质量优先，token 成本不作决策变量；摘要调用必须 `thinking:null` 且不接 onToken/onReasoning（对齐 D11）。
- N2：两端（CLI `context.mjs` + VS Code 对应 compact 模块）一致落地，两端 prompts byte-identical、有比对测试。
- N3：轮末摘要失败不得阻塞/影响 runAgent 返回（静默跳过，原始历史保留）。

**设计**：

**H1 回合结束探索摘要**（新函数 `summarizeRunExplorations(agent, callbacks, signal)`，两端同构，CLI 落 `context.mjs` / VS Code 落对应 compact 模块）：

1. **触发时机**：主 `runAgent` **最终返回前**（即 onComplete 前，非 advisor/verify 推回的 `continue` 点）。若本轮新增探索类工具结果 ≥ 3 条，触发一次 LLM 蒸馏。
2. **探索类工具集**：`read` / `grep` / `glob` / `ls` / `code_search` / `doc_search` / `repo_outline`（只读知识型；`execute` 会写文件、不计入探索类）。
3. **定位本轮新增**：记录 run 起点的 `agent.history.length`（新增 `agent._runStartHistoryLen`）；run 最终返回前对 `history.slice(起点)` 中「assistant(tool_calls)+tool 结果」按探索类配对识别本轮探索突发。
4. **蒸馏**：新增专用 `EXPLORE_SUMMARY_PROMPT`，静默调用（对齐 D11：`thinking:null`、不接 onToken/onReasoning），把该批探索结果蒸馏为语义摘要——**发现了什么 / 在哪 / 关键结论**。
5. **收缩**：在 `agent.history`（机器线）里把这批「assistant→tools」配对**整体替换**为一条 `user` 角色 `[Exploration summary]` note——**保留 assistant/tool 配对边界、不产生孤儿 tool_calls/tool**（仿照 `splitHistory` 的配对保护）；`agent._fullHistory` 保持全量不动。
6. **阈值/降级**：<3 条不摘要；LLM 摘要失败时**静默跳过**（不阻塞本轮返回、不丢历史——原始结果仍在）；与压缩各自独立、不抢阈值。

> **与 A（AGENT-LOOP §13 F2）的交互**：轮末摘要发生在编辑之后——「即将编辑而 read」的原始内容若在本轮内已被编辑消费则无需保留（编辑结果已在历史）；若跨轮到下一轮才编辑，摘要需足够支撑下一轮的精确编辑、必要时模型重读该文件。本设计选择轮末摘要、接受此权衡。

**H2 压缩保真**：`SUMMARIZE_PROMPT` 追加显式清单——① 已改动文件清单；② 未决点/待办（供压缩后恢复定位）；「已完成 vs 进行中」已在 D12 规定、不重复。

**测试**（实现前补全，两端各断言）：
- 构造一轮含 ≥3 条探索结果的 history，调 `summarizeRunExplorations`：断言机器线缩短为一条 `[Exploration summary]`、无孤儿 tool_calls/tool、`_fullHistory` 不变；<3 条不触发；LLM 失败静默跳过。
- `SUMMARIZE_PROMPT` 含「已改动文件清单」「未决点/待办」两新增清单；且两端 `SUMMARIZE_PROMPT` **均含 D12 的「COMPLETED vs IN-PROGRESS」句**（CLI 已有，VS Code 需补齐——实现时发现的 D12 移植缺口）；两端 prompts byte-identical；全量回归。

**受影响文件**：CLI `src/context.mjs`（`summarizeRunExplorations` + `EXPLORE_SUMMARY_PROMPT` + `SUMMARIZE_PROMPT` 追加清单）、CLI `src/agent.mjs`（run 结束 hook + `_runStartHistoryLen`）、两端测试、两端 `CHANGELOG.md`；VS Code 对应 `src/agent.mjs` + compact/history 模块。（`main.md` 由 AGENT-LOOP §13 改，不在此列）
