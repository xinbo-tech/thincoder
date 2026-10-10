/**
 * 2026-10-10-team-login-client-access.test.mjs — thincoder-server 批内单测件（B1 批 · 服务端面；名随批档 ·
 * 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-team-login-client-access.test.mjs`
 *
 * 射程（判据源 = `docs/server/design/client/CLIENT.md` §4 ∥ §6 用例 N37 ∥ B27 ∥ E28 ∥ N39；
 * `docs/server/design/accounts/ACCOUNTS.md` §5 AC-31）：
 *   N37 login 成：200 携 token ∥ `api_keys` 新行（name = label ∥ key_hash = sha256(token)）∥ 审计
 *       `login_success` + `key_issue` 各一行（detail 携 `surface:"client"`）
 *   B27 边界：错密码 ∥ 不存在用户 ⇒ 401 同措辞；5 连败 ⇒ 429 + `Retry-After`；label 缺省 ⇒ 默认名 `key-N`；
 *       label 41 字符 ⇒ 400（库零变）；缺字段 ∥ 非 JSON 体 ⇒ 400
 *   N39 token 兼用：`GET /api/client/me` ∥ `GET /v1/models` 同 token 皆 200（与 /v1 同校验单源 `verifyKey`）
 *   20 上限豁免：20 把 active 时登录签发 ⇒ 200（`client/CLIENT.md` §1——KD-SV-61）
 *   E28 退出：logout ⇒ 吊销即判（me ∥ /v1/models 下一请求 401）；已吊销再 logout ⇒ 401（端侧清本地语义）
 *   审计面：四型 detail 携 `surface:"client"`；控制台面同型键缺席；十型零增
 *   零迁移：结构版本 v10 不动 ∥ `sessions` 表零涉（客户端 token 落 `api_keys`）
 *
 * 测试用内存库 + 进程内服务（0 端口）——不碰真库/生产数据。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const CLIENT_ROUTES = await load("thincoder-server/src/client/routes.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const AUDIT = await load("thincoder-server/src/accounts/audit.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const GUARD = await load("thincoder-server/src/accounts/login-guard.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))

const PASSWORD = "password-123"
const BATCH_FILE = "docs/batches/2026-10-10-team-login-client-access.test.mjs"
const LABEL = "CLI@台式机"

/** 进程内服务夹具（真 HTTP 面）：内存库 + client/gateway/accounts 三族注册行；逐实例登录守卫（限流确定性）。 */
async function startServer({ db }) {
  const guard = GUARD.createLoginGuard()
  const config = CONFIG.validateConfig({ host: "127.0.0.1" })
  const routes = SERVER.createRouteTable()
  CLIENT_ROUTES.registerClientRoutes(routes, { db, guard })
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db, guard })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) }),
  }
}

async function call(base, method, path, { body, token, contentType = "application/json" } = {}) {
  const headers = {}
  if (contentType !== null) headers["content-type"] = contentType
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON 体：以 status 判 */
  }
  return { status: res.status, json, text, headers: res.headers }
}
const post = (base, path, opts) => call(base, "POST", path, opts)
const get = (base, path, opts) => call(base, "GET", path, opts)
const login = (base, body) => post(base, "/api/client/login", { body })

async function makeMember(db, { username = "alice", role = "user" } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, name: username, role, password: PASSWORD })
  return member
}
const auditRows = (db) => db.prepare("SELECT type, detail FROM audit_events ORDER BY id").all().map((row) => ({ type: row.type, detail: JSON.parse(row.detail) }))
const latestKey = (db, memberId) => db.prepare("SELECT * FROM api_keys WHERE member_id = ? ORDER BY id DESC LIMIT 1").get(memberId)

// ── N37（login 成——200 ∥ api_keys 行 ∥ 审计两行）────────────────────────────

test("N37 登录成：200 携 token ∥ api_keys 新行（name = label ∥ key_hash = sha256）∥ 审计 login_success + key_issue", async () => {
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db)
  const server = await startServer({ db })
  try {
    const res = await login(server.base, { username: "alice", password: PASSWORD, label: LABEL })
    assert.equal(res.status, 200)
    assert.equal(res.json?.ok, true)
    assert.match(res.json.token, /^sk-tc-[A-Za-z0-9_-]{43}$/, "token 形 = sk-tc- + 43 字符 base64url")
    assert.deepEqual(res.json.member, { id: member.id, name: "alice", username: "alice", role: "user" })
    const row = latestKey(db, member.id)
    assert.equal(row.name, LABEL, "端标签落 name（trim ≤40——名称口径单源）")
    assert.equal(row.key_hash, KEYS.hashKey(res.json.token), "库存 sha256(明文)——库内无明文")
    assert.equal(row.status, "active")
    const success = auditRows(db).filter((r) => r.type === "login_success")
    const issued = auditRows(db).filter((r) => r.type === "key_issue")
    assert.equal(success.length, 1)
    assert.equal(issued.length, 1)
    assert.equal(success[0].detail.surface, "client")
    assert.equal(issued[0].detail.keyHint, `${res.json.token.slice(0, 12)}…${res.json.token.slice(-4)}`)
  } finally {
    await server.close()
    db.close()
  }
})

// ── B27（凭据错 ∥ 限流 ∥ label ∥ 体非法）────────────────────────────────────

test("B27 凭据错：错密码 ∥ 不存在用户 ⇒ 401 invalid_credentials（同措辞——防枚举）", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db)
  const server = await startServer({ db })
  try {
    const wrong = await login(server.base, { username: "alice", password: "wrong-password" })
    const nobody = await login(server.base, { username: "nobody", password: PASSWORD })
    assert.equal(wrong.status, 401)
    assert.equal(nobody.status, 401)
    assert.equal(wrong.json.error.code, "invalid_credentials")
    assert.equal(wrong.json.error.message, nobody.json.error.message, "两况同措辞逐字")
    const failures = auditRows(db).filter((r) => r.type === "login_failure")
    assert.equal(failures.length, 2)
    assert.ok(failures.every((r) => r.detail.surface === "client"), "失败路径 detail 携 surface")
  } finally {
    await server.close()
    db.close()
  }
})

test("B27 限流：5 连败 ⇒ 第 6 次（正确密码）⇒ 429 too_many_attempts + Retry-After（不跑散列）", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db)
  const server = await startServer({ db })
  try {
    for (let i = 0; i < GUARD.USERNAME_THRESHOLD; i++) {
      const res = await login(server.base, { username: "alice", password: "wrong-password" })
      assert.equal(res.status, 401, `第 ${i + 1} 次失败应 401`)
    }
    const locked = await login(server.base, { username: "alice", password: PASSWORD })
    assert.equal(locked.status, 429)
    assert.equal(locked.json.error.code, "too_many_attempts")
    assert.ok(Number(locked.headers.get("retry-after")) > 0, "Retry-After 头在场（剩余秒）")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM api_keys").get().n, 0, "锁定期零签发")
  } finally {
    await server.close()
    db.close()
  }
})

test("B27 label：缺省 ∥ 空 ⇒ 默认名 key-N（单调）∥ 41 字符 ⇒ 400（库零变）∥ 缺字段 ∥ 非 JSON 型 ⇒ 400", async () => {
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db)
  const server = await startServer({ db })
  try {
    const first = await login(server.base, { username: "alice", password: PASSWORD })
    assert.equal(first.status, 200)
    assert.equal(latestKey(db, member.id).name, "key-1", "label 缺省 ⇒ 默认名助手")
    const blank = await login(server.base, { username: "alice", password: PASSWORD, label: "   " })
    assert.equal(blank.status, 200)
    assert.equal(latestKey(db, member.id).name, "key-2", "trim 后空 ⇒ 默认名（单调不复用）")
    const before = KEYS.countActiveKeys(db, member.id)
    const tooLong = await login(server.base, { username: "alice", password: PASSWORD, label: "x".repeat(41) })
    assert.equal(tooLong.status, 400)
    assert.equal(tooLong.json.error.code, "invalid_request_error")
    assert.equal(KEYS.countActiveKeys(db, member.id), before, "label 非法 ⇒ 库零变")
    const missing = await post(server.base, "/api/client/login", { body: {} })
    assert.equal(missing.status, 400)
    assert.equal(missing.json.error.code, "invalid_request_error")
    const notJson = await post(server.base, "/api/client/login", { contentType: "text/plain", body: { username: "alice", password: PASSWORD } })
    assert.equal(notJson.status, 400, "写端点仅收 application/json（分派层统一）")
  } finally {
    await server.close()
    db.close()
  }
})

// ── N39（token 兼用——与 /v1 同校验单源）─────────────────────────────────────

test("N39 token 兼用：/api/client/me ∥ /v1/models 同 token 皆 200；无 token ⇒ 401 invalid_api_key", async () => {
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db)
  const server = await startServer({ db })
  try {
    const res = await login(server.base, { username: "alice", password: PASSWORD, label: LABEL })
    const token = res.json.token
    assert.ok(KEYS.verifyKey(db, token), "同校验单源 = verifyKey（账号 key 面）")
    const me = await get(server.base, "/api/client/me", { token })
    assert.equal(me.status, 200)
    assert.deepEqual(me.json.member, { id: member.id, name: "alice", username: "alice", role: "user" })
    assert.equal(me.json.token.label, LABEL)
    assert.ok(typeof me.json.token.createdAt === "string", "token.createdAt 在场（签发时间）")
    const models = await get(server.base, "/v1/models", { token })
    assert.equal(models.status, 200, "同一 token 过模型面（AC-31③ 模型可用判据面）")
    const anon = await get(server.base, "/api/client/me")
    assert.equal(anon.status, 401)
    assert.equal(anon.json.error.code, "invalid_api_key", "无 ∥ 无效 token 三态不区分（防信息泄露）")
  } finally {
    await server.close()
    db.close()
  }
})

// ── 20 上限豁免（KD-SV-61）──────────────────────────────────────────────────

test("20 上限豁免：20 把 active 时登录签发 ⇒ 200（active = 21——签发面不判上限）", async () => {
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db)
  for (let i = 0; i < KEYS.MAX_ACTIVE_KEYS; i++) KEYS.issueKey(db, member.id)
  assert.equal(KEYS.countActiveKeys(db, member.id), KEYS.MAX_ACTIVE_KEYS)
  const server = await startServer({ db })
  try {
    const res = await login(server.base, { username: "alice", password: PASSWORD, label: "B1@box" })
    assert.equal(res.status, 200, "客户端登录签发不受 20 上限（沿「轮转 ∥ CLI 不受限」先例）")
    assert.equal(KEYS.countActiveKeys(db, member.id), KEYS.MAX_ACTIVE_KEYS + 1)
  } finally {
    await server.close()
    db.close()
  }
})

// ── E28（退出——吊销即判）────────────────────────────────────────────────────

test("E28 退出：logout ⇒ 吊销即判（me ∥ /v1/models 下一请求 401）∥ 已吊销再 logout ⇒ 401", async () => {
  const db = DB.openDatabase(":memory:")
  const member = await makeMember(db)
  const server = await startServer({ db })
  try {
    const res = await login(server.base, { username: "alice", password: PASSWORD, label: LABEL })
    const token = res.json.token
    const out = await post(server.base, "/api/client/logout", { token })
    assert.equal(out.status, 200)
    assert.equal(out.json.ok, true)
    assert.equal((await get(server.base, "/api/client/me", { token })).status, 401, "吊销即扫——无缓存路径")
    assert.equal((await get(server.base, "/v1/models", { token })).status, 401)
    const again = await post(server.base, "/api/client/logout", { token })
    assert.equal(again.status, 401, "已吊销再 logout ⇒ 401（端侧视同「已失效」——照清本地）")
    assert.equal(again.json.error.code, "invalid_api_key")
    assert.equal(db.prepare("SELECT status FROM api_keys WHERE key_hash = ?").get(KEYS.hashKey(token)).status, "revoked", "吊销 = 软删（行保留）")
    assert.equal(KEYS.countActiveKeys(db, member.id), 0)
  } finally {
    await server.close()
    db.close()
  }
})

// ── 审计面（四型 surface ∥ 十型零增）─────────────────────────────────────────

test("审计面：四型 detail 携 surface:\"client\" ∥ 控制台面同型键缺席 ∥ 十型零增", async () => {
  const db = DB.openDatabase(":memory:")
  await makeMember(db)
  const server = await startServer({ db })
  try {
    await login(server.base, { username: "alice", password: "wrong-password" })       // 败
    const ok = await login(server.base, { username: "alice", password: PASSWORD, label: LABEL })
    await post(server.base, "/api/client/logout", { token: ok.json.token })           // 吊销
    const consoleLogin = await post(server.base, "/api/login", { body: { username: "alice", password: PASSWORD } })
    assert.equal(consoleLogin.status, 200, "控制台面同库并存（会话 cookie 面零涉）")
    const rows = auditRows(db)
    for (const type of ["login_success", "login_failure", "key_issue", "key_revoke"]) {
      assert.ok(rows.some((r) => r.type === type && r.detail.surface === "client"), `${type} 客户端行应携 surface:"client"`)
    }
    const consoleRow = rows.find((r) => r.type === "login_success" && !("surface" in r.detail))
    assert.ok(consoleRow, "控制台面 login_success 键缺席（surface 取值域 = 客户端面唯一）")
    assert.equal(AUDIT.AUDIT_TYPES.length, 10, "审计十型零增")
  } finally {
    await server.close()
    db.close()
  }
})

// ── 零迁移 ∥ sessions 零涉 ──────────────────────────────────────────────────

test("零迁移：结构版本 v10 不动 ∥ 全流程后 sessions 表零涉", async () => {
  assert.equal(DB.SCHEMA_VERSION, 10, "client 域零迁移（结构版本保持 v10）")
  const db = DB.openDatabase(":memory:")
  await makeMember(db)
  const server = await startServer({ db })
  try {
    const res = await login(server.base, { username: "alice", password: PASSWORD, label: LABEL })
    await post(server.base, "/api/client/logout", { token: res.json.token })
    assert.equal(DB.readVersion(db), 10)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 0, "客户端 token 落 api_keys——sessions 表零涉")
  } finally {
    await server.close()
    db.close()
  }
})

// ── 链自检（prepublishOnly 含本批件）────────────────────────────────────────

test("链自检：prepublishOnly 含本批件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.ok(batchFiles.includes(BATCH_FILE), `本批件应入列：${BATCH_FILE}（现 ${batchFiles.length} 件）`)
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
