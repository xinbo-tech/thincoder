/**
 * M4 验证：构造超长历史，触发真实压缩。
 * 运行: node test/m4-compress.mjs
 */
import { createProvider } from "../src/provider/index.mjs"
import { loadConfig } from "../src/config.mjs"
import { compressIfNeeded, estimateTokens } from "../src/context.mjs"

const config = loadConfig()
const provider = createProvider(config.provider)

// 构造 ~30 条带工具调用链的长历史
const history = [
  { role: "user", content: "帮我重构项目的配置加载模块" },
  { role: "assistant", content: "好的，我先看一下现有代码。" },
]
for (let i = 0; i < 10; i++) {
  history.push({
    role: "assistant",
    content: null,
    tool_calls: [
      { id: `call_${i}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path: `src/file${i}.mjs` }) } },
    ],
  })
  history.push({
    role: "tool",
    tool_call_id: `call_${i}`,
    content: `1\t// file${i}.mjs 的内容\n2\t` + "x".repeat(500),
  })
  history.push({ role: "assistant", content: `看完了 file${i}.mjs，发现第 ${i} 个问题。` })
}
history.push({ role: "user", content: "继续" })

const agent = { provider, history }
const before = estimateTokens(agent.history)
console.log(`压缩前: ${history.length} 条消息, 约 ${before} tokens`)

const compressed = await compressIfNeeded(agent, 500) // 阈值设 500 强制触发
console.log(`压缩触发: ${compressed}`)
console.log(`压缩后: ${agent.history.length} 条消息, 约 ${estimateTokens(agent.history)} tokens`)

const summaryMsg = agent.history.find((m) => typeof m.content === "string" && m.content.includes("前文摘要"))
if (!summaryMsg) {
  console.error("FAIL: 未找到摘要消息")
  process.exit(1)
}
console.log("--- 摘要内容 ---")
console.log(summaryMsg.content.slice(0, 600))

// 结构校验：不得有孤儿 tool 消息（前面必须有带 tool_calls 的 assistant）
for (let i = 0; i < agent.history.length; i++) {
  const m = agent.history[i]
  if (m.role === "tool") {
    const prev = agent.history[i - 1]
    const ok = prev && (prev.role === "tool" || prev.tool_calls?.some((tc) => tc.id === m.tool_call_id))
    if (!ok) {
      console.error(`FAIL: 孤儿 tool 消息 at index ${i}`)
      process.exit(1)
    }
  }
}
console.log("PASS: 结构完整，无孤儿 tool 消息")
process.exit(0)
