/**
 * 2026-10-07-browser-async-fix.b.test.mjs — 批内件单测（**B 腿**：T34–T43（含 T43 Stop 收尾面）· 实施舱 B）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-async-fix.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §2.11（异步通道）∥ §2.9（后台动作仍受动作预算）∥ §2.10（外部关闭在飞 ⇒ 同因由结算）∥ §7（F-BT18/F-BT19）
 * ∥ §8（U57–U60）。
 *
 * 缝纪律（§7 N-BT6）：同 A 腿——假 `WebSocketImpl`（挂死开关 ∥ 断连面）+ `_deps` 替身（开启 ∥ 杀树 ∥ 落盘）；
 * 缺省回落真实现（`??`），用例 `finally` 还原；本件零真实浏览器、零真实 profile、零真实文件写。
 * kill 两态经 `browser/session.mjs` `runAction` 的 `{signal}` 缝（批最小增补两参）验收——先红后绿读数入批档 §5。
 * 档位：本档 = B 腿自持（A 腿另档 `2026-10-07-browser-async-fix.test.mjs`）——拆因 = 单档越 500 硬限
 * （评审轮 1 must-fix；先例 = `2026-10-04-issue-fix-round1.a/.b.test.mjs`）。
 * 跑法（仓根 `thincoder/`，cwd 无关）：node --test docs/batches/2026-10-07-browser-async-fix.b.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"

import { browserTool } from "../../thincoder-core/tools/browser.mjs"
import { connectCdp } from "../../thincoder-core/browser/cdp.mjs"
import * as session from "../../thincoder-core/browser/session.mjs"

// ── 假传输（`WebSocketImpl` 缝）：`hang` = 挂死型（命令不应答）；`drop()` = 外部关窗（WS onclose 面）──
let HANG = false
let PAGE = null
let SOCKETS = []

class FakeWebSocket {
  constructor(url) {
    this.url = url
    this.sent = []
    SOCKETS.push(this)
    queueMicrotask(() => this.onopen?.())
  }
  send(raw) {
    const msg = JSON.parse(raw)
    this.sent.push(msg)
    if (HANG) return // 挂死型：不应答——预算到点由动作控制器裁决（§2.9）
    let reply
    try { reply = PAGE.respond(msg) } catch (e) { reply = { error: { message: String(e?.message ?? e) } } }
    if (!reply) return
    queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({ id: msg.id, ...reply }) }))
  }
  drop() { this.onclose?.({ code: 1006 }) } // 外部关闭 = 真 ws 的 onclose 面（§2.10 源②）
}

const evalOk = (value) => ({ result: { result: { type: value === null ? "object" : typeof value, value } } })

/** 假页：会话开启 / 页信息 / 快照 / 心跳应答（默认 readyState = complete）。 */
function fakePage(opts = {}) {
  return {
    url: opts.url ?? "http://a.test/",
    title: opts.title ?? "Fixture",
    readyState: opts.readyState ?? "complete",
    respond(msg) {
      const { method, params = {} } = msg
      if (method === "Browser.getVersion") return { result: { protocolVersion: "1.3" } }
      if (method === "Page.navigate") { this.url = params.url; return { result: { frameId: "F1" } } }
      if (method !== "Runtime.evaluate") return { result: {} }
      const e = String(params.expression ?? "")
      if (e.includes("thincoder-browser:pageinfo")) return evalOk({ url: this.url, title: this.title, readyState: this.readyState })
      if (e.includes("thincoder-browser:snapshot")) return evalOk({ url: this.url, title: this.title, elements: [], total: 0 })
      return evalOk(undefined)
    },
  }
}

/** 装缝：开浏览器替身（真 `connectCdp` + 假 `WebSocketImpl`）∥ 杀树替身 ∥ 落盘替身。 */
function installFake(page) {
  PAGE = page
  SOCKETS = []
  HANG = false
  const opened = []
  const killed = []
  const prev = { ...session._deps }
  let child = null
  let cdp = null
  session._deps.openBrowser = async (o) => {
    opened.push(o)
    cdp = await connectCdp("ws://fake-tab", { WebSocketImpl: FakeWebSocket })
    child = new EventEmitter() // 有事件面（exit/error 可模拟——§2.10 源①）
    child.pid = 4200 + opened.length
    child.exitCode = null
    child.signalCode = null
    return { cdp, child, headless: o.headless }
  }
  session._deps.killBrowser = (c) => { killed.push(c); c.exitCode = 0 }
  session._deps.saveShot = async (buf) => ({ path: "/fake/shots/shot-1.png", bytes: buf.length })
  return {
    opened, killed, page,
    get child() { return child },
    get cdp() { return cdp },
    get ws() { return SOCKETS[SOCKETS.length - 1] },
    get calls() { return SOCKETS[SOCKETS.length - 1]?.sent ?? [] },
    set hang(v) { HANG = v },
    async restore() {
      HANG = false
      if (child && child.exitCode === null) child.exitCode = 0 // 优雅关后自退（免 waitForExit 等满 3s）
      await session.closeSession()
      Object.assign(session._deps, prev)
      PAGE = null
      SOCKETS = []
    },
  }
}

/** 装缝 → 跑体 → 还原（缝纪律的单点落面：用例 `finally` 还原）。 */
async function withPage(page, body) {
  const fix = installFake(page)
  try { return await body(fix) } finally { await fix.restore() }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/** 挂起型断言的守卫（机制失效 ⇒ 快速失败；判据 = 回执文本，非墙钟界——§2.5 E2①）。 */
function guarded(promise, ms = 2000) {
  let timer = null
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)
  })
  return Promise.race([promise, guard]).finally(() => { if (timer) clearTimeout(timer) })
}

const run = (action, args = {}, ctx = { agent: { config: {} } }) => browserTool.execute({ action, ...args }, ctx)

// ══ B 腿（实施舱 B——异步通道 T34–T43；F-BT18 ∥ N-BT10 ∥ U57–U60）══════════════════════════════
import { BROWSER_TASK_MAX, browserTaskDone, browserTaskEntry, killBrowserTask, launchBrowserTask } from "../../thincoder-core/agent-tools/browser-async.mjs"
import { tombstoneOf } from "../../thincoder-core/agent-tools/async-settle.mjs"
import { parseWaitForCondition, processTool } from "../../thincoder-core/tools/ops.mjs"

/** B 腿父形：agent 载体（池 / pending / 墓碑 / history 挂它）+ 工具 ctx。 */
function bctx() {
  const agent = { history: [] }
  return { agent, ctx: { agent, depth: 0 } }
}

/** CDP 已发命令计数（执行计数 / 在飞判据）：navigate 的首命令 = `Page.navigate` 携唯一 url（可归因——
 * 挂死型假传输下后续命令不来，页面表达式不能判「起执行」）。 */
const navigateCount = (fix, url) => fix.calls.filter((c) => c.method === "Page.navigate" && c.params?.url === url).length

// ── T34–T35 起跑 ∥ 结算 ∥ 摘要文法（U57/E3①②③/N-BT10）──────────────────────

test("T34 起跑 ack：即时返回 + 池含条目 + 调用方未被动作阻塞（U57/E3①②）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    const receipt = await browserTool.execute({ action: "navigate", url: "http://a.test/", async: true }, ctx)
    assert.match(receipt, /^browser#\d+ started \(running\) — navigate http:\/\/a\.test\/$/, `ack 形（§2.11）：${receipt}`)
    const id = Number(receipt.match(/^browser#(\d+)/)[1])
    const entry = browserTaskEntry(agent, id)
    assert.ok(entry, "池 _browserTasks 含条目（E3②）")
    assert.equal(entry.role, "browser")
    assert.equal(entry.status, "running")
    assert.ok(!("async" in entry.args), "async 参不入动作参数面")
    assert.equal(entry.done, false, "ack 即返——调用方未被动作阻塞（E3①）")
    assert.ok(agent._browserTasks instanceof Map && agent._browserTasks.has(String(id)))
    assert.equal(browserTaskDone(agent, id), false, "在途未 done（wait 判据）")
    await entry.promise
    assert.equal(fix.opened.length, 1)
  })
})

test("T35 结算：出池 ∥ 恒停靠 pending ∥ 摘要文法（ok）∥ 注入分发单点（U57/E3③/N-BT10）", async () => {
  await withPage(fakePage({}), async () => {
    const { agent, ctx } = bctx()
    const launched = await launchBrowserTask(agent, ctx, { action: "navigate", url: "http://a.test/", async: true })
    const entry = browserTaskEntry(agent, launched.id)
    await entry.promise
    assert.equal(browserTaskEntry(agent, launched.id), null, "结算 ⇒ 出池（E3③）")
    assert.equal(browserTaskDone(agent, launched.id), true, "出池即 done（wait 判据——出池口径）")
    assert.ok((agent._pendingAsyncResults ?? []).includes(entry), "恒停靠 _pendingAsyncResults")
    const { injectAsyncResult } = await import("../../thincoder-core/agent-tools/subagent-async.mjs")
    await injectAsyncResult(agent, entry)
    const msg = String(agent.history.at(-1).content)
    assert.match(msg, /^\[System reminder: background browser#\d+ finished — navigate http:\/\/a\.test\/ \(ok, [\d.]+s\)\]\n\[navigate\] http:\/\/a\.test\//, `摘要文法（§2.11）：${msg.slice(0, 160)}`)
    assert.deepEqual(tombstoneOf(agent, launched.id), { status: "consumed", role: "browser" }, "消费即墓碑")
    agent._pendingAsyncResults.length = 0
  })
})

// ── T36 在飞外部关闭 ⇒ 摘要 failed 必达（U58/E4③）────────────────────────────

test("T36 在飞遇外部关闭 ⇒ 摘要 failed 必达 + 下一动作自愈重开（U58/E4③）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" }) // 会话先立（同步径）
    fix.hang = true
    const launched = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: "1" })
    const entry = browserTaskEntry(agent, launched.id)
    await tick()
    fix.ws.drop() // 外部关闭 = 真 ws 的 onclose 面（§2.10 源②）
    await entry.promise
    assert.equal(entry.receipt, null)
    assert.equal(entry.error, "the browser session was closed externally (the connection to the browser dropped) — run the action again to reopen a fresh session")
    assert.ok((agent._pendingAsyncResults ?? []).includes(entry), "摘要 failed 必达（不吞）")
    fix.hang = false
    const next = await run("snapshot", {})
    assert.match(next, /\n\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]$/, "下一动作自愈重开 + 注记")
    assert.equal(fix.opened.length, 2, "干净重开（同 profile）")
    const { injectAsyncResult } = await import("../../thincoder-core/agent-tools/subagent-async.mjs")
    await injectAsyncResult(agent, entry)
    const msg = String(agent.history.at(-1).content)
    assert.match(msg, /\(failed: the browser session was closed externally \(the connection to the browser dropped\) — run the action again to reopen a fresh session, [\d.]+s\)/, `摘要 failed 形：${msg.slice(0, 200)}`)
    assert.deepEqual(tombstoneOf(agent, launched.id), { status: "failed", role: "browser" })
    agent._pendingAsyncResults.length = 0
  })
})

// ── T37–T38 kill 两态（U59/E3④/N-BT10）∥ T39 帽（U60/E3⑤）────────────────────

test("T37 kill·queued 丢队：从未运行（执行计数 0）+ 墓碑 + 无摘要 + 幂等（U59/E3④）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true // 占队件：挂死型（预算 400ms 内恒在飞）——置受害件于排队位
    const holder = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: "T37HOLD", timeoutMs: 400 })
    const victim = await launchBrowserTask(agent, ctx, { action: "navigate", url: "http://t37.test/mark", timeoutMs: 2000 })
    assert.equal(browserTaskEntry(agent, victim.id).done, false)
    assert.deepEqual(killBrowserTask(agent, victim.id), { id: String(victim.id), status: "cancelled" })
    assert.deepEqual(killBrowserTask(agent, victim.id), { id: String(victim.id), status: "cancelled" }, "重复 = 幂等（墓碑同确认）")
    await victim.entry.promise
    await holder.entry.promise // 队首收尾 ⇒ 受害件的排队位已过（若存活定已执行）
    assert.equal(navigateCount(fix, "http://t37.test/mark"), 0, "丢队——动作从未执行（执行计数 0，E3④ queued）")
    assert.equal(browserTaskEntry(agent, victim.id), null, "出池")
    assert.equal(browserTaskDone(agent, victim.id), true, "出池即 done")
    assert.equal((agent._pendingAsyncResults ?? []).filter((e) => e.id === victim.id).length, 0, "取消 ⇒ 无摘要")
    assert.deepEqual(tombstoneOf(agent, victim.id), { status: "cancelled", role: "browser" }, "墓碑 cancelled")
    fix.hang = false
  })
})

test("T38 kill·running：动作即时展开（下一事件循环内）+ 结算 cancelled + 不杀浏览器（U59/N-BT10）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const launched = await launchBrowserTask(agent, ctx, { action: "navigate", url: "http://t38.test/mark", timeoutMs: 1500 })
    const entry = browserTaskEntry(agent, launched.id)
    await tick()
    assert.equal(navigateCount(fix, "http://t38.test/mark"), 1, "动作在飞（首命令已达——挂死型不回）")
    const received = await processTool.execute({ action: "kill", id: launched.id }, { agent }) // ops id 路由（先 bg 后 browser）
    assert.equal(received, `cancelled background browser#${launched.id} — a queued task is dropped, a running one is aborted (the browser itself is not killed); no digest will arrive`)
    await tick()
    assert.equal(entry.done, true, "即时展开——下一事件循环内（确定性判据，非墙钟界）")
    assert.equal(browserTaskEntry(agent, launched.id), null, "出池")
    assert.equal((agent._pendingAsyncResults ?? []).length, 0, "取消 ⇒ 无摘要")
    assert.deepEqual(tombstoneOf(agent, launched.id), { status: "cancelled", role: "browser" })
    fix.hang = false
    const after = await guarded(run("snapshot", {}))
    assert.match(after, /^\[page\] http:\/\/a\.test\//, "在飞已展开——队列不滞留僵尸（下一动作即达）")
    assert.equal(fix.killed.length, 0, "不杀浏览器（KD-23）")
    assert.equal(fix.opened.length, 1, "不重开会话")
  })
})

test("T39 帽：第 5 条起跑显式拒 + 释放后可再起跑（U60/E3⑤）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const live = []
    for (let i = 0; i < BROWSER_TASK_MAX; i++) {
      const l = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: `T39MARK${i}` })
      assert.ok(!l.error, String(l.error))
      live.push(l)
    }
    const over = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: "T39OVER" })
    assert.match(String(over.error), /^browser task cap reached \(4\/4 running: browser#\d+(, browser#\d+)*\)/, "第 5 条显式拒（E3⑤）")
    assert.equal(agent._browserTasks.size, 4, "拒发不动池（零静默丢）")
    for (const l of live) assert.equal(killBrowserTask(agent, l.id).status, "cancelled")
    await Promise.all(live.map((l) => l.entry.promise))
    assert.equal(agent._browserTasks.size, 0, "逐条释放（running abort + queued 丢队）")
    fix.hang = false
    const again = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: "1" })
    assert.ok(!again.error, String(again.error))
    await again.entry.promise
    assert.equal(again.entry.error, null)
    assert.match(String(again.entry.receipt), /^\[evaluate @ http:\/\/a\.test\/\]/)
  })
})

// ── T40 失败终态必达（N-BT10）∥ T41 depth 门 + 子代删参 + kill 终止面（E3⑥/U59）─────

test("T40 失败终态必达：谓词超时（resolve 形失败回执）⇒ 摘要 failed 必达 + 墓碑 failed（N-BT10）", async () => {
  await withPage(fakePage({}), async () => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    const launched = await launchBrowserTask(agent, ctx, { action: "wait", selector: "#never", timeoutMs: 300 })
    const entry = browserTaskEntry(agent, launched.id)
    await entry.promise
    assert.match(String(entry.receipt), /^Error: wait timed out after 300ms \(selector "#never"\)\n\[page\] /, "resolve 形失败回执（模型面失败形）")
    assert.ok((agent._pendingAsyncResults ?? []).includes(entry), "失败终态必达（不吞）")
    const { injectAsyncResult } = await import("../../thincoder-core/agent-tools/subagent-async.mjs")
    await injectAsyncResult(agent, entry)
    const msg = String(agent.history.at(-1).content)
    assert.match(msg, /^\[System reminder: background browser#\d+ finished — wait #never \(failed: wait timed out after 300ms \(selector "#never"\), [\d.]+s\)\]/, `摘要 failed 形：${msg.slice(0, 200)}`)
    assert.deepEqual(tombstoneOf(agent, launched.id), { status: "failed", role: "browser" })
    agent._pendingAsyncResults.length = 0
  })
})

test("T41 depth 门 + 子代 schema 删参 + kill 终止面（E3⑥/U59）", async () => {
  const { agent } = bctx()
  // ① depth 第二道（运行期拒——不静默转同步）
  const denied = await browserTool.execute({ action: "evaluate", expression: "1", async: true }, { agent, depth: 1 })
  assert.equal(denied, "Error: browser async is depth-0 only — a child agent has no background task pool (run the action synchronously)")
  assert.equal(agent._browserTasks?.size ?? 0, 0, "拒 ⇒ 零副作用（不入池 / 不取号）")
  // ② 子代 schema 删参（主门——恒新数组，父表零触）
  const { excludeSubagentTools } = await import("../../thincoder-core/agent/helpers.mjs")
  const childCopy = excludeSubagentTools([browserTool]).find((t) => t.name === "browser")
  assert.ok(childCopy && !("async" in childCopy.parameters.properties), "子代副本删 async 参")
  assert.ok("async" in browserTool.parameters.properties, "父面 schema 在册")
  // ③ kill 终止面：空 id ∥ 未知 id ∥ 已结算 id ∥ wait_for 条件路由
  assert.match(String(killBrowserTask(agent, "").error), /^process kill id: requires a background browser task id/)
  assert.match(String(killBrowserTask(agent, 424242).error), /^unknown background browser task id: 424242/)
  assert.deepEqual(parseWaitForCondition("browser id:3 done"), { kind: "browser", arg: "3" })
  assert.throws(() => parseWaitForCondition("browser 3 done"), /browser id:N done/, "未知条件显式枚举")
  await withPage(fakePage({}), async () => {
    const launched = await launchBrowserTask(agent, { agent, depth: 0 }, { action: "evaluate", expression: "1" })
    const entry = browserTaskEntry(agent, launched.id)
    await entry.promise
    assert.match(String(killBrowserTask(agent, launched.id).error), new RegExp(`^unknown background browser task id: ${launched.id}`), "已结算 ⇒ 出池不可杀")
  })
})

test("T43 Stop 收尾面：discard ⇒ 墓碑 discarded + 出池 + 整批一次提醒 ∥ 竞态窗兜底停靠（E4②/N-BT10）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const sig = new AbortController()
    const actx = { agent, depth: 0, signal: sig.signal }
    const a = await launchBrowserTask(agent, actx, { action: "navigate", url: "http://t43a.test/mark", timeoutMs: 60_000 })
    const b = await launchBrowserTask(agent, actx, { action: "navigate", url: "http://t43b.test/mark", timeoutMs: 60_000 })
    await tick()
    // 收尾先见（真 Stop 序：abort 级联同步 ⇒ 收尾同拍——条目仍在池、控制器已中止）
    const { discardAbortedBrowserTasks } = await import("../../thincoder-core/agent-tools/async-discard.mjs")
    sig.abort() // 会话/回合中止（非 interrupt）——条目控制器逐链中止
    const out = discardAbortedBrowserTasks(agent)
    assert.deepEqual(out.discarded.map((d) => d.id).sort((x, y) => x - y), [a.id, b.id].sort((x, y) => x - y), "整批逐条丢弃")
    assert.equal(agent._browserTasks.size, 0, "出池")
    assert.deepEqual(tombstoneOf(agent, a.id), { status: "discarded", role: "browser" })
    await Promise.all([a.entry.promise, b.entry.promise])
    assert.equal((agent._pendingAsyncResults ?? []).filter((e) => e.role === "browser").length, 0, "收尾先见 ⇒ 无摘要（凭据 = 提醒）")
    const reminders = agent.history.filter((h) => String(h.content).includes("background browser task(s) were cancelled by the user's Stop"))
    assert.equal(reminders.length, 1, "整批一次提醒（模型可见凭据）")
    assert.match(String(reminders[0].content), new RegExp(`browser#${a.id} \\(navigate\\)`))
    // 竞态窗（条目先自行结算、收尾面未及见）⇒ 兜底支：正常两态照常停靠（摘要必达——零静默丢失）
    const sig2 = new AbortController()
    const c = await launchBrowserTask(agent, { agent, depth: 0, signal: sig2.signal }, { action: "navigate", url: "http://t43c.test/mark", timeoutMs: 60_000 })
    await tick()
    assert.equal(navigateCount(fix, "http://t43c.test/mark"), 1, "在飞")
    sig2.abort()
    await c.entry.promise
    assert.equal(browserTaskEntry(agent, c.id), null, "出池")
    assert.equal(tombstoneOf(agent, c.id), null, "未及见 ≠ 墓碑（凭据走摘要）")
    const parked = (agent._pendingAsyncResults ?? []).filter((e) => e.role === "browser")
    assert.equal(parked.length, 1, "竞态窗兜底：照常停靠（取消无摘要支不吞终态）")
    assert.match(String(parked[0].error), /^navigate cancelled \(stuck in /)
    assert.equal(discardAbortedBrowserTasks(agent).discarded.length, 0, "事后补扫 ⇒ 零丢弃零噪音")
    const { injectBrowserResult } = await import("../../thincoder-core/agent-tools/browser-async.mjs")
    await injectBrowserResult(agent, parked[0])
    assert.match(String(agent.history.at(-1).content), /^\[System reminder: background browser#\d+ finished — navigate http:\/\/t43c\.test\/mark \(failed: navigate cancelled \(stuck in [^)]+\), [\d.]+s\)\]/, "摘要必达（failed 形）")
    agent._pendingAsyncResults.length = 0
    fix.hang = false
  })
})

test("T44 外部关闭遇排队条目：未启动件不呆等 ⇒ 自愈重开后照跑（其回执携注记）（§2.10 队列格）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const { agent, ctx } = bctx()
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const holder = await launchBrowserTask(agent, ctx, { action: "evaluate", expression: "T44HOLD", timeoutMs: 800 })
    const queued = await launchBrowserTask(agent, ctx, { action: "navigate", url: "http://t44.test/mark", timeoutMs: 60_000 })
    await tick()
    assert.equal(navigateCount(fix, "http://t44.test/mark"), 0, "排在队后（尚未启动）")
    fix.ws.drop() // 外部关闭：在飞件同因由失败；排队件不呆等（§2.10 队列格）
    fix.hang = false
    await holder.entry.promise
    assert.match(String(holder.entry.error), /^the browser session was closed externally/, "在飞件即时显式失败")
    await queued.entry.promise
    assert.equal(queued.entry.error, null, "排队件照跑（不呆等）")
    assert.equal(navigateCount(fix, "http://t44.test/mark"), 1, "自愈重开后执行")
    assert.equal(fix.opened.length, 2, "干净重开一次")
    assert.match(String(queued.entry.receipt), /\n\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]$/, "其回执携重开注记")
  })
})
