/**
 * 2026-10-06-console-provider-redo-runtime.test.mjs — thincoder-server 批内单测件（Provider 管理面重做·运行面腿 ⑤–⑦；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。2026-10-07 拆档（越 500 硬线前拆分——静态面腿 ①–④ 留守 `-console-provider-redo` 件）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-console-provider-redo-runtime.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §6 AC-18 行 + 本批档 §2 腿①–⑦；腿③④以 §2 修正块为准）：
 *   ⑤ 写路径：PATCH `models` = 勾选集（全量数组）∥ 零变更 ⇒ 直接关窗 ∥ 清除密钥 ⇒ `apiKey:""` ∥
 *      测试连接 = discover 复用（`providerId` 取库内 key）∥ 删除（confirm）∥ confirm 拒 ⇒ 零请求
 *   ⑥ 热生效链：PATCH `models`（详情弹窗保存形）⇒ `/v1/models` 随动（内存库——真网关 API 级复跑）
 *   ⑦ 静态面：档目 31 ∥ 32 ∥ 零外链 ∥ 两表键集/占位符/en 零 CJK ∥ 键引用闭合 ∥ 旧内联键退役（零「手填」残留）∥
 *      两档静态直发
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)
const loadAt = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const [{ ZH }, { EN }, MODALS] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("views-providers-modals.mjs"),
])
// ⑥ 热生效链（内存库——真网关）所需服务端件
const DB = await loadAt("thincoder-server/src/store/db.mjs")
const CONFIG = await loadAt("thincoder-server/src/ops/config.mjs")
const SERVER = await loadAt("thincoder-server/src/gateway/server.mjs")
const GATEWAY = await loadAt("thincoder-server/src/gateway/routes.mjs")
const PROVIDER_ADMIN = await loadAt("thincoder-server/src/gateway/provider-admin.mjs")
const MEMBERS = await loadAt("thincoder-server/src/accounts/members.mjs")
const KEYS = await loadAt("thincoder-server/src/accounts/keys.mjs")
const SESSION = await loadAt("thincoder-server/src/accounts/session.mjs")
const ACCOUNT_ROUTES = await loadAt("thincoder-server/src/accounts/routes.mjs")
const ADMIN_ROUTES = await loadAt("thincoder-server/src/accounts/routes-admin.mjs")
const METERING_ROUTES = await loadAt("thincoder-server/src/metering/routes.mjs")
const STATIC = await loadAt("thincoder-server/src/webui/static.mjs")

/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
/** 自称名族（仅 zh 表载体——切换器固定取 zh 表）。 */
const SELF_NAMES = ["lang.zh", "lang.en"]
/** 本批新键（§2.2 键族——两表逐键同步）。 */
const NEW_KEYS = [
  "admin.providers.add", "admin.providers.addTitle", "admin.providers.customChoice", "admin.providers.colModelCount",
  "admin.providers.fetchModels", "admin.providers.refreshCandidates", "admin.providers.candidatesEmpty", "admin.providers.retiredNote",
]
/** 旧内联面退役键（零「手填」残留——两表皆不得在册）。 */
const RETIRED_KEYS = [
  "admin.providers.modelLabel", "admin.providers.modelPh", "admin.providers.addModel", "admin.providers.checklistEmpty",
  "admin.providers.formNew", "admin.providers.formEdit", "admin.providers.save", "admin.providers.saveEdit", "admin.providers.cancel",
  "admin.providers.discover", "admin.providers.presetTitle", "admin.providers.presetLoad", "admin.providers.presetLoaded",
  "admin.providers.presetHint", "admin.providers.listTitle", "admin.providers.colModels", "admin.providers.modelsEmpty", "admin.providers.edit",
]
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── 桩 DOM（`modal.mjs` 壳面近形：showModal/close 事件/classList/remove；`h` 同 app 语义近似）──────────

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
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
/** 候选勾选钮（双弹窗共用形：`label[复选框, 模型名]`；`key-clear` 勾不计）。 */
const pickBoxes = (root) => findAll(root, (node) => node.tag === "input" && node.attrs.type === "checkbox" && node.parent?.tag === "label" && node.parent.className !== "key-clear")
const pickBox = (root, model) => pickBoxes(root).find((box) => box.parent.children.includes(model)) ?? null

/** 桩 ctx：api 路由表（`"METHOD path"` ⇒ handler——抛 = 失败径）∥ fail/flash 记录 ∥ 全调用入 `calls`。 */
function makeCtx(routes = {}) {
  const calls = []
  const ctx = {
    h,
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

// ── ⑤ 写路径（PATCH/POST/DELETE——保存与删除）───────────────────────────────

test("⑤ 写路径：PATCH `models` = 勾选集（全量数组）∥ 零变更 ⇒ 直接关窗 ∥ 清除密钥 ⇒ `apiKey:\"\"` ∥ 测试连接/删除", async () => {
  globalThis.document = createDocument()
  globalThis.window = { confirm: () => true }
  try {
    const provider = { id: 5, name: "p5", baseURL: "http://x/v1", apiKey: "…9999", models: ["a"] }
    const { ctx, calls } = makeCtx({
      "POST /api/admin/providers/discover": () => ({ models: ["a", "b", "c"] }),
      "PATCH /api/admin/providers/5": () => ({ ok: true, id: 5 }),
      "DELETE /api/admin/providers/5": () => ({ ok: true, id: 5 }),
    })
    // 勾选变更 ⇒ PATCH（`models` 全量数组——新增并入）
    const modal = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const boxB = pickBox(modal.root, "b")
    boxB.checked = true
    await boxB.fire("change")
    await byText(modal.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/5", { models: ["a", "b"] }])
    assert.ok(calls.some(([kind, value]) => kind === "flash" && value === ZH["admin.providers.saved"]))
    // 退役项恒保留（不在发现列表的已开放模型——不触碰、提交恒含）
    const retiredProvider = { id: 6, name: "p6", baseURL: "http://x/v1", apiKey: "", models: ["a", "retired-9"] }
    const keepCtx = makeCtx({
      "POST /api/admin/providers/discover": () => ({ models: ["a", "b"] }),
      "PATCH /api/admin/providers/6": () => ({ ok: true, id: 6 }),
    })
    const keep = MODALS.openProviderDetailModal(keepCtx.ctx, { provider: retiredProvider, reload: async () => {} })
    await tick()
    assert.ok(textOf(keep.root).includes(fill(ZH["admin.providers.retiredNote"], { models: "retired-9" })), "退役注行")
    const keepBox = pickBox(keep.root, "b")
    keepBox.checked = true
    await keepBox.fire("change")
    await byText(keep.root, ZH["common.save"]).fire("click")
    assert.deepEqual(keepCtx.calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/6", { models: ["a", "retired-9", "b"] }], "退役项恒保留（不触碰 ⇒ 提交恒含）")
    // 勾选变更（现配置项出列 + 新项并入）⇒ PATCH = 勾选集
    const modal2 = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const boxA = pickBox(modal2.root, "a")
    boxA.checked = false
    await boxA.fire("change")
    const boxB2 = pickBox(modal2.root, "b")
    boxB2.checked = true
    await boxB2.fire("change")
    const boxC = pickBox(modal2.root, "c")
    boxC.checked = true
    await boxC.fire("change")
    await byText(modal2.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/5", { models: ["b", "c"] }])
    // 零变更 ⇒ 直接关窗（零请求）
    const modal3 = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const before3 = calls.length
    await byText(modal3.root, ZH["common.save"]).fire("click")
    assert.deepEqual([modal3.root.open, calls.length - before3], [false, 0], "零变更 ⇒ 直接关窗")
    // 清除密钥 ⇒ `apiKey:""`（留空 = 不修改的另一面）
    const modal4 = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const clearBox = findNode(modal4.root, (node) => node.tag === "input" && node.parent?.className === "key-clear")
    clearBox.checked = true
    await clearBox.fire("change")
    await byText(modal4.root, ZH["common.save"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "PATCH").at(-1), ["PATCH", "/api/admin/providers/5", { apiKey: "" }])
    // 测试连接（同窗 = discover 复用——providerId 取库内 key）+ 删除（confirm ⇒ DELETE）
    const modal5 = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const before5 = calls.length
    await byText(modal5.root, ZH["admin.providers.test"]).fire("click")
    const testCalls = calls.slice(before5)
    assert.deepEqual(testCalls.filter(([kind]) => kind === "POST").at(-1), ["POST", "/api/admin/providers/discover", { baseURL: "http://x/v1", providerId: 5, proxy: false }])
    assert.ok(textOf(modal5.root).includes(fill(ZH["admin.providers.testOk"], { name: "p5", count: 3 })), "测试连接 ⇒ 同窗结果行（AC-18「测试同窗」——2026-10-07 随正）")
    assert.ok(!testCalls.some(([kind, value]) => kind === "flash" && value === fill(ZH["admin.providers.testOk"], { name: "p5", count: 3 })), "结果不再走弹窗外 flash")
    await byText(modal5.root, ZH["admin.providers.delete"]).fire("click")
    assert.deepEqual(calls.filter(([kind]) => kind === "DELETE").at(-1), ["DELETE", "/api/admin/providers/5", null])
    assert.equal(modal5.root.open, false, "删除 ⇒ 关窗 + 列表刷新")
    // confirm 拒 ⇒ 零请求（弹窗留驻）
    globalThis.window.confirm = () => false
    const modal6 = MODALS.openProviderDetailModal(ctx, { provider, reload: async () => {} })
    await tick()
    const before6 = calls.length
    await byText(modal6.root, ZH["admin.providers.delete"]).fire("click")
    assert.deepEqual([calls.length - before6, modal6.root.open], [0, true])
  } finally { delete globalThis.window; delete globalThis.document }
})

// ── ⑥ 热生效链（内存库——真网关）────────────────────────────────────────────

test("⑥ 热生效链：PATCH `models`（详情弹窗保存形）⇒ `/v1/models` 随动（零重启）", async () => {
  const db = DB.openDatabase(":memory:")
  const { member } = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: "password-123" })
  const key = KEYS.issueKey(db, member.id)
  const config = CONFIG.validateConfig({ host: "127.0.0.1", providers: [], embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" } })
  const routes = SERVER.createRouteTable()
  const log = { info: () => {}, warn: () => {}, error: () => {} }
  const runtime = GATEWAY.registerGatewayRoutes(routes, { db, config, log, env: {} })
  PROVIDER_ADMIN.registerProviderAdminRoutes(routes, { db, config, runtime, log, env: {} })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log, staticSite: STATIC.createStaticSite() })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const base = `http://127.0.0.1:${server.address().port}`
  const call = async (method, path, { body, cookie, teamKey } = {}) => {
    const headers = { "content-type": "application/json" }
    if (cookie) headers.cookie = cookie
    if (teamKey) headers.authorization = `Bearer ${teamKey}`
    const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
    const text = await response.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
    return { status: response.status, json, setCookies: response.headers.getSetCookie?.() ?? [] }
  }
  try {
    const login = await call("POST", "/api/login", { body: { username: "admin", password: "password-123" } })
    const cookie = login.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`))?.split(";")[0]
    assert.ok(cookie, "admin 登录失败")
    const listModels = async () => (await call("GET", "/v1/models", { teamKey: key.plain })).json.data.map((model) => model.id)
    // 添加弹窗写形 = POST 全字段 ⇒ 清单立见（零重启）
    const added = await call("POST", "/api/admin/providers", { cookie, body: { name: "p1", baseURL: "http://127.0.0.1:9/v1", apiKey: "", models: ["a"] } })
    assert.equal(added.status, 200)
    assert.deepEqual(await listModels(), ["p1/a"])
    // 详情弹窗保存形 = PATCH `models` 全量数组 ⇒ `/v1/models` 随动（勾选集 = 服务集——同源链闭合）
    const patched = await call("PATCH", `/api/admin/providers/${added.json.id}`, { cookie, body: { models: ["b", "c"] } })
    assert.equal(patched.status, 200)
    assert.deepEqual(await listModels(), ["p1/b", "p1/c"])
    // 库面同拍（控制台列表数据源）
    const list = await call("GET", "/api/admin/providers", { cookie })
    assert.deepEqual(list.json.providers[0].models, ["b", "c"])
  } finally {
    server.closeAllConnections?.()
    await new Promise((resolve) => server.close(resolve))
    db.close()
  }
})

// ── ⑦ 静态面（档目 ∥ 两表 ∥ 键引用闭合 ∥ 退役键 ∥ 直发）─────────────────────

test("⑦ 静态面：档目 31 ∥ 32 ∥ 零外链 ∥ 两表键集/占位符/en 零 CJK ∥ 键引用闭合 ∥ 退役键删净 ∥ 两档直发", async () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [32, 31], "全目录 32 ∥ UI 代码档 31")
  assert.deepEqual(names, [
    "app.mjs", "dom.mjs", "favicon.png", "health.mjs", "i18n-en-admin.mjs", "i18n-en-me.mjs", "i18n-en-shell.mjs", "i18n-en-system.mjs", "i18n-en.mjs", "i18n-zh-admin.mjs",
    "i18n-zh-me.mjs", "i18n-zh-shell.mjs", "i18n-zh-system.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css",
    "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-proxy.mjs", "views-system-config.mjs", "views-system.mjs", "views-usage.mjs",
  ])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  // 两表基键集双向相等（除自称名族 + `.one` 变体族——KD-SV-44）∥ en 零 CJK ∥ 占位符逐键一致 ∥ 全键非空
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one")) // 变体族 = 仅 en 表载体
  for (const key of zhKeys.filter((key) => !SELF_NAMES.includes(key))) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  for (const key of enBase) {
    assert.ok(key in ZH, `en 表多出键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.equal(zhKeys.length - SELF_NAMES.length, enBase.length)
  for (const key of NEW_KEYS) assert.ok(key in ZH && key in EN, `本批新键缺位：${key}`)
  for (const key of RETIRED_KEYS) assert.ok(!(key in ZH) && !(key in EN), `旧内联面键未退役：${key}`)
  assert.ok(!Object.values(ZH).some((value) => value.includes("手填")), "「手填」残留（用户 21:36 裁定——零手填）")
  // 键引用闭合：`t("…")` 字面量 ⊆ 表键（全档扫面）∥ 两新档裸键字面量 ⊆ 表键
  const refs = []
  for (const name of names.filter((name) => name.endsWith(".mjs") && !name.startsWith("i18n-zh") && !name.startsWith("i18n-en"))) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 200, `键引用过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  for (const name of ["views-providers.mjs", "views-providers-modals.mjs"]) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/["']([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)["']/g)) {
      assert.ok(match[1] in ZH && match[1] in EN, `${name} 裸键字面量悬空：${match[1]}`)
    }
  }
  // 两档静态直发（200 ∥ text/javascript ∥ 字节 = 磁盘——真 static.mjs 句柄）
  const site = (await loadAt("thincoder-server/src/webui/static.mjs")).createStaticSite()
  const server = createServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    for (const name of ["views-providers.mjs", "views-providers-modals.mjs"]) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.deepEqual([response.status, (await response.text()) === readFileSync(join(PUBLIC_DIR, name), "utf8")], [200, true], name)
      assert.match(response.headers.get("content-type"), /text\/javascript/, name)
    }
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})
