/**
 * 2026-10-06-models-config-ui.test.mjs — thincoder-server 批内单测件·运行面（服务模型配置面批·AC-17 运行腿载体；
 * 拆档先例 = PROJECT.md 注⑧「越 500 硬线 ⇒ 沿注③拆档预案」——全腿 = 本件 ＋ `2026-10-06-models-config.test.mjs`
 * （纯函数/静态面腿 ①③⑤⑥⑧⑨⑩）；两件同入 `prepublishOnly`；住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-models-config-ui.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §6 AC-17 ∥ AC-17（续）行 + 本批档 §2；腿 ↔ 轴对照在括号）：
 *   ② A 热生效（内存库——真网关）：PATCH `models` 减项 ⇒ `/v1/models` 随动 + 派发 404（退役项仍开放）
 *   ④ C 热生效（真网关——限流器注时钟）：PATCH `settings`（全对象线形——含 `quotaTokens`）⇒ 超限 ⇒ 429 `rate_limited` +
 *      `Retry-After`（不转发）∥ 注时钟滚窗 ⇒ 放行 ∥ 非法 ⇒ 400 库与读面零变 ∥ 部分字段保存/单字段清空读回
 *   ⑦ 弹窗面（桩 DOM）：详情四行 + 配置五组（A/C/F/D/E）∥ 嵌入行注（五组不落该行）∥ 未知模型 ⇒「未收录」 ∥
 *      保存 = PATCH `settings` 单键全对象（弹窗留驻 + flash ∥ 部分字段保存 ⇒ 重开草稿同源 ∥ 单字段清空 = 显式 `null` ∥
 *      非法 ⇒ 就地提示不提交——含 F 组 `ruleNonNegativeInt`）∥ 停用流（confirm ⇒ PATCH `models` 减项 ⇒ 关窗 + 行离列 + flash ∥ confirm 拒 ⇒ 零请求 ∥
 *      零上游探针）∥ 空态（`admin.models.empty`）∥ 与 Provider 页协同（单源 `models`——停用后其只读注不含）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)
const loadAt = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const [{ ZH }, MODELS, PROVIDER_MODALS] = await Promise.all([
  load("i18n-zh.mjs"), load("views-models.mjs"), load("views-providers-modals.mjs"), // ⑦e 协同腿（Provider 面弹窗——同批在盘）
])
const DB = await loadAt("thincoder-server/src/store/db.mjs")
const CONFIG = await loadAt("thincoder-server/src/ops/config.mjs")
const SERVER = await loadAt("thincoder-server/src/gateway/server.mjs")
const GATEWAY = await loadAt("thincoder-server/src/gateway/routes.mjs")
const RL = await loadAt("thincoder-server/src/gateway/ratelimit.mjs")
const PROVIDER_ADMIN = await loadAt("thincoder-server/src/gateway/provider-admin.mjs")
const MEMBERS = await loadAt("thincoder-server/src/accounts/members.mjs")
const KEYS = await loadAt("thincoder-server/src/accounts/keys.mjs")
const SESSION = await loadAt("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await loadAt("thincoder-server/src/accounts/routes.mjs")

const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──────

function makeNode(tag) {
  const classes = new Set()
  const node = {
    tag, children: [], listeners: {}, attrs: {}, parent: null,
    open: false, focused: false, checked: false, textContent: "", className: "", value: "", hidden: false,
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

const createDocument = () => ({ body: makeNode("body"), createElement: (tag) => makeNode(tag), getElementById: () => null })

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
const textOf = (node) => {
  if (typeof node === "string") return node
  return [node?.textContent ?? "", ...(node?.children ?? []).map(textOf)].filter(Boolean).join(" ")
}
const inputsOf = (root) => findAll(root, (node) => node.tag === "input")
/** 按标签文本取输入（配置字段——与树序无关）。 */
const fieldInput = (root, labelText) => {
  const label = findNode(root, (node) => node.tag === "label" && node.children[0]?.textContent === labelText)
  return label === null ? null : findAll(label, (node) => node.tag === "input")[0] ?? null
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/** 桩 ctx：api 路由表（`"METHOD path"` ⇒ handler——抛 = 失败径）∥ fail/flash 记录 ∥ 全调用入 `calls`。 */
function makeCtx(routes = {}, { state = { system: null } } = {}) {
  const calls = []
  const ctx = {
    h,
    state,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    fmtQuota: (value) => (value === null || value === undefined ? "Unlimited" : String(value)),
    fmtTs: (ts) => String(ts),
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
    dataShell: (mount, { head, area }) => {
      // 随正（2026-10-07 控制台布局收正批）：stub 语义近似——真品 = app.mjs dataShell；本件仅渲染面
      mount.append(head, area)
       return undefined // setCount 已撤（2026-10-07 光通道轮——计数入表 tfoot）
    },
  }
  return { ctx, calls }
}

// ── 真网关夹具（内存库 ∥ mock 上游 ∥ 限流器可注时钟）─────────────────────────

function seedMember(db, username = "alice") {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES (?, ?, 'scrypt$fixture', ?)")
    .run(username, username, new Date().toISOString())
  return Number(info.lastInsertRowid)
}

/** mock 上游（端口随机）：记录请求；回固定 chat 应答（含 usage）。 */
async function startMockUpstream() {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      let body = null
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")) } catch { /* 非 JSON 请求体：以 null 判 */ }
      requests.push({ method: req.method, url: req.url, headers: req.headers, body })
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ id: "from-mock", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "from-mock" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }))
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 进程内网关（gateway + provider 管理面 + 账号面注册行；`limiter` 注入口径——批内件注时钟）。 */
async function startApp({ db, limiter = null }) {
  const config = CONFIG.validateConfig({ host: "127.0.0.1", providers: [], embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" } })
  const log = { info() {}, warn() {}, error() {} }
  const routes = SERVER.createRouteTable()
  const runtime = GATEWAY.registerGatewayRoutes(routes, { db, config, log, env: {}, limiter })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime, log, env: {} })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

async function call(base, method, path, { body, cookie, teamKey } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  if (teamKey) headers.authorization = `Bearer ${teamKey}`
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: response.status, headers: response.headers, json }
}

const chat = (base, { teamKey, body }) => call(base, "POST", "/v1/chat/completions", { teamKey, body })

/** admin 登录（建成员 ⇒ 会话 cookie）。 */
async function loginAdmin(base, db) {
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: "password-123" })
  const response = await fetch(`${base}/api/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "admin", password: "password-123" }) })
  const setCookies = response.headers.getSetCookie?.() ?? []
  const cookie = setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))?.split(";")[0] ?? null
  assert.ok(cookie, "admin 登录失败")
  return cookie
}

// ── ② A 热生效（真网关——PATCH models 减项 ⇒ 清单随动 + 派发 404）───────────

test("② A 热生效：PATCH `models` 减项 ⇒ `/v1/models` 随动 + 派发 404（退役项仍开放——同口径可停的反面）", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  const app = await startApp({ db })
  try {
    const cookie = await loginAdmin(app.base, db)
    const key = KEYS.issueKey(db, seedMember(db)).plain
    const created = await call(app.base, "POST", "/api/admin/providers", { cookie, body: { name: "p1", baseURL: `${mock.base}/v1`, apiKey: "", models: ["a", "retired-1"] } })
    assert.equal(created.status, 200)
    const listModels = async () => (await call(app.base, "GET", "/v1/models", { teamKey: key })).json.data.map((model) => model.id)
    assert.deepEqual(await listModels(), ["p1/a", "p1/retired-1", "bge-m3"])
    // 停用（本页自持操作面）⇒ PATCH `models` 减项
    const patched = await call(app.base, "PATCH", `/api/admin/providers/${created.json.id}`, { cookie, body: { models: ["retired-1"] } })
    assert.equal(patched.status, 200)
    assert.deepEqual(await listModels(), ["p1/retired-1", "bge-m3"], "减项 ⇒ 清单随动（零重启）")
    // 派发 404（未开放）∥ 退役项仍开放（不在发现集不移除——同口径可停的另一面）
    const gone = await chat(app.base, { teamKey: key, body: { model: "p1/a", messages: [] } })
    assert.deepEqual([gone.status, gone.json.error.code], [404, "model_not_found"])
    const kept = await chat(app.base, { teamKey: key, body: { model: "p1/retired-1", messages: [] } })
    assert.equal(kept.status, 200)
    assert.equal(kept.json.choices[0].message.content, "from-mock")
    assert.equal(mock.requests.length, 1, "404 不转发")
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── ④ C 热生效（真网关——限流器注时钟）∥ settings 线形读回 ∥ 非法 400 ────────

test("④ C 热生效：PATCH `settings` ⇒ 超限 ⇒ 429 `rate_limited` + `Retry-After`（不转发）∥ 注时钟滚窗 ⇒ 放行 ∥ 非法 ⇒ 400 零变", async () => {
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  let nowMs = 1_800_000_000_000
  const app = await startApp({ db, limiter: RL.createRateLimiter({ now: () => nowMs }) })
  try {
    const cookie = await loginAdmin(app.base, db)
    const key = KEYS.issueKey(db, seedMember(db)).plain
    const created = await call(app.base, "POST", "/api/admin/providers", { cookie, body: { name: "p2", baseURL: `${mock.base}/v1`, apiKey: "", models: ["m1"] } })
    const id = created.json.id
    const patch = (settings) => call(app.base, "PATCH", `/api/admin/providers/${id}`, { cookie, body: { settings } })
    const settingsOf = async () => (await call(app.base, "GET", "/api/admin/providers", { cookie })).json.providers[0].settings
    const full = { rpm: 1, tpm: null, costIn: 0.5, costOut: 0.25, note: "keep", quotaTokens: 500 }
    // 线形：键 = 上游模型名 ∥ 值 = 全字段对象；GET 读回全子字段在册
    assert.equal((await patch({ m1: full })).status, 200)
    assert.deepEqual(await settingsOf(), { m1: full })
    // 部分字段编辑 = 全对象提交 ⇒ 其余字段保留；单字段清空 = 显式 null ⇒ 不误伤
    assert.equal((await patch({ m1: { ...full, tpm: 100 } })).status, 200)
    assert.deepEqual((await settingsOf()).m1, { rpm: 1, tpm: 100, costIn: 0.5, costOut: 0.25, note: "keep", quotaTokens: 500 })
    assert.equal((await patch({ m1: { ...full, tpm: null } })).status, 200)
    assert.deepEqual((await settingsOf()).m1, { rpm: 1, tpm: null, costIn: 0.5, costOut: 0.25, note: "keep", quotaTokens: 500 }, "单字段清空 = 显式 null（其余不误伤）")
    // 非法 ⇒ 400 `invalid_request_error` ∥ 库与读面零变
    for (const bad of [{ ...full, rpm: 0 }, { ...full, rpm: 1.5 }, { ...full, costIn: -1 }, { ...full, quotaTokens: -1 }, { ...full, quotaTokens: 1.5 }, { ...full, note: "x".repeat(201) }, { ...full, bogus: 1 }]) {
      const denied = await patch({ m1: bad })
      assert.deepEqual([denied.status, denied.json.error.code], [400, "invalid_request_error"], JSON.stringify(bad))
    }
    assert.deepEqual((await settingsOf()).m1, { rpm: 1, tpm: null, costIn: 0.5, costOut: 0.25, note: "keep", quotaTokens: 500 }, "400 ⇒ 库与读面零变")
    // 配额平台层默认（`quotaTokens`——AC-21①）：改值即读回 ∥ 清空 = 显式 null ∥ 非法 400（上块已含）
    assert.equal((await patch({ m1: { ...full, quotaTokens: 2000 } })).status, 200)
    assert.equal((await settingsOf()).m1.quotaTokens, 2000, "quotaTokens 保存即读回（热生效）")
    assert.equal((await patch({ m1: { ...full, quotaTokens: null } })).status, 200)
    assert.equal((await settingsOf()).m1.quotaTokens, null, "quotaTokens 清空 = 显式 null")
    assert.equal((await patch({ m1: full })).status, 200) // 归位（后续腿读回 full）
    // 热生效：第 1 请求 200（通过 ⇒ 计次）∥ 第 2 请求超限 ⇒ 429 + `Retry-After`
    const first = await chat(app.base, { teamKey: key, body: { model: "p2/m1", messages: [] } })
    assert.equal(first.status, 200)
    const second = await chat(app.base, { teamKey: key, body: { model: "p2/m1", messages: [] } })
    assert.deepEqual([second.status, second.json.error.code], [429, "rate_limited"])
    const retryAfter = second.headers.get("retry-after")
    assert.ok(/^\d+$/.test(retryAfter ?? "") && Number(retryAfter) >= 1, `Retry-After：${retryAfter}`)
    assert.equal(mock.requests.length, 1, "429 不转发（拒打）")
    // 注时钟滚窗（60s 定窗）⇒ 恢复放行
    nowMs += RL.RATE_LIMIT_WINDOW_MS + 1000
    const third = await chat(app.base, { teamKey: key, body: { model: "p2/m1", messages: [] } })
    assert.equal(third.status, 200, "窗滚恢复")
    assert.equal(mock.requests.length, 2)
  } finally {
    await app.close()
    await mock.close()
    db.close()
  }
})

// ── ⑦ 弹窗面（桩 DOM——详情 ∥ 配置五组 ∥ 保存流 ∥ 停用流 ∥ 空态 ∥ 协同）────

test("⑦a 弹窗：详情四行 + 配置五组（A/C/F/D/E）∥ 嵌入行注（五组不落该行）∥ 未知模型 ⇒「未收录」", () => {
  globalThis.document = createDocument()
  try {
    const { ctx } = makeCtx({})
    const row = { id: "deepseek/deepseek-flash", provider: "deepseek", upstream: "deepseek-flash", surface: "chat" }
    const entry = { id: 1, name: "deepseek", models: ["deepseek-flash"], settings: {} }
    const modal = MODELS.openModelModal(ctx, { row, entry, reload: async () => {} })
    const text = textOf(modal.root)
    for (const piece of ["deepseek/deepseek-flash", ZH["admin.models.colProvider"], "deepseek", ZH["admin.models.upstream"], ZH["admin.models.colSurface"],
      ZH["admin.models.configTitle"], ZH["admin.models.status"], ZH["admin.models.open"], ZH["admin.models.disable"], ZH["admin.models.disableHint"],
      ZH["admin.models.rateTitle"], ZH["admin.models.rpm"], ZH["admin.models.tpm"], ZH["admin.models.rateHint"],
      ZH["admin.models.quotaTitle"], ZH["admin.members.colMonthlyQuota"], ZH["admin.models.quotaHint"],
      ZH["admin.models.metaTitle"], ZH["admin.models.context"], ZH["admin.models.maxOutput"], ZH["admin.models.multimodal"], ZH["admin.models.metaHint"],
      ZH["admin.models.note"], ZH["admin.models.weightTitle"], ZH["admin.models.costIn"], ZH["admin.models.costOut"],
      ZH["admin.models.weightHint"], ZH["admin.models.weightNote"], ZH["common.save"], ZH["common.cancel"]]) {
      assert.ok(text.includes(piece), `弹窗缺：${piece}`)
    }
    assert.equal(text.includes(ZH["admin.models.embedNote"]), false, "嵌入行注 = 仅嵌入行")
    // D 组：已知模型 ⇒ 快照三值（上下文 ∥ 最大输出 ∥ 多模态）
    for (const shown of ["1000000", "384000", "✓"]) assert.ok(text.includes(shown), `元数据行缺：${shown}`)
    assert.equal(findAll(modal.root, (node) => node.textContent === ZH["admin.models.notCollected"]).length, 0, "已知模型零「未收录」")
    // 输入面 = rpm/tpm/costIn/costOut/quotaTokens + 说明（6 枚）；文本型（非 number——非法态可判，不被浏览器吞成空）
    const inputs = inputsOf(modal.root)
    assert.deepEqual(inputs.map((node) => node.value), ["", "", "", "", "", ""])
    assert.deepEqual(inputs.map((node) => node.attrs.type ?? "text"), ["text", "text", "text", "text", "text", "text"])
    assert.equal(fieldInput(modal.root, ZH["admin.models.note"]).attrs.maxlength, "200", "说明 ≤200 字符（与 HTML maxlength 同口径）")
    assert.deepEqual([fieldInput(modal.root, ZH["admin.models.rpm"]) !== null, fieldInput(modal.root, ZH["admin.models.costOut"]) !== null,
      fieldInput(modal.root, ZH["admin.members.colMonthlyQuota"]) !== null], [true, true, true], "F 组输入（quotaTokens）在册")
    modal.close()
    // 未知模型 ⇒ 「未收录」×3（不套兜底值）
    const unknownRow = { id: "p/whatever", provider: "p", upstream: "whatever", surface: "chat" }
    const unknown = MODELS.openModelModal(ctx, { row: unknownRow, entry: { id: 2, name: "p", models: ["whatever"], settings: {} }, reload: async () => {} })
    assert.equal(findAll(unknown.root, (node) => node.textContent === ZH["admin.models.notCollected"]).length, 3, "上下文/最大输出/多模态三行皆「未收录」")
    unknown.close()
    // 嵌入模型行：注在场 ∥ 四组不落该行 ∥ 零输入 ∥ 零脚区（无保存/取消）
    const embedRow = { id: "bge-m3", provider: "embedding", upstream: null, surface: "embeddings" }
    const embed = MODELS.openModelModal(ctx, { row: embedRow, entry: null, reload: async () => {} })
    const embedText = textOf(embed.root)
    assert.ok(embedText.includes(ZH["admin.models.embedNote"]))
    assert.equal(embedText.includes("—"), true, "上游模型名 = 「—」（引擎行无常量段）")
    for (const absent of [ZH["admin.models.status"], ZH["admin.models.rateTitle"], ZH["admin.models.quotaTitle"], ZH["admin.models.metaTitle"], ZH["admin.models.weightTitle"], ZH["common.save"]]) {
      assert.equal(embedText.includes(absent), false, `嵌入行不得含：${absent}`)
    }
    assert.deepEqual([inputsOf(embed.root).length, embed.root.children.length], [0, 2], "零输入 ∥ 零脚区（头 + 体）")
    embed.close()
  } finally {
    delete globalThis.document
  }
})

test("⑦b 保存流：PATCH `settings` 单键全对象（留驻 + flash）∥ 部分字段保存 ⇒ 重开草稿同源 ∥ 单字段清空 = 显式 null ∥ 非法（含 F 组）⇒ 就地提示不提交", async () => {
  globalThis.document = createDocument()
  try {
    const entry = { id: 3, name: "p", models: ["m1"], settings: { m1: { rpm: 5, tpm: 100, costIn: 0.25, costOut: null, note: "hi", quotaTokens: 200 } } }
    const { ctx, calls } = makeCtx({ "PATCH /api/admin/providers/3": () => ({ ok: true, id: 3 }) })
    const row = { id: "p/m1", provider: "p", upstream: "m1", surface: "chat" }
    const modal = MODELS.openModelModal(ctx, { row, entry, reload: async () => {} })
    // 草稿初值 = GET 行 settings 该键值（全部子字段在册——含 F 组 quotaTokens）
    const field = (label) => fieldInput(modal.root, label)
    assert.deepEqual([field(ZH["admin.models.rpm"]).value, field(ZH["admin.models.tpm"]).value, field(ZH["admin.models.costIn"]).value, field(ZH["admin.models.costOut"]).value,
      field(ZH["admin.members.colMonthlyQuota"]).value, field(ZH["admin.models.note"]).value], ["5", "100", "0.25", "", "200", "hi"])
    // 非法 ⇒ 就地提示不提交（零 PATCH）
    field(ZH["admin.models.rpm"]).value = "0"
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.equal(calls.filter(([kind]) => kind === "PATCH").length, 0, "非法 ⇒ 不提交")
    const hints = findAll(modal.root, (node) => node.className === "hint error" && node.hidden === false)
    assert.equal(hints.length, 1)
    assert.equal(hints[0].textContent, fill(ZH["admin.models.invalidNumber"], { field: ZH["admin.models.rpm"], rule: ZH["admin.models.rulePositive"] }))
    // F 组非法（quotaTokens 非 ≥0 整数——ruleNonNegativeInt）⇒ 就地提示不提交
    field(ZH["admin.models.rpm"]).value = "7"
    field(ZH["admin.members.colMonthlyQuota"]).value = "1.5"
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.equal(calls.filter(([kind]) => kind === "PATCH").length, 0, "F 组非法 ⇒ 不提交")
    assert.equal(findAll(modal.root, (node) => node.className === "hint error" && node.hidden === false)[0].textContent,
      fill(ZH["admin.models.invalidNumber"], { field: ZH["admin.members.colMonthlyQuota"], rule: ZH["admin.models.ruleNonNegativeInt"] }))
    // 修正 ⇒ 保存 = 全对象（其余字段保留 ∥ 空字段/未设显式 null——含 quotaTokens）
    field(ZH["admin.members.colMonthlyQuota"]).value = "200"
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1),
      ["PATCH", "/api/admin/providers/3", { settings: { m1: { rpm: 7, tpm: 100, costIn: 0.25, costOut: null, note: "hi", quotaTokens: 200 } } }])
    assert.ok(calls.some(([kind, value]) => kind === "flash" && value === ZH["admin.models.saved"]), "flash 已保存")
    assert.deepEqual([modal.root.open, modal.root.parent !== null], [true, true], "保存 ⇒ 弹窗留驻")
    // 重开草稿同源：部分字段保存 ⇒ 其余字段在（不丢）
    modal.close()
    const modal2 = MODELS.openModelModal(ctx, { row, entry, reload: async () => {} })
    const field2 = (label) => fieldInput(modal2.root, label)
    assert.deepEqual([field2(ZH["admin.models.rpm"]).value, field2(ZH["admin.models.tpm"]).value, field2(ZH["admin.models.costIn"]).value,
      field2(ZH["admin.members.colMonthlyQuota"]).value, field2(ZH["admin.models.note"]).value], ["7", "100", "0.25", "200", "hi"], "重开 = 全字段仍在")
    // 单字段清空 = 显式 null（其余不误伤）
    field2(ZH["admin.models.tpm"]).value = ""
    await byText(modal2.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1),
      ["PATCH", "/api/admin/providers/3", { settings: { m1: { rpm: 7, tpm: null, costIn: 0.25, costOut: null, note: "hi", quotaTokens: 200 } } }])
    modal2.close()
    // 取消 = 弃稿（零请求——开新草稿 ≠ 已保存值）
    const modal3 = MODELS.openModelModal(ctx, { row, entry, reload: async () => {} })
    const before = calls.length
    await byText(modal3.root, ZH["common.cancel"]).fire("click")
    assert.deepEqual([calls.length - before, modal3.root.open], [0, false], "取消 = 弃稿 + 关窗")
  } finally {
    delete globalThis.document
  }
})

test("⑦c A 停用流（弹窗 × 列表）：「停用」confirm ⇒ PATCH `models` 减项 ⇒ 关窗 + 行离列 + flash ∥ confirm 拒 ⇒ 零请求 ∥ 零上游探针", async () => {
  globalThis.document = createDocument()
  const confirms = []
  globalThis.window = { confirm: (message) => { confirms.push(message); return true } }
  try {
    const documentStub = globalThis.document
    const state = { providers: [{ id: 4, name: "p", baseURL: "http://x/v1", apiKey: "", models: ["retired-1", "a"], settings: {} }] }
    const { ctx, calls } = makeCtx({
      "GET /api/admin/providers": () => ({ providers: state.providers }),
      "PATCH /api/admin/providers/4": (body) => { state.providers = [{ ...state.providers[0], models: body.models }]; return { ok: true, id: 4 } },
    }, { state: { system: { embedding: { model: "bge-m3" } } } })
    const mount = makeNode("section")
    await MODELS.renderModels(ctx, mount)
    const rowText = (tr) => tr.children.map((cell) => textOf(cell)).join("|")
    const rows = findAll(mount, (node) => node.tag === "tr")
    assert.deepEqual(rows.slice(1).map(rowText), [
      "bge-m3|embedding|embeddings|—",
      "p/a|p|chat|" + ZH["common.quotaUnlimited"],
      "p/retired-1|p|chat|" + ZH["common.quotaUnlimited"],
      fill(ZH["common.rowCount"], { count: 3 }),
    ], "列表 = 开放集展平 + 引擎行 + 配额列（未设 ⇒「不限」∥ 嵌入「—」）+ tfoot 计数（序 = id 升序——2026-10-07 走查收正）")
    // 行点击（退役项——不在发现集仍开放）⇒ 详情弹窗 ⇒ 停用（confirm 通过）——升序后退役行 = 第 3 行
    await rows[3].fire("click")
    const dialog = findNode(documentStub.body, (node) => node.tag === "dialog")
    await byText(dialog, ZH["admin.models.disable"]).fire("click")
    assert.deepEqual(confirms, [fill(ZH["admin.models.disableConfirm"], { model: "p/retired-1" })], "confirm 文案在册（停用后果 + 重开路径）")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/4", { models: ["a"] }], "停用 = models 减项（confirm ⇒ PATCH）")
    assert.deepEqual([dialog.open, dialog.parent], [false, null], "停用 ⇒ 关窗")
    assert.ok(calls.some(([kind, value]) => kind === "flash" && value === fill(ZH["admin.models.disabled"], { model: "p/retired-1" })), "flash 已停用")
    // 列表刷新 ⇒ 行离列（重取系再渲）
    const rowsAfter = findAll(mount, (node) => node.tag === "tr")
    assert.deepEqual(rowsAfter.slice(1).map(rowText), [
      "bge-m3|embedding|embeddings|—",
      "p/a|p|chat|" + ZH["common.quotaUnlimited"],
      fill(ZH["common.rowCount"], { count: 2 }),
    ], "行离列 + tfoot 计数随动（序 = id 升序——2026-10-07 收正）")
    // 零上游探针：列表/详情/停用全程零 discover 调用（退役可见性 = Provider 页发现面）
    assert.equal(calls.filter(([, path]) => String(path).includes("/discover")).length, 0)
    // confirm 拒 ⇒ 零请求（弹窗留驻）
    globalThis.window.confirm = () => false
    await rowsAfter[2].fire("click")
    const dialog2 = findNode(documentStub.body, (node) => node.tag === "dialog")
    const before = calls.length
    await byText(dialog2, ZH["admin.models.disable"]).fire("click")
    assert.deepEqual([calls.length - before, dialog2.open], [0, true], "confirm 拒 ⇒ 零请求 + 留驻")
    dialog2.close()
  } finally {
    delete globalThis.window
    delete globalThis.document
  }
})

test("⑦d 空态：providers 空 ⇒ `admin.models.empty`（列表分支；零行）", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx } = makeCtx({ "GET /api/admin/providers": () => ({ providers: [] }) })
    const mount = makeNode("section")
    await MODELS.renderModels(ctx, mount)
    assert.ok(byText(mount, ZH["admin.models.empty"]) !== null, "空态文案在场")
    assert.deepEqual([findAll(mount, (node) => node.tag === "tr").length, findAll(mount, (node) => node.tag === "table").length], [0, 0], "空态零表零行")
  } finally {
    delete globalThis.document
  }
})

test("⑦e 与 Provider 页协同（单源 `models`）：停用后 Provider 详情弹窗退役注不含该模型", async () => {
  globalThis.document = createDocument()
  try {
    const { ctx } = makeCtx({ "POST /api/admin/providers/discover": () => ({ models: ["kept"] }) })
    const before = { id: 6, name: "p6", baseURL: "http://x/v1", apiKey: "", models: ["kept", "retired-1"] }
    // 停用前：退役注在场（已开放但不在发现列表）
    const modal = PROVIDER_MODALS.openProviderDetailModal(ctx, { provider: before, reload: async () => {} })
    await tick() // 首开自动拉取候选
    assert.ok(textOf(modal.root).includes(fill(ZH["admin.providers.retiredNote"], { models: "retired-1" })), "停用前：退役注在场")
    modal.close()
    // 本页停用 = 同一 provider.models 单源减项（PATCH `models` 的提交形）
    const disabled = { ...before, models: MODELS.modelsWithout(before.models, "retired-1") }
    const modal2 = PROVIDER_MODALS.openProviderDetailModal(ctx, { provider: disabled, reload: async () => {} })
    await tick()
    const text = textOf(modal2.root)
    const notePrefix = ZH["admin.providers.retiredNote"].split("{models}")[0]
    assert.deepEqual([text.includes("retired-1"), text.includes(notePrefix)], [false, false], "停用后：退役注不含（单源 models 随动）")
    modal2.close()
  } finally {
    delete globalThis.document
  }
})
