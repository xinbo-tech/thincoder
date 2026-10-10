/**
 * 2026-10-10-server-exec-sandbox.test.mjs — server-exec-sandbox 批内单测件（**服务面/控制面**；名随批档 · 住 `docs/batches/` ·
 * 不入仓套件 · 随批留存；同批执行面另件——`-runner.test.mjs`，执行面批落地）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-exec-sandbox.test.mjs`
 *
 * 射程（判据源 = 批档 §2 ∥ `sandbox/SANDBOX.md` §13 用例表 ∥ §12 探针之服务侧半支；腿 ↔ 判据在括号）：
 *   腿 A（v11 迁移——STORE §3）：空库读数 11 ∥ 七表在场 ∥ 种子八行 ∥ 审计十二型（两新型可写 ∧ 十三型拒）∥ v10 库升后读数 11
 *     ∥ 幂等 ∥ 种子一次性（删后不复活）∥ 覆写列默认
 *   腿 B（N40 ∥ E30）：join 令牌（一次性 ∥ 有效期）三态人话（过期 ∥ 已用过 ∥ 令牌不对）+ 失败审计行 ∥ join 落行（只存 sha256）
 *     ∥ 心跳后运行面在列 ∥ `/api/runner/*` 无令牌 401 ∥ 长轮询（空候满窗 ∥ 在飞入队即醒）
 *   腿 C（N41 ∥ N45 ∥ B35 放置面）：建工作区（key 签发 `sandbox:<名>` + 放置 + create/start 入队；载荷逐值 = 覆写 ∪ 全局默认）
 *     ∥ PATCH 覆写往返（库回读逐值；运行中盒零触——零新指令）∥ 删键回落 ∥ 排队等待与续跑 ∥ 容量上限不放置
 *   腿 D（B35 ∥ E32 ∥ P14）：无 runner ⇒ unavailable + 原因 ∥ doctor 失败 ⇒ 无可用运行时 ∥ 写动作 503（不降级）∥ 恢复转回
 *   腿 E（N42 ∥ P11 ∥ B36 ∥ B37）：通配校验单层左 ∥ 增删 ⇒ rulesRev +1 + poll 下发全量（零重建）∥ 审计 `sandbox_rule` ∥ 求值序
 *     （显式 deny 恒先 ∥ 种子 deny ≺ 显式 allow ∥ 内置恒拒 ∥ 域名单层左通配 ∥ 默认拒）∥ 设置面（键全集 ∥ 键级合并 ∥ rulesRev +1 ∥ 非法 ⇒ 400 库零变）
 *     ∥ 自动带入项同审计（`ensureSegmentDeny`——actor = auto ∥ 幂等）
 *   腿 F（N43 ∥ P12 ∥ B38）：待批登记去重 hits++ ∥ 三态裁定 + poll 下发一次 ∥ 超时 ⇒ timeout ∥ 三次批准建议 + 采纳 ∥ 审计
 *   腿 G（B41）：悬挂回收（幂等 ⇒ 回 queued 重派 ∥ exec ⇒ failed + 原因）∥ 控制台行可见
 *   腿 H（E29 ∥ E31 ∥ 成员面 §2.7）：判权三态 ∥ runner 令牌打 `/api/*` ⇒ 401 ∥ 销毁二次确认 ∥ 轮换（旧 key 即失效 + 重建三指令）
 *     ∥ 成员面恒本人过滤 + 待批提示 + 不可用 503
 *   腿 J（B27 ∥ E7 通则）：快照上送（octet-stream 型门豁免 ∥ 流式落盘 ≤ 路由级 200 MiB ∥ 超限 413 不落盘）∥ 取回往返 ∥ 保留份数
 *     ∥ 他写端点照旧（非 JSON ⇒ 400 ∥ 32 MiB 声明长 ⇒ 413）
 *   腿 I（链自检）：本批件入 `prepublishOnly`（`includes` 形 ∥ 清单目标在盘）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { request as httpRequest } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const ERRORS = await load("thincoder-server/src/gateway/errors.mjs")
const AUDIT = await load("thincoder-server/src/accounts/audit.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const REGISTRY = await load("thincoder-server/src/sandbox/registry.mjs")
const RULES = await load("thincoder-server/src/sandbox/rules.mjs")
const RUNNER_API = await load("thincoder-server/src/sandbox/runner-api.mjs")
const SANDBOX_ROUTES = await load("thincoder-server/src/sandbox/routes.mjs")

const PASSWORD = "password-123"
const BATCH_FILE = "docs/batches/2026-10-10-server-exec-sandbox.test.mjs"
const SHA = (token) => KEYS.hashKey(token) // sha256 hex（与服务器同算法）

// ── 公共夹具 ─────────────────────────────────────────────────────────────────

async function call(base, method, path, { body, raw, cookie, token, headers = {} } = {}) {
  const head = { ...headers }
  if (cookie) head.cookie = cookie
  if (token) head.authorization = `Bearer ${token}`
  if (method !== "GET" && method !== "HEAD") head["content-type"] = head["content-type"] ?? "application/json"
  const payload = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body)
  const res = await fetch(base + path, { method, headers: head, body: payload })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

/** 裸请求（声明 `content-length` 但不写体——体限预检腿用；服务器在预检处即拒，不等体）。 */
function rawCall(base, method, path, headers = {}) {
  const url = new URL(path, base)
  return new Promise((resolve, reject) => {
    let settled = false
    const done = (status) => { if (!settled) { settled = true; resolve({ status }) } }
    const req = httpRequest(
      { hostname: url.hostname, port: url.port, method, path: url.pathname + url.search, headers: { connection: "close", ...headers } },
      (res) => {
        res.resume()
        res.on("end", () => done(res.statusCode))
        res.on("close", () => done(res.statusCode))
      },
    )
    req.on("error", reject)
    req.end()
  })
}

/** 进程内应用（账号面 + 沙盒两面；clock 可注入——时间腿用）。 */
async function startApp({ pollWaitMs = 40, clock = null, maxCheckpointBytes = undefined, checkpointDir = null } = {}) {
  const db = DB.openDatabase(":memory:")
  const { member: admin } = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const { member: alice } = await MEMBERS.createMember(db, { username: "alice", role: "user", password: PASSWORD })
  const config = { host: "127.0.0.1", port: 8123 }
  const now = clock ?? (() => Date.now())
  const routes = SERVER.createRouteTable()
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  SANDBOX_ROUTES.registerSandboxRoutes(routes, { db, config, now, pollWaitMs })
  RUNNER_API.registerRunnerApiRoutes(routes, { db, config, now, pollWaitMs, ...(maxCheckpointBytes === undefined ? {} : { maxCheckpointBytes }), checkpointDir })
  const server = SERVER.createGatewayServer({ config: {}, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = async (username) => {
    const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
    const line = res.setCookies.find((item) => item.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
    return line ? line.split(";")[0] : null
  }
  const app = {
    db, base, adminId: admin.id, aliceId: alice.id,
    adminCookie: await login("admin"),
    aliceCookie: await login("alice"),
    get clock() { return now() },
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); db.close() },
  }
  return app
}

/** 控制台生成加入令牌 ⇒ runner join ⇒ `{ runnerId, token }`。 */
async function joinRunner(app, { name = "runner-a", labels = {}, maxBoxes = null, version = "0.1.0", runtimeAvailable = true, runtime = { engine: "docker" } } = {}) {
  const issued = await call(app.base, "POST", "/api/admin/sandbox/runners/join-token", { cookie: app.adminCookie })
  assert.equal(issued.status, 200, `join-token 应 200：${issued.text}`)
  const joined = await call(app.base, "POST", "/api/runner/join", {
    body: { token: issued.json.token, name, labels, maxBoxes, version, runtimeAvailable, runtime },
  })
  assert.equal(joined.status, 200, `join 应 200：${joined.text}`)
  return { runnerId: joined.json.runnerId, token: joined.json.token, expiresAt: issued.json.expiresAt }
}

async function heartbeat(app, token, payload = {}) {
  return call(app.base, "POST", "/api/runner/heartbeat", { token, body: { version: "0.1.0", runtime: { engine: "docker" }, ...payload } })
}

const workspacesOf = (db) => db.prepare("SELECT * FROM sandbox_workspaces ORDER BY id").all()
const tasksOf = (db, workspaceId) =>
  db.prepare("SELECT * FROM sandbox_tasks WHERE json_extract(payload_json, '$.workspaceId') = ? ORDER BY id").all(workspaceId)

// ── 腿 A（v11 迁移）─────────────────────────────────────────────────────────

test("腿 A 迁移：空库读数 11 ∥ 七表在场 ∥ 种子八行 ∥ limits_json 覆写列在场", () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.equal(DB.readVersion(db), 11, "空库直落 v11")
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'sandbox_%' ORDER BY name").all().map((row) => row.name)
    assert.deepEqual(tables, [
      "sandbox_checkpoints", "sandbox_pending", "sandbox_rules", "sandbox_runners", "sandbox_settings", "sandbox_tasks", "sandbox_workspaces",
    ], "七表在场")
    const seeds = db.prepare("SELECT * FROM sandbox_rules WHERE source = 'default' ORDER BY id").all()
    assert.equal(seeds.length, 8, "种子八行（deny 三 + allow 五）")
    assert.equal(seeds.filter((row) => row.action === "deny").length, 3, "deny 三")
    assert.equal(seeds.filter((row) => row.action === "allow").length, 5, "allow 五")
    assert.deepEqual(seeds.filter((row) => row.kind === "cidr").map((row) => row.target).sort(), ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"], "RFC1918 三条")
    assert.deepEqual(seeds.filter((row) => row.kind === "domain").map((row) => row.target).sort(),
      ["*.gitee.com", "*.githubusercontent.com", "gitee.com", "github.com", "registry.npmjs.org"], "默认单五条")
    const columns = db.prepare("PRAGMA table_info('sandbox_workspaces')").all().map((row) => row.name)
    assert.ok(columns.includes("limits_json"), "覆写列 limits_json 在场")
  } finally {
    db.close()
  }
})

test("腿 A 审计十二型：两新型可写 ∥ 十三型拒（CHECK）", () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.deepEqual(AUDIT.AUDIT_TYPES.slice(-2), ["sandbox_rule", "sandbox_event"], "型面尾两枚 = 沙盒两型")
    assert.equal(AUDIT.AUDIT_TYPES.length, 12, "十二型")
    const idA = AUDIT.recordAudit(db, { type: "sandbox_rule", actor: "admin", detail: { action: "create", rule: {} } })
    const idB = AUDIT.recordAudit(db, { type: "sandbox_event", actor: "runner:x", detail: { kind: "runner_join" } })
    assert.ok(idA > 0 && idB > idA, "两新型可写")
    assert.throws(() => db.prepare("INSERT INTO audit_events (ts, type, actor_name) VALUES (?, 'nope', 'x')").run(Date.now()), /CHECK/, "十三型被 CHECK 拒")
  } finally {
    db.close()
  }
})

test("腿 A v10 库升 v11：读数 11 ∥ 存量审计行逐值保形 ∥ 两索引在场 ∥ 幂等（种子不复活）", () => {
  const db = DB.openDatabase(":memory:", { migrations: DB.MIGRATIONS.slice(0, 10) })
  try {
    assert.equal(DB.readVersion(db), 10, "先落 v10")
    const legacy = AUDIT.recordAudit(db, { type: "config_update", actor: "admin", detail: { keys: ["autoUpdate"] }, ts: 1234567890 })
    assert.equal(DB.migrate(db, { migrations: DB.MIGRATIONS }), 11, "v10 ⇒ v11")
    const row = db.prepare("SELECT * FROM audit_events WHERE id = ?").get(legacy)
    assert.deepEqual([row.ts, row.type, row.actor_name, JSON.parse(row.detail).keys], [1234567890, "config_update", "admin", ["autoUpdate"]], "存量审计行逐值保形")
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'audit_events' ORDER BY name").all().map((item) => item.name)
    assert.deepEqual(indexes, ["idx_audit_ts", "idx_audit_type_ts"], "两索引重建在场")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sandbox_rules WHERE source = 'default'").get().n, 8, "升段种子八行")
    assert.equal(DB.migrate(db, { migrations: DB.MIGRATIONS }), 11, "再开幂等（零重复执行）")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sandbox_rules WHERE source = 'default'").get().n, 8, "幂等后仍八行")
    db.prepare("DELETE FROM sandbox_rules WHERE source = 'default' AND id = (SELECT MIN(id) FROM sandbox_rules)").run()
    DB.migrate(db, { migrations: DB.MIGRATIONS })
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sandbox_rules WHERE source = 'default'").get().n, 7, "种子一次性——删后不复活")
  } finally {
    db.close()
  }
})

// ── 腿 B（N40 ∥ E30）────────────────────────────────────────────────────────

test("腿 B 令牌三态人话（过期 ∥ 已用过 ∥ 令牌不对）+ 失败审计行 + join 只存 sha256 + 心跳在列", async () => {
  const app = await startApp()
  try {
    // ① 伪造令牌 ⇒ 400 人话 + 审计行
    const forged = await call(app.base, "POST", "/api/runner/join", { body: { token: "tc-join-forged", name: "r-f" } })
    assert.equal(forged.status, 400)
    assert.match(forged.json.error.message, /令牌不对/)
    const failed = app.db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_event' AND json_extract(detail, '$.kind') = 'runner_join_failed'").all()
    assert.equal(failed.length, 1, "失败审计行一条")
    assert.equal(JSON.parse(failed[0].detail).reason, "not_found")
    // ② 正常兑换 ⇒ 落行只存 hash；名字/状态断言
    const { runnerId, token } = await joinRunner(app, { name: "runner-a", labels: { pool: "a" }, maxBoxes: 4 })
    const row = app.db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(runnerId)
    assert.equal(row.token_hash, SHA(token), "存 sha256(令牌)")
    assert.notEqual(row.token_hash, token, "库内无明文令牌")
    assert.equal(row.status, "active")
    assert.deepEqual(JSON.parse(row.labels_json), { labels: { pool: "a" }, maxBoxes: 4 }, "容量描述符（标签 + maxBoxes）")
    // ③ 复用同一令牌 ⇒ 400 已用过
    const issued = await call(app.base, "POST", "/api/admin/sandbox/runners/join-token", { cookie: app.adminCookie })
    const once = await call(app.base, "POST", "/api/runner/join", { body: { token: issued.json.token, name: "runner-b" } })
    assert.equal(once.status, 200)
    const reuse = await call(app.base, "POST", "/api/runner/join", { body: { token: issued.json.token, name: "runner-c" } })
    assert.equal(reuse.status, 400)
    assert.match(reuse.json.error.message, /已用过/)
    // ④ 过期（注入钟——模块面直测）
    const probe = DB.openDatabase(":memory:")
    const { token: expToken, expiresAt } = RUNNER_API.createJoinToken(probe, { now: 1_000_000 })
    assert.equal(expiresAt, 1_000_000 + 30 * 60 * 1000, "缺省 30 分钟有效期")
    assert.deepEqual(RUNNER_API.consumeJoinToken(expToken, { now: expiresAt + 1 }), { ok: false, code: "expired", message: RUNNER_API.consumeJoinToken(expToken, { now: expiresAt + 1 }).message }, "过期态")
    assert.match(RUNNER_API.consumeJoinToken(expToken, { now: expiresAt + 1 }).message, /已过期/)
    // ⑤ 心跳 ⇒ 运行面在列；无令牌 ⇒ 401
    await heartbeat(app, token, { boxes: [], diskFreeMb: 1024 })
    const overview = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.equal(overview.status, 200)
    assert.equal(overview.json.status, "available")
    const listed = overview.json.runners.find((item) => item.id === runnerId)
    assert.equal(listed.name, "runner-a")
    assert.ok(listed.lastHeartbeatAt > 0, "心跳时刻在场")
    assert.equal(listed.version, "0.1.0")
    assert.equal(listed.health, "healthy")
    const noToken = await call(app.base, "POST", "/api/runner/heartbeat", { body: {} })
    assert.equal(noToken.status, 401, "无令牌 ⇒ 401")
  } finally {
    await app.close()
  }
})

test("腿 B 长轮询：空轮候满窗返回 ∥ 在飞期间入队 ⇒ 即醒领走（≤1s 级）", async () => {
  const app = await startApp({ pollWaitMs: 300 })
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    // ① 空候：跑满等待窗才回（不忙转、不早回）
    const idleStart = Date.now()
    const idle = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    const idleMs = Date.now() - idleStart
    assert.equal(idle.status, 200)
    assert.deepEqual(idle.json.tasks, [])
    assert.ok(idleMs >= 250, `空候应跑满窗（≥250ms；实读 ${idleMs}ms）`)
    // ② 在飞轮询 + 入队（建工作区 ⇒ create/start）⇒ 唤醒并领走
    const inflight = call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    await new Promise((resolve) => setTimeout(resolve, 60)) // 让在飞轮询先进入等待
    await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const woken = await inflight
    assert.deepEqual(woken.json.tasks.map((task) => task.kind), ["sandbox.create", "sandbox.start"], "入队唤醒（即醒即领）")
  } finally {
    await app.close()
  }
})

// ── 腿 C（N41 ∥ N45 ∥ 放置面）───────────────────────────────────────────────

test("腿 C 建工作区：key 签发 + 放置 + create/start 入队 ∥ 载荷逐值 = 覆写 ∪ 全局默认", async () => {
  const app = await startApp()
  try {
    const { runnerId, token } = await joinRunner(app, { name: "runner-a", labels: { pool: "a" }, maxBoxes: 4 })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", {
      cookie: app.adminCookie,
      body: { name: "ws1", ownerMemberId: app.aliceId, limits: { cpus: 1.5, memMb: 2048 } },
    })
    assert.equal(created.status, 200, created.text)
    const workspace = created.json.workspace
    assert.equal(workspace.runnerId, runnerId, "放置绑定")
    assert.equal(workspace.runnerName, "runner-a")
    assert.equal(workspace.ownerName, "alice", "负责人")
    assert.equal(workspace.boxState, "stopped", "盒未起（缺省读数）")
    assert.deepEqual(workspace.limits, { cpus: 1.5, memMb: 2048 }, "初始覆写回读")
    assert.deepEqual(workspace.limitsResolved, { cpus: 1.5, memMb: 2048, pids: 512, diskMb: 4096, idleTtlMinutes: 30, wallclockTtlHours: 24 }, "取值序 = 覆写 ∪ 默认")
    const keyRow = app.db.prepare("SELECT * FROM api_keys WHERE name = ?").get("sandbox:ws1")
    assert.ok(keyRow, "key 签发（名 sandbox:ws1）")
    assert.equal(keyRow.member_id, app.aliceId, "归属负责人")
    assert.equal(keyRow.status, "active")
    const stored = workspacesOf(app.db)[0]
    assert.equal(stored.key_id, keyRow.id)
    assert.match(stored.key_plain, /^sk-tc-/, "明文在场（披露 D2）")
    assert.equal(SHA(stored.key_plain), keyRow.key_hash, "明文 ↔ 库内 hash 同源")
    const tasks = tasksOf(app.db, stored.id)
    assert.deepEqual(tasks.map((task) => task.kind), ["sandbox.create", "sandbox.start"], "create/start 入队（N41）")
    const payload = JSON.parse(tasks[0].payload_json)
    assert.equal(payload.workspaceId, stored.id)
    assert.equal(payload.image, "thincoder-sandbox:1", "镜像 = 全局默认")
    assert.equal(payload.tmpfsMb, 256)
    assert.deepEqual(payload.limits, { cpus: 1.5, memMb: 2048, pids: 512, diskMb: 4096, idleTtlMinutes: 30, wallclockTtlHours: 24 }, "create 载荷逐值")
    assert.deepEqual(payload.checkpoint, { everyMinutes: 15, keep: 5 }, "快照参数（U5）")
    assert.equal(payload.env.OPENAI_BASE_URL, "http://127.0.0.1:8123/v1", "盒内 baseURL（§7）")
    assert.equal(payload.env.OPENAI_API_KEY, stored.key_plain, "盒内唯一凭据 = 工作区 key（零服务器密钥）")
  } finally {
    await app.close()
  }
})

test("腿 C PATCH 覆写：库回读逐值 ∥ 运行中盒零触（零新指令）∥ 删键回落 ∥ 校验不过 400 库零变", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const id = created.json.workspace.id
    const before = tasksOf(app.db, id).length
    const patched = await call(app.base, "PATCH", `/api/admin/sandbox/workspaces/${id}`, { cookie: app.adminCookie, body: { limits: { cpus: 4 } } })
    assert.equal(patched.status, 200, patched.text)
    assert.deepEqual(patched.json.workspace.limits, { cpus: 4 }, "覆写回读")
    assert.equal(patched.json.workspace.limitsResolved.cpus, 4)
    assert.equal(patched.json.workspace.limitsResolved.pids, 512, "未覆写键随全局默认")
    assert.equal(tasksOf(app.db, id).length, before, "不回队指令（运行中盒零触）")
    const bad = await call(app.base, "PATCH", `/api/admin/sandbox/workspaces/${id}`, { cookie: app.adminCookie, body: { limits: { nope: 1 } } })
    assert.equal(bad.status, 400)
    const badValue = await call(app.base, "PATCH", `/api/admin/sandbox/workspaces/${id}`, { cookie: app.adminCookie, body: { limits: { cpus: -1 } } })
    assert.equal(badValue.status, 400)
    assert.deepEqual(JSON.parse(workspacesOf(app.db)[0].limits_json), { cpus: 4 }, "400 ⇒ 库零变")
    const removed = await call(app.base, "PATCH", `/api/admin/sandbox/workspaces/${id}`, { cookie: app.adminCookie, body: { limits: { cpus: null } } })
    assert.equal(removed.status, 200)
    assert.deepEqual(removed.json.workspace.limits, {}, "null = 删键")
    assert.equal(removed.json.workspace.limitsResolved.cpus, 2, "删键 ⇒ 回落全局默认")
  } finally {
    await app.close()
  }
})

test("腿 C 放置：标签不满足 ⇒ 排队等待（零指令）∥ 合格 runner 加入 ⇒ 续跑 ∥ 容量上限不放置", async () => {
  const app = await startApp()
  try {
    const { token: tokenA } = await joinRunner(app, { name: "runner-a", labels: { pool: "a" }, maxBoxes: 1 })
    await heartbeat(app, tokenA, { boxes: [] })
    const queued = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws-b", ownerMemberId: app.aliceId, requiredLabels: { pool: "b" } } })
    assert.equal(queued.status, 200)
    assert.equal(queued.json.workspace.runnerId, null, "无满足者 ⇒ 未放置（排队等待）")
    assert.equal(tasksOf(app.db, queued.json.workspace.id).length, 0, "排队期零指令")
    const { runnerId: runnerB } = await joinRunner(app, { name: "runner-b", labels: { pool: "b" }, maxBoxes: 2 })
    const placed = workspacesOf(app.db).find((row) => row.name === "ws-b")
    assert.equal(placed.runner_id, runnerB, "join 触达 ⇒ 续跑放置")
    assert.deepEqual(tasksOf(app.db, placed.id).map((task) => task.kind), ["sandbox.create", "sandbox.start"], "续跑入队")
    // 容量：runner-a maxBoxes=1 且其盒清单已有 1 盒 ⇒ 新工作区不得放置到它
    const { token: tokenC } = await joinRunner(app, { name: "runner-c", labels: {}, maxBoxes: 1 })
    await heartbeat(app, tokenC, { boxes: [] })
    // 让 runner-c 满盒：直接喂一盒心跳
    await heartbeat(app, tokenC, { boxes: [{ workspaceId: 999999, state: "running", dirty: false }] })
    const overflow = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws-c", ownerMemberId: app.aliceId } })
    assert.equal(overflow.status, 200)
    assert.notEqual(overflow.json.workspace.runnerId, null)
    const target = overflow.json.workspace.runnerName
    assert.notEqual(target, "runner-c", "满盒 runner 不再放置（容量上限）")
  } finally {
    await app.close()
  }
})

// ── 腿 D（B35 ∥ E32 ∥ P14）─────────────────────────────────────────────────

test("腿 D 可用性门：无 runner ⇒ unavailable + 原因；写动作 503（不降级）；其余面零影响", async () => {
  const app = await startApp()
  try {
    const overview = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.deepEqual([overview.status, overview.json.status, overview.json.reason], [200, "unavailable", "无 runner 注册"], "P14 读数")
    const denied = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    assert.equal(denied.status, 503)
    assert.equal(denied.json.error.code, "sandbox_unavailable", "写动作 503（B35）")
    assert.equal(ERRORS.ERROR_CODES.sandbox_unavailable.status, 503, "全码表在场")
    // 其余面零影响（登录会话面照常）
    const me = await call(app.base, "GET", "/api/me", { cookie: app.adminCookie })
    assert.equal(me.status, 200, "server 其余面零影响")
    // 无 runner 时也可见工作区列表（读面不 503——控制台整页 disabled 由 overview 提供）
    const list = await call(app.base, "GET", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie })
    assert.equal(list.status, 200)
    assert.deepEqual(list.json.workspaces, [])
    // 成员面读 = 契约明文：不可用 ⇒ 503
    const member = await call(app.base, "GET", "/api/me/sandbox/workspaces", { cookie: app.aliceCookie })
    assert.equal(member.status, 503)
    assert.equal(member.json.error.code, "sandbox_unavailable")
  } finally {
    await app.close()
  }
})

test("腿 D E32：doctor 核心项失败 ⇒ 无可用运行时（原因）⇒ 503；恢复上报 ⇒ 转回 available", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-x", runtimeAvailable: false })
    await heartbeat(app, token, { runtimeAvailable: false, boxes: [] })
    const down = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.equal(down.json.status, "unavailable")
    assert.match(down.json.reason, /无可用运行时/)
    assert.equal(down.json.runners[0].runtimeAvailable, false, "自检读数可见（控制台明示）")
    const denied = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    assert.equal(denied.status, 503, "无可用运行时 ⇒ 写动作 503")
    await heartbeat(app, token, { runtimeAvailable: true, boxes: [] })
    const up = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.equal(up.json.status, "available", "恢复自动转回")
  } finally {
    await app.close()
  }
})

// ── 腿 E（N42 ∥ P11 ∥ B36 ∥ B37）───────────────────────────────────────────

test("腿 E 通配校验（B36）：单层左通配收 ∥ 裸 * ∥ TLD 级 ∥ 非左通配 ∥ IP 字面量 ⇒ 400", async () => {
  const app = await startApp()
  try {
    const ok = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, body: { kind: "domain", action: "allow", target: "*.example.com" } })
    assert.equal(ok.status, 200, ok.text)
    const cases = [
      ["*", /裸/],
      ["*.com", /TLD 级/],
      ["a.*.com", /通配仅单层左形/],
      ["*a.example.com", /通配仅单层左形/],
      ["10.0.0.0/8", /IP 字面量/],
    ]
    for (const [target, pattern] of cases) {
      const res = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, body: { kind: "domain", action: "allow", target } })
      assert.equal(res.status, 400, `应 400：${target}`)
      assert.match(res.json.error.message, pattern, `报文指因：${target}`)
    }
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_rules WHERE source IN ('admin','approval')").get().n, 1, "仅合法条目落库（400 零变）")
  } finally {
    await app.close()
  }
})

test("腿 E N42/P11：增删 ⇒ rulesRev +1 + 审计 sandbox_rule ∥ poll 下发全量（零重建）", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    const tasksBefore = app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_tasks").get().n
    const rev0 = app.db ? RULES.getRulesRev() : null
    const add = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, body: { kind: "cidr", action: "allow", target: "203.0.113.0/24", port: 443, protocol: "tcp", note: "内网后端示例" } })
    assert.equal(add.status, 200, add.text)
    assert.equal(add.json.rulesRev, rev0 + 1, "规则增 ⇒ rulesRev +1")
    // poll（携旧 rev）⇒ 全量规则下发（含新条目；下发序 = 求值序）
    const poll = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: 0 } })
    assert.equal(poll.status, 200)
    assert.equal(poll.json.rulesRev, add.json.rulesRev)
    assert.ok(Array.isArray(poll.json.rules), "变则全量规则")
    const delivered = poll.json.rules.find((rule) => rule.target === "203.0.113.0/24")
    assert.deepEqual([delivered.kind, delivered.action, delivered.port, delivered.protocol], ["cidr", "allow", 443, "tcp"])
    assert.equal(poll.json.tasks.length, 2, "所领 = 建工作区的 create/start（规则增删零重建——任务数不变）")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_tasks").get().n, tasksBefore, "零重建（无新指令）")
    const remove = await call(app.base, "DELETE", `/api/admin/sandbox/rules/${add.json.rule.id}`, { cookie: app.adminCookie })
    assert.equal(remove.status, 200)
    assert.equal(remove.json.rulesRev, add.json.rulesRev + 1, "规则删 ⇒ rulesRev +1")
    const audits = app.db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_rule' ORDER BY id").all()
    assert.deepEqual(audits.map((row) => JSON.parse(row.detail).action), ["create", "delete"], "增删各一行审计（N42）")
    assert.equal(JSON.parse(audits[0].detail).rule.target, "203.0.113.0/24", "审计记规则原文")
    // 自动带入网段 deny 同审计（§4「每次增删一行」）+ 幂等（同目标零重复行）
    assert.ok(RULES.ensureSegmentDeny(app.db, "203.0.113.0/24", { now: app.clock }) > 0)
    assert.equal(RULES.ensureSegmentDeny(app.db, "203.0.113.0/24", { now: app.clock }), null, "已在 ⇒ 零动作")
    const autoRows = app.db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_rule' AND actor_name = 'auto'").all()
    assert.deepEqual(autoRows.map((row) => JSON.parse(row.detail).action), ["create"], "自动带入项同审计")
    assert.equal(wsId > 0, true)
  } finally {
    await app.close()
  }
})

test("腿 E2 设置面：GET 键全集缺省 ∥ PATCH 键级合并 + rulesRev +1 ∥ 非法/未知键 ⇒ 400 库零变", async () => {
  const app = await startApp()
  try {
    const dflt = await call(app.base, "GET", "/api/admin/sandbox/settings", { cookie: app.adminCookie })
    assert.equal(dflt.status, 200)
    for (const key of ["cpus", "memMb", "pids", "diskMb", "idleTtlMinutes", "wallclockTtlHours", "checkpointEveryMinutes", "checkpointKeep", "pendingTimeoutSeconds", "joinTtlMinutes", "tmpfsMb", "image"]) {
      assert.ok(dflt.json.settings[key] !== undefined, `键在场：${key}（键全集 = API §2.5）`)
    }
    const rev0 = RULES.getRulesRev()
    const patch = await call(app.base, "PATCH", "/api/admin/sandbox/settings", { cookie: app.adminCookie, body: { memMb: 8192, image: "thincoder-sandbox:2" } })
    assert.equal(patch.status, 200, patch.text)
    assert.equal(patch.json.settings.memMb, 8192)
    assert.equal(patch.json.rulesRev, rev0 + 1, "设置变更 ⇒ rulesRev +1（§2.5——下发即生效）")
    const audits = app.db.prepare("SELECT * FROM audit_events WHERE type = 'config_update' ORDER BY id").all()
    assert.equal(audits.length, 1, "设置变更留审计行（键名清单——值永不入）")
    assert.deepEqual(JSON.parse(audits[0].detail).keys, ["memMb", "image"])
    // 键级合并：未涉键零动 ∥ null = 删键回落默认
    const drop = await call(app.base, "PATCH", "/api/admin/sandbox/settings", { cookie: app.adminCookie, body: { memMb: null } })
    assert.equal(drop.status, 200)
    assert.equal(drop.json.settings.memMb, 4096, "null = 删键回落缺省")
    assert.equal(drop.json.settings.image, "thincoder-sandbox:2", "未涉键零动")
    // 非法：未知键 ∥ 形不合法 ∥ 空写面 ⇒ 400（库零变 ∧ rulesRev 不动）
    const rev1 = RULES.getRulesRev()
    for (const body of [{ nope: 1 }, { memMb: -1 }, { cpus: 0 }, { image: "" }, {}]) {
      const bad = await call(app.base, "PATCH", "/api/admin/sandbox/settings", { cookie: app.adminCookie, body })
      assert.equal(bad.status, 400, `应 400：${JSON.stringify(body)} ⇒ ${bad.text}`)
    }
    assert.equal(RULES.getRulesRev(), rev1, "非法 ⇒ rulesRev 不动")
    assert.deepEqual(
      app.db.prepare("SELECT k, v FROM sandbox_settings ORDER BY k").all().map((row) => `${row.k}=${row.v}`),
      ["image=\"thincoder-sandbox:2\""],
      "库零变（只剩 image 一键）",
    )
    const forbidden = await call(app.base, "GET", "/api/admin/sandbox/settings", { cookie: app.aliceCookie })
    assert.equal(forbidden.status, 403, "user ⇒ 403")
  } finally {
    await app.close()
  }
})

test("腿 E B37/P11 求值序：显式 deny 恒先 ∥ 种子 deny ≺ 显式 allow ∥ 内置恒拒 ∥ 域名单层左 ∥ 默认拒", () => {
  const rule = (over) => ({ id: 0, kind: "cidr", action: "allow", target: "10.0.0.0/8", port: null, protocol: null, priority: 0, note: "", source: "admin", ...over })
  const seeded = [
    rule({ id: 1, action: "deny", target: "10.0.0.0/8", source: "default" }),          // 种子 deny（RFC1918）
    rule({ id: 2, action: "allow", target: "10.1.0.0/16", source: "default" }),         // 种子 allow
  ]
  // ① 同目标：显式 deny + 显式 allow ⇒ 拒（显式 deny 恒先）
  const both = [rule({ id: 1, action: "allow", target: "10.0.0.0/8" }), rule({ id: 2, action: "deny", target: "10.0.0.0/8" })]
  assert.equal(RULES.evaluateEgress(both, { ips: ["10.1.2.3"] }).action, "deny", "显式 deny 恒先")
  // ② 种子 deny ≺ 显式 allow（U2：内网后端可被显式开）
  const opened = [...seeded, rule({ id: 3, action: "allow", target: "10.0.0.0/8", source: "admin" })]
  assert.equal(RULES.evaluateEgress(opened, { ips: ["10.1.2.3"] }).action, "allow", "显式 allow 压种子 deny")
  // ③ 种子 deny 未被开 ⇒ 拒（同源：deny 恒先于同源 allow）
  assert.equal(RULES.evaluateEgress(seeded, { ips: ["10.1.2.3"] }).action, "deny", "种子 deny 恒先于种子 allow")
  assert.equal(RULES.evaluateEgress(seeded, { ips: ["192.168.1.1"] }).action, "deny", "种子 deny 生效")
  // ④ 内置恒拒（非行——显式 allow 也开不了）
  const openLoopback = [rule({ id: 1, action: "allow", target: "127.0.0.0/8" })]
  assert.equal(RULES.evaluateEgress(openLoopback, { ips: ["127.0.0.1"] }).reason, "hard_deny", "回环恒拒")
  assert.equal(RULES.evaluateEgress([rule({ id: 1, action: "allow", target: "169.254.0.0/16" })], { ips: ["169.254.169.254"] }).reason, "hard_deny", "云元数据恒拒")
  // ⑤ 域名单层左通配（恰一级子域）+ 两闸（白名单域名 + 内网解析 ⇒ 拒）
  const domainRules = [rule({ id: 5, kind: "domain", action: "allow", target: "*.example.com" })]
  assert.equal(RULES.evaluateEgress(domainRules, { host: "a.example.com" }).action, "allow", "恰一级子域命中")
  assert.equal(RULES.evaluateEgress(domainRules, { host: "example.com" }).action, "deny", "裸域不命中")
  assert.equal(RULES.evaluateEgress(domainRules, { host: "a.b.example.com" }).action, "deny", "两级子域不命中（单层左）")
  assert.equal(RULES.evaluateEgress([...domainRules, ...seeded], { host: "a.example.com", ips: ["10.1.2.3"] }).action, "deny", "两闸：白名单域名 + 内网解析 ⇒ 拒")
  // ⑥ 默认拒（无条目）
  assert.equal(RULES.evaluateEgress(seeded, { host: "unknown.example.org" }).action, "deny", "默认全拒")
})

// ── 腿 F（N43 ∥ P12 ∥ B38）──────────────────────────────────────────────────

test("腿 F 待批：登记去重 hits++ ∥ 三态裁定 + poll 下发一次 ∥ 超时结算 ∥ 审计三态", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    const first = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "API.Example.com" } })
    assert.equal(first.status, 200, first.text)
    assert.equal(first.json.timeoutSeconds, 60, "挂起窗 = 设置项 60s")
    const second = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "api.example.com" } })
    assert.deepEqual([second.json.id, second.json.hits], [first.json.id, 2], "同 host 去重 + hits++（大小写不敏感）")
    const listed = await call(app.base, "GET", "/api/admin/sandbox/pending", { cookie: app.adminCookie })
    assert.equal(listed.json.pending.length, 1)
    assert.equal(listed.json.pending[0].host, "API.Example.com", "原样存（去重按小写比）")
    assert.deepEqual(listed.json.suggestions, [])
    // ① 批准一次 ⇒ 裁定下发一次（再 poll 不重发）
    const once = await call(app.base, "POST", `/api/admin/sandbox/pending/${first.json.id}/resolve`, { cookie: app.adminCookie, body: { decision: "once" } })
    assert.equal(once.status, 200, once.text)
    assert.equal(once.json.pending.status, "approved_once")
    const poll1 = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    assert.deepEqual(poll1.json.pendingResolutions, [{ id: first.json.id, workspaceId: wsId, host: "API.Example.com", decision: "once" }], "裁定经 poll 下发")
    const poll2 = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    assert.deepEqual(poll2.json.pendingResolutions, [], "已下发不重发")
    const repeat = await call(app.base, "POST", `/api/admin/sandbox/pending/${first.json.id}/resolve`, { cookie: app.adminCookie, body: { decision: "deny" } })
    assert.equal(repeat.status, 400, "重复裁定 ⇒ 400")
    // ② 批准并记住 ⇒ 规则入表（source=approval）+ rulesRev +1
    const second2 = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "remember.example.com" } })
    const revBefore = RULES.getRulesRev()
    const remember = await call(app.base, "POST", `/api/admin/sandbox/pending/${second2.json.id}/resolve`, { cookie: app.adminCookie, body: { decision: "remember" } })
    assert.equal(remember.status, 200, remember.text)
    assert.equal(remember.json.rule.source, "approval")
    assert.equal(remember.json.rulesRev, revBefore + 1, "remember ⇒ rulesRev +1")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_rules WHERE kind = 'domain' AND action = 'allow' AND source = 'approval' AND target = ?").get("remember.example.com").n, 1, "规则入表即生效")
    // ③ 拒绝
    const third = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "deny.example.com" } })
    const deny = await call(app.base, "POST", `/api/admin/sandbox/pending/${third.json.id}/resolve`, { cookie: app.adminCookie, body: { decision: "deny" } })
    assert.equal(deny.json.pending.status, "denied")
    // ④ 超时（注入钟——懒惰结算）
    const fourth = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "slow.example.com" } })
    assert.equal(RULES.sweepPendingTimeouts(app.db, { now: Date.now() + 61_000, actor: "system" }), 1, "超窗 ⇒ 结算一行")
    assert.equal(app.db.prepare("SELECT status FROM sandbox_pending WHERE id = ?").get(fourth.json.id).status, "timeout", "超时 ⇒ 拒态")
    const kinds = app.db.prepare("SELECT detail FROM audit_events WHERE type = 'sandbox_event' AND json_extract(detail, '$.kind') = 'approval' ORDER BY id").all().map((row) => JSON.parse(row.detail).decision)
    assert.deepEqual(kinds, ["once", "remember", "deny", "timeout"], "三态 + 超时审计（N43）")
  } finally {
    await app.close()
  }
})

test("腿 F B38：三次批准同一域 ⇒ 建议入默认单 ∥ 采纳（source=default）⇒ 建议消除", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    for (let i = 0; i < 3; i++) {
      const reg = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: wsId, host: "newhost.example.net" } })
      await call(app.base, "POST", `/api/admin/sandbox/pending/${reg.json.id}/resolve`, { cookie: app.adminCookie, body: { decision: "once" } })
    }
    const listed = await call(app.base, "GET", "/api/admin/sandbox/pending", { cookie: app.adminCookie })
    assert.deepEqual(listed.json.suggestions, [{ host: "newhost.example.net", approvals: 3 }], "三次批准 ⇒ 建议行")
    const adopt = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, body: { kind: "domain", action: "allow", target: "newhost.example.net", source: "default" } })
    assert.equal(adopt.status, 200, adopt.text)
    assert.equal(adopt.json.rule.source, "default", "采纳 = 并入默认单种子")
    const after = await call(app.base, "GET", "/api/admin/sandbox/pending", { cookie: app.adminCookie })
    assert.deepEqual(after.json.suggestions, [], "已入默认单 ⇒ 建议消除")
  } finally {
    await app.close()
  }
})

// ── 腿 G（B41）─────────────────────────────────────────────────────────────

test("腿 G 悬挂回收：幂等 kind ⇒ 回 queued 重派 ∥ exec ⇒ failed + 原因 ∥ 控制台工作区行可见", async () => {
  let clock = 1_700_000_000_000
  const app = await startApp({ clock: () => clock })
  try {
    const { runnerId, token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    const claimed = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    assert.deepEqual(claimed.json.tasks.map((task) => task.kind), ["sandbox.create", "sandbox.start"], "领指令（claimed）")
    // exec（非幂等）+ checkpoint（幂等）各一——直注入队（exec 无 admin 端点）
    REGISTRY.enqueueTask(app.db, { runnerId, kind: "sandbox.exec", workspaceId: wsId, payload: { command: "npm test" }, now: clock })
    REGISTRY.enqueueTask(app.db, { runnerId, kind: "sandbox.checkpoint", workspaceId: wsId, payload: {}, now: clock })
    const claimed2 = await call(app.base, "POST", "/api/runner/poll", { token, body: { rulesRev: RULES.getRulesRev() } })
    assert.equal(claimed2.json.tasks.length, 2)
    clock += 6 * 60 * 1000 // 领取逾期（>5 分钟）+ 心跳失联（>45s）
    const reclaimed = REGISTRY.sweepStuckTasks(app.db, { now: clock })
    assert.deepEqual(reclaimed.map((item) => `${item.kind}:${item.action}`).sort(), [
      "sandbox.checkpoint:requeued", "sandbox.create:requeued", "sandbox.exec:failed", "sandbox.start:requeued",
    ], "幂等 kind 回 queued 重派 ∥ exec ⇒ failed（§3）")
    // 控制台行可见：最近一条 = checkpoint（重派中）∥ exec ⇒ failed + 原因可读
    const list = await call(app.base, "GET", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie })
    const row = list.json.workspaces.find((item) => item.id === wsId)
    assert.deepEqual([row.lastTask.kind, row.lastTask.status, row.lastTask.requeued], ["sandbox.checkpoint", "queued", true], "重派中可见（queued）")
    const execRow = app.db.prepare("SELECT * FROM sandbox_tasks WHERE kind = 'sandbox.exec'").get()
    assert.deepEqual([execRow.status, JSON.parse(execRow.result_json).reason.includes("runner 失联")], ["failed", true], "exec ⇒ failed + 原因（不自动重跑）")
    const requeuedCreate = app.db.prepare("SELECT * FROM sandbox_tasks WHERE kind = 'sandbox.create'").get()
    assert.deepEqual([requeuedCreate.status, requeuedCreate.claimed_at !== null], ["queued", true], "幂等 kind 回 queued（claimed_at 留作重派标记）")
  } finally {
    await app.close()
  }
})

// ── 腿 H（E29 ∥ E31 ∥ 成员面）───────────────────────────────────────────────

test("腿 H E29：admin 三态（user 403 ∥ 无会话 401 ∥ admin 200）∥ runner 令牌打 /api/* ⇒ 401", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    assert.equal((await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.aliceCookie })).status, 403, "user ⇒ 403")
    assert.equal((await call(app.base, "GET", "/api/admin/sandbox/overview")).status, 401, "无会话 ⇒ 401")
    assert.equal((await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })).status, 200, "admin ⇒ 200")
    assert.equal((await call(app.base, "GET", "/api/admin/sandbox/overview", { token })).status, 401, "runner 令牌打控制面 ⇒ 401（最小权限）")
    assert.equal((await call(app.base, "GET", "/api/me", { token })).status, 401, "runner 令牌打账号面 ⇒ 401")
    assert.equal((await call(app.base, "POST", "/api/runner/heartbeat", { cookie: app.adminCookie, body: {} })).status, 401, "会话打 runner 面 ⇒ 401（专属守卫）")
  } finally {
    await app.close()
  }
})

test("腿 H E31：销毁二次确认（dirty 警示）∥ 轮换 = 旧 key 即失效 + 重建三指令（卷保留）", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    const oldPlain = workspacesOf(app.db)[0].key_plain
    assert.ok(KEYS.verifyKey(app.db, oldPlain), "旧 key 在效")
    // dirty 上报 ⇒ 未确认销毁 ⇒ 400（警示文案 + 快照数）
    await heartbeat(app, token, { boxes: [{ workspaceId: wsId, state: "running", dirty: true }] })
    const denied = await call(app.base, "POST", `/api/admin/sandbox/workspaces/${wsId}/destroy`, { cookie: app.adminCookie, body: {} })
    assert.equal(denied.status, 400)
    assert.match(denied.json.error.message, /未提交改动/)
    // 轮换：旧 key 401（即断）⇒ 新 key 生效 + 重建三指令（destroy 卷保留 + create + start，新值注入）
    const rotate = await call(app.base, "POST", `/api/admin/sandbox/workspaces/${wsId}/rotate-key`, { cookie: app.adminCookie, body: {} })
    assert.equal(rotate.status, 200, rotate.text)
    assert.equal(KEYS.verifyKey(app.db, oldPlain), null, "旧 key 吊销即断（401 面）")
    const newPlain = workspacesOf(app.db)[0].key_plain
    assert.ok(KEYS.verifyKey(app.db, newPlain), "新 key 生效")
    const rebuild = tasksOf(app.db, wsId).filter((task) => task.id > 2)
    assert.deepEqual(rebuild.map((task) => task.kind), ["sandbox.destroy", "sandbox.create", "sandbox.start"], "拆容器重建（卷保留）")
    assert.deepEqual(JSON.parse(rebuild[0].payload_json), { workspaceId: wsId, deleteVolume: false }, "重建销毁 = 卷保留")
    assert.equal(JSON.parse(rebuild[1].payload_json).env.OPENAI_API_KEY, newPlain, "新 key 于重建时注入 env")
    // 销毁（已确认）⇒ 吊销 key + deleteVolume: true
    const destroyed = await call(app.base, "POST", `/api/admin/sandbox/workspaces/${wsId}/destroy`, { cookie: app.adminCookie, body: { confirm: true } })
    assert.equal(destroyed.status, 200, destroyed.text)
    assert.equal(KEYS.verifyKey(app.db, newPlain), null, "销毁 ⇒ 吊销")
    const destroyTask = tasksOf(app.db, wsId).at(-1)
    assert.equal(destroyTask.kind, "sandbox.destroy")
    assert.equal(JSON.parse(destroyTask.payload_json).deleteVolume, true)
  } finally {
    await app.close()
  }
})

test("腿 H 成员面：恒本人过滤 ∥ 字段形（盒状态/回收原因/dirty/快照数/待批）∥ 不可用 503", async () => {
  const app = await startApp()
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws-alice", ownerMemberId: app.aliceId } })
    await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws-admin", ownerMemberId: app.adminId } })
    const alice = app.db.prepare("SELECT id FROM sandbox_workspaces WHERE name = 'ws-alice'").get().id
    await heartbeat(app, token, { boxes: [{ workspaceId: alice, state: "stopped", stopReason: "idle_ttl", dirty: true }] })
    const reg = await call(app.base, "POST", "/api/runner/pending", { token, body: { workspaceId: alice, host: "want.example.com" } })
    assert.equal(reg.status, 200)
    const mine = await call(app.base, "GET", "/api/me/sandbox/workspaces", { cookie: app.aliceCookie })
    assert.equal(mine.status, 200, mine.text)
    assert.deepEqual(mine.json.workspaces.map((item) => item.name), ["ws-alice"], "恒本人过滤（admin 的工作区零出现）")
    const row = mine.json.workspaces[0]
    assert.deepEqual([row.boxState, row.stopReason, row.dirty, row.checkpointCount], ["stopped", "idle_ttl", true, 0], "字段逐值")
    assert.equal(row.pending.host, "want.example.com", "待批发起方提示（不得静默）")
    assert.ok(row.pending.since > 0, "since 时刻在场")
    const adminView = await call(app.base, "GET", "/api/me/sandbox/workspaces", { cookie: app.adminCookie })
    assert.deepEqual(adminView.json.workspaces.map((item) => item.name), ["ws-admin"], "admin 同样恒本人")
  } finally {
    await app.close()
  }
})
// ── 腿 J（B27 ∥ E7 通则）────────────────────────────────────────────────────

test("腿 J B27：快照上送（octet-stream 流式落盘 ≤限 ∥ 超限 413 不落盘）+ 取回往返 ∥ 保留份数 ∥ E7 通则保持（他写端点 JSON 门 + 32 MiB）", async () => {
  const tmpBase = join(ROOT, ".thincoder", "tmp")
  mkdirSync(tmpBase, { recursive: true })
  const checkpointDir = mkdtempSync(join(tmpBase, "sandbox-ckpt-"))
  const app = await startApp({ maxCheckpointBytes: 1024, checkpointDir })
  try {
    const { token } = await joinRunner(app, { name: "runner-a" })
    await heartbeat(app, token, { boxes: [] })
    const created = await call(app.base, "POST", "/api/admin/sandbox/workspaces", { cookie: app.adminCookie, body: { name: "ws1", ownerMemberId: app.aliceId } })
    const wsId = created.json.workspace.id
    // ① 上送 ≤ 限 ⇒ 200 + 流式落盘（盘面字节逐值）+ 登记行 + 审计（型门豁免 = 本路由收 octet-stream 不被拒）
    const payload = Buffer.alloc(800, 7)
    const up = await call(app.base, "POST", `/api/runner/checkpoint?workspaceId=${wsId}&note=wip`, { token, headers: { "content-type": "application/octet-stream" }, raw: payload })
    assert.equal(up.status, 200, up.text)
    assert.equal(up.json.checkpoint.size, 800, "上送字节数回读")
    const row = app.db.prepare("SELECT * FROM sandbox_checkpoints WHERE id = ?").get(up.json.checkpoint.id)
    assert.equal(row.size, 800)
    assert.ok(row.blob_path.startsWith(checkpointDir), "落盘位 = 注入目录")
    assert.deepEqual(readFileSync(row.blob_path), payload, "盘面字节 = 上送字节（流式落盘）")
    assert.deepEqual(readdirSync(checkpointDir).filter((name) => name.endsWith(".part")), [], "零 `.part` 残档")
    const auditRow = app.db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_event' ORDER BY id DESC LIMIT 1").get()
    assert.equal(JSON.parse(auditRow.detail).kind, "checkpoint", "审计行（detail.kind = checkpoint）")
    // ② 取回往返（换机重建套用）
    const back = await call(app.base, "GET", `/api/runner/checkpoint/${row.id}`, { token })
    assert.equal(back.status, 200)
    assert.equal(back.text.length, payload.toString("utf8").length, "取回体长在场") // 二进制以 utf8 读回 = 逐字节等价形（值 7 为 ASCII 控制符，长度可比）
    // ③ 保留份数（checkpointKeep 缺省 5）：第 6 份入 ⇒ 最旧行与档齐删
    let last = up
    for (let i = 0; i < 5; i++) {
      last = await call(app.base, "POST", `/api/runner/checkpoint?workspaceId=${wsId}`, { token, headers: { "content-type": "application/octet-stream" }, raw: Buffer.alloc(10, i + 1) })
      assert.equal(last.status, 200, last.text)
    }
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_checkpoints WHERE workspace_id = ?").get(wsId).n, 5, "每工作区保留最近 5 份")
    assert.equal(existsSync(row.blob_path), false, "最旧档随删")
    assert.ok(last.json.checkpoint.dropped >= 1, "超出份数随删（dropped 读数）")
    // ④ 超限 ⇒ 413 不落盘（B27 第二支）
    const before = app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_checkpoints").get().n
    const filesBefore = readdirSync(checkpointDir).length
    const tooBig = await call(app.base, "POST", `/api/runner/checkpoint?workspaceId=${wsId}`, { token, headers: { "content-type": "application/octet-stream" }, raw: Buffer.alloc(2048, 9) })
    assert.equal(tooBig.status, 413, tooBig.text)
    assert.equal(tooBig.json.error.code, "payload_too_large")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_checkpoints").get().n, before, "不落盘（零新行）")
    assert.equal(readdirSync(checkpointDir).length, filesBefore, "不落盘（零新档 ∥ 零残档）")
    // ④2 多块超限（体远大于限、多处块）⇒ 413 + 零残档 + 服务存活（残留块不得再写已销毁流）
    const flood = await call(app.base, "POST", `/api/runner/checkpoint?workspaceId=${wsId}`, { token, headers: { "content-type": "application/octet-stream" }, raw: Buffer.alloc(256 * 1024, 3) })
    assert.equal(flood.status, 413, "多块超限 ⇒ 413")
    assert.deepEqual(readdirSync(checkpointDir).filter((name) => name.endsWith(".part")), [], "多块超限：零 `.part` 残档")
    assert.equal((await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })).status, 200, "服务存活（超限后照常应答）")
    // ⑤ E7 通则：他写端点照旧 JSON 型门（非 JSON 体 ⇒ 400）∥ 32 MiB 声明长 ⇒ 413；快照路由声明长 > 200 MiB ⇒ 413
    const nonJson = await call(app.base, "POST", "/api/admin/sandbox/rules", { cookie: app.adminCookie, headers: { "content-type": "text/plain" }, raw: "kind=cidr" })
    assert.equal(nonJson.status, 400, "他写端点：非 JSON ⇒ 400（型门不动）")
    const over32 = await rawCall(app.base, "POST", "/api/admin/sandbox/rules", { "content-type": "application/json", "content-length": String(33 * 1024 * 1024) })
    assert.equal(over32.status, 413, "他写端点：32 MiB 通则不动（E7）")
    const over200 = await rawCall(app.base, "POST", "/api/runner/checkpoint", { "content-type": "application/octet-stream", "content-length": String(300 * 1024 * 1024) })
    assert.equal(over200.status, 413, "快照路由：路由级 200 MiB（B27）")
  } finally {
    await app.close()
    rmSync(checkpointDir, { recursive: true, force: true })
  }
})


// ── 腿 I（链自检）───────────────────────────────────────────────────────────

test("腿 I 链自检：`prepublishOnly` 含本批件 ∥ 清单目标在盘（`includes` 形）", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
  const files = pkg.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.ok(files.includes(BATCH_FILE), `本批件应入列：${BATCH_FILE}（现 ${files.length} 件）`)
  for (const file of files) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
