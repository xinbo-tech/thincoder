/**
 * 2026-10-04-issue-fix-round1.a.test.mjs — 批内件（issue 修复批·一 · 组 A：传输与请求面）
 *
 * 单测面（批档 §2.6-A + §2.9 T-A20/A21/A22；平 node · 零网络——本地 mock server / fetch 桩）：
 *   #850 MCP HTTP 会话过期自愈（D-MC18）… T-A1–T-A4
 *   #856 SSE 帧形状守卫（D-PR31）      … T-A5–T-A8 · T-A20
 *   #878 直连断流 abort 通道（D-PX8）  … T-A9–T-A11 · T-A21 · T-A22（google 腿两径）
 *   #877 POSIX 杀树相位分流（D-MC19）  … T-A12–T-A15
 *   #853 历史图片字节预算（D-PR32）    … T-A16–T-A19
 *
 * 跑法（仓根 thincoder/）：`node --test docs/batches/2026-10-04-issue-fix-round1.a.test.mjs`
 * 留存口径：随批留存 · 不进仓套件（核测试树现行无 .test.mjs 收集面）。
 * 注意：
 *  - T-A13（退出相位）置**进程级**模块标志（生产语义即终态、无复位面）⇒ 声明序置于文件末；
 *  - T-A15（POSIX 生产形）win32 机位 skip（本机 WSL node 坏档——真机复验登记）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { PassThrough } from "node:stream"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href
const MOD = {
  proxy: modUrl("thincoder-core/proxy.mjs"),
  guard: modUrl("thincoder-core/stream-destroy.mjs"),
  sse: modUrl("thincoder-core/provider/sse.mjs"),
  google: modUrl("thincoder-core/provider/google.mjs"),
  core: modUrl("thincoder-core/provider/core.mjs"),
  normalize: modUrl("thincoder-core/provider/normalize.mjs"),
  recordResults: modUrl("thincoder-core/agent/record-results.mjs"),
  transportHttp: modUrl("thincoder-core/mcp/transport-http.mjs"),
  transportStdio: modUrl("thincoder-core/mcp/transport-stdio.mjs"),
  mcp: modUrl("thincoder-core/mcp.mjs"),
}

/** 真实定时器引用（node:test mock timers 只替换全局 setTimeout——此引用恒定）。 */
const REAL_TIMEOUT = globalThis.setTimeout
const delay = (ms) => new Promise((r) => REAL_TIMEOUT(r, ms))

/** 有界等待：谓词成立即返；超时返 false（零挂死——先红跑可终止）。 */
const waitFor = async (predicate, ms = 4000, step = 15) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (predicate()) return true
    await delay(step)
  }
  return predicate()
}

// ── 公共夹具 ────────────────────────────────────────────────────────────────────

/** mock MCP server：按 (method, 次数) 计划的响应；hold=true ⇒ 挂起直到 releaseAll()。 */
const startMcpServer = async (plan) => {
  const counts = new Map()
  const holds = []
  const server = createServer((req, res) => {
    let raw = ""
    req.on("data", (c) => { raw += c })
    req.on("end", async () => {
      let msg = null
      try { msg = JSON.parse(raw) } catch { /* notification / empty body */ }
      const method = msg?.method ?? "(none)"
      const n = (counts.get(method) ?? 0) + 1
      counts.set(method, n)
      const p = (await plan(method, n, msg)) ?? {}
      if (p.hold) await new Promise((r) => holds.push(r))
      res.writeHead(p.status ?? 200, { "content-type": "application/json", ...(p.headers ?? {}) })
      res.end(p.body !== undefined ? p.body : JSON.stringify({ jsonrpc: "2.0", id: msg?.id ?? null, result: p.result ?? {} }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    url: `http://127.0.0.1:${server.address().port}/mcp`,
    count: (m) => counts.get(m) ?? 0,
    releaseAll: () => { for (const r of holds.splice(0)) r() },
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r) }),
  }
}

/** mock SSE 响应（PassThrough body——readSSE 直驱面）。 */
const sseResponseOf = (body) => ({
  ok: true, status: 200,
  headers: new Headers({ "content-type": "text/event-stream" }),
  body,
  text: async () => "",
})

/** SSE 文本帧（choice 形）。 */
const frameText = (choice) => `data: ${JSON.stringify({ choices: [choice] })}\n\n`

/** 帧序列 → readSSE 直驱；返回 { result, tokens, reasonings }。 */
const runSSE = async (frameTexts, opts = {}) => {
  const { readSSE } = await import(MOD.sse)
  const body = new PassThrough()
  const tokens = []
  const reasonings = []
  const p = readSSE(sseResponseOf(body), {
    onToken: (x) => tokens.push(x),
    onReasoning: (x) => reasonings.push(x),
    ...opts,
  })
  for (const f of frameTexts) body.write(Buffer.from(f))
  body.end()
  return { result: await p, tokens, reasonings }
}

/** 本地挂起 server：头到齐后停发（body 永久 pending——看门狗腿用）。
 *  无 firstFrame ⇒ 写注释帧（无 choices——看门狗腿的「无内容」语义；亦给 undici 一个解析起点）。 */
const startHangServer = async (head, firstFrame) => {
  const server = createServer((req, res) => {
    res.writeHead(200, head)
    res.write(firstFrame ?? ": open\n\n")
    // 停发：不 end、不 close
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    url: `http://127.0.0.1:${server.address().port}/stream`,
    close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r) }),
  }
}

/** 图片 part（data URL，b64 载荷 = payload 字符数）。 */
const imgPart = (payload) => ({ type: "image_url", image_url: { url: `data:image/png;base64,${payload}` } })
const IMAGE_BUDGET_PLACEHOLDER = "[image omitted — dropped to keep the request under the history image budget]"
const isPlaceholder = (p) => p?.type === "text" && p.text === IMAGE_BUDGET_PLACEHOLDER
/** messages 内 image part b64 载荷字符数和。 */
const b64Bytes = (messages) => {
  let total = 0
  for (const m of messages) {
    if (!Array.isArray(m?.content)) continue
    for (const p of m.content) {
      if (p?.type !== "image_url") continue
      const url = p.image_url?.url ?? ""
      const comma = url.indexOf(",")
      if (url.startsWith("data:") && comma >= 0) total += url.length - comma - 1
    }
  }
  return total
}

// ── #850 · T-A1–T-A4（MCP HTTP 会话过期自愈） ─────────────────────────────────────

test("T-A1（正常）#850：首答 404 ⇒ 自动重建 + 重试一次 ⇒ 调用返回正常结果", async () => {
  const srv = await startMcpServer((method, n) => {
    if (method === "tools/list") {
      return n === 1 ? { status: 404 } : { result: { tools: [{ name: "ping" }] } }
    }
    if (method === "initialize") return { result: { protocolVersion: "2024-11-05" }, headers: { "Mcp-Session-Id": "s-2" } }
    return {}
  })
  try {
    const { httpTransport } = await import(MOD.transportHttp)
    const { buildInitParams } = await import(MOD.mcp)
    const t = httpTransport(srv.url)
    t.setInitPayload(buildInitParams())
    t.markPostOnly()
    const resp = await t.send("tools/list", {})
    assert.deepEqual(resp.result, { tools: [{ name: "ping" }] }, "重试后返回正常结果")
    assert.equal(srv.count("initialize"), 1, "重建 initialize 恰 +1")
    assert.equal(srv.count("tools/list"), 2, "原请求重发恰 +1（只重试一次）")
    assert.equal(t.isAlive(), true, "自愈成功 ⇒ 连接仍活")
    t.close()
  } finally { await srv.close() }
})

test("T-A2（错误）#850：重试仍 404 ∥ 重建失败 ⇒ 不第三次；错误透传 + fireDead + isAlive=false", async () => {
  // 腿 1：重建成功但重试再 404
  const srv1 = await startMcpServer((method) => method === "initialize"
    ? { result: {}, headers: { "Mcp-Session-Id": "s-2" } }
    : { status: 404 })
  try {
    const { httpTransport } = await import(MOD.transportHttp)
    const { buildInitParams } = await import(MOD.mcp)
    const t = httpTransport(srv1.url)
    t.setInitPayload(buildInitParams())
    t.markPostOnly()
    let deadMsg = null
    t.onDead((m) => { deadMsg = m })
    const resp = await t.send("tools/list", {})
    assert.equal(resp.error?.message, "HTTP 404", "原错误透传")
    assert.equal(srv1.count("tools/list"), 2, "只重试一次——不第三次")
    assert.equal(srv1.count("initialize"), 1)
    assert.equal(deadMsg, "session expired", "fireDead 触发（退避重连链接线可观测）")
    assert.equal(t.isAlive(), false, "会话死态 ⇒ isAlive false（ensureAlive 走重连）")
    t.close()
  } finally { await srv1.close() }

  // 腿 2：重建请求本身失败（initialize 500）⇒ 同款兜底、原请求不重试
  const srv2 = await startMcpServer((method) => method === "initialize" ? { status: 500 } : { status: 404 })
  try {
    const { httpTransport } = await import(MOD.transportHttp)
    const { buildInitParams } = await import(MOD.mcp)
    const t = httpTransport(srv2.url)
    t.setInitPayload(buildInitParams())
    t.markPostOnly()
    let deadMsg = null
    t.onDead((m) => { deadMsg = m })
    const resp = await t.send("tools/call", { name: "x" })
    assert.equal(resp.error?.message, "HTTP 404")
    assert.equal(srv2.count("tools/call"), 1, "重建失败 ⇒ 原请求不重试")
    assert.equal(deadMsg, "session expired")
    assert.equal(t.isAlive(), false)
    t.close()
  } finally { await srv2.close() }
})

test("T-A3（边界）#850：并发 404 ⇒ 单飞重建（initialize 恰一次）；两请求各自重试一次", async () => {
  const srv = await startMcpServer((method, n) => {
    if (method === "initialize") return { result: {}, headers: { "Mcp-Session-Id": "s-2" }, hold: true }
    if (method === "tools/call") return n <= 2 ? { status: 404 } : { result: { ok: n } }
    return {}
  })
  try {
    const { httpTransport } = await import(MOD.transportHttp)
    const { buildInitParams } = await import(MOD.mcp)
    const t = httpTransport(srv.url)
    t.setInitPayload(buildInitParams())
    t.markPostOnly()
    const p1 = t.send("tools/call", { name: "a" })
    const p2 = t.send("tools/call", { name: "b" })
    assert.ok(await waitFor(() => srv.count("tools/call") >= 2 && srv.count("initialize") >= 1), "两个 404 与重建发起都在位")
    await delay(60) // 第二个 404 处理器加入单飞的窗口（initialize 仍 hold——单飞可判）
    assert.equal(srv.count("initialize"), 1, "单飞：重建只发一次")
    srv.releaseAll()
    const [r1, r2] = await Promise.all([p1, p2])
    assert.ok(r1.result && r2.result, "两请求各自重试成功")
    assert.equal(srv.count("initialize"), 1, "重建全程恰一次")
    assert.equal(srv.count("tools/call"), 4, "两首答 + 两重试")
    t.close()
  } finally { await srv.close() }
})

test("T-A4（回归）#850：非 404（500）⇒ 调用序零变（无重建、无重试）", async () => {
  const srv = await startMcpServer(() => ({ status: 500 }))
  try {
    const { httpTransport } = await import(MOD.transportHttp)
    const t = httpTransport(srv.url)
    t.setInitPayload({ protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "t", version: "1" } })
    t.markPostOnly()
    const resp = await t.send("tools/list", {})
    assert.equal(resp.error?.message, "HTTP 500")
    assert.equal(srv.count("tools/list"), 1, "无重试")
    assert.equal(srv.count("initialize"), 0, "无重建")
    assert.equal(t.isAlive(), true, "非 404 不置会话死态")
    t.close()
  } finally { await srv.close() }
})

// ── #856 · T-A5–T-A8 · T-A20（SSE 帧形状守卫） ────────────────────────────────────

test("T-A5（正常）#856：delta 帧交错全量 message 帧 ⇒ content 无重复（逐字）", async () => {
  const frames = [
    frameText({ delta: { content: "Hel" } }),
    frameText({ delta: { content: "lo" } }),
    frameText({ message: { content: "Hello world" } }), // 快照帧（v2 形状）
    frameText({ delta: { content: "!" } }),
  ]
  const { result, tokens } = await runSSE(frames)
  assert.equal(result.content, "Hello world!", "逐字无重复")
  assert.equal(tokens.join(""), result.content, "onToken 流零重复")
})

test("T-A6（边界）#856：递进快照帧链（message 全量递增 ×3）⇒ 只补差量、终值 = 末快照", async () => {
  const frames = [
    frameText({ message: { content: "a" } }),
    frameText({ message: { content: "ab" } }),
    frameText({ message: { content: "abc" } }),
  ]
  const { result } = await runSSE(frames)
  assert.equal(result.content, "abc", "前缀补差 ⇒ 终值 = 末快照逐字")
})

test("T-A7（边界）#856：message 帧与已收无前缀关系 ⇒ 按增量追加（不吞真实内容）", async () => {
  const { result } = await runSSE([
    frameText({ delta: { content: "hello" } }),
    frameText({ message: { content: "world" } }),
  ])
  assert.equal(result.content, "helloworld", "无前缀关系 ⇒ 整段按增量（保旧行为）")
  // 空累计起步的快照帧 = 整段追加
  const { result: r2 } = await runSSE([frameText({ message: { content: "zzz" } })])
  assert.equal(r2.content, "zzz")
})

test("T-A8（回归）#856：纯 delta 标准序列逐字零回归", async () => {
  const { result, tokens } = await runSSE([
    frameText({ delta: { content: "你" } }),
    frameText({ delta: { content: "好" } }),
    frameText({ delta: { content: "！" } }),
    frameText({ delta: { reasoning_content: "想" } }),
  ])
  assert.equal(result.content, "你好！")
  assert.equal(result.reasoning, "想")
  assert.deepEqual(tokens, ["你", "好", "！"])
})

test("T-A20（幂等/错误）#856：同一全量 message 帧连收两次 ⇒ content/reasoning 零再增、tool_calls 无重复", async () => {
  const full = () => frameText({
    message: {
      content: "abc",
      reasoning_content: "why",
      tool_calls: [{ index: 0, id: "call_1", function: { name: "f", arguments: "{\"x\":1}" } }],
    },
  })
  const { result } = await runSSE([full(), full()])
  assert.equal(result.content, "abc", "同帧重复 ⇒ 零再增")
  assert.equal(result.reasoning, "why")
  assert.equal(result.toolCalls.length, 1)
  assert.equal(result.toolCalls[0].arguments, "{\"x\":1}", "arguments 覆盖（非累加）")
  // 增量帧先行（部分 arguments）+ 快照帧收口 ⇒ 覆盖为快照全量
  const { result: r2 } = await runSSE([
    frameText({ delta: { tool_calls: [{ index: 0, id: "call_9", function: { name: "g", arguments: "{\"a\"" } }] } }),
    frameText({ message: { tool_calls: [{ index: 0, id: "call_9", function: { name: "g", arguments: "{\"a\":1}" } }] } }),
  ])
  assert.equal(r2.toolCalls[0].arguments, "{\"a\":1}", "已有 slot（index/id 命中）⇒ 覆盖为快照全量")
})

// ── #878 · T-A9–T-A11 · T-A21 · T-A22（直连断流 abort 通道） ─────────────────────

test("T-A9（正常）#878：直连 fetch 挂起 + mock timers 前推 120s ⇒ readSSE 以 sse-idle 终结（不再永挂）", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const hang = await startHangServer({ "content-type": "text/event-stream" })
  let outcome = null
  try {
    const { proxyFetch } = await import(MOD.proxy)
    const { readSSE } = await import(MOD.sse)
    const resp = await proxyFetch(hang.url, { method: "GET" })
    const p = readSSE(resp, {})
    let settled = false
    outcome = p.then(() => { settled = true; return "resolve" }, (e) => { settled = true; return { rejected: e } })
    for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
    assert.ok(settled, "idle 看门狗未终结读循环（120s 前推未生效——修前 = 永挂）")
    const out = await outcome
    assert.notEqual(out, "resolve", "无内容 idle ⇒ 不得以空结果静默成功")
    assert.equal(out.rejected?.abortInfo?.detail, "sse-idle", "相位串 = sse-idle")
    assert.match(out.rejected?.message ?? "", /SSE idle timeout/)
  } finally {
    outcome?.then(() => {}, () => {}) // 非阻塞吸收（未 settle 的悬置读——server 关闭后自然拒绝）
    await hang.close()
  }
})

test("T-A10（边界）#878：有部分内容 + idle ⇒ partial 语义保留（partial:true + networkError）", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const hang = await startHangServer(
    { "content-type": "text/event-stream" },
    frameText({ delta: { content: "part" } }),
  )
  let outcome = null
  try {
    const { proxyFetch } = await import(MOD.proxy)
    const { readSSE } = await import(MOD.sse)
    const resp = await proxyFetch(hang.url, { method: "GET" })
    let got = ""
    const p = readSSE(resp, { onToken: (x) => { got += x } })
    assert.ok(await waitFor(() => got === "part"), "内容帧未到达（真实定时器等待）")
    let settled = false
    outcome = p.then((v) => { settled = true; return { resolved: v } }, (e) => { settled = true; return { rejected: e } })
    for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
    assert.ok(settled, "idle 看门狗未终结读循环")
    const out = await outcome
    assert.ok(out.resolved, "有内容 idle ⇒ partial 保留径（resolve）")
    assert.equal(out.resolved.content, "part", "已收内容保留")
    assert.equal(out.resolved.partial, true, "partial 标记")
    assert.match(out.resolved.networkError ?? "", /SSE idle timeout/, "networkError 归一为看门狗错误")
  } finally {
    outcome?.then(() => {}, () => {}) // 非阻塞吸收（未 settle 的悬置读——server 关闭后自然拒绝）
    await hang.close()
  }
})

test("T-A11（回归）#878：terminateBody 对 PassThrough（proxy 形）走 destroyBody——errored 保留原错误", async () => {
  const { terminateBody } = await import(MOD.guard)
  const body = new PassThrough()
  const err = new Error("t-a11-probe")
  terminateBody({ body }, err)
  assert.equal(body.destroyed, true)
  assert.equal(body.errored, err, "errored 保留原错误对象")
  await delay(50) // 无兜底 'error' 监听者时，本进程已在前被杀
  assert.equal(body.errored, err)
})

test("T-A21（错误/幂等）#878：terminateBody 二次调用幂等；无通道 ∥ 无 body ⇒ no-op 不抛", async () => {
  const { terminateBody, IDLE_ABORT } = await import(MOD.guard)
  const ctrl = new AbortController()
  const response = { [IDLE_ABORT]: ctrl, body: new ReadableStream() }
  terminateBody(response, new Error("first"))
  assert.equal(ctrl.signal.aborted, true, "通道形 ⇒ controller.abort")
  assert.doesNotThrow(() => terminateBody(response, new Error("second")), "二次调用幂等")
  assert.doesNotThrow(() => terminateBody({ body: new ReadableStream() }, new Error("x")), "无通道 + 非 destroy 形 ⇒ no-op")
  assert.doesNotThrow(() => terminateBody({}, new Error("x")), "无 body ⇒ no-op")
  assert.doesNotThrow(() => terminateBody(null, new Error("x")))
  assert.doesNotThrow(() => terminateBody(undefined, new Error("x")))
})

test("T-A22①（#878 google 腿 · 无内容）真 fetch 挂起 + 前推 120s ⇒ 超时错误（google-sse-idle）终结", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const hang = await startHangServer({ "content-type": "text/event-stream" })
  let outcome = null
  try {
    const { chat } = await import(MOD.google)
    const provider = { baseURL: hang.url.replace(/\/stream$/, "/v1beta"), model: "gemini-2.5-flash", apiKey: "test-key" }
    const p = chat(provider, { messages: [{ role: "user", content: "hi" }] })
    let settled = false
    outcome = p.then((v) => { settled = true; return { resolved: v } }, (e) => { settled = true; return { rejected: e } })
    for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
    assert.ok(settled, "idle 看门狗未终结 google 读循环（不再永挂——本腿核心判据）")
    const out = await outcome
    assert.ok(out.rejected, "无内容 idle ⇒ 超时错误（不得空结果静默成功）")
    assert.equal(out.rejected?.abortInfo?.detail, "google-sse-idle", "google 腿真实相位串")
    assert.match(out.rejected?.message ?? "", /SSE idle timeout/)
  } finally {
    outcome?.then(() => {}, () => {})
    await hang.close()
  }
})

test("T-A22②（#878 google 腿 · 有内容）idle ⇒ partial 保留（内容保留、非整轮报废）", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const hang = await startHangServer(
    { "content-type": "text/event-stream" },
    'data: {"candidates":[{"content":{"parts":[{"text":"Gem"}]}}]}\n\n' +
    'data: {"candidates":[{"content":{"parts":[{"text":"ini"}]}}]}\n\n',
  )
  let outcome = null
  try {
    const { chat } = await import(MOD.google)
    const provider = { baseURL: hang.url.replace(/\/stream$/, "/v1beta"), model: "gemini-2.5-flash", apiKey: "test-key" }
    let got = ""
    const p = chat(provider, { messages: [{ role: "user", content: "hi" }], onToken: (x) => { got += x } })
    assert.ok(await waitFor(() => got === "Gemini"), "内容帧未到达")
    let settled = false
    outcome = p.then((v) => { settled = true; return { resolved: v } }, (e) => { settled = true; return { rejected: e } })
    for (let i = 0; i < 40 && !settled; i++) { t.mock.timers.tick(120_000); await delay(25) }
    assert.ok(settled, "idle 看门狗未终结 google 读循环")
    const out = await outcome
    assert.ok(out.resolved, "有内容 idle ⇒ partial 保留径（resolve；partial 标志不过 chat() 边界——实读 google.mjs:134-148）")
    assert.equal(out.resolved.content, "Gemini", "已收内容保留")
  } finally {
    outcome?.then(() => {}, () => {})
    await hang.close()
  }
})

// ── #877 · T-A12–T-A15（POSIX 杀树相位分流） ─────────────────────────────────────

/** 进程平台临时覆写（win32 机位直驱 POSIX 分流；只读注入面 = `process.platform` 可配置）。 */
const withPlatform = async (value, fn) => {
  const orig = Object.getOwnPropertyDescriptor(process, "platform")
  Object.defineProperty(process, "platform", { value, configurable: true, enumerable: true })
  try { return await fn() } finally { Object.defineProperty(process, "platform", orig) }
}

/** _killHooks spy 注入；返回 restore（还原原实现）。behavior.groupKill 可注错（ESRCH 腿）。 */
const injectKillSpies = (hooks, calls, behavior = {}) => {
  const orig = { groupKill: hooks.groupKill, childKill: hooks.childKill, setTimer: hooks.setTimer }
  hooks.groupKill = (pid, sig) => {
    calls.push(["groupKill", pid, sig])
    if (behavior.groupKill) behavior.groupKill(pid, sig)
  }
  hooks.childKill = (child, sig) => { calls.push(["childKill", child?.pid, sig]) }
  hooks.setTimer = (fn, ms) => { calls.push(["setTimer", ms]); behavior.timerFn = fn; return { unref() {} } }
  return () => { hooks.groupKill = orig.groupKill; hooks.childKill = orig.childKill; hooks.setTimer = orig.setTimer }
}

const callSeq = (calls) => calls.map((c) => (c[0] === "setTimer" ? `setTimer(${c[1]})` : `${c[0]}:${c[2]}`))

const killPidHard = (pid) => {
  if (!pid) return
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true })
    else { try { process.kill(-pid, "SIGKILL") } catch { process.kill(pid, "SIGKILL") } }
  } catch { /* best effort */ }
}

/** 真子进程替身（长活；killTree 经 spy 零真杀——收尾由调用腿真杀）。 */
const spawnKillFixture = (transport) => transport.stdioTransport(process.execPath, ["-e", "setTimeout(()=>{}, 30000)"])

test("T-A12（正常）#877：POSIX 正常相位 = 组 SIGTERM → setTimer(2000) →（前推）组 SIGKILL", async () => {
  const transport = await import(MOD.transportStdio)
  const { _killHooks } = transport
  assert.ok(_killHooks, "_killHooks 测试缝在导出面")
  const t = spawnKillFixture(transport)
  const calls = []
  const behavior = {}
  const restore = injectKillSpies(_killHooks, calls, behavior)
  let pid = null
  try {
    await withPlatform("linux", () => { t.close() })
    pid = calls[0]?.[1] ?? null
    assert.ok(Number.isInteger(pid) && pid > 0, "组杀指向真子进程 pid")
    assert.deepEqual(callSeq(calls), ["groupKill:SIGTERM", "setTimer(2000)"], "正常相位 = 组 SIGTERM + 2s 升级 timer")
    assert.equal(typeof behavior.timerFn, "function")
    behavior.timerFn() // 前推 2s
    assert.deepEqual(callSeq(calls), ["groupKill:SIGTERM", "setTimer(2000)", "groupKill:SIGKILL"], "升级 = 组 SIGKILL")
  } finally {
    restore()
    try { t.close() } catch { /* ignore */ }
    killPidHard(pid)
  }
})

test("T-A14（边界）#877：组杀 ESRCH ⇒ fallback 单进程 kill", async () => {
  const transport = await import(MOD.transportStdio)
  const { _killHooks } = transport
  assert.ok(_killHooks, "_killHooks 测试缝在导出面")
  const t = spawnKillFixture(transport)
  const calls = []
  const behavior = {
    groupKill: () => { const e = new Error("kill ESRCH"); e.code = "ESRCH"; throw e },
  }
  const restore = injectKillSpies(_killHooks, calls, behavior)
  let pid = null
  try {
    await withPlatform("linux", () => { t.close() })
    pid = calls[0]?.[1] ?? null
    const childKills = calls.filter((c) => c[0] === "childKill")
    assert.ok(childKills.length >= 1, "组杀 ESRCH ⇒ 回落单进程 kill")
    assert.equal(childKills[0][2], "SIGTERM")
    behavior.timerFn?.()
    const after = calls.filter((c) => c[0] === "childKill")
    assert.equal(after.at(-1)[2], "SIGKILL", "升级档同样回落")
  } finally {
    restore()
    try { t.close() } catch { /* ignore */ }
    killPidHard(pid)
  }
})

// ── #853 · T-A16–T-A19（历史图片字节预算） ────────────────────────────────────────

test("T-A16（正常）#853：超预算 ⇒ 最老先驱逐、字节和 ≤ 预算、新图保留", async () => {
  const { capHistoryImages } = await import(MOD.normalize)
  const msgs = [
    { role: "user", content: [{ type: "text", text: "old" }, imgPart("AAAAAAAAAA")] },
    { role: "assistant", content: "mid" },
    { role: "user", content: [imgPart("BBBBBBBBBB"), { type: "text", text: "new" }] },
  ]
  const capped = capHistoryImages(msgs, 15)
  assert.ok(isPlaceholder(capped[0].content[1]), "最老图被占位替换")
  assert.equal(capped[2].content[0].type, "image_url", "新图保留")
  assert.ok(b64Bytes(capped) <= 15, "结果字节和 ≤ 预算")
  // 递进：10/10/10、预算 25 ⇒ 恰逐最老一张
  const three = [
    { role: "user", content: [imgPart("AAAAAAAAAA")] },
    { role: "user", content: [imgPart("BBBBBBBBBB")] },
    { role: "user", content: [imgPart("CCCCCCCCCC")] },
  ]
  const c3 = capHistoryImages(three, 25)
  assert.ok(isPlaceholder(c3[0].content[0]) && !isPlaceholder(c3[1].content[0]) && !isPlaceholder(c3[2].content[0]), "从最老起、恰逐一张")
  assert.ok(b64Bytes(c3) <= 25)
})

test("T-A17（边界）#853：预算内逐字零改（引用不变）；副本驱逐不动本体（拷贝语义）", async () => {
  const { capHistoryImages } = await import(MOD.normalize)
  const within = [{ role: "user", content: [imgPart("AAAA")] }]
  assert.equal(capHistoryImages(within, 100), within, "预算内 ⇒ 原引用返回（逐字零改）")
  const history = [
    { role: "user", content: [imgPart("AAAAAAAAAA")] },
    { role: "user", content: [imgPart("BBBBBBBBBB")] },
  ]
  const sent = capHistoryImages(history, 10) // 发送前副本面
  assert.notEqual(sent, history, "驱逐 ⇒ 副本新引用")
  assert.ok(isPlaceholder(sent[0].content[0]), "副本最老图被驱逐")
  assert.equal(history[0].content[0].type, "image_url", "history 本体不变（拷贝语义）")
  assert.equal(history[0].content[0].image_url.url.endsWith("AAAAAAAAAA"), true)
  assert.equal(history.length, 2)
})

test("T-A18（错误）#853：413 mock 响应 ⇒ 错误文本携带处置指引（/compact ∥ 移除历史图片）", async () => {
  const { chat } = await import(MOD.core)
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 413, headers: new Headers(), text: async () => '{"error":"payload too large"}' })
  try {
    const provider = { baseURL: "http://127.0.0.1:1/v1", apiKey: "test-key", model: "gpt-4o" }
    await assert.rejects(
      chat(provider, { messages: [{ role: "user", content: "hi" }] }),
      (e) => /413/.test(e.message) && /\/compact/.test(e.message) && /remove historical images/i.test(e.message),
    )
  } finally { globalThis.fetch = origFetch }
})

test("T-A19（边界）#853：注入面驱逐（history 本体）⇒ 本体规约至预算内", async () => {
  const { IMAGE_HISTORY_BYTES_BUDGET } = await import(MOD.normalize)
  const { recordToolResults } = await import(MOD.recordResults)
  const big = "A".repeat(IMAGE_HISTORY_BYTES_BUDGET) // 恰满预算的旧图
  const agent = {
    cwd: process.cwd(),
    provider: { model: "gpt-4o" },
    history: [{ role: "user", content: [{ type: "text", text: "old" }, imgPart(big)] }],
    _fullHistory: [],
    _pendingReminders: [],
    _touchedFiles: [],
  }
  const tool = { name: "read_image", multimodal: true, readonly: true }
  const results = [{
    toolCall: { id: "tc1", name: "read_image", arguments: JSON.stringify({ path: "x.png" }) },
    result: JSON.stringify({
      text: "[read_image: x.png (image/png, 4 bytes)]",
      images: [imgPart("QUJD")],
    }),
    ok: true,
  }]
  await recordToolResults(agent, new Map([["read_image", tool]]), results)
  const injected = agent.history.at(-1)
  assert.ok(agent.history.length >= 2, "注入消息在位")
  assert.ok(Array.isArray(injected.content) && injected.content.some((p) => p.type === "image_url"), "新图保留")
  assert.ok(agent.history[0].content.some(isPlaceholder), "最老图被占位替换（history 本体）")
  assert.ok(b64Bytes(agent.history) <= IMAGE_HISTORY_BYTES_BUDGET, "本体规约至预算内")
})

// ── #877 · T-A13（退出相位——声明序末：模块标志为进程级终态） ─────────────────────

test("T-A13（边界 · 声明序末）#877：退出相位 = 同步组 SIGKILL 直达、无 timer（spy 注入）", async () => {
  const transport = await import(MOD.transportStdio)
  const { _killHooks } = transport
  assert.ok(_killHooks, "_killHooks 测试缝在导出面")
  const t = spawnKillFixture(transport)
  const calls = []
  const behavior = {}
  const restore = injectKillSpies(_killHooks, calls, behavior)
  let pid = null
  try {
    process.emit("exit", 0) // 置模块级退出相位标志（生产即终态；其后无依赖正常相位的腿）
    await withPlatform("linux", () => { t.close() })
    pid = calls[0]?.[1] ?? null
    assert.deepEqual(callSeq(calls), ["groupKill:SIGKILL"], "退出相位 = 同步组 SIGKILL 直达")
    assert.equal(calls.some((c) => c[0] === "setTimer"), false, "退出相位无 timer（升级窗口不落地）")
  } finally {
    restore()
    try { t.close() } catch { /* ignore */ }
    killPidHard(pid)
  }
})

// ── #877 · T-A15（平台门 · POSIX 生产形） ────────────────────────────────────────

const isDead = (pid) => { try { process.kill(pid, 0); return false } catch (e) { return e.code === "ESRCH" } }
const waitDead = async (pid, ms = 4000) => {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { if (isDead(pid)) return true; await delay(50) }
  return isDead(pid)
}

test("T-A15（平台门 · POSIX 生产形）#877：真 detached 树——退出相位全杀 ∥ 正常相位 close 树死",
  { skip: process.platform === "win32" ? "win32 机位——POSIX 生产形腿 skip（本机 WSL node 坏档：Exec format error；真机复验登记）" : false },
  async () => {
    const dir = mkdtempSync(join(tmpdir(), "round1a-"))
    const serverFile = join(dir, "server.mjs")
    writeFileSync(serverFile, `
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const g = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { stdio: "ignore" });
writeFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, gpid: g.pid }));
setInterval(() => {}, 1000);
`)
    const runCase = async (phase) => {
      const pidsFile = join(dir, `pids-${phase}.json`)
      const appFile = join(dir, `app-${phase}.mjs`)
      writeFileSync(appFile, `
import { stdioTransport } from ${JSON.stringify(MOD.transportStdio)};
import { existsSync } from "node:fs";
const t = stdioTransport("node", [process.env.SERVER_FILE], { PIDS_FILE: process.env.PIDS_FILE });
${phase === "exit"
  ? 'process.on("exit", () => { t.close(); });'
  : 'const closer = setInterval(() => { clearInterval(closer); t.close(); process.exit(0); }, 150);'}
const wait = setInterval(() => { if (existsSync(process.env.PIDS_FILE)) { clearInterval(wait); ${phase === "exit" ? "process.exit(0);" : ""} } }, 10);
`)
      const r = spawnSync(process.execPath, [appFile], { encoding: "utf8", timeout: 30000, env: { ...process.env, SERVER_FILE: serverFile, PIDS_FILE: pidsFile } })
      assert.equal(r.status, 0, r.stderr)
      assert.ok(existsSync(pidsFile), `server 未起（${phase}）：${r.stderr}`)
      const { pid, gpid } = JSON.parse(readFileSync(pidsFile, "utf8"))
      assert.ok(await waitDead(pid), `server ${pid} 应死（${phase}）`)
      assert.ok(await waitDead(gpid), `server 之孙 ${gpid} 应死（${phase}）`)
    }
    await runCase("exit")
    await runCase("close")
  })
