/**
 * acp-contract.test.mjs — ACP v1 契约形状合规机检（ACP 外部编排器兼容批 · 批档 §2.4 AC1–AC12 + AC15 面）。
 * 设计依据 = `docs/cli/design/ACP-CLIENT.md` §11（§11.2 G1 · §11.3 G2 族 · §11.4 G3 · §11.5 G8 · §11.7 不变量）。
 *
 * 驱动面（批档 §2.4「用例覆盖」）：handler 直调（`buildAcpHandlers` —— 唯一接缝契约）+ bridge 直驱
 * （fs 门控）+ 一条**脚本化 stdio 冒烟**（AC5：无 TTY、全程不发 `authenticate`）+ `--login` 非 TTY 冒烟（AC8）。
 * 机检锚（AC13 三条 grep / AC14 README 链接）= 验收命令形态（批档 §2.8）——不作测试面语句锚（测试纪律
 * 「no new prose anchors」），改由交付报告给读数。
 *
 * 沙箱：会话槽位目录恒指临时目录；需要凭据判定的用例（AC6 / AC12）另把 config 路径指到临时配置
 * （其余用例凭据门恒真 ⇒ 门在 `isConfigured()` 处早退，不读任何 config）。
 */
import { describe, test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { buildAcpHandlers } from "../src/acp.mjs"
import { buildAcpCallbacks } from "../src/acp/bridge.mjs"
import { _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, loadManifest, saveManifest, slotPath, writeSessionFile } from "@thincoder/core/session-slots.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const CLI_BIN = join(__here, "..", "bin", "thincoder.cjs")

let sessionsDir
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-acp-contract-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** handler 直调 harness：凭据门恒真（形状类 AC 与认证门解耦）；createSession 用轻量假会话。 */
function handlerHarness(over = {}) {
  const notifications = []
  const built = buildAcpHandlers({
    log: () => {},
    notify: (method, params) => notifications.push({ method, params }),
    isConfigured: () => true,
    createSession: async ({ id }) => ({ id, agent: { _slot: null, _sessionStart: null, history: [], tasks: [] }, run: async () => {}, cancel: () => {} }),
    ...over,
  })
  return { ...built, notifications }
}

/** 槽文件 + manifest 登记（真实写路径——listSlots 面）。 */
function seedSlot(cwd, slot) {
  writeSessionFile(slotPath(cwd, slot), {
    version: 2, cwd, title: "seeded", updatedAt: Date.now(),
    history: [{ role: "user", content: "seeded message" }], contextHistory: [],
    tasks: [], planMode: false, autoApprove: false, goal: null,
    pendingReminders: [], sessionStart: "seed-session",
  })
  const m = loadManifest(cwd)
  m.slots[slot] = { updatedAt: Date.now(), messageCount: 1, turnCount: 1, firstMessage: "seeded" }
  saveManifest(cwd, m)
}

// ─── §11.3 / §11.7-1 — `initialize` 契约形状（AC1 / AC2）────────────────────────────

describe("§11.3 initialize 响应形状（AC1 / AC2）", () => {
  test("AC1 能力面如实声明：loadSession + 四键 sessionCapabilities（各 {}）；零 `capabilities` 键", () => {
    const { handlers } = handlerHarness()
    const r = handlers.initialize({ protocolVersion: 1, clientCapabilities: { auth: { terminal: true } } })
    assert.equal(r.agentCapabilities.loadSession, true)
    assert.deepEqual(Object.keys(r.agentCapabilities.sessionCapabilities).sort(), ["close", "delete", "list", "resume"])
    for (const k of ["list", "resume", "delete", "close"]) {
      assert.deepEqual(r.agentCapabilities.sessionCapabilities[k], {}, `sessionCapabilities.${k} = {}（支持）`)
    }
    // 不虚报（§11.3 改法③）：promptCapabilities 全 false；mcpCapabilities / additionalDirectories 省略
    assert.deepEqual(r.agentCapabilities.promptCapabilities, { image: false, audio: false, embeddedContext: false })
    assert.equal(r.agentCapabilities.mcpCapabilities, undefined)
    assert.equal(r.agentCapabilities.sessionCapabilities.additionalDirectories, undefined)
    // 不变量 1（§11.7）：响应只含契约字段——旧的 `capabilities` 键退场
    assert.equal(r.capabilities, undefined)
    assert.deepEqual(Object.keys(r).sort(), ["agentCapabilities", "agentInfo", "authMethods", "protocolVersion"])
    assert.equal(r.agentInfo.name, "thincoder")
    assert.equal(typeof r.agentInfo.version, "string")
  })

  test("AC2 版本协商：支持则回同版本、不支持回最新支持（当前支持集 = {1}）", () => {
    const { handlers } = handlerHarness()
    assert.equal(handlers.initialize({ protocolVersion: 1 }).protocolVersion, 1)
    assert.equal(handlers.initialize({ protocolVersion: 5 }).protocolVersion, 1, "客户端 ≥1 且不在支持集 ⇒ 回最新支持")
    assert.equal(handlers.initialize({}).protocolVersion, 1, "缺省请求版本 ⇒ 回最新支持")
  })
})

// ─── §11.2 — `authMethods` 门控与 `authenticate` 语义（AC3 / AC4 / AC7）────────────

describe("§11.2 登录可被外部驱动（AC3 / AC4 / AC7）", () => {
  test("AC3 auth.terminal === true ⇒ 对象数组（id/name/type/args 齐备，args 含 --login）", () => {
    const { handlers } = handlerHarness()
    const r = handlers.initialize({ protocolVersion: 1, clientCapabilities: { auth: { terminal: true } } })
    assert.equal(r.authMethods.length, 1)
    const m = r.authMethods[0]
    assert.equal(typeof m.id, "string")
    assert.equal(typeof m.name, "string")
    assert.equal(m.type, "terminal")
    assert.ok(Array.isArray(m.args) && m.args.includes("--login"), "args 含 --login（追加到已配置调用 ⇒ 客户端拉起 thincoder acp --login）")
  })

  test("AC4 auth.terminal 为 false 或 clientCapabilities 整个省略 ⇒ authMethods === []", () => {
    const { handlers } = handlerHarness()
    const off = handlers.initialize({ protocolVersion: 1, clientCapabilities: { auth: { terminal: false } } })
    assert.deepEqual(off.authMethods, [])
    const omitted = handlers.initialize({ protocolVersion: 1 })
    assert.deepEqual(omitted.authMethods, [], "缺省语义 = UNSUPPORTED（不得乐观默认 true）")
  })

  test("AC7 `authenticate {methodId:\"nope\"}` ⇒ -32602（未宣告方法）", () => {
    const { handlers } = handlerHarness()
    const r = handlers.authenticate({ methodId: "nope" })
    assert.equal(r.error.code, -32602)
  })
})

// ─── §11.2 — 认证门 = 凭据即时判据（AC6 + D15 零交互面）───────────────────────────

describe("§11.2 凭据即时判据（AC6 + 零交互面）", () => {
  test("AC6 isConfigured() 注入 false ⇒ session/new 返回 -32000（authRequired · ① 无 key 分支文案）", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tc-acp-contract-nokey-"))
    const cfgPath = join(dir, "config.json")
    writeFileSync(cfgPath, JSON.stringify({ providers: [] })) // 空配置 ⇒ 默认 providerStatus 走 ① 分支（沙箱内，无 key）
    _setConfigPathForTest(cfgPath)
    try {
      const { handlers } = handlerHarness({ isConfigured: () => false })
      const r = await handlers["session/new"]({ cwd: process.cwd(), mcpServers: [] })
      assert.equal(r.error.code, -32000)
      assert.match(r.error.message, /providers\[\]\.apiKey/, "① 分支指向 providers[].apiKey")
      assert.match(r.error.message, /thincoder acp --login/, "① 分支给出登录恢复路径")
    } finally {
      _resetConfigPathForTest()
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("零交互面：从不调 authenticate ⇒ 凭据就位时 session/new 照常建会话（无跨调用闩锁）", async () => {
    const { handlers } = handlerHarness()
    const r = await handlers["session/new"]({ cwd: process.cwd(), mcpServers: [] })
    assert.ok(!r.error, `不调 authenticate 也应建会话：${r?.error?.message ?? ""}`)
    assert.equal(typeof r.sessionId, "string")
  })
})

// ─── §11.3 G2 族 — 会话方法响应形状（AC10 / AC11）─────────────────────────────────

describe("§11.3 会话方法响应形状（AC10 / AC11）", () => {
  test("AC10 session/list 条目含 sessionId(string) + cwd，不含 id 键", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "tc-acp-contract-cwd-"))
    try {
      seedSlot(cwd, 1)
      const { handlers } = handlerHarness({ cwd: () => cwd })
      const r = await handlers["session/list"]({})
      assert.equal(r.sessions.length, 1)
      const item = r.sessions[0]
      assert.equal(item.sessionId, "1")
      assert.equal(typeof item.sessionId, "string")
      assert.equal(item.cwd, cwd)
      assert.equal(item.id, undefined, "旧 `id` 键退场（SessionInfo.required = [sessionId,cwd]）")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  test("AC11 session/new 返回 { sessionId, configOptions[{id,name}] }——不含旧 id / configId 键", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "tc-acp-contract-cwd-"))
    try {
      const { handlers } = handlerHarness({ cwd: () => cwd })
      const r = await handlers["session/new"]({ cwd, mcpServers: [] })
      assert.equal(typeof r.sessionId, "string", "NewSessionResponse.required = [sessionId]")
      assert.equal(r.id, undefined, "旧 `id` 键退场")
      assert.equal(r.configOptions.length, 3)
      for (const o of r.configOptions) {
        assert.equal(typeof o.id, "string")
        assert.equal(typeof o.name, "string")
        assert.equal(o.configId, undefined, "响应侧用 id（请求侧用 configId——不对称属契约本身）")
      }
      assert.deepEqual(r.configOptions.map((o) => o.id), ["model", "thinking", "mode"])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

// ─── §11.5 — 判据拆分：② 分支点名 defaultModel（AC12）────────────────────────────

describe("§11.5 凭据面判据拆分（AC12）", () => {
  test("AC12 providers[].apiKey 在位而 defaultModel 未设 ⇒ -32000 且文案含 defaultModel", async () => {
    const dir = mkdtempSync(join(tmpdir(), "tc-acp-contract-cfg-"))
    const cfgPath = join(dir, "config.json")
    writeFileSync(cfgPath, JSON.stringify({ providers: [{ name: "probe", baseURL: "http://127.0.0.1:9/v1", model: "m", apiKey: "k" }] }))
    _setConfigPathForTest(cfgPath)
    try {
      const { handlers } = buildAcpHandlers({ log: () => {} }) // isConfigured / providerStatus 走默认实现（真实配置链）
      const r = await handlers["session/new"]({ cwd: process.cwd(), mcpServers: [] })
      assert.equal(r.error.code, -32000, "命名 handler = session/new；错误码 = -32000")
      assert.match(r.error.message, /defaultModel/, "文案源 = config.providerInvalidReason（非新造）")
    } finally {
      _resetConfigPathForTest()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// ─── §11.4 — fs 反向 RPC 客户端能力门控（AC9）────────────────────────────────────

describe("§11.4 fs 反向 RPC 门控（AC9）", () => {
  /** 捕获式 bridge：request 记录全部反向 RPC（fs/*）。 */
  function bridgeHarness(clientCaps) {
    const requests = []
    const cb = buildAcpCallbacks({
      sessionId: "s1",
      notify: () => {},
      request: async (method, params) => {
        requests.push({ method, params })
        return method === "fs/read_text_file" ? { text: "hello world\n" } : {}
      },
      log: () => {},
      clientCaps,
    })
    return { cb, requests }
  }

  test("AC9 省略 clientCapabilities.fs ⇒ write 不路由（handled:false，零 fs/* 请求）", async () => {
    const h = bridgeHarness({})
    const r = await h.cb.toolRouter("write", { path: "a.txt", content: "x" })
    assert.deepEqual(r, { handled: false })
    assert.equal(h.requests.length, 0, "未宣告能力位 ⇒ 一个反向 RPC 都不发（不干等 30s 超时）")
  })

  test("AC9 fs.writeTextFile === true ⇒ write 路由（handled:true + 1 次 fs/write_text_file）", async () => {
    const h = bridgeHarness({ fs: { writeTextFile: true } })
    const r = await h.cb.toolRouter("write", { path: "a.txt", content: "x" })
    assert.equal(r.handled, true)
    assert.equal(h.requests.length, 1)
    assert.equal(h.requests[0].method, "fs/write_text_file")
    assert.deepEqual(h.requests[0].params, { sessionId: "s1", path: "a.txt", content: "x" })
  })

  test("AC9 edit 对 readTextFile 同判：未宣告 ⇒ handled:false 且零请求；两位皆真 ⇒ 读回 + 写回", async () => {
    const off = bridgeHarness({ fs: { writeTextFile: true } }) // readTextFile 缺席 ⇒ 读回前提不成立
    const rOff = await off.cb.toolRouter("edit", { path: "a.txt", old_string: "hello", new_string: "goodbye" })
    assert.deepEqual(rOff, { handled: false })
    assert.equal(off.requests.length, 0)

    const off2 = bridgeHarness({ fs: { readTextFile: true } }) // writeTextFile 缺席 ⇒ 写回位不成立（不变量 2：写前必过位）
    const rOff2 = await off2.cb.toolRouter("edit", { path: "a.txt", old_string: "hello", new_string: "goodbye" })
    assert.deepEqual(rOff2, { handled: false })
    assert.equal(off2.requests.length, 0)

    const on = bridgeHarness({ fs: { readTextFile: true, writeTextFile: true } })
    const rOn = await on.cb.toolRouter("edit", { path: "a.txt", old_string: "hello", new_string: "goodbye" })
    assert.equal(rOn.handled, true)
    assert.match(rOn.result, /OK: edited a\.txt via IDE/)
    assert.deepEqual(on.requests.map((q) => q.method), ["fs/read_text_file", "fs/write_text_file"])
  })
})

// ─── §11.7-6 — 无 TTY 可驱动（AC5 / AC8 · 脚本化 stdio 冒烟）─────────────────────

/** 伪 HOME（真 config.json）+ 独立 cwd；两者随 t 清理。 */
function mkEnv(t, configText) {
  const home = mkdtempSync(join(tmpdir(), "tc-acp-contract-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-acp-contract-work-"))
  t.after(() => {
    try { rmSync(home, { recursive: true, force: true }) } catch { /* ignore */ }
    try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
  })
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), configText)
  return { home, cwd }
}

/** 起真 CLI 子进程（异步 spawn——父进程要活着应答 mock）；超时 → kill + timedOut。 */
function runCli(args, { home, cwd, timeoutMs = 60_000, script }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_BIN, ...args], {
      cwd, env: { ...process.env, HOME: home, USERPROFILE: home },
    })
    let stdout = ""
    let stderr = ""
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; child.kill() }, timeoutMs)
    child.stdout.on("data", (d) => { stdout += d })
    child.stderr.on("data", (d) => { stderr += d })
    // 行缓冲 JSON-RPC 客户端：按响应 id 配对（session/update 通知无 id ⇒ 自然跳过）
    const pending = new Map()
    let buf = ""
    child.stdout.on("data", (d) => {
      buf += d
      for (let i = buf.indexOf("\n"); i >= 0; i = buf.indexOf("\n")) {
        const line = buf.slice(0, i)
        buf = buf.slice(i + 1)
        let msg
        try { msg = JSON.parse(line) } catch { continue }
        if (msg?.id !== undefined && pending.has(String(msg.id))) {
          const done = pending.get(String(msg.id))
          pending.delete(String(msg.id))
          done(msg)
        }
      }
    })
    const request = (id, method, params) =>
      new Promise((res) => {
        pending.set(String(id), res)
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
      })
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }) })
    // 脚本完成 ⇒ 收线（ACP 服务端设计上挂到管道关闭——脚本完成必须主动终止，否则等满超时）
    if (script) {
      script({ request })
        .then(() => { try { child.stdin.end() } catch { /* ignore */ } ; child.kill() })
        .catch((e) => { stderr += `\n[script error] ${e?.stack ?? e}`; child.kill() })
    }
  })
}

describe("§11.7-6 无 TTY 可驱动（AC5 / AC8）", () => {
  test("AC5 脚本化 stdio 客户端（不发 authenticate、无 TTY）：initialize → session/new → session/prompt = end_turn", { timeout: 120_000 }, async (t) => {
    const mock = await mockLLM([{ content: "hello from acp mock" }])
    t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
    const { home, cwd } = mkEnv(t, JSON.stringify({
      defaultModel: "mock:mock-model",
      providers: [{ name: "mock", baseURL: `http://127.0.0.1:${mock.port}/v1`, model: "mock-model", apiKey: "test-key" }],
    }))

    let seen = null
    const r = await runCli(["acp"], {
      home, cwd, timeoutMs: 90_000,
      script: async ({ request }) => {
        // 全程**不发** `authenticate`（AC5 主判据 = 无需认证调用即可驱动）
        const init = await request(1, "initialize", { protocolVersion: 1, clientCapabilities: { auth: { terminal: true } } })
        const news = await request(2, "session/new", { cwd, mcpServers: [] })
        const sid = news.result?.sessionId
        assert.equal(init.result?.protocolVersion, 1)
        assert.equal(typeof sid, "string", `session/new 必含 sessionId（N1）：${JSON.stringify(news)}`)
        const prompt = await request(3, "session/prompt", { sessionId: sid, prompt: [{ type: "text", text: "hello" }] })
        seen = { news, prompt }
        assert.equal(prompt.result?.stopReason, "end_turn", `prompt 契约入参 params.prompt（N2）：${JSON.stringify(prompt)}`)
      },
    })
    assert.equal(r.timedOut, false, "限时内完成（不挂死）")
    assert.ok(seen, `三次往返完成（stderr: ${r.stderr.slice(-2000)}）`)
    assert.ok(mock.requests.length >= 1, "prompt 真抵达 provider（mock 端点收到请求）")
  })

  test("AC8 非 TTY 下 `thincoder acp --login` 不挂死：限时退出、退出码非 0、stderr 可行动文案", { timeout: 60_000 }, async (t) => {
    const { home, cwd } = mkEnv(t, JSON.stringify({}))
    const r = await runCli(["acp", "--login"], { home, cwd, timeoutMs: 30_000 })
    assert.equal(r.timedOut, false, "非 TTY 下快速退出（不静默挂死等 initialize）")
    assert.notEqual(r.code, 0, "非零退出 = 失败信号（AuthMethodTerminal 退出状态语义）")
    assert.match(r.stderr, /interactive terminal/, "stderr 含可行动文案（指向交互终端）")
    assert.match(r.stderr, /--login|config\.json/, "文案给出恢复路径")
  })
})
