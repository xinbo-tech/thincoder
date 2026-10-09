/**
 * 2026-10-06-server-auto-update.test.mjs — thincoder-server 批内单测件（自动更新实施轮；名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-server-auto-update.test.mjs`
 *
 * 射程（ops/OPS.md §5.4(a)–(d)(g) ∥ §9 ∥ KD-SV-18）：① 单件（比较/形状/版本）　② 自检（`%2f` 命中 ∥ 失败静默）
 *   ③ 档位（false 零检查 ∥ 缺省 notify ∥ 启动即检 ∥ stop 清循环）　④ N14/B10（`update_available` ∥ 静默）
 *   ⑤ 自升/N15/B11（参数形 + 复读 + 回调停机；失败/超时保留旧版——含进程级 `signal:"self-update"` + 退出码 0）
 *   ⑥ B12（钉版抑制）　⑦ E12（非法拒启）∥ ready 含 `version`　⑧ converge 矩阵（七行 + 边界格；B13 回退 ∥ E13 拒启）
 *   ⑨ converge 进程级　⑩ 部署件结构 ∥ prepublishOnly 三十一件　⑪ 零依赖扫描
 * 假 npm 替身 = 临时 `.mjs`（`[node, <档>]` 命令形——跨平台；§5.4(c) 注入口径）；假 registry = 端口随机 `node:http`。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const SERVER_DIR = join(ROOT, "thincoder-server")
const BIN_PATH = join(SERVER_DIR, "bin", "thincoder-server.mjs")
const CONVERGE_PATH = join(SERVER_DIR, "deploy", "converge.mjs")
const PKG = JSON.parse(readFileSync(join(SERVER_DIR, "package.json"), "utf8"))
const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const UPDATE = await load("thincoder-server/src/ops/update.mjs")
const CONVERGE = await load("thincoder-server/deploy/converge.mjs")

const tmpDir = (tag) => mkdtempSync(join(tmpdir(), `tcsrv-upd-${tag}-`))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const installedAt = (prefix, layout = "node_modules") => join(prefix, ...layout.split("/"), "@thincoder", "server", "package.json")

/** 最小合法配置（provider ∥ embedding 指不可达地址即可——本件不动转发面）。 */
const baseConfig = (extra = {}) => ({
  host: "127.0.0.1", providers: [{ name: "mock", baseURL: "http://127.0.0.1:9/v1", apiKey: "", models: ["m1"] }],
  embedding: { baseURL: "http://127.0.0.1:9/v1", model: "bge-m3" }, ...extra,
})

function writeConfig(dir, config) {
  const file = join(dir, "config.json")
  writeFileSync(file, typeof config === "string" ? config : JSON.stringify(config, null, 2))
  return file
}

/** 捕获日志器（行 = `{ level, event, ...fields }`）。 */
function makeLog() {
  const lines = []
  const push = (level) => (event, fields) => lines.push({ level, event, ...(fields ?? {}) })
  return { lines, log: { info: push("info"), warn: push("warn"), error: push("error") } }
}

/** 假 registry（`node:http`——端口随机）：回 `{version}` ∥ status ∥ hang（不应答 ⇒ 客户端超时）。 */
async function startRegistry({ status = 200, version = "9.9.9", hang = false } = {}) {
  const requests = []
  const server = createHttpServer((req, res) => {
    requests.push({ method: req.method, url: req.url })
    if (hang) return // 不应答
    res.writeHead(status, { "content-type": "application/json" })
    res.end(JSON.stringify(status === 200 ? { name: "@thincoder/server", version } : { error: "not_found" }))
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return { base: `http://127.0.0.1:${server.address().port}`, requests, close: async () => { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) } }
}

/** 假 npm 替身（`.mjs`）：`ok` = 按目标版写前缀装位 ∥ `fail` = 退出 1 ∥ `hang` = 不退出（测超时 kill）；调用记录入 `TC_FAKE_NPM_LOG`。 */
function writeFakeNpm(dir) {
  const file = join(dir, "fake-npm.mjs")
  writeFileSync(file, [
    `import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"; import { join } from "node:path"`,
    `const args = process.argv.slice(2)`,
    `if (process.env.TC_FAKE_NPM_LOG) appendFileSync(process.env.TC_FAKE_NPM_LOG, JSON.stringify({ args, prefix: process.env.NPM_CONFIG_PREFIX ?? null }) + "\\n")`,
    `const mode = process.env.TC_FAKE_NPM_MODE ?? "ok"; if (mode === "fail") process.exit(1); if (mode === "hang") setInterval(() => {}, 1000)`,
    `const target = (args.find((a) => a.startsWith("@thincoder/server@")) ?? "").split("@").pop()`,
    `const at = join(process.env.NPM_CONFIG_PREFIX, ...(process.env.TC_FAKE_NPM_LAYOUT ?? "node_modules").split("/"), "@thincoder", "server"); mkdirSync(at, { recursive: true })`,
    `writeFileSync(join(at, "package.json"), JSON.stringify({ name: "@thincoder/server", version: target }))`,
  ].join("\n") + "\n")
  return file
}

/** 预置「已装」版本（假 npm 同布局——converge 复读探测 `lib/node_modules` ∥ `node_modules`）。 */
function plantInstalled(prefix, version, layout = "node_modules") {
  mkdirSync(join(prefix, ...layout.split("/"), "@thincoder", "server"), { recursive: true })
  writeFileSync(installedAt(prefix, layout), JSON.stringify({ name: "@thincoder/server", version }))
}

/** 子进程夹具：收集 stdout/stderr + 退出读数（env 追加面——配置/env: 引用用）。 */
function spawnNode(args, extraEnv = {}) {
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...extraEnv } })
  let stdout = "", stderr = ""
  child.stdout.on("data", (d) => { stdout += d })
  child.stderr.on("data", (d) => { stderr += d })
  const exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })))
  return { child, exited, out: () => stdout, err: () => stderr }
}

async function waitFor(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return true
    await sleep(25)
  }
  return predicate()
}

async function freePort() {
  const server = createNetServer()
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

// ── ① 单件：版本比较 ∥ 形状校验 ∥ 运行树版本 ─────────────────────────────────

test("单件：compareVersions 逐段比较 ∥ isVersionSpec 形状把关 ∥ readPackageVersion = 包版本", () => {
  assert.equal(UPDATE.compareVersions("0.1.0", "0.1.0"), 0)
  assert.equal(UPDATE.compareVersions("0.1.0", "0.2.0"), -1)
  assert.equal(UPDATE.compareVersions("0.10.0", "0.9.9"), 1)
  assert.equal(UPDATE.compareVersions("1.0.0", "1.0"), 0)
  for (const good of ["1.2.3", "0.1.0", "1.2.3-beta.1", "1.2.3+build.5"]) assert.equal(UPDATE.isVersionSpec(good), true, good)
  for (const bad of ["", "1.2.3 --x", "-x", "a b", "1.0.0;", null, 12]) assert.equal(UPDATE.isVersionSpec(bad), false, String(bad)) // 元字符/空白不得入 spawn 参数面
  assert.equal(UPDATE.readPackageVersion(), PKG.version)
})

// ── ② 自检：命中形 ∥ 静默失败面 ─────────────────────────────────────────────

test("自检：`<registry>/@thincoder%2fserver/latest`（http scheme 随 registry ∥ 尾斜杠归一）∥ 404/超时/不可达/形状不合 ⇒ 静默 null", async () => {
  const ok = await startRegistry({ version: "2.0.0" })
  const notFound = await startRegistry({ status: 404 })
  const hang = await startRegistry({ hang: true })
  const bad = await startRegistry({ version: "not a version!" })
  try {
    assert.equal(await UPDATE.checkLatest({ registry: ok.base }), "2.0.0")
    assert.deepEqual(ok.requests, [{ method: "GET", url: "/@thincoder%2fserver/latest" }]) // `%2f` 编码形
    assert.equal(await UPDATE.checkLatest({ registry: `${ok.base}/` }), "2.0.0") // 尾斜杠归一（同一 URL）
    assert.equal(await UPDATE.checkLatest({ registry: notFound.base }), null) // 404（发布前恒此形）
    assert.equal(await UPDATE.checkLatest({ registry: hang.base, timeoutMs: 200 }), null) // 超时
    assert.equal(await UPDATE.checkLatest({ registry: "http://127.0.0.1:9" }), null) // 不可达
    assert.equal(await UPDATE.checkLatest({ registry: bad.base }), null) // 形状不合
  } finally { await Promise.all([ok, notFound, hang, bad].map((r) => r.close())) }
})

// ── ③ 档位：false 零检查 ∥ 缺省 notify ∥ stop 清循环 ─────────────────────────

test("档位：`false` 零检查 ∥ 启动即检一次 ∥ 缺省 = notify ∥ `stop` 清循环", async () => {
  const reg = await startRegistry({ version: "9.9.9" })
  try {
    const { log } = makeLog()
    const off = UPDATE.createUpdater({ config: { autoUpdate: false }, log, version: "0.1.0", registry: reg.base, intervalMs: 30 })
    assert.equal(off.mode, false)
    off.start()
    await sleep(150)
    assert.equal(reg.requests.length, 0, "false 档零检查")
    assert.equal(await off.checkNow(), null)
    off.stop()
    assert.equal(UPDATE.createUpdater({ config: {}, version: "0.1.0" }).mode, "notify") // 缺省档位
    assert.equal(UPDATE.createUpdater({ config: { autoUpdate: "auto" }, version: "0.1.0", env: {} }).mode, "auto")
    const once = UPDATE.createUpdater({ config: { autoUpdate: "notify" }, log, version: "0.1.0", registry: reg.base, intervalMs: 60000 })
    once.start() // 启动即检一次（长周期隔离读数——不靠周期出现）
    assert.ok(await waitFor(() => reg.requests.length >= 1, 2000), "启动即检未起")
    once.stop()
    const base = reg.requests.length
    const loop = UPDATE.createUpdater({ config: { autoUpdate: "notify" }, log, version: "0.1.0", registry: reg.base, intervalMs: 40 })
    loop.start()
    assert.ok(await waitFor(() => reg.requests.length >= base + 2, 3000), `周期自检未起：${reg.requests.length}`)
    loop.stop()
    await sleep(150) // 在途检查收尾窗（stop 只清循环——不取消在途）
    const frozen = reg.requests.length
    await sleep(250) // 观察窗 ≫ intervalMs——循环未清则至少再 +2
    assert.equal(reg.requests.length, frozen, "stop 后不得再自检")
  } finally { await reg.close() }
})

// ── ④ N14 ∥ B10：notify 档行为 ───────────────────────────────────────────────

test("N14 ∥ B10：notify + 有新版 ⇒ warn `update_available`（不自装 ∥ 进程继续）∥ 404/超时/无新 ⇒ 静默零行", async () => {
  const dir = tmpDir("upd-n14")
  const newer = await startRegistry({ version: "2.0.0" })
  const same = await startRegistry({ version: "0.1.0" })
  const missing = await startRegistry({ status: 404 })
  const hang = await startRegistry({ hang: true })
  const npmLog = join(dir, "npm.log")
  try {
    const { lines, log } = makeLog()
    const updater = UPDATE.createUpdater({
      config: { autoUpdate: "notify" }, log, version: "0.1.0", registry: newer.base,
      npmCommand: [process.execPath, writeFakeNpm(dir)],
      env: { ...process.env, TC_FAKE_NPM_LOG: npmLog, TC_FAKE_NPM_MODE: "ok" },
      readInstalled: () => "2.0.0",
    })
    assert.deepEqual(await updater.checkNow(), { latest: "2.0.0", installed: false })
    const avail = lines.filter((l) => l.event === "update_available")
    assert.equal(avail.length, 1)
    assert.deepEqual([avail[0].current, avail[0].latest, avail[0].mode], ["0.1.0", "2.0.0", "notify"])
    assert.ok(!existsSync(npmLog), "notify 档不得自装（假 npm 零调用）")
    assert.deepEqual(await updater.checkNow(), { latest: "2.0.0", installed: false }) // 进程继续运行（再次自检仍工作）
    const before = lines.length
    const probes = [["无新（= 当前）", same.base, {}], ["404", missing.base, {}], ["超时", hang.base, { checkTimeoutMs: 200 }], ["不可达", "http://127.0.0.1:9", {}]]
    for (const [label, registry, extra] of probes) {
      assert.equal(await UPDATE.createUpdater({ config: { autoUpdate: "notify" }, log, version: "0.1.0", registry, ...extra }).checkNow(), null, label)
    }
    assert.equal(lines.length, before, "失败/404/无新 ⇒ 静默（不得出日志行）")
  } finally { await Promise.all([newer, same, missing, hang].map((r) => r.close())); rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑤ 自升执行器 ∥ N15 ∥ B11：成功 ⇒ 停机回调 ∥ 失败/超时 ⇒ 旧版续跑 ─────────

test("自升执行器 ∥ N15 ∥ B11：参数形（具体版号）+ 复读校验 + 回调 ∥ 失败/超时 ⇒ warn `update_install_failed` + 回调零次", async () => {
  const dir = tmpDir("upd-n15")
  const reg = await startRegistry({ version: "2.0.0" })
  const prefix = join(dir, "prefix")
  const npmLog = join(dir, "npm.log")
  const fake = writeFakeNpm(dir)
  try {
    const readInstalled = () => { try { return JSON.parse(readFileSync(installedAt(prefix), "utf8")).version } catch { return null } }
    const make = (extra = {}, mode = "ok") => UPDATE.createUpdater({
      config: { autoUpdate: "auto" }, version: "0.1.0", registry: reg.base, npmCommand: [process.execPath, fake],
      env: { ...process.env, NPM_CONFIG_PREFIX: prefix, TC_FAKE_NPM_LOG: npmLog, TC_FAKE_NPM_MODE: mode }, readInstalled, ...extra,
    })
    const seen = []
    const { lines, log } = makeLog()
    assert.deepEqual(await make({ log, onSelfUpdate: (v) => seen.push(v) }).checkNow(), { latest: "2.0.0", installed: true })
    assert.deepEqual(seen, ["2.0.0"]) // 自升成功 ⇒ 回调（入口接优雅停机——signal:"self-update"）
    assert.ok(lines.some((l) => l.event === "update_installed" && l.from === "0.1.0" && l.to === "2.0.0"))
    assert.deepEqual(JSON.parse(readFileSync(npmLog, "utf8").trim()).args, ["i", "-g", "@thincoder/server@2.0.0", "--no-audit", "--no-fund"]) // 版号 = 具体值
    const spec = { npmCommand: [process.execPath, fake], env: { ...process.env, NPM_CONFIG_PREFIX: prefix } }
    assert.equal((await UPDATE.installPackage("9.9.9", { ...spec, readInstalled: () => "1.2.3" })).reason, "verify") // 复读不过
    assert.equal((await UPDATE.installPackage("1.2.3 --xx", { ...spec, env: { ...process.env, TC_FAKE_NPM_LOG: join(dir, "never.log") } })).reason, "argument") // 形状门
    assert.ok(!existsSync(join(dir, "never.log")), "形状非法不得起子进程")
    const failSeen = []
    const failLog = makeLog()
    assert.deepEqual(await make({ log: failLog.log, onSelfUpdate: (v) => failSeen.push(v) }, "fail").checkNow(), { latest: "2.0.0", installed: false }) // 退出码 ≠ 0
    const warn = failLog.lines.find((l) => l.event === "update_install_failed")
    assert.equal(warn?.reason, "exit")
    assert.match(warn.message, /旧版 0\.1\.0 续跑/)
    assert.deepEqual(failSeen, [], "失败不得触发停机（旧版续跑）")
    const timeLog = makeLog()
    assert.deepEqual(await make({ log: timeLog.log, installTimeoutMs: 300 }, "hang").checkNow(), { latest: "2.0.0", installed: false }) // 超时（kill）
    assert.equal(timeLog.lines.find((l) => l.event === "update_install_failed")?.reason, "timeout")
  } finally { await reg.close(); rmSync(dir, { recursive: true, force: true }) }
})

test("N15（进程级）：auto + 假 npm 装版成功 ⇒ 优雅停机（`shutdown` `signal:\"self-update\"`）+ `stopped` + 退出码 0", async () => {
  const dir = tmpDir("upd-self")
  const reg = await startRegistry({ version: "0.2.0" })
  const prefix = join(dir, "prefix")
  const npmLog = join(dir, "npm.log")
  const fake = writeFakeNpm(dir)
  try {
    const file = writeConfig(dir, baseConfig({ port: await freePort(), autoUpdate: "auto" }))
    const harness = join(dir, "harness.mjs")
    writeFileSync(harness, [
      `import { readFileSync } from "node:fs"`,
      `import { run } from ${JSON.stringify(pathToFileURL(BIN_PATH).href)}`,
      `const readInstalled = () => { try { return JSON.parse(readFileSync(${JSON.stringify(installedAt(prefix))}, "utf8")).version } catch { return null } }`,
      `await run(["--config", ${JSON.stringify(file)}], undefined, { update: {`,
      `  registry: ${JSON.stringify(reg.base)}, npmCommand: [process.execPath, ${JSON.stringify(fake)}], readInstalled,`,
      `  env: { ...process.env, NPM_CONFIG_PREFIX: ${JSON.stringify(prefix)}, TC_FAKE_NPM_LOG: ${JSON.stringify(npmLog)}, TC_FAKE_NPM_MODE: "ok" },`,
      `} })`,
      ``,
    ].join("\n"))
    const child = spawnNode([harness])
    const guard = setTimeout(() => child.child.kill(), 20000)
    try {
      assert.equal((await child.exited).code, 0, "自升成功应优雅退出 0")
    } finally { clearTimeout(guard) }
    assert.match(child.out(), /"event":"ready".*"version":"0\.1\.0"/)
    assert.match(child.out(), /"event":"update_available"/)
    assert.match(child.out(), /"event":"update_installed"/)
    assert.match(child.out(), /"event":"shutdown".*"signal":"self-update"/)
    assert.match(child.out(), /"event":"stopped"/)
    assert.ok(existsSync(installedAt(prefix)), "假 npm 应装入前缀")
  } finally { await reg.close(); rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑥ B12：容器钉版 ⇒ 自装抑制 ───────────────────────────────────────────────

test("B12：容器钉版（TC_SERVER_VERSION=x.y.z）+ auto ⇒ 自装抑制（生效 = notify + 启动一条说明）∥ 空/`latest` 不抑制", async () => {
  const dir = tmpDir("upd-pin")
  const reg = await startRegistry({ version: "2.0.0" })
  const npmLog = join(dir, "npm.log")
  try {
    const { lines, log } = makeLog()
    const updater = UPDATE.createUpdater({
      config: { autoUpdate: "auto" }, log, version: "0.1.0", registry: reg.base, intervalMs: 40,
      npmCommand: [process.execPath, writeFakeNpm(dir)],
      env: { ...process.env, TC_SERVER_VERSION: "1.0.0", TC_FAKE_NPM_LOG: npmLog, TC_FAKE_NPM_MODE: "ok" },
      readInstalled: () => "2.0.0",
    })
    assert.equal(updater.pinned, true)
    assert.equal(updater.mode, "notify") // 生效 = notify
    updater.start()
    assert.equal(lines.filter((l) => l.event === "update_suppressed").length, 1, "启动一条说明")
    assert.ok(await waitFor(() => lines.some((l) => l.event === "update_available"), 3000))
    updater.stop()
    await sleep(150)
    assert.ok(!existsSync(npmLog), "钉版 ⇒ 自装抑制（假 npm 零调用）")
    assert.ok(!lines.some((l) => l.event === "update_installed"))
    assert.equal(UPDATE.createUpdater({ config: { autoUpdate: "auto" }, env: { TC_SERVER_VERSION: "latest" } }).pinned, false)
    assert.equal(UPDATE.createUpdater({ config: { autoUpdate: "auto" }, env: { TC_SERVER_VERSION: "latest" } }).mode, "auto")
    assert.equal(UPDATE.createUpdater({ config: { autoUpdate: "auto" }, env: { TC_SERVER_VERSION: "" } }).pinned, false)
  } finally { await reg.close(); rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑦ E12 ∥ 版本可见性：配置三值 + ready 行 ──────────────────────────────────

test("E12：autoUpdate 非法值 ⇒ 拒启（载入抛 ∥ 入口非零退出）∥ 三值放行 + 缺省 notify ∥ config.example.json 载入", async () => {
  const dir = tmpDir("cfg-update")
  try {
    for (const bad of ["yes", "off", true, 1, "AUTO"]) {
      const file = writeConfig(dir, baseConfig({ autoUpdate: bad }))
      assert.throws(() => CONFIG.loadConfig(file), /autoUpdate 非法/, `autoUpdate=${JSON.stringify(bad)}`)
    }
    const badFile = writeConfig(dir, baseConfig({ autoUpdate: "yes" }))
    const child = spawnNode([BIN_PATH, "--config", badFile])
    const guard = setTimeout(() => child.child.kill(), 15000)
    try {
      const { code } = await child.exited
      assert.equal(code, 1, `入口未以非零退出收场（code=${code}）`)
      assert.match(child.out(), /"event":"startup_failed"/)
      assert.match(child.out(), /autoUpdate 非法/)
    } finally { clearTimeout(guard) }
    for (const [value, expected] of [[undefined, "notify"], [false, false], ["notify", "notify"], ["auto", "auto"]]) {
      const file = writeConfig(dir, value === undefined ? baseConfig() : baseConfig({ autoUpdate: value }))
      assert.equal(CONFIG.loadConfig(file).config.autoUpdate, expected, `autoUpdate=${JSON.stringify(value)}`)
    }
    const example = CONFIG.loadConfig(join(SERVER_DIR, "config.example.json"), {
      env: { DEEPSEEK_API_KEY: "sk", DASHSCOPE_API_KEY: "sk", TC_SERVER_ADMIN_PASSWORD: "password123" },
    })
    assert.equal(example.config.autoUpdate, "notify") // 模板行在场且合法
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("版本可见性：入口 ready 行含 `version`（= 包版本——§5.4(g)）", async () => {
  const dir = tmpDir("ready-ver")
  try {
    const port = await freePort()
    const file = writeConfig(dir, baseConfig({ port, autoUpdate: false }))
    const child = spawnNode([BIN_PATH, "--config", file], { NPM_CONFIG_REGISTRY: "http://127.0.0.1:9" })
    try {
      assert.ok(await waitFor(() => child.out().includes('"event":"ready"')), `未见就绪日志：${child.out()} ${child.err()}`)
      const line = JSON.parse(child.out().split("\n").find((l) => l.includes('"event":"ready"')))
      assert.equal(line.version, PKG.version)
      assert.equal(line.port, port)
    } finally {
      child.child.kill()
      await child.exited
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑧ converge 判定矩阵（§5.4(d) 七行 + 边界格）──────────────────────────────

test("converge 矩阵：空 ∥ 钉（= / ≠ 装成功 / ≠ 装失败）——零网络面 ∥ 复读 ∥ 拒启三选修复 ∥ POSIX 布局", async () => {
  const dir = tmpDir("conv-a")
  const reg = await startRegistry({ version: "9.9.9" })
  const prefix = join(dir, "prefix")
  const npmLog = join(dir, "npm.log")
  const fakeNpm = [process.execPath, writeFakeNpm(dir)]
  const baseEnv = { NPM_CONFIG_PREFIX: prefix, NPM_CONFIG_REGISTRY: reg.base, TC_FAKE_NPM_LOG: npmLog, TC_FAKE_NPM_MODE: "ok" }
  const run = (env) => CONVERGE.converge({ env: { ...process.env, ...baseEnv, ...env }, npmCommand: fakeNpm, print: () => {} })
  try {
    const none = await run({ TC_SERVER_VERSION: "" }) // 行 1：空 + 无 ⇒ 拒启
    assert.equal(none.ok, false)
    assert.match(none.message, /未装 App 且未给 TC_SERVER_VERSION/)
    plantInstalled(prefix, "1.0.0")
    const empty = await run({ TC_SERVER_VERSION: "" }) // 行 2：空 + 有 ⇒ 直接运行（零网络）
    assert.deepEqual([empty.ok, empty.source, empty.version], [true, "installed", "1.0.0"])
    assert.equal(reg.requests.length, 0, "空 ⇒ 零网络")
    assert.ok(!existsSync(npmLog), "空 ⇒ 零装（假 npm 零调用）")
    const same = await run({ TC_SERVER_VERSION: "1.0.0" }) // 行 3：钉 = 已装 ⇒ 直接运行（零网络）
    assert.deepEqual([same.ok, same.source], [true, "installed"])
    assert.equal(reg.requests.length, 0)
    assert.ok(!existsSync(npmLog))
    const pinned = await run({ TC_SERVER_VERSION: "2.5.0" }) // 行 4：钉 ≠ ⇒ 装 ⇒ 复读 ⇒ 运行
    assert.deepEqual([pinned.ok, pinned.source, pinned.version], [true, "installed-now", "2.5.0"])
    const call = JSON.parse(readFileSync(npmLog, "utf8").trim().split("\n").at(-1))
    assert.deepEqual(call.args, ["i", "-g", "@thincoder/server@2.5.0", "--no-audit", "--no-fund"])
    assert.equal(call.prefix, prefix) // 装位 = 前缀（NPM_CONFIG_PREFIX 显式传入子进程）
    const refused = await run({ TC_SERVER_VERSION: "3.0.0", TC_FAKE_NPM_MODE: "fail" }) // 行 4 装失败格 ⇒ 拒启（不漂移）
    assert.equal(refused.ok, false)
    assert.match(refused.message, /三选修复/)
    for (const choice of ["联网后重试", "改钉值", "回滚旧值"]) assert.match(refused.message, new RegExp(choice), `三选修复缺：${choice}`)
    const posixPrefix = join(dir, "posix-prefix") // POSIX 布局（lib/node_modules）探测
    plantInstalled(posixPrefix, "4.0.0", "lib/node_modules")
    const found = await CONVERGE.converge({ env: { ...process.env, ...baseEnv, NPM_CONFIG_PREFIX: posixPrefix, TC_SERVER_VERSION: "" }, print: () => {} })
    assert.deepEqual([found.ok, found.source, found.version], [true, "installed", "4.0.0"])
  } finally { await reg.close(); rmSync(dir, { recursive: true, force: true }) }
})

test("converge 矩阵：latest（有/无 × 已最新/有新/不可达/装失败）——B13 回退 + 警告 ∥ E13 拒启", async () => {
  const dir = tmpDir("conv-b")
  const prefix = join(dir, "prefix")
  const npmLog = join(dir, "npm.log")
  const fakeNpm = [process.execPath, writeFakeNpm(dir)]
  /** 跑一次 converge（`latest` 形；registry 调用即收——返回 result + 查询读数）。 */
  const convergeLatest = async ({ registry, targetPrefix = prefix, mode = "ok" }) => {
    try {
      const result = await CONVERGE.converge({
        env: { ...process.env, NPM_CONFIG_PREFIX: targetPrefix, NPM_CONFIG_REGISTRY: registry.base, TC_FAKE_NPM_LOG: npmLog, TC_FAKE_NPM_MODE: mode, TC_SERVER_VERSION: "latest" },
        npmCommand: fakeNpm,
        print: () => {},
      })
      return { result, requests: registry.requests.length }
    } finally {
      await registry.close()
    }
  }
  const expectRow = (row, [ok, source, version], label) => assert.deepEqual([row.result.ok, row.result.source, row.result.version], [ok, source, version], label)
  try {
    plantInstalled(prefix, "1.0.0")
    const upToDate = await convergeLatest({ registry: await startRegistry({ version: "1.0.0" }) }) // 5a：已最新 ⇒ 运行（零装）
    expectRow(upToDate, [true, "installed", "1.0.0"], "5a")
    assert.equal(upToDate.requests, 1)
    assert.ok(!existsSync(npmLog), "已最新 ⇒ 零装")
    plantInstalled(prefix, "1.0.0")
    expectRow(await convergeLatest({ registry: await startRegistry({ version: "2.0.0" }) }), [true, "installed-now", "2.0.0"], "5b") // 有新 ⇒ 装 ⇒ 运行
    plantInstalled(prefix, "1.0.0")
    const failedInstall = await convergeLatest({ registry: await startRegistry({ version: "2.0.0" }), mode: "fail" }) // 5c：装失败 ⇒ 回退 + 警告
    expectRow(failedInstall, [true, "fallback", "1.0.0"], "5c")
    assert.ok(failedInstall.result.lines.some((l) => l.startsWith("converge: warning")), "回退须带警告行")
    const unreachable = await convergeLatest({ registry: await startRegistry({ status: 404 }) }) // 5d：不可达 ⇒ 回退 + 警告（B13）
    expectRow(unreachable, [true, "fallback", "1.0.0"], "5d")
    assert.ok(unreachable.result.lines.some((l) => l.startsWith("converge: warning") && l.includes("不可达")))
    expectRow(await convergeLatest({ registry: await startRegistry({ version: "2.0.0" }), targetPrefix: join(dir, "fresh-prefix") }), [true, "installed-now", "2.0.0"], "6a") // 无已装 + 可达 ⇒ 装 ⇒ 运行
    const emptyFail = await convergeLatest({ registry: await startRegistry({ version: "2.0.0" }), targetPrefix: join(dir, "empty-prefix"), mode: "fail" }) // 6b：装失败 ⇒ 拒启
    assert.equal(emptyFail.result.ok, false)
    assert.match(emptyFail.result.message, /无已装版本可跑/)
    const emptyUnreachable = await convergeLatest({ registry: await startRegistry({ status: 404 }), targetPrefix: join(dir, "empty-prefix-2") }) // 行 7：不可达 ⇒ 拒启
    assert.equal(emptyUnreachable.result.ok, false)
    assert.match(emptyUnreachable.result.message, /registry 不可达且无已装版本/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ── ⑨ converge（进程级） ⑩ 部署件结构 ∥ prepublishOnly 三十一件 ⑪ 零依赖扫描 ────

test("converge（进程级）：空+有 ⇒ 退出码 0 + 收敛行 ∥ 空+无 ⇒ 拒启退出码 1 + refused 行", async () => {
  const dir = tmpDir("conv-proc")
  try {
    const prefix = join(dir, "prefix")
    plantInstalled(prefix, "3.1.4")
    const okRun = spawnNode([CONVERGE_PATH], { NPM_CONFIG_PREFIX: prefix, TC_SERVER_VERSION: "" })
    assert.equal((await okRun.exited).code, 0)
    assert.match(okRun.out(), /^converge: version=3\.1\.4 source=installed$/m)
    const badRun = spawnNode([CONVERGE_PATH], { NPM_CONFIG_PREFIX: join(dir, "empty"), TC_SERVER_VERSION: "" })
    assert.equal((await badRun.exited).code, 1)
    assert.match(badRun.out(), /^converge: refused .*TC_SERVER_VERSION/m)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("部署件结构：Dockerfile 壳形（预装本地 tgz ∥ PATH ∥ USER node ∥ ENTRYPOINT）∥ compose `TC_SERVER_VERSION=${TC_SERVER_VERSION:-}` ∥ unit 前缀 env/ExecStart ∥ 入口 exec 形", () => {
  const dockerfile = readFileSync(join(SERVER_DIR, "Dockerfile"), "utf8")
  assert.match(dockerfile, /^FROM node:24-slim$/m)
  assert.match(dockerfile, /^USER node$/m)
  assert.match(dockerfile, /^ENV NPM_CONFIG_PREFIX=\/home\/node\/\.npm-global \\$/m)
  assert.match(dockerfile, /^\s+PATH=\/home\/node\/\.npm-global\/bin:\$PATH$/m) // PATH 含前缀 bin（入口 exec 依赖——§5.1）
  assert.match(dockerfile, /^RUN cd \/tmp\/build && npm pack --silent && npm i -g \.\/thincoder-server-\*\.tgz --no-audit --no-fund && rm -rf \/tmp\/build$/m) // 构建期预装（本地 tgz——零 registry 依赖）
  assert.ok(!/\bnpm i -g @thincoder\/server@/.test(dockerfile), "构建期不得走 registry 装版")
  assert.match(dockerfile, /^ENTRYPOINT \["\/app\/deploy\/docker-entrypoint\.sh"\]$/m)
  assert.match(dockerfile, /^EXPOSE 8787$/m)
  assert.match(dockerfile, /^VOLUME \/app\/data$/m)
  const entry = readFileSync(join(SERVER_DIR, "deploy", "docker-entrypoint.sh"), "utf8")
  assert.match(entry, /^#!\/bin\/sh$/m)
  assert.match(entry, /^node \/app\/deploy\/converge\.mjs \|\| exit 1$/m)
  assert.match(entry, /^exec thincoder-server --config \/app\/config\/config\.json$/m)
  const compose = readFileSync(join(SERVER_DIR, "docker-compose.yml"), "utf8")
  assert.match(compose, /^\s+- TC_SERVER_VERSION=\$\{TC_SERVER_VERSION:-\}/m) // 空态透传（留空 = 按镜像预装运行）
  assert.match(compose, /restart: unless-stopped/)
  assert.match(compose, /- "8787:8787"/)
  const unit = readFileSync(join(SERVER_DIR, "deploy", "thincoder-server.service"), "utf8")
  assert.match(unit, /^Environment=NPM_CONFIG_PREFIX=\/opt\/thincoder-server\/\.npm-global$/m)
  assert.match(unit, /^Environment=NPM_CONFIG_CACHE=\/opt\/thincoder-server\/\.npm-cache$/m)
  assert.match(unit, /^ExecStart=\/opt\/thincoder-server\/\.npm-global\/bin\/thincoder-server --config \/opt\/thincoder-server\/config\.json$/m)
  assert.match(unit, /^Restart=always$/m)
  const batchFiles = (PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? [])
  assert.equal(batchFiles.length, 32, `prepublishOnly 应列三十二件：${batchFiles.length}`)
  assert.ok(batchFiles.includes("docs/batches/2026-10-06-server-auto-update.test.mjs"), "本批件应入列")
})

test("依赖面：thincoder-server 全树 import 仅 node:/相对 ∥ package.json dependencies 空 ∥ 新档在扫面", () => {
  const files = readdirSync(SERVER_DIR, { recursive: true }).map(String).filter((rel) => rel.endsWith(".mjs"))
  for (const expected of ["src/ops/update.mjs", "deploy/converge.mjs"]) assert.ok(files.map((rel) => rel.replaceAll("\\", "/")).includes(expected), `扫描面缺 ${expected}`)
  const specifiers = []
  for (const rel of files) {
    const text = readFileSync(join(SERVER_DIR, rel), "utf8")
    for (const match of text.matchAll(/\bfrom\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
  }
  assert.ok(specifiers.length >= 8)
  for (const [rel, spec] of specifiers) assert.ok(spec.startsWith("node:") || spec.startsWith("."), `${rel} 出现非标准库 import：${spec}`)
  assert.deepEqual(PKG.dependencies ?? {}, {})
})
