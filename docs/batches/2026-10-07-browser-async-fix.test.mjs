/**
 * 2026-10-07-browser-async-fix.test.mjs — 批内件单测（**A 腿**：T27–T33（含 T27b 开启段中止）· T42 · 实施舱 A · 先红后绿）。
 * 判据表 = 批档 `docs/batches/2026-10-07-browser-async-fix.md` §2 ∥ 设计档 `docs/core/design/BROWSER-TOOL.md`
 * §2.9（动作预算 / 三层帽 / 步名）∥ §2.10（会话健康 / 外部关闭自愈）∥ §7（F-BT16–F-BT19）∥ §8（U52–U56）。
 *
 * 缝纪律（§7 N-BT6）：`WebSocketImpl`（假传输：挂死开关 ∥ 断连面）+ `_deps`（开启 ∥ 杀树 ∥ 落盘替身）——
 * 缺省回落真实现（`??`），用例 `finally` 还原；本件零真实浏览器、零真实 profile、零真实文件写。
 * B 腿（T34–T41——异步通道）由实施舱 B 追加，本件不写。
 * 跑法（仓根 `thincoder/`，cwd 无关）：node --test docs/batches/2026-10-07-browser-async-fix.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { BROWSER_ACTIONS, browserTool } from "../../thincoder-core/tools/browser.mjs"
import { CONNECT_TIMEOUT_MS, DEFAULT_CALL_TIMEOUT_MS, NEWTAB_TIMEOUT_MS, connectCdp, newTabWebSocketUrl } from "../../thincoder-core/browser/cdp.mjs"
import { ACTION_BUDGETS, BUDGET_MAX_MS, WAIT_MARGIN_MS, budgetFor } from "../../thincoder-core/browser/queue.mjs"
import * as session from "../../thincoder-core/browser/session.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "../..")
const CORE = join(REPO, "thincoder-core")
const ctx0 = () => ({ agent: { config: {} } })
const run = (action, args = {}, ctx = ctx0()) => browserTool.execute({ action, ...args }, ctx)

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
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 挂起型断言的守卫（机制失效 ⇒ 快速失败；判据 = 回执文本，非墙钟界——§2.5 E2①）。 */
function guarded(promise, ms = 2000) {
  let timer = null
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)
  })
  return Promise.race([promise, guard]).finally(() => { if (timer) clearTimeout(timer) })
}

// ── T27–T30 硬超时 ∥ 预算表 ∥ 三层帽 ∥ 步名（F-BT16 / E1）────────────────────

const HANG_CASES = [
  ["navigate", { url: "http://a.test/" }],
  ["snapshot", {}],
  ["click", { ref: "e1" }],
  ["type", { ref: "e1", text: "x" }],
  ["evaluate", { expression: "1" }],
  ["wait", { selector: "#late" }],
  ["screenshot", {}],
  ["close", {}],
  ["press", { key: "Enter" }],
  ["hover", { x: 1, y: 2 }],
  ["wheel", { deltaY: 10 }],
  ["mouse", { x: 1, y: 2 }],
  ["drag", { from: "1,2", to: "3,4" }],
  ["touch", { gesture: "tap", x: 1, y: 2 }],
  ["insert", { text: "x" }],
  ["clipboard", { op: "read" }],
]

test("T27 动作硬超时：挂死型假传输 ⇒ 十六动作逐于预算内拒绝（U52/E1①）", async () => {
  assert.deepEqual(HANG_CASES.map(([action]) => action).sort(), [...BROWSER_ACTIONS].sort(), "十六动作全体（零二次分类）")
  for (const [action, args] of HANG_CASES) {
    await withPage(fakePage({}), async (fix) => {
      if (action !== "navigate") await run("navigate", { url: "http://a.test/" }) // 会话先立（本动作在飞面挂死）
      fix.hang = true
      const budget = action === "wait" ? 150 + WAIT_MARGIN_MS : 150 // wait = 谓词帽 + 15s 余量（§2.9 表）
      const started = Date.now()
      const receipt = await guarded(run(action, { ...args, timeoutMs: 150 }), budget + 2_000)
      const elapsed = Date.now() - started
      assert.match(receipt, new RegExp(`^Error: ${action} timed out after ${budget}ms \\(stuck in [^)]+\\) — retry the action, or run \`close\` to reset the session$`), `${action}: ${receipt}`)
      assert.ok(elapsed <= budget + 1_500, `${action} 于预算内拒绝（实测 ${elapsed}ms / 预算 ${budget}ms）`)
    })
  }
})

test("T27b 开启段中止：预算落于自启序列 ⇒ 半开态处置 + 下一次动作干净重开（U52 开启段一格）", async () => {
  await withPage(fakePage({}), async (fix) => {
    const real = session._deps.openBrowser
    session._deps.openBrowser = () => new Promise(() => {}) // 挂死型自启（会话自启序列不应答）
    const r = await guarded(run("navigate", { url: "http://a.test/", timeoutMs: 150 }))
    assert.equal(r, "Error: navigate timed out after 150ms (stuck in launch browser) — retry the action, or run `close` to reset the session")
    session._deps.openBrowser = real
    const next = await run("snapshot", {}) // 下一次动作干净重开（同 profile；不中毒）
    assert.match(next, /^\[page\] http:\/\/a\.test\//)
    assert.match(next, /\n\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]$/)
    assert.equal(fix.opened.length, 1, "重开一次（开启段未成的会话不计）")
  })
})

test("T28 预算表：ACTION_BUDGETS 覆盖动作全体 ∥ timeoutMs override 逐格（U53/§2.9 表）", () => {
  assert.equal(ACTION_BUDGETS.navigate, 45_000)
  for (const action of ["click", "evaluate", "screenshot", "close", "press", "hover", "wheel", "mouse", "drag", "touch", "insert", "clipboard"]) {
    assert.equal(ACTION_BUDGETS[action], 30_000, action)
  }
  assert.equal(ACTION_BUDGETS.type, 15_000)
  assert.equal(ACTION_BUDGETS.snapshot, 15_000)
  assert.equal(ACTION_BUDGETS.wait, 45_000, "缺省 = 谓词帽 30s + 15s 余量")
  assert.deepEqual(Object.keys(ACTION_BUDGETS).sort(), [...BROWSER_ACTIONS].sort(), "覆盖 = 动作全体（逐条在册）")
  for (const action of BROWSER_ACTIONS) assert.ok(Number.isFinite(budgetFor(action, {})), action)
  assert.equal(budgetFor("wait", { timeoutMs: 150 }), 150 + WAIT_MARGIN_MS)
  assert.equal(budgetFor("wait", { timeoutMs: 999_999 }), 120_000 + WAIT_MARGIN_MS, "谓词帽硬上限 120s + 余量")
  assert.equal(budgetFor("click", { timeoutMs: 150 }), 150, "override 生效（U53）")
  assert.equal(budgetFor("click", { timeoutMs: 999_999 }), BUDGET_MAX_MS, "override 硬上限 120s（夹取）")
  assert.equal(budgetFor("click", {}), 30_000)
  assert.equal(budgetFor("click", { timeoutMs: -5 }), 30_000, "非法 override ⇒ 回落表值")
})

test("T29 三层帽：cdp.call 缺省 15s ∥ connectCdp 10s ∥ /json/new 5s（小值注入——E1③）", async () => {
  assert.equal(DEFAULT_CALL_TIMEOUT_MS, 15_000)
  assert.equal(CONNECT_TIMEOUT_MS, 10_000)
  assert.equal(NEWTAB_TIMEOUT_MS, 5_000)
  class NeverOpen { constructor() { this.onopen = null; this.onerror = null } send() {} close() {} }
  await assert.rejects(
    connectCdp("ws://no-answer", { WebSocketImpl: NeverOpen, openTimeoutMs: 30 }),
    (e) => e.message === "failed to connect to CDP at ws://no-answer (no response within 30ms)",
  )
  const hangingFetch = () => new Promise(() => {})
  await assert.rejects(
    newTabWebSocketUrl(1, { fetchImpl: hangingFetch, timeoutMs: 30 }),
    (e) => e.message === "browser did not answer /json/new within 30ms (port 1)",
  )
  HANG = true
  try {
    const client = await connectCdp("ws://fake-tab", { WebSocketImpl: FakeWebSocket })
    await assert.rejects(
      client.call("X.probe", {}, { timeoutMs: 30 }),
      (e) => e.cdpTimeout === true && /X\.probe did not respond within 30ms/.test(e.message),
    )
  } finally { HANG = false }
})

test("T30 卡点步名：CDP 方法名 ∥ 显式阶段名 ∥ queue wait（U52/E4①）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const r = await guarded(run("evaluate", { expression: "1", timeoutMs: 150 }))
    assert.equal(r, "Error: evaluate timed out after 150ms (stuck in Runtime.evaluate) — retry the action, or run `close` to reset the session")
  })

  // 非调用阶段：就绪轮询间隙到点 ⇒ 显式阶段名（§2.9 步名枚举）
  await withPage(fakePage({ readyState: "loading" }), async () => {
    const r = await guarded(run("navigate", { url: "http://a.test/", timeoutMs: 150 }))
    assert.equal(r, "Error: navigate timed out after 150ms (stuck in waitForReady) — retry the action, or run `close` to reset the session")
  })

  // 排队期到点：动作从未起执行（无展开）⇒ queue wait
  await withPage(fakePage({}), async () => {
    await run("navigate", { url: "http://a.test/" })
    const busy = run("wheel", { deltaY: 10 }) // 占队 ~100ms（settleScroll 稳定读数）
    const queued = await guarded(run("evaluate", { expression: "1", timeoutMs: 30 }), 1_000)
    assert.match(queued, /^Error: evaluate timed out after 30ms \(stuck in queue wait\) — retry the action, or run `close` to reset the session$/)
    await busy
  })
})

// ── T31–T33 会话健康 ∥ 外部关闭自愈（F-BT17 / E2）───────────────────────────

test("T31 连接断（假 WS close）：在飞动作即时显式失败 + 态复位（U55/E2①）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const inflight = run("evaluate", { expression: "1" }) // 30s 预算——由外部关闭裁决（非预算到点）
    await tick()
    fix.ws.drop()
    const r = await guarded(inflight)
    assert.equal(r, "Error: the browser session was closed externally (the connection to the browser dropped) — run the action again to reopen a fresh session")
    assert.equal(fix.killed.length, 1, "态复位 + 杀树兜底（子进程仍活）")
    assert.equal(session.lastPageUrl(), null, "引用表 / 最近页随复位清空")
  })
})

test("T32 子进程退出（假 child exit）：在飞动作即时显式失败（U55/E2②）", async () => {
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.hang = true
    const inflight = run("evaluate", { expression: "1" })
    await tick()
    fix.child.exitCode = 0
    fix.child.emit("exit", 0)
    const r = await guarded(inflight)
    assert.equal(r, "Error: the browser session was closed externally (the browser process exited) — run the action again to reopen a fresh session")
  })
})

test("T33 自愈重开 + 首回执注记 + 探针三检（U55/U56/E2③④）", async () => {
  // ① 外部关闭 ⇒ 下一动作干净重开（open 计数 +1）+ 尾行注记；再下一动作无注记
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.ws.drop() // 空闲期外部关闭（无在飞动作）
    const r = await run("snapshot", {})
    assert.match(r, /\n\[note: the previous browser session was closed externally — a fresh session was opened \(page state lost; profile\/login kept\)\]$/, r)
    assert.equal(fix.opened.length, 2, "下一次动作干净重开（同 profile）")
    const again = await run("snapshot", {})
    assert.ok(!again.includes("[note:"), "注记置位一次、发出即清（U56）")
  })

  // ② 探针检一：子进程已退（退出事件未至）⇒ 入口探针短路（拒且不重开）
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.child.exitCode = 1 // 静默退出——事件面未发
    const r = await run("snapshot", {})
    assert.equal(r, "Error: the browser session was closed externally (the browser process exited) — run the action again to reopen a fresh session")
    assert.equal(fix.opened.length, 1, "探针拒——显式失败，重开留给下一动作")
    assert.match(await run("snapshot", {}), /\[note: .*\]$/, "下一动作重开 + 注记")
    assert.equal(fix.opened.length, 2)
  })

  // ③ 探针检二：连接已关（断连事件未至）⇒ 入口探针短路
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.cdp.closed = true // 静默断连——事件面未发
    const r = await run("snapshot", {})
    assert.equal(r, "Error: the browser session was closed externally (the connection to the browser dropped) — run the action again to reopen a fresh session")
  })

  // ④ 探针检三：活动新鲜 ⇒ 跳过心跳（短路）；陈旧 >5s ⇒ 心跳 Browser.getVersion（2s 帽）
  await withPage(fakePage({}), async (fix) => {
    await run("navigate", { url: "http://a.test/" })
    fix.calls.length = 0
    await run("snapshot", {})
    assert.equal(fix.calls.filter((c) => c.method === "Browser.getVersion").length, 0, "新鲜活动 ⇒ 心跳短路（零成本恒检）")
    await delay(5_200)
    await run("snapshot", {})
    assert.ok(fix.calls.some((c) => c.method === "Browser.getVersion"), "距上次成功活动 >5s ⇒ 心跳")
  })
})

// ── T42 描述面（F-BT19 / E5——prompt 面落笔件）───────────────────────────────

test("T42 描述档：现实环境实践四小节 ∥ 超时 / 外部关闭 / async 语义（F-BT19/E5）", () => {
  const doc = readFileSync(join(CORE, "tool-docs", "browser.md"), "utf8")
  for (const anchor of [
    "**Real-world practice**",
    "- Anti-bot walls / login gates:",
    "- Pacing:",
    "- Session assumptions:",
    "- When not to use it:",
  ]) assert.ok(doc.includes(anchor), `缺小节：${anchor}`)
  assert.match(doc, /timed out after <ms>ms \(stuck in <step>\)/, "超时句（§2.9 回执形）")
  assert.match(doc, /closed externally/, "外部关闭显式失败句（§2.10）")
  assert.match(doc, /^- async: run this action in the background/m, "async 参数行（§2.11）")
})
