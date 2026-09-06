/**
 * wait-for.test.mjs — wait_for tool（TOOLS.md §16 —— 2026-09-06，CLI parity）。
 * 确定性由条件求值器注入缝保证（评审 #4）：setWaitForConditionSource 注入假条件源
 * （计数器/闭包翻转——非墙钟依赖），生产路径（evaluateWaitForCondition）用真实求值器。
 * 快层约束：单用例真实定时 ≤ ~300ms（slow-gate 拦截阈值 800ms 内留足余量）。
 */
import { describe, it, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import net from "node:net"
import {
  waitForTool,
  setWaitForConditionSource,
  parseWaitForCondition,
  evaluateWaitForCondition,
  WAIT_FOR_DEFAULT_TIMEOUT_MS,
  WAIT_FOR_MAX_TIMEOUT_MS,
  WAIT_FOR_DEFAULT_INTERVAL_MS,
  WAIT_FOR_MIN_INTERVAL_MS,
} from "../src/tools/wait_for.mjs"
import { builtinTools } from "../src/tools/index.mjs"

afterEach(() => setWaitForConditionSource(null))

const tmpdirFor = () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-wait-for-"))
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

describe("wait_for — T-W（TOOLS.md §16，CLI parity）", () => {
  it("T-W8: wait_for 注册进 builtinTools——readonly: true（双端一致面）", () => {
    const tool = builtinTools.find((t) => t.name === "wait_for")
    assert.ok(tool, "wait_for must be registered in builtinTools")
    assert.equal(tool.readonly, true, "wait_for is read-only (planMode 放行/免审批)")
    assert.equal(tool.parameters.required[0], "condition")
    assert.equal(WAIT_FOR_DEFAULT_TIMEOUT_MS, 30_000)
    assert.equal(WAIT_FOR_MAX_TIMEOUT_MS, 600_000)
    assert.equal(WAIT_FOR_DEFAULT_INTERVAL_MS, 1_000)
    assert.equal(WAIT_FOR_MIN_INTERVAL_MS, 100)
  })

  it("T-W1: 条件立即满足——立即返回（1 次检查，不轮询）", async () => {
    let calls = 0
    setWaitForConditionSource(() => { calls++; return true })
    const t0 = Date.now()
    const out = await waitForTool.execute({ condition: "whatever", timeout_ms: 5000 }, { cwd: process.cwd() })
    const elapsed = Date.now() - t0
    assert.match(out, /condition satisfied/)
    assert.match(out, /\(1 check\)/, "no polling when the condition already holds")
    assert.ok(elapsed < 500, `immediate return expected, took ${elapsed}ms`)
    assert.equal(calls, 1)
  })

  it("T-W2: 确定性 stub 轮询后满足（计数器 N 轮后翻转——非墙钟）", async () => {
    let polls = 0
    setWaitForConditionSource(() => { polls++; return polls >= 3 }) // 前两轮 false，第三轮 true
    const t0 = Date.now()
    const out = await waitForTool.execute({ condition: "stub flips", interval_ms: 100, timeout_ms: 5000 }, { cwd: process.cwd() })
    const elapsed = Date.now() - t0
    assert.match(out, /condition satisfied/)
    assert.match(out, /\(3 checks\)/, `expected 3 polls, got: ${out}`)
    assert.equal(polls, 3)
    assert.ok(elapsed >= 180, `two 100ms intervals must have elapsed (took ${elapsed}ms)`)
  })

  it("T-W3: 超时未满足——超上限返回（不空耗）", async () => {
    setWaitForConditionSource(() => false)
    const t0 = Date.now()
    const out = await waitForTool.execute({ condition: "never true", interval_ms: 100, timeout_ms: 250 }, { cwd: process.cwd() })
    const elapsed = Date.now() - t0
    assert.match(out, /timed out after 250ms/)
    assert.match(out, /never became true/)
    assert.ok(elapsed >= 240 && elapsed < 1500, `returns near the ceiling (took ${elapsed}ms)`)
  })

  it("T-W4: 轮询间隔生效——两次求值间隔 ≈ interval_ms（下限 100）", async () => {
    const times = []
    setWaitForConditionSource(() => { times.push(Date.now()); return times.length >= 2 })
    const out = await waitForTool.execute({ condition: "interval", interval_ms: 150, timeout_ms: 5000 }, { cwd: process.cwd() })
    assert.match(out, /condition satisfied/)
    assert.equal(times.length, 2)
    const gap = times[1] - times[0]
    assert.ok(gap >= 140, `polls must honor the interval (gap ${gap}ms)`)
  })

  it("T-W7: 取消/中断安全退出——abort 信号立即抛出，不等满超时", async () => {
    setWaitForConditionSource(() => false)
    const ac = new AbortController()
    setTimeout(() => ac.abort(), 60)
    const t0 = Date.now()
    await assert.rejects(
      () => waitForTool.execute({ condition: "never", interval_ms: 100, timeout_ms: 60000 }, { cwd: process.cwd(), signal: ac.signal }),
      /wait_for: interrupted by abort signal/,
    )
    assert.ok(Date.now() - t0 < 2000, "abort must exit well before the 60s timeout")
  })

  it("T-W3b: config.json agent.waitForTimeoutMs 覆盖默认 30s（超上限即返回）", async () => {
    setWaitForConditionSource(() => false)
    const out = await waitForTool.execute(
      { condition: "never", interval_ms: 100 },
      { cwd: process.cwd(), agent: { config: { agent: { waitForTimeoutMs: 150 } } } },
    )
    assert.match(out, /timed out after 150ms/)
  })

  it("T-W10: 未知条件显式报错——wait_for: unsupported condition", async () => {
    await assert.rejects(() => evaluateWaitForCondition("bogus condition", { cwd: process.cwd() }), /wait_for: unsupported condition "bogus condition"/)
    await assert.rejects(() => waitForTool.execute({ condition: "sleep 5" }, { cwd: process.cwd() }), /unsupported condition/)
    assert.deepEqual(parseWaitForCondition("subagent id:5 done"), { kind: "subagent", arg: "5" })
    assert.deepEqual(parseWaitForCondition("port open:3000"), { kind: "port", arg: 3000 })
    assert.throws(() => parseWaitForCondition("ping 127.0.0.1"), /unsupported condition/)
  })

  it("T-W5: agent 内部条件——subagent/advisor/consult 池状态求值为 true/false", async () => {
    // CLI 真实异步池键 = String(id)（subagent-run set(String(id))）；数值键形态
    // （VS Code）经双键查找同样命中（advisor #1 修复锁）。
    const pool = new Map([["7", { id: 7, role: "explore", status: "running", done: false }]])
    const agent = { _asyncSubagents: pool, _consultSessions: new Map() }
    assert.equal(await evaluateWaitForCondition("subagent id:7 done", { agent }), false)
    pool.get("7").status = "done"
    pool.get("7").done = true
    assert.equal(await evaluateWaitForCondition("subagent id:7 done", { agent }), true)
    // 数值键（VS Code 形态）双键查找命中
    pool.set(9, { id: 9, role: "explore", status: "running", done: false })
    assert.equal(await evaluateWaitForCondition("subagent id:9 done", { agent }), false)
    pool.get(9).status = "done"
    assert.equal(await evaluateWaitForCondition("subagent id:9 done", { agent }), true)
    assert.equal(await evaluateWaitForCondition("subagent id:999 done", { agent }), true, "absent id → vacuity done")
    pool.set("8", { id: 8, role: "advisor", status: "running", done: false })
    assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), false)
    pool.get("8").status = "done"
    assert.equal(await evaluateWaitForCondition("advisor settled", { agent }), true)
    const sessions = new Map([["1", { id: "1", pending: 2, stopped: false }]])
    assert.equal(await evaluateWaitForCondition("consult done", { agent: { ...agent, _consultSessions: sessions } }), false)
    sessions.get("1").pending = 0
    assert.equal(await evaluateWaitForCondition("consult done", { agent: { ...agent, _consultSessions: sessions } }), true)
    assert.equal(await evaluateWaitForCondition("consult done", { agent: { _consultSessions: new Map() } }), true)
  })

  it("T-W6: 外部资源条件——file exists / port open 真实求值为 true/false", async () => {
    const { dir, cleanup } = tmpdirFor()
    const server = net.createServer()
    try {
      writeFileSync(join(dir, "here.txt"), "x")
      assert.equal(await evaluateWaitForCondition("file exists:here.txt", { cwd: dir }), true)
      assert.equal(await evaluateWaitForCondition("file exists:missing.txt", { cwd: dir }), false)
      assert.equal(await evaluateWaitForCondition("port open:1", { cwd: dir }), false, "unused port → false")
      await new Promise((r) => server.listen(0, "127.0.0.1", r))
      const port = server.address().port
      const out = await waitForTool.execute({ condition: `port open:${port}`, timeout_ms: 3000 }, { cwd: dir })
      assert.match(out, /condition satisfied/)
    } finally {
      server.close()
      cleanup()
    }
  })

  it("T-W1b: 缺 condition → 显式错误（不静默等空串）", async () => {
    assert.match(await waitForTool.execute({}, { cwd: process.cwd() }), /condition is required/)
  })
})
