/**
 * 2026-10-07-provider-model-metadata.test.mjs — thincoder-server 批内单测件（Provider 模型元数据批——#1005 + 并入 #984；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-07-provider-model-metadata.test.mjs`
 *
 * 射程（判据源 = `gateway/API.md` §2.2「模型元数据」条/§5 AC-24 ∥ `store/STORE.md` §2 v7 段/§3 ∥
 * `webui/WEBUI.md` §2.4④/§6 AC-24 两行/§7 KD-SV-45/46；腿 ↔ 判据对照在括号）：
 *   ① 保留集抽取（AC-24①——`extractModelMeta` 直测）：deepseek 形（`context_window`+`input_modalities`+`name`）∥ kimi 形（`context_length`+`supports_image_in`+`display_name`）∥
 *      vLLM 形（`max_model_len`）⇒ 逐字段出图；经典四件 ⇒ `{}`；形不符逐项略（`context_window:"1M"` ∥ `status:"online"` ∥ 超长名 ∥ `display_name` = 模型名）
 *   ② v7 迁移（STORE §3）：空库直落 8 ∥ v6 库自动升 8（存量行得常量默认 `'{}'`）∥ 幂等 ∥ 新列常量默认在场
 *      ∥ `rowToEntry` 往返逐值 ∥ 坏 JSON ∥ 非对象 ⇒ 行数据损坏抛（沿 `settings_json` 口径）
 *   ③ 接口逐值（AC-24①②——真 HTTP）：discover 双集（富字段逐值 ∥ 经典 ⇒ `{}` ∥ 去重首见）∥ POST 携图 ⇒ GET 行逐值（非开放不入库）∥
 *      PATCH 不携 ⇒ 现存按求交滑动 ∥ PATCH 携 ⇒ 期望图替换（形不符即略）∥ 非对象 ⇒ 400 库与运行时零变 ∥ 探针零落库 ∥ `/v1/models` 零涉（元数据零带出）
 *   ④ 弹窗 DOM 桩（AC-24③④——`views-providers-modals.mjs`）：`fmtTokens`/`mergeModelMeta` 直测 ∥ 候选行富信息
 *      （有则示 ∥ 零字段零占位 ∥ 存储补齐）∥ 上游退役只提示（行标 + 注行；勾选/保存照常零停用）∥ 加载三态（在飞 ⇒ `.hint` + 钮禁用）
 *      ∥ 保存线形（空图 ⇒ 省略键；非空 ⇒ 携）∥ 添加窗探针随 POST 携图（无探针 ⇒ 省略键）
 *   ⑤ 求交滑落（AC-24②——`filterModelMeta` 直测）：白名单 + 形不符即略 + 与 `models` 求交（非开放不入库）∥ 非对象 ⇒ 抛
 *   ⑥ i18n + 静态面（WEBUI §2.2 键族 +7 ∥ §6 AC-24 续）：两表 7 键在场（en 零 CJK ∥ 占位符一致）∥ 基键集双向相等 ∥ 档目 29 ∥ 30（结构轮后）∥ 视图件行宽 ≤300 ∥ `style.css` 零新增（`:root` 38 ∥ 悬停七条——AC-19 canon）∥ 门禁链 30 件
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
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
const PROVIDER_ADMIN = await load("thincoder-server/src/gateway/provider-admin.mjs")
const PROVIDERS = await load("thincoder-server/src/gateway/providers.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const { ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const { EN } = await load("thincoder-server/public/i18n-en.mjs")
const MODALS = await load("thincoder-server/public/views-providers-modals.mjs")

const PASSWORD = "password-123"
const DISCOVER_URL = "/api/admin/providers/discover"

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tc-provider-meta-${tag}-`))
}
async function startServer({ db, config }) {
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
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
const patch = (base, path, opts) => call(base, "PATCH", path, opts)
async function login(base, username, password) {
  const res = await post(base, "/api/login", { body: { username, password } })
  const hit = res.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))
  return { res, cookie: hit ? hit.split(";")[0] : null }
}
async function makeMember(db, { username = "alice", role = "user", password = PASSWORD } = {}) {
  const { member } = await MEMBERS.createMember(db, { username, name: username, role, password })
  return member
}
/** mock 上游 `/models`（形可换——富集 ∥ 经典四件；`setPayload` 就地换形）。 */
async function startModelsUpstream() {
  let payload = { object: "list", data: [] }
  const server = createHttpServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(payload))
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    base: `http://127.0.0.1:${server.address().port}/v1`,
    setPayload: (next) => { payload = next },
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

// ── ① 保留集抽取（AC-24①——`extractModelMeta` 直测）────────────────────────────────

test("① 保留集抽取：deepseek/kimi/vLLM 三形逐字段 ∥ ark 状态命中 ⇒ 原文留档 ∥ 经典四件 ⇒ {} ∥ 形不符逐项略", () => {
  const { extractModelMeta } = PROVIDER_ADMIN
  // deepseek 形（`context_window` + `input_modalities` + `name`）——未收录不采（`max_output_tokens`/`effort`）
  assert.deepEqual(
    extractModelMeta({ id: "deepseek-chat", name: "DeepSeek Chat", context_window: 1048576, max_output_tokens: 8192, input_modalities: ["text", "image"], effort: "high" }, "deepseek-chat"),
    { displayName: "DeepSeek Chat", contextWindow: 1048576, vision: true },
  )
  // kimi 形（`context_length` + `supports_image_in` + `display_name`）——`think_efforts`/`supports_video_in` 不采
  assert.deepEqual(
    extractModelMeta({ id: "kimi-k2", display_name: "Kimi K2", type: "chat", context_length: 262144, supports_image_in: true, supports_video_in: false, think_efforts: ["low"] }, "kimi-k2"),
    { displayName: "Kimi K2", contextWindow: 262144, vision: true },
  )
  // vLLM 形（`max_model_len`）
  assert.deepEqual(extractModelMeta({ id: "qwen3-32b", max_model_len: 32768 }, "qwen3-32b"), { contextWindow: 32768 })
  // 退役判据（`status` 仅命中词表才收——子串·大小写无关；原文留档）
  assert.deepEqual(extractModelMeta({ id: "ark-x", version: "1", status: "Shutdown" }, "ark-x"), { status: "Shutdown" })
  assert.deepEqual(extractModelMeta({ id: "m", status: "DEPRECATED since 2026" }, "m"), { status: "DEPRECATED since 2026" })
  assert.deepEqual(extractModelMeta({ id: "m", status: "to be retired" }, "m"), { status: "to be retired" })
  // 经典四件 ⇒ {}（零兜底值、零占位）
  assert.deepEqual(extractModelMeta({ id: "gpt-4o" }, "gpt-4o"), {})
  assert.deepEqual(extractModelMeta({ id: "qwen-max", object: "model", created: 1, owned_by: "x" }, "qwen-max"), {})
  // 形不符逐项略（B20）：非正整数 ∥ 未命中词表 ∥ = 模型名 ∥ 超长 ∥ 非布尔
  assert.deepEqual(extractModelMeta({ id: "m", context_window: "1M" }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", context_window: 0 }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", context_window: 1.5 }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", status: "online" }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", display_name: "m" }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", name: "m" }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", display_name: "x".repeat(201) }, "m"), {})
  assert.equal(extractModelMeta({ id: "m", display_name: "x".repeat(200) }, "m").displayName.length, 200, "长度上限 ≤200 含界")
  assert.deepEqual(extractModelMeta({ id: "m", supports_image_in: "true", input_modalities: ["text"] }, "m"), {})
  assert.deepEqual(extractModelMeta({ id: "m", name: 42 }, "m"), {})
})

// ── ② v7 迁移（STORE §3——判据：空库 9 ∥ v6 升 9 ∥ 幂等 ∥ 常量默认在场）──────────────

test("② v7 迁移：空库直落 9 ∥ v6 库自动升 9（存量行得 '{}'）∥ 幂等 ∥ 新列常量默认在场 + rowToEntry 往返/坏 JSON", () => {
  const fresh = DB.openDatabase(":memory:")
  try {
    assert.deepEqual([DB.SCHEMA_VERSION, DB.readVersion(fresh)], [9, 9])
    const column = fresh.prepare("PRAGMA table_info(providers)").all().find((item) => item.name === "model_meta_json")
    assert.ok(column, "providers.model_meta_json 缺位")
    assert.deepEqual([column.type, column.notnull, column.dflt_value], ["TEXT", 1, "'{}'"]) // 常量默认 = '{}'（未存 = 无元数据）
  } finally {
    fresh.close()
  }

  const dir = tmpDir("migrate")
  const file = join(dir, "gateway.db")
  try {
    const legacy = DB.openDatabase(file, { migrations: DB.MIGRATIONS.filter((step) => step.v <= 6) }) // v6 旧库
    assert.equal(DB.readVersion(legacy), 6)
    legacy.exec("INSERT INTO providers (name, base_url, api_key, models_json, settings_json, created_at, updated_at) VALUES ('old', 'http://x/v1', '', '[\"m\"]', '{}', '2026-10-07', '2026-10-07')")
    legacy.close()
    const db = DB.openDatabase(file) // 启动自动升
    try {
      assert.equal(DB.readVersion(db), 9)
      assert.equal(db.prepare("SELECT model_meta_json FROM providers WHERE name = 'old'").get().model_meta_json, "{}", "存量行即刻得 '{}'")
      // 幂等：再跑迁移链 ⇒ 版本不变 ∥ 存量值不动
      assert.equal(DB.migrate(db), 9)
      assert.equal(db.prepare("SELECT model_meta_json FROM providers WHERE name = 'old'").get().model_meta_json, "{}")
      // rowToEntry 往返逐值 ∥ 坏 JSON ∥ 非对象 ⇒ 行数据损坏抛（沿 settings_json 口径）
      const spec = { m: { displayName: "M", contextWindow: 8192, vision: true, status: "Shutdown" } }
      db.prepare("UPDATE providers SET model_meta_json = ? WHERE name = 'old'").run(JSON.stringify(spec))
      assert.deepEqual(PROVIDERS.rowToEntry(db.prepare("SELECT * FROM providers WHERE name = 'old'").get()).modelMeta, spec)
      db.prepare("UPDATE providers SET model_meta_json = '{oops' WHERE name = 'old'").run(); assert.throws(() => PROVIDERS.rowToEntry(db.prepare("SELECT * FROM providers WHERE name = 'old'").get()), /model_meta_json 非 JSON/)
      db.prepare("UPDATE providers SET model_meta_json = '[]' WHERE name = 'old'").run(); assert.throws(() => PROVIDERS.rowToEntry(db.prepare("SELECT * FROM providers WHERE name = 'old'").get()), /model_meta_json 非对象/)
    } finally {
      db.close()
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ③ 接口逐值（AC-24①②——真 HTTP）──────────────────────────────────────────────

test("③ 接口逐值：discover 双集（富字段逐值 ∥ 经典 ⇒ {} ∥ 去重首见）∥ POST 携图 ⇒ GET 行逐值（非开放不入库）∥ PATCH 携与不携 ∥ 400 库与运行时零变 ∥ /v1/models 零涉", async () => {
  const upstream = await startModelsUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startServer({ db, config: CONFIG.validateConfig({ host: "127.0.0.1", embedding: { baseURL: upstream.base, model: "bge-m3" } }) })
  try {
    await makeMember(db, { username: "admin", role: "admin", password: "admin-password" })
    const alice = await makeMember(db)
    const key = KEYS.issueKey(db, alice.id)
    const adminSession = await login(app.base, "admin", "admin-password")
    const row = async () => (await get(app.base, "/api/admin/providers", { cookie: adminSession.cookie })).json.providers.find((item) => item.id === 1) ?? null
    // ① discover 富集：逐字段 ∥ 去重首见 ∥ 非字符串 id 不入集
    upstream.setPayload({ object: "list", data: [
      { id: "rich-a", name: "Rich A", context_window: 1048576, max_output_tokens: 8192, input_modalities: ["text", "image"] },
      { id: "rich-b", display_name: "Rich B", context_length: 262144, supports_image_in: true },
      { id: "plain-c", object: "model", created: 0, owned_by: "x" }, // 经典四件（零元数据）
      { id: "rich-a", name: "dupe" }, { id: 42 }, // 去重首见（首见图为准）∥ 非字符串 id 不入集
    ] })
    const discovered = await post(app.base, DISCOVER_URL, { cookie: adminSession.cookie, body: { baseURL: upstream.base } })
    assert.deepEqual([discovered.status, discovered.json.models], [200, ["rich-a", "rich-b", "plain-c"]])
    assert.deepEqual(discovered.json.modelMeta, { "rich-a": { displayName: "Rich A", contextWindow: 1048576, vision: true }, "rich-b": { displayName: "Rich B", contextWindow: 262144, vision: true } })
    // ② discover 经典四件 ⇒ modelMeta = {}（N17 同形）∥ 探针零落库（草稿语义）
    upstream.setPayload({ object: "list", data: [{ id: "plain-c", object: "model", created: 0, owned_by: "x" }] })
    assert.deepEqual((await post(app.base, DISCOVER_URL, { cookie: adminSession.cookie, body: { baseURL: upstream.base } })).json, { models: ["plain-c"], modelMeta: {} })
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM providers").get().n, 0, "发现探针零落库")
    // ③ POST 携期望图：白名单 + 求交（非开放不入库）⇒ GET 行逐值（恒在场）
    const posted = { name: "prov", baseURL: upstream.base, apiKey: "", models: ["rich-a", "plain-c"],
      modelMeta: { "rich-a": { displayName: "Rich A", contextWindow: 1048576, vision: true, status: "Shutdown" }, "plain-c": { contextWindow: 5 }, "closed-x": { contextWindow: 9 } } }
    assert.deepEqual((await post(app.base, "/api/admin/providers", { cookie: adminSession.cookie, body: posted })).json, { ok: true, id: 1 })
    assert.deepEqual((await row()).modelMeta, { "rich-a": { displayName: "Rich A", contextWindow: 1048576, vision: true, status: "Shutdown" }, "plain-c": { contextWindow: 5 } }, "非开放模型不入库（closed-x 滑落）")
    // ④ `/v1/models` 零涉：元数据零带出（条目形不变——对外契约零动）
    const listed = await get(app.base, "/v1/models", { headers: { authorization: `Bearer ${key.plain}` } })
    assert.deepEqual(listed.json.data.map((item) => item.id).sort(), ["bge-m3", "prov/plain-c", "prov/rich-a"])
    assert.deepEqual(Object.keys(listed.json.data.find((item) => item.id === "prov/rich-a")).sort(), ["created", "id", "object", "owned_by"])
    // ⑤ PATCH 不携 ⇒ 现存按求交滑动（删项随之滑落——零孤儿）
    assert.deepEqual((await patch(app.base, "/api/admin/providers/1", { cookie: adminSession.cookie, body: { models: ["rich-a"] } })).json, { ok: true, id: 1 })
    assert.deepEqual((await row()).modelMeta, { "rich-a": { displayName: "Rich A", contextWindow: 1048576, vision: true, status: "Shutdown" } }, "plain-c 随删项滑落")
    // ⑥ PATCH 携 ⇒ 期望图替换（白名单过滤 + 形不符即略 + 与提交 models 求交）
    assert.deepEqual((await patch(app.base, "/api/admin/providers/1", { cookie: adminSession.cookie, body: { modelMeta: { "rich-a": { vision: true, contextWindow: "1M", bogus: 1 }, missing: { vision: true } } } })).status, 200)
    assert.deepEqual((await row()).modelMeta, { "rich-a": { vision: true } }, "键在场 = 期望图（旧字段不残 ∥ 未知键/形不符略）")
    // ⑦ 非对象 ⇒ 400 库与运行时零变（E20——数组 ∥ 字符串；POST ∥ PATCH 两径）
    for (const bad of [[], "x"]) {
      const badPatch = await patch(app.base, "/api/admin/providers/1", { cookie: adminSession.cookie, body: { modelMeta: bad } })
      assert.deepEqual([badPatch.status, badPatch.json.error.code], [400, "invalid_request_error"], `PATCH ${JSON.stringify(bad)}`)
      const badPost = await post(app.base, "/api/admin/providers", { cookie: adminSession.cookie, body: { name: "p2", baseURL: upstream.base, models: [], modelMeta: bad } })
      assert.deepEqual([badPost.status, badPost.json.error.code], [400, "invalid_request_error"], `POST ${JSON.stringify(bad)}`)
    }
    assert.deepEqual(db.prepare("SELECT id, name, model_meta_json FROM providers").all().map((item) => [item.id, item.name, item.model_meta_json]), [[1, "prov", '{"rich-a":{"vision":true}}']], "400 ⇒ 库零变（零新行 ∥ 现值不动）")
    assert.ok((await get(app.base, "/v1/models", { headers: { authorization: `Bearer ${key.plain}` } })).json.data.some((item) => item.id === "prov/rich-a"), "400 ⇒ 运行时零变（换表零触）")
    // ⑧ PATCH 携空图 ⇒ 现存清空（显式期望图 = {}——写面零兜底）
    assert.deepEqual((await patch(app.base, "/api/admin/providers/1", { cookie: adminSession.cookie, body: { modelMeta: {} } })).status, 200)
    assert.deepEqual((await row()).modelMeta, {})
  } finally {
    await app.close()
    upstream.close()
    db.close()
  }
})

// ── ④ 弹窗 DOM 桩（AC-24③④——`views-providers-modals.mjs`）───────────────────────────

function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null, open: false, focused: false, checked: false, disabled: false, hidden: false, textContent: "", className: "", value: "",
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) },
    append(...items) {
      for (const item of items.flat(Infinity)) {
        if (item === null || item === undefined || item === false) continue
        if (typeof item === "object") item.parent = node
        node.children.push(item)
      }
    },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
    remove() {
      if (node.parent !== null) node.parent.children = node.parent.children.filter((child) => child !== node)
      node.parent = null
    },
    focus() { node.focused = true },
    fire(type, event = {}) {
      const target = { preventDefault() {}, ...event }
      return Promise.all((node.listeners[type] ?? []).map((fn) => fn(target)))
    },
    showModal() { node.open = true },
    close() { node.open = false; for (const fn of node.listeners.close ?? []) fn({}) },
  }
  return node
}

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点（字符串原样）。 */
function h(tag, props = {}, ...children) {
  const node = makeNode(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue
    if (key === "class") node.className = String(value)
    else if (key === "text") node.textContent = String(value)
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value)
    else if (["value", "checked", "disabled", "hidden"].includes(key)) node[key] = value
    else node.setAttribute(key, value)
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue
    node.append(child)
  }
  return node
}

function findAll(root, pred, out = []) {
  if (root !== null && typeof root === "object") {
    if (pred(root)) out.push(root)
    for (const child of root.children ?? []) findAll(child, pred, out)
  }
  return out
}
const findNode = (root, pred) => findAll(root, pred)[0] ?? null
const byText = (root, text) => findNode(root, (node) => node.textContent === text)
const textOf = (node) => (typeof node === "string" ? node : [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" "))
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
const createDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })
/** 候选勾选钮（行形：首格 `label[复选框, 模型名]`；`key-clear` 勾不计）。 */
const pickBoxes = (root) => findAll(root, (node) => node.tag === "input" && node.attrs.type === "checkbox" && node.parent?.tag === "label" && node.parent.className !== "key-clear")
const pickBox = (root, model) => pickBoxes(root).find((box) => box.parent.children.includes(model)) ?? null
/** 候选行文本格（`tr` 逐 `td`——列式：模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态；缺则空；tr ← td ← label ← box）。 */
const rowCells = (root, model) => pickBox(root, model).parent.parent.parent.children.filter((item) => item.tag === "td").map((item) => textOf(item))
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))
const SELF_KEYS = ["lang.zh", "lang.en"] // 自称名族（仅 zh 表载体）

test("④ 弹窗 DOM 桩：富信息（有则示 ∥ 零占位 ∥ 存储补齐）∥ 退役只提示（零停用）∥ 加载三态 ∥ 保存线形携带 ∥ 添加窗探针随 POST", async () => {
  globalThis.document = createDocument()
  try {
    // 展示助手直测（AC-24 续）
    assert.deepEqual([MODALS.fmtTokens(1048576), MODALS.fmtTokens(262144), MODALS.fmtTokens(8192), MODALS.fmtTokens(999), MODALS.fmtTokens(1500000), MODALS.fmtTokens(2000000)],
      ["1M", "262k", "8k", "999", "1.5M", "2M"], "≥1e6 ⇒ xM（一位小数舍零）∥ ≥1e3 ⇒ xk ∥ 原值")
    assert.deepEqual(MODALS.mergeModelMeta({ m: { displayName: "S", contextWindow: 1 } }, { m: { contextWindow: 2, vision: true }, n: { status: "Shutdown" } }), { m: { displayName: "S", contextWindow: 2, vision: true }, n: { status: "Shutdown" } }, "逐字段合并——发现优先 ∥ 存储补齐")

    // ── 详情窗：加载态 ⇒ 富信息行 ∥ 退役行标 + 注行 ⇒ 保存携期望图 ──
    let release = null
    const calls = []
    const ctx = {
      h,
      api: (path, { method = "GET", body } = {}) => {
        calls.push([method, path, body ?? null])
        if (method === "POST" && path === DISCOVER_URL) {
          return new Promise((resolve) => {
            release = () => resolve({ models: ["alpha", "bravo", "charlie", "delta-retired"], modelMeta: { alpha: { contextWindow: 262144, vision: true }, "delta-retired": { status: "Shutdown" } } })
          })
        }
        if (method === "PATCH") return Promise.resolve({ ok: true, id: 9 })
        return Promise.reject(new Error(`unexpected ${method} ${path}`))
      },
      flash: (message) => calls.push(["flash", message]), fail: (error) => calls.push(["fail", String(error)]),
    }
    const provider = { id: 9, name: "p9", baseURL: "http://x/v1", apiKey: "", models: ["alpha", "bravo", "charlie"], modelMeta: { bravo: { displayName: "Stored Bravo" } } }
    const modal = MODALS.openProviderDetailModal(ctx, { provider })
    // 加载态（#984）：在飞 ⇒ `.hint` 加载文案（静态、零动画）+「刷新候选」禁用
    assert.deepEqual([byText(modal.root, ZH["admin.providers.candidatesLoading"])?.className ?? null, byText(modal.root, ZH["admin.providers.refreshCandidates"]).disabled], ["hint", true], "在飞 ⇒ 加载文案 + 触发钮禁用")
    release()
    await tick()
    // 行 = 列式（模型 ∥ 展示名 ∥ 上下文 ∥ 视觉 ∥ 状态——名称升序；缺则空、零占位）
    assert.deepEqual(pickBoxes(modal.root).map((box) => box.parent.children[1]), ["alpha", "bravo", "charlie", "delta-retired"])
    assert.deepEqual(findAll(modal.root, (node) => node.tag === "th").map((node) => node.textContent),
      [ZH["admin.models.colModel"], ZH["admin.providers.colDisplayName"], ZH["admin.providers.colContext"], ZH["admin.providers.metaVision"], ZH["admin.providers.colStatus"]], "列头五格")
    assert.deepEqual(rowCells(modal.root, "alpha"), ["alpha", "", "262k", "✓", ""]); assert.deepEqual(rowCells(modal.root, "bravo"), ["bravo", "Stored Bravo", "", "", ""], "存储补齐（本次发现无 bravo）")
    assert.deepEqual(rowCells(modal.root, "charlie"), ["charlie", "", "", "", ""], "零字段零占位（空格）"); assert.deepEqual(rowCells(modal.root, "delta-retired"), ["delta-retired", "", "", "", ZH["admin.providers.upstreamRetiredBadge"]])
    // 类面：展示名/上下文/视觉 = `hint`；退役 = `hint error`（零新类——AC-19 canon；tr ← td ← label ← box）
    const cellSpans = (model) => pickBox(modal.root, model).parent.parent.parent.children.filter((item) => item.tag === "td").flatMap((td) => td.children.filter((child) => child.tag === "span").map((child) => child.className))
    assert.deepEqual([cellSpans("alpha"), cellSpans("delta-retired"), cellSpans("charlie")], [["hint", "hint"], ["hint error"], []])
    // 退役只提示：注行（「模型名 (状态原文)」清单）+ 被标记模型照常可勾（零停用）
    assert.ok(textOf(modal.root).includes(fill(ZH["admin.providers.upstreamRetiredNote"], { models: "delta-retired (Shutdown)" })), "退役注行在册")
    const retiredBox = pickBox(modal.root, "delta-retired")
    assert.equal(retiredBox.disabled, false, "被标记模型照常可勾（零停用）")
    retiredBox.checked = true
    await retiredBox.fire("change")
    // 保存线形：models 随勾选（全量数组）+ modelMeta 期望图（发现 ∪ 存储逐字段——非空 ⇒ 随携）
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/9", {
      models: ["alpha", "bravo", "charlie", "delta-retired"],
      modelMeta: { alpha: { contextWindow: 262144, vision: true }, bravo: { displayName: "Stored Bravo" }, "delta-retired": { status: "Shutdown" } },
    }])
    assert.deepEqual([modal.root.open, calls.some(([kind]) => kind === "fail")], [false, false])
    // 零变更 ⇒ 直接关窗（零请求——发现富化不单独触发写，§2.4④）
    const idle = MODALS.openProviderDetailModal({ h, api: ctx.api, flash: () => {}, fail: () => {} }, { provider: { ...provider, modelMeta: {} } })
    release()
    await tick()
    await byText(idle.root, ZH["common.save"]).fire("click")
    assert.deepEqual([calls.filter(([kind]) => kind === "PATCH").length, idle.root.open], [1, false], "零变更 ⇒ 零新 PATCH（恰前一次）")
    // 失败态：`.hint error` + 重试钮恢复可点（既有分支）
    const downCtx = { h, api: () => Promise.reject(Object.assign(new Error("boom"), { code: "upstream_error" })), flash: () => {}, fail: () => {} }
    const down = MODALS.openProviderDetailModal(downCtx, { provider: { ...provider, modelMeta: {} } })
    await tick()
    const errLine = findNode(down.root, (node) => node.className === "hint error" && node.parent?.className === "pick-box")
    assert.deepEqual([errLine?.textContent ?? null, byText(down.root, ZH["admin.providers.refreshCandidates"]).disabled], [ZH["err.upstream_error"], false], "失败 ⇒ `.hint error` + 重试钮可点")

    // ── 添加窗：探针在飞 ⇒ 加载态 ⇒ 完成 ⇒ 富信息行；保存 = POST 携探针图（无探针 ⇒ 省略键） ──
    let releaseAdd = null
    const addCalls = []
    const addCtx = {
      h,
      api: (path, { method = "GET", body } = {}) => {
        addCalls.push([method, path, body ?? null])
        if (method === "GET" && path === "/api/admin/providers/presets") return Promise.resolve({ presets: [] })
        if (method === "POST" && path === DISCOVER_URL) return new Promise((resolve) => { releaseAdd = () => resolve({ models: ["m-1"], modelMeta: { "m-1": { contextWindow: 8192 } } }) })
        if (method === "POST" && path === "/api/admin/providers") return Promise.resolve({ ok: true, id: 3 })
        return Promise.reject(new Error(`unexpected ${method} ${path}`))
      },
      flash: (message) => addCalls.push(["flash", message]), fail: (error) => addCalls.push(["fail", String(error)]),
    }
    const add = MODALS.openAddProviderModal(addCtx, { providers: [] })
    await tick()
    const select = findNode(add.root, (node) => node.tag === "select")
    select.value = "custom"
    await select.fire("change")
    const inputs = findAll(add.root, (node) => node.tag === "input")
    inputs[0].value = "p3"
    inputs[1].value = "http://x/v1"
    const fetchBtn = byText(add.root, ZH["admin.providers.fetchModels"])
    const fired = fetchBtn.fire("click") // 在飞（响应挂起——同径一处落双窗）
    assert.deepEqual([byText(add.root, ZH["admin.providers.candidatesLoading"]) !== null, fetchBtn.disabled], [true, true])
    releaseAdd()
    await fired
    assert.deepEqual([byText(add.root, ZH["admin.providers.candidatesLoading"]), fetchBtn.disabled], [null, false], "完成 ⇒ 转场候选（钮恢复）")
    assert.deepEqual(rowCells(add.root, "m-1"), ["m-1", "", "8k", "", ""])
    const m1 = pickBox(add.root, "m-1"); m1.checked = true
    await m1.fire("change")
    await byText(add.root, ZH["common.save"]).fire("click")
    assert.deepEqual(addCalls.filter(([kind, path]) => kind === "POST" && path === "/api/admin/providers").at(-1),
      ["POST", "/api/admin/providers", { name: "p3", baseURL: "http://x/v1", apiKey: "", models: ["m-1"], modelMeta: { "m-1": { contextWindow: 8192 } } }], "探针图随 POST 落库")
    // 无探针 ⇒ 省略键（保存不设发现门）
    const bareCalls = []
    const bare = MODALS.openAddProviderModal({ h, api: async (path, { method = "GET", body } = {}) => {
      bareCalls.push([method, path, body ?? null])
      return method === "GET" ? { presets: [] } : { ok: true, id: 4 }
    }, flash: () => {}, fail: () => {} }, { providers: [] })
    await tick()
    const select2 = findNode(bare.root, (node) => node.tag === "select")
    select2.value = "custom"
    await select2.fire("change")
    const inputs2 = findAll(bare.root, (node) => node.tag === "input")
    inputs2[0].value = "p4"
    inputs2[1].value = "http://x/v1"
    await byText(bare.root, ZH["common.save"]).fire("click")
    const barePost = bareCalls.find(([kind, path]) => kind === "POST" && path === "/api/admin/providers")
    assert.deepEqual(["modelMeta" in barePost[2], barePost[2].models], [false, []], "无探针 ⇒ 省略键（models 可空——沿 POST 语义）")
  } finally {
    delete globalThis.document
  }
})

// ── ⑤ 求交滑落（AC-24②——`filterModelMeta` 直测）─────────────────────────────────────

test("⑤ 求交滑落：白名单 + 形不符即略 + 与 models 求交（非开放不入库）∥ 非对象 ⇒ 抛 ∥ 已滤图再过零变", () => {
  const { filterModelMeta } = PROVIDER_ADMIN
  // 白名单（未收录子字段不采）+ 求交（非开放键不入库）
  assert.deepEqual(filterModelMeta({
    open: { displayName: "Open", contextWindow: 1000, vision: true, status: "Retired", effort: "high" },
    closed: { contextWindow: 5 },
  }, ["open"]), { open: { displayName: "Open", contextWindow: 1000, vision: true, status: "Retired" } })
  // 形不符逐项略 ⇒ 零字段 ⇒ 键不出（零占位）∥ 值非对象 ⇒ 键不出
  assert.deepEqual(filterModelMeta({ m: { contextWindow: "1M", vision: "yes", status: "online", displayName: "m" } }, ["m"]), {})
  assert.deepEqual(filterModelMeta({ m: "x" }, ["m"]), {})
  assert.deepEqual(filterModelMeta({}, ["m"]), {})
  // 非对象根 ⇒ 抛（调用方转 400——E20）
  for (const bad of [[], "x"]) assert.throws(() => filterModelMeta(bad, []), /modelMeta 须为对象/)
  // 幂等（已滤图再过一次零变——滑动路径与提交路径同源）
  const clean = { m: { displayName: "M", contextWindow: 8192, vision: true, status: "Shutdown" } }
  assert.deepEqual(filterModelMeta(clean, ["m"]), clean)
})

// ── ⑥ i18n + 静态面（WEBUI §2.2 键族 +7 ∥ §6 AC-24 续）──────────────────────────────

test("⑥ i18n + 静态面：两表 7 键在场（en 零 CJK ∥ 占位符一致）∥ 基键集相等 ∥ 档目 29 ∥ 30（结构轮后）∥ 行宽 ≤300 ∥ AC-19 canon ∥ 门禁链 30 件", () => {
  const NEW_KEYS = ["admin.providers.candidatesLoading", "admin.providers.metaVision", "admin.providers.upstreamRetiredBadge",
    "admin.providers.upstreamRetiredNote", "admin.providers.colDisplayName", "admin.providers.colContext", "admin.providers.colStatus"]
  for (const key of NEW_KEYS) {
    assert.ok(key in ZH && key in EN, `新键缺位：${key}`)
    assert.ok(ZH[key].trim().length > 0 && EN[key].trim().length > 0, `空值键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
    assert.equal(CJK.test(EN[key]), false, `en 表含 CJK：${key}`)
  }
  // 基键集双向相等（除自称名族 + `.one` 族——§2.2 口径）
  const zhBase = Object.keys(ZH).filter((key) => !SELF_KEYS.includes(key))
  const enBase = Object.keys(EN).filter((key) => !key.endsWith(".one"))
  for (const key of zhBase) assert.ok(key in EN, `en 表缺基键：${key}`)
  for (const key of enBase) assert.ok(key in ZH, `en 表多出基键：${key}`)
  assert.equal(zhBase.length, enBase.length, "基键集长度不等")
  // 视图件行宽 ≤300（行宽口径零变）
  const modalLines = readPublic("views-providers-modals.mjs").split("\n")
  for (const line of modalLines) assert.ok(line.length <= 300, `行宽越界：${line.slice(0, 60)}…`)
  // 档目 29 ∥ 30（结构轮后——十新档：i18n 部件八档 + `dom.mjs`/`health.mjs`）
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [30, 29], "档目 29 ∥ 30（结构轮后）")
  // AC-19 canon（`style.css` 零新增）：`:root` 变量族 38 ∥ 悬停声明七条
  const css = readPublic("style.css").replace(/\/\*[\s\S]*?\*\//g, "")
  const rootVars = (css.match(/:root\s*\{[^{}]*\}/)?.[0] ?? "").match(/--[\w-]+\s*:/g) ?? []
  assert.equal(rootVars.length, 38, `:root 变量族计数（零新增）：${rootVars.length}`)
  const hover = [...css.matchAll(/([^{}]*:hover[^{}]*)\{/g)].map((match) => match[1].trim().replace(/\s+/g, " ")).sort()
  assert.deepEqual(hover, [".nav-item:hover", "tbody tr:hover", "button:hover", "button.tiny:hover", "button.danger:hover", "button.link:hover", ".modal-close:hover"].sort(), "悬停声明清单（七条——零新增）")
  // 门禁链 31 件（结构轮批件入链 ∥ 10-09 代理批件入链）∥ 清单目标在盘
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.equal(batchFiles.length, 31, `门禁清单件数（二十六 ⇒ 三十一——结构轮批件入链 ∥ 10-09 bin 修复批件入链 ∥ 10-09 控制台测试 key 修复批件入链 ∥ 10-09 清除批件入链 ∥ 10-09 代理批件入链）：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-07-provider-model-metadata.test.mjs"), "本批件应入列")
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
