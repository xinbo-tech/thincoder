# Provider 面与配置（thincoder-vscode）

> 状态：**迁移期参照历史**（2026-09-08 DOC-REORG 第 2 批——ARCHITECTURE §5 迁出 + RESPONSES-TRANSPORT
> 并入合并为独立档；以本端代码为准）。**W10 已迁核**（2026-09-15——provider 实现面：chat/transport 分派 / 限流 / 模型清单 / 代理；现体 = `thincoder-core/provider/` + `thincoder-core/proxy.mjs`）。与 CLI 同名文档 `PROVIDER.md` 对应同一机制板块——各端
> 独立实现，内容以本端代码为准。
>
> 范围：配置与 preset、Provider 增删与模型选择 UI、transport 分派与调用链、能力适配
> （spec/thinking/escape/续写）、Responses transport、LLM 标题生成、图片输入。
>
> 相关权威：`src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）`（W10 已迁核——现体 `thincoder-core/provider/core.mjs`；chat/transport 分派）、`src/provider/transports/*`（四
> transport；W10 已迁核——现体核 `provider/{anthropic,google,sse,responses}.mjs`）、`src/config.mjs`（MODEL_SPECS / specForModel / resolveEnableThinking）、
> `src/config-presets.mjs`（PROVIDER_PRESETS）、`src/config-io.mjs`（config.json 读写）、
> `src/escape.mjs`（W4 已迁核——现体 `thincoder-core/escape.mjs`）、`src/extension/{settings,presets,provider-flows,reasoning-mode,
> generate-title,image-handler}.mjs`。

## 1. 配置存储（共享 config.json）

与 CLI 共享 `~/.thincoder/config.json`。读写核心 `src/config-io.mjs`（纯 Node、无
`vscode` 依赖，可单测），面板读写面 `src/extension/settings.mjs` / `presets.mjs`。

- **providers[]**：每项 `{ name, baseURL, model, apiKey?, chatPath?, maxTokens?,
  temperature?, thinking?, reasoningEffort?, format?, context?, proxy?, responseFormat? }`。
  `baseURL` 尾斜杠在读取时归一（`resolveProviders`）。**`model`（单值）= 渠道默认模型**
  （MODEL-SELECTION v2——`models[]` 候选清单字段整字段退场；清单权威 = 运行期从 provider 拉取，
  见 §3.1）；非字符串 / 空串在读取时归一删除。
- **默认（MODEL-MERGE-SESSION + MODEL-SELECTION v2）**：顶层 `defaultModel = "provider:model"` 复合 =
  新会话起点；旧 `activeProvider`/`activeModel` 两键已删——loadRaw 检测老形态经 `config-migrate.mjs`
  `migrateLegacyModelFields` 迁移（幂等；写回失败不阻断——下次重试）。**v2 迁移**（规则与 CLI 端同源
  （CLI 侧 `PROVIDER.md` §16.2 M7）；本端独立实现）：`delete p.models`；`p.model` 保留（老形态 A =
  渠道单值 + active* 复合），或由 `defaultModel` 属本渠道模型段 / 现有单值 / `models[]` 首个非空值
  播种（形态 B）；垃圾形态（非字符串 model / 非数组 models）清理。**注**：`providers[].model` 单值于
  v2 恢复（渠道默认模型——新装种子 / 槽空兜底），与 `defaultModel` 两权分立。
  `resolveProviders().activeProvider` = defaultModel 渠道（失效回退首渠道——面板 radio/删除守卫
  用）。`manifest` 无 —— config.json 单文件承载。
- **`resolveDefaultModel(entry, raw)` 回退链（v2——R6）**：① `defaultModel` 复合属本渠道 → 用之；
  ② 渠道默认单值 `entry.model`；③ `null`——**不再静默回退 `models[0]`**；`providerFromConfig`
  的 `provider.model` = 本函数解析值（API/spec 消费点零改）。
- **apiKey**：`resolveKey` **只读 config.json `entry.apiKey`**，环境变量不是密钥源（用户经
  面板/config 配置；与 CLI 的 env 回退语义不同）。空 → provider 不可用
  （`providerFromConfig` 返回 null；模型选择走 onboarding）。
- **代理**：provider 级 `proxy: true` **且** 全局 `proxy.model === true`（`injectProxy`
  语义）→ 请求经代理。单键不生效。
- **format**：wire 协议 —— `openai`（默认）/ `anthropic` / `google` / `responses`
  （见 §4/§5）。未配 = openai。
- **context（K 单位，§6.5）**：`providers[].context` 正整数覆盖 MODEL_SPECS 上下文；非法值
  忽略 + 每 provider 名警告一次（`resolveProviders`）。
- **并发写防冲突（F5b）**：`loadRaw` 记 mtimeMs+size 基线，`saveRaw` 写前重 stat 不符 →
  放弃 `{reason:"mtime-conflict"}` + `.bak-{ts}` 轮转（副本，不自动合并）；调用方提示重试
  （`CONFIG_CONFLICT_HINT`）。
- **旧版迁移**：VS Code settings 的 `thincoder.providers` + SecretStorage 一次性迁入
  config.json（`config-migrate.mjs` `migrateCore`：不覆盖已有 apiKey，preset 名自动重建）后
  清 legacy 存储。嵌入 key 一并迁移（config.embedding，默认 SiliconFlow bge-m3）。

## 2. Preset 预设表

`src/config-presets.mjs` `PROVIDER_PRESETS`（镜像 CLI PROVIDER_PRESETS，保持同步）——
**20 preset**：deepseek / kimi / kimi-code / glm / glm-code / qwen / qwenplan / mimo /
mimoplan / minimax / openai / claude / gemini / grok / mistral / volcengine / hunyuan /
siliconflow / openrouter / groq。claude / gemini 携 `format: "anthropic"` / `"google"`；
minimax 携 `chatPath: "/text/chatcompletion_v2"`。

`presetToEntry(name)` 剥离 `desc`（面板显示字段），余下发成 provider 条目。
**v2（MODEL-SELECTION）**：各预设携**单值默认模型 `model`**（原 `models[]` 候选种子退场——
承接新装种子 / 槽空兜底 / 显示回退；CLI 语义同源、本端独立实现）。
**2026-09-11（第 6 批）**：`deepseek` 预设默认模型 → `deepseek-flash`（DeepSeek V4.1-Flash 接入——
语义与 CLI 同源；规格行/退役与限期路由处置见 §6.1）。

## 3. 模型选择 UI 与 Provider 增删

- **模型选择（对齐 CLI 二级菜单）**：主下拉列 provider 行（名 + 当前模型 + `›`），hover
  弹出该 provider 模型 flyout 子菜单；点击选中。主下拉底部含 add / remove / key 管理入口。
  Webview 无键盘导航 → 用 hover flyout。**选中 = 写当前会话槽**（`activeProvider` +
  `activeModel` 双字段——`selectProviderModel` config 写路径已退役）；配置默认 = 设置面板
  「默认模型」项（provider → 运行期拉取候选 两级——写 raw.defaultModel；候选数据源与不可用
  渠道剔除见 §3.1）。候选未命中（prefs 复合不在拉取清单）→ 保持当前选择显示与状态（回落会话槽复合）+ 零 `selectModel` / `selectReasoning` post——**本批处置**
  （未命中场景写槽仅显式点击；命中分支维持现状——同值回写；M10 语义同源，见 §3.2）。
- **Add**：`provider-flows.mjs` `addProviderFlow`（QuickPick preset[过滤已添加，filter by
  desc/model] 或 Custom 手输 name/baseURL/model + format）→ `addProviderEntry`（预设自动填
  baseURL/model；custom 逐字段校验，format 三值 openai/anthropic/google + 拒绝未知）→ 问
  key → `setProviderKey`。Settings 面板消息 `addProvider`/`removeProvider`/
  `setProviderProxy` 直落纯函数。`testProviderConnection({ baseURL, apiKey, format })` 经
  `/models` 探测 baseURL+key 有效性并拉回模型列表供挑选（`listModels` 三 format 分派；
  `format` 随表单透传、缺省 = openai）；加渠道后的准入探见 §3.1（M9）。
- **Remove**：`removeProviderFlow` 列非 active provider 供删；active 受保护不可删。
- **Key**：`setKeyFlow` 设/改；`removeProviderKeyFromConfig` 删 key 保留条目（custom 空条目
  整体清）。

### 3.1 清单来源与渠道准入（MODEL-SELECTION v2）

- **清单来源 = provider 运行期拉取**（`GET /models`；本端独立实现 `src/provider/list-models.mjs`——W10 已迁核：现体 `thincoder-core/provider/list-models.mjs`）：
  `listModels(provider, { signal })` 按 `provider.format` 三格式分派——openai（缺省/未知）：
  `GET {baseURL}/models` + `Authorization: Bearer`；anthropic：`GET {baseURL}/models?limit=1000`
  + `x-api-key` + `anthropic-version: 2023-06-01`；google：`GET {baseURL}/models?key=…&pageSize=1000`
  （剥 `models/` 前缀）。cursor 分页（`has_more`→`after_id` / `nextPageToken`）跟随翻页、
  ≤10 页上限；15s 超时；失败抛出（调用方降级）——**无静态候选、无 fallback 候选**（拉不到列表 =
  该渠道不可选）。
- **候选面**：`src/extension/settings.mjs` `fullStatus` 单源拉取（逐已配置渠道各探一次）；探通 →
  候选行 = 拉取结果（直接可选）；探不通 → 该渠道不可选 + 失败消息本体随载荷下发。webview 默认
  模型菜单与预设行改消费**运行期载荷**（`SS.getModels`——不再直读 config 字段）；`providerStatus`
  行显单值默认模型（`models[]` 退场）；失败渠道经 `available:false` / `unavailableReason` 标注。
- **M9 配置阶段准入**（探针 `probeChannelModels` + 展示态 `recordAdmission` / `admissionOf`
  收敛于 `src/provider/list-models.mjs`——W10 已迁核：现体 `thincoder-core/provider/list-models.mjs`；探针形状由 `config-io.mjs` `probeTargetFromEntry` 组装）：
  加渠道（`addProviderFlow` / 面板 `addProvider`）/ 设 API key（`setKeyFlow` / `saveProviderKey`）/
  设默认模型（`settings-panel-write.mjs` defaultModel 写面）时对目标渠道探一次 `GET /models`。
  探不通 → 失败消息逐字长句 `该渠道不提供模型列表（GET /models {状态}）——无法选择模型，请改用
  其他渠道`（`channelUnavailableMessage`）+ 行内状态标签 `不可用`（`.prov-unavailable` /
  `.prov-hint`）+ 不入默认模型可选来源 + **不阻断保存**；失败不缓存（下次配置动作重探）。
  `defaultModel` 写面探针 fire-and-forget（写面为同步契约——探针绝不 reject）。
- **运行期零探测**：非配置流（启动 / 发请求 / 面板打开）不做 `/models` 探测；配置流内探测不受限。
  命令面 `provider:model` 放行语义不变。

### 3.2 双端语义同源与差异（N4——如实落档）

> 各端独立实现、语义同源；不做逐字硬一致、不加双端同步依赖。

| 面 | CLI | 本端（VSC） | 说明 |
|---|---|---|---|
| 切换回显 spec 来源 | 有 | **无**（本批不加） | O2 已裁——批范围第 ⑥ 面字面仅含「候选同源 + resolveDefaultModel」 |
| 拉取实现 | `src/provider/list-models.mjs`（CLI 仓） + `src/tui/model-catalog.mjs`（CLI 仓）（会话缓存 TTL 60s / 失败不缓存） | `src/provider/list-models.mjs`（本端独立——W10 已迁核：现体 `thincoder-core/provider/list-models.mjs`；`fullStatus` 每次拉取——**无会话级 TTL 缓存**） | 已知不对称（后续可选） |
| 拉取结果排序 | 调用方 | `listModels` 内部排序保留（既有行为） | 双端允许差异 |
| 准入探针宿主 | `src/tui/model-catalog.mjs`（CLI 仓） + `model-picker.mjs` 落点 | `src/provider/list-models.mjs`（探针 + 展示态；W10 已迁核——现体 `thincoder-core/provider/list-models.mjs`） | 设计未钉宿主，两端各自落地 |
| 失败诊断载荷 | —— | `models` 载荷附 `unavailable[{provider,reason}]` | 本端自定（测试/排障面） |
| webview 下拉兜底 | 会话重载 = **会话值优先**（`cmd-config.mjs:67-71` `sessionModel ?? dm.model ?? keep.model`——`keep.model` 仅链尾兜底；不读候选清单） | 候选未命中 = **保持当前选择显示与状态（回落会话槽复合）+ 零 `selectModel` / `selectReasoning` post**（不再取候选首项写会话槽）——**本批处置**（用户 2026-09-11 裁定；M10） | 语义同源（双端独立实现）；T29 / AC-10 锁定（T29 = 引例：批级编号；现体 = `test/model-picker-fallback.test.mjs`） |

## 4. transport 分派与调用链（provider.mjs chat）

`chat(provider, opts)` → `chatImpl`。调用方传 `{ messages, tools, onToken, onReasoning,
onWait, signal, toolChoice, parallelToolCalls, logCtx? }`，返回统一形态 `{ content,
reasoning, toolCalls, usage, finishReason, _warnings?, interrupted?, partial?,
droppedToolCalls? }`。

**流程**：

1. **发送前净化（分派前）**：`specForModel` 取 spec → `stripImagesForTextModel(messages,
   spec)`（防图片毒化）→ `normalizeToolPairing(messages)`（工具消息重排到 owner 后、孤儿
   丢弃、缺结果合成占位）→ `escapeMessages(messages)`（escape v5 + 剥离本地字段，见 §6.3）。
2. **reasoning effort 校验**：非 anthropic/google 时 `reasoningEffort` 不在
   `spec.reasoningEffortEnum` → 抛错（router 模型 ID 含 `/` 时不发）。
3. **format 分派**：`TRANSPORTS = { openai, anthropic, google, responses }`，
   `getTransport` = `TRANSPORTS[provider.format] || openai`（W10 已迁核——现体 `thincoder-core/provider/core.mjs` 的 format 分派）。每 transport 实现
   `{ normalizeTools, buildRequest, parseStream }`。
4. **请求组装**：`transport.buildRequest(provider, messages, normalizedTools, { toolChoice,
   parallelToolCalls })` → `{ url, headers, body }`。
5. **闸门与请求**：`estimateRequestTokens`（responses 用本地 messages 估算——body 无
   messages 键）→ `rateGate`（TPM/RPM，§4.1）→ `requestWithRetry`（§4.2）→
   `transport.parseStream(response, { onToken, onReasoning, signal })` → `recordRate` 用实测
   usage 修正记账。
6. **Responses 链推进**（transport === responsesTransport）：completed 的 `responseId` 供同
   turn 后续增量；截断/失败作废（§5.2）。
7. **截断续写**（OpenAI-format only）：`finishReason === "length"` 且
   `spec.partialMode/prefixMode` → 续写循环 `MAX_CONTINUATIONS = 3`（§6.2）。
8. **LOGGING**：`llm:start/done/error` 事件统一落点（单点覆盖主回合/消化轮/compact/distill/
   advisor/子代理）。

### 4.1 TPM/RPM 闸门（src/provider/rate.mjs）

provider 配 `tpm`/`rpm` 后启用：60s 滑动窗口发送前记账（`estimateText`：ASCII ≈4
chars/token、CJK ≈1），超预算 `sleep`（onWait 通知）；未配则关闭。`recordRate` 用实测修正。
单请求估算超 tpm 不卡死（放行 + 告警）。窗口按 baseURL（/beta→/v1 归一）+ apiKey 键控；
`_rateHooks` 可注入（测试假时钟）。

### 4.2 重试/超时（requestWithRetry）

- `MAX_RETRIES = 3`；`RETRYABLE_STATUS = {408,409,425,429,500,502,503,504}`；
  `RATE_LIMIT_BACKOFF_MS = [15s,30s,60s]`。
- **429**：尊重 `Retry-After`（秒数/HTTP-date，上限 300s——`parseRetryAfter`）；无/非法退避
  表。余额/配额类 429（中文「余额不足/充值」/`insufficient_quota`/`1113`/`1114`）立即抛不干等。
- **5xx/408/409/425**：指数退避 `2^(n-1)` s。
- **不重试**（`isNonRetryableError`）：401/403 认证、400 级非 429。
- **401 Kimi 双平台提示**：`sk-kimi-` key 或 `api.kimi.com` 端点遇 401 → 追加说明（Moonshot
  与 Kimi For Coding 的 key 不互通）。
- **超时（相位语义——2026-09-11 群 A 批改写）**：**绝对墙钟已废除**（原每请求
  `AbortSignal.timeout(600_000)` 会腰斩长思考请求——"aborted due to timeout" 误报的直接来源）；
  响应头阶段 = 600s（代理路径 `_headerTimeoutMs`；直连用 undici 默认）；body 阶段 = 读侧
  空闲 120s（`READ_IDLE_MS`——四 transport 自持；代理路径 `_bodyIdleMs` 同值双保险）。
  `AbortError` 透传（用户中断不吞）。详见 §4.3。
- **responses 链失效回退**（D6）：transport === responsesTransport 且 400/404 → 清残留链 +
  真·全量重发一次（不清链则增量分支裸工具结果二次 400）。

### 4.3 请求链超时语义镜像（群 A 批——绝对墙钟废除 + 读侧 idle 补齐）（2026-09-11）

> 来源：批次档 `2026-09-11-VSC-MIRROR-SWEEP（本仓）` §1 条目 A1（指针 = CLI 批
> `2026-09-11-ABORT-PROVENANCE.md`（CLI 仓）§20.10「VSC 镜像 600s 绝对墙钟残留——用户实证文案的唯一在网生产点」）。
> 语义源：CLI `src/provider/core.mjs:408-415`（CLI 仓）（相位拆分——绝对墙钟废除后的现行语义）；双端纪律：语义同源、本端原文自持。
>
> **W10 已迁核（2026-09-15）**：本节 = 群 A 批历史契约（镜像面）；VSC provider 镜像已删——
> 实现体 = 核（`thincoder-core/provider/`），驱动面 = `test/provider-timeout-semantics.test.mjs`
> （保留 2 例经核 `chat`；退役 3 例见该文件头注）。本节下文对 `src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）` / 四 transport
> 的行号引用均为迁核前 as-of 坐标，不再指向现态档。

**（a）问题陈述（现场复核——as-of 2026-09-11）**：

| # | 现状 | 现场锚 |
|---|---|---|
| 1 | 每请求合成绝对墙钟：`signal ? _anySignal([signal, AbortSignal.timeout(600_000)]) : AbortSignal.timeout(600_000)`——**头+body 全程 600s 绝对上限** | `src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）:324`（`:28` 常量声明；`:23-27` 注释自称 "CLI parity" = 陈旧——CLI 废掉的正是此物） |
| 2 | 直连路径 body 无读侧守卫（仅代理路径 `_bodyIdleMs`）——墙钟拆除后静默流无显式兜底 | `src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）:328`；四 transport 读循环无 idle（`openai.mjs:245-255` / `anthropic.mjs:147+` / `google.mjs:190+` / `responses.mjs:252-257`） |
| 3 | 文档句与相位语义不符（"响应头阶段" 实为全程绝对上限） | 本档 §4.2（改前句） |

**（b）方案选型对比**（判据 = 用户实证文案闭源 / 长请求不腰斩 / 无新挂起窗口 / 可测 / 与代理路径一致）：

| # | 候选 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | **去绝对墙钟 + 头相位保留（`_headerTimeoutMs`）+ 四 transport 读侧 idle 120s 补齐** | 误报闭源（无 600s 绝对钟）；长思考请求不再被腰斩；body 停摆 120s 内判死（无新挂起窗口）；idle 可经 seam 注入短值测试；代理 / 直连同语义（120s） | 四 transport 各 +~10 行（timer 臂/清/销毁）+ seam 参数；`_anySignal` polyfill 退场（W10 已迁核——现体 `thincoder-core/provider/core.mjs`） | **选定** |
| 2 | 仅去 `:324`（不补直连 idle） | 改动范围 = 仅去 `:324`；但直连静默流无显式守卫（仅 undici 隐式默认——未承诺 / 不可测 / 与代理路径 120s 不一致）——原 600s 兜底拆除后无替身 | — | 否决 |
| 3 | 保留绝对墙钟（改值 / 改语义） | CLI 已废（长上下文子代理被腰斩的根因）；用户实证文案同源——复现即回归 | — | 否决 |

**（c）契约（逐条——实现对象）**：

1. `src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）:324`：`signal: signal ?? undefined`（**去合成**——不再叠加 `AbortSignal.timeout`）；
   `:31` `_anySignal` polyfill 随唯一使用点退场（删除）；`:23-28` 注释改写（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）；
2. `:327` `_headerTimeoutMs: FETCH_TIMEOUT_MS` 保留（代理路径头阶段 600s——与 CLI 同值；本端无 `fetchTimeoutMs` 配置键——不加新配置面）；`:328` `_bodyIdleMs: 120_000` 保留；
3. **读侧 idle（本端补齐——CLI 对位 = `sse.mjs:169-182` / `google.mjs:197-207`）**：四 transport 的读循环各加
   `READ_IDLE_MS = 120_000` 空闲看门狗——每 chunk 重置；连续无数据 120s → `response.body.destroy(new DOMException("SSE idle timeout: no data for 120s", "TimeoutError"))`；
   读毕清理 timer。测试缝 = `parseStream(response, { …, idleMs })`（生产缺省 `READ_IDLE_MS`——调用方零改）；
4. 错误分类不变：idle 消息含 "timeout" → `classifyErr` 归 `timeout`（`src/log.mjs:178`；W1 已迁核——现体 `thincoder-core/log.mjs:1`）——llm:error 可判来源；
5. 文档：本档 §4.2 改写（已落）+ 本 §4.3 + 变更记录一行。

**（d）用例表（T-MA1-1–5——正常 / 边界 / 错误；零网络——fetch / proxyFetch 桩 + 假流）**：

| # | 类 | 输入 | 预期输出（断言） | 映射 |
|---|---|---|---|---|
| T-MA1-1 | 正常 | `globalThis.fetch` 桩捕获请求 options（W10 后 = 核 `chat` 驱动）；调用链带用户 signal | `options.signal === 用户 signal`（**非复合**）；`options._headerTimeoutMs === 600_000`；`_bodyIdleMs === 120_000` | AC-MA1-1 |
| T-MA1-2 | 边界 | 无用户 signal（`undefined`）（W10 后 = 核 `chat` 驱动） | `options.signal === undefined`（不再合成 `AbortSignal.timeout`）；请求照发 | AC-MA1-1 |
| T-MA1-3 | 错误 | 假流：两 chunk 后静默挂起 + `parseStream(..., { idleMs: 40 })` | 读循环以 `TimeoutError` 终止（name 判定）；错误消息含 `SSE idle timeout` | AC-MA1-2（W10 已退役——随镜像删档；删除记录 = 批次档 `2026-09-15-vsc-core-wiring.md` §5） |
| T-MA1-4 | 边界（对照） | 假流：每 20ms 持续有 chunk 至完成（idleMs=40） | **零误杀**——正常完成；timer 已清理（无悬挂 handle） | AC-MA1-2（W10 已退役——同前注；删除记录 = 批次档 §5） |
| T-MA1-5 | 边界（静态） | `src/provider.mjs（W10 已迁核——现体 `thincoder-core/provider/core.mjs`）` 源文本 grep | `AbortSignal.timeout(FETCH_TIMEOUT_MS)` 零命中；`_anySignal` 零残留（或定义即可见零调用——取删除） | AC-MA1-3 |

**（e）AC（机判）**：

- AC-MA1-1：T-MA1-1 / T-MA1-2 绿（请求信号 = 用户信号；头/body 相位参数在位）；
- AC-MA1-2：T-MA1-3 / T-MA1-4 绿（idle 判死 + 零误杀成对）；（W10 已退役——删除记录 = 批次档 §5；现体 = 核 sse 读侧看门狗）
- AC-MA1-3：T-MA1-5 绿（源文本零残留）+ 既有 provider 测试族零回归 + VSC 快层全绿 + 两仓 `check-doc-width` 新增违规 0。（W10 已退役——同前注；删除记录 = 批次档 §5）

**（f）差异登记（如实——不追赶）**：① CLI `anthropic.mjs` / `responses.mjs` 读循环无 idle（仅 sse / google 有）——本端四 transport 全配（本端自持选择，差异登记）；
② CLI 有 `agent.fetchTimeoutMs` 配置键（`effectiveFetchTimeoutMs`）——本端无（不加配置面，差异登记）；③ undici 直连隐式 bodyTimeout（≈300s）非本端承诺语义——**不依赖**（只作背景注）。

**（g）边界**：不改 `MAX_RETRIES` / 退避 / 429 语义；不改 `proxy.mjs`（`_headerTimeoutMs` / `_bodyIdleMs` 消费面零改）；不改 abort 溯源标注面（VSC 镜像标注/合成族不在本批）；**零 UI 面**。

**计数（D3）**：用例 5（T-MA1-1–5）· AC 3（AC-MA1-1–3）· 实施域 6 档（`provider.mjs` + 四 transport + 新测档）· 文档域 1 档（本档 §4.2/§4.3）。

## 5. Responses API transport（并入自 RESPONSES-TRANSPORT.md）

`format: "responses"`（四值之一，`src/provider/transports/responses.mjs`——W10 已迁核：现体 `thincoder-core/provider/responses.mjs`）。双轨：本地
会话/历史是唯一事实源（压缩/落档/恢复/跨端零变化）；`previous_response_id` 链只是**发送层
优化**，`store` 按 host 规则。流以 `response.completed/incomplete/failed` 结束，无
`data: [DONE]`。

### 5.1 支持矩阵（2026-08-31 官方文档 + 真机核实）

| 厂商/端点 | 格式 | previous_response_id | reasoning 明文回传 | 判定 |
|---|---|---|---|---|
| OpenAI 官方 `api.openai.com/v1` | ✅ | ✅ store:true 30 天 | ❌ encrypted | 完整 → 开链 |
| 百炼 Qwen `/compatible-mode/v1/responses` | ✅ | ✅ 7 天（传顶层 response id） | ✅ summary 明文 | 完整 → 开链 |
| 智谱 GLM `open.bigmodel.cn/api/v1`（Coding Plan） | ✅ | ✅ store:true 链全链路工作（store:false → 400） | ✅ | 升级白名单；内置工具走官方 MCP 生态 |
| DeepSeek `api.deepseek.com` | ✅ | ❌ **不支持**（官方明说静默忽略） | ✅ 明文 content | 灰名单：全量模式，链禁用 |
| Kimi / Moonshot | ❌ | — | — | 不接 |
| 火山方舟 | ✅ | 未核实 | 未核实 | 留位（一期不接） |

**host 白名单驱动链**（不能只靠服务端报错兜底——DeepSeek 静默忽略 = 无声丢上下文）：
`isStatefulHost`（openai.com 官方 / 百炼 dashscope·maas / bigmodel.cn）→ 开链；
`isNonStatefulHost`（deepseek.com）→ 全量 + 一次性 warning（`responses-stateful-unsupported`）。
`provider.stateful: true/false` 显式覆盖（高级逃生舱）。`isStoreRequiredHost`（百炼/GLM）
→ 开链必须 `store:true`（云端留存 7 天，首次 warning `responses-store-retention`）。

### 5.2 链状态机与增量

- **链 key**：`chainKey` = system 部分 + 最后一条 user 消息（turn 内不变、跨 turn/压缩变）。
  key 失配或 stateful:false 或灰名单 → 全量重建。
- **增量**：只发上一链轮未发送的 `function_call_output`（`chain.outputSent` 下标切）；无新增
  → 退化为全量（正确性优先）。
- **生命周期 = 单 turn**：runAgent 开始重置（发全量建链），turn 内工具往返用链增量；跨 turn
  无条件重建。`provider._responsesChain` 由 `chat()` 推进（completed 的 `responseId` 保存 /
  length·失败作废）。
- **event:error 帧（D11）**：百炼 SSE `data:{…}` 无空格 + `event:error` 帧（HTTP 200 内嵌
  业务 400，data 无 type）→ 必须识别抛错否则静默空响应。解析器兼容 data 无空格。
- **OpenRouter 变体**：`content_part.delta` + `part.type` 区分 + `response.done` 收尾。
- **内置工具（一期 web_search，D9）**：服务端执行（绕过本地权限门/审计——产品决策风险明示）；
  host 映射默认声明（openai/百炼/DeepSeek → `[{type:"web_search"}]`），
  `provider.builtinTools:false` 关闭、数组显式覆盖；结果 `builtinToolResults` → agent 本地化
  `role:"tool"` 消息 → 全量回传按 `web_search_call_` 前缀还原原样 `web_search_call` item
  （服务端自动恢复搜索结果）。
- **不接 streamRules（§5.4）**：responses 格式事件体与 sse.mjs 规则匹配器不同构——
  `ruleTriggered` 永不触发（配置了 abort/warn 规则的 responses 用户该保护不生效）。agent 层
  零改动——transport 返回既有 shape。

### 5.3 transport 契约（buildRequest / parseStream——逐字照抄 RESPONSES-TRANSPORT §3.1）

```js
export function normalizeTools(tools) // OpenAI function schema → {type:"function", name, ...} 扁平形态
export function buildRequest(provider, messages, tools) // messages → input items：
  // system 消息 → 不进 input，抽为顶层 instructions
  // user/assistant text → {type:"message", role, content:[{type:"input_text"|"output_text", text}]}
  // assistant tool_calls → {type:"function_call", call_id, name, arguments}
  // tool 结果 → {type:"function_call_output", call_id, output}
  // reasoning_content（历史回传）→ {type:"reasoning", content}（Qwen/GLM 支持；OpenAI 官方端点不回传明文）
  // 顶层：{ model, instructions, input, tools, stream:true, reasoning:{effort}, max_output_tokens, temperature }
export function normalizeUsageCache(u) // usage.input_tokens_details.cached_tokens → 现有 cache 字段
export async function parseStream(response, { onToken, onReasoning, signal }) // SSE 事件流 → 现有回调：
  // response.output_text.delta → onToken(delta)
  // response.reasoning_text.delta → onReasoning(delta)
  // response.function_call_arguments.delta → 聚合（arguments 累积）
  // response.completed → 组装最终 { content, toolCalls, usage }
  // response.incomplete / response.failed → 错误/截断信号
```

**实现差异注（vs 契约）**：responses transport 的 `buildRequest` 为满足链/白名单，返回
`{ url, headers, body, _chainMeta, _warnings, _previousResponseId }`（非纯 body）——链决策
元数据走非序列化 `_chainMeta`（chat() 读取推进；W10 已迁核——现体 `thincoder-core/provider/responses.mjs`）。`normalizeUsageCache` 在本 transport 内化
为私有 `normalizeUsage`（OpenAI 形态归一 DeepSeek 风格 cache 字段）。`parseStream` 额外返回
`responseId`（completed 事件）与 `builtinToolResults`（web_search_call）。`store` 顶层按
`wantStateful && hostStateful && isStoreRequiredHost` 判定。

**toolCalls 组装**：`response.output_item.added`（function_call item）建
`call_id → {id,name,args}` 槽位（`itemToCall` 记 item_id→call_id），
`response.function_call_arguments.delta` 按 `item_id` 累积，`output_item.done` 定稿；
`web_search_call` 在 output_item.done 收集进 `builtinToolResults`。最终 `{ id, name,
arguments }` 与 openai transport 输出一致，agent 循环零改动。

### 5.4 注册与格式选择

- `TRANSPORTS.responses = responsesTransport`（provider.mjs `getTransport` 按 `provider.format` 分派——W10 已迁核，现体 = `thincoder-core/provider/core.mjs` 的 format 分派）。
- provider 配置 `format: "responses"`。**本端接线**：custom Add-provider 表单 format 下拉现
  列 openai/anthropic/google（未加 responses 项）——responses provider 经 config.json 手写
  `format:"responses"` 或预设扩展启用；preset 不改（默认稳态 chat completions，responses
  显式 opt-in，CLI parity）。
- **续跑/压缩兼容**：agent 循环发统一 messages 数组，transport 负责 item 化——本地历史
  （压缩/落档/恢复）完全不知道 Responses 存在，零耦合。transport 无状态（放弃服务端状态），
  每次请求全量 input（跨 turn 链重置）——与 chat completions 一致。
- **GLM coding-plan**：不做 `zhipu-plan-responses` preset；不探测不降级（探测是隐藏决策，违背
  显式配置）——配了 responses 就按 responses 走，端点不支持得明确服务端错误。
- **finishReason 区分**：`response.incomplete` 非长度原因（content_filter 等）不能报成 length；
  `response.failed` 抛错；打断后半成品（interrupted+partial）与 core 对齐。

### 5.5 关键决策

| 决策 | 理由 |
|---|---|
| 只接完整支持者（用户拍板） | OpenAI 官方 + Qwen 百炼；DeepSeek（无状态残缺）/ Kimi（无端点）不接 |
| 双轨：本地事实源 + 链仅发送层 | 会话是核心资产；服务端 7 天过期且锁厂商 |
| 链 = 单 turn | 跨 turn/压缩/恢复/换模型漂移不可控；每 turn 重建把边界划在最稳点 |
| store 硬规则（百炼/GLM） | store:false 时 previous_response_id 一律 400 Not found（真机全组合验证） |
| host 白名单驱动链 | DeepSeek 静默忽略 = 无声丢上下文；灰名单全量 + warning |
| 不依赖流式 usage 帧 | completed 事件响应对象携带 usage（流末尾一帧） |
| 链失效自动回退 | 404/过期 → 全量重发一次（非报错）；链是优化非正确性依赖 |
| 不探测不降级 | 显式配置显式失败；重试/限流/错误语义与 chat 格式共用 |

## 6. 模型能力适配（spec 驱动）

### 6.1 MODEL_SPECS / specForModel

`src/config.mjs` MODEL_SPECS 自包含（无外部产品依赖）：`context` / `maxOutput` / `thinking`
/ `multimodal` / `partialMode` / `prefixMode` / `cacheMode` / `thinkApi`（type/effort）/
`thinkEnabledValue`（MiniMax `adaptive`）/ `reasoningEcho`（required 必须回传）/
`reasoningEffortEnum` + `reasoningEffortDefault` / `tempRange` / `noUsageStream` / `format`。

`specForModel(model)` 前缀匹配（每次临时按长度降序 sort）；**厂商前缀剥离（2026-09-04）**：
完整名前缀未命中且含 `/` → 剥首个 `/` 前 namespace 再匹配（`ZHIPU/GLM-5.3 → glm-5.3`），不
改 `provider.model`。未知模型 → `DEFAULT_SPEC`（128K/32K）+ warn once（IK5VGJ）。

**DeepSeek V4.1-Flash（2026-09-11 第 6 批）**：新增 `deepseek-flash` 行；两退役名
（`deepseek-v4-flash` / `deepseek-v4-flash-vision-exp`——仍收、当下即路由）参数随 V4.1-Flash
（v4-flash 加 `multimodal`）；`deepseek-v4-pro` 保留 + 注释（9/14 12:00 北京起路由 V4.1-Flash——
不预支视觉；该名视觉能力未核实、保守按无视觉；重评触发含 2026-09-14 路由生效后复检——
权威见 CLI 侧设计档 `PROVIDER.md` §19.5 #3）。行为面：前两名渠道进视觉判据/贴图放行；`deepseek-v4-pro` 保持非视觉。
（本批语义与 CLI 同源；设计/用例权威落 CLI 侧设计档 PROVIDER.md §18–§20（CLI 侧）。）

### 6.2 thinking / 续写 / reasoning_effort

- **openai buildRequest spec 驱动 thinking 默认**：`thinking:true` 模型（GLM/Kimi/…）provider
  没带时给显式 `thinking:{type: thinkEnabledValue || "enabled"}`（否则 GLM 静默跳过深思考）；
  显式 provider.thinking（含 null off）恒赢。
- **reasoning effort**：`provider.reasoningEffort` → `body.reasoning_effort`（spec enum 校验，
  §4 步 2）；`resolveReasoningMode`（reasoning-mode.mjs）把 UI 档位落 provider patch——
  "enabled"→`thinking:{type}`+effort 清 / "off"/"none"→`thinking:null`+`reasoningEffort:null`
  （真 off）/ effort 档→`reasoningEffort`+`thinking:undefined`（清 off marker）。
- **enable_thinking（Qwen §12）**：`resolveEnableThinking(provider, spec)` 白名单（qwen* 且非
  qwen3-coder 前缀 + 百炼 host）——显式 off（`thinking === null`）发 `enable_thinking:false`、
  effort 档发 `true`、未设置 undefined（服务端默认）。`isBailianHost` 键控（dashscope /
  .maas）。
- **tool_choice / parallel_tool_calls（2026-08-31 能力层）**：openai 直传；anthropic/google
  各自映射（mapToolChoice / mapFunctionCallingConfig；parallel 仅显式 true 时发）。
- **截断续写（§4 步 7，buildContinuationMessages）**：prefix（deepseek）——过滤全部 tool +
  assistant(tool_calls)，保留 system + 最近 ≤8 条非工具文本，末条 `{role:"assistant",
  content, prefix:true}` + reasoning_content 回传（prefix 续写带工具链必 400，真机矩阵）；
  partial（Kimi/Qwen/MiniMax）——`[...messages, tail({partial:true})]`。续写失败注入
  `_warnings`（continuation-failed）不整轮飞出；AbortError 透传。跨续写累计
  content/reasoning/toolCalls/usage。

### 6.3 escape v5 与 UTF-16 安全截断

`src/escape.mjs`（CLI v5 同构；W4 已迁核——现体 `thincoder-core/escape.mjs`）两个毒源：①字面 hex 转义二次解析（Kimi/deepseek 把 content
里的 `\x`/`\u` 再解释一遍，不足位 400）——`escapeLiteralEscapes` 按反斜杠 run 奇偶 double
（odd-run 修复）；②孤立 UTF-16 代理（emoji 截断切出孤立高代理 → deepseek `unexpected end of
hex escape`）——`sanitizeLoneSurrogates` 替换 U+FFFD。总入口 `sanitizeText`；
`escapeMessageContent` 覆盖 content（string/多模态 part 数组）/ `tool_calls[].arguments` /
`reasoning_content`；`escapeMessages` = stripLocalMessageFields（剥离 transient/ts）→ 逐条
escape。

`src/agent/run-helpers.mjs` `safeSliceUTF16` / `safeSliceUTF16Tail`：UTF-16 码元安全切点（高
代理 D800-DBFF 前收一码元；Tail 起点低代理前移、终点孤立高代理丢弃——VS 侧加固）。
`offloadToolResult` 大结果落盘用 `buildHeadTailPreview`（head 16K + 省略注 + tail，UTF-16
安全双端切片）+ 写时自清理（mtime 3 天，`TMP_RETENTION_MS`）。

### 6.4 畸形 tool_calls 防御（openai parseStream）

`mergeToolCalls` 槽选择优先级：index 有效（整数 ≥0）→ 按 index；缺 index 有 id → 按 id 归并；
缺 id 有 name → 新建尾槽；纯 arguments → 延续尾槽。null/畸形元素跳过 + 计数。
`finalizeToolCalls`：稀疏 hole 剔除、name 空槽丢弃计数、缺 id 合成 `call_N`（避让已用 id）。
`droppedToolCalls > 0` → agent 机读线注入提醒（模型需知道工具调用未执行）。非 SSE
content-type 兜底（网关把 stream:true 降级完整 JSON completion）；BOM 剥除；多行 data +
reasoning 方言（`reasoning_content`/`reasoning`）。

### 6.5 providerSpec context 覆盖

`providerSpec(provider)` = `specForModel(provider.model)` 拷贝覆盖（`{...spec, context:
provider.context * 1024}`），不污染共享 spec（跨 provider 串扰防护）；非法值忽略。
`ctxPercentForModel` 用带覆盖的 context 算利用率（防 1M 模型显示荒谬百分比）。压缩阈值 / tail
公式消费带覆盖 context（见 CONTEXT-COMPACTION）。

## 7. LLM 标题生成

`src/extension/generate-title.mjs`。触发 = 会话第一条 user 消息后 agent 完成回复
（`panel-chat.mjs` `_generateTitle`）。`generateTitle(userContent, providerName)` 取首条
文本（多模态 part 数组取 text）→ 用该 provider 发简短 prompt（"Generate a concise title
(max 40 chars…)"），**非流式** + `max_tokens: 100` + **逐 format 禁 thinking**（openai
`thinking:{type:"disabled"}` / anthropic `thinking:{type:"disabled"}` / google
`thinkingConfig:{thinkingLevel:"none"}`）——否则 reasoning_content 吃光输出预算内容空
（IK9UZ8）。失败静默降级返回 null（首条消息截断作标题兜底）。10s 超时；标题 trim 截 40 字符。

## 8. 图片输入（spec.multimodal 驱动，非硬编码模型表）

粘贴/拖拽/附加按钮：webview 传 dataURL → `panel-messages.mjs` `savePastedImages` 落盘
`<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`（`image-handler.mjs`；raster png/jpg/gif/webp
白名单 + >15MB 跳过）→ `setup.mjs` / `setup-reminders.mjs` `appendImagePointer` 给真实 user
消息追加 `[Attached images: …] — use the read_image tool to view them before answering.`
（**非多模态模型直接 throw**——可见错误不静默丢）→ 模型调 `read_image` 带图进载荷
（execute-tools multimodal 路径注入 part）。历史内容保持字符串（不回放 images）。文件随
offload 写时自清理回收（paste-* 同目录，无名字过滤）。

**2026-09-11（第 6 批）**：DeepSeek V4.1-Flash 系（`deepseek-flash` / 两退役名）`multimodal` 为真——
渠道默认模型为其中任一者时进入视觉判据/贴图放行；`deepseek-v4-pro` 保持非视觉（保守——§6.1）。

## 9. 变更记录（历史折叠——详见 git log 与并入源）

- 2026-09-11（群 A 批——VSC-MIRROR-SWEEP）：新增 §4.3（绝对墙钟废除——用户实证 "aborted due to timeout" 误报闭源；头相位 600s 保留 + 四 transport 读侧 idle 120s 补齐）；§4.2 超时行同步改写。
- 2026-09-11（第 6 批评审修正轮）：§6.1 决策口径同步——`deepseek-v4-pro` 视觉能力未核实（保守按
  无视觉）；重评触发含 2026-09-14 路由生效后复检（权威见 CLI 侧设计档 `PROVIDER.md` §19.5 #3；语义与 CLI 同源）。
- 2026-09-11（第 6 批 DeepSeek V4.1-Flash）：`deepseek` 预设默认模型 → `deepseek-flash`；规格行新增/
  对齐（`deepseek-flash` 新行 + 两退役名参数随 V4.1-Flash + `deepseek-v4-pro` 保留注释）——§2/§6.1/§8
  同步（语义与 CLI 同源；设计/用例权威落 CLI 侧设计档）。
- 2026-09-11（范围追加——用户裁定）：§3.2 webview 兜底行「未随本批对齐」→ **本批处置**（候选未命中 = 保持当前选择显示 + 零 post——M10；T29/AC-10 锁定〔T29 = 引例：批级编号；现体 = `test/model-picker-fallback.test.mjs`〕）；§3 叙述同步。
- 2026-09-11（范围追加评审修正轮）：§3 补「命中分支维持现状（同值回写）」+ 断言口径统一（零 `selectModel` / `selectReasoning` post）；§3.2 CLI 对位措辞精确化（会话值优先——`keep.model` 仅链尾）；webview 兜底行同步（显示与状态回落会话槽复合）。
- 2026-09-11：镜像档同步（O4）——MODEL-SELECTION v2 语义落地本端（§1 配置存储 / §2 预设 / §3.1 清单来源与渠道准入 / §3.2 双端差异）。
- 2026-09-09：MODEL-MERGE-SESSION 语义同步——§1 配置存储改写（三旧层删除 + defaultModel
  顶层复合 + providers[].models[] 候选 + 迁移核 config-migrate）；§2 Preset models 种子；
  §3 模型选择写会话槽（selectProviderModel config 写路径退役）+ 设置面板「默认模型」入口。

- 2026-09-08：DOC-REORG 第 2 批——本档自 ARCHITECTURE §5 迁出 + 并入 RESPONSES-TRANSPORT.md
  （内容合入 §5/§6 后删原文件）；RESPONSES buildRequest/parseStream 契约块逐字保留（§5.3）。
- 2026-08-31：Responses transport + tool_choice/parallel_tool_calls 能力层 + fetch 绝对墙钟
  拆分 + partial/interrupted 短路（§4/§5）。
- 2026-09-01：`FETCH_TIMEOUT_MS` 语义 + 读侧 idle 超时四 transport 共用（§4.2）。
- 2026-09-02：截断续写 400 止损根治（buildContinuationMessages + escape v5 + UTF-16 安全截断；
  §6.2/§6.3）；模型上下文可配置（§6.5）。
- 2026-09-04：厂商前缀剥离（§6.1 specForModel）。
- 2026-08-22/23：畸形 tool_calls 防御（§6.4）；LLM 标题 thinking 关闭（§7）。
