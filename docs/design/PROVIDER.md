# Provider 层设计（thincoder/src/provider/）

> 本文档描述 LLM 调用层的**当前设计**：OpenAI 兼容协议为主 + Anthropic / Gemini / Responses 原生 transport；SSE 流式解析、重试/退避、TPM/RPM 闸门、截断续写、流规则、发送前载荷净化。状态：**当前态**（2026-08/09 各轮实现已合入，历史变更流水账折叠于文末「变更记录」）；§0 / §16 / §17 为 2026-09-10 增补（模型选择面重构——**设计已定稿待评审，尚未实现**）。
>
> 相关权威：`src/model-specs.mjs`（规格表中枢，`config.mjs` re-export `specForModel` / `providerSpec` / `specMatch`）；
> `src/config.mjs`（`resolveEnableThinking` / `isBailianHost` / `PROVIDER_PRESETS` / `resolveCompactThreshold`）；
> `src/provider/list-models.mjs`（`/models` 拉取按 format 分派——§16）；`CONTEXT-COMPACTION.md`（压缩阈值 / tail 公式 /
> 续写失败可见性——本文件 §14/§15 为其权威）。跨文档已接管的主题只留指针，不复制。

## 0. 需求层（模型选择面重构——2026-09-10）

> 归属注：Provider 板块无 `requirements/` 镜像（`docs/README.md` §4.1 现状）——本板块需求层**同档承载**
> （三层同档历史形态；按"新老划断"待后续批量拆分迁出）。本节 = 本板块需求；设计见 §16；测试层见 §17。
> 批次依据：`../batches/2026-09-10-MODEL-SELECTION.md` §1（用户已收口——6 条裁定 + 2 项随件）。

### 0.1 总体需求

可用模型清单的**权威 = provider 运行期拉取**（`GET /models`），不是人工维护的配置字段。
为此：`providers[].models[]` 候选清单**整字段退场**；每个渠道保留**恰好一个**默认模型（单值）；
显式 `provider:model` **一律放行**（仅空值 / 裸值 / 未知 provider 无效）；切换成功回显规格来源；
VS Code 端同批对齐。

### 0.2 功能性需求（R1–R6 + 随件 R7/R8——每条带判定句）

| # | 需求 | 判定句（验收口径） |
|---|---|---|
| R1 | **清单来源 provider 化**：模型清单运行期从 provider 拉取（`GET /models`），按 `format` 各实现一份（openai / anthropic / google）；清单成为各选择面（`/model`、`/config 默认模型`、VSC 面板）的候选来源。**拉不到列表 = 该渠道不可选**（准入要求：渠道必须支持 `GET /models`）。 | 三种 format 各有拉取实现且能解析出模型 ID 列表；`models[]` 删除后全链路无静态候选来源残留；拉不到列表 = 该渠道不可选（准入判据）。 |
| R2 | **`providers[].models[]` 整字段删除**：内置预设、迁移、会话槽位兜底、picker 候选区、`/config` 默认模型菜单、wizard 播种全部不再读写该字段。 | 全仓无对 `providers[].models` 的读写（老形态迁移读取除外——迁移即删）；预设/播种面只落单值模型。 |
| R3 | **渠道默认模型（单值）**：每渠道保留恰好一个默认模型字符串——承担①新装启动种子②会话槽位空时兜底。 | 20 个内置预设各携一个默认模型；会话槽位 `activeModel` 空/缺失时回落 `providers[].model`；显示回退使用它。 |
| R4 | **显式 `provider:model` 放行**：一律放行；仅【空值 / 裸值（无冒号）/ 未知 provider】= 无效。 | `parseModelRef` 对三类无效返回 `ok:false`；对候选外模型、多冒号（`a:b:c`）等显式值返回 `ok:true`（provider 存在时）。 |
| R5 | **切换回显 spec 来源**：切换成功回显一行规格来源；`DEFAULT_SPEC` 兜底时警示色 + 提示经 `/config` 设 `context` 覆盖。 | `/model p:m` 与 picker 选择后均出现来源回显行；未命中 MODEL_SPECS 时回显行含警示色与 `/config` 提示。 |
| R6 | **VSC 端同批对齐**：面板候选同源（provider 拉取）+ `resolveDefaultModel` 不再静默回退 `models[0]`。 | VSC 面板候选来自运行期拉取（`models[]` 字段删除后不受影响）；`resolveDefaultModel` 回退链改为"复合属本渠道 → 渠道默认单值 → null"。 |
| R7 | **契约测试反转**（随件）：`test/model-ref.test.mjs`、`test/config-merge.test.mjs`、`test/provider-model-guard.test.mjs`（双端）转为新契约。 | 三族测试断言候选外可切换、不再标 invalid；双端跑绿。 |
| R8 | **文档连带改写**（随件）：`SESSION.md` 硬约束句、`model-ref.mjs` 头注与注释、`PROVIDER.md` 本文件、`_archive/MODEL-MERGE-SESSION.md` 取代关系一行、代码内 F-1/F-7 注释引用。 | 现状描述中无"候选硬约束 / 候选外拒"残留；归档正文不重写、取代关系在变更记录可见。 |
| R9 | **渠道准入校验（配置阶段）**：加渠道 / 设 API key / 设默认模型的配置路径对目标渠道探一次 `GET /models`（复用 M1）；探通 → 渠道可用、候选可直接用于默认模型选择；探不通 → 界面明示「该渠道不提供模型列表（GET /models {状态}）——不可用」且**不作为默认模型可选来源**；**不阻断配置流**（条目仍可保存）。 | 双端配置写入面各实现探通/探不通两态；探不通渠道不入可选清单且界面标注；运行期（启动 / 请求）零探测（N2）。 |

### 0.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 兼容 | 全部老配置形态（形态 A：`providers[].model` + `activeProvider/activeModel`；形态 B：`models[]` + `defaultModel`）迁移不丢凭据、不丢默认模型；写回失败不阻断启动（幂等——下次 load 重试）。 |
| N2 | 性能 | `specForModel` 保持热路径形态（共享对象 + 单次查表——来源回显不新增每请求开销）；清单拉取不阻塞会话切换（异步 + 超时上限）；准入校验只在配置阶段（启动/请求零 `/models` 探测）。 |
| N3 | 单一权威 | 模型清单的唯一权威 = provider 运行期拉取结果；进程内缓存仅作加速（失败即失效、过期即重拉）。 |
| N4 | 双端独立 | CLI / VS Code 各自实现、语义同源；不做逐字硬一致、不加双端同步依赖（差异如实落档——本次差异：回显仅 CLI 面，见 §16.7）。 |

## 1. 总览与模块地图

Provider 层把模型能力差异收敛到一张**规格表**（`MODEL_SPECS`，§9），其余代码按 spec 全自动适配；把各厂商协议差异收敛到 transport 分派（`provider.format`），核心 `chat()` 对调用方暴露统一结果形态。

| 文件 | 职责 |
|---|---|
| `src/provider/index.mjs` | re-export：`chat` / `listModels` / `estimateText` / `createProvider` / `stripImagesForTextModel`（backward-compatible 入口，调用方从 `./provider` 引用） |
| `src/provider/core.mjs` | chat 入口（transport 分派）、OpenAI 格式 body 组装、`requestWithRetry`（OpenAI 路径）、载荷净化（stripImages / normalizeToolPairing / escapeMessages）、截断续写循环、`buildContinuationMessages`、overload 重试、Kimi 401 平台提示、`effectiveFetchTimeoutMs`、`createProvider` |
| `src/provider/list-models.mjs` | `/models` 拉取按 `format` 分派（openai / anthropic / google——§16 M1；2026-09-10 自 core.mjs 迁出并扩两分支） |
| `src/provider/sse.mjs` | `readSSE`：OpenAI 格式 SSE 解析、畸形 tool_calls 防御归并（§10）、usage 缓存归一、流规则触发、中断/partial、读侧 idle 超时 |
| `src/provider/rate.mjs` | TPM/RPM 滑动窗口闸门、token 估算、重试常量（`RETRYABLE_STATUS` / `MAX_RETRIES` / `MAX_CONTINUATIONS` / `RATE_LIMIT_BACKOFF_MS`）、`_rateHooks` 测试钩子 |
| `src/provider/errors.mjs` | OpenAI 路径错误分类族：`parseRetryAfter` / `isNonRetryableError` / `betaBaseURL` / `compileStreamRules`（2026-09-05 自 core.mjs 迁出） |
| `src/provider/retry.mjs` | anthropic/google/responses 共用的通用退避重试链（`requestWithRetry(request, …)`） |
| `src/provider/normalize.mjs` | 发送前净化纯函数：`stripImagesForTextModel` / `normalizeToolPairing`（2026-08-31 自 core.mjs 迁出） |
| `src/provider/anthropic.mjs` | Claude 原生 transport（`/v1/messages` + 事件流） |
| `src/provider/google.mjs` | Gemini 原生 transport（`generateContent` / `streamGenerateContent?alt=sse`） |
| `src/provider/responses.mjs` | OpenAI Responses API transport（`format: "responses"`，§13） |
| `src/model-specs.mjs` | `MODEL_SPECS` 规格表 + `specForModel` + `providerSpec`（能力中枢，2026-08-31 自 config.mjs 迁出） |

规格表驱动一切能力差异：新模型只加一行 spec，transport / 续写 / thinking 全自动适配；未知模型保守回退 128K + 警告（§9）。

## 2. chat() 主流程（core.mjs）

`chat(provider, opts)` → `chatImpl`。调用方传入 `{ messages, tools, onToken, onReasoning, onWait, signal, streamRules?, firedPatterns?, toolChoice?, parallelToolCalls?, logCtx? }`，返回统一结果：

```js
{ content, reasoning, toolCalls, usage, finishReason,
  _warnings?, interrupted?, partial?, droppedToolCalls?, ruleTriggered? }
```

**流程（chatImpl）**：

1. **净化（分派前）**：`providerSpec(provider)` 取带 provider 级 context 覆盖的 spec；`stripImagesForTextModel(messages, spec)` 防图片毒化；`stripLocalMessageFields` 剥离仅本地消息字段（ts/transient），anthropic / google / responses 原样透传消息对象，故净化必须先于分派。
2. **format 分派**：`provider.format` 决定协议——
   - `"anthropic"` → `anthropicChat`（§8）
   - `"google"` → `geminiChat`（§8）
   - `"responses"` → `responsesChat`（§13，分派前先 `normalizeToolPairing`）
   - 缺省 → OpenAI 兼容（body 组装在 core 内联，走 3–9 步）。
3. **OpenAI body 组装**：`model` / `messages` / `stream: true`；非 `noUsageStream` 模型附
   `stream_options: { include_usage: true }`；`max_tokens` 按 `provider.maxTokens`；`temperature` 按
   `spec.tempRange` 钳位（四舍五入 2 位小数）；`thinking` 参数按 `spec.thinkApi` 注入
   （`type` → `thinking` 字段）；`reasoning_effort` 校验进 `spec.reasoningEffortEnum` 后注入
   （router 模型 ID 含 `/` 时不发，防误判）；`enable_thinking`（Qwen，§12）；`tools`；`tool_choice` /
   `parallel_tool_calls`（后者仅显式 `true` 时发）。
4. **token 估算与闸门**：`estimateRequestTokens(body)` → `rateGate`（TPM/RPM 预算内，超预算睡眠等待，§6）。
5. **请求**：`requestWithRetry(provider, body, signal, onWait)`（§3）→ `readSSE`（§4）→ `recordRate(provider, estimated, result.usage)` 用实测 usage 修正记账。
6. **结果短路**：`ruleTriggered`（流规则 abort）/ `interrupted`（用户 Ctrl+I）/ `partial`（网络错误中断但已有内容）**立即返回**——不让上层把已收内容当整轮失败重试。
7. **overload 重试**：`finishReason === "insufficient_system_resource"`（DeepSeek 服务端资源耗尽）→ 最多 1 次（`MAX_OVERLOAD_RETRIES`）重发，成功则合并 content/reasoning/toolCalls/usage。
8. **截断续写**：`finishReason === "length"` 且 `spec.partialMode` / `spec.prefixMode` → 续写循环（§5），经 `buildContinuationMessages`（§14.2/14.3）构造续写消息递归 `chat()`，跨续写累计 usage。
9. 返回结果（§14.3：续写失败注入 `_warnings`，不整轮飞出）。

## 3. 重试、超时与错误分类
### 重试辅助函数去重（2026-09-08 ENG-SESSION-PROVIDER-CLEANUP）

- **parseRetryAfter**：唯一实现在 errors.mjs，retry.mjs 导入（删重复实现——原 retry.mjs 复制版逐字节相同）。
- **sleepInterruptible**：唯一实现在 core.mjs（export），retry.mjs 导入。
- **429 配额判定**：统一为 errors.mjs `isNonRetryableError`（文本+JSON 双判版），retry.mjs `isQuotaExhausted`（纯正则版）删——规则漂移消（errors 版多 JSON err.code 1113/1114 结构判，retry 版有 "billing/quota exhausted" 字面正则——统一为双判版）。
- **依赖方向**：errors.mjs 和 retry.mjs 都独立（互不依赖，均 import rate.mjs），core.mjs 依赖 errors.mjs——无循环依赖（retry.mjs 注释说的"循环依赖回避"是历史遗留，现已无循环——单向导入）。

**重试常量**（rate.mjs / core.mjs）：`MAX_RETRIES = 3`；`RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 60_000]`；`RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}`。

**重试策略**：

- **429**：尊重 `Retry-After` 头（秒数或 HTTP-date，上限 300s——异常头不得让 CLI 睡数小时）；无头/非法则退避表取档 15s / 30s / 60s。
- **5xx / 408 / 409 / 425**：指数退避 `2^(n-1)` 秒。
- **不重试**（`isNonRetryableError`）：401 / 403 认证；400 级非 429；429 但 body 含余额/配额特征（中文「余额不足/余额/充值」、`insufficient_quota` 类、GLM billing code `1113` / `1114`）。
- 全部重试耗尽：按 lastStatus 分类报错——`Rate limit not resolved` / `Server error persisted` / `Request failed` / `Network error`；cause 解包拼进文案（会诊 #8：undici「fetch failed」真因藏在 `error.cause`）。

**401 / 403 诊断**（core.mjs + anthropic/google/responses 共用通用语义）：

- **Kimi 双平台提示**：`sk-kimi-` 前缀 key 或 `api.kimi.com` 端点遇 401/403 → 追加说明——Moonshot 与 Kimi For Coding 两平台的 key **不互通**。
- **通用诊断回显**：追加 `[auth diag: baseURL=… key=… status=…]`（host + key 前 6 位掩码），帮用户分辨「配错平台还是配错账号」。

**超时语义（2026-09-01 根因修复——废弃绝对墙钟）**：

- 原 `FETCH_TIMEOUT_MS` 600s **绝对墙钟**会把长上下文子代理（eng-coder 思考 >10min、首 token 前 TTFB 超线）腰斩为 `The operation was aborted due to timeout` 直透。已拆分：
- **响应头阶段**用 `fetchTimeoutMs`——默认 600s，`agent.fetchTimeoutMs` 可配，config.mjs 归一化到 `runtimeProvider.fetchTimeoutMs`，`effectiveFetchTimeoutMs(provider)` 统一消费（core / anthropic / google / responses 四 transport 共用）。
- **body 阶段**用读侧**空闲**超时 `READ_IDLE_MS = 120s`（sse.mjs / google.mjs）——body 只要有数据流动就永不超时，连续无新 chunk 才判死；proxy 路径 `_bodyIdleMs` 与之等价（双保险）。
- `AbortError` 透传（用户 Ctrl+I 取消，不吞）。

## 4. SSE 流式（sse.mjs readSSE）

- **分帧**：TextDecoder 分块解码，按行缓冲 `\n\n` 分帧（2026-08-31 起按 SSE 规范支持多行 `data:`，单行事件行为不变）；`data: [DONE]` 结束。UTF-8 BOM 剥除（流首 `\uFEFF` 会吞首个事件）。
- **非 SSE 兜底**：content-type 非 `event-stream` → 尝试单 chunk JSON 解析（网关把 `stream: true` 降级为完整 completion），读 `choice.delta` 或 `choice.message`；HTTP ≥400 解析各厂商 error 字段抛错。
- **delta 累加**：`content` / `reasoning_content`（thinking 流，转发 onReasoning；方言同时认 `reasoning`——DeepSeek/Kimi/GLM 用 `reasoning_content`，OpenAI o 系/部分路由器用 `reasoning`）/ `tool_calls`（按 index 增量拼装 id/name/arguments，畸形防御见 §10）。
- **usage 帧**：`choices: []` 的 data 帧捕获 `usage`（prompt/completion/cache hit/miss tokens）→ 状态栏展示 + 压缩实测基线（CONTEXT-COMPACTION §8）。缓存字段归一为 DeepSeek 风格 `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`（`normalizeUsageCache`：OpenAI 报 `prompt_tokens_details.cached_tokens`，少数在 usage 顶层）。
- **中断**：`signal.abort` → 抛 AbortError；`signal.reason.interrupt`（用户 Ctrl+I）→ 提交已生成部分并标 `interrupted: true`（agent 区分「用户中断注入」与普通取消）。
- **partial（2026-08-31 会诊 #2）**：网络级失败（ECONNRESET / 半截 EOF / proxy 断连）已解析出内容 → 标 `partial: true` + `networkError`，注入 `_warnings`（`network-partial`）交回上层（可续写/展示部分结果），不整轮报废重试。
- **读侧 idle 超时**：`READ_IDLE_MS = 120s`，连续无数据 `destroy` body 抛 `SSE idle timeout: no data for 120s`。
- **流规则**（`compileStreamRules` 编译 `{ pattern, message, action: "abort"|"warn", flags?, repeat? }`）：
  SSE 中对已生成文本做正则匹配——`abort` 立即中断并标 `ruleTriggered` + `ruleMessage`
  （agent 注入规则消息后重试）；`warn` 不中断，去重收集 `_warnings` 在回合后注入；
  `repeat: "once"` 用 `firedPatterns` 跨调用去重（每次用户消息重置）。
  **responses 格式不接 streamRules**（§13.4）。

## 5. 截断续写（两协议）

`finishReason === "length"`（输出 token 截断）时按 spec 声明协议续写：

| 协议 | spec 字段 | 机制 | 适用 |
|---|---|---|---|
| **prefix** | `prefixMode: true` | `/beta` 端点续写（`betaBaseURL`），请求体附 `prefix: true` + 上次 usage（DeepSeek 前缀计费）；reasoningEcho=required 时回传 `reasoning_content` | DeepSeek 系列 |
| **partial** | `partialMode: true` | 同一次响应内直接续写：`MAX_CONTINUATIONS = 3` 次追加请求（不回传全文，只发新问题）；usage 跨续写累计 | Kimi / Qwen / MiniMax |

- **prefix 历史约束（§14 实锤并修复）**：prefix 续写请求**只带精简历史**——过滤全部 `tool` / `assistant(tool_calls)` 消息（DeepSeek 网关对含工具链历史的 prefix 续写**必 400**，带不带 `reasoning_content` 均炸），保留 system + 最近 8 条非工具文本；构造逻辑见 §14.3 `buildContinuationMessages`。partial 续写不受影响（同端点 + partial 标志，网关无此约束）。
- **提醒**：异常 finish reason 由 agent 层（`injectResponseReminders`）人类化描述注入（`output token limit reached after exhausting continuations` 等），模型下轮可见（§14.4）。

## 6. TPM/RPM 闸门（rate.mjs）

- provider 配置 `tpm` / `rpm` 后启用：**发送前**记账（60s 滑动窗口，`estimateRequestTokens` 估算，ASCII ≈4 chars/token、CJK ≈1 char/token），超预算 `sleep` 到窗口腾出空间（onWait 通知 UI）；未配置则闸门关闭（429 退避仍生效）。
- `recordRate(provider, estimated, usage)` 在响应后以**实测 usage** 修正记账。
- 单请求估算已超 tpm 时不卡死（放行交给重试层），但 onWait 告警 `estimated N tokens > tpm M — request proceeds and may hit a server 429`。
- 窗口按 `baseURL`（`/beta` → `/v1` 归一，prefix 续写同一账户预算）+ apiKey 键控；`_rateHooks` 可注入（测试用假时钟/假 sleep）。窗口空时删除条目，防长驻 Map 无界增长。

## 7. 发送前载荷净化（纵深防御）

- **`stripImagesForTextModel(messages, spec)`**：非视觉模型发送前把残留 `image_url` 替换为文本占位符——防「视觉会话切到文本 provider 恢复」的存量毒化与 svg/bmp 等非 raster 图（Kimi 400 `unsupported image format`）；历史本身不改，切回视觉模型图片即恢复。HTTP 图片引用放行。
- **`normalizeToolPairing(messages)`**：严格 provider（DeepSeek）要求 tool 消息紧跟其 owner assistant——
  历史可能合法地违反（并行多模态注入、压缩切割、中断残留）→ 发送前：tool 消息重排到 owner 之后、
  孤儿 tool 丢弃、缺失结果合成 `[Tool result missing: …]` 占位（完整文本：
  `the call was interrupted or its result was dropped by context compaction`）。
  与压缩的配对保护（CONTEXT-COMPACTION D5）同语义，一个管源头一个管兜底。
- **escape v5（§14.6）**：发送前净化字面 hex 转义 + 孤立 UTF-16 代理（DeepSeek 400 根因），源头截断点 UTF-16 安全切——见 §14.6。

## 8. 原生 transport（anthropic / google）

**Anthropic**（`format: "anthropic"`，anthropic.mjs）：

- POST `/v1/messages`，头 `anthropic-version: 2023-06-01`（`ANTHROPIC_VERSION`），key 走 `x-api-key`。
- system 消息抽离到顶层 `system` 字段；tool 用 Anthropic `tool_use` / `tool_result` block；`max_tokens` = `provider.maxTokens` 或 `spec.maxOutput`。
- 事件流解析（`parseAnthropicStream`）：`message_start` / `content_block_start`（tool_use 入 map）/
  `content_block_delta`（`text_delta` → content、`thinking_delta` → reasoning、
  `input_json_delta` → tool arguments）/ `message_delta`（usage）/ `message_stop`（tool_use 收尾）。
  usage `cache_read/cache_creation_input_tokens` → 内部 cache 字段。`tool_choice` 映射
  （auto/required/none/具体函数）。
- 接入 rateGate/recordRate + 通用退避重试链（会诊 #6——原绕过闸门）。

**Gemini**（`format: "google"`，google.mjs）：

- `generateContent` / `streamGenerateContent?alt=sse`（key 走 query 参数）。
- role 映射 `assistant → model`（system 抽到顶层 `systemInstruction`）；相邻同 role 消息合并；图像 data URL → `inlineData`（mimeType + base64 data）。
- `generationConfig`（temperature / maxOutputTokens）；safetySettings 全 BLOCK_NONE。
- 事件流解析（`parseGeminiStream`）：`usageMetadata` → usage（`noUsageStream` 模型无流式 usage）；`part.thought === true` → reasoning，否则 text；`part.functionCall` → toolCalls（同名去重合并，id 合成 `name_N`）。
- 接入 rateGate/recordRate + 通用退避重试链（2026-08-31——原完全无重试，Gemini 高峰 503 直接抛）。中断/partial 语义与 sse.mjs 对齐。

## 9. 规格表（MODEL_SPECS）与关键设计决策

**规格表中枢**（`src/model-specs.mjs`）：所有模型能力差异在此声明——`context`（上下文窗口）/
`maxOutput` / `thinking` / `partialMode` / `prefixMode` / `multimodal` / `cacheMode` /
`thinkApi`（`type` = thinking.type 字段 / `effort` = reasoning_effort）/ `thinkEnabledValue`
（MiniMax `adaptive`）/ `reasoningEcho`（required = 必须回传，optional = 默认不回传）/
`reasoningEffortEnum` / `tempRange` / `noUsageStream`。

| 决策 | 理由 |
|---|---|
| 规格表驱动一切能力差异 | 新模型只加一行 spec，transport/续写/thinking 全自动适配；未知模型保守 `DEFAULT_SPEC`（128K 上下文 / 32K 输出）+ warn once（`[config] model "…" not found in MODEL_SPECS — using default spec…`） |
| 实测 usage 优先于估算 | 估算对 CJK 低估 3–4x；实测值锚定压缩判定与 TPM 记账 |
| 发送前净化而非改历史 | 历史是模型上下文真相，净化只作用于线上载荷，可逆 |
| 429 双通道（闸门 + 退避） | 闸门防患于未然（省一次失败往返），退避兜底（未配置预算也安全） |
| 流规则 abort 后重试 | 内容合规是硬需求——中断注入提醒让模型自行修正，比事后清洗更可靠 |
| 厂商前缀剥离（2026-09-04，第三方 token 市场惯例） | 完整名前缀未命中且含 `/` 时**剥掉首个 `/` 前 namespace 再匹配一次**（`ZHIPU/GLM-5.3 → glm-5.3` 命中真实规格而非 128K 默认）；`kimi/kimi-k3` 显式 alias 行保留；warn 仍 once + 保留原始名可诊断；只影响 spec 查询，**不改 `provider.model`**（`isRouter` 判定不受影响） |
| **规格来源可判定（2026-09-10，§16 M5）** | 切换回显需知是否 `DEFAULT_SPEC` 兜底；`specForModel` 保持共享对象与热路径形状不变（23 个 importer 零感）——新增 `specMatch(model) → { spec, matched }`，与 `specForModel` **共享同一查表实现**（单次查表）；warn-once 去重两侧共用 |

**re-export 契约**：`config.mjs` re-export `specForModel` / `providerSpec` / `specMatch`（先例：2026-08-31 规格表迁出后既有 importers 从 config 取，不破坏调用点）；`providerSpec` = spec + provider 级 context 覆盖（§15）。

## 10. 畸形 tool_calls 防御解析（sse.mjs mergeToolCalls / finalizeToolCalls）

OpenAI 兼容 SSE 流中畸形 `tool_calls`（数组含 null 元素、缺 `function` / `name` / `id` / `index`）不再导致崩溃或静默丢工具——防御性解析 + 机读告警。只防御与降级，不替模型修复语义。

**槽选择优先级**：

1. `index` 有效（整数 ≥0）→ 按 index 取槽（不存在则新建）。
2. 缺 index 但有 `id` → 按 id 在既有槽中查找归并；找不到则新建尾部槽。
3. 缺 index 无 id 但有 `function.name` → 新建尾部槽（新调用）。
4. 缺 index 无 id 无 name（纯 arguments 增量）→ 延续最后一个槽；无槽可延续则丢弃并计数。

```js
for (const tc of delta.tool_calls ?? []) {
  if (!tc || typeof tc !== "object") { result.droppedToolCalls++; continue } // null/畸形元素：跳过+计数
  let slot
  if (Number.isInteger(tc.index) && tc.index >= 0) {
    slot = (result.toolCalls[tc.index] ??= { id: "", name: "", arguments: "" })     // 规则 1
  } else if (tc.id) {
    slot = result.toolCalls.find((s) => s && s.id === tc.id)                        // 规则 2：按 id 归并
    if (!slot) { slot = { id: tc.id, name: "", arguments: "" }; result.toolCalls.push(slot) }
  } else if (tc.function?.name) {
    slot = { id: "", name: "", arguments: "" }; result.toolCalls.push(slot)          // 规则 3：新调用
  } else {
    slot = result.toolCalls[result.toolCalls.length - 1]                             // 规则 4：增量延续尾槽
    if (!slot) { result.droppedToolCalls++; continue }                               // 无前槽可延续
  }
  if (tc.id && !slot.id) slot.id = tc.id                                             // 缺 id → 收尾合成
  if (tc.function?.name && !slot.name) slot.name = tc.function.name
  const arg = tc.function?.arguments
  if (typeof arg === "string") slot.arguments += arg
  else if (arg != null) slot.arguments += JSON.stringify(arg)                        // 非字符串参数防御
}
```

**流结束收尾**（finalizeToolCalls）：稀疏 hole 剔除（rule-1 index 跳号）、name 空槽丢弃并计数、缺 id 合成 `call_N`（避让已用 id，保证 `tool_call_id` 配对唯一）。

**告警通道**（机读线）：`result.droppedToolCalls > 0` → `_warnings` push
`{ name: "malformed-tool-calls", message: "N malformed tool_calls dropped from provider response" }`——
复用 agent `_warnings` 注入机制（**机读线注入，模型需知道其工具调用未执行；agent 层零改动**）。
两端统一策略：告警一律进机读线（模型可见），不进人读线。单测锁定（`sse.test.mjs`：
null/缺 name/缺 id/纯增量/function:null/对象 arguments/混合负载 + 回归）。

## 11. 模型支持与预设（MODEL_SPECS / PROVIDER_PRESETS）

- **能力差异全部走规格表**：加一个新模型 = 在 `MODEL_SPECS` 加一行（§9 决策）。示例——
  `glm-5.3-flash`（智谱 GLM-5 系列 Flash 档，1M 上下文 / 128K 输出 / thinking 始终开
  `thinkApi:"type"` / `reasoningEffortEnum: ["low","high","max"]` / **multimodal: true** 原生文本+图片 /
  `cacheMode:"auto"` / `tempRange:[0,1]` / `noUsageStream:true`）：读图能力靠 `spec.multimodal`
  自动放行，无需改 file 门禁。
- **预设**：`PROVIDER_PRESETS`（config.mjs，含 deepseek / kimi / kimi-code / glm / glm-code / qwen /
  qwenplan / mimo / mimoplan / minimax / openai / claude / gemini / grok / mistral / volcengine /
  hunyuan / siliconflow / openrouter / groq 共 20 家）——按需从预设创建 provider，各预设声明
  baseURL/**model（单值默认模型——2026-09-10 起）**/thinking/reasoningEffort/maxTokens/desc。
  **预设不再携带候选清单**（原 `models` 种子已废——渠道默认模型单值与清单 provider 化的机制见 §16 M3/M1；
  本批之前经旧预设安装的渠道，其 `models[]` 由配置迁移（§16 M7）转为单值）。
- `kimi/kimi-k3`（router 前缀）与 `k3`（Kimi For Coding 短 ID）保留显式 alias 行（IK7K4V / IK5VGJ）；未知模型保守 `DEFAULT_SPEC`。

## 12. Qwen 思考关闭（enable_thinking）

qwen 系列（阿里云百炼**混合思考**模式，默认开启）需能**真正关闭**思考。缺陷：qwen3.x 在 reasoning `off` 时原请求体不含任何思考控制字段 → 服务端按默认开启 → `/think off` 与面板 off **静默失效**。官方核验：混合思考模型 `enable_thinking:false` 即关闭；仅思考模型（qwen3.7-max-preview 等）无法关闭。

**纯函数 `resolveEnableThinking(provider, spec)`**（config.mjs，两端同构造——CLI 与 VS Code byte 对齐）：

```js
export function resolveEnableThinking(provider, spec) {
  const model = (provider?.model ?? spec?.model ?? "").toLowerCase()
  if (!model.startsWith("qwen") || model.startsWith("qwen3-coder")) return undefined
  if (!isBailianHost(provider?.baseURL)) return undefined
  if (provider.thinking === null) return false    // 显式 off（NF1 约定）
  if (provider.reasoningEffort) return true       // effort 档位（与 reasoning_effort 并存）
  return undefined                                 // 未设置 → 服务端默认
}
```

- `isBailianHost`：baseURL 含 `dashscope.aliyuncs.com` 或 `.maas.aliyuncs.com`。
- 白名单双条件：模型名 `qwen` 开头（排除无思考编码的 `qwen3-coder` 前缀）**且** provider 指向百炼 host——`enable_thinking` 是百炼扩展参数，全局发送会污染 kimi/glm/自定义端点。
- `provider.thinking === null` 是两端统一的**显式 off 唯一标记**（vscode `resolveReasoningMode` off 已产 `thinking:null`；CLI `/think off` 同约定）；`autoThink` 清空 = `undefined`（auto 语义不受影响）。
- 注入点：core.mjs（OpenAI body 组装，`enableThinking !== undefined` 时发 `body.enable_thinking = enableThinking`）；vscode openai transport 同款。**不受 router 门控**（白名单键控模型前缀 + 百炼 host，非模型 ID 斜杠）。
- **选档位 / 开 auto = 隐含 thinking on**：清 `thinking:null` off 标记（off→effort / off→auto 序列不得残留 null，否则 `enable_thinking:false` 与 `reasoning_effort` 矛盾同发）。on 分支默认 effort 取 `spec.reasoningEffortEnum[0]` **而非硬编码 `"high"`**（qwen3.8-max enum `xhigh/medium/low` 不含 high，硬编码过 core.mjs 校验直接 throw）。
- 单测锁定映射（resolveEnableThinking 各分支 + CLI `/think` 状态机 + TUI `/think` 菜单头部 `Thinking: OFF` 正确显示 null 显式 off）。

## 13. Responses API Transport

`format: "responses"`（四值之一）。`provider.stateful` 默认 `true`，但**链仅在白名单 host 生效**（host 驱动，不能只靠服务端报错兜底——DeepSeek 明说「不支持的参数被静默忽略、不会报错」，`previous_response_id` 发过去被忽略 = 只剩增量 input = **无声丢上下文**，比 404 危险）。

### 13.1 支持矩阵（2026-08-31 官方文档一手核实）

| 厂商/端点 | 格式 | previous_response_id | reasoning 明文回传 | 判定 |
|---|---|---|---|---|
| OpenAI 官方 `api.openai.com/v1` | ✅ | ✅ store:true 30 天 | ❌ encrypted | 完整 → 开链 |
| 百炼 Qwen `/compatible-mode/v1/responses` | ✅ | ✅ 7 天（传顶层 response id） | ✅ summary 明文 | 完整 → 开链 |
| DeepSeek `api.deepseek.com` | ✅ | ❌ **不支持**（静默忽略） | ✅ 明文 content | 全量模式，链禁用（灰名单） |
| 智谱 GLM `open.bigmodel.cn/api/v1`（Coding Plan） | ✅ | ✅ store:true 链全链路工作（store:false → 400 not_found） | ✅ | 升级白名单；内置工具走官方 MCP 生态 |
| Kimi | ❌ | — | — | 不接 |
| 火山方舟 | ✅ | 未核实 | 未核实 | 留位（一期不接） |

### 13.2 设计概览

- **双轨**：本地会话/历史仍是**唯一事实源**（压缩/落档/恢复/跨端零变化）；`previous_response_id` 链只是**发送层优化**。`store: false`（本地有全量，不托管服务端）——但百炼硬规则强制 `store:true`（D10）。
- **链生命周期 = 单次 turn**（D2）：runAgent 开始重置（发全量建链），turn 内工具往返用链增量（每往返请求体大幅削减，实测 98.9% 体积削减）；**跨 turn 无条件重建**（正确性优先）。
- **链失效（404/过期）** → 自动重置链 + 本地全量重发一次（D6），无数据丢失。
- **工具调用**：内部 `{id, name, arguments}` ↔ responses `function_call` / `function_call_output` item（call_id 配对）双向适配（D4）。
- **请求体**：system → 顶层 `instructions`；messages → input items（user/assistant message、function_call、function_call_output）；`reasoning: { effort }`；`max_output_tokens`；`stream: true`——流以 `response.completed` / `response.incomplete` / `response.failed` 结束，**无 `data: [DONE]`**。
- **reasoning**：`response.reasoning_text.delta`（DeepSeek 文档列名）→ onReasoning；usage 从 `output_tokens_details.reasoning_tokens`（reasoning tokens 计入）与 `input_tokens_details.cached_tokens`（缓存命中）；completed 事件响应对象携带 usage（**不依赖流式 usage 帧**，D5）。
- 内置工具结果（web_search_call）本地化 tool 消息（JSON 含 query/sources）→ 全量回传时按 `tool_call_id` 前缀还原原样 `web_search_call` item（D9，DeepSeek 官方原样回传服务端自动恢复搜索结果）。

### 13.3 关键决策

| 决策 | 理由 |
|---|---|
| D1 双轨：本地事实源 + 链仅发送层 | 会话是核心资产；服务端 7 天过期且锁厂商 |
| D2 链 = 单 turn | 跨 turn/压缩/恢复/换模型漂移不可控；每 turn 重建把边界划在最稳点 |
| D3 默认无状态（stateful 默认 true 但仅白名单生效） | 针对「支持链」端点；白名单外自动全量，对用户无感且正确 |
| **D8 host 白名单驱动链** | DeepSeek 静默忽略 = 无声丢上下文；白名单：openai 官方 + 百炼（dashscope/maas compatible-mode）+ 智谱（bigmodel.cn，真机验证）；灰名单（deepseek.com）→ 全量 + 一次性 warning；provider 显式 `stateful: true/false` 覆盖（高级逃生舱，信任自定义网关时用） |
| D4 工具 item 双向适配 | function_call/function_call_output ↔ 内部 `{id,name,arguments}`；call_id 是配对锚点 |
| D5 不依赖流式 usage 帧 | completed 事件响应对象携带 usage（流末尾一帧）——与 chat completions 的 `choices:[]` 帧不同 |
| D6 链失效自动回退 | 404/过期 → 全量重发一次（不是报错）；链是优化不是正确性依赖 |
| D7 不探测不降级（格式层） | format 显式配置显式失败；重试/限流/错误语义与 chat 格式共用（requestWithRetry） |
| **D10 store 硬规则** | 百炼/GLM 链 **必须 store:true**——store:false 时 `previous_response_id` 一律 400 `Not found`（真机全组合验证）；OpenAI 官方 store:false 链仍可用。→ 开链时 store:true（对话云端留存 7 天——首次 warning `responses-store-retention` 知悉，`provider.stateful=false` 退出）；DeepSeek 灰名单全量恒 store:false |
| **D11 事件帧协议** | 百炼 SSE：`data:{…}` 无空格 + `event:xxx` 行 + 注释行 + **`event:error` 帧（HTTP 200 内嵌业务 400，data 无 type 字段）**——不识别 error 帧 = 静默空内容当回复。解析器兼容 data 无空格 + `event:error` → 抛错 |
| **D9 内置工具（一期 web_search）** | 服务端执行——**绕过本地工具权限门/审计**（产品决策，风险明示）；host 映射默认声明（openai/百炼/DeepSeek），`provider.builtinTools:false` 关闭、数组显式覆盖；结果 `builtinToolResults` → agent 本地化 `role:"tool"` 消息；code_interpreter/web_extractor 二期 |

**链状态机**：`chainKey`（system 部分 + 最后一条 user 消息，turn 内不变 / 跨 turn 变 / 压缩后变）校验；`stateful:false` 或灰名单或 key 失配 → 全量重建；增量只发上一链轮未发送的 `function_call_output`；无新增 → 退化为全量（正确性优先）。链失效（404/400）catch → 清残留链 + 真·全量重发一次（仅一次防死循环）；`finishReason !== "length"` 且 completed 带 response.id → 保存链供 turn 内后续使用，否则作废。

### 13.4 实现影响与边界

- 实现：`src/provider/responses.mjs`（buildBody / parseStream / normalizeUsage / 链状态机）+ `core.mjs` 分派（`format === "responses"`，先 `normalizeToolPairing`）。agent 层零改动——transport 返回既有 shape。
- **已知边界**：responses 格式**不接 `agent.streamRules`**——core.mjs 分派只透传
  messages/tools/onToken/onReasoning/onWait/signal/toolChoice，`ruleTriggered` 对 responses
  永不触发（配置了 abort/warn 规则的 responses 用户该保护不生效；回应格式事件体与 sse.mjs
  规则匹配器不同构，接入成本高而 responses 是显式 opt-in）。`response.incomplete → finishReason`
  （含 content_filter 区分）与打断后半成品（interrupted+partial）行为已与 core 对齐。
- preset 不动：默认稳态 chat completions；responses 是显式 opt-in。

## 14. 截断续写 400 止损与根治

> 状态：CLI 已实现并真机验证。两端 parity：本文件为 CLI 侧权威源；扩展端对齐清单见 §14.7。

### 14.1 问题与根因

DeepSeek 系列（`prefixMode: true` 声明）在 `finishReason === "length"` 时触发 prefix 续写——但原实现续写请求**带全量历史**（含工具链消息与 reasoning_content），DeepSeek 网关对 prefix 续写报 400（真机复现）：

| 错误 | 触发条件 |
|---|---|
| `Function call should not be used with prefix` | prefix 续写历史含 assistant(tool_calls)/tool 消息 **且工具链 assistant 带 reasoning_content** |
| `The reasoning_content in the thinking mode must be passed back to the API` | prefix 续写历史含工具链 **且工具链 assistant 缺 reasoning_content**（thinking 回传约束） |

**铁律（真机矩阵）**：thinking 模式下 **prefix 续写 + 历史含任何工具链消息 → 必 400**（补不补 reasoning_content 都炸，错误二选一）；纯文本历史 + prefix → 200。

**用户可感影响**：长上下文（尤其压缩后）→ 输出更易截断 → 续写触发 → 400 → 压缩/长回合期间 deepseek 直接报错飞出。

**孤立代理 400（§14.6）**：`unexpected end of hex escape` 的第三根因不是字面 hex 转义序列，而是 content 里的**孤立 UTF-16 代理字符**（预览截断把 emoji 切成孤立高代理）——见 §14.6。

### 14.2 止损：prefix 续写精简历史

prefix 模式只续文本，不需要工具历史（真机矩阵实证：过滤工具消息后 200）：

- 过滤历史中的**全部 `tool` 消息与 `assistant(tool_calls)` 消息**（含其 reasoning_content 跟随问题一并规避）。
- 保留 system + 最近 8 条非工具 user/assistant 文本（`PREFIX_CONTINUATION_KEEP = 8`——截断点语境足够）。
- 最后一条续写消息保持 `{ role: "assistant", content, prefix: true }` 形态。
- `reasoning_content` 回传：保留 `...(result.reasoning ? { reasoning_content: result.reasoning } : {})`——续写前置 thinking 必须随附。

**partialMode（Kimi/Qwen/MiniMax）不受影响**——partial 不回传全文、同端点 + partial:true，网关无 prefix 约束。只改 prefixMode 路径。

### 14.3 根治：buildContinuationMessages + 失败可见性

- **续写消息构造独立函数** `buildContinuationMessages(messages, result, spec)`（core.mjs 导出）：prefix 分支做 14.2 的精简；partial 分支保持现状（`[...messages, tail({ partial: true })]`）。
- **失败可见性**：续写 400 不再静默吞——`chat()` 续写循环 catch 非重试错误时注入 `_warnings`（`continuation-failed`）+ 错误文本进结果（agent 机读线可见，与压缩失败可见性同思路）；retry 语义不变（400 非重试）；AbortError 用户中断透传。
- 续写子请求带 `logCtx.isContinuation: true`（轨迹/分析区分续写链 vs 外层新调用）。

### 14.4 异常 finish reason 提醒（agent 层）

异常 finish reason（非 stop/tool_calls）由 `injectResponseReminders` 人类化描述注入 `[System reminder: the previous turn ended abnormally — …]`：`length → "output token limit reached after exhausting continuations"`、`insufficient_system_resource`、`content_filter`。流规则 `_warnings` 同步去重注入。

### 14.5 关键决策

- **精简历史而非关闭 prefixMode**：prefix 续写是 DeepSeek 官方推荐的截断续写通道（保留长输出能力）；过滤工具历史是网关约束的直接解法。
- **N=8 保留量**：prefix 续写语义 = 「补全最后一段」——最近语境足够。
- **否决方案**：a) 关闭 prefixMode（失去续写能力，长输出丢尾）；b) 续写降级普通 chat（无 prefix = 重复上下文，模型重复输出）；c) 只在无工具历史时续写（复杂判断，放弃续写机会）。

### 14.6 孤立 UTF-16 代理 400 修复（escape v5）

**根因链**（真机 + 代码实证）：

1. doc_search 结果预览 `slice(0, DOC_CHUNK_PREVIEW_LEN)`（300 字符）按 **UTF-16 码元**截断 → emoji（代理对）恰在边界被切成**孤立高代理** → 注入 system reminder → 每轮发送。
2. JSON.stringify 把孤立代理输出为 `\ud83d`（合法 JSON）。
3. deepseek 解析器**严格 UTF-16 解码**：高代理后找不到低代理 → 400 `unexpected end of hex escape`（真机：孤立高代理单发 400 / 孤立低代理 400 `lone leading surrogate` / 完整 emoji 200）。

**修复（两层）**：

| 层 | 位置 | 内容 |
|---|---|---|
| 防御（发送前） | `src/escape.mjs` v5 | `sanitizeLoneSurrogates`：孤立高/低代理 → U+FFFD（全字段：content / tool_calls[].arguments / reasoning_content / part 数组）；`escapeLiteralEscapes` 回归 v1 double 语义 + 奇数 run 修复（3+ 反斜杠后裸露的 `\u` / `\x` 也 double）；总入口 `sanitizeText` |
| 源头（截断点） | `setup.mjs` safeSliceUTF16（doc_search 预览）+ `agent/helpers.mjs` safeSliceUTF16（offloadToolResult 预览/兜底截断） | 截断点落高代理（D800-DBFF）时向前收一个码元——不再产生孤立代理 |

`escapeMessages` = `stripLocalMessageFields(messages).map(escapeMessageContent)`（OpenAI 路径发送前）；`stripImagesForTextModel` + `normalizeToolPairing` 在 `normalize.mjs`。仅思考模型 thinking 注入路径同样过净化。

### 14.7 VS Code 对齐清单

两端同规格（VS Code 端口由并行任务处理，镜像 CLI）：
① escape v5 同步（sanitizeLoneSurrogates + sanitizeText 总入口 + odd-run 修复 +
escapeMessageContent 覆盖 tool_calls[].arguments / reasoning_content）；
② UTF-16 安全截断 5 处（context doc 注入 / code / offloadToolResult / compact 序列化）；
③ 续写构造对齐 `buildContinuationMessages` + 失败可见性；④ 两端测试 parity。

## 15. 模型上下文可配置（providerSpec context）

> CONTEXT-COMPACTION.md 引本文件为权威：`providers[].context`（K 单位）覆盖 `MODEL_SPECS` 的 context 后，压缩阈值与 tail 公式跟随覆盖值。

**问题**：`MODEL_SPECS` 的 `context` 写死（如 deepseek-v4-flash 1M）；`specForModel(model)` 纯查表，无 provider 级覆盖——本地部署/私有端点模型的真实上下文与 spec 不符时，压缩阈值（auto = context × 0.6）偏高 → 溢出风险、窗口显示误导。

**机制**：

- **D-C1 config 字段**（config.json `providers[].context`）：**K 单位**正整数（如 `128` = 128K）；非法值（0/负数/非数字）→ 忽略 + 警告一次（每 provider 名），用 spec 值。
- **D-C2 解析覆盖**（model-specs.mjs）：`providerSpec(provider)` = `specForModel(provider.model)` 的 **拷贝覆盖**（`{ ...spec, context: provider.context * 1024 }`），**不污染共享 spec 对象**（跨 provider 串扰防护，T-C1）；`specForModel` 保持纯查表不变；`config.mjs` re-export `providerSpec`——既有 importers 从 config 取。
- **D-C3 调用方改造**：需要 provider 感知的调用方用 `providerSpec`——config.mjs
  （resolveCompactThreshold）、context（keepTailSize）、provider/core.mjs（窗口/钳制/chat spec）、
  advisor（messages/run 预算）、TUI render-frame（模型信息/状态栏 context %）、pickers
  （/model 配置界面）；纯模型查表处（无 provider）保持 `specForModel`；rate/normalize 无
  provider 感知调用点（spec 由 core 传入）。
- **D-C4 配置界面**：CLI `/model` provider 管理流加 context 字段（K 单位，复用 syncProviderField）；VS Code = settings.json `providers[].context`（设置 UI 编辑，settings 是 provider 配置唯一权威）。
- **D-C5 显示**：TUI / VS Code 模型信息显示 context 窗口（如 `128K`，`fmtContextK`：≥1M tokens 用 M 形态）跟随覆盖值。

**关键决策**：provider 级而非模型级（同一模型不同端点上下文不同）；K 单位整数（用户明确）；拷贝覆盖不污染 spec；否决——改 MODEL_SPECS 官方值 / 全局 context 字段 / 自动探测（无可靠 API，用户手配唯一可信源）。单测锁定（`provider-spec.test.mjs` T-C1..C6：覆盖/跟随/非法值/未配置/界面/显示）。

## 16. 模型清单 provider 化与放行语义（2026-09-10）

> 来源：批次 `../batches/2026-09-10-MODEL-SELECTION.md` §1（需求见 §0）。本篇 = 本批机制主体；
> 相关节：§9（specMatch）、§11（预设单值）、§15（providerSpec 不变）。
> 状态：**设计已定稿待评审**（2026-09-10 落档）——实施前以此为准；验收勾销 / 逐条验收结论见批次档 §6。

### 16.1 问题与背景

`providers[].models[]`（MODEL-MERGE-SESSION 引入）被定为“候选硬约束”：

- 一个未登记字符串就废掉整个渠道——`parseModelRef` 成员校验失败 → `resolveRuntimeProvider` 返回 `{}`
  → `providerInvalidReason` 置位（`src/model-ref.mjs:39-43` + `src/config.mjs:332-335`）；
- `/model` 切换路径硬 `throw`（`src/tui/model-picker.mjs:238-241`）——API 已证明渠道有该模型，仍拒（建议行同拒，`:118-121`）；
- 人工维护的清单与端点真实清单**必然漂移**——保留它就是留第二个清单来源。

且实测证明拒绝与“适配”无关：`specForModel('qwen3.8-max-0902')` 命中精确 spec 行（非 DEFAULT 兜底）。
用户裁定（2026-09-10）：清单权威交还 provider 运行期拉取；`models[]` 整字段删除；
显式 `p:m` 一律放行；渠道保留单值默认模型；切换回显规格来源。

### 16.2 机制

**M1 清单拉取（按 format 分派）**——`src/provider/list-models.mjs`（新文件：自 `core.mjs` 迁出现实现 + 扩两分支）：

| format | 请求 | 响应解析 |
|---|---|---|
| openai（缺省） | `GET {baseURL}/models`；头 `Authorization: Bearer {apiKey}` | `data[].id` |
| anthropic | `GET {baseURL}/models`；头 `x-api-key: {apiKey}` + `anthropic-version: 2023-06-01` | `data[].id`（分页 `limit` 传大值取全量） |
| google | `GET {baseURL}/models?key={apiKey}` | `models[].name`——剥 `models/` 前缀 |

- 返回 `string[]`（排序由调用方）；HTTP 非 2xx / 网络失败**抛出**（调用方决定降级——与现实现同）。
- 超时制度沿用现实现（header/body idle 15s；调用方可传 `signal` 短路）；未知/缺省 format → openai（与 chat 分派缺省一致）。
- 规范依据（2026-09-10 经官方 SDK 源码核验）：Anthropic List Models 返回 `Page<ModelInfo>`（`data[].id` / `display_name` 等字段），带 `limit` 分页参数；
  Gemini `models.list` 返回 `{models: [{name: "models/…"}], nextPageToken}`——`name` 带 `models/` 前缀。解析保持防御性（字段缺失即跳过该项）。
- 旧实现只有 openai 形状——`claude`（`format:"anthropic"`）与 `gemini`（`format:"google"`）用旧实现会 401/404（已勘察）。

**M2 候选面 = 拉取（CLI）**：

- `/model` L2（会话面）：候选 = 拉取结果**直接可选**（会话面提升到槽位面语义——槽位面 `model-picker.mjs:177` 起已是先例）；进入 L2 即触发拉取。
- `/config → 默认模型` L2：同源（共用拉取 helper）；槽位面（`/submodel` + consult 池）零改（仅随 M1 获得三 format 支持）。
- 加载中 header 文案 `Available models (loading…)`（既有先例）；失败 header `(fetch failed: …)` + 一行提示（文案与不可选处置见 M8）。
- 归并：`dedupeModels` / `modelSeries` 显示归并保留（迁入 helper——`src/tui/model-catalog.mjs`）。

**M3 渠道默认模型（单值——`providers[].model`）**：

- 类型：非空字符串 | 缺失；非字符串/空串归一删除（`loadConfig` / VSC `resolveProviders`）。
- 播种：20 个预设各携其原候选首值（deepseek→deepseek-v4-pro 等）；wizard / picker 加渠道 / setup-wizard 只落单值。
- 消费：①会话槽位 `activeModel` 空/缺失 → 回落 `slotProvider.model`（`session.mjs`）②picker/管理面显示回退（L1 行、ctx 标签、remove/set-key/context 列表）③`/config → 默认模型` 渠道行显示
  ④advisor / subagent 裸渠道名克隆时 model 重派生——两个调用点语义不同，分列实施：
  - `advisor/run.mjs:337`：`provider.model ?? provider.models?.[0]` → **`provider.model`**（`?? models?.[0]` 兜底整段删除——字段退场，不再读）。
  - `agent-tools/subagent-async.mjs:157`：`byName.models?.[0] ?? parent.provider?.model` → **`byName.model ?? parent.provider?.model`**（`models[0]` 换为渠道单值；**尾部 `?? parent.provider?.model` 父 provider 兜底保留**——兜底链尾不动）。
- 不承担：不是候选清单；不做成员校验；不限制显式 `p:m`；空值合法（模型选择经 `/models` 拉取候选——准入判据见 M8/M9）。

**M4 放行语义（`parseModelRef` v2）**：

| 输入 | v1（候选硬约束） | v2（本批） |
|---|---|---|
| 空串 / 纯空白 | 拒 | 拒（reason 同 v1 首条） |
| 裸值（无冒号，如 `kimi` / `kimi-k3`） | 拒 | 拒 |
| `:model`（首段空） | 拒 | 拒（裸值文案） |
| `provider:`（模型段空） | 拒 | 拒（新文案：model part is empty） |
| `ghost:m`（未知 provider） | 拒 | 拒（保留 available 列表文案） |
| `a:b:c`（多冒号） | 拒（成员校验不中） | **放行**（首冒号分割——provider=a，model=`b:c`；`ollama:llama3:70b` 式模型名可用） |
| 候选外（provider 在、model 任意非空） | 拒 | **放行** |

- 其余机器语义不变：`resolveRuntimeProvider` 无效 → `{}`（D-S1 形状不 throw）；`defaultModelReason` 顶层未设文案不变；`findProvider` throw 契约不动。
- `firstCandidate` 删除（调用点直读 `p.model`）。

**M5 规格来源判定**（`model-specs.mjs`）：新增 `specMatch(model) → { spec, matched }`——与 `specForModel` 共享同一查表实现（单次）；`matched:false` = `DEFAULT_SPEC` 兜底。`specForModel` 返回形状与共享对象契约不变（热路径零变）；warn-once 去重两侧共用。

**M6 切换回显**：

- 落点：`selectModel`（会话切换唯一写点——picker 选择与 `/model p:m` 同路径）成功后回显一行。
- 形态（正常）：`Model: kimi:kimi-k3 — spec found (ctx 1M / out 128K)`（ctx/out 取**最终生效值**——含 `providers[].context` 覆盖）。
- 形态（DEFAULT 兜底）：警示色 + `spec not found in MODEL_SPECS — default 128K ctx / 32K out; set context in /config to override`。
- 数据来源：`specMatch(provider.model)` + `providerSpec(provider)`；无切换（Esc）不产生回显。

**M7 配置迁移（v2——形态 A/B → C）**：

| 老形态 | 迁移动作 |
|---|---|
| A：`providers[].model` + `activeProvider/activeModel` | `p.model` **保留为新形态单值默认模型**（不再搬入 models）；`activeProvider/activeModel` → `defaultModel` 复合（同旧：`activeModel` 优先；AP 不存在 → 首渠道回退） |
| B：`providers[].models[]` + `defaultModel` | `p.model = defaultModel 属本渠道的模型段 ?? 现有 p.model（非空字符串）?? models[] 首个非空字符串`；`delete p.models` |
| 混合/垃圾 | 非字符串 `p.model` / 非数组 `p.models` → 删除（清理）；迁移幂等（无老字段 → 不动） |

- 顺序：先构造/读取有效 `defaultModel` 值（含老 active* 转换），再按它给各渠道播种 `p.model`。
- 空结果合法：渠道无模型来源 → `p.model` 不设（模型选择经 `/models` 拉取候选——准入判据见 M8/M9）。
- 写回失败不阻断启动（折中 C 语义保留）；VSC `config-migrate.mjs` 同规则**独立实现**（双端各自实现——不做同步依赖）。

**M8 渠道准入判据（`/models` 可用性——用户 2026-09-10 裁定）**：

- **`/models` 不可用 → 该渠道视为不可用**：不列候选、不可选、无静态兜底、无手输绕过；用户应改用其他渠道。
- 失败文案：`该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`（{状态} = HTTP 状态或网络错误摘要；不出现手输 / 改 config / 命令面绕过类指引）。
- **执行层 = 配置阶段（M9）**；运行期不加闸——命令面放行语义不变、启动 / 请求零探测（边界详 M9）。

**M9 渠道准入校验（配置阶段——用户 2026-09-10 裁定）**：

- **落点**：配置写入面——加渠道 / 设 API key / 设默认模型的配置路径。CLI：`cmd-config.mjs`（默认模型菜单与渠道管理 flow）、`tui/wizard.mjs`、`cli/setup-wizard.mjs`；
  VSC：`provider-flows.mjs`（addProviderEntry / setKeyFlow）、`settings.mjs`（handleAddProvider / saveProviderKey——复用既有 `testProviderConnection` 探针模式）、`settings-panel-write.mjs`（defaultModel 顶层写）、`webview/settings-providers.js`（UI 标注）。
- **动作**：对目标渠道探一次 `GET /models`（复用 M1 实现 + 既有超时）；**失败不缓存**（下次配置动作重试）。
- **判据与表现**：探通 → 渠道可用，探得候选可直接用于该流内的默认模型选择；探不通 → 界面明示 `该渠道不提供模型列表（GET /models {状态}）——不可用`，且该渠道**不作为默认模型的可选来源**（不进入可选清单）。
- **不阻断配置流**：渠道条目本身仍可保存（提示 + 标记不可用——不是拒绝写 config）。
- **边界（运行期不加闸）**：① `/model provider:model` 命令面放行语义不变（R4——用户 2026-09-10 结案：命令面不受渠道准入约束）；② 会话启动 / 每次发请求不做 `/models` 探测（不引入启动期网络依赖——N2）。

### 16.3 接口契约（函数级）

| 接口 | 变化 | 语义 |
|---|---|---|
| `listModels(provider, {signal})` | 实现迁 `provider/list-models.mjs`（`provider/index.mjs` re-export 不变——调用点零改） | 按 `provider.format` 分派；返回模型 ID 数组；错误抛出 |
| `parseModelRef(ref, providers)` | 语义收窄（M4） | `{ok:true, provider, model}` / `{ok:false, reason}` |
| `firstCandidate(provider)` | **删除** | 调用点直读 `p.model` |
| `specMatch(model)` | **新增** | `{ spec, matched }`——matched:false = DEFAULT 兜底 |
| `specForModel` / `providerSpec` | 不变 | 热路径与拷贝覆盖契约不动 |
| `migrateLegacyModelFields(raw)` | 语义反转（M7） | 幂等纯函数；返回 changed |
| TUI 拉取 helper：`src/tui/model-catalog.mjs`（新增） | **新增** | `getProviderModels(providerConfig) → Promise<string[]>`（会话缓存 TTL 60s，失败不缓存；`dedupeModels` / `modelSeries` 迁入） |
| VSC `resolveDefaultModel(entry, raw)` | 回退链改（R6） | 复合属本渠道 → 渠道默认单值 → `null`（不再 `models[0]`） |

### 16.4 方案选型对比

**（a）清单拉取的时机与缓存**：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| a1 | 每次进 L2 即拉（无缓存） | 新鲜度最好；每次等待网络（≤10s 超时）；失败态每次出现 | 实现最简；连续操作重复付网络成本 | 否决——慢网/无网反复等待 |
| a2 | 会话级缓存 + TTL 60s（失败不缓存） | 首拉后 TTL 内秒开；60s 新鲜窗口；失败即重试 | 多一个会话内缓存态；TTL 内新模型不可见（过期后重拉） | **选定**——成本与收益平衡 |
| a3 | 缓存 + stale-while-revalidate（先渲染后刷新） | 体感最好；打开状态下列表替换的边界多（保持选中/行消失） | 复杂度最高 | 否决——增量收益不抵复杂度 |

**（b）渠道单值默认模型与顶层 `defaultModel` 的关系**：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| b1 | 渠道默认模型**仅作兜底/显示**，与 `defaultModel` 解析完全独立（`defaultModel` 未设仍走显式引导 F-6） | 保持 F-5/F-6 语义（新会话起点显式设置）；单值只承担新装种子/槽位空兜底/显示回退 | 两概念并列（各司其职） | **选定** |
| b2 | 渠道默认模型作为 `defaultModel` 未设时的静默回落种子 | 少一次配置；违背 F-6 明确裁定（无自动兜底） | — | 否决（与既有裁定冲突） |
| b3 | 取消渠道单值（一切靠 `defaultModel`） | 无新装种子/槽位空兜底/显示回退值；用户已裁「留」 | — | 否决（用户已裁定） |

**（c）「spec 来源」如何暴露**：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| c1 | 改 `specForModel` 返回值（加来源字段） | 调用点无感；热路径 + 共享对象契约 + 23 个 importer 形状风险 | — | 否决（契约面大、收益同 c3） |
| c2 | 新增布尔旁路 `isSpecFallback(model)` | 简单；信息量少（拼文案需再取 spec 值——两次查表） | — | 否决（c3 更完整且同样单次查表） |
| c3 | 新增 `specMatch(model) → { spec, matched }`（与 `specForModel` 共享实现） | 单次查表、信息完整、旧接口零变 | 新增一个导出函数 | **选定** |

### 16.5 受影响文件清单

> 行数为 2026-09-10 快照。**over-tier 说明**：`config.mjs`(484) / `model-picker.mjs`(490) / `core.mjs`(498) 均接近
> 500 硬限——本批净增为负或 ≈0（listModels / 拉取逻辑迁出反而减负）；若实施中单文件预计超 500，必须就地拆分并入交付报告。
> `model-picker.mjs` 若超 450，拆分计划 = 槽位面（`buildSlotEntriesForProvider` / `fetchSlotModels` / `pickModelForSlot`）迁出独立文件。

**CLI 源（thincoder/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/config.mjs` | 484 | ±0 | 预设 20 条 `models:[x]`→`model:x`；normalize 改单值；头注 |
| `src/config-migrate.mjs` | 68 | +20 | 迁移 v2（M7） |
| `src/model-ref.mjs` | 75 | −15 | `parseModelRef` v2（M4）；删 `firstCandidate`；头注/注释改写 |
| `src/model-specs.mjs` | 146 | +18 | `specMatch`（M5） |
| `src/session.mjs` | 476 | ±0 | 槽位兜底改 `slotProvider.model`；注释 |
| `src/provider/core.mjs` | 498 | −20 | `listModels` 迁出（注释同步） |
| `src/provider/list-models.mjs` | **新增** | ~95 | 三 format 分派（M1） |
| `src/provider/index.mjs` | 7 | ±0 | re-export 改指 |
| `src/provider/errors.mjs` | 102 | ±0 | F-1 guard 文案与注释（不再称 `models[]`） |
| `src/advisor/run.mjs` | 488 | ±0 | `?? provider.models?.[0]` 兜底整段删除（留 `provider.model`）；注释 |
| `src/agent-tools/subagent-async.mjs` | 473 | ±0 | `models?.[0]`→`byName.model`（**保 `?? parent.provider?.model` 父兜底**）；注释 |
| `src/cli/setup-wizard.mjs` | 80 | +10 | `preset.model` 读取修复（旧版漏改的既存 bug——本批自动对上）；落单值；首启加渠道探 `/models`（M9） |
| `src/cli/make-agent.mjs` | 163 | ±0 | 注释 |
| `src/tui/model-picker.mjs` | 490 | −35 | L2 候选改拉取（M2）；`selectModel` 放行+回显（M4/M6）；预设/custom 播种单值；建议位退场 |
| `src/tui/model-catalog.mjs` | **新增** | ~85 | 拉取+缓存 helper（M2） |
| `src/tui/cmd-config.mjs` | 447 | +25 | 默认模型菜单改写（拉取——不加手输行，O1 已裁）；`:70` 会话重载兜底首候选 → `keep.model`（注释同步）；配置阶段准入探（M9——探不通标不可用、不入可选） |
| `src/tui/cmd-model.mjs` | 24 | ±0 | 注释 |
| `src/tui/cmd-advisor.mjs` | 255 | ±0 | 核查（随 M1 获益——调用兼容） |
| `src/tui/wizard.mjs` | 217 | +5 | 单值播种；加渠道时探 `/models`（M9——不通标不可用，不阻断保存） |
| `src/tui/pickers.mjs` | 106 | ±0 | 注释 |
| `src/tui/index.mjs` | 450 | ±0 | 核查（引导文案） |
| `src/tui/cmd-submodel.mjs` | 155 | ±0 | 核查（候选行显示） |
| `bin/thincoder.mjs` | 406 | ±0 | 帮助文案（`models[] candidates`→单值） |

**CLI 测试（thincoder/test）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `test/list-models.test.mjs` | **新增** | ~130 | 三 format 分派（正常/边界/错误——T1–T6） |
| `test/model-ref.test.mjs` | 170 | 重写 ~190 | 放行/无效表驱动（M4）+ 回显（M6）+ 候选外可切换 |
| `test/config-merge.test.mjs` | 151 | 重写 ~160 | 迁移 v2（M7）+ 预设单值 + 无 models 键 |
| `test/provider-model-guard.test.mjs` | 132 | ~140 | F-2a/c/d 改单值兜底；F1_RE 新文案 |
| `test/provider-admission.test.mjs` | **新增** | ~110 | 配置阶段准入两态 + 运行期零探测（T23–T25——M9） |
| `test/consult-models-softfail.test.mjs` | 98 | 核查 | fixture 走新迁移（断言看 consultModels——预期不变） |
| `test/advisor-provider.test.mjs` | 72 | 核查 | F-1 遗留腿不受影响 |

**CLI 文档**：`docs/design/PROVIDER.md`（本档，440→约 770 行）· `docs/design/SESSION.md`（527 行，3 处句子——D-S1/D-S2/D-S3 段）· `docs/TODO.md`（需求池条目状态——维护面）。

**VSC 源（thincoder-vscode/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/config-presets.mjs` | 41 | ±0 | 预设 20 条单值化 |
| `src/config-migrate.mjs` | 161 | +25 | 迁移 v2（M7 同规则——独立实现；含 `:110` settings 迁移写回形态核对） |
| `src/config-io.mjs` | 438 | ±5 | normalize 单值；`resolveDefaultModel` 回退链（R6） |
| `src/provider.mjs` | 456 | −15 | `listModels` 迁出/加 format 分派 |
| `src/provider/list-models.mjs` | **新增** | ~95 | 三 format 分派 |
| `src/provider/transports/openai.mjs` | — | ±0 | guard 文案（不再称 `models[]`） |
| `src/advisor/provider.mjs` | 39 | ±0 | `?? provider.models?.[0]` 兜底整段删除（留 `provider.model`）；注释 |
| `src/agent-tools/subagent.mjs` | 358 | ±0 | `models?.[0]`→`byName.model`（**保 `?? parent._provider?.model` 父兜底**）；注释 |
| `src/extension/settings.mjs` | 332 | +20 | status payload 单值；`fullStatus` 候选=fetch（失败 = 该渠道不可选 + 明示原因——无 fallback 候选）；custom 空条目判据；准入探复用（M9——既有 `testProviderConnection` 模式） |
| `src/extension/settings-panel-write.mjs` | 134 | +10 | defaultModel 面板写加准入探（M9——探不通标不可用、不入可选来源） |
| `src/extension/provider-flows.mjs` | 193 | +15 | 播种单值；`p.models?.[0]`→`p.model`；addProviderEntry / setKeyFlow 加准入探（M9——不通标不可用，不阻断保存） |
| `src/extension/vision-channel.mjs` | 23 | +5 | 视觉候选判据改渠道默认模型（下注） |
| `src/extension/panel-chat.mjs` | 499 | 核查 | 「否则首候选」决策/注释 |
| `src/extension/turn-model.mjs` | 28 | 核查 | 同上 |
| `src/extension/presets.mjs` / `panel-messages.mjs` / `panel-session.mjs` | — | ±0 | 头注/注释 |
| `webview/settings-providers.js` | 264 | +20 | 渠道行（默认模型）、预设行、默认模型菜单数据源改运行期载荷；准入失败渠道标「不可用」且剔出默认模型可选来源（M9） |

> `webview/` 其余文件（`model-menu.js` / `settings-models.js` 等）消费的是 **`models` 消息载荷**（运行期模型行）——
> 载荷字段不变，不受影响；`settings-providers.js` 例外（它读 config 字段——已列入上表）。

**VSC 视觉通道判据变更（决策）**：`findVisionChannel` 原判据 = 「该渠道 `models[]` 中的视觉模型」——单值化后
判据 = `specForModel(p.model).multimodal`（渠道默认模型能读图 → 可用）。**能力收窄已入档**：默认模型非视觉的渠道
不再被选中（用户把常用视觉模型设为该渠道默认模型即恢复）——无更优判据（不做异步拉取式视觉探测）。

**VSC 测试（thincoder-vscode/test）**：

| 文件 | 当前行数 | 改动 |
|---|---|---|
| `test/config-merge.test.mjs` | 126 | 重写（迁移 v2 + resolveDefaultModel 新回退链） |
| `test/provider-admission.test.mjs` | **新增** | M9 两态 + 运行期零探测（T23–T25） |
| `test/provider-model-guard.test.mjs` | 149 | 改（单值兜底 + 新文案；同 `:58` 锚） |
| `test/image-downgrade.test.mjs` | 120 | 改（视觉判据） |
| `test/config-io-panel.test.mjs` / `config-softfail.test.mjs` / `settings-panel.test.mjs` / `chat-panel.test.mjs` | 101/114/87/621 | 核查（fixture 迁移触发） |
| `test/files.mjs`（注册表） | — | 核查（新增测试登记） |
| `test/smoke-provider.mjs` | — | 核查（`preset.models?.[0]`→`preset.model`） |

**VSC 文档**：`thincoder-vscode/docs/design/PROVIDER.md`（333 行——§1 `models[]` 描述 / §3 模型选择 / §2 预设表需同步）
——**执行者 = 父侧收口后执行**（用户 2026-09-10 裁定 O4；非本批设计交付物，不入 eng-coder 任务面）。

### 16.6 关键决策记录

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| 1 | `models[]` 不留（整字段删） | 用户裁定；只去否决权会留必然漂移的第二来源 | 「保留字段、降语义为便捷列表」（用户否） |
| 2 | 渠道单值默认模型保留 | 新装启动种子与会话槽位空兜底需要；用户裁定 | 取消单值（b3） |
| 3 | 显式 `p:m` 一律放行（含候选外） | 用户裁定——「候选外二次确认 / `--force`」是给白名单开后门 | 白名单后门类方案 |
| 4 | 多冒号首分割放行（`a:b:c`） | 「仅三类无效」的直接推论；`ollama:llama3:70b` 式模型名可用 | 严格两段拒（与「一律放行」方向矛盾） |
| 5 | 渠道单值与 `defaultModel` 独立（b1） | 保持 F-5/F-6 语义（新会话起点显式设置） | b2 / b3 |
| 6 | spec 来源走 `specMatch`（c3） | 热路径零变 + 单次查表 + 信息完整 | c1 / c2 |
| 7 | 拉取 = 会话缓存 + TTL 60s（a2） | 连续操作不重复付网络；失败不缓存（重进重试） | a1 / a3 |
| 8 | 迁移取数序：defaultModel 段 > 现有 p.model > models[0] | defaultModel = 用户最近显式选择，最能代表默认；保幂等 | 仅 models[0]（丢用户选择） |
| 9 | 回显仅 CLI 面（本批） | 批 ⑥ VSC 范围字面只含「候选同源 + resolveDefaultModel」——不扩大范围 | VSC 同加回显（O2 已裁——本批不加） |
| 10 | 需求层同档承载（不新建 `requirements/PROVIDER.md`） | 地图 §4.1 现状：Provider 无镜像；新老划断——迁移属后续批量拆分批；新建需同步回改父侧维护的地图 | 本批新建镜像档（超范围 + 需父侧登记） |
| 11 | 不加 UI 手输行（O1 归零——用户 2026-09-10） | **命令面 `/model provider:model` 仍放行任意串（R4 不变，那是既有能力）——被否的只是「在 UI 里新造一个手输入口」**；用户原话：「模型名不要手输，那个是过度设计」 | UI 手输行（O1 原方案①②——均否） |
| 12 | 渠道准入判据 = `/models` 可用（用户 2026-09-10——**翻转先前「渠道照常可用」读法**） | 不支持 / 拉不到的渠道 = 不可用渠道：不列候选、不可选、无静态兜底、无手输绕过；不为其新建任何绕过路径 | 「渠道照常可用 + 手输 `p:m`」（先前读法——已翻转） |
| 13 | 准入校验落**配置阶段**（M9），运行期不加闸（用户 2026-09-10） | 运行期加闸引入启动期网络依赖与延迟（离线不可用、每请求开销）——与 N2「不阻塞会话切换 / 零启动依赖」冲突；配置阶段探一次即可满足准入；命令面不受准入约束（结案） | 运行期每次探测 / 启动探测 / 命令面加闸（均否） |

### 16.7 UI/交互决策（含 open）

**已定**：

- 切换回显文案与颜色（M6）——正常 `C.tool`；DEFAULT 兜底 `C.error`（警示色）+
  `set context in /config to override` 提示（承接「经 /config 设 context 覆盖」的既有提示路径）。
- 拉取加载中 / 失败文案（M2/M8）——`(loading…)` / `该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`（明示原因 + 指引换渠道；无绕过指引）。
- 候选列表行 = 直接可选（不再区分「候选 / 建议」两组——两组语义已合一）。
- 渠道无默认模型时显示 `(no default model)`（替代原 `(no candidates)`）。
- **O1 已裁（用户 2026-09-10——决策记录见 §16.6 #11）**：`/model` L2 与 `/config → 默认模型` L2 **两处都不加** UI 手输行。
- **O2 已裁（用户 2026-09-10）**：本批**不加** VSC 面板 spec 来源回显（理由：批范围第 ⑥ 项字面仅含「候选同源 + resolveDefaultModel」——不扩范围）。
- **渠道准入（用户 2026-09-10 裁定）**：配置阶段探 `/models`（M9）——探不通的渠道界面标「不可用」且不作为默认模型可选来源；命令面 `/model provider:model` 不受准入约束（R4 放行不变）；运行期 / 启动零探测。

**open 项：无**（O1 / O2 均已裁——用户 2026-09-10）。

### 16.8 边界（本批不做）

- **不做** MODEL_SPECS 前缀匹配的无条件继承隐患（`qwen3.8-flash` 蹭泛前缀一类）——已登记独立待办（用户同意）。
- **不做** 候选外二次确认 / `--force` 类白名单后门（用户否）。
- **不改** `defaultModel` 的 F-5/F-6 语义（新会话起点 + 未设显式引导）。
- **不改** 子代理 / advisor 的模型覆盖语义（自由串——红线零改）；只改其 `models[0]` 兜底取值。
- **不做** 双端同步依赖 / 逐字硬一致（多实现面纪律）。
- **不做** 拉取结果的持久化缓存（会话内进程缓存即可——清单是运行期事实）。
- **不动** `_archive/MODEL-MERGE-SESSION.md` 正文（冻结）——仅取代关系一行。

### 16.9 对账（批次档 §1 对账表逐行处置）

| # | 现存表述 | 处置 |
|---|---|---|
| 1 | `src/model-ref.mjs:1-6` 头注 HARD candidate set | 改写（R8）——新头注 = 「有效域 = provider 存在 + 双段非空（M4）」 |
| 2 | `model-ref.mjs:68-74` firstCandidate 注释 | 函数删除——注释随删 |
| 3 | `SESSION.md:225-232`（D-S1/D-S2/D-S3 硬约束句） | 本档设计连带改写：D-S1 机制保留、「无效」判据收窄（不含候选外）；D-S2 候选改拉取；D-S3 兜底改单值 |
| 4 | `PROVIDER.md` §9/§11 | 本批落点（§9 加 specMatch；§11 预设单值） |
| 5 | `_archive/MODEL-MERGE-SESSION.md` F-1/F-7 | 正文冻结不重写；取代关系记本档变更记录一行；代码注释内 F-1/F-7 引用就地清理 |
| 6 | `docs/TODO.md` 需求池条目 | 已为指针形态（主 agent 收拢）；**状态保持 `待设计`**（用户 2026-09-10 裁定——不补状态机新态，补态另议；TODO.md 零改动） |
| 7 | VSC 端对应 Provider 板块档 | 需同改——清单见 §16.5；**执行者 = 父侧收口后执行**（O4——非本批交付物，不入 coder 任务面） |

### 16.10 勘察补充发现（超出批次档 §1 已核清单的面）

1. **契约测试第三族**：`test/provider-model-guard.test.mjs`（CLI 132 行 + VSC 149 行）同样锁定了 `models[0]` 语义与 guard 文案正则——批次档 §1 只列了 model-ref / config-merge 两族，本批一并反转（R7 覆盖）。
2. **VSC webview 直读 config 字段**：`webview/settings-providers.js:24/93-96/181/195` 直接读 `providerStatus().providers[name].models` 与 presets payload 的 `models`——删除字段后面板显示与默认模型菜单的数据源须改（§16.5 已列）。
3. **VSC custom 空条目判据**：`settings.mjs:249` 以 `entry.models.length` 判「空条目删除」——字段删除后判据失效，须改以 `entry.model` 为准（列表内已列）。
4. **CLI `setup-wizard.mjs` 既存 bug**：`:43` 读 `presets[..].model`（MODEL-MERGE 后已不存在）——本批字段回单值后自动对上（顺带修复），列入清单。
5. **VSC 视觉通道**：`vision-channel.mjs` 候选扫描依赖 `models[]`——判据变更与能力收窄见 §16.5。
6. **bin 帮助文案**：`bin/thincoder.mjs:106` 用户可见帮助含 `models[] candidates` 字样——同步改。

## 17. 测试层（模型选择面重构——用例表与验收标准）

### 17.1 用例表（正常 / 边界 / 错误——映射需求号）

| # | 类 | 用例 | 输入 | 预期输出 | 映射 | 端 |
|---|---|---|---|---|---|---|
| T1 | 正常 | openai 拉取 | mock `{data:[{id:"a"},{id:"b"}]}` | `["a","b"]` | R1 | 双端 |
| T2 | 正常 | anthropic 拉取 | mock `{data:[{id:"claude-x"}]}` + 断言请求头 `x-api-key` / `anthropic-version` | `["claude-x"]` | R1 | 双端 |
| T3 | 正常 | google 拉取 | mock `{models:[{name:"models/gemini-2.5-flash"}]}` | `["gemini-2.5-flash"]`（剥前缀） | R1 | 双端 |
| T4 | 边界 | google 名称无前缀 / 缺字段项 | `{models:[{name:"gemini-x"},{}]}` | `["gemini-x"]`（跳过缺项） | R1 | 双端 |
| T5 | 错误 | 拉取 HTTP 非 2xx / 网络失败（渠道准入） | mock 失败 | 抛错；picker 显失败文案（明示原因 + 请改用其他渠道）；该渠道不可选；缓存不写入 | R1 | CLI |
| T6 | 边界 | 会话缓存 TTL | 两次调用 <60s / >60s | 第二次不发请求 / 重拉 | R1/N3 | CLI |
| T7 | 正常 | 放行显式复合（候选外） | `parseModelRef("kimi:any-model")` | `ok:true`（不再成员校验） | R4 | CLI |
| T8 | 边界 | 多冒号 | `parseModelRef("a:b:c")`（a 存在） | `ok:true`，model=`"b:c"` | R4 | CLI |
| T9 | 错误 | 三类无效 | `""` / `"kimi"` / `":m"` / `"kimi:"` / `"ghost:m"` | `ok:false` + 各自 reason | R4 | CLI |
| T10 | 正常 | 迁移 B（models+defaultModel） | `models:["a1","a2"]` + `defaultModel:"a:a2"` | `p.model="a2"`；无 `models` 键；磁盘写回 | R2/R3/N1 | 双端 |
| T11 | 边界 | 迁移 A（老 model+active*） | `p.model` + `activeProvider/activeModel` | `p.model` 保留；`defaultModel` 构造；无 `models` | R2/N1 | 双端 |
| T12 | 边界 | 迁移幂等 | 二次调用 | `false` 不动 | N1 | 双端 |
| T13 | 正常 | 预设播种 | 20 预设 | 各携 `model` 单值（无 `models`） | R3 | 双端 |
| T14 | 正常 | 槽位空兜底 | `activeModel=""` + `p.model` | `agent.activeModel = p.model` | R3 | CLI |
| T15 | 正常 | 切换回显（命中） | `selectModel` 成功（已知模型） | 回显行含 model + spec 摘要（正常色） | R5 | CLI |
| T16 | 边界 | 切换回显（DEFAULT） | 未知模型 | 警示色 + `/config` 提示 | R5 | CLI |
| T17 | 正常 | 候选外可切换 | picker/slot 选择任意非空模型 | 成功切换（不再 throw） | R4/R7 | CLI |
| T18 | 正常 | VSC resolveDefaultModel | 复合属本渠道 | 用复合模型 | R6 | VSC |
| T19 | 边界 | resolveDefaultModel 无复合 | 渠道默认单值 / 均无 | 单值 / `null` | R6 | VSC |
| T20 | 错误 | VSC 拉取失败（渠道准入） | `listModels` 抛错 | 该渠道不可选（明示原因）；无静态候选；无 fallback 候选 | R1/R6 | VSC |
| T21 | 正常 | specMatch | 已知 / 未知模型名 | `matched:true` / `false` | R5 | CLI |
| T22 | 错误 | F-1 guard 新文案 | `model` 缺失渠道克隆后 chat | throw 新文案（不再称 `models[]`） | R7/R8 | 双端 |
| T23 | 正常 | 配置阶段准入探通（M9） | 加渠道 / 设默认模型时 mock `/models` 成功 | 渠道可用；探得候选直接可用（不入不可用清单） | R9 | 双端 |
| T24 | 错误 | 配置阶段准入探不通（M9） | mock `/models` 失败 | 标「不可用」（明示原因）；不入默认模型可选来源；**渠道条目仍可保存** | R9 | 双端 |
| T25 | 边界 | 运行期不探测（M9/N2） | 会话启动 / 发请求 | 无 `/models` 调用（零启动期网络依赖）；命令面放行不变 | R9/N2 | 双端 |

### 17.2 验收标准（逐条回指——每条可机器验证）

- **AC-1（R1）**：`node --test test/list-models.test.mjs` 全绿——三 format 分派（URL/请求头/响应解析/失败态）；
  拉取失败 = 该渠道不可选 + 明示原因（T5/T20）；picker 候选行来自拉取（mock 注入断言）；VSC 静态候选来源清除：`cd thincoder-vscode && grep -rn "configCandidates" src/` → 空
  （该标识符只存在于 VSC 仓——现状命中于 `src/extension/settings.mjs:301-317`；CLI 仓无此名——判据限定 VSC 仓方有验证力。）
- **AC-2（R2）**：`node --test test/config-merge.test.mjs` 全绿——迁移后磁盘无 `models` 键；
  配置字段读写零残留：`cd thincoder && grep -rn --exclude=config-migrate.mjs --exclude=consult.mjs --exclude=cmd-advisor.mjs --exclude=model-catalog.mjs --exclude=list-models.mjs "\.models" src/` → 空
  白名单（非配置语义的 `.models`）= 迁移读点（config-migrate）· 运行期容器/缓存（consult 的 `picked.models`/`session.models`、cmd-advisor 的 `cached.models`、model-catalog 缓存条目）·
  API 响应形状（list-models 的 google `{models:[…]}`）；白名单外出现新命中 → 停下报告，不静默扩围。自检：白名单外当前码非空、目标态空。
- **AC-3（R3）**：预设 20 条单值断言（config-merge 套件内）；槽位/克隆兜底断言绿（provider-model-guard）。
- **AC-4（R4）**：`node --test test/model-ref.test.mjs` 表驱动全绿——放行（候选外/多冒号）与无效（三类）分界。
- **AC-5（R5）**：回显断言——正常与 DEFAULT 两分支（含警示色分支与 `/config` 提示文案）。
- **AC-6（R6）**：VSC `resolveDefaultModel` 新回退链断言 + `fullStatus` 拉取失败 = 渠道不可选断言（明示原因；无 fallback 候选）。
- **AC-7（R7）**：双端 `npm test` 全绿（含三道契约测试族 + 新增面）。
- **AC-8（R8）**：`grep -rn "候选硬约束\|候选外拒" docs/design/ src/ bin/` 无现状描述残留
  （`_archive/` 与 §16 本文叙述除外）；`_archive/MODEL-MERGE-SESSION.md` 字节不变（SHA 比对）。
- **AC-9（R9）**：配置阶段准入探两态断言（探通 → 渠道可用；探不通 → 标「不可用」+ 明示原因 + 不入默认模型可选来源 + 条目仍可保存）；运行期不探测断言（启动 / 请求零 `/models` 调用）——T23/T24/T25。

> 验收勾销 / 逐条验收结论落**批次档 §6**（不写进本档——用户 2026-09-10 裁定）。

## 变更记录

- 2026-08 回补：规格表迁出 config → model-specs.mjs（re-export specForModel）；核心机制（chat 流程 / 重试 / SSE / 续写 / 闸门 / 净化 / 原生 transport）定稿。
- 2026-08-22（GitHub thincoder#2）：畸形 tool_calls 防御解析（§10，sse.mjs 归并 + finalizeToolCalls + `_warnings` 机读线）。
- 2026-08-28：GLM-5.3-Flash 支持（§11，规格表一行 + read_image vision 列表）；Qwen enable_thinking（§12，`thinking === null` off 约定、effort 从 enum[0]）。
- 2026-08-31：Responses API transport（§13）；normalize.mjs 迁出 stripImages/normalizeToolPairing；fetch 绝对墙钟拆分根因修复（§3 超时）；partial/interrupted 短路 + mergeRetryToolCalls；SSE 多行 data/BOM/方言 reasoning 兼容；tool_choice/parallel_tool_calls 能力层。
- 2026-09-01：`FETCH_TIMEOUT_MS` 退役，`effectiveFetchTimeoutMs` + 读侧 idle 超时四 transport 共用（§3）；retry.mjs（anthropic/google/responses 通用退避链）。
- 2026-09-02：截断续写 400 止损与根治（§14：buildContinuationMessages + 失败可见性 + escape v5 孤立代理修复 + UTF-16 安全截断）；模型上下文可配置（§15 providerSpec）。
- 2026-09-04：厂商前缀剥离（§9 specForModel）。
- 2026-09-05：errors.mjs 迁出错误分类/流规则族（core.mjs 超 500 行硬限拆文件）。
- 2026-09-07：本文件重写为人类可读当前态（格式债清理批 A）——逐字契约与活机制正文保留，历史流水账折叠本记录。
- 2026-09-10：**模型选择面重构**（第 3 批 MODEL-SELECTION——§0 需求层 + §16 设计与 §17 测试层）：
  `providers[].models[]` 候选清单退场（**取代 MODEL-MERGE-SESSION F-1/F-7 的候选白名单裁定**——
  `_archive/MODEL-MERGE-SESSION.md` 正文冻结不重写，以本条为取代记录）；清单权威 = provider 运行期拉取
  （按 format 分派，§16 M1）；渠道单值默认模型恢复（§16 M3——**部分回滚 MODEL-MERGE「无渠道默认捆绑」裁 1**）；
  显式 `p:m` 一律放行（§16 M4）；切换回显规格来源（§16 M5/M6）；预设改单值（§11）；渠道准入判据 = `/models` 可用（§16 M8/M9——配置阶段校验，运行期不加闸）。
