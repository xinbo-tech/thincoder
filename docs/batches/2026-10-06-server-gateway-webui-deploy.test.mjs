/**
 * 2026-10-06-server-gateway-webui-deploy.test.mjs — thincoder-server 批内单测件（D4 段：控制台静态面 + embeddings + 部署面；
 * 名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根——本 fix 轮起六件一并）：`node --test docs/batches/2026-10-06-server-gateway.test.mjs` ∥ `…-accounts.test.mjs` ∥
 * `…-metering.test.mjs` ∥ `…-chat.test.mjs` ∥ `…-webui-deploy.test.mjs`（本档） ∥ `…-model-ref.test.mjs`。
 *
 * 射程：
 *   ① N3：embeddings 内网引擎转发（引擎命中 ∥ 原样转发无注入 ∥ 响应字节级透传——维度/条数不变 ∥ 记账 `endpoint='embeddings'`）
 *   ② embeddings 门：无 key ⇒ 401 ∥ 引擎模型外（含 chat 前缀名——两命名空间）⇒ 404（不转发不落行）∥ 引擎 key 代持（配置在场 ⇒ Bearer）
 *   ③ 静态面单件：mime 表 ∥ `/` ⇒ index.html ∥ 防路径穿越（编码形 ∥ 反斜杠 ∥ 非法百分号）
 *   ④ 静态面集成：`/` ∥ `/app.mjs` ∥ `/style.css` 直发（mime ∥ no-cache ∥ 字节等于磁盘）∥ 未知 ⇒ 404 JSON ∥ 注册路由优先
 *   ⑤ 部署资产：五件在册 ∥ Dockerfile/unit/compose 结构要点 ∥ package.json `files` 白名单（AC-8 静态面）
 *   ⑥ 前端自洽：`public/**` 零外部引用（无 http(s):// ∥ 无 @import）∥ 十二档在册（含 favicon 共十三档——零框架 ∥ 零构建）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { createServer as createHttpServer, request as httpRequest } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const SERVER_DIR = join(ROOT, "thincoder-server")
const PUBLIC_DIR = join(SERVER_DIR, "public")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const STATIC = await load("thincoder-server/src/webui/static.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

// ── 夹具与助手 ───────────────────────────────────────────────────────────────
/** 校验后配置（provider ∥ embedding 同指 mock 上游；`engineKey` 覆盖 embedding.apiKey）。 */
function configWith(baseURL, { engineKey = "" } = {}) {
  return CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "mock", baseURL, apiKey: "sk-upstream", models: ["mock-chat"] }],
    embedding: { baseURL, model: "bge-m3", apiKey: engineKey },
  })
}

function seedMember(db, { username = "alice", modelQuotas = {} } = {}) {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, model_quotas_json, created_at) VALUES (?, ?, 'scrypt$fixture', ?, ?)")
    .run(username, username, JSON.stringify(modelQuotas), new Date().toISOString())
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

/** 进程内网关（四域注册行 + 真 `public/` 静态面——等价装配面接线）。 */
async function startApp({ db, config }) {
  const lines = []
  const push = (level) => (event, fields) => lines.push({ level, event, ...fields })
  const log = { info: push("info"), warn: push("warn"), error: push("error") }
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log, staticSite: STATIC.createStaticSite() })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    get port() { return server.address().port },
    lines,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

async function fetchText(url, init) {
  const res = await fetch(url, init)
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, headers: res.headers, text, json }
}

/** 裸 GET（自控 path——fetch 会规范化 `..` 段，穿越用例须此形）。 */
function rawGet({ port, path, timeoutMs = 10000 }) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: "127.0.0.1", port, path, method: "GET" }, (res) => {
      let text = ""
      res.setEncoding("utf8")
      res.on("data", (d) => { text += d })
      res.on("end", () => { resolve({ status: res.statusCode, text }); req.destroy() })
    })
    req.on("error", reject)
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`rawGet 超时（${timeoutMs}ms）`)))
    req.end()
  })
}

const lastUsage = (db) => db.prepare("SELECT * FROM usage ORDER BY id DESC LIMIT 1").get() ?? null
async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 25))
  }
  return predicate()
}

// ── N3：embeddings 引擎转发 ∥ 透传 ∥ 记账 ────────────────────────────────────
test("N3：embeddings —— 引擎命中 ∥ 原样转发（无注入）∥ 响应字节级透传（维度/条数不变）∥ 记账 endpoint='embeddings'", async () => {
  const vectors = {
    object: "list",
    data: [
      { object: "embedding", index: 0, embedding: [0.1, 0.2, 0.3] },
      { object: "embedding", index: 1, embedding: [0.4, 0.5, 0.6] },
    ],
    model: "bge-m3",
    usage: { prompt_tokens: 9, total_tokens: 9 },
  }
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(vectors))
  })
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db, config: configWith(`${mock.base}/v1`) })
  const memberId = seedMember(db)
  const key = KEYS.issueKey(db, memberId)
  try {
    const body = { model: "bge-m3", input: ["甲", "乙"] }
    const res = await fetchText(`${app.base}/v1/embeddings`, {
      method: "POST",
      headers: { authorization: `Bearer ${key.plain}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    assert.equal(res.status, 200)
    assert.equal(res.text, JSON.stringify(vectors)) // 响应透传（字节级——AC-6）
    assert.equal(res.json.data.length, 2) // 条数不变
    assert.equal(res.json.data[0].embedding.length, 3) // 维度不变
    assert.equal(mock.requests.length, 1)
    assert.equal(mock.requests[0].method, "POST")
    assert.equal(mock.requests[0].url, "/v1/embeddings") // 引擎命中（baseURL 尾 /v1 + /embeddings）
    assert.deepEqual(mock.requests[0].body, body) // 原样转发（无 stream_options 注入——注入只属 chat 流式）
    assert.equal(mock.requests[0].headers.authorization, undefined) // 引擎 apiKey 空 ⇒ 不发 Authorization（OPS §1）
    await waitFor(() => lastUsage(db) !== null)
    const row = lastUsage(db)
    assert.equal(row.endpoint, "embeddings")
    assert.equal(row.status, "ok")
    assert.equal(row.model, "bge-m3")
    assert.equal(row.stream, 0)
    assert.deepEqual([row.member_id, row.key_id], [memberId, key.id])
    assert.deepEqual([row.prompt_tokens, row.completion_tokens, row.total_tokens], [9, null, 9]) // usage 原值（引擎未回 completion ⇒ NULL）
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── embeddings 门：三态 ∥ 模型未命中 ∥ 引擎 key 代持 ─────────────────────────
test("embeddings 门：无 key ⇒ 401 ∥ 模型非引擎模型 ⇒ 404（不转发不落行）∥ 引擎 key 在场 ⇒ Bearer 代持", async () => {
  const mock = await startMockUpstream((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ object: "list", data: [], model: "bge-m3" }))
  })
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db, config: configWith(`${mock.base}/v1`, { engineKey: "sk-engine" }) })
  const key = KEYS.issueKey(db, seedMember(db))
  try {
    const post = (headers, body) => fetchText(`${app.base}/v1/embeddings`, {
      method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
    })
    const denied = await post({}, { model: "bge-m3", input: "x" }) // 无 key
    assert.equal(denied.status, 401)
    assert.equal(denied.json.error.code, "invalid_api_key")
    const miss = await post({ authorization: `Bearer ${key.plain}` }, { model: "nope-model", input: "x" }) // 引擎模型外
    assert.equal(miss.status, 404)
    assert.equal(miss.json.error.code, "model_not_found")
    assert.match(miss.json.error.message, /nope-model/)
    const chatRef = await post({ authorization: `Bearer ${key.plain}` }, { model: "mock/mock-chat", input: "x" }) // chat 前缀名不占引擎面（两命名空间）
    assert.equal(chatRef.status, 404)
    assert.equal(chatRef.json.error.code, "model_not_found")
    assert.equal(mock.requests.length, 0) // 拒打不转发
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 0) // 不落行
    const ok = await post({ authorization: `Bearer ${key.plain}` }, { model: "bge-m3", input: "x" })
    assert.equal(ok.status, 200)
    assert.equal(mock.requests.length, 1)
    assert.equal(mock.requests[0].headers.authorization, "Bearer sk-engine") // 引擎真 key 代持（非团队 key）
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── 静态面单件：mime ∥ 路径解析 ∥ 防穿越 ─────────────────────────────────────
test("static 单件：mime 表 ∥ `/` ⇒ index.html ∥ 防穿越（`..` ∥ 编码形 ∥ 反斜杠 ∥ 非法百分号）", () => {
  assert.equal(STATIC.contentTypeFor("index.html"), "text/html; charset=utf-8")
  assert.equal(STATIC.contentTypeFor("app.mjs"), "text/javascript; charset=utf-8")
  assert.equal(STATIC.contentTypeFor("style.css"), "text/css; charset=utf-8")
  assert.equal(STATIC.contentTypeFor("x.bin"), "application/octet-stream")
  assert.equal(STATIC.resolveStaticPath("/"), "index.html")
  assert.equal(STATIC.resolveStaticPath("/app.mjs"), "app.mjs")
  for (const evil of ["/..%2Fpackage.json", "/..%2F..%2Fpackage.json", "/../x", "/a/./b", "/a//b", "/a\\b", "/%zz", "/%00"]) {
    assert.equal(STATIC.resolveStaticPath(evil), null, `穿越形须拒：${evil}`)
  }
})

// ── 静态面集成：直发 ∥ no-cache ∥ 未知 404 ∥ 注册路由优先 ────────────────────
test("静态面：`/` ∥ `/app.mjs` ∥ `/nav.mjs` ∥ `/style.css` 直发（mime ∥ no-cache ∥ 字节等于磁盘）∥ 未知 ⇒ 404 JSON ∥ 穿越拒 ∥ 注册路由优先", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db, config: configWith("http://127.0.0.1:9/v1") })
  try {
    const indexDisk = readFileSync(join(PUBLIC_DIR, "index.html"), "utf8")
    const cases = [
      ["/", "index.html", "text/html"],
      ["/app.mjs", "app.mjs", "text/javascript"],
      ["/nav.mjs", "nav.mjs", "text/javascript"],
      ["/style.css", "style.css", "text/css"],
    ]
    for (const [path, diskName, mime] of cases) {
      const res = await fetchText(`${app.base}${path}`)
      assert.equal(res.status, 200, path)
      assert.match(res.headers.get("content-type"), new RegExp(mime.replace("/", "\\/")), path)
      assert.equal(res.headers.get("cache-control"), "no-cache", path)
      assert.equal(res.text, readFileSync(join(PUBLIC_DIR, diskName), "utf8"), path) // 字节等于磁盘
    }
    assert.equal((await fetchText(`${app.base}/`)).text, indexDisk)
    const missing = await fetchText(`${app.base}/nope.css`)
    assert.equal(missing.status, 404)
    assert.equal(missing.json.error.code, "not_found") // 未命中 ⇒ JSON 错误形（非静态面）
    const apiMissing = await fetchText(`${app.base}/api/nope`)
    assert.equal(apiMissing.status, 404) // `/api/*` 不走静态面
    assert.equal(apiMissing.json.error.code, "not_found")
    const routeWins = await fetchText(`${app.base}/v1/models`) // 注册路由优先（未授权 ⇒ 401——非静态 404）
    assert.equal(routeWins.status, 401)
    assert.equal(routeWins.json.error.code, "invalid_api_key")
    for (const evil of ["/..%2F..%2Fpackage.json", "/..%5C..%5Cpackage.json"]) {
      const traversal = await rawGet({ port: app.port, path: evil })
      assert.equal(traversal.status, 404, evil)
      assert.equal(JSON.parse(traversal.text).error.code, "not_found", evil)
      assert.ok(!traversal.text.includes("@thincoder/server"), "包体不得出根")
    }
  } finally {
    await app.close()
    db.close()
  }
})

// ── 前端自洽：零外部资源 ∥ 十九档在册（含 favicon 共二十档）────────────────────
test("前端自洽：`public/**` 十九档在册（含 favicon 共二十档） ∥ 零外部引用（无 http(s):// ∥ 无 @import——内网自洽，KD-SV-9）", () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual(names, ["app.mjs", "favicon.png", "i18n-en.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css", "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-system.mjs", "views-usage.mjs"])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.ok(!/https?:\/\//.test(text), `${name} 含外部链接（CDN/外链字体等——内网不达）`)
    assert.ok(!/@import/.test(text), `${name} 含 @import（禁外链样式）`)
  }
})

// ── 部署资产：五件在册 ∥ 结构要点 ∥ files 白名单（AC-8 静态面）────────────────
test("部署资产：五件在册 ∥ Dockerfile/unit/compose 结构要点 ∥ package.json `files` 白名单齐 ∥ 构建期本地 tgz 预装（零 registry 依赖）", () => {
  const files = [
    join(SERVER_DIR, "deploy", "thincoder-server.service"),
    join(SERVER_DIR, "Dockerfile"),
    join(SERVER_DIR, ".dockerignore"),
    join(SERVER_DIR, "docker-compose.yml"),
    join(SERVER_DIR, "README.md"),
  ]
  for (const file of files) assert.ok(existsSync(file), `缺档：${file}`)

  const dockerfile = readFileSync(files[1], "utf8")
  assert.match(dockerfile, /^FROM node:24-slim$/m)
  assert.match(dockerfile, /^EXPOSE 8787$/m)
  assert.match(dockerfile, /^VOLUME \/app\/data$/m)
  assert.match(dockerfile, /^ENTRYPOINT \["\/app\/deploy\/docker-entrypoint\.sh"\]$/m)
  assert.match(dockerfile, /^RUN cd \/tmp\/build && npm pack --silent && npm i -g \.\/thincoder-server-\*\.tgz --no-audit --no-fund && rm -rf \/tmp\/build$/m)
  assert.ok(!/\bnpm i -g @thincoder\/server@/.test(dockerfile), "构建期不得走 registry 装版（预装 = 本地 tgz）")

  const ignore = readFileSync(files[2], "utf8").split("\n")
  for (const entry of ["config.json", "data/", "docs/", ".git/"]) assert.ok(ignore.includes(entry), `.dockerignore 缺：${entry}`)

  const compose = readFileSync(files[3], "utf8")
  assert.match(compose, /restart: unless-stopped/)
  assert.match(compose, /- "8787:8787"/)
  assert.match(compose, /\.\/config\.json:\/app\/config\.json:ro/)
  assert.match(compose, /\.\/data:\/app\/data/)
  assert.match(compose, /env_file: \.env/)

  const unit = readFileSync(files[0], "utf8")
  assert.match(unit, /^Restart=always$/m)
  assert.match(unit, /^ExecStart=.*thincoder-server.*--config .+$/m) // ExecStart = thincoder-server --config <档>
  assert.match(unit, /^WantedBy=multi-user\.target$/m) // 开机自启（systemctl enable）
  assert.match(unit, /^\[Install\]$/m)

  const pkg = JSON.parse(readFileSync(join(SERVER_DIR, "package.json"), "utf8"))
  assert.deepEqual(pkg.files, ["bin/", "src/", "public/", "config.example.json", "README.md"])
  assert.deepEqual(pkg.dependencies ?? {}, {})
  assert.equal(pkg.bin["thincoder-server"], "bin/thincoder-server.mjs")
  assert.equal(pkg.engines.node, ">=24")
})
