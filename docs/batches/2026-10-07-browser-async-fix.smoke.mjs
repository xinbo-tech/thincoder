/**
 * 2026-10-07-browser-async-fix.smoke.mjs — 批内件冒烟（S19–S22 · 真 Edge/Chrome 无头 + 进程内 fixture 服务）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-async-fix.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §2.9（硬超时）∥ §2.10（外部关闭自愈）∥ §2.11（异步通道）∥ §7/§8（S19–S22 · U52/U55/U57/U59）。
 * 缝纪律：**零 `_deps` 替身**（走真发现 ∥ 真 spawn ∥ 真 profile ∥ 真进程事件）；S20 的「外部关闭」= 真杀
 * 本工具自启的浏览器进程树（真事件面——非模拟）。
 *
 * S19 硬超时（永不响应本地服务）⇒ 预算内显式失败 + 工具不中毒        S20 外部关闭 ⇒ 自愈重开 + 注记
 * S21 异步 ack + wait_for `browser id:N done` + 结算摘要（真链）      S22 kill（在飞）⇒ 取消确认 + 无摘要 + 浏览器仍活
 *
 * 跑法（仓根 `thincoder/`）：node docs/batches/2026-10-07-browser-async-fix.smoke.mjs
 * 副作用（真实用例面，如实登记）：真实浏览器进程 + `~/.thincoder/browser/`（profile ∥ 锁 ∥ shots）。
 */
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import net from "node:net"
import { join } from "node:path"
import { browserPaths } from "../../thincoder-core/browser/launch.mjs"
import { injectAsyncResult } from "../../thincoder-core/agent-tools/subagent-async.mjs"
import { browserTool } from "../../thincoder-core/tools/browser.mjs"
import { processTool, waitForTool } from "../../thincoder-core/tools/ops.mjs"

const results = []
let server = null
let stall = null
const stallSockets = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── fixture 服务（正常页 ∥ 永不响应服务——S19/S22 的挂死型本地面）──────────────
const PAGE = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`
async function startFixture() {
  server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
    res.end(PAGE("BT Async", '<a id="next" href="/">Next</a><p id="here">landed</p>'))
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return `http://127.0.0.1:${server.address().port}`
}
async function startStall() {
  stall = net.createServer((socket) => {
    stallSockets.push(socket) // 接受连接、永不响应
    // 客户端重置（浏览器被杀 / 跳过挂页）⇒ 零接管 = 未捕获 error 轰掉冒烟进程（实测一次）
    socket.on("error", () => { /* 重置 = 预期（挂死服务面） */ })
  })
  await new Promise((r) => stall.listen(0, "127.0.0.1", r))
  return `http://127.0.0.1:${stall.address().port}`
}

// ── 面 ──────────────────────────────────────────────────────────────────────
const agent = { config: { browser: { allowDomains: ["127.0.0.1"] } }, history: [] }
const ctx = { agent, depth: 0 }
const run = (args) => browserTool.execute(args, ctx)
const pendingOf = (id) => (agent._pendingAsyncResults ?? []).filter((e) => e.id === id)

/** 自启浏览器主进程 pid（外部关闭的杀靶——只杀本工具自启实例，绝不碰用户日常浏览器）。 */
function browserMainPid() {
  const paths = browserPaths()
  if (process.platform === "win32") {
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*--user-data-dir*' } | ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }",
    ], { encoding: "utf8", timeout: 60_000 })
    for (const line of out.split("\n")) {
      const [pid, cmd] = line.trim().split("\t")
      if (cmd && cmd.includes(`--user-data-dir=${paths.profile}`) && !cmd.includes("--type=")) return Number(pid)
    }
    throw new Error(`未找到本工具自启的浏览器主进程（profile ${paths.profile}）`)
  }
  const out = execFileSync("ps", ["-ax", "-o", "pid=,args="], { encoding: "utf8", timeout: 60_000 })
  for (const line of out.split("\n")) {
    const m = line.trim().match(/^(\d+)\s+(.+)$/)
    if (m && m[2].includes(`--user-data-dir=${paths.profile}`) && !m[2].includes("--type=")) return Number(m[1])
  }
  throw new Error(`未找到本工具自启的浏览器主进程（profile ${paths.profile}）`)
}
/** 外部杀树（真关闭——进程事件面；win32 taskkill /T /F ∥ POSIX 组杀）。 */
function killTree(pid) {
  if (process.platform === "win32") execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" })
  else { try { process.kill(-pid, "SIGKILL") } catch { process.kill(pid, "SIGKILL") } }
}

async function step(id, title, fn) {
  try { const note = await fn(); results.push([id, true, note]); console.log(`[ok]   ${id} ${title} — ${note}`) }
  catch (e) { results.push([id, false, e.message]); console.log(`[FAIL] ${id} ${title} — ${e.message}`) }
}

let BASE = ""
let STALL = ""
try {
  BASE = await startFixture()
  STALL = await startStall()
  console.log(`[svc] fixture = ${BASE} · stall = ${STALL}`)

  // S19 硬超时：永不响应服务 ⇒ 预算内显式失败（携卡点步名）+ 其后动作照常（U52/E1）
  await step("S19", "硬超时（永不响应本地服务）+ 工具不中毒", async () => {
    const started = Date.now()
    const r = await run({ action: "navigate", url: `${STALL}/`, timeoutMs: 6000 })
    const elapsed = Date.now() - started
    assert.match(r, /^Error: navigate timed out after 6000ms \(stuck in [^)]+\) — retry the action, or run `close` to reset the session$/, r)
    assert.ok(elapsed <= 11_000, `预算内返回（实测 ${elapsed}ms）`)
    const after = await run({ action: "navigate", url: `${BASE}/` })
    assert.match(after, /^\[navigate\] /, "其后动作照常（不中毒）")
    assert.match(after, /"BT Async"/)
    return `${elapsed}ms → 超时回执「${r.split("\n")[0]}」；其后 navigate 照常`
  })

  // S20 外部关闭（真杀进程树）⇒ 显式失败 / 自愈重开 + 注记（U55/E2）
  await step("S20", "外部关闭（真杀树）⇒ 自愈重开 + 注记", async () => {
    await run({ action: "navigate", url: `${BASE}/` })
    const pid = browserMainPid()
    killTree(pid)
    await sleep(700) // 真进程事件面（非确定性窗——经验界 700ms）
    const first = await run({ action: "snapshot" })
    let noteLine
    if (/^Error: the browser session was closed externally/.test(first)) {
      const second = await run({ action: "snapshot" })
      assert.match(second, /\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]/, second)
      noteLine = "先显式失败 → 再重开 + 注记"
    } else {
      assert.match(first, /\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]/, first)
      noteLine = "重开 + 注记"
    }
    const again = await run({ action: "snapshot" })
    assert.ok(!again.includes("[note:"), "注记置位一次（U56）")
    return `${noteLine}；再下一动作无注记`
  })

  // S21 异步 ack + wait_for 判据 + 结算摘要（U57/E3）
  await step("S21", "异步 ack + wait_for 「browser id:N done」 + 摘要注入", async () => {
    const ack = await run({ action: "navigate", url: `${BASE}/`, async: true })
    const m = /^browser#(\d+) started \(running\) — navigate /.exec(ack)
    assert.ok(m, `ack 形（§2.11）：${ack}`)
    const id = Number(m[1])
    const waited = await waitForTool.execute({ condition: `browser id:${id} done`, timeout_ms: 30_000 }, ctx)
    assert.match(waited, /^wait_for: condition satisfied/, waited)
    assert.equal(agent._browserTasks?.size ?? 0, 0, "结算 ⇒ 出池")
    const pend = pendingOf(id)
    assert.equal(pend.length, 1, "恒停靠 pending（摘要必达）")
    await injectAsyncResult(agent, pend[0])
    const msg = String(agent.history.at(-1).content)
    assert.match(msg, /^\[System reminder: background browser#\d+ finished — navigate .*\(ok, [\d.]+s\)\]\n\[navigate\]/, `摘要文法（§2.11）：${msg.slice(0, 160)}`)
    agent._pendingAsyncResults.length = 0
    return `${ack} → ${msg.split("\n")[0]}`
  })

  // S22 kill（在飞）⇒ 取消确认 + 无摘要 + 浏览器仍活（U59/KD-23）
  await step("S22", "kill（在飞）⇒ 取消确认 + 无摘要 + 浏览器仍活", async () => {
    const ack = await run({ action: "navigate", url: `${STALL}/`, async: true, timeoutMs: 60_000 })
    const id = Number(/^browser#(\d+)/.exec(ack)[1])
    await sleep(600) // 起执行窗（在飞——真窗）
    const killed = await processTool.execute({ action: "kill", id }, ctx)
    assert.equal(killed, `cancelled background browser#${id} — a queued task is dropped, a running one is aborted (the browser itself is not killed); no digest will arrive`, killed)
    const again = await processTool.execute({ action: "kill", id }, ctx)
    assert.equal(again, killed, "重复 = 幂等（墓碑同确认）")
    await sleep(300)
    assert.equal(agent._browserTasks?.size ?? 0, 0, "出池")
    assert.equal(pendingOf(id).length, 0, "取消 ⇒ 无摘要")
    const after = await run({ action: "navigate", url: `${BASE}/` })
    assert.match(after, /"BT Async"/, "浏览器仍活（KD-23——不杀浏览器）")
    return `browser#${id} 取消确认 + 无摘要；其后 navigate 照常`
  })
} finally {
  await run({ action: "close" }).catch(() => { /* 收尾尽力 */ })
  for (const s of stallSockets) { try { s.destroy() } catch { /* 已断 */ } }
  stall?.close()
  server?.closeAllConnections?.()
  server?.close()
  const failed = results.filter(([, ok]) => !ok)
  console.log(`\n[smoke] ${results.length - failed.length}/${results.length} — failed=${failed.length}`)
  for (const [id, , note] of failed) console.log(`  ${id}: ${note}`)
  process.exitCode = failed.length ? 1 : 0
}
