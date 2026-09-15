/**
 * scenario-03-subagent-lifecycle.test.mjs — 集成场景 ③「子代理生命周期」VSC 实例 + 种子 S1。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 本端调度器 / 异步池直驱；种子
 * S1 落此）；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.3 + §5.8。
 *
 * 三态：
 *   正常 —— spawn → 结算 → 报告送达父侧 + 池清 + id 单调递增；
 *   边界 —— 两 spawn 文件域交叠：第二个 queued（域冲突）→ 前者清后自动启动（不手串行）；
 *   错误 —— 运行中 cancel：池释放、条目终态干净、无孤儿。
 *   种子 S1（GitHub #6——生产反馈收编）——异步子代理结果不丢：结算结果必达（注入断言）；
 *   错误轮不误杀（digest 轮被停/子代理失败也不丢报告）。
 *
 * 手法（W13 改指 · 2026-09-15）：真核 `subagentTool`（镜像删旧——工具面 = `@thincoder/core/`
 * `agent-tools/subagent.mjs`）/ 真调度器与池 / 真 settle 记账 / 真核子代理执行（核
 * `runChildPipeline` → 核 `runAgent`）；子代理运行打 **mock provider**（`helpers/mock-llm.mjs`
 * ——本地 SSE、零外网、可 delay/fail 脚本化）——原端侧 `ctx.runAgent` 测试缝随镜像删旧退役。
 * 断言只写业务可观察结果（报告是否送达、池与队列状态、取消应答）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { injectAsyncResult } from "@thincoder/core/agent-tools/subagent.mjs"
import { finalizeAgentTurn } from "../../src/agent/run-stages.mjs"
import { suspensionSession } from "../../src/extension/suspension.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

const CWD = mkdtempSync(join(tmpdir(), "tc-integ-subagent-"))
process.on("exit", () => { try { rmSync(CWD, { recursive: true, force: true }) } catch { /* ignore */ } })

/** 条件轮询（替代固定墙钟等待——条件成立即返回，超时返回末判）——防高负载下 flake。 */
async function until(pred, ms = 8000) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return true
    if (Date.now() - t0 > ms) return pred()
    await new Promise((r) => setTimeout(r, 10))
  }
}

/** 父侧夹具（真形状：history 数组为跨 run 载体 + agent 字段**访问器绑定**到 history
 *  ——与 `src/agent.mjs` run 期绑定不变式同形（W13）；键形单源 = String(id)）。 */
const CARRIER_FIELDS = ["_asyncSubagents", "_asyncAdvisors", "_asyncTombstones", "_pendingAsyncResults", "_consultSessions", "_engDesignTokens", "_suspended", "_asyncQueue"]
function mkParent(llm) {
  const history = []
  history._asyncSubagents = new Map()
  history._asyncAdvisors = new Map()
  history._asyncTombstones = new Map()
  history._pendingAsyncResults = []
  history._asyncQueue = []
  const agent = {
    history, cwd: CWD,
    config: { agent: { engineering: false } },
    provider: providerFor(llm),
    tools: [],
    _subAgentCounter: 0,
  }
  for (const f of CARRIER_FIELDS) {
    Object.defineProperty(agent, f, { configurable: true, get() { return history[f] }, set(v) { history[f] = v } })
  }
  return { agent, history }
}

function ctxFor(agent, over = {}) {
  return {
    agent, cwd: CWD, depth: 0,
    callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
    getAuto: () => false,
    ...over,
  }
}

/** 回合尾收集（W13：端 run-stages 同形——settled 直注入 + 出池；核 `injectAsyncResult` 单源）。 */
async function collectSettled(agent, history) {
  await finalizeAgentTurn(agent, { signal: new AbortController().signal, history, fullHistory: [], cwd: CWD, depth: 0 })
}
const userMsgs = (history) => history.filter((m) => m?.role === "user")

test("③ 正常：spawn → 结算 → 报告送达父侧 + 池清；id 单调递增", async () => {
  const REP_A = "报告 A：现状已勘察——结论齐备，无遗留问题。".repeat(12)
  const REP_B = "报告 B：另路勘察——结论齐备，无遗留问题。".repeat(12)
  const llm = await mockLLM([{ content: REP_A }, { content: REP_B }])
  try {
    const { agent, history } = mkParent(llm)
    const ctx = ctxFor(agent)

    const ack1 = JSON.parse(await subagentTool.execute({ task: "survey A", role: "explore", async: true }, ctx))
    assert.equal(ack1.status, "running", "异步 spawn 立即启动")
    assert.equal(agent._asyncSubagents.has(String(ack1.id)), true, "条目在池（父侧可见）")
    await until(() => agent._asyncSubagents.get(String(ack1.id))?.done === true)
    assert.equal(agent._asyncSubagents.get(String(ack1.id))?.done, true, "子代理跑完（settle 落池 done）")

    const ack2 = JSON.parse(await subagentTool.execute({ task: "survey B", role: "explore", async: true }, ctx))
    assert.ok(Number(ack2.id) > Number(ack1.id), `id 单调递增（${ack1.id} → ${ack2.id}）`)
    await until(() => agent._asyncSubagents.get(String(ack2.id))?.done === true)

    await collectSettled(agent, history)
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "已结算条目随回合尾收集出池（池清路径）")
    const injected = userMsgs(history).filter((m) => m.content.includes("async subagent #"))
    assert.equal(injected.length, 2, "两条报告经注入送达父侧（不重不漏）")
    assert.match(injected[0].content, /报告 A：现状已勘察/, "报告正文逐字送达（首条 = 先结算者）")
  } finally {
    await llm.close()
  }
})

test("③ 边界：文件域交叠 → 第二个 queued（域冲突）→ 前者清后自动启动（不手串行）", async () => {
  const llm = await mockLLM([{ content: "先入者完成——交付齐备。", delay: 600 }, { content: "后入者完成——交付齐备。" }])
  try {
    const { agent } = mkParent(llm)
    const ctx = ctxFor(agent)

    const a = JSON.parse(await subagentTool.execute({ task: "改共享文件", role: "explore", async: true, files: ["shared.mjs"] }, ctx))
    assert.equal(a.status, "running", "先入者启动")
    const b = JSON.parse(await subagentTool.execute({ task: "也改共享文件", role: "explore", async: true, files: ["shared.mjs"] }, ctx))
    assert.equal(b.status, "queued", "后入者排队（不并行改同一文件）")
    assert.match(String(b.reason), /域冲突/, "排队原因可读（指出冲突文件）")
    assert.match(String(b.reason), /shared\.mjs/)
    assert.equal(agent._asyncSubagents.get(String(b.id))?.status, "queued", "后入者在池 queued 态")

    await until(() => agent._asyncSubagents.get(String(b.id))?.done === true)
    assert.equal(agent._asyncSubagents.get(String(a.id))?.done, true, "先入者结算")
    assert.equal(agent._asyncSubagents.get(String(b.id))?.done, true, "先入者清场 → 后入者自动启动跑完（不等人工）")
  } finally {
    await llm.close()
  }
})

test("③ 错误：运行中 cancel → 池释放、条目终态干净、无孤儿", async () => {
  const llm = await mockLLM([{ content: "长任务结果（不应到达）。", delay: 2500 }])
  try {
    const { agent } = mkParent(llm)
    const ctx = ctxFor(agent)
    const ack = JSON.parse(await subagentTool.execute({ task: "长任务", role: "explore", async: true }, ctx))
    assert.equal(agent._asyncSubagents.has(String(ack.id)), true, "条目在池（运行中）")

    const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: ack.id }, ctx))
    assert.equal(res.status, "cancelled", "取消应答明确")
    await until(() => !agent._asyncSubagents.has(String(ack.id)))
    assert.equal(agent._asyncSubagents.has(String(ack.id)), false, "取消条目出池（池释放——无孤儿）")
    // 终态干净：重复取消 = 明确报「已结束」，不再有半开条目
    const again = JSON.parse(await subagentTool.execute({ action: "cancel", id: ack.id }, ctx))
    assert.equal(again.status, "error", "重复取消不装成功（明示已终态）")
    assert.match(String(again.error), /unknown async subagent id|cannot be cancelled|already finished/)
  } finally {
    await llm.close()
  }
})

test("③ 种子 S1-a（GitHub #6）：挂起期结算 → 结果必达（digest 注入，不丢）", async () => {
  const llm = await mockLLM([{ content: "迟到的勘察报告：结果不丢。", delay: 500 }])
  try {
    const { agent, history } = mkParent(llm)
    const posted = []
    const panel = {
      _agent: agent,
      _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
      _abortController: new AbortController(),
      _turnControllers: [],
      _refreshStatus() {},
      _publishTurnState() {},
      _saveLines() {},
    }
    const ctx = ctxFor(agent)
    const ack = JSON.parse(await subagentTool.execute({ task: "后台勘察", role: "explore", async: true }, ctx))
    assert.equal(agent._asyncSubagents.get(String(ack.id))?.status, "running", "子代理运行中")

    // 挂起会话驱动（真实驱动）：子代理运行中 → 等 settle → 入 pending → digest 轮注入
    const entry = {
      lines: { history, fullHistory: [] }, cwd: CWD, slot: 1,
      runTurn: async () => {
        // 真 runAgent 的 run-start 注入语义（单注入点）：消费 pending 单容器（核统一注入器）
        const pend = history._pendingAsyncResults
        if (pend?.length) for (const e of pend.splice(0)) await injectAsyncResult({ history, _fullHistory: [] }, e)
      },
    }
    const session = suspensionSession(panel, entry)
    await until(() => history._suspended === true)
    assert.equal(history._suspended, true, "会话进入挂起态（后台池 live）")
    await session // 池空 + pending 清 → 自然退出

    const injected = history.filter((m) => m?.role === "user" && m.content.includes("迟到的勘察报告"))
    assert.equal(injected.length, 1, "挂起期结算的报告经消化轮注入（结果到达父侧）")
    assert.equal(history._pendingAsyncResults.length, 0, "pending 清空（消费即移除——不重复注入）")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "池清（会话自然退出）")
    assert.equal(history._suspended, false, "会话退出回空闲")
  } finally {
    await llm.close()
  }
})

test("③ 种子 S1-b（GitHub #6）：错误轮不误杀——digest 轮被停后结果仍在下轮送达；失败报告同样必达", async () => {
  const llm = await mockLLM([{ content: "成功报告：已完成——交付齐备，无遗留问题。".repeat(12), delay: 250 }, { fail: 400, failText: "子代理中途失败" }])
  try {
    const { agent, history } = mkParent(llm)
    const posted = []
    const panel = {
      _agent: agent,
      _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
      _abortController: new AbortController(),
      _turnControllers: [],
      _refreshStatus() {},
      _publishTurnState() {},
      _saveLines() {},
    }
    const ctx = ctxFor(agent)
    // 两条：一条成功、一条失败（错误报告走同一通道）
    const ok = JSON.parse(await subagentTool.execute({ task: "成功任务", role: "explore", async: true }, ctx))
    const bad = JSON.parse(await subagentTool.execute({ task: "失败任务", role: "explore", async: true }, ctx))
    assert.ok(ok.id && bad.id, "两条 spawn 入池")

    let rounds = 0
    const entry = {
      lines: { history, fullHistory: [] }, cwd: CWD, slot: 1,
      runTurn: async () => {
        rounds++
        if (rounds === 1) { const e = new Error("stopped"); e.name = "AbortError"; throw e } // 第一消化轮被停
        const pend = history._pendingAsyncResults
        if (pend?.length) for (const e of pend.splice(0)) await injectAsyncResult({ history, _fullHistory: [] }, e)
      },
    }
    const session = suspensionSession(panel, entry)
    await until(() => history._suspended === true)
    await session

    assert.ok(rounds >= 2, `被停的消化轮重入（实到 ${rounds} 轮）——会话不搁置`)
    const joined = userMsgs(history).map((m) => m.content).join("\n")
    assert.match(joined, /成功报告：已完成/, "成功结果必达")
    assert.match(joined, /子代理中途失败/, "失败报告同样必达（不因错误被吞）")
    assert.equal(history._pendingAsyncResults.length, 0, "pending 清空")
    assert.equal(agent._asyncSubagents?.size ?? 0, 0, "池清")
    assert.equal(history._suspended, false, "会话退出回空闲")
    assert.deepEqual(posted.filter((m) => m.type === "digest").map((m) => [m.status, m.ok ?? null]).slice(0, 2),
      [["start", null], ["end", false]], "首轮被停对用户可见（end ok:false——不留「仍在消化」假象）")
  } finally {
    await llm.close()
  }
})
