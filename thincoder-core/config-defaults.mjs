/**
 * config-defaults.mjs — the configuration default table itself (pure data, one comment per
 * non-obvious key). Split out of config.mjs so that changing a default value does not require
 * reading the whole loader: defaults (data) ∥ load-time normalization rules (logic) ∥ request
 * budget arithmetic were three unrelated things living in one file
 * (CONTEXT-COMPACTION.md §6.16.9 — C1 split, judged by responsibility, not by line count).
 *
 * Re-exported unchanged by config.mjs (`export { DEFAULTS }`) — the 34 importer files keep
 * their import path and this table keeps its name.
 */

import { join } from "node:path"
import { configDir } from "./config-io.mjs"

/** provider 响应体（body）阶段读侧空闲超时的单源缺省：provider 缺省 ∥ 传输层缺省同值同源。
 *  可经 `agent.bodyIdleTimeoutMs` 覆盖；`≤0` / 非有限数回退本值（不禁用——无现场判据）。 */
export const DEFAULT_BODY_IDLE_MS = 120000

export const DEFAULTS = {
  defaultModel: null, // top-level "provider:model" composite — new-session starting point (F-1)
  agent: {
    maxTurns: 200,
    subagentTurns: 100,
    subagentModel: null,  // default subagent model: "provider:model" | model name (parent provider); null = inherit parent provider
    subagentModels: {},   // per-type override: { explore, plan, coder, "eng-coder" } — priority: subagent tool model arg > this[role] > subagentModel > parent provider
    goalTurns: 200,
    // body 阶段读侧空闲超时（毫秒，TIMEOUT-DIGEST.md §2.1）：长生成只要有数据流动就不超时，
    // 连续该值无新 chunk 才断。登记进 DEFAULTS 是为了 `settings list` 可见（判据 A3）——
    // 与 `agent.fetchTimeoutMs`（只被 config 提升、不进本表）不同的一处偏离，理由即此。
    bodyIdleTimeoutMs: DEFAULT_BODY_IDLE_MS,
    // compactThreshold: 键缺省 = auto（CONTEXT-COMPACTION.md §6.17 三档落值）——无默认值：留着默认值
    // 会让每份配置看着都像显式。派生线只进 agent.compactThresholdResolved（内存面，不落盘）。
    verifyGuard: false,  // push model back to verify when files were mutated but verify not run (opt-in)
    // Multi-model consultation ("会诊") + escalate ("飞刀") — CLI parity with the VS Code plugin.
    // consultModels: candidate pool for BOTH consult and escalate ({ provider, model, effort? }, up to 5).
    consultModels: [],
    consultTurns: 40,      // per-consultant tool-turn budget (diagnosis tasks)
    consultTimeoutMs: 600000, // wall-clock ceiling per consultant (10min)
    streamRules: [],      // time-traveling stream rules: [{ pattern: "regex", message: "reminder", action: "abort"|"warn", repeat: "always"|"once" }]
    advisor: { guard: false },  // code review is always available; guard: true pushes completion back until reviewed (opt-in). Also accepts provider/model/thinking/reasoningEffort/timeoutMs overrides. Deprecated: enabled (2026-08-21)
    autoThink: false,     // auto-classify task difficulty and set reasoning effort per-turn
    engineering: false,   // initial default only — the runtime value is the session authority (MANIFEST.md §2.2 / ENGINEERING-MODE-V2.md §2.3 E5.1). Strict methodology enforcement — design-before-code (design review + user approval before code)
    // Async pool limits (AGENT-LOOP-ASYNC-POOL.md §6.10 D-24a/R14 + R13 — POOL-CONFIG-
    // UNIFIED 2026-09-09): { engCoder, other, advisor } — eng-coder pool / other-role
    // pool / advisor-review pool, defaults 4/4/4 (user ruling "eng-coder 四路，其他
    // 4 路" + advisor 评审池并入同一可配体系——三池统一默认 4)。engCoder/other
    // runtime-validated at every subagent pool admission (subagent-async
    // resolvePoolLimits); advisor runtime-validated at every advisor launch
    // (advisor-async advisorPoolLimitFor——F-2——两域读取器独立不共享)——非法/缺省
    // 回退 4——settings tool 与 /config 并发池菜单写此键——变更下个 spawn/launch 生效。
    // ⚠ 与 subagent-async.mjs ASYNC_POOL_LIMITS（两键）/advisor-async.mjs
    // ADVISOR_POOL_LIMIT 逐键同值（运行时回退常量）——耦合锚 T-24a4 断言锁住——
    // 勿单侧改默认。
    poolLimits: { engCoder: 4, other: 4, advisor: 4 },
    // §6.30.3 门三件③（D-TW5）：timer 空闲自唤醒开关——默认开（工具描述面已承诺到点提醒）；
    // false ⇒ 端侧不武装闩（回既有回合边界投递——零调度器面）。键面随 DEFAULTS 派生进 settings 类型表。
    timerWake: true,
    // 注入开关（PROMPT-SYSTEM.md §6.24 · 台账 #1420）：文档类 ∥ 记忆类自动注入——默认开；
    // 判据 `!== false`（缺省 = 现行为零变）。消费点 = 核 `agent/setup.mjs` 判点（逐 run 现读）。
    // 2026-10-15（§6.27 · 台账 #1465）：① 项目指令块独立成键——`injectDocs` 收窄为只管 ② 相关文档块；
    // 两键完全正交（关任一方另一方照常）。`injectProjectRules` 判点 = 核 `agent/setup.mjs`（`prepareRun` 项目指令段）。
    injectDocs: true,
    injectProjectRules: true,
    injectMemories: true,
  },
  memory: {
    dbPath: join(configDir, "memory.db"),
    projectDir: ".thincoder/memory",
    team: null,
    // 索引自维护（§6.14 面⑤ · 台账 #1096）：维护型备份保留枚数（轮转保最新 N——引擎钳 ≥ 1）
    maintain: { backupKeep: 2 },
  },
  shell: null,            // bash tool shell executable (e.g. "C:\\Program Files\\Git\\bin\\bash.exe" or "pwsh"); null = system default (cmd on Windows, /bin/sh elsewhere)
  embedding: {
    baseURL: "https://api.siliconflow.cn/v1",
    model: "BAAI/bge-m3",
  },
  mcp: {
    servers: [],
  },
  websearch: {
    // Structured search via Tavily when a key is set — empty apiKey → Bing RSS/HTML fallback (zero-config).
    apiKey: "",          // Tavily key (tvly-...) — optional
    // WEB-BACKEND-DEEPSEEK（CONFIG.md §6.5）：`auto` = a configured DeepSeek provider wins（TOOLS.md §6.23）；`local` = skip it.
    backend: "auto",
  },
  // fetch 工具的后端选择（CONFIG.md §6.5）——语义同 `websearch.backend`（`local` = 本地直取）。
  fetch: { backend: "auto" },
  // 浏览器工具（BROWSER-TOOL.md §3.2）：非空 ⇒ navigate 目标 host ∥ click/evaluate/type 的当前页 host 须命中
  //（全等（大小写不敏感）∥ `*.` 前缀 = 子域通配）——收束面非沙箱；缺省空 = 不设限。
  browser: { allowDomains: [] },
  traces: {
    enabled: false,  // §18.6 D-TR6 修订（2026-09-05 用户裁定——发布隐私："不希望用户那边也采集"）：轨迹存档默认 OFF——新用户零采集；本地调试分析可显式开（~/.thincoder/config.json traces.enabled:true）
    retentionHours: 24, // D-TR10：轨迹文件保留小时数——CLI 启动时删除超过该时长的文件（默认 24h）
  },
  // 诊断开关（用户面 ① 配置键——CONFIG.md §6.2 名录）：`heapWatch` 默认开（设 false 关闭）——自愈分支
  // 遥测；`heapSnapshot` 默认关——采集 opt-in（堆转储敏感度 ≥ traces ⇒ 对齐发布隐私先例 D-TR6；
  // 2026-09-30 采集收网批；桌面端运行期热读 ∥ CLI 本进程下次启动）
  diagnostics: { heapWatch: true, heapSnapshot: false },
}
