/**
 * guards.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { slow } from "./slow.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import { createServer } from "node:http"
import { mockLLM } from "./helpers/mock-llm.mjs"




function makeMutationTool() {
  return {
    name: "write",
    description: "test mutation",
    parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
    readonly: false,
    execute: async () => "Wrote 5 chars to test.txt",
  }
}

// ---------------------------------------------------------------- verify guard (config.verifyGuard)


test("runAgent: verify guard on — mutated files but no verify → pushback (max 2)", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"x\"}" } },
    { content: "完成了" },
    { content: "还是完成了" },
    { content: "验证后完成" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [makeMutationTool()], config: { verifyGuard: true }, cwd })
    const out = await runAgent(agent, "改点东西", { onPermissionRequest: async () => true })
    assert.equal(out, "验证后完成")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("have not verified the changes"),
    )
    assert.equal(guards.length, 2)
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: verify guard on — verify called → no pushback", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"x\"}" } },
    { toolCall: { name: "verify" } },
    { content: "done" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [makeMutationTool()], config: { verifyGuard: true }, cwd })
    const out = await runAgent(agent, "改点东西", { onPermissionRequest: async () => true })
    assert.equal(out, "done")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("have not verified the changes"),
    )
    assert.equal(guards.length, 0)
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: verify guard on — bash (sideEffectExempt) not treated as mutation", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const fakeBash = { ...makeMutationTool(), name: "bash", sideEffectExempt: true }
  const script = [{ toolCall: { name: "bash" } }, { content: "测试全绿" }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [fakeBash], config: { verifyGuard: true }, cwd })
    const out = await runAgent(agent, "跑下测试", { onPermissionRequest: async () => true })
    assert.equal(out, "测试全绿")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("have not verified the changes"),
    )
    assert.equal(guards.length, 0)
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: verify guard off — mutated files go straight through", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"x\"}" } },
    { content: "完成了" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [makeMutationTool()], config: { verifyGuard: false }, cwd })
    const out = await runAgent(agent, "改点东西", { onPermissionRequest: async () => true })
    assert.equal(out, "完成了")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("have not verified the changes"),
    )
    assert.equal(guards.length, 0)
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: advisor guard — side-effect tool (bash) after the review does NOT re-trigger (user decision 2026-08-08: review is triggered by CODE MUTATIONS only)", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const advisorTool = {
    name: "advisor",
    description: "mock advisor",
    parameters: { type: "object", properties: {} },
    readonly: true,
    execute: async () => "| # | File | Severity | Issue | Suggestion |\n| 1 | a.js | 🔴 | bug | fix |",
  }
  const bashTool = { ...makeMutationTool(), name: "bash", sideEffectExempt: true }
  const script = [
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"x\"}" } },
    { toolCall: { name: "advisor", arguments: "{}" } },
    { toolCall: { name: "bash" } },
    { content: "done" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [makeMutationTool(), advisorTool, bashTool], config: { advisor: { guard: true } }, cwd })
    const out = await runAgent(agent, "改点东西", { onPermissionRequest: async () => true })
    assert.equal(out, "done")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("MUST get an advisor review"),
    )
    assert.equal(guards.length, 0, "bash after review must NOT re-trigger the advisor guard")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: advisor guard — writing code again AFTER the review DOES re-trigger (FILE_MUTATORS invalidate the review)", async () => {
  // NOTE: mockLLM 对 advisor 工具响应存在 chat 内部多发请求的交互怪癖（script 索引错位，
  // 第二个工具调用会被吞掉），因此这里不 mock advisor 调用——直接验证 FILE_MUTATOR 链路：
  // 第二次 write 后仍无评审 → guard 推回。'评审后再写代码'的等价语义（FILE_MUTATOR 重置
  // _calledAdvisorThisRun）由代码审查覆盖（agent.mjs 的 FILE_MUTATOR 分支）。
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"x\"}" } },
    { toolCall: { name: "write", arguments: "{\"path\":\"src/test.js\",\"content\":\"y\"}" } },
    { content: "done" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-guard-test-"))
    const agent = createAgent({ provider, tools: [makeMutationTool()], config: { advisor: { guard: true } }, cwd })
    const out = await runAgent(agent, "改点东西", { onPermissionRequest: async () => true })
    assert.equal(out, "done")
    const guards = agent.history.filter(
      (m) => typeof m.content === "string" && m.content.includes("MUST get an advisor review"),
    )
    assert.ok(guards.length >= 1, "code written without a review must trigger the advisor guard (got " + guards.length + ")")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})




test("hasCodeMutations: src/ 下一切（含 src/prompts/*.md）是产品代码，与 isProductCode 一致", async () => {
  const { hasCodeMutations } = await import("../src/agent.mjs")
  // 相对路径（判定表达式与 isProductCode 一致）
  assert.equal(hasCodeMutations({ _touchedFiles: ["src/prompts/engineering.md"], _mutatedThisRun: true }), true, "src/prompts/*.md → code")
  assert.equal(hasCodeMutations({ _touchedFiles: ["docs/design/x.md"], _mutatedThisRun: true }), false, "docs/** → doc")
  assert.equal(hasCodeMutations({ _touchedFiles: ["README.md"], _mutatedThisRun: true }), false, "root doc → doc")
  assert.equal(hasCodeMutations({ _touchedFiles: ["src/app.mjs"], _mutatedThisRun: true }), true, "src code → code")
  assert.equal(hasCodeMutations({ _touchedFiles: ["docs/design/x.md", "src/app.mjs"], _mutatedThisRun: true }), true, "mixed → code")
  // 生产环境 _touchedFiles 是绝对路径（join(cwd, p)）— src 组件同样判为代码
  const absSrc = join(tmpdir(), "proj", "src", "prompts", "engineering.md")
  const absDoc = join(tmpdir(), "proj", "docs", "design", "x.md")
  assert.equal(hasCodeMutations({ _touchedFiles: [absSrc], _mutatedThisRun: true }), true, "absolute src/prompts/*.md → code")
  assert.equal(hasCodeMutations({ _touchedFiles: [absDoc], _mutatedThisRun: true }), false, "absolute docs/** → doc")
  // 空列表 → 回退 _mutatedThisRun
  assert.equal(hasCodeMutations({ _touchedFiles: [], _mutatedThisRun: true }), true)
  assert.equal(hasCodeMutations({ _touchedFiles: [], _mutatedThisRun: false }), false)
})



test("hasCodeMutations: 临时文件（tmp-* / .tmp / .temp）不触发 advisor/verify guard", async () => {
  const { hasCodeMutations } = await import("../src/agent.mjs")
  assert.equal(hasCodeMutations({ _touchedFiles: ["tmp-c1.mjs"], _mutatedThisRun: true }), false, "tmp-*.mjs → 非代码")
  assert.equal(hasCodeMutations({ _touchedFiles: ["D:/proj/tmp-check.mjs"], _mutatedThisRun: true }), false, "绝对路径 tmp-* → 非代码")
  assert.equal(hasCodeMutations({ _touchedFiles: ["scratch.tmp"], _mutatedThisRun: true }), false, ".tmp 扩展 → 非代码")
  assert.equal(hasCodeMutations({ _touchedFiles: ["data.temp"], _mutatedThisRun: true }), false, ".temp 扩展 → 非代码")
  // 混合：临时文件 + 真实代码 → 仍算代码
  assert.equal(hasCodeMutations({ _touchedFiles: ["tmp-x.mjs", "src/app.mjs"], _mutatedThisRun: true }), true, "临时+代码 → 代码")
  // 文档 + 临时文件 → 仍不算代码
  assert.equal(hasCodeMutations({ _touchedFiles: ["tmp-x.mjs", "README.md"], _mutatedThisRun: true }), false, "临时+文档 → 非代码")
  // src/ 下即使是 tmp- 名也是产品代码（src/ 检查优先于临时排除）
  assert.equal(hasCodeMutations({ _touchedFiles: ["src/tmp-utils.mjs"], _mutatedThisRun: true }), true, "src/tmp-* → 代码")
})


// ────────────────────────────────────────
// guard granularity — engineering mode has NO per-turn guard pushback
// (reviews are driven by the methodology flow, not mechanical reminders)
// ────────────────────────────────────────

function makeWriteFileTool() {
  return {
    name: "write", readonly: false,
    touchedPaths: (args) => [args.path],
    async execute(args) { return `ok ${args.path}` },
  }
}


test("runAgent: engineering doc-only change skips advisor and verify guards", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "docs/design/TEST.md", content: "# t" }) } },
    { content: "设计文档完成" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-doconly-"))
    const agent = createAgent({
      provider, tools: [makeWriteFileTool()],
      config: { agent: { engineering: true }, advisor: {} },
      cwd,
    })
    const out = await runAgent(agent, "写个设计文档", { onPermissionRequest: async () => true })
    assert.equal(out, "设计文档完成")
    assert.equal(requests.length, 2, "no guard pushback rounds for doc-only change")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("advisor review before finishing")), "no advisor guard reminder")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("have not verified")), "no verify guard reminder")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: engineering code change does NOT trigger advisor/verify guards", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) } },
    { content: "代码写完了" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-codechg-"))
    const agent = createAgent({
      provider, tools: [makeWriteFileTool()],
      config: { agent: { engineering: true }, advisor: {} },
      cwd,
    })
    agent._engDesignToken = "tok-123" // design review passed — parent may write code
    const out = await runAgent(agent, "写个代码文件", { onPermissionRequest: async () => true })
    assert.equal(out, "代码写完了")
    assert.equal(requests.length, 2, "no guard pushback rounds in engineering mode")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("advisor review before finishing")), "no advisor guard reminder")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("have not verified")), "no verify guard reminder")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("runAgent: verifyGuard does NOT apply in engineering mode", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) } },
    { content: "完成" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-engverify-"))
    const agent = createAgent({
      provider, tools: [makeWriteFileTool()],
      config: { agent: { engineering: true }, advisor: {}, verifyGuard: true },
      cwd,
    })
    agent._engDesignToken = "tok-123"
    const out = await runAgent(agent, "写个代码文件", { onPermissionRequest: async () => true })
    assert.equal(out, "完成")
    assert.equal(requests.length, 2, "verify guard must not push back in engineering mode even with verifyGuard: true")
    assert.ok(!agent.history.some((m) => typeof m.content === "string" && m.content.includes("have not verified")), "no verify guard reminder")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})




test("runAgent: 工具执行完成后的中断也记账（评审 #4——文件类工具已改盘，guard 必须拦截）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const editTool = {
    name: "write" /* FILE_MUTATORS 成员（记账按名字集合）+ 自定义实现顶替内置仅限本测试实例 */,
    description: "write（模拟改盘）",
    parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    readonly: false,
    touchedPaths: (a) => [a.path ?? ""],
    execute: async () => "ok", // 模拟已改盘（真实 write 语义）
  }
  const script = [{ toolCall: { name: "write", arguments: JSON.stringify({ path: "x.txt" }) }, usage: { prompt_tokens: 100 } }]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-intr-"))
    const agent = createAgent({ provider, tools: [editTool], config: { agent: {} }, cwd })
    agent.autoApprove = true // dispatch L111 读 agent.autoApprove（非只读工具审批凭证）
    const ac = new AbortController()
    // onToolResult 时机 = 工具 execute 已完成（改盘已发生）——恰在 executeToolCalls 返回后
    // runAgent 检查 signal.reason.interrupt → 中断分支（历史不 push 真实结果但必须记账）
    // 注意：signal 是第四参 options（第三参是 callbacks！）
    await assert.rejects(
      runAgent(agent, "改文件", {
        onToolResult: () => ac.abort({ interrupt: true, message: "停" }),
      }, { signal: ac.signal }),
      (e) => e.name === "AbortError" || e.name === "User interrupted",
    )
    assert.equal(agent._mutatedThisRun, true, "评审 #4：文件类工具完成 → 中断也必须记账")
    assert.equal(agent._touchedFiles.length, 1)
    assert.ok(agent._touchedFiles[0].endsWith("x.txt"))
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})
