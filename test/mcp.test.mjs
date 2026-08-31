/**
 * mcp.test.mjs — MCP transport/session robustness (2026-08-31 P5)
 *  - stdio transport onDead fires on unexpected child exit (not on deliberate close)
 *  - connectMcpServer sessions are idempotent per server name
 *  - session self-heals: a crashed server is reconnected (backoff via _mcpHooks) and
 *    the SAME tool wrapper keeps working (dynamic transport getter)
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readFileSync, writeFileSync, rmSync } from "node:fs"

/** A stdio MCP server script: responds to initialize/tools/list/tools/call, then:
 *  - first spawned instance (per MCP_COUNT_FILE) self-destructs after 150ms
 *  - later instances stay alive (so the reconnect joins a healthy server) */
const serverScript = (countFile) => `const fs=require('fs');const f=process.env.MCP_COUNT_FILE;const n=fs.existsSync(f)?Number(fs.readFileSync(f,'utf8')):0;fs.writeFileSync(f,String(n+1));
let buf='';process.stdin.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\\n'))>=0){const line=buf.slice(0,i);buf=buf.slice(i+1);if(!line.trim())continue;const m=JSON.parse(line);const r={jsonrpc:'2.0',id:m.id,result:m.method==='initialize'?{protocolVersion:'2024-11-05',capabilities:{},serverInfo:{name:'t',version:'1'}}:m.method==='tools/list'?{tools:[{name:'t1',description:'d1'},{name:'t2',description:'d2'}]}:m.method==='tools/call'?{content:[{type:'text',text:'ok-'+n}]}:{}};process.stdout.write(JSON.stringify(r)+'\\n')}});
if(n===0)setTimeout(()=>process.exit(1),150)`

const makeCountFile = () => join(tmpdir(), `thincoder-mcp-count-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`)

const configFor = (countFile) => ({
  name: "selfheal",
  command: process.execPath,
  args: ["-e", serverScript(countFile)],
  env: { MCP_COUNT_FILE: countFile },
})

test("stdio transport onDead fires on unexpected exit, not on deliberate close (P5)", async () => {
  const { stdioTransport } = await import("../src/mcp/transport-stdio.mjs")
  // 自杀进程：150ms 后退出（无 MCP_COUNT_FILE → n 恒 0，每次都会死）
  const countFile = makeCountFile()
  try {
    const t = stdioTransport(process.execPath, ["-e", serverScript(countFile)], { MCP_COUNT_FILE: countFile })
    const dead = new Promise((resolve) => t.onDead((msg) => resolve(msg)))
    assert.ok(t.isAlive(), "spawn 后 alive")
    const msg = await dead
    assert.match(msg, /process exited/, `unexpected exit must fire onDead, got: ${msg}`)
    assert.equal(t.isAlive(), false)
    // 主动 close：不触发 onDead
    const t2 = stdioTransport(process.execPath, ["-e", "setInterval(()=>{},1000)"])
    let fired = false
    t2.onDead(() => { fired = true })
    t2.close()
    await new Promise((r) => setTimeout(r, 100))
    assert.equal(fired, false, "deliberate close must NOT fire onDead")
  } finally {
    try { rmSync(countFile, { force: true }) } catch { /* ignore */ }
  }
})

test("connectMcpServer session: idempotent per name (no double spawn) (P5)", async () => {
  const { connectMcpServer, closeAllMcp } = await import("../src/mcp.mjs")
  const countFile = makeCountFile()
  try {
    const cfg = configFor(countFile)
    const tools1 = await connectMcpServer(cfg)
    const tools2 = await connectMcpServer(cfg) // 同 name 幂等 → 复用 session
    assert.equal(tools1.length, 2)
    assert.equal(tools2, tools1, "second call returns the SAME tool wrappers (no new spawn)")
    closeAllMcp({ tools: tools1 })
  } finally {
    try { rmSync(countFile, { force: true }) } catch { /* ignore */ }
  }
})

test("legacySSE mode: direct JSON-RPC body on POST resolves (no 120s pending hang) (#10)", async () => {
  // 违规 server：GET SSE 发 endpoint 事件（进入 legacySSE），POST 直接回 JSON-RPC body
  const { httpTransport } = await import("../src/mcp/transport-http.mjs")
  const { createServer } = await import("node:http")
  const server = createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.write(`event: endpoint\ndata: ${JSON.stringify(`http://127.0.0.1:${server.address().port}/post`)}\n\n`)
      res.write(": keepalive\n\n") // 保持流开（openSSE 等待 ENDPOINT_WAIT_MS 后返回）
      return
    }
    // POST 直回 JSON-RPC 响应（legacy 规范违规但生态常见）
    let body = ""
    req.on("data", (d) => (body += d))
    req.on("end", () => {
      const msg = JSON.parse(body)
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: { ok: true } }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const t = httpTransport(`http://127.0.0.1:${server.address().port}/sse`)
    await t.openSSE() // 识别 endpoint → legacySSE = true
    const resp = await Promise.race([
      t.send("tools/call", { name: "x", arguments: {} }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("still hanging after 3s")), 3000)),
    ])
    assert.equal(resp.result?.ok, true, `direct JSON body must resolve, got ${JSON.stringify(resp)}`)
    t.close()
  } finally {
    server.close()
  }
})

test("withAuthToken: Bearer → subprotocol, no token in URL query (#10)", async () => {
  const { withAuthToken } = await import("../src/mcp/helpers.mjs")
  const { url, protocols } = withAuthToken("ws://example.com/mcp", "Bearer sk-secret")
  assert.equal(url, "ws://example.com/mcp", "URL must not gain a token query param")
  assert.deepEqual(protocols, ["bearer.sk-secret"], "token rides the subprotocol")
  // 用户 URL 自带 query token：保留不动（兼容）
  const { url: u2, protocols: p2 } = withAuthToken("ws://example.com/mcp?token=user-supplied", "Bearer sk-secret")
  assert.match(u2, /token=user-supplied/, "user-supplied query token untouched")
  assert.deepEqual(p2, ["bearer.sk-secret"])
  // 无 Authorization：原样返回
  const u3 = withAuthToken("ws://example.com/mcp", undefined)
  assert.deepEqual(u3, { url: "ws://example.com/mcp", protocols: [] })
  // 畸形 URL 友好报错
  assert.throws(() => withAuthToken("not a url", "Bearer t"), /Invalid WebSocket URL/)
})

test("session self-heal: crashed server reconnects and the SAME tool wrapper works (P5)", async () => {
  // 把退避延迟压到 ~0，全链（onDead→scheduleReconnect→attachSession→旧 tools 可用）在秒级内验证
  const { connectMcpServer, _mcpHooks } = await import("../src/mcp.mjs")
  const countFile = makeCountFile()
  const origDelays = _mcpHooks.reconnectDelays
  const origDelay = _mcpHooks.delay
  _mcpHooks.reconnectDelays = [1, 1, 1, 1]
  _mcpHooks.delay = () => new Promise((r) => setTimeout(r, 0))
  let tools
  try {
    tools = await connectMcpServer(configFor(countFile))
    assert.equal(tools.length, 2, "handshake ok")
    // 第 1 实例 150ms 后自杀 → onDead → 重连（第 2 实例永活）
    const deadline = Date.now() + 8000
    let out = null
    while (Date.now() < deadline) {
      try {
        out = await tools[0].execute({}, {})
        if (out === "ok-1") break // 重连后的第 2 实例（n=1）
      } catch { /* still reconnecting — retry */ }
      await new Promise((r) => setTimeout(r, 100))
    }
    assert.match(out ?? "", /^ok-1$/, `after reconnect the SAME tool wrapper must work, got: ${out}`)
  } finally {
    _mcpHooks.reconnectDelays = origDelays
    _mcpHooks.delay = origDelay
    try {
      const { closeAllMcp } = await import("../src/mcp.mjs")
      closeAllMcp({ tools: tools ?? [] })
    } catch { /* ignore */ }
    try { rmSync(countFile, { force: true }) } catch { /* ignore */ }
  }
})
