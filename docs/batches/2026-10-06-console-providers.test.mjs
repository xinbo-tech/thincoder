/**
 * 2026-10-06-console-providers.test.mjs — thincoder-server 批内单测件（控制台 provider/模型管理 + IA/导航；
 * 名随批档 · 随批留存）。运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-providers.test.mjs`。
 *
 * 射程（九腿）：
 *   ① 控制台 CRUD 三态（无会话 ⇒ 401 ∥ user ⇒ 403 ∥ admin ⇒ 200——读写路径同判权）
 *   ② 保存即热生效（POST 立见 + 上游完成请求 ∥ PATCH 改 baseURL 命中新址 ∥ DELETE ⇒ 下一请求 404——零重启）
 *   ③ 在途口径（流跨删除——流照常收尾 ∥ ok 记账；后续请求 404）
 *   ④ 密钥（列表掩码 ∥ 日志零明文 ∥ discover 草稿键不落库）
 *   ⑤ 模型发现（成功去重 ∥ 不可达/非 JSON/无 data/超时 ⇒ 502；手填降级不设门）
 *   ⑥ 种子四格（导入保形 ∥ 忽略 + 警告 ∥ 允许起 + 警告 ∥ 正常——`bootstrapProviderRuntime`）
 *   ⑦ 校验单源（非法/重名/env: 缺位 ⇒ 400 且库与运行时零变；不存在 id ⇒ 404）
 *   ⑧ nav.mjs 直测（组/项结构 ∥ 重定向 ∥ 角色默认 ∥ denied）+ 静态十二档（含 favicon 共十三档 ∥ 零外链 ∥ 接线 ∥ 直发）
 *   ⑨ 预设列表（20 家 ∥ 缺省展开 ∥ 响应零 apiKey 字段；预填不豁免校验）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { createServer as createNetServer } from "node:net"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const STATIC = await load("thincoder-server/src/webui/static.mjs")
const NAV = await load("thincoder-server/public/nav.mjs")

const PASSWORD = "password-123"
const ENV = { SEED_KEY: "sk-seed-live" } // 种子 env: 引用解析面（真实密钥值只住环境——OPS §1）

// ── 夹具与助手 ───────────────────────────────────────────────────────────────

/** 校验后配置（providers 种子可给；embedding 缺省指死址——各用例按需覆盖）。 */
function configWith({ baseURL = "http://127.0.0.1:9/v1", providers = [], over = {} } = {}) {
  return CONFIG.validateConfig({
    host: "127.0.0.1",
    providers,
    embedding: { baseURL, model: "bge-m3" },
    ...over,
  })
}

/** mock 上游（端口随机）：读全请求体 → 记录 `{ method, url, headers, body }` → 交 handler（缺省 = chat 回包）。 */
async function startMock(handler = null) {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8")
      let body = null
      try { body = JSON.parse(text) } catch { /* 非 JSON 请求体：以 text 判 */ }
      requests.push({ method: req.method, url: req.url, headers: req.headers, body, text })
      if (handler) { handler(req, res, requests.at(-1)); return }
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ id: "mock-1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "mock-ok" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }))
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** mock 上游：任意路径回 `ids` 清单（发现成功形；故意含重复——去重判据）。 */
function modelsMock(ids) {
  return startMock((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ object: "list", data: ids.map((id) => ({ id })) }))
  })
}

/** 裸 mock：自由回包（判形用例——非 JSON ∥ 无 data ∥ 挂起）。 */
async function startRaw(responder) {
  const server = createHttpServer((req, res) => responder(req, res))
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return { base: `http://127.0.0.1:${server.address().port}`, close: async () => { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) } }
}

/** 进程内网关（五族注册行 + 真 `public/` 静态面——等价装配面接线；`discoverTimeoutMs` = 超时径注入口径）。 */
async function startApp({ db, config, env = ENV, discoverTimeoutMs } = {}) {
  const lines = []
  const push = (level) => (event, fields = {}) => lines.push({ level, event, ...fields })
  const log = { info: push("info"), warn: push("warn"), error: push("error") }
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY.registerGatewayRoutes(routes, { db, config, log, env }) // 装配期引导运行时（种子 → 构建）
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime, log, env, ...(discoverTimeoutMs === undefined ? {} : { discoverTimeoutMs }) })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log, staticSite: STATIC.createStaticSite() })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    lines,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** HTTP 调用（JSON 头缺省——写端点型门满足；`cookie`/`key` 注入）。 */
async function call(base, method, path, { body, cookie, key } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  if (key) headers.authorization = `Bearer ${key}`
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, headers: res.headers, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}
const get = (base, path, opts) => call(base, "GET", path, opts)

async function login(base, username, password = PASSWORD) {
  const res = await call(base, "POST", "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}

async function makeMember(db, { username = "admin", role = "admin", password = PASSWORD } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, role, password })
  return member
}

async function freePort() {
  const probe = createNetServer()
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve))
  const port = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  return port
}

const lastUsage = (db) => db.prepare("SELECT * FROM usage ORDER BY id DESC LIMIT 1").get() ?? null
const countProviders = (db) => db.prepare("SELECT COUNT(*) AS n FROM providers").get().n
const listModels = async (app, key) => (await get(app.base, "/v1/models", { key })).json.data.map((m) => m.id)
async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 25))
  }
  return predicate()
}

// ── ① 三态 ──────────────────────────────────────────────────────────────────
test("① 控制台 CRUD 三态：无会话 ⇒ 401 ∥ user ⇒ 403 ∥ admin ⇒ 200（读写路径同判权）", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  await makeMember(db, { username: "alice", role: "user" })
  const app = await startApp({ db, config: configWith() })
  try {
    const admin = await login(app.base, "admin")
    const alice = await login(app.base, "alice")
    const anon = await get(app.base, "/api/admin/providers")
    assert.equal(anon.status, 401)
    assert.equal(anon.json.error.code, "unauthorized")
    const denied = await get(app.base, "/api/admin/providers", { cookie: alice.cookie })
    assert.equal(denied.status, 403)
    assert.equal(denied.json.error.code, "forbidden")
    const list = await get(app.base, "/api/admin/providers", { cookie: admin.cookie })
    assert.equal(list.status, 200)
    assert.deepEqual(list.json.providers, []) // 零 provider = 允许态（库空清单照回）
    const write = { name: "nope", baseURL: "http://127.0.0.1:9/v1", models: [] }
    assert.equal((await call(app.base, "POST", "/api/admin/providers", { body: write })).status, 401)
    assert.equal((await call(app.base, "POST", "/api/admin/providers", { cookie: alice.cookie, body: write })).status, 403)
    assert.equal((await call(app.base, "DELETE", "/api/admin/providers/1", { body: {} })).status, 401) // 写路径全动词同门（PATCH/DELETE 代表面）
    assert.equal((await call(app.base, "PATCH", "/api/admin/providers/1", { cookie: alice.cookie, body: write })).status, 403)
  } finally { await app.close(); db.close() }
})

// ── ② 保存即热生效 ─────────────────────────────────────────────────────────
test("② 保存即热生效：POST ⇒ 立见 + 上游完成请求 ∥ PATCH 改 baseURL ⇒ 命中新址 ∥ DELETE ⇒ 下一请求 404（零重启）", async () => {
  const seedMock = await startMock()
  const freshMock = await startMock()
  const patchedMock = await startMock()
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db, { username: "admin", role: "admin" })
  const key = KEYS.issueKey(db, member.id)
  const config = configWith({ providers: [{ name: "seed", baseURL: `${seedMock.base}/v1`, apiKey: "env:SEED_KEY", models: ["seed-model"] }] })
  const app = await startApp({ db, config })
  try {
    const admin = await login(app.base, "admin")
    assert.deepEqual(await listModels(app, key.plain), ["seed/seed-model", "bge-m3"]) // 种子导入（格① 同径）
    const created = await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "fresh", baseURL: `${freshMock.base}/v1`, apiKey: "sk-plain-1234", models: ["fresh-model"] } })
    assert.equal(created.status, 200)
    assert.equal(created.json.ok, true)
    assert.ok(Number.isInteger(created.json.id))
    const freshId = created.json.id
    assert.ok((await listModels(app, key.plain)).includes("fresh/fresh-model")) // POST 后立见（零重启）
    const chat1 = await call(app.base, "POST", "/v1/chat/completions", { key: key.plain, body: { model: "fresh/fresh-model", messages: [] } })
    assert.equal(chat1.status, 200)
    assert.equal(freshMock.requests.length, 1) // 经新 provider 完成请求
    assert.equal(patchedMock.requests.length, 0)
    const patched = await call(app.base, "PATCH", `/api/admin/providers/${freshId}`, { cookie: admin.cookie, body: { baseURL: `${patchedMock.base}/v1` } })
    assert.equal(patched.status, 200)
    assert.equal((await call(app.base, "POST", "/v1/chat/completions", { key: key.plain, body: { model: "fresh/fresh-model", messages: [] } })).status, 200)
    assert.equal(patchedMock.requests.length, 1) // 下一请求命中新址
    await waitFor(() => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n >= 2) // 两条 chat 已记账
    const usageBefore = db.prepare("SELECT COUNT(*) AS n FROM usage").get().n
    const deleted = await call(app.base, "DELETE", `/api/admin/providers/${freshId}`, { cookie: admin.cookie })
    assert.equal(deleted.status, 200)
    const miss = await call(app.base, "POST", "/v1/chat/completions", { key: key.plain, body: { model: "fresh/fresh-model", messages: [] } })
    assert.equal(miss.status, 404) // 被删者下一请求 404
    assert.equal(miss.json.error.code, "model_not_found")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, usageBefore) // 404 不落使用行（用量行零触）
    assert.ok(!(await listModels(app, key.plain)).includes("fresh/fresh-model")) // 清单移除
  } finally {
    await app.close()
    await Promise.all([seedMock.close(), freshMock.close(), patchedMock.close()])
    db.close()
  }
})

// ── ③ 在途口径 ──────────────────────────────────────────────────────────────
test("③ 在途口径：流式请求进行中删除其 provider ⇒ 流照常收尾（ok 记账）；后续请求 404", async () => {
  let release = null
  const gate = new Promise((resolve) => { release = resolve })
  const streamMock = await startMock((req, res) => {
    res.writeHead(200, { "content-type": "text/event-stream" })
    res.flushHeaders()
    res.write(`data: ${JSON.stringify({ id: "c1", choices: [{ index: 0, delta: { content: "前半" } }] })}\n\n`)
    gate.then(() => {
      res.write(`data: ${JSON.stringify({ id: "c1", choices: [{ index: 0, delta: { content: "后半" } }] })}\n\n`)
      res.write(`data: ${JSON.stringify({ id: "c1", choices: [], usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 } })}\n\n`)
      res.write("data: [DONE]\n\n")
      res.end()
    })
  })
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db, { username: "admin", role: "admin" })
  const key = KEYS.issueKey(db, member.id)
  const config = configWith({ providers: [{ name: "live", baseURL: `${streamMock.base}/v1`, apiKey: "", models: ["live-model"] }] })
  const app = await startApp({ db, config })
  try {
    const admin = await login(app.base, "admin")
    const shown = await get(app.base, "/api/admin/providers", { cookie: admin.cookie })
    const liveId = shown.json.providers.find((p) => p.name === "live").id
    const response = await fetch(`${app.base}/v1/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "live/live-model", stream: true, messages: [] }),
    })
    assert.equal(response.status, 200)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const first = await reader.read()
    let text = decoder.decode(first.value, { stream: true })
    assert.match(text, /前半/)
    assert.equal((await call(app.base, "DELETE", `/api/admin/providers/${liveId}`, { cookie: admin.cookie })).status, 200) // 在途删除
    release()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }
    assert.match(text, /后半/) // 流照常收尾（换表只影响后续请求——派发时快照）
    assert.match(text, /\[DONE\]/)
    await waitFor(() => lastUsage(db)?.status === "ok")
    const row = lastUsage(db)
    assert.deepEqual([row.status, row.stream, row.model], ["ok", 1, "live/live-model"])
    assert.deepEqual([row.prompt_tokens, row.completion_tokens, row.total_tokens], [2, 2, 4]) // usage 帧照常提取
    assert.equal((await call(app.base, "POST", "/v1/chat/completions", { key: key.plain, body: { model: "live/live-model", messages: [] } })).status, 404)
  } finally {
    await app.close()
    await streamMock.close()
    db.close()
  }
})

// ── ④ 密钥 ──────────────────────────────────────────────────────────────────
test("④ 密钥面：列表掩码（env: 原文 ∥ …+末 4 ∥ 空）∥ 日志零明文 ∥ discover 草稿键不落库", async () => {
  const mock = await modelsMock(["m-1", "m-2"])
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  const config = configWith({ providers: [{ name: "seed", baseURL: `${mock.base}/v1`, apiKey: "env:SEED_KEY", models: ["m-1"] }] })
  const app = await startApp({ db, config })
  try {
    const admin = await login(app.base, "admin")
    await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "plain", baseURL: `${mock.base}/v1`, apiKey: "sk-plain-1234", models: ["m-2"] } })
    await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "nokey", baseURL: `${mock.base}/v1`, models: [] } })
    const list = await get(app.base, "/api/admin/providers", { cookie: admin.cookie })
    const byName = Object.fromEntries(list.json.providers.map((p) => [p.name, p.apiKey]))
    assert.equal(byName.seed, "env:SEED_KEY") // 引用原样回显（引用非秘密）
    assert.equal(byName.plain, "…1234") // 明文 ⇒ 末 4
    assert.equal(byName.nokey, "")
    assert.ok(!list.text.includes("sk-plain-1234")) // 明文不回显
    const found = await call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body: { baseURL: `${mock.base}/v1`, apiKey: "sk-draft-key" } })
    assert.equal(found.status, 200)
    assert.deepEqual(found.json.models, ["m-1", "m-2"])
    assert.ok(!JSON.stringify(db.prepare("SELECT * FROM providers").all()).includes("sk-draft-key")) // 草稿键不落库
    const logText = JSON.stringify(app.lines)
    for (const secret of ["sk-seed-live", "sk-plain-1234", "sk-draft-key"]) assert.ok(!logText.includes(secret), `日志泄漏密钥：${secret}`)
  } finally { await app.close(); await mock.close(); db.close() }
})

// ── ⑤ 发现 ──────────────────────────────────────────────────────────────────
test("⑤ 模型发现：成功去重 ∥ 不可达/非 JSON/无 data/超时 ⇒ 502 ∥ 失败后可手填保存（不设门）", async () => {
  const dupMock = await modelsMock(["dup-1", "dup-2", "dup-1"])
  const noData = await startRaw((req, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ object: "list" })) })
  const badJson = await startRaw((req, res) => { res.writeHead(200, { "content-type": "application/json" }); res.end("not-json{") })
  const hang = await startRaw(() => { /* 永不回包——超时径 */ })
  const deadPort = await freePort()
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  const app = await startApp({ db, config: configWith(), discoverTimeoutMs: 300 }) // 超时注入口径（生产缺省 10s）
  try {
    const admin = await login(app.base, "admin")
    const discover = (body) => call(app.base, "POST", "/api/admin/providers/discover", { cookie: admin.cookie, body })
    const ok = await discover({ baseURL: `${dupMock.base}/v1` })
    assert.equal(ok.status, 200)
    assert.deepEqual(ok.json.models, ["dup-1", "dup-2"]) // 去重
    for (const [label, baseURL] of [["不可达", `http://127.0.0.1:${deadPort}/v1`], ["无 data", `${noData.base}/v1`], ["非 JSON", `${badJson.base}/v1`], ["超时", `${hang.base}/v1`]]) {
      const failed = await discover({ baseURL })
      assert.equal(failed.status, 502, label)
      assert.equal(failed.json.error.code, "upstream_error", label)
    }
    const manual = await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: "manual", baseURL: `${dupMock.base}/v1`, models: ["dup-1"] } })
    assert.equal(manual.status, 200) // 发现非保存前置门——手填降级照常
  } finally {
    await app.close()
    await Promise.all([dupMock.close(), noData.close(), badJson.close(), hang.close()])
    db.close()
  }
})

// ── ⑥ 种子四格 ──────────────────────────────────────────────────────────────
test("⑥ 种子四格：库空+段 ⇒ 导入（env: 保形）∥ 库非空+段 ⇒ 忽略 + 警告 ∥ 库空+段缺 ⇒ 允许起 + 警告 ∥ 库非空+段缺 ⇒ 正常", () => {
  const events = []
  const log = { info: (event, fields = {}) => events.push({ level: "info", event, ...fields }), warn: (event, fields = {}) => events.push({ level: "warn", event, ...fields }), error: () => {} }
  const seed = [{ name: "seed", baseURL: "http://127.0.0.1:9/v1", apiKey: "env:SEED_KEY", models: ["m"] }]
  // 格①：库空 + 段在场 ⇒ 导入（引用保形入库 ∥ 注册表构建期解析）
  const db = DB.openDatabase(":memory:")
  const runtime = PROVIDERS.bootstrapProviderRuntime({ db, config: configWith({ providers: seed }), log, env: ENV })
  assert.equal(db.prepare("SELECT api_key FROM providers WHERE name = 'seed'").get().api_key, "env:SEED_KEY")
  assert.equal(runtime.get().providers()[0].apiKey, "sk-seed-live")
  assert.ok(events.some((e) => e.event === "providers_imported" && e.level === "info"))
  // 格③：库非空 + 段在场 ⇒ 忽略 + 警告（库为准）
  PROVIDERS.bootstrapProviderRuntime({ db, config: configWith({ providers: [{ name: "other", baseURL: "http://127.0.0.1:9/v1", models: [] }] }), log, env: ENV })
  assert.equal(countProviders(db), 1)
  assert.ok(events.some((e) => e.event === "providers_config_ignored" && e.level === "warn"))
  // 格②：库空 + 段缺 ⇒ 允许起 + 警告（零 provider——控制台为配置路径）
  const emptyDb = DB.openDatabase(":memory:")
  PROVIDERS.bootstrapProviderRuntime({ db: emptyDb, config: configWith({ providers: [] }), log, env: ENV })
  assert.equal(countProviders(emptyDb), 0)
  assert.ok(events.some((e) => e.event === "providers_empty" && e.level === "warn"))
  // 格④：库非空 + 段缺 ⇒ 正常（零 providers_* 事件）
  const keptDb = DB.openDatabase(":memory:")
  keptDb.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES ('kept', 'http://127.0.0.1:9/v1', '', '[]', 't', 't')").run()
  const mark = events.length
  PROVIDERS.bootstrapProviderRuntime({ db: keptDb, config: configWith({ providers: [] }), log, env: ENV })
  assert.equal(events.length, mark)
  keptDb.close(); emptyDb.close(); db.close()
})

// ── ⑦ 校验单源 ──────────────────────────────────────────────────────────────
test("⑦ 校验单源：非法 ∥ 重名 ∥ env: 缺位 ⇒ 400 且库与运行时零变；不存在 id ⇒ 404", async () => {
  const mock = await startMock()
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db, { username: "admin", role: "admin" })
  const key = KEYS.issueKey(db, member.id)
  const config = configWith({ providers: [{ name: "seed", baseURL: `${mock.base}/v1`, apiKey: "", models: ["seed-model"] }] })
  const app = await startApp({ db, config })
  try {
    const admin = await login(app.base, "admin")
    const before = await listModels(app, key.plain)
    const post = (body) => call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body })
    for (const [label, body] of [
      ["非法名称", { name: "x/y", baseURL: `${mock.base}/v1`, models: [] }],
      ["重名", { name: "seed", baseURL: `${mock.base}/v1`, models: [] }],
      ["env: 缺位", { name: "envmiss", baseURL: `${mock.base}/v1`, apiKey: "env:NOT_SET_XYZ", models: [] }],
    ]) {
      const failed = await post(body)
      assert.equal(failed.status, 400, label)
      assert.equal(failed.json.error.code, "invalid_request_error", label)
    }
    assert.equal(countProviders(db), 1) // 库零变
    assert.deepEqual(await listModels(app, key.plain), before) // 运行时零变
    assert.equal((await call(app.base, "DELETE", "/api/admin/providers/999", { cookie: admin.cookie })).status, 404)
    assert.equal((await call(app.base, "PATCH", "/api/admin/providers/999", { cookie: admin.cookie, body: { name: "x" } })).status, 404)
  } finally { await app.close(); await mock.close(); db.close() }
})

// ── ⑧ 导航直测 + 静态十二档 ───────────────────────────────────────────────────
test("⑧ nav.mjs 直测（组/项结构 ∥ 重定向 ∥ 角色默认 ∥ denied）+ 静态十五档（含 favicon 共十六档 ∥ 零外链 ∥ 接线 ∥ 直发）", async () => {
  // 组/项结构：我的 3 ∥ 管理 6（二轮后） ∥ admin 组仅 admin；label 单源（文案挂点）
  const [me, adminGroup] = NAV.NAV_GROUPS
  assert.deepEqual(me.items.map((i) => i.path), ["/me/keys", "/me/usage", "/me/account"])
  assert.deepEqual(adminGroup.items.map((i) => i.path), ["/admin/overview", "/admin/members", "/admin/providers", "/admin/usage", "/admin/audit", "/admin/system"])
  assert.equal(adminGroup.adminOnly, true)
  assert.equal(me.adminOnly, undefined)
  for (const group of NAV.NAV_GROUPS) for (const item of group.items) assert.ok(item.labelKey, `缺 labelKey：${item.path}`)
  // 重定向（旧链）：`#/me` ⇒ `#/me/keys` ∥ `#/admin` ⇒ `#/admin/overview`
  assert.deepEqual(NAV.resolveRoute("/me", "user"), { path: "/me/keys", redirect: true })
  assert.deepEqual(NAV.resolveRoute("/admin", "admin"), { path: "/admin/overview", redirect: true })
  // 角色默认（根 ∥ 未知）：admin ⇒ /admin/overview ∥ user ⇒ /me/keys
  assert.deepEqual(NAV.resolveRoute("/", "admin"), { path: "/admin/overview", redirect: true })
  assert.deepEqual(NAV.resolveRoute("/", "user"), { path: "/me/keys", redirect: true })
  assert.deepEqual(NAV.resolveRoute("/nope", "user"), { path: "/me/keys", redirect: true })
  // 正常解析（含尾斜杠归一 ∥ 登录面透传）
  assert.deepEqual(NAV.resolveRoute("/me/usage", "user"), { path: "/me/usage" })
  assert.deepEqual(NAV.resolveRoute("/me/keys/", "user"), { path: "/me/keys" })
  assert.deepEqual(NAV.resolveRoute("/login", "user"), { path: "/login" })
  // admin 面判定（denied——页面级块；判据仍在服务端）
  assert.deepEqual(NAV.resolveRoute("/admin/providers", "user"), { path: "/admin/providers", denied: true })
  assert.deepEqual(NAV.resolveRoute("/admin/members", "admin"), { path: "/admin/members" })

  // 静态十五档（含 favicon 共十六档）+ 零外链 + 模块接线（views.mjs 退役）
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual(names, ["app.mjs", "favicon.png", "i18n-en.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "nav.mjs", "style.css", "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-overview.mjs", "views-providers.mjs", "views-system.mjs", "views-usage.mjs"])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.ok(!/https?:\/\//.test(text), `${name} 含外部链接（内网不达——KD-SV-9）`)
    assert.ok(!/@import/.test(text), `${name} 含 @import（禁外链样式）`)
  }
  const appSource = readFileSync(join(PUBLIC_DIR, "app.mjs"), "utf8")
  for (const dep of ["nav.mjs", "views-auth.mjs", "views-me.mjs", "views-admin.mjs", "views-providers.mjs", "views-system.mjs", "views-usage.mjs", "views-overview.mjs", "views-audit.mjs"]) {
    assert.ok(appSource.includes(`./${dep}`), `app.mjs 未接线：${dep}`)
  }
  assert.ok(!appSource.includes("./views.mjs"), "app.mjs 仍引用已退役档 views.mjs")
  const indexSource = readFileSync(join(PUBLIC_DIR, "index.html"), "utf8")
  assert.ok(indexSource.includes("/app.mjs") && indexSource.includes('id="nav"'), "index.html 壳缺挂载点")

  // 新档静态直发（mime ∥ no-cache ∥ 字节等于磁盘）
  const db = DB.openDatabase(":memory:")
  const serverApp = await startApp({ db, config: configWith() })
  try {
    for (const name of ["nav.mjs", "views-providers.mjs"]) {
      const res = await get(serverApp.base, `/${name}`)
      assert.equal(res.status, 200, name)
      assert.match(res.headers.get("content-type"), /text\/javascript/, name)
      assert.equal(res.headers.get("cache-control"), "no-cache", name)
      assert.equal(res.text, readFileSync(join(PUBLIC_DIR, name), "utf8"), name)
    }
  } finally { await serverApp.close(); db.close() }
})

// ── ⑨ 预设 ──────────────────────────────────────────────────────────────────
test("⑨ 预设列表：20 家 ∥ 缺省展开 ∥ 响应零 apiKey 字段；预填不豁免校验（重名 ⇒ 400）", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  const app = await startApp({ db, config: configWith({ providers: [{ name: "deepseek", baseURL: "http://127.0.0.1:9/v1", apiKey: "", models: ["deepseek-flash"] }] }) })
  try {
    const admin = await login(app.base, "admin")
    assert.equal((await get(app.base, "/api/admin/providers/presets")).status, 401) // 同族判权（只读同门）
    const res = await get(app.base, "/api/admin/providers/presets", { cookie: admin.cookie })
    assert.equal(res.status, 200)
    assert.equal(res.json.presets.length, 20) // 全表（起步 20 家）
    assert.ok(!res.text.includes('"apiKey"')) // 表零密钥
    for (const preset of res.json.presets) {
      assert.ok(preset.preset && preset.name && preset.baseURL && Array.isArray(preset.models) && preset.models.length > 0, JSON.stringify(preset))
    }
    const deepseek = res.json.presets.find((p) => p.preset === "deepseek") // 缺省展开（expandProviderEntry 单源）
    assert.equal(deepseek.name, "deepseek")
    assert.equal(deepseek.baseURL, "https://api.deepseek.com")
    assert.deepEqual(deepseek.models, ["deepseek-flash"])
    // 快速添加通道 = 拉表 ⇒ 预填 ⇒ POST 全字段——预填不豁免校验
    const prefilled = await call(app.base, "POST", "/api/admin/providers", { cookie: admin.cookie, body: { name: deepseek.name, baseURL: deepseek.baseURL, models: deepseek.models } })
    assert.equal(prefilled.status, 400)
    assert.equal(prefilled.json.error.code, "invalid_request_error")
    assert.equal(countProviders(db), 1)
  } finally { await app.close(); db.close() }
})
