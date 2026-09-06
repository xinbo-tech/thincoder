/**
 * async-pool-domains.test.mjs — §24 D-24a（AGENT-LOOP.md §24——R14 角色分池）VS Code 镜像：
 *   T-24a1 分池默认（2 eng-coder + 3 explore 并发——互不排队）
 *   T-24a2 分池满员（5 eng-coder 4 running+1 queued + explore spawn → explore 立即启动）
 *   T-24a3 配置生效（poolLimits {engCoder:2, other:6}——第 3 eng-coder queued / 第 7 explore queued）
 *   T-24a4 配置校验（0/-1/"abc"/缺失/形状错 → 回退默认 4/4 + warning 文案）
 * 同域回归（第 5 个同域入队/腾槽补位）由 subagent-async.test.mjs T6/T10/T11 既有用例覆盖——
 * 语义不变（同域仍 4）。harness 同 subagent-async.test.mjs（asyncChildServer/asyncParent 同款）。
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createServer } from "node:http"

/** 按任务文本响应的 async 子代理 mock（subagent-async.test.mjs 同款）——slow 延迟完成。 */
function asyncChildServer(delayMs = 0) {
  const server = createServer((req, res) => {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const isSlow = /slow/.test(body)
      const send = () => {
        res.end(
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: isSlow ? "slow result" : "fast result" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n` +
          "data: [DONE]\n\n"
        )
      }
      if (isSlow && delayMs > 0) setTimeout(send, delayMs)
      else send()
    })
  })
  return { server }
}

function asyncParent(port, extra = {}) {
  const base = {
    _provider: { name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" },
    config: {
      providersList: [{ name: "t", baseURL: `http://127.0.0.1:${port}`, apiKey: "k", model: "deepseek-v4-pro" }],
      agent: { subagentTurns: 5, engineering: false, poolLimits: null },
    },
    _subIdCounter: 0,
    _touchedFiles: [],
    _asyncSubagents: new Map(),
  }
  return { ...base, ...extra }
}

const spawnJson = (raw) => JSON.parse(String(raw))
const token = () => `${crypto.randomUUID()}:${Date.now() + 3600_000}`

/** 工具级 spawn（role eng-coder 需 engineering + token；explore/coder 直发）。 */
async function spawn(subagentTool, parent, ctx, task, role, extra = {}) {
  const args = { task, role, async: true, ...extra }
  if (role === "eng-coder") {
    parent.config.agent.engineering = true
    const t = token()
    parent._engDesignToken = t // 单槽镜像（tests 载体——legacy 面）
    args.designToken = t
  }
  return spawnJson(await subagentTool.execute(args, ctx))
}

const waitQueued = async (parent, id) => {
  for (let i = 0; i < 50 && parent._asyncSubagents.get(id)?.status !== "queued"; i++) {
    await new Promise((r) => setTimeout(r, 20))
  }
}

slow("T-24a1 (vscode): 分池默认——2 eng-coder + 3 explore 并发——互不排队", async () => {
  const { server } = asyncChildServer(600)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-pool-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    const ids = []
    for (let i = 0; i < 2; i++) { const r = await spawn(subagentTool, parent, ctx, `slow eng ${i}`, "eng-coder"); assert.equal(r.status, "running", `eng-coder ${i} running`); ids.push(r.id) }
    for (let i = 0; i < 3; i++) { const r = await spawn(subagentTool, parent, ctx, `slow explore ${i}`, "explore"); assert.equal(r.status, "running", `explore ${i} running——other 池空不排 eng 队`); ids.push(r.id) }
    // 两域同时 running（跨域总量 5 > 单域默认 4——T-24a1 核心）
    const eng = [...parent._asyncSubagents.values()].filter((e) => e.role === "eng-coder" && e.status === "running").length
    const oth = [...parent._asyncSubagents.values()].filter((e) => e.role !== "eng-coder" && e.status === "running").length
    assert.equal(eng, 2, "engCoder 域 running 2")
    assert.equal(oth, 3, "other 域 running 3——互不排队")
    await Promise.allSettled(ids.map((id) => parent._asyncSubagents.get(id).settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24a2 (vscode): 分池满员——5 eng-coder（4 running+1 queued）+ explore spawn → explore 立即启动", async () => {
  const { server } = asyncChildServer(500)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-pool-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    for (let i = 0; i < 4; i++) { const r = await spawn(subagentTool, parent, ctx, `slow eng ${i}`, "eng-coder"); assert.equal(r.status, "running") }
    const fifth = await spawn(subagentTool, parent, ctx, "slow eng 4", "eng-coder")
    assert.equal(fifth.status, "queued", "第 5 个 eng-coder 入队（engCoder 域满）")
    // explore spawn——other 域空——立即启动（不排 eng 队）
    const explore = await spawn(subagentTool, parent, ctx, "slow explore", "explore")
    assert.equal(explore.status, "running", "explore 立即启动（other 池空——跨域不排队）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

slow("T-24a3 (vscode): 配置生效——poolLimits {engCoder:2, other:6}——第 3 eng-coder queued / 第 7 explore queued", async () => {
  const { server } = asyncChildServer(400)
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const port = server.address().port
  const cwd = mkdtempSync(join(tmpdir(), "tc-pool-"))
  try {
    const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
    const parent = asyncParent(port)
    parent.config.agent.poolLimits = { engCoder: 2, other: 6 }
    const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
    for (let i = 0; i < 2; i++) { const r = await spawn(subagentTool, parent, ctx, `slow eng ${i}`, "eng-coder"); assert.equal(r.status, "running") }
    const third = await spawn(subagentTool, parent, ctx, "slow eng 2", "eng-coder")
    assert.equal(third.status, "queued", "第 3 个 eng-coder queued（engCoder 域容量 2）")
    for (let i = 0; i < 6; i++) { const r = await spawn(subagentTool, parent, ctx, `slow explore ${i}`, "explore"); assert.equal(r.status, "running", `explore ${i} running（other 域容量 6）`) }
    const seventh = await spawn(subagentTool, parent, ctx, "slow explore 6", "explore")
    assert.equal(seventh.status, "queued", "第 7 个 explore queued（other 域容量 6）")
    await Promise.allSettled([...parent._asyncSubagents.values()].map((e) => e.settled))
  } finally {
    server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("T-24a4 (vscode): 配置校验——0/-1/\"abc\"/缺失/形状错 → 回退默认 4/4 + warning 文案", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const cwd = mkdtempSync(join(tmpdir(), "tc-pool-"))
  try {
    // 非法形态（非对象/数组/0/负/字符串键）——effectivePoolLimits 直测 + spawn 结果带 warning
    const { effectivePoolLimits, entryDomain, runningByDomain, ASYNC_POOL_LIMITS } = await import("../src/agent-tools/subagent-scheduler.mjs")
    assert.deepEqual(ASYNC_POOL_LIMITS, { engCoder: 4, other: 4 }, "默认常量 4/4")
    for (const bad of [null, "abc", [], 4, { engCoder: 0 }, { other: -1 }, { engCoder: "abc" }, { engCoder: 1.5 }]) {
      const r = effectivePoolLimits({ config: { agent: { poolLimits: bad } } })
      assert.deepEqual(r.limits, { engCoder: 4, other: 4 }, `非法 ${JSON.stringify(bad)} → 回退 4/4`)
      if (bad !== null) assert.ok(r.warnings.length > 0, `非法 ${JSON.stringify(bad)} → warning 文案`)
    }
    // 缺失（undefined）→ 回退默认无 warning
    const none = effectivePoolLimits({ config: { agent: {} } })
    assert.deepEqual(none.limits, { engCoder: 4, other: 4 })
    assert.equal(none.warnings.length, 0)
    // 合法部分键：单键给定 → 另一键默认
    const partial = effectivePoolLimits({ config: { agent: { poolLimits: { engCoder: 2 } } } })
    assert.deepEqual(partial.limits, { engCoder: 2, other: 4 })
    // 域映射：eng-coder → engCoder；其余角色（explore/plan/coder/未知）→ other
    assert.equal(entryDomain({ role: "eng-coder" }), "engCoder")
    for (const role of ["explore", "plan", "coder", "sub", "weird"]) assert.equal(entryDomain({ role }), "other", `${role} → other`)
    assert.equal(entryDomain({}), "other", "无 role → other")
    // runningByDomain 分域计数
    const map = new Map([[1, { status: "running", role: "eng-coder" }], [2, { status: "running", role: "explore" }], [3, { status: "queued", role: "eng-coder" }]])
    assert.deepEqual(runningByDomain(map), { engCoder: 1, other: 1 }, "queued 不计 running")

    // spawn 结果带 warning 文案（配置非法时——模型可见回退）
    const { server } = asyncChildServer(300)
    await new Promise((r) => server.listen(0, "127.0.0.1", r))
    const port = server.address().port
    try {
      const parent = asyncParent(port)
      parent.config.agent.poolLimits = { engCoder: -2, other: "abc" }
      const ctx = { agent: parent, cwd, callbacks: {}, depth: 0 }
      const r = spawnJson(await subagentTool.execute({ task: "slow x", role: "coder", async: true }, ctx))
      assert.equal(r.status, "running", "非法配置不阻断 spawn（回退默认启动）")
      assert.ok(r.warning && r.warning.includes("invalid"), `warning 文案面（got: ${r.warning}）`)
      await parent._asyncSubagents.get(r.id).settled
    } finally {
      server.close()
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
