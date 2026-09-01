/**
 * mcp.test.mjs — MCP transport/session robustness (2026-08-31 P5)
 *  - stdio transport onDead fires on unexpected child exit (not on deliberate close)
 *  - connectMcpServer sessions are idempotent per server name
 *  - session self-heals: a crashed server is reconnected (backoff via _mcpHooks) and
 *    the SAME tool wrapper keeps working (dynamic transport getter)
 * MCP.md §4 (2026-09-01)：T1-T6/T9-T13——POST-only isAlive 误判修复 + probe 零副作用
 * + /mcp edit 流程 + token 一等字段 + parseHeaders 逗号分隔。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs"
import { createServer } from "node:http"

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

// ─── MCP.md §4（2026-09-01）：POST-only isAlive 修复 + probe 零副作用 + edit + token ───

/** Streamable POST-only mock server：GET → 405；POST initialize/tools/list/tools/call
 *  正常应答（JSON body 直回，一次性 SSE 通道不需要——直接 JSON 是合法回包形态）。
 *  seenHeaders 收集每次请求的 Authorization 供 token 合成断言（T9/T12/T13）。 */
function postOnlyServer(seenHeaders = []) {
  const server = createServer((req, res) => {
    seenHeaders.push(req.headers.authorization ?? null)
    if (req.method === "GET") {
      res.writeHead(405, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Method Not Allowed" }))
      return
    }
    let body = ""
    req.on("data", (d) => (body += d))
    req.on("end", () => {
      const msg = JSON.parse(body)
      const result = msg.method === "initialize"
        ? { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "postonly", version: "1" } }
        : msg.method === "tools/list"
          ? { tools: [{ name: "web_search", description: "search the web", inputSchema: { type: "object", properties: { query: { type: "string" } } } }] }
          : { content: [{ type: "text", text: "ok-postonly" }] }
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }))
    })
  })
  return server
}

/** T5 mock：恒 401 */
function unauthorizedServer() {
  return createServer((req, res) => {
    res.writeHead(401, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Unauthorized" }))
  })
}

test("T1 POST-only: openSSE 405 降级 → connect 成功、isAlive true、调用走 POST、无重连循环 (F1/AC1)", async () => {
  const { connectMcpServer, removeMcpTools, _sessions } = await import("../src/mcp.mjs")
  const seenHeaders = []
  const server = postOnlyServer(seenHeaders)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const cfg = { name: "glm-websearch", url: `http://127.0.0.1:${server.address().port}/mcp` }
    const tools = await connectMcpServer(cfg) // AC1 场景链：405 降级 → POST 初始化成功
    assert.equal(tools.length, 1, "tools/list over POST succeeded")
    assert.equal(tools[0].name, "glm-websearch_web_search")
    // isAlive true（修复前：恒 false → ensureAlive 触发无意义重连循环）
    const transport = _sessions.get("glm-websearch").state.transport
    assert.equal(transport.isAlive(), true, "postOnly transport must be alive (修复点)")
    const out = await tools[0].execute({ query: "x" }, {})
    assert.equal(out, "ok-postonly", "tools/call goes over POST")
    assert.ok(seenHeaders.every((h) => h === null), "no auth expected in this test")
    removeMcpTools({ tools }, "glm-websearch")
  } finally {
    server.close()
  }
})

test("T1b transport isAlive 三态: postOnly=true（无流）alive / legacy SSE alive / 流断 fireDead (F1/F2)", async () => {
  const { httpTransport } = await import("../src/mcp/transport-http.mjs")
  // ① 降级标记：markPostOnly 后即使 eventSource 为 null 也是活连接
  const t = httpTransport("http://127.0.0.1:9/mcp")
  assert.equal(t.isAlive(), false, "GET SSE 失败且未标记 → 死（原缺陷语义对照）")
  t.markPostOnly()
  assert.equal(t.isAlive(), true, "postOnly 标记后不得因 eventSource==null 判死（F1）")
  t.close()
  assert.equal(t.isAlive(), false, "close 后必须判死（F2）")
  // ② legacy SSE：流活着 → isAlive true；流断 → fireDead（T2 不回归）
  const upstream = postOnlyServer([])
  await new Promise((r) => upstream.listen(0, "127.0.0.1", r))
  const sseConns = []
  const sse = createServer((req, res) => {
    sseConns.push(res)
    res.writeHead(200, { "Content-Type": "text/event-stream" })
    res.write(`event: endpoint\ndata: http://127.0.0.1:${upstream.address().port}/post\n\n`)
    res.write(": keepalive\n\n")
  })
  await new Promise((r) => sse.listen(0, "127.0.0.1", r))
  try {
    const t2 = httpTransport(`http://127.0.0.1:${sse.address().port}/sse`)
    await t2.openSSE() // endpoint 事件 → legacySSE，流保持
    assert.equal(t2.isAlive(), true, "legacy SSE 流活着 → alive")
    let dead = null
    t2.onDead((msg) => { dead = msg })
    t2.close() // 主动 close：不 fireDead（F2 与 P5 语义）
    assert.equal(t2.isAlive(), false)
    await new Promise((r) => setTimeout(r, 50))
    assert.equal(dead, null, "主动 close 不得触发 onDead（重连不误发）")
    // 真流断：另开一条，销毁对端 socket → reader done → fireDead
    const t3 = httpTransport(`http://127.0.0.1:${sse.address().port}/sse`)
    await t3.openSSE()
    let dead3 = null
    t3.onDead((msg) => { dead3 = msg })
    for (const conn of sseConns) conn.destroy() // server.close() 不销毁已建立连接——必须 destroy
    for (let i = 0; i < 50 && !dead3; i++) await new Promise((r) => setTimeout(r, 20))
    assert.ok(dead3 !== null, "legacy SSE 流断必须 fireDead（F2 不回归）")
    t3.close()
  } finally {
    sse.close()
    upstream.close()
  }
})

test("T3 closed: isAlive()=false (F2)", async () => {
  const { httpTransport } = await import("../src/mcp/transport-http.mjs")
  const t = httpTransport("http://127.0.0.1:9/mcp")
  t.markPostOnly()
  t.close()
  assert.equal(t.isAlive(), false)
})

test("T4 probe 成功: { ok, toolCount, latencyMs>0 } 且 _sessions 不增 (F4/D-2)", async () => {
  const { probeMcpServer, _sessions } = await import("../src/mcp.mjs")
  const seenHeaders = []
  const server = postOnlyServer(seenHeaders)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const before = _sessions.size
    const r = await probeMcpServer({ name: "probe-ok", url: `http://127.0.0.1:${server.address().port}/mcp` })
    assert.equal(r.ok, true, `probe must succeed: ${r.error ?? ""}`)
    assert.equal(r.toolCount, 1)
    assert.ok(r.latencyMs >= 0 && Number.isFinite(r.latencyMs))
    assert.equal(_sessions.size, before, "probe 零副作用：session 注册表不得新增")
  } finally {
    server.close()
  }
})

test("T5 probe 失败 401: { ok:false, error 含 401 } 且零副作用 (F4)", async () => {
  const { probeMcpServer, _sessions } = await import("../src/mcp.mjs")
  const server = unauthorizedServer()
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const before = _sessions.size
    const r = await probeMcpServer({ name: "probe-401", url: `http://127.0.0.1:${server.address().port}/mcp` })
    assert.equal(r.ok, false)
    assert.match(r.error, /401/)
    assert.equal(_sessions.size, before, "失败探活同样零副作用")
    assert.equal(r.toolCount, undefined, "失败结果无 toolCount")
  } finally {
    server.close()
  }
})

test("T9 token 合成: Authorization: Bearer abc；显式 headers 优先；fingerprint 含 token (F6/D-5)", async () => {
  const { withBearerToken, connectMcpServer, removeMcpTools, _sessions } = await import("../src/mcp.mjs")
  // ① 纯函数语义：合成 + 不写回 + 显式优先 + 无 token 原样
  const cfg = { name: "t", url: "http://x", token: "abc" }
  const merged = withBearerToken(cfg)
  assert.equal(merged.headers.Authorization, "Bearer abc")
  assert.equal(cfg.headers, undefined, "token 合成不得写回原 config")
  const explicit = withBearerToken({ url: "http://x", token: "abc", headers: { Authorization: "Bearer real" } })
  assert.equal(explicit.headers.Authorization, "Bearer real", "显式 Authorization 优先")
  const noToken = withBearerToken({ url: "http://x" })
  assert.equal(noToken.headers, undefined, "无 token → 原样返回（不合成）")
  // ② 链路：无 headers 的 token config 真实连 POST-only server → 请求头带 Bearer abc
  const seenHeaders = []
  const server = postOnlyServer(seenHeaders)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const tools = await connectMcpServer({ name: "tok", url: `http://127.0.0.1:${server.address().port}/mcp`, token: "abc" })
    assert.equal(tools.length, 1)
    assert.ok(seenHeaders.every((h) => h === "Bearer abc"), `every request must carry Bearer abc, got ${JSON.stringify(seenHeaders)}`)
    assert.ok(_sessions.get("tok"), "session established")
    removeMcpTools({ tools }, "tok")
  } finally {
    server.close()
  }
})

test("T11 向后兼容: 旧 headers.Authorization 形式行为不变，token 缺省不合成 (F6/NF1)", async () => {
  const { withBearerToken } = await import("../src/mcp.mjs")
  const cfg = { name: "legacy", url: "http://x", headers: { Authorization: "Bearer old-style" } }
  const merged = withBearerToken(cfg)
  assert.equal(merged, cfg, "无 token → 同一引用原样返回（零行为变化）")
  assert.equal(merged.headers.Authorization, "Bearer old-style")
})

test("T13 edit 改 token → fingerprint 变更触发重连 (F3/F6②)", async () => {
  const { connectMcpServer, _sessions } = await import("../src/mcp.mjs")
  const seenHeaders = []
  const server = postOnlyServer(seenHeaders)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  try {
    const url = `http://127.0.0.1:${server.address().port}/mcp`
    await connectMcpServer({ name: "tok2", url, token: "old" })
    const oldTransport = _sessions.get("tok2").state.transport
    const tools2 = await connectMcpServer({ name: "tok2", url, token: "new" }) // 指纹变更
    assert.ok(_sessions.get("tok2").state.transport !== oldTransport, "config 变更 → transport 重建")
    assert.equal(tools2.length, 1)
    assert.ok(seenHeaders.includes("Bearer new"), "新 token 生效")
  } finally {
    const { removeMcpTools } = await import("../src/mcp.mjs")
    removeMcpTools({ tools: [] }, "tok2")
    server.close()
  }
})

test("T10 parseHeaders 逗号分隔: value 含空格保留 (F6③)", async () => {
  // cmd-mcp 的 parseHeaders 是模块私有——经 handleMcpCommand 的 addWithTransport
  // 交互链验证：askQuestion 脚本喂入逗号分隔 headers，断言落盘 config。
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({}))
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: () => {},
    pushLabel: () => {},
    showPicker: async () => null,
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Server name")) return "hdrsrv"
      if (prompt.startsWith("HTTP URL")) return "http://127.0.0.1:9/mcp" // 不会被连接（connect 失败不影响断言）
      if (prompt.startsWith("Auth token")) return ""                    // 空 → 不带 token
      if (prompt.startsWith("Headers")) return "Authorization=Bearer abc def, X-Foo=bar"
      return ""
    },
    persistRaw: async (mutate) => {
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    assert.equal(raw.mcp.servers.length, 1, "server entry persisted")
    assert.deepEqual(raw.mcp.servers[0].headers, { Authorization: "Bearer abc def", "X-Foo": "bar" }, "comma-separated, value spaces preserved")
    assert.ok(!("token" in raw.mcp.servers[0]), "空 token 输入不落 token 字段")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T6 + T12 /mcp edit: askQuestion 序列、persistRaw、connectServer 触发；'-'/'k=' 清除语义 (F3)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-edit-"))
  const cfgPath = join(dir, "config.json")
  const oldSrv = { name: "srv", url: "http://127.0.0.1:9/mcp", token: "oldtok", headers: { Authorization: "Bearer oldtok", "X-Keep": "yes" } }
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [oldSrv] } }))
  const answers = []
  const answersByPrompt = (prompt) => {
    if (prompt.startsWith("HTTP URL")) { answers.push("url"); return "http://127.0.0.1:9/mcp-v2" } // 仍是死端口 → 重连尝试失败不挂
    if (prompt.startsWith("Auth token")) { answers.push("token"); return "-" }                     // '-' → 删除 token 字段（T12）
    if (prompt.startsWith("Headers")) { answers.push("headers"); return "Authorization=, X-Keep=yes" } // 'Authorization=' 移除该项
    return ""
  }
  const pushed = []
  const ctx = {
    agent: { config: { mcp: { servers: [{ ...oldSrv, headers: { ...oldSrv.headers } }] } }, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async () => null,
    askQuestion: async (prompt) => answersByPrompt(prompt),
    persistRaw: async (mutate) => {
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["edit", "srv"])
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    assert.deepEqual(answers, ["url", "token", "headers"], "askQuestion 序列：url → token → headers（HTTP）")
    const entry = raw.mcp.servers.find((s) => s.name === "srv")
    assert.ok(entry, "entry kept in place (数组序/存在性)")
    assert.equal(raw.mcp.servers.indexOf(entry), 0, "原位替换——数组序保持")
    assert.equal(entry.url, "http://127.0.0.1:9/mcp-v2", "url updated")
    assert.ok(!("token" in entry), "'-' cleared the token field (T12)")
    assert.deepEqual(entry.headers, { "X-Keep": "yes" }, "'Authorization=' removed only that header item (T12)")
    assert.ok(pushed.some((l) => l.includes("srv updated")), "edit reported")
    assert.ok(pushed.some((l) => /Reconnecting srv/.test(l)), "edit 触发 connectServer 自动重连（F3）")
    assert.ok(pushed.some((l) => /\[mcp\] srv:/.test(l)), "重连结果（成功或错误）有反馈")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

