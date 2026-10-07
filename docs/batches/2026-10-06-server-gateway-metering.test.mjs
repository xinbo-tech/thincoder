/**
 * 2026-10-06-server-gateway-metering.test.mjs — thincoder-server 批内单测件（D2 段：计量域）
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根——三件一并）：
 *   node --test docs/batches/2026-10-06-server-gateway.test.mjs docs/batches/2026-10-06-server-gateway-accounts.test.mjs
 *     docs/batches/2026-10-06-server-gateway-metering.test.mjs
 *
 * 射程（metering 域——METERING §1–§3；2026-10-07 配额分模型批随正）：记账**同事务三写**（usage 行 + `usage_daily`
 * + `quota_counters`）∥ 行形与拆列回拼（`provider`/`model` 两字段）∥ 明细查询与过滤（member ∥ model ∥ endpoint ∥
 * from ∥ to ∥ limit）∥ 月窗（日表口径）∥ NULL 行（上游未回 usage）∥ 分模型覆盖端点（`/api/members/:id/model-quotas`）
 * ∥ 三级准入判定与 429 形（AC-4 ∥ AC-21 ∥ E2 ∥ B4——含 D3 同构缝）。
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
const DB = await load("thincoder-server/src/store/db.mjs")
const ERRORS = await load("thincoder-server/src/gateway/errors.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")
const REPORT = await load("thincoder-server/src/metering/report.mjs")
const QUOTA = await load("thincoder-server/src/metering/quota.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")

const PASSWORD = "password-123"

/** 配置夹具（合法基线；db 相对配置档目录）。 */
function baseConfig(over = {}) {
  return {
    host: "127.0.0.1",
    db: "gateway.db",
    providers: [{ name: "bailian", baseURL: "https://example.com/v1", apiKey: "sk-fixture", models: ["qwen3.5-plus"] }],
    embedding: { baseURL: "http://10.0.0.5:11434/v1", model: "bge-m3" },
    ...over,
  }
}

/** 进程内服务夹具（真 HTTP 面）：内存库 + 三族注册行；`extend` = 测试局部路由（D3 接线同构缝）。 */
async function startServer({ extend = null } = {}) {
  const db = DB.openDatabase(":memory:")
  const routes = SERVER.createRouteTable()
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  if (extend) extend(routes, db)
  const server = SERVER.createGatewayServer({ config: CONFIG.validateConfig(baseConfig()), routes })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    db,
    base: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve))
      db.close()
    },
  }
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
/** 准入形参（`provider/model` 两段——拆列首斜杠切分：拆列键 = provider + 上游模型名）。 */
function partsOf(ref) {
  const cut = ref.indexOf("/")
  return cut > 0 ? { provider: ref.slice(0, cut), upstreamModel: ref.slice(cut + 1) } : { provider: "", upstreamModel: ref }
}

test("计量：三写（usage + 日表 + 计数表）∥ 拆列回拼 ∥ /api/me/usage ∥ /api/usage 过滤 ∥ 月窗（日表）", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const admin = MEMBERS.findMemberByName(app.db, "admin")
    const adminKey = KEYS.issueKey(app.db, admin.id)
    const aliceKey = KEYS.issueKey(app.db, alice.id)
    const now = Date.now()
    USAGE.recordUsage(app.db, { ts: now - 3000, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", stream: true, promptTokens: 11, completionTokens: 22, totalTokens: 33, durationMs: 123 })
    USAGE.recordUsage(app.db, { ts: now - 2000, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "meta", model: "inner/llama", status: "ok", totalTokens: 10, durationMs: 1 })
    USAGE.recordUsage(app.db, { ts: now - 1000, memberId: admin.id, keyId: adminKey.id, endpoint: "embeddings", provider: "", model: "bge-m3", status: "ok", stream: false, durationMs: 5 })
    const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime()
    USAGE.recordUsage(app.db, { ts: monthStart - 1, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", promptTokens: 900, completionTokens: 100, totalTokens: 1000, durationMs: 9 })
    // 拆列两字段（真源行）∥ 派生两表逐值（同事务三写）
    const raw = app.db.prepare("SELECT provider, model, endpoint FROM usage ORDER BY id").all()
    assert.deepEqual(raw.map((r) => [r.provider, r.model]), [["bailian", "qwen3.5-plus"], ["meta", "inner/llama"], ["", "bge-m3"], ["bailian", "qwen3.5-plus"]])
    const daily = app.db
      .prepare("SELECT provider, model, requests, prompt_tokens, total_tokens, errors FROM usage_daily WHERE day = ? ORDER BY provider, model")
      .all(REPORT.dayKey(now))
    assert.deepEqual(
      daily.map((r) => [r.provider, r.model, r.requests, r.prompt_tokens, r.total_tokens, r.errors]),
      [["", "bge-m3", 1, 0, 0, 0], ["bailian", "qwen3.5-plus", 1, 11, 33, 0], ["meta", "inner/llama", 1, 0, 10, 0]],
    )
    const counter = app.db
      .prepare("SELECT tokens FROM quota_counters WHERE member_id = ? AND provider = ? AND model = ? AND month = strftime('%Y-%m', ? / 1000, 'unixepoch', 'localtime')")
      .get(alice.id, "bailian", "qwen3.5-plus", now)
    assert.equal(counter.tokens, 33) // 本月键（上月行落旧月键——不串）
    const aliceSession = await login(app.base, "alice", PASSWORD)
    const mine = await get(app.base, "/api/me/usage", { cookie: aliceSession.cookie })
    assert.equal(mine.status, 200)
    assert.equal(mine.json.rows.length, 3) // 仅本人
    const row = mine.json.rows[0] // 倒序（新在前）
    assert.deepEqual(Object.keys(row).sort(), ["completionTokens", "durationMs", "endpoint", "id", "keyHint", "member", "model", "promptTokens", "status", "stream", "totalTokens", "ts"])
    assert.equal(row.ts, now - 2000)
    assert.equal(row.member, "alice")
    assert.equal(row.model, "meta/inner/llama") // 回拼无损（model 含斜杠）
    assert.equal(row.keyHint, aliceKey.hint)
    assert.deepEqual([row.promptTokens, row.completionTokens, row.totalTokens], [null, null, 10])
    const third = mine.json.rows[1]
    assert.deepEqual(
      [third.model, third.status, third.stream, third.promptTokens, third.completionTokens, third.totalTokens, third.durationMs],
      ["bailian/qwen3.5-plus", "ok", true, 11, 22, 33, 123], // 逐值不加工（AC-3）
    )
    const adminSession = await login(app.base, "admin", "admin-password")
    const all = await get(app.base, "/api/usage", { cookie: adminSession.cookie })
    assert.equal(all.json.rows.length, 4)
    const lengths = await Promise.all(
      ["member=alice", `member=${alice.id}`, "member=nobody", "model=bge-m3", "model=meta/inner/llama", "model=inner/llama", "model=inner%2Fllama&endpoint=embeddings", `from=${now - 1500}`, `to=${now - 1500}`, "limit=1"].map(
        (query) => get(app.base, `/api/usage?${query}`, { cookie: adminSession.cookie }),
      ),
    )
    assert.deepEqual(lengths.map((res) => res.json.rows.length), [3, 3, 0, 1, 1, 0, 0, 1, 3, 1]) // 过滤矩阵：member ∥ model（无斜杠/两段对/段序/嵌入命名空间）∥ from/to/limit
    assert.deepEqual([
      (await get(app.base, "/api/usage?limit=0", { cookie: adminSession.cookie })).status,
      (await get(app.base, "/api/usage?limit=abc", { cookie: adminSession.cookie })).status,
    ], [400, 400])
    const embRow = all.json.rows.find((r) => r.endpoint === "embeddings")
    assert.deepEqual([embRow.promptTokens, embRow.completionTokens, embRow.totalTokens, embRow.status], [null, null, null, "ok"]) // B2 形：上游未回 ⇒ NULL（记录不静默）
    assert.deepEqual( // 月窗（日表——本地自然月；上月行不计）∥ 与报表同日窗同源
      [USAGE.monthlyTokensForMember(app.db, alice.id), USAGE.monthlyTokensByMember(app.db).get(alice.id), REPORT.usageTotals(app.db, { from: REPORT.localDayStart(now, 0) }).totalTokens],
      [43, 43, 43],
    )
    assert.equal((await get(app.base, "/api/usage", { cookie: aliceSession.cookie })).status, 403) // user 触管理读 ⇒ 403
  } finally {
    await app.close()
  }
})

test("配额：分模型覆盖端点 ∥ 三级序（覆盖 > 平台 > 不限）∥ 短路零 SQL ∥ 点查 O(1) ∥ 429 可读 ∥ 他模型不受累", async () => {
  const sql = { count: 0 } // 计数探针（短路 = 零 SQL ∥ 命中 = 单条点查）
  const app = await startServer({
    extend: (routes, db) => {
      // 测试局部缝（D3 接线的同构最小形——产品树不落此路由）：Bearer key → verifyKey → assertQuota
      routes.add("POST", "/seam/admit", async (req, res) => {
        const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "")
        const hit = KEYS.verifyKey(db, token)
        if (!hit) throw new ERRORS.HttpError("invalid_api_key", "团队 key 无效")
        const body = await SERVER.readJsonBody(req)
        const ref = typeof body?.model === "string" ? body.model : "bailian/qwen3.5-plus"
        QUOTA.assertQuota(db, hit.member, { model: ref, ...partsOf(ref), settings: body?.settings ?? {} })
        ERRORS.sendJson(res, 200, { ok: true })
      })
    },
  })
  try {
    await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const aliceKey = KEYS.issueKey(app.db, alice.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const platform = { quotaTokens: 50 } // 平台层（`settingsFor` 返回形 = 该模型设置对象——运行时快照；本缝直传）
    // 覆盖端点：键级合并 ∥ null 删键 ∥ 非法 400 ∥ 404 ∥ 旧端点退役
    const set = await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: { quotas: { "bailian/qwen3.5-plus": 100 } } })
    assert.deepEqual([set.status, set.json], [200, { id: alice.id, modelQuotas: { "bailian/qwen3.5-plus": 100 } }])
    assert.equal((await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: { quotas: { "bailian/qwen3.5-plus": 100, "other/m": 7 } } })).json.modelQuotas["other/m"], 7) // 未出现键不动
    assert.deepEqual((await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: { quotas: { "other/m": null } } })).json.modelQuotas, { "bailian/qwen3.5-plus": 100 }) // null = 删键
    assert.deepEqual([
      (await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: { quotas: { "x/y": -1 } } })).status,
      (await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: {} })).status,
      (await post(app.base, "/api/members/999999/model-quotas", { cookie: adminSession.cookie, body: { quotas: {} } })).status,
      (await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: { quotaTokens: 1 } })).status, // 旧端点退役
    ], [400, 400, 404, 404])
    // 三级序：覆盖（100）压平台（50）；无覆盖 ⇒ 平台；两级皆无 ⇒ 不限（零 SQL 短路）
    const member = KEYS.verifyKey(app.db, aliceKey.plain).member
    const wrapped = { prepare: (...args) => { sql.count += 1; return app.db.prepare(...args) }, exec: (sqlText) => app.db.exec(sqlText) }
    const ref = "bailian/qwen3.5-plus"
    assert.deepEqual(QUOTA.checkQuota(wrapped, member, { model: ref, ...partsOf(ref), settings: platform }), { allowed: true, used: 0, quota: 100, source: "member" })
    sql.count = 0
    QUOTA.checkQuota(wrapped, member, { model: ref, ...partsOf(ref), settings: platform })
    assert.equal(sql.count, 1, "命中路径 = 单条计数点查（非 SUM）")
    sql.count = 0
    assert.deepEqual(QUOTA.checkQuota(wrapped, member, { model: "bailian/other-model", ...partsOf("bailian/other-model"), settings: platform }), { allowed: true, used: 0, quota: 50, source: "platform" })
    sql.count = 0
    const unlimited = QUOTA.checkQuota(wrapped, member, { model: "bailian/other-model", ...partsOf("bailian/other-model"), settings: {} })
    assert.deepEqual([unlimited.allowed, unlimited.used, unlimited.quota, sql.count], [true, null, null, 0], "三级全无 ⇒ 零 SQL 短路")
    assert.throws(() => QUOTA.checkQuota(app.db, null, { model: ref, ...partsOf(ref) }), /缺少成员/) // 缺成员 ⇒ 明确报错（守卫——非 TypeError）
    // 已用 ≥ 额度 ⇒ 拒 + 429 可读（含模型外标 ∥ 已用/额度）；他模型不受累
    USAGE.recordUsage(app.db, { memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", totalTokens: 100 })
    assert.equal(QUOTA.checkQuota(app.db, member, { model: ref, ...partsOf(ref), settings: platform }).allowed, false) // 本笔照常（B4）——下一笔拒
    assert.throws(
      () => QUOTA.assertQuota(app.db, member, { model: ref, ...partsOf(ref), settings: platform }),
      (e) => e.status === 429 && e.code === "quota_exceeded" && /bailian\/qwen3\.5-plus/.test(e.message) && /已用 100 \/ 额度 100/.test(e.message),
    )
    assert.equal(QUOTA.checkQuota(app.db, member, { model: "bailian/other-model", ...partsOf("bailian/other-model"), settings: platform }).allowed, true) // 他模型不受累（键隔离）
    const denied = await post(app.base, "/seam/admit", { headers: { authorization: `Bearer ${aliceKey.plain}` }, body: { model: ref, settings: platform } })
    assert.deepEqual([denied.status, denied.json.error.code], [429, "quota_exceeded"])
    assert.match(denied.json.error.message, /已用 100 \/ 额度 100/) // 可读提示（含已用/额度——E2）
    assert.deepEqual([
      (await post(app.base, "/seam/admit")).status, // 无 key
      (await post(app.base, "/seam/admit", { headers: { authorization: "Bearer sk-tc-nope" } })).json.error.code,
    ], [401, "invalid_api_key"])
    assert.equal((await post(app.base, "/seam/admit", { headers: { authorization: `Bearer ${aliceKey.plain}` }, body: { model: "bailian/other-model", settings: platform } })).status, 200) // 他模型放行
    // 覆盖删键 ⇒ 回落平台（改行即改——热生效）
    await post(app.base, `/api/members/${alice.id}/model-quotas`, { cookie: adminSession.cookie, body: { quotas: { "bailian/qwen3.5-plus": null } } })
    assert.deepEqual(QUOTA.checkQuota(app.db, KEYS.verifyKey(app.db, aliceKey.plain).member, { model: ref, ...partsOf(ref), settings: platform }), { allowed: false, used: 100, quota: 50, source: "platform" })
  } finally {
    await app.close()
  }
})
