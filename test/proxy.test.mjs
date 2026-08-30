/**
 * proxy 链路测试 — resolveProxyConfig / normalizeProxy / injectProxy / websearch 走代理 / cmd-config proxy 菜单。
 * 不依赖网络与真实 home 目录；端口一律 0 随机分配；saveProxy 流程在隔离 HOME 的子进程里跑。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:net"
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { resolveProxyConfig, resolveWebProxy, injectProxy } from "../src/proxy.mjs"
import { normalizeProxy } from "../src/config.mjs"
import { websearchTool, fetchTool } from "../src/tools/web.mjs"
import { handleConfigCommand } from "../src/tui/cmd-config.mjs"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))

/** 临时设置/清除 proxy 相关环境变量，跑完恢复 */
async function withEnv(vars, fn) {
  const keys = ["HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY"]
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
  for (const k of keys) delete process.env[k]
  Object.assign(process.env, vars)
  try {
    await fn()
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  }
}

// ====================================================================
// resolveProxyConfig
// ====================================================================

test("resolveProxyConfig: 无 config.proxy 时回落 env（web 开、model 恒关）", async () => {
  await withEnv({ HTTPS_PROXY: "http://env-proxy:3128" }, async () => {
    assert.deepEqual(resolveProxyConfig({ agent: { config: {} } }), { uri: "http://env-proxy:3128", web: true, model: false })
  })
  await withEnv({}, async () => {
    assert.deepEqual(resolveProxyConfig({ agent: { config: {} } }), { uri: null, web: false, model: false })
  })
})

test("resolveProxyConfig: string 兼容 / 对象缺省 web:true model:false / url 兼容", () => {
  assert.deepEqual(resolveProxyConfig({ agent: { config: { proxy: "http://p:1" } } }), { uri: "http://p:1", web: true, model: false })
  assert.deepEqual(resolveProxyConfig({ agent: { config: { proxy: { uri: "http://p:1" } } } }), { uri: "http://p:1", web: true, model: false })
  assert.deepEqual(resolveProxyConfig({ agent: { config: { proxy: { url: "http://p:1", web: false, model: true } } } }), { uri: "http://p:1", web: false, model: true })
})

// ====================================================================
// normalizeProxy（loadConfig 归一化的纯函数部分）
// ====================================================================

test("normalizeProxy: string→对象 / url 兼容 / 缺省补全 / 非法丢弃 / 无 uri 丢弃", () => {
  assert.deepEqual(normalizeProxy("http://p:1"), { uri: "http://p:1", web: true, model: false })
  assert.deepEqual(normalizeProxy({ url: "http://p:1" }), { uri: "http://p:1", web: true, model: false })
  assert.deepEqual(normalizeProxy({ uri: "http://p:1", web: false, model: true }), { uri: "http://p:1", web: false, model: true })
  assert.equal(normalizeProxy(12345), undefined)
  assert.equal(normalizeProxy(["http://p:1"]), undefined)
  assert.equal(normalizeProxy(null), undefined)
  assert.equal(normalizeProxy(undefined), undefined)
  assert.equal(normalizeProxy(""), undefined)
  assert.equal(normalizeProxy({ web: false }), undefined)
  // uri 非 string 丢弃（不等到 new URL 才炸）
  assert.equal(normalizeProxy({ uri: 123 }), undefined)
  assert.equal(normalizeProxy({ uri: {}, url: "http://p:1" }), undefined)
})

// ====================================================================
// injectProxy 双重开启矩阵
// ====================================================================

test("injectProxy: provider.proxy × config.proxy.model 双重开启矩阵 + 重复注入清除旧值", async () => {
  const mk = () => [{ name: "a", proxy: true }, { name: "b" }, { name: "c", proxy: false }]
  const uri = "http://127.0.0.1:7890"

  // model:true → 仅 proxy:true 的 provider 注入
  let ps = mk()
  injectProxy(ps, { proxy: { uri, web: true, model: true } })
  assert.deepEqual(ps.map((p) => p.proxyUri), [uri, undefined, undefined])

  // model:false（默认）→ 全不注入
  ps = mk()
  injectProxy(ps, { proxy: { uri, web: true, model: false } })
  assert.ok(ps.every((p) => p.proxyUri === undefined))

  // 旧 string 形态 model=false → 不注入
  ps = mk()
  injectProxy(ps, { proxy: uri })
  assert.ok(ps.every((p) => p.proxyUri === undefined))

  // 重复注入清除旧值（toggle off 即时生效）
  ps = mk()
  injectProxy(ps, { proxy: { uri, model: true } })
  assert.equal(ps[0].proxyUri, uri)
  injectProxy(ps, { proxy: { uri, model: false } })
  assert.equal(ps[0].proxyUri, undefined)

  // env 路径 model 恒 false → 不注入 model 代理
  await withEnv({ HTTPS_PROXY: uri }, async () => {
    ps = mk()
    injectProxy(ps, {})
    assert.ok(ps.every((p) => p.proxyUri === undefined))
  })
})

// ====================================================================
// websearch 经 proxyFetch（假 TCP 代理）
// ====================================================================

/** 假代理：accept 即断开（CONNECT 必失败），返回 { hits, close } */
async function fakeProxy() {
  const state = { hits: 0 }
  const server = createServer((s) => { state.hits++; s.destroy() })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    get hits() { return state.hits },
    uri: `http://127.0.0.1:${server.address().port}`,
    close: () => { server.closeAllConnections?.(); server.close() },
  }
}

test("websearch: proxy 参数显式传才走代理；不传（即使 config 配了 web:true）也直连——2026-08-31 裁定", async () => {
  const proxy = await fakeProxy()
  try {
    // 显式参数：走代理，失败时优雅降级为 no results
    const r1 = await websearchTool.execute({ query: "test", engine: "bing", proxy: proxy.uri }, { agent: { config: {} } })
    assert.equal(proxy.hits, 1, "proxy 参数传入时 websearch 应尝试走代理")
    assert.match(r1, /no results/, "代理不可达时优雅失败而不是抛出")

    // 不传 proxy：即使 config.json 固定配置为 web:true，也不得走代理（固定配置自动路由已废止）
    const ctxProxied = { agent: { config: { proxy: { uri: proxy.uri, web: true, model: false } } } }
    const r2 = await websearchTool.execute({ query: "test", engine: "bing" }, ctxProxied)
    assert.equal(proxy.hits, 1, "未传 proxy 参数时不得使用 config.json 的固定代理（直连，不再新增代理连接）")
    // 直连 Bing 可能真实成功（本机可直连国外）也可能失败降级——两者都是合法"未走代理"行为
    assert.match(r2, /1\. \[Bing\]|no results/, "直连结果或优雅降级均可，关键是 hits 不变")

    // resolveWebProxy 函数本身仍存在（cmd-config 测试连接用），语义不变
    assert.equal(resolveWebProxy(ctxProxied), proxy.uri, "resolveWebProxy 供 UI 测试连接用，不自动路由工具")
  } finally {
    proxy.close()
  }
})

test("fetch: proxy 参数显式传才走代理；不传直连（config 固定配置不再自动路由）——2026-08-31 裁定", async () => {
  const proxy = await fakeProxy()
  try {
    // SSRF guard 拦本地：用不存在的外部域名，仅验证代理连接计数
    const url = "http://definitely-not-a-real-host.invalid/page"
    // 显式 proxy 参数：代理必须被尝试（CONNECT 命中计数 1）；假代理 accept 即断 → 抛 fetch failed 属预期
    try { await fetchTool.execute({ url, proxy: proxy.uri }, { agent: { config: {} } }) } catch { /* fake proxy always dies */ }
    assert.equal(proxy.hits, 1, "proxy 参数传入时 fetch 应走代理")

    // 未传 proxy：即使 config 配了 web:true，也不得走代理
    // （proxyFetch 无代理路径是返回 error-object 而非 throw——两者都合法，关键断言 = hits 不变）
    const ctxProxied = { agent: { config: { proxy: { uri: proxy.uri, web: true, model: false } } } }
    try { await fetchTool.execute({ url }, ctxProxied) } catch { /* 直连 .invalid 必然失败，不在乎形式 */ }
    assert.equal(proxy.hits, 1, "未传 proxy 参数时不得使用 config.json 的固定代理")
  } finally {
    proxy.close()
  }
})


// ====================================================================
// cmd-config proxy 菜单（不落盘的部分，进程内）
// ====================================================================

/** cmd-config ctx mock：showPicker 按 action 队列返回菜单项 */
function configCtx(agent, actions, lines = []) {
  return {
    agent,
    lines,
    pushLine: (t) => lines.push(t),
    pushLabel: (t) => lines.push(t),
    showPicker: async (title, entries) => {
      const a = actions.shift()
      return a == null ? null : entries.find((e) => e.action === a) ?? null
    },
    askQuestion: async () => "",
    persistRaw: async (fn) => fn({}),
    maskKey: () => "***",
  }
}

test("cmd-config proxy: Test connection 走当前生效代理并报告失败原因", async () => {
  const proxy = await fakeProxy()
  try {
    const agent = { config: { proxy: { uri: proxy.uri, web: true, model: false } }, provider: {}, providers: [] }
    const lines = []
    // 主菜单选 proxy → 子菜单选 test → Esc 子菜单 → Esc 主菜单
    const ctx = configCtx(agent, ["proxy", "test", null, null], lines)
    await handleConfigCommand(ctx, [])
    assert.equal(proxy.hits, 1, "Test connection 应尝试经代理请求")
    assert.ok(lines.some((l) => l.includes("✗")), "假代理断开 → 打出失败原因")
    assert.ok(lines.some((l) => l.includes("via proxy")), "提示里说明走了哪个代理")
  } finally {
    proxy.close()
  }
})

test("cmd-config proxy: 未设 URI 时 toggle 提示先设 URI，不落盘", async () => {
  const agent = { config: {}, provider: {}, providers: [] }
  const lines = []
  const ctx = configCtx(agent, ["proxy", "toggleweb", null, null], lines)
  await handleConfigCommand(ctx, [])
  assert.ok(lines.some((l) => /not set/i.test(l)))
  assert.equal(agent.config.proxy, undefined, "未设置时不产生 proxy 配置")
})

// ====================================================================
// cmd-config saveProxy 流程（隔离 HOME 子进程，不碰真实 ~/.thincoder）
// ====================================================================

test("cmd-config proxy: toggle model 后 saveConfig→loadConfig→injectProxy 全链路生效", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x", proxy: true }],
    activeProvider: "deepseek",
    proxy: { uri: "http://127.0.0.1:1", web: true, model: false },
  }))

  const script = `
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const { handleConfigCommand } = await import("./src/tui/cmd-config.mjs")
const { loadConfig, configPath } = await import("./src/config.mjs")
const cfg = loadConfig()
const agent = { config: cfg, provider: cfg.provider, providers: cfg.providersList, activeProvider: cfg.activeProvider }
const actions = ["proxy", "togglemodel", null, null]
const ctx = {
  agent,
  pushLine: () => {}, pushLabel: () => {},
  showPicker: async (title, entries) => {
    const a = actions.shift()
    return a == null ? null : entries.find((e) => e.action === a) ?? null
  },
  askQuestion: async () => "",
  persistRaw: async (fn) => fn({}),
  maskKey: () => "***",
}
await handleConfigCommand(ctx, [])
const raw = JSON.parse(readFileSync(configPath, "utf8"))
assert.equal(raw.proxy.model, true, "已落盘")
assert.equal(raw.proxy.web, true, "web 值保留")
assert.equal(agent.config.proxy.model, true, "agent.config 已重载")
const active = agent.providers.find((p) => p.name === agent.activeProvider)
assert.equal(active.proxyUri, "http://127.0.0.1:1", "providersList 已注入（provider.proxy:true × model:true）")
assert.equal(agent.provider.proxyUri, active.proxyUri, "运行时 provider 同步注入")
console.log("saveProxy flow OK")
`
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
  assert.match(out, /saveProxy flow OK/)
})

// ====================================================================
// 流式隧道（streamHttpResponse 裸 socket 测试，覆盖分包/流式/abort/中断）
// ====================================================================

import { connect } from "node:net"
import { once } from "node:events"
import { createServer as createHttpServer } from "node:http"
import { streamHttpResponse, proxyFetch } from "../src/proxy.mjs"
import { readSSE } from "../src/provider/core.mjs"
import { createPickers } from "../src/tui/pickers.mjs"

/** 裸 TCP 客户端连到本地 server 并发请求，返回 streamHttpResponse 的 Promise */
async function rawRequest(port, opts = {}) {
  const sock = connect({ host: "127.0.0.1", port })
  await once(sock, "connect")
  return { sock, response: await streamHttpResponse(sock, "http://127.0.0.1/v1/chat", opts) }
}

/** 带超时的辅助：实现回退导致挂起时让测试失败而不是卡死（计时器随 settle 清除，不拖住进程退出） */
function withTimeout(promise, ms = 5000) {
  let timer
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`test timeout (${ms}ms) — 实现可能挂起`)), ms) }),
  ])
}

/** 关闭 server 并强制断开其上所有连接（避免遗留 handle 拖住进程退出） */
function closeServer(server) {
  server.closeAllConnections?.()
  server.close()
}

test("streamHttpResponse: 分包响应头不崩，SSE body 边收边吐（readSSE 集成）", async () => {
  // server：请求头到齐后，响应头分两包写；第一段 SSE 写出后等客户端 ack 再写第二段。
  // 若实现退化为"缓冲到连接关闭才吐"，第一段永远到不了客户端 → ack 永远不来 → 超时失败。
  const server = createServer((s) => {
    let buf = ""
    s.on("data", (d) => {
      buf += d.toString()
      if (!buf.includes("\r\n\r\n")) return
      buf = ""
      s.write("HTTP/1.1 200 OK\r\nContent-Type: text/event") // 头部第一包（截断在中间）
      setTimeout(() => {
        s.write('-stream\r\nX-Test: yes\r\n\r\ndata: {"choices":[{"delta":{"content":"hello"}}]}\n\n')
        s.once("data", () => { // 等 ack
          s.write('data: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DONE]\n\n')
          s.end()
        })
      }, 30)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  let sock
  try {
    const port = server.address().port
    sock = connect({ host: "127.0.0.1", port })
    await once(sock, "connect")
    const response = await streamHttpResponse(sock, "http://127.0.0.1/v1/chat", {})
    assert.equal(response.status, 200)
    assert.equal(response.ok, true)
    assert.equal(response.headers.get("content-type"), "text/event-stream")
    assert.equal(response.headers.get("x-test"), "yes")

    const tokens = []
    const result = await withTimeout(readSSE(response, {
      onToken: (t) => { tokens.push(t); if (tokens.length === 1) sock.write("x") }, // ack：证明边收边吐
    }))
    assert.deepEqual(tokens, ["hello", " world"])
    assert.equal(result.content, "hello world")
  } finally {
    sock?.destroy()
    closeServer(server)
  }
})

test("streamHttpResponse: text() 聚合完整响应（非流式调用方）", async () => {
  const server = createServer((s) => {
    s.on("data", () => {
      const body = JSON.stringify({ data: [{ id: "m1" }] })
      s.end(`HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${body.length}\r\n\r\n${body}`)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  let sock
  try {
    const req = await withTimeout(rawRequest(server.address().port))
    sock = req.sock
    assert.equal(req.response.ok, true)
    const text = await withTimeout(req.response.text())
    assert.deepEqual(JSON.parse(text), { data: [{ id: "m1" }] })
  } finally {
    sock?.destroy()
    closeServer(server)
  }
})

test("streamHttpResponse: 流式中途 abort 终止 body 流（不挂起）", async () => {
  const server = createServer((s) => {
    s.on("data", () => {
      s.write('HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n\r\ndata: {"choices":[{"delta":{"content":"x"}}]}\n\n')
      // 之后保持沉默（模拟长生成）
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  let sock
  try {
    const controller = new AbortController()
    const req = await withTimeout(rawRequest(server.address().port, { signal: controller.signal }))
    sock = req.sock
    await withTimeout((async () => {
      let first = true
      try {
        for await (const _ of req.response.body) {
          if (first) { first = false; controller.abort() }
        }
        assert.fail("abort 后 for-await 应抛出")
      } catch (e) {
        assert.equal(e.name, "AbortError")
      }
    })())
  } finally {
    sock?.destroy()
    closeServer(server)
  }
})

test("streamHttpResponse: 头部阶段 abort / 服务器不响应 / 中途毁连接 都会失败而不挂起", async () => {
  // 1) 头部阶段 abort → reject AbortError
  const silent = createServer(() => {}) // 永不响应
  await new Promise((r) => silent.listen(0, "127.0.0.1", r))
  const controller = new AbortController()
  const sock = connect({ host: "127.0.0.1", port: silent.address().port })
  await once(sock, "connect")
  const p = streamHttpResponse(sock, "http://127.0.0.1/x", { signal: controller.signal })
  p.catch(() => {}) // 防 unhandled
  controller.abort()
  await assert.rejects(p, (e) => e.name === "AbortError")
  sock.destroy()
  closeServer(silent)

  // 2) 连接即毁（对端 RST）→ reject 稳定契约 "Connection closed before response"（不裸抛 ECONNRESET）
  const killer = createServer((s) => s.destroy())
  await new Promise((r) => killer.listen(0, "127.0.0.1", r))
  const sock2 = connect({ host: "127.0.0.1", port: killer.address().port })
  await once(sock2, "connect")
  await assert.rejects(withTimeout(streamHttpResponse(sock2, "http://127.0.0.1/x", {})), /Connection closed before response/)
  sock2.destroy()
  closeServer(killer)

  // 3) 头 + 半截 body 后毁连接 → body 流结束（partial），不挂起
  const mid = createServer((s) => {
    s.on("data", () => {
      s.write("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n\r\ndata: partial")
      setTimeout(() => s.destroy(), 20)
    })
  })
  await new Promise((r) => mid.listen(0, "127.0.0.1", r))
  const req = await withTimeout(rawRequest(mid.address().port))
  const got = await withTimeout(req.response.text())
  assert.ok(got.includes("data: partial"), "已收到的部分不丢")
  req.sock.destroy()
  closeServer(mid)
})

// ====================================================================
// reloadConfig：四条保存路径保存后 proxyUri 保留 + 运行时 /model 切换不回滚
// ====================================================================

test("cmd-config: 任意保存路径后 proxyUri 保留；运行时 provider 切换不被回滚", () => {
  const home = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), JSON.stringify({
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-chat", apiKey: "sk-x", proxy: true },
      { name: "other", baseURL: "https://other.example.com", model: "m", apiKey: "sk-y", proxy: true },
    ],
    activeProvider: "deepseek",
    proxy: { uri: "http://127.0.0.1:1", web: true, model: true },
  }))

  const script = `
import assert from "node:assert/strict"
const { handleConfigCommand } = await import("./src/tui/cmd-config.mjs")
const { loadConfig } = await import("./src/config.mjs")
const cfg = loadConfig()
const agent = { config: cfg, provider: cfg.provider, providers: cfg.providersList, activeProvider: cfg.activeProvider }
const { injectProxy } = await import("./src/proxy.mjs")
injectProxy(agent.providers, agent.config)
agent.provider.proxyUri = agent.providers.find((p) => p.name === agent.activeProvider)?.proxyUri
const URI = "http://127.0.0.1:1"
assert.equal(agent.provider.proxyUri, URI, "初始注入")

const actions = []
const questions = []
const ctx = {
  agent,
  pushLine: () => {}, pushLabel: () => {},
  showPicker: async (title, entries) => {
    const a = actions.shift()
    return a == null ? null : entries.find((e) => e.action === a) ?? null
  },
  askQuestion: async () => questions.shift() ?? "",
  persistRaw: async (fn) => fn({}),
  maskKey: () => "***",
}

// 路径 1：verifyGuard toggle
actions.push("agent.verifyGuard")
await handleConfigCommand(ctx, [])
assert.equal(agent.provider.proxyUri, URI, "verifyGuard 保存后 proxyUri 保留")

// 路径 2：embedding.model 选择
actions.push("embedding.model", "text-embedding-3-small")
await handleConfigCommand(ctx, [])
assert.equal(agent.provider.proxyUri, URI, "embedding.model 保存后 proxyUri 保留")

// 路径 3：数值项
actions.push("agent.maxTurns")
questions.push("200")
await handleConfigCommand(ctx, [])
assert.equal(agent.provider.proxyUri, URI, "数值项保存后 proxyUri 保留")

// 运行时 /model 切到 other（未落盘）：保存后不得回滚
agent.activeProvider = "other"
agent.provider = { ...agent.providers.find((p) => p.name === "other") }
actions.push("agent.verifyGuard")
await handleConfigCommand(ctx, [])
assert.equal(agent.activeProvider, "other", "运行时 provider 切换保持")
assert.equal(agent.provider.name, "other")
assert.equal(agent.provider.proxyUri, URI, "保持的 provider 也带注入的 proxyUri")
console.log("reloadConfig flow OK")
`
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: projectRoot,
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: "utf8",
  })
  assert.match(out, /reloadConfig flow OK/)
})

// ====================================================================
// selectModel 落盘剥离运行时字段
// ====================================================================

test("selectModel: persistRaw 落盘的 providers 不含运行时 proxyUri", async () => {
  const saved = []
  const state = {}
  const agent = {
    providers: [{ name: "a", baseURL: "https://a", model: "m1", apiKey: "k", proxyUri: "http://127.0.0.1:1" }],
    activeProvider: "a",
    provider: { model: "m1" },
    config: {},
  }
  const { selectModel } = createPickers({
    agent, state, render: () => {}, ansi: { bold: "" },
    C: { tool: "", text: "", dim: "", error: "" },
    pushLine: () => {}, persistRaw: async (fn) => { const raw = {}; await fn(raw); saved.push(raw) },
    askQuestion: async () => "", maskKey: () => "***",
  })
  await selectModel({ provider: "a", model: "m1" })
  assert.equal(saved.length, 1)
  assert.equal(Object.hasOwn(saved[0].providers[0], "proxyUri"), false, "落盘不含 proxyUri")
  assert.equal(saved[0].providers[0].name, "a")
  assert.equal(saved[0].activeProvider, "a")
  // 运行时对象上的 proxyUri 不受影响
  assert.equal(agent.providers[0].proxyUri, "http://127.0.0.1:1")
})

// ====================================================================
// http:// 目标经典代理转发（绝对 URI 请求行）
// ====================================================================

/** 假 HTTP 代理：捕获请求行/头，返回罐装响应（不真正转发），返回 { state, uri, close } */
async function fakeHttpProxy(cannedResponse) {
  const state = { hits: 0, requestLine: "", headers: {} }
  const server = createServer((s) => {
    let buf = ""
    s.on("data", (d) => {
      buf += d.toString()
      const idx = buf.indexOf("\r\n\r\n")
      if (idx < 0) return
      const [requestLine, ...headerLines] = buf.slice(0, idx).split("\r\n")
      state.hits++
      state.requestLine = requestLine
      for (const line of headerLines) {
        const ci = line.indexOf(":")
        if (ci > 0) state.headers[line.slice(0, ci).trim().toLowerCase()] = line.slice(ci + 1).trim()
      }
      s.end(cannedResponse)
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    state,
    uri: `http://127.0.0.1:${server.address().port}`,
    close: () => { server.closeAllConnections?.(); server.close() },
  }
}

test("proxyFetch: http:// 目标经代理转发（绝对 URI 请求行 + Host 头 + opts.headers 透传）", async () => {
  const body = "proxied-hello"
  const proxy = await fakeHttpProxy(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n${body}`)
  try {
    const res = await withTimeout(proxyFetch("http://example.com/page?q=1", { headers: { "User-Agent": "thincoder-test" } }, proxy.uri))
    assert.equal(proxy.state.hits, 1)
    assert.equal(proxy.state.requestLine, "GET http://example.com/page?q=1 HTTP/1.1")
    assert.equal(proxy.state.headers["host"], "example.com")
    assert.equal(proxy.state.headers["user-agent"], "thincoder-test")
    assert.equal(res.status, 200)
    assert.equal(await withTimeout(res.text()), body)
  } finally {
    proxy.close()
  }
})

test("fetch 工具路由: proxyFetch 带代理走代理（目标不被直连），无代理直连目标", async () => {
  let targetHits = 0
  const target = createHttpServer((req, res) => { targetHits++; res.end("direct-body") })
  await new Promise((r) => target.listen(0, "127.0.0.1", r))
  const targetUrl = `http://127.0.0.1:${target.address().port}/page`
  const body = "via-proxy-body"
  const proxy = await fakeHttpProxy(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n${body}`)
  try {
    // 代理模式（fetch 工具 web:true 时即调用 proxyFetch(url, opts, proxyUri)）
    const r1 = await proxyFetch(targetUrl, {}, proxy.uri)
    assert.equal(await r1.text(), body)
    assert.equal(proxy.state.hits, 1)
    assert.equal(proxy.state.requestLine, `GET ${targetUrl} HTTP/1.1`)
    assert.equal(targetHits, 0, "走代理时目标不被直接访问")

    // 无代理（fetch 工具 web:false 时即调用 proxyFetch(url, opts, null) → globalThis.fetch）
    const r2 = await proxyFetch(targetUrl, {}, null)
    assert.equal(await r2.text(), "direct-body")
    assert.equal(targetHits, 1)
    assert.equal(proxy.state.hits, 1, "直连时不碰代理")
  } finally {
    proxy.close()
    target.closeAllConnections?.()
    target.close()
  }
})
