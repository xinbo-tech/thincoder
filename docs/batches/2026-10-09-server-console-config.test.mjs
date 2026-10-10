/**
 * 2026-10-09-server-console-config.test.mjs — thincoder-server 批内单测件（配置控制台批 · 台账 #1139 ·
 * KD-SV-56；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-server-console-config.test.mjs`
 *
 * 射程（**服务面块**——判据源 = 本批档 §2 ∥ gateway/API.md §2.4/§5 AC-28 ∥ ops/OPS.md §1/§7 AC-28 ∥ store/STORE.md §2 v10）：
 *   A 写面 helper 直测：白名单/空提交/未知子键 ⇒ 抛 ∥ 合并保未知键 ∥ `proxyUri: ""` 删段 ∥ 子键级合并 ∥
 *     掩码回显不携 ∥ 原子写落盘形（2 空格缩进 + 末尾换行 ∥ tmp 零残留）∥ 写失败 ⇒ 文件零变
 *   B 端点机检：GET 有效值/掩码/口令零列 ∥ PATCH 往返（写后 GET 逐值）∥ 400 族（文件字节零变）∥ 子键三态 ∥
 *     判权三态 ∥ 审计一条（仅键名）∥ 审计失败 warn 不反噬 ∥ 读档/写盘失败 ⇒ 500 ∥ 并发同步段（无交错丢写）
 *   C v10 迁移：空库直落 10 ∥ v9 库自动升 10（存量行逐值保形 ∥ 两索引 ∥ `config_update` 可写 ∥ 序号连续）∥ 幂等
 *   D 探活草稿口径（embedding-admin）：三项明传优先 ∥ 缺省回落 ∥ 掩码 ⇒ 回落 ∥ 清除勾 = 显式空
 *   E import 扫描：零第三方（`node:` 前缀 ∥ 相对路径——红线）
 *   （界面面断言块 = 同件续写——见文末 F 块。）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { extname, join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const CONFIG_ADMIN = await load("thincoder-server/src/gateway/config-admin.mjs")
const EMBEDDING_ADMIN = await load("thincoder-server/src/gateway/embedding-admin.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const AUDIT = await load("thincoder-server/src/accounts/audit.mjs")

const REAL_FS = { readFileSync, writeFileSync, renameSync, unlinkSync }
const PASSWORD = "password-123"
const cleanups = []
const tmpBox = (tag) => { const dir = mkdtempSync(join(tmpdir(), `tc-cfg-${tag}-`)); cleanups.push(() => rmSync(dir, { recursive: true, force: true })); return dir }
const writeConfig = (file, obj) => writeFileSync(file, JSON.stringify(obj), "utf8")

test.after(() => { for (const fn of cleanups) fn() })

/** 档面基线（每用例各自展开——`env:` 种子引用保形面在册）。 */
const baseConfig = (over = {}) => ({
  host: "127.0.0.1",
  port: 8787,
  db: "data/gateway.db",
  autoUpdate: "notify",
  trustProxy: false,
  usageRetentionDays: 90,
  bootstrap: { username: "admin", password: PASSWORD },
  custom: { keep: true },
  providers: [{ name: "px", baseURL: "http://127.0.0.1:1/v1", apiKey: "env:SEED_KEY", models: [] }],
  embedding: { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3", apiKey: "sk-embed-secret" },
  ...over,
})

/** 进程内网关（配置面 + 账号面；`config` 在场 ⇒ 向量面同挂——探活腿用）。 */
async function startApp({ db, configPath, config = null, env = {}, fs = undefined, recordAuditFn = undefined, log = null }) {
  const routes = SERVER.createRouteTable()
  CONFIG_ADMIN.registerConfigAdminRoutes(routes, { db, configPath, log, env, fs, recordAuditFn })
  if (config) EMBEDDING_ADMIN.registerEmbeddingAdminRoutes(routes, { db, config, log })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config: config ?? {}, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

async function call(base, method, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

const login = async (base, username) => {
  const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}

/** 建管理员并起应用（返回 `{ db, app, admin, file }`——各用例收尾自管）。 */
async function startAdminApp(tag, { role = "admin", configPath = undefined, env = {}, fs = undefined, recordAuditFn = undefined, log = null, config = null } = {}) {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: role === "admin" ? "admin" : "plain", role, password: PASSWORD })
  const file = configPath ?? join(tmpBox(tag), "config.json")
  const app = await startApp({ db, configPath: file, config, env, fs, recordAuditFn, log })
  const admin = await login(app.base, role === "admin" ? "admin" : "plain")
  return { db, app, admin, file }
}

// ── A 写面 helper 直测（合并 ∥ 原子写——OPS §7 AC-28）────────────────────────────

test("A1 合并白名单：未知键 ∥ 空提交 ∥ 非对象体 ∥ embedding 空对象/未知子键 ⇒ 抛（文件零变）", () => {
  for (const bad of [null, [], "x", 42]) {
    assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), bad), /须为 JSON 对象/, `体 = ${JSON.stringify(bad)}`)
  }
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), {}), /空提交/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { host: "10.0.0.1" }), /未知键：host/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { providers: [] }), /未知键：providers/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: [] }), /embedding 须为对象/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: {} }), /空提交/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: { foo: 1 } }), /未知键：embedding\.foo/)
  assert.throws(() => CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: { apiKey: "…1234" } }), /空提交（未携任何可生效的键/)
})

test("A2 合并语义：保未知键 ∥ proxyUri 建段/删段 ∥ embedding 子键级 ∥ 掩码不携 ∥ keys 清单 ∥ 入档零触", () => {
  const raw = baseConfig()
  const { config, keys } = CONFIG_ADMIN.mergeConfigPatch(raw, { autoUpdate: "auto", proxyUri: "http://127.0.0.1:3128" })
  assert.deepEqual(keys, ["autoUpdate", "proxyUri"], "keys = 提交序（审计 detail）")
  assert.deepEqual(config.proxy, { uri: "http://127.0.0.1:3128" }, "proxyUri ⇒ 建段")
  assert.deepEqual(config.custom, { keep: true }, "未知键保形")
  assert.deepEqual(config.providers, raw.providers, "未托管段保形")
  assert.equal(raw.proxy, undefined, "入档不被改动（proxy）")
  assert.equal(raw.autoUpdate, "notify", "入档不被改动（顶层）")
  const kept = CONFIG_ADMIN.mergeConfigPatch(baseConfig({ proxy: { uri: "http://a:1", extra: 1 } }), { proxyUri: "http://b:2" })
  assert.deepEqual(kept.config.proxy, { uri: "http://b:2", extra: 1 }, "段内未知子键保形（uri 替换）")
  const gone = CONFIG_ADMIN.mergeConfigPatch(baseConfig({ proxy: { uri: "http://a:1" } }), { proxyUri: "" })
  assert.equal("proxy" in gone.config, false, "`\"\"` ⇒ 删 `proxy` 段")
  assert.deepEqual(gone.keys, ["proxyUri"])
  const emb = CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: { model: "m2", apiKey: "…1234" } })
  assert.deepEqual(emb.config.embedding, { baseURL: "http://127.0.0.1:11434/v1", model: "m2", apiKey: "sk-embed-secret" }, "携子键 = 替换；未携 = 不动")
  assert.deepEqual(emb.keys, ["embedding.model"], "掩码回显形不作明传值（不携 ⇒ 不入 keys）")
  const cleared = CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { embedding: { apiKey: "" } })
  assert.deepEqual(cleared.config.embedding, { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3", apiKey: "" }, "`apiKey: \"\"` = 显式空")
  const legacy = CONFIG_ADMIN.mergeConfigPatch(baseConfig({ embedding: { baseURL: "http://x/v1", model: "m", apiKey: "", legacyFlag: true } }), { embedding: { model: "m3" } })
  assert.deepEqual(legacy.config.embedding, { baseURL: "http://x/v1", model: "m3", apiKey: "", legacyFlag: true }, "子键级合并（原档未知子键保形）")
  const all = CONFIG_ADMIN.mergeConfigPatch(baseConfig(), { usageRetentionDays: null, trustProxy: true, autoUpdate: false, embedding: { baseURL: "http://y/v1" } })
  assert.deepEqual(all.keys, ["usageRetentionDays", "trustProxy", "autoUpdate", "embedding.baseURL"])
  assert.deepEqual([all.config.usageRetentionDays, all.config.trustProxy, all.config.autoUpdate], [null, true, false], "null/false 照写（不被缺省吞）")
})

test("A3 原子写：落盘形 = 2 空格缩进 + 末尾换行 ∥ tmp 零残留 ∥ 覆盖既有档", () => {
  const file = join(tmpBox("write"), "config.json")
  writeFileSync(file, '{"old":true}', "utf8")
  CONFIG_ADMIN.writeConfigAtomic(file, { a: 1, b: { c: [1, 2] } })
  const text = readFileSync(file, "utf8")
  assert.equal(text, '{\n  "a": 1,\n  "b": {\n    "c": [\n      1,\n      2\n    ]\n  }\n}\n', "2 空格缩进 + 末尾换行")
  assert.deepEqual(JSON.parse(text), { a: 1, b: { c: [1, 2] } })
  assert.equal(existsSync(`${file}.tmp`), false, "tmp 零残留")
})

test("A4 写失败（fs 注入口径）：抛 ⇒ 文件字节零变 ∥ tmp 零残留", () => {
  const file = join(tmpBox("writefail"), "config.json")
  const before = '{"keep":true}'
  writeFileSync(file, before, "utf8")
  const renameBoom = { ...REAL_FS, renameSync: () => { throw new Error("EACCES: 注入") } }
  assert.throws(() => CONFIG_ADMIN.writeConfigAtomic(file, { a: 1 }, { fs: renameBoom }), /配置写盘失败/)
  assert.equal(readFileSync(file, "utf8"), before, "rename 失败 ⇒ 文件零变")
  assert.equal(existsSync(`${file}.tmp`), false, "tmp 零残留")
  const writeBoom = { ...REAL_FS, writeFileSync: () => { throw new Error("ENOSPC: 注入") } }
  assert.throws(() => CONFIG_ADMIN.writeConfigAtomic(file, { a: 1 }, { fs: writeBoom }), /ENOSPC: 注入/)
  assert.equal(readFileSync(file, "utf8"), before, "write 失败 ⇒ 文件零变")
})

// ── B 端点机检（GET ∥ PATCH ∥ 400 族 ∥ 审计）──────────────────────────────────

test("B1 GET 文件面读：在场值透传 ∥ 缺省回填 ∥ 掩码三态 ∥ bootstrap.username 列 ∥ 口令/明文密钥零列", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("get", { env: { EMBED_KEY: "resolved-secret" } })
  try {
    // 在场值腿（非缺省值——与缺省回填腿可区分）
    writeConfig(file, baseConfig({ port: 9001, db: "custom/db.sqlite", autoUpdate: "auto", trustProxy: true, usageRetentionDays: 30, proxy: { uri: "http://127.0.0.1:3128" } }))
    const res = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(res.status, 200, res.text)
    const view = res.json.config
    assert.deepEqual(
      [view.host, view.port, view.db, view.autoUpdate, view.trustProxy, view.usageRetentionDays, view.proxyUri],
      ["127.0.0.1", 9001, "custom/db.sqlite", "auto", true, 30, "http://127.0.0.1:3128"],
      "文件在场值透传（非缺省值）",
    )
    assert.deepEqual(view.embedding, { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3", apiKey: "…cret" }, "明文 ⇒ `…`+末 4")
    assert.deepEqual(view.bootstrap, { username: "admin" }, "bootstrap = username 一行")
    assert.ok(!res.text.includes(PASSWORD), "bootstrap.password 面零列")
    assert.ok(!res.text.includes("sk-embed-secret"), "明文密钥零列")
    // 缺省回填腿（B23：档缺 port/db/autoUpdate/trustProxy/usageRetentionDays/proxy/bootstrap ⇒ 有效值）
    writeConfig(file, { host: "10.0.0.9", embedding: { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" } })
    const minimal = (await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })).json.config
    assert.deepEqual(
      [minimal.port, minimal.db, minimal.autoUpdate, minimal.trustProxy, minimal.usageRetentionDays, minimal.proxyUri, minimal.bootstrap],
      [8787, "data/gateway.db", "notify", false, 90, null, null],
      "缺键 ⇒ 缺省回填（缺省值 = config.mjs 常量）",
    )
    // `embedding` 缺位 ⇒ null 支（§2.4 GET 行 `∥ null`）
    writeConfig(file, { host: "10.0.0.9" })
    const noEmbedding = (await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })).json.config
    assert.equal(noEmbedding.embedding, null, "embedding 段缺位 ⇒ null")
    // 掩码三态（其二其三——明文腿已在上）
    writeConfig(file, baseConfig({ embedding: { baseURL: "http://x/v1", model: "m", apiKey: "env:EMBED_KEY" } }))
    const envView = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(envView.json.config.embedding.apiKey, "env:EMBED_KEY", "`env:` 引用保形")
    writeConfig(file, baseConfig({ embedding: { baseURL: "http://x/v1", model: "m", apiKey: "" } }))
    const emptyView = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(emptyView.json.config.embedding.apiKey, "", "空 ⇒ `\"\"`")
    // `null` = 不限（原样——不被缺省吞）
    writeConfig(file, baseConfig({ usageRetentionDays: null }))
    const nullView = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(nullView.json.config.usageRetentionDays, null, "null 原样")
  } finally { await app.close(); db.close() }
})

test("B2 PATCH 往返：`{ok:true}` ⇒ 写后 GET 逐值 ∥ 未托管键保形 ∥ 落盘形 ∥ 审计一条（仅键名）", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("patch", { env: {} })
  try {
    writeConfig(file, baseConfig())
    const patched = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { autoUpdate: "auto", proxyUri: "http://127.0.0.1:3128", embedding: { model: "bge-large" } } })
    assert.equal(patched.status, 200, patched.text)
    assert.deepEqual(patched.json, { ok: true })
    const text = readFileSync(file, "utf8")
    const after = JSON.parse(text)
    assert.deepEqual([after.autoUpdate, after.proxy, after.embedding.model], ["auto", { uri: "http://127.0.0.1:3128" }, "bge-large"])
    assert.deepEqual(after.custom, { keep: true }, "未托管键原样保形")
    assert.deepEqual(after.providers, baseConfig().providers, "种子段保形（`env:` 引用未物化）")
    assert.equal(after.embedding.baseURL, baseConfig().embedding.baseURL, "未携子键不动")
    assert.equal(after.bootstrap.password, PASSWORD, "替档其余字段零触")
    assert.ok(text.endsWith("}\n") && text.includes('\n  "autoUpdate"'), "落盘形 = 2 空格缩进 + 末尾换行")
    const back = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.deepEqual(
      [back.json.config.autoUpdate, back.json.config.proxyUri, back.json.config.embedding.model, back.json.config.embedding.apiKey],
      ["auto", "http://127.0.0.1:3128", "bge-large", "…cret"],
      "写后 GET 回读逐值（round-trip——密钥面掩码回显）",
    )
    const reloaded = CONFIG.loadConfig(file, { env: {} }) // B32 语义机检：落盘档可载入且按新值（重启路 = 载入面等价两跳）
    assert.deepEqual(
      [reloaded.config.autoUpdate, reloaded.config.proxy.uri, reloaded.config.embedding.model],
      ["auto", "http://127.0.0.1:3128", "bge-large"],
      "写后重启 ⇒ 启动按新值（ops/OPS.md §9 B32）",
    )
    const events = db.prepare("SELECT * FROM audit_events WHERE type = 'config_update' ORDER BY id").all()
    assert.equal(events.length, 1, "恰一条审计")
    const adminId = db.prepare("SELECT id FROM members WHERE username = 'admin'").get().id
    assert.deepEqual([events[0].type, events[0].actor_name, events[0].actor_id, events[0].target_name, events[0].target_id], ["config_update", "admin", adminId, "", null])
    assert.deepEqual(JSON.parse(events[0].detail), { keys: ["autoUpdate", "proxyUri", "embedding.model"] }, "detail = 键名清单")
    assert.ok(!events[0].detail.includes("3128") && !events[0].detail.includes("bge-large"), "值永不入")
  } finally { await app.close(); db.close() }
})

test("B3 400 族：未知键 ∥ 空提交 ∥ 非法值 ∥ embedding 子键 ∥ env 缺位 ⇒ 400 且文件字节零变", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("bad", { env: {} })
  try {
    writeConfig(file, baseConfig())
    const before = readFileSync(file, "utf8")
    const cases = [
      [{ nope: 1 }, /未知键：nope/],
      [{ host: "10.0.0.1" }, /未知键：host/],
      [{ providers: [] }, /未知键：providers/],
      [{}, /空提交/],
      [[], /须为 JSON 对象/],
      [{ autoUpdate: "yes" }, /autoUpdate 非法/],
      [{ trustProxy: "yes" }, /trustProxy 非法/],
      [{ usageRetentionDays: 0 }, /usageRetentionDays 非法/],
      [{ usageRetentionDays: "90" }, /usageRetentionDays 非法/],
      [{ proxyUri: "https://127.0.0.1:3128" }, /http:/],
      [{ proxyUri: {} }, /非空字符串/],
      [{ embedding: { baseURL: "not-a-url" } }, /embedding\.baseURL 非法 URL/],
      [{ embedding: { nope: 1 } }, /未知键：embedding\.nope/],
      [{ embedding: {} }, /空提交/],
      [{ embedding: { apiKey: "env:NO_SUCH_VAR" } }, /环境变量缺位/],
    ]
    for (const [body, pattern] of cases) {
      const res = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body })
      assert.equal(res.status, 400, `${JSON.stringify(body)} ⇒ ${res.status}：${res.text}`)
      assert.equal(res.json.error.code, "invalid_request_error")
      assert.match(res.json.error.message, pattern, `消息 = 单源原报文：${res.json.error.message}`)
      assert.equal(readFileSync(file, "utf8"), before, `400 后文件字节零变：${JSON.stringify(body)}`)
    }
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'config_update'").get().n, 0, "400 ⇒ 零审计（写盘未发生）")
  } finally { await app.close(); db.close() }
})

test("B4 边界（B23）：`proxyUri:\"\"` 删段 ∥ `usageRetentionDays:null` 原样 ∥ `apiKey:\"\"` 显式空 ∥ 掩码回显 ⇒ 不变", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("edge", { env: {} })
  try {
    writeConfig(file, baseConfig({ proxy: { uri: "http://127.0.0.1:3128" } }))
    assert.equal((await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { proxyUri: "" } })).status, 200)
    assert.equal("proxy" in JSON.parse(readFileSync(file, "utf8")), false, "`\"\"` ⇒ 段删净")
    const afterDelete = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(afterDelete.json.config.proxyUri, null, "再 GET ⇒ proxyUri: null")
    assert.equal((await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { usageRetentionDays: null } })).status, 200)
    const nullView = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.equal(nullView.json.config.usageRetentionDays, null, "null ⇒ 不限（原样——不被缺省吞）")
    assert.equal((await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { embedding: { apiKey: "" } } })).status, 200)
    assert.equal(JSON.parse(readFileSync(file, "utf8")).embedding.apiKey, "", "`\"\"` = 显式空写盘")
    const echoed = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { autoUpdate: "auto", embedding: { apiKey: "…1234" } } })
    assert.equal(echoed.status, 200, echoed.text)
    assert.equal(JSON.parse(readFileSync(file, "utf8")).embedding.apiKey, "", "掩码回显形不作明传值（密钥零触）")
    const rows = db.prepare("SELECT detail FROM audit_events ORDER BY id").all().map((row) => JSON.parse(row.detail).keys)
    assert.deepEqual(rows.at(-1), ["autoUpdate"], "缺席键与掩码子键皆不入 keys")
  } finally { await app.close(); db.close() }
})

test("B5 判权三态：无会话 401 ∥ user 403 ∥ admin 200（GET ∥ PATCH——两法同判）", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("auth", { env: {} })
  try {
    writeConfig(file, baseConfig())
    await MEMBERS.createMember(db, { username: "plain", role: "user", password: PASSWORD })
    const user = await login(app.base, "plain")
    for (const [method, cookie, expected] of [["GET", null, 401], ["GET", user.cookie, 403], ["GET", admin.cookie, 200]]) {
      const res = await call(app.base, method, "/api/admin/config", { cookie })
      assert.equal(res.status, expected, `${method}（cookie=${cookie ? "在场" : "无"}）`)
      if (expected !== 200) assert.equal(res.json.error.code, expected === 401 ? "unauthorized" : "forbidden")
    }
    for (const [cookie, expected] of [[null, 401], [user.cookie, 403], [admin.cookie, 200]]) {
      const res = await call(app.base, "PATCH", "/api/admin/config", { cookie, body: { autoUpdate: "auto" } })
      assert.equal(res.status, expected, `PATCH（cookie=${cookie ? "在场" : "无"}）`)
    }
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'config_update'").get().n, 1, "仅 admin 那一次落审计")
  } finally { await app.close(); db.close() }
})

test("B6 审计失败 ⇒ warn（不反噬已落盘事实——照常 200）", { timeout: 30_000 }, async () => {
  const warns = []
  const log = { info() {}, warn: (tag, info) => warns.push([tag, info]), error() {} }
  const { db, app, admin, file } = await startAdminApp("auditfail", { env: {}, log, recordAuditFn: () => { throw new Error("审计注入失败") } })
  try {
    writeConfig(file, baseConfig())
    const res = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { trustProxy: true } })
    assert.equal(res.status, 200, res.text)
    assert.equal(JSON.parse(readFileSync(file, "utf8")).trustProxy, true, "写盘事实保持")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'config_update'").get().n, 0)
    assert.deepEqual(warns.filter(([tag]) => tag === "config_audit_failed").length, 1, JSON.stringify(warns))
  } finally { await app.close(); db.close() }
})

test("B7 读档失败：档缺 ⇒ GET 500 ∥ PATCH 500（不盲写——不建档）", { timeout: 30_000 }, async () => {
  const missing = join(tmpBox("nofile"), "missing.json")
  const { db, app, admin } = await startAdminApp("nofile", { env: {}, configPath: missing })
  try {
    for (const method of ["GET", "PATCH"]) {
      const res = await call(app.base, method, "/api/admin/config", { cookie: admin.cookie, ...(method === "PATCH" ? { body: { autoUpdate: "auto" } } : {}) })
      assert.equal(res.status, 500, `${method}：${res.text}`)
      assert.equal(res.json.error.code, "internal_error")
    }
    assert.equal(existsSync(missing), false, "读档失败 ⇒ 不盲写（零建档）")
  } finally { await app.close(); db.close() }
})

test("B8 写盘失败（端点径——fs 注入）：500 ∥ 文件零变 ∥ tmp 零残留", { timeout: 30_000 }, async () => {
  const file = join(tmpBox("writeendpoint"), "config.json")
  writeConfig(file, baseConfig())
  const before = readFileSync(file, "utf8")
  const fs = { ...REAL_FS, renameSync: () => { throw new Error("EACCES: 注入") } }
  const { db, app, admin } = await startAdminApp("writeendpoint", { env: {}, configPath: file, fs })
  try {
    const res = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { autoUpdate: "auto" } })
    assert.equal(res.status, 500, res.text)
    assert.equal(res.json.error.code, "internal_error")
    assert.equal(readFileSync(file, "utf8"), before, "文件零变")
    assert.equal(existsSync(`${file}.tmp`), false, "tmp 零残留")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'config_update'").get().n, 0, "写失败 ⇒ 零审计")
  } finally { await app.close(); db.close() }
})

test("B9 并发（同步段单写者）：两 PATCH 并发 ⇒ 两键并存（无交错丢写）∥ tmp 零残留", { timeout: 30_000 }, async () => {
  const { db, app, admin, file } = await startAdminApp("conc", { env: {} })
  try {
    writeConfig(file, baseConfig())
    const [a, b] = await Promise.all([
      call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { autoUpdate: "auto" } }),
      call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { trustProxy: true } }),
    ])
    assert.deepEqual([a.status, b.status], [200, 200])
    const after = JSON.parse(readFileSync(file, "utf8"))
    assert.deepEqual([after.autoUpdate, after.trustProxy], ["auto", true], "读改写同步段无交错（后到者基于前写结果）")
    assert.equal(existsSync(`${file}.tmp`), false)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'config_update'").get().n, 2)
  } finally { await app.close(); db.close() }
})

// ── C v10 迁移（audit_events CHECK 扩型——表重建）──────────────────────────────

test("C1 空库直落 10：CHECK 含 `config_update`（可写）∥ 两索引在场 ∥ 重建残留零 ∥ 链尾 v10", () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(db), DB.MIGRATIONS.at(-1).v], [14, 14, 14])
    assert.ok(AUDIT.AUDIT_TYPES.includes("config_update"), "事件目录十型（+ config_update）")
    const id = AUDIT.recordAudit(db, { type: "config_update", actor: "admin", detail: { keys: ["autoUpdate"] } })
    assert.ok(id >= 1)
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n, 1)
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'audit_events'").all().map((row) => row.name).sort()
    assert.deepEqual(indexes, ["idx_audit_ts", "idx_audit_type_ts"], "两索引在场（重建后）")
    assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'audit_events%'").all().map((row) => row.name), ["audit_events"], "表重建残留零（无 `_v10` 表）")
  } finally { db.close() }
})

test("C2 v9 库自动升 10：存量行逐值保形 ∥ `config_update` 可写 ∥ 序号连续 ∥ 幂等（二跑同态）", () => {
  const file = join(tmpBox("v10"), "gateway.db")
  const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 9) })
  assert.equal(DB.readVersion(legacy), 9)
  const insert = legacy.prepare("INSERT INTO audit_events (id, ts, type, actor_id, actor_name, target_id, target_name, detail) VALUES (?,?,?,?,?,?,?,?)")
  insert.run(1, 1000, "login_success", 7, "alice", null, "", '{"ip":"10.0.0.1"}')
  insert.run(2, 2000, "key_issue", 7, "alice", 7, "alice", '{"keyHint":"sk-tc-…"}')
  insert.run(5, 5000, "member_create", 7, "alice", 9, "bob", '{"role":"user"}')
  const before = legacy.prepare("SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events ORDER BY id").all()
  legacy.close()
  const db = DB.openDatabase(file) // 启动自动升
  try {
    assert.equal(DB.readVersion(db), 14, "v9 库自动升 14")
    const after = db.prepare("SELECT id, ts, type, actor_id, actor_name, target_id, target_name, detail FROM audit_events ORDER BY id").all()
    assert.deepEqual(after, before, "存量行逐值保形（含 id 空洞 1/2/5）")
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'audit_events'").all().map((row) => row.name).sort()
    assert.deepEqual(indexes, ["idx_audit_ts", "idx_audit_type_ts"])
    assert.equal(AUDIT.recordAudit(db, { type: "config_update", actor: "admin" }), 6, "新事件 id 不撞存量（sqlite_sequence 连续）")
    assert.equal(DB.migrate(db), 14, "再跑迁移链零效（幂等）")
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n, 4, "二跑行数不变")
  } finally { db.close() }
  const again = DB.openDatabase(file) // 二跑同态
  try {
    assert.equal(DB.readVersion(again), 14)
    assert.equal(again.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n, 4)
  } finally { again.close() }
})

test("C3 CHECK 负腿：未知事件型 ⇒ 拒写（扩型 ≠ 放开）", () => {
  const db = DB.openDatabase(":memory:")
  try {
    assert.throws(
      () => db.prepare("INSERT INTO audit_events (ts, type, actor_name) VALUES (?,?,?)").run(1, "bogus_type", "x"),
      /CHECK/,
    )
  } finally { db.close() }
})

// ── D 探活草稿口径（embedding-admin——§2.4）────────────────────────────────────

test("D1 resolveProbeTarget：三项明传优先 ∥ 缺省/空串回落 ∥ 掩码回落 ∥ `\"\"` 显式空 ∥ `env:` 字面", () => {
  const runtime = { baseURL: "http://runtime/v1", model: "runtime-model", apiKey: "runtime-key" }
  assert.deepEqual(EMBEDDING_ADMIN.resolveProbeTarget({}, runtime), runtime, "缺省 ⇒ 运行配置回落")
  assert.deepEqual(EMBEDDING_ADMIN.resolveProbeTarget({ baseURL: "", model: "  ", apiKey: "…1234" }, runtime), runtime, "空串/掩码不作明传值 ⇒ 回落")
  assert.deepEqual(
    EMBEDDING_ADMIN.resolveProbeTarget({ baseURL: "http://draft/v1", model: "draft-model", apiKey: "draft-key" }, runtime),
    { baseURL: "http://draft/v1", model: "draft-model", apiKey: "draft-key" },
    "在场 ⇒ 按明传值探活",
  )
  assert.deepEqual(EMBEDDING_ADMIN.resolveProbeTarget({ apiKey: "" }, runtime), { ...runtime, apiKey: "" }, "清除勾 = 显式空（不发 Authorization）")
  assert.deepEqual(EMBEDDING_ADMIN.resolveProbeTarget({ apiKey: "…abcdefgh" }, runtime).apiKey, "…abcdefgh", "`…` 起头的长串非回显形（明传——判据限长 ≤5）")
  assert.deepEqual(EMBEDDING_ADMIN.resolveProbeTarget({ apiKey: "env:EMBED_KEY" }, runtime), { ...runtime, apiKey: "env:EMBED_KEY" }, "`env:` 引用按字面值探发")
})

/** 假引擎（http）——记录请求形（url ∥ authorization ∥ body）并回两维向量。 */
async function startFakeEngine() {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      let json = null
      try { json = JSON.parse(Buffer.concat(chunks).toString("utf8")) } catch { /* 非 JSON：以 null 判 */ }
      requests.push({ method: req.method, url: req.url, headers: req.headers, json })
      const body = JSON.stringify({ data: [{ embedding: [0.25, 0.5, 0.75] }] })
      res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) })
      res.end(body)
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

test("D2 端点：草稿三项命中假引擎 ∥ 缺省/掩码 ⇒ 运行配置回落 ∥ 清除勾 ⇒ 不发 Authorization", { timeout: 30_000 }, async () => {
  const engine = await startFakeEngine()
  const config = CONFIG.validateConfig({
    host: "127.0.0.1",
    providers: [],
    embedding: { baseURL: `${engine.base}/runtime`, model: "runtime-model", apiKey: "runtime-key" },
  })
  const { db, app, admin } = await startAdminApp("probe", { env: {}, config })
  try {
    const draft = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin.cookie, body: { text: "hi", baseURL: `${engine.base}/draft`, model: "draft-model", apiKey: "draft-key" } })
    assert.deepEqual([draft.status, draft.json.ok, draft.json.dimensions], [200, true, 3], draft.text)
    assert.deepEqual([engine.requests[0].url, engine.requests[0].headers.authorization, engine.requests[0].json.model], ["/draft/embeddings", "Bearer draft-key", "draft-model"], "明传三项生效（未保存亦可先验）")
    const fallback = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin.cookie, body: { text: "hi" } })
    assert.equal(fallback.json.ok, true, fallback.text)
    assert.deepEqual([engine.requests[1].url, engine.requests[1].headers.authorization, engine.requests[1].json.model], ["/runtime/embeddings", "Bearer runtime-key", "runtime-model"], "缺省 ⇒ 运行配置回落")
    const masked = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin.cookie, body: { apiKey: "…-key" } })
    assert.equal(masked.json.ok, true, masked.text)
    assert.equal(engine.requests[2].headers.authorization, "Bearer runtime-key", "掩码回显形不作明传值 ⇒ 回落")
    const cleared = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: admin.cookie, body: { apiKey: "" } })
    assert.equal(cleared.json.ok, true, cleared.text)
    assert.equal("authorization" in engine.requests[3].headers, false, "清除勾 = 显式空（不发 Authorization）")
  } finally { await app.close(); await engine.close(); db.close() }
})

// ── E import 扫描（零第三方——红线）────────────────────────────────────────────

const walkMjs = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walkMjs(path, out)
    else if (extname(path) === ".mjs" || extname(path) === ".js") out.push(path)
  }
  return out
}

test("E1 import 扫描零第三方：src ∥ bin ∥ deploy 全档（`node:` 前缀 ∥ 相对路径）", () => {
  const files = ["src", "bin", "deploy"].flatMap((dir) => walkMjs(join(ROOT, "thincoder-server", dir)))
  assert.ok(files.length >= 30, `扫描面档数异常：${files.length}`)
  const importRe = /(?:import\s+[^"'()]*?from\s*|import\s*\(\s*|export\s+[^"'()]*?from\s*)["']([^"']+)["']/g
  const violations = []
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(importRe)) {
      const spec = match[1]
      if (!spec.startsWith("node:") && !spec.startsWith(".") && !spec.startsWith("/") && !spec.startsWith("@thincoder/core")) violations.push(`${file}: ${spec}`)
    }
  }
  assert.deepEqual(violations, [], "第三方 import 零（本仓包 @thincoder/core 除外——KD-SV-78；零第三方运行期依赖 = 红线）")
})

// ══ F 界面面块（界面面舱 append——判据源 = webui/WEBUI.md §2.1 §2.2 §2.3④ ∥ §6 AC-28 续）══════════════════════
// F1 服务配置卡（只读三行不入 PATCH 体 ∥ 四写控件 ∥ 不限 ⇒ null ∥ 非法 ⇒ 不提交 ∥ 读档失败 ⇒ 就地错态）∥ F2 系统页五节 + 向量卡（三输入 ∥ 保存三态 ∥ 草稿探活）∥ F3 审计十型 + `keys` 详情∥ F4 i18n 29 键 + `useProxy` 改向 ∥ F5 静态面 + 零外部引用 + 零 CJK + `t()` ⊆ 表键
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const loadPublic = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)
const [{ ZH }, { EN }, CONFIG_VIEW, SYSTEM_VIEW, AUDIT_VIEW, STATIC] = await Promise.all([
  loadPublic("i18n-zh.mjs"), loadPublic("i18n-en.mjs"), loadPublic("views-system-config.mjs"),
  loadPublic("views-system.mjs"), loadPublic("views-audit.mjs"), load("thincoder-server/src/webui/static.mjs"),
])
const F_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/

/** 剥注释（字符串态感知——沿 i18n 批件口径；「注释外零 CJK」判据取此）。 */
function fStripComments(src) {
  let out = ""
  let mode = "code"
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]
    const next = src[i + 1]
    if (mode === "code") {
      if (ch === "/" && next === "/") { mode = "line"; i += 1; continue }
      if (ch === "/" && next === "*") { mode = "block"; i += 1; continue }
      if (ch === '"') mode = "dq"
      else if (ch === "'") mode = "sq"
      else if (ch === "`") mode = "tq"
      out += ch
    } else if (mode === "line") { if (ch === "\n") { mode = "code"; out += ch } } else if (mode === "block") { if (ch === "*" && next === "/") { mode = "code"; i += 1 } } else {
      out += ch
      if (ch === "\\") { out += next ?? ""; i += 1 }
      else if ((mode === "dq" && ch === '"') || (mode === "sq" && ch === "'") || (mode === "tq" && ch === "`")) mode = "code"
    }
  }
  return out
}

/** 桩节点 ∥ `h` ∥ 查树（`dom.mjs` 语义近似：受控属性 ∥ on 前缀事件 ∥ textContent 直落）。 */
function fNode(tag) {
  const node = {
    tag, children: [], listeners: {}, attrs: {}, textContent: "", className: "", value: "", placeholder: "",
    checked: false, disabled: false, hidden: false, focused: false,
    append(...items) { for (const item of items.flat(Infinity)) { if (item === null || item === undefined || item === false) continue; node.children.push(item) } },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
    focus() { node.focused = true },
    fire(type, event = {}) { const target = { preventDefault() {}, ...event }; return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target))) },
  }
  return node
}

function fH(tag, props = {}, ...children) {
  const node = fNode(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = String(value)
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) { if (child === null || child === undefined || child === false) continue; node.append(child) }
  return node
}

const fFindAll = (root, pred, out = []) => { if (root !== null && typeof root === "object") { if (pred(root)) out.push(root); for (const child of root.children ?? []) fFindAll(child, pred, out) } return out }
const fFind = (root, pred) => fFindAll(root, pred)[0] ?? null
const fTick = () => new Promise((resolve) => setTimeout(resolve, 0))
const fTable = (headers, rows) => fH("div", { class: "table-wrap" }, ...rows.map((cells) => fH("tr", {}, ...cells.map((cell) => {
  const td = fNode("td")
  if (typeof cell === "string") td.textContent = cell
  else td.append(cell)
  return td
}))))
const stubDocument = () => ({ createElement: (tag) => fNode(tag), getElementById: () => null })
const fPatches = (calls) => calls.filter(([method, path]) => method === "PATCH" && path === "/api/admin/config")
const fProbes = (calls) => calls.filter(([method, path]) => method === "POST" && path === "/api/admin/embedding/test")

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入 `calls`）。 */
function fCtx(routes = {}) {
  const calls = []
  const ctx = {
    h: fH,
    state: { system: { version: "1.2.3", update: { mode: "notify", lastCheckAt: null, latest: null }, embedding: { model: "bge-m3" } } },
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    table: fTable,
    fmtTs: (ts) => `ts:${ts}`,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    flash: (message) => calls.push(["flash", message]),
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    health: () => ({ label: ZH["health.ok"], body: { db: "ok", uptime: 12 }, checkedAt: 1000 }),
    onHealth: () => {},
    dataShell: (mount, { head, area }) => { mount.append(head); mount.append(area) },
  }
  return { ctx, calls }
}

/** 文件面样例（有效值——在场值 ∥ 缺省回填已由服务端归一）。 */
const fConfig = () => ({
  host: "0.0.0.0", port: 8787, db: "/app/data/gateway.db", autoUpdate: "notify", trustProxy: false, usageRetentionDays: 90, proxyUri: null,
  embedding: { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3", apiKey: "…cret" }, bootstrap: { username: "admin" },
})
const F_BASE_URL = fConfig().embedding.baseURL
const fEmbedding = (over = {}) => ({ embedding: { baseURL: F_BASE_URL, model: "bge-m3", ...over } })
const fFlash = (calls) => calls.filter(([tag]) => tag === "flash").at(-1)
// ── F1 服务配置卡（§2.1——只读三行 ∥ 可写四项；写路径 = OPS §7 AC-28）────────────────────────

test("F1 服务配置卡：只读三行不入 PATCH 体 ∥ 四写控件（代理行回迁）∥ 不限 ⇒ null ∥ 非法 ⇒ 不提交 ∥ 读档失败 ⇒ 就地错态", async () => {
  globalThis.document = stubDocument()
  try {
    const { ctx, calls } = fCtx({ "GET /api/admin/config": () => ({ config: fConfig() }), "PATCH /api/admin/config": () => ({ ok: true }) })
    const card = CONFIG_VIEW.systemConfigSection(ctx)
    assert.ok(fFind(card, (n) => n.textContent === ZH["common.loading"]) !== null, "取数在途 ⇒ 加载行")
    await fTick()
    for (const [label, value] of [[ZH["system.cfgHost"], "0.0.0.0"], [ZH["system.cfgPort"], "8787"], [ZH["system.cfgDb"], "/app/data/gateway.db"]]) assert.ok(fFind(card, (n) => n.textContent === label) !== null && fFind(card, (n) => n.textContent === value) !== null, `只读行缺位：${label} = ${value}`)
    const form = fFind(card, (n) => n.tag === "form")
    const select = fFind(form, (n) => n.tag === "select")
    const boxes = fFindAll(form, (n) => n.tag === "input" && n.attrs.type === "checkbox")
    const days = fFind(form, (n) => n.tag === "input" && n.attrs.type === "number")
    const extra = fFind(form, (n) => n.tag === "input" && n.attrs.type === undefined)
    assert.ok(extra !== null && extra.value === "", "代理行在册（proxy.uri 回迁——2026-10-10 代理回迁批；fixture null ⇒ 空串）")
    assert.deepEqual([select.value, boxes.length, days.value], ["notify", 2, "90"], "四写控件初值 = 文件面")
    select.value = "off"
    boxes[0].checked = true
    days.value = "30"
    await form.fire("submit")
    const offBody = fPatches(calls).at(-1)[2]
    assert.deepEqual(offBody, { autoUpdate: false, trustProxy: true, usageRetentionDays: 30, proxyUri: "" }, "可写四项提交（所见即所存——档位 off ⇒ false；代理空 ⇒ 删段语义）")
    for (const key of ["host", "port", "db"]) assert.equal(key in offBody, false, `只读行不入 PATCH 体：${key}`)
    assert.deepEqual(fFlash(calls), ["flash", ZH["system.cfgSaved"]], "成功 ⇒ flash 统一文案（重启生效）")
    boxes[1].checked = true
    await boxes[1].fire("change")
    assert.equal(days.disabled, true, "「不限」⇒ 天数输入退场")
    await form.fire("submit")
    assert.equal(fPatches(calls).at(-1)[2].usageRetentionDays, null, "「不限」⇒ null（原样——不被缺省吞）")
    boxes[1].checked = false
    await boxes[1].fire("change")
    days.value = "0"
    const before = fPatches(calls).length
    await form.fire("submit")
    assert.equal(fPatches(calls).length, before, "非法保留天数 ⇒ 不提交（前端先行）")
    const invalid = fFind(form, (n) => n.textContent === ZH["system.cfgRetentionInvalid"])
    assert.ok(invalid !== null && invalid.hidden === false, "非法 ⇒ 就地提示")
    const { ctx: badCtx, calls: badCalls } = fCtx({ "GET /api/admin/config": () => { throw new Error("EIO: 注入") } })
    const badCard = CONFIG_VIEW.systemConfigSection(badCtx)
    await fTick()
    assert.ok(fFind(badCard, (n) => n.textContent === ZH["system.cfgLoadFailed"]) !== null, "读档失败 ⇒ 就地错态")
    assert.equal(badCalls.filter(([tag]) => tag === "fail").length, 1, "失败 ⇒ fail 收口")
  } finally { delete globalThis.document }
})
// ── F2 系统页装配 + 向量卡配置面（§2.1——三输入 + 保存 + 草稿探活）──────────────────────────────

test("F2 系统页五节 ∥ 向量卡三输入 ∥ 保存体三态 ∥ 草稿探活/试跑体（标量三项明传优先）", async () => {
  globalThis.document = stubDocument()
  globalThis.location = { origin: "http://127.0.0.1:8791" }
  try {
    const routes = { "GET /api/admin/config": () => ({ config: fConfig() }), "PATCH /api/admin/config": () => ({ ok: true }), "POST /api/admin/embedding/test": () => ({ ok: true, dimensions: 1024, ms: 42 }) }
    const { ctx, calls } = fCtx(routes)
    const mount = fNode("section")
    SYSTEM_VIEW.renderSystem(ctx, mount)
    await fTick()
    const cards = fFindAll(mount, (n) => n.tag === "section" && n.className === "card")
    assert.equal(cards.length, 5, "系统页五节在册")
    for (const title of ["system.versionTitle", "system.accessTitle", "vector.title", "system.configTitle", "health.title"]) assert.ok(cards.some((c) => c.children.some((child) => child && child.tag === "h3" && child.textContent === ZH[title])), `缺节：${title}`)
    const card = cards.find((c) => c.children.some((child) => child && child.tag === "h3" && child.textContent === ZH["vector.title"]))
    const form = fFind(card, (n) => n.tag === "form" && n.className === "provider-form")
    const [baseURLInput, modelInput, apiKeyInput] = fFindAll(form, (n) => n.tag === "input" && n.attrs.type === undefined)
    const clearBox = fFind(form, (n) => n.tag === "input" && n.attrs.type === "checkbox")
    assert.deepEqual([baseURLInput.value, modelInput.value, apiKeyInput.value], [F_BASE_URL, "bge-m3", ""], "值 = 文件面 ∥ API Key 留空")
    assert.equal(apiKeyInput.placeholder, ZH["vector.apiKeyPh"].replace("{mask}", "…cret"), "掩码回显入占位（回显形不作明传值）")
    await form.fire("submit")
    assert.deepEqual(fPatches(calls).at(-1)[2], fEmbedding(), "未编辑 ⇒ 不携 apiKey")
    apiKeyInput.value = "sk-draft-1"
    await form.fire("submit")
    assert.deepEqual(fPatches(calls).at(-1)[2], fEmbedding({ apiKey: "sk-draft-1" }), "明填 ⇒ 明传")
    assert.equal(apiKeyInput.placeholder, ZH["vector.apiKeyPh"].replace("{mask}", "…ft-1"), "保存后掩码随新值（明传 ⇒ …+末 4）")
    apiKeyInput.value = "env:EMBED_KEY"
    await form.fire("submit")
    assert.equal(apiKeyInput.placeholder, ZH["vector.apiKeyPh"].replace("{mask}", "env:EMBED_KEY"), "保存后掩码随新值（`env:` 引用 ⇒ 原文——同服务端口径）")
    clearBox.checked = true
    await form.fire("submit")
    assert.deepEqual(fPatches(calls).at(-1)[2], fEmbedding({ apiKey: "" }), "清除勾 ⇒ 显式空")
    assert.equal(apiKeyInput.placeholder, ZH["vector.apiKeyPh"].replace("{mask}", "—"), "保存后掩码随新值（清除 ⇒ 无）")
    assert.deepEqual(fFlash(calls), ["flash", ZH["system.cfgSaved"]], "成功 ⇒ flash（重启生效统一文案）")
    assert.deepEqual(fProbes(calls).at(0)[2], {}, "渲染自动探活（字段未载 ⇒ 缺省 ⇒ 运行配置回落）")
    clearBox.checked = false
    apiKeyInput.value = "" // 复位为「未编辑」
    const recheck = fFind(card, (n) => n.tag === "button" && n.textContent === ZH["vector.recheck"])
    await recheck.fire("click")
    assert.deepEqual(fProbes(calls).at(-1)[2], { baseURL: F_BASE_URL, model: "bge-m3" }, "未编辑 ⇒ 不携 apiKey（回落）")
    apiKeyInput.value = "sk-draft-1"
    await recheck.fire("click")
    assert.deepEqual(fProbes(calls).at(-1)[2], { baseURL: F_BASE_URL, model: "bge-m3", apiKey: "sk-draft-1" }, "明填 ⇒ 明传（未保存亦可先验）")
    const testInput = fFind(card, (n) => n.tag === "input" && n.attrs.placeholder === ZH["vector.testPh"])
    testInput.value = "hello"
    await fFind(card, (n) => n.tag === "form" && n.className === "row-form").fire("submit")
    assert.deepEqual(fProbes(calls).at(-1)[2], { text: "hello", baseURL: F_BASE_URL, model: "bge-m3", apiKey: "sk-draft-1" }, "试跑 = text + 草稿三项")
  } finally { delete globalThis.document; delete globalThis.location }
})
// ── F3 审计十型 + `keys` 详情支（§2.3④）─────────────────────────────────────────────────────

test("F3 审计：十三型下拉（全部 + 十三型）∥ `config_update` 行详情 = 键名清单", async () => {
  globalThis.document = stubDocument()
  try {
    const events = [
      { id: 2, ts: 2000, type: "config_update", actor: "admin", target: null, targetId: null, detail: { keys: ["autoUpdate", "proxyUri"] } },
      { id: 1, ts: 1000, type: "login_success", actor: "admin", target: null, targetId: null, detail: { ip: "10.0.0.1" } },
    ]
    const { ctx } = fCtx({ "GET /api/audit?": () => ({ events }) })
    const mount = fNode("section")
    await AUDIT_VIEW.renderAudit(ctx, mount)
    const select = fFind(mount, (n) => n.tag === "select")
    assert.equal(fFindAll(select, (n) => n.tag === "option").length, 12, "全部 + 十一型（含 agent_event；sandbox_* 两型随余面批登记）")
    assert.equal(fFind(select, (n) => n.value === "config_update")?.textContent, ZH["audit.type.config_update"], "型表含 `config_update`")
    const cells = fFindAll(mount, (n) => n.tag === "td").map((td) => td.textContent)
    assert.ok(cells.includes(`${ZH["audit.keys"]}: autoUpdate, proxyUri`), `config_update 详情 = 键名清单：${cells.join(" | ")}`)
    assert.ok(cells.includes("IP: 10.0.0.1"), "既有详情支（IP）不破")
  } finally { delete globalThis.document }
})
// ── F4 i18n（§2.2——本批 29 键（代理页批退役 2 ⇒ 27） ∥ `useProxy` 改向）───────────────────────────────────────────

/** 本批新增 29 键（§2.2 键族登记——两表逐键同步；代理页批 2026-10-09 退役 2 ⇒ 余 27）。 */
const F_NEW_KEYS = [
  "system.configTitle", "system.configHint", "system.cfgHost", "system.cfgPort", "system.cfgDb", "system.cfgTopologyNote",
  "system.cfgAutoUpdate", "system.cfgAutoUpdateOff", "system.cfgAutoUpdateNotify", "system.cfgAutoUpdateAuto",
  "system.cfgTrustProxy", "system.cfgRetention", "system.cfgRetentionUnlimited", "system.cfgRetentionInvalid", "system.cfgProvidersRow", "system.cfgProvidersValue",
  "system.cfgBootstrapRow", "system.cfgBootstrapValue", "system.cfgSaved", "system.cfgLoadFailed", "system.cfgRestartNote", "vector.apiKey", "vector.apiKeyPh", "vector.clearApiKey", "vector.draftNote", "audit.type.config_update", "audit.keys",
]
const fPlaceholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")

test("F4 i18n：本批 27 键两表在位（非空 ∥ 占位对位）∥ `useProxy` 改向", () => {
  assert.equal(F_NEW_KEYS.length, 27, "本批新键计数 = 27（代理页批退役 2）")
  for (const key of F_NEW_KEYS) {
    assert.ok(key in ZH, `zh 表缺新键：${key}`)
    assert.ok(key in EN, `en 表缺新键：${key}`)
    assert.ok(String(ZH[key]).trim() !== "" && String(EN[key]).trim() !== "", `空值键：${key}`)
    assert.equal(fPlaceholders(ZH[key]), fPlaceholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.ok(ZH["admin.providers.useProxy"].includes("「系统」页"), `useProxy 改向（zh）：${ZH["admin.providers.useProxy"]}`)
  assert.ok(EN["admin.providers.useProxy"].includes("System page"), `useProxy 改向（en）：${EN["admin.providers.useProxy"]}`)
})
// ── F5 静态面 ∥ 本批三档零 CJK ∥ `t("…")` ⊆ 表键 ────────────────────────────────────────────

test("F5 静态面：新档在册 + 直发 ∥ `public/**` 零外部引用 ∥ 本批三档注释外零 CJK ∥ t() 字面量 ⊆ 表键", async () => {
  const names = readdirSync(PUBLIC_DIR)
  assert.ok(names.includes("views-system-config.mjs"), "缺新档：views-system-config.mjs")
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  for (const name of ["views-system.mjs", "views-system-config.mjs", "views-audit.mjs"]) {
    const stripped = fStripComments(readFileSync(join(PUBLIC_DIR, name), "utf8"))
    assert.equal(stripped.match(F_CJK), null, `${name} 注释外含 CJK——文案应入 zh 族`)
    for (const match of stripped.matchAll(/\bt\(\s*"([^"]+)"/g)) {
      assert.ok(match[1] in ZH, `${name} 悬空键：${match[1]}`)
      assert.ok(match[1] in EN, `${name} 仅 zh 键：${match[1]}`)
    }
  }
  const site = STATIC.createStaticSite()
  const server = createHttpServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    const response = await fetch(`http://127.0.0.1:${port}/views-system-config.mjs`)
    assert.equal(response.status, 200, "新档静态直发")
    assert.match(response.headers.get("content-type"), /text\/javascript/, "mime = text/javascript")
    assert.equal(await response.text(), readFileSync(join(PUBLIC_DIR, "views-system-config.mjs"), "utf8"), "字节等于磁盘")
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})
