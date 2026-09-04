/**
 * eng-delivery.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): agent.test.mjs, subagent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync, utimesSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { execSync, spawn } from "node:child_process"
import { slow } from "./slow.mjs"
import { mergeChildMutations, buildChildRunOpts } from "../src/agent-tools/subagent.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import { LONG_REPORT } from "./helpers/long-report.mjs"
import { createServer } from "node:http"
import { C } from "../src/tui/ansi.mjs"
import { verifyTool } from "../src/agent-tools.mjs"
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
function makeWriteTool() {
  return {
    name: "write", readonly: false,
    touchedPaths: (args) => [args.path],
    async execute(args) { return `wrote ${args.path}` },
  }
}
const TEST_DIR = dirname(fileURLToPath(import.meta.url))                     // thincoder/test
const PROMPTS_DIR = join(TEST_DIR, "..", "src", "prompts")                   // thincoder/src/prompts
const SRC_DIR = join(TEST_DIR, "..", "src")                                  // thincoder/src
const noopRead = { name: "read", description: "read a file", parameters: { type: "object", properties: {} }, readonly: true, execute: async () => "ok" }
function captureServer(reportText) {
  const requests = []
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      requests.push(JSON.parse(body))
      const frames =
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: reportText } }] })}\n\n` +
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
        `data: [DONE]\n\n`
      res.writeHead(200, { "Content-Type": "text/event-stream" })
      res.end(frames)
    })
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, requests }))
  })
}



test("runAgent: eng-coder design token is NOT consumed — second spawn with same token succeeds", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  // 同一 token 两次 spawn：第一次实现，第二次（修复循环）重入——token 不消费
  // Real signed token, minted at runtime (v2 fail-closed): the original hardcoded
  // fixture carried a fixed expiry (2026-08-31) and started failing the day it
  // expired — TTL'd tokens must be generated fresh, never baked into the file.
  const realToken = await signedToken("8048bebc-a2a6-4b50-b198-74f37da606ab", Date.now() + 24 * 3600 * 1000)
  const script = [
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "实现", role: "eng-coder", designToken: realToken, async: false }) } },
    { content: "实现完成，报告见上。".repeat(30) },        // 子代理 1 交付
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "修复评审问题", role: "eng-coder", designToken: realToken, async: false }) } },
    { content: "修复完成，报告见上。".repeat(30) },        // 子代理 2 交付
    { content: "全部完成" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-token-reuse-"))
    const agent = createAgent({
      provider, tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: {} },
      cwd,
    })
    agent._engDesignToken = realToken // 设计评审已签发（真签名 token）
    const out = await runAgent(agent, "派两个实现任务", { onPermissionRequest: async () => true })
    assert.equal(out, "全部完成")
    assert.equal(agent._engDesignToken, realToken, "token survives both spawns — not consumed")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})


// ─── T15/T16/T17：designId 多槽（ENGINEERING-MODE.md 2026-09-01，AC8） ───

/** Real signed token with a fixed uuid+expiry (matches the v2 HMAC scheme). */
async function signedToken(uuid, expiresAt) {
  const { createHmac } = await import("node:crypto")
  const sig = createHmac("sha256", "thincoder-default-secret").update(`${uuid}:${expiresAt}`).digest("hex").slice(0, 16)
  return `${uuid}:${expiresAt}:${sig}`
}


test("T15: 双设计并行 spawn 各带 designId+token 互不覆盖（后 spawn 不拒先 spawn）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await signedToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const tokenB = await signedToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
  const idA = "11111111-1111-4111-8111-aaaaaaaaaaaa"
  const idB = "22222222-2222-4222-8222-bbbbbbbbbbbb"
  const script = [
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "实现A", role: "eng-coder", designId: idA, designToken: tokenA, async: false }) } },
    { content: "A 完成，报告见上。".repeat(30) },          // 子代理 A 交付（单 toolCall 简单路径）
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "实现B", role: "eng-coder", designId: idB, designToken: tokenB, async: false }) } },
    { content: "B 完成，报告见上。".repeat(30) },          // 子代理 B 交付
    { content: "双设计完成" },
  ]
  const { server, port, requests } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-t15-"))
    const agent = createAgent({
      provider, tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: {} },
      cwd,
    })
    // 两次评审通过、两槽并存（advisor.test.mjs 验证入槽本身；此处验证 spawn 消费端）
    agent._engDesignTokens = new Map([[idA, tokenA], [idB, tokenB]])
    agent._engDesignToken = tokenB // 后签发覆盖单值镜像（既有语义：布尔判定用）
    const out = await runAgent(agent, "双设计并行", { onPermissionRequest: async () => true })
    assert.equal(out, "双设计完成")
    assert.equal(agent._engDesignTokens.size, 2, "两槽并存——后 spawn 未覆盖前 spawn 的槽")
    // 两次子代理调用都成功（任一失败 dispatch 会把 Error 结果回喂模型，最终文本仍完成——
    // 因此直接校验子代理输入确实收到了各自 token：A 的 spawn 请求在 B 之前发生）
    const childTasks = requests.filter((r) => (r.messages ?? []).some((m) => m.role === "user" && /实现[AB]/.test(m.content)))
    assert.ok(childTasks.length >= 2, `two child spawns reached the LLM, got ${childTasks.length}`)
    // 交付报告回传 designId（修正轮复用）
    const toolResults = agent.history.filter((m) => m.role === "tool" && typeof m.content === "string" && m.content.includes("designId:"))
    assert.ok(toolResults.some((m) => m.content.includes(`designId: ${idA}`)), "A 交付报告回传 designId A")
    assert.ok(toolResults.some((m) => m.content.includes(`designId: ${idB}`)), "B 交付报告回传 designId B")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})



test("T16: 多设计缺 designId → throw 要求指定（不误取任一槽）", async () => {
  const { subagentTool, resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await signedToken("cccccccc-1111-4111-8111-00000000000a", exp)
  const tokenB = await signedToken("cccccccc-2222-4222-8222-00000000000b", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", tokenA], ["id-y", tokenB]]),
    _engDesignToken: tokenB,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designToken: tokenA }, { agent: parent, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Multiple approved designs[\s\S]*designId/,
    "多槽缺 designId → throw 要求指定",
  )
  // 单元口径同断言
  assert.throws(() => resolveDesignSlot(parent, undefined), /Multiple approved designs/)
  assert.throws(() => resolveDesignSlot(parent, "no-such-id"), /designId not found/, "给定 designId 无匹配槽 → 明确报错")
  assert.throws(
    () => resolveDesignSlot({ _engDesignTokens: new Map([["k", "v"]]), _engDesignToken: null }, undefined),
    /Design tokens were reset/,
    "镜像被 eng(exit/enter) 清空而 Map 残留 → 不复活过期 token，要求重新评审",
  )
  // 正常路径：单槽省略 designId → 取唯一槽
  const single = resolveDesignSlot({ _engDesignTokens: new Map([["only", tokenA]]), _engDesignToken: tokenA }, undefined)
  assert.equal(single.token, tokenA)
  // 兼容镜像：无 Map（旧会话）→ 单值镜像兜底
  const legacy = resolveDesignSlot({ _engDesignToken: tokenA }, undefined)
  assert.equal(legacy.token, tokenA)
})



test("T17: 复审失败不波及其他槽——旧 token 存活，其他设计 spawn 仍通过（方案 ②）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await signedToken("dddddddd-1111-4111-8111-00000000000a", exp)
  const idA = "33333333-3333-4333-8333-aaaaaaaaaaaa"
  const idB = "44444444-4444-4444-8444-bbbbbbbbbbbb"
  const script = [
    // turn 1：模型先复审设计 B（无 token 回显——评审未通过，完整评审文本）
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "design", documents: ["docs/design/B.md"] }) } },
    { content: "| # | Category | Severity | Issue | Suggestion |\n|---|---------|----------|------|------------|\n| 1 | correctness | 🔴 | spec gap | fix the spec |\n\n已复审，发现问题。" },
    // turn 2：随后 spawn 设计 A 的 eng-coder（tokenA 必须仍有效）
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "实现A", role: "eng-coder", designId: idA, designToken: tokenA, async: false }) } },
    { content: "A 完成，报告见上。".repeat(30) },
    { content: "完成——B 复审失败未影响 A" },
  ]
  const { server, port } = await mockLLM(script)
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const cwd = mkdtempSync(join(tmpdir(), "thincoder-t17-"))
    try { execSync("git init -q", { cwd, stdio: "ignore" }) } catch {}
    mkdirSync(join(cwd, "docs", "design"), { recursive: true })
    writeFileSync(join(cwd, "docs", "design", "B.md"), "# Design B\n")
    const agent = createAgent({
      provider, tools: [makeMutationTool()],
      config: { agent: { engineering: true }, advisor: { provider: "mock-advisor-provider" } },
      cwd,
    })
    agent.activeProvider = { name: "mock-advisor-provider" }
    agent._engDesignTokens = new Map([[idA, tokenA], [idB, await signedToken("dddddddd-2222-4222-8222-00000000000b", exp)]])
    agent._engDesignToken = tokenA
    const out = await runAgent(agent, "复审B然后实现A", { onPermissionRequest: async () => true })
    assert.equal(out, "完成——B 复审失败未影响 A")
    // 断言 1：A 的槽原样保留；槽集合仍为 2（失败的复审既没清 A 也没动 B）
    assert.equal(agent._engDesignTokens.get(idA), tokenA, "其他设计的槽不受波及——tokenA 原样")
    assert.equal(agent._engDesignTokens.size, 2, "复审失败不清任何既有槽（方案 ②：旧 token 存活至 TTL）")
    // 断言 2：A 的 eng-coder spawn 真的到达了子代理 LLM（未被 token 门禁拒绝）
    const childUserMsgs = agent.history.filter((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("实现A"))
    assert.ok(childUserMsgs.length >= 1, "A 的子代理 spawn 已执行（token 未被复审失败波及）")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})




// ────────────────────────────────────────
// mergeChildMutations — engineering-mode mechanical code gate
// ────────────────────────────────────────


test("mergeChildMutations: eng-coder mutations trigger the parent's guards", () => {
  const parent = {
    _mutatedThisRun: false,
    _touchedFiles: ["C:\\proj\\a.mjs"],
    _calledAdvisorThisRun: true, // prior design review — must be invalidated
    _verifiedThisRun: true,
    _verifyPassed: true,
    _advisorRound: 5,
  }
  const child = {
    _mutatedThisRun: true,
    _touchedFiles: ["C:\\proj\\a.mjs", "C:\\proj\\b.mjs"], // a.mjs dup, b.mjs new
  }
  const merged = mergeChildMutations(parent, child)
  assert.equal(merged, true)
  assert.equal(parent._mutatedThisRun, true)
  assert.deepEqual(parent._touchedFiles, ["C:\\proj\\a.mjs", "C:\\proj\\b.mjs"], "paths merged with dedup")
  assert.equal(parent._calledAdvisorThisRun, false, "prior advisor review invalidated — code review must run AFTER eng-coder changes")
  assert.equal(parent._verifiedThisRun, false, "prior verify invalidated")
  assert.equal(parent._verifyPassed, undefined)
  assert.equal(parent._advisorRound, 5, "round counter PRESERVED — merged code continues the current convergence cycle (no resets in code-mutating loops)")
})



test("mergeChildMutations: child without mutations changes nothing", () => {
  const parent = {
    _mutatedThisRun: false,
    _touchedFiles: [],
    _calledAdvisorThisRun: false,
    _verifiedThisRun: false,
  }
  const child = { _mutatedThisRun: false, _touchedFiles: [] }
  assert.equal(mergeChildMutations(parent, child), false)
  assert.equal(parent._mutatedThisRun, false)
  assert.deepEqual(parent._touchedFiles, [])
})


// ═══════════════════════════════════════════════════════════════════════════
// §18 工程交付协议（AGENT-LOOP.md §18，T-E1..E16 展开用例表——CLI 侧；T-E9/E10/E11
// 在 suspension.test.mjs）：
//   T-E1 eng-coder 缺省 async / T-E2 async:false 显式覆盖 / T-E3 内部 spawn explore
//   成功 / T-E4 非 explore 角色拒绝 / T-E5 async 拒绝 / T-E6 内部协议 mock 闭环 /
//   T-E7 第 7 次审计 spawn 机械拒绝（stalled）/ T-E8 节点失败重试 1 次仍败 stalled /
//   T-E12 域内写授权（手动档无逐写面板）/ T-E13 域外写机械不拦 + 审计输入可见 /
//   T-E14 授权粒度（planMode/design-token 门照常）/ T-E15 审计任务书独立性 /
//   T-E16 prompt + schema + doc 指向内容断言
// ═══════════════════════════════════════════════════════════════════════════

const DOCS_DESIGN_DIR = join(TEST_DIR, "..", "docs", "design")
const { sep } = await import("node:path")
/** 子代理报告 ≥ MIN_REPORT_CHARS 的便捷构造（防止打回扩写重试吃掉 script 步）。 */

/** 造一个已批准设计的会话（真签名 token 入槽 + 单值镜像）。返回 token。 */
async function issueDesign(agent, uuid) {
  const token = await signedToken(uuid, Date.now() + 24 * 3600 * 1000)
  agent._engDesignTokens = new Map([[uuid, token]])
  agent._engDesignToken = token
  return token
}

/** §18 内部 spawn 上下文 mock：eng-coder 子代理（depth>0，_role="eng-coder"）。 */
async function engCoderChildCtx(serverPort, cwd, taskInput, touched = []) {
  const { createAgent } = await import("../src/agent.mjs")
  const agent = createAgent({
    provider: { baseURL: `http://127.0.0.1:${serverPort}`, apiKey: "x", model: "m" },
    tools: [], config: { agent: { engineering: true } }, cwd, role: "eng-coder",
  })
  if (taskInput) agent._engTaskInput = taskInput
  for (const f of touched) agent._touchedFiles.push(f)
  return { agent, ctx: { agent, cwd, callbacks: {}, depth: 1 } }
}


test("T-E1: eng-coder 缺省 async——不带 async 参数 spawn 返回 running 不阻塞（§18 F1/D-E1）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([{ content: LONG_REPORT("E1 交付"), delay: 350 }])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e1-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e1e1e1e1-1111-4111-8111-0000000000e1")
    const t0 = Date.now()
    const out = JSON.parse(String(await subagentTool.execute(
      { task: "实现 E1（无 async 参数）", role: "eng-coder", designToken: token },
      { agent, cwd, callbacks: {}, depth: 0 },
    )))
    const elapsed = Date.now() - t0
    assert.equal(out.status, "running", "T-E1: 缺省 async → 立即返回 running")
    assert.ok(out.role === "eng-coder" && out.id, "T-E1: id+role 随返回")
    assert.ok(elapsed < 250, `T-E1: 不等待子代理（elapsed=${elapsed}ms，子代理 350ms）`)
    const entry = agent._asyncSubagents.get(String(out.id))
    assert.ok(entry, "T-E1: _asyncSubagents 登记")
    await entry.promise
    assert.equal(entry.done, true, "T-E1: 后台交付正常 settle")
    assert.ok(String(entry.report).includes("E1 交付 report"), "T-E1: 报告落 entry")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E2: async:false 显式覆盖——eng-coder 同步阻塞返回报告（§18 F1）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([{ content: LONG_REPORT("E2 同步交付") }])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e2-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e2e2e2e2-2222-4222-8222-0000000000e2")
    const out = String(await subagentTool.execute(
      { task: "实现 E2", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("E2 同步交付 report"), "T-E2: 阻塞返回完整报告")
    assert.ok(!out.includes('status:"running"'), "T-E2: 非 running 形态")
    assert.ok(out.includes("designId:"), "T-E2: 交付报告回传 designId（修正轮复用）")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "T-E2: 无 async 登记")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E3: eng-coder 内部 spawn explore 成功——审计节点同步返回报告 + 审计计数 + 机械任务书（§18 D-E3）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port, requests } = await mockLLM([{ content: LONG_REPORT("E3 审计") }])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e3-"))
  try {
    const { agent, ctx } = await engCoderChildCtx(port, cwd,
      "Docs involved: docs/design/AGENT-LOOP.md §18\n文件清单: src/a.mjs\n验收标准: AC-E3",
      [join(cwd, "src", "a.mjs")])
    const out = String(await subagentTool.execute({ task: "审计交付", role: "explore" }, ctx))
    assert.ok(out.includes("E3 审计 report"), "T-E3: 审计报告同步返回（阻塞）")
    assert.equal(agent._engAuditSpawns, 1, "T-E3: 审计 spawn 计数 = 1")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "T-E3: 内部 spawn 不同步登记 async（同步语义）")
    // round4 #4/T-E15：审计任务书 = 父 spawn 任务书（机械注入）+ _touchedFiles 机械并集
    const reqUser = requests[0].messages.find((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("审计交付"))
    assert.ok(reqUser, "T-E3: explore 子代理请求到达")
    assert.ok(reqUser.content.includes("[Audit scope — mechanical context"), "T-E3: 审计作用域机械注入")
    assert.ok(reqUser.content.includes("docs/design/AGENT-LOOP.md §18"), "T-E15: 父任务书（设计文档）进入审计输入")
    assert.ok(reqUser.content.includes("文件清单: src/a.mjs"), "T-E15: 父任务书（文件清单）进入审计输入")
    assert.ok(reqUser.content.includes(`src${sep}a.mjs`), "T-E15: _touchedFiles 机械并集进入审计输入")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E4: eng-coder 内部 spawn 非 explore 角色 → 机械拒绝（§18 D-E3/F6）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e4-"))
  try {
    const { ctx } = await engCoderChildCtx(9, cwd, null, [])
    for (const role of ["coder", "plan", "eng-coder"]) {
      await assert.rejects(
        subagentTool.execute({ task: "x", role }, ctx),
        /may only spawn role='explore'/,
        `T-E4: 内部 spawn role=${role} 拒绝（eng-coder 上下文只允许 explore 审计）`,
      )
    }
    assert.equal(ctx.agent._engAuditSpawns ?? 0, 0, "T-E4: 拒绝不消耗审计预算")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E5: eng-coder 内部 spawn explore 带 async:true → 机械拒绝（同步强制，§18 D-E3）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e5-"))
  try {
    const { ctx } = await engCoderChildCtx(9, cwd, null, [])
    await assert.rejects(
      subagentTool.execute({ task: "x", role: "explore", async: true }, ctx),
      /sync-only/,
      "T-E5: 内部 explore 带 async → 拒绝（等审计报告再决策）",
    )
    assert.equal(ctx.agent._engAuditSpawns ?? 0, 0, "T-E5: 拒绝不消耗审计预算")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E6: 内部协议 mock 闭环——审计 dirty → 自修 → 再审计 clean → advisor 复评 → 收敛交付（§18 D-E2）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const script = [
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "审计交付", role: "explore" }) } }, // 审计 #1
    { content: LONG_REPORT("D1 dirty") },                                                                  // explore 报告：dirty
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: "fix" }) } },     // 自修
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "再审", role: "explore" }) } },      // 审计 #2
    { content: LONG_REPORT("C1 clean") },                                                                  // explore 报告：clean
    { toolCall: { name: "advisor", arguments: JSON.stringify({ type: "code", documents: ["docs/design/AGENT-LOOP.md"] }) } }, // advisor 复评
    { content: "review clean, no findings. " + "y".repeat(180) },                                          // advisor 结果
    { content: LONG_REPORT("E6 收敛交付 audit-2 advisor-1 clean") },                                       // 最终交付
  ]
  const { server, port, requests } = await mockLLM(script)
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e6-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e6e6e6e6-6666-4666-8666-0000000000e6")
    const out = String(await subagentTool.execute(
      { task: "Docs involved: docs/design/AGENT-LOOP.md §18\n文件清单: src/a.mjs\n验收标准: AC-E6", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("E6 收敛交付"), "T-E6: 协议收敛 → 交付报告")
    assert.ok(out.includes("designId:"), "T-E6: 交付报告回传 designId")
    // 机制断言：两次 explore 审计（1 dirty + 1 clean）都带机械审计任务书
    const auditReqs = requests.filter((r) => (r.messages ?? []).some((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[Audit scope — mechanical context")))
    assert.equal(auditReqs.length, 2, "T-E6: 恰好两次审计 spawn")
    for (const r of auditReqs) {
      const user = r.messages.find((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("docs/design/AGENT-LOOP.md §18"))
      assert.ok(user, "T-E6: 审计任务书含父任务书（文档/文件清单/验收）")
    }
    // 机制断言：dirty 后发生了自修写（merge 进父记账）
    assert.equal(agent._mutatedThisRun, true, "T-E6: 自修写已发生并合并")
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("a.mjs")), "T-E6: 自修文件入父记账")
    // 机制断言：advisor 复评被调用（eng-coder 请求携带 advisor 工具调用 + documents）
    const advisorCall = requests.some((r) => {
      const body = JSON.stringify(r.messages ?? [])
      return body.includes('"name":"advisor"') && body.includes("docs/design/AGENT-LOOP.md")
    })
    assert.ok(advisorCall, "T-E6: advisor(type=code, documents=设计文档) 在子代理内部被调用")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E7: 收敛上限机械后备——第 7 次审计 spawn 拒绝（修正轮超限 → stalled，round5 #2）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  // 6 轮 dirty（每轮：审计 → dirty 报告 → 写修）→ 第 7 次审计 spawn 被机械拒绝 → stalled 交付
  const script = []
  for (let i = 1; i <= 6; i++) {
    script.push({ toolCall: { name: "subagent", arguments: JSON.stringify({ task: `审计 #${i}`, role: "explore" }) } })
    script.push({ content: LONG_REPORT(`D${i} dirty`) })
    script.push({ toolCall: { name: "write", arguments: JSON.stringify({ path: "src/a.mjs", content: `fix${i}` }) } })
  }
  script.push({ toolCall: { name: "subagent", arguments: JSON.stringify({ task: "第 7 次审计", role: "explore" }) } }) // 被拒绝（无 explore 请求）
  script.push({ content: LONG_REPORT("修正轮超限 —— stalled 报告：未收敛点清单") })                                     // stalled 交付
  const { server, port, requests } = await mockLLM(script)
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e7-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e7e7e7e7-7777-4777-8777-0000000000e7")
    const out = String(await subagentTool.execute(
      { task: "实现 E7", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("stalled"), "T-E7: 交付报告 stalled（不静默）")
    // 机械后备断言：前 6 次审计 spawn 各产生一个 explore 请求；第 7 次没有请求（被拒未触网）
    const auditReqs = requests.filter((r) => (r.messages ?? []).some((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[Audit scope — mechanical context")))
    assert.equal(auditReqs.length, 6, "T-E7: 恰 6 个审计 explore 请求（第 7 次被机械拒绝，未触网）")
    // 拒绝错误文本回到了 eng-coder（stalled 信号可见）——被拒工具结果以 Error 文本入其历史
    const lastReq = requests[requests.length - 1]
    const toolMsgs = (lastReq.messages ?? []).filter((m) => m.role === "tool" && typeof m.content === "string")
    assert.ok(toolMsgs.some((m) => m.content.includes("deliver a stalled report")), "T-E7: 拒绝错误 = stalled 信号（eng-coder 可见）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E8: 节点失败——explore 审计失败重试 1 次仍败 → stalled 报告（§18 D-E2/D-E6）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const script = [
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "审计交付", role: "explore" }) } }, // 审计 #1
    { fail: 400 },                                                                                          // explore 节点失败（400 非重试态——500 会触发 provider 指数退避）
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "审计重试", role: "explore" }) } }, // 重试 1 次
    { fail: 400 },                                                                                          // 再次失败
    { content: LONG_REPORT("stalled：审计节点重试 1 次仍败（HTTP 400）") },                                  // stalled 交付
  ]
  const { server, port, requests } = await mockLLM(script)
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e8-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e8e8e8e8-8888-4888-8888-0000000000e8")
    const out = String(await subagentTool.execute(
      { task: "实现 E8", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("stalled"), "T-E8: 节点失败 → stalled 报告")
    // 重试允许（失败不触发拒绝）：两次失败审计都产生 explore 请求（各消耗 1 次预算）
    const auditReqs = requests.filter((r) => (r.messages ?? []).some((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[Audit scope — mechanical context")))
    assert.equal(auditReqs.length, 2, "T-E8: 失败 2 次 = 2 次审计尝试（重试未被机械拒绝）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E17: AUTO+工程 async eng-coder 撞 turn-cap → 自动续跑而非 partial（§15 D-A3 例外——§18 默认 async 交付的 cap 兜底，修正轮 code review #1 补）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  // 子代理 turn 上限 = 3（父 config.agent.subagentTurns——buildChildRunOpts 读取）：
  // 3 次工具回合后撞 cap。手动档 = auto-decline（subagent.test.mjs 既有用例锁）；
  // AUTO+工程 = 自动 resume（2026-09-02 统一规则——AGENT-LOOP.md §15 D-A3 例外 / §18
  // D-E2：协议不调高 100-turn 上限，AUTO 续跑兜底）。
  const script = [
    { toolCall: { name: "read", arguments: JSON.stringify({ path: "a.mjs" }) } }, // run1 chat1
    { toolCall: { name: "read", arguments: JSON.stringify({ path: "b.mjs" }) } }, // run1 chat2
    { toolCall: { name: "read", arguments: JSON.stringify({ path: "c.mjs" }) } }, // run1 chat3 → ContinueError
    { content: LONG_REPORT("E17 AUTO 续跑交付") },                                // run2（resume）chat1 → 收敛交付
  ]
  const { server, port } = await mockLLM(script)
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e17-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [], config: { agent: { engineering: true, subagentTurns: 3 }, advisor: {} }, cwd,
    })
    agent.autoApprove = true // AUTO 档（无人值守授权——2026-09-02 统一规则前提）
    const token = await issueDesign(agent, "e1e7e1e7-1717-4171-8171-0000000000e7")
    const out = JSON.parse(String(await subagentTool.execute(
      { task: "实现 E17（会撞 cap）", role: "eng-coder", designToken: token }, // 缺省 async
      { agent, cwd, callbacks: {}, depth: 0 },
    )))
    assert.equal(out.status, "running", "T-E17: eng-coder 缺省 async（§18 F1）")
    const entry = agent._asyncSubagents.get(String(out.id))
    assert.ok(entry, "T-E17: async 条目登记")
    await entry.promise
    assert.equal(entry.done, true, "T-E17: 后台交付 settle")
    assert.ok(String(entry.report).includes("E17 AUTO 续跑交付"), "T-E17: AUTO 档撞 cap 自动续跑 → 完整交付（非 partial）")
    assert.ok(!String(entry.report).includes("stopped: turn cap reached"), "T-E17: 无 partial 截断标记")
    assert.ok(String(entry.report).includes("designId:"), "T-E17: 交付报告回传 designId（修正轮复用）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E12: 域内写授权——autoApprove=false 会话中 eng-coder 写文件成功（spawn 即授权，无逐写面板，§18 D-E3）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { server, port } = await mockLLM([
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "src/in-scope.mjs", content: "x" }) } },
    { content: LONG_REPORT("E12 交付") },
  ])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e12-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    // 手动档：autoApprove=false 且 ctx 无 onPermissionRequest —— 无用户在场
    const token = await issueDesign(agent, "e1e2e1e2-1212-4212-8212-0000000000e2")
    assert.equal(agent.autoApprove, false, "前置：手动档")
    const out = String(await subagentTool.execute(
      { task: "实现 E12", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("E12 交付"), "T-E12: 交付完成")
    assert.equal(agent._mutatedThisRun, true, "T-E12: 域内写已执行（无面板、无 no-permission-handler 拒绝）")
    assert.ok(agent._touchedFiles.some((f) => f.endsWith("in-scope.mjs")), "T-E12: 写的文件入父记账")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("T-E13/T-E15: 域外写机械不拦（纪律层）+ 审计任务书机械并集可见——审计可标注超清单改动（§18 D-E2③/D-E3）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const script = [
    { toolCall: { name: "write", arguments: JSON.stringify({ path: "outside-scope.txt", content: "越界" }) } }, // 域外写（清单未列）
    { toolCall: { name: "subagent", arguments: JSON.stringify({ task: "审计", role: "explore" }) } },            // 审计（任务书短写——不列文件）
    { content: LONG_REPORT("审计发现超清单改动：outside-scope.txt 不在文件清单") },                                // 审计报告标注
    { content: LONG_REPORT("E13 交付") },
  ]
  const { server, port, requests } = await mockLLM(script)
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-e13-"))
  try {
    const agent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [makeMutationTool()], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    const token = await issueDesign(agent, "e1e3e1e3-1313-4313-8313-0000000000e3")
    const out = String(await subagentTool.execute(
      { task: "Docs involved: docs/design/AGENT-LOOP.md §18\n文件清单: src/in-scope.mjs\n验收标准: AC-E13", role: "eng-coder", designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(out.includes("E13 交付"), "T-E13: 域外写机械上不拦（纪律层）——交付照常")
    assert.equal(agent._mutatedThisRun, true, "T-E13: 域外写已发生（纪律层兜底 = 审计）")
    // T-E15/round4 #4：审计输入含父任务书（文件清单）+ 实际 _touchedFiles 机械并集——
    // eng-coder 的短任务书（"审计"）不影响；审计仍能看到清单 + 越界文件 → 可标注超清单改动
    const auditReq = requests.find((r) => (r.messages ?? []).some((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[Audit scope — mechanical context")))
    assert.ok(auditReq, "T-E13: 审计 spawn 到达")
    const auditUser = auditReq.messages.find((m) => m.role === "user" && typeof m.content === "string" && m.content.includes("[Audit scope"))
    assert.ok(auditUser.content.includes("文件清单: src/in-scope.mjs"), "T-E15: 父任务书文件清单在审计输入（非 eng-coder 自述）")
    assert.ok(auditUser.content.includes("outside-scope.txt"), "T-E15: 实际 _touchedFiles 机械并集在审计输入（自述漏报也逃不掉）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})





test("T-E14: 授权粒度——豁免仅 onPermissionRequest 阶段；planMode/design-token/JSON/未知工具门照常（round4 #3）", async () => {
  const { executeToolCalls: exec } = await import("../src/agent/dispatch.mjs")
  const tools = new Map([["write", makeWriteTool()]])
  const call = (path) => [{ name: "write", arguments: JSON.stringify({ path, content: "x" }) }]
  // 受权 eng-coder（手动档无 permission handler）：
  const authEng = {
    cwd: tmpdir(), config: { agent: { engineering: true } },
    planMode: false, autoApprove: false, _role: "eng-coder",
    _engDesignReviewed: true, _engTaskAuthorized: true, _touchedFiles: [],
  }
  // ① 授权豁免生效：无 handler → 写照常（仅 onPermissionRequest 阶段被豁免）
  let r = await exec(authEng, tools, call("src/ok.mjs"), {}, 1)
  assert.equal(r[0].ok, true, "T-E14: 受权 eng-coder 写通过（免逐写询问）")
  // ② planMode 门照常
  r = await exec({ ...authEng, planMode: true }, tools, call("src/plan.mjs"), {}, 1)
  assert.equal(r[0].ok, false)
  assert.ok(r[0].result.includes("plan mode"), "T-E14: planMode deny 照常")
  // ③ design-token 门照常（授权 ≠ 设计评审已过）
  r = await exec({ ...authEng, _engDesignReviewed: false }, tools, call("src/gate.mjs"), {}, 1)
  assert.equal(r[0].ok, false)
  assert.ok(r[0].result.includes("design review required"), "T-E14: design-token deny 照常")
  // ④ JSON 解析失败照常（不进权限阶段）
  r = await exec(authEng, tools, [{ name: "write", arguments: "{bad json" }], {}, 1)
  assert.equal(r[0].ok, false)
  assert.ok(r[0].result.includes("Invalid tool arguments JSON"), "T-E14: JSON 解析门照常")
  // ⑤ 未知工具照常
  r = await exec(authEng, tools, [{ name: "nonexistent", arguments: "{}" }], {}, 1)
  assert.equal(r[0].ok, false)
  assert.ok(r[0].result.includes("Unknown tool"), "T-E14: 未知工具门照常")
  // ⑥ 非 eng-coder 子代理无授权 → 手动档无 handler 语义不变（§7 人在回路回归）
  const plain = { cwd: tmpdir(), config: { agent: { engineering: false } }, planMode: false, autoApprove: false, _role: "coder", _touchedFiles: [] }
  r = await exec(plain, tools, call("src/noauth.mjs"), {}, 1)
  assert.equal(r[0].ok, false)
  assert.ok(r[0].result.includes("no permission handler"), "T-E14: 非受权子代理照旧拒绝（无面板不悬挂）")
})



test("T-E14b: 授权标志同批权限路径同样只豁免询问——批/逐项 handler 均不触发（§16 D-B1 交互）", async () => {
  const { executeToolCalls: exec } = await import("../src/agent/dispatch.mjs")
  const tools = new Map([["write", makeWriteTool()]])
  const authEng = {
    cwd: tmpdir(), config: { agent: { engineering: true } },
    planMode: false, autoApprove: false, _role: "eng-coder",
    _engDesignReviewed: true, _engTaskAuthorized: true, _touchedFiles: [],
    history: [],
  }
  const asks = []
  const r = await exec(authEng, tools, [
    { name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "1" }) },
    { name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "2" }) },
  ], { onBatchPermissionRequest: async () => { asks.push("batch"); return "oneByOne" }, onPermissionRequest: async () => { asks.push("item"); return true } }, 1)
  assert.equal(r.length, 2)
  assert.equal(r.every((x) => x.ok), true, "T-E14b: 同批两项均通过")
  assert.deepEqual(asks, [], "T-E14b: 受权子代理不触发任何权限询问（批/逐项均不弹）")
})



test("T-E16: schema async 描述 = 角色级默认措辞 + spawn-child 门文案 + setup 受限装配 + AGENT-LOOP 指向（AC-E7 文档断言）", () => {
  // ① subagent schema async 描述：角色级默认（eng-coder → true；其余 → false）
  const subagentSrc = readFileSync(join(SRC_DIR, "agent-tools", "subagent.mjs"), "utf8")
  assert.ok(subagentSrc.includes("Default is role-level: role='eng-coder' → true"), "schema async 描述 = 角色级默认（eng-coder → true）")
  assert.ok(subagentSrc.includes("all other roles → false (blocking)"), "schema async 描述 = 其余角色默认阻塞")
  assert.ok(subagentSrc.includes("pass async:false to force the blocking spawn"), "显式覆盖提示在")
  // ② spawn-child 机械门 + 上限常量（round5 #2 文案）
  const spawnChildSrc = readFileSync(join(SRC_DIR, "agent", "spawn-child.mjs"), "utf8")
  assert.ok(spawnChildSrc.includes("ENG_AUDIT_SPAWN_LIMIT = 6"), "审计 spawn 上限常量 = 6（第 7 次拒绝）")
  assert.ok(spawnChildSrc.includes("may only spawn role='explore'"), "非 explore 拒绝文案")
  assert.ok(spawnChildSrc.includes("sync-only"), "async 拒绝文案")
  assert.ok(spawnChildSrc.includes("deliver a stalled report"), "stalled 信号文案")
  // ③ setup.mjs：eng-coder depthOnly 装配补受限 subagent（role 枚举仅 explore、无 async）
  const setupSrc = readFileSync(join(SRC_DIR, "agent", "setup.mjs"), "utf8")
  assert.ok(setupSrc.includes('enum: ["explore"]'), "受限 subagent role 枚举仅 explore")
  assert.ok(setupSrc.includes("delete props.async"), "受限 subagent 不提供 async（参数层过滤）")
  assert.ok(setupSrc.includes('agent._role === "eng-coder" ? [advisorTool, verifyTool, ...(engAuditSubagent'), "eng-coder depthOnly 装配 = advisor + verify + 受限 subagent")
  // ④ dispatch 授权豁免在 Phase-1 权限短路（autoApprove 等效——仅询问阶段，前置门照常）
  const dispatchSrc = readFileSync(join(SRC_DIR, "agent", "dispatch.mjs"), "utf8")
  assert.ok(dispatchSrc.includes("tool.readonly || isSubagentReadonlyAction(toolCall.name, args) || isSubagentControlAction(toolCall.name, args) || agent.autoApprove || agent._engTaskAuthorized"), "授权豁免 = autoApprove 等效短路（仅询问阶段——§19 起 check/status 动作同按只读分类；§19.5 cancel 控制类豁免同入此短路）")
  assert.ok(dispatchSrc.includes("JSON parse / unknown tool / planMode / design-token gates"), "前置门不豁免（注释口径）")
  // ⑤ AC-E7：§7 权限条 + §15 D-A3 权限交互条同批加了 §18 D-E3 指向
  const loopDoc = readFileSync(join(DOCS_DESIGN_DIR, "AGENT-LOOP.md"), "utf8")
  assert.ok(loopDoc.includes("eng-coder 例外：spawn 时任务域授权"), "§7 权限条含 eng-coder 例外指向")
  const dA3 = loopDoc.split("**async 子代理权限交互（评审 #2 补）**")[1] || ""
  assert.ok(dA3.includes("§18 D-E3"), "§15 D-A3 权限交互条含 §18 D-E3 指向")
  assert.ok(dA3.includes("eng-coder 例外"), "§15 D-A3 权限交互条标注 eng-coder 例外")
  // ⑥ engineering.md 既有上限短语重断言（§15 T9 不破——内容断言保留）
  const engMd = readFileSync(join(PROMPTS_DIR, "engineering.md"), "utf8")
  assert.ok(engMd.includes("Cap: at most 4 concurrent eng-coders"), "§15 T9: cap 短语保留")
  assert.ok(engMd.includes("past 4 the bookkeeping cost"), "§15 T9: past 4 rationale 保留")
})




// ─── §18.7 审计任务书模板三件（AGENT-LOOP.md §18.7 D-TS4/5/6——T-TS4/5/6）───


test("§18.7 T-TS4/T-TS5/T-TS6: 审计 spawn 任务书含 A1 指令模板 + A2 机械摘要块 + A3 报告格式模板", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-audit-tpl-"))
  const { server, port, requests } = await captureServer("audit report " + "x".repeat(220))
  try {
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: { engineering: true } },
      cwd,
    })
    parent._role = "eng-coder"
    // A2 输入：结构化任务书（## 分节 + 冗长背景段——背景必须被摘要块排除）
    parent._engTaskInput = [
      "## Docs involved",
      "docs/design/AGENT-LOOP.md",
      "docs/design/ENGINEERING-MODE.md",
      "## 任务背景(verbose)",
      "这是一段冗长的对话背景与上下文……" + "y".repeat(500),
      "## 文件清单",
      "src/prompts/engineering-sub.md",
      "src/advisor/run.mjs",
      "### 修改",
      "（子节——随后才是验收标准——摘要边界不得截断文件清单）",
      "## 验收标准",
      "AC-R2-1 = 协议三块落文",
      "AC-R2-2 = 审计任务书模板三件",
    ].join("\n")
    parent._touchedFiles = ["src/a.mjs", "src/b.mjs"]
    const r = String(await subagentTool.execute({ task: "偏差审计", role: "explore" }, { agent: parent, cwd, callbacks: {}, depth: 1 }))
    assert.ok(r.includes("audit report"), "审计 explore 正常完成")
    const audit = JSON.stringify(requests[0].messages)
    // T-TS4 A1：四类偏差 + 范围限制 + 校验清单格式
    assert.ok(audit.includes("[Audit instructions — mechanical template (AGENT-LOOP.md §18.7 D-TS4 A1):]"), "T-TS4: A1 指令模板注入")
    assert.ok(audit.includes("PARTIAL: an acceptance criterion implemented partially or not at all;"), "T-TS4: 四类偏差点名——部分实现")
    assert.ok(audit.includes("SILENT-SIMPLIFICATION"), "T-TS4: 四类偏差点名——静默简化")
    assert.ok(audit.includes("DOC-DRIFT"), "T-TS4: 四类偏差点名——文档漂移")
    assert.ok(audit.includes("OUT-OF-LIST"), "T-TS4: 四类偏差点名——超清单")
    assert.ok(audit.includes("Audit scope = _touchedFiles above UNION the files confirmed by the parent task book"), "T-TS4: 范围限制（只审 _touchedFiles + 父任务书确认文件）")
    assert.ok(audit.includes("NOT grounds for an out-of-list finding"), "T-TS4: 工作区未列改动不作超清单依据")
    assert.ok(audit.includes("do NOT re-read whole documents"), "T-TS4: 范围限制含不重读全文档子句（F-TS6 A1）")
    assert.ok(audit.includes("Every deviation item MUST be fieldized: file:line + design reference (doc path + section/AC id) + severity + evidence"), "T-TS4: 偏差项清单格式（文件:行+设计引用+严重级+证据）")
    // T-TS5 A2：三要素逐字 + 排除冗长上下文；独立性（_engTaskInput 机械生成）
    assert.ok(audit.includes("[Parent spawn task book — mechanical summary (AGENT-LOOP.md §18.7 D-TS5 A2)"), "T-TS5: A2 机械摘要块注入")
    assert.ok(audit.includes("docs/design/AGENT-LOOP.md") && audit.includes("docs/design/ENGINEERING-MODE.md"), "T-TS5: 设计文档路径列表逐字")
    assert.ok(audit.includes("src/prompts/engineering-sub.md") && audit.includes("src/advisor/run.mjs"), "T-TS5: 受影响文件清单逐字（含 ### 子节后仍完整）")
    assert.ok(audit.includes("AC-R2-1 = 协议三块落文") && audit.includes("AC-R2-2 = 审计任务书模板三件"), "T-TS5: 验收标准逐字")
    assert.ok(!audit.includes("y".repeat(500)), "T-TS5: 冗长上下文/背景被排除（摘要块不含冗长背景）")
    // T-TS6 A3：报告格式模板（三态 + 四类偏差均未发现）
    assert.ok(audit.includes("[Audit report format — mechanical template (AGENT-LOOP.md §18.7 D-TS6 A3):]"), "T-TS6: A3 报告模板注入")
    assert.ok(audit.includes("Four deviation categories: none found.") && audit.includes("四类偏差均未发现"), "T-TS6: 无偏差句（四类偏差均未发现——正文子串，不依赖 JSON 转义形态）")
    assert.ok(audit.includes("| category | file:line | design reference | severity | evidence |"), "T-TS6: 偏差行字段化格式")
    assert.ok(audit.includes("PROBLEM — the audit itself could not run"), "T-TS6: 三态——问题态")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§18.7 T-TS5 变体: 「涉及文件」表头的任务书摘要归属受影响文件清单（marker 回归——2026-09-04 advisor 首审 #2 修正）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-audit-tpl2-"))
  const { server, port, requests } = await captureServer("audit report " + "x".repeat(220))
  try {
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: { engineering: true } },
      cwd,
    })
    parent._role = "eng-coder"
    parent._engTaskInput = [
      "## Docs involved",
      "docs/design/AGENT-LOOP.md",
      "## 任务背景(verbose)",
      "冗长背景……" + "z".repeat(400),
      "## 涉及文件",
      "src/a.mjs",
      "## 验收标准",
      "AC1",
    ].join("\n")
    parent._touchedFiles = ["src/a.mjs"]
    const r = String(await subagentTool.execute({ task: "偏差审计", role: "explore" }, { agent: parent, cwd, callbacks: {}, depth: 1 }))
    assert.ok(r.includes("audit report"), "变体审计 explore 正常完成")
    const audit = JSON.stringify(requests[0].messages)
    // 「涉及文件」必须归属 Affected-file list 节——不得报 not found（旧归属会把文件清单塞进设计文档节）
    assert.ok(!audit.includes("Affected-file list: (not found in the parent task book)"), "T-TS5 变体: Affected-file list 节不报 not found（涉及文件 marker 归属正确）")
    assert.ok(audit.includes("src/a.mjs") && audit.includes("docs/design/AGENT-LOOP.md") && audit.includes("AC1"), "T-TS5 变体: 三要素仍逐字在摘要块")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})


// ─── §18.13 审计范围引导：机械预算句（AGENT-LOOP.md §18.13 D-A1.2——T-A1.2/4）───

/** §18.13 审计预算句断言（正路径与模拟回归共用——防断言逻辑分叉——fail-when-unchanged）。 */
function assertAuditBudget(audit, tag) {
  assert.ok(audit.includes("[Audit budget — mechanical]"), `${tag}: 预算句头（Audit budget — mechanical）在`)
  assert.ok(audit.includes("read ONLY the touched files listed above"), `${tag}: 只读 touched files 句在`)
  assert.ok(audit.includes("the design-doc sections the parent task book names"), `${tag}: 只读任务书点名节句在`)
  assert.ok(audit.includes("Do NOT read whole documents"), `${tag}: 不整读文档句在（F-A3）`)
  assert.ok(audit.includes("10 tool rounds max"), `${tag}: 预算 10 tool rounds max 在（F-A3）`)
  assert.ok(audit.includes("report PROBLEM") && audit.includes("(inconclusive)"), `${tag}: 超预算报 PROBLEM (inconclusive) 句在（F-A3）`)
}


test("§18.13 T-A1.2: 审计任务书机械段含预算句（A1+A2 之后、A3 之前——定序——fail-when-unchanged）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-audit-budget-"))
  const { server, port, requests } = await captureServer("audit report " + "x".repeat(220))
  try {
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: { engineering: true } },
      cwd,
    })
    parent._role = "eng-coder"
    parent._engTaskInput = "Docs involved: docs/design/AGENT-LOOP.md / File list: src/agent-tools/subagent.mjs / Acceptance: AC-A1.1"
    parent._touchedFiles = ["src/agent-tools/subagent.mjs"]
    const r = String(await subagentTool.execute({ task: "偏差审计", role: "explore" }, { agent: parent, cwd, callbacks: {}, depth: 1 }))
    assert.ok(r.includes("audit report"), "T-A1.2: 审计 explore 正常完成")
    const audit = JSON.stringify(requests[0].messages)
    assertAuditBudget(audit, "T-A1.2")
    // 定序（D-A1.2）：A1 指令模板 + A2 摘要块之后、A3 报告模板之前
    const a1 = audit.indexOf("[Audit instructions — mechanical template (AGENT-LOOP.md §18.7 D-TS4 A1):]")
    const a2 = audit.indexOf("[Parent spawn task book — mechanical summary (AGENT-LOOP.md §18.7 D-TS5 A2)")
    const budget = audit.indexOf("[Audit budget — mechanical]")
    const a3 = audit.indexOf("[Audit report format — mechanical template (AGENT-LOOP.md §18.7 D-TS6 A3):]")
    assert.ok(a1 !== -1 && a2 !== -1 && budget !== -1 && a3 !== -1, "T-A1.2: 预算句与 A1/A2/A3 同框（审计任务书注入）")
    assert.ok(budget > a1 && budget > a2, "T-A1.2: 预算句在 A1 指令模板 + A2 摘要块之后（定序——评审 #7）")
    assert.ok(budget < a3, "T-A1.2: 预算句在 A3 报告模板之前（定序——评审 #7）")
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§18.13 T-A1.4: 预算句缺失模拟回归（删除预算句 → 断言失败——防回潮）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "cli-audit-budget2-"))
  const { server, port, requests } = await captureServer("audit report " + "x".repeat(220))
  try {
    const parent = createAgent({
      provider: { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" },
      tools: [noopRead],
      config: { agent: { engineering: true } },
      cwd,
    })
    parent._role = "eng-coder"
    parent._engTaskInput = "Docs involved: docs/design/AGENT-LOOP.md / File list: a.mjs / Acceptance: AC1"
    parent._touchedFiles = ["a.mjs"]
    const r = String(await subagentTool.execute({ task: "偏差审计", role: "explore" }, { agent: parent, cwd, callbacks: {}, depth: 1 }))
    assert.ok(r.includes("audit report"), "T-A1.4: 审计 explore 正常完成")
    const audit = JSON.stringify(requests[0].messages)
    assertAuditBudget(audit, "T-A1.4") // 正路径先证：预算句在
    const regressed = audit.replace("[Audit budget — mechanical]", "[Audit budget — soft guidance]")
    assert.throws(
      () => assertAuditBudget(regressed, "regressed-budget"),
      /预算句头（Audit budget — mechanical）/,
      "删除预算句头后断言必须失败（fail-when-unchanged——防回潮）"
    )
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})
