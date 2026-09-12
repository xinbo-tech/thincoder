# VS Code 上下文压缩与回注（CONTEXT-COMPACTION）

> 板块：上下文压缩（VS Code 端实现）。状态：**当前态规格**（2026-09-08 由
> ARCHITECTURE §10 迁出并对照 `src/compact.mjs`/`src/agent/`（原
> `src/context.mjs` 亦在列——GIT-ASYNC L21 整文件删除后剔除）
> 核实写全——DOC-REORG-VSC 批 6）。
> 与 `CONTEXT-COMPACTION（CLI 仓·设计）` 同名对应同一"上下文压缩"机制板块——各端独立实
> 现，内容以本端代码为准（用户裁定：两端文档各自独立完整，不互指、不复制共享正
> 文）。本档只写 VSC 端真实接线；CLI 端 TUI 压缩面板等差异在此不表。
> 权威源（VS Code）：`src/compact.mjs`（压缩/降级全逻辑——
> compactHistory/truncateFallback/shrinkOversized/tailStartByBudget/REVERSE 配对保
> 护 + explore-distill 再导出）、`src/repomap.mjs`（repo_outline 工具）/`src/agent/
> setup-reminders.mjs`（非压缩职责：repo outline 按需工具 + git/editor 富注入——
> 原 `src/context.mjs` 载体已删，GIT-ASYNC L21）、`src/agent/run-stages.mjs`
> （checkAndCompact 判定点）、`src/agent.mjs`（主循环安全点调用）。
> 装配（VS Code）：`src/extension/panel-callbacks.mjs`（onCompressStart/onCompress/
> onCompressFail → webview `compress` 消息四态）、`webview/chat.js`（#compress-status
> 状态行渲染）、`src/explore-distill.mjs`（轮末蒸馏）。
> 关联：ARCHITECTURE.md（原 §10 源正文——ARCHITECTURE 2026-09-08 瘦身收官，源节已删）、SESSION.md（双线
> 历史/压缩落盘）、AGENT-LOOP.md（主循环调用点/安全点）、SEND-STALL-DISTILL-*
> （蒸馏专题）。

## 变更记录

- 2026-09-08：DOC-REORG-VSC 批 6——从 ARCHITECTURE §10 迁出正文，对照 VSC src/
  压缩模块（compact.mjs/context.mjs/run-stages.mjs/agent.mjs/panel-callbacks.mjs）
  核实实现细节写全本端独立文档。ARCHITECTURE §10 不删（留后续瘦身批）。压缩逻辑
  2026-08 拆至 compact.mjs、蒸馏拆至 explore-distill.mjs 的历史折叠为本记录。

---

## 1. 触发与安全点（agent.mjs）

- **仅安全点判定**：主循环每轮在 LLM 调用前检查——`history.at(-1)?.role` 为
  `user` 或 `tool`（完整交换结尾，非 assistant 中途）才调用 `checkAndCompact`
  （agent.mjs:148-151；CLI parity D1 语义）。assistant 位永不作为压缩点（发到一半
  的回复被压缩=断流）。
- **判定点封装**：2026-09-05 自 runAgent 按骨干—细节两层提取为模块函数
  `checkAndCompact(agent, ctx)`（run-stages.mjs）——循环骨架只留检查调用。

## 2. 阈值与模型上下文

- **显式优先**：`agent.compactThreshold`（config agent 设置）非空 → 以其为阈值；
  否则 **auto = providerSpec(provider).context × 0.6**（`THRESHOLD_FRACTION = 0.6`
  ——compact.mjs D2 语义，为注入与输出/reasoning 留余量）。panel 空串清除键 =
  读取侧 null = auto 推断（config-io.mjs）。
- **provider 级 context**：`providerSpec(provider).context` 决定窗口（PROVIDER
  §15 D-C3——无任意硬上限）。

## 3. token 判定——实测优先 + 增量估算（compact.mjs compactHistory）

- 基线 = 上次响应的 `usage.prompt_tokens`（agent.mjs:219 记录
  `agent._lastPromptTokens`，`:220` 记录对应 `history.length` 为
  `agent._usageAtLen`）。
- `total = lastPromptTokens + 追加消息增量估算`；无基线时 = system+tools schema 开
  销 + 全 history 纯估算（`tools` 参数把 system prompt + 工具 schema 计入——首
  轮/恢复场景无 baseline 会低估从而永不触发）。`total < threshold` → 返回 null 不
  压缩。
- 消息估算计入 reasoning_content + tool_calls + 图片（`IMAGE_TOKEN_ESTIMATE =
  2000`/part——legacy 256 低估实测成本）。纯估算按 ASCII/4 + 非 ASCII/1。

## 4. 切割策略：无 head + 自适应 tail + 配对保护

- **无 head（KEEP_HEAD = 0）**：多任务会话最早消息常是已完成旧任务——压缩后保留
  会把模型注意力锚死在陈旧工作上（D12）。一切进 tail 之前的内容全部进摘要。
- **tail 窗口**：`keepTailSize` = `max(10, ctx/100K × 30)`，并**封顶 40% 历史**
  （D4——替换旧固定 tail）。
- **配对保护（D5 + REVERSE）**：
  - **head 侧**：head 不以悬空 tool_calls 结尾——assistant 声明 tool_calls 则其
    tool 结果全留在 head。
  - **tail 侧**：切割点不得拆散 tool_calls 与结果——tail 首位为 tool 而 owner 在
    oldMessages 时把 owner 拉回 tail（防协议 400 orphan tool）。
  - **REVERSE 保护（2026-08-16 400 事故实证）**：VSC 历史流可产生 tool 结果在
    assistant 前的倒序形状——`callsGapAfter`（assistant 声明的 ids 未被其后**连
    续** tool 块全盖住）判据 + `reverseProtectTail` 前移覆盖。收紧判据 = REVERSE
    保护同源单一实现，CLI 端无此类别。
- **tail token 预算（tailStartByBudget）**：候选尾超 `ctx × 0.15`（再减
  `SUMMARY_SEGMENT_ESTIMATE = 1100` 的摘要段固定估算）→ pair-safe 前移 tailStart
  （tool 位 / 缺口 assistant 位不停——整对同切）；保底 10 条；短历史候选 <10 →
  no-op 零变化。

## 5. 摘要与回注

- **摘要段形状（byte-exact 锚——compact.mjs，原样含 `\n\n` 拼接）**：压缩 note +
  摘要包裹 + assistant 占位，均带压缩时刻 ts（SESSION D-S1）。原文案：
  `[Context was automatically compacted. Below is a summary of earlier work. Treat
  it as notes, not proof — trust its conclusions (don't redo what it reports as
  done) but re-verify transient state with tools. Check memory search for any
  missing decisions.]`，随后 `<handoff_notes>` / `</handoff_notes>` 标签包摘要；
  assistant 位 content = `Understood. I'll continue from these notes, re-verifying
  anything transient.`
- **摘要目标 ≤1K tokens**（D13 硬目标 + 砍价优先级）：已完成 recap 一行 → FILES
  CHANGED 注释 → 进行中叙述收紧 → **NEVER cut 设计锚点/UNRESOLVED**（SUMMARIZE_
  PROMPT 内建）。
- **回注（reinjectAfterCompaction——run-helpers.mjs）**：压缩后先清旧 task 注入
  （去重——task 列表是单一真相源，防累积过期）+ 重注当前 task 列表 + plan mode
  reminder + AUTO/permission reminder（`getAuto()` 读 live 标志位）。
- **蒸馏边界（_runStartHistoryLen）**：重建（rebuild）后机读线 SHRINK → 边界重置
  为 2（[head(空), 摘要, "Understood", …tail]——tail 起于 index 2）；shrinkOversized
  保持同长度（仅截 body）→ 边界不重置。轮末蒸馏与压缩共用该锚点（explore-distill）。

## 6. 降级链（compact.mjs / run-stages.mjs）

- **摘要 LLM 失败** → `_compressFailures` 计数，连续 3 次
  （`COMPRESS_FAILURE_LIMIT`）后 `truncateFallback` 确定性截断（无 LLM 调用，note
  + "Understood" 占位，同形状 → 边界重置 2）。
- **无 middle 可切**（history 太短但超阈值——typically 单个巨消息）→
  `shrinkOversized` 单消息截断：user/tool body >8000 字符截留 head/tail，保留
  reasoning/tool_calls 结构（无协议 400 风险）；保持数组长度不变。
- **空响应**（reasoning 耗尽/截断）→ 主循环注入 reminder 重试（上限 2 次，仍空才
  抛错）。
- 失败可见化（Q3）：run-stages.mjs catch → console.error + onCompressFail → webview
  渲染错误文本。

## 7. 压缩可见性（本端接线——AC6）

- **回调链**：compactHistory 摘要 LLM 调用**前**触发 `callbacks.onCompressStart
  ({ messages: oldMessages.length })`；完成后写 `agent._lastCompressInfo =
  { mode:"summary", tokensFreed, elapsedMs }` 由调用方 onCompress 透传（fallback
  路径 mode:"fallback" + tailMessages）；失败 onCompressFail(e)。
- **webview 四态**（panel-callbacks.mjs → postMessage `compress` 消息）：
  - `start` → 状态行 `Compressing context… (summarizing N messages)`
  - `done` → `Compressed: N tokens freed (Xs)`（tokensFreed/elapsedMs）
  - `fallback` → `Compression failed — fallback: truncated to N messages`（3 次连
    败后降级说明）
  - `failed` → `Compression failed: <error>`
- `webview/chat.js showCompressStatus` 更新 `#compress-status` 状态行（消息流内单
  元素原地更新；会话视图清除重建 replaceChildren）。仅生命周期可见——摘要正文永远
  不进前端（D11 静默纪律）。

## 8. 非压缩职责边界（原 context.mjs——GIT-ASYNC L21 整文件删除）

原 `src/context.mjs` 承载的非压缩职责已分迁，本档只管压缩与压缩后回注：

- repo outline：`src/repomap.mjs`（repoOutlineTool——按需工具，非回合自动注入）；
- git 富注入（branch/commits/uncommitted）：`src/agent/setup-reminders.mjs`
  collectGitContext/pushGitContext（async——GIT-ASYNC L21——见 SESSION.md §10）；
- editor/机器注入：`src/extension/editor-context.mjs` + setup-reminders pushInjections。

## 变更记录（GIT-ASYNC L21——2026-09-09）

- `src/context.mjs` 整文件删除（injectContext/findDocChunks/escapeXml +
  buildRepoOutline/parseImports/collectSourceFiles 全死代码）——本档 :4 对照源、
  权威源 :11 与 §8 边界改指现行载体（compact.mjs / repomap.mjs /
  setup-reminders.mjs / editor-context.mjs）。
