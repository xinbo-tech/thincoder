/**
 * 2026-10-10-runner-admin-console-agent.test.mjs — thincoder-server 批内单测件（`runner-admin-console` 批 · 托管接入面——
 * 管理面 agent 环 ∥ 五工具 ∥ 凭据三态 ∥ v13 迁移；名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-runner-admin-console-agent.test.mjs`
 *
 * 射程（判据源 = 批档 §2 + `docs/server/design/sandbox/SANDBOX.md` §12 ∥ `docs/server/design/agent/ADMIN-AGENT.md` §7）：
 *   N49（裸机全链：S1→S8 逐条 ∥ 每 exec 审计行 ∥ 登记行在场）∥ N50（已装已监听 ⇒ 跳 S4/S5——零装包零重启）
 *   ∥ N51（已装未监听 ⇒ 仅 S5，重启恰一次）∥ N52（凭据三态 + 秘密零回显）∥ N53（审计 = 起∥每调用∥终，数目逐值 ∥ 工具面五件）
 *   ∥ B44（指纹变更 ⇒ S2 停 + 人话 + 重新信任后重试过）∥ B45（sudo 不可用 ⇒ S3 停 + 建议句 + 宿主零变）
 *   ∥ B46（server 重启 ⇒ interrupted + 审计 + 凭据按模式）∥ B47（步数上限 ⇒ failed「预算超限」+ 审计终行）
 *   ∥ E37（认证被拒 ∥ 不可达 ⇒ S2 停 + 人话 + 宿主零动作）∥ E38（Docker 版本不兼容 ⇒ S6 停 + 零落库）
 *   ∥ E39（无可用模型 ⇒ 400 + 零落库）∥ v13 六条（STORE.md §2 v13 段判据）
 * 假件面：假 ssh（`execImpl`——命令脚本）∥ 假 Docker（真 HTTP 引擎）∥ 假模型（脚本回合）∥ 假 sshpass。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs"
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
const ONBOARDING = await load("thincoder-server/src/sandbox/onboarding.mjs")
const SSH = await load("thincoder-server/src/sandbox/ssh.mjs")
const AGENT_TOOLS = await load("thincoder-server/src/agent/tools.mjs")
const MEMBERS = await load("thincoder-server/src/accounts/members.mjs")
const ACCOUNT_ROUTES = await load("thincoder-server/src/accounts/routes.mjs")
const SESSION = await load("thincoder-server/src/accounts/session.mjs")

const PASSWORD = "password-123"
const MODEL = "fake/fake-model"
const SECRET = "ssh-secret-9f2a"
const SUDO = "sudo-secret-7b1c"
const tempRoot = mkdtempSync(join(tmpdir(), "tc-onboarding-"))

// ── 假件：假 ssh ∥ 假模型 ∥ 假 Docker 引擎 ─────────────────────────────────────

/** 假 ssh：`handler(command, rec)` ⇒ `{ code, stdout, stderr }`（缺省 0）；逐调用落 `calls`。 */
function makeFakeSsh(handler = () => ({})) {
  const calls = []
  const execImpl = async (cmd, args, opts = {}) => {
    const command = args[args.length - 1]
    const rec = { cmd, args, command, env: opts.env ?? {}, input: opts.input ?? null }
    calls.push(rec)
    const out = handler(command, rec) ?? {}
    return { code: out.code ?? 0, stdout: out.stdout ?? "", stderr: out.stderr ?? "", ...(out.spawnError ? { spawnError: true } : {}), ...(out.timedOut ? { timedOut: true } : {}) }
  }
  return { execImpl, calls }
}

/** 假模型：脚本回合（每回合 = `{ content?, toolCalls? }`；用尽 ⇒ 恒用末回合）。 */
function scriptedChat(turns) {
  const state = { i: 0, schemas: null }
  const chat = async ({ tools }) => {
    state.schemas = tools
    const turn = turns[Math.min(state.i, turns.length - 1)]
    state.i += 1
    return typeof turn === "function" ? turn() : turn
  }
  return { chat, state }
}

/** 工具调用回合（id 自增——形 = 核 `{ id, name, arguments }`）。 */
function turnCall(name, args, { content = "" } = {}) {
  return { content, toolCalls: [{ id: `call-${name}-${Math.random().toString(16).slice(2, 8)}`, name, arguments: JSON.stringify(args) }] }
}

const probeTurn = (step = "S2") => turnCall("exec", { host: "10.0.0.5", command: ONBOARDING.PROBE_SCRIPT, step })
const isProbe = (command) => command.includes("echo OS=")

async function startFakeDocker(opts = {}) {
  const version = opts.version ?? { Version: "29.1.3", ApiVersion: "1.52", MinAPIVersion: "1.44", Os: "linux", Arch: "amd64" }
  const calls = []
  const state = { containers: [], nextId: 1 }
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://engine")
    calls.push({ method: req.method, path: url.pathname, query: url.search })
    const json = (status, payload) => {
      res.writeHead(status, { "content-type": "application/json" })
      res.end(payload === undefined ? "" : JSON.stringify(payload))
    }
    const p = url.pathname.replace(/^\/v?[0-9.]+/, "") || "/"
    if (p === "/version") return json(200, version)
    if (p === "/info") return json(200, { ServerVersion: version.Version, Containers: 0, ContainersRunning: 0 })
    if (p === "/containers/json") return json(200, state.containers)
    return json(404, { message: `unknown ${url.pathname}` })
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

// ── 进程内应用（网关 + 账号面 + 沙盒面——托管接入 deps 注入口）──────────────────

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

function seedProvider(db) {
  const now = new Date().toISOString()
  db.prepare("INSERT INTO providers (name, base_url, api_key, models_json, created_at, updated_at) VALUES (?,?,?,?,?,?)").run(
    "fake", "http://127.0.0.1:9/v1", "sk-test", '["fake-model"]', now, now,
  )
}

async function startAgentApp({ ssh, turns, budget = null, withProvider = true, db: existingDb = null, dir = null, extraDeps = {} } = {}) {
  const dataDir = dir ?? mkdtempSync(join(tempRoot, "app-"))
  const db = existingDb ?? DB.openDatabase(":memory:")
  if (!existingDb) await MEMBERS.createMember(db, { username: "admin", role: "admin", password: PASSWORD })
  if (withProvider) seedProvider(db)
  const config = CONFIG.validateConfig({ host: "127.0.0.1", db: join(dataDir, "gateway.db") })
  const routes = SERVER.createRouteTable()
  const scripted = scriptedChat(turns)
  const deps = { chat: scripted.chat, execImpl: ssh.execImpl, hasSshpass: async () => true, ...(budget ? { budget } : {}), ...extraDeps }
  SANDBOX.registerSandboxRoutes(routes, { db, config, log: null, deps })
  ACCOUNT_ROUTES.registerAccountRoutes(routes, { db })
  const server = SERVER.createGatewayServer({ config, routes, log: null })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const login = await call(base, "POST", "/api/login", { body: { username: "admin", password: PASSWORD } })
  const cookieLine = login.setCookies.find((line) => line.startsWith(`${SESSION.SESSION_COOKIE}=`)) ?? null
  const app = {
    db,
    config,
    deps,
    base,
    dir: dataDir,
    scripted,
    adminCookie: cookieLine ? cookieLine.split(";")[0] : null,
    audits: (kind) => db.prepare("SELECT * FROM audit_events WHERE type = 'sandbox_event' ORDER BY id").all().filter((row) => JSON.parse(row.detail ?? "{}").kind === kind),
    runs: () => db.prepare("SELECT * FROM sandbox_onboarding ORDER BY id").all(),
    async close() {
      server.closeAllConnections?.()
      await new Promise((resolve) => server.close(resolve))
    },
  }
  return app
}

const submit = (app, body) => call(app.base, "POST", "/api/admin/sandbox/onboarding", { cookie: app.adminCookie, body })
const baseBody = (extra = {}) => ({
  host: "10.0.0.5",
  sshPort: 22,
  sshUser: "ops",
  auth: { kind: "password", secret: SECRET },
  sudoSecret: SUDO,
  name: "node-lab",
  model: MODEL,
  credentialMode: "burn",
  ...extra,
})

/** 读时轮询（KD-SV-86——无后台常驻）：等到非 running ⇒ run 详情。 */
async function waitRun(app, id, { timeoutMs = 10000 } = {}) {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const detail = await call(app.base, "GET", `/api/admin/sandbox/onboarding/${id}`, { cookie: app.adminCookie })
    if (detail.json?.run && detail.json.run.status !== "running") return detail.json.run
    if (Date.now() > deadline) throw new Error(`任务未在 ${timeoutMs}ms 内收尾：${JSON.stringify(detail.json)}`)
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

// ── 腿：N49 ∥ N53（裸机全链 + 审计数目与工具面五件）────────────────────────────

test("N49+N53 裸机全链：S1→S8 逐条 ∥ 每 exec 审计行 ∥ 登记行在场 ∥ 审计 = 起∥每调用∥终（数目逐值）∥ 工具面五件", async () => {
  const engine = await startFakeDocker()
  const ssh = makeFakeSsh((command) => {
    if (isProbe(command)) return { stdout: "OS=Debian 12\nDOCKER=absent\nLISTEN_2375=absent\nPKG=apt\n", code: 0 }
    if (command.includes("apt-get install")) return { stdout: "docker installed\n", code: 0 }
    if (command.includes("systemctl restart docker")) return { stdout: "active\n", code: 0 }
    return { stdout: "", code: 0 }
  })
  const turns = [
    probeTurn(),
    { content: "S3 定策：路径 = 装容器运行时（apt）+ 开 API 监听（:2375）。", toolCalls: [] },
    turnCall("exec", { host: "10.0.0.5", command: "sudo -S apt-get install -y docker.io", step: "S4" }, { content: "" }),
    turnCall("exec", { host: "10.0.0.5", command: "sudo -S systemctl restart docker", step: "S5" }),
    turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }),
    turnCall("verify", { host: "10.0.0.5", endpoint: engine.base, step: "S7" }),
    turnCall("report", { ok: true, summary: "接入成功（装运行时 + 开监听 + 登记 + 自检）", step: "S8", readings: { apiVer: "1.44" } }),
  ]
  // 第三回合是「纯文本」——环语义要求恒有工具调用：改为「文本 + 下一调用同回合」（S3 决定句随 S4 调用）
  turns[1] = turnCall("exec", { host: "10.0.0.5", command: "sudo -S apt-get install -y docker.io", step: "S4" }, { content: "S3 定策：路径 = 装容器运行时（apt）+ 开 API 监听（:2375）。" })
  turns.splice(2, 1)
  const app = await startAgentApp({ ssh, turns })
  try {
    const started = await submit(app, baseBody())
    assert.equal(started.status, 200, "起跑 200（异步——先于执行完）")
    const run = await waitRun(app, started.json.run.id)
    assert.deepEqual([run.status, run.step], ["succeeded", "S8"], "终态 succeeded ∥ 停在 S8")
    const ids = run.steps.map((entry) => entry.id)
    assert.deepEqual(ids.slice(0, 8), ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"], "步骤序列 S1→S8 逐条在 run 详情")
    assert.equal(run.steps.find((entry) => entry.id === "S2").readings.exitCode !== undefined, true, "S2 读数携退出码")
    assert.equal(typeof run.steps.find((entry) => entry.id === "S3").readings.decision, "string", "S3 定策句在读数面")
    const execs = app.audits("onboarding_exec")
    assert.equal(execs.length, 5, "每命令/调用一条审计（exec×3 + register + verify）")
    const probeAudit = JSON.parse(execs[0].detail)
    assert.deepEqual([probeAudit.tool, probeAudit.resultCode], ["exec", 0], "审计行：工具 ∥ 退出码")
    assert.equal(probeAudit.call.includes("echo OS="), true, "审计行携命令原文（截断形）")
    assert.equal(typeof probeAudit.summary, "string", "审计行携摘要")
    assert.equal(app.audits("onboarding_start").length, 1, "审计起行一枚")
    assert.equal(app.audits("onboarding_done").length, 1, "审计终行一枚（done）")
    assert.equal(app.audits("onboarding_exec").length + 2, app.db.prepare("SELECT COUNT(*) AS n FROM audit_events WHERE type = 'sandbox_event'").get().n, "审计数目逐值 = 起(1) + 每调用(5) + 终(1) = 7")
    const runner = app.db.prepare("SELECT * FROM sandbox_runners ORDER BY id").get()
    assert.deepEqual([runner.name, runner.address, runner.status], ["node-lab", engine.base, "active"], "登记行在场（名 = 提交时给 ∥ 地址 = 端点归一）")
    assert.equal(run.runnerId, runner.id, "run 行关联 runner_id")
    assert.equal(app.scripted.state.schemas.length, 5, "工具面五件在场（送入模型的 schema 五枚）")
    assert.deepEqual(app.scripted.state.schemas.map((item) => item.function.name).sort(), ["docker", "exec", "register", "report", "verify"], "五件 = exec/docker/register/verify/report")
    // 凭据纪律：口令经环境（不入 argv）∥ sudo 口令经 stdin
    const install = ssh.calls.find((rec) => rec.command.includes("apt-get install"))
    assert.equal(install.env.SSHPASS, SECRET, "密码经 `sshpass -e` 环境注入（不入 argv）")
    assert.equal(install.args.includes(SECRET), false, "口令不入 argv")
    assert.equal(install.args.includes("BatchMode=yes"), false, "口令径不含 `BatchMode`（带了直接弃用口令面——真机 A/B 核 2026-10-11）")
    for (const option of ["NumberOfPasswordPrompts=1", "PreferredAuthentications=password", "PubkeyAuthentication=no"]) {
      assert.equal(install.args.includes(option), true, `口令径含 ${option}（单提示、仅口令面——KD-SV-85）`)
    }
    assert.equal(install.input, `${SUDO}\n`, "sudo 口令经 stdin（`sudo -S`）")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：N50 ∥ N51（两径分叉）─────────────────────────────────────────────────

test("N50+N51 已装已监听 ⇒ 跳 S4/S5（零装包零重启）∥ 已装未监听 ⇒ 仅走 S5（重启恰一次）", async () => {
  const engine = await startFakeDocker()
  // ① 已装已监听
  const sshReady = makeFakeSsh((command) => (isProbe(command) ? { stdout: "OS=Ubuntu 24.04\nDOCKER=29.1.3\nLISTEN_2375={\"Version\":\"29.1.3\"}\n", code: 0 } : { code: 0 }))
  const readyTurns = [
    probeTurn(),
    turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }, { content: "S3 定策：Docker 在且 :2375 在 ⇒ 直登（跳过装包与开监听）。" }),
    turnCall("verify", { host: "10.0.0.5", endpoint: engine.base, step: "S7" }),
    turnCall("report", { ok: true, summary: "已就绪（直登）", step: "S8" }),
  ]
  const appReady = await startAgentApp({ ssh: sshReady, turns: readyTurns })
  try {
    const started = await submit(appReady, baseBody({ name: "node-ready" }))
    const run = await waitRun(appReady, started.json.run.id)
    assert.equal(run.status, "succeeded", "已装已监听 ⇒ succeeded")
    assert.deepEqual(run.steps.map((entry) => entry.id), ["S1", "S2", "S3", "S6", "S7", "S8"], "跳 S4/S5（步骤表两径分叉）")
    const cmds = sshReady.calls.filter((rec) => !isProbe(rec.command)).map((rec) => rec.command)
    assert.equal(cmds.some((cmd) => /apt-get|dnf|yum|apk|apt /.test(cmd)), false, "零装包调用（探明除外）")
    assert.equal(cmds.some((cmd) => /systemctl restart docker/.test(cmd)), false, "零重启调用（探明除外）")
  } finally {
    await appReady.close()
  }
  // ② 已装未监听
  const sshHalf = makeFakeSsh((command) => {
    if (isProbe(command)) return { stdout: "OS=Ubuntu 24.04\nDOCKER=29.1.3\nLISTEN_2375=absent\n", code: 0 }
    if (command.includes("systemctl restart docker")) return { stdout: "active\n", code: 0 }
    return { code: 0 }
  })
  const halfTurns = [
    probeTurn(),
    turnCall("exec", { host: "10.0.0.5", command: "sudo -S systemctl restart docker", step: "S5" }, { content: "S3 定策：Docker 在、:2375 缺 ⇒ 仅开监听。" }),
    turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }),
    turnCall("verify", { host: "10.0.0.5", endpoint: engine.base, step: "S7" }),
    turnCall("report", { ok: true, summary: "已就绪（仅开监听）", step: "S8" }),
  ]
  const appHalf = await startAgentApp({ ssh: sshHalf, turns: halfTurns })
  try {
    const started = await submit(appHalf, baseBody({ name: "node-half" }))
    const run = await waitRun(appHalf, started.json.run.id)
    assert.equal(run.status, "succeeded", "已装未监听 ⇒ succeeded")
    assert.deepEqual(run.steps.map((entry) => entry.id), ["S1", "S2", "S3", "S5", "S6", "S7", "S8"], "仅走 S5（无 S4）")
    assert.equal(sshHalf.calls.filter((rec) => /systemctl restart docker/.test(rec.command)).length, 1, "重启恰一次")
    assert.equal(sshHalf.calls.filter((rec) => !isProbe(rec.command)).some((rec) => /apt-get|dnf|yum|apk|apt /.test(rec.command)), false, "零装包调用（探明除外）")
  } finally {
    await appHalf.close()
    await engine.close()
  }
})

// ── 腿：N52（凭据三态 + 零回显）──────────────────────────────────────────────

test("N52 凭据三态：burn ⇒ 密列 NULL ∥ keep ⇒ 密文在 ∥ 撤销 ⇒ 清列 + 审计 ∥ 秘密零回显（响应面扫描）", async () => {
  const engine = await startFakeDocker()
  const okTurns = [
    probeTurn(),
    turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }, { content: "S3 定策：直登。" }),
    turnCall("report", { ok: true, summary: "接入成功", step: "S8" }),
  ]
  const app = await startAgentApp({ ssh: makeFakeSsh(() => ({ code: 0 })), turns: okTurns })
  try {
    // ① 弃（burn）
    const burned = await submit(app, baseBody({ name: "node-burn", credentialMode: "burn" }))
    const burnedRun = await waitRun(app, burned.json.run.id)
    const burnedRow = app.db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(burnedRun.id)
    assert.deepEqual([burnedRow.status, burnedRow.credential_state, burnedRow.secret_cipher, burnedRow.sudo_cipher], ["succeeded", "burned", null, null], "burn ⇒ 终态即零化（密列 NULL）")
    // ② 保留（keep）
    const kept = await submit(app, baseBody({ name: "node-keep", credentialMode: "keep" }))
    const keptRun = await waitRun(app, kept.json.run.id)
    const keptRow = app.db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(keptRun.id)
    assert.deepEqual([keptRow.status, keptRow.credential_state], ["succeeded", "sealed"], "keep ⇒ 密文在留")
    assert.equal(typeof keptRow.secret_cipher === "string" && keptRow.secret_cipher.length > 0, true, "密文在场")
    assert.equal(keptRow.secret_cipher.includes(SECRET), false, "密文 ≠ 明文")
    const key = ONBOARDING.loadOrCreateCredentialKey(ONBOARDING.dataDir(app.config) + "/credentials.key")
    assert.equal(ONBOARDING.decryptSecret(keptRow.secret_cipher, key), SECRET, "密文可解（回明文——仅内存面）")
    assert.equal(ONBOARDING.decryptSecret(keptRow.sudo_cipher, key), SUDO, "sudo 密文可解")
    // ③ 响应面零回显（起 ∥ 列表 ∥ 详情逐串扫描）
    const list = await call(app.base, "GET", "/api/admin/sandbox/onboarding", { cookie: app.adminCookie })
    const detail = await call(app.base, "GET", `/api/admin/sandbox/onboarding/${keptRun.id}`, { cookie: app.adminCookie })
    for (const [name, text] of [["起响应", JSON.stringify(kept.json)], ["列表响应", list.text], ["详情响应", detail.text], ["审计面", JSON.stringify(app.audits("onboarding_exec"))]]) {
      assert.equal(text.includes(SECRET), false, `${name} 零秘密回显（口令）`)
      assert.equal(text.includes(SUDO), false, `${name} 零秘密回显（sudo 口令）`)
      assert.equal(text.includes("secret_cipher"), false, `${name} 零密文列名`)
    }
    const keyFile = join(ONBOARDING.dataDir(app.config), "credentials.key")
    assert.equal(existsSync(keyFile), true, "密钥文件在场（data/credentials.key）")
    if (process.platform !== "win32") assert.equal(statSync(keyFile).mode & 0o777, 0o600, "密钥文件 0600（POSIX 位面）")
    // ④ 撤销
    const revoke = await call(app.base, "DELETE", `/api/admin/sandbox/onboarding/${keptRun.id}/credential`, { cookie: app.adminCookie })
    assert.equal(revoke.status, 200, "撤销 200")
    const revoked = app.db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(keptRun.id)
    assert.deepEqual([revoked.credential_state, revoked.secret_cipher, revoked.sudo_cipher], ["revoked", null, null], "撤销 ⇒ 清列 + 状态 revoked")
    assert.equal(app.audits("onboarding_credential_revoke").length, 1, "审计 onboarding_credential_revoke 一枚")
    const again = await call(app.base, "DELETE", `/api/admin/sandbox/onboarding/${keptRun.id}/credential`, { cookie: app.adminCookie })
    assert.equal(again.status, 400, "无凭据在留 ⇒ 400")
    const missing = await call(app.base, "DELETE", "/api/admin/sandbox/onboarding/9999/credential", { cookie: app.adminCookie })
    assert.equal(missing.status, 404, "任务不存在 ⇒ 404")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：B44 ∥ B45 ∥ E37 ∥ E38（边界与错误面）──────────────────────────────────

test("B44 指纹变更 ⇒ S2 停 +「主机指纹已变更——确认后重试」人话；重新信任后重试过", async () => {
  const engine = await startFakeDocker()
  const dir = mkdtempSync(join(tempRoot, "app-fp-"))
  const knownHosts = join(dir, ".ssh", "known_hosts")
  const stale = "[10.0.0.5]:22 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAISTALEKEY"
  const sshFp = makeFakeSsh((command) => {
    if (isProbe(command)) return { code: 255, stderr: "@@@@@@@@ WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! @@@@@@@@\nHost key verification failed." }
    return { code: 0 }
  })
  const turns = [
    probeTurn(),
    turnCall("report", { ok: false, summary: "停在 S2：主机指纹已变更——确认后重试", step: "S2" }),
  ]
  const app = await startAgentApp({ ssh: sshFp, turns, dir })
  try {
    mkdirSync(join(dir, ".ssh"), { recursive: true })
    writeFileSync(knownHosts, `${stale}\n`, { mode: 0o600 })
    const started = await submit(app, baseBody({ name: "node-fp" }))
    const run = await waitRun(app, started.json.run.id)
    assert.deepEqual([run.status, run.step], ["failed", "S2"], "停（S2）")
    assert.match(run.steps.find((entry) => entry.id === "S8").readings.summary, /主机指纹已变更——确认后重试/, "人话逐字")
    assert.equal(readFileSync(knownHosts, "utf8").includes("STALEKEY"), false, "stale 条目已清（重新信任 = 机器面）")
    // 重新信任后重试（重交任务 ⇒ accept-new 再信任 ⇒ 成）
    const sshRetry = makeFakeSsh(() => ({ code: 0 }))
    const app2 = await startAgentApp({
      ssh: sshRetry,
      dir,
      db: app.db,
      withProvider: false,
      turns: [
        probeTurn(),
        turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }, { content: "S3 定策：直登。" }),
        turnCall("report", { ok: true, summary: "接入成功", step: "S8" }),
      ],
    })
    const retry = await submit(app2, baseBody({ name: "node-fp2" }))
    const retryRun = await waitRun(app2, retry.json.run.id)
    assert.equal(retryRun.status, "succeeded", "重新信任后重试过（重交 ⇒ 成）")
    await app2.close()
  } finally {
    await app.close()
    await engine.close()
  }
})

test("B45 sudo 不可用 ⇒ S3 停 + 建议句 ∥ 宿主零变（仅探明一条命令）", async () => {
  const ssh = makeFakeSsh((command) => (isProbe(command) ? { stdout: "OS=Debian 12\nDOCKER=absent\nSUDO_N=denied\n", code: 0 } : { code: 0 }))
  const turns = [
    probeTurn(),
    turnCall("report", { ok: false, summary: "停在 S3：sudo 不可用且无口令——建议改用密钥 + sudoers 授权，或提交时提供 sudo 口令", step: "S3" }),
  ]
  const app = await startAgentApp({ ssh, turns })
  try {
    const started = await submit(app, baseBody({ name: "node-nosudo", sudoSecret: null }))
    const run = await waitRun(app, started.json.run.id)
    assert.deepEqual([run.status, run.step], ["failed", "S3"], "停（S3）")
    assert.match(run.steps.find((entry) => entry.id === "S8").readings.summary, /建议/, "含建议句")
    assert.equal(ssh.calls.length, 1, "宿主零变（除探明外零动作）")
    assert.equal(isProbe(ssh.calls[0].command), true, "唯一动作 = 探明")
  } finally {
    await app.close()
  }
})

test("E37 认证被拒 ∥ 不可达 ⇒ S2 停 + 逐句人话 ∥ 宿主零动作（零写断言）", async () => {
  const legs = [
    { stderr: "ops@10.0.0.5: Permission denied (publickey,password).", expect: /认证被拒/ },
    { stderr: "ssh: connect to host 10.0.0.5 port 22: Connection timed out", expect: /不可达或超时/ },
  ]
  for (const [index, leg] of legs.entries()) {
    const ssh = makeFakeSsh((command) => (isProbe(command) ? { code: 255, stderr: leg.stderr } : { code: 0 }))
    const app = await startAgentApp({
      ssh,
      turns: [probeTurn(), turnCall("report", { ok: false, summary: "停在 S2：无法登录（见审计行）", step: "S2" })],
    })
    try {
      const started = await submit(app, baseBody({ name: `node-t${index}` }))
      const run = await waitRun(app, started.json.run.id)
      assert.deepEqual([run.status, run.step], ["failed", "S2"], `停（S2）——${leg.stderr.slice(0, 20)}`)
      const execAudit = JSON.parse(app.audits("onboarding_exec")[0].detail)
      assert.match(execAudit.summary, leg.expect, "审计行携逐句人话")
      assert.equal(ssh.calls.length, 1, "宿主零动作（仅一次登录尝试）")
      assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "零落库")
    } finally {
      await app.close()
    }
  }
})

test("E38 Docker 版本不兼容（MinAPIVersion 1.50）⇒ S6 停 +「版本不兼容」∥ 零落库", async () => {
  const engine = await startFakeDocker({ version: { Version: "9.9.9", ApiVersion: "1.44", MinAPIVersion: "1.50" } })
  const ssh = makeFakeSsh(() => ({ code: 0 }))
  const app = await startAgentApp({
    ssh,
    turns: [
      probeTurn(),
      turnCall("register", { host: "10.0.0.5", endpoint: engine.base, step: "S6" }),
      turnCall("report", { ok: false, summary: "停在 S6：Docker API 版本不兼容（协商 > 上限）", step: "S6" }),
    ],
  })
  try {
    const started = await submit(app, baseBody({ name: "node-ver" }))
    const run = await waitRun(app, started.json.run.id)
    assert.deepEqual([run.status, run.step], ["failed", "S6"], "停（S6）")
    const registerAudit = app.audits("onboarding_exec").find((row) => JSON.parse(row.detail).tool === "register")
    assert.match(JSON.parse(registerAudit.detail).summary, /版本不兼容/, "错误面含「版本不兼容」")
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM sandbox_runners").get().n, 0, "零落库")
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：E39 ∥ B47 ∥ B46 ──────────────────────────────────────────────────────

test("E39 无可用模型 ⇒ 400 人话 + 零落库 ∥ 模型不在册 ⇒ 400", async () => {
  const ssh = makeFakeSsh(() => ({ code: 0 }))
  const empty = await startAgentApp({ ssh, turns: [], withProvider: false })
  try {
    const res = await submit(empty, baseBody())
    assert.equal(res.status, 400, "无可用模型 ⇒ 400")
    assert.match(res.json.error.message, /无可用模型/, "人话含「无可用模型」")
    assert.equal(empty.runs().length, 0, "零落库")
  } finally {
    await empty.close()
  }
  const seeded = await startAgentApp({ ssh, turns: [] })
  try {
    const res = await submit(seeded, baseBody({ model: "nope/nope" }))
    assert.equal(res.status, 400, "不在册 ⇒ 400")
    assert.match(res.json.error.message, /模型不可用/, "人话含「模型不可用」")
    assert.equal(seeded.runs().length, 0, "零落库")
  } finally {
    await seeded.close()
  }
})

test("B47 步数上限触发 ⇒ failed「预算超限」+ 审计终行", async () => {
  const ssh = makeFakeSsh(() => ({ code: 0 }))
  const app = await startAgentApp({ ssh, turns: [probeTurn()], budget: { maxCalls: 3, maxDurationMs: 60000 } }) // 假模型恒调工具
  try {
    const started = await submit(app, baseBody({ name: "node-budget" }))
    const run = await waitRun(app, started.json.run.id)
    assert.equal(run.status, "failed", "停（failed）")
    assert.equal(run.step, "S2", "停步 = 最后到达步（预算超限时停在探明）")
    const summary = run.steps.find((entry) => entry.id === "S8").readings.summary
    assert.match(summary, /预算超限/, "「预算超限」在读数面")
    assert.equal(app.audits("onboarding_failed").length, 1, "审计终行（failed）")
  } finally {
    await app.close()
  }
})

test("B46 server 重启（run 在途）⇒ 启动收尾：interrupted + 审计行 + 凭据按模式（弃 ⇒ 零化）∥ 在途私钥文件同清", async () => {
  const ssh = makeFakeSsh(() => ({ code: 0 }))
  // 首回合跑探明（触发 keyfile 落盘）⇒ 次回合模型挂起（任务在途）
  const app = await startAgentApp({ ssh, turns: [probeTurn(), () => new Promise(() => {})], budget: { maxCalls: 5, maxDurationMs: 60000 } })
  try {
    const started = await submit(app, baseBody({ name: "node-restart", credentialMode: "burn", auth: { kind: "key", secret: "-----BEGIN OPENSSH PRIVATE KEY-----\nfake-key-material\n-----END OPENSSH PRIVATE KEY-----\n" } }))
    assert.equal(started.json.run.status, "running", "在途（running）")
    const keyFile = join(app.dir, ".ssh", `onboarding-${started.json.run.id}.key`)
    for (let i = 0; i < 300 && !existsSync(keyFile); i++) await new Promise((resolve) => setTimeout(resolve, 20))
    assert.equal(existsSync(keyFile), true, "在途时私钥文件在盘（key 认证形——用完即弃待收尾）")
    assert.equal(ssh.calls[0].args.includes("BatchMode=yes"), true, "密钥径保持 `BatchMode=yes`（不弹交互——口令径去而不动此径）")
    // 重启面：重新注册（= 进程重启的启动收尾点）
    const routes2 = SERVER.createRouteTable()
    SANDBOX.registerSandboxRoutes(routes2, { db: app.db, config: app.config, log: null, deps: app.deps })
    const row = app.db.prepare("SELECT * FROM sandbox_onboarding WHERE id = ?").get(started.json.run.id)
    assert.deepEqual([row.status, row.credential_state, row.secret_cipher], ["interrupted", "burned", null], "启动收尾：interrupted + 凭据零化（弃模式）")
    assert.equal(existsSync(keyFile), false, "中断收尾同清私钥文件（用完即弃不含中断径）")
    assert.equal(app.audits("onboarding_failed").length, 1, "审计行（中断如实收尾）")
    const detail = await call(app.base, "GET", `/api/admin/sandbox/onboarding/${row.id}`, { cookie: app.adminCookie })
    assert.equal(detail.json.run.status, "interrupted", "控制台如实示「被中断」")
    assert.match(detail.json.run.steps.at(-1).readings.reason, /中断/, "S8 读数携中断原因")
  } finally {
    await app.close()
  }
})

// ── 腿 F（Docker 客户端缓存驱逐）────────────────

test("腿 F Docker 客户端缓存驱逐：首打失败（微态）⇒ 自愈后重试命中真值（不被陈旧 rejection 拦住）", async () => {
  const engine = await startFakeDocker()
  const ssh = makeFakeSsh(() => ({ code: 0 }))
  let flaky = true
  // 微态传输：首个请求抛（不可达），其后透传真 fetch——端点均指向本机假引擎（零外网触）
  const flakyFetch = async (url, init) => {
    if (flaky) {
      flaky = false
      throw new Error("ECONNREFUSED（微态）")
    }
    return fetch(url, init)
  }
  const app = await startAgentApp({
    ssh,
    extraDeps: { fetchImpl: flakyFetch },
    turns: [
      turnCall("docker", { host: "10.0.0.5", op: "info", args: { endpoint: engine.base }, step: "S2" }, { content: "先探 API（此刻监听未开）。" }),
      turnCall("docker", { host: "10.0.0.5", op: "info", args: { endpoint: engine.base }, step: "S6" }, { content: "监听已在 ⇒ 重试同一端点。" }),
      turnCall("report", { ok: true, summary: "已就绪", step: "S8" }),
    ],
  })
  try {
    const started = await submit(app, baseBody({ name: "node-cache" }))
    const run = await waitRun(app, started.json.run.id)
    assert.equal(run.status, "succeeded", "终态 succeeded")
    const audits = app.audits("onboarding_exec")
    const auditS2 = audits.find((row) => JSON.parse(row.detail).step === "S2")
    const auditS6 = audits.find((row) => JSON.parse(row.detail).step === "S6")
    assert.equal(JSON.parse(auditS2.detail).resultCode, -1, "首打失败（微态）在案")
    assert.equal(JSON.parse(auditS6.detail).resultCode, 200, `自愈后重试命中真值（失败不入缓存）——实录：${JSON.stringify(audits.map((row) => JSON.parse(row.detail).summary))}`)
  } finally {
    await app.close()
    await engine.close()
  }
})

// ── 腿：v13 迁移六条（STORE.md §2 v13 段判据）─────────────────────────────────

test("v13 建表：空库直落 14 ∥ v12 库升后 14 ∥ 幂等 ∥ 十八列在场 ∥ 凭据读写往返（密文 ≠ 明文 ∥ 零化后 NULL）∥ 状态 CHECK 四值放行/越值拒", async () => {
  const file = join(tempRoot, "v13.db")
  const fresh = DB.openDatabase(file)
  assert.equal(DB.readVersion(fresh), 14, "空库直落 14")
  const cols = fresh.prepare("PRAGMA table_info(sandbox_onboarding)").all().map((row) => row.name)
  assert.equal(cols.length, 18, `列面十八列在场（实 ${cols.length}）`)
  for (const name of ["host", "ssh_port", "ssh_user", "auth_kind", "secret_cipher", "sudo_cipher", "credential_mode", "credential_state", "name", "model", "status", "step", "steps_json", "runner_id", "created_by", "created_at", "finished_at"]) {
    assert.equal(cols.includes(name), true, `列在场：${name}`)
  }
  fresh.close()
  // v12 库升后 = 14
  const file12 = join(tempRoot, "v12.db")
  const v12 = DB.openDatabase(file12, { migrations: DB.MIGRATIONS.slice(0, 12) })
  assert.equal(DB.readVersion(v12), 12)
  v12.close()
  const upgraded = DB.openDatabase(file12)
  assert.equal(DB.readVersion(upgraded), 14, "v12 库升后读数 14")
  upgraded.close()
  // 幂等（再开零变）
  const reopened = DB.openDatabase(file12)
  assert.equal(DB.readVersion(reopened), 14, "v13/v14 段幂等（再开零变）")
  assert.equal(reopened.prepare("PRAGMA table_info(sandbox_onboarding)").all().length, 18, "再开列面零变")
  // 凭据读写往返（密文 ≠ 明文 ∥ 零化后 NULL）
  const key = ONBOARDING.loadOrCreateCredentialKey(join(tempRoot, "v13-credentials.key"))
  const cipher = ONBOARDING.encryptSecret(SECRET, key)
  assert.equal(cipher.includes(SECRET), false, "密文 ≠ 明文")
  assert.equal(ONBOARDING.decryptSecret(cipher, key), SECRET, "解密往返")
  const iso = new Date().toISOString()
  reopened
    .prepare("INSERT INTO sandbox_onboarding (host, ssh_user, auth_kind, secret_cipher, credential_mode, credential_state, model, status, steps_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run("10.0.0.7", "ops", "key", cipher, "keep", "sealed", MODEL, "succeeded", "[]", iso)
  const rowId = reopened.prepare("SELECT id FROM sandbox_onboarding ORDER BY id DESC LIMIT 1").get().id
  assert.equal(reopened.prepare("SELECT secret_cipher FROM sandbox_onboarding WHERE id = ?").get(rowId).secret_cipher, cipher, "密文入库往返")
  reopened.prepare("UPDATE sandbox_onboarding SET secret_cipher = NULL WHERE id = ?").run(rowId)
  assert.equal(reopened.prepare("SELECT secret_cipher FROM sandbox_onboarding WHERE id = ?").get(rowId).secret_cipher, null, "零化后 NULL")
  // 状态 CHECK 四值放行 / 越值拒
  for (const status of ["running", "succeeded", "failed", "interrupted"]) {
    assert.doesNotThrow(() => {
      reopened.prepare("UPDATE sandbox_onboarding SET status = ? WHERE id = ?").run(status, rowId)
    }, `四值放行：${status}`)
  }
  assert.throws(() => {
    reopened.prepare("UPDATE sandbox_onboarding SET status = 'bogus' WHERE id = ?").run(rowId)
  }, /CHECK/, "越值拒")
  reopened.close()
})

test("腿 E（链自检）：`prepublishOnly` 含本批两件（`includes` 形）∥ sshpass 前检人话在场", async () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))
  for (const file of ["docs/batches/2026-10-10-runner-admin-console.test.mjs", "docs/batches/2026-10-10-runner-admin-console-agent.test.mjs"]) {
    assert.equal(pkg.scripts.prepublishOnly.includes(file), true, `链含本批件：${file}`)
  }
  assert.equal(pkg.dependencies["@thincoder/core"] !== undefined, true, "核依赖声明在场（KD-SV-78——运行期动载前提）")
  assert.equal(AGENT_TOOLS.TOOL_NAMES.length === 5 && AGENT_TOOLS.maskSecrets("x-" + SECRET + "-y", [SECRET]) === "x-***-y", true, "掩蔽件在场（秘密掩蔽后入审计/日志）")
  assert.equal(SSH.SSH_COMMAND_TIMEOUT_S > 0 && typeof SSH.createSshExecutor === "function", true, "SSH 传输件在场（系统 openssh——KD-SV-85）")
})
