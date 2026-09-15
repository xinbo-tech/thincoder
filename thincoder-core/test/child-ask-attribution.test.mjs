/**
 * child-ask-attribution.test.mjs — child 询问**归属键**核侧机检（残环批——承
 * `docs/batches/2026-09-16-subagent-panel-residual-rings.md` §2.7 用例表 T-A1–T-A4n）。
 *
 * 缺陷面（前批覆盖面 10 环表残环 10）＝ 两类询问名不携归属键 ⇒ 端侧归属标签不可闭
 * （并行条目歧义；`key-modes.mjs` / 端侧 `parseRelayPath` 归属解析的输入契约）：
 *   ① async 飞刀询问名 = 裸 `escalate/${tool}`（`escalate-async.mjs`）——修复后 `escalate#<id>/${tool}`；
 *   ② sync 飞刀询问 = 裸工具名直通（`subagent-actions.mjs`——连前缀都无）——修复后同规包装；
 *   ③ continue（撞帽续跑）args.agent = 显示名（tag / consult label）——修复后 = 机器键
 *      （`escalate#<id>` / `consult#<relayN>`）。
 *
 * 夹具 = 最小 parent（config / providersList / 池字段——两形同构的核侧字段）+ 注入
 * `ctx.runAgent` 假 runner（**零网络**：runner 整体替换 ⇒ 不触 provider 请求；`createAgent`
 * 纯构造）。断言面 = 询问名/参数逐字（业务可观察面 = 端侧归属解析的输入）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { ContinueError } from "../agent.mjs"
import { launchEscalateAsync } from "../agent-tools/escalate-async.mjs"
import { executeEscalateAction } from "../agent-tools/subagent-actions.mjs"
import { consultStartTool } from "../agent-tools/consult.mjs"

const sleep = (ms = 5) => new Promise((r) => setTimeout(r, ms))
async function until(cond, ms = 8000) {
  const t0 = Date.now()
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("until: timeout")
    await sleep(5)
  }
}

/** 最小 depth-0 parent：consultModels 池 + providersList 解析源（假 provider——零请求）。 */
function makeParent() {
  return {
    _asyncSubagents: new Map(),
    _asyncQueue: [],
    _subAgentCounter: 0,
    autoApprove: false,
    cwd: process.cwd(),
    tools: [],
    memory: null,
    history: [],
    config: {
      agent: { engineering: false, subagentTurns: 6, consultModels: [{ provider: "mockprov", model: "mock-model" }] },
      providersList: [{ name: "mockprov", model: "mock-model", apiKey: "test-key", baseURL: "http://127.0.0.1:9/v1", format: "openai" }],
    },
  }
}

/** 询问捕获 ctx：假 runner（整体替换——零网络）+ `ctx.onPermissionRequest` 记录器（恒批 true）。
 *  `channel:false` ⇒ 不挂询问通道（T-A4n 边界）。 */
function makeCtx(parent, runner, { channel = true } = {}) {
  const calls = []
  const ctx = { agent: parent, depth: 0, callbacks: {}, signal: null, runAgent: runner }
  if (channel) ctx.onPermissionRequest = async (name, args) => { calls.push([name, args]); return true }
  return { ctx, calls }
}

// ─── T-A1：async 飞刀询问名（正常——修复前必红：裸 `escalate/write`）──────────────

test("T-A1 核（async 飞刀名）：假 runner 触 ask ⇒ 捕获逐字 escalate#<id>/write", async () => {
  const parent = makeParent()
  const seen = []
  const runner = async (child, input, cbs) => {
    seen.push(await cbs.onPermissionRequest("write", { path: "x" }))
    return "fake escalate report"
  }
  const { ctx, calls } = makeCtx(parent, runner)
  const ack = JSON.parse(launchEscalateAsync(parent, ctx, {
    task: "t", provider: { name: "mockprov", model: "mock-model", apiKey: "k" }, tag: "mockprov:mock-model", effortNote: "",
  }))
  assert.equal(ack.role, "escalate")
  await until(() => calls.length === 1)
  assert.deepEqual(calls[0], [`escalate#${ack.id}/write`, { path: "x" }], "async 飞刀询问名 = 携归属键（修复前裸 escalate/write）")
  assert.deepEqual(seen, [true], "ask 通道裁决原样回传（true）")
  await parent._asyncSubagents.get(String(ack.id)).promise
})

// ─── T-A2：sync 飞刀询问名 + continue（正常——修复前必红：裸名 / tag）───────────

test("T-A2 核（sync 飞刀名 + continue）：捕获 escalate#<N>/write 与 (continue, agent escalate#N)", async () => {
  const parent = makeParent()
  let pass = 0
  const runner = async (child, input, cbs) => {
    pass++
    if (pass === 1) {
      await cbs.onPermissionRequest("write", { path: "x" })
      throw new ContinueError(2)
    }
    return "fake resumed report"
  }
  const { ctx, calls } = makeCtx(parent, runner)
  const out = await executeEscalateAction({ task: "t", async: false }, ctx)
  assert.equal(typeof out, "string", "sync 飞刀返回报告文本（无抛）")
  assert.deepEqual(calls[0], ["escalate#1/write", { path: "x" }], "sync 飞刀询问名同规包装（修复前裸 write）")
  assert.deepEqual(calls[1], ["continue", { turns: 2, agent: "escalate#1" }], "continue args.agent = 机器键（修复前 tag）")
})

// ─── T-A3：consult continue（正常——修复前必红：label）─────────────────────────

test("T-A3 核（consult continue）：捕获 (continue, agent consult#<relayN>)", async () => {
  const parent = makeParent()
  let pass = 0
  const runner = async () => {
    pass++
    if (pass === 1) throw new ContinueError(3)
    return "consultant reply"
  }
  const { ctx, calls } = makeCtx(parent, runner)
  const started = JSON.parse(await consultStartTool.execute({ problem: "hard problem" }, ctx))
  assert.ok(started.id, "会诊会话建立（ack 携 id）")
  await until(() => calls.length === 1)
  assert.deepEqual(calls[0], ["continue", { turns: 3, agent: "consult#1" }], "consult continue args.agent = 机器键（修复前 label）")
})

// ─── T-A4n：反证（边界 · 无询问通道 —— 不崩 + 退化返回）───────────────────────

test("T-A4n 核（反证 · 无 ctx.onPermissionRequest）：包装仍在场、退化 false、不崩", async () => {
  // ① sync 飞刀：包装 handler 恒在场（`Promise.resolve(false)` 退化——修复前 = null（非函数））
  const parent = makeParent()
  const seen = []
  const runner = async (child, input, cbs) => {
    const handler = cbs.onPermissionRequest
    seen.push(typeof handler === "function" ? await handler("write", { path: "x" }) : null)
    return "fake report"
  }
  const { ctx } = makeCtx(parent, runner, { channel: false })
  const out = await executeEscalateAction({ task: "t", async: false }, ctx)
  assert.equal(typeof out, "string", "无通道 ⇒ 退化报告（不崩）")
  assert.deepEqual(seen, [false], "缺通道 ⇒ 包装在場且退化 false（拒绝路径零回归）")

  // ② async 飞刀：既有 guard（`if (!ctx.onPermissionRequest) return false`）零回归
  const parent2 = makeParent()
  const seen2 = []
  const runner2 = async (child, input, cbs) => {
    seen2.push(await cbs.onPermissionRequest("write", { path: "y" }))
    return "fake report"
  }
  const { ctx: ctx2 } = makeCtx(parent2, runner2, { channel: false })
  const ack = JSON.parse(launchEscalateAsync(parent2, ctx2, {
    task: "t", provider: { name: "mockprov", model: "mock-model", apiKey: "k" }, tag: "mockprov:mock-model", effortNote: "",
  }))
  await parent2._asyncSubagents.get(String(ack.id)).promise
  assert.deepEqual(seen2, [false], "async 路缺通道零回归（既有 guard）")
})
