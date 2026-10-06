/**
 * 2026-10-06-server-presets.test.mjs — thincoder-server 批内单测件（provider 预设实施轮；名随批档 · 随批留存）。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-server-presets.test.mjs`
 *
 * 射程（ops/OPS.md §1「预设形」∥ §9 用例 ∥ KD-SV-17）：
 *   ① 漂移件：server 键集 = 核表（`thincoder-core/config-presets.mjs`——只读对照）OpenAI 兼容子集
 *      （`!format && !chatPath` 派生）∥ 同键 `baseURL`/`model` 逐值相等（核表更新后重跑本件即报）
 *   ② 展开单元：缺省（`name` = 预设名 ∥ `baseURL`/`model` 取预设值）∥ 覆盖（显式在场者胜）∥ 未知拒启（列可用名）∥ 手写形原样
 *   ③ N12：预设形最小条目载入展开（默认模型值 = 核表实读）∥ `/v1/models` 含 `deepseek/<默认模型>` ∥ 经 mock 上游完成一次请求
 *   ④ N13：条目覆盖生效（预设值不吞条目字段）∥ 派发与清单按条目展开
 *   ⑤ B9：同预设双条、均未给 `name` ⇒ 拒启（重名）∥ 其一显式 `name` ⇒ 放行
 *   ⑥ E11：未知预设名 ⇒ 拒启（报错列可用名；排除面不在列）∥ 入口非零退出
 *   ⑦ 手写形回归 ∥ `config.example.json` 冒烟（双形并存载入 ∥ 零真 key）⑧ 零第三方依赖扫描
 * mock 上游 = 端口随机 `node:http`（沿 -chat/-model-ref 件形）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

const CONFIG = await load("thincoder-server/src/ops/config.mjs")
const PRESETS = await load("thincoder-server/src/ops/presets.mjs")
const CORE = await load("thincoder-core/config-presets.mjs") // 只读对照（漂移件取数——非运行期依赖，KD-SV-2 运行期面零涉）
const DB = await load("thincoder-server/src/store/db.mjs")
const SERVER = await load("thincoder-server/src/gateway/server.mjs")
const GATEWAY_ROUTES = await load("thincoder-server/src/gateway/routes.mjs")
const KEYS = await load("thincoder-server/src/accounts/keys.mjs")
const BIN_PATH = join(ROOT, "thincoder-server", "bin", "thincoder-server.mjs")

const ENV = { TC_TEST_KEY: "sk-test-value" }
const EMBEDDING = { baseURL: "http://127.0.0.1:11434/v1", model: "bge-m3" }

function tmpDir(tag) {
  return mkdtempSync(join(tmpdir(), `tcsrv-${tag}-`))
}

function writeConfig(dir, config) {
  const file = join(dir, "config.json")
  writeFileSync(file, typeof config === "string" ? config : JSON.stringify(config, null, 2))
  return file
}

/** 组成员夹具（`/v1/*` 面 = 团队 key 门）。 */
function seedMember(db, username = "alice") {
  const info = db
    .prepare("INSERT INTO members (username, name, password_hash, created_at) VALUES (?, ?, 'scrypt$fixture', ?)")
    .run(username, username, new Date().toISOString())
  return Number(info.lastInsertRowid)
}

/** mock 上游（端口随机）：记录 `{ method, url, headers, body }`；回固定 chat 应答。 */
async function startMockUpstream() {
  const requests = []
  const server = createHttpServer((req, res) => {
    const chunks = []
    req.on("data", (c) => chunks.push(c))
    req.on("end", () => {
      let body = null
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")) } catch { /* 非 JSON 请求体：以 null 判 */ }
      requests.push({ method: req.method, url: req.url, headers: req.headers, body })
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify({ id: "from-mock", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "from-mock" } }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }))
    })
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    requests,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 进程内网关（OpenAI 面注册行）。 */
async function startGateway({ db, config, env = process.env }) {
  const log = { info() {}, warn() {}, error() {} }
  const routes = SERVER.createRouteTable()
  GATEWAY_ROUTES.registerGatewayRoutes(routes, { db, config, env })
  const server = SERVER.createGatewayServer({ config, routes, log })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() { server.closeAllConnections?.(); await new Promise((resolve) => server.close(resolve)) },
  }
}

/** 非流式 chat 请求（JSON 体）。 */
async function chatJson(base, { key = null, body } = {}) {
  const headers = { "content-type": "application/json" }
  if (key) headers.authorization = `Bearer ${key}`
  const res = await fetch(`${base}/v1/chat/completions`, { method: "POST", headers, body: JSON.stringify(body) })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* 非 JSON 体：以 text 判 */ }
  return { status: res.status, json, text }
}

/** 入口子进程夹具（拒启读数：退出码 + stdout；stderr 丢读防背压）。 */
function spawnNode(args) {
  const child = spawn(process.execPath, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
  let stdout = ""
  child.stdout.on("data", (d) => { stdout += d })
  child.stderr.on("data", () => {})
  const exited = new Promise((resolve) => child.on("exit", (code) => resolve({ code })))
  return { child, exited, out: () => stdout }
}

// ── ① 漂移件（server 自持表 ↔ CLI 核表——快照口径，KD-SV-17）─────────────────

test("漂移件：server 键集 = 核表 OpenAI 兼容子集（!format && !chatPath）∥ 同键 baseURL/model 逐值相等", () => {
  const serverKeys = Object.keys(PRESETS.SERVER_PRESETS)
  const coreKeys = Object.entries(CORE.PROVIDER_PRESETS)
    .filter(([, preset]) => !preset.format && !preset.chatPath)
    .map(([key]) => key)
  assert.deepEqual([...serverKeys].sort(), [...coreKeys].sort(), "键集漂移（核表更新 ⇒ 表 ∥ OPS.md 名单 ∥ 本件三处同改）")
  assert.equal(serverKeys.length, 20, "起步 20 家（ops/OPS.md §1 覆盖面）")
  for (const key of serverKeys) {
    const server = PRESETS.SERVER_PRESETS[key]
    const core = CORE.PROVIDER_PRESETS[key]
    assert.deepEqual(Object.keys(server).sort(), ["baseURL", "model"], `${key}：每键只载 { baseURL, model }`)
    assert.equal(server.baseURL, core.baseURL, `${key}：baseURL 逐值相等`)
    assert.equal(server.model, core.model, `${key}：model 逐值相等`)
  }
  for (const key of ["claude", "gemini", "opencode-go-anthropic", "minimax"]) { // 排除 4 家（format/chatPath 面——非 OpenAI 协议）
    assert.ok(!serverKeys.includes(key), `排除面混入：${key}`)
  }
})

// ── ② 展开单元（缺省 ∥ 覆盖 ∥ 未知拒启 ∥ 手写形放行）──────────────────────────

test("expandProviderEntry：缺省 ∥ 覆盖 ∥ 未知拒启（列可用名）∥ 手写形原样放行", () => {
  const core = CORE.PROVIDER_PRESETS.deepseek
  const bare = PRESETS.expandProviderEntry({ preset: "deepseek", apiKey: "env:X" })
  assert.equal(bare.name, "deepseek") // name 缺省 = 预设名
  assert.equal(bare.baseURL, core.baseURL)
  assert.deepEqual(bare.models, [core.model]) // models 缺省 = [预设默认模型]
  assert.equal(bare.apiKey, "env:X") // apiKey 只住条目（原样携带——解析归注册表构建期）

  const over = PRESETS.expandProviderEntry({ preset: "qwen", name: "bailian", baseURL: "http://10.0.0.9:8000/v1", models: ["m1", "m2"], apiKey: "k" })
  assert.deepEqual(over, { name: "bailian", baseURL: "http://10.0.0.9:8000/v1", apiKey: "k", models: ["m1", "m2"] })

  // 显式在场值不被缺省吞（展开面不静默修正——值校验归 config.mjs 既有判据）
  assert.equal(PRESETS.expandProviderEntry({ preset: "qwen", name: "" }).name, "")
  assert.equal(PRESETS.expandProviderEntry({ preset: "qwen", baseURL: null }).baseURL, null)

  for (const bad of ["nope", "", null, 123]) { // 未知预设名（含非字符串）⇒ 抛
    assert.throws(() => PRESETS.expandProviderEntry({ preset: bad }), /未知预设名/, `preset=${JSON.stringify(bad)}`)
  }
  let listed = ""
  try { PRESETS.expandProviderEntry({ preset: "nope" }, "providers[2]") } catch (e) { listed = e.message }
  assert.match(listed, /providers\[2\]\.preset/)
  for (const key of Object.keys(PRESETS.SERVER_PRESETS)) assert.ok(listed.includes(key), `报错名单缺 ${key}`)

  const hand = { name: "internal", baseURL: "http://10.0.0.9:8000/v1", apiKey: "", models: ["deepseek-v3"] }
  assert.deepEqual(PRESETS.expandProviderEntry(hand), hand) // 无 preset ⇒ 原样
})

// ── ③ N12：最小预设形（展开 ∥ 清单 ∥ 经 mock 上游一次请求）────────────────────

test("N12：{preset:'deepseek',apiKey:'env:X'} 载入 ⇒ 展开（核表实读值）∥ /v1/models 含 deepseek/<默认模型> ∥ 经 mock 上游完成一次请求", async () => {
  const dir = tmpDir("preset-n12")
  const deepseek = CORE.PROVIDER_PRESETS.deepseek
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  try {
    // 最小形（零覆盖）：展开值与核表实读一致
    const bareFile = writeConfig(dir, { host: "127.0.0.1", providers: [{ preset: "deepseek", apiKey: "env:TC_TEST_KEY" }], embedding: EMBEDDING })
    const loaded = CONFIG.loadConfig(bareFile, { env: ENV }).config.providers[0]
    assert.deepEqual(loaded, { name: "deepseek", baseURL: deepseek.baseURL, apiKey: "env:TC_TEST_KEY", models: [deepseek.model] })

    // 实请求段：同预设条目 + baseURL 覆盖指 mock（唯一可达 mock 路）——name/models 仍取预设缺省
    const liveFile = writeConfig(dir, { host: "127.0.0.1", providers: [{ preset: "deepseek", baseURL: `${mock.base}/v1`, apiKey: "env:TC_TEST_KEY" }], embedding: EMBEDDING })
    const live = CONFIG.loadConfig(liveFile, { env: ENV }).config
    assert.equal(live.providers[0].name, "deepseek")
    assert.deepEqual(live.providers[0].models, [deepseek.model])
    const app = await startGateway({ db, config: live, env: ENV })
    try {
      const key = KEYS.issueKey(db, seedMember(db)).plain
      const list = await fetch(`${app.base}/v1/models`, { headers: { authorization: `Bearer ${key}` } })
      assert.ok((await list.json()).data.map((m) => m.id).includes(`deepseek/${deepseek.model}`), "清单应含 deepseek/<默认模型>")
      const chat = await chatJson(app.base, { key, body: { model: `deepseek/${deepseek.model}`, messages: [] } })
      assert.equal(chat.status, 200)
      assert.equal(chat.json.choices[0].message.content, "from-mock")
      assert.equal(mock.requests.length, 1)
      assert.equal(mock.requests[0].url, "/v1/chat/completions")
      assert.equal(mock.requests[0].body.model, deepseek.model) // 上游 model = 首斜杠余段
      assert.equal(mock.requests[0].headers.authorization, "Bearer sk-test-value") // 真 key 代持（env: 构建期解析）
    } finally {
      await app.close()
    }
  } finally {
    await mock.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ④ N13：覆盖生效（预设值不吞条目字段）─────────────────────────────────────

test("N13：预设形 + 条目覆盖（name ∥ baseURL ∥ models 自备）⇒ 覆盖生效 ∥ 派发与清单按条目展开", async () => {
  const dir = tmpDir("preset-n13")
  const mock = await startMockUpstream()
  const db = DB.openDatabase(":memory:")
  try {
    const file = writeConfig(dir, {
      host: "127.0.0.1",
      providers: [{ preset: "qwen", name: "bailian", baseURL: `${mock.base}/v1`, apiKey: "env:TC_TEST_KEY", models: ["qwen3.5-plus", "qwen3.7-max"] }],
      embedding: EMBEDDING,
    })
    const loaded = CONFIG.loadConfig(file, { env: ENV }).config.providers[0]
    assert.deepEqual(loaded, { name: "bailian", baseURL: `${mock.base}/v1`, apiKey: "env:TC_TEST_KEY", models: ["qwen3.5-plus", "qwen3.7-max"] })
    const app = await startGateway({ db, config: CONFIG.loadConfig(file, { env: ENV }).config, env: ENV })
    try {
      const key = KEYS.issueKey(db, seedMember(db)).plain
      const ids = (await (await fetch(`${app.base}/v1/models`, { headers: { authorization: `Bearer ${key}` } })).json()).data.map((m) => m.id)
      assert.ok(ids.includes("bailian/qwen3.5-plus") && ids.includes("bailian/qwen3.7-max"))
      assert.ok(!ids.some((id) => id.startsWith("qwen/")), "预设名不应入清单（name 覆盖生效）")
      const chat = await chatJson(app.base, { key, body: { model: "bailian/qwen3.5-plus", messages: [] } })
      assert.equal(chat.status, 200)
      assert.equal(mock.requests.length, 1)
      assert.equal(mock.requests[0].body.model, "qwen3.5-plus") // 上游 model = 条目清单值（预设默认模型不吞）
    } finally {
      await app.close()
    }
  } finally {
    await mock.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ⑤ B9：同预设双条、均未给 name ⇒ 拒启（重名——既有判据自然衔接）────────────

test("B9：同预设双条、均未给 name ⇒ 拒启（重名）∥ 其一显式 name ⇒ 放行", () => {
  const dir = tmpDir("preset-b9")
  try {
    const both = writeConfig(dir, { host: "127.0.0.1", providers: [{ preset: "deepseek", apiKey: "" }, { preset: "deepseek", apiKey: "" }], embedding: EMBEDDING })
    assert.throws(() => CONFIG.loadConfig(both), (err) => {
      assert.match(err.message, /provider 名重名：deepseek/)
      assert.match(err.message, /providers\[1\]\.name/)
      return true
    })
    const named = writeConfig(dir, { host: "127.0.0.1", providers: [{ preset: "deepseek", apiKey: "" }, { preset: "deepseek", name: "deepseek-2", apiKey: "" }], embedding: EMBEDDING })
    assert.deepEqual(CONFIG.loadConfig(named).config.providers.map((p) => p.name), ["deepseek", "deepseek-2"])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ⑥ E11：未知预设名 ⇒ 拒启（列可用名）∥ 入口非零退出 ───────────────────────

test("E11：未知预设名 ⇒ 拒启（报错列可用名；排除面不在列）∥ 入口非零退出", async () => {
  const dir = tmpDir("preset-e11")
  try {
    const file = writeConfig(dir, { host: "127.0.0.1", providers: [{ preset: "deepseek-x", apiKey: "" }], embedding: EMBEDDING })
    assert.throws(() => CONFIG.loadConfig(file), (err) => {
      assert.match(err.message, /未知预设名："deepseek-x"/)
      for (const key of Object.keys(PRESETS.SERVER_PRESETS)) assert.ok(err.message.includes(key), `可用名单缺 ${key}`)
      for (const key of ["claude", "gemini", "minimax", "anthropic"]) assert.ok(!err.message.includes(key), `排除面入列：${key}`)
      return true
    })
    const child = spawnNode([BIN_PATH, "--config", file]) // 拒启 = 非零退出 + 明确报错（fail-closed 出口）
    const guard = setTimeout(() => child.child.kill(), 15000) // 兜底：回归若放行未知预设（入口不退）⇒ 强杀，断言以读数报红
    try {
      const { code } = await child.exited
      assert.equal(code, 1, `入口未以非零退出收场（code=${code}——null = 兜底强杀）`)
      assert.match(child.out(), /"event":"startup_failed"/)
      assert.match(child.out(), /未知预设名/)
    } finally {
      clearTimeout(guard)
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ⑦ 手写形回归 ∥ config.example.json 冒烟（双形并存 ∥ 零真 key）────────────

test("手写形回归 ∥ config.example.json 冒烟：预设形 ∥ 手写形并存载入 ∥ key 面全 env:/空（零真密钥）", () => {
  const dir = tmpDir("preset-hw")
  try {
    const file = writeConfig(dir, {
      host: "127.0.0.1",
      providers: [
        { name: "internal", baseURL: "http://10.0.0.9:8000/v1", apiKey: "", models: ["deepseek-v3"] },
        { preset: "glm", apiKey: "env:TC_TEST_KEY" },
      ],
      embedding: EMBEDDING,
    })
    const { config } = CONFIG.loadConfig(file, { env: ENV })
    assert.deepEqual(config.providers[0], { name: "internal", baseURL: "http://10.0.0.9:8000/v1", apiKey: "", models: ["deepseek-v3"] }) // 手写形零变
    assert.equal(config.providers[1].name, "glm")
    assert.deepEqual(config.providers[1].models, [CORE.PROVIDER_PRESETS.glm.model])

    const examplePath = join(ROOT, "thincoder-server", "config.example.json")
    const example = JSON.parse(readFileSync(examplePath, "utf8"))
    const keyFaces = []
    const walk = (node, path = "") => {
      if (node === null || typeof node !== "object") return
      for (const [key, value] of Object.entries(node)) {
        const here = path ? `${path}.${key}` : key
        if (key === "apiKey" || key === "password") keyFaces.push([here, value])
        walk(value, here)
      }
    }
    walk(example)
    assert.ok(keyFaces.length >= 4, `key 面读数不足：${keyFaces.length}`)
    for (const [where, value] of keyFaces) assert.ok(value === "" || String(value).startsWith("env:"), `${where} 疑似真密钥`)
    assert.equal(example.providers[0].preset, "deepseek") // 预设形示范在场
    assert.ok(example.providers.slice(1).every((p) => p.name), "手写形示范在场")
    const { config: exampleConfig } = CONFIG.loadConfig(examplePath, { env: { DEEPSEEK_API_KEY: "sk-ds", DASHSCOPE_API_KEY: "sk-d", TC_SERVER_ADMIN_PASSWORD: "password123" } })
    assert.equal(exampleConfig.providers.length, example.providers.length)
    assert.equal(exampleConfig.providers[0].name, "deepseek")
    assert.deepEqual(exampleConfig.providers[0].models, [CORE.PROVIDER_PRESETS.deepseek.model])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ── ⑧ 零第三方依赖扫描（全树 import 仅 node:/相对）───────────────────────────

test("依赖面：thincoder-server 全树 import 仅 node:/相对 ∥ package.json dependencies 空", () => {
  const dir = join(ROOT, "thincoder-server")
  const files = readdirSync(dir, { recursive: true }).map(String).filter((rel) => rel.endsWith(".mjs"))
  assert.ok(files.length >= 8, `服务树档数不足：${files.length}`)
  const specifiers = []
  for (const rel of files) {
    const text = readFileSync(join(dir, rel), "utf8")
    for (const match of text.matchAll(/\bfrom\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\s*["']([^"']+)["']/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
    for (const match of text.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) specifiers.push([rel, match[1]])
  }
  assert.ok(specifiers.length >= 8)
  for (const [rel, spec] of specifiers) {
    assert.ok(spec.startsWith("node:") || spec.startsWith("."), `${rel} 出现非标准库 import：${spec}`)
  }
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))
  assert.deepEqual(pkg.dependencies ?? {}, {})
})
