/**
 * suspension.test.mjs — 挂起 / 唤醒状态机用例（AGENT-LOOP.md §2.3 验收点 1 / 2；机制面 = AGENT-LOOP-ASYNC-POOL.md §6.8）。
 *
 * 纯 Node 驱动：假 carrier / 假 runTurn / 假 hooks——不加载端模块（T-C4 / N3）。
 * **载体双夹具**：CLI 形（agent 字段对象）与 VSC 形（history 字段对象——数组加附加属性）
 * 各跑同组断言——证明「池载体按端注入」成立（机制对载体零预设，除 §2.3 字段集）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  startSuspension, finishSuspension, poolLive, sweepSettledToPending, backgroundCounts,
} from "../agent/suspension.mjs"

/** 载体双夹具：CLI 形 = 普通对象；VSC 形 = 数组（附加属性不污染会话文件语义）。 */
const FIXTURES = {
  "CLI 形（agent 字段对象）": () => ({}),
  "VSC 形（history 字段对象）": () => ([]),
}

function makeCarrier(make) {
  const carrier = make()
  carrier._asyncSubagents = new Map()
  carrier._asyncAdvisors = new Map()
  carrier._pendingAsyncResults = []
  carrier._consultSessions = new Map()
  return carrier
}

const tick = () => new Promise((r) => setTimeout(r, 5))

/** 双夹具同组断言：六个状态机场景（验收点 1）+ 载体零预设。 */
for (const [label, make] of Object.entries(FIXTURES)) {
  test(`suspension 状态机（载体夹具：${label}）`, async () => {
    // ① 池空直退：无池 → idle，runTurn 零调用。
    {
      const carrier = makeCarrier(make)
      let calls = 0
      const h = startSuspension({ carrier, runTurn: async () => { calls++ } })
      const res = await h.done
      assert.equal(res.reason, "idle", "池空直退 = idle")
      assert.deepEqual(res.residualInput, [], "无输入 → 空 residualInput")
      assert.equal(calls, 0, "池空直退不跑回合")
      assert.equal(carrier._suspended, false, "退出复位 _suspended")
    }
    // ② pending 触发消化轮（auto-turn；consumed 回收）。
    {
      const carrier = makeCarrier(make)
      const e1 = { id: 1, role: "subagent" }
      carrier._pendingAsyncResults.push(e1)
      const digests = []
      const reclaims = []
      const h = startSuspension({
        carrier,
        runTurn: async (text, opts) => {
          digests.push({ text, opts })
          carrier._pendingAsyncResults.shift() // 首行注入 = 消费 pending
        },
        hooks: { onDigest: (p) => digests.push({ phase: p }), reclaim: (c) => reclaims.push(c) },
      })
      const res = await h.done
      assert.equal(res.reason, "idle")
      assert.equal(digests.filter((d) => d.opts?.autoTurn).length, 1, "pending 非空 → 一次消化轮")
      assert.deepEqual(digests.filter((d) => d.phase).map((d) => d.phase), ["start", "end"], "消化轮边界 start/end")
      assert.equal(digests.find((d) => d.opts?.autoTurn).text, "", "消化轮 text = 空串")
      assert.equal(reclaims.length, 1, "回收一次")
      assert.deepEqual(reclaims[0], [e1], "consumed = 本回合消费的条目")
    }
    // ③ 用户输入优先（D-S5）：输入与 pending 同轮次待处理 → 先用户回合、后消化轮。
    {
      const carrier = makeCarrier(make)
      carrier._asyncSubagents.set("s1", { id: "s1", status: "running" })
      const order = []
      const h = startSuspension({
        carrier,
        runTurn: async (text, opts) => {
          if (text === "" && opts?.autoTurn) { order.push("digest"); carrier._pendingAsyncResults.shift() }
          else { order.push(`user:${text}`); carrier._asyncSubagents.clear() }
        },
      })
      await tick() // 进入纯等待
      carrier._pendingAsyncResults.push({ id: 2, role: "subagent" }) // settle 停靠
      h.pushInput("hi") // 用户输入同轮次落槽
      h.wake()
      const res = await h.done
      assert.deepEqual(order, ["user:hi", "digest"], "用户输入优先于消化轮")
      assert.equal(res.reason, "idle")
    }
    // ④ abort 清池不注入：池清空、pending 清空、注入器零调用、回执 aborted。
    {
      const carrier = makeCarrier(make)
      carrier._asyncSubagents.set("a", { id: "a", status: "running" })
      const ctrl = new AbortController()
      const injected = []
      const h = startSuspension({
        carrier, abortSignal: ctrl.signal,
        runTurn: async () => { throw new Error("不应开回合") },
        injectResidual: async (e) => injected.push(e),
      })
      await tick() // 进入纯等待
      carrier._pendingAsyncResults.push({ id: 3, role: "subagent" }) // 中止窗口内落下的停靠
      ctrl.abort()
      const res = await h.done
      assert.equal(res.reason, "aborted")
      assert.equal(carrier._asyncSubagents.size, 0, "abort 清子代理池")
      assert.equal(carrier._pendingAsyncResults.length, 0, "abort 清 pending")
      assert.deepEqual(injected, [], "abort 不注入")
      assert.equal(carrier._suspended, false)
    }
    // ④b abort 落在一次 runTurn 内（停止以 AbortError 抛出——循环顶检查不会再执行）：
    // 退出清场仍必须走 abort 分支（不注入）——信号在 finally 合并判定。
    {
      const carrier = makeCarrier(make)
      carrier._asyncSubagents.set("s1", { id: "s1", status: "running" })
      const ctrl = new AbortController()
      const injected = []
      const h = startSuspension({
        carrier, abortSignal: ctrl.signal,
        runTurn: async () => { ctrl.abort(); throw Object.assign(new Error("Aborted"), { name: "AbortError" }) },
        injectResidual: async (e) => injected.push(e),
      })
      await tick() // 进入纯等待
      h.pushInput("go")
      h.wake()
      await assert.rejects(h.done, (e) => e.name === "AbortError", "回合内停止以异常传播（两端同式）")
      assert.deepEqual(injected, [], "abort（信号已中止）不注入残余")
      assert.equal(carrier._suspended, false)
    }
    // ⑤ idle 残余注入（退出清场单点直测——驱动 finally 与单测共用 finishSuspension）。
    {
      const carrier = makeCarrier(make)
      const e9 = { id: 9, role: "advisor" }
      carrier._pendingAsyncResults.push(e9)
      const injected = []
      await finishSuspension(carrier, { aborted: false, injectResidual: async (e) => injected.push(e) })
      assert.deepEqual(injected, [e9], "idle 残余逐条直注入")
      assert.equal(carrier._pendingAsyncResults.length, 0, "残余注入后清空")
      // abort 变体：清而不注入。
      const carrier2 = makeCarrier(make)
      carrier2._pendingAsyncResults.push({ id: 10 })
      let called = 0
      await finishSuspension(carrier2, { aborted: true, injectResidual: async () => { called++ } })
      assert.equal(carrier2._pendingAsyncResults.length, 0)
      assert.equal(called, 0, "abort 清场不注入")
    }
    // ⑥ 唤醒栓双路：settle（池 waiter）与 wake（宿主输入）各唤醒一次纯等待。
    {
      const carrier = makeCarrier(make)
      carrier._asyncSubagents.set("s1", { id: "s1", status: "running" })
      let turns = 0
      const h = startSuspension({ carrier, runTurn: async () => { turns++; carrier._asyncSubagents.clear() } })
      await tick()
      assert.equal(carrier._asyncWaiters?.length, 1, "纯等待期注册 settle waiter")
      carrier._asyncSubagents.clear() // 模拟 settle 完成出池
      carrier._asyncWaiters.splice(0).forEach((w) => w())
      const res = await h.done
      assert.equal(res.reason, "idle", "settle 路唤醒后池空退出")
      assert.equal(turns, 0)

      const carrier2 = makeCarrier(make)
      carrier2._asyncSubagents.set("s2", { id: "s2", status: "running" })
      const h2 = startSuspension({
        carrier: carrier2,
        runTurn: async (text) => { assert.equal(text, "go"); carrier2._asyncSubagents.clear() },
      })
      await tick()
      h2.pushInput("go")
      h2.wake()
      const res2 = await h2.done
      assert.equal(res2.reason, "idle", "wake 路唤醒后自然退出")
    }
  })
}

// ── 上行通道唤醒面（批 2026-09-19-upstream-channel-availability · 设计 §6.27.12.9 T23 / T24）──────
// 第 2 步判据 = `pending 非空 || upstreamWaiting(carrier)`：未 drain 的 ask 是第二开轮源
// （只补唤醒不够——唤醒后只重新求值、不直接开轮，§6.27.12.3）。双夹具各跑同组断言。
test("T23 正常·核驱动开轮（假 carrier）：ask ⇒ runTurn(\"\", { autoTurn: true, upstreamTurn: true }) 恰 1 次", async () => {
  for (const [label, make] of Object.entries(FIXTURES)) {
    const carrier = makeCarrier(make)
    carrier._asyncSubagents.set("s1", { id: "s1", status: "running" })
    carrier._childUpstream = [{ seq: 1, from: "eng-coder#57", kind: "ask", message: "is premise X live?" }]
    const runs = []
    const digests = []
    const h = startSuspension({
      carrier,
      runTurn: async (text, opts) => {
        runs.push({ text, opts })
        carrier._childUpstream = []     // 模拟 runAgent 回合头 drain（消费即清——谓词随之转假）
        carrier._asyncSubagents.clear() // 模拟子代理 settle 出池
      },
      hooks: { onDigest: (phase) => digests.push(phase) },
    })
    const res = await h.done
    assert.equal(runs.length, 1, `[${label}] 未 drain 的 ask ⇒ 恰 1 轮（谓词开轮）`)
    assert.equal(runs[0].text, "", `[${label}] auto 轮 text = 空串（同消化轮）`)
    assert.deepEqual(
      runs[0].opts, { autoTurn: true, upstreamTurn: true },
      `[${label}] 旗标贯通（§6.27.12.9 T23：res.upstreamTurn === true）`,
    )
    assert.deepEqual(digests, ["start", "end"], `[${label}] 轮边界 hook 同既有（onDigest start/end）`)
    assert.equal(res.reason, "idle", `[${label}] 轮后池空自然退出`)
    assert.deepEqual(res, { reason: "idle", residualInput: [] }, `[${label}] 退出回执形状零改（不含新旗标）`)
  }
})

test("T24 边界·核驱动 note 不开轮：零 runTurn；note 不阻止池空退出（idle）；留队等下拐点", async () => {
  for (const [label, make] of Object.entries(FIXTURES)) {
    const carrier = makeCarrier(make)
    carrier._asyncSubagents.set("s1", { id: "s1", status: "running" })
    carrier._childUpstream = [{ seq: 1, from: "eng-coder#57", kind: "note", message: "premise X broke" }]
    let runs = 0
    const h = startSuspension({ carrier, runTurn: async () => { runs++ } })
    await tick() // 进入纯等待：note 落入判据但不为真 ⇒ 不开轮
    assert.equal(runs, 0, `[${label}] note 不开轮（谓词假）`)
    assert.equal(carrier._asyncWaiters?.length, 1, `[${label}] 等待栓照常注册（W1 面零改）`)
    carrier._asyncSubagents.clear() // 模拟 settle 出池
    carrier._asyncWaiters.splice(0).forEach((w) => w()) // settle 尾唤醒（wakeAsyncWaiters 同形）
    const res = await h.done
    assert.equal(res.reason, "idle", `[${label}] 池空即退出`)
    assert.equal(runs, 0, `[${label}] 唤醒后仍零轮（note 无时效义务）`)
    assert.equal(carrier._childUpstream.length, 1, `[${label}] note 留队等下拐点（F13——今日语义零变）`)
  }
})

test("sweepSettledToPending：已 settle 条目入 pending，幂等（_inPending 防重复）", () => {
  const carrier = makeCarrier(FIXTURES["CLI 形（agent 字段对象）"])
  const e = { id: 7, done: true }
  carrier._asyncSubagents.set(7, e)
  sweepSettledToPending(carrier)
  assert.equal(carrier._asyncSubagents.size, 0)
  assert.deepEqual(carrier._pendingAsyncResults, [e])
  assert.equal(e._inPending, true)
  sweepSettledToPending(carrier) // 幂等
  assert.deepEqual(carrier._pendingAsyncResults, [e])
})

test("poolLive / backgroundCounts：池 / pending / consult 三源合并计数", () => {
  const carrier = makeCarrier(FIXTURES["VSC 形（history 字段对象）"])
  assert.equal(poolLive(carrier), false)
  carrier._asyncAdvisors.set("a1", { id: "a1", status: "queued" })
  assert.equal(poolLive(carrier), true)
  carrier._consultSessions.set("c1", { stopped: false, pending: 2 })
  const counts = backgroundCounts(carrier)
  assert.deepEqual(counts, { running: 1, queued: 1, pending: 0, done: 0 })
  carrier._pendingAsyncResults.push({ id: 1 })
  assert.equal(backgroundCounts(carrier).pending, 1)
})

test("核内零产品路径：suspension.mjs 无产品树名（契约 5 / 10）", () => {
  const src = readFileSync(fileURLToPath(new URL("../agent/suspension.mjs", import.meta.url)), "utf8")
  for (const banned of ["thincoder-cli", "thincoder-vscode", "thincoder-core"]) {
    assert.equal(src.includes(banned), false, `suspension.mjs 不应含 ${banned}`)
  }
})

test("streamOutputAllowed：三态门（#78 并入）纯函数直驱", async () => {
  const { streamOutputAllowed } = await import("../agent.mjs")
  assert.equal(streamOutputAllowed(0, null, false), true, "depth 0 恒通")
  assert.equal(streamOutputAllowed(1, "consult", false), true, "consult 子代理豁免")
  assert.equal(streamOutputAllowed(1, "coder", false), false, "其余子代理默认不流式")
  assert.equal(streamOutputAllowed(1, "coder", true), true, "streamOutput 显式选择进入")
})
