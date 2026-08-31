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
