# 上下文压缩 · 标题 · 文本额度（CONTEXT-COMPACTION）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6）：机制 / 契约的实质描述 · 关键决策（§7）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 上下文压缩 | `thincoder-core/context.mjs` | `thincoder-core/context.mjs` |
| 会话标题 | `thincoder-core/generate-title.mjs` | `thincoder-vscode/src/extension/generate-title.mjs` |
| 文本额度 | `src/text-budget.mjs` | `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） |

## 2. 核模块裁决行

### 2.1 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 162 | `thincoder-core/context.mjs` | ② | 融合：取一侧（压缩触发 / 摘要 / 降级截断 / 尾部预算） | 分叉 ＝ 档名（context / compact）+ 目录；VSC 头注 20+ 处自述「CLI parity（CONTEXT-COMPACTION.md D2/D3/D4/D6）」⇒ 前提成立 | — | S1（建核补齐） |
| 163 | `thincoder-core/generate-title.mjs` ↔ `thincoder-vscode/src/extension/generate-title.mjs` | ② | 融合：取一侧 + 端差（CLI 仅 OpenAI 兼容 / VSC 三格式分派）按端注入 | 分叉 ＝ 目录 + 格式分派（CLI 头注自述「CLI is OpenAI-compatible ONLY」）；会话标题语义同 ⇒ 前提成立 | — | S1（建核补齐） |
| 164 | `src/text-budget.mjs` ↔ `src/agent/run-helpers.mjs`（`safeSliceUTF16` 族） | ② | 融合：核内单一文本额度纯函数（头保 + 中段标记 + 尾保） | 分叉 ＝ 落点（CLI 独立档 / VSC 住 run-helpers）；计长口径（UTF-16 码元）两端同 ⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（三条均为同构融合，差异以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。

## 6. 机制面

> **交叉板不复制**：provider 级 context 覆盖的公式权威 → 本层 `PROVIDER.md` §6.15（不复制）。
> **勘察证据行**：查过 = 需求档 `docs/core/requirements/CONTEXT-COMPACTION.md`（F-CC1–F-CC8 / 边界——判据单源）∥ `docs/core/requirements/PROMPT-SYSTEM.md`（§2.3 行 9）∥ 设计树 `docs/core/design/PROMPT-SYSTEM.md`（§6.29 / §8.2）——相关。
> 独立公共文档仓 = 无（`PROJECT-MANIFEST.json:54` `publicRepos` = `[]`，实读）；外部一手源 = `api-docs.deepseek.com`（溢出论证，§6.2；其余渠道未逐族取证——登记面 = §6.2）。

### 6.1 术语与双线

| 术语 | 含义 |
|---|---|
| 机读线 `history` | 送模型的上下文——压缩作用于此 |
| 人读线 `_fullHistory` / `fullHistory` | 永不压缩的完整记录（UI / resume 用） |
| prompt 估算 | system + tools schema + history（含注入）的 token 近似 |
| 安全点 | history 末尾消息 role ∈ {user, tool}（完整交换边界） |

### 6.2 触发：仅安全点（D1）与阈值链（D2）——比例项 60% 窗口（预留 ≥ 40% 窗口的档改以不越窗为准）

- **仅安全点检查**：history 末尾消息 role ∈ {user, tool} 时才检查压缩——压缩是结构性 splice（head + 摘要 + tail），在 assistant 半截切会破坏 tool 配对语境；安全点检查零成本。
- **阈值链**：显式 `config.agent.compactThreshold` 优先（**数值在场 = 显式**；数值不在场 = auto，按在用 provider 现算——三档落值与迁移判据 = §6.17）；auto = **min(usableWindow(窗口, 完成预留), ⌊窗口 × 0.6⌋)**。
  - 完成预留 = **该 transport 实际发送的 `max_tokens`（不封顶）**，未发送时按规格 `maxOutput`；窗口 = 规格窗（§6.17）；单源 = `config.mjs` `requestBudget`（与 `outputReserve` / `usableWindow` / `resolveCompactThreshold` 同一算式），四个发送面只读它的 `maxTokens`；auto 值只进显示面（`compactThresholdResolved`），不回写 `agent.compactThreshold`。
  **触发判据 = §6.17「压缩触发判据（可达性门）」**（判据式单源在该节，本处不复制）：判定对象 = 完整 prompt 估算（system + tools + history）；越阈值只是**必要条件**，还须压完之后能落到线下，两项缺一不触发。
- **触发线口径**：`COMPACT_RATIO = 0.6`（用户 2026-10-26 13:06 令）——两项取小：比例项 `⌊窗口 × 0.6⌋`（预留 < 40% 窗口的档胜出，线恰 60.0%）∥ 余量项 `窗口 − 预留`（预留 ≥ 40% 窗口的档胜出）。
  - 预留 ≥ 40% 窗口的 4 档 9 行（T01–T04——显式 `maxTokens` 大者 ∥ 规格 `maxOutput` 大者）项式为线 = `窗口 − 预留`，线落 48.8%–50.0%；T01 预留 = 窗口 ⇒ 半窗退化接管，线 = 窗口 / 2。其余 19 档 61 行比例项胜出，线 = 60.0%。
  - 两项目标在预留 ≥ 40% 时数学上不可能同时成立（`0.6 × 窗口 + 预留 ≥ 窗口`），以不越窗优先：余量项胜出即是「把最后一段可发空间全让给输入」。
- **先例行（②）**：先例 = 评审面压缩机器的比值（`thincoder-core/advisor/compaction.mjs:28-39`——判死线 = 可用窗口 × 0.8）——对齐（同以可用窗口为预算基、经 `outputReserve` 单源随动）；偏离 = 乘位与比值都不同（主链乘**窗口** = `⌊窗口 × 0.6⌋` 上限项；评审面乘**可用窗口** × 0.8 = 宿主自限）——目标不同（防越窗 ∥ 防拒答），两式各自保留。
   - **逐档推算（`model-specs.mjs` 全表 70 行 / 23 档——规格视图；预置 `config-presets.mjs` 取值 ≤ 规格行 ⇒ 本表为保守视图）**：阈值 = `min(usableWindow(窗口, maxOutput), ⌊窗口 × 0.6⌋)`（无显式 `maxTokens` 时按规格 `maxOutput` 预留，不封顶；`usableWindow` 只在预留 ≥ 窗口时接管——半窗退化）；`*` = 预留 ≥ 40% 窗口的档（「窗口 − 预留」项胜出）：4 档 9 行，线落 48.8%–50.0%。

| 窗口 | maxOutput | 占窗口 | 阈值 | 行数 |
|---|---|---|---|---|
| 256_000 | 256_000 | 100.0% | 128_000（50.0%） * 半窗退化 | 1 |
| 256_000 | 131_072 | 51.2% | 124_928（48.8%） * | 2 |
| 262_144 | 131_072 | 50.0% | 131_072（50.0%） * | 3 |
| 256_000 | 128_000 | 50.0% | 128_000（50.0%） * | 3 |
| 1_000_000 | 384_000 | 38.4% | 600_000（60.0%） | 5 |
| 128_000 | 32_768 | 25.6% | 76_800（60.0%） | 1 |
| 1_024_000 | 256_000 | 25.0% | 614_400（60.0%） | 2 |
| 128_000 | 32_000 | 25.0% | 76_800（60.0%） | 5 |
| 262_144 | 65_536 | 25.0% | 157_286（60.0%） | 1 |
| 200_000 | 32_000 | 16.0% | 120_000（60.0%） | 2 |
| 1_000_000 | 131_072 | 13.1% | 600_000（60.0%） | 13 |
| 1_000_000 | 128_000 | 12.8% | 600_000（60.0%） | 9 |
| 500_000 | 64_000 | 12.8% | 300_000（60.0%） | 3 |
| 1_048_576 | 131_072 | 12.5% | 629_145（60.0%） | 3 |
| 128_000 | 16_000 | 12.5% | 76_800（60.0%） | 2 |
| 256_000 | 32_000 | 12.5% | 153_600（60.0%） | 1 |
| 262_144 | 32_000 | 12.2% | 157_286（60.0%） | 1 |
| 1_050_000 | 128_000 | 12.2% | 630_000（60.0%） | 2 |
| 1_000_000 | 65_536 | 6.6% | 600_000（60.0%） | 4 |
| 1_000_000 | 64_000 | 6.4% | 600_000（60.0%） | 2 |
| 1_048_576 | 65_536 | 6.3% | 629_145（60.0%） | 3 |
| 200_000 | 8_192 | 4.1% | 120_000（60.0%） | 1 |
| 2_000_000 | 64_000 | 3.2% | 1_200_000（60.0%） | 1 |

  **合计 70 行 / 23 档**——两种切法各自成立、互不替代：**按线所在区间** = 19 档 61 行恰 60.0%，4 档 9 行 ∈ [48.8%, 50.0%]（T01–T04）；**按哪一项胜出** = `*`（预留 ≥ 40%，窗口 − 预留 胜出）4 档 9 行，无标记（比例项胜出）19 档 61 行。

   档位明细（T01–T23 与上表同序）：
   - **T01**（256_000 / 256_000，1 行）：doubao-seed-2-1-turbo-260628
   - **T02**（256_000 / 131_072，2 行）：doubao-seed-2-0-code-preview-260215 · doubao-seed-2-0-lite-260428
   - **T03**（262_144 / 131_072，3 行）：kimi-for-coding-highspeed · k3-256k · qwen3.8-27b
    - **T04**（256_000 / 128_000，3 行）：MiniMax-M2.7 · hy3 · hy4-preview
   - **T05**（1_000_000 / 384_000，5 行）：deepseek-flash · deepseek-v4.1-flash · deepseek-v4-pro · deepseek-v4-flash · deepseek-v4-flash-vision-exp
    - **T06**（128_000 / 32_768，1 行）：qwen-flash
    - **T07**（1_024_000 / 256_000，2 行）：doubao-seed-2-1-pro-260915 · doubao-seed-2-1-lite-260915
    - **T08**（128_000 / 32_000，5 行）：kimi-k2.6 · kimi-k2.7-code · kimi-k2.7-code-highspeed · glm-4.5-air · mistral-large
   - **T09**（262_144 / 65_536，1 行）：qwen3.5-27b
   - **T10**（200_000 / 32_000，2 行）：claude-opus-4 · claude-sonnet-4
    - **T11**（1_000_000 / 131_072，13 行）：kimi-k3 · k3 · glm-5.3-flash · glm-5.3-flashx · qwen3.7-max · qwen3.7-flash · qwen3.7-plus · qwen3.8-flash · qwen3.8-max · qwen3.8-omni-flash · mimo-v2.6-pro · mimo-v2.6-flash · mimo-v2.6-pro-ultraspeed
   - **T12**（1_000_000 / 128_000，9 行）：glm-5.3 · glm-5.2 · glm-5 · gpt-4.1 · MiniMax-M3 · minimax-m3 · claude-opus-5 · claude-sonnet-5 · claude-fable-5.1
   - **T13**（500_000 / 64_000，3 行）：grok-4.6 · grok-4.5 · grok-4
    - **T14**（1_048_576 / 131_072，3 行）：kimi-k3.1-pro · kimi-k3.1-pro-highspeed · kimi-for-coding
   - **T15**（128_000 / 16_000，2 行）：gpt-4o · grok-4-mini
   - **T16**（256_000 / 32_000，1 行）：codestral
   - **T17**（262_144 / 32_000，1 行）：step-3.7-flash
   - **T18**（1_050_000 / 128_000，2 行）：gpt-5.6-sol · gpt-5.6
    - **T19**（1_000_000 / 65_536，4 行）：qwen3.6-flash · qwen3.6-plus · qwen3.6-27b · qwen3.6-35b-a3b
   - **T20**（1_000_000 / 64_000，2 行）：gemini-3-pro · gemini-2.5-flash
   - **T21**（1_048_576 / 65_536，3 行）：gemini-3.1-pro · gemini-3.8-flash · gemini-3.7-flash
   - **T22**（200_000 / 8_192，1 行）：claude-3.5-haiku
   - **T23**（2_000_000 / 64_000，1 行）：gemini-2.5-pro

  - **口径注（显式 `provider.maxTokens` 落预留首位）**：某 deepseek 配置（显式 393_216）⇒ `usable` 606,784、比例项 600,000 ⇒ 阈值 **600,000（60.0% 窗口）**（线 + 实发 = 993,216 < 1,000,000——比例项胜出，预留那一份不再把线抬到满窗）。预留若改回封顶 25%，线会落 750_000 而实发仍是 393_216 ⇒ 750_000 + 393_216 = 1_143_216 > 窗口——2026-10-18 的溢出 400 就是这个算式。
  - **口径注（未发 `max_tokens` 的渠道）**：预留按规格 `maxOutput`（依据：服务端对未声明的输出额度按自己的上限预留——deepseek 现场 400 报文「393216 in the completion」= 官方 `max_tokens` 上限，§6.17 勘察证据）。规格 `maxOutput` ≥ 窗口的档（`doubao-seed-2-1-turbo-260628`：256,000 窗 / 256,000 规格输出——预留恰等于窗口）⇒ `usableWindow` 半窗退化生效（128_000）；该档若真把 `maxTokens` 设到 ≥ 窗口，任何 prompt 都发不出去——守卫会带实数报错而非静默发（**未设** `maxTokens` 的同一档守卫照判——该档 `limit` 取地板 = `threshold` = 128,000，射程见 §6.17「守卫」）。
  - **机判用例（实施轮单测；算式 = `min(usable, ⌊窗口 × 0.6⌋)`，逐条带复算）**：① 无显式（kimi-k3 档：1,000,000 / 131,072）⇒ `usable` 868,928、比例项 600,000 ⇒ 阈值 **600,000**；② 显式小值（8_192 于 1M 窗）⇒ `usable` 991,808、比例项 600,000 ⇒ **600,000**；③ **deepseek 显式 393_216** ⇒ `usable` 606,784、比例项 600,000 ⇒ 阈值 **600,000**（`limit` 仍 = 606,784，两个字段不同值）；④ 规格 `maxOutput` ≥ 窗口（`doubao-seed-2-1-turbo-260628`：256,000 / 256,000）⇒ `usable` 128,000（半窗退化）、比例项 153,600 ⇒ 阈值 **128,000**；⑤ `doubao-seed-2-1-pro-260915`（1,024,000 / 256,000）⇒ `usable` 768,000、比例项 614,400 ⇒ 阈值 **614,400**（`limit` = 768,000——地板不生效，两个字段不同值）。
  - ⑥ 显式 32_000 于 128_000 窗 ⇒ `usable` 96,000、比例项 76,800 ⇒ 阈值 **76,800**；

    ⑦ 盘上有 `agent.compactThreshold: 750_000` ⇒ 按显式原样 750,000（`compactThresholdAuto === false`、`/config` 无 `(auto)`）；该档线 + 实发 393,216 = 1,143,216 > 1,000,000 ⇒ 守卫带三实数报错；

    ⑧ `providers[].context: 128`（K 覆盖，kimi-k2.6 档：131,072 / 32,000）⇒ `windowSource: "provider-override"`、`usable` 99,072 ⇒ 阈值 **78,643**（⌊0.6 × 131,072⌋）；

    ⑨ 显式 500_000 ⇒ 500_000（用户显式不被覆盖）。
- **残余带宽度 = 0**：预留取实发值且不封顶 ⇒ 「线 + 实发 ≤ 窗口」恒成立，messages 永远没有「过了窗却未到线」的区间（2026-10-18 的 400 就落在这个区间：messages 658,972 + 实发 393,216 > 1,048,576，而当时线在 750,000）。任何把预留封顶的做法都会重新打开这个区间——这是本式不封顶的唯一理由。
- **守卫（兜底，非主修）**：`agent/run-stages.mjs` 压缩阶段之后、发请求之前——判据 = **`usage.total > budget.limit`**（无档次门；`limit` 常档 = `window − reserve`，`absent` 档取地板 `max(window − reserve, threshold)`；`reserve` = 实发 `max_tokens` ∥ 未发时规格 `maxOutput`）。
  **判据不用 `maxTokens` 本身**：未发时为 `undefined` ⇒ `total + undefined` = NaN ⇒ 守卫恒不触发。真 ⇒ 先强制压缩；压缩后仍超 ⇒ 抛 `context_overflow` 型错误（带 prompt / max_tokens / 窗口三实数）且**不发请求**。

  **射程（全档）**：`absent` 档与 `explicit` / `spec` 档同判——`absent` 档的 `limit` 由地板给出（恒为正数、恒可判），不再有「守卫不覆盖」的档。

  守卫兜三件：① 估算漂移；② 规格窗大于服务端实际窗（§6.17 窗口口径）；③ 绕开安全点的旁路（第二道 = 发送面净判，§6.17）。

  **不适用面**：`compress` ∥ `distill` ∥ 续写子请求经发送面时豁免第二道——它们本身就是越线后用来把上下文降下来的那次调用；安全点的第一道照判（§6.17「豁免面」）。

  **不截断、不静默削输出。** 插入缝、再估函数与窗口源 = §6.17「守卫」。
- **真溢出的后果（不变）**：服务端硬校验 ⇒ 4xx 非 429 不重试（`provider/retry.mjs:51-52` 逐字抛）；run 以可读错误收束，会话盘面与人读线完好、可续跑；无静默损坏。
  - DeepSeek 口径（一手源 = `api-docs.deepseek.com` Chat Completions 页，2026-10-17 实取）：「输入 token 和输出 token 的总长度受模型的上下文长度的限制」；
    触达限制以 `finish_reason:"length"` 收束 ⇒ 续写协议（`prefixMode` / `partialMode`——`thincoder-core/provider/core.mjs:277-290`）与响应提醒（`thincoder-core/agent/run-stages.mjs:58-69`）接手。其余渠道未逐族取证（**登记**）。
- **线处余量**：按规格窗计算时线处恰满（线 + 实发 = 窗口）；服务端广告窗大于规格窗的档（deepseek：1,048,576 vs 1,000,000）自带 48,576 = 4.6% 的漂移余量。
- **不采纳的兜底**：逐请求钳 `max_tokens`——静默削输出违反「守卫不得静默截断」，须动四个 transport 装配面，且 prompt 本身越窗时钳输出无效；真实案例出现再议（登记）。主链不新增「自动压缩」以外的兜底。
- **provider 级覆盖**：`providers[].context`（K 单位）覆盖 MODEL_SPECS 的 context 后，阈值与 tail 公式跟随覆盖值（公式权威 → 本层 `PROVIDER.md` §6.15）。

### 6.3 token 判定（D3）——实测优先 + 增量估算

- 有实测：`_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`；无实测（首轮 / 恢复后 / 压缩后）：`estimateTokens(history) + system / tools 估算`；压缩成功 / 会话恢复 / 新 run 时基线失效（置 null）。
- 估算公式（**单源 = §6.17.1 链一**）：`Math.ceil(ascii / ASCII_CHARS_PER_TOKEN) + nonAscii`，`ASCII_CHARS_PER_TOKEN = 3`（常量住 `thincoder-core/provider/rate.mjs`）⇒ 文本 ASCII 3 字符/token + 非 ASCII 1 字/token；`reasoning_content`、`tool_calls` 参数计入；图像按 2000 token（取 VSC 保守值——偏低会延迟触发）。本节不另写系数。
- 理由：估算对 CJK 系统性低估，纯估算可能永不触发（实测教训）；实测值是完整上下文的真实成本。
- **实测值不乘校准比、估算值乘**：实测支 = `_lastPromptTokens + round(增量估算 × _tokRatio)`（增量是估算，乘）；纯估算支 = `round((history + overhead) 估算 × _tokRatio)`；`_lastPromptTokens` 是服务端真值，不乘。比的定义与采样 = §6.17「估算自校准」。

### 6.4 切割：tail / 无头部 / 配对 / 预算四约束

**① tail 保留——候选条数公式（D4）**：`keepTail = min(max(10, floor(context/100_000 × 30)), floor(len × 0.4))`——本条为**候选条数**规则，最终保留量受 §6.4④ token 预算双约束（D-T1 / D-T2）。

- 理由：1M 窗口只留 10 条太薄（丢近期工作上下文）；40% 上限防小窗口「压缩了个寂寞」。

**② 无头部（D12）——`KEEP_HEAD = 0`**：最早的 2 条并入中间段一起进摘要。

- 问题（用户反馈实证）：多任务连续会话中最早消息是**已完成的旧任务**——压缩后模型注意力被旧事锚住（「AI 忽然转向以前的旧事」）。
- 决策：摘要提示词增加「已完成 vs 进行中」区分；压缩后上下文 = 摘要注记 + 占位 + tail（tail 首条为 assistant 时占位并入该条——§7 D-CC18）——锚点天然是当前任务。协议安全：head 为空后 head 侧无切割面，配对自足由 **tail 侧配对安全边界**承接——中段以**真身消息**进摘要请求（§6.14）。
  人读线不变。

**③ 切割配对保护（D5）——双侧**：head 侧 head 不以 `tool_calls` 结尾（CLI——并行工具结果被摘要吞掉是修过的真实 400 场景）；tail 侧 orphan tool 拉回其 owner（两端版——工具配对边界不被切断）。

**④ tail token 预算——压缩后 history 段 ≤ 窗口 15%（D-T1–D-T5）**：

- 背景（用户实测）：600K 窗口模型压缩后仍占 ~40%——条数公式不控 token——工具密集会话中 tail 条数失控、释放空间小、很快再触发。用户目标 = 压缩后 **15%**。
- **F1** = 压缩后 history 段（摘要注记 + 占位 + tail）≤ 窗口 **15%**（B 口径——system / tools / 注入在外单算）；**F2** 工具密集会话生效、普通会话不误伤（预算未超时行为与现状完全一致）；**F3** 与摘要 ≤1K 协同（§6.9）；**F4** 两端一致。
- `tailBudget = context × 0.15 − 摘要估算`（摘要 ~1K）。**两端常量单源**：`SUMMARY_TOKEN_ESTIMATE = 1000`；`IMAGE_TOKEN_ESTIMATE = 2000`/part 两端同值。
- 测量边界：15% 按压缩时刻 history 段计量——压缩后回注（§6.6）不计入预算，其增量由 ±5% 容差吸收。
- 落地形态：`keepTailSize` 保持纯条数公式（语义改为「候选条数」），预算双约束在 `splitHistory` 接线——候选尾超预算 → `tightenTailByBudget` 前移 tailStart（候选尾头部并入摘要段）直到 ≤ 预算或触保底；D5 修复提取为 `repairedTailStart` 供候选 / floor 两边界复用（落点 = `thincoder-core/context.mjs`）。
- pair-safe 边界约束：tailStart 只允许落在配对安全边界（plain 消息，或完整 assistant(tool_calls)→tools 对起点）——无 pair-safe 边界能满足预算 → 进 D-T2 保底并接受超支。
- **D-T2 保底 10 条**：预算不足以保留 10 条原文时保底优先（保留最近 10 条、允许小幅超预算）——最近真实对话全吞进摘要会失真。单条巨型消息（估算 > 预算总量）保留该条本身（单条截断是 `shrinkOversized` 职责）。短历史（<25 条）：保底上限 = 候选条数（= min(10, 候选条数)）。
- **D-T3**：tailStart 前移 → 更多中间内容进摘要（砍价优先级保证决策锚点 / 未决清单优先保留）；摘要输入增大使变慢 / 超时概率升——失败走 3 连败降级（压缩面板可见，人读线兜底正确性）。
- **D-T4**：预算的**数值**不参与阈值计算（阈值只由窗口 / 预留 / 比例项决定，§6.2 阈值链）；**触发面以 §6.17 可达性门为准**——门在触发前就要算 `plan` 与 `post`，故 `splitHistory` / `tailBudgetTokens` 的**调用**前移到压缩之前；预算值本身（窗口 × 15% − 摘要估算）逐位不变。
- **D-T5 期望效果（600K 场景）**：压缩后 history ≤ 90K（15%）；完整 prompt ≈ 130K ≈ 窗口 22%——history 段单独达标 15%。

### 6.5 降级链（D6）——三级

1. **LLM 摘要**（`thinking: null`；`reasoningEffort` 不覆盖、与回合同源随带——§6.14 v3；中段以**真身消息**进请求、逐条**不截断**）；
2. **确定性截断**：连续 `COMPRESS_FAILURE_LIMIT = 3` 次失败 → `compressFallback`（FALLBACK_NOTE——丢 middle、不碰网络）；
3. **单消息截断**：超阈值但无 middle 可切（历史 = 1 条巨型消息）→ `shrinkOversized`：user / tool 体 8000 上限、keepHead 50% / keepTail 25%，不动 reasoning / tool_calls 结构。

- **失败计数语义统一**：每次 runAgent（用户消息）开始时重置。

### 6.6 压缩后回注（D7）· 双线历史（D10）

- **回注（D7）**：压缩成功后回注 `task`（去重：先滤掉历史中 TASK_REINJECT_PREFIX 旧注入，再注入 pending 全量 + done 最多 3）+ `plan mode` + `AUTO / permission`。理由：done 只列 3 条省 token 且信息足够；去重保证单源真值。
- **双线历史（D10）**：CLI `pushReal` 源头双写、压缩只动机读线；VSC 经 `opts.history` / `opts.fullHistory` 传入、`compactHistory` 只处理机读线。会话持久化双字段（CLI `saveSession` 写 `history` + `contextHistory`、`applySession` 从 `contextHistory` 恢复；VSC 同理）——保持不变。
  「人读线全量」= **记录 / 落盘语义**（完整记录在盘、压缩不触）；运行期内存 = 有界窗口（机制权威 → 本层 `SESSION.md` §6.14）。

### 6.7 文案与静默（D9 / D11）

- **D9 文案与形状**：摘要调用 `thinking: null`（`reasoningEffort` 同源随带、不覆盖——§6.14 v3）；占位回复固定 `"Understood. I'll continue from these notes, re-verifying anything transient."`；
  （tail 首条为 assistant 时并入该条——回声安全，§6.10 #7 / §7 D-CC18）；COMPACTION_PREFIX 文案两端一致（`[Context was automatically compacted…]`）。
- **D11 对前端静默**：摘要调用不传 `onToken` / `onReasoning`（CLI 曾透传导致摘要像回复一样流式显示——用户看到非回复陌生文本；VSC 本无此问题）。压缩发生只经既有状态提示（CLI `onCompress` 回调 `"[context] Context too long, auto-compacted…"`）；恢复渲染读人读线、压缩 note 不在其中——天然不显示。

### 6.8 压缩体验：进度感知 + 失败可见性（压缩面板）

- **生命周期回调（D-C1）**：`onCompressStart`（摘要调用前）+ `onCompress`（完成——保留不动）+ `onCompressFail(error)`（catch 分支——带错误对象；失败策略不变，**只加可见性**）；回调缺省 = no-op。接线落点 = `thincoder-core/agent/turn-loop.mjs`（回合环压缩检查点）+ `thincoder-cli/src/tui/agent-turn.mjs`。
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
- 定位本轮新增：记录 run 起点 `agent._runStartHistoryLen`（记录点 = `thincoder-core/agent/run-start.mjs:56`）；run 返回前对 `history.slice(起点)` 按探索类配对识别探索突发。
- 蒸馏：专用 `EXPLORE_SUMMARY_PROMPT`（静默调用——对齐 D11）把该批结果蒸馏为「发现了什么 / 在哪 / 关键结论」；调用形态 = 会话续写（前缀复用）——§6.15。
- 收缩：在机器线里把这批配对**整体替换**为一条 `user` 角色 `[Exploration summary]` note（保留配对边界——仿 `splitHistory` 配对保护）；`_fullHistory` 全量不动。
- 阈值 / 降级：<3 条不摘要；LLM 失败静默跳过（不阻塞返回、不丢历史）；与压缩各自独立。
- 与轮末编辑的交互（设计取舍）：轮末摘要发生在编辑之后——「即将编辑而 read」的原文若本轮已被编辑消费则无需保留；跨轮才编辑时摘要须足够支撑精确编辑、必要时模型重读文件。

**H2 压缩保真清单**：SUMMARIZE_PROMPT 追加显式清单——① 已改动文件清单；② 未决点 / 待办（供压缩后恢复定位）。

### 6.10 行为契约（验收口径）

1. 仅当 history 末尾为 user / tool、完整 prompt 估算 ≥ threshold、**且压后估算 ≤ threshold** 时触发（三合取项；判据式单源 = §6.17「压缩触发判据（可达性门）」）；
2. 压缩结果 = 摘要 note + "Understood" 占位 + tail（§6.4④ 预算 + 保底 10；KEEP_HEAD = 0）——tail 首条为 assistant 时占位并入该条（copy-on-write；§7 D-CC18），任意切割不产生孤儿 tool_calls / tool 消息；
3. 摘要失败：连续 3 次（每次 runAgent 重置计数）后确定性截断；历史过短时单消息截断；
4. 压缩后回注齐全（task 去重 / plan / AUTO）、实测基线失效；
5. 人读线全程不动、落盘双字段；
6. 空响应：自动重试 2 次仍空抛错（E1——`MAX_EMPTY_RETRIES = 2`，空响应注入 `[System reminder: your last response was empty…]`；VSC 原直接 throw——移 CLI 语义）。
7. **回声安全（D-CC18）**：压缩注入不产出「无 `reasoning_content` 的 assistant 紧邻 assistant」形态——DeepSeek 系（`reasoningEcho:"required"`）对压缩后首发请求 400 的成因形态（子代理触发压缩后必死——轨迹实证）；占位并入时尾首的 `tool_calls` / `reasoning_content` / 其余字段原样保留。

8. **恢复面回声归并（D-CC19）**：已落盘会话的机读线（落盘 `contextHistory`）在**恢复路径读取时**扫描归并——凡「无 `reasoning_content` 的 assistant 紧邻下一条 assistant」形态（D-CC18 的成因形态），把**前条文本并入后条**（同 D-CC18 方向：占位/无推理者被吸收，后条 `tool_calls` / `reasoning_content` / 其余字段原样保留；文本以空行相接），前条移除；**迭代至不动点**（链式形态一次跑完）。
   归并 = **核内单一纯函数**（`thincoder-core/` 导出）；各端**独立接线**（多实现面纪律——语义同源、断言各自驻留）——调用点：CLI `thincoder-core/session.mjs` `applySession` `:293/:296`（`machine` 定线后、`agent.history = [...machine]` 前）·

   VSC `thincoder-vscode/src/extension/panel-session.mjs` `activeLines` `:94`（函数声明；归并点 `:105`——`contextHistory` 定线 `:101` 后、`:106` 返回前——VSC **不经核 `applySession`**，槽直读组装，`panel-chat.mjs:251` 消费）。恢复后首请求不再携带病态形态（不推用户、不改会话档）。

   边界：前条带 `tool_calls` 的变体（孤儿 `tool_result` 面）**不并**——配对安全优先（登记上抛）；干净输入返回**同一数组引用**（零拷贝 / 零回归）。

   判据锚：恢复面两条线各持**批内定向单测**（收口随批删——形态计数 0 + 文本 / `tool_calls` 守恒；VSC 面同形判据、各面自持）。

9. **活体推入面回声恒带（D-CC22）**：`reasoningEcho:"required"` 族（`thincoder-core/model-specs.mjs:33/35/38/40/42` deepseek · `:44/46/48` kimi · `:75/76` mimo）的**工具轮** assistant 消息经核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs`）推入 ⇒ **恒带**
 `reasoning_content`；本轮无推理 ⇒ **空串**（不省略字段——「必须回传」按字段在场判定）。真机三连（`deepseek-flash` · 带 `tools` · 同形历史）：空串 **200**（服务端仍回 `reasoning` 63 字符）/ 缺字段 **200**（`reasoning` 帧 **0**）/ 真值 **200**（104 字符）⇒

 空串合法；缺字段轮不再回推理，与 `advisor/loop.mjs:201-206` 自述同向（n=1 采样——症状面证据）。调用点（**两站点共享同一构造单点**，非各自内联）：核主循环 `thincoder-core/agent/turn-loop.mjs:250` · 核 advisor 循环 `thincoder-core/advisor/loop.mjs:207`。

  **VSC 端侧零独立构造点**：端壳主循环 2026-09-29 已归核（`thincoder-vscode/src/agent.mjs` 现只转口 `ContinueError`），端侧站点随主体退役；`thincoder-vscode/src/specs.mjs:16` 只再导出该名，零调用点。glm 族 / 未声明（`optional`）⇒ 恒不带（行为零改）。

   **形状限定**：「缺字段 **200** · `reasoning` 帧 0」**仅设计轮形状（请求尾 = user）**成立；**活体形状（尾 = tool）**实测 = 三形态全 **200** · kimi / mimo 三形态全 **200** ⇒ 空串接受面双族已证。

### 6.11 已知 parity 说明

- **CLI `splitHistory` 无「reverse 保护」**：CLI 不需要——`repairHistory` 在 run 起点已保证 tool_calls→tool 顺序、run 中 append 保序，倒序无法产生；
  边界微差（`i > headEnd` vs `i >= headEnd` 等）为 off-by-one 粒度差、不改语义。若将来两端 history 来源出现倒序，应回植该保护（W6 后回植点 = 核内笔——超写域）。
- **提示词单源**：`SUMMARIZE_PROMPT`（`thincoder-core/context.mjs:20`）
  与 `EXPLORE_SUMMARY_PROMPT`（`thincoder-core/explore-distill.mjs:23`）现体均为**核单源**。
  `thincoder-vscode/src/explore-distill.mjs` 现为**调用期适配器**——只 import 核面；一致性由单源承接。

### 6.12 实现位置（两端当前落点——代码为准）

| 机制 | CLI | VS Code |
|---|---|---|
| 压缩 / 预算 / tail / 截断 / 摘要主体（`applyCompression` / `splitHistory` / `compressIfNeeded` / `compressFallback` / `shrinkOversized` / `summarizeRunExplorations` / `tightenTailByBudget` / `tailBudgetTokens`） | `thincoder-core/context.mjs`（`applyCompression` / `compressIfNeeded` / `compressFallback`）· `thincoder-core/token-window.mjs`（`splitHistory` / `tightenTailByBudget` / `repairedTailStart` / `tailBudgetTokens`）· `thincoder-core/context-degrade.mjs`（`shrinkOversized`）· `thincoder-core/explore-distill.mjs`（`summarizeRunExplorations`）——后三者经 `context.mjs` 转口可达 | 端侧判定点封装 = 核 `thincoder-core/agent/run-stages.mjs`（两端同调——零端侧重复） |
| 常量（`IMAGE_TOKEN_ESTIMATE` / `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE = 1000` / `TAIL_FLOOR_MESSAGES`） | `thincoder-core/token-window.mjs` | 单源 = 核列常量 |
| run 钩子（`_compressFailures` 重置 / `_runStartHistoryLen` / onCompress* 接线） | `thincoder-core/agent/run-start.mjs`（复位块 ∕ `_runStartHistoryLen`）+ `thincoder-core/agent/turn-loop.mjs`（压缩检查调用点）+ `thincoder-cli/src/tui/agent-turn.mjs` | 核 `thincoder-core/agent/run-stages.mjs`（判定点单源）+ 核 `thincoder-core/agent/turn-loop.mjs`（安全点调用）——VSC 经核 `runAgent` 同链 |
| 压缩面板渲染 | `thincoder-cli/src/tui/tool-events.mjs` + `thincoder-cli/src/tui/subagent-blocks.mjs` | webview 会话状态渲染 |
| SUMMARIZE_PROMPT / EXPLORE_SUMMARY_PROMPT | `thincoder-core/context.mjs`（`SUMMARIZE_PROMPT` export——`:20`）；`EXPLORE_SUMMARY_PROMPT` = `thincoder-core/explore-distill.mjs`——经 `context.mjs` 转口 export | `thincoder-vscode/src/explore-distill.mjs` = **调用期适配器**（只 import 核面） |

### 6.13 VS Code 端接线面


- **判定点封装（两端同调 · §2.13.4 #56 类）**：`runCompactionCheck(agent, ctx)` 住核 `thincoder-core/agent/run-stages.mjs:80`——循环骨架只留检查调用（核 `thincoder-core/agent/turn-loop.mjs:118-120`，LLM 调用前；
  安全点判定 = `history.at(-1)?.role` 为 `user` / `tool`）。封装体内驱动核 `compressIfNeeded` / `compressFallback`（触发 / 摘要 / 降级截断 / 尾部预算 / task+plan 回注 / 重建边界 / 基线失效全归核）。与 CLI 语义一致（D1）。
- **阈值档位（核面）**：`resolveCompactThreshold(cfgCompactThreshold, provider)`（核 `config.mjs`——显式优先 / auto = **阈值链**：`min(usable, ⌊窗口 × 0.6⌋)`，`usable` = `usableWindow(window, reserve)`；窗口 / 预留 / 阈值 / 上限的单源 = `requestBudget`（§6.17），本函数只取它的 `threshold`）——阈值随回合模型（档位跟随窗口，PROVIDER §15 T-C2）。
- **端差适配（调用期）**：核压缩面读 CLI 载体字段名 `provider` / `tasks` / `planMode`——本端 agent 载体为 provider 入参（`ctx.provider`）/ `_tasks` / `_planMode` ⇒ 核 `runCompactionCheck` 调用期同指三键（核只读此三键）；核以新数组替换 `agent.history`（applyCompression / shrinkOversized 均 copy-on-write）⇒ 端侧回收共享数组（面板持有同一引用；数组自定义属性随原位回收保留）。
- **预算常量**：单源 = 核 `SUMMARY_TOKEN_ESTIMATE = 1000`；`IMAGE_TOKEN_ESTIMATE = 2000`/part 两端同值。
- **REVERSE 配对保护（回植候选登记）**：现体核面无本判据（§6.11 口径：CLI 不需要——`repairHistory` 在 run 起点保证顺序）。VSC 侧倒序来源若仍可达 ⇒ **回植候选 = 核内笔**。
- **webview 压缩状态四态（现状登记 · 不变）**：`thincoder-vscode/src/extension/panel-callbacks.mjs` → postMessage `compress` 消息：
  `start` → 状态行 `Compressing context… (summarizing N messages)`；`done` → `Compressed: N tokens freed (Xs)`；
  `fallback` → `Compression failed — fallback: truncated to N messages`；`failed` → `Compression failed: <error>`。

  `webview/chat-status.js showCompressStatus` 原地更新 `#compress-status`；摘要正文永不进前端（D11 静默纪律）。

  回调链（onCompressStart / onCompress / onCompressFail）由端侧判定点转发——语义同 §6.8（D-C3）。
- **摘要段形状**：压缩 note + 摘要 + assistant 占位（tail 首条为 assistant 时占位并入该条——§6.10 #7）——现体 = 核段落形状（§6.7 文案族；两端非 byte-identical 注见 §6.11）。
- **失败可见化（Q3）**：核 `thincoder-core/agent/run-stages.mjs` catch → `onCompressFail` → 端侧回调 → webview 渲染错误文本（回调装配 = `thincoder-vscode/src/extension/panel-callbacks.mjs:221`）；
  `_compressFailures` 连续 3 次（核 `COMPRESS_FAILURE_LIMIT`）后 `compressFallback` 确定性截断；无 middle 可切 → `shrinkOversized` 单消息截断（核内承载——边界重置 2（并入分支 1）/ 基线失效由核 applyCompression / shrinkOversized 自理）。
- **非压缩职责边界**：repo outline → `repomap.mjs`（repoOutlineTool——按需工具，非回合自动注入）；git 富注入 → `agent/setup-reminders.mjs`（`collectGitContext` = `:145` / `pushGitContext` = `:163`；async）；editor / 机器注入 → `extension/editor-context.mjs` + `pushInjections`（`:194`）。

### 6.14 压缩调用形态 · 会话续写（前缀复用）

**判定句**：真机压缩调用 `cached / prompt ≥ 0.9`（与需求档 §2.1 同源）。

**v2 修法——声明面对齐（`tools`）**：

- **形态**：压缩请求随带**与回合请求同一**的 tools 声明（`extras.tools` 原样）——开销量单源 = 核 `thincoder-core/agent/turn-loop.mjs:39-45`（`compactionOverhead.tools = toolSchemas`），与回合调用同数组 ⇒ 两端同调、声明面无第二构造点、无字节漂移。
- **不抑制 tool call**：压缩请求**不随** `tool_choice`——实施轮受控实测：该参数致服务端**丢弃 tools 区**（前缀复用归零）。落定形 = 下方「修后形态」的 `tools` 行与状态段。
- **tool_call 泄漏后处理**：摘要面只取 `summary.content`——`tool_calls` **零落点**（不执行 / 不入 `history` / 不进注记）；`content` 空或空白 ⇒ 既有空白摘要守卫（`thincoder-core/context.mjs:414`）抛错进失败链。⇒ 泄漏 = 可恢复的单次失败（3 连败照常走确定性降级），非状态污染。
- **观测出口**：真机读数增一格「压缩轨迹行的响应 tool_calls 计数」。
- **退化面**：`extras.tools` 缺省（直调者——如 `thincoder-cli/scripts/verify-compress.mjs`）⇒ 不发 `tools`——形态退回 v1，正确性不变、仅无命中折扣（同退化面 1）。
- **成本面**：请求体多出 tools 声明（增量 ≈ 2.2K token）；命中时按缓存价、未命中时全价 ⇒ 无前缀缓存场景成本略升，由命中收益主导（目标场景）。

**修后形态（消息序 + 前缀构成）**：

```
messages = [ { role: "system", content: extras.systemPrompt },  // 与回合请求同字节
             ...history.slice(0, tailStart),                    // 中段「真身」消息（原样引用——不拷贝 / 不截断）
             { role: "user", content: SUMMARIZE_PROMPT } ]      // 尾部指令（唯一新增面）
tools    = extras.tools（与回合请求同一声明面；**不随 tool_choice**——实测该参数致服务端丢弃 tools 区）
```

- **状态**：消息序 v1 **已落**（`thincoder-core/compress-form.mjs` + `context.mjs` 接线）；`tools` 行 = **v2 已实施**（`context.mjs` 接线已落）——
  **落该形**（带 tools、**不随 `tool_choice`**：该参数实测致服务端丢弃 tools 区 ⇒ 该形落定）；
  `reasoningEffort` 行 = **v3 已实施**（**同源随带**：与回合同一字段；不硬编码 · 无配置 ⇒ 缺省）——**真机生产口径首现命中 92.86% / 93.65%**（两次独立运行）；
  派生面两则（百炼 qwen 族 / autoThink 窗口）⇒ **认账**：压缩侧**不设思考标记**（`thinking:null` = 需求 N1 字面 · 本档 D9）——

  ① 百炼 qwen 族的 `enable_thinking` 取值随 effort 档位（机制单源 = `doc:PROVIDER.md:§6.12` 一致性分支；实现 = `thincoder-core/config.mjs:143-156`）——两种落值都是合法对，非缺陷；② autoThink turn-0 窗口（压缩检查先于分类）为**已知边界**（影响有界：仅 turn-0 且长史触阈；其后各轮同源）。
- **前缀构成**（= 可复用面）= `tools` 声明 + `system` + 中段；**新增未命中面** = 尾部指令一条（+ ≤255 的块对齐残余）。中段 = `splitHistory` 的 `[headEnd, tailStart)`（KEEP_HEAD = 0 ⇒ head 空；§6.4② / ④）。
- **摘要输入域（选中面）不变 / 表示面改变**：只喂中段（尾部不进摘要输入）⇒ **选中范围不变**；中段的**表示面** = 真身消息（不截断）。
- **前缀对齐前提**：切点须是配对安全边界（`repairedTailStart` 保证中段自足）——否则发送期配对归一（`thincoder-core/provider/normalize.mjs`）会在压缩请求合成 `[Tool result missing: …]` 占位而回合请求不会，前缀自此分叉。
- **单一真值**：请求前缀切点与摘要段切点同源（同一个 `tailStart`），不新增第二处切割判据。
- **落地形态（模块拆分）**：纯函数 `buildCompressMessages` 落核档 `thincoder-core/compress-form.mjs`（零 import 依赖：指令文本由实参传入，不与 `context.mjs` 成环）。
  `thincoder-core/context.mjs` 只留接线（import `:15` + `buildCompressMessages` 调用 `:198` + 空白摘要守卫 `:219`）。
  单测档随批存放、**收口随批删除**（零留存口径，不进产品树）。
  先例 = `explore-distill.mjs`（自 `context.mjs` 拆分——当日 524 > 500）。

**退化面**：

1. **无前缀可复用**（`extras.systemPrompt` 缺省——如 `thincoder-cli/scripts/verify-compress.mjs` 直调；或 provider 无前缀缓存）⇒ 请求仍按同一形态发出，**正确性不变**，仅无命中折扣（v2 下请求体多出 tools 声明——无命中时按全价，成本略升，见上方 v2 成本面）。
2. **摘要失败 / 中止**：降级链不动（§6.5——连续 3 次失败 → `compressFallback`；AbortError 透传）。
3. **空白摘要守卫（新增 · 最小）**：`summary.content` 去空白后为空 ⇒ 抛错进失败计数链、**不改 `history`**。理由：新形态下模型处于「对话续写」框架，输出面偏离不再由「无 tools」兜底；空白摘要若落到 `applyCompression`，形态 = 「中段已丢 + note 为空」且计为成功。
4. **轨迹体积副作用（登记 · 接受）**：轨迹纪律 = **完整落盘**（不截断 / 不丢行——`thincoder-core/traces/trace-store.mjs:22-24`；写入面 `:240` 落出站 `messages` 全量）。
   本形态把中段真身（含每轮 `reasoning_content` 与多模态 base64 part）写进 `stage:"compress"` 行 ⇒ 单行体积升至中段全量——增量 = 每次压缩多一份中段副本（同批消息在同会话回合行亦全量落盘，量级同单回合行）。
   清理面不变（按 mtime 保留期 prune——`thincoder-core/traces/trace-store.mjs:284`）：**接受，不新增机制**（traces 默认 OFF · 诊断面）。
5. **非空白但非摘要的输出（残余 · 登记 + 观测口径）**：「对话续写」框架下模型可能输出非摘要文本——请求面无判据，会作为 `note` 进 `applyCompression`（`thincoder-core/context.mjs:327-331`）并计为成功。
   **接受该残余**（无可离线机判的形态）；观测出口 = 实施轮真机读数增一项**摘要形状抽查**（要点式 / 含 FILES CHANGED · UNRESOLVED 清单）——不达标 ⇒ 上抛，不静默通过。

**与「压缩生存」诸机制的交互（逐条 · 均不动）**：触发面（安全点 + 阈值链，§6.2）· 切割面（`tailStart` / 尾部预算 / 保底 10，§6.4）· 回注面（task / plan / AUTO，§6.6 D7）
与情境行重推（`MANIFEST.md` §2.6）——均作用于压缩**之后**的 history 重建 · 边界与基线（`_runStartHistoryLen` 重置 D-CC17 / `_lastPromptTokens` 失效）·

回调面（`onCompressStart({ messages: middle.length })` 语义不变：仍是「被摘要的中段条数」）· 双线（压缩仍只动机读线，§6.6 D10）。

**用例表与验收判据**：工具面 = §6.16.10（`S` / `P` / `C` / `N` / `RG` 各族）；形态与预算面 = 本节退化面 + §6.17 用例表（`RB` 族）；验收回指 = 需求档 `docs/core/requirements/CONTEXT-COMPACTION.md` 的 F-CC1–F-CC8 判定句。

**`SUMMARIZE_PROMPT` 定稿（主 agent 内容权）**：首句 → `The conversation above is our work log so far — summarize it into a compact summary for use as context in the ongoing conversation.`；删 `Work log:` 标签行与其后空行（正文现位于指令**之前**）。

其余 **9 条要求**与末段砍价优先级一字不动（现档 = 9 条 bullet + 末段砍价优先级——`thincoder-core/context.mjs:63-71`）。

**读法裁定（整句替换）**：`You are a conversation compressor.` 角色句**退役**（不保留）——现档 `thincoder-core/context.mjs:61` = 定稿句逐字符相同。

### 6.15 蒸馏调用形态 · 会话续写（前缀复用）

**修法（与压缩线逐件同构——先例即设计）**：

```
messages = [ { role: "system", content: extras.systemPrompt },   // 与回合请求同字节
             ...history.slice(0, lastBlockEnd),                  // 中段真身消息（原样引用——不拷贝 / 不截断）
             { role: "user", content: EXPLORE_SUMMARY_PROMPT } ] // 尾部指令（唯一新增面）
tools    = extras.tools          // 与回合请求同一声明面；**不随** tool_choice（该参数致服务端丢弃 tools 区）
provider = { ...agent.provider, thinking: null }   // **不覆盖** reasoningEffort ⇒ 与回合侧同源（v3 形态）· thinking:null 保留（D9/D11 静默）
```

| 件 | 压缩线（§6.14 · 已实施） | 蒸馏线（本 §） |
|---|---|---|
| 消息序 | `[system, ...history.slice(0, tailStart), 指令]` | `[system, ...history.slice(0, lastBlockEnd), 指令]` |
| 声明面 | `tools: extras.tools`（**不随** `tool_choice`） | 同 |
| 调用参数 | `thinking: null` + **不覆盖** `reasoningEffort`（v3） | 同 |

- **前缀（可复用面）** = `tools` 声明 + `system` + `history[0, lastBlockEnd)`——皆回合请求已建缓存面（探索结果在 run 内已随回合请求送服务端 ⇒ 该段在缓存内）；**未命中面** = 尾部指令一条（+ ≤255 块对齐残余）。
- **切点 `lastBlockEnd`** = 本 run 最后一个探索块的 `end`（`findExplorationBlocks` 的 `blocks.at(-1).end`）——与替换面**同一 blocks 数组**（note 插入点 = `blocks[0].start`、丢弃集 = 各块区间）⇒ **不新增第二处切割判据**。
- **选中面 / 表示面**（对照 §6.14 同款口径）：表示面 = `[0, lastBlockEnd)` 段**真身消息**（不截断）⇒ **选中范围扩大**（含非探索消息）。
- **序列化面退役**：`serializeExplorationMessages` 与 `safeSliceUTF16` 引用已删（服务端已见真身 ⇒ 重复表示无益）；`thincoder-core/text-budget.mjs` 仍有 memory 族消费方（`thincoder-core/memory/core.mjs:15`）——**非末位消费**。
- **形态构造面单源**：复用 `thincoder-core/compress-form.mjs` 的 `buildCompressMessages(history, cut, systemPrompt, instruction)`（`:15-21`）——压缩为形态首个消费点、蒸馏为第二消费点；**不设第二构造点**（D2：同一形态单源，避免两处字节漂移）。
- **替换面不变**（§6.9 H1 不动）：note 仍插在首块位置、探索块整体丢弃、非块消息保留、`_fullHistory` 不触；失败静默（`chat` 抛错 / `content` 空 ⇒ `if (!summary)` 返回 null ⇒ 原历史保留——**无替换 = 无信息损失**，N3）。
- **提示词文本不动**（内容权 = 主 agent）：`EXPLORE_SUMMARY_PROMPT` 禁触；其尾行 `Exploration log:` 在真身形态下**指向空**——风险与上抛见下。

**上抛项（主 agent 笔 · 提示词面）**：修后形态下 `EXPLORE_SUMMARY_PROMPT` 的角色句与尾行须随指令位置改写（先例 = §6.14 `SUMMARIZE_PROMPT` 定稿「The conversation above is our work log so far…」整句替换 + 删 `Work log:` 标签行）；
**禁触提示词面** ⇒ 设计按文本原样落形态；文本改写 = 主 agent 另笔——**非实施前置**（形态与命中判据不依赖文本），但摘要质量面以改写为上。

**退化面**：

1. **无 `systemPrompt` / 无 `tools`**（`extras` 缺省——VSC 适配器未接线 / 直调者）：`buildCompressMessages` 既有语义（system 缺省 ⇒ 不带头）+ `tools` 缺省 ⇒ 不发声明面 ⇒ 形态退化为「history 前缀 + 指令」，**正确性不变**、仅命中折扣；**miss 面成本量级** = 前缀量级全价 × ≈18 次/半日。
   **服务端接受度登记**：该格 = 真身 `role:"tool"` / assistant `tool_calls` 消息**且不带 `tools` 声明**（首现于蒸馏线退化格）；蒸馏线该格**仅直调或测试可达**（生产两端接线后核调用点与 VSC 发射点均传 `extras`）⇒ **免真机取证**，离线面由新用例文件覆盖；实施轮若实测该格真机可达（400）⇒ 上抛，不静默。
2. **无块 / <3 条探索结果**：不触发（阈值面不动，§6.9 H1）。
3. **蒸馏失败 / 中止**：返回 null、原历史保留、不触发 `onDistilled`（N3 既有；零改）。
4. **run 内发生过压缩**：切点 `lastBlockEnd` 落在压缩后 history 上 ⇒ 前缀 = 压缩后所送序列，仍与回合请求同源（前缀对齐前提同 §6.14：切点须为配对安全边界——`findExplorationBlocks` 只认完整助手→工具配对块，天然自足）。

**判定句与取证（预注册 · 与压缩线同口径）**：真机蒸馏调用 `cached / prompt ≥ 0.9`；取证路径 = `~/.thincoder/traces/<date>/*.jsonl` 中 `"stage":"distill"` 行的 usage；前置闸 = 同会话回合调用命中 ≥0.9（同 §6.14）。

**判定格口径**：判定格取**中大型前缀会话**（前缀占请求主体）——命中率结构上限 ≈ 前缀 /（前缀 + 未命中面），未命中面 = 尾部指令一条 + ≤255 块对齐残余；小前缀会话不作判定格（够不到 0.9 属结构性，非机制未生效），如需折算按 `(prompt − 未命中面) / prompt` 口径。

**先红方案（离线可判）**：新用例 = 批内定向单测（`docs/batches/<batch>-<topic>.test.mjs`——收口随批删；`globalThis.fetch` 桩）——修前形态 = `messages[0].role === "user"` ⇒ 形态断言（首条 = system / 末条 = 指令 / 前 N 条 = 回合前缀切片）**必红**；修后转绿。


本 § 的落点族（设计侧速览）：核 `thincoder-core/explore-distill.mjs`（调用形态改会话续写 + 序列化面退役）· 核 `thincoder-core/compress-form.mjs`（头注声明第二消费点——行数读数见 §6.14 落地形态）。

两处调用点 `extras` 透传（核 `thincoder-core/agent/run-stages.mjs`（压缩）· 核 `thincoder-core/agent/turn-loop.mjs:205-207`（蒸馏））· VSC 适配器（`thincoder-vscode/src/explore-distill.mjs`——**端形向后兼容**，增形参 `extras`）。

**边界（本 § 不改）**：压缩面 · provider 面（`chat` 签名与发送面）· 提示词文本 · 替换面（§6.9 H1）——范围与逐处核实以本档内口径为单源。

### 6.16 模型主动整理上下文（`context` 工具 · 操作区分）

**需求单源** = `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1「模型主动整理上下文（`context` 工具 · 操作区分）」条目 **F-CC1–F-CC5**（判定句 ①–⑤ 与边界在同处）；预算保真三条 **F-CC6–F-CC8** 的落点 = §6.17.1——本节只给**落点与形态**，不重述需求（D2）。

**命名辨析（读到 "context" 时先分清三义）**：① 本节的**工具名** `context`（模型可见的单工具三操作）；② 核**压缩模块档** `thincoder-core/context.mjs`（机制本体——与工具名同词、不同命名空间）；③ VSC **宿主工具**（IDE 快照——已**改名 `ide`**，让出 `context` 名，见 D-CC26）。CLI `/config` 的 action id `context`（窗口设置项）与工具面无关。

**6.16.1 工具形态逐字（F-CC5）**

落点 = `thincoder-core/agent-tools/context.mjs`（**已落**——家族工具面）；工具描述 `description` = `DESC("context")`（`thincoder-core/tools/shared.mjs:19`），**文本单点 = `thincoder-core/tool-docs/context.md`**——本节不复述描述正文（副本会漂），缺档 = 抛错（`loadToolDoc`）。

注册单源 = `thincoder-core/agent-tools.mjs`（登记册，+1 export）；装配点 = `thincoder-core/agent/family-tools.mjs` 的 depth-0 段（`depthOnly`——与 `readHistoryTool` 同列表；子代理面裁见 6.16.6）。

```js
export const contextTool = {
  name: "context",
  description: DESC("context"),   // 正文单点 = thincoder-core/tool-docs/context.md（本节不复述——第二副本会漂）
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
| **回合中途怎么落** | `compact` 工具**只登记不执行**：写 `agent._pendingCompact = { focus, at }`（**单槽**——重复调用后者覆盖前者，回执明示），返回回执；**历史零改、不发 LLM**。真正执行发生在**下一个安全点**（`agent.history.at(-1)?.role ∈ {user, tool}`——工具结果落盘后的天然边界），即既有检查点的同一处；此刻全部 tool 结果已配对落盘 ⇒ 不产生孤儿 `tool_call` 结果（回合中途压缩的本体风险由此消） |
| **消费点** | 核 `thincoder-core/agent/run-stages.mjs` `runCompactionCheck`（`:80`）——先取 `pending = agent._pendingCompact`，随即**清槽**（失败不重放；重发由模型再调）；`pending` 在场 ⇒ 以 `{ ...compactionOverhead, force: true, focus }` 调核 `compressIfNeeded`。两端同调（VSC 经核 `runAgent` 同链，零端侧重复） |
| **与回合尾 / 阈值面（互斥还是排队）** | **阈值面排队承接、互斥于「同点一次压缩」**：强制面**成功（摘要路）** ⇒ 本次安全点的阈值检查自然不被消费（历史已重建）；强制面**成功（有损收缩路——`!split` 且 `shrinkOversized` 命中）** ⇒ 同按「一次成功压缩」记账（**不落 no-op 注记 / 不跑阈值面**——见下「第三去向」）；强制面**无可压**（`!split` 且 `shrinkOversized` 未命中）⇒ 记 no-op 注记后**照常**跑阈值检查（阈值面不因模型请求而让位）；同一安全点至多发生**一次成功压缩**（重建后的 tail 不得当轮再摘要）。**溢出守卫的紧急强压是唯一例外**（§6.17）：阈值面已压而 prompt 仍越 `limit` 时，守卫再强压**一次**，压后仍超即抛 `context_overflow`——「不越窗」优先于本不变量；守卫**不得在同一安全点连压第二次**。 |
| **阈值面语义零改** | `force` 跳过阈值面的**全部**早退判据——`total <= threshold` 与 §6.17 可达性门的 `post > threshold` 两条（模型判定优先于阈值）——其余全同：同 `splitHistory` / 同尾部预算 / 同摘要链 / 同 `applyCompression` 回注 / 同 `_lastPromptTokens` 失效；**无 focus 时请求体逐字节同修前**（压缩形态零回归） |
| **失败路径复用** | 摘要在途失败 ⇒ 既有失败链原样（`_compressFailures++` → `onCompressFail` → 连续 3 次 `compressFallback`）；AbortError 照旧透传（不落注记）；模型面另落**失败注记一行**（旧式无人告知的缺口在本面补齐——见下）。`context compact` **不另起**任何失败 / 降级 / 面板机制 |
| **回执面** | ① **工具回执**（`compact` 调用当次返回）：排队事实 + focus 回显 + 落点说明 + **可回查锚**（见 6.16.7）；② **结果注记**（机器行一条，`transient: true`，直推 `agent.history`）：仅两种情况落——**no-op**（`nothing to compact right now (no middle section…)`）与**失败**（`context compact failed (attempt N of 3): <msg>`）；**成功不落注记**（压缩注记 + 摘要本身就是结果，重复即噪音） |

- **强制面第三去向（有损收缩已处理 · 登记）**：`force` ∧ `!split`（无中段）∧ 单条消息体 > `OVERSIZE_CONTENT_LIMIT`（8000 字符——`thincoder-core/context-degrade.mjs:42`）⇒ `shrinkOversized` 命中（`thincoder-core/context-degrade.mjs:52-81` 返 true——经 `context.mjs` 转口）——
  该安全点按**一次成功压缩**记账：**不落 no-op 注记**（有损收缩已发生，「nothing to compact」不实）、**不跑阈值面**。

  等价性（判「现状语义自洽、非缺口」之据）：该形下阈值面的唯一杠杆 = **同一** `shrinkOversized`（`thincoder-core/context.mjs:178`——`compressIfNeeded` 内调用点）⇒ 跳过与执行**可观察结果等价**——`split` 输入（条数 / 角色序）不因收缩改变仍为 null，已截体落限内（keepHead 4000 + stub + keepTail 2000 < 8000）⇒ 重复调用恒 false。

  模型面可观察 = 被截条目的体内标记 `[... N chars truncated — single message too large for context window ...]`（`thincoder-core/context-degrade.mjs:70` 逐字）；该去向含 `tokens <= threshold` 形——`force` 已跳过阈值早退（模型判定优先于阈值）。

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
- **两相斥 focus 的可断言性**（判定句 ①）：离线（桩）= 两请求体末条互不相同且各含其 focus 文本 + anchor 块（机判）；真机 = 两份摘要的聚焦词命中计数差额（**取证类，非 CI 门禁**）。
- **前缀复用不受损**（与 §6.14 同口径，登记非门禁）：强制压缩的中段 = `[0, tailStart)`，仍是上一回合请求消息数组的前缀 ⇒ 命中面不因本面退化。

**6.16.3 prune 语义（F-CC3）**

- **合格对象**（三条件合取，单源实现 = 核 `token-window.mjs` `collectStaleToolOutputs(history, provider)`）：① `role === "tool"`；
  ② **保护尾之外**（`split.headEnd ≤ i < tailStart`——KEEP_HEAD = 0 ⇒ `headEnd = 0`，区间即 `[0, tailStart)`；**复用 `splitHistory` 的同一 `tailStart`**：即「压缩会摘要掉的那段」，不新增第二处切割判据）；
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
Context ≈{total} tokens ({pct}% of {window} window); compaction line {threshold} ({toGo} to the line)
Request budget: window {window} ({spec|provider-override}) · max_tokens {maxTokens|not sent} ({explicit|spec|absent}) · prompt {total} · to compaction line {threshold − total} · to window limit {limit − total}
Segments ≈: system {system} · tools {tools} · history {history} (basis: {measured|estimated})
History: tool outputs {toolOut} tokens in {toolCount} msgs · prunable stale {stale} tokens in {staleCount} msgs · protected tail {tailCount} msgs
Cache: hit {cacheHit} · miss {cacheMiss} tokens ({hitPct}% hit) across {turns} response(s)
Status line: context {statusPct}% ({calibratedHistory} calibrated history estimate / {window} window)
Compaction so far: {none | last summary freed {freed} tokens | last fallback truncation} · failures {n}/3
```

- **`Request budget:` 行读法**（本行 = 该行的**唯一字面**，§6.17 不复制）：`{maxTokens}` = 该 transport 实际写进请求体的值；未发时写 `not sent`、来源写 `absent`（此时预留 = 规格 `maxOutput`，可由 `to window limit` 反推——`limit = window − reserve`；`absent` 档 `limit` 取地板，守卫全档照判，射程 = §6.17「守卫」）。
  `{total}` = `contextUsage` 全量上下文占用（**含 system + tools**），故标 `prompt` 不标 `messages`。两个距离**带符号**（负 = 已越——死区由此可见）；首行 `{toGo}` 仍取 `max(0, threshold − total)`（既有不变量，S5 锁定）。
- **无读数形态**（会话首轮、尚无 provider usage）：`Cache: no provider usage readings yet (hit/miss arrive with the first response)`——明示占位，不报 `0%`（无分子即无命中率）。
- **取自哪里（单源）**：`total` = 核新档 `thincoder-core/token-window.mjs`（**已落**）的 `contextUsage(agent, overhead)`——与 `compressIfNeeded` 的 token 判定**同一函数**。
  - 实测优先 = `_lastPromptTokens + 增量`；无实测 = `estimateTokens(history) + system + tools`。
  - `threshold` = 该回合检查用的同一值（`agent._ctxBasis.threshold`）；缺省回退 `resolveCompactThreshold(agent.config.agent.compactThreshold, agent.provider)`（数值不在场 ⇒ auto 现算——§6.17）。
  - `maxTokens` / `maxTokensSource` / `windowSource` / `limit` 取自同一 `requestBudget`（§6.17）——预算面与发送面同源，stats 不自算第二套。
  - `window` = `providerSpec(agent.provider).context`；`stale` / `tailCount` = 6.16.3 的同一合格集函数。
  - `cacheHit` / `cacheMiss` / `turns` = 核 agent 累计字段 `_cacheHitTokens` / `_cacheMissTokens` / `_usageTurns`
    （初始化 `thincoder-core/agent/setup.mjs:63-70`；累计 `thincoder-core/agent/turn-loop.mjs:181-190`——与 `_lastPromptTokens` 同点同源，
    取自响应 usage 的 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`）；`hitPct = Math.round(cacheHit / (cacheHit + cacheMiss) * 100)`。
- **阈值单源接线**：核 `thincoder-core/agent/turn-loop.mjs:48`（`compactionOverhead` 构造 ∕ `_ctxBasis` 暂存）——两端同调、零端侧第二处——stats 因此报**该回合实际判定所用的阈值**，不自行重算第二口径。
- **与状态行 ctx% 的单源关系**：状态行口径 = **校准后的历史估算 ÷ 窗口**，实现点只有一个——核 `historyReading(history, provider, ratio)`（`thincoder-core/token-window.mjs`；`ratio` = 该 agent 的估算校准比，经 `tokenRatioOf(agent)` ∥ 槽样本经 `sampleRatio(sample, provider)` 取，**无缺省**）。
  四处消费面**全是它的投影**：
  - stats 第 6 行（`thincoder-core/agent-tools/context.mjs:94` 取数 → `:111` 输出行）
  - 打开态读数（`thincoder-core/session-lifecycle.mjs:425`）
  - 桌面 `ev:usage`（`thincoder-desktop/src/main/agent-host.mjs:169`）
  - VSC（`thincoder-vscode/src/specs.mjs:83`）∥ CLI 状态行（`thincoder-cli/src/tui/render-loop.mjs:111` 缓存 → `thincoder-cli/src/tui/status-line.mjs:146`-`149` 渲染）

  端侧零自算式：状态行只格式化该函数的两个返回值。

  **判据（单源 = 一个实现点，不是「各处算式文字相同」）**：两处各写一遍同一算式，任一处能单独改动而另一处不知情，就是两个口径——文字相同只证明此刻巧合相等。

  跨端同尺的常驻验收 = `test/RTM.md` 故事 16 行 16-1（CLI 恢复带样本的会话 ⇒ 状态行百分比 = 核 `historyReading` 读数）。批内 parity 单元档用毕即删，不作出处。

  stats **不新增第三口径**：**两口径 = 窗口占用（首行——`total / window`）∥ 状态行（第 6 行——核 `historyReading(...).pct`，用户看到的那个）**；阈值 = 具名数值（`compaction line … ({toGo} to the line)`），**不再作百分比分母**——全份输出零「无名百分比」（两处百分比各带分子分母，见 §6.16.4 首行定稿）。

  第 6 行括号内的 `calibratedHistory` = 核 `historyReading(...).tokens`（已乘校准比），与 `Segments ≈` 行的 `history`（核 `estimateTokens` 裸估算）**不同量**——标记 `calibrated` 即为分辨这两个数而设。

  **端侧零公式**：状态行只格式化核读数的两个返回值（`tokens` / `pct`），自身不再出现除法算式。

  **空历史口径（保留分歧 · 登记）**：`historyReading([], provider, ratio).pct` = **0**（纯公式——分子 0；三参无缺省，第三参漏传 ⇒ `tokens` / `pct` 皆 `NaN`）。

  两端「零值不显示」的门在**端侧显示层**：CLI `thincoder-cli/src/tui/status-line.mjs:148` 以 `ctxPct > 0` 才渲染该段；VSC `thincoder-vscode/src/specs.mjs:83`-`85` 在 `tokens` 为 0 时 `pct` 返 `null`——显示门不入本函数面。

  stats 恒报数值（报告面须给定值：空历史 = `0%`）。**不收正**：收正须动 VSC `ctxPercentForHistory` 的 `null` 返回，或让核函数返 `null`（后者使 stats 第 6 行无法定值）——两向皆越「VSC 面板显示面零改」边界，且两端同为「零值即不显示」，取形分歧零收益。
- **先例行（①）**：先例 = 状态行百分比口径（`historyPercent`——分母 = 窗口，第 6 行同款）——对齐（分母同源；两口径并排、各具名）；偏离 = 首行分子 = `total`（全量上下文占用）、状态行分子 = history——两口径并排、各具名。

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

- **单源落点**：`thincoder-core/agent-tools.mjs`（登记册）+ `thincoder-core/agent/family-tools.mjs` 的 `depthOnly` 段 ⇒ **两端自动同表**（CLI 经核 `thincoder-core/agent/setup.mjs`；VSC 经 `setup-tooltable.mjs:262-273` 同调核 `assembleFamilyTools`）。
- **VSC 端零表改动**——这正是把 `context` 放家族段而非 `tools/` 静态表的原因：那张 VSC 手写表是已知重复面。`builtinTools` / `assembleBuiltinTools` 名集（24 + 8）**零改** ⇒ `SHARED_FACE` 计数不动。
- **VSC 宿主工具让名（D-CC26）**：VSC 宿主工具（IDE 快照）现档 = `thincoder-vscode/src/tools/ide.mjs`（**改名已落**；`name: "ide"`，让出 `context` 名给核新工具），
  登记于 VSC 手写 `builtinTools:181`，且被核测试 `HOST_ONLY = ["ide","focus"]`（现行值）钉为「不得入核」；让名缘由 = 与核新工具 `context` **同名撞车**。

  生产后果 = 请求体工具名重复（provider 逐字 400 `Tool names must be unique.`）⇒ **宿主工具改名为 `ide`**——**档改名**：
  `thincoder-vscode/src/tools/ide.mjs`（自 `context.mjs` 改名；行为面零改）。

  行为面零改：`readonly`、描述语义、`what` 参数、四段采集全不动；仅名字与引用面随改。
- **子代理面裁定（裁令 D）——不给（depth-0 only）**：
  1. **回查面事实**：depth-0 会话的记录面 = 槽文件（`session-slots.mjs` `slotPath(cwd, agent._slot)`）+ 记录存储（sidecar 段）——恒在盘上、从不压缩、可经 `read_history path=` 取回（`read-history.mjs:192-222`）。
  2. **子代理无回查通道**：`read_history` **depth-0 only**（`thincoder-core/agent/family-tools.mjs:141`/`:150-151`——「subagents get their own throwaway history」）。
     子代理亦**不绑记录存储**（`bindRecordStore` 调用点全在 depth-0 会话路径：`thincoder-core/session.mjs:147` / `thincoder-core/session-lifecycle.mjs:134` / `cmd-new.mjs:20` / ACP handlers——子代理链无绑定）。
     ⇒ 子代理的 `_fullHistory` 是**内存一次性**，settle 后其被压掉的中段**无面可达**（父只拿到子代理的最终报告；轨迹档默认关，非取回面）。
  3. **结论**：若给子代理 `compact` / `prune`，「压掉的可取回」在本面**承诺不了**——与本面「记录面不死」硬边界（及裁令 A 的可回查锚）冲突。故 `context` **不入 depth>0 任何角色**（`depthOnly` 段 = 结构性不可达，与 `read_history` 同款 fail-closed）；depth>0 的上下文治理仍由**既有阈值自动压缩**承担（语义零改——其本身也是「压掉即不可回查」，本条不改变既有事实，只是**不新增**一条模型可主动触发的不可回查路径）。
  4. **代价与替代**：子代理失去 stats / prune（其探索面工具输出确有可压量）——替代 = 父侧按需建/裁子代理任务粒度（既有惯例）+ 阈值面兜底；若将来给 depth>0 开回查面，本裁定随之下修。

**6.16.7 可回查锚（裁令 A）**

`compact` 回执**必须**给出「压掉的可一步取回」的锚——两分支逐字：

| 分支 | 判据 | 回执尾段（逐字形态） |
|---|---|---|
| 已绑定槽 | `agent._slot != null` **∧ `agent.cwd` 在场**（CLI：`saveSession`/恢复绑定后；粘性缓存 `thincoder-core/session.mjs:148`） | `Full record (never compacted): {slotPath(cwd, agent._slot)} — read it back with: read_history path="{同一路径}" (add keyword / since / role filters to target it).` |
| 未绑定 | `agent._slot == null` **或 `cwd` 缺省**（会话首次保存前——CLI；VSC 恒绑定、不落本支——见下行「VSC 端差——消」） | `Full record: this session's file is created on first save — list this project's sessions with: read_history path="cwd:{agent.cwd}", then copy the listed path into path= to query it.` |

- **接的既有单源**：取回面 = `read_history` 的 `path=` 参数（`read-history.mjs:192-222` 单文件深查 + `:202-219` `cwd:` 发现面）——本工具**不新建**取回通道，只把「全史所在」补进回执（现尾注「full text is in the session file」不给路径 ⇒ 不可行动；本面补此闭环）。
- **边界**：不写盘 / 不改会话档 / 不代模型取回——回执只给坐标与调用形。
- **VSC 端差——消**：面板槽位恒绑定 agent（`thincoder-vscode/src/agent/setup.mjs:299` `agent._slot = bind?.slot ?? null`；回合入口认领先于后续任何 await——`thincoder-vscode/src/extension/panel-chat.mjs:128-129`）⇒ VSC 端走**直接路径回执**（两端同式）；验证 = I11 机检两项（装配链锁 + 回执两分支——未绑定支为构造态）。
- **`cwd` 缺省态（登记 · 降级形）**：`_slot` 在场而 `cwd` 缺省 ⇒ 落**未绑定分支**（判据 = 上表未绑定行**析取**），`cwd` 字面取 `undefined`（回执形 `read_history path="cwd:undefined"`）——工具内**不抛**（fail-soft 守卫 = `thincoder-core/agent-tools/context.mjs:107`）。
  该态在两端生产链**不可达**（建链面恒带 `cwd`：核 `thincoder-core/agent/assemble.mjs:106`（`createAgent` 携 `cwd`）+ CLI 值源 `thincoder-cli/src/cli/make-agent.mjs:32`；VSC `thincoder-vscode/src/agent/setup.mjs:244` 每轮重指 `agent.cwd`），仅直调 / 退化夹具可达 ⇒ 不另设分支、不改形（登记入降级面）。

**6.16.8 模块拆分与行数预算（500 软线）**

- **新档 `thincoder-core/token-window.mjs`**（**已落**）：自 `context.mjs` **逐字迁出**计量 / 窗口 / 边界三族，三族现以本档为单源：

  ① 计量面：`IMAGE_TOKEN_ESTIMATE` + `estimateTokens`；

  ② 尾族：`KEEP_HEAD` 头注 + `TAIL_BUDGET_FRACTION` / `SUMMARY_TOKEN_ESTIMATE` / `TAIL_FLOOR_MESSAGES` + `keepTailSize` + `tailBudgetTokens`；

  ③ 切分与配对修复族：`splitHistory` 头注 + `splitHistory` + `repairedTailStart` + `tightenTailByBudget`。

  **同批新增族**：上下文用量单源函数（6.16.4）· 陈旧工具输出合格集（6.16.3——含门槛常量 `PRUNE_MIN_TOKENS`，与合格集同住本档）· 状态行百分比（与状态行同式）。**零 import 环 / 零回指**（只依赖 `provider/rate.mjs` 与 `config.mjs`——`context.mjs` 单向消费）。
- **`context.mjs` 收缩后新增的面**：`estimateTokens` 再导出 · `force` / `focus` 接线 · 焦点块构造 · anchor 取值 · `pruneStaleToolOutputs` 应用面（stub 文案 + 原位替换 + 回执）。

  ⇒ 拆分依据 = **职责边界**（`token-window.mjs` = 计量 / 窗口 / 边界单族；`context.mjs` 只留编排与形态接线），**不以越线为据**——不分拆的形态同样在 500 软线内。

  estimateTokens 再导出保 **import 面**（`thincoder-cli/scripts/verify-compress.mjs:7`、端侧批内定向单测、TUI 均经本档取；先例 = explore-distill 再导出）。
- **新档 `thincoder-core/agent-tools/context.mjs`**（**已落**）= 工具对象 + 三操作 + 轻推助手 + 注记文案；**新单元测试档随批存放、收口随批删除**（零留存口径——不进产品树）。

- **`config.mjs` 拆分（已落）——两块外提**：`thincoder-core/config-defaults.mjs`（`DEFAULTS` 默认值表本身）∥ `thincoder-core/config-normalize.mjs`（加载期归一 / 清洗纯函数族 + 两枚警告旗）；
  `config.mjs` 留公共面 + `loadConfig` 编排 + 请求预算算式族 + 百炼 thinking 解析 + MCP 重载，并以 re-export 维持全部导出名不变（34 档导入点零改）。
  判据 = 实施后 `config.mjs` ≤ 500 软线。两块同拆的理由：只拆归一 / 清洗族，`config.mjs` 剩下的面仍贴着该线，而 `DEFAULTS` 每加一键 +1 行、`loadConfig` 每加一归一分支 +3~5 行 ⇒ 下一批再越线。

- **CLI 侧无独立实现面**：`context` 工具经核装配自动可见（§6.16.6 注册单源）。工具档面随注册在册——`context` 的说明住 `thincoder-core/tool-docs/context.md`（三操作逐条），`tool-docs/` 档族的增减随工具面走；档数按目录实读，零增删的判据见 §6.16.10 RG4。

**6.16.10 用例表（判定句 ①–⑤ + 裁令 A/D 逐条落用例）**

| # | 用例 | 输入 | 期望（机判形） | 对位 |
|---|---|---|---|---|
| S1 | stats 实测口径 | agent 夹具（`_lastPromptTokens` + `_usageAtLen` + `_ctxBasis` 在场） | 首行 total = `_lastPromptTokens + estimateTokens(history.slice(_usageAtLen))`（复算等值）；`basis: measured`；三段数之和 = 复算 | F-CC1 |
| S2 | stats 估算口径 | 同上但基线为 null | `basis: estimated`；total = `estimateTokens(history) + system + tools`（`contextUsage` 复算等值） | F-CC1 |
| S3 | stats 状态行单源 | 同一夹具 | 第 6 行 pct = 核 `historyReading(history, provider, ratio).pct`（同一调用；端侧零复算式） | F-CC1 |
| S4 | stats 空历史 / 无 `_ctxBasis` | `history: []`；无暂存 | 不抛；总数为 overhead；threshold 走 `resolveCompactThreshold` 兜底 | F-CC1 边界 |
| S5 | stats 两名分明 | 任一夹具 | 首行 = `Context ≈{total} tokens ({pct}% of {window} window); compaction line {threshold} ({toGo} to the line)`；{pct} = `Math.round(total / window * 100)` 复算等值、{toGo} = `max(0, threshold − total)` 复算等值；全行百分比恰 1 个（具名分母） | F-CC1 |
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
| S6 | stats `Request budget:` 行（字面单源 = §6.16.4） | 三夹具：① 显式 `maxTokens` 393216（`explicit`）② anthropic 无显式（`spec`）③ 未发（`absent`）；总 > 阈值的夹具各一 | 逐字 = `Request budget: window {window} ({spec|provider-override}) · max_tokens {maxTokens|not sent} ({explicit|spec|absent}) · prompt {total} · to compaction line {threshold − total} · to window limit {limit − total}`；① 数值 + `explicit`；② anthropic 数值 = `spec.maxOutput` + `spec`；③ `not sent` + `absent`；两距离**带符号**（构造 total > threshold ⇒ 首距离为负）且逐项 = `threshold − total` / `limit − total` 复算等值；`window` 后缀随 `windowSource` | F-CC1 |
| RG1 | 注册单源（core） | `assembleFamilyTools({depth:0})` / `{depth:1, role:'explore'}` | depth-0 含 `context` **恰一次**；depth>0 各角色零含（含 consult） | 判定⑤ / 裁令 D |
| RG2 | 双端表（VSC） | `hydrateRun` 生产形状 | `toolByName.has("context")` ∧ 表内名唯一（宿主工具已名 `ide`）∧ `context` 唯一来源 = 核家族段 | 判定⑤ |
| RG3 | 三操作可达 | schema + 逐 action 调用 | enum = `["stats","prune","compact"]` 三项 ∧ 各返回确定回执（无 `unknown action`） | 判定⑤ |
| RG4 | 零回归 | `assembleBuiltinTools` 名集 / `tool-docs` 计数 / 压缩形态与回声两面的批内定向单测（收口随批删） | 核内建工具名集零增删（口径 = `assembleBuiltinTools({cwd})` 的 `name` 集合；2026-10-28 实读 31 名）；`tool-docs/` 档族零增删（2026-10-28 实读 54 档）；两面用例全绿（无 focus ⇒ 请求体逐字节不退） | 边界 |

**6.16.11 边界（本面不改）与退化面**

- **边界**：阈值自动压缩语义 / 触发线（§6.2）/ 阈值解析（`resolveCompactThreshold`）**零改**（本面零触；阈值再平衡 = §6.2 / D-CC30）；记录面（`read_history` / 人读线 / 会话档双字段）零改；不做自动压缩、不做自动方向检测（轻推 = 一行建议，压缩决策恒在模型）。
  不新增用户侧命令；不新增配置键（门槛常量等为设计常量）；子代理面不给（6.16.6）；`read_history` 本体零改（裁令 A 只借其既有 `path=` 面）。
  `SUMMARIZE_PROMPT` 文本零改（只追加焦点块）；VSC 面板 / webview 零改（压缩可见面复用既有四态）。
- **退化面**：① 无 `_ctxBasis`（直驱 / 测试）⇒ stats 阈值走 `resolveCompactThreshold` 兜底；② `extras.systemPrompt` / `extras.tools` 缺省（直调压缩）⇒ 焦点块仍生效、前缀复用退化（既有退化面 1）。
  ③ `agent._slot` 无 **或 `cwd` 缺省** ⇒ 锚走 `cwd:` 形（6.16.7——含字面 `cwd:undefined` 的降级态）；④ 摘要连续失败 ⇒ 既有三连败降级（模型面另见失败注记）；⑤ 未绑定记录存储（模式 F）⇒ 人读线仍全量，回查锚不变。
  ⑥ 宿主工具改名 ⇒ 端侧旧名引用（描述测试死常量 / 各端指南档 / README）属文档面残留，实施轮随改。

**6.16.12 发布关联**

无（随下一代发版列车；**发布动作 = 用户门**）。

### 6.17 请求预算单源（窗口 ∥ 实发 max_tokens ∥ 压缩线 ∥ 守卫）

**一条算式，四个消费面**：`requestBudget(provider, spec = providerSpec(provider))`（单源 = `config.mjs`；transport 由 `provider.format` 决定——`"anthropic"` / `"google"` / `"responses"` / 缺省 = OpenAI 兼容）返回 8 字段：

| 字段 | 定义 | 消费面 |
|---|---|---|
| `window` | `spec.context`（`providers[].context` K 覆盖已并入 `providerSpec`） | 阈值 ∥ 状态面 |
| `windowSource` | `"provider-override"`（`providers[].context` 在场）∥ `"spec"` | 状态面标注 |
| `maxTokens` | 该 transport 实际写进请求体的值：anthropic 恒发 `provider.maxTokens ?? spec.maxOutput`；其余三面仅显式时发 `provider.maxTokens`，未发 ⇒ `undefined` | 四个装配面**只读它**：`thincoder-core/provider/core.mjs` · `thincoder-core/provider/anthropic.mjs` · `thincoder-core/provider/google.mjs` · `thincoder-core/provider/responses-request.mjs`（**不进守卫判据**——未发时 `undefined`，见下「守卫」） |
| `maxTokensSource` | `"explicit"` ∥ `"spec"` ∥ `"absent"`（= 未发） | 状态面标注（**不再作守卫门**——absent 档由 `limit` 地板覆盖，见下「守卫」） |
| `reserve` | `maxTokens ?? spec.maxOutput`（未发时保守按规格输出，**不封顶**；恒为数） | 阈值 |
| `usable` | `usableWindow(window, reserve)`（预留 ≥ 窗口 ⇒ 半窗） | 阈值 |
| `threshold` | `min(usable, ⌊window × 0.6⌋)` | 压缩触发（`thincoder-core/agent/setup.mjs` 每 run 现算） |
| `limit` | `window − reserve`（prompt 的硬上限；恒为数 ⇒ 守卫**唯一判据字段**）。`absent` 档取地板 `max(window − reserve, threshold)`——只有 `reserve ≥ window` 的退化行与裸值不同，其余行逐位相同 | 状态面 ∥ 守卫（判据字段） |

**装配面不留第二算式**：anthropic 现行 `provider.maxTokens || (spec.maxOutput || 8192)` 的第三级不可达（`specForModel` 恒返 `DEFAULT_SPEC`，`maxOutput` 恒为 32_000）——该 `|| 8192` 随装配面改读 `maxTokens` 一并删净（被取代的表达式不留在文件里）；四个发送面的 `max_tokens` / `maxOutputTokens` / `max_output_tokens` 因此恒等于 `requestBudget().maxTokens`。

**两档落值（`agent` 段）**：

| 配置面（磁盘） | `agent.compactThreshold` | `agent.compactThresholdResolved` | `agent.compactThresholdAuto` | 实际阈值 |
|---|---|---|---|---|
| 无该键（auto） | **键不写**（`undefined`） | 派生值（加载时算 + 每 run 现算 + 切模型时刷新） | `true` | `resolved` |
| 有该键（显式） | 磁盘值原样 | 同值 | `false` | 磁盘值 |

- `DEFAULTS.agent.compactThreshold` **退场**：键缺省 = auto——留着默认值会让每份配置看着都像显式。
- `compactThresholdAuto` = **加载期派生旗**（`config.mjs` 合并段算出），不是配置键、不落盘；判据唯一 = 数值是否在场。
- **迁移判据（改后首次加载）**：数值在场 ⇒ 显式（原样用，不猜来源）；数值不在场 ⇒ auto 现算。无迁移分支、无改写。代价：盘上若躺着历史派生值，它按显式生效、该档不享受新线——状态面可辨（`/config` 无 `(auto)` 后缀 ∥ stats 报具名 `compaction line`）。
  且「线 + 实发 > 窗口」的档由守卫带三实数报错（§6.2；无档次门——`absent` 档 `limit` 取地板，同样判），不静默发。**在用配置实测（2026-10-18）**：`agent` 段无 `compactThreshold`、无 `compactThresholdAuto` ⇒ 走 auto。
- auto 派生值只进 `compactThresholdResolved`，永不写 `agent.compactThreshold`、不落盘；模型切换后的刷新职责不变——四处刷新点改写目标字段 = `compactThresholdResolved`（`cmd-config.mjs` · `model-picker.mjs` · `provider-admin.mjs` · `session-lifecycle.mjs`）。

**显示面（CLI `/config`）**：数值 = `agent.config.agent.compactThresholdResolved`；`compactThresholdAuto === true` ⇒ 缀 ` (auto)`；编辑初值 = 同一数值（不预填 100_000）。`resolved` 缺场 ⇒ 显示 `(unavailable)`、编辑初值留空——**不回落任何默认数**（回落 100_000 会在用户面造一条 10% 的假线）；该支不可达（加载期合并段与每 run 现算都必产 `resolved`），纯护栏。

写入数值 = 固定为显式阈值（保存回显明示「显式阈值——auto 派生线不再生效」）；**输入 `auto` ⇒ 删键回 auto**（下条）。四处读点（均在 `thincoder-cli/src/tui/cmd-config.mjs`）= header ∥ 主菜单项 ∥ View full config ∥ 数值项编辑初值。
- **四处拆分后的归属**：`cmd-config.mjs` 拆两档时四个子菜单（代理 ∥ 会诊池 ∥ 并发池 ∥ 默认模型）迁 `thincoder-cli/src/tui/cmd-config-menus.mjs`，而四处读点**全留在 `cmd-config.mjs` 的主循环脊柱**——header 行 ∥ 主菜单项 ∥ View full config 分支 ∥ 数值项分支的编辑初值；子菜单内无一处读 `compactThresholdResolved` ⇒ 拆分只在本档内移行号，读面归属不变。

**写回面（CLI `/config` 数值项——回 auto）**：输入 **`auto`**（大小写不敏感、去首尾空白）⇒ **删键** `agent.compactThreshold`（`delete raw.agent.compactThreshold`，经 `persistRaw` 单通道落盘）⇒ 重载后 `compactThresholdAuto === true`、`compactThresholdResolved` = 派生值、显示回 `(auto)`。输入数值 ⇒ 建键为显式（原语义，不改）；**空输入 = 取消**（不改）；非数值且非 `auto` ⇒ 报错行、零落盘。

- 提问行逐字（**两档都追加在 `current:` 之后**，文案按 `compactThresholdAuto` 分流——台账 `#1679`）：auto 档 = ` — 输入数值即固定为显式阈值`；显式档 = ` — 输入 auto 回到自动派生（删键）`；非 compact 数值项 = 空串。
  实现 = `thincoder-cli/src/tui/config-helpers.mjs` 的 `compactThresholdHint(auto)`（非 compact 数值项传 `null` ⇒ 空串）。
  理由：显式档用户最需要「怎么回 auto」，auto 档用户最需要「输数值会锁死派生线」；只给其中一档 ⇒ 另一档的人看不到自己该看的那半句。
- **装配形（可钉字符串）**：分隔符 = 空格 + `—` + 空格（由 `compactThresholdHint` 自带）；挂点 = `current: <值>` 之后、闭括号之前 ⇒ 三档字面：
  - auto（`compactThresholdResolved` = 600000）：`agent.compactThreshold (current: 600000 — 输入数值即固定为显式阈值):`
  - 显式（磁盘值 700000）：`agent.compactThreshold (current: 700000 — 输入 auto 回到自动派生（删键）):`
  - 非 compact（`agent.maxTurns` 200）：`agent.maxTurns (current: 200):`
- **先例行**：先例 = 同档数值项提问（`thincoder-cli/src/tui/cmd-config-menus.mjs:178` 并发池 `(current: <n> — positive integer ≥1)`：`current:` 后接 ` — ` + 合法输入说明）∥ 同一 `auto` 旗驱动的文案后缀 `compactThresholdSuffix`（显示面，归 `config-helpers.mjs`）；对应设计节 = 本节「显示面」与「写回面」。
  对齐 = 挂点与分隔符逐字复用；偏离 = 先例恒发一句，本面按 `compactThresholdAuto` 二选一互斥——两档要的指令相反（auto 档学「怎么锁死派生线」、显式档学「怎么回 auto」），恒发两句会让其中一句成为空操作。
- 保存回显逐字（auto 档）：`agent.compactThreshold = (auto)（键已删除——压缩线按在用模型的窗口每轮现算）`
- 报错行逐字（无反引号——用户可见字面即此串，内嵌双引号属字面）：`Value must be a number (or "auto" to clear the explicit override)`
- **报错行射程**：该句**仅** `agent.compactThreshold` 一项——其余数值项的非法输入仍报 `Value must be a number`（`thincoder-cli/src/tui/cmd-config.mjs` 对所有数值项共用同一句）。

- **两端输入形不同、写盘结果同**：CLI 输 `auto` ∥ VSC 面板置空（`thincoder-vscode/src/extension/settings-panel-write.mjs:77` 空串 ⇒ `patch.compactThreshold = undefined` ⇒ `applyAgentPatch` 删键）——**两端都是删键**，无第二种落盘形态。

- VSC 设置面板读**原始盘面**（`thincoder-vscode/src/extension/settings.mjs:42`，`null` = auto）；两端**输入形**差异（CLI 数值 + `auto` ∥ VSC 空串）保留登记，**写盘形态与读出口径同**（删键 = auto）。

**窗口口径**：一律按规格窗（`windowSource: "spec"`）。理由 = 全 transport 唯一可知的窗口，且对同一模型是「规格值 ∥ 服务端广告值」中**较小**者（deepseek：1,000,000 < 1,048,576——保守）。服务端广告值（400 报文 `maximum context length is N tokens`）只作注记、不参与计算；把它采集为 provider 级事实并与规格取 min = 后续项。

**预留口径的勘察证据（本批实取）**：查过 = `api-docs.deepseek.com/api/create-chat-completion`（一手源，2026-10-26 取）。

该页 `max_tokens` 字段逐字：「The value must be between 1 and 384K (393216). When not set, the default is 8K in non-thinking mode, 64K in thinking mode (128K with `reasoning_effort` set to `max`)」。

同页总长句：「The total length of input tokens and generated tokens is limited by the model's context length」。

结论两条：① **默认值确有公开来源**（8K / 64K / 128K），故不再以「没有接口广告它」作为保守的理由；② 失效现场 400 报文里的「393216 in the completion」与该页的**上限**（393,216）逐位相同、与其**默认值**不同 ⇒ 该端服务端按 `max_tokens` 上限预留，不按默认值。

因此 `absent` 档预留仍取规格 `maxOutput`（deepseek 384,000 = 393,216 的十进制近似，方向再保守 9,216）——依据从「读不到」改为「读到了，但实测行为取上限」。

- **偏离认领（判据③ 字面 = 服务端真值）**：本设计取规格窗 ⇒ deepseek 档的线比「按服务端窗（1,048,576）推」低 **48,576 token**（4.6%），即每次提前这么多压缩；换来的是一条唯一可知、跨 transport 同口径的窗。该偏离随批次档 §2.9 上抛请用户认。

**状态面**：`context` 工具 `stats` 首行之后新增一行——**字面单源 = §6.16.4「报什么数」块**（本处不复制字面）。读法两则：`{total}` = `contextUsage` 全量上下文占用（含 system + tools），故该行标 `prompt`；两个距离带符号（负 = 已越，死区由此可见）。首行不变量（恰一个 `%`、分母 = 窗口）与压缩线的具名数值保持。

**压缩触发判据（可达性门 · 固定开销不进被判定的一侧）**

**一句话**：压缩只在「压完之后 `total` 能落到阈值之下」时触发；压不到线下的压缩一律不触发。

**勘察证据行（本门 · 本批实取）**：查过 = 本档 §6.4④（tail 预算 ∥ `SUMMARY_TOKEN_ESTIMATE`）· §6.5（三级降级链）· §6.9 D13（摘要 ≤1K、不设 `max_tokens`）· §6.17「守卫」条与 §6.17.1 链三（「再压只是重复付费」）· `test/RTM.md` 故事 11（11-1–11-5）。`index.publicRepos` = 空表（`PROJECT-MANIFEST.json`）⇒ 无外部一手源输入。**相关** = 上述守卫条那句判断——本门是它前移到触发面（差异见本节末「与既有判据的关系」条）。

**判据式**（落点 `thincoder-core/context.mjs` 的 `compressIfNeeded`；`extras.force` 全文豁免）：

```text
压 ⟺ usage.total > threshold  ∧  post(plan) ≤ threshold

post(plan) = round((history − middle + note + system + tools) × _tokRatio)
```

**三个量的定义**（全部取既有单源，零新算式）：

- `usage` = `contextUsage(agent, extras)`（`thincoder-core/token-window.mjs:134`，§6.16.4 单源）——`total` 即现判据的左侧，逐位不变。
- `plan` = `splitHistory(history, keepTail, tailBudgetTokens)`（`thincoder-core/token-window.mjs` 既有）——`middle` 就是这次压缩会摘掉的那段。
- `post` = 按 `applyCompression` 实际留下的形态估：`head` + 注记 + 占位 + `tail`（`KEEP_HEAD = 0` ⇒ `head` 恒空）。压缩后 `_lastPromptTokens` 失效（`thincoder-core/context.mjs:126`）⇒ 只有估算支可比，故 `post` 走 estimated 支并乘同一 `_tokRatio`。
- `note` = 注记 + 占位的估算：摘要正文取 `SUMMARY_TOKEN_ESTIMATE = 1000`（常量单源 = `thincoder-core/token-window.mjs:43`，tail 预算早已用它——本门复用并导出该常量，零新常数）；注记前缀 = `COMPACTION_PREFIX` 文案、占位 = §6.7 D9 固定句，两段按 §6.3 估算式取值。
  **残余方向（如实登记）**：摘要压缩前不存在，D13-3 又不设 `max_tokens`（无上界）⇒ 真实摘要超 1K 时 `post` 被**低估**，门可能放行一次压不到线下的压缩（白付一次摘要请求）；**不会反向误拦**——压后仍超的兜底仍在守卫面（抛三实数，§6.17「守卫」条）。

**为什么是这个形**（否掉的两条并列在此，判据只取第三条）：

- **否①「比较时减固定开销」（`history > threshold − overhead`）**：乘 `_tokRatio` 后与现判据代数等价，**它不是修**；且 `overhead > threshold` 时右端为负、判据恒真——正是本案现场（`history` 153 仍每轮触发）。
- **否②「固定开销超某比例即跳过」**：要一个没有现场的魔数；且它只堵极端格——`overhead` 落到阈值的 0.79 倍时，尾部预算本身仍可能已超过剩余预算，压了等于没压。
- **取③可达性门**：不引新常数；判据问的是「压完能不能到线下」这件本来就该问的事，`overhead` 因此只出现在 `post` 里的加法项、不再抬高左侧。

**射程与安全**（三条面不动，逐条点名）：

- **守卫面不动**：`enforceContextFit`（`thincoder-core/agent/run-stages.mjs:158`）仍判 `usage.total > budget.limit` 并强压一次；本门只是**不再在没有净减时白付一次摘要请求**，安全线仍由守卫守。
- **发送面净判不动**：四面 `estPrompt > requestBudget(...).limit`（§6.17「发送面净判」）零改——本门让位的格仍被这两道判住。
- **确定性截断不设门**：`splitHistory` 无中段时走 `shrinkOversized`（`thincoder-core/context-degrade.mjs:52`），零网络——本门只为「不为一次无净减的摘要付请求」而设，截断路无此代价，照旧。

**与既有判据的关系（先例 · 偏离一处，理由随行）**：先例 = 守卫面同一句判断「压后仍超说明压缩解不了，再压只是重复付费」（本节「守卫」条 ∥ §6.17.1 链三）。

**偏离的是位形，不是判断**：守卫在**事后**——先压、压完再判，仍超则抛；本门在**事前**——先判「压完能否到线下」，到不了就不压、不抛。事后形式在触发面用不了：触发面还没有「压完」这个事实，只能先算 `post`。事后的那一抛**必须留着**：服务端真值与估算不一定一致，压后仍超仍是错误，不能因为门判过就静默放行（改动面见下「普通档」条）。

**普通档的改动面（如实登记）**：`overhead ≪ threshold` 时 `post ≤ threshold` 通常自动成立，行为与修前同；改变的是边角格——「越了线但摘掉中段也到不了线下」，修前压、修后不压。该边角正是本门的作用面，不是副作用。

**现场读数（2026-10-27 · 台账 `#1833`）**：`total=83,717` · `history=153` · `system=33,852` · `tools=49,712` · `threshold=76,800`。本门在该现场：`post ≈ (153 + 注记 + 83,564) × ratio > 76,800` ⇒ **不触发**，那一发摘要请求不再发出。

**案例表（本门 · 判据单源在此）**

| 例 | 输入 | 期望 |
|---|---|---|
| 11-6 正常 · 固定开销吃掉阈值 | 固定开销估算 > 压缩线、`history` 极小（上面的现场） | 压缩事件 **0**（`agent._lastCompressInfo` 未置位）· 摘要请求 0（`logCtx.stage === "compress"` 零发）· 回合请求 1 · 用户拿到答复 · 无 400 |
| 11-7 边界 · 高开销但中段可摘够 | 开销逼近阈值、`history` 含足量中段使 `post ≤ threshold` | 压缩事件恰 1——判据字段 = `agent._lastCompressInfo.mode`，逐字值 `"summary"`（既有：`thincoder-core/context.mjs:228`；截断路为 `"fallback"`，`:247`；消费方 = `onCompress` → TUI 压缩面板 ∥ VSC 压缩状态行，§6.8）· 摘要请求恰 1（`stage === "compress"`）· 回合请求恰 1（`stage` 缺省，即压缩之后那一个回合）· 回复引用工具结果 |
| 11-8 边界 · `force` 不受门 | 模型主动压缩（`context` 工具）∥ 守卫强压，压后仍超线下 | 压缩仍执行恰 1——门只拦阈值面，`force` 全文豁免 |
| 11-9 错误 · 无中段走截断 | 单条消息超 `OVERSIZE_CONTENT_LIMIT`、无中段可摘 | 走 `shrinkOversized`、体内出现截断标记；门不拦（零网络） |

**集成测试设计（起点 = `test/RTM.md` 故事 11「超窗守卫与内部阶段豁免」，现 11-1–11-5 六行——含 11-4a ∥ 11-4b）**

**对既有行逐行判**——本门只动**阈值面**（`compressIfNeeded` 的非 `force` 分支）；守卫面 · `force` 面 · 400 自适应面逐位不变，所以这六行的构造前提均不失效（表中 11-4a ∥ 11-4b 合一行）：

| 既有行 | 交互面 | 本门后是否失效 | 判 |
|---|---|---|---|
| 11-1 | `compressIfNeeded` 阈值面 ↔ provider 桩 | 否——显式压缩线 750,000、固定开销小，`post ≈ 开销 + 尾部 ≤ 15% 窗口 + 1K ≪ 750,000` ⇒ 门放行，触及时刻不变 | 保留，不改 |
| 11-2 | 守卫 `enforceContextFit`（`force:true`）→ 摘要超长 | 否——`force` 全文豁免；且事前估算只能取摘要 1K，压前不可能知道摘要实际长度（见上「`note` · 残余方向」） | 保留，不改 |
| 11-3 | 守卫（`absent` 档两半段 ∥ 退化档地板） | 否——强压面走 `force`；未越线半段本就零压缩 | 保留，不改 |
| 11-4a ∥ 11-4b | 400 自适应链（`turn-loop` 传 `{ forceCompact: true }`） | 否——链三走 `force`，门不参与 | 保留，不改 |
| 11-5 | 守卫（恢复样本后按 `limit` 判） | 否——门不改 `limit`，守卫面一轮强压 | 保留，不改 |

**冗余判定：无**——五行各占一面（阈值面 · 守卫面 · `absent` 档 · 自适应重试 · 跨进程校准；11-4a ∥ 11-4b 同占自适应面），删任一行即有一面失守。

**缺行（本门新增；编号已在 `test/RTM.md` 故事 11 定下，落行后按同号写 `test('11-N …')`）**：

| 编号 | 怎么做（用户进入点） | 怎么算通过 | 交互面 | 回指 |
|---|---|---|---|---|
| 11-6 | CLI 会话用 128,000 窗档（压缩线 76,800），provider 桩带巨型工具 schema 使 `system + tools` 估算 > 76,800、`history` 仅数条短消息（复刻 `#1833` 现场），发一条消息 | 同左案例表 11-6 行 | `compressIfNeeded` 阈值面 ↔ provider 桩 | 台账 `#1833` ∥ `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 |
| 11-7 | 同一档，`history` 堆出足量可摘中段，使 `history − middle + 注记 + 占位 + 开销` 的估算 ≤ 76,800，再发一条消息 | 同左案例表 11-7 行 | 同上 | 同上 |
| 11-8 | 模型主动 `context{action:'compact'}`，且压后仍超线下 | 同左案例表 11-8 行 | `context` 工具 → `compressIfNeeded`（`force` 面） | `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 F-CC2（模型主动压缩携要求 = `force` 面的业务面）∥ 设计 §6.16.2 |
| 11-9 | 单条巨型消息超 `OVERSIZE_CONTENT_LIMIT`、无中段可摘 | 同左案例表 11-9 行 | `splitHistory` 无中段支 → `shrinkOversized` | 设计 §6.5（降级链）——本条只守「门不误拦降级路」，无独立需求条目（降级路 = 实现面兜底） |

**未覆盖面（如实登记）**：11-6–11-9 已落在 `test/integration/context-overflow-guard.test.mjs`（423 行，与 11-1–11-4b 同档）⇒ 本门已有对应用例。仍未覆盖的一格 = `_tokRatio` 校准抬升后 `post` 变大、门更早生效——无现场读数。

**守卫（兜底，非主修）**：落点 = `thincoder-core/agent/run-stages.mjs:137`（`runCompactionCheck` 尾部，阈值面 `catch` 块 `:135` 闭合之后；`:141` 取 `requestBudget`、`:143` 判据、`:147` 强压、`:156` 二次判并抛）。

判：`usage = contextUsage(agent, ctx.compactionOverhead)`（`thincoder-core/token-window.mjs:134`——压缩后 `_lastPromptTokens` 为 null ⇒ 走 estimated 支）+ `budget = requestBudget(agent.provider)`；

**判据 = `usage.total > budget.limit`**（无档次门，`absent` 档同样判）⇒ ① 以 `{ ...compactionOverhead, force: true }` 调 `compressIfNeeded` 一次（先压再判）；

② 再估一次，仍超 ⇒ 抛 `Error`（`kind = "context_overflow"` · `retryable = false` · message 带 prompt / max_tokens / 窗口 三实数）、**不发请求**。不截断、不静默削输出；成功记账与阈值面共用同一段（`:99-107`）。

- **判据为什么不用 `maxTokens`**：未发 `max_tokens` 的三面该字段 = `undefined` ⇒ `usage.total + maxTokens` = `NaN`，而 `NaN > window` 恒 false ⇒ 守卫在「未设显式 `max_tokens`」的常规配置下永不开火，兜底面静默失效。`limit` 由 `reserve`（`maxTokens ?? spec.maxOutput`）定义 ⇒ 恒为数；该判据与「prompt 估算 + 实发 `max_tokens` > 窗口」等价。
- **射程（全档）**：`absent` 档客户端不写 `max_tokens`、服务端按其默认输出办 ⇒ 预留仍按规格 `maxOutput` 保守假设（§6.2）；该档 `limit` 取地板 `max(window − reserve, threshold)`，判据对全档生效。
- **地板为什么是 `threshold`**：`reserve < window` 时 `usable = window − reserve > 0` ⇒ `threshold = min(usable, 0.6w) ≤ usable` ⇒ 地板恒不生效，与裸式 `window − reserve` 逐位相同；只有 `reserve ≥ window` 的退化行（`doubao-seed-2-1-turbo-260628`：256,000 窗 / 256,000 规格输出——官方口径就是 256K 窗口 / 256K 最大回答）从裸式 0 抬到 ⌊w/2⌋ = 128,000——裸式下任何 prompt 都判真、该档永久发不出去。既不像裸式那样恒真抛错、也不放开越窗。

  **地板不取 `reserve` 封顶**：封顶会改 `reserve` 的公开语义（uncapped）；地板只动 `limit` 一个字段，`reserve` / `usable` / `threshold` 逐位不变。
- **发送面净判（第二道，覆盖四个装配面）**：落点 = 四面各自既有的估算点，在既有 `estimated` 上取输入侧即得判据值——`estimated` 只作中间量，进入判据的是 `estPrompt`（定义见下一段）；`provider/core.mjs:257-260`（OpenAI 兼容）· `provider/anthropic.mjs:212-214` · `provider/google.mjs:123-125` · `provider/responses.mjs:232-234`。

  判 = `estPrompt > requestBudget(provider).limit` ⇒ 抛 `context_overflow`（prompt / max_tokens / 窗口三实数）、**零 fetch**。

  **`estPrompt`（四面同一定义）** = `estimateRequestTokens(X) − (body.max_tokens ?? 0)`——凡 body 带 `max_tokens` 就减，一个定义对四面生效。

  为什么要减：`estimateRequestTokens` 把 `body.max_tokens` 计入（`provider/rate.mjs:80`）；不减则 `est = prompt + maxTokens`，而 `limit = window − reserve` ⇒ 判据实际成 `prompt > window − 2·reserve`，白扣一份预留。

  逐面取值（四面同形）：`X = { messages, tools }`——调用方的全量输入侧。

  - OpenAI 面：body 仅在显式时带 `max_tokens` ⇒ 仅显式档减该项。
  - anthropic 面：body 恒带 `max_tokens` ⇒ 恒减该项。**X 不能取 `body`**：该面的 system 是 body 顶层字段 `body.system`，而 `estimateRequestTokens` 只走 `body.messages`（`provider/rate.mjs:69-82`）⇒ 取 `body` 会漏整块 system，`claude-sonnet-4` 档最坏可放行真实越窗请求。
  - `google` / `responses` 面：body 用 `maxOutputTokens` / `max_output_tokens`，无 `max_tokens` 键 ⇒ 减项恒 0。

  三面的既有估算原先只投影 `{ messages }`（漏了 `tools`），本批补上。

  **anthropic 面边界可算**：`claude-sonnet-4`（200,000 / 32,000）⇒ `limit` 168,000、压缩线 120,000 ⇒ 判据 = `prompt > 168,000`；若按「既有 `estimated` 直接判」则为 `prompt + 32,000 > 168,000` ⇒ 判在 136,000——该线已在压缩线 120,000 之上，误拒段整体落在「会先压缩」的区间，后果从「误拒本可发出的回合」收窄为「压缩失败后仍被拒」；判据语义仍错，`estPrompt` 的减法照做。

  同一个 `estPrompt` 随 result 返回给自校准采样（`den` 同口径，见「估算自校准」），不另算一次。

  为什么落四面而不是 `chat()`：`chat()` 的入参只有 `messages` / `tools` / `logCtx`（`core.mjs:84`），没有 body、取不到输出预算字段；body 在四面各自组装。
- **豁免面（内部阶段）**：`logCtx.stage ∈ {"compress", "distill"}` ∥ `logCtx.isContinuation === true` ⇒ 跳过本判。标签已存在：`context.mjs:209`（`stage:"compress"`）· `explore-distill.mjs:104`（`stage:"distill"`）· `provider/core.mjs:314`（`isContinuation:true`），零新增机制。
  为什么必须豁免：压缩请求自带≈整段历史（`context.mjs:203-215`，且不传 `max_tokens`），判它 = 判掉「越线后用来把上下文降下来」的那一次调用 ⇒ 压缩必败、止血落空。
  残余风险：该次压缩仍可能被服务端判越窗 ⇒ 走既有失败链（三次后 `compressFallback` 确定性截断、零网络），回合请求随后才发；不静默、也不再重复付费三次。
- **HTTP 400 越窗分类**：同一文件错误出口按报文特征（`maximum context length` / `context_length_exceeded` / `prompt is too long`）标 `kind = "context_overflow"` · `retryable = false`；未命中 ⇒ 原样抛（不发明分类）。
  词表复用同族既有分类（`provider/errors.mjs:122-123`：`classifyResponsesErrorCode("context_length_exceeded")` ⇒ 同 kind、同 `retryable:false`、同 `/compact` 提示）——本处只把作用面从「Responses 流内帧」扩到「HTTP 级 4xx」，不新增词、不新增码表。
- **估算自校准（池化比，无门槛分支）**：`agent._tok = { key, num, den, est }`，`key = provider.format + ":" + provider.model`、`est = ESTIMATOR_VERSION`（估算口径版本，单源 = `provider/rate.mjs`）；每次成功响应后 `num += usage.prompt_tokens`、`den += estPrompt`（= 上条四面同一定义的输入侧估算；分子分母同口径）⇒ `_tokRatio = agent._tok.den > 0 ? Math.max(1, agent._tok.num / agent._tok.den) : 1`。
  **下界 = 1**：已知偏差方向是低估；比 < 1 会把整条估算缩小、重开「该压没压」——保守方向不能取，且 1 = 未校准时的那一档，不是新魔数。

  `key` 变 ⇒ 归零重采（`thincoder-core/token-window.mjs:165` `recordTokenSample`，切模型自清，不必逐处接线四个刷新点）；`/new` 清空（`thincoder-core/session-lifecycle.mjs:326-327`）。跨进程恢复 = 6.17.1 链二：样本随会话槽走，`est` 或 `key` 不符即弃。

  **初值落 `thincoder-core/agent.mjs:76` 的构造字面量**（`_tok: null, _tokRatio: 1`）。初值不落 `agent/setup.mjs`：该函数是每 run 的 pre-flight（`prepareRun`，`runAgent` 每条用户消息调一次）⇒ 校准比会每条消息归零、池化比永远单样本，本条在生产面失效。

  作用面：`contextUsage` 的估算支乘、实测支的增量项乘（§6.3）；`_lastPromptTokens` 不乘。

  为什么不用 EWMA + 样本门槛：门槛要一个无现场的魔数（首轮短 prompt 的 ratio 落值本案无读数）；池化比按样本自身大小加权，小样本自带小权重、动不了比值，分支因此消失。

**先例行（③）**：先例 = 同算式族三件——`outputReserve`（`thincoder-core/config.mjs:59-62`）· `usableWindow`（`:70-74`）· `resolveCompactThreshold`（`:116-120`）；对应设计节 = §6.2（阈值链 / 逐档表）∥ §6.13（阈值档位）∥ §7 D-CC30。

对齐 = 单一算式族、按 `providerSpec` 随 provider 随动、`usableWindow` 退化守卫原样复用；偏离 = 由「预算面 ∥ 发送面」两条路并成一条 `requestBudget`（发送面只读 `maxTokens`）、预留去 25% 封顶（残余带归零）、auto 派生值不再进显式键。

**先例行（本批四条 · 前置三条）**：

下列前三条属 D-CC32（请求预算单源 · 上一批），列此只为与本批同算式族对齐；本批四条 = 后三条 + 端面一条。

- `limit` 地板：先例 = `usableWindow` 的半窗退化（`config.mjs:72-76`，预留 ≥ 窗口 ⇒ 折半而非归零）。对齐 = 同一判据「非物理输入给可用的下界」；偏离 = 地板落 `limit` 字段、折半落 `usable` 字段，两处不重叠。
- 估算自校准：先例 = `recordRate`（`provider/rate.mjs`，用服务端 `usage` 校正记账）。对齐 = 只信服务端给的数；偏离 = 回填的是比值而非绝对量、且只作用于估算支。
- 400 越窗分类：先例 = `classifyResponsesErrorCode` 的 `context_length_exceeded`（`provider/errors.mjs:122-123`）。对齐 = kind / retryable / 提示逐字复用；偏离 = 作用面从流内错误帧扩到 HTTP 级 4xx。
- 估算基准系数（6.17.1 链一）：先例 = `docs/core/design/ADVISOR-GUARDS.md` §9 的估算加权（CJK 面，同族「估算要贴近真实用量」）。对齐 = 单一估算函数、零新配置面；偏离 = 该节改 CJK 权重，本批改 ASCII 系数（两面不重叠，各自消费同一个 `estimateText`）。
- 校准样本持久化（6.17.1 链二）：先例 = 会话槽字段族（`saveSession` 的 `fields` 对象，`thincoder-core/session.mjs:128-150`）。对齐 = 复用槽写守卫与轮转、恢复走 `applySession`；偏离 = 不设 `persistEngTokens` 式的「当场落盘」通道——样本丢一次只退化到旧值或 1，不是需要即刻落盘的安全项。
- 越窗自适应（6.17.1 链三）：先例 = 本节守卫的「强压一次 + 再判」（`thincoder-core/agent/run-stages.mjs:158` `enforceContextFit`）。对齐 = 复用同一压缩原子与同一失败链；偏离 = 触发点从事前估算改为服务端 400，且紧随一次重试。
- 链二端面（6.17.1 链二端面）：先例 = 核会话槽字段族（`thincoder-core/session.mjs:128-150` 的 `fields`）∥ VSC 槽键同式（`panel-session-write.mjs:110` `pendingReminders` 的三目）。对齐 = 同一 `tokenSampleOf` / `restoreTokenSample`、同一四条校验（两端不分叉）；偏离 = 端侧写面**逐键构造**（无 `...extra` 泛 spread ⇒ 须显式接键）、读面 `provider` 由装配面第三参注入（`agent._provider` 在 `setup.mjs` 到 `:228` 才落 ⇒ 该点取不到 agent 上的 provider）。

**既有件三问（本批涉及的名字）**：

- `context_overflow`：`existing: provider/errors.mjs:122-123` · 逐字名 `"context_overflow"` · 消费者 = 按 `kind` 决策的上层（本批两个出口：本地净判、HTTP 400 分类）。
- `estimateRequestTokens`：`existing: provider/rate.mjs:69-82` · 消费者 = 四面既有估算点 + `recordRate`；本批不新增算式，只在 `google` / `responses` 两面补 `tools` 项。
- `_tok` / `_tokRatio`：`none found`（查过 `provider/` 与 `agent/`：`_lastPromptTokens` / `_usageAtLen` 是实测基线，职责不同）· 逐字名 `_tok`（`{key,num,den}`）∥ `_tokRatio`（派生比）· 消费者 = `token-window.mjs` 的 `contextUsage` ∥ `turn-loop.mjs` 采样；清空点 = `/new` + `key` 变自清。
- `chat` 结果 `estimated`：`existing` 值、新增出口——四面各自已有 `estimated` 变量，本批把它随 result 返回供采样；`none found` 于「result 携带估算」这一出口。
- `ASCII_CHARS_PER_TOKEN`：`none found`（查过 `provider/rate.mjs` 全文——`_estimateSingle` 现体是字面量 `/ 4`，无同名常量；`IMAGE_TOKEN_ESTIMATE` / `SUMMARY_TOKEN_ESTIMATE` 住 `token-window.mjs`，是别的量）· 逐字名 `ASCII_CHARS_PER_TOKEN`（值 3）· 消费者 = `_estimateSingle` 单点 + 本批单测。
- `ESTIMATOR_VERSION`：`none found`（查过 `provider/` 与 `token-window.mjs`：无版本位）· 逐字名 `ESTIMATOR_VERSION`（值 1）· 消费者 = 链二校验②（样本 `est` 比对本值）∥ 写面 `agent._tok.est`。
- `estimateSample`：`none found`（查过 `session.mjs` 的 `fields` 键集：`version` / `cwd` / `title` / `activeProvider` / `activeModel` / `updatedAt` / `tasks` / `planMode` / `autoApprove` / `engineering` / `…engTokenSlotFields` / `goal` / `advisor` / `pendingReminders` / `sessionStart`——无同名键）· **第二写入面（VSC 槽对象）同答**：`panel-session-write.mjs:71-122` 逐键构造的键集（`version` / `cwd` / `updatedAt` / `title` / `activeProvider` / `history` / `contextHistory` / `display` / `tasks` / `planMode` / `goal` / `autoApprove` / `advisor` / `engineering` / `engDesignTokens` / `pendingReminders` / `sessionStart` / `activeModel`，另加 `...existing` 泛 spread）无同名键 · 两端消费者 = 写 `tokenSampleOf`（`session.mjs:150` 的 `fields` ∥ `run-helpers.mjs:76` `agentState`）· 读 `restoreTokenSample`（`session-lifecycle.mjs:215`/`:221` ∥ `agent-state.mjs:120-124` restore 支）。
- `tokenKey()`：`existing but 抽出`——现体 = `thincoder-core/token-window.mjs:159`（拼 `format:model` 键）· 两消费者（`recordTokenSample` ∥ 链二校验③）· 逐字名 `tokenKey`。
- `tokenSampleOf()`：`none found`（查过 `token-window.mjs` 导出面与 `session.mjs` 的 `fields` 构造：写面原无独立取值函数，样本形态由 `saveSession` 内联拼装则会把校验与拼装分居两档）· 逐字名 `tokenSampleOf`（`thincoder-core/token-window.mjs:188`）· 消费者 = `saveSession` 的 `fields.estimateSample` 单点（`session.mjs:150`）∥ VSC 端 `agentState()`（`thincoder-vscode/src/agent/run-helpers.mjs:76`）。
- `restoreTokenSample()`：`none found`（同一查面；`applySession` 原无样本读回逻辑）· 逐字名 `restoreTokenSample`（`thincoder-core/token-window.mjs:200`）· 消费者 = `applySession` 两个出口（`session-lifecycle.mjs:215` A 支 ∥ `:221` B 支，均在 `provider` 落定之后）∥ VSC `applySlotSessionState` restore 支（`thincoder-vscode/src/agent/agent-state.mjs:120-124`）。
- `enforceContextFit()`：`existing but 抽出`——现体 = `thincoder-core/agent/run-stages.mjs:158`（守卫段：`requestBudget` 判 → 强压一次 → 再判 → 抛三实数）· 两消费者 = 守卫（`run-stages.mjs:146`，不传第三参）∥ 链三 catch（`turn-loop.mjs:66-68`，传 `{ forceCompact: true }`）。
- `_overflowRetried`：`none found`（查过 `agent/` 与 `agent.mjs`：`_compressFailures` 是摘要三连败计数、`_pendingCompact` 是排队槽——语义都不同）· 消费者 = 链三 catch（置位 / 判位）∥ `agent/setup.mjs` pre-flight 复位。

**用例表（实施轮单测）**：

| # | 情形 | 输入 | 期望（机判） |
|---|---|---|---|
| RB1 | 正常 · 显式 | `{ model: "deepseek-flash", maxTokens: 393_216 }` | `maxTokens` 393,216（`explicit`）· `reserve` 393,216 · `window` 1,000,000（`spec`）· `usable` 606,784 · `threshold` 600,000（比例项胜出）· `limit` 606,784 |
| RB2 | 边界 · 未发 | `{ model: "kimi-k3" }`（无 `maxTokens`） | `maxTokens` `undefined`（`absent`）· `reserve` 131,072 · `threshold` 600,000 · `limit` 868,928 |
| RB3 | 边界 · 未登记模型 | `{ model: "no-such-model" }` | `spec` = DEFAULT_SPEC（128,000 / 32,000）⇒ `usable` 96,000 · 比例项 76,800 ⇒ `threshold` 76,800 · `limit` 96,000 |
| RB4 | 边界 · 预留 = 窗口（半窗退化） | `{ model: "doubao-seed-2-1-turbo-260628" }`（256,000 / 256,000） | `reserve` 256,000 = 窗口 ⇒ `usable` 128,000 · `threshold` 128,000 · `limit` **128,000**（absent 地板）· `maxTokensSource` `absent` ⇒ 守卫覆盖：估算 100,000 ⇒ 零压缩零抛、请求照发（不带 `max_tokens`）；估算 130,000 ⇒ 强压一次 |
| RB5 | 边界 · 显式预留 > 窗口 | RB4 同档 + `maxTokens: 300_000` | `usable` 128,000 · `threshold` 128,000 · `limit` −44,000 · `maxTokensSource` `explicit` ⇒ 判据 `total > −44,000` 恒真 ⇒ 压缩一次后仍超 ⇒ 抛（三实数）、回合请求零发 |
| RB6 | 正常 · 发送面同源 | 四 transport 各一发（`fetch` 桩） | 请求体的 `max_tokens` / `maxOutputTokens` / `max_output_tokens` === `requestBudget(...).maxTokens`（anthropic 无显式 ⇒ `spec.maxOutput`） |
| RB7 | 正常 · 显示面 auto | 盘上无 `agent.compactThreshold`（deepseek-flash + 393,216） | `compactThresholdAuto` `true` · `compactThreshold` `undefined` · `compactThresholdResolved` 600,000 · `/config` 三处含 `600000 (auto)`、编辑初值 `600000`、全屏**不含** `100000`（旧默认假线退场） |
| RB8 | 边界 · 显示面显式 | 盘上 `agent.compactThreshold: 700_000` | `auto` `false` · `resolved` 700,000 · `/config` 无 `(auto)` 后缀 |
| RB9 | 错误 · 守卫触发 | deepseek-flash + `maxTokens: 393_216`（`limit` 606,784）+ prompt 估 610,000 | 判据 `610,000 > 606,784` 真 ⇒ 强制压缩一次（`fetch` 桩 `stage:"compress"` 一次）；压缩后仍超 ⇒ 抛（三实数）且回合请求零发 |
| RB10 | 正常 · 守卫不误伤 | 同 RB9，prompt 估 500,000 | 判据 `500,000 > 606,784` 假 ⇒ 零压缩、零抛、请求照发 |
| RB11 | 错误 · 未发档越线必判 | `{ model: "doubao-seed-2-1-turbo-260628" }`（无 `maxTokens`）+ prompt 估 200,000 | `limit` 128,000 ⇒ 判真、强压一次；压后仍超 ⇒ 抛 `context_overflow`（三实数）、**回合请求零发** |
| RB12 | 正常 · 回 auto（写回面） | 盘上 `agent.compactThreshold: 700_000` ⇒ `/config` 数值项输入 `auto` | 盘上键**消失**（`delete` 后经 `persistRaw` 落盘）· `compactThresholdAuto` `true` · `compactThresholdResolved` = 派生值 · 显示 `<resolved> (auto)`、编辑初值 = 同值；输入 `700000` 仍建显式键；输入 `abc` ⇒ 报错行、零落盘；空输入 ⇒ 取消、零落盘 |
| RB13 | 边界 · 报错文案射程 | 同一菜单内 `agent.maxTurns` 输入 `abc`（对照 RB12 的 `agent.compactThreshold`） | `agent.maxTurns` 报错行仍为 `Value must be a number`（不含 `auto` 子句）——仅 `agent.compactThreshold` 一项带新句 |
| RB14 | 正常 · auto 档提示句 | `compactThresholdHint(true)` | 返回 ` — 输入数值即固定为显式阈值`；装配串含该句 ∧ 不含 `输入 auto` |
| RB15 | 正常 · 显式档提示句 | `compactThresholdHint(false)` | 返回 ` — 输入 auto 回到自动派生（删键）`；装配串含该句 ∧ 不含 `输入数值` |
| RB16 | 端到端 · 装配行逐字 | `/config` 数值项 `agent.compactThreshold`，auto 档 `compactThresholdResolved` = 600000 | `askQuestion` 收到的串逐字等于 `agent.compactThreshold (current: 600000 — 输入数值即固定为显式阈值):` |
| RB17 | 错误 · absent 档守卫开火 | `{ model: "deepseek-flash" }`（无 `maxTokens`；`window` 1,000,000 / `maxOutput` 384,000）+ prompt 估 620,000；`fetch` 桩按 `logCtx.stage` 分计 | `limit` 616,000 · `maxTokensSource` `absent` ⇒ 判真、`stage:"compress"` 的 `fetch` **恰 1 次**；摘要桩返回 4,000-token 摘要后回合请求 `fetch` **1 次**（估算已落线下） |
| RB18 | 正常 · absent 档不误伤 | RB17 同档 + prompt 估 500,000 | 判据假 ⇒ 零压缩、零抛、请求照发 |
| RB19 | 正常 · 估算自校准（池化比） | 桩 body 逐字 `{ model:"deepseek-flash", messages:[{ role:"user", content:"x".repeat(4000) }], max_tokens:2000 }` ⇒ `estimateRequestTokens(body)` = 1,334（messages，`ceil(4000/3)`）+ 2,000（输出）= 3,334；桩响应 `usage.prompt_tokens := 2 × (estimateRequestTokens(body) − body.max_tokens)` = 2,668 | `_tokRatio` = 2,668 ÷ 1,334 = **2.0**（±0.01）；次轮 `contextUsage().total` 的估算支 = 同 history 未校准值的 2 倍 |
| RB20 | 边界 · 发送面净判（四面） | 四面各发两个 body（`logCtx.stage` 缺省）：① `estPrompt = limit` ② `estPrompt = limit + 1`；anthropic 面的 body 恒带 `max_tokens` | ① 四面均**放行**（`fetch` 各 1）② 四面均抛 `kind === "context_overflow"`、`retryable === false`、`fetch` 0。anthropic 用 `claude-sonnet-4` 档验边界：`estPrompt` = 168,000 放行、168,001 抛（不得判在 136,000） |
| RB21 | 正常 · 内部阶段豁免 | 同一越线 body，一次 `logCtx.stage:"compress"`、一次 `logCtx.isContinuation:true` | 两次均**不抛**、`fetch` 各 1 |
| RB22 | 错误 · 压后仍超的确定夹具 | RB17 同档；摘要桩返回 900,000-token 量级内容（`"y".repeat(2_800_000)`，ASCII ⇒ `ceil(2.8e6/3)` = 933,334）⇒ 压后估算仍 > 616,000 | 抛 `context_overflow`（三实数）、**回合请求 `fetch` 0 次**；`stage:"compress"` 的 `fetch` 仍为 1 |
| RB23 | 边界 · 切模型自清 | 采到 `_tokRatio` = 2.0（key `openai:deepseek-flash`）后改 `provider.model = "kimi-k3"` 再采一样本 | `key` 变更 ⇒ `num` / `den` 归零，`_tokRatio` 只由新样本决定（不含旧 2.0 权重） |

**6.17.1 估算保真与越窗自适应（三条链）**

- **定位**：三条补链治同一个失败——`limit` 是对的，估算低报 47% 让守卫放行、服务端 400（现场读数：服务端报 messages 723,272，同刻状态栏 491k）。各治一段：链一改基准、链二让校准跨进程活着、链三是服务端说「你超了」之后的唯一动作。
- **公开源勘察（本批）**：`index.publicRepos` 为空表（`PROJECT-MANIFEST.json`）；仓内查过本节 ∥ `docs/core/design/ADVISOR-GUARDS.md` §9（估算加权，同族先例）∥ `docs/core/design/PROVIDER.md`。无外部一手文档输入——本案第一手读数 = 用户 400 报文与其同刻状态栏读数，逐字在批档 §1，不引外站。

**链一 · 估算基准（ASCII 字符/token：4 → 3）**

- 落点 = `thincoder-core/provider/rate.mjs:70-74` 的 `_estimateSingle`：`Math.ceil(ascii / ASCII_CHARS_PER_TOKEN) + nonAscii`；常量 `ASCII_CHARS_PER_TOKEN = 3` 与公式同住 `thincoder-core/provider/rate.mjs`（单源——§6.3 与 §6.17 只指本条，不另写系数）。CJK 仍 1 字/token（该侧是保守方向，不动）。
- 依据（实测反推）：失败现场服务端报 `723,272` in messages，同刻状态栏 `491k` ⇒ 实际约 **2.7 字符/token**；`/4` 低报 1.47 倍，`/3` 把残余偏差压到约 1.1，余下交给链二按模型自校准。
- 常量而非配置项：估算系数是产品内部口径，不是用户参数——零新配置面（与 `ADVISOR-GUARDS.md` §9 同口径）。
- 读数面影响（用户可见）：状态行 ctx%、`context` 工具 stats、压缩触发时刻，按估算值抬升约 1/3（ASCII 主体）——这是**收正**，不是回归；`requestBudget` 的 `threshold` / `limit` 由窗口派生、不乘估算，逐值不变。
- 同一估算函数的两个连带消费面（同幅上抬约 1/3，方向同样保守，判据与配置面零改）：① TPM/RPM 闸（`thincoder-core/provider/rate.mjs:103` 告警支 · `:107` 置 `tpm = null` · `:117` 超 `effectiveTpm` ⇒ 告警 + 记账 + 直接放行）——`tpm` 落在旧 / 新估算之间的渠道改走放行支；② prune 门槛与 tail 预算（`thincoder-core/token-window.mjs:262` `PRUNE_MIN_TOKENS = 200`，判据 `:280`；`tailBudgetTokens` `:55`，消费于 `thincoder-core/context.mjs:201` / `:272`）——prune 合格集变大、tail 更早收紧。
- `ESTIMATOR_VERSION` 同住本档（当前 `1`）：链二的样本只在同版本内复用，改公式即自动弃旧样本。

**链二 · 校准样本持久化（跨进程不再回到 1）**

- 问题：`_tokRatio` 是进程内变量；大会话恢复后首请求必回 1 ⇒ 估 491K < `limit` 606,784 ⇒ 放行 ⇒ 400 ⇒ 拿不到 `usage` ⇒ 永远校准不了。
- 形态：`agent._tok = { key, num, den, est }`（`est` 见链一）。
- 写面：回合尾 `saveSession` 的 `fields` 对象增 `estimateSample`（`thincoder-core/session.mjs:128-150`）；`agent._tok` 为空 ⇒ 写 `null`。不新增写路径、不新增文件、不逐样本落盘。`estimateSample` 为新增槽键（`fields` 键集无同名键——三问块在场）。
- 读面：`applySession`（`thincoder-core/session-lifecycle.mjs:92`）读回并写 `agent._tok` / `agent._tokRatio`。
- 校验四条（任一不满足 ⇒ `_tok = null`、`_tokRatio = 1`，即既有未校准档）：① 形状 `{key,num,den,est}`，`num` / `den` / `est` 有限且 `den > 0`（**现场** = 槽档是盘上用户数据，同函数已对 `history` 逐字段防御——`session-lifecycle.mjs:99` `Array.isArray(data.history) ? data.history : []`；**复现** = 把槽 JSON 的 `estimateSample` 改成 `{"key":"openai:x","num":"NaN","den":0}`（槽路径 = `slotPath(cwd, slot)`）⇒ 恢复 ⇒ 比回 1、会话照常恢复，不抛）；② `est === ESTIMATOR_VERSION`（口径变了，旧样本的 `den` 与新估算不同量纲，不复用）；③ `key === tokenKey(provider)`（恢复后模型已换 ⇒ 不复用，与 `recordTokenSample` 的 key 自清同判据——`tokenKey` 导出为单源）；④ `num/den < 1` 不必单独判，由 `max(1, …)` 兜底。
- 作用域 = **本会话**，不跨会话共享：死锁就发生在单会话恢复这一面；跨会话池会把别的项目、别的任务的样本带进来，取用那一刻没人能判断它是否还成立。
- **端面（双端同接）**：采样面双端同一处——VSC 主循环 2026-09-29 已归核（`thincoder-vscode/src/extension/panel-turn-loop.mjs:230` `runAgent(agent, turnInput, callbacks, coreOpts)`），`recordTokenSample` 全仓唯一调用点住核循环（`thincoder-core/agent/turn-loop.mjs:221`）⇒ VSC 同样产样本。缺口只在端侧写 / 读：① 写 = `agentState()`（`thincoder-vscode/src/agent/run-helpers.mjs:76`）只返 `engineering` / `advisorGuard` / `engDesignTokens` / `tasks` / `goal` / `pendingReminders`，不带 `estimateSample`；② 槽写 = `saveLines`（`thincoder-vscode/src/extension/panel-session-write.mjs:71-122`）逐键构造槽对象、无 `...extra` 泛 spread ⇒ ①的值不显式接进来就不落槽；③ 读 = `applySlotSessionState`（`thincoder-vscode/src/agent/agent-state.mjs:89`）的 `restore` 支只回填 `_tasks` / `_goal` / `_pendingReminders`，不读回 `_tok` / `_tokRatio`。
- **端面补法（四处各一行，核已导出两面函数）**：① `agentState()` 增 `estimateSample: tokenSampleOf(agent)`（随 `panel-callbacks.mjs:269` `{ seed: slotStamp, ...agentState }` 到 `extra`）；② `saveLines` 槽对象增显式键 `estimateSample: extra.estimateSample !== undefined ? extra.estimateSample : (existing.estimateSample ?? null)`（与 `pendingReminders` `:110` 同式）。**键缺席支的现场 = 五处不携 agentState 的保存**：`panel-turn-loop.mjs:275`（`{ seed: slotStamp }`）· `panel-turn-stages.mjs:134`（`{ seed: slotStamp, title? }`）· `suspension.mjs:315`（`{}`）· `timer-watch.mjs:36`（不传 `extra`——取 `panel-chat.mjs:342` 的缺省 `{}`）· `panel-messages.mjs:259`（`{ activeProvider, activeModel }`——切模型保存）。这五处手里没有 agent ⇒ 没有样本可取；收成单表达式（`estimateSample: extra.estimateSample`）会把 `undefined` 写进整档覆盖 ⇒ 键随序列化消失、槽内既有样本被抹掉（本函数注释自陈槽档是 full-overwrite，`panel-session-write.mjs:48-51`）。键在场（`panel-callbacks.mjs:269` `{ seed: slotStamp, ...agentState }` ∥ `:284` `...lastAgentState`）⇒ 内存即权威：空样本 `null` 照写（与 `saveSession` 同语义），跨模型的旧样本由校验③ 自清；③ `restore` 支调 `restoreTokenSample(agent, slot?.estimateSample, provider)`，该支的 `provider` 由装配面第三参传入（`applySlotSessionState` 住 `thincoder-vscode/src/agent/setup.mjs:193`，`agent._provider` 到 `:228` 才落 ⇒ 该点取不到 agent 上的 provider）；④ 装配面 `thincoder-vscode/src/agent/setup.mjs:193-197` 的第三参对象 `{ cfg: cfgBag, restore }` 增 `provider`（形参已在作用域 `:90`，原位一参、行数不变）。**④ 为什么必须在内**：`provider` 是第三参的**新键**——不传 ⇒ `tokenKey(undefined)` ⇒ 校验③ 恒不符 ⇒ 端比恒 1 ⇒ 端面修复在生产面静默失效；而 RB34 若自己直传 `provider` 仍绿（绿着漏）。**调用点全集 = 1 处**，即 ④ 的改点（`thincoder-vscode/src` 全量 grep：仅 `setup.mjs:193` 一处调用；`thincoder-vscode/test` 无直接调用）。**`provider` 缺省落值 = 比 1、不抛**（④ 漏接后的退化档，非生产形态）：`tokenKey(undefined)` 经两处 `?.` 兜底产出 `"openai:"`（`thincoder-core/token-window.mjs:159-161`），与采样期写入的 `"<format>:<model>"` 键恒不等 ⇒ 校验③ 判不符；`restoreTokenSample` 入口已先置 `_tok = null` / `_tokRatio = 1`（`:202`-`:203`）⇒ 忘传第三参只退化到未校准档，不抛、不误用样本。VSC 不经核 `applySession`（`panel-session.mjs:94` `activeLines` 槽直读组装机读线，§6.10 #8）——这是端侧自设这四处的原因，不是缺样本的原因。四条校验与作用域同核读面（同一函数，不分叉）。
- 失败链自愈：越窗 ⇒ 压一次 ⇒ 重试成功 ⇒ 该次 `usage.prompt_tokens` 照常走 `recordTokenSample`（`thincoder-core/agent/turn-loop.mjs:221`）入池——失败链自己也把比值刷一次。
- 否决备选：**每次 `recordTokenSample` 直接落盘**（每模型调用一次写盘，且绕开槽写守卫与轮转 = 新开一条写面）· **独立校准档**（新生命周期：GC、损坏、多实例并发；换来的只是「跨会话共享」——一条不想要的语义）· **`/new` 与切模型时保留旧样本**（现语义是清空，不动）。

**链三 · 越窗 400 自适应（事后第三道）**

- 现状：`markContextOverflow`（`thincoder-core/provider/errors.mjs:166-175`）识别三渠道报文后只标 typed 错误（`kind = "context_overflow"` · `retryable = false`）就抛出，无动作。
- 落点 = `thincoder-core/agent/turn-loop.mjs:55-72` 的 `callTurn` 包装（两个 `callModelTurn` 调用点：`:57` 首调用 ∥ `:70` 重试）：`error.kind === "context_overflow"` ⇒ ① 强制压缩一次；② 重试同一回合调用一次。
- 压缩原子 = 本节守卫的同一段——抽为 `enforceContextFit(agent, ctx, { forceCompact })`（`thincoder-core/agent/run-stages.mjs:158`，以 `{ ...overhead, force: true }` 调 `compressIfNeeded` 一次），守卫（`run-stages.mjs:146` 不传第三参）与链三（`turn-loop.mjs:66-68` 传 `{ forceCompact: true }`）共用，不复制。
- **第三参 `forceCompact` 的语义**：`true` ⇒ **跳过前置估算判据**（`usage.total > budget.limit`）直接强压一次——服务端已判越窗时估算准不准不再作门（死锁现场估 491K < `limit` 606,784，按估算开门会压 0 次、重试同一请求再吃 400）；缺省 `false` ⇒ 守卫面原行为逐字不变。压后「再判仍超 ⇒ 抛三实数」两面同判（压后仍越线说明压缩解不了，再压只是重复付费）。
- 压多少：**整压一次，不按报文反推收缩量**。压缩机产出有确定上界（tail ≤ 窗口 15% + 摘要 ≈1K，§6.4④），一次已足够把 723K 的输入压回线内；反推则要写三渠道的数字解析（只有 OpenAI 兼容面拿到过逐字样本，另两面无数值形样本），解析失败还要一条降级支。
- 重试几次：**一次**。第二次仍越窗 ⇒ 原 typed 错误透传（三实数 + `/compact` 提示已在报文体里），不静默、不截断。
- 死循环守卫：`agent._overflowRetried`，run 起点复位（`thincoder-core/agent/setup.mjs` 的 pre-flight，与 `_lastPromptTokens` / `_usageAtLen` 同处 `:65-66`）；已置位再越窗 ⇒ 直接抛。
  **后果（旗是 run 级，不是按请求）**：同一 run 内第二次**独立**越窗不再自愈，直接抛 typed 错误（用户 `/compact` 后可继续）。理由 = 批档 D6：一次就是全部额度，按请求计数会引入一个没有现场的「N 次」。
- 排除面（与 `assertPromptFits` 的豁免**同向但理由不同**）：`stage ∈ {compress, distill}` 的调用不经本 catch——它本身就是止血动作，压它 = 重入压缩机；续写子请求的失败已在 `provider/core.mjs:317-323` 折进 `_warnings`，不到达本 catch ⇒ 不存在「已流出内容被重放」。
- **Responses 流内帧路径不命中本链（属性名不同）**：流内错误出口把分类写在 `errorKind`（`provider/responses.mjs:38` `e.errorKind = cls.kind` · `:97` 同形），HTTP 400 与本地净判写 `kind`（`provider/errors.mjs:171` `markContextOverflow` · `:148` `contextOverflowError`）⇒ 本链按 `error.kind === "context_overflow"` 判，流内帧错误不进入。该形态因此不重试——流内帧到达时请求可能已流出文本，重试即重复输出；流内帧仍按既有 `retryable:false` 收束，登记为接受的边界。**实施轮判据**：若上游任一环把 `errorKind` 归一成 `kind`，本链须加「未流出才重试」（判据 = 该次请求已产出 content 长度 > 0 ⇒ 不压不重试、直接抛）。
- **安全点不变量（本链依赖）**：压缩切点要求历史末尾 role ∈ {`user`, `tool`}（§6.2 仅安全点）。链三的压缩落 `callModelTurn`（`thincoder-core/agent/turn-loop.mjs:55-72`）失败之后，与循环内的压缩检查点同一时点——该不变量由循环门 `thincoder-core/agent/turn-loop.mjs:143-144`（`const lastRole = agent.history.at(-1)?.role` / `if (lastRole === "user" || lastRole === "tool")`）的判据背书。循环形状若改（例如允许 assistant 半截后再发请求），本链的切点安全性一并失效，审计锚 = 该门。
- 与事前守卫的关系：守卫**事前**（估算 vs `limit`，零 fetch），本链**事后**（服务端说了算）。两道不互相替代：估算准时守卫省下一次 400，估算不准时本链把回合救回来。
- 可见性：强制压缩走既有压缩面板 / `onCompress*` 回调，压缩失败走既有三次降级链——本链不新增静默路径。

**用例表（本批续号 RB24–RB34）**

| # | 情形 | 输入 | 期望（机判） |
|---|---|---|---|
| RB24 | 正常 · ASCII 系数 | `estimateText("x".repeat(4000))` | `1334`（`ceil(4000/3)`） |
| RB25 | 正常 · 混排 | `estimateText("x".repeat(200) + "字".repeat(200))` | `67 + 200 = 267`（ASCII 段 `ceil(200/3)`，CJK 仍 1 字/token） |
| RB26 | 正常 · 样本落盘 | 采样后 `saveSession(agent)` | 槽 JSON 的 `estimateSample` = `{key,num,den,est:1}`，`num` / `den` 与内存同值 |
| RB27 | 正常 · 恢复复用 | 槽带合法 `estimateSample`（`key` = 当前模型）⇒ `applySession` | `agent._tokRatio` = `max(1, num/den)`；首请求估算支按该比抬升 |
| RB28 | 边界 · 版本不符 | 样本 `est` 缺失或为 `0` ⇒ `applySession` | `_tok = null`、`_tokRatio` = 1（估算口径变了，不复用旧 `den`） |
| RB29 | 边界 · 模型已换 | 样本 `key = "openai:deepseek-flash"`，当前 provider `kimi-k3` | 同上回 1（与 `recordTokenSample` 的 key 自清同判据） |
| RB30 | 错误 · 损坏样本 | `estimateSample = { key:"openai:x", num:"NaN", den:0 }` | 回 1，不抛（会话照常恢复） |
| RB31 | 正常 · 400 自适应救回 | 首请求 `fetch` 桩返回 400 ＋ `maximum context length` 报文体；摘要桩返回摘要 | `stage:"compress"` 恰 1 次；重试 `fetch` 1 次且成功；`_overflowRetried` 置位 |
| RB32 | 错误 · 压后仍越窗 | 同 RB31，重试仍 400 越窗 | 抛 `kind === "context_overflow"`；`stage:"compress"` 不再增（仍 1）；不截断 |
| RB33 | 边界 · 止血面不进自适应 | `stage:"compress"` 的请求 400 越窗 | 不触发自适应（`_overflowRetried` 不变、无第二次压缩）——走既有压缩失败链 |
| RB34 | 正常 · VSC 端四处 | 写① `agentState(agent)`（带样本的 agent）；写② `saveLines` 两夹具（`extra = { seed }` 键缺席 ∥ 键在场）；读③ `applySlotSessionState(agent, { slot }, { cfg, restore: true, provider })` 直调（**只证 ③ 的读回逻辑，不证 ④ 接线**）+ ④ 结构机检：读 `thincoder-vscode/src/agent/setup.mjs` 源文，定位 `applySlotSessionState(` 调用，断言其第三参对象字面量含 `provider` 键 | 写①：`estimateSample` 与 `tokenSampleOf(agent)` 逐值同（空样本 ⇒ `null`）；写②：落槽 JSON 同值，且键缺席时槽内既有 `estimateSample` 逐字保留；读③：`_tokRatio = max(1, num/den)`（另 `restore:false` / 样本坏 / `provider` 缺省 ⇒ 比保持 1 且不抛）；④：第三参对象含 `provider`，缺则红 |

**RB34 的 ④ 为什么用结构机检、不跑 `hydrateRun`**：

- 理由一：`hydrateRun`（`thincoder-vscode/src/agent/setup.mjs:90`）是 host 装配全路径——`:137` 读盘上配置（`loadRaw()`）· `:172-174` 读会话槽（`loadSlot`）· `:150` `loadConsultPool()` · `:215` 起 `await buildToolTable(...)`。经它跑断言 = 依赖开发者本机 config 与真槽，非密封，且测到的是整条装配、不是本批这一个参。
- 理由二：该档 `:16` 引的 `./setup-tooltable.mjs` 直接 `import` 了 `vscode` ⇒ 无宿主连 import 不成立；给 `vscode` 建桩只解 import、不解真盘读，故不建。
- ④ 的语义 = 「这一行有没有把 `provider` 接进第三参」，是调用形断言；源文机检可判、零宿主依赖。行为面的读回逻辑由 ③ 的直调夹具覆盖，两面不重叠。

**边界（本 § 不改）**：`estimateRequestTokens` 的取值面（哪些字段计入）· `spec.context` 表值 · 压缩摘要本体 · 提示词面 · VSC 设置面板（读原始盘面，`null` = auto；写面零改）。ASCII 系数、样本持久化与越窗自适应见 6.17.1。

## 7. 并入的关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-CC1 | 触发仅安全点（D1）+ 阈值显式优先 / auto = 阈值链（D2——口径与参数见 §6.2 / D-CC30） | 半截切破坏 tool 配对语境；余量与注入预算的账 = §6.2 目标口径 |
| D-CC2 | token 判定 = 实测优先 + 增量估算（D3） | 纯估算对 CJK 系统性低估——可能永不触发（实测教训） |
| D-CC3 | tail 公式 = 候选条数（D4），最终受双约束 | 1M 窗口 10 条太薄；40% 上限防小窗口「压缩了个寂寞」 |
| D-CC4 | KEEP_HEAD = 0（D12） | 多任务会话中旧任务原文锚住注意力（用户反馈实证）；摘要承担「已完成 vs 进行中」区分 |
| D-CC5 | 配对保护双侧（D5） | head 侧吞并行工具结果 = 真实 400 场景；tail 侧 orphan 拉回 owner |
| D-CC6 | 预算为主 / 条数为辅 / 保底 10 条（承 D-T1 与 D-T2） | 用户目标 15%；保底防「最近对话失真」；小窗口取舍 = 保底优先于 15%。**否决** `min(10, ⌊预算/单条均值⌋)`（均值启发式引入不确定性）· 对 tail 单条巨型消息二次截断（与 `shrinkOversized` / 64K 落盘职责重叠）· 预算不足时砍光 tail（失真） |
| D-CC7 | 三级降级链（D6）；失败计数每次 runAgent 重置 | 确定性截断 + 明确 note 比启发式摘要诚实。**废弃** VSC 启发式摘要（`User:/Assistant:` 流水账价值低且难与真实消息区分） |
| D-CC8 | 压缩后回注去重（D7）：pending 全量 + done ≤3 | done 只列 3 条省 token；去重保证单源真值 |
| D-CC9 | 压缩前 checkpoint **移除**（D8——用户拍板） | 双线历史已保证可恢复；压缩前快照白占磁盘 |
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
| D-CC20 | 压缩调用改**会话续写形态**（前缀复用）：`system`（同回合）+ 中段真身消息 + 尾部指令一条 + **与回合同声明的 `tools`**（**不随 `tool_choice`**——全形态经 S3 实测否决，该参数致服务端**丢弃 tools 区** ⇒ 落备选⑤；v1「不带 tools」被实施轮受控实测推翻） | 修前形态与回合请求共享前缀 0（轨迹 108590 / 256）；同请求体重发命中 98.0% ⇒ 机制可用、**形态**未复用；**命中面按 `tools` 声明分区**（实施轮受控实测：带 tools 93.6% · 不带 0%）⇒ 声明面须与回合同源。**否决**：① 全量 history + 指令（尾部进摘要输入域 ⇒ 摘要与保留尾部重复，且尾部落入未命中面）② **不带 tools**（= v1 决定——实施轮实测命中 0%；探针 R2 / R4 小样本结论作废）③ 按 `cacheMode` 双形态分派（双语义；`cacheMode` = 静态能力标注且核内零消费，与「调用期前缀可否复用」不同层——判据错位；原「标注语义 = 需显式 cache_control ≠ 无缓存」引证作废——评审 #5；字段本体随 `doc:MODEL-SPECS.md:§14` 批整体删除——§14.2 #11）④ 保留序列化正文 + 前缀拼接（中段重复发送，重复段不在命中面）⑤ 带 tools **且随** `tool_choice`（抑制形——该参数自身破坏命中）。**已采纳（实施轮 S3 实测翻转）**：带 tools 且**不抑制** tool_call（泄漏由 content-only + 空白守卫兜底） |
| D-CC21 | 蒸馏调用改**会话续写形态**（前缀复用）：`system`（同回合）+ 中段真身消息（`[0, lastBlockEnd)`）+ 尾部指令（`EXPLORE_SUMMARY_PROMPT`）+ **与回合同声明面的 `tools`**（不随 `tool_choice`）+ **`reasoningEffort` 同源**——与 D-CC20 逐件同构（§6.15） | 修前形态与回合请求共享前缀 0（轨迹 18/18 = 0%，prompt 1.5–11.7K 全价）；命中机制（`tools` 声明分区 / effort 同值）已由 §6.14 受控实测确立（84–98% · 92.86/93.65%）⇒ 本面 = 同式复制、不重造。**否决**：① 保留序列化正文 + 前缀拼接（重复段全价且不在命中面）② 全量 history + 指令（末块之后尾部入摘要输入域，且全价新面）③ 指令前置于正文（插入点之后的真身消息全落入未命中面 ⇒ 命中 ≈ 0）④ 维持修前单条 `user` 形态（0%）⑤ 改提示词文本以适配尾部位置（内容权 = 主 agent——登记上抛，不做） |
| D-CC22 | 活体推入面回声恒带：`required` 族的**工具轮** assistant 消息恒带 `reasoning_content`（本轮无推理 ⇒ **空串**）——核单点构造 `assistantToolCallMessage(response, spec)`（`thincoder-core/model-specs.mjs:427`），**两站点共用：核主循环（`thincoder-core/agent/turn-loop.mjs:250`）∥ 核 advisor 循环（`thincoder-core/advisor/loop.mjs:207`）**；VSC 端壳站点随主循环 2026-09-29 归核退役（端侧零独立构造点——`thincoder-vscode/src/specs.mjs:16` 只再导出该名） | 与 D-CC18 / D-CC19 **同判据**（required 族机读线不得缺该字段）的**第三面**：前两者治压缩注入 / 恢复读取，本面治**活体推入**（前两者不覆盖）。真机实证（deepseek-flash · 带 `tools` · 同形历史三连）：带空串 **200**（服务端仍回 `reasoning`）· 缺字段 **200** 但 `reasoning` 帧 = **0** · 带真值 **200** ⇒ 空串合法，且缺字段轮服务端不再回推理（与 `advisor/loop.mjs:201-206` 自述同向，n=1）。**形状限定**：上列读数为**设计轮形状（请求尾 = user）**；**活体形状（尾 = tool）**实测 = 三形态全 **200**（kimi / mimo 同证）。**否决**：① 维持条件式省略（族内形态不齐 + 症状持续）② 伪造 / 借用别轮推理文本（污染 + 与「回声 = 服务端原文」语义冲突——承 D-CC18 否决③）③ 改 provider 序列化面统一补字段（跨族越权：glm / optional 族行为将改）④ 落点选 `context.mjs` · ⑤ 各推入点内联同式（多构造点——违 D2 单源） |
| D-CC23 | `context` 单工具三操作（stats / prune / compact），落**家族登记册**（`agent-tools.mjs`）+ `family-tools.mjs` **depth-0 段** | 用户定形（原话级「收在一个 `context` 工具里 ✗ 用操作区分」）。**落家族段而非 `tools/` 静态表**：VSC 不消费 `assembleBuiltinTools`（手写 30 项表）——家族段两端同调核单源 ⇒ **双端一致零端侧重复**；描述文本随全族外置（单点 = `thincoder-core/tool-docs/context.md`，`description: DESC("context")`）。**否决**：① `tools/` 静态表落点（VSC 须手加两条 = 重复面复活）② 三工具分开（违用户定形）③ 扩既有工具（`read_history` 是查询面，语义不可混） |
| D-CC24 | 模型发起压缩 = **排队 + 下一安全点落**（`agent._pendingCompact` 单槽），**不回合中途执行**；阈值面**排队承接**、同安全点至多一次压缩；`force` 只跳过阈值早退 | 回合中途执行须重建 `agent.history`——核循环逐处重读（安全），但 **VSC 主循环持共享数组**（主循环归核后 = 核 `agent.history` 共享面 + 既有压缩检查点原位回收）⇒ 工具内换数组会令同批 tool 结果落进陈旧数组（孤儿 `tool_call_id` / 结果丢失）。排队落点 = 既有安全点（工具结果落盘后、下一 `chat()` 前——`thincoder-core/agent/turn-loop.mjs:87-93`）⇒ tool 结果配对完整，且**复用**既有检查点 / 面板 / 失败链 / 双端回收逻辑。**否决**：① 工具内同步压缩（VSC 共享数组契约破 + 同批其余工具等待摘要 30s）② 立即压缩但强制把在飞 assistant 拉进 tail（核可、端不可；两实现分叉）③ 等到回合尾才压（回合尾可能不再回模型——安全点已足够近）④ 阈值⊓请求才压（用户目标 = 阈值之外的自选时点，交集合 = 罕见） |
| D-CC25 | prune = **保结构换内容**（`history[i] = { ...m, content: stub }` 原位）+ 合格集 = 保护尾外 ∧ `role:"tool"` ∧ ≥200 tok；记录面不变；基线失效；**无 target 参数** | 配对安全**结构上不可能被拆**（数组引用 / 长度 / 索引 / `tool_call_id` 全不变——不设 owner 拉回逻辑）。合格边界**复用** `splitHistory` 的 `tailStart`（=「压缩会摘要掉的那段」）⇒ 不新增第二处切割判据。原位换对象满足 VSC 共享数组契约（vs `shrinkOversized` 的换数组——那是安全点外调用）。基线失效同 `shrinkOversized` 先例。**否决**：① 整对删除（连 assistant 文本 / 推理一起丢——损失面大于收益）② 按 id 指定目标（模型需自记账 id，无用例支撑）③ 无门槛（stub 比短输出长——净增）④ 摘要式清理（= 压缩面，语义正交才是本操作的价值） |
| D-CC26 | VSC 宿主工具 `context`（IDE 快照）**改名 `ide`**，让出 `context` 名给核心新工具 | 同名撞车 ⇒ provider 逐字 400（`Tool names must be unique.`）+ `toolByName` Map 后写覆盖。用户定形名（F-CC5）= `context`，不可改 ⇒ 让名方必为宿主工具。行为面零改（名字 + 引用面）。**否决**：① 新工具改名（违用户原话级定形）② 合并语义（IDE 快照 = 宿主能力，与上下文治理不同职责；且核工具须跨端）③ 只在 CLI 注册（违「双端一致」判定⑤） |
| D-CC27 | `compact` 回执带**可回查锚**：`agent._slot` 在场 ⇒ 逐字给出槽文件路径 + `read_history path="…"` 调用形；否则给 `cwd:` 发现面（等效取回） | 裁令 A（用户批准）。现尾注「full text is in the session file」不给路径 ⇒ 不可行动；取回通道**复用** `read_history` 既有 `path=`（不新建通道）。VSC 面板槽位恒绑定 agent（§6.16.7）⇒ 两端同式走**直接路径回执**。**否决**：① 只给「会话档」模糊指称（不可行动 = 本裁定要修的缺口）② 由工具代取回 / 内联全文（越权 + 上下文膨胀）③ VSC 端另起接线强接槽位（现装已恒绑定——`thincoder-vscode/src/agent/setup.mjs:299`，无需新增接线面；收益低） |
| D-CC28 | **子代理面 = 不给**（`context` 入 `depthOnly` 段，depth>0 结构性不可达） | 裁令 D：depth>0 **无回查面**——`read_history` depth-0 only（`family-tools.mjs:141/150-151`）+ 不绑记录存储（`bindRecordStore` 调用点全在 depth-0 会话路径）+ 不落会话档 ⇒ 被压中段 settle 后无面可达。给 = 新增一条**不可回查**的模型可触发路径，与「记录面不死」（判令②）及裁令 A 的承诺冲突。depth>0 仍由既有阈值压缩治理（不改变既有事实）。代价（子代理失 stats/prune）登记，替代 = 任务粒度 + 阈值兜底。**否决**：① 全深度给（承诺不了可回查）② 给 stats/prune 不给 compact（prune 同样是不可回查的删——半给仍违口径；且须两套装配面）③ 给但回执声明「子代理面不可回查」（把缺陷写进提示词 = 教模型接受损失） |
| D-CC29 | stats 首行**两名分明**：主口径 = 窗口占用（`({pct}% of {window} window)`，pct = total / window）；触发线降**具名备注**（`compaction line {threshold} ({toGo} to the line)`） | 用户实报「明明才占用一点点」——原首行 pct = total / threshold（41%）而真窗口占用 ≈15%，同行状态行又报 8% ⇒ 一份输出两个无名百分比并存。F-CC1 载荷全保（总量 / 距压缩阈值 = {toGo} / 各段占比 = 第 3–4 行不变——该两行为绝对 token 量、占比可由段值推得）；口径单源 = 恰一个百分比配对分母（窗口）。**否决**：① 保留阈值分母（误导即症状源）② 删阈值信息（F-CC1 载荷不得改薄）③ 双百分比并报（无名并存复活） |
| D-CC30 | **阈值链**：`COMPACT_RATIO = 0.6`；预留 = 实发 `max_tokens`（不封顶；未发时按规格 `maxOutput`）；阈值 = `min(usableWindow(窗口, 预留), ⌊窗口 × 0.6⌋)` ⇒ 比例项胜出 **19 档 61 行恰 60.0%**（预留 < 40% 窗口）；`*`（预留 ≥ 40% ⇒ 窗口 − 预留 项胜出）= **4 档 9 行**，线 48.8%–50.0%（§6.2 表） | 用户 2026-10-26 13:06 令「这个参数调成0.6」——压缩线降到 60% 窗口，把注入余量（目录树 / git 上下文 / outline / 项目指令 / 记忆检索，每轮 30–50K）从原来 0–2% 带宽放到 40%。压缩非免费（摘要调用 + 不可逆信息损失 + 长会话逐层放大），0.6 是下界：再低则白扔可用窗口，再高则注入吃光余量。**溢出论证 = §6.2**（残余带已消除 ∥ 守卫兜底 ∥ 后果 fail-loud）。`usableWindow` 退化守卫零改（保留；仅「规格 maxOutput ≥ 窗口」档触发）。**否决**：预留封顶（重开 2026-10-18 那条 143,216 死区） |
| D-CC31 | **提示词面落点 = 公共层 `thincoder-core/prompts/common.md`「工具观」节内新增 `###` 子节「上下文自掌舵」**（提示词侧 = 实施轮 coder 落笔）；全文记录（四问 / 形态 / 计数连带 / 机检 / 边界）= `docs/core/design/PROMPT-SYSTEM.md` §6.29 | 用户 2026-10-16 23:57 逐字批准文案；受众 = 两模式主会话主面（①② 的 `context` = depth-0 only）+ 全角色（③）；工具观族 = 操作形聚集地、`###` = 零 `##` 块计数连带（先例 = D-PS39）。**否决**：① 新增 `##` 节（块计数连带 + 需求档节表锁定）② 两模式纪律档分落（跨模式同文 = 双份、零收益——同 D-PS36 判据）③ 人格层（内容非身份 / 边界；且两模式双份） |
| D-CC32 | **请求预算单源 + 溢出守卫**：`requestBudget(provider, spec = providerSpec(provider))` 一处算 8 字段 `{window, windowSource, maxTokens, maxTokensSource, reserve, usable, threshold, limit}`（transport 由 `provider.format` 定），四个 transport 装配面只读 `maxTokens`；`outputReserve` 去 25% 封顶、`DEFAULTS.agent.compactThreshold` 退场（键缺省 = auto）；auto 值只进 `compactThresholdResolved`（每 run 现算、四处刷新点改写入它），显式键永不被改写；窗口按规格窗（服务端广告值只作注记）；stats 增 `Request budget:` 行（字面单源 = §6.16.4）；守卫判据 = `usage.total > limit`（无档次门；不用 `maxTokens`——未发时为 `undefined` ⇒ NaN ⇒ 静默失效）；`absent` 档 `limit` 取地板 `max(window − reserve, threshold)` ⇒ 全档照判；发送面第二道覆盖四面、内部阶段（`compress` / `distill` / 续写）豁免；压后仍超 ⇒ 带三实数报错不发（`run-stages.mjs:137` 缝，不截断）；估算自校准 = `_tok` 池化比（`usage.prompt_tokens` ÷ 输入侧估算，切模型自清）；HTTP 400 越窗标 `kind = "context_overflow"`（词表复用 `provider/errors.mjs:122-123`） | 2026-10-18 溢出 400 实证：messages 658,972 + 请求 max_tokens 393,216 = 1,052,188 > 1,048,576，而压缩线 750,000 未触发——根因 = 预算面预留被 25% 封顶（250,000）、发送面原样发 393,216，死区 143,216（注释曾把该带记为 accepted——那条「接受」即故障因，已删净）。同函数两输入使 stats 报 800,000（qwen3.8-max 档比例项胜出）∥ 加载期派生值在内存面报 750,000（deepseek 档 usable 项胜出）——「两条线」实为一个派生值被当成显式值在三个界面流通。**否决**：① 只改比例（越窗仍在）② 只加守卫不改预算（用户拒：预算 A 发送 B 加守卫兜着）③ 逐请求钳 `max_tokens`（静默削输出 + 须动四装配面 + prompt 越窗时无效） |

