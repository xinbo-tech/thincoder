/**
 * 2026-10-09-console-proxy-page.test.mjs — thincoder-server 批内单测件（代理页批 · 台账 #1158 · KD-SV-60；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-09-console-proxy-page.test.mjs`
 *
 * 射程（判据源 = 本批档 §2 ∥ gateway/API.md §2.4/§5 AC-30 ∥ webui/WEBUI.md §2.7/§6 AC-30 续）：
 *   A 端点腿：假代理 + 假目标 ⇒ ok:true + status/ms + 假代理命中（真打实证）∥ 代理死 ⇒ unreachable ∥
 *     超时注入 ⇒ timeout ∥ loopback 目标 ⇒ 直连（假代理零命中）∥ 非 2xx 照实回读 ∥ 入参 400 族（零副作用）∥
 *     判权三态 ∥ 零落库零计费（usage/配额/审计零行）∥ 自含形（不走统一错误信封）∥ 入参助手直测
 *   B 前端腿：代理设置块结构（服务配置卡内两表单——2026-10-10 回迁：断言重指向 `views-system-config.mjs`）∥ 保存体 { proxyUri }（空 = 删段语义）∥ 测试体双必传
 *     （读卡一草稿——所见即所测）∥ 空值前端先行 ∥ 预填首个 provider baseURL ∥ 在飞禁用 ∥ 成败两态读数
 *   C 回归腿：服务配置卡四写控件（保存体携 proxyUri 明传）∥ 误删段护栏（服务面回读）∥ nav 直测（管理 7 ∥
 *     旧链 `/admin/proxy` ⇒ `/admin/system` ∥ denied）∥ i18n 键族（18 ⇒ 15 ∥ 退役 3 键零残留 ∥ `useProxy` 改值）∥ 静态面（views-proxy.mjs 退役 ∥ 零外部引用 ∥ 直发）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const PROXY_ADMIN = await load("thincoder-server/src/gateway/proxy-admin.mjs")
const CONFIG_ADMIN = await load("thincoder-server/src/gateway/config-admin.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")

const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const loadPublic = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)
const [{ ZH }, { EN }, CONFIG_VIEW, NAV, STATIC] = await Promise.all([
  loadPublic("i18n-zh.mjs"), loadPublic("i18n-en.mjs"),
  loadPublic("views-system-config.mjs"), loadPublic("nav.mjs"), load("thincoder-server/src/webui/static.mjs"),
])

const PASSWORD = "password-123"
const cleanups = []
const tmpBox = (tag) => { const dir = mkdtempSync(join(tmpdir(), `tc-proxy-${tag}-`)); cleanups.push(() => rmSync(dir, { recursive: true, force: true })); return dir }
test.after(() => { for (const fn of cleanups) fn() })

const usageCount = (db) => Number(db.prepare("SELECT COUNT(*) AS n FROM usage").get().n)
const auditCount = (db) => Number(db.prepare("SELECT COUNT(*) AS n FROM audit_events").get().n)
const quotaCount = (db) => Number(db.prepare("SELECT COUNT(*) AS n FROM quota_counters").get().n)

/** 进程内网关（代理测试面 + 配置面 + 账号面——判权/回归腿用）。 */
async function startApp({ db, configPath = null, log = null, fetchImpl = undefined, timeoutMs = undefined }) {
  const routes = SERVER.createRouteTable()
  PROXY_ADMIN.registerProxyAdminRoutes(routes, { db, log, fetchImpl, timeoutMs })
  if (configPath) CONFIG_ADMIN.registerConfigAdminRoutes(routes, { db, configPath, log })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config: {}, routes, log })
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

/** 建成员并起应用（admin ∥ user 两腿——返回 `{ db, app, admin, user }`）。 */
async function startAdminApp(tag, { configPath = null, log = null, fetchImpl = undefined, timeoutMs = undefined } = {}) {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  await MEMBERS.createMember(db, { username: "plain", role: "user", password: PASSWORD })
  const app = await startApp({ db, configPath, log, fetchImpl, timeoutMs })
  const admin = await login(app.base, "admin")
  const user = await login(app.base, "plain")
  return { db, app, admin, user }
}

/** 假代理（经典转发形）：记命中；`/err` 收尾 ⇒ 503（非 2xx 腿）；`hang` ⇒ 不响应（超时腿）。 */
async function startFakeProxy({ hang = false } = {}) {
  const hits = []
  const server = createHttpServer((req, res) => {
    hits.push({ method: req.method, url: req.url, host: req.headers.host ?? "" })
    if (hang) return // 连接保持（超时腿——close 时强断）
    if (String(req.url).endsWith("/err")) { res.writeHead(503, { "content-type": "text/plain" }); res.end("upstream says no"); return }
    res.writeHead(200, { "content-type": "text/plain" }); res.end("pong")
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return { base: `http://127.0.0.1:${server.address().port}`, hits, async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) } }
}

/** 假目标（loopback 直连腿的命中面）。 */
async function startFakeTarget() {
  const hits = []
  const server = createHttpServer((req, res) => {
    hits.push({ method: req.method, url: req.url })
    res.writeHead(200, { "content-type": "text/plain" }); res.end("direct")
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return { base: `http://127.0.0.1:${server.address().port}`, hits, async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) } }
}

/** 已关端口（unreachable 腿——监听后即关，端口复归空闲）。 */
async function closedPort() {
  const server = createHttpServer(() => {})
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address()
  await new Promise((resolve) => server.close(resolve))
  return port
}

// ── A 端点腿（gateway/API.md §2.4 ∥ §5 AC-30）──────────────────────────────────

test("A1 入参助手直测：双必传 ∥ uri 仅 http: ∥ target 仅 http(s) ∥ trim 归一", () => {
  assert.deepEqual(PROXY_ADMIN.parseProxyTestBody({ uri: " http://127.0.0.1:3128 ", target: " http://upstream.test/ping " }), { uri: "http://127.0.0.1:3128", target: "http://upstream.test/ping" }, "trim 归一")
  assert.deepEqual(PROXY_ADMIN.parseProxyTestBody({ uri: "http://a:1", target: "https://b.test/x" }).target, "https://b.test/x")
  const rejects = [
    [{}, /双必传/], [{ uri: "http://a:1" }, /双必传/], [{ target: "http://b.test/" }, /双必传/],
    [{ uri: "  ", target: "http://b.test/" }, /双必传/], [{ uri: 42, target: "http://b.test/" }, /双必传/],
    [{ uri: "https://a:1", target: "http://b.test/" }, /http:/], [{ uri: "not-a-url", target: "http://b.test/" }, /URL/],
    [{ uri: "http://a:1", target: "not-a-url" }, /target 非法 URL/], [{ uri: "http://a:1", target: "ftp://b.test/x" }, /仅收 http\(s\)/],
  ]
  for (const [body, pattern] of rejects) assert.throws(() => PROXY_ADMIN.parseProxyTestBody(body), pattern, JSON.stringify(body))
  assert.equal(PROXY_ADMIN.PROXY_TEST_TIMEOUT_MS, 10000, "预算 10s 在册")
})

test("A2 真打：假代理命中 ⇒ ok:true + status 200 + ms ∥ 非 2xx 照实回读（503）∥ 零落库零计费", { timeout: 30_000 }, async () => {
  const proxy = await startFakeProxy()
  const { db, app, admin } = await startAdminApp("realhit")
  const auditBefore = auditCount(db) // 基线（登录径自身落审计——零增量才证明测试径零审计）
  try {
    const ok = await call(app.base, "POST", "/api/admin/proxy/test", { cookie: admin.cookie, body: { uri: proxy.base, target: "http://upstream.test/ping" } })
    assert.equal(ok.status, 200, ok.text)
    assert.equal(ok.json.ok, true, ok.text)
    assert.equal(ok.json.status, 200, "状态逐值")
    assert.ok(Number.isInteger(ok.json.ms) && ok.json.ms >= 0, `ms 读数：${ok.json.ms}`)
    assert.equal("error" in ok.json, false, "自含形（成功体零信封）")
    assert.equal(proxy.hits.length, 1, "真打 = 恰一次经代理（假代理命中即证）")
    assert.deepEqual([proxy.hits[0].method, proxy.hits[0].url, proxy.hits[0].host], ["GET", "http://upstream.test/ping", "upstream.test"], "经典转发形（GET ∥ 绝对 URI 请求行 ∥ Host = 目标）")
    const err = await call(app.base, "POST", "/api/admin/proxy/test", { cookie: admin.cookie, body: { uri: proxy.base, target: "http://upstream.test/err" } })
    assert.equal([err.status, err.json.ok, err.json.status].join(","), "200,true,503", "非 2xx 照实回读（含非 2xx——不判败）")
    assert.equal(proxy.hits.length, 2)
    assert.deepEqual([usageCount(db), auditCount(db) - auditBefore, quotaCount(db)], [0, 0, 0], "零落库零计费零审计（零增量）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("A3 失败两分类：代理死 ⇒ unreachable ∥ 超时注入 ⇒ timeout（log.warn 恰一行）", { timeout: 30_000 }, async () => {
  const port = await closedPort()
  const { db, app, admin } = await startAdminApp("unreachable")
  const auditBefore = auditCount(db)
  try {
    const res = await call(app.base, "POST", "/api/admin/proxy/test", { cookie: admin.cookie, body: { uri: `http://127.0.0.1:${port}`, target: "http://upstream.test/ping" } })
    assert.equal(res.status, 200, res.text)
    assert.deepEqual([res.json.ok, res.json.error.kind], [false, "unreachable"], res.text)
    assert.match(res.json.error.message, /代理不可达/, "message 携底层诊断")
    assert.ok(Number.isInteger(res.json.ms))
    assert.deepEqual([usageCount(db), auditCount(db) - auditBefore], [0, 0], "失败径零落库零审计（零增量）")
  } finally { await app.close(); db.close() }
  const hang = await startFakeProxy({ hang: true })
  const warns = []
  const log = { info() {}, warn: (tag, info) => warns.push([tag, info]), error() {} }
  const slow = await startAdminApp("timeout", { log, timeoutMs: 100 })
  const slowAuditBefore = auditCount(slow.db)
  try {
    const res = await call(slow.app.base, "POST", "/api/admin/proxy/test", { cookie: slow.admin.cookie, body: { uri: hang.base, target: "http://upstream.test/ping" } })
    assert.equal(res.status, 200, res.text)
    assert.deepEqual([res.json.ok, res.json.error.kind], [false, "timeout"], res.text)
    assert.match(res.json.error.message, /超时/, "超时诊断句")
    assert.deepEqual(warns.map(([tag, info]) => [tag, info.kind]), [["proxy_test_failed", "timeout"]], "失败仅 log.warn 一行")
    assert.deepEqual([usageCount(slow.db), auditCount(slow.db) - slowAuditBefore], [0, 0])
  } finally { await slow.app.close(); await hang.close(); slow.db.close() }
})

test("A4 同判定：loopback 目标 ⇒ 直连（假代理零命中；旁路与生产同判）", { timeout: 30_000 }, async () => {
  const proxy = await startFakeProxy()
  const target = await startFakeTarget()
  const { db, app, admin } = await startAdminApp("loopback")
  try {
    const res = await call(app.base, "POST", "/api/admin/proxy/test", { cookie: admin.cookie, body: { uri: proxy.base, target: `${target.base}/ping` } })
    assert.equal([res.status, res.json.ok, res.json.status].join(","), "200,true,200", res.text)
    assert.equal(proxy.hits.length, 0, "旁路：假代理零命中")
    assert.deepEqual([target.hits.length, target.hits[0].url], [1, "/ping"], "直连真打（目标命中）")
  } finally { await app.close(); await target.close(); await proxy.close(); db.close() }
})

test("A5 入参 400 族：缺 ∥ 空 ∥ 非法 ⇒ 400 原报文且零副作用（假代理/目标零命中 ∥ 零库行）", { timeout: 30_000 }, async () => {
  const proxy = await startFakeProxy()
  const { db, app, admin } = await startAdminApp("bad")
  const auditBefore = auditCount(db)
  try {
    const cases = [
      [{}, /双必传/],
      [{ uri: proxy.base }, /双必传/],
      [{ uri: proxy.base, target: "" }, /双必传/],
      [{ uri: "https://127.0.0.1:3128", target: "http://upstream.test/ping" }, /http:/],
      [{ uri: "not-a-url", target: "http://upstream.test/ping" }, /URL/],
      [{ uri: proxy.base, target: "not-a-url" }, /target 非法 URL/],
      [{ uri: proxy.base, target: "ftp://upstream.test/x" }, /仅收 http\(s\)/],
    ]
    for (const [body, pattern] of cases) {
      const res = await call(app.base, "POST", "/api/admin/proxy/test", { cookie: admin.cookie, body })
      assert.equal(res.status, 400, `${JSON.stringify(body)} ⇒ ${res.status}：${res.text}`)
      assert.equal(res.json.error.code, "invalid_request_error")
      assert.match(res.json.error.message, pattern, `消息 = 单源原报文：${res.json.error.message}`)
    }
    assert.equal(proxy.hits.length, 0, "400 族零网络触面")
    assert.deepEqual([usageCount(db), auditCount(db) - auditBefore], [0, 0], "400 ⇒ 零库行（零增量）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("A6 判权三态：无会话 401 ∥ user 403 ∥ admin 200（体合法——拒在打前）", { timeout: 30_000 }, async () => {
  const proxy = await startFakeProxy()
  const { db, app, admin, user } = await startAdminApp("auth")
  try {
    const body = { uri: proxy.base, target: "http://upstream.test/ping" }
    for (const [cookie, expected, code] of [[null, 401, "unauthorized"], [user.cookie, 403, "forbidden"], [admin.cookie, 200, null]]) {
      const res = await call(app.base, "POST", "/api/admin/proxy/test", { cookie, body })
      assert.equal(res.status, expected, `cookie=${cookie ? "在场" : "无"}：${res.text}`)
      if (code) assert.equal(res.json.error.code, code)
      else assert.equal(res.json.ok, true)
    }
    assert.equal(proxy.hits.length, 1, "仅 admin 那一次真打（401/403 零代理触面）")
  } finally { await app.close(); await proxy.close(); db.close() }
})

test("A7 import 面：proxy-admin.mjs 零第三方（`node:` ∥ 相对路径）", () => {
  const src = readFileSync(join(ROOT, "thincoder-server", "src", "gateway", "proxy-admin.mjs"), "utf8")
  const specs = [...src.matchAll(/(?:import\s+[^"'()]*?from\s*|import\s*\(\s*)["']([^"']+)["']/g)].map((m) => m[1])
  assert.ok(specs.length >= 5, `import 面异常：${specs.join(", ")}`)
  const bad = specs.filter((spec) => !spec.startsWith("node:") && !spec.startsWith("."))
  assert.deepEqual(bad, [], "零第三方（红线）")
})

// ── B 前端腿（2026-10-10 代理回迁批随正：代理块并入服务配置卡——断言重指向 `views-system-config.mjs`）────────────────

/** 桩节点 ∥ `h` ∥ 查树（`dom.mjs` 语义近似——沿配置控制台批件口径）。 */
function fNode(tag) {
  const node = {
    tag, children: [], listeners: {}, attrs: {}, textContent: "", className: "", value: "", placeholder: "",
    checked: false, disabled: false, hidden: false,
    append(...items) { for (const item of items.flat(Infinity)) { if (item === null || item === undefined || item === false) continue; node.children.push(item) } },
    replaceChildren(...items) { node.children = []; node.append(...items) },
    addEventListener(type, fn) { (node.listeners[type] ??= []).push(fn) },
    setAttribute(name, value) { node.attrs[name] = String(value) },
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
const fTable = (headers, rows) => fH("div", { class: "table-wrap" }, ...rows.map((cells) => fH("tr", {}, ...cells.map((cell) => { const td = fNode("td"); td.textContent = String(cell); return td }))))
const fPatches = (calls) => calls.filter(([method, path]) => method === "PATCH" && path === "/api/admin/config")
const fTests = (calls) => calls.filter(([method, path]) => method === "POST" && path === "/api/admin/proxy/test")
const fFlash = (calls) => calls.filter(([tag]) => tag === "flash").at(-1)

/** 桩 ctx（api 路由表 `"METHOD path"` ⇒ handler；全调用入 `calls`）。 */
function fCtx(routes = {}) {
  const calls = []
  const ctx = {
    h: fH,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${path}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(body)
    },
    table: fTable,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    flash: (message) => calls.push(["flash", message]),
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
  }
  return { ctx, calls }
}

/** 文件面样例 + provider 样例。 */
const fConfig = (over = {}) => ({ host: "0.0.0.0", port: 8787, db: "data/gateway.db", autoUpdate: "notify", trustProxy: false, usageRetentionDays: 90, proxyUri: "http://127.0.0.1:3128", ...over })
const fProviders = () => ({ providers: [{ id: 1, name: "px", baseURL: "http://127.0.0.1:11434/v1" }, { id: 2, name: "py", baseURL: "http://127.0.0.1:8000/v1" }] })
const fCards = (mount) => fFindAll(mount, (n) => n.tag === "section" && n.className === "card")
const fResultLine = (card) => fFindAll(card, (n) => n.tag === "p").at(-1)

test("B1 代理设置块结构（服务配置卡内） ∥ 保存体 { proxyUri }（空 = 删段语义）∥ 测试体双必传（读卡一草稿——所见即所测）", async () => {
  const { ctx, calls } = fCtx({
    "GET /api/admin/config": () => ({ config: fConfig() }),
    "GET /api/admin/providers": () => fProviders(),
    "PATCH /api/admin/config": () => ({ ok: true }),
    "POST /api/admin/proxy/test": () => ({ ok: true, status: 200, ms: 12 }),
  })
  const card = CONFIG_VIEW.systemConfigSection(ctx)
  await fTick()
  const forms = fFindAll(card, (n) => n.tag === "form")
  assert.equal(forms.length, 2, "卡内两表单（配置 ∥ 连通测试——2026-10-10 代理回迁批并入）")
  const [saveForm, testForm] = forms
  const uriInput = fFind(saveForm, (n) => n.tag === "input" && n.attrs.type === undefined)
  const targetInput = fFind(testForm, (n) => n.tag === "input")
  assert.equal(uriInput.value, fConfig().proxyUri, "值 = 文件面有效值")
  assert.equal(uriInput.attrs.placeholder, ZH["proxy.uriPh"], "占位 = 文案键")
  assert.equal(targetInput.value, fProviders().providers[0].baseURL, "目标预填 = 首个 provider baseURL（库序）")
  assert.ok(fFind(saveForm, (n) => n.tag === "label") !== null && fFind(testForm, (n) => n.tag === "label") !== null, "两表单 label 形")
  assert.equal(fFind(saveForm, (n) => n.tag === "button" && n.textContent === ZH["common.save"]) !== null, true, "保存钮")
  assert.equal(fFind(testForm, (n) => n.tag === "button" && n.textContent === ZH["proxy.testBtn"]) !== null, true, "测试钮")
  uriInput.value = " http://127.0.0.1:8080 "
  await saveForm.fire("submit")
  assert.equal(fPatches(calls).at(-1)[2].proxyUri, "http://127.0.0.1:8080", "保存体携 proxyUri（所见即所存——trim）")
  assert.deepEqual(fFlash(calls), ["flash", ZH["system.cfgSaved"]], "成功 ⇒ flash（统一文案）")
  uriInput.value = ""
  await saveForm.fire("submit")
  assert.equal(fPatches(calls).at(-1)[2].proxyUri, "", "空 ⇒ 删段语义（服务端既有——原样明传）")
  uriInput.value = "http://127.0.0.1:9999" // 未保存草稿
  targetInput.value = "http://upstream.test/ping"
  await testForm.fire("submit")
  assert.deepEqual(fTests(calls).at(-1)[2], { uri: "http://127.0.0.1:9999", target: "http://upstream.test/ping" }, "测试体双必传（草稿 uri——未保存亦可先验）")
  const result = fResultLine(card)
  assert.equal(result.className, "hint", "成功 = 静态 hint")
  assert.equal(result.textContent, ZH["proxy.testOk"].replace("{status}", "200").replace("{ms}", "12"), "成功读数 =「代理连通——HTTP {status}（{ms} ms）」")
})

test("B2 空值前端先行（不提交）∥ 在飞「测试中……」+ 钮禁用 ∥ 失败就地错态", async () => {
  let settle = null
  const { ctx, calls } = fCtx({
    "GET /api/admin/config": () => ({ config: fConfig({ proxyUri: null }) }),
    "GET /api/admin/providers": () => ({ providers: [] }),
    "POST /api/admin/proxy/test": () => new Promise((resolve) => { settle = resolve }),
  })
  const card = CONFIG_VIEW.systemConfigSection(ctx)
  await fTick()
  const forms = fFindAll(card, (n) => n.tag === "form")
  const form = forms[1]
  const uriInput = fFind(forms[0], (n) => n.tag === "input" && n.attrs.type === undefined)
  const targetInput = fFind(form, (n) => n.tag === "input")
  const button = fFind(form, (n) => n.tag === "button")
  const result = fResultLine(card)
  assert.equal(uriInput.value, "", "空值 = 不启用（null ⇒ 空串）")
  assert.equal(targetInput.value, "", "零 provider ⇒ 预填空")
  await form.fire("submit")
  assert.equal(fTests(calls).length, 0, "空 uri ⇒ 不提交")
  assert.deepEqual([result.className, result.textContent], ["hint error", ZH["proxy.uriRequired"]], "空 uri = 就地拒绝提示")
  uriInput.value = "http://127.0.0.1:3128"
  await form.fire("submit")
  assert.equal(fTests(calls).length, 0, "空目标 ⇒ 不提交")
  assert.deepEqual([result.className, result.textContent], ["hint error", ZH["proxy.targetRequired"]], "空目标 = 前端先行提示")
  targetInput.value = "http://upstream.test/ping"
  const flight = form.fire("submit")
  await fTick()
  assert.equal(button.disabled, true, "在飞 = 钮禁用（KD-SV-46 口径）")
  assert.equal(result.textContent, ZH["proxy.testing"], "在飞 = 静态 hint")
  settle({ ok: false, error: { kind: "unreachable", message: "连接被拒（ECONNREFUSED）" }, ms: 5 })
  await flight
  assert.equal(button.disabled, false, "落定 ⇒ 钮恢复")
  assert.equal(result.className, "hint error", "失败 = 就地错态")
  assert.equal(result.textContent, ZH["proxy.testFail"].replace("{kind}", ZH["proxy.kind.unreachable"]).replace("{message}", "连接被拒（ECONNREFUSED）"), "失败读数 = kind 文案 + 底层诊断")
})

test("B3 取数失败两径：读档失败 ⇒ 就地错态（fail 收口 ∥ 零表单）∥ 预填取数失败 ⇒ 空输入不报错", async () => {
  const { ctx, calls } = fCtx({
    "GET /api/admin/config": () => { throw new Error("EIO: 注入") },
    "GET /api/admin/providers": () => { throw new Error("EIO: 注入") },
  })
  const card = CONFIG_VIEW.systemConfigSection(ctx)
  await fTick()
  assert.ok(fFind(card, (n) => n.textContent === ZH["system.cfgLoadFailed"]) !== null, "读档失败 ⇒ 就地错态")
  assert.equal(calls.filter(([tag]) => tag === "fail").length, 1, "读档失败 ⇒ fail 收口")
  assert.equal(fFind(card, (n) => n.tag === "form"), null, "读档失败 ⇒ 零表单（测试块不单独渲染——已并入卡体）")

  // 预填取数失败径（配置读档成功 ∥ providers 失败 ⇒ 空输入，用户自填——不报错）
  const { ctx: ctx2, calls: calls2 } = fCtx({
    "GET /api/admin/config": () => ({ config: fConfig() }),
    "GET /api/admin/providers": () => { throw new Error("EIO: 注入") },
  })
  const card2 = CONFIG_VIEW.systemConfigSection(ctx2)
  await fTick()
  const testForm = fFindAll(card2, (n) => n.tag === "form")[1]
  assert.equal(fFind(testForm, (n) => n.tag === "input").value, "", "预填取数失败 ⇒ 空输入（用户自填）")
  assert.equal(calls2.filter(([tag]) => tag === "fail").length, 0, "预填失败 ⇒ 零 fail 面（不反噬页面）")
})

// ── C 回归腿（受影响既有面：服务配置卡 ∥ nav ∥ i18n ∥ 静态面）────────────────────

test("C1 服务配置卡回归：代理行在册（proxy.uri 回迁）∥ 四写控件 ∥ 保存体携四键（proxyUri 明传）∥ 写白名单五键零变", async () => {
  const src = readFileSync(join(PUBLIC_DIR, "views-system-config.mjs"), "utf8")
  assert.equal(src.includes("proxyUri"), true, "档面携 proxyUri（回迁——2026-10-10 代理回迁批）")
  assert.equal(src.includes("proxy.uriLabel"), true, "档面引代理文案键")
  const { ctx, calls } = fCtx({ "GET /api/admin/config": () => ({ config: fConfig() }), "PATCH /api/admin/config": () => ({ ok: true }) })
  const card = CONFIG_VIEW.systemConfigSection(ctx)
  await fTick()
  const form = fFind(card, (n) => n.tag === "form")
  const select = fFind(form, (n) => n.tag === "select")
  const boxes = fFindAll(form, (n) => n.tag === "input" && n.attrs.type === "checkbox")
  const days = fFind(form, (n) => n.tag === "input" && n.attrs.type === "number")
  const extra = fFindAll(form, (n) => n.tag === "input" && n.attrs.type === undefined)
  assert.deepEqual([select.value, boxes.length, days.value, extra.length], ["notify", 2, "90", 1], "四写控件（select ∥ checkbox ∥ number ∥ 代理文本输入）")
  assert.equal(extra[0].value, fConfig().proxyUri, "代理行初值 = 文件面")
  extra[0].value = " http://127.0.0.1:8080 "
  await form.fire("submit")
  const body = fPatches(calls).at(-1)[2]
  assert.deepEqual(Object.keys(body).sort(), ["autoUpdate", "proxyUri", "trustProxy", "usageRetentionDays"], "保存体恰四键")
  assert.equal(body.proxyUri, "http://127.0.0.1:8080", "proxyUri 明传（trim——所见即所存）")
  // 白名单零变（AC-30 ①「导出直测」）
  assert.deepEqual(CONFIG_ADMIN.CONFIG_WRITABLE_KEYS, ["autoUpdate", "trustProxy", "usageRetentionDays", "proxyUri", "embedding"], "写白名单五键逐值零变")
  assert.ok(CONFIG_ADMIN.CONFIG_WRITABLE_KEYS.includes("proxyUri"), "`proxyUri` 在册（PATCH 可达——删段语义不破）")
})

test("C2 误删段护栏（服务面）：PATCH 三项 ⇒ 文件 proxy 段与 GET proxyUri 逐值不变", { timeout: 30_000 }, async () => {
  const file = join(tmpBox("guard"), "config.json")
  writeFileSync(file, JSON.stringify({ host: "127.0.0.1", proxy: { uri: "http://127.0.0.1:3128" }, providers: [] }), "utf8")
  const { db, app, admin } = await startAdminApp("guard", { configPath: file })
  try {
    const res = await call(app.base, "PATCH", "/api/admin/config", { cookie: admin.cookie, body: { autoUpdate: "auto", trustProxy: true, usageRetentionDays: 30 } })
    assert.equal(res.status, 200, res.text)
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")).proxy, { uri: "http://127.0.0.1:3128" }, "代理段零触（未出现键 = 不动）")
    const back = await call(app.base, "GET", "/api/admin/config", { cookie: admin.cookie })
    assert.deepEqual([back.json.config.proxyUri, back.json.config.autoUpdate], ["http://127.0.0.1:3128", "auto"], "回读逐值（代理段存活）")
  } finally { await app.close(); db.close() }
})

test("C3 nav 直测：管理 7 项（代理项退役）∥ 旧链 `/admin/proxy` ⇒ `/admin/system` 重定向 ∥ user ⇒ denied ∥ app.mjs 接线退场", () => {
  const admin = NAV.NAV_GROUPS.find((group) => group.key === "admin")
  const me = NAV.NAV_GROUPS.find((group) => group.key === "me")
  assert.deepEqual([me.items.length, admin.items.length], [3, 7], "我的 3 ∥ 管理 7（2026-10-10 代理回迁批 −1）")
  assert.deepEqual([admin.items.at(-1).key, admin.items.at(-1).path, admin.items.at(-1).labelKey], ["system", "/admin/system", "nav.page.admin.system"], "管理末项 = 系统")
  assert.deepEqual(NAV.resolveRoute("/admin/proxy", "admin"), { path: "/admin/system", redirect: true }, "旧链 ⇒ 重定向系统页（旧书签可达）")
  assert.deepEqual(NAV.resolveRoute("/admin/system", "user"), { path: "/admin/system", denied: true }, "user ⇒ denied 块")
  const appSrc = readFileSync(join(PUBLIC_DIR, "app.mjs"), "utf8")
  assert.equal(appSrc.includes("views-proxy.mjs"), false, "import 退场")
  assert.equal(appSrc.includes('\"/admin/proxy\"'), false, "PAGES 行退场")
})

/** 本批键族（§2.2 键族登记——两表逐键同步；2026-10-10 代理回迁批：页标题/卡题/nav 三键退役 ⇒ 15 键在册）。 */
const PROXY_NEW_KEYS = [
  "proxy.uriLabel", "proxy.uriPh", "proxy.hint",
  "proxy.testTitle", "proxy.testHint", "proxy.targetLabel", "proxy.targetPh", "proxy.testBtn", "proxy.testing",
  "proxy.testOk", "proxy.testFail", "proxy.uriRequired", "proxy.targetRequired", "proxy.kind.timeout", "proxy.kind.unreachable",
]
const PROXY_DEAD_KEYS = ["nav.page.admin.proxy", "proxy.title", "proxy.settingsTitle"]
const F_CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
const fPlaceholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",")
const fBaseKeys = (table) => Object.keys(table).filter((key) => !key.startsWith("lang.")).map((key) => key.replace(/\.one$/, ""))

test("C4 i18n：15 键两表在位（18 − 回迁退役 3）∥ 占位对位 ∥ en 零 CJK ∥ 退役 3 键零残留 ∥ useProxy 逐值改 ∥ 基键集相等", () => {
  assert.equal(PROXY_NEW_KEYS.length, 15, "在册新键计数 = 15（18 − 回迁退役 3）")
  for (const key of PROXY_NEW_KEYS) {
    assert.ok(key in ZH, `zh 表缺新键：${key}`)
    assert.ok(key in EN, `en 表缺新键：${key}`)
    assert.ok(String(ZH[key]).trim() !== "" && String(EN[key]).trim() !== "", `空值键：${key}`)
    assert.equal(fPlaceholders(ZH[key]), fPlaceholders(EN[key]), `占位符不一致：${key}`)
    assert.equal(F_CJK.test(EN[key]), false, `en 新键含 CJK：${key}`)
  }
  assert.deepEqual([ZH["proxy.uriPh"], EN["proxy.uriPh"]], ["http://host:port（留空 = 不启用）", "http://host:port (empty = disabled)"], "uriPh 评估值 = 设计文案逐字")
  // 占位示例须是合法目标形（防「示例即错例」回潮——裸主机名填进去 = 服务端 400）
  for (const table of [ZH, EN]) {
    const example = String(table["proxy.targetPh"]).match(/http\(s\):\/\/\S+/)?.[0] ?? ""
    assert.ok(example !== "", `targetPh 未携合法示例：${table["proxy.targetPh"]}`)
    assert.ok(["http:", "https:"].includes(new URL(example.replace("(s)", "")).protocol), `targetPh 示例须可解析为目标 URL：${example}`)
  }
  for (const dead of ["system.cfgProxyUri", "system.cfgProxyUriPh", ...PROXY_DEAD_KEYS]) {
    assert.equal(dead in ZH, false, `zh 退役键零残留：${dead}`)
    assert.equal(dead in EN, false, `en 退役键零残留：${dead}`)
  }
  assert.ok(ZH["admin.providers.useProxy"].includes("「系统」页"), `useProxy 改向（zh）：${ZH["admin.providers.useProxy"]}`)
  assert.ok(EN["admin.providers.useProxy"].includes("System page"), `useProxy 改向（en）：${EN["admin.providers.useProxy"]}`)
  assert.deepEqual(fBaseKeys(EN).filter((key) => !(key in ZH)), [], "en 基键 ⊆ zh 基键")
  assert.deepEqual(fBaseKeys(ZH).filter((key) => !(key in EN)), [], "zh 基键 ⊆ en 基键（键集口径不破）")
})

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

test("C5 静态面：views-proxy.mjs 退役（零残）∥ `public/**` 零外部引用 ∥ 本批两档注释外零 CJK ∥ t() 字面量 ⊆ 表键", async () => {
  const names = readdirSync(PUBLIC_DIR)
  assert.equal(names.includes("views-proxy.mjs"), false, "退役档零残留：views-proxy.mjs")
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    // 裸文本扫描（族内既有断言口径）；i18n 表族内 `\/` 转义 = 承重（`proxy.uriPh` 行注）——「清理转义」会在此处静默转红
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  for (const name of ["views-system-config.mjs", "views-system.mjs"]) {
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
