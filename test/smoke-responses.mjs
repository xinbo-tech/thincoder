/**
 * smoke-responses.mjs — Responses API 真机冒烟（2026-08-31，测试禁用——仅手动跑）
 * 用法：node test/smoke-responses.mjs --name <provider名> [--prompt "…"]
 * 前置：~/.thincoder/config.json 中有对应 provider（读本机 key，打印不透出、不分发）
 * 验证点：
 *  A. 文本流 content 非空 + usage（completed 帧）
 *  B. reasoning 帧名（onReasoning 是否收到——百炼帧名未文档化，重点）
 *  C. 白名单（百炼）链路径无错；灰名单（DeepSeek）有 stateful-unsupported warning
 *  D. 内置工具声明不导致 400（模型若选 web_search 会走服务端执行）
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const argv = process.argv.slice(2)
const args = {}
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) args[argv[i].slice(2)] = (argv[i + 1] && !argv[i + 1].startsWith("--")) ? argv[++i] : true
}
const name = args.name
if (!name) { console.error("usage: node test/smoke-responses.mjs --name <provider> [--baseURL <url>] [--prompt \"…\"]"); process.exit(1) }

const cfg = JSON.parse(readFileSync(join(homedir(), ".thincoder", "config.json"), "utf8"))
const found = (cfg.providers ?? []).find((p) => p.name === name)
if (!found) { console.error(`provider "${name}" not found in ~/.thincoder/config.json`); process.exit(1) }

const provider = {
  ...found,
  baseURL: args.baseURL ?? found.baseURL, // --baseURL 覆盖（GLM responses 端点 ≠ 预设 chat 路径）
  format: "responses", // 冒烟强制 responses
  stateful: true, // 默认值显式化（白名单 host 生效；灰名单自动降级）
}

const { chat } = await import("../src/provider/core.mjs")

let content = ""
let reasoning = ""
let warnings = []
const tokens = []
const onReasoning = (r) => { reasoning += r }
const onToken = (t) => { tokens.push(t) }
const onWait = (w) => { if (w?.phase === "warn") warnings = w.message ? [...warnings, w.message] : warnings }

console.log(`[smoke] provider=${name} baseURL=${provider.baseURL} (key 存在:${!!provider.apiKey?.length}) model=${provider.model}`)
const t0 = Date.now()
try {
  const result = await chat(provider, {
    messages: [
      { role: "system", content: "你是冒烟测试助手，请用中文一句话回答。" },
      { role: "user", content: args.prompt ?? "用一句话介绍你自己。" },
    ],
    tools: [
      { type: "function", function: { name: "get_time", description: "获取当前时间", parameters: { type: "object", properties: { tz: { type: "string" } }, required: [] } } },
    ],
    onToken, onReasoning, onWait,
  })
  content = result.content
  warnings = [...(result._warnings ?? []), ...warnings]

  console.log(`[smoke] status OK in ${Date.now() - t0}ms`)
  console.log(`[smoke] A. content 非空: ${JSON.stringify(content.slice(0, 80))}${content.length ? " ✅" : " ❌"}`)
  console.log(`[smoke] B. reasoning 帧: ${reasoning ? `收到 ${reasoning.length} chars ${reasoning.slice(0, 40)}… ✅` : "未收到（百炼帧名或 effort 行为待查） ⚠️"}`)
  console.log(`[smoke]    usage: ${JSON.stringify(result.usage)}`)
  console.log(`[smoke] C. 链警告: ${warnings.length ? JSON.stringify(warnings) : "无（白名单开链路径）"}`)
  console.log(`[smoke] D. toolCalls: ${result.toolCalls.length} 个（内置 web_search 若模型未选则 0）`)
  console.log(`[smoke] D. builtinToolResults: ${(result.builtinToolResults ?? []).length} 个`)
  process.exit(content ? 0 : 2)
} catch (e) {
  console.error(`[smoke] FAILED after ${Date.now() - t0}ms: ${e.message}`)
  process.exit(1)
}
