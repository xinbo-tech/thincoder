/**
 * 2026-10-06-console-completeness-2.test.mjs — thincoder-server 批内单测件（控制台可见面六面·AC-15 判据载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-completeness-2.test.mjs`
 *
 * 射程（判据源 = 七条：`store/STORE.md` §3 + AC-15①–⑥；腿 ↔ 轴对照在括号）：
 *   ① store v3 迁移（STORE §3：空库直落 ∥ v2 旧库升 ∥ 幂等 ∥ 九型 CHECK）② 审计 = AC-15④（九型写入实走：HTTP ∥ CLI ∥ 列表/
 *   过滤/判权 ∥ 保留清理）③ 报表 = AC-15②（summary 同源/趋势零填充/聚合排行 ∥ CSV ∥ key 归因 = AC-15⑥）④ 总览 = AC-15③
 *   （数值形 ∥ 同源 ∥ 空集零）⑤ 向量面 = AC-15①（真值零密钥 ∥ 四 kind ∥ system 两角色 ∥ /v1/models 同源）⑥ 静态面 + 健康 = AC-15⑤
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const BIN_PATH = join(ROOT, "thincoder-server", "bin", "thincoder-server.mjs")

const [CONFIG, DB, SERVER, GATEWAY, SYSTEM, EMBEDDING, OVERVIEW, STATIC] = await Promise.all([
  "ops/config.mjs", "store/db.mjs", "gateway/server.mjs", "gateway/routes.mjs",
  "gateway/system.mjs", "gateway/embedding-admin.mjs", "gateway/overview.mjs", "webui/static.mjs",
].map((rel) => load(`thincoder-server/src/${rel}`)))
const [AUDIT, ACCOUNTS, ADMINS, MEMBERS, KEYS, METERING, USAGE, CLI] = await Promise.all([
  "accounts/audit.mjs", "accounts/routes.mjs", "accounts/routes-admin.mjs", "accounts/members.mjs",
  "accounts/keys.mjs", "metering/routes.mjs", "metering/usage.mjs", "ops/cli.mjs",
].map((rel) => load(`thincoder-server/src/${rel}`)))
const [NAV, { ZH }, { EN }] = await Promise.all(
  ["nav.mjs", "i18n-zh.mjs", "i18n-en.mjs"].map((name) => load(`thincoder-server/public/${name}`)),
)

const PASSWORD = "password-123"
const NEW_PASSWORD = "password-456"
const ENGINE_KEY = "sk-engine-secret"
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const SELF_NAMES = ["lang.zh", "lang.en"] // 自称名族（仅 zh 表载体——切换器固定取 zh 表）
const KEY_NS = /^(app|common|col|denied|nav|lang|login|me|admin|system|vector|health|overview|usageReport|audit|usage|err)\./
const CSV_HEADER = "ts,member,key_hint,endpoint,model,status,stream,prompt_tokens,completion_tokens,total_tokens,duration_ms"
const countUsage = (db) => Number(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n)
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const dayKey = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }

// ── 夹具与助手 ───────────────────────────────────────────────────────────────

function configWith({ baseURL = "http://127.0.0.1:9/v1", model = "bge-m3", apiKey = "", providers = [] } = {}) {
  return CONFIG.validateConfig({ host: "127.0.0.1", providers, embedding: { baseURL, model, apiKey } })
}

/** 进程内装配（六族注册行 + 真 `public/` 静态面——等价 bin 接线；向量面注入口径 = `fetchImpl` ∥ `timeoutMs`）。 */
async function startApp({ db, config, fetchImpl = null, timeoutMs = 0, sysOver = {} } = {}) {
  const routes = SERVER.createRouteTable()
  GATEWAY.registerGatewayRoutes(routes, { db, config })
  ACCOUNTS.registerAccountRoutes(routes, { db })
  ADMINS.registerAdminRoutes(routes, { db })
  METERING.registerMeteringRoutes(routes, { db })
  SYSTEM.registerSystemRoutes(routes, { db, embedding: config.embedding, ...sysOver })
  OVERVIEW.registerOverviewRoutes(routes, { db })
  EMBEDDING.registerEmbeddingAdminRoutes(routes, { db, config, ...(fetchImpl ? { fetchImpl } : {}), ...(timeoutMs ? { timeoutMs } : {}) })
  const server = SERVER.createGatewayServer({ config, routes, staticSite: STATIC.createStaticSite() })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

async function call(base, method, path, { body, cookie, key } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie; if (key) headers.authorization = `Bearer ${key}`
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, headers: res.headers, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}
const get = (base, path, opts) => call(base, "GET", path, opts)

async function login(base, username, password = PASSWORD) {
  const res = await call(base, "POST", "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith("tc_session="))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}

async function makeMember(db, username, role = "user") {
  const { member } = await MEMBERS.createMember(db, { username, role, password: PASSWORD })
  return member
}

function spawnNode(args) {
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
  let stdout = "", stderr = ""
  child.stdout.on("data", (d) => { stdout += d })
  child.stderr.on("data", (d) => { stderr += d })
  return { child, exited: new Promise((resolve) => child.on("exit", (code) => resolve(code))), out: () => stdout, err: () => stderr }
}

async function waitFor(predicate, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (predicate() || Date.now() > deadline) return predicate()
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

async function freePort() {
  const probe = createNetServer()
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve))
  const { port } = probe.address()
  await new Promise((resolve) => probe.close(resolve))
  return port
}

const writeConfig = (dir, config) => { const file = join(dir, "config.json"); writeFileSync(file, JSON.stringify(config, null, 2)); return file }

/** 用量夹具（跨两日 ∥ 两模型 ∥ 两成员 ∥ 一行 NULL token）：今日 3 行（120 tokens）+ 昨日 1 行（200）。 */
function seedUsage(db, alice, bob, aKey, bKey) {
  const today = USAGE.localDayStart(Date.now(), 0)
  const yesterday = USAGE.localDayStart(Date.now(), -1)
  USAGE.recordUsage(db, { ts: today + 1000, memberId: alice.id, keyId: aKey, endpoint: "chat", provider: "prov", model: "a", status: "ok", promptTokens: 60, completionTokens: 40, totalTokens: 100, durationMs: 120 })
  USAGE.recordUsage(db, { ts: today + 2000, memberId: alice.id, keyId: aKey, endpoint: "embeddings", provider: "", model: "bge-m3", status: "ok", promptTokens: 20, completionTokens: 0, totalTokens: 20, durationMs: 50 })
  USAGE.recordUsage(db, { ts: today + 3000, memberId: bob.id, keyId: bKey, endpoint: "chat", provider: "prov", model: "a", status: "error", durationMs: 30 })
  USAGE.recordUsage(db, { ts: yesterday + 1000, memberId: alice.id, keyId: aKey, endpoint: "chat", provider: "prov", model: 'b, "x"', status: "ok", promptTokens: 120, completionTokens: 80, totalTokens: 200, durationMs: 80 })
}

/** 明细归并（同源断言用——降序 = tokens DESC ∥ 名称 ASC；`null` token 计 0；`key` = 输出键名）。 */
function fold(rows, pick, key = "name") {
  const map = new Map()
  for (const row of rows) {
    const name = pick(row)
    const entry = map.get(name) ?? { requests: 0, totalTokens: 0 }
    map.set(name, { requests: entry.requests + 1, totalTokens: entry.totalTokens + (row.totalTokens ?? 0) })
  }
  return [...map.entries()]
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens || a[0].localeCompare(b[0]))
    .map(([name, entry]) => ({ [key]: name, ...entry }))
}

// ── ① store v3 迁移链（STORE §3 判据）────────────────────────────────────────

test("① store：空库直落 8 ∥ v2 旧库自动升（链尾）∥ 幂等 ∥ audit_events 九型 CHECK", () => {
  const dir = mkdtempSync(join(tmpdir(), "tc2-db-"))
  const file = join(dir, "gateway.db")
  try {
    // 空库直落（六索引——含 v3 三索引）∥ 九型 CHECK 全可插 + 枚举外拒
    const fresh = DB.openDatabase(":memory:")
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [8, 8])
    const indexes = fresh.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'").all().map((row) => row.name)
    for (const index of ["idx_audit_ts", "idx_audit_type_ts", "idx_usage_key_ts"]) assert.ok(indexes.includes(index), index)
    assert.equal(indexes.length, 6)
    for (const type of AUDIT.AUDIT_TYPES) AUDIT.recordAudit(fresh, { type, actor: "t", ts: 1 })
    assert.equal(AUDIT.queryAudit(fresh, { limit: 100 }).length, 9)
    assert.throws(() => AUDIT.recordAudit(fresh, { type: "nope", actor: "t" }), /审计类型非法/)
    // 保留清理（注入时钟）：窗外删 ∥ 窗内留 ∥ null = 不限（零删）
    const now = Date.now()
    AUDIT.recordAudit(fresh, { type: "login_success", actor: "t2", ts: now })
    assert.equal(AUDIT.pruneAuditEvents(fresh, { now: now + 2 * 24 * 60 * 60 * 1000, retentionDays: 2 }), 9)
    assert.deepEqual(AUDIT.queryAudit(fresh, {}).map((event) => event.actor), ["t2"])
    assert.equal(AUDIT.pruneAuditEvents(fresh, { now: now + 4 * 24 * 60 * 60 * 1000, retentionDays: null }), 0)
    assert.throws(() => fresh.prepare("INSERT INTO audit_events (ts, type, actor_name) VALUES (1, 'nope', 't')").run(), /CHECK/i)
    fresh.close()
    // v2 旧库（v1+v2 段）⇒ 启动自动升 8（旧数据保留）⇒ 再开幂等
    const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 2) })
    assert.equal(DB.readVersion(legacy), 2)
    legacy.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('old', 'old', 'scrypt$fixture', '2026-10-06')")
    legacy.close()
    const upgraded = DB.openDatabase(file)
    assert.equal(DB.readVersion(upgraded), 8)
    assert.ok(upgraded.prepare("SELECT name FROM sqlite_master WHERE name = 'audit_events'").get())
    assert.deepEqual([upgraded.prepare("SELECT COUNT(*) AS n FROM members").get().n, DB.migrate(upgraded)], [1, 8])
    assert.equal(upgraded.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'").get().n, 6)
    upgraded.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ② 审计（九型写入点实走 + GET /api/audit）─────────────────────────────────

test("② 审计：九型写入点（HTTP ∥ CLI）落库 ∥ /api/audit 列表/过滤/判权", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc2-audit-"))
  const dbFile = join(dir, "gateway.db")
  let cli = null
  try {
    const db = DB.openDatabase(dbFile)
    await makeMember(db, "admin", "admin")
    const alice = await makeMember(db, "alice")
    KEYS.issueKey(db, alice.id) // 轮换前旧 key（直发——不入审计）
    AUDIT.recordAudit(db, { type: "login_success", actor: "probe-gone", ts: Date.now() - 10 * 24 * 60 * 60 * 1000 }) // 窗外（启动清理删）
    AUDIT.recordAudit(db, { type: "login_success", actor: "probe-keep", ts: Date.now() - 60 * 60 * 1000 }) // 窗内（保留）
    db.close()
    const port = await freePort()
    const cfgPath = writeConfig(dir, { host: "127.0.0.1", port, db: dbFile, autoUpdate: false, usageRetentionDays: 5, embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" } })
    cli = spawnNode([BIN_PATH, "--config", cfgPath]) // 真服务端（bin 装配——`onLock` 审计接线同拍）
    assert.ok(await waitFor(() => cli.out().includes('"event":"ready"')), `未见就绪日志：${cli.out()} ${cli.err()}`)
    const base = `http://127.0.0.1:${port}`
    const before = Date.now()
    const admin1 = await login(base, "admin") // login_success（admin）
    const alice1 = await login(base, "alice") // login_success（alice）
    assert.deepEqual([admin1.res.status, alice1.res.status], [200, 200])
    assert.deepEqual([(await get(base, "/api/audit")).status, (await get(base, "/api/audit", { cookie: alice1.cookie })).status], [401, 403]) // 判权三态（admin 200 见下）
    // login_failure（成员存在 ⇒ actorId）∥ login_locked（5 连败置锁 ⇒ 第 6 次 429 + Retry-After）
    assert.equal((await login(base, "alice", "wrong-password")).res.status, 401)
    for (let i = 0; i < 5; i++) assert.equal((await login(base, "ghost", "nope")).res.status, 401)
    const locked = await login(base, "ghost", "nope")
    assert.deepEqual([locked.res.status, Number(locked.res.headers.get("retry-after")) >= 890], [429, true])
    // 本人写点（key_rotate ∥ password_change）+ 管理写点（key_revoke ∥ password_reset ∥ member_create）
    assert.equal((await call(base, "POST", "/api/me/keys/rotate", { cookie: alice1.cookie })).status, 200)
    assert.equal((await call(base, "POST", "/api/me/password", { cookie: alice1.cookie, body: { oldPassword: PASSWORD, newPassword: NEW_PASSWORD } })).status, 200)
    const aliceRow = (await get(base, "/api/members", { cookie: admin1.cookie })).json.members.find((member) => member.username === "alice")
    assert.equal(aliceRow.keys.length, 1) // 轮换后仅一枚 active
    assert.equal((await call(base, "POST", `/api/members/${alice.id}/keys/${aliceRow.keys[0].id}/revoke`, { cookie: admin1.cookie })).status, 200)
    assert.equal((await call(base, "POST", `/api/members/${alice.id}/password-reset`, { cookie: admin1.cookie })).status, 200)
    const bobCreate = await call(base, "POST", "/api/members", { cookie: admin1.cookie, body: { username: "bob", name: "bob" } })
    assert.equal(bobCreate.status, 200)
    const bobId = bobCreate.json.id
    // CLI 四命令（同库同语义——`actor = "cli"`）
    const out = []
    const cliRun = (args) => CLI.runCli(["--config", cfgPath, ...args], { stdout: { write: (text) => out.push(text) }, stderr: { write: (text) => out.push(text) } })
    assert.deepEqual([await cliRun(["member", "add", "carol", "--password", PASSWORD]), await cliRun(["key", "issue", "alice"])], [0, 0])
    const issuedId = Number(out.join("").match(/key 已签发：id=(\d+)/)?.[1])
    assert.ok(Number.isInteger(issuedId), out.join(""))
    assert.equal(await cliRun(["key", "revoke", String(issuedId)]), 0)
    assert.equal(await cliRun(["member", "passwd", "bob", "--password", NEW_PASSWORD]), 0)
    const after = Date.now()
    // 列表：九型行在场 ∥ 倒序 ∥ 行形 ∥ 各型 detail 归位
    const list = await get(base, "/api/audit", { cookie: admin1.cookie })
    const events = list.json.events
    assert.deepEqual([list.status, events.length], [200, 19])
    assert.deepEqual(events.filter((event) => event.actor.startsWith("probe-")).map((event) => event.actor), ["probe-keep"]) // 启动清理：同窗（config 5 天）窗外删
    for (const type of AUDIT.AUDIT_TYPES) assert.ok(events.some((event) => event.type === type), `缺型：${type}`)
    for (let i = 1; i < events.length; i++) {
      assert.ok(events[i - 1].ts > events[i].ts || (events[i - 1].ts === events[i].ts && events[i - 1].id > events[i].id), "倒序破")
    }
    for (const event of events) assert.deepEqual(Object.keys(event).sort(), ["actor", "actorId", "detail", "id", "target", "targetId", "ts", "type"])
    const at = (type, actor) => events.find((event) => event.type === type && (actor === undefined || event.actor === actor))
    assert.deepEqual([at("login_success", "alice").actorId, typeof at("login_success", "alice").detail.ip], [alice.id, "string"])
    assert.deepEqual([at("login_failure", "alice").actorId, at("login_failure", "ghost").actorId], [alice.id, null])
    assert.deepEqual([at("login_locked").actor, at("login_locked").detail.dimension, at("login_locked").detail.retryAfterS >= 890], ["ghost", "username", true])
    assert.match(at("key_rotate").detail.keyHint, /^sk-tc-/)
    const revokeCli = events.find((event) => event.type === "key_revoke" && event.actor === "cli")
    assert.deepEqual([revokeCli.actorId, revokeCli.target], [null, "alice"])
    assert.match(revokeCli.detail.keyHint, /^sk-tc-/)
    assert.equal(events.find((event) => event.type === "password_reset" && event.actor === "cli").target, "bob")
    assert.equal(events.find((event) => event.type === "member_create" && event.actor === "cli").target, "carol")
    assert.deepEqual([at("key_issue").actor, at("key_issue").target], ["cli", ""])
    // 过滤三轴（type ∥ member（id ∥ 展示名）∥ 时段）+ limit + 非法值
    const q = (query) => get(base, `/api/audit?${query}`, { cookie: admin1.cookie })
    assert.equal((await q("type=login_failure")).json.events.length, 6)
    assert.deepEqual([(await q(`member=${alice.id}`)).json.events.length, (await q("member=alice")).json.events.length, (await q(`member=${bobId}`)).json.events.length], [7, 7, 2])
    assert.deepEqual([(await q(`from=${before}&to=${after + 1000}`)).json.events.length, (await q(`to=${before - 1}`)).json.events.length, (await q(`from=${after + 60000}`)).json.events.length], [18, 1, 0])
    assert.deepEqual((await q("limit=3")).json.events.map((event) => event.id), events.slice(0, 3).map((event) => event.id))
    assert.deepEqual([(await q("type=bogus")).status, (await q("limit=0")).status], [400, 400])
  } finally {
    if (cli) {
      cli.child.kill()
      await cli.exited
    }
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ③ 用量报表与导出 ─────────────────────────────────────────────────────────

test("③ 报表：summary 同源/趋势零填充/聚合排行 ∥ export CSV（表头/行数/空单元/BOM）∥ 四读同门", async () => {
  const db = DB.openDatabase(":memory:")
  const alice = await makeMember(db, "alice")
  const bob = await makeMember(db, "bob")
  await makeMember(db, "admin", "admin")
  const aKey = KEYS.issueKey(db, alice.id).id
  const aKey2 = KEYS.issueKey(db, alice.id).id // 第二枚（从未使用——AC-15⑥ null/0 分支 + key 级归因）
  const bKey = KEYS.issueKey(db, bob.id).id
  seedUsage(db, alice, bob, aKey, bKey)
  const app = await startApp({ db, config: configWith() })
  try {
    const admin1 = await login(app.base, "admin")
    const alice1 = await login(app.base, "alice")
    const summary = await get(app.base, "/api/usage/summary", { cookie: admin1.cookie })
    assert.deepEqual([summary.status, summary.json.totals], [200, { requests: 4, totalTokens: 320 }])
    // trend：30 槽零填充全序列（末槽 = 今日；倒数第二 = 昨日；余槽全零）
    assert.equal(summary.json.trend.length, USAGE.USAGE_SUMMARY_DAYS)
    assert.deepEqual(summary.json.trend.at(-1), { day: dayKey(Date.now()), requests: 3, totalTokens: 120 })
    assert.deepEqual([summary.json.trend.at(-2).requests, summary.json.trend.at(-2).totalTokens], [1, 200])
    assert.ok(summary.json.trend.slice(0, -2).every((slot) => slot.requests === 0 && slot.totalTokens === 0))
    assert.deepEqual(summary.json.byModel, [
      { model: 'prov/b, "x"', requests: 1, totalTokens: 200 }, { model: "prov/a", requests: 2, totalTokens: 100 }, { model: "bge-m3", requests: 1, totalTokens: 20 },
    ])
    assert.deepEqual(summary.json.byMember, [
      { member: "alice", requests: 3, totalTokens: 320 }, { member: "bob", requests: 1, totalTokens: 0 },
    ])
    // 同源：明细归并逐值 = 报表（同一过滤构建器）；endpoint 过滤四读同门
    const detail = await get(app.base, "/api/usage?limit=500", { cookie: admin1.cookie })
    assert.deepEqual(fold(detail.json.rows, (row) => row.model, "model"), summary.json.byModel)
    assert.deepEqual(fold(detail.json.rows, (row) => row.member, "member"), summary.json.byMember)
    assert.deepEqual([detail.json.rows.length, detail.json.rows.reduce((n, row) => n + (row.totalTokens ?? 0), 0)], [4, 320])
    const embeddings = await get(app.base, "/api/usage/summary?endpoint=embeddings", { cookie: admin1.cookie })
    assert.deepEqual(embeddings.json.totals, { requests: 1, totalTokens: 20 })
    const embDetail = await get(app.base, "/api/usage?endpoint=embeddings", { cookie: admin1.cookie })
    assert.deepEqual(fold(embDetail.json.rows, (row) => row.model, "model"), embeddings.json.byModel)
    assert.equal((await get(app.base, "/api/me/usage?endpoint=chat", { cookie: alice1.cookie })).json.rows.length, 2)
    const meKeys = (await get(app.base, "/api/me", { cookie: alice1.cookie })).json.keys // key 归因（单源 = memberView）：同形 + 逐值（MAX(ts) ∥ 30 天 SUM ∥ 从未使用 ⇒ null/0）
    const memberKeys = (await get(app.base, "/api/members", { cookie: admin1.cookie })).json.members.find((member) => member.username === "alice").keys
    assert.deepEqual(meKeys, memberKeys, "两路同形（memberView 单源——me-keys 批 += name/createdAt）")
    assert.deepEqual(memberKeys.map(({ id, name, hint, lastUsedAt, windowTokens }) => ({ id, name, hint, lastUsedAt, windowTokens })), [
      { id: aKey, name: "key-1", hint: memberKeys[0].hint, lastUsedAt: USAGE.localDayStart(Date.now(), 0) + 2000, windowTokens: 320 },
      { id: aKey2, name: "key-2", hint: memberKeys[1].hint, lastUsedAt: null, windowTokens: 0 },
    ])
    for (const key of memberKeys) assert.equal(typeof key.createdAt, "string")
    for (const path of ["/api/usage?endpoint=audio", "/api/me/usage?endpoint=audio", "/api/usage/summary?endpoint=audio", "/api/usage/export?endpoint=audio"]) {
      const bad = await get(app.base, path, { cookie: admin1.cookie })
      assert.deepEqual([bad.status, bad.json.error.code], [400, "invalid_request_error"], path)
    }
    // 判权三态（summary ∥ export：无会话 401 ∥ user 403；admin 200 见上）
    for (const path of ["/api/usage/summary", "/api/usage/export"]) {
      assert.deepEqual([(await get(app.base, path)).status, (await get(app.base, path, { cookie: alice1.cookie })).status], [401, 403])
    }
    // 导出：表头逐字 ∥ 行数 = 过滤行数 ∥ CRLF ∥ BOM（原始字节）∥ ISO ts ∥ NULL token 空单元 ∥ attachment
    const csvRes = await fetch(`${app.base}/api/usage/export`, { headers: { cookie: admin1.cookie } })
    assert.match(csvRes.headers.get("content-type"), /text\/csv; charset=utf-8/)
    assert.equal(csvRes.headers.get("content-disposition"), 'attachment; filename="usage.csv"')
    const raw = Buffer.from(await csvRes.arrayBuffer())
    assert.deepEqual([...raw.subarray(0, 3)], [0xef, 0xbb, 0xbf])
    const lines = raw.subarray(3).toString("utf8").split("\r\n")
    assert.deepEqual([lines.length, lines[0]], [6, CSV_HEADER]) // 表头 + 4 行 + 尾空段
    const cells = (i) => lines[i].split(",")
    assert.equal(cells(1)[0], new Date(detail.json.rows[0].ts).toISOString()) // 倒序同明细
    assert.deepEqual(cells(1).slice(3, 6), ["chat", "prov/a", "error"])
    assert.deepEqual(cells(1).slice(7, 10), ["", "", ""]) // NULL token ⇒ 空单元格
    assert.ok(lines[4].endsWith(",120,80,200,80"), "昨日行 token 列逐值")
    assert.ok(lines[4].includes('"prov/b, ""x"""'), "RFC 4180 转义（逗号 + 引号）")
    // 空集 ⇒ 仅表头（零错）∥ summary 空态零 ∥ 导出行数上限（常量注入口径）⇒ 400「收窄时段」
    const empty = await get(app.base, "/api/usage/summary?model=nope", { cookie: admin1.cookie })
    assert.deepEqual([empty.json.totals, empty.json.byModel], [{ requests: 0, totalTokens: 0 }, []])
    assert.ok(empty.json.trend.every((slot) => slot.requests === 0 && slot.totalTokens === 0))
    assert.equal((await get(app.base, "/api/usage/export?model=nope", { cookie: admin1.cookie })).text.split("\r\n").filter(Boolean).length, 1)
    assert.throws(() => USAGE.exportUsageRows(db, { max: 3 }), /收窄时段/)
  } finally {
    await app.close()
    db.close()
  }
})

// ── ④ 管理总览 ───────────────────────────────────────────────────────────────

test("④ 总览：数值形（与报表同源）∥ 空集零 ∥ 判权三态", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, "admin", "admin")
  const alice = await makeMember(db, "alice")
  const bob = await makeMember(db, "bob")
  const aKey = KEYS.issueKey(db, alice.id).id
  const bKey = KEYS.issueKey(db, bob.id).id
  const app = await startApp({ db, config: configWith() })
  try {
    const admin1 = await login(app.base, "admin")
    const alice1 = await login(app.base, "alice")
    assert.deepEqual([(await get(app.base, "/api/overview")).status, (await get(app.base, "/api/overview", { cookie: alice1.cookie })).status], [401, 403])
    const blank = await get(app.base, "/api/overview", { cookie: admin1.cookie }) // 空集 ⇒ 0（零错）
    assert.deepEqual(blank.json, { today: { requests: 0, totalTokens: 0 }, members: { count: 3 } })
    // 注入行集 ⇒ 数值逐值（今日窗）∥ 与报表同日窗同源（trend 末槽 ∥ usageTotals 直调）
    seedUsage(db, alice, bob, aKey, bKey)
    const overview = await get(app.base, "/api/overview", { cookie: admin1.cookie })
    assert.deepEqual(overview.json, { today: { requests: 3, totalTokens: 120 }, members: { count: 3 } })
    const last = (await get(app.base, "/api/usage/summary", { cookie: admin1.cookie })).json.trend.at(-1)
    assert.deepEqual([{ requests: last.requests, totalTokens: last.totalTokens }, USAGE.usageTotals(db, { from: USAGE.localDayStart(Date.now(), 0) })], [overview.json.today, overview.json.today])
  } finally {
    await app.close()
    db.close()
  }
})

// ── ⑤ 向量面（配置真值 ∥ 试跑四 kind ∥ 同源）────────────────────────────────

test("⑤ 向量面：真值零密钥 ∥ 试跑成功 + 四 kind ∥ 不落库不计量 ∥ /api/system 两角色 ∥ /v1/models 同源", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, "admin", "admin")
  db.prepare("UPDATE members SET model_quotas_json = ? WHERE username = 'admin'").run(JSON.stringify({ "any/model": 0 })) // 配额零涉（试跑面不经配额准入）
  const alice = await makeMember(db, "alice")
  const teamKey = KEYS.issueKey(db, alice.id)
  const config = configWith({ baseURL: "http://engine.test/v1", model: "bge-m3", apiKey: ENGINE_KEY })
  const calls = []
  let engine = null
  const fetchImpl = (url, opts) => { calls.push({ url, opts }); return engine(url, opts) }
  const app = await startApp({ db, config, fetchImpl, timeoutMs: 50 })
  try {
    const admin1 = await login(app.base, "admin")
    const alice1 = await login(app.base, "alice")
    assert.deepEqual([(await get(app.base, "/api/admin/embedding")).status, (await get(app.base, "/api/admin/embedding", { cookie: alice1.cookie })).status], [401, 403]) // 判权三态 + 真值（零密钥）见下
    const truth = await get(app.base, "/api/admin/embedding", { cookie: admin1.cookie })
    assert.deepEqual([truth.status, truth.json, truth.text.includes("apiKey") || truth.text.includes(ENGINE_KEY)], [200, { baseURL: "http://engine.test/v1", model: "bge-m3" }, false])
    // 试跑成功：服务端代发（命中引擎 `/embeddings`）∥ key 代持 ∥ 内置探针文本 ∥ 不落库不计量
    engine = () => new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }] }), { status: 200 })
    const ok = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin1.cookie, body: {} })
    assert.deepEqual([ok.status, ok.json.ok, ok.json.dimensions, Number.isFinite(ok.json.ms)], [200, true, 3, true])
    assert.deepEqual([calls.at(-1).url, calls.at(-1).opts.headers.authorization, JSON.parse(calls.at(-1).opts.body)], ["http://engine.test/v1/embeddings", `Bearer ${ENGINE_KEY}`, { model: "bge-m3", input: "ping" }])
    // 失败四 kind（自含形 200——超时 ∥ 不可达 ∥ HTTP 非 2xx ∥ 响应形不符）+ 自定义文本透传
    const failures = [
      ["timeout", (url, opts) => new Promise((_, reject) => { opts.signal.addEventListener("abort", () => reject(new TypeError("The operation was aborted"))) })],
      ["unreachable", () => { throw new TypeError("fetch failed") }],
      ["http_error", () => new Response("engine boom", { status: 502 })],
      ["bad_response", () => new Response("not-json", { status: 200 })],
    ]
    for (const [kind, impl] of failures) {
      engine = impl
      const res = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin1.cookie, body: { text: "你好" } })
      assert.deepEqual([res.status, res.json.ok, res.json.error.kind, res.json.error.message.length > 0], [200, false, kind, true], kind)
    }
    engine = () => new Response(JSON.stringify({ data: [{}] }), { status: 200 })
    assert.equal((await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin1.cookie, body: { text: "你好" } })).json.error.kind, "bad_response")
    assert.ok(calls.slice(1).every((item) => JSON.parse(item.opts.body).input === "你好"))
    assert.equal(countUsage(db), 0) // 不落库不计量（全链零 usage 行）
    // /api/system：两角色 200 ∥ embedding.model ∥ 零地址零密钥
    assert.equal((await get(app.base, "/api/system")).status, 401)
    for (const [who, session] of [["admin", admin1], ["user", alice1]]) {
      const res = await get(app.base, "/api/system", { cookie: session.cookie })
      assert.deepEqual([res.status, res.json.embedding.model, "baseURL" in res.json.embedding, res.text.includes("engine.test") || res.text.includes(ENGINE_KEY), Object.keys(res.json).sort().join()], [200, "bge-m3", false, false, "embedding,update,version"], who)
    }
    // /v1/models 同源（引擎模型在场——单源 = config.embedding.model）
    const models = await get(app.base, "/v1/models", { key: teamKey.plain })
    assert.deepEqual([models.status, models.json.data.at(-1).id, models.json.data.at(-1).owned_by], [200, "bge-m3", "embedding"])
  } finally {
    await app.close()
    db.close()
  }
})

// ── ⑥ 前端静态面 + nav 直驱 + 健康三态 ───────────────────────────────────────

test("⑥ 静态面：档目 19 ∥ 20 ∥ 零外链 ∥ 两表键集/键引用闭合 ∥ nav 直驱 ∥ 三新档直发 ∥ 健康三态", async () => {
  // 档目（UI 代码档 19 ∥ 含 favicon 全目录 20——配置面批后）+ 零外链（零 http(s):// ∥ 零 @import）
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [20, 19])
  assert.deepEqual(names, [
    "app.mjs", "favicon.png", "i18n-en.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css",
    "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-system.mjs", "views-usage.mjs",
  ])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  // 两表基键集相等（除自称名族 + `.one` 变体族——KD-SV-44）∥ en 零 CJK ∥ 占位符逐键一致 ∥ 本批键族在场
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one")) // `.one` 变体族 = 仅 en 表载体（KD-SV-44）
  for (const key of zhKeys.filter((key) => !SELF_NAMES.includes(key))) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  for (const key of enBase) assert.ok(key in ZH, `en 表多出键：${key}`)
  for (const key of SELF_NAMES) assert.ok(!(key in EN), `自称名族不得入 en 表：${key}`)
  assert.equal(zhKeys.length - SELF_NAMES.length, enBase.length)
  for (const key of enBase) assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  const family = (prefix) => zhKeys.filter((key) => key.startsWith(prefix)).length
  for (const [prefix, count] of [["vector.", 20], ["health.", 10], ["overview.", 8], ["usageReport.", 14], ["audit.", 27]]) assert.equal(family(prefix), count, prefix)
  for (const key of ["nav.page.admin.overview", "nav.page.admin.audit", "me.keys.lastUsed", "me.keys.neverUsed", "me.keys.windowTokens"]) assert.ok(key in ZH && key in EN, key)
  for (const type of AUDIT.AUDIT_TYPES) assert.ok(`audit.type.${type}` in ZH && `audit.type.${type}` in EN, type)
  // 键引用闭合：`t("…")` 字面量 ⊆ 表键 ∥ 裸命名空间键（点分键面）
  const refs = []
  for (const name of names.filter((name) => name.endsWith(".mjs") && !["i18n-zh.mjs", "i18n-en.mjs"].includes(name))) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/["']([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)["']/g)) if (KEY_NS.test(match[1])) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 200, `键引用过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  // nav 直驱（管理 7 ∥ `#/admin` 重定向同指 ∥ 默认页 ∥ denied）
  const [me, adminGroup] = NAV.NAV_GROUPS
  assert.deepEqual(me.items.map((item) => item.path), ["/me/keys", "/me/usage", "/me/account"])
  assert.deepEqual(adminGroup.items.map((item) => item.path), ["/admin/overview", "/admin/members", "/admin/providers", "/admin/models", "/admin/usage", "/admin/audit", "/admin/system"])
  const redirect = { path: "/admin/overview", redirect: true }
  assert.deepEqual([NAV.resolveRoute("/admin", "admin"), NAV.resolveRoute("/", "admin")], [redirect, redirect])
  assert.deepEqual([NAV.resolveRoute("/", "user"), NAV.resolveRoute("/admin/audit", "user"), NAV.resolveRoute("/admin/overview", "admin")], [{ path: "/me/keys", redirect: true }, { path: "/admin/audit", denied: true }, { path: "/admin/overview" }])
  // 接线：三新档 + 灯（30s 轮询 ∥ meta 槽 id ∥ 三态文案键）
  const appSrc = readFileSync(join(PUBLIC_DIR, "app.mjs"), "utf8")
  for (const dep of ["./views-usage.mjs", "./views-overview.mjs", "./views-audit.mjs"]) assert.ok(appSrc.includes(dep), dep)
  assert.ok(appSrc.includes("HEALTH_POLL_MS = 30000"))
  for (const key of ["health.ok", "health.degraded", "health.down"]) assert.ok(appSrc.includes(key), key)
  assert.ok(readFileSync(join(PUBLIC_DIR, "nav.mjs"), "utf8").includes('id: "nav-health"'))
  // 三新档静态直发（200 ∥ text/javascript ∥ no-cache ∥ 字节 = 磁盘）+ 健康三态（绿/黄/红）
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db, config: configWith() })
  const degradedApp = await startApp({ db, config: configWith(), sysOver: { probeDb: () => { throw new Error("db down") } } })
  try {
    for (const name of ["views-usage.mjs", "views-overview.mjs", "views-audit.mjs"]) {
      const res = await get(app.base, `/${name}`)
      assert.deepEqual([res.status, res.headers.get("content-type"), res.headers.get("cache-control"), res.text], [200, "text/javascript; charset=utf-8", "no-cache", readFileSync(join(PUBLIC_DIR, name), "utf8")], name)
    }
    const green = await fetch(`${app.base}/healthz`) // 绿 = 200 ok
    assert.deepEqual([green.status, (await green.json()).status, green.headers.get("cache-control")], [200, "ok", "no-store"])
    const yellow = await fetch(`${degradedApp.base}/healthz`) // 黄 = 503 degraded（db 探活注入）
    const yellowBody = await yellow.json()
    assert.deepEqual([yellow.status, yellowBody.status, yellowBody.db], [503, "degraded", "error"])
  } finally {
    await degradedApp.close()
    await app.close()
    db.close()
  }
  await assert.rejects(fetch(`${app.base}/healthz`)) // 红 = fetch 拒（灯变红输入）
})
