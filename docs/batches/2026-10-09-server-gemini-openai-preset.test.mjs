/**
 * 2026-10-09-server-gemini-openai-preset.test.mjs — thincoder-server 批内单测件（件② server 代理 + 逐渠 `proxy` 旗 ·
 * 台账 #1129 · KD-SV-55；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-server-gemini-openai-preset.test.mjs`
 *
 * 射程（判据源 = 本批档 §2 ②/③/④ ∥ gateway/API.md §2.1/§2.2/§5/§6 KD-SV-55 ∥ ops/OPS.md §1/§7 ∥ store/STORE.md §2 v9）：
 *   A 配置面：顶层 `proxy.uri` 拒启族（非对象 ∥ 空串 ∥ 非 URL ∥ scheme 非 `http:`）∥ 条目 `proxy` 非布尔拒启
 *     ∥ 两启动 warn 逐字 ∥ loopback 判定（NO_PROXY 语义）
 *   B 存储 v9：空库直落 9 ∥ v8 库自动升 9（存量行得 0）∥ 迁移幂等 ∥ `rowToEntry` 解码 ∥ 种子列
 *   C 端点字段往返：GET/POST/PATCH `proxy` 布尔 ∥ 非布尔 400（库零变）∥ discover 非布尔 400
 *   D 模型发现判定：明传优先 ∥ `providerId` 条目旗兜底 ∥ 皆无 ⇒ 直连 ∥ loopback 恒直连（假代理零命中）
 *   E 转发判定：http 目标经典转发（绝对 URI 请求行）∥ https 目标 CONNECT 隧道（自签 fixture 全量 TLS 校验）
 *     ∥ SSE 逐块渐进（第二帧待首帧到客户端后才发）∥ 代理不可达 502 ∥ 断连 aborted（代理 socket 拆除）
 *     ∥ 保存热生效（PATCH ⇒ 下一请求经代理）
 *   F 预设行：`gemini-openai` 逐值 ∥ 21 键（表 ∥ 端点同面）
 *   F2 控制台两窗「走代理」：探针（测试/刷新/获取模型）随携勾选态（未勾 ⇒ `proxy: false` 明传）∥ 添加窗 = 勾才携
 *     `proxy: true`（未勾 ⇒ 省略键）∥ 详情窗初值 = 行 `proxy` ∥ 保存 = 变更才携（WEBUI §2.4④——桩 DOM，零浏览器）
 * 夹具 = 进程内假代理（net）∥ 假直达上游（http）∥ 自签证书 fixture（`setDefaultCACertificates`——全量校验）；
 * 零真实外网（外址用 `provider.invalid`——保留域，恒不解）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer, request as httpRequest } from "node:http"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createSecureContext, rootCertificates, setDefaultCACertificates, TLSSocket } from "node:tls"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const PRESETS = await load("thincoder-server/src/ops/presets.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const PROXY = await load("thincoder-server/src/gateway/proxy.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

const EMBEDDING = { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" }
const PASSWORD = "password-123"
const cleanups = []
const tmpBox = (tag) => { const dir = mkdtempSync(join(tmpdir(), `tc-proxy-${tag}-`)); cleanups.push(() => rmSync(dir, { recursive: true, force: true })); return dir }
const writeConfig = (tag, obj) => { const file = join(tmpBox(tag), "config.json"); writeFileSync(file, JSON.stringify(obj)); return file }
const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))
const waitFor = async (pred, timeoutMs = 6000) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (pred()) return true
    await tick(25)
  }
  return false
}

test.after(() => { for (const fn of cleanups) fn() })

// ── 夹具 ─────────────────────────────────────────────────────────────────────

/** 进程内假代理（net）：收到首个完整请求（头 + Content-Length 体）即回调（`record.firstLine` = 请求行；
 *  `record.body` = 文本体（无 body ⇒ null）；CONNECT 径可原位 TLS 升档）。 */
async function startFakeProxy(handler) {
  const sockets = new Set()
  const requests = []
  const server = createNetServer((sock) => {
    sockets.add(sock)
    sock.on("close", () => sockets.delete(sock))
    sock.on("error", () => {})
    let buf = Buffer.alloc(0)
    sock.on("data", function onData(d) {
      buf = Buffer.concat([buf, d])
      const split = buf.indexOf("\r\n\r\n")
      if (split < 0) return
      const head = buf.toString("latin1", 0, split)
      const record = { firstLine: head.split("\r\n")[0], head, body: null }
      requests.push(record)
      sock.removeListener("data", onData)
      const rest = buf.subarray(split + 4)
      const length = Number((head.match(/content-length: *(\d+)/i) ?? [])[1] ?? 0)
      if (length === 0 || rest.length >= length) {
        if (length > 0) record.body = rest.subarray(0, length).toString("utf8")
        handler(sock, record)
        return
      }
      const chunks = [rest]
      let have = rest.length
      sock.on("data", function onBody(more) {
        chunks.push(more)
        have += more.length
        if (have < length) return
        sock.removeListener("data", onBody)
        record.body = Buffer.concat(chunks).subarray(0, length).toString("utf8")
        handler(sock, record)
      })
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    uri: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { for (const s of sockets) s.destroy(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 假直达上游（http；`base` 供 baseURL——loopback ⇒ 恒直连面）。 */
async function startFakeUpstream(handler) {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const record = { method: req.method, url: req.url, headers: req.headers, text: Buffer.concat(chunks).toString("utf8") }
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

/** 非流式上游回执（`text()` 径——假代理直答，不转发）。 */
const jsonReply = (sock, payload) => {
  const body = JSON.stringify(payload)
  sock.write(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n`)
  sock.write(body)
  sock.end()
}
/** 假直上游的 http 回执（真 ServerResponse 面——与 socket 径分开）。 */
const httpJsonReply = (res, payload) => {
  const body = JSON.stringify(payload)
  res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) })
  res.end(body)
}
const sseReplyHead = (sock) => sock.write("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n\r\n")
const sseFrame = (payload) => `data: ${payload}\n\n`
const CHAT_OK = { id: "cc-1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "hi" } }], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } }

/** 校验后配置（`proxy` 可给——缺省 = 零代理；providers 走控制台面，种子清零）。 */
const configWith = ({ proxy = undefined } = {}) => CONFIG.validateConfig({ host: "127.0.0.1", providers: [], ...(proxy ? { proxy } : {}), embedding: EMBEDDING })

/** 进程内网关 + provider 管理面 + 账号面（同一运行时实例——热生效同见）。 */
async function startApp({ db, config }) {
  const log = { info() {}, warn() {}, error() {} }
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config, log, env: {} })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime, log, env: {} })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    port: server.address().port,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

async function call(base, method, path, { body, cookie, key, headers = {} } = {}) {
  const finalHeaders = { "content-type": "application/json", ...headers }
  if (cookie) finalHeaders.cookie = cookie
  if (key) finalHeaders.authorization = `Bearer ${key}`
  const res = await fetch(base + path, { method, headers: finalHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}
const login = async (base, username) => {
  const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}
const seedMember = (db, username = "alice") => Number(db
  .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES (?, ?, 'scrypt$fixture', ?)")
  .run(username, username, new Date().toISOString()).lastInsertRowid)
const lastUsage = (db) => db.prepare("SELECT * FROM usage ORDER BY id DESC LIMIT 1").get() ?? null

/** C16 自签证书 fixture（沿用 2026-10-08 代理批：EC P-256 · CN=proxy-chunked.test · 至 2036）——入默认 CA 集
 *  ⇒ 全量校验通过（实现无 `insecureTls` 面——判据 = 校验真开）。 */
const TLS_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgmB/kfXxjtsWiecc6
S3Oz51xQzgAi3hmXWWUAY/thEOmhRANCAASNsalc8ATMBvPXmmiwZvZg2mRF4fJC
9DVi1ZLqi+s3uEpN0yxlW6fqq5LFReimFWuiNjTo1RL9lik+chuORRpo
-----END PRIVATE KEY-----
`
const TLS_CERT = `-----BEGIN CERTIFICATE-----
MIIBjzCCATWgAwIBAgIUDur1r+GQcHzNZDxcLElj3neqyc4wCgYIKoZIzj0EAwIw
HTEbMBkGA1UEAwwScHJveHktY2h1bmtlZC50ZXN0MB4XDTI2MTAwODA0NTU0N1oX
DTM2MTAwNTA0NTU0N1owHTEbMBkGA1UEAwwScHJveHktY2h1bmtlZC50ZXN0MFkw
EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEjbGpXPAEzAbz15posGb2YNpkReHyQvQ1
YtWS6ovrN7hKTdMsZVun6quSxUXophVrojY06NUS/ZYpPnIbjkUaaKNTMFEwHQYD
VR0OBBYEFJYPgMi262Er8Q3m+Ys0FN/T641wMB8GA1UdIwQYMBaAFJYPgMi262Er
8Q3m+Ys0FN/T641wMA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSAAwRQIg
NfN/MClhSSzTMb/Ly51p2vlhhHvp41GXcuA3tRJD/RACIQDrPljsAKSMWFRKUhxR
IprhkPbenKqVFcl3Qy5yvd4H2g==
-----END CERTIFICATE-----
`
setDefaultCACertificates([...rootCertificates, TLS_CERT]) // 全局默认 CA 集加 fixture 根（本件进程内）

// ── A 配置面 ─────────────────────────────────────────────────────────────────

const rawConfig = (over = {}) => ({ host: "127.0.0.1", embedding: EMBEDDING, ...over })

test("A1 顶层 proxy 拒启族：非对象 ∥ 空串 ∥ 非 URL ∥ scheme 非 http: ⇒ 抛 ∥ 合法 http: 收 ∥ 缺省 null", () => {
  for (const bad of [[], 123, null, "http://127.0.0.1:3128", {}, { uri: "" }, { uri: "  " }, { uri: 42 }, { uri: "not a url" }, { uri: "https://127.0.0.1:3128" }, { uri: "socks5://127.0.0.1:1080" }]) {
    assert.throws(() => CONFIG.validateConfig(rawConfig({ proxy: bad })), `proxy = ${JSON.stringify(bad)} 应拒启`)
  }
  assert.equal(CONFIG.validateConfig(rawConfig()).proxy, null, "缺位 ⇒ null（零代理）")
  assert.deepEqual(CONFIG.validateConfig(rawConfig({ proxy: { uri: "http://127.0.0.1:3128" } })).proxy, { uri: "http://127.0.0.1:3128" })
})

test("A2 条目 proxy 单源判据：非布尔 ⇒ 拒启 ∥ 缺省 false ∥ true 照收", () => {
  const entry = (proxy) => ({ name: "p", baseURL: "http://127.0.0.1:1/v1", models: [], ...(proxy === undefined ? {} : { proxy }) })
  for (const bad of ["yes", 1, 0, null]) {
    assert.throws(() => CONFIG.validateConfig(rawConfig({ providers: [entry(bad)] })), `proxy = ${JSON.stringify(bad)} 应拒启`)
  }
  assert.equal(CONFIG.validateConfig(rawConfig({ providers: [entry()] })).providers[0].proxy, false)
  assert.equal(CONFIG.validateConfig(rawConfig({ providers: [entry(true)] })).providers[0].proxy, true)
})

test("A3 两启动 warn 逐字：① 明文 http uri ∥ ② 旗 true 而 uri 缺位（互斥面）∥ 两无 ⇒ 零代理警告", () => {
  const W1 = "proxy.uri 为明文 http——上游密钥经代理外发（确认代理可信）"
  const W2 = "条目 proxy: true 而顶层 uri 缺位——该渠直连（旗未生效）"
  const flag = { name: "p", baseURL: "http://127.0.0.1:1/v1", models: [], proxy: true }
  const plain = { name: "p", baseURL: "http://127.0.0.1:1/v1", models: [] }
  const warns = (tag, providers, proxy) => CONFIG.loadConfig(writeConfig(tag, { host: "127.0.0.1", providers, ...(proxy ? { proxy } : {}), embedding: EMBEDDING }), { env: {} }).warnings
  const one = warns("w1", [plain], { uri: "http://127.0.0.1:3128" })
  assert.ok(one.includes(W1), `缺 warn ①：${JSON.stringify(one)}`)
  assert.ok(!one.includes(W2), "uri 在案 ⇒ ② 不触发")
  const two = warns("w2", [flag])
  assert.ok(two.includes(W2), `缺 warn ②：${JSON.stringify(two)}`)
  assert.ok(!two.includes(W1), "零 uri ⇒ ① 不触发")
  const both = warns("w3", [flag], { uri: "http://127.0.0.1:3128" })
  assert.ok(both.includes(W1) && !both.includes(W2), "uri 在案 + 旗 true ⇒ 仅 ①")
  const none = warns("w4", [plain])
  assert.ok(!none.includes(W1) && !none.includes(W2), `两无 ⇒ 零代理警告：${JSON.stringify(none)}`)
})

test("A4 loopback 判定（NO_PROXY 语义）：localhost ∥ *.localhost ∥ 127.x ∥ ::1 ⇒ true ∥ 外址 ⇒ false", () => {
  for (const url of ["http://localhost/v1", "http://a.localhost/v1", "http://localhost./v1", "http://127.0.0.1:1/v1", "http://127.9.9.9/v1", "https://[::1]:8443/v1"]) {
    assert.equal(PROXY.isLoopbackTarget(url), true, url)
  }
  for (const url of ["https://example.com/v1", "http://1.2.3.4/v1", "http://127.0.0.2.nip.io/v1", "http://[::2]:80/v1", "not a url"]) {
    assert.equal(PROXY.isLoopbackTarget(url), false, url)
  }
})

// ── B 存储 v9 ───────────────────────────────────────────────────────────────

test("B1 空库直落 9 ∥ providers.proxy 列形（INTEGER NOT NULL DEFAULT 0）∥ 迁移链尾 = v9", () => {
  const fresh = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [9, 9])
    const column = fresh.prepare("PRAGMA table_info(providers)").all().find((item) => item.name === "proxy")
    assert.ok(column, "providers.proxy 缺位")
    assert.deepEqual([column.type, column.notnull, String(column.dflt_value)], ["INTEGER", 1, "0"])
    assert.equal(DB.MIGRATIONS.at(-1).v, 9)
  } finally { fresh.close() }
})

test("B2 v8 库自动升 9：存量行得 0（缺省直连）∥ 迁移幂等 ∥ rowToEntry 解码 1/0 ⇒ true/false", () => {
  const file = join(tmpBox("v9"), "gateway.db")
  const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 8) })
  assert.equal(DB.readVersion(legacy), 8)
  legacy.exec("INSERT INTO providers (name, base_url, api_key, models_json, settings_json, model_meta_json, created_at, updated_at) VALUES ('old', 'http://x/v1', '', '[\"m\"]', '{}', '{}', '2026-10-09', '2026-10-09')")
  legacy.close()
  const db = DB.openDatabase(file) // 启动自动升
  try {
    assert.equal(DB.readVersion(db), 9, "v8 库自动升 9")
    assert.equal(db.prepare("SELECT proxy FROM providers WHERE name = 'old'").get().proxy, 0, "存量行即刻得 0")
    assert.equal(DB.migrate(db), 9, "幂等（再跑迁移链零效）")
    const row = () => db.prepare("SELECT * FROM providers WHERE name = 'old'").get()
    assert.equal(PROVIDERS.rowToEntry(row()).proxy, false, "解码 0 ⇒ false")
    db.prepare("UPDATE providers SET proxy = 1 WHERE name = 'old'").run()
    assert.equal(PROVIDERS.rowToEntry(row()).proxy, true, "解码 1 ⇒ true")
  } finally { db.close() }
})

test("B3 种子导入携 proxy 列：true ⇒ 1 ∥ 缺省 ⇒ 0（库单源——rowToEntry 同判）", () => {
  const db = DB.openDatabase(":memory:")
  try {
    const result = PROVIDERS.importProviderSeed(db, { providers: [
      { name: "a", baseURL: "http://x/v1", apiKey: "", models: [], proxy: true },
      { name: "b", baseURL: "http://y/v1", apiKey: "", models: [] },
    ] })
    assert.deepEqual(result, { action: "imported", count: 2 })
    assert.deepEqual(db.prepare("SELECT name, proxy FROM providers ORDER BY name").all().map((item) => [item.name, item.proxy]), [["a", 1], ["b", 0]])
    assert.deepEqual(PROVIDERS.listProviderEntries(db).map((entry) => [entry.name, entry.proxy]), [["a", true], ["b", false]])
  } finally { db.close() }
})

// ── C 端点字段往返（GET/POST/PATCH + 非布尔 400）──────────────────────────────

test("C1 字段往返：POST 携 true ⇒ GET 行 true（布尔）∥ 缺省 ⇒ false ∥ PATCH 直写 false/true ∥ 无键不动", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const app = await startApp({ db, config: configWith() })
  try {
    const admin = await login(app.base, "admin")
    const post = (body) => call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body })
    const rowOf = async (id) => (await call(app.base, "GET", "/api/admin/providers", { cookie: admin.cookie })).json.providers.find((item) => item.id === id)
    assert.equal((await post({ name: "px", baseURL: "http://127.0.0.1:1/v1", apiKey: "sk-1", models: ["m-1"], proxy: true })).status, 200)
    const on = await rowOf(1)
    assert.equal(on.proxy, true, "POST true 往返")
    assert.equal(typeof on.proxy, "boolean", "读面布尔形")
    assert.equal((await post({ name: "plain", baseURL: "http://127.0.0.1:1/v1", models: [] })).status, 200)
    assert.equal((await rowOf(2)).proxy, false, "缺省 ⇒ false")
    const patch = (body) => call(app.base, "PATCH", "/api/admin/providers/1", { cookie: admin.cookie, body })
    assert.equal((await patch({ proxy: false })).status, 200)
    assert.equal((await rowOf(1)).proxy, false, "PATCH 直写 false")
    assert.equal((await patch({ name: "px2", proxy: true })).status, 200)
    const after = await rowOf(1)
    assert.deepEqual([after.name, after.proxy], ["px2", true], "PATCH true + 无 proxy 键的行（provider 2）不动")
    assert.equal((await rowOf(2)).proxy, false)
  } finally { await app.close(); db.close() }
})

test("C2 非布尔 ⇒ 400 且库零变（POST ∥ PATCH ∥ discover——同一形）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const app = await startApp({ db, config: configWith() })
  try {
    const admin = await login(app.base, "admin")
    assert.equal((await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "px", baseURL: "http://127.0.0.1:1/v1", models: [], proxy: true } })).status, 200)
    for (const bad of ["yes", 1, null]) {
      const res = await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "bad", baseURL: "http://127.0.0.1:1/v1", models: [], proxy: bad } })
      assert.equal(res.status, 400, `POST proxy = ${JSON.stringify(bad)}`)
      assert.equal(res.json.error.code, "invalid_request_error")
      const edited = await call(app.base, "PATCH", "/api/admin/providers/1", { cookie: admin.cookie, body: { proxy: bad } })
      assert.equal(edited.status, 400, `PATCH proxy = ${JSON.stringify(bad)}`)
    }
    assert.deepEqual(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n, 1, "400 ⇒ 零新行")
    assert.equal(db.prepare("SELECT proxy FROM providers WHERE id = 1").get().proxy, 1, "400 ⇒ 现值不动")
    for (const bad of ["yes", 1]) {
      const res = await call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body: { baseURL: "http://127.0.0.1:1/v1", proxy: bad } })
      assert.equal(res.status, 400, `discover proxy = ${JSON.stringify(bad)}`)
    }
    assert.equal((await call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body: { baseURL: "http://127.0.0.1:1/v1", providerId: 999 } })).status, 404, "providerId 不存在 ⇒ 404（原判零回归）")
  } finally { await app.close(); db.close() }
})

// ── D 模型发现判定（命中 ∥ 明传优先 ∥ 条目旗兜底 ∥ 直连三支）────────────────────

test("D1 命中 + `providerId` 条目旗兜底：旗 true ∧ uri 在案 ⇒ discover 经代理（绝对 URI + 存库 key 代持）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const proxy = await startFakeProxy((sock) => jsonReply(sock, { data: [{ id: "proxied-model" }] }))
  const app = await startApp({ db, config: configWith({ proxy: { uri: proxy.uri } }) })
  try {
    const admin = await login(app.base, "admin")
    await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-stored", models: [], proxy: true } })
    const res = await call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body: { baseURL: "http://provider.invalid/v1", providerId: 1 } })
    assert.equal(res.status, 200, res.text)
    assert.deepEqual(res.json.models, ["proxied-model"])
    assert.equal(proxy.requests.length, 1, "恰一次经代理")
    assert.equal(proxy.requests[0].firstLine, "GET http://provider.invalid/v1/models HTTP/1.1", "经典转发 = 绝对 URI 请求行")
    assert.ok(proxy.requests[0].head.toLowerCase().includes("authorization: bearer sk-stored"), "库内 key 代持（条目旗兜底径同携）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("D2 明传优先 ⊃ 条目旗：body proxy false 覆旗 true ⇒ 直连（假代理零命中）∥ 无旗/无 uri ⇒ 直连", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const proxy = await startFakeProxy((sock) => jsonReply(sock, { data: [{ id: "proxied-model" }] }))
  const app = await startApp({ db, config: configWith({ proxy: { uri: proxy.uri } }) })
  try {
    const admin = await login(app.base, "admin")
    await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-1", models: [], proxy: true } })
    await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "off", baseURL: "http://provider.invalid/v1", apiKey: "sk-2", models: [] } })
    const discover = (body) => call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body })
    const overridden = await discover({ baseURL: "http://provider.invalid/v1", apiKey: "sk-2", proxy: false })
    assert.equal(overridden.status, 502, "明传 false ⊃ 旗 true ⇒ 直连 ⇒ 外址不解 ⇒ 502")
    assert.equal(overridden.json.error.code, "upstream_error")
    const unflagged = await discover({ baseURL: "http://provider.invalid/v1", providerId: 2 }) // 条目旗 false ⇒ 直连
    assert.equal(unflagged.status, 502, "无旗 ⇒ 直连 ⇒ 502")
    assert.equal(proxy.requests.length, 0, "两径皆直连——假代理零命中")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("D3 无 uri ⇒ 直连（旗 true 亦不生效）∥ loopback 恒直连（旗 true ∧ uri 在案——假代理零命中）", { timeout: 30_000 }, async () => {
  const direct = await startFakeUpstream((_req, res) => httpJsonReply(res, { data: [{ id: "direct-model" }] }))
  const proxy = await startFakeProxy((sock) => jsonReply(sock, { data: [{ id: "proxied-model" }] }))
  const dbA = DB.openDatabase(":memory:")
  await MEMBERS.createMember(dbA, { username: "admin", role: "admin", password: PASSWORD })
  const appNoUri = await startApp({ db: dbA, config: configWith() }) // 零 proxy 段
  const dbB = DB.openDatabase(":memory:")
  await MEMBERS.createMember(dbB, { username: "admin", role: "admin", password: PASSWORD })
  const appLoop = await startApp({ db: dbB, config: configWith({ proxy: { uri: proxy.uri } }) })
  try {
    const adminA = await login(appNoUri.base, "admin")
    await call(appNoUri.base, "POST", "/api/admin/providers", { cookie: adminA.cookie, body: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-1", models: [], proxy: true } })
    const noUri = await call(appNoUri.base, "POST", "/api/admin/providers/discover", { cookie: adminA.cookie, body: { baseURL: "http://provider.invalid/v1", providerId: 1 } })
    assert.equal(noUri.status, 502, "旗 true 而 uri 缺位 ⇒ 直连（旗未生效）")

    const adminB = await login(appLoop.base, "admin")
    await call(appLoop.base, "POST", "/api/admin/providers", { cookie: adminB.cookie, body: { name: "px", baseURL: `${direct.base}/v1`, apiKey: "sk-1", models: [], proxy: true } })
    const loop = await call(appLoop.base, "POST", "/api/admin/providers/discover", { cookie: adminB.cookie, body: { baseURL: `${direct.base}/v1`, providerId: 1 } })
    assert.equal(loop.status, 200, loop.text)
    assert.deepEqual(loop.json.models, ["direct-model"], "loopback 恒直连（真直达上游回执）")
    assert.equal(proxy.requests.length, 0, "loopback 旁路 ⇒ 假代理零命中")
    assert.equal(direct.requests.length, 1)
    assert.equal(direct.requests[0].url, "/v1/models")
  } finally {
    await appNoUri.close(); await appLoop.close(); await direct.close(); await proxy.close()
    dbA.close(); dbB.close()
  }
})

// ── E 转发判定（经典转发 ∥ CONNECT 隧道 ∥ SSE 逐块 ∥ 502 ∥ aborted ∥ 热生效）──────

/** 会话夹具：admin + 团队 key + 指定 provider 条目（控制台 POST——运行时热生效同径）。 */
async function seedChat({ db, config, provider }) {
  const member = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const app = await startApp({ db, config })
  const admin = await login(app.base, "admin")
  const res = await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: provider })
  assert.equal(res.status, 200, res.text)
  const key = KEYS.issueKey(db, member.member.id).plain
  return { app, admin, key }
}
const chatJson = async (app, { key, body }) => call(app.base, "POST", "/v1/chat/completions", { key, body })

test("E1 http 目标经典转发：chat 携旗经代理（绝对 URI + 注入体）⇒ 200 ∥ 记账 ok（provider/model/用量）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  const proxy = await startFakeProxy((sock) => jsonReply(sock, CHAT_OK))
  const { app, key } = await seedChat({ db, config: configWith({ proxy: { uri: proxy.uri } }), provider: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-upstream", models: ["m-1"], proxy: true } })
  try {
    const res = await chatJson(app, { key, body: { model: "px/m-1", messages: [{ role: "user", content: "hi" }] } })
    assert.equal(res.status, 200, res.text)
    assert.deepEqual(res.json.choices[0].message.content, "hi")
    assert.equal(proxy.requests.length, 1)
    assert.equal(proxy.requests[0].firstLine, "POST http://provider.invalid/v1/chat/completions HTTP/1.1")
    assert.ok(proxy.requests[0].head.toLowerCase().includes("authorization: bearer sk-upstream"), "真 key 代持（经代理）")
    assert.equal(JSON.parse(proxy.requests[0].body).model, "m-1", "上游请求体 model = 上游模型名（注入形）")
    assert.ok(await waitFor(() => lastUsage(db)?.status === "ok"))
    const row = lastUsage(db)
    assert.deepEqual([row.provider, row.model, row.prompt_tokens, row.total_tokens], ["px", "m-1", 3, 5])
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("E2 https 目标 CONNECT 隧道：自签 TLS 全量校验 ⇒ 200 ∥ SSE 逐块渐进（第二帧待首帧到客户端后才发）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  const ctx = createSecureContext({ key: TLS_KEY, cert: TLS_CERT })
  const tunnel = { connects: [], requests: [], socket: null }
  const proxy = await startFakeProxy((sock, record) => {
    assert.match(record.firstLine, /^CONNECT proxy-chunked\.test:443 HTTP\/1\.1$/)
    tunnel.connects.push(record.firstLine)
    sock.write("HTTP/1.1 200 Connection established\r\n\r\n")
    const tls = new TLSSocket(sock, { isServer: true, secureContext: ctx }) // 原位 TLS 升档（假目标端）
    tunnel.socket = tls
    tls.on("error", () => {})
    let buf = ""
    tls.on("data", (d) => {
      buf += d.toString("utf8")
      if (!buf.includes("\r\n\r\n")) return
      tunnel.requests.push(buf.split("\r\n")[0])
      sseReplyHead(tls)
      tls.write(sseFrame(JSON.stringify({ choices: [{ delta: { content: "He" } }] }))) // 首帧（第二帧 = 测试放行后才发）
    })
  })
  const { app, key } = await seedChat({ db, config: configWith({ proxy: { uri: proxy.uri } }), provider: { name: "px", baseURL: "https://proxy-chunked.test/v1", apiKey: "sk-upstream", models: ["m-1"], proxy: true } })
  try {
    const res = await fetch(`${app.base}/v1/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "px/m-1", messages: [], stream: true }),
    })
    assert.equal(res.status, 200)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let acc = ""
    const readUntil = async (needle) => {
      while (!acc.includes(needle)) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
      }
    }
    await readUntil('"He"')
    assert.ok(!acc.includes("llo"), "逐块证据：首帧到达时第二帧尚未发出（整段缓冲实现不可能在此读出）")
    assert.equal(tunnel.connects.length, 1, "恰一次 CONNECT")
    assert.equal(tunnel.requests[0], "POST /v1/chat/completions HTTP/1.1", "隧道内 = 相对 URI 请求行")
    tunnel.socket.write(sseFrame(JSON.stringify({ choices: [{ delta: { content: "llo" } }] })))
    tunnel.socket.write(sseFrame(JSON.stringify({ choices: [], usage: { prompt_tokens: 7, completion_tokens: 5, total_tokens: 12 } })))
    tunnel.socket.write(sseFrame("[DONE]"))
    tunnel.socket.end()
    await readUntil("[DONE]")
    assert.ok(acc.includes('"llo"') && acc.includes("[DONE]"), acc)
    assert.ok(await waitFor(() => lastUsage(db)?.status === "ok"))
    assert.deepEqual([lastUsage(db).prompt_tokens, lastUsage(db).total_tokens], [7, 12], "SSE usage 逐块拾取（tap）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("E3 代理不可达 ⇒ 502 upstream_error + 记账 error（既有 E6 形零回归）", { timeout: 30_000 }, async () => {
  const dead = await startFakeProxy(() => {})
  const deadUri = dead.uri
  await dead.close() // 端口即刻释放（ECONNREFUSED 确定性）
  const db = DB.openDatabase(":memory:")
  const { app, key } = await seedChat({ db, config: configWith({ proxy: { uri: deadUri } }), provider: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-1", models: ["m-1"], proxy: true } })
  try {
    const res = await chatJson(app, { key, body: { model: "px/m-1", messages: [] } })
    assert.equal(res.status, 502, res.text)
    assert.equal(res.json.error.code, "upstream_error")
    assert.ok(await waitFor(() => lastUsage(db)?.status === "error"))
  } finally { await app.close(); db.close() }
})

test("E4 客户端断连 ⇒ 代理 socket 拆除（上游中止）∥ 记账 aborted（§2.1 契约零回归）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  const link = { socket: null, closed: false }
  const proxy = await startFakeProxy((sock) => {
    link.socket = sock
    sock.on("close", () => { link.closed = true })
    sseReplyHead(sock)
    sock.write(sseFrame(JSON.stringify({ choices: [{ delta: { content: "He" } }] }))) // 首帧后挂起
  })
  const { app, key } = await seedChat({ db, config: configWith({ proxy: { uri: proxy.uri } }), provider: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-1", models: ["m-1"], proxy: true } })
  try {
    await new Promise((resolve, reject) => {
      const req = httpRequest({ host: "127.0.0.1", port: app.port, path: "/v1/chat/completions", method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` } }, (res) => {
        res.once("data", () => { resolve(); req.destroy() }) // 首帧到达 ⇒ 客户端断连
      })
      req.on("error", () => {}) // 断连后的 ECONNRESET：忽略
      req.end(JSON.stringify({ model: "px/m-1", messages: [], stream: true }))
      setTimeout(() => reject(new Error("断连腿超时：未收到首帧")), 8000).unref?.()
    })
    assert.ok(await waitFor(() => link.closed === true), "代理 socket 应被拆除（= 上游中止）")
    assert.ok(await waitFor(() => lastUsage(db)?.status === "aborted"), `记账应为 aborted：${JSON.stringify(lastUsage(db))}`)
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("E5 保存热生效：旗 false ⇒ 直连 502 ⇒ PATCH 旗 true ⇒ 下一请求经代理（零重启）", { timeout: 30_000 }, async () => {
  const db = DB.openDatabase(":memory:")
  const proxy = await startFakeProxy((sock) => jsonReply(sock, CHAT_OK))
  const { app, admin, key } = await seedChat({ db, config: configWith({ proxy: { uri: proxy.uri } }), provider: { name: "px", baseURL: "http://provider.invalid/v1", apiKey: "sk-1", models: ["m-1"] } })
  try {
    const direct = await chatJson(app, { key, body: { model: "px/m-1", messages: [] } })
    assert.equal(direct.status, 502, "旗 false ⇒ 直连 ⇒ 外址不解 ⇒ 502")
    assert.equal(proxy.requests.length, 0)
    const patched = await call(app.base, "PATCH", "/api/admin/providers/1", { cookie: admin.cookie, body: { proxy: true } })
    assert.equal(patched.status, 200, patched.text)
    const proxied = await chatJson(app, { key, body: { model: "px/m-1", messages: [] } })
    assert.equal(proxied.status, 200, proxied.text)
    assert.equal(proxy.requests.length, 1, "PATCH 后即经代理（在途快照后生效）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

// ── F 预设行（件① 面——gemini-openai ∥ 21 键）────────────────────────────────

test("F1 gemini-openai 行逐值 ∥ 21 键 ∥ 端点同面（admin）", { timeout: 30_000 }, async () => {
  const keys = Object.keys(PRESETS.SERVER_PRESETS)
  assert.equal(keys.length, 21, `起步 21 家：${keys.length}`)
  const row = PRESETS.SERVER_PRESETS["gemini-openai"]
  assert.equal(row.baseURL, "https://generativelanguage.googleapis.com/v1beta/openai", "OpenAI 兼容侧 baseURL")
  assert.deepEqual(Object.keys(row).sort(), ["baseURL"], "零 format ∥ 零 model 键")
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const app = await startApp({ db, config: configWith() })
  try {
    const admin = await login(app.base, "admin")
    const res = await call(app.base, "GET", "/api/admin/providers/presets", { cookie: admin.cookie })
    assert.equal(res.status, 200)
    const hit = res.json.presets.find((item) => item.preset === "gemini-openai")
    assert.ok(hit, "端点清单缺 gemini-openai")
    assert.deepEqual([hit.name, hit.baseURL, hit.models], ["gemini-openai", row.baseURL, []])
  } finally { await app.close(); db.close() }
})

// ── F2 控制台两窗「走代理」（WEBUI §2.4④ ∥ §6 AC-18 子句——桩 DOM 零浏览器）────

// 桩 DOM（`modal.mjs` 壳面近形——沿 2026-10-09 控制台测试 key 修复批件形）
function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, focused: false, checked: false, textContent: "", className: "", value: "", hidden: false,
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
    append(...items) {
      for (const item of items.flat(Infinity)) {
        if (item === null || item === undefined || item === false) continue
        if (typeof item === "object") item.parent = node
        node.children.push(item)
      }
    },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
    remove() {
      if (node.parent !== null) node.parent.children = node.parent.children.filter((child) => child !== node)
      node.parent = null
    },
    focus() { node.focused = true },
    fire(type, event = {}) {
      const target = { preventDefault() {}, ...event }
      return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target)))
    },
    showModal() { node.open = true },
    close() { node.open = false; for (const fn of node.listeners.close ?? []) fn({}) },
  }
  return node
}
const createDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点。 */
function h(tag, props = {}, ...children) {
  const node = makeNode(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = String(value)
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child)
  }
  return node
}

function findAll(root, pred, out = []) {
  if (root !== null && typeof root === "object") {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) findAll(child, pred, out)
  }
  return out
}
const findNode = (root, pred) => findAll(root, pred)[0] ?? null
const byText = (root, text) => findNode(root, (node) => node.textContent === text)
/** 桩 ctx：api 路由表（`"METHOD path"` ⇒ handler）∥ 全调用入 `calls`（请求体 = 判据面）。 */
function stubCtx(routes = {}) {
  const calls = []
  const ctx = {
    h,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
  }
  return { ctx, calls }
}
/** 探针调用（discover）序列——判据面 = 请求体。 */
const probes = (calls) => calls.filter(([method, path]) => method === "POST" && path === "/api/admin/providers/discover")

const { ZH: F2_ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const MODALS = await load("thincoder-server/public/views-providers-modals.mjs")

test("F2 两窗「走代理」：探针随携勾选态 ∥ 添加窗勾才携 ∥ 详情窗初值 = 行旗 ∥ 保存变更才携", async () => {
  globalThis.document = createDocument()
  try {
    // ① 添加窗（自定义径）：未勾 ⇒ 探针 `proxy: false`（明传）；勾 ⇒ `proxy: true`；保存 = 勾才携
    const add = stubCtx({
      "GET /api/admin/providers/presets": () => ({ presets: [] }),
      "POST /api/admin/providers/discover": () => ({ models: ["m-1"] }),
      "POST /api/admin/providers": () => ({ ok: true, id: 1 }),
    })
    const addModal = MODALS.openAddProviderModal(add.ctx, { providers: [], reload: async () => {} })
    await tick() // 预设表惰性拉取
    const select = findNode(addModal.root, (node) => node.tag === "select")
    select.value = "custom"
    await select.fire("change")
    const textInputs = findAll(addModal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
    textInputs[1].value = "http://provider.invalid/v1"
    const proxyBox = findNode(addModal.root, (node) => node.tag === "input" && node.attrs.type === "checkbox" && node.parent?.className === "key-clear")
    assert.ok(proxyBox !== null, "添加窗缺「走代理」勾")
    await byText(addModal.root, F2_ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual(probes(add.calls).at(-1)[2], { baseURL: "http://provider.invalid/v1", proxy: false }, "未勾 ⇒ 探针携 proxy: false（显式布尔）")
    proxyBox.checked = true
    await byText(addModal.root, F2_ZH["admin.providers.fetchModels"]).fire("click")
    assert.deepEqual(probes(add.calls).at(-1)[2], { baseURL: "http://provider.invalid/v1", proxy: true }, "勾 ⇒ 探针携 proxy: true")
    await byText(addModal.root, F2_ZH["common.save"]).fire("click")
    const posted = add.calls.filter(([method, path]) => method === "POST" && path === "/api/admin/providers").at(-1)[2]
    assert.equal(posted.proxy, true, "添加窗：勾 ⇒ 保存携 proxy: true")

    // ② 添加窗（未勾）：保存省略 `proxy` 键（缺省直连——零非布尔写入）
    const bare = stubCtx({
      "GET /api/admin/providers/presets": () => ({ presets: [] }),
      "POST /api/admin/providers": () => ({ ok: true, id: 2 }),
    })
    const bareModal = MODALS.openAddProviderModal(bare.ctx, { providers: [] })
    await tick()
    const bareSelect = findNode(bareModal.root, (node) => node.tag === "select")
    bareSelect.value = "custom"
    await bareSelect.fire("change")
    const bareInputs = findAll(bareModal.root, (node) => node.tag === "input" && node.attrs.type !== "checkbox")
    bareInputs[0].value = "bare"
    bareInputs[1].value = "http://provider.invalid/v1"
    await byText(bareModal.root, F2_ZH["common.save"]).fire("click")
    const bareBody = bare.calls.filter(([method, path]) => method === "POST" && path === "/api/admin/providers").at(-1)[2]
    assert.equal("proxy" in bareBody, false, "添加窗：未勾 ⇒ 省略 proxy 键")

    // ③ 详情窗：初值 = 行旗（true）⇒ 首开自动拉取携 `proxy: true`；取消勾 ⇒ 探针 `proxy: false`；保存 = 变更才携
    const detail = stubCtx({
      "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }),
      "PATCH /api/admin/providers/7": () => ({ ok: true }),
    })
    const row = { id: 7, name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "…1234", models: ["deepseek-chat"], proxy: true }
    const detailModal = MODALS.openProviderDetailModal(detail.ctx, { provider: row })
    await tick() // 首开自动拉取
    const keyBoxes = findAll(detailModal.root, (node) => node.tag === "input" && node.parent?.className === "key-clear")
    assert.equal(keyBoxes.length, 2, "详情窗勾面 = 清除密钥 ∥ 走代理")
    const detailProxy = keyBoxes[1]
    assert.equal(detailProxy.checked, true, "初值 = 行 proxy: true")
    assert.deepEqual(probes(detail.calls).at(-1)[2], { baseURL: "https://api.deepseek.com", providerId: 7, proxy: true }, "首开自动拉取随携行旗")
    detailProxy.checked = false
    await byText(detailModal.root, F2_ZH["admin.providers.test"]).fire("click")
    assert.deepEqual(probes(detail.calls).at(-1)[2], { baseURL: "https://api.deepseek.com", providerId: 7, proxy: false }, "取消勾 ⇒ 探针携 proxy: false")
    await byText(detailModal.root, F2_ZH["common.save"]).fire("click")
    assert.deepEqual(detail.calls.filter(([method]) => method === "PATCH").at(-1), ["PATCH", "/api/admin/providers/7", { proxy: false }], "保存 = 变更才携（仅 proxy 一字段）")

    // ④ 详情窗（零变更）：勾选态未动 ⇒ 保存直关窗零请求（缺省不动）
    const idle = stubCtx({ "POST /api/admin/providers/discover": () => ({ models: ["deepseek-chat"] }) })
    const idleModal = MODALS.openProviderDetailModal(idle.ctx, { provider: row })
    await tick()
    const idleProxy = findAll(idleModal.root, (node) => node.tag === "input" && node.parent?.className === "key-clear")[1]
    idleProxy.checked = true // 行旗 = true ⇒ 复原态
    await byText(idleModal.root, F2_ZH["common.save"]).fire("click")
    assert.deepEqual([idle.calls.some(([method]) => method === "PATCH"), idleModal.root.open], [false, false], "零变更 ⇒ 零 PATCH + 关窗")
  } finally { delete globalThis.document }
})
