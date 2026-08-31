# Provider 层设计（thincoder/src/provider/）

> 状态：2026-08 回补。LLM 调用层：OpenAI 兼容协议为主 + Anthropic/Gemini 原生 transport，SSE 流式、重试/退避、TPM/RPM 闸门、截断续写、流规则、发送前载荷净化。
> 规格表（MODEL_SPECS）是能力中枢：上下文窗口、maxOutput、thinking API、reasoningEcho、tempRange、partialMode/prefixMode 等全部模型差异在此声明（见 `src/config.mjs`）。

## 1. 模块地图

| 文件 | 职责 |
|---|---|
| `index.mjs` | re-export：`chat` / `listModels` / `estimateText` 等 |
| `core.mjs` | chat 入口（transport 分派）、requestWithRetry、载荷净化（stripImages/normalizeToolPairing）、流规则编译、Kimi 401 平台提示 |
| `sse.mjs` | readSSE：OpenAI 格式 SSE 解析、增量 tool_calls 拼装、流规则触发、中断 |
| `rate.mjs` | TPM/RPM 滑动窗口闸门、token 估算、重试常量 |
| `anthropic.mjs` | Claude 原生 transport（/v1/messages + 事件流） |
| `google.mjs` | Gemini 原生 transport（generateContent streamGenerateContent + 事件流） |

## 2. chat() 流程（core.mjs）

```
chat(provider, { messages, tools, onToken, onReasoning, onWait, signal, streamRules, firedPatterns })
  1. format === "anthropic" → anthropicChat（跳过本流程）
     format === "google"   → geminiChat
  2. spec = specForModel(provider.model)
  3. body 组装：model / messages（含 reasoning_effort、thinking 参数按 spec.thinkApi 注入）/
     tools（OpenAI schema）/ temperature 按 spec.tempRange 钳位 / max_tokens 按 spec.maxOutput
  4. estimateRequestTokens(body) → rateGate（TPM/RPM 预算内睡眠等待）
  5. requestWithRetry → readSSE 流式解析
  6. 结果后处理：
     - finishReason === "length" && spec.partialMode → 截断续写（同一次响应内，content 续写；见 §5）
     - finishReason === "length" && spec.prefixMode → /beta prefix 续写（DeepSeek，附上次 usage 累计）
     - 非视觉模型发送前 stripImagesForTextModel（防 image_url 会话毒化）
     - 发送前 normalizeToolPairing（tool 消息重排/孤儿清理/缺失结果占位）
  7. 返回 { content, reasoning, toolCalls, usage, finishReason, _warnings?, interrupted?, droppedToolCalls? }
```

**transport 分派**：`TRANSPORTS` 表（anthropic/google/openai）——`provider.format` 决定协议；openai 是默认（body 组装在 core 内联）。

## 3. 重试与错误（requestWithRetry）

- **最多 3 次重试**（`MAX_RETRIES`）；429 尊重 `Retry-After` 头，无头则 15s/30s/60s 退避（`RATE_LIMIT_BACKOFF_MS`）；5xx/408/409/425 指数退避（2^n s）。
- **不重试**（`isNonRetryableError`）：401/403 认证、400 级非 429、429 但 body 含余额/配额特征（中文"余额不足/充值"、`insufficient_quota`、GLM 1113/1114 等）。
- **Kimi 401 平台提示**（IK5VGJ）：`sk-kimi-` 前缀 key 或 `api.kimi.com` 端点遇 401 → 错误消息追加"Moonshot vs Kimi For Coding 双平台 key 不通用"说明。
- 全部重试耗尽：按 lastStatus 分类报错（Rate limit not resolved / Server error persisted / Request failed / Network error）。
- 请求超时 600s（`FETCH_TIMEOUT_MS`），AbortError 透传（用户 Ctrl+I 取消）。

## 4. SSE 流式（sse.mjs readSSE）

- TextDecoder 分块解码，`\n\n` 分帧；`data: [DONE]` 结束。
- delta 累加：`content` / `reasoning_content`（thinking 流，转发 onReasoning）/ `tool_calls`（按 index 增量拼装 id/name/arguments）。
- **usage 帧**：`choices: []` 的 data 帧捕获 `usage`（prompt_tokens/completion_tokens/prompt_cache_hit/miss_tokens）→ 供状态栏展示与压缩实测基线（见 CONTEXT-COMPACTION.md D3）。
- **中断**：signal abort → 抛 AbortError；上层（agent.mjs）区分"用户中断注入"（`signal.reason.interrupt`）与普通取消。
- **流规则**（streamRules，`compileStreamRules` 编译）：SSE 过程中对已生成文本做正则匹配——action `abort` 立即中断并标记 `ruleTriggered`（agent 循环注入规则消息后重试）；`warn` 不中断，收集 `_warnings` 在回合后注入提醒；`repeat: "once"` 用 firedPatterns 跨调用去重（每次用户消息重置）。

## 5. 截断续写（两协议，按 spec 声明）

| 协议 | spec 字段 | 机制 | 适用 |
|---|---|---|---|
| **prefix** | `prefixMode: true` | finishReason=length → `/beta` 端点续写（`betaBaseURL`），请求体附 `prefix: true` + 上次 usage（DeepSeek 前缀计费）；reasoningEcho=required 时回传 reasoning_content | DeepSeek 系列 |
| **partial** | `partialMode: true` | 同一次响应内直接续写：`MAX_CONTINUATIONS=3` 次追加请求（不回传全文，只发新问题）；usage 跨续写累计 | Kimi / Qwen / MiniMax |

两者都会注入提醒（"[System reminder: output token limit reached…]"）让模型知道输出被截断过；GLM 的 `reasoningEcho: "optional"` 表示历史 reasoning 默认清除（clear_thinking）。

## 6. TPM/RPM 闸门（rate.mjs）

- provider 配置 `tpm`/`rpm` 后启用：**发送前**记账（60s 滑动窗口，`estimateRequestTokens` 估算），超预算 `sleep` 到窗口腾出空间（onWait 通知 UI "TPM throttle wait ~Ns"）；未配置则闸门关闭（429 退避仍生效）。
- `recordRate(provider, estimated, usage)` 在响应后以**实测 usage** 修正记账。
- 单请求估算已超预算时不卡死（放行，交给重试层）。
- 窗口按 `baseURL`（去 /beta 后缀）键控——同一端点共享预算；`_rateHooks` 可注入（测试用假时钟）。

## 7. 发送前载荷净化（纵深防御）

- **`stripImagesForTextModel(messages, spec)`**：非视觉模型发送前把残留 `image_url` 替换为文本占位符——防"视觉模型会话切到文本 provider 恢复"的存量毒化；历史本身不改，切回视觉模型图片即恢复。
- **`normalizeToolPairing(messages)`**：严格 provider（DeepSeek）要求 tool 消息紧跟其 owner assistant——历史可能合法地违反（并行多模态注入、压缩切割、中断残留）→ 发送前：tool 消息重排到 owner 之后、孤儿 tool 丢弃、缺失结果合成 `[Tool result missing: …]` 占位。与 CLI/VS Code 压缩的配对保护（见 CONTEXT-COMPACTION.md D5）同语义，一个管源头一个管兜底。

## 8. 原生 transport

- **Anthropic**（`format: "anthropic"`）：POST `/v1/messages`，`anthropic-version: 2023-06-01`；system 消息抽离；tool 用 `tool_use`/`tool_result` block；事件流解析（content_block_start/delta/stop + message_delta 的 usage）。
- **Gemini**（`format: "google"`）：`generateContent` + `streamGenerateContent?alt=sse`；role 映射（assistant→model）；图像 data URL → inlineData（base64 + mime）；usage 从 `usageMetadata` 取（`noUsageStream` 模型无流式 usage）。

## 9. 关键设计决策

| 决策 | 理由 |
|---|---|
| 规格表驱动一切能力差异 | 新模型只加一行 spec，transport/续写/thinking 全自动适配；未知模型保守 128K + 警告（IK5VGJ） |
| 实测 usage 优先于估算 | 估算对 CJK 低估 3-4x；实测值锚定压缩判定（D3）与 TPM 记账 |
| 发送前净化而非改历史 | 历史是模型上下文真相，净化只作用于线上载荷，可逆 |
| 429 双通道（闸门+退避） | 闸门防患于未然（省一次失败往返），退避兜底（未配置预算也安全） |
| 流规则 abort 后重试 | 内容合规是硬需求——中断注入提醒让模型自行修正，比事后清洗更可靠 |

## 10. Issue 变更段（2026-08-22）

> 来源：GitHub thincoder#2（扩展端发起，CLI 端 parity 同修）。本文件为 CLI 侧权威源；扩展端设计见 `thincoder-vscode/docs/design/ARCHITECTURE.md` 变更段（不复制）。

### GitHub thincoder#2 · 畸形 tool_calls 防御解析（readSSE）

**总体需求**：OpenAI 兼容 SSE 流中畸形 `tool_calls`（数组含 null 元素、缺 `function`/`name`/`id`/`index`）不再导致 CLI 崩溃或静默丢工具；防御性解析 + 可读告警。现状：`sse.mjs` 两处解析循环（line 54-58 非流式 JSON 分支、line 99-103 流式分支）对 null 元素零防御（`tc.index` 直接抛异常），空 name 槽向下游传播（静默丢工具）。

**功能性需求**：F1 模型返回非标准 tool_calls 时 CLI 不崩溃、正常调用继续执行；F2 跳过 null/非对象元素并计数、缺 id 收尾合成 `call_N`、缺 name 丢弃、缺 index 追加尾部、非字符串 arguments 走 JSON.stringify；F3 下游（`agent.mjs:313` 构造、`context.mjs:217` 序列化）对缺 name 调用保持安全。范围边界：仅防御与降级，不替模型修复语义。

**非功能性需求**：NF1 解析热路径 O(n) 无新增开销；NF2 单测锁定畸形负载。

**设计**（本仓库 `src/provider/sse.mjs`，两处解析循环同规格）：

**归并语义**（槽选择优先级）：
1. `index` 有效（整数 ≥0）→ 按 index 取槽（不存在则新建）
2. 缺 index 但有 `id` → 按 id 在既有槽中查找归并；找不到则新建尾部槽
3. 缺 index 无 id 但有 `function.name` → 新建尾部槽（新调用）
4. 缺 index 无 id 无 name（纯 arguments 增量）→ 延续最后一个槽；无槽可延续则丢弃并计数

```js
for (const tc of delta.tool_calls ?? []) {
  if (!tc || typeof tc !== "object") { result.droppedToolCalls++; continue }   // null/畸形元素：跳过+计数
  let slot
  if (Number.isInteger(tc.index) && tc.index >= 0) {
    slot = (result.toolCalls[tc.index] ??= { id: "", name: "", arguments: "" })  // 规则 1
  } else if (tc.id) {
    slot = result.toolCalls.find((s) => s && s.id === tc.id)                          // 规则 2：按 id 归并（稀疏数组守卫）
    if (!slot) { slot = { id: tc.id, name: "", arguments: "" }; result.toolCalls.push(slot) }
  } else if (tc.function?.name) {
    slot = { id: "", name: "", arguments: "" }; result.toolCalls.push(slot)      // 规则 3：新调用
  } else {
    slot = result.toolCalls[result.toolCalls.length - 1]                         // 规则 4：增量延续尾槽
    if (!slot) { result.droppedToolCalls++; continue }                           // 无前槽可延续
  }
  if (tc.id && !slot.id) slot.id = tc.id                                         // 缺 id → 收尾合成
  if (tc.function?.name && !slot.name) slot.name = tc.function.name
  const arg = tc.function?.arguments
  if (typeof arg === "string") slot.arguments += arg
  else if (arg != null) slot.arguments += JSON.stringify(arg)                    // 非字符串参数（对象/数组）防御
}
```

**流结束收尾**（readSSE return 前，单点）：

```js
const entries = result.toolCalls.filter((tc) => tc)     // 稀疏 hole 剔除（rule-1 index 跳号）
const kept = entries.filter((tc) => tc.name)            // name 空的 slot 丢弃
result.droppedToolCalls = (result.droppedToolCalls ?? 0) + (entries.length - kept.length)
result.toolCalls = kept
const used = new Set(kept.map((tc) => tc.id).filter(Boolean))
let seq = 0
for (const tc of kept) {                               // 缺 id 合成，避让已用 id（call_N 冲突防御）
  if (!tc.id) {
    let id
    do { id = `call_${seq++}` } while (used.has(id))
    tc.id = id
    used.add(id)
  }
}
```

**告警通道**：`result._warnings ??= []` push `{ name: "malformed-tool-calls", message: "N malformed tool_calls dropped from provider response" }`——复用 `src/agent.mjs:253` 现有 `_warnings` 注入机制（**机读线注入**，模型需知道其工具调用未执行；agent.mjs 零改动）。**两端统一策略**：告警一律进机读线（模型可见），不进人读线——扩展端同规格，见 vscode `ARCHITECTURE.md` 变更段。

**下游审计**：`src/agent.mjs:313` 构造完整 tool_calls 对象（安全）；`src/context.mjs:217` `m.tool_calls.map((t) => t.function.name)` 顺手加 `t.function?.name` 守卫（一行，防御未来输入源变化）。

**受影响文件**：`src/provider/sse.mjs`（两处解析循环 + 收尾 + `_warnings`）、`src/context.mjs`（一行守卫，可选）、新增 `test/sse.test.mjs`。

**关键决策**：过滤丢弃而非报错——畸形调用缺 name 无从路由，静默崩溃/空转更差；合成 id（`call_N`）保证 `tool_call_id` 配对唯一；两端同修（CLI parity 既定纪律）。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `delta.tool_calls: [null, {index:0,id:"a",function:{name:"read"}}]` | 不抛异常；null 跳过计数 1；read 正常入列 | F2 |
| T2 | 无 `function` 的 tc（`{index:0,id:"a"}`） | 丢弃（name 空）计数 1 | F2 |
| T3 | tc 无 `index`：第一段 `{id:"call_1",function:{name:"read",arguments:"{\"a\":"}}`、第二段 `{function:{arguments:"1}"}}`（纯增量，无 index 无 id 无 name） | 按 id 归并 + 尾槽延续：单槽、name="read"、arguments=`{"a":1}` 拼接正确 | F2 |
| T4 | tc 无 `id` | 收尾合成 `call_N`，tool 消息配对不 400 | F2 |
| T5 | `function: null` 的 tc（`{index:0, id:"a", function:null}`） | 不抛异常，丢弃计数 | F2 |
| T6 | `arguments` 为对象（非字符串） | JSON.stringify 追加，不产生 `[object Object]` | F2 |
| T7 | 混合负载：1 正常 + 2 畸形 | 正常执行；`droppedToolCalls=2`；`_warnings` 1 条 | F1 |
| T8 | 回归：现有 sse 相关用例全过 | 无破坏 | 范围边界 |

## 11. GLM-5.3-Flash 模型支持（2026-08-28）

> 本文件为 CLI 侧权威源；扩展端设计见 `thincoder-vscode/docs/design/ARCHITECTURE.md` 变更段（不复制）。

**总体需求**：CLI 与 VS Code 两端新增 GLM-5.3-Flash 模型支持——智谱 2026-08-26 发布的 GLM-5 系列首个原生多模态 Flash 档位模型（320B 总参 / 18B 激活 MoE），1M 上下文 + 128K 输出 + 原生文本/图片输入，API 价格约为 GLM-5.3 的 1/10。

**功能性需求**：
- F1 `MODEL_SPECS` 加 `glm-5.3-flash` 条目：context 1M / maxOutput 128K / thinking 始终开（`thinkApi:"type"`，不可关闭）/ reasoningEffort `low`·`high`·`max` / **multimodal: true**（原生文本+图片，区别于纯文本的 glm-5.3）。
- F2 `read_image` 对 glm-5.3-flash 放行（靠 `spec.multimodal` 自动生效，file.mjs 门禁无需改）；CLI `src/tools/read_image.md` 的 vision 支持列表补 GLM-5.3-Flash。

**非功能性**：
- 规格表驱动：只加一行 spec，transport/thinking/续写全自动适配（§9 决策），零其他代码改动。
- 两端 parity：CLI 与 vscode 同规格（既定纪律）。

**设计**：
- CLI `src/config.mjs` MODEL_SPECS 加一行（对齐现有 `glm-5.3` 条目，额外 `multimodal: true`）：
  `["glm-5.3-flash", { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }]`
- VS Code `src/config.mjs` 加同规格行，补 `reasoningEffortDefault: "max"`（对齐其 `glm-5.3` 写法）。
- CLI `src/tools/read_image.md` 第 8 行 vision 支持列表补 `GLM-5.3-Flash`。

**关键决策**：

| 决策 | 理由 |
|---|---|
| **不改 PROVIDER_PRESETS 默认**（`glm`/`glm-code` 仍 `glm-5.2`） | 方案 A（2026-08-28 用户定）：只加可用性、不惊动现有用户默认；用户手动 `/model glm:glm-5.3-flash` 选择 |
| 方案 B（默认预设改为 glm-5.3-flash）被否决 | 避免惊动存量用户默认 |

**受影响文件**：`src/config.mjs`（CLI）、`src/tools/read_image.md`（CLI）、`thincoder-vscode/src/config.mjs`。

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `specForModel("glm-5.3-flash")` | context=1_000_000、maxOutput=128_000、multimodal=true、reasoningEffortEnum=[low,high,max]、noUsageStream=true | F1 |
| T2 | read_image 工具对 glm-5.3-flash 模型 | 不拒绝（multimodal 放行，file.mjs 门禁通过） | F2 |
| T3 | 回归：PROVIDER_PRESETS.glm.model | 仍 `glm-5.2`（默认未动） | 关键决策 |
## 12. Qwen 思考关闭映射（enable_thinking，2026-08-28）

> 本文件为 CLI 侧权威源；扩展端设计见 `thincoder-vscode/docs/design/ARCHITECTURE.md` 变更段（引用，不复制）。

**总体需求**：qwen 系列在两端能**真正关闭思考**。现状缺陷：qwen3.x（阿里云百炼混合思考模式，默认开启）在 reasoning `off` 时请求体不含任何思考控制字段（transport 只发 `reasoning_effort`，从不发 `enable_thinking`）→ 服务端按默认开启处理 → `/think off` 与面板 off **静默失效**（关不掉且无提示）。官方核验（百炼 deep-thinking 文档 2026-08-28）：混合思考模型 `enable_thinking:false` 即关闭；仅思考模型（如 qwen3.7-max-preview、qwen3.7-max-2026-05-17）无法关闭。

**功能性需求**：
- F1 百炼 Qwen 白名单模型显式 off → 请求体 `enable_thinking: false`（模型直接回复，不思考）。
- F2 白名单模型带 effort 档位 → `enable_thinking: true`，与既有 `reasoning_effort` 并存。
- F3 白名单规则：`spec` 模型名以 `qwen` 开头 **且** provider `baseURL` 含 `dashscope.aliyuncs.com` 或 `.maas.aliyuncs.com`；排除无思考编码型号（模型名以 `qwen3-coder` 开头）。
- F4 非白名单模型（kimi-k3、glm-*、deepseek-*、MiniMax 及自定义端点）**零变化**——`enable_thinking` 是百炼扩展参数，对其他端点不适用。

**非功能性需求**：
- NF1 **显式 off 约定统一**：`provider.thinking === null` 表示显式关机（vscode `resolveReasoningMode` off 已产 `thinking:null`）；CLI `/think off` 需改为同一约定（当前 `delete` 后字段不存在，与 autoThink 清空无法区分）。
- NF2 映射为纯函数，单测锁定（不依赖真实 API）；百炼兼容端点 `enable_thinking` 与 `reasoning_effort` 并存有效性**实现期真实端点冒烟验证**（官方文档无组合示例，unverified 前置项）。
- NF3 两端 parity：同一纯函数同一行为。
- NF4 失败模式不劣于现状：仅思考型号（preview）收到 `false` 时服务端若忽略，行为仍为永远思考（与现状一致），不引入 400 风险（冒烟验证确认）。

**设计**：
- 纯函数 `resolveEnableThinking(provider, spec)`（两端 `src/config.mjs` 导出，同构造）：
  ```js
  export function resolveEnableThinking(provider, spec) {
    if (!spec?.model.startsWith("qwen") || spec.model.startsWith("qwen3-coder")) return undefined
    if (!prov.isBailianHost(provider.baseURL)) return undefined
    if (provider.thinking === null) return false         // 显式 off（NF1 约定）
    if (provider.reasoningEffort) return true            // effort 档位（F2，与 reasoning_effort 并存）
    return undefined                                     // 未设置 → 服务端默认（qwen3.x 默认开思考，现状不变）
  }
  ```
  `isBailianHost`：`baseURL` 含 `dashscope.aliyuncs.com` 或 `.maas.aliyuncs.com`。
- CLI 注入点：`src/provider/core.mjs` body 组装（现 reasoning_effort 块附近）：
  `const enableThinking = resolveEnableThinking(provider, spec); if (enableThinking !== undefined) body.enable_thinking = enableThinking`
- CLI off 表达修正：`src/tui/cmd-think.mjs` `applyThink` effort-only off 分支（现 103-107 行 `delete cur.reasoningEffort`）改为 `cur.thinking = null; delete cur.reasoningEffort`；on 分支恢复默认（删 thinking:null 语义，默认 effort 从 `spec.reasoningEffortEnum[0]` 取——评审 #2：硬编码 "high" 对 qwen3.8-max（enum xhigh/medium/low）无效会 400）。**effort 分支与 auto 开启分支同样清 `thinking`**——选档位/开 auto = 要思考，清 off 标记（2026-08-28 交付评审 #1 修订：off→effort/auto 序列不得残留 thinking:null，否则 enable_thinking:false 与 reasoning_effort 矛盾同发、F2 违约）。autoThink 清空（off 侧）保持 `delete`（undefined → 不映射，auto 语义不受影响）。
- vscode 注入点：`src/provider/transports/openai.mjs` body 组装（现 reasoning_effort 行附近）同款注入；`src/extension/reasoning-mode.mjs` off 已产 `thinking:null`，**无需改**。

**受影响文件**：
- CLI：`src/config.mjs`（新增导出）、`src/provider/core.mjs`（body 注入）、`src/tui/cmd-think.mjs`（off 显式 null）
- vscode：`src/config.mjs`（同导出）、`src/provider/transports/openai.mjs`（body 注入）

**关键决策**：

| 决策 | 理由 |
|---|---|
| `thinking === null` 作为两端统一显式 off 约定 | vscode 已用 null 语义；CLI 补同约定即可精确区分"用户 off"与"autoThink/未设置"，映射函数稳定解耦 UI |
| 白名单按模型前缀 + baseURL 域名双条件 | `enable_thinking` 仅百炼扩展参数，全局发送会污染 kimi/glm/自定义端点；双条件防误伤（如自建代理转发 qwen） |
| 不把 `thinking_budget` 纳入本轮 | 独立增值项（限思考 token 上限），与本缺陷（关不掉）正交；记 TODO |
| 仅思考型号不特殊排除（preview 等） | 规则保持简单可解释；最坏行为 = 现状（仍思考），无回归；冒烟验证确认不 400 |
| 选档位/开 auto = 隐含 thinking on（清 `thinking:null` off 标记） | 评审 #1：off→effort / off→auto 序列若残留 null，请求体矛盾（`enable_thinking:false` + `reasoning_effort` 同发），F2 违约且比改动前更糟（显式关死）；null 保持"唯一 off 标记"，任何"要思考"的操作清它 |
| on 分支默认 effort 取 `spec.reasoningEffortEnum[0]` 而非硬编码 "high" | 评审 #2：qwen3.8-max / -preview 枚举不含 high，硬编码值过 core.mjs 校验直接 throw（`/think on` 后下一次请求 400） |

**测试用例表**：

| # | 输入 | 预期输出 | 对应需求 |
|---|---|---|---|
| T1 | `resolveEnableThinking({model:"qwen3.8-max", baseURL:"https://dashscope.aliyuncs.com/...", thinking:null}, spec)` | `false`（显式 off → enable_thinking:false） | F1 / NF1 |
| T2 | `resolveEnableThinking({model:"qwen3.8-max", baseURL:"https://dashscope.aliyuncs.com/...", reasoningEffort:"xhigh"}, spec)` | `true`（档位 → enable_thinking:true） | F2 |
| T3 | `resolveEnableThinking({model:"kimi-k3", baseURL:"https://api.moonshot.cn/v1", thinking:null}, spec)` | `undefined`（非白名单不映射） | F4 |
| T4 | `resolveEnableThinking({model:"qwen3.7-max", baseURL:"https://my-proxy.example.com/v1", reasoningEffort:"high"}, spec)` | `undefined`（非百炼域名） | F3 |
| T5 | `resolveEnableThinking({model:"qwen3-coder-plus", baseURL:"https://coding-intl.dashscope.aliyuncs.com/v1", reasoningEffort:"high"}, spec)` | `undefined`（无思考编码型号排除） | F3 |
| T6 | CLI `/think off` 后 `provider.thinking === null` 且 `reasoningEffort` 无；autoThink 清空后两者皆 undefined | null 语义只来自显式 off | NF1 |
| T7 | 冒烟（**2026-08-28 已执行 ✅**）：脚本 `test/smoke-qwen-thinking.mjs`（真实端点，读本机 config.json，key 不打印不外传）；qwenplan/qwen3.8-max 实测：off → 响应无 `reasoning_content`（1.0s）、xhigh → 有（291 chars）、未设置 → 默认思考（254 chars）；仅思考 preview off 未测（本机无该型号配置，跳过） | 行为符合官方 deep-thinking 文档 | 已勾销 |
| T8 | CLI `/think off` → `/think effort xhigh` 后 `provider.thinking` 无（null 标记被清）且 `reasoningEffort:"xhigh"` → `resolveEnableThinking` 返回 `true`；vscode 面板 off → 选档位同语义 | 选档位清 off 标记，无矛盾载荷 | F2 / 评审 #1 |
| T9 | `applyThink` "on" 分支（effort-only，无既有 effort）：qwen3.8-max → 默认 `reasoningEffort:"xhigh"`（枚举首值）；qwen3.7-max → `"xhigh"` | 默认值必在枚举内，core.mjs 校验不 throw | F2 / 评审 #2 |
| T10 | `/think` 交互菜单头部（effort-only 模型，`thinking:null` 显式 off） | 显示 "Thinking: OFF"（null 显式排除，不再误显示 ON） | NF1 / 评审 #3 |


## 13. Responses API Transport（2026-08-31 用户拍板实施）

> 状态：**已拍板实施**。旧预案 `thincoder-vscode/docs/design/RESPONSES-TRANSPORT.md`（2026-08-15 会诊"不做"存档）在用户确认"国产已大量支持"后重启；本文件为 CLI 侧权威源，扩展端同规格（引用，不复制）。
> 支持矩阵 2026-08-31 重新核实（官方文档一手：DeepSeek api-docs / 百炼 help.aliyun.com）。

### 13.1 支持矩阵（2026-08-31 核实）

| 厂商/端点 | 格式 | previous_response_id | reasoning 明文回传 | 判定 |
|---|---|---|---|---|
| **OpenAI 官方** `api.openai.com/v1` | ✅ | ✅ store:true 30 天 | ❌ encrypted（无明文） | **完整 → 开链** |
| **百炼 Qwen** `/compatible-mode/v1/responses` | ✅ | ✅ **7 天**（传顶层 response id，非 output msg id） | ✅ summary 明文 | **完整 → 开链** |
| **DeepSeek** `api.deepseek.com` | ✅ 事件流同 OpenAI | ❌ **不支持**（无状态；不支持参数**静默忽略**） | ✅ 明文 content | **格式完整、无链 → 全量模式，链禁用** |
| **智谱 GLM** `open.bigmodel.cn/api/v1` | ✅（Coding Plan 专属，Codex 兼容驱动） | ✅ **2026-08-31 真机验证：store:true 链全链路工作**（store:false → HTTP 400 not_found；事件流与官方一致含 reasoning_text.delta） | ✅ | **升级白名单**（store:true 规则与百炼并列）；搜索/读取 = 官方 MCP 生态（非 responses 内置工具）——GLM 用户接入姿势 = MCP server |
| Kimi 平台 API | ❌ 无端点 | — | — | 不接（同 8-15 矩阵） |
| 火山方舟 | ✅ 迁移文档 | 未核实 | 未核实 | 留位（一期不接） |

**重要性提示**：DeepSeek 官方明说"不支持的参数会被**静默忽略**、不会报错"——`previous_response_id` 发给 DeepSeek 会被忽略：只剩增量 input → **无声丢上下文**（比 404 危险）。因此链的应用**必须 host 白名单驱动**，不能只靠服务端报错兜底（§13.3 D8）。

### 13.2 设计概览

- `format: "responses"`（用户拍板命名，四值之一）；`provider.stateful` 默认 `true`（用户拍板）——但链仅在白名单 host 生效（D8）。
- 双轨：**本地会话/历史仍是唯一事实源**（压缩/落档/恢复/跨端零变化）；`previous_response_id` 链只是发送层优化（D1）。`store: false`（本地有全量，不托管服务端）。
- 链生命周期 = **单次 turn**（D2）：runAgent 开始重置（发全量建链），turn 内工具往返用链增量（每往返 ≥90% 请求体削减）；跨 turn 无条件重建——上下文正确性优先。
- 链失效（404/expired）→ 自动重置链 + 本地全量重发一次（D6），无数据丢失。
- 工具调用：内部 shape `{id, name, arguments}` ↔ responses `function_call` item（call_id 配对 function_call_output）双向适配（D4）。
- 请求体：system → 顶层 `instructions`；messages → input items；`reasoning: {effort}`；`max_output_tokens`；`stream: true`（流以 `response.completed/incomplete/failed` 结束，**无 `data: [DONE]`**）。
- reasoning：`response.reasoning_text.delta`（DeepSeek 文档列名）→ onReasoning；usage `output_tokens_details.reasoning_tokens`；cached 走 `input_tokens_details.cached_tokens`。

### 13.3 关键决策

| 决策 | 理由 |
|---|---|
| D1 双轨：本地事实源 + 链仅发送层 | 会话是核心资产（审计/恢复/压缩/跨端）；服务端 7 天过期且锁厂商。与 8-15 旧预案"放弃服务端状态"一致（store:false 不托管）；仅"turn 内链"是旧预案未覆盖的新增优化，属今天拍板范围 |
| D2 链 = 单 turn | 跨 turn/压缩/恢复/换模型漂移不可控；每 turn 重建把"正确性-收益"边界划在最稳点 |
| D3 默认无状态（stateful 默认 true 但仅白名单生效） | 用户拍板默认 true 针对"支持链"端点；白名单外自动全量（D8），对用户无感且正确 |
| **D8 host 白名单驱动链** | DeepSeek 静默忽略 = 无声丢上下文；白名单：openai 官方 + 百炼（dashscope/maas compatible-mode）；灰名单（deepseek.com / open.bigmodel.cn 等）→ 全量 + 一次性 warning；provider 显式 `stateful: true/false` 覆盖（高级逃生舱，信任自定义网关时用） |
| D4 工具 item 双向适配 | function_call/function_call_output ↔ 内部 {id,name,arguments}；call_id 是配对锚点 |
| D5 不依赖流式 usage 帧 | completed 事件响应对象携带 usage（流末尾一帧）——与 chat completions 的 choices:[] 帧不同 |
| D6 链失效自动回退 | 404/过期 → 全量重发一次（不是报错）；链是优化不是正确性依赖 |
| D7 不探测不降级（格式层） | format 显式配置显式失败（同 8-15 §3.4 纪律）；重试/限流/错误语义与 chat 格式共用（requestWithRetry） |
| **D10 store 决策（2026-08-31 真机冒烟修正）** | **百炼链硬规则：R1 必须 store:true**——store:false 时 previous_response_id 一律 400 "Not found"（实测，含 deepseek 聚合模型/qwen 原生/单边 store:true 全试过）；OpenAI 官方 store:false 链仍可用。→ 开链时百炼 store:true（**对话云端留存 7 天**——首次 warning「responses-store-retention」知悉，provider.stateful=false 退出）；DeepSeek 灰名单全量恒 store:false。D1 "store:false 不托管" 原语义对百炼失效，按本决策修正 |
| **D11 事件帧协议（真机冒烟）** | 百炼 SSE：`data:{…}` 无空格 + `event:xxx` 行 + `:HTTP_STATUS/200` 注释行 + **`event:error` 帧（HTTP 200 内嵌业务 400，data 无 type 字段）**——不识别 error 帧 = 静默空内容当回复（round2 实测中招）。解析器兼容 data: 无空格（或全空格）+ event:error → 抛错。**教训：厂商差异 mock 必须按真实帧构造**（mock 全用 OpenAI 形态 → 测试自洽世界假绿） |
| **D9 内置工具（2026-08-31 用户拍板，一期 web_search）** | 服务端执行——**绕过本地工具权限门/审计**（产品决策，用户拍板，风险明示）；host 映射默认声明（openai/百炼/DeepSeek），`provider.builtinTools:false` 关闭、数组显式覆盖；结果 `builtinToolResults` → agent 本地化 role:"tool" 消息（JSON 含 query/sources）；全量回传时 transport 依 `tool_call_id` 前缀 `web_search_call_` 还原原样 `web_search_call` item（DeepSeek 官方：原样回传服务端自动恢复搜索结果）；code_interpreter/web_extractor 二期 |

### 13.4 实现影响

- CLI：`src/provider/responses.mjs`（新 transport：buildRequest/parseStream/normalizeUsage/链状态机）、`core.mjs` 分派（format==="responses"）、`config.mjs`（host 白名单/灰名单常量）。
- vscode：`src/provider/transports/responses.mjs`（同规格）+ `src/provider.mjs` TRANSPORTS 注册（其 requestWithRetry/rateGate 单点共享）。
- agent 层零改动：transport 返回既有 shape `{content, reasoning, toolCalls, usage, finishReason}`。
- preset 不动：默认稳态 chat completions；responses 是显式 opt-in（与 8-15 §3.2 一致）。

### 13.5 测试用例表

| # | 用例 | 断言 |
|---|---|---|
| T1 | buildRequest 消息转换 | system→instructions；user/assistant→message items；assistant tool_calls→function_call item；tool 结果→function_call_output |
| T2 | buildRequest 工具转换 | OpenAI function schema → 扁平 tools（type:"function"） |
| T3 | parseStream 文本流 | output_text.delta 序列 → onToken 聚合；completed 携带 usage |
| T4 | parseStream 工具调用 | output_item.added + function_call_arguments.delta + output_item.done → 完整 toolCalls（多工具并行） |
| T5 | parseStream reasoning | reasoning_text.delta → onReasoning；reasoning_tokens 计 usage |
| T6 | 链状态机 | turn 内第 2 次请求带 previous_response_id；turn 开始重置（发全量）；跨 turn 重建 |
| T7 | 链失效回退 | 404 → 自动全量重发，结果一致 |
| T8 | 白名单 | dashedscope/maas/openai 开链；deepseek.com 全量 + warning；stateful:false 显式全量 |
| T9 | 注册 | format:"responses" 命中；未配置仍走 openai |
| T10 | 续跑/压缩兼容 | 压缩后全量 input（链重置）→ 无分离 |
| T11 | event:error 帧识别（百炼形态，真机冒烟发现） | `event:error` + data{code,message} → 抛错（不静默空响应） |
| T12 | stateful:false 覆盖清残留链 | provider.stateful=false 时既有链作废（全量）——buildBody 清洗链含 wantStateful |

## 13.6 真机冒烟记录（2026-08-31 执行 ✅）

`test/smoke-responses.mjs` + `test/smoke-responses-chain.mjs`（读本机 config.json，key 不打印不外传）：

| 项 | 结果 |
|---|---|
| DeepSeek 官方（灰名单） | ✅ content/reasoning 流/usage/warning 全验证；`response.reasoning_text.delta` 帧名实证（46 chars） |
| 百炼 qwen（白名单） | ✅（修 event:error 静默 + data: 无空格后）reasoning 208 chars 实证 |
| qwenplan `.maas` 域 | ✅ 同 qwen |
| **链收益实测** | 39.1KB 上下文 + 工具往返：**请求体 40788B → 468B = 98.9% 削减**（宣称 ≥90% 实证）；链推理连续性 ✓（第二轮模型正确读到 function_call_output）；百炼 prompt_cache_hit 24576 tokens（链下会话缓存命中，服务端也省） |
| **计费口径（如实）** | 百炼 input_tokens 计链上下文（25463→25514 微增）——**收益是请求体体积与延迟，不是计费 token 数**；计费端收益来自缓存命中，非链本身 |
| store 硬规则 | ①store:false + 链 → 400 Not found（6 组合全测）②store:true 全链路 ✓ —— D10 |
| 未验项 | OpenAI 官方端点真机（无 key）；GLM 非 Codex 行为；模型主动选 web_search 的端到端（prompt 引导未试） |

## 13.7 预设 provider 全景（2026-08-31 查证：19 家内置预设 → responses 状态）

| 预设 | responses | 链 | 依据/状态 |
|---|---|---|---|
| deepseek | ✅ | ❌（官方无状态；灰名单全量） | 真机 ✅ |
| qwen / qwenplan | ✅ | ✅ | 真机 ✅（98.9% 体积削减实测） |
| glm / glm-code | ✅ | ✅ | 真机 ✅（baseURL 须 `open.bigmodel.cn/api/v1`——预设是 chat 路径，响应式用户需自配） |
| openai | ✅ | ✅ | 官方文档（未真机，需官方 key） |
| minimax | ✅ | ❌（官方 schema 无 previous_response_id/store；中立 host 静默全量） | 官方文档（responses-create.md 主接口）+ 真机 ✅；tool_choice 仅 none/auto（限制记录） |
| openrouter | ✅ 格式 | ❌（官方文档：**stateless，store/previous_response_id 明确 400 拒绝**） | 官方文档；**事件流变体**（content_part.delta/response.done/[DONE]）已兼容（2026-08-31） |
| grok (xAI) | ✅ | ✅（官方文档：previous_response_id + 加密 Reasoning） | 官方文档（未真机） |
| kimi / kimi-code | ❌ | — | 官方全站索引零 responses（Codex 走 CC Switch 兼容层） |
| claude | ❌（Messages 协议） | — | 协议本体 |
| gemini | ❌（Google 协议） | — | 协议本体 |
| mimo / mimoplan | ⚠️ 未证实 | — | 官网仅"OpenAI/Anthropic 兼容"（无 responses 证据） |
| volcengine / hunyuan / siliconflow / groq / mistral | ⚠️ 未核实 | — | 官方文档未核到 responses 页（搜索工具当日故障，留位） |

**纪律重申**：白名单 = 官方文档 + 真机双实证（openai 未真机属已知例外——官方为协议首发方）；中立 host（格式支持、无链/未证实）= 静默全量 + 无警告；灰名单 = 官方明确"不支持且静默忽略"（仅 DeepSeek）→ warning。
