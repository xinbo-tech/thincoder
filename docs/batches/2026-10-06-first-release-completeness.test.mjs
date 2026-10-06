/**
 * 2026-10-06-first-release-completeness.test.mjs — thincoder-server 批内单测件（首版完备化；名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-first-release-completeness.test.mjs`。
 *
 * 射程（六腿——设计 = 批档 §2.4）：
 *   ① healthz（200 形 ∥ 503 降级 ∥ HEAD/POST 404 ∥ no-store ∥ 零凭据直调）
 *   ② 登录防爆破 guard（阈值/锁/`Retry-After`/两维同措辞/清计/`trustProxy`——单件 + 路由接线两径）
 *   ③ `/api/system`（会话门 ∥ 假 registry 自检后状态随实况）+ 控制台系统页两节（描述符树直测——AC-13③④）
 *   ④ README 结构与部署件（成员接入 ∥ nginx 段 ∥ 备份命令/定时器/恢复步 ∥ 排障 ∥ HEALTHCHECK 逐字）
 *   ⑤ `deploy/backup.mjs` 实跑（快照生成 + 可开 + 热库在线 + 源库零触 + 自足）
 *   ⑥ `pruneUsage`（窗界删/留 ∥ `null` 零删 ∥ 走 `idx_usage_ts`）+ 配置校验（两新键拒启矩阵）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { basename, dirname, join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const SERVER_DIR = join(ROOT, "thincoder-server")
const BACKUP_PATH = join(SERVER_DIR, "deploy", "backup.mjs")
const BACKUP = await load("thincoder-server/deploy/backup.mjs")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const SYSTEM = await load("thincoder-server/src/gateway/system.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const GUARD = await load("thincoder-server/src/accounts/login-guard.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const USAGE = await load("thincoder-server/src/metering/usage.mjs")
const UPDATE = await load("thincoder-server/src/ops/update.mjs")
const SYSTEM_VIEW = await load("thincoder-server/public/views-system.mjs")
const NAV = await load("thincoder-server/public/nav.mjs")

const PASSWORD = "password-123"
const DAY_MS = 24 * 60 * 60 * 1000

// ── 夹具与助手 ───────────────────────────────────────────────────────────────

const baseConfig = (extra = {}) => CONFIG.validateConfig({
  host: "127.0.0.1",
  providers: [{ name: "mock", baseURL: "http://127.0.0.1:9/v1", apiKey: "", models: ["m1"] }],
  embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" },
  ...extra,
})

/** 行式日志捕获（行 = `{ level, event, ...fields }`——与入口接线同形）。 */
const captureLog = (lines) => {
  const push = (level) => (event, fields = {}) => lines.push({ level, event, ...fields })
  return { info: push("info"), warn: push("warn"), error: push("error") }
}

/** 进程内网关（系统面 + 账号两族注册行——本件只触这两面）；`lines` 可外部共享（守卫/更新器同接）。 */
async function startApp({ db, config, guard, system = {}, lines = [] } = {}) {
  const log = captureLog(lines)
  const routes = SERVER.createRouteTable()
  SYSTEM.registerSystemRoutes(routes, { db, ...system })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db, ...(guard ? { guard } : {}) })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db, ...(guard ? { guard } : {}) })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    lines,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** HTTP 调用（JSON 头缺省；cookie ∥ 附加头注入——`X-Real-IP` 面走 `extraHeaders`）。 */
async function call(base, method, path, { body, cookie, extraHeaders } = {}) {
  const headers = { "content-type": "application/json", ...(extraHeaders ?? {}) }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, headers: res.headers, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}
const get = (base, path, opts) => call(base, "GET", path, opts)

async function login(base, username, password = PASSWORD, extraHeaders = undefined) {
  const res = await call(base, "POST", "/api/login", { body: { username, password }, extraHeaders })
  const hit = res.setCookies.find((line) => line.startsWith("tc_session="))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}

async function makeMember(db, { username = "admin", role = "admin" } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, role, password: PASSWORD })
  return member
}

/** 假 registry（`node:http`——端口随机）：任意路径回 `{ name, version }`（自检取数面）。 */
async function startRegistry(version = "9.9.9") {
  const server = createHttpServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ name: "@thincoder/server", version }))
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return { base: `http://127.0.0.1:${server.address().port}`, close: async () => { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) } }
}

const tmpDir = (tag) => mkdtempSync(join(tmpdir(), `tcsrv-frc-${tag}-`))

/** 往真 `usage` 表插一行（列形 = store/db.mjs 单源；FK 开 ⇒ 须先有 member/key 行）。 */
function insertUsage(db, { ts, memberId, keyId }) {
  db.prepare(
    "INSERT INTO usage (ts, member_id, key_id, endpoint, model, status, stream, prompt_tokens, completion_tokens, total_tokens, duration_ms) VALUES (?, ?, ?, 'chat', 'mock/m1', 'ok', 0, 1, 1, 2, 5)",
  ).run(ts, memberId, keyId)
}

// ── ① healthz ────────────────────────────────────────────────────────────────

test("① healthz：零凭据 GET ⇒ 200 形（status/version/uptime/db）∥ no-store ∥ HEAD/POST ⇒ 404", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db, config: baseConfig(), system: { version: "9.9.9", uptimeS: () => 42 } })
  try {
    const res = await get(app.base, "/healthz") // 零凭据（无 cookie ∥ 无团队 key）——探针入口
    assert.equal(res.status, 200)
    assert.deepEqual(res.json, { status: "ok", version: "9.9.9", uptime: 42, db: "ok" })
    assert.equal(res.headers.get("cache-control"), "no-store")
    assert.equal((await call(app.base, "HEAD", "/healthz")).status, 404) // 仅注册 GET（探针面单一）
    assert.equal((await call(app.base, "POST", "/healthz", { body: {} })).status, 404)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 0) // 探针不触会话面
    assert.equal(app.lines.length, 3) // 三次请求 = 三行（非空前置——防 every 空真）
    assert.ok(app.lines.every((l) => l.event === "request"), "探针面无鉴权/账号事件（逐请求一行之外零事件）")
  } finally { await app.close(); db.close() }
})

test("① healthz 降级：db 探活失败（注入口径）⇒ 503 degraded（status/db 两字段同拍）", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startApp({
    db,
    config: baseConfig(),
    system: { version: "9.9.9", uptimeS: () => 7, probeDb: () => { throw new Error("db down") } },
  })
  try {
    const res = await get(app.base, "/healthz")
    assert.equal(res.status, 503)
    assert.deepEqual(res.json, { status: "degraded", version: "9.9.9", uptime: 7, db: "error" })
    assert.equal(res.headers.get("cache-control"), "no-store")
  } finally { await app.close(); db.close() }
})

// ── ② 登录防爆破 ─────────────────────────────────────────────────────────────

test("② guard 单件：5 连败 ⇒ 锁 ∥ Retry-After 900s ∥ 锁期内重试不延长（固定窗）∥ 窗尽解锁且清计", () => {
  let now = 1_000_000
  const guard = GUARD.createLoginGuard({ now: () => now })
  for (let i = 0; i < GUARD.USERNAME_THRESHOLD; i++) guard.recordFailure({ username: "alice", ip: "10.0.0.1" })
  assert.deepEqual(guard.check({ username: "alice", ip: "10.0.0.1" }), { locked: true, retryAfterS: 900, dimension: "username" })
  now += 100_000
  guard.recordFailure({ username: "alice", ip: "10.0.0.1" }) // 锁期内重试——不延长（固定窗）
  assert.equal(guard.check({ username: "alice", ip: "10.0.0.1" }).retryAfterS, 800)
  now += GUARD.LOCK_MS // 锁 + 窗同尽
  assert.deepEqual(guard.check({ username: "alice", ip: "10.0.0.1" }), { locked: false, retryAfterS: 0, dimension: null })
  guard.recordFailure({ username: "alice", ip: "10.0.0.1" }) // 窗尽即清计 ⇒ 单次失败不锁
  assert.equal(guard.check({ username: "alice", ip: "10.0.0.1" }).locked, false)
  // 阈值常量（设计钉：用户名 5 ∥ IP 20 ∥ 窗 = 锁 = 15 分钟）
  assert.deepEqual([GUARD.USERNAME_THRESHOLD, GUARD.IP_THRESHOLD, GUARD.WINDOW_MS, GUARD.LOCK_MS], [5, 20, 900_000, 900_000])
})

test("② guard 两维与口径：IP 维 20 连败锁（异用户名同 IP）∥ 他维不串 ∥ trustProxy ⇒ X-Real-IP（头空/数组/关）", () => {
  const now = 2_000_000
  const guard = GUARD.createLoginGuard({ now: () => now })
  for (let i = 0; i < GUARD.IP_THRESHOLD; i++) guard.recordFailure({ username: `u${i}`, ip: "10.0.0.1" })
  assert.deepEqual(guard.check({ username: "u999", ip: "10.0.0.1" }), { locked: true, retryAfterS: 900, dimension: "ip" })
  assert.equal(guard.check({ username: "u0", ip: "10.0.0.9" }).locked, false) // 他 IP 不锁
  // 清计四口：成功 ⇒ 两维同清 ∥ clearUsername ⇒ 仅该用户名维
  for (let i = 0; i < 4; i++) guard.recordFailure({ username: "bob", ip: "10.0.0.2" })
  guard.recordSuccess({ username: "bob", ip: "10.0.0.2" })
  for (let i = 0; i < 4; i++) guard.recordFailure({ username: "bob", ip: "10.0.0.2" })
  assert.equal(guard.check({ username: "bob", ip: "10.0.0.2" }).locked, false)
  for (let i = 0; i < 4; i++) guard.recordFailure({ username: "carol", ip: "10.0.0.3" })
  guard.clearUsername("carol")
  for (let i = 0; i < 4; i++) guard.recordFailure({ username: "carol", ip: "10.0.0.3" })
  assert.equal(guard.check({ username: "carol", ip: "10.0.0.3" }).locked, false)
  // IP 口径（ACCOUNTS §2）：trustProxy 开 ⇒ X-Real-IP；头空 ⇒ 回退对端；数组头取首；关 ⇒ 恒对端
  const req = { headers: { "x-real-ip": "203.0.113.7" }, socket: { remoteAddress: "10.0.0.5" } }
  assert.equal(GUARD.clientIp(req, { trustProxy: true }), "203.0.113.7")
  assert.equal(GUARD.clientIp(req, { trustProxy: false }), "10.0.0.5")
  assert.equal(GUARD.clientIp({ headers: { "x-real-ip": "   " }, socket: { remoteAddress: "10.0.0.5" } }, { trustProxy: true }), "10.0.0.5")
  assert.equal(GUARD.clientIp({ headers: { "x-real-ip": ["198.51.100.1", "198.51.100.2"] }, socket: {} }, { trustProxy: true }), "198.51.100.1")
})

test("② 路由接线：锁定期 ⇒ 429 + Retry-After（正确口令亦然）∥ 不存在用户名同锁同措辞（防枚举）∥ 锁窗过期恢复 200", async () => {
  let now = 3_000_000
  const lines = []
  const guard = GUARD.createLoginGuard({ now: () => now, log: captureLog(lines) }) // 时钟注入：锁窗过期可验
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "alice", role: "user" })
  const app = await startApp({ db, config: baseConfig({ trustProxy: true }), guard, system: { version: "0.1.0" }, lines })
  const ipA = { "X-Real-IP": "203.0.113.10" }
  try {
    for (let i = 0; i < 5; i++) assert.equal((await login(app.base, "alice", "wrong-pass", ipA)).res.status, 401)
    const sixth = await login(app.base, "alice", PASSWORD, ipA) // 正确口令亦拒——锁先于散列
    assert.equal(sixth.res.status, 429)
    assert.equal(sixth.res.json.error.code, "too_many_attempts")
    assert.equal(sixth.res.headers.get("retry-after"), "900")
    assert.equal(sixth.res.json.error.message, ACCOUNT_ROUTES.THROTTLED_MESSAGE)
    assert.ok(app.lines.some((l) => l.event === "login_throttled" && l.dimension === "username"))
    now += GUARD.LOCK_MS + 1 // 锁窗过期 ⇒ 恢复
    assert.equal((await login(app.base, "alice", PASSWORD, ipA)).res.status, 200)
    // 不存在用户名：同一路径同锁同措辞（枚举零差）
    const ipB = { "X-Real-IP": "203.0.113.11" }
    for (let i = 0; i < 5; i++) assert.equal((await login(app.base, "ghost", "wrong-pass", ipB)).res.status, 401)
    const ghost = await login(app.base, "ghost", "wrong-pass", ipB)
    assert.equal(ghost.res.status, 429)
    assert.equal(ghost.res.headers.get("retry-after"), "900")
    assert.equal(ghost.res.json.error.message, sixth.res.json.error.message) // 两维/存在性同措辞
    assert.equal((await login(app.base, "alice", PASSWORD, { "X-Real-IP": "203.0.113.12" })).res.status, 200) // 他 IP 不受累
  } finally { await app.close(); db.close() }
})

test("② 路由接线（清计三径）：成功登录 ∥ 自助改密 ∥ admin 重置 ⇒ 计数清零（此后不足阈值不锁）", async () => {
  const guard = GUARD.createLoginGuard()
  const db = DB.openDatabase(":memory:")
  const admin = await makeMember(db, { username: "admin", role: "admin" })
  const alice = await makeMember(db, { username: "alice", role: "user" })
  const app = await startApp({ db, config: baseConfig({ trustProxy: true }), guard })
  const ip = (n) => ({ "X-Real-IP": `198.51.100.${n}` })
  const fourFails = async (n) => { for (let i = 0; i < 4; i++) assert.equal((await login(app.base, "alice", "wrong-pass", ip(n))).res.status, 401) }
  try {
    // 径① 成功登录清计（4 败 ⇒ 成功 ⇒ 再 4 败仍不锁）
    await fourFails(1)
    const ok = await login(app.base, "alice", PASSWORD, ip(1))
    assert.equal(ok.res.status, 200)
    await fourFails(1)
    assert.equal((await login(app.base, "alice", PASSWORD, ip(1))).res.status, 200)
    // 径② 自助改密清本人用户名维（改密后 4 败不锁；新口令可登）
    await fourFails(2)
    const changed = await call(app.base, "POST", "/api/me/password", { cookie: ok.cookie, body: { oldPassword: PASSWORD, newPassword: "new-password-9" }, extraHeaders: ip(2) })
    assert.equal(changed.status, 200)
    await fourFails(2)
    assert.equal((await login(app.base, "alice", "new-password-9", ip(2))).res.status, 200)
    // 径③ admin 重置清目标用户名维
    await fourFails(3)
    const adminLogin = await login(app.base, "admin", PASSWORD, ip(3))
    const reset = await call(app.base, "POST", `/api/members/${alice.id}/password-reset`, { cookie: adminLogin.cookie, body: {}, extraHeaders: ip(3) })
    assert.equal(reset.status, 200)
    await fourFails(3)
    assert.equal((await login(app.base, "alice", reset.json.tempPassword, ip(3))).res.status, 200)
  } finally { await app.close(); db.close() }
})

// ── ③ /api/system 与控制台系统页 ─────────────────────────────────────────────

test("③ /api/system：无会话 ⇒ 401 unauthorized ∥ 会话（两角色）⇒ 200 形 ∥ 假 registry 自检后状态随实况", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db, { username: "admin", role: "admin" })
  await makeMember(db, { username: "alice", role: "user" })
  const registry = await startRegistry("9.9.9")
  const lines = []
  const updater = UPDATE.createUpdater({ config: { autoUpdate: "notify" }, version: "0.1.0", registry: registry.base, intervalMs: 3_600_000, log: captureLog(lines) })
   const app = await startApp({ db, config: baseConfig(), system: { version: "0.1.0", getUpdateStatus: () => updater.getStatus(), embedding: { model: "bge-m3" } }, lines })
  try {
    const anon = await get(app.base, "/api/system")
    assert.equal(anon.status, 401)
    assert.equal(anon.json.error.code, "unauthorized")
    const admin = await login(app.base, "admin")
    const before = await get(app.base, "/api/system", { cookie: admin.cookie }) // 未检形（访问器实况）
    assert.equal(before.status, 200)
    assert.deepEqual(before.json, { version: "0.1.0", update: { mode: "notify", lastCheckAt: null, latest: null }, embedding: { model: "bge-m3" } })
    assert.deepEqual(await updater.checkNow(), { latest: "9.9.9", installed: false }) // notify ⇒ 可见不自装
    const after = await get(app.base, "/api/system", { cookie: admin.cookie })
    assert.equal(after.json.update.mode, "notify")
    assert.equal(after.json.update.latest, "9.9.9")
    assert.equal(typeof after.json.update.lastCheckAt, "number")
    assert.ok(app.lines.some((l) => l.event === "update_available"))
    const alice = await login(app.base, "alice")
    assert.equal((await get(app.base, "/api/system", { cookie: alice.cookie })).status, 200) // 两角色面
  } finally { updater.stop(); await registry.close(); await app.close(); db.close() }
})

test("③ 系统页四节（描述符树直测）：版本/更新四项 ∥ 接入卡（运行时 origin ∥ key 提示 ∥ 四端 ∥ curl）∥ 向量服务卡 ∥ 服务健康块", async () => {
  const origin = "http://10.1.2.3:8787"
  const prevLocation = globalThis.location
  globalThis.location = { origin }
  const el = (tag, props = {}, ...children) => ({ tag, props, children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false), addEventListener: () => {} })
  const text = (node, out = []) => {
    if (node === null || node === undefined || node === false) return out
    if (typeof node === "string") { out.push(node); return out }
    if (node.props?.text) out.push(String(node.props.text))
    for (const child of node.children ?? []) text(child, out)
    return out
  }
  const render = (system) => {
    const out = []
    const ctx = {
      h: el,
      table: (headers, rows) => el("table", {}, ...headers, ...rows.flat()),
      fmtTs: (ts) => `TIME(${ts})`,
      fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
      api: async () => ({ ok: true, dimensions: 3, ms: 1 }),
      fail: () => {},
      health: () => ({ label: "ok", body: { db: "ok", uptime: 5 }, checkedAt: null }),
      onHealth: () => {},
      state: { system },
    }
    SYSTEM_VIEW.renderSystem(ctx, { append: (...nodes) => nodes.forEach((n) => text(n, out)) })
    return out.join(" ")
  }
  try {
    const withUpdate = render({ version: "1.2.3", update: { mode: "notify", lastCheckAt: 1_700_000_000_000, latest: "2.0.0" } })
    assert.ok(withUpdate.includes("1.2.3") && withUpdate.includes("notify") && withUpdate.includes("TIME(1700000000000)"))
    assert.ok(withUpdate.includes("有新版本可用：v2.0.0（升级见部署文档）"))
    assert.ok(withUpdate.includes(`${origin}/v1`), "接入卡 baseURL = 运行时 origin + /v1")
    assert.ok(withUpdate.includes("sk-tc-"))
    for (const end of ["CLI", "VS Code", "桌面", "其他 OpenAI 兼容端"]) assert.ok(withUpdate.includes(end), `四端缺：${end}`)
    assert.ok(withUpdate.includes("name") && withUpdate.includes("baseURL") && withUpdate.includes("<provider>/<model>") && withUpdate.includes("apiKey"))
    assert.ok(withUpdate.includes(`curl -H "Authorization: Bearer sk-tc-…" ${origin}/v1/models`))
    assert.ok(withUpdate.includes("向量服务") && withUpdate.includes("调用 snippet") && withUpdate.includes(`${origin}/v1/embeddings`), "向量服务卡缺")
    assert.ok(withUpdate.includes("服务健康") && withUpdate.includes("30 秒自动刷新"), "服务健康块缺")
    const noUpdate = render({ version: "1.2.3", update: { mode: "auto", lastCheckAt: null, latest: null } })
    assert.ok(noUpdate.includes("未发现新版本") && noUpdate.includes("未检")) // lastCheckAt null = 未检
    const empty = render(null) // 取数失败（静默留空）⇒ 「—」形 + 未发现新版本（同面）
    assert.ok(empty.includes("—") && empty.includes("未发现新版本"))
    // meta 槽（nav 直测）：版本行在场 ⇒ `v1.2.3`；缺省/空 ⇒ 留空静默（取数失败同面）
    const navText = (extra) => {
      let nodes = []
      NAV.renderSidebar({ h: el, member: { role: "admin" }, path: "/me/keys", onLogout: () => {}, ...extra }, { replaceChildren: (...n) => { nodes = n } })
      return text(el("div", {}, ...nodes))
    }
    assert.ok(navText({ version: "1.2.3" }).includes("v1.2.3"))
    assert.ok(!navText({}).includes("v1.2.3"))
  } finally { await new Promise((resolve) => setTimeout(resolve, 0)); globalThis.location = prevLocation }
})

// ── ④ README 结构与部署件 ────────────────────────────────────────────────────

test("④ README 结构：成员接入节 ∥ nginx 完整段 ∥ 备份命令/定时器/恢复步 ∥ 排障探活 ∥ 节号无重无跳", () => {
  const readme = readFileSync(join(SERVER_DIR, "README.md"), "utf8")
  const need = (needle, label) => assert.ok(readme.includes(needle), `README 缺${label}：${needle}`)
  // 成员接入（§10）
  assert.match(readme, /^## 10\. 成员接入$/m)
  need("sk-tc-", "团队 key 形")
  for (const end of ["CLI", "VS Code", "桌面", "其他 OpenAI 兼容端"]) need(end, `接入端：${end}`)
  assert.ok(/curl[^\n]*\/v1\/models/.test(readme), "缺 curl 冒烟行")
  need("<provider>/<model>", "模型标识形")
  // 反代（§11——要素三件）
  assert.match(readme, /^## 11\. 反代与 TLS（nginx 样例）$/m)
  need("client_max_body_size 32m", "反代 body 上限")
  need("proxy_http_version 1.1", "SSE 前提")
  need("proxy_buffering off", "SSE 免缓冲")
  need("proxy_set_header X-Real-IP $remote_addr", "X-Real-IP（set 形）")
  need("proxy_read_timeout", "长流读超时")
  need("trustProxy: true", "trustProxy 前提句")
  // 备份（§9——命令 ∥ 定时器 ∥ 恢复步）
  assert.match(readme, /^## 9\. 备份与恢复$/m)
  need("deploy/backup.mjs", "备份脚本路径")
  need("--config", "备份命令参数")
  need("--out", "落点参数")
  need("gateway-<时间戳>.db", "产物的时间戳命名")
  need("thincoder-server-backup.service", "定时器样例（service）")
  need("thincoder-server-backup.timer", "定时器样例（timer）")
  need("OnCalendar=daily", "定时器周期")
  need("Persistent=true", "定时器错过补跑")
  for (const step of ["停服", "gateway.db-wal", "gateway.db-shm", "起服"]) need(step, `恢复步：${step}`)
  need("docker compose exec server node /app/deploy/backup.mjs", "容器路备份命令")
  // 排障（§12）
  assert.match(readme, /^## 12\. 排障（健康检查）$/m)
  need("/healthz", "探活路径")
  need("503", "降级语义")
  need("unhealthy", "标注态句")
  // 节号：无重号 ∥ 递增衔接
  const sections = [...readme.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]))
  assert.deepEqual(sections, [...sections].sort((a, b) => a - b))
  assert.equal(new Set(sections).size, sections.length, `节号重号：${sections.join(",")}`)
  assert.deepEqual(sections, Array.from({ length: sections.length }, (_, i) => i + 1))
})

test("④ 部署件：Dockerfile HEALTHCHECK 逐字（§5.9）∥ compose 继承注（单源不重复）∥ config.example 两键", () => {
  const dockerfile = readFileSync(join(SERVER_DIR, "Dockerfile"), "utf8")
  const expected = `HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"`
  assert.ok(dockerfile.split(/\r?\n/).includes(expected), "HEALTHCHECK 行非逐字（§5.9）")
  const compose = readFileSync(join(SERVER_DIR, "docker-compose.yml"), "utf8")
  assert.ok(!/^\s*healthcheck:/m.test(compose), "compose 不得重复声明 healthcheck（镜像继承 = 单源）")
  assert.ok(compose.includes("Dockerfile HEALTHCHECK"), "compose 缺继承注记")
  const example = JSON.parse(readFileSync(join(SERVER_DIR, "config.example.json"), "utf8"))
  assert.equal(example.trustProxy, false)
  assert.equal(example.usageRetentionDays, 90)
})

// ── ⑤ backup.mjs 实跑 ───────────────────────────────────────────────────────

test("⑤ backup.mjs 实跑：热库在线快照（含 WAL 未检查点行）⇒ 快照可开 ∥ 源库零触 ∥ out 缺省 = 配置档旁 backups/", () => {
  const dir = tmpDir("bkp-hot")
  let live = null
  try {
    mkdirSync(join(dir, "data"))
    const dbPath = join(dir, "data", "gateway.db")
    live = new DatabaseSync(dbPath) // 热库（连接持有 + WAL 未检查点——在线备份判据）
    live.exec("PRAGMA journal_mode=WAL")
    live.exec("CREATE TABLE usage (id INTEGER PRIMARY KEY, endpoint TEXT)")
    live.prepare("INSERT INTO usage (endpoint) VALUES (?)").run("chat")
    live.prepare("INSERT INTO usage (endpoint) VALUES (?)").run("embeddings")
    live.prepare("INSERT INTO usage (endpoint) VALUES (?)").run("chat")
    writeFileSync(join(dir, "config.json"), JSON.stringify({ host: "127.0.0.1", db: "data/gateway.db" }))
    const run = spawnSync(process.execPath, [BACKUP_PATH, "--config", join(dir, "config.json")], { encoding: "utf8" })
    assert.equal(run.status, 0, `备份退出码非 0：${run.stderr}`)
    const target = run.stdout.trim()
    assert.equal(dirname(target), join(dir, "backups")) // 缺省 out = 配置档旁 backups/
    assert.match(basename(target), /^gateway-\d{8}-\d{6}\.db$/) // 时间戳命名
    assert.deepEqual(readdirSync(join(dir, "backups")), [basename(target)]) // 自足单件（无伴档）
    const snap = new DatabaseSync(target, { readOnly: true })
    assert.equal(snap.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 3) // 快照含 WAL 内行（一致）
    snap.close()
    assert.equal(live.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 3) // 源库零触（行数不变）
  } finally {
    live?.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("⑤ backup.mjs 形：同一秒重跑拒写（不覆盖）∥ 缺库/缺参/未知参 ⇒ 退出码 1 ∥ 自足（零相对 import）", () => {
  const dir = tmpDir("bkp-cold")
  try {
    const dbPath = join(dir, "gateway.db")
    const db = new DatabaseSync(dbPath)
    db.exec("CREATE TABLE t (a)")
    db.prepare("INSERT INTO t VALUES (1)").run()
    db.close()
    writeFileSync(join(dir, "config.json"), JSON.stringify({ db: "gateway.db" }))
    const run = () => spawnSync(process.execPath, [BACKUP_PATH, "--config", join(dir, "config.json"), "--out", join(dir, "out")], { encoding: "utf8" })
    assert.equal(run().status, 0)
    // 同一秒重跑 ⇒ 拒写（不覆盖既有快照）：同秒占位 ⇒ 本次必拒（占位跨秒则重试）
    const dbFiles = () => readdirSync(join(dir, "out")).filter((n) => n.endsWith(".db"))
    let refused = null
    for (let i = 0; i < 5 && refused === null; i++) {
      const before = dbFiles()
      mkdirSync(join(dir, "out"), { recursive: true })
      const seeded = join(dir, "out", `gateway-${BACKUP.stamp()}.db`)
      writeFileSync(seeded, "占位")
      const res = run()
      if (res.status === 1) {
        refused = res
        assert.equal(readFileSync(seeded, "utf8"), "占位") // 拒写 ⇒ 既有同秒文件零覆盖
      } else {
        rmSync(seeded, { force: true }) // 占位跨秒（本轮未撞上）——清占位重试
      }
    }
    assert.ok(refused, "同一秒重跑应拒写（不覆盖既有快照）")
    assert.match(refused.stderr, /目标已存在/)
    assert.ok(dbFiles().every((n) => /^gateway-\d{8}-\d{6}\.db$/.test(n))) // 命名形一致
    writeFileSync(join(dir, "missing.json"), JSON.stringify({ db: "nope/gateway.db" }))
    writeFileSync(join(dir, "envcfg.json"), JSON.stringify({ db: "env:TC_BKP_DB" })) // env: 引用（配置契约同解析面）
    assert.equal(BACKUP.resolveDbPath(join(dir, "envcfg.json"), { env: { TC_BKP_DB: dbPath } }).dbPath, dbPath)
    assert.throws(() => BACKUP.resolveDbPath(join(dir, "envcfg.json"), { env: {} }), /env: 引用缺位/) // 缺位 ⇒ 抛（入口转退出 1）
    assert.equal(spawnSync(process.execPath, [BACKUP_PATH, "--config", join(dir, "missing.json")], { encoding: "utf8" }).status, 1)
    assert.equal(spawnSync(process.execPath, [BACKUP_PATH], { encoding: "utf8" }).status, 1)
    assert.equal(spawnSync(process.execPath, [BACKUP_PATH, "--config", join(dir, "config.json"), "--wat", "1"], { encoding: "utf8" }).status, 1)
    // 自足：零 App import（仅 node: 内建——镜像内 deploy/ 与 npm 装的包不同根）
    for (const match of readFileSync(BACKUP_PATH, "utf8").matchAll(/\bfrom\s*["']([^"']+)["']/g)) {
      assert.ok(match[1].startsWith("node:"), `backup.mjs 非自足 import：${match[1]}`)
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑥ pruneUsage 与配置校验 ──────────────────────────────────────────────────

test("⑥ pruneUsage：窗界外删 ∥ 窗内留（注入时钟）∥ null ⇒ 零删 ∥ 缺省 90 天 ∥ 走 idx_usage_ts", async () => {
  const db = DB.openDatabase(":memory:")
  try {
    const member = await makeMember(db, { username: "u1", role: "user" })
    const key = KEYS.issueKey(db, member.id)
    const now = 10_000 * DAY_MS
    insertUsage(db, { ts: now - 91 * DAY_MS, memberId: member.id, keyId: key.id }) // 窗外
    insertUsage(db, { ts: now - 89 * DAY_MS, memberId: member.id, keyId: key.id }) // 窗内
    insertUsage(db, { ts: now, memberId: member.id, keyId: key.id }) // 窗内
    assert.equal(USAGE.pruneUsage(db, { now, retentionDays: 90 }), 1)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 2)
    assert.equal(USAGE.pruneUsage(db, { now, retentionDays: null }), 0) // 不限 ⇒ 零删（显式开）
    assert.equal(USAGE.pruneUsage(db, { now }), 0) // 缺省 = 90 天 ⇒ 窗内零删
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n, 2)
    assert.equal(USAGE.USAGE_PRUNE_INTERVAL_MS, 24 * 60 * 60 * 1000) // 接线时机常量（启动 + 24h）
    const plan = db.prepare("EXPLAIN QUERY PLAN DELETE FROM usage WHERE ts < ?").all(0).map((row) => row.detail).join(" ")
    assert.match(plan, /idx_usage_ts/) // 索引单源（METERING §1）
  } finally { db.close() }
})

test("⑥ 配置校验：trustProxy 非布尔 ⇒ 拒启 ∥ usageRetentionDays 非正整数且非 null ⇒ 拒启 ∥ 缺省落位", () => {
  const base = { host: "127.0.0.1", embedding: { baseURL: "http://127.0.0.1:9/v1", model: "m" } }
  const defaults = CONFIG.validateConfig(base)
  assert.equal(defaults.trustProxy, false) // 缺省 false
  assert.equal(defaults.usageRetentionDays, CONFIG.DEFAULT_USAGE_RETENTION_DAYS)
  assert.equal(defaults.usageRetentionDays, 90)
  assert.equal(CONFIG.validateConfig({ ...base, trustProxy: true }).trustProxy, true)
  assert.equal(CONFIG.validateConfig({ ...base, usageRetentionDays: null }).usageRetentionDays, null)
  for (const bad of [null, "true", 1, 0]) {
    assert.throws(() => CONFIG.validateConfig({ ...base, trustProxy: bad }), /trustProxy 非法/, `trustProxy=${JSON.stringify(bad)}`)
  }
  for (const bad of [0, -1, 1.5, "90", true]) {
    assert.throws(() => CONFIG.validateConfig({ ...base, usageRetentionDays: bad }), /usageRetentionDays 非法/, `usageRetentionDays=${JSON.stringify(bad)}`)
  }
})
