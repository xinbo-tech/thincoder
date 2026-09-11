/**
 * config-provider-routing.test.mjs — 集成场景 ⑦（TESTING.md §5.7——配置装载与 provider 选路）。
 *
 * 业务语义：用户带着自己的 config.json 启动 CLI——请求必须打到"配置里选中的那个
 * provider"（地址与模型都对上，不拿错 key）；指向不存在的渠道要明确报错而不是顺手
 * 落到第一个；配置坏了要给人话，不要崩。
 * 驱动 = 伪 HOME（真 config.json）+ 真 CLI 子进程（`chat` 模式）+ 本地 mock 端点。
 * 注意：子进程必须**异步** spawn——父进程要活着应答 mock 请求。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { mockLLM } from "../helpers/mock-llm.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const BIN = join(__here, "..", "..", "bin", "thincoder.cjs")

/** 伪 HOME（含 .thincoder/config.json）+ 独立工作目录；两者随 t 清理。 */
function mkEnv(t, configText) {
  const home = mkdtempSync(join(tmpdir(), "tc-int-cfg-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-cfg-cwd-"))
  t.after(() => {
    try { rmSync(home, { recursive: true, force: true }) } catch { /* ignore */ }
    try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
  })
  if (configText !== null) {
    mkdirSync(join(home, ".thincoder"), { recursive: true })
    writeFileSync(join(home, ".thincoder", "config.json"), configText)
  }
  return { home, cwd }
}

/** 真 CLI 子进程（异步 spawn——测试进程要能继续应答 mock）。 */
function runCli(args, { home, cwd, timeoutMs = 60_000 }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      cwd, env: { ...process.env, HOME: home, USERPROFILE: home },
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d))
    child.stderr.on("data", (d) => (stderr += d))
    const timer = setTimeout(() => child.kill(), timeoutMs)
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }) })
  })
}

const providerConfig = (port, over = {}) => JSON.stringify({
  defaultModel: "mock:mock-model",
  providers: [{ name: "mock", baseURL: `http://127.0.0.1:${port}/v1`, model: "mock-model", apiKey: "test-key", ...over }],
})

test("⑦ 正常：按配置选路 —— 请求打到选中 provider 的地址与模型", async (t) => {
  const mock = await mockLLM([{ content: "Hello from the mock provider." }])
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const { home, cwd } = mkEnv(t, providerConfig(mock.port))

  const r = await runCli(["chat", "hello"], { home, cwd })
  assert.equal(r.code, 0, `chat 正常退出（stderr: ${r.stderr}）`)
  assert.match(r.stdout, /Hello from the mock provider\./, "模型回复透传 stdout")
  assert.ok(mock.requests.length >= 1, "请求抵达配置里选中的本地端点（不是别处）")
  assert.equal(mock.requests[0].model, "mock-model", "模型按配置解析（model 匹配）")
  assert.match(String(mock.requests[0]._url), /\/v1\/chat\/completions/, "baseURL 后缀与路径按配置拼装")
})

test("⑦ 边界：defaultModel 指向不存在的渠道 —— 明确报错、不静默落到第一个", async (t) => {
  const mock = await mockLLM([{ content: "should never be reached" }])
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const { home, cwd } = mkEnv(t, JSON.stringify({
    defaultModel: "ghost:some-model",
    providers: [{ name: "mock", baseURL: `http://127.0.0.1:${mock.port}/v1`, model: "mock-model", apiKey: "test-key" }],
  }))

  const r = await runCli(["chat", "hello"], { home, cwd })
  assert.notEqual(r.code, 0, "无效选路 → 非零退出")
  assert.match(r.stderr, /unknown provider "ghost"/, "报错点名不存在的渠道")
  assert.equal(mock.requests.length, 0, "没有静默落到第一个 provider（防拿错 key）")
})

test("⑦ 错误：坏配置 —— 可读文案软失败，不崩栈", async (t) => {
  // ① JSON 损坏
  const broken = mkEnv(t, "{ this is not valid json")
  const r1 = await runCli(["chat", "hello"], broken)
  assert.notEqual(r1.code, 0, "坏 JSON → 非零退出")
  assert.match(r1.stderr, /not valid JSON/, "文案说明配置损坏（可读引导）")
  assert.doesNotMatch(r1.stderr, /\n\s+at .*\(/, "不向用户抛原始堆栈（软失败）")

  // ② 空 providers
  const empty = mkEnv(t, JSON.stringify({ providers: [] }))
  const r2 = await runCli(["chat", "hello"], empty)
  assert.notEqual(r2.code, 0, "空 providers → 非零退出")
  assert.match(r2.stderr, /未配置有效模型|未配置任何 provider/, "文案给出配置引导")
  assert.doesNotMatch(r2.stderr, /\n\s+at .*\(/, "不向用户抛原始堆栈（软失败）")
})
