/**
 * 2026-10-10-server-exec-sandbox-runner.fixtures.mjs — 执行面批内件的**共享夹具**（非测试件——`node --test` 不收集；
 * 两件消费：`…-runner.test.mjs`（腿 A–F 本地语义面）∥ `…-runner-io.test.mjs`（腿 G–I 互操作 + 链自检）。
 * 口径 = 假件只替「真机不可用面」（容器运行时 ∥ nft/iptables ∥ quota 命令 ∥ 控制面网络端点）；被测逻辑不替。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-exec-sandbox-runner.test.mjs`
 *                                    `node --test docs/batches/2026-10-10-server-exec-sandbox-runner-io.test.mjs`
 */
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

export const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
export const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
export const TMP = join(ROOT, ".thincoder", "tmp")
mkdirSync(TMP, { recursive: true })

// 控制面（真件——互操作腿；只读引用，不修改）
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")
const SANDBOX_ROUTES = await load("thincoder-server/src/sandbox/routes.mjs")
const RUNNER_API = await load("thincoder-server/src/sandbox/runner-api.mjs")
const RUNTIME = await load("thincoder-server/src/sandbox/runner/runtime.mjs")

export const PASSWORD = "password-123"
export const EMPTY = Buffer.alloc(0)

/** 假容器运行时（同适配器接口——真机不可用；构建面记 calls，含 create 参数）。 */
export function createFakeRuntime({ engine = "docker" } = {}) {
  const containers = new Map()
  const networks = new Map()
  const calls = []
  let seq = 0
  const record = (name, args, result) => { calls.push({ cmd: name, args, result }); return result }
  const api = {
    engine,
    containers,
    networks,
    calls,
    createSpecs: [],
    execQueue: [],
    subnet: "172.18.0.0/16",
    gateway: "172.18.0.1",
    containerCreatedMs: null,
    async listBoxes() {
      return [...containers.values()].map((container) => ({
        id: container.id, name: container.name, state: container.state,
        workspaceId: container.workspaceId, runnerId: container.runnerId, labels: container.labels,
      }))
    },
    async createBox(spec) {
      api.createSpecs.push(spec)
      const id = `c${++seq}`
      containers.set(id, {
        id, name: spec.name, state: "created", workspaceId: Number(spec.containerLabels["tc.ws"]),
        runnerId: Number(spec.containerLabels["tc.runner"]), labels: { ...spec.containerLabels }, env: { ...spec.env }, spec,
      })
      return record(engine, ["create", spec.name], { code: 0, stdout: Buffer.from(id), stderr: EMPTY })
    },
    async startBox(id) {
      const container = containers.get(id)
      if (container) container.state = "running"
      return record(engine, ["start", id], { code: 0, stdout: EMPTY, stderr: EMPTY })
    },
    async stopBox(id) {
      const container = containers.get(id)
      if (container) container.state = "exited"
      return record(engine, ["stop", id], { code: 0, stdout: EMPTY, stderr: EMPTY })
    },
    async removeBox(id) {
      containers.delete(id)
      return record(engine, ["rm", id], { code: 0, stdout: EMPTY, stderr: EMPTY })
    },
    async execBox(id, { command, timeoutMs, maxBytes } = {}) {
      const next = api.execQueue.shift()
      api.calls.push({ cmd: "exec", args: [id, command], result: next })
      if (next) return next
      return { exitCode: 0, stdout: Buffer.from(`fake-exec-ok:${Array.isArray(command) ? command.join(" ") : command}`), stderr: EMPTY, truncated: false, timedOut: false }
    },
    async networkCreate(name) {
      networks.set(name, { subnet: api.subnet, gateway: api.gateway })
      return record(engine, ["network", "create", name], { code: 0, stdout: EMPTY, stderr: EMPTY })
    },
    async networkRemove(name) {
      networks.delete(name)
      return record(engine, ["network", "rm", name], { code: 0, stdout: EMPTY, stderr: EMPTY })
    },
    async networkInspect(name) {
      return networks.get(name) ?? null
    },
    async imagePresent() { return true },
    async imageEnsure() { return { ok: true, how: "present" } },
    async containerIp(id) { return containers.has(id) ? "172.18.0.9" : null },
    async containerCreatedAt() { return api.containerCreatedMs },
    async version() { return { code: 0, stdout: Buffer.from(`${engine} version 99.0`), stderr: EMPTY } },
  }
  return api
}

/** 混合 exec：git ⇒ 真跑（checkpoint/dirty 用）；余命令 ⇒ 假读数（nft/findmnt/quota——真机项面）。 */
export function makeHybridExec({ extra = null } = {}) {
  const calls = []
  const exec = async (cmd, args = [], opts = {}) => {
    calls.push({ cmd, args, input: opts.input ? String(opts.input) : null })
    if (extra && extra[cmd]) return extra[cmd](args, opts)
    if (cmd === "git") return RUNTIME.runCommand(cmd, args, opts)
    return { code: 0, stdout: Buffer.from(""), stderr: EMPTY, timedOut: false, truncated: false }
  }
  exec.calls = calls
  return exec
}

export function fakeReadings(overrides = {}) {
  return {
    engine: "docker", version: "docker 24.0", runtimeAdapter: null, netfilter: { tool: "nft", ok: true, detail: "假件" },
    quota: { mechanism: "project", fsType: "ext4", mountPoint: "/", detail: "假件" }, ok: true, diskFreeMb: 100000,
    items: [], block: { engine: "docker", version: "docker 24.0", checks: {}, ok: true }, ...overrides,
  }
}

export async function waitFor(check, { timeoutMs = 5000, intervalMs = 25, label = "条件" } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const value = await check()
      if (value) return value
    } catch (e) {
      lastError = e
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error(`等待超时：${label}${lastError ? `（末次异常：${lastError.message}）` : ""}`)
}

export async function call(base, method, path, { body, raw, cookie, token, headers = {} } = {}) {
  const head = { ...headers }
  if (cookie) head.cookie = cookie
  if (token) head.authorization = `Bearer ${token}`
  if (method !== "GET" && method !== "HEAD") head["content-type"] = head["content-type"] ?? "application/json"
  const payload = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body)
  const res = await fetch(base + path, { method, headers: head, body: payload })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体 */ }
  return { status: res.status, text, json, setCookies: res.headers.getSetCookie?.() ?? [] }
}

/** 真控制面（内存库——互操作腿）：账号面 + 沙盒两面；pollWaitMs 缩短（批内件替身口径）。 */
export async function startControlPlane({ checkpointDir = null } = {}) {
  const db = DB.openDatabase(":memory:")
  const { member: admin } = await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  const { member: alice } = await MEMBERS.createMember(db, { username: "alice", role: "user", password: PASSWORD })
  const routes = SERVER.createRouteTable()
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  SANDBOX_ROUTES.registerSandboxRoutes(routes, { db, config: { host: "127.0.0.1", port: 8123 } })
  RUNNER_API.registerRunnerApiRoutes(routes, { db, config: { host: "127.0.0.1", port: 8123 }, pollWaitMs: 40, checkpointDir })
  const server = SERVER.createGatewayServer({ config: {}, routes, log: null })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = async (username) => {
    const res = await call(base, "POST", "/api/login", { body: { username, password: PASSWORD } })
    const line = res.setCookies.find((item) => item.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
    return line ? line.split(";")[0] : null
  }
  return {
    db, base, adminId: admin.id, aliceId: alice.id,
    adminCookie: await login("admin"), aliceCookie: await login("alice"),
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)); db.close() },
  }
}

export const tempDir = (prefix) => mkdtempSync(join(TMP, prefix))

/** 完整 create 载荷（控制面 `registry.mjs` 形——§3:43「runner 侧零回落」：缺键 ⇒ 建盒拒）。 */
export const boxPayload = (workspaceId, overrides = {}) => ({
  workspaceId,
  image: "thincoder-sandbox:1",
  tmpfsMb: 64,
  network: `tc-ws-${workspaceId}`,
  volume: String(workspaceId),
  limits: { cpus: 1, memMb: 512, pids: 64, diskMb: 2048, idleTtlMinutes: 30, wallclockTtlHours: 24 },
  checkpoint: { everyMinutes: 15, keep: 5 },
  env: { OPENAI_BASE_URL: "http://10.0.0.5:8787/v1", OPENAI_API_KEY: `sk-tc-ws${workspaceId}` },
  ...overrides,
})

/** git 助手（真 git——WIP 检查点腿面）。 */
export function gitIn(dir, args, opts = {}) {
  return execFileSync("git", ["-c", "user.name=test", "-c", "user.email=test@local", ...args], { cwd: dir, encoding: "utf8", ...opts }).trim()
}
