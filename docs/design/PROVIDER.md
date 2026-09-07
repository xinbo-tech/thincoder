# Provider 层设计（thincoder/src/provider/）

> 本文档描述 LLM 调用层的**当前设计**：OpenAI 兼容协议为主 + Anthropic / Gemini / Responses 原生 transport；SSE 流式解析、重试/退避、TPM/RPM 闸门、截断续写、流规则、发送前载荷净化。状态：**当前态**（2026-08/09 各轮实现已合入，历史变更流水账折叠于文末「变更记录」）。
>
> 相关权威：`src/model-specs.mjs`（规格表中枢，`config.mjs` re-export `specForModel` / `providerSpec`）；`src/config.mjs`（`resolveEnableThinking` / `isBailianHost` / `PROVIDER_PRESETS` / `resolveCompactThreshold`）；`CONTEXT-COMPACTION.md`（压缩阈值 / tail 公式 / 续写失败可见性——本文件 §14/§15 为其权威）。跨文档已接管的主题只留指针，不复制。

## 1. 总览与模块地图

Provider 层把模型能力差异收敛到一张**规格表**（`MODEL_SPECS`，§9），其余代码按 spec 全自动适配；把各厂商协议差异收敛到 transport 分派（`provider.format`），核心 `chat()` 对调用方暴露统一结果形态。

| 文件 | 职责 |
|---|---|
| `src/provider/index.mjs` | re-export：`chat` / `listModels` / `estimateText` / `createProvider` / `stripImagesForTextModel`（backward-compatible 入口，调用方从 `./provider` 引用） |
| `src/provider/core.mjs` | chat 入口（transport 分派）、OpenAI 格式 body 组装、`requestWithRetry`（OpenAI 路径）、载荷净化（stripImages / normalizeToolPairing / escapeMessages）、截断续写循环、`buildContinuationMessages`、overload 重试、Kimi 401 平台提示、`effectiveFetchTimeoutMs`、`createProvider` / `listModels` |
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

**re-export 契约**：`config.mjs` re-export `specForModel` / `providerSpec`（先例：2026-08-31 规格表迁出后既有 importers 从 config 取，不破坏调用点）；`providerSpec` = spec + provider 级 context 覆盖（§15）。

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
  baseURL/model/thinking/reasoningEffort/maxTokens/desc。
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
