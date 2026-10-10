/**
 * 2026-10-10-runner-admin-console.test.mjs — thincoder-server 批内单测件（`runner-admin-console` 批 · 服务面——
 * 节点增删 ∥ 容器四路由 ∥ v12 迁移；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-runner-admin-console.test.mjs`
 *
 * 射程（判据源 = 批档 §2 + `docs/server/design/sandbox/SANDBOX.md` §12 用例表；腿 ↔ 用例在括号）：
 *   N40（添加节点：自检读数逐值落库 ∥ 运行面在列 online+版本 ∥ 审计 runner_add）∥ E34（400/400/403/401）
 *   ∥ B42（版本不兼容 ⇒ 502 + 零落库）∥ B41（不可达：online=false ∥ 列表 502 ∥ 添节点 502+审计+零落库 ∥ 删节点仅 keep）
 *   ∥ N46（建容器三件：引擎请求体逐值 + 列表可见 + 审计）∥ E35（引擎 404/409 ⇒ 400 含原文 ∥ 不可达 ⇒ 502）
 *   ∥ N47（启/停/删 + 304 幂等 + 审计三枚）∥ E36（动作目标 404）∥ N48（删节点三径 + 审计 detail 逐值）
 *   ∥ B43（连删中途失败 ⇒ 502 + 行保留 + 失败清单）∥ v12 迁移六条（STORE.md §2 v12 段判据）
 * 假引擎 = 真 HTTP 假 Docker（真 fetch 链——不是 fetchImpl 替身；更强形）；链路 = 进程内网关 + 账号面 + 沙盒面。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync } from "node:fs"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const DB = await load("thincoder-server/src/store/db.mjs")
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const SANDBOX = await load("thincoder-server/src/sandbox/routes.mjs")
const REGISTRY = await load("thincoder-server/src/sandbox/registry.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")

const PASSWORD = "password-123"
const TEMP = mkdtempSync(join(tmpdir(), "tc-runner-admin-"))

// ── 假 Docker 引擎（真 HTTP——真 fetch 链；调用逐条在 `calls`）────────────────────

async function startFakeDocker(opts = {}) {
  const version = opts.version ?? { Version: "29.1.3", ApiVersion: "1.52", MinAPIVersion: "1.44", Os: "linux", Arch: "amd64" }
  const calls = []
  const failDelete = new Set(opts.failDeleteIds ?? [])
  const state = { containers: (opts.containers ?? []).map((item) => ({ ...item })), nextId: 1 }
  const server = createServer((req, res) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      const url = new URL(req.url, "http://engine")
      const raw = Buffer.concat(chunks).toString("utf8")
      let body = null
      try {
        body = raw === "" ? null : JSON.parse(raw)
      } catch {
        body = raw
      }
      calls.push({ method: req.method, path: url.pathname, query: url.search, body })
      const json = (status, payload) => {
        res.writeHead(status, { "content-type": "application/json" })
        res.end(payload === undefined ? "" : JSON.stringify(payload))
      }
      const p = url.pathname.replace(/^\/v?[0-9.]+/, "") || "/"
      if (p === "/version") return json(200, version)
      if (p === "/info") {
        return json(200, {
          ServerVersion: version.Version,
          Containers: state.containers.length,
          ContainersRunning: state.containers.filter((item) => item.State === "running").length,
        })
      }
      if (p === "/containers/json") return json(200, state.containers)
      if (p === "/containers/create" && req.method === "POST") {
        if (opts.createFail) return json(opts.createFail.status, { message: opts.createFail.message })
        const id = `ctr-${state.nextId++}`
        const name = url.searchParams.get("name")
        state.containers.push({ Id: id, Names: [`/${name}`], Image: body?.Image ?? null, State: "created", Status: "Created" })
        return json(201, { Id: id, Warnings: [] })
      }
      const action = /^\/containers\/([^/]+)\/(start|stop)$/.exec(p)
      if (action) {
        const id = decodeURIComponent(action[1])
        const target = state.containers.find((item) => item.Id === id)
        if (!target) return json(404, { message: `No such container: ${id}` })
        if (action[2] === "start") {
          if (target.State === "running") return json(304, { message: "container already started" })
          target.State = "running"
          target.Status = "Up 1 second"
          return json(204)
        }
        if (target.State !== "running") return json(304, { message: "container already stopped" })
        target.State = "exited"
        target.Status = "Exited (0) 1 second ago"
        return json(204)
      }
      const del = /^\/containers\/([^/]+)$/.exec(p)
      if (del && req.method === "DELETE") {
        const id = decodeURIComponent(del[1])
        if (failDelete.has(id)) return json(500, { message: `cannot remove ${id}: driver failed` })
        state.containers = state.containers.filter((item) => item.Id !== id)
        return json(204)
      }
      return json(404, { message: `unknown path ${url.pathname}` })
    })
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    calls,
    state,
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
}

/** 死地址（监听即关——连不上）：用于 B41/E35 不可达腿。 */
async function deadBase() {
  const engine = await startFakeDocker()
  const base = engine.base
  await engine.close()
  return base
}

// ── 进程内应用（网关 + 账号面 + 沙盒面）────────────────────────────────────────

async function call(base, method, path, { body, cookie } = {}) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON 体：以 text 判 */
  }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

async function startApp() {
  const db = DB.openDatabase(":memory:")
  await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  await MEMBERS.createMember(db, { username: "bob", role: "user", password: PASSWORD })
  const routes = SERVER.createRouteTable()
  const config = CONFIG.validateConfig({ host: "127.0.0.1", db: join(TEMP, "gateway.db") })
  SANDBOX.registerSandboxRoutes(routes, { db, config, log: null })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = async (username) => {
    const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
    const line = res.setCookies.find((item) => item.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
    return line ? line.split(";")[0] : null
  }
  return {
    db,
    base,
    adminCookie: await login("admin"),
    userCookie: await login("bob"),
    /** 审计行（按 kind 筛——列 `detail`）。 */
    audits: (kind) => db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_event' ORDER BY id").all().filter((row) => JSON.parse(row.detail ?? "{}").kind === kind),
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
      db.close()
    },
  }
}

/** 添节点（N40 前置——多数腿共用）。出 = 响应。 */
async function addRunner(app, name, address) {
  return call(app.base, "POST", "/api/admin/sandbox/runners", { cookie: app.adminCookie, body: { name, address } })
}

// ── 腿：N40 ∥ E34 ∥ B42 ───────────────────────────────────────────────────────

test("N40 添加节点：自检读数逐值落库 ∥ 运行面在列（online=true + 版本）∥ 审计 runner_add", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const res = await addRunner(app, "node-a", engine.base)
    assert.equal(res.status, 200)
    const row = app.db.prepare("SELECT * FROM sandbox_runners WHERE id = ?").get(res.json.runner.id)
    assert.deepEqual([row.name, row.address, row.status], ["node-a", engine.base, "active"], "行面：name/address/status=active")
    const readings = JSON.parse(row.runtime_json)
    assert.deepEqual(
      [readings.version, readings.apiVersion, readings.minApiVersion, readings.apiVer, readings.os, readings.arch],
      ["29.1.3", "1.52", "1.44", "1.44", "linux", "amd64"],
      "自检读数逐值（协商版本 = max(1.44, MinAPIVersion) = 1.44 在场）",
    )
    assert.deepEqual(res.json.runner.selfCheck, readings, "响应面读数 = 落库读数（同源）")
    const overview = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.equal(overview.json.status, "available")
    assert.deepEqual(
      [overview.json.runners[0].online, overview.json.runners[0].version, overview.json.runners[0].containers],
      [true, "29.1.3", { total: 0, running: 0 }],
      "运行面在列：online=true ∥ 版本 ∥ 容器计数",
    )
    const audits = app.audits("runner_add")
    assert.equal(audits.length, 1, "审计 runner_add 一枚")
    const detail = JSON.parse(audits[0].detail)
    assert.deepEqual([detail.runnerId, detail.address], [row.id, engine.base], "审计 detail：runnerId ∥ address")
    const gu = engine.calls.filter((item) => item.path === "/version" || item.path === "/1.44/version")
    assert.equal(gu.length >= 2, true, `引导步（无前缀）+ 复读（带前缀）两读在案——实录：${engine.calls.map((item) => `${item.method} ${item.path}`).join(" | ")}`)
    assert.equal(engine.calls.some((item) => item.path === "/version"), true, "引导步无前缀读数")
    assert.equal(engine.calls.some((item) => item.path === "/1.44/version"), true, "复读带版本前缀（协商 1.44——恒带前缀，形式 /<ver>/...）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("E34 添节点错误面：重名 ⇒ 400 ∥ 地址形非法（https: ∥ 空）⇒ 400 ∥ user ⇒ 403 ∥ 无会话 ⇒ 401", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    assert.equal((await addRunner(app, "dup", engine.base)).status, 200)
    const before = engine.calls.length
    const dup = await addRunner(app, "dup", engine.base)
    assert.equal(dup.status, 400, "重名 ⇒ 400")
    assert.match(dup.json.error.message, /节点名已存在/)
    assert.equal(engine.calls.length, before, "重名拒在自检之前（网面零触）")
    const bad = await addRunner(app, "node-b", "https://10.0.0.9")
    assert.equal(bad.status, 400, "https: ⇒ 400")
    assert.match(bad.json.error.message, /https:/)
    const empty = await addRunner(app, "node-b", "   ")
    assert.equal(empty.status, 400, "空地址 ⇒ 400")
    const asUser = await call(app.base, "POST", "/api/admin/sandbox/runners", { cookie: app.userCookie, body: { name: "node-c", address: engine.base } })
    assert.equal(asUser.status, 403, "user ⇒ 403")
    const anon = await call(app.base, "POST", "/api/admin/sandbox/runners", { body: { name: "node-c", address: engine.base } })
    assert.equal(anon.status, 401, "无会话 ⇒ 401")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 1, "只成一行（余全拒）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B42 自检版本不兼容：MinAPIVersion 1.50 ⇒ 拒登记（502 人话「版本不兼容」）+ 零落库", async () => {
  const engine = await startFakeDocker({ version: { Version: "9.9.9", ApiVersion: "1.44", MinAPIVersion: "1.50" } })
  const app = await startApp()
  try {
    const res = await addRunner(app, "node-old", engine.base)
    assert.equal(res.status, 502)
    assert.match(res.json.error.message, /版本不兼容/, "人话含「版本不兼容」")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "零落库")
    assert.equal(app.audits("runner_selfcheck_failed").length, 1, "失败审计行一枚")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：B41 ∥ N46 ∥ E35 ∥ N47 ∥ E36 ──────────────────────────────────────────

test("B41 节点不可达：online=false（version/containers=null）∥ 容器列表 502 ∥ 添节点 502+审计+零落库 ∥ 删节点仅 keep 过", async () => {
  const app = await startApp()
  const dead = await deadBase()
  try {
    const add = await addRunner(app, "node-dead", dead)
    assert.equal(add.status, 502, "添节点 ⇒ 502（自检连不上）")
    assert.equal(app.audits("runner_selfcheck_failed").length, 1)
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "零落库")
    const row = REGISTRY.insertRunner(app.db, { name: "node-dead", address: dead, runtime: { apiVer: "1.44", version: "29.1.3" } })
    const overview = await call(app.base, "GET", "/api/admin/sandbox/overview", { cookie: app.adminCookie })
    assert.equal(overview.json.status, "unavailable", "全离线 ⇒ 运行面 unavailable")
    assert.deepEqual([overview.json.runners[0].online, overview.json.runners[0].version, overview.json.runners[0].containers], [false, null, null], "离线读数不外推")
    const list = await call(app.base, "GET", `/api/admin/sandbox/runners/${row.id}/containers`, { cookie: app.adminCookie })
    assert.equal(list.status, 502, "容器列表 ⇒ 502")
    assert.match(list.json.error.message, /不可达/)
    const remove = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${row.id}`, { cookie: app.adminCookie, body: { containers: "remove" } })
    assert.equal(remove.status, 502, "不可达 ⇒ remove 拒（502）")
    const keep = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${row.id}`, { cookie: app.adminCookie, body: { containers: "keep" } })
    assert.equal(keep.status, 200, "不可达 ⇒ 仅 keep 可过")
    assert.deepEqual([keep.json.kept, keep.json.removed], [0, 0], "未列到容器 ⇒ 计数 0/0")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "行已删")
  } finally {
    await app.close()
  }
})

test("N46 建容器三件：引擎请求体逐值（Image ∥ Binds=<卷>:/workspace）∥ 200 {container} ∥ 列表可见 ∥ 审计 container_create", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = (await addRunner(app, "node-c", engine.base)).json.runner
    const res = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers`, {
      cookie: app.adminCookie,
      body: { name: "box-1", image: "thincoder-sandbox:1", volume: "tc-ws-7" },
    })
    assert.equal(res.status, 200)
    const create = engine.calls.find((item) => item.path.endsWith("/containers/create"))
    assert.equal(create.query, "?name=box-1", "名经 query 传（`?name=`）")
    assert.deepEqual(create.body, { Image: "thincoder-sandbox:1", HostConfig: { Binds: ["tc-ws-7:/workspace"] } }, "引擎请求体逐值")
    assert.equal(res.json.container.id, "ctr-1", "200 {container}（id 逐值）")
    const list = await call(app.base, "GET", `/api/admin/sandbox/runners/${runner.id}/containers`, { cookie: app.adminCookie })
    assert.deepEqual(list.json.containers.map((item) => [item.name, item.state]), [["box-1", "created"]], "列表含（state=created）")
    const audits = app.audits("container_create")
    assert.deepEqual([audits.length, JSON.parse(audits[0].detail).containerId], [1, "ctr-1"], "审计行 container_create")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("E35 建容器错误面：引擎 404 ⇒ 400 含原文 ∥ 409 ⇒ 400 ∥ 节点不可达 ⇒ 502", async () => {
  const app = await startApp()
  try {
    const engine404 = await startFakeDocker({ createFail: { status: 404, message: "No such image: nope:1" } })
    const r404 = (await addRunner(app, "node-404", engine404.base)).json.runner
    const res404 = await call(app.base, "POST", `/api/admin/sandbox/runners/${r404.id}/containers`, { cookie: app.adminCookie, body: { name: "box-x", image: "nope:1" } })
    assert.equal(res404.status, 400, "引擎 404 ⇒ 400")
    assert.match(res404.json.error.message, /No such image: nope:1/, "含引擎原文")
    await engine404.close()

    const engine409 = await startFakeDocker({ createFail: { status: 409, message: 'Conflict. The container name "/box-y" is already in use' } })
    const r409 = (await addRunner(app, "node-409", engine409.base)).json.runner
    const res409 = await call(app.base, "POST", `/api/admin/sandbox/runners/${r409.id}/containers`, { cookie: app.adminCookie, body: { name: "box-y", image: "thincoder-sandbox:1" } })
    assert.equal(res409.status, 400, "引擎 409 ⇒ 400")
    assert.match(res409.json.error.message, /already in use/)
    await engine409.close()

    const dead = await deadBase()
    const rDead = REGISTRY.insertRunner(app.db, { name: "node-dead", address: dead, runtime: { apiVer: "1.44", version: "29.1.3" } })
    const res502 = await call(app.base, "POST", `/api/admin/sandbox/runners/${rDead.id}/containers`, { cookie: app.adminCookie, body: { name: "box-z", image: "thincoder-sandbox:1" } })
    assert.equal(res502.status, 502, "节点不可达 ⇒ 502")
  } finally {
    await app.close()
  }
})

test("N47 启/停/删：204 ⇒ 200 ∥ 304（已启/已停）⇒ 幂等成功 ∥ DELETE ?force=1 ∥ 审计三枚", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = (await addRunner(app, "node-s", engine.base)).json.runner
    const created = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers`, { cookie: app.adminCookie, body: { name: "box-2", image: "thincoder-sandbox:1", volume: "tc-ws-8" } })
    const cid = created.json.container.id
    const start1 = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/${cid}/start`, { cookie: app.adminCookie })
    assert.equal(start1.status, 200, "start 204 ⇒ 200")
    const start2 = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/${cid}/start`, { cookie: app.adminCookie })
    assert.equal(start2.status, 200, "start 重复（引擎 304）⇒ 幂等成功 200")
    const stop1 = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/${cid}/stop`, { cookie: app.adminCookie })
    assert.equal(stop1.status, 200, "stop 204 ⇒ 200")
    const stop2 = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/${cid}/stop`, { cookie: app.adminCookie })
    assert.equal(stop2.status, 200, "stop 重复（引擎 304）⇒ 幂等成功 200")
    const del = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${runner.id}/containers/${cid}`, { cookie: app.adminCookie })
    assert.equal(del.status, 200, "删 ⇒ 200")
    const paths = engine.calls.map((item) => `${item.method} ${item.path}${item.query}`)
    assert.equal(paths.includes(`POST /1.44/containers/${cid}/start`), true, `引擎 start 命中——实录：${paths.join(" | ")}`)
    assert.equal(paths.includes(`POST /1.44/containers/${cid}/stop`), true, "引擎 stop 命中")
    assert.equal(paths.includes(`DELETE /1.44/containers/${cid}?force=1`), true, "引擎 DELETE ?force=1 命中")
    assert.equal(engine.state.containers.length, 0, "引擎侧容器已净（卷不随删——卷不在本引擎面）")
    assert.deepEqual([app.audits("container_start").length, app.audits("container_stop").length, app.audits("container_delete").length], [2, 2, 1], "审计三枚（重复动作各记一条）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("E36 容器动作目标不存在（引擎 404）⇒ 404 not_found", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = (await addRunner(app, "node-404a", engine.base)).json.runner
    const res = await call(app.base, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/ghost/start`, { cookie: app.adminCookie })
    assert.deepEqual([res.status, res.json.error.code], [404, "not_found"], "404 not_found（码面判据——`type` 沿 OpenAI 惯例）")
    assert.match(res.json.error.message, /容器不存在/)
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：N48 ∥ B43 ────────────────────────────────────────────────────────────

test("N48 删节点三径：keep（引擎零删）∥ remove（逐删命中）∥ 无处置（有容器）⇒ 400 ∥ 无容器 ⇒ 直接删行 ∥ 审计 detail 逐值", async () => {
  const app = await startApp()
  try {
    // ① keep：容器留机，引擎零删调用
    const engineKeep = await startFakeDocker({ containers: [{ Id: "k-1", Names: ["/keep-me"], Image: "img", State: "running", Status: "Up" }] })
    const rk = (await addRunner(app, "node-keep", engineKeep.base)).json.runner
    const keep = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${rk.id}`, { cookie: app.adminCookie, body: { containers: "keep" } })
    assert.equal(keep.status, 200)
    assert.deepEqual([keep.json.kept, keep.json.removed], [1, 0], "keep ⇒ kept=1/removed=0")
    assert.equal(engineKeep.calls.some((item) => item.method === "DELETE"), false, "keep ⇒ 引擎零删调用")
    assert.equal(engineKeep.state.containers.length, 1, "容器留机")
    await engineKeep.close()

    // ② remove：逐删命中 N 次 ⇒ 行删
    const engineRemove = await startFakeDocker({
      containers: [
        { Id: "r-1", Names: ["/rm-1"], Image: "img", State: "running", Status: "Up" },
        { Id: "r-2", Names: ["/rm-2"], Image: "img", State: "exited", Status: "Exited" },
      ],
    })
    const rr = (await addRunner(app, "node-remove", engineRemove.base)).json.runner
    const remove = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${rr.id}`, { cookie: app.adminCookie, body: { containers: "remove" } })
    assert.equal(remove.status, 200)
    assert.deepEqual([remove.json.kept, remove.json.removed], [0, 2], "remove ⇒ removed=2")
    assert.equal(engineRemove.calls.filter((item) => item.method === "DELETE").length, 2, "逐删命中（N 次）")
    assert.equal(engineRemove.state.containers.length, 0, "引擎侧容器净")
    await engineRemove.close()

    // ③ 无处置（有容器）⇒ 400；无容器 ⇒ 直接删
    const engineAsk = await startFakeDocker({ containers: [{ Id: "a-1", Names: ["/ask-me"], Image: "img", State: "exited", Status: "Exited" }] })
    const ra = (await addRunner(app, "node-ask", engineAsk.base)).json.runner
    const ask = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${ra.id}`, { cookie: app.adminCookie })
    assert.equal(ask.status, 400, "有容器无处置 ⇒ 400")
    assert.match(ask.json.error.message, /请选处置/)
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners WHERE id = ?").get(ra.id).n, 1, "400 ⇒ 行保留")
    await engineAsk.close()

    const engineEmpty = await startFakeDocker()
    const re = (await addRunner(app, "node-empty", engineEmpty.base)).json.runner
    const direct = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${re.id}`, { cookie: app.adminCookie })
    assert.equal(direct.status, 200, "无容器 ⇒ 直接删行")
    assert.deepEqual([direct.json.kept, direct.json.removed], [0, 0])
    await engineEmpty.close()

    const audits = app.audits("runner_delete")
    assert.equal(audits.length, 3, "审计 runner_delete 三枚")
    assert.deepEqual(JSON.parse(audits[0].detail), { kind: "runner_delete", kept: 1, removed: 0 }, "detail 逐值（keep）")
    assert.deepEqual(JSON.parse(audits[1].detail), { kind: "runner_delete", kept: 0, removed: 2 }, "detail 逐值（remove）")
  } finally {
    await app.close()
  }
})

test("B43 连删中途失败：502 + 登记行保留 + 消息携失败清单 ∥ 已删者如实回报（不假装未删）", async () => {
  const engine = await startFakeDocker({
    containers: [
      { Id: "f-1", Names: ["/ok-one"], Image: "img", State: "exited", Status: "Exited" },
      { Id: "f-2", Names: ["/bad-two"], Image: "img", State: "exited", Status: "Exited" },
    ],
    failDeleteIds: ["f-2"],
  })
  const app = await startApp()
  try {
    const runner = (await addRunner(app, "node-half", engine.base)).json.runner
    const res = await call(app.base, "DELETE", `/api/admin/sandbox/runners/${runner.id}`, { cookie: app.adminCookie, body: { containers: "remove" } })
    assert.equal(res.status, 502, "连删未净 ⇒ 502")
    assert.match(res.json.error.message, /已删 1\/2/, "已删者如实回报")
    assert.match(res.json.error.message, /bad-two/, "消息携失败清单")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners WHERE id = ?").get(runner.id).n, 1, "登记行保留")
    assert.equal(app.audits("runner_delete").length, 0, "未成 ⇒ 无 runner_delete 审计")
    assert.deepEqual(engine.state.containers.map((item) => item.Id), ["f-2"], "已删者真删（不假装未删）")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：v12 迁移六条（STORE.md §2 v12 段判据）──────────────────────────────────

test("v12 重建：列面五行在场 ∥ 旧三列不在 ∥ 存量行弃 ∥ 幂等（再开零变）∥ workspaces.runner_id 零变 ∥ 结构版本 = 13", async () => {
  const file = join(TEMP, "v12.db")
  // ① v11 库（含旧形态行）⇒ 升
  const v11 = DB.openDatabase(file, { migrations: DB.MIGRATIONS.slice(0, 11) })
  assert.equal(DB.readVersion(v11), 11)
  v11.prepare("INSERT INTO sandbox_runners (name, token_hash, labels_json, status, runtime_json, last_heartbeat_at, created_at) VALUES (?,?,?,?,?,?,?)").run(
    "old-node", "hash-x", '{"labels":{}}', "active", "{}", Date.now(), new Date().toISOString(),
  )
  assert.equal(v11.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 1, "旧库含存量行")
  v11.close()

  // ② 升（v12 段重建）——空库直落 = 13（v13 同批在场）
  const upgraded = DB.openDatabase(file)
  assert.equal(DB.readVersion(upgraded), 13, "空库/v11 库升后读数 = 13（链尾）")
  const cols = upgraded.prepare("PRAGMA table_info(sandbox_runners)").all().map((row) => row.name)
  assert.deepEqual(cols, ["id", "name", "address", "status", "runtime_json", "created_at"], "列面五行在场（新形）")
  for (const gone of ["token_hash", "labels_json", "last_heartbeat_at"]) assert.equal(cols.includes(gone), false, `旧列不在：${gone}`)
  assert.equal(upgraded.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "存量行弃（旧行 ⇒ 空表）")
  const wsCols = upgraded.prepare("PRAGMA table_info(sandbox_workspaces)").all().map((row) => row.name)
  assert.equal(wsCols.includes("runner_id"), true, "workspaces.runner_id 引用面零变")
  // ③ 幂等（再开零变）
  upgraded.close()
  const reopened = DB.openDatabase(file)
  assert.equal(DB.readVersion(reopened), 13, "再开零变（v12/v13 段幂等）")
  assert.deepEqual(reopened.prepare("PRAGMA table_info(sandbox_runners)").all().map((row) => row.name), cols, "再开列面零变")
  reopened.close()
})
