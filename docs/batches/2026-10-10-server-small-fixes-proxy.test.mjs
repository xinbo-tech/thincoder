/**
 * 2026-10-10-server-small-fixes-proxy.test.mjs — thincoder-server 批内单测件（#1137 代理慢消费三腿——实跑补证；名随批档 ·
 * 住 `docs/batches/` · 不入仓套件 · 随批留存；同批拆档双件——值面/去重/有界读腿 = `-small-fixes.test.mjs`）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-10-server-small-fixes-proxy.test.mjs`
 *
 * 射程（判据源 = 批档 §2.3；腿 ↔ 判据在括号——产品码零改，补证不改造）：
 *   腿 A（慢写 + 缓读——不误杀）：假代理按 `Content-Length` 分块慢写（5 块 × 300ms）∥ 下游逐块缓读（400ms/块）
 *     ⇒ 流毕 ∧ 字节逐值 ∧ 零 `Response body timeout`
 *   腿 A2（泄压窗——排空期不杀）：突写 ≤16KB（HWM 内）后停写、下游缓排空 ⇒ 排空期 `'readable'` 重接（`proxy.mjs:144`）
 *     不杀；排空毕继续等待（流仍活）
 *   腿 B（真静默 ⇒ 杀断）：首块后上游零写 ∧ 下游不读 ⇒ `mock.timers`（`setTimeout` 面）tick ≥120s
 *     ⇒ 迭代器抛 `Response body timeout (idle 120s)`（`:125` 报文字面）∧ 假代理侧观测拆连
 * 夹具 = 进程内假代理（net——响应端合并上游角色：三腿全经经典转发，请求行发绝对 URI；不另设独立 http 上游——无腿消费）；
 * 出口 = `proxyFetch`（真件）；目标非 loopback（`provider.invalid`——保留域，恒不解）⇒ 假代理必命中（先例 = `-server-gemini-openai-preset.test.mjs` D3/E1）。
 */
import test, { mock } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { createServer as createNetServer } from "node:net"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const PROXY = await load("thincoder-server/src/gateway/proxy.mjs")

const ITEM = "http://provider.invalid/fixture" // 非 loopback（保留域——恒不解）
const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms))

/** 进程内假代理（net——响应端合并上游角色）：首个完整请求头即回调（`requests[].firstLine` = 绝对 URI 请求行）。 */
async function startFakeProxy(handler) {
  const sockets = new Set()
  const requests = []
  const server = createNetServer((sock) => {
    sockets.add(sock)
    sock.on("close", () => sockets.delete(sock))
    sock.on("error", () => {})
    let buf = Buffer.alloc(0)
    sock.on("data", function onData(data) {
      buf = Buffer.concat([buf, data])
      const split = buf.indexOf("\r\n\r\n")
      if (split < 0) return
      const head = buf.toString("latin1", 0, split)
      const record = { firstLine: head.split("\r\n")[0], head }
      requests.push(record)
      sock.removeListener("data", onData)
      handler(sock, record)
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    uri: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { for (const sock of sockets) sock.destroy(); await new Promise((resolve) => server.close(resolve)) },
  }
}

// ── 腿 A（慢写 + 缓读——不误杀）───────────────────────────────────────────────

test("腿 A 慢写 + 缓读：流毕 ∧ 字节逐值 ∧ 零 `Response body timeout`", { timeout: 30_000 }, async () => {
  const CHUNKS = 5
  const chunkOf = (index) => `chunk-${index}:` + String(index).repeat(1200)
  const full = Array.from({ length: CHUNKS }, (_, index) => chunkOf(index)).join("")
  const proxy = await startFakeProxy((sock) => {
    sock.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(full)}\r\n\r\n`)
    let index = 0
    const timer = setInterval(() => {
      sock.write(chunkOf(index))
      index += 1
      if (index === CHUNKS) { clearInterval(timer); sock.end() }
    }, 300)
    sock.on("close", () => clearInterval(timer))
  })
  try {
    const response = await PROXY.proxyFetch(`${ITEM}/stream`, {}, proxy.uri)
    assert.equal(response.status, 200)
    assert.equal(proxy.requests.length, 1, "假代理恰命中一次")
    assert.equal(proxy.requests[0].firstLine, `GET ${ITEM}/stream HTTP/1.1`, "经典转发 = 绝对 URI 请求行")
    const iterator = response.body[Symbol.asyncIterator]()
    const got = []
    try {
      for (;;) {
        const { done, value } = await iterator.next()
        if (done) break
        got.push(Buffer.from(value))
        await tick(400) // 下游缓读（> 生产侧 300ms/块——背压面）
      }
    } catch (error) {
      assert.fail(`慢消费误杀：${error.message}`)
    }
    const bytes = Buffer.concat(got)
    assert.equal(bytes.length, Buffer.byteLength(full), "字节数逐值")
    assert.equal(bytes.toString("utf8"), full, "字节逐值（流毕——零截断）")
  } finally {
    await proxy.close()
  }
})

// ── 腿 A2（泄压窗——排空期不杀；排空毕继续等待）─────────────────────────────

test("腿 A2 泄压窗：突写 ≤16KB（HWM 内）分三段 250ms 落流、下游缓排空（350ms/读）⇒ 排空期不杀；排空毕继续等待", { timeout: 30_000 }, async () => {
  const SEGMENT = 4 * 1024 // 段 ≤ HWM（16KB 内——同族突写面）
  const SEGMENTS = 3
  const payload = Array.from({ length: SEGMENTS }, (_, index) => String(index).repeat(SEGMENT)).join("")
  const proxy = await startFakeProxy((sock) => {
    // 体未完（声明 > 突写量——`'end'` 未至：排空毕可继续等待）
    sock.write(`HTTP/1.1 200 OK\r\nContent-Length: ${Buffer.byteLength(payload) + 4096}\r\n\r\n`)
    let index = 0
    const timer = setInterval(() => {
      sock.write(payload.slice(index * SEGMENT, (index + 1) * SEGMENT))
      index += 1
      if (index === SEGMENTS) clearInterval(timer) // 停写（零 end——真等待面）
    }, 250)
    sock.on("close", () => clearInterval(timer))
  })
  let stream = null
  try {
    const response = await PROXY.proxyFetch(`${ITEM}/burst`, {}, proxy.uri)
    stream = response.body
    const iterator = response.body[Symbol.asyncIterator]()
    const got = []
    let received = 0
    while (received < payload.length) {
      const { done, value } = await iterator.next()
      if (done) break
      received += value.byteLength
      got.push(Buffer.from(value))
      await tick(350) // 缓排空（> 生产侧 250ms/段——背压面）
    }
    assert.equal(Buffer.concat(got).toString("utf8"), payload, "突写体量排空（字节逐值——排空期零误杀）")
    // 排空毕继续等待：流仍活（无 error ∥ 无 end——等待更多数据）
    const pending = iterator.next().then(() => "settled", (error) => `rejected:${error.message}`)
    const outcome = await Promise.race([pending, tick(500).then(() => "waiting")])
    assert.equal(outcome, "waiting", `排空毕流应仍活（等待更多数据）：${outcome}`)
  } finally {
    await stream?.cancel?.().catch?.(() => {}) // 收尾（`destroy`——无悬挂解拒不炸：pending 已挂 onRejected）
    await proxy.close()
  }
})

// ── 腿 B（真静默 ⇒ 杀断——`mock.timers` setTimeout 面）───────────────────────

test("腿 B 真静默 ⇒ 杀断：首块后零写 ∧ 下游不读 ⇒ idle ≥120s ⇒ 抛 `Response body timeout (idle 120s)` ∧ 假代理侧观测拆连", { timeout: 30_000 }, async () => {
  const FIRST = "first-chunk"
  let proxySock = null
  const proxy = await startFakeProxy((sock) => {
    proxySock = sock
    sock.write(`HTTP/1.1 200 OK\r\nContent-Length: 4096\r\n\r\n`)
    sock.write(FIRST) // 首块到位 ⇒ 'readable' 复位看门狗；此后真静默（零写 ∥ 零 end）
  })
  let stream = null
  mock.timers.enable({ apis: ["setTimeout"] })
  try {
    const response = await PROXY.proxyFetch(`${ITEM}/silent`, {}, proxy.uri)
    stream = response.body
    const iterator = response.body[Symbol.asyncIterator]()
    const first = await iterator.next() // 首块（此后下游不读）
    assert.equal(Buffer.from(first.value).toString("utf8"), FIRST, "首块到位")
    const pending = iterator.next() // 悬挂（无数据）
    mock.timers.tick(120_000) // 假钟推进 ≥120s ⇒ 看门狗触发 ⇒ `destroy(err)`
    await assert.rejects(pending, /^Error: Response body timeout \(idle 120s\)$/, "报文字面 = `:125`")
  } finally {
    mock.timers.reset() // 例毕复位（真钟归还——等待/收尾均按真钟）
    await stream?.cancel?.().catch?.(() => {})
  }
  try {
    const sawTeardown = await Promise.race([
      new Promise((resolve) => { if (proxySock?.destroyed) return resolve(true); proxySock?.once("close", () => resolve(true)) }),
      tick(2000).then(() => false),
    ])
    assert.equal(sawTeardown, true, "假代理侧观测拆连（`destroy` 连带代理 socket——断连中止契约）")
  } finally {
    await proxy.close()
  }
})
