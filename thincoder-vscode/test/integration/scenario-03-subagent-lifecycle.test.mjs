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
 * 手法：真 `subagentTool` / 真调度器与池 / 真 settle 记账；子代理执行经测试缝 `ctx.runAgent`
 * （escalate-async / batch-doc-gate 同形先例）——桩子代理在 run 边界受控（零网络、零真 LLM）。
 * 断言只写业务可观察结果（报告是否送达、池与队列状态、取消应答）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { subagentTool } from "../../src/agent-tools/subagent.mjs"
import { collectSettledAsync } from "../../src/agent-tools/subagent-async.mjs"
import { injectPendingAsync } from "../../src/agent-tools/async-settle.mjs"
import { suspensionSession } from "../../src/extension/suspension.mjs"

const CWD = mkdtempSync(join(tmpdir(), "tc-integ-subagent-"))
process.on("exit", () => { try { rmSync(CWD, { recursive: true, force: true }) } catch { /* ignore */ } })

/** 条件轮询（替代固定墙钟等待——条件成立即返回，超时返回末判）——防高负载下 flake。 */
async function until(pred, ms = 1000) {
  const t0 = Date.now()
  for (;;) {
    if (pred()) return true
    if (Date.now() - t0 > ms) return pred()
    await new Promise((r) => setTimeout(r, 5))
  }
}

/** 受控子代理执行体：每次 run 挂起一个可结算记录（finish/fail 手动驱动；abort 即拒）。 */
function childHarness() {
  const runs = []
  const runAgent = (provider, cwd, input, callbacks, signal) => new Promise((resolve, reject) => {
    const rec = { input, callbacks, signal, aborted: false, resolve, reject }
    runs.push(rec)
    const bail = () => {
      rec.aborted = true
      const e = new Error("Aborted"); e.name = "AbortError"
      reject(e)
    }
    if (signal?.aborted) { bail(); return } // 启动前已中止（cancel 先到）
    signal?.addEventListener?.("abort", bail, { once: true })
  })
  return { runs, runAgent }
}

/** 父侧夹具（真形状：history 数组兼挂池 + agent 字段 alias 同一 Map）。 */
function mkParent() {
  const history = []
  history._asyncSubagents = new Map()
  history._asyncAdvisors = new Map()
  const agent = {
    history, cwd: CWD, config: { agent: { engineering: false } },
    _asyncSubagents: history._asyncSubagents, _asyncAdvisors: history._asyncAdvisors,
    _subIdCounter: 0,
  }
  return { agent, history }
}

function ctxFor(agent, harness, over = {}) {
  return {
    agent, cwd: CWD, depth: 0,
    callbacks: { onSubagent: () => {}, onToolPanel: () => {}, onAsyncSettled: null },
    getAuto: () => false,
    runAgent: harness.runAgent,
    ...over,
  }
}

test("③ 正常：spawn → 结算 → 报告送达父侧 + 池清；id 单调递增", async () => {
  const { agent, history } = mkParent()
  const harness = childHarness()
  const ctx = ctxFor(agent, harness)

  const ack1 = JSON.parse(await subagentTool.execute({ task: "survey A", role: "explore", async: true }, ctx))
  assert.equal(ack1.status, "running", "异步 spawn 立即启动")
  assert.equal(agent._asyncSubagents.has(ack1.id), true, "条目在池（父侧可见）")
  await until(() => harness.runs.length >= 1) // spawn 启动是异步的（fire-and-forget）——等子代理实际开跑

  harness.runs[0].resolve("报告 A：现状已勘察")
  await agent._asyncSubagents.get(ack1.id).settled

  const ack2 = JSON.parse(await subagentTool.execute({ task: "survey B", role: "explore", async: true }, ctx))
  assert.ok(ack2.id > ack1.id, `id 单调递增（${ack1.id} → ${ack2.id}）`)
  await until(() => harness.runs.length >= 2)
  harness.runs[1].resolve("报告 B：另路勘察")

  await collectSettledAsync(agent, { history, fullHistory: [], cwd: CWD })
  assert.equal(agent._asyncSubagents.size, 1, "已结算条目随回合尾收集出池（池清路径）")
  const injected = history.filter((m) => m?.role === "user" && m.content.includes("async subagent #"))
  assert.equal(injected.length, 1, "报告经注入送达父侧（恰一条——不重不漏）")
  assert.match(injected[0].content, /报告 A：现状已勘察/, "报告正文逐字送达")

  await agent._asyncSubagents.get(ack2.id).settled
  await collectSettledAsync(agent, { history, fullHistory: [], cwd: CWD })
  assert.equal(agent._asyncSubagents.size, 0, "两条都消费后池空")
  assert.equal(history.filter((m) => m?.role === "user" && m.content.includes("async subagent #")).length, 2, "两条报告各送达一次")
})

test("③ 边界：文件域交叠 → 第二个 queued（域冲突）→ 前者清后自动启动（不手串行）", async () => {
  const { agent } = mkParent()
  const harness = childHarness()
  const ctx = ctxFor(agent, harness)

  const a = JSON.parse(await subagentTool.execute({ task: "改共享文件", role: "explore", async: true, files: ["shared.mjs"] }, ctx))
  assert.equal(a.status, "running", "先入者启动")
  await until(() => harness.runs.length === 1)
  const b = JSON.parse(await subagentTool.execute({ task: "也改共享文件", role: "explore", async: true, files: ["shared.mjs"] }, ctx))
  assert.equal(b.status, "queued", "后入者排队（不并行改同一文件）")
  assert.match(String(b.reason), /域冲突/, "排队原因可读（指出冲突文件）")
  assert.match(String(b.reason), /shared\.mjs/)
  assert.equal(harness.runs.length, 1, "只有先入者在跑")

  harness.runs[0].resolve("先入者完成")
  await agent._asyncSubagents.get(a.id).settled
  await until(() => harness.runs.length === 2) // 后入者实际开跑（启动→runChild→runAgent 跨微任务）
  assert.equal(agent._asyncSubagents.get(b.id)?.status, "running", "先入者清场 → 后入者自动启动（不等人工）")
  assert.equal(harness.runs.length, 2, "第二个子代理已实际开跑")
  harness.runs[1].resolve("后入者完成")
  await agent._asyncSubagents.get(b.id).settled
})

test("③ 错误：运行中 cancel → 池释放、条目终态干净、子代理确被中止", async () => {
  const { agent } = mkParent()
  const harness = childHarness()
  const ctx = ctxFor(agent, harness)
  const ack = JSON.parse(await subagentTool.execute({ task: "长任务", role: "explore", async: true }, ctx))
  await until(() => harness.runs.length === 1) // 子代理已实际开跑再取消

  const res = JSON.parse(await subagentTool.execute({ action: "cancel", id: ack.id }, ctx))
  assert.equal(res.status, "cancelled", "取消应答明确")
  await until(() => harness.runs[0].aborted === true) // 中止送达子代理执行体
  assert.equal(harness.runs[0].aborted, true, "子代理执行体收到中止（无孤儿）")
  assert.equal(agent._asyncSubagents.has(ack.id), false, "取消条目出池（池释放）")
  const entry = { id: ack.id } // 终态干净：重复取消 = 明确报「已结束」，不再有半开条目
  const again = JSON.parse(await subagentTool.execute({ action: "cancel", id: entry.id }, ctx))
  assert.equal(again.status, "error", "重复取消不装成功（明示已终态）")
  assert.match(String(again.error), /unknown async subagent id|cannot be cancelled|already finished/)
})

test("③ 种子 S1-a（GitHub #6）：挂起期结算 → 结果必达（digest 注入，不丢）", async () => {
  const { agent, history } = mkParent()
  const harness = childHarness()
  const posted = []
  const panel = {
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _abortController: new AbortController(),
    _turnControllers: [],
    _refreshStatus() {},
    _publishTurnState() {},
    _saveLines() {},
  }
  const ctx = ctxFor(agent, harness, { callbacks: { onSubagent: () => {}, onToolPanel: () => {}, onAsyncSettled: () => panel._suspWake?.() } })
  const ack = JSON.parse(await subagentTool.execute({ task: "后台勘察", role: "explore", async: true }, ctx))
  await until(() => harness.runs.length === 1)

  // 挂起会话驱动（真实驱动）：子代理运行中 → 等 settle → 入 pending → digest 轮注入
  const entry = {
    lines: { history, fullHistory: [] }, cwd: CWD, slot: 1,
    runTurn: async () => {
      // 真 runAgent 的 run-start 注入语义（单注入点）：消费 pending 单容器
      const pend = history._pendingAsyncResults
      if (pend?.length) for (const e of pend.splice(0)) await injectPendingAsync(e, { history, fullHistory: [], cwd: CWD })
    },
  }
  const session = suspensionSession(panel, entry)
  await until(() => history._suspended === true)
  assert.equal(history._suspended, true, "会话进入挂起态（后台池 live）")

  harness.runs[0].resolve("迟到的勘察报告：结果不丢")
  await session // 池空 + pending 清 → 自然退出

  const injected = history.filter((m) => m?.role === "user" && m.content.includes("迟到的勘察报告"))
  assert.equal(injected.length, 1, "挂起期结算的报告经消化轮注入（结果到达父侧）")
  assert.equal(history._pendingAsyncResults.length, 0, "pending 清空（消费即移除——不重复注入）")
  assert.equal(agent._asyncSubagents.size, 0, "池清（会话自然退出）")
  assert.equal(history._suspended, false, "会话退出回空闲")
})

test("③ 种子 S1-b（GitHub #6）：错误轮不误杀——digest 轮被停后结果仍在下轮送达；失败报告同样必达", async () => {
  const { agent, history } = mkParent()
  const harness = childHarness()
  const posted = []
  const panel = {
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _abortController: new AbortController(),
    _turnControllers: [],
    _refreshStatus() {},
    _publishTurnState() {},
    _saveLines() {},
  }
  const ctx = ctxFor(agent, harness, { callbacks: { onSubagent: () => {}, onToolPanel: () => {}, onAsyncSettled: () => panel._suspWake?.() } })
  // 两条：一条成功、一条失败（错误报告走同一通道）
  const ok = JSON.parse(await subagentTool.execute({ task: "成功任务", role: "explore", async: true }, ctx))
  const bad = JSON.parse(await subagentTool.execute({ task: "失败任务", role: "explore", async: true }, ctx))
  await until(() => harness.runs.length === 2)

  let rounds = 0
  const entry = {
    lines: { history, fullHistory: [] }, cwd: CWD, slot: 1,
    runTurn: async () => {
      rounds++
      if (rounds === 1) { const e = new Error("stopped"); e.name = "AbortError"; throw e } // 第一消化轮被停
      const pend = history._pendingAsyncResults
      if (pend?.length) for (const e of pend.splice(0)) await injectPendingAsync(e, { history, fullHistory: [], cwd: CWD })
    },
  }
  const session = suspensionSession(panel, entry)
  await until(() => history._suspended === true)
  harness.runs[0].resolve("成功报告：已完成")
  harness.runs[1].reject(new Error("子代理中途失败")) // runChild 收尾为 error 报告（同一通道）
  await session

  assert.ok(rounds >= 2, `被停的消化轮重入（实到 ${rounds} 轮）——会话不搁置`)
  const joined = history.filter((m) => m?.role === "user").map((m) => m.content).join("\n")
  assert.match(joined, /成功报告：已完成/, "成功结果必达")
  assert.match(joined, /子代理中途失败/, "失败报告同样必达（不因错误被吞）")
  assert.equal(history._pendingAsyncResults.length, 0, "pending 清空")
  assert.equal(agent._asyncSubagents.size, 0, "池清")
  assert.equal(history._suspended, false, "会话退出回空闲")
  assert.deepEqual(posted.filter((m) => m.type === "digest").map((m) => [m.status, m.ok ?? null]).slice(0, 2),
    [["start", null], ["end", false]], "首轮被停对用户可见（end ok:false——不留「仍在消化」假象）")
})
