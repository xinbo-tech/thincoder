/**
 * eng-token-gate.test.mjs — design-token 门禁/槽位域测试（2026-09-06 advisor 修正轮：
 * 自 eng-delivery.test.mjs 按域拆出——token 门禁族 T15/T16/T16b/T17/T-R16d/T-R16a；
 * mintToken/makeMutationTool 随迁副本——eng-delivery 保留其使用侧副本）。
 * runAgent 级 spawn 集成族（§18 T-E 系列、审计模板）留在 eng-delivery.test.mjs
 * （共享其 mockLLM/捕获服务器装配——AGENT-LOOP §18.14 测试按域拆分）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execSync } from "node:child_process"
import { slow } from "./slow.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"
import { LONG_REPORT } from "./helpers/long-report.mjs"

function makeMutationTool() {
  return {
    name: "write",
    description: "test mutation",
    parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
    readonly: false,
    execute: async () => "Wrote 5 chars to test.txt",
  }
}

/** Real unsigned token with a fixed uuid+expiry (2026-09-06: flow credential —
 *  uuid:expiresAt——HMAC 防伪层已删——见 ENGINEERING-MODE.md 2026-09-06 段). */
async function mintToken(uuid, expiresAt) {
  return `${uuid}:${expiresAt}`
}

// ─── T15/T16/T17：designId 多槽（ENGINEERING-MODE.md 2026-09-01，AC8） ───

test("T15: 双设计并行 spawn 各带 designId+token 互不覆盖（后 spawn 不拒先 spawn）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const tokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
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
  const tokenA = await mintToken("cccccccc-1111-4111-8111-00000000000a", exp)
  const tokenB = await mintToken("cccccccc-2222-4222-8222-00000000000b", exp)
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
  // R16（2026-09-06）：镜像空而槽在位 = 合法状态（镜像自身的 token 过期被恢复过滤/
  // enter/spawn 门禁清理，其他槽仍有效——D-R16a/D-R16c）——槽即权威，不再整体拒
  // （"off→on requires fresh design review" 语义废弃——F-R16a）
  const mirrorless = resolveDesignSlot({ _engDesignTokens: new Map([["only", tokenA]]), _engDesignToken: null }, undefined)
  assert.equal(mirrorless.token, tokenA, "镜像空而单槽在位 → 取回该槽（TTL 校验在门禁 validateDesignToken）")
  // 正常路径：单槽省略 designId → 取唯一槽
  const single = resolveDesignSlot({ _engDesignTokens: new Map([["only", tokenA]]), _engDesignToken: tokenA }, undefined)
  assert.equal(single.token, tokenA)
  // 兼容镜像：无 Map（旧会话）→ 单值镜像兜底
  const legacy = resolveDesignSlot({ _engDesignToken: tokenA }, undefined)
  assert.equal(legacy.token, tokenA)
})

test("T16b: 错槽 token 拒绝——designId 槽持 tokenA、spawn 传 tokenB → spawn 拒绝（AC-TO3——2026-09-06 无签名格式）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const tokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", tokenA]]),
    _engDesignToken: tokenA,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "id-x", designToken: tokenB }, { agent: parent, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "错槽 token（槽值 ≠ 传入）→ spawn 拒绝——slot 精确匹配不变（无签名层不改变门禁）",
  )
})

test("T-R16d: spawn 门禁过期拒删槽 + 镜像同步；错配/格式拒不删有效槽（R16 D-R16c ③）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() - 1000 // 已过期
  const expiredToken = await mintToken("dddddddd-9999-4999-8999-0000000000dd", exp)
  const validTokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", Date.now() + 24 * 3600 * 1000)
  const validTokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", Date.now() + 24 * 3600 * 1000)
  // ① 过期拒（designId 指向过期槽、传入即槽值）→ 该槽被删（长跑不重启也清），他槽不波及
  const p1 = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["exp-id", expiredToken], ["ok-id", validTokenA]]),
    _engDesignToken: validTokenA,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "exp-id", designToken: expiredToken }, { agent: p1, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "过期 token → 门禁拒（fail-closed 不变）",
  )
  assert.equal(p1._engDesignTokens.has("exp-id"), false, "过期拒 → 该槽被删（T-R16d）")
  assert.equal(p1._engDesignTokens.get("ok-id"), validTokenA, "其他有效槽不受波及")
  assert.equal(p1._engDesignToken, validTokenA, "镜像非过期 token——不动")
  // ② 过期镜像 legacy 兜底（无 Map 单值路径）→ 拒并清镜像
  const p2 = { config: { agent: { engineering: true } }, _engDesignToken: expiredToken, _touchedFiles: [] }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designToken: expiredToken }, { agent: p2, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "过期 legacy 镜像 → 门禁拒",
  )
  assert.equal(p2._engDesignToken, null, "过期镜像在拒时同步清")
  // ③ 错配 token（槽持 validTokenA、spawn 传 validTokenB——双方均有效）→ 拒但不清槽（防误删有效槽）
  const p3 = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", validTokenA]]),
    _engDesignToken: validTokenA,
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "id-x", designToken: validTokenB }, { agent: p3, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "错配拒（T16b 语义不变）",
  )
  assert.equal(p3._engDesignTokens.get("id-x"), validTokenA, "错配拒不删有效槽")
  assert.equal(p3._engDesignToken, validTokenA, "镜像保留")
  // ④ 畸形槽值（恢复读回——门禁格式拒）→ 不删（格式拒非过期拒——F-R16b ③）
  const p4 = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["bad-id", "tok-garbage"]]),
    _engDesignToken: "tok-garbage",
    _touchedFiles: [],
  }
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "bad-id", designToken: "tok-garbage" }, { agent: p4, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "畸形槽值 → 格式拒",
  )
  assert.equal(p4._engDesignTokens.get("bad-id"), "tok-garbage", "格式拒不删槽（只有过期拒删——防误删有效槽）")
})

test("T-R16a: 有效 token 跨 OFF→ON 存活——spawn 可用（R16 F-R16a 用户裁定——原 exit/enter 全清反转）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { engTool } = await import("../src/agent-tools/eng.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const uuid = "8048bebc-a2a6-4b50-b198-74f37da606ab"
  const token = await mintToken(uuid, Date.now() + 24 * 3600 * 1000)
  const { server, port } = await mockLLM([{ content: LONG_REPORT("R16a 跨模式交付") }])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-r16a-"))
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = createAgent({
      provider, tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    agent._engDesignTokens = new Map([[uuid, token]])
    agent._engDesignToken = token // 设计评审已签发（模拟）
    // ON→OFF：exit 不清 token
    await engTool.execute({ action: "exit" }, { agent })
    assert.equal(agent.config.agent.engineering, false)
    assert.equal(agent._engDesignToken, token, "exit 后 token 保留（R16）")
    assert.equal(agent._engDesignTokens.size, 1, "exit 后槽保留")
    // OFF→ON：不重评——TTL 内 token 继续有效
    const out = await engTool.execute({ action: "enter" }, { agent })
    assert.match(out, /activated/i)
    assert.equal(agent._engDesignToken, token, "enter 后 token 保留")
    // spawn 可用：过期清理未误伤 + 门禁放行（eng-coder 到达 mock）
    const report = String(await subagentTool.execute(
      { task: "实现 R16a", role: "eng-coder", designId: uuid, designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(report.includes("R16a 跨模式交付 report"), "T-R16a: 跨 OFF→ON 的 token spawn 成功（原全清语义下必拒）")
    assert.equal(agent._engDesignToken, token, "spawn 不消费 token")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})




slow("T17: 复审失败不波及其他槽——旧 token 存活，其他设计 spawn 仍通过（方案 ②）", async () => {
  const { createAgent, runAgent } = await import("../src/agent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("dddddddd-1111-4111-8111-00000000000a", exp)
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
    agent._engDesignTokens = new Map([[idA, tokenA], [idB, await mintToken("dddddddd-2222-4222-8222-00000000000b", exp)]])
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

// ─── 2026-09-07 token 链终消费制（ENGINEERING-MODE.md §2.6——T1/T2/T3/T4/T7/T8/T9） ───

test("T1/T3: consume-design 后同 designId spawn 机械拒（not found）+ slot/镜像兼容值清理", async () => {
  const { subagentTool, resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const { executeConsumeDesignAction } = await import("../src/agent-tools/subagent-spawn.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const idA = "55555555-5555-4555-8555-aaaaaaaaaaaa"
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([[idA, tokenA]]),
    _engDesignToken: tokenA,
    _touchedFiles: [],
  }
  // 消费前 slot 在位（fix round 前提）
  assert.equal(resolveDesignSlot(parent, idA).token, tokenA)
  // 父侧核销：consume-design（调用形态定死——读槽值 → removeDesignTokenSlot）
  const out = String(await executeConsumeDesignAction({ designId: idA }, { agent: parent, callbacks: {} }))
  assert.match(out, /design slot consumed/)
  // T3：slot 移除 + 单槽镜像/兼容值条件清（指向被消费 token 才清——token-ttl.mjs 条件清）
  assert.equal(parent._engDesignTokens.has(idA), false, "消费后 slot 移除")
  assert.equal(parent._engDesignToken, null, "镜像指向被消费 token → 条件清")
  // T1：同 designId 再 spawn → resolveDesignSlot not found 机械拒（复用洞闭合）
  assert.throws(() => resolveDesignSlot(parent, idA), /designId not found/)
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: idA, designToken: tokenA }, { agent: parent, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /designId not found/,
    "消费后同 designId spawn → not found（机械拒）",
  )
})

test("T2: 链中 fix round（未消费）spawn → 通过（slot 未消费——仅链终核销才消费）", async () => {
  const { createAgent } = await import("../src/agent.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const uuid = "8048bebc-a2a6-4b50-b198-74f37da606ab"
  const token = await mintToken(uuid, Date.now() + 24 * 3600 * 1000)
  const { server, port } = await mockLLM([{ content: LONG_REPORT("T2 链中交付") }])
  const cwd = mkdtempSync(join(tmpdir(), "thincoder-cd-t2-"))
  try {
    const provider = { baseURL: `http://127.0.0.1:${port}`, apiKey: "x", model: "m" }
    const agent = createAgent({
      provider, tools: [], config: { agent: { engineering: true }, advisor: {} }, cwd,
    })
    agent._engDesignTokens = new Map([[uuid, token]])
    agent._engDesignToken = token // 设计评审已签发（模拟）
    const report = String(await subagentTool.execute(
      { task: "实现 T2", role: "eng-coder", designId: uuid, designToken: token, async: false },
      { agent, cwd, callbacks: {}, depth: 0 },
    ))
    assert.ok(report.includes("T2 链中交付 report"), "链中未消费 → fix round spawn 通过")
    assert.equal(agent._engDesignTokens.has(uuid), true, "spawn 不消费 slot（消费点仅在父侧核销）")
    rmSync(cwd, { recursive: true, force: true })
  } finally {
    server.close()
  }
})

test("T4: consume-design 幂等 + 未知 designId no-op（不报错）+ 多槽缺 id 拒 + 工程模式限定 + legacy 镜像", async () => {
  const { executeConsumeDesignAction } = await import("../src/agent-tools/subagent-spawn.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", tokenA]]),
    _engDesignToken: tokenA,
  }
  const first = String(await executeConsumeDesignAction({ designId: "id-x" }, { agent: parent }))
  assert.match(first, /design slot consumed/)
  // 重复消费 → 同款 no-op 提示（幂等——不报错——评审 #3 定死）
  const again = String(await executeConsumeDesignAction({ designId: "id-x" }, { agent: parent }))
  assert.match(again, /no live slot for designId id-x/)
  // 未知 designId → 同款 no-op（不报错）
  const unknown = String(await executeConsumeDesignAction({ designId: "no-such" }, { agent: parent }))
  assert.match(unknown, /no live slot for designId no-such/)
  // 多槽缺 designId → 拒（spawn 同款语义——不误消费任一槽）
  const tokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
  const multi = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-a", tokenA], ["id-b", tokenB]]),
    _engDesignToken: tokenA,
  }
  await assert.throws(() => executeConsumeDesignAction({}, { agent: multi }), /Multiple approved designs/)
  assert.equal(multi._engDesignTokens.size, 2, "拒绝不误消费任一槽")
  // 工程模式限定（与 spawn 同门）
  const normal = {
    config: { agent: { engineering: false } },
    _engDesignTokens: new Map([["id-x", tokenA]]),
    _engDesignToken: tokenA,
  }
  await assert.throws(() => executeConsumeDesignAction({ designId: "id-x" }, { agent: normal }), /Engineering mode is not active/)
  // legacy 单值镜像（无 Map）——缺省 designId 消费镜像（兼容值清）
  const legacy = { config: { agent: { engineering: true } }, _engDesignToken: tokenA }
  const lout = String(await executeConsumeDesignAction({}, { agent: legacy }))
  assert.match(lout, /design slot consumed/)
  assert.equal(legacy._engDesignToken, null, "legacy 镜像消费后清")
})

test("T7: 多槽隔离——消费 A 不动 B（B 仍 spawn 通过；镜像条件清仅同值）", async () => {
  const { resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const { executeConsumeDesignAction } = await import("../src/agent-tools/subagent-spawn.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const tokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-a", tokenA], ["id-b", tokenB]]),
    _engDesignToken: tokenA,
    _touchedFiles: [],
  }
  const out = String(await executeConsumeDesignAction({ designId: "id-a" }, { agent: parent }))
  assert.match(out, /design slot consumed/)
  assert.equal(parent._engDesignTokens.has("id-a"), false, "A 槽消费")
  assert.equal(parent._engDesignTokens.get("id-b"), tokenB, "B 槽不受波及（多槽隔离）")
  assert.equal(parent._engDesignToken, null, "镜像指向 A 的 token → 条件清（CLI 槽即权威——null 镜像 + 槽在位 = 合法态）")
  // B 仍 spawn 通过
  assert.equal(resolveDesignSlot(parent, "id-b").token, tokenB, "消费 A 后 B 仍可 spawn（隔离）")
})

test("T8: 错配拒不消费——stalled/未核销槽保留（未消费可 fix round）", async () => {
  const { subagentTool, resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const exp = Date.now() + 24 * 3600 * 1000
  const tokenA = await mintToken("aaaaaaaa-1111-4111-8111-00000000000a", exp)
  const tokenB = await mintToken("aaaaaaaa-2222-4222-8222-00000000000b", exp)
  const parent = {
    config: { agent: { engineering: true } },
    _engDesignTokens: new Map([["id-x", tokenA]]),
    _engDesignToken: tokenA,
    _touchedFiles: [],
  }
  // 错配 spawn 拒（stalled 场景噪声）→ 槽保留（只有显式 consume-design 才消费）
  await assert.rejects(
    subagentTool.execute({ task: "x", role: "eng-coder", designId: "id-x", designToken: tokenB }, { agent: parent, cwd: process.cwd(), callbacks: {}, depth: 0 }),
    /Invalid or missing design token/,
    "错配拒（既有门禁不变）",
  )
  assert.equal(parent._engDesignTokens.get("id-x"), tokenA, "错配拒不消费槽")
  assert.equal(parent._engDesignToken, tokenA, "镜像保留")
  // 未核销 → fix round 仍可 spawn
  assert.equal(resolveDesignSlot(parent, "id-x").token, tokenA, "stalled/未核销槽保留——未消费可 fix round")
})

test("T9: 跨会话恢复后消费生效——恢复的持久化槽同受消费管理（直到验收消费）", async () => {
  const { restoreEngTokens } = await import("../src/token-ttl.mjs")
  const { resolveDesignSlot } = await import("../src/agent-tools/subagent.mjs")
  const { executeConsumeDesignAction } = await import("../src/agent-tools/subagent-spawn.mjs")
  const uuid = "8048bebc-a2a6-4b50-b198-74f37da606ab"
  const token = await mintToken(uuid, Date.now() + 24 * 3600 * 1000)
  const agent = { config: { agent: { engineering: true } } }
  // 会话恢复面（saveSession engTokenSlotFields 落盘的字段形态）
  restoreEngTokens(agent, { engDesignToken: token, engDesignTokens: { [uuid]: token } })
  assert.equal(resolveDesignSlot(agent, uuid).token, token, "恢复后槽在位（TTL 内）")
  const out = String(await executeConsumeDesignAction({ designId: uuid }, { agent }))
  assert.match(out, /design slot consumed/)
  assert.equal(agent._engDesignTokens.has(uuid), false, "恢复后的持久化槽可被链终消费")
  assert.throws(() => resolveDesignSlot(agent, uuid), /designId not found/, "消费后恢复槽再 spawn → not found")
})

// ─── §29.1 F2d（2026-09-07）：门侧自愈——错误两分支附持有 id 列表 ───

test("T4 (F2d): 门错误两分支均附持有 designId 列表——恢复后无 digest 的发现途径（id 非凭证）", async () => {
  const { resolveDesignSlot } = await import("../src/agent-tools/subagent-spawn.mjs")
  const parent = {
    _engDesignTokens: new Map([["id-a", "tok-a"], ["id-b", "tok-b"]]),
    _engDesignToken: "tok-a",
  }
  assert.throws(
    () => resolveDesignSlot(parent, "no-such"),
    (e) => /designId not found/.test(e.message) && e.message.includes("held design ids: id-a, id-b"),
    "F2d: not-found 分支附持有 id 列表",
  )
  assert.throws(
    () => resolveDesignSlot(parent, undefined),
    (e) => /Multiple approved designs/.test(e.message) && e.message.includes("design ids: id-a, id-b"),
    "F2d: 多槽歧义分支附持有 id 列表",
  )
})
