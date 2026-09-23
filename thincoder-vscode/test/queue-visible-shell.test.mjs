/**
 * queue-visible-shell.test.mjs — queue-visible 批（2026-09-24 · 台账 #249）· VSC 端壳面。
 *
 * 拆分理由（机械约束，非设计变更）：端壳面用例要驱动**真 `runAgent` + 真 provider 链路**
 * （mock-llm 本地 HTTP），而 webview 面用例必须注册 happy-dom（其全局 `fetch` 劫持会让
 * 本地 mock 报 CORS 拒）——两者不可同进程（既有约定：happy-dom 只住 webview 面档，
 * mock-llm 只住 integration 档）。故本档承载 T-V16-15 / T-V16-16（用例号与断言面零变）。
 * 设计权威：`docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则②⓪（步边界 pickup）+ `docs/core/
 * design/AGENT-LOOP-ASYNC-POOL.md` §6.8（适用面 = 用户回合；系统轮不传回调）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runAgent } from "../src/agent.mjs"
import { providerFor, mockLLM } from "./integration/helpers/mock-llm.mjs"
import { pickupQueuedAtStepBoundary } from "../src/extension/queued-pickup.mjs"
import { suspensionSession } from "../src/extension/suspension.mjs"
import * as vscQueued from "../src/extension/queued-merge.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"

/** 端壳 rig：真 `runAgent` + 脚本化 provider（临时工作区 / 临时配置——零网络出站）。 */
async function withShellRun(run) {
  const tmpd = mkdtempSync(join(tmpdir(), "tc-qv-shell-"))
  try {
    const cfg = join(tmpd, "config.json")
    writeFileSync(cfg, JSON.stringify({ providers: [] }) + "\n", "utf8")
    _setConfigPathForTest(cfg)
    const work = join(tmpd, "work")
    mkdirSync(join(work, ".git"), { recursive: true })
    await run({ work })
  } finally {
    _setConfigPathForTest(null)
    try { rmSync(tmpd, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

test("T-V16-15 正常（端壳步边界）：首响应工具调用 ⇒ 次响应终答；run 期中入队 2 条 ⇒ 下一步边界入 history（序 = 首响应之后）∧ 消费推 `busyQueued { pending:false, count, items, merged }`", async () => {
  await withShellRun(async ({ work }) => {
    const posted = []
    const queue = []
    const panel = {
      _busyQueued: queue,
      _susp: null,
      _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    }
    const filler = {
      name: "t_fill_queue",
      description: "test-only: 填队列（步边界 pickup 驱动面）",
      parameters: { type: "object", properties: {} },
      readonly: true,
      async execute() { queue.push({ text: "q1" }, { text: "q2" }); return "filled" },
    }
    const history = []
    const fullHistory = []
    const llm = await mockLLM([{ toolCall: { name: "t_fill_queue", arguments: {} } }, { content: "second" }, { content: "third" }])
    try {
      await runAgent(providerFor(llm), work, "go", {}, undefined, true, {
        depth: 0, history, fullHistory, extraTools: [filler],
        consumeQueuedInput: () => pickupQueuedAtStepBoundary(panel, { history, fullHistory }),
      })
    } finally {
      await llm.close()
    }
    const merged = vscQueued.formatMergedMessages(["q1", "q2"])
    const idxAssistant = history.findIndex((m) => m.role === "assistant" && Array.isArray(m.tool_calls))
    const idxMerged = history.findIndex((m) => m.role === "user" && m.content === merged)
    assert.ok(idxAssistant >= 0, "首响应带 toolCalls（步边界前驱）")
    assert.ok(idxMerged > idxAssistant, "合并 user 消息序 = 首响应之后（步边界生效——下一步可见）")
    assert.equal(queue.length, 0, "取批清队（下一步生效）")
    const snapshots = posted.filter((m) => m.type === "busyQueued")
    const consumption = snapshots.at(-1)
    assert.ok(consumption, "消费快照已推")
    assert.deepEqual(
      [consumption.pending, consumption.count, consumption.items, consumption.merged],
      [false, 0, [], merged],
      "快照 = 消费成形源（单条批清标保留 / 多条批就地合泡的判据面）",
    )
    const keys = [...new Set(snapshots.flatMap((m) => Object.keys(m)))].filter((k) => k !== "type").sort()
    assert.ok(keys.every((k) => ["pending", "count", "items", "text", "merged"].includes(k)), `快照字段 ⊆ 协议 §3.2 行 17 注册集（实到 ${keys.join(",")}）`)
    assert.ok(vscQueued.QUEUED_MAX_ITEMS === 8, "队容量 = 8（双端同名同值——本档只用常量面）")
  })
})

test("T-V16-16 负向锁（系统轮不参与步边界）：`autoTurn` 轮（`consumeQueuedInput` 未传——端侧分流 `autoTurn ? null : …`）⇒ history 零写入 ∧ 队列保持 2 条 ∧ 零消费推送", async () => {
  await withShellRun(async ({ work }) => {
    const posted = []
    const queue = [{ text: "q1" }, { text: "q2" }]
    const history = []
    const fullHistory = []
    const llm = await mockLLM([{ content: "digest-done" }])
    try {
      await runAgent(providerFor(llm), work, "", {}, undefined, true, {
        depth: 0, history, fullHistory, autoTurn: true, consumeQueuedInput: null, // 端侧分流（runTurnLoop 同式）
      })
    } finally {
      await llm.close()
    }
    const merged = vscQueued.formatMergedMessages(["q1", "q2"])
    assert.equal(history.some((m) => m.role === "user" && m.content === merged), false, "history 零写入（零合并消息）")
    assert.deepEqual(queue.map((q) => q.text), ["q1", "q2"], "队列保持 2 条（零消费——系统轮消费点 = driver 步骤 1）")
    assert.equal(posted.filter((m) => m.type === "busyQueued").length, 0, "零消费推送（气泡标记保持——快照零变）")
  })
})

test("T-V16-16b 分流机检（端壳接线）：`ro.consumeQueuedInput` 赋值为 `autoTurn` 三元（系统轮不传回调）", () => {
  const src = readFileSync(new URL("../src/extension/panel-turn-loop.mjs", import.meta.url), "utf8")
  const assigns = src.split("\n").filter((l) => /ro\.consumeQueuedInput\s*=/.test(l))
  assert.equal(assigns.length, 1, "单赋值点（钉死接线面）")
  assert.match(assigns[0], /autoTurn\s*\?\s*null\s*:/, "分流 = autoTurn ? null : …（系统轮不传——D-QV13）")
})

test("T-V16-13b 边界（host · 会话退出残余直发循环）：会话中止退出 ⇒ pendingInput 残余按计划取批直发 + 逐批推消费快照（镜像与标记面随实况收敛——无黏滞）", async () => {
  const posted = []
  const turns = []
  const queue = [{ text: "r1" }, { text: "r2" }, { text: "r3" }]
  const abort = new AbortController()
  const panel = {
    _abortController: abort, _turnControllers: [], _busyQueued: [], _susp: null,
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _publishTurnState() {}, _refreshStatus() {}, _saveLines() {},
  }
  abort.abort() // 会话中止（首行 while 条件即假 ⇒ 直入 finally 残余段）
  const history = []
  history._asyncSubagents = new Map(); history._asyncAdvisors = new Map(); history._pendingAsyncResults = []
  await suspensionSession(panel, {
    turnSlot: 1, distillSlot: null, cwd: process.cwd(),
    lines: { history, fullHistory: [], contextHistory: history },
    runTurn: async (item) => { turns.push(item.text) },
    pendingInput: queue,
  })
  assert.deepEqual(turns, [vscQueued.formatMergedMessages(["r1", "r2", "r3"])], "残余按合并计划一次取批直发（零丢失——多批 = 多回合）")
  assert.deepEqual(queue, [], "队列清空（零残留）")
  const snaps = posted.filter((m) => m.type === "busyQueued")
  const last = snaps.at(-1)
  assert.deepEqual([last.pending, last.count, last.items, last.merged], [false, 0, [], vscQueued.formatMergedMessages(["r1", "r2", "r3"])], "消费快照实况（镜像与标记面随之收敛——无黏滞）")
  assert.equal(panel._susp, null, "会话退出清 `_susp`")
})
