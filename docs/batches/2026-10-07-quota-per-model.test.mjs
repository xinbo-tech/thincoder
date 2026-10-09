/**
 * 2026-10-07-quota-per-model.test.mjs — thincoder-server 批内单测件（配额分模型批·AC-21 ∥ AC-22 判据载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-quota-per-model.test.mjs`
 *
 * 射程（判据源 = `metering/METERING.md` §2/§4 ∥ `store/STORE.md` §2 v5 段/§3 ∥ `gateway/API.md` §2.1/§5；
 * 腿 ↔ 判据对照在括号）：
 *   ① v5 迁移（STORE §3 ∥ METERING §4 AC-22③——KD-SV-40）：空库直落 5 ∥ v4 库自动升 5 ∥ 幂等 ∥ 拆列抽样逐值
 *      （含 `model` 含斜杠 ∥ 嵌入行 `provider = ''`）∥ 两表回填逐值 = usage 重算 ∥ 旧列不在 `pragma_table_info('members')`
 *   ② 记账三写（METERING §1——KD-SV-8）：同事务三写（失败整滚——零漂移）∥ 跨零点/月初终结键随行 `ts`（B24）
 *   ③ 配额检查（METERING §2/§2.4 ∥ API §5 AC-21——KD-SV-38）：三级序（覆盖 ⇒ 平台 ⇒ 不限）∥ 三级全无 ⇒ 零 SQL 短路
 *      ∥ 命中 ⇒ 单条点查 + EXPLAIN = 唯一键 autoindex（点查查询形；读数 = §2.4 探针面）∥ 429 形（含模型/已用/额度）
 *      ∥ 他模型不受累 ∥ 窗口 = 自然月（跨月键零起）
 *   ④ 汇表面（METERING §3 ∥ §4 AC-15②——KD-SV-39）：summary/totals/key 窗/成员月累计读 `usage_daily` ∥ 日对齐逐值
 *      = 明细归并 ∥ trend 零填充 ∥ `model` 过滤两字段解析（优先级）∥ API 形零变
 *   ⑤ 对账（METERING §2.5）：零漂移 ∥ 注入漂移 ⇒ 检出 ∥ `--fix` ⇒ 覆写后复查零漂 ∥ CLI `usage reconcile` 实跑
 *   ⑥ 端到端（真 HTTP）：平台层 `quotaTokens` 热生效 ⇒ 429 ∥ 成员覆盖 ⇒ 放行 ∥ 嵌入零检查 ∥ 404 先于 429-quota
 *      ∥ 旧额度端点 404 ∥ `/api/me` 行形
 *   ⑦ 门禁清单：`prepublishOnly` 含本批件（三十件——结构轮批件入链）∥ 清单目标在盘
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const CLI_PATH = join(ROOT, "thincoder-server", "src", "ops", "cli.mjs")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
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
const QUOTA = await load("thincoder-server/src/metering/quota.mjs")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))

const PASSWORD = "password-123"
const MEMBER_QUOTA_URL = (id) => `/api/members/${id}/model-quotas`

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tc-quota-${tag}-`))
}
/** 配置夹具（合法基线——`:memory:` 或临时档路径；mock 上游指入）。 */
function baseConfig(over = {}) {
  return {
    host: "127.0.0.1",
    db: "gateway.db",
    providers: [],
    embedding: { baseURL: "http://10.0.0.5:11434/v1", model: "bge-m3" },
    ...over,
  }
}
function configWith(baseURL) {
  return CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [{ name: "mock", baseURL, apiKey: "sk-upstream", models: ["mock-chat"] }],
    embedding: { baseURL, model: "bge-m3" },
  })
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
/** 准入形参（`provider/model` 两段——拆列首斜杠切分）。 */
function partsOf(ref) {
  const cut = ref.indexOf("/")
  return cut > 0 ? { provider: ref.slice(0, cut), upstreamModel: ref.slice(cut + 1) } : { provider: "", upstreamModel: ref }
}
function runCli(args) {
  const child = spawn(process.execPath, [CLI_PATH, ...args], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
  let out = ""
  let err = ""
  child.stdout.on("data", (data) => { out += data })
  child.stderr.on("data", (data) => { err += data })
  return new Promise((resolve) => child.on("exit", (code) => resolve({ code, out, err })))
}

// ── ① v5 迁移（STORE §3 ∥ AC-22③——KD-SV-40）────────────────────────────────

test("① v5 迁移：空库直落 10（链尾——配置控制台批后）∥ v4 库自动升 10 ∥ 幂等 ∥ 拆列抽样逐值 ∥ 回填逐值 = usage 重算 ∥ 旧列已删", () => {
  const fresh = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [10, 10])
    assert.ok(fresh.prepare("PRAGMA table_info(usage)").all().some((column) => column.name === "provider"), "usage.provider 缺位")
    const memberColumns = fresh.prepare("PRAGMA table_info(members)").all().map((column) => column.name)
    assert.ok(memberColumns.includes("model_quotas_json"), "members.model_quotas_json 缺位")
    assert.ok(!memberColumns.includes("quota_tokens"), "旧列 quota_tokens 未删（退役）")
    const tables = fresh.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name)
    for (const table of ["usage_daily", "quota_counters"]) assert.ok(tables.includes(table), `缺表：${table}`)
  } finally {
    fresh.close()
  }

  const dir = tmpDir("migrate")
  const file = join(dir, "gateway.db")
  try {
    // v4 旧库（旧形 usage：model = 对外标识复合值）
    const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 4) })
    assert.equal(DB.readVersion(legacy), 4)
    legacy.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('old', 'old', 'scrypt$fixture', '2026-10-06')")
    legacy.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'k1', 'sk-tc-abcd…wxyz', '2026-10-06')")
    const insert = legacy.prepare(
      "INSERT INTO usage (ts, member_id, key_id, endpoint, model, status, stream, prompt_tokens, completion_tokens, total_tokens, duration_ms) VALUES (?, 1, 1, ?, ?, ?, 0, ?, ?, ?, ?)",
    )
    const day = new Date(2026, 9, 6, 12, 0, 0).getTime() // 本地日界（2026-10-06 正午——时区无关）
    insert.run(day, "chat", "bailian/qwen3.5-plus", "ok", 10, 20, 30, 5)
    insert.run(day + 1000, "chat", "meta/inner/llama", "ok", 1, 2, 3, 4) // model 含斜杠
    insert.run(day + 2000, "embeddings", "bge-m3", "ok", 5, 5, 10, 2) // 嵌入行
    insert.run(day + 3000, "chat", "bailian/qwen3.5-plus", "error", null, null, null, 9)
    legacy.close()
    const db = DB.openDatabase(file) // 启动自动升
    try {
      assert.equal(DB.readVersion(db), 10)
      // 拆列抽样逐值（判据 = endpoint='chat' + 首斜杠；嵌入行 provider = ''）
      assert.deepEqual(
        db.prepare("SELECT provider, model, endpoint FROM usage ORDER BY id").all().map((row) => [row.provider, row.model, row.endpoint]),
        [["bailian", "qwen3.5-plus", "chat"], ["meta", "inner/llama", "chat"], ["", "bge-m3", "embeddings"], ["bailian", "qwen3.5-plus", "chat"]],
      )
      // 回填逐值 = usage 重算（对账口径零漂——同 SQL 表达式）
      const rec = AGG.reconcileUsage(db, { month: "2026-10" })
      assert.deepEqual([rec.daily.checked, rec.daily.drifted.length, rec.counters.checked, rec.counters.drifted.length], [3, 0, 3, 0])
      const bailian = db.prepare("SELECT requests, prompt_tokens, completion_tokens, total_tokens, errors FROM usage_daily WHERE provider = 'bailian'").get()
      assert.deepEqual([bailian.requests, bailian.prompt_tokens, bailian.completion_tokens, bailian.total_tokens, bailian.errors], [2, 10, 20, 30, 1])
      assert.equal(db.prepare("SELECT tokens FROM quota_counters WHERE provider = 'meta' AND model = 'inner/llama'").get().tokens, 3)
      // 幂等：再跑迁移链 ⇒ 版本不变 ∥ 回填不重复
      assert.equal(DB.migrate(db), 10)
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n, 3)
    } finally {
      db.close()
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ② 记账三写（METERING §1——KD-SV-8；B24 跨零点/月初）──────────────────────

test("② 记账三写：同事务（失败整滚）∥ 键随行 ts（跨零点 ∥ 月初终结）∥ 计数照计", () => {
  const db = DB.openDatabase(":memory:")
  const member = { id: 1 }
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('a', 'a', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'k', 'sk-tc-abcd…wxyz', 't')")
    const lateNight = new Date(2026, 9, 6, 23, 59, 59).getTime() // 前日最后一秒
    const afterMidnight = lateNight + 2000 // 次日 00:00:01（终结入账时刻在后——键须随 ts）
    const prevMonthEnd = new Date(2026, 8, 30, 23, 59, 59).getTime() // 前月最后一秒
    USAGE.recordUsage(db, { ts: lateNight, memberId: member.id, keyId: 1, endpoint: "chat", provider: "mock", model: "m", status: "ok", promptTokens: 10, completionTokens: 20, totalTokens: 30, durationMs: 5 })
    USAGE.recordUsage(db, { ts: afterMidnight, memberId: member.id, keyId: 1, endpoint: "chat", provider: "mock", model: "m", status: "error", durationMs: 9 })
    USAGE.recordUsage(db, { ts: prevMonthEnd, memberId: member.id, keyId: 1, endpoint: "embeddings", provider: "", model: "bge-m3", status: "ok", totalTokens: 7, durationMs: 2 })
    assert.deepEqual(
      db.prepare("SELECT day, requests, total_tokens, errors FROM usage_daily ORDER BY day, provider").all().map((row) => [row.day, row.requests, row.total_tokens, row.errors]),
      [["2026-09-30", 1, 7, 0], ["2026-10-06", 1, 30, 0], ["2026-10-07", 1, 0, 1]],
    )
    assert.deepEqual(db.prepare("SELECT month, tokens FROM quota_counters ORDER BY month, provider").all().map((row) => [row.month, row.tokens]), [["2026-09", 7], ["2026-10", 30]])
    assert.equal(AGG.quotaCounterTokens(db, { memberId: member.id, provider: "mock", model: "m", now: new Date(2026, 9, 1, 10, 0, 0).getTime() }), 30) // 新月键零起（不串旧月）
    assert.equal(AGG.quotaCounterTokens(db, { memberId: member.id, provider: "mock", model: "m", now: prevMonthEnd }), 0) // 旧月无 chat 键
    // 失败整滚：派生 upsert 抛 ⇒ usage 行一并回滚（三写原子——零漂移）
    const before = [db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, db.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n, db.prepare("SELECT COUNT(*) AS n FROM quota_counters").get().n]
    const failing = {
      prepare: (() => { let calls = 0; return (sql) => { calls += 1; if (calls === 2) throw new Error("boom"); return db.prepare(sql) } })(),
      exec: (sql) => db.exec(sql),
    }
    assert.throws(() => USAGE.recordUsage(failing, { ts: lateNight, memberId: member.id, keyId: 1, endpoint: "chat", provider: "mock", model: "m2", status: "ok", totalTokens: 1 }), /boom/)
    assert.deepEqual(
      [db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, db.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n, db.prepare("SELECT COUNT(*) AS n FROM quota_counters").get().n],
      before,
    )
    assert.throws(() => USAGE.recordUsage(db, { memberId: member.id, keyId: 1, endpoint: "audio", provider: "mock", model: "m", status: "ok" }), /endpoint 非法/)
  } finally {
    db.close()
  }
})

// ── ③ 配额检查（METERING §2/§2.4 ∥ AC-21——KD-SV-38）────────────────────────

test("③ 配额检查：三级序 ∥ 零 SQL 短路 ∥ 单条点查 + EXPLAIN autoindex ∥ 429 形 ∥ 他模型不受累", () => {
  const db = DB.openDatabase(":memory:")
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('a', 'a', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'k', 'sk-tc-abcd…wxyz', 't')")
    db.exec("INSERT INTO usage_daily (day, member_id, key_id, provider, model, endpoint, requests, total_tokens) VALUES ('2026-10-06', 1, 1, 'mock', 'm1', 'chat', 1, 12)")
    db.exec("INSERT INTO quota_counters (member_id, provider, model, month, tokens) VALUES (1, 'mock', 'm1', '2026-10', 12)")
    const member = { id: 1, modelQuotas: { "mock/m1": 30 } }
    const ref = "mock/m1"
    const now = new Date(2026, 9, 6, 12, 0, 0).getTime()
    // ① 覆盖（30）压平台（10）——覆盖可高可低（整值替换：若按平台 10 则已超）
    assert.deepEqual(QUOTA.checkQuota(db, member, { model: ref, ...partsOf(ref), settings: { quotaTokens: 10 }, now }), { allowed: true, used: 12, quota: 30, source: "member" })
    assert.deepEqual(QUOTA.checkQuota(db, { id: 1, modelQuotas: {} }, { model: ref, ...partsOf(ref), settings: { quotaTokens: 10 }, now }), { allowed: false, used: 12, quota: 10, source: "platform" })
    // ② 无覆盖 ⇒ 平台
    assert.deepEqual(QUOTA.checkQuota(db, { id: 1, modelQuotas: {} }, { model: ref, ...partsOf(ref), settings: { quotaTokens: 50 }, now }), { allowed: true, used: 12, quota: 50, source: "platform" })
    // ③ 两级皆无 ⇒ 不限（零 SQL 短路——计数探针）
    const probe = { count: 0, prepare: (...args) => { probe.count += 1; return db.prepare(...args) }, exec: (sql) => db.exec(sql) }
    const unlimited = QUOTA.checkQuota(probe, { id: 1, modelQuotas: {} }, { model: ref, ...partsOf(ref), settings: {}, now })
    assert.deepEqual([unlimited.allowed, unlimited.used, unlimited.quota, probe.count], [true, null, null, 0], "三级全无 ⇒ 零 SQL 短路")
    // 命中 ⇒ 单条点查（非 SUM）∥ EXPLAIN = 唯一键 autoindex（点查查询形；读数 = §2.4 探针面）
    probe.count = 0
    QUOTA.checkQuota(probe, member, { model: ref, ...partsOf(ref), settings: {}, now })
    assert.equal(probe.count, 1, "命中路径 = 单条计数点查")
    const plan = db
      .prepare("EXPLAIN QUERY PLAN SELECT tokens FROM quota_counters WHERE member_id = ? AND provider = ? AND model = ? AND month = ?")
      .all(1, "mock", "m1", "2026-10")
      .map((row) => row.detail)
      .join(" ")
    assert.match(plan, /USING INDEX sqlite_autoindex_quota_counters/, plan)
    // 他模型不受累（按请求模型判——键隔离：另模型计数为零）
    assert.deepEqual(QUOTA.checkQuota(db, member, { model: "mock/other", ...partsOf("mock/other"), settings: { quotaTokens: 30 }, now }), { allowed: true, used: 0, quota: 30, source: "platform" })
    // 超限 ⇒ 429 + 可读提示（模型外标 + 已用/额度——AC-4 ∥ AC-21④）
    assert.throws(
      () => QUOTA.assertQuota(db, { id: 1, modelQuotas: { "mock/m1": 10 } }, { model: ref, ...partsOf(ref), settings: {}, now }),
      (error) => error.status === 429 && error.code === "quota_exceeded" && error.message.includes("模型 mock/m1") && error.message.includes("已用 12 / 额度 10"),
    )
    // 跨月窗口：旧月计数不串新月（新月键零起）；同月内 ⇒ 读数在场
    assert.equal(AGG.quotaCounterTokens(db, { memberId: 1, provider: "mock", model: "m1", now: new Date(2026, 10, 1, 0, 30, 0).getTime() }), 0)
    assert.equal(AGG.quotaCounterTokens(db, { memberId: 1, provider: "mock", model: "m1", now }), 12)
    // 点查余量（粗界——内存库 200 次平均；读数目标 = §2.4 p95 ≤0.05ms 探针面）
    const started = process.hrtime.bigint()
    for (let i = 0; i < 200; i++) AGG.quotaCounterTokens(db, { memberId: 1, provider: "mock", model: "m1", now })
    const perCallMs = Number(process.hrtime.bigint() - started) / 1e6 / 200
    assert.ok(perCallMs < 0.5, `单次点查 ${perCallMs.toFixed(3)}ms（粗界 0.5ms——对账/探针面见 METERING §2.4）`)
  } finally {
    db.close()
  }
})

// ── ④ 汇表面（METERING §3 ∥ AC-15②——KD-SV-39）──────────────────────────────

test("④ 汇表面：summary/totals/key 窗/成员月累计读日表 ∥ 日对齐逐值 = 明细归并 ∥ trend 零填充 ∥ model 过滤两字段", () => {
  const db = DB.openDatabase(":memory:")
  try {
    db.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('alice', 'alice', 'h', 't'), ('bob', 'bob', 'h', 't')")
    db.exec("INSERT INTO api_keys (member_id, key_hash, key_hint, created_at) VALUES (1, 'ka', 'sk-tc-a…a', 't'), (2, 'kb', 'sk-tc-b…b', 't')")
    const now = new Date(2026, 9, 15, 12, 0, 0).getTime() // 固定基准时刻（本地正午中点日——#1001④：窗沿/月累计/清理读数皆确定性，消月界假红）
    const today = REPORT.localDayStart(now, 0)
    const row = (over) => ({ ts: today + 1000, memberId: 1, keyId: 1, endpoint: "chat", provider: "prov", model: "a", status: "ok", ...over })
    USAGE.recordUsage(db, row({ promptTokens: 60, completionTokens: 40, totalTokens: 100, durationMs: 120 }))
    USAGE.recordUsage(db, row({ ts: today + 2000, endpoint: "embeddings", provider: "", model: "bge-m3", promptTokens: 20, completionTokens: 0, totalTokens: 20, durationMs: 50 }))
    USAGE.recordUsage(db, row({ ts: today + 3000, memberId: 2, keyId: 2, status: "error" })) // NULL token ⇒ 日表计 0
    USAGE.recordUsage(db, row({ ts: REPORT.localDayStart(now, -1) + 1000, model: "b", promptTokens: 120, completionTokens: 80, totalTokens: 200, durationMs: 80 }))
    // 明细归并（日对齐——同一过滤面）⇒ trend 逐值
    const rows = USAGE.queryUsage(db, { limit: 500 })
    const dayMerge = new Map()
    for (const item of rows) {
      const day = REPORT.dayKey(item.ts)
      const entry = dayMerge.get(day) ?? { requests: 0, totalTokens: 0 }
      dayMerge.set(day, { requests: entry.requests + 1, totalTokens: entry.totalTokens + (item.totalTokens ?? 0) })
    }
    const summary = REPORT.usageSummary(db, { now })
    assert.equal(summary.trend.length, 30, "trend 零填充全序列（近 30 天）")
    assert.deepEqual(summary.totals, { requests: 4, totalTokens: 320 })
    for (const [day, entry] of dayMerge) assert.deepEqual(summary.trend.find((slot) => slot.day === day), { day, ...entry }, day)
    // totals 日对齐窗（今日）= 明细日对齐归并
    assert.deepEqual(REPORT.usageTotals(db, { from: REPORT.localDayStart(now, 0) }), { requests: 3, totalTokens: 120 })
    // byModel（provider×model 两列聚合——回拼对外标识）∥ byMember 降序
    assert.deepEqual(summary.byModel, [{ model: "prov/b", requests: 1, totalTokens: 200 }, { model: "prov/a", requests: 2, totalTokens: 100 }, { model: "bge-m3", requests: 1, totalTokens: 20 }])
    assert.deepEqual(summary.byMember, [{ member: "alice", requests: 3, totalTokens: 320 }, { member: "bob", requests: 1, totalTokens: 0 }])
    // key 窗（日粒度——读日表）∥ 成员月累计（读日表）
    const stats = REPORT.keyUsageStats(db, { now })
    assert.deepEqual([stats.get(1).windowTokens, stats.get(2).windowTokens], [320, 0])
    assert.equal(stats.get(2).lastUsedAt, today + 3000, "lastUsedAt = MAX(ts)（读 usage 真源）")
    assert.equal(REPORT.monthlyTokensForMember(db, 1, { now }), 320)
    assert.equal(REPORT.monthlyTokensByMember(db, { now }).get(2), 0)
    // `model` 过滤解析优先级：含斜杠 ⇒ 两段对 ∥ endpoint=embeddings 在场 ⇒ 全串不切分
    assert.equal(USAGE.queryUsage(db, { model: "prov/a", limit: 500 }).length, 2)
    assert.equal(USAGE.queryUsage(db, { model: "prov/a", endpoint: "embeddings", limit: 500 }).length, 0)
    assert.equal(USAGE.queryUsage(db, { model: "bge-m3", endpoint: "embeddings", limit: 500 })[0].model, "bge-m3") // 嵌入行回拼 = 单段
    assert.equal(REPORT.usageTotals(db, { model: "prov/b" }).totalTokens, 200)
    // 清理同窗（三表同事务）：窗外删 ∥ 窗内留（计数表月度粒度——当月键保留）
    const future = now + 91 * 24 * 60 * 60 * 1000
    assert.equal(USAGE.pruneUsage(db, { now: future, retentionDays: 90 }), 4)
    assert.deepEqual([db.prepare("SELECT COUNT(*) AS n FROM usage_daily").get().n, db.prepare("SELECT COUNT(*) AS n FROM quota_counters").get().n], [0, 4])
  } finally {
    db.close()
  }
})

// ── ⑤ 对账（METERING §2.5；CLI 实跑）────────────────────────────────────────

test("⑤ 对账：零漂移 ∥ 注入漂移 ⇒ 检出（明细）∥ `--fix` ⇒ 覆写后复查零漂 ∥ CLI `usage reconcile`", async () => {
  const dir = tmpDir("reconcile")
  try {
    const configFile = join(dir, "config.json")
    writeFileSync(configFile, JSON.stringify(baseConfig(), null, 2))
    const dbFile = join(dir, "gateway.db")
    const db = DB.openDatabase(dbFile)
    const { member } = await MEMBERS.createMember(db, { username: "alice", name: "alice", password: PASSWORD })
    const key = KEYS.issueKey(db, member.id)
    const day = new Date(2026, 9, 6, 12, 0, 0).getTime()
    USAGE.recordUsage(db, { ts: day, memberId: member.id, keyId: key.id, endpoint: "chat", provider: "mock", model: "m", status: "ok", promptTokens: 1, completionTokens: 2, totalTokens: 3, durationMs: 4 })
    USAGE.recordUsage(db, { ts: day + 1000, memberId: member.id, keyId: key.id, endpoint: "chat", provider: "mock", model: "m", status: "error", durationMs: 1 })
    const clean = AGG.reconcileUsage(db, { month: "2026-10" })
    assert.deepEqual([clean.daily.checked, clean.daily.drifted.length, clean.counters.drifted.length], [1, 0, 0])
    db.prepare("UPDATE usage_daily SET total_tokens = total_tokens + 5 WHERE provider = 'mock'").run() // 注入漂移
    const drifted = AGG.reconcileUsage(db, { month: "2026-10" })
    assert.equal(drifted.daily.drifted.length, 1)
    assert.deepEqual([drifted.daily.drifted[0].expected, drifted.daily.drifted[0].actual], [{ requests: 2, prompt_tokens: 1, completion_tokens: 2, total_tokens: 3, duration_ms: 5, errors: 1 }, { requests: 2, prompt_tokens: 1, completion_tokens: 2, total_tokens: 8, duration_ms: 5, errors: 1 }])
    assert.equal(AGG.reconcileUsage(db, { month: "2026-10", fix: true }).fixed, true)
    assert.deepEqual(AGG.reconcileUsage(db, { month: "2026-10" }).daily.drifted, [])
    db.close()
    // CLI：`usage reconcile [--month YYYY-MM] [--fix]`
    const plain = await runCli(["--config", configFile, "usage", "reconcile", "--month", "2026-10"])
    assert.equal(plain.code, 0, plain.err)
    assert.match(plain.out, /对账（2026-10）：usage_daily 比对 1 键 ∥ 漂移 0 行；quota_counters 比对 1 键 ∥ 漂移 0 行/)
    const bad = await runCli(["--config", configFile, "usage", "reconcile", "--month", "2026-1"])
    assert.equal(bad.code, 1)
    assert.match(bad.err, /--month 形非法/)
    const spawnDrift = DB.openDatabase(dbFile)
    spawnDrift.prepare("UPDATE usage_daily SET requests = requests + 3").run()
    spawnDrift.close()
    const found = await runCli(["--config", configFile, "usage", "reconcile", "--month=2026-10"])
    assert.match(found.out, /漂移 1 行/)
    assert.equal((await runCli(["--config", configFile, "usage", "reconcile", "--month", "2026-10", "--fix"])).code, 0)
    assert.match((await runCli(["--config", configFile, "usage", "reconcile"])).out, /漂移 0 行/) // 缺省月 = 当本月（本档行在 2026-10）
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ⑥ 端到端（真 HTTP——AC-21 全链）──────────────────────────────────────────

test("⑥ 端到端：平台层热生效 ⇒ 429 ∥ 成员覆盖 ⇒ 放行 ∥ 删覆盖 ⇒ 回落 ∥ 嵌入零检查 ∥ 404 先于 429 ∥ 旧端点 404", async () => {
  const mock = await startMockUpstream({ totalTokens: 7 })
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: configWith(mock.base) })
  try {
    const admin = await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(db)
    const key = KEYS.issueKey(db, alice.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const aliceSession = await login(app.base, "alice", PASSWORD)
    const chat = (plain = key.plain) => post(app.base, "/v1/chat/completions", { headers: { authorization: `Bearer ${plain}` }, body: { model: "mock/mock-chat", messages: [] } })
    // 覆盖端点判权：user ⇒ 403 ∥ 无会话 ⇒ 401
    assert.equal((await post(app.base, MEMBER_QUOTA_URL(alice.id), { cookie: aliceSession.cookie, body: { quotas: {} } })).status, 403)
    assert.equal((await post(app.base, MEMBER_QUOTA_URL(alice.id), { body: { quotas: {} } })).status, 401)
    // 平台层：PATCH settings `quotaTokens` = 5（热生效）
    const providers = (await get(app.base, "/api/admin/providers", { cookie: adminSession.cookie })).json.providers
    const settings = { "mock-chat": { rpm: null, tpm: null, costIn: null, costOut: null, note: null, quotaTokens: 5 } }
    assert.equal((await call(app.base, "PATCH", `/api/admin/providers/${providers[0].id}`, { cookie: adminSession.cookie, body: { settings } })).status, 200)
    assert.deepEqual((await get(app.base, "/api/admin/providers", { cookie: adminSession.cookie })).json.providers[0].settings, settings)
    assert.equal((await chat()).status, 200) // 第 1 笔：已用 0 < 5 ⇒ 放行（记 7 tokens）
    const denied = await chat()
    assert.deepEqual([denied.status, denied.json.error.code], [429, "quota_exceeded"])
    assert.match(denied.json.error.message, /模型 mock\/mock-chat/); assert.match(denied.json.error.message, /已用 7 \/ 额度 5/)
    assert.equal(mock.requests.length, 1, "429 不转发（派发命中后/转发前）")
    // 嵌入零检查（配额零涉——计量照记）
    const embedded = await post(app.base, "/v1/embeddings", { headers: { authorization: `Bearer ${key.plain}` }, body: { model: "bge-m3", input: "hi" } })
    assert.equal(embedded.status, 200)
    // 404 先于 429-quota（裸名不解析 ⇒ 派发未命中）
    assert.deepEqual([(await post(app.base, "/v1/chat/completions", { headers: { authorization: `Bearer ${key.plain}` }, body: { model: "mock-chat", messages: [] } })).status, (await post(app.base, "/v1/chat/completions", { headers: { authorization: `Bearer ${key.plain}` }, body: { model: "ghost/m", messages: [] } })).status], [404, 404])
    // 成员覆盖（键级合并）⇒ 放行；null 删键 ⇒ 回落平台（429）
    assert.deepEqual((await post(app.base, MEMBER_QUOTA_URL(alice.id), { cookie: adminSession.cookie, body: { quotas: { "mock/mock-chat": 100 } } })).json, { id: alice.id, modelQuotas: { "mock/mock-chat": 100 } })
    assert.equal((await chat()).status, 200)
    assert.deepEqual((await post(app.base, MEMBER_QUOTA_URL(alice.id), { cookie: adminSession.cookie, body: { quotas: { "mock/mock-chat": null } } })).json.modelQuotas, {})
    assert.equal((await chat()).status, 429)
    // 旧额度端点退役（404）∥ `/api/me` 行形（`modelQuotas` + 日表月累计）
    assert.equal((await post(app.base, `/api/members/${alice.id}/quota`, { cookie: adminSession.cookie, body: { quotaTokens: 1 } })).status, 404)
    const me = (await get(app.base, "/api/me", { cookie: aliceSession.cookie })).json
    assert.deepEqual(Object.keys(me).sort(), ["id", "keys", "modelDisables", "modelQuotas", "modelUsage", "name", "role", "usedTokens", "username"])
    assert.equal(me.usedTokens, 21) // 日表月累计（3 笔 × 7 tokens = 21；429 笔零落行）
    assert.deepEqual(me.modelQuotas, {})
    assert.deepEqual(me.modelUsage, { "mock/mock-chat": 14, "bge-m3": 7 }) // 逐模型已用（当月——配额 v2 批读面）
    assert.deepEqual(me.modelDisables, {}) // 禁用集缺省 = 默认全可用
    // 汇表面 API 形零变（四字段）
    const summary = (await get(app.base, "/api/usage/summary", { cookie: adminSession.cookie })).json
    assert.deepEqual(Object.keys(summary).sort(), ["byMember", "byModel", "totals", "trend"])
    assert.deepEqual(summary.byModel, [{ model: "mock/mock-chat", requests: 2, totalTokens: 14 }, { model: "bge-m3", requests: 1, totalTokens: 7 }])
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ⑦ 门禁清单（`prepublishOnly` 三十一件含本批件 ∥ 清单在盘）──────────────────

test("⑦ 门禁清单：`prepublishOnly` 三十一件含本批件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 32, `门禁清单件数（二十六 ⇒ 三十二——结构轮批件入链 ∥ 10-09 bin 修复批件入链 ∥ 10-09 控制台测试 key 修复批件入链 ∥ 10-09 清除批件入链 ∥ 10-09 代理批件入链 ∥ 10-09 配置控制台批件入链）：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-07-quota-per-model.test.mjs"), "本批件应入列")
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
