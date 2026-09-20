# 供应商与模型（PROVIDER）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。
> **机制面**（§6–§8 · 2026-09-14「B 轮并入」）：机制 / 契约的实质描述 · 关键决策 · 不并项与历史沿革（自 CLI 产品档并入）——**本档 = 该板块的完整设计面**（裁决行 + 机制 + 决策 + 沿革）。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 调用核心 | `thincoder-cli/src/provider/core.mjs` + `src/provider/index.mjs` | 经 `@thincoder/core/provider/core.mjs` 引用（W10 已迁核——自持镜像已删） （迁移期引文） |
| 传输 | `src/provider/{anthropic,google,responses}.mjs` | 经核 `provider/{anthropic,google,sse,responses}.mjs` 引用（W10 已迁核——`transports/` 镜像已删） |
| 基础件 | `src/provider/{sse,retry,normalize,errors,abort-provenance}.mjs` | 经核同列引用（W10 已迁核——内联面已归核） |
| 限流 | `src/provider/rate.mjs` | 经 `@thincoder/core/provider/rate.mjs` 引用（W10 已迁核——同名镜像已删） |
| 模型清单 | `src/provider/list-models.mjs` | 经 `@thincoder/core/provider/list-models.mjs` 引用（W10 已迁核——同名镜像已删） |
| 模型规格 | `src/model-specs.mjs` | `src/config.mjs`（模型规格段）+ `specs.mjs`（W16 面——本批零动作） |

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 114 | `provider/rate.mjs` | 同路径 | 0.1646 · 异 | ③ | 进核 | 取并集：等待取 VSC 的可中断实现（`abortableSleep`）+ 默认限流口径取 VSC 的 spec 回退 + token 估算取并集（图片 part / `max_tokens`） | 分叉 ＝ 等待可中断性（CLI 睡到窗口结束 `src/provider/rate.mjs:89-90` / VSC 10s 段可中断 `:26-34,135-137`）+ 默认 tpm/rpm 回退 + token 估算口径；前提（同职责）仍成立 | **①** | S1（建核补齐） |
| 115 | `provider/list-models.mjs` | 同路径 | 0.0601 · 异 | ③ | 进核 | 取并集：保留 VSC 的排序与明确报错 + CLI 的 `provider.headers` 随请求发出 | 分叉 ＝ 排序 / 自定义 header 是否随 `/models` 发出 / 失败形态（CLI 静默空清单 `src/provider/list-models.mjs:88-93` / VSC 抛错并显示不可用 `:38,63-74`）；前提（同职责）仍成立 | **①②** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 138 | `src/provider/core.mjs` + `src/provider/index.mjs` ↔ `src/provider.mjs` | ② | 融合：以 CLI 调用核心为准 + VSC 的传输分派面归位 | 分叉 ＝ 组织（VSC 单档 / CLI 拆 core + sse + normalize）；两端同 API 语义（`chat` / `createProvider`——VSC `thincoder-vscode/src/provider.mjs:123` 自述「CLI core.mjs 同构」；该端档已退役〔W10 删除集〕）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
| 139 | `src/provider/anthropic.mjs` ↔ `src/provider/transports/anthropic.mjs` | ② | 融合：取一侧 + 核内 `transports/` 目录归位 | 分叉 ＝ 目录（CLI 平铺 / VSC `transports/`）；同源自述 ⇒ 前提成立 | — | S1（建核补齐） |
| 140 | `src/provider/google.mjs` ↔ `src/provider/transports/google.mjs` | ② | 融合：同 #139 | 同 #139（VSC 头注自述「与 CLI 同修」）⇒ 前提成立 | — | S1（建核补齐） |
| 141 | `src/provider/responses.mjs` ↔ `src/provider/transports/responses.mjs` | ② | 融合：同 #139 | 同 #139（VSC `:376` 自述「与 CLI/core 同构」）⇒ 前提成立 | — | S1（建核补齐） |
| 142 | `src/provider/sse.mjs` · `retry.mjs` · `normalize.mjs` · `errors.mjs` · `abort-provenance.mjs` ↔ 核内（VSC 侧内联 / 无独立档） | ② | 融合：按核内结构归位（重试链 / 预发归一 / 错误分类 / abort 溯源） | 分叉 ＝ 拆档粒度（VSC 未拆）；VSC 多处自述「与 CLI 对齐」（`thincoder-vscode/src/provider.mjs:250` 等——该端档已退役〔W10 删除集〕）⇒ 前提成立 | — | S1（建核补齐） （迁移期引文） |
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
`model` / `messages` / `stream: true`；`stream_options`（非 `noUsageStream` 模型）；`max_tokens` 按 `provider.maxTokens`；
`temperature` 按 `spec.tempRange` 钳位；`thinking` 按 `spec.thinkApi` 注入；`reasoning_effort` 校验进 enum 后注入（router 模型 ID 含 `/` 时不发）；
+ **off 补发支**（`thinking:null` ∧ effort 族 ∧ 枚举行含 `"none"` ∧ 无显式档 ⇒ 发 `"none"`，同受 `!isRouter` 门——机制单源 = §6.12 · 渠道接入批 D-14）；`enable_thinking`（Qwen）；
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
- **onWait 相位值域（五相）**：`gate` / `retry` / `overloaded`（带 `seconds`）· `warn` / `quota`（带 `message`——**无 `seconds`**）；发射面 = `rate.mjs`（`gate:144` · `warn:96,110`）· `thincoder-core/provider/core.mjs:235,454` · `provider/retry.mjs:60,68`。相位 → 状态文案的**核内单源映射**见 §6.20。

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
- **退役 / 路由名是否保留成行按服务端状态判**：服务端**仍受理**旧名时删行 → 旧配置降 `DEFAULT_SPEC`（压缩阈值 / 窗口显示错）——故默认**保留为独立行**；
  仅当服务端**已 404**（名真退役）或用户明令退役时删行，且**须逐名认账退化后果**（不得静默）。参数与能力位**是否随新模型按「当下合同」判**
  （当下即由新模型服务 → 随行；限期路由 → 不预支能力位）。逐名表 = `doc:MODEL-SPECS.md:§2.4`。
- **qwen 族无泛前缀托底行**（2026-09-20 裁定 · 待落）：`qwen` 行本批删除后，任何 `qwen*` 未命中名退 `DEFAULT_SPEC` + 一次性告警；不建「保守族底行」
  （理由与逐名后果 = `docs/core/design/MODEL-SPECS.md` §2.4，本档不重述）。**约束：以后不得以蹭泛前缀的方式给新 qwen 档配能力**——
  音/视频能力在 schema 上**未表达且未接入**（`multimodal` 仅承载「可收图像 part」），新档声明只写实测到的字段。
- **re-export 契约**：`config.mjs` re-export `specForModel` / `providerSpec` / `specMatch`；`providerSpec` = spec + provider 级 context 覆盖。

### 6.10 畸形 tool_calls 防御解析

OpenAI 兼容 SSE 流中畸形 `tool_calls`（数组含 null 元素、缺 `function` / `name` / `id` / `index`）不再崩溃或静默丢工具——槽选择优先级：① `index` 有效 → 按 index 取槽；② 缺 index 但有 `id` → 按 id 在既有槽中查找归并；③ 缺 index 无 id 但有 `function.name` → 新建尾部槽；④ 其余（纯 arguments 增量）→ 延续最后一个槽，无槽可延续则丢弃并计数。流结束收尾（`finalizeToolCalls`）：稀疏 hole 剔除、
name 空槽丢弃并计数、缺 id 合成 `call_N`。告警（`droppedToolCalls > 0`）进**机读线** `_warnings`（`malformed-tool-calls`）——模型需知道其工具调用未执行；agent 层零改动。只防御与降级，不替模型修复语义。

### 6.11 模型支持与预设（PROVIDER_PRESETS）

- **预设** `PROVIDER_PRESETS`（住 `thincoder-core/config-presets.mjs`，21 家）：按需从预设创建 provider，各预设声明 `baseURL` / **`model`（单值默认模型）** / thinking / reasoningEffort / maxTokens / desc。**预设不再携带候选清单**（原 `models` 种子已废）。
- **渠道接入批新增**（2026-09-20 · `tokenhub` 入表 + `volcengine` 默认模型改值）：`tokenhub` = 腾讯 TokenHub 聚合网关
  （baseURL `https://tokenhub.tencentmaas.com/v1`，默认模型 `hy3`，**不带** thinking / reasoningEffort / maxTokens 字段 =
  该载荷面未实测，不设即不发）；`volcengine` = 火山方舟，默认模型 = `doubao-seed-2-0-code-preview-260215`（实测在册；
  改值动因与旧值 = 批次档 `2026-09-20-channel-onboarding.md` §1.2–§1.3）。既有 `hunyuan` 预设 = 另一主机，本轮未实测 ⇒ **不动**。
  行集与逐字段取值 = `doc:MODEL-SPECS.md:§9`；护栏用例 = 预置↔规格漂移白名单（只减不增）。
- 能力差异全走规格表；`kimi/kimi-k3`（router 前缀）与 `k3` 保留显式 alias 行；未知模型保守 `DEFAULT_SPEC`。
- **DeepSeek V4.1-Flash 行集**：新行 `deepseek-flash`（1M 上下文 / 384K 输出 / thinking 默认开 / 前缀补全 Beta / 磁盘缓存默认开 / `multimodal: true`）；
qwen-plan 渠道同名模型以 `deepseek-v4.1-flash` 提供（`token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`——2026-09-15 实测 GET /models 含该名 · chat 200）——独立行、字段逐字对齐 `deepseek-flash`（`.1` ≠ `-` ⇒ 纯前缀查表不命中既有行）；
两退役名 `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 保留独立行、参数与能力位随新行（旧配置钉旧名仍查得真规格）；`deepseek-v4-pro` 保留 + 行注释（限期路由——**不预支视觉**：预支的硬失败风险不排除）；
预设 `deepseek` 默认模型 = `deepseek-flash`。

### 6.12 Qwen 思考关闭（`enable_thinking`）

qwen 系列（百炼**混合思考**模式，默认开启）需能**真正关闭**思考（缺陷：reasoning off 时原请求体不含任何思考控制字段 → 服务端按默认开启 → off 静默失效）。纯函数 `resolveEnableThinking(provider, spec)`（`config.mjs`，两端同构造）：白名单双条件 = 模型名 `qwen` 开头（排除 `qwen3-coder` 前缀）**且** provider 指向百炼 host（`isBailianHost`）；
`provider.thinking === null` 是两端统一的**显式 off 唯一标记**。**不受 router 门控**（白名单键控模型前缀 + host，非模型 ID 斜杠）。**选档位 / 开 auto = 隐含 thinking on**：清 `thinking: null` off 标记；
on 分支默认 effort 契约 = 取 `spec.reasoningEffortEnum` 的**首个非 `"none"` 档**——枚举首项为 `none` 的族（qwen 全族）不得拿首项当 on 默认，否则 = 「开了个关着的思考」；
`none` 不在枚举时两者等价 ⇒ 对其余族零回归。**现状（待落）**：`thincoder-cli/src/tui/cmd-think.mjs:118` 仍取枚举首项，修法 = `docs/batches/2026-09-20-qwen-flash-specs.md` 本批交付项（设计 `doc:MODEL-SPECS.md:§2.8`，A-16 / T-14）。

**两机制并存（2026-09-20 登记，不混同）**：关思考有两条独立路径——本节的名字 + 主机白名单（管**请求体字段**）
与 spec 的 `reasoningEffortEnum` 含 `"none"`（管**端侧下拉能选哪些档 + 发送前校验**）。
本批**不新增** `thinkToggleApi` 类 spec 字段：同一语义两处真源违 D2，枚举含 `"none"` 已是「可关」的唯一枚举表达
（裁定与链路逐条 = `doc:MODEL-SPECS.md:§2.6`）。

**effort 族渠道的 off 补发（渠道接入批 D-14 · AC-9——本节 = 谓词单源）**：host 白名单只覆盖百炼（`resolveEnableThinking`）；
**effort 族**（`spec.thinkApi === "effort"`——spec 行自携该位，如 hy3 / doubao-seed / qwen-max）的 `thinking: null` 不能靠
`enable_thinking` 生效，需在载荷组装层补发 `reasoning_effort: "none"`（实测唯一有效 off 路径：tok=0、`reasoning_content` 消失）。
**谓词（单源，其余面引用本节）**：`provider.thinking === null` ∧ `spec.thinkApi === "effort"` ∧ `spec.reasoningEffortEnum?.includes("none")` ∧
`provider.reasoningEffort == null` ∧ `!provider.model.includes("/")`（末款复用 §6.2 router 门）。
**零变面五 guard**：无枚举名 / 显式档在场（档位优先）/ 枚举不含 `none` / 百炼 qwen（`enable_thinking:false` 照发 + 同义多携该字段）/ 
路由形态名（含 `/`）；后台调用路径（`context.mjs` / `explore-distill.mjs` 的 `{...provider, thinking:null}`）同命 = 有意认账
（不再空想，与 qwen 侧同方向）。判据 = `doc:MODEL-SPECS.md:§9.6`（D-14）+ 用例 B-5；落点 = `thincoder-core/provider/core.mjs` 载荷组装段（+~5 行）。

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
- **M8/M9 补（2026-09-18 · F-W19 · VSC 探针落账与有界重试）**：探针失败落账增 `failure ∈ {timeout, malformed, hostBusy}` + `ts`；
`hostBusy` = 宿主事件循环繁忙（**非渠道故障**——分类可辨）；**运行期零探测语义零改**——本补只动配置阶段；**文案逐字零改**（`channelUnavailableMessage`）。
端侧详面（采样器落点 / 重试窗口起止与计数 / 展示面分档 / 机检面）= `docs/vsc/design/SETTINGS.md` §2.12（**不重述**）。
- **M10 候选未命中 = 保持当前选择**：候选清单未命中「偏好 / 当前选择」时**不得静默写会话槽**——该场景写槽仅来自显式用户动作（候选行点击 / `/model` 选择）；未命中分支显示与状态同步回落会话槽复合、零 `selectModel` / `selectReasoning` post；**命中分支维持现状**（同值幂等回写 / 无槽复合时沿用 workspaceState 播种 / reasoning 归一改写）。CLI 对位 = 会话值优先链（`sessionModel ?? dm.model ?? keep.model`）。
- **UI / 交互决策（已定）**：候选列表行**直接可选**（不再区分「候选 / 建议」两组）；渠道无默认模型时显示 `(no default model)`；**不加 UI 手输行**（命令面 `provider:model` 仍放行任意串，被否的只是「在 UI 里新造手输入口」）；本批**不加** VSC 面板 spec 来源回显。**open 项：无**。

### 6.17 请求头装配（`provider.headers`）

- **两类来源**：**内置头** = transport 协议要求（`Content-Type` / `Authorization` / `x-api-key` / `anthropic-version`），各 transport 就地声明；**定制头** = 渠道级 `providers[].headers` 静态键值。
- **装配契约** = `{ ...(provider.headers ?? {}), ...内置头 }`——定制头在前、内置头在后：**同名键内置头胜出**（定制头不得覆盖 `Content-Type` 与认证头）。`Authorization` 另有装载面防线：`config.mjs` 净化器在 loadConfig 时剥离该键（大小写不敏感）+ 非字符串值。
- **消费点全表**（5 通路 + 1 对照面）：① 主聊天（OpenAI 兼容）`core.mjs`（参照面）· ② responses（`responses.mjs` 三处 fetch 改引用提升后的单个 `const headers`）· ③ anthropic（`anthropic.mjs` 既有 `const headers` 首行加展开）· ④ google（`google.mjs` 内联展开）· ⑤ 会话标题生成（`generate-title.mjs` `opts.headers` 内联展开）· ⑥ 模型清单拉取 `list-models.mjs`（对照面——零改）。
- **域外与端面**：会话动态头（`x-opencode-session` 类）不做（证据未立）；embedding 独立渠道无定制头字段；**VS Code 端无 `providers[].headers` 概念**（配置面与展开面均无——对位引入属新需求）。
- **已知边界**：大小写变体同名定制头交给 fetch 归并（不做大小写归一）；未经装载面净化而直达 `chat()` 的定制 `Authorization` 在 anthropic 通路（无内置 `Authorization`）原样透传——不在本项加第二道防线。**open 项：无**。

### 6.18 图片输入与贴图降级链（VSC 端 · 终收批并入）

> **来源** = `thincoder-vscode/docs/design/PROVIDER.md` §8 + `thincoder-vscode/docs/design/IMAGE-DOWNGRADE-VISION.md`（§8B #7 / #4——终收批并入）；本档 §6.1–§6.17 原无图片 / 贴图面（实核插节）。

**图片输入链（VSC）**：粘贴 / 拖拽 / 附加按钮 → webview 传 dataURL → `thincoder-vscode/src/extension/panel-messages.mjs` `routeUserTurn`（`:59`）内
`savePastedImages`（`:82`）落盘 `<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`（`src/extension/image-handler.mjs`；raster png / jpg / gif / webp 白名单 + >15MB 跳过）→
`thincoder-vscode/src/agent/setup-reminders.mjs:216` `appendImagePointer` 给真实 user 消息追加 `[Attached images: …] — use the read_image tool to view them before answering.`（**非多模态模型直接 throw**——可见错误不静默丢）→
模型调 `read_image` 带图进载荷。历史内容保持字符串（不回放 images）；文件随 offload 写时自清理。

**贴图降级链（非视觉模型自动降级）**：非视觉模型贴图不再硬报错——自动降级为视觉模型子代理读图、文本描述注入主会话——用户无感换模型（VSC 主；CLI 镜像软引导）。触发点 = `routeUserTurn`（savePastedImages 后、主回合 LLM 请求前）：
非视觉模型（`specForModel(provider.model).multimodal` 假）+ images 非空 + depth-0 → ① 视觉渠道查找（`thincoder-vscode/src/extension/vision-channel.mjs`——resolveProviders 扫 multimodal；判据与 appendImagePointer / read_image 注册门同源 = MODEL_SPECS multimodal）
② extension 内直跑一次性视觉子代理读图（`runVisionReader`——`image-handler.mjs:65`，复用 runAgent / runChild 换渠道模式；**超时 60s**（`VISION_READ_TIMEOUT_MS` `:64`）；seam = `visionReader ?? runVisionReader` 参数注入 `panel-messages.mjs:92`）
③ 描述注入：text 改 `[图片 <路径> 描述: <视觉子代理描述>]`、images 清空（appendImagePointer throw 路径不达）④ fallback：
无视觉渠道 / spawn 失败 / 超时 / 空返回 → 保留现可读报错（不静默丢图）。

**降级窗 Stop 契约（A12③ 修复）**：窗内 await 期间 ⏹ 必须有效（原两路皆静默无效：僵尸 controller 交付无效 / 闩被无条件清）。契约 =
① 窗前建 `AbortController` 挂 `panel._visionAbort`（`:90` · `finally` 幂等清理 `:93`）② 取消缝——`runVisionReader({ …, signal })` 内 `signal?.addEventListener("abort", () => ac.abort(), { once: true })` 桥接内部超时 controller（既有 catch → `null` 语义复用——零新返回形态）
③ abort 定向——面板 abort case 的 running 分支**优先**判 `panel._visionAbort`（`:236-237` → `abort()` 后跳出，不再落僵尸交付路径）
④ 停后语义 = **启动即中止**——
await 快速返 `null` → 照常 `_chat`（用户消息入 history——at-most-half-a-turn）→ `_chat` 调用后置 `panel._abortRequested = true`（`:104`）——`newTurnController`（`panel-chat.mjs:59-60` / `:129`）消费 → 回合建立即 abort ⑤ **零新增布尔状态**（stopped 判定 = `signal.aborted`；唯一新字段 = `panel._visionAbort`——窗生命周期）⑥ 边界：
Ctrl+I（interrupt）面与视觉模型 / 无图路径零动；`maxTurns` 不改。

**关键决策与边界**：① **返回形态 = 文本描述替换 images**（与现机制完全兼容——无图污染；否决去图投喂主模型——非视觉模型无图路径）② **引擎级新 spawn 通道不建**（勘察确认不存在——降级 = extension 内 runAgent 一次性直跑，不走 agent-tools 池）③ CLI 镜像 = 软引导（read_image 工具错误文案追加「可 spawn 视觉模型子代理读图」；硬自动 CLI 不做）④ UI 前置（模型下拉 vision 标记）= UX 增强**移出本批**（后批）⑤ 边界：
视觉模型路径零动 · 非 raster（svg / heic）现 toast 不变 · **depth>0 子代理回合非视觉贴图沿用现报错（不降级）** · retry 不回带 images（另行登记）⑥ `maxTurns` 固定 10——大贴图 / 多图可能超限落 fallback——**观察登记不改**（按图数伸缩候选在 TODO 在案）。

### 6.19 VS Code 端接线（面板 / 预设 / 配置存储 / transport 端差 · 终收批并入）

> **来源** = `thincoder-vscode/docs/design/PROVIDER.md`（§8B #7——终收批并入）；机制正文（chat 主流程 / 重试超时 / SSE / 续写 / 闸门 / 净化 / 规格表 / 预设 / enable_thinking / Responses / providerSpec / 模型清单 / 请求头装配）已住 §6.1–§6.17——本节只收 **VSC 端接线与端差**（同一事实不重述，D2）；坐标 = as-of 2026-09-15 实核。

**配置存储端差**（`thincoder-vscode/src/config-io.mjs`）：与 CLI 共享 `~/.thincoder/config.json`（`resolveProviders` `:167`）——差异点 = ① `resolveKey` **只读 config.json `entry.apiKey`**（env 不是密钥源——与 CLI env 回退语义不同）；空 → provider 不可用（`providerFromConfig` 返回 null；模型选择走 onboarding）
② 代理 = provider 级 `proxy: true` **且** 全局 `proxy.model === true`（`injectProxy` 语义）→ 请求经代理（单键不生效）
③ **并发写防冲突（F5b）**：`loadRaw` 记 mtimeMs + size 基线、`saveRaw` 写前重 stat 不符 → 放弃 `{reason: "mtime-conflict"}` + `.bak-{ts}` 轮转（副本不自动合并）+ `CONFIG_CONFLICT_HINT` 提示重试 ④ 旧版迁移：
VS Code settings 的 `thincoder.providers` + SecretStorage 一次性迁入 config.json（`thincoder-vscode/src/config-migrate.mjs` `migrateCore`——不覆盖已有 apiKey、preset 名自动重建）后清 legacy 存储；嵌入 key 一并迁移 ⑤ `resolveDefaultModel`（`thincoder-vscode/src/config-io.mjs:213`）回退链 =
① defaultModel 复合属本渠道 ② 渠道单值 `entry.model` ③ `null`——**不再静默回退 `models[0]`**（§6.16 M7 同源 · VSC 独立实现）；v2 迁移 `delete p.models` / `p.model` 单值恢复。

**Preset 预设表（核单源 · 2026-09-20 实读取一侧）**：`PROVIDER_PRESETS` 表 = **核单源**（`thincoder-core/config-presets.mjs`），
VSC 侧取一侧复用（`thincoder-vscode/src/extension/presets.mjs:9` 注 + `:21` re-export；端壳无镜像文件）——**21 preset**（deepseek / kimi / kimi-code /
glm / glm-code / qwen / qwenplan / mimo / mimoplan / minimax / openai / claude / gemini / grok / mistral / volcengine / hunyuan / siliconflow /
openrouter / groq / **tokenhub**）；
claude / gemini 携 `format: "anthropic" / "google"`；minimax 携 `chatPath: "/text/chatcompletion_v2"`；`presetToEntry`（核单源 = `thincoder-core/config-presets.mjs:41`）剥离 `desc` 余下发成 provider 条目
（单值默认模型——§6.11 同源）；2026-09-11 `deepseek` 预设默认模型 → `deepseek-flash`（§6.11 同源）。

**模型选择 UI（面板接线）**：主下拉列 provider 行（名 + 当前模型 + `›`）+ hover flyout 子菜单（webview 无键盘导航）；选中 = 写当前会话槽；设置面板「默认模型」项 = provider →
运行期拉取候选两级（写 `raw.defaultModel`）。Add / Remove / Key 流 = `thincoder-vscode/src/extension/provider-flows.mjs`（`addProviderFlow` `:106`——QuickPick preset 过滤已添加或 Custom 手输 name / baseURL / model + format → `addProviderEntry` → 问 key → `setProviderKey`）；
`settings.mjs` `fullStatus`（`:308`）单源拉取
（逐已配置渠道各探一次——探通 → 候选行直接可选；探不通 → 不可选 + 失败消息随载荷）。**M9 准入探针（配置阶段）** = 收敛于核 `@thincoder/core/provider/list-models.mjs`（W10 已迁核——同名镜像已删；消费面 = `thincoder-vscode/src/extension/{provider-flows,settings,settings-panel-write}.mjs` 经核面引用）
（探针形状由 `thincoder-vscode/src/config-io.mjs:230` `probeTargetFromEntry` 组装——端侧缝保留）；探通 / 探不通两态 + **不阻断保存**；`defaultModel` 写面探针 fire-and-forget（写面为同步契约——探针绝不 reject）；**运行期零探测**（启动 / 发请求 / 面板打开不做 `/models` 探测）。候选未命中 = 保持当前选择显示与状态
（回落会话槽复合）+ 零 `selectModel` / `selectReasoning` post（§6.16 M10 语义同源 · 独立实现）。
**探针落账与有界重试（2026-09-18 · F-W19）**：端侧详面 = `docs/vsc/design/SETTINGS.md` §2.12（采样器 / 重试窗口 / 展示面分档 / 机检面）；核语义 = §6.16 M8/M9 补行（载荷与分类）——双向指，**不重述**。

**transport 端差**（W10 已迁核——自持镜像已删）：VSC 经 `@thincoder/core/provider/core.mjs` 引用（原 `thincoder-vscode/src/provider.mjs` chat / `TRANSPORTS` 面已删）——调用链 = 核单实现（§6.2 不重述）；下列原 VSC 端差登记随迁核退役： （迁移期引文）
① **超时相位**（原登记：四 transport 读侧 idle 全配 / 本端无 `fetchTimeoutMs` 配置键）——现体 = 核 §6.3 超时制度（sse / google 读侧 idle + `effectiveFetchTimeoutMs`）；
VSC 调用面已无相位传参点（W10 已迁核）——相位参数由核 chat 装配（核 `thincoder-core/provider/core.mjs:414-415` 实核）；端侧用例 `provider-timeout-semantics` 锁该跨端契约（相位参数在位）；
② **Responses 实现差异注**（链元数据 / usage 归一 / `responseId` / `builtinToolResults`）——现体 = 核 §6.13（核面已承载同列语义）；
本地接线不变 = responses provider 经 config.json 手写 `format: "responses"` 或预设扩展启用（custom 表单 format 下拉未加 responses 项——显式 opt-in，CLI parity）；
finishReason 区分（`response.incomplete` 非长度原因不得报成 `length`）**保留为端侧验收面**。

**能力适配端差**（语义同源不重并——坐标即指）：`specForModel` / `providerSpec` / `resolveEnableThinking` / `isBailianHost`（`thincoder-vscode/src/config.mjs:106 / :142 / :183 / :166`——W16 面）·
reasoning 档位落 patch（`src/extension/reasoning-mode.mjs`——`"off"` → `thinking: null` + `reasoningEffort: null` 真 off）· escape v5 与 UTF-16 安全截断（核 `escape.mjs` + 端 `src/agent/run-helpers.mjs` `safeSliceUTF16`——§6.7 同构）·
畸形 tool_calls 防御（W10 已迁核——现体 = 核 `provider/sse.mjs`；§6.10 同构）· 前缀剥离与 `DEFAULT_SPEC` 兜底（§6.9 同构）；
规格表每行多 `reasoningEffortDefault`（§6.9 已登记端差）。**`provider.headers`：VS Code 端无 `providers[].headers` 概念**（§6.17 域外与端面已登记——对位引入属新需求）。

**LLM 标题生成**（`thincoder-vscode/src/extension/generate-title.mjs:13`；`panel-chat.mjs:334` 触发）：会话第一条 user 消息后 agent 完成回复——取首条文本（多模态 part 数组取 text）→ 用该 provider 发简短 prompt（"Generate a concise title (max 40 chars…)"），**非流式** + `max_tokens: 100` + **逐 format 禁 thinking**
（openai `thinking:{type: "disabled"}` / anthropic 同 / google `thinkingConfig: {thinkingLevel: "none"}`——`:57`——否则 reasoning_content 吃光输出预算内容空 IK9UZ8）。失败静默降级返回 null（首条消息截断作标题兜底）；10s 超时；标题 trim 截 40 字符。headers 展开消费点已列 §6.17（⑤ 会话标题生成）。

### 6.20 onWait 相位 → 状态文案（核内单源映射 · 2026-09-16 批 1）

**问题（实核）**：`onWait` 载荷的**相位值域**只在发射侧收敛（五相），消费侧各自枚举 ⇒ 未列相位落兜底分支，渲染 `undefined`：

| 消费点 | 现状（相位分支） | 缺支后果 |
|---|---|---|
| CLI TUI 状态行 `thincoder-cli/src/tui/tool-events.mjs:406-411` | `gate` / `overloaded` / `else` | `else` 读 `seconds`（`:409`）⇒ `Rate-limited 429, retry in undefineds`；`warn` / `quota` 均被误标 429 |
| CLI headless `thincoder-cli/bin/thincoder.mjs:189-191` | `gate` / `else` 两支 | `retry in undefineds`（`overloaded` 同样被误标 `Rate-limited 429`） |
| ACP 日志 `thincoder-cli/src/acp/bridge.mjs:196` | 无相位分支（原样 log） | 无渲染契约（不产生 `undefined`，但相位语义随载荷） |

**触发可达性**：`warn` 发射点 = `thincoder-core/provider/rate.mjs:96` / `:110`——**`estimated > tpm`（或 `effectiveTpm`）即发**（配了 `tpm` 且单请求估算超预算）⇒ 两消费点的 `undefined` 文案在真实使用中可达。
`quota` 相：值域与渲染契约已由核 i18n（`thincoder-core/i18n.mjs:44`）与 VSC 映射面（下文）双面声明，**发射点已定位** = `thincoder-core/provider/retry.mjs:60`（`:68` 同 onWait 家族——`retry` 相；评审 #5 收口——原「未定位」登记随撤）。

**映射表（单源实现 = `thincoder-core/provider/wait-status.mjs`，本批新增）**：

| 相位 | 载荷字段 | `kind` | 文案（= `thincoder-core/i18n.mjs` 键，逐字） | 消费端 |
|---|---|---|---|---|
| `gate` | `seconds` | `rateWait` | `status.rateWait`：`TPM throttle wait ~${s}s` | 显示 |
| `retry` | `seconds` | `rateLimited` | `status.rateLimited`：`Rate-limited 429, retry in ${s}s` | 显示 |
| `overloaded` | `seconds` | `overloaded` | `status.overloaded`：`Server overloaded, retrying in ${s}s` | 显示 |
| `quota` | `message` | `quota` | `status.quota`：`quota exhausted: ${msg}` | 显示（`message` 剥发射前缀后经模板插值——`retry.mjs:60` 前缀不双前缀） |
| `warn` | `message` | — | — | **不显示**（前置告警——与 VSC 面 `statusTextPayload` 同判据） |
| 未知相位 / 秒缺失 | — | — | — | **不显示**（不虚构数值、不落兜底误标） |

- **`kind` 词表与 i18n 键**：`kind` = `rateWait` / `rateLimited` / `overloaded` / `quota`——**与 VSC 面 `statusTextPayload` 的 kind 同名**（两端同一词表）；渲染 = `t("status." + kind, { s, msg }, locale)`（`t` = `thincoder-core/i18n.mjs:83`——同表同占位符，**核内零第二套字面**）。
- **API**：`waitStatusOf(ev) → { kind, seconds?, message? } | null`（纯映射）· `waitStatusText(ev, locale?) → string | null`（`null` = 不显示）；`quota` 相剥发射前缀（`retry.mjs:60` `quota exhausted: `——首现即剥，一次）后插值。
- **消费点收敛**：三处相位枚举 / 兜底分支退役 → `const s = waitStatusText(ev); if (s) …`（TUI 状态行 / headless stderr `[rate-limit]` 前缀 / ACP stderr 日志）。
- **VSC 面（多实现面）**：`thincoder-vscode/src/extension/panel-callbacks.mjs:195-202` `statusTextPayload()` 五相已完备（`warn` / 未知 → `null` = 不发射；用例 `thincoder-vscode/test/status-line.test.mjs:62-70`）——**语义同源、各面独立实现**（不以任一面产物回改另一面）。
- **复现与判据（本批测试层 · 需求档 F-PV1）**：
  ① 单测直驱三消费点回调：`{ phase: "warn", message: "estimated 5000 tokens > tpm 1000 — request proceeds and may hit a server 429" }` ⇒ TUI 状态行 / headless stderr **不出现** `undefined`（现态必现）；
  ② `{ phase: "quota", message: "quota exhausted: x" }` ⇒ 显示 `quota exhausted: x`（**不双前缀**——剥前缀后插值）；`{ phase: "quota", message: "x" }` ⇒ 显示 `quota exhausted: x`；
  ③ `{ phase: "overloaded", seconds: 3 }` ⇒ 显示 `Server overloaded, retrying in 3s`（**不得**落 429 文案）；
  ④ 未知相位（`{ phase: "zzz" }`）/ 秒缺失（`{ phase: "retry" }`）⇒ 不显示（旧文案不得残留）；
  ⑤ 单源不变量：逐相 `waitStatusText(ev)` 与 `t("status." + kind, …)` deepEqual。

> 本批受影响文件（当前行数 / 增量）= 批次档 `docs/batches/2026-09-15-core-defect-fixes.md` §四；验收 = 同档 §五 V5 / V6。


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
| D-PR25 | qwen-plan 渠道名 `deepseek-v4.1-flash` **加行对齐** `deepseek-flash`（不引入查表机制改造） | 实证 = GET /models 含该名 · chat 200（2026-09-15）；前缀不相交（第 12 位 `.` 与 `-` 互不为前缀）⇒ 互不 shadow：新行全名命中新行、`deepseek-v4-flash`(-0731) 仍命中退役行——单一 prefix 表零机制变更；排序交由既有 SORTED_SPECS 长度降序（与本批无关）；否决：别名 / namespace 归一 / 后缀剥离改造（0731 前缀命中实证说明纯前缀足够——与 D-PR19「不引入运行期机制」同源） |
| D-PR26 | 贴图降级返回形态 = **文本描述替换 images**（不动主模型载荷） | 与现机制完全兼容（无图污染）；否决去图投喂 / 多模型双发 |
| D-PR27 | 降级窗 Stop = **启动即中止**（零新增布尔状态） | Stop 在窗内必须有效；stopped 判定 = signal.aborted；唯一新字段 = panel._visionAbort（窗生命周期） |
| D-PR28 | onWait 相位 → 状态文案 = **核内单源映射**（`provider/wait-status.mjs`；`kind` 词表与 VSC 面同名，渲染走 `t("status.*")`） | 相位值域在发射侧收敛而消费侧各自枚举 ⇒ 缺支落兜底：TUI `tool-events.mjs:409` / headless `bin/thincoder.mjs:189-191` 的兜底分支读 `seconds`，而 `warn`（`rate.mjs:96,110`——`estimated > tpm` 即发）与 `quota` **无 `seconds`** ⇒ 渲染 `retry in undefineds` 且 `warn` 被误标 429。否决「三处各自补两三支」（漂移根因不除——下一次新增相位再漏）；否决「CLI 侧新建 i18n 层」（新范围——核 i18n `status.*` 四键已在位） |
| D-PR29 | 准入探针失败 = **落账分类**（`failure ∈ {timeout, malformed, hostBusy}` + `ts`），**渠道文案**（`channelUnavailableMessage`）零改 | 「探不通」单态无法区分渠道故障 vs 宿主繁忙——分类是重试闸的判据来源；**零改面 = `channelUnavailableMessage` 本体**（逐字不动 ⇒ 该文案面 UI 契约零变）；**展示面其余 = 状态词级分档**（`不可用` ⇔ timeout / malformed · `宿主繁忙` ⇔ hostBusy + 抑制渠道 hint）——端侧详面 = `docs/vsc/design/SETTINGS.md` §2.12（本档不重述）。否决「按 timeout / malformed 各发一条新文案」（新文案 = 新 UI 契约） |
| D-PR30 | 重试驱动力 = **采样器闸**（窗口内单批 ≤ 2 次 + 在飞去重；loop 忙时不重试），非 UI 事件 | 探针不得由前台动作隐式触发（运行期零探测纪律）；获焦重探无消息面（`webview` 无 focus 上报）⇒ 引入 = 新事件依赖。否决「获焦重探」/「无界重试」 |

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
| §0 / §18 / §22（需求层同档承载） | R1–R20 / N1–N9 需求条目 | **现住本层需求档** `docs/core/requirements/PROVIDER.md`（B 轮已并入——单板块一档：设计住本档、需求住需求档） |
| §16.5 / §19.4 / §23.4 受影响文件全清单（双端逐档行数） | 逐档行数与增量 | **一次性批次材料**（文档分层纪律）——批次档承载 |
| §17 / §20 / §24 用例表 + AC 表 | 测试用例与验收清单 | **一次性批次材料**——测试资产归测试层，验收勾销归批次档 |
| §16.9 / §19.6 / §23.6 对账表 + 勘察补充发现 | 逐批对账与勘察清单 | **一次性批次材料** |
| §16.7 / §19.7 / §23.7 UI 决策表 | 逐批 UI / 交互决策与 open 项 | 结论已提炼入 §6.16 / §6.17（逐批表为批次语境；open 项均为「无」） |
| §10 / §16.3 / §6.16 的 VSC 对位实现细节（webview / settings 面板逐档） | VSC 侧独立实现 | 属 VSC 产品树（`thincoder-vscode/src/**`）；单仓单档纪律 = 各产品级实现留各产品树 |
| §21.2 通路表的 as-of 行号坐标 | 逐通路调用点行号 | 契约（装配顺序 / 通路集合）已入 §6.17；行号为时点坐标 |
| `IMAGE-DOWNGRADE-VISION.md` + `PROVIDER.md`（VSC 档）的受影响文件表 / 用例表 / AC 表 / 状态行 / 变更记录 | 一次性批次材料 | 机制与契约已入 §6.18 / §6.19；测试资产归测试层（`thincoder-vscode/test/image-downgrade.test.mjs` 现体）；验收勾销归批次档；旧档 = 参照历史 |
| `IMAGE-DOWNGRADE-VISION.md` 的群 A 批（A12）契约 / 用例施工形态字面编号块 | 批次施工骨架 | 契约语义已提炼入 §6.18（降级窗 Stop 契约）；字面编号块属一次性施工形态 |

## 变更记录

- 2026-09-13：建档——自 `docs/core/design/CORE-UNIFICATION.md` 拆出（§2.5 #114 / #115 / #138–#143 · §2.5.1 A19 / A20 · §2.12.2 第 8 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（markdown 面小收正轮）：§1 归属表与 §2.4 #138 行的 `index.mjs` 补路径前缀（`thincoder-core/provider/index.mjs`——与 `thincoder-vscode/src/tools/index.mjs` / `thincoder-cli/src/tui/index.mjs` 同名不同物；**消除歧义不改判据**）。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §6 **机制面**（模块地图 / chat 主流程 / 重试超时错误分类 / SSE / 续写 / 闸门 / 净化 / 原生 transport / 规格表 / 畸形 tool_calls / 预设 / enable_thinking / Responses / 续写 400 根治 / providerSpec / 模型清单 provider 化 / 请求头装配）· §7 **关键决策记录（D-PR1–24）** · §8 **不并项与历史沿革** ·
来源 = `thincoder-cli/docs/design/PROVIDER.md`（**旧档一字未改**——原地作参照历史）；产品需求条目 R1–R20 / N1–N9 归本层需求档 `docs/core/requirements/PROVIDER.md`；首部加机制面指针一行。
- 2026-09-15（**qwen-plan 渠道名接入批** · eng-designer）：§6.11 行集补 `deepseek-v4.1-flash`（qwen-plan 渠道名 · 字段逐字对齐 `deepseek-flash`）· §7 补 **D-PR25**；本批源码 / 测试面见批次档 `batches/2026-09-15-DEEPSEEK-QWENPLAN.md`。
- 2026-09-15（**评审修正轮** · eng-designer）：§7 D-PR25 论证口径改「前缀不相交（第 12 位 `.` 与 `-` 互不为前缀）」——长度排序既不充分也无必要（字典序下退役行反在前），排序交由既有 SORTED_SPECS 长度降序（与本批无关）。
- 2026-09-15（**§8B #4 / #7 终收批** · eng-designer）：新增 §6.18 **图片输入与贴图降级链**（#4 IMAGE-DOWNGRADE-VISION + #7 PROVIDER §8 合成）+ §6.19 **VS Code 端接线**（配置存储端差 / 预设镜像 / 面板接线 / transport 端差 / 能力适配坐标 / 标题生成——#7 其余面）；§7 补 D-PR26 / D-PR27；§8.2 登记两行；
来源 = `thincoder-vscode/docs/design/{PROVIDER,IMAGE-DOWNGRADE-VISION}.md`（一字未改——参照历史）。
- 2026-09-15（**S2 W10 · VSC provider 接线批** · eng-coder）：§1 归属表 VSC 列改述（「经 `@thincoder/core/...` 引用」——自持镜像已删）；§6.19 transport 端差 / M9 探针 / 能力适配坐标收正（迁核退役登记；机制条文零改）。
  VSC 侧删除集、改指面与测试面（含 `provider-timeout-semantics` 改判）见批次档 `batches/2026-09-15-vsc-core-wiring.md` §5。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES · eng-designer**）：§6.6 补**五相值域**行 · §6.20 新增 **onWait 状态文案映射单源**块（映射表 / API / 复现判据 ①–⑤）+ **D-PR28**；体量读数 363 → 402。
- 2026-09-18（**init-block 批 · eng-designer**——承 `docs/batches/2026-09-18-init-block.md` §1）：§6.16 补 **M8/M9 补**行（探针落账分类 + `hostBusy` 闸 + 窗口内 ≤2 次有界重试 · 文案零改）· §6.19 补探针落账指针 · §7 补 **D-PR29 / D-PR30**。
- 2026-09-18（**init-block 批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-18-init-block.md` §3 发现 9）：
  §6.16 M8/M9 补行按「核语义 / 端驱动」切分——留**载荷 + 分类（`hostBusy` = 非渠道故障）+ 运行期零探测零改 + 文案零改**；采样器判据形态 / 重试窗口与计数 / 在飞去重 / 获焦重探被拒**移出**（端侧详面指针 → `docs/vsc/design/SETTINGS.md` §2.12）；
  §6.19 探针行收**纯指针**（双向指，不重述）。**零新语义**（切分 = 评审发现的直接导出项）。
- 2026-09-18（**init-block 批 · 设计评审轮 2 修正** · eng-designer——fix 轮 2；承 `docs/batches/2026-09-18-init-block.md` §3 轮次 2 发现 2）：
  §8 **D-PR29** 零改面限定为 `channelUnavailableMessage` 本体（「UI 契约零变」不再作全局结论）+ 补端侧展示面指针（状态词级分档 → `docs/vsc/design/SETTINGS.md` §2.12）；§6.16 M8/M9 补行零改。**零新语义**（= 评审发现的直接导出项）。
- 2026-09-20（**qwen flash 规格批 · eng-designer**，承 `docs/batches/2026-09-20-qwen-flash-specs.md`）：§6.9 两改——「退役 / 路由名」判据收口为**按服务端状态判**
  （原「保留为独立行」与本批 §1.6 删行裁定的张力显式化）+ 新登「qwen 族无泛前缀托底行」与音/视频未接入事实；§6.12 两处——`/think on` 默认档**契约**收口为首个非 `"none"` 档
  （原枚举首项对 qwen 族等于 off；**实现待落**，本批交付项）+ 登记「`enable_thinking` 与 spec 枚举两机制并存、不新增 `thinkToggleApi`」。规格数值不入本档（真源 = MODEL-SPECS.md）。
- 2026-09-20（**渠道接入批 · eng-designer**，承 `docs/batches/2026-09-20-channel-onboarding.md`）：§6.11 预设计数 20 → **21**
  （D3 计数与清单同变）+ 新登 `tokenhub` 预置（腾讯 TokenHub 聚合网关 · 默认模型 `hy3` · 思考/`maxTokens` 字段**不设 = 不发**）
  与 `volcengine` 默认模型改值（方舟豆包 Seed 编程专档，实测在册）。既有 `hunyuan`（另一主机）未实测 ⇒ 不动。
- 2026-09-20（**渠道接入批 · 设计评审轮 1 修正** · eng-designer——fix 轮；承 `docs/batches/2026-09-20-channel-onboarding.md` §3 轮次 1）：
  §6.19 预设段来源命题**收正**（实读盘上无 `thincoder-vscode/src/config-presets.mjs`）——改指核单源 `thincoder-core/config-presets.mjs`
  + VSC 取一侧（`thincoder-vscode/src/extension/presets.mjs:9`/`:21`），计数 20 → **21**（+ `tokenhub`）；§6.12 新登 **effort 族 off 补发**
  （D-14 / AC-9）谓词单源 + 零变面五 guard；§6.2 载荷组装枚举补该支指针。规格数值不入本档（真源 = MODEL-SPECS.md）。
  **零新语义**（D-14 系批档 §1.7-① 已批项；余 = 评审发现的直接导出项）。
  行集与逐字段取值真源 = `doc:MODEL-SPECS.md:§9`，本档只承载渠道/预设面（D2 不重述数值）。
- 2026-09-20（**卫生族批 · 台账 #138 · eng-designer**）：首部机制面节区改 `§6–§8` + 历史节号指称清理（行数规则废除批残留）；设计源 = `docs/batches/2026-09-20-hygiene-sweep-batch.md` §2。
