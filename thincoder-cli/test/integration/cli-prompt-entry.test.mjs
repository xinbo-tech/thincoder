/**
 * cli-prompt-entry.test.mjs — 集成场景：CLI 入口面提示词注入覆盖（U2——CORE-UNIFICATION
 * §2.6.3 专项补⑦ · §2.13.7⑤）。
 *
 * 业务语义：用户起真实 CLI（`chat` 一次真实装配）——送往 provider 的系统提示与工具描述
 * 必须「所测得即所发」：零 `{{inject:` 字面（入口已配置的正证），且 §2.13.2「CLI 列」取值
 * 在场（normal 场景可达面 + 工具描述面）。
 * 驱动 = 伪 HOME（真 config.json）+ 真 CLI 子进程 + 本地 mock 端点
 * （§12 harness 就绪前的等价进程级用例——TESTING.md §5.7 同法）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { mockLLM } from "../helpers/mock-llm.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const BIN = join(__here, "..", "..", "bin", "thincoder.cjs")

/** 伪 HOME（含 .thincoder/config.json）+ 独立工作目录；两者随 t 清理。
 *  `repo: false` → 非仓 cwd 变体（不建 .git——#30 回归面：普通会话零门禁）。 */
function mkEnv(t, configText, { repo = true } = {}) {
  const home = mkdtempSync(join(tmpdir(), "tc-int-pinj-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-pinj-cwd-"))
  if (repo) mkdirSync(join(cwd, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
  t.after(() => {
    try { rmSync(home, { recursive: true, force: true }) } catch { /* ignore */ }
    try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
  })
  mkdirSync(join(home, ".thincoder"), { recursive: true })
  writeFileSync(join(home, ".thincoder", "config.json"), configText)
  return { home, cwd }
}

/** 真 CLI 子进程（异步 spawn——父进程要活着应答 mock）。 */
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
  providers: [{ name: "mock", baseURL: `http://127.0.0.1:${port}/v1`, model: "mock-model", apiKey: "test-key" }],
  ...over,
})

test("入口面：真 CLI 装配 ⇒ 系统提示 + 工具描述零锚字面 + 本端取值在场", async (t) => {
  const mock = await mockLLM([{ content: "hello from mock" }])
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const { home, cwd } = mkEnv(t, providerConfig(mock.port))

  const r = await runCli(["chat", "hello"], { home, cwd })
  assert.equal(r.code, 0, `chat 正常退出（stderr: ${r.stderr}）`)
  assert.ok(mock.requests.length >= 1, "请求抵达 mock 端点")

  const req = mock.requests[0]
  const system = String((req.messages ?? []).find((m) => m.role === "system")?.content ?? "")
  assert.ok(system.length > 500, "系统提示非空（真实装配面）")
  assert.ok(!system.includes("{{inject:"), "系统提示零锚字面（入口已配置 = 所测得即所发）")

  // §2.13.2「CLI 列」取值在场（normal 场景可达面：空串项 ⇒ 该处零字面，由上一断言覆盖）
  assert.ok(system.includes("docs/README.md"), "doc-map-path = 空串 ⇒ docs/README.md")
  assert.ok(system.includes("Top-level subagent spawns default to async"), "async spawn 语义正文在场")
  assert.ok(system.includes("Top-level escalate defaults to async"), "escalate 异步语义正文在场")
  assert.ok(system.includes("Ctrl+I interrupt does not"), "discipline-normal-consult-stop 取值在场")

  // 工具描述面（同一送往 provider 的请求体）
  const tools = req.tools ?? []
  assert.ok(tools.length >= 10, `工具面在位（${tools.length}）`)
  for (const t2 of tools) assert.ok(!String(t2.function?.description ?? "").includes("{{inject:"), `工具 ${t2.function?.name}: 描述零锚字面`)
  const descOf = (name) => String(tools.find((t2) => t2.function?.name === name)?.function?.description ?? "")
  assert.ok(descOf("bash").length > 0 && !descOf("bash").includes('terminal: "visible"'), "bash：CLI 面无终极端行")
  assert.ok(descOf("question").includes("- Availability: this tool needs an interactive UI"), "question：CLI 口径 Availability 行在场")
})

test("入口面（engineering 态）：engineering 场景 ⇒ 零锚字面 + engineering 面取值在场", async (t) => {
  const mock = await mockLLM([{ content: "ok" }])
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const { home, cwd } = mkEnv(t, providerConfig(mock.port, { agent: { engineering: true } }))

  const r = await runCli(["chat", "hello"], { home, cwd })
  assert.equal(r.code, 0, `chat 正常退出（stderr: ${r.stderr}）`)
  assert.ok(mock.requests.length >= 1, "请求抵达 mock 端点")
  const system = String((mock.requests[0].messages ?? []).find((m) => m.role === "system")?.content ?? "")
  assert.ok(!system.includes("{{inject:"), "engineering 态系统提示零锚字面")
  assert.ok(system.includes("advisor calls are async by default at the top level"), "advisor 异步语义正文在场")
  assert.ok(!system.includes("## 改动面反查（文档影响面）"), "改动面反查节已删（消端差）")
  assert.ok(system.includes("in-child advisor code review"), "交付链正文自足")
})

// ── #30 回归（AC-14 / T31）：normal + 非仓 cwd 启动——装配门禁不拦普通会话 ──────────────

test("入口面（normal + 非仓 cwd）：启动零门禁——退出码 0、无『工程模式启动拒绝』、不建档", async (t) => {
  const mock = await mockLLM([{ content: "hello from mock" }])
  t.after(() => { try { mock.server.close() } catch { /* ignore */ } })
  const { home, cwd } = mkEnv(t, providerConfig(mock.port), { repo: false })

  const r = await runCli(["chat", "hello"], { home, cwd })
  assert.equal(r.code, 0, `chat 正常退出（stderr: ${r.stderr}）`)
  assert.ok(!r.stderr.includes("工程模式启动拒绝"), "stderr 无「工程模式启动拒绝」（普通会话零 manifest I/O）")
  assert.ok(mock.requests.length >= 1, "请求抵达 mock 端点（进入了正常循环）")
  assert.equal(existsSync(join(cwd, "PROJECT-MANIFEST.json")), false, "普通会话不自动建档")
})
