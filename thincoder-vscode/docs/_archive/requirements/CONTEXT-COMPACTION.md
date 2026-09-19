# 上下文压缩（CONTEXT-COMPACTION）— 需求（VSC 仓）

> 板块：上下文压缩与回注（VS Code 端实现）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`CONTEXT-COMPACTION（CLI 仓·需求）§8.1 / §9.2`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见本仓 `docs/design/CONTEXT-COMPACTION.md`（146 行——触发 / 阈值 / 切割 / 摘要 / 降级链 / 可见性逐节）；权威源（W6 已迁核——现体 `thincoder-core/context.mjs`；旧档 `src/compact.mjs` 已删）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

长会话上下文增长到接近模型窗口时，主循环在**安全点**自动压缩机器线历史（保关键信号、可恢复），
并让 VS Code 面板使用者**看得见压缩生命周期**——「在压缩，不是卡死」；压缩过程与结果可见、失败不静默。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-K1 | **安全点触发**：主循环每轮在 LLM 调用前检查——`history.at(-1)?.role` 为 `user` 或 `tool`（完整交换结尾）才调用判定；assistant 位永不作为压缩点。证据 = `src/agent.mjs:159-163` | 压缩点恒为完整交换结尾；发到一半的回复不被压缩（不断流） | 不在 assistant 中途压缩 |
| F-K2 | **阈值**：显式 `agent.compactThreshold` 优先；否则 auto = provider 窗口 × 0.6（`THRESHOLD_FRACTION = 0.60`——为注入与输出 / reasoning 留余量）。证据 = 旧档 `src/compact.mjs:18,53`（W6 已迁核——现体 `thincoder-core/context.mjs`；阈值经核 `resolveCompactThreshold`） | 显式阈值可覆写；清除键回 auto 推断；阈值以下不压缩（no-op） | 不设任意硬上限（窗口由 provider 规格决定） |
| F-K3 | **token 判定（实测优先 + 增量估算）**：基线 = 上次响应 `usage.prompt_tokens`（`_lastPromptTokens` / `_usageAtLen` 成对记录）；`total = 基线 + 追加消息增量估算`；无基线 = system + tools schema 开销 + 全量纯估算。证据 = `src/agent.mjs:259-260` · 旧档 `src/compact.mjs`（W6 已迁核——现体 `thincoder-core/context.mjs`） | `total < 阈值` → 返回空、不压缩；估算对 CJK 修正（非 ASCII/1）；图片按 2000/part 计 | 不做逐 token 精确计数（估算为设计口径） |
| F-K4 | **切割策略**：无 head（`KEEP_HEAD = 0`——旧任务不进保留）；tail 窗口自适应（`keepTailSize`——封顶 40% 历史）；配对保护（原判据 `callsGapAfter` / `reverseProtectTail`——发送历史不得含悬空 tool_calls / orphan tool）；tail 预算超限时 pair-safe 前移（原 `tailStartByBudget`——tool 位 / 倒序位不停）。证据 = 旧档 `src/compact.mjs:28,61,74,87,98`（W6 已迁核——现体 `thincoder-core/context.mjs`；本端无 REVERSE 判据） | 切割后零悬空 tool_calls / orphan tool（协议零 400）；短历史候选 <10 → no-op 零变化 | 不做固定 tail 窗口；不拆散工具对 |
| F-K5 | **摘要与回注**：摘要段形状 byte-exact（压缩 note + `<handoff_notes>` 包裹 + assistant 占位，均带压缩时刻 ts）；`SUMMARIZE_PROMPT` 目标 ≤1K tokens（NEVER cut 设计锚点 / UNRESOLVED）；压缩后回注 task 列表 / plan reminder / AUTO 提醒（先清旧注入防累积）。证据 = 旧档 `src/compact.mjs:115`（W6 已迁核——现体 `thincoder-core/context.mjs`；task / plan 回注 = 核 applyCompression、AUTO 面 = 本端 run-helpers）· 设计档 §5 | 摘要段含固定三元素；回注后 task / plan / 提醒在位且零重复 | 摘要正文永不进前端（静默纪律） |
| F-K6 | **降级链**：摘要 LLM 连续失败 3 次（`COMPRESS_FAILURE_LIMIT = 3`）→ 确定性截断（无 LLM，同形状）；无 middle 可切 → 单消息截断（user/tool body >8000 字符保结构）；空响应 → 重试（上限 2 次）。证据 = 旧档 `src/compact.mjs:31`（W6 已迁核——现体 `thincoder-core/context.mjs`）· `src/agent/run-stages.mjs:202` · 设计档 §6 | 连败 3 次 → fallback 形态与摘要同形状；截断保数组长度与协议结构 | 不做无限重试；fallback 不调用 LLM |
| F-K7 | **压缩可见性（本端）**：回调链 onCompressStart → onCompress / onCompressFail → webview `compress` 消息四态（start / done / fallback / failed）渲染至 `#compress-status` 状态行。证据 = `src/extension/panel-callbacks.mjs:144-152` · `webview/chat.js`（showCompressStatus） | 四态逐态文案在位；状态行单元素原地更新 | 仅生命周期可见——摘要正文不进前端 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-K1 | 失败不阻塞 | 压缩失败 / 降级不影响 runAgent 返回（fallback 兜底 + 失败可见化） | `src/agent/run-stages.mjs`（catch → console.error + onCompressFail） |
| N-K2 | 人读线不压 | 压缩只压机器线（`history`）；人读线记录 / 落盘语义保持全量（内存窗口表示归双线契约） | `SESSION（本仓·需求）` 双线契约；设计档 §5 |
| N-K3 | 协议安全 | 切割 / 截断永不产生悬空 tool_calls 或 orphan tool 结果（REVERSE 保护同源单一实现） | 旧档 `src/compact.mjs`（配对保护判据；W6 已迁核——现体 `thincoder-core/context.mjs`）；设计档 §4 |
| N-K4 | 可机判 | 压缩行为可由用例断言（触发 / 切割 / 降级 / 可见性）；快层全绿 | 用例面 = `CONTEXT-COMPACTION（本仓·设计）§7`（可见性接线）所指；见下注 |

> **机制实况注（发现即报）**：本仓 `test/` 对压缩面零专属用例（as-of 2026-09-12 全扫 `checkAndCompact|truncateFallback|shrinkOversized` 零命中）——
> 测试缺口如实登记；补测触发 = 该面下次被触碰。

## 4. 对位与端差登记（对位 = `CONTEXT-COMPACTION（CLI 仓·需求）§8.1 / §9.2`）

- 语义对位：安全点 / 阈值 / 估算 / 切割与配对保护 / 摘要与回注 / 降级链 / 可见性——逐条同源。
- 端差登记：本端呈现面 = webview 状态行四态（对端 = TUI 压缩面板）；两端提示词（`SUMMARIZE_PROMPT`）语义同源、各端原文自持。
- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
