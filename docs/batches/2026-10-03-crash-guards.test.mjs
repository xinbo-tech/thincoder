/**
 * 2026-10-03-crash-guards.test.mjs — 批内件（crash-guards 批 · T1–T11）
 *
 * 单测面：
 *  - #16 崩溃守卫：`thincoder-core/stream-destroy.mjs`（`destroyBody` 契约四则）+ 四消费点接线
 *    （proxy.mjs ∥ provider/sse.mjs ∥ provider/google.mjs）。
 *  - #17 退出泄漏：`thincoder-core/mcp/transport-stdio.mjs` win32 `killTree` spawnSync 同步化。
 * 覆盖口径：#16「无监听者瞬间」杀面 = T1（对照）+ T2（无消费者）+ T5（端到端）；
 *  T6/T7（sse/google 点位）= 接线零回归腿——destroy 时刻必有在场 for-await 消费者。
 *
 * 跑法（仓根）：`node --test docs/batches/2026-10-03-crash-guards.test.mjs`
 * 留存口径：随批留存 · 不进仓套件（核测试树现行无 .test.mjs 收集面）。
 *
 * 机制隔离说明（#17 控制腿 T8 —— 实跑实证，非纸面）：
 *  Windows/Node 通用行为 = libuv 把**非 detached** 子进程挂进全局 job（KILL_ON_JOB_CLOSE，
 *  libuv src/win/process.c 实读）——父进程退出即清杀「直接子进程」，从而**掩盖**「退出相位
 *  异步 taskkill 不送达」这一缺陷机制；现场泄漏发生在 cmd.exe 包装链的孙进程（npx/node 类，
 *  静默逃逸 job ⇒ 只能靠 taskkill 杀）。故：
 *   - T8 用 **detached 替身**（逃逸 job，等价于现场逃逸形态）隔离缺陷机制——异步形 ⇒ 替身存活；
 *   - T9/T10 走**生产形**（`stdioTransport("node", …)` ⇒ win32 下 cmd.exe 包装链，孙进程逃逸 job）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { PassThrough } from "node:stream"
import { spawnSync } from "node:child_process"
import { createServer, connect } from "node:net"
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href
const MOD = {
  guard: modUrl("thincoder-core/stream-destroy.mjs"),
  proxy: modUrl("thincoder-core/proxy.mjs"),
  sse: modUrl("thincoder-core/provider/sse.mjs"),
  google: modUrl("thincoder-core/provider/google.mjs"),
  transport: modUrl("thincoder-core/mcp/transport-stdio.mjs"),
}

/** 真实定时器引用（mock timers 只替换全局 setTimeout——此引用恒定） */
const REAL_TIMEOUT = globalThis.setTimeout
const delay = (ms) => new Promise((r) => REAL_TIMEOUT(r, ms))
const isDead = (pid) => { try { process.kill(pid, 0); return false } catch (e) { return e.code === "ESRCH" } }
const waitDead = async (pid, ms = 4000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (isDead(pid)) return true; await delay(50) }
  return isDead(pid)
}
const taskkill = (pid) => { try { spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }) } catch { /* cleanup */ } }
const tmp = () => mkdtempSync(join(tmpdir(), "crash-guards-"))
const writeFixture = (dir, name, code) => { const p = join(dir, name); writeFileSync(p, code); return p }
const runNode = (file, env = {}) => spawnSync(process.execPath, [file], {
  encoding: "utf8", timeout: 30000, env: { ...process.env, ...env },
})

// ── #16 · T1–T7 ──────────────────────────────────────────────────────────────

test("T1（对照 · 红）裸 destroy(err) 无监听者 ⇒ 子进程被杀（harness 自证能检出该缺陷类）", () => {
  const code = `
import { PassThrough } from "node:stream";
const body = new PassThrough();
body.destroy(new Error("t1-bare-destroy-probe"));
setTimeout(() => {}, 300);
`
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", timeout: 10000 })
  assert.notEqual(r.status, 0, "裸 destroy(err) 应触发 uncaughtException（退出码 ≠ 0）")
  assert.match(r.stderr, /Unhandled 'error' event/)
})

test("T2 destroyBody：无消费者存活 ∥ errored 保留原错误 ∥ 形态门 no-op", async () => {
  const { destroyBody } = await import(MOD.guard)
  const err = new Error("t2-probe")
  const body = new PassThrough()
  destroyBody(body, err)
  assert.equal(body.destroyed, true)
  assert.equal(body.errored, err, "errored 应为原错误对象（直传）")
  assert.ok(body.listenerCount("error") >= 1, "兜底 'error' 监听者应在位")
  destroyBody(body, new Error("t2-second")) // 已 destroyed ⇒ 显式 no-op
  assert.equal(body.errored, err, "二次调用不得换错")
  // 形态门边界：web ReadableStream（无 destroy）∥ 空 ⇒ no-op 零抛
  assert.doesNotThrow(() => destroyBody(new ReadableStream(), new Error("t2-web")))
  assert.doesNotThrow(() => destroyBody(null, err))
  assert.doesNotThrow(() => destroyBody(undefined, err))
  await delay(120) // 无兜底监听者时，未处理 'error' 已在此前杀掉本进程
  assert.ok(body.listenerCount("error") >= 1, "监听者应为**永久**（非 once——触发后不摘）")
  assert.equal(body.errored, err)
})

test("T3 destroyBody：在场 for-await 消费者仍拒原错误（行为零变）", async () => {
  const { destroyBody } = await import(MOD.guard)
  const body = new PassThrough()
  const err = new Error("t3-consumer")
  const consume = (async () => { for await (const c of body) void c })()
  await delay(30) // 消费者已挂到流上
  destroyBody(body, err)
  await assert.rejects(consume, (e) => e === err)
})

test("T4 destroyBody：迟到消费者（destroy 后起迭代）仍拒原错误（行为零变）", async () => {
  const { destroyBody } = await import(MOD.guard)
  const body = new PassThrough()
  const err = new Error("t4-late")
  destroyBody(body, err)
  const consume = (async () => { for await (const c of body) void c })()
  await assert.rejects(consume, (e) => e === err)
})

test("T5（#16 端到端）net 回环：头到齐即停 + bodyIdleMs=60 弃流 ⇒ 进程存活 ∥ errored 保留看门狗错误", async () => {
  const { streamHttpResponse } = await import(MOD.proxy)
  const server = createServer((sock) => { sock.once("data", () => { sock.write("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n") }) })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const client = connect(port, "127.0.0.1")
  try {
    const res = await streamHttpResponse(client, `http://127.0.0.1:${port}/`, {}, 5000, false, 60)
    await delay(300) // 空闲看门狗（60ms）已触发——无守卫时本进程已死
    assert.match(res.body.errored?.message ?? "", /Response body timeout \(idle\)/)
    assert.equal(res.body.errored?.abortInfo?.detail, "proxy-body-idle")
  } finally {
    client.destroy()
    server.close()
  }
})

test("T6（#16 sse 点位）readSSE 假响应 + mock timers 前推 120s ⇒ 进程存活 ∥ sse-idle 拒", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const { readSSE } = await import(MOD.sse)
  const body = new PassThrough()
  const response = { ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }), body, text: async () => "" }
  const p = readSSE(response, {})
  let settled = false
  const outcome = p.then(() => { settled = true; return "resolve" }, () => { settled = true; return "reject" })
  // 前推循环：readSSE 的 idle 定时器在异步链到达时才挂上——循环到生效为止（有界）
  for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
  assert.ok(settled, "idle 定时器未触达（120s 前推未生效）")
  assert.equal(await outcome, "reject")
  await assert.rejects(p, (e) => e?.abortInfo?.detail === "sse-idle" && /SSE idle timeout/.test(e.message))
})

test("T7（#16 google 点位 · 断代重锚 2026-10-04）chat() 桩 fetch（signal 合成 → body 终止）+ mock timers 前推 120s ⇒ 无内容 idle ⇒ 超时错误（google-sse-idle）", async (t) => {
  // 断代注（父侧 2026-10-04 · 台账 #897）：本腿原钉「idle ⇒ resolve 空结果」旧形——经 #878 收正
  // （无内容 ⇒ 超时错误）+ 直连 fetch 断流改经 IDLE_ABORT 通道（`proxy.mjs:271-274`）；原桩不认
  // signal ⇒ 读循环悬挂（settle 不到）——本重锚补：桩按 native 语义接线（abort ⇒ body 以 reason 终止）。
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const { chat } = await import(MOD.google)
  const body = new PassThrough()
  body.on("error", () => {}) // native 等价：读循环持有者收 reason；未消费窗口不逃逸
  const origFetch = globalThis.fetch
  globalThis.fetch = async (_url, init = {}) => {
    if (init?.signal) init.signal.addEventListener("abort", () => { try { body.destroy(init.signal.reason) } catch { /* gone */ } })
    return { ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }), body, text: async () => "" }
  }
  try {
    const provider = { baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.0-flash", apiKey: "test-key" }
    const p = chat(provider, { messages: [{ role: "user", content: "hi" }] })
    let settled = false
    const outcome = p.then((v) => { settled = true; return v }, (e) => { settled = true; throw e })
    outcome.catch(() => {}) // 防未处理拒绝窗口（assert.rejects 在 tick 循环后才挂载——node:test 会把窗口内拒绝直报）
    for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
    assert.ok(settled, "idle 定时器未触达（120s 前推未生效）")
    await assert.rejects(outcome, (e) => e?.abortInfo?.detail === "google-sse-idle" && /SSE idle timeout/.test(e.message), "新形：无内容 idle ⇒ 超时错误（google-sse-idle）——旧「resolve 空结果」形随 #878 退场")
  } finally {
    globalThis.fetch = origFetch
  }
})

// ── #17 · T8–T11 ─────────────────────────────────────────────────────────────

test("T8（对照 · 红）exit 相位异步 spawn(taskkill) ⇒ 逃逸替身存活（缺陷复现）",
  { skip: process.platform !== "win32" ? "win32 机制腿（taskkill）" : false }, async () => {
    const dir = tmp()
    const pidFile = join(dir, "pid.txt")
    const app = writeFixture(dir, "app-t8.mjs", `
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
// 逃逸 job 的替身（detached）——等价于 cmd.exe 包装链里静默逃逸的孙进程（npx/node 类）
const s = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore", windowsHide: true, detached: true });
s.unref();
writeFileSync(process.env.PID_FILE, String(s.pid));
process.on("exit", () => {
  // 旧形（缺陷）：退出相位异步 spawn —— taskkill 随父进程退出被一并带走（不送达）
  spawn("taskkill", ["/pid", String(s.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
});
process.exit(0);
`)
    const r = runNode(app, { PID_FILE: pidFile })
    assert.equal(r.status, 0, r.stderr)
    assert.ok(existsSync(pidFile), "替身 pid 未产出")
    const pid = Number(readFileSync(pidFile, "utf8"))
    try {
      await delay(800)
      assert.equal(isDead(pid), false, "异步形在退出相位不送达 ⇒ 替身应存活（缺陷复现）")
    } finally { taskkill(pid) }
  })

const SERVER_FIXTURE = `
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const g = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore", windowsHide: true });
writeFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, gpid: g.pid, ppid: process.ppid }));
setInterval(() => {}, 1000);
`

/** 生产形：win32 下命令非 .exe ⇒ stdioTransport 走 cmd.exe 包装链（孙进程逃逸 job——现场泄漏形态） */
const APPS = {
  exit: `
import { stdioTransport } from ${JSON.stringify(MOD.transport)};
import { existsSync } from "node:fs";
const t = stdioTransport("node", [process.env.SERVER_FILE], { PIDS_FILE: process.env.PIDS_FILE });
process.on("exit", () => { t.close(); });
const wait = setInterval(() => { if (existsSync(process.env.PIDS_FILE)) { clearInterval(wait); process.exit(0); } }, 10);
`,
  close: `
import { stdioTransport } from ${JSON.stringify(MOD.transport)};
import { existsSync } from "node:fs";
const t = stdioTransport("node", [process.env.SERVER_FILE], { PIDS_FILE: process.env.PIDS_FILE });
const wait = setInterval(() => {
  if (existsSync(process.env.PIDS_FILE)) {
    clearInterval(wait);
    t.close();                               // 非退出相位（事件循环存活）——正常路径
    setTimeout(() => process.exit(0), 500);  // 留出异步路径完成窗（修后形同步即达）
  }
}, 10);
`,
}

/** 生产形共跑：起 app（exit 相位 ∥ 存活期 close）⇒ 断言子（cmd 壳）+ 孙（server）+ 曾孙皆死 */
const runTransportCase = async (phase) => {
  const dir = tmp()
  const pidsFile = join(dir, "pids.json")
  const serverFile = writeFixture(dir, "server.mjs", SERVER_FIXTURE)
  const app = writeFixture(dir, `app-${phase}.mjs`, APPS[phase])
  const r = runNode(app, { SERVER_FILE: serverFile, PIDS_FILE: pidsFile })
  assert.ok(existsSync(pidsFile), `server 未启动成功（app exit=${r.status}）：${r.stderr}`)
  const { pid, gpid, ppid } = JSON.parse(readFileSync(pidsFile, "utf8"))
  try {
    assert.ok(await waitDead(pid), `server（孙）${pid} 应死`)
    assert.ok(await waitDead(gpid), `server 之孙 ${gpid} 应死`)
    assert.ok(await waitDead(ppid), `cmd 壳（子）${ppid} 应死`)
  } finally {
    for (const p of [pid, gpid, ppid]) if (!isDead(p)) taskkill(p)
  }
}

test("T9（#17）退出相位 stdioTransport.close() ⇒ 子 + 孙皆死（修后形）", async () => {
  await runTransportCase("exit")
})

test("T10（#17）事件循环存活期 close() ⇒ 树死（正常路径无回归）", async () => {
  await runTransportCase("close")
})

test("T11（平台门 · POSIX）同 T9 ∥ T10（非 win32 机位跑）",
  { skip: process.platform === "win32" ? "win32 机位——POSIX 腿本机 skip（设计登记：SIGTERM 送达档）" : false }, async () => {
    await runTransportCase("exit")
    await runTransportCase("close")
  })
