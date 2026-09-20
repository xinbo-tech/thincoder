/**
 * digest-end-line.test.mjs — X9（2026-09-20 端差·显示面消差批 批 3）用例：CLI 消化轮可见
 * 收尾行（`已消化 N 份后台报告（Xs）` 的英文字面 / 中断形态）——对位 VSC `webview/chat.js:356-402`
 * 的 digest end 面。口径：① 计数 = **起跑数**（`pend0`——与 VSC `suspension.mjs:302/:314` 同源）；
 * ② 文案单源 = 核 i18n `digest.done` / `digest.aborted`（本档断言以核容器值正则化为据，
 * 不复制字面常量）；③ 中断/失败 ⇒ aborted 形态。
 * 手法：`suspensionSession` 驱动会话 + `ctx.runAgent` 注入（无网络/无 TTY）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { suspensionSession } from "../src/tui/suspension-drive.mjs"
import { t } from "@thincoder/core/i18n.mjs"

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
/** 核容器值 → 整行正则（秒数位 = `\d+.\d`——`toFixed(1)` 口径；VSC 同式）。 */
const lineRe = (key, vars) => new RegExp(`^${esc(t(key, vars, "en")).replace("@S@", "\\d+\\.\\d")}$`)
const DONE1 = lineRe("digest.done", { n: "1", seconds: "@S@" })
const DONE2 = lineRe("digest.done", { n: "2", seconds: "@S@" })
const ABORTED = lineRe("digest.aborted", { seconds: "@S@" })

/** 挂起会话 rig：`_pendingAsyncResults` = 待消化条目；桩按轮消费（模拟核回合头注入消费）。 */
function rig({ entries = 1, abortFirst = false, auto = false, upstream = false } = {}) {
  const lines = []
  const agent = {
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _asyncQueue: [],
    _sessionAbort: new AbortController(), _sessionAbortAll: [], _suspended: false,
    title: "t", history: [], autoApprove: auto,
    _pendingAsyncResults: Array.from({ length: entries }, (_, i) => ({ role: "subagent", id: i + 1 })),
  }
  if (upstream) agent._childUpstream = [{ kind: "ask", from: "coder#1", message: "in-flight ask" }]
  const state = {
    lines: [], subTasks: {}, tasks: [], queue: [], pendingInput: [], suspended: false, processing: false,
    status: "Ready", _suspAborted: false, _turnControllers: [], _frozenSubKeys: new Set(), expandedBlocks: new Set(),
  }
  let rounds = 0
  const ctx = {
    agent,
    state,
    render() {},
    pushLine: (text) => lines.push(String(text)),
    pushLabel() {},
    ensureAssistantLabel() {},
    scheduleRender() {},
    askPermission: null, askBatchPermission: null, askQuestion: null,
    handleSlash: null,
    saveSession() {},
    runAgent: async () => {
      rounds++
      if (abortFirst && rounds === 1) {
        // 用户 Ctrl+C 停当前回合（挂起态首按语义：controller.abort({interrupt:true})）+ 核抛 AbortError
        state.controller.abort({ interrupt: true })
        const e = new Error("aborted")
        e.name = "AbortError"
        throw e
      }
      agent._pendingAsyncResults.shift() // 核回合头消费（注入完成——判据清）
      agent._childUpstream = [] // ask drain（消费即清——谓词关）
    },
  }
  return { agent, state, ctx, lines, rounds: () => rounds }
}

test("X9 收尾行（正常）：两轮消化 ⇒ 各一条 done 行，计数 = 起跑数（首轮 2 / 次轮 1）", async () => {
  const r = rig({ entries: 2 })
  await suspensionSession(r.ctx)
  const done = r.lines.filter((l) => DONE1.test(l) || DONE2.test(l))
  assert.equal(r.rounds(), 2, "两轮消化（pending 逐轮消费）")
  assert.equal(done.length, 2, `两轮各一条收尾行（实读：${JSON.stringify(r.lines)}）`)
  assert.ok(DONE2.test(done[0]), `首轮行 = 起跑数 2（起跑口径——消费口径会得 1；实读：${done[0]}）`)
  assert.ok(DONE1.test(done[1]), `次轮行 = 起跑数 1（实读：${done[1]}）`)
})

test("X9 收尾行（中断）：首轮被停 ⇒ aborted 字面（核 digest.aborted）；续跑轮 ⇒ done 字面零回归", async () => {
  const r = rig({ entries: 1, abortFirst: true })
  await suspensionSession(r.ctx)
  assert.equal(r.rounds(), 2, "停轮后既有循环续跑语义零改（pending 未消费 ⇒ 再开一轮）")
  const aborted = r.lines.filter((l) => ABORTED.test(l))
  assert.equal(aborted.length, 1, `中断轮恰一条 aborted 行（实读：${JSON.stringify(r.lines)}）`)
  assert.ok(r.lines.some((l) => DONE1.test(l)), "续跑轮出 done 行")
  const iAborted = r.lines.findIndex((l) => ABORTED.test(l))
  const iDone = r.lines.findIndex((l) => DONE1.test(l))
  assert.ok(iAborted >= 0 && iDone > iAborted, "中断轮行在续跑轮 done 行之前（轮序——两形不串）")
})

test("X9 起跑标签三档字面零回归：manual / manual+ask（第三档）/ auto", async () => {
  const manual = rig({ entries: 1 })
  await suspensionSession(manual.ctx)
  assert.ok(manual.lines[0].includes("digesting finished subagent reports"), `manual 档标签（实读：${manual.lines[0]}）`)

  const ask = rig({ entries: 1, upstream: true })
  await suspensionSession(ask.ctx)
  assert.ok(ask.lines[0].includes("answering a subagent's in-flight message"), `manual+ask 档标签（实读：${ask.lines[0]}）`)

  const auto = rig({ entries: 1, auto: true })
  await suspensionSession(auto.ctx)
  assert.ok(auto.lines[0].includes("continuing background work"), `auto 档标签（实读：${auto.lines[0]}）`)
})
