/**
 * 2026-10-09-server-model-alias.test.mjs — thincoder-server 批内单测件（server-model-alias 批 · 台账 #1153 +
 * 并入 #1008 ∥ #1010 ∥ #1152 ∥ #967 ∥ #1151 · KD-SV-59；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-server-model-alias.test.mjs`
 *
 * 射程（判据源 = gateway/API.md §2/§2.1/§2.2/§2.3 ∥ §6 KD-SV-59 ∥ §7 N35/B25/E26 ∥ metering/METERING.md §2.1/§2.3/§3 ∥
 * §4 AC-29④ ∥ §7 N34/B26/E23 ∥ accounts/ACCOUNTS.md §2.2/§5 AC-23 ∥ §8（#1008）∥ webui/WEBUI.md §2.1/§2.2/§2.4③④ ∥
 * §6 AC-17/AC-29① ∥ ops/OPS.md §1/§7 AC-29①③）：
 *   A 配置·注册表（载入 ∥ 构建径）：条目两形归一 ∥ 形判拒启（E26①）∥ 别名全服唯一（单条内 ∥ 批量跨 provider）∥
 *     派发 = 对外标识精确匹配（配了只认别名 ∥ 旧前缀名 404 消息含别名）∥ `/v1/models` id = 外标 ∥ 未配别名回落前缀形
 *   B 保存径（HTTP + mock 上游）：PATCH 别名 ⇒ 当即热生效（清单 ∥ 派发 ∥ 上游收真名）∥ `models` 保形 ∥ 清空回落 ∥
 *     别名撞 400 库与运行时零变 ∥ 形非法 400（首尾空白——#1008）
 *   C 成员面（#1008/E23/AC-29④）：键形（裸名合法 ∥ 首尾空白 ∥ 空段 ⇒ 400 库零变）∥ 禁用滤除按外标 ∥ view 三图键 = 外标
 *   D 读面回映射（N34 ∥ B26）：明细/导出/summary.byModel/trendByModel/月表 = 外标 ∥ 过滤反查（别名 → 真名对）∥
 *     改别名 ⇒ 当即随动（旧外标零命中、无历史映射）∥ 零别名 ⇒ 零迁移回落
 *   E 界面面（AC-29①②③ ∥ #1151）：i18n +4 键两表 ∥ 派生两形 ∥ 停用/别名写面保形 ∥ 详情六组（G 别名）∥
 *     仅别名变更随携 `models` ∥ Provider 窗勾选保形 ∥ 向量卡「用法」行随段显隐
 *   F 嵌入面零涉 + #1152 + import 扫描：`/api/system.embedding.model` 判据单源 = 运行时 accessor ∥ 引擎名单独命名空间 ∥
 *     改动面零第三方依赖
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const SYSTEM_ROUTES = await load("thincoder-server/src/gateway/system.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")
const REPORT = await load("thincoder-server/src/metering/report.mjs")
const AGG = await load("thincoder-server/src/metering/aggregates.mjs")

const { ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const { EN } = await load("thincoder-server/public/i18n-en.mjs")
const I18N = await load("thincoder-server/public/i18n.mjs")
const MODELS = await load("thincoder-server/public/views-models.mjs")
const PROVIDER_MODALS = await load("thincoder-server/public/views-providers-modals.mjs")
const SYSTEM_VIEW = await load("thincoder-server/public/views-system.mjs")

const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const PASSWORD = "password-123"

// ── 助手（mock 上游 ∥ 配置夹具 ∥ 进程内服务）────────────────────────────────────

/** mock 上游（非流式 chat 单面）：记录请求体（断言「上游收真名」）∥ 固定响应。 */
async function startMockUpstream({ totalTokens = 7 } = {}) {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      requests.push({ url: req.url, body: JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") })
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ id: "c1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "ok" } }], usage: { prompt_tokens: 3, completion_tokens: totalTokens - 3, total_tokens: totalTokens } }))
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}/v1`,
    requests,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) }),
  }
}

/** 配置夹具（`providers` 经单源校验——model 侧两形随用例传入）。 */
async function validatedConfig(upstreamBase, models = ["mock-chat", { name: "real", alias: "fast" }]) {
  return CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "mock", baseURL: upstreamBase, apiKey: "sk-upstream", models }],
  })
}

/** 进程内服务（全族注册——gateway ∥ provider 管理 ∥ 账号 ∥ 管理 ∥ 计量 ∥ 系统）。 */
async function startServer({ db, config, systemRuntime = null }) {
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  SYSTEM_ROUTES.registerSystemRoutes(routes, { db, embedding: config.embedding, providerRuntime: systemRuntime ?? runtime })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    runtime,
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) }),
  }
}

async function call(base, method, path, { body, cookie, token } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, json, text, setCookies: res.headers.getSetCookie?.() ?? [] }
}
const post = (base, path, opts) => call(base, "POST", path, opts)
const get = (base, path, opts) => call(base, "GET", path, opts)

async function login(base, username, password) {
  const res = await post(base, "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}

async function makeAdmin(db) {
  const { member } = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  return member
}

/** 库内 provider 行（管理面 save 的等价物——直接落库 + 运行时由装配点构建）。 */
function seedProvider(db, models, now = new Date().toISOString()) {
  db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, proxy, created_at, updated_at) VALUES (?,?,?,?,?,?,?)")
    .run("mock", "https://up.example/v1", "", JSON.stringify(models), 0, now, now)
}

const modelIds = (list) => list.data.map((m) => m.id)
const sortedKeys = (obj) => Object.entries(obj ?? {}).sort()

// ── A 配置 · 注册表（载入 ∥ 构建径）─────────────────────────────────────────────

test("A1 条目两形归一 ∥ 形判拒启（KD-SV-59①/E26）：字符串 = 无别名 ∥ 对象 alias 缺省/null/\"\" ⇒ 归一无别名", () => {
  const entry = (models) => ({ name: "up", baseURL: "https://up.example/v1", apiKey: "", models })
  const normalized = CONFIG.validateProviderEntry(entry(["a", { name: "b", alias: "" }, { name: "c", alias: null }, { name: "d" }, { name: "e", alias: "ee" }]), { where: "t" })
  assert.deepEqual(normalized.models, ["a", "b", "c", "d", { name: "e", alias: "ee" }], "两形归一（空别名回落字符串形——保存径归一）")
  for (const bad of [[5], [true], [null], [[]], [{ name: "" }], [{ name: "b", alias: 3 }], [{ name: "b", alias: true }], [{ name: "b", alias: {} }], [{ name: "b", alias: [] }], [{ name: "b", alias: "x/y" }], [{ name: "b", alias: " x" }], [{ name: "b", alias: "x " }]]) {
    assert.throws(() => CONFIG.validateProviderEntry(entry(bad), { where: "t" }), /拒|非法|须为/, `形非法 ⇒ 拒启：${JSON.stringify(bad)}`)
  }
  assert.throws(() => CONFIG.validateProviderEntry(entry(["a", "a"]), { where: "t" }), /模型重名/, "同 provider 内模型重名 ⇒ 拒（既有判据不回归）")
})

test("A2 别名全服唯一（KD-SV-59③）：单条内 ∥ 批量跨 provider ⇒ 拒启；别名与前缀名形上不相交", () => {
  const single = { name: "p", baseURL: "https://p.example/v1", apiKey: "", models: [{ name: "a", alias: "x" }, { name: "b", alias: "x" }] }
  assert.throws(() => CONFIG.validateProviderEntry(single, { where: "t" }), /别名重名/, "单条内重名 ⇒ 拒")
  assert.throws(() => CONFIG.validateProviderEntries([
    { name: "p1", baseURL: "https://p1.example/v1", apiKey: "", models: [{ name: "m", alias: "shared" }] },
    { name: "p2", baseURL: "https://p2.example/v1", apiKey: "", models: [{ name: "n", alias: "shared" }] },
  ]), /别名重名/, "跨 provider 重名 ⇒ 拒启（批量径）")
  // 别名 vs 带前缀名 = 形上不相交（别名无斜杠 ⇒ 唯一撞法被形校验拦下）
  assert.throws(() => CONFIG.validateProviderEntry({ name: "p", baseURL: "https://p.example/v1", apiKey: "", models: [{ name: "m", alias: "p/m" }] }, { where: "t" }), /斜杠/, "别名含 \"/\" ⇒ 拒")
  assert.doesNotThrow(() => CONFIG.assertAliasesUnique([{ name: "p", models: ["a", { name: "b", alias: "bb" }] }]), "合法集 ⇒ 零抛")
})

test("A3 派发与清单（N35/KD-SV-59②）：别名精确匹配 ∥ 旧前缀名 404 含别名 ∥ 未配别名照旧 ∥ `/v1/models` id = 外标", () => {
  const config = CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [
      { name: "mock", baseURL: "https://up.example/v1", apiKey: "", models: ["mock-chat", { name: "real", alias: "fast" }] },
      { name: "other", baseURL: "https://other.example/v1", apiKey: "", models: ["real"] },
    ],
  })
  const registry = PROVIDERS.createProviderRegistry(config.providers, { env: {} })
  const hit = registry.dispatch("fast")
  assert.deepEqual([hit.provider.name, hit.model], ["mock", "real"], "别名 ⇒ 真名对（provider 对象 + 上游真名）")
  const oldName = registry.dispatch("mock/real")
  assert.deepEqual([oldName.miss.status, oldName.miss.body.error.code], [404, "model_not_found"], "配了别名 ⇒ 旧前缀名 404")
  assert.match(oldName.miss.body.error.message, /fast/, "404 消息明示别名（KD-SV-59②）")
  assert.match(oldName.miss.body.error.message, /配了只认别名/, "404 消息口径句")
  assert.equal(registry.dispatch("other/real").model, "real", "同名模型跨 provider 并存（他 provider 未配别名 ⇒ 前缀名照旧）")
  assert.equal(registry.dispatch("mock/mock-chat").model, "mock-chat", "未配别名模型 ⇒ 前缀名照旧")
  for (const ref of ["nope", "", "mock/", "/real", "unknown/x"]) {
    const miss = registry.dispatch(ref)
    assert.deepEqual([miss.miss.status, miss.miss.body.error.code], [404, "model_not_found"], `未命中 ⇒ 404：${ref}`)
    assert.match(miss.miss.body.error.message, /provider\/model/, "提示带前缀形（既有口径保持）")
  }
  assert.deepEqual(modelIds(PROVIDERS.modelList(registry)), ["mock/mock-chat", "fast", "other/real"], "清单 id = 外标（条目序）")
  assert.equal(PROVIDERS.modelList(registry).data.some((m) => m.owned_by === "embedding"), false, "零引擎行（KD-SV-58 不回归）")
})

// ── B 保存径与热生效（HTTP + mock 上游）─────────────────────────────────────────

test("B1 PATCH 别名 ⇒ 当即热生效：清单换外标 ∥ 派发走上游真名 ∥ `models` 保形 ∥ 库随动（N35/B25）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const config = await validatedConfig(mock.base, ["mock-chat"]) // 起点：无别名（别名条目由后续接线显式给）
  void config
  const app = await startServer({ db, config })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const member = await MEMBERS.createMember(db, { username: "alice", password: PASSWORD })
    const key = KEYS.issueKey(db, member.member.id)
    assert.deepEqual(modelIds((await get(app.base, "/v1/models", { token: key.plain })).json), ["mock/mock-chat"], "起点：前缀形")
    // PATCH：单条别名（其余条目保形——含对象条目）
    const seeded = await post(app.base, "/api/admin/providers", { cookie, body: { name: "p2", baseURL: "https://p2.example/v1", apiKey: "", models: [{ name: "keep", alias: "keep-alias" }] } })
    assert.equal(seeded.status, 200, "第二 provider（别名条目在场）")
    const rows = (await get(app.base, "/api/admin/providers", { cookie })).json.providers
    const mockRow = rows.find((r) => r.name === "mock")
    const patched = await call(app.base, "PATCH", `/api/admin/providers/${mockRow.id}`, { cookie, body: { models: [{ name: "mock-chat", alias: "quick" }] } })
    assert.deepEqual([patched.status, patched.json.ok], [200, true], "PATCH 别名 ⇒ 200")
    assert.deepEqual(modelIds((await get(app.base, "/v1/models", { token: key.plain })).json).sort(), ["keep-alias", "quick"], "清单 id 当即换外标")
    // 别名派发（上游收真名）+ 记账外标
    const chat = await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "quick", messages: [] } })
    assert.equal(chat.status, 200, "别名可派发（当即热生效）")
    assert.equal(mock.requests.at(-1).body.model, "mock-chat", "上游请求体 model = 真名")
    assert.equal(USAGE.queryUsage(db, {})[0].model, "quick", "记账读面 = 外标")
    assert.deepEqual(db.prepare("SELECT provider, model FROM usage ORDER BY id DESC LIMIT 1").get(), Object.assign(Object.create(null), { provider: "mock", model: "mock-chat" }), "记账内部真名两字段零改")
    const gone = await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "mock/mock-chat", messages: [] } })
    assert.deepEqual([gone.status, gone.json.error.code], [404, "model_not_found"], "旧前缀名 ⇒ 404")
    // 他 provider 对象条目保形（未被本次 PATCH 抹平）
    const after = (await get(app.base, "/api/admin/providers", { cookie })).json.providers
    assert.deepEqual(after.find((r) => r.name === "p2").models, [{ name: "keep", alias: "keep-alias" }], "非目标条目零触")
  } finally { await app.close(); db.close(); await mock.close() }
})

test("B2 清空别名 ⇒ 回落字符串形（前缀名恢复可达 ∥ 旧别名 404）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const member = await MEMBERS.createMember(db, { username: "alice", password: PASSWORD })
    const key = KEYS.issueKey(db, member.member.id)
    const row = (await get(app.base, "/api/admin/providers", { cookie })).json.providers[0]
    assert.deepEqual(row.models, ["mock-chat", { name: "real", alias: "fast" }], "起点：别名条目在场")
    const cleared = await call(app.base, "PATCH", `/api/admin/providers/${row.id}`, { cookie, body: { models: ["mock-chat", "real"] } })
    assert.equal(cleared.status, 200, "清空（回落字符串形）")
    assert.deepEqual((await get(app.base, "/api/admin/providers", { cookie })).json.providers[0].models, ["mock-chat", "real"], "库面 = 字符串形（归一无别名）")
    assert.equal((await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "mock/real", messages: [] } })).status, 200, "前缀名恢复可达")
    const old = await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "fast", messages: [] } })
    assert.deepEqual([old.status, old.json.error.code], [404, "model_not_found"], "旧别名 ⇒ 404（无历史映射）")
  } finally { await app.close(); db.close(); await mock.close() }
})

test("B3 别名撞（跨 provider）⇒ 400 库与运行时零变（保存径对既有集——KD-SV-59③）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const before = db.prepare("SELECT COUNT(*) AS n FROM providers").get().n
    const created = await post(app.base, "/api/admin/providers", { cookie, body: { name: "p2", baseURL: "https://p2.example/v1", apiKey: "", models: [{ name: "n", alias: "fast" }] } })
    assert.deepEqual([created.status, created.json.error.code], [400, "invalid_request_error"], "别名撞既有集 ⇒ 400")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n, before, "库零变（未落行）")
    assert.equal(app.runtime.get().dispatch("fast").provider.name, "mock", "运行时零变（旧表未换）")
    assert.equal(app.runtime.get().dispatch("mock/real").miss.status, 404, "旧前缀名仍不可达（配了只认别名——运行时零变）")
  } finally { await app.close(); db.close(); await mock.close() }
})

test("B4 别名形非法 ⇒ 400（首尾空白 ∥ 含斜杠——#1008 同拍；库与运行时零变）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const app = await startServer({ db, config: await validatedConfig(mock.base, ["mock-chat"]) })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const row = (await get(app.base, "/api/admin/providers", { cookie })).json.providers[0]
    const before = db.prepare("SELECT models_json FROM providers WHERE id = ?").get(row.id).models_json
    for (const bad of [[{ name: "mock-chat", alias: " quick" }], [{ name: "mock-chat", alias: "quick " }], [{ name: "mock-chat", alias: "a/b" }], ["mock-chat", 5]]) {
      const res = await call(app.base, "PATCH", `/api/admin/providers/${row.id}`, { cookie, body: { models: bad } })
      assert.deepEqual([res.status, res.json.error.code], [400, "invalid_request_error"], `形非法 ⇒ 400：${JSON.stringify(bad)}`)
    }
    assert.equal(db.prepare("SELECT models_json FROM providers WHERE id = ?").get(row.id).models_json, before, "400 ⇒ 库零变")
  } finally { await app.close(); db.close(); await mock.close() }
})

// ── C 成员面（#1008 ∥ AC-29④）──────────────────────────────────────────────────

test("C1 成员键形（#1008/E23）：裸名照收（两 merge 直调 ∥ HTTP）∥ 首尾空白 ∥ 空段 ⇒ 400 库零变", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const { member } = await MEMBERS.createMember(db, { username: "alice", password: PASSWORD })
    // 直调面：裸名（别名形）合法
    assert.doesNotThrow(() => MEMBERS.mergeMemberModelQuotas(db, member.id, { fast: 5 }), "裸名配额键 ⇒ 照收（别名形——#1008 收正）")
    assert.doesNotThrow(() => MEMBERS.mergeMemberModelDisables(db, member.id, { fast: true }), "裸名禁用键 ⇒ 照收")
    assert.deepEqual(MEMBERS.parseModelQuotas(db.prepare("SELECT model_quotas_json FROM members WHERE id = ?").get(member.id).model_quotas_json), { fast: 5 }, "落库键 = 原样")
    // 400 面：首尾空白 ∥ 空段（库零变）
    const before = db.prepare("SELECT model_quotas_json, model_disabled_json FROM members WHERE id = ?").get(member.id)
    for (const bad of [{ " fast": 1 }, { "fast ": 1 }, { "/fast": 1 }, { "fast/": 1 }, { "": 1 }]) {
      const res = await post(app.base, `/api/members/${member.id}/model-quotas`, { cookie, body: { quotas: bad } })
      assert.deepEqual([res.status, res.json.error.code], [400, "invalid_request_error"], `键形非法 ⇒ 400：${JSON.stringify(bad)}`)
    }
    for (const bad of [{ " fast": true }, { "/fast": true }, { "fast/": true }, { "": true }, { fast: false }]) {
      const res = await post(app.base, `/api/members/${member.id}/model-disables`, { cookie, body: { disables: bad } })
      assert.deepEqual([res.status, res.json.error.code], [400, "invalid_request_error"], `禁用键形/值非法 ⇒ 400：${JSON.stringify(bad)}`)
    }
    assert.deepEqual(db.prepare("SELECT model_quotas_json, model_disabled_json FROM members WHERE id = ?").get(member.id), before, "400 ⇒ 库零变")
    // HTTP 正面：前缀形照收（既有口径不回归）
    const okRes = await post(app.base, `/api/members/${member.id}/model-quotas`, { cookie, body: { quotas: { "mock/real": 9, fast: 5 } } })
    assert.equal(okRes.status, 200, "前缀形 + 裸名混收 ⇒ 200")
  } finally { await app.close(); db.close(); await mock.close() }
})

test("C2 成员面随动（AC-29④）：禁用滤除按外标 ∥ view 三图键 = 外标 ∥ 别名键配额生效", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const { member } = await MEMBERS.createMember(db, { username: "alice", password: PASSWORD })
    const key = KEYS.issueKey(db, member.id)
    assert.ok(modelIds((await get(app.base, "/v1/models", { token: key.plain })).json).includes("fast"), "别名行在成员清单（外标）")
    // 配额（别名键——外标）⇒ 用满 ⇒ 429
    assert.equal((await post(app.base, `/api/members/${member.id}/model-quotas`, { cookie, body: { quotas: { fast: 5 } } })).status, 200, "配额键 = 外标")
    assert.equal((await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "fast", messages: [] } })).status, 200, "首请求放行（7 tokens > 5 上限 ⇒ 次请求拒）")
    const limited = await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "fast", messages: [] } })
    assert.deepEqual([limited.status, limited.json.error.code], [429, "quota_exceeded"], "别名键配额生效（429——零新码）")
    // 禁用（别名键）⇒ 清单滤除 + 派发 404
    assert.equal((await post(app.base, `/api/members/${member.id}/model-disables`, { cookie, body: { disables: { fast: true } } })).status, 200, "禁用键 = 外标 ⇒ 200")
    assert.equal(modelIds((await get(app.base, "/v1/models", { token: key.plain })).json).includes("fast"), false, "禁后别名行离成员清单")
    const denied = await post(app.base, "/v1/chat/completions", { token: key.plain, body: { model: "fast", messages: [] } })
    assert.deepEqual([denied.status, denied.json.error.code], [404, "model_not_found"], "禁用 ⇒ 404（零新码）")
    // view 三图键 = 外标（admin 列表 ∥ 本人面）
    const row = (await get(app.base, "/api/members", { cookie })).json.members.find((m) => m.id === member.id)
    assert.deepEqual(Object.keys(row.modelUsage), ["fast"], "成员行 modelUsage 键 = 外标")
    assert.deepEqual(Object.keys(row.modelQuotas), ["fast"], "成员行 modelQuotas 键 = 外标（原样存储）")
    assert.deepEqual(Object.keys(row.modelDisables), ["fast"], "成员行 modelDisables 键 = 外标")
    const me = (await get(app.base, "/api/me", { cookie: (await login(app.base, "alice", PASSWORD)).cookie })).json
    assert.deepEqual([Object.keys(me.modelUsage), Object.keys(me.modelQuotas), Object.keys(me.modelDisables)], [["fast"], ["fast"], ["fast"]], "/api/me 三图键 = 外标")
  } finally { await app.close(); db.close(); await mock.close() }
})

// ── D 读面回映射（N34 ∥ B26）───────────────────────────────────────────────────

test("D1 读面回映射（N34）：明细 ∥ 导出 ∥ summary.byModel ∥ trendByModel ∥ 月表 = 外标；嵌入行单段零涉", async () => {
  const db = DB.openDatabase(":memory:")
  const now = Date.now()
  seedProvider(db, [{ name: "mock-chat", alias: "fast" }, "plain"])
  const { member } = await MEMBERS.createMember(db, { username: "alice", password: PASSWORD })
  const key = KEYS.issueKey(db, member.id)
  const rec = (model, provider = "mock", totalTokens = 10) => USAGE.recordUsage(db, { ts: now, memberId: member.id, keyId: key.id, provider, model, endpoint: provider === "" ? "embeddings" : "chat", status: "ok", stream: false, promptTokens: 1, completionTokens: 1, totalTokens, durationMs: 5 })
  rec("mock-chat"); rec("mock-chat"); rec("plain"); rec("bge-m3", "")
  assert.deepEqual(USAGE.queryUsage(db, {}).map((r) => r.model).sort(), ["bge-m3", "fast", "fast", "mock/plain"], "明细 model = 外标（配别名 ⇒ 别名；嵌入行单段）")
  assert.deepEqual(USAGE.exportUsageRows(db, {}).map((r) => r.model).sort(), ["bge-m3", "fast", "fast", "mock/plain"], "导出同映射")
  const summary = USAGE.usageSummary(db, { now })
  assert.deepEqual(summary.byModel.map((r) => r.model).sort(), ["bge-m3", "fast", "mock/plain"], "summary.byModel = 外标")
  assert.deepEqual(summary.byModel[0], { model: "fast", requests: 2, totalTokens: 20 }, "排行口径（降序——token 聚合后排序）")
  assert.deepEqual(summary.totals, { requests: 4, totalTokens: 40 }, "totals 零改（无 model 维）")
  const mine = REPORT.memberUsageSummary(db, { memberId: member.id, now })
  assert.deepEqual([...new Set(mine.trendByModel.map((r) => r.model))].sort(), ["bge-m3", "fast", "mock/plain"], "trendByModel 维值 = 外标")
  assert.deepEqual([...new Set(mine.trendByEndpoint.map((r) => r.endpoint))].sort(), ["chat", "embeddings"], "端点维零改")
  assert.deepEqual(sortedKeys(AGG.monthlyCountersByMember(db, { memberId: member.id, now }).get(member.id)), sortedKeys({ fast: 20, "mock/plain": 10, "bge-m3": 10 }), "月表键 = 外标")
})

test("D2 过滤反查（B26）：别名 → 真名对 ∥ 未配别名前缀形照常 ∥ embeddings 命名空间零切分", () => {
  const db = DB.openDatabase(":memory:")
  const now = Date.now()
  seedProvider(db, [{ name: "mock-chat", alias: "fast" }, "plain", "org/inner"])
  const member = 1
  db.prepare("INSERT INTO members (id, username, name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)").run(member, "u", "u", "scrypt$x", "user", new Date().toISOString())
  const rec = (model, provider = "mock", endpoint = "chat") => USAGE.recordUsage(db, { ts: now, memberId: member, keyId: 1, provider, model, endpoint, status: "ok", stream: false, promptTokens: 1, completionTokens: 1, totalTokens: 10, durationMs: 5 })
  db.prepare("INSERT INTO api_keys (id, member_id, key_hash, key_hint, created_at) VALUES (?,?,?,?,?)").run(1, member, "hash", "…x", new Date().toISOString())
  rec("mock-chat"); rec("mock-chat"); rec("plain"); rec("org/inner"); rec("bge-m3", "", "embeddings")
  assert.equal(REPORT.usageTotals(db, { model: "fast" }).requests, 2, "别名过滤 ⇒ 反查真名对")
  assert.equal(REPORT.usageTotals(db, { model: "mock/mock-chat" }).requests, 2, "旧前缀形过滤 ⇒ 现口径回落（逐值对命中内部真名行——不反查别名）")
  assert.equal(REPORT.usageTotals(db, { model: "mock/plain" }).requests, 1, "未配别名 ⇒ 前缀形逐值对照常")
  assert.equal(REPORT.usageTotals(db, { model: "mock/org/inner" }).requests, 1, "余段可含斜杠（首斜杠切分）")
  assert.equal(REPORT.usageTotals(db, { model: "bge-m3" }).requests, 1, "裸名（未命中别名）⇒ provider = ''（嵌入命名空间）")
  assert.equal(REPORT.usageTotals(db, { model: "bge-m3", endpoint: "embeddings" }).requests, 1, "endpoint 在场 ⇒ 零切分零反查")
  assert.equal(REPORT.usageTotals(db, { model: "mock/mock-chat", endpoint: "embeddings" }).requests, 0, "嵌入面不切分（整串比较）")
  assert.equal(USAGE.queryUsage(db, { model: "fast" }).length, 2, "明细过滤同源")
})

test("D3 改别名 ⇒ 读面当即随动（老外标零命中 ∥ 无历史映射——零迁移）", () => {
  const db = DB.openDatabase(":memory:")
  const now = Date.now()
  seedProvider(db, [{ name: "mock-chat", alias: "fast" }])
  db.prepare("INSERT INTO members (id, username, name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)").run(1, "u", "u", "scrypt$x", "user", new Date().toISOString())
  db.prepare("INSERT INTO api_keys (id, member_id, key_hash, key_hint, created_at) VALUES (?,?,?,?,?)").run(1, 1, "hash", "…x", new Date().toISOString())
  USAGE.recordUsage(db, { ts: now, memberId: 1, keyId: 1, provider: "mock", model: "mock-chat", endpoint: "chat", status: "ok", stream: false, promptTokens: 1, completionTokens: 1, totalTokens: 7, durationMs: 1 })
  assert.equal(USAGE.queryUsage(db, {})[0].model, "fast", "别名在场 ⇒ 外标 = 别名")
  db.prepare("UPDATE providers SET models_json = ?").run(JSON.stringify([{ name: "mock-chat", alias: "quick" }]))
  assert.equal(USAGE.queryUsage(db, {})[0].model, "quick", "改别名 ⇒ 明细当即随动")
  assert.equal(USAGE.usageSummary(db, { now }).byModel[0].model, "quick", "summary 随动")
  assert.equal(REPORT.usageTotals(db, { model: "fast" }).requests, 0, "旧外标过滤零命中")
  assert.equal(REPORT.usageTotals(db, { model: "quick" }).requests, 1, "新外标过滤命中")
  assert.equal(sortedKeys(AGG.monthlyCountersByMember(db, { memberId: 1, now }).get(1))[0][0], "quick", "月表随动")
})

test("D4 零别名配置 ⇒ 零迁移回落 `provider/model`（v10 结构零动）", () => {
  const db = DB.openDatabase(":memory:")
  const now = Date.now()
  seedProvider(db, ["mock-chat"])
  db.prepare("INSERT INTO members (id, username, name, password_hash, role, created_at) VALUES (?,?,?,?,?,?)").run(1, "u", "u", "scrypt$x", "user", new Date().toISOString())
  db.prepare("INSERT INTO api_keys (id, member_id, key_hash, key_hint, created_at) VALUES (?,?,?,?,?)").run(1, 1, "hash", "…x", new Date().toISOString())
  USAGE.recordUsage(db, { ts: now, memberId: 1, keyId: 1, provider: "mock", model: "mock-chat", endpoint: "chat", status: "ok", stream: false, promptTokens: 1, completionTokens: 1, totalTokens: 7, durationMs: 1 })
  assert.equal(USAGE.queryUsage(db, {})[0].model, "mock/mock-chat", "无别名 ⇒ 外标回落前缀形（存量零迁移）")
  assert.equal(USAGE.usageSummary(db, { now }).byModel[0].model, "mock/mock-chat", "summary 同口径")
  assert.equal(DB.readVersion(db), 10, "结构版本保持 v10（零迁移——STORE §3）")
})

// ── E 界面面（AC-29①②③ ∥ #1151）──────────────────────────────────────────────

test("E1 i18n：+4 键两表在位（占位对位）∥ en 零 CJK ∥ `t()` 字面量 ⊆ 表键 ∥ 注释外零 CJK", () => {
  for (const key of ["admin.models.aliasLabel", "admin.models.aliasPh", "admin.models.aliasHint", "admin.models.ruleAlias"]) {
    assert.ok(key in ZH && key in EN, `两表缺新键：${key}`)
    assert.ok(String(ZH[key]).trim() !== "" && String(EN[key]).trim() !== "", `空值键：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 新键含 CJK：${key}`)
    const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  for (const name of ["views-models.mjs", "views-providers-modals.mjs", "views-system.mjs"]) {
    assert.equal(CJK.test(stripComments(readPublic(name))), false, `${name} 注释外含 CJK`) // 注释外零 CJK
  }
  const used = new Set()
  for (const name of ["views-models.mjs", "views-providers-modals.mjs"]) {
    for (const hit of stripComments(readPublic(name)).matchAll(/t\("([^"]+)"/g)) used.add(hit[1])
  }
  used.add("admin.models.aliasLabel")
  for (const key of used) assert.ok(key in ZH, `t() 字面量缺键（安全网 warn 面）：${key}`)
})

test("E2 派生两形（AC-29①）：`deriveModels` id = 外标 ∥ `modelsWithout`/`modelsWithAlias` 保形 ∥ `aliasDraftInvalid`", () => {
  const rows = MODELS.deriveModels([{ name: "p", models: ["m1", { name: "m2", alias: "fast" }, { name: "org/m3", alias: "trio" }] }])
  assert.deepEqual(rows.map((r) => [r.id, r.upstream]), [["fast", "m2"], ["p/m1", "m1"], ["trio", "org/m3"]], "id = 外标（别名 ⇒ 别名）∥ upstream = 真名")
  assert.equal(rows.every((r) => r.surface === "chat"), true, "零引擎行")
  assert.deepEqual(MODELS.deriveModels([{ name: "p", models: ["m1"] }]), [{ id: "p/m1", provider: "p", upstream: "m1", surface: "chat" }], "零别名 ⇒ 前缀形（零迁移）")
  const models = ["a", { name: "b", alias: "bee", extra: 1 }, { name: "c", alias: "cee" }]
  assert.deepEqual(MODELS.modelsWithout(models, "b"), ["a", { name: "c", alias: "cee" }], "停用减项按名匹配保形")
  assert.deepEqual(MODELS.modelsWithAlias(models, "c", "quick"), ["a", { name: "b", alias: "bee", extra: 1 }, { name: "c", alias: "quick" }], "别名改写保形（两形与别名不动）")
  assert.deepEqual(MODELS.modelsWithAlias(models, "b", null), ["a", "b", { name: "c", alias: "cee" }], "清空别名 ⇒ 回落字符串形")
  assert.deepEqual(MODELS.modelsWithAlias(["a"], "a", "a1"), [{ name: "a", alias: "a1" }], "字符串条目 ⇒ 升形")
  assert.deepEqual([MODELS.aliasDraftInvalid(""), MODELS.aliasDraftInvalid("ok"), MODELS.aliasDraftInvalid(" x"), MODELS.aliasDraftInvalid("x "), MODELS.aliasDraftInvalid("a/b")], [null, null, "admin.models.ruleAlias", "admin.models.ruleAlias", "admin.models.ruleAlias"], "别名草稿形判")
})

// ── 桩 DOM（`dom.mjs` 语义近似——承接 E3–E5）────────────────────────────────────

function fNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, textContent: "", className: "", value: "", placeholder: "",
    checked: false, disabled: false, hidden: false, maxlength: undefined, focused: false, open: false, parent: null,
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
    fire(type, event = {}) { const target = { preventDefault() {}, ...event }; return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target))) },
    showModal() { node.open = true },
    close() { node.open = false; for (const fn of node.listeners.close ?? []) fn({}) },
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
    else if (["value", "checked", "disabled", "hidden", "maxlength"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) { if (child === null || child === undefined || child === false) continue; node.append(child) }
  return node
}

const fFindAll = (root, pred, out = []) => { if (root !== null && typeof root === "object") { if (pred(root)) out.push(root); for (const child of root.children ?? []) fFindAll(child, pred, out) } return out }
const fFind = (root, pred) => fFindAll(root, pred)[0] ?? null
const fTick = () => new Promise((resolve) => setTimeout(resolve, 0))
/** 桩 `document`（`modal.mjs` 壳面需要：`body` + `classList` + `createElement` + `getElementById`）。 */
const stubDocument = () => ({ body: fNode("body"), createElement: (tag) => fNode(tag), getElementById: () => null })

/** 去注释（字符串态感知——E1「注释外零 CJK」用；块注释 ∥ 行注释两形）。 */
function stripComments(source) {
  let out = ""
  let i = 0
  let quote = null
  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]
    if (quote !== null) {
      out += ch
      if (ch === "\\") { out += next ?? ""; i += 2; continue }
      if (ch === quote) quote = null
      i += 1
      continue
    }
    if (ch === "/" && next === "/") { while (i < source.length && source[i] !== "\n") i += 1; continue }
    if (ch === "/" && next === "*") { i += 2; while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1; i += 2; continue }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; out += ch; i += 1; continue }
    out += ch
    i += 1
  }
  return out
}

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入 `calls`）。 */
function fCtx(routes = {}) {
  const calls = []
  const ctx = {
    h: fH,
    state: { system: null },
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    table: () => fNode("div"),
    fmtTs: (ts) => `ts:${ts}`,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    flash: (message) => calls.push(["flash", message]),
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    health: () => ({ label: ZH["health.ok"], body: { db: "ok", uptime: 1 }, checkedAt: 1 }),
    onHealth: () => {},
    dataShell: (mount, { head, area }) => { mount.append(head); mount.append(area) },
  }
  return { ctx, calls }
}
const patchesOf = (calls) => calls.filter(([method, path]) => method === "PATCH" && path.startsWith("/api/admin/providers/"))

test("E3 详情弹窗六组（G 别名——AC-29①）：保存仅别名变更随携 `models` 全量数组（保形）∥ 零变更不携 ∥ 非法别名就地提示不提交", async () => {
  globalThis.document = stubDocument()
  globalThis.window = { confirm: () => true }
  try {
    const entry = { id: 7, name: "mock", models: ["plain", { name: "real", alias: "fast", extra: "keep" }], settings: {} }
    const routes = {
      "PATCH /api/admin/providers/7": () => ({ ok: true }),
    }
    const { ctx, calls } = fCtx(routes)
    const row = { id: "fast", provider: "mock", upstream: "real", surface: "chat" }
    const modal = MODELS.openModelModal(ctx, { row, entry, reload: async () => {} })
    const text = fFindAll(modal.root, () => true).map((n) => n.textContent).join("|")
    for (const piece of [ZH["admin.models.configTitle"], ZH["admin.models.aliasLabel"], ZH["admin.models.aliasHint"], ZH["admin.models.upstream"], "fast", "real"]) {
      assert.ok(text.includes(piece), `弹窗缺：${piece}`)
    }
    const groups = fFindAll(modal.root, (n) => n.tag === "section" && n.className === "config-group")
    assert.equal(groups.length, 6, "配置六组 = A/C/F/G/D/E")
    assert.equal(groups[3].children[0].textContent, ZH["admin.models.aliasLabel"], "G 组位居 F 与 D 之间")
    const aliasInput = fFind(modal.root, (n) => n.tag === "input" && n.attrs["aria-label"] === ZH["admin.models.aliasLabel"])
    assert.ok(aliasInput !== null && aliasInput.value === "fast", "别名输入初值 = 现存别名")
    const saveBtn = fFind(modal.root, (n) => n.tag === "button" && n.textContent === ZH["common.save"])
    await saveBtn.fire("click") // 零变更（别名未动 + 数值全空）
    assert.deepEqual(patchesOf(calls)[0][2], { settings: { real: { rpm: null, tpm: null, costIn: null, costOut: null, quotaTokens: null, note: null } } }, "零别名变更 ⇒ 不携 `models`（键省略）")
    aliasInput.value = "quick"
    await saveBtn.fire("click")
    assert.deepEqual(patchesOf(calls)[1][2].models, ["plain", { name: "real", alias: "quick", extra: "keep" }], "仅别名变更 ⇒ 随携全量数组（其余条目保形）")
    aliasInput.value = " bad" // 首尾空白 ⇒ 形非法（名内空格 = 合法——形判只禁首尾）
    await saveBtn.fire("click")
    assert.equal(patchesOf(calls).length, 2, "非法别名 ⇒ 不提交（零新请求）")
    assert.equal(fFind(modal.root, (n) => n.textContent === ZH["admin.models.ruleAlias"])?.hidden ?? false, false, "就地提示 = ruleAlias（可见）")
    aliasInput.value = "bad name" // 名内空格合法 ⇒ 提交（反面）
    await saveBtn.fire("click")
    assert.equal(patchesOf(calls).length, 3, "名内空格 ⇒ 合法提交")
    assert.deepEqual(patchesOf(calls)[2][2].models, ["plain", { name: "real", alias: "bad name", extra: "keep" }], "再次改写保形同拍")
    // 停用径：`models` 减项保形
    const disableBtn = fFind(modal.root, (n) => n.tag === "button" && n.textContent === ZH["admin.models.disable"])
    await disableBtn.fire("click")
    assert.deepEqual(patchesOf(calls)[3][2].models, ["plain"], "停用减项按名匹配（他条目别名不丢）")
    modal.close?.()
  } finally { delete globalThis.document; delete globalThis.window }
})

test("E4 Provider 详情窗勾选保形（AC-29③）：`models` 提交存量对象条目不动 ∥ 退役注按名匹配", async () => {
  globalThis.document = stubDocument()
  try {
    const provider = { id: 3, name: "mock", baseURL: "https://up.example/v1", apiKey: "", models: ["plain", { name: "retired-one", alias: "old" }, { name: "real", alias: "fast" }], modelMeta: {}, settings: {}, proxy: false }
    const routes = {
      "POST /api/admin/providers/discover": () => ({ models: ["plain", "real", "extra"], modelMeta: {} }),
      "PATCH /api/admin/providers/3": () => ({ ok: true }),
    }
    const { ctx, calls } = fCtx(routes)
    const modal = PROVIDER_MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await fTick()
    const boxes = fFindAll(modal.root, (n) => n.tag === "input" && n.attrs.type === "checkbox")
    assert.equal(boxes.length, 5, "勾选框五枚 = 清除密钥 ∥ 走代理 ∥ 候选三枚（候选段居尾）")
    const candBoxes = boxes.slice(2)
    assert.deepEqual(candBoxes.map((b) => b.checked), [false, true, true], "现状勾选按名匹配（候选序：extra ∥ plain ∥ real——对象条目亦算）")
    assert.ok(fFind(modal.root, (n) => n.textContent === fillT(ZH["admin.providers.retiredNote"], { models: "retired-one" })) !== null, "退役注按名匹配（对象条目名入注）")
    candBoxes[0].checked = true
    await candBoxes[0].fire("change")
    const saveBtn = fFind(modal.root, (n) => n.tag === "button" && n.textContent === ZH["common.save"])
    await saveBtn.fire("click")
    assert.deepEqual(patchesOf(calls)[0][2].models, ["plain", { name: "retired-one", alias: "old" }, { name: "real", alias: "fast" }, "extra"], "存量条目原样携带（别名不丢）∥ 退役项恒保留 ∥ 新勾项字符串形")
  } finally { delete globalThis.document }
})

test("E5 向量卡「用法」行随段显隐（#1151——零新键）：缺段不渲染 ∥ 在场含模型名", async () => {
  globalThis.document = stubDocument()
  globalThis.location = { origin: "http://127.0.0.1:8791" }
  const usageText = (model) => I18N.t("vector.usage", { model })
  const cardOf = async (embedding) => {
    const routes = {
      "GET /api/admin/config": () => ({ config: { host: "127.0.0.1", port: 8787, db: "d.db", embedding } }),
      "POST /api/admin/embedding/test": () => ({ ok: true, dimensions: 3, ms: 5 }),
    }
    const { ctx } = fCtx(routes)
    const mount = fNode("section")
    SYSTEM_VIEW.renderSystem(ctx, mount)
    await fTick()
    const card = fFindAll(mount, (n) => n.tag === "section" && n.className === "card")
      .find((c) => c.children.some((child) => child && child.tag === "h3" && child.textContent === ZH["vector.title"]))
    assert.ok(card, "向量卡在册")
    return card
  }
  try {
    const missing = await cardOf(null)
    assert.equal(fFindAll(missing, (n) => typeof n.textContent === "string" && n.textContent.includes("填为")).length, 0, "缺段 ⇒ 「用法」行不渲染（零节点——#1151 字面）")
    const present = await cardOf({ baseURL: "http://127.0.0.1:9/v1", model: "bge-m3", apiKey: "" })
    const row = fFind(present, (n) => n.tag === "p" && n.textContent === usageText("bge-m3"))
    assert.ok(row !== null && row.hidden === false, "在场 ⇒ 「用法」行渲染（含模型名）")
  } finally { delete globalThis.document; delete globalThis.location }
})

// ── F 嵌入面零涉 ∥ #1152 ∥ import 扫描 ─────────────────────────────────────────

test("F1 `/api/system.embedding.model` 判据单源 = 运行时 accessor（#1152）：同源等价 ∥ 缺段 ⇒ null ∥ 替身换箱随动", async () => {
  const db = DB.openDatabase(":memory:")
  await makeAdmin(db)
  const config = await validatedConfig("http://127.0.0.1:9/v1")
  const app = await startServer({ db, config })
  try {
    const { cookie } = await login(app.base, "admin", PASSWORD)
    const sys = await get(app.base, "/api/system", { cookie })
    assert.equal(sys.json.embedding.model, null, "无嵌入段 ⇒ null（↔ 派发面 engineModel() 同判）")
    assert.equal(sys.json.embedding.model, app.runtime.get().engineModel(), "报值 = 运行时 accessor（同源单判）")
  } finally { await app.close(); db.close() }
  // 替身换箱（注入点同源等价——配置真值 ∥ accessor 两源同判）
  const db2 = DB.openDatabase(":memory:")
  await makeAdmin(db2)
  const app2 = await startServer({ db: db2, config: await validatedConfig("http://127.0.0.1:9/v1"), systemRuntime: { get: () => ({ engineModel: () => "sub" }) } })
  try {
    const { cookie } = await login(app2.base, "admin", PASSWORD)
    assert.equal((await get(app2.base, "/api/system", { cookie })).json.embedding.model, "sub", "装箱在 ⇒ 以箱为准（accessor 单源）")
  } finally { await app2.close(); db2.close() }
})

test("F2 嵌入面零涉（AC-29⑤）：引擎名单独命名空间 ∥ 别名不与之混面 ∥ 清单零引擎行", () => {
  const config = CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "mock", baseURL: "https://up.example/v1", apiKey: "", models: ["mock-chat", { name: "real", alias: "bge-m3" }] }],
    embedding: { baseURL: "https://embed.example/v1", model: "bge-m3" },
  })
  const registry = PROVIDERS.createProviderRegistry(config.providers, { env: {}, engineModel: config.embedding.model })
  assert.equal(registry.engineModel(), "bge-m3", "引擎模型名 = 独立 accessor（配置真值）")
  assert.deepEqual(modelIds(PROVIDERS.modelList(registry)), ["mock/mock-chat", "bge-m3"], "清单 = chat 面外标（条目序；引擎模型不入清单——KD-SV-58 不回归）")
  assert.equal(registry.dispatch("bge-m3").provider.name, "mock", "chat 面裸名 = 别名形（与引擎名同字符串互不混面——两命名空间）")
  assert.equal(registry.dispatch("mock/real").miss.body.error.message.includes("bge-m3"), true, "旧前缀名 404 提示别名（不涉引擎面）")
})

test("F3 import 扫描：本批改动面零第三方依赖（`node:` 前缀 ∥ 相对路径——红线）", () => {
  const files = [
    "src/gateway/providers.mjs", "src/gateway/provider-admin.mjs", "src/gateway/system.mjs", "src/gateway/forward.mjs",
    "src/ops/config.mjs", "src/metering/usage.mjs", "src/metering/report.mjs", "src/metering/aggregates.mjs",
    "src/accounts/members.mjs",
  ]
  for (const rel of files) {
    const source = readFileSync(join(ROOT, "thincoder-server", rel), "utf8")
    for (const hit of source.matchAll(/^import .*? from "([^"]+)"/gm)) {
      assert.ok(hit[1].startsWith("node:") || hit[1].startsWith("."), `${rel} 第三方 import：${hit[1]}`)
    }
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), [], "dependencies 保持空")
})

/** 占位替换（与 `i18n.mjs` `fill` 同式——仅本件断言用）。 */
function fillT(text, params) {
  return String(text).replace(/\{(\w+)\}/g, (all, key) => (params[key] === undefined ? all : String(params[key])))
}
