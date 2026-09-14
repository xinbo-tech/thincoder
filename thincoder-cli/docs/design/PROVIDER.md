# Provider 层设计（thincoder-cli/src/provider/）

> 本文档描述 LLM 调用层的**当前设计**：OpenAI 兼容协议为主 + Anthropic / Gemini / Responses 原生 transport；SSE 流式解析、重试/退避、TPM/RPM 闸门、截断续写、流规则、发送前载荷净化。状态：**当前态**（2026-08/09 各轮实现已合入，历史变更流水账折叠于文末「变更记录」）；§0 / §16 / §17 = 模型选择面重构增补（2026-09-10——**R1–R10 / M1–M10 均已实施并核销**）；§21–§24 = `provider.headers` 全通路铺开（第 32 批）。
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

### 0.2 功能性需求（R1–R10——每条带判定句；R7/R8 为随件）

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
| R9 | **渠道准入校验（配置阶段）**：加渠道 / 设 API key / 设默认模型的配置路径对目标渠道探一次 `GET /models`（复用 M1）；探通 → 渠道可用、候选可直接用于默认模型选择；探不通 → 界面明示失败消息（消息本体 = 逐字长句 + 状态标签 `不可用`——分工与逐字文案见 §16.2 M8）且**不作为默认模型可选来源**；**不阻断配置流**（条目仍可保存）。 | 双端配置写入面各实现探通/探不通两态；探不通渠道不入可选清单且界面标注；运行期（启动 / 请求）零探测（N2，边界见 §16.2 M9）。 |
| R10 | **面板候选未命中 = 保持当前选择**（用户 2026-09-11 裁定——范围追加）：拉取候选未命中「偏好 / 当前选择」时**不得静默写会话槽**（与 CLI 对位同源——M10）；**未命中/兜底场景内**只允许【保持当前选择 + 呈现候选】，该场景写槽仅显式点击（候选行）；命中分支维持现状（M10 边界①）。 | 未命中（含冷启空值）零 `selectModel` / `selectReasoning` post（会话槽不变——`selectModel` = 唯一槽写入口）；显示与状态回落会话槽复合；显式点击仍写槽；命中分支同值回写保留。 |

### 0.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 兼容 | 全部老配置形态（形态 A：`providers[].model` + `activeProvider/activeModel`；形态 B：`models[]` + `defaultModel`）迁移不丢凭据、不丢默认模型；写回失败不阻断启动（幂等——下次 load 重试）。 |
| N2 | 性能 | `specForModel` 保持热路径形态（共享对象 + 单次查表——来源回显不新增每请求开销）；清单拉取不阻塞会话切换（异步 + 超时上限）；准入校验只在配置阶段（启动/请求零 `/models` 探测——边界定义：探测只发生在**配置写入面**，含首启向导的加渠道步骤；非配置流一律零探测——详 §16.2 M9）。 |
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
- **abort / 超时来源标注（2026-09-11 第 24 批）**：本节超时 / 中止产生点的错误对象自带结构化来源（`abortInfo`——trigger / layer / detail）；词汇表与判定见 `AGENT-LOOP.md` §20.3（单一权威源——此处只指针）。

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

| **退役/路由名保留为独立行**（2026-09-11 第 6 批） | 服务端仍收旧名时删行 → 旧配置降 `DEFAULT_SPEC`（压缩阈值/窗口显示错）——保留 + 行注释；参数与能力位**是否随新模型按"当下合同"判**：旧名**当下即**由新模型服务 → 随行；**限期路由**（切换前仍由旧模型服务）→ 不预支能力位（防硬失败）。 |

**re-export 契约**：`config.mjs` re-export `specForModel` / `providerSpec` / `specMatch`（沿革：2026-08-31 规格表迁出后既有 importers 从 config 取，不破坏调用点）；`providerSpec` = spec + provider 级 context 覆盖（§15）。

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
- **DeepSeek V4.1-Flash（2026-09-11 第 6 批）**：新行 `deepseek-flash`（1M / 384K / thinking 默认开 /
  effort `low,high,max` / 前缀补全 Beta / 磁盘缓存 / **multimodal: true**）；两退役名
  （`deepseek-v4-flash` / `deepseek-v4-flash-vision-exp`——仍收、**当下即**路由 V4.1-Flash）参数随行
  （v4-flash 加 `multimodal`）；`deepseek-v4-pro` 保留 + 注释（9/14 12:00 北京起路由 V4.1-Flash——
  **不预支视觉**）；预设 `deepseek` 默认模型 = `deepseek-flash`。需求/设计/用例见 §18–§20。
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
| 防御（发送前） | `thincoder-core/escape.mjs` v5 | `sanitizeLoneSurrogates`：孤立高/低代理 → U+FFFD（全字段：content / tool_calls[].arguments / reasoning_content / part 数组）；`escapeLiteralEscapes` 回归 v1 double 语义 + 奇数 run 修复（3+ 反斜杠后裸露的 `\u` / `\x` 也 double）；总入口 `sanitizeText` |
| 源头（截断点） | `setup.mjs` safeSliceUTF16（doc_search 预览）+ `agent/helpers.mjs` safeSliceUTF16（offloadToolResult 预览/兜底截断） | 截断点落高代理（D800-DBFF）时向前收一个码元——不再产生孤立代理 |

`escapeMessages` = `stripLocalMessageFields(messages).map(escapeMessageContent)`（OpenAI 路径发送前）；`stripImagesForTextModel` + `normalizeToolPairing` 在 `normalize.mjs`。仅思考模型 thinking 注入路径同样过净化。

### 14.7 VS Code 对齐清单

两端同规格（VS Code 端口由并行任务处理，镜像 CLI）：
① escape v5 同步（sanitizeLoneSurrogates + sanitizeText 总入口 + odd-run 修复 +
escapeMessageContent 覆盖 tool_calls[].arguments / reasoning_content）；
② UTF-16 安全截断 5 处（context doc 注入 / code 预览 / offloadToolResult / compact 序列化 / explore 蒸馏）；
③ 续写构造对齐 `buildContinuationMessages` + 失败可见性；④ 两端测试 parity。

## 15. 模型上下文可配置（providerSpec context）

> CONTEXT-COMPACTION.md 引本文件为权威：`providers[].context`（K 单位）覆盖 `MODEL_SPECS` 的 context 后，压缩阈值与 tail 公式跟随覆盖值。

**问题**：`MODEL_SPECS` 的 `context` 写死（如 deepseek-v4-flash 1M）；`specForModel(model)` 纯查表，无 provider 级覆盖——本地部署/私有端点模型的真实上下文与 spec 不符时，压缩阈值（auto = context × 0.6）偏高 → 溢出风险、窗口显示误导。

**机制**：

- **D-C1 config 字段**（config.json `providers[].context`）：**K 单位**正整数（如 `128` = 128K）；非法值（0/负数/非数字）→ 忽略 + 警告一次（每 provider 名），用 spec 值。
- **D-C2 解析覆盖**（model-specs.mjs）：`providerSpec(provider)` = `specForModel(provider.model)` 的 **拷贝覆盖**（`{ ...spec, context: provider.context * 1024 }`），**不污染共享 spec 对象**（跨 provider 串扰防护——T-C1〔已删：测试清零批〕）；`specForModel` 保持纯查表不变；`config.mjs` re-export `providerSpec`——既有 importers 从 config 取。
- **D-C3 调用方改造**：需要 provider 感知的调用方用 `providerSpec`——config.mjs
  （resolveCompactThreshold）、context（keepTailSize）、provider/core.mjs（窗口/钳制/chat spec）、
  advisor（messages/run 预算）、TUI render-frame（模型信息/状态栏 context %）、pickers
  （/model 配置界面）；纯模型查表处（无 provider）保持 `specForModel`；rate/normalize 无
  provider 感知调用点（spec 由 core 传入）。
- **D-C4 配置界面**：CLI `/model` provider 管理流加 context 字段（K 单位，复用 syncProviderField）；VS Code = settings.json `providers[].context`（设置 UI 编辑，settings 是 provider 配置唯一权威）。
- **D-C5 显示**：TUI / VS Code 模型信息显示 context 窗口（如 `128K`，`fmtContextK`：≥1M tokens 用 M 形态）跟随覆盖值。

**关键决策**：provider 级而非模型级（同一模型不同端点上下文不同）；K 单位整数（用户明确）；拷贝覆盖不污染 spec；否决——改 MODEL_SPECS 官方值 / 全局 context 字段 / 自动探测（无可靠 API，用户手配唯一可信源）。单测锁定（原 `provider-spec.test.mjs` T-C1..C6——已删（2026-09-07 测试清零批）；覆盖面现居 `test/advisor-context-budget.test.mjs` 等）。

## 16. 模型清单 provider 化与放行语义（2026-09-10）

> 来源：批次 `../batches/2026-09-10-MODEL-SELECTION.md` §1（需求见 §0）。本篇 = 本批机制主体；
> 相关节：§9（specMatch）、§11（预设单值）、§15（providerSpec 不变）。
> 状态（2026-09-11 刷新）：**主体（R1–R9 / M1–M9）与范围追加（R10 / M10）均已实施并核销**（交付面见批次档 §5/§6——范围追加 = VSC `cd1de8f`）。验收勾销 / 逐条验收结论见批次档 §6。

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
| anthropic | `GET {baseURL}/models?limit=1000`；头 `x-api-key: {apiKey}` + `anthropic-version: 2023-06-01` | `data[].id`；`has_more` → 以 `after_id` 翻页跟随（≤10 页） |
| google | `GET {baseURL}/models?key={apiKey}&pageSize=1000` | `models[].name`——剥 `models/` 前缀；`nextPageToken` 翻页跟随（≤10 页） |

- **URL 组合钉死**（评审修正轮）：组合规则 = `{baseURL}` + 相对路径，与 chat 各 transport 同构——`baseURL` 自带版本段：
  claude 预设 `https://api.anthropic.com/v1` → 拉取完整 URL `https://api.anthropic.com/v1/models`（Anthropic List Models 端点；与聊天 `{baseURL}/messages` = `…/v1/messages` 同基）；
  gemini 预设 `https://generativelanguage.googleapis.com/v1beta` → `…/v1beta/models?key=…`（与聊天 `{baseURL}/models/{model}:generateContent` 同基）；openai 系 → `{baseURL}/models`。
  自定义 baseURL 需含版本段（聊天同要求——既有行为，非本批新增约束）。
- **翻页跟随**（评审修正轮）：cursor loop，≤10 页上限防死循环；每页沿用超时；任一分页失败即整体抛出（不部分返回）。
  理由：清单权威语义不容静默截断；两 API 均为 cursor 分页，loop 实现对称；上限 10 页 × 每页至多 1000 个模型远超现实模型数。
- 返回 `string[]`（排序由调用方）；HTTP 非 2xx / 网络失败**抛出**（调用方决定降级——与现实现同）。
- 超时制度沿用现实现（整体 15s + header 15s + body idle 15s；调用方可传 `signal` 短路；翻页时逐页各自计时）；未知/缺省 format → openai（与 chat 分派缺省一致）。
- 规范依据（2026-09-10 经官方 SDK 源码核验、2026-09-11 修正轮补翻页）：Anthropic List Models 返回 `Page<ModelInfo>`（`data[].id` / `display_name`，`has_more`/`last_id`，`limit` ≤1000）；
  Gemini `models.list` 返回 `{models: [{name: "models/…"}], nextPageToken}`（`pageSize` ≤1000）——`name` 带 `models/` 前缀。解析保持防御性（字段缺失即跳过该项）。
- 候选**不做对话能力过滤**（embedding 等非对话模型一并返回）——取舍见 §16.6 #14。
- **残余风险（评审修正轮记录）**：两新分支（anthropic / google）为 **mock-only**（单测锁定完整 URL / 请求头 / 解析 / 失败态）；
  实施后安排一次上机验证动作（claude / gemini 各一发 `listModels`，真 key 环境）——失败即回改本表 URL 组合。见 §17.2 AC-1。
- 旧实现只有 openai 形状——`claude`（`format:"anthropic"`）与 `gemini`（`format:"google"`）用旧实现会 401/404（已勘察）。

**M2 候选面 = 拉取（CLI）**：

- `/model` L2（会话面）：候选 = 拉取结果**直接可选**（会话面提升到槽位面语义——槽位面 `model-picker.mjs:177` 起已为既有形态）；进入 L2 即触发拉取。
- `/config → 默认模型` L2：同源（共用拉取 helper）；槽位面（`/submodel` + consult 池）零改（仅随 M1 获得三 format 支持）。
- 加载中 header 文案 `Available models (loading…)`（既有形态）；失败 header `(fetch failed: …)` + 一行提示（文案与不可选处置见 M8）。
- 归并：`dedupeModels` / `modelSeries` 显示归并保留（迁入 helper——`src/tui/model-catalog.mjs`）。

**M3 渠道默认模型（单值——`providers[].model`）**：

- 类型：非空字符串 | 缺失；非字符串/空串归一删除（`loadConfig` / VSC `resolveProviders`）。
- 播种：20 个预设各携其单值默认模型（2026-09-10 起 = 原候选首值；`deepseek` 于第 6 批更新为 `deepseek-flash`——§11）；wizard / picker 加渠道 / setup-wizard 只落单值。
- 消费：①会话槽位 `activeModel` 空/缺失 → 回落 `slotProvider.model`（`session.mjs`；VSC 对位见 §16.5 `turn-model.mjs` 行——等价语义已有）②picker/管理面显示回退（L1 行、ctx 标签、remove/set-key/context 列表）③`/config → 默认模型` 渠道行显示
  ④advisor / subagent 裸渠道名克隆时 model 重派生——两调用点语义同源（渠道单值优先 + 父兜底）：
  - `advisor/run.mjs:341`：`provider.model ?? provider.models?.[0]` → **`provider.model ?? agent.provider?.model`**（`models[0]` 换为父兜底——与 subagent F-2c 同构；VSC `src/advisor/provider.mjs（VSC 仓）` 镜像同改）。
  - `agent-tools/subagent-async.mjs:157`：`byName.models?.[0] ?? parent.provider?.model` → **`byName.model ?? parent.provider?.model`**（`models[0]` 换为渠道单值；**尾部 `?? parent.provider?.model` 父 provider 兜底保留**——兜底链尾不动）。
  - **空值语义**（评审修正轮补）：渠道无默认模型（M3「空值合法」/ M7 空结果合法）→ 克隆取值回退主 provider model；两者皆无（极端）→ model 缺失交 chat 前 guard fail-fast（`assertProviderModel`——文案同步不再称 `models[]`）；**绝不产出静默 undefined-model 请求**。用例 T28。
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
- 文案分工（评审修正轮钉死）：**消息本体** = 上列长句（逐字——界面明示与 T24/AC-9 的唯一断言对象）；**状态标签** = `不可用`（列表行内短标——渠道管理行注记）。
- **执行层 = 配置阶段（M9）**；运行期不加闸——命令面放行语义不变、启动 / 请求零探测（边界详 M9）。

**M9 渠道准入校验（配置阶段——用户 2026-09-10 裁定）**：

- **落点**：配置写入面——加渠道 / 设 API key / 设默认模型的配置路径。CLI：`cmd-config.mjs`（默认模型菜单与渠道管理 flow）、`tui/wizard.mjs`、`cli/setup-wizard.mjs`；
  VSC：`provider-flows.mjs`（addProviderEntry / setKeyFlow）、`settings.mjs`（handleAddProvider / saveProviderKey——复用既有 `testProviderConnection` 探针模式）、`settings-panel-write.mjs`（defaultModel 顶层写）、`webview/settings-providers.js（VSC 仓）`（UI 标注）。
- **动作**：对目标渠道探一次 `GET /models`（复用 M1 实现 + 既有超时）；**失败不缓存**（下次配置动作重试）。
- **判据与表现**：探通 → 渠道可用，探得候选可直接用于该流内的默认模型选择；探不通 → 界面明示失败消息（**消息本体** = 逐字长句 `该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`；**状态标签** = `不可用`——分工见 M8），且该渠道**不作为默认模型的可选来源**（不进入可选清单）。
- **不阻断配置流**：渠道条目本身仍可保存（提示 + 标记不可用——不是拒绝写 config）。
- **边界（运行期不加闸）**：① `/model provider:model` 命令面放行语义不变（R4——用户 2026-09-10 结案：命令面不受渠道准入约束）；② 会话启动 / 每次发请求不做 `/models` 探测（不引入启动期网络依赖——N2）。**边界定义**（评审修正轮）：M9 探测只允许发生在**配置写入面**（用户配置动作触发的流内——落点即本行列出的配置路径）；「首启向导加渠道」的探测属于配置流内动作（进程早期发生不改变其性质），不受 ② 限；非配置流的启动（TUI / headless / 面板打开）一律零探测。

**M10 候选未命中 = 保持当前选择（不静默写会话槽——用户 2026-09-11 裁定，范围追加）**：

- **语义（双端同源）**：候选清单（运行期拉取）未命中「偏好 / 当前选择」时，**不得静默写会话槽**（`activeProvider` / `activeModel`）；
  **未命中/兜底场景内**只允许【保持当前选择 + 呈现候选】——该场景写会话槽仅来自显式用户动作（面板点击候选行 / `/model` 选择）；**命中分支不在此限**：维持现状（同值幂等回写 / 无槽复合时沿用 workspaceState 播种 / reasoning 归一改写——见边界①）。
- **VSC 落点（本批待改——评审通过后实施）**：`webview/model-picker.js（VSC 仓）` `handleModelsMessage` 兜底分支（as-of 2026-09-11 快照 `:118-126`——
  prefs 不命中且当前显示值不在清单时取 `_models[0]` 替换选中并 post `selectModel` + `selectReasoning`）。
  **改法（统一口径——回落不再以 `ctx.selectedModel` 是否在清单为条件）**：删除候选首项替换与两条 post；**守卫只剩「prefs 复合存在（`prefs.model` 非空）且未命中清单」**；
  未命中 → 显示与状态**同步**回落会话槽复合（`ctx.selectedModel`/`ctx.selectedProvider` = `prefs.model`/`prefs.provider`——与回合 echo 一致：`webview/send.js:47`（VSC 仓） 回传二者，不同步则 echo ≠ 槽复合 → `src/extension/turn-model.mjs:22`（VSC 仓） 判 trialOverride，显示与实际运行脱节）；
  零 `selectModel` / `selectReasoning` post；不改 `ctx.selectedReasoning`；prefs 缺失（无 `model`）→ 保持现有显示与状态（零 post）；prefs 与当前显示均缺 → 保持空白；候选经菜单呈现（`ctx._models` 既有渲染，零改动）。
- **CLI 对位（已交付——本批同链）**：`tui/cmd-config.mjs` 会话重载 = **会话值优先**（`:67-71` `sessionModel ?? dm.model ?? keep.model`，`keep.model` 仅链尾兜底——不静默改写，评审修正轮已裁）；CLI 端本轮**零改动**。
- **边界**：① 命中分支维持现状——同值幂等回写（有槽复合时 `selectModel` post 写槽 = 同值）· 无槽复合时沿用 workspaceState 播种进新会话槽（F-7「沿用当前」既有语义）· reasoning 归一改写（`levels[0]`）+ `selectReasoning` post 照旧；② 显式点击写槽路径（`selectModel()`——快照 `:71-80`）不变；
  ③ 双端独立实现、语义同源（N4——不做同步依赖 / 逐字硬一致）。

### 16.3 接口契约（函数级）

| 接口 | 变化 | 语义 |
|---|---|---|
| `listModels(provider, {signal})` | 实现迁 `provider/list-models.mjs`（`provider/index.mjs` re-export 不变——调用点零改） | 按 `provider.format` 分派；返回模型 ID 数组；错误抛出 |
| `parseModelRef(ref, providers)` | 语义收窄（M4） | `{ok:true, provider, model}` / `{ok:false, reason}` |
| `firstCandidate(provider)` | **删除** | 调用点直读 `p.model` |
| `specMatch(model)` | **新增** | `{ spec, matched }`——matched:false = DEFAULT 兜底 |
| `specForModel` / `providerSpec` | 不变 | 热路径与拷贝覆盖契约不动 |
| `migrateLegacyModelFields(raw)` | 语义反转（M7） | 幂等纯函数；返回 changed |
| TUI 拉取 helper：`src/tui/model-catalog.mjs`（新增） | **新增** | `getProviderModels(providerConfig) → Promise<string[]>`（会话缓存 TTL 60s，失败不缓存；`dedupeModels` / `modelSeries` 迁入；**缓存时钟可注入**——测试假时钟钩子（同款 `rate.mjs` `_rateHooks`），T6 确定性断言不依赖壁钟） |
| VSC `resolveDefaultModel(entry, raw)` | 回退链改（R6） | 复合属本渠道 → 渠道默认单值 → `null`（不再 `models[0]`） |

### 16.4 方案选型对比

**（a）清单拉取的时机与缓存**：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| a1 | 每次进 L2 即拉（无缓存） | 新鲜度最好；每次等待网络（≤15s 超时——与 M1 实现一致）；失败态每次出现 | 实现最简；连续操作重复付网络成本 | 否决——慢网/无网反复等待 |
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

> 行数为 2026-09-10 快照（评审修正轮补齐的 VSC / 测试行数为 2026-09-11 实测；范围追加行 `webview/model-picker.js`（VSC 仓） 为 2026-09-11 追加轮实测）。**over-tier 说明**：`config.mjs`(484) / `model-picker.mjs`(490) / `core.mjs`(498) 均接近
> 500 硬限——本批净增为负或 ≈0（listModels / 拉取逻辑迁出反而减负）；若实施中单文件预计超 500 硬限，必须就地拆分并入交付报告。
> `model-picker.mjs` 按设计估算 490−35 = 455 行（低于 500 硬限——**455 可接受、本批不拆**）；若实施后仍预计超 500，
> 拆分计划 = 槽位面（`buildSlotEntriesForProvider` / `fetchSlotModels` / `pickModelForSlot`）迁出独立文件。

**CLI 源（thincoder-cli/src）**：

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
| `src/advisor/run.mjs` | 488 | ±0 | `models?.[0]` 兜底换父兜底 `agent.provider?.model`（与 subagent 同构——M3④）；注释 |
| `src/agent-tools/subagent-async.mjs` | 473 | ±0 | `models?.[0]`→`byName.model`（**保 `?? parent.provider?.model` 父兜底**）；注释 |
| `src/cli/setup-wizard.mjs` | 80 | +10 | `preset.model` 读取修复（旧版漏改的既存 bug——本批自动对上）；落单值；首启加渠道探 `/models`（M9） |
| `src/cli/make-agent.mjs` | 163 | ±0 | 注释 |
| `src/tui/model-picker.mjs` | 490 | −35 | L2 候选改拉取（M2）；`selectModel` 放行+回显（M4/M6）；预设/custom 播种单值；建议位退场 |
| `src/tui/model-catalog.mjs` | **新增** | ~85 | 拉取+缓存 helper（M2） |
| `src/tui/cmd-config.mjs` | 447 | +25 | 默认模型菜单改写（拉取——不加手输行，O1 已裁）；`:70` 会话重载兜底首候选 → 会话值优先链（`sessionModel ?? dm.model ?? keep.model`；注释同步）；配置阶段准入探（M9——探不通标不可用、不入可选） |
| `src/tui/cmd-model.mjs` | 24 | ±0 | 注释 |
| `src/tui/cmd-advisor.mjs` | 255 | ±0 | 核查（随 M1 获益——调用兼容） |
| `src/tui/wizard.mjs` | 217 | +5 | 单值播种；加渠道时探 `/models`（M9——不通标不可用，不阻断保存） |
| `src/tui/pickers.mjs` | 106 | ±0 | 注释 |
| `src/tui/index.mjs` | 450 | ±0 | 核查（引导文案） |
| `src/tui/cmd-submodel.mjs` | 155 | ±0 | 核查（候选行显示） |
| `bin/thincoder.mjs` | 406 | ±0 | 帮助文案（`models[] candidates`→单值） |

**CLI 测试（thincoder-cli/test）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `test/list-models.test.mjs` | **新增** | ~150 | 三 format 分派（正常/边界/错误——T1–T6 + T26/T27 翻页） |
| `test/model-ref.test.mjs` | 170 | 重写 ~190 | 放行/无效表驱动（M4）+ 回显（M6）+ 候选外可切换 |
| `test/config-merge.test.mjs` | 151 | 重写 ~160 | 迁移 v2（M7）+ 预设单值 + 无 models 键 |
| `test/provider-model-guard.test.mjs` | 132 | ~140 | F-2a/c/d 改单值兜底（含 T28 subagent 侧）；F1_RE 新文案 |
| `test/provider-admission.test.mjs` | **新增** | ~110 | 配置阶段准入两态 + 运行期零探测（T23–T25——M9） |
| `test/consult-models-softfail.test.mjs` | 98 | 核查 | fixture 走新迁移（断言看 consultModels——预期不变） |
| `test/advisor-provider.test.mjs` | 72 | 核查 + T28（克隆空值语义断言） | F-1 遗留腿不受影响 |

**CLI 文档**：`docs/design/PROVIDER.md`（本档；as-of 2026-09-11 快照 ≈800 行）· `docs/design/SESSION.md`（as-of 2026-09-11 快照 ≈536 行，3 处句子——D-S1/D-S2/D-S3 段）· `docs/TODO.md`（需求池条目状态——维护面）。

**VSC 源（thincoder-vscode/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/config-presets.mjs`（VSC 仓） | 41 | ±0 | 预设 20 条单值化 |
| `src/config-migrate.mjs` | 161 | +25 | 迁移 v2（M7 同规则——独立实现；含 `:110` settings 迁移写回形态核对） |
| `src/config-io.mjs`（VSC 仓） | 438 | ±5 | normalize 单值；`resolveDefaultModel` 回退链（R6） |
| `src/provider.mjs`（VSC 仓） | 456 | −15 | `listModels` 迁出/加 format 分派 |
| `src/provider/list-models.mjs` | **新增** | ~95 | 三 format 分派 |
| `src/provider/transports/openai.mjs`（VSC 仓） | 308 | ±0（文案） | guard 文案（不再称 `models[]`） |
| `src/advisor/provider.mjs`（VSC 仓） | 39 | ±0 | `models?.[0]` 兜底换父兜底 `agent._provider?.model`（与 VSC subagent 同构——M3④）；注释 |
| `src/agent-tools/subagent.mjs` | 358 | ±0 | `models?.[0]`→`byName.model`（**保 `?? parent._provider?.model` 父兜底**）；注释 |
| `src/extension/settings.mjs` | 332 | +20 | status payload 单值；`fullStatus` 候选=fetch（失败 = 该渠道不可选 + 明示原因——无 fallback 候选）；custom 空条目判据；准入探复用（M9——既有 `testProviderConnection` 模式） |
| `src/extension/settings-panel-write.mjs`（VSC 仓） | 134 | +10 | defaultModel 面板写加准入探（M9——探不通标不可用、不入可选来源） |
| `src/extension/provider-flows.mjs`（VSC 仓） | 193 | +15 | 播种单值；`p.models?.[0]`→`p.model`；addProviderEntry / setKeyFlow 加准入探（M9——不通标不可用，不阻断保存） |
| `src/extension/vision-channel.mjs`（VSC 仓） | 23 | +5 | 视觉候选判据改渠道默认模型（下注） |
| `src/extension/panel-chat.mjs`（VSC 仓） | 499 | 核查 | 「否则首候选」决策/注释 |
| `src/extension/turn-model.mjs`（VSC 仓） | 28 | 核查 | VSC 对位 M3①：`runModel = modelOverride || slotModel || baseModel`（槽空经 `baseModel`=`resolveDefaultModel` 新回退链回落——等价语义**已有**）；注释同步（『首候选』旧词） |
| `src/extension/presets.mjs`（VSC 仓） / `panel-messages.mjs` / `panel-session.mjs` | 85 / 454 / 333 | ±0（注释） | 头注/注释 |
| `webview/settings-providers.js`（VSC 仓） | 264 | +20 | 渠道行（默认模型）、预设行、默认模型菜单数据源改运行期载荷；准入失败渠道标「不可用」且剔出默认模型可选来源（M9） |
| `webview/model-picker.js`（VSC 仓） | 135 | −4 | **范围追加**（用户 2026-09-11）：兜底分支统一口径（守卫 = prefs 未命中；显示与状态回落会话槽复合；零 `selectModel` / `selectReasoning` post——M10）；注释同步 |

> `webview/` 其余文件（`model-menu.js` / `settings-models.js` 等）消费的是 **`models` 消息载荷**（运行期模型行）——
> 载荷字段不变、消费语义不变，不受影响；例外两类：`settings-providers.js`（读 config 字段——已列入上表）与
> `model-picker.js`（M10 兜底分支语义改写——已列入上表）。

**VSC 视觉通道判据变更（决策）**：`findVisionChannel` 原判据 = 「该渠道 `models[]` 中的视觉模型」——单值化后
判据 = `specForModel(p.model).multimodal`（渠道默认模型能读图 → 可用）。**能力收窄已入档**：默认模型非视觉的渠道
不再被选中（用户把常用视觉模型设为该渠道默认模型即恢复）——无更优判据（不做异步拉取式视觉探测）。

**VSC 测试（thincoder-vscode/test）**：

| 文件 | 当前行数 | 改动 |
|---|---|---|
| `test/config-merge.test.mjs` | 126 | 重写（迁移 v2 + resolveDefaultModel 新回退链） |
| `test/provider-admission.test.mjs` | **新增** | M9 两态 + 运行期零探测（T23–T25） |
| `test/provider-model-guard.test.mjs` | 149 | 改（单值兜底 + 新文案；同 `:58` 锚） |
| `test/image-downgrade.test.mjs`（VSC 仓） | 120 | 改（视觉判据） |
| `test/config-io-panel.test.mjs`（VSC 仓） / `config-softfail.test.mjs` / `settings-panel.test.mjs` / `chat-panel.test.mjs` | 101/114/87/621 | 核查（fixture 迁移触发） |
| `test/files.mjs`（VSC 仓）（注册表） | 48 | 改（登记新档——追加 `model-picker-fallback` 条目） |
| `test/model-picker-fallback.test.mjs`（VSC 仓） | **新增** | T29（未命中零 `selectModel` / `selectReasoning` post + 显示与状态回落会话槽复合 + 命中分支同值回写正控——happy-dom 直驱 `handleModelsMessage`） |
| `test/smoke-provider.mjs`（VSC 仓） | 65 | 改（`preset.models?.[0]`→`preset.model`） |

**VSC 文档**：`PROVIDER（VSC 仓）`（O4 同步已交付——2026-09-11）；范围追加的 §3.2 差异行随本轮落档
——**不入 eng-coder 任务面**（用户 2026-09-10 裁定 O4）。

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
| 14 | 候选列表**不过滤非对话模型**（embedding 等——评审修正轮） | 拉取面忠实呈现 provider 事实（权威语义）；跨 format 无统一能力字段（google `supportedGenerationMethods` 有、openai/anthropic 无等价字段）；错误模型在请求时显式报错（可诊断）；过滤规则会成第二个人工维护清单 | 按能力字段过滤（仅 google 可行——跨端不一致；本批不做） |
| 15 | 未命中处置 = 保持当前选择（显示 = 会话槽复合 + 零 `selectModel` / `selectReasoning` post）——**不取候选首项**（用户 2026-09-11 裁定，范围追加） | 与 CLI 会话值优先对位同源（显示即会话实际选择）；零写槽 = 零静默改写 | 「取首项仅改显示不写槽」（显示与槽不符——误导用户）；「删除兜底且不回落显示」（切会话/冷启按钮空白——可读性差） |

### 16.7 UI/交互决策（含 open）

**已定**：

- 切换回显文案与颜色（M6）——正常 `C.tool`；DEFAULT 兜底 `C.error`（警示色）+
  `set context in /config to override` 提示（承接「经 /config 设 context 覆盖」的既有提示路径）。
- 拉取加载中 / 失败文案（M2/M8）——`(loading…)` / 失败消息逐字 `该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用其他渠道`（消息本体；行内状态标签 = `不可用`——分工见 M8；明示原因 + 指引换渠道；无绕过指引）。
- 候选列表行 = 直接可选（不再区分「候选 / 建议」两组——两组语义已合一）。
- 渠道无默认模型时显示 `(no default model)`（替代原 `(no candidates)`）。
- **O1 已裁（用户 2026-09-10——决策记录见 §16.6 #11）**：`/model` L2 与 `/config → 默认模型` L2 **两处都不加** UI 手输行。
- **O2 已裁（用户 2026-09-10）**：本批**不加** VSC 面板 spec 来源回显（理由：批范围第 ⑥ 项字面仅含「候选同源 + resolveDefaultModel」——不扩范围）。
- **渠道准入（用户 2026-09-10 裁定）**：配置阶段探 `/models`（M9）——探不通的渠道界面标 `不可用`（失败消息本体 = M8 长句）且不作为默认模型可选来源；命令面 `/model provider:model` 不受准入约束（R4 放行不变）；运行期 / 启动零探测。
- **面板候选未命中显示口径（M10——用户 2026-09-11 裁定，范围追加）**：保持当前选择显示 = 会话槽复合 `prefs.model`/`prefs.provider`（状态同步回落同上；均缺保持空白）——**不**替换为候选首项；未命中场景写槽仅显式点击（命中分支维持现状——同值回写；决策见 §16.6 #15）。

**open 项：无**（O1 / O2 均已裁——用户 2026-09-10）。

### 16.8 边界（本批不做）

- **不做** MODEL_SPECS 前缀匹配的无条件继承隐患（`qwen3.8-flash` 蹭泛前缀一类）——已登记独立待办（用户同意）。
- **不做** 候选外二次确认 / `--force` 类白名单后门（用户否）。
- **不改** `defaultModel` 的 F-5/F-6 语义（新会话起点 + 未设显式引导）。
- **不改** 子代理 / advisor 的模型覆盖语义（自由串 / 裸渠道名 / `default` 别名的解析优先级——红线零改）；只改其克隆兜底值来源（`models[0]` → 渠道单值 + 父兜底——M3④）。
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
2. **VSC webview 直读 config 字段**：`webview/settings-providers.js:24`（VSC 仓；余行同） 直接读 `providerStatus().providers[name].models` 与 presets payload 的 `models`——删除字段后面板显示与默认模型菜单的数据源须改（§16.5 已列）。
3. **VSC custom 空条目判据**：`settings.mjs:249` 以 `entry.models.length` 判「空条目删除」——字段删除后判据失效，须改以 `entry.model` 为准（列表内已列）。
4. **CLI `setup-wizard.mjs` 既存 bug**：`:43` 读 `presets[..].model`（MODEL-MERGE 后已不存在）——本批字段回单值后自动对上（顺带修复），列入清单。
5. **VSC 视觉通道**：`vision-channel.mjs` 候选扫描依赖 `models[]`——判据变更与能力收窄见 §16.5。
6. **bin 帮助文案**：`bin/thincoder.mjs:106` 用户可见帮助含 `models[] candidates` 字样——同步改。

## 17. 测试层（模型选择面重构——用例表与验收标准）

### 17.1 用例表（正常 / 边界 / 错误——映射需求号）

| # | 类 | 用例 | 输入 | 预期输出 | 映射 | 端 |
|---|---|---|---|---|---|---|
| T1 | 正常 | openai 拉取 | mock `{data:[{id:"a"},{id:"b"}]}` | `["a","b"]` | R1 | 双端 |
| T2 | 正常 | anthropic 拉取 | mock `{data:[{id:"claude-x"}],has_more:false}` + 断言完整 URL `https://api.anthropic.com/v1/models?limit=1000`（claude 预设组合）与请求头 `x-api-key` / `anthropic-version` | `["claude-x"]` | R1 | 双端 |
| T3 | 正常 | google 拉取 | mock `{models:[{name:"models/gemini-2.5-flash"}]}` + 断言完整 URL `https://generativelanguage.googleapis.com/v1beta/models?key=…&pageSize=1000`（gemini 预设组合） | `["gemini-2.5-flash"]`（剥前缀） | R1 | 双端 |
| T4 | 边界 | google 名称无前缀 / 缺字段项 | `{models:[{name:"gemini-x"},{}]}` | `["gemini-x"]`（跳过缺项） | R1 | 双端 |
| T5 | 错误 | 拉取 HTTP 非 2xx / 网络失败（渠道准入） | mock 失败 | 抛错；picker 显失败文案（明示原因 + 请改用其他渠道）；该渠道不可选；缓存不写入 | R1 | CLI |
| T6 | 边界 | 会话缓存 TTL | 假时钟注入（`_catalogHooks`）——推进 <60s / >60s 两次调用 | 第二次不发请求 / 重拉 | R1/N3 | CLI |
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
| T24 | 错误 | 配置阶段准入探不通（M9） | mock `/models` 失败 | 失败消息逐字 = 长句（`…——无法选择模型，请改用其他渠道`）+ 行内标 `不可用`；不入默认模型可选来源；**渠道条目仍可保存** | R9 | 双端 |
| T25 | 边界 | 运行期不探测（M9/N2） | 非配置流启动 / 发请求（配置流内探测不在本断言范围——M9 边界定义） | 无 `/models` 调用（零启动期网络依赖）；命令面放行不变 | R9/N2 | 双端 |
| T26 | 边界 | anthropic 翻页合并 | 两页 mock（`has_more:true` → `false`，第二页 `after_id`） | 两页合并；请求次数 = 2；上限 10 页截停（防死循环） | R1 | 双端 |
| T27 | 边界 | google 翻页合并 | 两页 mock（`nextPageToken` 两页） | 两页合并；`pageToken` 透传；上限 10 页截停 | R1 | 双端 |
| T28 | 边界 | 渠道无默认模型时克隆取值（M3④） | 渠道 `p.model` 缺失 + 无显式模型 | advisor：`provider.model ?? agent.provider?.model`；subagent：`byName.model ?? parent.provider?.model`（父兜底生效，无静默 undefined 请求） | R3 | CLI |
| T29 | 边界 | VSC 面板候选未命中不写槽（M10——兜底分支） | 直驱 `handleModelsMessage`（happy-dom）：① 未命中（prefs 不在拉取清单——`ctx.selectedModel` ∈/∉ 两态 + 冷启空值）② 命中（正控） | ① **零** `selectModel` / `selectReasoning` post；显示与状态 = 会话槽复合（== prefs 复合；均缺空白）② 命中分支仍 post `selectModel`（同值回写） | R10 | VSC |

> **T29 附注**（2026-09-11 修正轮）：断言 `ctx.selectedModel`/`ctx.selectedProvider` == prefs 复合（状态同步——与回合 echo 一致：`webview/send.js:47`（VSC 仓） → `src/extension/turn-model.mjs:22`（VSC 仓））；`selectReasoning` 只写 workspaceState（不触会话槽——槽写入口唯一 = `selectModel`）；prefs 缺失保持现有显示与状态、均缺 = 空白。

### 17.2 验收标准（逐条回指——每条可机器验证）

- **AC-1（R1）**：`node --test test/list-models.test.mjs` 全绿——三 format 分派（完整 URL / 请求头 / 响应解析 / 失败态 / 翻页合并——T1–T6 + T26/T27）；
  拉取失败 = 该渠道不可选 + 明示原因（T5/T20）；picker 候选行来自拉取（mock 注入断言）；VSC 静态候选来源清除：`cd thincoder-vscode && grep -rn "configCandidates" src/` → 空
  （该标识符只存在于 VSC 仓——现状命中于 `src/extension/settings.mjs:301-317`；CLI 仓无此名——判据限定 VSC 仓方有验证力。）
  上机验证动作（mock-only 残余风险的破解——评审修正轮记录）：实施后 claude / gemini 各一发真实 `listModels`（真 key 环境）；失败即回改 §16.2 M1 的 URL 组合。
- **AC-2（R2）**：`node --test test/config-merge.test.mjs` 全绿——迁移后磁盘无 `models` 键；
  配置字段读写零残留：`cd thincoder && grep -rn --exclude=config-migrate.mjs --exclude=consult.mjs --exclude=cmd-advisor.mjs --exclude=model-catalog.mjs --exclude=list-models.mjs "\.models" src/` → 空
  白名单（非配置语义的 `.models`）= 迁移读点（config-migrate）· 运行期容器/缓存（consult 的 `picked.models`/`session.models`、cmd-advisor 的 `cached.models`、model-catalog 缓存条目）·
  API 响应形状（list-models 的 google `{models:[…]}`）；白名单外出现新命中 → 停下报告，不静默扩围。自检：白名单外当前码非空、目标态空。
- **AC-3（R3）**：预设 20 条单值断言（config-merge 套件内）；槽位/克隆兜底断言绿（provider-model-guard）；克隆空值语义断言（T28——advisor / subagent 父兜底，无 undefined-model 请求）。
- **AC-4（R4）**：`node --test test/model-ref.test.mjs` 表驱动全绿——放行（候选外/多冒号）与无效（三类）分界。
- **AC-5（R5）**：回显断言——正常与 DEFAULT 两分支（含警示色分支与 `/config` 提示文案）。
- **AC-6（R6）**：VSC `resolveDefaultModel` 新回退链断言 + `fullStatus` 拉取失败 = 渠道不可选断言（明示原因；无 fallback 候选）。
- **AC-7（R7）**：双端 `npm test` 全绿（含三道契约测试族 + 新增面）。
- **AC-8（R8）**：`cd thincoder && grep -rn "候选硬约束\|候选外拒" docs/design/ src/ bin/ --exclude=PROVIDER.md --exclude-dir=_archive` → 空
  （排除集显式化——评审修正轮：`PROVIDER.md` = 本档叙述承载（§0 / §16 / §17 的 v1/v2 对比与变更叙述、本行自身）；`docs/design/_archive/` = 冻结归档。
  目标态自检（2026-09-11 收尾轮后）：排除后命中 **0**，目标态成立——`docs/design/` 面已清零
  （`SESSION.md:230` 收尾轮已改以「候选成员校验」表达）；`src/` 面 6 处旧注释（`model-picker.mjs` 5 + `cmd-model.mjs` 1）已随实施清理。）
  `_archive/MODEL-MERGE-SESSION.md` 字节不变（SHA 比对）。
- **AC-9（R9）**：配置阶段准入探两态断言（探通 → 渠道可用；探不通 → 失败消息逐字长句 + 行内标 `不可用` + 不入默认模型可选来源 + 条目仍可保存）；运行期不探测断言（非配置流启动 / 请求零 `/models` 调用）——T23/T24/T25。
- **AC-10（R10——范围追加）**：`cd thincoder-vscode && node --test test/model-picker-fallback.test.mjs` 全绿（T29——未命中零 `selectModel` / `selectReasoning` post = 会话槽零写；显示与状态回落会话槽复合（`ctx.selectedModel`/`selectedProvider` == prefs 复合）；命中分支同值回写仍在）；`npm test` 全绿（新档已注册 `test/files.mjs`）。

> 验收勾销 / 逐条验收结论落**批次档 §6**（不写进本档——用户 2026-09-10 裁定）。

## 18. 需求层（DeepSeek V4.1-Flash 接入——2026-09-11 第 6 批）

> 归属注：Provider 板块无 `requirements/` 镜像（`docs/README.md` §4.1 现状）——本批需求层同档承载，
> 承接 §0 的 R1–R10 / N1–N4 编号序列。批次依据：`../batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §1
> （2026-09-11 已收口——"那就改吧"：spec 表 + 预设一并改；本档 = 第 6 批）。设计见 §19；测试层见 §20。

### 18.1 总体需求

DeepSeek 上线 V4.1-Flash（新名 `deepseek-flash`：1M 上下文 / 384K 输出 / thinking 默认开 / 前缀补全
Beta / 磁盘缓存默认开 / **多模态视觉**）；旧名 `deepseek-v4-flash`、`deepseek-v4-flash-vision-exp`
退役（服务端仍收——**当下即**路由至 V4.1-Flash）；`deepseek-v4-pro` 限期路由（2026-09-14 12:00
北京起全部转 V4.1-Flash）。本批把**两端 MODEL_SPECS 表**与**渠道预设 `deepseek` 的默认模型**更新到
这一新事实：新名查得真实规格（不再降级 `DEFAULT_SPEC`）、退役/限期名的语义在表内可判定（行注释）、
预设播种指向在役模型。

### 18.2 功能性需求（R11–R17——每条带判定句；R16/R17 为随件）

| # | 需求 | 判定句（验收口径） |
|---|---|---|
| R11 | **新增 `deepseek-flash` 行**（V4.1-Flash 全套参数，含 `multimodal: true`） | 双端 spec 表含该行且字段 = §19.2（a）契约；`specForModel("deepseek-flash")` 命中该行（非 DEFAULT）；read_image 门放行 |
| R12 | **`deepseek-v4-flash` 行对齐 V4.1 Flash**（含 `multimodal: true`——行为变化：该名允许读图/贴图） | 行字段 = 契约（`multimodal` 为真）；CLI read_image 放行；VSC 视觉判据命中该渠道 |
| R13 | **`deepseek-v4-flash-vision-exp` 行对齐 V4.1 Flash**（参数已同值——本批注释标注退役/路由） | 行保留且字段 = 契约；行注释含退役/路由说明；`specMatch` 命中该行 |
| R14 | **`deepseek-v4-pro` 行：保留 + 注释**（9/14 起路由 V4.1-Flash；**不加 `multimodal`**——决策见 §19.5 #3） | 行在且字段零改；`specForModel("deepseek-v4-pro").multimodal` 非真；注释含 9/14 路由日期 |
| R15 | **预设 `deepseek` 默认模型 → `deepseek-flash`**（两端各 1 行） | 双端 `PROVIDER_PRESETS.deepseek.model === "deepseek-flash"`；预设其余字段不变（thinking enabled / effort `max` ∈ enum / maxTokens 393216 = 384K） |
| R16 | **文档连带**（随件）：CLI 本档 §9/§11 现状更新 + §18–§20 落档 + 变更记录一行；VSC 镜像档对应节同步 | 节落档；双端 `node scripts/check-doc-width.mjs`——本批文件新增超宽 0 行、V1/V2/V3 本批面新增违规 0 条 |
| R17 | **测试面同步**（随件）：现有 deepseek 断言逐条核对并同步；新增规格/行为断言（§20.1） | 双端 `npm test` 全绿（本批面）；CLI 预设断言值同步（T35）；新增 T30–T38 绿 |

### 18.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N5 | 零行为回归 | 除 DeepSeek 相关行与预设外零行为变化：其它厂商 spec 行零改；多模态消费链（门/降级/注入）零改（本批只改数据）；非 DeepSeek 模型的查表结果不变。 |
| N6 | 双端独立同源 | 各端独立实现、语义同源（多实现面纪律）——不做逐字硬一致；已知差异 = VSC 行多 `reasoningEffortDefault` 字段（既有形态）。 |
| N7 | 退役语义可判定 | 退役/路由/日期语义在行注释与文档内可判定（防后人误删旧名行）；语义重评入口显式（**2026-09-14 12:00 路由生效后复检**（复检项：该名视觉能力位是否翻转）/ V4.1 Pro 到货 / 用户裁定——§19.5 #3）。 |

### 18.4 范围边界（本批不做）

- **不**改 MODEL_SPECS 前缀匹配机制本身（短前缀继承隐患——另条独立待办）。
- **不**改其它厂商任何 spec 行；`deepseek-v4-pro` 行字段零改（R14 只加注释）。
- **不**做"按日期切换规格"的运行期机制（静态表 + 行注释承载日期语义）。
- **不**动用户本机 `~/.thincoder/config.json`（用户环境事——父侧经用户许可可代改）。
- **不**改 `CONSULTATION.md` / `ESCALATE.md` / `SESSION.md` 等档的 `deepseek-v4-pro` 示例值（名字仍有效，非本批范围）。
- **不**改多模态消费链（read_image 门 / 视觉渠道 / 贴图门 / 注入）——数据变化经既有机制生效。

## 19. 设计层（DeepSeek V4.1-Flash 接入——2026-09-11 第 6 批）

### 19.1 问题陈述与背景

两端 spec 表当前把 DeepSeek 记为"双模型"（`deepseek-v4-pro` / `deepseek-v4-flash` + 实验视觉名），
预设 `deepseek` 播种 `deepseek-v4-pro`。现实（2026-09-11 官方一手 `api-docs.deepseek.com` 五页 +
本机渠道 `GET /models` 实测——双源一致）：V4.1-Flash 以 `deepseek-flash` 上线；旧名
`deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 已退役（仍收，当下即路由）；`deepseek-v4-pro`
限期路由（9/14 12:00 北京起）。

不改的后果：`deepseek-flash` 查表未命中 → `DEFAULT_SPEC`（128K/32K）+ warn once——压缩阈值
（context × 0.6）与窗口显示全错、多模态能力（read_image / 贴图）不可用；预设把新装用户钉在即将
退役的 pro 名上。本批 = 纯数据面更新（spec 行 + 预设值），机制零动。

### 19.2 接口与数据契约（spec 行逐字段 + 预设 + 前缀核对）

**（a）spec 行——新行与两退役名同值**（CLI 侧行；VSC 侧每行多一字段）：

| 字段 | 值（`deepseek-flash` / `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 三行同值） |
|---|---|
| `context` | 1_000_000 |
| `maxOutput` | 384_000 |
| `thinking` | true |
| `prefixMode` | true |
| `multimodal` | true |
| `cacheMode` | "auto" |
| `thinkApi` | "type" |
| `reasoningEcho` | "required" |
| `reasoningEffortEnum` | ["low", "high", "max"] |
| `tempRange` | [0, 2] |
| `reasoningEffortDefault`（仅 VSC 侧） | "high" |

字段依据（逐项——§1 已核事实）：`thinkApi:"type"` = 官方 `{"thinking":{"type":"enabled/disabled"}}`；
`reasoningEcho:"required"` = 带 tools 的请求须全程回传 `reasoning_content`（否则 400）；
`cacheMode:"auto"` = 磁盘缓存默认启用；`prefixMode` = Chat Prefix Completion (Beta)；
`multimodal` = Vision ✓——官方约束"图片仅限 user 消息"与客户端注入路径一致（客户端只在 user 消息
注入图像：CLI `src/agent/record-results.mjs:47-55` / VSC `src/agent/execute-tools.mjs:384`（VSC 仓；至 387 行））；
`reasoningEffortEnum` / `maxOutput` / 默认 effort `high` = 官方参数页 + 渠道实测；
`tempRange: [0, 2]` = **沿用既有 DeepSeek 行现值**（既有 pro / 两退役名行同值、新行继承——无独立来源声称）。

**`deepseek-v4-pro` 行**：零字段改——现状 = 上表去掉 `multimodal`（其余同值）；本批仅加行注释
（决策见 §19.5 #3）。

**（b）预设 `deepseek`（双端同值）**：

| 字段 | 现值 | 本批 |
|---|---|---|
| `baseURL` | `https://api.deepseek.com` | 不变 |
| `model` | `"deepseek-v4-pro"` | **`"deepseek-flash"`** |
| `thinking` | `{ type: "enabled" }` | 不变（V4.1-Flash thinking 默认开——显式 enabled 合法） |
| `reasoningEffort` | `"max"` | 不变（∈ enum `low/high/max`——合法，§1 待核对项已核） |
| `maxTokens` | 393216（= 384K） | 不变（与 `maxOutput` 同量级——既有 pro 行同值在案，无新风险） |
| `desc` | `"DeepSeek"` | 不变 |

**（c）前缀匹配核对**（`SORTED_SPECS` 长度降序——§9 既有机制）：

- 新键 `deepseek-flash`（14 字符）与既有 DeepSeek 键无前缀包含关系：`deepseek-v4-flash`（17）/
  `deepseek-v4-flash-vision-exp`（28）/ `deepseek-v4-pro`（15）第 10 字符（`deepseek-` 之后首字符）
  分别为 `v`，新键第 10 字符为 `f`——`deepseek-v4-flash` 不会被新行抢先命中（各自命中自身行）。
- 长度降序保证 `deepseek-v4-flash-vision-exp`（28）先于 `deepseek-v4-flash`（17）匹配——现状保持。
- 无长度并列键（排除排序不稳定面）；`deepseek-flash*` 开头的未来变体将继承新行——预期行为。

### 19.3 方案选型对比

**（a）`deepseek-v4-pro` 行的处置**（批次第 4 点）：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| a1 | **保留 + 注释；字段零改（不预支视觉）** | 9/14 前由 V4-Pro-0813 服务——**视觉能力未核实**（现行表未声明视觉，维持现状保守）：预支视觉的硬失败风险不排除（若该名确无视觉：贴图直达 → 400，图片入历史后每请求中毒——`tools/file.mjs` 门注释既有判据）；9/14 后路由至 V4.1-Flash（视觉可用——翻转复检见 §19.5 #3） | 9/14 后该名能力被低估——读图走拒绝/降级软路径（无硬失败） | **选定**——跨 9/14 窗口取保守（前提成立与否两况均安全） |
| a2 | 跟随语义（对齐 V4.1 Flash 含 `multimodal: true`） | 9/14 后正确；9/14 前 3 天窗口预支视觉（该名视觉能力未核实——硬失败不排除） | 窗口期硬失败风险不排除 + 现有非视觉锚测试（`read-image-guide.test.mjs` 用 pro 当锚）须换锚 | 否决 |
| a3 | 删除该行 | 旧配置/会话钉此名 → 查表降 `DEFAULT_SPEC`（128K/32K）：压缩阈值与窗口显示错 | 明确回归 | 否决 |

**（b）两退役名的处置**（批次第 2/3 点）：

| # | 候选 | 判据逐项评估 | 取舍 | 结论 |
|---|---|---|---|---|
| b1 | **保留独立行 + 参数随 V4.1 Flash（v4-flash 加 `multimodal`）** | 旧名**当下即**由 V4.1-Flash 服务（无切换窗口）→ 参数与能力位随行；旧配置钉旧名仍查得真规格 | v4-flash 贴图/读图行为变化——§1 已录为预期 | **选定** |
| b2 | 删除两行 | 旧配置命中 `DEFAULT_SPEC`（同 a3 回归）；旧名仍被服务端接收（删除无收益） | 回归 | 否决 |
| b3 | 新增"别名机制"（spec 表 alias → 行引用） | 免重复行；但引入新机制（表当前无别名概念）、跨端各实现一份 | 机制成本 > 收益 | 否决 |

**（c）新行字段**：单方案——官方一手 + 渠道实测双源直录（逐项依据见 §19.2（a））——无方案空间，
豁免对比。

**（d）预设指向**：用户 2026-09-11 已裁（§1"那就改吧"——spec + 预设一并改）——不重复对比。

### 19.4 受影响文件全清单（双端——行数为 2026-09-11 实测）

> over-tier 说明：`src/config.mjs`（CLI）487 行逼近 500 硬限——本批净增 ±0（1 行改值），不拆；
> 其余文件均远低于阈值。文档面（本档 + VSC 镜像档）由设计者落档——实施者面 = 源 + 测试。

**CLI 源（thincoder-cli/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/model-specs.mjs` | 172 | +10~14 | 新增 `deepseek-flash` 行；两退役名对齐（`deepseek-v4-flash` 加 `multimodal`）；`deepseek-v4-pro` 保留 + 注释；块注释改写（退役/路由/日期） |
| `src/config.mjs` | 487 | ±0 | 预设 `deepseek.model` → `deepseek-flash`（1 行改值） |

**CLI 测试（thincoder-cli/test）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `test/config-merge.test.mjs` | 174 | ±0 | `:31` 预设断言值同步 → `deepseek-flash`（T35） |
| `test/deepseek-v41-specs.test.mjs`（已退场——TEST-LIFECYCLE） | **新增** | ~90 | 四行字段契约（T30/T31）+ 前缀优先级（T32）+ read_image 门放行/拒绝（T33/T34） |

**VSC 源（thincoder-vscode/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/config.mjs` | 184 | +4~6 | 同 CLI 行集（每行多 `reasoningEffortDefault: "high"`）；块注释同步改写（`dual models` 句） |
| `src/config-presets.mjs`（VSC 仓） | 41 | ±0 | 预设 `deepseek.model` → `deepseek-flash`（1 行改值） |

**VSC 测试（thincoder-vscode/test）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `test/config-merge.test.mjs` | 180 | +1 | 预设值断言新增（T37） |
| `test/image-downgrade.test.mjs` | 127 | +8~10 | 镜像行关键字段 + 视觉判据放行（T36——新名/退役名渠道均被选中） |

**文档（本批同步面）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `docs/design/PROVIDER.md`（CLI） | 848 | **已落 +271**（现 1119） | §9 决策行 + §11 条目 + §16.2 M3 播种例 + §18–§20（本档）+ 变更记录一行 |
| `PROVIDER（VSC 仓）`（VSC 镜像） | 386 | **已落 +14**（现 400） | §2 预设 + §6.1 规格表 + §8 图片输入 + 变更记录一行（语义同源） |

### 19.5 关键决策记录

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| 1 | 新行 `deepseek-flash` 官方数据直录（字段见 §19.2） | 官方一手 + 渠道实测双源一致；无方案空间 | ——（单方案豁免对比） |
| 2 | 两退役名**保留独立行**并对齐 V4.1 Flash | 旧配置钉旧名（删行 → `DEFAULT_SPEC` 回归）；旧名仍被服务端接收且**当下即**路由 → 参数与能力位随行（§19.3 b1） | 删除行（b2）；别名机制（b3） |
| 3 | `deepseek-v4-pro` 保留 + 注释；**不加 `multimodal`** | 9/14 前由 V4-Pro-0813 服务——视觉能力**未核实**（现行表未声明视觉，维持现状保守）：预支视觉的硬失败风险不排除（400 中毒）；9/14 后路由语义待 V4.1 Pro 落定——保守 = 无硬失败；重评入口：**2026-09-14 12:00 路由生效后复检**（复检项 = 视觉能力位是否翻转；含非视觉锚换锚——§19.6(c) #2/#3）/ V4.1 Pro 到货 / 用户裁定 | a2 跟随语义（窗口期风险不排除 + 换锚）；a3 删行（回归） |
| 4 | 预设 `deepseek` 指向新名 | 用户 §1 已裁（多模态可用 + 官方定性更优） | ——（用户已裁，不重复对比） |
| 5 | 行注释承载退役/路由/日期语义（不做按日期切换规格的运行期机制） | 静态表 + 注释 = 零新机制；日期分支机制（运行期按时选行）复杂度不成比例 | 运行期日期分支；仅文档记录不加注释（可读性差） |
| 6 | 新增薄测试档 `test/deepseek-v41-specs.test.mjs`（CLI——已退场：TEST-LIFECYCLE）；VSC 面复用既有档 | 规格行是消费面契约（多模态门/压缩阈值）——无断言则 R11–R14 只剩 grep 级验证（脆）；VSC 既有档已覆盖行为面（T36/T37 内嵌） | 不新增（仅 grep 验收）；VSC 也新建同型档（镜像成本） |

### 19.6 对账与既有纪律核对

**（a）批次档 §1 对账表逐行处置**：

| # | 现存表述 | 处置 |
|---|---|---|
| 1 | `thincoder-cli/src/model-specs.mjs:29-32` 三行 deepseek | 本批落点：新增 `deepseek-flash` + 两退役名对齐（含 `multimodal`）+ pro 注释（§19.2/§19.4） |
| 2 | `thincoder-vscode/src/config.mjs:25-28` 同三行 | 同上（各端独立实现、语义同源——VSC 行多 `reasoningEffortDefault`） |
| 3 | `thincoder-cli/src/config.mjs:36` 预设 | `model` → `deepseek-flash`（R15） |
| 4 | `thincoder-vscode/src/config-presets.mjs:11` 预设同款 | 同上（R15） |
| 5 | `PROVIDER.md` §9/§11 | 本批落点（§9 决策行 + §11 DeepSeek 条目 + §18–§20） |
| 6 | 用户本机 config 的 `deepseek` 渠道 `model: "deepseek-v4-flash"` | 非本批代码事——用户环境（父侧经用户许可可代改；旧名仍有效） |

**（b）既有纪律核对**：

- 多实现面纪律：各端独立实现、语义同源；不做逐字硬一致（已知差异 = VSC `reasoningEffortDefault`）。
- D2 单一权威：DeepSeek 行参数只在 spec 表详述（本档只引用 + 记录决策）。
- D3 计数·枚举：§11 预设 20 家不变；本批新增枚举（R11–R17 / AC-11–AC-17 / T30–T38）计数自检。
- D4 指针：本档引用用 `文档.md §N` 形态；批次档引用含节号（`../batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §1）。
- 文档可读性：新增行 ≤300 字符（自检命令见 §20.2 AC-16）。
- D5 冻结窗口：评审在途不改被审文档（本批改动集齐后统一入场）。
- 并发面：本批与其它在飞批次无共享**文件级**写冲突（`PROVIDER.md` 在飞面无其它写者——第 3 批已收口）。

**（c）勘察补充发现（超出 §1 已核清单的面）**：

1. CLI 预设断言唯一命中 = `test/config-merge.test.mjs:31`（本批同步，T35）；VSC 侧无 deepseek 预设值断言（本批新增，T37）。
2. `read-image-guide.test.mjs` 以 `deepseek-v4-pro` 当"非视觉"锚（`test/read-image-guide.test.mjs:20`）——本批保持 pro 非视觉 → 锚不动；若未来 pro 开放视觉，该锚须换（§19.5 #3 重评入口）。
3. VSC 侧同型锚 = `test/image-downgrade.test.mjs`（VSC 仓） 用 `deepseek-v4-pro` 做非视觉主模型（`:24` / `:59` / `:109`）——同上保持。
4. VSC `src/extension/settings.mjs:322` 消费 `spec.reasoningEffortDefault` 作为推理档默认——新行须携 `"high"`（VSC-only 字段）。
5. `test/model-ref.test.mjs:66` 的 spec 断言用 `kimi-k3`——零改。
6. 双端无 spec 表全量快照 / 跨仓逐字一致性测试——语义同源由各端行为断言守（不新建跨仓比较机制）。

**（d）交付面外的观察（父侧知会）**：CLI 仓 `node scripts/check-doc-width.mjs` 当前存在**存量**
超宽（5 文件 14 行——含它批批次档）与一条**它批在飞** V3（`2026-09-11-POOL-LEDGER.md` §3 缺轮次行）
——均非本批面；本批 AC-16 以"**本批文件**新增 0"为判据。

### 19.7 UI/交互决策（含 open）

本批无新增 UI/交互决策——多模态开关是**数据面**变化（spec 行 `multimodal`），经既有门/降级/注入
机制生效（read_image 门、VSC 视觉判据/贴图降级、CLI 软引导）——无新交互面、无新文案。
**open 项：无。**

## 20. 测试层（DeepSeek V4.1-Flash 接入——用例表与验收标准）

### 20.1 用例表（正常 / 边界 / 错误——映射需求号）

| # | 类 | 用例 | 输入 | 预期输出 | 映射 | 端 |
|---|---|---|---|---|---|---|
| T30 | 正常 | 新行字段契约 | `specForModel("deepseek-flash")` | 字段逐项 = §19.2（a）契约（含 `multimodal: true`） | R11 | CLI |
| T31 | 正常 | 退役名参数随行 | `specForModel("deepseek-v4-flash")` / `("deepseek-v4-flash-vision-exp")` | 两行字段逐项 = §19.2（a）契约（含 `multimodal: true`） | R12/R13 | CLI |
| T32 | 边界 | 前缀优先级 | `specMatch("deepseek-v4-flash")` / `("deepseek-flash")` / `("deepseek-v4-flash-vision-exp")` | 各自命中自身行（`matched: true`）——新行不抢先 | R11/R12/R13 | CLI |
| T33 | 正常 | read_image 门放行（行为面） | `readImageTool.execute` 直调，model = `deepseek-flash` / `deepseek-v4-flash`（tmp 真 PNG） | 返回 JSON `{ text, images }`（images[0] = data URL）——门不触发 | R11/R12 | CLI |
| T34 | 错误 | pro 保守锚 | `readImageTool.execute`，model = `deepseek-v4-pro` | 仍拒——错误含 `does not support image input` + F-3 引导句 | R14 | CLI |
| T35 | 正常 | 预设播种（既有断言同步） | `PROVIDER_PRESETS.deepseek.model` | `"deepseek-flash"`；其余字段不变（thinking/effort/maxTokens） | R15 | CLI |
| T36 | 正常 | VSC 镜像行 + 视觉判据 | `specForModel` 三键（`deepseek-flash` / `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp`）关键字段（ctx/out/multimodal/prefixMode/reasoningEffortDefault）；`findVisionChannel` 对 `deepseek-flash` / `deepseek-v4-flash` 渠道 | 字段 = 契约（三行）；两渠道均被选中（不再 null） | R11–R13 | VSC |
| T37 | 正常 | 预设播种（VSC） | `PROVIDER_PRESETS.deepseek.model` | `"deepseek-flash"` | R15 | VSC |
| T38 | 边界 | 零回归锚 | `specForModel("deepseek-v4-pro")` 只读字段锚（`multimodal` 非真 + `context` 1M / `maxOutput` 384K / `prefixMode` true / `reasoningEffortEnum` ["low","high","max"]——双端）；既有 `read-image-guide.test.mjs` / `image-downgrade.test.mjs` 非视觉锚用例 | 全锚成立；既有锚用例保持绿（pro 行零改） | R14/N5 | 双端 |

> 用例落点（§19.4 文件表同源）：T30–T34 = `test/deepseek-v41-specs.test.mjs`（CLI 新增——已退场：TEST-LIFECYCLE）；
> T35 = `test/config-merge.test.mjs`（CLI——既有断言改值）；T36 = `test/image-downgrade.test.mjs`（VSC 仓）（VSC——
> 既有档内加断言，**无需** `test/files.mjs`（VSC 仓） 注册）；T37 = `test/config-merge.test.mjs`（VSC——既有档内加断言）；
> T38 = pro 只读字段锚（CLI 新档 pro 段；VSC 面 = `image-downgrade.test.mjs`）+ 既有非视觉锚用例复跑。

### 20.2 验收标准（逐条回指——每条可机器验证）

- **AC-11（R11）**：`cd thincoder && node --test test/deepseek-v41-specs.test.mjs` 全绿（T30/T32/T33）；
  `cd thincoder-vscode && node --test test/image-downgrade.test.mjs` 全绿（T36 行字段面）。
- **AC-12（R12）**：同套件 T31/T33（CLI）+ T36（VSC）——`multimodal` 为真且行为面放行（read_image / 视觉判据）。
- **AC-13（R13）**：T31（CLI）/ T36（VSC）覆盖 vision-exp 行字段；退役注释落档（双端各一条命令）：
  `cd thincoder && grep -n "vision-exp" src/model-specs.mjs` 与
  `cd thincoder-vscode && grep -n "vision-exp" src/config.mjs` 均命中行注释含退役/路由字样。
- **AC-14（R14）**：T34/T38——pro 行零改 + 非多模态；注释日期：
  `cd thincoder && grep -n "2026-09-14" src/model-specs.mjs` 非空；`cd thincoder-vscode && grep -n "2026-09-14" src/config.mjs` 非空。
- **AC-15（R15）**：`cd thincoder && node --test test/config-merge.test.mjs` 全绿（T35）；
  `cd thincoder-vscode && node --test test/config-merge.test.mjs` 全绿（T37）。
- **AC-16（R16）**：`cd thincoder && node scripts/check-doc-width.mjs` 与
  `VSC 仓 node scripts/check-doc-width.mjs`——**本批文件**（双端 `docs/design/PROVIDER.md` + 本批次档）
  新增超宽 0 行、V1/V2/V3 本批面新增违规 0 条（存量/它在飞批次条目不计——观察见 §19.6（d））。
- **AC-17（R17）**：`cd thincoder && npm test` 与 `cd thincoder-vscode && npm test` 全绿（含 T30–T38
  新增面与既有断言同步面；VSC 新断言内嵌既有已注册档——无需 `test/files.mjs`（VSC 仓） 变更）。

> 本批验收勾销 / 逐条验收结论落**批次档 §6**（不写进本档——用户 2026-09-10 裁定）。

## 21. 请求头装配（`provider.headers`——全通路）

> 来源：批次 `../batches/2026-09-11-PROVIDER-HEADERS.md` §1（第 32 批）。本节 = 定制头（`providers[].headers`）
> 与各通路内置头的装配契约**唯一权威源**（此前仅代码注释承载——本批随铺开落档；其余处只引用不重述——D2）。
> 相关节：§2（chat 主流程）· §8（原生 transport）· §13（responses transport）。

### 21.1 机制与装配契约

Provider 请求的头分两类来源。**内置头** = transport 协议要求（`Content-Type` / `Authorization` / `x-api-key` /
`anthropic-version`）——各 transport 就地声明；**定制头** = 渠道级 `providers[].headers` 静态键值
（desktop proposal ④——如网关要求的 `X-Device-Id`），config 装载面净化后进入运行期 provider。

**装配契约**：`{ ...(provider.headers ?? {}), ...内置头 }`——定制头在前、内置头在后：同名键**内置头胜出**
（定制头不得覆盖 `Content-Type` 与认证头；与 `src/provider/core.mjs:408-412` 既有语义一致）。`Authorization`
另有装载面防线：`config.mjs` 净化器（`src/config.mjs:237-249`）在 loadConfig 时剥离该键（大小写不敏感）
与非字符串值——运行期 provider 的定制头里不含 `authorization`。

### 21.2 通路一览（消费点全表）

全表 6 行 = 本批 5 通路（4 遗漏补展开 + 1 现状参照）+ 1 对照面。

| # | 通路 | 装配点（as-of 2026-09-11） | 内置头 | 定制头展开 |
|---|---|---|---|---|
| 1 | 主聊天（OpenAI 兼容） | `src/provider/core.mjs:408-412` | `Content-Type` / `Authorization` | ✓ 既有（参照面） |
| 2 | 主聊天（responses） | `src/provider/responses.mjs` `chat()` 内三处 `proxyFetch(` 调用点（as-of :430/:449/:467） | `Content-Type` / `Authorization` | ✓ 本批补 |
| 3 | 主聊天（anthropic） | `src/provider/anthropic.mjs:73-77` | `Content-Type` / `x-api-key` / `anthropic-version` | ✓ 本批补 |
| 4 | 主聊天（google） | `src/provider/google.mjs:119` | `Content-Type` | ✓ 本批补 |
| 5 | 会话标题生成 | `thincoder-core/generate-title.mjs:47-55` | `Content-Type` / `Authorization` | ✓ 本批补 |
| 6 | 模型清单拉取（对照面） | `src/provider/list-models.mjs:52/57/73` | 按 `format` 分派 | ✓ 既有（零改） |

**域外与端面**：会话动态头（`x-opencode-session` 类）不做（证据未立——批次 §1 范围口径）；embedding 独立渠道
（`thincoder-core/embedding.mjs` 用 `embedder` 独立配置，无定制头字段）、MCP / 网络工具 / 升级检查等自有头面不属本机制；
VS Code 端无 `providers[].headers` 概念（配置面与展开面均无）——本节为 CLI 面机制，对位引入属新需求。

## 22. 需求层（`provider.headers` 全通路铺开——2026-09-11 第 32 批）

> 归属注：Provider 板块无 `requirements/` 镜像（`docs/README.md` §4.1）——本批需求层同档承载（承 §0 / §18 惯例）。
> 批次依据：`../batches/2026-09-11-PROVIDER-HEADERS.md` §1（已收口——用户「都可以」，Gitee #IKDWH7）。
> 设计见 §23；测试层见 §24。

### 22.1 总体需求

用户为渠道声明的静态定制头（`providers[].headers`——如网关要求的 `X-Device-Id`）在主聊天通路已生效，而
responses / anthropic / google 三 transport 与会话标题生成**不携带该头**——同一渠道下「聊天能通、辅助请求
被网关拒」的缺口（标题生成失败还会被静默吞成 null，只剩「没有标题」的表象）。本批把静态定制头铺到全部
5 通路：只铺开、不改语义、不引入新机制。

### 22.2 功能性需求（R18——带判定句；R19 / R20 为随件）

| # | 需求 | 判定句（验收口径） |
|---|---|---|
| R18 | **四遗漏通路补展开**（responses / anthropic / google / generate-title）——装配顺序对齐 core.mjs（定制头前、内置头后） | 逐通路机验：`providers[].headers` 声明的键出现在该通路请求头里（5 通路行为用例全绿）；同名冲突时内置头值胜出；无定制头配置时头集合与改动前逐字一致 |
| R19 | **测试面随件**：新增逐通路行为锁（`test/provider-headers.test.mjs`） | `node --test test/provider-headers.test.mjs` 全绿；`npm test` 全绿（既有锁零伤） |
| R20 | **文档面随件**：本档三层落档 + 变更记录一行 + 遗留状态行刷新（§23.6（d）） | 本档落档；`node scripts/check-doc-width.mjs` 本批文件新增超宽 0 行、V1/V2/V3 新增违规 0 条 |

### 22.3 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| N8 | 零行为回归 | 未配置 `providers[].headers` 时，5 通路请求头集合与改动前**逐字一致**（T45 锁）；既有头断言（模型清单 T1–T3 / config 面）保持绿 |
| N9 | 覆盖语义对齐 | 同名时内置头胜出（= core.mjs 现状——T44 锁）；`Authorization` 装载面剥离语义不变（config.mjs 净化器——引用不重述） |

### 22.4 范围边界（本批不做）

- **不**实现会话动态头（`x-opencode-session` 类——证据未立，待报告者给网关证据后另议）；
- **不**改头语义（净化器 / 装配顺序 / 各 transport 内置头集合——只铺开）；
- **不**动已展开面（`src/provider/core.mjs` 参照 / `src/provider/list-models.mjs` 对照——零改）；
- **不**动 embedding 独立渠道（`thincoder-core/embedding.mjs`——`embedder` 独立配置，无定制头字段）；
- **不**碰 VS Code 端（无该配置概念——对位引入属新需求）；
- **不**新建档（本档承载）。

## 23. 设计层（`provider.headers` 全通路铺开——2026-09-11 第 32 批）

### 23.1 问题陈述与背景

`providers[].headers` 是渠道级静态定制头（desktop proposal ④）。现状：主聊天（core.mjs）与模型清单
（list-models.mjs）已展开；**4 条辅助通路未展开**——responses 三处 fetch（连 `provider.headers` 都未引用）、
anthropic 字面头、google 仅 `Content-Type`、会话标题生成自建头。后果：同一渠道下用户自定义头在辅助请求面
无效（网关鉴权 / 会话头要求的端点：聊天可用、标题生成或原生协议请求被拒——标题生成失败还被静默吞成 null）。

### 23.2 接口与数据契约（逐通路落法）

数据流：config.json → loadConfig 净化（`config.mjs` 净化器——剥离 `authorization` 与非字符串值）→ 运行期
provider → transport 装配（定制头前、内置头后）→ fetch / proxyFetch → 网络。本批只动**装配**一环。

统一形态 = `{ ...(provider.headers ?? {}), ...内置头 }`（§21.1）。逐通路落点：

| # | 通路 | 落法 | 装配后头集合（无配置时） |
|---|---|---|---|
| 1 | `src/provider/responses.mjs`（三处 fetch） | `chat()` 内**提升单个 `const headers`**（位置 = `rateGate` 之后、首个 `requestWithRetry` 之前）——三处 `proxyFetch(` 调用点（as-of :430/:449/:467）改引用同一对象 | `{Content-Type, Authorization}` |
| 2 | `src/provider/anthropic.mjs:73-77` | 既有 `const headers` 对象首行加 `...(provider.headers ?? {})` | `{Content-Type, x-api-key, anthropic-version}` |
| 3 | `src/provider/google.mjs:119` | 内联展开（单调用点） | `{Content-Type}` |
| 4 | `thincoder-core/generate-title.mjs:47-55` | `opts.headers` 内联展开（:49——直连与 proxy 分支共用同一 `opts`） | `{Content-Type, Authorization}` |

- responses 三处 fetch 共享同一 `headers` 对象（重试闭包重复调用——对象只读复用，零副作用）；
- 每点配一行注释（定制头展开 + 顺序语义 + 指针 `PROVIDER.md §21`——与 core.mjs 既有注释同风格）。

**已知边界**（如实登记，不在本批处理）：① 大小写变体同名定制头（如 `X-Api-Key` vs 内置 `x-api-key`）——JS
对象键区分大小写、HTTP 头不区分：两键并存交给 fetch 归并（既有行为，core.mjs 同状），不做大小写归一
（改语义 = 超范围）；② 未经装载面净化而直达 `chat()` 的定制 `Authorization`（程序性调用，非用户配置形态）：
core / responses / generate-title 被内置头覆盖，anthropic 通路无 `Authorization` 内置头 → 该键原样透传
（用户配置形态下由装载面剥离——§21.1；不在本批加第二道防线）。

### 23.3 方案选型对比

**（a）展开形态（§1 待裁 #1——逐点落法的通用选型）**：

| # | 候选 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论（选定/否决理由） |
|---|---|---|---|---|
| a1 | **各点内联展开**（`...(provider.headers ?? {})` 就地写——与 core.mjs / list-models.mjs 既有形态同形） | 零新机制、零新档；与既有形态一致；5 处一行式改动可 grep 逐一核对；防再漂移由**逐通路行为用例**（T39–T43）承担 | 同一行式表达式在 5 点重复——与 list-models 三处同量级 | **选定** |
| a2 | 抽共享装配函数（新 `src/provider/headers.mjs`——已废：否决；或既有档导出），各点改调用 | 一处定义顺序语义；但**防漂移无效**（新通路仍须记得调用）；须连 core / list-models 同步改造才自洽（= 触碰已展开面，违背「只铺开」）；+1 新档 | 机制成本 > 收益；既有形态反证（list-models 三处亦内联） | 否决 |
| a3 | 反向顺序（内置头前、定制头后——允许定制头覆盖） | 与 core.mjs 既有语义**相反**（既有 = 内置头胜出）；用户可经 headers 覆盖 `Content-Type` / 认证头 = 语义变更（超范围） | 语义回退 + 安全面风险 | 否决 |

**（b）`generate-title.mjs` 改造形态（§1 待裁 #2）**：**局部补**选定（= a1 形态应用于该通路——保持
「自建头」结构，仅加一行展开）；**改用统一装配**（= a2 复用版）否决——理由同 a2（须连 core / list-models
一起改才自洽；本批定性 = 只铺开）。

**（c）responses.mjs 三处 fetch 的落法**：提升单 `const headers` **选定**（同函数内三处同一表达式——DRY +
单点可审，与 anthropic.mjs「先建 const 再引用」既有形态同构）；三处各自内联否决（漂移面 ×3）。

### 23.4 受影响文件全清单（行数为 2026-09-11 实测）

> over-tier 说明：`src/provider/responses.mjs` 494 行逼近 500 硬限——本批净增 ≤2 行（仍 <500），不拆；
> 后续批次触碰该档时先执行拆分。其余文件远低于阈值。文档面（本档 + 批次档）由设计者落档——实施者面 = 源 + 测试。

**CLI 源（thincoder-cli/src）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `src/provider/responses.mjs` | 494 | +1~2 | `chat()` 内提升单 `const headers`（含展开）——三处 `proxyFetch(` 调用点（as-of :430/:449/:467）改引用 |
| `src/provider/anthropic.mjs` | 226 | +1 | `headers` 对象首行加展开（:73-77） |
| `src/provider/google.mjs` | 259 | ±1 | `headers` 内联展开（:119） |
| `thincoder-core/generate-title.mjs` | 83 | ±1 | `opts.headers` 内联展开（:49） |

**CLI 测试（thincoder-cli/test）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `test/provider-headers.test.mjs` | **新增** | ~150 | T39–T47（5 通路头到达 / 覆盖语义 / 零配置回归 / config 全链 / 错误路径） |

**文档（本批同步面——设计者已落）**：

| 文件 | 当前行数 | 预计增量 | 改动要点 |
|---|---|---|---|
| `docs/design/PROVIDER.md`（CLI） | 1125 → 1369（实测） | 本批 +~244 | §21 机制节 + §22–§24 三层 + 状态行刷新（§23.6（d））+ 变更记录两行 |

### 23.5 关键决策记录

| # | 决策 | 理由 | 否决备选 |
|---|---|---|---|
| 1 | 展开形态 = 各点内联（与既有形态同形） | §23.3（a）——一致性 + 改动范围 | 共享装配（a2——防漂移无效 + 须动已展开面）；反向顺序（a3——语义回退） |
| 2 | responses 三处 fetch 提升单 `const headers` | §23.3（c）——DRY + 单点可审 | 三处各自内联（漂移面 ×3） |
| 3 | 覆盖语义 = 内置头胜出（定制头在前） | 对齐 core.mjs 既有语义 + 安全（认证 / 内容类型不可被 headers 劫持） | 反向顺序（= 语义变更） |
| 4 | generate-title 局部补（不改「自建头」结构） | §23.3（b）——保持「只铺开」定性 | 统一装配（须连 core 一起改） |
| 5 | 测试 = 独立新档 `test/provider-headers.test.mjs`（含 core 参照面锁） | 逐通路行为锁是本批唯一强判据（grep 级判据脆）；core 参照面此前零头断言——顺带补上 | 扩既有档（职责不符）；仅 grep 验收（脆） |
| 6 | 头来源一览归属 = 本档 §21（不拆 SESSION.md、不新建档） | Provider 板块映射权威（`docs/README.md` §4）；4/5 通路在 `src/provider/`；单一权威源（D2——SESSION.md 无头装配内容，无需改动） | 拆 SESSION.md（双源）；新档（批次 §1 边界禁） |

### 23.6 对账与既有纪律核对

**（a）批次档 §1 对账表逐行处置**：

| # | §1 表述（as-of） | 处置 |
|---|---|---|
| 1 | `src/provider/core.mjs:405-425` 展开 ✓ | 参照面——零改；T39 锁其语义（含覆盖序） |
| 2 | `responses.mjs:432/451/469` 三处遗漏 | 本批补（§23.2 #1）——锚注：§1 行号 = `headers:` 字面行；本档 §21–§24 统一锚 `proxyFetch(` 调用起始行（同一三处——as-of :430/:449/:467） |
| 3 | `anthropic.mjs:73-77` 字面头无展开 | 本批补（§23.2 #2） |
| 4 | `google.mjs:119` 仅 Content-Type | 本批补（§23.2 #3） |
| 5 | `src/agent/generate-title.mjs:47-55` 自建头 | **路径勘误**（该档已并入核包）：实际 = `thincoder-core/generate-title.mjs:47-55`（`headers` 行 :49；`src/agent/` 下无该档）——本批补（§23.2 #4） |
| 6 | `list-models.mjs:52/57/73` 已展开（对照） | 对照面——零改；既有断言（T1/T2）保持绿 |

**（b）既有纪律核对**：

- D2 单一权威：装配契约 + 通路一览唯一权威 = §21；§22–§24 只引用（判定句不重述键位细节）。
- D3 计数·枚举：本批新增编号 = R18–R20 / N8–N9 / T39–T47 / AC-18–AC-20；通路表 6 行（5 通路 + 1 对照面）——各处点数与列表同源。
- D4 指针：本档引用 = `文档.md §N` 形态（V1 可解析）；域外文档用反引号包裹名（不触 V1 解析）。
- D5 冻结窗口：评审在途不改被审文档——本批改动集齐后统一入场。
- 多实现面纪律：VS Code 端无 `providers[].headers` 概念（配置面 / 展开面均无——实查）→ 无镜像面；差异如实登记
  （§21 域外与端面行）；未来对位引入 = 新需求（另批）。
- 并发面：`src/provider/{anthropic,google}.mjs` 同时为**第 24 批（ABORT-PROVENANCE）**的实施域文件
  （as-of 本设计轮：该批评审轮次 1 = changes-required——未实施）——实施排程由父侧按 files 域串行（批次档 §2 并发面）。

**（c）勘察补充发现（超出 §1 已核清单的面）**：

1. 路径勘误（见（a）#5）。
2. 全仓 fetch 调用点穷举（补 §1 未列）：provider 面消费点 = §21.2 全表；非 provider 面（MCP 传输 / 网络工具 /
   升级检查 / 连通探活）自有头机制、`embedding.mjs` 用 `embedder` 独立配置无定制头字段——均域外。
3. `generate-title.mjs` 的 `_deps` 测试缝注释称存在「proxy-branch regression test」——实查全仓无该测试引用
   （`_deps` 仅定义处出现）：本批 T43 顺带补 proxy 分支断言（注释所称覆盖首次落实）。
4. VS Code 端无该配置概念（`src/provider/transports/*` 均为字面头）——域外登记。

**（d）既有遗留项处置（他批遗留——收口于本设计轮）**：

`PROVIDER.md` 头注（`:3`）与 §16 首注（`:448`）原载「R10 / M10 增量待批准」为陈旧两态（`../batches/2026-09-10-MODEL-SELECTION.md` §6
遗留 #5 / `../batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §5 复检项——两批均注明「随下次 PROVIDER.md 设计轮刷新」）：
本次一并刷新为已实施并核销（证据：VSC 提交 `cd1de8f` + `test/model-picker-fallback.test.mjs`（VSC 仓） 在册；批次档 §6 已核销）。

### 23.7 UI/交互决策（含 open）

本批无新增 UI/交互面——纯请求头装配面（配置态 `providers[].headers` 的编辑入口不在本批；既有 TUI `/model`
provider 管理流零改）。**open 项：无。**

## 24. 测试层（`provider.headers` 全通路铺开——用例表与验收标准）

### 24.1 用例表（正常 / 边界 / 错误——映射需求号）

| # | 类 | 用例 | 输入 | 预期输出 | 映射 |
|---|---|---|---|---|---|
| T39 | 正常 | 主聊天（OpenAI 兼容）定制头到达——参照面 | `chat(provider{headers:{'X-Device-Id':'dev-1'}})`；mock fetch 记录 `opts` | 捕获头 = `X-Device-Id: dev-1` + `Content-Type: application/json` + `Authorization: Bearer k-test` | R18/N8 |
| T40 | 正常 | responses 定制头到达 | `chat({format:'responses'})` | 头集合同 T39 | R18 |
| T41 | 正常 | anthropic 定制头到达（内置头在位） | `chat({format:'anthropic'})` | 头集合 = `X-Device-Id` + `Content-Type` + `x-api-key` + `anthropic-version`（无 `Authorization`——该通路无此内置头） | R18 |
| T42 | 正常 | google 定制头到达 | `chat({format:'google'})` | 头集合 = `X-Device-Id` + `Content-Type` | R18 |
| T43 | 正常 | 会话标题定制头到达（直连 + proxy 两分支） | `generateTitle(text, provider{headers})`；proxy 分支经 `_deps.proxyFetchImpl` 注入 | 两分支捕获头均含 `X-Device-Id` + 内置头 | R18 |
| T44 | 边界 | 同名冲突 → 内置头胜出（5 通路） | 各通路传入与该通路内置头同名的定制冲突值 | 内置头值胜出（定制头非同名键仍到达） | R18/N9 |
| T45 | 边界 | 零配置回归——头集合逐字不变（5 通路） | `provider.headers` 缺省 | 头集合 = 改动前基线（逐通路 deepEqual） | R18/N8 |
| T46 | 边界 | config → 请求全链（净化 + 展开） | 临时 config.json（headers 含 `Authorization` / 非字符串值 / 正常键）→ `loadConfig` → `chat` | 非法键被装载面剥离；正常定制键到达；`Authorization` = `Bearer <apiKey>` | R18/N9 |
| T47 | 错误 | 非 2xx 路径定制头携行 + 错误语义不变（anthropic 通路——单通路代表） | `chat({format:'anthropic'})`；mock 返回 401 文本体 | 捕获头含定制键 + `x-api-key`；抛出错误文案以 `Anthropic API error 401` 开头（既有语义族——零改、无重试等待） | R18/N8 |

> 用例落点 = `test/provider-headers.test.mjs`（新增——`npm test` 自动 glob 收集，无需注册）。mock 形态
> （POC 已验证）：`globalThis.fetch` 注入记录 `(url, opts)`；native 三格式返回最小 SSE 帧（responses =
> `response.output_text.delta` + `response.completed`；anthropic = `message_start` + `content_block_delta` +
> `message_stop`；google = 单 `candidates` 帧）；OpenAI 面走非 SSE 单 chunk JSON 兜底；`generate-title` 面返回
> `{ok:true, json:…}`。全套无定时器等待（快层直跑——超 D-T6 阈值才标 `slow`）。
> config 面注入缝（T46）= `_setConfigPathForTest`（`src/config.mjs:28-29`）+ tmp config.json——夹具形态复用既有 `test/config-merge.test.mjs`（`tmpCfg()` :16-21；现有缝，零新夹具机制）。

### 24.2 验收标准（逐条回指——每条可机器验证）

- **AC-18（R18）**：`cd thincoder && node --test test/provider-headers.test.mjs` 全绿——T39–T43 逐通路
  「定制头出现在请求」；T44 覆盖语义；T45 零配置回归；T46 config 全链；T47 错误路径头携行。
- **AC-19（R19）**：`cd thincoder && npm test` 全绿（既有锁零伤——含模型清单 T1/T2 头断言、config 面、guard 面）。
- **AC-20（R20）**：`cd thincoder && node scripts/check-doc-width.mjs`——**本批文件**（`docs/design/PROVIDER.md`
  + 本批次档）新增超宽 0 行、V1/V2/V3 本批面新增违规 0 条；`cd thincoder-vscode && node scripts/check-doc-width.mjs`
  复跑（本批零改动——确认无新增）。仓内存量与他批在途面不计（观察：CLI 仓当前宽度 8 文件 10 行超宽、一致性
  新增 4 条——均属他批在途档，非本批面）。

> 本批验收勾销 / 逐条验收结论落**批次档 §6**（不写进本档——用户 2026-09-10 裁定）。

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
- 2026-09-11 评审修正轮：13 条采纳项落档（M1 URL 组合钉死 + 翻页跟随 + mock-only 残余风险与上机验证动作；M3④ 空值语义 / 父兜底对齐；M8/M9 失败文案分工与零探测边界；AC-8 显式排除集；§16.5 行数补齐 + 拆分阈值对齐 500 硬限；§16.6 #14 非对话模型不过滤；T26–T28 新增）。
- 2026-09-11：AC-8 的 `SESSION.md:230` 命中枚举改准（该处收尾轮已改以「候选成员校验」表达——docs/design 面清零的现状同步；语义不变）。
- 2026-09-11 范围追加（用户裁定）：VSC 面板兜底静默改写并入本批——R10 + M10 落档（`webview/model-picker.js`（VSC 仓） 兜底分支：保持当前选择 + 零 post；CLI `keep.model` 对位同源）；§16.5 追加文件行；T29 / AC-10 新增。
- 2026-09-11 范围追加评审修正轮（8 条采纳项落档）：M10 口径统一（守卫 = prefs 未命中；显示与状态同步回落会话槽复合；零 `selectModel` / `selectReasoning` post）；命中分支维持现状明示（语义句限域 + 边界①展开）；R10/§16.6 #15/§16.7/T29/AC-10 断言口径统一；T29 夹具两态 + 状态断言；CLI 对位链尾措辞精确化（会话值优先；`keep.model` 仅链尾）；§16.5 `test/files.mjs`（VSC 仓） 行数 48；状态行拆两态。
- 2026-09-11（第 6 批 DeepSeek V4.1-Flash）：规格表新增 `deepseek-flash` 行（1M / 384K / thinking 默认开 / 前缀补全 / 磁盘缓存 / `multimodal`）；
  两退役名（`deepseek-v4-flash` / `deepseek-v4-flash-vision-exp`——仍收、当下即路由）参数随 V4.1-Flash；
  `deepseek-v4-pro` 保留 + 注释（9/14 12:00 北京起路由 V4.1-Flash——不预支视觉）；预设 `deepseek` 默认模型 → `deepseek-flash`（需求 R11–R17 / 设计 §18–§20 落档）。
- 2026-09-11 评审修正轮（第 6 批——7 条采纳项落档）：§19.5 #3 / N7 重评触发补 **2026-09-14 12:00 路由生效后复检**；
  a1/a2 前提措辞降级（pro 视觉能力未核实——保守，不以「无视觉」硬断言承载）；§19.2（c）字符位改准（第 10 字符）；
  §19.2（a）tempRange 出处补记（沿用既有行现值）；§19.4 VSC 行补块注释改写句；T36 扩 vision-exp 行断言 +
  T38 增 pro 只读字段锚；AC-13 补 VSC 判据（批次档 §2 同步追加）。
- 2026-09-11（第 32 批 PROVIDER-HEADERS）：`provider.headers` 全通路铺开——responses / anthropic / google /
  generate-title 四遗漏通路补展开（顺序 = 定制头前、内置头后——内置头胜出，与 core.mjs 对齐）；新增 §21 请求头装配
  （6 行消费点全表 = 5 通路 + 1 对照面）+ §22–§24 三层落档（需求 R18–R20 / 设计 §23 / 测试 §24）。
- 2026-09-11 状态行刷新：头注与 §16 首注的「R10 / M10 增量待批准」陈旧两态 → 已实施并核销
  （`../batches/2026-09-10-MODEL-SELECTION.md` §6 遗留 #5 / `../batches/2026-09-11-DEEPSEEK-V41-FLASH.md` §5 复检项一并收口）。
- 2026-09-11（第 24 批 ABORT-PROVENANCE——指针注）：§3 超时语义节补一行来源标注指针（词汇表见 `AGENT-LOOP.md` §20.3）；本文档零语义改动。
- 2026-09-11 评审修正轮（第 32 批——7 条采纳项落档）：D3 枚举同步（T39–T47）；responses 三处调用点锚法统一（`proxyFetch(` 起始行——as-of :430/:449/:467；§23.6（a）#2 锚注）；T41 预期补全集合；§23.4 文档行数注刷新（+~244）；T46 注入缝点名（§24.1 注）。
