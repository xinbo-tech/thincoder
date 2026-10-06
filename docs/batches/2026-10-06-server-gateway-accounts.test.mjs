/**
 * 2026-10-06-server-gateway-accounts.test.mjs — thincoder-server 批内单测件（D2 段：账号域）
 * （名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根——三件一并）：
 *   node --test docs/batches/2026-10-06-server-gateway.test.mjs docs/batches/2026-10-06-server-gateway-accounts.test.mjs
 *     docs/batches/2026-10-06-server-gateway-metering.test.mjs
 *
 * 射程：团队 key 面（签发 ∥ 查库校验 ∥ 吊销即判 ∥ 轮转——AC-5 函数面）∥ scrypt/最小长度/防枚举哑散列 ∥
 * 引导幂等（KD-SV-15）∥ 登录/会话/过期/登出（cookie 属性 ∥ 同措辞同耗时）∥ 写端点 JSON 型门 ∥ 改密（N7/B8）∥
 * 轮换（N8）∥ 管理面（N5/N9/N11 ∥ E9）∥ 吊销/重置（N10）∥ CLI 七命令实跑 ∥ 入口 bootstrap 双启幂等（B7）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const BIN_PATH = join(ROOT, "thincoder-server", "bin", "thincoder-server.mjs")
const CLI_PATH = join(ROOT, "thincoder-server", "src", "ops", "cli.mjs")

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
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

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tcsrv-${tag}-`))
}

/** 进程内服务夹具（真 HTTP 面）：内存库 + 三族注册行。 */
async function startServer({ bootstrap = null } = {}) {
  const db = DB.openDatabase(":memory:")
  if (bootstrap) await MEMBERS.ensureBootstrap(db, bootstrap)
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

async function call(base, method, path, { body, cookie, contentType = "application/json", raw, headers = {} } = {}) {
  const requestHeaders = { ...headers }
  if (contentType !== null && !("content-type" in requestHeaders)) requestHeaders["content-type"] = contentType
  if (cookie) requestHeaders.cookie = cookie
  const res = await fetch(base + path, {
    method,
    headers: requestHeaders,
    body: raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body),
  })
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

function cookieOf(res) {
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return hit ? hit.split(";")[0] : null
}
async function login(base, username, password) {
  const res = await post(base, "/api/login", { body: { username, password } })
  return { res, cookie: cookieOf(res) }
}
async function makeMember(db, { username = "alice", name = undefined, role = "user", password = PASSWORD } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, name, role, password })
  return member
}
function runCli(args) {
  const child = spawn(process.execPath, [CLI_PATH, ...args], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
  let out = ""
  let err = ""
  child.stdout.on("data", (d) => { out += d })
  child.stderr.on("data", (d) => { err += d })
  return new Promise((resolve) => child.on("exit", (code) => resolve({ code, out, err })))
}
function spawnServer(configFile) {
  const child = spawn(process.execPath, [BIN_PATH, "--config", configFile], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
  let out = ""
  let err = ""
  child.stdout.on("data", (d) => { out += d })
  child.stderr.on("data", (d) => { err += d })
  return { child, exited: new Promise((resolve) => child.on("exit", resolve)), out: () => out, err: () => err }
}
async function waitFor(predicate, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return predicate()
}
async function freePort() {
  const probe = createNetServer()
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve))
  const port = probe.address().port
  await new Promise((resolve) => probe.close(resolve))
  return port
}

test("keys：签发（形 ∥ 库内无明文）∥ 查库校验 ∥ 吊销即判 ∥ 轮转", async () => {
  const db = DB.openDatabase(":memory:")
  try {
    const alice = await makeMember(db)
    const issued = KEYS.issueKey(db, alice.id)
    assert.match(issued.plain, /^sk-tc-[A-Za-z0-9_-]{43}$/)
    assert.equal(issued.hint, `${issued.plain.slice(0, 12)}…${issued.plain.slice(-4)}`)
    const row = db.prepare("SELECT key_hash FROM api_keys WHERE id = ?").get(issued.id)
    assert.equal(row.key_hash, KEYS.hashKey(issued.plain)) // sha256 hex 存储
    assert.notEqual(row.key_hash, issued.plain) // 库内无明文
    const hit = KEYS.verifyKey(db, issued.plain)
    assert.equal(hit.keyId, issued.id)
    assert.equal(hit.memberId, alice.id)
    assert.equal(hit.member.username, "alice")
    assert.equal(KEYS.verifyKey(db, `sk-tc-${"x".repeat(43)}`), null) // 未知
    assert.equal(KEYS.verifyKey(db, "not-a-key"), null)
    assert.equal(KEYS.revokeKey(db, issued.id), true)
    assert.equal(KEYS.verifyKey(db, issued.plain), null) // 吊销 ⇒ 下一次校验即 null（无缓存）
    assert.equal(KEYS.revokeKey(db, issued.id), false) // 二次吊销幂等（无变更）
    const first = KEYS.rotateKey(db, alice.id) // 无旧 ⇒ 等同首签
    assert.ok(KEYS.verifyKey(db, first.plain))
    const second = KEYS.rotateKey(db, alice.id)
    assert.equal(KEYS.verifyKey(db, first.plain), null) // 旧即失效
    assert.ok(KEYS.verifyKey(db, second.plain))
    assert.deepEqual(KEYS.activeKeysOf(db, alice.id).map((k) => k.id), [second.id]) // 仅列未吊销
  } finally {
    db.close()
  }
})

test("members：scrypt 编码串（自描述）∥ 校验 ∥ 畸形串 ∥ 最小长度 ∥ 防枚举哑散列", async () => {
  const encoded = await MEMBERS.hashPassword(PASSWORD)
  assert.match(encoded, /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/)
  assert.equal(await MEMBERS.verifyPassword(PASSWORD, encoded), true)
  assert.equal(await MEMBERS.verifyPassword("wrong-pass", encoded), false)
  assert.equal(await MEMBERS.verifyPassword(PASSWORD, "scrypt$broken"), false)
  assert.equal(await MEMBERS.verifyPassword(PASSWORD, "scrypt$3$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"), false) // 参数越界（N 非 2 的幂）⇒ false 不抛
  assert.equal(await MEMBERS.verifyPassword(PASSWORD, "scrypt$1048576$32$16$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"), false) // 参数在界内但超 scrypt maxmem ⇒ 抛 ⇒ catch 归 false
  const started = Date.now()
  assert.equal(await MEMBERS.verifyPassword(PASSWORD, undefined), false)
  assert.ok(Date.now() - started >= 5, "哑散列须真跑 scrypt（非即时 false——防枚举耗时口径）")
  await assert.rejects(MEMBERS.hashPassword("short"), (e) => e.code === "invalid_request_error" && /8/.test(e.message))
  assert.ok(MEMBERS.generateTempPassword().length >= 8)
})

test("bootstrap：零 admin 建 ∥ 幂等（不重建 ∥ 不改密）∥ 未配置 ⇒ 告警读数", async () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.deepEqual(await MEMBERS.ensureBootstrap(db, null), { action: "warning", reason: "no_admin_no_bootstrap" })
    assert.deepEqual(await MEMBERS.ensureBootstrap(db, { username: "admin", password: "admin-pass-1" }), { action: "created", username: "admin" })
    assert.equal(MEMBERS.countAdmins(db), 1)
    const hashBefore = MEMBERS.findMemberByUsername(db, "admin").password_hash
    assert.deepEqual(await MEMBERS.ensureBootstrap(db, { username: "admin", password: "admin-pass-2" }), { action: "skipped", reason: "admin_present" })
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM members").get().n, 1)
    assert.equal(MEMBERS.findMemberByUsername(db, "admin").password_hash, hashBefore)
    assert.equal(await MEMBERS.verifyPassword("admin-pass-1", hashBefore), true)
    assert.equal(await MEMBERS.verifyPassword("admin-pass-2", hashBefore), false)
  } finally {
    db.close()
  }
})

test("登录：200 + cookie 属性齐 ∥ 错凭据同措辞同耗时 ∥ /api/me 行形", async () => {
  const app = await startServer()
  try {
    const alice = await makeMember(app.db)
    const { res, cookie } = await login(app.base, "alice", PASSWORD)
    assert.equal(res.status, 200)
    assert.match(res.setCookies[0], /^tc_session=[A-Za-z0-9_-]{43}; Path=\/; HttpOnly; SameSite=Strict; Max-Age=604800$/)
    const wrong = await login(app.base, "alice", "WRONG-pass")
    const ghost = await login(app.base, "nobody", "WRONG-pass")
    assert.equal(wrong.res.status, 401)
    assert.equal(ghost.res.status, 401)
    assert.equal(wrong.res.json.error.code, "invalid_credentials")
    assert.equal(ghost.res.json.error.message, wrong.res.json.error.message) // 同措辞（防枚举）
    const t0 = Date.now(); await login(app.base, "alice", "WRONG-pass"); const wrongMs = Date.now() - t0
    const t1 = Date.now(); await login(app.base, "nobody", "WRONG-pass"); const ghostMs = Date.now() - t1
    assert.ok(wrongMs >= 5 && ghostMs >= 5, `两况均须真跑散列（${wrongMs}ms / ${ghostMs}ms）`)
    const me = await get(app.base, "/api/me", { cookie })
    assert.equal(me.status, 200)
    assert.deepEqual(me.json, { id: alice.id, name: "alice", username: "alice", role: "user", quotaTokens: null, usedTokens: 0, keys: [] })
    const key = KEYS.issueKey(app.db, alice.id)
    assert.deepEqual((await get(app.base, "/api/me", { cookie })).json.keys, [{ id: key.id, hint: key.hint }])
  } finally {
    await app.close()
  }
})

test("会话：无/伪造/过期 cookie ⇒ 401 unauthorized ∥ 登出（删行 + 清 cookie）", async () => {
  const app = await startServer()
  try {
    const alice = await makeMember(app.db)
    for (const path of ["/api/me", "/api/me/usage", "/api/usage", "/api/members"]) {
      const res = await get(app.base, path)
      assert.equal(res.status, 401, path)
      assert.equal(res.json.error.code, "unauthorized", path)
    }
    assert.equal((await get(app.base, "/api/me", { cookie: "tc_session=bogus" })).status, 401)
    const expired = SESSION.createSession(app.db, alice.id, { now: Date.now() - SESSION.SESSION_TTL_MS - 1000 })
    assert.equal((await get(app.base, "/api/me", { cookie: `tc_session=${expired.token}` })).status, 401) // 过期即判
    const { cookie } = await login(app.base, "alice", PASSWORD)
    const out = await post(app.base, "/api/logout", { cookie })
    assert.equal(out.status, 200)
    assert.match(out.setCookies[0], /^tc_session=; Path=\/; HttpOnly; SameSite=Strict; Max-Age=0$/)
    assert.equal((await get(app.base, "/api/me", { cookie })).status, 401) // 行已删
    assert.equal((await post(app.base, "/api/logout", {})).status, 401) // 无会话
  } finally {
    await app.close()
  }
})

test("写端点：仅收 application/json（缺失 ∥ 其它型 ⇒ 400；charset 参数放行；GET 不受限）", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db)
    const body = JSON.stringify({ username: "alice", password: PASSWORD })
    for (const contentType of [null, "text/plain", "application/x-www-form-urlencoded"]) {
      const res = await post(app.base, "/api/login", { raw: Buffer.from(body), contentType })
      assert.equal(res.status, 400, `content-type=${contentType}`)
      assert.equal(res.json.error.code, "invalid_request_error")
    }
    assert.equal((await post(app.base, "/api/login")).status, 400) // 缺 Content-Type（无体形）
    assert.equal((await post(app.base, "/api/login", { raw: body, contentType: "application/json; charset=utf-8" })).status, 200)
    assert.equal((await get(app.base, "/api/me")).status, 401) // GET 不受型门（401 而非 400）
  } finally {
    await app.close()
  }
})

test("改密：旧密错 ⇒ 401 原状不变 ∥ 成功 ⇒ 旧密失效 + 其他会话吊销（当前保留）", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db)
    const a = await login(app.base, "alice", PASSWORD)
    const b = await login(app.base, "alice", PASSWORD)
    const bad = await post(app.base, "/api/me/password", { cookie: a.cookie, body: { oldPassword: "nope", newPassword: "new-password-1" } })
    assert.equal(bad.status, 401)
    assert.equal(bad.json.error.code, "invalid_credentials")
    assert.equal((await login(app.base, "alice", PASSWORD)).res.status, 200) // 原密仍可登
    assert.equal((await get(app.base, "/api/me", { cookie: b.cookie })).status, 200) // 会话不变（B8）
    const ok = await post(app.base, "/api/me/password", { cookie: a.cookie, body: { oldPassword: PASSWORD, newPassword: "new-password-1" } })
    assert.equal(ok.status, 200)
    assert.equal((await login(app.base, "alice", PASSWORD)).res.status, 401) // 旧密失效
    assert.equal((await login(app.base, "alice", "new-password-1")).res.status, 200)
    assert.equal((await get(app.base, "/api/me", { cookie: a.cookie })).status, 200) // 当前保留
    assert.equal((await get(app.base, "/api/me", { cookie: b.cookie })).status, 401) // 其他吊销
    assert.equal((await post(app.base, "/api/me/password", { cookie: a.cookie, body: { oldPassword: "new-password-1", newPassword: "123" } })).status, 400) // < 8
  } finally {
    await app.close()
  }
})

test("轮换：新明文一次性 ∥ 旧 key 即失效 ∥ /api/me 清单只剩新 key", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db)
    const { cookie } = await login(app.base, "alice", PASSWORD)
    const first = await post(app.base, "/api/me/keys/rotate", { cookie })
    assert.equal(first.status, 200)
    assert.match(first.json.plain, /^sk-tc-[A-Za-z0-9_-]{43}$/)
    assert.equal(KEYS.verifyKey(app.db, first.json.plain).keyId, first.json.id)
    const second = await post(app.base, "/api/me/keys/rotate", { cookie })
    assert.equal(KEYS.verifyKey(app.db, first.json.plain), null) // 旧 key 下一次校验即 null（AC-5）
    assert.ok(KEYS.verifyKey(app.db, second.json.plain))
    assert.deepEqual((await get(app.base, "/api/me", { cookie })).json.keys, [{ id: second.json.id, hint: second.json.hint }])
  } finally {
    await app.close()
  }
})

test("管理面：无会话 401 ∥ user 越权 ⇒ 403（读+写）∥ 建成员 ⇒ 一次性临时密码 ∥ 列表行形", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const user = await login(app.base, "alice", PASSWORD)
    const targets = [
      ["GET", "/api/members"],
      ["GET", "/api/usage"],
      ["POST", "/api/members"],
      ["POST", `/api/members/${alice.id}/quota`],
      ["POST", `/api/members/${alice.id}/keys/1/revoke`],
      ["POST", `/api/members/${alice.id}/password-reset`],
    ]
    for (const [method, path] of targets) {
      const res = await call(app.base, method, path, { cookie: user.cookie, body: method === "GET" ? undefined : {} })
      assert.equal(res.status, 403, `${method} ${path}`)
      assert.equal(res.json.error.code, "forbidden")
    }
    assert.equal((await get(app.base, "/api/members")).status, 401) // 无会话 ⇒ 401（先于角色）
    const admin = await login(app.base, "admin", "admin-password")
    const created = await post(app.base, "/api/members", { cookie: admin.cookie, body: { username: "bob" } })
    assert.equal(created.status, 200)
    assert.equal(created.json.username, "bob")
    assert.ok(created.json.tempPassword.length >= 8) // 服务器生成——一次性回显
    assert.equal((await login(app.base, "bob", created.json.tempPassword)).res.status, 200)
    assert.equal((await post(app.base, "/api/members", { cookie: admin.cookie, body: { username: "bob" } })).status, 400) // 重名 ⇒ 400
    const list = await get(app.base, "/api/members", { cookie: admin.cookie })
    assert.deepEqual(list.json.members.map((m) => m.username), ["admin", "alice", "bob"])
    assert.deepEqual(list.json.members[1], { id: alice.id, name: "alice", username: "alice", role: "user", quotaTokens: null, usedTokens: 0, keys: [] })
  } finally {
    await app.close()
  }
})

test("吊销：admin 吊销 ⇒ 该 key 即失效 ∥ 清单更新 ∥ 幂等 ∥ 不存在/错属 ⇒ 404", async () => {
  const app = await startServer()
  try {
    const admin = await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const key = KEYS.issueKey(app.db, alice.id)
    const { cookie } = await login(app.base, "admin", "admin-password")
    assert.equal((await get(app.base, "/api/members", { cookie })).json.members[1].keys.length, 1) // 行内 key 清单（KD-SV-16）
    assert.equal((await post(app.base, `/api/members/${alice.id}/keys/${key.id}/revoke`, { cookie })).status, 200)
    assert.equal(KEYS.verifyKey(app.db, key.plain), null) // 下一请求即 401 之函数面（AC-5）
    assert.deepEqual((await get(app.base, "/api/members", { cookie })).json.members[1].keys, [])
    assert.equal((await post(app.base, `/api/members/${alice.id}/keys/${key.id}/revoke`, { cookie })).status, 200) // 二次幂等
    assert.equal((await post(app.base, `/api/members/${alice.id}/keys/999999/revoke`, { cookie })).status, 404)
    const adminKey = KEYS.issueKey(app.db, admin.id)
    assert.equal((await post(app.base, `/api/members/${alice.id}/keys/${adminKey.id}/revoke`, { cookie })).status, 404) // 错属 ⇒ 404
    assert.ok(KEYS.verifyKey(app.db, adminKey.plain)) // 未被误吊销
  } finally {
    await app.close()
  }
})

test("重置：临时密码一次性 ∥ 旧密失效 ∥ 该成员全部会话吊销", async () => {
  const app = await startServer()
  try {
    await makeMember(app.db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(app.db)
    const s1 = await login(app.base, "alice", PASSWORD)
    const s2 = await login(app.base, "alice", PASSWORD)
    const { cookie } = await login(app.base, "admin", "admin-password")
    const reset = await post(app.base, `/api/members/${alice.id}/password-reset`, { cookie })
    assert.equal(reset.status, 200)
    assert.ok(reset.json.tempPassword.length >= 8)
    assert.equal((await login(app.base, "alice", PASSWORD)).res.status, 401) // 旧密失效
    assert.equal((await login(app.base, "alice", reset.json.tempPassword)).res.status, 200) // 临时密码可登
    assert.equal((await get(app.base, "/api/me", { cookie: s1.cookie })).status, 401) // 会话全吊销
    assert.equal((await get(app.base, "/api/me", { cookie: s2.cookie })).status, 401)
    assert.equal((await post(app.base, "/api/members/999999/password-reset", { cookie })).status, 404)
  } finally {
    await app.close()
  }
})

test("CLI：member add→list→quota→passwd ∥ key issue→list→revoke（七命令实跑）", async () => {
  const dir = tmpDir("cli")
  try {
    const configFile = join(dir, "config.json")
    writeFileSync(configFile, JSON.stringify(baseConfig(), null, 2))
    const dbFile = join(dir, "gateway.db")
    const run = (args) => runCli(["--config", configFile, ...args])
    const add = await run(["member", "add", "alice"])
    assert.equal(add.code, 0, add.err)
    assert.match(add.out, /成员已建：id=1 name=alice username=alice role=user/)
    const initial = add.out.match(/初始密码（一次性——请立即转达本人）：(\S+)/)?.[1]
    assert.ok(initial && initial.length >= 8, "无 --password ⇒ 生成并打印一次")
    const issue = await run(["key", "issue", "alice"])
    assert.equal(issue.code, 0, issue.err)
    const plain = issue.out.split("\n").find((line) => line.startsWith("sk-tc-"))
    assert.match(plain, /^sk-tc-[A-Za-z0-9_-]{43}$/)
    const keyId = Number(issue.out.match(/id=(\d+)/)[1])
    const list = await run(["key", "list"])
    assert.equal(list.code, 0)
    assert.ok(list.out.includes(KEYS.keyHint(plain)), "列表只出提示形")
    assert.ok(!list.out.includes(plain), "列表不得含明文")
    assert.equal((await run(["member", "quota", "alice", "1000"])).code, 0)
    const memberList = await run(["member", "list"])
    assert.ok(memberList.out.split("\n").some((line) => line === "1\talice\talice\tuser\t1000\t0"), memberList.out)
    assert.equal((await run(["key", "revoke", String(keyId)])).code, 0)
    const afterRevoke = DB.openDatabase(dbFile)
    assert.equal(KEYS.verifyKey(afterRevoke, plain), null) // 吊销立即生效
    SESSION.createSession(afterRevoke, 1) // 会话夹具（member passwd = 重置语义）
    afterRevoke.close()
    const passwd = await run(["member", "passwd", "alice"])
    assert.equal(passwd.code, 0, passwd.err)
    const temp = passwd.out.match(/临时密码（一次性——请立即转达本人）：(\S+)/)?.[1]
    assert.ok(temp && temp.length >= 8)
    const db = DB.openDatabase(dbFile)
    try {
      const alice = MEMBERS.findMemberByName(db, "alice")
      assert.equal(await MEMBERS.verifyPassword(initial, alice.password_hash), false) // 旧密失效
      assert.equal(await MEMBERS.verifyPassword(temp, alice.password_hash), true)
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 0) // 全会话吊销
    } finally {
      db.close()
    }
    const short = await run(["member", "add", "bob", "--password", "short"])
    assert.equal(short.code, 1)
    assert.match(short.err, /密码少于 8 字符/)
    const missingValue = await run(["member", "add", "bob", "--password"]) // 选项缺值 ⇒ 报错（不静默降级）
    assert.equal(missingValue.code, 1)
    assert.match(missingValue.err, /参数缺值：--password/)
    const ghost = await run(["key", "issue", "nobody"])
    assert.equal(ghost.code, 1)
    assert.match(ghost.err, /成员不存在：nobody/)
    assert.equal((await run(["unknown-cmd"])).code, 1)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("入口：bootstrap 首启建 admin ∥ 二启跳过（口令不变）∥ 零 admin 未配置 ⇒ 告警", async () => {
  const dir = tmpDir("boot")
  try {
    const file = join(dir, "config.json")
    const bootstrap = { username: "admin", password: "admin-password" }
    const port1 = await freePort()
    writeFileSync(file, JSON.stringify(baseConfig({ port: port1, bootstrap }), null, 2))
    const first = spawnServer(file)
    try {
      assert.ok(await waitFor(() => first.out().includes('"event":"ready"')), first.out())
      assert.ok(first.out().includes("bootstrap_admin_created"))
      assert.equal((await post(`http://127.0.0.1:${port1}`, "/api/login", { body: { username: "admin", password: "admin-password" } })).status, 200) // 配置口令 = 初始密码
    } finally {
      first.child.kill()
      await first.exited
    }
    const port2 = await freePort()
    writeFileSync(file, JSON.stringify(baseConfig({ port: port2, bootstrap }), null, 2))
    const second = spawnServer(file)
    try {
      assert.ok(await waitFor(() => second.out().includes('"event":"ready"')), second.out())
      assert.ok(!second.out().includes("bootstrap_admin_created"), "二启不得重建")
      assert.equal((await post(`http://127.0.0.1:${port2}`, "/api/login", { body: { username: "admin", password: "admin-password" } })).status, 200) // 口令未改
    } finally {
      second.child.kill()
      await second.exited
    }
    const db = DB.openDatabase(join(dir, "gateway.db"))
    try {
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM members").get().n, 1) // 不重复建
    } finally {
      db.close()
    }
    const port3 = await freePort()
    const file2 = join(dir, "config2.json")
    writeFileSync(file2, JSON.stringify(baseConfig({ port: port3, db: "empty.db" }), null, 2))
    const third = spawnServer(file2)
    try {
      assert.ok(await waitFor(() => third.out().includes('"event":"ready"')), third.out())
      assert.match(third.out(), /bootstrap_warning.*no_admin_no_bootstrap/) // 启动告警（服务器照常起）
    } finally {
      third.child.kill()
      await third.exited
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
