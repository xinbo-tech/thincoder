/**
 * 2026-10-11-sandbox-docker-admin.test.mjs — thincoder-server 批内单测件（`sandbox-docker-admin` 批 · 服务面——
 * 容器面补齐五件 ∥ 镜像族三件；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-11-sandbox-docker-admin.test.mjs`
 *
 * 射程（判据源 = 批档 §2 + `docs/server/design/sandbox/SANDBOX.md` §12 用例表；腿 ↔ 用例在括号）：
 *   N53（详情逐值 ∥ 日志解复用零帧头残渣 ∥ 用量逐值 ∥ 零审计）∥ N54（重启/强杀：引擎逐条 + 审计两行 detail 键集）
 *   ∥ N55（镜像列表逐值 ∥ 拉取入参逐值 + 审计）∥ N56（删除两形：force 0/1 逐值 + 审计 detail 键集）
 *   ∥ B47（tail 越界/非数 ⇒ 400 ∥ 缺省 200）∥ B48（强杀 409 ⇒ 400 人话——非幂等成功）
 *   ∥ B49（删除镜像 409 ⇒ 400 携原文 + 处置句；force:true 再走）∥ B50（拉取形非法 ⇒ 400 + 零引擎调用）
 *   ∥ B51（超 256 KiB ⇒ truncated: true + 尾句标记）∥ E39（五端点引擎 404 ⇒ 404 not_found）
 *   ∥ E40（拉取两形失败 ⇒ 400 携原文 ∥ 不可达 ⇒ 502）∥ E41（user/无会话 ⇒ 403/401 八端点）
 *   ∥ E42（五端点节点不可达 ⇒ 502）∥ 纯函数腿（`parseImageRef`/`demuxDockerLogs`/`findStreamError`/`clipUtf8`）。
 * 假引擎 = 真 HTTP 假 Docker（真 fetch 链）；链路 = 进程内网关 + 账号面 + 沙盒面。
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
const DOCKER = await load("thincoder-server/src/sandbox/docker.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")

const PASSWORD = "password-123"
const TEMP = mkdtempSync(join(tmpdir(), "tc-docker-admin-"))

// ── 假 Docker 引擎（真 HTTP——真 fetch 链；调用逐条在 `calls`）────────────────────

/** 多路复用帧（8 字节头：流类 + 三零 + 大端长度）。 */
const frame = (stream, text) => {
  const payload = Buffer.from(text, "utf8")
  const head = Buffer.alloc(8)
  head[0] = stream
  head.writeUInt32BE(payload.length, 4)
  return Buffer.concat([head, payload])
}
const MULTIPLEX_SAMPLE = Buffer.concat([frame(1, "hello stdout\n"), frame(2, "warn stderr\n")])
const BIG_LOG = "A".repeat(300 * 1024) // 超 256 KiB（B51）

const INSPECT = {
  Id: "c-1",
  Name: "/box-one",
  Created: "2026-10-11T00:00:00Z",
  Config: { Image: "thincoder-sandbox:1", Env: ["A=1", "B=2"], Entrypoint: ["/entry.sh"], Cmd: ["sleep", "infinity"] },
  State: { Status: "running", Running: true, StartedAt: "2026-10-11T00:01:00Z", FinishedAt: "0001-01-01T00:00:00Z", RestartCount: 2 },
  Mounts: [{ Type: "volume", Source: "tc-ws-7", Destination: "/workspace", Mode: "rw", RW: true }],
  NetworkSettings: { Ports: { "8080/tcp": [{ HostIp: "0.0.0.0", HostPort: "18080" }], "9000/tcp": null } },
  SizeRw: 4096,
  SizeRootFs: 8192,
}
const STATS = {
  cpu_stats: { cpu_usage: { total_usage: 300000000 }, system_cpu_usage: 3000000000, online_cpus: 2 },
  precpu_stats: { cpu_usage: { total_usage: 100000000 }, system_cpu_usage: 1000000000 },
  memory_stats: { usage: 10485760, limit: 1073741824 },
}
const IMAGES = [
  { Id: "sha256:aaa", RepoTags: ["thincoder-sandbox:1", "thincoder-sandbox:2"], Size: 123456, Created: 1700000000 },
  { Id: "sha256:bbb", RepoTags: null, Size: 2048, Created: 1700000001 },
]

async function startFakeDocker(opts = {}) {
  const version = opts.version ?? { Version: "29.1.3", ApiVersion: "1.52", MinAPIVersion: "1.44", Os: "linux", Arch: "amd64" }
  const calls = []
  const state = {
    containers: (opts.containers ?? [{ Id: "c-1", Names: ["/box-one"], Image: "thincoder-sandbox:1", State: "running", Status: "Up" }]).map((item) => ({ ...item })),
    images: (opts.images ?? IMAGES).map((item) => ({ ...item })),
  }
  const logsBytes = opts.logsBytes ?? MULTIPLEX_SAMPLE
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
      if (p === "/info") return json(200, { ServerVersion: version.Version })
      if (p === "/containers/json") return json(200, state.containers)
      const inspect = /^\/containers\/([^/]+)\/json$/.exec(p)
      if (inspect) {
        const id = decodeURIComponent(inspect[1])
        if (id === "ghost" || !state.containers.some((item) => item.Id === id)) return json(404, { message: `No such container: ${id}` })
        return json(200, INSPECT)
      }
      const logs = /^\/containers\/([^/]+)\/logs$/.exec(p)
      if (logs) {
        const id = decodeURIComponent(logs[1])
        if (id === "ghost") return json(404, { message: `No such container: ${id}` })
        res.writeHead(200, { "content-type": "application/vnd.docker.raw-stream" })
        return res.end(opts.bigLogs === true ? frame(1, BIG_LOG) : logsBytes)
      }
      const action = /^\/containers\/([^/]+)\/(start|stop|restart|kill)$/.exec(p)
      if (action) {
        const id = decodeURIComponent(action[1])
        if (id === "ghost") return json(404, { message: `No such container: ${id}` })
        if (action[2] === "kill" && opts.killConflict === true) return json(409, { message: "container is not running" })
        return json(204)
      }
      const stats = /^\/containers\/([^/]+)\/stats$/.exec(p)
      if (stats) {
        const id = decodeURIComponent(stats[1])
        if (id === "ghost") return json(404, { message: `No such container: ${id}` })
        return json(200, opts.statsSample ?? STATS)
      }
      if (p === "/images/json") return json(200, state.images)
      if (p === "/images/create" && req.method === "POST") {
        if (opts.pullMode === "http500") return json(500, { message: "registry unreachable" })
        if (opts.pullMode === "streamError") {
          res.writeHead(200, { "content-type": "application/json" })
          return res.end(`${JSON.stringify({ status: "Pulling from library/ubuntu" })}\r\n${JSON.stringify({ errorDetail: { message: "manifest unknown" }, error: "manifest unknown" })}\r\n`)
        }
        res.writeHead(200, { "content-type": "application/json" })
        return res.end(`${JSON.stringify({ status: "Pulling from library/ubuntu" })}\r\n${JSON.stringify({ status: "Download complete" })}\r\n`)
      }
      const remove = /^\/images\/(.+)$/.exec(p)
      if (remove && req.method === "DELETE") {
        const ref = decodeURIComponent(remove[1])
        if (opts.removeMode === "conflict") return json(409, { message: `conflict: unable to delete ${ref} (must be forced) - image is being used by stopped container 1a2b` })
        if (opts.removeMode === "notFound") return json(404, { message: `No such image: ${ref}` })
        state.images = state.images.filter((item) => !(item.RepoTags ?? []).includes(ref) && item.Id !== ref)
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

/** 死地址（监听即关——连不上）：用于 E40/E42 不可达腿。 */
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
    auditCount: () => db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'sandbox_event'").get().n,
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
      db.close()
    },
  }
}

/** 添节点（多数腿共用——走真自检链）。出 = 节点行。 */
async function addRunner(app, name, address) {
  const res = await call(app.base, "POST", "/api/admin/sandbox/runners", { cookie: app.adminCookie, body: { name, address } })
  assert.equal(res.status, 200, `添节点失败：${res.text}`)
  return res.json.runner
}

const api = (app, method, path, options = {}) => call(app.base, method, path, { cookie: app.adminCookie, ...options })

// ── 腿：N53 ∥ B47 ∥ B51 ∥ E39 ─────────────────────────────────────────────────

test("N53 详情/日志/用量三读：详情逐值（挂载/端口/环境/命令）∥ 日志解复用零帧头残渣 ∥ 用量逐值 ∥ 零审计", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-r", engine.base)
    const before = app.auditCount()
    const detail = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/containers/c-1`)
    assert.equal(detail.status, 200)
    const row = detail.json.container
    assert.deepEqual(
      [row.id, row.name, row.image, row.state, row.status, row.created, row.restartCount],
      ["c-1", "box-one", "thincoder-sandbox:1", "running", "running", "2026-10-11T00:00:00Z", 2],
      "信息段逐值（名去前导 /）",
    )
    assert.deepEqual([row.startedAt, row.finishedAt], ["2026-10-11T00:01:00Z", "0001-01-01T00:00:00Z"], "起止时刻逐值")
    assert.deepEqual(row.command, { entrypoint: ["/entry.sh"], cmd: ["sleep", "infinity"] }, "命令 = Entrypoint/Cmd 原文")
    assert.deepEqual(row.env, ["A=1", "B=2"], "环境原文")
    assert.deepEqual(row.mounts, [{ type: "volume", source: "tc-ws-7", destination: "/workspace", mode: "rw", rw: true }], "挂载逐值")
    assert.deepEqual(row.ports, [{ port: "8080", hostIp: "0.0.0.0", hostPort: "18080" }, { port: "9000", hostIp: null, hostPort: null }], "端口展开（未映射 ⇒ null）")

    const logs = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/containers/c-1/logs`)
    assert.deepEqual([logs.status, logs.json.tail, logs.json.truncated], [200, 200, false], "日志尾块（缺省 tail=200）")
    assert.equal(logs.json.logs, "hello stdout\nwarn stderr\n", "解复用后文本（零帧头残渣）")
    const logsCall = engine.calls.find((item) => item.path.endsWith("/logs"))
    assert.equal(logsCall.query, "?stdout=1&stderr=1&tail=200", "引擎读数参数逐值（tail 有界）")

    const usage = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/containers/c-1/stats`)
    assert.equal(usage.status, 200)
    const u = usage.json.usage
    assert.deepEqual([u.cpuPercent, u.memUsed, u.memLimit, u.diskRw, u.diskRoot], [20, 10485760, 1073741824, 4096, 8192], "用量逐值（cpuΔ/systemΔ×2×100 = 20）")
    assert.equal(typeof u.sampledAt, "number", "sampledAt 在场")
    assert.equal(engine.calls.some((item) => item.path.endsWith("/json") && item.query === "?size=1"), true, "磁盘读数 = inspect size=1")
    assert.equal(app.auditCount(), before, "读动作零审计行（详情/日志/用量三读）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B47 日志 tail 有界：越界（0 ∥ 5000）⇒ 400 ∥ 非数 ⇒ 400 ∥ 缺省 ⇒ 200（tail=200）", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-tail", engine.base)
    const url = `/api/admin/sandbox/runners/${runner.id}/containers/c-1/logs`
    for (const bad of ["0", "5000", "abc", "-1"]) {
      const res = await api(app, "GET", `${url}?tail=${bad}`)
      assert.equal(res.status, 400, `tail=${bad} ⇒ 400`)
      assert.match(res.json.error.message, /tail/, "范围人话")
    }
    const ok = await api(app, "GET", url)
    assert.deepEqual([ok.status, ok.json.tail], [200, 200], "缺省 ⇒ tail=200")
    const custom = await api(app, "GET", `${url}?tail=2000`)
    assert.deepEqual([custom.status, custom.json.tail], [200, 2000], "上界值可过")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B51 日志超 256 KiB ⇒ truncated: true + 尾句标记（文本体 ≤ 256 KiB）", async () => {
  const engine = await startFakeDocker({ bigLogs: true })
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-big", engine.base)
    const res = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/containers/c-1/logs`)
    assert.equal(res.status, 200)
    assert.equal(res.json.truncated, true, "截断标记")
    assert.ok(res.json.logs.endsWith(DOCKER.LOG_TRUNCATED_MARK), "尾句标记在尾")
    const bodyBytes = Buffer.byteLength(res.json.logs.slice(0, -DOCKER.LOG_TRUNCATED_MARK.length), "utf8")
    assert.ok(bodyBytes <= DOCKER.LOG_TEXT_LIMIT_BYTES, `文本体 ≤ 256 KiB（实 ${bodyBytes}）`)
    assert.ok(res.json.logs.length > 0 && res.json.logs[0] === "A", "前缀保形（首字符原样）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("E39 详情/日志/用量/重启/强杀目标不存在（引擎 404）⇒ 404 not_found", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-404", engine.base)
    const base = `/api/admin/sandbox/runners/${runner.id}/containers/ghost`
    const legs = [["GET", base], ["GET", `${base}/logs`], ["GET", `${base}/stats`], ["POST", `${base}/restart`], ["POST", `${base}/kill`]]
    for (const [method, path] of legs) {
      const res = await api(app, method, path, method === "POST" ? { body: {} } : {})
      assert.deepEqual([res.status, res.json.error.code], [404, "not_found"], `${method} ${path} ⇒ 404 not_found`)
      assert.match(res.json.error.message, /容器不存在/, "人话")
    }
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：N54 ∥ B48 ─────────────────────────────────────────────────────────────

test("N54 重启 ∥ 强杀：引擎调用逐条命中 ∥ 204 ⇒ 200 {ok,id} ∥ 审计两行（detail 键集 = ACCOUNTS §2.1）", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-act", engine.base)
    const base = `/api/admin/sandbox/runners/${runner.id}/containers/c-1`
    const restart = await api(app, "POST", `${base}/restart`, { body: {} })
    assert.deepEqual([restart.status, restart.json], [200, { ok: true, id: "c-1" }], "重启 204 ⇒ 200")
    const kill = await api(app, "POST", `${base}/kill`, { body: {} })
    assert.deepEqual([kill.status, kill.json], [200, { ok: true, id: "c-1" }], "强杀 204 ⇒ 200")
    const paths = engine.calls.map((item) => `${item.method} ${item.path}`)
    assert.equal(paths.includes("POST /v1.44/containers/c-1/restart"), true, `引擎 restart 命中——实录：${paths.join(" | ")}`)
    assert.equal(paths.includes("POST /v1.44/containers/c-1/kill"), true, "引擎 kill 命中")
    const restarts = app.audits("container_restart")
    const kills = app.audits("container_kill")
    assert.deepEqual([restarts.length, kills.length], [1, 1], "审计两行")
    assert.deepEqual(JSON.parse(restarts[0].detail), { kind: "container_restart", runnerId: runner.id, containerId: "c-1" }, "detail 键集逐值（重启）")
    assert.deepEqual(JSON.parse(kills[0].detail), { kind: "container_kill", runnerId: runner.id, containerId: "c-1" }, "detail 键集逐值（强杀）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B48 强杀未运行容器（引擎 409）⇒ 400 人话「容器未在运行——无需强杀」（非幂等成功）", async () => {
  const engine = await startFakeDocker({ killConflict: true })
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-kill", engine.base)
    const res = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/containers/c-1/kill`, { body: {} })
    assert.equal(res.status, 400, "409 ⇒ 400（≠ stop 的 304 幂等成功）")
    assert.match(res.json.error.message, /容器未在运行——无需强杀/, "人话（键别语义）")
    assert.match(res.json.error.message, /container is not running/, "携引擎原文")
    assert.equal(app.audits("container_kill").length, 0, "未成 ⇒ 无审计行")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：N55 ∥ B50 ∥ E40 ∥ E42 ─────────────────────────────────────────────────

test("N55 镜像列表 ∥ 拉取：列表逐值（RepoTags null ⇒ []）∥ 引擎入参逐值（fromImage/tag）∥ 审计 image_pull", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-img", engine.base)
    const list = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/images`)
    assert.equal(list.status, 200)
    assert.deepEqual(list.json.images, [
      { id: "sha256:aaa", tags: ["thincoder-sandbox:1", "thincoder-sandbox:2"], size: 123456, created: 1700000000 },
      { id: "sha256:bbb", tags: [], size: 2048, created: 1700000001 },
    ], "列表逐值（无标签 ⇒ []）")
    const pull = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/images/pull`, { body: { image: "ubuntu" } })
    assert.deepEqual([pull.status, pull.json], [200, { ok: true, image: "ubuntu", tag: "latest" }], "拉取缺省 latest")
    const tagged = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/images/pull`, { body: { image: "registry:5000/foo/bar:v1" } })
    assert.deepEqual([tagged.status, tagged.json], [200, { ok: true, image: "registry:5000/foo/bar", tag: "v1" }], "标签切分 = 末个 / 之后的末个 : 起")
    const pulls = engine.calls.filter((item) => item.path.endsWith("/images/create"))
    assert.deepEqual(pulls.map((item) => item.query), ["?fromImage=ubuntu&tag=latest", "?fromImage=registry%3A5000%2Ffoo%2Fbar&tag=v1"], "引擎入参逐值")
    const audits = app.audits("image_pull")
    assert.deepEqual(audits.map((row) => JSON.parse(row.detail)), [
      { kind: "image_pull", runnerId: runner.id, image: "ubuntu:latest" },
      { kind: "image_pull", runnerId: runner.id, image: "registry:5000/foo/bar:v1" },
    ], "审计两行（detail 键集 = ACCOUNTS §2.1）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B50 拉取形非法：空 ∥ 含 @（digest）∥ 超长 ⇒ 400（逐形人话）+ 零引擎调用", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-form", engine.base)
    const before = engine.calls.length
    const empty = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/images/pull`, { body: { image: "   " } })
    assert.match(empty.json.error.message, /不可为空/, "空 ⇒ 400 人话")
    const digest = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/images/pull`, { body: { image: "ubuntu@sha256:abc" } })
    assert.match(digest.json.error.message, /digest/, "digest 形 ⇒ 400 人话")
    const long = await api(app, "POST", `/api/admin/sandbox/runners/${runner.id}/images/pull`, { body: { image: "a".repeat(250) } })
    assert.match(long.json.error.message, /超长/, "超长 ⇒ 400 人话")
    assert.deepEqual([empty.status, digest.status, long.status], [400, 400, 400], "三形逐 400")
    assert.equal(engine.calls.length, before, "零引擎调用（假件断）")
    assert.equal(app.audits("image_pull").length, 0, "拒在审计之前")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("E40 拉取失败两形 + 不可达：非 2xx ⇒ 400 携原文 ∥ 200 流内 error ⇒ 400 携原文 ∥ 不可达 ⇒ 502", async () => {
  const app = await startApp()
  try {
    const engine500 = await startFakeDocker({ pullMode: "http500" })
    const r500 = await addRunner(app, "node-500", engine500.base)
    const res500 = await api(app, "POST", `/api/admin/sandbox/runners/${r500.id}/images/pull`, { body: { image: "ubuntu" } })
    assert.deepEqual([res500.status, res500.json.error.code], [400, "invalid_request_error"], "非 2xx ⇒ 400")
    assert.match(res500.json.error.message, /registry unreachable/, "携引擎原文")
    await engine500.close()

    const engineStream = await startFakeDocker({ pullMode: "streamError" })
    const rStream = await addRunner(app, "node-stream", engineStream.base)
    const resStream = await api(app, "POST", `/api/admin/sandbox/runners/${rStream.id}/images/pull`, { body: { image: "ubuntu" } })
    assert.deepEqual([resStream.status, resStream.json.error.code], [400, "invalid_request_error"], "200 流内 error ⇒ 400（两形皆收）")
    assert.match(resStream.json.error.message, /manifest unknown/, "携引擎原文")
    await engineStream.close()

    const dead = await deadBase()
    const rDead = REGISTRY.insertRunner(app.db, { name: "node-dead", address: dead, runtime: { apiVer: "1.44", version: "29.1.3" } })
    const resDead = await api(app, "POST", `/api/admin/sandbox/runners/${rDead.id}/images/pull`, { body: { image: "ubuntu" } })
    assert.deepEqual([resDead.status, resDead.json.error.code], [502, "upstream_error"], "不可达 ⇒ 502")
    assert.equal(app.audits("image_pull").length, 0, "三败 ⇒ 零审计行")
  } finally {
    await app.close()
  }
})

test("E42 详情/日志/用量/重启/强杀节点不可达（五端点逐打）⇒ 502 upstream_error", async () => {
  const app = await startApp()
  try {
    const dead = await deadBase()
    const runner = REGISTRY.insertRunner(app.db, { name: "node-off", address: dead, runtime: { apiVer: "1.44", version: "29.1.3" } })
    const base = `/api/admin/sandbox/runners/${runner.id}/containers/c-1`
    const legs = [["GET", base], ["GET", `${base}/logs`], ["GET", `${base}/stats`], ["POST", `${base}/restart`], ["POST", `${base}/kill`]]
    for (const [method, path] of legs) {
      const res = await api(app, method, path, method === "POST" ? { body: {} } : {})
      assert.deepEqual([res.status, res.json.error.code], [502, "upstream_error"], `${method} ${path} ⇒ 502`)
      assert.match(res.json.error.message, /不可达/, "逐句人话")
    }
  } finally {
    await app.close()
  }
})

// ── 腿：N56 ∥ B49 ─────────────────────────────────────────────────────────────

test("N56 镜像删除两形：ref = 名:标签（force 缺省）∥ force:true ⇒ 引擎 ?force=0/1 逐值 + 审计 detail 键集", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-del", engine.base)
    const first = await api(app, "DELETE", `/api/admin/sandbox/runners/${runner.id}/images`, { body: { ref: "thincoder-sandbox:1" } })
    assert.deepEqual([first.status, first.json], [200, { ok: true, ref: "thincoder-sandbox:1" }], "删除（缺省 force=0）")
    const second = await api(app, "DELETE", `/api/admin/sandbox/runners/${runner.id}/images`, { body: { ref: "thincoder-sandbox:2", force: true } })
    assert.deepEqual(second.json, { ok: true, ref: "thincoder-sandbox:2" }, "删除（force:true）")
    const dels = engine.calls.filter((item) => item.method === "DELETE")
    assert.deepEqual(dels.map((item) => `${item.path}${item.query}`), [
      "/v1.44/images/thincoder-sandbox:1?force=0",
      "/v1.44/images/thincoder-sandbox:2?force=1",
    ], "引擎调用逐值（force 0/1）")
    const audits = app.audits("image_delete")
    assert.deepEqual(audits.map((row) => JSON.parse(row.detail)), [
      { kind: "image_delete", runnerId: runner.id, ref: "thincoder-sandbox:1", force: false },
      { kind: "image_delete", runnerId: runner.id, ref: "thincoder-sandbox:2", force: true },
    ], "审计逐值（detail 键集 = ACCOUNTS §2.1）")
    const list = await api(app, "GET", `/api/admin/sandbox/runners/${runner.id}/images`)
    assert.deepEqual(list.json.images.map((item) => item.id), ["sha256:bbb"], "引擎侧真删（假件状态随动）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B49 删除镜像被引用（引擎 409）⇒ 400 携原文 + 处置句 ∥ 缺/形非法 ⇒ 400 ∥ force:true 再走", async () => {
  const engine = await startFakeDocker({ removeMode: "conflict" })
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-conflict", engine.base)
    const res = await api(app, "DELETE", `/api/admin/sandbox/runners/${runner.id}/images`, { body: { ref: "thincoder-sandbox:1" } })
    assert.equal(res.status, 400, "409 ⇒ 400")
    assert.match(res.json.error.message, /must be forced/, "携引擎原文")
    assert.match(res.json.error.message, /强制删除/, "处置句（勾「强制删除」再试）")
    assert.equal(app.audits("image_delete").length, 0, "未成 ⇒ 零审计行")
    const forced = await api(app, "DELETE", `/api/admin/sandbox/runners/${runner.id}/images`, { body: { ref: "thincoder-sandbox:1", force: true } })
    assert.equal(forced.status, 400, "同击仍由引擎裁决（未被劫持为成功或拒）")
    assert.equal(engine.calls.filter((item) => item.method === "DELETE").map((item) => item.query).join(","), "?force=0,?force=1", "force:true ⇒ 引擎 force=1 再走")
    // 形非法（缺 ∥ 空白 ∥ 空 ∥ 非法字符）
    for (const bad of [undefined, "", "  ", "a b", "a?b", "a#b"]) {
      const resBad = await api(app, "DELETE", `/api/admin/sandbox/runners/${runner.id}/images`, { body: bad === undefined ? {} : { ref: bad } })
      assert.equal(resBad.status, 400, `ref=${JSON.stringify(bad)} ⇒ 400`)
    }
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：E41（判权）∥ 纯函数面 ─────────────────────────────────────────────────

test("E41 user ∥ 无会话打新八端点 ⇒ 403 ∥ 401", async () => {
  const engine = await startFakeDocker()
  const app = await startApp()
  try {
    const runner = await addRunner(app, "node-auth", engine.base)
    const base = `/api/admin/sandbox/runners/${runner.id}`
    const legs = [
      ["GET", `${base}/containers/c-1`, {}],
      ["GET", `${base}/containers/c-1/logs`, {}],
      ["GET", `${base}/containers/c-1/stats`, {}],
      ["POST", `${base}/containers/c-1/restart`, { body: {} }],
      ["POST", `${base}/containers/c-1/kill`, { body: {} }],
      ["GET", `${base}/images`, {}],
      ["POST", `${base}/images/pull`, { body: { image: "ubuntu" } }],
      ["DELETE", `${base}/images`, { body: { ref: "ubuntu:latest" } }],
    ]
    for (const [method, path, extra] of legs) {
      const asUser = await call(app.base, method, path, { cookie: app.userCookie, ...extra })
      assert.equal(asUser.status, 403, `user ⇒ 403：${method} ${path}`)
      const anon = await call(app.base, method, path, extra)
      assert.equal(anon.status, 401, `无会话 ⇒ 401：${method} ${path}`)
    }
    assert.equal(app.audits("image_pull").length + app.audits("image_delete").length + app.audits("container_kill").length, 0, "拒在动作之前（零审计行）")
  } finally {
    await app.close()
    await engine.close()
  }
})

test("纯函数面：parseImageRef 标签切分 ∥ demuxDockerLogs 判据（判不出 ⇒ null）∥ findStreamError ∥ clipUtf8", () => {
  assert.deepEqual(DOCKER.parseImageRef("ubuntu"), { image: "ubuntu", tag: "latest" }, "缺省 latest")
  assert.deepEqual(DOCKER.parseImageRef("registry:5000/foo/bar:v1"), { image: "registry:5000/foo/bar", tag: "v1" }, "端口冒号不误切（标签 = 末个 / 之后的末个 : 起）")
  assert.deepEqual(DOCKER.parseImageRef("foo/bar"), { image: "foo/bar", tag: "latest" }, "无标签 ⇒ latest")
  assert.throws(() => DOCKER.parseImageRef(""), /不可为空/)
  assert.throws(() => DOCKER.parseImageRef("u@sha256:x"), /digest/)
  assert.throws(() => DOCKER.parseImageRef("a".repeat(201)), /超长/)

  assert.equal(DOCKER.demuxDockerLogs(MULTIPLEX_SAMPLE).toString("utf8"), "hello stdout\nwarn stderr\n", "多路复用 ⇒ 载荷拼接")
  assert.equal(DOCKER.demuxDockerLogs(Buffer.from("plain tty text\n", "utf8")), null, "非帧流 ⇒ null（原样透传）")
  assert.equal(DOCKER.demuxDockerLogs(frame(1, "ok")).toString("utf8"), "ok", "单帧 ⇒ 载荷")
  assert.equal(DOCKER.demuxDockerLogs(Buffer.concat([frame(1, "ok"), Buffer.from([9, 1, 2])])), null, "尾残帧 ⇒ null")
  assert.equal(DOCKER.demuxDockerLogs(Buffer.from([9, 0, 0, 0, 0, 0, 0, 1])), null, "首字节 > 2 ⇒ 判不出（null——原样透传不抛）")

  assert.equal(DOCKER.findStreamError(`${JSON.stringify({ status: "ok" })}\n${JSON.stringify({ errorDetail: { message: "boom" } })}`), "boom", "流内 errorDetail")
  assert.equal(DOCKER.findStreamError(JSON.stringify({ error: "nope" })), "nope", "整段单 JSON 兜底")
  assert.equal(DOCKER.findStreamError(`${JSON.stringify({ status: "fine" })}\n`), null, "无错 ⇒ null")
  assert.equal(DOCKER.clipUtf8("中文abc", 7), "中文a", "按码点切（不劈多字节字符）")
})
