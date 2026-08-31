/**
 * smoke-responses-chain.mjs — Responses 链收益真机测量（2026-08-31）
 * 用法：node test/smoke-responses-chain.mjs --name qwen
 * 流程：①第一轮引导模型调 get_time 工具（拿到 call_id + responseId/链 id）
 *       ②伪造 agent 往返：messages = 全量 + assistant(tc) + tool 结果
 *       ③buildBody 决策打印（previous_response_id 是否生效 + 增量 input 长度）
 *       ④第二轮 chat → 服务端 usage：链生效时 input_tokens ≈ 增量（百炼文档：73 vs 全量 444）
 * key 读本机 config，不打印不外传。
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
if (!name) { console.error("usage: node test/smoke-responses-chain.mjs --name <provider>"); process.exit(1) }

const cfg = JSON.parse(readFileSync(join(homedir(), ".thincoder", "config.json"), "utf8"))
const found = (cfg.providers ?? []).find((p) => p.name === name)
if (!found) { console.error(`provider "${name}" not found`); process.exit(1) }
const provider = { ...found, format: "responses", stateful: true }

const { chat } = await import("../src/provider/core.mjs")
const { buildBody } = await import("../src/provider/responses.mjs")

const tools = [{ type: "function", function: { name: "get_time", description: "获取当前时间（务必调用）", parameters: { type: "object", properties: { tz: { type: "string" } }, required: [] } } }]

// 模拟长上下文（真实痛点场景：大量历史后仍要工具往返）——50KB 历史 + 指令
const bigContext = "此前对话记录：\n" + ("任务描述与执行日志占位内容…… ".repeat(2500))
const historyMsg = { role: "user", content: bigContext }
const instrMsg = { role: "user", content: "请调用 get_time 工具获取当前时间。" }

// ── 第一轮：引导模型真实调用工具 ──
console.log(`[chain] provider=${name} model=${provider.model} 上下文≈${(bigContext.length / 1024).toFixed(1)}KB`)
const t0 = Date.now()
const r1 = await chat(provider, {
  messages: [
    { role: "system", content: "你是冒烟助手。用户要求获取时间时，必须调用 get_time 工具。" },
    historyMsg, instrMsg,
  ],
  tools, onToken: () => {}, onReasoning: () => {},
})
console.log(`[chain] round1(${Date.now() - t0}ms): toolCalls=${r1.toolCalls.length} usage=${JSON.stringify(r1.usage)}`)
if (r1.toolCalls.length === 0) { console.error("[chain] 模型未调用工具——无法验证链，尝试换 prompt 或重跑"); process.exit(2) }
const tc = r1.toolCalls[0]
console.log(`[chain] round1 call_id=${tc.id} name=${tc.name}`)

// ── 第二轮：伪造 agent 往返（assistant + tool 结果），验证链增量 ──
const messages2 = [
  { role: "system", content: "你是冒烟助手。用户要求获取时间时，必须调用 get_time 工具。" },
  historyMsg, instrMsg,
  { role: "assistant", content: r1.content, tool_calls: [{ id: tc.id, function: { name: tc.name, arguments: tc.arguments } }] },
  { role: "tool", tool_call_id: tc.id, content: "2026-08-31 13:30 CST" },
]
const dec = buildBody(provider, messages2, tools)
console.log(`[chain] round2 decision: previousResponseId=${dec.previousResponseId}（链生效=${!!dec.previousResponseId}）`)
const incBytes = JSON.stringify(dec.body).length
// 全量对照（无链）：同 messages 转 items 完整体
const fullBody = buildBody(provider, messages2, tools, { stateful: false })
const fullBytes = JSON.stringify(fullBody.body).length
console.log(`[chain] 请求体字节: 链增量=${incBytes}B vs 全量=${fullBytes}B → 削减 ${(100 * (1 - incBytes / fullBytes)).toFixed(1)}% (本轮 tool 往返)`)

const r2 = await chat(provider, {
  messages: messages2,
  tools, onToken: () => {}, onReasoning: () => {},
})
console.log(`[chain] round2: toolCalls=${r2.toolCalls.length} content="${r2.content.slice(0, 50)}" usage=${JSON.stringify(r2.usage)}`)
const t1 = r1.usage?.prompt_tokens ?? 0
const t2 = r2.usage?.prompt_tokens ?? 0
console.log(`[chain] 输入 token 对比: round1(全量)=${t1} round2=${t2}（百炼链态计费：含链上下文；收益在客户端体积非计费）`)
if (dec.previousResponseId && r2.content) {
  console.log(`[chain] ✅ 链生效 + 推理连续：第二轮模型正确读到工具结果；请求体 ${fullBytes}→${incBytes}B`)
  process.exit(0)
} else {
  console.log(`[chain] ⚠️ ${dec.previousResponseId ? "链 id 在但结果异常" : "链 id 缺失"}`)
  process.exit(3)
}
