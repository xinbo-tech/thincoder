/**
 * 2026-10-07-quota-v2-member-models.test.mjs — thincoder-server 批内单测件（配额 v2 · 成员模型面批·A 棒（后端）+ B 棒（前端）；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存；B 棒（前端）延长本件——同件两棒顺写）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-quota-v2-member-models.test.mjs`
 *
 * 射程（判据源 = `accounts/ACCOUNTS.md` §2.2/§3/§5 AC-23 ∥ `gateway/API.md` §2/§2.1/§5 AC-23 ∥
 * `metering/METERING.md` §2.3/§2.5/§4 AC-23 ∥ `store/STORE.md` §2 v6 段/§3 ∥
 * `webui/WEBUI.md` §2.2（KD-SV-44）∥ §2.4②③ ∥ §6 AC-23 两行；腿 ↔ 判据对照在括号）：
 *   ① v6 迁移（STORE §3）：空库直落 8 ∥ v5 库自动升 8（存量行得常量默认 `'{}'`——默认全可用）∥ 幂等
 *      ∥ 新列常量默认在场（`pragma_table_info` dflt = `'{}'`）
 *   ② 禁用写/读面（ACCOUNTS §3 ∥ AC-23——真 HTTP）：`POST /api/members/:id/model-disables` 键级合并
 *      （`true` = 禁 ∥ `null` = 删键 ∥ 未出现键不动）⇒ 200 `{id, modelDisables}` ∥ 400（键形 ∥ 值——库零变）
 *      ∥ 404 ∥ 403/401 ∥ `/api/me` ∥ `/api/members` 行含 `modelUsage`（map——键 = 外标）∥ `modelDisables`（两路同值）
 *      ∥ 变更不入审计（九型零增）
 *   ③ 执行面（AC-23 ∥ B19——真 HTTP）：被禁 ⇒ 404 `model_not_found` + 消息含「已对该成员禁用」+ 零用量行
 *      ∥ `/v1/models` 从列 → 滤除 → 恢复回列 ∥ 他成员不受累 ∥ 禁用先于配额（被禁 ∧ 超额 ⇒ 404 非 429）
 *      ∥ 即时生效（写后下一请求）∥ 嵌入面零涉 ∥ 零新码
 *   ④ 计数读面（METERING §2.3/§4 AC-23）：`monthlyCountersByMember` 逐值 = 记账归并（自然月）∥ 外标回拼无损
 *      （`model` 带斜杠 ∥ 嵌入行单段）∥ 两形（`memberId` 给定 ∥ 全员）逐值相等
 *   ⑤ #1001①：`--fix` = `BEGIN IMMEDIATE` 先行 + 事务内重算快照（探针：全部读/写皆在事务内）∥ 覆写后复查零漂
 *      ∥ 报告路径（无 `--fix`）零事务
 *   ⑥ #1001③：`keyUsageStats` 窗沿 = 近 30 个本地日（今日起回溯——与报表窗同构；界日 -29 含 ∥ -30 不含）
 *   ⑦ #1001②：键形助手两 merge 共用（`model-quotas` ∥ `model-disables` 裸名 ∥ 空段 ⇒ 400 库零变）
 *   ⑧ 门禁清单：`prepublishOnly` 含本批件（二十八件——结构轮批件入链）∥ 清单目标在盘
 *   ⑨ i18n（WEBUI §2.2 KD-SV-44 ∥ §6 AC-23 续；#994/#988）：死键 2 枚零残留 ∥ 新 2 键两表 ∥ `.one` 7 枚仅 en ∥
 *      基键集双向相等（除自称名族 + `.one` 族）∥ 复数取形直测（en count=1 ⇒ 单形 ∥ 2 ⇒ 基 ∥ zh 不变）
 *   ⑩ 成员弹窗查看态（WEBUI §2.4② ∥ AC-23①③；#1002/#1004）：模型表直显 5 列（`deriveModels` 序）∥ 逐行已用（缺 ⇒ 0）∥
 *      禁用勾选即时写（在飞禁用 ∥ 失败回弹 + 窗内状态行 ∥ 成功静默）∥ 离表注行只数覆盖键 ∥ 两态共用取数（单次）
 *   ⑪ 服务模型页配额列 ∥ 审计页单标题（WEBUI §2.4③/#1003 ∥ #995）：三态（值 ∥「不限」 ∥ 嵌入「—」）∥
 *      保存后列表刷新随动（与 F 组单源）∥ `audit.title` 单点引用
 *   ⑫ 静态面（§6 AC-23 续）：档目 29 ∥ 30（结构轮后）∥ 十四档行宽 ≤300 ∥ `:root` 38 ∥ 悬停清单七条（AC-19 canon 不破）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")
const REPORT = await load("thincoder-server/src/metering/report.mjs")
const AGG = await load("thincoder-server/src/metering/aggregates.mjs")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const { ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const { EN } = await load("thincoder-server/public/i18n-en.mjs")
const I18N = await load("thincoder-server/public/i18n.mjs")
const ADMIN = await load("thincoder-server/public/views-admin.mjs")
const MODELS = await load("thincoder-server/public/views-models.mjs")
const AUDIT = await load("thincoder-server/public/views-audit.mjs")

const PASSWORD = "password-123"
const DISABLE_URL = (id) => `/api/members/${id}/model-disables`
const QUOTA_URL = (id) => `/api/members/${id}/model-quotas`

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tc-quota-v2-${tag}-`))
}
async function startServer({ db, config }) {
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) }
}
async function call(base, method, path, { body, cookie, headers = {} } = {}) {
  const requestHeaders = { "content-type": "application/json", ...headers }
  if (cookie) requestHeaders.cookie = cookie
  const res = await fetch(base + path, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON 体：以 text 判 */
  }
  return { status: res.status, json, text, setCookies: res.headers.getSetCookie() }
}
const post = (base, path, opts) => call(base, "POST", path, opts)
const get = (base, path, opts) => call(base, "GET", path, opts)
async function login(base, username, password) {
  const res = await post(base, "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}
async function makeMember(db, { username = "alice", role = "user", password = PASSWORD } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, name: username, role, password })
  return member
}
/** mock 上游（非流式 chat ∥ embeddings 同面）：`{ total_tokens }` 可注。 */
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
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return { base: `http://127.0.0.1:${server.address().port}/v1`, requests, close: () => new Promise((resolve) => server.close(resolve)) }
}
/** 配置夹具（合法基线——mock 上游指入；providers 经校验单源）。 */
function makeConfig(baseURL) {
  return JSON.parse(`{"host":"127.0.0.1","providers":[{"name":"mock","baseURL":"${baseURL}","apiKey":"sk-upstream","models":["mock-chat"]}],"embedding":{"baseURL":"${baseURL}","model":"bge-m3"}}`)
}
async function validatedConfig(baseURL) {
  const CONFIG = await load("thincoder-server/src/ops/config.mjs")
  return CONFIG.validateConfig(makeConfig(baseURL))
}
/** 探针 db（包装真库——记录 exec/prepare 次序与「prepare 时是否在事务内」；转发其它成员面）。 */
function probeDb(db) {
  const calls = []
  const prepares = []
  let inTx = false
  return {
    proxy: {
      exec: (sql) => {
        if (/^BEGIN IMMEDIATE\b/.test(sql)) inTx = true
        else if (/^(COMMIT|ROLLBACK)\b/.test(sql)) inTx = false
        calls.push(`exec:${sql}`)
        return db.exec(sql)
      },
      prepare: (sql) => {
        prepares.push({ sql: sql.replace(/\s+/g, " "), inTx })
        return db.prepare(sql)
      },
    },
    calls,
    prepares,
  }
}

// ── ① v6 迁移（STORE §3——判据：空库 8 ∥ v5 升 8 ∥ 幂等 ∥ 常量默认在场）────────────────

test("① v6 迁移：空库直落 8 ∥ v5 库自动升 8（存量行得 '{}'）∥ 幂等 ∥ 新列常量默认在场", () => {
  const fresh = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [8, 8])
    const column = fresh.prepare("PRAGMA table_info(members)").all().find((item) => item.name === "model_disabled_json")
    assert.ok(column, "members.model_disabled_json 缺位")
    assert.deepEqual([column.type, column.notnull, column.dflt_value], ["TEXT", 1, "'{}'"]) // 常量默认 = '{}'（默认全可用）
  } finally {
    fresh.close()
  }

  const dir = tmpDir("migrate")
  const file = join(dir, "gateway.db")
  try {
    const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 5) }) // v5 旧库
    assert.equal(DB.readVersion(legacy), 5)
    legacy.exec("INSERT INTO members (username, name, password_hash, model_quotas_json, created_at) VALUES ('old', 'old', 'scrypt$fixture', '{\"mock/m\":1}', '2026-10-07')")
    legacy.close()
    const db = DB.openDatabase(file) // 启动自动升
    try {
      assert.equal(DB.readVersion(db), 8)
      const row = db.prepare("SELECT model_quotas_json, model_disabled_json FROM members WHERE username = 'old'").get()
      assert.deepEqual([row.model_quotas_json, row.model_disabled_json], ['{"mock/m":1}', "{}"], "存量行即刻得 '{}'——默认全可用")
      // 幂等：再跑迁移链 ⇒ 版本不变 ∥ 存量值不动
      assert.equal(DB.migrate(db), 8)
      assert.equal(db.prepare("SELECT model_disabled_json FROM members WHERE username = 'old'").get().model_disabled_json, "{}")
    } finally {
      db.close()
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ② 禁用写/读面（ACCOUNTS §3 ∥ AC-23——真 HTTP）────────────────────────────

test("② 禁用写/读面：键级合并 200 ∥ 400（键形/值——库零变）∥ 404 ∥ 403/401 ∥ 两路行含 modelUsage/modelDisables ∥ 审计零增", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(db)
    const key = KEYS.issueKey(db, alice.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const aliceSession = await login(app.base, "alice", PASSWORD)
    const auditBefore = db.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n // 登录两笔已在账（基线）
    // 记账两笔（chat 14 ∥ 嵌入 7）——读面 `modelUsage` 数据源
    USAGE.recordUsage(db, { memberId: alice.id, keyId: key.id, endpoint: "chat", provider: "mock", model: "mock-chat", status: "ok", totalTokens: 7, durationMs: 1 })
    USAGE.recordUsage(db, { memberId: alice.id, keyId: key.id, endpoint: "chat", provider: "mock", model: "mock-chat", status: "ok", totalTokens: 7, durationMs: 1 })
    USAGE.recordUsage(db, { memberId: alice.id, keyId: key.id, endpoint: "embeddings", provider: "", model: "bge-m3", status: "ok", totalTokens: 7, durationMs: 1 })
    // 判权三态：user ⇒ 403 ∥ 无会话 ⇒ 401（服务端判）
    assert.deepEqual(
      [(await post(app.base, DISABLE_URL(alice.id), { cookie: aliceSession.cookie, body: { disables: {} } })).status, (await post(app.base, DISABLE_URL(alice.id), { body: { disables: {} } })).status],
      [403, 401],
    )
    // 键级合并：true = 禁 ⇒ 追加键不动前键 ⇒ null = 删键；返回 `{ id, modelDisables }`
    assert.deepEqual((await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": true } } })).json, { id: alice.id, modelDisables: { "mock/mock-chat": true } })
    const added = await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "prov/other": true } } })
    assert.deepEqual(added.json.modelDisables, { "mock/mock-chat": true, "prov/other": true })
    const removed = await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": null } } }) // null = 删键（未出现键不动）
    assert.deepEqual(removed.json.modelDisables, { "prov/other": true })
    // 400：键形四例 ∥ 值非 true/null（B27）——库零变
    const before = db.prepare("SELECT model_disabled_json FROM members WHERE id = ?").get(alice.id).model_disabled_json
    for (const bad of [{ "m": true }, { "/m": true }, { "p/": true }, { "": true }]) {
      const res = await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: bad } })
      assert.deepEqual([res.status, res.json.error.code], [400, "invalid_request_error"], JSON.stringify(bad))
    }
    for (const bad of [{ "mock/mock-chat": false }, { "mock/mock-chat": 0 }, { "mock/mock-chat": "x" }]) {
      const res = await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: bad } })
      assert.deepEqual([res.status, res.json.error.code], [400, "invalid_request_error"], JSON.stringify(bad))
    }
    assert.equal((await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: {} })).status, 400) // 缺 disables
    assert.equal(db.prepare("SELECT model_disabled_json FROM members WHERE id = ?").get(alice.id).model_disabled_json, before, "400 ⇒ 库零变")
    // 404：成员不存在（E22）
    assert.deepEqual([(await post(app.base, DISABLE_URL(9999), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": true } } })).status], [404])
    // 读面两路同值：`/api/me` ∥ `/api/members` 行含 modelUsage（map——键 = 外标）∥ modelDisables
    const me = (await get(app.base, "/api/me", { cookie: aliceSession.cookie })).json
    const listed = (await get(app.base, "/api/members", { cookie: adminSession.cookie })).json.members.find((member) => member.username === "alice")
    assert.deepEqual(me.modelUsage, { "mock/mock-chat": 14, "bge-m3": 7 })
    assert.deepEqual(me.modelDisables, { "prov/other": true })
    assert.deepEqual(
      [listed.modelUsage, listed.modelDisables, listed.usedTokens],
      [me.modelUsage, me.modelDisables, me.usedTokens],
      "两路同行（单源 = memberView）",
    )
    assert.equal(me.usedTokens, 21) // 本月累计（含嵌入——现口径保持）
    // 变更不入审计（九型零增——ACCOUNTS §2.1 边界）
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n, auditBefore, "禁用集变更零审计行")
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ③ 执行面（AC-23 ∥ B19——真 HTTP）─────────────────────────────────────────

test("③ 执行面：被禁 ⇒ 404 + 消息明示 + 零用量行 ∥ 列表滤除/恢复回列 ∥ 他成员不受累 ∥ 禁用先于配额 ∥ 嵌入零涉", async () => {
  const mock = await startMockUpstream({ totalTokens: 7 })
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(db)
    const bob = await makeMember(db, { username: "bob" })
    const aliceKey = KEYS.issueKey(db, alice.id)
    const bobKey = KEYS.issueKey(db, bob.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const chat = (plain, model = "mock/mock-chat") => post(app.base, "/v1/chat/completions", { headers: { authorization: `Bearer ${plain}` }, body: { model, messages: [] } })
    const models = async (plain) => (await get(app.base, "/v1/models", { headers: { authorization: `Bearer ${plain}` } })).json.data.map((item) => item.id)
    const usageRows = () => db.prepare("SELECT COUNT(*) AS n FROM usage").get().n
    // 基线：列表含（未禁）∥ 一次 200（记账一行）
    assert.ok((await models(aliceKey.plain)).includes("mock/mock-chat"))
    assert.equal((await chat(aliceKey.plain)).status, 200)
    const rowsAfterOk = usageRows()
    // 禁用 ⇒ 即时生效：404 + 消息含「已对该成员禁用」+ 零用量行 + 不转发（mock 零增）
    assert.deepEqual((await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": true } } })).json.modelDisables, { "mock/mock-chat": true })
    const denied = await chat(aliceKey.plain)
    assert.deepEqual([denied.status, denied.json.error.code, denied.json.error.type], [404, "model_not_found", "invalid_request_error"]) // 零新码
    assert.match(denied.json.error.message, /已对该成员禁用/)
    assert.deepEqual([usageRows(), mock.requests.length], [rowsAfterOk, 1], "准入前拒打——零用量行、零转发")
    // 列表随动滤除（禁后不含 ∥ 他成员含 ∥ 嵌入引擎模型照列）
    assert.deepEqual((await models(aliceKey.plain)).includes("mock/mock-chat"), false)
    assert.ok((await models(aliceKey.plain)).includes("bge-m3"))
    assert.ok((await models(bobKey.plain)).includes("mock/mock-chat"), "他成员不受累")
    assert.equal((await chat(bobKey.plain)).status, 200)
    // 嵌入面零涉：被禁成员照常嵌入（禁用只读 chat 外标）
    assert.equal((await post(app.base, "/v1/embeddings", { headers: { authorization: `Bearer ${aliceKey.plain}` }, body: { model: "bge-m3", input: "hi" } })).status, 200)
    // 恢复（null 删键）⇒ 下一请求即通 ∥ 列表回列（B19/N30——即时生效）
    assert.deepEqual((await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": null } } })).json.modelDisables, {})
    assert.equal((await chat(aliceKey.plain)).status, 200)
    assert.ok((await models(aliceKey.plain)).includes("mock/mock-chat"))
    // 禁用先于配额：覆盖额度 0 ⇒ 429；被禁 ⇒ 404（非 429）；恢复禁用 ⇒ 429（配额面零变）
    assert.deepEqual((await post(app.base, QUOTA_URL(alice.id), { cookie: adminSession.cookie, body: { quotas: { "mock/mock-chat": 0 } } })).json.modelQuotas, { "mock/mock-chat": 0 })
    assert.deepEqual([(await chat(aliceKey.plain)).status, (await chat(aliceKey.plain)).json.error.code], [429, "quota_exceeded"])
    await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": true } } })
    assert.deepEqual([(await chat(aliceKey.plain)).status, (await chat(aliceKey.plain)).json.error.code], [404, "model_not_found"])
    await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { "mock/mock-chat": null } } })
    assert.equal((await chat(aliceKey.plain)).status, 429)
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ④ 计数读面（METERING §2.3 ∥ AC-23——monthlyCountersByMember）──────────────

test("④ 计数读面：monthlyCountersByMember 逐值 = 记账归并（自然月）∥ 外标回拼无损 ∥ 两形逐值相等", () => {
  const db = DB.openDatabase(":memory:")
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('alice', 'alice', 'h', 't'), ('bob', 'bob', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'ka', 'sk-tc-a…a', 't'), (2, 'kb', 'sk-tc-b…b', 't')")
    const now = new Date(2026, 9, 15, 12, 0, 0).getTime() // 固定基准（本地正午中点日——消月界假红）
    const prevMonth = new Date(2026, 8, 15, 12, 0, 0).getTime()
    const row = (over) => ({ ts: now, memberId: 1, keyId: 1, endpoint: "chat", provider: "prov", model: "a", status: "ok", totalTokens: 10, durationMs: 1, ...over })
    USAGE.recordUsage(db, row({}))
    USAGE.recordUsage(db, row({ ts: now + 1000, totalTokens: 5 }))
    USAGE.recordUsage(db, row({ ts: now + 2000, provider: "meta", model: "inner/llama", totalTokens: 3 })) // model 带斜杠（回拼无损）
    USAGE.recordUsage(db, row({ ts: now + 3000, endpoint: "embeddings", provider: "", model: "bge-m3", totalTokens: 7 })) // 嵌入行单段
    USAGE.recordUsage(db, row({ ts: now + 4000, provider: "meta", model: "inner/llama", status: "error", totalTokens: null })) // NULL token ⇒ 计 0
    USAGE.recordUsage(db, row({ ts: prevMonth, memberId: 2, keyId: 2, provider: "prov", model: "a", totalTokens: 99 })) // 上月——不计
    const all = AGG.monthlyCountersByMember(db, { now })
    assert.deepEqual(all.get(1), { "prov/a": 15, "meta/inner/llama": 3, "bge-m3": 7 }) // 逐值 = 记账归并（自然月键）
    assert.equal(all.get(2), undefined, "上月行不计（月翻滚零逻辑）")
    const point = AGG.monthlyCountersByMember(db, { memberId: 1, now })
    assert.deepEqual(point.get(1), all.get(1), "两形逐值相等（memberId 给定 ∥ 全员）")
    assert.deepEqual(AGG.monthlyCountersByMember(db, { memberId: 2, now }).get(2), undefined, "他成员当月无行不在图内")
    // 与点查同源同窗（配额检查键）——同一 `quota_counters` 月键
    assert.equal(all.get(1)["prov/a"], AGG.quotaCounterTokens(db, { memberId: 1, provider: "prov", model: "a", now }))
    assert.equal(AGG.quotaCounterTokens(db, { memberId: 2, provider: "prov", model: "a", now }), 0, "上月读数不串新月")
  } finally {
    db.close()
  }
})

// ── ⑤ #1001①：`--fix` 事务合围（BEGIN IMMEDIATE 先行 ∥ 读快照与覆写同事务）────

test("⑤ #1001①：`--fix` = BEGIN IMMEDIATE 先行 + 事务内重算快照 ∥ 覆写后复查零漂 ∥ 报告路径零事务", () => {
  const db = DB.openDatabase(":memory:")
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('alice', 'alice', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'k', 'sk-tc-a…a', 't')")
    const day = new Date(2026, 9, 15, 12, 0, 0).getTime()
    USAGE.recordUsage(db, { ts: day, memberId: 1, keyId: 1, endpoint: "chat", provider: "mock", model: "m", status: "ok", promptTokens: 1, completionTokens: 2, totalTokens: 3, durationMs: 4 })
    USAGE.recordUsage(db, { ts: day + 1000, memberId: 1, keyId: 1, endpoint: "chat", provider: "mock", model: "m", status: "error", durationMs: 1 })
    db.prepare("UPDATE usage_daily SET total_tokens = total_tokens + 5").run() // 注入漂移（日表面）
    // 报告路径（无 --fix）：零事务（纯读——零改）
    const reportProbe = probeDb(db)
    const reported = AGG.reconcileUsage(reportProbe.proxy, { month: "2026-10" })
    assert.equal(reported.daily.drifted.length, 1)
    assert.equal(reportProbe.calls.some((line) => /^exec:BEGIN|^exec:COMMIT|^exec:ROLLBACK/.test(line)), false, "报告路径零事务")
    // --fix 路径：BEGIN IMMEDIATE 先行 ∥ 全部读/写（含重算快照 SQL）皆在事务内 ∥ COMMIT 收尾
    const fixProbe = probeDb(db)
    const fixed = AGG.reconcileUsage(fixProbe.proxy, { month: "2026-10", fix: true })
    assert.equal(fixProbe.calls[0], "exec:BEGIN IMMEDIATE", "写锁先行（跨进程并发窗闭合）")
    assert.equal(fixProbe.calls.at(-1), "exec:COMMIT")
    assert.ok(fixProbe.prepares.some((item) => item.sql.includes("FROM usage WHERE strftime")), "事务内重算快照（读 usage 真源）")
    assert.ok(fixProbe.prepares.every((item) => item.inTx), `全部读/写在事务内：${JSON.stringify(fixProbe.prepares.filter((item) => !item.inTx))}`)
    assert.equal(fixed.fixed, true)
    assert.deepEqual(AGG.reconcileUsage(db, { month: "2026-10" }).daily.drifted, [], "覆写后复查零漂")
    // 零漂移 ⇒ 零覆写（fixed = false——事务照开照收）
    const cleanProbe = probeDb(db)
    const clean = AGG.reconcileUsage(cleanProbe.proxy, { month: "2026-10", fix: true })
    assert.deepEqual([clean.fixed, cleanProbe.calls[0], cleanProbe.calls.at(-1)], [false, "exec:BEGIN IMMEDIATE", "exec:COMMIT"])
  } finally {
    db.close()
  }
})

// ── ⑥ #1001③：`keyUsageStats` 窗沿（近 30 个本地日——与报表窗同构）──────────────

test("⑥ #1001③：keyUsageStats 窗沿 = 近 30 个本地日（-29 含 ∥ -30 不含）∥ 与报表窗同构", () => {
  const db = DB.openDatabase(":memory:")
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('alice', 'alice', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'k', 'sk-tc-a…a', 't')")
    const now = new Date(2026, 9, 15, 12, 0, 0).getTime() // 固定基准（本地正午中点日）
    const usageRow = (ts, totalTokens) => USAGE.recordUsage(db, { ts, memberId: 1, keyId: 1, endpoint: "chat", provider: "p", model: "m", status: "ok", totalTokens, durationMs: 1 })
    usageRow(REPORT.localDayStart(now, -29) + 1000, 11) // 界日内（第 30 个本地日）
    usageRow(REPORT.localDayStart(now, -30) + 1000, 99) // 界日外
    usageRow(now, 7) // 今日
    assert.equal(REPORT.keyUsageStats(db, { now }).get(1).windowTokens, 18, "-29 日含 ∥ -30 日不含（旧式 now-30d 会多含一天）")
    // 与报表窗同构（同一起点日——两窗各自单源，起点取整一致）
    const summary = REPORT.usageSummary(db, { now })
    assert.equal(summary.trend[0].day, REPORT.dayKey(REPORT.localDayStart(now, -(REPORT.KEY_USAGE_WINDOW_DAYS - 1))), "key 窗起点 = 报表窗起点")
    assert.equal(summary.trend[0].totalTokens, 11, "同一界日读数同源")
  } finally {
    db.close()
  }
})

// ── ⑦ #1001②：键形助手两 merge 共用（裸名/空段 ⇒ 400——库零变）──────────────

test("⑦ #1001②：模型禁用与配额覆盖同一键形助手（裸名/空段 ⇒ 400）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(db)
    const adminSession = await login(app.base, "admin", "admin-password")
    const before = db.prepare("SELECT model_quotas_json, model_disabled_json FROM members WHERE id = ?").get(alice.id)
    // 直接面：两 merge 同助手（裸名 ∥ 空段 ⇒ 400——键形非法）
    assert.throws(() => MEMBERS.mergeMemberModelQuotas(db, alice.id, { m: 5 }), (error) => error.status === 400 && error.code === "invalid_request_error")
    assert.throws(() => MEMBERS.mergeMemberModelDisables(db, alice.id, { m: true }), (error) => error.status === 400 && error.code === "invalid_request_error")
    // HTTP 面：`model-quotas` 裸名键 ⇒ 400（#1001②——覆盖键同拍）
    const quotaRes = await post(app.base, QUOTA_URL(alice.id), { cookie: adminSession.cookie, body: { quotas: { m: 5 } } })
    assert.deepEqual([quotaRes.status, quotaRes.json.error.code], [400, "invalid_request_error"])
    const disableRes = await post(app.base, DISABLE_URL(alice.id), { cookie: adminSession.cookie, body: { disables: { m: true } } })
    assert.deepEqual([disableRes.status, disableRes.json.error.code], [400, "invalid_request_error"])
    assert.deepEqual(db.prepare("SELECT model_quotas_json, model_disabled_json FROM members WHERE id = ?").get(alice.id), before, "400 ⇒ 库零变")
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ⑧ 门禁清单（`prepublishOnly` 二十八件含本批两件 ∥ 清单在盘）──────────────────

test("⑧ 门禁清单：`prepublishOnly` 二十八件含本批件（新建 ∥ 随正）∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 28, `门禁清单件数（二十六 ⇒ 二十八——结构轮批件入链 ∥ 10-09 bin 修复批件入链）：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-07-quota-v2-member-models.test.mjs"), "本批件应入列")
  assert.ok(batchFiles.includes("docs/batches/2026-10-07-quota-per-model.test.mjs"), "随正件应在列")
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})

// ════════════ B 棒（前端面——WEBUI §2.4②③ ∥ §6 AC-23 两行）════════════════

// 桩 DOM（近形 = `modal.mjs`/视图件消费面——「控制台布局收正」批内件同形）；`h` 同 app.mjs 语义近似。

function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, focused: false, checked: false, disabled: false, hidden: false, textContent: "", className: "", value: "",
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

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点（数组拍平）。 */
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
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const createDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })
const DATA_SHELL = (mount, { head, area }) => mount.append(head, area) // `ctx.dataShell` 近似（壳两段）
/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
const SELF_KEYS = ["lang.zh", "lang.en"] // 自称名族（仅 zh 表载体）

// ── ⑨ i18n（#994/#988——WEBUI §2.2 KD-SV-44 ∥ §6 AC-23 续）──────────────────────────────

test("⑨ i18n：死键 2 枚零残留 ∥ 新 2 键两表 ∥ `.one` 7 枚仅 en ∥ 基键集双向相等 ∥ 复数取形直测", () => {
  // 死键（#994——旧键退役未删）：两表零残留 + 全 public 源码零字面引用
  for (const key of ["col.actions", "admin.members.quotaEmptyHint"]) {
    assert.ok(!(key in ZH) && !(key in EN), `死键残留（#994）：${key}`)
    for (const name of readdirSync(PUBLIC_DIR).filter((item) => item.endsWith(".mjs"))) {
      assert.equal(readPublic(name).includes(`"${key}"`), false, `${name} 仍引用死键：${key}`)
    }
  }
  // 新 2 键（本批键族登记）：两表在场 ∥ 非空 ∥ 占位符一致 ∥ en 零 CJK
  for (const key of ["admin.members.colDisabled", "admin.members.disableHint"]) {
    assert.ok(key in ZH && key in EN, `新键缺位：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 表含 CJK：${key}`)
  }
  // `.one` 变体族（7 枚——仅 en 表载体；zh 零枚；基键在场）
  const ONES = [
    "common.rowCount.one", "common.modelQuotaCount.one", "admin.members.windowTokensCell.one",
    "admin.members.quotaOffListNote.one", "me.keys.windowTokens.one", "admin.providers.discovered.one", "admin.providers.testOk.one",
  ]
  assert.deepEqual(Object.keys(EN).filter((key) => key.endsWith(".one")).sort(), [...ONES].sort(), "`.one` 变体族 = 7 枚（仅 en）")
  assert.equal(Object.keys(ZH).filter((key) => key.endsWith(".one")).length, 0, "zh 表不得载 `.one` 变体")
  for (const key of ONES) assert.ok(key.slice(0, -4) in ZH && key.slice(0, -4) in EN, `变体基键缺位：${key}`)
  // 基键集双向相等（除自称名族 + `.one` 族）
  const zhBase = Object.keys(ZH).filter((key) => !SELF_KEYS.includes(key))
  const enBase = Object.keys(EN).filter((key) => !key.endsWith(".one"))
  for (const key of zhBase) assert.ok(key in EN, `en 表缺基键：${key}`)
  for (const key of enBase) assert.ok(key in ZH, `en 表多出基键：${key}`)
  assert.equal(zhBase.length, enBase.length, "基键集长度不等")
  // 取形直测（en count=1 ⇒ 单形 ∥ 2 ⇒ 基；`tokens` 族同机制；zh `select` 恒 `other` ⇒ 基键）
  I18N.setLang("en")
  try {
    assert.deepEqual([
      I18N.t("common.rowCount", { count: 1 }),
      I18N.t("common.rowCount", { count: 2 }),
      I18N.t("common.modelQuotaCount", { count: 1 }),
      I18N.t("admin.members.windowTokensCell", { tokens: 1 }),
      I18N.t("me.keys.windowTokens", { tokens: 1 }),
      I18N.t("admin.members.quotaOffListNote", { count: 1 }),
      I18N.t("admin.providers.discovered", { count: 1 }),
      I18N.t("admin.providers.testOk", { name: "p1", count: 1 }),
    ], [
      "1 item", "2 items", "1 model", "1 token", "1 token",
      fill(EN["admin.members.quotaOffListNote.one"], { count: 1 }),
      fill(EN["admin.providers.discovered.one"], { count: 1 }),
      fill(EN["admin.providers.testOk.one"], { name: "p1", count: 1 }),
    ], "取形选键（en——单形 ∥ 基形）")
    assert.equal(I18N.t("common.rowCount"), EN["common.rowCount"], "无 count ⇒ 基键（不取形）")
    assert.equal(I18N.t("usageReport.tokens", { count: 1 }), EN["usageReport.tokens"], "无变体键 ⇒ 取形无果落基")
  } finally {
    I18N.setLang("zh")
  }
  assert.equal(I18N.t("common.rowCount", { count: 1 }), fill(ZH["common.rowCount"], { count: 1 }), "zh 取形恒 `other` ⇒ 基键（零族）")
})

// ── ⑩ 成员弹窗查看态（#1002/#1004——WEBUI §2.4② ∥ §6 AC-23①③）───────────────────────

test("⑩ 成员弹窗查看态：模型表直显 5 列（`deriveModels` 序）∥ 逐行已用 ∥ 禁用勾选即时写（在飞/回弹/静默）∥ 两态共用取数", async () => {
  globalThis.document = createDocument()
  try {
    const calls = []
    let providersFail = false
    let disablesFail = false
    let release = null // 禁写在飞闸（响应挂起——断言在飞态）
    const disables = { "p1/m-a": true, "ghost/x": true } // 现禁用集（含离表键——不计 N、不列示）
    const providersResp = { providers: [
      { id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: ["m-b", "m-a"], settings: { "m-b": { quotaTokens: 1000 } } },
    ] }
    const ctx = {
      h,
      state: {},
      api: (path, { method = "GET", body } = {}) => {
        calls.push([method, path, body ?? null])
        if (method === "GET" && path === "/api/admin/providers") {
          if (providersFail) { providersFail = false; return Promise.reject(new Error("boom")) }
          return Promise.resolve(providersResp)
        }
        if (method === "POST" && String(path).endsWith("/model-disables")) {
          if (disablesFail) { disablesFail = false; return Promise.reject(Object.assign(new Error("raw"), { code: "internal_error" })) }
          const [key, value] = Object.entries(body.disables)[0]
          if (value === null) delete disables[key]
          else disables[key] = true
          return new Promise((resolve) => { release = () => resolve({ id: 1, modelDisables: { ...disables } }) })
        }
        return Promise.reject(new Error(`unexpected ${method} ${path}`))
      },
      fail: (error) => calls.push(["fail", String(error)]),
      showSecret: () => {},
      fmtModelQuotas: (quotas) => {
        const count = Object.keys(quotas ?? {}).length
        return count === 0 ? ZH["common.quotaByPlatform"] : fill(ZH["common.modelQuotaCount"], { count })
      },
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      fmtTs: (ts) => String(ts),
    }
    const member = {
      id: 1, name: "Alice", username: "alice", role: "user",
      modelQuotas: { "p1/m-b": 500, "ghost/x": 3 }, modelUsage: { "p1/m-a": 12 }, modelDisables: { ...disables },
      usedTokens: 42, keys: [],
    }
    const modal = ADMIN.openMemberModal(ctx, { member, reload: async () => [member], secretBox: makeNode("div") })
    assert.ok(byText(modal.root, ZH["common.loading"]) !== null, "进窗首个 = 加载中 hint")
    await tick()
    const quotaTable = () => findNode(modal.root, (node) => node.tag === "table"
      && findAll(node, (cell) => cell.tag === "th").some((cell) => cell.textContent === ZH["admin.members.colDisabled"]))
    const table = quotaTable()
    assert.ok(table !== null, "查看态模型表缺位")
    assert.deepEqual(findAll(table, (node) => node.tag === "th").map((cell) => cell.textContent),
      [ZH["admin.models.colModel"], ZH["admin.members.colMonthlyQuota"], ZH["admin.members.colPlatformQuota"], ZH["col.used"], ZH["admin.members.colDisabled"]], "5 列逐头")
    assert.deepEqual(findAll(table, (node) => node.tag === "tr").slice(1).map((tr) => tr.children.map((cell) => textOf(cell)).join("|")), [
      "p1/m-a|" + ZH["common.quotaByPlatform"] + "|" + ZH["common.quotaUnlimited"] + "|12|",
      "p1/m-b|500|1000|0|",
    ], "行 = 全 chat 模型（id 升序）∥ 覆盖 ∥「按平台」∥ 平台默认 ∥ 逐行已用（缺 ⇒ 0）")
    assert.ok(byText(modal.root, fill(ZH["admin.members.quotaOffListNote"], { count: 1 })) !== null, "离表注行只数覆盖键（离表禁用键不计 N）")
    assert.ok(byText(modal.root, ZH["admin.members.disableHint"]) !== null, "表下禁用语义提示")
    const boxes = findAll(table, (node) => node.tag === "input")
    assert.deepEqual(boxes.map((box) => [box.attrs.type, box.checked]), [["checkbox", true], ["checkbox", false]], "勾选态 = `modelDisables`（默认全可用）")
    // 即时写（在飞 ⇒ 勾选框禁用；响应挂起中）——单键合并 `true` = 禁
    boxes[1].checked = true
    const inflight = boxes[1].fire("change")
    assert.deepEqual(calls.at(-1), ["POST", "/api/members/1/model-disables", { disables: { "p1/m-b": true } }], "切换 ⇒ 单键合并 POST（true = 禁）")
    assert.equal(boxes[1].disabled, true, "在飞期勾选框禁用")
    release()
    await inflight
    assert.deepEqual([boxes[1].disabled, boxes[1].checked, modal.root.open], [false, true, true], "成功 = 静默（勾选态自持，不重渲）")
    assert.equal(findAll(modal.root, (node) => node === table).length, 1, "成功零重渲（同表节点留驻）")
    // 失败 ⇒ 回弹 + 窗内状态行（mapError）；零 flash/fail（定则「弹窗开着 ⇒ 一切反馈落窗内」）
    disablesFail = true
    boxes[1].checked = false
    const beforeFail = calls.length
    await boxes[1].fire("change")
    const statusLine = findNode(modal.root, (node) => node.className === "hint error" && node.hidden === false)
    assert.deepEqual([calls.at(-1), boxes[1].checked, boxes[1].disabled, statusLine?.textContent ?? null],
      [["POST", "/api/members/1/model-disables", { disables: { "p1/m-b": null } }], true, false, ZH["err.internal_error"]], "失败 ⇒ 回弹 + 窗内状态行（null = 恢复提交）")
    assert.equal(calls.slice(beforeFail).some(([kind]) => kind === "fail"), false, "失败落窗内（零 fail 外抛）")
    // 两态共用取数：进编辑态零重拉（单次 GET）；取消回查看态同面
    const fetches = () => calls.filter(([method, path]) => method === "GET" && path === "/api/admin/providers").length
    const fetched = fetches()
    await byText(modal.root, ZH["admin.members.setQuota"]).fire("click")
    assert.equal(fetches(), fetched, "进编辑态零重拉（查看/编辑两态共用单次取数）")
    assert.deepEqual(findAll(modal.root, (node) => node.tag === "input").map((node) => node.value), ["", "500"], "编辑态草稿 = 覆盖现值（空 = 按平台）")
    await byText(modal.root, ZH["common.cancel"]).fire("click")
    assert.ok(quotaTable() !== null, "取消 ⇒ 回查看态（同面留驻）")
    // 取数失败 ⇒ 窗内状态行 +「重试」；重试 = 在飞守卫（连发两次 ⇒ 单次取数）⇒ 模型表在册
    providersFail = true
    const modal2 = ADMIN.openMemberModal(ctx, { member, reload: async () => [member], secretBox: makeNode("div") })
    await tick()
    assert.deepEqual([byText(modal2.root, ZH["admin.members.quotaLoadFailed"]) !== null, byText(modal2.root, ZH["admin.members.quotaRetry"]) !== null], [true, true], "失败 ⇒ 窗内状态行 + 重试")
    const retry = byText(modal2.root, ZH["admin.members.quotaRetry"])
    const beforeRetry = fetches()
    const retried = retry.fire("click")
    retry.fire("click") // 连发同节点（在飞期）——守卫应当拦下二次取数
    await retried
    assert.equal(fetches() - beforeRetry, 1, "重试连发 ⇒ 单次取数（在飞不重拉）")
    assert.ok(findNode(modal2.root, (node) => node.tag === "table"
      && findAll(node, (cell) => cell.tag === "th").some((cell) => cell.textContent === ZH["admin.members.colDisabled"])) !== null, "重试 ⇒ 模型表在册")
  } finally {
    delete globalThis.document
  }
})

// ── ⑪ 服务模型页配额列 ∥ 审计页单标题（#1003 ∥ #995——WEBUI §2.4③ ∥ §6 AC-23②）───────────

test("⑪ 服务模型页配额列三态（值 ∥「不限」 ∥ 嵌入「—」）∥ 保存后列表刷新随动 ∥ 审计页单标题", async () => {
  globalThis.document = createDocument()
  try {
    const calls = []
    const state = { providers: [{ id: 1, name: "p1", baseURL: "http://x/v1", apiKey: "", models: ["m-1", "m-2"], settings: { "m-1": { quotaTokens: 500 } } }] }
    const ctx = {
      h,
      state: { system: { embedding: { model: "bge-m3" } } },
      api: async (path, { method = "GET", body } = {}) => {
        calls.push([method, path, body ?? null])
        if (method === "GET" && path === "/api/admin/providers") return { providers: state.providers }
        if (method === "PATCH" && path === "/api/admin/providers/1") {
          state.providers = [{ ...state.providers[0], settings: { ...state.providers[0].settings, ...body.settings } }]
          return { ok: true, id: 1 }
        }
        throw new Error(`unexpected ${method} ${path}`)
      },
      fail: (error) => calls.push(["fail", String(error)]),
      flash: (message) => calls.push(["flash", message]),
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      dataShell: DATA_SHELL,
    }
    const mount = makeNode("section")
    await MODELS.renderModels(ctx, mount)
    const rowText = (tr) => tr.children.map((cell) => textOf(cell)).join("|")
    assert.deepEqual(findAll(mount, (node) => node.tag === "tr").map(rowText), [
      [ZH["admin.models.colModel"], ZH["admin.models.colProvider"], ZH["admin.models.colSurface"], ZH["admin.models.quotaTitle"]].join("|"),
      "bge-m3|embedding|embeddings|—",
      "p1/m-1|p1|chat|500",
      "p1/m-2|p1|chat|" + ZH["common.quotaUnlimited"],
      fill(ZH["common.rowCount"], { count: 3 }),
    ], "配额列三态（值 ∥「不限」 ∥ 嵌入「—」）∥ tfoot 计数随动")
    // 保存后刷新随动（与 F 组单源）：开详情 ⇒ F 组输入 2000 ⇒ 保存 ⇒ PATCH + 列表重取 + 列值随动
    const fetches = () => calls.filter(([method, path]) => method === "GET" && path === "/api/admin/providers").length
    const fetched = fetches()
    await findAll(mount, (node) => node.tag === "tr")[3].fire("click") // p1/m-2 行（id 升序：bge-m3 1 ∥ m-1 2 ∥ m-2 3）
    const dialog = findNode(globalThis.document.body, (node) => node.tag === "dialog")
    findAll(dialog, (node) => node.tag === "input")[2].value = "2000" // 序 = rpm ∥ tpm ∥ quotaTokens（F 组）∥ note ∥ costIn ∥ costOut
    await byText(dialog, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1),
      ["PATCH", "/api/admin/providers/1", { settings: { "m-2": { rpm: null, tpm: null, costIn: null, costOut: null, quotaTokens: 2000, note: null } } }], "保存 = PATCH settings（单键全对象）")
    assert.ok(fetches() > fetched, "保存 ⇒ 列表重取（刷新随动）")
    assert.ok(findAll(mount, (node) => node.tag === "tr").some((tr) => rowText(tr) === "p1/m-2|p1|chat|2000"), "配额列随动 = 2000")
    // 审计页单标题（#995）：`audit.title` 单点引用（head 的 h2；卡内 h3 已删）——DOM 标题节恰一
    const auditCtx = { h, api: async () => ({ events: [] }), fail: () => {}, dataShell: DATA_SHELL, table: () => h("div") }
    const auditMount = makeNode("section")
    await AUDIT.renderAudit(auditCtx, auditMount)
    assert.equal(findAll(auditMount, (node) => node.textContent === ZH["audit.title"]).length, 1, "标题单点（h2）")
    const auditSrc = readPublic("views-audit.mjs")
    assert.equal((auditSrc.match(/t\("audit\.title"\)/g) ?? []).length, 1, "`audit.title` 引用恰一次")
    assert.equal(auditSrc.includes('h("h3"'), false, "h3 残留")
  } finally {
    delete globalThis.document
  }
})

// ── ⑫ 静态面（§6 AC-23 续——档目 ∥ 行宽 ∥ AC-19 canon）───────────────────────────────

test("⑫ 静态面：档目 29 ∥ 30 ∥ 十四档行宽 ≤300 ∥ `:root` 38 ∥ 悬停清单七条（AC-19 canon 不破）", () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [30, 29], "档目 29 ∥ 30（结构轮后——十新档）")
  for (const file of ["views-admin.mjs", "views-models.mjs", "views-audit.mjs", "i18n.mjs", ...readdirSync(PUBLIC_DIR).filter((name) => /^i18n-(zh|en)/.test(name)).sort()]) {
    for (const line of readPublic(file).split("\n")) assert.ok(line.length <= 300, `${file} 行宽越界：${line.slice(0, 60)}…`)
  }
  // AC-19 canon（style.css 本批零触）：`:root` 变量族 38 ∥ 悬停清单七条
  const css = readPublic("style.css").replace(/\/\*[\s\S]*?\*\//g, "")
  const rootVars = (css.match(/:root\s*\{[^{}]*\}/)?.[0] ?? "").match(/--[\w-]+\s*:/g) ?? []
  assert.equal(rootVars.length, 38, `:root 变量族计数（零新增）：${rootVars.length}`)
  const hover = [...css.matchAll(/([^{}]*:hover[^{}]*)\{/g)].map((match) => match[1].trim().replace(/\s+/g, " ")).sort()
  assert.deepEqual(hover, [".nav-item:hover", "tbody tr:hover", "button:hover", "button.tiny:hover", "button.danger:hover", "button.link:hover", ".modal-close:hover"].sort(), "悬停声明清单（七条——零新增）")
})
