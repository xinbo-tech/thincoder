/**
 * 2026-10-07-me-keys-redo.test.mjs — thincoder-server 批内单测件（me-keys 批 · A 轮（服务端面）；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存；B 轮（前端面）UI 腿 = `-me-keys-redo-ui.test.mjs`（同批两件——越 500 硬限前拆分）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-me-keys-redo.test.mjs`
 *
 * 射程（判据源 = `accounts/ACCOUNTS.md` §1.1/§3/§5 AC-25 ∥ `store/STORE.md` §2 v8 段/§3）：
 *   ① v8 迁移四判据（STORE §3）：空库直落 8 ∥ v7 库升后 8 ∥ 幂等重跑 ∥ 新列在场（常量默认 `''`）
 *      ∥ 回填抽查（`key-1..n` 按成员签发序——含吊销行 ∥ 空串零残留）
 *   ② 端点（ACCOUNTS §3 ∥ §5 AC-25——真 HTTP）：N31 多把并存（旧 key 照常可用 ∥ 行形 `name`/`createdAt`）
 *      ∥ N32 默认名（空体 `key-N`——含吊销行单调不复用）∥ N33 逐把吊销（即断 401 ∥ 行离列表 ∥ 幂等 200）
 *      ∥ N34 审计两型（`key_issue` ∥ `key_revoke`——主体 = 本人；九型零增）
 *   ③ 命名边界（B29）：41 字符 ⇒ 400（库零变）∥ 40 字符 ⇒ 200 ∥ 重名允许 ∥ 非字符串 ⇒ 400 ∥ trim 后落库
 *   ④ 上限（B28）：active = 20 时第 21 把 ⇒ 400（消息明示）∥ 轮转不受限 ∥ 吊销一把后再签 ⇒ 200
 *   ⑤ 所有权（E23）：他人 key ⇒ 404（不属本人与不存在不区分——A 的操作零变）∥ 无会话 ⇒ 401
 *
 * 测试用临时库/内存库——不碰真库/生产数据（含 v7 旧库夹具 = 临时目录内文件）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
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
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const AUDIT = await load("thincoder-server/src/accounts/audit.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")

const PASSWORD = "password-123"
const ISSUE_URL = "/api/me/keys/issue"
const revokeUrl = (keyId) => `/api/me/keys/${keyId}/revoke`
const FAKE_UPSTREAM = "http://127.0.0.1:9/v1" // 不需要真上游的用例——地址只过校验，永不请求

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tc-me-keys-${tag}-`))
}

async function startServer({ db, config }) {
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
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
/** mock 上游（非流式 chat——`/v1` 实请求用；计数可判「未转发」）。 */
async function startMockUpstream() {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      requests.push({ url: req.url, body: JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") })
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ id: "c1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "ok" } }], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } }))
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
  return CONFIG.validateConfig(makeConfig(baseURL))
}
const chat = (base, plain, model = "mock/mock-chat") => post(base, "/v1/chat/completions", { headers: { authorization: `Bearer ${plain}` }, body: { model, messages: [] } })

// ── ① v8 迁移四判据（STORE §2 v8 段 ∥ §3）──────────────────────────────────

test("① v8 迁移：空库直落 10 ∥ v7 库升 10（存量回填 key-N 按签发序）∥ 幂等 ∥ 新列在场 ∥ 空串零残留", () => {
  const fresh = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [14, 14], "空库直落 v14")
    const column = fresh.prepare("PRAGMA table_info(api_keys)").all().find((item) => item.name === "name")
    assert.ok(column, "api_keys.name 缺位")
    assert.deepEqual([column.type, column.notnull, column.dflt_value], ["TEXT", 1, "''"], "常量默认 = ''")
  } finally {
    fresh.close()
  }

  const dir = tmpDir("migrate")
  const file = join(dir, "gateway.db")
  try {
    const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 7) }) // v7 旧库
    assert.equal(DB.readVersion(legacy), 7)
    legacy.exec("INSERT INTO members (username, name, password_hash, created_at) VALUES ('alice', 'alice', 'h', 't'), ('bob', 'bob', 'h', 't')")
    legacy.exec(
      "INSERT INTO api_keys (member_id, key_hash, key_hint, status, created_at, revoked_at) VALUES" +
        " (1, 'ka1', 'sk-tc-a…a1', 'active', 't', NULL)," +
        " (1, 'ka2', 'sk-tc-a…a2', 'revoked', 't', 't')," +
        " (1, 'ka3', 'sk-tc-a…a3', 'active', 't', NULL)," +
        " (2, 'kb1', 'sk-tc-b…b1', 'active', 't', NULL)",
    )
    legacy.close()
    const db = DB.openDatabase(file) // 启动自动升
    try {
      assert.equal(DB.readVersion(db), 14, "v7 库升后读数 14")
      // 回填抽查：key-N 按成员签发序（id 升序；吊销行照回填——单调不复用）
      assert.deepEqual(
        db.prepare("SELECT id, member_id, name FROM api_keys ORDER BY id").all().map((row) => [row.id, row.member_id, row.name]),
        [
          [1, 1, "key-1"],
          [2, 1, "key-2"],
          [3, 1, "key-3"],
          [4, 2, "key-1"],
        ],
      )
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM api_keys WHERE name = ''").get().n, 0, "空串零残留")
      // 幂等：再跑迁移链 ⇒ 版本不变 ∥ 回填值不动
      assert.equal(DB.migrate(db), 14)
      assert.deepEqual(db.prepare("SELECT name FROM api_keys ORDER BY id").all().map((row) => row.name), ["key-1", "key-2", "key-3", "key-1"])
    } finally {
      db.close()
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ② N31 多把并存（issue 携名 ∥ 旧 key 照常可用 ∥ 行形）────────────────────

test("② N31 多把并存：issue 携名 200（明文一次性）∥ 旧 key 照常可用 ∥ 行形含 name/createdAt ∥ 审计 key_issue", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const alice = await makeMember(db)
    const old = KEYS.issueKey(db, alice.id) // 旧 key（直签——默认名 key-1）
    const session = await login(app.base, "alice", PASSWORD)
    // 无会话 ⇒ 401（判权先于一切——两端点同判）
    assert.deepEqual([(await post(app.base, ISSUE_URL, { body: { name: "x" } })).status, (await post(app.base, revokeUrl(1), {})).status], [401, 401])
    // 携名签发：200 `{id, name, hint, plain}`（明文一次性——同 §1 语义）
    const issued = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "笔记本" } })
    assert.deepEqual([issued.status, issued.json.name, Number.isInteger(issued.json.id)], [200, "笔记本", true])
    assert.ok(issued.json.plain.startsWith(KEYS.KEY_PREFIX), "明文形 = sk-tc- 前缀")
    assert.equal(issued.json.hint, KEYS.keyHint(issued.json.plain), "提示形 = 明文派生")
    // 旧 key 照常可用（多把并存——verifyKey 命中 + 实请求 200；新 key 同通）
    assert.ok(KEYS.verifyKey(db, old.plain))
    assert.deepEqual([(await chat(app.base, old.plain)).status, (await chat(app.base, issued.json.plain)).status], [200, 200])
    // 行形（§3）：`{ id, name, hint, createdAt, lastUsedAt, windowTokens }`——两把并存同列
    const me = (await get(app.base, "/api/me", { cookie: session.cookie })).json
    assert.deepEqual(me.keys.map((key) => [key.id, key.name, key.hint]), [
      [old.id, "key-1", old.hint],
      [issued.json.id, "笔记本", issued.json.hint],
    ])
    for (const row of me.keys) {
      assert.deepEqual(Object.keys(row).sort(), ["createdAt", "hint", "id", "lastUsedAt", "name", "windowTokens"])
      assert.equal(typeof row.createdAt, "string")
      assert.ok(row.createdAt.length > 0, "createdAt 随行下发")
    }
    // 审计：`key_issue`（actor = 本人 ∥ detail.keyHint = 提示形）
    const event = db.prepare("SELECT type, actor_id, actor_name, detail FROM audit_events WHERE type = 'key_issue'").get()
    assert.deepEqual([event.actor_name, event.actor_id, JSON.parse(event.detail).keyHint], ["alice", alice.id, issued.json.hint])
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ③ N32 默认名（空体 ∥ {} ∥ 全空白——含吊销行单调不复用）──────────────────

test("③ N32 默认名：空体 ∥ {} ∥ 全空白 ⇒ key-N（含吊销行单调——落库 ∥ 空串零残留）", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(FAKE_UPSTREAM) })
  try {
    const bob = await makeMember(db, { username: "bob" })
    const session = await login(app.base, "bob", PASSWORD)
    const first = await post(app.base, ISSUE_URL, { cookie: session.cookie }) // 空体（零字节——N32）
    assert.deepEqual([first.status, first.json.name], [200, "key-1"])
    assert.equal((await post(app.base, revokeUrl(first.json.id), { cookie: session.cookie })).status, 200)
    const second = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: {} })
    assert.deepEqual([second.status, second.json.name], [200, "key-2"], "吊销行计入序号——key-1 不复用")
    const third = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "   " } })
    assert.deepEqual([third.status, third.json.name], [200, "key-3"], "全空白 ⇒ 默认名")
    // 落库（显示稳定——读面直读库值 ∥ 空串零残留）
    assert.deepEqual(db.prepare("SELECT name FROM api_keys WHERE member_id = ? ORDER BY id").all(bob.id).map((row) => row.name), ["key-1", "key-2", "key-3"])
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM api_keys WHERE name = ''").get().n, 0)
  } finally {
    await app.close()
    db.close()
  }
})

// ── ④ N33/N34 逐把吊销（即断 ∥ 行离列表 ∥ 幂等 ∥ 审计）──────────────────────

test("④ N33/N34 吊销：即断（下一 /v1 401）∥ 行离列表（软删保留）∥ 幂等 200 ∥ 审计两型", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(mock.base) })
  try {
    const alice = await makeMember(db)
    await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const adminSession = await login(app.base, "admin", "admin-password")
    const session = await login(app.base, "alice", PASSWORD)
    const first = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "笔记本" } })
    const second = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "台式机" } })
    assert.equal((await chat(app.base, first.json.plain)).status, 200, "吊销前可用")
    // 吊销：200 `{ok, id, status:"revoked"}`（本人 key）
    const revoked = await post(app.base, revokeUrl(first.json.id), { cookie: session.cookie })
    assert.deepEqual([revoked.status, revoked.json], [200, { ok: true, id: first.json.id, status: "revoked" }])
    // 即断：下一 /v1 请求 ⇒ 401（逐请求查库——KD-SV-11）；兄弟 key 不受累
    const dead = await chat(app.base, first.json.plain)
    assert.deepEqual([dead.status, dead.json.error.code], [401, "invalid_api_key"])
    assert.equal((await chat(app.base, second.json.plain)).status, 200)
    // 行离列表（仅未吊销）；库内行保留（软删纪律）
    assert.deepEqual((await get(app.base, "/api/me", { cookie: session.cookie })).json.keys.map((key) => key.name), ["台式机"])
    assert.equal(db.prepare("SELECT status FROM api_keys WHERE id = ?").get(first.json.id).status, "revoked")
    // 幂等：重复调用 ⇒ 200 同体
    assert.deepEqual((await post(app.base, revokeUrl(first.json.id), { cookie: session.cookie })).json, { ok: true, id: first.json.id, status: "revoked" })
    // N34：审计两型在场（actor = 本人 ∥ detail.keyHint）——九型零增
    const events = (await get(app.base, "/api/audit", { cookie: adminSession.cookie })).json.events
    assert.ok(events.every((event) => AUDIT.AUDIT_TYPES.includes(event.type)), "事件型 ⊆ 九型（零增）")
    const issues = events.filter((event) => event.type === "key_issue")
    assert.deepEqual(issues.map((event) => [event.actor, event.actorId, event.detail.keyHint]), [
      ["alice", alice.id, second.json.hint],
      ["alice", alice.id, first.json.hint],
    ])
    const revokes = events.filter((event) => event.type === "key_revoke")
    assert.ok(revokes.length >= 1)
    for (const event of revokes) {
      assert.deepEqual([event.actor, event.actorId, event.target, event.targetId, event.detail.keyHint], ["alice", alice.id, "alice", alice.id, first.json.hint])
    }
  } finally {
    await app.close()
    mock.close()
    db.close()
  }
})

// ── ⑤ B28 上限（第 21 把 400 ∥ 轮转不受限 ∥ 吊销一把后再签 200）──────────────

test("⑤ B28 上限：active = 20 时第 21 把 ⇒ 400（消息明示）∥ 轮转不受限 ∥ 吊销一把后再签 ⇒ 200", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(FAKE_UPSTREAM) })
  try {
    const carol = await makeMember(db, { username: "carol" })
    const session = await login(app.base, "carol", PASSWORD)
    assert.equal(KEYS.MAX_ACTIVE_KEYS, 20)
    const fill = (n) => {
      for (let i = 0; i < n; i++) KEYS.issueKey(db, carol.id)
    }
    fill(20)
    assert.equal(KEYS.countActiveKeys(db, carol.id), 20)
    const over = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: {} })
    assert.deepEqual([over.status, over.json.error.code, over.json.error.type], [400, "invalid_request_error", "invalid_request_error"])
    assert.match(over.json.error.message, /20/, "消息明示上限")
    assert.equal(KEYS.countActiveKeys(db, carol.id), 20, "400 ⇒ 库零变")
    // 轮转不受限（先吊销后签发 ⇒ 计数归 1——§1.1）
    const rotated = await post(app.base, "/api/me/keys/rotate", { cookie: session.cookie })
    assert.deepEqual([rotated.status, KEYS.countActiveKeys(db, carol.id)], [200, 1])
    // 再填到 20 ⇒ 吊销一把 ⇒ 签发 200（拦截判据 = 已达 20）
    fill(19)
    assert.equal(KEYS.countActiveKeys(db, carol.id), 20)
    const victim = db.prepare("SELECT id FROM api_keys WHERE member_id = ? AND status = 'active' ORDER BY id LIMIT 1").get(carol.id)
    assert.equal((await post(app.base, revokeUrl(victim.id), { cookie: session.cookie })).status, 200)
    const again = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "第 20 把" } })
    assert.deepEqual([again.status, again.json.name, KEYS.countActiveKeys(db, carol.id)], [200, "第 20 把", 20])
    assert.equal((await post(app.base, ISSUE_URL, { cookie: session.cookie, body: {} })).status, 400, "回到 20 ⇒ 再签即拦")
  } finally {
    await app.close()
    db.close()
  }
})

// ── ⑥ B29 命名边界（41 字符 400 ∥ 40 字符 200 ∥ 重名允许 ∥ 非字符串 400 ∥ trim）──

test("⑥ B29 命名边界：41 字符 ⇒ 400（库零变）∥ 40 字符 ⇒ 200 ∥ 重名允许 ∥ 非字符串 ⇒ 400 ∥ trim 后落库", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(FAKE_UPSTREAM) })
  try {
    const dave = await makeMember(db, { username: "dave" })
    const session = await login(app.base, "dave", PASSWORD)
    const rows = () => db.prepare("SELECT COUNT(*) AS n FROM api_keys WHERE member_id = ?").get(dave.id).n
    const tooLong = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "长".repeat(41) } })
    assert.deepEqual([tooLong.status, tooLong.json.error.code], [400, "invalid_request_error"])
    assert.equal(rows(), 0, "400 ⇒ 库零变")
    const at40 = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "名".repeat(40) } })
    assert.deepEqual([at40.status, at40.json.name], [200, "名".repeat(40)], "40 字符 = 界内")
    const dup1 = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "重名" } })
    const dup2 = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "重名" } })
    assert.deepEqual([dup1.status, dup2.status, dup2.json.name], [200, 200, "重名"], "重名允许（标签非标识）")
    const nonString = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: 123 } })
    assert.deepEqual([nonString.status, nonString.json.error.code], [400, "invalid_request_error"])
    assert.equal(rows(), 3, "两 400 ⇒ 各库零变")
    const padded = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: "  笔记本  " } })
    assert.deepEqual([padded.status, padded.json.name], [200, "笔记本"], "trim 后落库")
    const nullName = await post(app.base, ISSUE_URL, { cookie: session.cookie, body: { name: null } })
    assert.deepEqual([nullName.status, nullName.json.name], [200, `key-${rows()}`], "null = 缺省 ⇒ 默认名续编")
  } finally {
    await app.close()
    db.close()
  }
})

// ── ⑦ E23 所有权（他人 key 404 ∥ 不存在 404 ∥ 无会话 401）────────────────────

test("⑦ E23 所有权：A 吊销 B 的 key ⇒ 404（B key 零变——仍 active）∥ 不存在 ⇒ 404（不区分）∥ 无会话 ⇒ 401", async () => {
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: await validatedConfig(FAKE_UPSTREAM) })
  try {
    const alice = await makeMember(db)
    await makeMember(db, { username: "bob" })
    const aliceSession = await login(app.base, "alice", PASSWORD)
    const bobSession = await login(app.base, "bob", PASSWORD)
    const bobKey = await post(app.base, ISSUE_URL, { cookie: bobSession.cookie, body: { name: "bob 的" } })
    // A 吊销 B：404 `not_found`（他人与不存在不区分——防枚举）；B 的 key 零变
    const attack = await post(app.base, revokeUrl(bobKey.json.id), { cookie: aliceSession.cookie })
    assert.deepEqual([attack.status, attack.json.error.code], [404, "not_found"])
    assert.deepEqual(
      [db.prepare("SELECT status FROM api_keys WHERE id = ?").get(bobKey.json.id).status, Boolean(KEYS.verifyKey(db, bobKey.json.plain))],
      ["active", true],
      "A 的操作零变——B key 仍 active",
    )
    // keyId 不存在 ∥ 非数字 ⇒ 404（同码——不区分）
    assert.deepEqual([(await post(app.base, revokeUrl(9999), { cookie: aliceSession.cookie })).status, (await post(app.base, "/api/me/keys/abc/revoke", { cookie: aliceSession.cookie })).status], [404, 404])
    // 无会话 ⇒ 401（两端点）
    assert.deepEqual([(await post(app.base, revokeUrl(bobKey.json.id), {})).status, (await post(app.base, ISSUE_URL, { body: {} })).status], [401, 401])
  } finally {
    await app.close()
    db.close()
  }
})
