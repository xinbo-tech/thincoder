/**
 * 2026-10-10-server-small-fixes.test.mjs — thincoder-server 批内单测件（server 面小修/清账批——9 条；名随批档 ·
 * 住 `docs/batches/` · 不入仓套件 · 随批留存；同批拆档双件——代理三腿 = `-proxy.test.mjs`）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-small-fixes.test.mjs`
 *
 * 射程（判据源 = 批档 §2；腿 ↔ 判据在括号）：
 *   腿 A（#1025 术语值面 = §2 2.1 表）：14 键 × 两语逐字 ∥ 交叉一致（`system.accessHint` ⊃ nav 键值）∥
 *     旧形扫描（zh 14 值零「密钥」∧ 零裸小写 `key`）∥ 零触已合规面（me.keys 族两语含统一形）∥ 键数 386 ∥ 391（本批值改零变；后随 2026-10-10 代理回迁批 −3 键）
 *   腿 B（#1056 statCard 去重 = §2 2.2）：`views-usage.mjs` 零 `function statCard` ∧ import 单源 ∧ 单源签名冻结 ∥
 *     桩 DOM：两卡 `section.card > .stat-label + .stat-value` 逐值（DOM 保形——修前逐字）
 *   腿 C（#1146 有界流式读 = §2 2.4）：假引擎（非 2xx + 32MiB 体 + 字节计数）⇒ 写法有界（≤ 读帽 + 容差 ∧ 非整段）
 *     ∧ 摘录逐字（`trim` + 首 200 字符）∥ `body` 缺失替身 ⇒ 回落 `text()`（现行为）∥ 计时/写面读数在册（diagnostic）
 *   腿 D（#1057② me 页 `from=` 行为腿）：桩 api 断言请求 URL 含 `from=` 且值 = 窗换算（钉钟——本地正午基准；行为面，不钉源码形）
 *   腿 E（链自检）：`prepublishOnly` 含本批两件（`includes` 形——件数断言 = 门禁七件随正面，跨批）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const readPublic = (name) => readFileSync(join(PUBLIC_DIR, name), "utf8")
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const { ZH } = await load("thincoder-server/public/i18n-zh.mjs")
const { EN } = await load("thincoder-server/public/i18n-en.mjs")
const USAGE_VIEW = await load("thincoder-server/public/views-usage.mjs")
const ME_VIEW = await load("thincoder-server/public/views-me.mjs")
const EMBEDDING_ADMIN = await load("thincoder-server/src/gateway/embedding-admin.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")

const PASSWORD = "password-123"
const BATCH_FILES = [
  "docs/batches/2026-10-10-server-small-fixes.test.mjs",
  "docs/batches/2026-10-10-server-small-fixes-proxy.test.mjs",
]
const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

// ── 腿 A（#1025 术语值面——14 键 × 两语逐字 = §2 2.1 表）───────────────────────

/** 14 键 × 两语期望值（逐字 = 批 §2 2.1 表；zh 保留英文原形「API Key」∥ en = "API key"；末两键 = 面内补全 ∥ 末键 = 枚举外延——`system.teamKey`，父侧 2026-10-10 本刻裁定：同实体不留半清）。 */
const TERMS = [
  ["nav.page.me.keys", "API Key 与签发", "API keys & issuing"],
  ["me.keys.title", "我的 API Key", "My API keys"],
  ["me.keys.secretLabel", "新 API Key（明文）", "New API key (plaintext)"],
  ["admin.members.tableTitle", "成员表（API Key 清单——吊销在行内）", "Members (API keys listed inline with revoke)"],
  ["admin.members.colKeys", "API Key 清单", "API keys"],
  ["admin.members.colKeyCount", "API Key 数", "API keys"],
  ["admin.members.colKey", "API Key", "API key"],
  ["audit.type.key_issue", "API Key 签发", "API key issued"],
  ["audit.type.key_revoke", "API Key 吊销", "API key revoked"],
  ["audit.type.key_rotate", "API Key 轮换", "API key rotated"],
  ["system.accessHint", "成员在各自端点新增一个渠道（provider），四项照下述填写；API Key 由本人在「我的 → API Key 与签发」自助签发（sk-tc-… 形，仅创建时显示一次）。", "Each member adds a provider in their own client using the four fields below; API keys are self-issued under “My → API keys & issuing” (sk-tc-… format, shown only once)."],
  ["audit.keyHint", "API Key", "API key"],
  ["usage.col.key", "API Key", "API key"],
  ["system.teamKey", "团队 API Key", "Team API key"],
]

test("腿 A 术语值面：14 键 × 两语逐字 = 批 §2 2.1 表 ∥ 键集（386 ∥ 391——2026-10-10 代理回迁批 −3 键）", () => {
  assert.equal(TERMS.length, 14, "14 键面")
  for (const [key, zh, en] of TERMS) {
    assert.equal(ZH[key], zh, `zh 值不符：${key}`)
    assert.equal(EN[key], en, `en 值不符：${key}`)
  }
  assert.equal(Object.keys(ZH).length, 386, "zh 键数 386（本批值改零变；后随代理回迁批 −3 键）")
  assert.equal(Object.keys(EN).length, 391, "en 键数 391（含 `.one` 变体族；后随代理回迁批 −3 键）")
})

test("腿 A 交叉一致 ∥ 旧形扫描（14 键 zh）∥ 零触已合规面（me.keys 族）", () => {
  // ① 交叉一致：接入卡 hint 内嵌 nav 值（同拍——两面同源）
  assert.ok(ZH["system.accessHint"].includes(ZH["nav.page.me.keys"]), "zh：accessHint 内嵌 nav 值")
  assert.ok(EN["system.accessHint"].includes(EN["nav.page.me.keys"]), "en：accessHint 内嵌 nav 值")
  // ② 旧形扫描（14 键 zh 值）：零「密钥」∧ 零裸小写 key（「API Key」的 K 大写——不命中）
  for (const [key, zh] of TERMS) {
    assert.equal(zh.includes("密钥"), false, `zh 值残旧形「密钥」：${key}`)
    assert.equal(/(?<![A-Za-z])key(?![A-Za-z])/.test(zh), false, `zh 值残裸小写 key：${key}`)
  }
  // ③ 零触已合规面（me.keys 族——本批零改；两语含统一形。注：`me.keys.accessTitle` = 「接入指南」——题面零词位（非「密钥」形），不入本扫描）
  for (const key of ["me.keys.listTitle", "me.keys.colKey", "me.keys.issue", "me.keys.issueTitle", "me.keys.revokeTitle", "me.keys.empty", "me.keys.accessHint", "me.keys.accessKeyRow"]) {
    assert.ok(ZH[key].includes("API Key"), `已合规面破（zh）：${key}`)
    assert.ok(EN[key].includes("API key"), `已合规面破（en）：${key}`)
  }
})

// ── 桩 DOM 夹具（腿 B / 腿 D 共用——app 助手语义近似）─────────────────────────

class FakeNode {}
function makeNode(tag) {
  const classes = new Set()
  const node = new FakeNode()
  Object.assign(node, { tag, children: [], listeners: {}, attrs: {}, parent: null, hidden: false, textContent: "", className: "", value: "" })
  node.classList = { add: (name) => classes.add(name), remove: (name) => classes.delete(name), contains: (name) => classes.has(name) }
  node.append = (...items) => {
    for (const item of items.flat(Infinity)) {
      if (item === null || item === undefined || item === false) continue
      if (typeof item === "object") item.parent = node
      node.children.push(item)
    }
  }
  node.replaceChildren = (...items) => { node.children = []; node.append(...items) }
  node.addEventListener = (type, fn) => { (node.listeners[type] ??= []).push(fn) }
  node.setAttribute = (name, value) => { node.attrs[name] = String(value) }
  node.fire = (type, event = {}) => Promise.all((node.listeners[type] ?? []).map((fn) => fn({ preventDefault() {}, ...event })))
  return node
}

/** `h`（app.mjs 语义近似）：class ∥ text ∥ on 前缀事件 ∥ 受控属性 ∥ 其余 setAttribute + 子节点（数组拍平）。 */
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

const fill = (text, params) => String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

/** 页桩 ctx（真视图函数直驱——取数面注入；`table`/`usageTable`/`dataShell` 同 app 助手语义近似）。 */
function viewCtx({ routes, state = {} }) {
  const calls = []
  const shell = { last: null }
  const ctx = {
    h,
    api: async (path, { method = "GET", body } = {}) => {
      calls.push([method, path, body ?? null])
      const handler = routes[`${method} ${String(path).split("?")[0]}`]
      if (handler === undefined) throw new Error(`unexpected ${method} ${path}`)
      return handler(path)
    },
    fail: (error) => calls.push(["fail", error?.message ?? String(error)]),
    flash: (message) => calls.push(["flash", message]),
    state,
    fmtValue: (value) => (value === null || value === undefined ? "—" : String(value)),
    fmtTs: (ts) => String(ts),
    fmtModelQuotas: (quotas) => {
      const count = Object.keys(quotas ?? {}).length
      return count === 0 ? ZH["common.quotaByPlatform"] : fill(ZH["common.modelQuotaCount"], { count })
    },
    table: (headers, rows) => h("div", { class: "table-wrap" },
      h("table", {},
        h("thead", {}, h("tr", {}, ...headers.map((label) => h("th", { text: label })))),
        h("tbody", {}, ...rows.map((cells) => h("tr", {}, ...cells.map((cell) => h("td", {}, ...(Array.isArray(cell) ? cell : [cell])))))))),
    usageTable: (rows, { foot = false } = {}) => (rows.length === 0
      ? h("p", { class: "hint", text: ZH["usage.empty"] })
      : h("div", { class: "table-wrap" }, h("table", {}, h("tbody", {}, ...rows.map((row) => h("tr", {}, h("td", { text: String(row.ts ?? "") }))))))),
    dataShell: (mount, { head, area }) => {
      shell.last = { head, area }
      mount.append(h("div", { class: "page-head" }, head), h("div", { class: "page-area" }, area))
    },
  }
  return { ctx, calls, shell }
}

const SUMMARY = { totals: { requests: 3, totalTokens: 46 }, trend: [], byModel: [], byMember: [] }
const MEMBER = { name: "alice", username: "alice", role: "user", usedTokens: 46, modelQuotas: {}, modelUsage: {} }

// ── 腿 B（#1056 statCard 去重——§2 2.2）───────────────────────────────────────

test("腿 B 去重面：`views-usage.mjs` 零 `function statCard` ∧ import 单源 ∧ 单源签名冻结", () => {
  const usageSrc = readPublic("views-usage.mjs")
  assert.equal(/^(export )?function statCard\(/m.test(usageSrc), false, "本地 `statCard` 件未删净")
  assert.ok(usageSrc.includes('import { statCard } from "./views-overview.mjs"'), "缺单源 import（overview 件）")
  assert.match(readPublic("views-overview.mjs"), /export function statCard\(h, label, \.\.\.content\)/, "单源签名冻结（变参形）")
})

test("腿 B 桩 DOM：两卡 `section.card > .stat-label + .stat-value` 逐值（DOM 保形——修前逐字）", async () => {
  const { ctx } = viewCtx({
    routes: { "GET /api/usage/summary": () => SUMMARY, "GET /api/usage": () => ({ rows: [] }) },
    state: {},
  })
  const mount = makeNode("section")
  await USAGE_VIEW.renderAdminUsage(ctx, mount)
  const labels = findAll(mount, (node) => node.className === "stat-label")
  const values = findAll(mount, (node) => node.className === "stat-value")
  assert.deepEqual(labels.map((node) => node.textContent), [ZH["usageReport.requests"], ZH["usageReport.tokens"]], "两卡标签逐值")
  assert.deepEqual(values.map((node) => node.textContent), ["3", "46"], "两卡数值逐值（概览卡行为零漂）")
  for (const label of labels) {
    const card = label.parent
    assert.deepEqual([card.tag, card.className], ["section", "card"], "卡形 = section.card")
    assert.deepEqual(card.children.map((child) => child.className), ["stat-label", "stat-value"], "卡内序 = 标签 + 值（DOM 保形）")
  }
})

// ── 腿 C（#1146 有界流式读——§2 2.4）─────────────────────────────────────────

/** 写帽容差（字节——批内实测轮定值：写面 = 内核/流缓冲可吸纳量）。
 *  实测读数（3 轮——8MiB ∥ 8MiB ∥ 32MiB 体量）：`writtenBytes` = **2,425,148 B**（三轮同值——确定性；= 写缓冲容量）∥
 *  客户端拆连 `closed` = 三轮均 true（取消后 9–25ms）⇒ 体量取 32MiB（远大于容差——判别力在「非整段」）。
 *  取数依据与三轮读数入批档 §5；设计中位值（8192 + 64KiB）与引擎侧实测不符——按设计授权改实测值。 */
const WRITE_TOLERANCE_BYTES = 8 * 1024 * 1024
/** 假引擎体量（32MiB——远大于容差：读整段即越界）。 */
const BODY_BYTES = 32 * 1024 * 1024
/** 有界写断言上界 = 读帽 + 容差（读帽 = 件内导出常量——8192）。 */
const WRITE_BOUND_BYTES = EMBEDDING_ADMIN.EMBEDDING_EXCERPT_READ_CAP + WRITE_TOLERANCE_BYTES

/** 假引擎（http——非 2xx + 大体分块写 + 字节计数）：`state.writtenBytes` = 交给响应流的字节（客户端拆连即止）。 */
async function startBigEngine({ totalBytes = BODY_BYTES, chunkSize = 64 * 1024, status = 500, head = "" } = {}) {
  const state = { writtenBytes: 0, closed: false }
  let resolveClosed = () => {}
  const closed = new Promise((resolve) => { resolveClosed = resolve })
  const server = createServer((req, res) => {
    req.resume()
    res.on("error", () => {})
    res.on("close", () => { state.closed = true; resolveClosed(true) })
    res.writeHead(status, { "content-type": "text/plain", "content-length": String(totalBytes) })
    const headBuf = Buffer.from(head, "utf8")
    state.writtenBytes += headBuf.length
    res.write(headBuf)
    const filler = Buffer.alloc(chunkSize, 0x61)
    const pump = () => {
      while (!state.closed && !res.destroyed && state.writtenBytes < totalBytes) {
        state.writtenBytes += filler.length
        if (!res.write(filler)) { res.once("drain", pump); return }
      }
    }
    pump()
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    state,
    closed,
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

/** 进程内网关 + 账号面 + 向量面（`fetchImpl` 可注入——替身面腿）。 */
async function startAdminApp({ config, fetchImpl = undefined }) {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const routes = SERVER.createRouteTable()
  EMBEDDING_ADMIN.registerEmbeddingAdminRoutes(routes, { db, config, log: null, ...(fetchImpl ? { fetchImpl } : {}) })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = await call(base, "POST", "/api/login", { body: { username: "admin", password: PASSWORD } })
  const cookieLine = login.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
  return {
    db,
    base,
    cookie: cookieLine ? cookieLine.split(";")[0] : null,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); db.close() },
  }
}

test("腿 C 有界读：假引擎（非 2xx + 32MiB + 字节计数）⇒ 写法有界（≤ 读帽 + 容差 ∧ 非整段）∧ 摘录逐字 ∧ 连接即还", { timeout: 30_000 }, async (t) => {
  const HEAD = "\n  ENGINE-BOOM-" + "x".repeat(300) + "\n" // 首段 = 摘录源（>200 字符 ⇒ slice 生效；纯 ASCII）
  const engine = await startBigEngine({ head: HEAD })
  const app = await startAdminApp({ config: CONFIG.validateConfig({ host: "127.0.0.1", embedding: { baseURL: `${engine.base}/v1`, model: "bge-m3" } }) })
  try {
    const started = Date.now()
    const res = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: app.cookie, body: { text: "hi" } })
    const elapsed = Date.now() - started
    assert.deepEqual([res.status, res.json.ok, res.json.error.kind], [200, false, "http_error"])
    assert.equal(res.json.error.message, `引擎返回 HTTP 500：${HEAD.trim().slice(0, 200)}`, "摘录逐字（trim + 首 200 字符）")
    await Promise.race([engine.closed, tick(1500)]) // 写面停（客户端取消读 ⇒ 拆连）——真钟等待
    t.diagnostic(`[腿 C] writtenBytes=${engine.state.writtenBytes} ≤ 上界 ${WRITE_BOUND_BYTES}（读帽 ${EMBEDDING_ADMIN.EMBEDDING_EXCERPT_READ_CAP} + 容差 ${WRITE_TOLERANCE_BYTES}）；closed=${engine.state.closed}；ms=${res.json.ms}；钟面 ${elapsed}ms；体量 ${BODY_BYTES}`)
    assert.ok(engine.state.writtenBytes <= WRITE_BOUND_BYTES, `写法越界：writtenBytes=${engine.state.writtenBytes} > ${WRITE_BOUND_BYTES}`)
    assert.ok(engine.state.writtenBytes < BODY_BYTES, `非整段写（有界——未整段缓冲）：writtenBytes=${engine.state.writtenBytes} ≮ ${BODY_BYTES}`)
    assert.equal(engine.state.closed, true, "余量不读 ⇒ 连接即还（客户端取消 ⇒ 引擎侧观测拆连）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("腿 C 替身面回落：`body` 缺失（判据替身）⇒ `text()` 现行为（trim + 首 200 字符）", async () => {
  const doubleText = "  DOUBLE-BOOM-" + "y".repeat(300) + "  "
  const double = { ok: false, status: 502, text: async () => doubleText } // 无 body（替身形——回落面）
  const app = await startAdminApp({
    config: CONFIG.validateConfig({ host: "127.0.0.1", embedding: { baseURL: "http://engine.invalid/v1", model: "bge-m3" } }),
    fetchImpl: async () => double,
  })
  try {
    const res = await call(app.base, "POST", "/api/admin/embedding/test", { cookie: app.cookie, body: { text: "hi" } })
    assert.deepEqual([res.status, res.json.ok, res.json.error.kind], [200, false, "http_error"])
    assert.equal(res.json.error.message, `引擎返回 HTTP 502：${doubleText.trim().slice(0, 200)}`, "替身面回落（现行为零回归——有界性降级仅替身面）")
  } finally {
    await app.close()
  }
})

// ── 腿 D（#1057② me 页 `from=` 行为腿）───────────────────────────────────────

test("腿 D me 页 `from=`：请求 URL 含 `from=` 且值 = 窗换算（钉钟——本地正午基准 ∥ 两读同参）", async (t) => {
  const PINNED = new Date(2026, 5, 15, 12, 0, 0, 0).getTime() // 钉钟（本地正午中点日——窗换算与视图同钟，跳零点零抖）
  t.mock.timers.enable({ apis: ["Date"], now: PINNED })
  const { ctx, calls } = viewCtx({
    routes: { "GET /api/me/usage/summary": () => SUMMARY, "GET /api/me/usage": () => ({ rows: [] }) },
    state: { member: MEMBER },
  })
  const mount = makeNode("section")
  await ME_VIEW.renderMeUsage(ctx, mount)
  const urls = calls.filter(([method]) => method === "GET").map(([, path]) => new URL(String(path), "http://console.test"))
  const summaryUrl = urls.find((url) => url.pathname === "/api/me/usage/summary")
  const detailUrl = urls.find((url) => url.pathname === "/api/me/usage")
  assert.ok(summaryUrl?.searchParams.has("from"), "summary 请求缺 `from=`")
  assert.ok(detailUrl?.searchParams.has("from"), "明细请求缺 `from=`（同参）")
  const dayStart = (offset) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime() }
  assert.equal(dayStart(0), new Date(PINNED).setHours(0, 0, 0, 0), "钉钟在效（视图与断言同钟）")
  assert.equal(Number(summaryUrl.searchParams.get("from")), dayStart(-29), "缺省 30 天窗 = 服务端缺省窗同构")
  assert.equal(detailUrl.searchParams.get("from"), summaryUrl.searchParams.get("from"), "两读同参（同过滤面）")
})

// ── 腿 E（链自检——本批两件入 `prepublishOnly`）──────────────────────────────

test("腿 E 链自检：`prepublishOnly` 含本批两件 ∥ 清单目标在盘（`includes` 形）", () => {
  const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  for (const file of BATCH_FILES) assert.ok(batchFiles.includes(file), `本批件应入列：${file}（现 ${batchFiles.length} 件）`)
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
