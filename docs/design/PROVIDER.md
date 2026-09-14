# 供应商与模型（PROVIDER）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§9 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 调用核心 | `thincoder-cli/src/provider/core.mjs` + `src/provider/index.mjs` | `thincoder-vscode/src/provider.mjs` |
| 传输 | `src/provider/{anthropic,google,responses}.mjs` | `src/provider/transports/{anthropic,google,responses}.mjs` |
| 基础件 | `src/provider/{sse,retry,normalize,errors,abort-provenance}.mjs` | 内联 / 无独立档 |
| 限流 | `src/provider/rate.mjs` | 同名（同路径对） |
| 模型清单 | `src/provider/list-models.mjs` | 同名（同路径对） |
| 模型规格 | `src/model-specs.mjs` | `src/config.mjs`（模型规格段）+ `specs.mjs` |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 114 | `provider/rate.mjs` | 同路径 | 0.1646 · 异 | ③ | 进核 | 取并集：等待取 VSC 的可中断实现（`abortableSleep`）+ 默认限流口径取 VSC 的 spec 回退 + token 估算取并集（图片 part / `max_tokens`） | 分叉 ＝ 等待可中断性（CLI 睡到窗口结束 `src/provider/rate.mjs:89-90` / VSC 10s 段可中断 `:26-34,135-137`）+ 默认 tpm/rpm 回退 + token 估算口径；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 115 | `provider/list-models.mjs` | 同路径 | 0.0601 · 异 | ③ | 进核 | 取并集：保留 VSC 的排序与明确报错 + CLI 的 `provider.headers` 随请求发出 | 分叉 ＝ 排序 / 自定义 header 是否随 `/models` 发出 / 失败形态（CLI 静默空清单 `src/provider/list-models.mjs:88-93` / VSC 抛错并显示不可用 `:38,63-74`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 138 | `src/provider/core.mjs` + `src/provider/index.mjs` ↔ `src/provider.mjs` | ② | 融合：以 CLI 调用核心为准 + VSC 的传输分派面归位 | 分叉 ＝ 组织（VSC 单档 / CLI 拆 core + sse + normalize）；两端同 API 语义（`chat` / `createProvider`——VSC `thincoder-vscode/src/provider.mjs:123` 自述「CLI core.mjs 同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 139 | `src/provider/anthropic.mjs` ↔ `src/provider/transports/anthropic.mjs` | ② | 融合：取一侧 + 核内 `transports/` 目录归位 | 分叉 ＝ 目录（CLI 平铺 / VSC `transports/`）；同源自述 ⇒ 前提成立 | — | S1（建核补齐） |
| 140 | `src/provider/google.mjs` ↔ `src/provider/transports/google.mjs` | ② | 融合：同 #139 | 同 #139（VSC 头注自述「与 CLI 同修」）⇒ 前提成立 | — | S1（建核补齐） |
| 141 | `src/provider/responses.mjs` ↔ `src/provider/transports/responses.mjs` | ② | 融合：同 #139 | 同 #139（VSC `:376` 自述「与 CLI/core 同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 142 | `src/provider/sse.mjs` · `retry.mjs` · `normalize.mjs` · `errors.mjs` · `abort-provenance.mjs` ↔ 核内（VSC 侧内联 / 无独立档） | ② | 融合：按核内结构归位（重试链 / 预发归一 / 错误分类 / abort 溯源） | 分叉 ＝ 拆档粒度（VSC 未拆）；VSC 多处自述「与 CLI 对齐」（`thincoder-vscode/src/provider.mjs:250` 等）⇒ 前提成立 | — | S1（建核补齐） |
| 143 | `src/model-specs.mjs` ↔ `src/config.mjs`（模型规格段）+ `specs.mjs` | ② | 融合：核内单一 `MODEL_SPECS` + 端侧派生面（面板下拉 / 默认档）按端注入 | 分叉 ＝ 档名与拆分（VSC `config.mjs` 实为规格表、`specs.mjs` 仅转发）；VSC 头注自述「与 CLI src/model-specs.mjs 的查找语义对齐，但非逐行等价」（`:103`）⇒ 前提成立；字段差（`reasoningEffortDefault`）按端差登记 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A19 | `provider/rate.mjs`（#114） | ① | 等待期间按 Stop **要拖到窗口结束**（`:89-90`）；只按 provider 配置的 tpm/rpm 限流 | 10s 段可中断睡眠（`:26-34,135-137`）；只配一个维度时**补默认另一维度**；token 估算含图片 part 与 `max_tokens` | 取并集：等待取 VSC 的可中断实现 + 默认限流口径取 VSC + token 估算取并集 | ① 被限流时按 Stop 的响应速度（CLI 侧变快）；② 只配 rpm 的场景会多一层 TPM 闸（限流更早触发） | **已裁（2026-09-13）· 按建议** |
| A20 | `provider/list-models.mjs`（#115） | ①② | 按接口返回序；**带 `provider.headers`**；解析失败静默返回空清单 | 结果 **sort() 排序**；openai / anthropic 分支**不带** `provider.headers`；失败抛错并在配置面板显示「该渠道不提供模型列表」 | 取并集：保留 VSC 的排序与明确报错 + CLI 的 `provider.headers` 随请求发出 | ① 走自建网关 / 需额外鉴权 header 的用户：VSC 现会 401 拉不到 ⇒ 归一后能拉到；② 清单顺序变化（排序 vs 接口序）；③ 拉不到时的提示形态变化 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 8 | `provider/list-models` 失败形态（空清单 → 明确报错） | 输出 | 取并集 | 登记 + CHANGELOG | `PROVIDER.md` 同步 + 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A20） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **产品测试（S1 / S2 改）**。

## 6. 机制面（自 CLI 产品档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/PROVIDER.md`（1369 行 · CLI 产品档）——根层裁定后该档 = **迁移期参照历史**（只读 · 不维护 · 不参与内容同步）。
> **本节 = 该档中「根层所缺」内容的并入面**：(a) 机制 / 契约的实质描述 · (b) 实现细节与坐标 · (c) 关键决策依据（§7）。
> **不并**者见 §8：一次性批次材料（受影响文件表 / 用例表 / AC 表 / 对账表 / 变更流水账）· 逐批状态行与交付核销标记。
> **坐标口径** = as-of 2026-09-14：**旧档路径形态为迁移前**（CLI 侧 provider 实现住 `src/provider/**`）——本节一律按**现状路径**落笔（`thincoder-core/provider/**`；`thincoder-cli/src/tui/**` = CLI 壳体面）。符号名与档路径为契约面，**行号未逐条复核**、仅供定位。

### 6.1 模块地图与总览

Provider 层把模型能力差异收敛到一张**规格表**（`MODEL_SPECS`），其余代码按 spec 全自动适配；把各厂商协议差异收敛到 transport 分派（`provider.format`），核心 `chat()` 对调用方暴露统一结果形态。

| 模块 | 职责 |
|---|---|
| `thincoder-core/provider/index.mjs` | re-export：`chat` / `listModels` / `estimateText` / `createProvider` / `stripImagesForTextModel` |
| `thincoder-core/provider/core.mjs` | chat 入口（transport 分派）、OpenAI 格式 body 组装、`requestWithRetry`、载荷净化、截断续写循环、`buildContinuationMessages`、overload 重试、`effectiveFetchTimeoutMs`、`createProvider` |
| `thincoder-core/provider/list-models.mjs` | `/models` 拉取按 `format` 分派（openai / anthropic / google） |
| `thincoder-core/provider/sse.mjs` | `readSSE`：OpenAI 格式 SSE 解析、畸形 tool_calls 防御归并、usage 缓存归一、流规则触发、中断 / partial、读侧 idle 超时 |
| `thincoder-core/provider/rate.mjs` | TPM/RPM 滑动窗口闸门、token 估算、重试常量、`_rateHooks` 测试钩子 |
| `thincoder-core/provider/errors.mjs` | 错误分类族：`parseRetryAfter` / `isNonRetryableError` / `betaBaseURL` / `compileStreamRules` |
| `thincoder-core/provider/retry.mjs` | anthropic / google / responses 共用的通用退避重试链 |
| `thincoder-core/provider/normalize.mjs` | 发送前净化纯函数：`stripImagesForTextModel` / `normalizeToolPairing` |
| `thincoder-core/provider/anthropic.mjs` · `google.mjs` · `responses.mjs` | 原生 transport |
| `thincoder-core/model-specs.mjs` | `MODEL_SPECS` 规格表 + `specForModel` + `providerSpec` + `specMatch` |

**统一结果形态**（`chat()` 返回）：`{ content, reasoning, toolCalls, usage, finishReason, _warnings?, interrupted?, partial?, droppedToolCalls?, ruleTriggered? }`。

### 6.2 chat() 主流程

按序：① **净化（分派前）**——`providerSpec(provider)` 取带 provider 级 context 覆盖的 spec；`stripImagesForTextModel` 防图片毒化；`stripLocalMessageFields` 剥离仅本地消息字段（ts / transient）；② **format 分派**——`anthropic` / `google` / `responses` 各走原生 transport，缺省 OpenAI 兼容（body 组装内联）；③ **OpenAI body 组装**——
`model` / `messages` / `stream: true`；`stream_options`（非 `noUsageStream` 模型）；`max_tokens` 按 `provider.maxTokens`；`temperature` 按 `spec.tempRange` 钳位；`thinking` 按 `spec.thinkApi` 注入；`reasoning_effort` 校验进 enum 后注入（router 模型 ID 含 `/` 时不发）；`enable_thinking`（Qwen）；
`tools` / `tool_choice` / `parallel_tool_calls`；④ **token 估算与闸门**（`rateGate`）；⑤ **请求**（`requestWithRetry` → `readSSE` → 用实测 usage 修正记账）；⑥ **结果短路**——`ruleTriggered` / `interrupted` / `partial` **立即返回**；⑦ **overload 重试**（`insufficient_system_resource` → 最多 1 次）；⑧ **截断续写**；
⑨ 返回结果（续写失败注入 `_warnings`，不整轮飞出）。

### 6.3 重试、超时与错误分类

- 重试常量：`MAX_RETRIES = 3`；`RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 60_000]`；`RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}`。
- **429**：尊重 `Retry-After` 头（上限 300s），无头 / 非法则退避表取档；**5xx / 408 / 409 / 425**：指数退避；**不重试**（`isNonRetryableError`）：401 / 403 认证、400 级非 429、429 但 body 含余额 / 配额特征（中文「余额不足」类 + `insufficient_quota` 类 + GLM billing code `1113` / `1114`）。耗尽后按 lastStatus 分类报错，cause 解包拼进文案。
- **去重（单一实现）**：`parseRetryAfter` 唯一实现住 errors.mjs（retry.mjs 导入）；`sleepInterruptible` 唯一实现住 core.mjs；429 配额判定统一为 errors.mjs 双判版（删 retry.mjs 纯正则版——规则漂移消）。依赖单向（errors / retry 均独立、均 import rate；core 依赖 errors）。
- **401 / 403 诊断**：Kimi 双平台提示（`sk-kimi-` 前缀 key 或 `api.kimi.com` 端点 → 说明 Moonshot 与 Kimi For Coding 两平台 key 不互通）+ 通用诊断回显 `[auth diag: baseURL=… key=… status=…]`（key 前 6 位掩码）。
- **超时语义（废弃绝对墙钟）**：**响应头阶段**用 `fetchTimeoutMs`（默认 600s，`agent.fetchTimeoutMs` 可配，`effectiveFetchTimeoutMs(provider)` 统一消费——四 transport 共用）；**body 阶段**用读侧**空闲**超时 `READ_IDLE_MS = 120s`（有数据流动就永不超时，连续无新 chunk 才判死）；`AbortError` 透传（用户 Ctrl+I 取消，不吞）。
- **abort / 超时来源标注**：超时 / 中止产生点的错误对象自带结构化 `abortInfo`（trigger / layer / detail）——词汇表与判定归 AGENT-LOOP 板（本档只指针）。

### 6.4 SSE 流式解析（`readSSE`）

- **分帧**：TextDecoder 分块解码，按行缓冲 `\n\n` 分帧（支持多行 `data:`）；`data: [DONE]` 结束；UTF-8 BOM 剥除。
- **非 SSE 兜底**：content-type 非 `event-stream` → 尝试单 chunk JSON 解析（网关把 `stream: true` 降级为完整 completion）；HTTP ≥400 解析各厂商 error 字段抛错。
- **delta 累加**：`content` / `reasoning_content`（方言同时认 `reasoning`——DeepSeek/Kimi/GLM 用 `reasoning_content`，OpenAI o 系 / 部分路由器用 `reasoning`）/ `tool_calls`（按 index 增量拼装）。
- **usage 帧**：`choices: []` 的 data 帧捕获 usage（prompt/completion/cache hit/miss tokens）；缓存字段归一为 DeepSeek 风格（OpenAI 报 `prompt_tokens_details.cached_tokens`，少数在 usage 顶层）。
- **中断 / partial**：`signal.abort` → 抛 AbortError；`signal.reason.interrupt`（Ctrl+I）→ 提交已生成部分并标 `interrupted: true`；网络级失败已解析出内容 → 标 `partial: true` + `networkError`，注入 `_warnings`（`network-partial`）。
- **流规则**（`compileStreamRules` 编译 `{pattern, message, action: "abort"|"warn", flags?, repeat?}`）：`abort` 立即中断并标 `ruleTriggered` + `ruleMessage`（agent 注入规则消息后重试）；`warn` 不中断，去重收集 `_warnings` 在回合后注入；`repeat: "once"` 用 `firedPatterns` 跨调用去重。**responses 格式不接 streamRules**。

### 6.5 截断续写（两协议）

`finishReason === "length"`（输出 token 截断）时按 spec 声明协议续写：

| 协议 | spec 字段 | 机制 | 适用 |
|---|---|---|---|
| **prefix** | `prefixMode: true` | `/beta` 端点续写，请求体附 `prefix: true` + 上次 usage；`reasoningEcho=required` 时回传 `reasoning_content` | DeepSeek 系列 |
| **partial** | `partialMode: true` | 同一次响应内直接续写：`MAX_CONTINUATIONS = 3` 次追加请求；usage 跨续写累计 | Kimi / Qwen / MiniMax |

- **prefix 历史约束**：prefix 续写请求**只带精简历史**——过滤全部 `tool` / `assistant(tool_calls)` 消息（DeepSeek 网关对含工具链历史的 prefix 续写**必 400**），保留 system + 最近 8 条非工具文本（`PREFIX_CONTINUATION_KEEP = 8`）；构造逻辑见 `buildContinuationMessages`。partial 续写不受影响。
- **失败可见性**：续写 400 不再静默吞——`chat()` 续写循环 catch 非重试错误时注入 `_warnings`（`continuation-failed`）+ 错误文本进结果；Retry 语义不变（400 非重试）；AbortError 用户中断透传。
- **异常 finish reason 提醒**（agent 层）：`injectResponseReminders` 人类化描述注入（`length` / `insufficient_system_resource` / `content_filter`）。

### 6.6 TPM/RPM 闸门（`rate.mjs`）

- provider 配置 `tpm` / `rpm` 后启用：**发送前**记账（60s 滑动窗口，`estimateRequestTokens` 估算——ASCII ≈ 4 chars/token、CJK ≈ 1 char/token），超预算 sleep 到窗口腾出空间（onWait 通知 UI）；未配置则闸门关闭（429 退避仍生效）。
- `recordRate(provider, estimated, usage)` 在响应后以**实测 usage** 修正记账；单请求估算已超 tpm 时放行（交重试层）+ onWait 告警。
- 窗口按 `baseURL`（`/beta` → `/v1` 归一）+ apiKey 键控；`_rateHooks` 可注入；窗口空时删除条目（防长驻 Map 无界增长）。

### 6.7 发送前载荷净化（纵深防御）

- **`stripImagesForTextModel(messages, spec)`**：非视觉模型发送前把残留 `image_url` 替换为文本占位符（防「视觉会话切到文本 provider 恢复」的存量毒化与非 raster 图 400）；历史本身不改。
- **`normalizeToolPairing(messages)`**：严格 provider 要求 tool 消息紧跟其 owner assistant——发送前重排 tool 消息到 owner 之后、孤儿 tool 丢弃、缺失结果合成占位。与压缩的配对保护同语义（一个管源头一个管兜底）。
- **`escapeMessages`（escape v5）**：`sanitizeLoneSurrogates`——孤立 UTF-16 高 / 低代理 → U+FFFD（全字段）；`escapeLiteralEscapes` 回归 v1 double 语义 + 奇数 run 修复；`sanitizeText` 总入口。**源头截断点** `safeSliceUTF16`（截断点落高代理时向前收一个码元）。
- 净化只作用于**线上载荷**（历史不动，可逆）。

### 6.8 原生 transport（anthropic / google）

- **Anthropic**（`format: "anthropic"`）：POST `/v1/messages`，头 `anthropic-version: 2023-06-01`，key 走 `x-api-key`；system 消息抽离到顶层 `system`；tool 用 `tool_use` / `tool_result` block；
事件流解析（`message_start` / `content_block_start` / `content_block_delta`（`text_delta` / `thinking_delta` / `input_json_delta`）/ `message_delta` / `message_stop`）；usage `cache_read` / `cache_creation_input_tokens` → 内部 cache 字段；`tool_choice` 映射；接入 rateGate / recordRate + 通用退避链。
- **Gemini**（`format: "google"`）：`generateContent` / `streamGenerateContent?alt=sse`（key 走 query 参数）；role 映射 `assistant → model`（system 抽到顶层 `systemInstruction`）；相邻同 role 合并；图像 data URL → `inlineData`；`generationConfig`；safetySettings 全 BLOCK_NONE；
事件流解析（`usageMetadata` / `part.thought` → reasoning / `part.functionCall` → toolCalls，同名去重合并、id 合成 `name_N`）；接入闸门 + 退避链（2026-08-31 前完全无重试）。

### 6.9 规格表（MODEL_SPECS）与能力位

规格表中枢 = `thincoder-core/model-specs.mjs`：所有模型能力差异在此声明——`context` / `maxOutput` / `thinking` / `partialMode` / `prefixMode` / `multimodal` / `cacheMode` / `thinkApi`（`type` = thinking.type 字段 / `effort` = reasoning_effort）/ `thinkEnabledValue` / `reasoningEcho`（required = 必须回传）
/ `reasoningEffortEnum` / `tempRange` / `noUsageStream`；VSC 侧每行多 `reasoningEffortDefault`。

- 新模型只加一行 spec，transport / 续写 / thinking 全自动适配；未知模型保守 `DEFAULT_SPEC`（128K 上下文 / 32K 输出）+ warn once。
- **厂商前缀剥离**：完整名未命中且含 `/` 时剥掉首个 `/` 前 namespace 再匹配一次（`ZHIPU/GLM-5.3 → glm-5.3`）；显式 alias 行保留；只影响 spec 查询，不改 `provider.model`。
- **规格来源可判定**：`specMatch(model) → { spec, matched }`（与 `specForModel` 共享同一查表实现——单次查表）；`matched: false` = `DEFAULT_SPEC` 兜底。
- **退役 / 路由名保留为独立行**：服务端仍收旧名时删行 → 旧配置降 `DEFAULT_SPEC`（压缩阈值 / 窗口显示错）；参数与能力位**是否随新模型按「当下合同」判**（当下即由新模型服务 → 随行；限期路由 → 不预支能力位）。
- **re-export 契约**：`config.mjs` re-export `specForModel` / `providerSpec` / `specMatch`；`providerSpec` = spec + provider 级 context 覆盖。

### 6.10 畸形 tool_calls 防御解析

OpenAI 兼容 SSE 流中畸形 `tool_calls`（数组含 null 元素、缺 `function` / `name` / `id` / `index`）不再崩溃或静默丢工具——槽选择优先级：① `index` 有效 → 按 index 取槽；② 缺 index 但有 `id` → 按 id 在既有槽中查找归并；③ 缺 index 无 id 但有 `function.name` → 新建尾部槽；④ 其余（纯 arguments 增量）→ 延续最后一个槽，无槽可延续则丢弃并计数。流结束收尾（`finalizeToolCalls`）：稀疏 hole 剔除、
name 空槽丢弃并计数、缺 id 合成 `call_N`。告警（`droppedToolCalls > 0`）进**机读线** `_warnings`（`malformed-tool-calls`）——模型需知道其工具调用未执行；agent 层零改动。只防御与降级，不替模型修复语义。

### 6.11 模型支持与预设（PROVIDER_PRESETS）

- **预设** `PROVIDER_PRESETS`（住 `thincoder-core/config-presets.mjs`，20 家）：按需从预设创建 provider，各预设声明 `baseURL` / **`model`（单值默认模型）** / thinking / reasoningEffort / maxTokens / desc。**预设不再携带候选清单**（原 `models` 种子已废）。
- 能力差异全走规格表；`kimi/kimi-k3`（router 前缀）与 `k3` 保留显式 alias 行；未知模型保守 `DEFAULT_SPEC`。
- **DeepSeek V4.1-Flash 行集**：新行 `deepseek-flash`（1M 上下文 / 384K 输出 / thinking 默认开 / 前缀补全 Beta / 磁盘缓存默认开 / `multimodal: true`）；两退役名 `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 保留独立行、参数与能力位随新行（旧配置钉旧名仍查得真规格）；`deepseek-v4-pro` 保留 + 行注释（限期路由——**不预支视觉**：预支的硬失败风险不排除）；
预设 `deepseek` 默认模型 = `deepseek-flash`。

### 6.12 Qwen 思考关闭（`enable_thinking`）

qwen 系列（百炼**混合思考**模式，默认开启）需能**真正关闭**思考（缺陷：reasoning off 时原请求体不含任何思考控制字段 → 服务端按默认开启 → off 静默失效）。纯函数 `resolveEnableThinking(provider, spec)`（`config.mjs`，两端同构造）：白名单双条件 = 模型名 `qwen` 开头（排除 `qwen3-coder` 前缀）**且** provider 指向百炼 host（`isBailianHost`）；
`provider.thinking === null` 是两端统一的**显式 off 唯一标记**。**不受 router 门控**（白名单键控模型前缀 + host，非模型 ID 斜杠）。**选档位 / 开 auto = 隐含 thinking on**：清 `thinking: null` off 标记；on 分支默认 effort 取 `spec.reasoningEffortEnum[0]`（**非硬编码 `"high"`**）。

### 6.13 Responses API transport

`format: "responses"`。`provider.stateful` 默认 `true`，但**链仅在白名单 host 生效**（host 驱动——不能只靠服务端报错兜底：DeepSeek 静默忽略 `previous_response_id` = 无声丢上下文，比 404 危险）。

- **双轨**：本地会话 / 历史仍是**唯一事实源**；`previous_response_id` 链只是**发送层优化**。**链生命周期 = 单次 turn**（turn 内工具往返用链增量，跨 turn 无条件重建）；链失效（404 / 过期）→ 自动重置链 + 本地全量重发一次。
- **工具调用**：内部 `{id, name, arguments}` ↔ responses `function_call` / `function_call_output` item（call_id 配对）。
- **请求体**：system → 顶层 `instructions`；messages → input items；`reasoning: {effort}`；`max_output_tokens`；流以 `response.completed` / `response.incomplete` / `response.failed` 结束（**无 `data: [DONE]`**）。
- **关键决策**：D1 双轨（本地事实源 + 链仅发送层）· D2 链 = 单 turn · D3 默认无状态（stateful 默认 true 但仅白名单生效）· **D8 host 白名单驱动链**（openai 官方 + 百炼 compatible-mode + 智谱；灰名单（deepseek.com）→ 全量 + 一次性 warning；provider 显式 `stateful` 覆盖）· D4 工具 item 双向适配 · D5 不依赖流式 usage 帧 · D6 链失效自动回退 · D7 不探测不降级 · 
**D10 store 硬规则**（百炼 / GLM 链**必须 `store:true`**——`store:false` 时 `previous_response_id` 一律 400；开链时 store:true + 首次 warning 知悉）· **D11 `event:error` 帧**（百炼 SSE）与 **D9 内置工具**（服务端执行——绕过本地权限门 / 审计，产品决策，`provider.builtinTools` 可关）。
- **已知边界**：responses 格式**不接 `agent.streamRules`**（配置了 abort/warn 规则的 responses 用户该保护不生效）。

### 6.14 截断续写 400 止损与根治

**根因矩阵**：thinking 模式下 **prefix 续写 + 历史含任何工具链消息 → 必 400**（补不补 `reasoning_content` 都炸，错误二选一）；纯文本历史 + prefix → 200。**止损** = §6.5 的 prefix 精简历史。**孤立 UTF-16 代理 400**：预览按 UTF-16 码元截断把 emoji 切成孤立高代理 → JSON 输出 `\ud83d` → 严格 UTF-16 解码器报 `unexpected end of hex escape`；
修复两层 = **防御**（`escape.mjs` v5 `sanitizeLoneSurrogates`）+ **源头**（`safeSliceUTF16` 截断点前收一个码元）。`escapeMessages = stripLocalMessageFields(messages).map(escapeMessageContent)`。

### 6.15 模型上下文可配置（`providerSpec` context）

问题：`MODEL_SPECS` 的 `context` 写死；私有端点真实上下文与 spec 不符时压缩阈值偏高 → 溢出风险。
机制：**config 字段** `providers[].context`（**K 单位**正整数；非法值忽略 + 警告一次）+ **解析覆盖**（`providerSpec(provider)` = spec 的**拷贝覆盖** `{...spec, context: provider.context * 1024}`，**不污染共享 spec 对象**——跨 provider 串扰防护）+ **调用方改造**（需要 provider 感知处用 `providerSpec`；纯模型查表处保持 `specForModel`）+ 配置界面 + 显示跟随覆盖值。
**关键决策**：provider 级而非模型级；K 单位整数；拷贝覆盖不污染；**否决**改 MODEL_SPECS 官方值 / 全局 context 字段 / 自动探测（无可靠 API）。

### 6.16 模型清单 provider 化与放行语义

- **M1 清单拉取（按 format 分派）**：`openai` → `GET {baseURL}/models`（`Authorization: Bearer`，解析 `data[].id`）；`anthropic` → `GET {baseURL}/models?limit=1000`（`x-api-key` + `anthropic-version`，`has_more` / `after_id` 翻页）；
`google` → `GET {baseURL}/models?key=…&pageSize=1000`（`models[].name` 剥 `models/` 前缀，`nextPageToken` 翻页）。URL 组合 = `{baseURL}` + 相对路径（与 chat 各 transport 同构）；**翻页上限 10 页**（任一分页失败即整体抛出——不部分返回）；HTTP 非 2xx / 网络失败**抛出**。候选**不做对话能力过滤**（embedding 等一并返回——不造第二个人工清单）。
- **M2 候选面 = 拉取**（CLI）：`/model` L2 与 `/config → 默认模型` L2 同源；**会话级缓存 + TTL 60s（失败不缓存）**（`thincoder-cli/src/tui/model-catalog.mjs`，缓存时钟可注入）。
- **M3 渠道默认模型（单值 `providers[].model`）**：承担①新装种子②会话槽位空兜底③显示回退；消费者含 advisor / subagent 裸渠道名克隆时 model 重派生（**渠道单值优先 + 父兜底**；空值语义——渠道无默认模型则回退主 provider model，两者皆无则 fail-fast，**绝不产出静默 undefined-model 请求**）。
- **M4 放行语义（`parseModelRef` v2）**：仅三类无效——空串 / 纯空白、裸值（无冒号）、未知 provider（及 `provider:` 模型段空）；**候选外放行**、**多冒号首分割放行**（`ollama:llama3:70b` 式模型名可用）。
- **M5/M6 切换回显**：`specMatch` 判来源；正常形态 `Model: kimi:kimi-k3 — spec found (ctx 1M / out 128K)`；`DEFAULT_SPEC` 兜底 → 警示色 + `set context in /config to override`。
- **M7 配置迁移（形态 A/B → C）**：`p.model` 保留为新形态单值默认模型；`delete p.models`；取数序 = defaultModel 属本渠道段 > 现有 `p.model` > `models[]` 首个非空；幂等；写回失败不阻断启动；VSC 同规则**独立实现**。
- **M8/M9 渠道准入**：`/models` 不可用 → **该渠道视为不可用**（不列候选 / 不可选 / 无静态兜底 / 无手输绕过）；失败文案逐字 = `该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`（消息本体）+ 行内状态标签 `不可用`；**执行层 = 配置阶段**（加渠道 / 设 API key / 设默认模型的配置路径探一次）；**运行期不加闸**（启动 / 每请求零 `/models` 探测——不引入启动期网络依赖）。
- **M10 候选未命中 = 保持当前选择**：候选清单未命中「偏好 / 当前选择」时**不得静默写会话槽**——该场景写槽仅来自显式用户动作（候选行点击 / `/model` 选择）；未命中分支显示与状态同步回落会话槽复合、零 `selectModel` / `selectReasoning` post；**命中分支维持现状**（同值幂等回写 / 无槽复合时沿用 workspaceState 播种 / reasoning 归一改写）。CLI 对位 = 会话值优先链（`sessionModel ?? dm.model ?? keep.model`）。
- **UI / 交互决策（已定）**：候选列表行**直接可选**（不再区分「候选 / 建议」两组）；渠道无默认模型时显示 `(no default model)`；**不加 UI 手输行**（命令面 `provider:model` 仍放行任意串，被否的只是「在 UI 里新造手输入口」）；本批**不加** VSC 面板 spec 来源回显。**open 项：无**。

### 6.17 请求头装配（`provider.headers`）

- **两类来源**：**内置头** = transport 协议要求（`Content-Type` / `Authorization` / `x-api-key` / `anthropic-version`），各 transport 就地声明；**定制头** = 渠道级 `providers[].headers` 静态键值。
- **装配契约** = `{ ...(provider.headers ?? {}), ...内置头 }`——定制头在前、内置头在后：**同名键内置头胜出**（定制头不得覆盖 `Content-Type` 与认证头）。`Authorization` 另有装载面防线：`config.mjs` 净化器在 loadConfig 时剥离该键（大小写不敏感）+ 非字符串值。
- **消费点全表**（5 通路 + 1 对照面）：① 主聊天（OpenAI 兼容）`core.mjs`（参照面）· ② responses（`responses.mjs` 三处 fetch 改引用提升后的单个 `const headers`）· ③ anthropic（`anthropic.mjs` 既有 `const headers` 首行加展开）· ④ google（`google.mjs` 内联展开）· ⑤ 会话标题生成（`generate-title.mjs` `opts.headers` 内联展开）· ⑥ 模型清单拉取 `list-models.mjs`（对照面——零改）。
- **域外与端面**：会话动态头（`x-opencode-session` 类）不做（证据未立）；embedding 独立渠道无定制头字段；**VS Code 端无 `providers[].headers` 概念**（配置面与展开面均无——对位引入属新需求）。
- **已知边界**：大小写变体同名定制头交给 fetch 归并（不做大小写归一）；未经装载面净化而直达 `chat()` 的定制 `Authorization` 在 anthropic 通路（无内置 `Authorization`）原样透传——不在本项加第二道防线。**open 项：无**。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-PR1 | 能力差异全部走**规格表** | 新模型只加一行 spec，transport / 续写 / thinking 全自动适配；未知模型保守 `DEFAULT_SPEC` + warn once |
| D-PR2 | **实测 usage 优先于估算** | 估算对 CJK 低估 3–4x；实测值锚定压缩判定与 TPM 记账 |
| D-PR3 | **发送前净化而非改历史** | 历史是模型上下文真相；净化只作用于线上载荷、可逆 |
| D-PR4 | 429 **双通道**（闸门 + 退避） | 闸门防患于未然，退避兜底（未配置预算也安全） |
| D-PR5 | 流规则 abort 后**重试**（注入提醒让模型自修正） | 比事后清洗更可靠——内容合规是硬需求 |
| D-PR6 | 超时拆两段（响应头 `fetchTimeoutMs` + body 读侧空闲 `READ_IDLE_MS`） | 原绝对墙钟 600s 会把长上下文子代理腰斩；废弃绝对墙钟 |
| D-PR7 | prefix 续写**精简历史**（过滤工具链消息，保留最近 8 条非工具文本） | 网关约束的直接解法；否决关闭 prefixMode · 续写降级普通 chat · 仅无工具历史时续写 |
| D-PR8 | 续写 400 **失败可见**（注入 `_warnings`，不静默吞） | 静默吞 = 长回合期间 deepseek 直接报错飞出的表象源 |
| D-PR9 | **escape v5 双层**（发送前 sanitize + 源头 safeSliceUTF16） | 孤立代理是 400 根因；只做一层会在其他截断点复发 |
| D-PR10 | provider 级 context 覆盖 = **拷贝覆盖**（不污染共享 spec） | 同一模型不同端点上下文不同；否决改官方值 / 全局字段 / 自动探测 |
| D-PR11 | `models[]` 候选清单**整字段退场** | 人工清单与端点真实清单必然漂移——保留即留第二个来源；否决「保留字段、降语义为便捷列表」 |
| D-PR12 | 渠道**单值默认模型保留**（与 `defaultModel` 解析独立） | 新装种子 / 槽位空兜底 / 显示回退需要；否决静默回落种子 / 取消单值 |
| D-PR13 | 显式 `p:m` **一律放行**（含候选外 / 多冒号） | 「候选外二次确认 / `--force`」是给白名单开后门；`ollama:llama3:70b` 式名可用 |
| D-PR14 | spec 来源走**新增 `specMatch`**（与 `specForModel` 共享实现） | 热路径零变 + 单次查表 + 信息完整；否决改 `specForModel` 返回值 · 布尔旁路 |
| D-PR15 | 清单拉取 = **会话缓存 + TTL 60s**（失败不缓存） | 连续操作不重复付网络；否决无缓存 · stale-while-revalidate |
| D-PR16 | 渠道准入判据 = **`/models` 可用**；执行层 = **配置阶段**（运行期不加闸） | 不支持 / 拉不到的渠道 = 不可用渠道；运行期加闸引入启动期网络依赖与延迟（与「不阻塞会话切换」冲突） |
| D-PR17 | 候选列表**不过滤非对话模型** | 拉取面忠实呈现 provider 事实；跨 format 无统一能力字段；过滤规则会成第二个人工清单 |
| D-PR18 | 未命中处置 = **保持当前选择**（显示 = 会话槽复合 + 零写槽 post） | 与 CLI 会话值优先对位同源；零写槽 = 零静默改写；否决取候选首项 · 删兜底不回落 |
| D-PR19 | 退役 / 限期名**保留独立行**（不删、不做按日期切换规格的运行期机制） | 删行 → 旧配置降 `DEFAULT_SPEC`；静态表 + 行注释 = 零新机制；否决别名机制 · 运行期日期分支 |
| D-PR20 | `deepseek-v4-pro` **不预支视觉**（字段零改 + 注释） | 视觉能力未核实——预支的硬失败风险不排除（400 中毒）；保守 = 无硬失败 |
| D-PR21 | 请求头展开形态 = **各点内联**（与既有形态同形） | 零新机制、可 grep 逐一核对；否决抽共享装配函数（防漂移无效 + 须动已展开面）· 反向顺序（语义回退） |
| D-PR22 | 覆盖语义 = **内置头胜出**（定制头在前） | 对齐既有语义 + 安全（认证 / 内容类型不可被 headers 劫持） |
| D-PR23 | `resolveEnableThinking` 白名单**双条件**（模型前缀 + 百炼 host） | `enable_thinking` 是百炼扩展参数——全局发送会污染 kimi / glm / 自定义端点 |
| D-PR24 | Responses 链 = **单 turn + host 白名单驱动** | DeepSeek 静默忽略 = 无声丢上下文（比 404 危险）；跨 turn 重建把边界划在最稳点 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/PROVIDER.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。其下列内容**不并入本档**，理由如下：

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 档首头注 + 文末「变更记录」+ 各批「评审修正轮」逐条采纳项 | 逐批变更与修正流水账 | 历史叙述——本档自有变更记录；旧档即该历史的载体 |
| 各批「状态」行（「均已实施并核销」「R10 / M10 增量待批准」等） | 交付 / 批准状态标记 | 时点状态——live 跟踪面归批次档 / 台账（D2） |
| §16.1 / §19.1 的问题与背景叙述（v1 候选硬约束的实锤、DeepSeek 双模型现状） | 旧前提的陈述 | 现行形态已入 §6.11 / §6.16；旧前提的更正过程不随迁 |
| §13.1 支持矩阵（按厂商逐行的官方文档核实读数） | 时点核实读数 | 结论（白名单 host）已入 §6.13；逐行读数随厂商演进失真 |
| §19.2（a）逐字段「字段依据」展开 | 官方文档一手核实逐项 | 结论（行字段集）已入 §6.11；一手读数属批次取证材料 |
| §19.3 / §23.3 逐候选评估全文 | 选型对比逐行评估 | 结论已提炼入 §7（D-PR19–D-PR22） |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档节 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| §0 / §18 / §22（需求层同档承载） | R1–R20 / N1–N9 需求条目 | **现住本层需求档** `docs/requirements/PROVIDER.md`（B 轮已并入——单板块一档：设计住本档、需求住需求档） |
| §16.5 / §19.4 / §23.4 受影响文件全清单（双端逐档行数） | 逐档行数与增量 | **一次性批次材料**（文档分层纪律）——批次档承载 |
| §17 / §20 / §24 用例表 + AC 表 | 测试用例与验收清单 | **一次性批次材料**——测试资产归测试层，验收勾销归批次档 |
| §16.9 / §19.6 / §23.6 对账表 + 勘察补充发现 | 逐批对账与勘察清单 | **一次性批次材料** |
| §16.7 / §19.7 / §23.7 UI 决策表 | 逐批 UI / 交互决策与 open 项 | 结论已提炼入 §6.16 / §6.17（逐批表为批次语境；open 项均为「无」） |
| §10 / §16.3 / §6.16 的 VSC 对位实现细节（webview / settings 面板逐档） | VSC 侧独立实现 | 属 VSC 产品树（`thincoder-vscode/src/**`）；单仓单档纪律 = 各产品级实现留各产品树 |
| §21.2 通路表的 as-of 行号坐标 | 逐通路调用点行号 | 契约（装配顺序 / 通路集合）已入 §6.17；行号为时点坐标 |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **289 行**（B 轮并入前 63 行）——**低于 300 行软线，无需拆分规划**。

| # | 拆分面 | 去向 | 状态 |
|---|---|---|---|
| 1 | §6.13 Responses transport（链状态机 / 事件帧协议 / 内置工具） | 独立「Responses 协议」子档 | **需用户裁定**——与「一板块一档」的板块镜像惯例冲突 |
| 2 | §6.16 模型清单 provider 化与放行语义（含渠道准入 / 未命中处置） | 独立「模型选择面」子档（与 §6.9 规格表同方向） | **需用户裁定**（同上） |
| 3 | §6.17 请求头装配 | 工具 / 网络面（跨板拆分面窄） | **建议**（留在本档——4/5 通路在 `provider/`） |

**落地时点** = 迁移批（本批不拆）；拆分动作不得改语义（只修引用）。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #114 / #115 / #138–#143 · §2.5.1 A19 / A20 · §2.12.2 第 8 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（markdown 面小收正轮）：§1 归属表与 §2.4 #138 行的 `index.mjs` 补路径前缀（`src/provider/index.mjs`——与 `src/tools/index.mjs` / `src/tui/index.mjs` 同名不同物；**消除歧义不改判据**）。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §6 **机制面**（模块地图 / chat 主流程 / 重试超时错误分类 / SSE / 续写 / 闸门 / 净化 / 原生 transport / 规格表 / 畸形 tool_calls / 预设 / enable_thinking / Responses / 续写 400 根治 / providerSpec / 模型清单 provider 化 / 请求头装配）· §7 **关键决策记录（D-PR1–24）** · §8 **不并项与历史沿革** · §9 体量与拆分规划；
来源 = `thincoder-cli/docs/design/PROVIDER.md`（**旧档一字未改**——原地作参照历史）；产品需求条目 R1–R20 / N1–N9 归本层需求档 `docs/requirements/PROVIDER.md`；首部加机制面指针一行。
