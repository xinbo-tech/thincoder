/**
 * 2026-10-08-proxy-chunked-frame.test.mjs — 批内件（代理分块解码批（chunked 剥帧） · C1–C16）。
 *
 * 覆盖（设计 = 批档 `docs/batches/2026-10-08-proxy-chunked-frame.md` §2.5 ∥ §2.12 补行）：
 *  - C1–C12 两分支共用层（`streamHttpResponse`——假 socket（Duplex 桩）：`push` 一次 = 一个
 *    `data` 事件，分包边界完全可控）：单块 ∥ 多块 ∥ 穷举切点 ∥ trailer ∥ 块扩展 ∥ TE token ∥
 *    非 UTF-8 载荷 ∥ 流式保形（首字节先于 0 块）∥ 畸形回退（首段 ∥ 中途）∥ 非分块零动（CL ∥ 连接关闭）；
 *  - C13–C14 转发腿：回环假代理（http 经典转发）+ 真 `proxyFetch` ⇒ JSON ∥ SSE 回放；
 *  - C16 CONNECT 腿：假代理应答 CONNECT 后原位 TLS 升档（自签证书内嵌）+ 真 `tunnelHttps`；
 *  - C15 回归腿：重跑 `2026-10-03-crash-guards.test.mjs`（body 管线 ∥ 看门狗面零回归）。
 * 缺陷回放（旧码红）：代理响应体首段携 `<hex>\r\n` 帧 ⇒ `text()` 帧污染 ⇒ JSON.parse 失败
 * （用户 gemini 案 `non-JSON response`）——C13 ∥ C16 即该面回放。
 *
 * 跑法（仓根）：`node --test docs/batches/2026-10-08-proxy-chunked-frame.test.mjs`
 * 留存口径：随批留存 · 不进仓套件（核测试树现行无 .test.mjs 收集面）。零真实外网。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createServer } from "node:net"
import { Duplex } from "node:stream"
import { TLSSocket, createSecureContext } from "node:tls"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href
const MOD = {
  decoder: modUrl("thincoder-core/proxy-chunked.mjs"),
  transport: modUrl("thincoder-core/proxy-transport.mjs"),
  proxy: modUrl("thincoder-core/proxy.mjs"),
  sse: modUrl("thincoder-core/provider/sse.mjs"),
}
const tick = () => new Promise((r) => setImmediate(r))

/** 帧序列构造：载荷分片 ⇒ `<hex>[;扩展]\r\n<片>\r\n`… + `0\r\n[trailer]\r\n`。 */
const frame = (pieces, { trailer = "", ext = "" } = {}) => Buffer.concat([
  ...pieces.map((p) => Buffer.concat([Buffer.from(`${p.length.toString(16)}${ext}\r\n`), p, Buffer.from("\r\n")])),
  Buffer.from(`0\r\n${trailer}\r\n`),
])

/** 假 socket（Duplex 桩）：`push` 一次 = 一个 `data` 事件；请求字节吞掉（不回流 readable 侧）。 */
const fakeSocket = () => new Duplex({ read() {}, write(_c, _e, cb) { cb() }, final(cb) { cb() } })

/** 开一条裸 socket 响应：推头（+可选同包首段）⇒ 等 `streamHttpResponse` settle。 */
async function openRaw({ headers = {}, extra = Buffer.alloc(0), url = "http://target.test/x" } = {}) {
  const { streamHttpResponse } = await import(MOD.transport)
  const sock = fakeSocket()
  const head = `HTTP/1.1 200 OK\r\n${Object.entries(headers).map(([k, v]) => `${k}: ${v}\r\n`).join("")}\r\n`
  const p = streamHttpResponse(sock, url, {}, 5000, false, 0) // bodyIdleMs=0：关 body 看门狗
  sock.push(Buffer.concat([Buffer.from(head, "latin1"), extra]))
  return { sock, res: await p }
}

/** 回环假代理（`net` 真 socket——http 经典转发 ∥ CONNECT 升档两用）：见请求头 ⇒ 回调。 */
async function startFakeProxy(onRequest) {
  const sockets = new Set()
  const server = createServer((sock) => {
    sockets.add(sock)
    sock.on("close", () => sockets.delete(sock))
    let buf = Buffer.alloc(0)
    sock.on("data", function onData(d) {
      buf = Buffer.concat([buf, d])
      if (buf.indexOf("\r\n\r\n") < 0) return
      sock.removeListener("data", onData)
      onRequest(sock)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    port: server.address().port,
    close: () => new Promise((r) => { for (const s of sockets) s.destroy(); server.close(r) }),
  }
}

/** 收 body 全量字节（字节级比较——C7 免 utf8 往返）。 */
const collect = async (body) => {
  const chunks = []
  for await (const c of body) chunks.push(c)
  return Buffer.concat(chunks)
}

/** 直跑解码器：多包喂入 ⇒ { bytes, ended, mode }（切点确定性用）。 */
async function decodeAll(pushes) {
  const { createChunkedDecoder } = await import(MOD.decoder)
  const out = []
  let ended = false
  const dec = createChunkedDecoder({ onData: (c) => out.push(c), onEnd: () => { ended = true } })
  for (const p of pushes) dec.push(p)
  return { bytes: Buffer.concat(out), ended, mode: dec.mode }
}

/** C16 自签证书 fixture（EC P-256 · CN=proxy-chunked.test · 至 2036；`insecureTls: true` 不校链）。 */
const TLS_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgmB/kfXxjtsWiecc6
S3Oz51xQzgAi3hmXWWUAY/thEOmhRANCAASNsalc8ATMBvPXmmiwZvZg2mRF4fJC
9DVi1ZLqi+s3uEpN0yxlW6fqq5LFReimFWuiNjTo1RL9lik+chuORRpo
-----END PRIVATE KEY-----
`
const TLS_CERT = `-----BEGIN CERTIFICATE-----
MIIBjzCCATWgAwIBAgIUDur1r+GQcHzNZDxcLElj3neqyc4wCgYIKoZIzj0EAwIw
HTEbMBkGA1UEAwwScHJveHktY2h1bmtlZC50ZXN0MB4XDTI2MTAwODA0NTU0N1oX
DTM2MTAwNTA0NTU0N1owHTEbMBkGA1UEAwwScHJveHktY2h1bmtlZC50ZXN0MFkw
EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEjbGpXPAEzAbz15posGb2YNpkReHyQvQ1
YtWS6ovrN7hKTdMsZVun6quSxUXophVrojY06NUS/ZYpPnIbjkUaaKNTMFEwHQYD
VR0OBBYEFJYPgMi262Er8Q3m+Ys0FN/T641wMB8GA1UdIwQYMBaAFJYPgMi262Er
8Q3m+Ys0FN/T641wMA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSAAwRQIg
NfN/MClhSSzTMb/Ly51p2vlhhHvp41GXcuA3tRJD/RACIQDrPljsAKSMWFRKUhxR
IprhkPbenKqVFcl3Qy5yvd4H2g==
-----END CERTIFICATE-----
`

// ── C1–C12 · 两分支共用层（假 socket） ─────────────────────────────────────────

test("C1（正常）单块 `5\\r\\nhello\\r\\n0\\r\\n\\r\\n` ⇒ body = hello ∥ 随 0 块结束", async () => {
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: frame([Buffer.from("hello")]) })
  assert.equal(await res.text(), "hello")
  assert.equal(res.body.readableEnded, true, "body 应随 0 块结束")
  sock.destroy()
})

test("C2（正常）多块 `3\\r\\nabc\\r\\n4\\r\\ndefg\\r\\n0\\r\\n\\r\\n` ⇒ abcdefg", async () => {
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: frame([Buffer.from("abc"), Buffer.from("defg")]) })
  assert.equal(await res.text(), "abcdefg")
  sock.destroy()
})

test("C3（边界）穷举切点（size 行中 ∥ 数据中 ∥ 块尾 CRLF 中 ∥ 终止块中）+ 逐字节切包 ⇒ 同载荷", async () => {
  const payload = frame([Buffer.from("abc"), Buffer.from("defg")])
  for (let split = 0; split <= payload.length; split++) {
    const r = await decodeAll([payload.subarray(0, split), payload.subarray(split)])
    assert.equal(r.bytes.toString(), "abcdefg", `两段切分 split=${split}`)
    assert.equal(r.ended, true, `split=${split} 未终（0 块未达）`)
    assert.equal(r.mode, "done", `split=${split} mode`)
  }
  const r = await decodeAll([...payload].map((b) => Buffer.from([b])))
  assert.equal(r.bytes.toString(), "abcdefg", "逐字节切包")
  assert.equal(r.ended, true)
})

test("C4（边界）带 trailer `0\\r\\nX-T: 1\\r\\n\\r\\n` ⇒ body = abc ∥ trailer 零泄漏", async () => {
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: frame([Buffer.from("abc")], { trailer: "X-T: 1\r\n" }) })
  assert.equal(await res.text(), "abc")
  sock.destroy()
})

test("C5（边界）块扩展 `5;a=b\\r\\nhello\\r\\n0\\r\\n\\r\\n` ⇒ hello", async () => {
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: frame([Buffer.from("hello")], { ext: ";a=b" }) })
  assert.equal(await res.text(), "hello")
  sock.destroy()
})

test("C6（边界）TE token：`Chunked` ∥ `gzip, chunked`（逗号列尾）⇒ 均按 chunked 解码", async () => {
  for (const te of ["Chunked", "gzip, chunked"]) {
    const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": te }, extra: frame([Buffer.from("hello")]) })
    assert.equal(await res.text(), "hello", `TE=${te}`)
    sock.destroy()
  }
})

test("C7（边界）非 UTF-8 载荷（0x00 0xFF 0x80）：头/体同包 ∥ 逐字节切分 ⇒ 逐字节同", async () => {
  const payload = Buffer.from([0x00, 0xff, 0x80])
  const same = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: frame([payload]) })
  assert.deepEqual(await collect(same.res.body), payload, "头/体同包")
  same.sock.destroy()
  const split = await openRaw({ headers: { "Transfer-Encoding": "chunked" } })
  for (const b of frame([payload])) { split.sock.push(Buffer.from([b])); await tick() }
  assert.deepEqual(await collect(split.res.body), payload, "逐字节切分")
  split.sock.destroy()
})

test("C8（边界）流式保形：只推 `5\\r\\nhello\\r\\n`（未推 0 块）⇒ body 已可读 hello", async () => {
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" } })
  sock.push(Buffer.from("5\r\nhello\r\n"))
  await tick()
  assert.equal(res.body.readableEnded, false, "未等待终止")
  assert.ok(res.body.readableLength >= 5, `首字节先于 0 块到达（readableLength=${res.body.readableLength}）`)
  assert.equal(res.body.read(5).toString(), "hello", "零整包缓冲")
  sock.push(Buffer.from("0\r\n\r\n"))
  assert.equal(await res.text(), "")
  sock.destroy()
})

test("C9（错误）头 chunked 但体 = `{\"a\":1}`（首段非十六进制）⇒ 回退透传逐字节同", async () => {
  const payload = Buffer.from('{"a":1}')
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: payload })
  await tick()
  sock.destroy() // 对端关闭 ⇒ body 结束（回退径无 0 块）
  assert.deepEqual(await collect(res.body), payload)
})

test("C10（错误）中途畸形 `3\\r\\nabc\\r\\nZZ…` ⇒ 已吐 abc + 余下原样透传（分包无关 · 零丢弃）", async () => {
  // 变体①：真 socket 径——畸形行不成行（无 CRLF）
  const { sock, res } = await openRaw({ headers: { "Transfer-Encoding": "chunked" }, extra: Buffer.from("3\r\nabc\r\nZZ-raw-tail") })
  await tick()
  sock.destroy()
  assert.deepEqual(await collect(res.body), Buffer.from("abcZZ-raw-tail"))
  // 变体②：畸形行与 CRLF 同包（成行）——行 ∥ CRLF 零丢弃，且与分包形一致
  const same = await decodeAll([Buffer.from("Z\r\nhello")])
  const split = await decodeAll([Buffer.from("Z"), Buffer.from("\r\nhello")])
  assert.equal(same.bytes.toString(), "Z\r\nhello", "成行畸形：已持有字节原样吐出")
  assert.equal(split.bytes.toString(), "Z\r\nhello", "分包形一致（零静默丢数据）")
  assert.equal(same.mode, "raw")
  // 变体③：帧头超限（>1KiB）∥ 行长内数值越界（>2^53）⇒ 均整段原样吐出
  const longHex = "F".repeat(1025)
  const over = await decodeAll([Buffer.from(`${longHex}\r\nTAIL`)])
  assert.equal(over.bytes.toString(), `${longHex}\r\nTAIL`, "超限行整段透传")
  assert.equal(over.mode, "raw")
  const bigHex = "F".repeat(300)
  const huge = await decodeAll([Buffer.from(`${bigHex}\r\nTAIL`)])
  assert.equal(huge.bytes.toString(), `${bigHex}\r\nTAIL`, "数值越界（≈2^1200）整段透传")
  assert.equal(huge.mode, "raw")
})

test("C11（正常 · 非分块零动）无 TE + `Content-Length: 5` + hello ⇒ 逐字节同", async () => {
  const { sock, res } = await openRaw({ headers: { "Content-Length": "5" }, extra: Buffer.from("he") })
  sock.push(Buffer.from("llo"))
  await tick()
  sock.destroy()
  assert.deepEqual(await collect(res.body), Buffer.from("hello"))
})

test("C12（正常 · 非分块零动）无 TE 无 CL（body 随对端关闭结束）⇒ 逐字节同", async () => {
  const { sock, res } = await openRaw({ headers: {} })
  sock.push(Buffer.from("payload"))
  await tick()
  sock.destroy()
  assert.deepEqual(await collect(res.body), Buffer.from("payload"))
})

// ── C13–C14 · 转发腿（假代理 + 真 proxyFetch） ────────────────────────────────

test("C13（接线 · 转发腿）回环假代理 + chunked ⇒ `text()` → JSON.parse 成功（旧码红：帧污染）", async () => {
  const { proxyFetch } = await import(MOD.proxy)
  const payload = JSON.stringify({ models: [{ name: "gemini-2.0-flash" }] })
  const framed = frame([Buffer.from(payload.slice(0, 10)), Buffer.from(payload.slice(10))])
  const proxy = await startFakeProxy((sock) => {
    sock.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n")
    sock.write(framed.subarray(0, 9)) // 真 socket：帧切两段发（跨包块边界）
    sock.write(framed.subarray(9))
    sock.end()
  })
  try {
    const res = await proxyFetch("http://proxy-chunked.test/v1/models", {}, `http://127.0.0.1:${proxy.port}`)
    assert.deepEqual(JSON.parse(await res.text()), JSON.parse(payload))
  } finally { await proxy.close() }
})

test("C14（接线 · 转发腿）chunked 帧序列 ⇒ readSSE 事件逐条解出（帧字节零入事件流）", async () => {
  const { readSSE } = await import(MOD.sse)
  const { proxyFetch } = await import(MOD.proxy)
  const events = [
    'data: {"choices":[{"delta":{"content":"He"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"llo"}}]}\n\n',
    "data: [DONE]\n\n",
  ]
  const proxy = await startFakeProxy((sock) => {
    sock.write("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nTransfer-Encoding: chunked\r\n\r\n")
    sock.write(frame(events.map((e) => Buffer.from(e))))
    sock.end()
  })
  try {
    const res = await proxyFetch("http://proxy-chunked.test/v1/chat", {}, `http://127.0.0.1:${proxy.port}`)
    const tokens = []
    const result = await readSSE(res, { onToken: (t) => tokens.push(t) })
    assert.equal(result.content, "Hello")
    assert.deepEqual(tokens, ["He", "llo"])
  } finally { await proxy.close() }
})

// ── C16 · CONNECT 腿（假代理原位 TLS 升档 + 真 tunnelHttps） ──────────────────

test("C16（接线 · CONNECT 腿）https 隧道径 chunked ⇒ `text()` → JSON.parse 成功（旧码红）", async () => {
  const { tunnelHttps } = await import(MOD.transport)
  const ctx = createSecureContext({ key: TLS_KEY, cert: TLS_CERT })
  const payload = JSON.stringify({ models: [{ name: "gemini-2.0-flash" }] })
  const proxy = await startFakeProxy((sock) => {
    sock.write("HTTP/1.1 200 Connection established\r\n\r\n")
    const tlsSock = new TLSSocket(sock, { isServer: true, secureContext: ctx }) // 原位 TLS 升档
    tlsSock.on("error", () => {})
    tlsSock.on("data", () => {
      tlsSock.write("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n")
      tlsSock.write(frame([Buffer.from(payload)]))
      tlsSock.end()
    })
  })
  try {
    const res = await tunnelHttps("https://proxy-chunked.test/v1/models", { insecureTls: true }, `http://127.0.0.1:${proxy.port}`)
    assert.deepEqual(JSON.parse(await res.text()), JSON.parse(payload))
  } finally { await proxy.close() }
})

// ── C15 · 回归腿 ─────────────────────────────────────────────────────────────

test("C15（回归腿）重跑 2026-10-03-crash-guards.test.mjs ⇒ 全绿（body 管线 ∥ 看门狗面零回归）", { timeout: 180_000 }, () => {
  const r = spawnSync(process.execPath, ["--test", join(ROOT, "docs/batches/2026-10-03-crash-guards.test.mjs")], {
    cwd: ROOT, encoding: "utf8", timeout: 150_000,
  })
  assert.equal(r.status, 0, `crash-guards 回归腿红：\n${r.stdout ?? ""}\n${r.stderr ?? ""}`)
})
