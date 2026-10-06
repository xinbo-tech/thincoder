/**
 * 2026-10-06-server-gateway-metering.test.mjs — thincoder-server 批内单测件（D2 段：计量域）
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根——三件一并）：
 *   node --test docs/batches/2026-10-06-server-gateway.test.mjs docs/batches/2026-10-06-server-gateway-accounts.test.mjs
 *     docs/batches/2026-10-06-server-gateway-metering.test.mjs
 *
 * 射程（metering 域——METERING §1–§3）：记账行落库与行形 ∥ 明细查询与过滤（member ∥ model ∥ from ∥ to ∥ limit）∥
 * 月窗口（本地自然月）∥ NULL 行（上游未回 usage）∥ 额度端点 ∥ 准入判定与 429 形（AC-4 ∥ E2 ∥ B4——含 D3 同构缝）。
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

test("计量：行落库（token 逐值）+ NULL 行 ∥ /api/me/usage ∥ /api/usage 过滤 ∥ 月窗口", async () => {
  const app = await startServer()
  try {
    const admin = await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const adminKey = KEYS.issueKey(app.db, admin.id)
    const aliceKey = KEYS.issueKey(app.db, alice.id)
    const now = Date.now()
    USAGE.recordUsage(app.db, { ts: now - 2000, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", model: "qwen3.5-plus", status: "ok", stream: true, promptTokens: 11, completionTokens: 22, totalTokens: 33, durationMs: 123 })
    USAGE.recordUsage(app.db, { ts: now - 1000, memberId: admin.id, keyId: adminKey.id, endpoint: "embeddings", model: "bge-m3", status: "ok", stream: false, durationMs: 5 })
    const monthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime()
    USAGE.recordUsage(app.db, { ts: monthStart - 1, memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", model: "qwen3.5-plus", status: "ok", promptTokens: 900, completionTokens: 100, totalTokens: 1000, durationMs: 9 })
    const aliceSession = await login(app.base, "alice", PASSWORD)
    const mine = await get(app.base, "/api/me/usage", { cookie: aliceSession.cookie })
    assert.equal(mine.status, 200)
    assert.equal(mine.json.rows.length, 2) // 仅本人
    const row = mine.json.rows[0] // 倒序（新在前）
    assert.deepEqual(Object.keys(row).sort(), ["completionTokens", "durationMs", "endpoint", "id", "keyHint", "member", "model", "promptTokens", "status", "stream", "totalTokens", "ts"])
    assert.equal(row.ts, now - 2000)
    assert.equal(row.member, "alice")
    assert.equal(row.keyHint, aliceKey.hint)
    assert.equal(row.status, "ok")
    assert.equal(row.stream, true)
    assert.deepEqual([row.promptTokens, row.completionTokens, row.totalTokens], [11, 22, 33]) // 逐值不加工（AC-3）
    assert.equal(row.durationMs, 123)
    const adminSession = await login(app.base, "admin", "admin-password")
    const all = await get(app.base, "/api/usage", { cookie: adminSession.cookie })
    assert.equal(all.json.rows.length, 3)
    assert.equal((await get(app.base, "/api/usage?member=alice", { cookie: adminSession.cookie })).json.rows.length, 2) // 名过滤
    assert.equal((await get(app.base, `/api/usage?member=${alice.id}`, { cookie: adminSession.cookie })).json.rows.length, 2) // id 过滤
    assert.equal((await get(app.base, "/api/usage?member=nobody", { cookie: adminSession.cookie })).json.rows.length, 0)
    assert.equal((await get(app.base, "/api/usage?model=bge-m3", { cookie: adminSession.cookie })).json.rows.length, 1)
    assert.equal((await get(app.base, `/api/usage?from=${now - 1500}`, { cookie: adminSession.cookie })).json.rows.length, 1)
    assert.equal((await get(app.base, `/api/usage?to=${now - 1500}`, { cookie: adminSession.cookie })).json.rows.length, 2)
    assert.equal((await get(app.base, "/api/usage?limit=1", { cookie: adminSession.cookie })).json.rows.length, 1)
    assert.equal((await get(app.base, "/api/usage?limit=0", { cookie: adminSession.cookie })).status, 400)
    assert.equal((await get(app.base, "/api/usage?limit=abc", { cookie: adminSession.cookie })).status, 400)
    const embRow = all.json.rows.find((r) => r.endpoint === "embeddings")
    assert.deepEqual([embRow.promptTokens, embRow.completionTokens, embRow.totalTokens], [null, null, null]) // B2 形：上游未回 ⇒ NULL
    assert.equal(embRow.status, "ok") // 记录不静默
    assert.equal(USAGE.monthlyTokensForMember(app.db, alice.id), 33) // 月窗口（本地自然月）——上月行不计
    assert.equal(USAGE.monthlyTokensByMember(app.db).get(alice.id), 33)
    assert.equal((await get(app.base, "/api/usage", { cookie: aliceSession.cookie })).status, 403) // user 触管理读 ⇒ 403
  } finally {
    await app.close()
  }
})

test("配额：置额度 ∥ 额内放行 ∥ 已用 ≥ 额度 ⇒ 429 可读（缝面）∥ 不限额 ∥ 非法/404", async () => {
  const app = await startServer({
    extend: (routes, db) => {
      // 测试局部缝（D3 接线的同构最小形——产品树不落此路由）：Bearer key → verifyKey → assertQuota
      routes.add("POST", "/seam/admit", (req, res) => {
        const token = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "")
        const hit = KEYS.verifyKey(db, token)
        if (!hit) throw new ERRORS.HttpError("invalid_api_key", "团队 key 无效")
        QUOTA.assertQuota(db, hit.member)
        ERRORS.sendJson(res, 200, { ok: true })
      })
    },
  })
  try {
    const admin = await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const adminKey = KEYS.issueKey(app.db, admin.id)
    const aliceKey = KEYS.issueKey(app.db, alice.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const set = await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: { quotaTokens: 100 } })
    assert.equal(set.status, 200)
    assert.deepEqual(set.json, { id: alice.id, quotaTokens: 100 })
    const fresh = MEMBERS.findMemberById(app.db, alice.id)
    assert.deepEqual(QUOTA.checkQuota(app.db, fresh), { allowed: true, used: 0, quota: 100 })
    assert.throws(() => QUOTA.checkQuota(app.db, null), /缺少成员/) // 缺成员 ⇒ 明确报错（守卫——非 TypeError）
    assert.equal((await post(app.base, "/seam/admit", { headers: { authorization: `Bearer ${aliceKey.plain}` } })).status, 200)
    USAGE.recordUsage(app.db, { memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", model: "qwen3.5-plus", status: "ok", totalTokens: 100 })
    assert.equal(QUOTA.checkQuota(app.db, fresh).allowed, false) // 本笔照常（B4）——下一笔拒
    assert.throws(() => QUOTA.assertQuota(app.db, fresh), (e) => e.status === 429 && e.code === "quota_exceeded" && /已用 100/.test(e.message) && /额度 100/.test(e.message))
    const denied = await post(app.base, "/seam/admit", { headers: { authorization: `Bearer ${aliceKey.plain}` } })
    assert.equal(denied.status, 429)
    assert.equal(denied.json.error.code, "quota_exceeded")
    assert.match(denied.json.error.message, /已用 100 \/ 额度 100/) // 可读提示（含已用/额度——E2）
    assert.equal((await post(app.base, "/seam/admit")).status, 401) // 无 key
    assert.equal((await post(app.base, "/seam/admit", { headers: { authorization: "Bearer sk-tc-nope" } })).json.error.code, "invalid_api_key")
    assert.equal((await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: { quotaTokens: null } })).json.quotaTokens, null)
    assert.equal(QUOTA.checkQuota(app.db, MEMBERS.findMemberById(app.db, alice.id)).allowed, true) // null = 不限
    assert.equal((await post(app.base, "/seam/admit", { headers: { authorization: `Bearer ${adminKey.plain}` } })).status, 200) // 无额度成员放行
    assert.equal((await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: { quotaTokens: -1 } })).status, 400)
    assert.equal((await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: {} })).status, 400)
    assert.equal((await post(app.base, "/api/members/999999/quota", { cookie: adminSession.cookie, body: { quotaTokens: 1 } })).status, 404)
  } finally {
    await app.close()
  }
})
