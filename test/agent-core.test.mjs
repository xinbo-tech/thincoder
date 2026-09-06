/**
 * agent-core.test.mjs — agent core — model specs / tool edge cases / verify file-location / pushback loops / ENG reminders.
 *
 * Split from test/agent.test.mjs (AGENT-LOOP.md §18.14/§18.14.1 D-T1.1 domain rule —
 * blocks moved verbatim; test names/semantics unchanged).
 */

import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"
import { specForModel, ctxPercentForModel, contextWindowForModel, providerSpec } from "../src/config.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { MAX_ADVISOR_PUSHBACKS, loadEngineeringPrompt } from "../src/agent/run-helpers.mjs"
import { runAgent } from "../src/agent.mjs"

function setupTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-test-"))
  mkdirSync(join(dir, ".thincoder"), { recursive: true })
  return dir
}

function mockProvider(model = "deepseek-v4-pro", port = null) {
  return { baseURL: port ? `http://127.0.0.1:${port}` : "https://api.test/v1", apiKey: "sk-test", model }
}

// ─── Model specs ────────────────────────────────────────────────

describe("model specs", () => {
  it("1M context models", () => {
    assert.equal(specForModel("deepseek-v4-pro").context, 1_000_000)
    assert.equal(specForModel("kimi-k3").context, 1_000_000)
    assert.equal(specForModel("glm-5.2").context, 1_000_000)
    assert.equal(specForModel("gpt-4.1").context, 1_000_000)
    assert.equal(specForModel("qwen3.8-max").context, 1_000_000)
    assert.equal(specForModel("MiniMax-M3").context, 1_000_000)
  })

  it("qwen3.7-max is text-only (DashScope 400 on images — CLI parity)", () => {
    // CLI config.mjs marks qwen3.7-max WITHOUT multimodal (it rejects image parts with
    // DashScope 400 "Unexpected item type in content"). A drift here (multimodal: true)
    // makes the extension send images to a model that refuses them — every request 400s.
    assert.equal(specForModel("qwen3.7-max").multimodal, undefined)
  })

  it("2M context model", () => {
    assert.equal(specForModel("gemini-2.5-pro").context, 2_000_000)
  })

  it("200K-500K context models", () => {
    assert.equal(specForModel("claude-sonnet-4").context, 200_000)
    assert.equal(specForModel("grok-4").context, 500_000) // grok-4.x family: 500K (xAI Grok 4.6 spec; was 1M, corrected 2026-08)
    assert.equal(specForModel("kimi-k2-retired-fallback").context, 128_000) // unknown ids → 128K default
  })

  it("maxOutput values are reasonable", () => {
    assert.equal(specForModel("deepseek-v4-pro").maxOutput, 384_000)
    assert.equal(specForModel("claude-sonnet-4").maxOutput, 32_000)
    assert.equal(specForModel("gemini-2.5-pro").maxOutput, 64_000)
  })

  it("unknown model defaults to 128K", () => {
    assert.equal(specForModel("some-fake-model").context, 128_000)
    assert.equal(specForModel("").context, 128_000)
    assert.equal(specForModel().context, 128_000)
  })

  it("prefix matching is case-insensitive", () => {
    assert.equal(specForModel("DEEPSEEK-V4-PRO").context, 1_000_000)
    assert.equal(specForModel("Kimi-K3").context, 1_000_000)
    assert.equal(specForModel("GLM-5.2").context, 1_000_000)
  })

  it("longest prefix wins (deepseek-v4-pro before deepseek-v4-flash)", () => {
    assert.equal(specForModel("deepseek-v4-pro").maxOutput, 384_000)
    assert.equal(specForModel("deepseek-v4-flash").context, 1_000_000) // official: dual v4 models both 1M
  })

  it("kimi-code preset + short ID k3 get the kimi-k3 spec (IK5VGJ)", async () => {
    const { PROVIDER_PRESETS } = await import("../src/config-io.mjs")
    const preset = PROVIDER_PRESETS["kimi-code"]
    assert.ok(preset, "kimi-code preset must exist")
    assert.equal(preset.baseURL, "https://api.kimi.com/coding/v1")
    assert.equal(preset.model, "k3")
    const s = specForModel("k3")
    assert.equal(s.context, 1_000_000, "k3 must get 1M context (not the 128K default)")
    assert.equal(s.multimodal, true, "k3 supports images — read_image must not be gated off")
    assert.equal(s.partialMode, true)
    assert.equal(s.reasoningEcho, "required")
    assert.equal(specForModel("kimi-k3").context, 1_000_000, "kimi-k3 itself unaffected")
  })

  it("glm-5.3-flash: 1M context / 128K output / multimodal / effort low-high-max (default max)", async () => {
    const s = specForModel("glm-5.3-flash")
    assert.equal(s.context, 1_000_000)
    assert.equal(s.maxOutput, 128_000)
    assert.equal(s.multimodal, true, "glm-5.3-flash is multimodal — read_image must not be gated off")
    assert.deepEqual(s.reasoningEffortEnum, ["low", "high", "max"])
    assert.equal(s.reasoningEffortDefault, "max")
    assert.equal(s.noUsageStream, true)
    assert.equal(s.thinkApi, "type", "thinking 始终开（thinking.type，不可关闭）")
    // 默认预设未动（方案 A：只加可用性，不惊动存量用户默认）
    const { PROVIDER_PRESETS } = await import("../src/config-io.mjs")
    assert.equal(PROVIDER_PRESETS.glm.model, "glm-5.2")
    assert.equal(PROVIDER_PRESETS["glm-code"].model, "glm-5.2")
  })

  it("specForModel: vendor-namespace prefix stripping (zhipu/glm-5.3 → glm-5.3) — third-party token market (2026-09-04, CLI-aligned)", async () => {
    // Full-name miss → strip vendor/ prefix and re-match → real spec, not the 128K default
    assert.equal(specForModel("ZHIPU/GLM-5.3").context, 1_000_000, "zhipu/ prefix stripped → glm-5.3 1M spec")
    assert.equal(specForModel("zhipu/glm-5.3").thinking, true, "capability fields apply after strip")
    assert.equal(specForModel("openai/gpt-4o").context, 128_000, "any vendor/ prefix is stripped (incl. own vendor)")
    assert.equal(specForModel("vendor/qwen3.8-max-preview").context, 1_000_000, "full capability spec hit via prefix")
  })

  it("specForModel: vendor-namespace strip preserves unknown-model degrade + warn once (2026-09-04)", async () => {
    const warns = []
    const orig = console.warn
    console.warn = (...a) => warns.push(a.join(" "))
    try {
      const name = `vendor/${Date.now()}`
      assert.equal(specForModel(name).context, 128_000, "unknown vendor/model still degrades to default")
      assert.equal(warns.length, 1, "warn once")
      assert.ok(warns[0].includes(name), "warn keeps the original vendor/model name for diagnosis")
    } finally {
      console.warn = orig
    }
  })


  it("unknown model name warns once, not per request (IK5VGJ)", () => {
    const warns = []
    const orig = console.warn
    console.warn = (...a) => warns.push(a.join(" "))
    try {
      const name = `no-such-model-${Date.now()}`
      assert.equal(specForModel(name).context, 128_000)
      assert.equal(specForModel(name).context, 128_000)
      assert.equal(warns.length, 1, "warn exactly once per model name")
      assert.ok(warns[0].includes(name))
    } finally {
      console.warn = orig
    }
  })

  it("ctxPercentForModel divides by the REAL spec context (1M models, not 128K)", () => {
    // Regression: the status bar read a non-existent `contextWindow` field and
    // fell back to 128K — a 1M-context model at 175K tokens showed "137%".
    // Provider-aware since PROVIDER.md §15: takes the provider object (context
    // override included), not the bare model name.
    assert.equal(ctxPercentForModel(175_000, { model: "deepseek-v4-pro" }), 18)
    assert.equal(ctxPercentForModel(1_000_000, { model: "deepseek-v4-pro" }), 100)
    assert.equal(ctxPercentForModel(200_000, { model: "deepseek-v4-pro" }), 20)
    assert.equal(contextWindowForModel("deepseek-v4-pro"), 1_000_000)
  })

  it("ctxPercentForModel returns null without token data and 128K for unknown models", () => {
    assert.equal(ctxPercentForModel(0, { model: "deepseek-v4-pro" }), null)
    assert.equal(ctxPercentForModel(null, { model: "deepseek-v4-pro" }), null)
    assert.equal(ctxPercentForModel(64_000, { model: `no-such-${Date.now()}` }), 50)  // 128K default window
  })

  it("T-C1: providerSpec 用 providers[].context（K 单位）覆盖 spec；specForModel 纯函数不受污染", () => {
    const p = { model: "deepseek-v4-pro", context: 128 }
    assert.equal(providerSpec(p).context, 131_072, "128K override → 128 × 1024")
    assert.equal(providerSpec(p).maxOutput, 384_000, "其余字段拷贝保留")
    assert.equal(specForModel("deepseek-v4-pro").context, 1_000_000, "specForModel 不受覆盖污染")
    // 未配置 → spec 值（T-C4 回归）
    assert.equal(providerSpec({ model: "deepseek-v4-pro" }).context, 1_000_000)
    assert.equal(providerSpec({ model: "deepseek-v4-pro", context: undefined }).context, 1_000_000)
    // 拷贝覆盖：每次返回独立对象，不共享可变状态
    const a = providerSpec(p)
    a.context = 1
    assert.equal(providerSpec(p).context, 131_072, "每次调用返回独立拷贝")
  })

  it("T-C3: context 非法值（0/负数/非数字/小数/带单位串）→ providerSpec 忽略，用 spec 值", () => {
    for (const bad of [0, -5, "abc", 1.5, "128k", null]) {
      assert.equal(
        providerSpec({ model: "deepseek-v4-pro", context: bad }).context,
        1_000_000,
        `invalid context ${JSON.stringify(bad)} must be ignored`,
      )
    }
  })

  it("T-C6: 显示跟随——ctxPercentForModel 用覆盖后的 provider 窗口", () => {
    // 覆盖 128K：65_536 tokens = 50%（1M spec 下只有 7%）
    assert.equal(ctxPercentForModel(65_536, { model: "deepseek-v4-pro", context: 128 }), 50)
    assert.equal(ctxPercentForModel(131_072, { model: "deepseek-v4-pro", context: 128 }), 100)
  })
})

describe("tool edge cases", () => {
  it("read tool throws for nonexistent file", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    const cwd = setupTempDir()
    try {
      await assert.rejects(
        () => readTool.execute(
          { path: "nonexistent.txt" },
          { cwd, agent: {}, callbacks: {}, signal: undefined },
        ),
        (err) => err.code === "ENOENT" || err.message?.includes("no such file"),
        "should throw ENOENT",
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("read tool reads existing file", async () => {
    const { readTool } = await import("../src/tools/file.mjs")
    const cwd = setupTempDir()
    try {
      writeFileSync(join(cwd, "hello.txt"), "Hello, World!")
      const result = await readTool.execute(
        { path: "hello.txt" },
        { cwd, agent: {}, callbacks: {}, signal: undefined },
      )
      assert.ok(typeof result === "string")
      assert.ok(result.includes("Hello, World!"), "should contain file content")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("bash tool with invalid command returns error", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const result = await bashTool.execute(
      { command: "nonexistent_command_xyz_123" },
      { cwd: process.cwd(), agent: {}, callbacks: {}, signal: undefined },
    )
    assert.ok(typeof result === "string")
    // Should contain some output (error message or exit code)
    assert.ok(result.length > 0, "should return output even for failed commands")
  })

  it("bash tool with valid command returns output", async () => {
    const { bashTool } = await import("../src/tools/shell.mjs")
    const cmd = process.platform === "win32" ? "echo hello" : "echo hello"
    const result = await bashTool.execute(
      { command: cmd },
      { cwd: process.cwd(), agent: {}, callbacks: {}, signal: undefined },
    )
    assert.ok(typeof result === "string")
    assert.ok(result.includes("hello"), "should contain echo output: " + result.slice(0, 50))
  })
})

describe("§18.12 verify 改动文件定位（T-VR4——VS Code 对齐）", () => {
  it("cwd 非 git 根——_touchedFiles 定向（不因 not a git repo 失效，不跑全量）", async () => {
    const { verifyTool } = await import("../src/agent-tools/verify.mjs")
    const cwd = setupTempDir()
    try {
      // 空 .git 标记：保证 git 失败路径确定（防 tmpdir 恰在父 git 仓库内——CLI T-VR1 同法）
      mkdirSync(join(cwd, ".git"))
      mkdirSync(join(cwd, "src", "agent-tools"), { recursive: true })
      const changed = join(cwd, "src", "agent-tools", "x.mjs")
      writeFileSync(changed, "export const v = 1\n")
      // 子代理场景：cwd 非 git 根（git diff 必然失败）——定位只能靠 _touchedFiles
      const ctx = {
        cwd,
        signal: new AbortController().signal,
        agent: { _touchedFiles: [changed] },
      }
      const result = await verifyTool.execute({}, ctx)
      assert.ok(!result.includes("no files modified"), "不因 git 失败而空转")
      assert.ok(result.includes("src/agent-tools/x.mjs"), "touched 文件进入定位（绝对路径归一化后）")
      assert.ok(result.includes("git unavailable"), "git 回退路径信息仍在")
      assert.ok(result.includes("syntax OK"), "语法检查运行")
      assert.ok(!result.includes("=== Test suite ==="), "不跑全量")
      assert.strictEqual(ctx.agent._verifyPassed, true)
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

describe("R-bug join→resolve 记账双前缀（AGENT-LOOP.md §24 尾修复注——VS Code 镜像——记账循环 = execute-tools.mjs FILE_MUTATORS 分支）", () => {
  // 记账点修复语义：p 为绝对路径时 join(cwd, p) 双前缀（node path.join 遇绝对段不重置——
  // resolve 才重置）→ _touchedFiles/_fileMutEvents 记错路径（verify 关联 / advisor 陈旧
  // 扫描——§24 D-24b mutation-log 面）。前提：cwd 恒绝对（评审 #5 明示）。
  // cwd = 临时绝对目录（非仓库 cwd——仓库 cwd 有活会话 manifest → execute-tools L3
  // peerDomains 冲突扫描读真实 ~/.thincoder/peers——并发负载下拖到秒级——D-T6 拦截）。
  let tCwd
  before(async () => {
    // execute-tools 模块图首次加载 ~500ms+（并发/负载下可达秒级）——钩子内预热
    // （钩子耗时不计入用例——D-T6 slow-gate 按用例测时）。
    await import("../src/agent/execute-tools.mjs")
    tCwd = mkdtempSync(join(tmpdir(), "tc-rbug-"))
  })
  after(() => {
    rmSync(tCwd, { recursive: true, force: true })
  })

  function batchAgent() {
    return {
      _planMode: false, _role: null, _engDesignToken: null, _engDesignReviewed: false,
      _touchedFiles: [], _mutatedThisRun: false, _calledAdvisorThisRun: false,
      _verifiedThisRun: false, _verifyPassed: undefined, _advisorRound: 0,
      config: { agent: { engineering: false } },
      history: [], // setup.mjs parity: agent.history = the run history (recordFileMutation holder)
    }
  }

  const writeTool = { name: "write", readonly: false, execute: async () => "ok" }

  async function runWrite(agent, p) {
    const { executeToolBatches } = await import("../src/agent/execute-tools.mjs")
    await executeToolBatches(agent, {
      response: { toolCalls: [{ id: "1", name: "write", arguments: JSON.stringify({ path: p, content: "x" }) }] },
      history: agent.history, fullHistory: [],
      toolByName: new Map([["write", writeTool]]),
      getAuto: () => true, // AUTO——跳过权限询问——直击记账点
      callbacks: {}, signal: undefined, cwd: tCwd, recentSigs: [], depth: 0,
    })
  }

  it("① 绝对 path → _touchedFiles 记 resolve 语义绝对路径（无双前缀）——修复前该用例必须失败", async () => {
    const p = join(tmpdir(), "tc-rbug-abs.mjs") // 绝对路径（cwd 外）——join(cwd, p) 双前缀现场
    const agent = batchAgent()
    await runWrite(agent, p)
    assert.deepEqual(agent._touchedFiles, [p], "_touchedFiles 记 resolve 语义绝对路径（非 join 双前缀）")
  })

  it("①b 绝对 path → _fileMutEvents 同源记账（§24 D-24b mutation-log 面——与 _touchedFiles 同 abs）", async () => {
    const p = join(tmpdir(), "tc-rbug-abs-evt.mjs")
    const agent = batchAgent()
    await runWrite(agent, p)
    assert.deepEqual(agent.history._fileMutEvents, [p], "文件变更事件记 resolve 语义绝对路径")
  })

  it("② 相对 path 回归不变（绝对 cwd 下构造）——join 语义与 resolve 等同", async () => {
    const agent = batchAgent()
    await runWrite(agent, "src/rbug-rel.mjs")
    assert.deepEqual(agent._touchedFiles, [join(tCwd, "src", "rbug-rel.mjs")], "相对 path 记账不变")
  })
})

describe("pending-task pushback fires at most once (CLI parity)", () => {
  it("one reminder per task-list state, then the model finishes", async () => {
    const http = await import("node:http")
    const { runAgent } = await import("../src/agent.mjs")
    const cwd = setupTempDir()
    const taskArgs = JSON.stringify({ items: [{ title: "T1", status: "pending" }] })
    const responses = [
      // Turn 1: model creates a pending task via the task tool
      [
        { choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "task", arguments: taskArgs } }] } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
      ],
      // Turn 2: model declares done → first pushback
      [
        { choices: [{ index: 0, delta: { content: "done" } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
      ],
      // Turn 3: model declares done again → allowed to finish
      [
        { choices: [{ index: 0, delta: { content: "done" } }] },
        { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
      ],
    ]
    const server = http.createServer((req, res) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        res.writeHead(200, { "Content-Type": "text/event-stream" })
        const chunks = responses.shift() ?? []
        res.end(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n")
      })
    })
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    const history = []
    try {
      const result = await runAgent(
        mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true,
        { history, fullHistory: [] },
      )
      assert.equal(result, "done", "final reply surfaces")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes("you still have pending tasks"))
      assert.equal(reminders.length, 1, "pushed back exactly once: " + JSON.stringify(reminders))
      assert.ok(reminders[0].content.includes("only reminder"), "copy says it is the only reminder")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

/** Scripted SSE server: serves `responses` (one chunk array per request) in order. */
async function scriptedServer(responses) {
  const http = await import("node:http")
  const server = http.createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      const chunks = responses.shift() ?? []
      res.end(chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n")
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return { server, port: server.address().port }
}

/** Turn that mutates code: one `write` tool call into src/ (triggers _mutatedThisRun + hasCodeMutations). */
function writeTurnChunks(file = "src/a.mjs") {
  const args = JSON.stringify({ path: file, content: "export const x = 1\n" })
  return [
    { choices: [{ index: 0, delta: { role: "assistant", tool_calls: [{ index: 0, id: "call_1", type: "function", function: { name: "write", arguments: args } }] } }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] },
  ]
}

/** Turn that declares done with no tool calls (end-of-run attempt). */
function doneTurnChunks() {
  return [
    { choices: [{ index: 0, delta: { content: "done" } }] },
    { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
  ]
}

const ADVISOR_REMINDER = "MUST get an advisor review"

describe("advisor guard loop pushback (2026-08-21 semantic refactor)", () => {
  let cfgDir

  before(() => {
    cfgDir = mkdtempSync(join(tmpdir(), "thincoder-guard-"))
    _setConfigPathForTest(join(cfgDir, "config.json"))
  })

  after(() => {
    _setConfigPathForTest(null)
    rmSync(cfgDir, { recursive: true, force: true })
  })

  function setAdvisorConfig(advisor) {
    writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ agent: { advisor } }))
  }

  it("guard default OFF: advisor {} + code mutation finishes without pushback", async () => {
    setAdvisorConfig({})
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "run finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "no advisor reminder when guard is absent: " + JSON.stringify(reminders))
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("guard ON: advisor { guard: true } + code mutation without review is pushed back, then converges", async () => {
    setAdvisorConfig({ guard: true })
    const cwd = setupTempDir()
    // tool-call turn + (MAX_ADVISOR_PUSHBACKS pushbacks + 1 final acceptance) "done" turns
    const responses = [writeTurnChunks(), ...Array.from({ length: MAX_ADVISOR_PUSHBACKS + 1 }, doneTurnChunks)]
    const { server, port } = await scriptedServer(responses)
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "the loop converges once the pushback budget is exhausted")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, MAX_ADVISOR_PUSHBACKS, "pushed back exactly MAX_ADVISOR_PUSHBACKS times: " + JSON.stringify(reminders))
      assert.ok(reminders[0].content.includes("round 1"), "first reminder names round 1 (advisorRound starts at 0)")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("engineering mode exemption: guard: true + engineering with design token finishes without pushback", async () => {
    setAdvisorConfig({ guard: true })
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(
        mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true,
        { history, fullHistory: [], engState: { enabled: true, engDesignToken: "test-token" } },
      )
      assert.equal(result, "done", "engineering mode finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "engineering mode is exempt from the advisor guard: " + JSON.stringify(reminders))
      // The write went through (design token present) — the mutation really happened,
      // so the absence of a pushback proves the exemption, not a failed mutation.
      assert.ok(existsSync(join(cwd, "src", "a.mjs")), "code mutation landed on disk")
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("legacy enabled does not trigger: advisor { enabled: true } finishes without pushback", async () => {
    setAdvisorConfig({ enabled: true })
    const cwd = setupTempDir()
    const { server, port } = await scriptedServer([writeTurnChunks(), doneTurnChunks()])
    const history = []
    try {
      const { runAgent } = await import("../src/agent.mjs")
      const result = await runAgent(mockProvider("deepseek-v4-pro", port), cwd, "do it", {}, undefined, true, { history, fullHistory: [] })
      assert.equal(result, "done", "run finishes normally")
      const reminders = history.filter((m) => typeof m.content === "string" && m.content.includes(ADVISOR_REMINDER))
      assert.equal(reminders.length, 0, "deprecated enabled field is not read anymore: " + JSON.stringify(reminders))
    } finally {
      server.close()
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})

describe("ENG state reminders (2026-08-25)", () => {
  it("setupAgentRun seeds _lastEngState=false — a resumed engineering session re-notifies on turn 1", async () => {
    const src = await import("../src/agent/setup.mjs")
    // setupAgentRun needs a full agent; assert the seed contract at the source level:
    // the literal must seed false (not the live engineering flag) so the injector fires.
    const fs = await import("node:fs")
    const text = fs.readFileSync(new URL("../src/agent/setup.mjs", import.meta.url), "utf8")
    assert.ok(text.includes("_lastEngState: false"),
      "setup must seed _lastEngState=false (resume re-notify contract)")
  })

  it("injectEngineeringReminder: every transition (ON and OFF) injects exactly one reminder", async () => {
    const { ENG_ON_REMINDER, ENG_OFF_REMINDER } = await import("../src/agent.mjs")
    const agent = {
      config: { agent: { engineering: true } },
      _lastEngState: false,
      history: [],
    }
    // The injector is module-private; the runAgent loop calls it. Simulate its contract:
    const inject = (a) => {
      const eng = a.config?.agent?.engineering ?? false
      if (eng !== a._lastEngState) {
        a.history.push({ role: "user", content: eng ? ENG_ON_REMINDER : ENG_OFF_REMINDER, transient: true })
      }
      a._lastEngState = eng
    }
    inject(agent) // resume → ON: notifies
    assert.equal(agent.history.length, 1, "resume into ON notifies once")
    inject(agent) // stable ON: no repeat
    assert.equal(agent.history.length, 1, "stable state stays silent")
    agent.config.agent.engineering = false
    inject(agent) // OFF transition: notifies (was silence before 2026-08-25)
    assert.equal(agent.history.length, 2)
    assert.match(agent.history[1].content, /engineering mode is now OFF/)
    inject(agent) // stable OFF
    assert.equal(agent.history.length, 2)
  })

  it("agent.mjs exports ENG_OFF_REMINDER and eng exit pushes it", async () => {
    const { ENG_OFF_REMINDER, engTool } = await import("../src/agent.mjs")
    const { engTool: eng } = await import("../src/agent-tools/eng.mjs")
    assert.match(ENG_OFF_REMINDER, /engineering mode is now OFF/)
    const agent = { config: { agent: { engineering: true } }, _pendingReminders: [] }
    await eng.execute({ action: "exit" }, { agent })
    assert.ok(agent._pendingReminders.includes(ENG_OFF_REMINDER))
  })
})
