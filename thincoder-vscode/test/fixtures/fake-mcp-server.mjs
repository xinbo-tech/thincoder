/**
 * fixtures/fake-mcp-server.mjs — minimal MCP stdio server for tests.
 * Responds to initialize / tools/list / tools/call over newline-delimited JSON-RPC.
 * Tools: { name: "echo", inputSchema: { type: "object", properties: { text: { type: "string" } } } }
 *        { name: "fail",  inputSchema: { type: "object", properties: {} } }  — always errors
 */
import { readFileSync } from "node:fs"
import { createInterface } from "node:readline"

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n")

rl.on("line", (line) => {
  let msg
  try { msg = JSON.parse(line) } catch { return }
  if (msg.method === "initialize") {
    send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "fake", version: "1.0.0" } } })
  } else if (msg.method === "notifications/initialized") {
    // no response
  } else if (msg.method === "tools/list") {
    send({
      jsonrpc: "2.0", id: msg.id,
      result: {
        tools: [
          { name: "echo", description: "Echo the text back", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
          { name: "fail", description: "Always fails", inputSchema: { type: "object", properties: {} } },
        ],
      },
    })
  } else if (msg.method === "tools/call") {
    const name = msg.params?.name
    if (name === "fail") {
      send({ jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: "intentional failure" } })
    } else {
      const text = msg.params?.arguments?.text ?? ""
      send({ jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: `echo:${text}` }] } })
    }
  }
})

// Keep the process alive until stdin closes; also support a parent-ready handshake via env.
if (process.env.FAKE_MCP_READY_FILE) {
  readFileSync(process.env.FAKE_MCP_READY_FILE) // touch check — parent creates it before spawn
}
