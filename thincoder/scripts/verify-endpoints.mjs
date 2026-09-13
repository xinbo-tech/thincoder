/**
 * scripts/verify-endpoints.mjs — verify all provider base URLs resolve and respond
 * Usage: node scripts/verify-endpoints.mjs
 * Does NOT require API keys — tests DNS + HTTP reachability only.
 */

const ENDPOINTS = [
  { name: "deepseek",     url: "https://api.deepseek.com/chat/completions",       method: "POST", body: '{"model":"deepseek-chat","messages":[]}' },
  { name: "kimi",         url: "https://api.moonshot.cn/v1/chat/completions",     method: "POST", body: '{"model":"kimi-k2","messages":[]}' },
  { name: "glm",          url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", method: "POST", body: '{"model":"glm-4","messages":[]}' },
  { name: "qwen",         url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", method: "POST", body: '{"model":"qwen-plus","messages":[]}' },
  { name: "minimax",      url: "https://api.minimaxi.com/v1/text/chatcompletion_v2", method: "POST", body: '{"model":"minimax-m1","messages":[]}' },
  { name: "openai",       url: "https://api.openai.com/v1/chat/completions",      method: "POST", body: '{"model":"gpt-4o","messages":[]}' },
  { name: "claude",       url: "https://api.anthropic.com/v1/messages",           method: "POST", body: '{"model":"claude-sonnet-4","messages":[],"max_tokens":1}' },
  { name: "gemini",       url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", method: "POST", body: '{"contents":[]}' },
  { name: "grok",         url: "https://api.x.ai/v1/chat/completions",            method: "POST", body: '{"model":"grok-4.5","messages":[]}' },
  { name: "mistral",      url: "https://api.mistral.ai/v1/chat/completions",      method: "POST", body: '{"model":"mistral-large","messages":[]}' },
]

let passed = 0
let failed = 0

for (const ep of ENDPOINTS) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: { "Content-Type": "application/json" },
      body: ep.body,
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    // 401/403/400 means endpoint is reachable (just auth/validation error)
    const text = await res.text().catch(() => "")
    const preview = text.slice(0, 150).replace(/\n/g, " ")
    if (res.status < 500 && res.status !== 404) {
      console.log(`✅ ${ep.name.padEnd(10)} HTTP ${res.status} — ${preview}`)
      passed++
    } else {
      console.log(`❌ ${ep.name.padEnd(10)} HTTP ${res.status} — ${preview}`)
      failed++
    }
  } catch (err) {
    const detail = [err.name, err.cause?.code, err.cause?.message, err.code].filter(Boolean).join(" ") || err.message?.slice(0, 80)
    console.log(`❌ ${ep.name.padEnd(10)} ${detail}`)
    failed++
  }
}

console.log(`\n${passed}/${ENDPOINTS.length} reachable, ${failed} failed`)
if (failed > 0) process.exit(1)
