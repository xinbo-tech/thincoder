// smoke-qwen-thinking.mjs — 真实端点 T7 冒烟：验证 enable_thinking 映射在百炼 Qwen 上真正生效
// 用法：node test/smoke-qwen-thinking.mjs [providerName]   （默认 qwenplan，回退 qwen）
// 在本机运行。从 ~/.thincoder/config.json 读 baseURL/model/apiKey —— key 不打印、不外传、不落盘。
// 三连测（走 CLI 真实 chat() 全链路，含 resolveEnableThinking 注入）：
//   1. OFF  ：provider.thinking = null    → 期望响应 reasoning 为空（enable_thinking:false 生效）
//   2. XHIGH：provider.reasoningEffort    → 期望响应 reasoning 非空（思考恢复）
//   3. 对照  ：无思考字段                  → 服务端默认（qwen3.x 默认思考）→ reasoning 非空
// 通过 = OFF 无思考 且 XHIGH/对照 有思考 且 三请求均无 400/网络错误。退出码 0/1。

import { loadConfig } from "../src/config.mjs"
import { chat } from "../src/provider/index.mjs"

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
const xh = await one("XHIGH", { reasoningEffort: "xhigh" })
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