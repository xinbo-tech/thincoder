/**
 * mcp.test.mjs — MCP transport/session robustness (2026-08-31 P5)
 *  - stdio transport onDead fires on unexpected child exit (not on deliberate close)
 *  - connectMcpServer sessions are idempotent per server name
 *  - session self-heals: a crashed server is reconnected (backoff via _mcpHooks) and
 *    the SAME tool wrapper keeps working (dynamic transport getter)
 * MCP.md §4 (2026-09-01)：T1-T6/T9-T13——POST-only isAlive 误判修复 + probe 零副作用
 * + /mcp edit 流程 + token 一等字段 + parseHeaders 逗号分隔。
 * MCP.md §5 (2026-09-01)：T15-T24——add 向导瘦身+预览探活确认+字段级重试、edit 对齐、
 * AI 降末位、列表即菜单、reloadMcpFromDisk 磁盘重读/对账/畸形回退。
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

test("T15 add 字段表单 (v2): 空起 +(required) 标注、只填所选字段、Save 校验必填不落盘 (F1/F3b)", async () => {
  // cmd-mcp 的字段表单经 handleMcpCommand 的 addWithTransport 交互链验证：
  // showPicker 脚本喂入字段选择，askQuestion 喂入字段值，断言表单行形态/问题序列/落盘 config。
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({}))
  const asked = []
  const pushed = []
  const formRounds = []
  let persistCount = 0
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      // 第 0 轮直接 Save —— 必填校验失败留在表单；随后按序填 name → url → token → Save
      const seq = ["save", "field:name", "field:url", "field:token", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("Server name")) return "hdrsrv"
      if (prompt.startsWith("HTTP URL")) return "http://127.0.0.1:9/mcp" // 死端口 → probe 失败
      if (prompt.startsWith("Auth token")) return ""                    // 空 → 不带 token
      if (prompt.startsWith("Save anyway")) return "y"
      return ""
    },
    persistRaw: async (mutate) => {
      persistCount += 1
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    // F3b：首轮表单空起——必填字段 (required) 标注 + 末行固定 `✓ Save & test`
    const first = formRounds[0]
    assert.ok(first.some((e) => e.text.includes("Name") && e.text.includes("(required)")), "name 行初始 (required)")
    assert.ok(first.some((e) => e.text.includes("HTTP URL") && e.text.includes("(required)")), "url 行初始 (required)")
    assert.ok(first.some((e) => e.text.includes("Token") && e.text.includes("(none)")), "token 可选行初始空")
    assert.ok(first.some((e) => /Headers\s+0 items/.test(e.text)), "headers 行 0 items（未填）")
    assert.equal(first[first.length - 1].text, "✓ Save & test", "末行固定 Save & test")
    // 第 0 轮空 Save → 必填校验失败：提示并留在表单（不落盘），之后才有填字段轮次
    assert.ok(pushed.some((l) => l.includes("Missing required")), "必填校验提示（Save 未满足）")
    assert.equal(persistCount, 1, "校验失败的 Save 不落盘——只发生一次 persistRaw（最终成功保存）")
    // F1/F3b：只问所选字段——name/url/token 各一次；headers 不选即跳过（无追问问句）
    assert.deepEqual(asked.filter((p) => !p.startsWith("Save anyway")), [
      "Server name (current: none):",
      "HTTP URL (current: none):",
      "Auth token (Bearer, optional; '-' clears, empty keeps) (current: none):",
    ], "问题序列：只填所选字段（headers 不选不追问）")
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    assert.equal(raw.mcp.servers.length, 1, "校验通过后落盘")
    assert.equal(raw.mcp.servers[0].url, "http://127.0.0.1:9/mcp")
    assert.ok(!("headers" in raw.mcp.servers[0]), "headers 不选即跳过 → 不落 headers 字段")
    assert.ok(!("token" in raw.mcp.servers[0]), "空 token 输入不落 token 字段")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T15b stdio 字段表单: Command/Args/Env 行、必填校验、env 逗号解析含空格 value (F3b)", async () => {
  const { fieldPicker } = await import("../src/tui/cmd-mcp-form.mjs")
  const entry = {}
  const rounds = []
  const pushed = []
  const ctx = {
    showPicker: async (title, entries) => {
      rounds.push(entries)
      const seq = ["save", "field:name", "field:command", "field:env", "save"]
      return entries.find((e) => e.action === seq[rounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Server name")) return "stdio-srv"
      if (prompt.startsWith("Command")) return process.execPath
      if (prompt.startsWith("Environment")) return "A=1, B=two words"
      return ""
    },
    pushLine: (t) => pushed.push(t),
  }
  const r = await fieldPicker(ctx, { title: "Add MCP: stdio", mode: "add", entry, transport: "stdio", existingNames: [] })
  assert.equal(r.action, "save", "必填校验通过后返回 save")
  assert.ok(rounds[0].some((e) => e.text.includes("Command") && e.text.includes("(required)")), "command 行 (required)")
  assert.ok(rounds[0].some((e) => /Args\s+\(none\)/.test(e.text)), "args 行初始 (none)")
  assert.ok(rounds[0].some((e) => /Env\s+0 items/.test(e.text)), "env 行 0 items")
  assert.ok(pushed.some((l) => l.includes("Missing required")), "空保存 → 必填校验失败提示（留在表单）")
  assert.deepEqual(r.entry, { name: "stdio-srv", command: process.execPath, env: { A: "1", B: "two words" } }, "只填所选字段；env 逗号解析 value 含空格保留（F6③）")
})

test("T15c required 字段拒绝 '-': Name is required 提示、值不变、留在 picker (F3b/DIV-3-2)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const pushed = []
  const formRounds = []
  let persistCount = 0
  const ctx = {
    agent: { config: { mcp: { servers: [] } }, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      // 第 0 轮选 name 输入 '-'（required 拒绝）→ 第 1 轮表单复开断言后 Esc 取消
      return formRounds.length === 1 ? entries.find((e) => e.action === "field:name") : null
    },
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Server name")) return "-"
      return ""
    },
    persistRaw: async () => { persistCount += 1 },
  }
  await handleMcpCommand(ctx, ["http"])
  assert.ok(pushed.some((l) => l.includes("Name is required — cannot be cleared")), "'-' 输入 required 字段 → 拒绝提示（applyFieldInput 错误文案）")
  assert.ok(formRounds[1].some((e) => e.text.includes("Name") && e.text.includes("(required)")), "拒绝后 name 值不变（仍 (required) 空值）")
  assert.equal(formRounds.length, 2, "错误后停留 picker（表单复开一轮，Esc 才退出）")
  assert.equal(persistCount, 0, "required 拒绝 → 不落盘")
})

test("T15d duplicate name: 'dup' already exists 提示、不落盘、停留 picker (F3b/DIV-3-4)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const pushed = []
  const formRounds = []
  let persistCount = 0
  const ctx = {
    agent: { config: { mcp: { servers: [{ name: "dup", url: "http://x/mcp" }] } }, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      const n = formRounds.length
      if (n === 1) return entries.find((e) => e.action === "field:name")
      if (n === 2) return entries.find((e) => e.action === "field:url")
      if (n === 3) return entries.find((e) => e.action === "save") // duplicate 检查触发
      return null // 第 4 轮（错误后复开）Esc 取消
    },
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Server name")) return "dup"
      if (prompt.startsWith("HTTP URL")) return "http://127.0.0.1:9/mcp" // 死端口——probe 不应发生
      return ""
    },
    persistRaw: async () => { persistCount += 1 },
  }
  await handleMcpCommand(ctx, ["http"])
  assert.ok(pushed.some((l) => l.includes('"dup" already exists')), "duplicate name 检查提示（existingNames 命中）")
  assert.equal(formRounds.length, 4, "重复检查失败后停留 picker（第 4 轮复开才 Esc 退出）")
  assert.ok(formRounds[3].some((e) => e.text.includes("Name") && e.text.includes("dup")), "复开后 name 已填值保留")
  assert.equal(persistCount, 0, "duplicate → 不落盘")
  assert.ok(!pushed.some((l) => l.includes("Probing")), "重复名未通过校验 → 不进探活确认环")
})

test("T18 /mcp edit 字段 picker: 只改所选字段、'k=' 清除语义、预览+probe 确认环、自动重连 (F3/AC5)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-edit-"))
  const cfgPath = join(dir, "config.json")
  const oldSrv = { name: "srv", url: "http://127.0.0.1:9/mcp", token: "oldtok", headers: { Authorization: "Bearer oldtok", "X-Keep": "yes" } }
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [oldSrv] } }))
  const pushed = []
  const asked = []
  const formRounds = []
  const ctx = {
    agent: { config: { mcp: { servers: [{ ...oldSrv, headers: { ...oldSrv.headers } }] } }, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (title !== "Edit MCP: srv") return null
      formRounds.push(entries)
      // 只改 token 与 headers（url 行不动——AC5）；随后 Save & test（死端口 → probe 失败）
      const seq = ["field:token", "field:headers", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("Auth token")) return "newtok"                        // T18：只改 token
      if (prompt.startsWith("Headers")) return "Authorization=, X-Keep=yes"       // T12：'k=' 移除该项
      if (prompt.startsWith("Save anyway")) return "y"                            // probe 失败仍保存（F3 确认环）
      return ""
    },
    persistRaw: async (mutate) => {
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["edit", "srv"])
    // F3：字段行 = URL/Token/Headers + Save & test；无 Name 行（name 不可改）
    const first = formRounds[0]
    assert.ok(!first.some((e) => e.text.includes("Name")), "edit 无 name 行（name 不可改）")
    assert.ok(first.some((e) => e.text.includes("HTTP URL") && e.text.includes("http://127.0.0.1:9/mcp")), "url 行显示当前值")
    assert.ok(first.some((e) => e.text.includes("Token") && e.text.includes("••••••")), "token 行打码显示（oldtok len 6 → 6 点）")
    assert.ok(first.some((e) => /Headers\s+2 items/.test(e.text)), "headers 行 N items")
    assert.equal(first[first.length - 1].text, "✓ Save & test", "末行固定 Save & test")
    // 只问所选字段：token/headers 各一次；url 无问句（未选不改）
    assert.equal(asked.filter((p) => p.startsWith("Auth token")).length, 1, "token 只问一次")
    assert.equal(asked.filter((p) => p.startsWith("Headers")).length, 1, "headers 只问一次")
    assert.ok(!asked.some((p) => p.startsWith("HTTP URL")), "url 未被选中 → 不问（其他字段不动）")
    const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
    const entry = raw.mcp.servers.find((s) => s.name === "srv")
    assert.ok(entry, "entry kept in place (数组序/存在性)")
    assert.equal(raw.mcp.servers.indexOf(entry), 0, "原位替换——数组序保持")
    assert.equal(entry.url, "http://127.0.0.1:9/mcp", "url 不动（AC5）")
    assert.equal(entry.token, "newtok", "token 更新（T18）")
    assert.deepEqual(entry.headers, { "X-Keep": "yes" }, "'Authorization=' removed only that header item (T12)")
    assert.ok(pushed.some((l) => l.includes("[mcp] Probing srv")), "edit 末尾走了预览+探活确认环（F3/T18）")
    assert.ok(!pushed.some((l) => l.includes("oldtok") || l.includes("newtok")), "预览不得出现明文 token")
    assert.ok(pushed.some((l) => l.includes("srv updated")), "edit reported")
    assert.ok(pushed.some((l) => /Reconnecting srv/.test(l)), "edit 触发 connectServer 自动重连（F3）")
    assert.ok(pushed.some((l) => /\[mcp\] srv:/.test(l)), "重连结果（成功或错误）有反馈")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T12 v2 '-' 清除 token 字段: 表单里 '-' 输入删除可选字段 (F3/评审 #3)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-clear-"))
  const cfgPath = join(dir, "config.json")
  const oldSrv = { name: "srv", url: "http://127.0.0.1:9/mcp", token: "oldtok" }
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [oldSrv] } }))
  const formRounds = []
  const ctx = {
    agent: { config: { mcp: { servers: [{ ...oldSrv }] } }, tools: [], provider: {} },
    pushLine: () => {},
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (title !== "Edit MCP: srv") return null
      formRounds.push(entries)
      const seq = ["field:token", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Auth token")) return "-" // '-' → 删除 token 字段（T12）
      if (prompt.startsWith("Save anyway")) return "y"
      return ""
    },
    persistRaw: async (mutate) => {
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["edit", "srv"])
    const entry = JSON.parse(readFileSync(cfgPath, "utf8")).mcp.servers.find((s) => s.name === "srv")
    assert.ok(!("token" in entry), "'-' cleared the token field (T12)")
    assert.ok(!formRounds[1].some((e) => e.text.includes("••")), "清除后表单行 token 不再打码")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ─── MCP.md §5（2026-09-01）：T16-T24 —— 菜单交互重构 + agent 代配 ───

test("T16 add 预览+探活确认: 探活 ✓ 报告进预览、token 打码、Save (Y/n) 默认 y 保存 (F2)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const { removeMcpTools } = await import("../src/mcp.mjs")
  const server = postOnlyServer([])
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const pushed = []
  const asked = []
  const formRounds = []
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      // 表单：name → url → token → Save & test；headers 行不选即跳过
      const seq = ["field:name", "field:url", "field:token", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("Server name")) return "newai"
      if (prompt.startsWith("HTTP URL")) return `http://127.0.0.1:${server.address().port}/mcp`
      if (prompt.startsWith("Auth token")) return "shorttok" // len 8 ≤ 12 → 全遮
      return "" // Save? (Y/n): 空 = 默认 y
    },
    persistRaw: async (mutate) => mutate({}), // 落盘到内存 agent.config（真实写入语义已由 T15 覆盖）
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    // 探活 ✓ 报告（工具数+延迟）进预览
    assert.ok(pushed.some((l) => /✓ 1 tools/.test(l) && /\d+ms/.test(l)), "探活 ✓ 报告（工具数+延迟）进预览")
    // 表单行 token 打码（shorttok len 8 → 8 点多）——第 4 轮（Save 前）表单复开可见
    assert.ok(formRounds[3].some((e) => e.text.includes("Token") && e.text.includes("••••••••")), "表单 token 行打码（maskToken）")
    assert.ok(!pushed.some((l) => l.includes("shorttok")), "预览不得出现明文 token")
    assert.ok(asked.some((p) => p.startsWith("Save? (Y/n)")), "探活成功 → Save? (Y/n) 确认")
    assert.equal(ctx.agent.config.mcp.servers.length, 1, "确认后写入内存态")
    assert.equal(ctx.agent.config.mcp.servers[0].token, "shorttok", "entry 构造正确（token 字段落位）")
    assert.equal(ctx.agent.tools.filter((t) => t._mcpName === "newai").length, 1, "确认后 connect 成功入 agent.tools")
  } finally {
    removeMcpTools(ctx.agent, "newai")
    server.close()
  }
})

test("T16b maskToken len>12: 表单行/预览前4字符+…截断、无明文 (F2/DIV-3-1)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const { removeMcpTools } = await import("../src/mcp.mjs")
  const server = postOnlyServer([])
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const pushed = []
  const formRounds = []
  const TOKEN = "abcdefghijklmnop" // len 16 > 12 → maskToken 前 4 字符 + "…"
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      const seq = ["field:name", "field:url", "field:token", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      if (prompt.startsWith("Server name")) return "longtok"
      if (prompt.startsWith("HTTP URL")) return `http://127.0.0.1:${server.address().port}/mcp`
      if (prompt.startsWith("Auth token")) return TOKEN
      return "" // Save? 默认 y
    },
    persistRaw: async (mutate) => mutate({}),
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    // len>12 分支：表单行显示前 4 字符 + "…"（不全遮）
    assert.ok(formRounds[3].some((e) => e.text.includes("Token") && e.text.includes("abcd…")), "表单 token 行前4字符+…（len>12 分支）")
    assert.ok(!formRounds[3].some((e) => e.text.includes("•".repeat(TOKEN.length))), "len>12 不整行全遮（16 点不出现）")
    // showPreview 同 maskToken：预览行同步截断，明文不出现
    assert.ok(pushed.some((l) => l.includes("token:") && l.includes("abcd…")), "预览 token 行前4字符+…")
    assert.ok(!pushed.some((l) => l.includes(TOKEN)), "预览不得出现明文 token")
  } finally {
    removeMcpTools(ctx.agent, "longtok")
    server.close()
  }
})

test("T16c Save? n 取消: 探活 ✓ 后答 n → 不 persistRaw、不 connect (F2/DIV-3-3)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const server = postOnlyServer([])
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const pushed = []
  const asked = []
  let pickRound = 0
  let persistCount = 0
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      pickRound += 1
      const seq = ["field:name", "field:url", "field:token", "save"]
      return entries.find((e) => e.action === seq[pickRound - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("Server name")) return "cancelsrv"
      if (prompt.startsWith("HTTP URL")) return `http://127.0.0.1:${server.address().port}/mcp`
      if (prompt.startsWith("Auth token")) return ""
      if (prompt.startsWith("Save? (Y/n)")) return "n" // DIV-3-3：取消保存
      return ""
    },
    persistRaw: async () => { persistCount += 1 },
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    assert.ok(pushed.some((l) => l.includes("✓ 1 tools")), "探活 ✓ 报告进预览（确认环走到 Save? 问句）")
    assert.ok(asked.some((p) => p.startsWith("Save? (Y/n)")), "探活成功后先问 Save? (Y/n)")
    assert.ok(pushed.some((l) => l.includes("[mcp] Cancelled")), "答 n → 取消提示")
    assert.equal(persistCount, 0, "答 n → 不 persistRaw（config 未写）")
    assert.ok(!("mcp" in ctx.agent.config), "答 n → 内存 config 无写入")
    assert.equal(ctx.agent.tools.length, 0, "答 n → 不 connect（agent.tools 无新增）")
  } finally {
    server.close()
  }
})

test("T17 探活失败回表单改字段: 只重输 token、url/headers 保留、复 probe 通过后保存 (F2/AC2)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const { removeMcpTools } = await import("../src/mcp.mjs")
  let expect401 = true
  const server = createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(405, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Method Not Allowed" }))
      return
    }
    let body = ""
    req.on("data", (d) => (body += d))
    req.on("end", () => {
      const msg = JSON.parse(body)
      if (expect401) {
        res.writeHead(401, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Unauthorized" }))
        return
      }
      const result = msg.method === "initialize"
        ? { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "retry", version: "1" } }
        : msg.method === "tools/list" ? { tools: [{ name: "t1", description: "d" }] } : {}
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const asked = []
  const pushed = []
  const formRounds = []
  let tokenCount = 0
  const ctx = {
    agent: { config: {}, tools: [], provider: {} },
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (!title.startsWith("Add MCP")) return null
      formRounds.push(entries)
      const n = formRounds.length - 1
      // 初填 4 轮：name → url → token → Save（失败）；回表单后：token → Save（复 probe 通过）
      const seq = n <= 3 ? ["field:name", "field:url", "field:token", "save"] : ["field:token", "save"]
      return entries.find((e) => e.action === seq[n <= 3 ? n : n - 4]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("Server name")) return "flip"
      if (prompt.startsWith("HTTP URL")) return `http://127.0.0.1:${server.address().port}/mcp`
      if (prompt.startsWith("Auth token")) {
        tokenCount += 1
        if (tokenCount === 2) expect401 = false // 重答 token（发生在复 probe 前）
        return tokenCount === 1 ? "bad" : "good"
      }
      if (prompt.startsWith("Save anyway")) return "n" // 失败不 save-anyway——回表单改字段（AC2）
      return "" // Save? 默认 y
    },
    persistRaw: async (mutate) => mutate({}),
  }
  try {
    await handleMcpCommand(ctx, ["http"])
    // 字段级重试：token 问了两次，name/url 只问一次——流程未重启（AC2）
    assert.equal(asked.filter((p) => p.startsWith("Auth token")).length, 2, "只重输 token 字段")
    assert.equal(asked.filter((p) => p.startsWith("Server name")).length, 1, "name 不重问")
    assert.equal(asked.filter((p) => p.startsWith("HTTP URL")).length, 1, "url 不重问")
    assert.ok(pushed.some((l) => l.includes("✗")), "失败报告（✗ + 错误透传）进过预览")
    // 回表单轮次（第 5 轮）url 行仍为原值——url/headers 保留，只重输 token
    assert.ok(formRounds[4].some((e) => e.text.includes("HTTP URL") && e.text.includes(`http://127.0.0.1:${server.address().port}/mcp`)), "回表单后 url 保留")
    assert.equal(ctx.agent.config.mcp.servers[0].token, "good", "重答后的 token 落位，复 probe 通过后保存")
    assert.equal(ctx.agent.config.mcp.servers[0].url, `http://127.0.0.1:${server.address().port}/mcp`, "url 保留（未重输）")
    assert.ok(!("headers" in ctx.agent.config.mcp.servers[0]), "headers 未填过 → 不落字段")
    assert.equal(ctx.agent.tools.filter((t) => t._mcpName === "flip").length, 1, "复 probe 通过 → connect 成功")
  } finally {
    removeMcpTools(ctx.agent, "flip")
    server.close()
  }
})

test("T18b picker 循环改多字段: 连改 url+token、中间 Esc 回 picker 不丢已改值 (F3)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-cmdmcp-t18b-"))
  const cfgPath = join(dir, "config.json")
  const oldSrv = { name: "srv", url: "http://127.0.0.1:9/mcp", token: "t1" }
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [oldSrv] } }))
  const formRounds = []
  const asked = []
  let tokenAsks = 0
  const ctx = {
    agent: { config: { mcp: { servers: [{ ...oldSrv }] } }, tools: [], provider: {} },
    pushLine: () => {},
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      if (title !== "Edit MCP: srv") return null
      formRounds.push(entries)
      // 两轮进 picker 改字段：url → token（Esc 一次）→ token → Save & test
      const seq = ["field:url", "field:token", "field:token", "save"]
      return entries.find((e) => e.action === seq[formRounds.length - 1]) ?? entries.find((e) => e.action === "save")
    },
    askQuestion: async (prompt) => {
      asked.push(prompt)
      if (prompt.startsWith("HTTP URL")) return "http://127.0.0.1:9/mcp-v2"
      if (prompt.startsWith("Auth token")) {
        tokenAsks += 1
        // 第 1 次 token 问句 Esc（= 空输入 → 不变）——回 picker；第 2 次才输入新值
        return tokenAsks === 1 ? "" : "newtok"
      }
      if (prompt.startsWith("Save anyway")) return "y"
      return ""
    },
    persistRaw: async (mutate) => {
      const raw = JSON.parse(readFileSync(cfgPath, "utf8"))
      mutate(raw)
      writeFileSync(cfgPath, JSON.stringify(raw))
    },
  }
  try {
    await handleMcpCommand(ctx, ["edit", "srv"])
    // Esc 后回 picker（第 2 轮）：url 已改值保留；token 行仍为旧值打码（Esc/空输入未改）
    assert.ok(formRounds[1].some((e) => e.text.includes("HTTP URL") && e.text.includes("http://127.0.0.1:9/mcp-v2")), "Esc 回 picker 后 url 已改值不丢（T18b）")
    assert.ok(formRounds[1].some((e) => e.text.includes("Token") && e.text.includes("••")), "Esc 后 token 行仍打码显示旧值")
    // 最终两字段都更新
    const entry = JSON.parse(readFileSync(cfgPath, "utf8")).mcp.servers.find((s) => s.name === "srv")
    assert.equal(entry.url, "http://127.0.0.1:9/mcp-v2", "url 更新")
    assert.equal(entry.token, "newtok", "token 更新")
    assert.equal(asked.filter((p) => p.startsWith("HTTP URL")).length, 1, "url 只问一次")
    assert.equal(asked.filter((p) => p.startsWith("Auth token")).length, 2, "token 问两次（Esc 一次 + 重输一次）")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T19 磁盘重读: agent 直接写 config.json 加 server → reloadMcpFromDisk 可见、仅替换 mcp 段 (F5/AC3)", async () => {
  const { reloadMcpFromDisk } = await import("../src/config.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-mcp-reload-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ provider: { apiKey: "keep-me" } }))
  const agent = { config: {}, tools: [] }
  try {
    // agent 代配：绕过内存直接改磁盘（模拟 agent 用 edit 工具）
    writeFileSync(cfgPath, JSON.stringify({
      provider: { apiKey: "keep-me" },
      mcp: { servers: [{ name: "agented", url: "http://example.invalid/mcp", token: "t" }] },
    }))
    const r = reloadMcpFromDisk(agent, cfgPath)
    assert.equal(r.ok, true)
    assert.equal(agent.config.mcp.servers.length, 1)
    assert.equal(agent.config.mcp.servers[0].name, "agented")
    assert.equal(r.changedNames.length, 0, "新出现的 disk server 不是 drift（无 ⚠ 标记）")
    assert.ok(!("provider" in agent.config), "仅替换 mcp 段——磁盘其他段不进内存")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T20 AI 生成降 transport picker 末位: 顺序 HTTP/WS/stdio/AI (F4)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const picks = []
  const ctx = {
    agent: { config: { mcp: { servers: [] } }, tools: [], provider: {} },
    pushLine: () => {},
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      picks.push({ title, entries })
      return null // Esc 取消
    },
    askQuestion: async () => "",
    persistRaw: async () => {},
  }
  await handleMcpCommand(ctx, ["add"])
  const tp = picks.find((p) => p.title === "MCP Transport")
  assert.ok(tp, "addFlow 弹 transport picker")
  assert.deepEqual(tp.entries.filter((e) => e.type === "item").map((e) => e.action), ["http", "ws", "stdio", "ai"], "AI 降末位（F4）")
  assert.ok(!tp.entries.some((e) => /🤖/.test(e.text)), "文案不再首推 AI")
})

test("T21 列表即菜单: 主菜单=server 行(连接态+tool 数)+Add+Refresh；行选中→四操作子菜单；无双弹层 (F7)", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-mcp-t21-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [{ name: "web", url: "http://x.invalid/mcp" }] } })) // disk 权威（模拟 agent 代配过的状态）
  const picks = []
  const pushed = []
  const ctx = {
    agent: { config: { mcp: { servers: [{ name: "web", url: "http://x.invalid/mcp" }] } }, tools: [], provider: {} },
    configPath: cfgPath,
    pushLine: (text) => pushed.push(text),
    pushLabel: () => {},
    showPicker: async (title, entries) => {
      picks.push({ title, entries })
      if (title === "MCP") {
        if (picks.filter((p) => p.title === "MCP").length === 1) return entries.find((e) => e.action === "@web:")
        return null // 第二轮主菜单 Esc 退出
      }
      if (title === "MCP: web") return entries.find((e) => e.action === "test") // per-server 子菜单 → Test
      return null
    },
    askQuestion: async () => "",
    persistRaw: async () => {},
  }
  try {
    await handleMcpCommand(ctx, [])
    const main = picks[0]
    assert.equal(main.title, "MCP")
    const actions = main.entries.filter((e) => e.type === "item").map((e) => e.action)
    assert.deepEqual(actions, ["@web:", "add", "refresh"], "主菜单 = server 行 + Add + Refresh（列表即菜单）")
    assert.ok(main.entries[0].text.includes("Tip:"), "顶部 agent 代配提示行（F5②）")
    assert.ok(main.entries.some((e) => e.type === "header" && /1 MCP server configured/.test(e.text)), "server 计数 header")
    assert.ok(main.entries.find((e) => e.action === "@web:").text.includes("○"), "连接态前缀")
    // 无 "先选操作再选 server" 双弹层：主菜单之后直接是 per-server 子菜单；
    // 操作完成后回主菜单（第三轮，Esc 退出）——无第四层
    assert.equal(picks.length, 3, "主菜单 → per-server 子菜单 → 回主菜单（无双弹层）")
    assert.equal(picks[1].title, "MCP: web")
    assert.equal(picks[2].title, "MCP", "子菜单操作后回主菜单")
    assert.deepEqual(picks[1].entries.filter((e) => e.type === "item").map((e) => e.action),
      ["edit", "test", "connect", "remove"], "per-server 四操作子菜单")
    assert.ok(!pushed.some((l) => l.includes("View list")), "纯查看项 View list 取消")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T23 disk 删除已连接 server: 连接不断（内存保留），对账标记 ⚠ disk changed，幂等 (F5/D-3)", async () => {
  const { reloadMcpFromDisk } = await import("../src/config.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-mcp-t23-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [{ name: "live", url: "http://a/mcp" }, { name: "gone", url: "http://b/mcp" }] } }))
  // live 已连接（agent.tools 里有其展开工具）；gone 未连接
  const agent = { config: {}, tools: [{ _mcpName: "live", name: "live_t" }] }
  try {
    let r = reloadMcpFromDisk(agent, cfgPath)
    assert.equal(r.ok, true)
    // agent 从磁盘删除两个 server
    writeFileSync(cfgPath, JSON.stringify({ mcp: { servers: [] } }))
    r = reloadMcpFromDisk(agent, cfgPath)
    assert.deepEqual(r.changedNames.sort(), ["gone", "live"], "删除 + 变更检测")
    // 已连接的 live 保留（连接不断）；未连接的 gone 随磁盘消失
    assert.deepEqual(agent.config.mcp.servers.map((s) => s.name), ["live"])
    // 重读幂等：列表稳定，且 live 的 drift 标记持续（诚实报告——disk 缺失是真实状态，
    // 直到用户 reconnect（persistRaw 回写）或 remove 显式解决）
    r = reloadMcpFromDisk(agent, cfgPath)
    assert.deepEqual(agent.config.mcp.servers.map((s) => s.name), ["live"], "重读幂等——列表稳定（防环）")
    assert.ok(r.changedNames.includes("live"), "已连接但 disk 缺失的 server 持续标记 drift")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("T24 畸形 config.json: 重读失败回退内存态，菜单提示 ⚠ disk config unreadable (F5/D-3)", async () => {
  const { reloadMcpFromDisk } = await import("../src/config.mjs")
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const dir = mkdtempSync(join(tmpdir(), "thincoder-mcp-t24-"))
  const cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, "{ this is not json")
  const memoryServers = [{ name: "mem", url: "http://m/mcp" }]
  const agent = { config: { mcp: { servers: memoryServers.map((s) => ({ ...s })) } }, tools: [] }
  const picks = []
  try {
    const r = reloadMcpFromDisk(agent, cfgPath)
    assert.equal(r.ok, false)
    assert.ok(r.error, "错误标记返回")
    assert.deepEqual(agent.config.mcp.servers, memoryServers, "内存态原样保留（回退）")
    // 菜单层：提示行告知 disk 配置不可读
    const ctx = {
      agent, configPath: cfgPath,
      pushLine: () => {},
      pushLabel: () => {},
      showPicker: async (title, entries) => {
        picks.push({ title, entries })
        return null // Esc 退出
      },
      askQuestion: async () => "",
      persistRaw: async () => {},
    }
    await handleMcpCommand(ctx, [])
    assert.ok(picks[0].entries.some((e) => e.text.includes("⚠ disk config unreadable")), "菜单提示行（T24）")
    assert.ok(picks[0].entries.some((e) => e.text.includes("○ mem")), "列表仍显示内存态 server")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})


