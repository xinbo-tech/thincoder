// smoke-qwen-thinking.mjs — 真实端点 T7 冒烟：验证 enable_thinking 映射在百炼 Qwen 上真正生效
// 用法：node test/smoke-qwen-thinking.mjs [providerName]   （默认 qwenplan，回退 qwen）
// 在本机运行。从 ~/.thincoder/config.json 读 baseURL/model/apiKey —— key 不打印、不外传、不落盘。
// 三连测（走 CLI 真实 chat() 全链路，含 resolveEnableThinking 注入）：
//   1. OFF  ：provider.thinking = null    → 期望响应 reasoning 为空（enable_thinking:false 生效）
//   2. XHIGH：provider.reasoningEffort    → 期望响应 reasoning 非空（思考恢复）
//   3. 对照  ：无思考字段                  → 服务端默认（qwen3.x 默认思考）→ reasoning 非空
// 通过 = OFF 无思考 且 XHIGH/对照 有思考 且 三请求均无 400/网络错误。退出码 0/1。

/**
 * 真实端点 smoke（enable_thinking 映射）：花真金白银的 token + 网络抖动，
 * 不进常规测试层——仅 THINCODER_SMOKE=1 时运行（发版前人工跑）。
 */
if (process.env.THINCODER_SMOKE !== "1") {
  console.log("[smoke] skipped — set THINCODER_SMOKE=1 to run against the real endpoint")
} else {
  // Dynamic import: a static `import` inside the else block is illegal ESM
  // (import declarations must be top-level) — the prepublishOnly glob
  // `node --test "test/*.mjs"` collects this file, parsed it, and the
  // SyntaxError aborted the npm publish prepublish gate (0.12.51, 2026-08-30).
  const { loadConfig } = await import("../src/config.mjs")
  const { chat } = await import("../src/provider/index.mjs")

const cfg = loadConfig()
const want = process.argv[2] ?? "qwenplan"
const prov = cfg.providers.find((p) => p.name === want) ?? cfg.providers.find((p) => /^qwen/i.test(p.name))
if (!prov) {
  console.error(`no provider "${want}" in config (available: ${cfg.providers.map((p) => p.name).join(", ") || "none"})`)
  process.exit(2)
}
if (!prov.apiKey) {
  console.error(`provider "${prov.name}" has no apiKey — can't smoke-test without a key (your key stays local)`)
  process.exit(2)
}

// 2026-08-31：smoke 的 OFF 语义（enable_thinking:false 必须生效）只对**白名单百炼 qwen**
// 成立（T4/T5 判例：非白名单域/非 qwen3 型号 → 不映射 thinking，服务端默认思考，OFF 必失败）。
// 本机现实：qwenplan 常挂 deepseek 等模型——此时 smoke 无目标模型，skip（exit 0），
// 打印原因并指引——不是失败（环境不满足，非测试失败）。发版判断人工确认。
const { isBailianHost } = await import("../src/provider/normalize.mjs").catch(() => ({}))
const baiHost = isBailianHost ? isBailianHost(prov.baseURL ?? "") : false
const qwenModel = /^qwen/i.test(prov.model ?? "") // T5 判例：qwen3-coder 等非思考型号排除——目标是 enable_thinking 白名单 qwen 思考型号
if (!baiHost || !qwenModel) {
  console.log(`[smoke] skip — provider "${prov.name}" model=${prov.model} 非白名单百炼 qwen 思考型号（enable_thinking:false 映射只对百炼 qwen 生效；OFF 断言需要该目标）。指定百炼 qwen 模型（配置 providers 或传 provider 名参数）后再跑。`)
  process.exit(0)
}

const base = { baseURL: prov.baseURL, apiKey: prov.apiKey, model: prov.model, maxTokens: 2048 }
console.log(`provider=${prov.name} model=${prov.model} baseURL=${prov.baseURL.replace(/^https?:\/\//, "")}`)

const messages = [{ role: "user", content: "用一句话回答：9.9 和 9.11 谁大？" }]

async function one(label, patch) {
  const t0 = Date.now()
  try {
    const res = await chat({ ...base, ...patch }, { messages }, {})
    const ms = Date.now() - t0
    const reasoning = (res.reasoning ?? "").trim()
    const content = (res.content ?? "").trim()
    console.log(`${label.padEnd(10)} ms=${ms} finish=${res.finishReason ?? "?"} reasoning=${reasoning.length > 0 ? `${reasoning.length} chars` : "(none)"} content=${content.length ? `${content.length} chars` : "(empty)"}`)
    return { reasoning: reasoning.length > 0, content: content.length > 0, ms }
  } catch (e) {
    const msg = typeof e === "string" ? e : e?.message ?? String(e)
    console.log(`${label.padEnd(10)} ERROR: ${String(msg).slice(0, 300)}`)
    return { error: msg, ms: Date.now() - t0 }
  }
}

const off = await one("OFF", { thinking: null })
// 2026-08-31：XHIGH 档不再写死 "xhigh"——上游模型枚举各异（deepseek-v4-flash 是 low/high/max，
// qwen3 是 low/medium/high/xhigh）——取 spec 枚举末值（"最高档"语义，任何模型通用）
const { specForModel } = await import("../src/model-specs.mjs")
const spec = specForModel(prov.model)
const effortHigh = spec?.reasoningEffortEnum?.slice(-1)[0] ?? "high"
const xh = await one("XHIGH", { reasoningEffort: effortHigh })
const def = await one("DEFAULT", {})

const fail = []
if (off.error || off.reasoning) fail.push(`OFF 应无思考（关不掉或 400：${off.error ?? "仍返回 reasoning"}`)
if (xh.error) fail.push(`XHIGH 调用失败: ${xh.error}`)
if (xh.reasoning === false && !xh.error) fail.push("XHIGH 应有思考（服务端未开启）")
if (def.error || def.reasoning === false) fail.push(`DEFAULT 应默认思考: ${def.error ?? "无 reasoning"}`)

if (fail.length) {
  console.log("\nSMOKE FAIL")
  for (const f of fail) console.log("  ✗", f)
  process.exit(1)
}
console.log("\nSMOKE PASS — enable_thinking 映射在真实端点生效：OFF 无思考 / 档位与默认有思考")
}