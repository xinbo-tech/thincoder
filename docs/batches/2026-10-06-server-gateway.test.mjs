/**
 * 2026-10-06-server-gateway.test.mjs — thincoder-server（token 网关）批内单测件
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-server-gateway.test.mjs`
 *
 * 射程（D1 骨架段——设计 §8 D1：store/db → ops/config → gateway/server ∥ `/v1/models`）：
 *   ① 配置校验（fail-closed：host 必填 ∥ 零 provider = 允许（条目级 fail-closed） ∥ 同 provider 内模型重名拒（跨 provider 同名放行） ∥ baseURL 非 http(s) 拒 ∥
 *      bootstrap 口令 < 8 拒 ∥ port 非法拒）② 缺省值 ∥ `env:` 保形（载入不解析——构建期解析） ∥ 库路径归一（相对 = 配置档目录）
 *   ③ db 迁移链（八表 + 六索引 + `user_version=9`——v9 追加 `providers.proxy` 列（2026-10-09 代理批）；v8 追加 `api_keys.name` 列 + 存量回填默认名（2026-10-07 me-keys 批）；v7 追加 `providers.model_meta_json` 列（2026-10-07 Provider 模型元数据批）；v6 追加 `members.model_disabled_json` 列（2026-10-07 配额 v2 · 成员模型面批）；v5 追加 `usage` 拆列（`provider`/`model` 两字段）+ 派生两表 `usage_daily`/`quota_counters` + 成员配额列（2026-10-07 配额分模型批）；v4 追加 `providers.settings_json` 列（2026-10-06 服务模型配置面批）；v3 追加 `audit_events` + 三索引（console-completeness-2 批） ∥ 文件库重开幂等 ∥ 迁移段单事务回滚 ∥ FK/CHECK 生效）
 *   ④ providers 派发（`provider/model` 复合键——首斜杠切分 ∥ 裸名/未命中 404 形 ∥ 同名跨 provider 并存 ∥ `/v1/models` 前缀名清单）
 *   ⑤ 路由注册表（注册行 ∥ `:参数` ∥ 重复注册拒）⑥ 服务冒烟（200/404/400/413 ∥ 逐请求日志 ∥ 停机）
 *   ⑦ 日志形（单行 JSON）⑧ 零第三方依赖扫描（import 面仅 `node:`/相对 ∥ dependencies 空）
 *   ⑨ 入口冒烟（无 config 拒启 ∥ 坏档拒启 ∥ 就绪 + 团队 key 鉴权（401/200） ∥ 信号 ⇒ 优雅停机）
 *
 * 平台注记（信号面）：Windows 下 `process.kill(pid,'SIGTERM')` 为强制终止（Node 平台语义——
 *   不投递到 handler）；故优雅停机读数 = 子进程内 `process.emit('SIGTERM')` 驱动同一 handler 路径。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const BIN_PATH = join(ROOT, "thincoder-server", "bin", "thincoder-server.mjs")

const BIN = await load("thincoder-server/bin/thincoder-server.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const LOG = await load("thincoder-server/src/ops/log.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const ERRORS = await load("thincoder-server/src/gateway/errors.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

const ENV = { TC_TEST_KEY: "sk-test-value" }

/** 配置夹具（合法基线——逐测例覆盖单点）。 */
function baseConfig(over = {}) {
  return {
    host: "127.0.0.1",
    providers: [
      { name: "bailian", baseURL: "https://example.com/compatible-mode/v1", apiKey: "env:TC_TEST_KEY", models: ["qwen3.5-plus", "qwen3.7-max", "deepseek-v3"] },
      { name: "internal", baseURL: "http://10.0.0.9:8000/v1", apiKey: "", models: ["deepseek-v3"] },
    ],
    embedding: { baseURL: "http://10.0.0.5:11434/v1", model: "bge-m3" },
    ...over,
  }
}

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tcsrv-${tag}-`))
}

function writeConfig(dir, config) {
  const file = join(dir, "config.json")
  writeFileSync(file, typeof config === "string" ? config : JSON.stringify(config, null, 2))
  return file
}

/** 鉴权夹具：建一名成员 + 签发团队 key（`/v1/*` 面 = 团队 key 门——D3 接线）。 */
function seedApiKey(db) {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES ('tester', 'tester', 'scrypt$fixture', ?)")
    .run(new Date().toISOString())
  return KEYS.issueKey(db, Number(info.lastInsertRowid))
}

/** 子进程夹具：收集 stdout/stderr + 退出读数（注入 `env:` 夹具变量——配置面的 env 引用用）。 */
function spawnNode(args) {
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...ENV } })
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (d) => { stdout += d })
  child.stderr.on("data", (d) => { stderr += d })
  const exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })))
  return { child, exited, out: () => stdout, err: () => stderr }
}

async function waitFor(predicate, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 50))
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

// ── ① 配置校验（fail-closed 六判据）────────────────────────────────────────────

test("config：fail-closed 校验 ⇒ 拒启 ∥ 零 provider = 允许态", () => {
  const dir = tmpDir("cfg-invalid")
  try {
    const cases = [
      ["缺 host", baseConfig({ host: undefined }), /host/],
      ["同 provider 内模型重名", baseConfig({
        providers: [
          { name: "a", baseURL: "https://a.example/v1", apiKey: "", models: ["m1", "m1"] },
        ],
      }), /重名/],
      ["baseURL 非 http(s)", baseConfig({
        providers: [{ name: "a", baseURL: "ftp://a.example/v1", apiKey: "", models: ["m1"] }],
      }), /http/],
      ["bootstrap 口令 < 8", baseConfig({ bootstrap: { username: "admin", password: "short" } }), /8/],
      ["port 非法", baseConfig({ port: 70000 }), /port/],
    ]
    for (const [label, config, pattern] of cases) {
      const file = writeConfig(dir, config)
      assert.throws(() => CONFIG.loadConfig(file, { env: ENV }), pattern, label)
    }

    // 零 provider = 允许态（fail-closed 移驻条目级——ops/OPS.md §1）
    for (const zero of [baseConfig({ providers: undefined }), baseConfig({ providers: [] })]) {
      const file = writeConfig(dir, zero)
      assert.deepEqual(CONFIG.loadConfig(file, { env: ENV }).config.providers, [], "零 provider ⇒ 允许（空清单）")
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("config：缺省值 ∥ env: 解析 ∥ 库路径归一 ∥ 0.0.0.0 告警", () => {
  const dir = tmpDir("cfg-defaults")
  try {
    const file = writeConfig(dir, baseConfig())
    const { config, warnings } = CONFIG.loadConfig(file, { env: ENV })
    assert.equal(config.port, CONFIG.DEFAULT_PORT)
    assert.equal(config.port, 8787)
    assert.equal(config.db, join(dir, "data", "gateway.db"))
    assert.equal(config.providers[0].apiKey, "env:TC_TEST_KEY") // 载入不解析（引用保形——注册表构建期解析）
    assert.equal(config.bootstrap, null)
    assert.deepEqual(warnings, [])

    const file2 = writeConfig(dir, baseConfig({ host: "0.0.0.0", db: "sub/gateway.db" }))
    const second = CONFIG.loadConfig(file2, { env: ENV })
    assert.equal(second.config.db, join(dir, "sub", "gateway.db"))
    assert.equal(second.warnings.length, 1)
    assert.match(second.warnings[0], /0\.0\.0\.0/)

    const kept = CONFIG.loadConfig(file, { env: {} })
    assert.equal(kept.config.providers[0].apiKey, "env:TC_TEST_KEY")
    assert.throws(() => PROVIDERS.createProviderRegistry(kept.config.providers, { env: {} }), /环境变量缺位：TC_TEST_KEY/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ③ db 迁移链 ──────────────────────────────────────────────────────────────

test("db：迁移链 ⇒ 八表 + 六索引 + user_version=13 ∥ 约束生效", () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.equal(DB.SCHEMA_VERSION, 13)
    assert.equal(DB.readVersion(db), 13)
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name)
    for (const table of ["members", "api_keys", "sessions", "usage", "providers", "audit_events", "usage_daily", "quota_counters", "sandbox_workspaces", "sandbox_rules", "sandbox_pending", "sandbox_tasks", "sandbox_checkpoints", "sandbox_settings", "sandbox_runners", "sandbox_onboarding"]) assert.ok(names.includes(table), `缺表：${table}`)
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'").all()
    assert.equal(indexes.length, 6)
    assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1)

    // FK：usage.member_id 引用不存在的成员 ⇒ 拒
    assert.throws(
      () => db.exec("INSERT INTO usage (ts, member_id, key_id, endpoint, model, status, stream, duration_ms) VALUES (1, 999, 999, 'chat', 'm', 'ok', 0, 1)"),
      /FOREIGN KEY/i,
    )
    // CHECK：role 枚举外值 ⇒ 拒
    assert.throws(
      () => db.exec("INSERT INTO members (username, name, password_hash, role, created_at) VALUES ('u', 'n', 'h', 'root', 't')"),
      /CHECK/i,
    )
    // 幂等：同库再跑迁移 ⇒ 版本不变、不报错
    assert.equal(DB.migrate(db), 13)
  } finally {
    db.close()
  }
})

test("db：文件库重开幂等（旧库自动升 ∥ 数据保留）∥ 迁移段事务回滚", () => {
  const dir = tmpDir("db-file")
  const file = join(dir, "gateway.db")
  try {
    const first = DB.openDatabase(file)
    first.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('admin', 'admin', 'scrypt$fixture', '2026-10-06')")
    first.close()

    const second = DB.openDatabase(file)
    assert.equal(DB.readVersion(second), 13)
    assert.equal(second.prepare("SELECT count(*) AS n FROM members").get().n, 1)

    // 失败迁移：段内先建表再抛 ⇒ 整段回滚（表不落 ∥ 版本不动）
    const failing = [...DB.MIGRATIONS, { v: 14, up: (handle) => { handle.exec("CREATE TABLE v14_probe (x INTEGER)"); throw new Error("boom") } }]
    try {
      assert.throws(() => DB.migrate(second, { migrations: failing }), /迁移失败（v14）/)
      assert.equal(DB.readVersion(second), 13)
      assert.equal(second.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name = 'v14_probe'").get().n, 0)
    } finally {
      second.close()
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ④ providers 派发 ─────────────────────────────────────────────────────────

test("providers：`provider/model` 复合键派发（首斜杠切分）∥ 裸名/未命中 404 形 ∥ 同名跨 provider 并存 ∥ /v1/models 前缀名清单", () => {
  const config = CONFIG.validateConfig(baseConfig()) // 跨 provider 同名（deepseek-v3）⇒ 校验放行（正路）
  const registry = PROVIDERS.createProviderRegistry(config.providers, { env: ENV, engineModel: config.embedding.model })

  // 首斜杠切分单件：余段可含斜杠；无斜杠 ∥ 空段 ⇒ 不合形
  assert.deepEqual(PROVIDERS.splitModelRef("a/b/c"), { provider: "a", model: "b/c" })
  assert.equal(PROVIDERS.splitModelRef("a"), null)
  assert.equal(PROVIDERS.splitModelRef("a/"), null)
  assert.equal(PROVIDERS.splitModelRef("/b"), null)

  // 命中：外部标识 → provider + 上游模型名（首斜杠余段）
  const hit = registry.dispatch("bailian/qwen3.5-plus")
  assert.equal(hit.provider.name, "bailian")
  assert.equal(hit.model, "qwen3.5-plus")
  assert.equal(registry.dispatch("internal/deepseek-v3").provider.name, "internal")
  // 同名跨 provider 并存且各自可达（同名 → 各自 provider）
  assert.equal(registry.dispatch("bailian/deepseek-v3").provider.name, "bailian")
  assert.equal(registry.dispatch("internal/deepseek-v3").provider.name, "internal")
  // 余段含斜杠（上游名携 `/`）——首斜杠切分后整段匹配
  const slashed = CONFIG.validateConfig(baseConfig({
    providers: [{ name: "a", baseURL: "https://a.example/v1", apiKey: "", models: ["org/model-x"] }],
  }))
  const slashedHit = PROVIDERS.createProviderRegistry(slashed.providers, { env: ENV }).dispatch("a/org/model-x")
  assert.equal(slashedHit.provider.name, "a")
  assert.equal(slashedHit.model, "org/model-x")

  // 未命中 ∥ 裸名（无斜杠 ∥ 空段）⇒ 404 `model_not_found`（提示带前缀形）
  for (const ref of ["nope-model", "", "bailian/", "/qwen3.5-plus", "unknown-provider/m1", "bailian/nope-model"]) {
    const miss = registry.dispatch(ref)
    assert.equal(miss.miss.status, 404, ref)
    assert.equal(miss.miss.body.error.code, "model_not_found", ref)
    assert.match(miss.miss.body.error.message, /provider\/model/, ref)
  }
  assert.match(registry.dispatch("nope-model").miss.body.error.message, /nope-model/) // 回显原值
  assert.match(registry.dispatch("bailian/nope-model").miss.body.error.message, /bailian\/nope-model/)

  const list = PROVIDERS.modelList(registry)
  assert.equal(list.object, "list")
  assert.deepEqual(list.data.map((m) => m.id), [
    "bailian/qwen3.5-plus", "bailian/qwen3.7-max", "bailian/deepseek-v3", "internal/deepseek-v3",
  ])
  assert.equal(list.data[0].owned_by, "bailian")
  assert.equal(list.data.some((m) => m.owned_by === "embedding" || m.id === "bge-m3"), false, "零引擎行（KD-SV-58——2026-10-09 embed 解耦批）")
})

// ── ⑤ 路由注册表 ─────────────────────────────────────────────────────────────

test("server：路由注册表（注册行 ∥ :参数 ∥ 未命中 null ∥ 重复注册拒）", () => {
  const routes = SERVER.createRouteTable()
  routes.add("GET", "/v1/models", () => {})
  routes.add("POST", "/api/members/:id/keys/:keyId/revoke", () => {})
  assert.equal(routes.size, 2)

  const hit = routes.resolve("POST", "/api/members/7/keys/9/revoke")
  assert.deepEqual(hit.params, { id: "7", keyId: "9" })
  assert.equal(typeof hit.handler, "function")
  assert.equal(routes.resolve("GET", "/v1/models").params && Object.keys(routes.resolve("GET", "/v1/models").params).length, 0)
  assert.equal(routes.resolve("POST", "/v1/models"), null) // 方法不匹配
  assert.equal(routes.resolve("GET", "/v1/nope"), null)
  assert.throws(() => routes.add("GET", "/v1/models", () => {}), /重复注册/)
})

// ── ⑥ 服务冒烟（进程内 http）─────────────────────────────────────────────────

test("server：服务冒烟（200/404/400/413 ∥ 逐请求日志 ∥ 停机）", async () => {
  const config = CONFIG.validateConfig(baseConfig())
  const lines = []
  const log = {
    info: (event, fields) => lines.push({ level: "info", event, ...fields }),
    warn: (event, fields) => lines.push({ level: "warn", event, ...fields }),
    error: (event, fields) => lines.push({ level: "error", event, ...fields }),
  }
  const db = DB.openDatabase(":memory:")
  const apiKey = seedApiKey(db)
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config, env: ENV })
  routes.add("POST", "/echo", async (req, res, ctx) => {
    const body = await SERVER.readJsonBody(req, { limit: 64 })
    ERRORS.sendJson(res, 200, { echo: body, params: ctx.params })
  })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    // 401：无 key（D3 起 `/v1/models` 走团队 key 鉴权——AC-1 三态门）
    const denied = await fetch(`${base}/v1/models`)
    assert.equal(denied.status, 401)
    assert.equal((await denied.json()).error.code, "invalid_api_key")

    // 200：携团队 key ⇒ 配置派生模型清单
    const models = await fetch(`${base}/v1/models`, { headers: { authorization: `Bearer ${apiKey.plain}` } })
    assert.equal(models.status, 200)
    assert.match(models.headers.get("content-type"), /application\/json/)
    const payload = await models.json()
    assert.deepEqual(payload.data.map((m) => m.id), ["bailian/qwen3.5-plus", "bailian/qwen3.7-max", "bailian/deepseek-v3", "internal/deepseek-v3"])

    // 404：未知路由
    const missing = await fetch(`${base}/v1/nope`)
    assert.equal(missing.status, 404)
    assert.equal((await missing.json()).error.code, "not_found")

    // 400：body 非 JSON
    const badJson = await fetch(`${base}/echo`, { method: "POST", body: "{not json" })
    assert.equal(badJson.status, 400)
    assert.equal((await badJson.json()).error.code, "invalid_request_error")

    // 200：合法 JSON body 解析（读限注入口径）
    const ok = await fetch(`${base}/echo`, { method: "POST", body: JSON.stringify({ model: "m1" }) })
    assert.equal(ok.status, 200)
    assert.deepEqual((await ok.json()).echo, { model: "m1" })

    // 413：体超上限（本路由限 64 字节）
    const big = await fetch(`${base}/echo`, { method: "POST", body: "x".repeat(4096) })
    assert.equal(big.status, 413)
    assert.equal((await big.json()).error.code, "payload_too_large")

    // 逐请求日志：各路径一行（method ∥ path ∥ status ∥ ms）
    const requests = lines.filter((l) => l.event === "request")
    assert.ok(requests.length >= 5, `请求日志条数不足：${requests.length}`)
    const modelLines = requests.filter((l) => l.path === "/v1/models")
    assert.equal(modelLines.length, 2) // 无 key ⇒ 401 ∥ 携 key ⇒ 200——各一行
    assert.deepEqual(modelLines.map((l) => l.status), [401, 200])
    assert.equal(modelLines[1].method, "GET")
    assert.ok(Number.isInteger(modelLines[1].ms))

    // 停机：停收新连（端口释放）
    const closed = new Promise((resolve) => server.close(resolve))
    server.closeIdleConnections()
    await closed
    await assert.rejects(fetch(`${base}/v1/models`))
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve))
    db.close()
  }
})

// ── ⑦ 日志形 ─────────────────────────────────────────────────────────────────

test("log：单行 JSON（ts ∥ level ∥ event ∥ fields ∥ Error 归一）", () => {
  const chunks = []
  const logger = LOG.createLogger({ stream: { write: (chunk) => { chunks.push(chunk) } } })
  logger.info("ready", { port: 8787 })
  logger.warn("config_warning", { message: "0.0.0.0" })
  logger.error("startup_failed", { err: new Error("boom") })
  assert.equal(chunks.length, 3)
  for (const chunk of chunks) {
    assert.equal(chunk.indexOf("\n"), chunk.length - 1, "单行 JSON（仅结尾换行）")
    const line = JSON.parse(chunk)
    assert.equal(typeof line.ts, "string")
    assert.ok(["info", "warn", "error"].includes(line.level))
    assert.equal(typeof line.event, "string")
  }
  assert.deepEqual(JSON.parse(chunks[2]).err, { name: "Error", message: "boom" })
})

// ── ⑧ 零第三方依赖扫描 ───────────────────────────────────────────────────────

test("依赖面：全树 import 仅 node:/相对 ∥ package.json dependencies 空", () => {
  const dir = join(ROOT, "thincoder-server")
  const files = readdirSync(dir, { recursive: true }).map(String).filter((rel) => rel.endsWith(".mjs"))
  assert.ok(files.length >= 7, `服务树档数不足：${files.length}`)
  const specifiers = []
  for (const rel of files) {
    const text = readFileSync(join(dir, rel), "utf8")
    for (const match of text.matchAll(/\bfrom\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
  }
  assert.ok(specifiers.length >= 7)
  for (const [rel, spec] of specifiers) {
    assert.ok(spec.startsWith("node:") || spec.startsWith(".") || spec.startsWith("@thincoder/core"), `${rel} 出现非许可 import（仅 node: ∥ 相对 ∥ @thincoder/core——本仓包）：${spec}`)
  }
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
  assert.deepEqual(pkg.dependencies ?? {}, { "@thincoder/core": "^0.10.4" }, "dependencies 仅 @thincoder/core（本仓包——KD-SV-78；零第三方）")
})

// ── ⑨ 入口冒烟（CLI 真实进程）───────────────────────────────────────────────

test("入口：无 --config ⇒ 拒启（非零退出 + 明确报错）", async () => {
  const child = spawnNode([BIN_PATH])
  const { code } = await child.exited
  assert.equal(code, 1)
  assert.match(child.out(), /startup_failed/)
  assert.match(child.out(), /缺少 --config/)
})

test("入口：坏档 ⇒ 拒启 ∥ 非法配置 ⇒ 拒启", async () => {
  const dir = tmpDir("cli-bad")
  try {
    const missing = spawnNode([BIN_PATH, "--config", join(dir, "nope.json")])
    assert.equal((await missing.exited).code, 1)
    assert.match(missing.out(), /配置档不可读/)

    const badJson = writeConfig(dir, "{ not json")
    const broken = spawnNode([BIN_PATH, "--config", badJson])
    assert.equal((await broken.exited).code, 1)
    assert.match(broken.out(), /非合法 JSON/)

    const invalid = writeConfig(dir, baseConfig({ host: undefined }))
    const refused = spawnNode([BIN_PATH, "--config", invalid])
    assert.equal((await refused.exited).code, 1)
    assert.match(refused.out(), /缺 host/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("入口：就绪 + /v1/models 鉴权（无 key ⇒ 401 ∥ 携 key ⇒ 200）∥ 信号 ⇒ 优雅停机（停收新连 ∥ 关库）", async () => {
  const dir = tmpDir("cli-run")
  try {
    const port = await freePort()
    const file = writeConfig(dir, baseConfig({ host: "127.0.0.1", port }))
    const seed = DB.openDatabase(join(dir, "data", "gateway.db"))
    const apiKey = seedApiKey(seed)
    seed.close()

    // (a) 真实 CLI：就绪日志 + 团队 key 鉴权（D3 接线——旧「原型直通」断言已由本改笔取代）
    const cli = spawnNode([BIN_PATH, "--config", file])
    try {
      assert.ok(await waitFor(() => cli.out().includes('"event":"ready"')), `未见就绪日志：${cli.out()} ${cli.err()}`)
      const unauth = await fetch(`http://127.0.0.1:${port}/v1/models`)
      assert.equal(unauth.status, 401)
      assert.equal((await unauth.json()).error.code, "invalid_api_key")
      const response = await fetch(`http://127.0.0.1:${port}/v1/models`, { headers: { authorization: `Bearer ${apiKey.plain}` } })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).data.length, 4)
      assert.match(cli.out(), /"event":"ready"/)
    } finally {
      cli.child.kill()
      await cli.exited
    }

    // (b) 信号 ⇒ 优雅停机（同 handler 路径；Windows 平台不能程序化投递 SIGTERM——见档头注记）
    const harness = join(dir, "harness.mjs")
    writeFileSync(harness, [
      `import { run } from ${JSON.stringify(pathToFileURL(BIN_PATH).href)}`,
      `await run(["--config", ${JSON.stringify(file)}])`,
      `process.emit("SIGTERM")`,
      "",
    ].join("\n"))
    const graceful = spawnNode([harness])
    const { code } = await graceful.exited
    assert.equal(code, 0)
    assert.match(graceful.out(), /"event":"ready"/)
    assert.match(graceful.out(), /"event":"shutdown".*"signal":"SIGTERM"/)
    assert.match(graceful.out(), /"event":"stopped"/)
    // 停机后端口已释放（停收新连读数）
    await assert.rejects(fetch(`http://127.0.0.1:${port}/v1/models`))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── 错误形表（gateway/API.md §3 全码）────────────────────────────────────────

test("errors：全码表状态 ∥ 统一形 ∥ HttpError 语义", () => {
  const expected = {
    invalid_api_key: 401, unauthorized: 401, invalid_credentials: 401, forbidden: 403,
    not_found: 404, model_not_found: 404, invalid_request_error: 400,
    payload_too_large: 413, quota_exceeded: 429, upstream_error: 502, internal_error: 500,
  }
  for (const [code, status] of Object.entries(expected)) {
    assert.equal(ERRORS.ERROR_CODES[code].status, status, code)
  }
  const body = ERRORS.errorBody("quota_exceeded", "已用 120 / 额度 100")
  assert.deepEqual(Object.keys(body.error).sort(), ["code", "message", "type"])
  assert.equal(body.error.code, "quota_exceeded")
  const err = new ERRORS.HttpError("payload_too_large", "太大")
  assert.equal(err.status, 413)
  assert.equal(err.code, "payload_too_large")
  assert.ok(err instanceof Error)
})
