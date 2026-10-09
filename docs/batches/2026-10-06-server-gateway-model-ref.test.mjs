/**
 * 2026-10-06-server-gateway-model-ref.test.mjs — thincoder-server 批内单测件（模型标识 fix 轮：`provider/model` 复合键；
 * 名随批档 · 随批留存——本件为本 fix 轮新档，沿「测试档按域分文件 · 新档按阶段落」先例）。
 * 运行（自 `thincoder/` 仓根——本 fix 轮起六件一并）：`node --test docs/batches/2026-10-06-server-gateway.test.mjs` ∥
 * `…-accounts.test.mjs` ∥ `…-metering.test.mjs` ∥ `…-chat.test.mjs` ∥ `…-webui-deploy.test.mjs` ∥ `…-model-ref.test.mjs`（本档）。
 *
 * 射程（gateway/API.md §2/§2.1 ∥ ops/OPS.md §1——模型标识口径）：
 *   ① 同名模型跨两 provider 并存且各自可达（两请求分别命中各自上游 ∥ 上游请求体 model = 首斜杠余段 ∥ 各自真 key）
 *   ② 裸名 ∥ 前缀形未命中 ⇒ 404 `model_not_found`（提示带前缀形；不转发 ∥ 不落行）
 *   ③ `/v1/models` = 带前缀名清单（同名并列）+ 引擎模型 ④ 记账 model = 对外标识（provider/model——同名可分）
 *   ⑤ provider `name` 校验（ops/OPS.md §1 补条）：缺/空 ∥ 含 `/` ∥ providers 间重名 ⇒ 拒启（+ 合法名放行）
 * mock 上游 = 端口随机 `node:http`（沿 -chat 件形）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

function seedMember(db, username = "alice") {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES (?, ?, 'scrypt$fixture', ?)")
    .run(username, username, new Date().toISOString())
  return Number(info.lastInsertRowid)
}

/** mock 上游（端口随机）：读全请求体 → 记录 `{ method, url, headers, body }` → 交 handler。 */
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

/** 进程内网关（OpenAI 面注册行）。 */
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

/** 非流式 chat 请求（JSON 体）。 */
async function chatJson(base, { key = null, body } = {}) {
  const headers = { "content-type": "application/json" }
  if (key) headers.authorization = `Bearer ${key}`
  const res = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers, body: JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, json, text }
}

async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 25))
  }
  return predicate()
}

// ── 同名跨 provider 并存：两请求分别命中各自上游（`provider/model` 正路）────────
test("同名模型跨两 provider 并存且各自可达 ∥ 上游 model = 余段 ∥ 记账 = 对外标识 ∥ 裸名/前缀形未命中 ⇒ 404", async () => {
  const makeMock = (tag) => startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ id: tag, object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: tag } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }))
  })
  const mockA = await makeMock("from-a")
  const mockB = await makeMock("from-b")
  const db = DB.openDatabase(":memory:")
  const config = CONFIG.validateConfig({ // 同名跨 provider ⇒ 校验放行（同 provider 内重名才拒）
    host: "127.0.0.1",
    providers: [
      { name: "up-a", baseURL: `${mockA.base}/v1`, apiKey: "sk-a", models: ["shared-model"] },
      { name: "up-b", baseURL: `${mockB.base}/v1`, apiKey: "sk-b", models: ["shared-model"] },
    ],
    embedding: { baseURL: `${mockA.base}/v1`, model: "bge-m3" },
  })
  const app = await startGateway({ db, config })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    // 裸名 ∥ 前缀形未命中 ⇒ 404（不转发 ∥ 不落行）
    const bare = await chatJson(app.base, { key: key.plain, body: { model: "shared-model", messages: [] } })
    assert.equal(bare.status, 404)
    assert.equal(bare.json.error.code, "model_not_found")
    assert.match(bare.json.error.message, /provider\/model/) // 提示带前缀形
    const prefixedMiss = await chatJson(app.base, { key: key.plain, body: { model: "up-a/nope-model", messages: [] } })
    assert.equal(prefixedMiss.status, 404)
    assert.equal(prefixedMiss.json.error.code, "model_not_found")
    assert.match(prefixedMiss.json.error.message, /up-a\/nope-model/)
    assert.equal(mockA.requests.length + mockB.requests.length, 0)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 0)

    // /v1/models：带前缀名清单（同名并列）+ 引擎模型
    const list = await fetch(`${app.base}/v1/models`, { headers: { authorization: `Bearer ${key.plain}` } })
    assert.deepEqual((await list.json()).data.map((m) => m.id), ["up-a/shared-model", "up-b/shared-model"])

    // 两请求分别命中各自上游（各自真 key；上游请求体 model = 首斜杠余段）
    const a = await chatJson(app.base, { key: key.plain, body: { model: "up-a/shared-model", messages: [] } })
    assert.equal(a.status, 200)
    assert.equal(a.json.choices[0].message.content, "from-a")
    const b = await chatJson(app.base, { key: key.plain, body: { model: "up-b/shared-model", messages: [] } })
    assert.equal(b.status, 200)
    assert.equal(b.json.choices[0].message.content, "from-b")
    assert.equal(mockA.requests.length, 1)
    assert.equal(mockB.requests.length, 1)
    assert.equal(mockA.requests[0].body.model, "shared-model")
    assert.equal(mockB.requests[0].body.model, "shared-model")
    assert.equal(mockA.requests[0].headers.authorization, "Bearer sk-a")
    assert.equal(mockB.requests[0].headers.authorization, "Bearer sk-b")

    // 记账 = 拆列两字段（回拼 = 对外标识；同名可分）
    await waitFor(() => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n === 2)
    assert.deepEqual(db.prepare("SELECT provider, model FROM usage ORDER BY id").all().map((r) => [r.provider, r.model]), [["up-a", "shared-model"], ["up-b", "shared-model"]])
  } finally {
    await app.close()
    await mockA.close()
    await mockB.close()
    db.close()
  }
})

// ── provider `name` 校验（ops/OPS.md §1 补条——对外标识 `provider/model` 前缀形）──────────────

/** 名判据夹具（合法基线——providers 逐例覆盖单点）。 */
function nameCaseConfig(providers) {
  return { host: "127.0.0.1", providers, embedding: { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" } }
}
const providerNamed = (name) => ({ name, baseURL: "https://up.example/v1", apiKey: "", models: ["m1"] })

/** 拒启断言：逐条正则核错误消息（一个 config 只跑一次）。 */
function rejectsName(config, ...patterns) {
  assert.throws(() => CONFIG.validateConfig(config), (err) => {
    for (const p of patterns) assert.match(err.message, p)
    return true
  })
}

test("config：provider 名缺/空 ⇒ 拒启（含位点与缘由——前缀形不可解析）", () => {
  rejectsName(nameCaseConfig([{ baseURL: "https://up.example/v1", apiKey: "", models: ["m1"] }]), /providers\[0\]\.name/, /缺\/空/, /前缀形不可解析/)
  rejectsName(nameCaseConfig([providerNamed("")]), /providers\[0\]\.name/, /缺\/空/)
  rejectsName(nameCaseConfig([providerNamed("   ")]), /providers\[0\]\.name/, /缺\/空/)
})

test("config：provider 名含 `/` ⇒ 拒启（名回显——前缀形不可解析）", () => {
  rejectsName(nameCaseConfig([providerNamed("up/one")]), /up\/one/, /providers\[0\]\.name/, /前缀形不可解析/)
})

test("config：provider 名重名（providers 间）⇒ 拒启（位点 = 第二个 ∥ 缘由 = 派发歧义）", () => {
  rejectsName(nameCaseConfig([providerNamed("up-a"), providerNamed("up-a")]), /provider 名重名：up-a/, /providers\[1\]\.name/, /歧义/)
})

test("config：provider 名正路——合法名（非空 ∥ 无 `/` ∥ 互不重名）放行 ∥ 名原样保留", () => {
  const config = CONFIG.validateConfig(nameCaseConfig([
    providerNamed("up-a"), providerNamed("up-a2"), providerNamed("up.b"),
  ]))
  assert.deepEqual(config.providers.map((p) => p.name), ["up-a", "up-a2", "up.b"])
  assert.deepEqual(config.providers.map((p) => p.models), [["m1"], ["m1"], ["m1"]]) // 跨 provider 模型同名 = 合法
})
