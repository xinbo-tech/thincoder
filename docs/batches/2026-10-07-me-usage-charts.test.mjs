/**
 * 2026-10-07-me-usage-charts.test.mjs — thincoder-server 批内单测件（me 用量图表化批——AC-26 机检载体 · 服务端腿；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存；页面腿 = `-me-usage-charts-ui.test.mjs`（两件同批——
 * 越 500 硬线拆档，沿按域拆档先例）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-me-usage-charts.test.mjs`
 *
 * 射程（判据源 = `metering/METERING.md` §3 端点行/§4 AC-26 行；腿 ↔ 判据在括号）：
 *   腿 A（端点——真 HTTP 面）：① 判权（无会话 ⇒ 401〔E22——非 403〕；user ∥ admin 会话 ⇒ 200 且**恒本人**——双成员注入只含己值）∥
 *      ② 逐值/零填充（N32：totals 四字段 = 明细归并 ∥ trend 按日零填充全长 ∥ 两维序逐（维值 × 日）零填充 ∥ byModel 降序）∥
 *      ③ 过滤器同门（model ∥ endpoint ∥ from/to 生效；非法 endpoint ⇒ 400）∥ ④ 同源（N33：summary 逐值 = 明细日对齐归并）∥
 *      ⑤ B25 空集（totals 全 0 ∥ trend 全零全长 ∥ 三面空数组）∥ ⑥ admin 端点零动（`/api/usage/summary` 响应形与汇总回归——无拆字段）
 *   腿 D（门禁）：`prepublishOnly` 三十三件含本批两件 ∥ 清单目标在盘
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const readRepo = (rel) => readFileSync(join(ROOT, rel), "utf8")
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")
const REPORT = await load("thincoder-server/src/metering/report.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")

const PASSWORD = "password-123"
const BATCH_FILES = [
  "docs/batches/2026-10-07-me-usage-charts.test.mjs",
  "docs/batches/2026-10-07-me-usage-charts-ui.test.mjs",
]

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

/** 进程内服务夹具（真 HTTP 面）：内存库 + 三族注册行。 */
async function startServer() {
  const db = DB.openDatabase(":memory:")
  const routes = SERVER.createRouteTable()
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
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

async function call(base, method, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, json, text, setCookies: res.headers.getSetCookie() }
}
const get = (base, path, opts) => call(base, "GET", path, opts)

async function login(base, username, password) {
  const res = await call(base, "POST", "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}
async function makeMember(db, { username = "alice", role = "user", password = PASSWORD } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, name: username, role, password })
  return member
}

// ── 腿 A（端点——真 HTTP 面）─────────────────────────────────────────────────

test("腿 A 端点：判权（E22 ∥ 恒本人）∥ N32 逐值/零填充 ∥ 过滤器同门 ∥ N33 同源 ∥ admin 端点零动", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const bob = await makeMember(app.db, { username: "bob" })
    const aliceKey = KEYS.issueKey(app.db, alice.id)
    const bobKey = KEYS.issueKey(app.db, bob.id)
    const now = Date.now()
    const dayA = REPORT.localDayStart(now, 0)
    const dayB = REPORT.localDayStart(now, -1)
    const at = (day) => day + 3600000 // 当日 01:00（本地）——日键确定性
    USAGE.recordUsage(app.db, { ts: at(dayA), memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", promptTokens: 11, completionTokens: 22, totalTokens: 33 })
    USAGE.recordUsage(app.db, { ts: at(dayB), memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", promptTokens: 5, completionTokens: 5, totalTokens: 10 })
    USAGE.recordUsage(app.db, { ts: at(dayB), memberId: alice.id, keyId: aliceKey.id, endpoint: "embeddings", provider: "", model: "bge-m3", status: "ok", promptTokens: 3, completionTokens: 0, totalTokens: 3 })
    USAGE.recordUsage(app.db, { ts: at(REPORT.localDayStart(now, -40)), memberId: alice.id, keyId: aliceKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", promptTokens: 100, completionTokens: 100, totalTokens: 200 }) // 窗外（40 天前）——缺省 30 天窗零涉
    USAGE.recordUsage(app.db, { ts: at(dayA), memberId: bob.id, keyId: bobKey.id, endpoint: "chat", provider: "bailian", model: "qwen3.5-plus", status: "ok", promptTokens: 7, completionTokens: 8, totalTokens: 15 })

    // 判权：无会话 ⇒ 401 `unauthorized`（E22——本人面端点非 403）
    const anon = await get(app.base, "/api/me/usage/summary")
    assert.deepEqual([anon.status, anon.json.error.code], [401, "unauthorized"])

    const aliceSession = await login(app.base, "alice", PASSWORD)
    const bobSession = await login(app.base, "bob", PASSWORD)
    const adminSession = await login(app.base, "admin", "admin-password")

    // 恒本人：双成员注入 ⇒ 只含己值；admin（零行）同门 ⇒ 全 0（不见他人行）
    const mine = await get(app.base, "/api/me/usage/summary", { cookie: aliceSession.cookie })
    assert.equal(mine.status, 200)
    assert.deepEqual(Object.keys(mine.json).sort(), ["byModel", "totals", "trend", "trendByEndpoint", "trendByModel"]) // 响应形 = METERING §3（byMember 本人面不设）
    assert.deepEqual(mine.json.totals, { requests: 3, promptTokens: 19, completionTokens: 27, totalTokens: 46 })
    assert.deepEqual((await get(app.base, "/api/me/usage/summary", { cookie: bobSession.cookie })).json.totals, { requests: 1, promptTokens: 7, completionTokens: 8, totalTokens: 15 })
    assert.deepEqual((await get(app.base, "/api/me/usage/summary", { cookie: adminSession.cookie })).json.totals, { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 })

    // N32 trend：按日零填充全长（缺日计 0）
    const trend = mine.json.trend
    assert.equal(trend.length, REPORT.USAGE_SUMMARY_DAYS)
    assert.deepEqual([trend[0].day, trend[trend.length - 1].day], [REPORT.dayKey(REPORT.localDayStart(now, -(REPORT.USAGE_SUMMARY_DAYS - 1))), REPORT.dayKey(now)])
    assert.deepEqual(trend.filter((day) => day.totalTokens > 0), [
      { day: REPORT.dayKey(dayB), requests: 2, totalTokens: 13 },
      { day: REPORT.dayKey(dayA), requests: 1, totalTokens: 33 },
    ])
    assert.equal(trend.reduce((sum, day) => sum + day.totalTokens, 0), 46)

    // N32 两维序：逐（维值 × 日）零填充（维值集 = 窗口内有数据者；缺日计 0）
    const byEndpoint = mine.json.trendByEndpoint
    assert.equal(byEndpoint.length, 2 * REPORT.USAGE_SUMMARY_DAYS)
    assert.deepEqual([...new Set(byEndpoint.map((seg) => seg.endpoint))], ["chat", "embeddings"])
    assert.deepEqual(byEndpoint.filter((seg) => seg.totalTokens > 0), [
      { day: REPORT.dayKey(dayB), endpoint: "chat", requests: 1, totalTokens: 10 },
      { day: REPORT.dayKey(dayA), endpoint: "chat", requests: 1, totalTokens: 33 },
      { day: REPORT.dayKey(dayB), endpoint: "embeddings", requests: 1, totalTokens: 3 },
    ])
    assert.deepEqual(byEndpoint.find((seg) => seg.endpoint === "chat" && seg.day === REPORT.dayKey(REPORT.localDayStart(now, -10))),
      { day: REPORT.dayKey(REPORT.localDayStart(now, -10)), endpoint: "chat", requests: 0, totalTokens: 0 })
    const byModelSeries = mine.json.trendByModel
    assert.equal(byModelSeries.length, 2 * REPORT.USAGE_SUMMARY_DAYS)
    assert.deepEqual([...new Set(byModelSeries.map((seg) => seg.model))], ["bailian/qwen3.5-plus", "bge-m3"])
    assert.deepEqual(byModelSeries.filter((seg) => seg.totalTokens > 0), [
      { day: REPORT.dayKey(dayB), model: "bailian/qwen3.5-plus", requests: 1, totalTokens: 10 },
      { day: REPORT.dayKey(dayA), model: "bailian/qwen3.5-plus", requests: 1, totalTokens: 33 },
      { day: REPORT.dayKey(dayB), model: "bge-m3", requests: 1, totalTokens: 3 },
    ])
    assert.deepEqual(mine.json.byModel, [
      { model: "bailian/qwen3.5-plus", requests: 2, totalTokens: 43 },
      { model: "bge-m3", requests: 1, totalTokens: 3 },
    ]) // 降序（与 /api/usage/summary 同口径）

    // 过滤器同门：endpoint ∥ model ∥ from ∥ to ∥ 非法值 400
    const embOnly = await get(app.base, "/api/me/usage/summary?endpoint=embeddings", { cookie: aliceSession.cookie })
    assert.deepEqual([embOnly.json.totals.requests, embOnly.json.totals.totalTokens, embOnly.json.byModel], [1, 3, [{ model: "bge-m3", requests: 1, totalTokens: 3 }]])
    const modelOnly = await get(app.base, `/api/me/usage/summary?model=${encodeURIComponent("bailian/qwen3.5-plus")}`, { cookie: aliceSession.cookie })
    assert.deepEqual([modelOnly.json.totals.requests, modelOnly.json.totals.totalTokens], [2, 43])
    const fromDayA = await get(app.base, `/api/me/usage/summary?from=${dayA}`, { cookie: aliceSession.cookie })
    assert.deepEqual([fromDayA.json.totals.requests, fromDayA.json.totals.totalTokens, fromDayA.json.trend.length], [1, 33, 1])
    const toDayB = await get(app.base, `/api/me/usage/summary?to=${at(dayB)}`, { cookie: aliceSession.cookie })
    assert.deepEqual([toDayB.json.totals.requests, toDayB.json.totals.totalTokens, toDayB.json.trend.length], [2, 13, REPORT.USAGE_SUMMARY_DAYS - 1])
    assert.equal((await get(app.base, "/api/me/usage/summary?endpoint=audio", { cookie: aliceSession.cookie })).status, 400) // 五读端点同门

    // N33 同源：同过滤面 ⇒ summary 逐值 = 明细日对齐归并（窗沿取整含端日）
    const from = REPORT.localDayStart(now, -(REPORT.USAGE_SUMMARY_DAYS - 1))
    const filter = `from=${from}&model=${encodeURIComponent("bailian/qwen3.5-plus")}`
    const detail = await get(app.base, `/api/me/usage?${filter}`, { cookie: aliceSession.cookie })
    const summary2 = await get(app.base, `/api/me/usage/summary?${filter}`, { cookie: aliceSession.cookie })
    assert.deepEqual([
      detail.json.rows.length,
      detail.json.rows.reduce((sum, row) => sum + row.totalTokens, 0),
      summary2.json.totals.requests,
      summary2.json.totals.totalTokens,
    ], [2, 43, 2, 43])

    // admin 端点零动：`/api/usage/summary` 响应形（无拆字段）与汇总回归
    const adminSummary = await get(app.base, "/api/usage/summary", { cookie: adminSession.cookie })
    assert.deepEqual(Object.keys(adminSummary.json).sort(), ["byMember", "byModel", "totals", "trend"])
    assert.deepEqual(Object.keys(adminSummary.json.totals).sort(), ["requests", "totalTokens"]) // 拆 = 本端点独有
    assert.deepEqual(adminSummary.json.totals, { requests: 4, totalTokens: 61 }) // 全队（alice 46 + bob 15）
    assert.deepEqual(adminSummary.json.byMember, [
      { member: "alice", requests: 3, totalTokens: 46 },
      { member: "bob", requests: 1, totalTokens: 15 },
    ])
  } finally {
    await app.close()
  }
})

test("腿 A 空集：B25（totals 全 0 ∥ trend 全零全长 ∥ 三面空数组——零错）", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db)
    const session = await login(app.base, "alice", PASSWORD)
    const empty = await get(app.base, "/api/me/usage/summary", { cookie: session.cookie })
    assert.equal(empty.status, 200)
    assert.deepEqual(empty.json.totals, { requests: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 })
    assert.equal(empty.json.trend.length, REPORT.USAGE_SUMMARY_DAYS)
    assert.ok(empty.json.trend.every((day) => day.requests === 0 && day.totalTokens === 0), "trend 全零全长")
    assert.deepEqual([empty.json.trendByEndpoint, empty.json.trendByModel, empty.json.byModel], [[], [], []])
  } finally {
    await app.close()
  }
})

// ── 腿 D（门禁）─────────────────────────────────────────────────────────────

test("腿 D 门禁：`prepublishOnly` 三十三件含本批两件 ∥ 清单目标在盘", () => {
  const PKG = JSON.parse(readRepo("thincoder-server/package.json"))
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 33, `门禁清单件数（二十六 ⇒ 三十三——结构轮批件入链 ∥ 10-09 bin 修复批件入链 ∥ 10-09 控制台测试 key 修复批件入链 ∥ 10-09 清除批件入链 ∥ 10-09 代理批件入链 ∥ 10-09 配置控制台批件入链 ∥ 10-09 embed 解耦批件入链）：${batchFiles.length}`)
  for (const file of BATCH_FILES) assert.ok(batchFiles.includes(file), `本批件应入列：${file}`)
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
