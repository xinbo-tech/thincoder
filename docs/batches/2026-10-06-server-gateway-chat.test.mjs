/**
 * 2026-10-06-server-gateway-chat.test.mjs — thincoder-server 批内单测件（D3 段：聊天链；名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根——本 fix 轮起六件一并）：`node --test docs/batches/2026-10-06-server-gateway.test.mjs` ∥ `…-accounts.test.mjs` ∥ `…-metering.test.mjs` ∥ `…-chat.test.mjs`（本档） ∥ `…-webui-deploy.test.mjs` ∥ `…-model-ref.test.mjs`。
 *
 * 射程（gateway/API.md §2/§7）：七步链（鉴权 → 准入 → 派发 → 转发 → 透传+tap → 记账）∥ N1 两帧间隔 ∥ N2 非流式 ∥ B1 不重复注入 ∥
 * B3 断连 aborted ∥ B5 BOM/CRLF ∥ B6 超长行弃扫 ∥ E3/E5/E6/E7 ∥ AC-1 团队 key 三态 ∥ 裸名/前缀形语义（`provider/model`） ∥ 单件面（tap ∥ 注入）。
 * mock 上游 = 端口随机 `node:http`；两帧间隔 = 门控（第二帧待客户端收到首帧后才放行——整段缓冲实现死锁超时，故为逐块判据）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { createServer as createHttpServer, request as httpRequest } from "node:http"
import { createServer as createNetServer } from "node:net"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const TAP = await load("thincoder-server/src/gateway/sse-tap.mjs")
const FORWARD = await load("thincoder-server/src/gateway/forward.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")

// ── 夹具与助手 ───────────────────────────────────────────────────────────────
/** 校验后配置（provider ∥ embedding 同指 mock 上游；`models` 逐测例覆盖）。 */
function configWith(baseURL, models = ["mock-chat"]) {
  return CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "mock", baseURL, apiKey: "sk-upstream", models }],
    embedding: { baseURL, model: "bge-m3" },
  })
}

function seedMember(db, { username = "alice", quotaTokens = null } = {}) {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, quota_tokens, created_at) VALUES (?, ?, 'scrypt$fixture', ?, ?)")
    .run(username, username, quotaTokens, new Date().toISOString())
  return Number(info.lastInsertRowid)
}

/** mock 上游（端口随机）：读全请求体 → 记录 `{ method, url, headers, body, text }` → 交 handler。 */
async function startMockUpstream(handler) {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8")
      let body = null
      try { body = JSON.parse(text) } catch { /* 非 JSON 请求体：以 text 判 */ }
      const record = { method: req.method, url: req.url, headers: req.headers, body, text }
      requests.push(record)
      handler(req, res, record)
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 进程内网关（`/v1/*` 两面 + 日志采集）。 */
async function startGateway({ db, config }) {
  const lines = []
  const push = (level) => (event, fields) => lines.push({ level, event, ...fields })
  const log = { info: push("info"), warn: push("warn"), error: push("error") }
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    lines,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 非流式/错误面请求（流式请求走 `chatStream` + reader——勿整段消费）。 */
async function chatJson(base, { key = null, body, headers = {} } = {}) {
  const requestHeaders = { "content-type": "application/json", ...headers }
  if (key) requestHeaders.authorization = `Bearer ${key}`
  const res = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers: requestHeaders, body: JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, json, text }
}

/** 流式聊天请求（返回原始 Response——帧读取归调用方）。 */
function chatStream(base, { key, body, signal = undefined }) {
  return fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
}

/** 裸 http 客户端（E7：自控 Content-Length ∥ 分块体——fetch 不给出这两种形）。 */
function rawPost({ port, path = "/v1/chat/completions", headers, chunks = [], end = true, timeoutMs = 15000 }) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port, path, method: "POST", headers }, (res) => {
      let text = ""
      res.setEncoding("utf8")
      res.on("data", (d) => { text += d })
      res.on("end", () => { resolve({ status: res.statusCode, text }); req.destroy() })
    })
    req.on("error", reject)
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`rawPost 超时（${timeoutMs}ms）`)))
    for (const chunk of chunks) req.write(chunk)
    if (end) req.end()
  })
}

const sseFrame = (value) => Buffer.from(`data: ${typeof value === "string" ? value : JSON.stringify(value)}\n\n`)
const lastUsage = (db) => db.prepare("SELECT * FROM usage ORDER BY id DESC LIMIT 1").get() ?? null
const readAllBytes = async (response) => {
  const parts = []
  for await (const chunk of response.body) parts.push(Buffer.from(chunk))
  return Buffer.concat(parts)
}
function deferred() {
  let release
  const promise = new Promise((resolve) => { release = resolve })
  return { promise, release }
}
function withTimeout(promise, ms, label) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`超时（${ms}ms）：${label}`)), ms) }),
  ]).finally(() => clearTimeout(timer))
}
async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 25))
  }
  return predicate()
}
async function freePort() {
  const probe = createNetServer()
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve))
  const port = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  return port
}

// ── 单件面：tap ∥ 注入规则 ───────────────────────────────────────────────────
test("sse-tap：跨块增量扫描 ∥ BOM 跨块 ∥ CRLF ∥ [DONE]/非 JSON 忽略 ∥ 超长行弃扫且续扫", () => {
  const tap = TAP.createUsageTap()
  tap.feed(Buffer.from([0xef, 0xbb])) // BOM 前半
  tap.feed(Buffer.from([0xbf]))       // BOM 后半
  tap.feed(Buffer.from('data: {"choices":[]}\r')) // 行未完（CRLF 拆块）
  assert.equal(tap.usage(), null)
  tap.feed(Buffer.from("\n"))
  const usageLine = Buffer.from(`data: ${JSON.stringify({ usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 } })}\n`)
  tap.feed(usageLine.subarray(0, 9))
  tap.feed(usageLine.subarray(9))
  assert.deepEqual(tap.usage(), { promptTokens: 1, completionTokens: 2, totalTokens: 3 })
  tap.feed(Buffer.from("event: ping\ndata: not-json\ndata: [DONE]\n"))
  assert.deepEqual(tap.usage(), { promptTokens: 1, completionTokens: 2, totalTokens: 3 }) // 非 data-JSON/[DONE] 不改末次值
  const big = TAP.createUsageTap()
  big.feed(Buffer.from(`data: ${"x".repeat(TAP.TAP_MAX_LINE_BYTES + 1)}\n`))
  assert.equal(big.usage(), null) // 超长行弃扫（B6 单件面）
  big.feed(Buffer.from('data: {"usage":{"total_tokens":9}}\n'))
  assert.deepEqual(big.usage(), { promptTokens: null, completionTokens: null, totalTokens: 9 }) // 续扫不受影响
})
test("forward：include_usage 注入规则（KD-SV-5）∥ URL 拼接", () => {
  const base = { model: "m", messages: [] }
  assert.deepEqual(FORWARD.injectIncludeUsage({ ...base, stream: true }), { ...base, stream: true, stream_options: { include_usage: true } })
  assert.deepEqual(FORWARD.injectIncludeUsage({ ...base, stream: true, stream_options: { include_usage: false } }).stream_options, { include_usage: true }) // 显式 false 亦覆盖
  const already = { ...base, stream: true, stream_options: { include_usage: true, vendor: 1 } }
  assert.equal(FORWARD.injectIncludeUsage(already), already) // 已带 ⇒ 原对象（不重复注入 ∥ 不改写）
  const nonStream = { ...base, stream: false }
  assert.equal(FORWARD.injectIncludeUsage(nonStream), nonStream) // 非流式不动
  assert.deepEqual(FORWARD.injectIncludeUsage({ ...base, stream: true, stream_options: null }).stream_options, { include_usage: true })
  assert.equal(FORWARD.upstreamUrl("http://x:1/v1/", "/chat/completions"), "http://x:1/v1/chat/completions")
})

// ── N1：流式两帧间隔（非整段缓冲）────────────────────────────────────────────
test("N1：流式两帧间隔（非整段缓冲）∥ 注入 ∥ 真 key 代持 ∥ model 剥前缀 ∥ usage 逐值落库", async () => {
  const gate = deferred()
  const mock = await startMockUpstream(async (req, res) => {
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.write(sseFrame({ id: "c1", choices: [{ delta: { content: "first-frame" } }] }))
    await gate.promise // 第二帧 = 客户端收到首帧后才放行（缓冲实现死锁超时）
    res.write(sseFrame({ id: "c1", choices: [{ delta: { content: "second-frame" } }] }))
    res.write(sseFrame({ choices: [], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } }))
    res.write(sseFrame("[DONE]"))
    res.end()
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const memberId = seedMember(db)
  const key = KEYS.issueKey(db, memberId)
  try {
    const body = { model: "mock/mock-chat", messages: [{ role: "user", content: "hi" }], stream: true }
    const response = await chatStream(app.base, { key: key.plain, body })
    assert.equal(response.status, 200)
    assert.match(response.headers.get("content-type"), /text\/event-stream/)
    const t0 = Date.now()
    const reader = response.body.getReader()
    const parts = []
    const text = () => Buffer.concat(parts).toString("utf8")
    let frame1At = 0
    while (!text().includes("first-frame")) {
      const { value, done } = await withTimeout(reader.read(), 5000, "首帧（整段缓冲实现 = 死锁超时）")
      if (done) break
      parts.push(Buffer.from(value))
      frame1At = Date.now() - t0
    }
    assert.ok(text().includes("first-frame"), "首帧须在第二帧放行前到达客户端（非整段缓冲）")
    gate.release()
    while (true) {
      const { value, done } = await withTimeout(reader.read(), 5000, "后续帧")
      if (done) break
      parts.push(Buffer.from(value))
    }
    assert.match(text(), /second-frame/)
    assert.match(text(), /"prompt_tokens":3/)
    assert.match(text(), /data: \[DONE\]/)
    console.log(`[N1 冒烟读数] 首帧到达客户端 @${frame1At}ms——客户端先收首帧、后放行第二帧（非整段缓冲）`)
    assert.deepEqual(mock.requests[0]?.body, { ...body, model: "mock-chat", stream_options: { include_usage: true } }) // KD-SV-5 ∥ 上游 model = 首斜杠余段
    assert.equal(mock.requests[0].headers.authorization, "Bearer sk-upstream") // 真 key 代持（非团队 key）
    assert.equal(mock.requests[0].url, "/v1/chat/completions")
    await waitFor(() => lastUsage(db) !== null)
    const row = lastUsage(db)
    assert.equal(row.status, "ok")
    assert.equal(row.endpoint, "chat")
    assert.equal(row.stream, 1)
    assert.equal(row.model, "mock/mock-chat") // 记账 model = 对外标识（provider/model 前缀形）
    assert.deepEqual([row.member_id, row.key_id], [memberId, key.id])
    assert.deepEqual([row.prompt_tokens, row.completion_tokens, row.total_tokens], [3, 4, 7]) // AC-3 逐值
  } finally {
    gate.release()
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── N2 ∥ B1：非流式 ∥ 不重复注入 ─────────────────────────────────────────────
test("N2 ∥ B1：非流式透传（不动）∥ 已带 include_usage ⇒ 不重复注入 ∥ 记账", async () => {
  const payload = { id: "c9", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "ok" } }], usage: { prompt_tokens: 7, completion_tokens: 5, total_tokens: 12 } }
  let seen = null
  const mock = await startMockUpstream((req, res, record) => {
    seen = record
    if (record.body?.stream === true) {
      res.writeHead(200, { "content-type": "text/event-stream" })
      res.write(sseFrame({ choices: [], usage: payload.usage }))
      res.write(sseFrame("[DONE]"))
      res.end()
      return
    }
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(payload))
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    const plain = { model: "mock/mock-chat", messages: [] }
    const nonStream = await chatJson(app.base, { key: key.plain, body: plain })
    assert.equal(nonStream.status, 200)
    assert.deepEqual(nonStream.json, payload) // 透传（不包不改）
    assert.deepEqual(seen.body, { ...plain, model: "mock-chat" }) // 非流式不动：无 stream_options ∥ 上游 model = 余段
    await waitFor(() => lastUsage(db) !== null)
    assert.equal(lastUsage(db).stream, 0)
    assert.deepEqual([lastUsage(db).prompt_tokens, lastUsage(db).completion_tokens, lastUsage(db).total_tokens], [7, 5, 12])
    const injected = { model: "mock/mock-chat", messages: [], stream: true, stream_options: { include_usage: true, vendor_flag: "keep" } }
    const streamed = await chatStream(app.base, { key: key.plain, body: injected })
    assert.equal(streamed.status, 200)
    assert.match((await readAllBytes(streamed)).toString("utf8"), /data: \[DONE\]/)
    assert.deepEqual(seen.body, { ...injected, model: "mock-chat" }) // 已带 ⇒ 不重复注入 ∥ 其它字段不改写（vendor_flag 保留）
    await waitFor(() => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n === 2)
    assert.equal(lastUsage(db).stream, 1)
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── B3：断连中止 ─────────────────────────────────────────────────────────────
test("B3：客户端中途断开 ⇒ 中止上游 ∥ status='aborted'（token NULL）∥ 断连日志行", async () => {
  const upstreamGone = deferred()
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.write(sseFrame({ id: "c1", choices: [{ delta: { content: "hold" } }] }))
    res.on("close", () => upstreamGone.release()) // 未见 end ⇒ 断连（中止观察点）
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    const ac = new AbortController()
    const response = await chatStream(app.base, { key: key.plain, body: { model: "mock/mock-chat", messages: [], stream: true }, signal: ac.signal })
    const { value } = await withTimeout(response.body.getReader().read(), 5000, "首帧（流已建立）")
    assert.match(Buffer.from(value).toString("utf8"), /hold/)
    ac.abort() // 客户端中途断开（不读余下）
    await withTimeout(upstreamGone.promise, 5000, "上游中止（mock 侧断连观察）")
    await waitFor(() => lastUsage(db)?.status === "aborted")
    const row = lastUsage(db)
    assert.equal(row.status, "aborted")
    assert.equal(row.endpoint, "chat")
    assert.equal(row.stream, 1)
    assert.deepEqual([row.prompt_tokens, row.completion_tokens, row.total_tokens], [null, null, null])
    assert.ok(app.lines.some((l) => l.event === "request" && l.aborted === true), "断连请求须有日志行（close 面）")
  } finally {
    upstreamGone.release()
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── B5 ∥ B6：BOM/CRLF ∥ 超长行 ───────────────────────────────────────────────
test("B5 ∥ B6：BOM/CRLF 容错且字节不变 ∥ 超长行（>1 MiB）弃扫（NULL）∥ 中继不受影响", async () => {
  const usageFrame = { choices: [], usage: { prompt_tokens: 11, completion_tokens: 22, total_tokens: 33 } }
  const bomSent = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`data: ${JSON.stringify({ id: "c1", choices: [{ delta: { content: "bom" } }] })}\r\n\r\n`),
    Buffer.from(`data: ${JSON.stringify(usageFrame)}\r\n`), Buffer.from("data: [DONE]\r\n"),
  ])
  const giantLine = `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }, pad: "x".repeat(1200 * 1024) })}`
  assert.ok(giantLine.length > TAP.TAP_MAX_LINE_BYTES, "夹具行须 > 1 MiB")
  const giantSent = Buffer.from(`${giantLine}\ndata: [DONE]\n`)
  const sentByMode = { bom: bomSent, giant: giantSent }
  const mode = { current: "bom" }
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.end(sentByMode[mode.current])
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const key = KEYS.issueKey(db, seedMember(db))
  const streamOnce = async () => {
    const res = await chatStream(app.base, { key: key.plain, body: { model: "mock/mock-chat", messages: [], stream: true } })
    assert.equal(res.status, 200)
    return readAllBytes(res)
  }
  try {
    const bomReceived = await streamOnce()
    assert.equal(bomReceived.equals(bomSent), true, "SSE 字节零改（BOM/CRLF 原样）")
    await waitFor(() => lastUsage(db) !== null)
    assert.deepEqual([lastUsage(db).prompt_tokens, lastUsage(db).completion_tokens, lastUsage(db).total_tokens], [11, 22, 33]) // BOM 剥除 ∥ CRLF 容错照常提取
    mode.current = "giant"
    const giantReceived = await streamOnce()
    assert.equal(giantReceived.equals(giantSent), true, "中继不受影响（字节零改）")
    await waitFor(() => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n === 2)
    const rows = db.prepare("SELECT * FROM usage ORDER BY id").all()
    assert.equal(rows[1].status, "ok") // 记录不静默（B2 形）
    assert.deepEqual([rows[1].prompt_tokens, rows[1].completion_tokens, rows[1].total_tokens], [null, null, null]) // 弃扫 ⇒ NULL
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── E3 ∥ E5 ∥ E6：错误面 ─────────────────────────────────────────────────────
test("E3 ∥ E5 ∥ E6：未命中 404 ∥ 缺 model 400（不转发 ∥ 不落行）∥ 上游 500 原样透传 + error 行 ∥ 不可达 502 + error 行", async () => {
  const upstreamText = JSON.stringify({ error: { message: "upstream boom", type: "server_error" } })
  const mock = await startMockUpstream((req, res, record) => {
    if (record.body?.model === "boom-model") {
      res.writeHead(500, { "content-type": "application/json" })
      res.end(upstreamText)
      return
    }
    res.writeHead(200, { "content-type": "application/json" })
    res.end("{}")
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`, ["mock-chat", "boom-model"]) })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    const miss = await chatJson(app.base, { key: key.plain, body: { model: "nope-model", messages: [] } }) // 裸名不解析 ⇒ 404
    assert.equal(miss.status, 404)
    assert.equal(miss.json.error.code, "model_not_found")
    assert.match(miss.json.error.message, /nope-model/)
    assert.match(miss.json.error.message, /provider\/model/) // 提示带前缀形
    const missing = await chatJson(app.base, { key: key.plain, body: { messages: [] } })
    assert.equal(missing.status, 400)
    assert.equal(missing.json.error.code, "invalid_request_error")
    const notJson = await fetch(`${app.base}/v1/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" }, body: "{not json" })
    assert.equal(notJson.status, 400)
    assert.equal((await notJson.json()).error.code, "invalid_request_error")
    assert.equal(mock.requests.length, 0) // 均不转发
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 0) // 准入前拒打不落用量
    const boom = await chatJson(app.base, { key: key.plain, body: { model: "mock/boom-model", messages: [] } })
    assert.equal(boom.status, 500) // E5：状态码原样
    assert.equal(boom.text, upstreamText) // body 原样（不包不改——逐字节等）
    await waitFor(() => lastUsage(db) !== null)
    assert.equal(lastUsage(db).status, "error")
    assert.deepEqual([lastUsage(db).prompt_tokens, lastUsage(db).completion_tokens, lastUsage(db).total_tokens], [null, null, null])
    const dead = await freePort() // 已释放 ⇒ 连接拒绝（不可达形）
    const deadApp = await startGateway({ db, config: configWith(`http://127.0.0.1:${dead}/v1`) })
    try {
      const unreachable = await chatJson(deadApp.base, { key: key.plain, body: { model: "mock/mock-chat", messages: [] } })
      assert.equal(unreachable.status, 502)
      assert.equal(unreachable.json.error.code, "upstream_error")
      assert.match(unreachable.json.error.message, /上游不可达/)
      assert.ok(deadApp.lines.some((l) => l.event === "upstream_unreachable"))
    } finally {
      await deadApp.close()
    }
    await waitFor(() => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n === 2)
    assert.equal(lastUsage(db).status, "error") // E5 ∥ E6 各一行
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── E7：请求体超限 ───────────────────────────────────────────────────────────
test("E7：请求体 > 32 MiB ⇒ 413 payload_too_large（不转发）", async () => {
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end("{}")
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    const port = Number(new URL(app.base).port)
    const headers = { authorization: `Bearer ${key.plain}`, "content-type": "application/json" }
    const declared = await rawPost({ port, headers: { ...headers, "content-length": String(SERVER.MAX_BODY_BYTES + 1) }, chunks: [Buffer.alloc(64 * 1024)], end: false }) // ① 声明越限（预检）
    assert.equal(declared.status, 413)
    assert.equal(JSON.parse(declared.text).error.code, "payload_too_large")
    const real = await rawPost({ port, headers, chunks: [Buffer.alloc(SERVER.MAX_BODY_BYTES + 1024)], end: true }) // ② 实到体越限（读限兜底）
    assert.equal(real.status, 413)
    assert.equal(JSON.parse(real.text).error.code, "payload_too_large")
    assert.equal(mock.requests.length, 0) // 不转发
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 0)
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── AC-1 ∥ 准入门：团队 key 三态 ∥ 配额 ──────────────────────────────────────
test("AC-1 ∥ 准入门：/v1/models 三态（无 ∥ 非 Bearer ∥ 坏 ∥ 吊销 ⇒ 401；有效 ⇒ 200）∥ chat 同门 ∥ 超额 429 ∥ 额内放行", async () => {
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end("{}")
  })
  const db = DB.openDatabase(":memory:")
  const app = await startGateway({ db, config: configWith(`${mock.base}/v1`) })
  const memberId = seedMember(db, { quotaTokens: 5 })
  const valid = KEYS.issueKey(db, memberId)
  const revoked = KEYS.issueKey(db, memberId)
  KEYS.revokeKey(db, revoked.id)
  try {
    const cases = [
      ["无 key", {}],
      ["非 Bearer", { authorization: "Basic abc" }],
      ["坏 key", { authorization: "Bearer sk-tc-nope" }],
      ["已吊销", { authorization: `Bearer ${revoked.plain}` }],
    ]
    for (const [label, headers] of cases) {
      const res = await fetch(`${app.base}/v1/models`, { headers })
      assert.equal(res.status, 401, label)
      assert.equal((await res.json()).error.code, "invalid_api_key", label)
    }
    const ok = await fetch(`${app.base}/v1/models`, { headers: { authorization: `Bearer ${valid.plain}` } })
    assert.equal(ok.status, 200)
    assert.deepEqual((await ok.json()).data.map((m) => m.id), ["mock/mock-chat", "bge-m3"])
    const denied = await chatJson(app.base, { body: { model: "mock/mock-chat", messages: [] } }) // chat 同门（无 key）
    assert.equal(denied.status, 401)
    assert.equal(denied.json.error.code, "invalid_api_key")
    assert.equal(mock.requests.length, 0)
    USAGE.recordUsage(db, { memberId, keyId: valid.id, endpoint: "chat", model: "mock/mock-chat", status: "ok", totalTokens: 5 })
    const exceeded = await chatJson(app.base, { key: valid.plain, body: { model: "mock/mock-chat", messages: [] } })
    assert.equal(exceeded.status, 429) // [3] 准入拒绝（已用 ≥ 额度）
    assert.equal(exceeded.json.error.code, "quota_exceeded")
    assert.match(exceeded.json.error.message, /已用 5 \/ 额度 5/) // 可读提示（AC-4 ∥ E2 面）
    assert.equal(mock.requests.length, 0)
    db.prepare("UPDATE members SET quota_tokens = 50 WHERE id = ?").run(memberId)
    const allowed = await chatJson(app.base, { key: valid.plain, body: { model: "mock/mock-chat", messages: [] } })
    assert.equal(allowed.status, 200) // 额内放行（逐请求查库——改额度即生效）
    assert.equal(mock.requests.length, 1)
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})
