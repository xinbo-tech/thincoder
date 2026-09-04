/**
 * Shared test helper (extracted per AGENT-LOOP.md §18.14 D-T1.6 — mockLLM appears in 10+ split test files;
 * the canonical body is the agent-style variant: step.toolCall singular + reasoning/delay/fail/usage steps).
 */
export function mockLLM(script) {
  return import("node:http").then(({ createServer }) => {
    let i = 0
    const requests = []
    const server = createServer((req, res) => {
      let bodyText = ""
      req.on("data", (c) => (bodyText += c))
      req.on("end", async () => {
        requests.push({ ...JSON.parse(bodyText), _url: req.url })
        const step = script[Math.min(i++, script.length - 1)]
        // Optional per-step delay (ms): simulates a slow LLM call — the async distillation
        // tests (SEND-STALL-DISTILL) need the distill request to outlast the turn's return.
        if (step.delay) await new Promise((r) => setTimeout(r, step.delay))
        // HTTP error step (compression-failure tests, CONTEXT-COMPACTION §7 T3/T3b): returns
        // the given status with a plain-text body — the provider throws "API error: HTTP N".
        if (step.fail) {
          res.writeHead(step.fail, { "Content-Type": "text/plain" })
          res.end("bad request")
          return
        }
        const reasoningFrame = step.reasoning
          ? `data: ${JSON.stringify({ choices: [{ index: 0, delta: { reasoning_content: step.reasoning } }] })}\n\n`
          : ""
        const usageFrame = step.usage
          ? `data: ${JSON.stringify({ choices: [], usage: step.usage })}\n\n`
          : ""
        let frames
        if (step.toolCall) {
          frames =
            reasoningFrame +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${i}`, function: { name: step.toolCall.name, arguments: step.toolCall.arguments ?? "{}" } }] } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: step.finishReason ?? "tool_calls" }] })}\n\n` +
            usageFrame +
            `data: [DONE]\n\n`
        } else {
          frames =
            reasoningFrame +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: step.content } }] })}\n\n` +
            `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: step.finishReason ?? "stop" }] })}\n\n` +
            usageFrame +
            `data: [DONE]\n\n`
        }
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        res.end(frames)
      })
    })
    return new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
    })
  })
}
