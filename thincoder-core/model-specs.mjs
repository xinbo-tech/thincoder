/**
 * model-specs.mjs — known model capability table + spec lookup (2026-08-31 extract).
 *
 * Split from config.mjs (which had grown to 358 lines, past the 300 advisory
 * line — TODO #1). config.mjs re-exports specForModel so the 23 existing
 * importers stay untouched. (PROVIDER_PRESETS has since moved out, to
 * config-presets.mjs — the core's single preset face, re-exported by config.mjs.)
 */

/**
 * Known model capability spec table (prefix match, longer first).
 * Used for compaction threshold derivation, continuation protocol selection, and capability-aware optimization.
 *
 * context:           context window (tokens)
 * maxOutput:         max output tokens (defaults to context)
 * thinking:          whether thinking/reasoning mode is supported
 * partialMode:       Kimi/Qwen Partial Mode truncation continuation (assistant message with partial:true)
 * prefixMode:        DeepSeek Prefix Completion truncation continuation (uses /beta endpoint, with prefix:true)
 * multimodal:        whether multimodal (image/vision input supported)
 * cacheMode:         context caching mode: "auto"=automatic / "prompt"=needs explicit / "none"=unsupported
 * thinkApi:          thinking API type: "type"=thinking.type field / "effort"=reasoning_effort field
 * thinkEnabledValue: when thinkApi is "type", the value used to enable thinking (default "enabled"; MiniMax uses "adaptive")
 * reasoningEcho:     reasoning_content cross-turn echo strategy: "required"=must echo (error if missing) / "optional"=echo optional (default: don't echo)
 * reasoningEffortEnum: valid reasoning_effort enum values (if undeclared, no validation — passed through as-is)
 * tempRange:         valid temperature range [min, max] (if undeclared, no clamping)
 */
const MODEL_SPECS = [
  // DeepSeek V4.1 series (2026-09-11). `deepseek-flash` = DeepSeek-V4.1-Flash (in service):
  // 1M ctx / 384K out, thinking on by default (effort low/high/max), Chat Prefix Completion
  // beta, automatic disk cache, vision. The two legacy names below are RETIRED — the server
  // still accepts them and serves them from V4.1-Flash today (no switch window), so their
  // rows carry the V4.1-Flash parameters (v4-flash gains multimodal).
  ["deepseek-flash",    { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
// deepseek-v4.1-flash = qwen-plan channel name for DeepSeek V4.1-Flash (token-plan GET /models verified 2026-09-15) — same fields as the row above; ".1" ≠ "-" so plain prefix lookup misses the existing rows (D-PR25)
  ["deepseek-v4.1-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  // deepseek-v4-pro (V4-Pro-0813): fields unchanged — 视觉面 **未探**（不声明 multimodal——保守；
  // 补探登记见 MODEL-SPECS.md §13.4）. From 2026-09-14 12:00 Beijing all requests route to V4.1-Flash.
  ["deepseek-v4-pro",   { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2] }],
  // deepseek-v4-flash: RETIRED name — still accepted, served by V4.1-Flash today → aligned row
  ["deepseek-v4-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  // deepseek-v4-flash-vision-exp: retired experimental vision name — still accepted (V4.1-Flash)
  ["deepseek-v4-flash-vision-exp", { context: 1_000_000, maxOutput: 384_000, thinking: true,  prefixMode: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  // Kimi series
  ["kimi-k3",           { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // Qwen router prefixes model IDs with provider namespace: kimi/kimi-k3 → kimi-k3 (IK7K4V)
  ["kimi/kimi-k3",      { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // Kimi For Coding endpoint uses the short model ID "k3" (same specs as kimi-k3) — IK5VGJ
  ["k3",                { context: 1_000_000, maxOutput: 131_072, thinking: true,  partialMode: true, multimodal: true, cacheMode: "auto",  thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  // kimi-k2.6 / kimi-k2.7-code / kimi-k2.7-code-highspeed（三行同形 · 2026-09-24 bench 名单批）：temperature **仅受理 1** = **校验级**
  // （400 原文「invalid temperature: only 1 is allowed for this model」· roster-expand §2.2）；尺寸位 = **未取证**
  // （沿现盘兜底值——建行不改变生效值）；**不得声明 tempRange**（KD-31 例外档不变量：入档值 = 实发值）；枚举 / 视觉面 = **未探**。
  ["kimi-k2.6",                { context: 128_000, maxOutput: 32_000 }],
  ["kimi-k2.7-code",           { context: 128_000, maxOutput: 32_000 }],
  ["kimi-k2.7-code-highspeed", { context: 128_000, maxOutput: 32_000 }],
  // GLM series
  // GLM-5.3: thinking always-on (no "disabled"); effort converges to low/high/max — NOT the
  //          7-level glm-5.2 enum (verified vs docs.bigmodel.cn GLM-5.3 page, 2026-08).
  //          视觉面 **未探**（不声明 multimodal——保守；补探登记见 MODEL-SPECS.md §13.4）。
  ["glm-5.3",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.3-flash",     { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  // glm-5.3-flashx（GLM-5.3-FlashX，2026-09 上线）——独立行（不再蹭 flash 前缀行）：maxOutput 131_072 =
  // **校验级**（400「max_tokens…限制数值范围[1,131072]」）；effort 枚举 ["low","high","max"] = **校验级**
  // （400 原文点名：low/high/max 受理，其余拒绝）。multimodal = **实测**（8×8 纯红 PNG → 答「红色」）。
  // thinking = **实测**且**始终思考**（`thinking:{type:"disabled"}` → 400；裸请求默认开）——off 动作在
  // UI 侧为 no-op（服务端无关闭路径）。其余 = **族沿用** flash 行（context 网络口径未探边；
  // cacheMode / thinkApi / reasoningEcho / tempRange / noUsageStream = 前缀命中路径日常在用）。
  // flash 行 128_000 系其自身口径，不得对齐本行（AC-3 零回归）。
  ["glm-5.3-flashx",    { context: 1_000_000, maxOutput: 131_072, thinking: true, multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5.2",           { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-5",             { context: 1_000_000, maxOutput: 128_000, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["max", "xhigh", "high", "medium", "low", "minimal", "none"], tempRange: [0, 1], noUsageStream: true }],
  ["glm-4",             { context: 128_000,   maxOutput: 32_000,  thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true }],
  // glm-4.5-air（智谱轻档 · 2026-09-24 bench 名单批）：temperature 0 受理 = **实测**（roster-expand §2.2）；其余 = **族沿用 glm-4 行**
  // （逐名官方口径未取证）；枚举 / 视觉面 = **未探**（不声明）。medium 直发实测受理（batch-params-judge §1.5）。
  ["glm-4.5-air", { context: 128_000, maxOutput: 32_000, thinking: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true }],
  // GPT series
  ["gpt-5.6-sol",       { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-5.6",           { context: 1_050_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "prompt" }],
  ["gpt-4.1",           { context: 1_000_000, maxOutput: 128_000, thinking: false, cacheMode: "prompt" }],
  ["gpt-4o",            { context: 128_000,   maxOutput: 16_000,  thinking: false, multimodal: true, cacheMode: "prompt" }],
  // Qwen series
  // qwen3.7-max：**实测拒图像**（DashScope 400 "Unexpected item type in content"——真值彩图探针，2026-09-20）
  // ⇒ 无视觉 = **不声明**（T-7 语义单一：multimodal 仅 true / undefined；补探已毕，无需再探）
  ["qwen3.7-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "high"], tempRange: [0, 2] }],
  // qwen3.7-flash / qwen3.8-flash (2026-09-20): thinking + effort enum + maxOutput + image intake
  // are server-MEASURED (batch 2026-09-20-qwen-flash-specs §1.2 — bare request carries reasoning_tokens
  // 166/27; 400 literal lists the enum; max_tokens range [1, 131072]). 3.7-flash enum has NO "max"
  // (6 levels), 3.8-flash adds it (7); enum order = the server's literal order, first member "none"
  // (D-5) — never re-sort by strength. context = doc/web statement (1M class, not API-measured);
  // partialMode / cacheMode / thinkApi / tempRange = same-family carry-over (not independently
  // measured on these rows); reasoningEcho stays undeclared (cross-turn echo unverified — R-4).
  ["qwen3.7-flash",     { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // qwen3.7-plus（2026-09-24 bench 名单批）：context = **官方口径（网络转述）**（2026-09-20 qwen-flash-specs 批 AC-6 已裁允许入表——「100 万长文档」族点名）；
  // maxOutput / partialMode / cacheMode / thinkApi / tempRange / thinking = **族沿用 qwen3.7-flash 行**；枚举 / 视觉面 = **未探**（不声明）。
  ["qwen3.7-plus",      { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  ["qwen3.8-flash",     { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"], tempRange: [0, 2] }],
  ["qwen3.8-max",       { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], tempRange: [0, 2] }],
  // qwen3.8-omni-flash / qwen3.8-27b — parent 80-token probe (batch §1.8-①): reasoning_content
  // present, reasoning_tokens 49, `effort:"none"` removes it ⇒ thinking MEASURED; enum / maxOutput
  // / image intake measured the same way. omni-flash: context = doc/web statement (1M class, not
  // API-measured); partialMode / cacheMode / thinkApi / tempRange = same-family carry-over;
  // reasoningEcho undeclared (cross-turn echo unverified — R-4). The server also takes audio, this
  // repo's call path sends images only ⇒ multimodal below = image intake (no `modalities` field, §2.7).
  ["qwen3.8-omni-flash",{ context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"], tempRange: [0, 2] }],
  // 27b: context 262_144 = doc/web statement, the native value (1M is YaRN extrapolation, local
  // deploy only); partialMode / cacheMode / thinkApi / tempRange same-family carry-over; reasoningEcho
  // undeclared (cross-turn echo unverified — R-4).
  ["qwen3.8-27b",       { context: 262_144,   maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"], tempRange: [0, 2] }],
  // No generic "qwen" fallback row: unlisted qwen names deliberately resolve to DEFAULT_SPEC
  // (128K / 32K, no vision) — per-name disposition in docs/core/design/MODEL-SPECS.md §2.4.
  // Do not re-add a blanket prefix row (silent inheritance is how missing rows stayed invisible).

  // qwen3.6 系五行（批 2026-09-20-qwen36-family-rows · 五名同形，取证叙述落此一处全量）：
  // effort 枚举六档 = **校验级**（`max` → 400 原文点名 none/minimal/low/medium/high/xhigh——无 max，
  // ≠ 3.8 系七档）；maxOutput 65_536 = **校验级**（400「Range of max_tokens should be [1, 65536]」；
  // 65536 → 200）。thinking / multimodal = **实测**（裸请求 rc=143–239 默认开、none/minimal rc=0 可关；
  // 64×64 纯红 PNG 五名受理）。context = **官方口径**（未探边，文档口径非 API 实测）；partialMode /
  // cacheMode / thinkApi / tempRange = **族沿用**（qwen3.7/3.8 行先例）；reasoningEcho 不声明
  // （跨轮回声未验——R-4）。日期戳快照名不登——前缀命中母名行（有意继承）。
  ["qwen3.6-flash",     { context: 1_000_000, maxOutput: 65_536, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // qwen3.6-plus：同形行（共享证据块见 flash 行上）——校验级 maxOutput / 六档枚举、官方口径 context、族沿用机制位。
  ["qwen3.6-plus",      { context: 1_000_000, maxOutput: 65_536, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // qwen3.6-max-preview：同形行——校验级 maxOutput / 六档枚举、官方口径 context、族沿用机制位；视觉通道实测 ✓ 但纯红图答「黑色」（抽样波动，如实记）。
  ["qwen3.6-max-preview", { context: 1_000_000, maxOutput: 65_536, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // qwen3.6-27b：同形行——校验级 maxOutput / 六档枚举、官方口径 context（未探边）、族沿用机制位。
  ["qwen3.6-27b",        { context: 1_000_000, maxOutput: 65_536, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // qwen3.5-27b（2026-09-24 bench 名单批）：context 262_144 = **官方口径（定价页分档佐证——[128K, 256K) 档在售；规格页未逐名核）**；
  // maxOutput / 机制位 = **族沿用 qwen3.6-27b 行**；枚举 / 视觉面 = **未探**（不声明）。
  ["qwen3.5-27b",        { context: 262_144, maxOutput: 65_536, thinking: true, partialMode: true, cacheMode: "none", thinkApi: "effort", tempRange: [0, 2] }],
  // qwen3.6-35b-a3b：MoE 后缀（a3b = 激活参数量级）——校验级 maxOutput / 六档枚举、官方口径 context、族沿用机制位。
  ["qwen3.6-35b-a3b",    { context: 1_000_000, maxOutput: 65_536, thinking: true, partialMode: true, multimodal: true, cacheMode: "none", thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], tempRange: [0, 2] }],
  // MiniMax series
  // effort（`reasoning_effort`）在 MiniMax 族 = **无生效面**（**实测**：effort 被忽略——`none` / `medium` 均 rc 在场；
  // off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）——medium 照发仅口径统一（batch-params-judge §1.2 / KD-32④）。
  ["MiniMax-M3",        { context: 1_000_000, maxOutput: 128_000, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  // MiMo series (Xiaomi — OpenAI-compatible https://api.xiaomimimo.com/v1; deep thinking via
  // thinking.type, default ON). Family echo policy stays conservative ("required" — tool rounds
  // always echo); 2026-09-22 re-probe: value / missing field / empty string all 200 — the
  // 2026-09-20 "must be passed back" 400 was NOT reproduced. v2.5 rows aligned 2026-09-22:
  // maxOutput 131_072 = **校验级**; cacheMode "auto" = **实测** (2nd same-prefix round cached 18,816).
  ["mimo-v2.5-pro",     { context: 1_000_000, maxOutput: 131_072, thinking: true,  cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  ["mimo-v2.5",         { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // MiMo V2.6 series (2026-09-22 launch — three independent rows, each probed individually).
  // maxOutput 131_072 / tempRange [0, 1.5] = **校验级** (400 "at most 131072 completion tokens" /
  // "temperature must be within [0, 1.5]", per model); thinking = **实测** (bare request carries
  // reasoning_content; thinking.type disabled → rc gone ⇒ thinkApi "type" = measured face) and
  // multimodal = **实测** (8×8 pure-red PNG, pro / flash answered "Red"); cacheMode "auto" = **实测**
  // (cached_tokens 18,688). context 1_000_000 = **官方口径** (docs); reasoningEcho = **族沿用**.
  // effort（`reasoning_effort`）在三款 V2.6 = **无生效面**（**实测**：effort 被忽略——`none` / `medium` 均 rc 在场；
  // off 路径 = `thinking:{type:"disabled"}` ✓ rc=0）——medium 照发仅口径统一（batch-params-judge §1.2 / KD-32④）。
  ["mimo-v2.6-pro",     { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // mimo-v2.6-flash: same row shape as pro — maxOutput 131_072 / tempRange [0, 1.5] = **校验级**,
  // thinking / multimodal / cacheMode = **实测**, context = **官方口径**, reasoningEcho = **族沿用**.
  ["mimo-v2.6-flash",   { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // mimo-v2.6-pro-ultraspeed: same row shape — same grades as flash (**校验级** / **实测** /
  // **官方口径** / **族沿用**); image answer at a 64-token budget was truncated — "Red" at 512.
  ["mimo-v2.6-pro-ultraspeed", { context: 1_000_000, maxOutput: 131_072, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
  // minimax-m3（小写前缀行——与上方 MiniMax-M3 行同值，同族两写法）：effort 同按**无生效面**处置
  // （**实测**：effort 被忽略；off 路径 = `thinking:{type:"disabled"}` ✓ rc=0——batch-params-judge §1.2 / KD-32④）。
  ["minimax-m3",        { context: 1_000_000, maxOutput: 128_000, thinking: true,  multimodal: true, cacheMode: "auto", thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  ["minimax-m1",        { context: 256_000,   maxOutput: 128_000, thinking: false, cacheMode: "auto", noUsageStream: true }],
  // MiniMax-M2.7（前缀行——覆盖标准档与 -highspeed · 2026-09-24 bench 名单批）：thinking = **实测**（裸请求 rc 在场）；off 路径 **未找到**
  // （`thinking:{type:"disabled"}` 不生效——如实，不声明 thinkApi）；effort 被忽略 ⇒ **无生效面**（枚举不声明；medium 照发仅口径统一）；
  // 尺寸 / cacheMode / noUsageStream = **族沿用 minimax-m1 行**；视觉面 = **未探**（不声明）。
  ["MiniMax-M2.7", { context: 256_000, maxOutput: 128_000, thinking: true, cacheMode: "auto", noUsageStream: true }],
  // Grok series (xAI — OpenAI-compatible)
  // grok-4.x: 500K context per xAI Grok 4.6 spec (corrected 2026-08; earlier entries said 1M)
  ["grok-4.6",          { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4.5",          { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4",            { context: 500_000,   maxOutput: 64_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["grok-4-mini",       { context: 128_000,   maxOutput: 16_000,  thinking: false, tempRange: [0, 2] }],
  // Mistral series (OpenAI-compatible)
  ["mistral-large",     { context: 128_000,   maxOutput: 32_000,  thinking: false, multimodal: true, tempRange: [0, 2] }],
  ["codestral",         { context: 256_000,   maxOutput: 32_000,  thinking: false, tempRange: [0, 2] }],
  // Claude series (Anthropic)
  ["claude-opus-5",     { context: 1_000_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-sonnet-5",   { context: 1_000_000, maxOutput: 128_000, thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-opus-4",     { context: 200_000,   maxOutput: 32_000,  thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-sonnet-4",   { context: 200_000,   maxOutput: 32_000,  thinking: false, multimodal: true, cacheMode: "none", format: "anthropic" }],
  ["claude-3.5-haiku",  { context: 200_000,   maxOutput: 8_192,   thinking: false, cacheMode: "none", format: "anthropic" }],
  // Gemini series (Google)
  ["gemini-3-pro",      { context: 1_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
  ["gemini-2.5-pro",    { context: 2_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
  ["gemini-2.5-flash",  { context: 1_000_000, maxOutput: 64_000,  thinking: false, multimodal: true, cacheMode: "none", format: "google", noUsageStream: true }],
  // Tencent Hunyuan (TokenHub — 聚合网关 `https://tokenhub.tencentmaas.com/v1`；批 2026-09-20-channel-onboarding)
  // hy3：thinking / thinkApi / effort 枚举 = **本渠道实测**——裸请求 reasoning_content 在场（tok=16），
  // `reasoning_effort:"none"` 即消失（实测唯一有效 off 路径）。枚举 = 七值**受理级探针**（七值全 200 受理；
  // 乱值 400 泛化拒收、服务端不列枚举——等级低于 seed 的「服务端真校验」，两族同值集但等级不混）；
  // 序 = 服务端原文序、首项 "none"，**禁按强度重排**（D-5）。multimodal：**不声明**——真值 32×32 纯红图
  // 答 "Unknown"（对照组明说不识图）⇒ 实测无视觉。尺寸位两级逐条标（AC-2）：maxOutput 128_000 =
  // **参考实配**（网关对 max_tokens 不硬拒 ⇒ 上限未证）；context 256_000 = **网络口径**（他仓/文档 256K，未本渠道实测）。
  ["hy3",               { context: 256_000, maxOutput: 128_000, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
  // hy3-preview（在场实测：/models + 401 前验活；能力位**未探针**）——**尺寸行**：仅登记尺寸位，取值 =
  // hy3 **同族沿用**（maxOutput 参考实配 / context 网络口径）。D-11：能力位不跨名沿用 ⇒ thinking / 枚举 / 视觉全不声明。
  ["hy3-preview",       { context: 256_000, maxOutput: 128_000 }],
  // hy4-preview（在场实测：/models + 401；能力位**未探针**）——尺寸行：取值 = hy3 族**同族沿用**
  // （maxOutput 参考实配级取值 / context 网络口径；批次档 §1.2 未给该名尺寸行 ⇒ 上报清单 2，行注即标级）。
  ["hy4-preview",       { context: 256_000, maxOutput: 128_000 }],
  // Doubao Seed (Volcano Ark — `https://ark.cn-beijing.volces.com/api/v3`；批 2026-09-20-channel-onboarding)
  // 两档全针实测：裸请求 reasoning_content 在场（code tok=219 / lite tok=161）、`effort:"none"` 即消失 ⇒
  // thinking / thinkApi = 实测；枚举 = **服务端真校验级**（乱值 400 明列 invalid + 七档全 200）⇒ 七值即服务端值域；
  // maxOutput 131_072 = **实测**（262 144 → 400 "above maximum"）；context 256_000 = **官方口径**（官方 256K）
  // + **实测**下界 210K 输入受理（探至账号 429 停手）；multimodal = 实测（纯红图答 "Red"）。
  ["doubao-seed-2-0-code-preview-260215", { context: 256_000, maxOutput: 131_072, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"], multimodal: true }],
  // seed-lite = 同族全针（批次档 §1.2 lite 行：思考 tok=161 / 视觉 "Red" / 上限 131 072 / echo 真名）——
  // context 同按 **官方口径** + **实测**下界标注；行独立（同值集 ≠ 同行：改一行不动另一行）。
  ["doubao-seed-2-0-lite-260428", { context: 256_000, maxOutput: 131_072, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"], multimodal: true }],
  // doubao-seed-2-1 三档（火山方舟 · 2026-09-24 bench 名单批 · 三行同形）：thinking / thinkApi / 枚举 = **实测**
  // （裸请求 rc 在场；`reasoning_effort:"none"` → rc=0；七值全 200、乱值 400 泛化 ⇒ **受理级**——等级低于 2.0 行的
  // 「真校验」，同值集不混级）；maxOutput 524_288 = **受理级**（262 144 / 524 288 均受理；**上限未证**）；
  // context = **族沿用 2.0 行**（官方口径未逐名取证）；**视觉面未探**（不声明——如实标级，不冒充实测）。
  ["doubao-seed-2-1-pro-260915",   { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
  ["doubao-seed-2-1-turbo-260628", { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
  ["doubao-seed-2-1-lite-260915",  { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort", reasoningEffortEnum: ["none", "minimal", "low", "medium", "high", "xhigh", "max"] }],
]
const DEFAULT_SPEC = { context: 128_000, maxOutput: 32_000, cacheMode: "none" }

/** Look up spec by model name prefix (case-insensitive), conservative default for unknown models.
 *
 * Vendor-namespace prefix stripping (2026-09-04)：第三方 token 市场（roapi/new-api/one-api/
 * aiproxy 聚合网关）惯例在模型名前加厂商前缀（zhipu/glm-5.3、openai/gpt-4o）。完整名未命中
 * 且含 "/" 时，剥掉第一个 "/" 前的 namespace 再按前缀匹配一次——ZHIPU/GLM-5.3 → glm-5.3 命中
 * 真实规格，不再降级 128K 默认。kimi/kimi-k3 的显式 alias 行保留为文档锚（发送路径
 * provider.core isRouter 依赖含 "/" 判定），通用机制已覆盖同类。 */
const warnedModels = new Set() // warn once per model name — spec lookup runs on every request (hot path)
// Pre-sorted once at module scope — spec lookup runs on every request (agent, provider core,
// context, auto-think, TUI rendering); re-sorting per call was wasteful.
const SORTED_SPECS = [...MODEL_SPECS].sort((a, b) => b[0].length - a[0].length)

/** Single table lookup shared by specForModel / specMatch — prefix match (case-insensitive)
 *  with vendor-namespace stripping. Returns null on a miss (DEFAULT_SPEC is the caller-side
 *  fallback and is deliberately NOT returned here — `matched` needs the miss itself). */
function lookupSpec(model) {
  const m = (model ?? "").toLowerCase()
  for (const [prefix, spec] of SORTED_SPECS) {
    if (m.startsWith(prefix.toLowerCase())) return spec
  }
  // Vendor-namespace strip: vendor/model — retry the prefix match on the bare model part.
  const slash = m.indexOf("/")
  if (slash > 0) {
    const bare = m.slice(slash + 1)
    for (const [prefix, spec] of SORTED_SPECS) {
      if (bare.startsWith(prefix.toLowerCase())) return spec
    }
  }
  return null
}

/** Unknown model: warn ONCE (not per request) so a typo'd ID or a missing alias surfaces
 *  instead of silently degrading to the 128K default (IK5VGJ). The dedupe set is shared by
 *  specForModel / specMatch (PROVIDER.md §16 M5). */
function warnUnknownModel(model) {
  const m = (model ?? "").toLowerCase()
  if (m && !warnedModels.has(m)) {
    warnedModels.add(m)
    console.warn(`[config] model "${model}" not found in MODEL_SPECS — using default spec (128K context, 32K output). Check the model ID or add an alias.`)
  }
}

export function specForModel(model) {
  const hit = lookupSpec(model)
  if (hit) return hit
  warnUnknownModel(model)
  return DEFAULT_SPEC
}

/** specMatch(model) → { spec, matched }（PROVIDER.md §16 M5——切换回显的来源判定）。
 *  `matched:false` = DEFAULT_SPEC 兜底（未知模型）；与 specForModel 共享同一查表实现（单次），
 *  specForModel 的返回形状与共享对象契约零改（热路径零变）。 */
export function specMatch(model) {
  const hit = lookupSpec(model)
  if (hit) return { spec: hit, matched: true }
  warnUnknownModel(model)
  return { spec: DEFAULT_SPEC, matched: false }
}

/**
 * providerSpec(provider) — spec with a provider-level context override (PROVIDER.md §15, 2026-09-02).
 *
 * providers[].context is configured in K units (128 = 128K = 131072 tokens) and overrides the
 * MODEL_SPECS value for THIS provider only — the same model can have different real context
 * windows on different endpoints (official vs local deployment). The ×1024 conversion happens
 * HERE and nowhere else.
 *
 * Returns a COPY ({ ...spec, context }) — the shared spec object from the SORTED_SPECS lookup
 * must never be mutated, or the override would leak across providers (T-C1).
 *
 * Validation is defensive (pure function): absent/invalid context falls back to the plain spec
 * (config.mjs loadConfig already warns + strips invalid values; this guard covers direct callers
 * and keeps the function total). specForModel stays a pure table lookup — callers without a
 * provider keep using it.
 */
export function providerSpec(provider) {
  const spec = specForModel(provider?.model ?? "")
  const k = Number(provider?.context) // Number() 接受数字字符串（"128"）——两端语义统一（code review #1）
  if (Number.isInteger(k) && k > 0) return { ...spec, context: k * 1024 }
  return spec
}

/**
 * assistantToolCallMessage(response, spec) — the tool-round assistant message pushed onto the
 * machine line (D-CC22, #109 — live-push face of the echo-safety family; single construction
 * point, CONTEXT-COMPACTION.md §6.10 #9).
 *
 * `reasoningEcho:"required"` families (deepseek / kimi / mimo) MUST carry the reasoning echo on
 * every tool-call assistant message: the field is NEVER omitted — an absent/non-string
 * `response.reasoning` is echoed as `""` (2026-09-22 re-probe: value / missing field / empty
 * string all 200 — the 2026-09-20 "must be passed back" 400 was NOT reproduced). `optional` /
 * undeclared families (incl. DEFAULT_SPEC) never get the field (behavior byte-identical).
 *
 * Callers: thincoder-core/agent.mjs (main loop) · thincoder-core/advisor/loop.mjs (review
 * mirror) · thincoder-vscode/src/agent.mjs (shell loop) — each passes its own spec face.
 */
export function assistantToolCallMessage(response, spec) {
  const msg = {
    role: "assistant",
    content: response.content || null,
    tool_calls: response.toolCalls.map((tc) => ({
      id: tc.id, type: "function",
      function: { name: tc.name, arguments: tc.arguments },
    })),
  }
  if (spec?.reasoningEcho === "required") {
    msg.reasoning_content = typeof response.reasoning === "string" ? response.reasoning : ""
  }
  return msg
}
