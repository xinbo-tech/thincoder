/**
 * 2026-10-09-provider-default-model-purge-server.test.mjs — thincoder-server 批内单测件（「渠道默认模型清除」批 ·
 * 服务端舱 A6；名随批档 · 随批留存）。运行（自 `thincoder/` 仓根）：
 * `node --test docs/batches/2026-10-09-provider-default-model-purge-server.test.mjs`
 *
 * 射程（A6——批档 `docs/batches/2026-10-09-provider-default-model-purge.md` §2.1 A6 ∥ ops/OPS.md §1 预设形
 * ∥ §7 AC-9 ∥ §9 N12 ∥ gateway/API.md §2.2）：
 *   ① 表键面：`SERVER_PRESETS` 21 键逐条 `"model" in preset === false` ∥ 键集 = `["baseURL"]`
 *   ② 展开缺省：`expandProviderEntry` 全 21 预设 ⇒ `models === []`（零缺省）∥ `name` = 预设名 ∥ `baseURL` = 表值
 *   ③ 覆盖照旧：条目自备 `name`/`baseURL`/`models` 显式在场者胜（含显式空数组照收）
 *   ④ 勾选后 N12 新形：空清单 ⇒ `/v1/models` 零 `deepseek/` 项；条目自备 `models`（= 「模型发现」勾选后形）
 *      ⇒ 清单含 `deepseek/<选中模型>`
 *   ⑤ 端点半形状：`GET /api/admin/providers/presets`（admin）⇒ 21 家 ∥ 逐条零 `model` 键 ∧ `models === []`
 *      （在位——控制台空表依赖）；响应体零 `"model":` 字面；未会话 ⇒ 401
 * 上游 mock 不涉（本舱面零转发）；网关 = 进程内装配（沿 -server-presets 件形）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
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
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")

const ENV = { TC_TEST_KEY: "sk-test-value" }
const EMBEDDING = { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" }
const PASSWORD = "password-123"

/** 校验后配置（embedding 指死址——本舱面零上游调用；providers 种子可给）。 */
const configWith = ({ providers = [] } = {}) => CONFIG.validateConfig({ host: "127.0.0.1", providers, embedding: EMBEDDING })

/** 组成员夹具（`/v1/*` 面 = 团队 key 门）。 */
function seedMember(db, username = "alice") {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES (?, ?, 'scrypt$fixture', ?)")
    .run(username, username, new Date().toISOString())
  return Number(info.lastInsertRowid)
}

/** 进程内网关（OpenAI 面注册行——清单/派发读运行时）。 */
async function startGateway({ db, config, env = ENV }) {
  const log = { info() {}, warn() {}, error() {} }
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config, log, env })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 进程内网关 + provider 管理面（同一运行时实例）+ 账号面（端点腿：admin 会话）。 */
async function startApp({ db, config, env = ENV }) {
  const log = { info() {}, warn() {}, error() {} }
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config, log, env }) // 装配期引导运行时（种子 → 构建）
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime, log, env })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** HTTP 调用（JSON 头缺省；`cookie`/`key` 注入）。 */
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

const modelIds = async (base, key) => (await (await fetch(`${base}/v1/models`, { headers: { authorization: `Bearer ${key}` } })).json()).data.map((m) => m.id)

// ── ① 表键面 ────────────────────────────────────────────────────────────────
test("A6① 预设表键面：21 键 ∥ 逐条零 model 键 ∥ 键集 = [baseURL]（2026-10-09 清除批）", () => {
  const keys = Object.keys(PRESETS.SERVER_PRESETS)
  assert.equal(keys.length, 21, `起步 21 家（ops/OPS.md §1 覆盖面）：${keys.length}`)
  for (const key of keys) {
    const preset = PRESETS.SERVER_PRESETS[key]
    assert.ok(!("model" in preset), `${key}：残余单值 model 键`)
    assert.deepEqual(Object.keys(preset).sort(), ["baseURL"], `${key}：键集须为 [baseURL]`)
    assert.ok(typeof preset.baseURL === "string" && /^https?:\/\//.test(preset.baseURL), `${key}：baseURL 须为 http(s) 串`)
  }
})

// ── ② 展开缺省（零缺省 ⇒ 空清单）────────────────────────────────────────────
test("A6② 展开缺省：全 21 预设 ⇒ models = 空清单 ∥ name = 预设名 ∥ baseURL = 表值 ∥ 载入面同判", () => {
  for (const key of Object.keys(PRESETS.SERVER_PRESETS)) {
    const bare = PRESETS.expandProviderEntry({ preset: key, apiKey: "env:X" })
    assert.deepEqual(bare, { name: key, baseURL: PRESETS.SERVER_PRESETS[key].baseURL, apiKey: "env:X", models: [] }, key)
    assert.ok(!("model" in bare), `${key}：展开形残余 model 键`)
  }
  const config = configWith({ providers: [{ preset: "deepseek", apiKey: "env:TC_TEST_KEY" }] }) // 单源校验走同一展开
  assert.deepEqual(config.providers[0].models, [])
})

// ── ③ 覆盖照旧（显式在场者胜）───────────────────────────────────────────────
test("A6③ 覆盖照旧：条目自备 name/baseURL/models 显式在场者胜 ∥ 显式空数组照收", () => {
  const over = PRESETS.expandProviderEntry({ preset: "qwen", name: "bailian", baseURL: "http://10.0.0.9:8000/v1", models: ["m1", "m2"], apiKey: "k" })
  assert.deepEqual(over, { name: "bailian", baseURL: "http://10.0.0.9:8000/v1", apiKey: "k", models: ["m1", "m2"] })
  assert.deepEqual(PRESETS.expandProviderEntry({ preset: "qwen", models: [] }).models, []) // 显式空数组（勾选前形）——不被缺省吞
  const config = configWith({ providers: [{ preset: "qwen", models: ["qwen3.7-max"] }] })
  assert.deepEqual(config.providers[0].models, ["qwen3.7-max"])
})

// ── ④ N12 新形：空清单 ∥ 勾选后含选中模型 ───────────────────────────────────
test("A6④ N12 新形：空清单 ⇒ /v1/models 零 deepseek/ 项 ∥ 勾选后（条目自备 models）⇒ 含 deepseek/<选中模型>", async () => {
  const picked = "deepseek-chat" // 「模型发现」勾选所得（预设表零 model 键——无缺省可取）
  const bareDb = DB.openDatabase(":memory:")
  const bare = await startGateway({ db: bareDb, config: configWith({ providers: [{ preset: "deepseek", apiKey: "env:TC_TEST_KEY" }] }) })
  try {
    const key = KEYS.issueKey(bareDb, seedMember(bareDb)).plain
    const ids = await modelIds(bare.base, key)
    assert.ok(!ids.some((id) => id.startsWith("deepseek/")), `空清单应零 deepseek 项：${JSON.stringify(ids)}`)
  } finally { await bare.close(); bareDb.close() }

  const pickedDb = DB.openDatabase(":memory:")
  const selected = await startGateway({ db: pickedDb, config: configWith({ providers: [{ preset: "deepseek", apiKey: "env:TC_TEST_KEY", models: [picked] }] }) })
  try {
    const key = KEYS.issueKey(pickedDb, seedMember(pickedDb)).plain
    const ids = await modelIds(selected.base, key)
    assert.ok(ids.includes(`deepseek/${picked}`), `勾选后清单应含 deepseek/${picked}：${JSON.stringify(ids)}`)
  } finally { await selected.close(); pickedDb.close() }
})

// ── ⑤ 端点：零 model 键 ∧ models 空清单（在位）──────────────────────────────
test("A6⑤ 端点：GET /api/admin/providers/presets（admin）⇒ 21 家 ∥ 逐条零 model 键 ∧ models = 空清单 ∥ 零 \"model\": 字面", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  const app = await startApp({ db, config: configWith() })
  try {
    assert.equal((await get(app.base, "/api/admin/providers/presets")).status, 401) // 同族判权（只读同门）
    const admin = await login(app.base, "admin")
    const res = await get(app.base, "/api/admin/providers/presets", { cookie: admin.cookie })
    assert.equal(res.status, 200)
    assert.equal(res.json.presets.length, 21)
    for (const preset of res.json.presets) {
      assert.ok(!("model" in preset), `${preset.preset}：端点响应残余 model 键`)
      assert.deepEqual(preset.models, [], `${preset.preset}：models 空清单（在位——控制台空表依赖）`)
      assert.ok(preset.preset && preset.name && preset.baseURL, JSON.stringify(preset))
    }
    assert.ok(!res.text.includes('"model":'), "响应体零 \"model\": 字面（\"models\":[] 不误报）")
    const deepseek = res.json.presets.find((item) => item.preset === "deepseek")
    assert.equal(deepseek.name, "deepseek")
    assert.equal(deepseek.baseURL, "https://api.deepseek.com")
  } finally { await app.close(); db.close() }
})
