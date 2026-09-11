/**
 * subagent-memory-bounds.test.mjs — TUI-OOM-ROOTCAUSE 批 组 2（A2——AGENT-LOOP.md §23）
 * 用例表 1:1：T-SM1–T-SM4（捕获截断 / 额下零改 / 子代理窗口 / 释放点）。
 *
 * 形态：快层 unit——零网络、零真实子代理运行（runner 替身令牌流 + 真 runWithContinue 闭包）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { runWithContinue, CAPTURE_CAP_OPTS } from "../src/agent/spawn-child.mjs"
import { releaseSettledEntry } from "../src/agent-tools/async-settle.mjs"
import { executeObserveAction } from "../src/agent-tools/subagent-actions.mjs"
import { RECORD_WINDOW_MESSAGES } from "../src/session-store.mjs"
import { pushReal } from "../src/context.mjs"
import { createAgent } from "../src/agent.mjs"

const ROOT = fileURLToPath(new URL("../src/", import.meta.url))
const src = (p) => readFileSync(join(ROOT, p), "utf8")

const noContinue = { askContinue: async () => false, onDeclined: () => "partial" }

test("T-SM1 捕获截断：模拟令牌流累计 ~10MB → 捕获 ≤ hard；头 16K/尾 48K 保真；标记含省略数", async () => {
  const child = {}
  const headToken = "A".repeat(20_000)
  const bulk = "B".repeat(50_000)
  const tailToken = "C".repeat(5_000)
  const runner = async (c, input, cbs) => {
    cbs.onToken(headToken)
    for (let i = 0; i < 200; i++) cbs.onToken(bulk) // 10MB
    cbs.onToken(tailToken)
    return "done"
  }
  const out = await runWithContinue(runner, child, "task", {}, {}, noContinue)
  assert.equal(out, "done")
  assert.ok(child._capturedOutput.length <= CAPTURE_CAP_OPTS.hard, `捕获长度 ${child._capturedOutput.length} ≤ ${CAPTURE_CAP_OPTS.hard}`)
  // 头保真（截断保留最前 16K）、尾保真（最后 5K 原样）
  assert.equal(child._capturedOutput.startsWith("A".repeat(CAPTURE_CAP_OPTS.head)), true)
  assert.equal(child._capturedOutput.endsWith(tailToken), true)
  // 标记 + 真实省略数
  const m = child._capturedOutput.match(/… \[captured output truncated: (\d+) chars omitted\] …/)
  assert.ok(m, "截断标记在场")
  assert.ok(Number(m[1]) > 0, "省略数为真实计数")
})

test("T-SM2 捕获额下零改：累计 8KB → 逐字等于输入拼接（无标记——负断言）", async () => {
  const child = {}
  const tokens = Array.from({ length: 80 }, (_, i) => `chunk-${i}-` + "y".repeat(90))
  const runner = async (c, input, cbs) => {
    for (const t of tokens) cbs.onToken(t)
    return "ok"
  }
  await runWithContinue(runner, child, "task", {}, {}, noContinue)
  assert.equal(child._capturedOutput, tokens.join(""))
  assert.equal(child._capturedOutput.includes("truncated"), false)
  assert.ok(child._capturedOutput.length < CAPTURE_CAP_OPTS.hard)
})

test("T-SM3 子代理窗口：pushReal 300 条 → _fullHistory 恰 200（最新）；observe recentTurns 正常", () => {
  const child = createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" },
    tools: [], config: { agent: {} }, cwd: process.cwd(), memory: null,
  })
  // 子代理创建路径（subagent-spawn.mjs）置位窗口——此处直接同源置位
  child._historyWindow = RECORD_WINDOW_MESSAGES
  for (let i = 0; i < 100; i++) {
    pushReal(child, { role: "user", content: `u${i}` })
    pushReal(child, { role: "assistant", tool_calls: [{ id: `c${i}`, type: "function", function: { name: "read", arguments: "{}" } }] })
    pushReal(child, { role: "assistant", content: `a${i}` })
  }
  assert.equal(child._fullHistory.length, 200, "子代理人读线驻留 ≤ 窗口")
  assert.equal(child._fullHistory.at(-1).content, "a99", "保最新（最旧被驱逐）")

  // observe 真消费面：最近 5 回合摘要（N2——不灌父）
  const parent = {
    cwd: process.cwd(),
    _asyncSubagents: new Map([["1", { id: 1, role: "coder", status: "running", childAgent: child, turn: 3, maxTurns: 20, _touchedFiles: [] }]]),
  }
  const out = JSON.parse(executeObserveAction({ id: "1", recent: 5 }, { agent: parent, depth: 0 }))
  assert.equal(out.status, "running")
  assert.equal(out.recentTurns.length, 5)
  assert.equal(out.recentTurns[0], "a99", "newest-first")
})

test("T-SM4b 窗口覆盖（代码评审 #2 回归）：四处子代理创建点均置 _historyWindow", () => {
  for (const f of ["agent-tools/subagent-spawn.mjs", "agent-tools/escalate-async.mjs", "agent-tools/consult.mjs", "agent-tools/subagent-actions.mjs"]) {
    const s = src(f)
    assert.match(s, /_historyWindow = RECORD_WINDOW_MESSAGES/, `${f}：置位子代理窗口`)
    assert.match(s, /from "\.\.\/session-store.mjs"|from "\.\/\.\.\/session-store.mjs"/, `${f}：常量单源（session-store）`)
  }
})

test("T-SM4 释放点：注入完成后 childAgent/report 置空（幂等）；三消费点调用在位", () => {
  // 直接语义：置空两字段、其余不动、幂等
  const entry = { id: 1, status: "done", done: true, childAgent: { fake: true }, report: "report-body", role: "coder" }
  releaseSettledEntry(entry)
  assert.equal(entry.childAgent, null)
  assert.equal(entry.report, null)
  assert.equal(entry.status, "done")
  assert.equal(entry.role, "coder")
  assert.doesNotThrow(() => releaseSettledEntry(entry))
  assert.doesNotThrow(() => releaseSettledEntry(null))

  // 三消费点（AC-O3 grep——释放调用在位）
  assert.match(src("agent/run-stages.mjs"), /releaseSettledEntry\(e\)/, "①回合尾收集")
  assert.match(src("agent.mjs"), /releaseSettledEntry\(e\)/, "②run 起始 pending 注入")
  assert.match(src("tui/suspension-drive.mjs"), /releaseSettledEntry\(e\)/, "③挂起残差注入")
  // settle 时刻不释放（表 2 候选 2 否决——池内未消化窗口语义零变：async-settle 只定义不调用）
  const settleSrc = src("agent-tools/async-settle.mjs")
  assert.equal(settleSrc.split("releaseSettledEntry").length - 1, 1, "async-settle 仅定义（不在 settle 路径调用）")
})
