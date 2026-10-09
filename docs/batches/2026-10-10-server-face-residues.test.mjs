/**
 * 2026-10-10-server-face-residues.test.mjs — thincoder-server 批内单测件（server-face-residues 批 · 台账 #1161 +
 * 并入 #1162 ∥ #1169 ∥ #1170；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-face-residues.test.mjs`
 *
 * 射程（判据源 = 批档 §2）：
 *   A 腿（#1169——`specForDisplay` 纯函数直测）：命名空间兜底 = 取末段（最后一个 `/` 之后的段）重试前缀匹配一次——
 *     多段命中 ∥ 大小写变体同判 ∥ 回归四锚 ∥ 未知/非串 ⇒ `null` ∥ 认账翻转类（≥2 斜杠 ∧ 末段未收录 ⇒ `null`）∥
 *     守卫形（首字符 `/`——`slash > 0`）
 *   B 腿（#1161 报文——HTTP 直测两例）：`model-quotas` ∥ `model-disables` 缺键 ⇒ 400 `invalid_request_error`
 *     （报文 = 对外标识双形族三词在 ∥ 旧形 `"<provider/model>"` 不在）
 *   C 腿（#1161 注释面——源句扫描）：八坐标旧句片段 0 命中 ∥ 目标句片段在位（五源档）
 *   链自检：`prepublishOnly` 含本批件（`includes` 形——沿 `-models-config.test.mjs:262-270` 形）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const readSrc = (rel) => readFileSync(join(ROOT, rel), "utf8")

const SNAPSHOT = await load("thincoder-server/public/model-specs-snapshot.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const METERING_ROUTES = await load("thincoder-server/src/metering/routes.mjs")
const ADMIN_ROUTES = await load("thincoder-server/src/accounts/routes-admin.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const PKG = JSON.parse(readSrc("thincoder-server/package.json"))

const PASSWORD = "password-123"
const BATCH_FILE = "docs/batches/2026-10-10-server-face-residues.test.mjs"

// ── A 腿（#1169——`specForDisplay` 取末段）─────────────────────────────────────

test("A1 多段命名空间：`qwen/ZHIPU/GLM-5.3` 末段命中真规格（旧形双段失配 ⇒ `null`）", () => {
  assert.deepEqual(SNAPSHOT.specForDisplay("qwen/ZHIPU/GLM-5.3"), { context: 1_000_000, maxOutput: 128_000 })
})

test("A2 多段命名空间：末段带后缀 ⇒ 最长前缀命中（`GLM-5.3-FlashX`）", () => {
  assert.deepEqual(SNAPSHOT.specForDisplay("qwen/ZHIPU/GLM-5.3-FlashX"), { context: 1_000_000, maxOutput: 131_072, multimodal: true })
})

test("A3 大小写变体同判：全大写命名空间 + 混合大小写末段", () => {
  assert.deepEqual(SNAPSHOT.specForDisplay("QWEN/zhipu/Glm-5.3"), { context: 1_000_000, maxOutput: 128_000 })
})

test("A4 回归四锚（零改动）：裸名 ∥ 最长前缀 ∥ 位缺省 ∥ 单斜杠命名空间", () => {
  assert.deepEqual(SNAPSHOT.specForDisplay("deepseek-flash"), { context: 1_000_000, maxOutput: 384_000, multimodal: true })
  assert.deepEqual(SNAPSHOT.specForDisplay("k3-256k-x"), { context: 262_144, maxOutput: 131_072, multimodal: true }, "最长前缀优先（k3-256k 压 k3）")
  assert.deepEqual(SNAPSHOT.specForDisplay("hy3-preview"), { context: 256_000, maxOutput: 128_000 }, "未声明 multimodal ⇒ 位缺省")
  assert.deepEqual(SNAPSHOT.specForDisplay("zhipu/glm-5.3"), { context: 1_000_000, maxOutput: 128_000 }, "单斜杠 —— 末段取法与旧首段取法等价")
})

test("A5 未知 ∥ 非串 ⇒ `null`（零兜底——不套 DEFAULT_SPEC）", () => {
  assert.equal(SNAPSHOT.specForDisplay("a/b/no-such-model"), null, "多段未知")
  assert.equal(SNAPSHOT.specForDisplay(null), null, "非串归一等价空串")
  assert.equal(SNAPSHOT.specForDisplay(""), null, "空串")
})

test("A6 认账翻转类（#1169）：≥2 斜杠 ∧ 末段未收录 ⇒ `null`（旧形曾命中中段）", () => {
  assert.equal(SNAPSHOT.specForDisplay("x/glm-5.3/zzz"), null, "取末段后不再回看中段（行为翻转——已认账）")
})

test("A7 守卫形：`/glm-5.3`（首字符斜杠 —— 末段前空）⇒ `null`", () => {
  assert.equal(SNAPSHOT.specForDisplay("/glm-5.3"), null, "`slash > 0` 守卫保持")
})

// ── B 腿（#1161 报文——缺键 400 双形族）───────────────────────────────────────

/** 进程内服务（本腿两面注册：管理面 ∥ 计量面 —— 两缺陷端点的宿主；零 provider 允许态）。 */
async function startServer({ db }) {
  const routes = SERVER.createRouteTable()
  ADMIN_ROUTES.registerAdminRoutes(routes, { db })
  METERING_ROUTES.registerMeteringRoutes(routes, { db })
  const config = CONFIG.validateConfig({ host: "127.0.0.1" })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve) }),
  }
}

async function post(base, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method: "POST", headers, body: JSON.stringify(body ?? {}) })
  return { status: res.status, json: await res.json().catch(() => null) }
}

/** 成员 + 管理员会话（`createSession` 直建 —— `tc_session` cookie 头形）。 */
async function seedSession(db) {
  const { member: admin } = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const { member: target } = await MEMBERS.createMember(db, { username: "u1", role: "user", password: PASSWORD })
  const { token } = SESSION.createSession(db, admin.id)
  return { target, cookie: `${SESSION.SESSION_COOKIE}=${token}` }
}

const FOREIGN_WORDS = ["对外标识", "别名（裸名）", "provider/model 前缀形"]

test("B1 `model-quotas` 缺 quotas ⇒ 400 `invalid_request_error`（报文 = 外标双形族）", async () => {
  const db = DB.openDatabase(":memory:")
  const { target, cookie } = await seedSession(db)
  const server = await startServer({ db })
  try {
    const res = await post(server.base, `/api/members/${target.id}/model-quotas`, { body: {}, cookie })
    assert.equal(res.status, 400)
    assert.equal(res.json?.error?.code, "invalid_request_error")
    const message = String(res.json.error.message)
    for (const word of FOREIGN_WORDS) assert.ok(message.includes(word), `报文缺词「${word}」——${message}`)
    assert.ok(!message.includes('"<provider/model>"'), `报文残旧裸形 —— ${message}`)
  } finally {
    await server.close()
    db.close()
  }
})

test("B2 `model-disables` 缺 disables ⇒ 400 `invalid_request_error`（报文 = 外标双形族）", async () => {
  const db = DB.openDatabase(":memory:")
  const { target, cookie } = await seedSession(db)
  const server = await startServer({ db })
  try {
    const res = await post(server.base, `/api/members/${target.id}/model-disables`, { body: {}, cookie })
    assert.equal(res.status, 400)
    assert.equal(res.json?.error?.code, "invalid_request_error")
    const message = String(res.json.error.message)
    for (const word of FOREIGN_WORDS) assert.ok(message.includes(word), `报文缺词「${word}」——${message}`)
    assert.ok(!message.includes('"<provider/model>"'), `报文残旧裸形 —— ${message}`)
  } finally {
    await server.close()
    db.close()
  }
})

// ── C 腿（#1161 注释面——八坐标旧句零残留 ∥ 目标句在位）────────────────────────

const QUOTA = "thincoder-server/src/metering/quota.mjs"
const ROUTES = "thincoder-server/src/gateway/routes.mjs"
const DBFILE = "thincoder-server/src/store/db.mjs"
const METER_ROUTES = "thincoder-server/src/metering/routes.mjs"
const ROUTES_ADMIN = "thincoder-server/src/accounts/routes-admin.mjs"

/** 八坐标目标句片段（[file, fragment]——判据源 = 批档 §2 坐标块）。 */
const TARGET_FRAGMENTS = [
  [QUOTA, "覆盖键 = 对外标识（配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59）"],
  [ROUTES, "[4] 对外标识派发（别名（配了）∥ `provider/model` 前缀形——两形精确匹配；"],
  [ROUTES, "上游请求体 model = 上游模型名；记账 = 拆列两字段）"],
  [ROUTES, "// [4] 对外标识派发（裸名 ∥ 未命中 ⇒ 404 model_not_found；派发时快照）"],
  [ROUTES, "（对外标识 = 配别名 ⇒ 别名 ∥ 未配 ⇒ `provider/model`——KD-SV-59）"],
  [DBFILE, "开放清单（JSON 数组——条目两形：字符串 = 上游模型名（无别名）∥ 对象 { name, alias }（配别名）；对外标识 = alias ∥ provider/model——2026-10-09 alias 批）"],
  [DBFILE, "内部真名两字段（对外显示 = 别名回映射——2026-10-09 alias 批）"],
  [METER_ROUTES, '缺 quotas（{ "<对外标识（别名（裸名） ∥ provider/model 前缀形）>": N|null }'],
  [ROUTES_ADMIN, '缺 disables（{ "<对外标识（别名（裸名） ∥ provider/model 前缀形）>": true|null }'],
]

/** 八坐标旧句片段（0 命中——含本批移出句 `复合键派发` ∥ 旧报文裸形）。 */
const OLD_FRAGMENTS = [
  [QUOTA, "覆盖键 = 对外标识（`provider/model`）∥"],
  [ROUTES, "[4] `provider/model` 复合键派发"],
  [ROUTES, "（首斜杠切分——上游请求体 model = 余段；记账 provider/model = 拆列两字段）"],
  [ROUTES, "// [4] 复合键派发（"],
  [ROUTES, "（对外标识 = provider/model 回拼）"],
  [DBFILE, "开放清单（JSON 数组——上游模型名；对外 = provider/model）"],
  [DBFILE, "无损回拼（首斜杠切分同派发面"],
  [METER_ROUTES, '缺 quotas（{ "<provider/model>":'],
  [ROUTES_ADMIN, '缺 disables（{ "<provider/model>":'],
]

test("C1 八坐标目标句在位（五源档——完整新句片段精确匹配）", () => {
  const cache = new Map()
  const text = (rel) => (cache.has(rel) ? cache.get(rel) : (cache.set(rel, readSrc(rel)), cache.get(rel)))
  for (const [file, fragment] of TARGET_FRAGMENTS) {
    assert.ok(text(file).includes(fragment), `目标句不在位：${file} —— ${fragment}`)
  }
})

test("C2 八坐标旧句片段 0 命中（含 `复合键派发` ∥ 旧报文裸形）", () => {
  const cache = new Map()
  const text = (rel) => (cache.has(rel) ? cache.get(rel) : (cache.set(rel, readSrc(rel)), cache.get(rel)))
  for (const [file, fragment] of OLD_FRAGMENTS) {
    assert.ok(!text(file).includes(fragment), `旧句残留：${file} —— ${fragment}`)
  }
})

// ── 链自检（`prepublishOnly` 含本批件）───────────────────────────────────────

test("链自检：`prepublishOnly` 含本批件 ∥ 清单目标在盘（`includes` 形）", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  assert.ok(batchFiles.includes(BATCH_FILE), `本批件应入列：${BATCH_FILE}（现 ${batchFiles.length} 件）`)
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
