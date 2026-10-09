/**
 * 2026-10-09-server-embedding-decouple.test.mjs — thincoder-server 批内单测件（embed 解耦批 · 台账 #1147 ∥ #1148 ·
 * KD-SV-57 ∥ KD-SV-58；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-server-embedding-decouple.test.mjs`
 *
 * 射程（判据源 = ops/OPS.md §7 AC-6 ∥ §9 B33/B34/E22 ∥ gateway/API.md §2.4/§5 AC-6 ∥ §7 N33/N34/B24/E25 ∥
 * webui/WEBUI.md §2.1/§2.3① ∥ §6 AC-15①/AC-17①/AC-28⑨）：
 *   A 配置载入容缺（B33/E22）：缺段 ∥ 显式 null ⇒ 归一 null + 警告恰一条（服务照起）；在场严格校验保持；
 *     非对象非 null（字符串 ∥ 数组 ∥ 数字 ∥ 布尔）⇒ 拒启（报错明示「对象 ∥ null」两形）
 *   B 嵌入派发（N33/N34/AC-6）：缺段 ⇒ 404 `model_not_found`（消息明示未配置 ∥ 不转发不落行）；引擎在场 ⇒ 现行链路零动
 *     （转发 + 记账 `endpoint='embeddings'`）
 *   C 清单零引擎行（N4/N33/KD-SV-58）：`modelList` 零引擎条目 ∥ `/v1/models` 端点零引擎行（引擎在场亦零）
 *   D 控制台数据面（§2.4）：GET 缺段两值 null ∥ 探活无草稿 400 / 携草稿照常 ∥ 建段往返（B34）∥ 缺段档 PATCH 他键过门 ∥
 *     部分子键 400 ∥ 非对象 / null 400（E22/E25——文件零变）∥ `/api/system` 缺段 `embedding.model = null`
 *   E 界面面（AC-15①/AC-17①/AC-28⑨）：向量卡未配置态（三输入空 ∥ 状态行「未配置」∥ 不自动探活 ∥ 保存 = 创建段）∥
 *     在场自动探活不回归（体不携草稿）∥ 成员面提示条缺段不渲染 ∥ `deriveModels` 去第二参零引擎行 ∥ i18n +2 ∥
 *     `admin.models.embedNote` 退役 ∥ 注释外零 CJK ∥ `t()` 字面量 ⊆ 表键
 *   F import 扫描：改动面零第三方（`node:` 前缀 ∥ 相对路径——红线）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const SERVER_DIR = join(ROOT, "thincoder-server")
const PUBLIC_DIR = join(SERVER_DIR, "public")
const loadPublic = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const EMBEDDING_ADMIN = await load("thincoder-server/src/gateway/embedding-admin.mjs")
const CONFIG_ADMIN = await load("thincoder-server/src/gateway/config-admin.mjs")
const SYSTEM_ROUTES = await load("thincoder-server/src/gateway/system.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

const cleanups = []
const tmpBox = (tag) => { const dir = mkdtempSync(join(tmpdir(), `tc-emb-${tag}-`)); cleanups.push(() => rmSync(dir, { recursive: true, force: true })); return dir }
test.after(() => { for (const fn of cleanups) fn() })

const PASSWORD = "password-123"

// ── A 配置载入容缺（B33/E22）────────────────────────────────────────────────────

test("A1 载入容缺：缺段 ∥ 显式 null ⇒ 归一 null + 警告恰一条（服务照起——B33）", () => {
  const dir = tmpBox("cfg")
  for (const [tag, raw] of [
    ["missing", { host: "127.0.0.1", db: "gateway.db", providers: [] }],
    ["null", { host: "127.0.0.1", db: "gateway.db", providers: [], embedding: null }],
  ]) {
    const file = join(dir, `${tag}.json`)
    writeFileSync(file, JSON.stringify(raw), "utf8")
    const { config, warnings } = CONFIG.loadConfig(file, { env: {} })
    assert.equal(config.embedding, null, `${tag}：缺段/显式 null ⇒ 归一 null（禁用态）`)
    const hits = warnings.filter((line) => line.includes("嵌入引擎未配置"))
    assert.equal(hits.length, 1, `${tag}：警告恰一条（实读 ${JSON.stringify(warnings)}）`)
    assert.match(hits[0], /config\.json 缺 embedding 段/, `${tag}：警告文案`)
    assert.match(hits[0], /\/v1\/embeddings 禁用/, `${tag}：警告明示禁用面`)
  }
})

test("A2 在场严格校验保持（E22）：缺子键 ∥ 非法 url ∥ 非法 apiKey 形 ⇒ 拒启；合法 ⇒ 归一出参", () => {
  const base = { host: "127.0.0.1" }
  assert.throws(() => CONFIG.validateConfig({ ...base, embedding: { model: "m" } }), /embedding\.baseURL/, "缺 baseURL ⇒ 拒启")
  assert.throws(() => CONFIG.validateConfig({ ...base, embedding: { baseURL: "http://x/v1" } }), /embedding\.model/, "缺 model ⇒ 拒启")
  assert.throws(() => CONFIG.validateConfig({ ...base, embedding: { baseURL: "http://x/v1", model: "" } }), /embedding\.model/, "model 空串 ⇒ 拒启")
  assert.throws(() => CONFIG.validateConfig({ ...base, embedding: { baseURL: "ftp://x/v1", model: "m" } }), /http/, "baseURL 非 http(s) ⇒ 拒启")
  assert.throws(() => CONFIG.validateConfig({ ...base, embedding: { baseURL: "http://x/v1", model: "m", apiKey: 5 } }), /embedding\.apiKey/, "apiKey 非字符串 ⇒ 拒启")
  const ok = CONFIG.validateConfig({ ...base, embedding: { baseURL: "http://x/v1", model: "m" } })
  assert.deepEqual(ok.embedding, { baseURL: "http://x/v1", model: "m", apiKey: "" }, "归一出参（apiKey 可空 → 空串）")
  assert.equal(CONFIG.validateConfig({ ...base }).embedding, null, "缺位 ⇒ null（可选段）")
})

test("A3 非对象非 null ⇒ 拒启（fail-closed——报错明示「对象 ∥ null」两形）", () => {
  for (const bad of ["http://x/v1", [], 7, true]) {
    assert.throws(
      () => CONFIG.validateConfig({ host: "127.0.0.1", embedding: bad }),
      /对象 ∥ null/,
      `形 = ${JSON.stringify(bad)} ⇒ 拒启且报错两形`,
    )
  }
})

// ── 夹具与助手（进程内网关 ∥ 管理员应用）────────────────────────────────────────

/** mock 上游（端口随机）：读全请求体 → 记录 → 交 handler。 */
async function startMockUpstream(handler) {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
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

/** 团队 key 夹具（`/v1/*` 面 = 团队 key 门）。 */
function seedApiKey(db) {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES ('tester', 'tester', 'scrypt$fixture', ?)")
    .run(new Date().toISOString())
  return KEYS.issueKey(db, Number(info.lastInsertRowid))
}

/** 进程内网关（OpenAI 面 + 系统面注册行——缺段/在场两形同径）。 */
async function startGateway({ db, config }) {
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  SYSTEM_ROUTES.registerSystemRoutes(routes, { db, embedding: config.embedding })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 控制台应用（配置面 + 向量面 + 系统面 + 账号面；`fetchImpl` 注入探活替身）。 */
async function startAdminApp({ config, configPath = null, fetchImpl = fetch }) {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const routes = SERVER.createRouteTable()
  if (configPath !== null) CONFIG_ADMIN.registerConfigAdminRoutes(routes, { db, configPath })
  EMBEDDING_ADMIN.registerEmbeddingAdminRoutes(routes, { db, config, log: null, fetchImpl })
  SYSTEM_ROUTES.registerSystemRoutes(routes, { db, embedding: config.embedding })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = await call(base, "POST", "/api/login", { body: { username: "admin", password: PASSWORD } })
  const cookie = login.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))?.split(";")[0] ?? null
  assert.ok(cookie, `登录失败：${login.text}`)
  return { db, base, cookie, async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); db.close() } }
}

async function call(base, method, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

const lastUsage = (db) => db.prepare("SELECT * FROM usage ORDER BY id DESC LIMIT 1").get() ?? null
const usageCount = (db) => Number(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n)

// ── B 嵌入派发（N33/N34/AC-6）───────────────────────────────────────────────────

test("B1 缺段起服（N34/AC-6）：载入通过 ∥ `/healthz` 200 ∥ `/v1/embeddings` ⇒ 404 `model_not_found`（消息明示未配置 ∥ 零落行）", async () => {
  const db = DB.openDatabase(":memory:")
  const key = seedApiKey(db)
  const config = CONFIG.validateConfig({ host: "127.0.0.1", providers: [] }) // 缺 embedding 段
  assert.equal(config.embedding, null)
  const app = await startGateway({ db, config })
  try {
    const health = await call(app.base, "GET", "/healthz")
    assert.deepEqual([health.status, health.json.status], [200, "ok"], "服务照常起（探活 200）")
    const denied = await call(app.base, "POST", "/v1/embeddings", { body: { model: "bge-m3", input: "hi" } })
    assert.deepEqual([denied.status, denied.json.error.code], [401, "invalid_api_key"], "团队 key 门零动（无 key ⇒ 401）")
    const res = await call(app.base, "POST", "/v1/embeddings", { body: { model: "bge-m3", input: "hi" }, cookie: undefined })
    assert.equal(res.status, 401)
    const hit = await fetch(`${app.base}/v1/embeddings`, {
      method: "POST",
      headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "bge-m3", input: "hi" }),
    })
    const payload = await hit.json()
    assert.equal(hit.status, 404, "缺段 ⇒ 404")
    assert.equal(payload.error.code, "model_not_found", "零新码（沿既有错误族）")
    assert.match(payload.error.message, /嵌入引擎未配置/, "消息明示未配置")
    assert.equal(usageCount(db), 0, "不转发不落行")
  } finally { await app.close(); db.close() }
})

test("B2 引擎在场零动（N33）：转发照常（透传维度 ∥ 记账 `endpoint='embeddings'`）∥ 引擎模型外 ⇒ 404 零落行", async () => {
  const engine = await startMockUpstream((req, res) => {
    const body = JSON.stringify({ object: "list", data: [{ object: "embedding", index: 0, embedding: [0.1, 0.2, 0.3] }] })
    res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) })
    res.end(body)
  })
  const db = DB.openDatabase(":memory:")
  const key = seedApiKey(db)
  const config = CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [],
    embedding: { baseURL: `${engine.base}/v1`, model: "bge-m3", apiKey: "sk-engine" },
  })
  const app = await startGateway({ db, config })
  try {
    const res = await fetch(`${app.base}/v1/embeddings`, {
      method: "POST",
      headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "bge-m3", input: "hello" }),
    })
    const payload = await res.json()
    assert.deepEqual([res.status, payload.data[0].embedding.length], [200, 3], "响应透传（维度不变）")
    assert.deepEqual([engine.requests[0].url, engine.requests[0].headers.authorization, engine.requests[0].body.model], ["/v1/embeddings", "Bearer sk-engine", "bge-m3"], "引擎命中 ∥ key 代持 ∥ 原样转发")
    assert.deepEqual([lastUsage(db).endpoint, lastUsage(db).provider, lastUsage(db).model, lastUsage(db).status], ["embeddings", "", "bge-m3", "ok"], "记账 `endpoint='embeddings'`（拆列 provider = ''）")
    const miss = await fetch(`${app.base}/v1/embeddings`, {
      method: "POST",
      headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "nope", input: "hi" }),
    })
    const missBody = await miss.json()
    assert.deepEqual([miss.status, missBody.error.code], [404, "model_not_found"])
    assert.equal(usageCount(db), 1, "引擎模型外 ⇒ 不落行")
  } finally { await app.close(); await engine.close(); db.close() }
})

// ── C 清单零引擎行（N4/N33/KD-SV-58）────────────────────────────────────────────

test("C1 `modelList` 零引擎条目（引擎在场亦零——KD-SV-58）∥ 引擎签名保留（派发面消费）", () => {
  const registry = PROVIDERS.createProviderRegistry(
    [{ name: "p", baseURL: "http://x/v1", apiKey: "", models: ["m1", "m2"] }],
    { env: {}, engineModel: "bge-m3" },
  )
  const list = PROVIDERS.modelList(registry)
  assert.deepEqual(list.data.map((item) => item.id), ["p/m1", "p/m2"], "清单 = 仅 chat 前缀名")
  assert.equal(list.data.some((item) => item.owned_by === "embedding"), false, "零引擎行")
  assert.equal(registry.engineModel(), "bge-m3", "引擎签名保留（`/v1/embeddings` 派发面仍用）")
})

test("C2 `/v1/models` 端点零引擎行（引擎在场——N4 同拍）", async () => {
  const db = DB.openDatabase(":memory:")
  const key = seedApiKey(db)
  const config = CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "p", baseURL: "http://127.0.0.1:9/v1", apiKey: "", models: ["m1"] }],
    embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" },
  })
  const app = await startGateway({ db, config })
  try {
    const res = await fetch(`${app.base}/v1/models`, { headers: { authorization: `Bearer ${key.plain}` } })
    const payload = await res.json()
    assert.deepEqual([res.status, payload.data.map((item) => item.id)], [200, ["p/m1"]], "清单零引擎行（chat 前缀名清单）")
  } finally { await app.close(); db.close() }
})

// ── D 控制台数据面（§2.4——N34/B24/B34/E22/E25）─────────────────────────────────

test("D1 向量面读数：GET 缺段两值 null（N34）∥ 在场真值零密钥 ∥ `/api/system` 缺段 `embedding.model = null`", async () => {
  const missing = await startAdminApp({ config: CONFIG.validateConfig({ host: "127.0.0.1" }) })
  try {
    const emb = await call(missing.base, "GET", "/api/admin/embedding", { cookie: missing.cookie })
    assert.deepEqual([emb.status, emb.json], [200, { baseURL: null, model: null }], "缺段 ⇒ 两值 null")
    const sys = await call(missing.base, "GET", "/api/system", { cookie: missing.cookie })
    assert.deepEqual(sys.json.embedding, { model: null }, "`/api/system.embedding.model = null`（未配置态）")
  } finally { await missing.close() }
  const present = await startAdminApp({
    config: CONFIG.validateConfig({ host: "127.0.0.1", embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3", apiKey: "sk-secret" } }),
  })
  try {
    const emb = await call(present.base, "GET", "/api/admin/embedding", { cookie: present.cookie })
    assert.deepEqual([emb.status, emb.json], [200, { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" }], "在场 ⇒ 真值（`apiKey` 不出响应）")
    const sys = await call(present.base, "GET", "/api/system", { cookie: present.cookie })
    assert.deepEqual(sys.json.embedding, { model: "bge-m3" })
  } finally { await present.close() }
})

test("D2 探活/试跑缺配（B24）：无草稿 ⇒ 400 `invalid_request_error`（明示未配置）∥ 携草稿 ⇒ 照常探活", async () => {
  const calls = []
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts })
    return new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }] }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const app = await startAdminApp({ config: CONFIG.validateConfig({ host: "127.0.0.1" }), fetchImpl })
  try {
    const none = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: app.cookie, body: {} })
    assert.equal(none.status, 400, "缺配 ∧ 无草稿 ⇒ 400")
    assert.equal(none.json.error.code, "invalid_request_error", "零新码")
    assert.match(none.json.error.message, /未配置/, "消息明示未配置")
    assert.equal(calls.length, 0, "不发起探活（无值可探）")
    const partial = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: app.cookie, body: { baseURL: "http://127.0.0.1:9/v1" } })
    assert.equal(partial.status, 400, "部分草稿（缺 model）⇒ 400")
    const draft = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: app.cookie, body: { baseURL: "http://127.0.0.1:9/v1", model: "bge-draft", apiKey: "sk-x" } })
    assert.deepEqual([draft.status, draft.json.ok, draft.json.dimensions], [200, true, 3], "携草稿 ⇒ 照常探活（未保存亦可先验）")
    assert.equal(calls.at(-1).url, "http://127.0.0.1:9/v1/embeddings", "草稿地址命中")
    assert.equal(calls.at(-1).opts.headers.authorization, "Bearer sk-x", "草稿 key 携发")
  } finally { await app.close() }
  // 在场 + 部分草稿 ⇒ 按字段独立回落（草稿地址 + 运行 model——§2.4 标量三项各自明传优先）
  const runtime = await startAdminApp({
    config: CONFIG.validateConfig({ host: "127.0.0.1", embedding: { baseURL: "http://127.0.0.1:8/v1", model: "bge-runtime" } }),
    fetchImpl,
  })
  try {
    const mixed = await call(runtime.base, "POST", "/api/admin/embedding/test", { cookie: runtime.cookie, body: { baseURL: "http://127.0.0.1:9/v1" } })
    assert.deepEqual([mixed.status, mixed.json.ok], [200, true], "混填（只给 baseURL）⇒ 照常探活")
    assert.equal(calls.at(-1).url, "http://127.0.0.1:9/v1/embeddings", "baseURL 取草稿")
    assert.equal(calls.at(-1).opts.body, JSON.stringify({ model: "bge-runtime", input: "ping" }), "model 回落运行配置 ∥ 缺省探针文本")
  } finally { await runtime.close() }
})

test("D3 建段往返（B34/N34/E22/E25）：缺段档 GET ⇒ null ∥ PATCH 建段 ⇒ 200 + 落盘（未知键保形）∥ 重启载入启用 ∥ 他键过门 ∥ 部分子键/非对象/null ⇒ 400（文件零变）", async () => {
  const dir = tmpBox("patch")
  const file = join(dir, "config.json")
  writeFileSync(file, JSON.stringify({ host: "127.0.0.1", db: "gateway.db", custom: { keep: true } }), "utf8")
  const app = await startAdminApp({ config: CONFIG.validateConfig({ host: "127.0.0.1" }), configPath: file })
  try {
    const before = await call(app.base, "GET", "/api/admin/config", { cookie: app.cookie })
    assert.equal(before.json.config.embedding, null, "缺段档 GET ⇒ `embedding: null`")
    const bytes0 = readFileSync(file, "utf8")
    const partial = await call(app.base, "PATCH", "/api/admin/config", { cookie: app.cookie, body: { embedding: { baseURL: "http://127.0.0.1:9/v1" } } })
    assert.equal(partial.status, 400, "部分子键（缺 model——在场须完整）⇒ 400")
    assert.equal(readFileSync(file, "utf8"), bytes0, "文件零变")
    const trust = await call(app.base, "PATCH", "/api/admin/config", { cookie: app.cookie, body: { trustProxy: true } })
    assert.deepEqual([trust.status, trust.json.ok], [200, true], "缺段档 PATCH 他键 ⇒ 过门（校验门容缺段）")
    assert.equal("embedding" in JSON.parse(readFileSync(file, "utf8")), false, "段保持缺位")
    const created = await call(app.base, "PATCH", "/api/admin/config", { cookie: app.cookie, body: { embedding: { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" } } })
    assert.deepEqual([created.status, created.json.ok], [200, true], "缺段档保存向量卡 ⇒ 建段（从无到有——同一 PATCH）")
    const raw = JSON.parse(readFileSync(file, "utf8"))
    assert.deepEqual(raw.embedding, { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" }, "原子写落盘（建段）")
    assert.deepEqual(raw.custom, { keep: true }, "未知键保形")
    const reloaded = CONFIG.loadConfig(file, { env: {} })
    assert.equal(reloaded.config.embedding.model, "bge-m3", "重启载入 ⇒ 嵌入面启用")
    const bytes1 = readFileSync(file, "utf8")
    for (const [tag, body, pattern] of [
      ["非对象", { embedding: "http://x/v1" }, /embedding 须为对象/],
      ["null（清空段 = 不做）", { embedding: null }, /embedding 须为对象/],
    ]) {
      const res = await call(app.base, "PATCH", "/api/admin/config", { cookie: app.cookie, body })
      assert.equal(res.status, 400, `${tag} ⇒ 400`)
      assert.match(res.json.error.message, pattern, `${tag}：原报文`)
      assert.equal(readFileSync(file, "utf8"), bytes1, `${tag}：文件零变`)
    }
  } finally { await app.close() }
})

// ── E 界面面（AC-15①/AC-17①/AC-28⑨）────────────────────────────────────────────

const [{ ZH }, { EN }, SYSTEM_VIEW, MODELS_VIEW, ME_VIEW] = await Promise.all([
  loadPublic("i18n-zh.mjs"), loadPublic("i18n-en.mjs"), loadPublic("views-system.mjs"),
  loadPublic("views-models.mjs"), loadPublic("views-me.mjs"),
])
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/

/** 剥注释（字符串态感知——沿 i18n 批件口径；「注释外零 CJK」判据取此）。 */
function stripComments(src) {
  let out = ""
  let mode = "code"
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    const next = src[i + 1]
    if (mode === "code") {
      if (ch === "/" && next === "/") { mode = "line"; i += 1; continue }
      if (ch === "/" && next === "*") { mode = "block"; i += 1; continue }
      if (ch === '"') mode = "dq"
      else if (ch === "'") mode = "sq"
      else if (ch === "`") mode = "tq"
      out += ch
    } else if (mode === "line") { if (ch === "\n") { mode = "code"; out += ch } } else if (mode === "block") { if (ch === "*" && next === "/") { mode = "code"; i += 1 } } else {
      out += ch
      if (ch === "\\") { out += next ?? ""; i += 1 }
      else if ((mode === "dq" && ch === '"') || (mode === "sq" && ch === "'") || (mode === "tq" && ch === "`")) mode = "code"
    }
  }
  return out
}

/** 桩节点 ∥ `h` ∥ 查树（`dom.mjs` 语义近似：受控属性 ∥ on 前缀事件 ∥ textContent 直落）。 */
function fNode(tag) {
  const node = {
    tag, children: [], listeners: {}, attrs: {}, textContent: "", className: "", value: "", placeholder: "",
    checked: false, disabled: false, hidden: false, focused: false,
    append(...items) { for (const item of items.flat(Infinity)) { if (item === null || item === undefined || item === false) continue; node.children.push(item) } },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
    focus() { node.focused = true },
    fire(type, event = {}) { const target = { preventDefault() {}, ...event }; return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target))) },
  }
  return node
}

function fH(tag, props = {}, ...children) {
  const node = fNode(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = String(value)
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) { if (child === null || child === undefined || child === false) continue; node.append(child) }
  return node
}

const fFindAll = (root, pred, out = []) => { if (root !== null && typeof root === "object") { if (pred(root)) out.push(root); for (const child of root.children ?? []) fFindAll(child, pred, out) } return out }
const fFind = (root, pred) => fFindAll(root, pred)[0] ?? null
const fTick = () => new Promise((resolve) => setTimeout(resolve, 0))
const fTable = (headers, rows) => fH("div", { class: "table-wrap" }, ...rows.map((cells) => fH("tr", {}, ...cells.map((cell) => {
  const td = fNode("td")
  if (typeof cell === "string") td.textContent = cell
  else td.append(cell)
  return td
}))))
const stubDocument = () => ({ createElement: (tag) => fNode(tag), getElementById: () => null })
const fProbes = (calls) => calls.filter(([method, path]) => method === "POST" && path === "/api/admin/embedding/test")
const fPatches = (calls) => calls.filter(([method, path]) => method === "PATCH" && path === "/api/admin/config")

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入 `calls`）。 */
function fCtx(routes = {}) {
  const calls = []
  const ctx = {
    h: fH,
    state: { system: { version: "1.2.3", update: { mode: "notify", lastCheckAt: null, latest: null }, embedding: { model: "bge-m3" } } },
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    table: fTable,
    fmtTs: (ts) => `ts:${ts}`,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    flash: (message) => calls.push(["flash", message]),
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    health: () => ({ label: ZH["health.ok"], body: { db: "ok", uptime: 12 }, checkedAt: 1000 }),
    onHealth: () => {},
    dataShell: (mount, { head, area }) => { mount.append(head); mount.append(area) },
  }
  return { ctx, calls }
}

test("E1 i18n：+2 键两表在位（占位对位）∥ `admin.models.embedNote` 退役（两表 ∥ 源面零残留）", () => {
  for (const key of ["vector.unconfigured", "vector.unconfiguredHint"]) {
    assert.ok(key in ZH, `zh 表缺新键：${key}`)
    assert.ok(key in EN, `en 表缺新键：${key}`)
    assert.ok(String(ZH[key]).trim() !== "" && String(EN[key]).trim() !== "", `空值键：${key}`)
    const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.equal("admin.models.embedNote" in ZH || "admin.models.embedNote" in EN, false, "嵌入行注键两表退役")
  for (const key of ["vector.unconfigured", "vector.unconfiguredHint"]) assert.equal(CJK.test(EN[key]), false, `en 新键含 CJK：${key}`)
  for (const name of ["views-models.mjs", "views-admin.mjs"]) {
    assert.equal(readFileSync(join(PUBLIC_DIR, name), "utf8").includes("embedNote"), false, `${name} 零消费者残留`)
  }
})

test("E2 向量卡未配置态（AC-15①/AC-28⑨）：三输入空 ∥ 状态行「未配置」∥ 不自动探活 ∥ 提示句在册 ∥ 填写后探活/保存照常（保存 = 创建段）", async () => {
  globalThis.document = stubDocument()
  globalThis.location = { origin: "http://127.0.0.1:8791" }
  try {
    const routes = {
      "GET /api/admin/config": () => ({ config: { host: "127.0.0.1", port: 8787, db: "data/gateway.db", autoUpdate: "notify", trustProxy: false, usageRetentionDays: 90, proxyUri: null, embedding: null, bootstrap: null } }),
      "PATCH /api/admin/config": () => ({ ok: true }),
      "POST /api/admin/embedding/test": () => ({ ok: true, dimensions: 3, ms: 5 }),
    }
    const { ctx, calls } = fCtx(routes)
    const mount = fNode("section")
    SYSTEM_VIEW.renderSystem(ctx, mount)
    await fTick()
    const card = fFindAll(mount, (n) => n.tag === "section" && n.className === "card")
      .find((c) => c.children.some((child) => child && child.tag === "h3" && child.textContent === ZH["vector.title"]))
    assert.ok(card, "向量卡在册")
    const form = fFind(card, (n) => n.tag === "form" && n.className === "provider-form")
    const [baseURLInput, modelInput, apiKeyInput] = fFindAll(form, (n) => n.tag === "input" && n.attrs.type === undefined)
    assert.deepEqual([baseURLInput.value, modelInput.value, apiKeyInput.value], ["", "", ""], "三输入空")
    const status = fFind(card, (n) => n.textContent === ZH["vector.unconfigured"])
    assert.ok(status !== null, "状态行 = 「未配置」")
    assert.equal(fProbes(calls).length, 0, "缺段 ⇒ 不自动探活（无值可探）")
    const hint = fFind(card, (n) => n.textContent === ZH["vector.unconfiguredHint"])
    assert.ok(hint !== null && hint.hidden === false, "提示句在册（可见）")
    baseURLInput.value = "http://127.0.0.1:9/v1"
    modelInput.value = "bge-m3"
    const recheck = fFind(card, (n) => n.tag === "button" && n.textContent === ZH["vector.recheck"])
    await recheck.fire("click")
    assert.deepEqual(fProbes(calls).at(-1)[2], { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" }, "填写后「重新检测」按草稿照常")
    await form.fire("submit")
    assert.deepEqual(fPatches(calls).at(-1)[2], { embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" } }, "保存 = 创建段（同一 PATCH——缺段合并建段）")
  } finally { delete globalThis.document; delete globalThis.location }
})

test("E3 在场自动探活不回归：恰一次 ∥ 体不携草稿（运行配置回落）∥ 未配置态不出现", async () => {
  globalThis.document = stubDocument()
  globalThis.location = { origin: "http://127.0.0.1:8791" }
  try {
    const routes = {
      "GET /api/admin/config": () => ({ config: { host: "127.0.0.1", port: 8787, db: "data/gateway.db", autoUpdate: "notify", trustProxy: false, usageRetentionDays: 90, proxyUri: null, embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3", apiKey: "…cret" }, bootstrap: null } }),
      "PATCH /api/admin/config": () => ({ ok: true }),
      "POST /api/admin/embedding/test": () => ({ ok: true, dimensions: 3, ms: 5 }),
    }
    const { ctx, calls } = fCtx(routes)
    const mount = fNode("section")
    SYSTEM_VIEW.renderSystem(ctx, mount)
    await fTick()
    assert.equal(fProbes(calls).length, 1, "渲染自动探活恰一次")
    assert.deepEqual(fProbes(calls)[0][2], {}, "体不携草稿（未编辑 ⇒ 运行配置回落）")
    assert.equal(fFindAll(mount, (n) => n.textContent === ZH["vector.unconfigured"]).length, 0, "在场 ⇒ 不呈「未配置」态")
  } finally { delete globalThis.document; delete globalThis.location }
})

test("E4 派生零引擎行（KD-SV-58）：`deriveModels(providers)` 去第二参 ∥ 清单全 chat（引擎模型名传入亦不产行）", () => {
  const rows = MODELS_VIEW.deriveModels([{ name: "p", models: ["m1", "org/m2"] }], "bge-m3") // 第二参传入亦不产行（签名已去）
  assert.deepEqual(rows, [
    { id: "p/m1", provider: "p", upstream: "m1", surface: "chat" },
    { id: "p/org/m2", provider: "p", upstream: "org/m2", surface: "chat" },
  ], "行集 = 仅 chat（id 升序）")
  assert.equal(MODELS_VIEW.deriveModels.length, 1, "签名去第二参")
  assert.deepEqual(MODELS_VIEW.deriveModels([]), [], "空清单零行")
})

const ME_MEMBER = { id: 1, name: "Alice", username: "alice", role: "user", modelQuotas: {}, modelUsage: {}, usedTokens: 0, keys: [] }
const ME_SUMMARY = { totals: { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 }, trend: [], trendByEndpoint: [], trendByModel: [], byModel: [] }

test("E5 成员面提示条（AC-15①）：缺段（`embedding.model = null`）⇒ 整条不渲染 ∥ 在场 ⇒ 渲染（模型名 + snippet）", async () => {
  globalThis.location = { origin: "http://console.test" }
  try {
    const render = async (model) => {
      const { ctx } = fCtx()
      ctx.state = { member: ME_MEMBER, system: { embedding: { model } } }
      ctx.usageTable = (rows) => fH("p", { class: "hint", text: String(rows.length) })
      ctx.fmtModelQuotas = () => ZH["common.quotaByPlatform"]
      ctx.api = async (path) => (String(path).startsWith("/api/me/usage/summary?") ? ME_SUMMARY : { rows: [] })
      const mount = fNode("section")
      await ME_VIEW.renderMeUsage(ctx, mount)
      return fFindAll(mount, () => true).map((node) => node.textContent ?? "").join(" ")
    }
    assert.equal((await render(null)).includes(ZH["vector.meTitle"]), false, "缺段 ⇒ 提示条整条不渲染（成员面不呈「未配置」态）")
    const shown = await render("bge-m3")
    assert.ok(shown.includes(ZH["vector.meTitle"]), "在场 ⇒ 渲染")
  } finally { delete globalThis.location }
})

test("E6 改动面文件面：注释外零 CJK ∥ `t()` 字面量 ⊆ 表键", () => {
  for (const name of ["views-models.mjs", "views-system.mjs", "views-me.mjs"]) {
    const stripped = stripComments(readFileSync(join(PUBLIC_DIR, name), "utf8"))
    assert.equal(stripped.match(CJK), null, `${name} 注释外含 CJK——文案应入 zh 族`)
    for (const match of stripped.matchAll(/\bt\(\s*"([^"]+)"/g)) {
      assert.ok(match[1] in ZH, `${name} 悬空键：${match[1]}`)
      assert.ok(match[1] in EN, `${name} 仅 zh 键：${match[1]}`)
    }
  }
})

// ── F import 扫描（零第三方——红线）────────────────────────────────────────────

test("F1 改动面零第三方 import（`node:` 前缀 ∥ 相对路径）", () => {
  const files = [
    join(SERVER_DIR, "src/ops/config.mjs"), join(SERVER_DIR, "src/gateway/routes.mjs"),
    join(SERVER_DIR, "src/gateway/embedding-admin.mjs"), join(SERVER_DIR, "src/gateway/providers.mjs"),
    ...["views-models.mjs", "views-system.mjs", "views-me.mjs", "views-admin.mjs", "i18n-zh-system.mjs", "i18n-en-system.mjs", "i18n-zh-admin.mjs", "i18n-en-admin.mjs"].map((name) => join(PUBLIC_DIR, name)),
  ]
  const importRe = /(?:import\s+[^"'()]*?from\s*|import\s*\(\s*|export\s+[^"'()]*?from\s*)["']([^"']+)["']/g
  const violations = []
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(importRe)) {
      const spec = match[1]
      if (!spec.startsWith("node:") && !spec.startsWith(".")) violations.push(`${file}: ${spec}`)
    }
  }
  assert.deepEqual(violations, [], "第三方 import 零（零第三方运行期依赖 = 红线）")
  assert.equal(readdirSync(PUBLIC_DIR).includes("views-models.mjs"), true, "静态面档在册（占位锚——防扫描面失效）")
})
