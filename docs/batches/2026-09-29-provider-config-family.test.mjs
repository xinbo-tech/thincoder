/**
 * 2026-09-29-provider-config-family.test.mjs — 批内件（provider-config-family 批 · #176 ∥ #177 ∥ #57）。
 * 名随批次档 · 不进仓套件 · 随批留存。**终位 = `docs/batches/2026-09-29-provider-config-family.test.mjs`**
 * （本副本 = 落位期暂存 `.thincoder/tmp/`，父侧转正；导入按 `process.cwd()`（仓库根）解析 ⇒ tmp ∕ 终位两处可跑）。
 * 复跑（仓库根 `thincoder/`）：
 *   node --test .thincoder/tmp/2026-09-29-provider-config-family.test.mjs
 *   node --test docs/batches/2026-09-29-provider-config-family.test.mjs   （转正后同跑）
 *
 * 覆盖 = 批档 §2.2.4 用例表：H-1..H-3（预设面——护栏重立：逐预设 `specMatch` 漂移白名单只减不增）∥
 * E-1..E-9（解析面 + 遮蔽零改 + 点集静态断言）+ 评审 #9 标题径行为例（设值 ⇒ Authorization 真值；
 * 未设 ⇒ 零请求 + 标题 null）+ 五族读点补齐（embedding ∕ websearch——E-1/E-4 同判据延伸）。
 * H-4（无 key 实拉不可达）= 非机检——批档 §5 记「待验（无 key）」。
 * 纪律：只读 ∕ 行为断言；实网零触（stub fetch ∕ 本地 127.0.0.1 桩 ∕ 本地 stdio 子进程）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const presets = await mod("thincoder-core/config-presets.mjs")
const specs = await mod("thincoder-core/model-specs.mjs")
const envRef = await mod("thincoder-core/env-ref.mjs")
const core = await mod("thincoder-core/provider/core.mjs")
const listModels = await mod("thincoder-core/provider/list-models.mjs")
const mcp = await mod("thincoder-core/mcp.mjs")
const titleMod = await mod("thincoder-core/generate-title.mjs")
const embedding = await mod("thincoder-core/embedding.mjs")
const webMod = await mod("thincoder-core/tools/web.mjs")
const settings = await mod("thincoder-core/agent-tools/settings.mjs")

/** chat 径假 SSE 响应（ok + event-stream；readSSE 读完即终）。 */
const chatOk = (content) => new Response(
  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`,
  { status: 200, headers: { "content-type": "text/event-stream" } },
)

// ─── #176 预设面（H-1..H-3） ───

test("H-1/H-2 预设面：huawei 行形（最小三字段）+ 22 键 + 既有 21 键零改（抽样逐字段）", () => {
  const names = Object.keys(presets.PROVIDER_PRESETS)
  assert.equal(names.length, 22, "预设总数 = 22")
  assert.deepEqual(names.slice(names.indexOf("tokenhub"), names.indexOf("tokenhub") + 2), ["tokenhub", "huawei"], "插位 = tokenhub 后（国内云厂商组尾）")
  // 行形：presetToEntry ⇒ { name, baseURL, model }（desc 剥离；无 thinking ∕ reasoningEffort ∕ maxTokens 键）
  assert.deepEqual(presets.presetToEntry("huawei"), {
    name: "huawei",
    baseURL: "https://api.modelarts-maas.com/openai/v1",
    model: "glm-5.3",
  })
  const raw = presets.PROVIDER_PRESETS.huawei
  assert.deepEqual(Object.keys(raw).sort(), ["baseURL", "desc", "model"], "预设行 = 最小三字段")
  assert.equal(raw.desc, "Huawei Cloud ModelArts Studio (华为云 MaaS)")
  // 既有 21 键零改：全键名 + 抽样逐字段 deepEqual（含 thinking ∕ effort ∕ maxTokens ∕ format ∕ chatPath 形态位）
  const OLD21 = ["deepseek", "kimi", "kimi-code", "glm", "glm-code", "qwen", "qwenplan", "mimo", "mimoplan", "minimax", "openai", "claude", "gemini", "grok", "mistral", "volcengine", "hunyuan", "tokenhub", "siliconflow", "openrouter", "groq"]
  assert.deepEqual([...names].sort(), [...OLD21, "huawei"].sort(), "键集 = 21 旧键 + huawei（零增删）")
  const SAMPLE = {
    deepseek: { baseURL: "https://api.deepseek.com", model: "deepseek-flash", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 384_000, desc: "DeepSeek" },
    "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", model: "k3", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
    minimax: { baseURL: "https://api.minimaxi.com/v1", model: "MiniMax-M3", thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
    claude: { baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-4", format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
    gemini: { baseURL: "https://generativelanguage.googleapis.com/v1beta", model: "gemini-2.5-flash", format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
    volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-2-0-code-preview-260215", maxTokens: 131072, desc: "Volcengine Ark (豆包)" },
    tokenhub: { baseURL: "https://tokenhub.tencentmaas.com/v1", model: "hy3", desc: "Tencent TokenHub (腾讯混元网关)" },
    siliconflow: { baseURL: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3", maxTokens: 32_000, desc: "SiliconFlow (硅基流动)" },
  }
  for (const [name, expect] of Object.entries(SAMPLE)) assert.deepEqual(presets.PROVIDER_PRESETS[name], expect, `预设 ${name} 零改`)
})

test("H-3 护栏：逐预设 specMatch ∕ 漂移白名单 {hunyuan, siliconflow, groq} 只减不增（huawei 命中既有行）", () => {
  const WHITELIST = new Set(["hunyuan", "siliconflow", "groq"])
  const unmatched = []
  const warn = console.warn
  console.warn = () => {} // 未知模型一次性告警静音（与断言面无关）
  try {
    for (const [name, p] of Object.entries(presets.PROVIDER_PRESETS)) {
      if (!specs.specMatch(p.model).matched) unmatched.push(name)
    }
  } finally { console.warn = warn }
  const grown = unmatched.filter((n) => !WHITELIST.has(n))
  assert.deepEqual(grown, [], `漂移白名单只减不增——新增未命中：${grown.join(", ")}`)
  assert.equal(specs.specMatch(presets.PROVIDER_PRESETS.huawei.model).matched, true, "huawei 选名命中既有规格行")
})

// ─── #57 解析面（E-1..E-9） ───

test("E-1 整值引用：chat 径 ∕ list-models 径 Authorization = 真值（解析产物零回写）", async () => {
  process.env.PCF_KEY = "sk-x"
  const realFetch = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, init) => {
    seen.push({ url: String(url), headers: init?.headers ?? {} })
    if (String(url).endsWith("/models")) {
      return new Response(JSON.stringify({ data: [{ id: "stub-model" }] }), { status: 200, headers: { "content-type": "application/json" } })
    }
    return chatOk("hello")
  }
  try {
    const provider = { name: "pcf", baseURL: "https://stub.invalid/v1", model: "stub-model", apiKey: "${env:PCF_KEY}" }
    const res = await core.chat(provider, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(res.content, "hello")
    assert.equal(seen[0].headers.Authorization, "Bearer sk-x", "chat 径 Authorization = 解析真值")
    const ids = await listModels.listModels(provider)
    assert.deepEqual(ids, ["stub-model"])
    assert.equal(seen[1].headers.Authorization, "Bearer sk-x", "list-models 径 Authorization = 解析真值")
    assert.equal(provider.apiKey, "${env:PCF_KEY}", "原对象零改（解析产物永不回写）")
  } finally { globalThis.fetch = realFetch; delete process.env.PCF_KEY }
})

test("E-2 内嵌 ∕ 多引用同解", () => {
  process.env.PCF_A = "va"
  process.env.PCF_B = "vb"
  try {
    assert.equal(envRef.resolveEnvRefs("p-${env:PCF_A}-${env:PCF_B}"), "p-va-vb")
    assert.equal(envRef.resolveEnvRefs("${env:PCF_A}${env:PCF_A}"), "vava")
    assert.equal(envRef.resolveEnvRefs("a${env:PCF_A}b${env:PCF_B}c"), "avabvbc")
    assert.deepEqual(envRef.resolveEnvRefMap({ "X-A": "${env:PCF_A}", "X-B": "plain" }), { "X-A": "va", "X-B": "plain" })
  } finally { delete process.env.PCF_A; delete process.env.PCF_B }
})

test("E-3 无引用值逐字零变（空串 ∕ 非字符串原样；零引用零拷贝）", () => {
  const s = "sk-literal-123"
  assert.equal(envRef.resolveEnvRefs(s), s)
  assert.equal(envRef.resolveEnvRefs(""), "")
  assert.equal(envRef.resolveEnvRefs(undefined), undefined)
  assert.equal(envRef.resolveEnvRefs(null), null)
  assert.equal(envRef.resolveEnvRefs(42), 42)
  const obj = { a: 1 }
  assert.equal(envRef.resolveEnvRefs(obj), obj, "非字符串原样（同引用）")
  const map = { "X-H": "plain" }
  assert.equal(envRef.resolveEnvRefMap(map), map, "无引用 map 原对象返回")
  const provider = { apiKey: "sk-1", headers: { "X-H": "plain" } }
  assert.equal(envRef.resolveProviderSecrets(provider), provider, "provider 无引用原对象返回")
  const server = { token: "t", headers: { A: "1" }, env: { B: "2" } }
  assert.equal(envRef.resolveMcpServerSecrets(server), server, "MCP 无引用原对象返回")
})

test("E-4/E-5 未设 ∕ 空串 ⇒ 抛错（点名变量）· 零请求发出（无字面透传）", async () => {
  delete process.env.PCF_MISSING
  const realFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls += 1; throw new Error("zero-request violated") }
  try {
    const provider = { name: "pcf", baseURL: "https://stub.invalid/v1", model: "stub-model", apiKey: "${env:PCF_MISSING}" }
    await assert.rejects(() => core.chat(provider, { messages: [{ role: "user", content: "hi" }] }), /PCF_MISSING/)
    await assert.rejects(() => listModels.listModels(provider), /PCF_MISSING/)
    assert.equal(calls, 0, "解析抛错于请求前——零请求发出")
    process.env.PCF_EMPTY = ""
    const p2 = { ...provider, apiKey: "${env:PCF_EMPTY}" }
    await assert.rejects(() => core.chat(p2, { messages: [{ role: "user", content: "hi" }] }), /PCF_EMPTY/)
    assert.equal(calls, 0, "空串 = 未设——同判")
  } finally { globalThis.fetch = realFetch; delete process.env.PCF_EMPTY }
})

test("E-6 畸形引用抛错（点名畸形）", () => {
  for (const bad of ["${env:1bad}", "${env:}", "${env:FOO", "x${env:bad name}"]) {
    assert.throws(() => envRef.resolveEnvRefs(bad), (e) => /malformed env reference/.test(e.message), `畸形：${bad}`)
  }
})

test("E-7a MCP HTTP：token ∕ headers 两族传输收到解析值（存储原文零改）", async () => {
  process.env.PCF_MCP_T = "tok-1"
  process.env.PCF_MCP_H = "hval-1"
  const seen = []
  const server = createServer((req, res) => {
    if (req.method === "GET") { res.writeHead(405); res.end("no-sse"); return }
    let body = ""
    req.on("data", (c) => { body += c })
    req.on("end", () => {
      seen.push(req.headers)
      let msg = null
      try { msg = JSON.parse(body) } catch { /* notify 之外的非 JSON 不属本桩 */ }
      if (!msg || msg.id === undefined) { res.writeHead(202); res.end(); return }
      const result = msg.method === "initialize"
        ? { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "pcf-stub", version: "0" } }
        : { tools: [{ name: "ping", description: "stub", inputSchema: { type: "object", properties: {} } }] }
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }))
    })
  })
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok))
  const port = server.address().port
  const config = { name: "pcf-http", url: `http://127.0.0.1:${port}/mcp`, token: "${env:PCF_MCP_T}", headers: { "X-Extra": "${env:PCF_MCP_H}" } }
  try {
    const tools = await mcp.connectMcpServer(config)
    assert.equal(tools.length, 1)
    assert.equal(seen[0].authorization, "Bearer tok-1", "token 族解析后合成 Authorization（传输收到真值）")
    assert.equal(seen[0]["x-extra"], "hval-1", "headers 族解析后送达")
    assert.equal(config.token, "${env:PCF_MCP_T}", "存储原文零改（不写回）")
    assert.equal(config.headers["X-Extra"], "${env:PCF_MCP_H}")
  } finally {
    for (const s of mcp._sessions.values()) { s.closed = true; try { s.state.transport?.close() } catch { /* ignore */ } }
    mcp._sessions.clear()
    await new Promise((ok) => server.close(ok))
    delete process.env.PCF_MCP_T; delete process.env.PCF_MCP_H
  }
})

/** 本地 stdio MCP 桩：握手（initialize + tools/list）；工具名 = `env-<PCF_MCP_ENV>`（env 族解析值回证）。 */
const STDIO_CHILD_SRC = `
let buf = ""
const send = (o) => process.stdout.write(JSON.stringify(o) + "\\n")
process.stdin.on("data", (c) => {
  buf += c
  let i
  while ((i = buf.indexOf("\\n")) !== -1) {
    const line = buf.slice(0, i)
    buf = buf.slice(i + 1)
    if (!line.trim()) continue
    let msg = null
    try { msg = JSON.parse(line) } catch { continue }
    if (msg.method === "initialize") send({ jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "pcf-stub", version: "0" } } })
    else if (msg.method === "tools/list") send({ jsonrpc: "2.0", id: msg.id, result: { tools: [{ name: "env-" + (process.env.PCF_MCP_ENV ?? "UNSET"), description: "stub", inputSchema: { type: "object", properties: {} } }] } })
  }
})
`

test("E-7b MCP stdio：env 族解析值送达 + 指纹按存储原文（改 env 值不重连 ∕ 改引用串重连）", async () => {
  process.env.PCF_MCP_E = "v1"
  const c1 = { name: "pcf-stdio", command: process.execPath, args: ["-e", STDIO_CHILD_SRC], env: { PCF_MCP_ENV: "${env:PCF_MCP_E}" } }
  try {
    const tools1 = await mcp.connectMcpServer(c1)
    assert.equal(tools1.length, 1)
    assert.ok(tools1[0].name.includes("env-v1"), `env 族解析值送达子进程——${tools1[0].name}`)
    process.env.PCF_MCP_E = "v2"
    const tools2 = await mcp.connectMcpServer(c1)
    assert.equal(tools2, tools1, "指纹按存储原文——改 env 值不触重连（同 session 复用）")
    process.env.PCF_MCP_E2 = "v3"
    const c2 = { ...c1, env: { PCF_MCP_ENV: "${env:PCF_MCP_E2}" } }
    const tools3 = await mcp.connectMcpServer(c2)
    assert.notEqual(tools3, tools1, "改引用串 ⇒ 指纹变更 ⇒ 重连重建")
    assert.ok(tools3[0].name.includes("env-v3"), `重连按当时环境重解析——${tools3[0].name}`)
  } finally {
    for (const s of mcp._sessions.values()) { s.closed = true; try { s.state.transport?.close() } catch { /* ignore */ } }
    mcp._sessions.clear()
    delete process.env.PCF_MCP_E; delete process.env.PCF_MCP_E2
  }
})

test("E-8 遮蔽零改：引用串住敏感值位 ⇒ MASKED（headers 族同）", async () => {
  const tool = settings.settingsTool({ configPath: join(ROOT, ".thincoder", "tmp", "pcf-get-only-never-written.json") })
  const agent = { config: { providers: [{ name: "p", apiKey: "${env:PCF_MASK}", headers: { "X-Secret": "${env:PCF_MASK}" } }] } }
  const got = await tool.execute({ action: "get", key: "providers.0.apiKey" }, { agent })
  assert.equal(got, `providers.0.apiKey = ${settings.MASKED} (string)`)
  assert.ok(!got.includes("env:PCF_MASK"), "引用串亦不回显")
  const gotH = await tool.execute({ action: "get", key: "providers.0.headers.X-Secret" }, { agent })
  assert.equal(gotH, `providers.0.headers.X-Secret = ${settings.MASKED} (string)`, "headers 族遮罩不变")
})

test("E-9 静态：解析函数使用点集 = 六处（排除叶档定义 ∕ 内部复用）——防漏接 ∕ 防扩面", () => {
  const TREES = ["thincoder-core", "thincoder-cli/src", "thincoder-cli/bin", "thincoder-vscode/src", "thincoder-desktop/src"]
  const FUNCS = /resolveEnvRefs|resolveEnvRefMap|resolveProviderSecrets|resolveMcpServerSecrets/
  const hits = []
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === "node_modules") continue
      const p = join(dir, ent.name)
      if (ent.isDirectory()) { walk(p); continue }
      if (!ent.name.endsWith(".mjs")) continue
      const rel = relative(ROOT, p).split(sep).join("/")
      if (rel === "thincoder-core/env-ref.mjs") continue // 叶档自身定义 ∕ 内部复用（匹配口径）
      if (FUNCS.test(readFileSync(p, "utf8"))) hits.push(rel)
    }
  }
  for (const t of TREES) walk(join(ROOT, t))
  assert.deepEqual(hits.sort(), [
    "thincoder-core/embedding.mjs",
    "thincoder-core/generate-title.mjs",
    "thincoder-core/mcp.mjs",
    "thincoder-core/provider/core.mjs",
    "thincoder-core/provider/list-models.mjs",
    "thincoder-core/tools/web.mjs",
  ], "六处消费点（防漏接 ∕ 防扩面）")
  const USE = {
    "thincoder-core/provider/core.mjs": "resolveProviderSecrets",
    "thincoder-core/provider/list-models.mjs": "resolveProviderSecrets",
    "thincoder-core/mcp.mjs": "resolveMcpServerSecrets",
    "thincoder-core/tools/web.mjs": "resolveEnvRefs",
    "thincoder-core/embedding.mjs": "resolveEnvRefs",
    "thincoder-core/generate-title.mjs": "resolveProviderSecrets",
  }
  for (const [f, fn] of Object.entries(USE)) {
    assert.ok(readFileSync(join(ROOT, f), "utf8").includes(fn), `${f} 使用 ${fn}`)
  }
})

// ─── 标题径行为例（评审 #9 补 · #1 修正残余） ∕ 五族读点补齐 ───

test("标题径（评审 #9 补例）：设值 ⇒ Authorization 真值；未设 ⇒ 零请求 + 标题 null（:117 兜底同形）", async () => {
  const realFetch = globalThis.fetch
  let calls = 0
  const seen = []
  globalThis.fetch = async (url, init) => {
    calls += 1
    seen.push({ url: String(url), headers: init?.headers ?? {} })
    return new Response(JSON.stringify({ choices: [{ message: { content: "Auto Title" } }] }), { status: 200, headers: { "content-type": "application/json" } })
  }
  try {
    process.env.PCF_TITLE_K = "sk-title"
    const provider = { baseURL: "https://stub.invalid/v1", model: "stub-model", apiKey: "${env:PCF_TITLE_K}" }
    assert.equal(await titleMod.generateTitle("A long enough first user message", provider), "Auto Title")
    assert.equal(calls, 1)
    assert.equal(seen[0].headers.Authorization, "Bearer sk-title", "标题径 Authorization = 解析真值")
    delete process.env.PCF_TITLE_K
    calls = 0
    const p2 = { ...provider, apiKey: "${env:PCF_TITLE_MISSING}" }
    assert.equal(await titleMod.generateTitle("A long enough first user message", p2), null)
    assert.equal(calls, 0, "未设 ⇒ 零请求（既有非致命兜底 ⇒ 标题 null）")
    const agent = { history: [{ role: "user", content: "A long enough first user message" }], provider: p2 }
    assert.equal(await titleMod.ensureSessionTitle(agent), null)
    assert.equal(calls, 0, "ensureSessionTitle 径同判（:139-141 兜底）")
  } finally { globalThis.fetch = realFetch }
})

test("五族读点补齐：embedding 读点 ∕ websearch 读点（E-1/E-4 同判据延伸）", async () => {
  process.env.PCF_EMB = "sk-emb"
  assert.equal(embedding.createEmbedder({ baseURL: "https://stub.invalid/v1", apiKey: "${env:PCF_EMB}", model: "bge-m3" }).apiKey, "sk-emb")
  delete process.env.PCF_EMB
  assert.throws(() => embedding.createEmbedder({ baseURL: "https://stub.invalid/v1", apiKey: "${env:PCF_EMB}", model: "bge-m3" }), /PCF_EMB/)
  process.env.PCF_TAV = "tvly-x"
  const realFetch = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, init) => {
    seen.push({ url: String(url), headers: init?.headers ?? {} })
    return new Response(JSON.stringify({ results: [{ url: "https://r", title: "t", content: "c" }] }), { status: 200, headers: { "content-type": "application/json" } })
  }
  try {
    const out = await webMod.websearchTool.execute({ query: "q" }, { agent: { config: { websearch: { apiKey: "${env:PCF_TAV}" } } } })
    assert.ok(out.includes("[tavily]"), out)
    assert.equal(seen[0].headers.Authorization, "Bearer tvly-x", "websearch 读点 Authorization = 解析真值")
    delete process.env.PCF_TAV
    seen.length = 0
    await assert.rejects(
      () => webMod.websearchTool.execute({ query: "q" }, { agent: { config: { websearch: { apiKey: "${env:PCF_TAV}" } } } }),
      /PCF_TAV/,
    )
    assert.equal(seen.length, 0, "websearch 读点解析抛错于请求前——零请求")
  } finally { globalThis.fetch = realFetch; delete process.env.PCF_TAV }
})
