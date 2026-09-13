/**
 * mock-llm.mjs — 集成集共享夹具：脚本化 provider（本地 HTTP + OpenAI SSE，零外网）。
 *
 * 定位（`docs/design/TESTING.md` §4）：集成场景的「脚本化 provider」——真 provider 链路
 * （`src/provider.mjs` 的 fetch → SSE 解析）打到 127.0.0.1 的本地 mock，模型输出由脚本
 * 逐调用给出；断言面 = 业务可观察结果（产物 / 调用方可见文本），不锁内部结构。
 *
 * 用法：
 *   const llm = await mockLLM([{ content: "done" }])
 *   const provider = { name: "mock", model: "mock-model", apiKey: "k", baseURL: llm.baseURL, format: "openai" }
 *   ... llm.requests / llm.close()
 *
 * 脚本步（按调用序消费；调用数超出脚本 → 重复末步——CLI 侧 mock-llm 同规）：
 *   { content, reasoning?, toolCall?:{name,arguments}, finishReason?, usage?, fail?, delay? }
 *   或函数步 `(body) => stepObj`（按当次请求动态生成——如设计评审回显它收到的 token）。
 */
import { createServer } from "node:http"

const sse = (obj) => `data: ${JSON.stringify(obj)}\n\n`
const frameText = (text) => sse({ choices: [{ index: 0, delta: { content: text } }] })
const frameReasoning = (text) => sse({ choices: [{ index: 0, delta: { reasoning_content: text } }] })
const frameTool = (call) => sse({
  choices: [{
    index: 0,
    delta: {
      tool_calls: [{
        index: 0,
        id: call.id ?? "call_1",
        function: { name: call.name, arguments: typeof call.arguments === "string" ? call.arguments : JSON.stringify(call.arguments ?? {}) },
      }],
    },
  }],
})
const frameFinish = (reason) => sse({ choices: [{ index: 0, delta: {}, finish_reason: reason }] })
const frameUsage = (usage) => sse({ choices: [], usage })

/** 启动 mock：返回 { server, port, baseURL, requests, calls, close }。 */
export async function mockLLM(script) {
  const steps = Array.isArray(script) ? script : [script]
  const requests = []
  let i = 0
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (c) => (raw += c))
    req.on("end", async () => {
      let body = {}
      try { body = JSON.parse(raw) } catch { /* 非 JSON 请求体照收（断言面记录原文） */ }
      requests.push({ url: req.url, headers: req.headers, body, raw })
      const at = Math.min(i++, steps.length - 1)
      const step = typeof steps[at] === "function" ? steps[at](body, req) : steps[at]
      if (step?.delay) await new Promise((r) => setTimeout(r, step.delay))
      if (step?.fail) {
        res.writeHead(step.fail, { "content-type": "application/json" })
        res.end(JSON.stringify({ error: { message: step.failText ?? `mock failure ${step.fail}` } }))
        return
      }
      let out = ""
      if (step?.reasoning) out += frameReasoning(step.reasoning)
      if (step?.toolCall) {
        out += frameTool(step.toolCall) + frameFinish(step.finishReason ?? "tool_calls")
      } else {
        if (step?.content) out += frameText(step.content)
        out += frameFinish(step.finishReason ?? "stop")
      }
      if (step?.usage) out += frameUsage(step.usage)
      out += "data: [DONE]\n\n"
      res.writeHead(200, { "content-type": "text/event-stream" })
      res.end(out)
    })
  })
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const port = server.address().port
  return {
    server,
    port,
    baseURL: `http://127.0.0.1:${port}`,
    requests,
    get calls() { return requests.length },
    close: () => new Promise((r) => server.close(r)),
  }
}

/** OpenAI 形状 provider（指向 mock）——各场景共用。 */
export const providerFor = (llm, over = {}) => ({
  name: "mock-provider", model: "mock-model", apiKey: "test-key", baseURL: llm.baseURL, format: "openai", ...over,
})
